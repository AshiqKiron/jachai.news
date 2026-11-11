import { buildFeedCatalog, isFeedEnabled } from "./lib/feeds.js";
import { getSettings, saveSettings } from "./lib/storage.js";

const form = document.getElementById("settingsForm");
const saveMsg = document.getElementById("saveMsg");
const sectionList = document.getElementById("sectionList");
const sectionsPanel = document.getElementById("sectionsPanel");
const singleFeedWrap = document.getElementById("singleFeedWrap");
const discoverStatus = document.getElementById("discoverStatus");
const customFeedRows = document.getElementById("customFeedRows");
const addCustomFeedBtn = document.getElementById("addCustomFeed");
const customFeedsSection = document.getElementById("customFeedsSection");

/** @type {import("./lib/storage.js").ExtensionSettings | null} */
let currentSettings = null;

function getCollectionMode() {
  const checked = form.querySelector('input[name="collectionMode"]:checked');
  return checked?.value === "single" ? "single" : "sections";
}

function syncModeUi() {
  const single = getCollectionMode() === "single";
  sectionsPanel.hidden = single;
  singleFeedWrap.hidden = !single;
}

function appendCustomFeedRow(feed) {
  const row = document.createElement("div");
  row.className = "custom-feed-row";
  const id = feed?.id ?? `custom-${crypto.randomUUID()}`;

  const enableCb = document.createElement("input");
  enableCb.type = "checkbox";
  enableCb.className = "custom-enabled";
  enableCb.title = "Include when collecting";
  const enMap = currentSettings?.enabledSectionIds ?? {};
  enableCb.checked = enMap[id] !== false;

  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.className = "custom-label";
  labelInput.placeholder = "Label (e.g. BD News)";
  labelInput.dataset.feedId = id;
  enableCb.dataset.sectionId = id;
  if (typeof feed?.label === "string") labelInput.value = feed.label;

  const urlInput = document.createElement("input");
  urlInput.type = "url";
  urlInput.className = "custom-url";
  urlInput.placeholder = "https://example.com/feed.xml";
  if (typeof feed?.url === "string") urlInput.value = feed.url;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-custom";
  removeBtn.title = "Remove";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => row.remove());

  row.append(enableCb, labelInput, urlInput, removeBtn);
  customFeedRows.appendChild(row);
}

function collectCustomFeedsFromDom() {
  /** @type {Array<{ id: string, label: string, url: string }>} */
  const feeds = [];
  customFeedRows.querySelectorAll(".custom-feed-row").forEach((row) => {
    const labelInput = row.querySelector(".custom-label");
    const urlInput = row.querySelector(".custom-url");
    const enableEl = row.querySelector(".custom-enabled");
    const id =
      labelInput?.dataset.feedId?.trim() ||
      `custom-${crypto.randomUUID()}`;
    const label = labelInput?.value?.trim() ?? "";
    const url = urlInput?.value?.trim() ?? "";
    if (!url) return;
    feeds.push({ id, label: label || url, url });
    if (enableEl) {
      enableEl.dataset.sectionId = id;
    }
  });
  return feeds;
}

async function renderSectionList() {
  const s = currentSettings ?? (await getSettings());
  currentSettings = s;
  const catalog = buildFeedCatalog(s);
  sectionList.innerHTML = "";

  for (const feed of catalog) {
    const id = `section-${feed.id}`;
    const label = document.createElement("label");
    label.className = "checkbox section-item";
    label.innerHTML = `
      <input type="checkbox" data-section-id="${feed.id}" id="${id}" />
      <span class="section-label"></span>
      <code class="section-url"></code>
    `;
    label.querySelector(".section-label").textContent = feed.label;
    label.querySelector(".section-url").textContent = feed.url;
    const input = label.querySelector("input");
    input.checked = isFeedEnabled(s, feed.id);
    sectionList.appendChild(label);
  }
}

function renderCustomFeedRows() {
  customFeedRows.innerHTML = "";
  const feeds = currentSettings?.customFeeds ?? [];
  if (feeds.length === 0) {
    appendCustomFeedRow(null);
    return;
  }
  for (const f of feeds) {
    appendCustomFeedRow(f);
  }
}

async function load() {
  currentSettings = await getSettings();
  document.getElementById("feedUrl").value = currentSettings.feedUrl;
  document.getElementById("downloadFolder").value =
    currentSettings.downloadFolder;
  document.getElementById("saveFormat").value = currentSettings.saveFormat;
  document.getElementById("autoSaveToDisk").checked =
    currentSettings.autoSaveToDisk;
  document.getElementById("saveLatestCopy").checked =
    currentSettings.saveLatestCopy;
  document.getElementById("savePerFeedFiles").checked =
    currentSettings.savePerFeedFiles;
  document.getElementById("saveMergedSummary").checked =
    currentSettings.saveMergedSummary;
  document.getElementById("scheduleEnabled").checked =
    currentSettings.scheduleEnabled;
  document.getElementById("scheduleIntervalValue").value = String(
    currentSettings.scheduleIntervalValue,
  );
  document.getElementById("scheduleIntervalUnit").value =
    currentSettings.scheduleIntervalUnit;

  const mode =
    currentSettings.collectionMode === "single" ? "single" : "sections";
  form.querySelector(`input[name="collectionMode"][value="${mode}"]`).checked =
    true;

  renderCustomFeedRows();
  await renderSectionList();
  syncModeUi();

  const ver = document.getElementById("extVersion");
  if (ver && chrome.runtime?.getManifest) {
    ver.textContent = `Extension v${chrome.runtime.getManifest().version} — reload on chrome://extensions if this looks old.`;
  }
}

form.querySelectorAll('input[name="collectionMode"]').forEach((el) => {
  el.addEventListener("change", syncModeUi);
});

addCustomFeedBtn.addEventListener("click", () => {
  appendCustomFeedRow(null);
});

document.getElementById("selectAllSections").addEventListener("click", () => {
  sectionList.querySelectorAll("input[type=checkbox]").forEach((el) => {
    el.checked = true;
  });
});

document.getElementById("clearSections").addEventListener("click", () => {
  sectionList.querySelectorAll("input[type=checkbox]").forEach((el) => {
    el.checked = false;
  });
});

document.getElementById("discoverFeeds").addEventListener("click", async () => {
  discoverStatus.textContent = "Scanning sitemap (may take a minute)…";
  try {
    const response = await chrome.runtime.sendMessage({
      type: "DISCOVER_FEEDS",
    });
    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    if (!response?.ok) {
      throw new Error(response?.error ?? "Discovery failed");
    }
    currentSettings = {
      ...currentSettings,
      discoveredSectionFeeds: response.feeds,
    };
    await renderSectionList();
    discoverStatus.textContent = `Found ${response.feeds.length} section RSS feeds.`;
  } catch (err) {
    discoverStatus.textContent =
      err instanceof Error ? err.message : String(err);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  saveMsg.textContent = "";

  const customFeeds = collectCustomFeedsFromDom();
  /** @type {Record<string, boolean>} */
  const enabledSectionIds = {};
  sectionList.querySelectorAll("input[data-section-id]").forEach((el) => {
    enabledSectionIds[el.dataset.sectionId] = el.checked;
  });
  customFeedRows.querySelectorAll(".custom-enabled").forEach((el) => {
    const sid = el.dataset.sectionId;
    if (sid) enabledSectionIds[sid] = el.checked;
  });
  for (const f of customFeeds) {
    if (enabledSectionIds[f.id] === undefined) {
      enabledSectionIds[f.id] = true;
    }
  }

  let intervalValue = parseInt(
    String(document.getElementById("scheduleIntervalValue").value),
    10,
  );
  if (!Number.isFinite(intervalValue) || intervalValue < 1) {
    intervalValue = 1;
  }

  const savePerFeedFiles = document.getElementById("savePerFeedFiles").checked;
  let saveMergedSummary = document.getElementById("saveMergedSummary").checked;
  let guardMsg = "";
  if (!savePerFeedFiles && !saveMergedSummary) {
    saveMergedSummary = true;
    document.getElementById("saveMergedSummary").checked = true;
    guardMsg =
      "Turned combined snapshot on — choose at least one output mode. ";
  }

  const patch = {
    collectionMode: getCollectionMode(),
    feedUrl: document.getElementById("feedUrl").value.trim(),
    customFeeds,
    enabledSectionIds,
    downloadFolder:
      document.getElementById("downloadFolder").value.trim() ||
      "prothomalo-feed",
    saveFormat: document.getElementById("saveFormat").value,
    autoSaveToDisk: document.getElementById("autoSaveToDisk").checked,
    saveLatestCopy: document.getElementById("saveLatestCopy").checked,
    savePerFeedFiles,
    saveMergedSummary,
    scheduleEnabled: document.getElementById("scheduleEnabled").checked,
    scheduleIntervalValue: intervalValue,
    scheduleIntervalUnit: document.getElementById("scheduleIntervalUnit").value,
  };

  await saveSettings(patch);
  currentSettings = { ...currentSettings, ...patch };
  await chrome.runtime.sendMessage({
    type: "RESCHEDULE_ALARM",
    enabled: patch.scheduleEnabled,
  });

  saveMsg.textContent = `${guardMsg}Saved.`;
  setTimeout(() => {
    saveMsg.textContent = "";
  }, 2500);
});

load();
