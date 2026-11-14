import { CARD_BY_ID } from '../deck.js';
import { SUIT_MEANINGS, RANK_MEANINGS } from '../spreads.js';
import { useDeck, deckName } from '../decks.js';

const STEPS = [
  ['choose', 'Choose'], ['question', 'Ask'], ['shuffle', 'Shuffle'], ['draw', 'Draw'], ['reveal', 'Reveal'], ['done', 'Reflect'],
];

export function MiniSpread({ spread, size = 64 }) {
  const xs = spread.positions.map(p => p.x), ys = spread.positions.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const cw = 10, ch = 17, gx = 13, gy = 20;
  const w = (maxX - minX) * gx + cw, h = (maxY - minY) * gy + ch;
  return (
    <svg viewBox={`-2 -2 ${w + 4} ${h + 4}`} width={size} height={size} className="mini">
      {spread.positions.map((p, i) => (
        <g key={i}>
          <rect x={(p.x - minX) * gx} y={(p.y - minY) * gy} width={cw} height={ch} rx="1.6" />
          <text x={(p.x - minX) * gx + cw / 2} y={(p.y - minY) * gy + ch / 2 + 2.6}>{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

export function Meaning({ card, reversed, big }) {
  const c = CARD_BY_ID[card];
  return (
    <div className={`meaning ${big ? 'big' : ''}`}>
      <div className={`orient ${reversed ? 'rev' : 'up'}`}>{reversed ? '↓ Reversed' : '↑ Upright'}</div>
      <p className="meaning-text">{reversed ? c.reversed : c.upright}</p>
    </div>
  );
}

function Keywords({ id }) {
  const c = CARD_BY_ID[id];
  return (
    <p className="keywords">
      <b>{c.suit}</b>: {SUIT_MEANINGS[c.suit]}
      {c.rank && <> · <b>{c.rank}</b>: {RANK_MEANINGS[c.rank]}</>}
    </p>
  );
}

export default function Panel(p) {
  const { phase, spread, L } = p;
  const deckKey = useDeck();
  const stepIdx = STEPS.findIndex(s => s[0] === phase);
  const label = i => spread?.positions[drawnSlot(i)]?.label || 'Clarifying card';
  const drawnSlot = i => p.drawn[i]?.slot ?? i;

  let body;
  if (phase === 'choose') {
    body = (
      <>
        <h2>What would you like to explore?</h2>
        <p className="lead">Pick a reading. Its card positions will appear on the cloth.</p>
        <div className="spread-list">
          {p.spreads.map(s => (
            <button key={s.id} className="spread-tile" onMouseEnter={() => p.onPreview(s.id)} onMouseLeave={() => p.onPreview(null)}
              onFocus={() => p.onPreview(s.id)} onBlur={() => p.onPreview(null)} onClick={() => p.onPick(s.id)}>
              <MiniSpread spread={s} size={54} />
              <span>
                <b>{s.name}</b>
                <small>{s.positions.length} card{s.positions.length > 1 ? 's' : ''} · {s.blurb}</small>
              </span>
            </button>
          ))}
        </div>
      </>
    );
  } else if (phase === 'question') {
    body = (
      <>
        <div className="kicker">Spread {spread.number} · {spread.positions.length} card{spread.positions.length > 1 ? 's' : ''}</div>
        <h2>{spread.name}</h2>
        <p className="lead">{spread.about}</p>
        <ol className="positions">
          {spread.positions.map((pos, i) => <li key={i}><span>{i + 1}</span>{pos.label}</li>)}
        </ol>
        <label className="q-label" htmlFor="q">Your question</label>
        <textarea id="q" rows={3} value={p.question} onChange={e => p.setQuestion(e.target.value)}
          placeholder="Write what you want to ask, or tap a suggestion below…" />
        <div className="chips">
          {spread.questions.map(q => <button key={q} className="chip" onClick={() => p.setQuestion(q)}>{q}</button>)}
        </div>
        <div className="tip">
          <b>Tip:</b> Ask open-ended questions (how, what, why) instead of yes/no ones. For example, try “How can I meet my ideal partner?” rather than “Will I meet my ideal partner?” Focused questions give clearer readings.
        </div>
        <div className="actions">
          <button className="ghost" onClick={p.onBack}>← Other readings</button>
          <button className="primary" onClick={p.onShuffle}>Shuffle the deck</button>
        </div>
      </>
    );
  } else if (phase === 'shuffle') {
    body = (
      <>
        <div className="kicker">{spread.name}</div>
        <h2>{p.shuffling ? 'Shuffling…' : 'Shuffle until it feels right'}</h2>
        {p.question && <blockquote className="the-q">“{p.question}”</blockquote>}
        <p className="lead">
          Clear your mind and keep your question in focus as the cards mix. Each card lands either way up, and you won’t know which until you turn it over.
        </p>
        <p className="muted">Shuffled {p.shuffles} time{p.shuffles === 1 ? '' : 's'}.</p>
        <div className="actions">
          <button className="ghost" disabled={p.shuffling} onClick={p.onShuffle}>Shuffle again</button>
          <button className="primary" disabled={p.shuffling || p.shuffles === 0} onClick={p.onStartDrawing}>I’m ready, let’s draw</button>
        </div>
      </>
    );
  } else if (phase === 'draw') {
    const n = p.drawn.length;
    body = (
      <>
        <div className="kicker">{spread.name}</div>
        <h2>Draw from the top of the deck</h2>
        {p.question && <blockquote className="the-q">“{p.question}”</blockquote>}
        {n < spread.positions.length && (
          <p className="lead big-instruction">
            Click the deck to place a card in <b>position {n + 1}: {spread.positions[n].label}</b>.
          </p>
        )}
        <ol className="positions">
          {spread.positions.map((pos, i) => (
            <li key={i} className={i < n ? 'done' : i === n ? 'current' : ''}><span>{i < n ? '✓' : i + 1}</span>{pos.label}</li>
          ))}
        </ol>
        <p className="muted">Cards stay face down until every position is filled.</p>
      </>
    );
  } else if (phase === 'reveal' || phase === 'done') {
    const sel = p.selected != null ? p.drawn[p.selected] : null;
    const allFlipped = p.drawn.every(c => c.flipped);
    body = (
      <>
        <div className="kicker">{spread.name}</div>
        {p.question && <blockquote className="the-q">“{p.question}”</blockquote>}

        {!allFlipped && p.nextFlip >= 0 && (
          <p className="lead big-instruction">
            Turn over <b>{p.drawn[p.nextFlip].slot < spread.positions.length ? `position ${p.drawn[p.nextFlip].slot + 1}: ` : ''}{label(p.nextFlip)}</b>. Click the glowing card.
          </p>
        )}

        {sel && sel.flipped && (
          <div className="reading-card">
            <div className="pos-tag">{sel.slot < spread.positions.length ? `Position ${sel.slot + 1} · ${label(p.selected)}` : 'Clarifying card'}</div>
            <h3>{CARD_BY_ID[sel.id].title}</h3>
            {deckName(deckKey, sel.id) && <div className="alt-name">In this deck: {deckName(deckKey, sel.id)}</div>}
            <Meaning card={sel.id} reversed={sel.reversed} big />
            <Keywords id={sel.id} />
            <button className="ghost small" onClick={() => p.onFocus({ id: sel.id, reversed: sel.reversed, label: label(p.selected) })}>
              ⤢ Read it large
            </button>
          </div>
        )}

        {phase === 'reveal' && allFlipped && (
          <div className="summary-cta">
            <p className="muted">All cards are turned over. Take your time with this one, or tap any card on the cloth to read it again.</p>
            <button className="primary" onClick={p.onSummary}>See your full reading →</button>
          </div>
        )}

        {phase === 'done' && (
          <>
            <h2 className="sum-title">Your reading</h2>
            <div className="summary">
              {p.drawn.map((c, i) => (
                <button key={c.id} className={`sum-row ${p.selected === i ? 'on' : ''}`} onClick={() => p.setSelected(i)}>
                  <span className="sum-pos">{c.slot < spread.positions.length ? c.slot + 1 : '✦'}</span>
                  <span>
                    <small>{label(i)}</small>
                    <b>{CARD_BY_ID[c.id].title}</b>{c.flipped ? (c.reversed ? ' · reversed' : ' · upright') : ' · face down'}
                    {c.flipped && <em>{c.reversed ? CARD_BY_ID[c.id].reversed : CARD_BY_ID[c.id].upright}</em>}
                  </span>
                </button>
              ))}
            </div>
            <div className="reflect">
              <h4>Reflect</h4>
              <ul>
                <li>What’s your first impression or gut feeling?</li>
                <li>Read the cards in order. What story do they tell?</li>
                <li>Do any symbols, colors, or numbers stand out?</li>
                <li>Does it resonate? If you have a follow-up question, draw a clarifying card.</li>
              </ul>
              <label className="q-label" htmlFor="notes">Journal (saved with this reading)</label>
              <textarea id="notes" rows={4} value={p.notes} onChange={e => p.setNotes(e.target.value)} placeholder="What came to mind…" />
            </div>
            <div className="actions">
              <button className="ghost" disabled={!p.canClarify} onClick={p.onClarify}>+ Clarifying card</button>
              <button className="primary" onClick={p.onNew}>New reading</button>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <aside className={`panel ${L.narrow ? 'sheet' : ''}`} style={L.narrow ? { height: L.sheetH } : { width: L.panelW }}>
      <div className="steps">
        {STEPS.map(([k, name], i) => (
          <span key={k} className={i < stepIdx ? 'past' : i === stepIdx ? 'now' : ''}>{name}</span>
        ))}
      </div>
      <div className="panel-body" key={phase}>{body}</div>
    </aside>
  );
}
