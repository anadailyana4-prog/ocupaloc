insert into public.niches (slug, display_name, execution_order, is_active, requires_manual_approval)
values
  ('barber', 'Barber', 1, true, true),
  ('frizerii', 'Frizerii', 2, false, true),
  ('saloane', 'Saloane', 3, false, true),
  ('clinici-estetice', 'Clinici estetice', 4, false, true)
on conflict (slug) do update set
  display_name = excluded.display_name,
  execution_order = excluded.execution_order,
  is_active = excluded.is_active,
  requires_manual_approval = excluded.requires_manual_approval;

insert into public.counties (slug, name, code)
values
  ('bucuresti', 'Bucuresti', 'B'),
  ('ilfov', 'Ilfov', 'IF'),
  ('cluj', 'Cluj', 'CJ'),
  ('timis', 'Timis', 'TM'),
  ('iasi', 'Iasi', 'IS'),
  ('constanta', 'Constanta', 'CT'),
  ('brasov', 'Brasov', 'BV')
on conflict (slug) do update set
  name = excluded.name,
  code = excluded.code;

with county_rows as (
  select id, slug from public.counties
)
insert into public.cities (county_id, slug, name, is_primary)
values
  ((select id from county_rows where slug = 'bucuresti'), 'bucuresti', 'Bucuresti', true),
  ((select id from county_rows where slug = 'ilfov'), 'voluntari', 'Voluntari', false),
  ((select id from county_rows where slug = 'ilfov'), 'otopeni', 'Otopeni', false),
  ((select id from county_rows where slug = 'ilfov'), 'popesti-leordeni', 'Popesti-Leordeni', false),
  ((select id from county_rows where slug = 'ilfov'), 'pantelimon', 'Pantelimon', false),
  ((select id from county_rows where slug = 'ilfov'), 'buftea', 'Buftea', false),
  ((select id from county_rows where slug = 'ilfov'), 'bragadiru', 'Bragadiru', false),
  ((select id from county_rows where slug = 'ilfov'), 'chitila', 'Chitila', false),
  ((select id from county_rows where slug = 'ilfov'), 'magurele', 'Magurele', false),
  ((select id from county_rows where slug = 'cluj'), 'cluj-napoca', 'Cluj-Napoca', true),
  ((select id from county_rows where slug = 'timis'), 'timisoara', 'Timisoara', true),
  ((select id from county_rows where slug = 'iasi'), 'iasi', 'Iasi', true),
  ((select id from county_rows where slug = 'constanta'), 'constanta', 'Constanta', true),
  ((select id from county_rows where slug = 'brasov'), 'brasov', 'Brasov', true)
on conflict (county_id, slug) do update set
  name = excluded.name,
  is_primary = excluded.is_primary;

with county_rows as (
  select id, slug from public.counties
)
insert into public.communes (county_id, slug, name)
values
  ((select id from county_rows where slug = 'ilfov'), 'chiajna', 'Chiajna'),
  ((select id from county_rows where slug = 'ilfov'), 'domnesti', 'Domnesti'),
  ((select id from county_rows where slug = 'ilfov'), 'berceni', 'Berceni'),
  ((select id from county_rows where slug = 'ilfov'), 'tunari', 'Tunari'),
  ((select id from county_rows where slug = 'ilfov'), 'corbeanca', 'Corbeanca'),
  ((select id from county_rows where slug = 'ilfov'), 'mogosoaia', 'Mogosoaia'),
  ((select id from county_rows where slug = 'ilfov'), 'stefanestii-de-jos', 'Stefanestii de Jos'),
  ((select id from county_rows where slug = 'ilfov'), 'cornetu', 'Cornetu')
on conflict (county_id, slug) do update set
  name = excluded.name;

with niche_rows as (
  select id, slug from public.niches
)
insert into public.coverage_zones (
  niche_id,
  slug,
  display_name,
  execution_order,
  status,
  is_active,
  requires_manual_approval
)
select niche_rows.id, zone.slug, zone.display_name, zone.execution_order,
  case when niche_rows.slug = 'barber' and zone.execution_order = 1 then 'planned' else 'planned' end,
  case when niche_rows.slug = 'barber' and zone.execution_order = 1 then true else false end,
  true
from niche_rows
cross join (
  values
    ('bucuresti-ilfov', 'Bucuresti + Ilfov', 1),
    ('cluj-napoca', 'Cluj-Napoca', 2),
    ('timisoara', 'Timisoara', 3),
    ('iasi', 'Iasi', 4),
    ('constanta', 'Constanta', 5),
    ('brasov', 'Brasov', 6)
) as zone(slug, display_name, execution_order)
on conflict (niche_id, slug) do update set
  display_name = excluded.display_name,
  execution_order = excluded.execution_order,
  is_active = excluded.is_active,
  requires_manual_approval = excluded.requires_manual_approval;

with zone_rows as (
  select z.id, z.slug, n.slug as niche_slug
  from public.coverage_zones z
  join public.niches n on n.id = z.niche_id
  where n.slug = 'barber'
),
city_rows as (
  select c.id, c.slug, county.slug as county_slug
  from public.cities c
  join public.counties county on county.id = c.county_id
),
commune_rows as (
  select c.id, c.slug from public.communes c
)
insert into public.coverage_zone_localities (coverage_zone_id, city_id, commune_id, locality_type, execution_order, is_primary)
values
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), (select id from city_rows where slug = 'bucuresti'), null, 'city', 1, true),
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), (select id from city_rows where slug = 'voluntari'), null, 'city', 2, false),
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), (select id from city_rows where slug = 'otopeni'), null, 'city', 3, false),
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), (select id from city_rows where slug = 'popesti-leordeni'), null, 'city', 4, false),
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), (select id from city_rows where slug = 'pantelimon'), null, 'city', 5, false),
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), null, (select id from commune_rows where slug = 'chiajna'), 'commune', 6, false),
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), null, (select id from commune_rows where slug = 'domnesti'), 'commune', 7, false),
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), null, (select id from commune_rows where slug = 'berceni'), 'commune', 8, false),
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), null, (select id from commune_rows where slug = 'tunari'), 'commune', 9, false),
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), null, (select id from commune_rows where slug = 'corbeanca'), 'commune', 10, false),
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), null, (select id from commune_rows where slug = 'mogosoaia'), 'commune', 11, false),
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), null, (select id from commune_rows where slug = 'stefanestii-de-jos'), 'commune', 12, false),
  ((select id from zone_rows where slug = 'bucuresti-ilfov'), null, (select id from commune_rows where slug = 'cornetu'), 'commune', 13, false),
  ((select id from zone_rows where slug = 'cluj-napoca'), (select id from city_rows where slug = 'cluj-napoca'), null, 'city', 1, true),
  ((select id from zone_rows where slug = 'timisoara'), (select id from city_rows where slug = 'timisoara'), null, 'city', 1, true),
  ((select id from zone_rows where slug = 'iasi'), (select id from city_rows where slug = 'iasi'), null, 'city', 1, true),
  ((select id from zone_rows where slug = 'constanta'), (select id from city_rows where slug = 'constanta'), null, 'city', 1, true),
  ((select id from zone_rows where slug = 'brasov'), (select id from city_rows where slug = 'brasov'), null, 'city', 1, true)
on conflict do nothing;

with active_niche as (
  select id from public.niches where slug = 'barber'
),
active_zone as (
  select id from public.coverage_zones
  where niche_id = (select id from active_niche)
    and slug = 'bucuresti-ilfov'
)
insert into public.outreach_campaigns (
  niche_id,
  coverage_zone_id,
  slug,
  display_name,
  status,
  send_limit_per_hour,
  send_limit_per_day,
  follow_up_delay_days,
  follow_up_enabled,
  start_requires_manual_trigger
)
values (
  (select id from active_niche),
  (select id from active_zone),
  'barber-bucuresti-ilfov',
  'Barber Bucuresti + Ilfov',
  'ready',
  10,
  50,
  4,
  true,
  true
)
on conflict (slug) do update set
  display_name = excluded.display_name,
  status = excluded.status,
  send_limit_per_hour = excluded.send_limit_per_hour,
  send_limit_per_day = excluded.send_limit_per_day,
  follow_up_delay_days = excluded.follow_up_delay_days,
  follow_up_enabled = excluded.follow_up_enabled,
  start_requires_manual_trigger = excluded.start_requires_manual_trigger;