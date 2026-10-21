/**
 * High-DPI Interactive Color Wheel Canvas
 * Replicates Adobe Color Wheel visual style and interaction
 */

class ColorWheel {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.options = Object.assign({
      radius: 170,
      nodeRadius: 10,
      baseNodeRadius: 13,
      onColorChange: () => {},
      onSelectSwatch: () => {}
    }, options);

    this.palette = [];
    this.baseIndex = 2;
    this.activeRule = 'analogous';
    this.spreadAngle = 30;
    this.brightness = 1.0; // Current base brightness for wheel background

    this.isDragging = false;
    this.draggedIndex = -1;
    this.hoveredIndex = -1;

    // Cache wheel background canvas for maximum performance
    this.wheelBgCanvas = document.createElement('canvas');
    this.wheelBgCtx = this.wheelBgCanvas.getContext('2d');
    this.bgNeedsRedraw = true;

    this.initCanvas();
    this.bindEvents();
  }

  initCanvas() {
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) || 360;
    this.size = size;
    this.canvas.width = size * this.dpr;
    this.canvas.height = size * this.dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.centerX = size / 2;
    this.centerY = size / 2;
    this.wheelRadius = (size / 2) - 24; // margin for nodes on the rim

    this.wheelBgCanvas.width = this.canvas.width;
    this.wheelBgCanvas.height = this.canvas.height;
    this.wheelBgCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.bgNeedsRedraw = true;
    this.render();
  }

  /**
   * Pre-renders the circular HSV gradient wheel
   */
  drawWheelBackground() {
    const ctx = this.wheelBgCtx;
    const cx = this.centerX;
    const cy = this.centerY;
    const r = this.wheelRadius;

    ctx.clearRect(0, 0, this.size, this.size);

    // Create a smooth color wheel using conics and radials
    // 1. Draw outer circle with conic gradient for hues
    const conic = ctx.createConicGradient(-Math.PI / 2, cx, cy);
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 360;
      const rgb = ColorMath.hsvToRgb(angle, 1, this.brightness);
      conic.addColorStop(i / steps, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = conic;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    // 2. Overlay radial gradient from center (white/grey based on brightness) to transparent
    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const centerRgb = ColorMath.hsvToRgb(0, 0, this.brightness);
    radial.addColorStop(0, `rgb(${centerRgb.r}, ${centerRgb.g}, ${centerRgb.b})`);
    radial.addColorStop(0.85, `rgba(${centerRgb.r}, ${centerRgb.g}, ${centerRgb.b}, 0.2)`);
    radial.addColorStop(1, `rgba(${centerRgb.r}, ${centerRgb.g}, ${centerRgb.b}, 0)`);

    ctx.fillStyle = radial;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    ctx.restore();

    // 3. Draw elegant concentric guide circles & outer ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;

    [0.25, 0.5, 0.75, 1.0].forEach(ratio => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * ratio, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Dark sleek outer border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
    ctx.stroke();

    this.bgNeedsRedraw = false;
  }

  /**
   * Set state
   */
  setState(palette, baseIndex, activeRule, spreadAngle) {
    this.palette = palette;
    this.baseIndex = baseIndex;
    this.activeRule = activeRule;
    if (spreadAngle !== undefined) this.spreadAngle = spreadAngle;

    const baseVal = palette[baseIndex] ? palette[baseIndex].v : 1.0;
    if (Math.abs(this.brightness - baseVal) > 0.05) {
      this.brightness = baseVal;
      this.bgNeedsRedraw = true;
    }

    this.render();
  }

  /**
   * Main Render function
   */
  render() {
    if (this.bgNeedsRedraw) {
      this.drawWheelBackground();
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.size, this.size);

    // Draw cached wheel background
    ctx.drawImage(this.wheelBgCanvas, 0, 0, this.size, this.size);

    if (!this.palette || this.palette.length === 0) return;

    // Calculate node coordinates
    const nodeCoords = this.palette.map(color => {
      // ColorMath hue: 0 is Red (usually top in Adobe Color, -PI/2)
      const rad = ((color.h - 90) * Math.PI) / 180;
      const distance = color.s * this.wheelRadius;
      return {
        x: this.centerX + Math.cos(rad) * distance,
        y: this.centerY + Math.sin(rad) * distance,
        color: color
      };
    });

    // Draw connecting geometry lines (Center to nodes & Base to other nodes)
    this.drawHarmonyLines(ctx, nodeCoords);

    // Draw nodes (draw base node last so it sits on top)
    for (let i = 0; i < nodeCoords.length; i++) {
      if (i !== this.baseIndex) {
        this.drawNode(ctx, nodeCoords[i], i, false);
      }
    }
    if (nodeCoords[this.baseIndex]) {
      this.drawNode(ctx, nodeCoords[this.baseIndex], this.baseIndex, true);
    }
  }

  /**
   * Draw connection lines between nodes to visualize harmonic geometry
   */
  drawHarmonyLines(ctx, coords) {
    const base = coords[this.baseIndex];
    if (!base) return;

    ctx.save();
    ctx.lineWidth = 1.5;

    // Center point
    const cx = this.centerX;
    const cy = this.centerY;

    // Center hub point
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw spokes from center to each node
    coords.forEach((coord, i) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(coord.x, coord.y);
      ctx.strokeStyle = i === this.baseIndex ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash(i === this.baseIndex ? [] : [3, 4]);
      ctx.stroke();
    });

    // Draw lines connecting the nodes polygon/curve
    if (this.activeRule === 'triad' || this.activeRule === 'square' || this.activeRule === 'complementary') {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      coords.forEach((coord, idx) => {
        if (idx === 0) ctx.moveTo(coord.x, coord.y);
        else ctx.lineTo(coord.x, coord.y);
      });
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draw individual color node/pin
   */
  drawNode(ctx, coord, index, isBase) {
    const radius = isBase ? this.options.baseNodeRadius : this.options.nodeRadius;
    const isHovered = this.hoveredIndex === index;
    const isDragging = this.draggedIndex === index;
    const rgb = ColorMath.hsvToRgb(coord.color.h, coord.color.s, coord.color.v);
    const colorStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

    ctx.save();

    // Glow / Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = isDragging ? 12 : (isHovered ? 8 : 4);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // Outer white border ring
    ctx.beginPath();
    ctx.arc(coord.x, coord.y, radius + (isDragging ? 2 : 0), 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Reset shadow for inner elements
    ctx.shadowColor = 'transparent';

    // Second dark subtle ring
    ctx.beginPath();
    ctx.arc(coord.x, coord.y, radius - 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 20, 20, 0.25)';
    ctx.fill();

    // Inner Color fill
    ctx.beginPath();
    ctx.arc(coord.x, coord.y, radius - 2.5, 0, Math.PI * 2);
    ctx.fillStyle = colorStr;
    ctx.fill();

    // If Base Node: Draw Adobe-style base indicator (triangle badge / arrow)
    if (isBase) {
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Little indicator triangle pointing into the node
      const rad = ((coord.color.h - 90) * Math.PI) / 180;
      const arrowDist = radius + 9;
      const tipX = coord.x - Math.cos(rad) * 4;
      const tipY = coord.y - Math.sin(rad) * 4;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      // Draw centered small dot or triangle marker
      ctx.arc(coord.x, coord.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Swatch number or center pin
      ctx.fillStyle = ColorMath.getContrastTextColor(rgb.r, rgb.g, rgb.b);
      ctx.font = '600 9px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), coord.x, coord.y);
    }

    ctx.restore();
  }

  /**
   * Event Listeners (Mouse & Touch)
   */
  bindEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const getAngleAndRadius = (pos) => {
      const dx = pos.x - this.centerX;
      const dy = pos.y - this.centerY;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const sat = Math.min(1, Math.max(0, distance / this.wheelRadius));
      return { angle, sat, distance };
    };

    const findNodeIndexAt = (pos) => {
      for (let i = 0; i < this.palette.length; i++) {
        const color = this.palette[i];
        const rad = ((color.h - 90) * Math.PI) / 180;
        const d = color.s * this.wheelRadius;
        const nx = this.centerX + Math.cos(rad) * d;
        const ny = this.centerY + Math.sin(rad) * d;
        const dist = Math.hypot(pos.x - nx, pos.y - ny);
        const hitRadius = (i === this.baseIndex ? this.options.baseNodeRadius : this.options.nodeRadius) + 8;
        if (dist <= hitRadius) {
          return i;
        }
      }
      return -1;
    };

    const onPointerDown = (e) => {
      const pos = getPos(e);
      const hit = findNodeIndexAt(pos);

      if (hit !== -1) {
        this.isDragging = true;
        this.draggedIndex = hit;
        this.options.onSelectSwatch(hit);
      } else {
        // If clicked inside the wheel, move the base color or closest node there
        const { distance } = getAngleAndRadius(pos);
        if (distance <= this.wheelRadius + 15) {
          this.isDragging = true;
          this.draggedIndex = this.baseIndex; // move base node on wheel click
          this.handleDrag(pos);
        }
      }
      this.render();
    };

    const onPointerMove = (e) => {
      const pos = getPos(e);

      if (this.isDragging && this.draggedIndex !== -1) {
        if (e.cancelable && e.touches) e.preventDefault();
        this.handleDrag(pos);
      } else {
        const hit = findNodeIndexAt(pos);
        if (hit !== this.hoveredIndex) {
          this.hoveredIndex = hit;
          this.canvas.style.cursor = hit !== -1 ? 'grab' : 'crosshair';
          this.render();
        }
      }
    };

    const onPointerUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.draggedIndex = -1;
        this.canvas.style.cursor = this.hoveredIndex !== -1 ? 'grab' : 'default';
        this.render();
      }
    };

    this.canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  }

  /**
   * Handle node drag updates
   */
  handleDrag(pos) {
    const { angle, sat } = (() => {
      const dx = pos.x - this.centerX;
      const dy = pos.y - this.centerY;
      let a = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (a < 0) a += 360;
      const d = Math.sqrt(dx * dx + dy * dy);
      const s = Math.min(1, Math.max(0, d / this.wheelRadius));
      return { angle: a, sat: s };
    })();

    const idx = this.draggedIndex;

    if (idx === this.baseIndex) {
      // Dragging the Base Node:
      // Updates hue and saturation of base, keeping its current brightness
      const currentV = this.palette[this.baseIndex] ? this.palette[this.baseIndex].v : 1.0;
      const updatedBase = { h: angle, s: sat, v: currentV };

      // Recalculate palette according to active harmony rule
      const newPalette = ColorMath.generateHarmony(
        this.activeRule,
        updatedBase,
        this.baseIndex,
        this.spreadAngle,
        this.palette
      );

      this.palette = newPalette;
      this.options.onColorChange(newPalette, this.baseIndex, 'wheel-drag-base');
    } else {
      // Dragging a Non-Base Node:
      if (this.activeRule === 'custom') {
        // In custom mode, each node is completely independent
        const currentV = this.palette[idx] ? this.palette[idx].v : 1.0;
        this.palette[idx] = { h: angle, s: sat, v: currentV };
        this.options.onColorChange(this.palette, idx, 'wheel-drag-custom');
      } else if (this.activeRule === 'analogous' || this.activeRule === 'split' || this.activeRule === 'double-split') {
        // Adjust spread angle dynamically based on angle from base node!
        const baseH = this.palette[this.baseIndex].h;
        let diff = Math.abs(angle - baseH);
        if (diff > 180) diff = 360 - diff;
        const multiplier = Math.abs(idx - this.baseIndex) || 1;
        const newSpread = ColorMath.clamp(diff / multiplier, 8, 90);

        this.spreadAngle = newSpread;

        const newPalette = ColorMath.generateHarmony(
          this.activeRule,
          this.palette[this.baseIndex],
          this.baseIndex,
          this.spreadAngle,
          this.palette
        );
        this.palette = newPalette;
        this.options.onColorChange(newPalette, idx, 'wheel-drag-spread');
      } else {
        // For other fixed harmonies (like Monochromatic, Triad),
        // dragging a node can shift saturation or relative brightness
        this.palette[idx].s = sat;
        this.options.onColorChange(this.palette, idx, 'wheel-drag-node');
      }
    }

    this.render();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ColorWheel;
}
