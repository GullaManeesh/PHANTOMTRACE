# External Log Sender Website

This folder is a standalone sample website that demonstrates how a customer can send security logs to your PhantomTrace backend and trigger orchestrator analysis.

## Why this is isolated

- It is outside your product app folder (`phantom-trace-main/`).
- It has no dependency on your frontend codebase.
- It can run directly as a static page.

## Run options

1. **No port required:**
   - Open `index.html` directly in your browser.

2. **Optional local server (non-conflicting port):**
   ```bash
   python -m http.server 5501
   ```
   Then open `http://localhost:5501`

This avoids your project ports:
- Backend: `8000`
- Frontend (Vite): `5173`

## Backend endpoint usage

The page calls:
- `POST /events/ingest` — persist the raw log
- `POST /call-orchestratorAgent` — analyze it on the same thread

Both use the same generated `thread_id`, so the orchestrator analyzes the exact event just ingested.

---

## Sample Log Examples by Agent Type

Each log type is designed for a specific agent. Choose a category below, copy the payload, paste it into the form, and send.

### Network Agent — Detects network anomalies, port scans, C2 communication, data exfiltration

**What it analyzes:**
- Source and destination IPs, ports, protocols
- Connection counts, traffic volume, DNS queries
- Geo data, IP reputation scores
- Anomaly flags: port scans, C2 beacons, DNS tunneling

**Best for:** Detecting lateral movement, unauthorized traffic, command & control callbacks

---

#### Example 1: Port Scan Detection

```json
{
  "timestamp": "2026-04-15T14:23:00Z",
  "source_ip": "203.0.113.45",
  "destination_ip": "10.0.0.0/24",
  "destination_port_range_start": 1,
  "destination_port_range_end": 65535,
  "protocol": "TCP",
  "scan_type": "SYN",
  "bytes_in": 0,
  "bytes_out": 65535,
  "connection_count": 65535,
  "time_window_seconds": 60,
  "country": "Russia",
  "is_tor_exit": true,
  "ip_reputation": 9.2,
  "event_description": "Horizontal port scan across entire network segment in 60 seconds"
}
```

**Why risky:** High connection count in short window + TOR exit node + known malicious IP reputation → likely reconnaissance.

---

#### Example 2: DNS Tunneling Detection

```json
{
  "timestamp": "2026-04-15T11:45:00Z",
  "source_ip": "10.0.0.42",
  "destination_ip": "8.8.8.8",
  "destination_port": 53,
  "protocol": "UDP",
  "dns_queries": [
    "aGVsbG8gd29ybGQ=.tunnel.attacker.com",
    "ZXhmaWx0cmF0ZWRkYXRh.tunnel.attacker.com",
    "c2NvbW1hbmRzcmVzcG9uc2U=.tunnel.attacker.com"
  ],
  "total_queries": 47,
  "average_query_length": 68,
  "hostname_entropy": 4.2,
  "bytes_in": 1200,
  "bytes_out": 3400,
  "connection_count": 47,
  "country": "Unknown",
  "is_datacenter": false,
  "event_description": "High-entropy DNS queries to suspicious tunnel domain — likely data exfiltration or C2 communication"
}
```

**Why risky:** High entropy in DNS names + base64-encoded queries + consistent pattern → data encoding over DNS tunnel.

---

#### Example 3: Successful C2 Beacon

```json
{
  "timestamp": "2026-04-15T16:32:00Z",
  "source_ip": "10.0.0.88",
  "destination_ip": "194.165.16.15",
  "destination_port": 4444,
  "protocol": "TCP",
  "bytes_in": 512,
  "bytes_out": 256,
  "connection_count": 1,
  "user_agent": "Mozilla/5.0 (malicious)",
  "http_uri": "/check?id=WORKSTATION-88",
  "recurrence_pattern_minutes": 5,
  "beacon_count_last_hour": 12,
  "country": "North Korea",
  "is_known_c2_server": true,
  "ip_reputation": 10.0,
  "event_description": "Periodic outbound connections to known C2 infrastructure at 5-minute intervals"
}
```

**Why risky:** Known C2 server + periodic beacons + established connection → active command & control channel.

---

### Auth Agent — Detects credential abuse, brute force, unauthorized access, privilege escalation

**What it analyzes:**
- User ID, source IP, authentication method
- Login success/failure counts, MFA bypass attempts
- Failed attempt patterns, off-hours access
- Post-login suspicious actions

**Best for:** Detecting account takeover, credential stuffing, unauthorized privilege access

---

#### Example 1: Brute Force Attack

```json
{
  "timestamp": "2026-04-15T03:15:00Z",
  "user_id": "svc-admin",
  "source_ip": "45.142.212.100",
  "auth_method": "password",
  "auth_result": "failure",
  "failed_attempts_in_window": 47,
  "time_window_seconds": 90,
  "unique_users_targeted": 3,
  "unique_ips_from_same_account": 1,
  "login_hour": 3,
  "country": "Ukraine",
  "is_known_attacker_ip": true,
  "target_resource": "/login",
  "mfa_enforced": true,
  "event_description": "47 failed password attempts in 90 seconds against admin service account from foreign IP at 3 AM — account lock triggered"
}
```

**Why risky:** High failed attempts + off-hours + foreign IP + admin account targeted → credential stuffing/brute force.

---

#### Example 2: Successful Login After Compromise + Immediate Action

```json
{
  "timestamp": "2026-04-15T03:22:00Z",
  "user_id": "user_42",
  "source_ip": "185.220.101.45",
  "auth_method": "password",
  "auth_result": "success",
  "mfa_enabled": true,
  "mfa_bypassed": false,
  "failed_attempts_before_success": 47,
  "login_hour": 3,
  "user_baseline_login_hour": "8-18",
  "country": "Russia",
  "is_tor_exit": true,
  "post_login_actions_within_5_min": [
    "accessed /api/admin/users",
    "accessed /api/admin/system",
    "triggered data export request"
  ],
  "privilege_level": "standard",
  "event_description": "Successful login after 47 failed attempts, immediately followed by access to admin APIs — credential compromise suspected"
}
```

**Why risky:** Success after brute force + immediate unusual actions + off-hours + TOR → account takeover in progress.

---

#### Example 3: New IP Access Outside Working Hours

```json
{
  "timestamp": "2026-04-14T23:45:00Z",
  "user_id": "user_33",
  "source_ip": "10.0.0.201",
  "auth_method": "mfa",
  "auth_result": "success",
  "mfa_enabled": true,
  "mfa_bypassed": false,
  "login_hour": 23,
  "user_baseline_login_hours": "08:00-18:00",
  "is_new_ip_for_user": true,
  "previous_ips_on_record": ["192.168.1.100", "192.168.1.101"],
  "days_since_last_login": 0,
  "country": "Same as last seen",
  "post_login_actions": [],
  "event_description": "Successful MFA login from previously unseen IP at 11:45 PM — outside normal working hours but with valid MFA"
}
```

**Why risky:** New IP + off-hours + successful MFA (legitimate but suspicious pattern) → monitor for post-login activity.

---

### Behavioral Agent — Detects anomalous user/host activity, data exfiltration, unusual resource access

**What it analyzes:**
- Entity type (user or host) and baseline behavior
- Data volume changes, resource access patterns
- Deviation from peer group behavior
- New resource access, temporal anomalies

**Best for:** Detecting insider threats, compromised endpoints, unusual workload patterns

---

#### Example 1: Massive Data Exfiltration

```json
{
  "timestamp": "2026-04-15T01:53:00Z",
  "entity_id": "user_42",
  "entity_type": "user",
  "bytes_transferred_in_window": 2100000000,
  "observation_window_minutes": 45,
  "baseline_bytes_per_day": 50000000,
  "deviation_factor": 42.0,
  "resources_accessed": [
    "/api/backup/full_database_dump",
    "/api/users/export_all_records",
    "/shared_drives/financial_records"
  ],
  "new_resources_accessed": 2,
  "time_of_day": "01:53 AM",
  "typical_active_hours": "08:00-18:00",
  "peer_group_id": "engineers",
  "peer_group_deviation_factor": 8.5,
  "event_description": "User_42 transferred 2.1 GB in 45 minutes (42x daily baseline) to personal cloud storage at 1:53 AM — 7 hours after brute force login"
}
```

**Why risky:** Massive data volume + off-hours + sensitive resources + deviation from peers → likely exfiltration.

---

#### Example 2: Compromised Service Account — Lateral Movement

```json
{
  "timestamp": "2026-04-15T05:12:00Z",
  "entity_id": "svc-deploy",
  "entity_type": "host",
  "bytes_transferred_in_window": 450000000,
  "observation_window_minutes": 120,
  "baseline_bytes_per_day": 200000000,
  "deviation_factor": 1.1,
  "resources_accessed": [
    "\\\\dc01\\SYSVOL",
    "\\\\fileserver\\admin_shares",
    "\\\\backup_server\\backup_repository",
    "C:\\Windows\\System32\\config\\SAM"
  ],
  "new_resources_accessed": 3,
  "failed_access_attempts": 8,
  "successful_escalation": true,
  "time_of_day": "05:12 AM",
  "typical_active_hours": "00:00-23:59",
  "process_lineage": [
    "svchost.exe → cmd.exe → mimikatz.exe → powershell.exe"
    ],
  "event_description": "Service account accessing domain admin shares, registry SAM files, and backup repository — credential dumping activity detected"
}
```

**Why risky:** Unusual process chain + admin credential access + lateral movement pattern → likely post-exploitation activity.

---

#### Example 3: Unusual Peer Deviation — Off-Hours Developer Activity

```json
{
  "timestamp": "2026-04-15T14:20:00Z",
  "entity_id": "user_07",
  "entity_type": "user",
  "bytes_transferred_in_window": 80000000,
  "observation_window_minutes": 60,
  "baseline_bytes_per_day": 30000000,
  "deviation_factor": 2.7,
  "resources_accessed": [
    "/prod/database_backups",
    "/prod/api_keys_vault",
    "/prod/customer_payment_data"
  ],
  "new_resources_accessed": 1,
  "time_of_day": "14:20 (2:20 PM)",
  "typical_active_hours": "09:00-17:00",
  "peer_group_id": "developers",
  "peer_group_baseline_access": ["/staging", "/qa_environment"],
  "peer_group_deviation_factor": 3.0,
  "access_denied_count": 0,
  "event_description": "Developer accessing production customer data and payment vault from web request — 85% above peer group data access"
}
```

**Why risky:** Accessing sensitive/prod resources + deviation from peer group role → likely unauthorized access or training activity.

---

### Orchestrator Agent — Routes to all specialists and correlates findings

**What it does:**
- Ingests raw log, forwards to Network, Auth, and Behavioral agents in parallel
- Correlates findings across agents
- Produces unified severity score and risk assessment
- Recommends immediate actions

**Best to use:** When you have a raw log and want full multi-agent analysis

**Example usage:** Copy any of the above logs, select `log_type="network"`, `log_type="auth"`, or `log_type="behavioral"`, and the orchestrator will:
1. Route to the appropriate specialist
2. Gather all findings
3. Cross-reference anomalies
4. Return combined threat assessment

---

## Tips for Realistic Logs

- **Timestamps:** Use ISO 8601 format (e.g., `2026-04-15T14:23:00Z`)
- **IPs:** Use realistic patterns (private ranges like `10.0.0.x`, `192.168.x.x` for internal; public IPs like `203.0.113.x` for external)
- **Severity indicators:**
  - TOR exit nodes, known C2 servers, foreign countries → high risk
  - Off-hours activity outside baseline → suspicious
  - Massive data volume deviations → likely exfiltration
  - MFA bypass attempts → urgent
- **Correlation clues:** Same IP in network + auth + behavioral logs within minutes → coordinated attack

---

## Testing Workflow

1. **Choose a category** above (Network, Auth, Behavioral)
2. **Copy the JSON payload** from an example
3. **Paste into the form** on `index.html`
4. **Select matching log type** (network, auth, behavioral)
5. **Click "Send Log"**
6. **Review orchestrator response** (severity, flags, recommendations)
