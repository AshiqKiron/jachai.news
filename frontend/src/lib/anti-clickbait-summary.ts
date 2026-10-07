import type { ArticleWithSource } from "@/lib/coverage";
import { cleanSourceText } from "@/lib/source-digest";

export const ANTI_CLICKBAIT_BULLET_COUNT = 3;

const MAX_BULLET_CHARS = 200;
const MIN_BULLET_CHARS = 28;

/** Phrases removed or neutralized (EN + BN). Case-insensitive where Latin applies. */
const PHRASE_REPLACEMENTS: { pattern: RegExp; replace: string }[] = [
  // Clickbait hooks (EN)
  { pattern: /\b(breaking|exclusive|just in|developing story|what you need to know)\b/gi, replace: "" },
  { pattern: /\b(shocking|unbelievable|jaw-?dropping|bombshell|game-?changer|must-?read|must-?see)\b/gi, replace: "" },
  { pattern: /\b(you won'?t believe|here'?s why|this is why|find out why|the truth about)\b/gi, replace: "" },
  { pattern: /\b(watch now|click here|read more|full story|live updates)\b/gi, replace: "" },
  { pattern: /\b(outrage as|fury as|backlash as|slams|slammed|blasts|blasted|destroys|destroyed|rips|ripped|roasts|roasted|eviscerates)\b/gi, replace: "" },
  { pattern: /\b(stunned|stuns|exposed|expose|reveals shocking|shocker)\b/gi, replace: "" },
  { pattern: /\b(sources say|insiders say)\b/gi, replace: "" },
  // Loaded bias framing (EN) — drop heat, keep factual clauses when possible
  { pattern: /\b(radical|extremist|failed|disastrous|corrupt|corruption-ridden|traitor|villain|heroic triumph)\b/gi, replace: "" },
  { pattern: /\b(fierce|brutal|vicious|savage|scathing|blistering|withering)\b/gi, replace: "" },
  // Clickbait / hype (BN)
  { pattern: /(চাড়া|বিস্ফোরক|আলোচিত|হতবাক|অবাক|চমক|চমকপ্রদ|অবিশ্বাস্য|শেষ পর্যন্ত|যা জানেন না|একচেটিয়া|এক্সক্লুসিভ)/gu, replace: "" },
  { pattern: /(বিতর্কিত\s+)?(তীব্র|কঠোর|যুদ্ধ\s*ধাঁধায়)\s*সমালোচনা/gu, replace: " সমালোচনা" },
  { pattern: /(হুমকি|ধমক|পাল্টা\s+জবাব|কড়া\s+জবাব)/gu, replace: "" },
  { pattern: /(জনকল্যাণমুখী|পক্ষপাতমূলক|পক্ষপাতদুষ্ট)/gu, replace: "" },
  { pattern: /(সূত্র\s*বলছে|সূত্র\s*আর\s*জানিয়েছে|আরও\s*জানুন)/gu, replace: "" },
];

const LEADING_HOOK_RE =
  /^(?:[\s\-–—:;]+|(?:why|how|what|who|when|where|কেন|কী|কিভাবে|কখন|কোথায়|কে)[\s,:-]+)/iu;

function normalizePunctuation(text: string): string {
  return text
    .replace(/[!?]{2,}/g, ".")
    .replace(/\.{4,}/g, "…")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:!?])([^\s\d])/g, "$1 $2");
}

function decapSensationalCaps(text: string): string {
  return text.replace(/\b[A-Z]{3,}\b/g, (word) => {
    if (word.length <= 4) return word;
    return word.charAt(0) + word.slice(1).toLowerCase();
  });
}

/** Strip sensational / loaded phrasing from a single snippet or sentence. */
export function antiClickbaitText(raw: string): string {
  let text = cleanSourceText(raw);
  if (!text) return "";

  text = text.replace(/["""]/g, "").replace(/['']/g, "'");
  text = decapSensationalCaps(text);

  for (const { pattern, replace } of PHRASE_REPLACEMENTS) {
    text = text.replace(pattern, replace);
  }

  text = normalizePunctuation(text);
  text = text.replace(LEADING_HOOK_RE, "").trim();
  text = text.replace(/^[\-–—•·]+\s*/, "");
  text = text.replace(/\s+/g, " ").trim();

  if (text.length > MAX_BULLET_CHARS) {
    const slice = text.slice(0, MAX_BULLET_CHARS);
    const lastSpace = slice.lastIndexOf(" ");
    text = (lastSpace > MAX_BULLET_CHARS * 0.55 ? slice.slice(0, lastSpace) : slice).trim();
    if (!text.endsWith("…")) text += "…";
  }

  return text;
}

function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

function isLikelyDuplicate(a: string, b: string): boolean {
  const tokensA = tokenSet(a);
  const tokensB = tokenSet(b);
  if (tokensA.size === 0 || tokensB.size === 0) return false;
  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 && intersection / union >= 0.68;
}

function splitSentences(text: string): string[] {
  const cleaned = antiClickbaitText(text);
  if (!cleaned) return [];
  return cleaned
    .split(/(?<=[.!?…])\s+|\s+[·•]\s+|\s*\|\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length >= MIN_BULLET_CHARS);
}

function candidateFromArticle(article: ArticleWithSource): string {
  const excerpt = article.excerpt?.trim() ?? "";
  const headline = article.headline?.trim() ?? "";
  const preferExcerpt = excerpt.length >= 40;
  const raw = preferExcerpt ? excerpt : headline || excerpt;
  return antiClickbaitText(raw);
}

function pushBullet(out: string[], candidate: string): void {
  const text = candidate.trim();
  if (text.length < MIN_BULLET_CHARS) return;
  if (out.some((row) => isLikelyDuplicate(row, text))) return;
  out.push(text);
}

export type AntiClickbaitFallback = {
  summary?: string;
  summaryBn?: string;
};

/** Up to three neutral bullets from RSS excerpts/headlines — no AI. */
export function buildAntiClickbaitBullets(
  articles: ArticleWithSource[],
  fallback?: AntiClickbaitFallback,
): string[] {
  const out: string[] = [];
  const seenSources = new Set<string>();

  const sorted = [...articles].sort((a, b) => a.sourceName.localeCompare(b.sourceName, "en"));

  for (const article of sorted) {
    if (out.length >= ANTI_CLICKBAIT_BULLET_COUNT) break;
    const sourceKey = article.sourceName.toLowerCase();
    if (seenSources.has(sourceKey)) continue;
    const text = candidateFromArticle(article);
    if (!text) continue;
    seenSources.add(sourceKey);
    pushBullet(out, text);
  }

  if (out.length < ANTI_CLICKBAIT_BULLET_COUNT) {
    for (const article of sorted) {
      if (out.length >= ANTI_CLICKBAIT_BULLET_COUNT) break;
      const alt = antiClickbaitText(article.headline);
      pushBullet(out, alt);
    }
  }

  if (out.length < ANTI_CLICKBAIT_BULLET_COUNT && fallback) {
    const pool = [fallback.summaryBn, fallback.summary].filter(Boolean).join(" ");
    for (const sentence of splitSentences(pool)) {
      if (out.length >= ANTI_CLICKBAIT_BULLET_COUNT) break;
      pushBullet(out, sentence);
    }
  }

  return out.slice(0, ANTI_CLICKBAIT_BULLET_COUNT);
}

export function formatBulletsForFeed(bullets: string[]): string {
  return bullets.join(" · ");
}
