import { HOME_STORY_TOPICS, type StoryTopicId } from "@/lib/story-topics";

const STORAGE_KEY = "shorup_followed_topic_ids_v1";

export type FollowableTopicId = Exclude<StoryTopicId, "all">;

const VALID_IDS = new Set<FollowableTopicId>(HOME_STORY_TOPICS.map((t) => t.id));

function parseIds(raw: unknown): FollowableTopicId[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is FollowableTopicId =>
      typeof item === "string" && VALID_IDS.has(item as FollowableTopicId),
  );
}

function readRaw(): FollowableTopicId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return parseIds(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function writeRaw(ids: FollowableTopicId[]): void {
  if (typeof window === "undefined") return;
  const unique = [...new Set(ids)].filter((id) => VALID_IDS.has(id));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
}

export function readFollowedTopicIds(): FollowableTopicId[] {
  return readRaw();
}

export function isTopicFollowed(topicId: FollowableTopicId): boolean {
  return readRaw().includes(topicId);
}

export function setTopicFollowed(topicId: FollowableTopicId, followed: boolean): FollowableTopicId[] {
  const current = new Set(readRaw());
  if (followed) current.add(topicId);
  else current.delete(topicId);
  const next = [...current];
  writeRaw(next);
  return next;
}

export function toggleTopicFollowed(topicId: FollowableTopicId): FollowableTopicId[] {
  return setTopicFollowed(topicId, !isTopicFollowed(topicId));
}

/** Demo tab on profile — illustrative follows, not persisted. */
export const DEMO_FOLLOWED_TOPIC_IDS: FollowableTopicId[] = ["politics", "economy"];
