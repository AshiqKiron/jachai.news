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
      className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-sm transition hover:border-violet-400/40 hover:bg-violet-500/15"
    >
      <span className="shrink-0 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
        পক্ষপাত
      </span>
      <span className="min-w-0 font-medium text-violet-100">
        <span className="tabular-nums" style={{ color: leanMeta.color }}>
          {stats.dominantPercent}%
        </span>{" "}
        <span className="font-bengali">{leanMeta.labelBn}</span>
      </span>
      <span className="w-full text-xs text-violet-200/75 sm:w-auto sm:ml-auto">
        <span className="font-bengali">বিস্তারিত পুরো খবরে</span>
        <span className="text-violet-200/60"> · Details in full story</span>
      </span>
    </Link>
  );
}
