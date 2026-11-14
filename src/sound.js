// Synthesized sound effects (no audio files): shuffle riffle, card slide, card flip, chime.
let ctx = null;
let enabled = true;
try { enabled = localStorage.getItem('tarot-sound') !== 'off'; } catch { /* ignore */ }

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noiseBuffer(c, seconds) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function burst({ at = 0, dur = 0.06, freq = 2500, q = 0.8, gain = 0.25, type = 'bandpass', sweepTo }) {
  const c = ac();
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, dur + 0.05);
  const f = c.createBiquadFilter();
  f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.01, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t); src.stop(t + dur + 0.05);
}

export const sound = {
  get enabled() { return enabled; },
  setEnabled(v) {
    enabled = v;
    try { localStorage.setItem('tarot-sound', v ? 'on' : 'off'); } catch { /* ignore */ }
  },
  shuffle(seconds = 1.2) {
    if (!enabled) return;
    // A riffle: many tiny fast clicks that speed up then trail off.
    const n = Math.floor(seconds * 38);
    for (let i = 0; i < n; i++) {
      const p = i / n;
      burst({ at: p * seconds + Math.random() * 0.012, dur: 0.018 + Math.random() * 0.02, freq: 3000 + Math.random() * 2500, q: 1.2, gain: 0.08 + 0.1 * Math.sin(p * Math.PI) });
    }
  },
  slide() {
    if (!enabled) return;
    burst({ dur: 0.28, freq: 1800, sweepTo: 600, q: 0.6, gain: 0.18 });
  },
  flip() {
    if (!enabled) return;
    burst({ dur: 0.05, freq: 3500, q: 1.5, gain: 0.3 });
    burst({ at: 0.06, dur: 0.07, freq: 1500, q: 1, gain: 0.18 });
  },
  chime() {
    if (!enabled) return;
    const c = ac();
    [523.25, 659.25, 783.99, 1046.5].forEach((hz, i) => {
      const t = c.currentTime + i * 0.09;
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = hz;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + 1.7);
    });
  },
};
