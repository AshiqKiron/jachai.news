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

## Product areas → where to document

| Area | Update these |
|------|----------------|
| Home / story hydration (ETag, client cache) | `shorup-news.mdc` data flows, `frontend.mdc` App Router + `stories.ts` |
| Blindspot detection + `/blindspot` feed | `shorup-news.mdc` vocabulary, `frontend.mdc` (`blindspot.ts`, `BlindspotBanner`, `getBlindspotStories`) |
| RSS **`image_url`** on articles | `backend.mdc` (`rss_parser`, migration **`004_articles_image_url.sql`**), `frontend.mdc` (`ArticleImage`, `article-image-url.ts`) |
| Perspective / coverage bars | `frontend.mdc` (`source-perspective.ts`, `coverage.ts`, `HeadlineClashTriptych`) |
| Pro vs free (news open, analytics gated) | `shorup-news.mdc`, `frontend.mdc` (`subscription-features.ts`, `SubscriptionPlanCards`, no browse paywall) |
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

## Conventions reflected in rules

- **News data** lives in backend PostgreSQL; **auth / Pro / dossiers** in Supabase.
- **Reads** on the frontend may fall back to `demo-data.ts` with `ApiDegradedBanner`; **writes** (verify submit, admin, ingest) must surface real API errors.
- **Admin**: production host `admin.shorup.news`; overview may use Supabase admin; sources/ingest/schedule/users proxies still need legacy `shorup_admin` where documented in `frontend.mdc`.
- **Home**: top stories via `GET /api/feed/top`; custom RSS is managed in admin and clusters with seed feeds (no separate home custom-feed UI).
- **Migrations**: backend SQL under `backend/migrations/` (e.g. pgvector, `sources.disabled`, `app_settings`, `articles.image_url`); Supabase SQL under `supabase/migrations/`.
- **Build artifacts**: do not commit `frontend/tsconfig.tsbuildinfo` or hand-edited generated PWA files (`sw.js`, `workbox-*.js`) — see `frontend.mdc` PWA section.

## Checklist before merging

- [ ] New routes or proxies appear in `backend.mdc` and/or `frontend.mdc` API lists
- [ ] Product terms (blindspot, Pro gates, verification) match `shorup-news.mdc` vocabulary
- [ ] Root `.cursorrules` still points at `.cursor/rules/` and does not contradict the `.mdc` files
- [ ] No secrets, DSNs, or production keys in any rule file
