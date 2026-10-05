"use client";

import { biasScoreToPerspective } from "@/lib/perspectives";
import { PERSPECTIVE_META } from "@/lib/perspectives";

type Props = {
  score: number | null;
  label: string;
  labelBn?: string;
};

export function BiasMeter({ score, label, labelBn }: Props) {
  const perspective = biasScoreToPerspective(score);
  const meta = PERSPECTIVE_META[perspective];
  const value = score ?? 0;
  const clamped = Math.max(-1, Math.min(1, value));
  /** Left = pro-government, center = neutral, right = opposition. */
  const percent = ((1 - clamped) / 2) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="min-w-0">
          {labelBn ? <p className="font-bengali text-zinc-200">{labelBn}</p> : null}
          <span className="text-zinc-500">{label}</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
          {meta.labelBn}
        </span>
      </div>
      <div className="relative h-1 overflow-hidden rounded-full bg-zinc-800">
        <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-600" />
        <div
          className="absolute inset-y-0 rounded-full opacity-90"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${PERSPECTIVE_META.establishment.color}, ${PERSPECTIVE_META.neutral.color}, ${PERSPECTIVE_META.opposition.color})`,
          }}
        />
        <div
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-ink-950 bg-white shadow"
          style={{ left: `calc(${percent}% - 4px)` }}
        />
      </div>
      <div className="flex justify-between gap-1 text-[10px] font-bengali tracking-wide text-zinc-600">
        <span className="text-left">সরকারের পক্ষে</span>
        <span className="shrink-0 text-center">নিরপেক্ষ</span>
        <span className="text-right">সরকারের বিপক্ষে</span>
      </div>
    </div>
  );
}
