import type { Story } from "@/lib/demo-data";
import { coverageCounts } from "@/lib/coverage";
import { PERSPECTIVE_META, type Perspective } from "@/lib/perspectives";

type Props = {
  story: Story;
  compact?: boolean;
};

export function CoverageBar({ story, compact }: Props) {
  const counts = coverageCounts(story);
  const total = story.articles.length || 1;
  const segments = (Object.keys(PERSPECTIVE_META) as Perspective[])
    .filter((p) => counts[p] > 0)
    .sort((a, b) => PERSPECTIVE_META[a].order - PERSPECTIVE_META[b].order);

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
        {segments.map((perspective) => {
          const width = (counts[perspective] / total) * 100;
          return (
            <div
              key={perspective}
              className="h-full transition-all"
              style={{ width: `${width}%`, backgroundColor: PERSPECTIVE_META[perspective].color }}
              title={`${PERSPECTIVE_META[perspective].labelEn}: ${counts[perspective]}`}
            />
          );
        })}
      </div>
      {!compact && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
          {segments.map((perspective) => (
            <li key={perspective} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: PERSPECTIVE_META[perspective].color }}
              />
              {PERSPECTIVE_META[perspective].labelBn} ({counts[perspective]})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
