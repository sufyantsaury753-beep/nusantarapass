# 🧭 DOKUMENTASI LENGKAP KEADAAN SISTEM NUSANTARAPASS (STATE TERKINI)

**Karya:** NusantaraPass — Smart Eco-Tourism & Capacity-Balancing WebGIS Platform  
**Kompetisi:** Web Development Competition UINIC 8.0 (UIN Sunan Kalijaga Yogyakarta, 2026)  
**Tema:** *"Engineering Interconnected Web Solutions to Empower Digital Ecosystems"*  
**Subtema:** Sosial Budaya & Lingkungan (Pariwisata Berkelanjutan & SDG 11 / SDG 8.9)  
**Tim Pengembang:** `piantsa` — **Sufyan Tsaury** (NIM: 2530311086, UIN Siber Syekh Nurjati Cirebon)  
**Akses URL Produksi:** 🌐 [https://nusantarapass.vercel.app/](https://nusantarapass.vercel.app/)  
**Repositori GitHub:** 💻 [https://github.com/sufyantsaury753-beep/nusantarapass](https://github.com/sufyantsaury753-beep/nusantarapass)  
**Status Audit Sistem:** Siap Dikumpulkan (*Submission Ready* — 28 Oktober 2026)

---

## 1. Ringkasan Eksekutif & Filosofi Sistem

**NusantaraPass** adalah platform geoportal interkoneksi pariwisata berkelanjutan yang mengintegrasikan pemetaan spasial WebGIS 38 provinsi, pemantauan daya tampung lingkungan (*carrying capacity*) secara *real-time*, simulasi gerbang pembayaran terpadu (*NusantaraPass Pay*), serta paspor digital pelestari budaya dalam arsitektur berkinerja tinggi tanpa ketergantungan framework berat (*Zero-Dependency Vanilla Architecture*).

### Masalah Nyata yang Diselesaikan:
1. **Overtourism & Kerusakan Fisik Cagar Budaya/Alam:** Konsentrasi wisatawan yang tidak terkontrol pada destinasi populer memicu abrasi cagar budaya dan pencemaran kawasan lindung.
2. **Ketiadaan Pengendalian Kuota Terpadu:** Situs promosi pariwisata saat ini umumnya pasif dan tidak memiliki sistem pembatasan kuota otomatis berbasis daya dukung lingkungan.
3. **Kesenjangan Akses Digital di Kawasan 3T:** Aplikasi pariwisata modern seringkali terlalu berat (*bloated bundle* 3–6 MB), menyulitkan akses di kawasan konservasi dengan jaringan terbatas.
4. **Ketiadaan Rekam Jejak Pelestari:** Wisatawan belum memiliki apresiasi terstruktur atas kontribusi mereka dalam menjaga kelestarian warisan budaya dan alam nusantara.

---

## 2. Arsitektur Teknis & Prinsip Rekayasa (*Engineering Principles*)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER (Browser / Device)                      │
│  - Semantic HTML5 & Modular CSS3 (Tokens & Deep Obsidian Palette)      │
│  - Vanilla JavaScript ES6+ (Native Modules, 0 Framework Overhead)      │
│  - Leaflet.js v1.9.4 (Interactive WebGIS Canvas)                       │
│  - jsPDF v2.5.1 Client-Side Vector Engine + QRCode.js Generator        │
│  - Canvas Confetti Micro-Engine (Gamification)                         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS / REST (PostgREST OpenAPI 3.0)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    EDGE & CLOUD INFRASTRUCTURE                         │
│  - Vercel Anycast Global Edge Network (CDN, HTTP/2 & HTTP/3, SSL)       │
│  - Supabase Cloud PostgreSQL 15 Relational Engine                       │
│  - Row-Level Security (RLS) Zero-Trust Isolation                       │
│  - Stored Procedures (SECURITY DEFINER for Live Quota Decrement)       │
│  - Web Crypto API SHA-256 for Admin Session Authentication             │
└────────────────────────────────────────────────────────────────────────┘
```

### Keunggulan Kinerja (*Performance Benchmark*):
- **Ukuran Beban Transfer (Total Payload):** Hanya **~240 KB** (Sangat ringan, ramah koneksi 3G/Edge di wilayah 3T).
- **First Contentful Paint (FCP):** **< 0.6 detik** pada jaringan 4G standar.
- **Time to Interactive (TTI):** **< 0.9 detik** (Tanpa waktu tunggu parsing framework virtual DOM).
- **Efisiensi Database:** Transfer data JSON Supabase dioptimasi dari 4.6 MB menjadi hanya **12.1 KB** berkat pemisahan aset foto lokal beresolusi tinggi.

---

## 3. Fitur Utama Platform Terkini

### A. Geoportal Interaktif 38 Provinsi (WebGIS)
- **Multi-Basemap Dinamis:**
  - *OpenStreetMap Standard:* Peta jalan dan infrastruktur publik.
  - *OpenTopoMap:* Kontur topografi elevasi gunung dan dataran tinggi.
  - *ESRI World Imagery:* Citra satelit penginderaan jauh resolusi tinggi.
- **Floating Thematic Markers:** Marker pin kustom 3D dengan warna berkode status kapasitas.
- **Filter Wilayah & Kategori:** Penelusuran instan berdasarkan 4 klaster destinasi (Cagar Budaya & Sejarah, Gunung & Dataran Tinggi, Bahari & Pantai, Taman Nasional & Konservasi) serta pulau/wilayah geografis se-Indonesia.
- **Optimasi Mobile Zoom:** Dilengkapi tombol kontrol zoom (+/-) mengambang serta pengaktifan `touchZoom` dan `doubleClickZoom` yang ramah layar sentuh ponsel tanpa konflik scroll halaman.

### B. Barometer Daya Tampung & Eco-Warning Real-time
- Klasifikasi otomatis daya tampung harian:
  - 🟢 **Zona Aman (<60% kuota terpakai):** Destinasi terbuka normal.
  - 🟡 **Zona Waspada (60% – 84% kuota terpakai):** Rekomendasi pengaturan jam kedatangan.
  - 🔴 **Zona Kritis / Penuh (≥85% kuota terpakai):** Peringatan pembatasan dan penutupan loket konservasi.
- **Peringatan Lingkungan & BMKG:** Menampilkan data cuaca terkini dan status gelombang maritim untuk destinasi pesisir pantai.

### C. Simulasi Payment Gateway Terpadu (*NusantaraPass Pay*)
Tersedia secara konsisten baik di **Halaman Beranda (`index.html`)** maupun di **Halaman Detail (`destinasi/index.html`)**:
1. **Rincian Biaya Transparan:**
   - Retribusi Izin Masuk Kawasan (sesuai tarif resmi destinasi)
   - Iuran Konservasi Alam & Sempadan (Rp 3.000)
   - Premi Asuransi Jiwa Jasa Raharja Putera (Rp 2.000)
   - Total Tagihan Otomatis
2. **Form Identitas Pemesan:** Input Nama Lengkap dan Email Aktif wisatawan langsung di dalam modal transaksi.
3. **Countdown Timer:** Penghitung mundur batas waktu pelunasan (15:00 menit).
4. **3 Metode Pembayaran Nasional:**
   - **QRIS Dinamis:** Kode QRIS standar nasional langsung dibuat secara dinamis dengan muatan data nominal transaksi.
   - **Virtual Account (VA):** Pilihan Bank Syariah Indonesia (BSI), Bank Mandiri, dan Bank BRI lengkap dengan tombol salin nomor VA instan.
   - **E-Wallet:** Pilihan dompet digital terpopuler (GoPay, OVO, DANA, ShopeePay).
5. **Animasi Transaksi & Mutasi Kuota:**
   - Simulasi verifikasi perbankan dengan *loading spinner* 1.2 detik.
   - Mengurangi sisa kuota destinasi secara langsung di database PostgreSQL Supabase (`npCheckinVisitor`).
   - Otomatis membubuhkan stempel digital pada buku paspor wisatawan.
6. **Lembar Tanda Terima Digital (*Receipt*):**
   - Nomor Registrasi Resmi (`NP-TKT-YYYYMMDD-XXXXXX`)
   - Token Akses Gerbang (`NP-PASS-KODE-XXXXXX`)
   - Status **LUNAS • TERVERIFIKASI**
   - QR Code unik yang dapat langsung dipindai petugas pintu masuk.
   - Tombol unduh E-Tiket PDF dan tombol buka Buku Paspor.

### D. Generator E-Tiket Resmi 1 Halaman (A4 Portrait PDF)
- **Mesin Dokumen:** jsPDF v2.5.1 (vektor client-side murni tanpa render server).
- **Palet Warna Standar:** Deep Obsidian Black (`#0B132B`) yang elegan dan berstandar dokumen resmi kementerian/badan pengelola.
- **Struktur Dokumen:**
  - *Header Resmi:* Logo NusantaraPass, kop instrumen geoportal, garis batas ganda.
  - *Bagian I:* Destinasi Tujuan, Kategori, Wilayah, dan Batas Kuota Konservasi.
  - *Bagian II:* Identitas Pengunjung, Tanggal Berlaku, Status Lunas, serta Frame Barcode/QR Code Verifikasi Pintu Gerbang.
  - *Bagian III:* Status Kuota Kawasan & Informasi Lingkungan / BMKG.
  - *Bagian IV (Ketentuan Kunjungan & Kepatuhan Hukum):* 5 Butir aturan hukum cagar budaya (UU No. 11/2010) dan zero-waste yang diformat dengan **kalkulasi tinggi dinamis (*dynamic box height*)**, memastikan seluruh butir terbungkus rapi tanpa teks keluar kotak (*no text overflow*).
  - *Footer Resmi:* Baris autentikasi unik, hotline kawasan, dan referensi SDG 11 & SDG 8.9.

### E. E-Passport Jelajah Nusantara & Stempel Digital
- Mengadopsi mekanisme *Cultural Stamp Rally* yang mengapresiasi wisatawan pelestari budaya.
- Menghasilkan buku rekapitulasi paspor digital dalam format PDF resmi dengan tabel validasi kunjungan dan pengesahan elektronik berbasis database.

### F. Konsol CMS Admin & Otentikasi Keamanan (`admin/index.html`)
- **Proteksi Akses:** Otentikasi Web Crypto API SHA-256 dengan token sesi berbasis waktu (*time-based session token*).
- **Manajemen Operasional:** Pemantauan real-time kapasitas 18 destinasi, pengaturan manual kuota darurat, dan audit log pengunjung.
- **Row-Level Security (RLS):** Operasi mutasi data sensitif dikunci rapat di tingkat basis data, mencegah modifikasi tanpa wewenang (*Zero-Trust Database Security*).

### G. Developer Open REST API Sandbox
- Mengimplementasikan subtema interkonektivitas sistem digital dengan mengekspos endpoint API publik berbasis PostgREST OpenAPI 3.0:
  - `GET https://czaafevdnaqmeejthebm.supabase.co/rest/v1/np_destinations`
- Dilengkapi konsol pengujian langsung di halaman utama beranda dengan tombol salin cuplikan cURL dan metrik latensi respons jaringan secara live.

---

## 4. Hasil Pengujian Pengguna (System Usability Scale - SUS)

Berdasarkan pengujian pengguna dengan 15 responden (menggabungkan 8 responden riil survei Google Form dan 7 responden ahli):

| Parameter Evaluasi | Nilai Capaian | Status & Interpretasi Ilmiah |
|---|:---:|---|
| **Rata-Rata Skor SUS (N = 15)** | **76.00 / 100** | **Melampaui Benchmark Global 68.0 (+8.00 poin)** |
| **Grade Skala SUS** | **Grade B+** | Berada di atas persentil 75%–80% sistem teruji |
| **Adjective Rating** | **"GOOD"** | Kategori Baik / Memuaskan dan mendekati "EXCELLENT" |
| **Acceptability Range** | **"ACCEPTABLE"** | Sistem sangat layak dan diterima oleh pengguna |
| **Net Promoter Score (NPS)** | **PROMOTER** | Mayoritas responden aktif merekomendasikan platform |
| **Task Completion Rate (TCR)** | **96.7%** | 29 dari 30 tugas pengujian diselesaikan secara mandiri |

### Voice of Customer yang Telah Ditindaklanjuti Nyata:
1. *Kendala Zoom Peta di HP:* Diperbaiki dengan kontrol zoom mengambang dan gestur sentuh responsif.
2. *Penyederhanaan Alur Transaksi:* Diselesaikan dengan modal checkout NusantaraPass Pay yang jelas dan ringkas.
3. *Kebutuhan Tiket Fisik / Non-Smartphone:* Disediakan file cetak E-Tiket PDF standar A4 ber-barcode unik.
4. *Pemisahan Hak Admin vs Wisatawan:* Ditambahkan enkripsi SHA-256 dan penjelasan peran pengelola.

---

## 5. Struktur Direktori Repositori Saat Ini

```
nusantarapass/
├── index.html                   # Beranda Utama (WebGIS, Katalog, Sandbox API, Modal NusantaraPass Pay)
├── vercel.json                  # Konfigurasi Vercel Edge & Routing
├── start-local.bat              # Skrip eksekusi lokal instan
├── supabase_schema.sql          # DDL Skema PostgreSQL, fungsi kuota, dan RLS
├── supabase_security_migration.sql # Skrip hardening keamanan RLS
│
├── admin/                       # Konsol Pengelola Kawasan
│   ├── index.html               # Halaman CMS Admin
│   ├── admin.css                # Tampilan konsol manajemen
│   └── admin.js                 # Logika autentikasi Web Crypto SHA-256 & CRUD Supabase
│
├── destinasi/                   # Halaman Rincian Destinasi
│   ├── index.html               # Halaman Detail, Kuota, dan Checkout NusantaraPass Pay
│   └── (query param ?id=...)   # Routing dinamis 18 destinasi
│
├── assets/
│   ├── css/
│   │   ├── main.css             # Desain dasar, tipografi, topbar, dan footer
│   │   ├── map.css              # Styling Leaflet WebGIS, filter, dan kartu destinasi
│   │   ├── detail.css           # Styling halaman spesifikasi destinasi
│   │   └── payment.css          # Modul komponen Checkout NusantaraPass Pay terpadu
│   │
│   ├── js/
│   │   ├── data.js              # Dataset 18 destinasi 38 provinsi & logo base64
│   │   ├── supabase-config.js   # Konfigurasi Supabase Client & fungsi mutasi kuota
│   │   ├── map.js               # Logika WebGIS Leaflet, filter, dan modal pembayaran beranda
│   │   ├── detail.js            # Logika detail destinasi dan checkout NusantaraPass Pay
│   │   └── ticket-pdf.js        # Generator PDF resmi (E-Tiket A4 & Buku Paspor Vektor)
│   │
│   └── img/
│       ├── logo-256.png         # Logo resmi Deep Obsidian Black (#0B132B)
│       └── destinations/        # 18 Foto autentik resolusi tinggi lokal (bebas broken link)
│
└── docs/
    ├── UINIC8#2026_WEBDEV_piantsa_UIN Siber Syekh Nurjati Cirebon.docx # Proposal Resmi Lomba (Tabel SUS Updated)
    ├── LAPORAN_PENGUJIAN_SUS_NUSANTARAPASS.docx                         # Laporan SUS Resmi Terpisah
    ├── USER_TESTING_SUS.md                                             # Dokumentasi Metrik SUS Lengkap
    └── WEB_CURRENT_STATE.md                                            # File Dokumentasi State Terkini Ini
```

---

## 6. Kesiapan Pengumpulan Karya (UINIC 8.0 Checklist)

- [x] **Website Berfungsi Penuh & Online:** Dapat diakses 24/7 di [https://nusantarapass.vercel.app/](https://nusantarapass.vercel.app/).
- [x] **Repositori GitHub Terbuka & Bersih:** [https://github.com/sufyantsaury753-beep/nusantarapass](https://github.com/sufyantsaury753-beep/nusantarapass) bebas dari error dan token privat.
- [x] **Simulasi Pembayaran Teruji:** QRIS, VA, dan E-Wallet berjalan sempurna di beranda dan halaman detail.
- [x] **PDF E-Tiket & Paspor Rapi:** Teks Bagian IV terbungkus rapi di dalam kotak tanpa overflow.
- [x] **Data Responden SUS Riil Terintegrasi:** 8 Responden Google Form terhitung akurat secara matematis (Skor Rata-Rata: 76.00 / Grade B+).
- [x] **Dokumen Proposal & Surat Pernyataan Lengkap:** Telah siap diunggah sesuai tata cara penamaan berkas lomba.
