begin;

-- Keep the public projection under caller RLS context and satisfy advisor lint.
alter view public.profesionisti_public
  set (security_invoker = true);

commit;
