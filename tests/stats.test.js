import { describe, it, expect } from 'vitest';
import { dayKey, groupByDay, monthGrid, streaks, insights, mergeBackup } from '../src/readingStats.js';

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).toISOString();
const reading = (id, date, cards = [{ id: 'T-00', reversed: false }]) => ({ id, date, spreadId: 'one', cards });

describe('reading stats', () => {
  it('dayKey uses the local calendar day', () => {
    expect(dayKey(new Date(2026, 10, 14, 23, 59))).toBe('2026-11-14');
    expect(dayKey(new Date(2026, 0, 1, 0, 1))).toBe('2026-01-01');
  });
  it('monthGrid gives 6 full weeks starting on Sunday, covering the month', () => {
    const g = monthGrid(2026, 10); // November 2026 starts on a Sunday
    expect(g).toHaveLength(42);
    expect(g[0].date.getDay()).toBe(0);
    expect(g.filter(c => c.inMonth)).toHaveLength(30);
    expect(g.find(c => c.inMonth).key).toBe('2026-11-01');
    expect(monthGrid(2027, 1).filter(c => c.inMonth)).toHaveLength(28);
  });
  it('groups readings by day', () => {
    const m = groupByDay([reading('a', at(2026, 11, 14, 9)), reading('b', at(2026, 11, 14, 21)), reading('c', at(2026, 11, 13))]);
    expect(m.get('2026-11-14')).toHaveLength(2);
    expect(m.get('2026-11-13')).toHaveLength(1);
  });
  it('counts current and longest streaks', () => {
    const today = new Date(2026, 10, 14, 15);
    const items = ['2026-11-14', '2026-11-13', '2026-11-12', '2026-11-08', '2026-11-07', '2026-11-06', '2026-11-05']
      .map((k, i) => { const [y, m, d] = k.split('-').map(Number); return reading(String(i), at(y, m, d)); });
    expect(streaks(items, today)).toEqual({ current: 3, longest: 4 });
    expect(streaks(items.slice(1), today).current).toBe(2); // nothing yet today: yesterday's streak still counts
    expect(streaks([], today)).toEqual({ current: 0, longest: 0 });
  });
  it('summarises cards, suits and reversals', () => {
    const s = insights([
      reading('a', at(2026, 11, 1), [{ id: 'T-00', reversed: true }, { id: 'C-02', reversed: false }]),
      reading('b', at(2026, 11, 2), [{ id: 'T-00', reversed: false }, { id: 'P-KI', reversed: true }]),
    ]);
    expect(s).toMatchObject({ readings: 2, cards: 4, reversedPct: 50 });
    expect(s.top[0]).toEqual({ id: 'T-00', n: 2 });
    expect(s.suits).toEqual({ Major: 2, Wands: 0, Cups: 1, Swords: 0, Pentacles: 1 });
  });
  it('restoring a backup adds only new readings and rejects junk', () => {
    const cur = [reading('a', at(2026, 11, 2))];
    const { merged, added } = mergeBackup(cur, [reading('a', at(2026, 1, 1)), reading('b', at(2026, 11, 3)), { nope: 1 }]);
    expect(added).toBe(1);
    expect(merged.map(r => r.id)).toEqual(['b', 'a']);
    expect(merged.find(r => r.id === 'a').date).toBe(cur[0].date);
    expect(() => mergeBackup(cur, { not: 'a list' })).toThrow();
  });
});
