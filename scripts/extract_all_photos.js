const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://czaafevdnaqmeejthebm.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YWFmZXZkbmFxbWVlanRoZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTY1MjIsImV4cCI6MjEwNzY3MjUyMn0.nZbkhSNe0RrM5hwBLW_DFtGVAzjpVOIjj9nk1DlZ1cU";

async function main() {
  console.log("Mengambil data destinasi dari Supabase Cloud...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/np_destinations?select=*&order=id.asc`, {
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    }
  });

  if (!res.ok) {
    console.error("Gagal mengambil data dari Supabase:", res.status, res.statusText);
    process.exit(1);
  }

  const destinations = await res.json();
  console.log(`Ditemukan ${destinations.length} destinasi di database Supabase.`);

  const outputDir = path.join(__dirname, '..', 'assets', 'img', 'destinations');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results = [];

  for (const dest of destinations) {
    const photoUrl = dest.photo_url || '';
    if (photoUrl.startsWith('data:image/')) {
      const matches = photoUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        let ext = matches[1].toLowerCase();
        if (ext === 'jpeg') ext = 'jpg';
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `${dest.id}.${ext}`;
        const filePath = path.join(outputDir, filename);
        fs.writeFileSync(filePath, buffer);
        const relPath = `assets/img/destinations/${filename}`;
        console.log(`[EKSTRAK SUKSES] ${dest.id} (${dest.name}): ${(buffer.length / 1024).toFixed(1)} KB -> ${relPath}`);
        results.push({
          id: dest.id,
          name: dest.name,
          status: 'extracted',
          sizeKB: (buffer.length / 1024).toFixed(1),
          localPath: relPath,
          dest
        });
      } else {
        console.warn(`[DATA URL TIDAK VALID] ${dest.id}`);
      }
    } else {
      console.log(`[URL/PATH BIASA] ${dest.id} (${dest.name}): ${photoUrl.substring(0, 60)}...`);
      results.push({
        id: dest.id,
        name: dest.name,
        status: 'external_or_path',
        url: photoUrl,
        dest
      });
    }
  }

  fs.writeFileSync(
    path.join(__dirname, 'extraction_summary.json'),
    JSON.stringify(results.map(r => ({ id: r.id, name: r.name, status: r.status, sizeKB: r.sizeKB, localPath: r.localPath || r.url })), null, 2)
  );

  console.log("\nSelesai ekstraksi semua foto!");
}

main().catch(err => {
  console.error("Terjadi kesalahan:", err);
  process.exit(1);
});
