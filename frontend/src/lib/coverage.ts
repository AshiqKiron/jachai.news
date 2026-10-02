import { getSourceById, type Story, type StoryArticle } from "@/lib/demo-data";
import type { Perspective } from "@/lib/perspectives";
import { PERSPECTIVE_META } from "@/lib/perspectives";

export type ArticleWithSource = StoryArticle & {
  sourceName: string;
  perspective: Perspective;
  factuality: string;
};

export function enrichArticles(story: Story): ArticleWithSource[] {
  return story.articles.map((article) => {
    const source = getSourceById(article.sourceId);
    return {
      ...article,
      sourceName: source?.name ?? article.sourceId,
      perspective: source?.perspective ?? "neutral",
      factuality: source?.factuality ?? "mixed",
    };
  });
}

export function coverageCounts(story: Story): Record<Perspective, number> {
  const counts = Object.keys(PERSPECTIVE_META).reduce(
    (acc, key) => {
      acc[key as Perspective] = 0;
      return acc;
    },
    {} as Record<Perspective, number>,
  );

  for (const article of story.articles) {
    const source = getSourceById(article.sourceId);
    if (source) counts[source.perspective] += 1;
  }
  return counts;
}

export function dominantBlindspot(story: Story): Perspective | null {
  if (!story.isBlindspot || !story.blindspotPerspective) return null;
  return story.blindspotPerspective;
}
