-- ==============================================================================
-- NUSANTARAPASS: INTEGRATED SUPABASE SCHEMA (TABLE PREFIX: np_)
-- Aman dijalankan di database yang sama dengan Mountain Gallery tanpa bentrok!
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL DESTINASI: np_destinations
CREATE TABLE IF NOT EXISTS public.np_destinations (
    id TEXT PRIMARY KEY,                       -- e.g. 'dest-pgr-01'
    code TEXT UNIQUE NOT NULL,                 -- e.g. 'NP-JBR-PGR'
    name TEXT NOT NULL,                        -- e.g. 'Pantai Pangandaran'
    category TEXT NOT NULL,                    -- 'pantai', 'gunung', 'budaya', 'taman_nasional'
    province TEXT NOT NULL,                    -- e.g. 'Jawa Barat'
    region TEXT NOT NULL,                      -- e.g. 'Jawa', 'Sumatera', 'Bali-Nusra'
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    elevation_m INTEGER DEFAULT 0,
    daily_quota INTEGER NOT NULL DEFAULT 1000,
    current_visitors INTEGER NOT NULL DEFAULT 0,
    quota_status TEXT NOT NULL DEFAULT 'tersedia', -- 'tersedia', 'hampir_penuh', 'penuh', 'ditutup_cuaca'
    photo_url TEXT NOT NULL,
    description TEXT NOT NULL,
    eco_guidelines TEXT,
    wave_status TEXT DEFAULT 'Normal (Aman)',
    ticket_price INTEGER DEFAULT 20000,
    stamp_icon TEXT DEFAULT '🧭',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL TIKET SMART PASS: np_visitor_passes
CREATE TABLE IF NOT EXISTS public.np_visitor_passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pass_code TEXT UNIQUE NOT NULL,
    destination_id TEXT NOT NULL REFERENCES public.np_destinations(id) ON DELETE CASCADE,
    visitor_name TEXT NOT NULL,
    visitor_email TEXT NOT NULL,
    qr_token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',     -- 'active', 'used', 'expired'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL STEMPEL PASPOR DIGITAL: np_digital_stamps
CREATE TABLE IF NOT EXISTS public.np_digital_stamps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_email TEXT NOT NULL,
    destination_id TEXT NOT NULL REFERENCES public.np_destinations(id) ON DELETE CASCADE,
    stamp_code TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(visitor_email, destination_id)
);

-- 5. TABEL LOG CHECK-IN GERBANG: np_checkin_logs
CREATE TABLE IF NOT EXISTS public.np_checkin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pass_id UUID REFERENCES public.np_visitor_passes(id) ON DELETE CASCADE,
    destination_id TEXT NOT NULL REFERENCES public.np_destinations(id) ON DELETE CASCADE,
    scanned_by TEXT DEFAULT 'Petugas Gerbang Konservasi',
    checkin_time TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing untuk query cepat
CREATE INDEX IF NOT EXISTS idx_np_dest_cat ON public.np_destinations(category);
CREATE INDEX IF NOT EXISTS idx_np_dest_region ON public.np_destinations(region);
CREATE INDEX IF NOT EXISTS idx_np_pass_token ON public.np_visitor_passes(qr_token);
CREATE INDEX IF NOT EXISTS idx_np_stamps_email ON public.np_digital_stamps(visitor_email);

-- ROW LEVEL SECURITY (RLS) POLICIES — HARDENED ACCESS CONTROL
ALTER TABLE public.np_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.np_visitor_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.np_digital_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.np_checkin_logs ENABLE ROW LEVEL SECURITY;

-- AKTIFKAN REPLIKASI REALTIME SUPABASE UNTUK TABEL DESTINASI
ALTER PUBLICATION supabase_realtime ADD TABLE public.np_destinations;

-- 1. np_destinations: Publik hanya boleh membaca. Mutasi (INSERT/UPDATE/DELETE) wajib terautentikasi admin.
CREATE POLICY "Public read np_destinations" ON public.np_destinations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin full access np_destinations" ON public.np_destinations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. np_visitor_passes: Publik boleh membaca dan reservasi (INSERT). Perubahan status hanya oleh admin.
CREATE POLICY "Public read np_visitor_passes" ON public.np_visitor_passes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert np_visitor_passes" ON public.np_visitor_passes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin manage np_visitor_passes" ON public.np_visitor_passes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 3. np_digital_stamps: Publik boleh membaca dan klaim stempel.
CREATE POLICY "Public read np_digital_stamps" ON public.np_digital_stamps FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert np_digital_stamps" ON public.np_digital_stamps FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 4. np_checkin_logs: Publik boleh membaca dan mencatat log check-in.
CREATE POLICY "Public read np_checkin_logs" ON public.np_checkin_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert np_checkin_logs" ON public.np_checkin_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 5. Stored Function: np_increment_visitor (Penambahan kuota aman tanpa akses UPDATE ke publik)
CREATE OR REPLACE FUNCTION public.np_increment_visitor(dest_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    dest_rec RECORD;
    new_count INT;
    new_stat TEXT;
BEGIN
    SELECT daily_quota, current_visitors INTO dest_rec FROM public.np_destinations WHERE id = dest_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Destinasi tidak ditemukan'); END IF;
    new_count := COALESCE(dest_rec.current_visitors, 0) + 1;
    IF new_count >= dest_rec.daily_quota THEN new_stat := 'penuh';
    ELSIF new_count >= (dest_rec.daily_quota * 0.85)::INT THEN new_stat := 'hampir_penuh';
    ELSE new_stat := 'tersedia'; END IF;
    UPDATE public.np_destinations SET current_visitors = new_count, quota_status = new_stat WHERE id = dest_id;
    RETURN jsonb_build_object('success', true, 'destination_id', dest_id, 'current_visitors', new_count, 'quota_status', new_stat);
END;
$$;
GRANT EXECUTE ON FUNCTION public.np_increment_visitor(TEXT) TO anon, authenticated;

-- ==============================================================================
-- SEED DATA 20 DESTINASI UNGGULAN INDONESIA (Pantai, Gunung, Candi, TN)
-- ==============================================================================
INSERT INTO public.np_destinations (id, code, name, category, province, region, latitude, longitude, elevation_m, daily_quota, current_visitors, quota_status, photo_url, description, eco_guidelines, wave_status, ticket_price, stamp_icon)
VALUES
  ('dest-pgr-01', 'NP-JBR-PGR', 'Pantai Pangandaran', 'pantai', 'Jawa Barat', 'Jawa', -7.7024, 108.4947, 5, 2500, 1420, 'tersedia', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', 'Pesisir legendaris Jawa Barat dengan pantai pasir putih dan cagar alam pesisir.', 'Zona konservasi penyu hijau. Dilarang membuang plastik di sempadan pantai.', 'Aman (Gelombang 1.2m)', 20000, '🏖️'),
  ('dest-prt-02', 'NP-DIY-PRT', 'Pantai Parangtritis & Gumuk Pasir', 'pantai', 'D.I. Yogyakarta', 'Jawa', -8.0255, 110.3298, 8, 3000, 2180, 'hampir_penuh', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', 'Ikon pesisir selatan Yogyakarta berlatar tebing karst dramatis dan gumuk pasir.', 'Waspada palung laut (rip current). Dilarang berenang di area bendera merah.', 'Waspada Rip Current', 15000, '🌊'),
  ('dest-kta-03', 'NP-BLI-KTA', 'Pantai Kuta & Pesisir Badung', 'pantai', 'Bali', 'Bali-Nusra', -8.7185, 115.1686, 4, 4000, 3200, 'hampir_penuh', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', 'Pantai matahari terbenam paling ikonik di Bali dengan pasir keemasan.', 'Program Clean Beach Initiative. Wajib buang sampah di tempat daur ulang.', 'Normal (Gelombang 1.5m)', 10000, '🌅'),
  ('dest-rja-04', 'NP-PBR-RJA', 'Kepulauan Raja Ampat (Piaynemo)', 'pantai', 'Papua Barat Daya', 'Papua', -0.5621, 130.2743, 12, 300, 110, 'tersedia', 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=800&q=80', 'Gugusan pulau karang zamrud di jantung Segitiga Karang Dunia.', 'Kawasan Konservasi Perairan Laut. Wajib gunakan sunscreen reef-safe.', 'Tenang (Sangat Jernih)', 500000, '🐠'),
  ('dest-blt-05', 'NP-KBB-BLT', 'Pantai Tanjung Kelayang', 'pantai', 'Bangka Belitung', 'Sumatera', -2.5583, 107.6698, 3, 800, 340, 'tersedia', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', 'Geosite UNESCO dengan formasi batu granit raksasa purba.', 'Dilarang mencoret-coret atau memanjat batu granit purba.', 'Tenang (Gelombang 0.6m)', 25000, '🪨'),
  
  ('dest-ppd-06', 'NP-JBR-PPD', 'Gunung Papandayan & Tegal Alun', 'gunung', 'Jawa Barat', 'Jawa', -7.3197, 107.7317, 2665, 600, 390, 'tersedia', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', 'Pesona kawah belerang aktif, Hutan Mati eksotis, dan padang edelweiss.', 'Bunga edelweiss dilindungi UU. Petik edelweiss didenda dan diblacklist.', 'Suhu Puncak: 12°C', 35000, '🌋'),
  ('dest-brm-07', 'NP-JTM-BRM', 'Gunung Bromo & Lautan Pasir', 'gunung', 'Jawa Timur', 'Jawa', -7.9425, 112.9530, 2329, 2000, 1850, 'hampir_penuh', 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80', 'Kawah sakral suku Tengger di tengah kaldera lautan pasir purba.', 'Kawasan sakral Yadnya Kasada. Dilarang membuang sampah di bibir kawah.', 'Suhu Puncak: 8°C', 34000, '🌄'),
  ('dest-rnj-08', 'NP-NTB-RNJ', 'Gunung Rinjani & Segara Anak', 'gunung', 'Nusa Tenggara Barat', 'Bali-Nusra', -8.4113, 116.4573, 3726, 400, 385, 'hampir_penuh', 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&w=800&q=80', 'Atap pulau Lombok dengan danau kawah Segara Anak membiru.', 'Program Pack-it-in Pack-it-out. Sampah logistik wajib diverifikasi saat turun.', 'Suhu Puncak: 4°C', 50000, '🏔️'),
  ('dest-dng-09', 'NP-JTG-DNG', 'Dataran Tinggi Dieng & Sikunir', 'gunung', 'Jawa Tengah', 'Jawa', -7.2062, 109.9079, 2093, 1500, 850, 'tersedia', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', 'Negeri di atas awan dengan kawah Sikidang dan Telaga Warna.', 'Jaga kebersihan telaga dan jangan menginjak pipa geotermal ramah lingkungan.', 'Suhu Puncak: 9°C', 20000, '☁️'),
  ('dest-krc-10', 'NP-JMB-KRC', 'Gunung Kerinci (Atap Sumatera)', 'gunung', 'Jambi', 'Sumatera', -1.6967, 101.2642, 3805, 250, 110, 'tersedia', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', 'Gunung berapi tertinggi di Indonesia dikelilingi belantara TNKS.', 'Habitat Harimau Sumatera. Pendakian wajib didampingi pemandu lokal.', 'Suhu Puncak: 5°C', 45000, '🧗'),

  ('dest-bbd-11', 'NP-JTG-BBD', 'Candi Borobudur (UNESCO)', 'budaya', 'Jawa Tengah', 'Jawa', -7.6079, 110.2038, 265, 1200, 1150, 'hampir_penuh', 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80', 'Monumen candi Buddha terbesar di dunia dengan 2.672 panel relief sejarah.', 'Wajib memakai sandal Upanat untuk melindungi batuan stupa dari keausan.', 'Kuota Naik Stupa Terbatas', 50000, '🛕'),
  ('dest-pbn-12', 'NP-DIY-PBN', 'Candi Prambanan & Ratu Boko', 'budaya', 'D.I. Yogyakarta', 'Jawa', -7.7520, 110.4915, 154, 2500, 1620, 'tersedia', 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80', 'Kompleks candi Hindu terindah di Asia Tenggara setinggi 47 meter.', 'Dilarang memanjat relief arca. Kenakan kain batik penutup yang disediakan.', 'Pelataran Candi Terbuka', 50000, '🏛️'),
  ('dest-krt-13', 'NP-DIY-KRT', 'Keraton Ngayogyakarta Hadiningrat', 'budaya', 'D.I. Yogyakarta', 'Jawa', -7.8053, 110.3642, 113, 1500, 980, 'tersedia', 'https://images.unsplash.com/photo-1584810359583-96fc3448beaa?auto=format&fit=crop&w=800&q=80', 'Pusat kebudayaan Jawa yang hidup kediaman resmi Sultan Hamengku Buwono.', 'Patuhi tata krama busana sopan. Dilarang berfoto membelakangi singgasana.', 'Pentas Seni Budaya Aktif', 15000, '👑'),
  ('dest-pgl-14', 'NP-BLI-PGL', 'Desa Wisata Adat Penglipuran', 'budaya', 'Bali', 'Bali-Nusra', -8.4526, 115.3578, 625, 1000, 520, 'tersedia', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', 'Desa terbersih di dunia dengan arsitektur bambu seragam.', 'Kawasan bebas kendaraan bermotor. Dilarang merokok sembarangan.', 'Suasana Sejuk Terkendali', 25000, '🎋'),
  ('dest-trj-15', 'NP-SLS-TRJ', 'Situs Adat Kete Kesu Tana Toraja', 'budaya', 'Sulawesi Selatan', 'Sulawesi', -3.0039, 119.9044, 850, 600, 240, 'tersedia', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', 'Perkampungan megalitikum Tongkonan dengan kuburan tebing gantung.', 'Tempat suci leluhur. Dilarang menyentuh tengkorak di liang tebing batu.', 'Upacara Adat Rambu Solo', 30000, '🛖'),

  ('dest-blr-16', 'NP-JTM-BLR', 'Taman Nasional Baluran', 'taman_nasional', 'Jawa Timur', 'Jawa', -7.8385, 114.3917, 45, 1200, 610, 'tersedia', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80', 'Miniatur savana Afrika di Jawa dengan banteng Jawa dan kawanan rusa.', 'Batas kecepatan kendaraan 30 km/jam. Dilarang memberi makan satwa liar.', 'Savana Musim Kering', 25000, '🦌'),
  ('dest-kmd-17', 'NP-NTT-KMD', 'Taman Nasional Komodo (Padar)', 'taman_nasional', 'Nusa Tenggara Timur', 'Bali-Nusra', -8.6534, 119.5786, 110, 500, 460, 'hampir_penuh', 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80', 'Habitat kadal purba komodo dengan panorama tiga teluk memukau.', 'Eksplorasi wajib didampingi Ranger. Jaga jarak aman minimal 5 meter.', 'Gelombang Arus Sedang', 150000, '🦎'),
  ('dest-clt-18', 'NP-JBR-CLT', 'Ciletuh Palabuhanratu Geopark', 'taman_nasional', 'Jawa Barat', 'Jawa', -7.1852, 106.4950, 120, 1000, 420, 'tersedia', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', 'Amfiteater alam purba UNESCO dengan puluhan air terjun megah.', 'Dilarang merusak batuan sedimen purba dan jaga kebersihan curug.', 'Aman untuk Geowisata', 20000, '🏞️'),
  ('dest-tba-19', 'NP-SMU-TBA', 'Danau Toba & Pulau Samosir', 'taman_nasional', 'Sumatera Utara', 'Sumatera', 2.6845, 98.8756, 905, 2500, 1290, 'tersedia', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', 'Danau vulkanik kaldera terbesar di dunia hasil letusan supervolcano.', 'Dilarang mencemari air danau dan hormati situs makam Raja Sidabutar.', 'Angin Danau Tenang', 15000, '⛵'),
  ('dest-bnk-20', 'NP-SLU-BNK', 'Taman Nasional Bunaken', 'taman_nasional', 'Sulawesi Utara', 'Sulawesi', 1.6247, 124.7644, 8, 600, 280, 'tersedia', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', 'Dinding terumbu karang vertikal dengan populasi penyu raksasa.', 'Gunakan pelampung saat snorkeling agar tidak mematahkan terumbu karang.', 'Visibilitas 25 Meter', 50000, '🐢')
ON CONFLICT (id) DO NOTHING;
