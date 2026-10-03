# Jachai News

**Ground News for Bangladesh** — a installable PWA that clusters the same story across Prothom Alo, Daily Star, bdnews24, BBC Bangla, and more. Compare headlines, perspective lean (establishment / opposition / independent / international), blindspots, and rumor flags.

Stack: FastAPI backend (RSS + clustering) and Next.js App Router frontend with offline shell.

## Architecture

Jachai splits **news intelligence** (clusters, articles, verified claims) in **backend PostgreSQL** from **user accounts and billing** in **Supabase**. The Next.js app talks to FastAPI for feeds and verification, and to Supabase for auth and Pro entitlements.

```mermaid
flowchart LR
  subgraph sources [RSS sources]
    PA[Prothom Alo / Daily Star / bdnews24 / BBC Bangla / …]
  end

  subgraph backend [Backend FastAPI]
    API[REST /api/v1]
    ING[rss_ingestion + clustering]
    VER[verify pipeline + semantic cache]
    API --> ING
    API --> VER
  end

  subgraph workers [Optional Celery + Redis]
    W1[ingest queue]
    W2[verification queue]
  end

  subgraph data [Data]
    PG[(PostgreSQL + pgvector / FTS)]
    SB[(Supabase: profiles, subscriptions)]
  end

  subgraph frontend [Next.js PWA]
    UI[App Router + service worker]
    PROXY[/api rewrite + feed routes]
  end

  PA --> ING
  ING --> PG
  VER --> PG
  ING -.-> W1
  VER -.-> W2
  W1 --> PG
  W2 --> PG
  UI --> PROXY
  PROXY --> API
  UI --> SB
```

### Components

| Area | Path | Role |
|------|------|------|
| API | `backend/` | FastAPI, async SQLAlchemy, `/api/v1` — articles, clusters, sources, bias, rumors, verify, admin |
| Ingestion | `backend/app/services/rss_ingestion.py`, `rss_parser.py` | Seed feeds, dedupe by URL, cluster by title similarity (~72h, Jaccard); optional AI cluster summary |
| Verification | `backend/app/api/verify.py`, `verifications.py`, `verification_*` services | Submit claims, queue jobs, SSE/WebSocket progress, pgvector semantic cache + FTS search |
| Workers | Celery (`ingest`, `verification` queues) | Async RSS ingest and heavy verify steps when `REDIS_URL` is set |
| Web app | `frontend/` | Next.js 15 App Router, React 19, Tailwind, PWA; English + Bangla product copy |
| Auth / Pro | `supabase/migrations/`, `frontend/src/lib/supabase.ts` | Profiles, subscriptions, bKash tables (checkout planned); RLS on user metadata |
| Ops | `docker-compose.yml`, `docs/DEPLOYMENT.md` | Local Postgres (pgvector), Redis, API, worker; production release playbook |

### Request paths (frontend)

- **Browser API**: `NEXT_PUBLIC_API_URL` (default same-origin `/api/v1` via Next rewrite).
- **Server components**: `API_URL` → `http://127.0.0.1:3001/api/v1` in dev.
- **Home**: static shell → `GET /api/feed/top` (`getTopStories`). Custom RSS is managed in `/admin` and ingests into clusters like seed feeds.
- **Resilience**: `demo-data.ts` + `stories.ts` merge API clusters with demo stories; `ApiDegradedBanner` when the API is down. Writes (verify submit, admin) require a live API.

### Admin (internal)

Production dashboard on **`admin.jachai.news`** (local: `/admin`). Backend `GET /api/v1/admin/overview` and source add/remove; frontend proxies under `app/api/admin/*` with legacy `jachai_admin` cookie (see [Admin panel](#admin-panel-internal) below).

### Monitoring (optional)

Sentry on backend (`SENTRY_DSN`) and frontend (`@sentry/nextjs`). Ingest cron can ping Healthchecks.io and Telegram via `ops_alerts.py` when env vars are set.

## Structure

```
jachai.news/
├── backend/              # FastAPI, SQLAlchemy, Celery tasks, RSS + verification
├── frontend/             # Next.js App Router, PWA, Supabase client
├── supabase/             # Migrations (profiles, Pro, dossiers/alerts)
├── docs/                 # DEPLOYMENT.md and ops notes
├── docker-compose.yml    # Postgres (pgvector), Redis, API, worker
├── package.json          # dev:frontend, dev:backend, stack:up, ingest:backend, workers
├── .cursor/rules/        # Detailed Cursor project rules
└── README.md
```

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL (or update `DATABASE_URL` in backend env)

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit keys as needed
uvicorn app.main:app --reload --port 3001
```

API docs: [http://localhost:3001/docs](http://localhost:3001/docs) (or from repo root: `npm run dev:backend`)

### Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Async SQLAlchemy URL (`postgresql+asyncpg://...`) |
| `DATABASE_POOLER_URL` | Optional transaction-pool URL (PgBouncer / Supavisor) |
| `DATABASE_POOL_MODE` | `local` (SQLAlchemy pool) or `pgbouncer` (`NullPool`) |
| `REDIS_URL` | Broker for rate limits, Celery, queued ingest |
| `INGEST_ASYNC_ENABLED` | Queue ingest when `REDIS_URL` is set (default `true`) |
| `GROQ_API_KEY` | Optional — cluster summaries via Groq |
| `GEMINI_API_KEY` | Optional — cluster summaries via Gemini |
| `AI_PROVIDER` | `groq` (default) or `gemini` |
| `INGEST_API_KEY` | Optional — require `X-Ingest-Key` on `POST /api/v1/ingest` |
| `ADMIN_API_KEY` | Optional — require `X-Admin-Key` on `GET /api/v1/admin/overview` |

## Frontend

```bash
cd frontend
npm install
# Browser uses same-origin /api/v1; SSR hits FastAPI on :3001 (see frontend/.env.example)
echo "NEXT_PUBLIC_API_URL=/api/v1" > .env.local
echo "API_URL=http://127.0.0.1:3001/api/v1" >> .env.local
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

### Admin panel (internal)

Password-protected dashboard at **`https://admin.jachai.news`** (local dev: **`/admin`**). The main site redirects `/admin` to the admin subdomain in production. API health, DB counts, sources, recent clusters, and manual RSS ingest.

Add **`admin.jachai.news`** as a domain on your frontend host (same Next.js deployment as `jachai.news`). Optional env: `ADMIN_HOST`, `NEXT_PUBLIC_SITE_URL`.

| Variable | Where | Description |
|----------|--------|-------------|
| `ADMIN_PASSWORD` | Frontend (server) | Ops sign-in cookie; set locally to use legacy admin login |
| `ADMIN_API_KEY` | Frontend + backend | Protects `GET /api/v1/admin/overview` (omit locally for open access) |
| `INGEST_API_KEY` | Frontend (server) + backend | Optional; required for **Run ingest** when set on the API |

The UI ships with **Bangladeshi demo stories** when the API is offline. Connect the API to replace them with live RSS clusters.

### PWA (install on phone)

1. Run a production build: `cd frontend && npm run build && npm start`
2. Open on Chrome/Edge (or Safari on iOS) and use **Install** / **Add to Home Screen**
3. Service worker and `/offline` fallback are enabled in production builds only

Optional Supabase auth: set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Apply the schema in `supabase/migrations/` via [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase db push`) or the SQL editor in the dashboard.

## Jachai Pro (subscriptions — planned)

| Plan | Price (BDT) |
|------|-------------|
| Monthly | ৳49 / month |
| Yearly | ৳399 / year |

- **Payment (planned):** [bKash Tokenized Checkout API](https://developer.bka.sh/docs/tokenized-checkout-process) — agreement + tokenized charges for renewals.
- **Database (planned):** Supabase (auth, subscription status, payment/agreement records). News API data stays in backend PostgreSQL.

Product copy and plan constants: `frontend/src/lib/subscription-plans.ts`. Checkout is not implemented yet.

## Scalable local stack (Docker Compose)

Stateless API, Redis-backed Celery workers (RSS ingest + verification jobs), and Postgres for news data:

```bash
npm run stack:up
# API: http://localhost:3001  |  start workers are included as `worker` service
npm run stack:down
```

Production pattern: autoscale **API** replicas on CPU/RPS; scale **workers** on queue depth (`ingest`, `verification`). Set `REDIS_URL` so `POST /api/v1/ingest` returns **202** and runs on workers. Without Redis, ingest runs synchronously in the API process (fine for local dev).

**Claim verification** (`POST /api/v1/verify`): guardrails on the request path only; URL scraping and LLM analysis run on the `verification` Celery queue. Progress streams via **WebSocket** `GET ws://…/api/v1/verifications/jobs/{id}/ws` or **SSE** `/events`. Semantic cache + full-text search need **pgvector** on Postgres (the Compose file uses `pgvector/pgvector:pg16`). Set `GEMINI_API_KEY` for embeddings; `GROQ_API_KEY` or `GEMINI_API_KEY` for analysis.

### Database pooling

- **News Postgres** (backend `DATABASE_URL`): tune `DATABASE_POOL_SIZE` / `DATABASE_MAX_OVERFLOW` per API replica, or set `DATABASE_POOLER_URL` + `DATABASE_POOL_MODE=pgbouncer` when using a transaction pooler.
- **Supabase** (auth / Pro): use the [connection pooler](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler) from Next.js server code; news clusters stay in backend Postgres.

### Object storage

Large exports and assets go through `app/services/object_storage.py` (Supabase Storage when `OBJECT_STORAGE_BACKEND=supabase`), not Postgres BLOB columns.

## Docker (API image only)

```bash
docker build -t jachai-api ./backend
docker run --rm -p 3001:8000 -e DATABASE_URL=postgresql+asyncpg://... jachai-api
```

## RSS ingestion

Seed sources from `backend/app/data/bd_sources_seed.py`, fetch feeds, dedupe by URL, and cluster by title similarity:

```bash
# From repo root (Postgres must be running; tables created on API startup)
npm run ingest:backend

# Or trigger via API
curl -X POST http://localhost:3001/api/v1/ingest
# With INGEST_API_KEY set in backend .env:
curl -X POST -H "X-Ingest-Key: your-key" http://localhost:3001/api/v1/ingest
```

Logic lives in `backend/app/services/rss_ingestion.py` (uses `rss_parser.py`).

## Workers

```bash
# With Redis running (see docker-compose or your own broker)
npm run worker:backend
```

Cron / Healthchecks should call `POST /api/v1/ingest` (queued when `REDIS_URL` is set) or `npm run ingest:backend -- --queue`.

## Production releases

Safe deploy order, migrations, PWA notes, rollback, and a pre-ship checklist: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

## Roadmap hooks

- Scheduled RSS ingest (cron → `POST /api/v1/ingest` or `ingest:backend --queue`)
- Clustering job + `ai_client.summarize_cluster`
- Source seed: `backend/app/data/bd_sources_seed.py`
- Bias score calibration for Bangladesh outlets
