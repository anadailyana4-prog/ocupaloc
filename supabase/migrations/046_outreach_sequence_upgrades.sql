-- 046_outreach_sequence_upgrades.sql
-- Upgrades for 3-touch email sequence, booking system detection, and lead reactivation

-- 1. Drop old unique constraint on outreach_followups (one-per-initial-message)
--    so we can have multiple steps (1=first follow-up, 2=second follow-up, 3=break-up)
alter table public.outreach_followups
  drop constraint if exists outreach_followups_initial_message_id_key;

-- 2. Add step_number column
alter table public.outreach_followups
  add column if not exists step_number integer not null default 1
    check (step_number in (1, 2, 3));

-- 3. New unique constraint: one entry per (initial_message, step)
alter table public.outreach_followups
  drop constraint if exists outreach_followups_initial_message_step_key;
alter table public.outreach_followups
  add constraint outreach_followups_initial_message_step_key
    unique (initial_message_id, step_number);

-- 4. Allow 'reactivation' as message_kind in outreach_messages
alter table public.outreach_messages
  drop constraint if exists outreach_messages_message_kind_check;
alter table public.outreach_messages
  add constraint outreach_messages_message_kind_check
    check (message_kind in ('initial', 'follow_up', 'reactivation'));

-- 5. Allow 'reactivation' as batch_type in outreach_batches
alter table public.outreach_batches
  drop constraint if exists outreach_batches_batch_type_check;
alter table public.outreach_batches
  add constraint outreach_batches_batch_type_check
    check (batch_type in ('initial', 'follow_up', 'reactivation'));

-- 6. Reactivation tracking columns on leads
alter table public.leads
  add column if not exists reactivation_eligible boolean not null default false,
  add column if not exists last_reactivation_at timestamptz;

-- 7. Index for reactivation candidate queries
create index if not exists leads_reactivation_idx
  on public.leads (reactivation_eligible, last_contacted_at)
  where reactivation_eligible = true;
