import Link from "next/link";

import type { Story } from "@/lib/demo-data";
import { coverageStats } from "@/lib/coverage";
import { PERSPECTIVE_META } from "@/lib/perspectives";

const MIN_SOURCES = 2;

type Props = {
  story: Story;
};

/** Home / feed: signal that coverage lean exists; full stats live on the story page. */
export function StoryPartialityTeaser({ story }: Props) {
  const stats = coverageStats(story);
  if (!stats || stats.total < MIN_SOURCES) return null;

  const leanMeta = PERSPECTIVE_META[stats.dominantPerspective];
  const href = `/story/${story.slug}#coverage-details`;

  return (
    <Link
      href={href}
      className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-violet-300/80 bg-violet-50 px-3 py-2 text-sm transition hover:border-violet-400 hover:bg-violet-100/80 dark:border-violet-500/30 dark:bg-violet-950/45 dark:hover:border-violet-400/45 dark:hover:bg-violet-950/60"
    >
      <span className="shrink-0 rounded-full bg-violet-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-900 dark:bg-violet-500/25 dark:text-violet-100">
        পক্ষপাত
      </span>
      <span className="min-w-0 font-medium text-violet-950 dark:text-violet-100">
        <span className="tabular-nums" style={{ color: leanMeta.color }}>
          {stats.dominantPercent}%
        </span>{" "}
        <span className="font-bengali">{leanMeta.labelBn}</span>
      </span>
      <span className="w-full text-xs text-violet-800/90 dark:text-violet-200/80 sm:ml-auto sm:w-auto">
        <span className="font-bengali">বিস্তারিত পুরো খবরে</span>
        <span className="text-violet-700/80 dark:text-violet-300/70"> · Details in full story</span>
      </span>
    </Link>
  );
}
