create table if not exists public.programari_status_events (
  id uuid primary key default gen_random_uuid(),
  profesionist_id uuid not null references public.profesionisti (id) on delete cascade,
  programare_id uuid not null references public.programari (id) on delete cascade,
  status text not null,
  source text not null,
  created_at timestamptz not null default now()
);

create index if not exists programari_status_events_programare_idx
  on public.programari_status_events (programare_id);

create index if not exists programari_status_events_status_source_idx
  on public.programari_status_events (status, source, created_at);

create index if not exists programari_status_events_profesionist_idx
  on public.programari_status_events (profesionist_id, created_at);
