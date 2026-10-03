"use client";

import { useMemo, useState } from "react";

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
    <div className="rounded-2xl border border-zinc-800 bg-ink-900/80 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Headline compare</p>
        <p className="text-xs tabular-nums text-zinc-600">
          {index + 1} / {sorted.length}
        </p>
      </div>
      <div className="mt-4 min-h-[140px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-200">{current.sourceName}</span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
          >
            {meta.labelBn}
          </span>
        </div>
        <h3 className="mt-3 font-display text-2xl leading-snug text-zinc-50">{current.headline}</h3>
        {current.framingNote ? (
          <p className="mt-2 text-sm text-zinc-500">{current.framingNote}</p>
        ) : null}
        <p className="mt-3 text-sm leading-relaxed text-zinc-400 line-clamp-3">{current.excerpt}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => (i === 0 ? sorted.length - 1 : i - 1))}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % sorted.length)}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Next →
        </button>
        <a
          href={current.url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
        >
          Read at source
        </a>
      </div>
    </div>
  );
}
