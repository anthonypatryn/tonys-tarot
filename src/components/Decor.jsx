// Witchy table dressing seen from above: pillar candles, a crystal ball on a brass stand,
// a few crystals, and a faint embroidered moon circle on the cloth. Purely decorative (no pointer events).

function Defs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <radialGradient id="dec-wax" cx="45%" cy="42%" r="60%">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset=".55" stopColor="#f1e4c8" />
          <stop offset="1" stopColor="#c9b48c" />
        </radialGradient>
        <radialGradient id="dec-wax-dark" cx="45%" cy="42%" r="60%">
          <stop offset="0" stopColor="#5a4a5e" />
          <stop offset=".6" stopColor="#2c2230" />
          <stop offset="1" stopColor="#140e16" />
        </radialGradient>
        <radialGradient id="dec-pool" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff6dc" stopOpacity=".95" />
          <stop offset=".8" stopColor="#ffe6a8" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffe6a8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dec-brass" cx="40%" cy="38%" r="65%">
          <stop offset="0" stopColor="#f3d58a" />
          <stop offset=".5" stopColor="#b8873a" />
          <stop offset="1" stopColor="#5e3f15" />
        </radialGradient>
        <radialGradient id="dec-flame" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".35" stopColor="#fff2b0" />
          <stop offset=".7" stopColor="#ffb040" stopOpacity=".9" />
          <stop offset="1" stopColor="#ff7a20" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dec-amethyst" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3b1f5c" />
          <stop offset=".55" stopColor="#8a5cc8" />
          <stop offset="1" stopColor="#e2cdfa" />
        </linearGradient>
        <linearGradient id="dec-quartz" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b9c6cf" stopOpacity=".7" />
          <stop offset=".6" stopColor="#f4fbff" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <radialGradient id="dec-rose" cx="38%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffe3ea" />
          <stop offset=".6" stopColor="#e6a3b4" />
          <stop offset="1" stopColor="#9c5a6c" />
        </radialGradient>
        <filter id="dec-soft"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
    </svg>
  );
}

// A pillar candle on a brass dish, from above: wax top with drips, a melted pool, wick and flame.
function Candle({ x, y, r, dark = false, delay = 0 }) {
  const drips = [15, 70, 128, 200, 252, 318];
  return (
    <div className="dec dec-candle" style={{ left: x, top: y, width: r * 2, height: r * 2 }}>
      <div className="dec-candle-glow" style={{ animationDelay: `${delay}s` }} />
      <svg viewBox="-60 -60 120 120" width={r * 2} height={r * 2}>
        <ellipse cx="7" cy="9" rx="56" ry="56" fill="rgba(0,0,0,.5)" filter="url(#dec-soft)" />
        <circle r="57" fill="url(#dec-brass)" />
        <circle r="50" fill="none" stroke="rgba(60,35,10,.5)" strokeWidth="1.5" />
        {drips.map((a, i) => (
          <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 41} cy={Math.sin((a * Math.PI) / 180) * 41}
            r={5 + (i % 3) * 2} fill={dark ? '#2c2230' : '#efe2c4'} />
        ))}
        <circle r="42" fill={dark ? 'url(#dec-wax-dark)' : 'url(#dec-wax)'} />
        <circle r="25" fill="url(#dec-pool)" opacity={dark ? 0.55 : 1} />
        <circle r="2.6" fill="#1d120a" />
        <circle r="11" fill="url(#dec-flame)" className="dec-flame" style={{ animationDelay: `${delay}s` }} />
      </svg>
    </div>
  );
}

// Crystal ball on a three-claw brass stand.
function Orb({ x, y, d, active }) {
  return (
    <div className={`dec dec-orb ${active ? 'active' : ''}`} style={{ left: x, top: y, width: d, height: d }}>
      <div className="orb-cast" />
      <svg className="orb-stand" viewBox="-60 -60 120 120" width={d * 1.28} height={d * 1.28}>
        <circle r="56" fill="url(#dec-brass)" />
        <circle r="56" fill="none" stroke="rgba(40,22,5,.6)" strokeWidth="1.5" />
        <circle r="49" fill="none" stroke="rgba(255,230,160,.35)" strokeWidth="1" strokeDasharray="2 4" />
        {[0, 120, 240].map(a => (
          <path key={a} transform={`rotate(${a})`} d="M-6 -58 Q0 -40 6 -58 L4 -44 Q0 -36 -4 -44 Z" fill="#7a5420" stroke="#f0cf80" strokeWidth=".8" />
        ))}
      </svg>
      <div className="orb-glass">
        <div className="orb-mist" />
        <div className="orb-mist m2" />
        <div className="orb-core" />
        <div className="orb-shine" />
      </div>
    </div>
  );
}

// A small cluster of amethyst points with a clear quartz point and a tumbled rose quartz.
function Crystals({ x, y, s }) {
  const point = (len, w) => `M0 ${-w} L${len * 0.78} ${-w} L${len} 0 L${len * 0.78} ${w} L0 ${w} Z`;
  return (
    <div className="dec dec-crystals" style={{ left: x, top: y, width: s, height: s }}>
      <svg viewBox="-60 -60 120 120" width={s} height={s}>
        <g filter="url(#dec-soft)" opacity=".55" transform="translate(5 6)">
          <circle r="16" fill="#000" />
          <path d={point(48, 7)} transform="rotate(-30)" fill="#000" />
          <path d={point(40, 6)} transform="rotate(40)" fill="#000" />
          <path d={point(44, 7)} transform="rotate(160)" fill="#000" />
        </g>
        {[[-30, 48, 7], [40, 40, 6], [160, 44, 7], [100, 30, 5], [-110, 34, 5.5]].map(([a, len, w], i) => (
          <g key={i} transform={`rotate(${a})`}>
            <path d={point(len, w)} fill="url(#dec-amethyst)" stroke="rgba(255,255,255,.25)" strokeWidth=".7" />
            <path d={`M0 0 L${len} 0`} stroke="rgba(255,255,255,.35)" strokeWidth=".6" />
          </g>
        ))}
        <circle r="15" fill="#4a2a6e" />
        <circle r="10" fill="#6b43a0" />
        <g transform="translate(-34 30) rotate(-150)">
          <path d={point(30, 5)} fill="url(#dec-quartz)" stroke="rgba(255,255,255,.6)" strokeWidth=".6" />
          <path d="M0 0 L30 0" stroke="rgba(150,170,190,.6)" strokeWidth=".5" />
        </g>
        <ellipse cx="30" cy="34" rx="10" ry="7.5" transform="rotate(25 30 34)" fill="url(#dec-rose)" />
      </svg>
    </div>
  );
}

// Faint gold-thread embroidery under the spread: a ring of moon phases.
function MoonCircle({ x, y, r }) {
  const phases = Array.from({ length: 8 }, (_, i) => i);
  return (
    <svg className="dec dec-embroidery" style={{ left: x - r, top: y - r }} width={r * 2} height={r * 2} viewBox="-100 -100 200 200" aria-hidden="true">
      <circle r="96" fill="none" strokeDasharray="1.5 2.5" />
      <circle r="84" fill="none" />
      <circle r="62" fill="none" strokeDasharray="1 3" />
      {phases.map(i => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const cx = Math.cos(a) * 90, cy = Math.sin(a) * 90;
        const k = Math.cos((i / 8) * Math.PI * 2); // 1 = new, -1 = full
        return (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            <circle r="4.6" fill="none" />
            <path d={`M0 -4.6 A4.6 4.6 0 0 ${i < 4 ? 1 : 0} 0 4.6 A${Math.abs(k) * 4.6} 4.6 0 0 ${(i < 4) === (k > 0) ? 0 : 1} 0 -4.6`}
              className="lit" />
          </g>
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <path key={i} d={`M${Math.cos(a) * 64} ${Math.sin(a) * 64} L${Math.cos(a) * 82} ${Math.sin(a) * 82}`} />;
      })}
      <path d="M0 -52 L12 -12 L52 0 L12 12 L0 52 L-12 12 L-52 0 L-12 -12 Z" fill="none" />
    </svg>
  );
}

export default function Decor({ L, active, embroidery = true }) {
  const { area, narrow, short } = L;
  const m = Math.min(L.W, L.H);
  if (narrow) {
    const r = Math.max(13, Math.min(20, m * 0.045));
    const d = Math.max(44, Math.min(62, m * 0.15));
    return (
      <div className="decor">
        <Defs />
        <Candle x={area.left + r + 4} y={area.top + r * 0.9} r={r} />
        <Candle x={area.left + r * 3} y={area.top + r * 1.6} r={r * 0.72} dark delay={0.7} />
        <Orb x={area.right - d * 0.72} y={area.top + d * 0.62} d={d} active={active} />
      </div>
    );
  }
  const r = short ? 18 : Math.max(20, Math.min(34, m * 0.04));
  const d = short ? 62 : Math.max(76, Math.min(130, m * 0.14));
  const cs = short ? 70 : Math.max(86, Math.min(140, m * 0.15));
  const ringR = Math.min(area.right - area.left, area.bottom - area.top) * 0.47;
  return (
    <div className="decor">
      <Defs />
      {!short && embroidery && <MoonCircle x={area.cx} y={area.cy} r={ringR} />}
      <Candle x={area.left + r * 1.6} y={area.top + r * 1.3} r={r} />
      <Candle x={area.left + r * 3.7} y={area.top + r * 0.7} r={r * 0.7} dark delay={0.6} />
      <Candle x={area.left + r * 3.2} y={area.top + r * 2.9} r={r * 0.55} delay={1.3} />
      <Orb x={area.left + d * 0.78} y={area.bottom - d * 0.72} d={d} active={active} />
      {!short && <Crystals x={area.right - cs * 0.55} y={area.bottom - cs * 0.5} s={cs} />}
      <Candle x={area.right - r * 1.4} y={area.top + r * 1.1} r={r * 0.8} delay={0.9} />
    </div>
  );
}
