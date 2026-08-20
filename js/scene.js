'use strict';
/* ============================================================
   SHELL & DEBT — scene.js
   THE ROOMS YOU WALK AROUND IN.

   A side-on 2D room, wider than the screen, that you move
   through by tapping the floor. No menu, no button strip: the
   things you can do are objects in the room, and you do them by
   walking up to them. Where a thing wants explaining it says so
   on a little drawn plate over its own head.

   World space is fixed height (H) and arbitrary width; the
   camera follows you and the backdrop is painted once into an
   offscreen canvas, so the per-frame cost is the cast, the
   lamplight and the dust.
   ============================================================ */

const SCENE = (() => {

  const H = 132;                 // world height, px
  let def = null;                // the room definition in play
  let back = null;               // painted backdrop canvas
  let cv, ctx, K = 4;            // display canvas + integer scale
  let raf = null, t0 = 0, last = 0;
  let cam = 0, camWant = 0, drag = null;
  let me = { x: 60, v: 0, frame: 0, face: 1, walk: 0, land: 0, target: null, act: null };
  let hover = null, near = null, busy = false;
  const keys = {};
  const puffs = [];                 // dust off his heels
  /* the rain field: one set of drops, reused by every outdoor room */
  const rain = (() => {
    const r = U.mulberry32(90210), out = [];
    for (let i = 0; i < 200; i++) {
      out.push({ x: r(), y: r(), s: r(), len: 3 + Math.floor(r() * 4) });
    }
    return out;
  })();

  /* he came down on it: squash him, knock the heel, kick the dust */
  function land(force) {
    me.land = Math.max(me.land, force);
    kickDust(force);
    if (force > 0.6) SFX.tone(70, 0.05, 'square', 0.05);
  }
  function kickDust(force) {
    const n = force > 0.6 ? 5 : 2;
    for (let i = 0; i < n; i++) {
      puffs.push({
        x: me.x - me.face * (2 + Math.random() * 4), y: 0,
        vx: -me.face * (4 + Math.random() * 12), vy: -(6 + Math.random() * 14),
        t: 0, life: 0.3 + Math.random() * 0.4,
      });
    }
  }

  /* ============================================================
     THE CAST.

     There is no second frog rig. A person in a room is the game's
     whole-frog sprite sampled down to room scale, so the frog you
     walk past is the frog you sit down across from — same head,
     same coat, same four-fingered hands.
     ============================================================ */

  /* ============================================================
     HOW BIG A PERSON IS, AND HOW MUCH OF HIM YOU GET.

     A frog stands FOOT rig-pixels to the room's one, so his
     footprint in the room never changes and every desk, doorway and
     hotspot stays where it was. What does change is which copy of
     him gets drawn into that footprint: at a frame scale where the
     numbers come out even, the room draws the FULL 102x129 rig and
     lets the screen blow it up by a whole number, which is three
     times the detail it used to have. Where that would land on a
     fraction — and a fraction means some rows doubled and some not,
     which looks like a broken sprite — it falls back to a properly
     resampled and re-inked smaller copy.
     ============================================================ */
  const FOOT = 3;                // rig pixels per room pixel

  function lodFor() {
    for (const down of [1, 2, 3]) if ((K * down) % FOOT === 0) return down;
    return FOOT;
  }

  /* { cv, w, h } — the picture, and the room-space box it goes in */
  function rig(d, frame, face) {
    const down = lodFor();
    const cv = SPR.rigLOD(d.key || SPR.defKey(d), d.def || d, frame, face, down);
    return { cv, w: (cv.width * down) / FOOT, h: (cv.height * down) / FOOT };
  }

  /* how tall a person is in this room, for placing hotspots */
  function rigH(d) { return rig(d, 0, 1).h; }

  /* a plain canvas at room scale, for the cinematics that stage their own
     little rooms and do not have a camera scale to be even with */
  function rigPic(d, frame, face, down) {
    return SPR.rigLOD(d.key || SPR.defKey(d), d.def || d, frame, face, down || FOOT);
  }

  /* ============================================================
     BUILD
     ============================================================ */

  let oy = 0;                    // how far down the room sits in the frame

  const CEIL_MAX = 38;           // world px of headroom, at most

  function scale() {
    const host = document.getElementById('scene-root');
    const w = window.innerWidth;
    const h = host ? host.clientHeight || (window.innerHeight - 66) : window.innerHeight - 66;
    /* Fill the height first — a room with more ceiling than room in it reads
       as a bug — but never show less than about 200 world px across, or the
       camera is inside somebody's coat. */
    let k = Math.max(2, Math.floor(h / H));
    /* A FRAME SCALE THAT IS A MULTIPLE OF THREE pays for itself: it is the
       only one where the full-detail rig blows up by a whole number, so the
       cast gets three times the pixels. If stepping up to one only costs a
       few rows off the foreground floor, take it. */
    if ((k + 1) % 3 === 0 && h / (k + 1) >= H) k += 1;
    while (k > 2 && w / k < 200) k--;
    K = k;
    cv.width = Math.ceil(w / K) * K;
    /* How many world rows the frame can actually hold. More than the room
       is headroom and gets a ceiling; fewer means the bottom strip of
       foreground floor goes over the edge, which nobody misses — cropping
       the TOP would take the lamps, the signs and the arches with it. */
    const rows = Math.max(60, Math.floor(h / K));
    const worldH = Math.min(rows, H + CEIL_MAX);
    cv.height = worldH * K;
    cv.style.width = cv.width + 'px';
    cv.style.height = cv.height + 'px';
    /* SETTING canvas.width WIPES THE CONTEXT — including the one flag that
       matters here. Without this the whole room is drawn through a bilinear
       filter at K times its size, which is exactly what "the scene is
       blurry" looks like. */
    ctx.imageSmoothingEnabled = false;
    oy = Math.max(0, worldH - H);    // the room stands on the bottom edge
  }

  function viewW() { return Math.ceil(cv.width / K); }
  function viewH() { return Math.floor(cv.height / K); }

  function open(d) {
    close();
    def = d;
    busy = false;
    const host = document.getElementById('scene-root') || (() => {
      const r = U.el('div'); r.id = 'scene-root';
      document.getElementById('app').appendChild(r);
      return r;
    })();
    host.innerHTML = '';
    host.className = 'scene-root';
    cv = document.createElement('canvas');
    cv.className = 'pix scene-cv';
    ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    host.appendChild(cv);
    scale();
    back = paintBack(d);
    rats.length = 0; drips.length = 0; mark = null;
    ratClock = 1.5 + Math.random() * 3;
    me.x = d.enterX === undefined ? 40 : d.enterX;
    me.face = d.enterFace || 1;
    me.target = null; me.act = null; me.walk = 0; me.frame = 0;
    cam = U.clamp(me.x - viewW() / 2, 0, Math.max(0, d.w - viewW()));
    camWant = cam;
    hover = null; near = null;
    bind(host);
    t0 = performance.now(); last = t0;
    if (!raf) raf = requestAnimationFrame(frame);
    if (d.onOpen) d.onOpen();
  }

  function close() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    const host = document.getElementById('scene-root');
    if (host) { host.innerHTML = ''; host.className = 'hidden'; }
    unbind();
    def = null; back = null;
  }

  function paintBack(d) {
    const o = ART.cv(d.w, H);
    d.paint(o.c, d.w, H);
    return o.cv;
  }

  /* ============================================================
     INPUT — tap the floor to walk, tap a thing to use it,
     drag to look down the room, keys for the impatient.
     ============================================================ */

  let onDown, onMove, onUp, onKey, onKeyUp, onResize;

  function sceneX(ev) {
    const r = cv.getBoundingClientRect();
    const cx = (ev.clientX === undefined ? (ev.touches && ev.touches[0].clientX) : ev.clientX) - r.left;
    return cam + cx / K;
  }
  function sceneY(ev) {
    const r = cv.getBoundingClientRect();
    const cy = (ev.clientY === undefined ? (ev.touches && ev.touches[0].clientY) : ev.clientY) - r.top;
    return cy / K - oy;
  }

  function targets() {
    if (!def) return [];
    const out = [];
    for (const a of (def.actors || [])) if (!a.gone) out.push(a);
    for (const s of (def.spots || [])) if (!s.gone && !(s.when && !s.when())) out.push(s);
    return out;
  }

  function pick(x, y) {
    let best = null, bd = 1e9;
    for (const o of targets()) {
      const w = o.w || 26, top = o.top === undefined ? def.floorY - 44 : o.top;
      const bot = o.bot === undefined ? def.floorY + 6 : o.bot;
      if (x > o.x - w / 2 - 4 && x < o.x + w / 2 + 4 && y > top - 8 && y < bot + 4) {
        const dd = Math.abs(x - o.x);
        if (dd < bd) { bd = dd; best = o; }
      }
    }
    return best;
  }

  function bind(host) {
    onDown = (ev) => {
      if (busy || !def) return;
      SFX.init();
      drag = { x0: ev.clientX, cam0: cam, moved: 0 };
      host.setPointerCapture && ev.pointerId !== undefined && host.setPointerCapture(ev.pointerId);
    };
    onMove = (ev) => {
      if (!def) return;
      const x = sceneX(ev), y = sceneY(ev);
      hover = pick(x, y);
      cv.style.cursor = hover ? 'pointer' : 'default';
      if (drag && ev.buttons) {
        const dx = (ev.clientX - drag.x0) / K;
        drag.moved = Math.max(drag.moved, Math.abs(dx));
        if (drag.moved > 6) camWant = U.clamp(drag.cam0 - dx, 0, Math.max(0, def.w - viewW()));
      }
    };
    onUp = (ev) => {
      if (busy || !def) { drag = null; return; }
      const wasDrag = drag && drag.moved > 6;
      drag = null;
      if (wasDrag) return;                    // that was a look, not a step
      const x = sceneX(ev), y = sceneY(ev);
      const hit = pick(x, y);
      if (hit) goUse(hit);
      else walkTo(x);
    };
    onKey = (ev) => {
      if (!def) return;
      const k = ev.key.toLowerCase();
      keys[k] = true;
      if (k === 'e' || k === ' ' || k === 'enter') {
        ev.preventDefault();
        if (near && !busy) use(near);
      }
    };
    onKeyUp = (ev) => { keys[ev.key.toLowerCase()] = false; };
    onResize = () => { if (def) { scale(); } };
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
  }

  function unbind() {
    if (!onDown) return;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);
    onDown = null;
  }

  function walkTo(x) {
    if (!def) return;
    me.target = U.clamp(x, 12, def.w - 12);
    me.act = null;
    setMark(me.target);
  }

  /* walk over there and then do the thing */
  function goUse(o) {
    const stand = o.x + (o.standOff === undefined ? (me.x > o.x ? 16 : -16) : o.standOff);
    me.target = U.clamp(stand, 12, def.w - 12);
    me.act = o;
    setMark(o.x);
    if (Math.abs(me.x - me.target) < 6) { me.target = null; use(o); }
  }

  async function use(o) {
    if (busy || !o || !o.onUse) return;
    busy = true;
    me.face = o.x >= me.x ? 1 : -1;
    try { await o.onUse(); } finally { busy = false; }
  }

  /* ============================================================
     STEP + DRAW
     ============================================================ */

  const SPEED = 54;              // top speed, world px per second
  const ACCEL = 300;             // and how hard he gets to it

  /* WEIGHT. He used to travel at a flat 46px/s and stop dead on the mark,
     which is what makes a walk cycle look like a slide. Now he leans into
     it, coasts, brakes into the mark and lands on it — and the landing is
     a squash, a puff of dust and a heel knock. */
  function step(dt) {
    /* keyboard walk overrides a tapped target */
    let kx = 0;
    if (keys['a'] || keys['arrowleft']) kx -= 1;
    if (keys['d'] || keys['arrowright']) kx += 1;
    if (kx) { me.target = null; me.act = null; }
    let moving = false;
    let want = 0;                                  // -1, 0, +1
    if (kx) want = kx;
    else if (me.target !== null) {
      const d = me.target - me.x;
      /* how much room braking needs at this speed; inside it, brake */
      const brake = (me.v * me.v) / (2 * ACCEL) + 1.5;
      want = Math.abs(d) <= brake ? 0 : Math.sign(d);
      if (Math.abs(d) < 1.4 && Math.abs(me.v) < 8) {
        me.x = me.target; me.target = null; me.v = 0;
        land(0.7);
        if (me.act) { const a = me.act; me.act = null; use(a); }
      }
    }
    if (want || Math.abs(me.v) > 0.5) {
      const target = want * SPEED;
      const rate = want ? ACCEL : ACCEL * 1.6;     // brakes bite harder
      me.v += U.clamp(target - me.v, -rate * dt, rate * dt);
      const nx = U.clamp(me.x + me.v * dt, 12, def.w - 12);
      if (nx === me.x && Math.abs(me.v) > 24) land(0.5);   // walked into a wall
      me.x = nx;
      if (Math.abs(me.v) > 4) me.face = me.v > 0 ? 1 : -1;
      moving = Math.abs(me.v) > 8;
    } else me.v = 0;
    /* the squash from the last landing, and the dust it kicked */
    if (me.land > 0) me.land = Math.max(0, me.land - dt * 4.5);
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p2 = puffs[i];
      p2.t += dt; p2.x += p2.vx * dt; p2.y += p2.vy * dt; p2.vy += 26 * dt;
      if (p2.t > p2.life) puffs.splice(i, 1);
    }
    /* the walk cycle runs off ground covered, not off the clock, so the feet
       never skate: slow steps at the start of a stride, quick in the middle */
    if (moving) {
      const was = Math.floor(me.walk);
      me.walk = (me.walk + Math.abs(me.v) * dt * 0.135) % 4;
      if (Math.floor(me.walk) !== was && Math.floor(me.walk) % 2 === 0) {
        SFX.tone(88 + Math.random() * 30, 0.03, 'square', 0.038);
        kickDust(0.4);
      }
    } else me.walk = U.approach(me.walk, 0, 9, dt);
    me.frame = Math.floor(me.walk) % 4;

    /* what is within arm's reach */
    let best = null, bd = 26;
    for (const o of targets()) {
      const d = Math.abs(o.x - me.x);
      if (d < bd) { bd = d; best = o; }
    }
    near = best;

    /* the camera: follow, but let a drag lead it, and never show past the
       walls. A room narrower than the frame is centred in it instead. */
    const vw = viewW();
    if (def.w <= vw) {
      camWant = -(vw - def.w) / 2;
    } else {
      /* lead the walk a little: the camera looks where he is going */
      if (!drag) camWant = me.x + me.v * 0.34 - vw / 2;
      camWant = U.clamp(camWant, 0, def.w - vw);
    }
    cam = U.approach(cam, camWant, 5, dt);
    if (Math.abs(cam - camWant) < 0.4) cam = camWant;

    stepCritters(dt, 0);
    if (def.onTick) def.onTick(dt, me);
  }

  /* ============================================================
     DEPTH.

     Three layers behind and in front of the room itself, all moving
     at different rates, because a side-on room with one layer in it
     reads as a painted flat:

       THE VAULT   the headroom over the room becomes the city it is
                   buried in — brick arches going away, a pipe run,
                   sodium lights a long way off. Scrolls at 0.4.
       THE ROOM    the painted set. Scrolls at 1.
       THE FORE    pipes, chains and grime across the lens, almost
                   black, scrolling at 1.3 so it reads as close.

     Every room gets all three without having to ask: the vault and
     the fore are generated from the room's id, so they are the same
     every time you walk in and different in every place.
     ============================================================ */

  function vaultCv(d, oyy, vw) {
    const key = 'vault:' + d.id + ':' + oyy + ':' + vw;
    return ART.cached(key, () => {
      const w = Math.max(vw + 40, Math.ceil(d.w * 0.45) + vw);
      const o = ART.cv(w, Math.max(4, oyy + 4)), c = o.c;
      const rng = U.mulberry32(U.hashSeed('vault:' + d.id));
      /* the dark of the vault, and the damp on it */
      ART.px(c, 0, 0, w, oyy + 4, '#080b12');
      for (let i = 0; i < oyy; i += 2) {
        ART.px(c, 0, i, w, 1, 'rgba(30,42,60,' + (0.05 + (i / oyy) * 0.12).toFixed(3) + ')');
      }
      /* brick arches, going away from you */
      const pitch = 74;
      for (let x = -20; x < w; x += pitch) {
        const aw = 54, ah = Math.max(8, oyy - 6);
        ART.px(c, x, oyy - ah, aw, ah, '#0c1220');
        for (let i = 0; i < 8; i++) {
          const t = i / 8, iw = Math.round(aw * (1 - t * 0.22));
          ART.px(c, x + Math.round((aw - iw) / 2), oyy - ah + Math.round(t * 5), iw, 2, '#101827');
        }
        /* the keystone and the sodium light hung in it */
        ART.px(c, x + (aw >> 1) - 3, oyy - ah - 2, 6, 4, '#141d2e');
        if (rng() < 0.5) {
          const ly = oyy - Math.round(ah * 0.55);
          ART.px(c, x + (aw >> 1) - 2, ly, 4, 3, '#3a2f18');
          ART.px(c, x + (aw >> 1) - 1, ly + 1, 2, 2, '#ffcf6a');
          for (let g = 1; g < 5; g++) {
            ART.px(c, x + (aw >> 1) - g, ly + 3, g * 2, 1, 'rgba(255,207,106,' + (0.06 / g).toFixed(3) + ')');
          }
        }
      }
      /* the pipe run, with brackets and a slow drip */
      const py = Math.max(2, Math.round(oyy * 0.3));
      ART.px(c, 0, py, w, 5, '#1b2230');
      ART.px(c, 0, py, w, 1, '#2c3648');
      ART.px(c, 0, py + 4, w, 1, '#0a0e16');
      for (let x = 12; x < w; x += 38) {
        ART.px(c, x, py - 2, 4, 9, '#141a26');
        ART.px(c, x + 1, py - 2, 1, 9, '#28323f');
      }
      return o.cv;
    });
  }

  function foreCv(d, vw) {
    const key = 'fore:' + d.id + ':' + vw;
    return ART.cached(key, () => {
      const w = Math.max(vw + 60, Math.ceil(d.w * 1.3) + 40);
      const o = ART.cv(w, H + 40), c = o.c;
      const rng = U.mulberry32(U.hashSeed('fore:' + d.id));
      /* a fat pipe across the very top, close enough to be out of focus */
      ART.px(c, 0, 0, w, 9, '#05070c');
      ART.px(c, 0, 9, w, 2, 'rgba(120,150,180,.05)');
      for (let x = 0; x < w; x += 46) {
        ART.px(c, x, 0, 6, 14, '#05070c');
        if (rng() < 0.4) {                        // a chain hanging off it
          const cl = 10 + Math.floor(rng() * 22);
          for (let i = 0; i < cl; i += 3) ART.px(c, x + 2, 12 + i, 2, 2, '#04060a');
        }
      }
      /* grime up the sides of the lens */
      for (let i = 0; i < 90; i++) {
        const gx = Math.floor(rng() * w), gy = Math.floor(rng() * (H + 30));
        const edge = Math.min(gx % vw, vw - (gx % vw));
        if (edge > vw * 0.22) continue;
        ART.px(c, gx, gy, 1 + Math.floor(rng() * 3), 1, 'rgba(4,6,10,.5)');
      }
      return o.cv;
    });
  }

  /* ============================================================
     WHAT LIVES HERE.

     Rats, mostly. They come out of one wall, run the floor line and
     go into the other one; they stop, they think about it, they go
     on. There is a drip in every room and something in the air near
     every lamp. None of it is interactive and all of it is why the
     room does not look like a photograph.
     ============================================================ */

  const rats = [];
  const drips = [];
  let ratClock = 2 + Math.random() * 4;

  function spawnRat() {
    if (!def || rats.length > 2) return;
    const dir = Math.random() < 0.5 ? 1 : -1;
    rats.push({
      x: dir > 0 ? -8 : def.w + 8,
      dir, v: 26 + Math.random() * 26,
      y: def.floorY - 1,
      pause: 0, t: Math.random() * 6,
      big: Math.random() < 0.35,
    });
  }

  function stepCritters(dt, T) {
    ratClock -= dt;
    if (ratClock <= 0) { spawnRat(); ratClock = 5 + Math.random() * 9; }
    for (let i = rats.length - 1; i >= 0; i--) {
      const r = rats[i];
      r.t += dt;
      if (r.pause > 0) { r.pause -= dt; continue; }
      r.x += r.dir * r.v * dt;
      if (Math.random() < dt * 0.5) r.pause = 0.2 + Math.random() * 0.5;
      if (r.x < -20 || r.x > def.w + 20) rats.splice(i, 1);
    }
    /* the drip: one per room, from a fixed seam, forever */
    if (!drips.length && def) {
      const rng = U.mulberry32(U.hashSeed('drip:' + def.id));
      const n = 1 + Math.floor(rng() * 2);
      for (let i = 0; i < n; i++) {
        drips.push({ x: 30 + Math.floor(rng() * Math.max(40, def.w - 60)), y: 0, v: 0, t: rng() * 3 });
      }
    }
    for (const d2 of drips) {
      d2.t -= dt;
      if (d2.t <= 0) {
        d2.y += (d2.v += 220 * dt) * dt;
        if (d2.y > def.floorY - 2) { d2.y = 0; d2.v = 0; d2.t = 1.4 + Math.random() * 3; d2.splash = 0.4; }
      }
      if (d2.splash > 0) d2.splash -= dt;
    }
  }

  function drawCritters(c, T) {
    /* the drips, and the ring they leave */
    for (const d2 of drips) {
      if (d2.t <= 0) ART.px(c, Math.round(d2.x), Math.round(d2.y), 1, 3, 'rgba(150,200,230,.5)');
      if (d2.splash > 0) {
        const a = d2.splash / 0.4;
        ART.px(c, Math.round(d2.x - 2 * (1 - a) - 1), def.floorY - 2, 2, 1, 'rgba(170,215,240,' + (a * 0.5).toFixed(2) + ')');
        ART.px(c, Math.round(d2.x + 2 * (1 - a)), def.floorY - 2, 2, 1, 'rgba(170,215,240,' + (a * 0.5).toFixed(2) + ')');
      }
    }
    /* the rats */
    for (const r of rats) {
      const k = r.big ? 1 : 0;
      const x = Math.round(r.x), y = Math.round(r.y);
      const run = Math.sin(r.t * 22) > 0 ? 0 : 1;
      /* A RAT ON A BLACK FLOOR HAS TO BE PAINTED LIGHT or it is a rumour:
         wet grey-brown with a lit back, not the near-black it would be. */
      const body = '#5b5163', dark = '#2b2436', lit = '#7d7288';
      ART.px(c, x - 5, y, 11 + k, 1, 'rgba(0,0,0,.35)');       // his shadow
      ART.px(c, x - 4, y - 4 - k, 9 + k, 4 + k, body);
      ART.px(c, x - 4, y - 4 - k, 9 + k, 1, lit);
      ART.px(c, x - 4, y - 1, 9 + k, 1, dark);
      /* head, pointing where he is going */
      const hx = r.dir > 0 ? x + 5 + k : x - 6;
      ART.px(c, hx, y - 4 - k, 3, 3, body);
      ART.px(c, hx, y - 4 - k, 3, 1, lit);
      ART.px(c, r.dir > 0 ? hx + 3 : hx - 1, y - 3 - k, 1, 1, '#ff9dc0');   // nose
      ART.px(c, r.dir > 0 ? hx + 1 : hx + 1, y - 4 - k, 1, 1, '#f4efe0');   // eye
      /* ears */
      ART.px(c, hx + (r.dir > 0 ? 0 : 1), y - 6 - k, 2, 2, dark);
      /* tail, with a kink in it */
      const tx = r.dir > 0 ? x - 5 : x + 4 + k;
      for (let i = 0; i < 5; i++) {
        ART.px(c, tx - r.dir * i, y - 3 - k + (i > 2 ? 1 : 0) + (run && i > 1 ? 1 : 0), 1, 1, dark);
      }
      /* feet */
      ART.px(c, x - 3 + run, y - 1, 2, 1, dark);
      ART.px(c, x + 2 - run + k, y - 1, 2, 1, dark);
    }
  }

  /* ============================================================
     THE MARKER.

     You tapped there. It draws where "there" is, counts itself down
     and goes out when he arrives — without it, a tap on the floor
     is an act of faith.
     ============================================================ */
  let mark = null;

  function setMark(x) { mark = { x, t: 0 }; }

  function drawMark(c, T) {
    if (!mark) return;
    if (me.target === null) { mark.t += 0.06; if (mark.t > 1) { mark = null; return; } }
    else mark.t = 0;
    const a = 1 - mark.t;
    const x = Math.round(mark.x), y = def.floorY;
    const bob = Math.round(Math.sin(T * 7) * 1.5);
    /* a stepped chevron over a ring on the floor */
    ART.px(c, x - 5, y - 2, 11, 2, 'rgba(255,215,94,' + (0.16 * a).toFixed(3) + ')');
    ART.px(c, x - 7, y - 1, 15, 1, 'rgba(255,215,94,' + (0.22 * a).toFixed(3) + ')');
    for (let i = 0; i < 4; i++) {
      const w = 7 - i * 2;
      ART.px(c, x - (w >> 1), y - 12 - bob + i * 2, w, 2, i === 0
        ? 'rgba(255,243,176,' + a.toFixed(2) + ')'
        : 'rgba(255,215,94,' + (a * (1 - i * 0.18)).toFixed(2) + ')');
    }
    ART.px(c, x - 1, y - 20 - bob, 2, 6, 'rgba(255,215,94,' + (a * 0.6).toFixed(2) + ')');
  }

  function draw(now) {
    const T = (now - t0) / 1000;
    const c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, cv.width, cv.height);
    c.save();
    c.scale(K, K);
    /* THE CEILING. Whatever headroom the frame has over the room gets a
       real ceiling in it: joists, the cords the lamps hang off, and the
       dark these places keep up there. */
    const vw2 = viewW();
    if (oy > 0) {
      ART.px(c, 0, 0, vw2, oy + 2, '#0b0d14');
      ART.px(c, 0, 0, vw2, Math.max(1, Math.round(oy * 0.35)), '#080a10');
      /* joists across, in perspective: closer together toward the top */
      const camr = Math.round(cam);
      for (let i = 1; i * i < oy * 3; i++) {
        const y = oy - Math.round(i * i * 0.9);
        if (y < 1) break;
        ART.px(c, 0, y, vw2, 1, 'rgba(255,255,255,.035)');
        ART.px(c, 0, y + 1, vw2, 1, 'rgba(0,0,0,.3)');
      }
      /* the beams running the other way, tied to world x so they scroll */
      for (let x = -(camr % 46); x < vw2; x += 46) {
        ART.px(c, x, 0, 3, oy, 'rgba(0,0,0,.35)');
        ART.px(c, x, 0, 1, oy, 'rgba(255,255,255,.03)');
      }
      /* the cords of whatever hangs in this room, going up into it */
      for (const L of (def.lights || [])) {
        const lx = Math.round(L.x - camr);
        if (lx < -4 || lx > vw2 + 4) continue;
        ART.px(c, lx, 0, 1, oy + 2, '#2a2d38');
      }
      ART.px(c, 0, oy, vw2, 2, '#05060a');
    }
    /* THE VAULT, over the room, going by at less than half the rate */
    if (oy > 2) {
      const vau = vaultCv(def, oy, vw2);
      c.drawImage(vau, -Math.round(cam * 0.4) % Math.max(1, vau.width - vw2), 0);
    }

    c.translate(-Math.round(cam), oy);
    /* the painted room */
    c.drawImage(back, 0, 0);

    /* ---- THE BACKGROUND, seen through the holes in the room ----
       A wall with nothing behind it is a flat. Every room declares the
       openings it has — an arch, a doorway, a window onto the canal — and
       the vault behind them slides past at a third of the rate. */
    for (const dp of (def.depth || [])) {
      const vau = vaultCv(def, Math.max(10, dp.h), viewW());
      c.save();
      c.beginPath();
      c.rect(dp.x, dp.y, dp.w, dp.h);
      c.clip();
      const span = Math.max(1, vau.width - dp.w);
      const off = dp.x - (Math.round(cam * 0.33) % span);
      c.drawImage(vau, off, dp.y + dp.h - vau.height);
      c.drawImage(vau, off + span, dp.y + dp.h - vau.height);
      /* the dark that always sits in a hole in a wall */
      ART.px(c, dp.x, dp.y, dp.w, 2, 'rgba(0,0,0,.55)');
      ART.px(c, dp.x, dp.y, 2, dp.h, 'rgba(0,0,0,.4)');
      ART.px(c, dp.x + dp.w - 2, dp.y, 2, dp.h, 'rgba(0,0,0,.4)');
      for (let i = 0; i < 6; i++) {
        ART.px(c, dp.x, dp.y + dp.h - 1 - i, dp.w, 1, 'rgba(0,0,0,' + (0.06 * (6 - i)).toFixed(2) + ')');
      }
      c.restore();
    }
    if (def.onPaintOver) def.onPaintOver(c, T, cam, viewW());

    /* everybody in it, back to front by x-depth then y */
    const cast = [];
    for (const a of (def.actors || [])) {
      if (a.gone) continue;
      cast.push({ y: a.y === undefined ? def.floorY : a.y, draw: () => drawActor(c, a, T) });
    }
    cast.push({ y: def.floorY + 0.5, draw: () => drawMe(c, T) });
    drawMark(c, T);
    drawCritters(c, T);
    cast.sort((p, q) => p.y - q.y).forEach(o => o.draw());

    /* furniture that people stand behind */
    if (def.onPaintFront) def.onPaintFront(c, T);
    /* the lamps, over the cast, so people stand in the light */
    for (const L of (def.lights || [])) {
      const flick = L.flicker ? (Math.sin(T * 13 + L.x) > 0.86 ? 0.5 : 1) : 1;
      cone(c, L.x, L.y, L.r || 46, (L.a || 0.055) * flick, def.floorY);
    }
    /* dust in the air, cheap and constant */
    motes(c, T);
    if (def.onPaintFore) def.onPaintFore(c, T, cam, viewW());

    /* THE FORE: pipes and grime across the lens, moving faster than the room */
    {
      const fo = foreCv(def, vw2);
      const off = -Math.round(cam * 1.3) % Math.max(1, fo.width - vw2);
      c.drawImage(fo, Math.round(cam) + off, -oy);
    }

    /* ============================================================
       THE NIGHT ITSELF.

       Every room belongs to the same night: the hour tints it, and
       if you are outdoors the weather falls through it. Without this
       the city is five unrelated rooms with a clock in the corner.
       ============================================================ */
    if (typeof CITY !== 'undefined' && G.phase !== 'title') {
      const w = viewW();
      const hour = CITY.watch(), sky = CITY.sky();
      if (hour.tint) ART.px(c, cam, -oy, w, H + oy, hour.tint);
      if (def.outdoor) {
        /* RAIN. Real drops with their own x, or a linear sequence folds
           them into a handful of columns and it reads as prison bars. */
        if (sky.drops > 0.1 && rain.length) {
          const span = H + oy + 24;
          const lim = Math.min(rain.length, Math.round(w * sky.drops * 0.5));
          for (let i = 0; i < lim; i++) {
            const d = rain[i];
            const x = cam + ((d.x * (w + 30) + T * 12 * sky.drops) % (w + 30)) - 15;
            const y = ((d.y * span + T * (150 + d.s * 210) * sky.drops) % span) - oy - 12;
            ART.px(c, Math.round(x), Math.round(y), 1, d.len, 'rgba(170,205,235,.22)');
          }
          /* and what it does when it lands */
          for (let i = 0; i < Math.round(w / 22); i++) {
            const d = rain[(i * 7) % rain.length];
            if ((Math.round(T * 5) + i) % 4) continue;
            ART.px(c, cam + Math.round(d.x * w), def.floorY - 1, 3, 1, 'rgba(190,220,240,.18)');
          }
        }
        if (sky.haze) {
          for (let i = 0; i < H; i += 3) {
            ART.px(c, cam, -oy + i, w, 1, 'rgba(200,212,220,.035)');
          }
        }
        /* the storm, once in a while, from off over the bay */
        if (sky.flash) {
          const f = Math.sin(T * 0.7) > 0.995 ? 1 : (Math.sin(T * 0.7 + 0.06) > 0.995 ? 0.5 : 0);
          if (f) ART.px(c, cam, -oy, w, H + oy, 'rgba(200,220,255,' + (0.22 * f) + ')');
        }
      }
    }

    /* the edges of the frame, so a room has corners */
    const vw = viewW();
    for (let i = 0; i < 16; i++) {
      const a = 0.42 * (1 - i / 16);
      ART.px(c, cam, H - 1 - i, vw, 1, 'rgba(0,0,0,' + (a * 0.5) + ')');
      ART.px(c, cam + i, -oy, 1, H + oy, 'rgba(0,0,0,' + (a * 0.7) + ')');
      ART.px(c, cam + vw - 1 - i, -oy, 1, H + oy, 'rgba(0,0,0,' + (a * 0.7) + ')');
    }
    c.restore();

    /* the diegetic label: what the thing under your hand is called */
    const show = hover && Math.abs(hover.x - me.x) < 300 ? hover : near;
    if (show && !busy) plate(show);
    else { const pl = document.getElementById('scene-plate'); if (pl) pl.style.display = 'none'; }
    if (def.onHud) def.onHud(c, K, viewW(), cam);
  }

  function drawActor(c, a, T) {
    const face = a.face === undefined ? -1 : a.face;
    /* somebody stood in a room still shifts his weight now and then */
    const idle = a.still ? 0 : (Math.sin(T * 1.3 + (a.x % 9)) > 0.9 ? 1 : 0);
    const r = rig(a, idle, face);
    const fy = a.y === undefined ? def.floorY : a.y;
    ART.px(c, Math.round(a.x - r.w / 3), fy, Math.round(r.w * 0.66), 2, 'rgba(0,0,0,.32)');
    c.drawImage(r.cv, Math.round(a.x - r.w / 2), Math.round(fy - r.h + 1), r.w, r.h);
  }

  function drawMe(c, T) {
    const r = rig(SCENE.meDef(), me.frame, me.face);
    const fy = def.floorY;
    /* the dust goes down first, so his shoes stand in it */
    for (const p2 of puffs) {
      const a = 0.3 * (1 - p2.t / p2.life);
      ART.px(c, Math.round(p2.x), Math.round(fy - 1 + p2.y), 1, 1, 'rgba(214,206,186,' + a.toFixed(3) + ')');
    }
    /* squash on landing, and a whisker of stretch at speed: both pinned to
       the floor so his feet never leave it */
    const sq = me.land * 0.16;
    const st = Math.min(0.05, Math.abs(me.v) / SPEED * 0.05);
    const w = Math.max(1, Math.round(r.w * (1 + sq - st * 0.5)));
    const h = Math.max(1, Math.round(r.h * (1 - sq + st)));
    const shW = Math.round(r.w * (0.66 + sq));
    ART.px(c, Math.round(me.x - shW / 2), fy, shW, 2, 'rgba(0,0,0,.38)');
    c.drawImage(r.cv, Math.round(me.x - w / 2), Math.round(fy - h + 1), w, h);
  }

  /* A lamp cone. Kept faint on purpose: a visible triangle painted on a
     wall reads as a bug, so most of the light lands on the floor. */
  function cone(c, x, y, r, a, fy) {
    const steps = Math.max(4, Math.round((fy - y) / 8));
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const hw = 3 + t * r * 0.5;
      ART.px(c, x - hw, y + i * 8, hw * 2, 8, 'rgba(255,231,163,' + (a * 0.4 * (1 - t * 0.5)) + ')');
    }
    /* the pool it throws, and the hot line right under the bulb */
    for (let i = 0; i < 4; i++) {
      const hw = r * (0.4 + i * 0.2);
      ART.px(c, x - hw, fy - 3 + i, hw * 2, 1, 'rgba(255,231,163,' + (a * (1.4 - i * 0.3)) + ')');
    }
  }

  let MOTES = null;
  function motes(c, T) {
    if (!MOTES) {
      const rng = U.mulberry32(4242);
      MOTES = Array.from({ length: 46 }, () => ({
        x: rng() * 600, y: rng() * H, s: 0.15 + rng() * 0.5, ph: rng() * 9,
      }));
    }
    for (const m of MOTES) {
      const y = (m.y + T * m.s * 6) % H;   /* dust only lives in the lit room */
      const x = m.x + Math.sin(T * 0.6 + m.ph) * 3;
      ART.px(c, Math.round(x), Math.round(y), 1, 1, 'rgba(255,240,200,.16)');
    }
  }

  /* ============================================================
     THE PLATE — drawn, not CSS. Sits over the thing it names.
     ============================================================ */
  const plateEl = () => {
    let p = document.getElementById('scene-plate');
    if (!p) {
      p = U.el('div'); p.id = 'scene-plate'; p.className = 'scene-plate';
      (document.getElementById('scene-root') || document.body).appendChild(p);
    }
    return p;
  };

  let lastPlate = '';
  function plate(o) {
    const label = typeof o.label === 'function' ? o.label() : o.label;
    if (!label) { const p = plateEl(); p.style.display = 'none'; return; }
    const hint = typeof o.hint === 'function' ? o.hint() : o.hint;
    const key = label + '|' + (hint || '') + '|' + (Math.abs(o.x - me.x) < 26);
    const p = plateEl();
    if (key !== lastPlate) {
      lastPlate = key;
      p.innerHTML = '';
      const inRange = Math.abs(o.x - me.x) < 26;
      p.appendChild(SPR.speech({
        lines: [label],
        foot: inRange ? (hint || 'TAP') : null,
        /* a plate that is half the width of a phone is a wall, not a label */
        maxW: Math.max(90, Math.min(190, window.innerWidth * 0.42)),
        rim: inRange ? PIX.PAL.g : PIX.PAL.t,
      }));
    }
    p.style.display = 'block';
    const r = cv.getBoundingClientRect();
    const sx = r.left + (o.x - cam) * K;
    const sy = r.top + ((o.top === undefined ? def.floorY - 46 : o.top) - 8 + oy) * K;
    const halfW = (p.offsetWidth || 160) / 2;
    p.style.left = Math.round(U.clamp(sx, halfW + 6, window.innerWidth - halfW - 6)) + 'px';
    p.style.top = Math.round(Math.max(6, sy - p.offsetHeight)) + 'px';
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!def) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    draw(now);
  }

  return {
    H, open, close, walkTo, rig, rigH, rigPic,
    /* the ?debug harness pokes these so a screenshot can catch the vermin */
    debugRats(n) { for (let i = 0; i < (n || 1); i++) spawnRat(); },
    debugRatCount() { return rats.length; },
    debugRatsWhere() { return rats.map(r => ({ x: Math.round(r.x), d: r.dir, v: Math.round(r.v) })); },
    get def() { return def; },
    get me() { return me; },
    at(x) { me.x = x; },
    say(o) { return plate(o); },
    /* You are the same frog out here as you are across the table. */
    meDef() {
      if (!SCENE._me) SCENE._me = { key: 'me', def: DUEL.myDef() };
      return SCENE._me;
    },
    busy(v) { if (v !== undefined) busy = v; return busy; },
    /* ============================================================
       THE CAMERA, WHEN THE STORY WANTS IT.
       ============================================================ */

    /* park the camera somewhere and hold it there */
    look(x) {
      if (!def) return;
      const vw = viewW();
      camWant = def.w <= vw ? -(vw - def.w) / 2 : U.clamp(x - vw / 2, 0, def.w - vw);
      drag = { x0: 0, cam0: camWant, moved: 99 };
    },
    release() { drag = null; },

    /* Ease the camera from one end of the room to the other. Nobody can
       walk while it moves — this is a shot, not a stroll. */
    async pan(fromX, toX, ms) {
      if (!def) return;
      busy = true;
      const t0 = performance.now();
      SCENE.look(fromX);
      for (;;) {
        const k = (performance.now() - t0) / (ms || 1400);
        if (k >= 1) break;
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;  // ease in-out
        SCENE.look(fromX + (toX - fromX) * e);
        await U.sleep(24);
      }
      SCENE.look(toX);
      busy = false;
    },

    /* hold on whoever is talking, then give the room back */
    focus(x) { busy = true; SCENE.look(x); },
    unfocus() { busy = false; drag = null; },
  };
})();
