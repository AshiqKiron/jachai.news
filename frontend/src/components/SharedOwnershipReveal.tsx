"use client";

import type { ArticleWithSource } from "@/lib/coverage";
import {
  analyzeSharedOwnership,
  sharedOwnershipCountBn,
  sharedOwnershipCountEn,
} from "@/lib/shared-ownership";

type Props = {
  articles: ArticleWithSource[];
  isPro: boolean;
  proKnown: boolean;
  onLockedClick: () => void;
};

const linkClass =
  "font-medium text-sky-950 underline decoration-sky-400/80 underline-offset-2 hover:text-sky-800 dark:text-sky-50 dark:decoration-sky-300/50 dark:hover:text-white";

/** Story-page count when outlets share an owner or parent. Names are Pro. */
export function SharedOwnershipReveal({ articles, isPro, proKnown, onLockedClick }: Props) {
  const analysis = analyzeSharedOwnership(
    articles.map((article) => ({
      sourceName: article.sourceName,
      mediaOwnership: article.mediaOwnership,
    })),
  );
  if (!analysis) return null;

  const countEn = sharedOwnershipCountEn(analysis);
  const countBn = sharedOwnershipCountBn(analysis);
  const showNames = proKnown && isPro;

  return (
    <section
      className="rounded-lg border border-sky-300/80 bg-sky-50 px-3 py-2.5 dark:border-sky-400/35 dark:bg-sky-500/10"
      aria-label="Shared ownership"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-200">
        <span className="font-bengali normal-case tracking-normal text-sm font-semibold">
          একই মালিকানা
        </span>
        <span className="text-sky-700/80 dark:text-sky-100/70"> · Shared ownership</span>
      </p>
      <p className="mt-1 font-display text-xl tracking-tight text-sky-950 dark:text-sky-50">
        {countEn}
      </p>
      <p className="font-bengali text-sm text-sky-900/90 dark:text-sky-100/80">{countBn}</p>

      {showNames ? (
        <ul className="mt-2.5 space-y-2 border-t border-sky-200/90 pt-2.5 dark:border-sky-300/20">
          {analysis.groups.map((group) => (
            <li key={group.key} className="text-sm leading-snug text-sky-950 dark:text-sky-50">
              {group.url ? (
                <a href={group.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {group.label}
                </a>
              ) : (
                <span className="font-medium">{group.label}</span>
              )}
              <span className="text-sky-900/80 dark:text-sky-100/75"> — {group.outlets.join(", ")}</span>
            </li>
          ))}
        </ul>
      ) : (
        <button
          type="button"
          onClick={onLockedClick}
          disabled={!proKnown}
          aria-haspopup="dialog"
          title={proKnown ? "Owner names are a khatinews Pro feature" : "Checking Pro access…"}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-sky-400/70 bg-white/80 px-3 py-1 text-xs font-medium text-sky-950 transition hover:border-sky-500 hover:bg-white disabled:cursor-wait disabled:opacity-70 dark:border-sky-300/40 dark:bg-sky-950/40 dark:text-sky-50 dark:hover:bg-sky-950/70"
        >
          <span className="font-bengali">মালিকের নাম দেখুন</span>
          <span className="text-sky-800/75 dark:text-sky-100/70">· Pro</span>
          <span className="sr-only">See owner names</span>
        </button>
      )}
    </section>
  );
}
