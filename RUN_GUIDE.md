# PhantomTrace — Complete Run Guide

## Prerequisites
- **Node.js 18+** (for frontend)
- **Python 3.8+** (for backend)
- **Docker** (recommended for MongoDB; or install MongoDB locally)

---

## Quick Start (All Services)

### 1. Start MongoDB (via Docker)

Open **Terminal 1** and run:

```powershell
docker run -d --name phantomtrace-mongo -p 27017:27017 -v phantomtrace-mongo-data:/data/db mongo:6.0
```

Verify it started:
```powershell
docker ps
# Should show: phantomtrace-mongo   RUNNING   0.0.0.0:27017->27017/tcp
```

---

### 2. Start Backend

Open **Terminal 2** and navigate to backend:

```powershell
cd phantom-trace-main/backend
```

Activate virtual environment:
```powershell
.venv\Scripts\Activate.ps1
```

Start the server:
```powershell
python main.py
```

Expected output:
```
✓ MongoDB initialized successfully
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

Backend URL: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

---

### 3. Start Frontend

Open **Terminal 3** and navigate to frontend:

```powershell
cd phantom-trace-main/frontend
npm install
npm run dev
```

Expected output:
```
  VITE v5.0.10  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

Frontend URL: **http://localhost:5173**

---

### 4. Start External Log Sender

Open **Terminal 4** and navigate to log sender:

```powershell
cd external-log-sender-site
python -m http.server 5501
```

Expected output:
```
Serving HTTP on :: port 5501 (http://[::]:5501/) ...
```

Log Sender URL: **http://localhost:5501**

---

## Verify Everything Is Running

### Check Backend Health
```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/health' -Method Get | ConvertTo-Json
```

Expected response:
```json
{
  "status": "healthy",
  "mongodb": {
    "status": "healthy",
    "database": "phantom_trace",
    "collections": ["agent_results", "threat_events", "agent_flags", ...],
    "required_collections_present": true
  }
}
```

---

## Demo: Send a Test Event

### Step 1: Open Browser Windows

1. **Frontend:** http://localhost:5173
2. **Log Sender:** http://localhost:5501
3. **API Docs:** http://localhost:8000/docs (optional)

### Step 2: Register a User

In PowerShell:

```powershell
$body = @{
    name = 'Demo User'
    email = 'demo@local.test'
    password = 'DemoPassword123!'
    website_name = 'Demo Site'
    website_url = 'https://demo.local'
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/auth/register' `
  -Method Post `
  -Body $body `
  -ContentType 'application/json'

Write-Host "Login token: $($response.access_token)"
Write-Host "API Key: $($response.api_key)"
```

### Step 3: Login in Frontend

1. Go to **http://localhost:5173**
2. Click **Sign Up**
3. Enter:
   - Name: `Demo User`
   - Email: `demo@local.test`
   - Password: `DemoPassword123!`
4. Click **Sign Up** → redirects to Dashboard

### Step 4: Send a Sample Event

In PowerShell, send a threat event:

```powershell
$token = 'YOUR_TOKEN_FROM_REGISTER'  # Replace with token from Step 2

$body = @{
    thread_id = 'demo-session-1'
    log_source = 'external-site'
    log_type = 'network'
    event_payload = @{
        timestamp = '2026-05-02T14:30:00Z'
        source_ip = '185.220.101.45'
        destination_ip = '10.42.0.8'
        action = 'coordinated_attack'
        scan_type = 'port_scan'
        bytes_out = 2100000000
        country = 'Russia'
        severity = 'CRITICAL'
        notes = 'Port scan followed by large outbound transfer'
    }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri 'http://127.0.0.1:8000/events/ingest' `
  -Method Post `
  -Headers @{'Authorization' = "Bearer $token"} `
  -Body $body `
  -ContentType 'application/json' | ConvertTo-Json -Depth 5
```

### Step 5: Watch Frontend Update

- Go back to **Frontend Dashboard** (http://localhost:5173)
- Click through pages to see the new alert:
  - **Dashboard** → Critical alert count increases
  - **Live Alerts** → New CRITICAL alert appears
  - **Log Explorer** → New raw event in table
  - **Agent Monitor** → Agent findings populate
  - **Threat Map** → Russia marker appears/updates
  - **Reports** → Statistics update

---

## Troubleshooting

### MongoDB Won't Start (Docker)
```powershell
# Check if port 27017 is already in use
netstat -ano | findstr :27017

# Kill existing process or use a different port
docker run -d --name phantomtrace-mongo -p 27018:27017 mongo:6.0
# Then update MONGO_URI in backend/.env to: mongodb://localhost:27018
```

### Backend Won't Start
1. Check `.venv` exists:
   ```powershell
   Test-Path .\phantom-trace-main\backend\.venv
   ```
2. Verify `.env` file:
   ```powershell
   Get-Content .\phantom-trace-main\backend\.env
   ```
3. Check for import errors:
   ```powershell
   cd phantom-trace-main\backend
   .venv\Scripts\python.exe -c "import fastapi; print('FastAPI OK')"
   ```

### Frontend Won't Load
1. Clear npm cache:
   ```powershell
   cd phantom-trace-main\frontend
   npm cache clean --force
   rm -r node_modules package-lock.json
   npm install
   npm run dev
   ```

### Can't Register User
- Ensure MongoDB is running: `docker ps`
- Check backend logs for MongoDB errors
- Verify `MONGO_URI=mongodb://localhost:27017` in `.env`

---

## Cleanup (Stop All Services)

```powershell
# Stop Docker MongoDB
docker stop phantomtrace-mongo
docker rm phantomtrace-mongo

# Remove data volume (optional)
docker volume rm phantomtrace-mongo-data
```

---

## Next Steps

After seeing the demo work:
1. Try different threat types (auth, behavioral)
2. Use AI Chat to ask about threat details
3. Manage API keys in Settings
4. Review agent findings in Agent Monitor
5. Explore Reports and Threat Map

Enjoy! 🚀
