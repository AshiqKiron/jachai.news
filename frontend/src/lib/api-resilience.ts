/** Fail fast when the backend is down so SSR can fall back to demo data. */
export const API_FETCH_TIMEOUT_MS = 2_500;

/** Listing pages stream a shell first — abort slow API reads sooner. */
export const API_LISTING_TIMEOUT_MS = 750;

/** Writes (verify submit, admin) need more time but should still abort. */
export const API_WRITE_TIMEOUT_MS = 30_000;

export type SafeFetchInit = RequestInit & {
  next?: { revalidate?: number };
  timeoutMs?: number;
};

export type SafeFetchResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number | null; error: unknown };

function requestTimeoutMs(init?: SafeFetchInit): number {
  return init?.timeoutMs ?? API_FETCH_TIMEOUT_MS;
}

export function parseApiErrorBody(body: string, fallback = "Request failed."): string {
  const trimmed = body.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = JSON.parse(trimmed) as { detail?: unknown; error?: unknown };
    if (typeof parsed.error === "string" && parsed.error.length > 0) return parsed.error;
    const detail = parsed.detail;
    if (typeof detail === "string" && detail.length > 0) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      if (typeof first?.msg === "string") return first.msg;
    }
  } catch {
    /* plain text */
  }
  return trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed;
}

export async function fetchJsonSafe<T>(url: string, init?: SafeFetchInit): Promise<SafeFetchResult<T>> {
  const { timeoutMs: _timeout, ...fetchInit } = init ?? {};
  const timeoutMs = requestTimeoutMs(init);

  try {
    const response = await fetch(url, {
      ...fetchInit,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const raw = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: new Error(parseApiErrorBody(raw, `HTTP ${response.status}`)),
      };
    }
    if (!raw.trim()) {
      return { ok: false, status: response.status, error: new Error("Empty response body") };
    }
    try {
      const data = JSON.parse(raw) as T;
      return { ok: true, data, status: response.status };
    } catch (error) {
      return { ok: false, status: response.status, error };
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return { ok: false, status: null, error: new Error("Request timed out") };
    }
    return { ok: false, status: null, error };
  }
}
