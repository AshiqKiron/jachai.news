import type { Story } from "@/lib/demo-data";
import { hydrateClientStories, hydrateClientStory } from "@/lib/client-story-hydrate";

const TOP_STORIES_KEY = "shorup:top-stories:v3";
const LEGACY_TOP_STORIES_KEY = "shorup:top-stories:v2";
const STORY_KEY_PREFIX = "shorup:story:v1:";
const TOP_FETCHED_AT_KEY = "shorup:top-stories-fetched-at:v1";

/** Align with home feed `Cache-Control` / server revalidate. */
export const CLIENT_FEED_STALE_MS = 30_000;

type TopStoriesCache = {
  stories: Story[];
  fingerprint: string;
  fetchedAt: number;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function storyFingerprint(story: Story): string {
  const articleSig = story.articles
    .map((a) => `${a.url}:${a.publishedAt}:${a.perspective ?? ""}`)
    .sort()
    .join("|");
  const perspectiveSig = Object.keys(story.perspectiveSummaries).sort().join(",");
  return `${story.slug}:${story.updatedAt}:${story.title}:${story.titleBn}:${story.articles.length}:${articleSig}:${perspectiveSig}`;
}

export function storiesListFingerprint(stories: Story[]): string {
  return stories.map((s) => storyFingerprint(s)).join(";");
}

function readRawTopStoriesCache(key: string): TopStoriesCache | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TopStoriesCache;
    if (!Array.isArray(parsed.stories) || typeof parsed.fingerprint !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readTopStoriesCache(): TopStoriesCache | null {
  const current = readRawTopStoriesCache(TOP_STORIES_KEY);
  if (current) {
    return {
      ...current,
      stories: hydrateClientStories(current.stories),
    };
  }

  const legacy = readRawTopStoriesCache(LEGACY_TOP_STORIES_KEY);
  if (!legacy) return null;

  const stories = hydrateClientStories(legacy.stories);
  writeTopStoriesCache(stories);
  try {
    localStorage.removeItem(LEGACY_TOP_STORIES_KEY);
  } catch {
    /* ignore */
  }
  return {
    stories,
    fingerprint: storiesListFingerprint(stories),
    fetchedAt: legacy.fetchedAt,
  };
}

export function writeTopStoriesCache(stories: Story[]): void {
  if (!canUseStorage() || stories.length === 0) return;
  try {
    const hydrated = hydrateClientStories(stories);
    const payload: TopStoriesCache = {
      stories: hydrated,
      fingerprint: storiesListFingerprint(hydrated),
      fetchedAt: Date.now(),
    };
    localStorage.setItem(TOP_STORIES_KEY, JSON.stringify(payload));
    localStorage.setItem(TOP_FETCHED_AT_KEY, String(payload.fetchedAt));
  } catch {
    /* quota / private mode */
  }
}

export function isTopStoriesCacheFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < CLIENT_FEED_STALE_MS;
}

export function readStoryCache(slug: string): Story | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(`${STORY_KEY_PREFIX}${slug}`);
    if (!raw) return null;
    return hydrateClientStory(JSON.parse(raw) as Story);
  } catch {
    return null;
  }
}

export function writeStoryCache(story: Story): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(`${STORY_KEY_PREFIX}${story.slug}`, JSON.stringify(hydrateClientStory(story)));
  } catch {
    /* quota / private mode */
  }
}

/** Merge API feed into cache: prefer incoming fields; keep articles when API row is empty. */
export function mergeStoryLists(cached: Story[], incoming: Story[]): Story[] {
  const bySlug = new Map(cached.map((s) => [s.slug, s]));
  return incoming.map((next) => {
    const prev = bySlug.get(next.slug);
    const merged =
      prev && next.articles.length === 0 && prev.articles.length > 0
        ? { ...prev, ...next, articles: prev.articles }
        : prev
          ? { ...prev, ...next }
          : next;
    return hydrateClientStory(merged);
  });
}
