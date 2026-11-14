import { useEffect, useRef, useState } from 'react';
import { CARD_BY_ID } from '../deck.js';
import { SUIT_MEANINGS, RANK_MEANINGS } from '../spreads.js';
import { useDeck, cardImg, backImg, deckName, DECK_BY_KEY } from '../decks.js';
import { useShine, holoProps } from '../shine.js';
import HoloCard from '../reactbits/HoloCard.jsx';
import FlipCard from '../reactbits/FlipCard.jsx';
import '../reactbits/FlipCard.css';

// Width of an element, kept up to date.
function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setW(Math.round(el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

// The zoomed card: tilts with the pointer, shimmers, and can be flipped over by tapping or dragging it.
function ZoomCard({ deckKey, id, name, upsideDown }) {
  const s = useShine();
  const [ref, w] = useWidth();
  const ratio = DECK_BY_KEY[deckKey].ratio;
  const h = Math.round(w * ratio);
  const radius = Math.round((s.radius * w) / 320);
  const front = s.holo ? (
    <div className="zoom-face" style={{ transform: upsideDown ? 'rotate(180deg)' : 'none' }}>
      <HoloCard className="hc-fill" image={cardImg(deckKey, id)} alt={name} {...holoProps(s, w)} hoverScale={1} shadow={false} rotation={upsideDown ? 180 : 0} />
    </div>
  ) : (
    <img className="zoom-face" src={cardImg(deckKey, id)} alt={name} draggable="false" style={{ transform: upsideDown ? 'rotate(180deg)' : 'none' }} />
  );
  return (
    <div ref={ref} className="zoom-wrap" style={{ height: h || undefined }}>
      {w > 0 && (
        <FlipCard
          className="reader-flip"
          key={`${id}-${s.flipAxis}`}
          front={front}
          back={<img className="zoom-face" src={backImg(deckKey)} alt="Card back" draggable="false" />}
          axis={s.flipAxis} flipOnClick={s.flipOnClick} draggable={s.draggable}
          tilt={!s.holo} tiltMax={s.tiltMax} glare={!s.holo} hoverScale={s.hoverScale}
          perspective={s.perspective} stiffness={s.stiffness} damping={s.damping}
          width={w} height={h} radius={radius} background="transparent" shadow={s.shadow} ariaLabel={`Turn over ${name}`}
        />
      )}
    </div>
  );
}

// Full-screen, large-print view of one card and its meaning(s).
export default function CardReader({ id, reversed = false, label, browse, deck, onClose }) {
  const current = useDeck();
  const deckKey = deck || current;
  const c = CARD_BY_ID[id];
  const alt = deckName(deckKey, id);
  const [upsideDown, setUpsideDown] = useState(!!reversed);
  if (!c) return null;
  return (
    <div className="overlay reader" onClick={onClose}>
      <div className="reader-box" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
        <div className="reader-img">
          <ZoomCard deckKey={deckKey} id={id} name={c.name} upsideDown={upsideDown} />
          <small className="zoom-hint">{matchMedia('(pointer: coarse)').matches ? 'Tap or swipe the card to turn it over' : 'Move over the card to tilt it · click or drag to turn it over'}</small>
          <button className="ghost small" onClick={() => setUpsideDown(u => !u)}>↻ Turn card around</button>
        </div>
        <div className="reader-text">
          {label && <div className="pos-tag">{label}</div>}
          <h2>{c.title}</h2>
          {alt && <div className="alt-name">In this deck: {alt}</div>}
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
