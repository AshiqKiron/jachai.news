# Cursor rules for khatinews.com

Cursor loads project context from the repo root **`.cursorrules`** file and from **`.cursor/rules/*.mdc`**. Keep these in sync when you add APIs, env vars, admin flows, or product-facing behavior so agents do not rely on stale patterns.

## File map

| File | When it applies |
|------|------------------|
| [`.cursorrules`](../.cursorrules) | Always — short architecture, conventions, vocabulary |
| [`.cursor/rules/khatinews.mdc`](../.cursor/rules/khatinews.mdc) | Always (`alwaysApply: true`) — full product context, data flows, admin, monitoring |
| [`.cursor/rules/backend.mdc`](../.cursor/rules/backend.mdc) | Editing `backend/**/*.py` — routes, services, migrations, Celery, verification |
| [`.cursor/rules/frontend.mdc`](../.cursor/rules/frontend.mdc) | Editing `frontend/**/*.{ts,tsx}` — App Router, lib helpers, Pro gating, admin proxies |
| [`.cursor/rules/supabase.mdc`](../.cursor/rules/supabase.mdc) | Editing `supabase/**` — auth, RLS, subscriptions, type generation |
| [`.cursor/rules/chrome-extension.mdc`](../.cursor/rules/chrome-extension.mdc) | Editing `chrome-extension/**` — Prothom Alo feed collector (JSON export → admin file ingest) |

Scoped rules use YAML frontmatter (`description`, `globs`, `alwaysApply`). See Cursor’s rule format in the create-rule skill or [Cursor docs](https://docs.cursor.com/context/rules).

The always-on file is **`khatinews.mdc`**. Earlier names were **`shorup-news.mdc`** and **`jachai-news.mdc`** — do not reintroduce those filenames.

### Authoring new rules

- Keep **`.cursorrules`** to architecture bullets and vocabulary agents need on every task; put file paths, route lists, and component inventories in **`.mdc`** files.
- Add a new scoped rule only when a tree needs conventions that would bloat an existing file (e.g. a new top-level package). Register it in the **File map** table above.
- After renaming or splitting rules, grep the repo for old filenames (`jachai-news`, stale component names) so docs and `.cursorrules` stay aligned.
- Rule content may exceed the generic “short rule” guidance — this repo intentionally keeps detailed inventories in `frontend.mdc` / `backend.mdc`; still avoid duplicating the same API list in both `.cursorrules` and an `.mdc` file.
- When adding **`frontend/src/lib/*.ts`** helpers or **`app/api/me/*`** (or similar session routes), list them in **`frontend.mdc`** and add a row below if the feature is product-facing.

## Product areas → where to document

| Area | Update these |
|------|----------------|
| Home landing (`app/page.tsx`) | `frontend.mdc` — Bangla hero + subcopy; **`HeaderBanglaDate`** under hero (optional **`className`**); **`HomeStoryGridClient`** (**`HomeTopicFilter`**, demo slice then **`/api/feed/top`**); **`HomeArchiveLink`** / **`HomeStoriesSectionTitle`** → `/browse`. Nav: **`AuthNav`** / **`MobileNav`** (header tagline is EN — see **`SiteHeader`**) |
| Site chrome (`SiteHeader`, theme) | `frontend.mdc` — logo + EN tagline (“This country deserves…”), **`ThemeToggle`**, **`AuthNav`** (signed-in menu: **Profile**, Blindspot, Browse, Rumors, **Verify**, Bias — not duplicated in **`SiteHeader`** links); dark palette + sky **`--color-accent`** in **`globals.css`** (soft charcoal **`ink-*`**, brighter zinc text overrides) |
| Home / story hydration (ETag, client cache) | `khatinews.mdc` data flows, `frontend.mdc` — **`client-story-cache.ts`** (v5 key `shorup:top-stories:v5`, migrates v2), **`client-story-hydrate.ts`**, **`mergeStoryLists`**, ETag routes **`/api/feed/top`** + **`/api/story/[slug]`** |
| Bengali headlines (mixed script, cache repair) | `frontend.mdc` — **`mixed-script-text.ts`**, **`stories.ts`** **`deriveTitleBn`** / **`finalizeStory`**; **`client-story-hydrate`** falls back to demo **`titleBn`** when cache is bad. **`storySubtitle`** hides the Latin story title once Bangla exists |
| Home topic chips | `frontend.mdc` — **`story-topics.ts`** (`HOME_STORY_TOPICS`, **`topicIdForStory`**, **`topicMetaForStory`**, **`storyMatchesTopic`**, **`visibleTopicIdsForStories`**); maps `Story.category` / `categoryBn` — not subscription matrix categories |
| Anti-clickbait summary (RSS, no AI) | `khatinews.mdc` vocabulary, `frontend.mdc` (**`anti-clickbait-summary.ts`**, **`AntiClickbaitSummaryPanel`**, wired in **`applySourceDerivedSummaries`** / **`Story.summaryBullets`**) — matrix row **`anti_clickbait_summary`** is **free: yes** (not in **`PRO_ONLY_FEATURE_IDS`**) |
| Follow story (Pro) | `khatinews.mdc` Pro matrix, `frontend.mdc` (**`app/api/me/pro/route.ts`**, **`followed-stories.ts`** v2 localStorage + **`FOLLOWED_STORIES_CHANGED_EVENT`**, **`StoryFollowButton`**, **`ProfileSavedNewsSection`**, **`getProAccessState`**, **`PaywallModal`** `featureId="follow_story"`) — home grid + story detail + profile; not **`/browse`** or **`/blindspot`** cards |
| Profile / My News Bias (`/profile`) | `khatinews.mdc` vocabulary, `frontend.mdc` — **`reading-history.ts`**, **`track-article-clicks-pref.ts`**, **`MyNewsBiasDashboard`**, **`components/profile/*`**; **`recordStoryRead`** / optional **`recordArticleClick`**; Mine vs Demo tab |
| Follow topics & people (Pro on profile) | `frontend.mdc` — **`followed-topics.ts`**, **`follow-people.ts`**, **`ProfileFollowSection`** + **`PaywallModal`** `featureId="custom_topic_radar_alerts"` |
| Media ownership on articles | `khatinews.mdc`, `backend.mdc` (seed **`owner_name`** / **`owner_url`**, optional **`parent_name`** / **`parent_url`**, migration **`006_sources_ownership.sql`**; cluster detail returns them), `frontend.mdc` — **`mediaOwnershipFromLinks`** prefers the API payload, **`lookupMediaOwnership`** in **`source-media-ownership.ts`** is the fallback; **`coverage.ts`** **`mediaOwnership`**, **`SourceOwnershipLine`** on story coverage/compare UI |
| Shared ownership on a story | `khatinews.mdc` vocabulary, `frontend.mdc` — **`shared-ownership.ts`** **`analyzeSharedOwnership`**, **`SharedOwnershipReveal`** on **`StoryDetailPanel`** only when **`pickSharpestRevealKind`** picks ownership (free count, Pro names, **`PaywallModal`** `featureId="story_shared_ownership_alerts"`). The page shows one reveal; ownership wins a tie |
| Unnamed source on a story | `khatinews.mdc` vocabulary, `frontend.mdc` — **`unnamed-source.ts`** **`analyzeUnnamedSource`** (সূত্র, নাম প্রকাশে অনিচ্ছুক, সংশ্লিষ্ট, sources say), **`UnnamedSourceReveal`** only when **`pickSharpestRevealKind`** picks it (free count, Pro sees who hid the name and who printed one, **`PaywallModal`** `featureId="story_unnamed_source"`) |
| Client Pro session route | `frontend.mdc` route handlers — **`GET /api/me/pro`** returns **`{ isPro, userId }`** only; add rows here when introducing other **`app/api/me/*`** gates |
| **`StoryFeedCard`** (shared feed UI) | `frontend.mdc` — **`variant="home"`** vs default (both show the Bangla story title; home is compact meta + a 2-line summary; browse/blindspot add bullets + teasers). **`storySubtitle`** hides a Latin story title once Bangla exists. Article headlines stay in the original language. **`topicMetaForStory`**; optional follow when parent passes callbacks (**`/browse`**, **`/blindspot`** omit follow) |
| Bengali typography & dates | `frontend.mdc` — **`font-bengali`**, **`.story-title-bn`**, **`.page-hero-title`**; **`bangla-date.ts`** + **`HeaderBanglaDate`** (home hero, not sticky header); **`globals.css`** theme tokens + **`.bg-accent`** control colors |
| Blindspot detection + `/blindspot` feed | `khatinews.mdc` vocabulary, `frontend.mdc` (`blindspot.ts`, **`BlindspotBanner`** compact on cards + full on detail, `getBlindspotStories`) |
| RSS **`image_url`** on articles | `backend.mdc` (`rss_parser`, migration **`004_articles_image_url.sql`**), `frontend.mdc` (`ArticleImage`, `article-image-url.ts`) |
| Perspective / coverage bars | `khatinews.mdc` vocabulary, `frontend.mdc` — **`coverageSpectrumModeForStory`** (`story-topics.ts`): politics uses **`perspectives.ts`** (for government → against government → neutral → international); other topics use **`reporting-spectrum.ts`** (`reportingToneForArticle`: Clickbait → Mixed → Factual → Rumor) on **`CoverageBar`**, **`StoryArticleFeed`**, and story detail groups. Also **`source-perspective.ts`**, **`coverage.ts`**, **`HeadlineClashTriptych`**, **`coverageStats`** |
| Story detail tabs (Coverage / Compare / Perspectives) | `frontend.mdc` (`StoryTabs`, **`StoryArticleFeed`**, **`HeadlinesByPerspective`**) |
| Partiality (missing perspective buckets) | `khatinews.mdc` vocabulary, `frontend.mdc` (`partiality.ts`, **`PartialityBanner`**, **`StoryPartialityTeaser`**) — distinct from **blindspot** |
| Story detail meta bar (published / topic / share) | `frontend.mdc` — **`StoryDetailMetaBar`** (published + updated via **`storyPublishedIso`** / **`coverageStats`**, topic chip → **`/?topic=`**, compact follow + **`StoryShareBar`** **`variant="detail"`**) inside **`StoryDetailPanel`** |
| Coverage summary card above tabs | `frontend.mdc` — **`StoryCoverageBlock`** (`#coverage-details`: **`CoverageBar`** + **`StoryCoverageDetails`** **`density="compact"`**); tabs stay in **`StoryTabs`** |
| RSS excerpt digests (no ingest AI summary) | `khatinews.mdc` RSS section, `backend.mdc` (**`maybe_refresh_cluster_summary`** no-op), `frontend.mdc` (**`source-digest.ts`**, **`SourceDigestPanel`**) |
| Story share, embed, report + Open Graph | `frontend.mdc` — **`story-share.ts`** + **`story-share-card.ts`** (`pickSharpestRevealKind`, free count card, Pro names/quotes, khatinews mark); **`StoryShareBar`** WhatsApp sends **`GET /api/story/[slug]/share-card`**; copy-link stays a URL; **`opengraph-image.tsx`** is the public 1080 square card (Noto Sans Bengali in **`frontend/assets/fonts/`**); root **`layout.tsx`** **`metadataBase`**; `frontend/.env.example` (`NEXT_PUBLIC_REPORT_ISSUES_*`, **`NEXT_PUBLIC_SITE_URL`**) |
| Story slug resolution (SSR + API + OG) | `frontend.mdc` — **`resolveStoryBySlug`** (`unstable_cache` for RSC/metadata) vs **`resolveStoryBySlugDirect`** (route handlers, OG image — no cache request context) |
| Pro vs free (news open; Pro gates e.g. follow story) | `khatinews.mdc`, `frontend.mdc`, `supabase.mdc` (`SUBSCRIPTION_FEATURE_MATRIX`, **`PRO_TIER_TAGLINE`**, **`PRO_ONLY_FEATURE_IDS`**: **`follow_story`**, **`track_article_clicks`**, **`story_shared_ownership_alerts`**, **`story_unnamed_source`**, **`custom_topic_radar_alerts`**; **`subscription-plans.ts`** ৳15/24h day pass, ৳49/mo, ৳399/yr; **`getYearlyPlanSavings`** on **`/pro`** + **`PaywallModal`** (a11y dialog; defers checkout on `/pro`; lists day pass); Supabase **`subscription_plan`** includes **`day`** via **`20251112031500_subscription_plan_day_pass.sql`**; **`SignInForm`** → `/pro`; `/rumors` route stays — not every matrix row maps 1:1 to a page) |
| Cross-lingual story match | `khatinews.mdc` vocabulary **Story language**, `backend.mdc` — one combined feed. Story title is Bangla when a Bangla headline exists; each outlet headline stays as published; English-only clusters keep the English title. No Bangla/English feed switch and no translation of every title. **`story_match.py`** **`cross_lingual_score`** / **`prefer_bangla_title`**; **`headline_match_score`** is the max of title Jaccard and that score (threshold ~0.42, 72h). **`merge_cross_language_clusters`** joins recent clusters that language had split. Tests: **`backend/tests/test_story_match.py`** |
| Bangladesh RSS seed (one outlet, many feeds) | `khatinews.mdc` RSS section, `backend.mdc` (**`bd_sources_seed.py`**, **`additional_feed_urls`**, **`owner_name`** / **`owner_url`**, optional parent, **`feed_urls_for_source`**, **`fetch_feed_items`** redirects + browser UA), `frontend.mdc` (**`SEED_SOURCE_NAMES`** lockstep with seed `name`s; **`INTERNATIONAL_SOURCE_NAMES`** in **`source-perspective.ts`**) — Google News search RSS when the native feed is not pullable. Jugantor, Risingbd, and Weekly Blitz stay in the seed with **`ingest_mode` `file`** (ownership stored; scheduled pull skips them). Jagonews24 section feeds stay off the pull list |
| Admin RSS + ingest | `khatinews.mdc` admin section, `backend.mdc` / `frontend.mdc` API lists (full ingest, schedule, **per-source** `POST .../admin/sources/{id}/ingest` pulls every URL from **`feed_urls_for_source`**) |
| Source **file** ingest (`ingest_mode`) | `khatinews.mdc` RSS + admin, `backend.mdc` (**`source_ingest_mode`**, **`feed_file_import`**, migration **`005_sources_ingest_mode.sql`**), `frontend.mdc` (**`AdminSourcesPanel`**, **`admin-input.ts`** **`FILE_IMPORT_PLACEHOLDER_HOST`**, **`importAdminSourceFile`**, **`postAdminFormRoute`**, **`PATCH /api/admin/sources/[id]`**, **`POST .../import`**) — scheduled RSS + **Pull now** skip **`ingest_mode=file`** or placeholder `import.shorup.local` URLs |
| Prothom Alo feed collector (Chrome) | `chrome-extension.mdc`, upstream **`chrome-extension/prothomalo-feed-collector/README.md`** — Prothom Alo sections, bundled **`lib/bd-sources.js`** (opt-out via **`isFeedEnabled`**), and extra RSS URLs → Downloads JSON; upload in admin **file** mode. Collector catalog is wider than the server seed |
| Verification pipeline | `khatinews.mdc`, `backend.mdc`, `frontend.mdc` (`verifications.ts`, `/verify/*`) |
| Supabase auth / Pro rows | `supabase.mdc`, `frontend.mdc` auth + `database.types.ts` |

## What to update together

When you ship a feature, touch the layers that describe it:

1. **`.cursorrules`** — one-line bullets for architecture, conventions, or vocabulary if agents need them on every task.
2. **`khatinews.mdc`** — cross-cutting behavior (new public API, home/story data path, ingest scheduler, Pro matrix).
3. **`backend.mdc` / `frontend.mdc` / `supabase.mdc`** — file paths, function names, route handlers, env vars for that tree.
4. **`backend/.env.example` / `frontend/.env.example`** — any new configuration (rules should reference example files, never real secrets).
5. **`README.md`** — user-facing setup only; link here for agent-oriented detail.
6. **`docs/CURSOR_RULES.md`** — add or extend a row in **Product areas → where to document** when the feature is user-visible and agents need a map to the right `.mdc` file.

## Conventions reflected in rules

- **News data** lives in backend PostgreSQL; **auth / Pro / dossiers** in Supabase.
- **Reads** on the frontend may fall back to `demo-data.ts` with `ApiDegradedBanner`; **writes** (verify submit, admin, ingest) must surface real API errors.
- **Admin**: production host `admin.khatinews.com`; overview may use Supabase admin; sources/ingest/schedule/users proxies still need legacy `shorup_admin` where documented in `frontend.mdc`.
- **Home**: Bangla hero + **`HeaderBanglaDate`**; topic-filtered grid. **`SiteHeader`**: EN tagline under wordmark (Bangla date lives on `/` hero). **`MobileNav`**: Blindspot, Browse, Bias. **`AuthNav`**: Go Pro + menus.
- **Story detail**: **`StoryDetailMetaBar`**, then the sharper of **`SharedOwnershipReveal`** and **`UnnamedSourceReveal`** (**`pickSharpestRevealKind`**; ownership wins a tie), then **`StoryCoverageBlock`** above **`StoryTabs`**. Public OG is the free 1080 card (the count, or the khatinews mark). WhatsApp fetches **`GET /api/story/[slug]/share-card`** (a Pro session adds names or quoted lines). Copy-link stays a URL. Set **`NEXT_PUBLIC_SITE_URL`** in production so **`metadataBase`**, canonical URLs, and crawler images resolve correctly.
- **Dark UI**: prefer CSS variables in **`globals.css`** (`.dark` **`--color-ink-*`**, sky accent) over one-off monochrome zinc — existing `text-zinc-*` utilities get dark overrides there.
- **Pro gates (UI)**: ids in **`PRO_ONLY_FEATURE_IDS`** get **`PaywallModal`** — **`follow_story`** (follow/saved stories), **`track_article_clicks`**, **`story_shared_ownership_alerts`** (story page: free count, Pro owner names via **`SharedOwnershipReveal`**), **`story_unnamed_source`** (story page: free count, Pro sees who hid the name via **`UnnamedSourceReveal`**), **`custom_topic_radar_alerts`** (profile topic + people follows). Client checks **`GET /api/me/pro`** (not backend Postgres). Matrix rows like **`anti_clickbait_summary`** can show on **`/pro`** without being Pro-only.
- **Profile**: reading stats stay on-device (**`reading-history.ts`**) until server dossiers ship; article-click tracking is opt-in via **`TrackArticleClicksSetting`**.
- **Migrations**: backend SQL under `backend/migrations/` (e.g. pgvector, `sources.disabled`, `app_settings`, `articles.image_url`, **`sources.ingest_mode`**, **`006_sources_ownership.sql`** for **`owner_name`** / **`owner_url`** / **`parent_name`** / **`parent_url`**); Supabase SQL under `supabase/migrations/` (incl. **`subscription_plan` `day`**).
- **Story language**: Bangla and English papers stay in one story. Readers see a Bangla story title when any Bangla headline exists; each paper’s headline stays in its original language; English-only stories keep the English title. Do not add a language switch or translate every article title.
- **Clustering**: **`headline_match_score`** is title Jaccard or **`story_match.cross_lingual_score`** (a shared place or topic across Bangla and English). **`prefer_bangla_title`** replaces a Latin cluster title. **`merge_cross_language_clusters`** joins recent clusters that language had split. Keep entity aliases in **`story_match.py`** and **`backend/tests/test_story_match.py`**.
- **RSS seed**: one `Source` per outlet. Section feeds live in **`additional_feed_urls`** and are pulled with the primary URL; they are not separate source rows. **`SEED_SOURCE_NAMES`** must stay identical to **`BD_SOURCE_SEED`** names. Jugantor, Risingbd, and Weekly Blitz stay in the seed with **`ingest_mode` `file`** so ownership is stored while live pull is skipped. Jagonews24 section feeds stay off the pull list.
- **Coverage spectrum**: politics uses the government axis in **`perspectives.ts`**. Other topics use **`reporting-spectrum.ts`** (Clickbait → Mixed → Factual → Rumor). **`coverageSpectrumModeForStory`** in **`story-topics.ts`** picks the mode.
- **File ingest**: admin can create sources in **`file`** mode, upload `.json` / `.rss` / `.xml` / `.csv` (≤15 MB), then **`PATCH`** live **`feed_url`** to switch to **`rss`** pulls; articles persist across the switch.
- **Build artifacts**: do not commit `frontend/tsconfig.tsbuildinfo` or hand-edited generated PWA files (`sw.js`, `workbox-*.js`) — see `frontend.mdc` PWA section.

## Checklist before merging

- [ ] Seed outlet name changes update both `backend/app/data/bd_sources_seed.py` and `frontend/src/lib/seed-source-names.ts`
- [ ] Outlet ownership changes update seed **`owner_name`** / **`owner_url`** (and parent when set) and stay consistent with the **`source-media-ownership.ts`** fallback
- [ ] Coverage spectrum changes stay aligned in `perspectives.ts`, `reporting-spectrum.ts`, `story-topics.ts`, and the vocabulary in `khatinews.mdc` / `.cursorrules`
- [ ] Story language stays one combined feed: Bangla story title, original article headlines, English title only when the cluster has no Bangla headline — no language switch and no translation of every title (`khatinews.mdc`, `.cursorrules`, `frontend.mdc`)
- [ ] Cross-language clustering stays in `story_match.py` and `backend/tests/test_story_match.py`, and the RSS bullets in `khatinews.mdc` / `backend.mdc`
- [ ] Story-page reveals stay one-at-a-time via `pickSharpestRevealKind` (ownership wins a tie) in `StoryDetailPanel` and `story-share-card.ts`
- [ ] New routes or proxies appear in `backend.mdc` and/or `frontend.mdc` API lists (incl. **`app/api/me/*`**, admin **`sources/[id]/import`**)
- [ ] New top-level packages get a scoped `.mdc` (e.g. **`chrome-extension.mdc`**) and a row in the **File map** above
- [ ] New **`frontend/src/lib/*`** helpers referenced in `frontend.mdc` domain list when agents should reuse them
- [ ] Home or nav UX changes reflected in `frontend.mdc` and this doc’s product-area table when behavior moves between routes
- [ ] Story share/OG or detail chrome changes reflected in `frontend.mdc`, `story-share.ts` row here, and `.env.example` when new public env vars are added
- [ ] Product terms (blindspot, Pro gates, verification) match `khatinews.mdc` vocabulary
- [ ] Root `.cursorrules` still points at `.cursor/rules/` and does not contradict the `.mdc` files
- [ ] No secrets, DSNs, or production keys in any rule file
