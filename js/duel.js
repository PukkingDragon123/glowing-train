'use strict';
/* ============================================================
   SHELL & DEBT — duel.js
   The table, fullscreen over the swirl. One transparent canvas:
   the mark across the felt (face reacting, wounds landing), the
   lamp, the iron, blood on the felt, the fall, the corpse with
   all its parts — and the pockets you go through afterwards.

   World space: 360×200, bottom-anchored and centered on screen
   (ox/oy translate). Everything scales with the window.
   ============================================================ */

const DUEL = {

  W: 360, H: 200, SCALE: 4, OX: 0, OY: 0,
  cv: null, ctx: null, raf: 0, t: 0,

  aim: 'foe',
  busy: true,

  gun: { x: 178, y: 126, rot: 0, flip: false, sc: 1, tx: 178, ty: 126, trot: 0, tsc: 1 },
  fist: { x: 296, y: 170, tx: 296, ty: 170 },
  FY: 180,             // world row where the UI rail starts — the near field's floor
  poseName: 'rest',
  shake: 0, redPulse: 0, whitePulse: 0,
  muzzle: null,
  parts: [],           // {x,y,vx,vy,g,col,life,t,s}
  casings: [],
  decals: [],          // blood on the felt
  wounds: [],          // holes in the mark {x,y,big} (opp pivot space)
  opp: { recoil: 0, flash: 0, fall: -1, gone: false },
  ghost: null,
  youFall: false,

  corpse: false, pool: 0, jiggle: 0,
  oppKey: '', oppCache: {}, exprName: 'neutral', exprTimer: 0,

  /* ---------------- gun poses (world space) ---------------- */

  /* Yours are authored as "where your fist is, and which way the barrel
     points" against the reference floor (FY 180); the iron's own position
     is derived from that so its grip always lands inside your hand. His
     are plain sprite placements across the felt. */
  POSES: {
    rest:     { mine: 1, hx: 294, hy: 172, rot: 0.26, flip: true, sc: 1.5 },
    youFoe:   { mine: 1, hx: 288, hy: 163, rot: 0.58, flip: true, sc: 1.6 },
    youSelf:  { mine: 1, hx: 270, hy: 138, rot: -1.22, flip: true, sc: 1.75 },
    oppYou:   { x: 226, y: 102, rot: 0.34, flip: true, sc: 1.25 },
    oppSelf:  { x: 224, y: 84, rot: -1.15, flip: false, sc: 1.25 },
  },

  /* the sprite's grip sits at local (10, 13) in every iron we draw */
  ironFromGrip(hx, hy, rot, sc, flip) {
    const m = PIX.make(GUN_SPRITES[E.gun().id], 1);
    const lx = (10 - m.width / 2) * sc, ly = (13 - m.height / 2) * sc;
    const fx = flip ? -1 : 1;
    const c = Math.cos(rot), s = Math.sin(rot);
    return { x: hx - (lx * c * fx - ly * s), y: hy - (lx * s * fx + ly * c) };
  },

  setPose(name, snap) {
    const p = DUEL.POSES[name];
    if (!p) return;
    DUEL.poseName = name;
    const g = DUEL.gun, f = DUEL.fist;
    const dy = DUEL.FY - 180;
    const rest = DUEL.POSES.rest;
    let tx = p.x, ty = p.y;
    if (p.mine) {
      f.tx = p.hx; f.ty = p.hy + dy;
      const c = DUEL.ironFromGrip(f.tx, f.ty - 2, p.rot, p.sc, p.flip);
      tx = c.x; ty = c.y;
    } else {
      /* he has the iron — your hand drops back to the felt, empty */
      f.tx = rest.hx; f.ty = rest.hy + dy;
    }
    g.tx = tx; g.ty = ty; g.trot = p.rot; g.tsc = p.sc;
    g.flip = p.flip;
    if (snap) {
      g.x = tx; g.y = ty; g.rot = p.rot; g.sc = p.sc;
      f.x = f.tx; f.y = f.ty;
    }
  },

  /* Where the near field bottoms out. Measured off the UI rail, not the
     window: hard-coding the window's bottom put your own hands behind
     the FIRE button on every phone. */
  measureFloor() {
    let fy = 180;
    const bar = document.getElementById('duel-bottom');
    if (bar) {
      const r = bar.getBoundingClientRect();
      if (r.height > 4) fy = Math.round(r.top / DUEL.SCALE) - DUEL.OY;
    }
    fy = U.clamp(fy, 146, 198);
    if (fy !== DUEL.FY) { DUEL.FY = fy; DUEL.setPose(DUEL.poseName); }
  },

  hurry: false,
  /* a sleep the player can skip by tapping — animations, not decisions */
  sleep(ms) {
    if (DUEL.hurry) ms = Math.min(ms, 60);
    return new Promise(res => {
      const t0 = performance.now();
      const id = setInterval(() => {
        if (performance.now() - t0 >= ms || (DUEL.hurry && performance.now() - t0 >= 60)) {
          clearInterval(id); res();
        }
      }, 16);
    });
  },

  muzzleTip() {
    const g = DUEL.gun;
    const m = PIX.make(GUN_SPRITES[E.gun().id], 1);
    const lx = (m.width / 2) * g.sc, ly = -3 * g.sc;
    const fx = g.flip ? -1 : 1;
    const c = Math.cos(g.rot), s = Math.sin(g.rot);
    return { x: g.x + (lx * c * fx - ly * s), y: g.y + (lx * s * fx + ly * c) };
  },

  /* ================= lifecycle ================= */

  resize() {
    if (!DUEL.cv) return;
    const vw = Math.max(320, window.innerWidth), vh = Math.max(300, window.innerHeight);
    DUEL.SCALE = Math.max(2, Math.round(vh / 210));
    DUEL.W = Math.ceil(vw / DUEL.SCALE);
    DUEL.H = Math.ceil(vh / DUEL.SCALE);
    DUEL.cv.width = DUEL.W;
    DUEL.cv.height = DUEL.H;
    DUEL.OX = Math.round(DUEL.W / 2 - 180);
    DUEL.OY = DUEL.H - 200;
    DUEL.measureFloor();
  },

  enter() {
    DUEL.stop();
    DUEL.aim = 'foe';
    DUEL.busy = true;
    DUEL.parts = []; DUEL.casings = []; DUEL.decals = []; DUEL.wounds = [];
    DUEL.muzzle = null; DUEL.ghost = null;
    DUEL.shake = 0; DUEL.redPulse = 0; DUEL.whitePulse = 0;
    DUEL.opp = { recoil: 0, flash: 0, fall: -1, gone: false };
    DUEL.youFall = false;
    DUEL.corpse = false; DUEL.pool = 0; DUEL.jiggle = 0;
    document.querySelectorAll('.mark-speech, .cop-callout').forEach(n => n.remove());
    DUEL.setPose('rest', true);
    FX.reset(); FX.ambient(true);
    COPS.reset();
    DUEL.buildOpp();

    DUEL.cv = document.getElementById('scene');
    DUEL.ctx = DUEL.cv.getContext('2d');
    DUEL.resize();
    if (!DUEL._resizeHook) {
      DUEL._resizeHook = () => DUEL.resize();
      window.addEventListener('resize', DUEL._resizeHook);
    }
    DUEL.t = 0;
    DUEL.loop();

    if (G.phase === 'loot') {
      DUEL.opp.fall = 1; DUEL.opp.gone = true;
      DUEL.corpse = true; DUEL.pool = 20;
      LOOT.overlay();
    } else {
      DUEL.intro();
    }
  },

  stop() {
    if (DUEL.raf) cancelAnimationFrame(DUEL.raf);
    DUEL.raf = 0;
  },

  loop() {
    DUEL.raf = requestAnimationFrame(() => DUEL.loop());
    DUEL.t++;
    DUEL.step();
    DUEL.draw();
  },

  /* ============ the mark: body + expressive head ============ */

  buildOpp() {
    const opp = G.duel.opp;
    const key = (opp.boss || opp.name) + ':' + G.ante + ':' + G.blind;
    if (DUEL.oppKey !== key) { DUEL.oppKey = key; DUEL.oppCache = {}; }
    DUEL.exprName = DUEL.exprBase();
    DUEL.exprTimer = 0;
  },

  composite(expr) {
    if (DUEL.oppCache[expr]) return DUEL.oppCache[expr];
    const opp = G.duel.opp;
    const key = DUEL.oppKey;
    const body = SPR.bodyCustom(key, opp.def);
    const head = SPR.frogCustom(key, opp.def, expr);
    const hs = 1.5;
    /* size follows the art: the head overlaps the body's collar by NECK px */
    const NECK = 8;
    const hw = Math.round(head.width * hs), hh = Math.round(head.height * hs);
    const W = Math.max(body.width, hw) + 2;
    const H = hh + body.height - NECK;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(body, Math.round((W - body.width) / 2), H - body.height);
    ctx.drawImage(head, Math.round((W - hw) / 2), 0, hw, hh);
    const white = document.createElement('canvas');
    white.width = W; white.height = H;
    const wctx = white.getContext('2d');
    wctx.drawImage(cv, 0, 0);
    wctx.globalCompositeOperation = 'source-in';
    wctx.fillStyle = '#fff';
    wctx.fillRect(0, 0, W, H);
    DUEL.oppCache[expr] = { cv, white };
    return DUEL.oppCache[expr];
  },

  exprBase() {
    const opp = G.duel && G.duel.opp;
    if (!opp || DUEL.opp.fall >= 0) return 'dead';
    if (opp.hp > 0 && opp.hp <= Math.ceil(opp.maxHP / 3)) return 'worry';
    if (opp.def.sweats) return 'worry';
    return 'neutral';
  },

  setExpr(name, frames) {
    DUEL.exprName = name;
    DUEL.exprTimer = frames || 0;
  },

  /* ================= per-frame ================= */

  step() {
    const g = DUEL.gun, f = DUEL.fist;
    const k = 0.22;
    if (DUEL.t % 20 === 0) DUEL.measureFloor();
    g.x += (g.tx - g.x) * k; g.y += (g.ty - g.y) * k;
    g.rot += (g.trot - g.rot) * k; g.sc += (g.tsc - g.sc) * k;
    f.x += (f.tx - f.x) * k; f.y += (f.ty - f.y) * k;
    if (DUEL.shake > 0) DUEL.shake *= 0.86;
    if (DUEL.redPulse > 0) DUEL.redPulse -= 0.03;
    if (DUEL.whitePulse > 0) DUEL.whitePulse -= 0.08;
    if (DUEL.jiggle > 0) DUEL.jiggle *= 0.85;
    if (DUEL.opp.recoil > 0) DUEL.opp.recoil *= 0.85;
    if (DUEL.opp.flash > 0) DUEL.opp.flash -= 0.07;
    if (DUEL.opp.fall >= 0 && DUEL.opp.fall < 1) DUEL.opp.fall = Math.min(1, DUEL.opp.fall + 0.035);
    if (DUEL.exprTimer > 0 && --DUEL.exprTimer === 0) DUEL.exprName = DUEL.exprBase();
    if (DUEL.corpse && DUEL.pool < 26) DUEL.pool += 0.12;
    if (DUEL.muzzle && ++DUEL.muzzle.t > 7) DUEL.muzzle = null;
    if (DUEL.ghost) { DUEL.ghost.y -= 0.55; DUEL.ghost.t++; if (DUEL.ghost.t > 150) DUEL.ghost = null; }
    DUEL.parts = DUEL.parts.filter(p => (p.t++, p.x += p.vx, p.y += p.vy, p.vy += p.g, p.t < p.life));
    DUEL.casings = DUEL.casings.filter(c => {
      c.t++; c.x += c.vx; c.y += c.vy; c.vy += 0.3; c.rot += c.vr;
      if (c.y > 148 && c.vy > 0) { c.y = 148; c.vy *= -0.45; c.vr *= 0.6; if (Math.abs(c.vy) < 0.4) c.vy = 0; }
      return c.t < 120;
    });
    FX.screen.heartbeat(G.phase === 'duel' && G.hearts === 1);
    FX.step();
    COPS.step();
  },

  puff(x, y, n, cols, spread = 1.6, up = -0.8) {
    for (let i = 0; i < n; i++) {
      DUEL.parts.push({
        x, y, t: 0, life: 22 + Math.random() * 26, s: 2,
        vx: (Math.random() - 0.5) * spread, vy: up * Math.random() - 0.2,
        g: -0.008, col: cols[(Math.random() * cols.length) | 0],
      });
    }
  },

  /* pixel blood: a burst in the air, stains on the felt, meat when it's bad */
  blood(x, y, n, meaty) {
    const P = PIX.PAL;
    for (let i = 0; i < n; i++) {
      DUEL.parts.push({
        x, y, t: 0, life: 18 + Math.random() * 22, s: 2,
        vx: (Math.random() - 0.5) * 3.4, vy: -1.8 * Math.random() - 0.4,
        g: 0.14, col: [P.R, P.r, P.d][(Math.random() * 3) | 0],
      });
    }
    if (meaty) {
      for (let i = 0; i < 5; i++) {
        DUEL.parts.push({
          x, y, t: 0, life: 34 + Math.random() * 20, s: 3,
          vx: (Math.random() - 0.5) * 3, vy: -2.4 * Math.random() - 0.6,
          g: 0.16, col: i === 0 ? P.W : [P.d, P.D, P.r][(Math.random() * 3) | 0],
        });
      }
    }
    for (let i = 0; i < Math.ceil(n / 4); i++) {
      DUEL.decals.push({
        x: x + (Math.random() - 0.5) * 44,
        y: 128 + Math.random() * 22,
        r: 1 + Math.random() * 2.2,
        col: Math.random() < 0.5 ? PIX.PAL.d : PIX.PAL.r,
      });
    }
    if (DUEL.decals.length > 48) DUEL.decals.splice(0, DUEL.decals.length - 48);
  },

  /* ================= drawing ================= */

  draw() {
    const x = DUEL.ctx, P = PIX.PAL, W = DUEL.W, H = DUEL.H;
    if (!x) return;
    x.clearRect(0, 0, W, H);                        // the swirl shows through
    x.save();
    x.imageSmoothingEnabled = false;
    const fso = FX.shakeOffset();
    const sx = (Math.random() - 0.5) * DUEL.shake + fso.x, sy = (Math.random() - 0.5) * DUEL.shake + fso.y;
    x.translate(Math.round(DUEL.OX + sx), Math.round(DUEL.OY + sy));

    /* --- lamp cone over the swirl --- */
    const sway = Math.sin(DUEL.t / 90) * 3;
    x.save();
    x.globalAlpha = 0.13;
    x.fillStyle = '#ffd75e';
    x.beginPath();
    x.moveTo(180 + sway, 16 - DUEL.OY); x.lineTo(46 + sway * 2, 152); x.lineTo(314 + sway * 2, 152);
    x.closePath(); x.fill();
    x.globalAlpha = 0.09;
    x.beginPath();
    x.moveTo(180 + sway, 16 - DUEL.OY); x.lineTo(98 + sway * 2, 152); x.lineTo(262 + sway * 2, 152);
    x.closePath(); x.fill();
    x.restore();

    /* --- table shadow, grounding it on the swirl --- */
    x.globalAlpha = 0.35;
    SPR.ellipse(x, 182, 158, 168, 42, '#050308');
    x.globalAlpha = 1;

    FX.draw(x, DUEL.t);

    /* --- the mark, alive or falling --- */
    if (!DUEL.opp.gone) {
      const o = DUEL.opp;
      const comp = DUEL.composite(o.fall >= 0 ? 'dead' : DUEL.exprName);
      const bob = Math.sin(DUEL.t / 34) * 1.4;
      x.save();
      x.translate(180, 130);
      if (o.fall >= 0) {
        const f = o.fall, ease = f * f;
        x.translate(0, ease * 26);
        x.rotate(-ease * 1.9);
        x.globalAlpha = 1 - Math.max(0, f - 0.75) * 4;
      } else {
        x.translate(0, Math.round(bob) + o.recoil * -4);
        x.rotate(o.recoil * 0.06);
      }
      x.drawImage(comp.cv, -comp.cv.width / 2, -comp.cv.height);
      /* wounds where the lead landed */
      DUEL.wounds.forEach(w => {
        PIX.disc(x, w.x, w.y, w.big ? 3 : 2, P.K);
        PIX.disc(x, w.x, w.y, w.big ? 2 : 1, P.D);
        PIX.rect(x, w.x - 1, w.y + (w.big ? 3 : 2), 2, w.big ? 4 : 2, P.d); // run
      });
      if (o.flash > 0) {
        x.globalAlpha = Math.min(1, o.flash);
        x.drawImage(comp.white, -comp.cv.width / 2, -comp.cv.height);
        x.globalAlpha = 1;
      }
      x.restore();
      if (G.duel && G.duel.opp.def.cigar && DUEL.opp.fall < 0 && DUEL.t % 26 === 0) FX.emberDrift(198, 62);
      const opp = G.duel && G.duel.opp;
      if (opp && o.fall < 0 && DUEL.exprName === 'worry' && DUEL.t % 55 === 0) {
        FX.sweatDrop(206, 38);
      }
      if (opp && o.fall < 0) {
        const cols = Math.min(5, opp.maxHP);
        const visR = 180 + DUEL.W / 2 - 4;          // right edge, world space
        const hx = Math.min(248, Math.round(visR - cols * 10));
        for (let i = 0; i < opp.maxHP; i++) {
          const row = Math.floor(i / 5), col = i % 5;
          PIX.draw(x, i < opp.hp ? 'ic_heart' : 'ic_heart_e', hx + col * 10, 26 + row * 9, 1);
        }
      }
    }

    /* --- ghost on the way out --- */
    if (DUEL.ghost) {
      x.save();
      x.globalAlpha = Math.max(0, 0.85 - DUEL.ghost.t / 160) * (0.75 + Math.sin(DUEL.t / 7) * 0.25);
      const gx = DUEL.ghost.x + Math.sin(DUEL.ghost.t / 16) * 4;
      PIX.draw(x, 'ghost_frog', gx, DUEL.ghost.y, 2);
      x.restore();
    }

    COPS.draw(x, DUEL.t);

    /* --- the table: the far half is an ellipse, the near half runs off the
       bottom of the frame, because that is where your own edge of the felt
       actually is when you are sitting at it --- */
    const TY = DUEL.TY();
    SPR.ellipse(x, 180, TY, 164, 38, P.K);
    SPR.ellipse(x, 180, TY - 1, 161, 36, P.b);
    SPR.ellipse(x, 180, TY + 1, 158, 34, P.u);
    SPR.ellipse(x, 180, TY - 2, 154, 32, P.K);
    SPR.ellipse(x, 180, TY - 3, 151, 31, P.e);
    DUEL.nearFelt(x, TY);
    x.globalAlpha = 0.35;
    SPR.ellipse(x, 180, TY - 16, 92, 12, P.f);
    x.globalAlpha = 1;

    /* --- blood on the felt --- */
    DUEL.decals.forEach(d => { SPR.ellipse(x, d.x, d.y, d.r * 1.6, d.r * 0.7, d.col); });
    FX.drawFelt(x);

    /* felt decor: theirs across the table, yours down at the near edge */
    DUEL.chipStack(x, 92, TY + 8, 4, P.r, P.R);
    DUEL.chipStack(x, 104, TY + 12, 2, P.l, P.L);
    DUEL.chipStack(x, 262, TY + 6, 3, P.g, P.G);
    DUEL.myProps(x, DUEL.FY);

    /* --- his hands resting on the felt (over the table edge) --- */
    if (!DUEL.opp.gone && DUEL.opp.fall < 0 && G.duel) {
      const def = G.duel.opp.def;
      /* land the hands exactly where the sleeves end (the sprite tells us) */
      const body = SPR.bodyCustom(DUEL.oppKey, def);
      const w = body.wrist || { dx: def.fat ? 38 : 30, dy: 56, h: 60 };
      const hy = 130 - (w.h - w.dy);
      const hbob = Math.round(Math.sin(DUEL.t / 34) * 0.8);
      /* drum his fingers when it is his turn and he is thinking about it */
      const think = G.duel.turn === 'opp' && !G.duel.over;
      [-1, 1].forEach(sgn => {
        const drum = think ? Math.round(Math.sin(DUEL.t / 5 + sgn) * 0.9) : 0;
        SPR.ellipse(x, 180 + sgn * w.dx, hy + 8 + hbob, 9, 3, 'rgba(0,0,0,.32)');
        SPR.frogHand(x, 180 + sgn * w.dx, hy + hbob + drum, def, sgn, { link: true });
      });
    }

    /* --- the corpse, when it's time to go through him --- */
    if (DUEL.corpse) DUEL.drawCorpse(x);

    /* --- casings --- */
    DUEL.casings.forEach(c => {
      x.save(); x.translate(c.x, c.y); x.rotate(c.rot);
      PIX.rect(x, -2, -1, 5, 2, P.K); PIX.rect(x, -1, -1, 3, 2, P.g);
      x.restore();
    });

    /* --- muzzle flash --- */
    if (DUEL.muzzle) {
      const m = DUEL.muzzle;
      const r = m.t < 3 ? 8 + m.t * 3 : 18 - m.t;
      x.save(); x.translate(m.x, m.y);
      for (let i = 0; i < 7; i++) {
        const a = m.ang + (i / 7) * Math.PI * 2 + m.t * 0.3;
        PIX.rect(x, Math.cos(a) * r - 1, Math.sin(a) * r - 1, 3, 3, i % 2 ? P.Y : P.O);
      }
      PIX.disc(x, 0, 0, Math.max(2, r * 0.45), P.Y);
      x.restore();
    }

    /* --- particles --- */
    DUEL.parts.forEach(p => {
      x.globalAlpha = Math.max(0, 1 - p.t / p.life);
      x.fillStyle = p.col;
      const s = p.s || 2;
      x.fillRect(Math.round(p.x), Math.round(p.y), s, s);
    });
    x.globalAlpha = 1;

    FX.drawFront(x, DUEL.t);

    /* --- you: first person — your hands, your sleeve, your iron --- */
    const myPose = DUEL.drawYou(x);
    DUEL.drawYourIron(x, myPose);

    /* --- the lamp itself --- */
    const lampY = -DUEL.OY;   // hangs from the real top of the screen
    PIX.rect(x, 179 + sway * 0.3, lampY - 2, 2, 10, P.T);
    x.fillStyle = P.K;
    x.beginPath(); x.moveTo(180 + sway, lampY + 5); x.lineTo(162 + sway, lampY + 20); x.lineTo(198 + sway, lampY + 20); x.closePath(); x.fill();
    x.fillStyle = P.g;
    x.beginPath(); x.moveTo(180 + sway, lampY + 8); x.lineTo(165 + sway, lampY + 19); x.lineTo(195 + sway, lampY + 19); x.closePath(); x.fill();
    PIX.rect(x, 176 + sway, lampY + 19, 8, 3, P.Y);

    x.restore();

    /* --- screen-space vignettes --- */
    if (DUEL.redPulse > 0) {
      x.globalAlpha = Math.min(0.55, DUEL.redPulse);
      const grad = x.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 1.05);
      grad.addColorStop(0, 'rgba(209,59,69,0)');
      grad.addColorStop(1, 'rgba(209,59,69,.9)');
      x.fillStyle = grad; x.fillRect(0, 0, W, H);
      x.globalAlpha = 1;
    }
    if (DUEL.whitePulse > 0) {
      x.globalAlpha = Math.min(0.7, DUEL.whitePulse);
      x.fillStyle = '#fff3b0'; x.fillRect(0, 0, W, H);
      x.globalAlpha = 1;
    }

    FX.drawScreen(x, W, H);
    COPS.drawOverlay(x, W, H);
  },

  /* belly-up on the felt: body, lolled head, splayed arm, legs, wounds */
  drawCorpse(x) {
    const P = PIX.PAL;
    const opp = G.duel.opp;
    const key = DUEL.oppKey;
    const body = SPR.bodyCustom(key, opp.def);
    const head = SPR.frogCustom(key, opp.def, 'dead');
    const skin = P[opp.def.skin[0]], shade = P[opp.def.skin[1]];
    const suitCol = opp.def.suit === 'stripes' ? P.t : (P[opp.def.suit] || P.T);
    const jig = DUEL.jiggle * Math.sin(DUEL.t * 1.7);

    /* the pool first — it keeps spreading */
    SPR.ellipse(x, 178, 145, DUEL.pool * 2.6, DUEL.pool * 0.58, P.D);
    SPR.ellipse(x, 174, 144, DUEL.pool * 2.1, DUEL.pool * 0.42, P.d);

    x.save();
    x.translate(190, 132 + jig);
    x.rotate(0.06 + jig * 0.01);

    /* legs kicked out stage-right: trousers + shoes, one leg cocked */
    x.fillStyle = P.K;
    x.beginPath(); x.moveTo(48, -10); x.lineTo(92, -22); x.lineTo(98, -14); x.lineTo(52, -1); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(48, -2); x.lineTo(86, 4); x.lineTo(86, 13); x.lineTo(48, 8); x.closePath(); x.fill();
    x.fillStyle = suitCol;
    x.beginPath(); x.moveTo(49, -8); x.lineTo(90, -20); x.lineTo(94, -14); x.lineTo(51, -3); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(49, -1); x.lineTo(84, 5); x.lineTo(84, 11); x.lineTo(49, 6); x.closePath(); x.fill();
    // shoes
    PIX.rect(x, 90, -26, 12, 7, P.K); PIX.rect(x, 91, -25, 10, 5, P.u); PIX.rect(x, 98, -25, 3, 5, P.U);
    PIX.rect(x, 84, 2, 13, 7, P.K); PIX.rect(x, 85, 3, 11, 5, P.u); PIX.rect(x, 93, 3, 3, 5, P.U);

    /* body lying on its back */
    x.save();
    x.rotate(-Math.PI / 2 + 0.18);
    x.drawImage(body, -body.width / 2 + 24, -20);
    x.restore();

    /* wounds along the torso */
    DUEL.wounds.forEach((w, i) => {
      const wx = -10 + i * 12 + (w.x % 8), wy = -6 + (w.y % 10);
      PIX.disc(x, wx, wy, w.big ? 3 : 2, P.K);
      PIX.disc(x, wx, wy, w.big ? 2 : 1, P.D);
    });

    /* an arm splayed toward you, three fingers open */
    x.fillStyle = P.K;
    x.beginPath(); x.moveTo(-18, 4); x.lineTo(-34, 22); x.lineTo(-26, 28); x.lineTo(-12, 10); x.closePath(); x.fill();
    x.fillStyle = suitCol;
    x.beginPath(); x.moveTo(-17, 6); x.lineTo(-31, 21); x.lineTo(-26, 25); x.lineTo(-13, 10); x.closePath(); x.fill();
    PIX.rect(x, -36, 20, 5, 3, P.W);              // cuff
    PIX.disc(x, -38, 26, 5, P.K);
    PIX.disc(x, -38, 25, 4, skin);
    [[-4, 3], [0, 5], [4, 3]].forEach(([fx, fy]) => {
      PIX.rect(x, -38 + fx - 1, 25 + fy, 2, 4, P.K);
      PIX.rect(x, -38 + fx - 1, 25 + fy, 2, 3, skin);
    });
    if (opp.def.rings) { PIX.rect(x, -41, 24, 2, 2, P.G); PIX.rect(x, -36, 23, 2, 2, P.G); }

    /* dead head lolled at the left end */
    x.save();
    x.translate(-52, -2);
    x.rotate(-0.5);
    x.drawImage(head, -Math.round(head.width * 1.4 / 2), -Math.round(head.height * 1.4 / 2),
      Math.round(head.width * 1.4), Math.round(head.height * 1.4));
    x.restore();
    x.restore();

    /* his hat, knocked clean off */
    if (opp.def.hat || opp.def.flatcap) {
      SPR.ellipse(x, 268, 132, 12, 4, P.K);
      SPR.ellipse(x, 268, 131, 10, 3, P.T);
      PIX.disc(x, 268, 127, 6, P.K);
      PIX.disc(x, 268, 128, 5, P.T);
    }

    /* flies */
    for (let i = 0; i < 3; i++) {
      const a = DUEL.t / (14 + i * 3) + i * 2.1;
      const fx = 180 + Math.cos(a) * (18 + i * 9) + Math.sin(DUEL.t / 7 + i) * 2;
      const fy = 116 + Math.sin(a * 1.3) * 8;
      PIX.rect(x, fx, fy, 2, 2, P.K);
      if (DUEL.t % 4 < 2) { PIX.rect(x, fx - 1, fy - 1, 1, 1, P.q); PIX.rect(x, fx + 2, fy - 1, 1, 1, P.q); }
    }
  },

  /* ============================================================
     FIRST PERSON. You are not on screen — you ARE the camera. What
     you see of yourself is your own two hands on the near edge of
     the felt and your sleeve coming in from the bottom of the frame,
     with the iron in your right hand. Aim at yourself and the barrel
     swings back at the lens.
     ============================================================ */
  /* the table's centre row. It follows the UI rail so the near edge always
     lands in shot, but never so far up that the felt eats the mark's hands. */
  TY() { return U.clamp(DUEL.FY - 26, 138, 158); },

  /* Your end of the felt. The near edge of a round table dips TOWARD the
     lens, so the felt runs off the bottom of the frame in the middle and the
     rail only shows in the two corners — which is where it actually is.
     One parabola, filled outward, five bands wide. */
  nearFelt(x, TY) {
    const P = PIX.PAL;
    const R = 151, yc = DUEL.FY + 72, fall = yc - TY;
    const bot = DUEL.H - DUEL.OY + 2;
    const span = (y, w, col) => PIX.rect(x, 180 - w, y, w * 2, 1, col);
    for (let y = TY - 2; y <= bot; y++) {
      const k = (yc - y) / fall;
      if (k <= 0) break;
      const hf = Math.round(R * Math.sqrt(k));
      const t = (y - TY) / Math.max(1, bot - TY);
      span(y, hf + 11, P.K);
      span(y, hf + 10, P.u);                              // roll of the rail
      span(y, hf + 7, P.b);                               // its lit top
      span(y, hf + 1, P.K);
      /* the felt goes off toward you: the lamp does not reach this end */
      span(y, hf, t < 0.26 ? P.e : t < 0.50 ? P.E : t < 0.72 ? '#0b2318' : '#071810');
      if (y % 2 === 0 && t > 0.20 && t < 0.30) span(y, hf, P.E);
      if (y % 2 === 0 && t > 0.44 && t < 0.56) span(y, hf, '#0b2318');
      if (y % 2 === 0 && t > 0.66 && t < 0.78) span(y, hf, '#071810');
    }
    /* brass tacks punched through the rail, y solved off the same parabola */
    for (const u of [-146, -114, -76, -38, 38, 76, 114, 146]) {
      const y = Math.round(yc - fall * (u / R) * (u / R)) + 3;
      PIX.rect(x, 180 + u - 1, y, 3, 3, P.h);
      PIX.rect(x, 180 + u - 1, y, 2, 2, P.G);
    }
  },

  /* what's sitting on YOUR end of the felt: the reason the near field isn't
     an empty green void */
  myProps(x, FY) {
    const P = PIX.PAL;
    /* your glass, half drunk, a damp ring under it */
    const gx = 116, gy = FY - 24;
    SPR.ellipse(x, gx + 1, gy + 6, 9, 3, 'rgba(0,0,0,.40)');
    PIX.rect(x, gx - 7, gy - 13, 15, 19, P.K);
    PIX.rect(x, gx - 6, gy - 12, 13, 17, P.t);                 // glass, catching the room
    PIX.rect(x, gx - 6, gy - 2, 13, 7, P.h);                   // what's left in it
    PIX.rect(x, gx - 6, gy - 2, 13, 1, P.G);
    PIX.rect(x, gx - 6, gy - 12, 3, 16, P.S);                  // the highlight down one side
    PIX.rect(x, gx + 4, gy - 10, 2, 13, 'rgba(244,239,224,.35)');
    PIX.rect(x, gx - 6, gy - 12, 13, 1, P.M);                  // the rim
    SPR.ellipse(x, gx, gy + 5, 7, 2, P.k);

    /* the ashtray, your cigar still going in it */
    const ax = 240, ay = FY - 22;
    SPR.ellipse(x, ax, ay + 2, 14, 5, P.K);
    SPR.ellipse(x, ax, ay + 1, 12, 4, P.t);
    SPR.ellipse(x, ax, ay - 1, 9, 3, P.T);
    PIX.rect(x, ax + 3, ay - 6, 12, 3, P.K);
    PIX.rect(x, ax + 4, ay - 5, 10, 2, P.w);
    PIX.rect(x, ax + 12, ay - 5, 2, 2, DUEL.t % 34 < 22 ? P.O : P.o);
    if (DUEL.t % 30 === 0) FX.emberDrift(ax + 13, ay - 7);
  },

  /* your own frog, one step darker: the near field is outside the lamp */
  myDef() {
    if (!DUEL._myDef) {
      DUEL._myDef = Object.assign({}, FROG_DEFS.player, {
        skin: ['f', 'e', 'E'], cuff: 'w', rings: false,
      });
    }
    return DUEL._myDef;
  },

  drawYou(x) {
    const P = PIX.PAL;
    const def = DUEL.myDef();
    const FY = DUEL.FY, f = DUEL.fist;
    const bob = Math.sin(DUEL.t / 40 + 2) * 0.8;
    const drop = DUEL.youFall ? 30 : 0;
    const aimSelf = DUEL.aim === 'self' && !DUEL.corpse;
    const aimFoe = DUEL.aim === 'foe' && !DUEL.corpse;
    const mine = !!(DUEL.POSES[DUEL.poseName] || {}).mine;

    x.save();
    x.translate(0, Math.round(bob) + drop);
    if (DUEL.youFall) x.rotate(-0.04);

    /* your hearts, on your own end of the felt */
    const mx = E.maxHP(), thr = G.hearts === 1 && DUEL.t % 40 < 20 ? 1 : 0;
    for (let i = 0; i < mx; i++) {
      const row = (i / 5) | 0, col = i % 5;
      PIX.draw(x, i < G.hearts ? 'ic_heart' : 'ic_heart_e',
        8 + col * 10 - (i ? 0 : thr), FY - 47 + row * 9 - (i ? 0 : thr), 1 + (i ? 0 : thr * 0.25));
    }

    /* Your forearms: short stubs rising out of the BOTTOM of the frame, the
       way your own arms actually sit at a table. Run them in from the side
       edges instead and they read as concrete beams. Dark suit cloth with a
       rim light and a pinstripe, or they vanish into the felt. */
    const sC = P.T, sD = P.k, sL = P.t, sS = 'rgba(100,109,132,.34)';
    const HK = 1.7;

    /* --- your off hand, flat on your own end of the felt --- */
    const lhx = 76, lhy = FY - 12;
    SPR.ellipse(x, lhx + 3, FY - 2, 17, 5, 'rgba(0,0,0,.45)');
    SPR.povSleeve(x, 42, FY + 24, lhx - 3, FY - 2, 30, 20, sC, sD, sL, sS);
    SPR.povCuff(x, lhx, FY - 4, def, -1);
    SPR.povHand(x, lhx, lhy, def, -1, HK, false);

    /* --- your gun hand --- */
    const fx = Math.round(f.x), fy = Math.round(f.y);
    SPR.ellipse(x, fx, fy + 12, 16, 5, 'rgba(0,0,0,.42)');
    SPR.povSleeve(x, 330, FY + 24, fx - 3, fy + 8, 32, 21, sC, sD, sL, sS);
    SPR.povCuff(x, fx, fy + 8, def, 1);
    SPR.povHand(x, fx, fy, def, 1, HK, mine);

    x.restore();
    return { aimSelf, aimFoe, mine, bob: Math.round(bob) + drop };
  },

  /* the iron, drawn from your point of view — the fingers close over it after */
  drawYourIron(x, pose) {
    if (!pose || DUEL.corpse) return;
    const P = PIX.PAL;
    const g = DUEL.gun, f = DUEL.fist;
    const gm = PIX.make(GUN_SPRITES[E.gun().id], 1);
    x.save();
    x.translate(0, pose.mine ? pose.bob : 0);
    x.save();
    x.translate(Math.round(g.x), Math.round(g.y));
    x.rotate(g.rot);
    if (g.flip) x.scale(-1, 1);
    x.drawImage(gm, -gm.width / 2 * g.sc, -gm.height / 2 * g.sc, gm.width * g.sc, gm.height * g.sc);
    if (G.duel && G.duel.sawArmed) {
      x.globalAlpha = 0.5 + Math.sin(DUEL.t / 5) * 0.3;
      PIX.rect(x, gm.width / 2 * g.sc - 12, -gm.height / 2 * g.sc + 2, 12, 5, P.O);
      x.globalAlpha = 1;
    }
    x.restore();
    /* two digits closed over the grip, so the iron is held and not glued on */
    if (pose.mine) {
      const c = SPR.povInk ? null : null;
      const d = DUEL.myDef(), skin = P[d.skin[0]], sh = P[d.skin[1]];
      for (let i = 0; i < 2; i++) {
        const gy = Math.round(f.y) - 5 + i * 7;
        PIX.rect(x, Math.round(f.x) - 5, gy, 13, 7, P.K);
        PIX.rect(x, Math.round(f.x) - 4, gy + 1, 11, 5, i ? sh : skin);
        PIX.rect(x, Math.round(f.x) - 4, gy + 4, 11, 1, P.K);
      }
    }
    x.restore();
    /* pointed at the lens: a bore seen end-on, staring back at you */
    if (pose.aimSelf) {
      const t = DUEL.muzzleTip();
      const ty = t.y + pose.bob;
      PIX.disc(x, t.x, ty, 9, P.K);
      PIX.disc(x, t.x, ty, 7, P.t);
      PIX.disc(x, t.x, ty, 5, P.K);
      PIX.disc(x, t.x, ty, 3, P.Z);
      PIX.rect(x, t.x - 6, ty - 6, 4, 1, 'rgba(255,255,255,.22)');
      PIX.rect(x, t.x - 7, ty - 4, 2, 3, 'rgba(255,255,255,.12)');
    }
  },

  /* the mark says something — a pixel bubble pinned over his head */
  say(text, boss) {
    if (!text) return;
    const holder = document.getElementById('scene-holder');
    if (!holder) return;
    holder.querySelectorAll('.mark-speech').forEach(n => n.remove());
    const sp = U.el('div', 'mark-speech flip' + (boss ? ' shout' : ''));
    sp.textContent = text;
    sp.appendChild(U.el('i', 'sp-tail'));
    /* world (196, 88) is just off his mouth */
    sp.style.setProperty('--sx', Math.round((DUEL.OX + 196) * DUEL.SCALE) + 'px');
    sp.style.setProperty('--sy', Math.round((DUEL.OY + 88) * DUEL.SCALE) + 'px');
    holder.appendChild(sp);
    setTimeout(() => { sp.classList.add('out'); setTimeout(() => sp.remove(), 300); }, 2100);
  },

  /* pick a line for whatever just happened */
  taunt(ev) {
    if (typeof TAUNT !== 'function' || !G.duel || G.duel.over) return;
    const R = Math.random;
    let line = null;
    if (ev.reloaded) line = TAUNT(R, 'reload');
    else if (ev.by === 'opp' && !ev.live && ev.target === 'self') line = TAUNT(R, 'afterSelfBlank');
    else if (ev.by === 'opp' && ev.victim === 'you') line = TAUNT(R, 'afterHittingYou');
    else if (ev.by === 'you' && !ev.live && ev.target === 'self') line = TAUNT(R, 'afterYouSelfBlank');
    else if (G.duel.opp.hp === 1 && R() < 0.4) line = TAUNT(R, 'lowHearts');
    if (line) DUEL.say(line, !!G.duel.opp.boss);
  },

  hearts(x, hx, hy, hp, max, throb) {
    for (let i = 0; i < max; i++) {
      const s = throb && i === 0 ? 1 : 0;
      PIX.draw(x, i < hp ? 'ic_heart' : 'ic_heart_e', hx + i * 10 - s, hy - s, 1 + (s ? 0.25 : 0));
    }
  },

  chipStack(x, cx, cy, n, colA, colB) {
    const P = PIX.PAL;
    for (let i = 0; i < n; i++) {
      SPR.ellipse(x, cx, cy - i * 3, 7, 2.6, P.K);
      SPR.ellipse(x, cx, cy - 1 - i * 3, 6, 2, i % 2 ? colA : colB);
    }
  },

  /* ================= sequences ================= */

  async intro() {
    const opp = G.duel.opp;
    UI.syncDuel();
    if (opp.boss) {
      await UI.bossIntro(opp);
    } else {
      UI.blindBanner();
      await U.sleep(1050);
    }
    SFX.spin();
    await UI.loadBanner();
    DUEL.busy = false;
    UI.syncDuel();
  },

  setAim(a) {
    if (DUEL.busy || G.phase !== 'duel') return;
    if (DUEL.aim !== a) SFX.chak();
    DUEL.aim = a;
    DUEL.setPose(a === 'foe' ? 'youFoe' : 'youSelf');
    UI.syncDuel();
  },

  async onFire() {
    if (DUEL.busy || G.phase !== 'duel' || G.duel.over || G.duel.turn !== 'you') return;
    DUEL.busy = true;
    DUEL.hurry = false;
    DUEL.setPose(DUEL.aim === 'foe' ? 'youFoe' : 'youSelf');
    await DUEL.sleep(160);
    SFX.chak();
    await DUEL.sleep(150);
    const ev = E.pull(DUEL.aim);
    await DUEL.playShot(ev);
    await DUEL.afterPull(ev);
  },

  async playShot(ev) {
    const tip = DUEL.muzzleTip();
    if (ev.live) {
      SFX.shot();
      FX.muzzleFlash(tip.x, tip.y, DUEL.gun.rot + (DUEL.gun.flip ? Math.PI : 0));
      FX.casing(DUEL.gun.x, DUEL.gun.y - 6, DUEL.gun.flip ? -1 : 1);
      FX.smokeRing(tip.x, tip.y, DUEL.gun.flip ? -1 : 1);
      FX.cordite(tip.x, tip.y, 8);
      FX.screen.shake(ev.dmg >= 2 ? 16 : 10);
      FX.screen.flash(PIX.PAL.Y, 0.45);
      if (ev.fizzled) {
        await U.sleep(160);
        UI.stampBig('FIZZLE', PIX.PAL.N); SFX.dud();
      } else if (ev.victim === 'foe') {
        DUEL.opp.recoil = 1; DUEL.opp.flash = 1;
        DUEL.setExpr('pain', 55);
        if (ev.dmg >= 2) {
          FX.crit(180, 62, 'CRUNCH');
          FX.screen.slowmo(650);
        } else {
          FX.bloodBurst(180, 62, 1.2);
          FX.impactFrame(180, 62);
          FX.shockwave(180, 62);
          FX.screen.chroma(2);
        }
        FX.floatText(180, 44, '-' + ev.dmg, PIX.PAL.R);
        DUEL.wounds.push({
          x: (Math.random() - 0.5) * 26,
          y: -46 - Math.random() * 34,
          big: ev.dmg >= 2,
        });
        UI.stampBig(ev.dmg >= 2 ? '-' + ev.dmg + ' CRUNCH' : 'HIT', PIX.PAL.R);
        SFX.hurt();
      } else if (ev.victim === 'you') {
        FX.screen.vignette(PIX.PAL.d, 0.95);
        FX.screen.chroma(3);
        FX.screen.shake(13);
        if (ev.by === 'opp') DUEL.setExpr('grin', 80);
        FX.bloodBurst(60, 160, 1.6, -Math.PI / 2.4);
        FX.bloodDrip(58, 168, 190);
        UI.flash('go-back');
        UI.stampBig('-' + ev.dmg, PIX.PAL.R);
        SFX.hurt();
      }
    } else {
      SFX.dud();
      FX.cordite(tip.x, tip.y, 5);
      UI.stampBig('click', PIX.PAL.w, true);
      if (ev.by === 'opp' && ev.target === 'self') DUEL.setExpr('smug', 60);
      if (ev.by === 'you' && ev.target === 'foe' && !ev.croakHeal) DUEL.setExpr('smug', 45);
      if (ev.croakHeal) { DUEL.setExpr('grin', 60); await U.sleep(240); UI.stampBig('HE SWALLOWS IT', PIX.PAL.F); }
    }
    if (ev.rosary) { await U.sleep(300); UI.stampBig('THE ROSARY CRUMBLES', PIX.PAL.G); SFX.bank(); }
    if (ev.chips) UI.chipTick(ev.chips);
    if (ev.tonyTax) UI.chipTick(-1);
    UI.syncDuel();
    await DUEL.sleep(ev.live ? 500 : 380);
  },

  async afterPull(ev) {
    if (ev.over === 'win') { await DUEL.killSequence(); return; }
    if (ev.over === 'loss') { await DUEL.deathSequence(); return; }
    DUEL.taunt(ev);

    if (ev.revived) {
      await DUEL.sleep(300);
      DUEL.shake = 12; SFX.backfire();
      DUEL.oppCache = {};
      DUEL.wounds = [];             // phase two: he shakes the lead out
      DUEL.setExpr('angry', 240);
      UI.stampBig('HE GETS BACK UP', PIX.PAL.V);
      await DUEL.sleep(800);
      UI.syncDuel();
    }
    if (ev.shuffled) { SFX.spin(); UI.stampSmall('SHUFFLED'); }
    if (ev.reloaded) {
      SFX.spin();
      await UI.loadBanner();
    }
    if (ev.extraTurn && ev.by === 'you') {
      UI.stampSmall(ev.tommyShot ? 'DOUBLE TAP' : 'AGAIN');
    }
    if (ev.cuffSkip) { UI.stampSmall('CUFFED — YOUR PULL'); SFX.jamSfx(); }

    UI.syncDuel();
    if (G.duel.turn === 'opp') {
      await DUEL.oppLoop();
    } else {
      DUEL.setPose(DUEL.aim === 'foe' ? 'youFoe' : 'youSelf');
      DUEL.busy = false;
      UI.syncDuel();
    }
  },

  async oppLoop() {
    while (G.phase === 'duel' && !G.duel.over && G.duel.turn === 'opp') {
      DUEL.setPose('rest');
      DUEL.hurry = false;
      UI.syncDuel();
      await DUEL.sleep(380 + Math.random() * 320);
      const choice = E.oppDecide();
      DUEL.setPose(choice === 'foe' ? 'oppYou' : 'oppSelf');
      if (choice === 'self') DUEL.setExpr('worry', 70);
      await DUEL.sleep(300);
      SFX.chak();
      await DUEL.sleep(200 + Math.random() * 220);
      const ev = E.pull(choice);
      await DUEL.playShot(ev);
      if (ev.over === 'win') { await DUEL.killSequence(); return; }
      if (ev.over === 'loss') { await DUEL.deathSequence(); return; }
      if (ev.shuffled) { SFX.spin(); UI.stampSmall('SHUFFLED'); }
      if (ev.reloaded) { SFX.spin(); await UI.loadBanner(); }
      if (ev.extraTurn) { UI.stampSmall('HE GOES AGAIN'); await DUEL.sleep(140); }
      UI.syncDuel();
    }
    if (G.phase === 'duel' && !G.duel.over) {
      DUEL.setPose(DUEL.aim === 'foe' ? 'youFoe' : 'youSelf');
      DUEL.busy = false;
      UI.syncDuel();
    }
  },

  /* the mark dies → the corpse is yours */
  async killSequence() {
    DUEL.setPose('rest');
    await U.sleep(350);
    DUEL.opp.fall = 0;
    FX.bloodBurst(180, 88, 3);
    FX.gib(180, 88, 6);
    FX.screen.shake(16);
    FX.screen.slowmo(900, 0.65);
    SFX.lose(); SFX.cluck();
    await U.sleep(750);
    DUEL.ghost = { x: 168, y: 60, t: 0 };
    SFX.tone && SFX.tone(880, 0.4, 'sine', 0.08, 0, 400);
    DUEL.opp.gone = true;
    DUEL.corpse = true;
    DUEL.pool = 4;
    await U.sleep(700);
    LOOT.overlay();
  },

  /* you die */
  async deathSequence() {
    FX.screen.vignette(PIX.PAL.d, 1.1, 0.02);
    FX.screen.chroma(4);
    FX.screen.slowmo(1200, 0.7);
    UI.flash('go-back');
    SFX.backfire();
    await U.sleep(500);
    DUEL.youFall = true;
    SFX.lose();
    await U.sleep(1100);
    META.check();
    UI.render();
  },

  /* loot fx: the corpse jiggles, the take flies out of it */
  lootFx(pocket) {
    DUEL.jiggle = 3;
    const P = PIX.PAL;
    if (pocket.id === 'tooth') {
      FX.bloodBurst(150, 124, 1.5);
      FX.gib(150, 124, 3);
      FX.chipToss(150, 120, 60, 100, 1, PIX.PAL.G);
      SFX.hurt();
    }
    if (pocket.chips > 0) FX.chipToss(175, 128, 60, 100, Math.min(10, pocket.chips + 1), PIX.PAL.G);
    if (pocket.gun) { FX.screen.flash(PIX.PAL.W, 0.6); FX.chipRain(14); SFX.jackpot(); }
    SFX.coin();
  },

  useTrinket: null,

  useGunActive(kind) {
    if (DUEL.busy) return;
    const ev = E.useGun(kind);
    if (!ev) return;
    if (ev.type === 'saw') { SFX.jamSfx(); UI.stampSmall('SAWED — NEXT SHOT ×2'); }
    else { SFX.chak(); UI.stampSmall('DOUBLE TAP READY'); }
    UI.syncDuel();
  },

  /* tap the mark to aim at him, tap again to FIRE; same for yourself.
     any tap during an animation fast-forwards it. */
  sceneClick(e) {
    if (G.phase !== 'duel') return;
    if (DUEL.busy) { DUEL.hurry = true; return; }
    const r = DUEL.cv.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width * DUEL.W - DUEL.OX;
    const py = (e.clientY - r.top) / r.height * DUEL.H - DUEL.OY;
    if (px > 100 && px < 262 && py < 130) {
      if (DUEL.aim === 'foe') DUEL.onFire();
      else DUEL.setAim('foe');
    } else if (py > DUEL.FY - 46) {           /* your own end of the felt */
      if (DUEL.aim === 'self') DUEL.onFire();
      else DUEL.setAim('self');
    }
  },
};

DUEL.useTrinket = async function (i) {
  if (DUEL.busy || !E.canUseTrinket(i)) return;
  const ev = E.useTrinket(i);
  if (!ev) return;
  switch (ev.type) {
    case 'heal':
      SFX.bank(); UI.stampSmall('+1 HEART');
      FX.sparks(24, 122, 8, 1.2);
      FX.floatText(28, 112, '+1', PIX.PAL.R);
      break;
    case 'eject': {
      SFX.jamSfx();
      UI.stampSmall(ev.live ? 'RACKED — LIVE' : 'RACKED — blank');
      DUEL.casings.push({ x: 180, y: 118, vx: 1.5, vy: -2.5, vr: 0.3, rot: 0, t: 0 });
      if (ev.reloaded) { SFX.spin(); await UI.loadBanner(); }
      break;
    }
    case 'peek':
      SFX.click(); UI.stampSmall(ev.live ? 'CHAMBERED: LIVE' : 'CHAMBERED: blank');
      break;
    case 'cuffs':
      SFX.chak(); UI.stampSmall('CUFFED');
      DUEL.setExpr('angry', 90);
      break;
    case 'mirror':
      SFX.spin(); DUEL.whitePulse = 0.5;
      UI.stampSmall(ev.live ? 'FLIPPED: LIVE' : 'FLIPPED: blank');
      break;
  }
  UI.syncDuel();
};
