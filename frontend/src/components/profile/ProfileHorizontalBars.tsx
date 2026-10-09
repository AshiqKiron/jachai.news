import Link from "next/link";

type Row = {
  key: string;
  label: string;
  labelBn?: string;
  pct: number;
  count: number;
  href?: string;
};

type Props = {
  rows: Row[];
  emptyMessage: string;
  emptyMessageBn?: string;
};

export function ProfileHorizontalBars({ rows, emptyMessage, emptyMessageBn }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
        {emptyMessage}
        {emptyMessageBn ? (
          <span className="mt-1 block font-bengali text-xs text-zinc-600">{emptyMessageBn}</span>
        ) : null}
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {rows.map((row) => {
        const labelInner = (
          <>
            <span className="font-medium text-zinc-100">{row.label}</span>
            {row.labelBn ? (
              <span className="mt-0.5 block font-bengali text-xs font-normal text-zinc-500">{row.labelBn}</span>
            ) : null}
          </>
        );

        return (
          <li key={row.key}>
            <div className="flex items-end justify-between gap-3 text-sm">
              {row.href ? (
                <Link href={row.href} className="min-w-0 hover:text-accent">
                  {labelInner}
                </Link>
              ) : (
                <div className="min-w-0">{labelInner}</div>
              )}
              <span className="shrink-0 tabular-nums text-zinc-400">
                {row.pct}%
                <span className="ml-1.5 text-xs text-zinc-600">({row.count})</span>
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800/90">
              <div
                className="h-full rounded-full bg-zinc-100 transition-[width] duration-300"
                style={{ width: `${Math.max(row.pct, row.count > 0 ? 3 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
