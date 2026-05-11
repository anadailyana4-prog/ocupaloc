-- Drop the UUID-based book_appointment_atomic function from migration 029
-- Migration 023 defines the correct slug-based version
-- This cleanup removes the duplicate/dead code path

DROP FUNCTION IF EXISTS public.book_appointment_atomic(
  UUID,  -- p_profesionist_id
  UUID,  -- p_serviciu_id
  TIMESTAMPTZ,  -- p_data_start
  TIMESTAMPTZ,  -- p_data_final
  TEXT,  -- p_telefon_client
  TEXT,  -- p_nume_client
  TEXT   -- p_email_client
);
