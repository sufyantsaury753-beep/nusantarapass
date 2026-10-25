const SUPABASE_URL = "https://czaafevdnaqmeejthebm.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YWFmZXZkbmFxbWVlanRoZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTY1MjIsImV4cCI6MjEwNzY3MjUyMn0.nZbkhSNe0RrM5hwBLW_DFtGVAzjpVOIjj9nk1DlZ1cU";

const dests = [
  'dest-pgr-01', 'dest-prt-02', 'dest-kta-03', 'dest-rja-04', 'dest-blt-05',
  'dest-ppd-06', 'dest-brm-07', 'dest-rnj-08', 'dest-dng-09', 'dest-krc-10',
  'dest-bbd-11', 'dest-pbn-12', 'dest-krt-13', 'dest-pgl-14', 'dest-trj-15',
  'dest-blr-16', 'dest-kmd-17', 'dest-clt-18', 'dest-tba-19', 'dest-bnk-20'
];

async function main() {
  console.log("1. Melakukan autentikasi admin ke Supabase Auth...");
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      "apikey": ANON_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: "admin.nusantarapass@gmail.com",
      password: "AdminPassword2026!"
    })
  });

  if (!authRes.ok) {
    console.error("Gagal login admin:", authRes.status, await authRes.text());
    process.exit(1);
  }

  const authData = await authRes.json();
  const token = authData.access_token;
  console.log("✅ Berhasil login sebagai Admin. Token JWT diperoleh!\n");

  console.log("2. Memperbarui photo_url untuk 20 destinasi di Supabase Cloud...");
  let successCount = 0;

  for (const id of dests) {
    const cleanUrl = `assets/img/destinations/${id}.jpg`;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/np_destinations?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ photo_url: cleanUrl })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        console.log(`[SUKSES UPDATE CLOUD] ${id} (${data[0].name}) -> ${cleanUrl}`);
        successCount++;
      } else {
        console.warn(`[TIDAK ADA BARIS YANG BERUBAH] ${id}`);
      }
    } else {
      console.error(`[GAGAL] ${id}: ${res.status} ${res.statusText}`);
    }
  }

  console.log(`\n✅ Selesai! ${successCount} dari ${dests.length} destinasi berhasil diperbarui di Supabase Cloud.\n`);

  console.log("3. Menguji efisiensi payload setelah pembaruan...");
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/np_destinations?select=*&order=id.asc`, {
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    }
  });

  const allData = await checkRes.json();
  const payloadStr = JSON.stringify(allData);
  console.log(`Ukuran payload REST Supabase sekarang: ${(payloadStr.length / 1024).toFixed(1)} KB (sebelumnya ~4,630 KB)`);
  console.log(`Penghematan bandwidth: ${(100 - (payloadStr.length / (4630 * 1024)) * 100).toFixed(2)}%!`);
}

main().catch(console.error);
