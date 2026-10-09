"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ProfileHorizontalBars } from "@/components/profile/ProfileHorizontalBars";
import {
  computeTopicReadingBreakdown,
  demoTopicReadingBreakdown,
  readReadingHistory,
} from "@/lib/reading-history";

type Props = {
  demo: boolean;
  historyVersion?: number;
};

function CompassIcon({ className }: { className?: string }) {
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
        d="M12 3v3m0 12v3M3 12h3m12 0h3m-2.05-7.05-2.12 2.12m-5.66 5.66-2.12 2.12m0-9.9 2.12 2.12m5.66 5.66 2.12 2.12M12 8a4 4 0 100 8 4 4 0 000-8z"
      />
    </svg>
  );
}

export function TopicInsightsSection({ demo, historyVersion = 0 }: Props) {
  const breakdown = useMemo(() => {
    void historyVersion;
    if (demo) return demoTopicReadingBreakdown();
    return computeTopicReadingBreakdown(readReadingHistory());
  }, [demo, historyVersion]);

  const rows = breakdown.rows.map((row) => ({
    key: row.topicId,
    label: row.labelEn,
    labelBn: row.labelBn,
    pct: row.pct,
    count: row.count,
    href: `/?topic=${row.topicId}`,
  }));

  const topTopic = breakdown.rows[0];

  return (
    <section
      className="overflow-hidden rounded-xl border border-zinc-800 bg-ink-950"
      aria-label="Topics you care about"
    >
      <div className="flex items-center gap-2.5 border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
        <CompassIcon className="h-5 w-5 text-zinc-100" />
        <div>
          <h2 className="text-base font-semibold text-zinc-50">Dive deeper</h2>
          <p className="text-sm text-zinc-400">Insights into the topics you care about.</p>
          <p className="font-bengali text-xs text-zinc-500">আপনার পছন্দের বিষয় — আরও দেখুন</p>
        </div>
      </div>
      <div className="px-4 py-5">
        <ProfileHorizontalBars
          rows={rows}
          emptyMessage="Open story pages on Shorup to see which topics you read most."
          emptyMessageBn="কোন বিষয়ে বেশি পড়ছেন তা দেখতে স্টোরি পেজ খুলুন।"
        />
        {topTopic ? (
          <p className="mt-4 text-sm text-zinc-400">
            You read the most about{" "}
            <Link href={`/?topic=${topTopic.topicId}`} className="font-medium text-zinc-100 hover:text-accent">
              {topTopic.labelEn}
            </Link>
            <span className="font-bengali text-zinc-500"> ({topTopic.labelBn})</span>
            <span className="mt-0.5 block font-bengali text-xs text-zinc-600">
              সবচেয়ে বেশি পড়া বিষয় — হোম ফিডে ফিল্টার করুন
            </span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
