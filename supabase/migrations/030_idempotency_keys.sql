create table if not exists public.idempotencykeys (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  result jsonb not null,
  expiresat timestamptz not null,
  createdat timestamptz not null default now()
);

create index if not exists idempotencykeys_expiresat_idx
  on public.idempotencykeys (expiresat);