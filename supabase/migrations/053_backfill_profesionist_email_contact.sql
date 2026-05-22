-- Align prod schema: add email_contact, sync from legacy email + auth.users
alter table public.profesionisti
  add column if not exists email_contact text;

update public.profesionisti p
set email_contact = nullif(trim(p.email), '')
where (p.email_contact is null or trim(p.email_contact) = '')
  and p.email is not null
  and trim(p.email) <> '';

update public.profesionisti p
set email_contact = u.email
from auth.users u
where p.user_id = u.id
  and u.email is not null
  and trim(u.email) <> ''
  and (p.email_contact is null or trim(p.email_contact) = '');
