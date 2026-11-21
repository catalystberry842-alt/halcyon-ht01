import './styles.css';
import { CONFIG_OPTIONS, HOTSPOTS, LIGHTING_MOODS, buildReferenceCode } from './config.js';
import { HalcyonWatchScene } from './watchScene.js';

const state = {
  case: 'platinum',
  bezel: 'white-diamond',
  movement: 'anthracite',
  hands: 'rhodium',
  strap: 'black',
  lighting: 'noir',
  activeHotspot: null
};

const canvas = document.getElementById('watch-canvas');
const clockHmEl = document.getElementById('clock-hm');
const clockSEl = document.getElementById('clock-s');
const freqEl = document.getElementById('telemetry-freq');
const reserveValEl = document.getElementById('reserve-value');
const engReserveValEl = document.getElementById('eng-reserve-val');
const reserveBarFillEl = document.getElementById('reserve-bar-fill');
const referenceCodeEl = document.getElementById('reference-code');
const hotspotsLayer = document.getElementById('hotspots-layer');
const hotspotListEl = document.getElementById('hotspot-list');
const windFeedbackEl = document.getElementById('wind-feedback');
const windFeedbackTextEl = document.getElementById('wind-feedback-text');

let lastDisplayedSecond = -1;
let windToastTimer = null;

function showWindFeedback(text) {
  windFeedbackTextEl.textContent = text;
  windFeedbackEl.classList.add('is-visible');
  if (windToastTimer) clearTimeout(windToastTimer);
  windToastTimer = setTimeout(() => {
    windFeedbackEl.classList.remove('is-visible');
  }, 2100);
}

function updateReserveUI(hours) {
  const formatted = hours.toFixed(1);
  reserveValEl.textContent = formatted;
  engReserveValEl.textContent = `${formatted} / 72.0 h`;
  reserveBarFillEl.style.width = `${Math.min(100, (hours / 72) * 100).toFixed(1)}%`;
}

// Create 3D Watch Scene
const hotspotDomMap = new Map();

const sceneApp = new HalcyonWatchScene(canvas, {
  onTick(watchSeconds, reserveHours) {
    const totalSec = Math.floor(watchSeconds);
    if (totalSec !== lastDisplayedSecond) {
      lastDisplayedSecond = totalSec;
      const h = Math.floor((totalSec / 3600) % 24);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      const pad = (n) => String(n).padStart(2, '0');
      clockHmEl.textContent = `${pad(h)}:${pad(m)}`;
      clockSEl.textContent = `:${pad(s)}`;
      updateReserveUI(reserveHours);
    }
  },
  onWind(newReserve, gained, isFull) {
    updateReserveUI(newReserve);
    if (isFull && gained <= 0) {
      showWindFeedback('MAINSPRING FULLY WOUND · 72.0 H');
    } else {
      showWindFeedback(`MAINSPRING WOUND · +${gained.toFixed(1)} H (${newReserve.toFixed(1)} H)`);
    }
  },
  onHotspotsProject(items) {
    for (const item of items) {
      const el = hotspotDomMap.get(item.id);
      if (!el) continue;
      el.style.transform = `translate(${item.x.toFixed(1)}px, ${item.y.toFixed(1)}px) translate(-50%, -50%)`;
      el.classList.toggle('is-occluded', item.occluded);
    }
  }
});

// =========================================================================
// BUILD CONFIGURE SWATCHES
// =========================================================================
function updateReference() {
  referenceCodeEl.textContent = buildReferenceCode(state);
}

function renderSwatchGroup(groupKey, applyFn) {
  const container = document.getElementById(`swatches-${groupKey}`);
  const labelEl = document.getElementById(`value-${groupKey}`);
  const options = CONFIG_OPTIONS[groupKey];

  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch-btn';
    if (opt.swatchType === 'leather') btn.classList.add('is-leather');
    if (opt.swatchType === 'faceted') btn.classList.add('is-faceted');
    if (opt.swatchType === 'baguette') btn.classList.add('is-baguette');
    btn.style.background = opt.swatchBg;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-label', opt.label);
    btn.title = opt.label;
    btn.dataset.id = opt.id;

    const isInit = state[groupKey] === opt.id;
    btn.classList.toggle('is-selected', isInit);
    btn.setAttribute('aria-checked', String(isInit));

    btn.addEventListener('click', () => {
      if (state[groupKey] === opt.id) return;
      state[groupKey] = opt.id;
      labelEl.textContent = opt.label;

      container.querySelectorAll('.swatch-btn').forEach((b) => {
        const sel = b.dataset.id === opt.id;
        b.classList.toggle('is-selected', sel);
        b.setAttribute('aria-checked', String(sel));
      });

      applyFn(opt.id);
      updateReference();
    });

    container.appendChild(btn);
  });
}

renderSwatchGroup('case', (id) => sceneApp.applyCase(id));
renderSwatchGroup('bezel', (id) => sceneApp.applyBezel(id));
renderSwatchGroup('movement', (id) => sceneApp.applyMovement(id));
renderSwatchGroup('hands', (id) => sceneApp.applyHands(id));
renderSwatchGroup('strap', (id) => sceneApp.applyStrap(id));
updateReference();

// =========================================================================
// PANEL TABS (CONFIGURE / ENGINEERING / STUDIO)
// =========================================================================
const tabButtons = document.querySelectorAll('.panel-tab');
const tabPanels = document.querySelectorAll('.tab-content');

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabButtons.forEach((b) => {
      const active = b.dataset.tab === target;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    });
    tabPanels.forEach((p) => {
      p.classList.toggle('is-active', p.id === `panel-${target}`);
    });
  });
});

// =========================================================================
// ENGINEERING TAB: 3D HOTSPOTS, SPEED, WINDING
// =========================================================================
const toggleHotspotsEl = document.getElementById('toggle-hotspots');

function setHotspotsEnabled(enabled) {
  toggleHotspotsEl.checked = enabled;
  hotspotsLayer.classList.toggle('is-visible', enabled);
  hotspotsLayer.setAttribute('aria-hidden', String(!enabled));
  sceneApp.setHotspotsVisible(enabled);
}

function focusHotspot(hs) {
  state.activeHotspot = hs.id;
  if (!toggleHotspotsEl.checked) {
    setHotspotsEnabled(true);
  }
  hotspotDomMap.forEach((el, id) => {
    el.classList.toggle('is-active', id === hs.id);
  });
  hotspotListEl.querySelectorAll('.hotspot-item-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.hotspot === hs.id);
  });
  sceneApp.setCameraPreset(hs.cameraPreset);
}

HOTSPOTS.forEach((hs) => {
  // 3D floating pin + callout card
  const marker = document.createElement('div');
  marker.className = 'hotspot-marker';
  marker.innerHTML = `
    <div class="hotspot-pin">${hs.index}</div>
    <div class="hotspot-card">
      <div class="hotspot-card-title">${hs.title}</div>
      <div class="hotspot-card-desc">${hs.desc}</div>
    </div>
  `;
  marker.addEventListener('click', (e) => {
    e.stopPropagation();
    focusHotspot(hs);
  });
  hotspotsLayer.appendChild(marker);
  hotspotDomMap.set(hs.id, marker);

  // Engineering panel hotspot list button
  const itemBtn = document.createElement('button');
  itemBtn.type = 'button';
  itemBtn.className = 'hotspot-item-btn';
  itemBtn.dataset.hotspot = hs.id;
  itemBtn.innerHTML = `<span>${hs.title}</span><span class="hotspot-idx">${hs.index}</span>`;
  itemBtn.addEventListener('click', () => focusHotspot(hs));
  hotspotListEl.appendChild(itemBtn);
});

toggleHotspotsEl.addEventListener('change', (e) => {
  setHotspotsEnabled(e.target.checked);
});

// Escapement Speed Control
const rateReadoutEl = document.getElementById('rate-readout');
document.querySelectorAll('#speed-control .seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const speed = parseFloat(btn.dataset.speed);
    document.querySelectorAll('#speed-control .seg-btn').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
    });
    sceneApp.setSpeedMultiplier(speed);
    rateReadoutEl.textContent = speed === 0 ? 'PAUSED' : `${speed.toFixed(speed < 1 ? 2 : 1)}×`;
    const hz = (4 * speed).toFixed(speed % 1 === 0 ? 0 : 1);
    const vph = Math.round(28800 * speed).toLocaleString('en-US');
    freqEl.textContent = speed === 0 ? '0 Hz · Escapement Paused' : `${hz} Hz · ${vph} vph`;
  });
});

document.getElementById('btn-wind-crown').addEventListener('click', () => {
  sceneApp.windCrown(4.0);
});

document.getElementById('btn-sync-time').addEventListener('click', () => {
  sceneApp.syncLocalTime();
  showWindFeedback('SYNCHRONIZED TO LOCAL TIME');
});

// =========================================================================
// STUDIO TAB: CAMERA PRESETS, LIGHTING RIG, POST-PROCESSING TOGGLES
// =========================================================================
document.querySelectorAll('#camera-presets .cam-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#camera-presets .cam-btn').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
    });
    sceneApp.setCameraPreset(btn.dataset.cam);
  });
});

const lightingValueEl = document.getElementById('value-lighting');
document.querySelectorAll('#lighting-control .seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const moodKey = btn.dataset.light;
    document.querySelectorAll('#lighting-control .seg-btn').forEach((b) => {
      b.classList.toggle('is-active', b === btn);
    });
    lightingValueEl.textContent = LIGHTING_MOODS[moodKey].label;
    sceneApp.applyLightingMood(moodKey);
  });
});

document.getElementById('toggle-autorotate').addEventListener('change', (e) => {
  sceneApp.setAutoRotate(e.target.checked);
});

document.getElementById('toggle-bloom').addEventListener('change', (e) => {
  sceneApp.setBloom(e.target.checked);
});

document.getElementById('toggle-dof').addEventListener('change', (e) => {
  sceneApp.setDepthOfField(e.target.checked);
});

document.getElementById('toggle-crystal').addEventListener('change', (e) => {
  sceneApp.setCrystalVisible(e.target.checked);
});
