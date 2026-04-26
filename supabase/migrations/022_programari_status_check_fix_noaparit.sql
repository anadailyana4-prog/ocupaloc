-- Ensure booking status check constraint matches statuses used by the app.
-- This fixes "Neprezent" updates that set status = 'noaparit'.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'programari_status_check'
      AND conrelid = 'public.programari'::regclass
  ) THEN
    ALTER TABLE public.programari DROP CONSTRAINT programari_status_check;
  END IF;
END $$;

ALTER TABLE public.programari
  ADD CONSTRAINT programari_status_check
  CHECK (status IN ('in_asteptare', 'confirmat', 'finalizat', 'anulat', 'noaparit'));
