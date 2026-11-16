# Hosted Supabase (khatinews.com)

**Project ref:** `xbadshfnetqzpvdavaef`  
**Dashboard:** https://supabase.com/dashboard/project/xbadshfnetqzpvdavaef

**Default architecture:** news and auth live in the **same Supabase Postgres**. See **`docs/DATABASE.md`** for pooler URL and backend `.env`.

This dashboard project also holds auth, Pro billing, dossiers, and user activity (`story_follows`, `story_read_events`, `article_click_events`).

## 1. Apply pending migrations

### Option A — Supabase CLI

```bash
npm i -g supabase   # or brew install supabase/tap/supabase
cd supabase
supabase login
supabase link --project-ref xbadshfnetqzpvdavaef
supabase db push
```

### Option B — SQL Editor

Open **SQL → New query** in the dashboard and run the contents of:

- `supabase/migrations/20251112190000_user_story_activity.sql` (if not already applied)
- Any earlier files from `supabase/migrations/` that this project has never run

## 2. Frontend env

In `frontend/.env.local` (Settings → API in the dashboard):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xbadshfnetqzpvdavaef.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from dashboard>
```

Server routes that need admin or billing writes also need `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_*`).

## 3. What syncs automatically

When Supabase is configured and the user is signed in:

- **Follow story** → `story_follows`
- **Open story detail** → `story_read_events`
- **Outbound article click** (with tracking pref on) → `article_click_events`

Local storage is still updated first; server writes are best-effort in the background. On load, `StoryActivityHydrator` merges server follows into localStorage.

## 4. News tables (same database)

Point `backend/.env` at the Supabase **transaction pooler** (`DATABASE_POOLER_URL`, `DATABASE_POOL_MODE=pgbouncer`). Start the API or run ingest — `backend/migrations/*.sql` (including `009_comprehensive_storage.sql`) apply on that same Supabase database.
