import type { IngestResponse } from "@/lib/admin-types";

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
  sources: {
    source_id: number;
    name: string;
    feed_url: string;
    article_count: number;
    bias_score: number | null;
  }[];
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

export async function triggerAdminIngest(): Promise<IngestResponse> {
  const headers: HeadersInit = { Accept: "application/json" };
  const ingestKey = process.env.INGEST_API_KEY;
  if (ingestKey) headers["X-Ingest-Key"] = ingestKey;

  const response = await fetch(`${API_BASE}/ingest`, {
    method: "POST",
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Ingest failed (${response.status})`);
  }
  return (await response.json()) as IngestResponse;
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
