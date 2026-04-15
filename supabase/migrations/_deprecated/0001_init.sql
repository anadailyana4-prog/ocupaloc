-- 0001_init.sql
-- OCUPALOC CORE SCHEMA + RLS + RPC

-- 1. EXTENSII
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Obligatoriu pentru EXCLUDE cu = pe UUID

-- 2. ENUMS
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'staff');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE day_of_week AS ENUM ('mon','tue','wed','thu','fri','sat','sun');

-- 4. TABELE CORE
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]{3,30}$'),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Bucharest',
  onboarding_step INT NOT NULL DEFAULT 1,
  onboarding_completed_at TIMESTAMPTZ,
  stripe_account_id TEXT,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

-- 3. FUNCȚIE HELPER RLS
CREATE OR REPLACE FUNCTION get_my_org_ids() RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$;

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_min INT NOT NULL CHECK (duration_min > 0 AND duration_min <= 480),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  buffer_min INT NOT NULL DEFAULT 0 CHECK (buffer_min >= 0),
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE staff_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_bookable BOOLEAN DEFAULT true
);

CREATE TABLE staff_services (
  staff_id UUID REFERENCES staff_profiles(user_id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

CREATE TABLE working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(user_id) ON DELETE CASCADE,
  day day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  UNIQUE (staff_id, day),
  CONSTRAINT valid_hours CHECK (start_time < end_time)
);

CREATE TABLE time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(user_id) ON DELETE CASCADE,
  range TSTZRANGE NOT NULL,
  reason TEXT
);

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT contact_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  staff_id UUID NOT NULL REFERENCES staff_profiles(user_id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'confirmed',
  price NUMERIC(10,2) NOT NULL,
  notes TEXT,
  cancel_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_range CHECK (start_time < end_time),
  CONSTRAINT no_overlap EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  ) WHERE (status IN ('confirmed', 'pending'))
);

-- 5. INDEXES
CREATE INDEX idx_appointments_org_staff_time ON appointments (organization_id, staff_id, start_time);
CREATE INDEX idx_appointments_org_status ON appointments (organization_id, status);
CREATE INDEX idx_appointments_range ON appointments USING GIST (staff_id, tstzrange(start_time, end_time, '[)'));
CREATE INDEX idx_clients_search ON clients USING GIN (to_tsvector('simple', full_name || ' ' || coalesce(email,'') || ' ' || coalesce(phone,'')));
CREATE INDEX idx_services_org_active ON services (organization_id) WHERE is_active = true AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_clients_org_email ON clients (organization_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_clients_org_phone ON clients (organization_id, phone) WHERE phone IS NOT NULL;

-- 6. RLS ENABLE
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES
CREATE POLICY "orgs_select_member" ON organizations FOR SELECT USING (id IN (SELECT get_my_org_ids()));
CREATE POLICY "orgs_update_admin" ON organizations FOR UPDATE USING (id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "profiles_select_self" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "members_select_own_org" ON organization_members FOR SELECT USING (organization_id IN (SELECT get_my_org_ids()));
CREATE POLICY "members_insert_owner" ON organization_members FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "services_tenant_all" ON services FOR ALL USING (organization_id IN (SELECT get_my_org_ids())) WITH CHECK (organization_id IN (SELECT get_my_org_ids()));
CREATE POLICY "staff_profiles_tenant_all" ON staff_profiles FOR ALL USING (organization_id IN (SELECT get_my_org_ids())) WITH CHECK (organization_id IN (SELECT get_my_org_ids()));
CREATE POLICY "staff_services_tenant_all" ON staff_services FOR ALL USING (staff_id IN (SELECT user_id FROM staff_profiles WHERE organization_id IN (SELECT get_my_org_ids())));
CREATE POLICY "working_hours_tenant_all" ON working_hours FOR ALL USING (staff_id IN (SELECT user_id FROM staff_profiles WHERE organization_id IN (SELECT get_my_org_ids())));
CREATE POLICY "time_off_tenant_all" ON time_off FOR ALL USING (staff_id IN (SELECT user_id FROM staff_profiles WHERE organization_id IN (SELECT get_my_org_ids())));
CREATE POLICY "clients_tenant_all" ON clients FOR ALL USING (organization_id IN (SELECT get_my_org_ids())) WITH CHECK (organization_id IN (SELECT get_my_org_ids()));
CREATE POLICY "appointments_tenant_all" ON appointments FOR ALL USING (organization_id IN (SELECT get_my_org_ids())) WITH CHECK (organization_id IN (SELECT get_my_org_ids()));

-- 8. RPC FUNCȚII PENTRU OPERAȚII ATOMICE
CREATE OR REPLACE FUNCTION is_slug_available(slug_to_check TEXT) RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT NOT EXISTS (SELECT 1 FROM organizations WHERE slug = slug_to_check);
$$;

CREATE OR REPLACE FUNCTION reschedule_appointment(p_id UUID, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ)
RETURNS appointments LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_appointment appointments;
BEGIN
  SELECT * INTO v_appointment FROM appointments WHERE id = p_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found or access denied';
  END IF;
  
  IF p_start < now() THEN
    RAISE EXCEPTION 'Cannot reschedule to the past';
  END IF;
  
  UPDATE appointments 
  SET start_time = p_start, end_time = p_end 
  WHERE id = p_id
  RETURNING * INTO v_appointment;
  
  RETURN v_appointment;
END;
$$;

-- 9. TRIGGER PENTRU handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
