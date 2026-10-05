"use client";

import { useState } from "react";

import { HeadlineClashTriptych } from "@/components/HeadlineClashTriptych";
import { HeadlineCompare } from "@/components/HeadlineCompare";
import { HeadlinesByPerspective } from "@/components/HeadlinesByPerspective";
import { PerspectiveComparison } from "@/components/PerspectiveComparison";
import { StoryArticleFeed } from "@/components/StoryArticleFeed";
import type { ArticleWithSource } from "@/lib/coverage";
import type { Story } from "@/lib/demo-data";

const TABS = [
  { id: "coverage", label: "কভারেজ", en: "Coverage" },
  { id: "compare", label: "তুলনা", en: "Compare" },
  { id: "perspectives", label: "দৃষ্টিভঙ্গি", en: "Perspectives" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Props = {
  story: Story;
  articles: ArticleWithSource[];
};

export function StoryTabs({ story, articles }: Props) {
  const [tab, setTab] = useState<TabId>("coverage");

  return (
    <div className="min-w-0">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-ink-900/50 p-1 [-webkit-overflow-scrolling:touch]">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`min-w-[5.5rem] flex-1 whitespace-nowrap rounded-lg px-2 py-2 text-sm transition sm:px-3 ${
              tab === item.id ? "bg-zinc-800 text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {item.label}
            <span className="ml-1 text-[10px] uppercase opacity-60">{item.en}</span>
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "coverage" && <StoryArticleFeed articles={articles} />}
        {tab === "compare" && (
          <>
            <HeadlineClashTriptych articles={articles} />
            <HeadlinesByPerspective articles={articles} className="mt-8 space-y-6" />
            <div className="mt-8">
              <HeadlineCompare articles={articles} />
            </div>
          </>
        )}
        {tab === "perspectives" && <PerspectiveComparison story={story} articles={articles} />}
      </div>
    </div>
  );
}
