begin;

alter table public.profesionisti
  add column if not exists email_reminders_enabled boolean not null default true,
  add column if not exists google_review_url text;

create table if not exists public.programari_followups (
  id uuid primary key default gen_random_uuid(),
  profesionist_id uuid not null references public.profesionisti (id) on delete cascade,
  programare_id uuid not null references public.programari (id) on delete cascade,
  tip text not null,
  source text not null default 'cron',
  sent_at timestamptz not null default now(),
  unique (programare_id, tip)
);

create index if not exists programari_followups_prof_sent_idx
  on public.programari_followups (profesionist_id, sent_at);

alter table public.programari_followups enable row level security;

drop policy if exists "programari_followups_service_role_only" on public.programari_followups;
create policy "programari_followups_service_role_only"
  on public.programari_followups
  for all
  to service_role
  using (true)
  with check (true);

commit;
