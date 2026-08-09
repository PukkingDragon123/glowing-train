'use strict';
/* ============================================================
   SIX CHAMBERS
   One revolver. Six chambers. You load the live rounds yourself,
   spin, and put it to your own head. Every blank multiplies the
   pot; the next pull is always worse odds than the last.
   Bank $1,500 and walk out. Or don't walk out.
   ============================================================ */

(() => {

/* ---------- constants ---------- */

const W = 960, H = 540;                 // logical scene size
const CHAMBERS  = 6;
const GOAL      = 1500;
const START     = 300;
const MIN_STAKE = 25;
const STAKE_STEP= 25;
// The pot grows by 1 + RISK_PAY x (odds of dying on this pull), so a
// 1-in-6 chamber pays x1.44 and a coin-flip chamber pays x3.20.
// Tuned against dev/sim.js: bold play walks out of roughly one run in five.
const RISK_PAY  = 2.2;

const BULB  = { x: 452, y: 82 };
const TABLE = { top: 318, front: 412 };
const FIG   = { hx: 672, hy: 150, hr: 31, sx: 712, sy: 228, upper: 78, fore: 74 };
const REST  = { x: 620, y: 336 };       // hand resting on the table
const AIM   = { x: 744, y: 156 };       // hand at the temple
const GUN_SCALE = 0.85;

/* ---------- small helpers ---------- */

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp  = (a, b, t) => a + (b - a) * t;
const ease  = t => t * t * (3 - 2 * t);
const easeOut = t => 1 - (1 - t) * (1 - t);
const rnd   = (a, b) => a + Math.random() * (b - a);
const money = n => '$' + Math.round(n).toLocaleString('en-US');

const $ = id => document.getElementById(id);

/* ============================================================
   AUDIO — everything synthesized, no assets
   ============================================================ */

const snd = {
  ctx: null, master: null, muted: false,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
    try { localStorage.setItem('sixchambers.muted', m ? '1' : '0'); } catch (e) {}
  },
  noise(dur) {
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    return src;
  },
  env(node, vol, attack, decay, at) {
    const g = this.ctx.createGain();
    const t = at || this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    node.connect(g);
    g.connect(this.master);
    return g;
  },
  tone(freq, vol, dur, type, at) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    o.type = type || 'sine';
    const t = at || this.ctx.currentTime;
    o.frequency.setValueAtTime(freq, t);
    this.env(o, vol, 0.004, dur, t);
    o.start(t);
    o.stop(t + dur + 0.05);
    return o;
  },

  tick(vol = 0.25, freq = 1400, at) {
    if (!this.ctx) return;
    const t = at || this.ctx.currentTime;
    const n = this.noise(0.03);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 3;
    n.connect(f);
    this.env(f, vol, 0.001, 0.03, t);
    n.start(t);
  },
  cock() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tick(0.32, 900, t);
    this.tick(0.28, 1500, t + 0.09);
  },
  spin() {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    for (let i = 0; i < 16; i++) {
      // ticks slow down as the cylinder loses spin
      const t = t0 + Math.pow(i / 15, 1.8) * 1.0;
      this.tick(0.2 - i * 0.008, 1100 + (i % 3) * 260, t);
    }
  },
  dry() {                                   // the blank: a dead mechanical clack
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tick(0.5, 700, t);
    this.tick(0.4, 2200, t + 0.012);
    this.tone(150, 0.12, 0.09, 'square', t);
  },
  shot() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const n = this.noise(0.7);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(7000, t);
    f.frequency.exponentialRampToValueAtTime(220, t + 0.5);
    n.connect(f);
    this.env(f, 1.0, 0.002, 0.6, t);
    n.start(t);
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.35);
    this.env(o, 0.9, 0.002, 0.45, t);
    o.start(t); o.stop(t + 0.6);
  },
  heart() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(58, 0.35, 0.16, 'sine', t);
    this.tone(48, 0.26, 0.20, 'sine', t + 0.19);
  },
  chips() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) this.tick(0.22, 2400 + Math.random() * 1800, t + i * 0.045);
  },
  cash() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.chips();
    this.tone(784, 0.18, 0.5, 'triangle', t + 0.05);
    this.tone(1175, 0.13, 0.6, 'triangle', t + 0.13);
  },
  fanfare() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, 0.7, 'triangle', t + i * 0.13));
  }
};

/* ============================================================
   STATE
   ============================================================ */

const S = {
  phase: 'title',        // title | bet | spinning | ready | pulling | dead | won | busted
  chips: START,
  stake: 75,
  live: 1,               // live rounds the player loads
  pot: 0,
  order: [],             // shuffled chambers: true = live
  idx: 0,                // next chamber to fire
  pulls: 0,              // survived pulls this run
  rounds: 0,             // cylinders survived (cashed out)
  best: 0,               // biggest pot held
  lastWin: 0,

  // presentation
  aim: 0,                // 0 = hand on table, 1 = gun at temple
  aimTarget: 0,
  tilt: 0,               // extra gun rotation (recoil)
  cyl: 0,                // cylinder spin angle
  cylSpin: 0,            // spin velocity
  hammer: 0,
  shake: 0,
  flash: 0,
  redOut: 0,             // blood wash on death
  fade: 0,               // fade to black on death
  bulbDim: 0,            // tension dimming
  banner: null,          // { txt, sub, col, t }
  death: null,           // { t }
  gunFree: null,         // gun tumbling out of a dead hand
  bloodOnTable: 0,
  bloodTarget: 0,
  timers: [],
  parts: [],
  motes: []
};

/* ---------- odds & payout ---------- */

const chambersLeft = () => CHAMBERS - S.idx;
const liveLeft = () => S.order.slice(S.idx).filter(Boolean).length;
const deathChance = () => chambersLeft() ? liveLeft() / chambersLeft() : 0;
const payMult = p => p >= 1 ? 1 : 1 + RISK_PAY * (p / (1 - p));
const nextPot = () => Math.round(S.pot * payMult(deathChance()));

function buildCylinder(live) {
  const a = Array.from({ length: CHAMBERS }, (_, i) => i < live);
  for (let i = a.length - 1; i > 0; i--) {          // Fisher-Yates
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- tiny timer queue ---------- */

// Deadlines are wall-clock, not accumulated frame deltas: a slow
// renderer should drop frames, not stretch the sequence.
const after = (ms, fn) => S.timers.push({ at: performance.now() + ms, fn });

function tickTimers() {
  const now = performance.now();
  for (let i = S.timers.length - 1; i >= 0; i--) {
    if (S.timers[i].at <= now) S.timers.splice(i, 1)[0].fn();
  }
}

/* ============================================================
   ACTIONS
   ============================================================ */

function newRun() {
  S.chips = START; S.stake = 75; S.live = 1; S.pot = 0;
  S.order = []; S.idx = 0; S.pulls = 0; S.rounds = 0; S.best = 0; S.lastWin = 0;
  S.aim = S.aimTarget = 0; S.tilt = 0; S.hammer = 0;
  S.shake = S.flash = S.redOut = S.fade = S.bulbDim = 0;
  S.banner = null; S.death = null; S.gunFree = null; S.bloodOnTable = S.bloodTarget = 0;
  S.timers.length = 0; S.parts.length = 0;
  setPhase('bet');
}

function setPhase(p) {
  S.phase = p;
  renderUI();
}

function loadCylinder() {
  S.stake = clamp(S.stake, MIN_STAKE, S.chips);
  S.chips -= S.stake;
  S.pot = S.stake;
  S.order = buildCylinder(S.live);
  S.idx = 0;
  S.cylSpin = 15;
  S.bloodOnTable = S.bloodTarget = 0;
  snd.spin();
  banner('SPINNING', S.live + (S.live === 1 ? ' LIVE ROUND' : ' LIVE ROUNDS') + ' IN SIX', '#e9e3d6');
  setPhase('spinning');
  after(1150, () => { snd.cock(); setPhase('ready'); });
}

function pull() {
  if (S.phase !== 'ready') return;
  setPhase('pulling');
  S.aimTarget = 1;
  after(260, () => snd.cock());
  after(520, () => snd.heart());
  after(900, () => snd.heart());
  after(1250, resolvePull);
}

function resolvePull() {
  const live = S.order[S.idx];
  const gained = nextPot();
  S.idx++;
  S.cylSpin = 6;

  if (live) {
    // ---- the loud one ----
    snd.shot();
    S.flash = 0.95;
    S.shake = 26;
    S.hammer = 0;
    S.tilt = -0.85;
    S.redOut = 1;
    S.bloodTarget = 1;
    spray();
    S.death = { t: 0, pull: S.pulls + 1, lost: S.pot };
    panel.classList.add('hidden');
    after(280, () => { S.gunFree = { x: AIM.x, y: AIM.y, vx: -110, vy: -180, a: 0, va: 7 }; });
    after(420, () => { S.aimTarget = 0; });
    after(700, () => { S.parts.length = Math.min(S.parts.length, 40); });
    after(1500, () => { S.fade = 0.001; });
    after(2300, () => { S.pot = 0; setPhase('dead'); });
    return;
  }

  // ---- a blank ----
  snd.dry();
  S.shake = 6;
  S.tilt = -0.12;
  S.hammer = 0;
  S.pulls++;
  S.pot = gained;
  S.best = Math.max(S.best, S.pot);
  banner('CLICK', 'POT ' + money(S.pot), '#e9e3d6');
  after(620, () => { S.aimTarget = 0; });
  after(1150, () => { setPhase('ready'); });
}

function cashOut() {
  if (!S.pot) return;
  S.chips += S.pot;
  S.lastWin = S.pot;
  S.rounds++;
  snd.cash();
  banner('CASHED OUT', '+' + money(S.pot), '#d9a441');
  chipBurst();
  S.pot = 0;
  S.order = []; S.idx = 0;
  S.aimTarget = 0;
  S.stake = clamp(S.stake, MIN_STAKE, Math.max(MIN_STAKE, S.chips));
  if (S.chips >= GOAL) { snd.fanfare(); setPhase('won'); return; }
  setPhase('bet');
}

function backOut() {                         // bail before the first pull, lose half the stake
  const refund = Math.floor(S.pot / 2);
  S.chips += refund;
  S.pot = 0; S.order = []; S.idx = 0;
  snd.chips();
  banner('UNLOADED', 'HALF THE STAKE STAYS ON THE TABLE', '#9a9388');
  setPhase(S.chips < MIN_STAKE ? 'busted' : 'bet');
}

function banner(txt, sub, col) {
  S.banner = { txt, sub, col: col || '#e9e3d6', t: 0 };
}

/* ---------- particles ---------- */

function spray() {
  for (let i = 0; i < 130; i++) {
    const a = rnd(Math.PI * 0.72, Math.PI * 1.5);   // up and to the left: the exit side
    const sp = rnd(70, 430);
    S.parts.push({
      x: FIG.hx - 14, y: FIG.hy - 6,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rnd(0, 70),
      r: rnd(1.5, 5.5), life: rnd(0.6, 2.0), max: 2.0,
      col: Math.random() < .25 ? '#7a0e16' : '#b4121a', g: 900
    });
  }
  for (let i = 0; i < 26; i++) {                    // powder smoke
    S.parts.push({
      x: AIM.x - 36, y: AIM.y - 6,
      vx: rnd(-90, -10), vy: rnd(-70, -10),
      r: rnd(6, 16), life: rnd(0.8, 1.6), max: 1.6,
      col: '#6b6558', g: -30, smoke: true
    });
  }
}

function chipBurst() {
  for (let i = 0; i < 24; i++) {
    S.parts.push({
      x: rnd(492, 556), y: 344,
      vx: rnd(-120, 120), vy: rnd(-330, -170),
      r: rnd(3, 6), life: rnd(0.7, 1.2), max: 1.2,
      col: ['#d9a441', '#e9e3d6', '#b4121a'][i % 3], g: 900
    });
  }
}

function updateParts(dt) {
  for (let i = S.parts.length - 1; i >= 0; i--) {
    const p = S.parts[i];
    p.life -= dt;
    if (p.life <= 0) { S.parts.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.g * dt;
    if (p.smoke) { p.r += 14 * dt; p.vx *= 0.98; }
    else if (p.y > TABLE.top && p.vy > 0) { p.vy *= -0.28; p.vx *= 0.6; p.y = TABLE.top; }
  }
}

/* ============================================================
   SCENE
   ============================================================ */

const cv = $('scene');
const ctx = cv.getContext('2d');
let grain = null;

function makeGrain() {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const g = c.getContext('2d');
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + Math.random() * 135;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 26;
  }
  g.putImageData(img, 0, 0);
  return c;
}

function fitCanvas() {
  // clientWidth, not getBoundingClientRect: on a phone held upright the
  // stage is rotated 90deg, and the bounding box would come back swapped.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width  = Math.max(1, Math.round(cv.clientWidth * dpr));
  cv.height = Math.max(1, Math.round(cv.clientHeight * dpr));
}

/* ---------- room ---------- */

function drawRoom(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a0810');
  g.addColorStop(0.5, '#171220');
  g.addColorStop(1, '#0a0709');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // wallpaper stripes, barely there
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#54402f';
  for (let x = -40; x < W; x += 52) ctx.fillRect(x, 0, 18, 320);
  ctx.globalAlpha = 1;

  // doorway to somewhere worse
  ctx.fillStyle = '#040406';
  ctx.fillRect(58, 78, 122, 258);
  ctx.strokeStyle = '#2e241d';
  ctx.lineWidth = 5;
  ctx.strokeRect(58, 78, 122, 258);

  // chair rail
  ctx.fillStyle = '#241a15';
  ctx.fillRect(0, 288, W, 8);
  ctx.fillStyle = '#0d0a09';
  ctx.fillRect(0, 296, W, 6);

  // the bulb's pool of light
  const bx = BULB.x + Math.sin(t * 0.55) * 12;
  const glow = ctx.createRadialGradient(bx, BULB.y, 20, bx, BULB.y + 90, 560);
  const warm = 0.35 * (1 - S.bulbDim * 0.5);
  glow.addColorStop(0, `rgba(255,208,146,${warm})`);
  glow.addColorStop(0.4, `rgba(255,176,108,${warm * 0.38})`);
  glow.addColorStop(1, 'rgba(255,160,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  return bx;
}

// Somebody is always watching the room from the door.
function drawWatcher(t) {
  ctx.fillStyle = '#030305';
  ctx.beginPath();
  ctx.moveTo(96, 336);
  ctx.quadraticCurveTo(100, 216, 128, 210);      // shoulder line
  ctx.lineTo(148, 208);
  ctx.quadraticCurveTo(170, 214, 172, 336);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath(); ctx.arc(134, 184, 21, 0, 7); ctx.fill();     // head
  ctx.beginPath(); ctx.ellipse(133, 166, 34, 6, 0, 0, 7); ctx.fill();  // hat brim
  ctx.fillRect(118, 142, 31, 24);                                // crown
  ctx.strokeStyle = 'rgba(255,190,120,.10)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // cigarette, drawn on breath
  const pulse = 0.35 + 0.65 * Math.pow((Math.sin(t * 0.7) + 1) / 2, 3);
  const ex = 163, ey = 199;
  const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 22);
  eg.addColorStop(0, `rgba(255,120,40,${0.85 * pulse})`);
  eg.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = eg;
  ctx.beginPath(); ctx.arc(ex, ey, 22, 0, 7); ctx.fill();
  ctx.fillStyle = `rgba(255,180,110,${pulse})`;
  ctx.fillRect(ex - 1.5, ey - 1.5, 3, 3);
}

function drawBulb(bx, t) {
  const flick = 0.9 + Math.sin(t * 31) * 0.03 + (Math.random() < 0.02 ? -0.25 : 0);
  ctx.strokeStyle = '#0c0c10';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(BULB.x, -10);
  ctx.quadraticCurveTo((BULB.x + bx) / 2, BULB.y * 0.55, bx, BULB.y - 16);
  ctx.stroke();

  ctx.fillStyle = '#1a1a20';                         // fitting
  ctx.fillRect(bx - 7, BULB.y - 20, 14, 12);

  const a = (1 - S.bulbDim * 0.6) * flick;
  const bg = ctx.createRadialGradient(bx, BULB.y, 2, bx, BULB.y, 46);
  bg.addColorStop(0, `rgba(255,236,200,${0.95 * a})`);
  bg.addColorStop(0.25, `rgba(255,200,130,${0.5 * a})`);
  bg.addColorStop(1, 'rgba(255,180,110,0)');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.arc(bx, BULB.y, 46, 0, 7); ctx.fill();

  ctx.fillStyle = `rgba(255,244,214,${a})`;
  ctx.beginPath(); ctx.ellipse(bx, BULB.y - 1, 9, 11, 0, 0, 7); ctx.fill();
}

// The top is a trapezoid opening toward the player: the far edge is
// short and lit, the near edge runs off both sides of the frame.
const T_BACK_L = 108, T_BACK_R = 852;

function tableX(x, depth) {              // depth 0 = far edge, 1 = near edge
  return lerp(x, (x - W / 2) * 1.55 + W / 2, depth);
}

function drawTable() {
  const g = ctx.createLinearGradient(0, TABLE.top, 0, TABLE.front + 40);
  g.addColorStop(0, '#4a3323');
  g.addColorStop(0.35, '#38261a');
  g.addColorStop(1, '#1d1410');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(T_BACK_L, TABLE.top);
  ctx.lineTo(T_BACK_R, TABLE.top);
  ctx.lineTo(tableX(T_BACK_R, 1), TABLE.front);
  ctx.lineTo(tableX(T_BACK_L, 1), TABLE.front);
  ctx.closePath();
  ctx.fill();

  // felt inlay catching the light
  const f = ctx.createLinearGradient(0, TABLE.top, 0, TABLE.front);
  f.addColorStop(0, '#2c4a3c');
  f.addColorStop(1, '#152520');
  ctx.fillStyle = f;
  ctx.beginPath();
  ctx.moveTo(T_BACK_L + 34, TABLE.top + 12);
  ctx.lineTo(T_BACK_R - 34, TABLE.top + 12);
  ctx.lineTo(tableX(T_BACK_R - 34, .88), TABLE.front - 10);
  ctx.lineTo(tableX(T_BACK_L + 34, .88), TABLE.front - 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.55)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // grain streaks along the wood
  ctx.strokeStyle = 'rgba(255,190,120,.05)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) {
    const d = i / 6;
    ctx.beginPath();
    ctx.moveTo(tableX(T_BACK_L, d), lerp(TABLE.top, TABLE.front, d));
    ctx.lineTo(tableX(T_BACK_R, d), lerp(TABLE.top, TABLE.front, d));
    ctx.stroke();
  }

  // front edge + apron dropping into the dark
  ctx.fillStyle = '#241811';
  ctx.beginPath();
  ctx.moveTo(tableX(T_BACK_L, 1), TABLE.front);
  ctx.lineTo(tableX(T_BACK_R, 1), TABLE.front);
  ctx.lineTo(tableX(T_BACK_R, 1) + 40, H);
  ctx.lineTo(tableX(T_BACK_L, 1) - 40, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,196,130,.16)';     // lip highlight
  ctx.fillRect(tableX(T_BACK_L, 1), TABLE.front - 3, tableX(T_BACK_R, 1) - tableX(T_BACK_L, 1), 4);
}

function shadowUnder(x, y, rx) {
  ctx.fillStyle = 'rgba(0,0,0,.5)';
  ctx.beginPath(); ctx.ellipse(x + 6, y + 3, rx, rx * 0.32, 0, 0, 7); ctx.fill();
}

function drawChipStack(x, y, n, col) {
  for (let i = 0; i < n; i++) {
    const yy = y - i * 5;
    ctx.fillStyle = i % 2 ? col.d : col.l;
    ctx.beginPath(); ctx.ellipse(x, yy, 21, 7, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = col.t;
  ctx.beginPath(); ctx.ellipse(x, y - n * 5, 21, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(x, y - n * 5, 9, 3, 0, 0, 7); ctx.fill();
}

function drawProps(t) {
  const y = 358;

  // whiskey, three fingers, untouched
  shadowUnder(184, y + 2, 20);
  ctx.fillStyle = 'rgba(160,180,190,.14)';
  ctx.fillRect(168, y - 40, 34, 42);
  ctx.fillStyle = 'rgba(196,112,28,.72)';
  ctx.fillRect(169, y - 20, 32, 21);
  ctx.fillStyle = 'rgba(255,226,180,.45)';
  ctx.fillRect(171, y - 38, 3, 38);
  ctx.strokeStyle = 'rgba(210,228,238,.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(168, y - 40, 34, 42);

  // spare rounds standing on their ends
  for (let i = 0; i < 4; i++) {
    const x = 238 + i * 17;
    shadowUnder(x, y, 7);
    const g = ctx.createLinearGradient(x - 5, 0, x + 5, 0);
    g.addColorStop(0, '#8a6a24'); g.addColorStop(0.4, '#e8bc5c'); g.addColorStop(1, '#6d5119');
    ctx.fillStyle = g;
    ctx.fillRect(x - 5, y - 20, 10, 20);
    ctx.fillStyle = '#d0813a';
    ctx.beginPath(); ctx.ellipse(x, y - 20, 5, 4, 0, Math.PI, 0); ctx.fill();
  }

  // chips scale with the bankroll, so the table reads your situation
  const wealth = clamp(Math.round(S.chips / 80), 0, 12);
  [
    { x: 336, n: clamp(wealth, 0, 5), c: { l: '#8d1017', d: '#5c090f', t: '#b4121a' } },
    { x: 388, n: clamp(wealth - 3, 0, 6), c: { l: '#1b3f6b', d: '#122a48', t: '#2a5a94' } },
    { x: 440, n: clamp(wealth - 6, 0, 7), c: { l: '#3a3a42', d: '#23232a', t: '#4e4e58' } }
  ].forEach(s => {
    if (s.n <= 0) return;
    shadowUnder(s.x, y, 22);
    drawChipStack(s.x, y, s.n, s.c);
  });

  // the pot, pushed out onto the felt where everyone can see it
  if (S.pot > 0) {
    const n = clamp(Math.round(Math.log2(S.pot / 40 + 1) * 2), 1, 9);
    shadowUnder(524, y - 4, 22);
    drawChipStack(524, y - 4, n, { l: '#c69a3a', d: '#8a6c2c', t: '#d9a441' });
  }

  // spent brass from cylinders already survived
  for (let i = 0; i < S.rounds && i < 10; i++) {
    const x = 596 + (i % 5) * 26, cy = 372 + Math.floor(i / 5) * 12;
    ctx.save();
    ctx.translate(x, cy);
    ctx.rotate((i * 1.7) % 3);
    ctx.fillStyle = '#8a6a24';
    ctx.fillRect(-10, -3.5, 20, 7);
    ctx.fillStyle = '#d3ac52';
    ctx.fillRect(-10, -3.5, 20, 2);
    ctx.restore();
  }

  if (S.bloodOnTable > 0) {
    ctx.fillStyle = `rgba(104,8,15,${0.62 * S.bloodOnTable})`;
    ctx.beginPath(); ctx.ellipse(636, 352, 108, 22, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(540, 366, 46, 11, 0, 0, 7); ctx.fill();
  }
}

/* ---------- the player ---------- */

// two-bone IK: returns the elbow for a shoulder S -> hand T
function elbow(sx, sy, tx, ty, a, b, sign) {
  const dx = tx - sx, dy = ty - sy;
  const d = clamp(Math.hypot(dx, dy), 1, a + b - 1);
  const base = Math.atan2(dy, dx);
  const cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1);
  const ang = base + sign * Math.acos(cosA);
  return { x: sx + Math.cos(ang) * a, y: sy + Math.sin(ang) * a };
}

function limb(x1, y1, x2, y2, w) {
  ctx.lineCap = 'round';
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawGun(x, y, tilt, cyl, hammer, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(-(scale || 1), scale || 1);          // muzzle points left on screen

  const steel = ctx.createLinearGradient(0, -12, 0, 10);
  steel.addColorStop(0, '#606672');
  steel.addColorStop(0.45, '#3c414b');
  steel.addColorStop(1, '#1c1f25');

  // grip
  const wood = ctx.createLinearGradient(-20, 0, 4, 28);
  wood.addColorStop(0, '#5a3620'); wood.addColorStop(1, '#2c1a0e');
  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.moveTo(-4, -2); ctx.lineTo(6, 4);
  ctx.quadraticCurveTo(0, 26, -12, 31);
  ctx.quadraticCurveTo(-20, 28, -17, 14);
  ctx.quadraticCurveTo(-14, 2, -10, -3);
  ctx.closePath(); ctx.fill();

  // hammer, cocked back as the trigger takes up
  ctx.save();
  ctx.translate(-6, -8);
  ctx.rotate(-hammer * 0.55);
  ctx.fillStyle = '#2b2f36';
  ctx.fillRect(-7, -9, 9, 11);
  ctx.fillStyle = '#4b515c';
  ctx.fillRect(-7, -9, 9, 3);
  ctx.restore();

  // frame
  ctx.fillStyle = steel;
  ctx.beginPath();
  ctx.moveTo(-8, -9); ctx.lineTo(17, -9);
  ctx.lineTo(17, 6); ctx.lineTo(-6, 6);
  ctx.quadraticCurveTo(-12, 2, -8, -9);
  ctx.closePath(); ctx.fill();

  // trigger guard
  ctx.strokeStyle = '#33383f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(3, 9, 7, -0.2, Math.PI - 0.1);
  ctx.stroke();

  // cylinder
  ctx.save();
  ctx.translate(8, -2);
  ctx.fillStyle = steel;
  ctx.beginPath(); ctx.arc(0, 0, 11.5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#171a1f'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.rotate(cyl);
  for (let i = 0; i < CHAMBERS; i++) {
    const a = (i / CHAMBERS) * Math.PI * 2;
    ctx.fillStyle = '#0b0d10';
    ctx.beginPath(); ctx.arc(Math.cos(a) * 6.6, Math.sin(a) * 6.6, 2.2, 0, 7); ctx.fill();
  }
  ctx.restore();

  // barrel + underlug
  ctx.fillStyle = steel;
  ctx.fillRect(17, -9, 28, 9);
  ctx.fillStyle = '#262b32';
  ctx.fillRect(17, 0, 24, 5);
  ctx.fillStyle = '#6a707c';
  ctx.fillRect(17, -9, 28, 1.6);                 // top strap highlight
  ctx.fillStyle = '#7d838f';
  ctx.fillRect(41, -12, 3, 4);                   // front sight
  ctx.fillStyle = '#000';                        // the bore
  ctx.beginPath(); ctx.ellipse(45, -4.5, 2.2, 3.6, 0, 0, 7); ctx.fill();

  ctx.restore();
}

// torso + head, traced so the silhouette and its wall shadow agree
function figureBody(breathe) {
  ctx.beginPath();
  ctx.moveTo(592, 224 + breathe);
  ctx.quadraticCurveTo(672, 194 + breathe, 752, 226 + breathe);
  ctx.lineTo(800, 460);
  ctx.lineTo(548, 460);
  ctx.closePath();
}

function figureHead(breathe) {
  ctx.beginPath();
  ctx.rect(659, 174 + breathe, 27, 42);                          // neck
  ctx.arc(FIG.hx, FIG.hy + breathe, FIG.hr, 0, 7);
  ctx.closePath();
}

function figureHat(breathe) {
  const y = FIG.hy + breathe;
  ctx.beginPath();
  ctx.ellipse(FIG.hx - 5, y - 24, 49, 8.5, -0.04, 0, 7);         // brim
  ctx.moveTo(FIG.hx - 27, y - 26);
  ctx.quadraticCurveTo(FIG.hx - 24, y - 57, FIG.hx + 3, y - 55);
  ctx.quadraticCurveTo(FIG.hx + 26, y - 52, FIG.hx + 25, y - 26);
  ctx.closePath();
}

const SILHOUETTE = '#050509';
const RIM = 'rgba(255,192,124,.42)';

function pose(t) {
  const a = ease(S.aim);
  const breathe = Math.sin(t * 1.3) * 1.6 * (1 - a * 0.7);
  return {
    a, breathe,
    hx: lerp(REST.x, AIM.x, a),
    hy: lerp(REST.y, AIM.y, a) + breathe
  };
}

// Death rotates everything about the same pivot, so body and arm agree.
function applySlump() {
  if (!S.death) return;
  const d = easeOut(clamp(S.death.t / 1.1, 0, 1));
  ctx.translate(690, 430);
  ctx.rotate(-0.3 * d);
  ctx.translate(-690, -430 + 34 * d);
}

// Layer 1 — head and torso, drawn before the table so the table cuts him
// off at the waist the way a table does.
function drawFigureBody(P) {
  const breathe = P.breathe;

  // shadow thrown across the back wall
  ctx.save();
  if (ctx.filter !== undefined) ctx.filter = 'blur(7px)';
  ctx.globalAlpha = 0.5;
  applySlump();
  ctx.translate(672, 300);
  ctx.scale(1.12, 1.07);
  ctx.translate(-672 + 66, -300 - 4);
  ctx.fillStyle = '#000';
  figureBody(breathe); ctx.fill();
  figureHead(breathe); ctx.fill();
  figureHat(breathe); ctx.fill();
  ctx.restore();

  ctx.save();
  applySlump();

  // torso
  ctx.fillStyle = SILHOUETTE;
  figureBody(breathe);
  ctx.fill();
  ctx.strokeStyle = RIM; ctx.lineWidth = 2; ctx.stroke();

  // coat lapels
  ctx.strokeStyle = 'rgba(255,190,120,.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(660, 214 + breathe); ctx.lineTo(640, 330);
  ctx.moveTo(688, 214 + breathe); ctx.lineTo(710, 330);
  ctx.stroke();

  // head + neck
  ctx.fillStyle = SILHOUETTE;
  figureHead(breathe);
  ctx.fill();
  ctx.strokeStyle = RIM; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(FIG.hx, FIG.hy + breathe, FIG.hr, 0, 7); ctx.stroke();
  // brow catching the bulb
  ctx.strokeStyle = 'rgba(255,205,150,.62)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(FIG.hx, FIG.hy + breathe, FIG.hr - 1.5, Math.PI * 1.02, Math.PI * 1.62);
  ctx.stroke();

  // fedora
  ctx.fillStyle = '#030307';
  figureHat(breathe);
  ctx.fill();
  ctx.strokeStyle = RIM; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,190,120,.13)';      // band
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(FIG.hx - 26, FIG.hy - 31 + breathe);
  ctx.quadraticCurveTo(FIG.hx, FIG.hy - 37 + breathe, FIG.hx + 25, FIG.hy - 30 + breathe);
  ctx.stroke();
  ctx.restore();
}

// Layer 2 — the arm and the revolver, over the table top.
function drawFigureArm(P) {
  const { a, breathe, hx, hy } = P;
  // once he is down, the arm follows him behind the table
  const gone = S.death ? clamp((S.death.t - 0.35) / 0.45, 0, 1) : 0;
  if (gone >= 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - gone;
  applySlump();

  // elbow drops to the table at rest, chicken-wings out to aim
  const sign = lerp(-1, 1, a);
  const E = elbow(FIG.sx, FIG.sy + breathe, hx, hy, FIG.upper, FIG.fore, sign);
  ctx.strokeStyle = SILHOUETTE;
  limb(FIG.sx, FIG.sy + breathe, E.x, E.y, 30);
  limb(E.x, E.y, hx, hy, 23);
  ctx.strokeStyle = RIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(FIG.sx + 2, FIG.sy - 14 + breathe);
  ctx.lineTo(E.x + 4, E.y - 12);
  ctx.lineTo(hx, hy - 10);
  ctx.stroke();

  // gun in hand (unless it has fallen out of it)
  if (!S.gunFree) {
    const tilt = lerp(0.02, 0.09, a) + S.tilt;
    drawGun(hx, hy, tilt, S.cyl, S.hammer, GUN_SCALE);
  }

  // hand over the grip
  ctx.fillStyle = SILHOUETTE;
  ctx.beginPath(); ctx.ellipse(hx, hy + 2, 10.5, 12.5, -0.3, 0, 7); ctx.fill();
  ctx.strokeStyle = RIM; ctx.lineWidth = 1.4; ctx.stroke();

  ctx.restore();
}

function drawFreeGun(dt) {
  const g = S.gunFree;
  g.x += g.vx * dt; g.y += g.vy * dt;
  g.vy += 900 * dt;
  g.a += g.va * dt;
  if (g.y > 348) { g.y = 348; g.vy *= -0.2; g.vx *= 0.5; g.va *= 0.3; }
  drawGun(g.x, g.y, g.a, S.cyl, 0, GUN_SCALE);
}

/* ---------- effects ---------- */

function drawMotes(t, dt) {
  if (S.motes.length === 0) {
    for (let i = 0; i < 46; i++)
      S.motes.push({ x: rnd(0, W), y: rnd(40, 430), r: rnd(0.5, 1.7), s: rnd(4, 16), p: rnd(0, 7) });
  }
  ctx.fillStyle = 'rgba(255,214,160,.4)';
  S.motes.forEach(m => {
    m.y -= m.s * dt * 0.35;
    m.x += Math.sin(t * 0.4 + m.p) * 6 * dt;
    if (m.y < 30) { m.y = 440; m.x = rnd(0, W); }
    const d = Math.hypot(m.x - BULB.x, m.y - BULB.y);
    ctx.globalAlpha = clamp(1 - d / 420, 0, 1) * 0.5;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawParts() {
  S.parts.forEach(p => {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1) * (p.smoke ? 0.32 : 0.95);
    ctx.fillStyle = p.col;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawMuzzleFlash(P) {
  if (S.flash <= 0.3) return;
  const a = (S.flash - 0.3) / 0.65;
  const mx = P.hx - 40, my = P.hy - 8;
  const g = ctx.createRadialGradient(mx, my, 2, mx, my, 78);
  g.addColorStop(0, `rgba(255,250,225,${a})`);
  g.addColorStop(0.3, `rgba(255,190,90,${a * 0.7})`);
  g.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(mx, my, 78, 0, 7); ctx.fill();

  ctx.fillStyle = `rgba(255,244,210,${a})`;
  ctx.beginPath();
  ctx.moveTo(mx + 10, my);
  ctx.lineTo(mx - 18, my - 14);
  ctx.lineTo(mx - 32, my);
  ctx.lineTo(mx - 18, my + 14);
  ctx.closePath();
  ctx.fill();
}

function drawBanner(dt) {
  const b = S.banner;
  if (!b) return;
  b.t += dt;
  if (b.t > 1.5) { S.banner = null; return; }
  const a = b.t < 0.12 ? b.t / 0.12 : clamp((1.5 - b.t) / 0.5, 0, 1);
  const y = 250 - Math.min(b.t, 0.5) * 26;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.fillStyle = b.col;
  ctx.font = '800 62px "Helvetica Neue", Arial, sans-serif';
  ctx.shadowColor = '#000'; ctx.shadowBlur = 24;
  ctx.fillText(b.txt, W / 2, y);
  if (b.sub) {
    ctx.font = '700 20px "Courier New", monospace';
    ctx.fillStyle = '#cfc7b8';
    ctx.fillText(b.sub, W / 2, y + 32);
  }
  ctx.restore();
}

function drawOverlayFX() {
  // vignette, tightening as you aim
  const tight = 0.62 - S.aim * 0.16;
  const v = ctx.createRadialGradient(W / 2, H / 2, H * tight, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, `rgba(0,0,0,${0.72 + S.aim * 0.16})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);

  if (S.redOut > 0) {
    const r = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, H);
    r.addColorStop(0, `rgba(150,10,18,${S.redOut * 0.18})`);
    r.addColorStop(1, `rgba(90,4,10,${S.redOut * 0.7})`);
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
  }

  if (grain) {
    ctx.globalAlpha = 0.34;
    for (let i = 0; i < 2; i++)
      ctx.drawImage(grain, -Math.random() * 160, -Math.random() * 160, W + 160, H + 160);
    ctx.globalAlpha = 1;
  }

  if (S.flash > 0) {
    ctx.fillStyle = `rgba(255,248,235,${Math.min(1, S.flash)})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (S.fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, S.fade)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ============================================================
   LOOP
   ============================================================ */

let last = 0, clock = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000 || 0, 0.05);
  last = now;
  clock += dt;

  tickTimers();

  // eased presentation values
  S.aim += (S.aimTarget - S.aim) * Math.min(1, dt * 6.5);
  S.tilt += (0 - S.tilt) * Math.min(1, dt * 7);
  S.hammer = S.phase === 'pulling' ? Math.min(1, S.hammer + dt * 3.2) : Math.max(0, S.hammer - dt * 6);
  S.cyl += S.cylSpin * dt;
  S.cylSpin *= Math.pow(0.12, dt);
  S.shake *= Math.pow(0.02, dt);
  S.flash = Math.max(0, S.flash - dt * 7);
  S.redOut = Math.max(0, S.redOut - dt * 0.22);
  if (S.fade > 0) S.fade = Math.min(1, S.fade + dt * 1.1);
  S.bulbDim += ((S.aim > 0.5 ? 1 : 0) - S.bulbDim) * Math.min(1, dt * 3);
  if (S.death) S.death.t += dt;
  S.bloodOnTable += (S.bloodTarget - S.bloodOnTable) * Math.min(1, dt * 1.4);
  updateParts(dt);

  const sc = cv.width / W;
  ctx.setTransform(sc, 0, 0, sc, 0, 0);
  ctx.clearRect(0, 0, W, H);

  ctx.save();
  if (S.shake > 0.3) ctx.translate(rnd(-S.shake, S.shake), rnd(-S.shake, S.shake));

  const bx = drawRoom(clock);
  drawBulb(bx, clock);
  drawWatcher(clock);
  drawMotes(clock, dt);
  const P = pose(clock);
  drawFigureBody(P);
  drawTable();
  drawProps(clock);
  drawFigureArm(P);
  if (S.gunFree) drawFreeGun(dt);
  drawMuzzleFlash(P);
  drawParts();
  ctx.restore();

  drawOverlayFX();
  drawBanner(dt);

  requestAnimationFrame(frame);
}

/* ============================================================
   INTERFACE
   ============================================================ */

const panel = $('panel');
const overlay = $('overlay');

function renderUI() {
  // --- top bar ---
  $('hud').classList.toggle('hidden', S.phase === 'title');
  $('hud-chips').textContent = money(S.chips);
  $('hud-goal').textContent = money(GOAL);
  $('hud-bar').style.width = clamp((S.chips / GOAL) * 100, 0, 100) + '%';
  const pot = $('hud-pot');
  pot.textContent = S.pot ? money(S.pot) : '—';
  pot.classList.toggle('idle', !S.pot);

  // --- overlays ---
  overlay.classList.add('hidden');
  overlay.classList.remove('soft');
  panel.classList.remove('hidden');

  switch (S.phase) {
    case 'title':
      panel.classList.add('hidden');
      overlay.classList.remove('hidden');
      overlay.classList.add('soft');
      overlay.innerHTML = `
        <div class="title">SIX CHAMBERS</div>
        <div class="tagline">bet &middot; pull &middot; breathe</div>
        <p class="rules">
          Load the revolver yourself, spin it, and hold it to your own head.
          Every <b>blank</b> multiplies the pot — and empties a chamber, so the
          <span class="risk">next pull is always worse</span>.
          Cash out whenever your nerve goes.<br>
          Reach <span class="gain">${money(GOAL)}</span> and you walk out of here.
        </p>
        <div class="row"><button class="btn btn-fire" data-act="start">Sit down</button></div>
        <div class="tagline" style="font-size:1.1cqw">space — pull &nbsp;·&nbsp; C — cash out &nbsp;·&nbsp; M — mute</div>`;
      break;

    case 'bet': {
      const pct = Math.round((S.live / CHAMBERS) * 100);
      const maxAffordable = Math.max(MIN_STAKE, Math.floor(S.chips / STAKE_STEP) * STAKE_STEP);
      S.stake = clamp(S.stake, MIN_STAKE, maxAffordable);
      panel.innerHTML = `
        <div class="readout">
          <span>Load the cylinder</span><span class="sep">/</span>
          <span><b>${S.live}</b> live in ${CHAMBERS}</span><span class="sep">/</span>
          <span>first pull <span class="risk">${pct}% death</span></span><span class="sep">/</span>
          <span>pays <span class="gain">&times;${payMult(S.live / CHAMBERS).toFixed(2)}</span></span>
        </div>
        <div class="row">
          <div class="cyl">${
            Array.from({ length: CHAMBERS }, (_, i) =>
              `<button class="pip ${i < S.live ? 'live' : 'unknown'}" data-act="live" data-n="${i + 1}"
                       ${i === CHAMBERS - 1 ? 'disabled title="At least one blank, always."' : ''}></button>`).join('')
          }</div>
          <div class="stepper">
            <button data-act="stake" data-d="-1">–</button>
            <span class="stake">${money(S.stake)}</span>
            <button data-act="stake" data-d="1">+</button>
          </div>
          <button class="btn btn-ghost" data-act="stake-max">All in</button>
        </div>
        <div class="row">
          <button class="btn btn-fire" data-act="load">Load &amp; spin</button>
        </div>`;
      break;
    }

    case 'spinning':
      panel.innerHTML = `<div class="readout"><span>The cylinder is turning&hellip;</span></div>`;
      break;

    case 'ready':
    case 'pulling': {
      const left = chambersLeft(), lv = liveLeft();
      const pct = Math.round(deathChance() * 100);
      const doomed = pct >= 100;
      const busy = S.phase === 'pulling';
      panel.innerHTML = `
        <div class="readout">
          <span><b>${left}</b> chamber${left === 1 ? '' : 's'} left</span><span class="sep">/</span>
          <span><b>${lv}</b> live</span><span class="sep">/</span>
          <span><span class="risk">${pct}% death</span></span><span class="sep">/</span>
          ${doomed
            ? `<span class="risk">nothing left to gamble</span>`
            : `<span>survive &rarr; <span class="gain">${money(nextPot())}</span></span>`}
        </div>
        <div class="row">
          <div class="cyl">${
            S.order.map((_, i) =>
              `<button class="pip ${i < S.idx ? 'spent' : 'unknown'}" disabled></button>`).join('')
          }</div>
        </div>
        <div class="row">
          <button class="btn btn-fire" data-act="pull" ${busy || doomed ? 'disabled' : ''}>
            ${doomed ? 'Every chamber is live' : 'Pull the trigger'}
          </button>
          ${S.pulls > 0 || S.idx > 0
            ? `<button class="btn btn-cash" data-act="cash" ${busy ? 'disabled' : ''}>Cash out ${money(S.pot)}</button>`
            : `<button class="btn btn-ghost" data-act="back" ${busy ? 'disabled' : ''}>Unload (keep half)</button>`}
        </div>`;
      break;
    }

    case 'dead':
      panel.classList.add('hidden');
      overlay.classList.remove('hidden');
      overlay.innerHTML = `
        <div class="title dead">CHAMBER ${S.death ? S.death.pull : ''}</div>
        <div class="tagline">the loud one</div>
        <p class="epitaph">
          You survived <b>${S.pulls}</b> pull${S.pulls === 1 ? '' : 's'} across
          <b>${S.rounds}</b> cashed cylinder${S.rounds === 1 ? '' : 's'}.<br>
          Left on the table: <b>${money(S.death ? S.death.lost : 0)}</b>.
          Biggest pot you ever held: <b>${money(S.best)}</b>.<br>
          Chips banked when it ended: <b>${money(S.chips)}</b> of ${money(GOAL)}.
        </p>
        <div class="row"><button class="btn btn-fire" data-act="start">Sit down again</button></div>`;
      break;

    case 'won':
      panel.classList.add('hidden');
      overlay.classList.remove('hidden');
      overlay.innerHTML = `
        <div class="title won">YOU WALK OUT</div>
        <div class="tagline">${money(S.chips)} and both temples intact</div>
        <p class="epitaph">
          <b>${S.pulls}</b> pull${S.pulls === 1 ? '' : 's'} survived &middot;
          <b>${S.rounds}</b> cylinder${S.rounds === 1 ? '' : 's'} cashed &middot;
          best pot <b>${money(S.best)}</b>.
        </p>
        <div class="row"><button class="btn btn-cash" data-act="start">Go again</button></div>`;
      break;

    case 'busted':
      panel.classList.add('hidden');
      overlay.classList.remove('hidden');
      overlay.innerHTML = `
        <div class="title dead">BROKE</div>
        <div class="tagline">not enough left to make a bet</div>
        <p class="epitaph">
          You lived — which is more than most — but the house keeps the chair warm.<br>
          <b>${S.pulls}</b> pull${S.pulls === 1 ? '' : 's'} survived &middot; best pot <b>${money(S.best)}</b>.
        </p>
        <div class="row"><button class="btn btn-fire" data-act="start">Sit down again</button></div>`;
      break;
  }
}

/* ---------- input ---------- */

function act(name, el) {
  snd.init();
  switch (name) {
    case 'start': newRun(); break;
    case 'live':
      S.live = clamp(parseInt(el.dataset.n, 10), 1, CHAMBERS - 1);
      snd.tick(0.3, 900);
      renderUI();
      break;
    case 'stake': {
      const d = parseInt(el.dataset.d, 10) * STAKE_STEP;
      S.stake = clamp(S.stake + d, MIN_STAKE, Math.max(MIN_STAKE, S.chips));
      snd.tick(0.18, 2600);
      renderUI();
      break;
    }
    case 'stake-max':
      S.stake = Math.max(MIN_STAKE, Math.floor(S.chips / STAKE_STEP) * STAKE_STEP);
      snd.chips();
      renderUI();
      break;
    case 'load':
      if (S.chips >= MIN_STAKE) loadCylinder();
      break;
    case 'pull': pull(); break;
    case 'cash': cashOut(); break;
    case 'back': backOut(); break;
  }
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  act(el.dataset.act, el);
});

document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'm') { toggleMute(); return; }
  if (k === ' ' || k === 'enter') {
    e.preventDefault();
    if (S.phase === 'title' || S.phase === 'dead' || S.phase === 'won' || S.phase === 'busted') newRun();
    else if (S.phase === 'bet') { snd.init(); loadCylinder(); }
    else if (S.phase === 'ready' && deathChance() < 1) { snd.init(); pull(); }
  }
  if (k === 'c' && S.phase === 'ready' && S.pot && S.idx > 0) { snd.init(); cashOut(); }
  if (S.phase === 'bet' && (k === 'arrowup' || k === 'arrowdown')) {
    e.preventDefault();
    S.stake = clamp(S.stake + (k === 'arrowup' ? STAKE_STEP : -STAKE_STEP), MIN_STAKE, Math.max(MIN_STAKE, S.chips));
    renderUI();
  }
  if (S.phase === 'bet' && (k === 'arrowleft' || k === 'arrowright')) {
    e.preventDefault();
    S.live = clamp(S.live + (k === 'arrowright' ? 1 : -1), 1, CHAMBERS - 1);
    renderUI();
  }
});

function toggleMute() {
  snd.init();
  snd.setMuted(!snd.muted);
  const b = $('mute');
  b.textContent = snd.muted ? '✕' : '♪';
  b.classList.toggle('off', snd.muted);
}
$('mute').addEventListener('click', toggleMute);

/* ---------- boot ---------- */

try { snd.muted = localStorage.getItem('sixchambers.muted') === '1'; } catch (e) {}
if (snd.muted) { $('mute').textContent = '✕'; $('mute').classList.add('off'); }

grain = makeGrain();
fitCanvas();
window.addEventListener('resize', fitCanvas);
window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 120));
renderUI();
requestAnimationFrame(t => { last = t; frame(t); });

// exposed for dev/sim.js
window.SIX = { S, buildCylinder, nextPot, payMult, deathChance, CHAMBERS, RISK_PAY };

})();
