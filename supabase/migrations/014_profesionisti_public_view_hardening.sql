begin;

alter table public.profesionisti enable row level security;

create or replace view public.profesionisti_public
with (security_barrier = true)
as
select
  id,
  slug,
  nume_business,
  tip_activitate,
  description,
  oras,
  logo_url,
  telefon,
  lucreaza_acasa,
  adresa_publica,
  program,
  created_at
from public.profesionisti
where slug is not null;

comment on view public.profesionisti_public is
  'Public profile projection (whitelisted columns only)';

revoke all on table public.profesionisti_public from public;
grant select on table public.profesionisti_public to anon, authenticated;

drop policy if exists profesionisti_select_public on public.profesionisti;

drop policy if exists profesionisti_select_owner on public.profesionisti;
create policy profesionisti_select_owner
  on public.profesionisti
  for select
  to authenticated
  using (auth.uid() = user_id);

commit;