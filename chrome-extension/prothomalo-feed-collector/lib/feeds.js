import { parseProthomAloFeed } from "./feed-parser.js";
import { BD_NEWS_FEEDS, BD_NEWS_FEED_ID_SET } from "./bd-sources.js";
import {
  MAIN_LATEST_FEED,
  PROTHOMALO_SECTIONS,
  toSectionFeed,
} from "./prothomalo-sections.js";

/**
 * Whether a catalog feed is active for collection. Bundled BD feeds default to
 * on (opt-out); everything else is opt-in via the enabled map.
 * @param {import("./storage.js").ExtensionSettings} settings
 * @param {string} feedId
 */
export function isFeedEnabled(settings, feedId) {
  const map = settings.enabledSectionIds ?? {};
  if (Object.prototype.hasOwnProperty.call(map, feedId)) {
    return Boolean(map[feedId]);
  }
  return BD_NEWS_FEED_ID_SET.has(feedId);
}

/**
 * @param {import("./storage.js").ExtensionSettings} settings
 * @returns {Array<{ id: string, label: string, url: string }>}
 */
export function resolveActiveFeeds(settings) {
  if (settings.collectionMode === "single") {
    const feeds = [];
    const primary = settings.feedUrl.trim();
    if (primary) {
      feeds.push({ id: "single", label: "Primary URL", url: primary });
    }
    const enabled = settings.enabledSectionIds ?? {};
    for (const cf of settings.customFeeds ?? []) {
      if (!cf?.url?.trim()) continue;
      if (enabled[cf.id] === false) continue;
      feeds.push({
        id: cf.id,
        label: (cf.label ?? "").trim() || cf.url,
        url: cf.url.trim(),
      });
    }
    if (feeds.length === 0) {
      return [MAIN_LATEST_FEED];
    }
    return feeds;
  }

  const catalog = buildFeedCatalog(settings);
  const picked = catalog.filter((f) => isFeedEnabled(settings, f.id));

  if (picked.length === 0) {
    return [MAIN_LATEST_FEED];
  }

  return picked.map((f) => ({
    id: f.id,
    label: f.label,
    url: f.url,
  }));
}

/**
 * @param {import("./storage.js").ExtensionSettings} settings
 */
export function buildFeedCatalog(settings) {
  const byId = new Map();

  byId.set(MAIN_LATEST_FEED.id, MAIN_LATEST_FEED);

  for (const section of PROTHOMALO_SECTIONS) {
    const feed = toSectionFeed(section);
    byId.set(feed.id, feed);
  }

  for (const feed of BD_NEWS_FEEDS) {
    byId.set(feed.id, feed);
  }

  for (const extra of settings.discoveredSectionFeeds ?? []) {
    if (!byId.has(extra.id)) byId.set(extra.id, extra);
  }

  for (const custom of settings.customFeeds ?? []) {
    if (!custom?.id || !custom?.url?.trim()) continue;
    const label = (custom.label ?? "").trim() || feedLabelFromUrl(custom.url);
    byId.set(custom.id, {
      id: custom.id,
      label,
      url: custom.url.trim(),
    });
  }

  return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function feedLabelFromUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "Custom RSS";
  }
}

/**
 * @param {{ id: string, label: string, url: string }} feed
 */
export async function fetchFeedArticles(feed) {
  const res = await fetch(feed.url, {
    redirect: "follow",
    headers: { Accept: "application/rss+xml, application/xml, text/xml, */*" },
  });
  if (!res.ok) {
    throw new Error(`${feed.label}: HTTP ${res.status}`);
  }

  const xml = await res.text();
  const parsed = parseProthomAloFeed(xml, { allowEmpty: true });
  const collectedAt = new Date().toISOString();

  return parsed
    .filter((item) => item.title?.trim() && item.link?.trim())
    .map((item) => ({
      ...item,
      collectedAt,
      section: feed.label,
      sectionId: feed.id,
      sourceFeedUrl: res.url || feed.url,
      sections: [feed.label],
    }));
}

/**
 * @param {Array<object>} articles
 */
export function dedupeArticlesByLink(articles) {
  /** @type {Map<string, object>} */
  const byLink = new Map();

  for (const article of articles) {
    const key = article.link?.trim();
    if (!key) continue;

    const existing = byLink.get(key);
    if (!existing) {
      byLink.set(key, { ...article });
      continue;
    }

    existing.sections = unique([
      ...(existing.sections ?? [existing.section].filter(Boolean)),
      ...(article.sections ?? [article.section].filter(Boolean)),
    ]);
    existing.categories = unique([
      ...(existing.categories ?? []),
      ...(article.categories ?? []),
    ]);
    if (!existing.imageUrl && article.imageUrl) {
      existing.imageUrl = article.imageUrl;
    }
  }

  return [...byLink.values()];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

/**
 * @param {import("./storage.js").ExtensionSettings} settings
 */
export async function collectFromFeeds(settings) {
  const feeds = resolveActiveFeeds(settings);
  const errors = [];
  const feedStats = [];
  let articles = [];

  /** @type {Array<{ id: string, label: string, url: string, articles: object[] }>} */
  const articlesByFeed = [];

  for (const feed of feeds) {
    try {
      const batch = await fetchFeedArticles(feed);
      const dedupedBatch = dedupeArticlesByLink(batch);
      feedStats.push({
        id: feed.id,
        label: feed.label,
        url: feed.url,
        count: dedupedBatch.length,
      });
      articlesByFeed.push({
        id: feed.id,
        label: feed.label,
        url: feed.url,
        articles: dedupedBatch,
      });
      articles = articles.concat(dedupedBatch);
    } catch (err) {
      feedStats.push({
        id: feed.id,
        label: feed.label,
        url: feed.url,
        count: 0,
      });
      errors.push({
        feed: feed.label,
        url: feed.url,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  articles = dedupeArticlesByLink(articles);

  if (articles.length === 0) {
    const detail =
      errors.length > 0
        ? errors.map((e) => `${e.feed}: ${e.error}`).join("; ")
        : "No feeds returned articles.";
    throw new Error(detail);
  }

  return {
    articles,
    articlesByFeed,
    feeds,
    feedStats,
    errors,
    tabUrl: feeds[0]?.url ?? MAIN_LATEST_FEED.url,
  };
}
