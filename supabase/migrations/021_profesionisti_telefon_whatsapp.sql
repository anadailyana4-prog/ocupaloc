begin;

-- Rename telefon_business -> telefon (code expects "telefon", DB had "telefon_business")
alter table public.profesionisti
  rename column telefon_business to telefon;

-- Add whatsapp column (optional contact field for public page button)
alter table public.profesionisti
  add column if not exists whatsapp text;

-- Recreate the public view to include the correctly named columns
drop view if exists public.profesionisti_public;
create view public.profesionisti_public
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
  whatsapp,
  lucreaza_acasa,
  adresa_publica,
  program,
  created_at
from public.profesionisti
where slug is not null;

commit;
