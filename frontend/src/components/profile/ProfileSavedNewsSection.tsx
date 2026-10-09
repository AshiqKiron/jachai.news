"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProfileProUpsell } from "@/components/profile/ProfileProUpsell";
import { readStoryCache, readTopStoriesCache } from "@/lib/client-story-cache";
import { hydrateClientStory } from "@/lib/client-story-hydrate";
import { DEMO_STORIES, type Story } from "@/lib/demo-data";
import {
  FOLLOWED_STORIES_CHANGED_EVENT,
  readFollowedStories,
  setStoryFollowed,
  type FollowedStoryRecord,
} from "@/lib/followed-stories";
import { readReadingHistory } from "@/lib/reading-history";

type Props = {
  isPro: boolean;
  proKnown: boolean;
};

type SavedRow = {
  slug: string;
  titleBn: string;
  titleEn?: string;
  sourceCount?: number;
};

function titleFromHistory(slug: string): string | undefined {
  const entry = readReadingHistory().storyReads.find((read) => read.slug === slug);
  return entry?.titleBn;
}

function storyFromLocalCaches(slug: string): Story | null {
  const cached = readStoryCache(slug);
  if (cached) return cached;

  const top = readTopStoriesCache()?.stories ?? [];
  const fromTop = top.find((story) => story.slug === slug);
  if (fromTop) return fromTop;

  const demo = DEMO_STORIES.find((story) => story.slug === slug);
  return demo ?? null;
}

function rowFromStory(story: Story): SavedRow {
  return {
    slug: story.slug,
    titleBn: story.titleBn,
    titleEn: story.title,
    sourceCount: story.articles.length,
  };
}

function rowFromRecord(record: FollowedStoryRecord): SavedRow {
  const cached = storyFromLocalCaches(record.slug);
  if (cached) return rowFromStory(cached);

  const titleBn = record.titleBn ?? titleFromHistory(record.slug) ?? record.slug;
  return { slug: record.slug, titleBn };
}

async function fetchStoryRow(slug: string): Promise<SavedRow | null> {
  try {
    const response = await fetch(`/api/story/${encodeURIComponent(slug)}`);
    if (!response.ok) return null;
    const payload = (await response.json()) as { story?: Story };
    if (!payload.story) return null;
    return rowFromStory(hydrateClientStory(payload.story));
  } catch {
    return null;
  }
}

export function ProfileSavedNewsSection({ isPro, proKnown }: Props) {
  const [records, setRecords] = useState<FollowedStoryRecord[]>([]);
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshRecords = useCallback(() => {
    setRecords(readFollowedStories());
  }, []);

  useEffect(() => {
    refreshRecords();
    const onChanged = () => refreshRecords();
    window.addEventListener(FOLLOWED_STORIES_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(FOLLOWED_STORIES_CHANGED_EVENT, onChanged);
  }, [refreshRecords]);

  const slugsKey = useMemo(() => records.map((record) => record.slug).join("\0"), [records]);

  useEffect(() => {
    if (!isPro || records.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const initial = records.map((record) => rowFromRecord(record));
      if (!cancelled) setRows(initial);

      const resolved = await Promise.all(
        records.map(async (record) => {
          const local = storyFromLocalCaches(record.slug);
          if (local) return rowFromStory(local);
          const fetched = await fetchStoryRow(record.slug);
          if (fetched) return fetched;
          return rowFromRecord(record);
        }),
      );

      if (!cancelled) {
        setRows(resolved);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPro, slugsKey, records]);

  if (!proKnown) {
    return null;
  }

  if (!isPro) {
    return (
      <ProfileProUpsell
        titleEn="Saved news"
        titleBn="সংরক্ষিত খবর"
        bodyEn="Follow stories on home or story pages with Shorup Pro — they’ll show up here for quick access."
        bodyBn="Pro-তে খবর ফলো করুন — এখানে দ্রুত খুঁজে পাবেন"
      />
    );
  }

  return (
    <section className="space-y-3" aria-labelledby="saved-news-heading">
      <div>
        <h2 id="saved-news-heading" className="text-lg font-semibold text-zinc-100">
          Saved news
        </h2>
        <p className="font-bengali text-xs text-zinc-500">সংরক্ষিত খবর · stories you follow on this device</p>
      </div>

      {records.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
          No saved stories yet. Tap{" "}
          <span className="font-bengali text-zinc-400">ফলো টপিক</span> on a story to add it here.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800/90 bg-ink-900/40">
          {rows.map((row) => (
            <li key={row.slug} className="flex gap-3 px-4 py-3 sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/story/${row.slug}`}
                  className="story-title-bn block text-sm font-medium leading-snug text-zinc-100 hover:text-white"
                  lang="bn"
                >
                  {row.titleBn}
                </Link>
                {row.titleEn ? (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{row.titleEn}</p>
                ) : null}
                {typeof row.sourceCount === "number" ? (
                  <p className="mt-1 text-xs text-zinc-600">
                    {row.sourceCount} {row.sourceCount === 1 ? "source" : "sources"} · {row.sourceCount} উৎস
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setStoryFollowed(row.slug, false)}
                className="shrink-0 rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
              >
                Unfollow
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading && records.length > 0 ? (
        <p className="text-xs text-zinc-600" aria-live="polite">
          Refreshing story details…
        </p>
      ) : null}
    </section>
  );
}
