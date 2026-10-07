"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { HomeArchiveLink, HomeStoriesSectionTitle } from "@/components/HomeArchiveLink";
import { HomeTopicFilter } from "@/components/HomeTopicFilter";
import { PaywallModal } from "@/components/PaywallModal";
import { StoryFeedCard } from "@/components/StoryFeedCard";
import {
  isTopStoriesCacheFresh,
  mergeStoryLists,
  readTopStoriesCache,
  writeTopStoriesCache,
} from "@/lib/client-story-cache";
import { hydrateClientStories } from "@/lib/client-story-hydrate";
import { DEMO_STORIES, type Story } from "@/lib/demo-data";
import { readFollowedStorySlugs, toggleStoryFollowed } from "@/lib/followed-stories";
import { HOME_TOP_STORIES_LIMIT } from "@/lib/subscription-features";
import {
  storyMatchesTopic,
  visibleTopicIdsForStories,
  type StoryTopicId,
} from "@/lib/story-topics";

const INITIAL_STORIES = hydrateClientStories(DEMO_STORIES.slice(0, HOME_TOP_STORIES_LIMIT));

export function HomeStoryGridClient() {
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [activeTopicId, setActiveTopicId] = useState<StoryTopicId>("all");
  const [isPro, setIsPro] = useState(false);
  const [proKnown, setProKnown] = useState(false);
  const [followedSlugs, setFollowedSlugs] = useState<string[]>([]);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useLayoutEffect(() => {
    const cached = readTopStoriesCache();
    if (cached?.stories.length) {
      setStories(cached.stories);
    }
    setFollowedSlugs(readFollowedStorySlugs());
  }, []);

  useEffect(() => {
    const cached = readTopStoriesCache();
    if (cached && isTopStoriesCacheFresh(cached.fetchedAt)) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/feed/top?limit=${HOME_TOP_STORIES_LIMIT}`, {
          headers: cached?.fingerprint ? { "If-None-Match": `"${cached.fingerprint}"` } : undefined,
        });

        if (cancelled) return;

        if (response.status === 304) {
          if (cached) {
            writeTopStoriesCache(cached.stories);
          }
          return;
        }

        if (!response.ok) return;

        const payload = (await response.json()) as { stories?: Story[] };
        if (cancelled || !payload.stories?.length) return;

        const merged = cached ? mergeStoryLists(cached.stories, payload.stories) : payload.stories;
        writeTopStoriesCache(merged);
        setStories((prev) => {
          if (prev.length === merged.length && prev.every((s, i) => s.slug === merged[i]?.slug)) {
            const same = prev.every((s, i) => {
              const next = merged[i];
              return next && s.updatedAt === next.updatedAt && s.articles.length === next.articles.length;
            });
            if (same) return prev;
          }
          return merged;
        });
      } catch {
        /* keep demo / cached feed */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/me/pro");
        if (!response.ok || cancelled) return;
        const payload = (await response.json()) as { isPro?: boolean };
        if (cancelled) return;
        setIsPro(Boolean(payload.isPro));
      } catch {
        /* treat as non-Pro */
      } finally {
        if (!cancelled) setProKnown(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleTopicIds = useMemo(() => visibleTopicIdsForStories(stories), [stories]);

  const filteredStories = useMemo(
    () => stories.filter((story) => storyMatchesTopic(story, activeTopicId)),
    [stories, activeTopicId],
  );

  const followedSet = useMemo(() => new Set(followedSlugs), [followedSlugs]);

  const handleToggleFollow = useCallback((slug: string) => {
    setFollowedSlugs(toggleStoryFollowed(slug));
  }, []);

  const topicFilterProps = {
    activeTopicId,
    visibleTopicIds,
    onSelect: setActiveTopicId,
  };

  return (
    <>
    <section className="lg:grid lg:grid-cols-[minmax(0,1fr)_11.5rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_13rem] xl:gap-10">
      <div className="min-w-0 space-y-10">
        <div className="lg:hidden">
          <HomeTopicFilter {...topicFilterProps} layout="horizontal" />
        </div>

        <div>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <HomeStoriesSectionTitle />
            <HomeArchiveLink />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredStories.map((story) => (
              <StoryFeedCard
                key={story.slug}
                variant="home"
                story={story}
                isPro={isPro}
                proKnown={proKnown}
                followed={followedSet.has(story.slug)}
                onToggleFollow={handleToggleFollow}
                onFollowLocked={() => setPaywallOpen(true)}
              />
            ))}
          </div>
          {filteredStories.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              No stories in this topic yet.{" "}
              <span className="font-bengali">এই টপিকে এখনো কোনো খবর নেই।</span>
            </p>
          ) : null}
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-[4.5rem]">
          <HomeTopicFilter {...topicFilterProps} layout="sidebar" />
        </div>
      </aside>
    </section>

    <PaywallModal
      open={paywallOpen}
      onClose={() => setPaywallOpen(false)}
      featureId="follow_story"
    />
    </>
  );
}
