/** Bengali script detection and cleanup for headlines (no BN+Latin glued in one word). */

const BENGALI_RE = /\p{Script=Bengali}/u;
const LATIN_RE = /\p{Script=Latin}/u;

/** Common EN loanwords → full Bengali forms (headline transliterations). */
const LOANWORD_EN_TO_BN: Record<string, string> = {
  bangladesh: "বাংলাদেশ",
  remittance: "রেমিট্যান্স",
  semifinal: "সেমিফাইনাল",
  quarterfinal: "কোয়ার্টারফাইনাল",
  final: "ফাইনাল",
};

const GLUED_BN_LATIN_RE = /[\u0980-\u09FF][a-zA-Z]|[a-zA-Z][\u0980-\u09FF]/u;
const SPLIT_BN_LATIN_RE = /(?:^|\s)[\u0980-\u09FF]{1,4}\s+[a-zA-Z]/u;

export function hasBengaliScript(text: string): boolean {
  return BENGALI_RE.test(text);
}

export function hasLatinScript(text: string): boolean {
  return LATIN_RE.test(text);
}

/** True when headline text mixes Bengali + Latin inside or across word boundaries. */
export function containsMixedScriptGlued(text: string): boolean {
  if (!text.trim()) return false;
  return GLUED_BN_LATIN_RE.test(text) || SPLIT_BN_LATIN_RE.test(text);
}

function trailingPunctuation(word: string): { core: string; suffix: string } {
  const m = word.match(/^(.+?)([.,;:!?…\-–—]*)$/u);
  if (!m) return { core: word, suffix: "" };
  return { core: m[1], suffix: m[2] ?? "" };
}

function applyLoanwordSuffix(bnFull: string, suffix: string): string {
  if (!suffix) return bnFull;
  if (suffix === "-এ" || suffix === "‑এ") return `${bnFull}ে`;
  if (suffix.startsWith("-") && suffix.length > 1 && /\p{Script=Bengali}/u.test(suffix.slice(1))) {
    return bnFull + suffix.slice(1);
  }
  return bnFull + suffix;
}

function matchLoanwordFromParts(bnPrefix: string, latinPart: string): string | null {
  const { core, suffix } = trailingPunctuation(latinPart);
  const latLower = core.toLowerCase();
  if (!latLower) return null;

  for (const [en, bnFull] of Object.entries(LOANWORD_EN_TO_BN)) {
    const enLower = en.toLowerCase();
    if (!bnFull.startsWith(bnPrefix)) continue;
    if (enLower.endsWith(latLower) || enLower.includes(latLower) || latLower.includes(enLower.slice(1))) {
      return applyLoanwordSuffix(bnFull, suffix);
    }
  }
  return null;
}

function fixGluedBengaliLatinWord(word: string): string {
  const { core, suffix } = trailingPunctuation(word);
  const glued = core.match(/^([\u0980-\u09FF]+)([a-zA-Z][a-zA-Z-]*)$/u);
  if (!glued) return word;

  const matched = matchLoanwordFromParts(glued[1], glued[2]);
  if (matched) return matched + suffix;

  return word;
}

function fixSplitBengaliLatinWords(text: string): string {
  return text.replace(
    /(^|\s)([\u0980-\u09FF]{1,4})\s+([a-zA-Z][\w-]*)/gu,
    (full, leading, bnPrefix, latinPart) => {
      const matched = matchLoanwordFromParts(bnPrefix, latinPart);
      return matched ? `${leading}${matched}` : full;
    },
  );
}

/** Normalize headline text: one script per word (repair glued / split BN+Latin tokens). */
export function normalizeMixedScriptHeadline(text: string): string {
  if (!text.trim()) return text;
  let normalized = fixSplitBengaliLatinWords(text);
  normalized = normalized
    .split(/(\s+)/)
    .map((part) => (part.trim() === "" ? part : fixGluedBengaliLatinWord(part)))
    .join("");
  return normalized.replace(/\s+/g, " ").trim();
}

export function pickPrimaryBengaliHeadline(headlines: string[]): string | null {
  for (const headline of headlines) {
    const cleaned = headline.trim();
    if (cleaned && hasBengaliScript(cleaned)) return normalizeMixedScriptHeadline(cleaned);
  }
  return null;
}
