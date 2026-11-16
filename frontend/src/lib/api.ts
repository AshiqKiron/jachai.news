import { resolveApiBase } from "@/lib/api-base";
import { API_FETCH_TIMEOUT_MS, API_LISTING_TIMEOUT_MS, fetchJsonSafe } from "@/lib/api-resilience";

function apiBase(): string {
  return resolveApiBase();
}

export { API_FETCH_TIMEOUT_MS };

export type Article = {
  id: number;
  source_id: number;
  cluster_id: number | null;
  title: string;
  url: string;
  excerpt: string | null;
  image_url?: string | null;
  published_at: string | null;
  is_rumor: boolean;
  /** Present on cluster detail payloads when the API joins source metadata. */
  source_name?: string | null;
  bias_score?: number | null;
  owner_name?: string | null;
  owner_url?: string | null;
  parent_name?: string | null;
  parent_url?: string | null;
  original_title?: string | null;
  original_seen_at?: string | null;
  headline_edited_at?: string | null;
  correction_noted?: boolean;
  social_preview_title?: string | null;
  social_preview_description?: string | null;
  social_preview_image_url?: string | null;
  author?: string | null;
  section?: string | null;
  perspective?: PerspectiveApi | null;
  rumor_flag_reason?: string | null;
  rumor_marked_at?: string | null;
  first_seen_at?: string | null;
  updated_at?: string | null;
  last_ingested_at?: string | null;
  availability_status?: string | null;
  last_availability_check?: string | null;
  removed_at?: string | null;
  removed_headline?: string | null;
  removed_excerpt?: string | null;
  archive_snapshot_url?: string | null;
};

export type PerspectiveApi = "neutral" | "establishment" | "opposition" | "international";

export type Cluster = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  topic_id?: string;
  category?: string | null;
  category_bn?: string | null;
  created_at: string;
  updated_at?: string | null;
  last_article_at?: string | null;
  articles?: Article[];
};

export type ClusterDetail = Cluster & {
  articles: Article[];
};

export type SourceBias = {
  source_id: number;
  name: string;
  bias_score: number | null;
};

export type NewsSourceRef = {
  source_id: number;
  name: string;
};

async function apiGet<T>(path: string): Promise<T> {
  const result = await fetchJsonSafe<T>(`${apiBase()}${path}`, { next: { revalidate: 60 } });
  if (!result.ok) {
    throw new Error(`API ${path} failed: ${result.status ?? "network"}`);
  }
  return result.data;
}

export async function tryApiGet<T>(path: string, timeoutMs = API_LISTING_TIMEOUT_MS): Promise<T | null> {
  const result = await fetchJsonSafe<T>(`${apiBase()}${path}`, {
    next: { revalidate: 60 },
    timeoutMs,
  });
  return result.ok ? result.data : null;
}

export function fetchArticles(limit = 12, sourceId?: number) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (sourceId !== undefined) params.set("source_id", String(sourceId));
  return apiGet<{ items: Article[]; total: number }>(`/articles?${params.toString()}`);
}

export function fetchClusters(limit = 12) {
  return apiGet<{ items: Cluster[]; total: number }>(`/clusters?limit=${limit}`);
}

export function fetchRumors(limit = 12) {
  return apiGet<{ items: Article[]; total: number }>(`/rumors?limit=${limit}`);
}

export function fetchBiasOverview() {
  return apiGet<{ sources: SourceBias[] }>("/bias");
}

export async function tryFetchClusterBySlug(slug: string): Promise<ClusterDetail | null> {
  return tryApiGet<ClusterDetail>(
    `/clusters/${encodeURIComponent(slug)}`,
    API_FETCH_TIMEOUT_MS,
  );
}

export async function fetchArticlesFeed(
  limit = 12,
  sourceId?: number,
): Promise<{ items: Article[]; total: number; fromApi: boolean }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (sourceId !== undefined) params.set("source_id", String(sourceId));
  const data = await tryApiGet<{ items: Article[]; total: number }>(`/articles?${params.toString()}`);
  if (!data) return { items: [], total: 0, fromApi: false };
  return { items: data.items ?? [], total: data.total ?? 0, fromApi: true };
}

export async function fetchCustomSourcesFeed(): Promise<{ items: NewsSourceRef[]; fromApi: boolean }> {
  const data = await tryApiGet<{ items: NewsSourceRef[] }>("/sources?custom_only=true");
  if (!data) return { items: [], fromApi: false };
  return { items: data.items ?? [], fromApi: true };
}

export async function fetchBiasOverviewFeed(): Promise<{ sources: SourceBias[]; fromApi: boolean }> {
  const data = await tryApiGet<{ sources: SourceBias[] }>("/bias");
  if (!data) return { sources: [], fromApi: false };
  return { sources: data.sources ?? [], fromApi: true };
}
