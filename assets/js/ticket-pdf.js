/**
 * NUSANTARAPASS — E-TIKET RESMI (TRAVELOKA / AIRLINE BOARDING-PASS STYLE)
 * Desain E-Voucher Otentik & Bersih (Format A4 - 1 Halaman Rapi)
 * Memadukan format boarding pass dengan QR scanner dan informasi tata tertib kawasan.
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
  const bookingCode = `NP-TKT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Date.now().toString().slice(-6)}`;
  const priceVal = (dest.ticket_price || 20000).toLocaleString('id-ID');
  const quotaText = dest.daily_quota ? dest.daily_quota.toLocaleString('id-ID') : '1.500';

  // ==========================================
  // 1. TOP ACCENT BAR
  // ==========================================
  doc.setFillColor(15, 118, 110); // Emerald Teal
  doc.rect(0, 0, 210, 4, 'F');

  // ==========================================
  // 2. HEADER: BRAND & BOOKING REFERENCE
  // ==========================================
  // Logo
  if (typeof NUSANTARAPASS_LOGO_BASE64 !== 'undefined' && NUSANTARAPASS_LOGO_BASE64) {
    try {
      doc.addImage(NUSANTARAPASS_LOGO_BASE64, 'PNG', 16, 12, 14, 14);
    } catch (e) {
      console.warn("Logo error:", e);
    }
  }

  // Brand Name & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('NusantaraPass', 33, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Platform Geoportal & Paspor Wisata Berkelanjutan Indonesia', 33, 23.5);

  // Right Header: E-VOUCHER / E-TIKET & BOOKING CODE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110); // Emerald
  doc.text('E-TIKET WISATA RESMI', 194, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('No. Pesanan: ', 160, 23.5, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(bookingCode, 194, 23.5, { align: 'right' });

  // Divider line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.4);
  doc.line(16, 29, 194, 29);

  // ==========================================
  // 3. MAIN TICKET VOUCHER (BOARDING PASS CARD)
  // ==========================================
  const cardX = 16;
  const cardY = 34;
  const cardW = 178;
  const cardH = 92;

  // Ticket Body Background & Border
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.4);
  doc.roundedRect(cardX, cardY, cardW, cardH, 3, 3, 'FD');

  // Top Accent Stripe of Card
  doc.setFillColor(15, 118, 110);
  doc.roundedRect(cardX, cardY, cardW, 8, 3, 3, 'F');
  doc.rect(cardX, cardY + 5, cardW, 3, 'F'); // Square bottom corners

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  const catLabel = (dest.category || 'WISATA').toUpperCase();
  const provLabel = (dest.province || 'INDONESIA').toUpperCase();
  doc.text(`${catLabel}  •  ${provLabel}`, cardX + 6, cardY + 5.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(204, 251, 241); // Teal 100
  doc.text(`KODE: ${dest.code || 'NP-DEST'}`, cardX + cardW - 6, cardY + 5.5, { align: 'right' });

  // Destination Title & Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(dest.name || 'Destinasi Nusantara', cardX + 6, cardY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Wilayah: ${dest.region || 'Indonesia'}   |   Elevasi: ${dest.elevation_m || 5} mdpl   |   Batas Kuota: ${quotaText} pengunjung/hari`, cardX + 6, cardY + 22.5);

  // Internal divider
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.4);
  doc.line(cardX + 6, cardY + 26, cardX + cardW - 6, cardY + 26);

  // --- Left Content: Traveler & Booking Details ---
  const leftX = cardX + 6;
  const col2X = cardX + 62;

  // Row 1: Nama & Tanggal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NAMA PENGUNJUNG', leftX, cardY + 33);
  doc.text('TANGGAL KUNJUNGAN', col2X, cardY + 33);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(visitorName, leftX, cardY + 38);
  doc.text(todayDate, col2X, cardY + 38);

  // Row 2: Email & Jam Kunjungan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('EMAIL AKUN', leftX, cardY + 46);
  doc.text('WAKTU OPERASIONAL', col2X, cardY + 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(visitorEmail, leftX, cardY + 50.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('06.00 – 18.00 WIB', col2X, cardY + 50.5);

  // Row 3: Biaya Retribusi & Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL RETRIBUSI KONSERVASI', leftX, cardY + 58.5);
  doc.text('STATUS PEMBAYARAN', col2X, cardY + 58.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 118, 110);
  doc.text(`Rp ${priceVal}`, leftX, cardY + 64);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('LUNAS / TERKONFIRMASI', col2X, cardY + 63.5);

  // Insurance / Inclusion note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('*Termasuk asuransi kecelakaan pengunjung dan retribusi pemeliharaan cagar budaya.', leftX, cardY + 69);

  // Eco Status Tag (Clean Badge)
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftX, cardY + 73, 108, 13, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(22, 101, 52);
  doc.text('DAYA TAMPUNG KAWASAN: AMAN (CARRYING CAPACITY CONTROLLED)', leftX + 4, cardY + 78);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(21, 128, 61);
  const waveOrWeather = dest.wave_status || 'Kondisi Cuaca & Lingkungan Aman';
  doc.text(`Status Maritim / Cuaca: ${waveOrWeather}`, leftX + 4, cardY + 82.5);

  // --- Perforated Vertical Divider for QR Stub ---
  const stubDividerX = cardX + 122;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  for (let dy = cardY + 12; dy < cardY + cardH - 6; dy += 3) {
    doc.line(stubDividerX, dy, stubDividerX, dy + 1.5);
  }

  // --- Right Stub: QR Code & Gate Scanner ---
  const stubX = stubDividerX + 5;
  const stubW = cardX + cardW - stubX - 4; // ~47mm

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(stubX, cardY + 12, stubW, cardH - 18, 2, 2, 'FD');

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', stubX + (stubW - 36) / 2, cardY + 15, 36, 36);
    } catch (e) {
      console.warn("QR Error:", e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text('PINDAI DI GERBANG', stubX + stubW / 2, cardY + 56, { align: 'center' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text(passToken, stubX + stubW / 2, cardY + 60, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Tunjukkan langsung di HP', stubX + stubW / 2, cardY + 64, { align: 'center' });
  doc.text('Tanpa perlu cetak fisik', stubX + stubW / 2, cardY + 67.5, { align: 'center' });

  // ==========================================
  // 4. IMPORTANT INFORMATION & CODE OF CONDUCT
  // ==========================================
  const infoY = 132;
  const infoH = 70;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(cardX, infoY, cardW, infoH, 2.5, 2.5, 'FD');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('INFORMASI PENTING & TATA TERTIB KUNJUNGAN', cardX + 6, infoY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Harap perhatikan ketentuan berikut sebelum memasuki kawasan destinasi:', cardX + 6, infoY + 13);

  const guidelinesList = [
    {
      title: "1. Cara Masuk Loket:",
      desc: "Tunjukkan e-tiket ini pada layar ponsel kepada petugas loket untuk dipindai. Tidak wajib dicetak di kertas."
    },
    {
      title: "2. Kebijakan Satu Kali Kunjungan:",
      desc: "Tiket hanya berlaku pada tanggal pemesanan untuk 1 (satu) kali akses masuk per orang."
    },
    {
      title: "3. Komitmen Bebas Sampah (Zero Waste):",
      desc: "Dilarang membuang sampah sembarangan dan membawa plastik sekali pakai ke zona inti konservasi. Bawa kembali sampah Anda."
    },
    {
      title: "4. Kepatuhan Hukum Cagar Budaya & Alam:",
      desc: "Dilarang mencoret batuan, memanjat situs cagar budaya, atau memetik flora langka (Sesuai UU No. 11/2010 & UU No. 10/2009)."
    },
    {
      title: "5. Ketentuan Khusus Destinasi:",
      desc: dest.eco_guidelines || "Patuhi batas aman, kenakan pakaian sopan, dan ikuti instruksi pemandu/petugas di lokasi."
    }
  ];

  let gy = infoY + 19;
  guidelinesList.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(item.title, cardX + 6, gy);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    const splitDesc = doc.splitTextToSize(item.desc, cardW - 12);
    doc.text(splitDesc, cardX + 6, gy + 4);

    gy += 4 + (splitDesc.length * 3.4) + 1.5;
  });

  // ==========================================
  // 5. HELP DESK & FOOTER
  // ==========================================
  const footY = 208;

  // Help desk box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX, footY, cardW, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('BUTUH BANTUAN TERKAIT TIKET ANDA?', cardX + 6, footY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Layanan Bantuan Wisatawan: WhatsApp 0812-1430-5925   |   Email: support@nusantarapass.id', cardX + 6, footY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 118, 110);
  doc.text('nusantarapass.vercel.app', cardX + cardW - 6, footY + 11.5, { align: 'right' });

  // Bottom Legal & Authenticity Text
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(cardX, footY + 22, cardX + cardW, footY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen elektronik ini diterbitkan secara sah oleh Platform Geoportal NusantaraPass terintegrasi sistem PostgreSQL Cloud.', 105, footY + 27, { align: 'center' });
  doc.text(`Kode Otentikasi: NP-${dest.code || 'IDN'}-${Date.now().toString()} • Kepatuhan Cagar Budaya & SDGs 11 / 8.9`, 105, footY + 31, { align: 'center' });

  // Safe bottom Y is 243 mm (Leaving 54 mm safe margin at the bottom of A4!)
  // Exactly 1 single page guaranteed.

  // Save PDF
  const safeName = (dest.name || 'Destinasi').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `E_TIKET_${safeName}_${dest.code || 'PASS'}.pdf`;
  doc.save(fileName);
}

// Make globally available
window.generateSingleTicketPDF = generateSingleTicketPDF;
