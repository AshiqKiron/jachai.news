"use client";

import type { MouseEvent } from "react";

type Props = {
  slug: string;
  titleBn: string;
  isPro: boolean;
  proKnown: boolean;
  followed: boolean;
  onToggleFollow: (slug: string) => void;
  onLockedClick: () => void;
  compact?: boolean;
};

export function StoryFollowButton({
  slug,
  titleBn,
  isPro,
  proKnown,
  followed,
  onToggleFollow,
  onLockedClick,
  compact,
}: Props) {
  const labelEn = followed ? "Following" : "Follow story";
  const labelBn = followed ? "ফলো করা" : "ফলো টপিক";

  function handleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!proKnown) return;
    if (!isPro) {
      onLockedClick();
      return;
    }
    onToggleFollow(slug);
  }

  const sizeClass = compact
    ? "px-3 py-1.5 text-xs"
    : "px-3.5 py-2 text-sm";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!proKnown}
      title={
        !proKnown
          ? "Checking Pro access…"
          : !isPro
            ? "Follow stories is a Shorup Pro feature"
            : followed
              ? `Unfollow: ${titleBn}`
              : `Follow for updates: ${titleBn}`
      }
      aria-pressed={followed}
      className={`relative z-20 shrink-0 rounded-full border font-medium font-bengali leading-snug transition disabled:cursor-wait disabled:opacity-70 ${sizeClass} ${
        followed
          ? "border-accent/40 bg-accent/15 text-accent dark:border-white/30 dark:bg-white/10 dark:text-neutral-50"
          : "border-zinc-800/80 bg-ink-900/70 text-zinc-100 shadow-sm shadow-black/10 hover:border-zinc-600 hover:bg-ink-900/90 hover:text-zinc-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 dark:shadow-black/30 dark:hover:border-neutral-400 dark:hover:bg-neutral-700"
      }`}
    >
      <span className="sr-only">{labelEn}</span>
      <span aria-hidden className="whitespace-nowrap">
        {labelBn}
      </span>
      {!compact ? (
        <span className="ml-1.5 hidden text-zinc-500 sm:inline" aria-hidden>
          · {labelEn}
        </span>
      ) : null}
    </button>
  );
}
