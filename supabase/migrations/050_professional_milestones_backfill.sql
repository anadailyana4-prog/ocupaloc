-- Backfill onboarding_completed_at for profiles already at onboarding_pas >= 4.
-- Idempotent: only fills NULL timestamps.

UPDATE public.profesionisti
SET
  onboarding_completed_at = COALESCE(onboarding_completed_at, created_at, NOW()),
  last_activity_at = COALESCE(last_activity_at, created_at, NOW())
WHERE onboarding_pas >= 4
  AND onboarding_completed_at IS NULL;

-- Backfill first_booking_at from earliest confirmed booking per professional.
UPDATE public.profesionisti p
SET
  first_booking_at = sub.first_at,
  last_activity_at = GREATEST(COALESCE(p.last_activity_at, sub.first_at), sub.first_at)
FROM (
  SELECT
    profesionist_id,
    MIN(created_at) AS first_at
  FROM public.programari
  WHERE status = 'confirmat'
  GROUP BY profesionist_id
) sub
WHERE p.id = sub.profesionist_id
  AND p.first_booking_at IS NULL;
