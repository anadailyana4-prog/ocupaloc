alter table public.profesionisti
  add column if not exists smart_rules_enabled boolean not null default false,
  add column if not exists smart_max_future_bookings int not null default 0,
  add column if not exists smart_client_cancel_threshold int not null default 0,
  add column if not exists smart_cancel_window_days int not null default 60,
  add column if not exists smart_min_notice_minutes int not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profesionisti_smart_max_future_bookings_chk'
  ) then
    alter table public.profesionisti
      add constraint profesionisti_smart_max_future_bookings_chk
      check (smart_max_future_bookings >= 0 and smart_max_future_bookings <= 10);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profesionisti_smart_client_cancel_threshold_chk'
  ) then
    alter table public.profesionisti
      add constraint profesionisti_smart_client_cancel_threshold_chk
      check (smart_client_cancel_threshold >= 0 and smart_client_cancel_threshold <= 10);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profesionisti_smart_cancel_window_days_chk'
  ) then
    alter table public.profesionisti
      add constraint profesionisti_smart_cancel_window_days_chk
      check (smart_cancel_window_days >= 7 and smart_cancel_window_days <= 365);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profesionisti_smart_min_notice_minutes_chk'
  ) then
    alter table public.profesionisti
      add constraint profesionisti_smart_min_notice_minutes_chk
      check (smart_min_notice_minutes >= 0 and smart_min_notice_minutes <= 1440);
  end if;
end $$;
