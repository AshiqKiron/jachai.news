import { articlesToCsv, downloadBlob } from "./lib/export-local.js";
import { describeSchedule } from "./lib/schedule.js";
import { getLastCollection, getSettings } from "./lib/storage.js";

const statusEl = document.getElementById("status");
const runBtn = document.getElementById("runNow");
const exportJsonBtn = document.getElementById("exportJson");
const exportCsvBtn = document.getElementById("exportCsv");
const openOptions = document.getElementById("openOptions");
const popupVersion = document.getElementById("popupVersion");

let cachedArticles = [];

if (popupVersion && chrome.runtime?.getManifest) {
  popupVersion.textContent = `v${chrome.runtime.getManifest().version}`;
}

function setStatus(text, kind = "") {
  statusEl.textContent = text;
  statusEl.className = `status ${kind}`.trim();
}

async function refreshStatus() {
  const settings = await getSettings();
  const { articles, meta } = await getLastCollection();
  cachedArticles = articles;

  const sched =
    settings.scheduleEnabled === true
      ? describeSchedule(settings)
      : "disabled";
  const disk = settings.autoSaveToDisk
    ? `Auto-save: Downloads/${settings.downloadFolder} (${settings.saveFormat})`
    : "Auto-save off";

  if (meta?.savedAt) {
    const feedLine =
      meta.feeds?.length > 0
        ? `\nFeeds: ${meta.feeds.map((f) => `${f.label} (${f.count})`).join(", ")}`
        : "";
    const files =
      meta.savedFiles?.length > 0
        ? `\nFiles: ${meta.savedFiles.join(", ")}`
        : meta.saveError
          ? `\nSave error: ${meta.saveError}`
          : "";
    setStatus(
      `Last run: ${new Date(meta.savedAt).toLocaleString()}\n${meta.count ?? articles.length} articles · Schedule: ${sched}\n${disk}${feedLine}${files}`,
      meta.saveError ? "error" : "ok",
    );
  } else {
    setStatus(`No collection yet. Schedule: ${sched}. ${disk}`);
  }

  exportJsonBtn.disabled = articles.length === 0;
  exportCsvBtn.disabled = articles.length === 0;
}

runBtn.addEventListener("click", async () => {
  runBtn.disabled = true;
  setStatus("Fetching feed and saving files…");
  try {
    const response = await chrome.runtime.sendMessage({
      type: "RUN_COLLECT",
      reason: "manual",
    });
    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    if (!response?.ok) {
      throw new Error(response?.error ?? "Collection failed");
    }
    const fileNote =
      response.savedFiles?.length > 0
        ? ` Saved ${response.savedFiles.length} file(s) to Downloads.`
        : " (No files — check Settings → auto-save.)";
    const feedNote =
      response.feeds?.length > 0
        ? `\nFeeds: ${response.feeds.map((f) => `${f.label} (${f.count})`).join(", ")}`
        : "";
    setStatus(
      `Done — ${response.count} unique articles.${fileNote}${feedNote}\nOpened first feed tab when finished.`,
      "ok",
    );
    await refreshStatus();
  } catch (err) {
    setStatus(err instanceof Error ? err.message : String(err), "error");
  } finally {
    runBtn.disabled = false;
  }
});

exportJsonBtn.addEventListener("click", async () => {
  if (cachedArticles.length === 0) return;
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  await downloadBlob(
    JSON.stringify(cachedArticles, null, 2),
    `prothomalo-feed-${stamp}.json`,
    "application/json",
    { saveAs: true },
  );
});

exportCsvBtn.addEventListener("click", async () => {
  if (cachedArticles.length === 0) return;
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  await downloadBlob(
    articlesToCsv(cachedArticles),
    `prothomalo-feed-${stamp}.csv`,
    "text/csv",
    { saveAs: true },
  );
});

openOptions.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

refreshStatus();
