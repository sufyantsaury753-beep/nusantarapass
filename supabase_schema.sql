-- ==============================================================================
-- NUSANTARAPASS: RELATIONAL DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Web Development Competition UINIC 8.0 - Theme: Interconnected Web Solutions
-- Sub-Theme: Sosial Budaya & Lingkungan (SDG 11, 8.9, 12, 14, 15)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE destination_category AS ENUM ('pantai', 'gunung', 'budaya', 'taman_nasional');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE quota_status AS ENUM ('tersedia', 'hampir_penuh', 'penuh', 'ditutup_cuaca');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pass_status AS ENUM ('active', 'used', 'expired', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLE: DESTINATIONS (Objek Wisata, Pantai, Gunung, & Cagar Budaya)
CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category destination_category NOT NULL,
  province VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL, -- Jawa, Sumatera, Bali-Nusra, Kalimantan, Sulawesi, Papua
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  elevation_m INTEGER DEFAULT 0,
  daily_quota INTEGER NOT NULL DEFAULT 500,
  current_visitors INTEGER NOT NULL DEFAULT 0,
  quota_status quota_status NOT NULL DEFAULT 'tersedia',
  photo_url TEXT NOT NULL,
  description TEXT NOT NULL,
  eco_guidelines TEXT, -- Petunjuk kelestarian / peringatan ombak / etika cagar budaya
  wave_status VARCHAR(50) DEFAULT 'Normal (Bendera Hijau)',
  ticket_price INTEGER DEFAULT 15000,
  stamp_icon VARCHAR(50) DEFAULT '🏛️',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE: VISITOR_PASSES (Tiket QR Smart Pass Wisatawan)
CREATE TABLE IF NOT EXISTS visitor_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pass_code VARCHAR(100) UNIQUE NOT NULL,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  visitor_name VARCHAR(255) NOT NULL,
  visitor_email VARCHAR(255) NOT NULL,
  visitor_phone VARCHAR(50) NOT NULL,
  visit_date DATE NOT NULL,
  qr_token VARCHAR(120) UNIQUE NOT NULL,
  status pass_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE: DIGITAL_STAMPS (Koleksi Stempel Paspor Jelajah Nusantara)
CREATE TABLE IF NOT EXISTS digital_stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_email VARCHAR(255) NOT NULL,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  stamp_code VARCHAR(100) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visitor_email, destination_id)
);

-- 6. TABLE: CHECKIN_LOGS (Log Pemindaian Tiket di Gerbang Destinasi)
CREATE TABLE IF NOT EXISTS checkin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pass_id UUID NOT NULL REFERENCES visitor_passes(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  scanned_by_officer VARCHAR(150) DEFAULT 'Petugas Gerbang Konservasi',
  checkin_time TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ==============================================================================
-- INDEXES UNTUK HIGH AVAILABILITY & INTEROPERABILITAS API
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_dest_category ON destinations(category);
CREATE INDEX IF NOT EXISTS idx_dest_province ON destinations(province);
CREATE INDEX IF NOT EXISTS idx_dest_region ON destinations(region);
CREATE INDEX IF NOT EXISTS idx_pass_token ON visitor_passes(qr_token);
CREATE INDEX IF NOT EXISTS idx_stamps_email ON digital_stamps(visitor_email);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read destinations" ON destinations FOR SELECT USING (true);
CREATE POLICY "Public read visitor_passes" ON visitor_passes FOR SELECT USING (true);
CREATE POLICY "Public insert visitor_passes" ON visitor_passes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read digital_stamps" ON digital_stamps FOR SELECT USING (true);
CREATE POLICY "Public insert digital_stamps" ON digital_stamps FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert checkin_logs" ON checkin_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read checkin_logs" ON checkin_logs FOR SELECT USING (true);
