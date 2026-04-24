CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.profesionisti
  ADD COLUMN IF NOT EXISTS oras text;

CREATE INDEX IF NOT EXISTS idx_profesionisti_oras_trgm
  ON public.profesionisti USING gin (oras gin_trgm_ops);
