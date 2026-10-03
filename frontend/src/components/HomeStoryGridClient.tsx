"use client";

import { useEffect, useState } from "react";

import { StoryFeedCard } from "@/components/StoryFeedCard";
import { DEMO_STORIES, type Story } from "@/lib/demo-data";
import { FREE_DAILY_TOP_STORIES_LIMIT } from "@/lib/subscription-features";

const INITIAL_STORIES = DEMO_STORIES.slice(0, FREE_DAILY_TOP_STORIES_LIMIT);

export function HomeStoryGridClient() {
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/feed/top?limit=${FREE_DAILY_TOP_STORIES_LIMIT}`);
        if (!response.ok || cancelled) return;
        const payload = (await response.json()) as { stories?: Story[] };
        if (!cancelled && payload.stories?.length) {
          setStories(payload.stories);
        }
      } catch {
        /* keep demo feed */
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
