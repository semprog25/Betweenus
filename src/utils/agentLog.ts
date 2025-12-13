// Small helper to send debug logs to the local ingest server with multiple fallbacks
export function agentLog(payload: {
  sessionId?: string;
  runId?: string;
  hypothesisId?: string;
  location?: string;
  message?: string;
  data?: any;
  timestamp?: number;
}) {
  const bodyObject = {
    sessionId: payload.sessionId || 'debug-session',
    runId: payload.runId || 'pre-fix',
    timestamp: payload.timestamp ?? Date.now(),
    hypothesisId: payload.hypothesisId,
    location: payload.location,
    message: payload.message,
    data: payload.data ?? {},
  };

  const body = JSON.stringify(bodyObject);

  // Attempt multiple endpoints (http + https, 127.0.0.1 + localhost)
  const endpoints = [
    'http://127.0.0.1:7242/ingest/230eee09-780e-4853-9a0e-b17ae57a359b',
    'http://localhost:7242/ingest/230eee09-780e-4853-9a0e-b17ae57a359b',
    'https://127.0.0.1:7242/ingest/230eee09-780e-4853-9a0e-b17ae57a359b',
    'https://localhost:7242/ingest/230eee09-780e-4853-9a0e-b17ae57a359b',
  ];

  endpoints.forEach((url) => {
    try {
      // Prefer sendBeacon when available (fires even on page unload)
      if (navigator?.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        return;
      }

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        mode: 'no-cors',
        cache: 'no-store',
        keepalive: true,
      }).catch(() => {});
    } catch (err) {
      // Swallow errors so the app flow is not affected
      console.info('[agent-log:fallback]', { error: (err as any)?.message, body: bodyObject });
    }
  });

  // As a last resort, emit to console so the user can copy logs if network is blocked
  console.info('[agent-log]', bodyObject);
}

