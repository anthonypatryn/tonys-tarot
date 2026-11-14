import { useState } from 'react';
import { CARD_BY_ID } from '../deck.js';
import { SUIT_MEANINGS, RANK_MEANINGS } from '../spreads.js';

// Full-screen, large-print view of one card and its meaning(s).
export default function CardReader({ id, reversed = false, label, browse, onClose }) {
  const c = CARD_BY_ID[id];
  const [upsideDown, setUpsideDown] = useState(!!reversed);
  if (!c) return null;
  return (
    <div className="overlay reader" onClick={onClose}>
      <div className="reader-box" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
        <div className="reader-img">
          <img src={c.img} alt={c.name} style={{ transform: upsideDown ? 'rotate(180deg)' : 'none' }} />
          <button className="ghost small" onClick={() => setUpsideDown(u => !u)}>↻ Turn card around</button>
        </div>
        <div className="reader-text">
          {label && <div className="pos-tag">{label}</div>}
          <h2>{c.title}</h2>
          <p className="keywords">
            <b>{c.suit}</b>: {SUIT_MEANINGS[c.suit]}{c.rank && <> · <b>{c.rank}</b>: {RANK_MEANINGS[c.rank]}</>}
          </p>
          {browse ? (
            <>
              <div className="orient up">↑ Upright</div>
              <p className="meaning-text xl">{c.upright}</p>
              <div className="orient rev">↓ Reversed</div>
              <p className="meaning-text xl">{c.reversed}</p>
            </>
          ) : (
            <>
              <div className={`orient ${reversed ? 'rev' : 'up'}`}>{reversed ? '↓ Reversed' : '↑ Upright'}</div>
              <p className="meaning-text xl">{reversed ? c.reversed : c.upright}</p>
              <details>
                <summary>If it had landed {reversed ? 'upright' : 'reversed'}</summary>
                <p className="meaning-text">{reversed ? c.upright : c.reversed}</p>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
