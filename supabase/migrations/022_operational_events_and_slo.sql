-- Operational audit trail for SRE/SLO monitoring

create table if not exists public.operational_events (
  id bigserial primary key,
  event_type text not null,
  flow text not null,
  outcome text not null check (outcome in ('success', 'failure')),
  request_id text,
  entity_id text,
  status_code integer,
  latency_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_operational_events_created_at on public.operational_events (created_at desc);
create index if not exists idx_operational_events_flow_created_at on public.operational_events (flow, created_at desc);
create index if not exists idx_operational_events_type_created_at on public.operational_events (event_type, created_at desc);

alter table public.operational_events enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'operational_events'
      and policyname = 'operational_events_service_only'
  ) then
    execute $policy$
      create policy operational_events_service_only
        on public.operational_events
        as restrictive
        for all
        to authenticated, anon
        using (false)
        with check (false)
    $policy$;
  end if;
end $$;
