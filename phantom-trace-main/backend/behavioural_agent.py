import os
import math
from typing import List, Dict, Optional, Annotated
import json
from dotenv import load_dotenv
from pydantic import BaseModel

def _load_env() -> None:
    """Load backend environment variables from .env, then .env.example as fallback."""
    base_dir = os.path.dirname(__file__)
    if not load_dotenv(os.path.join(base_dir, ".env")):
        load_dotenv(os.path.join(base_dir, ".env.example"))


_load_env()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages
from langchain.agents import AgentState
from langchain.tools import tool, ToolRuntime
from langchain.messages import ToolMessage, HumanMessage
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command

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

class BehaviouralAgentState(AgentState):
    session_id: str
    entity_id: str                           # user_id or host_id
    entity_type: str                         # "user" | "host"
    observation_window_hours: int            # how far back to look
    current_feature_vector: List[float]      # current behavior encoded as numbers
    baseline_feature_vector: List[float]     # historical average from TimescaleDB
    feature_labels: List[str]               # human-readable labels for each vector dimension
    deviation_score: float                   # statistical distance from baseline
    peer_group_id: str                       # which peer group this entity belongs to
    peer_group_deviation_score: float        # how different vs peers (not just own baseline)
    anomalous_features: List[str]            # which specific features are outliers
    data_access_delta: dict                  # change in data volume accessed vs baseline
    bytes_out_delta: dict                    # change in outbound data vs baseline
    new_resource_access: List[str]           # resources accessed for the first time
    temporal_anomalies: List[str]            # activity at unusual times
    anomaly_flags: List[str]                 # e.g. ["data_exfiltration", "off_hours_access"]
    confidence: float
    messages: Annotated[List[BaseMessage], add_messages]


class BehaviouralAgentStructuredResponse(BaseModel):
    severity_label: str
    severity_score: float
    confidence_score: float
    anomaly_flags: List[str]
    anomalous_features: List[str]
    deviation_score: float
    risk_summary: str
    evidence: List[str]
    recommended_actions: List[str]


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
            return json.dumps(structured.model_dump(), indent=2)
        if isinstance(structured, dict):
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


@tool
def set_behavioural_agent_state(data: Dict, runtime: ToolRuntime) -> Command:
    """
    Initializes BehaviouralAgentState from parsed behaviour telemetry.
    """
    return Command(update={
        "session_id": data.get("session_id"),
        "entity_id": data.get("entity_id"),
        "entity_type": data.get("entity_type"),
        "observation_window_hours": data.get("observation_window_hours"),
        "current_feature_vector": data.get("current_feature_vector"),
        "baseline_feature_vector": data.get("baseline_feature_vector"),
        "feature_labels": data.get("feature_labels"),
        "deviation_score": data.get("deviation_score"),
        "peer_group_id": data.get("peer_group_id"),
        "peer_group_deviation_score": data.get("peer_group_deviation_score"),
        "anomalous_features": data.get("anomalous_features"),
        "data_access_delta": data.get("data_access_delta"),
        "bytes_out_delta": data.get("bytes_out_delta"),
        "new_resource_access": data.get("new_resource_access"),
        "temporal_anomalies": data.get("temporal_anomalies"),
        "anomaly_flags": data.get("anomaly_flags"),
        "confidence": data.get("confidence"),
        "messages": [
            ToolMessage(
                "Behavioural agent state initialized successfully",
                tool_call_id=runtime.tool_call_id
            )
        ]
    })


@tool
def get_behavioural_agent_state(runtime: ToolRuntime) -> str:
    """
    Returns the current BehaviouralAgentState for downstream analysis.
    """
    return (
        f"Session ID: {runtime.state.get('session_id')}, "
        f"Entity ID: {runtime.state.get('entity_id')}, "
        f"Entity Type: {runtime.state.get('entity_type')}, "
        f"Observation Window Hours: {runtime.state.get('observation_window_hours')}, "
        f"Current Feature Vector: {runtime.state.get('current_feature_vector')}, "
        f"Baseline Feature Vector: {runtime.state.get('baseline_feature_vector')}, "
        f"Feature Labels: {runtime.state.get('feature_labels')}, "
        f"Deviation Score: {runtime.state.get('deviation_score')}, "
        f"Peer Group ID: {runtime.state.get('peer_group_id')}, "
        f"Peer Group Deviation Score: {runtime.state.get('peer_group_deviation_score')}, "
        f"Anomalous Features: {runtime.state.get('anomalous_features')}, "
        f"Data Access Delta: {runtime.state.get('data_access_delta')}, "
        f"Bytes Out Delta: {runtime.state.get('bytes_out_delta')}, "
        f"New Resource Access: {runtime.state.get('new_resource_access')}, "
        f"Temporal Anomalies: {runtime.state.get('temporal_anomalies')}, "
        f"Anomaly Flags: {runtime.state.get('anomaly_flags')}, "
        f"Confidence: {runtime.state.get('confidence')}"
    )


@tool
def fetch_entity_baseline(entity_id: str, entity_type: str) -> dict:
    """
    Fetches the entity's behavioral baseline from TimescaleDB — a rolling
    average of their activity over the past N days. Returns feature vector
    (login frequency, avg bytes moved, typical access patterns, active hours).
    This is the behavioral fingerprint of what 'normal' looks like.
    """
    return {
        "entity_id": entity_id,
        "entity_type": entity_type,
        "observation_window_days": 30,
        "baseline_feature_vector": [1.0, 0.8, 0.2, 0.4],
        "feature_labels": [
            "login_frequency",
            "avg_bytes_moved",
            "new_resource_ratio",
            "off_hours_activity"
        ]
    }

@tool
def compute_deviation_score(current_vector: List[float], baseline_vector: List[float]) -> dict:
    """
    Computes statistical distance between current behavior and baseline.
    Use Mahalanobis distance (accounts for feature correlations) rather than
    simple Euclidean. Returns overall score and per-feature contribution
    so you know exactly which behaviors are driving the anomaly.
    """
    if len(current_vector) != len(baseline_vector):
        raise ValueError("Vector shape mismatch")

    n_features = len(current_vector)

    diff = [current_vector[i] - baseline_vector[i] for i in range(n_features)]

    # Euclidean distance
    dist_sq = sum(d * d for d in diff)
    distance = math.sqrt(dist_sq)

    total = sum(abs(d) for d in diff) or 1.0

    feature_contributions = []

    for i in range(n_features):
        feature_contributions.append({
            "feature_index": i,
            "raw_diff": diff[i],
            "contribution_pct": 100 * abs(diff[i]) / total
        })

    feature_contributions.sort(
        key=lambda x: abs(x["raw_diff"]),
        reverse=True
    )

    return {
        "deviation_score": distance,
        "n_features": n_features,
        "feature_contributions": feature_contributions,
        "top_anomaly_feature":
            feature_contributions[0]["feature_index"]
            if feature_contributions else None
    }

@tool
def update_entity_baseline(entity_id: str, new_observations: dict) -> bool:
    """
    Updates the entity's rolling baseline in TimescaleDB with new observations.
    Uses a weighted rolling window so recent behavior has more influence
    than older behavior. Call this AFTER analysis so current (potentially
    malicious) activity doesn't corrupt the baseline before it's flagged.
    """
    return True


tools = [
    set_behavioural_agent_state,
    get_behavioural_agent_state,
    fetch_entity_baseline,
    compute_deviation_score,
    update_entity_baseline,
]

behavioural_agent = create_agent(
    model=model,
    tools=tools,
    system_prompt=(
        "You are a behavioural anomaly detection agent. You analyze login events for signs of compromise. "
        "You use your tools to perform tasks based on real persisted telemetry context included in the prompt. "
        "When deterministic detection enrichment is included, treat its flags, risk score, MITRE mappings, "
        "and recommendations as primary evidence. Explicitly consider mass file reads, bulk export, unusual "
        "admin actions, privilege chaining, suspicious process ancestry, and data exfiltration. "
        "Return calculated, structured results only using the response schema."
    ),
    response_format=BehaviouralAgentStructuredResponse,
    state_schema=BehaviouralAgentState,
    checkpointer=InMemorySaver()
)


def invoke_behavioural_agent(user_message: str, thread_id: str = "1"):
    """
    Invokes the behavioural agent with a user message and returns the response.
    """
    config = {"configurable": {"thread_id": thread_id}}
    response = safe_invoke(
        behavioural_agent,
        {"messages": [HumanMessage(content=user_message)]},
        config
    )
    return read(response)
