import { unstable_cache } from "next/cache";

import {
  fetchArticlesFeed,
  fetchBiasOverviewFeed,
  fetchClusters,
  fetchCustomSourcesFeed,
  fetchRumors,
  tryApiGet,
  tryFetchClusterBySlug,
  type Article,
  type Cluster,
  type ClusterDetail,
  type NewsSourceRef,
  type SourceBias,
} from "@/lib/api";
import { BD_SOURCES, DEMO_RUMOR_ARTICLES, DEMO_STORIES, getStoryBySlug, type Story } from "@/lib/demo-data";

function storyShellFromCluster(cluster: Cluster, articles: Story["articles"]): Story {
  const demo = getStoryBySlug(cluster.slug);
  if (demo) return demo;
  return {
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
  };
}

function mapApiArticles(cluster: ClusterDetail): Story["articles"] {
  return cluster.articles.map((article) => ({
    sourceId: String(article.source_id),
    headline: article.title,
    url: article.url,
    excerpt: article.excerpt ?? "",
    publishedAt: article.published_at ?? cluster.created_at,
  }));
}

export function storyFromCluster(cluster: Cluster): Story {
  return storyShellFromCluster(cluster, []);
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

export async function resolveStoryBySlug(
  slug: string,
): Promise<{ story: Story; fromApi: boolean } | null> {
  const demo = getStoryBySlug(slug);
  if (demo) return { story: demo, fromApi: false };

  const cluster = await tryFetchClusterBySlug(slug);
  if (cluster) return { story: storyFromClusterDetail(cluster), fromApi: true };

  return null;
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

export type CustomSourceFeedBlock = {
  source: NewsSourceRef;
  articles: Article[];
};

const CUSTOM_SOURCE_ARTICLE_LIMIT = 6;

async function loadCustomSourceFeedsUncached(
  perSourceLimit = CUSTOM_SOURCE_ARTICLE_LIMIT,
): Promise<{ blocks: CustomSourceFeedBlock[]; fromApi: boolean }> {
  const { items: sources, fromApi } = await fetchCustomSourcesFeed();
  if (!fromApi || sources.length === 0) {
    return { blocks: [], fromApi: false };
  }

  const blocks: CustomSourceFeedBlock[] = [];
  for (const source of sources) {
    const feed = await fetchArticlesFeed(perSourceLimit, source.source_id);
    if (feed.items.length > 0) {
      blocks.push({ source, articles: feed.items });
    }
  }

  return { blocks, fromApi: blocks.length > 0 };
}

export const CUSTOM_SOURCE_FEEDS_CACHE_TAG = "home-custom-source-feeds";

const getCustomSourceFeedsCached = unstable_cache(
  async (perSourceLimit: number) => loadCustomSourceFeedsUncached(perSourceLimit),
  ["home-custom-source-feeds"],
  { revalidate: 60, tags: [CUSTOM_SOURCE_FEEDS_CACHE_TAG] },
);

export async function getCustomSourceFeeds(
  perSourceLimit = CUSTOM_SOURCE_ARTICLE_LIMIT,
): Promise<{ blocks: CustomSourceFeedBlock[]; fromApi: boolean }> {
  return getCustomSourceFeedsCached(perSourceLimit);
}
