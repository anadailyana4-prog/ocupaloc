create table if not exists public.programari_blocaje (
  id uuid primary key default gen_random_uuid(),
  profesionist_id uuid not null references public.profesionisti(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  note text,
  created_at timestamptz not null default now(),
  constraint programari_blocaje_interval_check check (end_at > start_at)
);

create index if not exists idx_programari_blocaje_prof_start on public.programari_blocaje(profesionist_id, start_at);
create index if not exists idx_programari_blocaje_prof_end on public.programari_blocaje(profesionist_id, end_at);

alter table public.programari_blocaje enable row level security;

create policy if not exists "programari_blocaje_select_owner"
  on public.programari_blocaje
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profesionisti p
      where p.id = programari_blocaje.profesionist_id
        and p.user_id = auth.uid()
    )
  );

create policy if not exists "programari_blocaje_insert_owner"
  on public.programari_blocaje
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profesionisti p
      where p.id = programari_blocaje.profesionist_id
        and p.user_id = auth.uid()
    )
  );

create policy if not exists "programari_blocaje_delete_owner"
  on public.programari_blocaje
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profesionisti p
      where p.id = programari_blocaje.profesionist_id
        and p.user_id = auth.uid()
    )
  );
