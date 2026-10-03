import { unstable_cache } from "next/cache";

import { absolutePublicApiBase, resolveApiBase } from "@/lib/api-base";
import { API_WRITE_TIMEOUT_MS, fetchJsonSafe, parseApiErrorBody } from "@/lib/api-resilience";

function apiBase(): string {
  return resolveApiBase();
}

function clientApiBase(): string {
  return absolutePublicApiBase();
}

export type VerifiedClaim = {
  id: number;
  slug: string;
  claim_text: string;
  verdict: string;
  analysis: string | null;
  tags: string | null;
  status: string;
  cache_source_id: number | null;
  created_at: string;
  updated_at: string;
};

export type VerifySubmitResponse = {
  accepted: boolean;
  guardrail_passed: boolean;
  truncated: boolean;
  verdict?: string | null;
  blocked_reasons?: string[];
  cached?: boolean;
  job_id?: string | null;
  slug?: string | null;
  analysis?: string | null;
};

export type VerificationJobEvent = {
  job_id: string;
  status: string;
  progress: number;
  slug?: string | null;
  message?: string | null;
};

export type VerifiedClaimLookup =
  | { status: "ok"; claim: VerifiedClaim }
  | { status: "not_found" }
  | { status: "unavailable" };

export async function submitVerification(body: { text?: string; url?: string }): Promise<VerifySubmitResponse> {
  const result = await fetchJsonSafe<VerifySubmitResponse>(`${clientApiBase()}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeoutMs: API_WRITE_TIMEOUT_MS,
  });
  if (!result.ok) {
    const message =
      result.error instanceof Error
        ? result.error.message
        : parseApiErrorBody("", "Could not submit claim.");
    throw new Error(message);
  }
  return result.data;
}

export function verificationEventsUrl(jobId: string): string {
  return `${clientApiBase()}/verifications/jobs/${jobId}/events`;
}

export function verificationWebSocketUrl(jobId: string): string {
  const wsBase = clientApiBase().replace(/^http/i, (scheme) => (scheme.toLowerCase() === "https" ? "wss" : "ws"));
  return `${wsBase}/verifications/jobs/${jobId}/ws`;
}

type CachedVerifiedClaimLookup = { status: "ok"; claim: VerifiedClaim } | { status: "not_found" };

async function lookupVerifiedClaimUncached(slug: string): Promise<VerifiedClaimLookup> {
  const result = await fetchJsonSafe<VerifiedClaim>(
    `${apiBase()}/verifications/${encodeURIComponent(slug)}`,
    { next: { revalidate: 120 } },
  );
  if (result.ok) return { status: "ok", claim: result.data };
  if (result.status === 404) return { status: "not_found" };
  return { status: "unavailable" };
}

const lookupVerifiedClaimCached = unstable_cache(
  async (slug: string): Promise<CachedVerifiedClaimLookup> => {
    const result = await fetchJsonSafe<VerifiedClaim>(
      `${apiBase()}/verifications/${encodeURIComponent(slug)}`,
      { next: { revalidate: 120 } },
    );
    if (result.ok) return { status: "ok", claim: result.data };
    if (result.status === 404) return { status: "not_found" };
    throw new Error("verification_lookup_unavailable");
  },
  ["verified-claim-by-slug"],
  { revalidate: 120 },
);

export async function lookupVerifiedClaim(slug: string): Promise<VerifiedClaimLookup> {
  try {
    return await lookupVerifiedClaimCached(slug);
  } catch {
    return lookupVerifiedClaimUncached(slug);
  }
}

/** @deprecated Prefer lookupVerifiedClaim for not-found vs offline handling */
export async function fetchVerifiedClaim(slug: string): Promise<VerifiedClaim | null> {
  const lookup = await lookupVerifiedClaim(slug);
  return lookup.status === "ok" ? lookup.claim : null;
}

export async function fetchVerifiedClaims(limit = 20): Promise<{ items: VerifiedClaim[]; total: number }> {
  const { items, total } = await fetchVerifiedClaimsFeed(limit);
  return { items, total };
}

export async function fetchVerifiedClaimsFeed(
  limit = 20,
): Promise<{ items: VerifiedClaim[]; total: number; fromApi: boolean }> {
  const result = await fetchJsonSafe<{ items: VerifiedClaim[]; total: number }>(
    `${apiBase()}/verifications?limit=${limit}`,
    { next: { revalidate: 120 } },
  );
  if (!result.ok) return { items: [], total: 0, fromApi: false };
  return { ...result.data, fromApi: true };
}

export async function searchVerifiedClaims(
  query: string,
  limit = 20,
): Promise<{ items: VerifiedClaim[]; total: number; query: string; fromApi: boolean }> {
  const result = await fetchJsonSafe<{ items: VerifiedClaim[]; total: number; query: string }>(
    `${apiBase()}/verifications/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { next: { revalidate: 60 } },
  );
  if (!result.ok) {
    return { items: [], total: 0, query, fromApi: false };
  }
  return { ...result.data, fromApi: true };
}
