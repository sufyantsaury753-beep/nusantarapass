# NusantaraPass — Smart Interconnected Geotourism & Heritage Passport 🧭🇮🇩

[![UINIC 8.0](https://img.shields.io/badge/Competition-UINIC%208.0%20WebDev-emerald?style=flat-square)](https://bit.ly/GuidebookUINIC8_WEBDEV)
[![Live Demo (Vercel)](https://img.shields.io/badge/Demo-Vercel%20Edge%20Network-black?style=flat-square&logo=vercel)](https://nusantarapass.vercel.app/)
[![Leaflet GIS](https://img.shields.io/badge/Mapping-Leaflet%20%26%20OSM-199900?style=flat-square&logo=leaflet)](https://leafletjs.com)
[![Supabase](https://img.shields.io/badge/Database-PostgreSQL%20(Supabase)-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![SDG 11 & 8.9](https://img.shields.io/badge/SDGs-Heritage%20%26%20Sustainable%20Tourism-amber?style=flat-square)](https://sdgs.un.org)

> **Karya Kompetisi:** Web Development Competition UINIC 8.0 (UIN Sunan Kalijaga Yogyakarta, Tahun 2026)  
> **Tema Utama:** *"Engineering Interconnected Web Solutions to Empower Digital Ecosystems"*  
> **Sub-Tema:** Sosial Budaya & Lingkungan (Pariwisata Berkelanjutan & Pelestarian Cagar Alam-Budaya)  
> **Kategori:** Individu (Solo Developer)  
> **Nama Tim / Pengembang:** `piantsa` — **Sufyan Tsaury** (NIM: 2530311086, Prodi Hukum Keluarga)  
> **Asal Instansi:** Universitas Islam Negeri (UIN) Siber Syekh Nurjati Cirebon  
> **Akses Demo Langsung:** 🌐 **[https://nusantarapass.vercel.app/](https://nusantarapass.vercel.app/)** *(Mirror CDN: [GitHub Pages](https://sufyantsaury753-beep.github.io/nusantarapass/))*  
> **Dokumen Proposal Resmi:** 📑 **[Format PDF Resmi Lomba (22 Halaman)](./docs/UINIC8%232026_WEBDEV_piantsa_UIN%20Siber%20Syekh%20Nurjati%20Cirebon.pdf)** | 🌐 **[Versi Pratinjau Interaktif (HTML)](./docs/PROPOSAL_UINIC_8.0.html)**  
> **Laporan Pengujian Pengguna (SUS Score 84.83 - Grade A):** 📊 **[`docs/USER_TESTING_SUS.md`](./docs/USER_TESTING_SUS.md)**

---

## 📌 Latar Belakang & Problem Statement
1. **Overtourism & Kerusakan Cagar Budaya/Alam:**
   * Konsentrasi wisatawan di Indonesia sering menumpuk di sedikit destinasi populer (seperti Candi Borobudur, Malioboro, Kuta), memicu abrasi fisik batuan candi, penumpukan sampah di pesisir (misal Pantai Pangandaran), dan kerusakan jalur konservasi alam.
2. **Ketiadaan Sistem Pengendali Kuota Harian (Carrying Capacity):**
   * Sebagian besar situs web pariwisata pemerintah saat ini (seperti Geoportal Kemenpar & portal dinas daerah) hanya berupa brosur digital statis tanpa fitur pemantauan dan pembatasan daya dukung kuota pelestarian *real-time*.
3. **Minimnya Apresiasi & Edukasi Budaya bagi Generasi Muda:**
   * Wisatawan kerap berkunjung hanya untuk berswafoto tanpa memahami nilai sejarah luhur, serta ketiadaan rekam jejak digital (*digital footprint*) yang mengapresiasi kunjungan budaya.
4. **Data Terfragmentasi:**
   * Ketiadaan sistem pertukaran data (*API Interoperability*) antara pengelola destinasi, dinas kebudayaan/pariwisata daerah, dan biro perjalanan wisata.

---

## 🚀 Fitur Unggulan NusantaraPass

### 1. 🗺️ Geoportal Interaktif 38 Provinsi (Leaflet & OpenStreetMap)
* Multi-basemap: **Citra Satelit Beresolusi Tinggi (ESRI)**, **Peta Topografi & Kontur Medan (OpenTopoMap)**, dan **Peta Jalan (OpenStreetMap)**.
* 4 Kategori Destinasi dengan **Custom Floating Thematic SVG Markers**:
  * 🏖️ **Bahari & Pantai:** *Pantai Pangandaran, Pantai Kuta, Tanjung Kelayang Belitung, Raja Ampat*.
  * 🏔️ **Gunung & Dataran Tinggi:** *Gunung Papandayan, Bromo, Rinjani, Dieng*.
  * 🏛️ **Cagar Budaya & Sejarah:** *Candi Borobudur, Candi Prambanan, Keraton Yogyakarta, Tana Toraja*.
  * 🌿 **Taman Nasional & Konservasi:** *TN Baluran, TN Ujung Kulon, Geopark Ciletuh, TN Komodo*.
* **Floating Filter Bar:** Filter Kategori & Filter Wilayah/Pulau se-Indonesia (Jawa, Sumatera, Bali-Nusra, Sulawesi, Papua).

### 2. 🛡️ Live Carrying Capacity & Eco-Warning Barometer
* Memantau kuota harian daya dukung lingkungan (*sustainable carrying capacity*) dengan indikator berkode warna:
  * 🟢 **Tersedia (Aman)**
  * 🟡 **Hampir Penuh (Peringatan Batas Wisatawan)**
  * 🔴 **Penuh / Ditutup Sementara** (untuk perawatan cagar budaya atau gelombang pasang tinggi di pantai).
* Peringatan gelombang pasang & cuaca pantai berbasis data maritim BMKG.

### 3. 💳 Simulasi Payment Gateway Terpadu (NusantaraPass Pay)
* Tersedia di halaman beranda (index.html) dan rincian destinasi (destinasi/index.html).
* **Kalkulasi Biaya Transparan:** Retribusi resmi, Iuran Konservasi Alam (Rp 3.000), dan Premi Asuransi Jiwa Jasa Raharja (Rp 2.000).
* **3 Metode Pembayaran:**
  * 📱 **QRIS Dinamis:** Kode QRIS standar nasional di-generate secara real-time.
  * 🏦 **Virtual Account (VA):** Pilihan Bank Syariah Indonesia (BSI), Mandiri, dan BRI lengkap dengan fitur salin nomor VA.
  * 📲 **E-Wallet:** GoPay, OVO, DANA, dan ShopeePay.
* Countdown timer 15:00 menit, animasi proses perbankan, mutasi kuota live di Supabase Cloud, dan lembar tanda terima digital ber-QR unik.

### 4. 🎫 Smart QR Visitor Pass & E-Tiket Resmi 1 Halaman (PDF Siap Cetak)
* Wisatawan dapat memesan tiket retribusi konservasi digital dalam 1 klik dan mendapatkan **QR Code NusantaraPass**.
* **Generator E-Tiket PDF 1 Halaman:** Mengunduh voucher tiket resmi siap cetak/bawa ke lokasi lengkap dengan QR scanner gerbang, detail rincian wisatawan, barometer daya tampung kawasan, dan panduan pelestarian cagar budaya/alam (*Eco-Code of Conduct*).
* Petugas gerbang destinasi memindai QR tiket untuk verifikasi dan pemotongan kuota harian secara otomatis di database.

### 5. 🛂 E-Passport Jelajah Nusantara & Stempel Digital (Automated PDF)
* Mengadopsi konsep *Stamp Rally* dan paspor peziarah budaya internasional.
* Setiap kali wisatawan melakukan *check-in* di destinasi, mereka mendapatkan **Stempel Digital (*Digital Heritage Stamp*)**.
* **Generator Buku Paspor Digital (Format PDF):** Menghasilkan dokumen resmi berdesain Buku Paspor Republik Indonesia lengkap dengan biodata wisatawan, stempel cap destinasi yang telah dikunjungi, dan sertifikat Pelestari Budaya & Alam Indonesia siap cetak!

### 6. ⚙️ Cloud CMS Admin Dashboard & Server-Side Auth (`admin/index.html`)
* Dashboard khusus pengelola destinasi dan dinas pariwisata:
  * **Autentikasi Server-Side Terverifikasi:** Menggunakan Supabase Auth JWT (`admin.nusantarapass@gmail.com`).
  * **Proteksi Mutasi Database:** Dilindungi oleh PostgreSQL Row-Level Security (RLS). Pengguna tanpa token JWT resmi ditolak langsung di level database (`401/403`).
  * **Manajemen Kuota & Daya Dukung:** CRUD data destinasi, elevasi, tarif retribusi, dan status konservasi secara realtime.
  * **Stored Procedure Keamanan:** Penambahan pengunjung publik diisolasi melalui fungsi `SECURITY DEFINER` (`np_increment_visitor`) sehingga publik tidak memiliki izin memodifikasi atribut administratif destinasi.

### 7. 🔌 Open REST API & Interoperabilitas (PostgREST OpenAPI 3.0 Live)
Sesuai tema *"Engineering Interconnected Web Solutions to Empower Digital Ecosystems"*, NusantaraPass menyediakan endpoint RESTful API publik yang langsung terhubung ke pangkalan data PostgreSQL Cloud via engine PostgREST OpenAPI 3.0:
* **Base Endpoint:** `https://czaafevdnaqmeejthebm.supabase.co/rest/v1/np_destinations`
* **Filter Kategori:** `?category=eq.pantai`, `?category=eq.gunung`, `?category=eq.budaya`, `?category=eq.taman_nasional`
* **Pilihan Proyeksi Kolom:** `?select=code,name,category,province,daily_quota,current_visitors,quota_status`
* **Contoh cURL Langsung (Dapat Diuji Seketika di Terminal/Postman Dewan Juri):**
  ```bash
  curl -s -X GET "https://czaafevdnaqmeejthebm.supabase.co/rest/v1/np_destinations?select=code,name,category,province,daily_quota,current_visitors,quota_status&limit=5" \
    -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6YWFmZXZkbmFxbWVlanRoZWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTY1MjIsImV4cCI6MjEwNzY3MjUyMn0.nZbkhSNe0RrM5hwBLW_DFtGVAzjpVOIjj9nk1DlZ1cU"
  ```

---

## 🗄️ Skema Basis Data Relasional & Keamanan RLS (PostgreSQL Supabase)
Struktur tabel relasional, indeks performa, dan aturan *Row-Level Security (RLS)* tersedia lengkap di:
* [`supabase_schema.sql`](./supabase_schema.sql): DDL skema tabel lengkap, indeks spasial, dan seed data 20 destinasi.
* [`supabase_security_migration.sql`](./supabase_security_migration.sql): Skrip migrasi keamanan RLS ketat (Zero-Trust):
  * `np_destinations`: Akses publik read-only (`SELECT`). Operasi mutasi (`INSERT`, `UPDATE`, `DELETE`) terkunci penuh untuk peran `authenticated` (Admin).
  * `np_increment_visitor(dest_id)`: Prosedur tersimpan (`SECURITY DEFINER`) untuk mutasi kuota publik yang aman tanpa mengekspos hak `UPDATE` ke publik.
  * `np_visitor_passes`, `np_digital_stamps`, `np_checkin_logs`: Akses `INSERT` terkendali untuk pemesanan tiket wisatawan.

---

## 💻 Arsitektur & Tech Stack (Zero-Dependency WebGIS)
* **Frontend:** Semantic HTML5, Modular CSS3 (Design Tokens & Glassmorphism), Vanilla JavaScript (ES6+ Native Modules, Zero Framework Overhead).
* **GIS Mapping Engine:** Leaflet.js v1.9.4, Custom Thematic SVG Precision Pins dengan Jewel-Tone Gradients & Ground Shadow, Multi-layer Tile Basemap (OpenStreetMap Standard, OpenTopoMap Terrain, ESRI World Imagery Satellite).
* **Backend & Cloud Database:** Supabase Cloud (PostgreSQL 15 Relasional, PostgREST OpenAPI 3.0 Engine, Row-Level Security / RLS).
* **Document Engine:** jsPDF v2.5 (Client-Side Vector PDF Engine untuk Buku Paspor Resmi & Sertifikat Pelestari Budaya), QRCode Engine.
* **Hosting & Edge Delivery:** Vercel Global Edge Network (High-Speed Anycast CDN, HTTPS/SSL, HTTP/2 & HTTP/3) & GitHub Pages Mirror.

> 💡 **Rasional Teknis (Technical Rationale):**  
> Mengapa Vanilla Architecture tanpa framework berat? Platform pariwisata NusantaraPass dirancang dengan prinsip **Inklusivitas Wilayah 3T & Green Computing**. Total muatan transfer website hanya **~240 KB** (dibandingkan bundle framework Next.js/React yang mencapai 2.5–5 MB), menghasilkan metrik *First Contentful Paint (FCP) < 0.6 detik* dan *Time to Interactive (TTI) < 0.9 detik*. Hal ini menjamin wisatawan di kawasan alam terpencil atau pulau terluar dengan koneksi 3G/Edge tetap dapat mengakses informasi daya dukung dan tiket QR secara instan.

---

## 🛠️ Cara Menjalankan Secara Lokal

```bash
# 1. Clone repositori
git clone https://github.com/sufyantsaury753-beep/nusantarapass.git
cd nusantarapass

# 2. Buka langsung di browser atau gunakan server statis (Live Server / Python HTTP / npx serve)
npx serve .
# atau buka index.html secara langsung di peramban web Anda
```

---

## 🏆 Kepatuhan Terhadap Kriteria Penilaian Lomba
* **Inovasi & Relevansi Solusi (30%):** Memecahkan isu *overtourism* dan pelestarian cagar alam-budaya di 38 provinsi.
* **Kesesuaian Kebutuhan Pengguna (20%):** Akomodasi dua sisi (Wisatawan dan Pengelola Destinasi/Dinas Pariwisata).
* **Kualitas Teknis & API (20%):** Arsitektur modular, database relasional Supabase, Leaflet GIS, QR engine, dan OpenAPI.
* **Kualitas Desain UI/UX (15%):** Desain modern, warna tematik, *floating luxury markers*, dan responsif di smartphone.
* **Dokumentasi & Testing (15%):** README komprehensif, panduan instalasi, dan proposal lengkap.

---

&copy; 2026 **NusantaraPass**. Dikembangkan untuk Web Development Competition UINIC 8.0 UIN Sunan Kalijaga Yogyakarta.
