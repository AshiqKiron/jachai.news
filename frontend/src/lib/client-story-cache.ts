import type { Story } from "@/lib/demo-data";

const TOP_STORIES_KEY = "jachai:top-stories:v1";
const STORY_KEY_PREFIX = "jachai:story:v1:";
const TOP_FETCHED_AT_KEY = "jachai:top-stories-fetched-at:v1";

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
    .map((a) => `${a.url}:${a.publishedAt}`)
    .sort()
    .join("|");
  return `${story.slug}:${story.updatedAt}:${story.articles.length}:${articleSig}`;
}

export function storiesListFingerprint(stories: Story[]): string {
  return stories.map((s) => storyFingerprint(s)).join(";");
}

export function readTopStoriesCache(): TopStoriesCache | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(TOP_STORIES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TopStoriesCache;
    if (!Array.isArray(parsed.stories) || typeof parsed.fingerprint !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeTopStoriesCache(stories: Story[]): void {
  if (!canUseStorage() || stories.length === 0) return;
  try {
    const payload: TopStoriesCache = {
      stories,
      fingerprint: storiesListFingerprint(stories),
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
    return JSON.parse(raw) as Story;
  } catch {
    return null;
  }
}

export function writeStoryCache(story: Story): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(`${STORY_KEY_PREFIX}${story.slug}`, JSON.stringify(story));
  } catch {
    /* quota / private mode */
  }
}

/** Merge API feed into cache: keep unchanged rows, replace updates, apply new order. */
export function mergeStoryLists(cached: Story[], incoming: Story[]): Story[] {
  const bySlug = new Map(cached.map((s) => [s.slug, s]));
  return incoming.map((next) => {
    const prev = bySlug.get(next.slug);
    if (prev && storyFingerprint(prev) === storyFingerprint(next)) {
      return prev;
    }
    return next;
  });
}
