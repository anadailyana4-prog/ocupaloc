alter table public.outreach_leads
  drop constraint if exists outreach_leads_status_check;

alter table public.outreach_leads
  add constraint outreach_leads_status_check
  check (status in ('pending', 'sent', 'failed', 'unsubscribed', 'no_email', 'replied'));

create table if not exists public.outreach_replies (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.outreach_leads(id) on delete set null,
  mailbox_uid bigint not null unique,
  message_id text,
  from_email text not null,
  subject text,
  text_body text,
  html_body text,
  in_reply_to text,
  received_at timestamptz not null,
  is_auto_reply boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists outreach_replies_message_id_uidx
  on public.outreach_replies(message_id)
  where message_id is not null;

create index if not exists outreach_replies_lead_received_idx
  on public.outreach_replies(lead_id, received_at desc);

alter table public.outreach_replies enable row level security;

drop policy if exists "outreach_replies_service_role_only" on public.outreach_replies;
create policy "outreach_replies_service_role_only"
  on public.outreach_replies
  for all
  to service_role
  using (true)
  with check (true);