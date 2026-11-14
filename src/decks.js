// Available deck artwork. Meanings always come from the Tarot Cards for Beginners text
// (all these decks follow the same 78-card structure), but the pictures change.
import { createContext, useContext } from 'react';
import generated from './decks.generated.json';
import { CARD_BY_ID } from './deck.js';

const base = import.meta.env.BASE_URL;

export const DECKS = [
  { key: 'beginners', name: 'Tarot Cards for Beginners', maker: 'Rockridge Press', ratio: 2624 / 1500, note: 'Meanings printed on every card.' },
  { key: 'classic', name: 'Llewellyn’s Classic Tarot', maker: 'Llewellyn', ratio: generated.classic?.ratio, note: 'Lush, traditional Rider-Waite style.' },
  { key: 'newvision', name: 'Tarot of the New Vision', maker: 'Lo Scarabeo', ratio: generated.newvision?.ratio, note: 'The classic scenes, seen from behind.' },
  { key: 'chromatika', name: 'Chromatika Tarot', maker: 'Lo Scarabeo', ratio: generated.chromatika?.ratio, note: 'Bold, graphic, modern.' },
  { key: 'viceversa', name: 'Viceversa Tarot', maker: 'Lo Scarabeo', ratio: generated.viceversa?.ratio, note: 'Painterly scenes (front views).' },
  { key: 'thoth', name: 'Thoth Tarot', maker: 'Aleister Crowley & Lady Frieda Harris', ratio: generated.thoth?.ratio, note: 'Esoteric. Uses its own card names.' },
].filter(d => d.ratio);

export const DECK_BY_KEY = Object.fromEntries(DECKS.map(d => [d.key, d]));

export const cardImg = (deckKey, id) =>
  deckKey === 'beginners' || !DECK_BY_KEY[deckKey] ? `${base}cards/${id}.webp` : `${base}decks/${deckKey}/${id}.webp`;
export const backImg = deckKey =>
  deckKey === 'beginners' || !DECK_BY_KEY[deckKey] ? `${base}cards/X-BA.webp` : `${base}decks/${deckKey}/back.webp`;

// The Thoth deck renames several cards.
const THOTH_NAMES = {
  'T-01': 'The Magus', 'T-02': 'The Priestess', 'T-08': 'Lust', 'T-10': 'Fortune', 'T-11': 'Adjustment',
  'T-14': 'Art', 'T-20': 'The Aeon', 'T-21': 'The Universe',
};
const THOTH_COURTS = { J1: 'Princess', J2: 'Prince', KI: 'Knight' };
const THOTH_SUITS = { C: 'Cups', P: 'Disks', S: 'Swords', W: 'Wands' };

export function deckName(deckKey, id) {
  if (deckKey !== 'thoth') return null;
  if (THOTH_NAMES[id]) return THOTH_NAMES[id];
  const [s, r] = id.split('-');
  if (THOTH_COURTS[r]) return `${THOTH_COURTS[r]} of ${THOTH_SUITS[s]}`;
  if (s === 'P') return CARD_BY_ID[id]?.name.replace('Pentacles', 'Disks') ?? null;
  return null;
}

export const DeckContext = createContext('beginners');
export const useDeck = () => useContext(DeckContext);

export function loadDeckChoice() {
  try {
    const k = localStorage.getItem('tarot-deck');
    return DECK_BY_KEY[k] ? k : 'beginners';
  } catch { return 'beginners'; }
}
export function saveDeckChoice(k) {
  try { localStorage.setItem('tarot-deck', k); } catch { /* ignore */ }
}
