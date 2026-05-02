import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


BASE_DIR = Path(__file__).resolve().parent
CACHE_DB_PATH = BASE_DIR / "agent_results_cache.sqlite3"


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(CACHE_DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_cache() -> None:
    CACHE_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS agent_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                thread_id TEXT NOT NULL,
                agent_name TEXT NOT NULL,
                user_message TEXT NOT NULL,
                raw_response TEXT NOT NULL,
                parsed_response TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_agent_results_thread_id ON agent_results(thread_id, created_at)"
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS threat_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                thread_id TEXT NOT NULL,
                log_source TEXT NOT NULL,
                log_type TEXT NOT NULL,
                event_payload TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_threat_events_thread_id ON threat_events(thread_id, created_at)"
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS agent_flags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                thread_id TEXT NOT NULL,
                agent_name TEXT NOT NULL,
                flag_key TEXT NOT NULL,
                enabled INTEGER NOT NULL,
                confidence REAL NOT NULL,
                evidence TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_agent_flags_thread_id ON agent_flags(thread_id, created_at)"
        )


initialize_cache()


def _ensure_cache_ready() -> None:
    initialize_cache()


def _normalize_agent_name(agent_name: str) -> str:
    return agent_name.strip().lower()


def _split_response_lines(raw_response: str) -> List[str]:
    return [line.strip() for line in raw_response.splitlines() if line.strip()]


def _extract_findings(lines: Iterable[str]) -> List[str]:
    findings: List[str] = []
    for line in lines:
        cleaned = re.sub(r"^[-*•]+\s*", "", line)
        cleaned = re.sub(r"^\d+[).:-]?\s*", "", cleaned)
        if cleaned and cleaned not in findings:
            findings.append(cleaned)
    return findings


def parse_agent_response(raw_response: str) -> Dict[str, Any]:
    try:
        structured = json.loads(raw_response)
        if isinstance(structured, dict):
            summary = (
                structured.get("risk_summary")
                or structured.get("executive_summary")
                or structured.get("routing_reason")
                or structured.get("additional_notes")
                or "Structured agent response"
            )

            findings: List[str] = []
            for key in ("anomaly_flags", "top_findings", "evidence", "selected_agents"):
                value = structured.get(key)
                if isinstance(value, list):
                    findings.extend(str(item) for item in value if item)

            return {
                "summary": str(summary),
                "findings": findings,
                "sections": {"structured": [json.dumps(structured)]},
                "line_count": 1,
            }
    except json.JSONDecodeError:
        pass

    lines = _split_response_lines(raw_response)
    findings = _extract_findings(lines)

    sections: Dict[str, List[str]] = {}
    current_section: Optional[str] = None

    for line in lines:
        heading_match = re.match(r"^([A-Za-z][A-Za-z0-9 /_-]{1,60}):$", line)
        if heading_match:
            current_section = heading_match.group(1).strip().lower()
            sections.setdefault(current_section, [])
            continue

        if current_section:
            sections[current_section].append(line)

    summary = findings[0] if findings else (lines[0] if lines else raw_response.strip())

    return {
        "summary": summary,
        "findings": findings,
        "sections": sections,
        "line_count": len(lines),
    }


def store_threat_event(
    *,
    thread_id: str,
    log_source: str,
    log_type: str,
    event_payload: Dict[str, Any],
) -> Dict[str, Any]:
    _ensure_cache_ready()
    record = {
        "thread_id": thread_id.strip(),
        "log_source": (log_source or "unknown").strip().lower(),
        "log_type": (log_type or "unknown").strip().lower(),
        "event_payload": event_payload,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    with _connect() as connection:
        connection.execute(
            """
            INSERT INTO threat_events (
                thread_id, log_source, log_type, event_payload, created_at
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (
                record["thread_id"],
                record["log_source"],
                record["log_type"],
                json.dumps(record["event_payload"]),
                record["created_at"],
            ),
        )

    return record


def get_threat_events(thread_id: str, *, limit: int = 25) -> List[Dict[str, Any]]:
    _ensure_cache_ready()
    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT thread_id, log_source, log_type, event_payload, created_at
            FROM threat_events
            WHERE thread_id = ?
            ORDER BY datetime(created_at) DESC, id DESC
            LIMIT ?
            """,
            (thread_id, limit),
        ).fetchall()

    return [
        {
            "thread_id": row["thread_id"],
            "log_source": row["log_source"],
            "log_type": row["log_type"],
            "event_payload": json.loads(row["event_payload"]),
            "created_at": row["created_at"],
        }
        for row in rows
    ]


def get_latest_threat_event(thread_id: str) -> Optional[Dict[str, Any]]:
    events = get_threat_events(thread_id, limit=1)
    return events[0] if events else None


def get_latest_threat_event_for_agent(thread_id: str, agent_name: str) -> Optional[Dict[str, Any]]:
    """
    Returns the most recent event for a specific specialist domain when available,
    and falls back to the latest event in the thread.
    """
    normalized_agent = _normalize_agent_name(agent_name)
    preferred_types: Dict[str, List[str]] = {
        "network": ["network"],
        "auth": ["auth", "access"],
        "behavioural": ["behavioral", "behavioural", "activity"],
        "orchestrator": ["network", "auth", "behavioral", "behavioural", "activity", "malware"],
        "explainer": ["network", "auth", "behavioral", "behavioural", "activity", "malware"],
    }

    events = get_threat_events(thread_id, limit=50)
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


def infer_flags_from_agent_response(agent_name: str, raw_response: str) -> List[Dict[str, Any]]:
    text = raw_response.lower()
    try:
        structured = json.loads(raw_response)
        if isinstance(structured, dict):
            text = json.dumps(structured).lower()
    except json.JSONDecodeError:
        pass

    normalized_agent = _normalize_agent_name(agent_name)
    catalog: Dict[str, List[Dict[str, Any]]] = {
        "network": [
            {"flag_key": "port_scan", "keywords": ["port scan", "reconnaissance", "horizontal scan"], "confidence": 0.75},
            {"flag_key": "c2_beacon", "keywords": ["c2", "beacon", "command and control"], "confidence": 0.85},
            {"flag_key": "dns_tunnel", "keywords": ["dns tunnel", "dns tunneling", "high entropy dns"], "confidence": 0.82},
            {"flag_key": "possible_exfiltration", "keywords": ["exfiltration", "bytes out spike", "data egress"], "confidence": 0.8},
        ],
        "auth": [
            {"flag_key": "brute_force", "keywords": ["brute force", "failed login", "password spray"], "confidence": 0.78},
            {"flag_key": "credential_stuffing", "keywords": ["credential stuffing", "credential spray", "multiple accounts"], "confidence": 0.81},
            {"flag_key": "mfa_bypass", "keywords": ["mfa bypass", "mfa fatigue", "mfa anomaly"], "confidence": 0.86},
            {"flag_key": "password_reset_abuse", "keywords": ["password reset abuse", "reset attempts", "account recovery abuse"], "confidence": 0.84},
            {"flag_key": "token_replay", "keywords": ["token replay", "session replay", "same token"], "confidence": 0.88},
            {"flag_key": "impossible_mfa_sequence", "keywords": ["impossible mfa", "mfa sequence", "mfa without password"], "confidence": 0.87},
            {"flag_key": "dormant_account_reactivation", "keywords": ["dormant account", "reactivated account", "inactive account"], "confidence": 0.78},
            {"flag_key": "service_account_misuse", "keywords": ["service account misuse", "interactive service account", "svc_"], "confidence": 0.86},
            {"flag_key": "impossible_travel", "keywords": ["impossible travel", "new country", "off-hours login"], "confidence": 0.8},
            {"flag_key": "privilege_escalation", "keywords": ["privilege escalation", "admin api", "permissions change"], "confidence": 0.83},
        ],
        "behavioural": [
            {"flag_key": "data_exfiltration", "keywords": ["data exfiltration", "bytes out", "bulk export"], "confidence": 0.82},
            {"flag_key": "mass_file_reads", "keywords": ["mass file reads", "many files", "bulk reads"], "confidence": 0.84},
            {"flag_key": "bulk_export", "keywords": ["bulk export", "records exported", "large export"], "confidence": 0.88},
            {"flag_key": "unusual_admin_action", "keywords": ["unusual admin", "admin action", "role change"], "confidence": 0.82},
            {"flag_key": "privilege_chaining", "keywords": ["privilege chaining", "role change", "api key creation"], "confidence": 0.9},
            {"flag_key": "suspicious_process_ancestry", "keywords": ["suspicious process", "process ancestry", "powershell", "encoded command"], "confidence": 0.91},
            {"flag_key": "off_hours_access", "keywords": ["off-hours", "unusual time", "temporal anomaly"], "confidence": 0.77},
            {"flag_key": "new_resource_access", "keywords": ["new resource", "first-time access", "lateral movement"], "confidence": 0.74},
            {"flag_key": "peer_group_deviation", "keywords": ["peer group", "deviation score", "baseline deviation"], "confidence": 0.76},
        ],
    }

    inferred_flags: List[Dict[str, Any]] = []
    for rule in catalog.get(normalized_agent, []):
        if any(keyword in text for keyword in rule["keywords"]):
            inferred_flags.append(
                {
                    "flag_key": rule["flag_key"],
                    "enabled": True,
                    "confidence": rule["confidence"],
                    "evidence": f"Matched keywords: {', '.join(rule['keywords'])}",
                }
            )

    return inferred_flags


def store_agent_flags(
    *,
    thread_id: str,
    agent_name: str,
    flags: List[Dict[str, Any]],
) -> None:
    _ensure_cache_ready()
    normalized_agent = _normalize_agent_name(agent_name)
    created_at = datetime.now(timezone.utc).isoformat()

    with _connect() as connection:
        connection.execute(
            "DELETE FROM agent_flags WHERE thread_id = ? AND agent_name = ?",
            (thread_id, normalized_agent),
        )

        for flag in flags:
            connection.execute(
                """
                INSERT INTO agent_flags (
                    thread_id, agent_name, flag_key, enabled, confidence, evidence, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    thread_id,
                    normalized_agent,
                    (flag.get("flag_key") or "unknown").strip().lower(),
                    1 if flag.get("enabled", True) else 0,
                    float(flag.get("confidence", 0.0)),
                    flag.get("evidence"),
                    created_at,
                ),
            )


def get_enabled_flags(thread_id: str) -> Dict[str, List[Dict[str, Any]]]:
    _ensure_cache_ready()
    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT agent_name, flag_key, enabled, confidence, evidence, created_at
            FROM agent_flags
            WHERE thread_id = ? AND enabled = 1
            ORDER BY agent_name ASC, confidence DESC, flag_key ASC
            """,
            (thread_id,),
        ).fetchall()

    by_agent: Dict[str, List[Dict[str, Any]]] = {}
    for row in rows:
        by_agent.setdefault(row["agent_name"], []).append(
            {
                "flag_key": row["flag_key"],
                "enabled": bool(row["enabled"]),
                "confidence": row["confidence"],
                "evidence": row["evidence"],
                "created_at": row["created_at"],
            }
        )

    return by_agent


def store_agent_result(
    *,
    thread_id: str,
    agent_name: str,
    user_message: str,
    raw_response: str,
) -> Dict[str, Any]:
    _ensure_cache_ready()
    parsed_response = parse_agent_response(raw_response)
    record = {
        "thread_id": thread_id,
        "agent_name": _normalize_agent_name(agent_name),
        "user_message": user_message.strip(),
        "raw_response": raw_response.strip(),
        "parsed_response": parsed_response,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    with _connect() as connection:
        connection.execute(
            """
            INSERT INTO agent_results (
                thread_id, agent_name, user_message, raw_response, parsed_response, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                record["thread_id"],
                record["agent_name"],
                record["user_message"],
                record["raw_response"],
                json.dumps(record["parsed_response"]),
                record["created_at"],
            ),
        )

    return record


def get_cached_agent_results(thread_id: str) -> List[Dict[str, Any]]:
    _ensure_cache_ready()
    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT thread_id, agent_name, user_message, raw_response, parsed_response, created_at
            FROM agent_results
            WHERE thread_id = ?
            ORDER BY datetime(created_at) ASC, id ASC
            """,
            (thread_id,),
        ).fetchall()

    results: List[Dict[str, Any]] = []
    for row in rows:
        results.append(
            {
                "thread_id": row["thread_id"],
                "agent_name": row["agent_name"],
                "user_message": row["user_message"],
                "raw_response": row["raw_response"],
                "parsed_response": json.loads(row["parsed_response"]),
                "created_at": row["created_at"],
            }
        )
    return results


def combine_cached_agent_results(thread_id: str) -> Dict[str, Any]:
    _ensure_cache_ready()
    cached_results = get_cached_agent_results(thread_id)
    combined_by_agent: Dict[str, Dict[str, Any]] = {}
    ordered_findings: List[Dict[str, Any]] = []

    for result in cached_results:
        agent_name = result["agent_name"]
        parsed = result["parsed_response"]
        combined_by_agent[agent_name] = {
            "latest_user_message": result["user_message"],
            "raw_response": result["raw_response"],
            "parsed_response": parsed,
            "created_at": result["created_at"],
        }
        ordered_findings.append(
            {
                "agent_name": agent_name,
                "summary": parsed.get("summary", ""),
                "findings": parsed.get("findings", []),
                "created_at": result["created_at"],
            }
        )

    total_findings = sum(len(item.get("findings", [])) for item in ordered_findings)
    latest_context = ordered_findings[-1]["summary"] if ordered_findings else "No cached specialist findings were found."

    return {
        "thread_id": thread_id,
        "total_agents": len(combined_by_agent),
        "total_findings": total_findings,
        "latest_context": latest_context,
        "by_agent": combined_by_agent,
        "ordered_findings": ordered_findings,
    }


def build_explainer_context(thread_id: str, user_message: str) -> str:
    combined_results = combine_cached_agent_results(thread_id)
    enabled_flags = get_enabled_flags(thread_id)
    latest_event = get_latest_threat_event(thread_id)

    if not combined_results["by_agent"] and not enabled_flags and not latest_event:
        return user_message.strip()

    formatted_agents: List[str] = []
    for agent_name, payload in combined_results["by_agent"].items():
        parsed = payload["parsed_response"]
        findings = parsed.get("findings", [])
        finding_lines = "\n".join(f"  - {finding}" for finding in findings[:10]) or "  - No parsed findings captured"
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
    flag_lines: List[str] = []
    if enabled_flags:
        for agent_name, flags in enabled_flags.items():
            for flag in flags:
                flag_lines.append(
                    f"- {agent_name}.{flag['flag_key']} (confidence={flag['confidence']:.2f})"
                )
    else:
        flag_lines.append("- No enabled flags recorded for this thread")

    event_block = "No stored threat event found for this thread."
    if latest_event:
        event_block = (
            f"Latest event source/type: {latest_event['log_source']}/{latest_event['log_type']}\n"
            f"Event payload: {json.dumps(latest_event['event_payload'], ensure_ascii=True)}"
        )

    flag_block = "\n".join(flag_lines)
    return (
        "Use the cached specialist findings below as primary context before answering.\n\n"
        f"Thread ID: {thread_id}\n"
        f"Latest threat event:\n{event_block}\n\n"
        f"Enabled flags:\n{flag_block}\n\n"
        f"Cached specialist findings:\n{cache_block}\n\n"
        f"User request:\n{user_message.strip()}"
    )
