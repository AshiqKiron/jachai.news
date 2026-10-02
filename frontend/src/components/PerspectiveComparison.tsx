import type { Story } from "@/lib/demo-data";
import { PERSPECTIVE_META, type Perspective } from "@/lib/perspectives";

type Props = {
  story: Story;
};

export function PerspectiveComparison({ story }: Props) {
  const entries = (Object.entries(story.perspectiveSummaries) as [Perspective, string][]).sort(
    (a, b) => PERSPECTIVE_META[a[0]].order - PERSPECTIVE_META[b[0]].order,
  );

  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Not enough distinct coverage across perspectives for a full comparison yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([perspective, text]) => {
        const meta = PERSPECTIVE_META[perspective];
        return (
          <div
            key={perspective}
            className="rounded-xl border border-zinc-800/80 bg-ink-900/50 p-4"
            style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: meta.color }}>
              {meta.labelBn} · {meta.labelEn}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{text}</p>
          </div>
        );
      })}
    </div>
  );
}
