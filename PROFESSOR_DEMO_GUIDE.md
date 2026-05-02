# PhantomTrace Project Explanation for Professor

## Project Overview

**PhantomTrace** is an AI-powered cybersecurity threat detection platform that simulates real-world security monitoring. It demonstrates:
1. **Log ingestion** from external websites/sources
2. **Multi-agent AI analysis** to detect security threats
3. **Real-time UI updates** showing threat severity, analysis, and recommendations
4. **User authentication & API key management** for secure access

---

## Architecture (3 Main Components)

### 1️⃣ External Log Sender Site
**Location:** `external-log-sender-site/`  
**Purpose:** Simulates a customer website sending security logs to PhantomTrace

**How it works:**
- Open `index.html` in browser (or run `python -m http.server 5501`)
- Contains pre-written sample logs for different threat types:
  - **Network threats:** Port scans, DNS tunneling, C2 communication
  - **Auth threats:** Brute force attacks, suspicious logins
  - **Behavioral threats:** Data exfiltration, unusual patterns
- User selects a log example, clicks "Send Event"
- Backend receives it via `POST /events/ingest` endpoint

---

### 2️⃣ FastAPI Backend (Orchestrated AI Agents)
**Location:** `backend/`  
**Purpose:** Analyzes logs using specialized AI agents

**Architecture:**
```
Log arrives → Orchestrator Agent (decides which specialists to use)
                    ↓
            ┌──────┼──────┐
            ↓      ↓      ↓
      Network   Auth    Behavioral
      Agent     Agent   Agent
            ↓      ↓      ↓
            └──────┼──────┘
                    ↓
            Explainer Agent (summarizes findings)
                    ↓
            Results cached in MongoDB & displayed in frontend
```

**Key Agents:**

| Agent | Analyzes | Looks For |
|-------|----------|-----------|
| **Network Agent** | Network traffic patterns | Port scans, C2 communication, DNS tunneling, data exfiltration |
| **Auth Agent** | Authentication logs | Brute force attacks, impossible logins, credential stuffing |
| **Behavioral Agent** | User behavior | Unusual file access, suspicious patterns, policy violations |
| **Orchestrator** | All incoming logs | Which agents should run (uses LLM reasoning) |
| **Explainer** | All agent findings | Summarizes threats + recommends actions for security team |

**API Flow:**
```
POST /events/ingest
├─ Stores raw log in SQLite
└─ Returns thread_id

POST /call-orchestratorAgent
├─ Reads latest event
├─ Calls Network/Auth/Behavioral agents (in parallel)
├─ Caches all results in MongoDB
└─ Returns analysis

Backend logs accessible at: http://localhost:8000/docs
```

---

### 3️⃣ React Frontend (Dashboard UI)
**Location:** `frontend/`  
**Purpose:** Displays threat analysis and lets users interact with the platform

**Key Pages & What Updates:**

#### 📊 **Dashboard Page**
- **What it shows:**
  - Summary of recent alerts (severity breakdown)
  - Active threats count
  - Agent status indicators
  - Threat timeline chart
- **What updates:** When a new log is processed, alert count & chart refresh automatically

#### 🚨 **Alert Feed Page**
- **What it shows:**
  - List of all detected threats
  - Severity badges (CRITICAL, HIGH, MEDIUM, LOW)
  - Threat source (Network/Auth/Behavioral)
  - Timestamp and description
- **What updates:** New threats appear at top of list with animated entry
- **Example:** After sending a port scan log → "Port Scan Detected" alert appears in red (CRITICAL)

#### 📜 **Log Explorer Page**
- **What it shows:**
  - Raw log events ingested from external site
  - Sortable/filterable by type, timestamp, severity
  - Full event details on click
- **What updates:** When external site sends a log → new entry appears in table
- **Example:** Click "Send Event" on external site → log appears here immediately

#### 🤖 **Agent Monitor Page**
- **What it shows:**
  - Status of each specialist agent (Network, Auth, Behavioral)
  - Last analysis time
  - Threat flags each agent detected
  - Agent response summaries
- **What updates:** After orchestrator runs → agent flags & responses populate
- **Example:** 
  - Network Agent finds: `flag_port_scan: true`
  - Auth Agent finds: `flag_suspicious_login: false`
  - Behavioral Agent finds: `flag_data_exfil: false`

#### 💬 **AI Chat Page**
- **What it shows:**
  - Chat interface for asking questions about threats
  - Explainer agent provides recommendations
- **What updates:** User asks question → backend returns AI analysis
- **Example:** "Why was this alert critical?" → Explainer explains the risk factors

#### ⚙️ **Settings Page (API Key Management)**
- **What it shows:**
  - List of API keys (masked for security)
  - Create new API key
  - Delete existing keys
- **What updates:** User can generate/revoke keys for external services
- **Example:** Create key → frontend shows it once, then masks it

---

## End-to-End Demo Flow (What to Show Professor)

### **Setup (30 seconds)**

1. **Start Backend:**
   ```bash
   cd backend
   python main.py
   ```
   Shows: `✓ MongoDB initialized successfully` + `Application startup complete`

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   Shows: Vite server starts on `http://localhost:5173`

---

### **Demo 1: Network Threat Detection (3-4 minutes)**

**Goal:** Show how a log flows from external site → backend analysis → frontend update

**Use this exact log for the live demo:**

```json
{
  "timestamp": "2026-04-21T14:23:00Z",
  "source_ip": "185.220.101.45",
  "destination_ip": "10.0.0.42",
  "action": "coordinated_attack",
  "scan_type": "port_scan",
  "username": "user_42",
  "failed_attempts": 47,
  "bytes_out": 2100000000,
  "country": "Russia",
  "severity": "CRITICAL",
  "notes": "Port scan followed by 47 SSH brute force attempts targeting user_42 from a TOR exit node"
}
```

**Steps:**

1. **Open external log sender:**
   - Navigate to `external-log-sender-site/index.html` (or `http://localhost:5501`)
   - Paste the exact JSON above into the payload box

2. **Send the log:**
   - Click "Send Event"
   - **Backend does:** `POST /events/ingest` stores log, generates `thread_id`

3. **Watch Frontend Update:**
   - Switch to `http://localhost:5173` (Dashboard)
   - **Sidebar and top stats change:**
     - The alert count increases by 1
     - The critical counter increases by 1
     - The high/critical ratio on Reports gets worse
   - **Live Alerts page:**
     - A new red CRITICAL alert appears at the top
     - The alert should mention a coordinated attack / port scan / brute force chain
   - **Reports page:**
     - `Total Alerts` increases by 1
     - `Critical Incidents` increases by 1
     - `Avg Severity` moves upward
     - The `Alerts by Severity` chart gains one more critical slice
     - The `Alert Types` chart increases for `Coordinated Attack` and `Brute Force Login`
   - **Threat Map page:**
     - Russia becomes more prominent on the map
     - The marker around Moscow/Russia shows one more alert and stays at CRITICAL severity
   - **Log Explorer page:**
     - A new raw event row appears at the top
     - You can open it to show `source_ip`, `destination_ip`, `username`, `failed_attempts`, and `country`
   - **Alert Detail page:**
     - The timeline fills with the event chain
     - MITRE techniques such as `Network Service Scanning` and `Brute Force` appear
     - Recommended actions become visible
   - **AI Chat page:**
     - Ask: `Why was the last alert marked critical?`
     - The chat should return the critical-summary explanation about the TOR exit node, the port scan, and the 47 brute force attempts against `user_42`

**What Professor Sees:**
- ✅ Log sent from external system
- ✅ Backend processes it (orchestrator calls specialist agents)
- ✅ Frontend sidebar & pages **automatically update** with new threat info
- ✅ AI agents correctly identified the threat type

---

### **Demo 2: API Key Management (2-3 minutes)**

**Goal:** Show authentication & API key setup for external integrations

**Steps:**

1. **Navigate to Settings:**
   - Click Settings icon in sidebar
   - Show: "API Keys" section

2. **Create a New API Key:**
   - Click "Generate New Key"
   - Show: Key appears (masked after creation)
   - Show: Backend stored it in MongoDB

3. **Delete an API Key:**
   - Click "Delete" on a key
   - Show: Key removed from list

**What Professor Sees:**
- ✅ Users can create/manage API keys
- ✅ Keys are stored securely (masked in UI)
- ✅ External services can authenticate before sending logs

---

### **Demo 3: Chat & Explainer (2 minutes)**

**Goal:** Show how AI explains threats to security team

**Steps:**

1. **Navigate to Chat page:**
   - Click "AI Chat" in sidebar

2. **Ask a question:**
   - Type: "Why was the last alert marked critical?"
   - Show: Explainer agent responds with risk analysis
   - Example response: "Port scan targeting your entire network with 65K+ connection attempts from a TOR exit node in Russia with high reputation score = reconnaissance for further attack"

**What Professor Sees:**
- ✅ AI summarizes why threats are serious
- ✅ Provides context: IP reputation, geolocation, volume, patterns

---

## Sidebar Proof of Updates ✅

The **sidebar** is the best place to show updates because it displays:

1. **Alert Summary Card** - Shows "X Active Alerts" (increments as new logs arrive)
2. **Agent Status Indicators** - Shows which agents ran (✓ Network, ✓ Auth, ✓ Behavioral)
3. **Last Updated Timestamp** - "Updated 2 minutes ago"
4. **Navigation Links** - Each page (Dashboard, Alerts, Logs, Agents, Chat) lights up when has new data

If you want to narrate the proof clearly, say: "I’m sending one exact event, and I expect the same event to appear in Live Alerts, the reports counters to increase, Russia to become more prominent on the map, Log Explorer to show the raw JSON, and Chat to explain why it was critical."

---

## Technology Stack to Mention

| Layer | Tech | Purpose |
|-------|------|---------|
| **Frontend** | React 18 + Vite | Real-time UI dashboard |
| **Backend** | FastAPI (Python) | REST API for log ingestion & AI agents |
| **AI Agents** | LangChain/Claude API | Threat analysis (orchestrator, specialists, explainer) |
| **Database** | MongoDB | Store threat events & agent findings |
| **Storage** | SQLite | Cache raw events |
| **Auth** | JWT + API Keys | Secure external integrations |

---

## Key Features to Highlight for Professor

✅ **Multi-Agent AI Orchestration** - Not just one AI, but specialized agents working together  
✅ **Real-time Event Processing** - Logs → Analysis → UI all within seconds  
✅ **Deterministic Fallback** - If LLM tool-calling incomplete, backend runs all agents anyway  
✅ **Result Caching** - MongoDB stores findings so explainer has rich context  
✅ **Full-Stack Implementation** - External ingestion → Backend logic → React UI  
✅ **Security Best Practices** - API key management, JWT auth, masked secrets  

---

## Common Questions & Answers

**Q: How does the system know when to run which agent?**  
A: The Orchestrator agent reads incoming logs and uses LLM reasoning to decide (Network threat? Call Network Agent; Auth logs? Call Auth Agent). Has deterministic fallback to run all three if LLM response incomplete.

**Q: What if log ingestion fails?**  
A: Fallback to SQLite, then MongoDB. Backend continues serving analysis even if primary DB slow.

**Q: Can multiple users see the same threat?**  
A: Each user authenticated with API key sees only their own logs/alerts (multi-tenant design).

**Q: Why cache agent findings?**  
A: Explainer needs full context (latest event + all agent flags + specialist summaries) to provide best recommendation. Cache avoids re-running expensive agents.

---

## Command Cheat Sheet for Live Demo

```bash
# Start everything
cd backend && python main.py              # Terminal 1 - Backend (port 8000)
cd frontend && npm run dev                # Terminal 2 - Frontend (port 5173)
python -m http.server 5501 -d external-log-sender-site  # Terminal 3 - Log sender (port 5501)

# Check backend
curl http://localhost:8000/docs           # Swagger UI - see all endpoints
curl http://localhost:8000/               # Health check

# Example: Send port scan log and analyze
# 1. Copy log from external-log-sender-site/index.html
# 2. Submit via form (calls POST /events/ingest + POST /call-orchestratorAgent)
# 3. Watch http://localhost:5173 update with new alert/log/agent findings
```

---

## File Structure Reference

```
project/
├── external-log-sender-site/          ← Point 1: Send logs from here
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── backend/                           ← Point 2: Analysis happens here
│   ├── main.py                        (FastAPI entry)
│   ├── orchestrator_agent.py          (Decides which agents run)
│   ├── network_agent.py               (Detects network threats)
│   ├── auth_agent.py                  (Detects auth threats)
│   ├── behavioural_agent.py           (Detects behavior threats)
│   ├── explainer_agent.py             (Summarizes findings)
│   ├── mongodb_db.py                  (Store results)
│   └── requirements.txt
│
└── frontend/                          ← Point 3: Results display here
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx           (Alert summary)
    │   │   ├── AlertDetail.jsx         (Threat details)
    │   │   ├── LogExplorer.jsx         (Raw log viewer)
    │   │   ├── AgentMonitor.jsx        (Agent flags & findings)
    │   │   ├── Chat.jsx                (AI explainer chat)
    │   │   └── ApiKeySetup.jsx         (API key management)
    │   ├── components/
    │   │   └── layout/Sidebar.jsx      (Navigation + alert count)
    │   └── App.jsx
    └── package.json
```

---

## Expected Professor Questions & Answers

**Q: Is the data real?**  
A: No, we simulate threats with realistic JSON payloads. In production, would receive actual sysmon/network logs from real infrastructure.

**Q: What if an agent crashes?**  
A: Orchestrator catches exceptions and has fallback logic. If one agent fails, others still run and findings cached.

**Q: How fast is the analysis?**  
A: From log submit → frontend update: typically 2-5 seconds (API call + AI thinking + result cache + React re-render).

**Q: Can users download reports?**  
A: Frontend has Reports page (stubbed). Could add PDF export in future.

**Q: How do you prevent unauthorized log access?**  
A: API Key authentication on /events/ingest. User can only see logs they ingested. MongoDB queries scoped to user_id.

---

## Summary for Professor

**In 10 minutes, you show:**

1. **Log Sender (30 sec):** External website sends security logs
2. **Backend Analysis (20 sec):** AI agents orchestrate & analyze threats
3. **Frontend Updates (3 min):** Sidebar, alerts, logs, agent findings all appear in real-time
4. **Settings (1 min):** API key management for secure integrations
5. **Chat (1 min):** AI explainer summarizes findings & recommendations

**The key proof:** Sidebar updates instantly with new alerts/threat count after each log submission. Each page (Dashboard, Alerts, Logs, Agents) auto-populates with the analysis results.

---

**Good luck with your presentation! 🚀**
