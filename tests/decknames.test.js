import { describe, it, expect } from 'vitest';
import { deckName } from '../src/decks.js';

describe('deck-specific card names', () => {
  it('names renamed cards in decks that rename them', () => {
    expect(deckName('thoth', 'T-08')).toBe('Lust');
    expect(deckName('thoth', 'P-J1')).toBe('Princess of Disks');
    expect(deckName('marseillebd', 'T-11')).toMatch(/Justice/);
    expect(deckName('marseillecc', 'S-KI')).toBe('Roi d’Épée');
    expect(deckName('etteilla', 'T-01')).toMatch(/^15 /);
    expect(deckName('etteilla1', 'T-00')).toMatch(/Folie/);
    expect(deckName('silicondawn', 'T-12')).toBe('Traitor');
    expect(deckName('silicondawn', 'P-J1')).toBe('Prince of Pentacles');
    expect(deckName('courtgames', 'P-05')).toBe('Five of Coins');
  });
  it('gives no alternate name where the deck uses the standard one', () => {
    expect(deckName('beginners', 'T-08')).toBeNull();
    expect(deckName('rider', 'C-QU')).toBeNull();
  });
});
