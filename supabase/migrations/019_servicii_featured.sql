alter table public.servicii
  add column if not exists is_featured boolean not null default false;

create index if not exists servicii_profesionist_featured_idx
  on public.servicii (profesionist_id, is_featured)
  where is_featured = true;
