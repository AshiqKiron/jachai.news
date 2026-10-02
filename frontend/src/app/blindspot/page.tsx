import Link from "next/link";

import { StoryFeedCard } from "@/components/StoryFeedCard";
import { getBlindspotStories } from "@/lib/demo-data";

export default function BlindspotPage() {
  const stories = getBlindspotStories();

  return (
    <div className="space-y-8 pb-4">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-amber-400/90">Blindspot feed</p>
        <h1 className="mt-3 font-display text-3xl text-zinc-50 md:text-4xl">
          যেখানে এক ঝুঁকের সংবাদ বেশি
        </h1>
        <p className="mt-4 text-zinc-400">
          Ground News-style blindspots for Bangladesh: stories where one perspective (government lean, opposition,
          international, etc.) dominates coverage — so you can step outside your usual feed.
        </p>
      </header>

      {stories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-sm text-zinc-500">
          No blindspot stories in the demo set.{" "}
          <Link href="/" className="text-accent">
            Browse top stories
          </Link>
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stories.map((story) => (
            <StoryFeedCard key={story.slug} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}
