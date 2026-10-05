import { coverageCounts } from "@/lib/coverage";
import type { Story } from "@/lib/demo-data";
import { PERSPECTIVE_META, type Perspective } from "@/lib/perspectives";

/** Political spectrum buckets used for blindspot detection (not neutral/international). */
export type BlindspotAxisPerspective = "establishment" | "opposition";

const MIN_CLUSTER_ARTICLES = 3;

function totalArticles(story: Story): number {
  return story.articles.length;
}

function hasEstablishmentBlindspot(counts: Record<Perspective, number>, total: number): boolean {
  if (total < MIN_CLUSTER_ARTICLES) return false;
  if (counts.establishment > 0) return false;
  const criticalVoices = counts.opposition + counts.international;
  if (criticalVoices < 2) return false;
  if (counts.opposition < 1 || counts.international < 1) return false;
  const otherCoverage = total - counts.establishment;
  return otherCoverage >= MIN_CLUSTER_ARTICLES;
}

function hasOppositionBlindspot(counts: Record<Perspective, number>, total: number): boolean {
  if (total < MIN_CLUSTER_ARTICLES) return false;
  if (counts.opposition > 0) return false;
  if (counts.establishment < 1) return false;
  const proGovHeavy = counts.establishment >= 2 || (counts.establishment >= 1 && total >= MIN_CLUSTER_ARTICLES);
  if (!proGovHeavy) return false;
  const nonOpposition = total - counts.opposition;
  return nonOpposition >= MIN_CLUSTER_ARTICLES;
}

export type BlindspotDetection = {
  isBlindspot: true;
  blindspotPerspective: BlindspotAxisPerspective;
};

export function detectBlindspot(story: Story): BlindspotDetection | null {
  const counts = coverageCounts(story);
  const total = totalArticles(story);
  if (hasEstablishmentBlindspot(counts, total)) {
    return { isBlindspot: true, blindspotPerspective: "establishment" };
  }
  if (hasOppositionBlindspot(counts, total)) {
    return { isBlindspot: true, blindspotPerspective: "opposition" };
  }
  return null;
}

export function applyBlindspotDetection(story: Story): Story {
  const detected = detectBlindspot(story);
  if (!detected) {
    if (!story.isBlindspot) return story;
    return { ...story, isBlindspot: false, blindspotPerspective: undefined };
  }
  return {
    ...story,
    isBlindspot: true,
    blindspotPerspective: detected.blindspotPerspective,
  };
}

export function blindspotBannerCopy(perspective: BlindspotAxisPerspective): {
  titleEn: string;
  titleBn: string;
  detailEn: string;
  detailBn: string;
} {
  const meta = PERSPECTIVE_META[perspective];
  if (perspective === "establishment") {
    return {
      titleEn: `${meta.labelEn} blindspot`,
      titleBn: `⚠️ ${meta.labelBn} ব্লাইন্ডস্পট`,
      detailEn:
        "Ruling-aligned media is silent on this story while opposition and international outlets are covering it.",
      detailBn:
        "সরকারপক্ষীয় সংবাদমাধ্যম এই বিষয়ে নীরব; সরকারবিরোধী ও আন্তর্জাতিক উৎসগুলো কভার করছে।",
    };
  }
  return {
    titleEn: `${meta.labelEn} blindspot`,
    titleBn: `⚠️ ${meta.labelBn} ব্লাইন্ডস্পট`,
    detailEn:
      "Opposition-aligned press is not covering this story while pro-government outlets are emphasizing it.",
    detailBn:
      "সরকারবিরোধী সংবাদমাধ্যম এই বিষয়ে নীরব; সরকারপক্ষীয় উৎসগুলো বিষয়টি জোর দিয়ে তুলছে।",
  };
}
