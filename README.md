# Jachai News

**Ground News for Bangladesh** — a installable PWA that clusters the same story across Prothom Alo, Daily Star, bdnews24, BBC Bangla, and more. Compare headlines, perspective lean (establishment / opposition / independent / international), blindspots, and rumor flags.

Stack: FastAPI backend (RSS + clustering) and Next.js App Router frontend with offline shell.

## Structure

```
jachai-news/
├── .cursorrules          # Cursor project context
├── backend/              # Python FastAPI & RSS scraper
├── frontend/             # Next.js App Router UI
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
uvicorn app.main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Async SQLAlchemy URL (`postgresql+asyncpg://...`) |
| `GROQ_API_KEY` | Optional — cluster summaries via Groq |
| `GEMINI_API_KEY` | Optional — cluster summaries via Gemini |
| `AI_PROVIDER` | `groq` (default) or `gemini` |
| `INGEST_API_KEY` | Optional — require `X-Ingest-Key` on `POST /api/v1/ingest` |

## Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

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

## Docker (API only)

```bash
docker build -t jachai-api ./backend
docker run --rm -p 8000:8000 -e DATABASE_URL=postgresql+asyncpg://... jachai-api
```

## RSS ingestion

Seed sources from `backend/app/data/bd_sources_seed.py`, fetch feeds, dedupe by URL, and cluster by title similarity:

```bash
# From repo root (Postgres must be running; tables created on API startup)
npm run ingest:backend

# Or trigger via API
curl -X POST http://localhost:8000/api/v1/ingest
# With INGEST_API_KEY set in backend .env:
curl -X POST -H "X-Ingest-Key: your-key" http://localhost:8000/api/v1/ingest
```

Logic lives in `backend/app/services/rss_ingestion.py` (uses `rss_parser.py`).

## Roadmap hooks

- Scheduled RSS ingest (cron / worker) reusing `rss_ingestion.run_rss_ingest`
- Clustering job + `ai_client.summarize_cluster`
- Source seed: `backend/app/data/bd_sources_seed.py`
- Bias score calibration for Bangladesh outlets
