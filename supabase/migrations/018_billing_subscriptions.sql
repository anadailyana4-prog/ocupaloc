create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profesionist_id uuid not null references public.profesionisti(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_profesionist_id_idx on public.subscriptions(profesionist_id);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
alter table public.subscriptions enable row level security;
create policy "Owner can read own subscription" on public.subscriptions
  for select using (
    profesionist_id in (
      select id from public.profesionisti where user_id = auth.uid()
    )
  );
