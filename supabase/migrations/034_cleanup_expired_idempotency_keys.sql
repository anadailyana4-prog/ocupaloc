-- Cleanup routine for expired idempotency keys
-- Called by cron job /api/jobs/cleanup-idempotency-keys
-- Deletes keys older than 24 hours to prevent table growth

DELETE FROM public.idempotencykeys 
WHERE expiresat < NOW();
