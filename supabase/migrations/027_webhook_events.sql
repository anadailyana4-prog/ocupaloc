create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  payload jsonb not null,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists webhook_events_status_received_idx
  on public.webhook_events (status, received_at);

create index if not exists webhook_events_event_type_idx
  on public.webhook_events (event_type);

alter table public.webhook_events enable row level security;

drop policy if exists "webhook_events_service_role_only" on public.webhook_events;
create policy "webhook_events_service_role_only"
  on public.webhook_events
  for all
  to service_role
  using (true)
  with check (true);
