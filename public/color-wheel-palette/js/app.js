/**
 * Main Application Controller
 * Adobe Color Replicated Studio + Advanced Features
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    viewMode: 'wheel', // 'wheel' | 'image' | 'mockup' | 'accessibility' | 'gradients'
    activeRule: 'analogous',
    baseIndex: 2,
    spreadAngle: 30,
    palette: [], // Array of 5 { h, s, v }
    lockedSwatches: [false, false, false, false, false],
    theme: 'dark',
    openSlidersIndex: -1,

    // Global adjustments offsets
    tempOffset: 0,
    satMultiplier: 1.0,
    briMultiplier: 1.0,
    originalPaletteSnapshot: null,

    // Mockup state
    mockupAssignmentOffset: 0,
    mockupDarkBg: false,

    // Gradient state
    gradientType: 'linear',
    gradientAngle: 135,
    gradientActiveStops: [true, true, true, true, true]
  };

  // SVG Harmony Icon Generators (Matching Adobe Color / Adobe Express Image 2)
  const HARMONY_RULES = [
    {
      id: 'custom',
      name: 'Personalizado',
      svg: `
        <svg viewBox="0 0 32 32" class="harmony-svg">
          <circle class="ring" cx="16" cy="16" r="11"/>
          <circle class="dot" cx="11" cy="15" r="2.2"/>
          <circle class="dot" cx="21" cy="11" r="2.2"/>
          <circle class="dot" cx="16" cy="22" r="2.2"/>
        </svg>
      `
    },
    {
      id: 'analogous',
      name: 'Colores análogos',
      svg: `
        <svg viewBox="0 0 32 32" class="harmony-svg">
          <circle class="ring" cx="16" cy="16" r="11"/>
          <line class="line" x1="16" y1="16" x2="16" y2="5"/>
          <line class="line" x1="16" y1="16" x2="9" y2="8"/>
          <line class="line" x1="16" y1="16" x2="23" y2="8"/>
          <circle class="dot" cx="16" cy="5" r="2.2"/>
          <circle class="dot" cx="9" cy="8" r="2.2"/>
          <circle class="dot" cx="23" cy="8" r="2.2"/>
        </svg>
      `
    },
    {
      id: 'complementary',
      name: 'Colores complementarios',
      svg: `
        <svg viewBox="0 0 32 32" class="harmony-svg">
          <circle class="ring" cx="16" cy="16" r="11"/>
          <line class="line" x1="16" y1="5" x2="16" y2="27"/>
          <circle class="dot" cx="16" cy="5" r="2.2"/>
          <circle class="dot" cx="16" cy="27" r="2.2"/>
        </svg>
      `
    },
    {
      id: 'split',
      name: 'Complementarios divididos',
      svg: `
        <svg viewBox="0 0 32 32" class="harmony-svg">
          <circle class="ring" cx="16" cy="16" r="11"/>
          <line class="line" x1="16" y1="16" x2="16" y2="5"/>
          <line class="line" x1="16" y1="16" x2="10" y2="25"/>
          <line class="line" x1="16" y1="16" x2="22" y2="25"/>
          <circle class="dot" cx="16" cy="5" r="2.2"/>
          <circle class="dot" cx="10" cy="25" r="2.2"/>
          <circle class="dot" cx="22" cy="25" r="2.2"/>
        </svg>
      `
    },
    {
      id: 'triad',
      name: 'Tríada',
      svg: `
        <svg viewBox="0 0 32 32" class="harmony-svg">
          <circle class="ring" cx="16" cy="16" r="11"/>
          <polygon class="line" points="16,5 6.5,21.5 25.5,21.5"/>
          <circle class="dot" cx="16" cy="5" r="2.2"/>
          <circle class="dot" cx="6.5" cy="21.5" r="2.2"/>
          <circle class="dot" cx="25.5" cy="21.5" r="2.2"/>
        </svg>
      `
    },
    {
      id: 'square',
      name: 'Cuadrado / Tétrada',
      svg: `
        <svg viewBox="0 0 32 32" class="harmony-svg">
          <circle class="ring" cx="16" cy="16" r="11"/>
          <rect class="line" x="8.5" y="8.5" width="15" height="15"/>
          <circle class="dot" cx="8.5" cy="8.5" r="2.2"/>
          <circle class="dot" cx="23.5" cy="8.5" r="2.2"/>
          <circle class="dot" cx="23.5" cy="23.5" r="2.2"/>
          <circle class="dot" cx="8.5" cy="23.5" r="2.2"/>
        </svg>
      `
    },
    {
      id: 'compound',
      name: 'Compuesto',
      svg: `
        <svg viewBox="0 0 32 32" class="harmony-svg">
          <circle class="ring" cx="16" cy="16" r="11"/>
          <line class="line" x1="16" y1="5" x2="16" y2="17"/>
          <line class="line" x1="16" y1="17" x2="10" y2="25"/>
          <line class="line" x1="16" y1="17" x2="22" y2="25"/>
          <circle class="dot" cx="16" cy="5" r="2.2"/>
          <circle class="dot" cx="10" cy="25" r="2.2"/>
          <circle class="dot" cx="22" cy="25" r="2.2"/>
        </svg>
      `
    },
    {
      id: 'monochromatic',
      name: 'Monocromático',
      svg: `
        <svg viewBox="0 0 32 32" class="harmony-svg">
          <circle class="ring" cx="16" cy="16" r="11"/>
          <line class="line" x1="16" y1="5" x2="16" y2="16"/>
          <circle class="dot" cx="16" cy="5" r="2.2"/>
          <circle class="dot" cx="16" cy="11" r="1.8"/>
          <circle class="dot" cx="16" cy="16" r="1.4"/>
        </svg>
      `
    },
    {
      id: 'double-split',
      name: 'Doble separación',
      svg: `
        <svg viewBox="0 0 32 32" class="harmony-svg">
          <circle class="ring" cx="16" cy="16" r="11"/>
          <rect class="line" x="11" y="6" width="10" height="20"/>
          <circle class="dot" cx="11" cy="6" r="2.2"/>
          <circle class="dot" cx="21" cy="6" r="2.2"/>
          <circle class="dot" cx="21" cy="26" r="2.2"/>
          <circle class="dot" cx="11" cy="26" r="2.2"/>
        </svg>
      `
    },
    {
      id: 'shades',
      name: 'Tonos / Matices',
      svg: `
        <svg viewBox="0 0 32 32" class="harmony-svg">
          <circle class="ring" cx="16" cy="16" r="11"/>
          <circle class="line" cx="16" cy="16" r="7"/>
          <circle class="line" cx="16" cy="16" r="3.5"/>
          <circle class="dot" cx="16" cy="5" r="2.2"/>
        </svg>
      `
    }
  ];

  // DOM Views
  const views = {
    wheel: document.getElementById('wheelViewContainer'),
    image: document.getElementById('extractViewContainer'),
    mockup: document.getElementById('mockupViewContainer'),
    accessibility: document.getElementById('accessibilityViewContainer'),
    gradients: document.getElementById('gradientsViewContainer')
  };

  // Nav Tab Buttons
  const navTabs = {
    wheel: document.getElementById('tabWheel'),
    image: document.getElementById('tabImage'),
    mockup: document.getElementById('tabMockup'),
    accessibility: document.getElementById('tabAccessibility'),
    gradients: document.getElementById('tabGradients')
  };

  // Wheel Elements
  const canvasElement = document.getElementById('colorWheelCanvas');
  const harmonyTrack = document.getElementById('harmonyTrack');
  const currentHarmonyLabel = document.getElementById('currentHarmonyLabel');
  const btnPrevHarmony = document.getElementById('btnPrevHarmony');
  const btnNextHarmony = document.getElementById('btnNextHarmony');
  const swatchesGrid = document.getElementById('tallSwatchesGrid');
  const previewStrip = document.getElementById('palettePreviewStrip');
  const spreadControlGroup = document.getElementById('spreadControlGroup');
  const spreadSlider = document.getElementById('spreadSlider');
  const spreadValText = document.getElementById('spreadValText');
  const baseBrightnessSlider = document.getElementById('baseBrightnessSlider');

  // Header & Action Buttons
  const btnRandom = document.getElementById('btnRandom');
  const btnRandomBottom = document.getElementById('btnRandomBottom');
  const btnExport = document.getElementById('btnExport');
  const btnExportBottom = document.getElementById('btnExportBottom');
  const btnTheme = document.getElementById('btnTheme');
  const btnApplyExtracted = document.getElementById('btnApplyExtracted');

  // Library Drawer Elements
  const btnOpenLibrary = document.getElementById('btnOpenLibrary');
  const btnSaveToLibraryQuick = document.getElementById('btnSaveToLibraryQuick');
  const libraryDrawer = document.getElementById('libraryDrawer');
  const btnCloseLibrary = document.getElementById('btnCloseLibrary');
  const savedPalettesList = document.getElementById('savedPalettesList');
  const savePaletteNameInput = document.getElementById('savePaletteNameInput');
  const btnConfirmSavePalette = document.getElementById('btnConfirmSavePalette');

  // Global Adjust Dropdown Elements
  const btnToggleGlobalAdjust = document.getElementById('btnToggleGlobalAdjust');
  const globalAdjustDropdown = document.getElementById('globalAdjustDropdown');
  const globalTempSlider = document.getElementById('globalTempSlider');
  const globalSatSlider = document.getElementById('globalSatSlider');
  const globalBriSlider = document.getElementById('globalBriSlider');
  const tempValText = document.getElementById('tempValText');
  const satValText = document.getElementById('satValText');
  const briValText = document.getElementById('briValText');
  const btnResetAdjust = document.getElementById('btnResetAdjust');

  // Mockup View Elements
  const btnShuffleMockup = document.getElementById('btnShuffleMockup');
  const btnToggleMockupTheme = document.getElementById('btnToggleMockupTheme');

  // Accessibility View Elements
  const daltonismStripsMount = document.getElementById('daltonismStripsMount');
  const wcagMatrixTable = document.getElementById('wcagMatrixTable');

  // Gradients View Elements
  const gradientPreviewScreen = document.getElementById('gradientPreviewScreen');
  const gradientCodeBox = document.getElementById('gradientCodeBox');
  const gradientCssSummary = document.getElementById('gradientCssSummary');
  const gradAngleSlider = document.getElementById('gradAngleSlider');
  const gradAngleText = document.getElementById('gradAngleText');
  const btnGradLinear = document.getElementById('btnGradLinear');
  const btnGradRadial = document.getElementById('btnGradRadial');
  const gradientStopsSelector = document.getElementById('gradientStopsSelector');
  const btnCopyGradient = document.getElementById('btnCopyGradient');

  // Export Modal Elements
  const exportModal = document.getElementById('exportModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCopyExport = document.getElementById('btnCopyExport');
  const btnDownloadPng = document.getElementById('btnDownloadPng');
  const exportTabs = document.querySelectorAll('.export-tab');
  const exportCodeBox = document.getElementById('exportCodeBox');
  const toastContainer = document.getElementById('toastContainer');
  let activeExportTab = 'css';

  // Initialize Canvas Wheel
  const colorWheel = new ColorWheel(canvasElement, {
    onColorChange: (newPalette, changedIndex) => {
      // Respect locked swatches when dragging on the wheel
      const finalPalette = newPalette.map((col, i) => {
        return state.lockedSwatches[i] ? state.palette[i] : col;
      });
      state.palette = finalPalette;
      renderAllViews();
    },
    onSelectSwatch: (index) => {
      highlightSwatch(index);
    }
  });

  // Initialize Image Extractor
  const extractorMount = document.getElementById('imageExtractorMount');
  const imageExtractor = new ImageExtractor(extractorMount, {
    onPaletteExtracted: (newPalette) => {
      state.palette = newPalette.map((col, i) => {
        return state.lockedSwatches[i] ? state.palette[i] : col;
      });
      renderAllViews();
    },
    onColorSampled: (index, hsv) => {
      if (!state.lockedSwatches[index]) {
        state.palette[index] = hsv;
        renderAllViews();
      }
    }
  });

  /**
   * Notification Toast
   */
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-blue);">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }

  /**
   * Copy to Clipboard
   */
  async function copyToClipboard(text, message = '¡Copiado al portapapeles!') {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message);
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(message);
    }
  }

  /**
   * Switch between tool views
   */
  function switchView(mode) {
    state.viewMode = mode;

    Object.keys(navTabs).forEach(key => {
      if (navTabs[key]) navTabs[key].classList.toggle('active', key === mode);
    });

    const viewDisplayMap = {
      wheel: 'grid',
      image: 'grid',
      gradients: 'grid',
      mockup: 'flex',
      accessibility: 'flex'
    };

    Object.keys(views).forEach(key => {
      if (!views[key]) return;
      if (key === mode) {
        views[key].style.display = viewDisplayMap[key] || 'grid';
      } else {
        views[key].style.display = 'none';
      }
    });

    if (mode === 'wheel') {
      setTimeout(() => {
        if (colorWheel && typeof colorWheel.resize === 'function') {
          colorWheel.resize();
        }
      }, 30);
      colorWheel.setState(state.palette, state.baseIndex, state.activeRule, state.spreadAngle);
    }

    renderAllViews();
  }

  Object.keys(navTabs).forEach(key => {
    if (navTabs[key]) {
      navTabs[key].addEventListener('click', () => switchView(key));
    }
  });

  /**
   * Master render method: updates all views with current palette
   */
  function renderAllViews() {
    renderTallSwatches();
    updateWheelControls();

    if (state.viewMode === 'mockup') {
      renderUiMockup();
    } else if (state.viewMode === 'accessibility') {
      renderAccessibilityView();
    } else if (state.viewMode === 'gradients') {
      renderGradientGenerator();
    } else if (state.viewMode === 'image') {
      renderExtractorSideSwatches();
    }
  }

  /**
   * Render Horizontal Harmony Rules Track
   */
  function renderHarmonyCarousel() {
    harmonyTrack.innerHTML = '';
    HARMONY_RULES.forEach(rule => {
      const btn = document.createElement('button');
      btn.className = `harmony-btn ${rule.id === state.activeRule ? 'active' : ''}`;
      btn.dataset.rule = rule.id;
      btn.innerHTML = `
        ${rule.svg}
        <span class="harmony-tooltip">${rule.name}</span>
      `;
      btn.addEventListener('click', () => {
        setHarmonyRule(rule.id);
      });
      harmonyTrack.appendChild(btn);
    });

    updateHarmonyLabel();
  }

  function updateHarmonyLabel() {
    const current = HARMONY_RULES.find(r => r.id === state.activeRule);
    if (current && currentHarmonyLabel) {
      currentHarmonyLabel.textContent = current.name;
    }
  }

  btnPrevHarmony.addEventListener('click', () => {
    harmonyTrack.scrollBy({ left: -140, behavior: 'smooth' });
  });
  btnNextHarmony.addEventListener('click', () => {
    harmonyTrack.scrollBy({ left: 140, behavior: 'smooth' });
  });

  /**
   * Set Harmony Rule
   */
  function setHarmonyRule(ruleId) {
    state.activeRule = ruleId;
    document.querySelectorAll('.harmony-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.rule === ruleId);
    });

    updateHarmonyLabel();

    const hasSpread = ['analogous', 'split', 'double-split'].includes(ruleId);
    if (spreadControlGroup) spreadControlGroup.style.display = hasSpread ? 'flex' : 'none';

    // Recalculate, respecting locked swatches
    const baseHsv = state.palette[state.baseIndex];
    const newHarmony = ColorMath.generateHarmony(
      state.activeRule,
      baseHsv,
      state.baseIndex,
      state.spreadAngle,
      state.palette
    );

    state.palette = newHarmony.map((col, i) => {
      return state.lockedSwatches[i] ? state.palette[i] : col;
    });

    colorWheel.setState(state.palette, state.baseIndex, state.activeRule, state.spreadAngle);
    renderAllViews();
  }

  function updateWheelControls() {
    if (spreadSlider) {
      spreadSlider.value = Math.round(state.spreadAngle);
      spreadValText.textContent = `${Math.round(state.spreadAngle)}°`;
    }
    if (baseBrightnessSlider && state.palette[state.baseIndex]) {
      baseBrightnessSlider.value = Math.round(state.palette[state.baseIndex].v * 100);
    }
  }

  function setAsBase(index) {
    if (index === state.baseIndex) return;
    state.baseIndex = index;
    const baseHsv = state.palette[state.baseIndex];

    const newHarmony = ColorMath.generateHarmony(
      state.activeRule,
      baseHsv,
      state.baseIndex,
      state.spreadAngle,
      state.palette
    );

    state.palette = newHarmony.map((col, i) => {
      return state.lockedSwatches[i] ? state.palette[i] : col;
    });

    colorWheel.setState(state.palette, state.baseIndex, state.activeRule, state.spreadAngle);
    renderAllViews();
    showToast(`Color ${index + 1} fijado como color base`);
  }

  function highlightSwatch(index) {
    const cols = document.querySelectorAll('.tall-swatch-column');
    if (cols[index]) {
      cols[index].style.transform = 'scale(0.98)';
      setTimeout(() => { cols[index].style.transform = ''; }, 200);
    }
  }

  /**
   * Render the 5 Tall Vertical Swatches with Lock Padlock Buttons
   */
  function renderTallSwatches() {
    swatchesGrid.innerHTML = '';
    previewStrip.innerHTML = '';

    state.palette.forEach((hsv, index) => {
      const isBase = index === state.baseIndex;
      const isLocked = state.lockedSwatches[index];
      const rgb = ColorMath.hsvToRgb(hsv.h, hsv.s, hsv.v);
      const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
      const textColor = ColorMath.getContrastTextColor(rgb.r, rgb.g, rgb.b);
      const isSlidersOpen = state.openSlidersIndex === index;

      // Bottom preview strip item
      const stripItem = document.createElement('div');
      stripItem.className = 'strip-item';
      stripItem.style.backgroundColor = hex;
      previewStrip.appendChild(stripItem);

      // Main tall swatch column
      const col = document.createElement('div');
      col.className = `tall-swatch-column ${isBase ? 'is-base-col' : ''}`;
      col.dataset.index = index;

      col.innerHTML = `
        <div class="tall-swatch-color" style="background-color: ${hex}; color: ${textColor};">
          <!-- Lock Button -->
          <button class="btn-lock-swatch ${isLocked ? 'locked' : ''}" data-index="${index}" title="${isLocked ? 'Color Bloqueado (Clic para desbloquear)' : 'Bloquear color para el generador aleatorio'}">
            ${isLocked ? `
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            ` : `
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
              </svg>
            `}
          </button>

          ${isBase ? `<div class="tall-base-badge"><svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Base</div>` : `<button class="btn-make-base" data-action="set-base">Fijar Base</button>`}

          <div class="tall-swatch-footer" style="color: ${textColor};">
            <div class="hex-text-row">
              <input type="text" class="hex-code-input" value="${hex}" maxlength="7" spellcheck="false" data-index="${index}">
              <button class="copy-mini-btn" title="Copiar código HEX" data-hex="${hex}">
                <svg class="btn-svg-icon" viewBox="0 0 24 24" style="width: 13px; height: 13px;"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>

            <button class="btn-toggle-sliders" data-index="${index}">
              ${isSlidersOpen ? '▲ Ocultar Sliders' : '▼ Ajustar RGB'}
            </button>

            <div class="swatch-sliders-panel ${isSlidersOpen ? 'open' : ''}">
              <div class="mini-slider-row">
                <label style="color: #ef4444;">R</label>
                <input type="range" min="0" max="255" value="${rgb.r}" data-channel="r" data-index="${index}">
              </div>
              <div class="mini-slider-row">
                <label style="color: #10b981;">G</label>
                <input type="range" min="0" max="255" value="${rgb.g}" data-channel="g" data-index="${index}">
              </div>
              <div class="mini-slider-row">
                <label style="color: #3b82f6;">B</label>
                <input type="range" min="0" max="255" value="${rgb.b}" data-channel="b" data-index="${index}">
              </div>
            </div>
          </div>
        </div>
      `;

      // Event: Toggle Lock
      col.querySelector('.btn-lock-swatch').addEventListener('click', (e) => {
        e.stopPropagation();
        state.lockedSwatches[index] = !state.lockedSwatches[index];
        renderTallSwatches();
        showToast(state.lockedSwatches[index] ? `Color ${index + 1} bloqueado` : `Color ${index + 1} desbloqueado`);
      });

      // Copy HEX
      col.querySelector('.copy-mini-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(hex, `¡Código ${hex} copiado!`);
      });

      // Set as Base
      const btnBase = col.querySelector('.btn-make-base');
      if (btnBase) {
        btnBase.addEventListener('click', (e) => {
          e.stopPropagation();
          setAsBase(index);
        });
      }

      // Hex Input Change
      const hexInput = col.querySelector('.hex-code-input');
      hexInput.addEventListener('change', (e) => {
        const val = e.target.value.trim();
        const parsedRgb = ColorMath.hexToRgb(val);
        if (parsedRgb) {
          const newHsv = ColorMath.rgbToHsv(parsedRgb.r, parsedRgb.g, parsedRgb.b);
          updateSwatchColor(index, newHsv);
        } else {
          showToast('Código HEX inválido');
          renderTallSwatches();
        }
      });
      hexInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') hexInput.blur();
      });

      // Toggle Sliders
      col.querySelector('.btn-toggle-sliders').addEventListener('click', (e) => {
        e.stopPropagation();
        state.openSlidersIndex = state.openSlidersIndex === index ? -1 : index;
        renderTallSwatches();
      });

      // Mini Sliders input
      col.querySelectorAll('input[type="range"]').forEach(slider => {
        slider.addEventListener('input', (e) => {
          const ch = e.target.dataset.channel;
          const currentRgb = ColorMath.hsvToRgb(hsv.h, hsv.s, hsv.v);
          currentRgb[ch] = Number(e.target.value);
          const newHsv = ColorMath.rgbToHsv(currentRgb.r, currentRgb.g, currentRgb.b);
          updateSwatchColor(index, newHsv);
        });
      });

      swatchesGrid.appendChild(col);
    });
  }

  function updateSwatchColor(index, newHsv) {
    if (index === state.baseIndex) {
      const newPalette = ColorMath.generateHarmony(
        state.activeRule,
        newHsv,
        state.baseIndex,
        state.spreadAngle,
        state.palette
      );
      state.palette = newPalette.map((col, i) => state.lockedSwatches[i] ? state.palette[i] : col);
    } else {
      state.palette[index] = newHsv;
    }

    colorWheel.setState(state.palette, state.baseIndex, state.activeRule, state.spreadAngle);
    renderAllViews();
  }

  /**
   * Randomize Palette (Respects Locked Swatches!)
   */
  function randomizePalette() {
    // If base is not locked, randomize base hue
    let baseHsv = state.palette[state.baseIndex];
    if (!state.lockedSwatches[state.baseIndex]) {
      const randomH = Math.floor(Math.random() * 360);
      const randomS = Math.round((0.55 + Math.random() * 0.45) * 100) / 100;
      const randomV = Math.round((0.65 + Math.random() * 0.35) * 100) / 100;
      baseHsv = { h: randomH, s: randomS, v: randomV };
    }

    const generated = ColorMath.generateHarmony(
      state.activeRule,
      baseHsv,
      state.baseIndex,
      state.spreadAngle
    );

    // Apply only to unlocked swatches
    state.palette = generated.map((col, i) => {
      return state.lockedSwatches[i] ? state.palette[i] : col;
    });

    colorWheel.setState(state.palette, state.baseIndex, state.activeRule, state.spreadAngle);
    renderAllViews();
    showToast('¡Paleta generada! (Colores con candado respetados)');
  }

  btnRandom.addEventListener('click', randomizePalette);
  btnRandomBottom.addEventListener('click', randomizePalette);

  if (btnApplyExtracted) {
    btnApplyExtracted.addEventListener('click', () => {
      switchView('wheel');
      showToast('¡Paleta extraída transferida a la Rueda de Color!');
    });
  }

  // Wheel spread and brightness
  if (spreadSlider) {
    spreadSlider.addEventListener('input', (e) => {
      state.spreadAngle = Number(e.target.value);
      spreadValText.textContent = `${state.spreadAngle}°`;
      const newPalette = ColorMath.generateHarmony(
        state.activeRule,
        state.palette[state.baseIndex],
        state.baseIndex,
        state.spreadAngle,
        state.palette
      );
      state.palette = newPalette.map((col, i) => state.lockedSwatches[i] ? state.palette[i] : col);
      colorWheel.setState(state.palette, state.baseIndex, state.activeRule, state.spreadAngle);
      renderAllViews();
    });
  }

  if (baseBrightnessSlider) {
    baseBrightnessSlider.addEventListener('input', (e) => {
      const v = Number(e.target.value) / 100;
      const baseHsv = { ...state.palette[state.baseIndex], v };
      const newPalette = ColorMath.generateHarmony(
        state.activeRule,
        baseHsv,
        state.baseIndex,
        state.spreadAngle,
        state.palette
      );
      state.palette = newPalette.map((col, i) => state.lockedSwatches[i] ? state.palette[i] : col);
      colorWheel.setState(state.palette, state.baseIndex, state.activeRule, state.spreadAngle);
      renderAllViews();
    });
  }

  // Theme Toggle
  const moonSvg = `<svg class="btn-svg-icon" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>`;
  const sunSvg = `<svg class="btn-svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

  btnTheme.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-theme', state.theme === 'light');
    btnTheme.innerHTML = state.theme === 'dark' ? moonSvg : sunSvg;
  });

  // =========================================================================
  // FEATURE: Global Adjustments Popover (Temperature, Saturation, Brightness)
  // =========================================================================
  btnToggleGlobalAdjust.addEventListener('click', (e) => {
    e.stopPropagation();
    globalAdjustDropdown.classList.toggle('open');
    if (globalAdjustDropdown.classList.contains('open') && !state.originalPaletteSnapshot) {
      state.originalPaletteSnapshot = state.palette.map(c => ({ ...c }));
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.popover-container')) {
      globalAdjustDropdown.classList.remove('open');
    }
  });

  function applyGlobalAdjustments() {
    if (!state.originalPaletteSnapshot) {
      state.originalPaletteSnapshot = state.palette.map(c => ({ ...c }));
    }
    const adjusted = ColorMath.adjustGlobalPalette(
      state.originalPaletteSnapshot,
      state.tempOffset,
      state.satMultiplier,
      state.briMultiplier
    );
    state.palette = adjusted;
    colorWheel.setState(state.palette, state.baseIndex, state.activeRule, state.spreadAngle);
    renderAllViews();
  }

  globalTempSlider.addEventListener('input', (e) => {
    state.tempOffset = Number(e.target.value);
    tempValText.textContent = state.tempOffset > 0 ? `+${state.tempOffset}` : state.tempOffset;
    applyGlobalAdjustments();
  });

  globalSatSlider.addEventListener('input', (e) => {
    state.satMultiplier = Number(e.target.value) / 100;
    satValText.textContent = `${e.target.value}%`;
    applyGlobalAdjustments();
  });

  globalBriSlider.addEventListener('input', (e) => {
    state.briMultiplier = Number(e.target.value) / 100;
    briValText.textContent = `${e.target.value}%`;
    applyGlobalAdjustments();
  });

  btnResetAdjust.addEventListener('click', () => {
    state.tempOffset = 0;
    state.satMultiplier = 1.0;
    state.briMultiplier = 1.0;
    globalTempSlider.value = 0;
    globalSatSlider.value = 100;
    globalBriSlider.value = 100;
    tempValText.textContent = '0';
    satValText.textContent = '100%';
    briValText.textContent = '100%';
    if (state.originalPaletteSnapshot) {
      state.palette = state.originalPaletteSnapshot.map(c => ({ ...c }));
      state.originalPaletteSnapshot = null;
    }
    colorWheel.setState(state.palette, state.baseIndex, state.activeRule, state.spreadAngle);
    renderAllViews();
    showToast('Ajustes globales restablecidos');
  });

  // =========================================================================
  // FEATURE: Library Drawer (Saved Palettes in LocalStorage)
  // =========================================================================
  function renderLibraryList() {
    savedPalettesList.innerHTML = '';
    const list = PaletteLibrary.getAll();

    if (list.length === 0) {
      savedPalettesList.innerHTML = `<div style="color: var(--text-dim); font-size: 0.85rem; text-align: center; padding: 20px;">No tienes paletas guardadas aún.</div>`;
      return;
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'saved-palette-card';

      const hexList = item.colors.map(c => {
        const rgb = ColorMath.hsvToRgb(c.h, c.s, c.v);
        return ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
      });

      const dateStr = new Date(item.timestamp).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

      card.innerHTML = `
        <div class="saved-card-header">
          <span class="saved-card-name">${item.name}</span>
          <span class="saved-card-meta">${dateStr}</span>
        </div>
        <div class="saved-card-strip">
          ${hexList.map(hex => `<div class="saved-strip-item" style="background-color: ${hex};"></div>`).join('')}
        </div>
        <div class="saved-card-actions">
          <button class="btn btn-sm btn-load-palette" data-id="${item.id}" style="padding: 4px 10px; font-size: 0.78rem;">
            <span>Cargar</span>
          </button>
          <button class="btn btn-sm btn-copy-palette-css" data-id="${item.id}" style="padding: 4px 8px; font-size: 0.78rem;" title="Copiar CSS">
            <svg class="btn-svg-icon" viewBox="0 0 24 24" style="width: 12px; height: 12px;"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="btn btn-sm btn-delete-palette" data-id="${item.id}" style="padding: 4px 8px; font-size: 0.78rem; color: var(--danger);" title="Eliminar">
            <svg class="btn-svg-icon" viewBox="0 0 24 24" style="width: 12px; height: 12px; stroke: currentColor;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;

      // Load palette
      card.querySelector('.btn-load-palette').addEventListener('click', () => {
        state.palette = item.colors.map(c => ({ ...c }));
        state.activeRule = item.rule || 'custom';
        colorWheel.setState(state.palette, state.baseIndex, state.activeRule, state.spreadAngle);
        renderAllViews();
        libraryDrawer.classList.remove('active');
        showToast(`Paleta "${item.name}" cargada`);
      });

      // Copy CSS
      card.querySelector('.btn-copy-palette-css').addEventListener('click', () => {
        const css = `:root {\n` + hexList.map((h, idx) => `  --color-${idx + 1}: ${h};`).join('\n') + `\n}`;
        copyToClipboard(css, `¡CSS de "${item.name}" copiado!`);
      });

      // Delete
      card.querySelector('.btn-delete-palette').addEventListener('click', () => {
        PaletteLibrary.delete(item.id);
        renderLibraryList();
        showToast('Paleta eliminada');
      });

      savedPalettesList.appendChild(card);
    });
  }

  btnOpenLibrary.addEventListener('click', () => {
    renderLibraryList();
    libraryDrawer.classList.add('active');
  });

  btnSaveToLibraryQuick.addEventListener('click', () => {
    renderLibraryList();
    libraryDrawer.classList.add('active');
    savePaletteNameInput.focus();
  });

  btnCloseLibrary.addEventListener('click', () => {
    libraryDrawer.classList.remove('active');
  });

  libraryDrawer.addEventListener('click', (e) => {
    if (e.target === libraryDrawer) libraryDrawer.classList.remove('active');
  });

  btnConfirmSavePalette.addEventListener('click', () => {
    const name = savePaletteNameInput.value.trim() || `Paleta ${state.activeRule}`;
    PaletteLibrary.save(name, state.palette, state.activeRule);
    savePaletteNameInput.value = '';
    renderLibraryList();
    showToast(`¡Paleta "${name}" guardada con éxito!`);
  });

  // =========================================================================
  // FEATURE: Realistic UI Mockup View
  // =========================================================================
  function renderUiMockup() {
    const hexList = state.palette.map(hsv => {
      const rgb = ColorMath.hsvToRgb(hsv.h, hsv.s, hsv.v);
      return { hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b), rgb };
    });

    // Color role mapping with offset shuffle
    const getCol = (roleIndex) => {
      const idx = (roleIndex + state.mockupAssignmentOffset) % 5;
      return hexList[idx];
    };

    const c1 = getCol(0); // Brand / Hero accent
    const c2 = getCol(1); // Primary CTA
    const c3 = getCol(2); // Card surface / badge
    const c4 = getCol(3); // Feature card
    const c5 = getCol(4); // Secondary feature

    const frame = document.getElementById('mockupFrame');
    const brand = document.getElementById('mockupBrand');
    const navBtn = document.getElementById('mockupNavBtn');
    const badge = document.getElementById('mockupBadge');
    const headline = document.getElementById('mockupHeadline');
    const ctaPrimary = document.getElementById('mockupCtaPrimary');
    const ctaSecondary = document.getElementById('mockupCtaSecondary');
    const card1 = document.getElementById('mockupCard1');
    const card2 = document.getElementById('mockupCard2');
    const card3 = document.getElementById('mockupCard3');

    // Theme background
    if (state.mockupDarkBg) {
      frame.style.backgroundColor = '#0f172a';
      frame.style.color = '#f8fafc';
    } else {
      frame.style.backgroundColor = '#ffffff';
      frame.style.color = '#0f172a';
    }

    brand.style.color = c1.hex;
    navBtn.style.backgroundColor = c2.hex;
    navBtn.style.color = ColorMath.getContrastTextColor(c2.rgb.r, c2.rgb.g, c2.rgb.b);

    badge.style.backgroundColor = c3.hex;
    badge.style.color = ColorMath.getContrastTextColor(c3.rgb.r, c3.rgb.g, c3.rgb.b);

    ctaPrimary.style.backgroundColor = c2.hex;
    ctaPrimary.style.color = ColorMath.getContrastTextColor(c2.rgb.r, c2.rgb.g, c2.rgb.b);

    ctaSecondary.style.border = `2px solid ${c1.hex}`;
    ctaSecondary.style.color = c1.hex;
    ctaSecondary.style.backgroundColor = 'transparent';

    const cardBg = state.mockupDarkBg ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
    [card1, card2, card3].forEach((card, i) => {
      const cardColor = getCol(i + 2);
      card.style.backgroundColor = cardBg;
      card.style.borderColor = cardColor.hex;
      const h3 = card.querySelector('h3');
      if (h3) h3.style.color = cardColor.hex;
      const iconWrap = card.querySelector('.mockup-card-icon-wrap');
      if (iconWrap) {
        iconWrap.style.color = cardColor.hex;
        iconWrap.style.borderColor = cardColor.hex;
        iconWrap.style.backgroundColor = state.mockupDarkBg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
      }
    });
  }

  btnShuffleMockup.addEventListener('click', () => {
    state.mockupAssignmentOffset = (state.mockupAssignmentOffset + 1) % 5;
    renderUiMockup();
    showToast('Asignación de colores rotada en Mockup');
  });

  btnToggleMockupTheme.addEventListener('click', () => {
    state.mockupDarkBg = !state.mockupDarkBg;
    renderUiMockup();
  });

  // =========================================================================
  // FEATURE: Accessibility & Daltonism Simulator View
  // =========================================================================
  function renderAccessibilityView() {
    daltonismStripsMount.innerHTML = '';

    const TYPES = [
      { id: 'normal', name: 'Visión Normal', desc: 'Percepción estándar sin alteraciones cromáticas.' },
      { id: 'deuteranopia', name: 'Deuteranopía', desc: 'Ausencia o alteración de conos verdes (~5% población masculina).' },
      { id: 'protanopia', name: 'Protanopía', desc: 'Ausencia o alteración de conos rojos (~1% población).' },
      { id: 'tritanopia', name: 'Tritanopía', desc: 'Deficiencia en conos azules (afecta menos del 0.01% de la población).' },
      { id: 'achromatopsia', name: 'Acromatopsia', desc: 'Monocromatismo total: percepción exclusiva en escala de luminosidad.' }
    ];

    const currentRgbs = state.palette.map(c => ColorMath.hsvToRgb(c.h, c.s, c.v));

    TYPES.forEach(type => {
      const card = document.createElement('div');
      card.className = 'blindness-row-card';

      // Simulate colors
      const simColors = currentRgbs.map(rgb => {
        if (type.id === 'normal') return rgb;
        return ColorMath.simulateColorBlindness(rgb.r, rgb.g, rgb.b, type.id);
      });

      // Check conflict: are any two colors dangerously similar?
      let hasConflict = false;
      for (let i = 0; i < simColors.length; i++) {
        for (let j = i + 1; j < simColors.length; j++) {
          const dist = ColorMath.getColorDistance(simColors[i], simColors[j]);
          if (dist < 18) {
            hasConflict = true;
            break;
          }
        }
        if (hasConflict) break;
      }

      card.innerHTML = `
        <div class="blindness-card-header">
          <div>
            <div class="blindness-title">
              <span>${type.name}</span>
              ${hasConflict 
                ? '<span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; background: rgba(239, 68, 68, 0.2); color: var(--danger); font-weight: 700;"><svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Conflicto detectado</span>' 
                : '<span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: var(--success); font-weight: 700;"><svg class="badge-svg-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Diferenciable</span>'}
            </div>
            <div class="blindness-desc">${type.desc}</div>
          </div>
        </div>

        <div class="blindness-strip-grid">
          ${simColors.map((rgb, idx) => {
            const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
            const textCol = ColorMath.getContrastTextColor(rgb.r, rgb.g, rgb.b);
            return `
              <div class="blindness-swatch-box" style="background-color: ${hex}; color: ${textCol};">
                <span>${idx + 1}. ${hex}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;

      daltonismStripsMount.appendChild(card);
    });

    // Render WCAG Matrix Table
    renderWcagMatrix(currentRgbs);
  }

  function renderWcagMatrix(rgbs) {
    let html = `<thead><tr><th>Fondo / Texto</th>`;
    rgbs.forEach((_, i) => {
      html += `<th>Color ${i + 1}</th>`;
    });
    html += `</tr></thead><tbody>`;

    rgbs.forEach((bg, i) => {
      const bgHex = ColorMath.rgbToHex(bg.r, bg.g, bg.b);
      html += `<tr><td style="font-weight: 700; background: ${bgHex}; color: ${ColorMath.getContrastTextColor(bg.r, bg.g, bg.b)};">Color ${i + 1}</td>`;
      rgbs.forEach((text, j) => {
        if (i === j) {
          html += `<td style="color: var(--text-dim);">-</td>`;
        } else {
          const ratio = ColorMath.getContrastRatio(bg, text).toFixed(1);
          const isAA = ratio >= 4.5;
          const isAAA = ratio >= 7.0;
          const badgeClass = isAAA ? 'contrast-pass' : (isAA ? 'contrast-pass' : 'contrast-fail');
          const label = isAAA ? 'AAA' : (isAA ? 'AA' : 'Fallo');
          html += `
            <td>
              <span class="contrast-pill ${badgeClass}" title="Ratio: ${ratio}:1">${ratio}:1 (${label})</span>
            </td>
          `;
        }
      });
      html += `</tr>`;
    });
    html += `</tbody>`;
    wcagMatrixTable.innerHTML = html;
  }

  // =========================================================================
  // FEATURE: CSS Gradients Generator View
  // =========================================================================
  function renderGradientGenerator() {
    const hexList = state.palette.map(hsv => {
      const rgb = ColorMath.hsvToRgb(hsv.h, hsv.s, hsv.v);
      return ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
    });

    // Render stop selector pills
    gradientStopsSelector.innerHTML = '';
    hexList.forEach((hex, i) => {
      const pill = document.createElement('div');
      pill.className = `grad-stop-pill ${state.gradientActiveStops[i] ? 'active' : ''}`;
      pill.innerHTML = `
        <span class="grad-stop-dot" style="background-color: ${hex};"></span>
        <span>Color ${i + 1}</span>
      `;
      pill.addEventListener('click', () => {
        state.gradientActiveStops[i] = !state.gradientActiveStops[i];
        // Ensure at least 2 are active
        const count = state.gradientActiveStops.filter(Boolean).length;
        if (count < 2) state.gradientActiveStops[i] = true;
        renderGradientGenerator();
      });
      gradientStopsSelector.appendChild(pill);
    });

    const activeColors = hexList.filter((_, i) => state.gradientActiveStops[i]);

    let cssRule = '';
    if (state.gradientType === 'linear') {
      cssRule = `linear-gradient(${state.gradientAngle}deg, ${activeColors.join(', ')})`;
    } else {
      cssRule = `radial-gradient(circle, ${activeColors.join(', ')})`;
    }

    gradientPreviewScreen.style.background = cssRule;
    gradientCssSummary.textContent = cssRule;
    gradientCodeBox.textContent = `background: ${cssRule};`;
  }

  gradAngleSlider.addEventListener('input', (e) => {
    state.gradientAngle = Number(e.target.value);
    gradAngleText.textContent = `${state.gradientAngle}°`;
    renderGradientGenerator();
  });

  btnGradLinear.addEventListener('click', () => {
    state.gradientType = 'linear';
    btnGradLinear.classList.add('active');
    btnGradRadial.classList.remove('active');
    document.getElementById('gradAngleGroup').style.display = 'flex';
    renderGradientGenerator();
  });

  btnGradRadial.addEventListener('click', () => {
    state.gradientType = 'radial';
    btnGradRadial.classList.add('active');
    btnGradLinear.classList.remove('active');
    document.getElementById('gradAngleGroup').style.display = 'none';
    renderGradientGenerator();
  });

  btnCopyGradient.addEventListener('click', () => {
    copyToClipboard(gradientCodeBox.textContent, '¡Código de degradado copiado!');
  });

  // Side swatches for Extractor View
  function renderExtractorSideSwatches() {
    const mount = document.getElementById('extractorPalettePreview');
    if (!mount) return;
    mount.innerHTML = '';

    state.palette.forEach((hsv, i) => {
      const rgb = ColorMath.hsvToRgb(hsv.h, hsv.s, hsv.v);
      const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
      const textColor = ColorMath.getContrastTextColor(rgb.r, rgb.g, rgb.b);

      const item = document.createElement('div');
      item.style.backgroundColor = hex;
      item.style.color = textColor;
      item.style.padding = '10px 14px';
      item.style.borderRadius = '6px';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'space-between';
      item.style.fontFamily = 'monospace';
      item.style.fontWeight = 'bold';
      item.style.cursor = 'pointer';
      item.innerHTML = `<span>Color ${i + 1}</span> <span>${hex}</span>`;
      item.addEventListener('click', () => {
        copyToClipboard(hex, `¡Código ${hex} copiado!`);
      });
      mount.appendChild(item);
    });
  }

  // =========================================================================
  // Export Code Modal Logic
  // =========================================================================
  function updateExportCode() {
    const hexList = state.palette.map(hsv => {
      const rgb = ColorMath.hsvToRgb(hsv.h, hsv.s, hsv.v);
      return ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
    });

    let output = '';
    switch (activeExportTab) {
      case 'css':
        output = `:root {\n` +
          hexList.map((hex, i) => `  --color-${i + 1}: ${hex};`).join('\n') +
          `\n}`;
        break;
      case 'tailwind':
        output = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n` +
          `        palette: {\n` +
          hexList.map((hex, i) => `          '${i + 1}': '${hex}',`).join('\n') +
          `\n        }\n      }\n    }\n  }\n};`;
        break;
      case 'json':
        output = JSON.stringify({
          harmony: state.activeRule,
          baseIndex: state.baseIndex,
          colors: hexList
        }, null, 2);
        break;
      case 'svg':
        output = `<svg width="500" height="100" xmlns="http://www.w3.org/2000/svg">\n` +
          hexList.map((hex, i) => `  <rect x="${i * 100}" y="0" width="100" height="100" fill="${hex}" />`).join('\n') +
          `\n</svg>`;
        break;
    }

    exportCodeBox.textContent = output;
  }

  function downloadPalettePng() {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = state.theme === 'dark' ? '#18181b' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const hexList = state.palette.map(hsv => {
      const rgb = ColorMath.hsvToRgb(hsv.h, hsv.s, hsv.v);
      return { hex: ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b), rgb };
    });

    const swatchWidth = 160;
    const swatchHeight = 260;
    const gap = 20;
    const totalWidth = 5 * swatchWidth + 4 * gap;
    const startX = (canvas.width - totalWidth) / 2;
    const startY = 50;

    hexList.forEach((item, i) => {
      const x = startX + i * (swatchWidth + gap);
      ctx.fillStyle = item.hex;
      ctx.beginPath();
      ctx.roundRect(x, startY, swatchWidth, swatchHeight, 12);
      ctx.fill();

      ctx.strokeStyle = i === state.baseIndex ? '#ffffff' : 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = i === state.baseIndex ? 4 : 1;
      ctx.stroke();

      ctx.fillStyle = ColorMath.getContrastTextColor(item.rgb.r, item.rgb.g, item.rgb.b);
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.hex, x + swatchWidth / 2, startY + swatchHeight - 24);

      if (i === state.baseIndex) {
        ctx.font = '12px sans-serif';
        ctx.fillText('BASE', x + swatchWidth / 2, startY + 30);
      }
    });

    const link = document.createElement('a');
    link.download = `paleta-${state.activeRule}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('¡Imagen PNG de la paleta descargada!');
  }

  const openExportModal = () => {
    updateExportCode();
    exportModal.classList.add('active');
  };

  btnExport.addEventListener('click', openExportModal);
  btnExportBottom.addEventListener('click', openExportModal);

  btnCloseModal.addEventListener('click', () => {
    exportModal.classList.remove('active');
  });

  exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) exportModal.classList.remove('active');
  });

  exportTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      exportTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeExportTab = tab.dataset.type;
      updateExportCode();
    });
  });

  btnCopyExport.addEventListener('click', () => {
    copyToClipboard(exportCodeBox.textContent, '¡Código exportado copiado!');
  });

  btnDownloadPng.addEventListener('click', downloadPalettePng);

  // Keyboard shortcut: Spacebar for randomize
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      randomizePalette();
    }
  });

  // Initial Boot
  renderHarmonyCarousel();

  // Initial Base Color
  const initialBaseHsv = { h: 86, s: 0.41, v: 0.76 };
  state.palette = ColorMath.generateHarmony(
    state.activeRule,
    initialBaseHsv,
    state.baseIndex,
    state.spreadAngle
  );

  colorWheel.setState(state.palette, state.baseIndex, state.activeRule, state.spreadAngle);
  renderAllViews();
});
