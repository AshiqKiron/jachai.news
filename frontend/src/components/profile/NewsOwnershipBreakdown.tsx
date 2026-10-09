"use client";

import { useMemo } from "react";

import { ProfileHorizontalBars } from "@/components/profile/ProfileHorizontalBars";
import {
  computeMediaOwnershipBreakdown,
  demoMediaOwnershipBreakdown,
  readReadingHistory,
} from "@/lib/reading-history";

type Props = {
  demo: boolean;
  historyVersion?: number;
  includeArticleClicks: boolean;
};

function BuildingIcon({ className }: { className?: string }) {
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
        d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"
      />
    </svg>
  );
}

export function NewsOwnershipBreakdown({ demo, historyVersion = 0, includeArticleClicks }: Props) {
  const breakdown = useMemo(() => {
    void historyVersion;
    if (demo) return demoMediaOwnershipBreakdown();
    return computeMediaOwnershipBreakdown(readReadingHistory(), { includeArticleClicks });
  }, [demo, historyVersion, includeArticleClicks]);

  const rows = breakdown.rows.map((row) => ({
    key: row.key,
    label: row.label,
    pct: row.pct,
    count: row.count,
    href: row.url ?? undefined,
  }));

  return (
    <section
      className="overflow-hidden rounded-xl border border-zinc-800 bg-ink-950"
      aria-label="Who owns the news you read"
    >
      <div className="flex items-center gap-2.5 border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
        <BuildingIcon className="h-5 w-5 text-zinc-100" />
        <div>
          <h2 className="text-base font-semibold text-zinc-50">Who owns the news you read?</h2>
          <p className="font-bengali text-xs text-zinc-500">আপনি যে খবর পড়েন তার মালিকানা</p>
        </div>
      </div>
      <div className="px-4 py-5">
        <ProfileHorizontalBars
          rows={rows}
          emptyMessage={
            includeArticleClicks
              ? "Open outlet links from story pages to see which media groups you read most."
              : "Turn on article click tracking above, then open outlet links to map publisher ownership."
          }
          emptyMessageBn={
            includeArticleClicks
              ? "স্টোরি পেজ থেকে আউটলেট লিংক খুললে মালিকানার ভাগ দেখা যাবে।"
              : "উপরে ক্লিক ট্র্যাকিং চালু করে আউটলেট লিংক খুলুন।"
          }
        />
        {breakdown.totalTracked > 0 ? (
          <p className="mt-4 text-xs text-zinc-500">
            Based on {breakdown.totalTracked} tracked outlet{" "}
            {breakdown.totalTracked === 1 ? "open" : "opens"} on this device. Parent groups shown when
            known.
          </p>
        ) : null}
      </div>
    </section>
  );
}
