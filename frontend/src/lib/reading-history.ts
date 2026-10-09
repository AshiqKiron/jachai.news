import type { BlindspotAxisPerspective } from "@/lib/blindspot";
import type { Perspective } from "@/lib/perspectives";
import { biasScoreToPerspective } from "@/lib/perspectives";
import { resolveSourceById } from "@/lib/source-perspective";
import { lookupMediaOwnership, type MediaOwnership } from "@/lib/source-media-ownership";
import {
  HOME_STORY_TOPICS,
  type StoryTopicId,
  topicIdForStory,
} from "@/lib/story-topics";
import { readTrackArticleClicksEnabled } from "@/lib/track-article-clicks-pref";
import type { Story } from "@/lib/demo-data";

const STORAGE_KEY = "shorup_reading_history_v1";
const MAX_STORY_READS = 200;
const MAX_ARTICLE_CLICKS = 500;

export type SpectrumBucket = "left" | "center" | "right";

export type ReadingTopicId = Exclude<StoryTopicId, "all">;

export type StoryReadEntry = {
  slug: string;
  titleBn: string;
  biasScore: number | null;
  perspective: Perspective;
  readAt: string;
  /** Home topic chip id when recorded from story detail. */
  topicId?: ReadingTopicId;
  isBlindspot?: boolean;
  blindspotPerspective?: BlindspotAxisPerspective;
};

export type ArticleClickEntry = {
  storySlug: string;
  url: string;
  sourceId: string;
  sourceName?: string;
  perspective: Perspective;
  biasScore: number | null;
  clickedAt: string;
};

export type ReadingHistory = {
  storyReads: StoryReadEntry[];
  articleClicks: ArticleClickEntry[];
};

export type MyNewsBiasStats = {
  storyCount: number;
  articleCount: number;
  leftPct: number;
  centerPct: number;
  rightPct: number;
  leftStories: number;
  centerStories: number;
  rightStories: number;
  leftArticles: number;
  centerArticles: number;
  rightArticles: number;
};

function storageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRaw(): ReadingHistory {
  if (!storageAvailable()) {
    return { storyReads: [], articleClicks: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { storyReads: [], articleClicks: [] };
    const parsed = JSON.parse(raw) as Partial<ReadingHistory>;
    return {
      storyReads: Array.isArray(parsed.storyReads) ? parsed.storyReads : [],
      articleClicks: Array.isArray(parsed.articleClicks) ? parsed.articleClicks : [],
    };
  } catch {
    return { storyReads: [], articleClicks: [] };
  }
}

function writeRaw(history: ReadingHistory): void {
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    /* ignore */
  }
}

export function perspectiveToSpectrumBucket(perspective: Perspective): SpectrumBucket {
  if (perspective === "opposition") return "left";
  if (perspective === "establishment") return "right";
  return "center";
}

export function biasScoreToSpectrumBucket(score: number | null): SpectrumBucket {
  return perspectiveToSpectrumBucket(biasScoreToPerspective(score));
}

export function readReadingHistory(): ReadingHistory {
  return readRaw();
}

export function recordStoryRead(input: {
  slug: string;
  titleBn: string;
  biasScore: number | null;
  perspective?: Perspective;
  topicId?: ReadingTopicId;
  isBlindspot?: boolean;
  blindspotPerspective?: BlindspotAxisPerspective;
}): void {
  const history = readRaw();
  const perspective = input.perspective ?? biasScoreToPerspective(input.biasScore);
  const entry: StoryReadEntry = {
    slug: input.slug,
    titleBn: input.titleBn,
    biasScore: input.biasScore,
    perspective,
    readAt: new Date().toISOString(),
    ...(input.topicId ? { topicId: input.topicId } : {}),
    ...(input.isBlindspot && input.blindspotPerspective
      ? { isBlindspot: true, blindspotPerspective: input.blindspotPerspective }
      : {}),
  };
  const withoutDup = history.storyReads.filter((row) => row.slug !== input.slug);
  const storyReads = [entry, ...withoutDup].slice(0, MAX_STORY_READS);
  writeRaw({ ...history, storyReads });
}

export function recordArticleClick(input: {
  storySlug: string;
  url: string;
  sourceId: string;
  sourceName?: string;
  perspective: Perspective;
  biasScore?: number | null;
}): void {
  if (!readTrackArticleClicksEnabled()) return;

  const history = readRaw();
  const entry: ArticleClickEntry = {
    storySlug: input.storySlug,
    url: input.url,
    sourceId: input.sourceId,
    ...(input.sourceName ? { sourceName: input.sourceName } : {}),
    perspective: input.perspective,
    biasScore: input.biasScore ?? null,
    clickedAt: new Date().toISOString(),
  };
  const withoutDup = history.articleClicks.filter(
    (row) => !(row.url === input.url && row.storySlug === input.storySlug),
  );
  const articleClicks = [entry, ...withoutDup].slice(0, MAX_ARTICLE_CLICKS);
  writeRaw({ ...history, articleClicks });
}

function countBuckets(
  items: { perspective: Perspective }[],
): { left: number; center: number; right: number } {
  const counts = { left: 0, center: 0, right: 0 };
  for (const item of items) {
    const bucket = perspectiveToSpectrumBucket(item.perspective);
    counts[bucket] += 1;
  }
  return counts;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function computeMyNewsBiasStats(
  history: ReadingHistory,
  options?: { includeArticleClicks?: boolean },
): MyNewsBiasStats {
  const includeArticles = options?.includeArticleClicks ?? readTrackArticleClicksEnabled();
  const storyCount = history.storyReads.length;
  const articleCount = includeArticles ? history.articleClicks.length : 0;

  const storyBuckets = countBuckets(history.storyReads);
  const articleBuckets = includeArticles ? countBuckets(history.articleClicks) : { left: 0, center: 0, right: 0 };

  const leftTotal = storyBuckets.left + articleBuckets.left;
  const centerTotal = storyBuckets.center + articleBuckets.center;
  const rightTotal = storyBuckets.right + articleBuckets.right;
  const combined = leftTotal + centerTotal + rightTotal;

  return {
    storyCount,
    articleCount,
    leftPct: pct(leftTotal, combined),
    centerPct: pct(centerTotal, combined),
    rightPct: pct(rightTotal, combined),
    leftStories: storyBuckets.left,
    centerStories: storyBuckets.center,
    rightStories: storyBuckets.right,
    leftArticles: articleBuckets.left,
    centerArticles: articleBuckets.center,
    rightArticles: articleBuckets.right,
  };
}

export type StoriesReadRange = "day" | "week" | "month";

export type StoriesReadBucket = {
  key: string;
  start: Date;
  count: number;
};

export type StoriesReadChartData = {
  buckets: StoriesReadBucket[];
  weekOverWeekPct: number;
};

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfLocalWeek(d: Date): Date {
  const x = startOfLocalDay(d);
  const weekday = x.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  x.setDate(x.getDate() + mondayOffset);
  return x;
}

function startOfLocalMonth(d: Date): Date {
  const x = startOfLocalDay(d);
  x.setDate(1);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function addMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/** Sparse x-axis label for profile bar chart (EN, Ground News–style). */
export function formatStoriesReadAxisLabel(date: Date, range: StoriesReadRange): string {
  const day = date.getDate();
  if (range === "month") {
    return date.toLocaleDateString("en-US", { month: "short" });
  }
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${month} ${day}${ordinalSuffix(day)}`;
}

function bucketStartForRange(date: Date, range: StoriesReadRange): Date {
  if (range === "week") return startOfLocalWeek(date);
  if (range === "month") return startOfLocalMonth(date);
  return startOfLocalDay(date);
}

function bucketKey(date: Date): string {
  return startOfLocalDay(date).toISOString().slice(0, 10);
}

function countReadsBetween(reads: StoryReadEntry[], start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return reads.filter((row) => {
    const t = new Date(row.readAt).getTime();
    return t >= startMs && t < endMs;
  }).length;
}

function computeWeekOverWeekPct(reads: StoryReadEntry[], now: Date): number {
  const thisWeekStart = startOfLocalWeek(now);
  const nextWeekStart = addDays(thisWeekStart, 7);
  const lastWeekStart = addDays(thisWeekStart, -7);
  const thisWeek = countReadsBetween(reads, thisWeekStart, nextWeekStart);
  const lastWeek = countReadsBetween(reads, lastWeekStart, thisWeekStart);
  if (lastWeek <= 0) {
    if (thisWeek <= 0) return 0;
    return 100;
  }
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
}

export function computeStoriesReadChart(
  history: ReadingHistory,
  range: StoriesReadRange,
  now: Date = new Date(),
): StoriesReadChartData {
  const reads = history.storyReads;
  const bucketCount = range === "day" ? 90 : range === "week" ? 14 : 6;
  const stepDays = range === "day" ? 1 : range === "week" ? 7 : 0;

  const endExclusive =
    range === "month"
      ? addMonths(startOfLocalMonth(now), 1)
      : addDays(bucketStartForRange(now, range), range === "day" ? 1 : 7);

  const buckets: StoriesReadBucket[] = [];

  for (let i = bucketCount - 1; i >= 0; i -= 1) {
    let start: Date;
    let end: Date;
    if (range === "month") {
      end = addMonths(startOfLocalMonth(now), -i + 1);
      start = addMonths(end, -1);
    } else {
      end = addDays(endExclusive, -i * stepDays);
      start = addDays(end, -stepDays);
    }
    buckets.push({
      key: bucketKey(start),
      start,
      count: countReadsBetween(reads, start, end),
    });
  }

  return {
    buckets,
    weekOverWeekPct: computeWeekOverWeekPct(reads, now),
  };
}

/** Demo activity spike at the end of the range (profile “Demo Data” tab). */
export function demoStoriesReadChart(
  range: StoriesReadRange,
  now: Date = new Date(),
): StoriesReadChartData {
  const base = computeStoriesReadChart({ storyReads: [], articleClicks: [] }, range, now);
  const buckets = base.buckets.map((bucket, index) => {
    const tail = base.buckets.length - index;
    if (tail > 8) return { ...bucket, count: 0 };
    if (tail > 5) return { ...bucket, count: 1 };
    if (tail > 3) return { ...bucket, count: 2 + (index % 2) };
    return { ...bucket, count: 4 + (index % 3) };
  });
  return { buckets, weekOverWeekPct: 0 };
}

export type MediaOwnershipBreakdownRow = {
  key: string;
  label: string;
  url: string | null;
  count: number;
  pct: number;
};

export type MediaOwnershipBreakdown = {
  totalTracked: number;
  rows: MediaOwnershipBreakdownRow[];
};

export type TopicReadingBreakdownRow = {
  topicId: ReadingTopicId;
  labelEn: string;
  labelBn: string;
  count: number;
  pct: number;
};

export type TopicReadingBreakdown = {
  totalStories: number;
  rows: TopicReadingBreakdownRow[];
};

function ownershipGroup(ownership: MediaOwnership | null): {
  key: string;
  label: string;
  url: string | null;
} {
  if (!ownership) {
    return { key: "__independent__", label: "Independent / unknown", url: null };
  }
  if (ownership.parent) {
    return {
      key: ownership.parent.name,
      label: ownership.parent.name,
      url: ownership.parent.url,
    };
  }
  return {
    key: ownership.owner.name,
    label: ownership.owner.name,
    url: ownership.owner.url,
  };
}

function sourceNameForClick(entry: ArticleClickEntry): string | null {
  const trimmed = entry.sourceName?.trim();
  if (trimmed) return trimmed;
  return resolveSourceById(entry.sourceId)?.name ?? null;
}

export function computeMediaOwnershipBreakdown(
  history: ReadingHistory,
  options?: { includeArticleClicks?: boolean },
): MediaOwnershipBreakdown {
  const includeArticles = options?.includeArticleClicks ?? readTrackArticleClicksEnabled();
  if (!includeArticles) {
    return { totalTracked: 0, rows: [] };
  }

  const counts = new Map<string, { label: string; url: string | null; count: number }>();
  for (const click of history.articleClicks) {
    const sourceName = sourceNameForClick(click);
    const group = ownershipGroup(sourceName ? lookupMediaOwnership(sourceName) : null);
    const existing = counts.get(group.key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(group.key, { label: group.label, url: group.url, count: 1 });
    }
  }

  const totalTracked = history.articleClicks.length;
  const rows = [...counts.entries()]
    .map(([key, row]) => ({
      key,
      label: row.label,
      url: row.url,
      count: row.count,
      pct: pct(row.count, totalTracked),
    }))
    .sort((a, b) => b.count - a.count);

  return { totalTracked, rows };
}

function topicMetaForId(topicId: ReadingTopicId): { labelEn: string; labelBn: string } {
  const meta = HOME_STORY_TOPICS.find((row) => row.id === topicId);
  return meta
    ? { labelEn: meta.labelEn, labelBn: meta.labelBn }
    : { labelEn: "News", labelBn: "সংবাদ" };
}

export function computeTopicReadingBreakdown(history: ReadingHistory): TopicReadingBreakdown {
  const counts = new Map<ReadingTopicId, number>();
  for (const read of history.storyReads) {
    const topicId = read.topicId ?? "news";
    counts.set(topicId, (counts.get(topicId) ?? 0) + 1);
  }

  const totalStories = history.storyReads.length;
  const rows = [...counts.entries()]
    .map(([topicId, count]) => {
      const labels = topicMetaForId(topicId);
      return {
        topicId,
        labelEn: labels.labelEn,
        labelBn: labels.labelBn,
        count,
        pct: pct(count, totalStories),
      };
    })
    .sort((a, b) => b.count - a.count);

  return { totalStories, rows };
}

/** Demo slice for profile “Demo Data” tab. */
export function demoMediaOwnershipBreakdown(): MediaOwnershipBreakdown {
  return {
    totalTracked: 8,
    rows: [
      {
        key: "Transcom Group",
        label: "Transcom Group",
        url: "https://www.transcombd.com/",
        count: 4,
        pct: 50,
      },
      {
        key: "Bashundhara Group",
        label: "Bashundhara Group",
        url: "https://www.bashundharagroup.com/",
        count: 2,
        pct: 25,
      },
      {
        key: "__independent__",
        label: "Independent / unknown",
        url: null,
        count: 2,
        pct: 25,
      },
    ],
  };
}

export function demoTopicReadingBreakdown(): TopicReadingBreakdown {
  return {
    totalStories: 6,
    rows: [
      { topicId: "politics", labelEn: "Politics", labelBn: "রাজনীতি", count: 3, pct: 50 },
      { topicId: "news", labelEn: "News", labelBn: "সংবাদ", count: 2, pct: 33 },
      { topicId: "economy", labelEn: "Economy", labelBn: "অর্থনীতি", count: 1, pct: 17 },
    ],
  };
}

/** Resolve topic id when recording a story read from hydrated UI story. */
export function readingTopicIdForStory(story: Story): ReadingTopicId {
  return topicIdForStory(story);
}

export type BlindspotReadingSide = "left" | "right";

export type BlindspotReadingInsight = {
  leftBlindspotReads: number;
  rightBlindspotReads: number;
  /** Which spectrum side’s blindspot stories dominate; null when tied or none read. */
  dominantSide: BlindspotReadingSide | null;
  /** Relative excess on dominant side vs the other (Ground News–style copy). */
  excessPct: number;
};

function countBlindspotReadsBySide(reads: StoryReadEntry[]): { left: number; right: number } {
  let left = 0;
  let right = 0;
  for (const read of reads) {
    if (!read.isBlindspot || !read.blindspotPerspective) continue;
    if (read.blindspotPerspective === "opposition") left += 1;
    else if (read.blindspotPerspective === "establishment") right += 1;
  }
  return { left, right };
}

function blindspotExcessPct(dominant: number, other: number): number {
  if (dominant <= other) return 0;
  if (other <= 0) return 100;
  return Math.round(((dominant - other) / other) * 100);
}

export function computeBlindspotReadingInsight(history: ReadingHistory): BlindspotReadingInsight {
  const { left, right } = countBlindspotReadsBySide(history.storyReads);
  if (left > right) {
    return {
      leftBlindspotReads: left,
      rightBlindspotReads: right,
      dominantSide: "left",
      excessPct: blindspotExcessPct(left, right),
    };
  }
  if (right > left) {
    return {
      leftBlindspotReads: left,
      rightBlindspotReads: right,
      dominantSide: "right",
      excessPct: blindspotExcessPct(right, left),
    };
  }
  return {
    leftBlindspotReads: left,
    rightBlindspotReads: right,
    dominantSide: null,
    excessPct: 0,
  };
}

/** Demo slice: “31% more blindspots for the right”. */
export function demoBlindspotReadingInsight(): BlindspotReadingInsight {
  return {
    leftBlindspotReads: 2,
    rightBlindspotReads: 3,
    dominantSide: "right",
    excessPct: 31,
  };
}

/** Ground News–style demo slice for the profile “Demo Data” tab. */
export const DEMO_MY_NEWS_BIAS_STATS: MyNewsBiasStats = {
  storyCount: 6,
  articleCount: 0,
  leftPct: 31,
  centerPct: 33,
  rightPct: 36,
  leftStories: 1,
  centerStories: 1,
  rightStories: 2,
  leftArticles: 0,
  centerArticles: 0,
  rightArticles: 0,
};
