import { useState } from 'react';
import { GUIDE_CARDS } from '../spreads.js';

const img = id => `${import.meta.env.BASE_URL}cards/${id}.webp`;

// The deck's own instruction cards, shown as front/back pairs.
export default function Guide({ onClose }) {
  const [zoom, setZoom] = useState(null);
  const pairs = [];
  for (let i = 0; i < GUIDE_CARDS.length; i += 2) pairs.push(GUIDE_CARDS.slice(i, i + 2));
  return (
    <div className="overlay page">
      <div className="page-head">
        <h2>The Deck’s Guide Cards</h2>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="howto">
        <h3>How this table works</h3>
        <ol>
          <li><b>Choose</b> a reading. Its positions appear as outlines on the cloth.</li>
          <li><b>Ask</b> your question. Keep it open-ended (how, what, why).</li>
          <li><b>Shuffle</b> as many times as feels right. Every card lands either way up, and you can’t tell which from the back.</li>
          <li><b>Draw</b> by clicking the deck. Each card goes to the next glowing outline.</li>
          <li><b>Reveal</b> each card by clicking it. If it comes up upside down, read the reversed meaning.</li>
          <li><b>Reflect</b> and journal. The reading saves to History.</li>
        </ol>
        <p className="muted">Tip: double-click a revealed card, or use “Read it large”, to see its meaning in big print.</p>
      </div>
      <div className="guide-grid">
        {pairs.map(p => (
          <div key={p[0]} className="guide-pair">
            {p.map(id => (
              <button key={id} onClick={() => setZoom(id)}><img src={img(id)} alt="Guide card" loading="lazy" /></button>
            ))}
          </div>
        ))}
      </div>
      {zoom && (
        <div className="overlay reader" onClick={() => setZoom(null)}>
          <img className="guide-zoom" src={img(zoom)} alt="Guide card" />
        </div>
      )}
    </div>
  );
}
