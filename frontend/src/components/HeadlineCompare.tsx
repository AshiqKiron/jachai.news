"use client";

import { useMemo, useState } from "react";

import { ArticleImage } from "@/components/ArticleImage";
import { resolveArticleImageUrl } from "@/lib/article-image-url";
import type { ArticleWithSource } from "@/lib/coverage";
import { PERSPECTIVE_META } from "@/lib/perspectives";

type Props = {
  articles: ArticleWithSource[];
};

export function HeadlineCompare({ articles }: Props) {
  const [index, setIndex] = useState(0);
  const sorted = useMemo(
    () => [...articles].sort((a, b) => a.sourceName.localeCompare(b.sourceName, "en")),
    [articles],
  );

  if (sorted.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
        No linked coverage yet for this cluster.
      </p>
    );
  }

  const current = sorted[index];
  const meta = PERSPECTIVE_META[current.perspective];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-ink-900/80 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Headline compare</p>
        <p className="text-xs tabular-nums text-zinc-600">
          {index + 1} / {sorted.length}
        </p>
      </div>
      <div className="mt-4 min-h-[140px]">
        <ArticleImage
          src={resolveArticleImageUrl(current.imageUrl)}
          alt=""
          className="mb-4 aspect-[16/9] w-full max-h-48 rounded-lg object-cover"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-200">{current.sourceName}</span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
          >
            {meta.labelBn}
          </span>
        </div>
        <h3 className="mt-3 break-words font-display text-xl leading-snug text-zinc-50 sm:text-2xl">
          {current.headline}
        </h3>
        {current.framingNote ? (
          <p className="mt-2 text-sm text-zinc-500">{current.framingNote}</p>
        ) : null}
        <p className="mt-3 text-sm leading-relaxed text-zinc-400 line-clamp-3">{current.excerpt}</p>
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => (i === 0 ? sorted.length - 1 : i - 1))}
            className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 sm:flex-none"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % sorted.length)}
            className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 sm:flex-none"
          >
            Next →
          </button>
        </div>
        <a
          href={current.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-accent px-4 py-2 text-center text-sm font-medium text-white hover:bg-accent-dark sm:ml-auto dark:text-black dark:hover:text-black"
        >
          Read at source
        </a>
      </div>
    </div>
  );
}
