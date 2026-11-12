"use client";

import { ArticleImage } from "@/components/ArticleImage";
import { headlineEdits, type HeadlineEditView } from "@/lib/first-headline";
import type { StoryArticle } from "@/lib/demo-data";

type Props = {
  articles: StoryArticle[];
  isPro?: boolean;
  proKnown?: boolean;
  onLockedClick?: () => void;
  /** Home and story samples show the frozen share card without a Pro session. */
  showFrozenPreview?: boolean;
};

function ClockIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-12.25a.75.75 0 0 0-1.5 0V10c0 .2.08.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28V5.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SocialUnfurl({ edit }: { edit: HeadlineEditView }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950">
      {edit.previewImageUrl ? (
        <ArticleImage src={edit.previewImageUrl} alt="" className="aspect-[1.91/1] w-full object-cover" />
      ) : (
        <div className="flex aspect-[1.91/1] items-end bg-gradient-to-br from-zinc-800 to-zinc-950 p-3">
          <p className="story-title-bn text-sm leading-snug text-zinc-100">{edit.previewTitle}</p>
        </div>
      )}
      <div className="border-t border-zinc-800 px-3 py-2">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
          {edit.host || edit.sourceName}
          <span className="ml-2 normal-case tracking-normal text-zinc-400">Pro</span>
        </p>
        {edit.previewImageUrl ? (
          <p className="story-title-bn mt-1 text-sm leading-snug text-zinc-100">{edit.previewTitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function EditCard({
  edit,
  showPreview,
  proKnown,
  onLockedClick,
}: {
  edit: HeadlineEditView;
  showPreview: boolean;
  proKnown: boolean;
  onLockedClick?: () => void;
}) {
  const correctionBn = edit.correctionNoted ? "সংশোধনী আছে" : "সংশোধনী নেই";
  const correctionEn = edit.correctionNoted ? "Correction added" : "No correction";

  return (
    <section
      className="rounded-xl border border-rose-300/80 bg-rose-50 px-3 py-3 dark:border-rose-400/30 dark:bg-rose-500/10"
      aria-label="First headline"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-800 dark:text-rose-200">
        <span className="font-bengali normal-case tracking-normal text-sm font-semibold">প্রথম শিরোনাম</span>
        <span className="text-rose-700/80 dark:text-rose-100/70"> · First headline · {edit.sourceName}</span>
      </p>
      <div className={showPreview ? "mt-3 sm:grid sm:grid-cols-[11.5rem_minmax(0,1fr)] sm:gap-4" : "mt-3"}>
        {showPreview ? <SocialUnfurl edit={edit} /> : null}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-800 dark:text-rose-200">
            <span className="font-bengali normal-case tracking-normal text-sm">যা ছড়িয়েছিল</span>
            <span className="text-rose-700/80 dark:text-rose-100/70"> · What went out</span>
          </p>
          <p className="story-title-bn mt-1 text-base leading-snug text-rose-950 dark:text-rose-50">
            {edit.originalHeadline}
          </p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-rose-800/80 dark:text-rose-100/80">
            <span className="font-bengali normal-case tracking-normal text-sm">এখন পাতায়</span>
            <span> · On the page now</span>
          </p>
          <p className="story-title-bn mt-1 text-base leading-snug text-zinc-700 dark:text-zinc-300">
            {edit.currentHeadline}
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-rose-950 dark:text-rose-50">
            <ClockIcon />
            {edit.clock ? (
              <>
                <span className="font-bengali font-medium">{edit.clock.bn}</span>
                <span className="text-rose-800/80 dark:text-rose-100/70">{edit.clock.en}</span>
              </>
            ) : null}
            <span className="text-rose-800/60 dark:text-rose-100/50">·</span>
            <span className="font-bengali">{correctionBn}</span>
            <span className="text-rose-800/80 dark:text-rose-100/70">{correctionEn}</span>
          </p>
        </div>
      </div>
      {showPreview ? null : (
        <button
          type="button"
          onClick={onLockedClick}
          disabled={!proKnown}
          aria-haspopup="dialog"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-rose-400/70 bg-white/80 px-3 py-1 text-xs font-medium text-rose-950 transition hover:border-rose-500 hover:bg-white disabled:cursor-wait disabled:opacity-70 dark:border-rose-300/40 dark:bg-rose-950/40 dark:text-rose-50"
        >
          <span className="font-bengali">প্রথম শেয়ার কার্ড</span>
          <span className="text-rose-800/75 dark:text-rose-100/70">· Pro</span>
        </button>
      )}
    </section>
  );
}

export function FirstHeadlineCards({
  articles,
  isPro = false,
  proKnown = false,
  onLockedClick,
  showFrozenPreview = false,
}: Props) {
  const edits = headlineEdits(articles);
  if (edits.length === 0) return null;
  const showPreview = showFrozenPreview || (proKnown && isPro);

  return (
    <div className="space-y-3">
      {edits.map((edit) => (
        <EditCard
          key={edit.key}
          edit={edit}
          showPreview={showPreview}
          proKnown={proKnown}
          onLockedClick={onLockedClick}
        />
      ))}
    </div>
  );
}
