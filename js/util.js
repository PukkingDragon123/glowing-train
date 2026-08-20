'use strict';
/* ============================================================
   SHELL & DEBT — util.js
   Seeded RNG, helpers, procedural WebAudio sound effects.
   ============================================================ */

const U = {

  /* ---------- seeded RNG ---------- */

  mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  },

  hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  },

  randSeedStr() {
    const w = ['CURSED', 'GILDED', 'RUSTY', 'HOLLOW', 'CROOKED', 'LUCKY',
      'DEAD', 'NEON', 'VELVET', 'SMOKY', 'MARKED', 'LOADED', 'BLOODY', 'ASHEN'];
    return w[Math.floor(Math.random() * w.length)] + '-' +
      Math.floor(Math.random() * 9000 + 1000);
  },

  /* rng-driven helpers (pass the run's rng in) */

  ri(rng, min, max) { // integer in [min, max]
    return Math.floor(rng() * (max - min + 1)) + min;
  },

  pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  },

  shuffle(rng, arr) { // in place
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  // weighted pick: items array, weightFn(item) -> number
  wpick(rng, items, weightFn) {
    let total = 0;
    for (const it of items) total += weightFn(it);
    let roll = rng() * total;
    for (const it of items) {
      roll -= weightFn(it);
      if (roll <= 0) return it;
    }
    return items[items.length - 1];
  },

  /* ---------- misc ---------- */

  clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
  lerp(a, b, t) { return a + (b - a) * t; },
  /* frame-rate independent approach: t is "how much of the gap per second" */
  approach(cur, want, rate, dt) { return cur + (want - cur) * Math.min(1, rate * dt); },

  /* ============================================================
     EASING.

     Nothing in this game should arrive at a linear rate. These are
     the curves everything that moves borrows: a walk that leans in
     and settles, a card that overshoots and comes back, a lamp that
     drops and bounces.
     ============================================================ */
  ease: {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => t * (2 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    /* overshoots the mark and comes back — the "snap" of a UI card */
    outBack: (t, s) => {
      const c = (s === undefined ? 1.70158 : s) + 1;
      return 1 + c * Math.pow(t - 1, 3) + (c - 1) * Math.pow(t - 1, 2);
    },
    /* rings out — for anything that lands hard */
    outElastic: (t) => {
      if (t === 0 || t === 1) return t;
      const p = 0.36;
      return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },
    outBounce: (t) => {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    },
  },

  /* a one-shot tween on a requestAnimationFrame clock. fn(v, t) is called
     every frame with the eased value; resolves when it is done. */
  tween(ms, fn, easeName) {
    const e = U.ease[easeName || 'outCubic'] || U.ease.outCubic;
    return new Promise(res => {
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms);
        fn(e(t), t);
        if (t < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  },

  fmt(n) { // 12840 -> "12,840"
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  uid: (() => { let c = 0; return () => ++c; })(),

  el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  },

  esc(s) {
    return String(s).replace(/[&<>"]/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  },

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
};

/* ============================================================
   SFX — tiny procedural synth. No assets, no network.
   ============================================================ */

const SFX = {
  ctx: null,
  muted: false,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { this.ctx = null; }
  },

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('shelldebt.mute', this.muted ? '1' : '0'); } catch (e) {}
    return this.muted;
  },

  loadMutePref() {
    try { this.muted = localStorage.getItem('shelldebt.mute') === '1'; } catch (e) {}
  },

  tone(freq, dur, type = 'sine', vol = 0.15, when = 0, slide = 0) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },

  noise(dur, vol = 0.3, when = 0, low = false) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = src;
    if (low) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 900;
      src.connect(f); node = f;
    }
    node.connect(g).connect(this.ctx.destination);
    src.start(t0);
  },

  /* named effects */
  click()    { this.tone(1800, 0.03, 'square', 0.05); },
  chak()     { this.tone(300, 0.05, 'square', 0.12); this.tone(180, 0.07, 'square', 0.1, 0.05); },
  spin()     { for (let i = 0; i < 9; i++) this.tone(240 + i * 12, 0.04, 'square', 0.06, i * 0.05); },
  shot()     { this.noise(0.28, 0.5); this.tone(90, 0.22, 'sawtooth', 0.35, 0, -55); },
  dud()      { this.tone(140, 0.16, 'sine', 0.2, 0, -60); },
  jamSfx()   { this.tone(500, 0.05, 'square', 0.14); this.tone(430, 0.12, 'square', 0.12, 0.06, -200); },
  backfire() { this.noise(0.5, 0.6, 0, true); this.tone(60, 0.5, 'sawtooth', 0.4, 0, -30); },
  coin()     { this.tone(1350, 0.07, 'square', 0.1); this.tone(1800, 0.16, 'square', 0.08, 0.07); },
  bank()     { [660, 880, 1100].forEach((f, i) => this.tone(f, 0.1, 'triangle', 0.14, i * 0.07)); },
  hurt()     { this.tone(200, 0.3, 'sawtooth', 0.25, 0, -140); },
  win()      { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.16, i * 0.1)); },
  lose()     { [400, 340, 260, 180].forEach((f, i) => this.tone(f, 0.25, 'sawtooth', 0.14, i * 0.16)); },
  jackpot()  { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => this.tone(f, 0.14, 'square', 0.12, i * 0.08)); },
  deal()     { this.noise(0.05, 0.12); },
  tick()     { this.tone(900, 0.02, 'square', 0.04); },
  cluck()    { this.tone(700, 0.06, 'square', 0.1, 0, 250); this.tone(500, 0.08, 'square', 0.08, 0.08, -120); },
};
