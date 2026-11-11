"use client";

import type { ArticleWithSource } from "@/lib/coverage";
import {
  analyzeUnnamedSource,
  unnamedSourceCountBn,
  unnamedSourceCountEn,
} from "@/lib/unnamed-source";

type Props = {
  articles: ArticleWithSource[];
  isPro: boolean;
  proKnown: boolean;
  onLockedClick: () => void;
};

/** Story-page count when outlets attribute a story to someone they don't name. Who hid it is Pro. */
export function UnnamedSourceReveal({ articles, isPro, proKnown, onLockedClick }: Props) {
  const analysis = analyzeUnnamedSource(
    articles.map((article) => ({
      sourceName: article.sourceName,
      headline: article.headline,
      excerpt: article.excerpt,
    })),
  );
  if (!analysis) return null;

  const countEn = unnamedSourceCountEn(analysis);
  const countBn = unnamedSourceCountBn(analysis);
  const showNames = proKnown && isPro;

  return (
    <section
      className="rounded-lg border border-teal-300/80 bg-teal-50 px-3 py-2.5 dark:border-teal-400/35 dark:bg-teal-500/10"
      aria-label="Unnamed source"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200">
        <span className="font-bengali normal-case tracking-normal text-sm font-semibold">
          নামহীন সূত্র
        </span>
        <span className="text-teal-700/80 dark:text-teal-100/70"> · Unnamed source</span>
      </p>
      <p className="mt-1 font-display text-lg leading-snug tracking-tight text-teal-950 dark:text-teal-50">
        {countEn}
      </p>
      <p className="font-bengali text-sm text-teal-900/90 dark:text-teal-100/80">{countBn}</p>

      {showNames ? (
        <div className="mt-2.5 space-y-2.5 border-t border-teal-200/90 pt-2.5 dark:border-teal-300/20">
          <OutletGroup labelBn="নাম লুকিয়েছে" labelEn="Hid the name" outlets={analysis.hidName} />
          {analysis.printedName.length > 0 ? (
            <OutletGroup
              labelBn="নাম ছাপিয়েছে"
              labelEn="Printed a name"
              outlets={analysis.printedName}
            />
          ) : (
            <p className="text-sm leading-snug text-teal-950 dark:text-teal-50">
              <span className="font-bengali">কোনো আউটলেট নাম ছাপেনি।</span>
              <span className="text-teal-900/80 dark:text-teal-100/75"> · No outlet printed a name.</span>
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onLockedClick}
          disabled={!proKnown}
          aria-haspopup="dialog"
          title={
            proKnown
              ? "Which papers hid the name is a khatinews Pro feature"
              : "Checking Pro access…"
          }
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-teal-400/70 bg-white/80 px-3 py-1 text-xs font-medium text-teal-950 transition hover:border-teal-500 hover:bg-white disabled:cursor-wait disabled:opacity-70 dark:border-teal-300/40 dark:bg-teal-950/40 dark:text-teal-50 dark:hover:bg-teal-950/70"
        >
          <span className="font-bengali">কোন কাগজ নাম লুকিয়েছে</span>
          <span className="text-teal-800/75 dark:text-teal-100/70">· Pro</span>
          <span className="sr-only">See which papers hid the name</span>
        </button>
      )}
    </section>
  );
}

function OutletGroup({
  labelBn,
  labelEn,
  outlets,
}: {
  labelBn: string;
  labelEn: string;
  outlets: string[];
}) {
  return (
    <div>
      <p className="text-sm leading-snug text-teal-800 dark:text-teal-200">
        <span className="font-bengali font-semibold">{labelBn}</span>
        <span className="text-teal-700/80 dark:text-teal-100/70"> · {labelEn}</span>
      </p>
      <ul className="mt-1 space-y-0.5">
        {outlets.map((outlet) => (
          <li key={outlet} className="text-sm leading-snug text-teal-950 dark:text-teal-50">
            {outlet}
          </li>
        ))}
      </ul>
    </div>
  );
}
