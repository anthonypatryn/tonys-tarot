// The 78-card deck. Image files live in public/cards/<id>.webp; meanings come from meanings.json
// (transcribed from the text printed on each card).
import meanings from './meanings.json';

const MAJOR_NAMES = [
  'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor', 'The Hierophant',
  'The Lovers', 'The Chariot', 'Strength', 'The Hermit', 'Wheel of Fortune', 'Justice', 'The Hanged Man',
  'Death', 'Temperance', 'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement', 'The World',
];
export const SUITS = { C: 'Cups', P: 'Pentacles', S: 'Swords', W: 'Wands' };
const RANKS = [
  ['0A', 'Ace'], ['02', 'Two'], ['03', 'Three'], ['04', 'Four'], ['05', 'Five'], ['06', 'Six'], ['07', 'Seven'],
  ['08', 'Eight'], ['09', 'Nine'], ['10', 'Ten'], ['J1', 'Page'], ['J2', 'Knight'], ['QU', 'Queen'], ['KI', 'King'],
];

export const CARDS = [
  ...MAJOR_NAMES.map((name, i) => {
    const id = `T-${String(i).padStart(2, '0')}`;
    return { id, name, arcana: 'major', suit: 'Major Arcana', number: i };
  }),
  ...Object.entries(SUITS).flatMap(([s, suit]) =>
    RANKS.map(([r, rank]) => ({ id: `${s}-${r}`, name: `${rank} of ${suit}`, arcana: 'minor', suit, rank })),
  ),
].map(c => ({
  ...c,
  img: `${import.meta.env.BASE_URL}cards/${c.id}.webp`,
  upright: meanings[c.id]?.upright ?? '',
  reversed: meanings[c.id]?.reversed ?? '',
  title: meanings[c.id]?.title ?? c.name,
}));

export const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c]));
export const BACK_IMG = `${import.meta.env.BASE_URL}cards/X-BA.webp`;

// Fisher–Yates shuffle with crypto randomness. Each card also gets a random orientation:
// whichever way up it lands is how it will be read (reversed = upside down).
export function shuffleDeck(cards = CARDS) {
  const rand = n => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  };
  const deck = cards.map(c => ({ id: c.id, reversed: rand(2) === 1 }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
