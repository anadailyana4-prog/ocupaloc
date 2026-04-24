-- Migration 024: Billing subscription state persistence
-- Stores subscription lifecycle events from Stripe webhook.
-- Source of truth for feature gating and entitlement checks.

create table if not exists public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  profesionist_id       uuid not null references public.profesionisti(id) on delete cascade,
  stripe_customer_id    text not null,
  stripe_subscription_id text unique,
  status                text not null check (status in (
    'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'
  )),
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  trial_start           timestamptz,
  trial_end             timestamptz,
  cancel_at_period_end  boolean not null default false,
  canceled_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- One active subscription per professional (unique on active stripe_subscription_id already via UNIQUE).
-- We allow multiple rows to keep history (e.g. resubscription after cancel).

create index if not exists subscriptions_profesionist_id_idx
  on public.subscriptions (profesionist_id);

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);

-- updated_at trigger
create or replace function update_subscriptions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function update_subscriptions_updated_at();

-- RLS: only owner + service role
alter table public.subscriptions enable row level security;

create policy subscriptions_select_owner
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.profesionisti p
      where p.id = subscriptions.profesionist_id
        and p.user_id = auth.uid()
    )
  );

-- No public insert/update/delete — all writes go through service role in webhook handler.
