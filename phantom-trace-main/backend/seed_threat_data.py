"""
Seed MongoDB with realistic threat data for dashboard visualization.
Run once: python seed_threat_data.py
"""

from datetime import datetime, timedelta
from mongodb_db import (
    MongoDBConnection,
    store_threat_event,
    store_agent_result,
    store_agent_flags
)

def seed_threat_data():
    """Populate MongoDB with realistic threat events and agent findings."""
    
    db = MongoDBConnection.get_database()
    default_thread_id = "default"
    
    # Clear existing data for this thread (optional - comment out to keep old data)
    # db.threat_events.delete_many({"thread_id": default_thread_id})
    # db.agent_results.delete_many({"thread_id": default_thread_id})
    # db.agent_flags.delete_many({"thread_id": default_thread_id})
    
    print("🌱 Seeding threat data into MongoDB...")
    
    # ─── ALERT 1: Coordinated Attack ─────────────────────────────────────────
    alert_1_results = store_agent_result(
        thread_id=default_thread_id,
        agent_name="network",
        user_message="Analyze coordinated attack from 185.220.101.45 - TOR exit node Russia. 200 port scans detected.",
        raw_response="Network agent detected: port_scan pattern on 200 unique ports within 60 seconds from 185.220.101.45 (TOR exit node, Russia). Known malicious IP. Severity: 8.5/10.",
        parsed_response={
            "summary": "Network anomaly detected - port scan on 200 ports from known bad IP",
            "findings": [
                "Port scan across 200 unique ports detected",
                "Source IP 185.220.101.45 is known malicious",
                "TOR exit node - Russia origin",
                "Scan completed in 60 seconds - aggressive pattern"
            ],
            "sections": {"network_analysis": "Coordinated port scan detected"},
            "line_count": 4
        }
    )
    
    store_agent_flags(
        thread_id=default_thread_id,
        agent_name="network",
        flags=[
            {"flag_key": "port_scan", "enabled": True, "confidence": 0.96, "evidence": "200 ports scanned in 60 seconds"},
            {"flag_key": "known_bad_ip", "enabled": True, "confidence": 0.98, "evidence": "IP 185.220.101.45 is known malicious"},
            {"flag_key": "geo_anomaly", "enabled": True, "confidence": 0.92, "evidence": "TOR exit node from Russia"}
        ]
    )
    
    store_agent_result(
        thread_id=default_thread_id,
        agent_name="auth",
        user_message="Check for authentication anomalies from 185.220.101.45 targeting user_42",
        raw_response="Auth agent: 47 failed SSH login attempts from 185.220.101.45 targeting user_42 detected. Brute force threshold: 5 per minute. Pattern: mass failed attempts followed by one success.",
        parsed_response={
            "summary": "Brute force attack detected - 47 failed logins followed by success",
            "findings": [
                "47 failed SSH attempts in 2 minutes",
                "Target: user_42",
                "One successful login after brute force attempts",
                "Source IP: 185.220.101.45"
            ],
            "sections": {"auth_analysis": "Brute force succeeded"},
            "line_count": 4
        }
    )
    
    store_agent_flags(
        thread_id=default_thread_id,
        agent_name="auth",
        flags=[
            {"flag_key": "brute_force", "enabled": True, "confidence": 0.94, "evidence": "47 failed attempts in 2 minutes"},
            {"flag_key": "off_hours", "enabled": True, "confidence": 0.89, "evidence": "Attack occurred at 01:45 AM"},
            {"flag_key": "new_country", "enabled": True, "confidence": 0.91, "evidence": "Russia - unusual for user_42"}
        ]
    )
    
    store_agent_result(
        thread_id=default_thread_id,
        agent_name="behavioral",
        user_message="Analyze data exfiltration pattern for user_42 after successful login",
        raw_response="Behavioral agent: user_42 downloaded 2.1 GB data at 01:53 AM - 42x above daily baseline (50 MB). Resources accessed: /api/backup, /api/users/export. Timeline: login success → 5 min delay → massive download.",
        parsed_response={
            "summary": "Data exfiltration detected - 2.1 GB download 42x baseline",
            "findings": [
                "2.1 GB data downloaded after successful login",
                "42x deviation from user baseline (50 MB daily)",
                "Resources: backup data + user export",
                "5 minute delay between login and exfiltration"
            ],
            "sections": {"behavioral_analysis": "Clear exfiltration pattern"},
            "line_count": 4
        }
    )
    
    store_agent_flags(
        thread_id=default_thread_id,
        agent_name="behavioral",
        flags=[
            {"flag_key": "data_exfiltration", "enabled": True, "confidence": 0.91, "evidence": "2.1 GB download"},
            {"flag_key": "baseline_deviation", "enabled": True, "confidence": 0.95, "evidence": "42x above normal"}
        ]
    )
    
    # ─── ALERT 2: Malware Execution ──────────────────────────────────────────
    alert_2_results = store_agent_result(
        thread_id=default_thread_id,
        agent_name="malware",
        user_message="Analyze process execution on WS-042: winword.exe spawning powershell with encoded command",
        raw_response="Malware agent: Suspicious process lineage detected. Parent: winword.exe, Child: powershell.exe with base64 encoded command. Pattern matches macro-based Office exploitation. Confidence: 0.95.",
        parsed_response={
            "summary": "Office macro malware execution detected - PowerShell process chain",
            "findings": [
                "Microsoft Word spawned PowerShell",
                "Base64 encoded command line",
                "Matches known Office macro attack pattern",
                "Parent-child process relationship flagged"
            ],
            "sections": {"malware_analysis": "Macro-based exploitation"},
            "line_count": 4
        }
    )
    
    store_agent_flags(
        thread_id=default_thread_id,
        agent_name="malware",
        flags=[
            {"flag_key": "suspicious_lineage", "enabled": True, "confidence": 0.95, "evidence": "Word→PowerShell spawning"},
            {"flag_key": "lolbas", "enabled": True, "confidence": 0.93, "evidence": "PowerShell used for execution"},
            {"flag_key": "encoded_cmd", "enabled": True, "confidence": 0.98, "evidence": "Base64 encoded command detected"}
        ]
    )
    
    store_agent_result(
        thread_id=default_thread_id,
        agent_name="network",
        user_message="Check for C2 communication from WS-042 to 194.165.16.15:4444",
        raw_response="Network agent: Outbound connection from WS-042 to 194.165.16.15:4444 detected immediately after PowerShell execution. 194.165.16.15 is known C2 server. Traffic pattern consistent with command & control.",
        parsed_response={
            "summary": "C2 beacon to known malicious IP detected",
            "findings": [
                "Connection to 194.165.16.15:4444",
                "Known C2 infrastructure",
                "Immediate post-execution connection",
                "Regular callback pattern observed"
            ],
            "sections": {"c2_analysis": "Active C2 communication"},
            "line_count": 4
        }
    )
    
    store_agent_flags(
        thread_id=default_thread_id,
        agent_name="network",
        flags=[
            {"flag_key": "c2_beacon", "enabled": True, "confidence": 0.88, "evidence": "Known C2 IP 194.165.16.15"},
            {"flag_key": "known_bad_ip", "enabled": True, "confidence": 0.92, "evidence": "Malicious IP confirmed"}
        ]
    )
    
    # ─── ALERT 3: Brute Force Login ──────────────────────────────────────────
    store_agent_result(
        thread_id=default_thread_id,
        agent_name="auth",
        user_message="Analyze brute force against user_15 from 45.142.212.100",
        raw_response="Auth agent: 23 failed password attempts detected against user_15 from IP 45.142.212.100 (Ukraine). Attack occurred at 03:20 AM - outside normal hours. Account locked by system after failed attempts threshold.",
        parsed_response={
            "summary": "Brute force attempt blocked - account temporary lock",
            "findings": [
                "23 failed attempts in 90 seconds",
                "Off-hours attack (03:20 AM)",
                "Source: Ukraine IP 45.142.212.100",
                "Account protection triggered"
            ],
            "sections": {"auth_security": "Brute force mitigated"},
            "line_count": 4
        }
    )
    
    store_agent_flags(
        thread_id=default_thread_id,
        agent_name="auth",
        flags=[
            {"flag_key": "brute_force", "enabled": True, "confidence": 0.92, "evidence": "23 attempts in 90 seconds"},
            {"flag_key": "off_hours", "enabled": True, "confidence": 0.87, "evidence": "Attack at 03:20 AM"}
        ]
    )
    
    # ─── ALERT 4: DNS Tunneling ─────────────────────────────────────────────
    store_agent_result(
        thread_id=default_thread_id,
        agent_name="network",
        user_message="Analyze DNS query pattern from 10.0.0.42 - high entropy subdomains to tunnel.evil-c2-server.com",
        raw_response="Network agent: 20 consecutive DNS TXT queries detected. High-entropy subdomains (avg 64 chars, entropy 4.2 - exceeds 3.5 threshold). Queries to tunnel.evil-c2-server.com. Pattern matches DNS tunneling for C2 communication.",
        parsed_response={
            "summary": "DNS tunneling detected - C2 communication over DNS",
            "findings": [
                "20 high-entropy DNS TXT queries",
                "Query entropy 4.2 vs threshold 3.5",
                "Domain: tunnel.evil-c2-server.com",
                "Pattern: DNS-based C2 protocol"
            ],
            "sections": {"dns_analysis": "Tunneling activity confirmed"},
            "line_count": 4
        }
    )
    
    store_agent_flags(
        thread_id=default_thread_id,
        agent_name="network",
        flags=[
            {"flag_key": "dns_tunneling", "enabled": True, "confidence": 0.89, "evidence": "High-entropy DNS queries detected"},
            {"flag_key": "high_entropy", "enabled": True, "confidence": 0.91, "evidence": "Entropy 4.2 vs threshold 3.5"}
        ]
    )
    
    # ─── ALERT 5: Anomalous Login ───────────────────────────────────────────
    store_agent_result(
        thread_id=default_thread_id,
        agent_name="auth",
        user_message="Check login from user_33 at 23:45 from IP 10.0.0.201",
        raw_response="Auth agent: user_33 login from new IP 10.0.0.201 at 23:45 PM. Off-hours login outside normal 8 AM - 8 PM window. MFA used successfully. No suspicious post-login activity. Low individual severity but flagged for monitoring.",
        parsed_response={
            "summary": "Off-hours login from new IP - MFA protected",
            "findings": [
                "Login from new IP 10.0.0.201",
                "Time: 23:45 PM (off-hours)",
                "MFA authentication successful",
                "No post-login anomalies"
            ],
            "sections": {"auth_analysis": "Anomalous but protected"},
            "line_count": 4
        }
    )
    
    store_agent_flags(
        thread_id=default_thread_id,
        agent_name="auth",
        flags=[
            {"flag_key": "off_hours", "enabled": True, "confidence": 0.65, "evidence": "Login at 23:45 PM"},
            {"flag_key": "new_ip", "enabled": True, "confidence": 0.72, "evidence": "First login from 10.0.0.201"}
        ]
    )
    
    # ─── THREAT EVENTS ──────────────────────────────────────────────────────
    threat_events_data = [
        {
            "thread_id": default_thread_id,
            "log_source": "network",
            "log_type": "network",
            "event_payload": {
                "source_ip": "185.220.101.45",
                "destination_ip": "10.0.0.5",
                "destination_port": 22,
                "protocol": "TCP",
                "bytes_out": 64,
                "scan_type": "port_scan",
                "severity": "CRITICAL"
            },
            "created_at": datetime.utcnow() - timedelta(hours=8)
        },
        {
            "thread_id": default_thread_id,
            "log_source": "auth",
            "log_type": "auth",
            "event_payload": {
                "source_ip": "185.220.101.45",
                "user_id": "user_42",
                "auth_method": "password",
                "failed_attempts": 47,
                "severity": "CRITICAL"
            },
            "created_at": datetime.utcnow() - timedelta(hours=8, minutes=2)
        },
        {
            "thread_id": default_thread_id,
            "log_source": "process",
            "log_type": "process",
            "event_payload": {
                "process_name": "powershell.exe",
                "parent_process": "winword.exe",
                "command_line": "powershell -enc SGVsbG8gd29ybGQ=",
                "severity": "HIGH"
            },
            "created_at": datetime.utcnow() - timedelta(hours=1, minutes=55)
        },
        {
            "thread_id": default_thread_id,
            "log_source": "network",
            "log_type": "network",
            "event_payload": {
                "source_ip": "10.0.0.42",
                "destination_ip": "194.165.16.15",
                "destination_port": 4444,
                "protocol": "TCP",
                "connection_type": "c2_beacon",
                "severity": "HIGH"
            },
            "created_at": datetime.utcnow() - timedelta(hours=1, minutes=53)
        },
        {
            "thread_id": default_thread_id,
            "log_source": "dns",
            "log_type": "dns",
            "event_payload": {
                "source_ip": "10.0.0.42",
                "query": "aGVsbG8gd29ybGQ=.tunnel.evil-c2-server.com",
                "query_type": "TXT",
                "query_length": 68,
                "entropy": 4.2,
                "severity": "HIGH"
            },
            "created_at": datetime.utcnow() - timedelta(hours=0, minutes=30)
        },
        {
            "thread_id": default_thread_id,
            "log_source": "auth",
            "log_type": "auth",
            "event_payload": {
                "source_ip": "45.142.212.100",
                "user_id": "user_15",
                "auth_method": "password",
                "failed_attempts": 23,
                "severity": "MEDIUM"
            },
            "created_at": datetime.utcnow() - timedelta(hours=13, minutes=20)
        },
    ]
    
    results_count = 0
    for event_data in threat_events_data:
        result = db["threat_events"].insert_one(event_data)
        results_count += 1
        print(f"✓ Inserted threat event: {event_data['log_type']} ({event_data['event_payload'].get('severity', 'INFO')})")
    
    # Summary
    agent_results = db["agent_results"].count_documents({"thread_id": default_thread_id})
    threat_events = db["threat_events"].count_documents({"thread_id": default_thread_id})
    agent_flags = db["agent_flags"].count_documents({"thread_id": default_thread_id})
    
    print(f"\n✨ Seeding complete!")
    print(f"  • Agent Results: {agent_results}")
    print(f"  • Threat Events: {threat_events}")
    print(f"  • Agent Flags: {agent_flags}")
    print(f"\n🚀 Data is now available for frontend to fetch via /api/alerts?thread_id={default_thread_id}")

if __name__ == "__main__":
    seed_threat_data()
