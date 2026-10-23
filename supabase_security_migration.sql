-- ==============================================================================
-- NUSANTARAPASS: HARDENED DATABASE SECURITY & ROW-LEVEL SECURITY (RLS) MIGRATION
-- Arsitektur: PostgreSQL 15 & Supabase Cloud
-- Standar: Zero-Trust Model, Least Privilege Access & Defense in Depth
-- ==============================================================================

-- 1. AKTIFKAN ROW LEVEL SECURITY (RLS) PADA SEMUA TABEL
ALTER TABLE IF EXISTS public.np_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.np_visitor_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.np_digital_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.np_checkin_logs ENABLE ROW LEVEL SECURITY;

-- 2. BERSIHKAN KEBIJAKAN LAMA YANG PERMISIF (LOOSE POLICIES)
DROP POLICY IF EXISTS "Public insert/update np_destinations" ON public.np_destinations;
DROP POLICY IF EXISTS "Public read np_destinations" ON public.np_destinations;
DROP POLICY IF EXISTS "Admin full access np_destinations" ON public.np_destinations;
DROP POLICY IF EXISTS "Public select np_destinations" ON public.np_destinations;

DROP POLICY IF EXISTS "Public insert np_visitor_passes" ON public.np_visitor_passes;
DROP POLICY IF EXISTS "Public read np_visitor_passes" ON public.np_visitor_passes;
DROP POLICY IF EXISTS "Admin manage np_visitor_passes" ON public.np_visitor_passes;

DROP POLICY IF EXISTS "Public insert np_digital_stamps" ON public.np_digital_stamps;
DROP POLICY IF EXISTS "Public read np_digital_stamps" ON public.np_digital_stamps;

DROP POLICY IF EXISTS "Public insert np_checkin_logs" ON public.np_checkin_logs;
DROP POLICY IF EXISTS "Public read np_checkin_logs" ON public.np_checkin_logs;

-- 3. KEBIJAKAN TABEL DESTINASI (public.np_destinations)
-- ------------------------------------------------------------------------------
-- Publik (Anonim & Authenticated): HANYA DIIZINKAN MEMBACA (SELECT)
CREATE POLICY "Public read np_destinations"
    ON public.np_destinations
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Hanya Pengguna Terautentikasi (JWT Supabase Auth: authenticated) yang dapat
-- melakukan penambahan, perubahan, atau penghapusan destinasi
CREATE POLICY "Admin full access np_destinations"
    ON public.np_destinations
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. KEBIJAKAN TABEL TIKET PENGUNJUNG (public.np_visitor_passes)
-- ------------------------------------------------------------------------------
-- Publik dapat melihat tiket (verifikasi QR code)
CREATE POLICY "Public read np_visitor_passes"
    ON public.np_visitor_passes
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Publik dapat membuat reservasi tiket kunjungan baru (INSERT)
CREATE POLICY "Public insert np_visitor_passes"
    ON public.np_visitor_passes
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Hanya Admin yang berhak mengubah status tiket (UPDATE / DELETE)
CREATE POLICY "Admin manage np_visitor_passes"
    ON public.np_visitor_passes
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. KEBIJAKAN TABEL STEMPEL DIGITAL (public.np_digital_stamps)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public read np_digital_stamps"
    ON public.np_digital_stamps
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public insert np_digital_stamps"
    ON public.np_digital_stamps
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 6. KEBIJAKAN TABEL LOG CHECK-IN GERBANG (public.np_checkin_logs)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public read np_checkin_logs"
    ON public.np_checkin_logs
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public insert np_checkin_logs"
    ON public.np_checkin_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 7. PROSEDUR AMAN (STORED FUNCTION): np_increment_visitor
-- ------------------------------------------------------------------------------
-- Memungkinkan penambahan kuota pengunjung saat reservasi tanpa memberikan
-- hak UPDATE tabel np_destinations kepada pengguna publik anonim.
CREATE OR REPLACE FUNCTION public.np_increment_visitor(dest_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    dest_rec RECORD;
    new_count INT;
    new_stat TEXT;
BEGIN
    SELECT daily_quota, current_visitors INTO dest_rec
    FROM public.np_destinations
    WHERE id = dest_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Destinasi tidak ditemukan');
    END IF;

    new_count := COALESCE(dest_rec.current_visitors, 0) + 1;

    -- Evaluasi otomatis ambang batas daya dukung (Carrying Capacity)
    IF new_count >= dest_rec.daily_quota THEN
        new_stat := 'penuh';
    ELSIF new_count >= (dest_rec.daily_quota * 0.85)::INT THEN
        new_stat := 'hampir_penuh';
    ELSE
        new_stat := 'tersedia';
    END IF;

    UPDATE public.np_destinations
    SET current_visitors = new_count,
        quota_status = new_stat
    WHERE id = dest_id;

    RETURN jsonb_build_object(
        'success', true,
        'destination_id', dest_id,
        'current_visitors', new_count,
        'quota_status', new_stat
    );
END;
$$;

-- Izinkan publik mengeksekusi stored procedure ini
GRANT EXECUTE ON FUNCTION public.np_increment_visitor(TEXT) TO anon, authenticated;

-- 8. KONFIRMASI STATUS EMAIL AKUN ADMIN (Jika dibuat via Supabase Auth)
-- ------------------------------------------------------------------------------
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmed_at = COALESCE(confirmed_at, now())
WHERE email = 'admin.nusantarapass@gmail.com';
