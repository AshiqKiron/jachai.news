import Link from "next/link";

import type { Cluster } from "@/lib/api";

type Props = {
  cluster: Cluster;
};

export function HeadlineClashCard({ cluster }: Props) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-ink-900/60 p-5 shadow-lg shadow-black/20">
      <p className="text-xs uppercase tracking-widest text-zinc-500">Headline clash</p>
      <h2 className="mt-2 font-display text-lg leading-snug text-zinc-50">
        <Link href={`/story/${cluster.slug}`}>{cluster.title}</Link>
      </h2>
      {cluster.summary ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{cluster.summary}</p>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">Multiple outlets, different angles — open to compare.</p>
      )}
    </article>
  );
}
