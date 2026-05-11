-- Owner Admin Portal — DB schema for owner/admin control center
-- Tables: owner_admin_users, owner_notes, owner_audit_logs, business_activity_events, cron_job_runs
-- Plus: new columns for activity tracking

-- 1. Owner admin users (who can access owner portal)
CREATE TABLE IF NOT EXISTS public.owner_admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner', -- 'owner', 'admin', 'viewer'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX owner_admin_users_user_id_idx ON public.owner_admin_users(user_id);
CREATE INDEX owner_admin_users_role_idx ON public.owner_admin_users(role);

ALTER TABLE public.owner_admin_users ENABLE ROW LEVEL SECURITY;

-- RLS: owner portal data visible only to owner admins
CREATE POLICY owner_admin_users_select_for_self
  ON public.owner_admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert first owner during init
CREATE POLICY owner_admin_users_insert_system
  ON public.owner_admin_users FOR INSERT
  WITH CHECK (true); -- Will be gated by application logic

CREATE POLICY owner_admin_users_select_for_owner_admins
  ON public.owner_admin_users FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.owner_admin_users WHERE is_active = true AND role IN ('owner', 'admin')
    )
  );

---

-- 2. Owner notes — internal CRM notes per business (owner-only)
CREATE TABLE IF NOT EXISTS public.owner_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesionist_id UUID NOT NULL REFERENCES public.profesionisti(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}', -- ['hot_lead', 'churn_risk', 'vip', 'needs_help', 'follow_up']
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX owner_notes_profesionist_idx ON public.owner_notes(profesionist_id);
CREATE INDEX owner_notes_created_at_idx ON public.owner_notes(created_at DESC);

ALTER TABLE public.owner_notes ENABLE ROW LEVEL SECURITY;

-- Only owner admins can see/edit owner_notes
CREATE POLICY owner_notes_access_for_admins
  ON public.owner_notes FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.owner_admin_users WHERE is_active = true AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.owner_admin_users WHERE is_active = true AND role IN ('owner', 'admin')
    )
  );

---

-- 3. Owner audit logs — track admin portal access & actions
CREATE TABLE IF NOT EXISTS public.owner_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'login', 'view_dashboard', 'view_business', 'add_note', 'cancel_subscription'
  resource_type TEXT, -- 'business', 'subscription', 'note', NULL if global
  resource_id UUID,
  metadata JSONB, -- extra context
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX owner_audit_logs_user_id_idx ON public.owner_audit_logs(user_id, created_at DESC);
CREATE INDEX owner_audit_logs_action_idx ON public.owner_audit_logs(action);
CREATE INDEX owner_audit_logs_resource_idx ON public.owner_audit_logs(resource_type, resource_id);

ALTER TABLE public.owner_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can see audit logs
CREATE POLICY owner_audit_logs_access
  ON public.owner_audit_logs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.owner_admin_users WHERE is_active = true AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY owner_audit_logs_insert
  ON public.owner_audit_logs FOR INSERT
  WITH CHECK (true); -- Application logs this server-side

---

-- 4. Business activity events — track what each business does
CREATE TABLE IF NOT EXISTS public.business_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesionist_id UUID NOT NULL REFERENCES public.profesionisti(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login', 'booking_created', 'onboarding_step', 'service_added', 'payment_processed'
  metadata JSONB, -- e.g. {"step": 2} or {"service_name": "Tuns"}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX business_activity_events_profesionist_idx ON public.business_activity_events(profesionist_id, created_at DESC);
CREATE INDEX business_activity_events_type_idx ON public.business_activity_events(event_type);

ALTER TABLE public.business_activity_events ENABLE ROW LEVEL SECURITY;

-- Businesses can see their own activity; owner/admin can see all
CREATE POLICY business_activity_events_select_for_owner
  ON public.business_activity_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profesionisti p
      WHERE p.id = profesionist_id AND p.user_id = auth.uid()
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM public.owner_admin_users WHERE is_active = true AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY business_activity_events_insert
  ON public.business_activity_events FOR INSERT
  WITH CHECK (true); -- Application logs this

---

-- 5. Cron job runs — track cron execution results
CREATE TABLE IF NOT EXISTS public.cron_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL, -- 'send-emails', 'send-reminders', 'cleanup-idempotency-keys'
  status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  duration_ms INT,
  error_message TEXT,
  items_processed INT DEFAULT 0,
  items_failed INT DEFAULT 0,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cron_job_runs_job_name_idx ON public.cron_job_runs(job_name, run_at DESC);
CREATE INDEX cron_job_runs_status_idx ON public.cron_job_runs(status);

ALTER TABLE public.cron_job_runs ENABLE ROW LEVEL SECURITY;

-- Only owner admins can view
CREATE POLICY cron_job_runs_access
  ON public.cron_job_runs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.owner_admin_users WHERE is_active = true AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY cron_job_runs_insert
  ON public.cron_job_runs FOR INSERT
  WITH CHECK (true); -- System inserts this

---

-- 6. New columns on profesionisti for activity tracking

ALTER TABLE public.profesionisti
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_booking_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_booking_at TIMESTAMPTZ;

---

-- 7. Helper function: get current owner admin user
CREATE OR REPLACE FUNCTION get_owner_admin_user()
RETURNS TABLE(id uuid, user_id uuid, role text, is_active boolean) AS $$
  SELECT id, user_id, role, is_active
  FROM public.owner_admin_users
  WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;

---

-- 8. Helper function: is_owner_admin
CREATE OR REPLACE FUNCTION is_owner_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.owner_admin_users
    WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

---

-- 9. Audit function: log owner action
CREATE OR REPLACE FUNCTION log_owner_action(
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  IF is_owner_admin() THEN
    INSERT INTO public.owner_audit_logs (
      user_id, action, resource_type, resource_id, metadata
    ) VALUES (
      auth.uid(), p_action, p_resource_type, p_resource_id, p_metadata
    )
    RETURNING id INTO v_id;
    RETURN v_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

---

COMMENT ON TABLE public.owner_admin_users IS 'Users with owner/admin access to the owner control portal';
COMMENT ON TABLE public.owner_notes IS 'Internal CRM notes per business, visible only to owner/admin';
COMMENT ON TABLE public.owner_audit_logs IS 'Audit trail of all owner portal actions';
COMMENT ON TABLE public.business_activity_events IS 'Activity events for each business (for analytics)';
COMMENT ON TABLE public.cron_job_runs IS 'Execution results of scheduled cron jobs';
