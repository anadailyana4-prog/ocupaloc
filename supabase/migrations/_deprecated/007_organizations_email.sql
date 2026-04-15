-- Notificări email la rezervări (destinatar salon)

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS email TEXT;
