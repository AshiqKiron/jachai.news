"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  computeBlindspotReadingInsight,
  demoBlindspotReadingInsight,
  readReadingHistory,
  type BlindspotReadingSide,
} from "@/lib/reading-history";

type Props = {
  demo: boolean;
  historyVersion?: number;
};

function sideLabel(side: BlindspotReadingSide): { en: string; bn: string } {
  if (side === "left") {
    return { en: "left", bn: "বাম" };
  }
  return { en: "right", bn: "ডান" };
}

function insightCopy(dominantSide: BlindspotReadingSide): string {
  const side = sideLabel(dominantSide).en;
  return ` more blindspots for the ${side}`;
}

export function BlindspotReadingInsight({ demo, historyVersion = 0 }: Props) {
  const insight = useMemo(() => {
    void historyVersion;
    if (demo) return demoBlindspotReadingInsight();
    return computeBlindspotReadingInsight(readReadingHistory());
  }, [demo, historyVersion]);

  const total = insight.leftBlindspotReads + insight.rightBlindspotReads;

  if (!insight.dominantSide || total === 0) {
    return null;
  }

  const labels = sideLabel(insight.dominantSide);

  return (
    <p className="text-sm text-zinc-400">
      You&apos;ve read{" "}
      <span className="font-semibold tabular-nums text-[#c5a377]">{insight.excessPct}%</span>
      {insightCopy(insight.dominantSide)}
      <span className="mt-0.5 block font-bengali text-xs text-zinc-600">
        {labels.bn} পক্ষের ব্লাইন্ডস্পট —{" "}
        <Link href="/blindspot" className="text-zinc-500 underline-offset-2 hover:text-accent hover:underline">
          ব্লাইন্ডস্পট ফিড
        </Link>
      </span>
    </p>
  );
}
