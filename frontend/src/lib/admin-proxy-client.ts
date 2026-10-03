/**
 * Browser calls to Next.js /api/admin/* routes (session cookie auth).
 * Uses the same safe fetch helpers as public API reads.
 */

import { API_WRITE_TIMEOUT_MS, fetchJsonSafe } from "@/lib/api-resilience";

/** Server may poll Celery ingest jobs for up to ~15 minutes. */
export const ADMIN_INGEST_CLIENT_TIMEOUT_MS = 16 * 60 * 1000;

function requestErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function postAdminRoute<T>(
  path: string,
  body?: unknown,
  timeoutMs: number = API_WRITE_TIMEOUT_MS,
): Promise<T> {
  const result = await fetchJsonSafe<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    timeoutMs,
  });
  if (!result.ok) {
    throw new Error(requestErrorMessage(result.error, "Request failed."));
  }
  return result.data;
}

export async function deleteAdminRoute(path: string): Promise<void> {
  const result = await fetchJsonSafe<unknown>(path, {
    method: "DELETE",
    timeoutMs: API_WRITE_TIMEOUT_MS,
  });
  if (!result.ok) {
    throw new Error(requestErrorMessage(result.error, "Request failed."));
  }
}

export async function getAdminRoute<T>(path: string): Promise<T> {
  const result = await fetchJsonSafe<T>(path, { method: "GET" });
  if (!result.ok) {
    throw new Error(requestErrorMessage(result.error, "Request failed."));
  }
  return result.data;
}

export async function patchAdminRoute<T>(path: string, body: unknown): Promise<T> {
  const result = await fetchJsonSafe<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeoutMs: API_WRITE_TIMEOUT_MS,
  });
  if (!result.ok) {
    throw new Error(requestErrorMessage(result.error, "Request failed."));
  }
  return result.data;
}
