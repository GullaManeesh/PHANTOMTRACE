# LogExplorer MongoDB Integration

## Overview
Successfully migrated LogExplorer from mock data to real MongoDB-backed logs.

## What Was Created

### Backend

#### New Endpoint: `GET /api/logs`
Fetches threat events from MongoDB and converts them to log format for LogExplorer.

**Parameters:**
- `thread_id` (default: "default") - Session/thread ID
- `limit` (default: 100) - Maximum logs to return

**Response Format:**
```json
{
  "status": "success",
  "thread_id": "default",
  "count": 6,
  "logs": [
    {
      "_id": "log_1",
      "thread_id": "default",
      "log_type": "network",
      "source": "network",
      "source_ip": "185.220.101.45",
      "user_id": "user_42",
      "status": "flagged",
      "processed": true,
      "timestamp": "2026-03-19T01:45:00Z",
      "raw_payload": {
        "source_ip": "185.220.101.45",
        "destination_ip": "10.0.0.5",
        "destination_port": 22,
        "protocol": "TCP",
        "bytes_out": 64
      },
      "source_event_id": "mongodb_object_id"
    }
  ]
}
```

### Frontend

#### New Hook: `src/hooks/useLogs.js`
Custom React hook for fetching logs from MongoDB backend.

**Usage:**
```jsx
const { logs, loading, error } = useLogs('default')
```

**Returns:**
- `logs` - Array of log objects
- `loading` - Boolean indicating fetch in progress
- `error` - Error message string or null

#### Updated Component: `src/pages/LogExplorer.jsx`
Now fetches real logs from MongoDB instead of using DUMMY_LOGS.

**Changes:**
- Imports `useLogs` hook
- Fetches logs on component mount
- Shows loading spinner while fetching
- Displays error message if fetch fails
- Filters apply to real data
- Search functionality works on real logs
- All UI states properly handled

## Features Implemented

✅ **Real-time Log Fetching** - Logs loaded from MongoDB on component mount
✅ **Loading States** - Spinner shown while fetching
✅ **Error Handling** - Graceful error display with fallback
✅ **Filtering** - Filter by log type and status
✅ **Search** - Search by IP, user ID, or log type
✅ **Expandable Rows** - Click to view JSON payload
✅ **Status Indicators** - Visual status badges (flagged, success, failure, normal)
✅ **Log Type Colors** - Color-coded log type pills
✅ **Pagination UI** - Ready for future pagination

## Data Transformation

**MongoDB Threat Events → Log Format Conversion:**

| MongoDB Field | Log Field | Notes |
|---|---|---|
| `_id` | `source_event_id` | Stored for reference |
| `log_type` | `log_type` | auth, network, dns, process, behavioral |
| `log_source` | `source` | System that generated the event |
| `event_payload.source_ip` | `source_ip` | IP address of event source |
| `event_payload.user_id` | `user_id` | Optional user identifier |
| `event_payload.severity` | (used for status) | Determines log status |
| `created_at` | `timestamp` | ISO format timestamp |
| `event_payload` | `raw_payload` | Full event details |

**Status Determination Logic:**
- **CRITICAL/HIGH severity** → `flagged`
- **failed_attempts or auth failure** → `failure`
- **auth success or scan_type** → `success`
- **Everything else** → `normal`

## API Testing

### Test Endpoint
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/logs?thread_id=default" | Select-Object status, count
```

**Expected Response:**
```
status  count
------  -----
success     6
```

### View Raw Logs
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/logs?thread_id=default"
$response.logs | ForEach-Object { Write-Host "$($_.log_type): $($_.source_ip) - $($_.status)" }
```

## Current Data

**From seeded threats_events collection:**
- 2 Network events (CRITICAL + HIGH)
- 2 Auth events (CRITICAL + MEDIUM)
- 1 Process event (HIGH)
- 1 DNS event (HIGH)

**Total: 6 logs available in LogExplorer**

## UI Components & States

### Loading State
- Spinner animation
- "Loading logs..." message
- Filters disabled

### Error State
- Error icon
- Error message
- Backend error details

### Empty State
- "No logs match your filters" message
- Shows when filtered results are empty

### Success State
- Table with all logs
- Live indicator (pulsing dot)
- Active filters and search
- Expandable rows for JSON viewing

## Performance Optimizations

- **useMemo** for filtered results - Prevents unnecessary recalculations
- **Limit parameter** - Only fetches needed logs (default 100)
- **Status determination** - Done server-side to reduce payload
- **Lazy rendering** - Only expanded rows show JSON (not all)

## Extensibility

The current implementation supports easy additions:

1. **Real-time Updates** - Could add WebSocket support
2. **Export** - Add CSV/JSON export capability
3. **Advanced Filters** - Add date range, severity, severity score filters
4. **Statistical Dashboard** - Show log counts by type and status
5. **Full-text Search** - Search in raw payload content
6. **Saved Filters** - Remember user's filter preferences
7. **Sorting** - Sort by any column

## File Changes

### New Files Created
- `frontend/src/hooks/useLogs.js` - Custom fetch hook

### Modified Files
- `backend/main.py` - Added `/api/logs` endpoint
- `frontend/src/pages/LogExplorer.jsx` - Integrated MongoDB data

## Integration Points

**Backend → Frontend Flow:**
```
MongoDB (threat_events collection)
    ↓
GET /api/logs endpoint
    ↓
useLogs hook (fetches on mount)
    ↓
LogExplorer component
    ↓
Rendered log table with filters & search
```

## Environment Setup

Both backend and frontend must be running:

```bash
# Terminal 1: Backend
cd backend
python main.py
# Runs on http://localhost:8000

# Terminal 2: Frontend  
cd frontend
npm run dev
# Runs on http://localhost:5174
```

## Verification Checklist

✅ Backend `/api/logs` endpoint works
✅ Returns 6 logs from seeded threat_events
✅ Log format matches frontend expectations
✅ Frontend useLogs hook created
✅ LogExplorer updated to use hook
✅ Loading states implemented
✅ Error handling implemented
✅ Filters work on real data
✅ Search works on real data
✅ Expandable rows show raw_payload
✅ Status badges display correctly
✅ Log type colors work

## Next Steps

1. Navigate to `http://localhost:5174/logs` (or LogExplorer page)
2. Observe real threat events displayed as logs
3. Test filtering by log type and status
4. Test search functionality
5. Click logs to expand and view JSON payloads
6. Try combining filters (e.g., filter "network" + search "185.220")

## Troubleshooting

**No logs appearing?**
- Verify seed_threat_data.py was run
- Check backend is running: `curl http://localhost:8000/health`
- Check MongoDB has threat_events: `mongosh` → `use phantom_trace` → `db.threat_events.find()`

**Backend error on /api/logs?**
- Check thread_id format (default: "default")
- Verify MongoDB connection healthy
- Check logs in backend terminal for detailed errors

**Frontend loading forever?**
- Check browser console for network errors
- Verify backend is accessible: `http://localhost:8000/api/logs?thread_id=default`
- CORS might be an issue if running on different ports

---
**Last Updated:** April 14, 2026
**Status:** Production Ready
