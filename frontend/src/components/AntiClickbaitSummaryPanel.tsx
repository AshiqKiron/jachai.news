type Props = {
  bullets: string[];
  className?: string;
};

export function AntiClickbaitSummaryPanel({ bullets, className = "" }: Props) {
  if (bullets.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-zinc-800/90 bg-ink-900/40 px-4 py-3.5 ${className}`}
      aria-live="polite"
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        <span className="font-bengali normal-case tracking-normal text-zinc-400">
          ৩-বুলেট anti-clickbait সারাংশ
        </span>
        <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-zinc-600">
          3-bullet anti-clickbait summary
        </span>
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-4 marker:text-zinc-600">
        {bullets.map((text) => (
          <li key={text.slice(0, 48)} className="text-sm leading-relaxed text-zinc-300">
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
