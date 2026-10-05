import { unstable_cache } from "next/cache";

import {
  fetchArticlesFeed,
  fetchBiasOverviewFeed,
  fetchClusters,
  fetchRumors,
  tryApiGet,
  tryFetchClusterBySlug,
  type Article,
  type Cluster,
  type ClusterDetail,
  type SourceBias,
} from "@/lib/api";
import { resolveArticleImageUrl } from "@/lib/article-image-url";
import { applyBlindspotDetection } from "@/lib/blindspot";
import { BD_SOURCES, DEMO_RUMOR_ARTICLES, DEMO_STORIES, getStoryBySlug, type Story } from "@/lib/demo-data";

function storyShellFromCluster(cluster: Cluster, articles: Story["articles"]): Story {
  const demo = getStoryBySlug(cluster.slug);
  if (demo) return applyBlindspotDetection(demo);
  return applyBlindspotDetection({
    slug: cluster.slug,
    title: cluster.title,
    titleBn: cluster.title,
    summary: cluster.summary ?? "",
    summaryBn: cluster.summary ?? "",
    category: "News",
    categoryBn: "সংবাদ",
    isBlindspot: false,
    perspectiveSummaries: {},
    articles,
    updatedAt: cluster.created_at,
  });
}

function mapClusterArticles(cluster: Cluster | ClusterDetail): Story["articles"] {
  const rows = cluster.articles ?? [];
  if (rows.length === 0) return [];
  return rows.map((article) => ({
    sourceId: String(article.source_id),
    headline: article.title,
    url: article.url,
    excerpt: article.excerpt ?? "",
    imageUrl: resolveArticleImageUrl(article.image_url),
    publishedAt: article.published_at ?? cluster.created_at,
    sourceName: article.source_name ?? undefined,
    biasScore: article.bias_score ?? undefined,
  }));
}

function mapApiArticles(cluster: ClusterDetail): Story["articles"] {
  return mapClusterArticles(cluster);
}

export function storyFromCluster(cluster: Cluster): Story {
  return storyShellFromCluster(cluster, mapClusterArticles(cluster));
}

export function storyFromClusterDetail(cluster: ClusterDetail): Story {
  const demo = getStoryBySlug(cluster.slug);
  if (demo) return demo;
  return storyShellFromCluster(cluster, mapApiArticles(cluster));
}

export function demoStoryFromCluster(cluster: Cluster): Story | undefined {
  return getStoryBySlug(cluster.slug);
}

async function loadTopStoriesUncached(limit: number): Promise<{ stories: Story[]; fromApi: boolean }> {
  const data = await tryApiGet<{ items: Cluster[]; total: number }>(`/clusters?limit=${limit}`);
  if (data && data.items.length > 0) {
    return { stories: data.items.map((c) => storyFromCluster(c)), fromApi: true };
  }
  return { stories: DEMO_STORIES.slice(0, limit), fromApi: false };
}

const getTopStoriesCached = unstable_cache(
  async (limit: number) => loadTopStoriesUncached(limit),
  ["top-stories"],
  { revalidate: 60 },
);

export async function getTopStories(limit = 12): Promise<{ stories: Story[]; fromApi: boolean }> {
  return getTopStoriesCached(limit);
}

async function resolveStoryBySlugUncached(
  slug: string,
): Promise<{ story: Story; fromApi: boolean } | null> {
  const demo = getStoryBySlug(slug);
  if (demo) return { story: demo, fromApi: false };

  const cluster = await tryFetchClusterBySlug(slug);
  if (cluster) return { story: storyFromClusterDetail(cluster), fromApi: true };

  return null;
}

const resolveStoryBySlugCached = unstable_cache(
  async (slug: string) => resolveStoryBySlugUncached(slug),
  ["resolve-story-by-slug"],
  { revalidate: 60 },
);

export async function resolveStoryBySlug(
  slug: string,
): Promise<{ story: Story; fromApi: boolean } | null> {
  return resolveStoryBySlugCached(slug);
}

export async function getRumorsFeed(limit = 30): Promise<{ items: Article[]; fromApi: boolean }> {
  try {
    const data = await fetchRumors(limit);
    if (data.items.length > 0) return { items: data.items, fromApi: true };
  } catch {
    /* demo fallback */
  }
  return { items: DEMO_RUMOR_ARTICLES.slice(0, limit), fromApi: false };
}

export async function getBrowseClusters(limit = 24): Promise<{ stories: Story[]; fromApi: boolean }> {
  try {
    const data = await fetchClusters(limit);
    if (data.items.length > 0) {
      return { stories: data.items.map((c) => storyFromCluster(c)), fromApi: true };
    }
  } catch {
    /* demo */
  }
  return { stories: DEMO_STORIES, fromApi: false };
}

export type BiasSourceView = {
  id: string;
  name: string;
  nameBn: string;
  biasScore: number | null;
};

export async function getBiasSources(): Promise<{ sources: BiasSourceView[]; fromApi: boolean }> {
  const { sources, fromApi } = await fetchBiasOverviewFeed();
  if (fromApi && sources.length > 0) {
    return {
      fromApi: true,
      sources: sources.map((s: SourceBias) => ({
        id: String(s.source_id),
        name: s.name,
        nameBn: s.name,
        biasScore: s.bias_score,
      })),
    };
  }
  return {
    fromApi: false,
    sources: BD_SOURCES.map((s) => ({
      id: s.id,
      name: s.name,
      nameBn: s.nameBn,
      biasScore: s.biasScore,
    })),
  };
}

export async function getLatestArticlesFeed(
  limit = 24,
): Promise<{ items: Article[]; total: number; fromApi: boolean }> {
  const feed = await fetchArticlesFeed(limit);
  if (feed.fromApi) return feed;
  return { items: [], total: 0, fromApi: false };
}

export async function getBlindspotStories(
  limit = 12,
): Promise<{ stories: Story[]; fromApi: boolean }> {
  const data = await tryApiGet<{ items: Cluster[]; total: number }>(`/clusters?limit=40`);
  if (data && data.items.length > 0) {
    const hydrated = await Promise.all(
      data.items.slice(0, 24).map(async (cluster) => {
        const detail = await tryFetchClusterBySlug(cluster.slug);
        if (detail) return storyFromClusterDetail(detail);
        return storyFromCluster(cluster);
      }),
    );
    const blindspots = hydrated
      .map((story) => applyBlindspotDetection(story))
      .filter((story) => story.isBlindspot)
      .slice(0, limit);
    if (blindspots.length > 0) {
      return { stories: blindspots, fromApi: true };
    }
  }

  const demo = DEMO_STORIES.map((story) => applyBlindspotDetection(story)).filter(
    (story) => story.isBlindspot,
  );
  return { stories: demo.slice(0, limit), fromApi: false };
}
