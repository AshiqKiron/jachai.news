-- Shorup News — Supabase schema (auth users, Pro subscriptions, PayEurasia payment records)
-- Apply via Supabase CLI: supabase db push
-- Or paste into SQL Editor in the Supabase dashboard.

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'en' check (locale in ('en', 'bn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App profile row per Supabase auth user';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Subscriptions (Shorup Pro)
-- ---------------------------------------------------------------------------
create type public.subscription_plan as enum ('monthly', 'yearly');

create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'expired'
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan public.subscription_plan not null,
  status public.subscription_status not null default 'trialing',
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_user_id_key unique (user_id)
);

comment on table public.subscriptions is 'Current Pro entitlement per user (one row per user)';

create index subscriptions_status_idx on public.subscriptions (status);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- PayEurasia checkout (planned; bkash_agreements table name is legacy)
-- ---------------------------------------------------------------------------
create table public.bkash_agreements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agreement_id text not null,
  payer_reference text,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'cancelled', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bkash_agreements_agreement_id_key unique (agreement_id)
);

create index bkash_agreements_user_id_idx on public.bkash_agreements (user_id);

create trigger bkash_agreements_set_updated_at
  before update on public.bkash_agreements
  for each row execute function public.set_updated_at();

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  provider text not null default 'payeurasia',
  provider_trx_id text,
  amount_bdt integer not null check (amount_bdt > 0),
  currency text not null default 'BDT',
  status text not null
    check (status in ('pending', 'completed', 'failed', 'refunded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index payment_transactions_user_id_idx on public.payment_transactions (user_id);
create unique index payment_transactions_provider_trx_unique
  on public.payment_transactions (provider, provider_trx_id)
  where provider_trx_id is not null;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.bkash_agreements enable row level security;
alter table public.payment_transactions enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users read own bkash agreements"
  on public.bkash_agreements for select
  using (auth.uid() = user_id);

create policy "Users read own payments"
  on public.payment_transactions for select
  using (auth.uid() = user_id);

-- Writes to subscriptions / payments / agreements are intended for service role
-- (Edge Functions or backend using SUPABASE_SERVICE_ROLE_KEY), not the anon key.
