// Paste into the browser console (or run via a test driver) on the app to check legibility and tap targets.
// Reports text smaller than 12px, text with WCAG contrast below 4.5 (3 for large text) against the nearest
// solid background, and buttons/inputs smaller than 40x40 on touch screens. Gradients/images behind text are
// approximated by the nearest solid background color, so treat contrast results on the table as hints.
window.tarotAudit = function tarotAudit() {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const lum = ({ r, g, b }) => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const blend = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const bgOf = el => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      let c = parse(cs.backgroundColor);
      if ((!c || c.a === 0) && cs.backgroundImage.includes('gradient')) c = parse(cs.backgroundImage.match(/rgba?\([^)]+\)/)?.[0] || '');
      if (c && c.a > 0) { layers.push(c); if (c.a >= 0.95) break; }
    }
    let out = { r: 20, g: 12, b: 16, a: 1 }; // dark table
    for (const c of layers.reverse()) out = blend(c, out);
    return out;
  };
  const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && +s.opacity > 0.05 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const small = [], lowContrast = [], tinyTargets = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode; const el = t.parentElement;
    if (!t.textContent.trim() || !el || seen.has(el) || !visible(el)) continue;
    if (el.closest('svg, .slot-num, .cal-num, [aria-hidden="true"]')) continue;
    seen.add(el);
    const s = getComputedStyle(el); const size = parseFloat(s.fontSize);
    const label = `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${t.textContent.trim().slice(0, 30)}"`;
    if (size < 12) small.push(`${size}px ${label}`);
    const fg = parse(s.color); if (!fg) continue;
    const cr = ratio(blend({ ...fg, a: fg.a * (+s.opacity || 1) }, bgOf(el)), bgOf(el));
    const need = size >= 18.66 || (size >= 14 && +s.fontWeight >= 700) ? 3 : 4.5;
    if (cr < need) lowContrast.push(`${cr.toFixed(2)} ${label}`);
  }
  if (matchMedia('(pointer: coarse)').matches || innerWidth < 640) {
    for (const el of document.querySelectorAll('button, a, input, select, textarea, [role=button]')) {
      if (!visible(el) || el.closest('.cal-grid') || el.classList.contains('card')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 40) tinyTargets.push(`${Math.round(r.width)}x${Math.round(r.height)} ${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}"`);
    }
  }
  return { small, lowContrast, tinyTargets };
};
