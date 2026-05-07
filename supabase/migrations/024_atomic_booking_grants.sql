grant execute on function public.book_appointment_atomic(text, uuid, timestamptz, text, text, text)
to anon, authenticated, service_role;

grant execute on function public.cleanup_expired_idempotency_keys()
to service_role;