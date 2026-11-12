type Props = {
  sentence: string;
  sourceName: string | null;
  /** Feed cards keep the label short so the sentence stays the first line. */
  compact?: boolean;
};

/** The buried walk-back, pinned above the headline. */
export function WalkbackPin({ sentence, sourceName, compact = false }: Props) {
  if (compact) {
    return (
      <div className="min-w-0">
        <p className="text-[11px] text-zinc-500">
          <span className="font-bengali text-amber-800/90 dark:text-amber-200/90">শিরোনামের নিচের বাক্য</span>
        </p>
        <p lang="bn" className="story-title-bn mt-1 text-sm leading-relaxed text-zinc-900 line-clamp-3 dark:text-zinc-100">
          {sentence}
        </p>
      </div>
    );
  }

  return (
    <section
      className="rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3.5 dark:border-amber-400/35 dark:bg-amber-500/10"
      aria-label="The line under the headline"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
        <span className="font-bengali normal-case tracking-normal text-sm font-semibold">
          শিরোনামের নিচের বাক্য
        </span>
        <span className="text-amber-800/80 dark:text-amber-100/70"> · The line under the headline</span>
      </p>
      <p lang="bn" className="story-title-bn mt-2 text-lg leading-relaxed text-amber-950 dark:text-amber-50 sm:text-xl">
        {sentence}
      </p>
      {sourceName ? (
        <p className="mt-1.5 text-xs text-amber-900/75 dark:text-amber-100/70">{sourceName}</p>
      ) : null}
    </section>
  );
}
