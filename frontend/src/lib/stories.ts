import type { Cluster } from "@/lib/api";
import { DEMO_STORIES, getStoryBySlug, type Story } from "@/lib/demo-data";
import { fetchClusters } from "@/lib/api";

export function demoStoryFromCluster(cluster: Cluster): Story | undefined {
  return getStoryBySlug(cluster.slug);
}

export async function getTopStories(limit = 12): Promise<{ stories: Story[]; fromApi: boolean }> {
  try {
    const data = await fetchClusters(limit);
    if (data.items.length > 0) {
      const stories = data.items
        .map((c) => {
          const demo = getStoryBySlug(c.slug);
          if (demo) return demo;
          return {
            slug: c.slug,
            title: c.title,
            titleBn: c.title,
            summary: c.summary ?? "",
            summaryBn: c.summary ?? "",
            category: "News",
            categoryBn: "সংবাদ",
            isBlindspot: false,
            perspectiveSummaries: {},
            articles: [],
            updatedAt: c.created_at,
          } satisfies Story;
        })
        .filter(Boolean);
      return { stories, fromApi: true };
    }
  } catch {
    /* fall through to demo */
  }
  return { stories: DEMO_STORIES.slice(0, limit), fromApi: false };
}
