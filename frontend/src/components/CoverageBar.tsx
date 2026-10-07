"use client";

import { useState } from "react";

import type { Story } from "@/lib/demo-data";
import { coverageCounts } from "@/lib/coverage";
import { PERSPECTIVE_META, perspectiveSegmentStyle, type Perspective } from "@/lib/perspectives";

type Props = {
  story: Story;
  compact?: boolean;
};

function coveragePercent(count: number, total: number): number {
  return (count / total) * 100;
}

function formatPercent(count: number, total: number): string {
  const pct = coveragePercent(count, total);
  if (pct > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

const HOVER_CONTEXT_BN = "এই সংবাদ";

function segmentTooltip(perspective: Perspective, count: number, total: number): string {
  const meta = PERSPECTIVE_META[perspective];
  return `${HOVER_CONTEXT_BN} · ${meta.labelBn} · ${formatPercent(count, total)} · ${count} source${count === 1 ? "" : "s"}`;
}

function segmentLabel(
  perspective: Perspective,
  count: number,
  total: number,
  widthPct: number,
): string {
  const meta = PERSPECTIVE_META[perspective];
  const pct = formatPercent(count, total);
  if (widthPct < 18) return pct;
  if (widthPct < 32) return `${meta.shortLabelBn} ${pct}`;
  return `${meta.labelBn} ${pct}`;
}

export function CoverageBar({ story, compact }: Props) {
  const [active, setActive] = useState<Perspective | null>(null);
  const counts = coverageCounts(story);
  const total = story.articles.length || 1;
  const segments = (Object.keys(PERSPECTIVE_META) as Perspective[])
    .filter((p) => counts[p] > 0)
    .sort((a, b) => PERSPECTIVE_META[a].order - PERSPECTIVE_META[b].order);

  if (segments.length === 0) {
    return null;
  }

  const activeMeta = active ? PERSPECTIVE_META[active] : null;
  const activeCount = active ? counts[active] : 0;

  return (
    <div className="relative">
      {active && activeMeta ? (
        <div
          className="pointer-events-none absolute bottom-full left-0 right-0 z-50 mb-2 flex justify-center"
          role="tooltip"
        >
          <div className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center shadow-xl shadow-black/15 dark:border-neutral-600 dark:bg-neutral-950 dark:shadow-black/50">
            <p className="font-bengali text-[11px] font-medium leading-snug text-zinc-700 dark:text-zinc-300">
              {HOVER_CONTEXT_BN}
            </p>
            <p className="mt-1 text-[11px] font-medium leading-snug text-zinc-900 dark:text-zinc-50">
              {activeMeta.labelBn}
            </p>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400">{activeMeta.labelEn}</p>
            <p className="mt-1 text-xs font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatPercent(activeCount, total)}
              <span className="font-normal text-zinc-600 dark:text-zinc-400">
                {" "}
                · {activeCount} {activeCount === 1 ? "source" : "sources"}
              </span>
            </p>
          </div>
        </div>
      ) : null}

      <div
        className="flex w-full overflow-hidden rounded-md bg-zinc-800/80"
        onMouseLeave={() => setActive(null)}
      >
        {segments.map((perspective) => {
          const count = counts[perspective];
          const width = coveragePercent(count, total);
          const meta = PERSPECTIVE_META[perspective];
          const isActive = active === perspective;
          const label = segmentLabel(perspective, count, total, width);
          const segmentStyle = perspectiveSegmentStyle(meta.color);
          return (
            <button
              key={perspective}
              type="button"
              className={`flex ${compact ? "min-h-8" : "min-h-9"} min-w-[2.5rem] shrink-0 items-center justify-center border-0 px-2 py-1.5 transition-opacity ${
                isActive ? "opacity-100 ring-2 ring-inset ring-white/40" : "opacity-95 hover:opacity-100"
              }`}
              style={{ width: `${width}%`, backgroundColor: segmentStyle.backgroundColor }}
              title={segmentTooltip(perspective, count, total)}
              aria-label={segmentTooltip(perspective, count, total)}
              onMouseEnter={() => setActive(perspective)}
              onFocus={() => setActive(perspective)}
              onBlur={() => setActive(null)}
            >
              <span
                className={`max-w-full truncate text-center font-normal leading-snug tabular-nums font-bengali ${
                  compact ? "text-[11px]" : "text-xs"
                }`}
                style={{ color: segmentStyle.color }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
