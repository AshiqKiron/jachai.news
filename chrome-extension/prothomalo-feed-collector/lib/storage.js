import { MAIN_LATEST_FEED } from "./prothomalo-sections.js";

const DEFAULTS = {
  collectionMode: "sections",
  feedUrl: MAIN_LATEST_FEED.url,
  enabledSectionIds: { stories: true },
  discoveredSectionFeeds: [],
  /** @type {Array<{ id: string, label: string, url: string }>} */
  customFeeds: [],
  scheduleEnabled: true,
  scheduleIntervalValue: 1,
  scheduleIntervalUnit: "hours",
  /** @deprecated migrated to scheduleEnabled */
  hourlyEnabled: true,
  autoSaveToDisk: true,
  /** One folder per feed under downloads/{folder}/feeds/{slug}/ */
  savePerFeedFiles: true,
  /** Combined snapshot at downloads/{folder}/prothomalo-feed-*.json */
  saveMergedSummary: false,
  saveFormat: "json",
  downloadFolder: "prothomalo-feed",
  saveLatestCopy: true,
};

/** @typedef {typeof DEFAULTS} ExtensionSettings */

function normalizeSettings(stored) {
  const merged = { ...DEFAULTS, ...stored };

  const feed = String(merged.feedUrl ?? "").trim();
  if (
    feed === "https://www.prothomalo.com/feed/" ||
    feed === "https://www.prothomalo.com/feed"
  ) {
    merged.feedUrl = MAIN_LATEST_FEED.url;
  }

  if (!merged.enabledSectionIds || typeof merged.enabledSectionIds !== "object") {
    merged.enabledSectionIds = { stories: true };
  }

  if (!Array.isArray(merged.discoveredSectionFeeds)) {
    merged.discoveredSectionFeeds = [];
  }

  if (!Array.isArray(merged.customFeeds)) {
    merged.customFeeds = [];
  }

  if (
    merged.scheduleEnabled === undefined &&
    merged.hourlyEnabled !== undefined
  ) {
    merged.scheduleEnabled = Boolean(merged.hourlyEnabled);
  }

  if (
    typeof merged.scheduleIntervalValue !== "number" ||
    !Number.isFinite(merged.scheduleIntervalValue) ||
    merged.scheduleIntervalValue < 1
  ) {
    merged.scheduleIntervalValue = 1;
  }

  const u = merged.scheduleIntervalUnit;
  if (u !== "minutes" && u !== "hours" && u !== "days") {
    merged.scheduleIntervalUnit = "hours";
  }

  if (typeof merged.savePerFeedFiles !== "boolean") {
    merged.savePerFeedFiles = DEFAULTS.savePerFeedFiles;
  }
  if (typeof merged.saveMergedSummary !== "boolean") {
    merged.saveMergedSummary = DEFAULTS.saveMergedSummary;
  }

  if (merged.savePerFeedFiles === false && merged.saveMergedSummary === false) {
    merged.saveMergedSummary = true;
  }

  return merged;
}

export const FEED_URL_CANONICAL = MAIN_LATEST_FEED.url;

/** @returns {Promise<ExtensionSettings>} */
export async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return normalizeSettings(stored);
}

/** @param {Partial<ExtensionSettings>} patch */
export async function saveSettings(patch) {
  await chrome.storage.sync.set(patch);
}

/** @param {Array<object>} articles */
export async function saveLastCollection(articles, meta = {}) {
  await chrome.storage.local.set({
    lastArticles: articles,
    lastCollectionMeta: {
      ...meta,
      savedAt: new Date().toISOString(),
    },
  });
}

export async function getLastCollection() {
  const { lastArticles = [], lastCollectionMeta = null } =
    await chrome.storage.local.get(["lastArticles", "lastCollectionMeta"]);
  return { articles: lastArticles, meta: lastCollectionMeta };
}
