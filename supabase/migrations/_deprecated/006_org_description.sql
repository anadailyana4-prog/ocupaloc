-- Salon description for public page + dashboard settings

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE OR REPLACE FUNCTION public.get_public_org_for_slug(p_slug TEXT)
RETURNS TABLE (
  name TEXT,
  category TEXT,
  phone TEXT,
  description TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.name, o.category, o.phone, o.description
  FROM public.organizations o
  WHERE o.slug = p_slug
    AND o.suspended_at IS NULL
  LIMIT 1;
$$;
