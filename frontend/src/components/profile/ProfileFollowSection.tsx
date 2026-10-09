"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PaywallModal } from "@/components/PaywallModal";
import { readStoryCache, readTopStoriesCache } from "@/lib/client-story-cache";
import {
  BD_FOLLOW_PEOPLE,
  DEMO_FOLLOWED_PEOPLE_IDS,
  readFollowedPeopleIds,
  togglePersonFollowed,
} from "@/lib/follow-people";
import {
  DEMO_FOLLOWED_TOPIC_IDS,
  readFollowedTopicIds,
  toggleTopicFollowed,
  type FollowableTopicId,
} from "@/lib/followed-topics";
import { readFollowedStorySlugs, toggleStoryFollowed } from "@/lib/followed-stories";
import { DEMO_STORIES } from "@/lib/demo-data";
import { HOME_STORY_TOPICS } from "@/lib/story-topics";
import type { ProOnlyFeatureId } from "@/lib/subscription-features";

type Props = {
  demo: boolean;
  isPro: boolean;
  proKnown: boolean;
};

function followChipClass(following: boolean) {
  return following
    ? "border-accent/40 bg-accent/15 text-accent dark:border-white/30 dark:bg-white/10 dark:text-neutral-50"
    : "border-zinc-800 bg-ink-900/60 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100";
}

function FollowToggleButton({
  following,
  disabled,
  labelFollow,
  labelFollowing,
  onClick,
}: {
  following: boolean;
  disabled: boolean;
  labelFollow: string;
  labelFollowing: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={following}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium font-bengali transition disabled:cursor-wait disabled:opacity-70 ${followChipClass(following)}`}
    >
      {following ? labelFollowing : labelFollow}
    </button>
  );
}

export function ProfileFollowSection({ demo, isPro, proKnown }: Props) {
  const [followedSlugs, setFollowedSlugs] = useState<string[]>([]);
  const [followedTopicIds, setFollowedTopicIds] = useState<FollowableTopicId[]>([]);
  const [followedPeopleIds, setFollowedPeopleIds] = useState<string[]>([]);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<ProOnlyFeatureId>("follow_story");

  const refreshFollowState = useCallback(() => {
    if (demo) {
      setFollowedSlugs(DEMO_STORIES.slice(0, 2).map((s) => s.slug));
      setFollowedTopicIds(DEMO_FOLLOWED_TOPIC_IDS);
      setFollowedPeopleIds(DEMO_FOLLOWED_PEOPLE_IDS);
      return;
    }
    setFollowedSlugs(readFollowedStorySlugs());
    setFollowedTopicIds(readFollowedTopicIds());
    setFollowedPeopleIds(readFollowedPeopleIds());
  }, [demo]);

  useEffect(() => {
    refreshFollowState();
  }, [refreshFollowState]);

  useEffect(() => {
    if (demo) return;
    function onFocus() {
      refreshFollowState();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [demo, refreshFollowState]);

  const storyLabels = useMemo(() => {
    const top = readTopStoriesCache()?.stories ?? [];
    const bySlug = new Map(top.map((s) => [s.slug, s]));
    for (const story of DEMO_STORIES) {
      if (!bySlug.has(story.slug)) bySlug.set(story.slug, story);
    }
    return followedSlugs.map((slug) => {
      const cached = readStoryCache(slug) ?? bySlug.get(slug);
      return {
        slug,
        titleBn: cached?.titleBn ?? slug,
        titleEn: cached?.title ?? slug,
      };
    });
  }, [followedSlugs]);

  const requirePro = useCallback(
    (featureId: ProOnlyFeatureId, action: () => void) => {
      if (!proKnown) return;
      if (!isPro) {
        setPaywallFeature(featureId);
        setPaywallOpen(true);
        return;
      }
      action();
    },
    [isPro, proKnown],
  );

  const onToggleStory = (slug: string) => {
    requirePro("follow_story", () => setFollowedSlugs(toggleStoryFollowed(slug)));
  };

  const onToggleTopic = (topicId: FollowableTopicId) => {
    requirePro("custom_topic_radar_alerts", () => setFollowedTopicIds(toggleTopicFollowed(topicId)));
  };

  const onTogglePerson = (personId: string) => {
    requirePro("custom_topic_radar_alerts", () => setFollowedPeopleIds(togglePersonFollowed(personId)));
  };

  return (
    <>
      <section
        className="space-y-6 rounded-xl border border-zinc-800 bg-ink-950"
        aria-labelledby="profile-following-heading"
      >
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 id="profile-following-heading" className="text-base font-semibold text-zinc-50">
            Topics & people to follow
          </h2>
          <p className="text-sm text-zinc-400">Manage story, topic, and figure alerts on this device.</p>
          <p className="font-bengali text-xs text-zinc-500">টপিক ও ব্যক্তি ফলো — Pro-তে অ্যালার্ট (শীঘ্রই)</p>
        </div>

        <div className="space-y-5 px-4 pb-5">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">Stories you follow</h3>
              <p className="font-bengali text-xs text-zinc-600">ফলো করা খবর (ক্লাস্টার)</p>
            </div>
            {storyLabels.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Tap <span className="font-bengali text-zinc-400">ফলো টপিক</span> on home or story pages when you have
                Pro.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
                {storyLabels.map((row) => (
                  <li key={row.slug} className="flex items-center gap-3 px-3 py-2.5">
                    <Link
                      href={`/story/${row.slug}`}
                      className="min-w-0 flex-1 font-bengali text-sm text-zinc-100 hover:text-accent"
                    >
                      {row.titleBn}
                      <span className="mt-0.5 block truncate text-xs text-zinc-500">{row.titleEn}</span>
                    </Link>
                    {!demo ? (
                      <FollowToggleButton
                        following
                        disabled={!proKnown}
                        labelFollow="ফলো"
                        labelFollowing="আনফলো"
                        onClick={() => onToggleStory(row.slug)}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">Topics</h3>
              <p className="text-xs text-zinc-500">Home feed categories — radar alerts on Pro.</p>
              <p className="font-bengali text-xs text-zinc-600">টপিক · হোম ফিড বিভাগ</p>
            </div>
            <ul className="space-y-2">
              {HOME_STORY_TOPICS.map((topic) => {
                const following = followedTopicIds.includes(topic.id);
                return (
                  <li
                    key={topic.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800/80 bg-ink-900/40 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <Link href={`/?topic=${topic.id}`} className="text-sm font-medium text-zinc-100 hover:text-accent">
                        {topic.labelEn}
                      </Link>
                      <p className="font-bengali text-xs text-zinc-500">{topic.labelBn}</p>
                    </div>
                    {!demo ? (
                      <FollowToggleButton
                        following={following}
                        disabled={!proKnown}
                        labelFollow="ফলো"
                        labelFollowing="ফলো করা"
                        onClick={() => onToggleTopic(topic.id)}
                      />
                    ) : (
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-bengali ${followChipClass(following)}`}
                      >
                        {following ? "ফলো করা" : "ফলো"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">People</h3>
              <p className="text-xs text-zinc-500">Figures and editors we often see across outlets.</p>
              <p className="font-bengali text-xs text-zinc-600">ব্যক্তি · রাজনীতি ও মিডিয়া</p>
            </div>
            <ul className="space-y-2">
              {BD_FOLLOW_PEOPLE.map((person) => {
                const following = followedPeopleIds.includes(person.id);
                return (
                  <li
                    key={person.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800/80 bg-ink-900/40 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-100">{person.nameEn}</p>
                      <p className="font-bengali text-sm text-zinc-200">{person.nameBn}</p>
                      <p className="text-xs text-zinc-500">
                        {person.roleEn}
                        <span className="font-bengali text-zinc-600"> · {person.roleBn}</span>
                      </p>
                    </div>
                    {!demo ? (
                      <FollowToggleButton
                        following={following}
                        disabled={!proKnown}
                        labelFollow="ফলো"
                        labelFollowing="ফলো করা"
                        onClick={() => onTogglePerson(person.id)}
                      />
                    ) : (
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-bengali ${followChipClass(following)}`}
                      >
                        {following ? "ফলো করা" : "ফলো"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} featureId={paywallFeature} />
    </>
  );
}
