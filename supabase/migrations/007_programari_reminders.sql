create table if not exists public.programari_reminders (
  id uuid primary key default gen_random_uuid(),
  profesionist_id uuid not null references public.profesionisti (id) on delete cascade,
  programare_id uuid not null references public.programari (id) on delete cascade,
  tip text not null,
  sent_at timestamptz not null default now(),
  unique (programare_id, tip)
);

create index if not exists programari_reminders_programare_idx
  on public.programari_reminders (programare_id);

create index if not exists programari_reminders_profesionist_idx
  on public.programari_reminders (profesionist_id, sent_at);
