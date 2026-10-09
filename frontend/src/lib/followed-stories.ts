export const FOLLOWED_STORIES_CHANGED_EVENT = "shorup:followed-stories-changed";

const STORAGE_KEY_V2 = "shorup_followed_stories_v2";
const LEGACY_STORAGE_KEY = "shorup_followed_story_slugs_v1";

export type FollowedStoryRecord = {
  slug: string;
  titleBn?: string;
};

function storageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function dispatchChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FOLLOWED_STORIES_CHANGED_EVENT));
}

function readLegacySlugs(): string[] {
  if (!storageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
  } catch {
    return [];
  }
}

function readRecordsRaw(): FollowedStoryRecord[] {
  if (!storageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V2);
    if (!raw) {
      const legacy = readLegacySlugs();
      if (legacy.length === 0) return [];
      const migrated = legacy.map((slug) => ({ slug }));
      writeRecordsRaw(migrated);
      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return migrated;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const records: FollowedStoryRecord[] = [];
    for (const item of parsed) {
      if (typeof item === "string" && item.length > 0) {
        records.push({ slug: item });
        continue;
      }
      if (item && typeof item === "object" && "slug" in item) {
        const slug = (item as { slug: unknown }).slug;
        if (typeof slug !== "string" || slug.length === 0) continue;
        const titleBn = (item as { titleBn?: unknown }).titleBn;
        records.push({
          slug,
          titleBn: typeof titleBn === "string" && titleBn.length > 0 ? titleBn : undefined,
        });
      }
    }
    return dedupeRecords(records);
  } catch {
    return [];
  }
}

function dedupeRecords(records: FollowedStoryRecord[]): FollowedStoryRecord[] {
  const bySlug = new Map<string, FollowedStoryRecord>();
  for (const record of records) {
    const prev = bySlug.get(record.slug);
    if (!prev) {
      bySlug.set(record.slug, record);
      continue;
    }
    bySlug.set(record.slug, {
      slug: record.slug,
      titleBn: record.titleBn ?? prev.titleBn,
    });
  }
  return [...bySlug.values()];
}

function writeRecordsRaw(records: FollowedStoryRecord[]): void {
  if (!storageAvailable()) return;
  const next = dedupeRecords(records);
  window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(next));
  dispatchChanged();
}

export function readFollowedStories(): FollowedStoryRecord[] {
  return readRecordsRaw();
}

export function readFollowedStorySlugs(): string[] {
  return readRecordsRaw().map((record) => record.slug);
}

export function isStoryFollowed(slug: string): boolean {
  return readRecordsRaw().some((record) => record.slug === slug);
}

export function setStoryFollowed(slug: string, followed: boolean, titleBn?: string): string[] {
  const current = readRecordsRaw();
  const without = current.filter((record) => record.slug !== slug);
  if (!followed) {
    writeRecordsRaw(without);
    return without.map((record) => record.slug);
  }
  const prev = current.find((record) => record.slug === slug);
  const nextRecord: FollowedStoryRecord = {
    slug,
    titleBn: titleBn ?? prev?.titleBn,
  };
  writeRecordsRaw([nextRecord, ...without]);
  return readFollowedStorySlugs();
}

export function toggleStoryFollowed(slug: string, titleBn?: string): string[] {
  const followed = isStoryFollowed(slug);
  return setStoryFollowed(slug, !followed, titleBn);
}
