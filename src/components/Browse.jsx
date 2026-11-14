import { useState } from 'react';
import { CARDS } from '../deck.js';

const FILTERS = ['All', 'Major Arcana', 'Cups', 'Pentacles', 'Swords', 'Wands'];

export default function Browse({ onClose, onOpen }) {
  const [filter, setFilter] = useState('All');
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = CARDS.filter(c => (filter === 'All' || c.suit === filter) &&
    (!term || `${c.title} ${c.upright} ${c.reversed}`.toLowerCase().includes(term)));
  return (
    <div className="overlay page">
      <div className="page-head">
        <h2>The Deck</h2>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="filters">
        {FILTERS.map(f => <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
        <input className="search" placeholder="Search names & meanings…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="grid">
        {list.map(c => (
          <button key={c.id} className="grid-card" onClick={() => onOpen(c)}>
            <img src={c.img} alt={c.name} loading="lazy" />
            <span>{c.title}</span>
          </button>
        ))}
        {list.length === 0 && <p className="muted">No cards match.</p>}
      </div>
    </div>
  );
}
