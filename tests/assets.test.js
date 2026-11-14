import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CARDS } from '../src/deck.js';
import { DECKS, cardImg, backImg } from '../src/decks.js';
import { CLOTHS } from '../src/themes.js';

const pub = p => join(__dirname, '..', 'public', p.replace(/^\//, ''));

describe('deck artwork', () => {
  for (const d of DECKS) {
    it(`${d.name}: all 78 cards and a back are present`, () => {
      const missing = CARDS.map(c => cardImg(d.key, c.id)).filter(p => !existsSync(pub(p)));
      expect(missing).toEqual([]);
      expect(existsSync(pub(backImg(d.key)))).toBe(true);
      expect(d.ratio).toBeGreaterThan(1.3);
      expect(d.ratio).toBeLessThan(2.1);
    });
  }
});

describe('other assets', () => {
  it('cloth patterns, icons, fonts and sounds exist', () => {
    const files = [
      ...Object.values(CLOTHS).flatMap(c => [c.img, c.mask]),
      '/icon-180.png', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest',
      '/fonts/grim-reaper.woff', '/fonts/romantique-initials.woff',
      ...['take-1', 'take-2', 'take-3', 'place', 'shuffle', 'riffle'].map(s => `/sounds/${s}.mp3`),
    ];
    expect(files.filter(f => !existsSync(pub(f)))).toEqual([]);
  });
});
