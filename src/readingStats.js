// Pure helpers for the My Readings page: calendar grid, streaks, insights, backup import.
import { CARD_BY_ID } from './deck.js';

const pad = n => String(n).padStart(2, '0');
// Local calendar day, e.g. "2026-11-14".
export const dayKey = d => {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

export function groupByDay(items) {
  const m = new Map();
  for (const r of items) {
    const k = dayKey(r.date);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}

// 6 weeks x 7 days covering the month, weeks starting Sunday.
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { date: d, key: dayKey(d), inMonth: d.getMonth() === month, day: d.getDate() };
  });
}

// Consecutive days with at least one reading. The current streak still counts if today has none yet but yesterday did.
export function streaks(items, today = new Date()) {
  const days = new Set(items.map(r => dayKey(r.date)));
  const step = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  let cur = 0;
  let d = days.has(dayKey(today)) ? today : step(today, -1);
  while (days.has(dayKey(d))) { cur++; d = step(d, -1); }
  let longest = 0;
  for (const k of days) {
    const [y, m, dd] = k.split('-').map(Number);
    const date = new Date(y, m - 1, dd);
    if (days.has(dayKey(step(date, -1)))) continue; // not the start of a run
    let n = 0, x = date;
    while (days.has(dayKey(x))) { n++; x = step(x, 1); }
    longest = Math.max(longest, n);
  }
  return { current: cur, longest };
}

export function insights(items) {
  const counts = new Map();
  const suits = { Major: 0, Wands: 0, Cups: 0, Swords: 0, Pentacles: 0 };
  let cards = 0, reversed = 0;
  for (const r of items) {
    for (const c of r.cards || []) {
      const card = CARD_BY_ID[c.id];
      if (!card) continue;
      cards++;
      if (c.reversed) reversed++;
      counts.set(c.id, (counts.get(c.id) || 0) + 1);
      const s = card.arcana === 'Major' || c.id.startsWith('T-') ? 'Major' : { W: 'Wands', C: 'Cups', S: 'Swords', P: 'Pentacles' }[c.id[0]];
      suits[s]++;
    }
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3).map(([id, n]) => ({ id, n }));
  return { readings: items.length, cards, reversedPct: cards ? Math.round((reversed / cards) * 100) : 0, top, suits };
}

// Merge a backup into the current history: keeps everything, newest first, backup entries never overwrite local ones.
export function mergeBackup(current, backup) {
  if (!Array.isArray(backup)) throw new Error('Not a Tony’s Tarot backup');
  const ok = backup.filter(r => r && typeof r.id === 'string' && r.date && Array.isArray(r.cards));
  const seen = new Set(current.map(r => r.id));
  const merged = [...current, ...ok.filter(r => !seen.has(r.id))];
  merged.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { merged, added: merged.length - current.length };
}
