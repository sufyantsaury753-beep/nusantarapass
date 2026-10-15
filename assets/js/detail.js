/**
 * NUSANTARAPASS — BESPOKE DESTINATION GEOPORTAL SCRIPT
 * Engineered for UINIC 8.0: SDG 11 & SDG 8.9 Compliance, Carrying Capacity & Smart Pass QR
 */

let currentDest = null;
let currentMediaList = [];
let myPassportStamps = JSON.parse(localStorage.getItem('np_stamps') || '[]');

function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name) || urlParams.get('id') || urlParams.get('dest');
}

document.addEventListener('DOMContentLoaded', () => {
  initGeoportalDetail();
  updatePassportBadge();
});

function initGeoportalDetail() {
  const requestedId = getUrlParameter('id') || 'dest-pgr-01';

  // Find destination in dataset
  currentDest = (typeof NUSANTARA_DESTINATIONS !== 'undefined')
    ? NUSANTARA_DESTINATIONS.find(d => d.id === requestedId)
    : null;

  if (!currentDest && typeof NUSANTARA_DESTINATIONS !== 'undefined') {
    currentDest = NUSANTARA_DESTINATIONS[0];
  }

  if (!currentDest) return;

  // Merge local overrides from Admin CMS if any
  try {
    const rawOverrides = localStorage.getItem('np_destinations_override');
    if (rawOverrides) {
      const overrides = JSON.parse(rawOverrides);
      if (overrides[currentDest.id]) {
        Object.assign(currentDest, overrides[currentDest.id]);
      }
    }
  } catch (e) {
    console.warn('Failed reading overrides', e);
  }

  document.title = `${currentDest.name} — Geoportal Pelestarian NusantaraPass`;

  renderHeroHUD();
  renderNarrativeContent();
  renderSDGConservationRules();
  renderTelemetryKiosk();
  renderVisualDocsGrid();
}

// 1. Render Hero HUD Showcase
function renderHeroHUD() {
  const breadcrumbEl = document.getElementById('crumbDestName');
  if (breadcrumbEl) breadcrumbEl.textContent = currentDest.name;

  const bgImg = document.getElementById('heroShowcaseBg');
  if (bgImg) {
    bgImg.src = currentDest.photo_url;
    bgImg.alt = currentDest.name;
  }

  const categoryPill = document.getElementById('hudCategoryPill');
  if (categoryPill) {
    categoryPill.innerHTML = `${getCategoryBadgeSvg(currentDest.category)} <span>${getCategoryDisplayName(currentDest.category)}</span>`;
  }

  const codePill = document.getElementById('hudCodePill');
  if (codePill) {
    codePill.textContent = currentDest.code;
  }

  const titleEl = document.getElementById('heroDestTitle');
  if (titleEl) titleEl.textContent = currentDest.name;

  const metaEl = document.getElementById('heroDestMeta');
  if (metaEl) {
    const elevText = currentDest.elevation_m > 50 
      ? `Elevasi ${currentDest.elevation_m.toLocaleString('id-ID')} Mdpl`
      : `Elevasi ${currentDest.elevation_m} Mdpl (Pesisir)`;
    metaEl.innerHTML = `
      <span>${currentDest.province}</span>
      <span class="meta-sep">&bull;</span>
      <span>Wilayah ${currentDest.region}</span>
      <span class="meta-sep">&bull;</span>
      <span>${elevText}</span>
      <span class="meta-sep">&bull;</span>
      <span>GPS: [${currentDest.latitude}, ${currentDest.longitude}]</span>
    `;
  }
}

// 2. Render Left Column: Narrative & Heritage Significance
function renderNarrativeContent() {
  const narrativeEl = document.getElementById('narrativeBodyText');
  if (narrativeEl) {
    narrativeEl.innerHTML = `
      <p style="margin-bottom: 12px;">${currentDest.description}</p>
      <p style="color: #475569; font-size: 13.5px;">
        Kawasan ini telah tercatat dalam sistem pangkalan data nasional <b>NusantaraPass</b> sebagai salah satu objek wisata cagar alam dan budaya prioritas. Pengendalian daya dukung lingkungan (<i>carrying capacity</i>) diberlakukan secara ketat guna menjaga kelestarian ekosistem dan batuan situs bersejarah dari ancaman kerusakan akibat lonjakan wisatawan tanpa kendali.
      </p>
    `;
  }
}

// 3. Render Conservation & Tourism Guidelines (Swiss Clean Grid)
function renderSDGConservationRules() {
  const rulesGrid = document.getElementById('sdgRulesGrid');
  if (!rulesGrid) return;

  const cat = currentDest.category;
  let specificRule = 'Patuhi batas jalur aman dan dilarang menyalakan api unggun sembarangan.';
  if (cat === 'pantai') specificRule = 'Gunakan tabir surya ramah terumbu karang (reef-safe) dan dilarang menginjak karang hidup.';
  if (cat === 'budaya') specificRule = 'Dilarang memanjat, mencoret, atau menyentuh batuan cagar budaya bernilai sejarah.';
  if (cat === 'taman_nasional') specificRule = 'Jaga jarak aman dari satwa liar yang dilindungi dan dilarang memberi makanan sembarangan.';

  rulesGrid.innerHTML = `
    <div class="guideline-item">
      <span class="guideline-index">01</span>
      <div class="guideline-body">
        <h4>Daya Dukung Lingkungan</h4>
        <p>Batas kuota harian maksimum ${currentDest.daily_quota.toLocaleString('id-ID')} pengunjung untuk mencegah degradasi kawasan.</p>
      </div>
    </div>

    <div class="guideline-item">
      <span class="guideline-index">02</span>
      <div class="guideline-body">
        <h4>Pengelolaan Sampah</h4>
        <p>Wajib membawa kembali seluruh sampah anorganik dan dianjurkan menggunakan wadah guna ulang.</p>
      </div>
    </div>

    <div class="guideline-item">
      <span class="guideline-index">03</span>
      <div class="guideline-body">
        <h4>Zona Perlindungan</h4>
        <p>${specificRule}</p>
      </div>
    </div>

    <div class="guideline-item">
      <span class="guideline-index">04</span>
      <div class="guideline-body">
        <h4>Retribusi Konservasi</h4>
        <p>Retribusi tiket disalurkan langsung untuk program konservasi habitat dan pemeliharaan cagar alam-budaya.</p>
      </div>
    </div>
  `;
}

// 4. Render Right Column: Telemetry Barometer & Kiosk
function renderTelemetryKiosk() {
  const quotaPercent = Math.min((currentDest.current_visitors / currentDest.daily_quota) * 100, 100);
  const quotaRemaining = Math.max(0, currentDest.daily_quota - currentDest.current_visitors);

  let statusClass = 'aman';
  let statusLabel = 'Terkendali';
  if (quotaPercent > 85) {
    statusClass = 'penuh';
    statusLabel = 'Kapasitas Penuh';
  } else if (quotaPercent > 65) {
    statusClass = 'waspada';
    statusLabel = 'Mendekati Batas';
  }

  const statusBadge = document.getElementById('kioskStatusBadge');
  if (statusBadge) {
    statusBadge.className = `status-badge-chip ${statusClass}`;
    statusBadge.textContent = statusLabel;
  }

  const maxQuotaEl = document.getElementById('metricMaxQuota');
  if (maxQuotaEl) maxQuotaEl.textContent = (currentDest.daily_quota || 1000).toLocaleString('id-ID');

  const activeVisitorsEl = document.getElementById('metricActiveVisitors');
  if (activeVisitorsEl) activeVisitorsEl.textContent = (currentDest.current_visitors || 0).toLocaleString('id-ID');

  const remainingEl = document.getElementById('metricRemainingQuota');
  if (remainingEl) remainingEl.textContent = quotaRemaining.toLocaleString('id-ID');

  const progressBar = document.getElementById('capacityProgressBar');
  if (progressBar) {
    progressBar.style.width = `${quotaPercent}%`;
    progressBar.style.background = statusClass === 'penuh' ? '#b91c1c' : statusClass === 'waspada' ? '#b45309' : '#0f172a';
  }

  const progressPercentText = document.getElementById('capacityPercentText');
  if (progressPercentText) {
    progressPercentText.textContent = `${Math.round(quotaPercent)}% Terisi dari Kapasitas`;
  }

  // Weather / Marine Status
  const envStatusText = document.getElementById('envStatusText');
  if (envStatusText) {
    envStatusText.textContent = currentDest.wave_status || 'Normal & Kondusif';
  }

  // Ticket Price
  const priceVal = document.getElementById('kioskTicketPrice');
  if (priceVal) {
    priceVal.textContent = `Rp ${(currentDest.ticket_price || 20000).toLocaleString('id-ID')}`;
  }

  // Stamp Seal Name
  const stampName = document.getElementById('stampSealName');
  if (stampName) {
    stampName.textContent = currentDest.name;
  }
}

// 5. Render Visual Documentation Grid
function renderVisualDocsGrid() {
  const grid = document.getElementById('visualDocsGrid');
  if (!grid) return;

  const cat = currentDest.category;
  const name = currentDest.name;

  const photoCollections = {
    pantai: [
      { url: currentDest.photo_url, caption: `Pemandangan Pesisir ${name}` },
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', caption: 'Hamparan Pasir & Sempadan Pantai' },
      { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', caption: 'Ekosistem Karang Laut Bersih' },
      { url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', caption: 'Lanskap Senja Pesisir Samudra' },
      { url: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=800&q=80', caption: 'Gradasi Air Laut Biru Zamrud' },
      { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', caption: 'Zona Perlindungan Biota Laut' }
    ],
    gunung: [
      { url: currentDest.photo_url, caption: `Lanskap Puncak ${name}` },
      { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', caption: 'Lautan Kabut di Ketinggian' },
      { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', caption: 'Savana Edelweiss & Jalur Trekking' },
      { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80', caption: 'Kawah Belerang & Batuan Vulkanik' },
      { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', caption: 'Hutan Hujan Sub-Montana' },
      { url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=800&q=80', caption: 'Puncak Tertinggi Menembus Awan' }
    ],
    budaya: [
      { url: currentDest.photo_url, caption: `Arsitektur Bersejarah ${name}` },
      { url: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80', caption: 'Pahatan Relief & Stupa Kuno' },
      { url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', caption: 'Pancaran Cahaya Fajar di Situs' },
      { url: 'https://images.unsplash.com/photo-1609137144822-0a259c735d1a?auto=format&fit=crop&w=800&q=80', caption: 'Pelataran Suci Cagar Budaya' },
      { url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80', caption: 'Kearifan Tradisi & Ritual Luhur' },
      { url: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80', caption: 'Preservasi Nilai Arkeologi Dunia' }
    ],
    taman_nasional: [
      { url: currentDest.photo_url, caption: `Kawasan Konservasi ${name}` },
      { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', caption: 'Padang Rumput & Satwa Terlindungi' },
      { url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80', caption: 'Kanopi Hutan Konservasi Rimbun' },
      { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', caption: 'Daerah Aliran Sungai Sumber Air' },
      { url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80', caption: 'Keanekaragaman Hayati Tropis' },
      { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80', caption: 'Zona Inti Lindung Cagar Alam' }
    ]
  };

  let customGallery = null;
  try {
    const gJson = localStorage.getItem('np_gallery_' + currentDest.id);
    if (gJson) customGallery = JSON.parse(gJson);
  } catch(e) {}

  if (customGallery && customGallery.length > 0) {
    currentMediaList = customGallery;
  } else {
    currentMediaList = photoCollections[cat] || photoCollections.pantai;
    if (currentMediaList.length > 0 && currentDest.photo_url) {
      currentMediaList[0] = { url: currentDest.photo_url, caption: `Lanskap Utama ${name}` };
    }
  }

  grid.innerHTML = currentMediaList.map((item, idx) => `
    <div class="doc-photo-card" onclick="openImageViewer(${idx})">
      <img src="${item.url}" alt="${item.caption}" loading="lazy" />
      <div class="doc-photo-overlay">
        <span>${item.caption}</span>
      </div>
    </div>
  `).join('');
}

// 6. Clean Image Viewer Modal
function openImageViewer(idx) {
  const item = currentMediaList[idx];
  if (!item) return;

  const viewer = document.getElementById('cleanImageViewer');
  const imgEl = document.getElementById('viewerImg');
  const captionEl = document.getElementById('viewerCaption');

  if (imgEl) imgEl.src = item.url;
  if (captionEl) captionEl.textContent = `${item.caption} — ${currentDest.name}`;

  if (viewer) viewer.classList.add('active');
}

function closeImageViewer() {
  const viewer = document.getElementById('cleanImageViewer');
  if (viewer) viewer.classList.remove('active');
}

// 7. Direct Smart Pass (QR) Issuance
function issueDirectPass() {
  const nameInput = document.getElementById('kioskVisitorName');
  const emailInput = document.getElementById('kioskVisitorEmail');
  const passBox = document.getElementById('kioskPassResultBox');
  const qrContainer = document.getElementById('kioskQrCodeContainer');
  const tokenText = document.getElementById('kioskPassTokenText');

  const name = (nameInput && nameInput.value.trim()) || 'Wisatawan Nusantara';
  const email = (emailInput && emailInput.value.trim()) || 'wisatawan@nusantarapass.id';
  const passToken = `NP-PASS-${currentDest.code}-${Date.now().toString().slice(-6)}`;

  if (qrContainer) {
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: passToken,
      width: 150,
      height: 150,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
  }

  if (tokenText) tokenText.textContent = `TOKEN: ${passToken}`;
  if (passBox) passBox.style.display = 'block';

  // Automatically record stamp claim
  if (!myPassportStamps.includes(currentDest.id)) {
    myPassportStamps.push(currentDest.id);
    localStorage.setItem('np_stamps', JSON.stringify(myPassportStamps));
    updatePassportBadge();
    if (typeof confetti === 'function') {
      confetti({ particleCount: 60, spread: 65, origin: { y: 0.6 } });
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

// 8. Passport Booklet Modal & PDF Download
function openPassportModal() {
  const modal = document.getElementById('passportModal');
  const listEl = document.getElementById('passportStampsList');

  if (listEl) {
    if (myPassportStamps.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; color: #64748b; padding: 24px;">
          <p style="font-weight: 700; color: #0f172a;">Belum ada stempel destinasi yang dikoleksi.</p>
          <small style="color: #94a3b8;">Terbitkan tiket Smart Pass di halaman ini untuk membuka stempel resmi Anda!</small>
        </div>
      `;
    } else {
      listEl.innerHTML = myPassportStamps.map(id => {
        const d = (typeof NUSANTARA_DESTINATIONS !== 'undefined')
          ? NUSANTARA_DESTINATIONS.find(dest => dest.id === id)
          : null;
        if (!d) return '';
        return `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px;">
              ${d.stamp_icon || '🧭'}
            </div>
            <div style="flex: 1;">
              <h4 style="font-size: 13px; font-weight: 700; color: #0f172a;">${d.name}</h4>
              <div style="font-size: 11px; color: #64748b;">${d.province}</div>
            </div>
            <span style="font-size: 10.5px; font-weight: 700; color: #059669; background: #ecfdf5; padding: 3px 8px; border-radius: 6px;">
              Terkoleksi
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

// Helpers
function getCategoryDisplayName(cat) {
  if (cat === 'pantai') return 'Bahari & Pantai';
  if (cat === 'gunung') return 'Gunung & Dataran Tinggi';
  if (cat === 'budaya') return 'Cagar Budaya & Sejarah';
  if (cat === 'taman_nasional' || cat === 'konservasi') return 'Taman Nasional & Konservasi';
  return (cat || '').replace('_', ' ');
}

function getCategoryBadgeSvg(cat) {
  if (cat === 'pantai') return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.2"><path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><circle cx="12" cy="7" r="4"/></svg>`;
  if (cat === 'gunung') return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.2"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`;
  if (cat === 'budaya') return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>`;
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2"><path d="M12 22v-7M9 15c-3 0-5-2-5-5 0-4 4-7 8-7s8 3 8 7c0 3-2 5-5 5"/></svg>`;
}

// Global modal backdrop close
window.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
  if (e.target && e.target.classList && e.target.classList.contains('clean-image-viewer')) {
    closeImageViewer();
  }
});
