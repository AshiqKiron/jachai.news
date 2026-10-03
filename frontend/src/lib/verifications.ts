const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

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

export async function submitVerification(body: { text?: string; url?: string }): Promise<VerifySubmitResponse> {
  const response = await fetch(`${API_BASE}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Verify failed: ${response.status}`);
  }
  return response.json() as Promise<VerifySubmitResponse>;
}

export function verificationEventsUrl(jobId: string): string {
  return `${API_BASE}/verifications/jobs/${jobId}/events`;
}

export function verificationWebSocketUrl(jobId: string): string {
  const wsBase = API_BASE.replace(/^http/i, (scheme) => (scheme.toLowerCase() === "https" ? "wss" : "ws"));
  return `${wsBase}/verifications/jobs/${jobId}/ws`;
}

export async function fetchVerifiedClaim(slug: string): Promise<VerifiedClaim | null> {
  const response = await fetch(`${API_BASE}/verifications/${slug}`, {
    next: { revalidate: 120 },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Verification fetch failed: ${response.status}`);
  return response.json() as Promise<VerifiedClaim>;
}

export async function fetchVerifiedClaims(limit = 20): Promise<{ items: VerifiedClaim[]; total: number }> {
  const response = await fetch(`${API_BASE}/verifications?limit=${limit}`, {
    next: { revalidate: 120 },
  });
  if (!response.ok) throw new Error(`Verifications list failed: ${response.status}`);
  return response.json() as Promise<{ items: VerifiedClaim[]; total: number }>;
}

export async function searchVerifiedClaims(
  query: string,
  limit = 20,
): Promise<{ items: VerifiedClaim[]; total: number; query: string }> {
  const response = await fetch(
    `${API_BASE}/verifications/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { next: { revalidate: 60 } },
  );
  if (!response.ok) throw new Error(`Verification search failed: ${response.status}`);
  return response.json() as Promise<{ items: VerifiedClaim[]; total: number; query: string }>;
}
