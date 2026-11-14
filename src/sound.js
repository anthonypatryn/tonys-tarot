// Sound effects: real recorded clips (public/sounds) played as trimmed segments through Web Audio,
// with a synthesized chime for finishing a reading.
const base = import.meta.env.BASE_URL;

// [file, start (s), duration (s), gain] — segments measured from each recording's envelope.
const CLIPS = {
  riffleA: ['riffle', 0.28, 1.45, 0.9],   // first riffle (cards scattering)
  riffleB: ['riffle', 2.72, 1.15, 0.9],   // second riffle (gathering back)
  square:  ['shuffle', 0.02, 0.5, 0.7],   // squaring the deck
  take1:   ['take-1', 0.18, 0.12, 0.9],
  take2:   ['take-2', 0.18, 0.3, 2.4],    // quieter recording, boosted
  take3:   ['take-3', 0.0, 0.14, 0.85],
  place:   ['place', 0.02, 0.16, 0.9],
};
const FILES = ['riffle', 'shuffle', 'take-1', 'take-2', 'take-3', 'place'];

let ctx = null;
let enabled = true;
const buffers = {};
let loading = null;
try { enabled = localStorage.getItem('tarot-sound') !== 'off'; } catch { /* ignore */ }

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function load() {
  if (loading) return loading;
  const c = ac();
  loading = Promise.all(FILES.map(async f => {
    try {
      const res = await fetch(`${base}sounds/${f}.mp3`);
      buffers[f] = await c.decodeAudioData(await res.arrayBuffer());
    } catch { /* missing file: that clip stays silent */ }
  }));
  return loading;
}
// Start loading on the first interaction (browsers block audio before one).
if (typeof window !== 'undefined') {
  const prime = () => { load(); window.removeEventListener('pointerdown', prime); window.removeEventListener('keydown', prime); };
  window.addEventListener('pointerdown', prime);
  window.addEventListener('keydown', prime);
}

function play(name, delay = 0, gainMul = 1) {
  if (!enabled) return;
  const [file, start, dur, gain] = CLIPS[name];
  const go = () => {
    const buf = buffers[file];
    if (!buf) return;
    const c = ac();
    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = 0.96 + Math.random() * 0.08; // slight variation so repeats don't sound robotic
    const g = c.createGain();
    const v = gain * gainMul;
    const fade = Math.min(0.04, dur / 4);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.004);
    g.gain.setValueAtTime(v, t + dur - fade);
    g.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(g).connect(c.destination);
    src.start(t, start, dur + 0.01);
  };
  if (buffers[file]) go(); else load().then(go);
}

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export const sound = {
  get enabled() { return enabled; },
  setEnabled(v) {
    enabled = v;
    try { localStorage.setItem('tarot-sound', v ? 'on' : 'off'); } catch { /* ignore */ }
    if (v) load();
  },
  // The full wash shuffle: riffle as cards scatter, riffle as they gather, then square the deck.
  shuffle() {
    play('riffleA', 0);
    play('riffleB', 1.7);
    play('square', 2.45);
  },
  // Taking the top card off the deck, then it landing in its spot.
  draw() {
    play(pick(['take1', 'take2', 'take3']));
    play('place', 0.6, 0.8);
  },
  flip() {
    play(pick(['take1', 'take3']), 0, 0.9);
    play('place', 0.42, 0.55);
  },
  chime() {
    if (!enabled) return;
    const c = ac();
    [523.25, 659.25, 783.99, 1046.5].forEach((hz, i) => {
      const t = c.currentTime + i * 0.09;
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = hz;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + 1.7);
    });
  },
};
