import type { ArticleWithSource } from "@/lib/coverage";
import { enrichArticles } from "@/lib/coverage";
import type { Story } from "@/lib/demo-data";
import { PERSPECTIVE_META, type Perspective } from "@/lib/perspectives";

const MAX_SNIPPET_CHARS = 220;
const MAX_SNIPPETS_ALL = 5;
const MAX_SNIPPETS_PER_PERSPECTIVE = 3;
const MIN_EXCERPT_CHARS = 40;

export type SourceDigestSnippet = {
  sourceName: string;
  text: string;
};

const HTML_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

function decodeBasicEntities(text: string): string {
  let out = text;
  for (const [entity, char] of Object.entries(HTML_ENTITY_MAP)) {
    out = out.split(entity).join(char);
  }
  out = out.replace(/&#(\d+);/g, (_, code) => {
    const n = Number.parseInt(code, 10);
    return Number.isFinite(n) ? String.fromCodePoint(n) : _;
  });
  return out;
}

export function cleanSourceText(raw: string): string {
  const withoutTags = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeBasicEntities(withoutTags).replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.trim()}…`;
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
  return union > 0 && intersection / union >= 0.72;
}

function snippetTextForArticle(article: ArticleWithSource): string {
  const excerpt = cleanSourceText(article.excerpt ?? "");
  const headline = cleanSourceText(article.headline);
  if (excerpt.length >= MIN_EXCERPT_CHARS) return truncate(excerpt, MAX_SNIPPET_CHARS);
  if (excerpt.length > 0) return truncate(excerpt, MAX_SNIPPET_CHARS);
  if (headline.length > 0) return truncate(headline, MAX_SNIPPET_CHARS);
  return "";
}

function pickSnippets(articles: ArticleWithSource[], max: number): SourceDigestSnippet[] {
  const seenSources = new Set<string>();
  const out: SourceDigestSnippet[] = [];
  const sorted = [...articles].sort((a, b) => a.sourceName.localeCompare(b.sourceName, "en"));

  for (const article of sorted) {
    const sourceKey = article.sourceName.toLowerCase();
    if (seenSources.has(sourceKey)) continue;

    const text = snippetTextForArticle(article);
    if (!text) continue;
    if (out.some((row) => isLikelyDuplicate(row.text, text))) continue;

    seenSources.add(sourceKey);
    out.push({ sourceName: article.sourceName, text });
    if (out.length >= max) break;
  }

  return out;
}

export type CoverageDigestFilter = "all" | Perspective;

export function buildCoverageDigest(
  articles: ArticleWithSource[],
  filter: CoverageDigestFilter,
): SourceDigestSnippet[] {
  const pool =
    filter === "all" ? articles : articles.filter((article) => article.perspective === filter);
  const max = filter === "all" ? MAX_SNIPPETS_ALL : MAX_SNIPPETS_PER_PERSPECTIVE;
  return pickSnippets(pool, max);
}

export function formatDigestInline(snippets: SourceDigestSnippet[]): string {
  return snippets.map((row) => `${row.sourceName}: ${row.text}`).join(" · ");
}

export function buildPerspectiveDigests(
  articles: ArticleWithSource[],
): Partial<Record<Perspective, string>> {
  const result: Partial<Record<Perspective, string>> = {};
  for (const perspective of Object.keys(PERSPECTIVE_META) as Perspective[]) {
    const snippets = buildCoverageDigest(articles, perspective);
    if (snippets.length > 0) {
      result[perspective] = formatDigestInline(snippets);
    }
  }
  return result;
}

export function buildStorySourceSummary(articles: ArticleWithSource[]): string {
  const snippets = buildCoverageDigest(articles, "all");
  if (snippets.length === 0) return "";
  if (snippets.length === 1) return snippets[0].text;
  return formatDigestInline(snippets);
}

/** Replace story summary fields with RSS/source text only (no AI cluster summary). */
export function applySourceDerivedSummaries(story: Story): Story {
  if (story.articles.length === 0) return story;

  const articles = enrichArticles(story);
  const summary = buildStorySourceSummary(articles);
  const perspectiveSummaries = buildPerspectiveDigests(articles);

  return {
    ...story,
    summary: summary || story.summary,
    summaryBn: summary || story.summaryBn,
    perspectiveSummaries,
  };
}
