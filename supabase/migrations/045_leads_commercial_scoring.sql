-- Migration 045: Add commercial scoring columns to leads table
-- Adds commercial_category and commercial_score for smarter outreach prioritization

alter table public.leads
  add column if not exists commercial_category text
    check (commercial_category in ('easy_close', 'premium_setup', 'testimonial', 'reseller')),
  add column if not exists commercial_score numeric(5,2)
    check (commercial_score >= 0 and commercial_score <= 100);

comment on column public.leads.commercial_category is
  'Commercial scoring category: easy_close, premium_setup, testimonial, reseller';

comment on column public.leads.commercial_score is
  'Commercial score 0-100 computed from signals (review count, website, phone, niche etc.)';

create index if not exists leads_commercial_score_idx
  on public.leads (commercial_score desc)
  where commercial_score is not null;
