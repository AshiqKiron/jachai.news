"use client";

import type { Story } from "@/lib/demo-data";
import { coverageStats } from "@/lib/coverage";
import { PERSPECTIVE_META, type Perspective } from "@/lib/perspectives";
import { formatRelativeTimeEn } from "@/lib/relative-time";

type Props = {
  story: Story;
  density?: "default" | "compact";
  hideHeading?: boolean;
  className?: string;
};

const STAT_PERSPECTIVES: Perspective[] = [
  "opposition",
  "establishment",
  "neutral",
  "international",
];

function StatRow({
  labelEn,
  labelBn,
  value,
  accent,
}: {
  labelEn: string;
  labelBn: string;
  value: number;
  accent?: string;
}) {
  return (
    <div>
      <dt className="text-[11px] text-zinc-500">
        <span className="font-bengali">{labelBn}</span>
        <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-zinc-600">{labelEn}</span>
      </dt>
      <dd
        className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

function CompactStatCard({
  labelBn,
  labelEn,
  value,
  accent,
}: {
  labelBn: string;
  labelEn: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/25 px-3 py-2.5">
      <p
        className="text-xl font-semibold tabular-nums leading-none text-zinc-100"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      <p className="mt-2 text-[11px] leading-snug">
        <span className="font-bengali text-zinc-400">{labelBn}</span>
        <span className="mt-0.5 block text-[10px] leading-tight text-zinc-600">{labelEn}</span>
      </p>
    </div>
  );
}

export function StoryCoverageDetails({
  story,
  density = "default",
  hideHeading = false,
  className = "",
}: Props) {
  const stats = coverageStats(story);
  if (!stats) return null;

  const dominantMeta = PERSPECTIVE_META[stats.dominantPerspective];
  const lastUpdated = formatRelativeTimeEn(stats.lastUpdatedIso);
  const perspectiveRows = STAT_PERSPECTIVES.filter(
    (p) => p !== "international" || stats.counts.international > 0,
  );

  if (density === "compact") {
    return (
      <div className={className}>
        <div className="grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-4 sm:grid-cols-3 lg:grid-cols-5">
          <CompactStatCard labelBn="মোট উৎস" labelEn="Total sources" value={stats.total} />
          {perspectiveRows.map((perspective) => {
            const meta = PERSPECTIVE_META[perspective];
            return (
              <CompactStatCard
                key={perspective}
                labelBn={meta.shortLabelBn}
                labelEn={meta.labelEn}
                value={stats.counts[perspective]}
                accent={meta.color}
              />
            );
          })}
        </div>

        <div className="mt-3 flex flex-col gap-3 border-t border-zinc-800/80 pt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <p className="text-[11px] text-zinc-500">
              <span className="font-bengali text-zinc-400">শেষ আপডেট</span>
              <span className="mt-0.5 block text-[10px] text-zinc-600">Last updated</span>
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-200">{lastUpdated}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] text-zinc-500">
              <span className="font-bengali normal-case text-zinc-400">প্রধান ঝুঁক</span>
              <span className="mt-0.5 block text-[10px] text-zinc-600">Leading lean</span>
            </p>
            <p className="mt-1 text-sm leading-snug text-zinc-300">
              <span style={{ color: dominantMeta.color }} className="font-semibold tabular-nums">
                {stats.dominantPercent}%
              </span>{" "}
              {dominantMeta.labelEn}
            </p>
            <p className="mt-0.5 font-bengali text-sm text-zinc-500">{dominantMeta.labelBn}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      id="coverage-details"
      className={`scroll-mt-24 rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-4 sm:p-5 ${className}`}
      aria-labelledby={hideHeading ? undefined : "coverage-details-heading"}
    >
      {!hideHeading ? (
        <h2
          id="coverage-details-heading"
          className="text-xs font-medium uppercase tracking-widest text-zinc-500"
        >
          <span className="font-bengali normal-case tracking-normal">কভারেজ বিস্তারিত</span> · Coverage
          details
        </h2>
      ) : null}

      <dl className={`grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5 ${hideHeading ? "" : "mt-4"}`}>
        <StatRow labelEn="Total news sources" labelBn="মোট উৎস" value={stats.total} />
        {perspectiveRows.map((perspective) => {
          const meta = PERSPECTIVE_META[perspective];
          return (
            <StatRow
              key={perspective}
              labelEn={meta.labelEn}
              labelBn={meta.labelBn}
              value={stats.counts[perspective]}
              accent={meta.color}
            />
          );
        })}
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-[11px] text-zinc-500">
            <span className="font-bengali">শেষ আপডেট</span>
            <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-zinc-600">
              Last updated
            </span>
          </dt>
          <dd className="mt-1 text-lg font-semibold text-zinc-200">{lastUpdated}</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-zinc-800/80 pt-4">
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">
          <span className="font-bengali normal-case">পক্ষপাত বিন্যাস</span> · Bias distribution
        </p>
        <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-zinc-50">
          <span style={{ color: dominantMeta.color }}>{stats.dominantPercent}%</span>{" "}
          <span className="text-xl font-normal text-zinc-300">{dominantMeta.labelEn}</span>
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          {stats.dominantPercent}% of sources lean {dominantMeta.labelEn.toLowerCase()}
          <span className="mt-0.5 block font-bengali text-zinc-500">
            {stats.dominantPercent}% উৎস {dominantMeta.labelBn} দিকে ঝুঁকছে
          </span>
        </p>
      </div>
    </section>
  );
}
