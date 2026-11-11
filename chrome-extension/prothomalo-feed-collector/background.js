import {
  ALARM_NAME,
  runCollection,
  scheduleCollectAlarm,
} from "./lib/collect.js";
import { discoverSectionFeedsFromSitemap } from "./lib/prothomalo-sections.js";
import { getSettings, saveSettings } from "./lib/storage.js";

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await scheduleCollectAlarm(settings.scheduleEnabled, settings);
});

chrome.runtime.onStartup.addListener(async () => {
  const settings = await getSettings();
  await scheduleCollectAlarm(settings.scheduleEnabled, settings);
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  try {
    const settings = await getSettings();
    const { count, savedFiles } = await runCollection(undefined, {
      reason: "scheduled",
    });
    const fileHint =
      savedFiles.length > 0
        ? ` Saved to Downloads/${settings.downloadFolder || "prothomalo-feed"}.`
        : "";
    notify(
      "News collection complete",
      `Collected ${count} articles.${fileHint}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    notify("News collection failed", message);
    console.error("[prothomalo-collector]", err);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "RUN_COLLECT") {
    runCollection(message.feedUrl, {
      reason: message.reason ?? "manual",
      saveToDisk: message.saveToDisk,
    })
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) =>
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    return true;
  }

  if (message?.type === "RESCHEDULE_ALARM") {
    const enabled = message.enabled !== false;
    getSettings()
      .then((settings) => scheduleCollectAlarm(enabled, settings))
      .then(() => sendResponse({ ok: true }))
      .catch((err) =>
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    return true;
  }

  if (message?.type === "DISCOVER_FEEDS") {
    discoverSectionFeedsFromSitemap()
      .then(async (feeds) => {
        await saveSettings({ discoveredSectionFeeds: feeds });
        sendResponse({ ok: true, feeds });
      })
      .catch((err) =>
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    return true;
  }

  return false;
});

function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title,
    message: message.slice(0, 240),
  });
}
