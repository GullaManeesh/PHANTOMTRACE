# Start Flow Instructions (Swagger UI at /docs)

Use this guide to run the full flow directly from the FastAPI docs page.

## Quick Summary

1. Start backend server.
2. Open `http://localhost:8000/docs`.
3. Insert one log using `POST /events/ingest` (recommended first).
4. Run orchestrator and specialist endpoints with the same `thread_id`.
5. Run explainer with the same `thread_id`.

Use one consistent `thread_id` across all calls in the same incident flow.

## 1) Start Backend

From repository root:

```powershell
cd backend
python main.py
```

Then open:

- `http://localhost:8000/docs`

## 2) Insert Log First in Swagger UI (Recommended)

In `/docs`:

1. Expand `POST /events/ingest`.
2. Click `Try it out`.
3. Paste this request body.
4. Click `Execute`.

```json
{
  "thread_id": "session-001",
  "log_source": "sysmon",
  "log_type": "network",
  "event_payload": {
    "source_ip": "10.1.2.5",
    "destination_ip": "198.51.100.17",
    "destination_port": 443,
    "protocol": "TCP",
    "bytes_in": 48231,
    "bytes_out": 950000,
    "dns_queries": ["aGVsbG8td29ybGQ.evil-c2.net", "cdn.company.com"],
    "user_id": "u-7781",
    "login_timestamp": "2026-04-08T02:14:00Z"
  }
}
```

Expected response:

```json
{
  "thread_id": "session-001",
  "status": "success",
  "created_at": "2026-04-08T...Z"
}
```

## 3) Verify Latest Event (Optional)

In `/docs`:

1. Expand `GET /events/latest/{thread_id}`.
2. Click `Try it out`.
3. Set `thread_id` to `session-001`.
4. Click `Execute`.

You should see the event payload you inserted.

## 4) Run Orchestrator

In `/docs`:

1. Expand `POST /call-orchestratorAgent`.
2. Click `Try it out`.
3. Use:

```json
{
  "message": "Route this incident to the minimum specialist agents required.",
  "thread_id": "session-001"
}
```

4. Click `Execute`.

## 5) Run Specialist Agents

Run each endpoint in `/docs` with the same `thread_id`.

Important: each specialist performs better when the latest ingested event matches that specialist's domain. You can call `POST /events/ingest` again with the same `thread_id` before each specialist.

### Network (`POST /call-networkAgent`)

Recommended latest event before calling network agent:

```json
{
  "thread_id": "session-001",
  "log_source": "sysmon",
  "log_type": "network",
  "event_payload": {
    "source_ip": "10.1.2.5",
    "destination_ip": "198.51.100.17",
    "destination_port": 443,
    "protocol": "TCP",
    "bytes_in": 48231,
    "bytes_out": 950000,
    "dns_queries": ["aGVsbG8td29ybGQ.evil-c2.net", "cdn.company.com"]
  }
}
```

```json
{
  "message": "Analyze network indicators and list anomaly flags with confidence.",
  "thread_id": "session-001"
}
```

### Auth (`POST /call-authAgent`)

Recommended latest event before calling auth agent:

```json
{
  "thread_id": "session-001",
  "log_source": "auth",
  "log_type": "auth",
  "event_payload": {
    "user_id": "u-7781",
    "source_ip": "45.155.205.233",
    "auth_method": "mfa",
    "auth_result": "success",
    "target_resource": "/admin/finance/export",
    "mfa_bypassed": true,
    "login_timestamp": "2026-04-08T02:14:00Z",
    "failed_attempt_count": 14,
    "unique_users_from_ip": 4,
    "privilege_level": "admin",
    "post_login_actions": ["export_payroll_csv", "disable_audit_webhook"]
  }
}
```

Then call `POST /call-authAgent` with:

```json
{
  "message": "Analyze authentication and access risk indicators using auth_method, auth_result, MFA status, login time/location, failed attempts, and post-login actions.",
  "thread_id": "session-001"
}
```

### Behavioural (`POST /call-behaviouralAgent`)

Recommended latest event before calling behavioural agent:

```json
{
  "thread_id": "session-001",
  "log_source": "activity",
  "log_type": "behavioral",
  "event_payload": {
    "entity_id": "u-7781",
    "entity_type": "user",
    "observation_window_hours": 24,
    "current_feature_vector": [4.8, 2.9, 0.92, 0.83],
    "baseline_feature_vector": [1.1, 0.9, 0.22, 0.17],
    "feature_labels": ["login_frequency", "avg_bytes_moved", "new_resource_ratio", "off_hours_activity"],
    "new_resource_access": ["/admin/finance/export", "/billing/raw-ledger"],
    "temporal_anomalies": ["02:14 local login", "03:01 bulk export"]
  }
}
```

```json
{
  "message": "Analyze behavioural deviation and potential exfiltration signals.",
  "thread_id": "session-001"
}
```

## 6) Run Explainer (Final)

Use `POST /call-explainerAgent` in `/docs`:

```json
{
  "message": "Synthesize all findings into final severity, narrative, and remediation actions.",
  "thread_id": "session-001"
}
```

## Troubleshooting

- If `/docs` does not open, confirm backend is running on port `8000`.
- If responses are empty or unrelated, verify you used the same `thread_id` in every call.
- Prefer inserting at least one event before running orchestrator/specialists.
- If you skip `/events/ingest`, specialist endpoints can still auto-ingest when `message` is a JSON object string.
- If auth agent asks for missing fields, ingest an auth event with `auth_method`, `auth_result`, `target_resource`, `mfa_bypassed`, and `login_timestamp`, then retry.
