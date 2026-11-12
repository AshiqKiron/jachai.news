import { enrichArticles, type ArticleWithSource } from "@/lib/coverage";
import type { Story } from "@/lib/demo-data";
import { pickClusterWalkback, WALKBACK_PREVIEW_SLUG, type WalkbackSentence } from "@/lib/walkback-line";
import {
  analyzeSharedOwnership,
  sharedOwnershipCountBn,
  sharedOwnershipCountEn,
  type SharedOwnershipAnalysis,
} from "@/lib/shared-ownership";
import {
  analyzeUnnamedSource,
  unnamedSourceCountBn,
  unnamedSourceCountEn,
  type UnnamedSourceAnalysis,
} from "@/lib/unnamed-source";

export const STORY_SHARE_CARD_SIZE = { width: 1080, height: 1080 } as const;

/** Square card path the share button fetches. Public previews use the free card. */
export function storyShareCardPath(slug: string): string {
  return `/api/story/${encodeURIComponent(slug)}/share-card`;
}

export type StoryRevealKind = "ownership" | "unnamed";

export type StoryShareCardLine = {
  text: string;
  meta: string | null;
};

export type StoryShareCard = {
  kind: "reveal" | "mark" | "walkback";
  accent: string;
  kickerBn: string;
  kickerEn: string;
  /** English count sentence. Free cards stop here, plus {@link countBn}. */
  countEn: string;
  /** Bangla count sentence, the second line of the same fact. */
  countBn: string;
  /** Names list outlets. Quotes draw {@link StoryShareCardLine.text} as a quoted line. */
  lineStyle: "names" | "quotes";
  /** Pro only. Empty on the public card. */
  lines: StoryShareCardLine[];
};

const OWNERSHIP_ACCENT = "#38bdf8";
const UNNAMED_ACCENT = "#2dd4bf";
const MARK_ACCENT = "#38bdf8";
const WALKBACK_ACCENT = "#e7c27a";

/** Ownership wins a tie. It is the rarer structural fact. */
const KIND_RANK: Record<StoryRevealKind, number> = {
  ownership: 0,
  unnamed: 1,
};

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3).trim()}...`;
}

/** Brand card when no reveal fired, and when the story itself is missing. */
export function storyShareMarkCard(): StoryShareCard {
  return {
    kind: "mark",
    accent: MARK_ACCENT,
    kickerBn: "",
    kickerEn: "",
    countEn: "",
    countBn: "",
    lineStyle: "names",
    lines: [],
  };
}

/**
 * 0–100. A collapse onto few owners scores higher than a single shared pair
 * buried in a long list of independent newsrooms.
 */
function ownershipSharpness(analysis: SharedOwnershipAnalysis): number {
  const extra = analysis.outletCount - analysis.ownerCount;
  const span = Math.max(analysis.outletCount - 1, 1);
  return Math.round((extra / span) * 100);
}

/** 0–100. The share of outlets that hide a name. */
function unnamedSharpness(analysis: UnnamedSourceAnalysis): number {
  if (analysis.outletCount === 0) return 0;
  return Math.round((analysis.unnamedCount / analysis.outletCount) * 100);
}

function ownershipCard(analysis: SharedOwnershipAnalysis): StoryShareCard {
  return {
    kind: "reveal",
    accent: OWNERSHIP_ACCENT,
    kickerBn: "একই মালিকানা",
    kickerEn: "Shared ownership",
    countEn: sharedOwnershipCountEn(analysis),
    countBn: sharedOwnershipCountBn(analysis),
    lineStyle: "names",
    lines: analysis.groups.slice(0, 4).map((group) => ({
      text: truncate(group.label, 72),
      meta: truncate(group.outlets.join(", "), 96),
    })),
  };
}

function walkbackCard(line: WalkbackSentence): StoryShareCard {
  return {
    kind: "walkback",
    accent: WALKBACK_ACCENT,
    kickerBn: "শিরোনামের নিচের বাক্য",
    kickerEn: "The line under the headline",
    countEn: "",
    countBn: truncate(line.sentence, 220),
    lineStyle: "quotes",
    lines: line.sourceName ? [{ text: line.sentence, meta: line.sourceName }] : [],
  };
}

function unnamedCard(analysis: UnnamedSourceAnalysis): StoryShareCard {
  const lines: StoryShareCardLine[] = [
    {
      text: "Hid the name",
      meta: truncate(analysis.hidName.join(", "), 96),
    },
  ];
  if (analysis.printedName.length > 0) {
    lines.push({
      text: "Printed a name",
      meta: truncate(analysis.printedName.join(", "), 96),
    });
  } else {
    lines.push({ text: "No outlet printed a name", meta: null });
  }
  return {
    kind: "reveal",
    accent: UNNAMED_ACCENT,
    kickerBn: "নামহীন সূত্র",
    kickerEn: "Unnamed source",
    countEn: unnamedSourceCountEn(analysis),
    countBn: unnamedSourceCountBn(analysis),
    lineStyle: "names",
    lines,
  };
}

type Candidate = {
  kind: StoryRevealKind;
  score: number;
  card: StoryShareCard;
};

function revealCandidates(articles: ArticleWithSource[]): Candidate[] {
  const candidates: Candidate[] = [];

  const ownership = analyzeSharedOwnership(
    articles.map((article) => ({
      sourceName: article.sourceName,
      mediaOwnership: article.mediaOwnership,
    })),
  );
  if (ownership) {
    candidates.push({
      kind: "ownership",
      score: ownershipSharpness(ownership),
      card: ownershipCard(ownership),
    });
  }

  const unnamed = analyzeUnnamedSource(
    articles.map((article) => ({
      sourceName: article.sourceName,
      headline: article.headline,
      excerpt: article.excerpt,
    })),
  );
  if (unnamed) {
    candidates.push({
      kind: "unnamed",
      score: unnamedSharpness(unnamed),
      card: unnamedCard(unnamed),
    });
  }

  candidates.sort(
    (left, right) => right.score - left.score || KIND_RANK[left.kind] - KIND_RANK[right.kind],
  );
  return candidates;
}

/** The one reveal the story page and the share card both use. Null when neither fired. */
export function pickSharpestRevealKind(articles: ArticleWithSource[]): StoryRevealKind | null {
  return revealCandidates(articles)[0]?.kind ?? null;
}

/**
 * Square share card for one story.
 * Pro cards lead with the buried walk-back, so a share carries that sentence.
 * Free cards keep the count (both sentences). Pro cards without a walk-back add
 * names or quoted lines. When no reveal fires, the card is the khatinews mark.
 */
export function buildStoryShareCard(story: Story, includeProDetail: boolean): StoryShareCard {
  const articles = enrichArticles(story);
  const walkback = pickClusterWalkback(
    articles.map((article) => ({
      sourceName: article.sourceName,
      headline: article.headline,
      excerpt: article.excerpt,
    })),
  );
  if (walkback && (includeProDetail || story.slug === WALKBACK_PREVIEW_SLUG)) {
    return walkbackCard(walkback);
  }

  const best = revealCandidates(articles)[0];
  if (!best) return storyShareMarkCard();
  if (includeProDetail) return best.card;
  return { ...best.card, lines: [] };
}
