create table if not exists public.niches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  execution_order integer not null,
  is_active boolean not null default false,
  requires_manual_approval boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug = lower(trim(slug)))
);

create table if not exists public.counties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  code text,
  created_at timestamptz not null default now(),
  check (slug = lower(trim(slug)))
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  county_id uuid not null references public.counties(id) on delete cascade,
  slug text not null,
  name text not null,
  is_primary boolean not null default false,
  population_estimate integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (county_id, slug),
  unique (county_id, name)
);

create table if not exists public.communes (
  id uuid primary key default gen_random_uuid(),
  county_id uuid not null references public.counties(id) on delete cascade,
  slug text not null,
  name text not null,
  population_estimate integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (county_id, slug),
  unique (county_id, name)
);

create table if not exists public.coverage_zones (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid not null references public.niches(id) on delete cascade,
  slug text not null,
  display_name text not null,
  execution_order integer not null,
  status text not null default 'planned' check (status in ('planned', 'scraping', 'qualifying', 'ready', 'sending', 'cooldown', 'exhausted', 'paused')),
  paused_from_status text check (paused_from_status in ('planned', 'scraping', 'qualifying', 'ready', 'sending', 'cooldown', 'exhausted')),
  exhaustion_stage text not null default 'active' check (exhaustion_stage in ('active', 'near_exhaustion', 'exhausted_candidate', 'exhausted_final')),
  exhaustion_score numeric(5,2) not null default 0,
  exhaustion_reason text,
  is_active boolean not null default false,
  requires_manual_approval boolean not null default true,
  scraping_completed boolean not null default false,
  scrape_runs_count integer not null default 0,
  last_scrape_new_leads integer not null default 0,
  last_scrape_new_valid_leads integer not null default 0,
  discovered_leads_count integer not null default 0,
  qualified_leads_count integer not null default 0,
  contacted_leads_count integer not null default 0,
  replies_count integer not null default 0,
  bounce_count integer not null default 0,
  remaining_leads_count integer not null default 0,
  duplicate_leads_count integer not null default 0,
  uncontactable_leads_count integer not null default 0,
  suppressed_leads_count integer not null default 0,
  already_contacted_leads_count integer not null default 0,
  low_yield_runs_count integer not null default 0,
  rerun_history integer[] not null default '{}',
  last_scrape_at timestamptz,
  last_transition_at timestamptz not null default now(),
  approved_next_at timestamptz,
  approved_next_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (niche_id, slug)
);

create table if not exists public.coverage_zone_localities (
  id uuid primary key default gen_random_uuid(),
  coverage_zone_id uuid not null references public.coverage_zones(id) on delete cascade,
  city_id uuid references public.cities(id) on delete cascade,
  commune_id uuid references public.communes(id) on delete cascade,
  locality_type text not null check (locality_type in ('city', 'commune')),
  execution_order integer not null default 1,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  check ((city_id is not null and commune_id is null and locality_type = 'city') or (city_id is null and commune_id is not null and locality_type = 'commune'))
);

create table if not exists public.coverage_zone_status_history (
  id uuid primary key default gen_random_uuid(),
  coverage_zone_id uuid not null references public.coverage_zones(id) on delete cascade,
  from_status text check (from_status in ('planned', 'scraping', 'qualifying', 'ready', 'sending', 'cooldown', 'exhausted', 'paused')),
  to_status text not null check (to_status in ('planned', 'scraping', 'qualifying', 'ready', 'sending', 'cooldown', 'exhausted', 'paused')),
  reason text,
  transition_context jsonb not null default '{}'::jsonb,
  changed_by_type text not null default 'system' check (changed_by_type in ('system', 'telegram', 'operator', 'cron')),
  changed_by_id uuid,
  changed_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid not null references public.niches(id) on delete restrict,
  coverage_zone_id uuid not null references public.coverage_zones(id) on delete cascade,
  legacy_outreach_lead_id uuid references public.outreach_leads(id) on delete set null,
  business_name text not null,
  business_name_key text generated always as (lower(trim(business_name))) stored,
  county_id uuid references public.counties(id) on delete set null,
  city_id uuid references public.cities(id) on delete set null,
  commune_id uuid references public.communes(id) on delete set null,
  website text,
  google_maps_url text,
  primary_phone text,
  category text,
  source_quality numeric(5,2) not null default 0,
  qualification_status text not null default 'raw' check (qualification_status in ('raw', 'qualified', 'review', 'rejected', 'suppressed', 'contacted', 'replied', 'closed')),
  qualification_reason text,
  observable_signals jsonb not null default '{}'::jsonb,
  quality_flags jsonb not null default '{}'::jsonb,
  last_contacted_at timestamptz,
  last_replied_at timestamptz,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_contacts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel in ('email', 'phone', 'website', 'maps', 'other')),
  value text not null,
  normalized_value text not null,
  is_primary boolean not null default false,
  is_valid boolean not null default true,
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'verified', 'invalid')),
  source text,
  created_at timestamptz not null default now(),
  unique (channel, normalized_value)
);

create table if not exists public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  source_type text not null check (source_type in ('free_scraper', 'manual_import', 'legacy_outreach', 'operator_note')),
  external_id text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_qualification_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  previous_status text,
  next_status text not null,
  reason text,
  quality_score numeric(5,2),
  details jsonb not null default '{}'::jsonb,
  created_by_type text not null default 'system' check (created_by_type in ('system', 'telegram', 'operator', 'cron')),
  created_by_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.outreach_campaigns (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid not null references public.niches(id) on delete restrict,
  coverage_zone_id uuid not null references public.coverage_zones(id) on delete cascade,
  slug text not null unique,
  display_name text not null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'active', 'paused', 'completed', 'archived')),
  send_limit_per_hour integer not null default 10,
  send_limit_per_day integer not null default 50,
  follow_up_delay_days integer not null default 4,
  follow_up_enabled boolean not null default true,
  start_requires_manual_trigger boolean not null default true,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outreach_batches (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.outreach_campaigns(id) on delete cascade,
  batch_type text not null default 'initial' check (batch_type in ('initial', 'follow_up')),
  status text not null default 'planned' check (status in ('planned', 'approved', 'running', 'completed', 'failed', 'cancelled')),
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  target_message_count integer not null default 0,
  sent_message_count integer not null default 0,
  failed_message_count integer not null default 0,
  notes text,
  created_by_type text not null default 'system' check (created_by_type in ('system', 'telegram', 'operator', 'cron')),
  created_by_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.outreach_campaigns(id) on delete cascade,
  batch_id uuid references public.outreach_batches(id) on delete set null,
  lead_id uuid not null references public.leads(id) on delete cascade,
  lead_contact_id uuid references public.lead_contacts(id) on delete set null,
  message_kind text not null default 'initial' check (message_kind in ('initial', 'follow_up')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'cancelled', 'bounced', 'replied')),
  subject text not null,
  body_text text not null,
  body_html text,
  personalization_payload jsonb not null default '{}'::jsonb,
  opt_out_text text,
  provider_message_id text,
  sent_at timestamptz,
  failed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outreach_followups (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.outreach_campaigns(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  initial_message_id uuid not null references public.outreach_messages(id) on delete cascade,
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'cancelled', 'skipped')),
  due_at timestamptz not null,
  sent_message_id uuid references public.outreach_messages(id) on delete set null,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (initial_message_id)
);

create table if not exists public.suppression_list (
  id uuid primary key default gen_random_uuid(),
  normalized_value text not null unique,
  channel text not null check (channel in ('email', 'phone', 'website')),
  reason text not null,
  source text not null default 'operator',
  lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.reply_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.outreach_messages(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  legacy_outreach_reply_id uuid references public.outreach_replies(id) on delete set null,
  event_type text not null check (event_type in ('reply', 'bounce', 'opt_out', 'positive_reply', 'booking_intent')),
  from_value text,
  subject text,
  summary text,
  suggested_draft text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.operator_actions (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  role text not null check (role in ('owner', 'admin', 'operator')),
  actor_label text,
  telegram_admin_id uuid,
  target_type text,
  target_id uuid,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.telegram_admins (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  chat_id bigint not null,
  username text,
  first_name text,
  last_name text,
  role text not null default 'operator' check (role in ('owner', 'admin', 'operator')),
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'operator_actions_telegram_admin_id_fkey'
      and conrelid = 'public.operator_actions'::regclass
  ) then
    alter table public.operator_actions
      add constraint operator_actions_telegram_admin_id_fkey
      foreign key (telegram_admin_id)
      references public.telegram_admins(id)
      on delete set null;
  end if;
end $$;

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  niche_id uuid references public.niches(id) on delete set null,
  coverage_zone_id uuid references public.coverage_zones(id) on delete set null,
  report_type text not null check (report_type in ('operational', 'coverage', 'efficiency', 'handoff')),
  title text not null,
  body text not null,
  metrics jsonb not null default '{}'::jsonb,
  sent_to_telegram boolean not null default false,
  created_at timestamptz not null default now(),
  unique (report_date, report_type, niche_id, coverage_zone_id)
);

create index if not exists niches_execution_order_idx on public.niches (execution_order);
create index if not exists coverage_zones_niche_order_idx on public.coverage_zones (niche_id, execution_order);
create index if not exists coverage_zones_status_idx on public.coverage_zones (status, is_active);
create index if not exists coverage_zone_history_zone_changed_idx on public.coverage_zone_status_history (coverage_zone_id, changed_at desc);
create index if not exists leads_zone_status_idx on public.leads (coverage_zone_id, qualification_status);
create index if not exists lead_contacts_lead_idx on public.lead_contacts (lead_id, channel);
create index if not exists outreach_campaigns_zone_status_idx on public.outreach_campaigns (coverage_zone_id, status);
create index if not exists outreach_batches_campaign_status_idx on public.outreach_batches (campaign_id, status, scheduled_for);
create index if not exists outreach_messages_campaign_status_idx on public.outreach_messages (campaign_id, status, sent_at);
create index if not exists outreach_messages_lead_idx on public.outreach_messages (lead_id, message_kind, status);
create index if not exists outreach_followups_due_idx on public.outreach_followups (due_at, status);
create index if not exists reply_events_lead_occurred_idx on public.reply_events (lead_id, occurred_at desc);
create index if not exists daily_reports_date_type_idx on public.daily_reports (report_date desc, report_type);

alter table public.niches enable row level security;
alter table public.counties enable row level security;
alter table public.cities enable row level security;
alter table public.communes enable row level security;
alter table public.coverage_zones enable row level security;
alter table public.coverage_zone_localities enable row level security;
alter table public.coverage_zone_status_history enable row level security;
alter table public.leads enable row level security;
alter table public.lead_contacts enable row level security;
alter table public.lead_sources enable row level security;
alter table public.lead_qualification_logs enable row level security;
alter table public.outreach_campaigns enable row level security;
alter table public.outreach_batches enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.outreach_followups enable row level security;
alter table public.suppression_list enable row level security;
alter table public.reply_events enable row level security;
alter table public.operator_actions enable row level security;
alter table public.telegram_admins enable row level security;
alter table public.daily_reports enable row level security;

drop policy if exists "niches_service_role_only" on public.niches;
create policy "niches_service_role_only" on public.niches for all to service_role using (true) with check (true);

drop policy if exists "counties_service_role_only" on public.counties;
create policy "counties_service_role_only" on public.counties for all to service_role using (true) with check (true);

drop policy if exists "cities_service_role_only" on public.cities;
create policy "cities_service_role_only" on public.cities for all to service_role using (true) with check (true);

drop policy if exists "communes_service_role_only" on public.communes;
create policy "communes_service_role_only" on public.communes for all to service_role using (true) with check (true);

drop policy if exists "coverage_zones_service_role_only" on public.coverage_zones;
create policy "coverage_zones_service_role_only" on public.coverage_zones for all to service_role using (true) with check (true);

drop policy if exists "coverage_zone_localities_service_role_only" on public.coverage_zone_localities;
create policy "coverage_zone_localities_service_role_only" on public.coverage_zone_localities for all to service_role using (true) with check (true);

drop policy if exists "coverage_zone_status_history_service_role_only" on public.coverage_zone_status_history;
create policy "coverage_zone_status_history_service_role_only" on public.coverage_zone_status_history for all to service_role using (true) with check (true);

drop policy if exists "leads_service_role_only" on public.leads;
create policy "leads_service_role_only" on public.leads for all to service_role using (true) with check (true);

drop policy if exists "lead_contacts_service_role_only" on public.lead_contacts;
create policy "lead_contacts_service_role_only" on public.lead_contacts for all to service_role using (true) with check (true);

drop policy if exists "lead_sources_service_role_only" on public.lead_sources;
create policy "lead_sources_service_role_only" on public.lead_sources for all to service_role using (true) with check (true);

drop policy if exists "lead_qualification_logs_service_role_only" on public.lead_qualification_logs;
create policy "lead_qualification_logs_service_role_only" on public.lead_qualification_logs for all to service_role using (true) with check (true);

drop policy if exists "outreach_campaigns_service_role_only" on public.outreach_campaigns;
create policy "outreach_campaigns_service_role_only" on public.outreach_campaigns for all to service_role using (true) with check (true);

drop policy if exists "outreach_batches_service_role_only" on public.outreach_batches;
create policy "outreach_batches_service_role_only" on public.outreach_batches for all to service_role using (true) with check (true);

drop policy if exists "outreach_messages_service_role_only" on public.outreach_messages;
create policy "outreach_messages_service_role_only" on public.outreach_messages for all to service_role using (true) with check (true);

drop policy if exists "outreach_followups_service_role_only" on public.outreach_followups;
create policy "outreach_followups_service_role_only" on public.outreach_followups for all to service_role using (true) with check (true);

drop policy if exists "suppression_list_service_role_only" on public.suppression_list;
create policy "suppression_list_service_role_only" on public.suppression_list for all to service_role using (true) with check (true);

drop policy if exists "reply_events_service_role_only" on public.reply_events;
create policy "reply_events_service_role_only" on public.reply_events for all to service_role using (true) with check (true);

drop policy if exists "operator_actions_service_role_only" on public.operator_actions;
create policy "operator_actions_service_role_only" on public.operator_actions for all to service_role using (true) with check (true);

drop policy if exists "telegram_admins_service_role_only" on public.telegram_admins;
create policy "telegram_admins_service_role_only" on public.telegram_admins for all to service_role using (true) with check (true);

drop policy if exists "daily_reports_service_role_only" on public.daily_reports;
create policy "daily_reports_service_role_only" on public.daily_reports for all to service_role using (true) with check (true);