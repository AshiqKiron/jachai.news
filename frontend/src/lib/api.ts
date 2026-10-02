const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type Article = {
  id: number;
  source_id: number;
  cluster_id: number | null;
  title: string;
  url: string;
  excerpt: string | null;
  published_at: string | null;
  is_rumor: boolean;
};

export type Cluster = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  created_at: string;
};

export type SourceBias = {
  source_id: number;
  name: string;
  bias_score: number | null;
};

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error(`API ${path} failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchArticles(limit = 12) {
  return apiGet<{ items: Article[]; total: number }>(`/articles?limit=${limit}`);
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
