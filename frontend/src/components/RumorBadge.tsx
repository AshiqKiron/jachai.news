type Props = {
  compact?: boolean;
};

export function RumorBadge({ compact }: Props) {
  return (
    <span
      className={
        compact
          ? "inline-flex rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-300"
          : "inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200"
      }
    >
      Unverified
    </span>
  );
}
