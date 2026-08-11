'use strict';
/* ============================================================
   SHELL & DEBT — duel.js
   The table. A drawn casino scene on one canvas: the mark
   across the felt, the lamp, the iron, muzzle flash, casings,
   the fall, the ghost. Plus the async turn loop that drives it.
   ============================================================ */

const DUEL = {

  /* logical scene size — CSS scales it up, pixelated */
  W: 360, H: 200,
  cv: null, ctx: null, raf: 0, t: 0,

  aim: 'foe',
  busy: true,          // input lock (intro, animations, his turn)
  hbTimer: 0,          // heartbeat at 1 heart

  /* animated things */
  gun: { x: 178, y: 126, rot: 0, flip: false, sc: 1, tx: 178, ty: 126, trot: 0, tsc: 1 },
  shake: 0, redPulse: 0, whitePulse: 0,
  muzzle: null,        // {x, y, ang, t}
  parts: [],           // pixels flying around {x,y,vx,vy,g,col,life,t}
  casings: [],
  opp: { recoil: 0, flash: 0, fall: -1, gone: false },
  ghost: null,         // {x, y, t}
  youFall: false,

  oppCanvas: null, oppWhite: null, oppKey: '',

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
    DUEL.parts = []; DUEL.casings = [];
    DUEL.muzzle = null; DUEL.ghost = null;
    DUEL.shake = 0; DUEL.redPulse = 0; DUEL.whitePulse = 0;
    DUEL.opp = { recoil: 0, flash: 0, fall: -1, gone: false };
    DUEL.youFall = false;
    DUEL.setPose('rest', true);
    DUEL.buildOpp();

    DUEL.cv = document.getElementById('scene');
    DUEL.ctx = DUEL.cv.getContext('2d');
    DUEL.t = 0;
    DUEL.loop();
    DUEL.intro();
  },

  stop() {
    if (DUEL.raf) cancelAnimationFrame(DUEL.raf);
    DUEL.raf = 0;
    clearTimeout(DUEL.hbTimer);
  },

  loop() {
    DUEL.raf = requestAnimationFrame(() => DUEL.loop());
    DUEL.t++;
    DUEL.step();
    DUEL.draw();
  },

  /* ================= opp sprite (body + rig head) ================= */

  buildOpp() {
    const opp = G.duel.opp;
    const key = (opp.boss || opp.name) + ':' + G.ante + ':' + G.blind;
    if (DUEL.oppKey === key && DUEL.oppCanvas) return;
    DUEL.oppKey = key;

    const def = opp.boss ? FROG_DEFS[opp.frog] : opp.def;
    const head = opp.boss
      ? SPR.frogMaster(opp.frog)
      : SPR.frogCustom(key, opp.def);

    const P = PIX.PAL;
    const W = 110, H = 104;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const cx = W / 2;
    const fat = def.fat;
    const suitCol = def.suit === 'stripes' ? P.t : (P[def.suit] || P.T);

    /* torso — a suit you could hide a body in */
    const sw = fat ? 40 : 30;                    // shoulder half-width
    const ty = 52, by = H;                       // torso top / bottom
    ctx.fillStyle = P.K;
    ctx.beginPath();
    ctx.moveTo(cx - sw - 3, by); ctx.lineTo(cx - sw + 4, ty + 6); ctx.lineTo(cx - 12, ty);
    ctx.lineTo(cx + 12, ty); ctx.lineTo(cx + sw - 4, ty + 6); ctx.lineTo(cx + sw + 3, by);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = suitCol;
    ctx.beginPath();
    ctx.moveTo(cx - sw - 1, by); ctx.lineTo(cx - sw + 5, ty + 8); ctx.lineTo(cx - 11, ty + 2);
    ctx.lineTo(cx + 11, ty + 2); ctx.lineTo(cx + sw - 5, ty + 8); ctx.lineTo(cx + sw + 1, by);
    ctx.closePath(); ctx.fill();
    if (def.suit === 'stripes') {
      ctx.fillStyle = P.T;
      for (let x = -sw; x <= sw; x += 4) ctx.fillRect(cx + x, ty + 6, 2, by - ty - 6);
    }
    /* shirt + lapels */
    PIX.rect(ctx, cx - 6, ty + 2, 12, 30, P[def.shirt] || P.W);
    if (def.tie) PIX.rect(ctx, cx - 2, ty + 5, 4, 16, P[def.tie] === undefined ? P.d : P[def.tie]);
    ctx.fillStyle = P.K;
    ctx.beginPath(); ctx.moveTo(cx - 10, ty + 2); ctx.lineTo(cx - 2, ty + 16); ctx.lineTo(cx - 12, ty + 20); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 10, ty + 2); ctx.lineTo(cx + 2, ty + 16); ctx.lineTo(cx + 12, ty + 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = suitCol;
    ctx.beginPath(); ctx.moveTo(cx - 11, ty + 3); ctx.lineTo(cx - 4, ty + 15); ctx.lineTo(cx - 13, ty + 18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 11, ty + 3); ctx.lineTo(cx + 4, ty + 15); ctx.lineTo(cx + 13, ty + 18); ctx.closePath(); ctx.fill();

    /* arms resting toward the table */
    const skin = P[def.skin[0]], shade = P[def.skin[1]];
    [[-1, 0], [1, 0]].forEach(([s]) => {
      const ax = cx + s * (sw - 2);
      ctx.fillStyle = P.K;
      ctx.beginPath();
      ctx.moveTo(ax - 6 * s, ty + 12); ctx.lineTo(ax + 5 * s, ty + 18);
      ctx.lineTo(ax + 2 * s, H - 6); ctx.lineTo(ax - 9 * s, H - 4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = suitCol;
      ctx.beginPath();
      ctx.moveTo(ax - 5 * s, ty + 14); ctx.lineTo(ax + 3 * s, ty + 19);
      ctx.lineTo(ax + 1 * s, H - 7); ctx.lineTo(ax - 7 * s, H - 5);
      ctx.closePath(); ctx.fill();
      // hand
      PIX.disc(ctx, ax - 3 * s, H - 6, 5, P.K);
      PIX.disc(ctx, ax - 3 * s, H - 7, 4, skin);
      PIX.rect(ctx, ax - 5 * s, H - 7, 4, 1, shade);
    });

    /* the head — the rig, half again as big */
    const hs = 1.7;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(head, Math.round(cx - head.width * hs / 2), 0, Math.round(head.width * hs), Math.round(head.height * hs));

    DUEL.oppCanvas = cv;

    /* white mask for hit-flash */
    const wcv = document.createElement('canvas');
    wcv.width = W; wcv.height = H;
    const wctx = wcv.getContext('2d');
    wctx.drawImage(cv, 0, 0);
    wctx.globalCompositeOperation = 'source-in';
    wctx.fillStyle = '#fff';
    wctx.fillRect(0, 0, W, H);
    DUEL.oppWhite = wcv;
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
    if (DUEL.opp.recoil > 0) DUEL.opp.recoil *= 0.85;
    if (DUEL.opp.flash > 0) DUEL.opp.flash -= 0.07;
    if (DUEL.opp.fall >= 0 && DUEL.opp.fall < 1) DUEL.opp.fall = Math.min(1, DUEL.opp.fall + 0.035);
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
    // wainscot line
    PIX.rect(x, -8, 95, W + 16, 2, '#1c1630');
    // neon on the back wall
    const flick = (DUEL.t % 180) > 174 ? 0.35 : 1;
    x.globalAlpha = 0.85 * flick; PIX.draw(x, 'sign_bj', 26, 30, 2); x.globalAlpha = 1;
    x.globalAlpha = 0.85; PIX.draw(x, 'sign_slots', 296, 34, 2); x.globalAlpha = 1;
    // far-off patrons at other tables, just shapes in the dark
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

    /* --- the mark --- */
    if (!DUEL.opp.gone) {
      const o = DUEL.opp;
      const bob = Math.sin(DUEL.t / 34) * 1.4;
      x.save();
      x.translate(180, 127);                       // pivot: his seat at the table line
      if (o.fall >= 0) {
        const f = o.fall, ease = f * f;
        x.translate(0, ease * 26);
        x.rotate(-ease * 1.9);
        x.globalAlpha = 1 - Math.max(0, f - 0.75) * 4;
      } else {
        x.translate(0, Math.round(bob) + o.recoil * -4);
        x.rotate(o.recoil * 0.06);
      }
      x.drawImage(DUEL.oppCanvas, -DUEL.oppCanvas.width / 2, -104);
      if (o.flash > 0) {
        x.globalAlpha = Math.min(1, o.flash);
        x.drawImage(DUEL.oppWhite, -DUEL.oppCanvas.width / 2, -104);
        x.globalAlpha = 1;
      }
      x.restore();
      /* sweat under pressure */
      const opp = G.duel && G.duel.opp;
      if (opp && opp.hp > 0 && opp.hp <= Math.ceil(opp.maxHP / 3) && o.fall < 0 && DUEL.t % 70 === 0) {
        DUEL.parts.push({ x: 180 + 24, y: 40, vx: 0.15, vy: 0.7, g: 0.02, t: 0, life: 30, col: P.L });
      }
      /* his hearts */
      if (opp && o.fall < 0) DUEL.hearts(x, 180 - opp.maxHP * 5, 8, opp.hp, opp.maxHP);
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
    SPR.ellipse(x, 180, 132, 90, 12, P.f);          // lamp pool on the felt
    x.globalAlpha = 1;
    /* felt decor: chip stacks + ashtray */
    DUEL.chipStack(x, 84, 150, 4, P.r, P.R);
    DUEL.chipStack(x, 96, 154, 2, P.l, P.L);
    DUEL.chipStack(x, 262, 148, 3, P.g, P.G);
    SPR.ellipse(x, 236, 158, 9, 3, P.T); SPR.ellipse(x, 236, 157, 7, 2, P.s);
    if (E.bossIs('collector')) { PIX.draw(x, 'ic_chip', 150, 154, 1); PIX.draw(x, 'ic_chip', 158, 157, 1); }

    /* --- casings on and above the felt --- */
    DUEL.casings.forEach(c => {
      x.save(); x.translate(c.x, c.y); x.rotate(c.rot);
      PIX.rect(x, -2, -1, 5, 2, P.K); PIX.rect(x, -1, -1, 3, 2, P.g);
      x.restore();
    });

    /* --- the iron --- */
    const g = DUEL.gun;
    x.save();
    SPR.ellipse(x, g.x + 2, 138 + (g.y - 126) * 0.2, 16 * g.sc, 3, 'rgba(0,0,0,.4)');
    x.translate(Math.round(g.x), Math.round(g.y));
    x.rotate(g.rot);
    if (g.flip) x.scale(-1, 1);
    const gm = PIX.make(GUN_SPRITES[E.gun().id], 1);
    x.drawImage(gm, -gm.width / 2 * g.sc, -gm.height / 2 * g.sc, gm.width * g.sc, gm.height * g.sc);
    if (G.duel && G.duel.sawArmed) {                // sawed: the barrel glows mean
      x.globalAlpha = 0.5 + Math.sin(DUEL.t / 5) * 0.3;
      PIX.rect(x, gm.width / 2 * g.sc - 10, -gm.height / 2 * g.sc, 10, 4, P.O);
      x.globalAlpha = 1;
    }
    x.restore();

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

    /* --- your hearts --- */
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

  drawYou(x) {
    const P = PIX.PAL;
    /* your shoulder + the back of your head, bottom-left */
    const bob = Math.sin(DUEL.t / 40 + 2) * 1;
    const oy = DUEL.youFall ? 26 : 0;
    x.save();
    x.translate(0, Math.round(bob) + oy);
    if (DUEL.youFall) x.rotate(0.12);
    // shoulders
    x.fillStyle = P.K;
    x.beginPath(); x.moveTo(-6, 206); x.lineTo(2, 168); x.lineTo(52, 158); x.lineTo(108, 172); x.lineTo(116, 206); x.closePath(); x.fill();
    x.fillStyle = P.T;
    x.beginPath(); x.moveTo(-4, 206); x.lineTo(4, 170); x.lineTo(52, 161); x.lineTo(105, 174); x.lineTo(112, 206); x.closePath(); x.fill();
    // head back
    PIX.disc(x, 50, 148, 21, P.K);
    PIX.disc(x, 50, 148, 19, P.f);
    PIX.disc(x, 44, 142, 8, P.F);
    // eye bulbs peeking over the skull, from behind
    PIX.disc(x, 34, 132, 7, P.K); PIX.disc(x, 34, 132, 5, P.f);
    PIX.disc(x, 66, 132, 7, P.K); PIX.disc(x, 66, 132, 5, P.f);
    // fedora
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
    SFX.chak();                                    // hammer back
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
        UI.stampBig(ev.dmg >= 2 ? '-' + ev.dmg + ' CRUNCH' : 'HIT', PIX.PAL.R);
        SFX.hurt();
      } else if (ev.victim === 'you') {
        DUEL.redPulse = 0.9;
        UI.flash('go-back');
        UI.stampBig('-' + ev.dmg, PIX.PAL.R);
        SFX.hurt();
      }
    } else {
      SFX.dud();
      DUEL.puff(tip.x, tip.y, 4, [PIX.PAL.q], 1, -0.4);
      UI.stampBig('click', PIX.PAL.w, true);
      if (ev.croakHeal) { await U.sleep(240); UI.stampBig('HE SWALLOWS IT', PIX.PAL.F); }
    }
    if (ev.rosary) { await U.sleep(300); UI.stampBig('THE ROSARY CRUMBLES', PIX.PAL.G); SFX.bank(); }
    if (ev.chips) UI.chipTick(ev.chips);
    if (ev.tonyTax) UI.chipTick(-1);
    UI.syncDuel();
    await U.sleep(ev.live ? 620 : 480);
  },

  async afterPull(ev) {
    /* the mark goes down */
    if (ev.over === 'win') { await DUEL.killSequence(); return; }
    if (ev.over === 'loss') { await DUEL.deathSequence(); return; }

    if (ev.revived) {
      await U.sleep(300);
      DUEL.shake = 12; SFX.backfire();
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
      await U.sleep(420);
      SFX.chak();
      await U.sleep(260 + Math.random() * 300);        // let it hang
      const ev = E.pull(choice);
      await DUEL.playShot(ev);
      if (ev.over === 'win') { await DUEL.killSequence(); return; }   // he shot himself out
      if (ev.over === 'loss') { await DUEL.deathSequence(); return; }
      if (ev.revived) { /* unreachable: revive is his, not yours */ }
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

  /* the mark dies */
  async killSequence() {
    DUEL.setPose('rest');
    await U.sleep(350);
    DUEL.opp.fall = 0;
    SFX.lose(); SFX.cluck();
    await U.sleep(750);
    DUEL.ghost = { x: 168, y: 60, t: 0 };
    SFX.tone && SFX.tone(880, 0.4, 'sine', 0.08, 0, 400);
    DUEL.opp.gone = true;
    await U.sleep(700);
    const fresh = META.check();
    if (G.phase === 'won') UI.render();
    else await UI.payoutOverlay(fresh);
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

  /* ================= actives ================= */

  async useTrinket(i) {
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
        break;
      case 'mirror':
        SFX.spin(); DUEL.whitePulse = 0.5;
        UI.stampSmall(ev.live ? 'FLIPPED: LIVE' : 'FLIPPED: blank');
        break;
    }
    UI.syncDuel();
  },

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
