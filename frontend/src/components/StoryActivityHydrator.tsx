"use client";

import { useEffect } from "react";

import { FOLLOWED_STORIES_CHANGED_EVENT, readFollowedStories } from "@/lib/followed-stories";
import { hydrateFollowedStoriesFromServer } from "@/lib/story-activity-sync";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const STORAGE_KEY_V2 = "shorup_followed_stories_v2";

function writeFollowedRecords(records: ReturnType<typeof readFollowedStories>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent(FOLLOWED_STORIES_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

async function mergeFollowsFromServer(): Promise<void> {
  const local = readFollowedStories();
  const merged = await hydrateFollowedStoriesFromServer(local);
  const localSlugs = new Set(local.map((row) => row.slug));
  const hasNew = merged.some((row) => !localSlugs.has(row.slug));
  if (hasNew || merged.length !== local.length) {
    writeFollowedRecords(merged);
  }
}

/** Pull server-side follows after sign-in and on session refresh. */
export function StoryActivityHydrator() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    const run = () => {
      void mergeFollowsFromServer().catch(() => {
        /* ignore */
      });
    };

    run();
    const supabase = createBrowserSupabaseClient();
    const subscription = supabase?.auth.onAuthStateChange(() => {
      if (!cancelled) run();
    });

    return () => {
      cancelled = true;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  return null;
}
