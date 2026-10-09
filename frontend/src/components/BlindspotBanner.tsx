import { blindspotBannerCopy, type BlindspotAxisPerspective } from "@/lib/blindspot";
import { PERSPECTIVE_META } from "@/lib/perspectives";

type Props = {
  perspective: BlindspotAxisPerspective;
  compact?: boolean;
  comfortable?: boolean;
};

export function BlindspotBanner({ perspective, compact, comfortable }: Props) {
  const copy = blindspotBannerCopy(perspective);
  const meta = PERSPECTIVE_META[perspective];

  if (compact) {
    return (
      <p className="rounded-lg border border-amber-300/80 bg-amber-100 px-3 py-2 text-sm text-amber-950 dark:border-amber-600/35 dark:bg-amber-950/50 dark:text-amber-50">
        <span className="font-semibold">{copy.titleBn}</span>
        <span className="text-amber-900/90 dark:text-amber-100/90"> — {copy.detailBn}</span>
      </p>
    );
  }

  if (comfortable) {
    return (
      <div
        className="rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2.5 dark:border-amber-500/35 dark:bg-amber-500/10"
        style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}
      >
        <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">{copy.titleBn}</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-900/95 dark:text-amber-100/90">
          {copy.detailBn}
          <span className="text-amber-800/80 dark:text-amber-100/75"> · {copy.detailEn}</span>
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 dark:border-amber-500/35 dark:bg-gradient-to-br dark:from-amber-500/15 dark:to-amber-600/5"
      style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}
    >
      <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">{copy.titleBn}</p>
      <p className="mt-1 text-sm text-amber-900/95 dark:text-amber-200/90">{copy.detailBn}</p>
      <p className="mt-2 text-xs text-amber-800/85 dark:text-amber-100/90">{copy.detailEn}</p>
    </div>
  );
}
