"use client";

import { useMemo, useState } from "react";

import { ArticleImage } from "@/components/ArticleImage";
import { resolveArticleImageUrl } from "@/lib/article-image-url";
import type { ArticleWithSource } from "@/lib/coverage";
import { PERSPECTIVE_META, perspectiveSegmentStyle, type Perspective } from "@/lib/perspectives";

type Props = {
  articles: ArticleWithSource[];
};

export function SourceFilterList({ articles }: Props) {
  const perspectives = useMemo(() => {
    const set = new Set(articles.map((a) => a.perspective));
    return (Object.keys(PERSPECTIVE_META) as Perspective[])
      .filter((p) => set.has(p))
      .sort((a, b) => PERSPECTIVE_META[a].order - PERSPECTIVE_META[b].order);
  }, [articles]);

  const [active, setActive] = useState<Perspective | "all">("all");

  const filtered =
    active === "all" ? articles : articles.filter((article) => article.perspective === active);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip label="All" active={active === "all"} onClick={() => setActive("all")} />
        {perspectives.map((perspective) => (
          <FilterChip
            key={perspective}
            label={PERSPECTIVE_META[perspective].labelBn}
            active={active === perspective}
            onClick={() => setActive(perspective)}
            color={PERSPECTIVE_META[perspective].color}
          />
        ))}
      </div>
      <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {filtered.map((article) => (
          <li key={`${article.sourceId}-${article.headline}`} className="px-4 py-3">
            <div className="flex gap-3">
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 overflow-hidden rounded-lg"
              >
                <ArticleImage
                  src={resolveArticleImageUrl(article.imageUrl)}
                  alt=""
                  className="h-16 w-24 object-cover"
                />
              </a>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">{article.sourceName}</span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-600">
                    {article.factuality}
                  </span>
                </div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-sm text-zinc-100 hover:text-zinc-50 dark:hover:text-white"
                >
                  {article.headline}
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  const fill = color ?? "#2563eb";
  const activeStyle = active ? perspectiveSegmentStyle(fill) : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-normal transition ${
        active ? "" : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
      }`}
      style={
        active
          ? {
              backgroundColor: activeStyle?.backgroundColor,
              color: activeStyle?.color,
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}
