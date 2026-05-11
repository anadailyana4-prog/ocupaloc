begin;

alter table public.profesionisti
  add column if not exists email_reminders_enabled boolean not null default true,
  add column if not exists google_review_url text;

alter table public.profesionisti
  drop constraint if exists profesionisti_sms_provider_check;

alter table public.profesionisti
  drop column if exists sms_reminders_enabled,
  drop column if exists sms_provider,
  drop column if exists sms_sender,
  drop column if exists sms_fallback_email;

commit;
