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
      <p className="text-xs text-zinc-500">
        <span className="font-bengali text-zinc-400">৩-বুলেট সারাংশ</span>
        <span className="text-zinc-600"> · Quick summary from sources</span>
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
