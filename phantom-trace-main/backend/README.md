# PhantomTrace Backend

FastAPI-based backend for PhantomTrace network anomaly detection system.

## Setup

### Prerequisites
- Python 3.8+
- pip

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

5. Add your API keys to the `.env` file:
- `GOOGLE_API_KEY`: Get from [Google Cloud Console](https://console.cloud.google.com/)
- `VIRUSTOTAL_API_KEY`: Get from [VirusTotal](https://www.virustotal.com/gui/home/upload)

## Running the Server

Start the FastAPI development server:
```bash
python main.py
```

The server will be available at `http://localhost:8000`

### API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### GET /
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "PhantomTrace Backend is running"
}
```

### POST /call-networkAgent
Call the network agent with a message for anomaly detection.

**Request Body:**
```json
{
  "message": "Is this the network agent?",
  "thread_id": "1"
}
```

**Parameters:**
- `message` (string, required): The message to send to the network agent
- `thread_id` (string, optional): Session identifier for maintaining conversation context. Defaults to "1"

**Response:**
```json
{
  "response": "Agent's analysis response",
  "thread_id": "1",
  "status": "success"
}
```

**Example cURL:**
```bash
curl -X POST "http://localhost:8000/call-networkAgent" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze this suspicious network activity",
    "thread_id": "session-123"
  }'
```

### POST /call-authAgent
Call the authentication anomaly agent.

### POST /call-behaviouralAgent
Call the behavioural anomaly agent.

### POST /call-orchestratorAgent
Call the orchestrator agent to choose which specialist agents should run.

### POST /call-explainerAgent
Call the explainer agent to summarize findings and recommended actions.

All agent endpoints use the same request schema:

```json
{
  "message": "Your prompt here",
  "thread_id": "1"
}
```

### POST /events/ingest
Persist a raw event in MongoDB so specialist agents can analyze real telemetry.

**Request Body:**
```json
{
  "thread_id": "session-123",
  "log_source": "sysmon",
  "log_type": "network",
  "event_payload": {
    "source_ip": "10.1.2.5",
    "destination_ip": "198.51.100.17",
    "destination_port": 443,
    "bytes_out": 950000
  }
}
```

### GET /events/latest/{thread_id}
Fetch the latest persisted event for a thread.

## Real Data Workflow (MongoDB)

1. Ingest telemetry with `POST /events/ingest`.
2. Run orchestrator/specialist agents with the same `thread_id`.
3. Backend stores:
  - `threat_events` (raw telemetry events)
  - `agent_results` (agent responses)
  - `agent_flags` (inferred flags)
4. Explainer automatically receives:
   - latest event payload
   - enabled flags per agent
   - cached specialist findings

### Specialist Endpoint Auto-Ingest Behavior

For `POST /call-networkAgent`, `POST /call-authAgent`, `POST /call-behaviouralAgent`, and `POST /call-orchestratorAgent`:

- If `message` is a JSON object string, backend auto-persists it to `threat_events` before running the agent.
- `log_source` and `log_type` are inferred from payload fields when present; otherwise they default to the selected agent name.
- Agent response is persisted to `agent_results` and inferred flags are persisted to `agent_flags`.

This means you can either:

1. Call `POST /events/ingest` first (recommended explicit flow), or
2. Send structured JSON directly in `message` to specialist endpoints and rely on auto-ingest.

### Quick cURL example

Ingest event:
```bash
curl -X POST "http://localhost:8000/events/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id":"session-123",
    "log_source":"sysmon",
    "log_type":"network",
    "event_payload":{"source_ip":"10.1.2.5","destination_ip":"198.51.100.17","destination_port":443,"bytes_out":950000}
  }'
```

Run orchestrator:
```bash
curl -X POST "http://localhost:8000/call-orchestratorAgent" \
  -H "Content-Type: application/json" \
  -d '{"message":"Route this incident to the right agents.","thread_id":"session-123"}'
```

## Project Structure

- `main.py`: FastAPI application entry point
- `network_agent.py`: Network anomaly detection agent implementation
- `auth_agent.py`: Authentication anomaly detection agent implementation
- `behavioural_agent.py`: Behavioural anomaly detection agent implementation
- `orchestrator_agent.py`: Routing/orchestration agent implementation
- `explainer_agent.py`: Final analysis summarization agent implementation
- `requirements.txt`: Python dependencies
- `.env.example`: Example environment variables

## Network Agent Features

The network agent can detect and analyze:
- Port scanning activities
- C2 (Command & Control) beacon patterns
- DNS tunneling attempts
- IP reputation scores
- Network anomaly flags

## Architecture

The backend uses:
- **FastAPI**: Modern web framework for building APIs
- **LangGraph**: For agent orchestration and state management
- **Langchain**: For LLM interactions and tool management
- **Google Generative AI**: For natural language processing
- **VirusTotal API**: For IP reputation checking

## Notes

- API keys are loaded from `.env` (with `.env.example` fallback) via environment variables
- CORS is currently set to allow all origins. In production, restrict this to specific frontend URLs
- Agents use in-memory checkpointing for session management. For production, consider a persistent storage backend
