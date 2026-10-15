/**
 * NUSANTARAPASS — CORE MAP & INTERACTION SCRIPT
 * Clean White Modern Theme, Teardrop Vector SVG Markers & Mobile-First Performance
 */

let mapInstance = null;
let markersLayerGroup = null;
let destinationMarkers = {};
let currentBasemap = 'osm'; // Default to Clean Light OpenStreetMap
let currentCategoryFilter = 'all';
let currentRegionFilter = 'all';
let openRegionKeys = new Set(['Jawa']); // Default open Jawa in hierarchy tree
let selectedDestId = null;
let myPassportStamps = JSON.parse(localStorage.getItem('np_stamps') || '[]');

document.addEventListener('DOMContentLoaded', async () => {
  initMap();
  renderDestinationGrid();
  updateKPIStats();
  initRegionHierarchy();
  updatePassportCountBadge();

  // Muat data langsung dari Supabase Cloud jika tabel sudah siap
  if (typeof npFetchDestinations === 'function') {
    try {
      await npFetchDestinations();
      renderMapMarkers();
      renderDestinationGrid();
      updateKPIStats();
      initRegionHierarchy();
    } catch (err) {
      console.log('Menggunakan data fallback lokal.');
    }
  }
});

// ==========================================
// 1. MASTER SVG GENERATOR (MODERN PRECISION TEARDROP PIN)
// 2026 Travel-Tech & GIS Standard (30x38px, High-Contrast White Pictograms)
// ==========================================
function getCategoryTeardropSvg(category) {
  let pinColor = '#059669'; // default Forest Emerald
  let glyph = '';

  if (category === 'pantai') {
    pinColor = '#0284c7'; // Deep Sky / Ocean Blue
    glyph = `
      <!-- Precision Sea Wave & Horizon -->
      <path d="M9 13.5c1.8-1 3.6-1 5.4 0s3.6 1 5.4 0" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M9 17c1.8-1 3.6-1 5.4 0s3.6 1 5.4 0" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <circle cx="14.5" cy="8.5" r="2.2" fill="#ffffff"/>
    `;
  } else if (category === 'gunung') {
    pinColor = '#ea580c'; // Warm Terracotta Mountain
    glyph = `
      <!-- Minimalist Twin Peaks -->
      <path d="M8.5 18L14 8.5L18 15.5L20 12.5L24 18H8.5Z" fill="#ffffff"/>
    `;
  } else if (category === 'budaya') {
    pinColor = '#d97706'; // Ancient Ochre / Heritage Stupa
    glyph = `
      <!-- Heritage Stupa Architectural Silhouette -->
      <rect x="14" y="6" width="1.8" height="2.5" rx="0.5" fill="#ffffff"/>
      <path d="M12.5 9h5c.6 0 1 .5 1 1.2L19.5 13H10.5l1-2.8c0-.7.4-1.2 1-1.2Z" fill="#ffffff"/>
      <rect x="9.5" y="14" width="11" height="1.8" rx="0.5" fill="#ffffff"/>
      <path d="M8 16.5h14v2H8z" fill="#ffffff"/>
    `;
  } else {
    // taman_nasional & konservasi
    pinColor = '#059669'; // Pine Forest Green
    glyph = `
      <!-- Minimalist Conservation Pine Tree -->
      <path d="M14.5 5.5L9.5 14H13v3.5h3V14h3.5L14.5 5.5Z" fill="#ffffff"/>
    `;
  }

  return `
    <div class="dest-teardrop-pin">
      <svg viewBox="0 0 30 38" width="30" height="38" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pinShadow" x="-20%" y="-15%" width="140%" height="135%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="rgba(15, 23, 42, 0.28)"/>
          </filter>
        </defs>
        <!-- Aerodynamic Precision Teardrop -->
        <path d="M15 37 C14.2 35.5 2 21.5 2 14 A13 13 0 1 1 28 14 C28 21.5 15.8 35.5 15 37 Z" 
              fill="${pinColor}" 
              stroke="#ffffff" 
              stroke-width="1.6" 
              filter="url(#pinShadow)"/>
        <!-- Centered High-Contrast White Vector Pictogram -->
        <g id="glyph_${category}">
          ${glyph}
        </g>
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

  document.querySelectorAll('.layer-btn, .basemap-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.basemap === type);
  });
}

// ==========================================
// 3. RENDER TEARDROP SVG MARKERS
// ==========================================
function renderMapMarkers() {
  if (!markersLayerGroup) return;
  markersLayerGroup.clearLayers();
  destinationMarkers = {};

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
      iconSize: [30, 38],
      iconAnchor: [15, 38],      // Ujung lancip tepat di titik GPS
      popupAnchor: [0, -38],     // Popup muncul tepat di atas pin
    });

    const marker = L.marker([dest.latitude, dest.longitude], { icon: markerIcon });

    // Otomatis smooth zoom dan buka hierarki saat icon lokasi di klik (seperti klik filter)
    marker.on('click', () => {
      if (mapInstance) {
        mapInstance.flyTo([dest.latitude, dest.longitude], 11, {
          duration: 0.9,
          easeLinearity: 0.25
        });
      }
      openRegionKeys.add(dest.region);
      selectedDestId = dest.id;
      initRegionHierarchy();
    });

    // Compact Geographic Information Panel (Apple Maps / ArcGIS Standards)
    const elevText = dest.elevation_m > 50 
      ? `${dest.elevation_m.toLocaleString('id-ID')} mdpl`
      : getCategoryDisplayName(dest.category);

    const shortDesc = (dest.description || '').length > 100 
      ? dest.description.slice(0, 100) + '...'
      : dest.description;

    const popupHtml = `
      <div class="map-popup-panel">
        <div class="popup-photo-frame">
          <img src="${dest.photo_url}" alt="${dest.name}" loading="lazy" />
        </div>
        <div class="popup-body">
          <h4 class="popup-title">${dest.name}</h4>
          <div class="popup-meta">
            <span>${dest.province}</span>
            <span>&middot;</span>
            <span>${elevText}</span>
          </div>
          <p class="popup-excerpt">${shortDesc}</p>
          <a href="destinasi/index.html?id=${dest.id}" class="popup-action-link">
            <span>Lihat Detail</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, { maxWidth: 260, closeButton: false });
    marker.addTo(markersLayerGroup);
    destinationMarkers[dest.id] = marker;
  });
}

function filterCategory(cat, el) {
  currentCategoryFilter = cat;
  document.querySelectorAll('.filter-tab, .cat-pill').forEach((btn) => btn.classList.remove('active'));
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
  initRegionHierarchy();
}

// ==========================================
// HIERARCHICAL REGION & DESTINATION TREE
// ==========================================
const REGIONS_HIERARCHY_CONFIG = [
  { key: 'all', name: 'Semua (Nasional)' },
  { key: 'Jawa', name: 'Jawa' },
  { key: 'Sumatera', name: 'Sumatera' },
  { key: 'Bali-Nusra', name: 'Bali & Nusa Tenggara' },
  { key: 'Sulawesi', name: 'Sulawesi' },
  { key: 'Papua', name: 'Papua' }
];

function initRegionHierarchy() {
  const treeContainer = document.getElementById('sidebarRegionTree');
  if (!treeContainer) return;

  let html = '';

  REGIONS_HIERARCHY_CONFIG.forEach((reg) => {
    const isAll = reg.key === 'all';
    const isActive = currentRegionFilter === reg.key;
    const isOpen = openRegionKeys.has(reg.key);

    const destsInRegion = isAll
      ? NUSANTARA_DESTINATIONS
      : NUSANTARA_DESTINATIONS.filter((d) => d.region === reg.key);
    
    const count = destsInRegion.length;

    let childrenHtml = '';
    if (!isAll && destsInRegion.length > 0) {
      childrenHtml = `
        <div class="region-children">
          ${destsInRegion.map((dest) => {
            const quotaPercent = Math.min((dest.current_visitors / dest.daily_quota) * 100, 100);
            let statusClass = 'status-normal';
            let statusText = `Kuota ${Math.round(quotaPercent)}%`;
            if (quotaPercent > 90) {
              statusClass = 'status-critical';
            } else if (quotaPercent > 70) {
              statusClass = 'status-warning';
            }

            const isSelected = selectedDestId === dest.id ? 'selected' : '';

            return `
              <div class="dest-item ${isSelected}" data-dest-id="${dest.id}" onclick="focusDestination('${dest.id}')">
                <div class="dest-item-icon">
                  ${getCategoryBadgeSvg(dest.category)}
                </div>
                <div class="dest-item-info">
                  <div class="dest-item-title">${dest.name}</div>
                  <div class="dest-item-sub">
                    <span>${dest.province}</span>
                    <span class="dest-item-sep">&middot;</span>
                    <span class="${statusClass}">${statusText}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    html += `
      <div class="region-group ${isActive ? 'active' : ''} ${isOpen ? 'open' : ''}" id="regBranch_${reg.key}">
        <button class="region-row" onclick="handleRegionClick('${reg.key}')" type="button">
          <div class="region-name-wrap">
            <span class="region-name">${reg.name}</span>
          </div>
          <div class="region-side">
            <span class="region-count">${count}</span>
            ${!isAll ? `<svg class="region-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>` : ''}
          </div>
        </button>
        ${childrenHtml}
      </div>
    `;
  });

  treeContainer.innerHTML = html;
}

function handleRegionClick(regKey) {
  if (regKey === 'all') {
    openRegionKeys.clear();
    currentRegionFilter = 'all';
  } else {
    if (openRegionKeys.has(regKey)) {
      openRegionKeys.delete(regKey);
    } else {
      openRegionKeys.add(regKey);
    }
    currentRegionFilter = regKey;
  }

  if (mapInstance) {
    if (currentRegionFilter === 'all') mapInstance.flyTo([-2.5, 118.0], 5, { duration: 1.2 });
    else if (currentRegionFilter === 'Jawa') mapInstance.flyTo([-7.5, 110.0], 7, { duration: 1.2 });
    else if (currentRegionFilter === 'Sumatera') mapInstance.flyTo([0.5, 101.5], 6, { duration: 1.2 });
    else if (currentRegionFilter === 'Bali-Nusra') mapInstance.flyTo([-8.5, 117.5], 7, { duration: 1.2 });
    else if (currentRegionFilter === 'Sulawesi') mapInstance.flyTo([-2.0, 121.0], 6, { duration: 1.2 });
    else if (currentRegionFilter === 'Papua') mapInstance.flyTo([-3.0, 136.0], 6, { duration: 1.2 });
  }

  renderMapMarkers();
  renderDestinationGrid();
  initRegionHierarchy();
}

function focusDestination(destId) {
  selectedDestId = destId;
  const dest = NUSANTARA_DESTINATIONS.find((d) => d.id === destId);
  if (!dest) return;

  openRegionKeys.add(dest.region);
  if (currentRegionFilter !== 'all' && currentRegionFilter !== dest.region) {
    currentRegionFilter = dest.region;
    renderMapMarkers();
    renderDestinationGrid();
  }

  initRegionHierarchy();

  if (mapInstance) {
    mapInstance.flyTo([dest.latitude, dest.longitude], 12, {
      duration: 1.0,
      easeLinearity: 0.25
    });
  }

  setTimeout(() => {
    if (destinationMarkers[destId]) {
      destinationMarkers[destId].openPopup();
    }
  }, 450);

  document.querySelectorAll('.dest-item, .tree-child-item').forEach((item) => {
    item.classList.toggle('selected', item.dataset.destId === destId);
  });
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
      const quotaPercent = Math.min(((dest.current_visitors || 0) / (dest.daily_quota || 1000)) * 100, 100);
      let statusClass = 'status-normal';
      if (quotaPercent > 90) statusClass = 'status-critical';
      else if (quotaPercent > 70) statusClass = 'status-warning';

      return `
        <article class="dest-card">
          <div class="dest-card-media">
            <img src="${dest.photo_url}" alt="${dest.name}" loading="lazy" />
          </div>
          <div class="dest-card-content">
            <div class="dest-card-header">
              <span class="dest-card-loc">${dest.province} &middot; ${dest.region}</span>
              <span class="dest-card-cat">${getCategoryDisplayName(dest.category)}</span>
            </div>
            <h3 class="dest-card-title">${dest.name}</h3>
            <p class="dest-card-desc">${dest.description}</p>
            
            <div class="dest-card-telemetry">
              <span class="telemetry-label">Kapasitas Harian</span>
              <span class="telemetry-val ${statusClass}">${(dest.current_visitors || 0).toLocaleString('id-ID')} / ${(dest.daily_quota || 1000).toLocaleString('id-ID')} (${Math.round(quotaPercent)}%)</span>
            </div>

            <div class="dest-card-footer">
              <div class="dest-card-price">
                <span class="price-val">Rp ${(dest.ticket_price || 20000).toLocaleString('id-ID')}</span>
                <span class="price-unit">/ orang</span>
              </div>
              <div class="dest-card-actions">
                <a href="destinasi/index.html?id=${dest.id}" class="btn-card-secondary">
                  Lihat Detail
                </a>
                <button class="btn-card-primary" onclick="openPassBookingModal('${dest.id}')">
                  Pesan Tiket
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function zoomToDest(lat, lng) {
  if (mapInstance) {
    mapInstance.flyTo([lat, lng], 11, { duration: 1.2 });
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }
}

function updateKPIStats() {
  const totalDestEl = document.getElementById('kpiTotalDest');
  const totalVisitorsEl = document.getElementById('kpiTotalVisitors');
  const safeEcoEl = document.getElementById('kpiEcoSafe');

  if (totalDestEl) totalDestEl.innerText = NUSANTARA_DESTINATIONS.length;
  if (totalVisitorsEl) {
    const total = NUSANTARA_DESTINATIONS.reduce((acc, d) => acc + (d.current_visitors || 0), 0);
    totalVisitorsEl.innerText = total.toLocaleString('id-ID');
  }
  if (safeEcoEl) safeEcoEl.innerText = '94.8%';
}

function updatePassportCountBadge() {
  const badge = document.getElementById('passportBadgeCount');
  if (badge) {
    badge.innerText = myPassportStamps.length;
  }
}

// ==========================================
// 4.5. MODAL: DETAIL LENGKAP DESTINASI
// ==========================================
function openDestDetailModal(destId) {
  const dest = NUSANTARA_DESTINATIONS.find((d) => d.id === destId);
  if (!dest) return;

  const modal = document.getElementById('destDetailModal');
  if (!modal) return;

  const catPill = document.getElementById('detailDestCategoryPill');
  if (catPill) {
    catPill.innerHTML = `${getCategoryBadgeSvg(dest.category)} ${getCategoryDisplayName(dest.category)}`;
  }

  const titleEl = document.getElementById('detailDestTitle');
  if (titleEl) titleEl.innerText = dest.name;

  const metaEl = document.getElementById('detailDestMeta');
  if (metaEl) metaEl.innerText = `${dest.province} • Wilayah ${dest.region} • Koordinat: [${dest.latitude}, ${dest.longitude}]`;

  const imgEl = document.getElementById('detailDestImg');
  if (imgEl) {
    imgEl.src = dest.photo_url;
    imgEl.alt = dest.name;
  }

  const descEl = document.getElementById('detailDestDesc');
  if (descEl) descEl.innerText = dest.description;

  // Quota & carrying capacity
  const quotaPercent = Math.min((dest.current_visitors / dest.daily_quota) * 100, 100);
  const quotaColor = quotaPercent > 90 ? '#ef4444' : quotaPercent > 70 ? '#f59e0b' : '#059669';

  const numsEl = document.getElementById('detailDestQuotaNums');
  if (numsEl) {
    numsEl.innerText = `${(dest.current_visitors || 0).toLocaleString('id-ID')} / ${(dest.daily_quota || 1000).toLocaleString('id-ID')} Pengunjung`;
    numsEl.style.color = quotaColor;
  }

  const barEl = document.getElementById('detailDestQuotaBar');
  if (barEl) {
    barEl.style.width = `${quotaPercent}%`;
    barEl.style.background = quotaColor;
  }

  const statusEl = document.getElementById('detailDestStatusBadge');
  if (statusEl) {
    statusEl.innerText = `Status: ${(dest.quota_status || 'tersedia').replace('_', ' ').toUpperCase()}`;
    statusEl.style.color = quotaColor;
  }

  const percentEl = document.getElementById('detailDestPercentText');
  if (percentEl) percentEl.innerText = `${Math.round(quotaPercent)}% Kapasitas Terisi`;

  // Weather & Price
  const weatherEl = document.getElementById('detailDestWeather');
  if (weatherEl) weatherEl.innerText = dest.wave_status || 'Normal (Aman & Kondusif)';

  const priceEl = document.getElementById('detailDestPrice');
  if (priceEl) priceEl.innerText = `Rp ${(dest.ticket_price || 20000).toLocaleString('id-ID')} / orang`;

  // Eco guidelines
  const guideEl = document.getElementById('detailDestGuidelines');
  if (guideEl) guideEl.innerText = dest.eco_guidelines || 'Patuhi zona konservasi, buang sampah pada tempatnya, dan jaga kelestarian warisan budaya.';

  // Book button inside detail modal
  const bookBtn = document.getElementById('detailDestBookBtn');
  if (bookBtn) {
    bookBtn.onclick = () => {
      closeDestDetailModal();
      openPassBookingModal(dest.id);
    };
  }

  modal.classList.add('active');
}

function closeDestDetailModal() {
  const modal = document.getElementById('destDetailModal');
  if (modal) modal.classList.remove('active');
}

// Close modals when clicking backdrop overlay
window.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

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
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 4px; background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${getCategoryBadgeSvg(d.category)}
              </div>
              <div style="flex: 1;">
                <h4 style="font-size: 13px; font-weight: 700; color: #0f172a;">${d.name}</h4>
                <div style="font-size: 11px; color: #64748b;">${d.province}</div>
              </div>
              <span style="font-size: 10.5px; font-weight: 600; color: #0f172a; background: #f1f5f9; padding: 2px 7px; border-radius: 4px;">
                Terkoleksi
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
