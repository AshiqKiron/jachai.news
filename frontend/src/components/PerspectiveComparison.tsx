import { useMemo } from "react";

import { HeadlinesByPerspective, groupArticlesByPerspective } from "@/components/HeadlinesByPerspective";
import { PerspectiveSectionHeader } from "@/components/PerspectiveSectionHeader";
import type { ArticleWithSource } from "@/lib/coverage";
import type { Story } from "@/lib/demo-data";
import { PERSPECTIVE_META, type Perspective } from "@/lib/perspectives";
import { buildPerspectiveDigests } from "@/lib/source-digest";

type Props = {
  story: Story;
  articles?: ArticleWithSource[];
};

export function PerspectiveComparison({ story, articles = [] }: Props) {
  const grouped = groupArticlesByPerspective(articles);
  const sourceSummaries = useMemo(() => buildPerspectiveDigests(articles), [articles]);
  const summaryEntries = (
    Object.entries(
      articles.length > 0 ? sourceSummaries : story.perspectiveSummaries,
    ) as [Perspective, string][]
  ).sort((a, b) => PERSPECTIVE_META[a[0]].order - PERSPECTIVE_META[b[0]].order);

  const perspectivesWithHeadlines = (Object.keys(grouped) as Perspective[]).filter(
    (p) => (grouped[p]?.length ?? 0) > 0,
  );
  const orderedPerspectives = [
    ...new Set([
      ...summaryEntries.map(([p]) => p),
      ...perspectivesWithHeadlines.sort(
        (a, b) => PERSPECTIVE_META[a].order - PERSPECTIVE_META[b].order,
      ),
    ]),
  ].sort((a, b) => PERSPECTIVE_META[a].order - PERSPECTIVE_META[b].order);

  if (orderedPerspectives.length === 0 && summaryEntries.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Not enough distinct coverage across perspectives for a full comparison yet.
      </p>
    );
  }

  const summaryByPerspective = Object.fromEntries(summaryEntries) as Partial<
    Record<Perspective, string>
  >;

  if (orderedPerspectives.length === 0) {
    return (
      <div className="space-y-3">
        {summaryEntries.map(([perspective, text]) => {
          const meta = PERSPECTIVE_META[perspective];
          return (
            <div
              key={perspective}
              className="rounded-xl border border-zinc-800/80 bg-ink-900/50 p-4"
              style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
            >
              <PerspectiveSectionHeader perspective={perspective} />
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{text}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orderedPerspectives.map((perspective) => {
        const meta = PERSPECTIVE_META[perspective];
        const text = summaryByPerspective[perspective];
        const headlineCount = grouped[perspective]?.length ?? 0;
        return (
          <div
            key={perspective}
            className="rounded-xl border border-zinc-800/80 bg-ink-900/50"
            style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
          >
            <div className="border-b border-zinc-800/80 px-4 py-3">
              <PerspectiveSectionHeader perspective={perspective} />
              {text ? (
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{text}</p>
              ) : headlineCount > 0 ? (
                <p className="mt-1 text-xs text-zinc-500">Coverage from this side of the spectrum.</p>
              ) : null}
            </div>
            {headlineCount > 0 ? (
              <HeadlinesByPerspective
                articles={articles}
                storySlug={story.slug}
                perspectives={[perspective]}
                listOnly
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
