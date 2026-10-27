let currentDest = null;
let currentMediaList = [];
let myPassportStamps = JSON.parse(localStorage.getItem('np_stamps') || '[]');

function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name) || urlParams.get('id') || urlParams.get('dest');
}

function getResolvedPhotoUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('//')) return url;
  if (url.startsWith('../') || url.startsWith('/')) return url;
  return '../' + url;
}

let isCloudSynced = false;

document.addEventListener('DOMContentLoaded', async () => {
  initGeoportalDetail();
  updatePassportBadge();

  // 1. Sinkronisasi data cloud Supabase secara otomatis saat halaman dibuka
  if (typeof npFetchDestinations === 'function') {
    try {
      await npFetchDestinations();
      isCloudSynced = true;
      initGeoportalDetail(true);
    } catch (err) {
      console.warn('Gagal fetch destinasi cloud di detail:', err);
    }
  }

  // 2. Langganan WebSocket Realtime: otomatis update tampilan tanpa perlu refresh
  if (typeof npSubscribeRealtime === 'function') {
    npSubscribeRealtime((payload) => {
      const requestedId = getUrlParameter('id') || 'dest-pgr-01';
      if (payload && payload.new && payload.new.id === requestedId) {
        isCloudSynced = true;
        initGeoportalDetail(true);
      }
    });
  }

  // 3. Fallback saat tab aktif kembali di browser ponsel (wake-up sync)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && typeof npFetchDestinations === 'function') {
      npFetchDestinations().then(() => {
        isCloudSynced = true;
        initGeoportalDetail(true);
      });
    }
  });
});

function initGeoportalDetail(fromCloud = false) {
  const requestedId = getUrlParameter('id') || 'dest-pgr-01';

currentDest = (typeof NUSANTARA_DESTINATIONS !== 'undefined')
    ? NUSANTARA_DESTINATIONS.find(d => d.id === requestedId)
    : null;

  if (!currentDest && typeof NUSANTARA_DESTINATIONS !== 'undefined') {
    currentDest = NUSANTARA_DESTINATIONS[0];
  }

  if (!currentDest) return;

  // Hanya terapkan overrides lokal jika cloud BELUM tersinkronisasi (misal mode offline)
  if (!fromCloud && !isCloudSynced) {
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
  }

  document.title = `${currentDest.name} — Geoportal Pelestarian NusantaraPass`;

  renderHeroHUD();
  renderNarrativeContent();
  renderSDGConservationRules();
  renderTelemetryKiosk();
  renderVisualDocsGrid();
}

function renderHeroHUD() {
  const breadcrumbEl = document.getElementById('crumbDestName');
  if (breadcrumbEl) breadcrumbEl.textContent = currentDest.name;

  const bgImg = document.getElementById('heroShowcaseBg');
  if (bgImg) {
    bgImg.src = getResolvedPhotoUrl(currentDest.photo_url);
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

  const attrEl = document.getElementById('heroAttributionText');
  if (attrEl) {
    const rawAttr = currentDest.photo_attribution || 'Unsplash / Tim Ekspedisi';
    const formatted = rawAttr.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline; font-weight: 600;">$1</a>');
    attrEl.innerHTML = `Foto: ${formatted}`;
  }

  const titleEl = document.getElementById('heroDestTitle');
  if (titleEl) titleEl.textContent = currentDest.name;

  const metaEl = document.getElementById('heroDestMeta');
  if (metaEl) {
    const isGunung = (currentDest.category === 'gunung' && currentDest.elevation_m > 0);
    const elevPart = isGunung 
      ? `<span class="meta-sep">&bull;</span><span>Elevasi ${currentDest.elevation_m.toLocaleString('id-ID')} Mdpl</span>`
      : '';
    metaEl.innerHTML = `
      <span>${currentDest.province}</span>
      <span class="meta-sep">&bull;</span>
      <span>Wilayah ${currentDest.region}</span>
      ${elevPart}
      <span class="meta-sep">&bull;</span>
      <span>GPS: [${currentDest.latitude}, ${currentDest.longitude}]</span>
    `;
  }
}

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

const envStatusText = document.getElementById('envStatusText');
  if (envStatusText) {
    envStatusText.textContent = currentDest.wave_status || 'Normal & Kondusif';
  }

const priceVal = document.getElementById('kioskTicketPrice');
  if (priceVal) {
    priceVal.textContent = `Rp ${(currentDest.ticket_price || 20000).toLocaleString('id-ID')}`;
  }

const stampName = document.getElementById('stampSealName');
  if (stampName) {
    stampName.textContent = currentDest.name;
  }
}

function renderVisualDocsGrid() {
  const grid = document.getElementById('visualDocsGrid');
  if (!grid) return;

  const cat = currentDest.category;
  const name = currentDest.name;
  const coverUrl = getResolvedPhotoUrl(currentDest.photo_url);

  const photoCollections = {
    pantai: [
      { url: coverUrl, caption: `Pemandangan Pesisir ${name}` },
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', caption: 'Hamparan Pasir & Sempadan Pantai' },
      { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', caption: 'Ekosistem Karang Laut Bersih' },
      { url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', caption: 'Lanskap Senja Pesisir Samudra' },
      { url: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=800&q=80', caption: 'Gradasi Air Laut Biru Zamrud' },
      { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', caption: 'Zona Perlindungan Biota Laut' }
    ],
    gunung: [
      { url: coverUrl, caption: `Lanskap Puncak ${name}` },
      { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', caption: 'Lautan Kabut di Ketinggian' },
      { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', caption: 'Savana Edelweiss & Jalur Trekking' },
      { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80', caption: 'Kawah Belerang & Batuan Vulkanik' },
      { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', caption: 'Hutan Hujan Sub-Montana' },
      { url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=800&q=80', caption: 'Puncak Tertinggi Menembus Awan' }
    ],
    budaya: [
      { url: coverUrl, caption: `Arsitektur Bersejarah ${name}` },
      { url: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80', caption: 'Pahatan Relief & Stupa Kuno' },
      { url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', caption: 'Pancaran Cahaya Fajar di Situs' },
      { url: 'https://images.unsplash.com/photo-1609137144822-0a259c735d1a?auto=format&fit=crop&w=800&q=80', caption: 'Pelataran Suci Cagar Budaya' },
      { url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80', caption: 'Kearifan Tradisi & Ritual Luhur' },
      { url: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80', caption: 'Preservasi Nilai Arkeologi Dunia' }
    ],
    taman_nasional: [
      { url: coverUrl, caption: `Kawasan Konservasi ${name}` },
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
        <span class="doc-photo-overlay-caption">${item.caption}</span>
        <span class="doc-photo-overlay-author">Foto: ${item.attribution || 'Unsplash / Kontributor'}</span>
      </div>
    </div>
  `).join('');
}

function openImageViewer(idx) {
  const item = currentMediaList[idx];
  if (!item) return;

  const viewer = document.getElementById('cleanImageViewer');
  const imgEl = document.getElementById('viewerImg');
  const captionEl = document.getElementById('viewerCaption');
  const attrEl = document.getElementById('viewerAttribution');

  if (imgEl) imgEl.src = item.url;
  if (captionEl) captionEl.textContent = `${item.caption} — ${currentDest.name}`;
  if (attrEl) attrEl.textContent = `Fotografer / Sumber: ${item.attribution || 'Unsplash / Kontributor Terverifikasi'}`;

  if (viewer) viewer.classList.add('active');
}

function closeImageViewer() {
  const viewer = document.getElementById('cleanImageViewer');
  if (viewer) viewer.classList.remove('active');
}

async function issueDirectPass() {
  const nameInput = document.getElementById('kioskVisitorName');
  const emailInput = document.getElementById('kioskVisitorEmail');
  const passBox = document.getElementById('kioskPassResultBox');
  const qrContainer = document.getElementById('kioskQrCodeContainer');
  const tokenText = document.getElementById('kioskPassTokenText');

  const name = (nameInput && nameInput.value.trim()) || 'Wisatawan Nusantara';
  const email = (emailInput && emailInput.value.trim()) || 'wisatawan@nusantarapass.id';
  const passToken = `NP-PASS-${currentDest.code}-${Date.now().toString().slice(-6)}`;

if (typeof npCheckinVisitor === 'function') {
    try {
      await npCheckinVisitor(currentDest.id);
      renderKioskMetrics(); 
    } catch (e) {
      console.warn("Gagal mutasi kuota live:", e);
    }
  }

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

  if (tokenText) tokenText.textContent = `TOKEN VERIFIKASI: ${passToken}`;
  if (passBox) {
    passBox.style.display = 'block';
    const badgeEl = passBox.querySelector('.pass-result-badge');
    if (badgeEl) {
      badgeEl.innerHTML = 'TIKET RESMI DITERBITKAN &bull; KUOTA BERKURANG REAL-TIME';
    }
  }

if (!myPassportStamps.includes(currentDest.id)) {
    myPassportStamps.push(currentDest.id);
    localStorage.setItem('np_stamps', JSON.stringify(myPassportStamps));
    updatePassportBadge();
    if (typeof confetti === 'function') {
      confetti({ particleCount: 60, spread: 65, origin: { y: 0.6 } });
    }
  }

  lastDetailPassToken = passToken;

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

let lastDetailPassToken = null;


let paymentCountdownInterval = null;
let currentPayTotal = 25000;
let lastIssuedTicketData = null;

function openPaymentModal() {
  if (!currentDest) return;
  const nameInput = document.getElementById('kioskVisitorName');
  const emailInput = document.getElementById('kioskVisitorEmail');
  const name = (nameInput && nameInput.value.trim()) || 'Sufyan Tsaury';
  const email = (emailInput && emailInput.value.trim()) || 'sufyantsaury753@gmail.com';

  const retribusi = currentDest.ticket_price || 20000;
  const konservasi = 3000;
  const asuransi = 2000;
  currentPayTotal = retribusi + konservasi + asuransi;

  const destCatEl = document.getElementById('payDestCategory');
  if (destCatEl) destCatEl.textContent = (currentDest.category || 'WISATA').replace(/_/g, ' ').toUpperCase();

  const destTitleEl = document.getElementById('payDestTitle');
  if (destTitleEl) destTitleEl.textContent = currentDest.name || 'Destinasi Nusantara';

  const destMetaEl = document.getElementById('payDestMeta');
  if (destMetaEl) destMetaEl.textContent = `${currentDest.region || 'Wilayah'} • Provinsi ${currentDest.province || 'Indonesia'}`;

  const itemTicketEl = document.getElementById('payItemTicket');
  if (itemTicketEl) itemTicketEl.textContent = `Rp ${retribusi.toLocaleString('id-ID')}`;

  const totalAmountEl = document.getElementById('payTotalAmount');
  if (totalAmountEl) totalAmountEl.textContent = `Rp ${currentPayTotal.toLocaleString('id-ID')}`;

  const btnConfirmPayText = document.getElementById('btnConfirmPayText');
  if (btnConfirmPayText) btnConfirmPayText.textContent = `Bayar Sekarang (Simulasi Rp ${currentPayTotal.toLocaleString('id-ID')})`;

  // Render QRIS Dinamis
  const qrisHolder = document.getElementById('simulatedQrisCodeHolder');
  if (qrisHolder && typeof QRCode !== 'undefined') {
    qrisHolder.innerHTML = '';
    const qrisPayload = `00020101021226600016ID.CO.QRIS.WWW01189360098825303110860215NP-${currentDest.code || 'IDN'}51440014ID.LINKAJA.WWW0215936009882530311520458125303360540${currentPayTotal}5802ID5913NUSANTARAPASS6008JAKARTA6304`;
    new QRCode(qrisHolder, {
      text: qrisPayload,
      width: 140,
      height: 140,
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  // Timer 15:00
  startPaymentCountdown(15 * 60);

  // Set default view: Checkout form
  const checkoutState = document.getElementById('payCheckoutState');
  const processingState = document.getElementById('payProcessingState');
  const successState = document.getElementById('paySuccessState');
  if (checkoutState) checkoutState.style.display = 'block';
  if (processingState) processingState.style.display = 'none';
  if (successState) successState.style.display = 'none';

  switchPayTab('qris');

  const modal = document.getElementById('paymentModal');
  if (modal) modal.classList.add('active');
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) modal.classList.remove('active');
  if (paymentCountdownInterval) {
    clearInterval(paymentCountdownInterval);
    paymentCountdownInterval = null;
  }
}

function startPaymentCountdown(seconds) {
  if (paymentCountdownInterval) clearInterval(paymentCountdownInterval);
  let remaining = seconds;
  const timerEl = document.getElementById('payCountdownTimer');
  const updateDisplay = () => {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    if (timerEl) timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  updateDisplay();
  paymentCountdownInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(paymentCountdownInterval);
      paymentCountdownInterval = null;
      if (timerEl) timerEl.textContent = '00:00';
    } else {
      updateDisplay();
    }
  }, 1000);
}

function switchPayTab(tabName) {
  ['qris', 'va', 'ewallet'].forEach(tab => {
    const btn = document.getElementById(`tabBtn${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    const content = document.getElementById(`payTabContent${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    if (btn) btn.classList.toggle('active', tab === tabName);
    if (content) content.classList.toggle('active', tab === tabName);
  });
}

function selectVaBank(el, vaNum, bankName) {
  document.querySelectorAll('.va-item').forEach(item => item.classList.remove('selected'));
  if (el) el.classList.add('selected');
}

function copyVaNumber(e, num) {
  if (e) e.stopPropagation();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(num);
  }
  alert(`Nomor Virtual Account (${num}) berhasil disalin!`);
}

function selectEwallet(el, name) {
  document.querySelectorAll('.ewallet-chip').forEach(item => item.classList.remove('selected'));
  if (el) el.classList.add('selected');
}

async function executePaymentSimulation() {
  const checkoutState = document.getElementById('payCheckoutState');
  const processingState = document.getElementById('payProcessingState');
  const successState = document.getElementById('paySuccessState');

  if (checkoutState) checkoutState.style.display = 'none';
  if (processingState) processingState.style.display = 'block';

  const nameInput = document.getElementById('kioskVisitorName');
  const emailInput = document.getElementById('kioskVisitorEmail');
  const name = (nameInput && nameInput.value.trim()) || 'Sufyan Tsaury';
  const email = (emailInput && emailInput.value.trim()) || 'sufyantsaury753@gmail.com';

  const now = new Date();
  const randNum = Math.floor(100000 + Math.random() * 900000).toString();
  const passToken = `NP-PASS-${currentDest.code || 'GEN'}-${randNum}`;
  const bookingCode = `NP-TKT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${randNum}`;

  // 1. Simpan & mutasi kuota live di Supabase
  if (typeof npCheckinVisitor === 'function') {
    try {
      await npCheckinVisitor(currentDest.id);
      renderKioskMetrics();
    } catch (e) {
      console.warn("Mutasi kuota error:", e);
    }
  }

  // 2. Simpan stempel ke paspor
  if (!myPassportStamps.includes(currentDest.id)) {
    myPassportStamps.push(currentDest.id);
    localStorage.setItem('np_stamps', JSON.stringify(myPassportStamps));
    updatePassportBadge();
  }

  // 3. Simpan tiket ke cloud database
  if (typeof npSaveVisitorPass === 'function') {
    npSaveVisitorPass({
      code: passToken,
      destinationId: currentDest.id,
      visitorName: name,
      visitorEmail: email,
      qrToken: passToken
    }).catch(e => console.warn('Supabase pass background save:', e));
  }

  // Delay simulasi proses perbankan 1.2 detik
  setTimeout(() => {
    if (processingState) processingState.style.display = 'none';
    if (successState) successState.style.display = 'block';

    const regEl = document.getElementById('receiptRegCode');
    if (regEl) regEl.textContent = bookingCode;

    const tokenEl = document.getElementById('receiptPassToken');
    if (tokenEl) tokenEl.textContent = passToken;

    // Render Unique QR Code in Receipt
    let qrDataUrl = null;
    const qrHolder = document.getElementById('receiptQrHolder');
    if (qrHolder && typeof QRCode !== 'undefined') {
      qrHolder.innerHTML = '';
      const qrPayload = `https://nusantarapass.vercel.app/verify?token=${passToken}&tkt=${bookingCode}&dest=${currentDest.code || 'IDN'}`;
      new QRCode(qrHolder, {
        text: qrPayload,
        width: 120,
        height: 120,
        correctLevel: QRCode.CorrectLevel.M
      });
      const canvas = qrHolder.querySelector('canvas');
      if (canvas) {
        qrDataUrl = canvas.toDataURL('image/png');
      } else {
        const img = qrHolder.querySelector('img');
        if (img && img.src) qrDataUrl = img.src;
      }
    }

    lastIssuedTicketData = {
      destination: currentDest,
      visitorName: name,
      visitorEmail: email,
      passToken: passToken,
      bookingCode: bookingCode,
      qrDataUrl: qrDataUrl
    };

    lastDetailPassToken = passToken;

    // Tampilkan juga di kartu kiosk halaman utama
    const passBox = document.getElementById('kioskPassResultBox');
    const tokenText = document.getElementById('kioskPassTokenText');
    const qrContainer = document.getElementById('kioskQrCodeContainer');
    if (tokenText) tokenText.textContent = `TOKEN VERIFIKASI: ${passToken}`;
    if (qrContainer && typeof QRCode !== 'undefined') {
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, {
        text: passToken,
        width: 140,
        height: 140
      });
    }
    if (passBox) passBox.style.display = 'block';

    // Confetti perayaan
    if (typeof confetti === 'function') {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    }
  }, 1200);
}

function downloadIssuedPaymentTicket() {
  if (!lastIssuedTicketData) {
    downloadDetailTicketPDF();
    return;
  }
  if (typeof generateSingleTicketPDF === 'function') {
    generateSingleTicketPDF(lastIssuedTicketData);
  }
}

function openPassportFromPayment() {
  closePaymentModal();
  openPassportModal();
}

function downloadDetailTicketPDF() {
  if (!currentDest) {
    alert("Destinasi belum dipilih.");
    return;
  }
  const nameInput = document.getElementById('kioskVisitorName');
  const emailInput = document.getElementById('kioskVisitorEmail');
  const qrContainer = document.getElementById('kioskQrCodeContainer');

  const name = (nameInput && nameInput.value.trim()) || 'Sufyan Tsaury';
  const email = (emailInput && emailInput.value.trim()) || 'sufyantsaury753@gmail.com';

  const canvas = qrContainer ? qrContainer.querySelector('canvas') : null;
  const qrDataUrl = canvas ? canvas.toDataURL('image/png') : (qrContainer ? qrContainer.querySelector('img')?.src : null);

  if (typeof generateSingleTicketPDF === 'function') {
    generateSingleTicketPDF({
      destination: currentDest,
      visitorName: name,
      visitorEmail: email,
      passToken: lastDetailPassToken || `NP-PASS-${currentDest.code}-${Date.now().toString().slice(-6)}`,
      qrDataUrl: qrDataUrl
    });
  } else {
    alert("Generator E-Tiket sedang dimuat, silakan coba lagi.");
  }
}

function updatePassportBadge() {
  const badge = document.getElementById('passportBadgeCount');
  if (badge) badge.innerText = myPassportStamps.length;
}

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
      }).join('');
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
    : (typeof currentDest !== 'undefined' ? currentDest : null);
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

window.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
  if (e.target && e.target.classList && e.target.classList.contains('clean-image-viewer')) {
    closeImageViewer();
  }
});

function navigateToMap(e) {
  if (e) e.preventDefault();
  const ref = document.referrer;
  if (ref && (ref.endsWith('/') || ref.endsWith('/index.html')) && !ref.includes('/destinasi/') && !ref.includes('/admin/')) {
    window.history.back();
  } else {
    window.location.replace('../index.html');
  }
}
