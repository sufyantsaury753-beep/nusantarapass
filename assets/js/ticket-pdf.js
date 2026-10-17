/**
 * NUSANTARAPASS — E-TIKET WISATA & RETRIBUSI KONSERVASI GENERATOR (jsPDF)
 * Menghasilkan Dokumen E-Tiket 1 Halaman A4 ala Traveloka/Klook
 * Dilengkapi Barcode Kuota, QR Code Gerbang Masuk, Peringatan Maritim BMKG, & SOP Cagar Budaya.
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
  const bookingTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const bookingCode = `NP-TKT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Date.now().toString().slice(-6)}`;

  // 1. Top Accent Strip
  doc.setFillColor(15, 118, 110); // Emerald Teal
  doc.rect(0, 0, 210, 5, 'F');

  // 2. Header: Logo & Branding
  if (typeof NUSANTARAPASS_LOGO_BASE64 !== 'undefined' && NUSANTARAPASS_LOGO_BASE64) {
    try {
      doc.addImage(NUSANTARAPASS_LOGO_BASE64, 'PNG', 15, 12, 16, 16);
    } catch (e) {
      console.warn("Logo error:", e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('NusantaraPass', 34, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Platform Geoportal Interkoneksi Pariwisata Berkelanjutan 38 Provinsi', 34, 25);

  // Header Right Badge: Official E-Ticket
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.4);
  doc.roundedRect(132, 12, 63, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('E-TIKET WISATA & RETRIBUSI RESMI', 163.5, 18.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(21, 128, 61);
  doc.text('DOKUMEN VALIDASI KUOTA KONSERVASI', 163.5, 24, { align: 'center' });

  // Top Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(15, 33, 195, 33);

  // 3. Booking Metadata Bar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 37, 180, 15, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('KODE BOOKING TIKET', 20, 42.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(bookingCode, 20, 48);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('WAKTU PENERBITAN', 90, 42.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${todayDate}, ${bookingTime}`, 90, 48);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('STATUS VERIFIKASI', 150, 42.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text('TERKONFIRMASI (LUNAS)', 150, 48);

  // 4. MAIN VOUCHER TICKET CARD
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(15, 57, 180, 84, 2, 2, 'FD');

  // Card Header Banner
  doc.setFillColor(15, 118, 110);
  doc.roundedRect(15, 57, 180, 11, 2, 2, 'F');
  doc.rect(15, 63, 180, 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  const catText = (dest.category || 'WISATA').toUpperCase();
  const provText = (dest.province || 'INDONESIA').toUpperCase();
  doc.text(`KATEGORI: ${catText} | WILAYAH: ${provText}`, 20, 64.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(187, 247, 208);
  doc.text(`KODE: ${dest.code || 'NP-DEST'}`, 190, 64.5, { align: 'right' });

  // Destination Title
  doc.setFont('times', 'bold');
  doc.setFontSize(16.5);
  doc.setTextColor(15, 23, 42);
  doc.text(dest.name || 'Destinasi Nusantara', 20, 77);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const quotaText = dest.daily_quota ? dest.daily_quota.toLocaleString('id-ID') : '1.500';
  doc.text(`Gugus Wilayah: ${dest.region || 'Indonesia'} | Elevasi: ${dest.elevation_m || 5} mdpl | Batas Kuota Harian: ${quotaText} pengunjung`, 20, 83);

  // Dashed Divider inside voucher
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(20, 87, 190, 87);

  // Left Section: Visitor & Pricing Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NAMA PENGUNJUNG / WISATAWAN', 20, 94);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(visitorName, 20, 99.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('EMAIL AKUN PEMESAN', 20, 106.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(visitorEmail, 20, 111.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TANGGAL BERLAKU KUNJUNGAN', 20, 118.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${todayDate} (Berlaku 1 Hari Penuh, Pukul 06.00 - 18.00 WIB)`, 20, 123.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL RETRIBUSI KONSERVASI', 20, 130.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  const priceVal = (dest.ticket_price || 20000).toLocaleString('id-ID');
  doc.text(`Rp ${priceVal} / pengunjung`, 20, 136);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('*Termasuk asuransi perlindungan keselamatan & donasi pemeliharaan cagar alam-budaya.', 20, 139.5);

  // Vertical Separation Line for QR
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.line(134, 89, 134, 139);

  // Right Section: QR Gate Scanner Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(138, 90, 52, 48, 2, 2, 'FD');

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', 145, 92, 38, 38);
    } catch(e) {
      console.warn("QR Embed error:", e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PINDAI DI PINTU GERBANG', 164, 132.5, { align: 'center' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text(passToken, 164, 136, { align: 'center' });

  // 5. CARRYING CAPACITY & ECO-MONITORING BAROMETER
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.35);
  doc.roundedRect(15, 146, 180, 29, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('STATUS DAYA TAMPUNG KAWASAN: AMAN & TERKENDALI (CARRYING CAPACITY SAFE)', 20, 153);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(20, 83, 45);
  const ecoTxt = "Pariwisata Berkelanjutan: Kuota destinasi ini dikendalikan oleh sistem cloud real-time guna mencegah overtourism. Kunjungan Anda tercatat sah dan turut mendukung pelestarian lingkungan hidup dan cagar budaya.";
  doc.text(doc.splitTextToSize(ecoTxt, 170), 20, 159);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(3, 105, 161);
  doc.text(`Peringatan Maritim / Cuaca BMKG: ${dest.wave_status || 'Aman (Kondisi Cuaca Cerah)'}`, 20, 166.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(22, 101, 52);
  const guidelines = dest.eco_guidelines || 'Patuhi batas aman, dilarang merusak cagar alam/budaya, dan buang sampah pada tempatnya.';
  doc.text(`Aturan Khusus: ${guidelines}`, 20, 171.5);

  // 6. TERMS & CONDITIONS / ECO-CODE OF CONDUCT
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(15, 180, 180, 60, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PANDUAN KUNJUNGAN & KETENTUAN HUKUM PELESTARIAN', 20, 188);

  const rules = [
    "1. Validasi Pintu Masuk: Tunjukkan QR Code pada tiket ini melalui layar smartphone atau cetakan kertas kepada petugas loket/gerbang masuk resmi destinasi.",
    "2. Integrasi Paspor Budaya: Penerbitan e-tiket ini secara otomatis menambahkan stempel digital ke Buku Paspor Jelajah Nusantara pada profil Anda.",
    "3. Komitmen Bebas Sampah (Zero Waste): Pengunjung wajib menjaga kebersihan. Dilarang meninggalkan sampah plastik sekali pakai di kawasan konservasi.",
    "4. Perlindungan Hukum Cagar Budaya & Cagar Alam: Pengunjung dilarang keras mencoret, memanjat batuan situs cagar budaya, atau memetik flora langka (Kepatuhan UU No. 11 Tahun 2010 tentang Cagar Budaya & UU No. 10 Tahun 2009 tentang Kepariwisataan).",
    "5. Bantuan & Darurat: Apabila membutuhkan informasi atau bantuan medis di kawasan, hubungi pos pengawas balai setempat atau gunakan fitur tombol Bantuan di platform NusantaraPass."
  ];

  let rY = 195;
  rules.forEach(r => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const splitR = doc.splitTextToSize(r, 170);
    doc.text(splitR, 20, rY);
    rY += (splitR.length * 4) + 1.5;
  });

  // 7. FOOTER & SECURITY AUTHENTICATION
  doc.setDrawColor(212, 175, 55); // Gold
  doc.setLineWidth(0.5);
  doc.line(15, 246, 195, 246);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 60, 35);
  doc.text('PLATFORM GEOPORTAL NUSANTARAPASS INDONESIA', 105, 252, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Dokumen resmi bukti retribusi wisata & pengendalian kapasitas lingkungan hidup 38 provinsi.', 105, 256.5, { align: 'center' });
  doc.text('Inovasi Rekayasa Perangkat Lunak Berbasis SDG 11 & SDG 8.9 | Terintegrasi Cloud PostgreSQL PostgREST', 105, 260.5, { align: 'center' });

  // Machine Readable Zone (MRZ)
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const destCodePad = (dest.code || 'NP-IDN').padEnd(12, '<');
  doc.text(`TKT<IDN<${destCodePad}<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`, 105, 269, { align: 'center' });
  doc.text(`NP${Date.now().toString().slice(-8)}<8IDN9805128M2610284<<<<<<<<<<<<<<<<<<<<<<<<<04`, 105, 273.5, { align: 'center' });

  // Save PDF
  const safeName = (dest.name || 'Destinasi').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `E_TIKET_${safeName}_${dest.code || 'PASS'}.pdf`;
  doc.save(fileName);
}

// Make globally available
window.generateSingleTicketPDF = generateSingleTicketPDF;
