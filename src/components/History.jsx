import { useMemo, useRef, useState } from 'react';
import { CARD_BY_ID } from '../deck.js';
import { SPREADS, SPREAD_BY_ID } from '../spreads.js';
import { loadHistory, deleteReading, replaceHistory } from '../history.js';
import { cardImg, DECK_BY_KEY } from '../decks.js';
import { dayKey, groupByDay, monthGrid, streaks, insights, mergeBackup } from '../readingStats.js';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const deckOf = r => (DECK_BY_KEY[r.deck] ? r.deck : 'beginners');

function Calendar({ byDay, month, setMonth, selected, onSelect }) {
  const cells = monthGrid(month.y, month.m);
  const today = dayKey(new Date());
  const title = new Date(month.y, month.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const shift = n => setMonth(({ y, m }) => {
    const d = new Date(y, m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  return (
    <section className="cal" aria-label="Reading calendar">
      <div className="cal-head">
        <button className="cal-nav" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
        <b>{title}</b>
        <button className="cal-nav" onClick={() => shift(1)} aria-label="Next month">›</button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((w, i) => <span key={i} className="cal-wd">{w}</span>)}
        {cells.map(c => {
          const rs = byDay.get(c.key);
          const first = rs?.[rs.length - 1]?.cards?.[0];
          return (
            <button key={c.key}
              className={`cal-day ${c.inMonth ? '' : 'out'} ${rs ? 'has' : ''} ${c.key === today ? 'today' : ''} ${selected === c.key ? 'sel' : ''}`}
              disabled={!rs}
              onClick={() => onSelect(selected === c.key ? null : c.key)}
              aria-label={`${c.date.toLocaleDateString(undefined, { dateStyle: 'long' })}${rs ? `, ${rs.length} reading${rs.length > 1 ? 's' : ''}` : ''}`}>
              {first && <img src={cardImg(deckOf(rs[rs.length - 1]), first.id)} alt="" style={{ transform: first.reversed ? 'rotate(180deg)' : 'none' }} />}
              <span className="cal-num">{c.day}</span>
              {rs && rs.length > 1 && <span className="cal-count">{rs.length}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Insights({ items }) {
  const s = insights(items);
  const st = streaks(items);
  const max = Math.max(1, ...Object.values(s.suits));
  return (
    <section className="insights" aria-label="Insights">
      <div className="stat-row">
        <div className="stat"><b>{s.readings}</b><small>readings</small></div>
        <div className="stat"><b>{st.current}</b><small>day streak</small></div>
        <div className="stat"><b>{st.longest}</b><small>longest streak</small></div>
        <div className="stat"><b>{s.reversedPct}%</b><small>reversed</small></div>
      </div>
      {s.top.length > 0 && (
        <>
          <h4>Cards that keep finding you</h4>
          <div className="top-cards">
            {s.top.map(t => (
              <div key={t.id} className="top-card">
                <img src={cardImg('beginners', t.id)} alt="" />
                <span><b>{CARD_BY_ID[t.id].title}</b><small>{t.n}×</small></span>
              </div>
            ))}
          </div>
          <h4>Balance of the suits</h4>
          <div className="suit-bars">
            {Object.entries(s.suits).map(([k, v]) => (
              <div key={k} className="suit-bar">
                <span>{k === 'Major' ? 'Major Arcana' : k}</span>
                <i><em style={{ width: `${(v / max) * 100}%` }} /></i>
                <small>{v}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function History({ onClose, onOpen }) {
  const [items, setItems] = useState(loadHistory);
  const [open, setOpen] = useState(null);
  const [day, setDay] = useState(null);
  const [spread, setSpread] = useState('');
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const fileRef = useRef(null);
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const byDay = useMemo(() => groupByDay(items), [items]);

  const q = query.trim().toLowerCase();
  const shown = items.filter(r =>
    (!day || dayKey(r.date) === day) &&
    (!spread || r.spreadId === spread) &&
    (!q || [r.question, r.notes, SPREAD_BY_ID[r.spreadId]?.name, ...r.cards.map(c => CARD_BY_ID[c.id]?.title)]
      .some(t => t && t.toLowerCase().includes(q))));

  const remove = id => {
    if (window.confirm('Delete this reading from your history? This can’t be undone.')) setItems(deleteReading(id));
  };
  const backup = () => {
    const blob = new Blob([JSON.stringify(items, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tonys-tarot-readings-${dayKey(new Date())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const restore = async e => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const { merged, added } = mergeBackup(items, JSON.parse(await f.text()));
      setItems(replaceHistory(merged));
      setNote(added ? `Restored ${added} reading${added > 1 ? 's' : ''}.` : 'Everything in that backup is already here.');
    } catch {
      setNote('That file isn’t a Tony’s Tarot backup.');
    }
  };
  const pickDay = k => {
    setDay(k);
    if (k) {
      const [y, m] = k.split('-').map(Number);
      setMonth({ y, m: m - 1 });
    }
  };

  return (
    <div className="overlay page">
      <div className="page-head">
        <h2>My Readings</h2>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      {items.length === 0 ? (
        <p className="muted center empty-note">No readings yet. They’re saved here automatically when you turn over the last card of a reading.</p>
      ) : (
        <div className="readings-layout">
          <aside className="readings-side">
            <Calendar byDay={byDay} month={month} setMonth={setMonth} selected={day} onSelect={pickDay} />
            <Insights items={items} />
            <div className="backup">
              <button className="ghost small" onClick={backup}>⤓ Back up journal</button>
              <button className="ghost small" onClick={() => fileRef.current?.click()}>⤒ Restore</button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={restore} />
              {note && <small className="backup-note" role="status">{note}</small>}
            </div>
          </aside>
          <section className="readings-main">
            <div className="h-filters">
              <input type="search" placeholder="Search questions, notes, cards…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search readings" />
              <select value={spread} onChange={e => setSpread(e.target.value)} aria-label="Filter by spread">
                <option value="">All spreads</option>
                {SPREADS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {day && (
              <button className="chip day-chip" onClick={() => setDay(null)}>
                {new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { dateStyle: 'long' })} ✕
              </button>
            )}
            {shown.length === 0 && <p className="muted center">No readings match.</p>}
            <div className="history">
              {shown.map(r => {
                const s = SPREAD_BY_ID[r.spreadId];
                const isOpen = open === r.id;
                return (
                  <div key={r.id} className={`h-item ${isOpen ? 'open' : ''}`}>
                    <button className="h-head" onClick={() => setOpen(isOpen ? null : r.id)} aria-expanded={isOpen}>
                      <span className="h-date">{new Date(r.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} · {DECK_BY_KEY[deckOf(r)].name}</span>
                      <b>{s?.name}</b>
                      {r.question && <em>“{r.question}”</em>}
                      <span className="h-thumbs">
                        {r.cards.map(c => (
                          <img key={c.id} src={cardImg(deckOf(r), c.id)} alt={CARD_BY_ID[c.id]?.title} style={{ transform: c.reversed ? 'rotate(180deg)' : 'none' }} />
                        ))}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="h-body">
                        {r.cards.map(c => (
                          <button key={c.id} className="sum-row" onClick={() => onOpen({ id: c.id, reversed: c.reversed, label: c.label, deck: deckOf(r) })}>
                            <span className="sum-pos">✦</span>
                            <span>
                              <small>{c.label}</small>
                              <b>{CARD_BY_ID[c.id].title}</b>{c.reversed ? ' · reversed' : ' · upright'}
                              <em>{c.reversed ? CARD_BY_ID[c.id].reversed : CARD_BY_ID[c.id].upright}</em>
                            </span>
                          </button>
                        ))}
                        {r.notes && <div className="h-notes"><b>Journal:</b> {r.notes}</div>}
                        <button className="ghost small danger" onClick={() => remove(r.id)}>Delete reading</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
