import os
from dotenv import load_dotenv

def _load_env() -> None:
    """Load backend environment variables from .env, then .env.example as fallback."""
    base_dir = os.path.dirname(__file__)
    if not load_dotenv(os.path.join(base_dir, ".env")):
        load_dotenv(os.path.join(base_dir, ".env.example"))


_load_env()

def safe_invoke(agent, input_dict, config):
    input_dict["messages"] = [
        m for m in input_dict["messages"]
        if m.content and m.content.strip()
    ]
    return agent.invoke(input_dict, config)

def read(response):
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

from langchain.messages import HumanMessage
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver

orchestrator_agent = create_agent(
    model=model,
    tools=[],
    system_prompt=(
        "You are an orchestrator agent. Based on the given prompt, choose which agents to invoke and return "
        "a python list of agent names. Agents available: network_agent, behavioural_agent, auth_agent, "
        "explainer_agent. Keep selection minimal to save cost and prioritize agents that match the latest "
        "persisted telemetry context included in the prompt."
    ),
    checkpointer=InMemorySaver()
)

def invoke_orchestrator_agent(user_message: str, thread_id: str = "1") -> str:
    """
    Invoke the orchestrator agent with a user message.
    
    Args:
        user_message: The user's input message
        thread_id: Thread ID for session management
    
    Returns:
        The orchestrator agent's response as a string
    """
    config = {"configurable": {"thread_id": thread_id}}
    
    response = safe_invoke(orchestrator_agent, {
        "messages": [HumanMessage(content=user_message)]
    }, config)
    
    return read(response)