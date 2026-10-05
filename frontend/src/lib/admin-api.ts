import { unstable_cache } from "next/cache";

import { SERVER_API_BASE, serverApiOrigin } from "@/lib/api-base";
import {
  API_LISTING_TIMEOUT_MS,
  API_WRITE_TIMEOUT_MS,
  fetchJsonSafe,
} from "@/lib/api-resilience";
import type { AdminIngestSchedule, AdminSourceStat, IngestResponse } from "@/lib/admin-types";

const API_BASE = SERVER_API_BASE;
const ADMIN_OVERVIEW_REVALIDATE_SEC = 15;
const ADMIN_HEALTH_TIMEOUT_MS = 500;

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
  ingest_schedule: AdminIngestSchedule;
};

async function fetchAdminOverviewUncached(): Promise<AdminOverview | null> {
  const result = await fetchJsonSafe<AdminOverview>(`${API_BASE}/admin/overview`, {
    headers: adminHeaders(),
    next: { revalidate: ADMIN_OVERVIEW_REVALIDATE_SEC },
    timeoutMs: API_LISTING_TIMEOUT_MS,
  });
  return result.ok ? result.data : null;
}

const getAdminOverviewCached = unstable_cache(
  fetchAdminOverviewUncached,
  ["admin-overview"],
  { revalidate: ADMIN_OVERVIEW_REVALIDATE_SEC },
);

export async function fetchAdminOverview(): Promise<AdminOverview | null> {
  return getAdminOverviewCached();
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

export async function fetchAdminIngestSchedule(): Promise<AdminIngestSchedule | null> {
  const result = await fetchJsonSafe<AdminIngestSchedule>(`${API_BASE}/admin/ingest-schedule`, {
    headers: adminHeaders(),
    cache: "no-store",
    timeoutMs: API_LISTING_TIMEOUT_MS,
  });
  return result.ok ? result.data : null;
}

export async function updateAdminIngestSchedule(intervalMinutes: number): Promise<AdminIngestSchedule> {
  const response = await fetch(`${API_BASE}/admin/ingest-schedule`, {
    method: "PATCH",
    headers: { ...adminHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ interval_minutes: intervalMinutes }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Update ingest schedule failed (${response.status})`);
  }
  return (await response.json()) as AdminIngestSchedule;
}

function adminBackendActionError(error: unknown, action: string): Error {
  if (error instanceof Error) {
    if (error.message === "fetch failed" || error.message === "Request timed out") {
      return new Error(
        `Backend unreachable — could not ${action}. Start the API (npm run dev:backend or npm run stack:up) and verify API_URL on the Next server.`,
      );
    }
    return error;
  }
  return new Error(`Could not ${action}.`);
}

export async function createAdminSource(payload: {
  name: string;
  feed_url: string;
  bias_score?: number | null;
}): Promise<AdminSourceStat> {
  const result = await fetchJsonSafe<AdminSourceStat>(`${API_BASE}/admin/sources`, {
    method: "POST",
    headers: { ...adminHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    timeoutMs: API_WRITE_TIMEOUT_MS,
  });
  if (!result.ok) {
    throw adminBackendActionError(result.error, "add RSS feed");
  }
  return result.data;
}

export async function removeAdminSource(sourceId: number): Promise<AdminSourceStat> {
  const result = await fetchJsonSafe<AdminSourceStat>(`${API_BASE}/admin/sources/${sourceId}`, {
    method: "DELETE",
    headers: adminHeaders(),
    cache: "no-store",
    timeoutMs: API_WRITE_TIMEOUT_MS,
  });
  if (!result.ok) {
    throw adminBackendActionError(result.error, "remove RSS feed");
  }
  return result.data;
}

const ADMIN_SOURCE_INGEST_TIMEOUT_MS = 5 * 60 * 1000;

export async function triggerAdminSourceIngest(sourceId: number): Promise<IngestResponse> {
  const result = await fetchJsonSafe<IngestResponse>(`${API_BASE}/admin/sources/${sourceId}/ingest`, {
    method: "POST",
    headers: adminHeaders(),
    cache: "no-store",
    timeoutMs: ADMIN_SOURCE_INGEST_TIMEOUT_MS,
  });
  if (!result.ok) {
    throw adminBackendActionError(result.error, "fetch RSS feed");
  }
  return result.data;
}

async function fetchApiHealthUncached(): Promise<boolean> {
  const base = serverApiOrigin();
  try {
    const response = await fetch(`${base}/health`, {
      next: { revalidate: ADMIN_OVERVIEW_REVALIDATE_SEC },
      signal: AbortSignal.timeout(ADMIN_HEALTH_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

const getApiHealthCached = unstable_cache(fetchApiHealthUncached, ["api-health"], {
  revalidate: ADMIN_OVERVIEW_REVALIDATE_SEC,
});

export async function fetchApiHealth(): Promise<boolean> {
  return getApiHealthCached();
}
