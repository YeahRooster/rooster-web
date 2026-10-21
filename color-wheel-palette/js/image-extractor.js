/**
 * Image Color Extractor & Interactive Pin Sampler
 * Replicates Adobe Color's "Extract from Image" (Extraer de Imagen)
 */

class ImageExtractor {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = Object.assign({
      onPaletteExtracted: () => {},
      onColorSampled: () => {}
    }, options);

    this.image = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    
    // 5 pins on the image: { xRatio, yRatio, color: { r, g, b, hex, h, s, v } }
    this.pins = [];
    this.activeMood = 'colorful';
    this.draggedPinIndex = -1;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="extractor-wrapper">
        <div class="extractor-toolbar">
          <div class="mood-selector">
            <span class="mood-title">Modo de Extracción:</span>
            <div class="mood-buttons">
              <button class="mood-btn active" data-mood="colorful">Colorido</button>
              <button class="mood-btn" data-mood="bright">Brillante</button>
              <button class="mood-btn" data-mood="muted">Suave</button>
              <button class="mood-btn" data-mood="deep">Profundo</button>
              <button class="mood-btn" data-mood="dark">Oscuro</button>
            </div>
          </div>
          <div class="extractor-actions">
            <label class="btn btn-secondary upload-label">
              <svg class="btn-svg-icon" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1"/><path d="m16 9-4-4-4 4"/><path d="M12 5v11"/></svg>
              <span>Cargar Imagen</span>
              <input type="file" id="imageFileInput" accept="image/*" style="display: none;">
            </label>
          </div>
        </div>

        <div class="image-stage" id="imageStage">
          <div class="drop-zone-placeholder" id="dropZonePlaceholder">
            <div class="drop-icon">
              <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.65;">
                <rect x="6" y="6" width="36" height="36" rx="8"/>
                <circle cx="17" cy="17" r="3.5"/>
                <path d="m42 30-10-10L10 42"/>
              </svg>
            </div>
            <div class="drop-text">Arrastra una imagen aquí o haz clic en "Cargar Imagen"</div>
            <div class="drop-subtext">Formatos soportados: JPG, PNG, WEBP, SVG</div>
          </div>
          <div class="image-display-container" id="imageDisplayContainer" style="display: none;">
            <img id="loadedImageDisplay" class="extracted-img" alt="Imagen cargada">
            <div class="pins-overlay" id="pinsOverlay"></div>
          </div>
        </div>
      </div>
    `;

    this.dropZonePlaceholder = this.container.querySelector('#dropZonePlaceholder');
    this.imageDisplayContainer = this.container.querySelector('#imageDisplayContainer');
    this.loadedImageDisplay = this.container.querySelector('#loadedImageDisplay');
    this.pinsOverlay = this.container.querySelector('#pinsOverlay');
    this.fileInput = this.container.querySelector('#imageFileInput');
    this.imageStage = this.container.querySelector('#imageStage');
  }

  bindEvents() {
    // File Input
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.loadFile(file);
    });

    // Drag & Drop
    const stage = this.imageStage;
    ['dragenter', 'dragover'].forEach(name => {
      stage.addEventListener(name, (e) => {
        e.preventDefault();
        stage.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      stage.addEventListener(name, (e) => {
        e.preventDefault();
        stage.classList.remove('drag-active');
      });
    });

    stage.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.loadFile(file);
      }
    });

    // Mood Buttons
    this.container.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeMood = btn.dataset.mood;
        if (this.image) {
          this.extractPalette(this.activeMood);
        }
      });
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.updatePinPositions();
    });
  }

  /**
   * Load an image file into memory and extract palette
   */
  loadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        this.canvas.width = img.naturalWidth;
        this.canvas.height = img.naturalHeight;
        this.ctx.drawImage(img, 0, 0);

        this.loadedImageDisplay.src = e.target.result;
        this.dropZonePlaceholder.style.display = 'none';
        this.imageDisplayContainer.style.display = 'block';

        // Wait a tick for layout bounding rect
        setTimeout(() => {
          this.extractPalette(this.activeMood);
        }, 50);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Load from existing image URL (e.g. sample image)
   */
  loadFromUrl(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.image = img;
      this.canvas.width = img.naturalWidth;
      this.canvas.height = img.naturalHeight;
      this.ctx.drawImage(img, 0, 0);

      this.loadedImageDisplay.src = url;
      this.dropZonePlaceholder.style.display = 'none';
      this.imageDisplayContainer.style.display = 'block';

      setTimeout(() => {
        this.extractPalette(this.activeMood);
      }, 50);
    };
    img.src = url;
  }

  /**
   * Extract 5 dominant/harmonious colors based on mood
   */
  extractPalette(mood = 'colorful') {
    if (!this.image) return;

    // Downsample for ultra-fast clustering
    const sampleSize = 120;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = sampleSize;
    offCanvas.height = sampleSize;
    const offCtx = offCanvas.getContext('2d');
    offCtx.drawImage(this.image, 0, 0, sampleSize, sampleSize);

    const imgData = offCtx.getImageData(0, 0, sampleSize, sampleSize).data;
    const pixels = [];

    for (let i = 0; i < imgData.length; i += 4) {
      const a = imgData[i + 3];
      if (a < 128) continue; // ignore transparent
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const hsv = ColorMath.rgbToHsv(r, g, b);

      const pixelIndex = i / 4;
      const x = pixelIndex % sampleSize;
      const y = Math.floor(pixelIndex / sampleSize);

      pixels.push({
        r, g, b, hsv,
        xRatio: x / sampleSize,
        yRatio: y / sampleSize
      });
    }

    if (pixels.length === 0) return;

    // Filter / score pixels according to mood
    let candidatePool = pixels;
    switch (mood) {
      case 'colorful':
        candidatePool = pixels.filter(p => p.hsv.s > 0.25 && p.hsv.v > 0.2);
        if (candidatePool.length < 50) candidatePool = pixels;
        break;
      case 'bright':
        candidatePool = pixels.filter(p => p.hsv.v > 0.55);
        if (candidatePool.length < 50) candidatePool = pixels;
        break;
      case 'muted':
        candidatePool = pixels.filter(p => p.hsv.s >= 0.1 && p.hsv.s <= 0.6 && p.hsv.v > 0.35);
        if (candidatePool.length < 50) candidatePool = pixels;
        break;
      case 'deep':
        candidatePool = pixels.filter(p => p.hsv.s > 0.3 && p.hsv.v >= 0.15 && p.hsv.v <= 0.65);
        if (candidatePool.length < 50) candidatePool = pixels;
        break;
      case 'dark':
        candidatePool = pixels.filter(p => p.hsv.v < 0.45);
        if (candidatePool.length < 50) candidatePool = pixels;
        break;
    }

    // K-Means clustering (k = 5) in Lab or HSV distance
    const k = 5;
    let centroids = [];
    
    // Choose 5 diverse seed pixels
    const step = Math.floor(candidatePool.length / k);
    for (let i = 0; i < k; i++) {
      const idx = Math.min(i * step + Math.floor(step / 2), candidatePool.length - 1);
      centroids.push({ ...candidatePool[idx] });
    }

    // 6 iterations of K-Means
    for (let iter = 0; iter < 6; iter++) {
      const clusters = [[], [], [], [], []];

      for (let p of candidatePool) {
        let minDist = Infinity;
        let bestIdx = 0;
        for (let c = 0; c < k; c++) {
          const dist = Math.hypot(
            p.r - centroids[c].r,
            p.g - centroids[c].g,
            p.b - centroids[c].b
          );
          if (dist < minDist) {
            minDist = dist;
            bestIdx = c;
          }
        }
        clusters[bestIdx].push(p);
      }

      // Recompute centroids
      for (let c = 0; c < k; c++) {
        if (clusters[c].length > 0) {
          let sumR = 0, sumG = 0, sumB = 0, sumX = 0, sumY = 0;
          for (let p of clusters[c]) {
            sumR += p.r;
            sumG += p.g;
            sumB += p.b;
            sumX += p.xRatio;
            sumY += p.yRatio;
          }
          const len = clusters[c].length;
          const avgR = Math.round(sumR / len);
          const avgG = Math.round(sumG / len);
          const avgB = Math.round(sumB / len);
          centroids[c] = {
            r: avgR,
            g: avgG,
            b: avgB,
            hsv: ColorMath.rgbToHsv(avgR, avgG, avgB),
            xRatio: sumX / len,
            yRatio: sumY / len
          };
        }
      }
    }

    // Sort extracted centroids harmoniously by hue/lightness
    centroids.sort((a, b) => a.hsv.h - b.hsv.h);

    // Setup 5 interactive pins positioned over the image
    this.pins = centroids.map((c, i) => {
      // Find actual pixel nearest to centroid in the original image coordinates
      return {
        index: i,
        xRatio: ColorMath.clamp(c.xRatio, 0.05, 0.95),
        yRatio: ColorMath.clamp(c.yRatio, 0.05, 0.95),
        color: {
          r: c.r,
          g: c.g,
          b: c.b,
          hex: ColorMath.rgbToHex(c.r, c.g, c.b),
          hsv: c.hsv
        }
      };
    });

    this.renderPins();

    const palette = this.pins.map(p => p.color.hsv);
    this.options.onPaletteExtracted(palette);
  }

  /**
   * Render Draggable Pins on Image
   */
  renderPins() {
    this.pinsOverlay.innerHTML = '';
    const imgRect = this.loadedImageDisplay.getBoundingClientRect();

    this.pins.forEach((pin, index) => {
      const pinEl = document.createElement('div');
      pinEl.className = 'image-pin';
      pinEl.dataset.index = index;

      const x = pin.xRatio * imgRect.width;
      const y = pin.yRatio * imgRect.height;
      pinEl.style.transform = `translate(${x}px, ${y}px)`;

      pinEl.innerHTML = `
        <div class="pin-ring" style="background-color: ${pin.color.hex};">
          <span class="pin-number" style="color: ${ColorMath.getContrastTextColor(pin.color.r, pin.color.g, pin.color.b)};">${index + 1}</span>
        </div>
      `;

      this.bindPinDrag(pinEl, index);
      this.pinsOverlay.appendChild(pinEl);
    });
  }

  updatePinPositions() {
    if (!this.loadedImageDisplay || !this.pinsOverlay) return;
    const imgRect = this.loadedImageDisplay.getBoundingClientRect();
    const pinEls = this.pinsOverlay.querySelectorAll('.image-pin');

    pinEls.forEach((el, index) => {
      const pin = this.pins[index];
      if (pin) {
        const x = pin.xRatio * imgRect.width;
        const y = pin.yRatio * imgRect.height;
        el.style.transform = `translate(${x}px, ${y}px)`;
      }
    });
  }

  /**
   * Bind drag and live sampling on pin
   */
  bindPinDrag(pinEl, index) {
    const onMove = (e) => {
      if (this.draggedPinIndex !== index) return;
      const rect = this.loadedImageDisplay.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      let x = clientX - rect.left;
      let y = clientY - rect.top;

      x = ColorMath.clamp(x, 0, rect.width);
      y = ColorMath.clamp(y, 0, rect.height);

      const xRatio = x / rect.width;
      const yRatio = y / rect.height;

      this.pins[index].xRatio = xRatio;
      this.pins[index].yRatio = yRatio;

      pinEl.style.transform = `translate(${x}px, ${y}px)`;

      // Sample pixel color from full-res canvas
      const imgX = Math.floor(xRatio * this.canvas.width);
      const imgY = Math.floor(yRatio * this.canvas.height);
      const pixel = this.ctx.getImageData(imgX, imgY, 1, 1).data;

      const r = pixel[0], g = pixel[1], b = pixel[2];
      const hex = ColorMath.rgbToHex(r, g, b);
      const hsv = ColorMath.rgbToHsv(r, g, b);

      this.pins[index].color = { r, g, b, hex, hsv };

      const ring = pinEl.querySelector('.pin-ring');
      ring.style.backgroundColor = hex;
      pinEl.querySelector('.pin-number').style.color = ColorMath.getContrastTextColor(r, g, b);

      this.options.onColorSampled(index, hsv);
    };

    const onUp = () => {
      this.draggedPinIndex = -1;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    const onDown = (e) => {
      e.preventDefault();
      this.draggedPinIndex = index;
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    };

    pinEl.addEventListener('mousedown', onDown);
    pinEl.addEventListener('touchstart', onDown, { passive: false });
  }

  getPalette() {
    return this.pins.map(p => p.color.hsv);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageExtractor;
}
