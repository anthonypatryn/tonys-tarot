// Table themes: cloth color, accent (gold) color, and text color.
// Everything else (cloth shading, panel tint, button gradients) is derived from those three.

export const PRESETS = [
  { key: 'crimson', name: 'Crimson Velvet', cloth: '#8f101a', accent: '#e8c47a', ink: '#f6ead3' },
  { key: 'sapphire', name: 'Midnight Sapphire', cloth: '#1b3478', accent: '#cdd6eb', ink: '#eef1fb' },
  { key: 'emerald', name: 'Emerald Grove', cloth: '#11603d', accent: '#e6c878', ink: '#f1f5e8' },
  { key: 'amethyst', name: 'Royal Amethyst', cloth: '#5a2479', accent: '#eeb4a0', ink: '#f8ecf4' },
  { key: 'obsidian', name: 'Obsidian', cloth: '#262629', accent: '#d9a441', ink: '#f2f2f2' },
  { key: 'rose', name: 'Desert Rose', cloth: '#9a4c3f', accent: '#fae2b4', ink: '#fff6ea' },
  { key: 'teal', name: 'Deep Sea', cloth: '#0d5a62', accent: '#9fe3d6', ink: '#ecfbf8' },
];

// Printed altar-cloth patterns. Each has the original photo and a white-on-transparent mask that can be tinted any color.
export const CLOTHS = {
  pendulum: { name: 'Pendulum Board', img: '/cloths/pendulum.webp', mask: '/cloths/pendulum-mask.webp' },
  serpent: { name: 'Serpent & Moons', img: '/cloths/serpent.webp', mask: '/cloths/serpent-mask.webp' },
  zodiac: { name: 'Zodiac Wheel', img: '/cloths/zodiac.webp', mask: '/cloths/zodiac-mask.webp' },
  metatron: { name: 'Metatron’s Cube', img: '/cloths/metatron.webp', mask: '/cloths/metatron-mask.webp' },
};

const hexToRgb = h => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const shade = (rgb, t) => mix(rgb, t < 0 ? [0, 0, 0] : [255, 255, 255], Math.abs(t));
const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

// Text color for a solid accent-colored button: whichever of near-black or white reads better on it.
const contrastRatio = (x, y) => { const [p, q] = [lumW(x), lumW(y)].sort((m, n) => n - m); return (p + 0.05) / (q + 0.05); };
const lumW = rgb => { const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
function onColor(bg, dark) {
  return contrastRatio(bg, dark) >= contrastRatio(bg, [255, 255, 255]) ? rgbToHex(dark) : '#ffffff';
}

export function themeVars({ cloth, accent, ink }) {
  const c = hexToRgb(cloth), a = hexToRgb(accent), k = hexToRgb(ink);
  const panel = shade(c, -0.86);
  return {
    '--cloth-1': rgbToHex(shade(c, 0.12)),
    '--cloth-2': rgbToHex(c),
    '--cloth-3': rgbToHex(shade(c, -0.36)),
    '--cloth-4': rgbToHex(shade(c, -0.55)),
    '--cloth-hi-rgb': shade(c, 0.5).map(Math.round).join(', '),
    '--accent-rgb': a.join(', '),
    '--gold-hi': rgbToHex(shade(a, 0.15)),
    '--gold-lo': rgbToHex(shade(a, -0.15)),
    '--on-accent': onColor(a, shade(c, -0.8)),
    '--panel-rgb': panel.map(Math.round).join(', '),
    '--ink': ink,
    '--ink-dim': rgbToHex(mix(k, panel, 0.25)),
  };
}

export function applyTheme(theme) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(themeVars(theme))) root.style.setProperty(k, v);
}

const KEY = 'tarot-theme-v1';
export function loadTheme() {
  try {
    const t = JSON.parse(localStorage.getItem(KEY));
    if (t && t.cloth && t.accent && t.ink) return t;
  } catch { /* ignore */ }
  return { ...PRESETS[0] };
}
export function saveTheme(t) {
  try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* ignore */ }
}
