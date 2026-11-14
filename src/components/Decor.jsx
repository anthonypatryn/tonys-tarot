import { lazy, Suspense } from 'react';
import { useShine, ballProps } from '../shine.js';
const ORB_LIFT = 1.23; // must match Props3D's ball height

const Props3D = lazy(() => import('./Props3D.jsx'));
import CrystalizedBall, { BALL_PRESETS } from '../reactbits/CrystalizedBall.jsx';

// Witchy table dressing seen from above: pillar candles, a crystal ball on a brass stand,
// a few crystals, and a faint embroidered moon circle on the cloth. Purely decorative (no pointer events).

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

// Where the 3D props sit, in screen pixels.
function propLayout(L) {
  const { area, narrow, short } = L;
  const m = Math.min(L.W, L.H);
  if (narrow) {
    const r = Math.max(11, Math.min(17, m * 0.04));
    const d = Math.max(58, Math.min(80, m * 0.19));
    return {
      candles: [{ x: area.left + r * 1.7, y: area.top + r * 1.6, r }, { x: area.left + r * 3.9, y: area.top + r * 2.2, r: r * 0.72, dark: true }],
      orb: { x: area.right - d * 0.72, y: area.top + d * 0.7, d },
      crystals: null,
    };
  }
  const r = short ? 15 : Math.max(17, Math.min(28, m * 0.033));
  const d = short ? 70 : Math.max(96, Math.min(170, m * 0.19));
  const cs = short ? 0 : Math.max(96, Math.min(160, m * 0.17));
  // Candles top-left, crystals top-right, the ball bottom-right: clear of the deck, its tips and the clarifier button.
  return {
    candles: [
      { x: area.left + r * 1.9, y: area.top + r * 1.8, r },
      { x: area.left + r * 4.4, y: area.top + r * 1.2, r: r * 0.72, dark: true },
      { x: area.left + r * 3.8, y: area.top + r * 3.9, r: r * 0.55 },
      { x: area.right - r * 1.4 - (short ? 0 : cs * 0.95), y: area.top + r * 1.3, r: r * 0.8 },
    ],
    orb: { x: area.right - d * 0.8, y: area.bottom - d * 0.8, d },
    crystals: short ? null : { x: area.right - cs * 0.45, y: area.top + cs * 0.4, s: cs },
  };
}

export default function Decor({ L, active, embroidery = true }) {
  const shine = useShine();
  const props = propLayout(L);
  const { area, short } = L;
  const ringR = Math.min(area.right - area.left, area.bottom - area.top) * 0.47;
  // The glowing ball sits on top of its 3D stand; project its raised center the way the 3D camera does.
  const o = props.orb;
  // Position follows the ring it sits in (so it looks seated); size follows the ball's real height.
  const D = L.H * 1.9, zr = (o.d / 2) * 0.55, k = D / (D - (o.d / 2) * ORB_LIFT), kr = D / (D - zr);
  const bx = L.W / 2 + (o.x - L.W / 2) * kr, by = L.H / 2 + (o.y - L.H / 2) * kr, bd = o.d * k * 0.98;
  const box = bd / 0.7;
  // The ball's dust is tuned for a ~400 px ball; thin it out for a small one so it stays glassy, not a solid disc.
  const bp = ballProps(shine);
  if (shine.ball?.overrides?.particleCount == null) {
    const base = BALL_PRESETS[bp.preset]?.particleCount ?? 15000;
    bp.particleCount = Math.round(Math.max(1500, base * Math.min(1, (bd / 400) ** 2 * 1.6)));
  }
  return (
    <div className="decor">
      {!short && embroidery && !L.narrow && <MoonCircle x={area.cx} y={area.cy} r={ringR} />}
      {props.candles.map((c, i) => (
        <div key={i} className="candle-pool" style={{ left: c.x, top: c.y, width: c.r * 16, height: c.r * 16, animationDelay: `${i * 0.7}s` }} />
      ))}
      <Suspense fallback={null}>
        <Props3D W={L.W} H={L.H} candles={props.candles} crystals={props.crystals} orb={o} />
      </Suspense>
      <div className={`orb-ball ${active ? 'active' : ''}`} style={{ left: bx - box / 2, top: by - box / 2, width: box, height: box }}>
        <span className="orb-glass-dark" />
        <Suspense fallback={null}>
          <CrystalizedBall {...bp} size={0.7} speed={(shine.ball?.speed ?? 1) * (active ? 2.2 : 1)} />
        </Suspense>
      </div>
    </div>
  );
}
