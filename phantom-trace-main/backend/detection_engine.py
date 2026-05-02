from __future__ import annotations

import math
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Sequence


SEVERITY_SCORE_MAP = {
    "CRITICAL": 9.0,
    "HIGH": 7.0,
    "MEDIUM": 5.0,
    "LOW": 2.5,
}

ASSET_CRITICALITY_BONUS = {
    "critical": 1.4,
    "high": 1.0,
    "medium": 0.5,
    "low": 0.0,
}

FLAG_CONFIDENCE = {
    "port_scan": 0.86,
    "brute_force": 0.9,
    "successful_login_after_failures": 0.92,
    "password_reset_abuse": 0.84,
    "token_replay": 0.88,
    "impossible_mfa_sequence": 0.87,
    "dormant_account_reactivation": 0.78,
    "service_account_misuse": 0.86,
    "mass_file_reads": 0.84,
    "bulk_export": 0.88,
    "unusual_admin_action": 0.82,
    "privilege_chaining": 0.9,
    "suspicious_process_ancestry": 0.91,
    "dns_tunneling": 0.88,
    "dga_domain": 0.78,
    "rare_destination_port": 0.72,
    "c2_beacon": 0.86,
    "tls_fingerprint_anomaly": 0.74,
    "high_reputation_risk": 0.82,
    "data_exfiltration": 0.9,
}

MITRE_BY_FLAG = {
    "port_scan": [{"id": "T1046", "name": "Network Service Discovery"}],
    "brute_force": [{"id": "T1110", "name": "Brute Force"}],
    "successful_login_after_failures": [{"id": "T1078", "name": "Valid Accounts"}],
    "password_reset_abuse": [{"id": "T1098", "name": "Account Manipulation"}],
    "token_replay": [{"id": "T1550.001", "name": "Use Alternate Authentication Material: Application Access Token"}],
    "impossible_mfa_sequence": [{"id": "T1621", "name": "Multi-Factor Authentication Request Generation"}],
    "dormant_account_reactivation": [{"id": "T1078", "name": "Valid Accounts"}],
    "service_account_misuse": [{"id": "T1078.002", "name": "Domain Accounts"}],
    "mass_file_reads": [{"id": "T1005", "name": "Data from Local System"}],
    "bulk_export": [{"id": "T1567", "name": "Exfiltration Over Web Service"}],
    "unusual_admin_action": [{"id": "T1098", "name": "Account Manipulation"}],
    "privilege_chaining": [{"id": "T1068", "name": "Exploitation for Privilege Escalation"}],
    "suspicious_process_ancestry": [{"id": "T1059.001", "name": "PowerShell"}],
    "dns_tunneling": [{"id": "T1071.004", "name": "Application Layer Protocol: DNS"}],
    "dga_domain": [{"id": "T1568.002", "name": "Domain Generation Algorithms"}],
    "rare_destination_port": [{"id": "T1571", "name": "Non-Standard Port"}],
    "c2_beacon": [{"id": "T1071", "name": "Application Layer Protocol"}],
    "tls_fingerprint_anomaly": [{"id": "T1027", "name": "Obfuscated Files or Information"}],
    "data_exfiltration": [{"id": "T1041", "name": "Exfiltration Over C2 Channel"}],
}

RECOMMENDATIONS_BY_FLAG = {
    "brute_force": "Lock or step-up authenticate the targeted account and block the attacking source.",
    "successful_login_after_failures": "Reset credentials, revoke sessions, and review post-login activity.",
    "password_reset_abuse": "Throttle reset attempts and verify account recovery channels.",
    "token_replay": "Revoke the token/session and require fresh authentication.",
    "impossible_mfa_sequence": "Review MFA provider logs and invalidate suspicious approvals.",
    "service_account_misuse": "Disable interactive login for the service account and rotate secrets.",
    "mass_file_reads": "Review accessed files and temporarily restrict bulk read permissions.",
    "bulk_export": "Pause export capability for the account and inspect destination activity.",
    "unusual_admin_action": "Review admin audit logs and validate the change owner.",
    "privilege_chaining": "Revert unauthorized privilege changes and audit newly created credentials.",
    "suspicious_process_ancestry": "Isolate the host and collect process command-line evidence.",
    "dns_tunneling": "Block the domain and inspect DNS payloads for exfiltration.",
    "dga_domain": "Sinkhole or block generated domains and inspect affected hosts.",
    "rare_destination_port": "Validate the service and block unexpected egress ports.",
    "c2_beacon": "Isolate the host and block command-and-control infrastructure.",
    "data_exfiltration": "Contain the account/host and determine data exposure scope.",
}


def score_to_severity(score: float) -> str:
    if score >= 8.5:
        return "CRITICAL"
    if score >= 6.5:
        return "HIGH"
    if score >= 4.0:
        return "MEDIUM"
    return "LOW"


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple, set)):
        return " ".join(_as_text(item) for item in value)
    if isinstance(value, dict):
        return " ".join(f"{key}={_as_text(val)}" for key, val in value.items())
    return str(value)


def _lower(value: Any) -> str:
    return _as_text(value).strip().lower()


def _number(payload: Dict[str, Any], *keys: str, default: float = 0.0) -> float:
    for key in keys:
        value = payload.get(key)
        if value is None:
            continue
        try:
            return float(value)
        except (TypeError, ValueError):
            continue
    return default


def _bool(payload: Dict[str, Any], *keys: str) -> bool:
    for key in keys:
        value = payload.get(key)
        if isinstance(value, bool):
            return value
        if isinstance(value, str) and value.strip().lower() in ("1", "true", "yes"):
            return True
    return False


def _add_flag(flags: List[Dict[str, Any]], flag_key: str, evidence: str, confidence: Optional[float] = None) -> None:
    if any(flag["flag_key"] == flag_key for flag in flags):
        return
    flags.append(
        {
            "flag_key": flag_key,
            "confidence": round(confidence if confidence is not None else FLAG_CONFIDENCE.get(flag_key, 0.75), 2),
            "evidence": evidence,
        }
    )


def _entropy(text: str) -> float:
    if not text:
        return 0.0
    counts = {char: text.count(char) for char in set(text)}
    length = len(text)
    return -sum((count / length) * math.log2(count / length) for count in counts.values())


def _looks_like_dga(domain: str) -> bool:
    if "." not in domain:
        return False
    label = domain.split(".")[0]
    if len(label) < 12:
        return False
    vowel_count = sum(1 for char in label.lower() if char in "aeiou")
    digit_count = sum(1 for char in label if char.isdigit())
    return _entropy(label) >= 3.4 and (digit_count >= 3 or vowel_count / max(1, len(label)) < 0.25)


def detect_event_rules(event: Dict[str, Any]) -> Dict[str, Any]:
    payload = event.get("event_payload", {}) or {}
    log_type = _lower(event.get("log_type") or payload.get("log_type"))
    text = _lower(payload)
    action = _lower(payload.get("action") or payload.get("event") or payload.get("operation"))
    flags: List[Dict[str, Any]] = []

    failed_attempts = _number(payload, "failed_attempts", "failed_attempt_count", "login_failures")
    if failed_attempts >= 10 or "brute force" in text or "password spray" in text:
        _add_flag(flags, "brute_force", f"{int(failed_attempts)} failed attempts observed")

    if failed_attempts >= 5 and _lower(payload.get("auth_result")) == "success":
        _add_flag(flags, "successful_login_after_failures", "Successful login occurred after repeated failures", 0.92)

    reset_count = _number(payload, "password_reset_count", "reset_count", "reset_requests")
    if "password_reset" in action or "password reset" in text:
        if reset_count >= 3 or _number(payload, "unique_reset_targets") >= 3 or _number(payload, "reset_window_minutes", default=999) <= 10:
            _add_flag(flags, "password_reset_abuse", "Multiple password reset attempts in a short window")

    unique_token_ips = _number(payload, "token_unique_ips", "unique_source_ips_for_token", "session_unique_ips")
    if _bool(payload, "token_reused", "session_reused") or unique_token_ips > 1:
        _add_flag(flags, "token_replay", "Same token or session appears from multiple sources")

    mfa_result = _lower(payload.get("mfa_result"))
    auth_result = _lower(payload.get("auth_result"))
    mfa_denials = _number(payload, "mfa_denials", "mfa_push_denials")
    if _bool(payload, "mfa_without_password") or (mfa_result == "success" and auth_result == "failure") or (mfa_denials >= 3 and mfa_result == "success"):
        _add_flag(flags, "impossible_mfa_sequence", "MFA sequence is inconsistent with the password/login flow")

    if _number(payload, "days_since_last_login", "inactive_days", "account_dormant_days") >= 30 and auth_result == "success":
        _add_flag(flags, "dormant_account_reactivation", "Dormant account became active again")

    account_type = _lower(payload.get("account_type") or payload.get("user_type"))
    user_id = _lower(payload.get("user_id") or payload.get("username"))
    if account_type in ("service", "service_account") or user_id.startswith(("svc_", "service-")):
        if _bool(payload, "interactive_login") or _lower(payload.get("auth_method")) in ("password", "mfa") or "mozilla" in _lower(payload.get("user_agent")):
            _add_flag(flags, "service_account_misuse", "Service account used in an interactive or password-based flow")

    file_reads = _number(payload, "file_read_count", "files_read", "read_count")
    if file_reads >= 100:
        _add_flag(flags, "mass_file_reads", f"{int(file_reads)} file reads in the observation window")

    bytes_out = _number(payload, "bytes_out", "download_bytes", "egress_bytes")
    records_exported = _number(payload, "records_exported", "rows_exported", "export_records")
    if records_exported >= 10000 or bytes_out >= 500_000_000 or any(token in action for token in ("export", "backup", "download")) and (records_exported >= 1000 or bytes_out >= 100_000_000):
        _add_flag(flags, "bulk_export", "Large export, backup, or download activity detected")
        if bytes_out >= 500_000_000 or records_exported >= 10000:
            _add_flag(flags, "data_exfiltration", "Outbound volume/export size is consistent with exfiltration")

    privilege_level = _lower(payload.get("privilege_level") or payload.get("role"))
    if any(token in action for token in ("admin", "role", "permission", "delete_user", "create_api_key")):
        if privilege_level not in ("admin", "administrator", "root") or _bool(payload, "rare_admin_action", "new_admin_action"):
            _add_flag(flags, "unusual_admin_action", f"Unusual privileged action: {action or 'unknown'}")

    actions_text = _lower(payload.get("actions") or payload.get("session_actions"))
    if _bool(payload, "role_changed", "privilege_escalation") or (
        ("role" in actions_text or "privilege" in actions_text)
        and ("api_key" in actions_text or "token" in actions_text)
        and ("export" in actions_text or "download" in actions_text)
    ):
        _add_flag(flags, "privilege_chaining", "Privilege change chained into credential creation or data access")

    parent = _lower(payload.get("parent_process") or payload.get("parent_process_name"))
    process = _lower(payload.get("process_name") or payload.get("child_process"))
    command = _lower(payload.get("command_line") or payload.get("cmdline"))
    suspicious_parents = ("winword", "excel", "powerpnt", "outlook", "chrome", "edge", "firefox")
    suspicious_children = ("powershell", "cmd.exe", "wscript", "cscript", "mshta", "rundll32", "regsvr32", "curl")
    if any(parent_name in parent for parent_name in suspicious_parents) and any(child in process for child in suspicious_children):
        _add_flag(flags, "suspicious_process_ancestry", f"{parent or 'parent'} spawned {process or 'child'}")
    elif " -enc" in command or "encodedcommand" in command:
        _add_flag(flags, "suspicious_process_ancestry", "Encoded command line observed")

    scan_type = _lower(payload.get("scan_type"))
    unique_ports = _number(payload, "unique_ports", "port_count")
    if scan_type in ("port_scan", "horizontal", "vertical") or unique_ports >= 10:
        _add_flag(flags, "port_scan", f"Port scan indicator observed: {scan_type or int(unique_ports)}")

    destination_port = int(_number(payload, "destination_port", "dst_port", default=0))
    common_ports = {0, 22, 25, 53, 80, 110, 123, 143, 389, 443, 445, 465, 587, 993, 995, 1433, 3306, 3389, 5432, 8080, 8443}
    if destination_port not in common_ports and destination_port > 0:
        _add_flag(flags, "rare_destination_port", f"Connection to uncommon destination port {destination_port}")

    query = _lower(payload.get("query") or payload.get("domain") or payload.get("dns_query"))
    entropy = _number(payload, "entropy", "query_entropy", default=0.0)
    query_length = _number(payload, "query_length", default=len(query))
    if "dns" in log_type and (entropy >= 3.8 or query_length >= 60 or "tunnel" in query):
        _add_flag(flags, "dns_tunneling", "DNS query length/entropy indicates possible tunneling")
    if query and _looks_like_dga(query):
        _add_flag(flags, "dga_domain", f"Domain label appears generated: {query.split('.')[0]}")

    interval = _number(payload, "beacon_interval_seconds", "detected_interval_seconds")
    jitter = _number(payload, "jitter_percentage", default=100.0)
    if _bool(payload, "is_beacon") or _lower(payload.get("connection_type")) in ("c2_beacon", "beacon") or (30 <= interval <= 3600 and jitter <= 20):
        _add_flag(flags, "c2_beacon", "Periodic outbound callback pattern detected")

    if _bool(payload, "tls_fingerprint_anomaly", "ja3_anomaly") or _lower(payload.get("tls_fingerprint_status")) in ("rare", "malicious", "anomalous"):
        _add_flag(flags, "tls_fingerprint_anomaly", "Rare or anomalous TLS/JA3 fingerprint")

    reputation = _number(payload, "ip_reputation_score", "reputation_score", "domain_reputation_score")
    if reputation >= 70:
        _add_flag(flags, "high_reputation_risk", f"Reputation score is {reputation:g}")

    payload_flags = payload.get("anomaly_flags")
    if isinstance(payload_flags, list):
        for flag in payload_flags:
            normalized = re.sub(r"[^a-z0-9_]+", "_", _lower(flag)).strip("_")
            if normalized:
                _add_flag(flags, normalized, "Flag supplied by upstream telemetry", FLAG_CONFIDENCE.get(normalized, 0.7))

    risk = calculate_risk(payload, flags, chain_stage_count=0)
    return {
        "flags": flags,
        "flag_keys": [flag["flag_key"] for flag in flags],
        "confidence_score": calculate_confidence(flags, payload),
        "mitre_techniques": mitre_for_flags([flag["flag_key"] for flag in flags]),
        "recommended_actions": recommendations_for_flags([flag["flag_key"] for flag in flags]),
        "risk_score": risk["risk_score"],
        "severity_label": risk["severity_label"],
        "risk_factors": risk["risk_factors"],
    }


def calculate_confidence(flags: Sequence[Dict[str, Any]], payload: Dict[str, Any]) -> float:
    payload_confidence = _number(payload, "confidence", "confidence_score", default=0.0)
    confidences = [float(flag.get("confidence", 0.0)) for flag in flags if isinstance(flag.get("confidence"), (int, float))]
    if payload_confidence > 1:
        payload_confidence = payload_confidence / 100
    if payload_confidence > 0:
        confidences.append(payload_confidence)
    if not confidences:
        return 0.45
    return round(min(0.99, max(0.1, sum(confidences) / len(confidences))), 2)


def calculate_risk(payload: Dict[str, Any], flags: Sequence[Dict[str, Any]], chain_stage_count: int = 0) -> Dict[str, Any]:
    base_label = _lower(payload.get("severity") or payload.get("severity_label") or "MEDIUM").upper()
    base_score = SEVERITY_SCORE_MAP.get(base_label, SEVERITY_SCORE_MAP["MEDIUM"])
    confidence = calculate_confidence(flags, payload)
    reputation = _number(payload, "ip_reputation_score", "reputation_score", "domain_reputation_score")
    asset_criticality = _lower(payload.get("asset_criticality") or payload.get("criticality") or "medium")

    score = base_score
    risk_factors = [f"base_severity={base_label}:{base_score:.1f}"]

    confidence_boost = max(0.0, (confidence - 0.5) * 2.0)
    score += confidence_boost
    if confidence_boost:
        risk_factors.append(f"confidence_boost={confidence_boost:.1f}")

    asset_boost = ASSET_CRITICALITY_BONUS.get(asset_criticality, 0.5)
    score += asset_boost
    risk_factors.append(f"asset_criticality={asset_criticality}:{asset_boost:.1f}")

    reputation_boost = min(1.2, reputation / 100 * 1.2)
    if reputation_boost:
        score += reputation_boost
        risk_factors.append(f"reputation_boost={reputation_boost:.1f}")

    flag_boost = min(1.6, len(flags) * 0.35)
    if flag_boost:
        score += flag_boost
        risk_factors.append(f"flag_count_boost={flag_boost:.1f}")

    chain_boost = min(1.5, chain_stage_count * 0.35)
    if chain_boost:
        score += chain_boost
        risk_factors.append(f"attack_chain_boost={chain_boost:.1f}")

    risk_score = round(max(0.0, min(10.0, score)), 1)
    return {
        "risk_score": risk_score,
        "severity_label": score_to_severity(risk_score),
        "confidence_score": confidence,
        "risk_factors": risk_factors,
    }


def mitre_for_flags(flag_keys: Sequence[str]) -> List[Dict[str, str]]:
    seen = set()
    techniques: List[Dict[str, str]] = []
    for flag_key in flag_keys:
        for technique in MITRE_BY_FLAG.get(flag_key, []):
            if technique["id"] in seen:
                continue
            techniques.append(technique)
            seen.add(technique["id"])
    return techniques


def recommendations_for_flags(flag_keys: Sequence[str]) -> List[str]:
    recommendations = []
    for flag_key in flag_keys:
        recommendation = RECOMMENDATIONS_BY_FLAG.get(flag_key)
        if recommendation and recommendation not in recommendations:
            recommendations.append(recommendation)
    return recommendations


def enrich_event_payload(event: Dict[str, Any]) -> Dict[str, Any]:
    payload = dict(event.get("event_payload", {}) or {})
    detection = detect_event_rules({**event, "event_payload": payload})
    existing_flags = payload.get("anomaly_flags") if isinstance(payload.get("anomaly_flags"), list) else []
    merged_flags = list(dict.fromkeys([*existing_flags, *detection["flag_keys"]]))
    payload["anomaly_flags"] = merged_flags
    payload["detected_rules"] = detection["flags"]
    payload["confidence_score"] = detection["confidence_score"]
    payload["risk_score"] = detection["risk_score"]
    payload["severity"] = detection["severity_label"]
    payload["risk_factors"] = detection["risk_factors"]
    payload["mitre_techniques"] = detection["mitre_techniques"]
    payload["recommended_actions"] = detection["recommended_actions"]
    return payload


def _event_time(event: Dict[str, Any]) -> datetime:
    created_at = event.get("created_at")
    if isinstance(created_at, datetime):
        return created_at.astimezone(timezone.utc) if created_at.tzinfo else created_at.replace(tzinfo=timezone.utc)
    if isinstance(created_at, str):
        try:
            parsed = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            return parsed.astimezone(timezone.utc) if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    return datetime.now(timezone.utc)


def _event_matches(event: Dict[str, Any], flag_key: str) -> bool:
    detection = detect_event_rules(event)
    return flag_key in detection["flag_keys"]


def _same_entity(previous: Dict[str, Any], current: Dict[str, Any]) -> bool:
    prev_payload = previous.get("event_payload", {}) or {}
    cur_payload = current.get("event_payload", {}) or {}
    for field in ("source_ip", "user_id", "host_id", "hostname", "destination_ip"):
        if prev_payload.get(field) and cur_payload.get(field) and str(prev_payload[field]) == str(cur_payload[field]):
            return True
    return False


def correlate_attack_chains(events: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    ordered = sorted(events, key=_event_time)
    chains: List[Dict[str, Any]] = []

    chain_defs = [
        {
            "name": "Account Takeover With Data Exfiltration",
            "required": [
                ("reconnaissance", "port_scan"),
                ("credential_attack", "brute_force"),
                ("account_takeover", "successful_login_after_failures"),
                ("exfiltration", "bulk_export"),
            ],
            "classification": "Multi-Stage Intrusion",
        },
        {
            "name": "Compromised Login To Privilege Abuse",
            "required": [
                ("credential_attack", "brute_force"),
                ("account_takeover", "successful_login_after_failures"),
                ("privilege_escalation", "privilege_chaining"),
            ],
            "classification": "Identity Compromise",
        },
        {
            "name": "Malware Execution With Command And Control",
            "required": [
                ("execution", "suspicious_process_ancestry"),
                ("command_and_control", "c2_beacon"),
            ],
            "classification": "Malware Command And Control",
        },
    ]

    for chain_def in chain_defs:
        matched_events: List[Dict[str, Any]] = []
        cursor = 0
        for stage_name, flag_key in chain_def["required"]:
            for idx in range(cursor, len(ordered)):
                candidate = ordered[idx]
                previous_event = matched_events[-1]["event"] if matched_events else None
                if _event_matches(candidate, flag_key) and (previous_event is None or _same_entity(previous_event, candidate)):
                    enriched_payload = enrich_event_payload(candidate)
                    matched_events.append(
                        {
                            "stage": stage_name,
                            "flag_key": flag_key,
                            "event": {**candidate, "event_payload": enriched_payload},
                        }
                    )
                    cursor = idx + 1
                    break

        if len(matched_events) >= max(2, len(chain_def["required"]) - 1):
            all_flags = [item["flag_key"] for item in matched_events]
            latest_payload = matched_events[-1]["event"].get("event_payload", {})
            chain_risk = calculate_risk(latest_payload, [{"flag_key": flag, "confidence": FLAG_CONFIDENCE.get(flag, 0.8)} for flag in all_flags], len(matched_events))
            chains.append(
                {
                    "name": chain_def["name"],
                    "attack_classification": chain_def["classification"],
                    "stages": [
                        {
                            "stage": item["stage"],
                            "flag_key": item["flag_key"],
                            "timestamp": _event_time(item["event"]).isoformat(),
                            "source_event_id": str(item["event"].get("_id", "")),
                            "payload": item["event"].get("event_payload", {}),
                        }
                        for item in matched_events
                    ],
                    "risk_score": chain_risk["risk_score"],
                    "severity_label": chain_risk["severity_label"],
                    "confidence_score": chain_risk["confidence_score"],
                    "risk_factors": chain_risk["risk_factors"],
                    "mitre_techniques": mitre_for_flags(all_flags),
                    "recommended_actions": recommendations_for_flags(all_flags),
                    "created_at": _event_time(matched_events[-1]["event"]).isoformat(),
                }
            )

    return chains
