import { partialityBannerCopy, type PartialityAnalysis } from "@/lib/partiality";
import { biasScoreToPerspective, PERSPECTIVE_META } from "@/lib/perspectives";

type Props = {
  analysis: PartialityAnalysis;
  compact?: boolean;
};

export function PartialityBanner({ analysis, compact }: Props) {
  const copy = partialityBannerCopy(analysis);
  const leanMeta = PERSPECTIVE_META[biasScoreToPerspective(analysis.clusterBiasScore)];

  if (compact) {
    return (
      <p className="rounded-lg border border-violet-300/80 bg-violet-50 px-3 py-2 text-sm text-violet-950 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100">
        <span className="font-semibold">{copy.titleBn}</span>
        <span className="text-violet-900/90 dark:text-violet-100/85"> — {copy.detailBn}</span>
      </p>
    );
  }

  return (
    <div
      className="rounded-xl border border-violet-300/80 bg-violet-50 px-4 py-3 dark:border-violet-500/35 dark:bg-gradient-to-br dark:from-violet-500/15 dark:to-violet-600/5"
      style={{ borderLeftColor: leanMeta.color, borderLeftWidth: 3 }}
    >
      <p className="text-sm font-semibold text-violet-950 dark:text-violet-100">{copy.titleBn}</p>
      <p className="mt-1 text-sm leading-relaxed text-violet-900/95 dark:text-violet-100/90">{copy.detailBn}</p>
      <p className="mt-2 text-xs text-violet-800/85 dark:text-violet-100/90">{copy.detailEn}</p>
    </div>
  );
}
