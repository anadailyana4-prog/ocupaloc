CREATE TABLE IF NOT EXISTS public.demos (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL CHECK (length(business_name) BETWEEN 3 AND 40),
  business_type TEXT NOT NULL CHECK (business_type IN ('Frizerie', 'Salon', 'Manichiură', 'Cosmetică', 'Barber')),
  city TEXT NOT NULL CHECK (city IN ('București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Brașov', 'Sibiu', 'Oradea', 'Craiova')),
  services JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_demos_expires_at ON public.demos (expires_at);
CREATE INDEX IF NOT EXISTS idx_demos_created_at ON public.demos (created_at);

ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS demos_select_active ON public.demos;
CREATE POLICY demos_select_active ON public.demos
  FOR SELECT USING (expires_at > NOW());

DROP POLICY IF EXISTS demos_insert_anyone ON public.demos;
CREATE POLICY demos_insert_anyone ON public.demos
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS demos_no_update ON public.demos;
CREATE POLICY demos_no_update ON public.demos
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS demos_no_delete ON public.demos;
CREATE POLICY demos_no_delete ON public.demos
  FOR DELETE USING (false);

GRANT SELECT, INSERT ON public.demos TO anon, authenticated;
