const NP_SUPABASE_CONFIG = {
  URL: "https://czaafevdnaqmeejthebm.supabase.co",
  ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YWFmZXZkbmFxbWVlanRoZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTY1MjIsImV4cCI6MjEwNzY3MjUyMn0.nZbkhSNe0RrM5hwBLW_DFtGVAzjpVOIjj9nk1DlZ1cU"
};

let npClient = null;

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

async function npUpdateQuota(destId, newQuota, newStatus) {
  if (!npClient) initNpSupabase();

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

async function npUpdateDestinationFull(destData) {
  if (!npClient) initNpSupabase();

const targetIndex = NUSANTARA_DESTINATIONS.findIndex(d => d.id === destData.id);
  if (targetIndex !== -1) {
    NUSANTARA_DESTINATIONS[targetIndex] = { ...NUSANTARA_DESTINATIONS[targetIndex], ...destData };
  } else {
    NUSANTARA_DESTINATIONS.unshift(destData);
  }

try {
    const rawOverrides = localStorage.getItem('np_destinations_override') || '{}';
    const overrides = JSON.parse(rawOverrides);
    overrides[destData.id] = destData;
    localStorage.setItem('np_destinations_override', JSON.stringify(overrides));
  } catch (e) {
    console.warn('Gagal menyimpan ke localStorage override:', e);
  }

  if (!npClient) return { success: true, localOnly: true };

try {
    const payload = {
      name: destData.name,
      category: destData.category,
      province: destData.province,
      region: destData.region,
      latitude: parseFloat(destData.latitude),
      longitude: parseFloat(destData.longitude),
      elevation_m: parseInt(destData.elevation_m) || 0,
      daily_quota: parseInt(destData.daily_quota) || 1000,
      current_visitors: parseInt(destData.current_visitors) || 0,
      quota_status: destData.quota_status || 'tersedia',
      photo_url: destData.photo_url,
      photo_attribution: destData.photo_attribution || 'Unsplash / Tim Ekspedisi',
      description: destData.description,
      wave_status: destData.wave_status || 'Normal & Terkendali',
      ticket_price: parseInt(destData.ticket_price) || 20000
    };

    const { data, error } = await npClient
      .from('np_destinations')
      .update(payload)
      .eq('id', destData.id)
      .select();

    if (error) {
      console.warn("Gagal update destinasi ke Supabase:", error.message);
      return { 
        success: false, 
        error: error.message,
        isRlsBlocked: error.code === '42501' || (error.message && error.message.toLowerCase().includes('violates row-level security')) || error.code === 'PGRST301'
      };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function npInsertDestination(destData) {
  if (!npClient) initNpSupabase();

  NUSANTARA_DESTINATIONS.push(destData);

  if (!npClient) return { success: true, localOnly: true };

  try {
    const { data, error } = await npClient
      .from('np_destinations')
      .insert([destData])
      .select();

    if (error) {
      console.warn("Gagal insert destinasi ke Supabase:", error.message);
      return {
        success: false,
        error: error.message,
        isRlsBlocked: error.code === '42501' || (error.message && error.message.toLowerCase().includes('violates row-level security')) || error.code === 'PGRST301'
      };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function npAdminSignIn(email, password) {
  if (!npClient) initNpSupabase();
  if (!npClient) return { success: false, error: "Koneksi library Supabase JS belum siap." };

  try {
    const { data, error } = await npClient.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function npAdminSignOut() {
  if (!npClient) initNpSupabase();
  if (!npClient) return { success: true };

  try {
    const { error } = await npClient.auth.signOut();
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function npGetAuthSession() {
  if (!npClient) initNpSupabase();
  if (!npClient) return null;

  try {
    const { data } = await npClient.auth.getSession();
    return data && data.session ? data.session : null;
  } catch (err) {
    return null;
  }
}

async function npGetAuthUser() {
  if (!npClient) initNpSupabase();
  if (!npClient) return null;

  try {
    const { data } = await npClient.auth.getUser();
    return data && data.user ? data.user : null;
  } catch (err) {
    return null;
  }
}

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

    const dest = NUSANTARA_DESTINATIONS.find(d => d.id === passRecord.destinationId);
    if (dest) {
      try {
        const { data: rpcData, error: rpcErr } = await npClient.rpc('np_increment_visitor', {
          dest_id: passRecord.destinationId
        });
        if (!rpcErr && rpcData && rpcData.current_visitors) {
          dest.current_visitors = rpcData.current_visitors;
          dest.quota_status = rpcData.quota_status;
        } else {
          const updatedCount = (dest.current_visitors || 0) + 1;
          dest.current_visitors = updatedCount;
          await npClient
            .from('np_destinations')
            .update({ current_visitors: updatedCount })
            .eq('id', passRecord.destinationId);
        }
      } catch (e) {
        dest.current_visitors = (dest.current_visitors || 0) + 1;
      }
    }

    return data;
  } catch (err) {
    console.warn("Exception saat simpan pass:", err);
    return null;
  }
}

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

async function npCheckinVisitor(destId) {
  if (!npClient) initNpSupabase();

  const dest = (typeof NUSANTARA_DESTINATIONS !== 'undefined')
    ? NUSANTARA_DESTINATIONS.find(d => d.id === destId)
    : null;

  if (!dest) return { success: false, reason: "Destinasi tidak ditemukan" };

  const newVisitors = (dest.current_visitors || 0) + 1;
  dest.current_visitors = newVisitors;

  const quota = dest.daily_quota || 1000;
  const pct = (newVisitors / quota) * 100;
  if (pct >= 100) {
    dest.quota_status = 'ditutup_cuaca';
  } else if (pct > 75) {
    dest.quota_status = 'hampir_penuh';
  }

  try {
    const raw = localStorage.getItem('np_destinations_override') || '{}';
    const overrides = JSON.parse(raw);
    overrides[destId] = {
      ...(overrides[destId] || {}),
      current_visitors: newVisitors,
      quota_status: dest.quota_status
    };
    localStorage.setItem('np_destinations_override', JSON.stringify(overrides));
  } catch (e) {}

  if (!npClient) return { success: true, localOnly: true, current_visitors: newVisitors };

  try {
    const { data: rpcData, error: rpcErr } = await npClient.rpc('np_increment_visitor', {
      dest_id: destId
    });
    if (!rpcErr && rpcData && rpcData.current_visitors) {
      dest.current_visitors = rpcData.current_visitors;
      dest.quota_status = rpcData.quota_status;
      return { success: true, data: dest, current_visitors: rpcData.current_visitors };
    }

    const { data, error } = await npClient
      .from('np_destinations')
      .update({
        current_visitors: newVisitors,
        quota_status: dest.quota_status
      })
      .eq('id', destId)
      .select('id, name, daily_quota, current_visitors, quota_status');

    if (error) {
      console.warn("Update kuota Supabase gagal, fallback lokal:", error.message);
      return { success: true, localOnly: true, current_visitors: newVisitors };
    }
    return { success: true, data: data && data[0], current_visitors: newVisitors };
  } catch (err) {
    return { success: true, localOnly: true, current_visitors: newVisitors };
  }
}
