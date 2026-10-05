"use client";

import { useEffect, useLayoutEffect, useState } from "react";

import { StoryFeedCard } from "@/components/StoryFeedCard";
import {
  isTopStoriesCacheFresh,
  mergeStoryLists,
  readTopStoriesCache,
  writeTopStoriesCache,
} from "@/lib/client-story-cache";
import { DEMO_STORIES, type Story } from "@/lib/demo-data";
import { HOME_TOP_STORIES_LIMIT } from "@/lib/subscription-features";

const INITIAL_STORIES = DEMO_STORIES.slice(0, HOME_TOP_STORIES_LIMIT);

export function HomeStoryGridClient() {
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);

  useLayoutEffect(() => {
    const cached = readTopStoriesCache();
    if (cached?.stories.length) {
      setStories(cached.stories);
    }
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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {stories.map((story) => (
        <StoryFeedCard key={story.slug} story={story} />
      ))}
    </div>
  );
}
