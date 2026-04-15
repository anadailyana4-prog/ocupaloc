-- 003_get_availability.sql — sloturi publice (15 min), schema Task 1 (organizations, services, staff_profiles, working_hours, appointments)

CREATE TABLE IF NOT EXISTS public.blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff_profiles (user_id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  CONSTRAINT blocked_times_range CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_blocked_times_org ON public.blocked_times (organization_id);
CREATE INDEX IF NOT EXISTS idx_blocked_times_staff ON public.blocked_times (staff_id);

ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked_times_tenant_all" ON public.blocked_times FOR ALL
  USING (organization_id IN (SELECT get_my_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_my_org_ids()));

CREATE OR REPLACE FUNCTION public.get_organization_id_by_public_slug(p_slug TEXT)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.organizations WHERE slug = p_slug LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.list_public_services_for_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  duration_min INT,
  price NUMERIC,
  organization_name TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    s.duration_min,
    s.price,
    o.name
  FROM public.services s
  INNER JOIN public.organizations o ON o.id = s.organization_id
  WHERE o.slug = p_slug
    AND s.is_active = true
    AND s.deleted_at IS NULL
  ORDER BY s.name;
$$;

CREATE OR REPLACE FUNCTION public.get_availability(
  p_org_id UUID,
  p_service_id UUID,
  p_date DATE,
  p_timezone TEXT DEFAULT NULL,
  p_staff_id UUID DEFAULT NULL
)
RETURNS TABLE (
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  staff_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duration INT;
  v_buffer INT;
  v_tz TEXT;
  v_day day_of_week;
BEGIN
  SELECT
    s.duration_min,
    COALESCE(s.buffer_min, 0),
    COALESCE(NULLIF(trim(p_timezone), ''), o.timezone, 'Europe/Bucharest')
  INTO v_duration, v_buffer, v_tz
  FROM public.services s
  INNER JOIN public.organizations o ON o.id = s.organization_id
  WHERE s.id = p_service_id
    AND s.organization_id = p_org_id
    AND s.deleted_at IS NULL
    AND s.is_active = true;

  IF v_duration IS NULL THEN
    RETURN;
  END IF;

  v_day := CASE (EXTRACT(ISODOW FROM p_date::date))::INT
    WHEN 1 THEN 'mon'::day_of_week
    WHEN 2 THEN 'tue'::day_of_week
    WHEN 3 THEN 'wed'::day_of_week
    WHEN 4 THEN 'thu'::day_of_week
    WHEN 5 THEN 'fri'::day_of_week
    WHEN 6 THEN 'sat'::day_of_week
    WHEN 7 THEN 'sun'::day_of_week
  END;

  RETURN QUERY
  WITH staff_for_service AS (
    SELECT sp.user_id AS sid
    FROM public.staff_profiles sp
    WHERE sp.organization_id = p_org_id
      AND COALESCE(sp.is_bookable, true) = true
      AND (p_staff_id IS NULL OR sp.user_id = p_staff_id)
      AND (
        EXISTS (
          SELECT 1
          FROM public.staff_services ss
          WHERE ss.staff_id = sp.user_id
            AND ss.service_id = p_service_id
        )
        OR NOT EXISTS (
          SELECT 1
          FROM public.staff_services ss0
          WHERE ss0.service_id = p_service_id
        )
      )
  ),
  staff_day AS (
    SELECT sfs.sid, wh.start_time AS wh_start, wh.end_time AS wh_end
    FROM staff_for_service sfs
    INNER JOIN public.working_hours wh ON wh.staff_id = sfs.sid AND wh.day = v_day
  ),
  bounds AS (
    SELECT
      sd.sid,
      ((p_date + sd.wh_start)::TIMESTAMP AT TIME ZONE v_tz) AS t_start,
      ((p_date + sd.wh_end)::TIMESTAMP AT TIME ZONE v_tz) AS t_end
    FROM staff_day sd
  ),
  candidates AS (
    SELECT
      b.sid,
      (b.t_start + (gs.n * INTERVAL '15 minutes')) AS slot_start,
      (b.t_start + (gs.n * INTERVAL '15 minutes')) + (v_duration * INTERVAL '1 minute') AS slot_end
    FROM bounds b
    CROSS JOIN LATERAL generate_series(
      0,
      GREATEST(
        0,
        LEAST(
          200,
          FLOOR((EXTRACT(EPOCH FROM (b.t_end - b.t_start)) - (v_duration * 60.0)) / 900.0)::INT
        )
      )
    ) AS gs (n)
    WHERE (b.t_start + (gs.n * INTERVAL '15 minutes')) + (v_duration * INTERVAL '1 minute') <= b.t_end
      AND (b.t_start + (gs.n * INTERVAL '15 minutes')) > now()
  )
  SELECT
    c.slot_start,
    c.slot_end,
    c.sid
  FROM candidates c
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.staff_id = c.sid
      AND a.status IN ('confirmed', 'pending')
      AND tstzrange(a.start_time, a.end_time, '[)')
        && tstzrange(
          c.slot_start - (v_buffer * INTERVAL '1 minute'),
          c.slot_end + (v_buffer * INTERVAL '1 minute'),
          '[)'
        )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.blocked_times bt
    WHERE bt.organization_id = p_org_id
      AND (bt.staff_id IS NULL OR bt.staff_id = c.sid)
      AND tstzrange(bt.start_time, bt.end_time, '[)')
        && tstzrange(c.slot_start, c.slot_end, '[)')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_organization_id_by_public_slug(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_services_for_slug(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_availability(UUID, UUID, DATE, TEXT, UUID) TO anon, authenticated;
