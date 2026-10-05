import { getSourceById, type Story, type StoryArticle } from "@/lib/demo-data";
import type { Perspective } from "@/lib/perspectives";
import { PERSPECTIVE_META } from "@/lib/perspectives";
import {
  resolveArticlePerspective,
  type SourcePerspectiveLookup,
} from "@/lib/source-perspective";

export type StoryArticleMeta = {
  sourceName?: string;
  biasScore?: number | null;
};

export type ArticleWithSource = StoryArticle & {
  sourceName: string;
  perspective: Perspective;
  factuality: string;
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
    return {
      ...article,
      sourceName: meta?.sourceName ?? source?.name ?? article.sourceId,
      perspective,
      factuality: source?.factuality ?? "mixed",
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
