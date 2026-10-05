# Production deployment & safe releases

How to ship new features to **shorup.news** without breaking the site. Use this as the default release playbook when CI/CD is added.

## Architecture at deploy time

| Piece | Role | Typical failure mode |
|-------|------|----------------------|
| **Frontend** | Next.js PWA — `shorup.news`, `admin.shorup.news` (same deployment) | Broken UI, stale JS chunks after deploy |
| **Backend API** | FastAPI — `/api/v1`, `GET /health` | 5xx, wrong JSON shapes |
| **Celery workers** | Queues `ingest`, `verification` | Ingest / verify jobs fail |
| **News Postgres** | Clusters, articles, verified claims (+ pgvector) | Migrations block API startup |
| **Supabase** | Auth, Pro subscriptions, billing (RLS) | Schema / types mismatch with frontend |

Reads are designed to **degrade** (demo stories, `ApiDegradedBanner`) when the news API is unreachable. **Writes** (verify submit, admin, ingest) must surface real errors — do not rely on demo fallback for those paths.

Local stack reference: `docker-compose.yml` (`npm run stack:up` / `stack:down`).

## Release flow (target)

```
PR + review → CI (lint, build, tests) → staging (prod-shaped env)
  → smoke tests → DB migrations → API + workers → frontend → monitor
```

1. **Branching** — `main` → production; features via PRs. Frontend preview deploys should hit a **staging API**, not production Postgres.
2. **Staging** — Same shape as prod: pgvector Postgres, Redis, API, worker; pooler mode if prod uses PgBouncer; optional Sentry DSNs.
3. **Promote** — After smoke passes, deploy to production in the order below.

### Smoke checks (staging and after prod deploy)

- Backend: `GET /health` (frontend proxy: `/backend-health` in `next.config.ts`).
- Public: home (`/api/feed/top`), one story slug, `/verify`, `/verify/database`.
- Admin: `admin.shorup.news` — overview + API health (`AdminDashboardPanel`).
- Ingest (optional): `POST /api/v1/ingest` with `X-Ingest-Key` when `INGEST_API_KEY` is set; confirm **202** when `REDIS_URL` + `INGEST_ASYNC_ENABLED`.

## Deploy order by change type

| Change | Order |
|--------|--------|
| API-only (new optional fields, new endpoints) | API (+ workers if task code changed) → frontend when UI needs it |
| Breaking API (rename/remove fields) | Backend supports **old + new** → ship frontend → remove old API in a later release |
| Frontend-only | Usually safe alone if it uses existing API contracts |
| Worker / Celery task logic | **Same commit/image** for API and workers |
| New env vars | Set on host **before** deploy; document in `backend/.env.example` and `frontend/.env.example` |

Default for a full-stack feature: **migrations → API → workers → frontend**.

## Database migrations

### Backend Postgres (news data)

- SQL files: `backend/migrations/*.sql` — keep statements **idempotent** (safe to re-run).
- Applied on API startup: `app/services/db_extensions.py` → `apply_sql_migrations` (after ORM `create_all` in `app/main.py` lifespan).
- **Expand → deploy → contract**: add nullable columns / new tables first; drop old columns only after nothing reads them.
- Take backups before risky migrations; rollback is usually **redeploy old app**, not revert SQL.

### Supabase (auth / Pro)

- SQL: `supabase/migrations/` — apply via Supabase CLI (`supabase db push`) or dashboard SQL editor **before** frontend that depends on new schema/RLS.
- Keep `frontend/src/lib/database.types.ts` in sync with migrations.

## Frontend & PWA

- Production: prefer `NEXT_PUBLIC_API_URL=/api/v1` (same-origin rewrite); SSR uses server `API_URL` → backend (see `frontend/.env.example`, `api-base.ts`).
- PWA service worker is **production builds only** (`next.config.ts`). After deploy, installed clients may hit chunk hash mismatches; `frontend/src/lib/chunk-load-error.ts` reloads once — still prefer lower-traffic windows for big UI releases.
- `shorup.news` and `admin.shorup.news` share one Next deployment — validate both on staging.

## Rollback

| Layer | Action |
|-------|--------|
| Frontend | Redeploy previous host build (fastest) |
| API / workers | Redeploy previous container image/tag |
| Database | Prefer backward-compatible migrations so old code still runs; restore from backup only as last resort |

Rotate `ADMIN_API_KEY` / `INGEST_API_KEY` on **frontend and backend together**.

## Observability (optional but recommended in prod)

- **Sentry** — backend `app/core/sentry_init.py`; frontend `@sentry/nextjs` (`instrumentation.ts`, `instrumentation-client.ts`). Watch error rate 15–30 minutes post-deploy.
- **Admin** — `GET /api/v1/admin/overview` + health via `frontend/src/lib/admin-api.ts`.
- **Ingest ops** — Healthchecks.io + Telegram when env is set (`app/services/ops_alerts.py`).

## Pre-deploy checklist

- [ ] Migrations tested on staging (or will run cleanly on API boot)
- [ ] Workers deployed if Celery task code changed
- [ ] New env vars set on server (not only in `.env.example`)
- [ ] Frontend server `API_URL` points at production API
- [ ] Smoke: `/`, `/browse`, `/verify`, `/health`, admin overview
- [ ] Sentry / ingest alerts quiet or expected

## CI/CD (not in repo yet — add when ready)

Suggested minimum pipeline:

1. **On PR**: `npm run lint:frontend`, `npm run build:frontend`, optional `docker build ./backend`.
2. **On merge to `main`**: deploy staging → automated or manual smoke → promote prod (API/workers, then frontend).

Document chosen hosts (e.g. Vercel + Fly/Railway) and secrets in your team runbook when decided; keep credentials out of git.

## Practices that prevent outages

1. **Backward-compatible APIs** — additive JSON fields; deprecate before removing.
2. **Feature flags** — env toggles for risky behavior (e.g. `NEXT_PUBLIC_MOCK_PRO` pattern in `subscription-access.ts`); gate new UI until stable.
3. **Read resilience** — extend `stories.ts` / `verifications.ts` (`fromApi`, `ApiDegradedBanner`, `lookupVerifiedClaim` on verify detail).
4. **Worker/API parity** — never run mismatched worker and API versions on the same queues.
