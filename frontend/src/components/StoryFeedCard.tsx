import Link from "next/link";

import { CoverageBar } from "@/components/CoverageBar";
import type { Story } from "@/lib/demo-data";

type Props = {
  story: Story;
};

export function StoryFeedCard({ story }: Props) {
  return (
    <article className="group rounded-2xl border border-zinc-800/90 bg-ink-900/70 p-5 shadow-lg shadow-black/25 transition hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
          {story.categoryBn} · {story.articles.length} উৎস
        </p>
        {story.isBlindspot ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
            Blindspot
          </span>
        ) : null}
      </div>
      <h2 className="mt-2 font-display text-xl leading-snug text-zinc-50 group-hover:text-white">
        <Link href={`/story/${story.slug}`}>{story.titleBn}</Link>
      </h2>
      <p className="mt-1 text-sm text-zinc-500 line-clamp-1">{story.title}</p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400 line-clamp-2">{story.summaryBn}</p>
      <div className="mt-4">
        <CoverageBar story={story} compact />
      </div>
    </article>
  );
}
