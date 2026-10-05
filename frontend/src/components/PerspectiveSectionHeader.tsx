import { PERSPECTIVE_META, type Perspective } from "@/lib/perspectives";

type Props = {
  perspective: Perspective;
  /** Optional count shown on the right (e.g. sources or headlines). */
  count?: number;
  countNoun?: "source" | "headline";
  className?: string;
};

export function PerspectiveSectionHeader({
  perspective,
  count,
  countNoun = "source",
  className,
}: Props) {
  const meta = PERSPECTIVE_META[perspective];

  return (
    <div className={`flex flex-wrap items-start justify-between gap-x-3 gap-y-1 ${className ?? ""}`}>
      <div className="min-w-0">
        <p className="font-bengali text-sm font-semibold leading-snug text-zinc-100">{meta.labelBn}</p>
        <p className="mt-0.5 text-xs leading-snug text-zinc-400">{meta.labelEn}</p>
      </div>
      {count !== undefined ? (
        <span className="shrink-0 text-xs tabular-nums text-zinc-400">
          {count} {countNoun}
          {count === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}
