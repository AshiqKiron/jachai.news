-- Day pass: 24-hour Pro entitlement. Checkout still writes this from the service role.
alter type public.subscription_plan add value if not exists 'day';

comment on type public.subscription_plan is
  'Pro billing interval: day (24h pass), monthly, yearly';
