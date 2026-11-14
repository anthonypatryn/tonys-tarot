// Computes pixel positions on the cloth for the deck and each spread slot.
//
// Three shapes:
//  - wide (desktop/tablet landscape): guide panel on the right, deck on the left of the spread.
//  - short (phone landscape): same, with a slimmer panel and top bar.
//  - narrow (phone portrait): guide is a bottom sheet whose height follows the step;
//    the deck sits at the bottom-center of the table ("in front of you") so the spread gets the full width.
export const CARD_RATIO = 2624 / 1500; // height / width of the real cards

export function slotUnits(spread, clarifiers = 0, below = false) {
  const units = spread.positions.map(p => ({ x: p.x, y: p.y }));
  if (clarifiers > 0) {
    const minX = Math.min(...units.map(u => u.x)), maxX = Math.max(...units.map(u => u.x));
    const minY = Math.min(...units.map(u => u.y)), maxY = Math.max(...units.map(u => u.y));
    if (below) {
      // Phones (narrow): rows of three under the spread, so the spread keeps the full width.
      const mid = (minX + maxX) / 2;
      for (let i = 0; i < clarifiers; i++) {
        const inRow = Math.min(3, clarifiers - Math.floor(i / 3) * 3);
        units.push({ x: mid + ((i % 3) - (inRow - 1) / 2) * 1.05, y: maxY + 1.1 + Math.floor(i / 3) });
      }
    } else {
      // Clarifiers stack in columns of three to the right of the spread.
      for (let i = 0; i < clarifiers; i++) units.push({ x: maxX + 1.25 + Math.floor(i / 3) * 1.05, y: minY + (i % 3) });
    }
  }
  return units;
}

// Bottom-sheet height (fraction of screen) for each step on phones.
const SHEET = { choose: 0.58, question: 0.58, shuffle: 0.34, draw: 0.3, reveal: 0.44, done: 0.56 };
export const SHEET_PEEK = 104; // collapsed sheet height in px

export function isNarrow(W, H) {
  return W < 640 || (W < 900 && H >= W);
}

export function computeLayout(W, H, spread, clarifiers = 0, ratio = CARD_RATIO, { phase = 'choose', collapsed = false } = {}) {
  const narrow = isNarrow(W, H);
  const short = !narrow && H < 560;
  const topBar = narrow ? 64 : short ? 52 : 66;
  const margin = narrow ? 8 : short ? 12 : 22;
  const panelW = narrow ? 0 : short ? Math.round(Math.min(380, Math.max(300, W * 0.42))) : Math.min(470, Math.max(360, W * 0.34));
  const compact = narrow || short; // phones: number badges instead of label pills
  const COL = compact ? 1.16 : 1.28; // slot spacing in card widths
  const ROW = compact ? 1.1 : 1.2;   // slot spacing in card heights (phones show number badges, not label pills)

  const units = slotUnits(spread, clarifiers, narrow);
  const minX = Math.min(...units.map(u => u.x)), maxX = Math.max(...units.map(u => u.x));
  const minY = Math.min(...units.map(u => u.y)), maxY = Math.max(...units.map(u => u.y));
  const spanCols = (maxX - minX) * COL + COL;
  const spanRows = ((maxY - minY) * ROW + ROW) * ratio;

  // Phone guide sheet: its height follows the step, but it gives way so the cards on the table stay readable.
  let sheetH = 0;
  if (narrow) {
    if (collapsed) sheetH = SHEET_PEEK;
    else {
      const wanted = Math.round(H * (SHEET[phase] ?? 0.46));
      const target = Math.min(64, (W - 16) / spanCols); // card width we'd like to keep
      const tableNeeds = spanRows * target + target * ratio + 12 + topBar + 16 + 6;
      sheetH = Math.round(Math.max(Math.max(150, H * 0.24), Math.min(wanted, H - tableNeeds)));
    }
  }

  const areaTop = topBar + margin;
  const areaBottom = H - margin - sheetH - (narrow ? 6 : 0);
  const areaH = Math.max(100, areaBottom - areaTop);
  const fullLeft = margin;
  const fullRight = W - margin - panelW;

  // Solve for the card width directly (the deck's space depends on the card size too).
  let cardW;
  if (narrow) {
    // Deck strip at the bottom of the table area takes one card height + a gap.
    cardW = Math.min((fullRight - fullLeft) / spanCols, (areaH - 12) / (spanRows + ratio), 120);
  } else {
    // Deck column on the left takes 1.55 card widths + a gap.
    cardW = Math.min((fullRight - fullLeft - 16) / (spanCols + 1.55), areaH / spanRows, short ? 130 : 200);
  }
  cardW = Math.max(38, Math.floor(cardW));
  const cardH = Math.round(cardW * ratio);

  let cx, cy, deck;
  if (narrow) {
    const strip = cardH + 12;
    cx = (fullLeft + fullRight) / 2;
    cy = areaTop + (areaH - strip) / 2;
    deck = { x: cx, y: areaBottom - cardH / 2 - 2 };
  } else {
    const deckZone = cardW * 1.55 + 16;
    const areaLeft = fullLeft + deckZone;
    cx = areaLeft + (fullRight - areaLeft) / 2;
    cy = areaTop + areaH / 2;
    deck = { x: fullLeft + deckZone / 2, y: cy };
  }
  const midUx = (minX + maxX) / 2, midUy = (minY + maxY) / 2;
  const slots = units.map(u => ({
    x: cx + (u.x - midUx) * COL * cardW,
    y: cy + (u.y - midUy) * ROW * cardH - (compact ? 0 : cardH * 0.06),
  }));

  return {
    W, H, narrow, short, compact, cardW, cardH, slots, deck, panelW, sheetH, topBar,
    area: { left: fullLeft, right: fullRight, top: areaTop, bottom: areaBottom, cx, cy },
    scatterBox: { left: fullLeft + cardW / 2, right: fullRight - cardW / 2, top: areaTop + cardH / 2, bottom: areaBottom - cardH / 2 },
  };
}

// Does the layout fit: every slot on the table, none on top of the deck, cards at a readable size?
export function layoutFits(L) {
  const hw = L.cardW / 2, hh = L.cardH / 2;
  const right = L.W - (L.narrow ? 0 : L.panelW), bottom = L.H - (L.narrow ? L.sheetH : 0);
  if (L.cardW < 38) return false;
  return L.slots.every(s => s.x - hw >= 0 && s.x + hw <= right && s.y - hh >= L.topBar - 2 && s.y + hh <= bottom + 1
    && !(Math.abs(s.x - L.deck.x) < L.cardW - 0.5 && Math.abs(s.y - L.deck.y) < L.cardH - 0.5));
}

// How many clarifying cards still fit on this screen (up to `max`).
export function maxClarifiers(W, H, spread, ratio, max = 6) {
  for (let n = max; n > 0; n--) {
    if (['reveal', 'done'].every(phase => layoutFits(computeLayout(W, H, spread, n, ratio, { phase })))) return n;
  }
  return 0;
}
