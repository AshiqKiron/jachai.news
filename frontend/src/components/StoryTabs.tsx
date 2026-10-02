"use client";

import { useState } from "react";

import { HeadlineCompare } from "@/components/HeadlineCompare";
import { PerspectiveComparison } from "@/components/PerspectiveComparison";
import { SourceFilterList } from "@/components/SourceFilterList";
import type { ArticleWithSource } from "@/lib/coverage";
import type { Story } from "@/lib/demo-data";

const TABS = [
  { id: "compare", label: "তুলনা", en: "Compare" },
  { id: "perspectives", label: "দৃষ্টিভঙ্গি", en: "Perspectives" },
  { id: "sources", label: "উৎস", en: "Sources" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Props = {
  story: Story;
  articles: ArticleWithSource[];
};

export function StoryTabs({ story, articles }: Props) {
  const [tab, setTab] = useState<TabId>("compare");

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-ink-900/50 p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
              tab === item.id ? "bg-zinc-800 text-zinc-50" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {item.label}
            <span className="ml-1 text-[10px] uppercase opacity-60">{item.en}</span>
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "compare" && <HeadlineCompare articles={articles} />}
        {tab === "perspectives" && <PerspectiveComparison story={story} />}
        {tab === "sources" && <SourceFilterList articles={articles} />}
      </div>
    </div>
  );
}
