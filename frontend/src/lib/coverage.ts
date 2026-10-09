import { getSourceById, type Story, type StoryArticle } from "@/lib/demo-data";
import type { Perspective } from "@/lib/perspectives";
import { PERSPECTIVE_META } from "@/lib/perspectives";
import {
  resolveArticlePerspective,
  type SourcePerspectiveLookup,
} from "@/lib/source-perspective";
import { lookupMediaOwnership, type MediaOwnership } from "@/lib/source-media-ownership";

export type StoryArticleMeta = {
  sourceName?: string;
  biasScore?: number | null;
};

export type ArticleWithSource = StoryArticle & {
  sourceName: string;
  perspective: Perspective;
  factuality: string;
  mediaOwnership: MediaOwnership | null;
};

export type EnrichArticlesOptions = {
  lookup?: SourcePerspectiveLookup;
  articleMeta?: Record<string, StoryArticleMeta>;
};

function articlePerspective(
  article: StoryArticle,
  lookup?: SourcePerspectiveLookup,
  meta?: StoryArticleMeta,
): Perspective {
  return resolveArticlePerspective(
    article.sourceId,
    {
      perspective: article.perspective,
      sourceName: meta?.sourceName,
      biasScore: meta?.biasScore,
    },
    lookup,
  );
}

export function enrichArticles(story: Story, options?: EnrichArticlesOptions): ArticleWithSource[] {
  return story.articles.map((article) => {
    const source = getSourceById(article.sourceId);
    const meta = options?.articleMeta?.[article.sourceId];
    const perspective = articlePerspective(article, options?.lookup, meta);
    const sourceName = meta?.sourceName ?? source?.name ?? article.sourceId;
    return {
      ...article,
      sourceName,
      perspective,
      factuality: source?.factuality ?? "mixed",
      mediaOwnership: lookupMediaOwnership(sourceName),
    };
  });
}

export function coverageCounts(story: Story, options?: EnrichArticlesOptions): Record<Perspective, number> {
  const counts = Object.keys(PERSPECTIVE_META).reduce(
    (acc, key) => {
      acc[key as Perspective] = 0;
      return acc;
    },
    {} as Record<Perspective, number>,
  );

  for (const article of story.articles) {
    const meta =
      options?.articleMeta?.[article.sourceId] ??
      (article.sourceName || article.biasScore !== undefined
        ? { sourceName: article.sourceName, biasScore: article.biasScore }
        : undefined);
    counts[articlePerspective(article, options?.lookup, meta)] += 1;
  }
  return counts;
}

export function dominantBlindspot(story: Story): Perspective | null {
  if (!story.isBlindspot || !story.blindspotPerspective) return null;
  return story.blindspotPerspective;
}

export type CoverageStats = {
  total: number;
  counts: Record<Perspective, number>;
  dominantPerspective: Perspective;
  dominantPercent: number;
  lastUpdatedIso: string;
};

/** Earliest article publish time, or cluster `updatedAt` when no articles. */
export function storyPublishedIso(story: Story): string {
  let earliestMs: number | null = null;

  for (const article of story.articles) {
    const articleMs = Date.parse(article.publishedAt);
    if (Number.isNaN(articleMs)) continue;
    if (earliestMs === null || articleMs < earliestMs) {
      earliestMs = articleMs;
    }
  }

  if (earliestMs !== null) {
    return new Date(earliestMs).toISOString();
  }

  const fallbackMs = Date.parse(story.updatedAt);
  return Number.isNaN(fallbackMs) ? new Date().toISOString() : story.updatedAt;
}

function storyLastUpdatedIso(story: Story): string {
  let latestMs = Date.parse(story.updatedAt);
  if (Number.isNaN(latestMs)) latestMs = 0;

  for (const article of story.articles) {
    const articleMs = Date.parse(article.publishedAt);
    if (!Number.isNaN(articleMs) && articleMs > latestMs) {
      latestMs = articleMs;
    }
  }

  return new Date(latestMs).toISOString();
}

export function coverageStats(story: Story, options?: EnrichArticlesOptions): CoverageStats | null {
  if (story.articles.length === 0) return null;

  const counts = coverageCounts(story, options);
  const total = story.articles.length;

  let dominantPerspective: Perspective = "neutral";
  let bestCount = 0;
  for (const perspective of Object.keys(PERSPECTIVE_META) as Perspective[]) {
    const n = counts[perspective];
    if (n > bestCount) {
      bestCount = n;
      dominantPerspective = perspective;
    }
  }

  const dominantPercent = total > 0 ? Math.round((bestCount / total) * 100) : 0;

  return {
    total,
    counts,
    dominantPerspective,
    dominantPercent,
    lastUpdatedIso: storyLastUpdatedIso(story),
  };
}
