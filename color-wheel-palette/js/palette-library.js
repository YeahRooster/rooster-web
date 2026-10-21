/**
 * Palette Library & LocalStorage Manager
 */

const PaletteLibrary = {
  STORAGE_KEY: 'color_studio_saved_palettes',

  /**
   * Default starter palettes
   */
  getDefaults() {
    return [
      {
        id: 'starter-1',
        name: 'Cyberpunk Neon',
        rule: 'triad',
        timestamp: Date.now() - 3600000 * 24,
        colors: [
          { h: 320, s: 0.9, v: 0.95 },
          { h: 280, s: 0.85, v: 0.8 },
          { h: 185, s: 0.95, v: 0.9 },
          { h: 150, s: 0.8, v: 0.85 },
          { h: 45, s: 0.9, v: 0.95 }
        ]
      },
      {
        id: 'starter-2',
        name: 'Atardecer Mediterráneo',
        rule: 'analogous',
        timestamp: Date.now() - 3600000 * 12,
        colors: [
          { h: 15, s: 0.85, v: 0.95 },
          { h: 35, s: 0.8, v: 0.9 },
          { h: 48, s: 0.75, v: 0.95 },
          { h: 200, s: 0.7, v: 0.85 },
          { h: 220, s: 0.85, v: 0.65 }
        ]
      },
      {
        id: 'starter-3',
        name: 'Nórdico Minimalista',
        rule: 'monochromatic',
        timestamp: Date.now() - 3600000 * 3,
        colors: [
          { h: 210, s: 0.15, v: 0.95 },
          { h: 210, s: 0.3, v: 0.8 },
          { h: 210, s: 0.45, v: 0.65 },
          { h: 210, s: 0.6, v: 0.45 },
          { h: 210, s: 0.75, v: 0.25 }
        ]
      }
    ];
  },

  getAll() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) {
        const defaults = this.getDefaults();
        this.saveAll(defaults);
        return defaults;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.warn('LocalStorage error:', e);
      return this.getDefaults();
    }
  },

  saveAll(palettes) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(palettes));
    } catch (e) {
      console.error('Error saving to LocalStorage:', e);
    }
  },

  save(name, colorsHsv, rule = 'custom') {
    const list = this.getAll();
    const newEntry = {
      id: 'palette-' + Date.now(),
      name: name.trim() || 'Mi Paleta ' + (list.length + 1),
      rule: rule,
      timestamp: Date.now(),
      colors: colorsHsv.map(c => ({ h: Math.round(c.h), s: Math.round(c.s * 100) / 100, v: Math.round(c.v * 100) / 100 }))
    };
    list.unshift(newEntry);
    this.saveAll(list);
    return newEntry;
  },

  delete(id) {
    let list = this.getAll();
    list = list.filter(item => item.id !== id);
    this.saveAll(list);
    return list;
  },

  rename(id, newName) {
    const list = this.getAll();
    const item = list.find(p => p.id === id);
    if (item && newName.trim()) {
      item.name = newName.trim();
      this.saveAll(list);
    }
    return list;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaletteLibrary;
}
