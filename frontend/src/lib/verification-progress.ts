import { verificationEventsUrl, verificationWebSocketUrl, type VerificationJobEvent } from "@/lib/verifications";

export type JobProgressHandlers = {
  onUpdate: (payload: VerificationJobEvent) => void;
  onError: (message: string) => void;
};

export function subscribeVerificationJob(jobId: string, handlers: JobProgressHandlers): () => void {
  if (typeof WebSocket === "undefined") {
    return subscribeVerificationJobSse(jobId, handlers);
  }

  const ws = new WebSocket(verificationWebSocketUrl(jobId));
  let opened = false;
  let sseCleanup: (() => void) | null = null;

  const startSse = () => {
    if (!sseCleanup) {
      sseCleanup = subscribeVerificationJobSse(jobId, handlers);
    }
  };

  const cleanup = () => {
    ws.close();
    sseCleanup?.();
  };

  ws.onopen = () => {
    opened = true;
  };

  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data) as VerificationJobEvent & { error?: string; message?: string };
    if (payload.error === "not_found") {
      handlers.onError(payload.message ?? "Job not found.");
      cleanup();
      return;
    }
    handlers.onUpdate(payload);
    if (payload.status === "completed" || payload.status === "cached" || payload.status === "failed") {
      cleanup();
    }
  };

  ws.onerror = () => {
    if (!opened) {
      startSse();
    }
  };

  window.setTimeout(() => {
    if (!opened && ws.readyState !== WebSocket.OPEN) {
      startSse();
    }
  }, 2000);

  return cleanup;
}

function subscribeVerificationJobSse(jobId: string, handlers: JobProgressHandlers): () => void {
  const es = new EventSource(verificationEventsUrl(jobId));
  es.onmessage = (event) => {
    const payload = JSON.parse(event.data) as VerificationJobEvent;
    handlers.onUpdate(payload);
    if (payload.status === "completed" || payload.status === "cached" || payload.status === "failed") {
      es.close();
    }
  };
  es.onerror = () => {
    es.close();
    handlers.onError("Lost connection to verification stream.");
  };
  return () => es.close();
}
