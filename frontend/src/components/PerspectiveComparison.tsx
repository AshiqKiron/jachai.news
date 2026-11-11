import { useMemo } from "react";

import { HeadlinesByPerspective, groupArticlesByPerspective } from "@/components/HeadlinesByPerspective";
import { PerspectiveSectionHeader } from "@/components/PerspectiveSectionHeader";
import type { ArticleWithSource } from "@/lib/coverage";
import type { Story } from "@/lib/demo-data";
import { compareSpectrumOrder, PERSPECTIVE_META, type Perspective } from "@/lib/perspectives";
import {
  REPORTING_TONE_META,
  REPORTING_TONE_ORDER,
  reportingToneForArticle,
  type ReportingTone,
} from "@/lib/reporting-spectrum";
import { coverageSpectrumModeForStory } from "@/lib/story-topics";
import { buildCoverageDigest, buildPerspectiveDigests, formatDigestInline } from "@/lib/source-digest";

type Props = {
  story: Story;
  articles?: ArticleWithSource[];
};

function groupArticlesByTone(
  articles: ArticleWithSource[],
): Partial<Record<ReportingTone, ArticleWithSource[]>> {
  const grouped: Partial<Record<ReportingTone, ArticleWithSource[]>> = {};
  for (const article of articles) {
    const tone = reportingToneForArticle(article);
    const bucket = grouped[tone] ?? [];
    bucket.push(article);
    grouped[tone] = bucket;
  }
  return grouped;
}

function ReportingToneComparison({ story, articles = [] }: Props) {
  const grouped = useMemo(() => groupArticlesByTone(articles), [articles]);
  const tones = REPORTING_TONE_ORDER.filter((tone) => (grouped[tone]?.length ?? 0) > 0);

  if (tones.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Not enough coverage yet to sort this story into clickbait, mixed, factual, and rumor.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {tones.map((tone) => {
        const meta = REPORTING_TONE_META[tone];
        const items = grouped[tone] ?? [];
        const digest = formatDigestInline(buildCoverageDigest(items, "all"));
        return (
          <div
            key={tone}
            className="rounded-xl border border-zinc-800/80 bg-ink-900/50"
            style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
          >
            <div className="border-b border-zinc-800/80 px-4 py-3">
              <p className="font-bengali text-sm font-semibold leading-snug text-zinc-100">{meta.labelBn}</p>
              <p className="mt-0.5 text-xs leading-snug text-zinc-400">
                {meta.labelEn}
                <span className="text-zinc-500">
                  {" "}
                  · {items.length} headline{items.length === 1 ? "" : "s"}
                </span>
              </p>
              {digest ? <p className="mt-2 text-sm leading-relaxed text-zinc-300">{digest}</p> : null}
            </div>
            <HeadlinesByPerspective articles={items} storySlug={story.slug} listOnly />
          </div>
        );
      })}
    </div>
  );
}

function GovernmentPerspectiveComparison({ story, articles = [] }: Props) {
  const spectrumMode = "government" as const;
  const grouped = groupArticlesByPerspective(articles);
  const sourceSummaries = useMemo(() => buildPerspectiveDigests(articles), [articles]);
  const summaryEntries = (
    Object.entries(
      articles.length > 0 ? sourceSummaries : story.perspectiveSummaries,
    ) as [Perspective, string][]
  ).sort((a, b) => compareSpectrumOrder(a[0], b[0], spectrumMode));

  const perspectivesWithHeadlines = (Object.keys(grouped) as Perspective[]).filter(
    (p) => (grouped[p]?.length ?? 0) > 0,
  );
  const orderedPerspectives = [
    ...new Set([
      ...summaryEntries.map(([p]) => p),
      ...perspectivesWithHeadlines.sort((a, b) => compareSpectrumOrder(a, b, spectrumMode)),
    ]),
  ].sort((a, b) => compareSpectrumOrder(a, b, spectrumMode));

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
              <PerspectiveSectionHeader perspective={perspective} spectrumMode={spectrumMode} />
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
              <PerspectiveSectionHeader perspective={perspective} spectrumMode={spectrumMode} />
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

export function PerspectiveComparison({ story, articles = [] }: Props) {
  if (coverageSpectrumModeForStory(story) === "reporting") {
    return <ReportingToneComparison story={story} articles={articles} />;
  }
  return <GovernmentPerspectiveComparison story={story} articles={articles} />;
}
