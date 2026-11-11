/** @typedef {{ saveAs?: boolean, conflictAction?: 'overwrite' | 'uniquify' | 'prompt' }} DownloadOptions */

/**
 * @param {Array<{ collectedAt: string, title: string, link: string, imageUrl: string, pubDate: string }>} articles
 */
export function articlesToCsv(articles) {
  const header = [
    "collectedAt",
    "section",
    "sections",
    "categories",
    "title",
    "link",
    "imageUrl",
    "pubDate",
    "sourceFeedUrl",
  ];
  const rows = articles.map((a) =>
    header
      .map((key) => {
        if (key === "sections" || key === "categories") {
          const list = a[key];
          return csvCell(Array.isArray(list) ? list.join(" | ") : "");
        }
        return csvCell(a[key] ?? "");
      })
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

function csvCell(value) {
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

export function timestampForFilename(date = new Date()) {
  return date.toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

function sanitizeDownloadFolder(folder) {
  const trimmed = String(folder ?? "").trim() || "prothomalo-feed";
  return trimmed
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

function buildPath(folder, name) {
  const safeFolder = sanitizeDownloadFolder(folder);
  return safeFolder ? `${safeFolder}/${name}` : name;
}

/** Safe segment for subfolders / filenames (feed id, label slug). */
export function safeFeedFileSlug(id, label) {
  const raw = String(id ?? "").trim() || String(label ?? "").trim() || "feed";
  let s = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  if (!s) s = "feed";
  return s.slice(0, 80);
}

/** UTF-8 safe data URL (works in MV3 service worker; no blob revoke race). */
function textToDataUrl(text, mime) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${mime};charset=utf-8;base64,${base64}`;
}

const MAX_DATA_URL_CHARS = 1_800_000;

/**
 * @param {number} downloadId
 */
function waitForDownload(downloadId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.downloads.onChanged.removeListener(onChanged);
      resolve();
    }, 90_000);

    function finish(err) {
      clearTimeout(timeout);
      chrome.downloads.onChanged.removeListener(onChanged);
      if (err) reject(err);
      else resolve();
    }

    function onChanged(delta) {
      if (delta.id !== downloadId) return;
      if (delta.state?.current === "complete") finish();
      if (delta.error?.current) {
        finish(new Error(`Download failed: ${delta.error.current}`));
      }
    }

    chrome.downloads.onChanged.addListener(onChanged);
    chrome.downloads.search({ id: downloadId }, (items) => {
      const item = items?.[0];
      if (item?.state === "complete") finish();
      if (item?.error) finish(new Error(`Download failed: ${item.error}`));
    });
  });
}

/**
 * @param {string} payload
 * @param {string} filename
 * @param {string} mime
 * @param {DownloadOptions} options
 */
export function downloadBlob(payload, filename, mime, options = {}) {
  const saveAs = options.saveAs ?? true;
  const conflictAction = options.conflictAction ?? "uniquify";

  let url;
  let blobUrl = null;

  if (payload.length <= MAX_DATA_URL_CHARS) {
    url = textToDataUrl(payload, mime);
  } else {
    const blob = new Blob([payload], { type: mime });
    blobUrl = URL.createObjectURL(blob);
    url = blobUrl;
  }

  return new Promise((resolve, reject) => {
    chrome.downloads.download(
      { url, filename, saveAs, conflictAction },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (downloadId === undefined) {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          reject(
            new Error(
              "Download blocked. In Chrome, allow this extension to download files (multiple downloads).",
            ),
          );
          return;
        }

        waitForDownload(downloadId)
          .then(() => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            resolve({ downloadId, filename });
          })
          .catch((err) => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            reject(err);
          });
      },
    );
  });
}

/**
 * Writes JSON/CSV snapshot into a path relative to Downloads root.
 * @param {Array<object>} articles
 * @param {string} relativeDir path under download root, e.g. "prothomalo-feed" or "prothomalo-feed/feeds/bangladesh"
 * @param {string} filePrefix filename prefix before timestamp, e.g. "prothomalo-feed" or "bangladesh"
 * @param {{ saveFormat?: string, saveLatestCopy?: boolean }} settings
 * @param {string} [latestBasename] overwrite target base name (default `latest` → latest.json)
 */
async function persistArticlesToRelativeDir(
  articles,
  relativeDir,
  filePrefix,
  settings,
  latestBasename = "latest",
) {
  const format = settings.saveFormat ?? "json";
  const saveLatest = settings.saveLatestCopy !== false;
  const stamp = timestampForFilename();
  const savedFiles = [];

  const jsonBody = JSON.stringify(articles, null, 2);
  const csvBody = articlesToCsv(articles);

  if (format === "json" || format === "both") {
    savedFiles.push(
      await downloadBlob(
        jsonBody,
        buildPath(relativeDir, `${filePrefix}-${stamp}.json`),
        "application/json",
        { saveAs: false, conflictAction: "uniquify" },
      ),
    );
    if (saveLatest) {
      savedFiles.push(
        await downloadBlob(
          jsonBody,
          buildPath(relativeDir, `${latestBasename}.json`),
          "application/json",
          { saveAs: false, conflictAction: "overwrite" },
        ),
      );
    }
  }

  if (format === "csv" || format === "both") {
    savedFiles.push(
      await downloadBlob(
        csvBody,
        buildPath(relativeDir, `${filePrefix}-${stamp}.csv`),
        "text/csv",
        { saveAs: false, conflictAction: "uniquify" },
      ),
    );
    if (saveLatest) {
      savedFiles.push(
        await downloadBlob(
          csvBody,
          buildPath(relativeDir, `${latestBasename}.csv`),
          "text/csv",
          { saveAs: false, conflictAction: "overwrite" },
        ),
      );
    }
  }

  return savedFiles.map((f) => f.filename);
}

/**
 * @param {Array<object>} articles merged (deduped) list
 * @param {import("./storage.js").ExtensionSettings} settings
 * @param {{ articlesByFeed?: Array<{ id: string, label: string, articles: object[] }> }} [extras]
 */
export async function persistArticlesToDisk(articles, settings, extras = {}) {
  const articlesByFeed = extras.articlesByFeed ?? [];
  const folder = settings.downloadFolder ?? "prothomalo-feed";
  const savePerFeed = settings.savePerFeedFiles !== false;
  const saveMerged = settings.saveMergedSummary !== false;

  if (!savePerFeed && !saveMerged) {
    return persistArticlesToRelativeDir(
      articles,
      folder,
      "prothomalo-feed",
      settings,
    );
  }

  const allFiles = [];

  if (saveMerged && articles.length > 0) {
    const mergedFiles = await persistArticlesToRelativeDir(
      articles,
      folder,
      "prothomalo-feed",
      settings,
    );
    allFiles.push(...mergedFiles);
  }

  if (savePerFeed && articlesByFeed.length > 0) {
    for (const chunk of articlesByFeed) {
      if (!chunk.articles?.length) continue;
      const slug = safeFeedFileSlug(chunk.id, chunk.label);
      const files = await persistArticlesToRelativeDir(
        chunk.articles,
        folder,
        slug,
        settings,
        slug,
      );
      allFiles.push(...files);
    }
  }

  return allFiles;
}
