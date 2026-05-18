-- 051_drop_outreach_pipeline.sql
-- Removes the automated cold-outreach data model (leads, zones, campaigns, legacy Apify leads).
--
-- PRESERVED (still used by Telegram /emailsend):
--   public.telegram_admins
--   public.suppression_list  (opt-out emails; lead_id column dropped)
--
-- NOT TOUCHED: profesionisti, programari, subscriptions, profiles, tenants, etc.

begin;

-- Unlink suppression_list from leads before dropping leads
alter table if exists public.suppression_list
  drop constraint if exists suppression_list_lead_id_fkey;

alter table if exists public.suppression_list
  drop column if exists lead_id;

-- Child tables first (FK-safe order)
drop table if exists public.outreach_followups;
drop table if exists public.reply_events;
drop table if exists public.outreach_messages;
drop table if exists public.outreach_batches;
drop table if exists public.outreach_campaigns;
drop table if exists public.lead_qualification_logs;
drop table if exists public.lead_sources;
drop table if exists public.lead_contacts;
drop table if exists public.daily_reports;
drop table if exists public.operator_actions;
drop table if exists public.leads;
drop table if exists public.outreach_replies;
drop table if exists public.outreach_leads;
drop table if exists public.coverage_zone_status_history;
drop table if exists public.coverage_zone_localities;
drop table if exists public.coverage_zones;
drop table if exists public.niches;
drop table if exists public.cities;
drop table if exists public.communes;
drop table if exists public.counties;

commit;
