# PhantomTrace Live Demo Runbook

## Demo Goal
Show an audience that:
1. Logs are ingested from an external source.
2. AI agents analyze the logs.
3. Multiple app pages update with fresh data.
4. Security insights can be explained in plain language.

## Demo Flow Overview
1. Start backend and frontend.
2. Open app and log sender.
3. Send one log at a time (network, auth, behavioral).
4. After each log, walk through pages and point out updates.
5. Use AI Chat to summarize the latest risk.

## 1) Pre-Demo Setup

### 1.1 Start Backend
From workspace root:

PowerShell:

cd phantom-trace-main/backend
..\\.venv\\Scripts\\python.exe main.py

Expected:
- Backend starts on http://localhost:8000
- Swagger docs available at http://localhost:8000/docs

### 1.2 Start Frontend
Open a new terminal:

PowerShell:

cd phantom-trace-main/frontend
npm run dev

Expected:
- Frontend starts on http://localhost:5173

### 1.3 Open External Log Sender Site
Open the file in browser:
- external-log-sender-site/index.html

Or serve it quickly:

PowerShell:

cd external-log-sender-site
python -m http.server 5501

Then open:
- http://localhost:5501

## 2) Login and Prepare
1. Open the app at http://localhost:5173.
2. Sign in with your demo account.
3. Keep these pages ready in tabs:
- Dashboard
- Live Alerts
- Log Explorer
- Agent Monitor
- Threat Map
- Reports
- AI Chat

## 3) Demo Round 1: Network Threat Log

### 3.1 Paste this log in External Log Sender
Set Log Type to network and use this payload:

{
  "timestamp": "2026-04-28T16:48:08.710Z",
  "source_ip": "185.220.101.45",
  "destination_ip": "10.42.0.8",
  "action": "coordinated_attack",
  "scan_type": "port_scan",
  "bytes_out": 2100000000,
  "country": "Russia",
  "severity": "CRITICAL",
  "notes": "Port scan followed by large outbound transfer"
}

Click Send Log.

### 3.2 What to Show Immediately After
- Dashboard:
  - Critical alerts count should increase.
  - Live feed should show a fresh item (just now).
  - Threat level gauge should reflect current severity.
- Live Alerts:
  - New top alert with severity and timestamp.
- Log Explorer:
  - New row at top.
  - Expand row to show raw payload.
- Threat Map:
  - Country marker update for source country.

## 4) Demo Round 2: Authentication Threat Log

### 4.1 Paste this log
Set Log Type to auth and use:

{
  "timestamp": "2026-04-28T16:51:20.000Z",
  "source_ip": "203.0.113.18",
  "destination_ip": "10.0.0.42",
  "action": "failed_login_burst",
  "username": "user_42",
  "failed_attempts": 47,
  "country": "Unknown",
  "severity": "HIGH",
  "notes": "Repeated failed authentication attempts from single source"
}

Click Send Log.

### 4.2 What to Highlight
- Dashboard:
  - High alerts count increases.
  - Logs processed today increments.
- Live Alerts:
  - New auth-related alert appears near top.
- Agent Monitor:
  - Auth and orchestrator findings refresh.
- Reports:
  - Alert type distribution and totals update.

## 5) Demo Round 3: Behavioral Threat Log

### 5.1 Paste this log
Set Log Type to behavioral and use:

{
  "timestamp": "2026-04-28T16:54:10.000Z",
  "source_ip": "198.51.100.77",
  "destination_ip": "10.0.0.90",
  "action": "anomalous_user_behavior",
  "username": "analyst_7",
  "failed_attempts": 0,
  "bytes_out": 980000000,
  "country": "Germany",
  "severity": "MEDIUM",
  "notes": "Off-hours access plus unusually high export volume"
}

Click Send Log.

### 5.2 What to Highlight
- Dashboard:
  - Feed and chart refresh with newest event.
- Log Explorer:
  - Behavioral log appears with payload details.
- Agent Monitor:
  - Behavioral findings increase.
- Threat Map:
  - Another origin appears or count increases.

## 6) Show AI Chat Explanation
1. Open AI Chat page.
2. Ask:

Summarize the latest threats and recommended actions for SOC.

3. Explain to audience:
- Chat response is grounded in stored telemetry and agent outputs.
- This is where technical detections are translated into actionable response guidance.

## 7) Optional Swagger Proof (Backend-first)
If you want to prove API behavior directly:
1. Open http://localhost:8000/docs.
2. Use POST /events/ingest with one sample log.
3. Use POST /call-orchestratorAgent for same thread_id.
4. Refresh frontend pages to show updates.

## 8) Demo Narration Script (Short)
Use this sequence while presenting:
1. We ingest a real-time security log from an external site.
2. The backend persists it and triggers agent analysis.
3. Dashboard and Live Alerts update immediately.
4. Log Explorer shows raw payload for auditability.
5. Agent Monitor shows specialist findings.
6. Threat Map shows geographic signal.
7. Reports aggregate trends.
8. AI Chat explains risk and remediation in business language.

## 9) Troubleshooting Checklist
If updates do not appear:
1. Confirm backend is running on port 8000.
2. Confirm frontend is running on port 5173.
3. Check API key in external sender is valid.
4. Verify browser is logged into the same account receiving those logs.
5. Refresh Dashboard, Live Alerts, and Log Explorer.
6. Check browser dev tools network tab for failed requests.
7. Check backend terminal for request errors.

## 10) Fast Reset Between Audience Runs
1. Keep backend and frontend running.
2. Reuse same account.
3. Send the three sample logs again in order.
4. Walk the same page sequence for predictable outcomes.

This gives a consistent 7 to 12 minute live demo with clear proof of ingestion, analysis, and UI updates.
