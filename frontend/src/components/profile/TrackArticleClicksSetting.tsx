"use client";

import { useState } from "react";

import { PaywallModal } from "@/components/PaywallModal";
import {
  readTrackArticleClicksEnabled,
  setTrackArticleClicksEnabled,
} from "@/lib/track-article-clicks-pref";

type Props = {
  isPro: boolean;
  proKnown: boolean;
  onChange?: (enabled: boolean) => void;
};

export function TrackArticleClicksSetting({ isPro, proKnown, onChange }: Props) {
  const [enabled, setEnabled] = useState(() => readTrackArticleClicksEnabled());
  const [paywallOpen, setPaywallOpen] = useState(false);

  function handleToggle(next: boolean) {
    if (!proKnown) return;
    if (!isPro) {
      setPaywallOpen(true);
      return;
    }
    setTrackArticleClicksEnabled(next);
    setEnabled(next);
    onChange?.(next);
  }

  return (
    <>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-ink-900/40 px-4 py-3.5">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600 bg-ink-950 text-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
          checked={isPro && enabled}
          disabled={!proKnown}
          onChange={(event) => handleToggle(event.target.checked)}
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-zinc-100">
            Track clicks to determine which articles users are reading
          </span>
          <span className="mt-1 block font-bengali text-sm leading-snug text-zinc-400">
            কোন আউটলেটের লিংকে ক্লিক করেছেন তা ট্র্যাক করে &quot;My News Bias&quot; তে
            আর্টিকেল হিসাব দেখায়। শুধু এই ডিভাইসে সংরক্ষিত; Shorup Pro প্রয়োজন।
          </span>
          {!proKnown ? (
            <span className="mt-2 block text-xs text-zinc-500">Checking Pro access…</span>
          ) : !isPro ? (
            <span className="mt-2 block text-xs text-zinc-500">Shorup Pro feature</span>
          ) : null}
        </span>
      </label>
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        featureId="track_article_clicks"
      />
    </>
  );
}
