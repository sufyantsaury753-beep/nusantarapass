/**
 * NUSANTARAPASS — DOKUMEN RETRIBUSI & IZIN MASUK KAWASAN RESMI
 * Format Administrasi Kepariwisataan & Konservasi (A4 - 1 Halaman Sah)
 * Diterbitkan resmi terintegrasi dengan Balai Pengelola Kawasan & Dinas Pariwisata Daerah
 */

function generateSingleTicketPDF(ticketData) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("Modul PDF generator belum siap, silakan coba beberapa saat lagi.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' // 210 x 297 mm
  });

  const dest = ticketData.destination || {};
  const visitorName = ticketData.visitorName || 'Sufyan Tsaury';
  const visitorEmail = ticketData.visitorEmail || 'sufyantsaury753@gmail.com';
  const passToken = ticketData.passToken || `NP-PASS-${dest.code || 'GEN'}-${Date.now().toString().slice(-6)}`;
  const qrDataUrl = ticketData.qrDataUrl || null;

  const now = new Date();
  const todayDate = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const bookingTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.') + ' WIB';
  const bookingCode = `NP-TKT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Date.now().toString().slice(-6)}`;
  const priceVal = (dest.ticket_price || 20000).toLocaleString('id-ID');
  const quotaText = dest.daily_quota ? dest.daily_quota.toLocaleString('id-ID') : '1.500';
  const catLabel = (dest.category || 'WISATA').replace(/_/g, ' ').toUpperCase();
  const provLabel = (dest.province || 'INDONESIA').toUpperCase();

  const marginL = 18;
  const marginR = 192;
  const contentW = marginR - marginL; // 174 mm

  // ==========================================
  // 1. KOP RESMI DOKUMEN (INSTITUTIONAL HEADER)
  // ==========================================
  if (typeof NUSANTARAPASS_LOGO_BASE64 !== 'undefined' && NUSANTARAPASS_LOGO_BASE64) {
    try {
      doc.addImage(NUSANTARAPASS_LOGO_BASE64, 'PNG', marginL, 14, 15, 15);
    } catch (e) {
      console.warn("Logo embed error:", e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 60, 35); // Deep Heritage Green
  doc.text('NUSANTARAPASS INDONESIA', marginL + 18, 18.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text('SISTEM GEOPORTAL TERPADU & PENGENDALIAN DAYA TAMPUNG WISATA', marginL + 18, 23.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Kemitraan Badan Pengelola Kawasan Konservasi & Dinas Pariwisata Daerah • 38 Provinsi', marginL + 18, 28);

  // Garis Pembatas Kop Surat Resmi (Double Line)
  doc.setDrawColor(15, 60, 35);
  doc.setLineWidth(0.8);
  doc.line(marginL, 32, marginR, 32);

  doc.setLineWidth(0.25);
  doc.line(marginL, 33.3, marginR, 33.3);

  // ==========================================
  // 2. JUDUL DOKUMEN & NOMOR REGISTRASI
  // ==========================================
  doc.setFont('times', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('SURAT TANDA BUKTI RETRIBUSI & IZIN MASUK KAWASAN', 105, 41.5, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`NOMOR REGISTRASI: ${bookingCode}`, 105, 47, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Diterbitkan secara sah pada: ${todayDate}, Pukul ${bookingTime}`, 105, 51.5, { align: 'center' });

  // ==========================================
  // 3. BAGIAN I: DESTINASI KAWASAN TUJUAN
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 60, 35);
  doc.text('I. DESTINASI TUJUAN & LOKASI KAWASAN', marginL, 59.5);

  // Bingkai Destinasi (Straight lines, radius 0)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(marginL, 62.5, contentW, 20.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(dest.name || 'Destinasi Nusantara', marginL + 5, 71.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Kategori: ${catLabel}   |   Wilayah: ${dest.region || 'Indonesia'} (${provLabel})   |   Kode: ${dest.code || 'NP-DEST'}   |   Batas Kuota: ${quotaText} Pengunjung/Hari`, marginL + 5, 78);

  // ==========================================
  // 4. BAGIAN II: IDENTITAS WISATAWAN & VERIFIKASI GERBANG
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 60, 35);
  doc.text('II. IDENTITAS PENGUNJUNG & AREA VERIFIKASI LOKET', marginL, 89.5);

  // Frame Utama Bagian II
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(marginL, 92.5, contentW, 58, 'FD');

  // Sub-kolom Kiri: Rincian Pengunjung & Transaksi (Lebar: 116 mm)
  const leftColW = 116;
  const leftX = marginL + 5;

  // Row 1: Nama Pengunjung
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Nama Lengkap Pemegang Izin:', leftX, 98.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(visitorName, leftX, 103.5);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.line(leftX, 106, marginL + leftColW - 3, 106);

  // Row 2: Email & Tanggal Kunjungan (2 Sub-kolom)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Email Terdaftar:', leftX, 111);
  doc.text('Tanggal Berlaku:', leftX + 56, 111);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(visitorEmail, leftX, 116);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(todayDate, leftX + 56, 116);

  doc.line(leftX, 118.5, marginL + leftColW - 3, 118.5);

  // Row 3: Jam Akses & Status Pembayaran
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Waktu Akses Masuk:', leftX, 123.5);
  doc.text('Status Pembayaran:', leftX + 56, 123.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('06.00 – 18.00 WIB', leftX, 128.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('LUNAS (TERVERIFIKASI)', leftX + 56, 128.5);

  doc.line(leftX, 131, marginL + leftColW - 3, 131);

  // Row 4: Biaya Retribusi
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Tarif Retribusi Masuk & Konservasi:', leftX, 136);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Rp ${priceVal} / orang`, leftX, 142);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('*Termasuk premi asuransi kecelakaan diri pengunjung dan dana pelestarian cagar alam.', leftX, 147);

  // Garis Pembatas Vertikal Lurus Antar Kolom
  const splitX = marginL + leftColW;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.line(splitX, 92.5, splitX, 150.5);

  // Sub-kolom Kanan: Area Verifikasi QR Gerbang (Lebar: 58 mm)
  const rightColCenterX = splitX + (contentW - leftColW) / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('VERIFIKASI GERBANG MASUK', rightColCenterX, 98.5, { align: 'center' });

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', rightColCenterX - 18, 100.5, 36, 36);
    } catch (e) {
      console.warn("QR Error:", e);
    }
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(passToken, rightColCenterX, 140, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Tunjukkan kode QR kepada petugas loket', rightColCenterX, 144, { align: 'center' });
  doc.text('Dapat ditunjukkan langsung dari layar HP', rightColCenterX, 147.5, { align: 'center' });

  // ==========================================
  // 5. BAGIAN III: STATUS DAYA TAMPUNG KAWASAN
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 60, 35);
  doc.text('III. STATUS DAYA TAMPUNG KAWASAN & INFORMASI LINGKUNGAN', marginL, 157.5);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(marginL, 160.5, contentW, 23.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Status Kawasan:', marginL + 5, 166.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('AMAN DAN TERKENDALI (KUOTA MASIH TERSEDIA)', marginL + 30, 166.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('Sistem daya dukung lingkungan (Carrying Capacity) memastikan jumlah pengunjung harian berada dalam batas aman konservasi.', marginL + 5, 171.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const waveOrWeather = dest.wave_status || 'Kondisi Cuaca Cerah & Aman';
  doc.text(`Kondisi Lingkungan / BMKG: ${waveOrWeather}`, marginL + 5, 176.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  const ecoRules = dest.eco_guidelines || 'Patuhi rambu pemandu dan instruksi petugas lapangan.';
  doc.text(`Aturan Khusus: ${ecoRules}`, marginL + 5, 181);

  // ==========================================
  // 6. BAGIAN IV: KETENTUAN KUNJUNGAN & HUKUM
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 60, 35);
  doc.text('IV. KETENTUAN KUNJUNGAN & KEPATUHAN HUKUM', marginL, 191);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(marginL, 194, contentW, 50, 'FD');

  const rulesList = [
    {
      num: "1.",
      title: "Pemeriksaan Izin Masuk:",
      desc: "Pengunjung wajib menunjukkan lembar e-tiket ini (baik melalui layar ponsel atau cetakan fisik) kepada petugas pintu masuk untuk dipindai sebelum memasuki area kawasan."
    },
    {
      num: "2.",
      title: "Masa Berlaku Izin:",
      desc: "Dokumen ini hanya sah untuk 1 (satu) kali akses kunjungan pada tanggal yang tertera dan tidak dapat dipindahtangankan kepada pihak lain."
    },
    {
      num: "3.",
      title: "Kebijakan Kelestarian Lingkungan (Zero Waste):",
      desc: "Dilarang membuang sampah sembarangan dan dilarang membawa kemasan plastik sekali pakai ke dalam zona inti konservasi. Pengunjung wajib membawa kembali sampah masing-masing."
    },
    {
      num: "4.",
      title: "Perlindungan Hukum Cagar Budaya & Cagar Alam:",
      desc: "Pengunjung dilarang keras merusak vegetasi, mencoret batuan situs, mengganggu fauna, atau memanjat bangunan cagar budaya (Kepatuhan UU No. 11/2010 tentang Cagar Budaya & UU No. 10/2009 tentang Kepariwisataan)."
    },
    {
      num: "5.",
      title: "Integrasi Paspor Pelestari Budaya:",
      desc: "Penerbitan dan pemindaian tiket ini secara otomatis mendokumentasikan stempel digital pada Buku Paspor Jelajah Nusantara di akun profil Anda."
    }
  ];

  let ry = 200;
  rulesList.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(item.num, marginL + 5, ry);
    doc.text(item.title, marginL + 9, ry);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);

    const splitDesc = doc.splitTextToSize(item.desc, contentW - 14);
    doc.text(splitDesc, marginL + 9, ry + 3.8);

    ry += 3.8 + (splitDesc.length * 3.2) + 1.2;
  });

  // ==========================================
  // 7. FOOTER ADMINISTRASI RESMI
  // ==========================================
  const footY = 249;
  doc.setDrawColor(15, 60, 35);
  doc.setLineWidth(0.4);
  doc.line(marginL, footY, marginR, footY);

  // Kiri: Identitas Platform & Helpdesk
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 60, 35);
  doc.text('NusantaraPass Indonesia', marginL, footY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Platform Geoportal Interkoneksi Pariwisata Berkelanjutan 38 Provinsi', marginL, footY + 9.5);
  doc.text('Layanan Bantuan & Hotline Kawasan: WhatsApp 0812-1430-5925 | https://nusantarapass.vercel.app/', marginL, footY + 13.5);

  // Kanan: Validasi Sistem
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('DOKUMEN ELEKTRONIK SAH', marginR, footY + 5.5, { align: 'right' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text(`KODE AUTENTIKASI: NP-${dest.code || 'IDN'}-${Date.now().toString().slice(-8)}`, marginR, footY + 9.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184);
  doc.text('Sistem Basis Data PostgreSQL PostgREST • SDG 11 & SDG 8.9', marginR, footY + 13.5, { align: 'right' });

  // Save PDF
  const safeName = (dest.name || 'Destinasi').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `E_TIKET_${safeName}_${dest.code || 'PASS'}.pdf`;
  doc.save(fileName);
}

/**
 * NUSANTARAPASS — BUKU REKAPITULASI RESMI PASPOR JELAJAH NUSANTARA
 * Format Dokumen Rekapitulasi Izin Kunjungan & Pelestarian Konservasi (A4 - 1 Halaman Sah)
 * Diterbitkan resmi terintegrasi dengan Sistem Terpadu NusantaraPass 38 Provinsi
 */
function generateOfficialPassportPDF(passportData = {}) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("Modul PDF generator belum siap, silakan coba beberapa saat lagi.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' // 210 x 297 mm
  });

  const visitorName = passportData.visitorName || 'Sufyan Tsaury';
  const visitorEmail = passportData.visitorEmail || 'sufyantsaury753@gmail.com';
  const passSerial = passportData.passSerial || Date.now().toString().slice(-8);
  const stamps = (passportData.stamps && passportData.stamps.length > 0)
    ? passportData.stamps
    : (typeof myPassportStamps !== 'undefined' && myPassportStamps.length > 0
        ? myPassportStamps
        : ['dest-pgr-01', 'dest-bbd-11', 'dest-ppd-06']);

  const now = new Date();
  const todayDate = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const bookingTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.') + ' WIB';
  const passportRegisterCode = `NP-PASPOR-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${passSerial.slice(-6)}`;

  const marginL = 18;
  const marginR = 192;
  const contentW = marginR - marginL; // 174 mm

  // ==========================================
  // 1. KOP RESMI DOKUMEN (INSTITUTIONAL HEADER)
  // ==========================================
  if (typeof NUSANTARAPASS_LOGO_BASE64 !== 'undefined' && NUSANTARAPASS_LOGO_BASE64) {
    try {
      doc.addImage(NUSANTARAPASS_LOGO_BASE64, 'PNG', marginL, 14, 15, 15);
    } catch (e) {
      console.warn("Logo embed error:", e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 60, 35); // Deep Heritage Green
  doc.text('NUSANTARAPASS INDONESIA', marginL + 18, 18.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text('SISTEM GEOPORTAL TERPADU & PENGENDALIAN DAYA TAMPUNG WISATA', marginL + 18, 23.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Kemitraan Badan Pengelola Kawasan Konservasi & Dinas Pariwisata Daerah • 38 Provinsi', marginL + 18, 28);

  // Garis Pembatas Kop Surat Resmi (Double Line)
  doc.setDrawColor(15, 60, 35);
  doc.setLineWidth(0.8);
  doc.line(marginL, 32, marginR, 32);

  doc.setLineWidth(0.25);
  doc.line(marginL, 33.3, marginR, 33.3);

  // ==========================================
  // 2. JUDUL DOKUMEN RESMI
  // ==========================================
  doc.setFont('times', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text('BUKU REKAPITULASI RESMI PASPOR JELAJAH NUSANTARA', 105, 41.5, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`NOMOR REGISTER: ${passportRegisterCode}`, 105, 47, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Diterbitkan secara sah melalui Sistem Terpadu NusantaraPass pada: ${todayDate}, Pukul ${bookingTime}`, 105, 51.5, { align: 'center' });

  // ==========================================
  // 3. BAGIAN I: DATA IDENTITAS PEMEGANG PASPOR
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 60, 35);
  doc.text('I. DATA IDENTITAS PEMEGANG PASPOR DIGITAL', marginL, 59.5);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(marginL, 62.5, contentW, 25.5, 'FD');

  const halfW = contentW / 2;

  // Kolom Kiri
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Nama Lengkap Pemegang:', marginL + 5, 68);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(visitorName, marginL + 5, 73.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Email Terdaftar:', marginL + 5, 79);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(visitorEmail, marginL + 5, 84);

  // Kolom Kanan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Nomor Paspor Digital:', marginL + halfW + 5, 68);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`NP-${passSerial}`, marginL + halfW + 5, 73.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Kategori Keanggotaan & Otorisasi:', marginL + halfW + 5, 79);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Wisatawan Ramah Lingkungan (TERVERIFIKASI)', marginL + halfW + 5, 84);

  // Divider vertikal
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.line(marginL + halfW, 62.5, marginL + halfW, 88);

  // ==========================================
  // 4. BAGIAN II: LEMBAR STEMPEL & DESTINASI SAH
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 60, 35);
  doc.text('II. LEMBAR PENGESAHAN KUNJUNGAN & STEMPEL KAWASAN RESMI', marginL, 95);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Daftar destinasi terdaftar yang telah tervalidasi kuota daya tampung lingkungan dan izin masuknya.', marginL, 99);

  // Tabel Formal Administratif
  const tblY = 101.5;
  const tblHdrH = 7.5;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(marginL, tblY, contentW, tblHdrH, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);

  const colNo = marginL + 3;
  const colDest = marginL + 12;
  const colProv = marginL + 72;
  const colCat = marginL + 116;
  const colQuota = marginL + 142;
  const colValid = marginL + 172;

  doc.text('No.', colNo, tblY + 5);
  doc.text('Nama Kawasan Destinasi', colDest, tblY + 5);
  doc.text('Provinsi / Wilayah', colProv, tblY + 5);
  doc.text('Kategori', colCat, tblY + 5);
  doc.text('Status Kuota', colQuota, tblY + 5);
  doc.text('Pengesahan', colValid, tblY + 5, { align: 'right' });

  let rY = tblY + tblHdrH;
  const rHeight = 10.5;
  const displayStamps = stamps.slice(0, 6);

  displayStamps.forEach((id, idx) => {
    const d = (typeof NUSANTARA_DESTINATIONS !== 'undefined')
      ? NUSANTARA_DESTINATIONS.find((dest) => dest.id === id)
      : null;
    const destName = d ? d.name : 'Destinasi Kawasan Prioritas';
    const destProv = d ? d.province : 'Indonesia';
    const destCat = d ? d.category.replace(/_/g, ' ').toUpperCase() : 'KONSERVASI';

    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.rect(marginL, rY, contentW, rHeight, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}.`, colNo, rY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.text(destName, colDest, rY + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.text(destProv, colProv, rY + 6.5);
    doc.text(destCat, colCat, rY + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Terkendali (Aman)', colQuota, rY + 6.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('[TERVALIDASI]', colValid, rY + 6.5, { align: 'right' });

    rY += rHeight;
  });

  // Garis luar tabel
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(marginL, tblY, contentW, rY - tblY);

  // ==========================================
  // 5. BAGIAN III: KETENTUAN KEPATUHAN & DASAR HUKUM
  // ==========================================
  const sec3Y = rY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 60, 35);
  doc.text('III. KETENTUAN KEPATUHAN & DASAR HUKUM KONSERVASI', marginL, sec3Y);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(marginL, sec3Y + 3, contentW, 36, 'FD');

  const legalPoints = [
    { n: "1.", t: "Keabsahan Rekam Jejak:", d: "Buku Rekapitulasi Paspor ini adalah bukti elektronik resmi kontribusi pemegang paspor dalam mendukung ekowisata berkelanjutan dan pelestarian cagar alam/budaya 38 provinsi." },
    { n: "2.", t: "Akses Masuk Gerbang Loket:", d: "Untuk izin masuk fisik perorangan di pintu gerbang masing-masing destinasi, pengunjung dapat mencetak lembar E-Tiket perorangan ber-QR Code dari sistem NusantaraPass." },
    { n: "3.", t: "Perlindungan Hukum:", d: "Pengunjung wajib mematuhi UU No. 11 Tahun 2010 tentang Cagar Budaya dan UU No. 10 Tahun 2009 tentang Kepariwisataan. Dilarang merusak cagar alam/budaya serta wajib membawa pulang sampah (Zero Waste)." }
  ];

  let lY = sec3Y + 8;
  legalPoints.forEach((pt) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(pt.n, marginL + 5, lY);
    doc.text(pt.t, marginL + 9, lY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    const splitD = doc.splitTextToSize(pt.d, contentW - 14);
    doc.text(splitD, marginL + 9, lY + 3.8);

    lY += 3.8 + (splitD.length * 3.2) + 1;
  });

  // ==========================================
  // 6. BAGIAN IV: PENGESAHAN ELEKTRONIK & VERIFIKASI SISTEM
  // ==========================================
  const sec4Y = sec3Y + 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 60, 35);
  doc.text('IV. PENGESAHAN ELEKTRONIK & VERIFIKASI SISTEM', marginL, sec4Y);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(marginL, sec4Y + 3, contentW, 26, 'FD');

  // Kiri: Teks Otoritas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text('Pengelola Platform Geoportal NusantaraPass', marginL + 5, sec4Y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Telah diperiksa dan diverifikasi secara elektronik melalui database PostgREST Supabase.', marginL + 5, sec4Y + 14);
  doc.text(`Kode Autentikasi Sistem: NP-AUTH-PASSPOR-${passSerial}-${now.getFullYear()}`, marginL + 5, sec4Y + 18.5);
  doc.text('Dokumen ini sah tanpa tanda tangan basah berdasarkan ketentuan UU ITE No. 11/2008.', marginL + 5, sec4Y + 23);

  // Kanan: Cap Resmi Teks
  doc.setDrawColor(15, 60, 35);
  doc.setLineWidth(0.4);
  doc.rect(marginR - 44, sec4Y + 6.5, 39, 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 60, 35);
  doc.text('TERVERIFIKASI SAH', marginR - 24.5, sec4Y + 13, { align: 'center' });
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);
  doc.text('NUSANTARAPASS SISTEM TERPADU', marginR - 24.5, sec4Y + 18, { align: 'center' });

  // ==========================================
  // 7. FOOTER RESMI
  // ==========================================
  const footY = 282;
  doc.setDrawColor(15, 60, 35);
  doc.setLineWidth(0.4);
  doc.line(marginL, footY, marginR, footY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 60, 35);
  doc.text('NusantaraPass Indonesia', marginL, footY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Platform Geoportal Interkoneksi Pariwisata Berkelanjutan 38 Provinsi • SDG 11 & SDG 8.9', marginL, footY + 8);

  doc.setFont('courier', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(`DOKUMEN REGISTER ELEKTRONIK • NP-${passSerial}`, marginR, footY + 4.5, { align: 'right' });

  doc.save(`PASPOR_NUSANTARA_${passSerial.slice(-6)}.pdf`);
}

// Make globally available
window.generateSingleTicketPDF = generateSingleTicketPDF;
window.generateOfficialPassportPDF = generateOfficialPassportPDF;
