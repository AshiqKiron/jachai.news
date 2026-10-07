import type { Story } from "@/lib/demo-data";

/** Home feed topic filter ids (distinct from subscription matrix "category" rows). */
export type StoryTopicId = "all" | "news" | "economy" | "politics" | "environment" | "sports";

export type StoryTopic = {
  id: Exclude<StoryTopicId, "all">;
  labelEn: string;
  labelBn: string;
  /** Matches `Story.category` (English), case-insensitive. */
  categoryKeys: string[];
};

export const HOME_STORY_TOPICS: StoryTopic[] = [
  {
    id: "news",
    labelEn: "News",
    labelBn: "সংবাদ",
    categoryKeys: ["News", "General"],
  },
  {
    id: "economy",
    labelEn: "Economy",
    labelBn: "অর্থনীতি",
    categoryKeys: ["Economy", "Business", "Finance"],
  },
  {
    id: "politics",
    labelEn: "Politics",
    labelBn: "রাজনীতি",
    categoryKeys: ["Politics", "Election"],
  },
  {
    id: "environment",
    labelEn: "Environment",
    labelBn: "পরিবেশ",
    categoryKeys: ["Environment", "Climate"],
  },
  {
    id: "sports",
    labelEn: "Sports",
    labelBn: "খেলা",
    categoryKeys: ["Sports"],
  },
];

const TOPIC_BY_CATEGORY = new Map<string, Exclude<StoryTopicId, "all">>();

for (const topic of HOME_STORY_TOPICS) {
  for (const key of topic.categoryKeys) {
    TOPIC_BY_CATEGORY.set(key.toLowerCase(), topic.id);
  }
}

export function topicIdForStory(story: Story): Exclude<StoryTopicId, "all"> {
  const fromCategory = TOPIC_BY_CATEGORY.get(story.category.trim().toLowerCase());
  if (fromCategory) return fromCategory;
  const fromBn = HOME_STORY_TOPICS.find((t) => t.labelBn === story.categoryBn.trim())?.id;
  return fromBn ?? "news";
}

export function topicMetaForStory(story: Story): StoryTopic {
  const id = topicIdForStory(story);
  return HOME_STORY_TOPICS.find((t) => t.id === id) ?? HOME_STORY_TOPICS[0]!;
}

export function storyMatchesTopic(story: Story, topicId: StoryTopicId): boolean {
  if (topicId === "all") return true;
  return topicIdForStory(story) === topicId;
}

/** Topic chips to show: always "all", then topics that appear in the current story list. */
export function visibleTopicIdsForStories(stories: Story[]): StoryTopicId[] {
  const present = new Set<StoryTopicId>();
  for (const story of stories) {
    present.add(topicIdForStory(story));
  }
  const ordered = HOME_STORY_TOPICS.map((t) => t.id).filter((id) => present.has(id));
  return ["all", ...ordered];
}
