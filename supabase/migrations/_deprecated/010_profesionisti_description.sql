-- Text public scurt pe pagina /[slug] (MVP profesionisti)
ALTER TABLE public.profesionisti
  ADD COLUMN IF NOT EXISTS description text;
