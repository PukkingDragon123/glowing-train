'use strict';
/* ============================================================
   SHELL & DEBT — duel.js
   The table. A drawn casino scene on one canvas: the mark
   across the felt (with a face that reacts), the lamp, the
   iron, muzzle flash, casings, blood on the felt, the fall,
   the ghost — and afterwards, the corpse you go through.
   ============================================================ */

const DUEL = {

  /* logical scene size — CSS scales it up, pixelated */
  W: 360, H: 200,
  cv: null, ctx: null, raf: 0, t: 0,

  aim: 'foe',
  busy: true,          // input lock (intro, animations, his turn)

  /* animated things */
  gun: { x: 178, y: 126, rot: 0, flip: false, sc: 1, tx: 178, ty: 126, trot: 0, tsc: 1 },
  shake: 0, redPulse: 0, whitePulse: 0,
  muzzle: null,        // {x, y, ang, t}
  parts: [],           // pixels flying around {x,y,vx,vy,g,col,life,t}
  casings: [],
  decals: [],          // blood on the felt {x,y,r,col}
  opp: { recoil: 0, flash: 0, fall: -1, gone: false },
  ghost: null,         // {x, y, t}
  youFall: false,

  corpse: false, pool: 0, jiggle: 0,
  oppKey: '', oppCache: {}, exprName: 'neutral', exprTimer: 0,

  /* ---------------- gun poses ---------------- */

  POSES: {
    rest:     { x: 178, y: 126, rot: 0, flip: false, sc: 1 },
    youFoe:   { x: 128, y: 148, rot: -0.62, flip: false, sc: 1.45 },
    youSelf:  { x: 108, y: 168, rot: 0.28, flip: true, sc: 1.45 },
    oppYou:   { x: 226, y: 102, rot: 0.34, flip: true, sc: 1.2 },
    oppSelf:  { x: 224, y: 84, rot: -1.15, flip: false, sc: 1.2 },
  },

  setPose(name, snap) {
    const p = DUEL.POSES[name];
    const g = DUEL.gun;
    g.tx = p.x; g.ty = p.y; g.trot = p.rot; g.tsc = p.sc;
    g.flip = p.flip;
    if (snap) { g.x = p.x; g.y = p.y; g.rot = p.rot; g.sc = p.sc; }
  },

  /* muzzle tip in world coords for the current gun transform */
  muzzleTip() {
    const g = DUEL.gun;
    const m = PIX.make(GUN_SPRITES[E.gun().id], 1);
    const lx = (m.width / 2) * g.sc, ly = -2 * g.sc;
    const fx = g.flip ? -1 : 1;
    const c = Math.cos(g.rot), s = Math.sin(g.rot);
    return { x: g.x + (lx * c * fx - ly * s), y: g.y + (lx * s * fx + ly * c) };
  },

  /* ================= lifecycle ================= */

  enter() {
    DUEL.stop();
    DUEL.aim = 'foe';
    DUEL.busy = true;
    DUEL.parts = []; DUEL.casings = []; DUEL.decals = [];
    DUEL.muzzle = null; DUEL.ghost = null;
    DUEL.shake = 0; DUEL.redPulse = 0; DUEL.whitePulse = 0;
    DUEL.opp = { recoil: 0, flash: 0, fall: -1, gone: false };
    DUEL.youFall = false;
    DUEL.corpse = false; DUEL.pool = 0; DUEL.jiggle = 0;
    DUEL.setPose('rest', true);
    DUEL.buildOpp();

    DUEL.cv = document.getElementById('scene');
    DUEL.ctx = DUEL.cv.getContext('2d');
    DUEL.t = 0;
    DUEL.loop();

    if (G.phase === 'loot') {           // re-entering mid-loot (fresh render)
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

  /* seated composite (body + head at expr), cached per expression */
  composite(expr) {
    if (DUEL.oppCache[expr]) return DUEL.oppCache[expr];
    const opp = G.duel.opp;
    const key = DUEL.oppKey;
    const body = SPR.bodyCustom(key, opp.def);
    const head = SPR.frogCustom(key, opp.def, expr);
    const hs = 1.5;
    const W = 112, H = 110;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(body, (W - body.width) / 2, H - body.height);
    ctx.drawImage(head, Math.round((W - head.width * hs) / 2), 0,
      Math.round(head.width * hs), Math.round(head.height * hs));
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
    const g = DUEL.gun;
    const k = 0.22;
    g.x += (g.tx - g.x) * k; g.y += (g.ty - g.y) * k;
    g.rot += (g.trot - g.rot) * k; g.sc += (g.tsc - g.sc) * k;
    if (DUEL.shake > 0) DUEL.shake *= 0.86;
    if (DUEL.redPulse > 0) DUEL.redPulse -= 0.03;
    if (DUEL.whitePulse > 0) DUEL.whitePulse -= 0.08;
    if (DUEL.jiggle > 0) DUEL.jiggle *= 0.85;
    if (DUEL.opp.recoil > 0) DUEL.opp.recoil *= 0.85;
    if (DUEL.opp.flash > 0) DUEL.opp.flash -= 0.07;
    if (DUEL.opp.fall >= 0 && DUEL.opp.fall < 1) DUEL.opp.fall = Math.min(1, DUEL.opp.fall + 0.035);
    if (DUEL.exprTimer > 0 && --DUEL.exprTimer === 0) DUEL.exprName = DUEL.exprBase();
    if (DUEL.corpse && DUEL.pool < 24) DUEL.pool += 0.12;
    if (DUEL.muzzle && ++DUEL.muzzle.t > 7) DUEL.muzzle = null;
    if (DUEL.ghost) { DUEL.ghost.y -= 0.55; DUEL.ghost.t++; if (DUEL.ghost.t > 150) DUEL.ghost = null; }
    DUEL.parts = DUEL.parts.filter(p => (p.t++, p.x += p.vx, p.y += p.vy, p.vy += p.g, p.t < p.life));
    DUEL.casings = DUEL.casings.filter(c => {
      c.t++; c.x += c.vx; c.y += c.vy; c.vy += 0.3; c.rot += c.vr;
      if (c.y > 148 && c.vy > 0) { c.y = 148; c.vy *= -0.45; c.vr *= 0.6; if (Math.abs(c.vy) < 0.4) c.vy = 0; }
      return c.t < 120;
    });
  },

  puff(x, y, n, cols, spread = 1.6, up = -0.8) {
    for (let i = 0; i < n; i++) {
      DUEL.parts.push({
        x, y, t: 0, life: 22 + Math.random() * 26,
        vx: (Math.random() - 0.5) * spread, vy: up * Math.random() - 0.2,
        g: -0.008, col: cols[(Math.random() * cols.length) | 0],
      });
    }
  },

  /* pixel blood: a burst in the air, stains on the felt */
  blood(x, y, n) {
    const P = PIX.PAL;
    for (let i = 0; i < n; i++) {
      DUEL.parts.push({
        x, y, t: 0, life: 18 + Math.random() * 22,
        vx: (Math.random() - 0.5) * 3.2, vy: -1.6 * Math.random() - 0.4,
        g: 0.14, col: [P.R, P.r, P.d][(Math.random() * 3) | 0],
      });
    }
    for (let i = 0; i < Math.ceil(n / 4); i++) {
      DUEL.decals.push({
        x: x + (Math.random() - 0.5) * 44,
        y: 128 + Math.random() * 22,
        r: 1 + Math.random() * 2.2,
        col: Math.random() < 0.5 ? PIX.PAL.d : PIX.PAL.r,
      });
    }
    if (DUEL.decals.length > 40) DUEL.decals.splice(0, DUEL.decals.length - 40);
  },

  /* ================= drawing ================= */

  draw() {
    const x = DUEL.ctx, P = PIX.PAL, W = DUEL.W, H = DUEL.H;
    if (!x) return;
    x.save();
    x.imageSmoothingEnabled = false;
    const sx = (Math.random() - 0.5) * DUEL.shake, sy = (Math.random() - 0.5) * DUEL.shake;
    x.translate(Math.round(sx), Math.round(sy));

    /* --- the room --- */
    x.fillStyle = '#0b0916'; x.fillRect(-8, -8, W + 16, H + 16);
    x.fillStyle = '#141024'; x.fillRect(-8, 60, W + 16, 60);
    x.fillStyle = '#0e0b1c'; x.fillRect(-8, 96, W + 16, 110);
    PIX.rect(x, -8, 95, W + 16, 2, '#1c1630');
    const flick = (DUEL.t % 180) > 174 ? 0.35 : 1;
    x.globalAlpha = 0.85 * flick; PIX.draw(x, 'sign_bj', 26, 30, 2); x.globalAlpha = 1;
    x.globalAlpha = 0.85; PIX.draw(x, 'sign_slots', 296, 34, 2); x.globalAlpha = 1;
    x.globalAlpha = 0.5;
    PIX.draw(x, 'patron_toad', 8, 78, 1);
    PIX.draw(x, 'patron_toad', 330, 80, 1);
    x.globalAlpha = 1;

    /* --- lamp cone --- */
    x.save();
    const sway = Math.sin(DUEL.t / 90) * 3;
    x.globalAlpha = 0.10;
    x.fillStyle = '#ffd75e';
    x.beginPath();
    x.moveTo(180 + sway, 16); x.lineTo(66 + sway * 2, 150); x.lineTo(294 + sway * 2, 150);
    x.closePath(); x.fill();
    x.globalAlpha = 0.07;
    x.beginPath();
    x.moveTo(180 + sway, 16); x.lineTo(108 + sway * 2, 150); x.lineTo(252 + sway * 2, 150);
    x.closePath(); x.fill();
    x.restore();

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
      if (o.flash > 0) {
        x.globalAlpha = Math.min(1, o.flash);
        x.drawImage(comp.white, -comp.cv.width / 2, -comp.cv.height);
        x.globalAlpha = 1;
      }
      x.restore();
      const opp = G.duel && G.duel.opp;
      /* flop sweat drips */
      if (opp && o.fall < 0 && (DUEL.exprName === 'worry') && DUEL.t % 55 === 0) {
        DUEL.parts.push({ x: 180 + 26, y: 38, vx: 0.15, vy: 0.7, g: 0.02, t: 0, life: 30, col: P.L });
      }
      if (opp && o.fall < 0) {
        /* his hearts, stacked in rows of five beside his head */
        for (let i = 0; i < opp.maxHP; i++) {
          const row = Math.floor(i / 5), col = i % 5;
          PIX.draw(x, i < opp.hp ? 'ic_heart' : 'ic_heart_e', 246 + col * 10, 22 + row * 9, 1);
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

    /* --- the table --- */
    SPR.ellipse(x, 180, 152, 152, 40, P.K);
    SPR.ellipse(x, 180, 150, 150, 38, P.u);
    SPR.ellipse(x, 180, 148, 144, 34, P.E);
    SPR.ellipse(x, 180, 146, 138, 30, P.e);
    x.globalAlpha = 0.35;
    SPR.ellipse(x, 180, 132, 90, 12, P.f);
    x.globalAlpha = 1;

    /* --- blood on the felt --- */
    DUEL.decals.forEach(d => { SPR.ellipse(x, d.x, d.y, d.r * 1.6, d.r * 0.7, d.col); });

    /* felt decor */
    DUEL.chipStack(x, 84, 150, 4, P.r, P.R);
    DUEL.chipStack(x, 96, 154, 2, P.l, P.L);
    DUEL.chipStack(x, 262, 148, 3, P.g, P.G);
    SPR.ellipse(x, 236, 158, 9, 3, P.T); SPR.ellipse(x, 236, 157, 7, 2, P.s);

    /* --- the corpse, when it's time to go through him --- */
    if (DUEL.corpse) DUEL.drawCorpse(x);

    /* --- casings --- */
    DUEL.casings.forEach(c => {
      x.save(); x.translate(c.x, c.y); x.rotate(c.rot);
      PIX.rect(x, -2, -1, 5, 2, P.K); PIX.rect(x, -1, -1, 3, 2, P.g);
      x.restore();
    });

    /* --- the iron --- */
    if (!DUEL.corpse) {
      const g = DUEL.gun;
      x.save();
      SPR.ellipse(x, g.x + 2, 138 + (g.y - 126) * 0.2, 16 * g.sc, 3, 'rgba(0,0,0,.4)');
      x.translate(Math.round(g.x), Math.round(g.y));
      x.rotate(g.rot);
      if (g.flip) x.scale(-1, 1);
      const gm = PIX.make(GUN_SPRITES[E.gun().id], 1);
      x.drawImage(gm, -gm.width / 2 * g.sc, -gm.height / 2 * g.sc, gm.width * g.sc, gm.height * g.sc);
      if (G.duel && G.duel.sawArmed) {
        x.globalAlpha = 0.5 + Math.sin(DUEL.t / 5) * 0.3;
        PIX.rect(x, gm.width / 2 * g.sc - 10, -gm.height / 2 * g.sc, 10, 4, P.O);
        x.globalAlpha = 1;
      }
      x.restore();
    }

    /* --- muzzle flash --- */
    if (DUEL.muzzle) {
      const m = DUEL.muzzle;
      const r = m.t < 3 ? 7 + m.t * 3 : 16 - m.t;
      x.save(); x.translate(m.x, m.y);
      for (let i = 0; i < 6; i++) {
        const a = m.ang + (i / 6) * Math.PI * 2 + m.t * 0.3;
        PIX.rect(x, Math.cos(a) * r - 1, Math.sin(a) * r - 1, 3, 3, i % 2 ? P.Y : P.O);
      }
      PIX.disc(x, 0, 0, Math.max(2, r * 0.45), P.Y);
      x.restore();
    }

    /* --- particles --- */
    DUEL.parts.forEach(p => {
      x.globalAlpha = Math.max(0, 1 - p.t / p.life);
      x.fillStyle = p.col;
      x.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    });
    x.globalAlpha = 1;

    /* --- you, over the shoulder --- */
    DUEL.drawYou(x);
    DUEL.hearts(x, 8, 101, G.hearts, E.maxHP(), G.hearts === 1 && (DUEL.t % 40 < 20));

    /* --- the lamp itself --- */
    PIX.rect(x, 179 + sway * 0.3, -2, 2, 8, P.T);
    x.fillStyle = P.K;
    x.beginPath(); x.moveTo(180 + sway, 3); x.lineTo(163 + sway, 17); x.lineTo(197 + sway, 17); x.closePath(); x.fill();
    x.fillStyle = P.g;
    x.beginPath(); x.moveTo(180 + sway, 6); x.lineTo(166 + sway, 16); x.lineTo(194 + sway, 16); x.closePath(); x.fill();
    PIX.rect(x, 177 + sway, 16, 6, 3, P.Y);

    /* --- hurt vignette --- */
    if (DUEL.redPulse > 0) {
      x.globalAlpha = Math.min(0.55, DUEL.redPulse);
      const grad = x.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 210);
      grad.addColorStop(0, 'rgba(209,59,69,0)');
      grad.addColorStop(1, 'rgba(209,59,69,.9)');
      x.fillStyle = grad; x.fillRect(-8, -8, W + 16, H + 16);
      x.globalAlpha = 1;
    }
    if (DUEL.whitePulse > 0) {
      x.globalAlpha = Math.min(0.7, DUEL.whitePulse);
      x.fillStyle = '#fff3b0'; x.fillRect(-8, -8, W + 16, H + 16);
      x.globalAlpha = 1;
    }

    x.restore();
  },

  /* belly-up on the felt, flies already gathering */
  drawCorpse(x) {
    const P = PIX.PAL;
    const opp = G.duel.opp;
    const key = DUEL.oppKey;
    const body = SPR.bodyCustom(key, opp.def);
    const head = SPR.frogCustom(key, opp.def, 'dead');
    const jig = DUEL.jiggle * Math.sin(DUEL.t * 1.7);

    /* the pool first — it keeps spreading */
    SPR.ellipse(x, 178, 150, DUEL.pool * 2.6, DUEL.pool * 0.62, P.D);
    SPR.ellipse(x, 174, 149, DUEL.pool * 2.1, DUEL.pool * 0.45, P.d);

    x.save();
    x.translate(190, 136 + jig);
    x.rotate(0.06 + jig * 0.01);
    /* body lying, feet stage-right */
    x.save();
    x.rotate(-Math.PI / 2 + 0.18);
    x.drawImage(body, -body.width / 2 + 24, -20);
    x.restore();
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
      SPR.ellipse(x, 262, 132, 12, 4, P.K);
      SPR.ellipse(x, 262, 131, 10, 3, P.T);
      PIX.disc(x, 262, 127, 6, P.K);
      PIX.disc(x, 262, 128, 5, P.T);
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

  drawYou(x) {
    const P = PIX.PAL;
    const bob = Math.sin(DUEL.t / 40 + 2) * 1;
    const oy = DUEL.youFall ? 26 : 0;
    x.save();
    x.translate(0, Math.round(bob) + oy);
    if (DUEL.youFall) x.rotate(0.12);
    x.fillStyle = P.K;
    x.beginPath(); x.moveTo(-6, 206); x.lineTo(2, 168); x.lineTo(52, 158); x.lineTo(108, 172); x.lineTo(116, 206); x.closePath(); x.fill();
    x.fillStyle = P.T;
    x.beginPath(); x.moveTo(-4, 206); x.lineTo(4, 170); x.lineTo(52, 161); x.lineTo(105, 174); x.lineTo(112, 206); x.closePath(); x.fill();
    PIX.disc(x, 50, 148, 21, P.K);
    PIX.disc(x, 50, 148, 19, P.f);
    PIX.disc(x, 44, 142, 8, P.F);
    PIX.disc(x, 34, 132, 7, P.K); PIX.disc(x, 34, 132, 5, P.f);
    PIX.disc(x, 66, 132, 7, P.K); PIX.disc(x, 66, 132, 5, P.f);
    SPR.ellipse(x, 50, 138, 25, 7, P.K);
    SPR.ellipse(x, 50, 137, 23, 6, P.T);
    PIX.disc(x, 50, 128, 15, P.K);
    PIX.disc(x, 50, 129, 13, P.T);
    PIX.rect(x, 36, 132, 28, 4, P.d);
    x.restore();
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
    DUEL.setPose(DUEL.aim === 'foe' ? 'youFoe' : 'youSelf');
    await U.sleep(220);
    SFX.chak();
    await U.sleep(190);
    const ev = E.pull(DUEL.aim);
    await DUEL.playShot(ev);
    await DUEL.afterPull(ev);
  },

  async playShot(ev) {
    const tip = DUEL.muzzleTip();
    if (ev.live) {
      SFX.shot();
      DUEL.muzzle = { x: tip.x, y: tip.y, ang: Math.random() * 7, t: 0 };
      DUEL.shake = ev.dmg >= 2 ? 14 : 9;
      DUEL.whitePulse = 0.5;
      DUEL.casings.push({ x: DUEL.gun.x, y: DUEL.gun.y - 6, vx: (Math.random() - 0.2) * 2.4, vy: -3 - Math.random() * 1.5, vr: 0.4, rot: 0, t: 0 });
      DUEL.puff(tip.x, tip.y, 14, [PIX.PAL.q, PIX.PAL.m, PIX.PAL.w], 2, -1);
      if (ev.fizzled) {
        await U.sleep(160);
        UI.stampBig('FIZZLE', PIX.PAL.N); SFX.dud();
      } else if (ev.victim === 'foe') {
        DUEL.opp.recoil = 1; DUEL.opp.flash = 1;
        DUEL.setExpr('pain', 55);
        DUEL.blood(180, 60, ev.dmg >= 2 ? 22 : 12);
        UI.stampBig(ev.dmg >= 2 ? '-' + ev.dmg + ' CRUNCH' : 'HIT', PIX.PAL.R);
        SFX.hurt();
      } else if (ev.victim === 'you') {
        DUEL.redPulse = 0.9;
        if (ev.by === 'opp') DUEL.setExpr('grin', 80);
        DUEL.blood(60, 165, 8);
        UI.flash('go-back');
        UI.stampBig('-' + ev.dmg, PIX.PAL.R);
        SFX.hurt();
      }
    } else {
      SFX.dud();
      DUEL.puff(tip.x, tip.y, 4, [PIX.PAL.q], 1, -0.4);
      UI.stampBig('click', PIX.PAL.w, true);
      if (ev.by === 'opp' && ev.target === 'self') DUEL.setExpr('smug', 60);
      if (ev.by === 'you' && ev.target === 'foe' && !ev.croakHeal) DUEL.setExpr('smug', 45);
      if (ev.croakHeal) { DUEL.setExpr('grin', 60); await U.sleep(240); UI.stampBig('HE SWALLOWS IT', PIX.PAL.F); }
    }
    if (ev.rosary) { await U.sleep(300); UI.stampBig('THE ROSARY CRUMBLES', PIX.PAL.G); SFX.bank(); }
    if (ev.chips) UI.chipTick(ev.chips);
    if (ev.tonyTax) UI.chipTick(-1);
    UI.syncDuel();
    await U.sleep(ev.live ? 620 : 480);
  },

  async afterPull(ev) {
    if (ev.over === 'win') { await DUEL.killSequence(); return; }
    if (ev.over === 'loss') { await DUEL.deathSequence(); return; }

    if (ev.revived) {
      await U.sleep(300);
      DUEL.shake = 12; SFX.backfire();
      DUEL.oppCache = {}; // phase two: rebuild him angry
      DUEL.setExpr('angry', 240);
      UI.stampBig('HE GETS BACK UP', PIX.PAL.V);
      await U.sleep(900);
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
      UI.syncDuel();
      await U.sleep(520 + Math.random() * 480);
      const choice = E.oppDecide();                    // 'foe' = shoot YOU
      DUEL.setPose(choice === 'foe' ? 'oppYou' : 'oppSelf');
      if (choice === 'self') DUEL.setExpr('worry', 70);
      await U.sleep(420);
      SFX.chak();
      await U.sleep(260 + Math.random() * 300);        // let it hang
      const ev = E.pull(choice);
      await DUEL.playShot(ev);
      if (ev.over === 'win') { await DUEL.killSequence(); return; }
      if (ev.over === 'loss') { await DUEL.deathSequence(); return; }
      if (ev.shuffled) { SFX.spin(); UI.stampSmall('SHUFFLED'); }
      if (ev.reloaded) { SFX.spin(); await UI.loadBanner(); }
      if (ev.extraTurn) { UI.stampSmall('HE GOES AGAIN'); await U.sleep(160); }
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
    DUEL.blood(180, 90, 16);
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
    DUEL.redPulse = 1.2;
    UI.flash('go-back');
    SFX.backfire();
    await U.sleep(500);
    DUEL.youFall = true;
    SFX.lose();
    await U.sleep(1100);
    META.check();
    UI.render(); // phase is 'over'
  },

  /* loot fx: the corpse jiggles, the take flies out of it */
  lootFx(pocket) {
    DUEL.jiggle = 3;
    const P = PIX.PAL;
    if (pocket.id === 'tooth') {
      DUEL.blood(150, 125, 8);
      DUEL.parts.push({ x: 150, y: 120, vx: 1.4, vy: -2.6, g: 0.12, t: 0, life: 50, col: P.G });
      SFX.hurt();
    }
    for (let i = 0; i < Math.min(10, pocket.chips + 1); i++) {
      DUEL.parts.push({
        x: 175 + (Math.random() - 0.5) * 50, y: 128, t: 0, life: 34,
        vx: (Math.random() - 0.5) * 2, vy: -2.2 - Math.random(), g: 0.11, col: P.G,
      });
    }
    if (pocket.gun) { DUEL.whitePulse = 0.6; SFX.jackpot(); }
    SFX.coin();
  },

  useTrinket: null, // assigned below (duel actives)

  useGunActive(kind) {
    if (DUEL.busy) return;
    const ev = E.useGun(kind);
    if (!ev) return;
    if (ev.type === 'saw') { SFX.jamSfx(); UI.stampSmall('SAWED — NEXT SHOT ×2'); }
    else { SFX.chak(); UI.stampSmall('DOUBLE TAP READY'); }
    UI.syncDuel();
  },

  /* clicks on the scene: the mark = aim at him, your corner = aim at you */
  sceneClick(e) {
    if (G.phase !== 'duel') return;
    const r = DUEL.cv.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width * DUEL.W;
    const py = (e.clientY - r.top) / r.height * DUEL.H;
    if (px > 120 && px < 245 && py < 125) DUEL.setAim('foe');
    else if (px < 118 && py > 118) DUEL.setAim('self');
  },
};

DUEL.useTrinket = async function (i) {
  if (DUEL.busy || !E.canUseTrinket(i)) return;
  const ev = E.useTrinket(i);
  if (!ev) return;
  switch (ev.type) {
    case 'heal':
      SFX.bank(); UI.stampSmall('+1 HEART');
      DUEL.puff(24, 122, 8, [PIX.PAL.R, PIX.PAL.G], 1.2, -1.2);
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
