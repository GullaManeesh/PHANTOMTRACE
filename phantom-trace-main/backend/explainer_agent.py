import os
from typing import Dict, List, Annotated
import json

from dotenv import load_dotenv
from pydantic import BaseModel

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, SystemMessage
from langchain.agents import AgentState, create_agent
from langchain.tools import tool, ToolRuntime
from langchain.messages import ToolMessage, HumanMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import add_messages
from langgraph.types import Command


def _load_env() -> None:
    """Load backend environment variables from .env, then .env.example as fallback."""
    base_dir = os.path.dirname(__file__)
    if not load_dotenv(os.path.join(base_dir, ".env")):
        load_dotenv(os.path.join(base_dir, ".env.example"))


_load_env()


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


class AgentFinding(BaseModel):
    finding_id: str
    description: str


class ExplainerAgentState(AgentState):
    all_findings: Dict[str, AgentFinding]
    composite_severity: float
    recommended_actions: List[str]
    confidence_breakdown: Dict[str, float]
    messages: Annotated[List[BaseMessage], add_messages]


class ExplainerAgentStructuredResponse(BaseModel):
    severity_label: str
    composite_severity: float
    confidence_score: float
    top_findings: List[str]
    confidence_breakdown: Dict[str, float]
    recommended_actions: List[str]
    executive_summary: str


def safe_invoke(agent, input_dict, config):
    input_dict["messages"] = [
        m for m in input_dict["messages"]
        if m.content and m.content.strip()
    ]
    return agent.invoke(input_dict, config)


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


def read(response):
    if isinstance(response, dict) and response.get("structured_response") is not None:
        structured = response["structured_response"]
        if hasattr(structured, "model_dump"):
            return json.dumps(structured.model_dump(), indent=2)
        if isinstance(structured, dict):
            return json.dumps(structured, indent=2)
        return str(structured)

    if hasattr(response, "content"):
        text = _content_to_text(response.content)
        if text:
            return text

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


def invoke_explainer_chat(user_message: str, context: str = "") -> str:
    """Generate a plain-language response grounded in the supplied context."""
    system_prompt = (
        "You are PhantomTrace's conversational security assistant. "
        "Answer in natural, human language. "
        "Do not return JSON, YAML, or structured sections unless the user explicitly asks for them. "
        "Use the provided telemetry context to ground your answer, and be concise but helpful."
    )

    prompt_parts = []
    if context.strip():
        prompt_parts.append(f"Context:\n{context.strip()}")
    prompt_parts.append(f"User request:\n{user_message.strip()}")

    response = model.invoke(
        [
            SystemMessage(content=system_prompt),
            HumanMessage(content="\n\n".join(prompt_parts)),
        ]
    )
    return read(response)


@tool
def set_explainer_agent_state(data: Dict, runtime: ToolRuntime) -> Command:
    """
    Initializes ExplainerAgentState from aggregated findings.
    """
    return Command(
        update={
            "all_findings": data.get("all_findings"),
            "composite_severity": data.get("composite_severity"),
            "recommended_actions": data.get("recommended_actions"),
            "confidence_breakdown": data.get("confidence_breakdown"),
            "messages": [
                ToolMessage(
                    "Explainer agent state initialized successfully",
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


@tool
def get_explainer_agent_state(runtime: ToolRuntime) -> str:
    """
    Returns the current ExplainerAgentState for summarization.
    """
    return (
        f"All Findings: {runtime.state.get('all_findings')}, "
        f"Composite Severity: {runtime.state.get('composite_severity')}, "
        f"Recommended Actions: {runtime.state.get('recommended_actions')}, "
        f"Confidence Breakdown: {runtime.state.get('confidence_breakdown')}"
    )


@tool
def recommend_remediation(attack_type: str) -> str:
    """Recommend mitigation actions based on the attack type."""
    remediation_map = {
        "sql_injection": [
            "Sanitize and validate all user inputs.",
            "Use parameterized queries or prepared statements.",
            "Apply least-privilege DB permissions.",
            "Enable and tune a Web Application Firewall.",
            "Patch vulnerable endpoints immediately.",
        ],
        "xss": [
            "Encode outputs rendered in HTML contexts.",
            "Implement Content Security Policy headers.",
            "Sanitize user-supplied HTML.",
            "Set HttpOnly and Secure flags on cookies.",
            "Validate and escape input server-side.",
        ],
        "ddos": [
            "Enable rate limiting and traffic throttling.",
            "Use CDN or DDoS mitigation services.",
            "Add firewall filtering for malicious sources.",
            "Scale capacity for resilience.",
            "Coordinate upstream filtering with ISP.",
        ],
        "brute_force": [
            "Lock accounts after repeated failed attempts.",
            "Apply CAPTCHA on login routes.",
            "Enforce multi-factor authentication.",
            "Alert on repeated failed logins.",
            "Block suspicious source IPs.",
        ],
        "phishing": [
            "Reset credentials for impacted users.",
            "Enforce MFA across affected tenants.",
            "Block and report phishing domains.",
            "Run user phishing awareness refresh.",
            "Harden email protections with DMARC, DKIM, SPF.",
        ],
        "ransomware": [
            "Isolate affected systems immediately.",
            "Engage incident response and legal process.",
            "Restore from verified clean backups.",
            "Patch initial compromise vector.",
            "Perform full endpoint and identity review.",
        ],
        "mitm": [
            "Enforce TLS on all traffic paths.",
            "Use certificate pinning where possible.",
            "Require VPN on untrusted networks.",
            "Enable HTTP Strict Transport Security.",
            "Inspect traffic for downgrade anomalies.",
        ],
    }

    normalized = attack_type.lower().strip().replace(" ", "_").replace("-", "_")
    if normalized not in remediation_map:
        return (
            f"No specific remediation found for attack type: '{attack_type}'.\n"
            "General recommendations:\n"
            "1. Isolate affected systems.\n"
            "2. Review logs for root-cause analysis.\n"
            "3. Patch known vulnerabilities and rotate exposed secrets.\n"
            "4. Follow the incident response runbook.\n"
            "5. Notify stakeholders and required compliance channels."
        )

    lines = "\n".join(f"{idx}. {step}" for idx, step in enumerate(remediation_map[normalized], start=1))
    return f"Remediation steps for '{attack_type}':\n\n{lines}"


explainer_agent = create_agent(
    model=model,
    tools=[
        set_explainer_agent_state,
        get_explainer_agent_state,
        recommend_remediation,
    ],
    system_prompt=(
        "You are an explainer agent. "
        "You compile findings from all specialist agents into a clear summary with severity, "
        "confidence rationale, and prioritized remediation recommendations. Use persisted findings and enabled "
        "flags included in the prompt context as your primary inputs. When deterministic detection enrichment "
        "or correlated attack chains are included, use them as primary evidence for severity, confidence, "
        "MITRE mapping, and recommended actions. Return calculated, structured results only "
        "using the response schema."
    ),
    response_format=ExplainerAgentStructuredResponse,
    state_schema=ExplainerAgentState,
    checkpointer=InMemorySaver(),
)


def invoke_explainer_agent(user_message: str, thread_id: str = "1") -> str:
    """Invokes the explainer agent with a user message and returns the response."""
    config = {"configurable": {"thread_id": thread_id}}
    response = safe_invoke(
        explainer_agent,
        {"messages": [HumanMessage(content=user_message)]},
        config,
    )
    return read(response)
