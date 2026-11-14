import { DECKS, cardImg, backImg } from '../decks.js';

const SAMPLES = ['T-00', 'T-17', 'C-0A'];

export default function DeckPicker({ current, onPick, onClose }) {
  return (
    <div className="overlay page">
      <div className="page-head">
        <h2>Choose Your Deck Art</h2>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <p className="muted center">Meanings stay the same in every deck. Only the artwork changes. You can switch at any time, even mid-reading.</p>
      <div className="deck-list">
        {DECKS.map(d => (
          <button key={d.key} className={`deck-option ${current === d.key ? 'on' : ''}`} onClick={() => onPick(d.key)}>
            <div className="deck-fan">
              <img src={backImg(d.key)} alt="" style={{ aspectRatio: `1 / ${d.ratio}` }} />
              {SAMPLES.map(id => <img key={id} src={cardImg(d.key, id)} alt="" loading="lazy" style={{ aspectRatio: `1 / ${d.ratio}` }} />)}
            </div>
            <b>{d.name}</b>
            <small>{d.maker} · {d.note}</small>
            {current === d.key && <span className="deck-badge">In use</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
