import { collectFromFeeds } from "./feeds.js";
import { persistArticlesToDisk } from "./export-local.js";
import { MAIN_LATEST_FEED } from "./prothomalo-sections.js";
import { periodMinutesFromSettings } from "./schedule.js";
import { getSettings, saveLastCollection } from "./storage.js";

export const FEED_URL_DEFAULT = MAIN_LATEST_FEED.url;
export const ALARM_NAME = "prothomalo-hourly-collect";

/**
 * @param {string} feedUrl
 */
export async function openFeedTab(feedUrl) {
  return chrome.tabs.create({ url: feedUrl, active: true });
}

/**
 * @param {string} [_feedUrl]
 * @param {{ reason?: string, saveToDisk?: boolean }} options
 */
export async function runCollection(_feedUrl, options = {}) {
  const settings = await getSettings();
  const reason = options.reason ?? "manual";

  const { articles, articlesByFeed, feeds, feedStats, errors, tabUrl } =
    await collectFromFeeds(settings);

  let savedFiles = [];
  let saveError = null;
  const shouldSave =
    options.saveToDisk !== false && settings.autoSaveToDisk;

  if (shouldSave) {
    try {
      savedFiles = await persistArticlesToDisk(articles, settings, {
        articlesByFeed,
      });
    } catch (err) {
      saveError = err instanceof Error ? err.message : String(err);
    }
  }

  await saveLastCollection(articles, {
    reason,
    collectionMode: settings.collectionMode,
    feeds: feedStats,
    feedErrors: errors,
    count: articles.length,
    savedFiles,
    saveError,
    perFeedCounts: articlesByFeed.map((f) => ({
      id: f.id,
      label: f.label,
      count: f.articles.length,
    })),
  });

  await openFeedTab(tabUrl);

  if (saveError) {
    throw new Error(
      `Collected ${articles.length} articles but file save failed: ${saveError}`,
    );
  }

  return {
    articles,
    count: articles.length,
    savedFiles,
    feeds: feedStats,
    feedErrors: errors,
  };
}

/**
 * @param {boolean} enabled
 * @param {import("./storage.js").ExtensionSettings} [settings]
 */
export async function scheduleCollectAlarm(enabled, settings) {
  await new Promise((r) => chrome.alarms.clear(ALARM_NAME, r));

  if (!enabled) return;

  const s = settings ?? (await getSettings());
  const periodMinutes = periodMinutesFromSettings(s);

  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: periodMinutes,
    delayInMinutes: periodMinutes,
  });
}
