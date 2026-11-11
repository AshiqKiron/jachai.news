# Prothom Alo Feed Collector (Chrome Extension)

Collects **article titles, images, section, and RSS categories** from Prothom Alo (and optional extra RSS URLs), **merges multiple feeds**, saves to **Downloads**, and runs on a **configurable schedule**.

## Install

1. `chrome://extensions` → **Developer mode** → **Load unpacked** → `chrome-extension/prothomalo-feed-collector`
2. Click **Reload** on the extension card whenever you pull new code (Settings page title shows **Extension v…** — if the version doesn’t change, you’re still on an old load).
3. Open **Settings**: toolbar icon → **⋮** → **Extension options**, or from the popup link **Settings**.
4. Pick **section feeds**, optional **More RSS URLs**, and **Automatic schedule** → **Save**
5. **Collect now** from the popup

## Schedule

Under **Automatic schedule**, choose **every N minute(s)**, **hour(s)**, or **day(s)**. Chrome’s alarm API runs at least **every 1 minute** (smaller values are clamped). Uncheck **Run collection on a repeating schedule** to disable.

## Bundled Bangladesh news feeds

The extension ships with a verified catalog of major Bangladesh outlets (Prothom Alo BN/EN sections, The Daily Star, TBS, Jagonews24, Jugantor, Bangla Tribune, Dhaka Tribune, BBC Bangla, Risingbd, Channel i, Ajker Patrika, Energy Bangla, and Google News site searches for Kaler Kantho, Ittefaq, Samakal, Somoy News, Dhaka Post, and more). These are defined in `lib/bd-sources.js`.

They appear in the **Section feeds** checklist and are **enabled by default** (opt-out) — a fresh install downloads articles from all of them each run. Uncheck any you don't want and **Save**. Upload the resulting JSON/CSV files via the admin **Sources** → **file** ingest flow.

## Extra feed URLs

In **More RSS URLs**, add label + URL pairs (e.g. another news site’s RSS). They appear in the checklist with Prothom Alo sections — **check** the ones to include each run. The extension needs **`<all_urls>`** host permission to fetch arbitrary HTTPS feeds (Chrome will show this on install/reload).

## Subcategories / sections

Prothom Alo does **not** publish a separate RSS URL for every sub-page (e.g. `bangladesh/capital` often has **no** own feed). It **does** publish **top-level section** feeds:

```text
https://www.prothomalo.com/api/v1/collections/{slug}.rss
```

Examples:

| Section | RSS URL |
|---------|---------|
| All latest | `https://www.prothomalo.com/stories.rss` |
| Bangladesh | `https://www.prothomalo.com/api/v1/collections/bangladesh.rss` |
| Sports | `https://www.prothomalo.com/api/v1/collections/sports.rss` |
| Politics | `https://www.prothomalo.com/api/v1/collections/politics.rss` |

**In the extension:** Settings → **Section feeds** → check the sections you want → **Save**.  
Use **Discover from sitemap** to probe Prothom Alo’s section list and add any extra feeds that return HTTP 200.

Each article in JSON/CSV includes:

- `section` — which feed it came from  
- `sections` — merged list if the same URL appeared in multiple feeds  
- `categories` — RSS `<category>` tags (e.g. ক্রিকেট, জেলা)

Duplicates are merged by **article link**.

## Collection modes

- **Section feeds + custom URLs (recommended)** — check Prothom Alo sections plus any **More RSS URLs** entries (checkbox on each row), merged file  
- **Single primary URL + extra URLs** — **Primary URL** at top plus **More RSS URLs** (uncheck a row to skip it); Prothom Alo section checklist is hidden  

## Local files

Default base folder: `~/Downloads/prothomalo-feed/`.

**Per RSS feed (default)** — one stable name + one timestamped copy per feed:

| Feed | Latest (overwrite) | Snapshot |
|------|-------------------|----------|
| `stories` | `stories.json` | `stories-2026-11-08-12-30-00.json` |
| `bangladesh` | `bangladesh.json` | `bangladesh-2026-11-08-12-30-00.json` |

Same pattern for `.csv` when format is CSV or both.

**Combined merged file (optional):** `prothomalo-feed-{timestamp}.json` and `latest.json` — enable **Also save one combined merged file** in Settings.

Keep **Save separate files per RSS feed** checked (default) for one file set per URL.

## Scheduled runs

Enable **Automatic schedule** in Settings. Chrome must be running (alarms need the browser). Each run fetches all **checked** feeds, saves, then opens the first feed in a new tab.

## Manual RSS discovery (outside the extension)

1. Open `https://www.prothomalo.com/sitemap/sitemap-section.xml` for site sections.  
2. For a path like `video/sports`, try `https://www.prothomalo.com/api/v1/collections/video-sports.rss` (slashes → hyphens).  
3. If the response is RSS (not HTML 404), add it under **Single custom RSS URL** or use **Discover from sitemap**.
