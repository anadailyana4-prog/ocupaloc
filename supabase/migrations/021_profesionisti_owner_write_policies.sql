begin;

alter table public.profesionisti enable row level security;

-- Defense-in-depth: ensure the legacy public select policy is not present.
drop policy if exists profesionisti_select_public on public.profesionisti;

-- Owner can read only their row.
drop policy if exists profesionisti_select_owner on public.profesionisti;
create policy profesionisti_select_owner
  on public.profesionisti
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Owner can insert only rows tied to their own user_id.
drop policy if exists profesionisti_insert_owner on public.profesionisti;
create policy profesionisti_insert_owner
  on public.profesionisti
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Owner can update only their row and keep ownership consistent.
drop policy if exists profesionisti_update_owner on public.profesionisti;
create policy profesionisti_update_owner
  on public.profesionisti
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
