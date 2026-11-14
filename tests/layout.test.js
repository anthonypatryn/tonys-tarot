import { describe, it, expect } from 'vitest';
import { computeLayout, maxClarifiers } from '../src/layout.js';
import { SPREADS } from '../src/spreads.js';
import { DECKS } from '../src/decks.js';

const SCREENS = [
  ['small phone', 320, 568], ['iPhone SE', 375, 667], ['phone', 375, 812], ['big phone', 430, 932], ['phone landscape', 780, 360],
  ['tablet', 768, 1024], ['tablet landscape', 1024, 768], ['laptop', 1280, 800], ['desktop', 1920, 1080],
];
const ratios = [...new Set(DECKS.map(d => d.ratio))];
const overlap = (a, b, w, h) => Math.abs(a.x - b.x) < w - 0.5 && Math.abs(a.y - b.y) < h - 0.5;

describe('card layout', () => {
  for (const [name, W, H] of SCREENS) {
    it(`${name} ${W}x${H}: every spread fits on the cloth and cards never overlap`, () => {
      const problems = [];
      for (const spread of SPREADS) for (const ratio of ratios) for (const clar of [0, 3, 6].filter(n => n <= maxClarifiers(W, H, spread, ratio))) for (const phase of ['reveal', 'done']) {
        const L = computeLayout(W, H, spread, clar, ratio, { phase });
        const tag = `${spread.id} +${clar} r${ratio} ${phase}`;
        const hw = L.cardW / 2, hh = L.cardH / 2;
        const right = W - (L.narrow ? 0 : L.panelW);
        const bottom = H - (L.narrow ? L.sheetH : 0);
        if (L.cardW < 38) problems.push(`${tag}: cards only ${L.cardW}px wide`);
        L.slots.forEach((s, i) => {
          if (s.x - hw < 0 || s.x + hw > right || s.y - hh < L.topBar - 2 || s.y + hh > bottom + 1)
            problems.push(`${tag}: slot ${i + 1} off the table`);
          L.slots.slice(i + 1).forEach((t, j) => { if (overlap(s, t, L.cardW, L.cardH)) problems.push(`${tag}: slots ${i + 1} & ${i + j + 2} overlap`); });
          if (overlap(s, L.deck, L.cardW, L.cardH)) problems.push(`${tag}: slot ${i + 1} covers the deck`);
        });
      }
      expect(problems).toEqual([]);
    });
  }
  it('there is room for at least two clarifying cards on any phone 375px wide or bigger', () => {
    const tight = [];
    for (const [name, W, H] of SCREENS) for (const spread of SPREADS) for (const ratio of ratios)
      if (W >= 375 && maxClarifiers(W, H, spread, ratio) < 2) tight.push(`${name} ${spread.id} r${ratio}: ${maxClarifiers(W, H, spread, ratio)}`);
    expect(tight).toEqual([]);
  });
  it('cards are a comfortable size for one- and three-card readings on a phone', () => {
    const one = SPREADS.find(s => s.positions.length === 1);
    const three = SPREADS.find(s => s.positions.length === 3);
    expect(computeLayout(375, 812, one, 0, 1.75, { phase: 'reveal' }).cardW).toBeGreaterThanOrEqual(70);
    expect(computeLayout(375, 812, three, 0, 1.75, { phase: 'reveal' }).cardW).toBeGreaterThanOrEqual(60);
  });
});
