import type { SourceDigestSnippet } from "@/lib/source-digest";

type Props = {
  snippets: SourceDigestSnippet[];
  /** Optional Bengali hint under the English label. */
  labelBn?: string;
  className?: string;
};

export function SourceDigestPanel({ snippets, labelBn = "উৎস থেকে", className = "" }: Props) {
  if (snippets.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-zinc-800/90 bg-ink-900/40 px-4 py-3.5 ${className}`}
      aria-live="polite"
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        <span className="font-bengali normal-case tracking-normal text-zinc-400">{labelBn}</span>
        <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-zinc-600">
          From sources
        </span>
      </p>
      <ul className="mt-3 space-y-2.5">
        {snippets.map((row) => (
          <li key={`${row.sourceName}-${row.text.slice(0, 24)}`} className="text-sm leading-relaxed">
            <span className="font-semibold text-zinc-200">{row.sourceName}</span>
            <span className="text-zinc-500"> — </span>
            <span className="text-zinc-300">{row.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
