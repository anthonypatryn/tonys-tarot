import { useState } from 'react';
import { PRESETS, CLOTHS } from '../themes.js';
import { HOLO_PRESETS, DEFAULT_SHINE, holoProps } from '../shine.js';
import { cardImg } from '../decks.js';
import { useDeck } from '../decks.js';
import HoloCard from '../reactbits/HoloCard.jsx';
import { BALL_PRESETS } from '../reactbits/CrystalizedBall.jsx';
import { BALL_PRESET_NAMES } from '../shine.js';

// Controls styled after the React Bits "Customize" panels: a filled bar behind each slider row.
function Slider({ label, value, min, max, step, onChange, fmt = v => v }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="ctl slider">
      <span className="ctl-fill" style={{ width: `${pct}%` }} />
      <span className="ctl-label">{label}</span>
      <span className="ctl-value">{fmt(value)}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} aria-label={label} />
    </label>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <button type="button" className="ctl toggle" role="switch" aria-checked={value} onClick={() => onChange(!value)}>
      <span className="ctl-label">{label}</span>
      <span className={`switch ${value ? 'on' : ''}`}><span /></span>
    </button>
  );
}
function Select({ label, value, options, onChange }) {
  return (
    <label className="ctl select">
      <span className="ctl-label">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}
function Color({ label, value, onChange }) {
  return (
    <label className="ctl color">
      <span className="ctl-label">{label}</span>
      <span className="ctl-color">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} />
        <input type="text" value={value} spellCheck="false" maxLength={7}
          onChange={e => /^#[0-9a-f]{6}$/i.test(e.target.value) && onChange(e.target.value.toLowerCase())} />
      </span>
    </label>
  );
}

const cap = s => s[0].toUpperCase() + s.slice(1);
const SAMPLE_CARDS = [['T-17', 'The Star'], ['T-19', 'The Sun'], ['T-18', 'The Moon'], ['T-01', 'The Magician'], ['C-0A', 'Ace of Cups'], ['W-QU', 'Queen of Wands']];

export default function ThemePicker({ theme, onChange, shine, onShine, onClose }) {
  const [tab, setTab] = useState('table');
  const [sample, setSample] = useState('T-17');
  const deckKey = useDeck();
  const set = patch => onChange({ ...theme, key: 'custom', name: 'Custom', ...patch });
  const setPat = patch => onChange({ ...theme, ...patch });
  const sh = patch => onShine({ ...shine, ...patch });
  const pattern = theme.pattern || 'none';

  return (
    <div className="theme-pop" role="dialog" aria-label="Table theme">
      <div className="theme-head">
        <b>Customize</b>
        <button className="close small-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="theme-tabs" role="tablist">
        {[['table', 'Table'], ['shine', 'Card Shine'], ['ball', 'Crystal Ball'], ['zoom', 'Zoomed Card']].map(([k, t]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>
        ))}
      </div>

      {tab === 'table' && (
        <>
          <div className="theme-swatches">
            {PRESETS.map(p => (
              <button key={p.key} className={`swatch ${theme.key === p.key ? 'on' : ''}`} onClick={() => onChange({ ...theme, ...p })} title={p.name}>
                <span className="swatch-cloth" style={{ background: `radial-gradient(circle at 40% 40%, ${p.cloth}, #000 140%)` }}>
                  <span className="swatch-accent" style={{ background: p.accent }} />
                </span>
                <small>{p.name}</small>
              </button>
            ))}
          </div>
          <div className="theme-custom">
            <label><input type="color" value={theme.cloth} onChange={e => set({ cloth: e.target.value })} /> Cloth</label>
            <label><input type="color" value={theme.accent} onChange={e => set({ accent: e.target.value })} /> Accents</label>
            <label><input type="color" value={theme.ink} onChange={e => set({ ink: e.target.value })} /> Text</label>
          </div>

          <h5 className="ctl-head">Cloth pattern</h5>
          <div className="cloth-choices">
            <button className={`cloth-choice ${pattern === 'none' ? 'on' : ''}`} onClick={() => setPat({ pattern: 'none' })}>
              <span className="cloth-thumb plain" style={{ background: `radial-gradient(circle, ${theme.cloth}, #000 150%)` }} />
              <small>Plain velvet</small>
            </button>
            {Object.entries(CLOTHS).map(([k, c]) => (
              <button key={k} className={`cloth-choice ${pattern === k ? 'on' : ''}`} onClick={() => setPat({ pattern: k })}>
                {theme.patternMode === 'original'
                  ? <span className="cloth-thumb" style={{ backgroundImage: `url(${c.img})` }} />
                  : <span className="cloth-thumb" style={{ background: `radial-gradient(circle, ${theme.cloth}, #000 150%)` }}>
                      <span className="cloth-thumb-mask" style={{ WebkitMaskImage: `url(${c.mask})`, maskImage: `url(${c.mask})`, background: theme.patternColor || theme.accent }} />
                    </span>}
                <small>{c.name}</small>
              </button>
            ))}
          </div>
          {pattern !== 'none' && (
            <div className="ctl-grid">
              <Select label="Colors" value={theme.patternMode || 'tint'} onChange={v => setPat({ patternMode: v })}
                options={[['tint', 'Tinted'], ['original', 'Original']]} />
              {theme.patternMode !== 'original' && (
                <Color label="Tint" value={theme.patternColor || theme.accent} onChange={v => setPat({ patternColor: v })} />
              )}
              <Slider label="Strength" value={theme.patternOpacity ?? 0.6} min={0.1} max={1} step={0.05} onChange={v => setPat({ patternOpacity: v })} fmt={v => v.toFixed(2)} />
              <Select label="Size" value={theme.patternFit || 'cover'} onChange={v => setPat({ patternFit: v })}
                options={[['cover', 'Edge to edge'], ['contain', 'Fit whole design']]} />
            </div>
          )}
        </>
      )}

      {tab === 'shine' && (
        <>
          <div className="shine-preview">
            {shine.holo
              ? <HoloCard key={sample + deckKey} image={cardImg(deckKey, sample)} {...holoProps(shine, 150)} width={150} />
              : <img src={cardImg(deckKey, sample)} alt="" style={{ width: 150, borderRadius: 8 }} />}
          </div>
          <div className="ctl-grid">
            <Toggle label="Holo shine" value={shine.holo} onChange={v => sh({ holo: v })} />
            <Select label="Card" value={sample} onChange={setSample} options={SAMPLE_CARDS} />
            <Select label="Preset" value={shine.preset} onChange={v => sh({ preset: v })} options={HOLO_PRESETS.map(p => [p, cap(p)])} />
            <Color label="Foil Color" value={shine.foilColor} onChange={v => sh({ foilColor: v })} />
            <Slider label="Intensity" value={shine.intensity} min={0} max={1} step={0.01} onChange={v => sh({ intensity: v })} fmt={v => v.toFixed(2)} />
            <Slider label="Scale" value={shine.scale} min={0.25} max={4} step={0.05} onChange={v => sh({ scale: v })} />
            <Slider label="Edge Sparkle" value={shine.edgeSparkle} min={0} max={1} step={0.05} onChange={v => sh({ edgeSparkle: v })} />
            <Slider label="Frame" value={shine.frame} min={0} max={20} step={1} onChange={v => sh({ frame: v })} fmt={v => `${v}%`} />
            <Slider label="Glare" value={shine.glare} min={0} max={1} step={0.05} onChange={v => sh({ glare: v })} />
            <Slider label="Tilt" value={shine.tiltMax} min={0} max={45} step={1} onChange={v => sh({ tiltMax: v })} fmt={v => `${v}°`} />
            <Slider label="Hover Scale" value={shine.hoverScale} min={0.8} max={1.3} step={0.01} onChange={v => sh({ hoverScale: v })} fmt={v => v.toFixed(2)} />
            <Slider label="Radius" value={shine.radius} min={0} max={40} step={1} onChange={v => sh({ radius: v })} fmt={v => `${v}px`} />
            <Toggle label="Idle Shimmer" value={shine.idle} onChange={v => sh({ idle: v })} />
            <Toggle label="Shadow" value={shine.shadow} onChange={v => sh({ shadow: v })} />
          </div>
          <button className="ghost small reset" onClick={() => onShine({ ...shine, ...pick(DEFAULT_SHINE, SHINE_KEYS) })}>↺ Reset</button>
        </>
      )}

      {tab === 'ball' && (() => {
        const b = shine.ball;
        const base = BALL_PRESETS[b.preset] || BALL_PRESETS.plasma;
        const v = k => (b.overrides[k] ?? base[k]);
        const ov = (k, val) => onShine({ ...shine, ball: { ...b, overrides: { ...b.overrides, [k]: val } } });
        const sb = patch => onShine({ ...shine, ball: { ...b, ...patch } });
        const num = (k, label, min, max, step, fmt) => <Slider key={k} label={label} value={v(k)} min={min} max={max} step={step} onChange={x => ov(k, x)} fmt={fmt || (x => x)} />;
        return (
          <>
            <p className="ctl-note">The glowing ball on the table. It stirs when you move near it and surges while you shuffle and draw.</p>
            <div className="ctl-grid">
              <Select label="Preset" value={b.preset} onChange={x => sb({ preset: x, overrides: {} })} options={BALL_PRESET_NAMES.map(n => [n, cap(n)])} />
              <Select label="Motion" value={v('motion')} onChange={x => ov('motion', x)} options={['rise', 'fall', 'drift', 'orbit'].map(n => [n, cap(n)])} />
              <Select label="Particle Shape" value={v('particleShape')} onChange={x => ov('particleShape', x)} options={[['square', 'Square'], ['round', 'Round']]} />
              <Color label="Color" value={v('color').toLowerCase()} onChange={x => ov('color', x)} />
              {num('glow', 'Glow', 0, 2, 0.05)}
              {num('haze', 'Haze', 0, 2, 0.05)}
              {num('strands', 'Strands', 0, 10, 1)}
              {num('crackle', 'Crackle', 0, 1, 0.05)}
              {num('flares', 'Flares', 0, 1, 0.05)}
              {num('sparks', 'Sparks', 0, 1, 0.05)}
              {num('particleCount', 'Particles', 0, 40000, 1000)}
              {num('fill', 'Fill', 0, 1, 0.05)}
              {num('depth', 'Depth', 0, 1, 0.05)}
              {num('twinkle', 'Twinkle', 0, 1, 0.05)}
              {num('dustSpeed', 'Dust Speed', 0, 3, 0.1)}
              {num('sway', 'Sway', 0, 1, 0.05)}
              <Slider label="Speed" value={b.speed} min={0} max={3} step={0.1} onChange={x => sb({ speed: x })} />
              <Slider label="Hover Strength" value={b.hoverStrength} min={0} max={1} step={0.05} onChange={x => sb({ hoverStrength: x })} />
              <Toggle label="Interactive" value={b.interactive} onChange={x => sb({ interactive: x })} />
              <Toggle label="Intro" value={b.intro} onChange={x => sb({ intro: x })} />
              <Toggle label="Paused" value={b.paused} onChange={x => sb({ paused: x })} />
            </div>
            <button className="ghost small reset" onClick={() => onShine({ ...shine, ball: { ...DEFAULT_SHINE.ball } })}>↺ Reset</button>
          </>
        );
      })()}

      {tab === 'zoom' && (
        <>
          <p className="ctl-note">How the big card behaves when you open a card to read it large.</p>
          <div className="ctl-grid">
            <Select label="Axis" value={shine.flipAxis} onChange={v => sh({ flipAxis: v })} options={[['y', 'Horizontal'], ['x', 'Vertical']]} />
            <Toggle label="Flip On Click" value={shine.flipOnClick} onChange={v => sh({ flipOnClick: v })} />
            <Toggle label="Draggable" value={shine.draggable} onChange={v => sh({ draggable: v })} />
            <Slider label="Perspective" value={shine.perspective} min={400} max={2400} step={50} onChange={v => sh({ perspective: v })} fmt={v => `${v}px`} />
            <Slider label="Stiffness" value={shine.stiffness} min={40} max={500} step={10} onChange={v => sh({ stiffness: v })} />
            <Slider label="Damping" value={shine.damping} min={4} max={60} step={1} onChange={v => sh({ damping: v })} />
          </div>
          <button className="ghost small reset" onClick={() => onShine({ ...shine, ...pick(DEFAULT_SHINE, ZOOM_KEYS) })}>↺ Reset</button>
        </>
      )}
    </div>
  );
}

const SHINE_KEYS = ['holo', 'preset', 'foilColor', 'intensity', 'scale', 'edgeSparkle', 'frame', 'glare', 'tiltMax', 'hoverScale', 'radius', 'idle', 'shadow'];
const ZOOM_KEYS = ['flipAxis', 'flipOnClick', 'draggable', 'stiffness', 'damping', 'perspective'];
const pick = (o, keys) => Object.fromEntries(keys.map(k => [k, o[k]]));
