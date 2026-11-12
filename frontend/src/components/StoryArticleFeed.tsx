"use client";

import { useMemo, useState } from "react";

import { ArticleImage } from "@/components/ArticleImage";
import { SourceDigestPanel } from "@/components/SourceDigestPanel";
import { SourceOwnershipLine } from "@/components/SourceOwnershipLine";
import { resolveArticleImageUrl } from "@/lib/article-image-url";
import type { ArticleWithSource } from "@/lib/coverage";
import {
  PERSPECTIVE_META,
  spectrumCopy,
  spectrumOrder,
  type CoverageSpectrumMode,
  type Perspective,
} from "@/lib/perspectives";
import {
  REPORTING_TONE_META,
  REPORTING_TONE_ORDER,
  reportingToneForArticle,
  type ReportingTone,
} from "@/lib/reporting-spectrum";
import { buildCoverageDigest, type CoverageDigestFilter } from "@/lib/source-digest";
import { removalLineEn } from "@/lib/taken-down";

type FilterId = "all" | Perspective | ReportingTone;

type HeaderMode = "hero" | "section";

type Props = {
  articles: ArticleWithSource[];
  /** Story detail uses a quiet section label (counts live in coverage block + tabs). */
  headerMode?: HeaderMode;
  /** Politics: government axis. Other stories: clickbait, mixed, factual, rumor. */
  spectrumMode?: CoverageSpectrumMode;
};

function countByPerspective(articles: ArticleWithSource[]): Record<Perspective, number> {
  const counts = Object.keys(PERSPECTIVE_META).reduce(
    (acc, key) => {
      acc[key as Perspective] = 0;
      return acc;
    },
    {} as Record<Perspective, number>,
  );
  for (const article of articles) {
    counts[article.perspective] += 1;
  }
  return counts;
}

function ArticleFeedList({
  items,
  spectrumMode,
}: {
  items: ArticleWithSource[];
  spectrumMode: CoverageSpectrumMode;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
        No sources in this category for this story yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-800/90 rounded-xl border border-zinc-800/90 bg-ink-900/30">
      {items.map((article) => {
        const reporting = spectrumMode === "reporting";
        const tone = reporting ? reportingToneForArticle(article) : null;
        const copy = tone
          ? REPORTING_TONE_META[tone]
          : spectrumCopy(article.perspective, "government");
        const color = tone ? REPORTING_TONE_META[tone].color : PERSPECTIVE_META[article.perspective].color;
        const removedAt = article.removedAt;
        return (
          <li key={`${article.sourceId}-${article.url}`}>
            <div className="flex gap-3 px-3 py-3 transition hover:bg-zinc-800/35 sm:px-4 sm:py-3.5">
              {removedAt ? (
                <div className="shrink-0 opacity-80">
                  <ArticleImage
                    src={resolveArticleImageUrl(article.imageUrl)}
                    alt=""
                    className="h-16 w-24 rounded-lg object-cover"
                  />
                </div>
              ) : (
                <a href={article.url} target="_blank" rel="noreferrer" className="shrink-0">
                  <ArticleImage
                    src={resolveArticleImageUrl(article.imageUrl)}
                    alt=""
                    className="h-16 w-24 rounded-lg object-cover"
                  />
                </a>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-zinc-100">{article.sourceName}</span>
                  {removedAt ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium leading-none text-amber-800 dark:text-amber-100">
                      Removed
                    </span>
                  ) : (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium leading-none"
                      style={{ backgroundColor: `${color}28`, color }}
                    >
                      {copy.shortLabelEn}
                    </span>
                  )}
                </div>
                <SourceOwnershipLine ownership={article.mediaOwnership} className="mt-0.5" />
                {removedAt ? (
                  <>
                    <p className="mt-1.5 text-sm leading-snug text-zinc-200 line-clamp-3">{article.headline}</p>
                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-100">{removalLineEn(removedAt)}</p>
                  </>
                ) : (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 block text-sm leading-snug text-zinc-200 line-clamp-3 hover:text-zinc-50"
                  >
                    {article.headline}
                  </a>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function StoryArticleFeed({
  articles,
  headerMode = "hero",
  spectrumMode = "reporting",
}: Props) {
  const [active, setActive] = useState<FilterId>("all");
  const counts = useMemo(() => countByPerspective(articles), [articles]);
  const toneCounts = useMemo(() => {
    const next = { clickbait: 0, mixed: 0, factual: 0, rumor: 0 } as Record<ReportingTone, number>;
    if (spectrumMode !== "reporting") return next;
    for (const article of articles) {
      next[reportingToneForArticle(article)] += 1;
    }
    return next;
  }, [articles, spectrumMode]);

  const spectrumTabs =
    spectrumMode === "reporting"
      ? REPORTING_TONE_ORDER.filter((tone) => toneCounts[tone] > 0)
      : spectrumOrder("government").filter((perspective) => counts[perspective] > 0);

  const filtered = useMemo(() => {
    const list =
      active === "all"
        ? articles
        : spectrumMode === "reporting"
          ? articles.filter((article) => reportingToneForArticle(article) === active)
          : articles.filter((article) => article.perspective === active);
    return [...list].sort((a, b) => a.sourceName.localeCompare(b.sourceName, "en"));
  }, [active, articles, spectrumMode]);

  const digestSnippets = useMemo(
    () =>
      buildCoverageDigest(
        spectrumMode === "reporting" ? filtered : articles,
        spectrumMode === "reporting" ? "all" : (active as CoverageDigestFilter),
      ),
    [active, articles, filtered, spectrumMode],
  );

  const total = articles.length;

  return (
    <section className="min-w-0" aria-labelledby="story-article-feed-heading">
      {headerMode === "hero" ? (
        <h2
          id="story-article-feed-heading"
          className="font-display text-2xl font-semibold tabular-nums text-zinc-50 sm:text-3xl"
        >
          {total}{" "}
          <span className="text-xl font-normal text-zinc-400 sm:text-2xl">
            {total === 1 ? "Article" : "Articles"}
          </span>
          <span className="mt-1 block font-bengali text-base font-normal text-zinc-500">
            {total === 1 ? "১টি উৎস" : `${total}টি উৎস`}
          </span>
        </h2>
      ) : (
        <h2
          id="story-article-feed-heading"
          className="text-xs font-medium uppercase tracking-widest text-zinc-500"
        >
          <span className="font-bengali normal-case tracking-normal">উৎস অনুযায়ী</span> · Articles by
          source
        </h2>
      )}

      <div
        role="tablist"
        aria-label={
          spectrumMode === "government"
            ? "Filter coverage by for or against government"
            : "Filter coverage by clickbait, factual, rumor, and mixed"
        }
        className={`flex gap-1 overflow-x-auto border-b border-zinc-800/90 [-webkit-overflow-scrolling:touch] ${
          headerMode === "hero" ? "mt-5" : "mt-4"
        }`}
      >
        <SpectrumTab
          active={active === "all"}
          labelEn="All"
          labelBn="সব"
          count={total}
          onClick={() => setActive("all")}
        />
        {spectrumTabs.map((bucket) => {
          const copy =
            spectrumMode === "reporting"
              ? REPORTING_TONE_META[bucket as ReportingTone]
              : spectrumCopy(bucket as Perspective, "government");
          const accent =
            spectrumMode === "reporting"
              ? REPORTING_TONE_META[bucket as ReportingTone].color
              : PERSPECTIVE_META[bucket as Perspective].color;
          const count =
            spectrumMode === "reporting"
              ? toneCounts[bucket as ReportingTone]
              : counts[bucket as Perspective];
          return (
            <SpectrumTab
              key={bucket}
              active={active === bucket}
              labelEn={copy.shortLabelEn}
              labelBn={copy.shortLabelBn}
              count={count}
              accent={accent}
              onClick={() => setActive(bucket)}
            />
          );
        })}
      </div>

      <div role="tabpanel" className="mt-4">
        <SourceDigestPanel
          snippets={digestSnippets}
          labelBn="উৎসের অংশ"
          className={`mb-4 ${headerMode === "section" ? "border-zinc-800/60 bg-ink-900/25 px-3 py-3" : ""}`}
        />
        <ArticleFeedList items={filtered} spectrumMode={spectrumMode} />
      </div>
    </section>
  );
}

function SpectrumTab({
  active,
  labelEn,
  labelBn,
  count,
  accent,
  onClick,
}: {
  active: boolean;
  labelEn: string;
  labelBn: string;
  count: number;
  accent?: string;
  onClick: () => void;
}) {
  const borderColor = active ? (accent ?? "#a1a1aa") : "transparent";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-w-[4.75rem] shrink-0 flex-col items-center px-3 py-2.5 transition sm:min-w-[5.5rem] sm:px-4 ${
        active ? "text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
      }`}
      style={{ borderBottom: `2px solid ${borderColor}` }}
    >
      <span className="text-xs font-medium leading-tight sm:text-sm">{labelEn}</span>
      <span className="font-bengali text-[10px] leading-tight text-zinc-600">{labelBn}</span>
      <span
        className={`mt-1 text-lg font-semibold tabular-nums leading-none sm:text-xl ${
          active ? "text-zinc-50" : "text-zinc-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
