/**
 * NUSANTARAPASS — CORE MAP & INTERACTION SCRIPT
 * Clean White Modern Theme, Teardrop Vector SVG Markers & Mobile-First Performance
 */

let mapInstance = null;
let markersLayerGroup = null;
let currentBasemap = 'osm'; // Default to Clean Light OpenStreetMap
let currentCategoryFilter = 'all';
let currentRegionFilter = 'all';
let myPassportStamps = JSON.parse(localStorage.getItem('np_stamps') || '[]');

document.addEventListener('DOMContentLoaded', async () => {
  initMap();
  renderDestinationGrid();
  updateKPIStats();
  updatePassportCountBadge();

  // Muat data langsung dari Supabase Cloud jika tabel sudah siap
  if (typeof npFetchDestinations === 'function') {
    try {
      await npFetchDestinations();
      renderMapMarkers();
      renderDestinationGrid();
      updateKPIStats();
    } catch (err) {
      console.log('Menggunakan data fallback lokal.');
    }
  }
});

// ==========================================
// 1. MASTER SVG GENERATOR (TEARDROP LOCATION PIN)
// ==========================================
function getCategoryTeardropSvg(category) {
  let gradStart = '#10b981', gradEnd = '#047857'; // default emerald
  let innerArt = '';

  if (category === 'pantai') {
    gradStart = '#06b6d4';
    gradEnd = '#0284c7';
    innerArt = `
      <!-- Sea waves and rising sun -->
      <circle cx="32" cy="22" r="7.5" fill="#f59e0b"/>
      <path d="M16 38C20 34 24 34 28 38C32 34 36 34 40 38C43 35 45 35 48 38V41H16V38Z" fill="#0284c7"/>
      <path d="M18 33C21 30 24 30 27 33C30 30 33 30 36 33C39 30 42 30 45 33" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    `;
  } else if (category === 'gunung') {
    gradStart = '#f97316';
    gradEnd = '#e11d48';
    innerArt = `
      <!-- Twin mountain peaks with snowcaps -->
      <path d="M16 40L28 20L35 31L40 24L48 40H16Z" fill="#ea580c"/>
      <path d="M28 20L31.5 26.5L25 26.5Z" fill="#ffffff"/>
      <path d="M40 24L42.8 29.5L37.5 29.5Z" fill="#ffffff"/>
    `;
  } else if (category === 'budaya') {
    gradStart = '#f59e0b';
    gradEnd = '#d97706';
    innerArt = `
      <!-- Heritage Stupa Borobudur -->
      <path d="M31 15H33V19H31V15Z" fill="#b45309"/>
      <path d="M28 20C28 18 36 18 36 20L38 23H26L28 20Z" fill="#b45309"/>
      <path d="M23 24H41C42 24 43 25 43 26L45 31H19L21 26C21 25 22 24 23 24Z" fill="#b45309"/>
      <rect x="17" y="32" width="30" height="4" rx="1" fill="#ffffff" stroke="#b45309" stroke-width="1.2"/>
      <path d="M15 37H49V41H15V37Z" fill="#b45309"/>
      <path d="M29 37H35V41H29V37Z" fill="#ffffff"/>
    `;
  } else {
    // taman_nasional
    gradStart = '#10b981';
    gradEnd = '#047857';
    innerArt = `
      <!-- Conservation tree and flora -->
      <rect x="30" y="34" width="4" height="7" rx="1" fill="#78350f"/>
      <circle cx="32" cy="22" r="7.5" fill="#059669"/>
      <circle cx="25" cy="27" r="6.5" fill="#059669"/>
      <circle cx="39" cy="27" r="6.5" fill="#059669"/>
      <circle cx="28" cy="33" r="6" fill="#047857"/>
      <circle cx="36" cy="33" r="6" fill="#047857"/>
      <path d="M32 20C32 25 27 28 27 28" stroke="#ffffff" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.7"/>
    `;
  }

  const gradId = `pinGrad_${category}`;

  return `
    <div class="dest-teardrop-pin">
      <svg viewBox="0 0 64 82" width="44" height="56" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${gradStart}"/>
            <stop offset="100%" stop-color="${gradEnd}"/>
          </linearGradient>
          <filter id="pinShadow_${category}" x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="rgba(15, 23, 42, 0.28)"/>
          </filter>
        </defs>
        <path d="M32 2C18.2 2 7 13.2 7 27c0 18.8 25 53 25 53s25-34.2 25-53C57 13.2 45.8 2 32 2Z" 
              fill="url(#${gradId})" stroke="#ffffff" stroke-width="3.5" filter="url(#pinShadow_${category})"/>
        <circle cx="32" cy="28" r="18" fill="#ffffff"/>
        ${innerArt}
      </svg>
    </div>
  `;
}

// Helper Nama Resmi Kategori Wisata
function getCategoryDisplayName(cat) {
  if (cat === 'pantai') return 'Bahari & Pantai';
  if (cat === 'gunung') return 'Gunung & Dataran Tinggi';
  if (cat === 'budaya') return 'Cagar Budaya & Sejarah';
  if (cat === 'taman_nasional') return 'Taman Nasional & Konservasi';
  return (cat || '').replace('_', ' ');
}

// Helper SVG Icon kecil untuk UI (tanpa emoji sama sekali)
function getCategoryBadgeSvg(category) {
  if (category === 'pantai') {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><circle cx="12" cy="7" r="4"/></svg>`;
  } else if (category === 'gunung') {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`;
  } else if (category === 'budaya') {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>`;
  }
  // taman_nasional
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-7M9 15c-3 0-5-2-5-5 0-4 4-7 8-7s8 3 8 7c0 3-2 5-5 5"/></svg>`;
}

// ==========================================
// 2. LEAFLET MAP INITIALIZATION
// ==========================================
function initMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  // Initialize Map
  mapInstance = L.map('map', {
    center: [-2.5, 118.0],
    zoom: 5,
    zoomControl: false,
    tap: true,
    touchZoom: true
  });

  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  // Basemaps (OSM Clean Light default)
  const basemaps = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }),
    satellite: L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 18,
      }
    ),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; OpenStreetMap, SRTM | Style: &copy; OpenTopoMap',
      maxZoom: 17,
    }),
  };

  basemaps[currentBasemap].addTo(mapInstance);
  mapInstance._basemaps = basemaps;

  markersLayerGroup = L.layerGroup().addTo(mapInstance);

  renderMapMarkers();

  // Pastikan Leaflet mengukur viewport dengan sempurna setelah layout sidebar kiri render
  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize();
  }, 200);

  window.addEventListener('resize', () => {
    if (mapInstance) mapInstance.invalidateSize();
  });
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

// ==========================================
// 3. RENDER TEARDROP SVG MARKERS
// ==========================================
function renderMapMarkers() {
  if (!markersLayerGroup) return;
  markersLayerGroup.clearLayers();

  const filtered = NUSANTARA_DESTINATIONS.filter((d) => {
    const matchCat = currentCategoryFilter === 'all' || d.category === currentCategoryFilter;
    const matchRegion = currentRegionFilter === 'all' || d.region === currentRegionFilter;
    return matchCat && matchRegion;
  });

  filtered.forEach((dest) => {
    let catColor = '#059669';
    if (dest.category === 'pantai') catColor = '#0284c7';
    if (dest.category === 'gunung') catColor = '#ea580c';
    if (dest.category === 'budaya') catColor = '#d97706';

    const markerIcon = L.divIcon({
      className: 'dest-pin-leaflet',
      html: getCategoryTeardropSvg(dest.category),
      iconSize: [44, 56],
      iconAnchor: [22, 56],      // Ujung lancip tepat di titik GPS
      popupAnchor: [0, -56],     // Popup muncul di atas pin
    });

    const marker = L.marker([dest.latitude, dest.longitude], { icon: markerIcon });

    const quotaPercent = Math.min((dest.current_visitors / dest.daily_quota) * 100, 100);
    const quotaColor = quotaPercent > 90 ? '#ef4444' : quotaPercent > 70 ? '#f59e0b' : '#10b981';

    const popupHtml = `
      <div class="popup-card-content">
        <div class="popup-img-box">
          <img src="${dest.photo_url}" alt="${dest.name}" loading="lazy" />
          <div style="position: absolute; top: 8px; left: 8px; background: ${catColor}; color: white; font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 12px; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
            ${getCategoryBadgeSvg(dest.category)} ${getCategoryDisplayName(dest.category)}
          </div>
        </div>
        <div class="popup-info-body">
          <div class="popup-title">${dest.name}</div>
          <div class="popup-meta">${dest.province} • ${dest.region}</div>
          <div style="font-size: 11px; color: #475569; line-height: 1.4;">${dest.description}</div>
          
          <div class="popup-quota-bar">
            <div style="display: flex; justify-content: space-between; font-weight: 700; color: #0f172a;">
              <span>Daya Dukung Hari Ini:</span>
              <span style="color: ${quotaColor};">${(dest.current_visitors || 0).toLocaleString('id-ID')} / ${(dest.daily_quota || 1000).toLocaleString('id-ID')}</span>
            </div>
            <div class="quota-progress-track">
              <div class="quota-progress-fill" style="width: ${quotaPercent}%; background: ${quotaColor};"></div>
            </div>
            <div style="font-size: 10px; color: #64748b; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">Status: ${(dest.quota_status || 'tersedia').replace('_', ' ').toUpperCase()}</span>
              <span>${Math.round(quotaPercent)}% Terisi</span>
            </div>
          </div>

          <div style="font-size: 11px; color: #0284c7; background: #f0f9ff; border: 1px solid #bae6fd; padding: 5px 8px; border-radius: 6px; font-weight: 600; display: flex; align-items: center; gap: 5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            ${dest.wave_status || 'Normal (Aman)'}
          </div>

          <button class="popup-btn-pass" onclick="openPassBookingModal('${dest.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M18 12h.01M12 6v12"/></svg>
            Dapatkan Smart Pass (QR)
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, { maxWidth: 280, closeButton: false });
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

  // Fly to region coordinate smoothly
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

// ==========================================
// 4. RENDER DESTINATION GRID
// ==========================================
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

      const sisaKuota = Math.max(0, (dest.daily_quota || 1000) - (dest.current_visitors || 0));

      return `
        <div class="dest-card">
          <div class="dest-thumb-box">
            <img src="${dest.photo_url}" class="dest-thumb-img" alt="${dest.name}" loading="lazy" />
            <span class="dest-category-pill" style="background: ${catColor};">
              ${getCategoryBadgeSvg(dest.category)} ${getCategoryDisplayName(dest.category)}
            </span>
            <span class="dest-quota-pill">
              Sisa: ${sisaKuota.toLocaleString('id-ID')}
            </span>
          </div>
          <div class="dest-body">
            <div class="dest-location-text">${dest.province} • ${dest.region}</div>
            <h3>${dest.name}</h3>
            <p class="dest-desc-text">${dest.description}</p>
            
            <div style="font-size: 11px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; padding: 7px 10px; border-radius: 8px; display: flex; align-items: flex-start; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>${dest.eco_guidelines}</span>
            </div>

            <div class="dest-footer-actions">
              <span style="font-size: 14px; font-weight: 800; color: #059669;">
                Rp ${(dest.ticket_price || 20000).toLocaleString('id-ID')}
              </span>
              <div style="display: flex; gap: 6px;">
                <button class="btn-nav" onclick="zoomToDest(${dest.latitude}, ${dest.longitude})">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Peta
                </button>
                <button class="btn-nav btn-nav-primary" onclick="openPassBookingModal('${dest.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M18 12h.01M12 6v12"/></svg>
                  Pesan Pass
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
    const total = NUSANTARA_DESTINATIONS.reduce((acc, d) => acc + (d.current_visitors || 0), 0);
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
// 5. MODAL: PASS BOOKING & QR GENERATION
// ==========================================
let currentBookingDest = null;

function openPassBookingModal(destId) {
  currentBookingDest = NUSANTARA_DESTINATIONS.find((d) => d.id === destId) || NUSANTARA_DESTINATIONS[0];
  const modal = document.getElementById('bookingModal');
  const title = document.getElementById('bookingDestTitle');
  const price = document.getElementById('bookingDestPrice');
  const qrArea = document.getElementById('bookingQrArea');

  if (title) title.innerText = currentBookingDest.name;
  if (price) price.innerText = 'Biaya Retribusi Konservasi: Rp ' + (currentBookingDest.ticket_price || 20000).toLocaleString('id-ID');
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

  // Simpan data tiket dan stempel ke Supabase Cloud
  if (typeof npSaveVisitorPass === 'function') {
    npSaveVisitorPass({
      code: passToken,
      destinationId: currentBookingDest.id,
      visitorName: name,
      visitorEmail: email,
      qrToken: passToken
    }).catch(e => console.warn('Supabase pass background save:', e));
  }
  if (typeof npSaveStamp === 'function') {
    npSaveStamp(email, currentBookingDest.id, currentBookingDest.code)
      .catch(e => console.warn('Supabase stamp background save:', e));
  }
}

// ==========================================
// 6. MODAL: BUKU PASPOR JELAJAH NUSANTARA (PDF)
// ==========================================
function openPassportModal() {
  const modal = document.getElementById('passportModal');
  const listEl = document.getElementById('passportStampsList');

  if (listEl) {
    if (myPassportStamps.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; color: #64748b; padding: 24px;">
          <div style="margin-bottom: 8px; color: #94a3b8;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="2" width="18" height="20" rx="3"/><circle cx="12" cy="10" r="3"/><path d="M7 17h10"/></svg></div>
          <p style="font-weight: 700; color: #0f172a;">Belum ada stempel destinasi yang dikoleksi.</p>
          <small style="color: #94a3b8;">Pesan NusantaraPass di salah satu destinasi untuk membuka stempel resmi Anda!</small>
        </div>
      `;
    } else {
      listEl.innerHTML = myPassportStamps
        .map((id) => {
          const d = NUSANTARA_DESTINATIONS.find((dest) => dest.id === id);
          if (!d) return '';
          return `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 6px rgba(15,23,42,0.04);">
              <div style="width: 44px; height: 44px; border-radius: 10px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${getCategoryBadgeSvg(d.category)}
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
// 7. MODAL: API SANDBOX
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
  }, 250);
}
