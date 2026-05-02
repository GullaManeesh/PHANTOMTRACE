# Explainer Flow

Use this file as the copy-paste reference for verifying the orchestrator -> specialist agents -> explainer flow with real persisted telemetry.

## What This Flow Does

1. Persist a raw threat event into SQLite using one thread_id.
2. Run the orchestrator to select specialist agents.
3. Run selected specialist agents with the same thread_id.
4. Backend caches specialist responses and inferred enabled flags.
5. Run explainer with the same thread_id so it receives latest event + enabled flags + cached findings.

Important: the orchestrator does not automatically execute specialist agents in one backend call. You execute specialist endpoints after reading orchestrator output.

## Recommended Test Sequence

Use one shared thread_id for the whole run.

Example thread_id:

```text
session-123
```

### Step 1: Ingest a real event

Endpoint:

```text
POST /events/ingest
```

Example request body:

```json
{
  "thread_id": "session-123",
  "log_source": "sysmon",
  "log_type": "network",
  "event_payload": {
    "source_ip": "10.1.2.5",
    "destination_ip": "198.51.100.17",
    "destination_port": 443,
    "bytes_out": 950000,
    "dns_queries": [
      "aGVsbG8td29ybGQ.evil-c2.net",
      "cdn.company.com"
    ]
  }
}
```

### Step 2: Call the orchestrator

Endpoint:

```text
POST /call-orchestratorAgent
```

Example request body:

```json
{
  "message": "Route this incident to the minimum specialist agents required.",
  "thread_id": "session-123"
}
```

Expected result:

- The orchestrator returns recommended specialists.
- Recommendations should align with the latest event context for this thread_id.

### Step 3: Call specialist agents

Use the same thread_id for each request.

Network example:

```json
{
  "message": "Analyze network indicators and list anomaly flags with confidence.",
  "thread_id": "session-123"
}
```

Auth example:

```json
{
  "message": "Analyze authentication and access risk indicators.",
  "thread_id": "session-123"
}
```

Behavioural example:

```json
{
  "message": "Analyze behavioural deviation and potential exfiltration signals.",
  "thread_id": "session-123"
}
```

### Step 4: Call the explainer

Endpoint:

```text
POST /call-explainerAgent
```

Example request body:

```json
{
  "message": "Synthesize all findings into final severity, narrative, and remediation actions.",
  "thread_id": "session-123"
}
```

Expected result:

- Explainer receives and uses:
  - latest persisted event for thread_id
  - enabled flags inferred from specialist outputs
  - cached specialist findings
- Explainer returns a unified incident narrative with prioritized actions.

## Useful Validation Endpoint

Fetch latest event for a thread:

```text
GET /events/latest/{thread_id}
```
