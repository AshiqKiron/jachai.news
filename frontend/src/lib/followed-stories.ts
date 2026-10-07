const STORAGE_KEY = "shorup_followed_story_slugs_v1";

function readRaw(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
  } catch {
    return [];
  }
}

function writeRaw(slugs: string[]): void {
  if (typeof window === "undefined") return;
  const unique = [...new Set(slugs)];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
}

export function readFollowedStorySlugs(): string[] {
  return readRaw();
}

export function isStoryFollowed(slug: string): boolean {
  return readRaw().includes(slug);
}

export function setStoryFollowed(slug: string, followed: boolean): string[] {
  const current = new Set(readRaw());
  if (followed) current.add(slug);
  else current.delete(slug);
  const next = [...current];
  writeRaw(next);
  return next;
}

export function toggleStoryFollowed(slug: string): string[] {
  const followed = isStoryFollowed(slug);
  return setStoryFollowed(slug, !followed);
}
