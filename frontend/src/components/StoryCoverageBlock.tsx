"use client";

import { CoverageBar } from "@/components/CoverageBar";
import type { Story } from "@/lib/demo-data";
import { coverageStats } from "@/lib/coverage";
import { PERSPECTIVE_META, spectrumCopy } from "@/lib/perspectives";
import { REPORTING_TONE_META, reportingStats } from "@/lib/reporting-spectrum";
import { coverageSpectrumModeForStory } from "@/lib/story-topics";

type Props = {
  story: Story;
  className?: string;
};

function coverageCaption(story: Story): { lineBn: string; lineEn?: string } | null {
  const mode = coverageSpectrumModeForStory(story);
  if (mode === "reporting") {
    const stats = reportingStats(story);
    if (!stats || stats.total === 0) return null;
    const nonZero = Object.values(stats.counts).filter((n) => n > 0);
    const max = Math.max(...nonZero);
    const min = Math.min(...nonZero);
    const balanced = max - min <= 1 && stats.dominantPercent <= 34;
    if (balanced && nonZero.length >= 2) {
      return { lineBn: `${stats.total}টি উৎস · একাধিক ধরনের রিপোর্ট` };
    }
    if (stats.dominantPercent >= 45 && stats.total >= 2) {
      const copy = REPORTING_TONE_META[stats.dominantTone];
      return {
        lineBn: `${stats.total}টি উৎস · ${stats.dominantPercent}% ${copy.labelBn}`,
        lineEn: `${stats.total} sources · ${stats.dominantPercent}% ${copy.labelEn.toLowerCase()}`,
      };
    }
    return {
      lineBn: `${stats.total}টি উৎস`,
      lineEn: `${stats.total} source${stats.total === 1 ? "" : "s"}`,
    };
  }

  const stats = coverageStats(story);
  if (!stats || stats.total === 0) return null;

  const nonZero = (Object.keys(PERSPECTIVE_META) as (keyof typeof stats.counts)[])
    .map((p) => stats.counts[p])
    .filter((n) => n > 0);
  const max = Math.max(...nonZero);
  const min = Math.min(...nonZero);
  const balanced = max - min <= 1 && stats.dominantPercent <= 34;

  if (balanced && nonZero.length >= 2) {
    return {
      lineBn: `${stats.total}টি উৎস · বিভিন্ন দৃষ্টিভঙ্গি থেকে`,
    };
  }

  if (stats.dominantPercent >= 45 && stats.total >= 2) {
    const copy = spectrumCopy(stats.dominantPerspective, "government");
    return {
      lineBn: `${stats.total}টি উৎস · ${stats.dominantPercent}% ${copy.labelBn} দিকে ঝুঁক`,
      lineEn: `${stats.total} sources · ${stats.dominantPercent}% lean ${copy.labelEn.toLowerCase()}`,
    };
  }

  return {
    lineBn: `${stats.total}টি উৎস`,
    lineEn: `${stats.total} source${stats.total === 1 ? "" : "s"}`,
  };
}

/** Compact spectrum + one caption line — counts live in the bar tooltips and article lists. */
export function StoryCoverageBlock({ story, className = "" }: Props) {
  if (story.articles.length === 0) {
    return null;
  }

  const caption = coverageCaption(story);

  return (
    <div className={className} aria-label="Coverage across perspectives">
      <CoverageBar story={story} compact />
      {caption ? (
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          <span className="font-bengali text-zinc-400">{caption.lineBn}</span>
          {caption.lineEn ? (
            <span className="mt-0.5 block text-[11px] text-zinc-600">{caption.lineEn}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
