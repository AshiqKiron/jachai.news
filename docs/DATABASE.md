# One database: Supabase Postgres

khatinews.com uses **a single Supabase PostgreSQL database** for:

- **Auth / Pro / user activity** — tables from `supabase/migrations/` (`profiles`, `subscriptions`, `story_follows`, …)
- **News + verification** — tables from the FastAPI app (`articles`, `clusters`, `verified_claims`, pgvector, …)

The Next.js app talks to Supabase **Auth** with the anon key. The FastAPI API talks to the **same database** with the pooler URL and **database password** (server only). Never put the DB password in `NEXT_PUBLIC_*`.

**Hosted project:** https://supabase.com/dashboard/project/xbadshfnetqzpvdavaef  
**API URL:** `https://xbadshfnetqzpvdavaef.supabase.co`

---

## Step 1 — Enable pgvector (once)

In the Supabase **SQL Editor**, run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Required before the backend applies `backend/migrations/001_verified_claims_pgvector_fts.sql`.

---

## Step 2 — Apply Supabase migrations (user tables)

Run each file in order in the SQL Editor, or:

```bash
npx supabase login
cd supabase && npx supabase link --project-ref xbadshfnetqzpvdavaef
npx supabase db push
```

| Order | File |
|-------|------|
| 1 | `20250301000000_init_profiles_subscriptions.sql` |
| 2 | `20250302000000_security_rls_hardening.sql` |
| 3 | `20251112031500_subscription_plan_day_pass.sql` |
| 4 | `20251112190000_user_story_activity.sql` |

---

## Step 3 — Point the backend at Supabase

1. Open **Project Settings → Database** in the dashboard.
2. Under **Connection string**, choose **URI** and copy:
   - **Transaction pooler** (port **6543**, mode **Transaction**) — **use this for the API, workers, and ingest CLI**
   - Replace `[YOUR-PASSWORD]` with your database password.

3. Create `backend/.env` (copy from `backend/.env.example`):

```env
# Supabase transaction pooler (recommended for FastAPI + Celery)
DATABASE_POOLER_URL=postgresql://postgres.xbadshfnetqzpvdavaef:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
DATABASE_POOL_MODE=pgbouncer

# Optional direct session URL (migrations debugging only — not for app under load)
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xbadshfnetqzpvdavaef.supabase.co:5432/postgres

SUPABASE_URL=https://xbadshfnetqzpvdavaef.supabase.co
SUPABASE_JWT_SECRET=<from API settings — JWT Secret>
SUPABASE_SERVICE_ROLE_KEY=<server only>

REDIS_URL=redis://127.0.0.1:6379/0
CORS_ORIGINS=["http://localhost:3000"]
```

The app accepts `postgresql://` from the dashboard and converts it to `postgresql+asyncpg://` automatically.

**Region:** The pooler hostname may differ (e.g. `aws-0-eu-central-1`). Use the string from **your** dashboard, not a guess.

---

## Step 4 — Create news tables (backend migrations)

Start the API once (applies ORM tables + `backend/migrations/*.sql`):

```bash
npm run dev:backend
```

Or run ingest (also opens a DB session):

```bash
npm run ingest:backend
```

In **Table Editor** you should see `articles`, `clusters`, `sources`, `verified_claims`, etc., alongside `profiles` and `subscriptions`.

---

## Step 5 — Frontend env

`frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xbadshfnetqzpvdavaef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<for server routes / admin only>
```

Auth redirect URLs: `http://localhost:3000/auth/callback` (and production domain when deployed).

---

## Step 6 — Run the stack (Redis local, DB on Supabase)

```bash
npm run stack:up:supabase
```

This starts API + worker + beat + Redis in Docker; **Postgres runs on Supabase**, not in Docker.

For a **fully local** Postgres (offline dev), use:

```bash
npm run stack:up
```

(`docker-compose.yml` with bundled pgvector Postgres.)

---

## What not to mix up

| Connection | Used by | Key |
|------------|---------|-----|
| Pooler URI + DB password | FastAPI, Celery, `ingest:backend` | **Database password** |
| Project URL + anon key | Browser / Next.js client | **Anon key** |
| Project URL + service_role | Next server routes, storage uploads | **Service role** (secret) |

RLS protects user tables for browser clients. The backend uses the **postgres** DB user via pooler and is not subject to RLS the same way — keep ingest/admin keys and DB password server-only.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `extension "vector" does not exist` | Run `CREATE EXTENSION vector` in SQL Editor |
| Too many connections | Use **6543 pooler** + `DATABASE_POOL_MODE=pgbouncer` |
| Auth works, feed empty | Check `DATABASE_POOLER_URL`, run `npm run ingest:backend` |
| SSL errors (some hosts) | Add `?sslmode=require` to the URI if needed |

---

See also: [`SUPABASE_HOSTED.md`](SUPABASE_HOSTED.md) (auth sync), [`DEPLOYMENT.md`](DEPLOYMENT.md) (releases).