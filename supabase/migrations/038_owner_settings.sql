create table if not exists public.owner_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trial_expiring_alert_days integer not null default 7,
  churn_risk_inactive_days integer not null default 14,
  widget_preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists owner_settings_updated_idx on public.owner_settings(updated_at desc);

alter table public.owner_settings enable row level security;

drop policy if exists owner_settings_select_owner_admin on public.owner_settings;
create policy owner_settings_select_owner_admin
  on public.owner_settings
  for select
  using (
    auth.uid() in (
      select user_id
      from public.owner_admin_users
      where is_active = true
        and role in ('owner', 'admin')
    )
  );

drop policy if exists owner_settings_upsert_self on public.owner_settings;
create policy owner_settings_upsert_self
  on public.owner_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists owner_settings_update_self on public.owner_settings;
create policy owner_settings_update_self
  on public.owner_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
