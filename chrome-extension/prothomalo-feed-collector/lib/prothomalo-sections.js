export const COLLECTION_RSS_BASE =
  "https://www.prothomalo.com/api/v1/collections";

export const SITEMAP_SECTIONS_URL =
  "https://www.prothomalo.com/sitemap/sitemap-section.xml";

/** @typedef {{ id: string, label: string, path: string, url: string }} SectionFeed */

export const MAIN_LATEST_FEED = {
  id: "stories",
  label: "All latest (stories.rss)",
  path: "stories.rss",
  url: "https://www.prothomalo.com/stories.rss",
};

/** Top-level Prothom Alo collection feeds (verified 200). */
export const PROTHOMALO_SECTIONS = [
  { id: "home", label: "Home", path: "home" },
  { id: "bangladesh", label: "Bangladesh", path: "bangladesh" },
  { id: "politics", label: "Politics", path: "politics" },
  { id: "business", label: "Business", path: "business" },
  { id: "sports", label: "Sports", path: "sports" },
  { id: "world", label: "World", path: "world" },
  { id: "entertainment", label: "Entertainment", path: "entertainment" },
  { id: "technology", label: "Technology", path: "technology" },
  { id: "education", label: "Education", path: "education" },
  { id: "opinion", label: "Opinion", path: "opinion" },
  { id: "lifestyle", label: "Lifestyle", path: "lifestyle" },
  { id: "religion", label: "Religion", path: "religion" },
  { id: "video", label: "Video", path: "video" },
  { id: "photo", label: "Photo", path: "photo" },
  { id: "onnoalo", label: "Onno Alo", path: "onnoalo" },
  { id: "chakri", label: "Jobs (Chakri)", path: "chakri" },
  { id: "fun", label: "Fun", path: "fun" },
];

/**
 * @param {string} sitePath e.g. `bangladesh` or `video/sports`
 */
export function collectionUrlFromPath(sitePath) {
  const slug = sitePath.replace(/^\/+|\/+$/g, "").replace(/\//g, "-");
  return `${COLLECTION_RSS_BASE}/${slug}.rss`;
}

/**
 * @param {{ id: string, label: string, path: string }} section
 * @returns {SectionFeed}
 */
export function toSectionFeed(section) {
  const path = section.path.replace(/^\/+|\/+$/g, "");
  const url =
    path.endsWith(".rss") || path.startsWith("http")
      ? path.startsWith("http")
        ? path
        : `https://www.prothomalo.com/${path}`
      : collectionUrlFromPath(path);
  return {
    id: section.id,
    label: section.label,
    path,
    url,
  };
}

/**
 * @param {string} xml
 * @returns {string[]}
 */
export function parseSitemapSectionPaths(xml) {
  const paths = new Set();
  const re = /<loc>\s*https:\/\/www\.prothomalo\.com\/([^<\s]+)\s*<\/loc>/gi;
  let m = re.exec(xml);
  while (m) {
    const raw = m[1].replace(/\/+$/, "");
    if (raw && raw !== "poll") paths.add(raw);
    m = re.exec(xml);
  }
  return [...paths];
}

/**
 * Probe which sitemap paths expose a collection RSS feed.
 * @returns {Promise<SectionFeed[]>}
 */
export async function discoverSectionFeedsFromSitemap() {
  const res = await fetch(SITEMAP_SECTIONS_URL);
  if (!res.ok) {
    throw new Error(`Sitemap fetch failed: HTTP ${res.status}`);
  }
  const xml = await res.text();
  const paths = parseSitemapSectionPaths(xml);
  const found = [];

  for (const path of paths) {
    const url = collectionUrlFromPath(path);
    try {
      const probe = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { Range: "bytes=0-2048" },
      });
      if (!probe.ok) continue;
      const sample = await probe.text();
      if (!/<\s*rss[\s>]/i.test(sample) && !/<item\b/i.test(sample)) continue;
      const label = pathLabel(path);
      found.push({
        id: path.replace(/\//g, "-"),
        label,
        path,
        url,
      });
    } catch {
      // skip unreachable paths
    }
  }

  found.sort((a, b) => a.label.localeCompare(b.label));
  return found;
}

function pathLabel(path) {
  return path
    .split("/")
    .map((part) => part.replace(/-/g, " "))
    .join(" · ");
}
