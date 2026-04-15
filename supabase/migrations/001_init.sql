-- Ocupaloc MVP — multi-tenant profesioniști beauty
-- Rulează în Supabase SQL Editor sau: supabase db push

create extension if not exists "uuid-ossp";

-- Program săptămână > JSON: {"luni":["09:00","18:00"], ...} — [] = zi liberă
create table public.profesionisti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nume_business text not null default '',
  tip_activitate text not null default '',
  slug text not null unique,
  logo_url text,
  telefon text,
  email_contact text,
  lucreaza_acasa boolean not null default false,
  adresa_publica text,
  mesaj_dupa_programare text not null default 'Te aștept! Primești locația pe WhatsApp după confirmare.',
  program jsonb not null default '{"luni":["09:00","18:00"],"marti":["09:00","18:00"],"miercuri":["09:00","18:00"],"joi":["09:00","18:00"],"vineri":["09:00","18:00"],"sambata":[],"duminica":[]}'::jsonb,
  pauza_intre_clienti int not null default 10,
  timp_pregatire int not null default 0,
  notificari_email_nou boolean not null default true,
  onboarding_pas smallint not null default 1,
  created_at timestamptz not null default now()
);

create index profesionisti_user_id_idx on public.profesionisti (user_id);
create index profesionisti_slug_idx on public.profesionisti (slug);

create table public.servicii (
  id uuid primary key default gen_random_uuid(),
  profesionist_id uuid not null references public.profesionisti (id) on delete cascade,
  nume text not null,
  descriere text,
  pret numeric(10, 2) not null default 0,
  durata_minute int not null,
  culoare text not null default '#3B82F6',
  activ boolean not null default true,
  ordine int not null default 0,
  created_at timestamptz not null default now()
);

create index servicii_profesionist_idx on public.servicii (profesionist_id);

create table public.programari (
  id uuid primary key default gen_random_uuid(),
  profesionist_id uuid not null references public.profesionisti (id) on delete cascade,
  serviciu_id uuid not null references public.servicii (id) on delete restrict,
  nume_client text not null,
  telefon_client text not null,
  email_client text,
  data_start timestamptz not null,
  data_final timestamptz not null,
  status text not null default 'confirmat',
  observatii text,
  creat_de text not null default 'client',
  created_at timestamptz not null default now()
);

create index programari_prof_data_idx on public.programari (profesionist_id, data_start);
create index programari_prof_status_idx on public.programari (profesionist_id, status);

create table public.clienti_blocati (
  id uuid primary key default gen_random_uuid(),
  profesionist_id uuid not null references public.profesionisti (id) on delete cascade,
  telefon text not null,
  nume text,
  motiv text,
  created_at timestamptz not null default now(),
  unique (profesionist_id, telefon)
);

-- RLS
alter table public.profesionisti enable row level security;
alter table public.servicii enable row level security;
alter table public.programari enable row level security;
alter table public.clienti_blocati enable row level security;

-- profesionisti: citire publică (pagină booking)
create policy profesionisti_select_public
  on public.profesionisti for select
  using (true);

create policy profesionisti_insert_owner
  on public.profesionisti for insert
  with check (auth.uid() = user_id);

create policy profesionisti_update_owner
  on public.profesionisti for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy profesionisti_delete_owner
  on public.profesionisti for delete
  using (auth.uid() = user_id);

-- servicii: public vede doar active
create policy servicii_select_public
  on public.servicii for select
  using (activ = true);

create policy servicii_all_owner
  on public.servicii for all
  using (
    exists (
      select 1 from public.profesionisti p
      where p.id = servicii.profesionist_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profesionisti p
      where p.id = servicii.profesionist_id and p.user_id = auth.uid()
    )
  );

-- Owner vede și servicii inactive (override: policy OR)
create policy servicii_select_owner_all
  on public.servicii for select
  using (
    exists (
      select 1 from public.profesionisti p
      where p.id = servicii.profesionist_id and p.user_id = auth.uid()
    )
  );

-- programari: inserare publică (client) + full access owner
create policy programari_insert_public
  on public.programari for insert
  with check (
    exists (
      select 1 from public.servicii s
      where s.id = serviciu_id
        and s.profesionist_id = programari.profesionist_id
        and s.activ = true
    )
    and not exists (
      select 1 from public.clienti_blocati cb
      where cb.profesionist_id = programari.profesionist_id
        and cb.telefon = programari.telefon_client
    )
  );

create policy programari_select_owner
  on public.programari for select
  using (
    exists (
      select 1 from public.profesionisti p
      where p.id = programari.profesionist_id and p.user_id = auth.uid()
    )
  );

create policy programari_update_owner
  on public.programari for update
  using (
    exists (
      select 1 from public.profesionisti p
      where p.id = programari.profesionist_id and p.user_id = auth.uid()
    )
  );

create policy programari_delete_owner
  on public.programari for delete
  using (
    exists (
      select 1 from public.profesionisti p
      where p.id = programari.profesionist_id and p.user_id = auth.uid()
    )
  );

-- clienti_blocati: doar owner
create policy clienti_blocati_all_owner
  on public.clienti_blocati for all
  using (
    exists (
      select 1 from public.profesionisti p
      where p.id = clienti_blocati.profesionist_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profesionisti p
      where p.id = clienti_blocati.profesionist_id and p.user_id = auth.uid()
    )
  );
