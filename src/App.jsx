import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CARDS, CARD_BY_ID, shuffleDeck } from './deck.js';
import { DECK_BY_KEY, DeckContext, cardImg, backImg, loadDeckChoice, saveDeckChoice } from './decks.js';
import DeckPicker from './components/DeckPicker.jsx';
import ThemePicker from './components/ThemePicker.jsx';
import { IconReading, IconDecks, IconBrowse, IconHistory, IconGuide, IconTheme, IconSound } from './components/Icons.jsx';

const TOUCH = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
const verb = TOUCH ? 'Tap' : 'Click';
import { applyTheme, loadTheme, saveTheme } from './themes.js';
import { SPREADS, SPREAD_BY_ID } from './spreads.js';
import { computeLayout } from './layout.js';
import { sound } from './sound.js';
import { upsertReading } from './history.js';
import Panel from './components/Panel.jsx';
import CardReader from './components/CardReader.jsx';
import Browse from './components/Browse.jsx';
import History from './components/History.jsx';
import Guide from './components/Guide.jsx';
import Decor from './components/Decor.jsx';
import HoloCard from './reactbits/HoloCard.jsx';
import { ShineContext, loadShine, saveShine, holoProps } from './shine.js';
import { CLOTHS } from './themes.js';

export const MAX_CLARIFIERS = 6;
// A card's shadow falls away from the candles (down and to the right on screen), whichever way the card lies.
function cardShadow(rotDeg, w, lifted) {
  const k = lifted ? 2.2 : 1;
  const sx = w * 0.07 * k, sy = w * 0.11 * k, blur = w * 0.12 * k;
  const a = (-rotDeg * Math.PI) / 180;
  const lx = sx * Math.cos(a) - sy * Math.sin(a), ly = sx * Math.sin(a) + sy * Math.cos(a);
  return `${lx.toFixed(1)}px ${ly.toFixed(1)}px ${blur.toFixed(1)}px rgba(0,0,0,.6), ${(lx * 0.25).toFixed(1)}px ${(ly * 0.25).toFixed(1)}px ${(blur * 0.25).toFixed(1)}px rgba(0,0,0,.5)`;
}
const rnd = (a, b) => a + Math.random() * (b - a);
// Small stable per-card wobble so the deck looks hand-stacked.
const wobble = id => {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((h % 100) / 100) * 2.4 - 1.2;
};

// Track the visible viewport (on phones this changes as the browser bars show/hide or the keyboard opens).
function useSize() {
  const read = () => ({ W: window.innerWidth, H: Math.round(window.visualViewport?.height ?? window.innerHeight) });
  const [size, setSize] = useState(read);
  useEffect(() => {
    const on = () => setSize(prev => {
      const next = read();
      // Ignore the on-screen keyboard shrinking the height a lot: keep the table steady while typing.
      const typing = document.activeElement?.matches?.('textarea, input');
      if (typing && next.W === prev.W && next.H < prev.H) return prev;
      return next.W === prev.W && next.H === prev.H ? prev : next;
    });
    window.addEventListener('resize', on);
    window.visualViewport?.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.visualViewport?.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return size;
}

export default function App() {
  const { W, H } = useSize();
  const [view, setView] = useState('table'); // table | browse | history | guide
  const [phase, setPhase] = useState('choose'); // choose | question | shuffle | draw | reveal | done
  const [spreadId, setSpreadId] = useState(null);
  const [previewId, setPreviewId] = useState(null); // spread being hovered in the chooser
  const [question, setQuestion] = useState('');
  const [deck, setDeck] = useState(() => shuffleDeck()); // remaining cards; top of deck = last element
  const [drawn, setDrawn] = useState([]); // {id, reversed, slot, flipped, axis}
  const [clarifiers, setClarifiers] = useState(0);
  const [scatter, setScatter] = useState(null); // id -> {x,y,rot,delay} while shuffling
  const [shuffling, setShuffling] = useState(false);
  const [shuffles, setShuffles] = useState(0);
  const [lifting, setLifting] = useState(null); // id of card currently flying
  const [selected, setSelected] = useState(null); // index into drawn shown in the panel
  const [focus, setFocus] = useState(null); // {id, reversed, label} for the big reader
  const [readingId, setReadingId] = useState(null);
  const [notes, setNotes] = useState('');
  const [soundOn, setSoundOn] = useState(sound.enabled);
  const [deckKey, setDeckKey] = useState(loadDeckChoice);
  const [theme, setTheme] = useState(loadTheme);
  const [themeOpen, setThemeOpen] = useState(false);
  const changeTheme = t => { setTheme(t); applyTheme(t); saveTheme(t); };
  const [shine, setShine] = useState(loadShine);
  const changeShine = s => { setShine(s); saveShine(s); };
  const timers = useRef([]);
  const chooseDeck = k => { setDeckKey(k); saveDeckChoice(k); setView('table'); };
  const ratio = DECK_BY_KEY[deckKey].ratio;
  const BACK_IMG = backImg(deckKey);

  const spread = SPREAD_BY_ID[spreadId] || SPREAD_BY_ID[previewId] || null;
  const layoutSpread = spread || SPREAD_BY_ID['ppf'];
  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  useEffect(() => { setSheetCollapsed(false); }, [phase]); // each new step opens the guide again
  const L = useMemo(
    () => computeLayout(W, H, layoutSpread, clarifiers, ratio, { phase, collapsed: sheetCollapsed }),
    [W, H, layoutSpread, clarifiers, ratio, phase, sheetCollapsed],
  );

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ---------- flow ----------
  const pickSpread = id => {
    setSpreadId(id);
    setPreviewId(null);
    setPhase('question');
  };

  const resetAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase('choose'); setSpreadId(null); setPreviewId(null); setQuestion('');
    setDeck(shuffleDeck()); setDrawn([]); setClarifiers(0); setScatter(null);
    setShuffling(false); setShuffles(0); setLifting(null); setSelected(null);
    setReadingId(null); setNotes(''); setFocus(null);
  }, []);

  const randomScatter = () => {
    const b = L.scatterBox;
    const m = {};
    for (const c of CARDS) {
      m[c.id] = { x: rnd(b.left, b.right), y: rnd(b.top, b.bottom), rot: rnd(-200, 200), delay: rnd(0, 260) };
    }
    return m;
  };

  const doShuffle = () => {
    if (shuffling) return;
    setPhase('shuffle');
    setShuffling(true);
    sound.shuffle();
    setScatter(randomScatter());
    later(() => setScatter(randomScatter()), 850);
    later(() => {
      // The real shuffle: new order, and each card lands either way up at random.
      setDeck(shuffleDeck());
      setScatter(null);
    }, 1750);
    later(() => { setShuffling(false); setShuffles(n => n + 1); }, 2650);
  };

  const startDrawing = () => setPhase('draw');

  const drawCard = useCallback((extra = {}) => {
    if (!spread || deck.length === 0 || lifting) return;
    const totalSlots = spread.positions.length + clarifiers;
    if (drawn.length >= totalSlots) return;
    const top = deck[deck.length - 1];
    const axis = Math.random() < 0.5 ? 'x' : 'y'; // which edge it gets turned over by
    setDeck(d => d.slice(0, -1));
    const jitter = rnd(-2.5, 2.5); // hand-placed, never perfectly square
    setDrawn(d => [...d, { ...top, slot: d.length, flipped: false, axis, jitter, ...extra }]);
    setLifting(top.id);
    sound.draw();
    later(() => setLifting(null), 750);
  }, [spread, deck, drawn.length, clarifiers, lifting]);

  // Move to reveal once every position has a card.
  useEffect(() => {
    if (phase === 'draw' && spread && drawn.length === spread.positions.length && !lifting) {
      later(() => setPhase('reveal'), 350);
    }
  }, [phase, spread, drawn.length, lifting]);

  // What a drawn card stands for: its spread position, or which card it clarifies.
  const slotLabel = c => spread?.positions[c.slot]?.label || (c.clarifies ? `Clarifying: ${c.clarifies}` : 'Clarifying card');

  const flipCard = i => {
    const c = drawn[i];
    if (!c) return;
    if (c.flipped) {
      // Tap once to show it in the guide; tap the same card again to open the large reader.
      if (selected === i) setFocus({ id: c.id, reversed: c.reversed, label: slotLabel(c) });
      else { setSelected(i); setSheetCollapsed(false); }
      return;
    }
    if (phase !== 'reveal' && phase !== 'done') return;
    sound.flip();
    setDrawn(d => d.map((x, k) => (k === i ? { ...x, flipped: true } : x)));
    later(() => setSelected(i), 450);
  };

  // All flipped: chime, but stay on the last card's reading until the user asks for the summary.
  const allRevealed = !!spread && drawn.length >= spread.positions.length && drawn.every(c => c.flipped);
  const chimed = useRef(false);
  useEffect(() => {
    if (phase === 'reveal' && allRevealed && !chimed.current) {
      chimed.current = true;
      later(() => sound.chime(), 700);
    }
    if (phase === 'choose') chimed.current = false;
  }, [allRevealed, phase]);
  const showSummary = () => { setPhase('done'); setSelected(null); };

  // Save to history once every card is turned over (and keep it updated: notes, clarifiers).
  useEffect(() => {
    if (!allRevealed || (phase !== 'reveal' && phase !== 'done')) return;
    const id = readingId || `r${Date.now()}`;
    if (!readingId) setReadingId(id);
    upsertReading({
      id,
      date: new Date().toISOString(),
      spreadId: spread.id,
      deck: deckKey,
      question,
      notes,
      cards: drawn.filter(c => c.flipped).map(c => ({
        id: c.id, reversed: c.reversed,
        label: slotLabel(c),
      })),
    });
  }, [allRevealed, phase, drawn, notes, question, spread, readingId, deckKey]);

  // Clarifying card: can be drawn after any card is turned over. Add a slot, then draw into it once the slot exists.
  const pendingClar = useRef(null);
  useEffect(() => {
    if (!spread) return;
    if (pendingClar.current && drawn.length < spread.positions.length + clarifiers) {
      const extra = pendingClar.current;
      pendingClar.current = null;
      drawCard(extra);
    }
  }, [clarifiers, drawCard, drawn.length, spread]);
  const lastFlipped = (() => {
    if (selected != null && drawn[selected]?.flipped) return drawn[selected];
    for (let i = drawn.length - 1; i >= 0; i--) if (drawn[i].flipped) return drawn[i];
    return null;
  })();
  const clarTarget = lastFlipped && (spread?.positions[lastFlipped.slot]?.label || lastFlipped.clarifies || 'Clarifying card');
  const canClarify = !!spread && (phase === 'reveal' || phase === 'done') && !!lastFlipped && deck.length > 0
    && clarifiers < MAX_CLARIFIERS && !lifting && !drawn.some(c => c.slot >= spread.positions.length && !c.flipped);
  const requestClarifier = () => {
    if (!canClarify) return;
    pendingClar.current = { clarifies: clarTarget };
    setClarifiers(n => n + 1);
  };

  // keyboard: Esc closes overlays
  useEffect(() => {
    const on = e => {
      if (e.key === 'Escape') { if (focus) setFocus(null); else if (view !== 'table') setView('table'); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [focus, view]);

  const toggleSound = () => { sound.setEnabled(!soundOn); setSoundOn(!soundOn); };

  // ---------- card placement ----------
  const drawnById = Object.fromEntries(drawn.map((c, i) => [c.id, { ...c, index: i }]));
  const deckIndex = Object.fromEntries(deck.map((c, i) => [c.id, i]));
  const reversedOf = Object.fromEntries([...deck, ...drawn].map(c => [c.id, c.reversed]));

  const placed = CARDS.map(card => {
    const d = drawnById[card.id];
    if (d) {
      const slot = L.slots[d.slot] || L.deck;
      // The front face is pre-turned on the same axis as the flip, so after flipping it shows exactly
      // as the card lies: a card lying at 180° reads reversed, whichever edge it was turned over by.
      const lie = (d.reversed ? 180 : 0) + d.jitter;
      return { card, x: slot.x, y: slot.y, rot: lie, z: 300 + d.index + (lifting === card.id ? 200 : 0), drawn: d };
    }
    const s = scatter?.[card.id];
    if (s) return { card, x: s.x, y: s.y, rot: s.rot, z: Math.floor(s.delay), delay: s.delay };
    const i = deckIndex[card.id] ?? 0;
    return {
      card,
      x: L.deck.x - i * 0.12,
      y: L.deck.y - i * 0.22,
      rot: (reversedOf[card.id] ? 180 : 0) + wobble(card.id),
      z: i,
    };
  });

  const totalSlots = spread ? spread.positions.length + (phase === 'choose' ? 0 : clarifiers) : 0;
  const nextDrawSlot = phase === 'draw' ? drawn.length : -1;
  const waitingClar = spread ? drawn.findIndex(c => c.slot >= spread.positions.length && !c.flipped) : -1;
  const nextFlip = phase === 'reveal' || phase === 'done' ? (waitingClar >= 0 ? waitingClar : drawn.findIndex(c => !c.flipped)) : -1;
  const showSlots = !!spread && !shuffling;

  // Center a fitted cloth pattern on the open part of the table (not under the guide panel).
  const clothInset = Math.min(W, H) * 0.022;
  const patternBox = (theme.patternFit || 'cover') === 'cover' ? {} : {
    left: L.area.left - clothInset, top: L.area.top - clothInset,
    width: L.area.right - L.area.left, height: L.area.bottom - L.area.top,
  };

  return (
    <DeckContext.Provider value={deckKey}>
    <ShineContext.Provider value={shine}>
    <div className="app">
      <div className="table-wood" />
      <div className={`cloth ${theme.pattern && theme.pattern !== 'none' && theme.patternMode === 'original' ? 'original' : ''} ${(theme.patternFit || 'cover') === 'cover' ? 'fill' : ''}`}>
        {theme.pattern && theme.pattern !== 'none' && CLOTHS[theme.pattern] && (
          theme.patternMode === 'original'
            ? <div className="cloth-pattern" style={{ ...patternBox, backgroundImage: `url(${CLOTHS[theme.pattern].img})`, opacity: theme.patternOpacity ?? 0.9 }} />
            : <div className="cloth-pattern tint" style={{ ...patternBox,
                WebkitMaskImage: `url(${CLOTHS[theme.pattern].mask})`, maskImage: `url(${CLOTHS[theme.pattern].mask})`,
                background: theme.patternColor || theme.accent, opacity: theme.patternOpacity ?? 0.9 }} />
        )}
        <div className="cloth-trim" />
      </div>
      <Decor L={L} active={shuffling || !!lifting} embroidery={!theme.pattern || theme.pattern === 'none'} />

      <header className="topbar">
        <button className="brand" onClick={() => setView('table')}>
          <span className="brand-star">✦</span> Tony’s Tarot
        </button>
        <nav>
          <button className={view === 'table' ? 'on' : ''} onClick={() => setView('table')}><IconReading /><span>Reading</span></button>
          <button className={view === 'decks' ? 'on' : ''} onClick={() => setView('decks')}><IconDecks /><span>Decks</span></button>
          <button className={view === 'browse' ? 'on' : ''} onClick={() => setView('browse')}><IconBrowse /><span>Browse</span></button>
          <button className={view === 'history' ? 'on' : ''} onClick={() => setView('history')}><IconHistory /><span>History</span></button>
          <button className={view === 'guide' ? 'on' : ''} onClick={() => setView('guide')}><IconGuide /><span>Guide</span></button>
          <button className={themeOpen ? 'on' : ''} onClick={() => setThemeOpen(o => !o)} title="Table theme" aria-label="Table theme"><IconTheme /><span>Theme</span></button>
          <button onClick={toggleSound} title={soundOn ? 'Sound on' : 'Sound off'} aria-label="Toggle sound">
            <IconSound on={soundOn} /><span>Sound</span>
          </button>
        </nav>
      </header>

      {/* Spread outlines */}
      {showSlots && L.slots.slice(0, totalSlots).map((s, i) => {
        const pos = spread.positions[i];
        const label = pos ? pos.label : (drawn[i] ? slotLabel(drawn[i]) : 'Clarifying card');
        const filled = i < drawn.length;
        const cls = ['slot', phase === 'choose' ? 'preview' : '', i === nextDrawSlot ? 'next' : '', filled ? 'filled' : '',
          filled && drawn[i] && i === nextFlip ? 'flip-next' : ''].join(' ');
        return (
          <div key={`${spread.id}-${i}`} className={cls}
            style={{ left: s.x - L.cardW / 2, top: s.y - L.cardH / 2, width: L.cardW, height: L.cardH, animationDelay: `${i * 90}ms`,
              ...(L.compact && filled ? { zIndex: 640 } : null) }}>
            {!filled && <span className="slot-num" style={{ fontSize: L.cardW * 0.32 }}>{pos ? i + 1 : '+'}</span>}
            {L.compact ? (
              // Phones: a small number badge; the position names are listed in the guide sheet.
              <span className="slot-badge">{pos ? i + 1 : '✦'}</span>
            ) : (
              <span className="slot-label" style={{ top: L.cardH + 6, maxWidth: L.cardW * 1.24, fontSize: Math.max(11, Math.min(15, L.cardW * 0.11)) }}>
                <b>{pos ? `${i + 1}.` : '✦'}</b> {label}
              </span>
            )}
          </div>
        );
      })}

      {/* Cards */}
      <div className="cards-layer">
        {placed.map(p => {
          const d = p.drawn;
          const flipped = d?.flipped;
          const axis = d?.axis || 'y';
          const clickable = d && (flipped || phase === 'reveal' || phase === 'done');
          return (
            <div key={p.card.id}
              className={`card ${lifting === p.card.id ? 'lifting' : ''} ${d ? 'is-drawn' : ''} ${clickable ? 'clickable' : ''} ${d && selected === d.index ? 'selected' : ''} ${d && !flipped && d.index === nextFlip ? 'glow' : ''}`}
              style={{
                width: L.cardW, height: L.cardH, zIndex: p.z,
                transform: `translate(${p.x - L.cardW / 2}px, ${p.y - L.cardH / 2}px) rotate(${p.rot}deg)`,
                transitionDelay: p.delay ? `${p.delay}ms` : '0ms',
              }}
              onClick={d ? () => flipCard(d.index) : undefined}
              onDoubleClick={d && flipped ? () => setFocus({ id: d.id, reversed: d.reversed, label: slotLabel(d) }) : undefined}
            >
              {d && <div className="card-shadow" style={{ boxShadow: cardShadow(p.rot, L.cardW, lifting === p.card.id) }} />}
              <div className="card-inner" style={{ transform: flipped ? (axis === 'x' ? 'rotateX(180deg)' : 'rotateY(180deg)') : 'none' }}>
                <div className="face back" style={{ backgroundImage: `url(${BACK_IMG})` }} />
                <div className={`face front ${flipped && shine.holo ? 'holo' : ''}`} style={{ transform: axis === 'x' ? 'rotateX(180deg)' : 'rotateY(180deg)' }}>
                  {d && (flipped && shine.holo
                    ? <HoloCard className="hc-fill" image={cardImg(deckKey, d.id)} alt={CARD_BY_ID[d.id].name}
                        {...holoProps(shine, L.cardW)} rotation={p.rot} />
                    : <img src={cardImg(deckKey, d.id)} alt={CARD_BY_ID[d.id].name} draggable="false" />)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dramatic light: dark edges, the spread lit, warm candlelight from the top left */}
      <div className="scene-vignette" style={{ background:
        `radial-gradient(ellipse ${(L.area.right - L.area.left) * 0.72}px ${(L.area.bottom - L.area.top) * 0.78}px at ${L.area.cx}px ${L.area.cy}px, #fff 40%, #9a9a9a 76%, #3a3a3a 120%)` }} />

      {/* Deck hit area */}
      {view === 'table' && (
        <button className={`deck-hit ${phase === 'draw' && !lifting ? 'ready' : ''} ${L.narrow ? 'tip-above' : ''}`}
          style={{ left: L.deck.x - L.cardW / 2 - 6, top: L.deck.y - L.cardH / 2 - 22, width: L.cardW + 12, height: L.cardH + 28 }}
          onClick={() => {
            if (phase === 'draw') drawCard();
            else if (phase === 'question' || (phase === 'shuffle' && !shuffling)) doShuffle();
            else if (canClarify) requestClarifier();
          }}
          aria-label="Deck">
          {phase === 'draw' && !lifting && <span className="deck-tip">{verb} to draw</span>}
          {(phase === 'question' || (phase === 'shuffle' && !shuffling)) && <span className="deck-tip soft">{verb} to shuffle</span>}
          <span className="deck-count">{deck.length}</span>
        </button>
      )}

      {/* Clarifying card: right next to the deck, available after each card is turned over */}
      {view === 'table' && canClarify && (
        <button className={`clar-btn ${L.narrow ? 'side' : ''}`} onClick={requestClarifier}
          style={L.narrow
            ? { left: L.deck.x + L.cardW / 2 + 12, top: L.deck.y, maxWidth: Math.max(110, L.W - (L.deck.x + L.cardW / 2 + 12) - 10) }
            : { left: Math.max(L.area.left + 4, L.deck.x - 95), top: L.deck.y + L.cardH / 2 + 14 }}>
          <b>+ Clarifying card</b>
          <small>for “{clarTarget}” · {MAX_CLARIFIERS - clarifiers} left</small>
        </button>
      )}

      <Panel
        L={L} phase={phase} spread={spread} spreads={SPREADS} question={question} setQuestion={setQuestion}
        onPreview={setPreviewId} onPick={pickSpread} onBack={() => { setSpreadId(null); setPhase('choose'); }}
        onShuffle={doShuffle} shuffling={shuffling} shuffles={shuffles} onStartDrawing={startDrawing}
        drawn={drawn} selected={selected} setSelected={setSelected} nextFlip={nextFlip}
        onFocus={setFocus} notes={notes} setNotes={setNotes} canClarify={canClarify}
        onNew={resetAll} onSummary={showSummary} verb={verb}
        collapsed={sheetCollapsed} onToggleSheet={() => setSheetCollapsed(c => !c)}
      />

      {view === 'browse' && <Browse onClose={() => setView('table')} onOpen={c => setFocus({ id: c.id, browse: true })} />}
      {view === 'history' && <History onClose={() => setView('table')} onOpen={setFocus} />}
      {view === 'guide' && <Guide onClose={() => setView('table')} />}
      {themeOpen && <ThemePicker theme={theme} onChange={changeTheme} shine={shine} onShine={changeShine} onClose={() => setThemeOpen(false)} />}
      {view === 'decks' && <DeckPicker current={deckKey} onPick={chooseDeck} onClose={() => setView('table')} />}
      {focus && <CardReader {...focus} onClose={() => setFocus(null)} />}
    </div>
    </ShineContext.Provider>
    </DeckContext.Provider>
  );
}
