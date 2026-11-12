"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { storyShareCardPath } from "@/lib/story-share-card";
import { WALKBACK_PREVIEW_SLUG } from "@/lib/walkback-line";

type Props = {
  slug: string;
  sentence: string;
  isPro: boolean;
  proKnown: boolean;
};

/** Pro shares lead with the buried line; free readers see what the card would carry. */
export function WalkbackShareTeaser({ slug, sentence, isPro, proKnown }: Props) {
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const showLiveCard = isPro || slug === WALKBACK_PREVIEW_SLUG;

  useEffect(() => {
    if (!showLiveCard || !proKnown) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    void (async () => {
      try {
        const response = await fetch(storyShareCardPath(slug), { credentials: "same-origin" });
        if (!response.ok || cancelled) return;
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setCardUrl(objectUrl);
      } catch {
        /* optional preview */
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [slug, showLiveCard, proKnown]);

  return (
    <section
      className="rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3.5 dark:border-amber-400/35 dark:bg-amber-500/10"
      aria-label="Walk-back share card"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
        <span className="font-bengali normal-case tracking-normal text-sm font-semibold">
          শেয়ার কার্ডে এই বাক্য
        </span>
        <span className="text-amber-800/80 dark:text-amber-100/70"> · Pro share card</span>
      </p>
      <p className="mt-1 text-sm text-amber-950/90 dark:text-amber-50/90">
        {showLiveCard
          ? "WhatsApp and the other networks send this square image when your browser can share a file."
          : "khatinews Pro puts the buried line on the share card, so forwards carry the hedge—not only the scream."}
      </p>

      {cardUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob URL from share-card API
        <img
          src={cardUrl}
          alt=""
          className="mt-3 w-full max-w-sm rounded-lg border border-amber-200/90 shadow-sm dark:border-amber-300/25"
        />
      ) : (
        <div className="mt-3 max-w-sm overflow-hidden rounded-lg border border-amber-200/90 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 shadow-sm dark:border-amber-300/25">
          <div className="h-1.5 w-16 rounded bg-amber-400/90" />
          <p className="mt-3 text-xs font-semibold text-amber-400">শিরোনামের নিচের বাক্য</p>
          <p className="story-title-bn mt-2 text-sm leading-relaxed text-slate-50">{sentence}</p>
          <p className="mt-4 text-[10px] text-slate-500">khatinews.com</p>
        </div>
      )}

      {!isPro && proKnown ? (
        <p className="mt-3 text-sm text-amber-950 dark:text-amber-50">
          <Link href="/pro" className="font-medium text-amber-900 underline decoration-amber-600/60 underline-offset-2 dark:text-amber-100">
            Go Pro
          </Link>
          <span className="text-amber-900/80 dark:text-amber-100/75">
            {" "}
            to send this line on the card.
          </span>
        </p>
      ) : null}
    </section>
  );
}
