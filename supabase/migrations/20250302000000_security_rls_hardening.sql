-- Security hardening: user-owned research data + explicit write restrictions

-- ---------------------------------------------------------------------------
-- Saved research dossiers (per-user)
-- ---------------------------------------------------------------------------
create table public.saved_dossiers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  notes text not null default '' check (char_length(notes) <= 20000),
  source_urls text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_dossiers_user_id_idx on public.saved_dossiers (user_id);

create trigger saved_dossiers_set_updated_at
  before update on public.saved_dossiers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Custom alerts (per-user)
-- ---------------------------------------------------------------------------
create table public.custom_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 120),
  query text not null check (char_length(query) between 1 and 500),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index custom_alerts_user_id_idx on public.custom_alerts (user_id);

create trigger custom_alerts_set_updated_at
  before update on public.custom_alerts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.saved_dossiers enable row level security;
alter table public.custom_alerts enable row level security;

create policy "Users read own dossiers"
  on public.saved_dossiers for select
  using (auth.uid() = user_id);

create policy "Users insert own dossiers"
  on public.saved_dossiers for insert
  with check (auth.uid() = user_id);

create policy "Users update own dossiers"
  on public.saved_dossiers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own dossiers"
  on public.saved_dossiers for delete
  using (auth.uid() = user_id);

create policy "Users read own alerts"
  on public.custom_alerts for select
  using (auth.uid() = user_id);

create policy "Users insert own alerts"
  on public.custom_alerts for insert
  with check (auth.uid() = user_id);

create policy "Users update own alerts"
  on public.custom_alerts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own alerts"
  on public.custom_alerts for delete
  using (auth.uid() = user_id);

-- Explicit deny: billing tables are service-role writes only (no client INSERT/UPDATE/DELETE)
create policy "Deny client insert subscriptions"
  on public.subscriptions for insert
  to authenticated, anon
  with check (false);

create policy "Deny client update subscriptions"
  on public.subscriptions for update
  to authenticated, anon
  using (false);

create policy "Deny client delete subscriptions"
  on public.subscriptions for delete
  to authenticated, anon
  using (false);

create policy "Deny client insert bkash agreements"
  on public.bkash_agreements for insert
  to authenticated, anon
  with check (false);

create policy "Deny client update bkash agreements"
  on public.bkash_agreements for update
  to authenticated, anon
  using (false);

create policy "Deny client delete bkash agreements"
  on public.bkash_agreements for delete
  to authenticated, anon
  using (false);

create policy "Deny client insert payments"
  on public.payment_transactions for insert
  to authenticated, anon
  with check (false);

create policy "Deny client update payments"
  on public.payment_transactions for update
  to authenticated, anon
  using (false);

create policy "Deny client delete payments"
  on public.payment_transactions for delete
  to authenticated, anon
  using (false);
