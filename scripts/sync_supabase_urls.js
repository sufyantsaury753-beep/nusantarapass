const SUPABASE_URL = "https://czaafevdnaqmeejthebm.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YWFmZXZkbmFxbWVlanRoZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTY1MjIsImV4cCI6MjEwNzY3MjUyMn0.nZbkhSNe0RrM5hwBLW_DFtGVAzjpVOIjj9nk1DlZ1cU";

const dests = [
  'dest-pgr-01', 'dest-prt-02', 'dest-kta-03', 'dest-rja-04', 'dest-blt-05',
  'dest-ppd-06', 'dest-brm-07', 'dest-rnj-08', 'dest-dng-09', 'dest-krc-10',
  'dest-bbd-11', 'dest-pbn-12', 'dest-krt-13', 'dest-pgl-14', 'dest-trj-15',
  'dest-blr-16', 'dest-kmd-17', 'dest-clt-18', 'dest-tba-19', 'dest-bnk-20'
];

async function main() {
  console.log("Memperbarui photo_url di Supabase Cloud...");
  for (const id of dests) {
    const cleanUrl = `assets/img/destinations/${id}.jpg`;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/np_destinations?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ photo_url: cleanUrl })
    });

    if (res.ok) {
      console.log(`[BERHASIL] ${id} -> ${cleanUrl}`);
    } else {
      console.error(`[GAGAL] ${id}: ${res.status} ${res.statusText}`);
    }
  }
  console.log("Selesai sinkronisasi photo_url ke Supabase Cloud!");
}

main().catch(console.error);
