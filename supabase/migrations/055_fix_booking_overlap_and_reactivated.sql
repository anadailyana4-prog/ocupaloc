-- Migration 055 (renamed from duplicate prefix 036; see supabase/MIGRATIONS.md).
-- Fix two correctness issues in book_appointment_atomic (slug-based version from 026):
--
--   1) Subscription gate ignored the 'reactivated' status. A professional whose
--      subscription was canceled and then reactivated (see entitlement.ts, which
--      already treats 'reactivated' as active) could not receive bookings. We add
--      'reactivated' to the allowed statuses so the RPC matches the app.
--
--   2) Slot-conflict detection used only the raw service duration, ignoring
--      pauza_intre_clienti and timp_pregatire. The public availability grid
--      (slots.ts) reserves the full window (duration + buffers), so the DB could
--      accept a booking that overlaps another booking's buffer — a double-booking.
--      We now compute the real end time (v_data_final) BEFORE the conflict check
--      and use it, so the DB matches exactly what the UI offered.
--
-- Everything else is identical to migration 026.

CREATE OR REPLACE FUNCTION book_appointment_atomic(
  p_prof_slug TEXT,
  p_service_id UUID,
  p_slot_start TIMESTAMPTZ,
  p_client_phone TEXT,
  p_client_name TEXT,
  p_client_email TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  programare_id UUID,
  error_code TEXT,
  error_message TEXT
) AS $$
DECLARE
  v_prof_id UUID;
  v_prof_record RECORD;
  v_service_record RECORD;
  v_subscription_status TEXT;
  v_period_end TIMESTAMPTZ;
  v_is_blocked BOOLEAN;
  v_subscription_allowed BOOLEAN;
  v_conflict BOOLEAN;
  v_min_notice_minutes INT;
  v_max_future INT;
  v_cancel_threshold INT;
  v_cancel_window_days INT;
  v_future_count INT := 0;
  v_cancel_count INT := 0;
  v_cutoff_iso TEXT;
  v_data_final TIMESTAMPTZ;
  v_has_earlier_booking BOOLEAN;
  v_new_programare_id UUID;
  v_slot_end TIMESTAMPTZ;
BEGIN

  -- 1. Lookup profesionist by slug (FOR UPDATE to lock)
  SELECT id, pauza_intre_clienti, timp_pregatire, smart_rules_enabled,
         smart_min_notice_minutes, smart_max_future_bookings,
         smart_client_cancel_threshold, smart_cancel_window_days, created_at
  INTO v_prof_record
  FROM public.profesionisti
  WHERE slug = p_prof_slug
  FOR UPDATE;

  IF v_prof_record IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'PROFESIONIST_NOT_FOUND', 'Pagina nu există.';
    RETURN;
  END IF;

  v_prof_id := v_prof_record.id;

  -- 2. Lookup service (FOR UPDATE to lock)
  SELECT id, durata_minute
  INTO v_service_record
  FROM public.servicii
  WHERE id = p_service_id
    AND profesionist_id = v_prof_id
    AND activ = true
  FOR UPDATE;

  IF v_service_record IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'SERVICE_NOT_FOUND', 'Serviciu invalid.';
    RETURN;
  END IF;

  -- 3. Check entitlement (subscription active, reactivated or in trial)
  SELECT status, current_period_end
  INTO v_subscription_status, v_period_end
  FROM public.subscriptions
  WHERE profesionist_id = v_prof_id
  ORDER BY created_at DESC
  LIMIT 1;

  v_subscription_allowed := FALSE;

  IF v_subscription_status IS NULL THEN
    -- No subscription record; assume legacy trial (safety net for old accounts)
    -- Check if created_at is within trial window (30 days)
    IF (NOW() - v_prof_record.created_at) <= INTERVAL '30 days' THEN
      v_subscription_allowed := TRUE;
    ELSE
      RETURN QUERY SELECT FALSE, NULL::UUID, 'NO_SUBSCRIPTION', 'Abonament inactiv. Contactează furnizor.';
      RETURN;
    END IF;
  ELSIF v_subscription_status IN ('active', 'trialing', 'reactivated') THEN
    IF v_period_end IS NULL OR NOW() <= v_period_end THEN
      v_subscription_allowed := TRUE;
    ELSE
      RETURN QUERY SELECT FALSE, NULL::UUID, 'NO_SUBSCRIPTION', 'Abonament inactiv. Contactează furnizor.';
      RETURN;
    END IF;
  ELSIF v_subscription_status = 'past_due' THEN
    IF v_period_end IS NOT NULL AND NOW() <= v_period_end + INTERVAL '7 days' THEN
      v_subscription_allowed := TRUE;
    ELSE
      RETURN QUERY SELECT FALSE, NULL::UUID, 'NO_SUBSCRIPTION', 'Abonament inactiv. Contactează furnizor.';
      RETURN;
    END IF;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::UUID, 'NO_SUBSCRIPTION', 'Abonament inactiv. Contactează furnizor.';
    RETURN;
  END IF;

  -- 4. Check client not blocked
  SELECT EXISTS(
    SELECT 1 FROM public.clienti_blocati
    WHERE profesionist_id = v_prof_id
      AND telefon = p_client_phone
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'CLIENT_BLOCKED', 'Ne pare rău, sună direct pentru programare.';
    RETURN;
  END IF;

  -- 5. Reject bookings in the past (independent of smart rules)
  IF p_slot_start <= NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'SLOT_IN_PAST', 'Slot expirat — alege o oră viitoare.';
    RETURN;
  END IF;

  -- 6. Smart rules checks (if enabled)
  IF v_prof_record.smart_rules_enabled THEN
    v_min_notice_minutes := v_prof_record.smart_min_notice_minutes;
    v_max_future := v_prof_record.smart_max_future_bookings;
    v_cancel_threshold := v_prof_record.smart_client_cancel_threshold;
    v_cancel_window_days := v_prof_record.smart_cancel_window_days;

    -- Min notice check
    IF v_min_notice_minutes > 0 THEN
      IF p_slot_start < NOW() + (v_min_notice_minutes || ' minutes')::INTERVAL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'MIN_NOTICE_VIOLATION', 
          'Rezervările se fac cu minim ' || v_min_notice_minutes || ' minute înainte.';
        RETURN;
      END IF;
    END IF;

    -- Max future bookings check
    IF v_max_future > 0 THEN
      SELECT COUNT(*)
      INTO v_future_count
      FROM public.programari
      WHERE profesionist_id = v_prof_id
        AND telefon_client = p_client_phone
        AND status = 'confirmat'
        AND data_start >= NOW();

      IF v_future_count >= v_max_future THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'MAX_FUTURE_VIOLATION',
          'Ai atins limita de programări active pentru această locație.';
        RETURN;
      END IF;
    END IF;

    -- Cancellation threshold check
    IF v_cancel_threshold > 0 THEN
      v_cutoff_iso := (NOW() - (v_cancel_window_days || ' days')::INTERVAL)::TEXT;

      SELECT COUNT(DISTINCT pse.programare_id)
      INTO v_cancel_count
      FROM public.programari_status_events pse
      WHERE pse.profesionist_id = v_prof_id
        AND pse.status = 'anulat'
        AND pse.source = 'client_link'
        AND pse.created_at >= v_cutoff_iso::TIMESTAMPTZ
        AND pse.programare_id IN (
          SELECT id FROM public.programari
          WHERE profesionist_id = v_prof_id
            AND telefon_client = p_client_phone
        );

      IF v_cancel_count >= v_cancel_threshold THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'CANCEL_THRESHOLD_VIOLATION',
          'Momentan nu poți rezerva online. Te rugăm să contactezi direct business-ul.';
        RETURN;
      END IF;
    END IF;
  END IF;

  -- 7. Calculate data_final using exact logic from slots.ts
  -- data_final = slot_start + durata_service + pauza_intre_clienti + (timp_pregatire if first booking that day else 0)
  -- Computed BEFORE the conflict check so the reserved window matches the public grid.
  SELECT EXISTS(
    SELECT 1 FROM public.programari
    WHERE profesionist_id = v_prof_id
      AND status != 'anulat'
      AND data_start < p_slot_start
  ) INTO v_has_earlier_booking;

  v_data_final := p_slot_start + 
    (v_service_record.durata_minute || ' minutes')::INTERVAL +
    (v_prof_record.pauza_intre_clienti || ' minutes')::INTERVAL;

  IF NOT v_has_earlier_booking THEN
    v_data_final := v_data_final + (v_prof_record.timp_pregatire || ' minutes')::INTERVAL;
  END IF;

  -- 8. Slot availability check with FOR UPDATE lock.
  -- Use the full reserved window (v_data_final), not just the raw duration, so we
  -- never accept a booking that overlaps another appointment's buffer time.
  SELECT EXISTS(
    SELECT 1 FROM public.programari
    WHERE profesionist_id = v_prof_id
      AND status != 'anulat'
      AND data_start < v_data_final
      AND data_final > p_slot_start
    FOR UPDATE
  ) INTO v_conflict;

  IF v_conflict THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'SLOT_CONFLICT', 'Slotul nu mai e disponibil. Alege altă oră.';
    RETURN;
  END IF;

  -- 9. Insert booking atomically
  INSERT INTO public.programari (
    profesionist_id,
    serviciu_id,
    tenant_id,
    nume_client,
    telefon_client,
    email_client,
    data_start,
    data_final,
    status,
    creat_de
  ) VALUES (
    v_prof_id,
    v_service_record.id,
    v_prof_id,
    p_client_name,
    p_client_phone,
    NULLIF(TRIM(p_client_email), ''),
    p_slot_start,
    v_data_final,
    'confirmat',
    'client'
  )
  RETURNING id INTO v_new_programare_id;

  -- 10. Success
  RETURN QUERY SELECT TRUE, v_new_programare_id, NULL::TEXT, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
