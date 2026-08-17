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

  /* No aim at all until you pick a head. Every turn starts with the iron
     down, so the first tap is always "aim" and the second one is the one
     that goes off — there is no state where a single stray tap kills. */
  aim: null,
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
  dark: 0, lamp: 1,       // the room's lights, for the sit-down cinematic
  cocked: false,          // the hammer, back and waiting
  kick: 0,                // recoil: the iron jumps the bore line and comes back
  cyl: 0, cylT: 0,        // which chamber is under it, and the turn in progress
  smoke: [],              // wisps off the muzzle and out of the cylinder gap
  reach: null,            // your arm out over the corpse, going through a pocket
  room: 'table',          // 'table' while he is on the felt, 'back' once you drag him
  tongue: null,           // a verlet chain, anchored in his mouth
  flies: [],              // what it goes out for
  hoverSpot: -1, hoverFace: false, hoverStain: -1,
  react: null,               // what his hand came up out of the dark to say
  dying: 0,                  // 0 = you are fine; 1 = he is standing over you
  slug: null,                // the round, in the air, in bullet time
  myGore: 0,                 // what is on YOUR face, and stays there
  blood: [],                 // what is on HIS, in his own space, and grows
  blink: 0, blinkNext: 90,   // he is alive; every so often the lids come down
  view: 'table', viewT: 0,   // the camera: across the felt, or round on yourself
  oppKey: '', oppCache: {}, exprName: 'neutral', exprTimer: 0,

  /* ---------------- gun poses (world space) ---------------- */

  /* Yours are authored as "where your fist is, and which way the barrel
     points" against the reference floor (FY 180); the iron's own position
     is derived from that so its grip always lands inside your hand. His
     are plain sprite placements across the felt. */
  POSES: {
    rest:     { mine: 1, hx: 296, hy: 174, rot: 0.22, flip: true, sc: 0.8 },
    youFoe:   { mine: 1, hx: 290, hy: 166, rot: 0.52, flip: true, sc: 0.85 },
    youSelf:  { mine: 1, hx: 272, hy: 142, rot: -1.24, flip: true, sc: 0.9 },
    oppYou:   { x: 222, y: 100, rot: 0.34, flip: true, sc: 0.8 },
    oppSelf:  { x: 220, y: 82, rot: -1.18, flip: false, sc: 0.8 },
  },

  /* the iron reports its own anchors, so nothing here guesses where your
     fist closes or where the flash comes out */
  ironArt() { return SPR.gunMaster(E.gun().id, DUEL.cocked, Math.round(DUEL.cyl)); },

  /* take a point in sprite space out to world space through the current pose */
  ironPoint(lxp, lyp) {
    const g = DUEL.gun, m = DUEL.ironArt();
    const lx = (lxp - m.width / 2) * g.sc, ly = (lyp - m.height / 2) * g.sc;
    const fx = g.flip ? -1 : 1;
    const c = Math.cos(g.rot), s = Math.sin(g.rot);
    return { x: g.x + (lx * c * fx - ly * s), y: g.y + (lx * s * fx + ly * c) };
  },

  ironFromGrip(hx, hy, rot, sc, flip) {
    const m = DUEL.ironArt();
    const gp = m.grip || [10, 13];
    const lx = (gp[0] - m.width / 2) * sc, ly = (gp[1] - m.height / 2) * sc;
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
    const m = DUEL.ironArt();
    const mz = m.muzzle || [m.width, m.height / 2];
    return DUEL.ironPoint(mz[0] + 1, mz[1]);
  },

  /* which way the barrel is looking, in world radians */
  boreAngle() {
    const g = DUEL.gun;
    return g.rot + (g.flip ? Math.PI : 0);
  },

  /* Recoil, as one offset both the fist and the iron use: straight back
     down the bore line plus muzzle rise, so the whole hand moves together
     instead of the gun sliding out of your fingers. */
  kickOff() {
    const k = DUEL.kick;
    if (!k) return { dx: 0, dy: 0, drot: 0 };
    const a = DUEL.boreAngle();
    return {
      dx: -Math.cos(a) * k * 7,
      dy: -Math.sin(a) * k * 7 - k * 3,
      drot: (DUEL.gun.flip ? 1 : -1) * k * 0.34,
    };
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
    DUEL.aim = null;
    DUEL.busy = true;
    DUEL.parts = []; DUEL.casings = []; DUEL.decals = []; DUEL.wounds = [];
    DUEL.muzzle = null; DUEL.ghost = null;
    DUEL.shake = 0; DUEL.redPulse = 0; DUEL.whitePulse = 0;
    DUEL.opp = { recoil: 0, flash: 0, fall: -1, gone: false };
    DUEL.youFall = false;
    DUEL.corpse = false; DUEL.pool = 0; DUEL.jiggle = 0;
    DUEL.dark = 0; DUEL.lamp = 1; DUEL.moths = [];
    DUEL.cocked = false; DUEL.cyl = 0; DUEL.cylT = 0; DUEL.smoke = [];
    DUEL.reach = null; DUEL.hoverSpot = -1; DUEL.hoverStain = -1; DUEL.react = null; DUEL.myGore = 0; DUEL.blood = []; DUEL.dying = 0; DUEL.slug = null;
    DUEL.view = 'table'; DUEL.viewT = 0;
    DUEL.initTongue();
    /* G.loot survives from the LAST corpse until the next one is opened, so
       this has to ask what phase we are actually in — otherwise the next
       duel gets played standing in the back room */
    DUEL.room = (G.phase === 'loot' && G.loot && G.loot.dragged) ? 'back' : 'table';
    COPS.GROUND = DUEL.room === 'back' ? DUEL.FY - 8 : 150;
    document.querySelectorAll('.cop-callout').forEach(n => n.remove());
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
      DUEL.busy = false;
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
    const body = SPR.bodyCustom(key, opp.def, true);   // he is sitting down
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
    if (DUEL.cylT > 0) { DUEL.cylT = Math.max(0, DUEL.cylT - 0.14); DUEL.cyl += 0.14; }
    if (DUEL.kick > 0.002) DUEL.kick *= 0.79; else DUEL.kick = 0;
    DUEL.stepFlies();
    DUEL.stepTongue();
    /* the clock out back runs in real seconds, off the frame timer */
    if (G.phase === 'loot' && G.loot && !G.loot.done) {
      const now = performance.now();
      const dt = Math.min(0.2, (now - (DUEL._lootT || now)) / 1000);
      DUEL._lootT = now;
      const ev = E.lootTick(dt);
      LOOT.tick();
      if (ev === 'time') { SFX.jamSfx(); FX.screen.shake(10); LOOT.heard(); LOOT.sync(); }
    } else DUEL._lootT = 0;
    /* the blink. It is the only thing that separates a frog sitting very
       still from a frog who is not there any more. */
    /* the camera swings round when you turn the gun on yourself */
    const vt = DUEL.view === 'self' ? 1 : 0;
    DUEL.viewT += (vt - DUEL.viewT) * 0.18;
    if (Math.abs(DUEL.viewT - vt) < 0.004) DUEL.viewT = vt;
    if (DUEL.react && ++DUEL.react.t >= DUEL.react.life) DUEL.react = null;
    if (DUEL.dying > 0 && DUEL.dying < 1) DUEL.dying = Math.min(1, DUEL.dying + 0.018);
    /* the round, crawling down the bore line with its own wake */
    if (DUEL.slug) {
      const sl = DUEL.slug;
      sl.t++;
      sl.trail.unshift([sl.x, sl.y]);
      if (sl.trail.length > 9) sl.trail.pop();
      sl.x += Math.cos(sl.ang) * sl.sp;
      sl.y += Math.sin(sl.ang) * sl.sp;
      sl.sp *= 1.09;
      if (sl.t > sl.life) DUEL.slug = null;
    }
    if (DUEL.blink > 0) DUEL.blink--;
    else if (--DUEL.blinkNext <= 0) {
      DUEL.blink = 7;
      DUEL.blinkNext = 150 + ((Math.random() * 300) | 0);
    }
    DUEL.smoke = DUEL.smoke.filter(w => {
      w.t++; w.x += w.vx; w.y += w.vy; w.vy *= 0.97; w.r += 0.14;
      return w.t < w.life;
    });
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
    x.globalAlpha = 0.13 * DUEL.lamp;
    x.fillStyle = '#ffd75e';
    x.beginPath();
    x.moveTo(180 + sway, 16 - DUEL.OY); x.lineTo(46 + sway * 2, 152); x.lineTo(314 + sway * 2, 152);
    x.closePath(); x.fill();
    x.globalAlpha = 0.09 * DUEL.lamp;
    x.beginPath();
    x.moveTo(180 + sway, 16 - DUEL.OY); x.lineTo(98 + sway * 2, 152); x.lineTo(262 + sway * 2, 152);
    x.closePath(); x.fill();
    x.restore();

    if (DUEL.room !== 'back') DUEL.drawHouse(x);

    /* --- table shadow, grounding it on the swirl --- */
    x.globalAlpha = 0.35;
    SPR.ellipse(x, 182, 158, 168, 42, '#050308');
    x.globalAlpha = 1;

    FX.draw(x, DUEL.t);

    /* --- the mark, alive or falling --- */
    if (!DUEL.opp.gone) {
      const o = DUEL.opp;
      /* the blink rides over any expression calm enough to have lids */
      const CALM = { neutral: 1, smug: 1, worry: 1, grin: 1, angry: 1 };
      const shown = (DUEL.blink > 0 && CALM[DUEL.exprName] && o.fall < 0)
        ? 'blink' : DUEL.exprName;
      const comp = DUEL.composite(o.fall >= 0 ? 'dead' : shown);
      const bob = Math.sin(DUEL.t / 34) * 1.4;
      /* and he shifts his weight, slowly, the way anybody does after an hour
         in a hard chair — two sines so it never loops obviously */
      const lean = Math.sin(DUEL.t / 191) * 1.5 + Math.sin(DUEL.t / 73) * 0.5;
      x.save();
      x.translate(180 + (o.fall < 0 ? Math.round(lean) : 0), 130);
      if (o.fall < 0) x.rotate(lean * 0.005);
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
      DUEL.drawGore(x);
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
      if (o.fall < 0) DUEL.drawReact(x);
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

    /* --- the room's flies, and what goes out for them --- */
    if (!DUEL.opp.gone && DUEL.opp.fall < 0) { DUEL.drawFlies(x); DUEL.drawTongue(x); }

    /* --- the round in the air. It gets its own layer, over everybody. --- */
    if (DUEL.slug) DUEL.drawSlug(x);

    /* --- and if you are the one going, he stands up over the lens --- */
    if (DUEL.dying > 0 && G.duel && !DUEL.opp.gone) {
      const comp = DUEL.composite('grin');
      const t2 = U.clamp(DUEL.dying, 0, 1);
      x.save();
      x.globalAlpha = 1;
      const k = 1.5 + t2 * 1.5;
      const cy = 150 + (1 - t2) * 60;
      x.translate(180, cy);
      x.drawImage(comp.cv, -comp.cv.width * k / 2, -comp.cv.height * k,
        comp.cv.width * k, comp.cv.height * k);
      x.restore();
      /* his shadow falling over you */
      x.globalAlpha = 0.42 * t2;
      x.fillStyle = '#05060a';
      x.fillRect(-60, -DUEL.OY, 480, 400);
      x.globalAlpha = 1;
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

    if (DUEL.room === 'back') {
      DUEL.drawBackRoom(x);
      /* the law comes through the back door too — this branch used to skip
         COPS.draw entirely, so the siren and the callout fired at a cop who
         was never on screen */
      COPS.draw(x, DUEL.t);
      DUEL.drawCorpse(x);
      /* the trail goes ON TOP of him: it is between the door and the body
         and half of it is smeared over his own coat */
      DUEL.drawStains(x);
      DUEL.drawSpots(x);
      DUEL.drawSmoke(x);
      DUEL.parts.forEach(p => {
        x.globalAlpha = Math.max(0, 1 - p.t / p.life);
        x.fillStyle = p.col;
        x.fillRect(Math.round(p.x), Math.round(p.y), p.s || 2, p.s || 2);
      });
      x.globalAlpha = 1;
      FX.drawFront(x, DUEL.t);
      DUEL.drawYou(x);
      x.restore();
      FX.drawScreen(x, W, H);
      COPS.drawOverlay(x, W, H);
      return;
    }

    /* --- the table: the far half is an ellipse, the near half runs off the
       bottom of the frame, because that is where your own edge of the felt
       actually is when you are sitting at it --- */
    const TY = DUEL.TY();
    SPR.ellipse(x, 180, TY, 164, 38, P.K);
    SPR.ellipse(x, 180, TY - 1, 161, 36, P.b);
    SPR.ellipse(x, 180, TY + 1, 158, 34, P.u);
    /* grain running round the rail, and the tacks catching it */
    x.save();
    x.beginPath();
    x.ellipse(180, TY, 161, 36, 0, 0, Math.PI * 2);
    x.clip();
    for (let i = -160; i < 160; i += 5) {
      PIX.rect(x, 180 + i, TY - 38, 1, 76, i % 15 === 0 ? 'rgba(0,0,0,.20)' : 'rgba(0,0,0,.10)');
    }
    for (let i = -150; i < 150; i += 23) {
      PIX.rect(x, 180 + i + 2, TY - 34 + ((i * 7) % 60), 6, 1, 'rgba(255,255,255,.07)');
    }
    x.restore();
    SPR.ellipse(x, 180, TY - 2, 154, 32, P.K);
    SPR.ellipse(x, 180, TY - 3, 151, 31, P.e);
    DUEL.nearFelt(x, TY);
    /* the weave: baize is not a flat green, it is a nap you can see */
    x.save();
    x.beginPath();
    x.ellipse(180, TY - 3, 150, 30, 0, 0, Math.PI * 2);
    x.clip();
    x.globalAlpha = 0.16;
    for (let yy = TY - 34; yy < TY + 34; yy += 2) {
      PIX.rect(x, 26, yy, 308, 1, PIX.PAL.E);
      PIX.rect(x, 26 + ((yy & 2) ? 1 : 0), yy + 1, 308, 1, PIX.PAL.f);
    }
    x.globalAlpha = 1;
    x.restore();
    x.globalAlpha = 0.35;
    SPR.ellipse(x, 180, TY - 16, 92, 12, P.f);
    x.globalAlpha = 0.18;
    SPR.ellipse(x, 180, TY - 19, 62, 8, P.F);
    x.globalAlpha = 1;

    /* --- blood on the felt --- */
    DUEL.decals.forEach(d => { SPR.ellipse(x, d.x, d.y, d.r * 1.6, d.r * 0.7, d.col); });
    FX.drawFelt(x);

    /* felt decor: theirs across the table, yours down at the near edge */
    DUEL.chipStack(x, 92, TY + 8, 4, P.r, P.R);
    DUEL.chipStack(x, 104, TY + 12, 2, P.l, P.L);
    DUEL.chipStack(x, 262, TY + 6, 3, P.g, P.G);
    DUEL.myProps(x, DUEL.FY);

    /* --- the corpse, when it's time to go through him --- */
    if (DUEL.corpse) { DUEL.drawCorpse(x); DUEL.drawSpots(x); }

    /* --- casings --- */
    DUEL.casings.forEach(c => {
      x.save(); x.translate(c.x, c.y); x.rotate(c.rot);
      PIX.rect(x, -2, -1, 5, 2, P.K); PIX.rect(x, -1, -1, 3, 2, P.g);
      x.restore();
    });

    /* --- powder smoke, off the muzzle and out of the cylinder gap --- */
    DUEL.drawSmoke(x);

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
    /* the flash is light: it goes over the iron and your hand both */
    DUEL.drawMuzzle(x, myPose ? myPose.bob : 0);

    /* --- the lamp itself --- */
    const lampY = -DUEL.OY;   // hangs from the real top of the screen
    PIX.rect(x, 179 + sway * 0.3, lampY - 2, 2, 10, P.T);
    x.fillStyle = P.K;
    x.beginPath(); x.moveTo(180 + sway, lampY + 5); x.lineTo(162 + sway, lampY + 20); x.lineTo(198 + sway, lampY + 20); x.closePath(); x.fill();
    x.fillStyle = P.g;
    x.beginPath(); x.moveTo(180 + sway, lampY + 8); x.lineTo(165 + sway, lampY + 19); x.lineTo(195 + sway, lampY + 19); x.closePath(); x.fill();
    PIX.rect(x, 176 + sway, lampY + 19, 8, 3, DUEL.lamp > 0.4 ? P.Y : P.T);
    if (DUEL.lamp > 0.6) DUEL.drawMoths(x, 180 + sway, lampY + 22);

    x.restore();

    /* --- where the shot goes, drawn on the thing it goes into --- */
    if (G.phase === 'duel' && G.duel && !G.duel.over && !DUEL.busy &&
        G.duel.turn === 'you' && DUEL.viewT < 0.5 && !DUEL.opp.gone &&
        (DUEL.aim === 'foe' || DUEL.hoverFace)) {
      /* world space, but outside the shake: a sight picture that jitters
         with the room reads as a bug, not as recoil */
      x.save();
      x.translate(Math.round(DUEL.OX), Math.round(DUEL.OY));
      x.globalAlpha = 1 - DUEL.viewT * 2;
      DUEL.drawReticle(x, 182, 42, DUEL.aim === 'foe');
      x.globalAlpha = 1;
      x.restore();
    }

    /* --- the camera round on yourself --- */
    if (DUEL.viewT > 0.004) DUEL.drawSelfView(x, W, H);

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

    if (DUEL.dark > 0.002) {
      x.globalAlpha = Math.min(1, DUEL.dark);
      x.fillStyle = '#05080a';
      x.fillRect(0, 0, W, H);
      x.globalAlpha = 1;
      /* he is already sitting there in the dark, waiting for you */
      if (DUEL.dark > 0.4 && !DUEL.opp.gone && DUEL.t % 90 > 6) {
        const gy = DUEL.OY + 40 + Math.round(Math.sin(DUEL.t / 34) * 1.4);
        x.globalAlpha = Math.min(1, (DUEL.dark - 0.35) * 2.4);
        PIX.rect(x, DUEL.OX + 165, gy, 3, 2, P.Y);
        PIX.rect(x, DUEL.OX + 193, gy, 3, 2, P.Y);
        x.globalAlpha = 1;
      }
    }
    FX.drawScreen(x, W, H);
    COPS.drawOverlay(x, W, H);
  },

  /* ============================================================
     THE BODY.

     He is not an exploded sprite. He is a frog lying on his back
     with his head lolled toward you — built limb by limb out of the
     same tapered tubes the near arms use, ink pass then fill pass so
     the whole thing is one silhouette, with his own suit on it and
     his own face still on the front of his head.

     Everything is in HIS local space, origin at the middle of his
     chest, so the same body works on the felt and on the back room
     floor and the search spots come along with him.
     ============================================================ */
  corpseAt() {
    return DUEL.room === 'back'
      ? { x: 186, y: DUEL.FY - 40 }
      : { x: 196, y: 130 };
  },

  /* ============================================================
     THE BACK ROOM. Concrete, crates, one bulb on a wire, a drain
     in the floor and a door you came through. Nobody is looking.
     ============================================================ */
  drawBackRoom(x) {
    const P = PIX.PAL, FY = DUEL.FY;
    const HZ = FY - 96;                       // where the wall meets the floor
    /* the back wall, block-laid */
    PIX.rect(x, -60, -DUEL.OY, 480, HZ + DUEL.OY, '#241f28');
    for (let y = -DUEL.OY; y < HZ; y += 9) {
      PIX.rect(x, -60, y, 480, 1, '#1b1721');
      for (let bx = -60 + ((y / 9 | 0) % 2 ? 0 : 17); bx < 420; bx += 34) {
        PIX.rect(x, bx, y, 1, 9, '#1b1721');
      }
    }
    /* the floor, running away under him */
    for (let y = HZ; y < DUEL.H - DUEL.OY + 2; y++) {
      const t = (y - HZ) / Math.max(1, FY + 20 - HZ);
      const col = t < 0.3 ? '#2c2b30' : t < 0.62 ? '#26252b' : '#1d1c22';
      PIX.rect(x, -60, y, 480, 1, col);
      if (y % 7 === 0) PIX.rect(x, -60, y, 480, 1, 'rgba(0,0,0,.20)');
    }
    PIX.rect(x, -60, HZ - 1, 480, 2, P.K);
    /* the drain he is lying next to */
    SPR.ellipse(x, 268, FY - 30, 13, 5, P.K);
    SPR.ellipse(x, 268, FY - 31, 11, 4, '#15141a');
    for (let i = -2; i <= 2; i++) PIX.rect(x, 262 + i * 3, FY - 34, 1, 6, '#3a3842');
    /* the door you came through */
    PIX.rect(x, 296, HZ - 54, 46, 55, P.K);
    PIX.rect(x, 298, HZ - 52, 42, 53, '#3b2f26');
    PIX.rect(x, 300, HZ - 50, 38, 4, '#4a3b2e');
    PIX.rect(x, 300, HZ - 24, 38, 4, '#4a3b2e');
    PIX.disc(x, 304, HZ - 26, 2, P.g);
    /* crates stacked against the wall */
    const crate = (cx2, cy2, w, h) => {
      PIX.rect(x, cx2, cy2, w, h, P.K);
      PIX.rect(x, cx2 + 1, cy2 + 1, w - 2, h - 2, P.u);
      PIX.rect(x, cx2 + 1, cy2 + 1, w - 2, 2, P.b);
      PIX.rect(x, cx2 + 1, cy2 + (h >> 1), w - 2, 2, P.U);
      PIX.rect(x, cx2 + (w >> 1) - 1, cy2 + 1, 2, h - 2, P.U);
    };
    crate(36, HZ - 30, 34, 30);
    crate(42, HZ - 54, 26, 24);
    crate(76, HZ - 22, 26, 22);
    /* a mop in a bucket */
    PIX.rect(x, 118, HZ - 4, 16, 12, P.K);
    PIX.rect(x, 119, HZ - 3, 14, 10, P.t);
    PIX.rect(x, 119, HZ - 3, 14, 2, P.s);
    PIX.rect(x, 124, HZ - 34, 3, 31, P.K);
    PIX.rect(x, 124, HZ - 34, 2, 30, P.b);
    PIX.rect(x, 120, HZ - 38, 11, 6, P.K);
    PIX.rect(x, 121, HZ - 37, 9, 4, P.w);
    /* one bulb on a wire, swinging a little */
    const sway = Math.sin(DUEL.t / 90) * 4;
    x.save();
    x.globalAlpha = 0.10 * DUEL.lamp;
    x.fillStyle = '#ffd75e';
    x.beginPath();
    x.moveTo(186 + sway, 6 - DUEL.OY);
    x.lineTo(96 + sway * 2, FY + 10);
    x.lineTo(276 + sway * 2, FY + 10);
    x.closePath(); x.fill();
    x.restore();
    PIX.rect(x, 186 + sway * 0.4, -DUEL.OY, 1, HZ - 66 + DUEL.OY, P.T);
    PIX.disc(x, 186 + sway, HZ - 62, 5, P.K);
    PIX.disc(x, 186 + sway, HZ - 62, 4, DUEL.lamp > 0.4 ? P.Y : P.t);
    PIX.rect(x, 184 + sway, HZ - 68, 4, 4, P.s);
  },

  drawCorpse(x) {
    const P = PIX.PAL, INK = P.K;
    const opp = G.duel.opp, d = opp.def;
    const at = DUEL.corpseAt();
    const jig = DUEL.jiggle * Math.sin(DUEL.t * 1.7);
    const suit = SPR.outerColor(d);
    const suitD = 'rgba(0,0,0,.36)';
    const suitL = 'rgba(255,255,255,.08)';
    const cuff = SPR.cuffColor(d);
    const skin = P[d.skin[0]] || P.F, skinD = P[d.skin[1]] || P.f;
    const trou = P.k;

    /* out back there is one bulb and it is right over him */
    if (DUEL.room === 'back') {
      x.globalAlpha = 0.13 * DUEL.lamp;
      SPR.ellipse(x, at.x, at.y + 6, 96, 30, PIX.PAL.Y);
      x.globalAlpha = 0.09 * DUEL.lamp;
      SPR.ellipse(x, at.x, at.y + 4, 66, 20, PIX.PAL.Y);
      x.globalAlpha = 1;
    }

    /* the pool, first and underneath: it keeps creeping outward */
    SPR.ellipse(x, at.x - 4, at.y + 12, DUEL.pool * 2.4, DUEL.pool * 0.5, P.D);
    SPR.ellipse(x, at.x - 8, at.y + 11, DUEL.pool * 1.8, DUEL.pool * 0.34, P.d);

    x.save();
    x.translate(at.x, at.y + jig);

    /* --- the limbs, behind the torso so their roots never show --- */
    /* far arm, thrown up over his head */
    SPR.povTube(x, -16, -9, -36, -20, 10, 8, suit, suitD, suitL);
    PIX.rect(x, -40, -23, 8, 5, INK);
    PIX.rect(x, -39, -22, 6, 3, cuff);
    PIX.disc(x, -43, -20, 4, INK);
    PIX.disc(x, -43, -20, 3, skin);
    /* near arm, flung out toward you, fingers open */
    SPR.povTube(x, -15, 9, -30, 24, 11, 9, suit, suitD, suitL);
    PIX.rect(x, -34, 21, 8, 6, INK);
    PIX.rect(x, -33, 22, 6, 4, cuff);
    PIX.disc(x, -35, 28, 5, INK);
    PIX.disc(x, -35, 28, 4, skin);
    [[-5, 3], [-1, 5], [3, 4]].forEach(f => {
      PIX.rect(x, -35 + f[0] - 1, 28 + f[1] - 1, 3, 6, INK);
      PIX.rect(x, -35 + f[0], 28 + f[1] - 1, 1, 5, skin);
      PIX.disc(x, -35 + f[0], 28 + f[1] + 4, 2, INK);
      PIX.disc(x, -35 + f[0], 28 + f[1] + 4, 1, skin);
    });
    if (d.rings) { PIX.rect(x, -38, 26, 3, 2, P.G); PIX.rect(x, -33, 25, 3, 2, P.G); }
    /* legs, one cocked over the other */
    SPR.povTube(x, 19, -5, 44, -16, 12, 9, trou, 'rgba(0,0,0,.4)', suitL);
    SPR.povTube(x, 19, 6, 46, 11, 13, 10, trou, 'rgba(0,0,0,.4)', suitL);
    [[47, -18], [50, 9]].forEach((sh, i) => {
      PIX.rect(x, sh[0] - 2, sh[1] - 3, 12, 8, INK);
      PIX.rect(x, sh[0] - 1, sh[1] - 2, 10, 6, P.u);
      PIX.rect(x, sh[0] - 1, sh[1] - 2, 10, 2, P.b);
      PIX.rect(x, sh[0] + 7, sh[1] - 2, 2, 6, P.U);
      if (i) PIX.rect(x, sh[0] + 1, sh[1] - 3, 4, 1, P.W);       // sole showing
    });

    /* --- the torso, lying flat: one slab with his suit on it --- */
    SPR.rrect(x, -28, -17, 56, 34, 8, INK);
    SPR.rrect(x, -27, -16, 54, 32, 7, suit);
    SPR.rrect(x, -27, 6, 54, 10, 6, 'rgba(0,0,0,.26)');
    PIX.rect(x, -25, -14, 50, 2, 'rgba(255,255,255,.10)');
    /* the shirt and tie down the middle of him */
    PIX.rect(x, -14, -16, 11, 32, INK);
    PIX.rect(x, -13, -15, 9, 30, P[d.shirt] || P.W);
    PIX.rect(x, -13, -15, 9, 2, 'rgba(0,0,0,.16)');
    if (d.tie) {
      PIX.rect(x, -11, -9, 5, 20, INK);
      PIX.rect(x, -10, -8, 3, 18, P[d.tie] || P.d);
      PIX.rect(x, -10, -8, 3, 1, 'rgba(255,255,255,.18)');
    }
    /* two lapels folded back off the shirt, not a fan of stripes */
    [-1, 1].forEach(sgn => {
      for (let i = 0; i < 9; i++) {
        const w = 9 - i;
        PIX.rect(x, -4, sgn > 0 ? -3 + i * 2 : -3 - i * 2 - 1, w + 1, 2, INK);
        PIX.rect(x, -4, sgn > 0 ? -3 + i * 2 : -3 - i * 2, w, 1, suit);
        PIX.rect(x, -4, sgn > 0 ? -3 + i * 2 : -3 - i * 2, w, 1,
          sgn > 0 ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.08)');
      }
    });
    PIX.rect(x, 8, -3, 3, 3, P.G);                                // his stickpin

    /* the wounds your lead put in him, and what runs out of them */
    DUEL.wounds.forEach((w, i) => {
      const wx = -12 + (i * 11) % 34, wy = -9 + ((w.y | 0) % 18);
      PIX.disc(x, wx, wy, w.big ? 3 : 2, INK);
      PIX.disc(x, wx, wy, w.big ? 2 : 1, P.D);
      PIX.rect(x, wx - 1, wy + 2, 2, 6 + (i % 3) * 3, P.d);
    });

    /* --- the head, lolled back toward you, face still on the front --- */
    x.save();
    x.translate(-40, -2);
    x.rotate(-0.42);
    const head = SPR.frogCustom(DUEL.oppKey + ':dead', d, 'dead');
    const hk = 1.1;
    x.drawImage(head, -Math.round(head.width * hk / 2), -Math.round(head.height * hk / 2),
      Math.round(head.width * hk), Math.round(head.height * hk));
    x.restore();
    /* his collar, closing the gap between head and chest */
    PIX.rect(x, -30, -11, 10, 21, INK);
    PIX.rect(x, -29, -10, 8, 19, suit);
    PIX.rect(x, -29, -10, 2, 19, 'rgba(255,255,255,.09)');

    x.restore();

    /* his hat, knocked clean off and lying beside him */
    if (d.hat || d.flatcap) {
      const hx = at.x + 58, hy = at.y + 6;
      SPR.ellipse(x, hx, hy + 2, 15, 5, P.K);
      SPR.ellipse(x, hx, hy, 14, 4, P[d.hatCol] || P.T);
      SPR.ellipse(x, hx, hy - 1, 12, 3, 'rgba(255,255,255,.08)');
      PIX.disc(x, hx - 1, hy - 4, 7, P.K);
      PIX.disc(x, hx - 1, hy - 4, 6, P[d.hatCol] || P.T);
      PIX.rect(x, hx - 8, hy - 3, 15, 2, P[d.band] || P.d);
    }

    /* flies, because he has been down a while */
    for (let i = 0; i < 3; i++) {
      const a = DUEL.t / (14 + i * 3) + i * 2.1;
      const fx = at.x + Math.cos(a) * (22 + i * 11) + Math.sin(DUEL.t / 7 + i) * 2;
      const fy = at.y - 22 + Math.sin(a * 1.3) * 9;
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
  /* two moths working the lamp. Nothing depends on them; a hanging bulb
     over a card table with nothing circling it looks switched off. */
  moths: [],
  drawMoths(x, lx, ly) {
    const P = PIX.PAL;
    if (!DUEL.moths.length) {
      DUEL.moths = [
        { r: 13, a: 0, sp: 0.031, dy: 5, ry: 4 },
        { r: 21, a: 2.4, sp: -0.021, dy: 11, ry: 7 },
      ];
    }
    DUEL.moths.forEach((m, i) => {
      m.a += m.sp;
      const mx = Math.round(lx + Math.cos(m.a) * m.r);
      const my = Math.round(ly + m.dy + Math.sin(m.a * 1.6) * m.ry);
      const flap = (DUEL.t + i * 3) % 8 < 4;
      PIX.rect(x, mx - 1, my, 3, 2, P.w);
      if (flap) { PIX.rect(x, mx - 3, my - 2, 2, 3, P.q); PIX.rect(x, mx + 2, my - 2, 2, 3, P.q); }
      else { PIX.rect(x, mx - 2, my - 1, 2, 2, P.w); PIX.rect(x, mx + 2, my - 1, 2, 2, P.w); }
    });
  },

  /* ============================================================
     THE TONGUE.

     A verlet chain of nine points anchored in his mouth. It is not
     an animation curve: it has momentum and it sags, so when it
     snaps out at a fly the whole length whips after the tip and
     comes back slack. Every frog in the room does this; it is the
     one thing they are all still good at.
     ============================================================ */
  TN: 9,
  initTongue() {
    const m = DUEL.mouthAt();
    DUEL.tongue = { pts: [], mode: 'idle', tx: m.x, ty: m.y, fly: null, cool: 120 };
    for (let i = 0; i < DUEL.TN; i++) {
      DUEL.tongue.pts.push({ x: m.x, y: m.y, px: m.x, py: m.y });
    }
    DUEL.flies = [];
    for (let i = 0; i < 4; i++) {
      DUEL.flies.push({
        cx: 100 + i * 56, cy: 34 + (i % 3) * 26, r: 14 + (i % 3) * 8,
        x: 100 + i * 56, y: 34 + (i % 3) * 26, a: i * 1.7, sp: 0.026 + i * 0.005, alive: true,
      });
    }
  },

  /* where his mouth is in world space, bobbing with him */
  mouthAt() {
    return { x: 180, y: 58 + Math.round(Math.sin(DUEL.t / 34) * 1.4) };
  },

  stepFlies() {
    if (!DUEL.flies.length) return;
    DUEL.flies.forEach(f => {
      if (!f.alive) {
        if (--f.respawn <= 0) { f.alive = true; f.cx = 100 + Math.random() * 160; f.cy = 20 + Math.random() * 70; }
        return;
      }
      /* each one works its own patch of the room, so the tongue has to travel */
      f.a += f.sp;
      f.cx += Math.cos(f.a * 0.31) * 0.5;
      f.cy += Math.sin(f.a * 0.23) * 0.34;
      f.cx = U.clamp(f.cx, 96, 268);
      f.cy = U.clamp(f.cy, 18, 96);
      f.x = f.cx + Math.cos(f.a * 2.1) * f.r;
      f.y = f.cy + Math.sin(f.a * 3.1) * f.r * 0.55;
    });
  },

  stepTongue() {
    const T = DUEL.tongue;
    if (!T) return;
    const alive = !DUEL.opp.gone && DUEL.opp.fall < 0 && G.phase === 'duel';
    const m = DUEL.mouthAt();
    const pts = T.pts, n = pts.length, tip = pts[n - 1];

    if (!alive) {
      if (T.mode !== 'idle') { T.mode = 'idle'; T.fly = null; }
      pts.forEach(p => { p.x = m.x; p.y = m.y; p.px = m.x; p.py = m.y; });
      return;
    }

    /* idle: wait, then go for whatever is closest and worth the trip */
    if (T.mode === 'idle' && --T.cool <= 0) {
      let best = null, bd = 120 * 120;
      DUEL.flies.forEach(f => {
        if (!f.alive) return;
        const d = (f.x - m.x) * (f.x - m.x) + (f.y - m.y) * (f.y - m.y);
        if (d < bd) { bd = d; best = f; }
      });
      if (best) {
        T.mode = 'out'; T.fly = best; T.tx = best.x; T.ty = best.y;
        SFX.tone(1500, 0.05, 'sine', 0.05, 0, -900);
      } else T.cool = 40;
    }

    /* verlet: momentum, a little drag, and gravity once it is out */
    const out = T.mode !== 'idle';
    pts.forEach((p, i) => {
      if (!i) return;
      const vx = (p.x - p.px) * 0.88, vy = (p.y - p.py) * 0.88;
      p.px = p.x; p.py = p.y;
      p.x += vx; p.y += vy + (out ? 0.24 : 0.05);
    });

    if (T.mode === 'out') {
      T.tx = T.fly.x; T.ty = T.fly.y;
      tip.x += (T.tx - tip.x) * 0.30;
      tip.y += (T.ty - tip.y) * 0.30;
      if (Math.abs(tip.x - T.tx) < 4 && Math.abs(tip.y - T.ty) < 4) {
        T.mode = 'back';
        T.fly.alive = false; T.fly.respawn = 260 + ((Math.random() * 200) | 0);
        SFX.tick();
      }
    } else if (T.mode === 'back') {
      tip.x += (m.x - tip.x) * 0.26;
      tip.y += (m.y - tip.y) * 0.26;
      if (Math.abs(tip.x - m.x) < 5 && Math.abs(tip.y - m.y) < 5) {
        T.mode = 'idle'; T.fly = null;
        T.cool = 200 + ((Math.random() * 260) | 0);
        SFX.cluck();
        if (DUEL.exprTimer <= 0) DUEL.setExpr('grin', 26);
      }
    }

    /* one constraint: the chain always spans mouth→tip, evenly. The sag
       comes out of the verlet, not out of the spacing. */
    const dx = tip.x - m.x, dy = tip.y - m.y;
    const seg = Math.max(0.4, Math.sqrt(dx * dx + dy * dy) / (n - 1));
    for (let k = 0; k < 3; k++) {
      pts[0].x = m.x; pts[0].y = m.y;
      for (let i = 1; i < n; i++) {
        const a = pts[i - 1], b = pts[i];
        const ex = b.x - a.x, ey = b.y - a.y;
        const d = Math.sqrt(ex * ex + ey * ey) || 1;
        const f = (d - seg) / d * (i === n - 1 ? 0.5 : 0.62);
        b.x -= ex * f; b.y -= ey * f;
        if (i > 1) { a.x += ex * f * 0.5; a.y += ey * f * 0.5; }
      }
    }
  },

  drawFlies(x) {
    const P = PIX.PAL;
    DUEL.flies.forEach((f, i) => {
      if (!f.alive) return;
      const fx = Math.round(f.x), fy = Math.round(f.y);
      PIX.rect(x, fx, fy, 2, 2, P.K);
      if ((DUEL.t + i) % 4 < 2) {
        PIX.rect(x, fx - 2, fy - 2, 2, 2, P.q);
        PIX.rect(x, fx + 2, fy - 2, 2, 2, P.q);
      } else {
        PIX.rect(x, fx - 2, fy, 2, 1, P.w);
        PIX.rect(x, fx + 2, fy, 2, 1, P.w);
      }
    });
  },

  drawTongue(x) {
    const T = DUEL.tongue;
    if (!T || T.mode === 'idle') return;
    const P = PIX.PAL, pts = T.pts, n = pts.length;
    /* ink pass down the whole length, then the meat of it, then a gloss */
    for (let pass = 0; pass < 3; pass++) {
      const w = pass === 0 ? 5 : pass === 1 ? 3 : 1;
      const col = pass === 0 ? P.K : pass === 1 ? P.r : P.R;
      for (let i = 1; i < n; i++) {
        const a = pts[i - 1], b = pts[i];
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y))));
        for (let s2 = 0; s2 <= steps; s2++) {
          const t = s2 / steps;
          const px = Math.round(a.x + (b.x - a.x) * t) - (w >> 1);
          const py = Math.round(a.y + (b.y - a.y) * t) - (w >> 1);
          PIX.rect(x, px, py, w, w, col);
        }
      }
    }
    const tip = pts[n - 1];
    PIX.disc(x, tip.x, tip.y, 4, P.K);
    PIX.disc(x, tip.x, tip.y, 3, P.r);
    PIX.rect(x, tip.x - 2, tip.y - 2, 2, 1, P.R);
    /* the fly stuck to the end of it on the way back */
    if (T.mode === 'back' && T.fly) {
      PIX.rect(x, tip.x - 1, tip.y - 1, 2, 2, P.K);
    }
  },

  /* ============================================================
     GOING THROUGH HIM.

     The pockets are not a list of buttons that happen to sit next to a
     corpse — they are places ON him. Each one is a spot you can see,
     point at and put your hand into, and your hand really goes there:
     out across the felt, shrinking with the distance, digging, and
     coming back with whatever was in it.
     ============================================================ */
  /* offsets in HIS space, so they travel with the body */
  SPOTS: {
    hat:     [58, 2],         // knocked off, lying beside him
    jacket:  [-11, -8],       // inside the coat
    shirt:   [9, 4],
    vest:    [9, 4],
    hand:    [-35, 30],       // the splayed hand, rings and all
    boot:    [51, -18],       // the cocked shoe
    tooth:   [-44, -5],       // his mouth
    holster: [19, 11],        // under the arm
  },
  spotPos(p) {
    const o = DUEL.SPOTS[p.id] || [0, 0], at = DUEL.corpseAt();
    return [at.x + o[0], at.y + o[1]];
  },

  /* the nearest searchable spot to a world point, or -1 */
  spotAt(px, py) {
    if (G.phase !== 'loot' || !G.loot) return -1;
    let best = -1, bd = 15 * 15;
    G.loot.pockets.forEach((p, i) => {
      const sp = DUEL.spotPos(p);
      const d = (px - sp[0]) * (px - sp[0]) + (py - sp[1]) * (py - sp[1]);
      if (d < bd && E.canSearch(i)) { bd = d; best = i; }
    });
    return best;
  },

  drawSpots(x) {
    if (G.phase !== 'loot' || !G.loot || DUEL.reach) return;
    if (G.loot.caught) return;
    const P = PIX.PAL;
    const pulse = DUEL.t % 44 < 22;
    G.loot.pockets.forEach((p, i) => {
      const sp = DUEL.spotPos(p), sx = sp[0], sy = sp[1];
      const can = E.canSearch(i);
      if (p.taken && !can) {
        /* turned out and empty: the lining hanging out of it */
        PIX.rect(x, sx - 5, sy - 3, 11, 7, P.K);
        PIX.rect(x, sx - 4, sy - 2, 9, 5, p.slit ? P.q : P.w);
        if (p.slit) PIX.rect(x, sx - 4, sy, 9, 1, P.K);
        return;
      }
      const hot = DUEL.hoverSpot === i;
      const col = !can ? P.q : (p.bulge && p.seen) ? P.G : hot ? P.Y : P.W;
      const r = hot ? 10 : 8;
      /* four corner brackets — a place to put your hand, not a button */
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(o => {
        const cx = sx + o[0] * r, cy = sy + o[1] * r;
        const bx = o[0] > 0 ? cx - 3 : cx, by = o[1] > 0 ? cy - 3 : cy;
        PIX.rect(x, bx - 1, cy - 1, 6, 3, P.K);
        PIX.rect(x, cx - 1, by - 1, 3, 6, P.K);
        PIX.rect(x, bx, cy, 4, 1, col);
        PIX.rect(x, cx, by, 1, 4, col);
      });
      if (can && pulse) {
        PIX.rect(x, sx - 1, sy - 4, 3, 9, P.K);
        PIX.rect(x, sx - 4, sy - 1, 9, 3, P.K);
        PIX.rect(x, sx, sy - 3, 1, 7, col);
        PIX.rect(x, sx - 3, sy, 7, 1, col);
      }
      if (p.bulge && p.seen && !p.taken) {          // the loupe showed you this
        PIX.disc(x, sx + r + 4, sy - r - 2, 3, P.K);
        PIX.disc(x, sx + r + 4, sy - r - 2, 2, P.G);
      }
    });
  },

  /* ============================================================
     THE MESS ON THE FLOOR.
     He left a trail coming through the door. Every stain is a
     thing somebody finds in the morning unless you go over it
     with a rag, and the rag costs you clock.
     ============================================================ */
  stainPos(st) {
    return [st.x, DUEL.FY - 34 + st.y];
  },

  stainAt(px, py) {
    if (G.phase !== 'loot' || !G.loot || !G.loot.stains) return -1;
    let best = -1, bd = 16 * 16;
    G.loot.stains.forEach((st, i) => {
      if (st.done) return;
      const sp = DUEL.stainPos(st);
      const dx = px - sp[0], dy = (py - sp[1]) * 1.6;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  },

  drawStains(x) {
    if (G.phase !== 'loot' || !G.loot || !G.loot.stains) return;
    const P = PIX.PAL;
    G.loot.stains.forEach((st, i) => {
      const sp = DUEL.stainPos(st);
      if (st.done) {
        /* wiped: a smear where it was, and boards you can see again */
        PIX.rect(x, sp[0] - st.r, sp[1] - 1, st.r * 2, 2, 'rgba(87,18,32,.22)');
        return;
      }
      const art = SPR.floorStain(st.seed, st.r);
      x.drawImage(art, Math.round(sp[0] - art.width / 2), Math.round(sp[1] - art.height / 2));
      if (DUEL.hoverStain === i && !DUEL.busy && !G.loot.caught) {
        const r = st.r + 4, rr = Math.round(r * 0.7);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(o => {
          const cx = sp[0] + o[0] * r, cy = sp[1] + o[1] * rr;
          const bx = o[0] > 0 ? cx - 3 : cx, by = o[1] > 0 ? cy - 3 : cy;
          PIX.rect(x, bx - 1, cy - 1, 6, 3, P.K);
          PIX.rect(x, cx - 1, by - 1, 3, 6, P.K);
          PIX.rect(x, bx, cy, 4, 1, P.N);
          PIX.rect(x, cx, by, 1, 4, P.N);
        });
      }
    });
  },

  /* go over one with the rag: down, three passes, back */
  async mopAt(i) {
    if (DUEL.busy || G.phase !== 'loot' || !E.canMop(i)) return;
    const st = G.loot.stains[i];
    const sp = DUEL.stainPos(st);
    DUEL.busy = true;
    DUEL.hurry = false;
    DUEL.hoverStain = -1;
    DUEL.reach = { x: sp[0], y: sp[1], dig: 0, rag: true };
    DUEL.fist.tx = sp[0]; DUEL.fist.ty = sp[1] - 6;
    LOOT.sync();
    await DUEL.sleep(220);
    for (let n = 0; n < 3; n++) {
      DUEL.reach.dig = 1;
      DUEL.fist.tx = sp[0] - st.r + (n % 2) * st.r * 2;
      SFX.tick();
      await DUEL.sleep(120);
      DUEL.reach.dig = 0;
      await DUEL.sleep(60);
    }
    const ev = E.mop(i);
    SFX.click();
    if (ev && ev.heard) { SFX.jamSfx(); FX.screen.shake(8); LOOT.heard(); }
    DUEL.reach = null;
    DUEL.setPose('rest');
    await DUEL.sleep(160);
    DUEL.busy = false;
    LOOT.sync();
  },

  /* put your hand in. The arm goes out, it digs, it comes back. */
  async searchAt(i) {
    if (DUEL.busy || G.phase !== 'loot') return;
    if (!E.canSearch(i)) { SFX.jamSfx(); return; }
    const P = PIX.PAL;
    const p = G.loot.pockets[i];
    const sp = DUEL.spotPos(p), sx = sp[0], sy = sp[1];
    const slit = p.taken;
    DUEL.busy = true;
    DUEL.hurry = false;
    DUEL.hoverSpot = -1;
    DUEL.reach = { x: sx, y: sy, dig: 0 };
    DUEL.fist.tx = sx + 5; DUEL.fist.ty = sy + 11;
    LOOT.sync();
    SFX.chak();
    await DUEL.sleep(300);
    /* rummaging: cloth shifting, dust off the lining, his weight rocking */
    for (let n = 0; n < 5; n++) {
      DUEL.reach.dig = 1;
      DUEL.jiggle = 1.1;
      DUEL.puff(sx, sy - 2, 2, [P.q, P.w, P.k], 1.1, -0.4);
      SFX.tick();
      await DUEL.sleep(95);
      DUEL.reach.dig = 0;
      await DUEL.sleep(45);
    }
    LOOT.take(i, sx, sy);
    await DUEL.sleep(260);
    DUEL.reach = null;
    DUEL.setPose('rest');
    await DUEL.sleep(220);
    DUEL.busy = false;
    LOOT.sync();
  },

  /* ============================================================
     THE HOUSE. Whatever is behind him: the rail of the pit, other
     tables with somebody still sitting at them, and the smoke every
     room like this is full of. All of it silhouette — it is not the
     thing you are looking at, it is the reason the thing you ARE
     looking at feels like it is somewhere.
     ============================================================ */
  drawHouse(x) {
    const P = PIX.PAL, FY = DUEL.FY;
    const HZ = DUEL.TY() - 46;
    /* the far wall, falling off toward the floor instead of ending on a line */
    for (let yy = -DUEL.OY; yy < HZ; yy++) {
      const t = U.clamp((yy + DUEL.OY) / Math.max(1, HZ + DUEL.OY), 0, 1);
      x.globalAlpha = 0.20 + t * 0.34;
      PIX.rect(x, -60, yy, 480, 1, '#050c09');
    }
    x.globalAlpha = 1;
    PIX.rect(x, -60, HZ - 3, 480, 3, 'rgba(0,0,0,.5)');
    PIX.rect(x, -60, HZ - 2, 480, 1, 'rgba(162,112,74,.16)');
    /* two more tables further back, each with somebody still at it */
    const DK = 'rgba(3,8,6,.80)';
    [[54, 22], [306, 26]].forEach((t, i) => {
      const tx = t[0], ty = HZ - 5;
      SPR.ellipse(x, tx, ty, t[1], 7, 'rgba(0,0,0,.55)');
      SPR.ellipse(x, tx, ty - 1, t[1] - 2, 5, 'rgba(24,70,54,.30)');
      const bob = Math.round(Math.sin(DUEL.t / (52 + i * 17)));
      /* head, hat brim, crown, shoulders — a frog, not a smudge */
      const hy = ty - 16 + bob;
      SPR.ellipse(x, tx, hy, 8, 6, DK);
      PIX.disc(x, tx - 6, hy - 4, 3, DK);
      PIX.disc(x, tx + 6, hy - 4, 3, DK);
      PIX.rect(x, tx - 11, hy - 8, 23, 2, DK);
      PIX.rect(x, tx - 7, hy - 13, 15, 5, DK);
      SPR.ellipse(x, tx, ty - 4 + bob, 15, 7, DK);
      /* a chip stack and a glass on his table */
      PIX.rect(x, tx + t[1] - 9, ty - 6, 5, 5, DK);
      PIX.rect(x, tx - t[1] + 5, ty - 7, 3, 6, DK);
    });
    /* cigarette haze — wide and low-contrast, or it reads as bars */
    x.globalAlpha = 0.035;
    for (let i = 0; i < 5; i++) {
      const hx = ((DUEL.t * (0.10 + i * 0.035) + i * 150) % 620) - 130;
      SPR.ellipse(x, hx, HZ - 34 + i * 11, 118, 9, i & 1 ? P.w : P.q);
    }
    x.globalAlpha = 1;
    /* dust turning over in the lamp cone */
    if (DUEL.t % 22 === 0) FX.dust && FX.dust(120 + Math.random() * 120, HZ + 10);
  },

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
      if (y % 3 === 0) {                                  // grain across the wood
        PIX.rect(x, 180 - hf - 9, y, 8, 1, 'rgba(0,0,0,.16)');
        PIX.rect(x, 180 + hf + 1, y, 8, 1, 'rgba(0,0,0,.16)');
      }
      span(y, hf + 1, P.K);
      /* the felt goes off toward you: the lamp does not reach this end */
      span(y, hf, t < 0.26 ? P.e : t < 0.50 ? P.E : t < 0.72 ? '#0b2318' : '#071810');
      /* the nap runs on down your end too, just darker */
      if (y % 2 === 0) {
        PIX.rect(x, 180 - hf, y, hf * 2, 1, 'rgba(0,0,0,.10)');
        PIX.rect(x, 180 - hf + 1, y, hf * 2 - 2, 1, 'rgba(255,255,255,.02)');
      }
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

    if (DUEL.room === 'back') {
      /* no table back here: just the floor coming toward you, going dark */
      for (let yy = FY - 12; yy < DUEL.H - DUEL.OY + 2; yy++) {
        const t = (yy - (FY - 12)) / 40;
        PIX.rect(x, -60, yy, 480, 1, t < 0.34 ? '#1d1c22' : t < 0.66 ? '#161519' : '#0f0e12');
      }
    }

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
    const HK = 1.05;

    /* --- your off hand, flat on your own end of the felt --- */
    const lhx = 66, lhy = FY - 12;
    /* the shadow it throws is a stepped block, not a soft oval */
    for (let i = 0; i < 4; i++) {
      PIX.rect(x, lhx - 17 + i * 2, FY - 3 + i, 34 - i * 4, 1, 'rgba(0,0,0,.38)');
    }
    SPR.povSleeve(x, 40, FY + 26, lhx - 2, FY + 2, 30, 21, sC, sD, sL, sS);
    SPR.povCuff(x, lhx, FY - 2, def, -1);
    SPR.povHand(x, lhx, lhy, def, -1, HK, false);

    /* --- your gun hand, or the one that is out over him --- */
    const dig = DUEL.reach ? DUEL.reach.dig * (DUEL.t % 4 < 2 ? 1 : -1) * 2 : 0;
    const fx = Math.round(f.x) + dig, fy = Math.round(f.y) + (dig ? 1 : 0);
    /* it shrinks as it reaches away from you — that is the whole depth cue */
    const away = U.clamp((FY - 6 - fy) / 72, 0, 1);
    const hk = HK - away * 0.5, sh = hk / HK;
    for (let i = 0; i < 4; i++) {
      PIX.rect(x, fx - Math.round(16 * sh) + i * 2, Math.round(fy + 11 * sh) + i,
        Math.round(32 * sh) - i * 4, 1, 'rgba(0,0,0,.34)');
    }
    SPR.povSleeve(x, 332, FY + 26, fx - 2, fy + Math.round(10 * sh),
      32, Math.max(11, Math.round(21 - away * 9)), sC, sD, sL, sS);
    SPR.povCuff(x, fx, fy + Math.round(9 * sh), def, 1);
    SPR.povHand(x, fx, fy, def, 1, hk, mine && !DUEL.corpse);

    x.restore();
    return { aimSelf, aimFoe, mine, bob: Math.round(bob) + drop };
  },

  /* the iron, drawn from your point of view — the fingers close over it after */
  drawYourIron(x, pose) {
    if (!pose || DUEL.corpse) return;
    const P = PIX.PAL;
    const g = DUEL.gun, f = DUEL.fist;
    const gm = DUEL.ironArt();
    const kk = DUEL.kickOff();
    x.save();
    x.translate(0, pose.mine ? pose.bob : 0);
    x.save();
    x.translate(Math.round(g.x + kk.dx), Math.round(g.y + kk.dy));
    x.rotate(g.rot + kk.drot);
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
      const d = DUEL.myDef(), skin = P[d.skin[0]], sh = P[d.skin[1]];
      const fx = Math.round(f.x + kk.dx), fy0 = Math.round(f.y + kk.dy);
      for (let i = 0; i < 2; i++) {
        const gy = fy0 - 5 + i * 7;
        PIX.rect(x, fx - 5, gy, 13, 7, P.K);
        PIX.rect(x, fx - 4, gy + 1, 11, 5, i ? sh : skin);
        PIX.rect(x, fx - 4, gy + 4, 11, 1, P.K);
      }
    } else if (G.duel && !DUEL.opp.gone && DUEL.opp.fall < 0) {
      /* HIS hand. The iron used to hang in the air on his turn with nothing
         holding it — his arm comes up over the felt and closes on the grip,
         out of the same dark his gestures come out of. */
      const od = G.duel.opp.def;
      const C = SPR.costumeOf(od);
      const O = C.overcoat || C.jacket || C.gown || C.shirt || null;
      const cl = (O && O.col) || od.suit;
      const sC = P[cl] || P.T, sL = P[LIGHTER[cl]] || P.t;
      const gpA = gm.grip || [10, 13];
      const gw = DUEL.ironPoint(gpA[0], gpA[1]);
      const gx2 = Math.round(gw.x + kk.dx), gy2 = Math.round(gw.y + kk.dy);
      const side = gx2 > 180 ? 1 : -1;
      SPR.povTube(x, 180 + side * 44, 140, gx2 + side * 8, gy2 + 9,
        15, 11, sC, 'rgba(0,0,0,.45)', sL);
      SPR.povCuff(x, gx2 + side * 3, gy2 + 7, od, side);
      x.save();
      x.translate(gx2, gy2);
      x.rotate(g.rot * 0.5);
      x.scale(side * 0.48, 0.48);
      SPR.frogFist(x, 0, 0, od, {});
      x.restore();
    }
    x.restore();
    /* pointed at the lens: a bore seen end-on, staring back at you */
    if (pose.aimSelf) {
      const t = DUEL.muzzleTip();
      const ty = t.y + pose.bob + kk.dy;
      const tx = t.x + kk.dx;
      PIX.disc(x, tx, ty, 10, P.K);
      PIX.disc(x, tx, ty, 8, P.t);
      PIX.disc(x, tx, ty, 7, P.s);
      PIX.disc(x, tx, ty, 5, P.K);
      PIX.disc(x, tx, ty, 3, P.Z);
      PIX.rect(x, tx - 6, ty - 6, 4, 1, 'rgba(255,255,255,.26)');
      PIX.rect(x, tx - 7, ty - 4, 2, 3, 'rgba(255,255,255,.14)');
    }
  },

  /* ============================================================
     THE FLASH. Not a radial star — a revolver throws a flame
     CONE down the bore with two short petals off the sides, and
     it lights the felt in front of it for three frames.
     ============================================================ */
  drawMuzzle(x, bob) {
    const m = DUEL.muzzle;
    if (!m) return;
    const P = PIX.PAL;
    const k = Math.max(0, 1 - m.t / 7);
    if (k <= 0) return;
    const kk = DUEL.kickOff();
    const mx = m.x + kk.dx, my = m.y + (bob || 0) + kk.dy;
    const c = Math.cos(m.ang), s = Math.sin(m.ang);
    const len = (13 + m.t * 4) * k + 5;

    /* the light it throws, first, so the flame sits on top of it */
    x.globalAlpha = 0.22 * k;
    SPR.ellipse(x, mx + c * 14, my + s * 14 + 5, 36, 13, P.Y);
    x.globalAlpha = 1;

    /* the cone: hottest at the crown, red at the tip */
    const bands = [[1.00, 1.2, P.r], [0.78, 2.1, P.o], [0.52, 3.4, P.O],
                   [0.26, 4.8, P.Y], [0.00, 5.4, P.W]];
    bands.forEach(([d, w, col]) => {
      PIX.disc(x, mx + c * len * d, my + s * len * d, Math.max(1, w * k), col);
    });
    /* two petals off the cylinder gap side, while it is still bright */
    if (m.t < 3) {
      for (let i = -1; i <= 1; i += 2) {
        const px = mx - s * i * 8 * k, py = my + c * i * 8 * k;
        PIX.disc(x, px, py, 2.4 * k, P.O);
        PIX.disc(x, (mx + px) / 2, (my + py) / 2, 3 * k, P.Y);
      }
    }
  },

  /* ============================================================
     THE OTHER ANGLE.

     Turn the gun on yourself and the camera goes with it: round and
     behind your own head, close enough to see the muzzle against
     your temple and the room going out of focus past your ear. The
     table is still back there. So is he. He is watching.
     ============================================================ */
  drawSelfView(x, W, H) {
    const P = PIX.PAL, t = DUEL.viewT;
    const d = DUEL.myDef();
    const skin = P[d.skin[0]], shade = P[d.skin[1]], dark = P[d.skin[2]];
    const INK = P.K, FY = DUEL.FY;

    /* the room goes out. There is nothing to look at now but this. */
    x.save();
    x.globalAlpha = 0.9 * t;
    x.fillStyle = '#05070c';
    x.fillRect(0, 0, W, H);
    x.globalAlpha = 1;
    x.restore();

    x.save();
    x.translate(Math.round(DUEL.OX), Math.round(DUEL.OY));
    /* the camera crosses the table rather than cutting: it swings in from
       HIS side, which is where it now is */
    x.translate(Math.round((1 - t) * -120), Math.round((1 - t) * 26));
    x.globalAlpha = Math.min(1, t * 1.6);

    /* ---- the lamp, now above and behind the lens ---- */
    x.save();
    x.globalAlpha = 0.16 * t * DUEL.lamp;
    x.fillStyle = '#ffd75e';
    x.beginPath();
    x.moveTo(180, -DUEL.OY - 10); x.lineTo(64, FY + 6); x.lineTo(296, FY + 6);
    x.closePath(); x.fill();
    x.restore();

    /* ============================================================
       YOU, FROM WHERE HE IS SITTING.
       Same head rig every frog in this game wears — because that is
       what you look like to somebody across a table — with the iron
       against your own temple and his shoulder in the way.
       ============================================================ */
    const comp = DUEL.selfComposite();
    const K = 1.05;
    const BOT = FY - 16;                              // he sits behind the table
    const CH = Math.round(comp.cv.height * K), CW = Math.round(comp.cv.width * K);
    const TOPY = BOT - CH;
    const hy = TOPY + Math.round(comp.headH * K * 0.55);   // the middle of your face

    /* the chair back behind you: two uprights and a rail, and the wall
       behind THAT going dark. No slats — it read as a fence. */
    [120, 236].forEach(ux => {
      PIX.rect(x, ux, TOPY + 30, 5, FY - 28 - (TOPY + 30), INK);
      PIX.rect(x, ux + 1, TOPY + 31, 3, FY - 30 - (TOPY + 30), '#241f31');
    });
    PIX.rect(x, 118, TOPY + 26, 124, 6, INK);
    PIX.rect(x, 119, TOPY + 27, 122, 4, '#241f31');
    PIX.rect(x, 119, TOPY + 27, 122, 1, '#332c46');

    /* the tremor: your hand is not steady and neither are you */
    const tr = DUEL.busy ? 0 : Math.round(Math.sin(DUEL.t / 2.6) * 1.1);
    const bob = Math.round(Math.sin(DUEL.t / 38) * 1.2);

    x.drawImage(comp.cv, Math.round(180 - CW / 2), TOPY + bob, CW, CH);

    /* ---- what the night has put on your own face ---- */
    if (DUEL.myGore > 0) {
      const gr = U.mulberry32(1337);
      for (let i = 0; i < Math.min(10, DUEL.myGore * 3); i++) {
        const bx = Math.round(152 + gr() * 58), by = Math.round(hy - 20 + gr() * 34);
        const rr = 1 + gr() * 2.2;
        PIX.disc(x, bx, by, rr + 0.6, INK);
        PIX.disc(x, bx, by, rr, P.D);
        const run = 3 + gr() * 12;
        PIX.rect(x, bx - 1, by, 2, run + 1, INK);
        PIX.rect(x, bx, by, 1, run, P.d);
      }
    }

    /* ---- the iron, its muzzle in your temple ---- */
    const gm = DUEL.ironArt();
    const mz = gm.muzzle || [gm.width, gm.height / 2];
    const gp = gm.grip || [10, 13];
    /* Mirror-image logic: from HIS chair your right hand is on the LEFT of
       frame, so the iron comes in from the left and the muzzle presses the
       temple on that side. Unflipped, the body extends away from the muzzle
       and never crosses your face. */
    const sc = 1.0, rot = -0.16;
    const MX = 152, MY = hy - 2 + tr + bob;
    /* the press: a dent and a shadow where steel meets him */
    PIX.rect(x, MX, MY - 4, 8, 9, dark);
    PIX.rect(x, MX + 1, MY - 2, 6, 5, P.E);
    x.save();
    x.translate(MX, MY);
    x.rotate(rot);
    x.drawImage(gm, -mz[0] * sc, -mz[1] * sc, gm.width * sc, gm.height * sc);
    x.restore();
    /* your fist on the grip, worked out from the iron's own anchor */
    const lx = (gp[0] - mz[0]) * sc, ly = (gp[1] - mz[1]) * sc;
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const GX = Math.round(MX + lx * cs - ly * sn), GY = Math.round(MY + lx * sn + ly * cs);
    SPR.povSleeve(x, 78, FY + 6, GX - 12, GY + 12, 26, 18, P.T,
      'rgba(0,0,0,.45)', P.t, 'rgba(100,109,132,.3)');
    x.save();
    x.translate(GX + 2, GY + 2);
    x.rotate(rot - 0.1);
    x.scale(-0.62, 0.62);          // his angle mirrors your hand too
    SPR.frogFist(x, 0, 0, d, { wet: true });
    x.restore();

    /* ---- the table between you, from the other side ---- */
    PIX.rect(x, -40, FY - 16, 480, 3, INK);
    for (let i = 0; i < 12; i++) {
      PIX.rect(x, -40, FY - 13 + i, 480, 1,
        i < 3 ? '#2e7d5b' : i < 7 ? '#1c5540' : '#103527');
    }
    PIX.rect(x, -40, FY - 1, 480, 2, P.u);
    PIX.rect(x, -40, FY + 1, 480, 2, P.U);

    /* ---- and HIS shoulder, in the way, because this is his angle ---- */
    if (!DUEL.opp.gone && G.duel) {
      const oc = G.duel.opp.def;
      const oS = P[oc.suit] || P.T;
      x.save();
      x.globalAlpha = Math.min(1, t * 1.6);
      /* the back of his head, bottom-left, out of focus and very dark */
      SPR.rrect(x, -30, FY - 8, 150, 120, 34, INK);
      SPR.rrect(x, -28, FY - 6, 146, 118, 32, 'rgba(10,9,14,.96)');
      PIX.disc(x, 34, FY - 4, 30, INK);
      PIX.disc(x, 34, FY - 4, 28, 'rgba(14,12,20,.96)');
      PIX.rect(x, -20, FY + 2, 130, 3, 'rgba(120,130,150,.10)');
      void oS;
      x.restore();
    }

    /* the sight picture, on your own head, once the swing has landed */
    if (t > 0.55 && !DUEL.busy) DUEL.drawReticle(x, 180, hy, true);
    x.globalAlpha = 1;
    x.restore();
  },

  /* your own frog, head and shoulders, in the same rig everybody else
     wears — cached, and rebuilt only when your face changes */
  selfComposite() {
    const key = 'me:' + (DUEL.myGore > 0 ? 'hurt' : 'ok') + ':' + (DUEL.blink > 0 ? 'b' : '');
    if (DUEL._meCache && DUEL._meCache.key === key) return DUEL._meCache;
    const d = DUEL.myDef();
    const expr = DUEL.blink > 0 ? 'blink' : DUEL.myGore > 0 ? 'pain' : 'neutral';
    const head = SPR.frogCustom('me' + (DUEL.myGore > 0 ? 'h' : ''), d, expr);
    const body = SPR.bodyCustom('me', d, true);
    const hs = 1.4, NECK = 8;
    const hw = Math.round(head.width * hs), hh = Math.round(head.height * hs);
    const cw = Math.max(body.width, hw) + 2;
    const ch = hh + body.height - NECK;
    const cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(body, Math.round((cw - body.width) / 2), ch - body.height);
    c.drawImage(head, Math.round((cw - hw) / 2), 0, hw, hh);
    DUEL._meCache = { key, cv, headH: hh };
    return DUEL._meCache;
  },

  /* the box your own head fills in the self view, in world coords */
  selfHead() {
    const c = DUEL._meCache;
    const CH = c ? Math.round(c.cv.height * 1.05) : 118;
    const hh = c ? Math.round(c.headH * 1.05) : 62;
    const top = DUEL.FY - 16 - CH;
    return { x0: 126, x1: 236, y0: top - 6, y1: top + hh + 8 };
  },

  /* ============================================================
     GORE.
     Not a body coming apart — a frog with a hole in him, in a
     room with one lamp. It lands where the lead landed, it runs
     downhill from there, and it does not wipe off between pulls.
     ============================================================ */
  gore(n) {
    const w = DUEL.wounds[DUEL.wounds.length - 1] || { x: 0, y: -60 };
    for (let i = 0; i < n * 3; i++) {
      DUEL.blood.push({
        x: w.x + (Math.random() - 0.5) * 26,
        y: w.y + (Math.random() - 0.5) * 16,
        r: 1 + Math.random() * 2.2,
        run: 2 + Math.random() * 7,
        grow: 0,
      });
    }
    /* and it keeps running while he sits there */
    DUEL.blood.forEach(b => { b.run = Math.min(15, b.run + Math.random() * 2.5); });
    if (DUEL.blood.length > 60) DUEL.blood.splice(0, DUEL.blood.length - 60);
  },

  drawGore(x) {
    const P = PIX.PAL;
    DUEL.blood.forEach(b => {
      const run = Math.min(b.run, b.grow += 0.35);
      PIX.disc(x, b.x, b.y, b.r + 0.6, P.K);
      PIX.disc(x, b.x, b.y, b.r, P.D);
      if (run > 1) {
        PIX.rect(x, b.x - 1, b.y, 2, run + 1, P.K);
        PIX.rect(x, b.x, b.y, 1, run, P.d);
        PIX.disc(x, b.x, b.y + run, 1.4, P.d);      // the bead at the bottom of it
      }
    });
  },

  /* ============================================================
     WHAT HE SAYS WITHOUT SAYING IT.
     His arms live under the table. When he has an opinion, one
     comes up out of the dark, holds it long enough for you to
     read, and goes back down.
     ============================================================ */
  REACTS: {
    shrug:    { life: 78, snd: 'tick' },
    facepalm: { life: 88, snd: 'dud' },
    finger:   { life: 84, snd: 'chak' },
  },

  reactAt(kind) {
    if (!DUEL.REACTS[kind] || DUEL.opp.gone || DUEL.opp.fall >= 0) return;
    DUEL.react = { kind, t: 0, life: DUEL.REACTS[kind].life };
    const s = DUEL.REACTS[kind].snd;
    if (SFX[s]) SFX[s]();
  },

  drawReact(x) {
    const r = DUEL.react;
    if (!r || !G.duel) return;
    const d = G.duel.opp.def;
    /* up fast, hold, down slower — an arm, not a lift */
    const k = r.t < 10 ? r.t / 10
      : r.t > r.life - 16 ? Math.max(0, (r.life - r.t) / 16) : 1;
    if (k <= 0) return;
    const ease = k * k * (3 - 2 * k);
    const P = PIX.PAL;
    /* the sleeve has to be the colour of the coat he is wearing, not of his
       suit letter — on a green frog in a green suit the arm vanishes */
    const C = SPR.costumeOf(d);
    const O = C.overcoat || C.jacket || C.gown || C.shirt || null;
    const cl = (O && O.col) || d.suit;
    const sC = P[cl] || P.T, sD = 'rgba(0,0,0,.45)', sL = P[LIGHTER[cl]] || P.t;
    const TOP = 130;                                   // the table edge he comes up over

    /* one arm, or two */
    const arms = r.kind === 'shrug' ? [-1, 1] : [-1];
    arms.forEach(sgn => {
      const rest = { x: 180 + sgn * 34, y: TOP - 4 };
      let tip;
      if (r.kind === 'facepalm') tip = { x: 180 + sgn * 3, y: 54 };
      else if (r.kind === 'finger') tip = { x: 180 + sgn * 46, y: 72 };
      else tip = { x: 180 + sgn * 54, y: 84 };
      const hx = Math.round(rest.x + (tip.x - rest.x) * ease);
      const hy = Math.round(rest.y + (tip.y - rest.y) * ease);
      /* the sleeve starts ABOVE the far rail: below it the felt eats the arm */
      SPR.povTube(x, rest.x + sgn * 4, TOP + 16, hx, hy + 11, 18, 13, sC, sD, sL);
      /* a cuff at the wrist, or the hand and the sleeve read as one green post */
      SPR.povCuff(x, hx, hy + 6, d, sgn);
      x.save();
      x.translate(hx, hy);
      if (r.kind === 'shrug') x.rotate(sgn * 0.55);
      x.scale(r.kind === 'facepalm' ? 0.95 : 0.8, r.kind === 'facepalm' ? 0.95 : 0.8);
      /* a shadow under the hand or it disappears into a green frog */
      x.globalAlpha = 0.4;
      x.translate(2, 3);
      SPR.frogGesture(x, 0, 0, { skin: ['K', 'K', 'K'] },
        r.kind === 'facepalm' ? 'flat' : r.kind === 'finger' ? 'finger' : 'palm', sgn);
      x.translate(-2, -3);
      x.globalAlpha = 1;
      SPR.frogGesture(x, 0, 0, d, r.kind === 'facepalm' ? 'flat'
        : r.kind === 'finger' ? 'finger' : 'palm', sgn);
      x.restore();
    });
  },

  /* ============================================================
     THE ROUND.
     Time opens up for about a third of a second and you watch the
     thing travel: a hot slug, a shock ring off the nose of it, a
     wake of spent air behind, and a smear of light down the bore
     line it came out of.
     ============================================================ */
  fireSlug(from, ang, dist) {
    DUEL.slug = {
      x: from.x, y: from.y, ox: from.x, oy: from.y, ang, sp: 2.4,
      t: 0, life: 26, dist,
      trail: [],
    };
  },

  drawSlug(x) {
    const P = PIX.PAL, sl = DUEL.slug;
    const f = 1 - sl.t / sl.life;
    /* the wake: spent air, thinning out behind it */
    sl.trail.forEach((pt, i) => {
      const a = (1 - i / sl.trail.length) * 0.5 * f;
      x.globalAlpha = a;
      const w = Math.max(1, 8 - i);
      PIX.rect(x, Math.round(pt[0]) - (w >> 1), Math.round(pt[1]) - (w >> 1), w, w,
        i < 2 ? P.W : i < 5 ? P.Y : P.o);
    });
    x.globalAlpha = 1;
    /* the bore line it came out of, still lit */
    const sx = Math.round(sl.x), sy = Math.round(sl.y);
    const dx = sx - sl.ox, dy = sy - sl.oy;
    const steps = Math.max(1, Math.round(Math.max(Math.abs(dx), Math.abs(dy))));
    x.globalAlpha = 0.22 * f;
    for (let i = 0; i < steps; i += 2) {
      PIX.rect(x, Math.round(sl.ox + dx * (i / steps)),
        Math.round(sl.oy + dy * (i / steps)), 2, 2, P.Y);
    }
    x.globalAlpha = 1;
    /* the slug itself: blocks of hot metal with ink round them */
    PIX.rect(x, sx - 5, sy - 5, 11, 11, P.K);
    PIX.rect(x, sx - 4, sy - 4, 9, 9, P.o);
    PIX.rect(x, sx - 3, sy - 3, 7, 7, P.Y);
    PIX.rect(x, sx - 1, sy - 1, 4, 4, P.W);
    /* and the ring it pushes ahead of itself */
    const r = 4 + sl.t * 0.7;
    x.globalAlpha = 0.4 * f;
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(o => {
      PIX.rect(x, Math.round(sx + o[0] * r) - 1, Math.round(sy + o[1] * r) - 1, 3, 3, P.W);
    });
    x.globalAlpha = 1;
  },

  /* the sight picture: brackets on his face, tight and red when it is armed */
  drawReticle(x, cx, cy, armed) {
    const P = PIX.PAL;
    const pulse = DUEL.t % 40 < 20;
    const r = armed ? (pulse ? 26 : 28) : 31;
    const col = armed ? P.R : 'rgba(244,239,224,.42)';
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(o => {
      const px = cx + o[0] * r, py = cy + o[1] * (r * 0.72);
      const bx = o[0] > 0 ? px - 8 : px, by = o[1] > 0 ? py - 8 : py;
      PIX.rect(x, bx - 1, py - 1, 11, 4, P.K);
      PIX.rect(x, px - 1, by - 1, 4, 11, P.K);
      PIX.rect(x, bx, py, 9, 2, col);
      PIX.rect(x, px, by, 2, 9, col);
    });
    if (armed && pulse) {
      PIX.rect(x, cx - 1, cy - 7, 3, 15, P.K);
      PIX.rect(x, cx - 7, cy - 1, 15, 3, P.K);
      PIX.rect(x, cx, cy - 6, 1, 13, col);
      PIX.rect(x, cx - 6, cy, 13, 1, col);
    }
  },

  /* powder smoke: thick and white at first, then thin grey drifting up */
  drawSmoke(x) {
    const P = PIX.PAL;
    DUEL.smoke.forEach(w => {
      const f = 1 - w.t / w.life;
      x.globalAlpha = f * 0.30;
      PIX.disc(x, w.x, w.y, w.r, f > 0.55 ? P.w : P.q);
      x.globalAlpha = f * 0.16;
      PIX.disc(x, w.x - 1, w.y - 1, w.r * 0.55, P.W);
    });
    x.globalAlpha = 1;
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
    DUEL.hurry = false;
    if (opp.boss) {
      /* he crosses the room under letterbox bars before you get a choice */
      await CINE.bossEntrance(opp);
      await UI.bossIntro(opp);
      CINE.pushIn(1.06, 620);
      await CINE.lowerThird(E.blindName(), opp.name, opp.rule, PIX.PAL.R);
    } else {
      /* the lamp clicks on over your table and the camera settles */
      await CINE.sitDown(opp, E.blindName());
    }
    SFX.spin();
    await UI.loadBanner();
    DUEL.busy = false;
    DUEL.hurry = false;
    UI.syncDuel();
  },

  setAim(a) {
    if (DUEL.busy || G.phase !== 'duel') return;
    if (DUEL.aim !== a) SFX.chak();
    DUEL.aim = a;
    DUEL.view = a === 'self' ? 'self' : 'table';
    DUEL.setPose(a === 'foe' ? 'youFoe' : 'youSelf');
    UI.syncDuel();
  },

  /* Between pulls the iron comes down and the camera goes back over the
     felt. Nothing stays aimed while you are not the one holding the turn. */
  lowerIron() {
    DUEL.aim = null;
    DUEL.view = 'table';
    DUEL.setPose('rest');
  },

  async onFire() {
    if (DUEL.busy || G.phase !== 'duel' || G.duel.over || G.duel.turn !== 'you') return;
    if (!DUEL.aim) return;                   // nothing is under the muzzle yet
    DUEL.busy = true;
    DUEL.hurry = false;
    DUEL.setPose(DUEL.aim === 'foe' ? 'youFoe' : 'youSelf');
    await DUEL.sleep(140);
    await DUEL.cockIt();
    const ev = E.pull(DUEL.aim);
    await DUEL.playShot(ev);
    await DUEL.afterPull(ev);
  },

  /* ============================================================
     THE PULL.
     Four beats and a camera move. Thumb the hammer back, let the
     cylinder index, hold one beat on nothing at all, then let it
     fall. The hold is the whole point: it is the last moment in
     which everybody at this table is still alive.
     ============================================================ */
  async cockIt() {
    CINE.pushIn(1.0, 1);                     // reset any pending move
    DUEL.cocked = true;
    DUEL.cylT = 1;
    SFX.tone(2200, 0.025, 'square', 0.05);
    SFX.tone(1500, 0.04, 'square', 0.06, 0.03);
    /* the camera leans in while the cylinder turns */
    CINE.pushIn(1.0, 1);
    const cv = document.getElementById('scene');
    if (cv) {
      cv.style.transition = 'transform 420ms steps(7)';
      cv.style.transformOrigin = DUEL.aim === 'self' ? '50% 46%' : '50% 26%';
      cv.style.transform = 'scale(1.07)';
    }
    await DUEL.sleep(200);
    SFX.click();
    FX.screen.chroma(0.6);
    await DUEL.sleep(150);
    /* the hold. Nothing happens here and that is what it is for. */
    FX.screen.slowmo(220, 0.5);
    await DUEL.sleep(110);
    DUEL.cocked = false;                     // the hammer drops on the primer
    await DUEL.sleep(60);
    if (cv) {
      cv.style.transition = 'transform 260ms steps(5)';
      cv.style.transform = 'scale(1)';
      clearTimeout(DUEL._camTo);
      DUEL._camTo = setTimeout(() => { cv.style.transition = ''; cv.style.transform = ''; }, 400);
    }
  },

  /* smoke off the muzzle and out of the cylinder gap, which is where it
     really comes from on a revolver */
  puffSmoke(x, y, ang, n, spread) {
    for (let i = 0; i < n; i++) {
      const a = ang + (Math.random() - 0.5) * (spread || 0.9);
      const sp = 0.5 + Math.random() * 1.5;
      DUEL.smoke.push({
        x: x + (Math.random() - 0.5) * 3, y: y + (Math.random() - 0.5) * 3,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.22,
        r: 1.5 + Math.random() * 2.5, t: 0, life: 44 + Math.random() * 40,
      });
    }
  },

  async playShot(ev) {
    const tip = DUEL.muzzleTip();
    const ang = DUEL.boreAngle();
    if (ev.live) {
      /* ONE WHITE FRAME. A gun going off in a dark room is not an orange
         glow, it is the whole room being briefly overexposed. */
      SFX.shot();
      SFX.tone(70, 0.55, 'sawtooth', 0.26, 0, -30);       // the thump under it
      SFX.tone(4200, 1.5, 'sine', 0.05, 0.05, -3800);     // and the ring after
      DUEL.muzzle = { x: tip.x, y: tip.y, ang, t: 0, len: 1 };
      DUEL.kick = 1;                          // the iron jumps, then comes back
      FX.muzzleFlash(tip.x, tip.y, ang);
      FX.casing(DUEL.gun.x, DUEL.gun.y - 6, DUEL.gun.flip ? -1 : 1);
      FX.cordite(tip.x, tip.y, 12);
      DUEL.puffSmoke(tip.x, tip.y, ang, 14, 0.7);
      const gap = DUEL.ironPoint(28, 9);      // the cylinder gap, top of the frame
      DUEL.puffSmoke(gap.x, gap.y, -Math.PI / 2, 7, 1.5);
      FX.screen.shake(ev.dmg >= 2 ? 20 : 14);
      FX.screen.flash(PIX.PAL.W, 0.85, 0.16);
      FX.screen.chroma(ev.dmg >= 2 ? 4 : 2.4);
      /* BULLET TIME. Long enough to watch the round leave and land, and
         longest of all when what it lands in is you. */
      FX.screen.slowmo(ev.victim === 'you' ? 900 : 700, 0.42);
      if (!ev.fizzled) DUEL.fireSlug(tip, ang, 100);
      if (ev.fizzled) {
        await U.sleep(160);
        UI.stampBig('FIZZLE', PIX.PAL.N); SFX.dud();
        DUEL.reactAt('facepalm');            // he cannot believe he watched that
      } else if (ev.victim === 'foe') {
        /* it has to get there first */
        await DUEL.sleep(220);
        DUEL.slug = null;
        DUEL.opp.recoil = 1; DUEL.opp.flash = 1;
        DUEL.setExpr('pain', 55);
        FX.screen.shake(ev.dmg >= 2 ? 18 : 12);
        FX.screen.flash(PIX.PAL.R, 0.3, 0.1);
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
        DUEL.gore(ev.dmg >= 2 ? 3 : 2);
        /* still upright, and he has something to say about it */
        if (G.duel.opp.hp > 0) setTimeout(() => DUEL.reactAt('finger'), 520);
      } else if (ev.victim === 'you') {
        await DUEL.sleep(200);
        DUEL.slug = null;
        FX.screen.vignette(PIX.PAL.d, 0.95);
        FX.screen.chroma(3);
        FX.screen.shake(13);
        if (ev.by === 'opp') DUEL.setExpr('grin', 80);
        FX.bloodBurst(60, 160, 1.6, -Math.PI / 2.4);
        FX.bloodDrip(58, 168, 190);
        UI.flash('go-back');
        UI.stampBig('-' + ev.dmg, PIX.PAL.R);
        SFX.hurt();
        DUEL.myGore += ev.dmg;                // it goes on your face and stays there
        DUEL._meCache = null;
        if (ev.by === 'opp') {
          setTimeout(() => DUEL.reactAt('shrug'), 560);
          if (typeof TALK !== 'undefined') setTimeout(() => TALK.after('hitYou'), 700);
        }
      }
    } else {
      SFX.dud();
      DUEL.kick = 0.16;
      FX.cordite(tip.x, tip.y, 5);
      UI.stampBig('click', PIX.PAL.w, true);
      if (ev.by === 'opp' && ev.target === 'self') {
        DUEL.setExpr('smug', 60); DUEL.reactAt('shrug');
        if (typeof TALK !== 'undefined') TALK.after('selfBlank');
      }
      if (ev.by === 'you' && ev.target === 'foe' && !ev.croakHeal) DUEL.setExpr('smug', 45);
      /* you put it against your own head and it clicked: he has seen luck before */
      if (ev.by === 'you' && ev.target === 'self') DUEL.reactAt('facepalm');
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
      DUEL.lowerIron();
      DUEL.busy = false;
      UI.syncDuel();
    }
  },

  async oppLoop() {
    while (G.phase === 'duel' && !G.duel.over && G.duel.turn === 'opp') {
      DUEL.setPose('rest');
      DUEL.hurry = false;
      UI.syncDuel();
      /* He says his piece FIRST, and it is out of the way before the iron
         comes up — otherwise the plate covers the pull it is talking about. */
      if (typeof TALK !== 'undefined') await TALK.takes();
      await DUEL.sleep(160);
      const choice = E.oppDecide();
      DUEL.setPose(choice === 'foe' ? 'oppYou' : 'oppSelf');
      if (choice === 'self') DUEL.setExpr('worry', 70);
      /* the barrel comes round to where it is going, and you get to watch */
      UI.stampSmall(choice === 'foe' ? 'HE POINTS IT AT YOU' : 'HE POINTS IT AT HIMSELF');
      await DUEL.sleep(420);
      await DUEL.cockIt();
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
      DUEL.lowerIron();
      DUEL.busy = false;
      UI.syncDuel();
    }
  },

  /* ============================================================
     THE MARK DIES.
     You do not watch it. It lands on the glass in front of you
     and by the time you can see again you are out back with him
     and the door is shut. Nobody goes through a body under the
     lamp, and nobody wants to watch you drag one either.
     ============================================================ */
  async killSequence() {
    DUEL.setPose('rest');
    SFX.lose();
    await CINE.bloodWipe(() => {
      DUEL.opp.gone = true;
      DUEL.corpse = true;
      DUEL.ghost = null;
      G.loot.dragged = true;
      DUEL.room = 'back';
      DUEL.pool = 16;
      COPS.GROUND = DUEL.FY - 8;
      BG.set('back');
      E.makeMess();
      LOOT.overlay();
    }, 320);
    DUEL.busy = false;
  },

  /* you die */
  /* ============================================================
     YOU DIE.
     Not a fade. The room tips over because your head does, he
     stands up and looks down at the lens for a while, and then
     the marker changes hands. Any tap hurries it.
     ============================================================ */
  async deathSequence() {
    FX.screen.vignette(PIX.PAL.d, 1.1, 0.015);
    FX.screen.chroma(5);
    FX.screen.slowmo(1600, 0.5);
    FX.screen.flash(PIX.PAL.R, 0.5, 0.05);
    UI.flash('go-back');
    SFX.backfire();
    SFX.tone(3200, 2.4, 'sine', 0.06, 0, -3000);     // the ring that does not stop
    DUEL.hurry = false;
    await DUEL.sleep(420);

    /* the room goes over with you */
    DUEL.youFall = true;
    SFX.lose();
    const cv = document.getElementById('scene');
    if (cv) {
      cv.style.transition = 'transform 1500ms steps(16)';
      cv.style.transformOrigin = '50% 100%';
      cv.style.transform = 'rotate(-13deg) scale(1.1) translateY(6%)';
    }
    await DUEL.sleep(700);

    /* he gets up. This is the last thing you see of him. */
    DUEL.dying = 0.02;              // the step eases it the rest of the way
    SFX.chak();
    await DUEL.sleep(1100);
    SFX.tone(120, 0.5, 'square', 0.1, 0, -60);

    if (cv) { cv.style.transition = ''; cv.style.transform = ''; }
    META.check();
    /* the card, then the marker */
    await CINE.deathCard(G.duel && G.duel.opp ? G.duel.opp.name : '');
    await CINE.iris(() => UI.render());
  },

  /* loot fx: the corpse jiggles, the take flies out of it */
  /* What coming out of a pocket looks like: cloth settling, dust off the
     lining, and the take arcing back across the felt to your end. Nothing
     detonates — you are going through a dead frog's coat, not defusing it. */
  lootFx(pocket, sx, sy) {
    DUEL.jiggle = 1.4;
    const P = PIX.PAL;
    const px = sx === undefined ? 175 : sx, py = sy === undefined ? 128 : sy;
    DUEL.puff(px, py, 7, [P.q, P.w, P.k], 1.3, -0.5);      // dust out of the lining
    if (pocket.id === 'tooth') { FX.bloodBurst(px, py, 0.7); SFX.jamSfx(); }
    if (pocket.chips > 0) {
      FX.chipToss(px, py, 300, DUEL.FY - 20, Math.min(10, pocket.chips + 1), P.G);
    }
    if (pocket.gun) { FX.screen.flash(PIX.PAL.W, 0.4); FX.chipRain(10); SFX.jackpot(); }
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
  sceneXY(e) {
    const r = DUEL.cv.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * DUEL.W - DUEL.OX,
      y: (e.clientY - r.top) / r.height * DUEL.H - DUEL.OY,
    };
  },

  /* light the spot under the pointer, so it is obvious he can be gone through */
  sceneMove(e) {
    if (!DUEL.cv) return;
    if (G.phase !== 'loot' || DUEL.busy) {
      if (DUEL.hoverSpot !== -1) DUEL.hoverSpot = -1;
      if (DUEL.hoverStain !== -1) DUEL.hoverStain = -1;
      /* in a duel, the two things you can put the muzzle on light the cursor */
      if (G.phase === 'duel' && !DUEL.busy) {
        const p = DUEL.sceneXY(e);
        const b = DUEL.selfHead();
        const face = p.x > 118 && p.x < 244 && p.y > 8 && p.y < 96;
        const on = DUEL.view === 'self'
          ? (p.x > b.x0 && p.x < b.x1 && p.y > b.y0 && p.y < b.y1)
          : (face || p.y > DUEL.FY - 52);
        DUEL.hoverFace = DUEL.view !== 'self' && face;
        DUEL.cv.style.cursor = on ? 'pointer' : 'crosshair';
      } else DUEL.hoverFace = false;
      return;
    }
    const q = DUEL.sceneXY(e);
    const i = DUEL.spotAt(q.x, q.y);
    if (i !== DUEL.hoverSpot) { DUEL.hoverSpot = i; if (i >= 0) SFX.tick(); }
    const st = i >= 0 ? -1 : DUEL.stainAt(q.x, q.y);
    if (st !== DUEL.hoverStain) { DUEL.hoverStain = st; if (st >= 0) SFX.tick(); }
    DUEL.cv.style.cursor = (i >= 0 || st >= 0) ? 'pointer' : 'crosshair';
  },

  sceneClick(e) {
    if (G.phase === 'loot') {
      if (DUEL.busy) { DUEL.hurry = true; return; }
      const q = DUEL.sceneXY(e);
      const i = DUEL.spotAt(q.x, q.y);
      if (i >= 0) { DUEL.searchAt(i); return; }
      const st = DUEL.stainAt(q.x, q.y);
      if (st >= 0) DUEL.mopAt(st);
      return;
    }
    if (G.phase !== 'duel') return;
    if (DUEL.busy) { DUEL.hurry = true; return; }
    const q = DUEL.sceneXY(e);
    /* Round on yourself: anywhere on your own end of the table, or anywhere
       at all once the camera is already there — click again and you pull. */
    if (DUEL.view === 'self') {
      const b = DUEL.selfHead();
      if (q.x > b.x0 && q.x < b.x1 && q.y > b.y0 && q.y < b.y1) DUEL.onFire();
      else { DUEL.lowerIron(); SFX.click(); UI.syncDuel(); }   // back over the felt
      return;
    }
    if (q.x > 118 && q.x < 244 && q.y > 8 && q.y < 96) {   // his face
      if (DUEL.aim === 'foe') DUEL.onFire();
      else DUEL.setAim('foe');
    } else if (q.y > DUEL.FY - 52) {                       // your own end
      DUEL.setAim('self');
    } else if (DUEL.aim) {
      DUEL.lowerIron(); SFX.click(); UI.syncDuel();        // dead space: stand down
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
