// Computes pixel positions on the cloth for the deck and each spread slot.
//
// Three shapes:
//  - wide (desktop/tablet landscape): guide panel on the right, deck on the left of the spread.
//  - short (phone landscape): same, with a slimmer panel and top bar.
//  - narrow (phone portrait): guide is a bottom sheet whose height follows the step;
//    the deck sits at the bottom-center of the table ("in front of you") so the spread gets the full width.
export const CARD_RATIO = 2624 / 1500; // height / width of the real cards

export function slotUnits(spread, clarifiers = 0) {
  const units = spread.positions.map(p => ({ x: p.x, y: p.y }));
  if (clarifiers > 0) {
    const maxX = Math.max(...units.map(u => u.x));
    const minY = Math.min(...units.map(u => u.y));
    for (let i = 0; i < clarifiers; i++) units.push({ x: maxX + 1.25, y: minY + i * 1 });
  }
  return units;
}

// Bottom-sheet height (fraction of screen) for each step on phones.
const SHEET = { choose: 0.58, question: 0.58, shuffle: 0.34, draw: 0.3, reveal: 0.46, done: 0.58 };
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
  const sheetH = narrow ? (collapsed ? SHEET_PEEK : Math.round(H * (SHEET[phase] ?? 0.46))) : 0;
  const compact = narrow || short; // phones: number badges instead of label pills
  const COL = compact ? 1.16 : 1.28; // slot spacing in card widths
  const ROW = compact ? 1.1 : 1.2;   // slot spacing in card heights (phones show number badges, not label pills)

  const units = slotUnits(spread, clarifiers);
  const minX = Math.min(...units.map(u => u.x)), maxX = Math.max(...units.map(u => u.x));
  const minY = Math.min(...units.map(u => u.y)), maxY = Math.max(...units.map(u => u.y));
  const spanCols = (maxX - minX) * COL + COL;
  const spanRows = ((maxY - minY) * ROW + ROW) * ratio;

  const areaTop = topBar + margin;
  const areaBottom = H - margin - sheetH - (narrow ? 6 : 0);
  const areaH = Math.max(100, areaBottom - areaTop);
  const fullLeft = margin;
  const fullRight = W - margin - panelW;

  let cardW = 120;
  if (narrow) {
    // Deck strip at the bottom of the table area takes ~one card height.
    for (let pass = 0; pass < 3; pass++) {
      const strip = cardW * ratio * 0.95 + 10;
      cardW = Math.min((fullRight - fullLeft) / spanCols, (areaH - strip) / spanRows, 120);
    }
  } else {
    for (let pass = 0; pass < 3; pass++) {
      const deckZone = cardW * 1.55 + 16;
      cardW = Math.min((fullRight - fullLeft - deckZone) / spanCols, areaH / spanRows, short ? 130 : 200);
    }
  }
  cardW = Math.max(38, Math.floor(cardW));
  const cardH = Math.round(cardW * ratio);

  let cx, cy, deck;
  if (narrow) {
    const strip = cardH * 0.95 + 10;
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
    scatterBox: { left: fullLeft + cardW / 2, right: fullRight - cardW / 2, top: areaTop + cardH / 2, bottom: areaBottom - cardH / 2 },
  };
}
