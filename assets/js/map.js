/**
 * NUSANTARAPASS — CORE MAP & INTERACTION SCRIPT
 */

let mapInstance = null;
let markersLayerGroup = null;
let currentBasemap = 'satellite';
let currentCategoryFilter = 'all';
let currentRegionFilter = 'all';
let myPassportStamps = JSON.parse(localStorage.getItem('np_stamps') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  renderDestinationGrid();
  updateKPIStats();
  updatePassportCountBadge();
});

function initMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  // Initialize Map
  mapInstance = L.map('map', {
    center: [-2.5, 118.0],
    zoom: 5,
    zoomControl: false,
  });

  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  // Basemaps
  const basemaps = {
    satellite: L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 18,
      }
    ),
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; OpenStreetMap, SRTM | Style: &copy; OpenTopoMap',
      maxZoom: 17,
    }),
  };

  basemaps[currentBasemap].addTo(mapInstance);
  mapInstance._basemaps = basemaps;

  markersLayerGroup = L.layerGroup().addTo(mapInstance);

  renderMapMarkers();
}

function switchBasemap(type) {
  currentBasemap = type;
  if (!mapInstance || !mapInstance._basemaps) return;

  Object.values(mapInstance._basemaps).forEach((layer) => {
    if (mapInstance.hasLayer(layer)) mapInstance.removeLayer(layer);
  });

  mapInstance._basemaps[type].addTo(mapInstance);

  document.querySelectorAll('.basemap-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.basemap === type);
  });
}

function renderMapMarkers() {
  if (!markersLayerGroup) return;
  markersLayerGroup.clearLayers();

  const filtered = NUSANTARA_DESTINATIONS.filter((d) => {
    const matchCat = currentCategoryFilter === 'all' || d.category === currentCategoryFilter;
    const matchRegion = currentRegionFilter === 'all' || d.region === currentRegionFilter;
    return matchCat && matchRegion;
  });

  filtered.forEach((dest) => {
    let color = '#10b981'; // default emerald
    let pulseColor = 'rgba(16, 185, 129, 0.4)';

    if (dest.category === 'pantai') {
      color = '#06b6d4';
      pulseColor = 'rgba(6, 182, 212, 0.4)';
    } else if (dest.category === 'gunung') {
      color = '#f97316';
      pulseColor = 'rgba(249, 115, 22, 0.4)';
    } else if (dest.category === 'budaya') {
      color = '#d97706';
      pulseColor = 'rgba(217, 119, 6, 0.4)';
    }

    const iconHtml = `
      <div class="custom-dest-marker">
        <div class="marker-pulse" style="background: ${pulseColor};"></div>
        <div class="marker-pin-box" style="background: ${color};">
          ${dest.stamp_icon}
        </div>
      </div>
    `;

    const markerIcon = L.divIcon({
      className: 'dest-div-icon',
      html: iconHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([dest.latitude, dest.longitude], { icon: markerIcon });

    const quotaPercent = Math.min((dest.current_visitors / dest.daily_quota) * 100, 100);
    const quotaColor = quotaPercent > 90 ? '#ef4444' : quotaPercent > 70 ? '#f59e0b' : '#10b981';

    const popupHtml = `
      <div class="popup-card-content">
        <div class="popup-img-box">
          <img src="${dest.photo_url}" alt="${dest.name}" />
          <div style="position: absolute; top: 8px; left: 8px; background: ${color}; color: white; font-size: 9px; font-weight: bold; padding: 2px 8px; border-radius: 12px; text-transform: uppercase;">
            ${dest.category.replace('_', ' ')}
          </div>
        </div>
        <div class="popup-info-body">
          <div class="popup-title">${dest.name}</div>
          <div class="popup-meta">${dest.province} • ${dest.region}</div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.3;">${dest.description}</div>
          
          <div class="popup-quota-bar">
            <div style="display: flex; justify-content: space-between; font-weight: 600;">
              <span>Kapasitas Hari Ini:</span>
              <span style="color: ${quotaColor};">${dest.current_visitors} / ${dest.daily_quota} Wisatawan</span>
            </div>
            <div class="quota-progress-track">
              <div class="quota-progress-fill" style="width: ${quotaPercent}%; background: ${quotaColor};"></div>
            </div>
            <div style="font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
              <span>Status: ${dest.quota_status.replace('_', ' ').toUpperCase()}</span>
              <span>${Math.round(quotaPercent)}% Terisi</span>
            </div>
          </div>

          <div style="font-size: 11px; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 4px 8px; border-radius: 6px;">
            ℹ️ ${dest.wave_status}
          </div>

          <button class="popup-btn-pass" onclick="openPassBookingModal('${dest.id}')">
            🎫 Dapatkan Smart Pass (QR) &rarr;
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    marker.addTo(markersLayerGroup);
  });
}

function filterCategory(cat, el) {
  currentCategoryFilter = cat;
  document.querySelectorAll('.cat-pill').forEach((btn) => btn.classList.remove('active'));
  if (el) el.classList.add('active');
  renderMapMarkers();
  renderDestinationGrid();
}

function filterRegion(reg, el) {
  currentRegionFilter = reg;
  document.querySelectorAll('.region-pill').forEach((btn) => btn.classList.remove('active'));
  if (el) el.classList.add('active');

  // Fly to region coordinate
  if (mapInstance) {
    if (reg === 'all') mapInstance.flyTo([-2.5, 118.0], 5, { duration: 1.2 });
    else if (reg === 'Jawa') mapInstance.flyTo([-7.5, 110.0], 7, { duration: 1.2 });
    else if (reg === 'Sumatera') mapInstance.flyTo([0.5, 101.5], 6, { duration: 1.2 });
    else if (reg === 'Bali-Nusra') mapInstance.flyTo([-8.5, 117.5], 7, { duration: 1.2 });
    else if (reg === 'Sulawesi') mapInstance.flyTo([-2.0, 121.0], 6, { duration: 1.2 });
    else if (reg === 'Papua') mapInstance.flyTo([-3.0, 136.0], 6, { duration: 1.2 });
  }

  renderMapMarkers();
  renderDestinationGrid();
}

function renderDestinationGrid() {
  const grid = document.getElementById('destinationsGrid');
  if (!grid) return;

  const filtered = NUSANTARA_DESTINATIONS.filter((d) => {
    const matchCat = currentCategoryFilter === 'all' || d.category === currentCategoryFilter;
    const matchRegion = currentRegionFilter === 'all' || d.region === currentRegionFilter;
    return matchCat && matchRegion;
  });

  grid.innerHTML = filtered
    .map((dest) => {
      let catColor = '#059669';
      if (dest.category === 'pantai') catColor = '#0284c7';
      if (dest.category === 'gunung') catColor = '#ea580c';
      if (dest.category === 'budaya') catColor = '#d97706';

      const isClaimed = myPassportStamps.includes(dest.id);

      return `
        <div class="dest-card">
          <div class="dest-thumb-box">
            <img src="${dest.photo_url}" class="dest-thumb-img" alt="${dest.name}" />
            <span class="dest-category-pill" style="background: ${catColor};">
              ${dest.category.replace('_', ' ')}
            </span>
            <span class="dest-quota-pill">
              Kuota: ${dest.daily_quota - dest.current_visitors} Sisa
            </span>
          </div>
          <div class="dest-body">
            <div class="dest-location-text">${dest.province} • ${dest.region}</div>
            <h3>${dest.name}</h3>
            <p class="dest-desc-text">${dest.description}</p>
            
            <div style="font-size: 11px; color: #94a3b8; background: rgba(255,255,255,0.04); padding: 6px 10px; border-radius: 8px;">
              🛡️ ${dest.eco_guidelines}
            </div>

            <div class="dest-footer-actions">
              <span style="font-size: 13px; font-weight: 800; color: #34d399;">
                Rp ${dest.ticket_price.toLocaleString('id-ID')}
              </span>
              <div style="display: flex; gap: 6px;">
                <button class="btn-nav" onclick="zoomToDest(${dest.latitude}, ${dest.longitude})">
                  📍 Lihat Peta
                </button>
                <button class="btn-nav btn-nav-primary" onclick="openPassBookingModal('${dest.id}')">
                  🎫 Pesan Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function zoomToDest(lat, lng) {
  if (mapInstance) {
    mapInstance.flyTo([lat, lng], 12, { duration: 1.5 });
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }
}

function updateKPIStats() {
  const totalDestEl = document.getElementById('kpiTotalDest');
  const totalVisitorsEl = document.getElementById('kpiTotalVisitors');
  const safeEcoEl = document.getElementById('kpiEcoSafe');

  if (totalDestEl) totalDestEl.innerText = NUSANTARA_DESTINATIONS.length + ' Destinasi';
  if (totalVisitorsEl) {
    const total = NUSANTARA_DESTINATIONS.reduce((acc, d) => acc + d.current_visitors, 0);
    totalVisitorsEl.innerText = total.toLocaleString('id-ID') + ' Jiwa';
  }
  if (safeEcoEl) safeEcoEl.innerText = '94.8% Terkendali';
}

function updatePassportCountBadge() {
  const badge = document.getElementById('passportBadgeCount');
  if (badge) {
    badge.innerText = myPassportStamps.length;
  }
}

// ==========================================
// MODAL: PASS BOOKING & QR GENERATION
// ==========================================
let currentBookingDest = null;

function openPassBookingModal(destId) {
  currentBookingDest = NUSANTARA_DESTINATIONS.find((d) => d.id === destId) || NUSANTARA_DESTINATIONS[0];
  const modal = document.getElementById('bookingModal');
  const title = document.getElementById('bookingDestTitle');
  const price = document.getElementById('bookingDestPrice');
  const qrArea = document.getElementById('bookingQrArea');

  if (title) title.innerText = currentBookingDest.name;
  if (price) price.innerText = 'Biaya Retribusi Konservasi: Rp ' + currentBookingDest.ticket_price.toLocaleString('id-ID');
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

  const name = nameInput.value.trim() || 'Wisatawan Nusantara';
  const email = emailInput.value.trim() || 'wisatawan@nusantarapass.id';

  const passToken = `NP-PASS-${currentBookingDest.code}-${Date.now().toString().slice(-6)}`;

  // Generate QR Code via QRCode lib
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
  if (!myPassportStamps.includes(currentBookingDest.id)) {
    myPassportStamps.push(currentBookingDest.id);
    localStorage.setItem('np_stamps', JSON.stringify(myPassportStamps));
    updatePassportCountBadge();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  }
}

// ==========================================
// MODAL: BUKU PASPOR JELAJAH NUSANTARA (PDF)
// ==========================================
function openPassportModal() {
  const modal = document.getElementById('passportModal');
  const listEl = document.getElementById('passportStampsList');

  if (listEl) {
    if (myPassportStamps.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; color: #94a3b8; padding: 20px;">
          <p>Belum ada stempel destinasi yang dikoleksi.</p>
          <small>Pesan NusantaraPass di salah satu destinasi untuk membuka stempel pertama Anda!</small>
        </div>
      `;
    } else {
      listEl.innerHTML = myPassportStamps
        .map((id) => {
          const d = NUSANTARA_DESTINATIONS.find((dest) => dest.id === id);
          if (!d) return '';
          return `
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 12px;">
              <div style="font-size: 28px; background: rgba(5,150,105,0.2); width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                ${d.stamp_icon}
              </div>
              <div style="flex: 1;">
                <h4 style="font-size: 13px; font-weight: bold; color: white;">${d.name}</h4>
                <div style="font-size: 11px; color: #94a3b8;">${d.province} • Terverifikasi</div>
              </div>
              <span style="font-size: 11px; font-weight: bold; color: #10b981; background: rgba(16,185,129,0.1); padding: 4px 8px; border-radius: 6px;">
                CAP RESMI
              </span>
            </div>
          `;
        })
        .join('');
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
    format: 'a5', // Passport booklet size standard
  });

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Cover Page
  doc.setFillColor(15, 60, 35); // Islamic Green / Garuda Heritage Green
  doc.rect(0, 0, 148, 210, 'F');

  doc.setTextColor(212, 175, 55); // Gold
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

  // Page 2: Identity & Stamps
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
  const stamps = myPassportStamps.length > 0 ? myPassportStamps : ['dest-pgr-01', 'dest-bbd-11', 'dest-ppd-06'];

  stamps.forEach((id, index) => {
    const d = NUSANTARA_DESTINATIONS.find((dest) => dest.id === id);
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

  // Footer Certificate Text
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen Paspor Digital resmi di-generate oleh sistem NusantaraPass.', 14, 202);

  doc.save(`PASPOR_NUSANTARA_${Date.now().toString().slice(-6)}.pdf`);
}

// ==========================================
// MODAL: API SANDBOX
// ==========================================
function openApiModal() {
  const modal = document.getElementById('apiModal');
  if (modal) modal.classList.add('active');
}

function closeApiModal() {
  const modal = document.getElementById('apiModal');
  if (modal) modal.classList.remove('active');
}

function testApiEndpoint(category) {
  const consoleEl = document.getElementById('apiConsoleOutput');
  if (!consoleEl) return;

  consoleEl.innerText = 'Menghubungi endpoint /api/v1/destinations...';

  setTimeout(() => {
    let result = NUSANTARA_DESTINATIONS;
    if (category && category !== 'all') {
      result = NUSANTARA_DESTINATIONS.filter((d) => d.category === category);
    }

    const payload = {
      status: 'success',
      code: 200,
      protocol: 'OpenAPI 3.0',
      total_count: result.length,
      filter: { category: category || 'all' },
      data: result.map((d) => ({
        code: d.code,
        name: d.name,
        category: d.category,
        province: d.province,
        daily_quota: d.daily_quota,
        current_visitors: d.current_visitors,
        quota_status: d.quota_status,
        wave_or_weather: d.wave_status,
      })),
    };

    consoleEl.innerText = JSON.stringify(payload, null, 2);
  }, 300);
}
