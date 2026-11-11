import { BD_SOURCES, type Story, type StoryArticle } from "@/lib/demo-data";
import type { Factuality } from "@/lib/perspectives";

/** How a non-political story is told. Clickbait → mixed → factual, with rumor beside that scale. */
export type ReportingTone = "clickbait" | "mixed" | "factual" | "rumor";

export const REPORTING_TONE_ORDER: ReportingTone[] = ["clickbait", "mixed", "factual", "rumor"];

export type ReportingToneCopy = {
  labelEn: string;
  labelBn: string;
  shortLabelEn: string;
  shortLabelBn: string;
  color: string;
};

export const REPORTING_TONE_META: Record<ReportingTone, ReportingToneCopy> = {
  clickbait: {
    labelEn: "Clickbait",
    labelBn: "ক্লিকবেইট",
    shortLabelEn: "Clickbait",
    shortLabelBn: "ক্লিকবেইট",
    color: "#C47A3A",
  },
  mixed: {
    labelEn: "Mixed",
    labelBn: "মিশ্র",
    shortLabelEn: "Mixed",
    shortLabelBn: "মিশ্র",
    color: "#787880",
  },
  factual: {
    labelEn: "Factual",
    labelBn: "তথ্যনির্ভর",
    shortLabelEn: "Factual",
    shortLabelBn: "তথ্য",
    color: "#3D9A78",
  },
  rumor: {
    labelEn: "Rumor",
    labelBn: "গুজব",
    shortLabelEn: "Rumor",
    shortLabelBn: "গুজব",
    color: "#C45A6A",
  },
};

const RUMOR_RE =
  /\b(rumour|rumou?rs?|unverified|unconfirmed|allegedly|hearsay)\b|সূত্র\s*বলছে|সূত্র\s*আর\s*জানিয়েছে|গুজব|গুঞ্জন|যাচাই\s*হয়নি|যাচাই\s*হয়নি|অনিশ্চিত|কথিত/iu;

const CLICKBAIT_RE =
  /\b(you won'?t believe|shocking|unbelievable|jaw-?dropping|bombshell|must-?read|must-?see|exposed|shocker|outrage as|fury as)\b|[!?]{2,}|(?:চাঞ্চল্য|চাঞ্চল্যকর|হতবাক|অবাক করা|চমকপ্রদ|অবিশ্বাস্য|এক্সক্লুসিভ|ভাইরাল|ফাঁস)/iu;

const SOURCE_BY_NAME = new Map(BD_SOURCES.map((source) => [source.name.toLowerCase(), source]));

export function isRumorCoverageText(text: string): boolean {
  return RUMOR_RE.test(text);
}

export function isClickbaitHeadline(text: string): boolean {
  return CLICKBAIT_RE.test(text);
}

function factualityForArticle(
  article: Pick<StoryArticle, "sourceId" | "sourceName">,
): Factuality {
  const byId = BD_SOURCES.find((source) => source.id === article.sourceId);
  if (byId) return byId.factuality;
  const name = article.sourceName?.trim().toLowerCase();
  if (name) {
    const byName = SOURCE_BY_NAME.get(name);
    if (byName) return byName.factuality;
  }
  return "mixed";
}

/** Rumor flag or rumor wording wins, then a sensational headline, then the outlet's factuality. */
export function reportingToneForArticle(
  article: Pick<StoryArticle, "headline" | "excerpt" | "sourceId" | "sourceName" | "isRumor">,
): ReportingTone {
  if (article.isRumor) return "rumor";
  const blob = `${article.headline}\n${article.excerpt ?? ""}`;
  if (isRumorCoverageText(blob)) return "rumor";
  if (isClickbaitHeadline(article.headline)) return "clickbait";
  return factualityForArticle(article) === "high" ? "factual" : "mixed";
}

export function reportingCounts(
  story: Pick<Story, "articles">,
): Record<ReportingTone, number> {
  const counts: Record<ReportingTone, number> = {
    clickbait: 0,
    mixed: 0,
    factual: 0,
    rumor: 0,
  };
  for (const article of story.articles) {
    counts[reportingToneForArticle(article)] += 1;
  }
  return counts;
}

export type ReportingStats = {
  total: number;
  counts: Record<ReportingTone, number>;
  dominantTone: ReportingTone;
  dominantPercent: number;
};

const DOMINANT_TIE_BREAK: ReportingTone[] = ["factual", "mixed", "clickbait", "rumor"];

export function reportingStats(story: Pick<Story, "articles">): ReportingStats | null {
  if (story.articles.length === 0) return null;
  const counts = reportingCounts(story);
  const total = story.articles.length;
  let best = 0;
  for (const tone of REPORTING_TONE_ORDER) {
    if (counts[tone] > best) best = counts[tone];
  }
  const dominantTone =
    DOMINANT_TIE_BREAK.find((tone) => counts[tone] === best) ?? "mixed";
  return {
    total,
    counts,
    dominantTone,
    dominantPercent: total > 0 ? Math.round((best / total) * 100) : 0,
  };
}
