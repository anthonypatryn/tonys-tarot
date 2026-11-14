import { describe, it, expect } from 'vitest';
import { CARDS, CARD_BY_ID, shuffleDeck } from '../src/deck.js';
import { SPREADS } from '../src/spreads.js';

describe('card data', () => {
  it('has 78 unique cards, each with a title and both meanings', () => {
    expect(CARDS).toHaveLength(78);
    expect(new Set(CARDS.map(c => c.id)).size).toBe(78);
    for (const c of CARDS) {
      expect(c.title, c.id).toBeTruthy();
      expect(c.upright?.length, `${c.id} upright`).toBeGreaterThan(10);
      expect(c.reversed?.length, `${c.id} reversed`).toBeGreaterThan(10);
    }
  });
  it('has 22 majors and 14 cards in each suit', () => {
    expect(CARDS.filter(c => c.id.startsWith('T-'))).toHaveLength(22);
    for (const s of 'WCSP') expect(CARDS.filter(c => c.id.startsWith(`${s}-`)), s).toHaveLength(14);
  });
});

describe('spreads', () => {
  it('every spread has a name, questions and labeled positions', () => {
    expect(SPREADS.length).toBeGreaterThanOrEqual(8);
    for (const s of SPREADS) {
      expect(s.name).toBeTruthy();
      expect(s.positions.length).toBeGreaterThan(0);
      for (const p of s.positions) {
        expect(p.label, s.id).toBeTruthy();
        expect(Number.isFinite(p.x) && Number.isFinite(p.y), s.id).toBe(true);
      }
      expect(new Set(s.positions.map(p => `${p.x},${p.y}`)).size, `${s.id} has stacked positions`).toBe(s.positions.length);
    }
  });
});

describe('shuffle', () => {
  it('returns all 78 cards exactly once, in a new order each time', () => {
    const a = shuffleDeck(), b = shuffleDeck();
    expect(a).toHaveLength(78);
    expect(new Set(a.map(c => c.id)).size).toBe(78);
    expect(a.every(c => CARD_BY_ID[c.id])).toBe(true);
    expect(a.map(c => c.id).join()).not.toBe(b.map(c => c.id).join());
  });
  it('lands cards reversed about half the time', () => {
    let rev = 0, n = 0;
    for (let i = 0; i < 200; i++) for (const c of shuffleDeck()) { n++; if (c.reversed) rev++; }
    expect(rev / n).toBeGreaterThan(0.45);
    expect(rev / n).toBeLessThan(0.55);
  });
  it('gives every card a fair chance to be on top (no bias)', () => {
    const top = new Map();
    for (let i = 0; i < 7800; i++) { const id = shuffleDeck().at(-1).id; top.set(id, (top.get(id) || 0) + 1); }
    expect(top.size).toBe(78);
    for (const n of top.values()) expect(n).toBeLessThan(220); // expected about 100 each
  });
});
