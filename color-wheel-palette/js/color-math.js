/**
 * Color Mathematics & Harmony Rules Engine
 * Replicating Adobe Color Wheel logic
 */

const ColorMath = {
  /**
   * Clamp a value between min and max
   */
  clamp(val, min = 0, max = 1) {
    return Math.min(Math.max(val, min), max);
  },

  /**
   * Normalize hue angle to 0..360
   */
  normalizeHue(h) {
    let hue = h % 360;
    if (hue < 0) hue += 360;
    return hue;
  },

  /**
   * HSV to RGB
   * h: [0, 360), s: [0, 1], v: [0, 1]
   * returns { r, g, b } in [0, 255]
   */
  hsvToRgb(h, s, v) {
    h = this.normalizeHue(h);
    s = this.clamp(s, 0, 1);
    v = this.clamp(v, 0, 1);

    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r1 = 0, g1 = 0, b1 = 0;
    if (h >= 0 && h < 60) {
      r1 = c; g1 = x; b1 = 0;
    } else if (h >= 60 && h < 120) {
      r1 = x; g1 = c; b1 = 0;
    } else if (h >= 120 && h < 180) {
      r1 = 0; g1 = c; b1 = x;
    } else if (h >= 180 && h < 240) {
      r1 = 0; g1 = x; b1 = c;
    } else if (h >= 240 && h < 300) {
      r1 = x; g1 = 0; b1 = c;
    } else {
      r1 = c; g1 = 0; b1 = x;
    }

    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  },

  /**
   * RGB to HSV
   * r, g, b in [0, 255]
   * returns { h: [0, 360), s: [0, 1], v: [0, 1] }
   */
  rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }

    return { h: Math.round(h * 10) / 10, s, v };
  },

  /**
   * RGB to HEX
   */
  rgbToHex(r, g, b) {
    const toHex = (n) => {
      const hex = Math.round(this.clamp(n, 0, 255)).toString(16).toUpperCase();
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  },

  /**
   * HEX to RGB
   */
  hexToRgb(hex) {
    hex = hex.replace(/^#/, '').trim();
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length !== 6) return null;
    const num = parseInt(hex, 16);
    if (isNaN(num)) return null;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  },

  /**
   * RGB to HSL
   * r, g, b: [0, 255]
   * returns { h: [0, 360), s: [0, 100], l: [0, 100] }
   */
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }

    return {
      h: Math.round(h),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  },

  /**
   * HSL to RGB
   */
  hslToRgb(h, s, l) {
    h = this.normalizeHue(h) / 360;
    s = this.clamp(s / 100, 0, 1);
    l = this.clamp(l / 100, 0, 1);

    if (s === 0) {
      const val = Math.round(l * 255);
      return { r: val, g: val, b: val };
    }

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
      r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
    };
  },

  /**
   * RGB to CMYK
   * returns { c: [0, 100], m: [0, 100], y: [0, 100], k: [0, 100] }
   */
  rgbToCmyk(r, g, b) {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const k = 1 - Math.max(rNorm, gNorm, bNorm);
    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }
    const c = (1 - rNorm - k) / (1 - k);
    const m = (1 - gNorm - k) / (1 - k);
    const y = (1 - bNorm - k) / (1 - k);
    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  },

  /**
   * WCAG Relative Luminance
   */
  getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  },

  /**
   * WCAG Contrast Ratio between two RGB colors (returns 1..21)
   */
  getContrastRatio(rgb1, rgb2) {
    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Determine whether text on this color should be black or white
   */
  getContrastTextColor(r, g, b) {
    const lum = this.getLuminance(r, g, b);
    return lum > 0.35 ? '#111111' : '#ffffff';
  },

  /**
   * Color Blindness Simulations (Brettel / Machado standard LMS approximations)
   * Types: 'protanopia' (red blind), 'deuteranopia' (green blind), 'tritanopia' (blue blind), 'achromatopsia' (monochrome)
   */
  simulateColorBlindness(r, g, b, type) {
    // Linearize RGB
    const toLinear = (c) => {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const toGamma = (c) => {
      c = this.clamp(c, 0, 1);
      return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
    };

    const lr = toLinear(r);
    const lg = toLinear(g);
    const lb = toLinear(b);

    let simR = lr, simG = lg, simB = lb;

    switch (type) {
      case 'protanopia':
        // Missing L cones
        simR = 0.56667 * lr + 0.43333 * lg;
        simG = 0.55833 * lr + 0.44167 * lg;
        simB = 0.24167 * lg + 0.75833 * lb;
        break;

      case 'deuteranopia':
        // Missing M cones
        simR = 0.625 * lr + 0.375 * lg;
        simG = 0.7 * lr + 0.3 * lg;
        simB = 0.3 * lg + 0.7 * lb;
        break;

      case 'tritanopia':
        // Missing S cones
        simR = 0.95 * lr + 0.05 * lg;
        simG = 0.43333 * lg + 0.56667 * lb;
        simB = 0.475 * lg + 0.525 * lb;
        break;

      case 'achromatopsia':
        // Grayscale / total color blindness (luminance formula)
        const lum = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
        simR = lum;
        simG = lum;
        simB = lum;
        break;
    }

    return {
      r: toGamma(simR),
      g: toGamma(simG),
      b: toGamma(simB)
    };
  },

  /**
   * Color Difference / Distance (CIE76 Euclidean distance in RGB/Lab space)
   */
  getColorDistance(rgb1, rgb2) {
    const dr = rgb1.r - rgb2.r;
    const dg = rgb1.g - rgb2.g;
    const db = rgb1.b - rgb2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  },

  /**
   * Global Palette Adjustments
   * @param {Array} palette - Array of { h, s, v }
   * @param {number} tempOffset - -50 to +50 (warm vs cool shift)
   * @param {number} satMultiplier - 0.2 to 2.0
   * @param {number} briMultiplier - 0.2 to 2.0
   */
  adjustGlobalPalette(palette, tempOffset = 0, satMultiplier = 1, briMultiplier = 1) {
    return palette.map(color => {
      let h = color.h;
      if (tempOffset !== 0) {
        // Warm shift: pull towards ~40° (orange/gold)
        // Cool shift: pull towards ~220° (blue)
        const targetHue = tempOffset > 0 ? 38 : 215;
        let diff = targetHue - h;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        const factor = Math.abs(tempOffset) / 100 * 0.45;
        h = this.normalizeHue(h + diff * factor);
      }

      return {
        h,
        s: this.clamp(color.s * satMultiplier, 0, 1),
        v: this.clamp(color.v * briMultiplier, 0.05, 1)
      };
    });
  },

  /**
   * Calculate harmony palette given:
   * @param {string} rule - Rule name (analogous, monochromatic, triad, complementary, split, double-split, square, compound, shades, custom)
   * @param {Object} baseHsv - { h, s, v }
   * @param {number} baseIndex - 0..4 (which swatch is the base)
   * @param {number} spreadAngle - Spread in degrees for analogous/split (default 30)
   * @param {Array} currentPalette - Current palette if custom or preserving values
   * @returns {Array} Array of 5 { h, s, v } objects
   */
  generateHarmony(rule, baseHsv, baseIndex = 2, spreadAngle = 30, currentPalette = null) {
    const h0 = baseHsv.h;
    const s0 = baseHsv.s;
    const v0 = baseHsv.v;
    const palette = new Array(5);

    // If custom and we have an existing palette, return it, updating base
    if (rule === 'custom' && currentPalette && currentPalette.length === 5) {
      const copy = currentPalette.map(c => ({ ...c }));
      copy[baseIndex] = { ...baseHsv };
      return copy;
    }

    const setItem = (idx, h, s, v) => {
      palette[idx] = {
        h: this.normalizeHue(h),
        s: this.clamp(s, 0, 1),
        v: this.clamp(v, 0, 1)
      };
    };

    switch (rule) {
      case 'analogous': {
        const delta = spreadAngle;
        const offsets = [-2 * delta, -delta, 0, delta, 2 * delta];
        for (let i = 0; i < 5; i++) {
          const rel = i - baseIndex;
          const h = h0 + rel * delta;
          const s = i === baseIndex ? s0 : this.clamp(s0 * (1 - Math.abs(rel) * 0.06), 0.1, 1);
          const v = i === baseIndex ? v0 : this.clamp(v0 * (1 - Math.abs(rel) * 0.04), 0.15, 1);
          setItem(i, h, s, v);
        }
        break;
      }

      case 'monochromatic': {
        const steps = [
          { s: s0 * 0.3, v: Math.min(1, v0 + 0.35) },
          { s: s0 * 0.65, v: Math.min(1, v0 + 0.15) },
          { s: s0, v: v0 }, // Base position
          { s: Math.min(1, s0 * 1.05), v: v0 * 0.7 },
          { s: Math.min(1, s0 * 1.15), v: v0 * 0.45 }
        ];
        // Rearrange so baseIndex gets the base position { s: s0, v: v0 }
        const baseStep = steps.splice(2, 1)[0];
        steps.splice(baseIndex, 0, baseStep);

        for (let i = 0; i < 5; i++) {
          setItem(i, h0, steps[i].s, steps[i].v);
        }
        break;
      }

      case 'triad': {
        // Triad has base at h0, and two other points at +120 and +240
        const configs = [
          { h: h0 + 120, s: s0 * 0.7, v: Math.min(1, v0 + 0.2) },
          { h: h0 + 120, s: s0, v: v0 },
          { h: h0, s: s0, v: v0 }, // Base
          { h: h0 + 240, s: s0, v: v0 },
          { h: h0 + 240, s: s0 * 0.7, v: Math.min(1, v0 + 0.2) }
        ];
        const baseConfig = configs.splice(2, 1)[0];
        configs.splice(baseIndex, 0, baseConfig);

        for (let i = 0; i < 5; i++) {
          setItem(i, configs[i].h, configs[i].s, configs[i].v);
        }
        break;
      }

      case 'complementary': {
        const compHue = h0 + 180;
        const configs = [
          { h: h0, s: s0 * 0.5, v: Math.min(1, v0 + 0.25) },
          { h: h0, s: s0 * 0.8, v: v0 * 0.85 },
          { h: h0, s: s0, v: v0 }, // Base
          { h: compHue, s: s0 * 0.8, v: v0 * 0.85 },
          { h: compHue, s: s0, v: v0 }
        ];
        const baseConfig = configs.splice(2, 1)[0];
        configs.splice(baseIndex, 0, baseConfig);

        for (let i = 0; i < 5; i++) {
          setItem(i, configs[i].h, configs[i].s, configs[i].v);
        }
        break;
      }

      case 'split': {
        // Split Complementary: base + (h0 + 180 - delta) + (h0 + 180 + delta)
        const d = spreadAngle || 30;
        const configs = [
          { h: h0, s: s0 * 0.6, v: Math.min(1, v0 + 0.2) },
          { h: h0 + 180 - d, s: s0, v: v0 },
          { h: h0, s: s0, v: v0 }, // Base
          { h: h0 + 180 + d, s: s0, v: v0 },
          { h: h0 + 180 + d, s: s0 * 0.65, v: Math.min(1, v0 + 0.15) }
        ];
        const baseConfig = configs.splice(2, 1)[0];
        configs.splice(baseIndex, 0, baseConfig);

        for (let i = 0; i < 5; i++) {
          setItem(i, configs[i].h, configs[i].s, configs[i].v);
        }
        break;
      }

      case 'double-split': {
        // Double split (tetradic): 2 complementary pairs
        const d = spreadAngle || 40;
        const configs = [
          { h: h0 - d, s: s0, v: v0 },
          { h: h0 + 180 - d, s: s0, v: v0 },
          { h: h0, s: s0, v: v0 }, // Base
          { h: h0 + 180, s: s0, v: v0 },
          { h: h0 + d, s: s0 * 0.7, v: Math.min(1, v0 + 0.2) }
        ];
        const baseConfig = configs.splice(2, 1)[0];
        configs.splice(baseIndex, 0, baseConfig);

        for (let i = 0; i < 5; i++) {
          setItem(i, configs[i].h, configs[i].s, configs[i].v);
        }
        break;
      }

      case 'square': {
        // 4 corners of 90 degrees + 1 tint
        const configs = [
          { h: h0 + 90, s: s0, v: v0 },
          { h: h0 + 180, s: s0, v: v0 },
          { h: h0, s: s0, v: v0 }, // Base
          { h: h0 + 270, s: s0, v: v0 },
          { h: h0, s: s0 * 0.45, v: Math.min(1, v0 + 0.3) }
        ];
        const baseConfig = configs.splice(2, 1)[0];
        configs.splice(baseIndex, 0, baseConfig);

        for (let i = 0; i < 5; i++) {
          setItem(i, configs[i].h, configs[i].s, configs[i].v);
        }
        break;
      }

      case 'compound': {
        // Compound: combination of analogous and complement
        const configs = [
          { h: h0 - 35, s: s0 * 0.8, v: v0 },
          { h: h0 + 145, s: s0 * 0.9, v: v0 },
          { h: h0, s: s0, v: v0 }, // Base
          { h: h0 + 180, s: s0, v: v0 * 0.85 },
          { h: h0 + 35, s: s0 * 0.7, v: Math.min(1, v0 + 0.2) }
        ];
        const baseConfig = configs.splice(2, 1)[0];
        configs.splice(baseIndex, 0, baseConfig);

        for (let i = 0; i < 5; i++) {
          setItem(i, configs[i].h, configs[i].s, configs[i].v);
        }
        break;
      }

      case 'shades': {
        // Same hue, same saturation, descending brightness
        const vSteps = [1.0, 0.8, 0.6, 0.42, 0.25];
        // Ensure base is represented cleanly
        for (let i = 0; i < 5; i++) {
          const factor = (i - baseIndex);
          const v = this.clamp(v0 - factor * 0.18, 0.12, 1);
          setItem(i, h0, s0, i === baseIndex ? v0 : v);
        }
        break;
      }

      case 'custom':
      default: {
        for (let i = 0; i < 5; i++) {
          if (i === baseIndex) {
            setItem(i, h0, s0, v0);
          } else {
            setItem(i, (h0 + (i - baseIndex) * 45) % 360, s0, v0);
          }
        }
        break;
      }
    }

    return palette;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ColorMath;
}
