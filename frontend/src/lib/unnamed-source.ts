/** One outlet's headline and excerpt, after the cluster is enriched. */
export type UnnamedSourceOutlet = {
  sourceName: string;
  headline: string;
  excerpt: string;
};

export type UnnamedSourceAnalysis = {
  outletCount: number;
  unnamedCount: number;
  /** Outlets that attributed the story to someone they did not name. */
  hidName: string[];
  /** Outlets that did not use an unnamed-source marker — they printed a name. */
  printedName: string[];
};

/**
 * Phrases that attribute a story to someone the paper does not name.
 * `সূত্রপাত` (origin) is not an unnamed source.
 */
const UNNAMED_SOURCE_PATTERNS: RegExp[] = [
  /সূত্র(?!পাত)/u,
  /নাম\s*প্রকাশে\s*অনিচ্ছুক/u,
  /সংশ্লিষ্ট/u,
  /\bsources?\s+say(?:s|ing)?\b/iu,
  /\bsources?\s+said\b/iu,
];

function countPhrase(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** True when a headline or excerpt attributes the story to an unnamed source. */
export function textHidesSourceName(text: string): boolean {
  if (!text.trim()) return false;
  return UNNAMED_SOURCE_PATTERNS.some((pattern) => pattern.test(text));
}

/** English sentence, e.g. "4 of 6 outlets attribute this to someone they don't name." */
export function unnamedSourceCountEn(analysis: UnnamedSourceAnalysis): string {
  const verb = analysis.unnamedCount === 1 ? "attributes" : "attribute";
  const outlets = countPhrase(analysis.outletCount, "outlet", "outlets");
  return `${analysis.unnamedCount} of ${outlets} ${verb} this to someone they don't name.`;
}

/** Bangla sentence parallel to {@link unnamedSourceCountEn}. */
export function unnamedSourceCountBn(analysis: UnnamedSourceAnalysis): string {
  return `${analysis.outletCount}টির মধ্যে ${analysis.unnamedCount}টি আউটলেট নাম না বলে কাউকে দায়ী করেছে।`;
}

/**
 * Counts outlets that hide a name behind সূত্র, নাম প্রকাশে অনিচ্ছুক, সংশ্লিষ্ট, or "sources say".
 * Returns null unless at least two outlets are present and one of them hides a name.
 * An outlet counts as hiding the name when any of its headlines or excerpts match.
 */
export function analyzeUnnamedSource(
  outlets: UnnamedSourceOutlet[],
): UnnamedSourceAnalysis | null {
  const bySource = new Map<string, { sourceName: string; hidName: boolean }>();

  for (const outlet of outlets) {
    const sourceName = outlet.sourceName.trim();
    if (!sourceName) continue;
    const key = sourceName.toLowerCase();
    const hidName = textHidesSourceName(`${outlet.headline}\n${outlet.excerpt}`);
    const existing = bySource.get(key);
    if (!existing) {
      bySource.set(key, { sourceName, hidName });
      continue;
    }
    if (hidName) existing.hidName = true;
  }

  const rows = [...bySource.values()];
  if (rows.length < 2) return null;

  const hidName = rows
    .filter((row) => row.hidName)
    .map((row) => row.sourceName)
    .sort((left, right) => left.localeCompare(right));
  if (hidName.length === 0) return null;

  const printedName = rows
    .filter((row) => !row.hidName)
    .map((row) => row.sourceName)
    .sort((left, right) => left.localeCompare(right));

  return {
    outletCount: rows.length,
    unnamedCount: hidName.length,
    hidName,
    printedName,
  };
}
