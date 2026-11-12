import { getSourceById, type StoryArticle } from "@/lib/demo-data";

/** Sample cluster pinned on the home feed so the frozen headline is visible. */
export const FIRST_HEADLINE_PREVIEW_SLUG = "first-headline-greptar";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export type HeadlineClock = {
  en: string;
  bn: string;
};

export type HeadlineEditView = {
  key: string;
  sourceName: string;
  url: string;
  host: string;
  originalHeadline: string;
  currentHeadline: string;
  previewTitle: string;
  previewImageUrl: string | null;
  clock: HeadlineClock | null;
  correctionNoted: boolean;
};

function bnDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)] ?? digit);
}

export function formatHeadlineEditClock(firstSeenIso: string, editedIso: string): HeadlineClock | null {
  const start = Date.parse(firstSeenIso);
  const end = Date.parse(editedIso);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;

  const minutes = Math.max(1, Math.round((end - start) / 60_000));
  if (minutes < 90) {
    return {
      en: `${minutes} ${minutes === 1 ? "minute" : "minutes"} later`,
      bn: `${bnDigits(minutes)} মিনিট পর`,
    };
  }

  const hours = Math.max(1, Math.round(minutes / 60));
  if (hours < 36) {
    return {
      en: `${hours} ${hours === 1 ? "hour" : "hours"} later`,
      bn: `${bnDigits(hours)} ঘণ্টা পর`,
    };
  }

  const days = Math.max(1, Math.round(hours / 24));
  return {
    en: `${days} ${days === 1 ? "day" : "days"} later`,
    bn: `${bnDigits(days)} দিন পর`,
  };
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function headlineEdits(articles: StoryArticle[]): HeadlineEditView[] {
  const edits: HeadlineEditView[] = [];
  for (const article of articles) {
    const original = article.originalHeadline?.trim() ?? "";
    const current = article.headline.trim();
    if (!original || original === current) continue;

    const source = getSourceById(article.sourceId);
    const previewTitle = article.socialPreview?.title?.trim() || original;
    const image = article.socialPreview?.imageUrl?.trim() || "";
    edits.push({
      key: article.url,
      sourceName: source?.nameBn ?? article.sourceName ?? source?.name ?? article.sourceId,
      url: article.url,
      host: hostFromUrl(article.url),
      originalHeadline: original,
      currentHeadline: current,
      previewTitle,
      previewImageUrl: image || null,
      clock:
        article.originalSeenAt && article.headlineEditedAt
          ? formatHeadlineEditClock(article.originalSeenAt, article.headlineEditedAt)
          : null,
      correctionNoted: Boolean(article.correctionNoted),
    });
  }
  return edits;
}
