begin;

create or replace view public.profesionisti_public
with (security_barrier = true, security_invoker = true)
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
  created_at,
  bio
from public.profesionisti
where slug is not null;

commit;
