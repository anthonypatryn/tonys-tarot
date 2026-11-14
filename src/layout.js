// Computes pixel positions on the cloth for the deck and each spread slot.
export const CARD_RATIO = 2624 / 1500; // height / width of the real cards
const COL = 1.28; // horizontal distance between slot centers, in card widths
const ROW = 1.2;  // vertical distance between slot centers, in card heights (leaves room for labels)

export function slotUnits(spread, clarifiers = 0) {
  const units = spread.positions.map(p => ({ x: p.x, y: p.y }));
  if (clarifiers > 0) {
    const maxX = Math.max(...units.map(u => u.x));
    const minY = Math.min(...units.map(u => u.y));
    for (let i = 0; i < clarifiers; i++) units.push({ x: maxX + 1.25, y: minY + i * 1 });
  }
  return units;
}

export function computeLayout(W, H, spread, clarifiers = 0) {
  const narrow = W < 860;
  const topBar = narrow ? 58 : 66;
  const margin = narrow ? 10 : 22;
  const panelW = narrow ? 0 : Math.min(470, Math.max(360, W * 0.34));
  const sheetH = narrow ? Math.round(H * 0.44) : 0;

  const units = slotUnits(spread, clarifiers);
  const minX = Math.min(...units.map(u => u.x)), maxX = Math.max(...units.map(u => u.x));
  const minY = Math.min(...units.map(u => u.y)), maxY = Math.max(...units.map(u => u.y));
  const spanCols = (maxX - minX) * COL + COL;
  const spanRows = ((maxY - minY) * ROW + ROW) * CARD_RATIO;

  const areaTop = topBar + margin;
  const areaBottom = H - margin - sheetH;
  const areaH = Math.max(120, areaBottom - areaTop);
  const fullLeft = margin;
  const fullRight = W - margin - panelW;

  // Two passes: deck zone width depends on card width.
  let cardW = 150;
  for (let pass = 0; pass < 3; pass++) {
    const deckZone = cardW * 1.55 + 16;
    const areaW = fullRight - fullLeft - deckZone;
    cardW = Math.min(areaW / spanCols, areaH / spanRows, narrow ? 110 : 200);
  }
  cardW = Math.max(44, Math.floor(cardW));
  const cardH = Math.round(cardW * CARD_RATIO);
  const deckZone = cardW * 1.55 + 16;

  const areaLeft = fullLeft + deckZone;
  const areaW = fullRight - areaLeft;
  const cx = areaLeft + areaW / 2;
  const cy = areaTop + areaH / 2;
  const midUx = (minX + maxX) / 2, midUy = (minY + maxY) / 2;

  const slots = units.map(u => ({
    x: cx + (u.x - midUx) * COL * cardW,
    // nudge up slightly so the label under the lowest card has room
    y: cy + (u.y - midUy) * ROW * cardH - cardH * 0.06,
  }));

  const deck = { x: fullLeft + deckZone / 2, y: cy };
  return {
    W, H, narrow, cardW, cardH, slots, deck, panelW, sheetH, topBar,
    scatterBox: { left: fullLeft + cardW / 2, right: fullRight - cardW / 2, top: areaTop + cardH / 2, bottom: areaBottom - cardH / 2 },
  };
}
