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

  const drawCard = useCallback(() => {
    if (!spread || deck.length === 0 || lifting) return;
    const totalSlots = spread.positions.length + clarifiers;
    if (drawn.length >= totalSlots) return;
    const top = deck[deck.length - 1];
    const axis = Math.random() < 0.5 ? 'x' : 'y'; // which edge it gets turned over by
    setDeck(d => d.slice(0, -1));
    const jitter = rnd(-2.5, 2.5); // hand-placed, never perfectly square
    setDrawn(d => [...d, { ...top, slot: d.length, flipped: false, axis, jitter }]);
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

  const flipCard = i => {
    const c = drawn[i];
    if (!c) return;
    if (c.flipped) {
      // Tap once to show it in the guide; tap the same card again to open the large reader.
      if (selected === i) setFocus({ id: c.id, reversed: c.reversed, label: spread?.positions[c.slot]?.label || 'Clarifying card' });
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
        label: spread.positions[c.slot]?.label || `Clarifying card ${c.slot - spread.positions.length + 1}`,
      })),
    });
  }, [allRevealed, phase, drawn, notes, question, spread, readingId, deckKey]);

  // Clarifying card: add a slot, then draw into it once the new slot exists.
  const pendingClar = useRef(false);
  useEffect(() => {
    if (!spread) return;
    if (pendingClar.current && drawn.length < spread.positions.length + clarifiers) {
      pendingClar.current = false;
      drawCard();
    }
  }, [clarifiers, drawCard, drawn.length, spread]);
  const requestClarifier = () => {
    if (!spread || deck.length === 0 || clarifiers >= 3 || lifting) return;
    pendingClar.current = true;
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
  const nextFlip = phase === 'reveal' || phase === 'done' ? drawn.findIndex(c => !c.flipped) : -1;
  const showSlots = !!spread && !shuffling;

  return (
    <DeckContext.Provider value={deckKey}>
    <div className="app">
      <div className="table-wood" />
      <div className="cloth">
        <div className="cloth-trim" />
      </div>
      <div className="candle c1"><span /></div>
      <div className="candle c2"><span /></div>

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
        const label = pos ? pos.label : `Clarifying card${clarifiers > 1 ? ` ${i - spread.positions.length + 1}` : ''}`;
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
              onDoubleClick={d && flipped ? () => setFocus({ id: d.id, reversed: d.reversed, label: spread?.positions[d.slot]?.label || 'Clarifying card' }) : undefined}
            >
              <div className="card-inner" style={{ transform: flipped ? (axis === 'x' ? 'rotateX(180deg)' : 'rotateY(180deg)') : 'none' }}>
                <div className="face back" style={{ backgroundImage: `url(${BACK_IMG})` }} />
                <div className="face front" style={{ transform: axis === 'x' ? 'rotateX(180deg)' : 'rotateY(180deg)' }}>
                  {d && <img src={cardImg(deckKey, d.id)} alt={CARD_BY_ID[d.id].name} draggable="false" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deck hit area */}
      {view === 'table' && (
        <button className={`deck-hit ${phase === 'draw' && !lifting ? 'ready' : ''} ${L.narrow ? 'tip-above' : ''}`}
          style={{ left: L.deck.x - L.cardW / 2 - 6, top: L.deck.y - L.cardH / 2 - 22, width: L.cardW + 12, height: L.cardH + 28 }}
          onClick={() => {
            if (phase === 'draw') drawCard();
            else if (phase === 'question' || (phase === 'shuffle' && !shuffling)) doShuffle();
          }}
          aria-label="Deck">
          {phase === 'draw' && !lifting && <span className="deck-tip">{verb} to draw</span>}
          {(phase === 'question' || (phase === 'shuffle' && !shuffling)) && <span className="deck-tip soft">{verb} to shuffle</span>}
          <span className="deck-count">{deck.length}</span>
        </button>
      )}

      <Panel
        L={L} phase={phase} spread={spread} spreads={SPREADS} question={question} setQuestion={setQuestion}
        onPreview={setPreviewId} onPick={pickSpread} onBack={() => { setSpreadId(null); setPhase('choose'); }}
        onShuffle={doShuffle} shuffling={shuffling} shuffles={shuffles} onStartDrawing={startDrawing}
        drawn={drawn} selected={selected} setSelected={setSelected} nextFlip={nextFlip}
        onFocus={setFocus} notes={notes} setNotes={setNotes} onClarify={requestClarifier}
        canClarify={deck.length > 0 && clarifiers < 3 && !lifting && drawn.every(c => c.flipped)}
        onNew={resetAll} onSummary={showSummary} verb={verb}
        collapsed={sheetCollapsed} onToggleSheet={() => setSheetCollapsed(c => !c)}
      />

      {view === 'browse' && <Browse onClose={() => setView('table')} onOpen={c => setFocus({ id: c.id, browse: true })} />}
      {view === 'history' && <History onClose={() => setView('table')} onOpen={setFocus} />}
      {view === 'guide' && <Guide onClose={() => setView('table')} />}
      {themeOpen && <ThemePicker theme={theme} onChange={changeTheme} onClose={() => setThemeOpen(false)} />}
      {view === 'decks' && <DeckPicker current={deckKey} onPick={chooseDeck} onClose={() => setView('table')} />}
      {focus && <CardReader {...focus} onClose={() => setFocus(null)} />}
    </div>
    </DeckContext.Provider>
  );
}
