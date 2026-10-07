"use client";

import {
  HOME_STORY_TOPICS,
  type StoryTopicId,
} from "@/lib/story-topics";

type Props = {
  activeTopicId: StoryTopicId;
  visibleTopicIds: StoryTopicId[];
  onSelect: (topicId: StoryTopicId) => void;
  /** Horizontal chips on small screens; vertical stack in the home right sidebar on lg+. */
  layout?: "horizontal" | "sidebar";
};

function topicButtonClass(active: boolean, layout: "horizontal" | "sidebar") {
  const base =
    "rounded-xl border px-4 py-2.5 text-left transition " +
    (active
      ? "border-accent/60 bg-accent/15 text-zinc-50"
      : "border-zinc-800 bg-ink-900/60 text-zinc-300 hover:border-zinc-600");
  if (layout === "sidebar") {
    return `${base} w-full`;
  }
  return `${base} min-w-[7.5rem] shrink-0 snap-start`;
}

export function HomeTopicFilter({
  activeTopicId,
  visibleTopicIds,
  onSelect,
  layout = "horizontal",
}: Props) {
  const listClassName =
    layout === "sidebar"
      ? "flex flex-col gap-2"
      : "horizontal-scroll-pad flex gap-2 pb-1 snap-x snap-mandatory";

  return (
    <nav className="space-y-2" aria-label="Filter stories by topic">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        Topics · <span className="font-bengali normal-case">টপিক</span>
      </p>
      <div className={listClassName}>
        {visibleTopicIds.map((topicId) => {
          if (topicId === "all") {
            const active = activeTopicId === "all";
            return (
              <button
                key="all"
                type="button"
                onClick={() => onSelect("all")}
                className={topicButtonClass(active, layout)}
              >
                <p className="text-sm font-medium">All</p>
                <p className="font-bengali text-xs text-zinc-500">সব</p>
              </button>
            );
          }

          const topic = HOME_STORY_TOPICS.find((t) => t.id === topicId);
          if (!topic) return null;
          const active = activeTopicId === topicId;

          return (
            <button
              key={topicId}
              type="button"
              onClick={() => onSelect(topicId)}
              className={topicButtonClass(active, layout)}
            >
              <p className="text-sm font-medium">{topic.labelEn}</p>
              <p className="font-bengali text-xs text-zinc-500">{topic.labelBn}</p>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
