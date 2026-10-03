import type { AdminSourceStat, IngestResponse } from "@/lib/admin-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function adminHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: "application/json" };
  const key = process.env.ADMIN_API_KEY;
  if (key) headers["X-Admin-Key"] = key;
  return headers;
}

export type AdminOverview = {
  articles_total: number;
  clusters_total: number;
  sources_total: number;
  rumors_total: number;
  latest_article_at: string | null;
  latest_cluster_at: string | null;
  sources: AdminSourceStat[];
  recent_clusters: {
    id: number;
    slug: string;
    title: string;
    created_at: string;
    article_count: number;
  }[];
  ai_provider: string;
  ingest_key_configured: boolean;
  groq_configured: boolean;
  gemini_configured: boolean;
};

export async function fetchAdminOverview(): Promise<AdminOverview | null> {
  try {
    const response = await fetch(`${API_BASE}/admin/overview`, {
      headers: adminHeaders(),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as AdminOverview;
  } catch {
    return null;
  }
}

function ingestHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: "application/json" };
  const ingestKey = process.env.INGEST_API_KEY;
  if (ingestKey) headers["X-Ingest-Key"] = ingestKey;
  return headers;
}

type IngestAccepted = { job_id: string; status: string };

type IngestJobStatus = {
  job_id: string;
  status: string;
  result: IngestResponse | null;
  error: string | null;
};

const INGEST_POLL_MS = 2000;
const INGEST_POLL_MAX_MS = 15 * 60 * 1000;

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollIngestJob(jobId: string): Promise<IngestResponse> {
  const started = Date.now();
  while (Date.now() - started < INGEST_POLL_MAX_MS) {
    const response = await fetch(`${API_BASE}/ingest/jobs/${jobId}`, {
      headers: ingestHeaders(),
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Ingest status failed (${response.status})`);
    }
    const status = (await response.json()) as IngestJobStatus;
    if (status.status === "SUCCESS" && status.result) {
      return status.result;
    }
    if (status.status === "FAILURE") {
      throw new Error(status.error ?? "Ingest job failed.");
    }
    await wait(INGEST_POLL_MS);
  }
  throw new Error("Ingest timed out waiting for the worker.");
}

export async function triggerAdminIngest(): Promise<IngestResponse> {
  const response = await fetch(`${API_BASE}/ingest`, {
    method: "POST",
    headers: ingestHeaders(),
    cache: "no-store",
  });
  if (response.status === 202) {
    const accepted = (await response.json()) as IngestAccepted;
    return pollIngestJob(accepted.job_id);
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Ingest failed (${response.status})`);
  }
  return (await response.json()) as IngestResponse;
}

export async function createAdminSource(payload: {
  name: string;
  feed_url: string;
  bias_score?: number | null;
}): Promise<AdminSourceStat> {
  const response = await fetch(`${API_BASE}/admin/sources`, {
    method: "POST",
    headers: { ...adminHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Create source failed (${response.status})`);
  }
  return (await response.json()) as AdminSourceStat;
}

export async function removeAdminSource(sourceId: number): Promise<AdminSourceStat> {
  const response = await fetch(`${API_BASE}/admin/sources/${sourceId}`, {
    method: "DELETE",
    headers: adminHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Remove source failed (${response.status})`);
  }
  return (await response.json()) as AdminSourceStat;
}

export async function fetchApiHealth(): Promise<boolean> {
  const base = API_BASE.replace(/\/api\/v1\/?$/, "");
  try {
    const response = await fetch(`${base}/health`, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}
