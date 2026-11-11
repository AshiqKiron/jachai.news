"use client";

import { useState } from "react";

import type { Story } from "@/lib/demo-data";
import { coverageCounts } from "@/lib/coverage";
import {
  PERSPECTIVE_META,
  perspectiveSegmentStyle,
  spectrumCopy,
  spectrumOrder,
} from "@/lib/perspectives";
import {
  REPORTING_TONE_META,
  REPORTING_TONE_ORDER,
  reportingCounts,
  type ReportingToneCopy,
} from "@/lib/reporting-spectrum";
import { coverageSpectrumModeForStory } from "@/lib/story-topics";

type Props = {
  story: Story;
  compact?: boolean;
};

type SegmentSpec = {
  id: string;
  width: number;
  label: string;
  tooltip: string;
  labelBn: string;
  labelEn: string;
  count: number;
  fill: string;
  textColor: string;
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

function segmentLabelText(
  copy: Pick<ReportingToneCopy, "labelBn" | "shortLabelBn">,
  count: number,
  total: number,
  widthPct: number,
): string {
  const pct = formatPercent(count, total);
  if (widthPct < 18) return pct;
  if (widthPct < 32) return `${copy.shortLabelBn} ${pct}`;
  return `${copy.labelBn} ${pct}`;
}

function sourceTooltip(labelBn: string, count: number, total: number): string {
  return `${HOVER_CONTEXT_BN} · ${labelBn} · ${formatPercent(count, total)} · ${count} source${count === 1 ? "" : "s"}`;
}

function politicalSegments(story: Story, total: number): SegmentSpec[] {
  const counts = coverageCounts(story);
  return spectrumOrder("government")
    .filter((perspective) => counts[perspective] > 0)
    .map((perspective) => {
      const count = counts[perspective];
      const width = coveragePercent(count, total);
      const copy = spectrumCopy(perspective, "government");
      const style = perspectiveSegmentStyle(PERSPECTIVE_META[perspective].color);
      return {
        id: perspective,
        width,
        label: segmentLabelText(copy, count, total, width),
        tooltip: sourceTooltip(copy.labelBn, count, total),
        labelBn: copy.labelBn,
        labelEn: copy.labelEn,
        count,
        fill: style.backgroundColor,
        textColor: style.color,
      };
    });
}

function reportingSegments(story: Story, total: number): SegmentSpec[] {
  const counts = reportingCounts(story);
  return REPORTING_TONE_ORDER.filter((tone) => counts[tone] > 0).map((tone) => {
    const count = counts[tone];
    const width = coveragePercent(count, total);
    const copy = REPORTING_TONE_META[tone];
    const style = perspectiveSegmentStyle(copy.color);
    return {
      id: tone,
      width,
      label: segmentLabelText(copy, count, total, width),
      tooltip: sourceTooltip(copy.labelBn, count, total),
      labelBn: copy.labelBn,
      labelEn: copy.labelEn,
      count,
      fill: style.backgroundColor,
      textColor: style.color,
    };
  });
}

export function CoverageBar({ story, compact }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const total = story.articles.length || 1;
  const mode = coverageSpectrumModeForStory(story);
  const segments =
    mode === "reporting" ? reportingSegments(story, total) : politicalSegments(story, total);

  if (segments.length === 0) {
    return null;
  }

  const activeSegment = segments.find((segment) => segment.id === active) ?? null;

  return (
    <div className="relative">
      {activeSegment ? (
        <div
          className="pointer-events-none absolute bottom-full left-0 right-0 z-50 mb-2 flex justify-center"
          role="tooltip"
        >
          <div className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center shadow-xl shadow-black/15 dark:border-neutral-600 dark:bg-neutral-950 dark:shadow-black/50">
            <p className="font-bengali text-[11px] font-medium leading-snug text-zinc-700 dark:text-zinc-300">
              {HOVER_CONTEXT_BN}
            </p>
            <p className="mt-1 text-[11px] font-medium leading-snug text-zinc-900 dark:text-zinc-50">
              {activeSegment.labelBn}
            </p>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400">{activeSegment.labelEn}</p>
            <p className="mt-1 text-xs font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatPercent(activeSegment.count, total)}
              <span className="font-normal text-zinc-600 dark:text-zinc-400">
                {" "}
                · {activeSegment.count} {activeSegment.count === 1 ? "source" : "sources"}
              </span>
            </p>
          </div>
        </div>
      ) : null}

      <div
        className="flex w-full overflow-hidden rounded-md bg-zinc-800/80"
        onMouseLeave={() => setActive(null)}
      >
        {segments.map((segment) => {
          const isActive = active === segment.id;
          return (
            <button
              key={segment.id}
              type="button"
              className={`flex ${compact ? "min-h-8" : "min-h-9"} min-w-[2.5rem] shrink-0 items-center justify-center border-0 px-2 py-1.5 transition-opacity ${
                isActive ? "opacity-100 ring-2 ring-inset ring-white/40" : "opacity-95 hover:opacity-100"
              }`}
              style={{ width: `${segment.width}%`, backgroundColor: segment.fill }}
              title={segment.tooltip}
              aria-label={segment.tooltip}
              onMouseEnter={() => setActive(segment.id)}
              onFocus={() => setActive(segment.id)}
              onBlur={() => setActive(null)}
            >
              <span
                className={`max-w-full truncate text-center font-normal leading-snug tabular-nums font-bengali ${
                  compact ? "text-[11px]" : "text-xs"
                }`}
                style={{ color: segment.textColor }}
              >
                {segment.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
