import { groupArticlesByPerspective } from "@/components/HeadlinesByPerspective";
import { PerspectiveSectionHeader } from "@/components/PerspectiveSectionHeader";
import { SourceOwnershipLine } from "@/components/SourceOwnershipLine";
import type { ArticleWithSource } from "@/lib/coverage";
import { PERSPECTIVE_META, type Perspective } from "@/lib/perspectives";

const PERSPECTIVE_ORDER: Perspective[] = (
  Object.keys(PERSPECTIVE_META) as Perspective[]
).sort((a, b) => PERSPECTIVE_META[a].order - PERSPECTIVE_META[b].order);

type Props = {
  articles: ArticleWithSource[];
};

export function CoverageSourcesByCategory({ articles }: Props) {
  const grouped = groupArticlesByPerspective(articles);
  const sections = PERSPECTIVE_ORDER.filter((perspective) => (grouped[perspective]?.length ?? 0) > 0);

  if (sections.length === 0) return null;

  return (
    <div className="mt-5 border-t border-zinc-800/80 pt-4">
      <h3 className="text-[11px] uppercase tracking-wide text-zinc-500">
        <span className="font-bengali normal-case">শ্রেণি অনুযায়ী উৎস</span> · Sources by category
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        কোন outlet কোন দিক থেকে এই খবর কভার করছে
      </p>

      <div className="mt-4 space-y-4">
        {sections.map((perspective) => {
          const meta = PERSPECTIVE_META[perspective];
          const items = grouped[perspective] ?? [];
          return (
            <div
              key={perspective}
              className="rounded-lg border border-zinc-800/90 bg-zinc-950/40"
              style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
            >
              <div className="border-b border-zinc-800/80 px-3 py-2.5 sm:px-4">
                <PerspectiveSectionHeader perspective={perspective} count={items.length} />
              </div>
              <ul className="divide-y divide-zinc-800/70">
                {items.map((article) => (
                  <li key={`${article.sourceId}-${article.url}`}>
                    <div className="px-3 py-2.5 transition hover:bg-zinc-800/40 sm:px-4">
                      <span className="text-sm font-medium text-zinc-100">{article.sourceName}</span>
                      <SourceOwnershipLine ownership={article.mediaOwnership} className="mt-0.5" />
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block text-sm leading-snug text-zinc-300 line-clamp-2 hover:text-zinc-100"
                      >
                        {article.headline}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
