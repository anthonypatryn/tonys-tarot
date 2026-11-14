import { createContext, useContext } from 'react';

// Holographic foil on revealed cards (React Bits HoloCard) and the zoomed-in card (React Bits FlipCard).
// Defaults match reactbits.dev/components/holo-card?preset=gold.
export const HOLO_PRESETS = ['bursts', 'stars', 'shards', 'cosmos', 'rainbow', 'swirl', 'glitter', 'gold'];

export const DEFAULT_SHINE = {
  holo: true,
  preset: 'gold',
  foilColor: '#e2e6ec',
  intensity: 0.85,
  scale: 1,
  edgeSparkle: 0.8,
  frame: 4,
  glare: 0.5,
  tiltMax: 14,
  hoverScale: 1.04,
  radius: 14,
  idle: true,
  shadow: true,
  // zoomed card (FlipCard)
  flipAxis: 'y',
  flipOnClick: true,
  draggable: true,
  stiffness: 170,
  damping: 20,
  perspective: 1100,
  // crystal ball (React Bits CrystalizedBall): a preset plus any per-setting overrides
  ball: { preset: 'nebula', overrides: {}, speed: 1, interactive: true, hoverStrength: 0.7, intro: true, paused: false },
};

const KEY = 'tarot-shine-v1';
export function loadShine() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === 'object') return { ...DEFAULT_SHINE, ...s, ball: { ...DEFAULT_SHINE.ball, ...(s.ball || {}) } };
  } catch { /* ignore */ }
  return { ...DEFAULT_SHINE };
}
export function saveShine(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export const ShineContext = createContext(DEFAULT_SHINE);
export const useShine = () => useContext(ShineContext);

// HoloCard props for a card drawn `width` px wide (radius is set for a 320 px card, so it scales).
export function holoProps(s, width) {
  return {
    preset: s.preset, foilColor: s.foilColor, intensity: s.intensity, scale: s.scale, edgeSparkle: s.edgeSparkle,
    frame: s.frame, glare: s.glare, tiltMax: s.tiltMax, hoverScale: s.hoverScale, idle: s.idle, shadow: s.shadow,
    radius: Math.round((s.radius * width) / 320 * 10) / 10,
  };
}

export const BALL_PRESET_NAMES = ['plasma', 'aurora', 'nebula', 'ember', 'frost', 'solar', 'eclipse', 'abyss'];
export function ballProps(s) {
  const b = s.ball || DEFAULT_SHINE.ball;
  return {
    preset: b.preset, ...b.overrides, interactive: b.interactive, hoverStrength: b.hoverStrength, intro: b.intro, paused: b.paused,
  };
}
