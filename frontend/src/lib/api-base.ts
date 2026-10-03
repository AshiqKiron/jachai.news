/** Browser / same-origin (Next rewrites → FastAPI on 8000). */
export const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

/**
 * Server-side fetches hit uvicorn directly (avoids proxy loop, faster SSR).
 * Set API_URL in `.env.local` when the API is not on localhost:8000.
 */
export const SERVER_API_BASE =
  process.env.API_URL ?? "http://127.0.0.1:8000/api/v1";

export function resolveApiBase(): string {
  return typeof window === "undefined" ? SERVER_API_BASE : absolutePublicApiBase();
}

/** Absolute API base for fetches, SSE, and WebSockets in the browser. */
export function absolutePublicApiBase(): string {
  if (PUBLIC_API_BASE.startsWith("/")) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${PUBLIC_API_BASE}`;
    }
    return SERVER_API_BASE;
  }
  return PUBLIC_API_BASE;
}

export function serverApiOrigin(): string {
  return SERVER_API_BASE.replace(/\/api\/v1\/?$/, "");
}
