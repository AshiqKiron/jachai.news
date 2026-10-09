# Cursor rules for Shorup News

Cursor loads project context from the repo root **`.cursorrules`** file and from **`.cursor/rules/*.mdc`**. Keep these in sync when you add APIs, env vars, admin flows, or product-facing behavior so agents do not rely on stale patterns.

## File map

| File | When it applies |
|------|------------------|
| [`.cursorrules`](../.cursorrules) | Always — short architecture, conventions, vocabulary |
| [`.cursor/rules/shorup-news.mdc`](../.cursor/rules/shorup-news.mdc) | Always (`alwaysApply: true`) — full product context, data flows, admin, monitoring |
| [`.cursor/rules/backend.mdc`](../.cursor/rules/backend.mdc) | Editing `backend/**/*.py` — routes, services, migrations, Celery, verification |
| [`.cursor/rules/frontend.mdc`](../.cursor/rules/frontend.mdc) | Editing `frontend/**/*.{ts,tsx}` — App Router, lib helpers, Pro gating, admin proxies |
| [`.cursor/rules/supabase.mdc`](../.cursor/rules/supabase.mdc) | Editing `supabase/**` — auth, RLS, subscriptions, type generation |

Scoped rules use YAML frontmatter (`description`, `globs`, `alwaysApply`). See Cursor’s rule format in the create-rule skill or [Cursor docs](https://docs.cursor.com/context/rules).

The always-on file was renamed from legacy **`jachai-news.mdc`** to **`shorup-news.mdc`** — do not reintroduce the old filename.

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
| Home / story hydration (ETag, client cache) | `shorup-news.mdc` data flows, `frontend.mdc` — **`client-story-cache.ts`** (v3 key, v2 migrate), **`client-story-hydrate.ts`**, **`mergeStoryLists`**, ETag routes **`/api/feed/top`** + **`/api/story/[slug]`** |
| Bengali headlines (mixed script, cache repair) | `frontend.mdc` — **`mixed-script-text.ts`**, **`stories.ts`** **`deriveTitleBn`** / **`finalizeStory`**; **`client-story-hydrate`** falls back to demo **`titleBn`** when cache is bad |
| Home topic chips | `frontend.mdc` — **`story-topics.ts`** (`HOME_STORY_TOPICS`, **`topicIdForStory`**, **`topicMetaForStory`**, **`storyMatchesTopic`**, **`visibleTopicIdsForStories`**); maps `Story.category` / `categoryBn` — not subscription matrix categories |
| Anti-clickbait summary (RSS, no AI) | `shorup-news.mdc` vocabulary, `frontend.mdc` (**`anti-clickbait-summary.ts`**, **`AntiClickbaitSummaryPanel`**, wired in **`applySourceDerivedSummaries`** / **`Story.summaryBullets`**) — matrix row **`anti_clickbait_summary`** is **free: yes** (not in **`PRO_ONLY_FEATURE_IDS`**) |
| Follow story (Pro) | `shorup-news.mdc` Pro matrix, `frontend.mdc` (**`app/api/me/pro/route.ts`**, **`followed-stories.ts`** v2 localStorage + **`FOLLOWED_STORIES_CHANGED_EVENT`**, **`StoryFollowButton`**, **`ProfileSavedNewsSection`**, **`getProAccessState`**, **`PaywallModal`** `featureId="follow_story"`) — home grid + story detail + profile; not **`/browse`** or **`/blindspot`** cards |
| Profile / My News Bias (`/profile`) | `shorup-news.mdc` vocabulary, `frontend.mdc` — **`reading-history.ts`**, **`track-article-clicks-pref.ts`**, **`MyNewsBiasDashboard`**, **`components/profile/*`**; **`recordStoryRead`** / optional **`recordArticleClick`**; Mine vs Demo tab |
| Follow topics & people (Pro on profile) | `frontend.mdc` — **`followed-topics.ts`**, **`follow-people.ts`**, **`ProfileFollowSection`** + **`PaywallModal`** `featureId="custom_topic_radar_alerts"` |
| Media ownership on articles | `frontend.mdc` — **`source-media-ownership.ts`**, **`coverage.ts`** **`mediaOwnership`**, **`SourceOwnershipLine`** on story coverage/compare UI |
| Client Pro session route | `frontend.mdc` route handlers — **`GET /api/me/pro`** returns **`{ isPro, userId }`** only; add rows here when introducing other **`app/api/me/*`** gates |
| **`StoryFeedCard`** (shared feed UI) | `frontend.mdc` — **`variant="home"`** vs default (home: BN-only title, compact meta + inline blindspot/partiality hints, 2-line summary; browse/blindspot: EN subtitle + bullets + teasers); **`topicMetaForStory`**; optional follow when parent passes callbacks (**`/browse`**, **`/blindspot`** omit follow) |
| Bengali typography & dates | `frontend.mdc` — **`font-bengali`**, **`.story-title-bn`**, **`.page-hero-title`**; **`bangla-date.ts`** + **`HeaderBanglaDate`** (home hero, not sticky header); **`globals.css`** theme tokens + **`.bg-accent`** control colors |
| Blindspot detection + `/blindspot` feed | `shorup-news.mdc` vocabulary, `frontend.mdc` (`blindspot.ts`, **`BlindspotBanner`** compact on cards + full on detail, `getBlindspotStories`) |
| RSS **`image_url`** on articles | `backend.mdc` (`rss_parser`, migration **`004_articles_image_url.sql`**), `frontend.mdc` (`ArticleImage`, `article-image-url.ts`) |
| Perspective / coverage bars | `frontend.mdc` (`source-perspective.ts`, `coverage.ts`, `HeadlineClashTriptych`, **`coverageStats`**) |
| Story detail tabs (Coverage / Compare / Perspectives) | `frontend.mdc` (`StoryTabs`, **`StoryArticleFeed`**, **`HeadlinesByPerspective`**) |
| Partiality (missing perspective buckets) | `shorup-news.mdc` vocabulary, `frontend.mdc` (`partiality.ts`, **`PartialityBanner`**, **`StoryPartialityTeaser`**) — distinct from **blindspot** |
| Story detail meta bar (published / topic / share) | `frontend.mdc` — **`StoryDetailMetaBar`** (published + updated via **`storyPublishedIso`** / **`coverageStats`**, topic chip → **`/?topic=`**, compact follow + **`StoryShareBar`** **`variant="detail"`**) inside **`StoryDetailPanel`** |
| Coverage summary card above tabs | `frontend.mdc` — **`StoryCoverageBlock`** (`#coverage-details`: **`CoverageBar`** + **`StoryCoverageDetails`** **`density="compact"`**); tabs stay in **`StoryTabs`** |
| RSS excerpt digests (no ingest AI summary) | `shorup-news.mdc` RSS section, `backend.mdc` (**`maybe_refresh_cluster_summary`** no-op), `frontend.mdc` (**`source-digest.ts`**, **`SourceDigestPanel`**) |
| Story share, embed, report + Open Graph | `frontend.mdc` — **`story-share.ts`** (`buildStoryShareOpenGraph`, **`pickStoryShareLeadImage`**, **`STORY_DETAIL_SHARE_NETWORKS`**, **`buildStoryEmbedSnippet`**, **`OG_SHARE_DEFAULT_PATH`**); **`StoryShareBar`**; **`app/story/[slug]/page.tsx`** `generateMetadata` + **`opengraph-image.tsx`** (dynamic PNG when no RSS lead image); root **`layout.tsx`** **`metadataBase`**; `frontend/.env.example` (`NEXT_PUBLIC_REPORT_ISSUES_*`, **`NEXT_PUBLIC_SITE_URL`**) |
| Story slug resolution (SSR + API + OG) | `frontend.mdc` — **`resolveStoryBySlug`** (`unstable_cache` for RSC/metadata) vs **`resolveStoryBySlugDirect`** (route handlers, OG image — no cache request context) |
| Pro vs free (news open; Pro gates e.g. follow story) | `shorup-news.mdc`, `frontend.mdc` (`SUBSCRIPTION_FEATURE_MATRIX`, **`PRO_TIER_TAGLINE`**, **`PRO_ONLY_FEATURE_IDS`**, **`getYearlyPlanSavings`** on **`/pro`** + **`PaywallModal`** (a11y dialog; defers checkout on `/pro`), **`SignInForm`** → `/pro`; `/rumors` route stays — not every matrix row maps 1:1 to a page) |
| Admin RSS + ingest | `shorup-news.mdc` admin section, `backend.mdc` / `frontend.mdc` API lists (full ingest, schedule, **per-source** `POST .../admin/sources/{id}/ingest`) |
| Verification pipeline | `shorup-news.mdc`, `backend.mdc`, `frontend.mdc` (`verifications.ts`, `/verify/*`) |
| Supabase auth / Pro rows | `supabase.mdc`, `frontend.mdc` auth + `database.types.ts` |

## What to update together

When you ship a feature, touch the layers that describe it:

1. **`.cursorrules`** — one-line bullets for architecture, conventions, or vocabulary if agents need them on every task.
2. **`shorup-news.mdc`** — cross-cutting behavior (new public API, home/story data path, ingest scheduler, Pro matrix).
3. **`backend.mdc` / `frontend.mdc` / `supabase.mdc`** — file paths, function names, route handlers, env vars for that tree.
4. **`backend/.env.example` / `frontend/.env.example`** — any new configuration (rules should reference example files, never real secrets).
5. **`README.md`** — user-facing setup only; link here for agent-oriented detail.
6. **`docs/CURSOR_RULES.md`** — add or extend a row in **Product areas → where to document** when the feature is user-visible and agents need a map to the right `.mdc` file.

## Conventions reflected in rules

- **News data** lives in backend PostgreSQL; **auth / Pro / dossiers** in Supabase.
- **Reads** on the frontend may fall back to `demo-data.ts` with `ApiDegradedBanner`; **writes** (verify submit, admin, ingest) must surface real API errors.
- **Admin**: production host `admin.shorup.news`; overview may use Supabase admin; sources/ingest/schedule/users proxies still need legacy `shorup_admin` where documented in `frontend.mdc`.
- **Home**: Bangla hero + **`HeaderBanglaDate`**; topic-filtered grid. **`SiteHeader`**: EN tagline under wordmark (Bangla date lives on `/` hero). **`MobileNav`**: Blindspot, Browse, Bias. **`AuthNav`**: Go Pro + menus.
- **Story detail**: **`StoryDetailMetaBar`** + **`StoryCoverageBlock`** above **`StoryTabs`**; share/OG helpers in **`story-share.ts`** — set **`NEXT_PUBLIC_SITE_URL`** in production so **`metadataBase`**, canonical URLs, and crawler images resolve correctly.
- **Dark UI**: prefer CSS variables in **`globals.css`** (`.dark` **`--color-ink-*`**, sky accent) over one-off monochrome zinc — existing `text-zinc-*` utilities get dark overrides there.
- **Pro gates (UI)**: ids in **`PRO_ONLY_FEATURE_IDS`** get **`PaywallModal`** — **`follow_story`** (follow/saved stories), **`custom_topic_radar_alerts`** (profile topic + people follows); **`narrative_evolution_timeline`** still a matrix placeholder. Client checks **`GET /api/me/pro`** (not backend Postgres). Matrix rows like **`anti_clickbait_summary`** can show on **`/pro`** without being Pro-only.
- **Profile**: reading stats stay on-device (**`reading-history.ts`**) until server dossiers ship; article-click tracking is opt-in via **`TrackArticleClicksSetting`**.
- **Migrations**: backend SQL under `backend/migrations/` (e.g. pgvector, `sources.disabled`, `app_settings`, `articles.image_url`); Supabase SQL under `supabase/migrations/`.
- **Build artifacts**: do not commit `frontend/tsconfig.tsbuildinfo` or hand-edited generated PWA files (`sw.js`, `workbox-*.js`) — see `frontend.mdc` PWA section.

## Checklist before merging

- [ ] New routes or proxies appear in `backend.mdc` and/or `frontend.mdc` API lists (incl. **`app/api/me/*`**)
- [ ] New **`frontend/src/lib/*`** helpers referenced in `frontend.mdc` domain list when agents should reuse them
- [ ] Home or nav UX changes reflected in `frontend.mdc` and this doc’s product-area table when behavior moves between routes
- [ ] Story share/OG or detail chrome changes reflected in `frontend.mdc`, `story-share.ts` row here, and `.env.example` when new public env vars are added
- [ ] Product terms (blindspot, Pro gates, verification) match `shorup-news.mdc` vocabulary
- [ ] Root `.cursorrules` still points at `.cursor/rules/` and does not contradict the `.mdc` files
- [ ] No secrets, DSNs, or production keys in any rule file
