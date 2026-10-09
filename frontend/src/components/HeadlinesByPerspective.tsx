"use client";

import { useMemo } from "react";

import { PerspectiveSectionHeader } from "@/components/PerspectiveSectionHeader";
import { SourceOwnershipLine } from "@/components/SourceOwnershipLine";
import type { ArticleWithSource } from "@/lib/coverage";
import { recordArticleClick } from "@/lib/reading-history";
import { PERSPECTIVE_META, type Perspective } from "@/lib/perspectives";

type Props = {
  articles: ArticleWithSource[];
  /** When set, Pro article-click tracking can record outbound opens for My News Bias. */
  storySlug?: string;
  /** When set, only render these perspective buckets (in meta order). */
  perspectives?: Perspective[];
  className?: string;
  /** Skip outer title and per-bucket headers (headline list only). */
  listOnly?: boolean;
};

const PERSPECTIVE_ORDER = (Object.keys(PERSPECTIVE_META) as Perspective[]).sort(
  (a, b) => PERSPECTIVE_META[a].order - PERSPECTIVE_META[b].order,
);

export function groupArticlesByPerspective(
  articles: ArticleWithSource[],
): Partial<Record<Perspective, ArticleWithSource[]>> {
  const grouped: Partial<Record<Perspective, ArticleWithSource[]>> = {};
  for (const article of articles) {
    const bucket = grouped[article.perspective] ?? [];
    bucket.push(article);
    grouped[article.perspective] = bucket;
  }
  for (const perspective of Object.keys(grouped) as Perspective[]) {
    grouped[perspective]?.sort((a, b) =>
      a.sourceName.localeCompare(b.sourceName, "en"),
    );
  }
  return grouped;
}

function HeadlineList({ items, storySlug }: { items: ArticleWithSource[]; storySlug?: string }) {
  return (
    <ul className="divide-y divide-zinc-800/80">
      {items.map((article) => (
        <li key={article.url} className="px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-zinc-300">{article.sourceName}</span>
            <span className="text-[10px] uppercase tracking-wide text-zinc-600">
              {article.factuality}
            </span>
          </div>
          <SourceOwnershipLine ownership={article.mediaOwnership} className="mt-0.5" />
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block text-sm leading-snug text-zinc-100 hover:text-zinc-50"
            onClick={() => {
              if (!storySlug) return;
              recordArticleClick({
                storySlug,
                url: article.url,
                sourceId: article.sourceId,
                sourceName: article.sourceName,
                perspective: article.perspective,
                biasScore: article.biasScore ?? null,
              });
            }}
          >
            {article.headline}
          </a>
          {article.framingNote ? (
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{article.framingNote}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function HeadlinesByPerspective({
  articles,
  storySlug,
  perspectives,
  className,
  listOnly = false,
}: Props) {
  const sections = useMemo(() => {
    const grouped = groupArticlesByPerspective(articles);
    const order = perspectives ?? PERSPECTIVE_ORDER;
    return order
      .map((perspective) => ({
        perspective,
        items: grouped[perspective] ?? [],
      }))
      .filter((section) => section.items.length > 0);
  }, [articles, perspectives]);

  if (sections.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
        No linked headlines yet for this story.
      </p>
    );
  }

  if (listOnly) {
    const items = sections.flatMap((section) => section.items);
    return <HeadlineList items={items} storySlug={storySlug} />;
  }

  return (
    <section className={className ?? "space-y-6"}>
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-500">Headlines by side</p>
        <p className="mt-1 text-sm text-zinc-400">
          কোন শিরোনাম সরকারের পক্ষে, কোনগুলো বিপক্ষে — ঝুঁক অনুযায়ী আলাদা
        </p>
      </div>
      {sections.map(({ perspective, items }) => {
        const meta = PERSPECTIVE_META[perspective];
        return (
          <div
            key={perspective}
            className="rounded-xl border border-zinc-800/80 bg-ink-900/50"
            style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
          >
            <div className="border-b border-zinc-800/80 px-4 py-3">
              <PerspectiveSectionHeader
                perspective={perspective}
                count={items.length}
                countNoun="headline"
              />
            </div>
            <HeadlineList items={items} storySlug={storySlug} />
          </div>
        );
      })}
    </section>
  );
}
