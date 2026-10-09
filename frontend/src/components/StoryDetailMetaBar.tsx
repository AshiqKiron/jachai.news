"use client";

import Link from "next/link";
import { useMemo } from "react";

import { StoryFollowButton } from "@/components/StoryFollowButton";
import { StoryShareBar } from "@/components/StoryShareBar";
import { coverageStats, storyPublishedIso } from "@/lib/coverage";
import type { Story } from "@/lib/demo-data";
import { formatRelativeTimeEn } from "@/lib/relative-time";
import { topicIdForStory, topicMetaForStory } from "@/lib/story-topics";

type FollowProps = {
  slug: string;
  titleBn: string;
  isPro: boolean;
  proKnown: boolean;
  followed: boolean;
  onToggleFollow: (slug: string) => void;
  onLockedClick: () => void;
};

type Props = FollowProps & {
  story: Story;
  shareTitle: string;
};

function MetaBullet() {
  return (
    <span className="text-zinc-600" aria-hidden>
      {" "}
      ·{" "}
    </span>
  );
}

export function StoryDetailMetaBar({
  story,
  slug,
  shareTitle,
  titleBn,
  isPro,
  proKnown,
  followed,
  onToggleFollow,
  onLockedClick,
}: Props) {
  const topic = topicMetaForStory(story);
  const topicId = topicIdForStory(story);

  const publishedIso = useMemo(() => storyPublishedIso(story), [story]);

  const publishedLabel = useMemo(
    () => formatRelativeTimeEn(publishedIso),
    [publishedIso],
  );

  const updatedIso = useMemo(() => {
    const stats = coverageStats(story);
    return stats?.lastUpdatedIso ?? story.updatedAt;
  }, [story]);

  const updatedLabel = useMemo(
    () => formatRelativeTimeEn(updatedIso),
    [updatedIso],
  );

  return (
    <div className="flex flex-col gap-3 border-y border-zinc-800/80 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-xs leading-relaxed text-zinc-400">
        <span>
          Published{" "}
          <time dateTime={publishedIso}>{publishedLabel}</time>
        </span>
        <MetaBullet />
        <Link
          href={`/?topic=${topicId}`}
          className="text-zinc-200 underline decoration-zinc-600 underline-offset-2 transition hover:text-white hover:decoration-zinc-400"
        >
          <span className="font-bengali">{topic.labelBn}</span>
          <span className="sr-only"> ({topic.labelEn})</span>
        </Link>
        <MetaBullet />
        <span>
          Updated <time dateTime={updatedIso}>{updatedLabel}</time>
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <StoryFollowButton
          slug={slug}
          titleBn={titleBn}
          isPro={isPro}
          proKnown={proKnown}
          followed={followed}
          onToggleFollow={onToggleFollow}
          onLockedClick={onLockedClick}
          compact
        />
        <StoryShareBar slug={slug} shareTitle={shareTitle} variant="detail" />
      </div>
    </div>
  );
}
