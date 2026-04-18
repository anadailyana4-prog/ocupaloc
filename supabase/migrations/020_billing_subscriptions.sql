-- Billing persistence for Stripe subscriptions + webhook idempotency

create table if not exists public.billing_subscriptions (
  profesionist_id uuid primary key references public.profesionisti (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  last_event_created timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists billing_subscriptions_stripe_customer_uidx
  on public.billing_subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists billing_subscriptions_stripe_subscription_uidx
  on public.billing_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists public.billing_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  event_created timestamptz not null,
  payload jsonb,
  processed_at timestamptz not null default now()
);

create index if not exists billing_webhook_events_created_idx
  on public.billing_webhook_events (event_created desc);

alter table public.billing_subscriptions enable row level security;
alter table public.billing_webhook_events enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_subscriptions'
      and policyname = 'billing_subscriptions_service_only'
  ) then
    execute $policy$
      create policy billing_subscriptions_service_only
        on public.billing_subscriptions
        as restrictive
        for all
        to authenticated, anon
        using (false)
        with check (false)
    $policy$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_webhook_events'
      and policyname = 'billing_webhook_events_service_only'
  ) then
    execute $policy$
      create policy billing_webhook_events_service_only
        on public.billing_webhook_events
        as restrictive
        for all
        to authenticated, anon
        using (false)
        with check (false)
    $policy$;
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists billing_subscriptions_set_updated_at on public.billing_subscriptions;

create trigger billing_subscriptions_set_updated_at
before update on public.billing_subscriptions
for each row execute function public.set_updated_at();
