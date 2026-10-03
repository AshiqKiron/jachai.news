/** Strict security headers for Next.js (CSP tuned for Supabase + API + Sentry). */

import { DEV_BACKEND_ORIGIN } from "./api-base";

const API_ORIGIN = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
  if (raw.startsWith("/")) {
    return "";
  }
  try {
    return new URL(raw).origin;
  } catch {
    return DEV_BACKEND_ORIGIN;
  }
})();

const SUPABASE_ORIGIN = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
})();

function buildContentSecurityPolicy(): string {
  const connectSources = [
    "'self'",
    API_ORIGIN,
    SUPABASE_ORIGIN,
    "https://*.ingest.sentry.io",
    "https://*.sentry.io",
  ].filter(Boolean);

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https:",
    `connect-src ${connectSources.join(" ")}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  if (process.env.NODE_ENV === "production") {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export function securityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Security-Policy": buildContentSecurityPolicy(),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-DNS-Prefetch-Control": "off",
  };

  if (process.env.NODE_ENV === "production") {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }

  return headers;
}
