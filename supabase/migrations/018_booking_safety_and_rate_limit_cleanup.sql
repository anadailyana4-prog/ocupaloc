CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'programari_no_overlap_active'
  ) THEN
    ALTER TABLE public.programari
      ADD CONSTRAINT programari_no_overlap_active
      EXCLUDE USING gist (
        profesionist_id WITH =,
        tstzrange(data_start, data_final, '[)') WITH &&
      )
      WHERE (status <> 'anulat');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.cleanup_api_rate_limits(p_keep_for_seconds int DEFAULT 3600)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE reset_at < now() - make_interval(secs => GREATEST(60, p_keep_for_seconds));

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_api_rate_limits(int) FROM public;
GRANT EXECUTE ON FUNCTION public.cleanup_api_rate_limits(int) TO service_role;
