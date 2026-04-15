-- Ocupaloc D1 schema (SQLite)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  category TEXT,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'none',
  current_period_end INTEGER,
  price_paid INTEGER,
  currency TEXT NOT NULL DEFAULT 'RON',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patron_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  duration_min INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  trust_score INTEGER NOT NULL DEFAULT 100,
  banned_until TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE (tenant_id, phone)
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL,
  total_price INTEGER NOT NULL,
  total_duration INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'client',
  block_reason TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booking_services (
  id TEXT PRIMARY KEY NOT NULL,
  booking_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS working_hours (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  weekday INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  break_start TEXT,
  break_end TEXT,
  is_closed INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY NOT NULL,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  tenant_id TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS waitlist_requests (
  id TEXT PRIMARY KEY NOT NULL,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  requested_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bookings_tenant_start ON bookings(tenant_id, start_time);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_phone ON clients(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_services_tenant_active ON services(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_patron_sessions_phone_expires ON patron_sessions(phone, expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose_expires ON otp_codes(phone, purpose, expires_at);
