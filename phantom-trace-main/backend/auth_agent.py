def safe_invoke(agent, input_dict, config):
    input_dict["messages"] = [
        m for m in input_dict["messages"]
        if m.content and m.content.strip()
    ]
    return agent.invoke(input_dict, config)

def read(response):
    if isinstance(response, dict) and response.get("structured_response") is not None:
        structured = response["structured_response"]
        if hasattr(structured, "model_dump"):
            import json
            return json.dumps(structured.model_dump(), indent=2)
        if isinstance(structured, dict):
            import json
            return json.dumps(structured, indent=2)
        return str(structured)

    def _content_to_text(content) -> str:
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            text_parts = []
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text":
                    txt = part.get("text", "")
                    if txt:
                        text_parts.append(txt)
            return "\n".join(text_parts).strip()
        return str(content).strip()

    if isinstance(response, dict) and "messages" in response:
        messages = response["messages"]

        for message in reversed(messages):
            if not hasattr(message, "content"):
                continue
            if getattr(message, "type", "") in ("ai", "assistant"):
                text = _content_to_text(message.content)
                if text:
                    return text

        for message in reversed(messages):
            if not hasattr(message, "content"):
                continue
            text = _content_to_text(message.content)
            if text:
                return text

    return str(response)


import time
import os
from dotenv import load_dotenv

def _load_env() -> None:
    """Load backend environment variables from .env, then .env.example as fallback."""
    base_dir = os.path.dirname(__file__)
    if not load_dotenv(os.path.join(base_dir, ".env")):
        load_dotenv(os.path.join(base_dir, ".env.example"))


_load_env()

from langchain_google_genai import ChatGoogleGenerativeAI

def _build_model() -> ChatGoogleGenerativeAI:
    api_key = os.getenv("GOOGLE_API_KEY", "").strip()
    if not api_key:
        raise ValueError("GOOGLE_API_KEY is not set. Add it to backend/.env or backend/.env.example")

    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=1.0,
        google_api_key=api_key,
    )


model = _build_model()

from typing import List, Dict, Optional
from pydantic import BaseModel
from langchain_core.messages import BaseMessage

from langgraph.graph import add_messages
from typing import Annotated
from langchain.agents import AgentState
class AuthAgentState(AgentState):
    user_id: str
    source_ip: str
    auth_method: str
    auth_result: str
    target_resource: Optional[str]
    mfa_bypassed: bool
    login_timestamp: str
    user_baseline: dict
    failed_attempt_count: int
    unique_users_from_ip: int
    privilege_level: str
    post_login_actions: List[str]
    anomaly_flags: List[str]
    confidence: float
    messages: Annotated[List[BaseMessage], add_messages]  # <-- ADD THIS


class AuthAgentStructuredResponse(BaseModel):
    severity_label: str
    severity_score: float
    confidence_score: float
    anomaly_flags: List[str]
    attack_classification: str
    risk_summary: str
    evidence: List[str]
    recommended_actions: List[str]


def fetchDB(source_ip: str, user_id: str, time_window: int) -> dict:
    """Mock DB fetch used when no database is connected."""
    return {
        "source_ip": source_ip,
        "user_id": user_id,
        "time_window": time_window,
        "successful_login": True,
        "failed_attempts": 23,
        "distinct_accounts_targeted": 6,
    }

from langchain.tools import tool,ToolRuntime
from langgraph.types import Command
from langchain.messages import ToolMessage
@tool
def set_auth_agent_state(
    user_id: str,
    source_ip: str,
    auth_method: str,
    auth_result: str,
    target_resource: Optional[str],
    mfa_bypassed: bool,
    login_timestamp: str,
    runtime: ToolRuntime
) -> Command:
    """
    Initializes AuthAgentState after parsing authentication logs if the user reveals it.
    If any data is missing, update the state for whose data is provided and mention to the user that they have to provide the missing data.
    """

    return Command(update={
        "user_id": user_id,
        "source_ip": source_ip,
        "auth_method": auth_method,
        "auth_result": auth_result,
        "target_resource": target_resource,
        "mfa_bypassed": mfa_bypassed,
        "login_timestamp": login_timestamp,
        # default enrichment values
        "user_baseline": {},
        "failed_attempt_count": 0,
        "unique_users_from_ip": 0,
        "privilege_level": "standard",
        "post_login_actions": [],
        "anomaly_flags": [],
        "confidence": 0.0,

        "messages": [
            ToolMessage(
                "Auth agent state initialized successfully",
                tool_call_id=runtime.tool_call_id
            )
        ]
    })


@tool
def get_auth_agent_state(runtime: ToolRuntime) -> str:
    """
    Returns the current AuthAgentState so that agent which require the state information can access it by using this tool.
    """

    return (
        f"User: {runtime.state['user_id']}, IP: {runtime.state['source_ip']}, "
        f"Method: {runtime.state['auth_method']}, Result: {runtime.state['auth_result']}, "
        f"MFA bypassed: {runtime.state['mfa_bypassed']}, "
        f"Failed attempts: {runtime.state['failed_attempt_count']}, "
        f"Unique users from IP: {runtime.state['unique_users_from_ip']}, "
        f"Privilege: {runtime.state['privilege_level']}, "
        f"Flags: {runtime.state['anomaly_flags']}, Confidence: {runtime.state['confidence']}"
    )


from datetime import datetime
import requests
@tool
def check_time_and_location_anamoly(user_id: str, login_timestamp: str, source_ip: str) -> dict:
  """This tool returns the date and time at which login occured using login_timestamp and fetches the location of the device using the ip address so that the network anamoly agent can detect an impossible travel anamoly."""
  date = datetime.fromisoformat(login_timestamp)

  response = requests.get(f"https://ipinfo.io/{source_ip}/json")
  data = response.json()
  location = {
        "city": data.get("city"),
        "country": data.get("country"),
        "coords": data.get("loc")
    }

  return date, location

@tool
def check_mfa_anamoly(user_id:str,auth_method:str,mfa_bypassed:bool) -> dict:
  "Checks if there is a multifactor authentication anamoly taking place"
  if auth_method == "mfa" and mfa_bypassed:
    return {"mfa_anamoly":True}
  else:
    return {"mfa_anamoly":False}

@tool
def detect_brute_force_attack(source_ip: str, user_id: str, time_window: int) -> dict:
    """
    Detects a brute force attack and alerts the agent about the
    current state of the attack and whether a breach has occurred.
    """
    attack_data = fetchDB(source_ip=source_ip, user_id=user_id, time_window=time_window)

    is_logged_in = attack_data["successful_login"]
    failed_attempts = attack_data["failed_attempts"]
    distinct_accounts = attack_data["distinct_accounts_targeted"]

    # Classify attack type
    if distinct_accounts > 1:
        attack_type = "credential_spray"
    else:
        attack_type = "targeted_brute_force"

    if is_logged_in:
        message = f"{user_id} has successfully logged in after a {attack_type} — possible breach."
    else:
        message = f"{user_id} is actively performing a {attack_type} with {failed_attempts} failed attempts."

    return {
        "is_logged_in": is_logged_in,
        "attack_type": attack_type,
        "failed_attempts": failed_attempts,
        "distinct_accounts_targeted": distinct_accounts,
        "message": message,
    }

@tool
def check_privilige_escalation(user_id:str,session_actions:str):
  """Analyzes the login behaviour of a user against privilige level like trying to hit admin endpoints."""
  pass

from langchain.messages import HumanMessage
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver

auth_agent = create_agent(
    model=model,
    tools = [
        set_auth_agent_state,
        get_auth_agent_state,
        detect_brute_force_attack,
        check_time_and_location_anamoly,
        check_mfa_anamoly,
    ],
    system_prompt=(
        "You are an authentication anomaly detection agent. You analyze login events for signs of compromise. "
        "You use your tools to perform tasks based on real persisted telemetry context included in the prompt. "
        "When deterministic detection enrichment is included, treat its flags, risk score, MITRE mappings, "
        "and recommendations as primary evidence. Explicitly consider brute force, password reset abuse, "
        "token replay, impossible MFA sequences, dormant account reactivation, and service-account misuse. "
        "Return calculated, structured results only using the response schema."
    ),
    response_format=AuthAgentStructuredResponse,
    state_schema=AuthAgentState,
    checkpointer=InMemorySaver()
)


def invoke_auth_agent(user_message: str, thread_id: str = "1"):
    """
    Invokes the authentication agent with a user message and returns the response.
    """
    config = {"configurable": {"thread_id": thread_id}}
    response = safe_invoke(
        auth_agent,
        {"messages": [HumanMessage(content=user_message)]},
        config
    )
    return read(response)

