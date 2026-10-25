let mapInstance = null;
let markersLayerGroup = null;
let destinationMarkers = {};
let currentBasemap = 'osm'; 
let currentCategoryFilter = 'all';
let currentRegionFilter = 'all';
let openRegionKeys = new Set(); 
let selectedDestId = null;
let myPassportStamps = JSON.parse(localStorage.getItem('np_stamps') || '[]');

function applyLocalOverrides() {
  try {
    const rawOverrides = localStorage.getItem('np_destinations_override');
    if (rawOverrides && typeof NUSANTARA_DESTINATIONS !== 'undefined') {
      const overrides = JSON.parse(rawOverrides);
      NUSANTARA_DESTINATIONS.forEach(d => {
        if (overrides[d.id]) {
          Object.assign(d, overrides[d.id]);
        }
      });
    }
  } catch (e) {}
}

function getResolvedPhotoUrl(url) {
  if (!url) return 'assets/img/destinations/dest-pgr-01.jpg';
  if (url.startsWith('../')) return url.substring(3);
  return url;
}

document.addEventListener('DOMContentLoaded', async () => {
  applyLocalOverrides();
  initMap();
  renderDestinationGrid();
  updateKPIStats();
  initRegionHierarchy();
  updatePassportCountBadge();

  if (typeof npFetchDestinations === 'function') {
    try {
      await npFetchDestinations();
      // Jangan menimpa data realtime cloud dengan cache local storage lama
      renderMapMarkers();
      renderDestinationGrid();
      updateKPIStats();
      initRegionHierarchy();
    } catch (err) {
      console.log('Menggunakan data fallback lokal.');
      applyLocalOverrides();
    }
  }

  // Langganan WebSocket Realtime: pembaruan instan antar perangkat tanpa refresh
  if (typeof npSubscribeRealtime === 'function') {
    npSubscribeRealtime(() => {
      renderMapMarkers();
      renderDestinationGrid();
      updateKPIStats();
      initRegionHierarchy();
    });
  }

  // Wake-up sync saat kembali ke tab di browser ponsel
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && typeof npFetchDestinations === 'function') {
      npFetchDestinations().then(() => {
        renderMapMarkers();
        renderDestinationGrid();
        updateKPIStats();
        initRegionHierarchy();
      });
    }
  });
});

function getCategoryPremiumPinSvg(dest, isSelected = false) {
  const cat = (typeof dest === 'string') ? dest : (dest && dest.category) || 'pantai';

const gradDefs = `
    <linearGradient id="pinGrad_pantai" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="pinGrad_gunung" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="50%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#9a3412"/>
    </linearGradient>
    <linearGradient id="pinGrad_budaya" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fcd34d"/>
      <stop offset="50%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
    <linearGradient id="pinGrad_taman_nasional" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="50%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
  `;

  let glyph = '';
  if (cat === 'pantai') {
    glyph = `
      <!-- Precision Maritime Sun & Rhythm Waves -->
      <circle cx="17" cy="9.8" r="2.2" fill="#ffffff"/>
      <path d="M 9.5,15.5 C 12,14 14.5,14 17,15.5 C 19.5,17 22,17 24.5,15.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M 9.5,19.2 C 12,17.7 14.5,17.7 17,19.2 C 19.5,20.7 22,20.7 24.5,19.2" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    `;
  } else if (cat === 'gunung') {
    glyph = `
      <!-- Precision 3D Faceted Summit Peaks -->
      <path d="M 8.5,22 L 15,11 L 18,15 L 14.5,17.5 L 12,22 Z" fill="rgba(255,255,255,0.55)"/>
      <path d="M 15,11 L 19,16.5 L 21,14.5 L 25.5,22 L 18,15 Z" fill="#ffffff"/>
      <polygon points="15,11 13.5,14 16.5,14" fill="#ffffff"/>
    `;
  } else if (cat === 'budaya') {
    glyph = `
      <!-- Architectural Heritage Stupa & Pinnacle -->
      <rect x="16.2" y="6.8" width="1.6" height="2.5" rx="0.5" fill="#ffffff"/>
      <circle cx="17" cy="6.4" r="1.1" fill="#ffffff"/>
      <path d="M 13.5,10.8 C 13.5,9.6 14.8,9.4 17,9.4 C 19.2,9.4 20.5,9.6 20.5,10.8 L 21.8,14.2 C 21.8,14.9 20.5,15.2 17,15.2 C 13.5,15.2 12.2,14.9 12.2,14.2 Z" fill="#ffffff"/>
      <rect x="10.8" y="16.2" width="12.4" height="1.8" rx="0.5" fill="#ffffff"/>
      <rect x="8.8" y="19" width="16.4" height="2" rx="0.5" fill="#ffffff"/>
    `;
  } else {
    
    glyph = `
      <!-- Precision Tiered Conservation Pine Canopy -->
      <path d="M 17,6.8 L 11.8,14.2 H 14.2 L 10.8,19 H 15.5 V 22.5 H 18.5 V 19 H 23.2 L 19.8,14.2 H 22.2 Z" fill="#ffffff"/>
    `;
  }

  const destId = (dest && dest.id) ? dest.id : '';

  return `
    <div class="dest-premium-marker cat-${cat} ${isSelected ? 'is-selected' : ''}" data-dest-id="${destId}">
      <div class="marker-ground-pulse"></div>
      <div class="marker-ground-shadow"></div>
      <div class="marker-pin-body">
        <svg viewBox="0 0 34 44" width="34" height="44" xmlns="http://www.w3.org/2000/svg">
          <defs>
            ${gradDefs}
          </defs>
          <!-- Aerodynamic Precision Teardrop with Jewel Gradient -->
          <path d="M 17,43 C 16.2,41.2 3,25.5 3,16 A 14,14 0 1,1 31,16 C 31,25.5 17.8,41.2 17,43 Z"
                fill="url(#pinGrad_${cat})"
                stroke="#ffffff"
                stroke-width="1.8"
                stroke-linejoin="round"/>
          <!-- Inner Concentric Precision Micro-Ring -->
          <circle cx="17" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="0.8"/>
          <!-- Curved Specular Glass Light Reflection -->
          <path d="M 8.5,12 C 10.5,7.5 23.5,7.5 25.5,12 C 21,8.5 13,8.5 8.5,12 Z" fill="rgba(255,255,255,0.3)"/>
          <!-- Centered High-Precision Pictogram -->
          <g>
            ${glyph}
          </g>
        </svg>
      </div>
    </div>
  `;
}

function getCategoryTeardropSvg(category) {
  return getCategoryPremiumPinSvg(category);
}

function getCategoryDisplayName(cat) {
  if (cat === 'pantai') return 'Bahari & Pantai';
  if (cat === 'gunung') return 'Gunung & Dataran Tinggi';
  if (cat === 'budaya') return 'Cagar Budaya & Sejarah';
  if (cat === 'taman_nasional') return 'Taman Nasional & Konservasi';
  return (cat || '').replace('_', ' ');
}

function getCategoryBadgeSvg(category) {
  if (category === 'pantai') {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><circle cx="12" cy="7" r="4"/></svg>`;
  } else if (category === 'gunung') {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`;
  } else if (category === 'budaya') {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>`;
  }
  
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-7M9 15c-3 0-5-2-5-5 0-4 4-7 8-7s8 3 8 7c0 3-2 5-5 5"/></svg>`;
}

function initMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

mapInstance = L.map('map', {
    center: [-2.5, 118.0],
    zoom: 5,
    zoomControl: false,
    tap: true,
    touchZoom: true
  });

  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

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
    const isSelected = (selectedDestId === dest.id);
    const markerIcon = L.divIcon({
      className: 'dest-pin-leaflet',
      html: getCategoryPremiumPinSvg(dest, isSelected),
      iconSize: [34, 46],
      iconAnchor: [17, 43],      
      popupAnchor: [0, -44],     
    });

    const marker = L.marker([dest.latitude, dest.longitude], { icon: markerIcon });

marker.on('click', () => {
      if (mapInstance) {
        mapInstance.flyTo([dest.latitude, dest.longitude], 11, {
          duration: 0.9,
          easeLinearity: 0.25
        });
      }
      openRegionKeys.add(dest.region);
      selectedDestId = dest.id;
      document.querySelectorAll('.dest-premium-marker').forEach((el) => {
        el.classList.toggle('is-selected', el.dataset.destId === dest.id);
      });
      initRegionHierarchy();
    });

const elevText = (dest.category === 'gunung' && dest.elevation_m > 0)
      ? `${dest.elevation_m.toLocaleString('id-ID')} mdpl`
      : getCategoryDisplayName(dest.category);

    const shortDesc = (dest.description || '').length > 100 
      ? dest.description.slice(0, 100) + '...'
      : dest.description;

    const popupHtml = `
      <div class="map-popup-panel">
        <div class="popup-photo-frame">
          <img src="${getResolvedPhotoUrl(dest.photo_url)}" alt="${dest.name}" loading="lazy" />
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

  document.querySelectorAll('.dest-premium-marker').forEach((el) => {
    el.classList.toggle('is-selected', el.dataset.destId === destId);
  });
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
      const quotaPercent = Math.min(((dest.current_visitors || 0) / (dest.daily_quota || 1000)) * 100, 100);
      let statusClass = 'status-normal';
      if (quotaPercent > 90) statusClass = 'status-critical';
      else if (quotaPercent > 70) statusClass = 'status-warning';

      return `
        <article class="dest-card">
          <a href="destinasi/index.html?id=${dest.id}" class="dest-card-media" aria-label="Lihat detail ${dest.name}">
            <img src="${getResolvedPhotoUrl(dest.photo_url)}" alt="${dest.name}" loading="lazy" />
          </a>
          <div class="dest-card-content">
            <div class="dest-card-header">
              <span class="dest-card-loc">${dest.province} &middot; ${dest.region}</span>
              <span class="dest-card-cat">${getCategoryDisplayName(dest.category)}</span>
            </div>
            <h3 class="dest-card-title">
              <a href="destinasi/index.html?id=${dest.id}">${dest.name}</a>
            </h3>
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
    imgEl.src = getResolvedPhotoUrl(dest.photo_url);
    imgEl.alt = dest.name;
  }

  const descEl = document.getElementById('detailDestDesc');
  if (descEl) descEl.innerText = dest.description;

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

const weatherEl = document.getElementById('detailDestWeather');
  if (weatherEl) weatherEl.innerText = dest.wave_status || 'Normal (Aman & Kondusif)';

  const priceEl = document.getElementById('detailDestPrice');
  if (priceEl) priceEl.innerText = `Rp ${(dest.ticket_price || 20000).toLocaleString('id-ID')} / orang`;

const guideEl = document.getElementById('detailDestGuidelines');
  if (guideEl) guideEl.innerText = dest.eco_guidelines || 'Patuhi zona konservasi, buang sampah pada tempatnya, dan jaga kelestarian warisan budaya.';

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

window.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

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

qrCanvasBox.innerHTML = '';
  new QRCode(qrCanvasBox, {
    text: passToken,
    width: 160,
    height: 160,
    colorDark: '#0f172a',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });

  lastBookingPassToken = passToken;

  document.getElementById('passTokenText').innerText = 'KODE TIKET: ' + passToken;
  qrArea.style.display = 'block';

if (!myPassportStamps.includes(currentBookingDest.id)) {
    myPassportStamps.push(currentBookingDest.id);
    localStorage.setItem('np_stamps', JSON.stringify(myPassportStamps));
    updatePassportCountBadge();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  }

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

let lastBookingPassToken = null;

function downloadCurrentBookingTicketPDF() {
  if (!currentBookingDest) {
    alert("Destinasi belum dipilih.");
    return;
  }
  const nameInput = document.getElementById('visitorNameInput');
  const emailInput = document.getElementById('visitorEmailInput');
  const qrCanvasBox = document.getElementById('qrcodeContainer');

  const name = (nameInput && nameInput.value.trim()) || 'Sufyan Tsaury';
  const email = (emailInput && emailInput.value.trim()) || 'sufyantsaury753@gmail.com';

  const canvas = qrCanvasBox ? qrCanvasBox.querySelector('canvas') : null;
  const qrDataUrl = canvas ? canvas.toDataURL('image/png') : (qrCanvasBox ? qrCanvasBox.querySelector('img')?.src : null);

  if (typeof generateSingleTicketPDF === 'function') {
    generateSingleTicketPDF({
      destination: currentBookingDest,
      visitorName: name,
      visitorEmail: email,
      passToken: lastBookingPassToken || `NP-PASS-${currentBookingDest.code}-${Date.now().toString().slice(-6)}`,
      qrDataUrl: qrDataUrl
    });
  } else {
    alert("Generator E-Tiket sedang dimuat, silakan coba lagi.");
  }
}

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
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 10.5px; font-weight: 600; color: #0f172a; background: #f1f5f9; padding: 3px 8px; border-radius: 4px;">
                  Terkoleksi
                </span>
                <button type="button" class="btn-card-secondary" onclick="downloadSingleDestTicket('${d.id}')" style="padding: 4px 9px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  E-Tiket (PDF)
                </button>
              </div>
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

function downloadSingleDestTicket(destId) {
  const d = (typeof NUSANTARA_DESTINATIONS !== 'undefined')
    ? NUSANTARA_DESTINATIONS.find((dest) => dest.id === destId)
    : null;
  if (!d) {
    alert("Destinasi tidak ditemukan.");
    return;
  }
  const nameInput = document.getElementById('visitorNameInput');
  const emailInput = document.getElementById('visitorEmailInput');
  const name = (nameInput && nameInput.value.trim()) || 'Sufyan Tsaury';
  const email = (emailInput && emailInput.value.trim()) || 'sufyantsaury753@gmail.com';

  if (typeof generateSingleTicketPDF === 'function') {
    generateSingleTicketPDF({
      destination: d,
      visitorName: name,
      visitorEmail: email,
      passToken: `NP-PASS-${d.code || 'GEN'}-${Date.now().toString().slice(-6)}`
    });
  } else {
    alert("Modul generator E-Tiket sedang dimuat.");
  }
}

function downloadPassportPDF() {
  const nameInput = document.getElementById('visitorNameInput');
  const emailInput = document.getElementById('visitorEmailInput');
  const name = (nameInput && nameInput.value.trim()) || 'Sufyan Tsaury';
  const email = (emailInput && emailInput.value.trim()) || 'sufyantsaury753@gmail.com';

  if (typeof generateOfficialPassportPDF === 'function') {
    generateOfficialPassportPDF({
      visitorName: name,
      visitorEmail: email,
      stamps: myPassportStamps
    });
  } else {
    alert("Modul Paspor Resmi sedang dimuat, silakan coba beberapa saat lagi.");
  }
}

function openApiModal() {
  const modal = document.getElementById('apiModal');
  if (modal) {
    modal.classList.add('active');
    
    testApiEndpoint('all');
  }
}

function closeApiModal() {
  const modal = document.getElementById('apiModal');
  if (modal) modal.classList.remove('active');
}

async function testApiEndpoint(category = 'all') {
  const consoleEl = document.getElementById('apiConsoleOutput');
  const badgeEl = document.getElementById('apiStatusBadge');
  const urlEl = document.getElementById('apiUrlDisplay');
  const curlEl = document.getElementById('apiCurlSnippet');
  if (!consoleEl) return;

document.querySelectorAll('#apiModal .filter-tab').forEach((btn) => {
    const isTarget = btn.getAttribute('onclick')?.includes(`'${category}'`);
    btn.classList.toggle('active', !!isTarget);
  });

  const baseUrl = (typeof NP_SUPABASE_CONFIG !== 'undefined' && NP_SUPABASE_CONFIG.URL)
    ? NP_SUPABASE_CONFIG.URL
    : 'https://czaafevdnaqmeejthebm.supabase.co';
  const apiKey = (typeof NP_SUPABASE_CONFIG !== 'undefined' && NP_SUPABASE_CONFIG.ANON_KEY)
    ? NP_SUPABASE_CONFIG.ANON_KEY
    : '';

  let endpointQuery = `${baseUrl}/rest/v1/np_destinations?select=code,name,category,province,region,elevation_m,daily_quota,current_visitors,quota_status,wave_status&order=name.asc`;
  if (category && category !== 'all') {
    endpointQuery += `&category=eq.${category}`;
  }

  if (urlEl) urlEl.textContent = endpointQuery;
  if (badgeEl) {
    badgeEl.textContent = 'Menghubungi Cloud Server...';
    badgeEl.style.background = '#ffffff';
    badgeEl.style.color = '#0f172a';
    badgeEl.style.border = '1px solid #0f172a';
  }
  if (curlEl) {
    curlEl.textContent = `curl -X GET "${endpointQuery}" \\\n  -H "apikey: ${apiKey}" \\\n  -H "Authorization: Bearer ${apiKey}"`;
  }

  consoleEl.innerText = `// [HTTP/2 GET REQUEST]\n// Target: ${endpointQuery}\n// Mengirim request ke Supabase PostgREST Engine...\n// Menunggu respons...`;

  const startTime = performance.now();
  try {
    const response = await fetch(endpointQuery, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const latency = Math.round(performance.now() - startTime);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (badgeEl) {
      badgeEl.textContent = `HTTP/2 200 OK (${latency}ms) — PostgREST Live`;
      badgeEl.style.background = '#ffffff';
      badgeEl.style.color = '#15803d';
      badgeEl.style.border = '1px solid #15803d';
    }

    const wrappedPayload = {
      meta: {
        server: "PostgREST / PostgreSQL 15 (Supabase Cloud)",
        protocol: "OpenAPI 3.0 / RESTful JSON",
        status: response.status,
        latency_ms: latency,
        filter_category: category,
        total_records: data.length,
        timestamp: new Date().toISOString()
      },
      data: data
    };

    consoleEl.innerText = JSON.stringify(wrappedPayload, null, 2);
  } catch (err) {
    const latency = Math.round(performance.now() - startTime);
    console.warn("Fallback to local verified dataset:", err);
    if (badgeEl) {
      badgeEl.textContent = `200 OK (${latency}ms) — Local Fallback`;
      badgeEl.style.background = '#ffffff';
      badgeEl.style.color = '#b45309';
      badgeEl.style.border = '1px solid #b45309';
    }

    let localResult = (typeof NUSANTARA_DESTINATIONS !== 'undefined') ? NUSANTARA_DESTINATIONS : [];
    if (category && category !== 'all') {
      localResult = localResult.filter(d => d.category === category);
    }

    const fallbackPayload = {
      meta: {
        server: "NusantaraPass Local Verified Datastore (Fallback)",
        status: 200,
        latency_ms: latency,
        filter_category: category,
        total_records: localResult.length,
        notice: "Koneksi offline: Menampilkan data terverifikasi lokal."
      },
      data: localResult.map(d => ({
        code: d.code,
        name: d.name,
        category: d.category,
        province: d.province,
        region: d.region,
        elevation_m: d.elevation_m || 0,
        daily_quota: d.daily_quota,
        current_visitors: d.current_visitors,
        quota_status: d.quota_status,
        wave_status: d.wave_status
      }))
    };

    consoleEl.innerText = JSON.stringify(fallbackPayload, null, 2);
  }
}

function copyApiCurl() {
  const curlEl = document.getElementById('apiCurlSnippet');
  const btn = document.getElementById('btnCopyCurl');
  if (!curlEl) return;
  navigator.clipboard.writeText(curlEl.textContent).then(() => {
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '✅ Berhasil Disalin!';
      setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    }
  });
}
