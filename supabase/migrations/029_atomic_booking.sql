CREATE OR REPLACE FUNCTION book_appointment_atomic(
  p_profesionist_id UUID,
  p_serviciu_id UUID,
  p_data_start TIMESTAMPTZ,
  p_data_final TIMESTAMPTZ,
  p_telefon_client TEXT,
  p_nume_client TEXT,
  p_email_client TEXT DEFAULT NULL
) RETURNS TABLE(programare_id UUID, status TEXT) AS $$
DECLARE
  v_phone_digits TEXT;
  v_phone_normalized TEXT;
BEGIN
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

  v_phone_digits := regexp_replace(COALESCE(p_telefon_client, ''), '\\D', '', 'g');
  IF v_phone_digits ~ '^0[0-9]{9}$' THEN
    v_phone_normalized := '40' || substr(v_phone_digits, 2);
  ELSIF v_phone_digits ~ '^40[0-9]{9}$' THEN
    v_phone_normalized := v_phone_digits;
  ELSE
    v_phone_normalized := v_phone_digits;
  END IF;
  
  -- 1. Check slot conflict
  PERFORM 1 FROM programari 
  WHERE profesionist_id = p_profesionist_id 
    AND serviciu_id = p_serviciu_id 
    AND data_start < p_data_final 
    AND data_final > p_data_start
    AND status NOT IN ('anulat', 'noaparit')
  FOR UPDATE SKIP LOCKED LIMIT 1;
  
  IF FOUND THEN
    RAISE EXCEPTION 'CONFLICT: Slot already booked';
  END IF;
  
  -- 2. Check blocked client  
  PERFORM 1 FROM clienti_blocati 
  WHERE profesionist_id = p_profesionist_id 
    AND (
      CASE
        WHEN regexp_replace(COALESCE(telefon, ''), '\\D', '', 'g') ~ '^0[0-9]{9}$' THEN
          '40' || substr(regexp_replace(COALESCE(telefon, ''), '\\D', '', 'g'), 2)
        WHEN regexp_replace(COALESCE(telefon, ''), '\\D', '', 'g') ~ '^40[0-9]{9}$' THEN
          regexp_replace(COALESCE(telefon, ''), '\\D', '', 'g')
        ELSE
          regexp_replace(COALESCE(telefon, ''), '\\D', '', 'g')
      END
    ) = v_phone_normalized
  FOR UPDATE SKIP LOCKED LIMIT 1;
  
  IF FOUND THEN
    RAISE EXCEPTION 'BLOCKED: Client is blocked';
  END IF;
  
  -- 3. Check entitlement
  PERFORM 1 FROM subscriptions 
  WHERE profesionist_id = p_profesionist_id 
    AND status IN ('active', 'trialing') 
    AND (current_period_end IS NULL OR current_period_end > NOW())
  FOR UPDATE LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOSUBSCRIPTION: No active subscription';
  END IF;
  
  -- 4. All checks passed, INSERT
  INSERT INTO programari (profesionist_id, serviciu_id, nume_client, telefon_client, 
                         email_client, data_start, data_final, status, creat_de)
  VALUES (p_profesionist_id, p_serviciu_id, p_nume_client, v_phone_normalized,
          p_email_client, p_data_start, p_data_final, 'confirmat', 'client')
  RETURNING id, status;
END;
$$ LANGUAGE plpgsql;