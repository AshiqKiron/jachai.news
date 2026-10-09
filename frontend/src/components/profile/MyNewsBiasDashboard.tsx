"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { readTrackArticleClicksEnabled } from "@/lib/track-article-clicks-pref";

import { BlindspotReadingInsight } from "@/components/profile/BlindspotReadingInsight";
import { NewsOwnershipBreakdown } from "@/components/profile/NewsOwnershipBreakdown";
import { ProfileProUpsell } from "@/components/profile/ProfileProUpsell";
import { ProfileSavedNewsSection } from "@/components/profile/ProfileSavedNewsSection";
import { StoriesReadChart } from "@/components/profile/StoriesReadChart";
import { TopicInsightsSection } from "@/components/profile/TopicInsightsSection";
import { ProfileFollowSection } from "@/components/profile/ProfileFollowSection";
import { TrackArticleClicksSetting } from "@/components/profile/TrackArticleClicksSetting";
import {
  DEMO_MY_NEWS_BIAS_STATS,
  computeMyNewsBiasStats,
  readReadingHistory,
  type MyNewsBiasStats,
} from "@/lib/reading-history";

type TabId = "mine" | "demo";

type Props = {
  displayName: string;
  isPro: boolean;
  proKnown: boolean;
};

function BiasBar({ stats }: { stats: MyNewsBiasStats }) {
  const segments = [
    { key: "left" as const, label: "L", pct: stats.leftPct, className: "bg-[#8b3a3a]" },
    { key: "center" as const, label: "C", pct: stats.centerPct, className: "bg-zinc-200 text-zinc-900" },
    { key: "right" as const, label: "R", pct: stats.rightPct, className: "bg-[#3d5a80]" },
  ].filter((segment) => segment.pct > 0);

  if (segments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
        Read a few stories on Shorup to see your bias breakdown here.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg">
      <div className="flex h-10 w-full text-xs font-semibold tabular-nums">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={`flex min-w-0 items-center justify-center ${segment.className}`}
            style={{ flex: `${Math.max(segment.pct, 8)} 1 0%` }}
          >
            {segment.label} {segment.pct}%
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownList({ stats, trackArticles }: { stats: MyNewsBiasStats; trackArticles: boolean }) {
  const lines: { count: number; textEn: string; textBn: string }[] = [];

  if (stats.leftStories > 0) {
    lines.push({
      count: stats.leftStories,
      textEn: "stories you read lean left.",
      textBn: "টি খবর বাম ঝোঁকের দিকে।",
    });
  }
  if (stats.centerStories > 0) {
    lines.push({
      count: stats.centerStories,
      textEn: "stories you read were balanced.",
      textBn: "টি খবর মধ্যম ঝোঁকের।",
    });
  }
  if (stats.rightStories > 0) {
    lines.push({
      count: stats.rightStories,
      textEn: "stories you read lean right.",
      textBn: "টি খবর ডান ঝোঁকের দিকে।",
    });
  }

  if (trackArticles && stats.articleCount > 0) {
    if (stats.leftArticles > 0) {
      lines.push({
        count: stats.leftArticles,
        textEn: "outlet links you opened lean left.",
        textBn: "টি বাম ঝোঁকের আউটলেট লিংক খুলেছেন।",
      });
    }
    if (stats.centerArticles > 0) {
      lines.push({
        count: stats.centerArticles,
        textEn: "outlet links you opened were balanced.",
        textBn: "টি মধ্যম ঝোঁকের আউটলেট লিংক।",
      });
    }
    if (stats.rightArticles > 0) {
      lines.push({
        count: stats.rightArticles,
        textEn: "outlet links you opened lean right.",
        textBn: "টি ডান ঝোঁকের আউটলেট লিংক।",
      });
    }
  }

  if (lines.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Open story pages (and enable article click tracking as Pro) to populate this list.
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-sm text-zinc-300">
      {lines.map((line) => (
        <li key={line.textEn}>
          <span className="font-semibold tabular-nums text-zinc-50">{line.count}</span> of the {line.textEn}
          <span className="mt-0.5 block font-bengali text-zinc-500">
            {line.count} {line.textBn}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MyNewsBiasDashboard({ displayName, isPro, proKnown }: Props) {
  const [tab, setTab] = useState<TabId>("mine");
  const [trackArticles, setTrackArticles] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    setTrackArticles(readTrackArticleClicksEnabled());
  }, []);

  const liveStats = useMemo(() => {
    void historyVersion;
    return computeMyNewsBiasStats(readReadingHistory(), { includeArticleClicks: trackArticles });
  }, [historyVersion, trackArticles]);

  const stats = tab === "demo" ? DEMO_MY_NEWS_BIAS_STATS : liveStats;

  const refreshStats = useCallback((articleTracking: boolean) => {
    setTrackArticles(articleTracking);
    setHistoryVersion((v) => v + 1);
  }, []);

  return (
    <div className="space-y-8 pb-4">
      <div className="flex gap-6 border-b border-zinc-800">
        {(
          [
            { id: "mine" as const, labelEn: "My News Bias", labelBn: "আমার নিউজ bias" },
            { id: "demo" as const, labelEn: "Demo Data", labelBn: "ডেমো ডেটা" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`border-b-2 pb-3 text-sm font-medium transition ${
              tab === item.id
                ? "border-zinc-100 text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {item.labelEn}
            <span className="mt-0.5 block font-bengali text-xs font-normal text-zinc-600">{item.labelBn}</span>
          </button>
        ))}
      </div>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-semibold text-zinc-50">{displayName}</h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <span className="tabular-nums">
            {stats.storyCount} {stats.storyCount === 1 ? "Story" : "Stories"} · {stats.articleCount}{" "}
            {stats.articleCount === 1 ? "Article" : "Articles"}
          </span>
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-600 text-[11px] text-zinc-500"
            title="Stories = cluster pages you opened. Articles = outlet links you clicked when Pro click tracking is on."
            aria-label="How counts work"
          >
            i
          </span>
        </p>
      </header>

      <ProfileSavedNewsSection isPro={isPro} proKnown={proKnown} />

      {isPro ? (
        <>
          <StoriesReadChart demo={tab === "demo"} historyVersion={historyVersion} />
          <NewsOwnershipBreakdown
            demo={tab === "demo"}
            historyVersion={historyVersion}
            includeArticleClicks={tab === "demo" ? true : trackArticles}
          />
          <TopicInsightsSection demo={tab === "demo"} historyVersion={historyVersion} />
        </>
      ) : proKnown ? (
        <>
          <ProfileProUpsell
            titleEn="Stories Read"
            titleBn="পড়া খবর"
            bodyEn="See how your reading pace changes over time with Shorup Pro."
            bodyBn="সময়ের সাথে কত খবর পড়েছেন — Pro-তে দেখুন"
          />
          <ProfileProUpsell
            titleEn="Who owns the news you read?"
            titleBn="আপনি যে খবর পড়েন তার মালিকানা"
            bodyEn="See which media groups and parent companies dominate your outlet clicks with Pro."
            bodyBn="কোন মিডিয়া গ্রুপের খবর বেশি পড়ছেন — Pro-তে দেখুন"
          />
          <ProfileProUpsell
            titleEn="Dive deeper"
            titleBn="আরও দেখুন"
            bodyEn="Insights into the topics you care about — topic breakdown and shortcuts on Pro."
            bodyBn="আপনার পছন্দের বিষয়ের অন্তর্দৃষ্টি — Pro-তে"
          />
        </>
      ) : null}

      <ProfileFollowSection demo={tab === "demo"} isPro={isPro} proKnown={proKnown} />

      {tab === "mine" ? (
        <section className="space-y-3" aria-labelledby="amar-propattito-heading">
          <div>
            <h2 id="amar-propattito-heading" className="font-bengali text-lg font-semibold text-zinc-100">
              Amar propattito
            </h2>
            <p className="text-xs uppercase tracking-widest text-zinc-500">My preferences · আমার পছন্দ</p>
          </div>
          <TrackArticleClicksSetting
            isPro={isPro}
            proKnown={proKnown}
            onChange={(enabled) => refreshStats(enabled)}
          />
        </section>
      ) : null}

      <section className="space-y-4" aria-label="Reading bias breakdown">
        <BiasBar stats={stats} />
        <BlindspotReadingInsight demo={tab === "demo"} historyVersion={historyVersion} />
        <BreakdownList stats={stats} trackArticles={tab === "demo" ? false : trackArticles} />
      </section>
    </div>
  );
}
