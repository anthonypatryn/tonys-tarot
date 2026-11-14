import { describe, it, expect, beforeEach } from 'vitest';

const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const { loadHistory, upsertReading, deleteReading } = await import('../src/history.js');

describe('reading history', () => {
  beforeEach(() => store.clear());
  it('saves, updates and deletes readings', () => {
    upsertReading({ id: 'a', date: '2026-11-01T10:00:00Z', cards: [], notes: '' });
    upsertReading({ id: 'b', date: '2026-11-02T10:00:00Z', cards: [] });
    expect(loadHistory().map(r => r.id)).toEqual(['b', 'a']);
    upsertReading({ id: 'a', date: '2026-11-20T10:00:00Z', cards: [], notes: 'later thoughts' });
    const a = loadHistory().find(r => r.id === 'a');
    expect(a.notes).toBe('later thoughts');
    expect(a.date).toBe('2026-11-01T10:00:00Z'); // editing the journal keeps the original day
    deleteReading('b');
    expect(loadHistory().map(r => r.id)).toEqual(['a']);
  });
  it('survives corrupt storage', () => {
    store.set('tarot-history-v1', '{oops');
    expect(loadHistory()).toEqual([]);
  });
});
