import os
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import Any, Dict, List, Literal, Optional
from datetime import datetime, timedelta, timezone
import ipaddress
import json
import uvicorn
from network_agent import invoke_network_agent_async
from auth_agent import invoke_auth_agent
from behavioural_agent import invoke_behavioural_agent
from orchestrator_agent import invoke_orchestrator_agent
from explainer_agent import invoke_explainer_agent, invoke_explainer_chat
from detection_engine import (
    calculate_risk,
    correlate_attack_chains,
    detect_event_rules,
    enrich_event_payload,
    mitre_for_flags,
    recommendations_for_flags,
)
from auth_service import (
    AuthError,
    create_user_api_key,
    delete_user_api_key,
    get_authenticated_user,
    get_user_api_keys,
    get_me_payload,
    login_user,
    register_user,
)
from agent_result_cache import (
    infer_flags_from_agent_response,
    parse_agent_response,
    store_threat_event as sqlite_store_threat_event,
    get_latest_threat_event as sqlite_get_latest_threat_event,
    get_latest_threat_event_for_agent as sqlite_get_latest_threat_event_for_agent,
)
from mongodb_db import (
    build_explainer_context,
    get_latest_threat_event,
    get_latest_threat_event_for_agent,
    health_check,
    initialize_collections,
    store_agent_flags,
    store_agent_result,
    store_threat_event,
)

# Initialize MongoDB
USE_SQLITE_CACHE = False
try:
    # Initialize MongoDB collections
    initialize_collections()
    print("✓ MongoDB initialized successfully")
except Exception as e:
    print(f"⚠ Warning: MongoDB initialization error: {e}")
    print("⚠ Continuing with SQLite fallback...")
    USE_SQLITE_CACHE = True


def _store_threat_event(*, thread_id: str, log_source: str, log_type: str, event_payload: Dict[str, Any], owner_user_id: Optional[str] = None) -> Dict[str, Any]:
    enriched_payload = enrich_event_payload(
        {
            "thread_id": thread_id,
            "log_source": log_source,
            "log_type": log_type,
            "event_payload": event_payload,
        }
    )
    if USE_SQLITE_CACHE:
        return sqlite_store_threat_event(thread_id=thread_id, log_source=log_source, log_type=log_type, event_payload=enriched_payload)
    return store_threat_event(thread_id=thread_id, log_source=log_source, log_type=log_type, event_payload=enriched_payload, owner_user_id=owner_user_id)


def _get_latest_threat_event(thread_id: str, owner_user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if USE_SQLITE_CACHE:
        return sqlite_get_latest_threat_event(thread_id)
    return get_latest_threat_event(thread_id, owner_user_id=owner_user_id)


def _get_latest_threat_event_for_agent(thread_id: str, agent: str, owner_user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if USE_SQLITE_CACHE:
        return sqlite_get_latest_threat_event_for_agent(thread_id, agent)
    return get_latest_threat_event_for_agent(thread_id, agent, owner_user_id=owner_user_id)

# Initialize FastAPI app
app = FastAPI(
    title="PhantomTrace Backend",
    description="Backend API for PhantomTrace network anomaly detection",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic request model
class NetworkAgentRequest(BaseModel):
    message: str
    thread_id: str = "1"  # Optional thread ID for session management


# Pydantic response model
class NetworkAgentResponse(BaseModel):
    response: str
    thread_id: str
    status: str


class AuthAgentRequest(BaseModel):
    message: str
    thread_id: str = "1"  # Optional thread ID for session management


class AuthAgentResponse(BaseModel):
    response: str
    thread_id: str
    status: str


class BehaviouralAgentRequest(BaseModel):
    message: str
    thread_id: str = "1"  # Optional thread ID for session management


class BehaviouralAgentResponse(BaseModel):
    response: str
    thread_id: str
    status: str


class OrchestratorAgentRequest(BaseModel):
    message: str
    thread_id: str = "1"  # Optional thread ID for session management


class OrchestratorAgentResponse(BaseModel):
    response: str
    thread_id: str
    status: str


class ExplainerAgentRequest(BaseModel):
    message: str
    thread_id: str = "1"  # Optional thread ID for session management


class ExplainerAgentResponse(BaseModel):
    response: str
    thread_id: str
    status: str


class UnifiedChatRequest(BaseModel):
    message: str
    agent: Literal["network", "auth", "behavioural", "orchestrator", "explainer"] = "orchestrator"
    mode: Literal["agent", "chat"] = "agent"
    thread_id: str = "1"


class UnifiedChatResponse(BaseModel):
    response: str
    thread_id: str
    status: str
    agent: str
    mode: str
    thinking_steps: List[str]


class EventIngestRequest(BaseModel):
    thread_id: str = "1"
    log_source: str
    log_type: str
    event_payload: Dict[str, Any]


class EventIngestResponse(BaseModel):
    thread_id: str
    status: str
    created_at: str


class LatestEventResponse(BaseModel):
    status: str
    event: Dict[str, Any] | None


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    website_name: str = ""
    website_url: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    status: str
    access_token: str
    token_type: str
    api_key: Optional[str] = None
    user: Dict[str, Any]


class MeResponse(BaseModel):
    status: str
    user: Dict[str, Any]


class ApiKeyRecord(BaseModel):
    id: str
    hint: str
    api_key: Optional[str] = None
    created_at: Optional[str] = None
    last_used_at: Optional[str] = None


class ApiKeysListResponse(BaseModel):
    status: str
    api_keys: List[ApiKeyRecord]


class ApiKeyCreateResponse(BaseModel):
    status: str
    api_key: str
    api_key_record: ApiKeyRecord


class ApiKeyDeleteResponse(BaseModel):
    status: str
    deleted: bool


security_scheme = HTTPBearer(auto_error=False)


def _to_http_exception(error: AuthError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)


def _extract_bearer_token(credentials: Optional[HTTPAuthorizationCredentials]) -> Optional[str]:
    if credentials and credentials.scheme and credentials.scheme.lower() == "bearer":
        return credentials.credentials
    return None


def require_authenticated_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    api_key: Optional[str] = Header(default=None, alias="x-api-key"),
) -> Dict[str, Any]:
    try:
        bearer_token = _extract_bearer_token(credentials)
        # Development override: allow unauthenticated access when DEMO_NO_AUTH is set
        if not bearer_token and not api_key and os.getenv("DEMO_NO_AUTH", "").lower() in ("1", "true", "yes"):
            return {"_id": "demo", "email": "demo@local", "name": "Demo User"}
        return get_authenticated_user(bearer_token=bearer_token, api_key=api_key)
    except AuthError as error:
        raise _to_http_exception(error)


def _to_json_safe(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if value is not None and type(value).__name__ == "ObjectId":
        return str(value)
    if isinstance(value, dict):
        return {k: _to_json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_to_json_safe(v) for v in value]
    return value


SEVERITY_SCORE_MAP = {
    "CRITICAL": 9.0,
    "HIGH": 7.0,
    "MEDIUM": 5.0,
    "LOW": 2.5,
}

AGENT_NAME_ALIASES = {
    "network": "network",
    "network_agent": "network",
    "auth": "auth",
    "auth_agent": "auth",
    "behavioural": "behavioural",
    "behavioural_agent": "behavioural",
    "behavioral": "behavioural",
    "behavioral_agent": "behavioural",
    "orchestrator": "orchestrator",
    "orchestrator_agent": "orchestrator",
    "explainer": "explainer",
    "explainer_agent": "explainer",
}

AGENT_DISPLAY_NAMES = {
    "network": "Network Agent",
    "auth": "Auth Agent",
    "behavioural": "Behavioural Agent",
    "orchestrator": "Orchestrator Agent",
    "explainer": "Explainer Agent",
}

GEO_IP_PREFIX_COUNTRY = {
    "185.220.101.45": "Russia",
    "45.142.212.100": "Ukraine",
    "194.165.16.15": "Germany",
    "8.8.8.8": "United States",
    "1.1.1.1": "Australia",
}

COUNTRY_COORDINATES = {
    "Russia": {"lat": 61.5240, "lng": 105.3188},
    "Ukraine": {"lat": 48.3794, "lng": 31.1656},
    "Germany": {"lat": 51.1657, "lng": 10.4515},
    "United States": {"lat": 39.7837, "lng": -100.4459},
    "Australia": {"lat": -25.2744, "lng": 133.7751},
    "Internal": {"lat": 0.0, "lng": 0.0},
    "Unknown": {"lat": 20.0, "lng": 0.0},
}


def _normalize_agent_name(agent_name: str) -> Optional[str]:
    if not agent_name:
        return None
    return AGENT_NAME_ALIASES.get(agent_name.strip().lower())


def _owner_user_id(current_user: Dict[str, Any]) -> str:
    """Normalize authenticated user ID for ownership-scoped writes and reads."""
    raw_value = current_user.get("_id") if isinstance(current_user, dict) else None
    if raw_value is None and isinstance(current_user, dict):
        raw_value = current_user.get("id")
    return str(raw_value) if raw_value is not None else ""


def _is_all_threads(thread_id: str) -> bool:
    normalized = (thread_id or "").strip().lower()
    return normalized in ("", "all", "*")


def _build_user_thread_query(current_user: Dict[str, Any], thread_id: str) -> Dict[str, Any]:
    query: Dict[str, Any] = {}
    owner_id = _owner_user_id(current_user)
    if owner_id:
        query["owner_user_id"] = owner_id
    if not _is_all_threads(thread_id):
        query["thread_id"] = thread_id
    return query


def _severity_to_score(severity_label: str) -> float:
    return SEVERITY_SCORE_MAP.get((severity_label or "MEDIUM").upper(), SEVERITY_SCORE_MAP["MEDIUM"])


def _score_to_severity(score: float) -> str:
    if score >= 8.5:
        return "CRITICAL"
    if score >= 6.5:
        return "HIGH"
    if score >= 4.0:
        return "MEDIUM"
    return "LOW"


def _classification_for_log_type(log_type: str) -> str:
    classification_map = {
        "network": "Network Anomaly",
        "auth": "Authentication Anomaly",
        "process": "Process Anomaly",
        "dns": "DNS Anomaly",
        "behavioral": "Behavioral Anomaly",
        "behavioural": "Behavioral Anomaly",
    }
    return classification_map.get((log_type or "").lower(), "Security Event")


def _country_from_ip(source_ip: str, payload: Dict[str, Any]) -> str:
    explicit_country = payload.get("country") or payload.get("geo_country")
    if explicit_country:
        return str(explicit_country)

    for ip_prefix, inferred_country in GEO_IP_PREFIX_COUNTRY.items():
        if source_ip.startswith(ip_prefix):
            return inferred_country

    try:
        parsed_ip = ipaddress.ip_address(source_ip)
        if parsed_ip.is_private:
            return "Internal"
    except ValueError:
        pass

    return "Unknown"


def _coordinates_for_country(country: str) -> Dict[str, float]:
    return COUNTRY_COORDINATES.get(country, COUNTRY_COORDINATES["Unknown"])


def _event_to_alert(event: Dict[str, Any], alert_id: str, thread_id: str) -> Dict[str, Any]:
    payload = enrich_event_payload(event)
    detected_rules = payload.get("detected_rules", [])
    flag_keys = payload.get("anomaly_flags", [])
    risk = calculate_risk(payload, detected_rules)
    severity_label = risk["severity_label"]
    severity_score = risk["risk_score"]
    log_type = event.get("log_type", "unknown")

    affected_entities = []
    for field in ("user_id", "source_ip", "destination_ip", "process_name", "query"):
        field_value = payload.get(field)
        if field_value:
            affected_entities.append(str(field_value))

    return {
        "_id": alert_id,
        "thread_id": thread_id,
        "severity_label": severity_label,
        "severity_score": severity_score,
        "confidence_score": risk["confidence_score"],
        "risk_factors": risk["risk_factors"],
        "attack_classification": _classification_for_log_type(log_type),
        "attack_narrative": _build_attack_narrative(log_type, event.get("log_source", "unknown"), flag_keys, severity_score),
        "event_payload": payload,
        "detected_rules": detected_rules,
        "mitre_techniques": payload.get("mitre_techniques") or mitre_for_flags(flag_keys),
        "recommended_actions": payload.get("recommended_actions") or recommendations_for_flags(flag_keys),
        "affected_entities": affected_entities,
        "timeline": [{
            "timestamp": _to_json_safe(event.get("created_at")),
            "event": f"{str(log_type).upper()} event detected",
            "agent_source": "Security System",
        }],
        "acknowledged": False,
        "created_at": _to_json_safe(event.get("created_at")),
        "source_event_id": str(event.get("_id", "")),
    }


def _build_attack_narrative(log_type: str, log_source: str, flag_keys: List[str], severity_score: float) -> str:
    if flag_keys:
        readable_flags = ", ".join(flag.replace("_", " ") for flag in flag_keys[:4])
        return (
            f"Detected {log_type} telemetry from {log_source} with {readable_flags}. "
            f"Calculated risk score: {severity_score:.1f}/10."
        )
    return f"Detected {log_type} anomaly in threat event from {log_source} source."


def _chain_to_alert(chain: Dict[str, Any], alert_id: str, thread_id: str) -> Dict[str, Any]:
    timeline = [
        {
            "timestamp": stage["timestamp"],
            "event": f"{stage['stage'].replace('_', ' ').title()}: {stage['flag_key'].replace('_', ' ')}",
            "agent_source": "Correlation Engine",
        }
        for stage in chain.get("stages", [])
    ]
    affected_entities: List[str] = []
    for stage in chain.get("stages", []):
        payload = stage.get("payload", {})
        for field in ("user_id", "source_ip", "destination_ip", "host_id", "hostname"):
            value = payload.get(field)
            if value and str(value) not in affected_entities:
                affected_entities.append(str(value))

    return {
        "_id": alert_id,
        "thread_id": thread_id,
        "severity_label": chain["severity_label"],
        "severity_score": chain["risk_score"],
        "confidence_score": chain["confidence_score"],
        "risk_factors": chain["risk_factors"],
        "attack_classification": chain["attack_classification"],
        "attack_narrative": (
            f"{chain['name']} detected across {len(chain.get('stages', []))} related events. "
            "This is a correlated incident, not a single isolated log."
        ),
        "event_payload": {"attack_chain": chain},
        "detected_rules": [
            {"flag_key": stage["flag_key"], "evidence": f"Matched chain stage: {stage['stage']}"}
            for stage in chain.get("stages", [])
        ],
        "mitre_techniques": chain.get("mitre_techniques", []),
        "recommended_actions": chain.get("recommended_actions", []),
        "affected_entities": affected_entities,
        "timeline": timeline,
        "acknowledged": False,
        "created_at": chain["created_at"],
        "source_event_id": ",".join(stage.get("source_event_id", "") for stage in chain.get("stages", [])),
    }


def _thinking_steps_for_agent(agent: str) -> List[str]:
    base_steps = [
        "Received user request",
        f"Forwarding request to {agent} agent",
        "Running security research and context checks",
        "Compiling and formatting response",
    ]

    if agent == "network":
        base_steps[2] = "Inspecting network indicators and anomaly patterns"
    elif agent == "auth":
        base_steps[2] = "Evaluating authentication patterns and login anomalies"
    elif agent == "behavioural":
        base_steps[2] = "Reviewing behavioural deviations and user baselines"
    elif agent == "orchestrator":
        base_steps[2] = "Selecting specialist agents and gathering their signals"
    elif agent == "explainer":
        base_steps[2] = "Synthesizing findings into an actionable explanation"

    return base_steps


def _extract_event_payload_from_message(message: str) -> Optional[Dict[str, Any]]:
    """Best-effort parse of direct JSON telemetry sent in chat/agent message fields."""
    if not message:
        return None

    candidate = message.strip()
    if not candidate.startswith("{"):
        return None

    try:
        payload = json.loads(candidate)
    except (TypeError, ValueError, json.JSONDecodeError):
        return None

    if isinstance(payload, dict):
        return payload
    return None


def _ingest_event_from_agent_message(
    thread_id: str,
    agent: str,
    message: str,
    owner_user_id: Optional[str] = None,
) -> None:
    """
    Persist structured event payloads to threat_events when callers send raw JSON
    directly to specialist endpoints instead of /events/ingest.
    """
    event_payload = _extract_event_payload_from_message(message)
    if not event_payload:
        return

    inferred_log_source = str(event_payload.get("log_source") or agent).strip().lower() or agent
    inferred_log_type = str(event_payload.get("log_type") or agent).strip().lower() or agent

    _store_threat_event(
        thread_id=thread_id,
        log_source=inferred_log_source,
        log_type=inferred_log_type,
        event_payload=event_payload,
        owner_user_id=owner_user_id,
    )


def _build_detection_context_for_agent(
    latest_event: Dict[str, Any],
    thread_id: str,
    owner_user_id: Optional[str] = None,
) -> str:
    detection = detect_event_rules(latest_event)
    chain_context = "No correlated attack chain detected yet."

    if not USE_SQLITE_CACHE:
        try:
            db = MongoDBConnection.get_database()
            events = list(
                db["threat_events"].find(_thread_scope_query_for_owner(thread_id, owner_user_id))
                .sort("created_at", -1)
                .limit(50)
            )
            chains = correlate_attack_chains(events)
            if chains:
                chain_context = json.dumps(chains[:3], default=str, ensure_ascii=True)
        except Exception:
            chain_context = "Attack-chain lookup unavailable for this request."

    return (
        "Deterministic detection enrichment:\n"
        f"  Flags: {', '.join(detection['flag_keys']) or 'none'}\n"
        f"  Risk score: {detection['risk_score']}/10 ({detection['severity_label']})\n"
        f"  Confidence: {detection['confidence_score']}\n"
        f"  MITRE: {json.dumps(detection['mitre_techniques'], ensure_ascii=True)}\n"
        f"  Recommendations: {json.dumps(detection['recommended_actions'], ensure_ascii=True)}\n"
        f"  Attack chains: {chain_context}"
    )


def _thread_scope_query_for_owner(thread_id: str, owner_user_id: Optional[str] = None) -> Dict[str, Any]:
    query: Dict[str, Any] = {}
    if owner_user_id:
        query["owner_user_id"] = owner_user_id
    if not _is_all_threads(thread_id):
        query["thread_id"] = thread_id
    return query


async def _invoke_selected_agent(
    agent: str,
    message: str,
    thread_id: str,
    owner_user_id: Optional[str] = None,
) -> str:
    latest_event = _get_latest_threat_event_for_agent(thread_id, agent, owner_user_id=owner_user_id)
    contextual_message = message
    if latest_event:
        detection_context = _build_detection_context_for_agent(
            latest_event=latest_event,
            thread_id=thread_id,
            owner_user_id=owner_user_id,
        )
        contextual_message = (
            "Use the latest persisted event as primary telemetry context.\n"
            f"Thread ID: {thread_id}\n"
            f"Event source/type: {latest_event['log_source']}/{latest_event['log_type']}\n"
            f"Event payload: {latest_event['event_payload']}\n\n"
            f"{detection_context}\n\n"
            f"User request:\n{message}"
        )

    if agent == "network":
        return await invoke_network_agent_async(user_message=contextual_message, thread_id=thread_id)
    if agent == "auth":
        return invoke_auth_agent(user_message=contextual_message, thread_id=thread_id)
    if agent == "behavioural":
        return invoke_behavioural_agent(user_message=contextual_message, thread_id=thread_id)
    if agent == "orchestrator":
        return invoke_orchestrator_agent(user_message=contextual_message, thread_id=thread_id)
    if agent == "explainer":
        return invoke_explainer_agent(user_message=contextual_message, thread_id=thread_id)

    raise ValueError(f"Unsupported agent: {agent}")


async def _invoke_and_cache_agent(
    agent: str,
    message: str,
    thread_id: str,
    owner_user_id: Optional[str] = None,
) -> str:
    _ingest_event_from_agent_message(
        thread_id=thread_id,
        agent=agent,
        message=message,
        owner_user_id=owner_user_id,
    )
    agent_response = await _invoke_selected_agent(
        agent=agent,
        message=message,
        thread_id=thread_id,
        owner_user_id=owner_user_id,
    )
    parsed_response = parse_agent_response(agent_response)
    store_agent_result(
        thread_id=thread_id,
        agent_name=agent,
        user_message=message,
        raw_response=agent_response,
        parsed_response=parsed_response,
        owner_user_id=owner_user_id,
    )
    inferred_flags = infer_flags_from_agent_response(agent_name=agent, raw_response=agent_response)
    store_agent_flags(
        thread_id=thread_id,
        agent_name=agent,
        flags=inferred_flags,
        owner_user_id=owner_user_id,
    )
    return agent_response


def _invoke_explainer_with_context(
    message: str,
    thread_id: str,
    owner_user_id: Optional[str] = None,
) -> str:
    contextual_message = build_explainer_context(
        thread_id=thread_id,
        user_message=message,
        owner_user_id=owner_user_id,
    )
    return invoke_explainer_agent(user_message=contextual_message, thread_id=thread_id)


def _invoke_chat_mode_with_context(
    message: str,
    thread_id: str,
    owner_user_id: Optional[str] = None,
) -> str:
    contextual_message = build_explainer_context(
        thread_id=thread_id,
        user_message=message,
        owner_user_id=owner_user_id,
    )
    return invoke_explainer_chat(user_message=message, context=contextual_message)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "PhantomTrace Backend is running"}


@app.get("/health")
async def health():
    """Detailed health check endpoint including MongoDB status"""
    try:
        mongo_health = health_check()
        return {
            "status": "healthy",
            "mongodb": mongo_health,
            "message": "All systems operational"
        }
    except Exception as e:
        return {
            "status": "degraded",
            "mongodb": {"status": "unhealthy", "error": str(e)},
            "message": "Some systems may be unavailable"
        }


@app.post("/auth/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """Register a user, issue a JWT, and return a provisioned API key."""
    try:
        payload = register_user(
            name=request.name,
            email=request.email,
            password=request.password,
            website_name=request.website_name,
            website_url=request.website_url,
        )
        return AuthResponse(**payload)
    except AuthError as error:
        raise _to_http_exception(error)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating account: {str(e)}")


@app.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Authenticate a user and return a JWT for API access."""
    try:
        payload = login_user(email=request.email, password=request.password)
        return AuthResponse(**payload)
    except AuthError as error:
        raise _to_http_exception(error)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during login: {str(e)}")


@app.get("/auth/me", response_model=MeResponse)
async def me(current_user: Dict[str, Any] = Depends(require_authenticated_user)):
    """Return profile metadata for the currently authenticated user."""
    return MeResponse(**get_me_payload(current_user))


@app.get("/auth/api-keys", response_model=ApiKeysListResponse)
async def list_api_keys(current_user: Dict[str, Any] = Depends(require_authenticated_user)):
    """Return all active API keys for the authenticated user."""
    try:
        payload = get_user_api_keys(current_user)
        return ApiKeysListResponse(**payload)
    except AuthError as error:
        raise _to_http_exception(error)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading API keys: {str(e)}")


@app.post("/auth/api-keys", response_model=ApiKeyCreateResponse)
async def create_api_key(current_user: Dict[str, Any] = Depends(require_authenticated_user)):
    """Create a new API key for the authenticated user."""
    try:
        payload = create_user_api_key(current_user)
        return ApiKeyCreateResponse(**payload)
    except AuthError as error:
        raise _to_http_exception(error)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating API key: {str(e)}")


@app.delete("/auth/api-keys/{key_id}", response_model=ApiKeyDeleteResponse)
async def delete_api_key(
    key_id: str,
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """Delete an API key for the authenticated user."""
    try:
        payload = delete_user_api_key(current_user, key_id)
        return ApiKeyDeleteResponse(**payload)
    except AuthError as error:
        raise _to_http_exception(error)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting API key: {str(e)}")


@app.post("/events/ingest", response_model=EventIngestResponse)
async def ingest_event(
    request: EventIngestRequest,
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """Persist raw threat telemetry in SQLite for downstream specialist analysis."""
    try:
        if not request.log_source.strip() or not request.log_type.strip():
            raise HTTPException(status_code=400, detail="log_source and log_type are required")

        record = _store_threat_event(
            thread_id=request.thread_id,
            log_source=request.log_source,
            log_type=request.log_type,
            event_payload=request.event_payload,
            owner_user_id=_owner_user_id(current_user),
        )
        return EventIngestResponse(
            thread_id=record["thread_id"],
            status="success",
            created_at=_to_json_safe(record.get("created_at")),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ingesting event: {str(e)}")


@app.get("/events/latest/{thread_id}", response_model=LatestEventResponse)
async def get_latest_event(
    thread_id: str,
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """Fetch the latest stored event for a thread."""
    try:
        event = _get_latest_threat_event(thread_id, owner_user_id=_owner_user_id(current_user))
        return LatestEventResponse(status="success", event=_to_json_safe(event) if event else None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading latest event: {str(e)}")


@app.post("/chat", response_model=UnifiedChatResponse)
async def unified_chat(
    request: UnifiedChatRequest,
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """
    Unified chat endpoint that routes messages to a selected backend agent.

    Request payload:
    - message: user prompt
    - agent: one of network, auth, behavioural, orchestrator, explainer
    - thread_id: optional conversation/session id
    """
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        selected_mode = request.mode.lower().strip()
        selected_agent = request.agent.lower().strip()

        if selected_mode == "chat":
            agent_response = _invoke_chat_mode_with_context(
                message=request.message,
                thread_id=request.thread_id,
                owner_user_id=_owner_user_id(current_user),
            )
            thinking_steps: List[str] = []
            response_agent = "chat"
        else:
            thinking_steps = _thinking_steps_for_agent(selected_agent)
            if selected_agent == "explainer":
                agent_response = _invoke_explainer_with_context(
                    message=request.message,
                    thread_id=request.thread_id,
                    owner_user_id=_owner_user_id(current_user),
                )
            else:
                agent_response = await _invoke_and_cache_agent(
                    agent=selected_agent,
                    message=request.message,
                    thread_id=request.thread_id,
                    owner_user_id=_owner_user_id(current_user),
                )
            response_agent = selected_agent

        return UnifiedChatResponse(
            response=agent_response,
            thread_id=request.thread_id,
            status="success",
            agent=response_agent,
            mode=selected_mode,
            thinking_steps=thinking_steps,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in unified chat endpoint: {str(e)}")


@app.post("/call-networkAgent", response_model=NetworkAgentResponse)
async def call_network_agent(
    request: NetworkAgentRequest,
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """
    Endpoint to call the network agent with a message.
    
    Args:
        request: NetworkAgentRequest containing message and optional thread_id
    
    Returns:
        NetworkAgentResponse containing the agent's response
    """
    try:
        # Validate input
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )
        
        agent_response = await _invoke_and_cache_agent(
            agent="network",
            message=request.message,
            thread_id=request.thread_id,
            owner_user_id=_owner_user_id(current_user),
        )
        
        return NetworkAgentResponse(
            response=agent_response,
            thread_id=request.thread_id,
            status="success"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error invoking network agent: {str(e)}"
        )


@app.post("/call-authAgent", response_model=AuthAgentResponse)
async def call_auth_agent(
    request: AuthAgentRequest,
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """
    Endpoint to call the authentication agent with a message.

    Args:
        request: AuthAgentRequest containing message and optional thread_id

    Returns:
        AuthAgentResponse containing the agent's response
    """
    try:
        # Validate input
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )

        agent_response = await _invoke_and_cache_agent(
            agent="auth",
            message=request.message,
            thread_id=request.thread_id,
            owner_user_id=_owner_user_id(current_user),
        )

        return AuthAgentResponse(
            response=agent_response,
            thread_id=request.thread_id,
            status="success"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error invoking auth agent: {str(e)}"
        )


@app.post("/call-behaviouralAgent", response_model=BehaviouralAgentResponse)
async def call_behavioural_agent(
    request: BehaviouralAgentRequest,
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """
    Endpoint to call the behavioural agent with a message.

    Args:
        request: BehaviouralAgentRequest containing message and optional thread_id

    Returns:
        BehaviouralAgentResponse containing the agent's response
    """
    try:
        # Validate input
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )

        agent_response = await _invoke_and_cache_agent(
            agent="behavioural",
            message=request.message,
            thread_id=request.thread_id,
            owner_user_id=_owner_user_id(current_user),
        )

        return BehaviouralAgentResponse(
            response=agent_response,
            thread_id=request.thread_id,
            status="success"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error invoking behavioural agent: {str(e)}"
        )


@app.post("/call-orchestratorAgent", response_model=OrchestratorAgentResponse)
async def call_orchestrator_agent(
    request: OrchestratorAgentRequest,
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """
    Endpoint to call the orchestrator agent with a message.

    Args:
        request: OrchestratorAgentRequest containing message and optional thread_id

    Returns:
        OrchestratorAgentResponse containing the agent's response
    """
    try:
        # Validate input
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )

        agent_response = await _invoke_and_cache_agent(
            agent="orchestrator",
            message=request.message,
            thread_id=request.thread_id,
            owner_user_id=_owner_user_id(current_user),
        )

        return OrchestratorAgentResponse(
            response=agent_response,
            thread_id=request.thread_id,
            status="success"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error invoking orchestrator agent: {str(e)}"
        )


@app.post("/call-explainerAgent", response_model=ExplainerAgentResponse)
async def call_explainer_agent(
    request: ExplainerAgentRequest,
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """
    Endpoint to call the explainer agent with a message.

    Args:
        request: ExplainerAgentRequest containing message and optional thread_id

    Returns:
        ExplainerAgentResponse containing the agent's response
    """
    try:
        # Validate input
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )

        agent_response = _invoke_explainer_with_context(
            message=request.message,
            thread_id=request.thread_id,
            owner_user_id=_owner_user_id(current_user),
        )

        return ExplainerAgentResponse(
            response=agent_response,
            thread_id=request.thread_id,
            status="success"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error invoking explainer agent: {str(e)}"
        )


# ─── API ENDPOINTS FOR DASHBOARD DATA ────────────────────────────────────────
from mongodb_db import MongoDBConnection


@app.get("/api/alerts")
async def get_alerts(
    thread_id: str = "all",
    limit: int = 100,
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """
    Fetch threat events for a thread and convert to alert format for frontend.
    
    Args:
        thread_id: Thread ID to fetch alerts for (default: "default")
        limit: Maximum number of alerts to return
    
    Returns:
        List of alerts with calculated severity and formatting
    """
    try:
        db = MongoDBConnection.get_database()
        
        scoped_query = _build_user_thread_query(current_user, thread_id)

        # Fetch threat events and agent results for this scope
        threat_events = list(db["threat_events"].find(
            scoped_query
        ).sort("created_at", -1).limit(limit))
        
        agent_results = list(db["agent_results"].find(
            scoped_query
        ).sort("created_at", -1).limit(limit))
        
        # Convert threat events to alert format
        alerts = []

        event_id_counter = 1
        chains = correlate_attack_chains(threat_events)
        for chain_index, chain in enumerate(chains, start=1):
            alerts.append(_chain_to_alert(chain=chain, alert_id=f"chain_{chain_index}", thread_id=thread_id))

        for event in threat_events:
            event_thread_id = str(event.get("thread_id") or thread_id)
            alerts.append(_event_to_alert(event=event, alert_id=f"alert_{event_id_counter}", thread_id=event_thread_id))
            event_id_counter += 1
        
        # Also include recent agent findings as alerts
        finding_id_counter = event_id_counter
        for result in agent_results[:5]:  # Limit to 5 recent findings
            agent_name = result.get("agent_name", "unknown")
            parsed_response = result.get("parsed_response", {})
            summary = parsed_response.get("summary", "Finding generated")
            
            # Calculate severity from findings
            severity_score = _severity_to_score("MEDIUM")
            if "critical" in summary.lower():
                severity_score = _severity_to_score("CRITICAL")
            elif "high" in summary.lower():
                severity_score = _severity_to_score("HIGH")
            elif "low" in summary.lower():
                severity_score = _severity_to_score("LOW")

            findings = parsed_response.get("findings", [])
            text_flags = []
            for finding in findings + [summary]:
                normalized_text = str(finding).lower()
                if "brute force" in normalized_text:
                    text_flags.append("brute_force")
                if "dns tunnel" in normalized_text or "dns tunneling" in normalized_text:
                    text_flags.append("dns_tunneling")
                if "powershell" in normalized_text or "encoded command" in normalized_text:
                    text_flags.append("suspicious_process_ancestry")
                if "exfiltration" in normalized_text or "bulk export" in normalized_text:
                    text_flags.append("data_exfiltration")
                if "privilege" in normalized_text:
                    text_flags.append("privilege_chaining")
            text_flags = list(dict.fromkeys(text_flags))
            risk = calculate_risk({"severity": _score_to_severity(severity_score)}, [{"flag_key": flag, "confidence": 0.8} for flag in text_flags])
            severity_score = risk["risk_score"]
            severity_label = risk["severity_label"]
            
            agent_finding = {
                "_id": f"finding_{finding_id_counter}",
                "thread_id": str(result.get("thread_id") or thread_id),
                "severity_label": severity_label,
                "severity_score": severity_score,
                "confidence_score": risk["confidence_score"],
                "risk_factors": risk["risk_factors"],
                "attack_classification": f"{agent_name.title()} Finding",
                "attack_narrative": summary,
                "findings": findings,
                "mitre_techniques": mitre_for_flags(text_flags),
                "recommended_actions": recommendations_for_flags(text_flags),
                "affected_entities": [],
                "timeline": [{
                    "timestamp": _to_json_safe(result.get("created_at")),
                    "event": summary,
                    "agent_source": f"{agent_name.title()} Agent"
                }],
                "acknowledged": False,
                "created_at": _to_json_safe(result.get("created_at"))
            }
            
            alerts.append(agent_finding)
            finding_id_counter += 1
        
        # Sort by created_at descending
        alerts.sort(key=lambda x: x["created_at"], reverse=True)
        
        return {
            "status": "success",
            "thread_id": thread_id,
            "count": len(alerts),
            "alerts": alerts
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")


@app.get("/api/alerts/summary")
async def get_alerts_summary(
    thread_id: str = "all",
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """
    Get summary statistics for alerts on the dashboard.
    
    Returns:
        Statistics including counts by severity, total logs, etc.
    """
    try:
        db = MongoDBConnection.get_database()
        
        scoped_query = _build_user_thread_query(current_user, thread_id)
        threat_events = list(db["threat_events"].find(scoped_query))

        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        total_score = 0.0
        for event in threat_events:
            enriched_payload = enrich_event_payload(event)
            severity_label = str(enriched_payload.get("severity", "MEDIUM")).upper()
            if severity_label == "CRITICAL":
                severity_counts["critical"] += 1
            elif severity_label == "HIGH":
                severity_counts["high"] += 1
            elif severity_label == "MEDIUM":
                severity_counts["medium"] += 1
            else:
                severity_counts["low"] += 1
            total_score += float(enriched_payload.get("risk_score") or _severity_to_score(severity_label))
        
        # Count by log type
        alerts_by_type = {}
        for event in threat_events:
            log_type = event.get("log_type", "unknown")
            alerts_by_type[log_type] = alerts_by_type.get(log_type, 0) + 1
        
        alerts_by_type_list = [
            {"type": k.replace("_", " ").title(), "count": v}
            for k, v in sorted(alerts_by_type.items(), key=lambda x: x[1], reverse=True)
        ]

        start_of_today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        logs_today = db["threat_events"].count_documents({
            **scoped_query,
            "created_at": {"$gte": start_of_today},
        })

        distinct_agent_names = db["agent_results"].distinct("agent_name", scoped_query)
        active_agents = {
            normalized for normalized in (_normalize_agent_name(name) for name in distinct_agent_names) if normalized
        }

        avg_severity = round(total_score / max(1, len(threat_events)), 2)
        
        return {
            "status": "success",
            "thread_id": thread_id,
            "counts": severity_counts,
            "total_events": len(threat_events),
            "logs_today": logs_today,
            "agents_active": len(active_agents),
            "avg_severity": avg_severity,
            "alerts_by_type": alerts_by_type_list
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching summary: {str(e)}")


@app.get("/api/logs")
async def get_logs(
    thread_id: str = "all",
    limit: int = 100,
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """
    Fetch threat events formatted as logs for the LogExplorer page.
    
    Args:
        thread_id: Thread ID to fetch logs for
        limit: Maximum number of logs to return
    
    Returns:
        List of logs with metadata and raw payloads
    """
    try:
        db = MongoDBConnection.get_database()
        
        scoped_query = _build_user_thread_query(current_user, thread_id)

        # Fetch threat events sorted by created_at descending
        threat_events = list(db["threat_events"].find(
            scoped_query
        ).sort("created_at", -1).limit(limit))
        
        # Convert threat events to log format
        logs = []
        for idx, event in enumerate(threat_events):
            enriched_payload = enrich_event_payload(event)
            log = {
                "_id": f"log_{idx + 1}",
                "thread_id": str(event.get("thread_id") or thread_id),
                "log_type": event.get("log_type", "unknown"),
                "source": event.get("log_source", "system"),
                "source_ip": enriched_payload.get("source_ip", ""),
                "user_id": enriched_payload.get("user_id"),
                "status": _determine_log_status(enriched_payload),
                "processed": True,
                "timestamp": _to_json_safe(event.get("created_at")),
                "raw_payload": enriched_payload,
                "source_event_id": str(event.get("_id", ""))
            }
            logs.append(log)
        
        return {
            "status": "success",
            "thread_id": thread_id,
            "count": len(logs),
            "logs": logs
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching logs: {str(e)}")


@app.get("/api/reports")
async def get_reports(
    thread_id: str = "all",
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """Compute reports page statistics directly from MongoDB threat and agent collections."""
    try:
        db = MongoDBConnection.get_database()

        scoped_query = _build_user_thread_query(current_user, thread_id)
        threat_events = list(db["threat_events"].find(scoped_query).sort("created_at", -1))
        agent_results = list(db["agent_results"].find(scoped_query))

        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        alerts_by_type: Dict[str, int] = {}
        users: Dict[str, Dict[str, Any]] = {}
        source_ips: Dict[str, Dict[str, Any]] = {}
        total_severity_score = 0.0

        top_critical_alerts = []
        for idx, event in enumerate(threat_events, start=1):
            payload = enrich_event_payload(event)
            severity_label = str(payload.get("severity", "MEDIUM")).upper()
            severity_score = float(payload.get("risk_score") or _severity_to_score(severity_label))
            total_severity_score += severity_score

            if severity_label == "CRITICAL":
                severity_counts["critical"] += 1
            elif severity_label == "HIGH":
                severity_counts["high"] += 1
            elif severity_label == "MEDIUM":
                severity_counts["medium"] += 1
            else:
                severity_counts["low"] += 1

            log_type = str(event.get("log_type", "unknown")).lower()
            alerts_by_type[log_type] = alerts_by_type.get(log_type, 0) + 1

            user_id = payload.get("user_id")
            if user_id:
                existing_user = users.get(user_id)
                if existing_user is None:
                    users[user_id] = {
                        "id": str(user_id),
                        "alerts": 1,
                        "lastSeen": _to_json_safe(event.get("created_at")),
                        "riskScore": severity_score,
                    }
                else:
                    existing_user["alerts"] += 1
                    if severity_score > existing_user["riskScore"]:
                        existing_user["riskScore"] = severity_score

            source_ip = payload.get("source_ip")
            if source_ip:
                existing_ip = source_ips.get(source_ip)
                if existing_ip is None:
                    source_ips[source_ip] = {
                        "ip": str(source_ip),
                        "country": _country_from_ip(str(source_ip), payload),
                        "alerts": 1,
                        "severityScore": severity_score,
                    }
                else:
                    existing_ip["alerts"] += 1
                    if severity_score > existing_ip["severityScore"]:
                        existing_ip["severityScore"] = severity_score

            if severity_label == "CRITICAL":
                top_critical_alerts.append(
                    _event_to_alert(
                        event=event,
                        alert_id=f"alert_{idx}",
                        thread_id=str(event.get("thread_id") or thread_id),
                    )
                )

        if not top_critical_alerts and threat_events:
            # Fall back to highest severity events when no CRITICAL events exist.
            sorted_events = sorted(
                threat_events,
                key=lambda e: float(enrich_event_payload(e).get("risk_score") or 0),
                reverse=True,
            )
            top_critical_alerts = [
                _event_to_alert(
                    event=event,
                    alert_id=f"alert_{idx+1}",
                    thread_id=str(event.get("thread_id") or thread_id),
                )
                for idx, event in enumerate(sorted_events[:3])
            ]

        agent_stats: Dict[str, Dict[str, Any]] = {}
        for result in agent_results:
            normalized_agent = _normalize_agent_name(str(result.get("agent_name", "")))
            if not normalized_agent:
                continue

            stats = agent_stats.setdefault(
                normalized_agent,
                {
                    "agent": normalized_agent,
                    "name": AGENT_DISPLAY_NAMES.get(normalized_agent, normalized_agent.title()),
                    "findings": 0,
                },
            )
            stats["findings"] += 1

        reports_agents = sorted(agent_stats.values(), key=lambda item: item["findings"], reverse=True)

        sorted_users = sorted(users.values(), key=lambda item: (item["alerts"], item["riskScore"]), reverse=True)[:5]
        top_users = [
            {
                "id": item["id"],
                "alerts": item["alerts"],
                "lastSeen": item["lastSeen"],
                "risk": _score_to_severity(item["riskScore"]),
            }
            for item in sorted_users
        ]

        sorted_ips = sorted(source_ips.values(), key=lambda item: (item["alerts"], item["severityScore"]), reverse=True)[:5]
        top_ips = [
            {
                "ip": item["ip"],
                "country": item["country"],
                "alerts": item["alerts"],
                "severity": _score_to_severity(item["severityScore"]),
            }
            for item in sorted_ips
        ]

        alert_types = [
            {"type": key.replace("_", " ").title(), "count": count}
            for key, count in sorted(alerts_by_type.items(), key=lambda pair: pair[1], reverse=True)
        ]

        total_alerts = len(threat_events)
        avg_severity = round(total_severity_score / max(1, total_alerts), 2)

        return {
            "status": "success",
            "thread_id": thread_id,
            "summary": {
                "total_alerts": total_alerts,
                "critical_incidents": severity_counts["critical"],
                "avg_severity": avg_severity,
                "high_or_critical": severity_counts["critical"] + severity_counts["high"],
            },
            "severity": severity_counts,
            "alert_types": alert_types,
            "top_critical_alerts": top_critical_alerts[:3],
            "top_users": top_users,
            "top_ips": top_ips,
            "agent_performance": reports_agents,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")


@app.get("/api/agents")
async def get_agents(
    thread_id: str = "all",
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """Fetch agent status and findings from MongoDB for AgentMonitor."""
    try:
        db = MongoDBConnection.get_database()
        scoped_query = _build_user_thread_query(current_user, thread_id)
        agent_results = list(db["agent_results"].find(scoped_query).sort("created_at", -1))
        agent_flags = list(db["agent_flags"].find({**scoped_query, "enabled": True}).sort("confidence", -1))
        threat_events = list(db["threat_events"].find(scoped_query).sort("created_at", -1).limit(500))

        now = datetime.now(timezone.utc)
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        expected_agents = ["network", "auth", "behavioural", "orchestrator", "explainer"]

        def _parse_dt(value: Any) -> Optional[datetime]:
            if not value:
                return None
            if isinstance(value, datetime):
                return value.astimezone(timezone.utc)
            if isinstance(value, str):
                normalized = value.strip().replace("Z", "+00:00")
                try:
                    parsed = datetime.fromisoformat(normalized)
                    if parsed.tzinfo is None:
                        parsed = parsed.replace(tzinfo=timezone.utc)
                    return parsed.astimezone(timezone.utc)
                except ValueError:
                    return None
            return None

        agents_dict: Dict[str, Dict[str, Any]] = {
            agent_key: {
                "name": AGENT_DISPLAY_NAMES.get(agent_key, f"{agent_key.replace('_', ' ').title()} Agent"),
                "key": agent_key,
                "status": "offline",
                "findings_today": 0,
                "total_findings": 0,
                "avg_confidence": 0.0,
                "top_flag": "monitoring",
                "last_active": None,
                "avg_processing_ms": 0,
                "recent_findings": [],
                "flags": [],
                "data_source": "none",
            }
            for agent_key in expected_agents
        }

        confidence_sums: Dict[str, float] = {agent_key: 0.0 for agent_key in expected_agents}
        confidence_counts: Dict[str, int] = {agent_key: 0 for agent_key in expected_agents}
        processing_ms_sums: Dict[str, int] = {agent_key: 0 for agent_key in expected_agents}
        processing_ms_counts: Dict[str, int] = {agent_key: 0 for agent_key in expected_agents}

        for result in agent_results:
            normalized_agent = _normalize_agent_name(result.get("agent_name", ""))
            if not normalized_agent:
                continue
            if normalized_agent not in agents_dict:
                agents_dict[normalized_agent] = {
                    "name": AGENT_DISPLAY_NAMES.get(normalized_agent, f"{normalized_agent.replace('_', ' ').title()} Agent"),
                    "key": normalized_agent,
                    "status": "offline",
                    "findings_today": 0,
                    "total_findings": 0,
                    "avg_confidence": 0.0,
                    "top_flag": "monitoring",
                    "last_active": None,
                    "avg_processing_ms": 0,
                    "recent_findings": [],
                    "flags": [],
                    "data_source": "none",
                }
                confidence_sums.setdefault(normalized_agent, 0.0)
                confidence_counts.setdefault(normalized_agent, 0)
                processing_ms_sums.setdefault(normalized_agent, 0)
                processing_ms_counts.setdefault(normalized_agent, 0)

            agent_entry = agents_dict[normalized_agent]
            created_at = _parse_dt(result.get("created_at"))

            agent_entry["total_findings"] += 1
            if created_at and created_at >= start_of_today:
                agent_entry["findings_today"] += 1

            agent_entry["recent_findings"].append({
                "finding": result.get("parsed_response", {}).get("summary", ""),
                "timestamp": _to_json_safe(result.get("created_at"))
            })

            previous_last_active = _parse_dt(agent_entry.get("last_active"))
            if created_at and (previous_last_active is None or created_at > previous_last_active):
                agent_entry["last_active"] = created_at.isoformat()

            parsed_response = result.get("parsed_response", {})
            line_count = parsed_response.get("line_count") or len(parsed_response.get("findings", []))
            estimated_ms = max(75, int(90 + (line_count * 18)))
            processing_ms_sums[normalized_agent] += estimated_ms
            processing_ms_counts[normalized_agent] += 1
            agent_entry["data_source"] = "agent-results"

            confidence_value = parsed_response.get("confidence_score")
            if isinstance(confidence_value, (int, float)):
                confidence_sums[normalized_agent] += float(confidence_value)
                confidence_counts[normalized_agent] += 1

        for flags_doc in agent_flags:
            normalized_agent = _normalize_agent_name(flags_doc.get("agent_name", ""))
            if not normalized_agent or normalized_agent not in agents_dict:
                continue

            flag_key = str(flags_doc.get("flag_key") or "").strip().lower()
            if not flag_key:
                continue

            if flag_key not in agents_dict[normalized_agent]["flags"]:
                agents_dict[normalized_agent]["flags"].append(flag_key)

        # Fallback inference from threat telemetry so per-agent stats remain useful
        # even when only a subset of agents are being called due to model rate limits.
        agent_log_type_map: Dict[str, set[str]] = {
            "network": {"network", "dns", "process", "malware"},
            "auth": {"auth", "access", "login"},
            "behavioural": {"behavioral", "behavioural", "activity"},
            "orchestrator": set(),
            "explainer": set(),
        }

        inferred_events: Dict[str, list[Dict[str, Any]]] = {agent_key: [] for agent_key in agents_dict.keys()}
        for event in threat_events:
            log_type = str(event.get("log_type") or "unknown").strip().lower()
            created_at = _parse_dt(event.get("created_at"))
            payload = enrich_event_payload(event)
            severity_label = str(payload.get("severity", "MEDIUM")).upper()
            severity_score = float(payload.get("risk_score") or _severity_to_score(severity_label))
            finding_text = f"Telemetry event ({log_type}) from {event.get('log_source', 'unknown')} source"

            for agent_key, supported_types in agent_log_type_map.items():
                if supported_types and log_type in supported_types:
                    inferred_events.setdefault(agent_key, []).append(
                        {
                            "created_at": created_at,
                            "finding": finding_text,
                            "severity_score": severity_score,
                            "log_type": log_type,
                        }
                    )

        # Orchestrator/Explainer can still surface a basic stat line from total telemetry.
        if threat_events:
            orchestrator_items = []
            for event in threat_events:
                created_at = _parse_dt(event.get("created_at"))
                payload = enrich_event_payload(event)
                severity_label = str(payload.get("severity", "MEDIUM")).upper()
                severity_score = float(payload.get("risk_score") or _severity_to_score(severity_label))
                log_type = str(event.get("log_type") or "unknown").strip().lower()
                orchestrator_items.append(
                    {
                        "created_at": created_at,
                        "finding": f"Telemetry correlation candidate for {log_type} event",
                        "severity_score": severity_score,
                        "log_type": log_type,
                    }
                )
            inferred_events["orchestrator"] = orchestrator_items
            inferred_events["explainer"] = orchestrator_items

        for agent_key, agent_entry in agents_dict.items():
            if agent_entry.get("total_findings", 0) > 0:
                continue

            items = inferred_events.get(agent_key, [])
            if not items:
                continue

            items_sorted = sorted(items, key=lambda item: item.get("created_at") or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
            agent_entry["total_findings"] = len(items_sorted)
            agent_entry["findings_today"] = len([item for item in items_sorted if item.get("created_at") and item["created_at"] >= start_of_today])
            agent_entry["last_active"] = items_sorted[0]["created_at"].isoformat() if items_sorted[0].get("created_at") else None
            agent_entry["recent_findings"] = [
                {
                    "finding": item["finding"],
                    "timestamp": item["created_at"].isoformat() if item.get("created_at") else None,
                }
                for item in items_sorted[:5]
            ]

            inferred_conf = [min(0.95, max(0.2, (item.get("severity_score", 5.0) / 10.0))) for item in items_sorted]
            agent_entry["avg_confidence"] = round(sum(inferred_conf) / len(inferred_conf), 2)
            if not agent_entry.get("flags"):
                agent_entry["top_flag"] = f"{items_sorted[0].get('log_type', 'telemetry')}_anomaly"
            agent_entry["avg_processing_ms"] = 140
            agent_entry["data_source"] = "event-inferred"

        for agent_key, agent_entry in agents_dict.items():
            if processing_ms_counts.get(agent_key, 0) > 0:
                agent_entry["avg_processing_ms"] = int(processing_ms_sums[agent_key] / processing_ms_counts[agent_key])
            else:
                agent_entry["avg_processing_ms"] = 0

            if confidence_counts.get(agent_key, 0) > 0:
                agent_entry["avg_confidence"] = round(confidence_sums[agent_key] / confidence_counts[agent_key], 2)
            elif agent_entry["flags"]:
                matching_confidences = [
                    float(flag.get("confidence", 0.0))
                    for flag in agent_flags
                    if _normalize_agent_name(flag.get("agent_name", "")) == agent_key and isinstance(flag.get("confidence"), (int, float))
                ]
                if matching_confidences:
                    agent_entry["avg_confidence"] = round(sum(matching_confidences) / len(matching_confidences), 2)

            if agent_entry["flags"]:
                agent_entry["top_flag"] = agent_entry["flags"][0]

            agent_entry["recent_findings"] = agent_entry["recent_findings"][:5]

        latest_agent_key = None
        latest_agent_time = None
        latest_runtime_agent_key = None
        latest_runtime_agent_time = None
        for agent_key, agent_entry in agents_dict.items():
            dt = _parse_dt(agent_entry.get("last_active"))
            if dt and (latest_agent_time is None or dt > latest_agent_time):
                latest_agent_time = dt
                latest_agent_key = agent_key
            if agent_entry.get("data_source") == "agent-results" and dt and (latest_runtime_agent_time is None or dt > latest_runtime_agent_time):
                latest_runtime_agent_time = dt
                latest_runtime_agent_key = agent_key

        for agent_key, agent_entry in agents_dict.items():
            dt = _parse_dt(agent_entry.get("last_active"))
            if not dt:
                agent_entry["status"] = "offline"
                continue
            age_seconds = (now - dt).total_seconds()
            if latest_runtime_agent_key == agent_key and age_seconds <= 120:
                agent_entry["status"] = "processing"
            elif age_seconds <= 3600:
                agent_entry["status"] = "idle"
            else:
                agent_entry["status"] = "offline"

        agents = [agents_dict[key] for key in expected_agents if key in agents_dict]
        for dynamic_key, dynamic_value in agents_dict.items():
            if dynamic_key not in expected_agents:
                agents.append(dynamic_value)

        total_findings_today = sum(agent.get("findings_today", 0) for agent in agents)
        active_agents = len([agent for agent in agents if agent.get("status") != "offline"])
        processing_agents = len([agent for agent in agents if agent.get("status") == "processing"])
        confidence_values = [agent.get("avg_confidence", 0.0) for agent in agents if isinstance(agent.get("avg_confidence"), (int, float)) and agent.get("avg_confidence", 0.0) > 0]
        overall_confidence = round(sum(confidence_values) / len(confidence_values), 2) if confidence_values else 0.0

        return {
            "status": "success",
            "thread_id": thread_id,
            "count": len(agents),
            "overview": {
                "active_agents": active_agents,
                "processing_agents": processing_agents,
                "total_findings_today": total_findings_today,
                "avg_confidence": overall_confidence,
                "last_pipeline_update": latest_agent_time.isoformat() if latest_agent_time else None,
            },
            "pipeline": {
                "processing_agent": latest_runtime_agent_key if processing_agents > 0 else None,
                "stages": ["ingest", "supervisor", "specialists", "explainer", "alert"],
            },
            "agents": agents,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching agents: {str(e)}")


@app.get("/api/threat-map")
async def get_threat_map(
    thread_id: str = "all",
    time_filter: str = "24h",
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(require_authenticated_user),
):
    """Fetch geographic threat data from MongoDB for ThreatMap visualization."""
    try:
        from datetime import datetime, timedelta
        db = MongoDBConnection.get_database()
        
        time_map = {
            "1h": timedelta(hours=1),
            "6h": timedelta(hours=6),
            "24h": timedelta(hours=24),
            "7d": timedelta(days=7)
        }

        def _parse_time(value: Optional[str]) -> Optional[datetime]:
            if not value:
                return None
            normalized = value.strip().replace("Z", "+00:00")
            parsed = datetime.fromisoformat(normalized)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)

        parsed_start_time = _parse_time(start_time)
        parsed_end_time = _parse_time(end_time)

        if parsed_start_time and parsed_end_time and parsed_end_time < parsed_start_time:
            raise HTTPException(status_code=400, detail="end_time must be greater than or equal to start_time")

        if parsed_start_time or parsed_end_time:
            range_start = parsed_start_time or (parsed_end_time - timedelta(hours=24) if parsed_end_time else datetime.now(timezone.utc) - timedelta(hours=24))
            range_end = parsed_end_time or datetime.now(timezone.utc)
            effective_time_filter = "custom"
        else:
            delta = time_map.get(time_filter, timedelta(hours=24))
            range_end = datetime.now(timezone.utc)
            range_start = range_end - delta
            effective_time_filter = time_filter
        
        query: Dict[str, Any] = {
            "created_at": {"$gte": range_start, "$lte": range_end}
        }
        owner_id = _owner_user_id(current_user)
        if owner_id:
            query["owner_user_id"] = owner_id

        normalized_thread = (thread_id or "").strip().lower()
        if normalized_thread not in ("", "all", "*"):
            query["thread_id"] = thread_id

        threat_events = list(db["threat_events"].find(query).sort("created_at", -1))
        
        threat_locations: Dict[str, Dict[str, Any]] = {}
        threat_data = []
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        log_type_counts: Dict[str, int] = {}
        
        for event in threat_events:
            payload = enrich_event_payload(event)
            source_ip = str(payload.get("source_ip", "unknown"))

            country = _country_from_ip(source_ip=source_ip, payload=payload)
            coordinates = _coordinates_for_country(country)

            severity = str(payload.get("severity", "MEDIUM")).upper()
            if severity == "CRITICAL":
                severity_counts["critical"] += 1
            elif severity == "HIGH":
                severity_counts["high"] += 1
            elif severity == "MEDIUM":
                severity_counts["medium"] += 1
            else:
                severity_counts["low"] += 1

            log_type = str(event.get("log_type", "unknown")).lower()
            log_type_counts[log_type] = log_type_counts.get(log_type, 0) + 1

            if country not in threat_locations:
                threat_locations[country] = {
                    "country": country,
                    "count": 0,
                    "lat": coordinates["lat"],
                    "lng": coordinates["lng"],
                }
            threat_locations[country]["count"] += 1
            
            threat_data.append({
                "_id": str(event.get("_id", "")),
                "country": country,
                "source_ip": source_ip,
                "log_type": event.get("log_type", "unknown"),
                "severity": severity,
                "risk_score": payload.get("risk_score"),
                "anomaly_flags": payload.get("anomaly_flags", []),
                "timestamp": _to_json_safe(event.get("created_at")),
                "description": payload.get("query", payload.get("command", "Threat detected")),
                "lat": coordinates["lat"],
                "lng": coordinates["lng"],
            })

        locations = sorted(
            list(threat_locations.values()),
            key=lambda item: item["count"],
            reverse=True,
        )

        top_log_types = [
            {"type": log_type.replace("_", " ").title(), "count": count}
            for log_type, count in sorted(log_type_counts.items(), key=lambda pair: pair[1], reverse=True)
        ]
        
        return {
            "status": "success",
            "thread_id": thread_id,
            "thread_scope": "all" if normalized_thread in ("", "all", "*") else "single",
            "time_filter": effective_time_filter,
            "window_start": _to_json_safe(range_start),
            "window_end": _to_json_safe(range_end),
            "location_count": len(locations),
            "threat_count": len(threat_data),
            "severity_counts": severity_counts,
            "top_log_types": top_log_types,
            "locations": locations,
            "threats": threat_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching threat map: {str(e)}")

def _determine_log_status(payload: Dict[str, Any]) -> str:
    """Determine log status based on event payload."""
    severity = payload.get("severity", "").upper()
    if severity in ["CRITICAL", "HIGH"]:
        return "flagged"
    
    # Check for common failure indicators
    if "failed_attempts" in payload or payload.get("auth_result") == "failure":
        return "failure"
    
    if payload.get("auth_result") == "success" or payload.get("scan_type"):
        return "success"
    
    return "normal"


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
