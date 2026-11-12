import { enrichArticles } from "@/lib/coverage";
import type { Story } from "@/lib/demo-data";
import { hasBengaliScript } from "@/lib/mixed-script-text";

/**
 * Sample cluster on the home feed so the buried sentence is visible
 * before a live excerpt contains one.
 */
export const WALKBACK_PREVIEW_SLUG = "walkback-line-preview";

export type WalkbackMarker = "তবে" | "অন্যদিকে" | "নাম প্রকাশে অনিচ্ছুক একটি সূত্র";

export type WalkbackSentence = {
  sentence: string;
  marker: WalkbackMarker;
  sourceName: string | null;
};

export type WalkbackOutlet = {
  sourceName: string;
  headline: string;
  excerpt: string;
};

const MARKER_RANK: Record<WalkbackMarker, number> = {
  তবে: 0,
  অন্যদিকে: 1,
  "নাম প্রকাশে অনিচ্ছুক একটি সূত্র": 2,
};

/** The walk-back starts a sentence or a clause. A following Bengali letter is a different word. */
const MARKER_RE =
  /(তবে|অন্যদিকে|নাম\s*প্রকাশে\s*অনিচ্ছুক\s+একটি\s+সূত্র)(?![\u0980-\u09FF])/gu;

const BOUNDARY_BEFORE = /[\s।.!?,;:…"“”'«»\-—]/u;

type ClauseHit = {
  sentence: string;
  marker: WalkbackMarker;
  index: number;
};

function markerOf(raw: string): WalkbackMarker {
  if (raw.startsWith("তবে")) return "তবে";
  if (raw.startsWith("অন্যদিকে")) return "অন্যদিকে";
  return "নাম প্রকাশে অনিচ্ছুক একটি সূত্র";
}

function isBoundaryBefore(text: string, index: number): boolean {
  if (index === 0) return true;
  const previous = text[index - 1] ?? "";
  return BOUNDARY_BEFORE.test(previous);
}

function sentenceEnd(text: string, from: number): number {
  for (let i = from; i < text.length; i += 1) {
    const ch = text[i] ?? "";
    if (ch === "।" || ch === "." || ch === "!" || ch === "?" || ch === "\n") {
      return ch === "\n" ? i : i + 1;
    }
  }
  return text.length;
}

function clauseIsSubstantial(sentence: string, markerLength: number): boolean {
  const rest = sentence.slice(markerLength).replace(/^[\s,،:：\-—]+/u, "").trim();
  return rest.length >= 8;
}

/** Earliest walk-back clause in one block of text. */
export function findWalkbackClause(text: string): ClauseHit | null {
  const source = text.trim();
  if (!source) return null;

  MARKER_RE.lastIndex = 0;
  let match = MARKER_RE.exec(source);
  while (match) {
    const index = match.index;
    if (isBoundaryBefore(source, index)) {
      const marker = markerOf(match[1] ?? "");
      const end = sentenceEnd(source, index + match[0].length);
      const sentence = source.slice(index, end).trim();
      if (clauseIsSubstantial(sentence, match[0].length)) {
        return { sentence, marker, index };
      }
    }
    match = MARKER_RE.exec(source);
  }
  return null;
}

function sameLine(left: string, right: string): boolean {
  return left.replace(/\s+/g, " ").trim() === right.replace(/\s+/g, " ").trim();
}

type BuriedClause = ClauseHit & { buried: number };

type LocatedClause = BuriedClause & { sourceName: string | null };

/**
 * The outrage is the headline. The walk-back is the later sentence that
 * starts with তবে, অন্যদিকে, or নাম প্রকাশে অনিচ্ছুক একটি সূত্র.
 * Returns null when that sentence is the headline itself.
 */
export function extractWalkbackSentence(headline: string, excerpt: string): BuriedClause | null {
  const scream = headline.trim();
  const body = excerpt.trim();

  const fromBody = findWalkbackClause(body);
  if (fromBody && !sameLine(scream, fromBody.sentence)) {
    const outrageBefore = fromBody.index > 0 || scream.length > 0;
    if (outrageBefore) {
      return { ...fromBody, buried: scream.length + fromBody.index };
    }
  }

  const fromHeadline = findWalkbackClause(scream);
  if (fromHeadline && fromHeadline.index > 0) {
    return { ...fromHeadline, buried: fromHeadline.index };
  }
  return null;
}

/**
 * One line for the cluster. Prefers the sentence buried deepest under its
 * headline, then Bangla, then তবে before অন্যদিকে before the unnamed-source line.
 */
export function pickClusterWalkback(outlets: WalkbackOutlet[]): WalkbackSentence | null {
  const found: LocatedClause[] = [];

  for (const outlet of outlets) {
    const hit = extractWalkbackSentence(outlet.headline, outlet.excerpt);
    if (!hit) continue;
    found.push({ ...hit, sourceName: outlet.sourceName.trim() || null });
  }

  if (found.length === 0) return null;

  found.sort((left, right) => {
    if (right.buried !== left.buried) return right.buried - left.buried;
    const bangla = Number(hasBengaliScript(right.sentence)) - Number(hasBengaliScript(left.sentence));
    if (bangla !== 0) return bangla;
    const marker = MARKER_RANK[left.marker] - MARKER_RANK[right.marker];
    if (marker !== 0) return marker;
    return left.sentence.length - right.sentence.length;
  });

  const best = found[0];
  if (!best) return null;
  return {
    sentence: best.sentence,
    marker: best.marker,
    sourceName: best.sourceName,
  };
}

export function walkbackForStory(story: Story): WalkbackSentence | null {
  return pickClusterWalkback(
    enrichArticles(story).map((article) => ({
      sourceName: article.sourceName,
      headline: article.headline,
      excerpt: article.excerpt,
    })),
  );
}
