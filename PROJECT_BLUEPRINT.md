# NUSANTARAPASS — MASTER ARCHITECTURE & SPECIFICATION
**Platform Geoportal Interkoneksi & Paspor Digital Pariwisata Berkelanjutan 38 Provinsi Indonesia**

---

## 1. IDENTITAS KARYA & KOMPETISI
* **Nama Proyek:** NusantaraPass
* **Kompetisi:** Web Development Competition — UINIC 8.0 (UIN Sunan Kalijaga Yogyakarta, Tahun 2026)
* **Tema Utama:** *"Engineering Interconnected Web Solutions to Empower Digital Ecosystems"*
* **Sub-Tema:** Sosial Budaya & Lingkungan (SDG 11 *Sustainable Cities & Cultural Heritage*, SDG 8.9 *Sustainable Tourism*, SDG 12 *Responsible Consumption*, SDG 14 & 15 *Life on Land & Below Water*)
* **Format Tim:** Individu (Solo Developer)
* **Batas Akhir Pengumpulan:** 30 Oktober 2026 pukul 23.59 WIB
* **Deliverables:** Proposal PDF (maks 30 hal) + Live Web Demosite + GitHub Repository Publik

---

## 2. LATAR BELAKANG & PROBLEM STATEMENT
1. **Masalah Nyata di Indonesia:**
   * **Overtourism & Kerusakan Cagar Budaya/Alam:** Konsentrasi turis hanya menumpuk di sedikit destinasi populer (seperti Candi Borobudur, Malioboro, Kuta), memicu keausan batu candi, sampah plastik pesisir (misal Pantai Pangandaran), dan kerusakan jalur konservasi alam.
   * **Ketiadaan Sistem Pengendali Kuota Harian (Carrying Capacity):** Situs web pariwisata saat ini (seperti Geoportal Kemenpar & Visiting Jogja) hanya berupa brosur digital statis tanpa fitur pembatasan kuota konservasi *real-time*.
   * **Minimnya Apresiasi & Edukasi Budaya bagi Generasi Muda:** Wisatawan datang hanya untuk berfoto tanpa memahami nilai sejarah dan tidak ada rekam jejak edukatif (*digital footprint*).
   * **Sistem Tiketing & Data Terfragmentasi:** Tiap destinasi memakai tiket kertas manual atau sistem tertutup tanpa interoperabilitas API.

---

## 3. SOLUSI & FITUR UTAMA NUSANTARAPASS
1. **Geoportal Interaktif 38 Provinsi (Leaflet & OpenStreetMap):**
   * Multi-basemap: Street View (OSM), Topografi Kontur Medan (OpenTopoMap), dan Citra Satelit (ESRI).
   * 4 Kategori Destinasi dengan Custom Floating SVG Markers:
     - 🏖️ **Bahari & Pantai** (Pangandaran, Kuta, Raja Ampat, Belitung)
     - 🏔️ **Gunung & Dataran Tinggi** (Papandayan, Bromo, Rinjani, Dieng)
     - 🏛️ **Cagar Budaya & Sejarah** (Borobudur, Prambanan, Keraton Jogja, Toraja)
     - 🌿 **Taman Nasional & Konservasi** (Baluran, Ujung Kulon, Ciletuh)
   * Floating Filter: Filter Kategori & Filter Wilayah/Pulau se-Indonesia.
2. **Live Carrying Capacity & Eco-Warning Barometer:**
   * Kuota harian pelestarian per destinasi (indikator hijau/kuning/merah).
   * Status peringatan gelombang/cuaca untuk destinasi pantai & peringatan cuaca gunung.
3. **Smart QR Visitor Pass:**
   * Pemesanan tiket kunjungan digital berbasis dynamic QR Code.
   * Scanner gerbang masuk untuk verifikasi izin & auto-decrement kuota di Supabase.
4. **E-Passport Jelajah Nusantara & Stempel Digital (Automated PDF Generator):**
   * Pengunjung mengoleksi stempel digital (*Digital Heritage Stamp*) setiap kali mengunjungi destinasi.
   * Generator dokumen Buku Paspor Digital resmi Republik Indonesia format PDF siap cetak!
5. **Cloud CMS Admin Dashboard (Pengelola Destinasi):**
   * Metrik analitik kunjungan harian & destinasi terpadat.
   * Manajemen data destinasi (CRUD) & toggle kuota darurat dalam 1 klik.
   * Riwayat log verifikasi tiket QR masuk.
6. **Public REST API (OpenAPI 3.0 Standard):**
   * Endpoint terbuka format JSON untuk interoperabilitas biro travel, dinas pariwisata, dan platform akomodasi.

---

## 4. TECH STACK, ARSITEKTUR & KEAMANAN

### A. Arsitektur Perangkat Lunak
* **Pola Arsitektur:** *Decoupled Zero-Bloat Vanilla Web Architecture with Cloud PostgreSQL (BaaS)*.
* **Frontend Engine:** Semantic HTML5, Modular CSS3 dengan Custom Properties (Design Tokens & Glassmorphism), Vanilla JavaScript (ES6+ Native Modules, Zero Framework Overhead).
* **GIS & Geospatial Mapping:** Leaflet.js v1.9.4, Custom SVG Precision Cartography Pins dengan Jewel-Tone Gradients & Ground Shadow, Multi-layer Tile Basemap (OpenStreetMap Standard, OpenTopoMap Terrain, ESRI World Imagery Satellite).
* **Backend & Cloud Database:** Supabase Cloud (PostgreSQL 15 Relasional, PostgREST OpenAPI 3.0 Engine, Table Constraints, Foreign Key Relations, Row-Level Security / RLS).
* **Document & Vector Generation:** jsPDF v2.5 (Client-Side Vector PDF Engine untuk Buku Paspor Resmi & Sertifikat Pelestari Budaya), QRCode Engine.
* **Keamanan Dasar:** Client-side Form Sanitization, Input Boundary Constraint, Parameterized Database Queries via Supabase PostgREST API, Session Storage Guard.
* **Deployment & CDN:** GitHub Pages (Global CDN Edge Network, HTTPS/SSL, HTTP/2 Protocol) + Supabase Cloud Database.

### B. Rasional & Justifikasi Teknis (Technical Rationale)
1. **Ultra-Low Bandwidth Resilience (Inklusivitas Wisatawan di Wilayah 3T):**
   * Platform pariwisata sering diakses wisatawan saat berada di lokasi alam terbuka, cagar budaya terpencil, atau taman nasional dengan koneksi seluler minim (Edge/3G).
   * Arsitektur *Zero-Dependency Vanilla* membuat total ukuran transfer muatan (*payload transfer size*) hanya **~240 KB** (dibandingkan bundle framework Next.js/React yang umumnya membengkak hingga 2.5–5 MB).
   * **Hasil Metrik Kinerja:** *First Contentful Paint (FCP) < 0.6 detik* dan *Time to Interactive (TTI) < 0.9 detik*, menjamin website dapat dibuka seketika di peramban seluler mana pun tanpa lag.
2. **Green Computing & Digital Sustainability (SDG 12 & 13):**
   * Menghilangkan siklus re-kompilasi runtime yang memboroskan komputasi di server, memangkas konsumsi daya CPU klien, dan mengurangi jejak emisi karbon digital (*carbon-efficient software engineering*).
3. **Decoupled Interoperability (SDG 11):**
   * Menggunakan standar protokol web terbuka W3C DOM dan RESTful OpenAPI 3.0 via PostgREST tanpa keterikatan pada satu ekosistem vendor (*zero vendor lock-in*).
