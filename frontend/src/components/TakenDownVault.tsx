import { hasBengaliScript } from "@/lib/mixed-script-text";
import {
  removalLineBn,
  removalLineEn,
  saidAtLineBn,
  saidAtLineEn,
  takenDownArticles,
  type TakenDownFields,
} from "@/lib/taken-down";

type VaultArticle = TakenDownFields & {
  sourceName: string;
  url: string;
};

type Props = {
  articles: VaultArticle[];
  /** Original headline and text. Free readers see the removal line only. */
  showOriginal: boolean;
  onLockedClick: () => void;
};

/** The pulled page, kept. The removal line is the card; the wording is Pro. */
export function TakenDownVault({ articles, showOriginal, onLockedClick }: Props) {
  const removed = takenDownArticles(articles);
  if (removed.length === 0) return null;

  return (
    <div className="space-y-4" aria-label="Taken-down vault">
      {removed.map((article) => {
        const removedAt = article.removedAt;
        if (!removedAt) return null;
        const headlineLang = hasBengaliScript(article.headline) ? "bn" : "en";
        return (
          <article
            key={`${article.sourceName}-${article.url}`}
            className="rounded-xl border border-amber-300/90 bg-amber-50 px-4 py-4 dark:border-amber-400/40 dark:bg-amber-500/10 sm:px-5 sm:py-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
              <span className="font-bengali normal-case tracking-normal text-sm font-semibold">
                সরিয়ে নেওয়া হয়েছে
              </span>
              <span className="text-amber-700/80 dark:text-amber-100/70"> · {article.sourceName}</span>
            </p>
            <p className="mt-2 font-display text-2xl leading-snug tracking-tight text-amber-950 dark:text-amber-50 sm:text-3xl">
              {removalLineEn(removedAt)}
            </p>
            <p className="mt-1 font-bengali text-base text-amber-900/90 dark:text-amber-100/85">
              {removalLineBn(removedAt)}
            </p>

            {showOriginal ? (
              <div className="mt-4 border-t border-amber-200/90 pt-4 dark:border-amber-300/20">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                  <span className="font-bengali normal-case tracking-normal text-sm font-semibold">
                    যা লেখা ছিল
                  </span>
                  <span className="text-amber-700/80 dark:text-amber-100/70"> · Pro</span>
                </p>
                <p className="mt-2 font-display text-xl leading-snug text-amber-950 dark:text-amber-50">
                  {saidAtLineEn(article.publishedAt)}
                </p>
                <p className="mt-1 font-bengali text-sm text-amber-900/90 dark:text-amber-100/80">
                  {saidAtLineBn(article.publishedAt)}
                </p>
                <h2
                  lang={headlineLang}
                  className="story-title-bn mt-4 text-xl leading-snug text-amber-950 dark:text-amber-50 sm:text-2xl"
                >
                  {article.headline}
                </h2>
                {article.excerpt ? (
                  <p className="mt-3 text-base leading-relaxed text-amber-950/95 dark:text-amber-50/95">
                    {article.excerpt}
                  </p>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={onLockedClick}
                aria-haspopup="dialog"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-400/80 bg-white/80 px-3 py-1 text-xs font-medium text-amber-950 transition hover:border-amber-500 hover:bg-white dark:border-amber-300/40 dark:bg-amber-950/40 dark:text-amber-50 dark:hover:bg-amber-950/70"
              >
                <span className="font-bengali">যা লেখা ছিল দেখুন</span>
                <span className="text-amber-800/75 dark:text-amber-100/70">· Pro</span>
                <span className="sr-only">See the original headline and text</span>
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
