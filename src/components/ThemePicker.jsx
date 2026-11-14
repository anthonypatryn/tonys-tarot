import { PRESETS } from '../themes.js';

export default function ThemePicker({ theme, onChange, onClose }) {
  const set = patch => onChange({ ...theme, key: 'custom', name: 'Custom', ...patch });
  return (
    <div className="theme-pop" role="dialog" aria-label="Table theme">
      <div className="theme-head">
        <b>Table Theme</b>
        <button className="close small-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="theme-swatches">
        {PRESETS.map(p => (
          <button key={p.key} className={`swatch ${theme.key === p.key ? 'on' : ''}`} onClick={() => onChange({ ...p })} title={p.name}>
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
    </div>
  );
}
