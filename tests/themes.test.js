import { describe, it, expect } from 'vitest';
import { PRESETS, themeVars } from '../src/themes.js';

const rgb = v => (v.startsWith('#') ? [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16)) : v.split(',').map(Number));
const lum = c => {
  const [r, g, b] = c.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

describe('theme legibility (WCAG contrast on the guide panel)', () => {
  for (const p of PRESETS) {
    it(p.name, () => {
      const v = themeVars(p);
      const panel = rgb(v['--panel-rgb']);
      expect(contrast(rgb(v['--ink']), panel), 'body text').toBeGreaterThanOrEqual(7);
      expect(contrast(rgb(v['--ink-dim']), panel), 'secondary text').toBeGreaterThanOrEqual(4.5);
      expect(contrast(rgb(v['--accent-rgb']), panel), 'gold headings').toBeGreaterThanOrEqual(4.5);
      expect(contrast(rgb(v['--on-accent']), rgb(v['--accent-rgb'])), 'text on gold buttons').toBeGreaterThanOrEqual(4.5);
    });
  }
});
