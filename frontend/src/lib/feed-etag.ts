import type { Story } from "@/lib/demo-data";
import { storiesListFingerprint, storyFingerprint } from "@/lib/client-story-cache";

export function etagForStories(stories: Story[]): string {
  return `"${storiesListFingerprint(stories)}"`;
}

export function etagForStory(story: Story): string {
  return `"${storyFingerprint(story)}"`;
}

export function ifNoneMatchMatches(header: string | null, etag: string): boolean {
  if (!header) return false;
  const trimmed = header.trim();
  if (trimmed === "*") return true;
  return trimmed.split(/\s*,\s*/).some((part) => part === etag);
}
