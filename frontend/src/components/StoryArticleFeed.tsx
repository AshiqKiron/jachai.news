"use client";

import { useMemo, useState } from "react";

import { ArticleImage } from "@/components/ArticleImage";
import { SourceDigestPanel } from "@/components/SourceDigestPanel";
import { SourceOwnershipLine } from "@/components/SourceOwnershipLine";
import { resolveArticleImageUrl } from "@/lib/article-image-url";
import type { ArticleWithSource } from "@/lib/coverage";
import {
  COVERAGE_SPECTRUM_TAB_ORDER,
  PERSPECTIVE_META,
  type Perspective,
} from "@/lib/perspectives";
import { buildCoverageDigest, type CoverageDigestFilter } from "@/lib/source-digest";

type FilterId = "all" | Perspective;

type HeaderMode = "hero" | "section";

type Props = {
  articles: ArticleWithSource[];
  /** Story detail uses a quiet section label (counts live in coverage block + tabs). */
  headerMode?: HeaderMode;
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

function ArticleFeedList({ items }: { items: ArticleWithSource[] }) {
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
        const meta = PERSPECTIVE_META[article.perspective];
        return (
          <li key={`${article.sourceId}-${article.url}`}>
            <div className="flex gap-3 px-3 py-3 transition hover:bg-zinc-800/35 sm:px-4 sm:py-3.5">
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0"
              >
                <ArticleImage
                  src={resolveArticleImageUrl(article.imageUrl)}
                  alt=""
                  className="h-16 w-24 rounded-lg object-cover"
                />
              </a>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-zinc-100">{article.sourceName}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium leading-none"
                    style={{ backgroundColor: `${meta.color}28`, color: meta.color }}
                  >
                    {meta.spectrumTabEn}
                  </span>
                </div>
                <SourceOwnershipLine ownership={article.mediaOwnership} className="mt-0.5" />
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 block text-sm leading-snug text-zinc-200 line-clamp-3 hover:text-zinc-50"
                >
                  {article.headline}
                </a>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function StoryArticleFeed({ articles, headerMode = "hero" }: Props) {
  const [active, setActive] = useState<FilterId>("all");
  const counts = useMemo(() => countByPerspective(articles), [articles]);

  const spectrumTabs = COVERAGE_SPECTRUM_TAB_ORDER.filter((p) => counts[p] > 0);

  const filtered = useMemo(() => {
    const list =
      active === "all" ? articles : articles.filter((a) => a.perspective === active);
    return [...list].sort((a, b) => a.sourceName.localeCompare(b.sourceName, "en"));
  }, [active, articles]);

  const digestSnippets = useMemo(
    () => buildCoverageDigest(articles, active as CoverageDigestFilter),
    [active, articles],
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
        aria-label="Filter coverage by political spectrum"
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
        {spectrumTabs.map((perspective) => {
          const meta = PERSPECTIVE_META[perspective];
          return (
            <SpectrumTab
              key={perspective}
              active={active === perspective}
              labelEn={meta.spectrumTabEn}
              labelBn={meta.shortLabelBn}
              count={counts[perspective]}
              accent={meta.color}
              onClick={() => setActive(perspective)}
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
        <ArticleFeedList items={filtered} />
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
