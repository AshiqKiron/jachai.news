import { blindspotBannerCopy, type BlindspotAxisPerspective } from "@/lib/blindspot";
import { PERSPECTIVE_META } from "@/lib/perspectives";

type Props = {
  perspective: BlindspotAxisPerspective;
  compact?: boolean;
};

export function BlindspotBanner({ perspective, compact }: Props) {
  const copy = blindspotBannerCopy(perspective);
  const meta = PERSPECTIVE_META[perspective];

  if (compact) {
    return (
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
        <span className="font-semibold">{copy.titleBn}</span>
        <span className="text-amber-200/80"> — {copy.detailBn}</span>
      </p>
    );
  }

  return (
    <div
      className="rounded-xl border border-amber-500/35 bg-gradient-to-br from-amber-500/15 to-amber-600/5 px-4 py-3"
      style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}
    >
      <p className="text-sm font-semibold text-amber-100">{copy.titleBn}</p>
      <p className="mt-1 text-sm text-amber-200/90">{copy.detailBn}</p>
      <p className="mt-2 text-xs text-amber-200/70">{copy.detailEn}</p>
    </div>
  );
}
