create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  to_email text not null,
  subject text not null,
  payload jsonb not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'sent', 'failed')),
  retry_count integer not null default 0,
  next_retry_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists email_queue_status_retry_idx
  on public.email_queue (status, next_retry_at);

create index if not exists email_queue_created_idx
  on public.email_queue (created_at);

alter table public.email_queue enable row level security;

drop policy if exists "email_queue_service_role_only" on public.email_queue;
create policy "email_queue_service_role_only"
  on public.email_queue
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.claim_email_queue_items(p_limit integer default 20)
returns setof public.email_queue
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with picked as (
    select id
    from public.email_queue
    where status = 'queued'
      and next_retry_at <= now()
    order by created_at asc
    for update skip locked
    limit greatest(coalesce(p_limit, 1), 1)
  )
  update public.email_queue q
  set
    status = 'processing',
    updated_at = now()
  where q.id in (select id from picked)
  returning q.*;
end;
$$;

grant execute on function public.claim_email_queue_items(integer) to service_role;
