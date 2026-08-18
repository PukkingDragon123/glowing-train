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
  let me = { x: 60, vx: 0, frame: 0, face: 1, walk: 0, target: null, act: null };
  let hover = null, near = null, busy = false;
  const keys = {};

  /* ============================================================
     THE WALK RIG.
     One small side-on frog, built out of parts so the same code
     draws the detective, the captain, a uniform, or a drunk at
     the bar — and walks all of them. 4-frame cycle.
     ============================================================ */

  function rigKey(d, frame, face) {
    return 'rig:' + (d.key || 'x') + ':' + frame + ':' + face +
      ':' + [d.coat, d.hatCol, d.fat ? 1 : 0, d.hat ? 1 : 0, d.cap ? 1 : 0,
             d.cigar ? 1 : 0, d.glasses ? 1 : 0, d.scar ? 1 : 0, d.gold ? 1 : 0].join('');
  }

  /* d: { key, skin:[lit,mid,dark], coat, coatDark, shirt, tie, hat, hatCol,
          fat, cap (peaked cap), skirt, badge } */
  function rig(d, frame, face) {
    return ART.cached(rigKey(d, frame, face), () => {
      const W = 26, T = 40;
      const o = ART.cv(W, T), c = o.c, P = PIX.PAL;
      const K0 = PIX.PAL.K;
      const skin = P[d.skin[0]] || P.F, mid = P[d.skin[1]] || P.f, dk = P[d.skin[2]] || P.e;
      const coat = P[d.coat] || P.T, coatD = P[d.coatDark] || P.K;
      const shirt = P[d.shirt] || P.W, tie = P[d.tie] || P.d;
      const px = ART.px;
      /* the walk: two legs, opposite phase, and a body that rises a pixel */
      const swing = [0, 1, 0, -1][frame];
      const bob = [0, -1, 0, 0][frame];
      const cx = 13;
      const fat = d.fat ? 2 : 0;

      /* --- legs, behind the coat --- */
      const legY = 30;
      [[-3, swing], [3, -swing]].forEach(([lx, sw], i) => {
        const bx = cx + lx + sw;
        px(c, bx - 2, legY, 4, 8, K0);
        px(c, bx - 1, legY, 2, 7, i ? coatD : coat);
        /* shoe, pointing the way we face */
        px(c, bx - 3 + (face > 0 ? 1 : -1), legY + 7, 6, 3, K0);
        px(c, bx - 2 + (face > 0 ? 1 : -1), legY + 8, 4, 1, P.t);
      });

      /* --- the coat: shoulders that slope, a lapel, a hem that kicks --- */
      const bodyY = 17 + bob;
      const halfW = 7 + fat;
      px(c, cx - halfW, bodyY, halfW * 2 + 1, 15, K0);
      px(c, cx - halfW + 1, bodyY + 1, halfW * 2 - 1, 13, coat);
      /* the shoulders are the top two rows, one pixel narrower */
      px(c, cx - halfW + 2, bodyY, halfW * 2 - 3, 1, K0);
      px(c, cx - halfW + 1, bodyY + 1, 2, 13, P[d.coatLit] || coat);      // lit edge
      px(c, cx + halfW - 2, bodyY + 1, 1, 13, coatD);                     // shadow edge
      /* the seam down the front, and a button on it */
      px(c, cx + 1, bodyY + 5, 1, 9, coatD);
      px(c, cx + 1, bodyY + 8, 1, 1, P[d.coatLit] || coat);
      /* the hem, kicked by the stride */
      px(c, cx - halfW + (swing > 0 ? 1 : 0), bodyY + 13, halfW * 2 + 1, 3, K0);
      px(c, cx - halfW + 1 + (swing > 0 ? 1 : 0), bodyY + 13, halfW * 2 - 1, 2, coatD);
      /* THE COLLAR. A narrow V of shirt with a lapel either side of it —
         a wide slab of white here reads as a sheet of paper taped to him. */
      if (d.shirt !== null) {
        px(c, cx - 2, bodyY + 2, 4, 3, shirt);
        px(c, cx - 1, bodyY + 5, 2, 3, shirt);
        px(c, cx, bodyY + 8, 1, 2, shirt);
        px(c, cx, bodyY + 4, 1, 5, tie);                                  // the tie, thin
        px(c, cx, bodyY + 3, 1, 1, P.K);                                  // its knot
        /* lapels, folded back off the collar */
        px(c, cx - 4, bodyY + 2, 2, 2, coatD);
        px(c, cx - 3, bodyY + 4, 1, 2, coatD);
        px(c, cx + 2, bodyY + 2, 2, 2, coatD);
        px(c, cx + 2, bodyY + 4, 1, 2, coatD);
      }
      if (d.badge) { px(c, cx - 5, bodyY + 5, 2, 3, P.G); px(c, cx - 5, bodyY + 5, 1, 1, P.Y); }

      /* --- the arm nearest us, swinging opposite the near leg --- */
      const ax = cx + (face > 0 ? 4 : -6) + fat * (face > 0 ? 1 : -1);
      px(c, ax, bodyY + 3 - swing, 4, 9, K0);
      px(c, ax + 1, bodyY + 4 - swing, 2, 7, coat);
      px(c, ax, bodyY + 12 - swing, 4, 3, K0);                            // the hand
      px(c, ax + 1, bodyY + 12 - swing, 2, 2, mid);

      /* --- the head: a frog skull in profile, eye bulb on top --- */
      const hy = 6 + bob, hx = cx + (face > 0 ? 1 : -1);
      /* ink pass */
      px(c, hx - 7, hy, 14, 11, K0);
      px(c, hx + (face > 0 ? 6 : -7), hy + 4, 4, 6, K0);                  // snout
      /* fill */
      px(c, hx - 6, hy + 1, 12, 9, skin);
      px(c, hx - 6, hy + 6, 12, 4, mid);                                  // under the jaw
      px(c, hx + (face > 0 ? 6 : -6), hy + 5, 3, 4, skin);
      /* the eye bulb, sitting proud of the skull */
      const ex = hx + (face > 0 ? 2 : -4);
      px(c, ex - 1, hy - 2, 6, 5, K0);
      px(c, ex, hy - 1, 4, 3, skin);
      px(c, ex + (face > 0 ? 2 : 1), hy, 2, 2, K0);                       // pupil
      px(c, ex + (face > 0 ? 2 : 1), hy, 1, 1, P.W);                      // catchlight
      /* the mouth line, all the way back */
      px(c, hx - 6, hy + 7, 12, 1, dk);
      /* --- the hat --- */
      if (d.cap) {                                                        // peaked police cap
        const hc = P[d.hatCol] || P.T;
        px(c, hx - 7, hy - 5, 15, 4, K0);
        px(c, hx - 6, hy - 4, 13, 2, hc);
        px(c, hx - 6, hy - 3, 13, 1, P.K);
        px(c, hx + (face > 0 ? 5 : -8), hy - 2, 4, 2, K0);                // the peak
        px(c, hx - 2, hy - 4, 4, 2, P.G);                                 // the badge on it
      } else if (d.hat) {                                                 // fedora
        const hc = P[d.hatCol] || P.T, band = P[d.band] || P.d;
        px(c, hx - 6, hy - 7, 12, 6, K0);
        px(c, hx - 5, hy - 6, 10, 4, hc);
        px(c, hx - 5, hy - 3, 10, 1, band);
        px(c, hx - 9, hy - 2, 19, 2, K0);                                 // the brim
        px(c, hx - 8, hy - 2, 17, 1, hc);
      }
      /* --- what a witness would remember about him --- */
      if (d.glasses) {                                                  // a bar over both bulbs
        px(c, hx - 6, hy - 1, 13, 3, K0);
        px(c, hx - 5, hy, 4, 1, P.L);
        px(c, hx + 1, hy, 4, 1, P.L);
      }
      if (d.scar) { px(c, hx + (face > 0 ? 3 : -4), hy + 2, 1, 4, P.d); }
      if (d.gold) { px(c, hx + (face > 0 ? 5 : -5), hy + 7, 1, 1, P.G); }
      if (d.cigar) {                                                    // the stub, and its smoke
        const cx2 = hx + (face > 0 ? 8 : -10);
        px(c, cx2, hy + 6, 4, 2, P.U);
        px(c, cx2 + (face > 0 ? 4 : -1), hy + 6, 1, 2, P.O);
        px(c, cx2 + (face > 0 ? 4 : -1), hy + 3, 1, 1, 'rgba(200,200,210,.4)');
        px(c, cx2 + (face > 0 ? 5 : -2), hy + 1, 1, 1, 'rgba(200,200,210,.25)');
      }
      return o.cv;
    });
  }

  /* Turn a full frog def — the language the big portrait rig speaks — into
     the small walking rig, keeping whatever a person would notice about him
     from across a room: his colour, his build, his hat, his smoke. */
  function rigFromFrog(def, key) {
    const C = (typeof SPR !== 'undefined' && SPR.costumeOf) ? SPR.costumeOf(def) : null;
    const O = C && (C.overcoat || C.jacket);
    return {
      key: 'f:' + (key || SPR.defKey(def)),
      skin: def.skin || ['F', 'f', 'e'],
      coat: (O && O.col) || def.suit || 'T',
      coatDark: (O && O.dark) || 'K',
      coatLit: (O && O.lit) || 't',
      shirt: def.shirt || 'W',
      tie: def.tie || def.bowtie || 'd',
      fat: !!def.fat,
      hat: !!def.hat, cap: !!def.flatcap,
      hatCol: def.hatCol || 'T', band: def.band || 'd',
      cigar: !!def.cigar, glasses: def.glasses === 'shades' || !!def.glasses,
      scar: !!def.scar, gold: !!def.goldtooth,
      badge: false,
    };
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
    while (k > 2 && w / k < 200) k--;
    K = k;
    cv.width = Math.ceil(w / K) * K;
    /* whatever height is left over past the room and its headroom is a bar */
    const worldH = Math.min(Math.max(H, Math.floor(h / K)), H + CEIL_MAX);
    cv.height = worldH * K;
    cv.style.width = cv.width + 'px';
    cv.style.height = cv.height + 'px';
    oy = worldH - H;                 // the room stands on the bottom edge
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
  }

  /* walk over there and then do the thing */
  function goUse(o) {
    const stand = o.x + (o.standOff === undefined ? (me.x > o.x ? 16 : -16) : o.standOff);
    me.target = U.clamp(stand, 12, def.w - 12);
    me.act = o;
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

  const SPEED = 46;              // world px per second

  function step(dt) {
    /* keyboard walk overrides a tapped target */
    let kx = 0;
    if (keys['a'] || keys['arrowleft']) kx -= 1;
    if (keys['d'] || keys['arrowright']) kx += 1;
    if (kx) { me.target = null; me.act = null; }
    let moving = false;
    if (kx) {
      me.x = U.clamp(me.x + kx * SPEED * dt, 12, def.w - 12);
      me.face = kx > 0 ? 1 : -1;
      moving = true;
    } else if (me.target !== null) {
      const d = me.target - me.x;
      if (Math.abs(d) < 2) {
        me.x = me.target; me.target = null;
        if (me.act) { const a = me.act; me.act = null; use(a); }
      } else {
        me.x += Math.sign(d) * Math.min(Math.abs(d), SPEED * dt);
        me.face = d > 0 ? 1 : -1;
        moving = true;
      }
    }
    /* the walk cycle, and a footstep every other frame */
    if (moving) {
      const was = Math.floor(me.walk);
      me.walk = (me.walk + dt * 7.5) % 4;
      if (Math.floor(me.walk) !== was && Math.floor(me.walk) % 2 === 0) SFX.tone(90 + Math.random() * 30, 0.03, 'square', 0.035);
    } else me.walk = 0;
    me.frame = Math.floor(me.walk);

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
      if (!drag) camWant = me.x - vw / 2;
      camWant = U.clamp(camWant, 0, def.w - vw);
    }
    cam += (camWant - cam) * Math.min(1, dt * 6);
    if (Math.abs(cam - camWant) < 0.4) cam = camWant;

    if (def.onTick) def.onTick(dt, me);
  }

  function draw(now) {
    const T = (now - t0) / 1000;
    const c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
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
    c.translate(-Math.round(cam), oy);
    /* the painted room */
    c.drawImage(back, 0, 0);
    if (def.onPaintOver) def.onPaintOver(c, T, cam, viewW());

    /* everybody in it, back to front by x-depth then y */
    const cast = [];
    for (const a of (def.actors || [])) {
      if (a.gone) continue;
      cast.push({ y: a.y === undefined ? def.floorY : a.y, draw: () => drawActor(c, a, T) });
    }
    cast.push({ y: def.floorY + 0.5, draw: () => drawMe(c, T) });
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
    const d = a.def || { key: a.id, skin: ['F', 'f', 'e'], coat: 'T', coatDark: 'K' };
    const face = a.face === undefined ? -1 : a.face;
    const idle = a.still ? 0 : (Math.sin(T * 1.7 + (a.x % 7)) > 0.94 ? 1 : 0);
    const cvv = rig(d, idle, face);
    c.drawImage(cvv, Math.round(a.x - 13), Math.round((a.y === undefined ? def.floorY : a.y) - 40));
    ART.px(c, Math.round(a.x - 8), (a.y === undefined ? def.floorY : a.y) + 1, 16, 2, 'rgba(0,0,0,.3)');
  }

  function drawMe(c, T) {
    const cvv = rig(SCENE.meDef(), me.frame, me.face);
    c.drawImage(cvv, Math.round(me.x - 13), Math.round(def.floorY - 40));
    /* the shadow he stands in */
    ART.px(c, Math.round(me.x - 8), def.floorY + 1, 16, 2, 'rgba(0,0,0,.35)');
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
    H, open, close, walkTo, rig, rigFromFrog,
    get def() { return def; },
    get me() { return me; },
    at(x) { me.x = x; },
    say(o) { return plate(o); },
    meDef() {
      return {
        key: 'me', skin: ['F', 'f', 'e'], coat: 'T', coatDark: 'K', coatLit: 't',
        shirt: 'W', tie: 'd', hat: true, hatCol: 'T', band: 'K', badge: true,
      };
    },
    busy(v) { if (v !== undefined) busy = v; return busy; },
    /* let the story move the camera for a beat */
    look(x) { camWant = U.clamp(x - viewW() / 2, 0, Math.max(0, (def ? def.w : 0) - viewW())); drag = { x0: 0, cam0: camWant, moved: 99 }; },
    release() { drag = null; },
  };
})();
