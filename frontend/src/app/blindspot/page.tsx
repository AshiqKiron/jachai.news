import Link from "next/link";

import { ApiDegradedBanner } from "@/components/ApiDegradedBanner";
import { StoryFeedCard } from "@/components/StoryFeedCard";
import { getBlindspotStories } from "@/lib/stories";

export default async function BlindspotPage() {
  const { stories, fromApi } = await getBlindspotStories(16);

  return (
    <div className="space-y-8 pb-4">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-amber-400/90">Blindspot feed</p>
        <h1 className="page-title-lg mt-3">
          যেখানে এক ঝুঁকের সংবাদ বেশি
        </h1>
        <p className="mt-4 text-zinc-400">
          When opposition and international outlets cover a scandal but pro-government press stays silent,
          Shorup flags a <strong className="font-medium text-amber-200/90">সরকারের পক্ষে blindspot</strong>.
          When ruling-aligned media hypes a story opposition ignores, we flag a{" "}
          <strong className="font-medium text-amber-200/90">সরকারের বিপক্ষে blindspot</strong>.
        </p>
        {!fromApi ? (
          <div className="mt-4">
            <ApiDegradedBanner compact />
          </div>
        ) : null}
      </header>

      {stories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-sm text-zinc-500">
          No blindspot stories right now — we need clusters with at least three outlets and a clear gap on
          the establishment or opposition side.{" "}
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
