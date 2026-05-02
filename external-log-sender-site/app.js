const payloadEl = document.getElementById('payload');
const sendBtn = document.getElementById('sendBtn');
const errorEl = document.getElementById('error');
const resultEl = document.getElementById('result');
const ingestResultEl = document.getElementById('ingestResult');
const orchestratorResultEl = document.getElementById('orchestratorResult');
const threadLineEl = document.getElementById('threadLine');

const defaultPayload = {
  timestamp: new Date().toISOString(),
  source_ip: '203.0.113.18',
  destination_ip: '10.42.0.8',
  action: 'failed_login_burst',
  username: 'svc-deploy',
  failed_attempts: 17,
  country: 'Unknown',
  severity: 'HIGH',
  notes: 'Sample log submitted from external customer site',
};

payloadEl.value = JSON.stringify(defaultPayload, null, 2);

async function parseError(response, fallback) {
  try {
    const body = await response.json();
    return body.detail || fallback;
  } catch {
    return fallback;
  }
}

sendBtn.addEventListener('click', async () => {
  errorEl.textContent = '';
  resultEl.classList.add('hidden');
  threadLineEl.textContent = '';

  const apiBaseUrl = document.getElementById('apiBaseUrl').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  const threadId = document.getElementById('threadId').value.trim();
  const logSource = document.getElementById('logSource').value.trim();
  const logType = document.getElementById('logType').value;

  if (!apiBaseUrl || !threadId || !logSource || !logType) {
    errorEl.textContent = 'API base URL, thread ID, log source, and log type are required.';
    return;
  }

  let eventPayload;
  try {
    eventPayload = JSON.parse(payloadEl.value);
  } catch {
    errorEl.textContent = 'Payload must be valid JSON.';
    return;
  }

  threadLineEl.textContent = `thread_id: ${threadId}`;

  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = 'Sending...';

  try {
    const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, '');
    const ingestRes = await fetch(`${normalizedBaseUrl}/events/ingest`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        thread_id: threadId,
        log_source: logSource,
        log_type: logType,
        event_payload: eventPayload,
      }),
    });

    if (!ingestRes.ok) {
      throw new Error(await parseError(ingestRes, `Ingest failed (${ingestRes.status})`));
    }

    const ingestData = await ingestRes.json();

    const orchestratorRes = await fetch(`${normalizedBaseUrl}/call-orchestratorAgent`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        thread_id: threadId,
        message:
          'Analyze the latest ingested security event for this thread, flag if risky, and summarize why in business terms.',
      }),
    });

    if (!orchestratorRes.ok) {
      throw new Error(
        await parseError(orchestratorRes, `Orchestrator failed (${orchestratorRes.status})`)
      );
    }

    const orchestratorData = await orchestratorRes.json();

    ingestResultEl.textContent = JSON.stringify(ingestData, null, 2);
    orchestratorResultEl.textContent = JSON.stringify(orchestratorData, null, 2);
    resultEl.classList.remove('hidden');
  } catch (error) {
    errorEl.textContent = error.message || 'Unexpected error while sending log.';
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send Log';
  }
});
