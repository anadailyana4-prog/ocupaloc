-- Harden owner portal RLS and privileges.
-- Important: service_role still bypasses RLS for system jobs and secure endpoints.

-- owner_admin_users: prevent direct writes from authenticated/anon clients.
drop policy if exists owner_admin_users_insert_system on public.owner_admin_users;
drop policy if exists owner_admin_users_select_for_self on public.owner_admin_users;
drop policy if exists owner_admin_users_select_for_owner_admins on public.owner_admin_users;
drop policy if exists owner_admin_users_no_client_inserts on public.owner_admin_users;
drop policy if exists owner_admin_users_no_client_updates on public.owner_admin_users;
drop policy if exists owner_admin_users_no_client_deletes on public.owner_admin_users;

create policy owner_admin_users_select_for_self
  on public.owner_admin_users
  for select
  using (auth.uid() = user_id);

create policy owner_admin_users_select_for_owner_admins
  on public.owner_admin_users
  for select
  using (
    auth.uid() in (
      select user_id
      from public.owner_admin_users
      where is_active = true
        and role in ('owner', 'admin')
    )
  );

create policy owner_admin_users_no_client_inserts
  on public.owner_admin_users
  for insert
  to authenticated, anon
  with check (false);

create policy owner_admin_users_no_client_updates
  on public.owner_admin_users
  for update
  to authenticated, anon
  using (false)
  with check (false);

create policy owner_admin_users_no_client_deletes
  on public.owner_admin_users
  for delete
  to authenticated, anon
  using (false);

-- owner_audit_logs: prevent direct reads/writes except owner/admin reads.
drop policy if exists owner_audit_logs_access on public.owner_audit_logs;
drop policy if exists owner_audit_logs_insert on public.owner_audit_logs;
drop policy if exists owner_audit_logs_no_client_inserts on public.owner_audit_logs;
drop policy if exists owner_audit_logs_no_client_updates on public.owner_audit_logs;
drop policy if exists owner_audit_logs_no_client_deletes on public.owner_audit_logs;

create policy owner_audit_logs_access
  on public.owner_audit_logs
  for select
  using (
    auth.uid() in (
      select user_id
      from public.owner_admin_users
      where is_active = true
        and role in ('owner', 'admin')
    )
  );

create policy owner_audit_logs_no_client_inserts
  on public.owner_audit_logs
  for insert
  to authenticated, anon
  with check (false);

create policy owner_audit_logs_no_client_updates
  on public.owner_audit_logs
  for update
  to authenticated, anon
  using (false)
  with check (false);

create policy owner_audit_logs_no_client_deletes
  on public.owner_audit_logs
  for delete
  to authenticated, anon
  using (false);

-- business_activity_events: allow insert only to business owners for own business or owner/admins.
drop policy if exists business_activity_events_insert on public.business_activity_events;
drop policy if exists business_activity_events_insert_guarded on public.business_activity_events;

create policy business_activity_events_insert_guarded
  on public.business_activity_events
  for insert
  with check (
    exists (
      select 1
      from public.profesionisti p
      where p.id = business_activity_events.profesionist_id
        and p.user_id = auth.uid()
    )
    or auth.uid() in (
      select user_id
      from public.owner_admin_users
      where is_active = true
        and role in ('owner', 'admin')
    )
  );

-- cron_job_runs: deny direct writes from clients.
drop policy if exists cron_job_runs_insert on public.cron_job_runs;
drop policy if exists cron_job_runs_no_client_inserts on public.cron_job_runs;
drop policy if exists cron_job_runs_no_client_updates on public.cron_job_runs;
drop policy if exists cron_job_runs_no_client_deletes on public.cron_job_runs;

create policy cron_job_runs_no_client_inserts
  on public.cron_job_runs
  for insert
  to authenticated, anon
  with check (false);

create policy cron_job_runs_no_client_updates
  on public.cron_job_runs
  for update
  to authenticated, anon
  using (false)
  with check (false);

create policy cron_job_runs_no_client_deletes
  on public.cron_job_runs
  for delete
  to authenticated, anon
  using (false);
