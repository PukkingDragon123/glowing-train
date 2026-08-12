'use strict';
/* ============================================================
   SHELL & DEBT — cops.js
   SWAMP PD, on screen at last. Peaked caps, brass buttons,
   nightsticks tapped into a waiting glove, chips counted into
   it one at a time — and the paddy wagon rolling past when you
   can't pay.

   Everything here is drawn into the duel scene's canvas in the
   same 360x200 bottom-anchored world space duel.js uses:
     COPS.draw(ctx, t)        — world space, call BEFORE the table
     COPS.drawOverlay(ctx,W,H)— screen wash + the front layer
   Cops face LEFT: they come in from the right of the table and
   stand behind it, so the felt eats their boots (same trick the
   mark's lower body uses).

   Sprites are the ordinary frog rig (SPR.bodyCustom /
   SPR.frogCustom, cached) with the uniform painted over the
   cached composite in axis-aligned stepped rects. No randomness
   in any builder; animation is all frame-driven off COPS.step().
   ============================================================ */

const COPS = {

  /* ---------------- geometry ---------------- */
  GROUND: 150,        // the felt line the boots stand on
  LEG_H: 20,          // hip -> sole
  CW: 96, CH: 80,     // cached composite (head + tunic); hip sits at CH
  BODY_SC: 0.75,      // the seated rig body, scaled down for a standing cop
  /* STAND is where the lone badge from arrive()/refuse() plants himself, and he
     only ever shows up during the loot phase — where .loot-in pins the panel to
     the right of the scene (world 269..347 on a 360-wide viewport). 286 put his
     head dead centre behind it, so he stands just clear of its left edge. The
     FLANK marks belong to shakedown(), which runs under the CENTRED heat card
     (world ~125..235), so those stay out on the right. */
  STAND: 246,
  FLANK: [262, 308, 212],

  /* ---------------- who they are ---------------- */
  /* plain rig defs — if another agent lands COSTUMES.cop we fold it in */
  DEFS: {
    beat: {
      skin: ['F', 'f', 'e'], fat: false, suit: 't', shirt: 'S', tie: 'T',
      spots: true,
    },
    sgt: {
      skin: ['f', 'e', 'E'], fat: true, suit: 's', shirt: 'S', tie: 'T',
      warts: true, goldtooth: true, cigar: true,
    },
  },

  UNI: {
    beat: {
      tunic: 't', tunicHi: 's', cap: 't', capBand: 'T', capHi: 's',
      trouser: 'T', braid: false, chev: 0, strap: false, seam: false,
    },
    sgt: {
      tunic: 's', tunicHi: 'S', cap: 's', capBand: 't', capHi: 'M',
      trouser: 't', braid: true, chev: 3, strap: true, seam: true,
    },
  },

  /* hand targets per pose, relative to (cop centre x, hip y).
     l = the near glove (he faces left), r = the stick hand,
     stick = the baton's world angle (0 = right, PI = left). */
  ARMS: {
    idle:   { l: [-27, -16], r: [22, -20], stick: 2.45 },
    palm:   { l: [-18, -18], r: [6, -30], stick: 2.85 },
    fold:   { l: [10, -30], r: [-12, -28], stick: 3.05 },
    shrug:  { l: [-30, -30], r: [24, -32], stick: 2.15 },
    salute: { l: [-21, -67], r: [20, -24], stick: 2.45 },
    grab:   { l: [-40, -22], r: [-26, -30], stick: 2.6 },
    raise:  { l: [-30, -20], r: [14, -58], stick: -1.5 },
    pocket: { l: [-14, -12], r: [10, -30], stick: 2.5 },
  },

  /* ---------------- live state ---------------- */
  cops: [],
  parts: [],          // sparks, breath, cigar smoke, boot dust
  chips: [],          // bribe chips in the air
  envelope: null,     // the protection money
  cuffs: null,        // {x,y,t,close}
  grab: null,         // {t} the arm that clamps your shoulder
  wagon: null,        // {x,vx}
  wash: 0, washTo: 0, // red/blue light
  torch: 0, torchTo: 0,
  tilt: 0, tiltTo: 0, // the screen tips (CSS, restored on reset)
  active: false,
  t: 0,
  _gen: 0,
  _cache: {},
  _defCache: {},
  _uniCache: {},
  _tilted: false,
  _tiltCss: '',
  _grads: null,

  /* ============================================================
     lifecycle
     ============================================================ */

  reset() {
    COPS._gen++;
    COPS.cops.length = 0;
    COPS.parts.length = 0;
    COPS.chips.length = 0;
    COPS.envelope = null;
    COPS.cuffs = null;
    COPS.grab = null;
    COPS.wagon = null;
    COPS.wash = COPS.washTo = 0;
    COPS.torch = COPS.torchTo = 0;
    COPS.tilt = COPS.tiltTo = 0;
    COPS.active = false;
    COPS._clearTilt();
  },

  /* ============================================================
     defs / costume feature detection
     ============================================================ */

  /* COSTUMES may not exist yet, and when it does it may be either a
     LAYERED wardrobe (entries with jacket/acc, selected by def.costume)
     or plain def fragments. Sniff which, and cope with neither. */
  _cost() {
    if (COPS._costCache !== undefined) return COPS._costCache;
    let out = null;
    try {
      if (typeof COSTUMES !== 'undefined' && COSTUMES) {
        const name = COSTUMES.cop ? 'cop' : (COSTUMES.uniform ? 'uniform'
          : (COSTUMES.police ? 'police' : null));
        const e = name ? COSTUMES[name] : null;
        if (e && typeof e === 'object' && !Array.isArray(e)) {
          const layered = !!(e.jacket || e.overcoat || e.acc || e.label ||
            (e.shirt && typeof e.shirt === 'object'));
          out = { name: name, entry: e, layered: layered };
        }
      }
    } catch (e) { out = null; }
    COPS._costCache = out;
    return out;
  },

  _def(rank) {
    if (COPS._defCache[rank]) return COPS._defCache[rank];
    const base = COPS.DEFS[rank] || COPS.DEFS.beat;
    const d = {};
    Object.keys(base).forEach(k => { d[k] = base[k]; });
    const w = COPS._cost();
    let shipped = null;
    try {
      if (typeof FROG_DEFS !== 'undefined' && FROG_DEFS && FROG_DEFS.cop &&
        typeof FROG_DEFS.cop === 'object') shipped = FROG_DEFS.cop;
    } catch (e) { shipped = null; }
    if (shipped) {
      Object.keys(shipped).forEach(k => { d[k] = shipped[k]; });   // the shipped cop
    } else if (w && w.layered) {
      d.costume = w.name;                                          // let the rig tailor it
    } else if (w) {
      Object.keys(w.entry).forEach(k => { d[k] = w.entry[k]; });    // plain def fragment
    }
    if (!d.skin || !d.skin.length) d.skin = base.skin;
    d.fat = (rank === 'sgt');
    d.cigar = (rank === 'sgt');
    if (rank === 'sgt') d.goldtooth = true;
    delete d.hat; delete d.hatCol; delete d.flatcap;  // our peaked cap goes on top
    COPS._defCache[rank] = d;
    return d;
  },

  /* true when the rig itself already tailors a full tunic (buttons, belt,
     epaulets, badge) — then we must NOT paint ours over the top of it */
  _rigDressed(d) {
    try {
      if (!d || !d.costume) return false;
      if (typeof COSTUMES === 'undefined' || !COSTUMES) return false;
      const e = COSTUMES[d.costume];
      return !!(e && (e.jacket || e.overcoat || e.acc));
    } catch (e) { return false; }
  },

  /* uniform palette for the bits WE draw (sleeves, cap, legs) */
  _uni(rank, d) {
    if (COPS._uniCache[rank]) return COPS._uniCache[rank];
    const base = COPS.UNI[rank] || COPS.UNI.beat;
    const u = {};
    Object.keys(base).forEach(k => { u[k] = base[k]; });
    try {
      if (COPS._rigDressed(d)) {
        const e = COSTUMES[d.costume];
        const j = e.overcoat || e.jacket;
        if (j && PIX.PAL[j.col]) u.tunic = j.col;
        if (j && PIX.PAL[j.dark]) u.trouser = j.dark;
      }
    } catch (e) { /* keep our own letters */ }
    COPS._uniCache[rank] = u;
    return u;
  },

  _rigKey(rank) {
    const w = COPS._cost();
    return 'cop_' + rank + (w ? (w.layered ? '_w' : '_c') : '');
  },

  /* ============================================================
     the cached cop: rig body + rig head + painted uniform
     ============================================================ */

  _composite(rank, expr) {
    const key = rank + '_' + (expr || 'neutral') + COPS._rigKey(rank);
    if (COPS._cache[key]) return COPS._cache[key];

    const P = PIX.PAL;
    const d = COPS._def(rank);
    const uni = COPS._uni(rank, d);
    const dressed = COPS._rigDressed(d);   // the rig tailors the tunic itself
    const body = SPR.bodyCustom(COPS._rigKey(rank), d);
    const head = SPR.frogCustom(COPS._rigKey(rank), d, expr || 'neutral');

    const cv = document.createElement('canvas');
    cv.width = COPS.CW; cv.height = COPS.CH;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    /* --- the seated rig body, shrunk to standing-extra scale --- */
    const BS = COPS.BODY_SC;
    const bw = Math.round(body.width * BS), bh = Math.round(body.height * BS);
    const bx = Math.round((COPS.CW - bw) / 2), by = COPS.CH - bh;
    ctx.drawImage(body, bx, by, bw, bh);

    const cx = bx + Math.round(58 * BS);   // the rig's centre line, in composite space
    const ty = by;                         // shoulder line
    const tunic = P[uni.tunic] || P.t;
    const tHi = P[uni.tunicHi] || P.s;
    const hw = d.fat ? 40 : 28;            // half width at the belt

    /* --- everything below is OUR tailoring: skipped when the rig's own
       wardrobe already put a tunic, buttons, belt and badge on him --- */
    if (!dressed) {
    /* --- closed tunic front over the rig's shirt V --- */
    PIX.rect(ctx, cx - 10, ty + 8, 21, 28, P.K);
    PIX.rect(ctx, cx - 9, ty + 8, 19, 27, tunic);
    PIX.rect(ctx, cx - 9, ty + 8, 19, 1, tHi);
    PIX.rect(ctx, cx + 6, ty + 9, 4, 26, 'rgba(0,0,0,.25)');
    PIX.rect(ctx, cx - 1, ty + 9, 2, 26, 'rgba(0,0,0,.30)');   // placket

    /* collar tabs, stepped */
    PIX.rect(ctx, cx - 11, ty + 2, 8, 5, P.K);
    PIX.rect(ctx, cx - 10, ty + 3, 6, 3, tunic);
    PIX.rect(ctx, cx - 10, ty + 3, 6, 1, tHi);
    PIX.rect(ctx, cx + 3, ty + 2, 8, 5, P.K);
    PIX.rect(ctx, cx + 4, ty + 3, 6, 3, tunic);
    PIX.rect(ctx, cx + 4, ty + 3, 6, 1, 'rgba(0,0,0,.22)');

    /* --- brass buttons, double breasted --- */
    for (let i = 0; i < 4; i++) {
      const byy = ty + 12 + i * 6;
      [-6, 4].forEach(bxx => {
        PIX.rect(ctx, cx + bxx - 1, byy - 1, 4, 4, P.K);
        PIX.rect(ctx, cx + bxx, byy, 2, 2, P.G);
        PIX.rect(ctx, cx + bxx, byy, 1, 1, P.Y);
        PIX.rect(ctx, cx + bxx + 1, byy + 1, 1, 1, P.h);
      });
    }

    /* --- shield on the chest --- */
    COPS._shield(ctx, cx - 21, ty + 12, true);

    /* --- Sam Browne strap, stepped (sergeants only) --- */
    if (uni.strap) {
      for (let i = 0; i < 9; i++) {
        const sx = cx - 16 + i * 3, sy = ty + 4 + i * 3;
        PIX.rect(ctx, sx, sy, 4, 4, P.K);
        PIX.rect(ctx, sx, sy, 3, 3, P.U);
        PIX.rect(ctx, sx, sy, 3, 1, P.u);
      }
    }

    /* --- epaulettes + sleeve chevrons --- */
    [-1, 1].forEach(s => {
      const ox = cx + s * (d.fat ? 26 : 19);
      PIX.rect(ctx, ox - 6, ty + 1, 13, 5, P.K);
      PIX.rect(ctx, ox - 5, ty + 2, 11, 3, tunic);
      PIX.rect(ctx, ox - 5, ty + 2, 11, 1, tHi);
      if (uni.braid) {
        PIX.rect(ctx, ox - 4, ty + 3, 9, 1, P.G);
        PIX.rect(ctx, ox + 3, ty + 2, 2, 3, P.G);
      }
    });

    /* --- duty belt + buckle --- */
    const bY = ty + 33;
    PIX.rect(ctx, cx - hw - 1, bY, (hw + 1) * 2, 6, P.K);
    PIX.rect(ctx, cx - hw, bY + 1, hw * 2, 4, P.U);
    PIX.rect(ctx, cx - hw, bY + 1, hw * 2, 1, P.u);
    PIX.rect(ctx, cx + hw - 6, bY + 1, 6, 4, 'rgba(0,0,0,.25)');
    PIX.rect(ctx, cx - 4, bY - 1, 9, 8, P.K);
    PIX.rect(ctx, cx - 3, bY, 7, 6, P.G);
    PIX.rect(ctx, cx - 2, bY + 1, 5, 4, P.h);
    PIX.rect(ctx, cx - 3, bY, 7, 1, P.Y);
    /* the empty baton loop on his hip */
    PIX.rect(ctx, cx - hw + 3, bY + 5, 5, 4, P.K);
    PIX.rect(ctx, cx - hw + 4, bY + 6, 3, 2, P.u);
    }

    /* rank chevrons are ours either way — no wardrobe draws those */
    if (uni.chev) {
      const ax = cx - (d.fat ? 28 : 22);
      for (let k = 0; k < uni.chev; k++) {
        const yy = ty + 16 + k * 4;
        PIX.rect(ctx, ax - 3, yy + 1, 2, 2, P.G);
        PIX.rect(ctx, ax - 1, yy, 3, 2, P.G);
        PIX.rect(ctx, ax + 2, yy + 1, 2, 2, P.G);
      }
    }

    /* --- the head, nudged left: he is looking at you --- */
    const hx = Math.round((COPS.CW - head.width) / 2) - 3, hy = 0;
    ctx.drawImage(head, hx, hy);
    const hcx = hx + 23;

    /* --- peaked cap, badge, bill stepping down to the left --- */
    const cw = d.fat ? 12 : 11;
    const capC = P[uni.cap] || P.t;
    const band = P[uni.capBand] || P.T;
    PIX.rect(ctx, hcx - cw - 1, 0, (cw + 1) * 2, 7, P.K);
    PIX.rect(ctx, hcx - cw, 1, cw * 2, 5, capC);
    PIX.rect(ctx, hcx - cw, 1, cw * 2 - 5, 1, P[uni.capHi] || P.s);
    PIX.rect(ctx, hcx + cw - 4, 1, 4, 5, 'rgba(0,0,0,.25)');
    PIX.rect(ctx, hcx - cw - 1, 6, (cw + 1) * 2, 4, P.K);
    PIX.rect(ctx, hcx - cw, 7, cw * 2, 2, band);
    if (uni.braid) {
      for (let g = -cw; g < cw - 1; g += 3) PIX.rect(ctx, hcx + g, 7, 2, 1, P.G);
    }
    for (let i = 0; i < 3; i++) {          // the bill
      const vx = hcx - cw - 1 - i * 3;
      PIX.rect(ctx, vx, 8 + i, 7, 3, P.K);
      PIX.rect(ctx, vx, 8 + i, 6, 1, P.s);
      PIX.rect(ctx, vx, 9 + i, 6, 1, P.k);
    }
    PIX.rect(ctx, hcx - cw - 3, 11, cw * 2, 2, 'rgba(0,0,0,.22)');  // bill shadow
    COPS._shield(ctx, hcx - cw + 2, 2, false);

    COPS._cache[key] = cv;
    return cv;
  },

  /* a little stepped gold shield with a star punched out */
  _shield(ctx, x, y, big) {
    const P = PIX.PAL;
    const w = big ? 7 : 5;
    PIX.rect(ctx, x - 1, y - 1, w + 2, 7, P.K);
    PIX.rect(ctx, x, y + 5, w, 2, P.K);
    PIX.rect(ctx, x + 1, y + 7, w - 2, 1, P.K);
    PIX.rect(ctx, x, y, w, 5, P.G);
    PIX.rect(ctx, x, y, w, 1, P.Y);
    PIX.rect(ctx, x + 1, y + 5, w - 2, 1, P.g);
    PIX.rect(ctx, x + w - 2, y + 1, 2, 4, P.h);
    const mid = x + ((w - 1) >> 1);
    PIX.rect(ctx, mid, y + 1, 1, 3, P.K);
    PIX.rect(ctx, mid - 1, y + 2, 3, 1, P.K);
  },

  /* the nightstick, pointing +x (rotated at the grip like the iron) */
  _stick() {
    if (COPS._cache._stick) return COPS._cache._stick;
    const P = PIX.PAL;
    const cv = document.createElement('canvas');
    cv.width = 23; cv.height = 6;
    const c = cv.getContext('2d');
    PIX.rect(c, 0, 1, 23, 4, P.K);
    PIX.rect(c, 1, 2, 21, 2, P.u);
    PIX.rect(c, 1, 2, 21, 1, P.b);
    PIX.rect(c, 1, 2, 4, 2, P.U);       // grip
    PIX.rect(c, 0, 0, 2, 6, P.K);       // strap ring
    PIX.rect(c, 19, 1, 4, 4, P.K);
    PIX.rect(c, 20, 2, 3, 2, P.b);      // knob
    PIX.rect(c, 20, 2, 2, 1, P.B);
    COPS._cache._stick = cv;
    return cv;
  },

  /* the protection money */
  _envSprite() {
    if (COPS._cache._env) return COPS._cache._env;
    const P = PIX.PAL;
    const cv = document.createElement('canvas');
    cv.width = 17; cv.height = 11;
    const c = cv.getContext('2d');
    PIX.rect(c, 0, 0, 17, 11, P.K);
    PIX.rect(c, 1, 1, 15, 9, P.W);
    PIX.rect(c, 1, 1, 15, 1, P.Y);
    PIX.rect(c, 1, 8, 15, 2, P.w);
    for (let i = 0; i < 4; i++) {         // stepped flap
      PIX.rect(c, 1 + i * 2, 1 + i, 2, 1, P.w);
      PIX.rect(c, 14 - i * 2, 1 + i, 2, 1, P.w);
    }
    PIX.rect(c, 7, 4, 3, 3, P.d);
    PIX.rect(c, 8, 5, 1, 1, P.r);
    COPS._cache._env = cv;
    return cv;
  },

  _wagonText() {
    if (COPS._cache._wtxt) return COPS._cache._wtxt;
    let cv = null;
    try {
      cv = PIXFONT.render('SWAMP PD', { scale: 1, color: PIX.PAL.s, shadow: null });
    } catch (e) { cv = null; }
    COPS._cache._wtxt = cv || document.createElement('canvas');
    return COPS._cache._wtxt;
  },

  /* ============================================================
     per frame
     ============================================================ */

  /* DUEL.W is the viewport in world units, so the visible band is
     180 +- DUEL.W/2 — NOT a fixed 0..360. It is 108 wide on a phone. */
  _vis() {
    const W = (typeof DUEL !== 'undefined' && DUEL.W) ? DUEL.W : 360;
    return { l: 180 - W / 2, r: 180 + W / 2 };
  },

  /* just past the right edge, whatever the window is */
  _offX() {
    return Math.round(COPS._vis().r + 54);
  },

  /* Pull a mark inside the visible band. At 430px wide the game is only 108
     world px across (126..234), so the authored 246/262/308 marks stood a cop
     entirely off screen — the whole sequence played to nobody. Wide viewports
     are untouched; narrow ones get a per-slot stagger so the cops still read as
     separate bodies instead of stacking on one pixel. */
  _fit(x, i) {
    const right = COPS._vis().r - 22;
    const F = COPS.FLANK;
    const widest = Math.max(COPS.STAND, F[0], F[1], F[2]);
    if (widest <= right) return x;               // room for the authored marks
    return Math.round(right - (i || 0) * 20);    // squeezed: one slot per stagger
  },

  _spawn(rank, tx, slot) {
    const r = rank === 'sgt' ? 'sgt' : 'beat';
    tx = COPS._fit(tx, slot);
    const from = COPS._offX();
    /* the off-screen mark tracks the viewport width, so on a wide window the
       walk in is much longer — pace it by distance or he is still marching
       when the beat that spawned him has already given up waiting */
    const speed = Math.max(1.55, Math.abs(from - tx) / 80);
    const c = {
      rank: r,
      x: from, y: COPS.GROUND, tx: tx,
      speed: speed, walk: 0, lastStep: 0, bob: 0, dip: 0, dipTo: 0,
      moving: true, leaving: false,
      expr: 'neutral', armMode: 'idle',
      hL: { x: -22, y: -14 }, hR: { x: 14, y: -18 },
      stickA: 2.45, tapping: false, tapT: 0,
      palmChips: 0, hasEnv: false, torch: false,
      cigar: r === 'sgt',
      seed: COPS.cops.length * 17 + 5,
    };
    COPS.cops.push(c);
    COPS.active = true;
    return c;
  },

  step() {
    COPS.t++;
    const fast = (typeof DUEL !== 'undefined' && DUEL.hurry) ? 3 : 1;

    COPS.wash += (COPS.washTo - COPS.wash) * 0.09 * fast;
    COPS.torch += (COPS.torchTo - COPS.torch) * 0.07 * fast;
    COPS.tilt += (COPS.tiltTo - COPS.tilt) * 0.12;
    COPS._applyTilt();

    for (let i = COPS.cops.length - 1; i >= 0; i--) {
      const c = COPS.cops[i];
      const dx = c.tx - c.x;
      c.moving = Math.abs(dx) > 1.2;
      if (c.moving) {
        const sp = Math.min(Math.abs(dx), c.speed * fast);
        c.x += (dx > 0 ? sp : -sp);
        c.walk += 0.26 * fast;
        c.bob = -Math.abs(Math.sin(c.walk)) * 1.2;
        const st = Math.round(c.walk / Math.PI);
        if (st !== c.lastStep) { c.lastStep = st; COPS._boot(c); }
      } else {
        c.bob = Math.sin((COPS.t + c.seed) / 32) * 0.8;
        if (c.cigar && (COPS.t + c.seed) % 68 < 5) c.bob += 1;   // chewing the cigar
      }
      if (c.leaving && !c.moving) { COPS.cops.splice(i, 1); continue; }

      /* arms ease to the pose */
      const pose = COPS.ARMS[c.armMode] || COPS.ARMS.idle;
      const k = 0.18 * fast;
      c.hL.x += (pose.l[0] - c.hL.x) * k;
      c.hL.y += (pose.l[1] - c.hL.y) * k;
      c.hR.x += (pose.r[0] - c.hR.x) * k;
      c.hR.y += (pose.r[1] - c.hR.y) * k;
      c.dip += (c.dipTo - c.dip) * 0.2;

      /* the nightstick: tap it in your palm while he waits */
      if (c.tapping && !c.moving) {
        c.tapT++;
        const f = c.tapT % 34;
        const ph = f / 34;
        const swing = ph < 0.35 ? (ph / 0.35) : (ph < 0.5 ? 1 : 1 - (ph - 0.5) / 0.5);
        c.stickA = pose.stick + 0.42 - swing * 0.62;
        if (f === 12) COPS._tap(c);
      } else {
        c.stickA += (pose.stick - c.stickA) * 0.16;
      }

      /* breath in the cold, cigar smoke */
      if (!c.moving && (COPS.t + c.seed) % 52 === 0) COPS._breath(c);
      if (c.cigar && (COPS.t + c.seed) % 30 === 0) {
        COPS.parts.push({
          x: c.x + 19, y: c.y - COPS.LEG_H - 54, vx: -0.16 - Math.random() * 0.2,
          vy: -0.5 - Math.random() * 0.3, g: -0.006, t: 0, life: 44, s: 2, col: PIX.PAL.q,
        });
      }
    }

    /* bribe chips arcing into the glove, one at a time */
    for (let i = COPS.chips.length - 1; i >= 0; i--) {
      const ch = COPS.chips[i];
      ch.t += fast;
      const c = ch.cop;
      const gx = c.x + c.hL.x, gy = c.y - COPS.LEG_H + c.hL.y + c.bob;
      const p = Math.min(1, ch.t / ch.dur);
      ch.px = ch.x + (gx - ch.x) * p;
      ch.py = ch.y + (gy - ch.y) * p - Math.sin(p * Math.PI) * 34;
      if (p >= 1) {
        c.palmChips = Math.min(8, c.palmChips + 1);
        SFX.coin();
        COPS._spark(gx, gy - 4, 4, [PIX.PAL.G, PIX.PAL.Y]);
        COPS.chips.splice(i, 1);
      }
    }

    /* the envelope */
    if (COPS.envelope) {
      const e = COPS.envelope;
      e.t += fast;
      const c = e.cop;
      const gx = c.x + c.hL.x, gy = c.y - COPS.LEG_H + c.hL.y + c.bob;
      const p = Math.min(1, e.t / e.dur);
      e.px = e.x + (gx - e.x) * p;
      e.py = e.y + (gy - e.y) * p - Math.sin(p * Math.PI) * 26;
      if (p >= 1) { c.hasEnv = true; COPS.envelope = null; }
    }

    /* cuffs snapping shut */
    if (COPS.cuffs) {
      const cf = COPS.cuffs;
      cf.t += fast;
      const was = cf.close;
      cf.close = Math.min(1, cf.t / 16);
      if (was < 1 && cf.close >= 1) { SFX.chak(); COPS._spark(cf.x, cf.y - 2, 6, [PIX.PAL.M, PIX.PAL.W]); }
    }
    if (COPS.grab) COPS.grab.t += fast;

    /* the wagon rolls past behind */
    if (COPS.wagon) {
      COPS.wagon.x += COPS.wagon.vx * fast;
      COPS.wagon.t = (COPS.wagon.t || 0) + fast;
      if (COPS.wagon.x < -180) COPS.wagon = null;
    }

    /* particles */
    COPS.parts = COPS.parts.filter(p => {
      p.t++; p.x += p.vx; p.y += p.vy; p.vy += p.g;
      return p.t < p.life;
    });

    COPS.active = COPS.cops.length > 0 || COPS.wash > 0.02 || !!COPS.wagon ||
      !!COPS.cuffs || !!COPS.grab || COPS.chips.length > 0 || !!COPS.envelope;
  },

  _spark(x, y, n, cols) {
    for (let i = 0; i < n; i++) {
      COPS.parts.push({
        x: x, y: y, t: 0, life: 10 + Math.random() * 10, s: 2,
        vx: (Math.random() - 0.5) * 2.6, vy: -Math.random() * 1.4 - 0.2, g: 0.12,
        col: cols[(Math.random() * cols.length) | 0],
      });
    }
  },

  _tap(c) {
    const hx = c.x + c.hR.x, hy = c.y - COPS.LEG_H + c.hR.y + c.bob;
    const tx = hx + Math.cos(c.stickA) * 21, ty = hy + Math.sin(c.stickA) * 21;
    COPS._spark(tx, ty, 3, [PIX.PAL.W, PIX.PAL.Y, PIX.PAL.q]);
    /* 'thock' out of the existing synth — no new SFX methods */
    SFX.noise(0.05, 0.16, 0, true);
    SFX.tone(150, 0.07, 'square', 0.1, 0, -60);
  },

  _boot(c) {
    SFX.deal();
    for (let i = 0; i < 3; i++) {
      COPS.parts.push({
        x: c.x - 4 + Math.random() * 10, y: c.y, t: 0, life: 16 + Math.random() * 10, s: 2,
        vx: (Math.random() - 0.5) * 0.8, vy: -0.25 - Math.random() * 0.3, g: -0.006,
        col: PIX.PAL.q,
      });
    }
  },

  _breath(c) {
    for (let i = 0; i < 3; i++) {
      COPS.parts.push({
        x: c.x - 16 - i, y: c.y - COPS.LEG_H - 50 + i, t: 0, life: 30 + i * 6, s: 2,
        vx: -0.4 - Math.random() * 0.3, vy: -0.12 - Math.random() * 0.14, g: -0.004,
        col: i === 0 ? PIX.PAL.W : PIX.PAL.M,
      });
    }
  },

  /* ============================================================
     drawing — world space (call BEFORE the table)
     ============================================================ */

  draw(ctx, t) {
    if (!COPS.active) return;
    if (COPS.wagon) COPS._drawWagon(ctx, COPS.wagon);
    /* far cops first so the nearest one overlaps (no copy for the common case) */
    if (COPS.cops.length > 1) {
      COPS.cops.slice().sort((a, b) => b.x - a.x).forEach(c => COPS._drawCop(ctx, c));
    } else if (COPS.cops.length) {
      COPS._drawCop(ctx, COPS.cops[0]);
    }
    COPS.parts.forEach(p => {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life) * 0.9;
      ctx.fillStyle = p.col;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    });
    ctx.globalAlpha = 1;
  },

  _drawCop(ctx, c) {
    const uni = COPS._uni(c.rank, COPS._def(c.rank));   // both memoised
    const fat = c.rank === 'sgt';
    const x0 = Math.round(c.x);
    const hip = Math.round(c.y - COPS.LEG_H + c.bob + c.dip);

    ctx.globalAlpha = 0.4;
    SPR.ellipse(ctx, x0 + 3, c.y + 1, fat ? 18 : 14, 4, '#050308');
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x0, hip);
    COPS._legs(ctx, c, uni);
    ctx.drawImage(COPS._composite(c.rank, c.expr), -Math.round(COPS.CW / 2), -COPS.CH);
    COPS._arms(ctx, c, uni, fat);
    ctx.restore();
  },

  /* trousers + boots, walked in two frames (the felt hides them once he stops) */
  _legs(ctx, c, uni) {
    const P = PIX.PAL;
    const tr = P[uni.trouser] || P.T;
    const sw = Math.sin(c.walk);
    const dx = c.moving ? Math.round(sw * 4) : 1;
    const up1 = c.moving ? Math.max(0, Math.round(sw * 3)) : 0;
    const up2 = c.moving ? Math.max(0, Math.round(-sw * 3)) : 0;

    const leg = (x, up) => {
      const h = 15 - up;
      PIX.rect(ctx, x - 1, -3, 13, h + 1, P.K);
      PIX.rect(ctx, x, -3, 11, h, tr);
      PIX.rect(ctx, x, -3, 2, h, 'rgba(255,255,255,.08)');
      PIX.rect(ctx, x + 8, -3, 3, h, 'rgba(0,0,0,.25)');
      if (uni.seam) PIX.rect(ctx, x + 1, -3, 1, h, P.G);
      const by = -3 + h;
      PIX.rect(ctx, x - 5, by, 18, 7, P.K);
      PIX.rect(ctx, x - 4, by + 1, 16, 5, P.k);
      PIX.rect(ctx, x - 4, by + 1, 13, 1, P.t);
      PIX.rect(ctx, x - 4, by + 5, 16, 1, P.Z);
    };
    leg(-13 - dx, up1);
    leg(3 + dx, up2);
  },

  _arms(ctx, c, uni, fat) {
    const P = PIX.PAL;
    const tunic = P[uni.tunic] || P.t;
    const tHi = P[uni.tunicHi] || P.s;
    /* the rig already hangs an upper arm down each side; we only bend the
       FOREARM up out of its wrist, so nothing double-draws */
    const el = fat ? 25 : 20;
    COPS._limb(ctx, el, -5, c.hR.x, c.hR.y, tunic, tHi);
    COPS._drawStick(ctx, c.hR.x, c.hR.y, c.stickA);
    COPS._glove(ctx, c.hR.x, c.hR.y, false, 0, false);
    COPS._limb(ctx, -el, -5, c.hL.x, c.hL.y, tunic, tHi);
    COPS._glove(ctx, c.hL.x, c.hL.y,
      c.armMode === 'palm' || c.armMode === 'grab', c.palmChips, c.hasEnv);
  },

  /* a stepped sleeve: ink pass then fill pass, snapped to 2px.
     segment count follows the length so the blocks always overlap */
  _limb(ctx, x0, y0, x1, y1, col, hi) {
    const P = PIX.PAL;
    const len = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
    const n = Math.max(4, Math.min(28, Math.round(len / 3)));
    const vert = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    /* three passes, not two: ink, then every fill, then every edge. Drawing the
       edge with its own step's fill let the NEXT step's fill eat most of it,
       which is what turns a sleeve into a rung ladder. */
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i <= n; i++) {
        const f = i / n;
        const px = Math.round((x0 + (x1 - x0) * f) / 2) * 2;
        const py = Math.round((y0 + (y1 - y0) * f) / 2) * 2;
        if (pass === 0) {
          PIX.rect(ctx, px - 5, py - 4, 9, 8, P.K);
        } else if (pass === 1) {
          PIX.rect(ctx, px - 4, py - 3, 7, 6, col);
        } else if (vert) {
          PIX.rect(ctx, px - 4, py - 3, 2, 6, hi);
          PIX.rect(ctx, px + 1, py - 3, 2, 6, 'rgba(0,0,0,.22)');
        } else {
          PIX.rect(ctx, px - 4, py - 3, 7, 1, hi);
          PIX.rect(ctx, px - 4, py + 1, 7, 2, 'rgba(0,0,0,.22)');
        }
      }
    }
  },

  _glove(ctx, x, y, open, chips, env) {
    const P = PIX.PAL;
    const gx = Math.round(x), gy = Math.round(y);
    PIX.disc(ctx, gx, gy, 5, P.K);
    PIX.disc(ctx, gx, gy, 4, P.T);
    PIX.rect(ctx, gx - 4, gy - 3, 4, 2, P.t);
    PIX.rect(ctx, gx + 1, gy, 3, 3, P.k);
    if (open) {                       // palm up, three fat fingers out to the left
      for (let i = -1; i <= 1; i++) {
        PIX.rect(ctx, gx - 10, gy - 4 + i * 3, 7, 3, P.K);
        PIX.rect(ctx, gx - 10, gy - 4 + i * 3, 6, 2, P.T);
        PIX.rect(ctx, gx - 10, gy - 4 + i * 3, 6, 1, P.t);
      }
    }
    for (let i = 0; i < chips; i++) {
      SPR.ellipse(ctx, gx - 2, gy - 5 - i * 2, 4, 2, P.K);
      SPR.ellipse(ctx, gx - 2, gy - 6 - i * 2, 3, 1.2, i % 2 ? P.G : P.R);
    }
    if (env) {
      const m = COPS._envSprite();
      ctx.drawImage(m, gx - 12, gy - 9);
    }
  },

  _drawStick(ctx, hx, hy, ang) {
    const m = COPS._stick();
    ctx.save();
    ctx.translate(Math.round(hx), Math.round(hy));
    ctx.rotate(ang);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(m, -3, -3);
    ctx.restore();
  },

  /* the paddy wagon, rolling past behind the table */
  _drawWagon(ctx, w) {
    const P = PIX.PAL;
    const x = Math.round(w.x), base = 106;
    const jog = (Math.floor(w.t / 6) % 2);
    const y = base - jog;
    /* box body */
    PIX.rect(ctx, x, y - 27, 78, 28, P.K);
    PIX.rect(ctx, x + 1, y - 26, 76, 26, P.Z);
    PIX.rect(ctx, x + 1, y - 26, 76, 1, P.t);
    /* cab, stepped down at the front (it drives left) */
    PIX.rect(ctx, x - 16, y - 20, 17, 21, P.K);
    PIX.rect(ctx, x - 15, y - 19, 16, 19, P.Z);
    PIX.rect(ctx, x - 15, y - 19, 16, 1, P.t);
    PIX.rect(ctx, x - 13, y - 17, 9, 7, P.T);
    PIX.rect(ctx, x - 13, y - 17, 9, 1, P.s);
    /* barred rear window */
    PIX.rect(ctx, x + 8, y - 22, 26, 11, P.K);
    PIX.rect(ctx, x + 9, y - 21, 24, 9, P.T);
    for (let i = 0; i < 6; i++) PIX.rect(ctx, x + 11 + i * 4, y - 21, 1, 9, P.s);
    /* wheels */
    [x + 8, x + 58].forEach(wx => {
      PIX.disc(ctx, wx, y + 1, 7, P.K);
      PIX.disc(ctx, wx, y + 1, 4, P.T);
      PIX.rect(ctx, wx - 1, y, 3, 3, P.s);
    });
    /* light bar */
    const on = (Math.floor(COPS.t / 7) % 2) === 0;
    PIX.rect(ctx, x + 26, y - 31, 22, 5, P.K);
    PIX.rect(ctx, x + 27, y - 30, 9, 3, on ? P.R : P.d);
    PIX.rect(ctx, x + 37, y - 30, 9, 3, on ? P.l : P.L);
    /* lettering */
    const txt = COPS._wagonText();
    if (txt && txt.width > 1) ctx.drawImage(txt, x + 16, y - 9);
  },

  /* ============================================================
     screen space: the light wash + the front layer
     ============================================================ */

  /* the wash gradients only depend on the canvas width, so build them once and
     slide the sweeping beam with a translate instead of rebuilding three
     gradient objects on every single frame of the light show */
  _grad(ctx, W) {
    if (COPS._grads && COPS._grads.w === W) return COPS._grads;
    const mk = (x0, x1, rgb) => {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, 'rgba(' + rgb + ',.95)');
      g.addColorStop(0.55, 'rgba(' + rgb + ',0)');
      return g;
    };
    const beam = (rgb) => {
      const g = ctx.createLinearGradient(-26, 0, 26, 0);
      g.addColorStop(0, 'rgba(' + rgb + ',0)');
      g.addColorStop(0.5, 'rgba(' + rgb + ',.7)');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      return g;
    };
    COPS._grads = {
      w: W,
      red: mk(0, W, '209,59,69'),
      blue: mk(W, 0, '127,215,255'),
      beamR: beam('255,106,94'),
      beamB: beam('127,215,255'),
    };
    return COPS._grads;
  },

  drawOverlay(ctx, W, H) {
    if (!COPS.active) return;
    const P = PIX.PAL;

    if (COPS.wash > 0.02) {
      const s = (Math.sin(COPS.t / 24) + 1) / 2;
      const a = Math.min(1, COPS.wash);
      const G0 = COPS._grad(ctx, W);
      ctx.save();
      ctx.globalAlpha = a * 0.34 * (0.3 + s * 0.7);
      ctx.fillStyle = G0.red; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = a * 0.34 * (1 - s * 0.7);
      ctx.fillStyle = G0.blue; ctx.fillRect(0, 0, W, H);
      /* a soft beam sweeping across the room */
      const bx = (0.5 + 0.5 * Math.sin(COPS.t / 46)) * W;
      ctx.globalAlpha = a * 0.1;
      ctx.translate(bx, 0);
      ctx.fillStyle = s > 0.5 ? G0.beamR : G0.beamB;
      ctx.fillRect(-bx, 0, W, H);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    /* --- world-space props that belong in FRONT of the felt --- */
    const ox = (typeof DUEL !== 'undefined' ? DUEL.OX : 0);
    const oy = (typeof DUEL !== 'undefined' ? DUEL.OY : 0);
    const shake = (typeof DUEL !== 'undefined' && DUEL.shake > 0.5) ? DUEL.shake : 0;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(ox + (Math.random() - 0.5) * shake),
      Math.round(oy + (Math.random() - 0.5) * shake));

    if (COPS.torch > 0.03) {
      const lit = COPS.cops.filter(c => c.torch);
      (lit.length ? lit : COPS.cops.slice(0, 1)).forEach(c => COPS._drawTorch(ctx, c));
    }

    COPS.chips.forEach(ch => {
      if (ch.px === undefined) return;
      SPR.ellipse(ctx, ch.px, ch.py, 4, 2.4, PIX.PAL.K);
      SPR.ellipse(ctx, ch.px, ch.py - 1, 3, 1.6, PIX.PAL[ch.col] || PIX.PAL.G);
      SPR.ellipse(ctx, ch.px, ch.py - 1, 1, 0.8, PIX.PAL.W);
    });

    if (COPS.envelope && COPS.envelope.px !== undefined) {
      ctx.drawImage(COPS._envSprite(), Math.round(COPS.envelope.px - 8),
        Math.round(COPS.envelope.py - 5));
    }
    if (COPS.grab) COPS._drawGrab(ctx, COPS.grab);
    if (COPS.cuffs) COPS._drawCuffs(ctx, COPS.cuffs);
    ctx.restore();
  },

  _drawTorch(ctx, c) {
    const P = PIX.PAL;
    const sw = Math.sin(COPS.t / 64);
    const hx = c.x + c.hL.x - 4, hy = c.y - COPS.LEG_H + c.hL.y;
    const spx = 176 + sw * 62, spy = 144;
    ctx.save();
    ctx.globalAlpha = 0.14 * COPS.torch;
    ctx.fillStyle = P.Y;
    ctx.beginPath();
    ctx.moveTo(hx, hy - 2); ctx.lineTo(spx - 24, spy); ctx.lineTo(spx + 22, spy - 7);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.22 * COPS.torch;
    SPR.ellipse(ctx, spx, spy - 4, 22, 7, P.Y);
    ctx.globalAlpha = 1;
    /* the torch itself, in his glove */
    PIX.rect(ctx, hx - 8, hy - 3, 9, 5, P.K);
    PIX.rect(ctx, hx - 7, hy - 2, 7, 3, P.T);
    PIX.rect(ctx, hx - 9, hy - 3, 2, 5, P.Y);
    ctx.restore();
  },

  /* a gloved fist and sleeve reaching in to clamp your shoulder */
  _drawGrab(ctx, g) {
    const P = PIX.PAL;
    const p = Math.min(1, g.t / 22);
    const hx = 132 - p * 24, hy = 148 + p * 14;
    /* a forearm coming up off the bottom edge — he is standing over you */
    COPS._limb(ctx, 150, 204, hx, hy, P.t, P.s);
    COPS._glove(ctx, hx, hy, false, 0, false);
    /* fingers dug into the shoulder */
    for (let i = -1; i <= 1; i++) {
      PIX.rect(ctx, hx - 4 + i * 4, hy + 4, 4, 6, P.K);
      PIX.rect(ctx, hx - 4 + i * 4, hy + 4, 3, 5, P.k);
      PIX.rect(ctx, hx - 4 + i * 4, hy + 4, 3, 1, P.t);
    }
  },

  /* your own wrists, coming up off the bottom edge, getting the bracelets */
  _drawCuffs(ctx, cf) {
    const P = PIX.PAL;
    const x = Math.round(cf.x), y = Math.round(cf.y);
    const open = 1 - cf.close;
    [[-9, 0], [7, 4]].forEach(([dx, dy]) => {
      PIX.rect(ctx, x + dx - 1, y + dy - 4, 11, 30, P.K);
      PIX.rect(ctx, x + dx, y + dy - 3, 9, 29, P.f);
      PIX.rect(ctx, x + dx, y + dy - 3, 2, 29, P.F);
      PIX.rect(ctx, x + dx + 6, y + dy - 3, 3, 29, P.e);
    });
    COPS._cuffRing(ctx, x - 4, y + 2, open);
    COPS._cuffRing(ctx, x + 12, y + 6, open);
    /* the chain between the bracelets */
    for (let i = 0; i < 4; i++) {
      PIX.rect(ctx, x + 2 + i * 2, y + 2 + i, 3, 3, P.K);
      PIX.rect(ctx, x + 2 + i * 2, y + 2 + i, 2, 2, P.M);
    }
  },

  _cuffRing(ctx, cx, cy, open) {
    const P = PIX.PAL;
    const r = 6;
    const a0 = -Math.PI * 0.5, a1 = a0 + Math.PI * (1.15 + 0.85 * (1 - open));
    for (let a = a0; a <= a1; a += 0.13) {
      const px = Math.round(cx + Math.cos(a) * r), py = Math.round(cy + Math.sin(a) * r);
      PIX.rect(ctx, px - 1, py - 1, 3, 3, P.K);
    }
    for (let a = a0; a <= a1; a += 0.13) {
      const px = Math.round(cx + Math.cos(a) * r), py = Math.round(cy + Math.sin(a) * r);
      PIX.rect(ctx, px - 1, py - 1, 2, 2, a < a0 + 1.4 ? P.M : P.S);
    }
    PIX.rect(ctx, cx + 2, cy - 9, 6, 5, P.K);      // lock body + keyhole
    PIX.rect(ctx, cx + 3, cy - 8, 4, 3, P.S);
    PIX.rect(ctx, cx + 4, cy - 7, 2, 1, P.K);
  },

  /* ============================================================
     the screen tips (CSS on the scene canvas; reset() undoes it)
     ============================================================ */

  _sceneEl() {
    if (typeof DUEL !== 'undefined' && DUEL.cv) return DUEL.cv;
    return document.getElementById('scene');
  },

  _applyTilt() {
    const cv = COPS._sceneEl();
    if (!cv) return;
    if (Math.abs(COPS.tilt) < 0.0015) { COPS._clearTilt(); return; }
    COPS._tilted = true;
    const deg = (COPS.tilt * 57.2958).toFixed(2);
    const sc = (1 + Math.abs(COPS.tilt) * 1.6).toFixed(3);
    const css = 'rotate(' + deg + 'deg) scale(' + sc + ')';
    /* only touch the style when it actually changed — once the tip settles this
       would otherwise force a style recalc on a fullscreen canvas every frame */
    if (css !== COPS._tiltCss) { COPS._tiltCss = css; cv.style.transform = css; }
  },

  _clearTilt() {
    if (!COPS._tilted) return;
    const cv = COPS._sceneEl();
    if (cv) cv.style.transform = '';
    COPS._tilted = false;
    COPS._tiltCss = '';
  },

  /* ============================================================
     promise helpers — frame driven, never block the loop
     ============================================================ */

  _nap(ms) {
    if (typeof DUEL !== 'undefined' && DUEL.sleep) return DUEL.sleep(ms);
    return new Promise(r => setTimeout(r, ms));
  },

  /* a stale skip flag left over from the shot would fast-forward all of this */
  _unhurry() {
    if (typeof DUEL !== 'undefined' && DUEL.hurry) DUEL.hurry = false;
  },

  /* Take ownership of the cops. Every public beat claims before it starts, so
     a beat fired while an older one is still awaiting (the pay button landing
     while shakedown() is still marching them in, say) makes the older one bail
     at its next check instead of re-posing cops the new beat has already moved.
     reset() bumps the same counter, which is why cancellation already works. */
  _claim() { return ++COPS._gen; },

  _until(cond, maxMs) {
    return new Promise(res => {
      const t0 = performance.now();
      const id = setInterval(() => {
        if (cond() || performance.now() - t0 > (maxMs || 4000)) { clearInterval(id); res(); }
      }, 16);
    });
  },

  /* ============================================================
     the beats
     ============================================================ */

  /* one badge walks in and stands there with his hand out */
  async arrive(rank) {
    COPS._unhurry();
    const gen = COPS._claim();
    const c = COPS._spawn(rank || 'beat', COPS.STAND);
    SFX.click();
    await COPS._until(() => COPS._gen !== gen || !c.moving, 4500);
    if (COPS._gen !== gen) return c;
    c.expr = 'smug';
    c.armMode = 'palm';
    await COPS._nap(240);
    if (COPS._gen !== gen) return c;
    c.tapping = true; c.tapT = 0;
    await COPS._nap(200);
    return c;
  },

  /* chips arc over one at a time, he pockets them, tips his cap, leaves */
  async bribe(amount) {
    const gen = COPS._claim();
    const c = COPS.cops[0];
    if (!c) return;
    c.tapping = false;
    c.armMode = 'palm';
    c.expr = 'grin';
    const n = Math.max(1, Math.min(6, Math.round((amount || 2) / 2)));
    for (let i = 0; i < n; i++) {
      COPS.chips.push({
        cop: c, t: 0, dur: 24, x: 62 + i * 4, y: 176,
        col: i % 2 ? 'G' : 'r',
      });
      SFX.tick();
      await COPS._nap(120);
      if (COPS._gen !== gen) return;
    }
    await COPS._until(() => COPS._gen !== gen || COPS.chips.length === 0, 1600);
    if (COPS._gen !== gen) return;
    c.armMode = 'pocket';
    SFX.bank();
    await COPS._nap(300);
    if (COPS._gen !== gen) return;
    c.palmChips = 0;
    c.armMode = 'salute';
    c.dipTo = 2;
    SFX.click();
    await COPS._nap(420);
    if (COPS._gen !== gen) return;
    c.dipTo = 0;
    c.expr = 'smug';
    c.armMode = 'idle';
    c.leaving = true; c.speed = 2; c.tx = COPS._offX();
    await COPS._until(() => COPS._gen !== gen || COPS.cops.indexOf(c) < 0, 3500);
  },

  /* he shrugs, folds his arms, and is not going anywhere */
  async refuse() {
    const gen = COPS._claim();
    const c = COPS.cops[0] || COPS._spawn('beat', COPS.STAND);
    c.tapping = false;
    c.armMode = 'shrug';
    c.expr = 'worry';
    c.dipTo = -3;
    SFX.dud();
    await COPS._nap(320);
    if (COPS._gen !== gen) return;
    c.dipTo = 0;
    c.armMode = 'fold';
    c.expr = 'angry';
    await COPS._nap(400);
  },

  /* after a boss: two or three of them march in and flank the table */
  /* _gen: internal — bust() passes its own claim so the march-in it triggers
     counts as part of the bust instead of cancelling it */
  async shakedown(n, _gen) {
    COPS._unhurry();
    const gen = (_gen === undefined) ? COPS._claim() : _gen;
    const count = Math.max(2, Math.min(3, n || 2));
    COPS.washTo = 1;
    COPS.torchTo = 1;
    SFX.jamSfx();
    const ranks = ['sgt', 'beat', 'beat'];
    for (let i = 0; i < count; i++) {
      const c = COPS._spawn(ranks[i], COPS.FLANK[i], i);
      c.speed = Math.max(c.speed, 1.7);   // never below the distance-aware walk-in
      c.torch = (i === 1);
      SFX.deal();
      await COPS._nap(220);
      if (COPS._gen !== gen) return;
    }
    await COPS._until(() => COPS._gen !== gen || COPS.cops.every(c => !c.moving), 4500);
    if (COPS._gen !== gen) return;
    COPS.cops.forEach((c, i) => {
      c.armMode = i === 0 ? 'palm' : 'idle';
      c.expr = i === 0 ? 'angry' : 'neutral';
    });
    if (COPS.cops[0]) { COPS.cops[0].tapping = true; COPS.cops[0].tapT = 0; }
    SFX.chak();
    await COPS._nap(320);
  },

  /* the envelope changes hands, salutes all round, they go */
  async paid() {
    const gen = COPS._claim();
    const c = COPS.cops[0];
    if (!c) return;
    c.tapping = false;
    c.armMode = 'palm';
    COPS.envelope = { cop: c, t: 0, dur: 30, x: 66, y: 178 };
    SFX.deal();
    await COPS._until(() => COPS._gen !== gen || !COPS.envelope, 1400);
    if (COPS._gen !== gen) return;
    c.expr = 'grin';
    SFX.bank();
    await COPS._nap(280);
    if (COPS._gen !== gen) return;
    c.armMode = 'pocket';
    await COPS._nap(260);
    if (COPS._gen !== gen) return;
    c.hasEnv = false;
    COPS.cops.forEach(k => { k.armMode = 'salute'; k.dipTo = 2; k.expr = 'smug'; });
    SFX.click();
    SFX.tone(880, 0.12, 'square', 0.07);
    await COPS._nap(520);
    if (COPS._gen !== gen) return;
    COPS.washTo = 0;
    COPS.torchTo = 0;
    COPS.cops.forEach((k, i) => {
      k.dipTo = 0; k.armMode = 'idle'; k.tapping = false;
      k.leaving = true; k.speed = 2; k.tx = COPS._offX() + i * 16;
    });
    await COPS._until(() => COPS._gen !== gen || COPS.cops.length === 0, 4500);
  },

  /* you can't pay: cuffs, a raised stick, the wagon, and the room tips */
  async bust() {
    COPS._unhurry();
    const gen = COPS._claim();
    if (!COPS.cops.length) {
      await COPS.shakedown(2, gen);
      if (COPS._gen !== gen) return;
    }
    COPS.washTo = 1.3;
    COPS.torchTo = 0.4;
    COPS.wagon = { x: 340, vx: -1.5, t: 0 };
    COPS.cops.forEach((c, i) => {
      c.tapping = false; c.speed = 2.1; c.expr = 'angry';
      c.armMode = 'grab'; c.tx = COPS._fit(246, i) - i * 40;
    });
    SFX.jamSfx();
    await COPS._nap(620);
    if (COPS._gen !== gen) return;
    COPS.grab = { t: 0 };
    SFX.hurt();
    await COPS._nap(260);
    if (COPS._gen !== gen) return;
    COPS.cuffs = { x: 84, y: 170, t: 0, close: 0 };
    COPS.tiltTo = 0.05;
    await COPS._nap(300);
    if (COPS._gen !== gen) return;
    const front = COPS.cops[COPS.cops.length - 1] || COPS.cops[0];
    if (front) front.armMode = 'raise';
    SFX.jamSfx();
    await COPS._nap(360);
    if (COPS._gen !== gen) return;
    SFX.backfire();
    SFX.lose();
    if (typeof UI !== 'undefined' && UI.shake) UI.shake();
    COPS.tiltTo = -0.08;
    await COPS._nap(640);
    if (COPS._gen !== gen) return;
    COPS.tiltTo = 0.035;
    await COPS._nap(900);
    /* let the tip ease out again: the caller normally tears the scene down on
       the next line, but a CSS transform left pinned on a canvas that survives
       would rotate + scale the whole game until the next duel reset it */
    COPS.tiltTo = 0;
  },
};
