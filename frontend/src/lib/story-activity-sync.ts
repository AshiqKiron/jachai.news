/**
 * Mirror Pro follow + reading signals to Supabase when the user is signed in.
 * Local storage remains the fast path for the profile UI; server rows enable alerts later.
 */

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { FollowedStoryRecord } from "@/lib/followed-stories";

async function currentUserId(): Promise<string | null> {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function fireAndForget(promise: Promise<unknown>): void {
  void promise.catch(() => {
    /* offline or RLS — local cache still works */
  });
}

export function syncStoryFollowToServer(slug: string, followed: boolean): void {
  fireAndForget(
    (async () => {
      const userId = await currentUserId();
      if (!userId) return;
      const supabase = createBrowserSupabaseClient();
      if (!supabase) return;
      if (followed) {
        await supabase.from("story_follows").upsert(
          { user_id: userId, cluster_slug: slug },
          { onConflict: "user_id,cluster_slug" },
        );
        return;
      }
      await supabase.from("story_follows").delete().eq("user_id", userId).eq("cluster_slug", slug);
    })(),
  );
}

export function syncStoryReadToServer(slug: string): void {
  fireAndForget(
    (async () => {
      const userId = await currentUserId();
      if (!userId) return;
      const supabase = createBrowserSupabaseClient();
      if (!supabase) return;
      await supabase.from("story_read_events").insert({
        user_id: userId,
        cluster_slug: slug,
      });
    })(),
  );
}

export function syncArticleClickToServer(input: {
  storySlug: string;
  url: string;
  sourceId: string;
}): void {
  fireAndForget(
    (async () => {
      const userId = await currentUserId();
      if (!userId) return;
      const supabase = createBrowserSupabaseClient();
      if (!supabase) return;
      await supabase.from("article_click_events").insert({
        user_id: userId,
        cluster_slug: input.storySlug,
        article_url: input.url,
        source_id: input.sourceId,
      });
    })(),
  );
}

/** Merge server follows into local records (union by slug). */
export async function hydrateFollowedStoriesFromServer(
  localRecords: FollowedStoryRecord[],
): Promise<FollowedStoryRecord[]> {
  const userId = await currentUserId();
  if (!userId) return localRecords;
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return localRecords;
  const { data, error } = await supabase
    .from("story_follows")
    .select("cluster_slug, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data?.length) return localRecords;

  const bySlug = new Map(localRecords.map((row) => [row.slug, row]));
  for (const row of data) {
    if (!bySlug.has(row.cluster_slug)) {
      bySlug.set(row.cluster_slug, { slug: row.cluster_slug });
    }
  }
  return [...bySlug.values()];
}
