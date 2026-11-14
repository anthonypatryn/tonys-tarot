import { useState } from 'react';
import { CARD_BY_ID } from '../deck.js';
import { SPREAD_BY_ID } from '../spreads.js';
import { loadHistory, deleteReading } from '../history.js';
import { cardImg, DECK_BY_KEY } from '../decks.js';

export default function History({ onClose, onOpen }) {
  const [items, setItems] = useState(loadHistory);
  const [open, setOpen] = useState(null);
  const remove = id => {
    if (window.confirm('Delete this reading from your history? This can’t be undone.')) setItems(deleteReading(id));
  };
  return (
    <div className="overlay page">
      <div className="page-head">
        <h2>Past Readings</h2>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      {items.length === 0 && <p className="muted center">No readings yet. They’re saved here automatically when you finish one.</p>}
      <div className="history">
        {items.map(r => {
          const s = SPREAD_BY_ID[r.spreadId];
          const isOpen = open === r.id;
          return (
            <div key={r.id} className={`h-item ${isOpen ? 'open' : ''}`}>
              <button className="h-head" onClick={() => setOpen(isOpen ? null : r.id)}>
                <span className="h-date">{new Date(r.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <b>{s?.name}</b>
                {r.question && <em>“{r.question}”</em>}
                <span className="h-thumbs">
                  {r.cards.map(c => (
                    <img key={c.id} src={cardImg(r.deck || 'beginners', c.id)} alt="" style={{ transform: c.reversed ? 'rotate(180deg)' : 'none' }} />
                  ))}
                </span>
              </button>
              {isOpen && (
                <div className="h-body">
                  {r.cards.map(c => (
                    <button key={c.id} className="sum-row" onClick={() => onOpen({ id: c.id, reversed: c.reversed, label: c.label, deck: DECK_BY_KEY[r.deck] ? r.deck : 'beginners' })}>
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
    </div>
  );
}
