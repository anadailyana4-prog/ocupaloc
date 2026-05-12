-- Make outreach_leads compatible with Supabase upsert(onConflict)
-- The previous partial unique index does not satisfy ON CONFLICT inference.

drop index if exists public.outreach_leads_name_phone_uidx;

create unique index if not exists outreach_leads_name_phone_uidx
  on public.outreach_leads (business_name_key, phone);
