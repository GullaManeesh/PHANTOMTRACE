"""
MongoDB Database Module for PhantomTrace Backend

Provides MongoDB connection management and schema definitions for all agent data.
Collections:
- agent_results: Stores agent query responses and parsed analysis
- threat_events: Stores detected threat events from various log sources
- agent_flags: Stores security flags inferred from agent analysis
- network_agent_states: Stores network analysis state and session data
"""

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv
import json
from detection_engine import correlate_attack_chains, enrich_event_payload


# Load environment variables
def _load_env() -> None:
    """Load environment variables from .env or .env.example"""
    base_dir = os.path.dirname(__file__)
    if not load_dotenv(os.path.join(base_dir, ".env")):
        load_dotenv(os.path.join(base_dir, ".env.example"))


_load_env()


# ==================== MONGODB CONNECTION ====================

class MongoDBConnection:
    """Singleton MongoDB connection manager"""
    _instance = None
    _client: Optional[MongoClient] = None
    _db = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @classmethod
    def get_client(cls) -> MongoClient:
        """Get or create MongoDB client"""
        if cls._client is None:
            mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
            try:
                cls._client = MongoClient(
                    mongo_uri,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=10000,
                )
                # Verify connection
                cls._client.admin.command('ping')
                print(f"✓ Connected to MongoDB at {mongo_uri}")
            except (ConnectionFailure, ServerSelectionTimeoutError) as e:
                print(f"✗ Failed to connect to MongoDB: {e}")
                raise

        return cls._client

    @classmethod
    def get_database(cls, db_name: str = "phantom_trace"):
        """Get MongoDB database instance"""
        if cls._db is None:
            client = cls.get_client()
            cls._db = client[db_name]
        return cls._db

    @classmethod
    def close(cls):
        """Close MongoDB connection"""
        if cls._client is not None:
            cls._client.close()
            cls._client = None
            cls._db = None


# ==================== COLLECTION INITIALIZATION ====================

def initialize_collections() -> None:
    """Create collections and indexes in MongoDB"""
    db = MongoDBConnection.get_database()

    # Create collections if they don't exist
    collections = db.list_collection_names()

    # 1. Agent Results Collection
    if "agent_results" not in collections:
        db.create_collection("agent_results")
        print("✓ Created collection: agent_results")

    agent_results = db["agent_results"]
    agent_results.create_index([("thread_id", ASCENDING), ("created_at", DESCENDING)])
    agent_results.create_index([("agent_name", ASCENDING)])
    agent_results.create_index([("created_at", DESCENDING)])
    agent_results.create_index([("owner_user_id", ASCENDING), ("thread_id", ASCENDING), ("created_at", DESCENDING)])

    # 2. Threat Events Collection
    if "threat_events" not in collections:
        db.create_collection("threat_events")
        print("✓ Created collection: threat_events")

    threat_events = db["threat_events"]
    threat_events.create_index([("thread_id", ASCENDING), ("created_at", DESCENDING)])
    threat_events.create_index([("log_type", ASCENDING)])
    threat_events.create_index([("log_source", ASCENDING)])
    threat_events.create_index([("created_at", DESCENDING)])
    threat_events.create_index([("owner_user_id", ASCENDING), ("thread_id", ASCENDING), ("created_at", DESCENDING)])

    # 3. Agent Flags Collection
    if "agent_flags" not in collections:
        db.create_collection("agent_flags")
        print("✓ Created collection: agent_flags")

    agent_flags = db["agent_flags"]
    agent_flags.create_index([("thread_id", ASCENDING), ("agent_name", ASCENDING)])
    agent_flags.create_index([("thread_id", ASCENDING), ("created_at", DESCENDING)])
    agent_flags.create_index([("flag_key", ASCENDING)])
    agent_flags.create_index([("enabled", ASCENDING)])
    agent_flags.create_index([("owner_user_id", ASCENDING), ("thread_id", ASCENDING), ("agent_name", ASCENDING)])

    # 4. Network Agent States Collection
    if "network_agent_states" not in collections:
        db.create_collection("network_agent_states")
        print("✓ Created collection: network_agent_states")

    network_states = db["network_agent_states"]
    network_states.create_index([("session_id", ASCENDING)])
    network_states.create_index([("thread_id", ASCENDING)])
    network_states.create_index([("source_ip", ASCENDING)])
    network_states.create_index([("created_at", DESCENDING)])

    # 5. Sessions Collection
    if "sessions" not in collections:
        db.create_collection("sessions")
        print("✓ Created collection: sessions")

    sessions = db["sessions"]
    sessions.create_index([("thread_id", ASCENDING)])
    sessions.create_index([("created_at", DESCENDING)])

    # 6. Auth Collection
    if "auth" not in collections:
        db.create_collection("auth")
        print("✓ Created collection: auth")

    auth = db["auth"]
    auth.create_index([("email", ASCENDING)], unique=True)
    auth.create_index([("api_key_prefix", ASCENDING)])
    auth.create_index([("api_keys.api_key_prefix", ASCENDING)])
    auth.create_index([("created_at", DESCENDING)])


# ==================== AGENT RESULTS OPERATIONS ====================

def _with_owner_scope(base_query: Dict[str, Any], owner_user_id: Optional[str]) -> Dict[str, Any]:
    scoped_query = dict(base_query)
    if owner_user_id:
        scoped_query["owner_user_id"] = owner_user_id
    return scoped_query


def _is_all_threads(thread_id: str) -> bool:
    normalized = (thread_id or "").strip().lower()
    return normalized in ("", "all", "*")


def _thread_scope_query(thread_id: str, owner_user_id: Optional[str] = None) -> Dict[str, Any]:
    query: Dict[str, Any] = {}
    if owner_user_id:
        query["owner_user_id"] = owner_user_id
    if not _is_all_threads(thread_id):
        query["thread_id"] = thread_id.strip()
    return query


def store_agent_result(
    *,
    thread_id: str,
    agent_name: str,
    user_message: str,
    raw_response: str,
    parsed_response: Dict[str, Any],
    owner_user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Store agent result in MongoDB"""
    db = MongoDBConnection.get_database()
    collection = db["agent_results"]

    record = {
        "thread_id": thread_id.strip(),
        "agent_name": agent_name.strip().lower(),
        "user_message": user_message.strip(),
        "raw_response": raw_response.strip(),
        "parsed_response": parsed_response,
        "created_at": datetime.now(timezone.utc),
    }
    if owner_user_id:
        record["owner_user_id"] = owner_user_id

    result = collection.insert_one(record)
    record["_id"] = result.inserted_id
    return record


def get_cached_agent_results(thread_id: str, limit: int = 100, owner_user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve cached agent results for a thread"""
    db = MongoDBConnection.get_database()
    collection = db["agent_results"]

    results = list(
        collection.find(_thread_scope_query(thread_id, owner_user_id))
        .sort("created_at", ASCENDING)
        .limit(limit)
    )

    return results


def combine_cached_agent_results(thread_id: str, owner_user_id: Optional[str] = None) -> Dict[str, Any]:
    """Combine all cached agent results for a thread"""
    db = MongoDBConnection.get_database()
    collection = db["agent_results"]

    cached_results = list(
        collection.find(_thread_scope_query(thread_id, owner_user_id))
        .sort("created_at", ASCENDING)
    )

    combined_by_agent: Dict[str, Dict[str, Any]] = {}
    ordered_findings: List[Dict[str, Any]] = []

    for result in cached_results:
        agent_name = result["agent_name"]
        parsed = result["parsed_response"]
        combined_by_agent[agent_name] = {
            "latest_user_message": result["user_message"],
            "raw_response": result["raw_response"],
            "parsed_response": parsed,
            "created_at": result["created_at"].isoformat(),
        }
        ordered_findings.append(
            {
                "agent_name": agent_name,
                "summary": parsed.get("summary", ""),
                "findings": parsed.get("findings", []),
                "created_at": result["created_at"].isoformat(),
            }
        )

    total_findings = sum(len(item.get("findings", [])) for item in ordered_findings)
    latest_context = (
        ordered_findings[-1]["summary"] if ordered_findings else "No cached specialist findings were found."
    )

    return {
        "thread_id": thread_id,
        "total_agents": len(combined_by_agent),
        "total_findings": total_findings,
        "latest_context": latest_context,
        "by_agent": combined_by_agent,
        "ordered_findings": ordered_findings,
    }


# ==================== THREAT EVENTS OPERATIONS ====================

def store_threat_event(
    *,
    thread_id: str,
    log_source: str,
    log_type: str,
    event_payload: Dict[str, Any],
    owner_user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Store threat event in MongoDB"""
    db = MongoDBConnection.get_database()
    collection = db["threat_events"]

    record = {
        "thread_id": thread_id.strip(),
        "log_source": (log_source or "unknown").strip().lower(),
        "log_type": (log_type or "unknown").strip().lower(),
        "event_payload": event_payload,
        "created_at": datetime.now(timezone.utc),
    }
    if owner_user_id:
        record["owner_user_id"] = owner_user_id

    result = collection.insert_one(record)
    record["_id"] = result.inserted_id
    return record


def get_threat_events(thread_id: str, limit: int = 25, owner_user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve threat events for a thread"""
    db = MongoDBConnection.get_database()
    collection = db["threat_events"]

    events = list(
        collection.find(_thread_scope_query(thread_id, owner_user_id))
        .sort("created_at", DESCENDING)
        .limit(limit)
    )

    return events


def get_latest_threat_event(thread_id: str, owner_user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Get the most recent threat event for a thread"""
    db = MongoDBConnection.get_database()
    collection = db["threat_events"]

    event = collection.find_one(
        _thread_scope_query(thread_id, owner_user_id),
        sort=[("created_at", DESCENDING)]
    )

    return event


def get_latest_threat_event_for_agent(
    thread_id: str,
    agent_name: str,
    owner_user_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Get the most recent event for a specific agent's domain.
    Falls back to latest event if no preferred type found.
    """
    db = MongoDBConnection.get_database()
    collection = db["threat_events"]

    normalized_agent = agent_name.strip().lower()
    preferred_types: Dict[str, List[str]] = {
        "network": ["network"],
        "auth": ["auth", "access"],
        "behavioural": ["behavioral", "behavioural", "activity"],
        "orchestrator": ["network", "auth", "behavioral", "behavioural", "activity", "malware"],
        "explainer": ["network", "auth", "behavioral", "behavioural", "activity", "malware"],
    }

    events = list(
        collection.find(_thread_scope_query(thread_id, owner_user_id))
        .sort("created_at", DESCENDING)
        .limit(50)
    )

    if not events:
        return None

    desired = set(preferred_types.get(normalized_agent, []))
    if not desired:
        return events[0]

    for event in events:
        log_type = (event.get("log_type") or "").strip().lower()
        log_source = (event.get("log_source") or "").strip().lower()
        if log_type in desired or log_source in desired:
            return event

    return events[0]


# ==================== AGENT FLAGS OPERATIONS ====================

def store_agent_flags(
    *,
    thread_id: str,
    agent_name: str,
    flags: List[Dict[str, Any]],
    owner_user_id: Optional[str] = None,
) -> None:
    """Store/update agent flags in MongoDB"""
    db = MongoDBConnection.get_database()
    collection = db["agent_flags"]

    normalized_agent = agent_name.strip().lower()
    created_at = datetime.now(timezone.utc)
    delete_query: Dict[str, Any] = {
        "thread_id": thread_id,
        "agent_name": normalized_agent,
    }
    if owner_user_id:
        delete_query["owner_user_id"] = owner_user_id

    # Delete existing flags for this agent
    collection.delete_many(delete_query)

    # Insert new flags
    for flag in flags:
        collection.insert_one(
            {
                "thread_id": thread_id,
                "agent_name": normalized_agent,
                "flag_key": (flag.get("flag_key") or "unknown").strip().lower(),
                "enabled": bool(flag.get("enabled", True)),
                "confidence": float(flag.get("confidence", 0.0)),
                "evidence": flag.get("evidence"),
                "created_at": created_at,
                "owner_user_id": owner_user_id,
            }
        )


def get_enabled_flags(thread_id: str, owner_user_id: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """Get all enabled flags for a thread, grouped by agent"""
    db = MongoDBConnection.get_database()
    collection = db["agent_flags"]

    flags = list(
        collection.find(_thread_scope_query(thread_id, owner_user_id) | {"enabled": True})
        .sort([("agent_name", ASCENDING), ("confidence", DESCENDING)])
    )

    by_agent: Dict[str, List[Dict[str, Any]]] = {}
    for flag in flags:
        agent_name = flag["agent_name"]
        by_agent.setdefault(agent_name, []).append(
            {
                "flag_key": flag["flag_key"],
                "enabled": flag["enabled"],
                "confidence": flag["confidence"],
                "evidence": flag["evidence"],
                "created_at": flag["created_at"].isoformat(),
            }
        )

    return by_agent


def get_all_flags(thread_id: str, owner_user_id: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """Get all flags (enabled and disabled) for a thread"""
    db = MongoDBConnection.get_database()
    collection = db["agent_flags"]

    flags = list(
        collection.find(_thread_scope_query(thread_id, owner_user_id))
        .sort([("agent_name", ASCENDING), ("enabled", DESCENDING)])
    )

    by_agent: Dict[str, List[Dict[str, Any]]] = {}
    for flag in flags:
        agent_name = flag["agent_name"]
        by_agent.setdefault(agent_name, []).append(
            {
                "flag_key": flag["flag_key"],
                "enabled": flag["enabled"],
                "confidence": flag["confidence"],
                "evidence": flag["evidence"],
                "created_at": flag["created_at"].isoformat(),
            }
        )

    return by_agent


# ==================== NETWORK AGENT STATE OPERATIONS ====================

def store_network_agent_state(
    *,
    thread_id: str,
    session_id: str,
    source_ip: str,
    destination_ip: str,
    destination_port: int,
    protocol: str,
    bytes_in: int,
    bytes_out: int,
    connection_count: int,
    dns_queries: List[str],
    http_uri: Optional[str] = None,
    user_agent: Optional[str] = None,
    traffic_baseline: Optional[Dict[str, Any]] = None,
    geo_data: Optional[Dict[str, Any]] = None,
    ip_reputation_score: Optional[float] = None,
    anomaly_flags: Optional[List[str]] = None,
    confidence: Optional[float] = None,
) -> Dict[str, Any]:
    """Store network agent state in MongoDB"""
    db = MongoDBConnection.get_database()
    collection = db["network_agent_states"]

    record = {
        "thread_id": thread_id,
        "session_id": session_id,
        "source_ip": source_ip,
        "destination_ip": destination_ip,
        "destination_port": destination_port,
        "protocol": protocol.upper(),
        "bytes_in": bytes_in,
        "bytes_out": bytes_out,
        "connection_count": connection_count,
        "dns_queries": dns_queries or [],
        "http_uri": http_uri,
        "user_agent": user_agent,
        "traffic_baseline": traffic_baseline or {},
        "geo_data": geo_data or {},
        "ip_reputation_score": ip_reputation_score or 0.0,
        "anomaly_flags": anomaly_flags or [],
        "confidence": confidence or 0.0,
        "created_at": datetime.now(timezone.utc),
    }

    result = collection.insert_one(record)
    record["_id"] = result.inserted_id
    return record


def get_network_agent_state(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve network agent state by session ID"""
    db = MongoDBConnection.get_database()
    collection = db["network_agent_states"]

    state = collection.find_one({"session_id": session_id})
    return state


def get_network_agent_states_by_thread(thread_id: str) -> List[Dict[str, Any]]:
    """Retrieve all network agent states for a thread"""
    db = MongoDBConnection.get_database()
    collection = db["network_agent_states"]

    states = list(
        collection.find({"thread_id": thread_id})
        .sort("created_at", DESCENDING)
    )

    return states


def update_network_agent_state(session_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update network agent state"""
    db = MongoDBConnection.get_database()
    collection = db["network_agent_states"]

    result = collection.find_one_and_update(
        {"session_id": session_id},
        {"$set": updates},
        return_document=True
    )

    return result


# ==================== SESSION MANAGEMENT ====================

def create_session(
    *,
    thread_id: str,
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create a new session record"""
    db = MongoDBConnection.get_database()
    collection = db["sessions"]

    record = {
        "thread_id": thread_id,
        "user_id": user_id,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = collection.insert_one(record)
    record["_id"] = result.inserted_id
    return record


def get_session(thread_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve session by thread ID"""
    db = MongoDBConnection.get_database()
    collection = db["sessions"]

    session = collection.find_one({"thread_id": thread_id})
    return session


def update_session(thread_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update session metadata"""
    db = MongoDBConnection.get_database()
    collection = db["sessions"]

    updates["updated_at"] = datetime.now(timezone.utc)

    result = collection.find_one_and_update(
        {"thread_id": thread_id},
        {"$set": updates},
        return_document=True
    )

    return result


# ==================== EXPLAINER CONTEXT ====================

def build_explainer_context(thread_id: str, user_message: str, owner_user_id: Optional[str] = None) -> str:
    """Build context for explainer agent from all cached data"""
    combined_results = combine_cached_agent_results(thread_id, owner_user_id=owner_user_id)
    enabled_flags = get_enabled_flags(thread_id, owner_user_id=owner_user_id)
    threat_events = get_threat_events(thread_id, limit=7, owner_user_id=owner_user_id)

    if not combined_results["by_agent"] and not enabled_flags and not threat_events and not _is_all_threads(thread_id):
        combined_results = combine_cached_agent_results("all", owner_user_id=owner_user_id)
        enabled_flags = get_enabled_flags("all", owner_user_id=owner_user_id)
        threat_events = get_threat_events("all", limit=7, owner_user_id=owner_user_id)

    if not combined_results["by_agent"] and not enabled_flags and not threat_events:
        return user_message.strip()

    # Format agent results
    formatted_agents: List[str] = []
    for agent_name, payload in combined_results["by_agent"].items():
        parsed = payload["parsed_response"]
        findings = parsed.get("findings", [])
        finding_lines = (
            "\n".join(f"  - {finding}" for finding in findings[:10])
            or "  - No parsed findings captured"
        )
        formatted_agents.append(
            "\n".join(
                [
                    f"{agent_name}:",
                    f"  summary: {parsed.get('summary', '')}",
                    "  findings:",
                    finding_lines,
                    f"  source_message: {payload['latest_user_message']}",
                ]
            )
        )

    cache_block = "\n\n".join(formatted_agents) if formatted_agents else "No cached specialist findings were found."

    # Format flags
    flag_lines: List[str] = []
    if enabled_flags:
        for agent_name, flags in enabled_flags.items():
            for flag in flags:
                flag_lines.append(f"- {agent_name}.{flag['flag_key']} (confidence={flag['confidence']:.2f})")
    else:
        flag_lines.append("- No enabled flags recorded for this thread")

    # Format threat events (recent history, not just latest)
    event_block = "No stored threat events found for this thread."
    if threat_events:
        attack_chains = correlate_attack_chains(threat_events)
        event_lines = []
        for idx, event in enumerate(threat_events, 1):
            enriched_payload = enrich_event_payload(event)
            event_summary = (
                f"{idx}. [{event['log_type'].upper()}] {event['log_source']} - "
                f"{enriched_payload.get('severity', 'UNKNOWN')} "
                f"(risk={enriched_payload.get('risk_score', 'n/a')}) - "
                f"{enriched_payload.get('action', 'unknown action')} - "
                f"flags={enriched_payload.get('anomaly_flags', [])}"
            )
            event_lines.append(event_summary)
        event_list = "\n".join(event_lines)
        chain_block = (
            json.dumps(attack_chains[:3], default=str, ensure_ascii=True)
            if attack_chains
            else "No correlated attack chains detected."
        )
        latest_payload = enrich_event_payload(threat_events[0])
        event_block = (
            f"Recent threat events (newest first):\n{event_list}\n\n"
            f"Correlated attack chains:\n{chain_block}\n\n"
            f"Full details of latest event:\n"
            f"  Source/Type: {threat_events[0]['log_source']}/{threat_events[0]['log_type']}\n"
            f"  Payload: {json.dumps(latest_payload, ensure_ascii=True)}"
        )

    flag_block = "\n".join(flag_lines)
    return (
        "Use the cached specialist findings below as primary context before answering.\n\n"
        f"Thread ID: {thread_id}\n"
        f"Recent threat events:\n{event_block}\n\n"
        f"Enabled flags:\n{flag_block}\n\n"
        f"Cached specialist findings:\n{cache_block}\n\n"
        f"User request:\n{user_message.strip()}"
    )


# ==================== HEALTH CHECKS ====================

def health_check() -> Dict[str, Any]:
    """Check MongoDB connection and collection status"""
    try:
        db = MongoDBConnection.get_database()
        collections = db.list_collection_names()

        return {
            "status": "healthy",
            "database": db.name,
            "collections": collections,
            "required_collections_present": all(
                col in collections
                for col in ["agent_results", "threat_events", "agent_flags", "network_agent_states", "sessions"]
            ),
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
        }


# ==================== INITIALIZATION ====================

# Initialize collections when module is imported
try:
    initialize_collections()
except Exception as e:
    print(f"Warning: Could not initialize MongoDB collections: {e}")
