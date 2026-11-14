// Available deck artwork. Meanings always come from the Tarot Cards for Beginners text
// (all these decks follow the same 78-card structure), but the pictures change.
import { createContext, useContext } from 'react';
import generated from './decks.generated.json';

// Personal-use decks (from printable PDFs and artist image packs) live outside git in public/decks-local,
// so they only appear when that folder and src/decks.local.json exist (i.e. on this computer).
const localMeta = Object.values(import.meta.glob('./decks.local.json', { eager: true, import: 'default' }))[0] || {};
import { CARD_BY_ID } from './deck.js';

const base = import.meta.env.BASE_URL;

export const DECKS = [
  { key: 'beginners', name: 'Tarot Cards for Beginners', maker: 'Rockridge Press', ratio: 2624 / 1500, note: 'Meanings printed on every card.' },
  { key: 'classic', name: 'Llewellyn’s Classic Tarot', maker: 'Llewellyn', ratio: generated.classic?.ratio, note: 'Lush, traditional Rider-Waite style.' },
  { key: 'newvision', name: 'Tarot of the New Vision', maker: 'Lo Scarabeo', ratio: generated.newvision?.ratio, note: 'The classic scenes, seen from behind.' },
  { key: 'chromatika', name: 'Chromatika Tarot', maker: 'Lo Scarabeo', ratio: generated.chromatika?.ratio, note: 'Bold, graphic, modern.' },
  { key: 'viceversa', name: 'Viceversa Tarot', maker: 'Lo Scarabeo', ratio: generated.viceversa?.ratio, note: 'Painterly scenes (front views).' },
  { key: 'thoth', name: 'Thoth Tarot', maker: 'Aleister Crowley & Lady Frieda Harris', ratio: generated.thoth?.ratio, note: 'Esoteric. Uses its own card names.' },
  { key: 'rider', name: 'Rider-Waite-Smith', maker: 'Rider / Pamela Colman Smith', ratio: generated.rider?.ratio, note: 'The original 1909 artwork.' },
  { key: 'marseillebd', name: 'Tarot de Marseille (Ben-Dov)', maker: 'Yoav Ben-Dov restoration', ratio: generated.marseillebd?.ratio, note: 'Clean restoration of the 1760 Conver deck. French names.' },
  { key: 'marseillecc', name: 'Tarot de Marseille (Conver-Camoin)', maker: 'Camoin', ratio: generated.marseillecc?.ratio, note: 'Historic woodcut style. French names.' },
  { key: 'etteilla1', name: 'Etteilla I (1789)', maker: 'Pierre-François Basan engravings', ratio: generated.etteilla1?.ratio, note: 'Etteilla’s original deck, hand-coloured. French titles; trumps matched to the nearest traditional card.' },
  { key: 'silicondawn', name: 'Tarot of the Silicon Dawn', maker: 'Egypt Urnash', ratio: localMeta.silicondawn?.ratio, local: true, note: 'Sci-fi, Thoth-flavoured. Its own card names.' },
  { key: 'verdict', name: 'Woodcut Tarot', maker: 'Tarot Verdict', ratio: localMeta.verdict?.ratio, local: true, note: 'Rider-Waite scenes in a woodcut style.' },
  { key: 'deckaura', name: 'Deckaura Tarot', maker: 'Deckaura', ratio: localMeta.deckaura?.ratio, local: true, note: 'Illustrated Rider-Waite style.' },
  { key: 'courtgames', name: 'Court Games Tarot', maker: 'darktarot.com', ratio: localMeta.courtgames?.ratio, local: true, note: 'Antique Italian-style woodcuts on aged paper.' },
  { key: 'etteilla', name: 'Grand Etteilla', maker: 'Grimaud', ratio: generated.etteilla?.ratio, note: 'The first deck made for fortune-telling. Its trumps are matched to the nearest traditional card.' },
].filter(d => d.ratio);

export const DECK_BY_KEY = Object.fromEntries(DECKS.map(d => [d.key, d]));

const deckDir = k => `${base}${DECK_BY_KEY[k].local ? 'decks-local' : 'decks'}/${k}`;
export const cardImg = (deckKey, id) =>
  deckKey === 'beginners' || !DECK_BY_KEY[deckKey] ? `${base}cards/${id}.webp` : `${deckDir(deckKey)}/${id}.webp`;
export const backImg = deckKey =>
  deckKey === 'beginners' || !DECK_BY_KEY[deckKey] ? `${base}cards/X-BA.webp` : `${deckDir(deckKey)}/back.webp`;

// The Thoth deck renames several cards.
const THOTH_NAMES = {
  'T-01': 'The Magus', 'T-02': 'The Priestess', 'T-08': 'Lust', 'T-10': 'Fortune', 'T-11': 'Adjustment',
  'T-14': 'Art', 'T-20': 'The Aeon', 'T-21': 'The Universe',
};
const THOTH_COURTS = { J1: 'Princess', J2: 'Prince', KI: 'Knight' };
const THOTH_SUITS = { C: 'Cups', P: 'Disks', S: 'Swords', W: 'Wands' };

// Tarot de Marseille: French titles for the trumps and court cards.
const MARSEILLE_TRUMPS = {
  'T-00': 'Le Mat', 'T-01': 'Le Bateleur', 'T-02': 'La Papesse', 'T-03': 'L’Impératrice', 'T-04': 'L’Empereur',
  'T-05': 'Le Pape', 'T-06': 'L’Amoureux', 'T-07': 'Le Chariot', 'T-08': 'La Force (XI)', 'T-09': 'L’Hermite',
  'T-10': 'La Roue de Fortune', 'T-11': 'La Justice (VIII)', 'T-12': 'Le Pendu', 'T-13': 'L’Arcane sans nom', 'T-14': 'Tempérance',
  'T-15': 'Le Diable', 'T-16': 'La Maison Dieu', 'T-17': 'L’Étoile', 'T-18': 'La Lune', 'T-19': 'Le Soleil',
  'T-20': 'Le Jugement', 'T-21': 'Le Monde',
};
const FRENCH_COURTS = { J1: 'Valet', J2: 'Cavalier', QU: 'Reine', KI: 'Roi' };
const FRENCH_SUITS = { C: 'de Coupe', P: 'de Deniers', S: 'd’Épée', W: 'de Bâton' };
// Grand Etteilla: its own trump titles (number on the card, and name), shown on the matching traditional card.
const ETTEILLA_TRUMPS = {
  'T-00': '78 · Madness', 'T-04': '1 · Ideal (Man Questioner)', 'T-19': '2 · Enlightenment', 'T-18': '3 · Discussion',
  'T-17': '4 · Revelation', 'T-21': '5 · Travel', 'T-02': '6 · Secrets', 'T-06': '7 · Support', 'T-03': '8 · Tenacity (Lady Questioner)',
  'T-11': '9 · Justice', 'T-14': '10 · Temperance', 'T-08': '11 · Strength', 'T-12': '12 · Prudence', 'T-05': '13 · Marriage',
  'T-15': '14 · Violence', 'T-01': '15 · Sorrow', 'T-20': '16 · Opinion', 'T-13': '17 · Death', 'T-09': '18 · Betrayal',
  'T-16': '19 · Poverty', 'T-10': '20 · Fortune', 'T-07': '21 · Law-suit',
};

const ETTEILLA1_TRUMPS = {
  'T-04': '1 · Le Chaos', 'T-19': '2 · La Lumière', 'T-18': '3 · Les Plantes', 'T-17': '4 · Le Ciel',
  'T-21': '5 · L’Homme et les Quadrupèdes', 'T-02': '6 · Les Astres', 'T-06': '7 · Les Oiseaux et les Poissons', 'T-03': '8 · Repos',
  'T-11': '9 · La Justice', 'T-14': '10 · Tempérance', 'T-08': '11 · La Force', 'T-12': '12 · La Prudence', 'T-05': '13 · Le Grand Prêtre',
  'T-15': '14 · Le Diable', 'T-01': '15 · Le Magicien', 'T-20': '16 · Le Jugement dernier', 'T-13': '17 · La Mort', 'T-09': '18 · Le Capucin',
  'T-16': '19 · Le Temple foudroyé', 'T-10': '20 · La Roue de Fortune', 'T-07': '21 · Le Despote africain', 'T-00': '78 · La Folie',
};
const SILICON_TRUMPS = {
  'T-05': 'The High Priest', 'T-08': 'Fortitude', 'T-10': 'Fortune', 'T-12': 'Traitor', 'T-17': 'Star', 'T-18': 'Moon', 'T-19': 'Sun', 'T-21': 'Universe',
};
const COURT_GAMES_TRUMPS = { 'T-02': 'The Popess', 'T-05': 'The Pope', 'T-08': 'Strength (XI)', 'T-11': 'Justice (VIII)' };
const SUIT_NAMES = { C: 'Cups', P: 'Pentacles', S: 'Swords', W: 'Wands' };

export function deckName(deckKey, id) {
  const [s, r] = id.split('-');
  if (deckKey === 'etteilla1') return ETTEILLA1_TRUMPS[id] ?? null;
  if (deckKey === 'silicondawn') {
    if (SILICON_TRUMPS[id]) return SILICON_TRUMPS[id];
    if (r === 'J1') return `${s === 'P' ? 'Prince' : 'Princess'} of ${SUIT_NAMES[s]}`;
    if (r === 'J2') return `Cavalier of ${SUIT_NAMES[s]}`;
    return null;
  }
  if (deckKey === 'courtgames') {
    if (COURT_GAMES_TRUMPS[id]) return COURT_GAMES_TRUMPS[id];
    return s === 'P' ? CARD_BY_ID[id]?.name.replace('Pentacles', 'Coins') ?? null : null;
  }
  if (deckKey === 'marseillebd' || deckKey === 'marseillecc' || deckKey === 'etteilla') {
    if (deckKey === 'etteilla') return ETTEILLA_TRUMPS[id] ?? null;
    if (MARSEILLE_TRUMPS[id]) return MARSEILLE_TRUMPS[id];
    return FRENCH_COURTS[r] ? `${FRENCH_COURTS[r]} ${FRENCH_SUITS[s]}` : null;
  }
  if (deckKey !== 'thoth') return null;
  if (THOTH_NAMES[id]) return THOTH_NAMES[id];
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
