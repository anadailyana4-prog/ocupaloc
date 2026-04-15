-- Public org metadata + optional contact phone for /[slug] landing

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE OR REPLACE FUNCTION public.get_public_org_for_slug(p_slug TEXT)
RETURNS TABLE (
  name TEXT,
  category TEXT,
  phone TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.name, o.category, o.phone
  FROM public.organizations o
  WHERE o.slug = p_slug
    AND o.suspended_at IS NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_org_for_slug(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_public_services_for_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  duration_min INT,
  price NUMERIC,
  organization_name TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    s.duration_min,
    s.price,
    o.name
  FROM public.services s
  INNER JOIN public.organizations o ON o.id = s.organization_id
  WHERE o.slug = p_slug
    AND o.suspended_at IS NULL
    AND s.is_active = true
    AND s.deleted_at IS NULL
  ORDER BY s.name;
$$;
