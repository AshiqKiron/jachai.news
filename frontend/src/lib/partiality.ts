import { coverageCounts } from "@/lib/coverage";
import { getSourceById, type Story, type StoryArticle } from "@/lib/demo-data";
import {
  biasScoreToPerspective,
  PERSPECTIVE_META,
  type Perspective,
} from "@/lib/perspectives";

/** Perspective buckets we expect in a well-rounded cluster. */
export const COVERAGE_PERSPECTIVES: Perspective[] = (
  Object.keys(PERSPECTIVE_META) as Perspective[]
).sort((a, b) => PERSPECTIVE_META[a].order - PERSPECTIVE_META[b].order);

const MIN_ARTICLES_FOR_PARTIALITY = 2;

function resolveArticleBiasScore(article: StoryArticle): number | null {
  if (article.biasScore !== undefined && article.biasScore !== null) {
    return article.biasScore;
  }
  return getSourceById(article.sourceId)?.biasScore ?? null;
}

export function clusterBiasScore(story: Story): number {
  let sum = 0;
  let count = 0;
  for (const article of story.articles) {
    const score = resolveArticleBiasScore(article);
    if (score === null) continue;
    sum += score;
    count += 1;
  }
  if (count === 0) return 0;
  return sum / count;
}

function dominantPerspective(counts: Record<Perspective, number>): Perspective | null {
  let best: Perspective | null = null;
  let bestCount = 0;
  for (const perspective of COVERAGE_PERSPECTIVES) {
    const n = counts[perspective];
    if (n > bestCount) {
      bestCount = n;
      best = perspective;
    }
  }
  return bestCount > 0 ? best : null;
}

export type PartialityAnalysis = {
  missingPerspectives: Perspective[];
  clusterBiasScore: number;
  dominantPerspective: Perspective | null;
};

export function analyzePartiality(story: Story): PartialityAnalysis | null {
  if (story.articles.length < MIN_ARTICLES_FOR_PARTIALITY) return null;

  const counts = coverageCounts(story);
  const missingPerspectives = COVERAGE_PERSPECTIVES.filter((p) => counts[p] === 0);
  if (missingPerspectives.length === 0) return null;

  return {
    missingPerspectives,
    clusterBiasScore: clusterBiasScore(story),
    dominantPerspective: dominantPerspective(counts),
  };
}

function formatList(items: string[], conjunction: string): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items[items.length - 1]}`;
}

export function partialityBannerCopy(analysis: PartialityAnalysis): {
  titleEn: string;
  titleBn: string;
  detailEn: string;
  detailBn: string;
} {
  const missingBn = formatList(
    analysis.missingPerspectives.map((p) => PERSPECTIVE_META[p].labelBn),
    "ও",
  );
  const missingEn = formatList(
    analysis.missingPerspectives.map((p) => PERSPECTIVE_META[p].labelEn),
    "and",
  );
  const leanMeta = PERSPECTIVE_META[biasScoreToPerspective(analysis.clusterBiasScore)];
  const dominantMeta = analysis.dominantPerspective
    ? PERSPECTIVE_META[analysis.dominantPerspective]
    : null;

  const dominantBn = dominantMeta?.labelBn ?? leanMeta.labelBn;
  const dominantEn = dominantMeta?.labelEn ?? leanMeta.labelEn;

  return {
    titleEn: "Partial coverage",
    titleBn: "পক্ষপাতিত্ব সতর্কতা",
    detailBn: `এই খবরে সব ধরনের outlet নেই — ${missingBn} কোনো উৎস কভার করছে না। বেশিরভাগ রিপোর্ট ${dominantBn} দিক থেকে, তাই সমগ্র কভারেজ ${leanMeta.labelBn} দিকে ঝুঁকছে।`,
    detailEn: `Not every outlet type is covering this story — no ${missingEn} sources yet. Most reports come from ${dominantEn} outlets, so overall coverage leans ${leanMeta.labelEn.toLowerCase()}.`,
  };
}
