"use client";

import { useMemo, useState } from "react";

import {
  computeStoriesReadChart,
  demoStoriesReadChart,
  formatStoriesReadAxisLabel,
  readReadingHistory,
  type StoriesReadRange,
} from "@/lib/reading-history";

type Props = {
  demo: boolean;
  /** Bump when local reading history changes. */
  historyVersion?: number;
};

const RANGES: { id: StoriesReadRange; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

function axisLabelIndices(length: number, maxLabels = 6): number[] {
  if (length <= 0) return [];
  if (length <= maxLabels) {
    return Array.from({ length }, (_, i) => i);
  }
  const indices: number[] = [];
  for (let i = 0; i < maxLabels; i += 1) {
    indices.push(Math.round((i / (maxLabels - 1)) * (length - 1)));
  }
  return [...new Set(indices)].sort((a, b) => a - b);
}

function compareCopy(pct: number): { lead: string; pct: number; tail: string } {
  const abs = Math.abs(pct);
  if (pct > 0) {
    return { lead: "You've read ", pct: abs, tail: "% more stories than last week" };
  }
  if (pct < 0) {
    return { lead: "You've read ", pct: abs, tail: "% fewer stories than last week" };
  }
  return { lead: "You've read ", pct: 0, tail: "% more stories than last week" };
}

function StoriesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export function StoriesReadChart({ demo, historyVersion = 0 }: Props) {
  const [range, setRange] = useState<StoriesReadRange>("day");

  const chart = useMemo(() => {
    void historyVersion;
    if (demo) return demoStoriesReadChart(range);
    return computeStoriesReadChart(readReadingHistory(), range);
  }, [demo, range, historyVersion]);

  const maxCount = useMemo(
    () => Math.max(1, ...chart.buckets.map((bucket) => bucket.count)),
    [chart.buckets],
  );

  const labelIndices = useMemo(() => axisLabelIndices(chart.buckets.length), [chart.buckets.length]);
  const compare = compareCopy(chart.weekOverWeekPct);

  return (
    <section
      className="overflow-hidden rounded-xl border border-zinc-800 bg-ink-950"
      aria-label="Stories read over time"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <StoriesIcon className="h-5 w-5 text-zinc-100" />
          <h2 className="text-base font-semibold text-zinc-50">Stories Read</h2>
          <span className="font-bengali text-sm font-normal text-zinc-500">পড়া খবর</span>
        </div>
        <div
          className="inline-flex overflow-hidden rounded-md border border-zinc-600 text-xs font-medium"
          role="group"
          aria-label="Chart time range"
        >
          {RANGES.map((item) => {
            const selected = range === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id)}
                className={`min-w-[3.25rem] px-3 py-1.5 transition ${
                  selected
                    ? "bg-zinc-100 text-zinc-950"
                    : "bg-ink-950 text-zinc-200 hover:bg-zinc-900"
                } ${item.id !== "month" ? "border-r border-zinc-600" : ""}`}
                aria-pressed={selected}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-4 pt-5">
        <div className="relative h-40">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 flex h-[calc(100%-1.25rem)] flex-col justify-between"
            aria-hidden
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-t border-zinc-800/80" />
            ))}
          </div>
          <div className="relative flex h-[calc(100%-1.25rem)] items-end gap-px">
            {chart.buckets.map((bucket) => (
              <div key={bucket.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <div
                  className="w-full bg-zinc-100 transition-[height] duration-300"
                  style={{
                    height: bucket.count > 0 ? `${(bucket.count / maxCount) * 100}%` : "0%",
                    minHeight: bucket.count > 0 ? 2 : 0,
                  }}
                  title={`${formatStoriesReadAxisLabel(bucket.start, range)}: ${bucket.count}`}
                />
              </div>
            ))}
          </div>
          <div className="relative mt-2 h-5 border-t border-zinc-200">
            {labelIndices.map((index) => {
              const bucket = chart.buckets[index];
              if (!bucket) return null;
              const leftPct = chart.buckets.length <= 1 ? 0 : (index / (chart.buckets.length - 1)) * 100;
              return (
                <span
                  key={bucket.key}
                  className="absolute top-1.5 -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums text-zinc-400 sm:text-[11px]"
                  style={{ left: `${leftPct}%` }}
                >
                  {formatStoriesReadAxisLabel(bucket.start, range)}
                </span>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-sm text-zinc-400">
          {compare.lead}
          <span className="font-semibold tabular-nums text-[#c5a377]">{compare.pct}%</span>
          {compare.tail}
          <span className="mt-0.5 block font-bengali text-xs text-zinc-600">
            গত সপ্তাহের তুলনায় পড়া খবরের সংখ্যা
          </span>
        </p>
      </div>
    </section>
  );
}
