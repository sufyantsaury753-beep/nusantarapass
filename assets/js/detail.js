/**
 * NUSANTARAPASS — DEDICATED DESTINATION DETAIL & VISUAL GALLERY SCRIPT
 * Seamlessly integrated with Nusantara dataset, Pro Lightbox, and Smart Pass QR engine
 */

let currentDest = null;
let currentMediaList = [];
let currentMediaIndex = 0;
let currentCategory = 'all';
let myPassportStamps = JSON.parse(localStorage.getItem('np_stamps') || '[]');

// Helper to get URL query parameter
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name) || urlParams.get('dest') || urlParams.get('id');
}

document.addEventListener('DOMContentLoaded', () => {
  initDetailPage();
  updatePassportBadge();
});

function initDetailPage() {
  const requestedId = getUrlParameter('id') || 'dest-pgr-01';

  // Find destination in dataset
  currentDest = (typeof NUSANTARA_DESTINATIONS !== 'undefined')
    ? NUSANTARA_DESTINATIONS.find(d => d.id === requestedId)
    : null;

  if (!currentDest && typeof NUSANTARA_DESTINATIONS !== 'undefined') {
    currentDest = NUSANTARA_DESTINATIONS[0];
  }

  if (!currentDest) return;

  document.title = `${currentDest.name} — Galeri & Geoportal NusantaraPass`;

  renderHeroAndSpecs();
  renderConservationSection();
  setupMediaList();
  renderGalleryGrid();
  setupLightboxListeners();
}

function renderHeroAndSpecs() {
  const navSub = document.getElementById('navDestinationSubtitle');
  if (navSub) navSub.textContent = `${currentDest.name} · ${currentDest.province}`;

  const heroCoverImg = document.getElementById('heroCoverImg');
  if (heroCoverImg) {
    heroCoverImg.src = currentDest.photo_url;
    heroCoverImg.alt = currentDest.name;
  }

  const heroLocationTag = document.getElementById('heroLocationTag');
  if (heroLocationTag) {
    heroLocationTag.textContent = `${currentDest.province} • Wilayah ${currentDest.region}`;
  }

  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) heroTitle.textContent = currentDest.name;

  const infoLocationTag = document.getElementById('infoLocationTag');
  if (infoLocationTag) {
    infoLocationTag.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      <span>${currentDest.province}, ${currentDest.region}</span>
    `;
  }

  const infoTitle = document.getElementById('infoTitle');
  if (infoTitle) infoTitle.textContent = currentDest.name;

  const destDesc1 = document.getElementById('destDescription1');
  if (destDesc1) destDesc1.textContent = currentDest.description;

  const destDesc2 = document.getElementById('destDescription2');
  if (destDesc2) {
    destDesc2.textContent = `Destinasi ini merupakan bagian dari cagar alam dan budaya prioritas NusantaraPass 38 Provinsi dengan pengawasan kuota pelestarian harian untuk mencegah overtourism serta mendukung pencapaian SDG 11 (Pelestarian Warisan Budaya) dan SDG 8.9 (Pariwisata Berkelanjutan).`;
  }

  // Specs Matrix
  const specElevation = document.getElementById('specElevation');
  if (specElevation) {
    specElevation.textContent = currentDest.elevation_m > 50 
      ? `${currentDest.elevation_m.toLocaleString('id-ID')} Mdpl`
      : `${currentDest.elevation_m} Mdpl (Pesisir)`;
  }

  const specQuota = document.getElementById('specQuota');
  if (specQuota) {
    const quotaPercent = Math.min((currentDest.current_visitors / currentDest.daily_quota) * 100, 100);
    specQuota.textContent = `${(currentDest.current_visitors || 0).toLocaleString('id-ID')} / ${(currentDest.daily_quota || 1000).toLocaleString('id-ID')}`;
    specQuota.style.color = quotaPercent > 90 ? '#ef4444' : quotaPercent > 70 ? '#f59e0b' : '#059669';
  }

  const specWeather = document.getElementById('specWeather');
  if (specWeather) {
    specWeather.textContent = currentDest.wave_status || 'Normal (Aman)';
  }

  // Tags Container
  const tagsContainer = document.getElementById('tagsContainer');
  if (tagsContainer) {
    const categoryName = getCategoryDisplayName(currentDest.category);
    tagsContainer.innerHTML = `
      <div class="tag-chip active-cat">${categoryName}</div>
      <div class="tag-chip">${currentDest.province}</div>
      <div class="tag-chip">Wilayah ${currentDest.region}</div>
      <div class="tag-chip">SDG 11 Pelestarian Warisan</div>
      <div class="tag-chip">SDG 8.9 Ekowisata</div>
      <div class="tag-chip" style="font-weight: 800; color: #059669;">Retribusi: Rp ${(currentDest.ticket_price || 20000).toLocaleString('id-ID')}</div>
    `;
  }
}

function getCategoryDisplayName(cat) {
  if (cat === 'pantai') return '🏖️ Bahari & Pantai';
  if (cat === 'gunung') return '🏔️ Gunung & Dataran Tinggi';
  if (cat === 'budaya') return '🏛️ Cagar Budaya & Sejarah';
  if (cat === 'taman_nasional' || cat === 'konservasi') return '🌿 Taman Nasional & Konservasi';
  return (cat || '').replace('_', ' ');
}

function renderConservationSection() {
  const quotaPercent = Math.min((currentDest.current_visitors / currentDest.daily_quota) * 100, 100);
  const quotaColor = quotaPercent > 90 ? '#ef4444' : quotaPercent > 70 ? '#f59e0b' : '#059669';

  const bar = document.getElementById('conservationProgressBar');
  if (bar) {
    bar.style.width = `${quotaPercent}%`;
    bar.style.background = quotaColor;
  }

  const statusText = document.getElementById('conservationStatusText');
  if (statusText) {
    statusText.textContent = `Status Kuota: ${(currentDest.quota_status || 'tersedia').replace('_', ' ').toUpperCase()} (${Math.round(quotaPercent)}% Kapasitas Terpakai)`;
    statusText.style.color = quotaColor;
  }

  const guidelinesEl = document.getElementById('conservationGuidelinesText');
  if (guidelinesEl) {
    guidelinesEl.textContent = currentDest.eco_guidelines;
  }
}

// Media dataset generator for visual documentation
function setupMediaList() {
  const cat = currentDest.category;
  const name = currentDest.name;

  // Curated high-res visual photography Unsplash links
  const stockImages = {
    pantai: [
      { src: currentDest.photo_url, title: `Panorama Utama ${name}`, tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', title: 'Garis Pantai & Pasir Putih Alami', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80', title: 'Keindahan Biota & Terumbu Karang', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80', title: 'Pendar Matahari Terbenam Pesisir', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1200&q=80', title: 'Gradasi Air Laut Biru Zamrud', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', title: 'Cagar Konservasi Pesisir Nusantara', tag: 'image' }
    ],
    gunung: [
      { src: currentDest.photo_url, title: `Lanskap Puncak ${name}`, tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', title: 'Lautan Awan Menjelang Fajar', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', title: 'Jalur Pendakian & Savana Gunung', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80', title: 'Kawah Vulkanik & Mineral Alami', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80', title: 'Hutan Tropis Basah Lereng Gunung', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80', title: 'Puncak Tertinggi Menembus Kabut', tag: 'image' }
    ],
    budaya: [
      { src: currentDest.photo_url, title: `Kemegahan Arsitektur ${name}`, tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1200&q=80', title: 'Stupa Berundak & Relief Kuno', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80', title: 'Pancaran Sinar Fajar Cagar Budaya', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1609137144822-0a259c735d1a?auto=format&fit=crop&w=1200&q=80', title: 'Pelataran Suci & Warisan Leluhur', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80', title: 'Upacara Tradisi & Adat Nusantara', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1200&q=80', title: 'Detail Pahat Batu Relief Sejarah', tag: 'image' }
    ],
    taman_nasional: [
      { src: currentDest.photo_url, title: `Kawasan Konservasi ${name}`, tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80', title: 'Savana Luas & Habitat Satwa Liar', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80', title: 'Kanopi Hutan Hujan Lindung', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80', title: 'Air Terjun Konservasi Air Bersih', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80', title: 'Ekosistem Karst & Padang Rumput', tag: 'image' },
      { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', title: 'Keasrian Alam Terlindungi Indonesia', tag: 'image' }
    ]
  };

  const selectedStock = stockImages[cat] || stockImages.pantai;
  currentMediaList = selectedStock;
}

function filterMedia(category) {
  currentCategory = category;
  document.querySelectorAll('.media-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  renderGalleryGrid();
}

function renderGalleryGrid() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  grid.innerHTML = currentMediaList.map((media, idx) => `
    <article class="gallery-card" onclick="openLightbox(${idx})">
      <img src="${media.src}" alt="${media.title}" loading="lazy" />
      <div class="gallery-card-overlay">
        <div class="gallery-card-title">${media.title}</div>
      </div>
    </article>
  `).join('');
}

// ==========================================
// PRO LIGHTBOX MODAL
// ==========================================
function openLightbox(index) {
  currentMediaIndex = index;
  const lightbox = document.getElementById('proLightbox');
  if (!lightbox) return;

  updateLightboxContent();
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('proLightbox');
  if (lightbox) lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function nextLightbox() {
  currentMediaIndex = (currentMediaIndex + 1) % currentMediaList.length;
  updateLightboxContent();
}

function prevLightbox() {
  currentMediaIndex = (currentMediaIndex - 1 + currentMediaList.length) % currentMediaList.length;
  updateLightboxContent();
}

function updateLightboxContent() {
  const media = currentMediaList[currentMediaIndex];
  if (!media) return;

  const counter = document.getElementById('lightboxCounter');
  if (counter) counter.textContent = `${currentMediaIndex + 1} / ${currentMediaList.length}`;

  const img = document.getElementById('lightboxImage');
  if (img) {
    img.src = media.src;
    img.alt = media.title;
  }

  const captionTitle = document.getElementById('lightboxCaptionTitle');
  if (captionTitle) captionTitle.textContent = media.title;

  const captionDesc = document.getElementById('lightboxCaptionDesc');
  if (captionDesc) captionDesc.textContent = `${currentDest.name} — Dokumentasi Visual NusantaraPass`;
}

function setupLightboxListeners() {
  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('proLightbox');
    if (lightbox && lightbox.classList.contains('active')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
    }
  });
}

// ==========================================
// SMART PASS (QR) & PASSPORT STAMPING
// ==========================================
function openBookingModal() {
  const modal = document.getElementById('bookingModal');
  const title = document.getElementById('bookingDestTitle');
  const price = document.getElementById('bookingDestPrice');
  const qrArea = document.getElementById('bookingQrArea');

  if (title) title.innerText = currentDest.name;
  if (price) price.innerText = `Biaya Retribusi Konservasi: Rp ${(currentDest.ticket_price || 20000).toLocaleString('id-ID')} / orang`;
  if (qrArea) qrArea.style.display = 'none';

  if (modal) modal.classList.add('active');
}

function closeBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.classList.remove('active');
}

function generateDigitalPass() {
  const nameInput = document.getElementById('visitorNameInput');
  const emailInput = document.getElementById('visitorEmailInput');
  const qrArea = document.getElementById('bookingQrArea');
  const qrCanvasBox = document.getElementById('qrcodeContainer');

  const name = (nameInput && nameInput.value.trim()) || 'Wisatawan Nusantara';
  const email = (emailInput && emailInput.value.trim()) || 'wisatawan@nusantarapass.id';
  const passToken = `NP-PASS-${currentDest.code}-${Date.now().toString().slice(-6)}`;

  qrCanvasBox.innerHTML = '';
  new QRCode(qrCanvasBox, {
    text: passToken,
    width: 160,
    height: 160,
    colorDark: '#0f172a',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });

  document.getElementById('passTokenText').innerText = 'KODE TIKET: ' + passToken;
  qrArea.style.display = 'block';

  // Automatically record stamp claim
  if (!myPassportStamps.includes(currentDest.id)) {
    myPassportStamps.push(currentDest.id);
    localStorage.setItem('np_stamps', JSON.stringify(myPassportStamps));
    updatePassportBadge();
    if (typeof confetti === 'function') {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }
  }

  // Supabase background save if configured
  if (typeof npSaveVisitorPass === 'function') {
    npSaveVisitorPass({
      code: passToken,
      destinationId: currentDest.id,
      visitorName: name,
      visitorEmail: email,
      qrToken: passToken
    }).catch(e => console.warn('Supabase pass background save:', e));
  }
}

function updatePassportBadge() {
  const badge = document.getElementById('passportBadgeCount');
  if (badge) badge.innerText = myPassportStamps.length;
}

// Passport modal & PDF download
function openPassportModal() {
  const modal = document.getElementById('passportModal');
  const listEl = document.getElementById('passportStampsList');

  if (listEl) {
    if (myPassportStamps.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; color: #64748b; padding: 24px;">
          <p style="font-weight: 700; color: #0f172a;">Belum ada stempel destinasi yang dikoleksi.</p>
          <small style="color: #94a3b8;">Pesan NusantaraPass di halaman ini untuk membuka stempel resmi Anda!</small>
        </div>
      `;
    } else {
      listEl.innerHTML = myPassportStamps.map(id => {
        const d = (typeof NUSANTARA_DESTINATIONS !== 'undefined')
          ? NUSANTARA_DESTINATIONS.find(dest => dest.id === id)
          : null;
        if (!d) return '';
        return `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 6px rgba(15,23,42,0.04);">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 20px;">
              ${d.stamp_icon || '🧭'}
            </div>
            <div style="flex: 1;">
              <h4 style="font-size: 13px; font-weight: 800; color: #0f172a;">${d.name}</h4>
              <div style="font-size: 11px; color: #64748b;">${d.province} • Terverifikasi</div>
            </div>
            <span style="font-size: 10px; font-weight: 800; color: #059669; background: #d1fae5; padding: 4px 8px; border-radius: 6px;">
              CAP RESMI
            </span>
          </div>
        `;
      }).join('');
    }
  }

  if (modal) modal.classList.add('active');
}

function closePassportModal() {
  const modal = document.getElementById('passportModal');
  if (modal) modal.classList.remove('active');
}

function downloadPassportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Cover Page
  doc.setFillColor(15, 60, 35);
  doc.rect(0, 0, 148, 210, 'F');

  doc.setTextColor(212, 175, 55);
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.text('REPUBLIK INDONESIA', 74, 45, { align: 'center' });

  doc.setFontSize(22);
  doc.text('PASPOR JELAJAH NUSANTARA', 74, 60, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('SISTEM PASPOR WISATA BERKELANJUTAN & PELAJAR BUDAYA', 74, 70, { align: 'center' });

  doc.setFontSize(40);
  doc.text('🇮🇩', 74, 110, { align: 'center' });

  doc.setFontSize(11);
  doc.text('NusantaraPass • UINIC 8.0 WebDev Edition', 74, 170, { align: 'center' });
  doc.text(`Tanggal Terbit: ${today}`, 74, 178, { align: 'center' });

  // Page 2: Stamps
  doc.addPage();
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 148, 210, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LEMBAR STEMPEL DESTINASI RESMI', 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Setiap stempel membuktikan kontribusi terhadap pariwisata berkelanjutan.', 14, 26);

  let y = 35;
  const stamps = myPassportStamps.length > 0 ? myPassportStamps : [currentDest.id];

  stamps.forEach((id, index) => {
    const d = (typeof NUSANTARA_DESTINATIONS !== 'undefined')
      ? NUSANTARA_DESTINATIONS.find(dest => dest.id === id)
      : null;
    if (!d) return;

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, y, 120, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${index + 1}. ${d.name}`, 20, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Wilayah: ${d.province} | Kategori: ${d.category.toUpperCase()}`, 20, y + 14);
    doc.text(`Terverifikasi Kuota Ramah Lingkungan pada: ${today}`, 20, y + 19);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text('CAP VERIFIKASI', 100, y + 13);

    y += 28;
    if (y > 180) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save(`PASPOR_NUSANTARA_${Date.now().toString().slice(-6)}.pdf`);
}

// Global modal background click
window.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
  if (e.target && e.target.classList && e.target.classList.contains('pro-lightbox')) {
    closeLightbox();
  }
});
