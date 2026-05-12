-- Fix infinite recursion in owner_admin_users RLS policy
-- The self-join in the policy causes infinite recursion.
-- Solution: Remove the recursive policy and rely on server-side checks (middleware + route handlers).
-- The owner_admin_users table should be readable only to self or service role.

-- Drop all existing policies
DROP POLICY IF EXISTS owner_admin_users_select_for_self ON public.owner_admin_users;
DROP POLICY IF EXISTS owner_admin_users_select_for_owner_admins ON public.owner_admin_users;
DROP POLICY IF EXISTS owner_admin_users_no_client_inserts ON public.owner_admin_users;
DROP POLICY IF EXISTS owner_admin_users_no_client_updates ON public.owner_admin_users;
DROP POLICY IF EXISTS owner_admin_users_no_client_deletes ON public.owner_admin_users;
DROP POLICY IF EXISTS owner_admin_users_insert_system ON public.owner_admin_users;

-- Simple policies without recursion:
-- 1. Users can read their own owner record
DROP POLICY IF EXISTS owner_admin_users_select_self ON public.owner_admin_users;
CREATE POLICY owner_admin_users_select_self
  ON public.owner_admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Prevent all inserts/updates/deletes from authenticated/anon clients
-- (Only service_role can insert/update, via init endpoint or admin API)
DROP POLICY IF EXISTS owner_admin_users_no_insert ON public.owner_admin_users;
CREATE POLICY owner_admin_users_no_insert
  ON public.owner_admin_users FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

DROP POLICY IF EXISTS owner_admin_users_no_update ON public.owner_admin_users;
CREATE POLICY owner_admin_users_no_update
  ON public.owner_admin_users FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS owner_admin_users_no_delete ON public.owner_admin_users;
CREATE POLICY owner_admin_users_no_delete
  ON public.owner_admin_users FOR DELETE
  TO authenticated, anon
  USING (false);

-- Fix owner_audit_logs: same issue - remove recursive policy
DROP POLICY IF EXISTS owner_audit_logs_access ON public.owner_audit_logs;
DROP POLICY IF EXISTS owner_audit_logs_no_client_inserts ON public.owner_audit_logs;
DROP POLICY IF EXISTS owner_audit_logs_no_client_updates ON public.owner_audit_logs;
DROP POLICY IF EXISTS owner_audit_logs_no_client_deletes ON public.owner_audit_logs;
DROP POLICY IF EXISTS owner_audit_logs_insert ON public.owner_audit_logs;

-- Simple policy: only service_role can read (via API endpoint)
-- Authenticated/anon users cannot query this table directly via client SDK
DROP POLICY IF EXISTS owner_audit_logs_no_direct_access ON public.owner_audit_logs;
CREATE POLICY owner_audit_logs_no_direct_access
  ON public.owner_audit_logs FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- Fix business_activity_events: same issue
DROP POLICY IF EXISTS business_activity_events_insert_guarded ON public.business_activity_events;
DROP POLICY IF EXISTS business_activity_events_insert ON public.business_activity_events;

-- Keep simple policies - allow business owners to insert their own activity
-- and prevent direct admin inserts (handled by API)
DROP POLICY IF EXISTS business_activity_events_insert_own_business ON public.business_activity_events;
CREATE POLICY business_activity_events_insert_own_business
  ON public.business_activity_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profesionisti p
      WHERE p.id = profesionist_id
        AND p.user_id = auth.uid()
    )
  );

-- Same for owner_notes: remove recursive policy
DROP POLICY IF EXISTS owner_notes_access_for_admins ON public.owner_notes;

-- Simple policy: only service_role can access owner_notes (via API)
-- Authenticated/anon cannot query directly
DROP POLICY IF EXISTS owner_notes_no_direct_access ON public.owner_notes;
CREATE POLICY owner_notes_no_direct_access
  ON public.owner_notes FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);
