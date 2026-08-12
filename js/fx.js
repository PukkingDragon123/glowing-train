'use strict';
/* ============================================================
   SHELL & DEBT — fx.js
   The effects rig. One capped particle pool, a tiny tween
   runner, a library of named emitters and a screen-space layer
   (shake / flash / vignette / heartbeat / slow-mo / chroma).

   Everything draws in DUEL world space (360x200, bottom
   anchored) except FX.drawScreen, which draws in raw canvas
   space. Emit-and-forget: nothing here ever needs cleanup.

   Layers
     0  back   — behind the mark            FX.draw(ctx, t)
     2  felt   — on the table cloth         FX.drawFelt(ctx)   (optional)
     1  front  — over the gun / the mark    FX.drawFront(ctx, t)

   Pixel discipline: 1-3px squares, stepped rings, stepped
   ellipses via SPR.ellipse. No diagonal paths, no gradients
   except the two big screen washes.
   ============================================================ */

const FX = (function () {

  const MAX = 340;          // hard cap on live particles — never grows
  const FELT = 149;         // felt surface, world y
  const MAXSTAIN = 40;      // blood decals kept on the cloth

  /* ================= easing ================= */

  const ease = {
    linear:     t => t,
    inQuad:     t => t * t,
    outQuad:    t => t * (2 - t),
    inOutQuad:  t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    inCubic:    t => t * t * t,
    outCubic:   t => { const k = t - 1; return k * k * k + 1; },
    inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 + (t - 1) * (2 * t - 2) * (2 * t - 2)),
    inSine:     t => 1 - Math.cos(t * Math.PI / 2),
    outSine:    t => Math.sin(t * Math.PI / 2),
    inOutSine:  t => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack:    t => { const c = 1.70158, k = t - 1; return 1 + (c + 1) * k * k * k + c * k * k; },
    outElastic: t => (t <= 0 ? 0 : t >= 1 ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (Math.PI * 2 / 3)) + 1),
    outBounce(t) {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) { t -= 1.5 / d; return n * t * t + 0.75; }
      if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + 0.9375; }
      t -= 2.625 / d; return n * t * t + 0.984375;
    },
  };

  /* ================= the pool ================= */

  const pool = [];
  const counts = {};
  let cursor = 0;
  for (let i = 0; i < MAX; i++) pool.push({ live: false, kind: '', layer: 0 });

  function scrub(p, kind, layer) {
    p.live = true; p.kind = kind; p.layer = layer | 0;
    p.x = 0; p.y = 0; p.vx = 0; p.vy = 0; p.g = 0; p.drag = 1;
    p.t = 0; p.life = 40; p.wait = 0;
    p.s = 2; p.grow = 0; p.col = '#f4efe0'; p.col2 = null;
    p.a = 1; p.fade = 1;
    p.rot = 0; p.vr = 0; p.spin = 0; p.r = 0;
    p.wob = 0; p.ph = Math.random() * 6.283;
    p.x0 = 0; p.y0 = 0; p.tx = 0; p.ty = 0;
    p.floor = FELT; p.bounce = 0;
    p.sprite = null; p.onEnd = null; p.data = null; p.sfx = null;
    return p;
  }

  function bump(kind, d) { counts[kind] = (counts[kind] || 0) + d; }

  function kill(p) { if (p.live) { p.live = false; bump(p.kind, -1); } }

  function alloc(kind, layer) {
    for (let i = 0; i < MAX; i++) {
      const j = (cursor + i) % MAX;
      const p = pool[j];
      if (!p.live) { cursor = (j + 1) % MAX; bump(kind, 1); return scrub(p, kind, layer); }
    }
    /* pool full: recycle the oldest slot — but skip slots holding a pending
       onEnd (cardFly's onDone reveals the loot card; swallowing it would
       leave the DOM card hidden forever). If every slot has one, fire it. */
    let j = cursor, tries = 0;
    while (pool[j].onEnd && tries < MAX) { j = (j + 1) % MAX; tries++; }
    const p = pool[j];
    const cb = p.onEnd;
    kill(p); cursor = (j + 1) % MAX;
    bump(kind, 1);
    const np = scrub(p, kind, layer);
    if (cb) { try { cb(); } catch (e) {} }
    return np;
  }

  /* blood on the cloth — kept outside the pool so it can persist */
  let stains = [];
  function stain(x, y, rx, ry, col, grow) {
    /* SPR.ellipse divides by ry — a zero/NaN radius would emit NaN fillRects */
    rx = Math.max(0.5, +rx || 0.5); ry = Math.max(0.5, +ry || 0.5);
    if (!isFinite(x) || !isFinite(y)) return;
    stains.push({ x: x, y: y, rx: rx, ry: ry, col: col || PIX.PAL.d, grow: grow || 0, tx: rx });
    if (grow) stains[stains.length - 1].tx = rx * (2 + Math.random());
    if (stains.length > MAXSTAIN) stains.splice(0, stains.length - MAXSTAIN);
  }

  /* ================= clock / time scale ================= */

  let frame = 0, lastMs = 0, dt = 1, ms = 16.67;
  let ts = 1, slow = null;
  let amb = false;

  /* ================= tweens ================= */

  const tweens = [];
  let inTweens = false;

  function tween(o) {
    o = o || {};
    const tw = {
      from: o.from === undefined ? 0 : o.from,
      to: o.to === undefined ? 1 : o.to,
      ms: Math.max(1, o.ms || 300),
      e: typeof o.ease === 'function' ? o.ease : (ease[o.ease] || ease.outCubic),
      el: 0, wait: o.delay || 0,
      up: o.onUpdate, done: o.onDone, dead: false,
      cancel() { this.dead = true; },
    };
    /* at the cap, retire the stalest rather than silently ignoring the new
       request — a FX.after() whose onDone never fires is a nasty failure.
       Never splice while stepTweens is walking the array. */
    if (tweens.length >= 64) {
      if (inTweens) { for (let i = 0; i < tweens.length; i++) if (!tweens[i].dead) { tweens[i].dead = true; break; } }
      else tweens.splice(0, 1);
    }
    tweens.push(tw);
    return tw;
  }

  function stepTweens(d) {
    inTweens = true;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      if (tw.dead) { tweens.splice(i, 1); continue; }
      if (tw.wait > 0) { tw.wait -= d; continue; }
      tw.el += d;
      const k = Math.min(1, tw.el / tw.ms);
      let v = tw.to;                          // a caller-supplied ease must not kill the frame
      try { const kk = tw.e(k); if (isFinite(kk)) v = tw.from + (tw.to - tw.from) * kk; }
      catch (e) { tw.dead = true; }
      if (tw.up) { try { tw.up(v, k); } catch (e) {} }
      if (k >= 1) {
        tweens.splice(i, 1);
        if (tw.done) { try { tw.done(); } catch (e) {} }
      }
    }
    inTweens = false;
  }

  /* ================= screen state ================= */

  let shakeV = 0, chromaV = 0;
  let flash = null;      // {col, a, dec}
  let vig = null;        // {col, a, dec}
  let heart = false, heartPh = 0;
  let scratch = null, gradCache = null;

  /* ================= sound helper ================= */

  function sfx(name) {
    if (typeof SFX === 'undefined' || !SFX || SFX.muted) return;
    if (typeof SFX[name] === 'function') { try { SFX[name](); } catch (e) {} }
  }

  /* ================= text cache ================= */

  const TXT = {};
  let txtKeys = [];
  function textCv(str, col, sc, outline) {
    const key = sc + '|' + col + '|' + (outline || '-') + '|' + str;
    let cv = TXT[key];
    if (!cv) {
      cv = PIXFONT.render(String(str), {
        scale: sc, color: col, outline: outline === null ? undefined : (outline || PIX.PAL.K),
      });
      TXT[key] = cv; txtKeys.push(key);
      if (txtKeys.length > 48) delete TXT[txtKeys.shift()];
    }
    return cv;
  }

  /* ================= lamp cone (for ambient dust) ================= */

  function coneHalf(y) {                     // half width of the lamp cone at world y
    const k = Math.max(0, Math.min(1, (y - 24) / 128));
    return 14 + k * 120;
  }
  function coneX(y, t) {
    return 180 + Math.sin((t || frame) / 90) * 3 + (Math.random() - 0.5) * 2 * coneHalf(y);
  }

  /* ================= emitters ================= */

  const P = () => PIX.PAL;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pk = arr => arr[(Math.random() * arr.length) | 0];
  const cap = (n, m) => Math.max(1, Math.min(m, n | 0));

  /* --- cordite: expanding ring out of the muzzle --- */
  function smokeRing(x, y, dir) {
    const p = PIX.PAL;
    dir = dir === undefined ? 1 : (dir < 0 ? -1 : 1);
    const r = alloc('ring', 1);
    r.x = x; r.y = y; r.r = 2; r.grow = 1.25; r.life = 16;
    r.vx = dir * 0.45; r.vy = -0.12; r.col = p.w; r.col2 = p.q; r.a = 0.8;
    const r2 = alloc('ring', 1);
    r2.x = x; r2.y = y; r2.r = 1; r2.grow = 0.7; r2.life = 22;
    r2.vx = dir * 0.3; r2.vy = -0.2; r2.col = p.q; r2.col2 = null; r2.a = 0.5;
    for (let i = 0; i < 6; i++) {
      const q = alloc('smoke', 1);
      const a = (i / 6) * Math.PI * 2;
      q.x = x + Math.cos(a) * 3; q.y = y + Math.sin(a) * 3;
      q.vx = Math.cos(a) * rnd(0.5, 1.1) + dir * 0.5;
      q.vy = Math.sin(a) * rnd(0.4, 0.9) - 0.25;
      q.g = -0.012; q.drag = 0.94; q.s = 2; q.grow = 0.035;
      q.life = rnd(26, 44); q.a = 0.75; q.col = pk([p.w, p.q, p.m]);
    }
  }

  /* --- cordite haze that hangs around --- */
  function cordite(x, y, n) {
    const p = PIX.PAL;
    n = cap(n || 10, 18);
    for (let i = 0; i < n; i++) {
      const q = alloc('smoke', 1);
      q.x = x + rnd(-3, 3); q.y = y + rnd(-3, 3);
      q.vx = rnd(-0.35, 0.35); q.vy = rnd(-0.5, -0.12);
      q.g = -0.006; q.drag = 0.985;
      q.s = rnd(1, 2) | 0 || 1; q.grow = 0.022;
      q.life = rnd(110, 200); q.a = 0.42; q.fade = 0.7;
      q.wob = 0.22; q.col = pk([p.q, p.m, p.w, p.s]);
    }
  }

  /* --- hot metal sparks --- */
  function sparks(x, y, n, spread) {
    const p = PIX.PAL;
    n = cap(n || 10, 34);
    spread = spread || 1;
    for (let i = 0; i < n; i++) {
      const q = alloc('spark', 1);
      const a = rnd(-Math.PI, Math.PI);
      const sp = rnd(0.8, 3.4) * spread;
      q.x = x; q.y = y;
      q.vx = Math.cos(a) * sp; q.vy = Math.sin(a) * sp - 0.9;
      q.g = 0.22; q.drag = 0.985; q.bounce = 0.42; q.floor = FELT;
      q.s = Math.random() < 0.25 ? 2 : 1;
      q.life = rnd(24, 58); q.fade = 0.5;
      q.col = pk([p.Y, p.G, p.O, p.W]); q.col2 = p.o;
    }
  }

  /* --- arterial spray. power 1..3, dir in radians (default: up) --- */
  function bloodBurst(x, y, power, dir) {
    const p = PIX.PAL;
    power = Math.max(0.5, Math.min(3, power === undefined ? 1 : power));
    const base = dir === undefined ? -Math.PI / 2 : dir;
    const n = cap(8 + power * 7, 30);
    for (let i = 0; i < n; i++) {
      const q = alloc('blood', 1);
      const a = base + rnd(-0.85, 0.85);
      const sp = rnd(0.7, 2.2 + power * 0.9);
      q.x = x + rnd(-2, 2); q.y = y + rnd(-2, 2);
      q.vx = Math.cos(a) * sp; q.vy = Math.sin(a) * sp;
      q.g = 0.15; q.drag = 0.995;
      q.s = Math.random() < 0.3 ? 3 : 2;
      q.life = rnd(20, 46); q.fade = 0.35;
      q.col = pk([p.R, p.r, p.d]);
      q.floor = FELT + rnd(-4, 14); q.bounce = 0.2;
      q.data = 'wet';
    }
    /* three fast streaks that read as pressure */
    for (let i = 0; i < 3; i++) {
      const q = alloc('streak', 1);
      const a = base + rnd(-0.35, 0.35);
      q.x = x; q.y = y;
      q.vx = Math.cos(a) * rnd(2.4, 4.2); q.vy = Math.sin(a) * rnd(2.4, 4.2);
      q.g = 0.16; q.life = rnd(14, 22); q.s = 2; q.col = p.R; q.col2 = p.d;
    }
    for (let i = 0; i < Math.ceil(power * 2); i++) {
      stain(x + rnd(-24, 24), FELT - rnd(2, 20), rnd(2, 5), rnd(1, 2.4),
        Math.random() < 0.5 ? p.d : p.r, 1);
    }
    if (power >= 2) { bloodDrip(x + rnd(-6, 6), y + 6); bloodDrip(x + rnd(-8, 8), y + 10); }
  }

  /* --- a drip that runs down, then pools --- */
  function bloodDrip(x, y, floorY) {
    const p = PIX.PAL;
    const q = alloc('drip', 1);
    q.x = x; q.y = y; q.y0 = y;
    q.vy = 0.04; q.g = 0.018; q.life = 260; q.fade = 0.12;
    q.floor = floorY === undefined ? FELT - rnd(0, 8) : floorY;
    q.col = p.r; q.col2 = p.d; q.s = 2;
    return q;
  }

  /* --- meat --- */
  function gib(x, y, n) {
    const p = PIX.PAL;
    n = cap(n || 4, 12);
    for (let i = 0; i < n; i++) {
      const q = alloc('gib', 1);
      const a = rnd(-Math.PI * 0.85, -Math.PI * 0.15);
      const sp = rnd(1.2, 3.1);
      q.x = x; q.y = y;
      q.vx = Math.cos(a) * sp; q.vy = Math.sin(a) * sp;
      q.g = 0.17; q.drag = 0.99; q.bounce = 0.24; q.floor = FELT + rnd(-6, 10);
      q.s = 2 + (Math.random() * 2 | 0);
      q.spin = rnd(0.12, 0.3); q.life = rnd(40, 74); q.fade = 0.25;
      q.col = pk([p.d, p.r, p.D]); q.col2 = p.R; q.data = 'wet';
    }
    const b = alloc('gib', 1);                 // one bone fleck
    b.x = x; b.y = y;
    b.vx = rnd(-1.6, 1.6); b.vy = rnd(-3.2, -1.8);
    b.g = 0.17; b.bounce = 0.35; b.floor = FELT;
    b.s = 2; b.spin = 0.34; b.life = 80; b.fade = 0.3;
    b.col = p.W; b.col2 = p.w;
  }

  /* --- chips arcing from A to B, landing with a clink --- */
  function chipToss(x0, y0, x1, y1, n, col) {
    const p = PIX.PAL;
    n = cap(n || 5, 16);
    for (let i = 0; i < n; i++) {
      const q = alloc('chip', 1);
      const life = rnd(26, 40);
      q.x = q.x0 = x0 + rnd(-4, 4); q.y = q.y0 = y0 + rnd(-3, 3);
      q.tx = x1 + rnd(-7, 7); q.ty = y1 + rnd(-4, 4);
      q.g = 0.16; q.life = life + 24; q.fade = 0.15;
      q.vx = (q.tx - q.x) / life;
      q.vy = (q.ty - q.y) / life - 0.5 * q.g * life;
      q.floor = q.ty; q.bounce = 0.32;
      q.vr = rnd(0.18, 0.4); q.wait = i * rnd(2, 5);
      q.col = col || pk([p.r, p.G, p.l, p.W]);
      q.sfx = i === n - 1 ? 'coin' : 'tick';
      q.data = 'clink';
    }
  }

  /* --- a card / sprite flying with a flip spin --- */
  function cardFly(sprite, x0, y0, x1, y1, onDone, sc) {
    if (!sprite) { if (onDone) onDone(); return null; }
    const q = alloc('card', 1);
    q.sprite = sprite;
    q.x = q.x0 = x0; q.y = q.y0 = y0; q.tx = x1; q.ty = y1;
    q.s = sc || 1; q.r = 14 + Math.abs(x1 - x0) * 0.08;
    q.life = 34; q.fade = 0; q.vr = 0.42; q.rot = 0;
    q.onEnd = onDone || null;
    sfx('deal');
    return q;
  }

  /* --- ambient motes in the lamp cone --- */
  function dust(n) {
    const p = PIX.PAL;
    n = cap(n || 8, 24);
    for (let i = 0; i < n; i++) {
      const q = alloc('mote', 0);
      q.y = rnd(26, 146); q.x = coneX(q.y);
      q.vx = rnd(-0.06, 0.06); q.vy = rnd(0.02, 0.12);
      q.s = Math.random() < 0.22 ? 2 : 1;
      q.life = rnd(220, 460); q.fade = 0.45; q.a = rnd(0.2, 0.55);
      q.wob = rnd(0.1, 0.3); q.col = pk([p.Y, p.W, p.q, p.G]);
    }
  }

  /* --- cigar embers --- */
  function emberDrift(x, y) {
    const p = PIX.PAL;
    const q = alloc('ember', 1);
    q.x = (x === undefined ? 198 : x) + rnd(-1, 1);
    q.y = (y === undefined ? 62 : y) + rnd(-1, 1);
    q.vx = rnd(-0.14, 0.2); q.vy = rnd(-0.5, -0.22);
    q.g = -0.004; q.drag = 0.995;
    q.s = 1; q.life = rnd(50, 110); q.fade = 0.6; q.a = 0.9;
    q.wob = 0.3; q.col = p.O; q.col2 = p.Y;
    if (Math.random() < 0.55) {
      const s2 = alloc('smoke', 1);
      s2.x = q.x; s2.y = q.y - 2;
      s2.vx = rnd(-0.15, 0.25); s2.vy = rnd(-0.4, -0.14);
      s2.g = -0.005; s2.s = 1; s2.grow = 0.018;
      s2.life = rnd(70, 130); s2.a = 0.3; s2.fade = 0.7; s2.wob = 0.2;
      s2.col = pk([p.q, p.m, p.s]);
    }
  }

  /* --- 2-frame white starburst --- */
  function impactFrame(x, y, big) {
    const q = alloc('star', 1);
    q.x = x; q.y = y; q.life = big ? 8 : 6; q.fade = 0;
    q.r = big ? 10 : 7; q.col = PIX.PAL.W; q.col2 = PIX.PAL.Y;
  }

  /* --- one expanding stepped ring --- */
  function shockwave(x, y, col, grow) {
    const q = alloc('ring', 1);
    q.x = x; q.y = y; q.r = 2; q.grow = grow || 1.7; q.life = 15;
    q.col = col || PIX.PAL.W; q.col2 = PIX.PAL.q; q.a = 0.85;
  }

  /* --- rising pixel text --- */
  function floatText(x, y, str, col, sc) {
    const q = alloc('text', 1);
    q.sprite = textCv(str, col || PIX.PAL.W, sc || 2, PIX.PAL.K);
    q.x = x; q.y = y; q.vy = -0.5; q.drag = 0.99;
    q.life = 72; q.fade = 0.34; q.wob = 0.2;
    return q;
  }

  /* ---------- extras ---------- */

  /* a proper muzzle bloom: core, stepped petals, ring, smoke, sparks */
  function muzzleFlash(x, y, ang) {
    const p = PIX.PAL;
    const q = alloc('muzz', 1);
    q.x = x; q.y = y; q.rot = ang || 0; q.life = 9; q.fade = 0;
    q.col = p.Y; q.col2 = p.O; q.ph = Math.random() * 6.283;
    smokeRing(x, y, Math.cos(ang || 0) < 0 ? -1 : 1);
    sparks(x, y, 8, 1.15);
    cordite(x, y, 8);
    return q;
  }

  /* the full "that hurt" package */
  function crit(x, y, label) {
    impactFrame(x, y, true);
    shockwave(x, y, PIX.PAL.W, 2.1);
    sparks(x, y, 10, 1.2);
    bloodBurst(x, y, 2.4);
    gib(x, y, 4);
    if (label) floatText(x, y - 10, label, PIX.PAL.R, 2);   // floatText centres on x
    screen.shake(15); screen.chroma(3); screen.flash(PIX.PAL.W, 0.42);
  }

  /* chips falling in from off the top — payday */
  function chipRain(n) {
    const p = PIX.PAL;
    n = cap(n || 10, 20);
    for (let i = 0; i < n; i++) {
      const q = alloc('chip', 1);
      const life = rnd(30, 46);
      q.x = q.x0 = rnd(60, 300); q.y = q.y0 = rnd(-40, -6);
      q.tx = q.x + rnd(-10, 10); q.ty = FELT - rnd(0, 6);
      q.g = 0.17; q.life = life + 30; q.fade = 0.15;
      q.vx = (q.tx - q.x) / life;
      q.vy = (q.ty - q.y) / life - 0.5 * q.g * life;
      q.floor = q.ty; q.bounce = 0.36; q.vr = rnd(0.2, 0.5);
      q.wait = i * rnd(1, 6);
      q.col = pk([p.r, p.G, p.l, p.W, p.V]);
      q.sfx = 'tick'; q.data = 'clink';
    }
  }

  /* a sweat bead that flies off and splats */
  function sweatDrop(x, y) {
    const q = alloc('bead', 1);
    q.x = x; q.y = y;
    q.vx = rnd(0.1, 0.6); q.vy = rnd(0.35, 0.85);
    q.g = 0.06; q.life = 46; q.fade = 0.3; q.s = 2;
    q.col = PIX.PAL.L; q.col2 = PIX.PAL.l; q.floor = FELT - 4;
  }

  /* cigar puff on demand */
  function cigarPuff(x, y, n) {
    n = cap(n || 4, 8);
    for (let i = 0; i < n; i++) emberDrift(x, y);
  }

  /* feathers for the soft rounds */
  function featherPuff(x, y, n) {
    const p = PIX.PAL;
    n = cap(n || 6, 14);
    for (let i = 0; i < n; i++) {
      const q = alloc('feather', 1);
      q.x = x + rnd(-3, 3); q.y = y + rnd(-3, 3);
      q.vx = rnd(-1.2, 1.2); q.vy = rnd(-1.6, -0.3);
      q.g = 0.03; q.drag = 0.97;
      q.s = 2; q.life = rnd(70, 130); q.fade = 0.3;
      q.wob = 0.9; q.spin = rnd(0.06, 0.16);
      q.col = pk([p.W, p.w, p.M]); q.col2 = p.q;
    }
  }

  /* glass shells / a broken bottle */
  function glassShatter(x, y, n) {
    const p = PIX.PAL;
    n = cap(n || 8, 18);
    for (let i = 0; i < n; i++) {
      const q = alloc('shard', 1);
      const a = rnd(-Math.PI, 0);
      const sp = rnd(1, 3);
      q.x = x; q.y = y;
      q.vx = Math.cos(a) * sp; q.vy = Math.sin(a) * sp;
      q.g = 0.2; q.bounce = 0.3; q.floor = FELT + rnd(-4, 8);
      q.s = 1 + (Math.random() * 2 | 0);
      q.spin = rnd(0.1, 0.3); q.life = rnd(40, 80); q.fade = 0.4;
      q.col = pk([p.L, p.W, p.l]); q.col2 = p.M; q.a = 0.85;
    }
    sfx('click');
  }

  /* a hanging brass casing tumbling out — nicer than the duel one */
  function casing(x, y, dir) {
    const p = PIX.PAL;
    const q = alloc('brass', 1);
    q.x = x; q.y = y;
    q.vx = (dir === undefined ? 1 : dir) * rnd(0.8, 2.2); q.vy = rnd(-3.4, -2);
    q.g = 0.3; q.bounce = 0.42; q.floor = FELT - 1; q.drag = 0.995;
    q.vr = rnd(0.3, 0.55); q.life = 150; q.fade = 0.1;
    q.col = p.g; q.col2 = p.G; q.sfx = 'tick'; q.data = 'clink';
  }

  /* ================= ambient ================= */

  function spawnFibre() {
    const p = PIX.PAL;
    const q = alloc('fibre', 2);
    q.x = rnd(60, 300); q.y = rnd(128, 152);
    q.vx = rnd(-0.05, 0.05); q.vy = rnd(-0.02, 0.02);
    q.s = 1; q.life = rnd(200, 380); q.fade = 0.5; q.a = rnd(0.12, 0.3);
    q.col = pk([p.F, p.f, p.q]);
  }

  function spawnWisp() {
    const q = alloc('wisp', 0);
    q.x = Math.random() < 0.5 ? rnd(20, 70) : rnd(280, 340);
    q.y = rnd(60, 120);
    q.vx = (q.x < 180 ? 1 : -1) * rnd(0.06, 0.16); q.vy = rnd(-0.06, -0.02);
    q.s = rnd(9, 16); q.grow = 0.012;
    q.life = rnd(320, 520); q.fade = 0.5; q.a = 0.09;
    q.col = PIX.PAL.q; q.wob = 0.4;
  }

  function spawnFly() {
    const q = alloc('fly', 1);
    q.x = rnd(80, 280); q.y = rnd(60, 130);
    q.life = rnd(320, 620); q.fade = 0.15; q.a = 0.9;
    q.s = 2; q.col = PIX.PAL.K; q.col2 = PIX.PAL.q;
    q.data = { tx: rnd(80, 280), ty: rnd(50, 132), c: 0 };
  }

  function ambientStep() {
    if (!amb) return;
    if ((counts.mote || 0) < 16 && Math.random() < 0.22) dust(1);
    if ((counts.fibre || 0) < 5 && Math.random() < 0.04) spawnFibre();
    if ((counts.wisp || 0) < 2 && Math.random() < 0.006) spawnWisp();
    if ((counts.fly || 0) < 1 && Math.random() < 0.003) spawnFly();
  }

  /* ================= per-frame ================= */

  function stepParticles() {
    for (let i = 0; i < MAX; i++) {
      const p = pool[i];
      if (!p.live) continue;
      if (p.wait > 0) { p.wait -= dt; continue; }
      p.t += dt;

      switch (p.kind) {

        case 'card': {                        // parametric, no physics
          p.rot += p.vr * dt;
          if (p.t >= p.life) {
            const cb = p.onEnd; p.onEnd = null; kill(p);
            if (cb) { try { cb(); } catch (e) {} }
            continue;
          }
          break;
        }

        case 'drip': {
          p.vy = Math.min(0.95, p.vy + p.g * dt);
          p.y += p.vy * dt;
          if (p.y >= p.floor) {
            stain(p.x, p.floor, 2.2, 1.1, p.col2, 1);
            kill(p); continue;
          }
          if (p.t >= p.life) { kill(p); continue; }
          break;
        }

        case 'fly': {
          const d = p.data;
          if (++d.c > 34 || (Math.abs(d.tx - p.x) < 4 && Math.abs(d.ty - p.y) < 4)) {
            d.c = 0; d.tx = rnd(70, 290); d.ty = rnd(46, 134);
          }
          p.vx += (d.tx - p.x) * 0.006 + (Math.random() - 0.5) * 0.22;
          p.vy += (d.ty - p.y) * 0.006 + (Math.random() - 0.5) * 0.22;
          p.vx *= 0.9; p.vy *= 0.9;
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.t >= p.life) { kill(p); continue; }
          break;
        }

        default: {
          p.vy += p.g * dt;
          if (p.drag !== 1) { p.vx *= p.drag; p.vy *= p.drag; }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          // 'text' draws its own wobble; adding it here too made the number slide sideways
          if (p.wob && p.kind !== 'text') p.x += Math.sin(p.t * 0.06 + p.ph) * p.wob * 0.35 * dt;
          if (p.grow) p.s += p.grow * dt;
          if (p.spin) p.rot += p.spin * dt;
          if (p.vr) p.rot += p.vr * dt;
          if (p.r !== undefined && p.kind === 'ring') p.r += p.grow * dt;

          if (p.bounce && p.vy > 0 && p.y >= p.floor) {
            p.y = p.floor;
            p.vy *= -p.bounce; p.vx *= 0.7;
            if (p.vr) p.vr *= 0.5;
            if (p.data === 'clink' && p.sfx && Math.abs(p.vy) > 0.5) { sfx(p.sfx); p.sfx = null; }
            if (Math.abs(p.vy) < 0.45) {
              p.vy = 0; p.g = 0; p.bounce = 0; p.vx = 0; p.vr = 0;
              if (p.data === 'wet') { stain(p.x, p.y, rnd(1.6, 3.2), rnd(0.8, 1.6), p.col, 0); }
              if (p.kind === 'blood' || p.kind === 'bead') { kill(p); continue; }
              p.life = Math.min(p.life, p.t + 40);
            }
          }
          if (p.t >= p.life) {
            if (p.kind === 'blood' && p.data === 'wet' && Math.random() < 0.3) {
              stain(p.x, Math.min(FELT + 12, Math.max(120, p.y)), rnd(1.4, 2.6), rnd(0.7, 1.3), p.col, 0);
            }
            const cb = p.onEnd; p.onEnd = null; kill(p);
            if (cb) { try { cb(); } catch (e) {} }
            continue;
          }
        }
      }
    }

    /* stains creep outward a touch, then settle */
    for (let i = 0; i < stains.length; i++) {
      const s = stains[i];
      if (s.grow && s.rx < s.tx) { s.rx += 0.05; s.ry += 0.02; }
    }
  }

  function step() {
    frame++;
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (!lastMs) lastMs = now - 16.67;
    let raw = now - lastMs;
    lastMs = now;
    if (!(raw > 0)) raw = 16.67;
    raw = Math.max(6, Math.min(50, raw));

    /* slow-mo: ease down, hold, ease back */
    if (slow) {
      slow.left -= raw;
      if (slow.left <= 0) { slow = null; ts = 1; }
      else {
        const k = slow.left / slow.total;
        const s = k > 0.85 ? (1 - k) / 0.15 : (k < 0.35 ? k / 0.35 : 1);
        ts = 1 - slow.depth * Math.max(0, Math.min(1, s));
      }
    } else ts = 1;

    ms = raw * ts;
    dt = ms / 16.67;

    if (shakeV > 0) { shakeV *= Math.pow(0.86, dt); if (shakeV < 0.12) shakeV = 0; }
    if (chromaV > 0) { chromaV *= Math.pow(0.84, dt); if (chromaV < 0.08) chromaV = 0; }
    if (flash) { flash.a -= flash.dec * dt; if (flash.a <= 0) flash = null; }
    if (vig) { vig.a -= vig.dec * dt; if (vig.a <= 0) vig = null; }
    if (heart) heartPh += dt;

    ambientStep();
    stepParticles();
    stepTweens(ms);
  }

  /* ================= drawing ================= */

  function alphaOf(p) {
    const u = p.t / p.life;
    if (!p.fade) return p.a;
    const start = 1 - p.fade;
    const k = u <= start ? 1 : Math.max(0, 1 - (u - start) / p.fade);
    return p.a * k;
  }

  function steppedRing(ctx, cx, cy, r, col, col2) {
    if (r < 1) return;
    PIX.ring(ctx, cx, cy, Math.round(r), col);
    if (col2 && r > 3) PIX.ring(ctx, cx, cy, Math.round(r) - 2, col2);
  }

  function drawStar(ctx, p) {
    const late = p.t > p.life * 0.45;
    const r = late ? Math.round(p.r * 0.55) : Math.round(p.r);
    const col = late ? p.col2 : p.col;
    const x = Math.round(p.x), y = Math.round(p.y);
    PIX.rect(ctx, x - r, y - 1, r * 2, 2, col);
    PIX.rect(ctx, x - 1, y - r, 2, r * 2, col);
    for (let i = 1; i <= 3; i++) {                       // stepped diagonals
      const d = Math.round(r * 0.34) * i / 2;
      PIX.rect(ctx, x + d, y + d, 2, 2, col);
      PIX.rect(ctx, x - d - 1, y + d, 2, 2, col);
      PIX.rect(ctx, x + d, y - d - 1, 2, 2, col);
      PIX.rect(ctx, x - d - 1, y - d - 1, 2, 2, col);
    }
    PIX.rect(ctx, x - 2, y - 2, 4, 4, late ? p.col2 : PIX.PAL.W);
  }

  function drawMuzz(ctx, p) {
    const pal = PIX.PAL;
    const k = p.t / p.life;
    const r = k < 0.35 ? 6 + p.t * 3.4 : Math.max(2, 17 - p.t * 1.6);
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    for (let i = 0; i < 8; i++) {                        // stepped petals
      const a = p.ph + (i / 8) * Math.PI * 2 + p.t * 0.24;
      const rr = r * (i % 2 ? 1 : 0.68);
      const px = Math.round(Math.cos(a) * rr), py = Math.round(Math.sin(a) * rr);
      PIX.rect(ctx, px - 1, py - 1, 3, 3, i % 2 ? pal.Y : pal.O);
      PIX.rect(ctx, Math.round(px * 0.5) - 1, Math.round(py * 0.5) - 1, 3, 3, pal.Y);
    }
    /* a lance of flame along the barrel */
    const c = Math.cos(p.rot), s = Math.sin(p.rot);
    for (let i = 1; i <= 5; i++) {
      const w = Math.max(1, 6 - i);
      PIX.rect(ctx, Math.round(c * i * 3) - w / 2, Math.round(s * i * 3) - w / 2, w, w,
        i < 3 ? pal.Y : pal.O);
    }
    PIX.disc(ctx, 0, 0, Math.max(2, r * 0.42), pal.Y);
    PIX.disc(ctx, 0, 0, Math.max(1, r * 0.2), pal.W);
    ctx.restore();
  }

  function drawOne(ctx, p) {
    const pal = PIX.PAL;
    switch (p.kind) {

      case 'ring':
        steppedRing(ctx, p.x, p.y, p.r, p.col, p.col2);
        break;

      case 'star': drawStar(ctx, p); break;

      case 'muzz': drawMuzz(ctx, p); break;

      case 'smoke': {
        const s = Math.max(1, Math.round(p.s));
        PIX.rect(ctx, p.x - s / 2, p.y - s / 2, s, s, p.col);
        break;
      }

      case 'wisp': {
        const s = Math.max(2, Math.round(p.s));
        SPR.ellipse(ctx, p.x, p.y, s, s * 0.5, p.col);
        SPR.ellipse(ctx, p.x + s * 0.6, p.y + 1, s * 0.6, s * 0.3, p.col);
        break;
      }

      case 'spark': {
        PIX.rect(ctx, p.x, p.y, p.s, p.s, p.col);
        if (p.col2) PIX.rect(ctx, p.x - p.vx, p.y - p.vy, 1, 1, p.col2);
        break;
      }

      case 'streak': {
        const len = Math.max(2, Math.round(Math.abs(p.vx) + Math.abs(p.vy)));
        const hx = Math.abs(p.vx) > Math.abs(p.vy);
        PIX.rect(ctx, p.x - (hx ? len / 2 : 0), p.y - (hx ? 0 : len / 2),
          hx ? len : 2, hx ? 2 : len, p.col);
        PIX.rect(ctx, p.x, p.y, 2, 2, p.col2 || p.col);
        break;
      }

      case 'blood': case 'bead': {
        PIX.rect(ctx, p.x, p.y, p.s, p.s, p.col);
        if (p.col2 && p.s > 1) PIX.rect(ctx, p.x, p.y, 1, 1, p.col2);
        break;
      }

      case 'gib': case 'shard': {
        const f = (p.rot * 2) | 0;
        const w = (f & 1) ? p.s + 1 : p.s, h = (f & 1) ? p.s : p.s + 1;
        PIX.rect(ctx, p.x - w / 2, p.y - h / 2, w, h, p.col);
        if (p.col2) PIX.rect(ctx, p.x - w / 2, p.y - h / 2, 1, 1, p.col2);
        break;
      }

      case 'feather': {
        const f = (p.rot * 3) | 0;
        if (f & 1) { PIX.rect(ctx, p.x, p.y, 3, 1, p.col); PIX.rect(ctx, p.x + 1, p.y + 1, 1, 1, p.col2); }
        else { PIX.rect(ctx, p.x, p.y, 1, 3, p.col); PIX.rect(ctx, p.x + 1, p.y + 1, 1, 1, p.col2); }
        break;
      }

      case 'ember': {
        PIX.rect(ctx, p.x, p.y, p.s, p.s, ((p.t * 0.4) | 0) & 1 ? p.col : p.col2);
        break;
      }

      case 'mote': case 'fibre': {
        PIX.rect(ctx, p.x, p.y, p.s, p.s, p.col);
        break;
      }

      case 'fly': {
        PIX.rect(ctx, p.x, p.y, 2, 2, p.col);
        if ((frame & 3) < 2) {
          PIX.rect(ctx, p.x - 1, p.y - 1, 1, 1, p.col2);
          PIX.rect(ctx, p.x + 2, p.y - 1, 1, 1, p.col2);
        }
        break;
      }

      case 'chip': {
        const k = Math.min(1, p.t / Math.max(1, p.life - 24));
        const gy = p.y0 + (p.ty - p.y0) * k;
        const a = ctx.globalAlpha;
        ctx.globalAlpha = a * 0.32;
        SPR.ellipse(ctx, p.x, gy + 1, 4, 1.4, '#050308');
        ctx.globalAlpha = a;
        const sp = Math.abs(Math.cos(p.rot));
        const ry = 1 + sp * 2;
        SPR.ellipse(ctx, p.x, p.y, 4, ry, pal.K);
        SPR.ellipse(ctx, p.x, p.y, 3, Math.max(1, ry - 1), p.col);
        PIX.rect(ctx, p.x - 1, p.y - ry, 2, 1, pal.W);
        break;
      }

      case 'brass': {
        ctx.save();
        ctx.translate(Math.round(p.x), Math.round(p.y));
        ctx.rotate(p.rot);
        PIX.rect(ctx, -3, -1, 6, 3, pal.K);
        PIX.rect(ctx, -2, -1, 4, 2, p.col);
        PIX.rect(ctx, -2, -1, 2, 1, p.col2);
        ctx.restore();
        break;
      }

      case 'card': {
        const k = Math.min(1, p.t / p.life);
        const e = ease.outCubic(k);
        const cx = p.x0 + (p.tx - p.x0) * e;
        const cy = p.y0 + (p.ty - p.y0) * e - Math.sin(Math.PI * k) * p.r;
        const sp = Math.max(0.14, Math.abs(Math.cos(p.rot)));
        const w = Math.max(1, Math.round(p.sprite.width * p.s * sp));
        const h = Math.max(1, Math.round(p.sprite.height * p.s));
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(p.sprite, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
        ctx.restore();
        p.x = cx; p.y = cy;
        break;
      }

      case 'text': {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        const wob = Math.sin(p.t * 0.14 + p.ph) * p.wob;
        ctx.drawImage(p.sprite, Math.round(p.x - p.sprite.width / 2 + wob), Math.round(p.y));
        ctx.restore();
        break;
      }

      case 'drip': {
        PIX.rect(ctx, p.x, p.y0, 1, Math.max(1, p.y - p.y0), p.col2);
        PIX.rect(ctx, p.x - 1, p.y, p.s, p.s + 1, p.col);
        PIX.rect(ctx, p.x - 1, p.y, 1, 1, pal.R);
        break;
      }

      default:
        PIX.rect(ctx, p.x, p.y, p.s, p.s, p.col);
    }
  }

  function drawLayer(ctx, layer) {
    for (let i = 0; i < MAX; i++) {
      const p = pool[i];
      if (!p.live || p.layer !== layer || p.wait > 0) continue;
      const a = alphaOf(p);
      if (a <= 0.02) continue;
      ctx.globalAlpha = a;
      drawOne(ctx, p);
    }
    ctx.globalAlpha = 1;
  }

  let feltFrame = -1;

  function drawFelt(ctx) {
    feltFrame = frame;
    for (let i = 0; i < stains.length; i++) {
      const s = stains[i];
      SPR.ellipse(ctx, s.x, s.y, s.rx * 1.6, s.ry, s.col);
    }
    drawLayer(ctx, 2);
  }

  function draw(ctx, t) {
    drawLayer(ctx, 0);
  }

  function drawFront(ctx, t) {
    if (feltFrame !== frame) drawFelt(ctx);   // integrator never called drawFelt: do it here
    drawLayer(ctx, 1);
  }

  /* ================= screen space ================= */

  function scratchCv(w, h) {
    if (!scratch) scratch = document.createElement('canvas');
    if (scratch.width !== w || scratch.height !== h) { scratch.width = w; scratch.height = h; }
    return scratch;
  }

  function chromaPass(ctx, W, H) {
    const d = Math.max(1, Math.round(chromaV));
    const sc = scratchCv(W, H);
    const s = sc.getContext('2d');
    const a = Math.min(0.4, 0.1 + chromaV * 0.07);
    [[PIX.PAL.R, -d], [PIX.PAL.L, d]].forEach(pair => {
      s.setTransform(1, 0, 0, 1, 0, 0);
      s.globalCompositeOperation = 'source-over';
      s.clearRect(0, 0, W, H);
      s.drawImage(ctx.canvas, 0, 0);
      s.globalCompositeOperation = 'source-in';
      s.fillStyle = pair[0];
      s.fillRect(0, 0, W, H);
      s.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sc, pair[1], 0);
      ctx.restore();
    });
  }

  function radial(ctx, W, H, col) {
    const key = W + 'x' + H + col;
    if (!gradCache) gradCache = {};
    if (!gradCache[key]) {
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, H * 1.05);
      g.addColorStop(0, col + '00');
      g.addColorStop(0.55, col + '55');
      g.addColorStop(1, col + 'ee');
      if (Object.keys(gradCache).length > 8) gradCache = {};
      gradCache[key] = g;
    }
    return gradCache[key];
  }

  function hex(col) {                       // palette letters arrive as #rrggbb already
    return (col && col[0] === '#' && col.length === 7) ? col : '#d13b45';
  }

  function drawScreen(ctx, W, H) {
    if (chromaV > 0.1) chromaPass(ctx, W, H);

    if (vig) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.6, vig.a);
      ctx.fillStyle = radial(ctx, W, H, hex(vig.col));
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    if (heart) {
      const ph = (heartPh % 62) / 62;
      const beat = Math.max(
        Math.max(0, 1 - Math.abs(ph - 0.02) * 9),
        Math.max(0, 1 - Math.abs(ph - 0.22) * 11) * 0.7);
      ctx.save();
      ctx.globalAlpha = 0.16 + beat * 0.24;
      ctx.fillStyle = radial(ctx, W, H, hex(PIX.PAL.d));
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    if (flash) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.85, flash.a);
      ctx.fillStyle = flash.col;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  const screen = {
    shake(mag) { shakeV = Math.max(shakeV, mag || 0); },
    flash(col, a, dec) { flash = { col: col || PIX.PAL.W, a: a === undefined ? 0.5 : a, dec: dec || 0.075 }; },
    vignette(col, a, dec) { vig = { col: col || PIX.PAL.d, a: a === undefined ? 0.8 : a, dec: dec || 0.03 }; },
    heartbeat(on) { heart = !!on; if (!on) heartPh = 0; },
    slowmo(msLen, depth) {
      const total = Math.max(80, msLen || 500);
      slow = { total: total, left: total, depth: Math.max(0.1, Math.min(0.85, depth || 0.6)) };
    },
    chroma(mag) { chromaV = Math.max(chromaV, mag || 0); },
    get shakeMag() { return shakeV; },
  };

  function shakeOffset() {
    if (shakeV <= 0) return { x: 0, y: 0 };
    return { x: (Math.random() - 0.5) * shakeV, y: (Math.random() - 0.5) * shakeV };
  }

  /* ================= lifecycle ================= */

  function reset(keepAmbient) {
    for (let i = 0; i < MAX; i++) { pool[i].live = false; pool[i].onEnd = null; }
    for (const k in counts) counts[k] = 0;
    tweens.length = 0;
    stains = [];
    cursor = 0; frame = 0; lastMs = 0; dt = 1; ms = 16.67;
    ts = 1; slow = null;
    shakeV = 0; chromaV = 0; flash = null; vig = null;
    heart = false; heartPh = 0; feltFrame = -1;
    amb = !!keepAmbient && amb;
  }

  function ambient(on) {
    amb = !!on;
    if (amb) { dust(10); spawnFibre(); spawnFibre(); }
  }

  return {
    /* core */
    reset: reset, step: step, draw: draw, drawFront: drawFront, drawFelt: drawFelt,
    drawScreen: drawScreen, shakeOffset: shakeOffset,
    ease: ease, tween: tween,
    after(msLen, fn) { return tween({ ms: Math.max(1, msLen || 1), onDone: fn }); },
    timeScale() { return ts; },
    dt() { return dt; },
    frame() { return frame; },
    live() { let n = 0; for (let i = 0; i < MAX; i++) if (pool[i].live) n++; return n; },
    counts: counts,
    clearStains() { stains = []; },
    stains() { return stains.length; },

    /* effects */
    smokeRing: smokeRing, cordite: cordite, sparks: sparks,
    bloodBurst: bloodBurst, bloodDrip: bloodDrip, gib: gib,
    chipToss: chipToss, cardFly: cardFly,
    dust: dust, emberDrift: emberDrift, ambient: ambient,
    impactFrame: impactFrame, shockwave: shockwave, floatText: floatText,
    muzzleFlash: muzzleFlash, crit: crit, chipRain: chipRain,
    sweatDrop: sweatDrop, cigarPuff: cigarPuff, featherPuff: featherPuff,
    glassShatter: glassShatter, casing: casing,
    stain: stain,

    /* screen */
    screen: screen,
    FELT: FELT, MAX: MAX,
  };
})();
