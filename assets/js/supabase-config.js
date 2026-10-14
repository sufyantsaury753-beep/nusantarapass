/**
 * NUSANTARAPASS — SUPABASE CLOUD INTEGRATION
 * Terhubung ke database PostgreSQL Supabase bersama Mountain Gallery (Prefix: np_)
 */

const NP_SUPABASE_CONFIG = {
  URL: "https://xjpkfdalokarxmbousvj.supabase.co",
  ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcGtmZGFsb2thcnhtYm91c3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTM3MjksImV4cCI6MjEwMzU2OTcyOX0.ukLS09nUcqYzn9soXrNwngYRfK7hFPnzlH0wkOR69l8"
};

let npClient = null;

// Inisialisasi Supabase Client
function initNpSupabase() {
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    try {
      npClient = window.supabase.createClient(NP_SUPABASE_CONFIG.URL, NP_SUPABASE_CONFIG.ANON_KEY);
      console.log("⚡ NusantaraPass: Supabase Cloud Client Initialized");
    } catch (err) {
      console.warn("⚠️ Gagal inisialisasi Supabase:", err);
    }
  }
  return npClient;
}

// Cek koneksi tabel np_destinations
async function npCheckConnection() {
  if (!npClient) initNpSupabase();
  if (!npClient) return { connected: false, reason: "Supabase JS library belum terpasang." };

  try {
    const { data, error } = await npClient
      .from('np_destinations')
      .select('id, name')
      .limit(1);

    if (error) {
      return { connected: false, reason: error.message };
    }
    return { connected: true, data };
  } catch (err) {
    return { connected: false, reason: err.message };
  }
}

// Fetch destinasi dari Supabase (dengan graceful fallback ke NUSANTARA_DESTINATIONS)
async function npFetchDestinations() {
  if (!npClient) initNpSupabase();
  if (!npClient) return NUSANTARA_DESTINATIONS;

  try {
    const { data, error } = await npClient
      .from('np_destinations')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn("ℹ️ Supabase tabel np_destinations belum dibuat atau offline. Menggunakan dataset lokal fallback:", error.message);
      return NUSANTARA_DESTINATIONS;
    }

    if (data && data.length > 0) {
      // Sinkronkan data ke array runtime
      NUSANTARA_DESTINATIONS.length = 0;
      data.forEach(item => NUSANTARA_DESTINATIONS.push(item));
      console.log(`✅ Berhasil memuat ${data.length} destinasi realtime dari Supabase Cloud!`);
      return NUSANTARA_DESTINATIONS;
    }
  } catch (err) {
    console.warn("⚠️ Fetch Supabase error:", err);
  }

  return NUSANTARA_DESTINATIONS;
}

// Update kuota destinasi di Supabase
async function npUpdateQuota(destId, newQuota, newStatus) {
  if (!npClient) initNpSupabase();
  
  // Update memori lokal dulu
  const target = NUSANTARA_DESTINATIONS.find(d => d.id === destId);
  if (target) {
    target.daily_quota = newQuota;
    if (newStatus) target.quota_status = newStatus;
  }

  if (!npClient) return { success: true, localOnly: true };

  try {
    const updatePayload = { daily_quota: newQuota };
    if (newStatus) updatePayload.quota_status = newStatus;

    const { data, error } = await npClient
      .from('np_destinations')
      .update(updatePayload)
      .eq('id', destId)
      .select();

    if (error) {
      console.warn("Gagal update ke Supabase:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Tambah destinasi baru ke Supabase
async function npInsertDestination(destData) {
  if (!npClient) initNpSupabase();

  NUSANTARA_DESTINATIONS.push(destData);

  if (!npClient) return { success: true, localOnly: true };

  try {
    const { data, error } = await npClient
      .from('np_destinations')
      .insert([destData])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Simpan tiket Smart Pass ke Supabase
async function npSaveVisitorPass(passRecord) {
  if (!npClient) initNpSupabase();
  if (!npClient) return null;

  try {
    const { data, error } = await npClient
      .from('np_visitor_passes')
      .insert([{
        pass_code: passRecord.code,
        destination_id: passRecord.destinationId,
        visitor_name: passRecord.visitorName,
        visitor_email: passRecord.visitorEmail,
        qr_token: passRecord.qrToken,
        status: 'active'
      }])
      .select();

    if (error) {
      console.warn("Gagal simpan pass ke Supabase:", error.message);
      return null;
    }

    // Auto-increment current_visitors di destinasi
    const dest = NUSANTARA_DESTINATIONS.find(d => d.id === passRecord.destinationId);
    if (dest) {
      const updatedCount = (dest.current_visitors || 0) + 1;
      dest.current_visitors = updatedCount;
      await npClient
        .from('np_destinations')
        .update({ current_visitors: updatedCount })
        .eq('id', passRecord.destinationId);
    }

    return data;
  } catch (err) {
    console.warn("Exception saat simpan pass:", err);
    return null;
  }
}

// Simpan Stempel Digital Paspor ke Supabase
async function npSaveStamp(visitorEmail, destinationId, stampCode) {
  if (!npClient) initNpSupabase();
  if (!npClient) return null;

  try {
    const { data, error } = await npClient
      .from('np_digital_stamps')
      .upsert([{
        visitor_email: visitorEmail,
        destination_id: destinationId,
        stamp_code: stampCode,
        unlocked_at: new Date().toISOString()
      }], { onConflict: 'visitor_email, destination_id' })
      .select();

    if (error) {
      console.warn("Gagal simpan stempel ke Supabase:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Exception stempel:", err);
    return null;
  }
}
