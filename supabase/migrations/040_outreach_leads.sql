-- Outreach leads: barber shops & hair salons scraped from Google Maps via Apify
-- Used for cold email campaigns to promote ocupaloc.ro

create table if not exists public.outreach_leads (
  id               uuid        primary key default gen_random_uuid(),
  business_name    text        not null,
  business_name_key text       generated always as (lower(trim(business_name))) stored,
  phone            text,
  email            text,
  website          text,
  street           text,
  city             text,
  category         text,
  google_maps_url  text,
  apify_run_id     text,
  status           text        not null default 'pending'
                               check (status in ('pending', 'sent', 'failed', 'unsubscribed')),
  sent_at          timestamptz,
  unsubscribed_at  timestamptz,
  created_at       timestamptz not null default now()
);

-- Deduplication: same business name + phone = same lead
create unique index if not exists outreach_leads_name_phone_uidx
  on public.outreach_leads (business_name_key, phone)
  where phone is not null;

create index if not exists outreach_leads_status_idx
  on public.outreach_leads (status)
  where status = 'pending';

create index if not exists outreach_leads_email_idx
  on public.outreach_leads (email)
  where email is not null;

alter table public.outreach_leads enable row level security;

drop policy if exists "outreach_leads_service_role_only" on public.outreach_leads;
create policy "outreach_leads_service_role_only"
  on public.outreach_leads
  for all
  to service_role
  using (true)
  with check (true);
