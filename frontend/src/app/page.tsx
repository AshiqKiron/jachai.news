import Link from "next/link";

import { StoryFeedCard } from "@/components/StoryFeedCard";
import { FREE_DAILY_TOP_STORIES_LIMIT } from "@/lib/subscription-features";
import { hasProAccess } from "@/lib/subscription-access";
import { getTopStories } from "@/lib/stories";

export default async function HomePage() {
  const { stories, fromApi } = await getTopStories(FREE_DAILY_TOP_STORIES_LIMIT);
  const pro = await hasProAccess();

  return (
    <div className="space-y-10 pb-4">
      <section className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-accent-muted">বাংলাদেশ · Multi-source</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-zinc-50 md:text-5xl">
          একই খবর, বিভিন্ন কণ্ঠ।
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-400">
          Jachai clusters headlines from Prothom Alo, Daily Star, bdnews24, and more — compare framing, spot blindspots,
          and read with context. Like Ground News, built for Bangladesh.
        </p>
        {!fromApi ? (
          <p className="mt-3 text-xs text-zinc-600">
            Demo stories shown — start the API at{" "}
            <code className="text-zinc-500">localhost:8000</code> to load live RSS clusters.
          </p>
        ) : null}
      </section>

      <section className="flex gap-3 overflow-x-auto pb-1">
        <QuickLink href="/blindspot" label="Blindspot" sub="এক ঝুঁকে বেশি" />
        <QuickLink href="/bias" label="Source map" sub="ঝুঁক ও তথ্যবিশ্বাস" />
        <QuickLink href="/rumors" label="Rumors" sub="অপ্রমাণিত" />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            Daily top {FREE_DAILY_TOP_STORIES_LIMIT}
          </h2>
          {pro ? (
            <Link href="/browse" className="text-xs text-zinc-500 hover:text-zinc-300">
              Browse all →
            </Link>
          ) : (
            <Link href="/pro" className="text-xs text-accent/80 hover:text-accent">
              Full archive · Pro →
            </Link>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {stories.map((story) => (
            <StoryFeedCard key={story.slug} story={story} />
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link
      href={href}
      className="min-w-[140px] rounded-xl border border-zinc-800 bg-ink-900/60 px-4 py-3 hover:border-zinc-600"
    >
      <p className="text-sm font-medium text-zinc-100">{label}</p>
      <p className="text-xs text-zinc-500">{sub}</p>
    </Link>
  );
}
