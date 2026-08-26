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
  /* THE WALKER HAS TWO AXES NOW.
     x runs along the street; z runs INTO it, 0 at the kerb nearest the
     camera and 1 at the far wall. A room says how deep it is with
     depthBand (rows); a room that does not say is flat, and behaves
     exactly the way every room did before. */
  let me = { x: 60, v: 0, z: 0.12, vz: 0, tz: null, frame: 0, face: 1, faceZ: 0,
    walk: 0, land: 0, target: null, act: null };
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
  function rig(d, frame, face, back, expr) {
    const down = lodFor();
    const cv = SPR.rigLOD((d.key || SPR.defKey(d)) + (back ? ':b' : ''),
      d.def || d, frame, face, down, back, expr);
    return { cv, w: (cv.width * down) / FOOT, h: (cv.height * down) / FOOT };
  }

  /* ============================================================
     WHAT EVERYBODY'S FACE IS DOING WHILE YOU ARE IN THE ROOM.

     Not random. Every actor carries a `mood` — the barman is
     bored, a witness who likes you is pleased, a suspect watches
     you — and on top of that mood there is a slow loop of the
     small things a face does when nobody is talking to it: a
     blink, a glance away, a moment of thinking about something
     else. The loop is seeded off the actor's own x, so two frogs
     in the same room are never in step.
     ============================================================ */
  const MOOD_IDLE = {
    /* mood            what it does when it drifts */
    bored:   ['bored', 'bored', 'blink', 'sniff'],
    happy:   ['happy', 'happy', 'blink', 'joy'],
    pleased: ['happy', 'neutral', 'blink', 'wink'],
    watch:   ['neutral', 'doubt', 'blink', 'squint'],
    shifty:  ['worry', 'neutral', 'blink', 'think'],
    hard:    ['angry', 'neutral', 'blink', 'squint'],
    sad:     ['sad', 'sad', 'blink', 'worry'],
    neutral: ['neutral', 'neutral', 'blink', 'think'],
  };

  function faceOf(mood, T, seed) {
    const set = MOOD_IDLE[mood] || MOOD_IDLE.neutral;
    /* one step every 2.2s, with the seed pushing each frog off the others */
    const step = Math.floor(T / 2.2 + (seed % 13) * 0.77);
    /* the blink is quick: it only lands in the first fifth of its slot */
    const into = (T / 2.2 + (seed % 13) * 0.77) % 1;
    const pick = set[((step % set.length) + set.length) % set.length];
    if (pick === 'blink' && into > 0.22) return set[0];
    return pick;
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
  let mouse = { x: 0, y: 0, on: false };
  let hoverRat = null;

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
    spawnPets();
    spawnCrowd();
    spawnTraffic();
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

  /* ============================================================
     DEPTH.

     One number per room — how many world rows of walkable ground
     there are between the kerb and the back wall — and everything
     else falls out of it: where a walker's feet land, how big he is
     drawn, who is in front of whom, and what a click on the road
     actually means.
     ============================================================ */
  function band() { return (def && def.depthBand) || 0; }
  function floorAt(z) {
    return def.floorY - Math.round((z || 0) * band());
  }
  /* further away is smaller, but never so much that he turns into a dot */
  function scaleAt(z) {
    return band() ? 1 - (z || 0) * 0.24 : 1;
  }
  /* a click on the ground, turned back into a place on it */
  function zFromY(y) {
    const b = band();
    if (!b) return 0;
    return U.clamp((def.floorY - y) / b, 0, 1);
  }
  /* how far apart two things on the ground really are */
  function dist2(ax, az, bx, bz) {
    const dz = (az - bz) * band() * 1.6;          // a step back is worth more
    return Math.hypot(ax - bx, dz);
  }

  /* the cursor says what the click is about to do */
  function refreshCursor() {
    if (!cv) return;
    if (typeof TOOLS === 'undefined') { cv.style.cursor = hover ? 'pointer' : 'default'; return; }
    cv.style.cursor = TOOLS.css(TOOLS.cur(), !!(hover || hoverRat));
  }

  /* ---------------------------------------------------------
     THE GLASS.

     The rooms are painted at full pixel detail and then drawn at
     a third of it, so most of what is in the art is too small to
     read. This crops the actual painted room around a point and
     blows it up with hard edges — so anything hidden in a shelf
     is really in there, and the glass is how you find it.
     --------------------------------------------------------- */
  function magnify(wx, wy, rad, k) {
    if (!def || !back) return null;
    rad = rad || 22; k = k || 5;
    const x0 = Math.round(U.clamp(wx - rad, 0, Math.max(0, def.w - rad * 2)));
    const y0 = Math.round(U.clamp(wy - rad, 0, Math.max(0, H - rad * 2)));
    const o = ART.cv(rad * 2 * k, rad * 2 * k);
    o.c.imageSmoothingEnabled = false;
    o.c.drawImage(back, x0, y0, rad * 2, rad * 2, 0, 0, rad * 2 * k, rad * 2 * k);
    return o.cv;
  }

  /* which rat, if any, is under a point */
  function ratAt(x, y) {
    for (const r of rats) {
      if (r.dead) continue;
      if (Math.abs(r.x - x) < 9 && Math.abs((r.y - 3) - y) < 9) return r;
    }
    return null;
  }

  function targets() {
    if (!def) return [];
    const out = [];
    for (const a of (def.actors || [])) if (!a.gone) out.push(a);
    for (const s of (def.spots || [])) if (!s.gone && !(s.when && !s.when())) out.push(s);
    /* the animals are things you can walk up to as well */
    for (const a of pets) {
      const fy = a.y === undefined ? floorAt(a.z) : a.y;
      out.push({
        id: 'pet:' + a.kind, x: a.x, w: 22, z: a.z,
        top: fy - (a.kind === 'dog' ? 24 : 20), bot: fy + 2,
        pet: a,
        label: a.name,
        hint: a.kind === 'dog' ? 'HE HAS BEEN WAITING ALL SHIFT' : 'IT IS NOT YOUR CAT',
        onUse: () => STORY.petIt(a),
      });
    }
    /* and what one of them left on the pavement */
    for (const m of messes) {
      if (m.done) continue;
      const fy = floorAt(m.z);
      out.push({
        id: 'mess', x: m.x, w: 20, z: m.z, top: fy - 12, bot: fy + 3,
        mess: m,
        label: 'SOMETHING ON THE PAVEMENT',
        hint: 'THERE IS A SCOOP ON THE CART',
        onUse: () => STORY.scoopIt(m),
      });
    }
    return out;
  }

  function pick(x, y) {
    let best = null, bd = 1e9;
    for (const o of targets()) {
      const w = o.w || 26;
      /* a thing standing back in the room has its box up there with it */
      const fy = floorAt(o.z), dy = fy - def.floorY;
      const top = o.top === undefined ? fy - 44 : o.top + dy;
      const bot = o.bot === undefined ? fy + 6 : o.bot + dy;
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
      mouse = { x, y, on: true };
      hover = pick(x, y);
      /* with the iron out, vermin are targets too */
      hoverRat = (typeof TOOLS !== 'undefined' && TOOLS.is('iron')) ? ratAt(x, y) : null;
      refreshCursor();
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
      const tool = typeof TOOLS === 'undefined' ? 'hand' : TOOLS.cur();

      /* THE EYEGLASS. You do not walk anywhere to look at something: you
         hold it up from where you stand and the room comes to you. */
      if (tool === 'glass') { STORY.lookClose(hit, x, y); return; }

      /* THE IRON. A rat is a rat. A frog is a decision. */
      if (tool === 'iron') {
        const r = ratAt(x, y);
        if (r) { STORY.shootRat(r, x, y); return; }
        if (hit) { STORY.aimAt(hit); return; }
        STORY.shootWide(x, y);
        return;
      }

      if (hit) goUse(hit);
      else walkTo(x, zFromY(y));
    };
    onKey = (ev) => {
      if (!def) return;
      const k = ev.key.toLowerCase();
      keys[k] = true;
      /* the belt: 1 hand, 2 glass, 3 iron, Q to cycle */
      if (typeof TOOLS !== 'undefined' && !busy && TOOLS.onKey(k)) { ev.preventDefault(); return; }
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

  function walkTo(x, z) {
    if (!def) return;
    me.target = U.clamp(x, 12, def.w - 12);
    me.tz = band() ? U.clamp(z === undefined ? me.z : z, 0, 1) : null;
    me.act = null;
    setMark(me.target, me.tz === null ? me.z : me.tz);
  }

  /* walk over there and then do the thing */
  function goUse(o) {
    const stand = o.x + (o.standOff === undefined ? (me.x > o.x ? 16 : -16) : o.standOff);
    me.target = U.clamp(stand, 12, def.w - 12);
    /* stand a little in front of whatever it is rather than inside it */
    const oz = o.z === undefined ? (band() ? 0.2 : 0) : o.z;
    me.tz = band() ? U.clamp(oz - 0.1, 0, 1) : null;
    me.act = o;
    setMark(o.x, oz);
    if (dist2(me.x, me.z, me.target, me.tz === null ? me.z : me.tz) < 7) {
      me.target = null; me.tz = null; use(o);
    }
  }

  async function use(o) {
    if (busy || !o || !o.onUse) return;
    busy = true;
    me.face = o.x >= me.x ? 1 : -1;
    /* HE REACHES FOR IT. Two pixels toward the thing and a little squash,
       held for a beat, so using something looks like doing something
       rather than like a menu opening. */
    me.reach = 0.42;
    me.reachTo = Math.sign(o.x - me.x) || me.face;
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
      const zDone = me.tz === null || me.tz === undefined || Math.abs(me.tz - me.z) * band() < 2;
      if (Math.abs(d) < 1.4 && Math.abs(me.v) < 8 && zDone) {
        me.x = me.target; me.target = null; me.v = 0;
        if (me.tz !== null && me.tz !== undefined) { me.z = me.tz; me.tz = null; }
        land(0.7);
        if (me.act) { const a = me.act; me.act = null; use(a); }
      }
    }
    /* THE SECOND AXIS. Up and down the road with W/S or the arrows, and
       toward whatever the last click was, at a rate that keeps a diagonal
       walk looking like one walk rather than two. */
    let kz = 0;
    if (keys['w'] || keys['arrowup']) kz -= 1;
    if (keys['s'] || keys['arrowdown']) kz += 1;
    if (kz) { me.tz = null; me.act = null; }
    const b = band();
    if (b) {
      let wz = 0;
      if (kz) wz = -kz;                                  // up the screen is away
      else if (me.tz !== null && me.tz !== undefined) {
        const dz = me.tz - me.z;
        wz = Math.abs(dz) * b > 1.6 ? Math.sign(dz) : 0;
        if (!wz) { me.z = me.tz; me.tz = null; }
      }
      const tv = wz * (SPEED * 0.62) / b;                 // z is 0..1, not pixels
      me.vz += U.clamp(tv - me.vz, -(ACCEL / b) * dt, (ACCEL / b) * dt);
      if (!wz && Math.abs(me.vz) < 0.02) me.vz = 0;
      me.z = U.clamp(me.z + me.vz * dt, 0, 1);
      me.faceZ = Math.abs(me.vz) * b > 8 ? Math.sign(me.vz) : 0;
    } else { me.vz = 0; me.faceZ = 0; }

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
    if (me.reach > 0) me.reach = Math.max(0, me.reach - dt * 1.6);
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p2 = puffs[i];
      p2.t += dt; p2.x += p2.vx * dt; p2.y += p2.vy * dt; p2.vy += 26 * dt;
      if (p2.t > p2.life) puffs.splice(i, 1);
    }
    /* the walk cycle runs off ground covered, not off the clock, so the feet
       never skate: slow steps at the start of a stride, quick in the middle */
    const NF = SPR.WALK_FRAMES || 8;
    if (band() && Math.abs(me.vz) * band() > 6) moving = true;
    if (moving) {
      const was = Math.floor(me.walk);
      const ground = Math.hypot(Math.abs(me.v), Math.abs(me.vz) * band());
      me.walk = (me.walk + ground * dt * 0.135 * (NF / 4)) % NF;
      /* a footfall lands on the two frames where a leg is planted */
      const now2 = Math.floor(me.walk);
      if (now2 !== was && now2 % (NF / 2) === 0) {
        SFX.tone(88 + Math.random() * 30, 0.03, 'square', 0.038);
        kickDust(0.4);
      }
    } else {
      /* WINDING DOWN, NOT SNAPPING. Coming to a stop he finishes the step he
         is in rather than jumping back to the standing frame. */
      const to = me.walk > NF / 2 ? NF : 0;
      me.walk = U.approach(me.walk, to, 9, dt);
      if (me.walk >= NF - 0.02) me.walk = 0;
    }
    me.frame = Math.floor(me.walk) % NF;

    /* what is within arm's reach, measured across the ground */
    let best = null, bd = 26;
    for (const o of targets()) {
      const d = dist2(o.x, o.z === undefined ? me.z : o.z, me.x, me.z);
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
    stepPets(dt);
    stepCrowd(dt);
    stepTraffic(dt);
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
      if (d.outdoor) {
        /* OUTDOORS THE FOREGROUND IS A TREE, NOT A PIPE.

           This layer used to lay a fat black pipe across the very top of
           every room, which is exactly right for a cellar and exactly
           wrong for the Champ de Mars at noon: it read as a black bar
           nailed over the sky. Out here you get what actually hangs into
           frame in Paris — the underside of a plane tree, in and out at
           the corners, and pollen on the lens instead of grime. */
        const leaf = (typeof DAY !== 'undefined') ? DAY.band().leaf : '#4e7c4a';
        const dark = (typeof DAY !== 'undefined')
          ? DAY.rgb(DAY.mix(leaf, '#101a12', 0.45)) : '#2c4630';
        for (let x = 0; x < w; x += 210) {
          const span = 60 + Math.floor(rng() * 50);
          /* the bough, stepping down out of the corner */
          for (let i = 0; i < span; i += 3) {
            const dy = Math.round(Math.pow(i / span, 2.1) * 16);
            ART.px(c, x + i, dy, 3, 3, dark);
          }
          /* and the canopy hanging off it */
          for (let i = 0; i < 34; i++) {
            const lx = x + Math.floor(rng() * span);
            const ly = Math.round(Math.pow((lx - x) / span, 2.1) * 16) + 2
              + Math.floor(rng() * 9);
            const lw = 3 + Math.floor(rng() * 4);
            ART.px(c, lx, ly, lw, 3, rng() < 0.4 ? dark : leaf);
            if (rng() < 0.3) ART.px(c, lx + 1, ly, lw - 1, 1, '#ffffff22');
          }
        }
        /* pollen and dust, catching the light at the edges of the lens */
        for (let i = 0; i < 70; i++) {
          const gx = Math.floor(rng() * w), gy = Math.floor(rng() * (H + 30));
          const edge = Math.min(gx % vw, vw - (gx % vw));
          if (edge > vw * 0.2) continue;
          ART.px(c, gx, gy, 1, 1, 'rgba(255,248,220,.30)');
        }
        return o.cv;
      }
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
  const pets = [];
  let ratClock = 2 + Math.random() * 4;

  /* ============================================================
     THE CROWD.

     Paris is not empty at eleven at night. A room can ask for a
     crowd and get one: walkers spread across the far half of the
     depth band, drawn as silhouettes with a hat, a coat, two legs
     and — when it is raining, which it usually is — an umbrella.
     They are not people you can talk to. They are the reason the
     boulevard looks like a boulevard.
     ============================================================ */
  const crowd = [];

  /* WHAT PARIS WEARS IN THE AFTERNOON.

     These were six shades of near-black, which is what a crowd looks
     like at eleven at night and nothing like what it looks like at
     noon: on a bright pavement a black coat is a hole. So: navy, wine,
     camel, dove, olive, plum, cream, mustard, and every one of them
     gets a lit edge on the sunward side. */
  const COATS = [
    '#3a4a6e', '#7a3244', '#b08a52', '#8e94a0', '#5a6b42', '#6a4a72',
    '#d8cbb0', '#c08a30', '#4a5f7a', '#9c4f3a', '#5f7f78', '#a8a08c',
  ];
  const HATS = ['#2a2438', '#4a3a2a', '#6a6252', '#8a3244', '#3a4a5a', '#d8cbb0'];
  /* what a frog's head is, in the sun */
  const SKINS = ['#5e9a56', '#4f8a4a', '#6fa85e', '#3f7a44', '#7fb268', '#8a9a52'];
  /* what somebody in this city is carrying */
  const CARRY = [null, null, null, 'bread', 'bread', 'case', 'net', 'folio', 'dog'];

  function spawnCrowd() {
    crowd.length = 0;
    const cf = def.crowd;
    if (!cf || !band()) return;
    const n = cf.n || 10;
    const rng = U.mulberry32(U.hashSeed('crowd:' + def.id));
    for (let i = 0; i < n; i++) {
      const coat = COATS[Math.floor(rng() * COATS.length)];
      crowd.push({
        x: rng() * def.w,
        z: (cf.z0 === undefined ? 0.4 : cf.z0) +
           rng() * ((cf.z1 === undefined ? 1 : cf.z1) - (cf.z0 === undefined ? 0.4 : cf.z0)),
        dir: rng() < 0.5 ? -1 : 1,
        v: 9 + rng() * 13,
        coat,
        hat: rng() < 0.72 ? HATS[Math.floor(rng() * HATS.length)] : null,
        skin: SKINS[Math.floor(rng() * SKINS.length)],
        carry: CARRY[Math.floor(rng() * CARRY.length)],
        brolly: rng() < 0.55,
        /* a parasol is a bright thing and an umbrella is a dark one, and
           which you are holding depends on the weather, so carry both */
        brollyCol: ['#2b2436', '#3a2a2a', '#20303a', '#2a2a1f'][Math.floor(rng() * 4)],
        parasolCol: ['#f0e2d0', '#e8b0b8', '#d8d0e8', '#f4d89a'][Math.floor(rng() * 4)],
        t: rng() * 9,
        tall: rng() < 0.3 ? 1 : 0,
        /* one in six stops for a moment, which is what makes a crowd a
           crowd rather than a conveyor belt */
        dwell: rng() < 0.17 ? 1 : 0,
      });
    }
  }

  /* ============================================================
     THE TRAFFIC.

     Twelve avenues meet at the Arch and none of them stop. Cars
     as silhouettes with two lights, crossing the far half of the
     band, because a roundabout with nothing going round it is a
     car park.
     ============================================================ */
  const cars = [];

  function spawnTraffic() {
    cars.length = 0;
    const tf = def.traffic;
    if (!tf || !band()) return;
    const rng = U.mulberry32(U.hashSeed('cars:' + def.id));
    for (let i = 0; i < (tf.n || 4); i++) {
      cars.push({
        x: rng() * def.w,
        z: (tf.z0 || 0.6) + rng() * ((tf.z1 || 0.95) - (tf.z0 || 0.6)),
        dir: rng() < 0.5 ? -1 : 1,
        v: 44 + rng() * 40,
        /* A 1937 CAR IS BLACK, and four blacks on a sunlit avenue is four
           holes in it. These are the colours they actually came in: black,
           yes, but also maroon, bottle green, cream and municipal blue. */
        col: ['#22242c', '#6a2a30', '#2a4a34', '#d8cbb0', '#2f4a70', '#8a7a52',
              '#5a2a2a', '#3a4a5a'][Math.floor(rng() * 8)],
        roof: rng() < 0.4,
        len: 34 + Math.floor(rng() * 16),
      });
    }
  }

  function stepTraffic(dt) {
    for (const a of cars) {
      a.x += a.dir * a.v * dt;
      if (a.x < -70) a.x = def.w + 60;
      if (a.x > def.w + 70) a.x = -60;
    }
  }

  function drawTraffic(c) {
    for (const a of cars) {
      const sc = scaleAt(a.z), fy = floorAt(a.z);
      const L = Math.max(10, Math.round(a.len * sc));
      const h = Math.max(4, Math.round(13 * sc));
      const x = Math.round(a.x), y = fy - h;
      ART.px(c, x, fy - 1, L, 2, 'rgba(52,44,32,.32)');
      ART.px(c, x, y, L, h, a.col);
      ART.px(c, x, y, L, 1, 'rgba(255,255,255,.26)');       // the sun along the wing
      ART.px(c, x, y + h - 2, L, 2, 'rgba(30,24,18,.28)');
      /* the running board and the wheels */
      ART.px(c, x + 2, fy - 3, L - 4, 1, 'rgba(30,24,18,.40)');
      [Math.round(L * 0.18), Math.round(L * 0.78)].forEach(wx => {
        ART.px(c, x + wx - 2, fy - 4, 5, 4, '#22242c');
        ART.px(c, x + wx - 1, fy - 3, 3, 2, '#8a8272');
      });
      /* the cabin, with the sky in the glass */
      ART.px(c, x + Math.round(L * 0.24), y - Math.round(h * 0.5), Math.round(L * 0.5),
        Math.round(h * 0.6), a.col);
      ART.px(c, x + Math.round(L * 0.24), y - Math.round(h * 0.5), Math.round(L * 0.5), 1,
        'rgba(255,255,255,.30)');
      ART.px(c, x + Math.round(L * 0.28), y - Math.round(h * 0.4), Math.round(L * 0.42),
        Math.max(2, Math.round(h * 0.35)), 'rgba(160,205,230,.55)');
      ART.px(c, x + Math.round(L * 0.28), y - Math.round(h * 0.4), Math.round(L * 0.42), 1,
        'rgba(230,245,255,.75)');
      /* THE LIGHTS, and only if anybody would have them on. A headlamp
         burning at noon is the single clearest way to say "this art was
         drawn for a night that no longer exists". */
      const lit = typeof DAY === 'undefined' || DAY.lamps()
        || (typeof CITY !== 'undefined' && CITY.sky().drops > 1);
      const fx = a.dir > 0 ? x + L - 2 : x;
      ART.px(c, fx, y + Math.round(h * 0.3), 2, 2, lit ? '#ffe7a8' : '#cdd6dc');
      ART.px(c, a.dir > 0 ? x : x + L - 2, y + Math.round(h * 0.3), 2, 2, '#d13b45');
      if (lit) {
        ART.px(c, fx + (a.dir > 0 ? 2 : -8), y + Math.round(h * 0.3), 8, 1,
          'rgba(255,231,168,.16)');
      }
    }
  }

  function stepCrowd(dt) {
    for (const w of crowd) {
      w.t += dt;
      w.x += w.dir * w.v * dt;
      if (w.x < -14) { w.x = def.w + 12; }
      if (w.x > def.w + 14) { w.x = -12; }
    }
  }

  function drawCrowd(c, T) {
    if (!crowd.length) return;
    const wet = typeof CITY !== 'undefined' && CITY.sky && CITY.sky().drops > 0.5;
    const hot = typeof DAY !== 'undefined' && !wet && !DAY.lamps();
    for (const w of crowd) {
      const sc = scaleAt(w.z);
      const fy = floorAt(w.z);
      const h = Math.round(26 * sc) + w.tall;
      const bw = Math.max(4, Math.round(9 * sc));
      const x = Math.round(w.x), y = fy - h;
      /* somebody who has stopped for a moment stops walking, too */
      const moving = !(w.dwell && Math.sin(w.t * 0.31) > 0.72);
      const step = moving && Math.sin(w.t * 9) > 0 ? 1 : 0;
      /* THE SHADOW HE STANDS IN. On a sunlit pavement it goes to the
         side the sun is not, which is what tells you there is a sun. */
      ART.px(c, x - bw, fy, bw * 2, 1, 'rgba(52,44,32,.30)');
      ART.px(c, x + 1, fy, bw * 2, 1, 'rgba(52,44,32,.16)');
      /* legs */
      ART.px(c, x - bw + 1, y + h - 7, 2, 7 - step, '#2c2836');
      ART.px(c, x + bw - 3, y + h - 7, 2, 6 + step, '#2c2836');
      /* THE COAT, with the sun down one side of it and the shade on the
         other: without that a coat at this size is a coloured brick */
      ART.px(c, x - bw, y + 6, bw * 2, h - 12, w.coat);
      ART.px(c, x - bw, y + 6, bw * 2, 1, 'rgba(255,255,255,.24)');
      ART.px(c, x - bw, y + 6, 1, h - 12, 'rgba(255,255,255,.18)');
      ART.px(c, x + bw - 2, y + 6, 2, h - 12, 'rgba(40,32,24,.30)');
      /* the head, and a hat only if this one is wearing one */
      ART.px(c, x - 2, y + 2, 5, 5, w.skin);
      ART.px(c, x - 2, y + 2, 5, 1, 'rgba(255,255,255,.22)');
      if (w.hat) {
        ART.px(c, x - 3, y, 7, 2, w.hat);
        ART.px(c, x - 2, y - 2, 5, 2, w.hat);
        ART.px(c, x - 3, y, 7, 1, 'rgba(255,255,255,.18)');
      }
      /* WHAT THEY ARE CARRYING. Half of Paris is carrying a baguette at
         any given moment and it is the cheapest way to say where you are. */
      const cx2 = x + (w.dir > 0 ? bw - 1 : -bw - 1);
      if (w.carry === 'bread') {
        ART.px(c, cx2 - 1, y + 4, 3, 9, '#d9a45c');
        ART.px(c, cx2 - 1, y + 4, 3, 2, '#f0c98a');
        ART.px(c, cx2, y + 6, 1, 5, '#b8823c');
      } else if (w.carry === 'case') {
        ART.px(c, cx2 - 2, y + 13, 5, 5, '#5d4728');
        ART.px(c, cx2 - 2, y + 13, 5, 1, '#8a6a44');
      } else if (w.carry === 'net') {
        ART.px(c, cx2 - 2, y + 13, 5, 5, '#7a8a52');
        ART.px(c, cx2 - 1, y + 14, 2, 2, '#c8384a');
      } else if (w.carry === 'folio') {
        ART.px(c, cx2 - 3, y + 8, 6, 8, '#d8cbb0');
        ART.px(c, cx2 - 3, y + 8, 6, 1, '#ffffff');
      }
      /* AND WHAT IS OVER THEIR HEAD. An umbrella when it rains, a
         parasol when it does not and the sun is high — sized to the frog
         under it, because drawn at a fixed width the crowd came out as a
         bed of mushrooms. */
      const shade = wet ? w.brollyCol : (hot && w.brolly ? w.parasolCol : null);
      if (shade && (wet || w.brolly)) {
        const uw = Math.max(4, Math.round(bw * 1.25));
        const uy = y - 4;
        ART.px(c, x - uw, uy + 2, uw * 2, 1, shade);
        ART.px(c, x - uw + 1, uy, uw * 2 - 2, 2, shade);
        ART.px(c, x - uw + 1, uy, uw * 2 - 2, 1, 'rgba(255,255,255,.30)');
        ART.px(c, x - 1, uy - 1, 3, 1, shade);
        ART.px(c, x, uy + 3, 1, 5, '#4a3f2e');
      }
    }
  }

  /* ============================================================
     THE ANIMALS THAT ARE NOT VERMIN.

     A cat lives at four of the five stops and a dog lives at the
     station. They wander a few feet, sit down, wash, and look at
     you — and if you stand next to one and put a hand out it will
     come over, which is the only thing in this game that is purely
     nice. Drawn here rather than in the room art because a painted
     cat is furniture and this one moves.
     ============================================================ */
  /* WHAT THE DOG LEAVES. Every dog in this city fouls the pavement and
     nobody picks it up, so there is a thing on the ground with a hotspot
     on it and a scoop on the back of the cart. */
  const messes = [];

  function dropMess(a) {
    if (messes.filter(m => !m.done).length > 1) return;
    messes.push({ x: a.x, z: a.z === undefined ? 0.1 : a.z, t: 0, done: false });
  }

  function spawnPets() {
    pets.length = 0;
    messes.length = 0;
    for (const p of (def.pets || [])) {
      pets.push({
        kind: p.kind || 'cat', name: p.name || (p.kind === 'dog' ? 'A DOG' : 'A CAT'),
        home: p.x, x: p.x,
        z: p.z === undefined ? (band() ? 0.1 : 0) : p.z,
        y: p.y,
        dir: 1, v: 0, mood: 'sit', wait: 1 + Math.random() * 3,
        t: Math.random() * 9, pet: 0, hearts: [],
        fouls: !!p.fouls, foulClock: 6 + Math.random() * 14,
      });
    }
  }

  function stepPets(dt) {
    for (const a of pets) {
      a.t += dt;
      if (a.fouls) {
        a.foulClock -= dt;
        if (a.foulClock <= 0) { dropMess(a); a.foulClock = 30 + Math.random() * 40; }
      }
      if (a.pet > 0) { a.pet -= dt; a.v = 0; }
      else if (a.wait > 0) { a.wait -= dt; a.v = 0; }
      else if (a.mood === 'sit') {
        a.mood = 'walk';
        a.dir = Math.random() < 0.5 ? -1 : 1;
        a.v = (a.kind === 'dog' ? 20 : 14) + Math.random() * 10;
      } else {
        a.x += a.dir * a.v * dt;
        if (a.x < a.home - 46 || a.x > a.home + 46 || Math.random() < dt * 0.5) {
          a.mood = 'sit'; a.v = 0; a.wait = 1.5 + Math.random() * 4;
          if (a.x < a.home - 46) a.dir = 1;
          if (a.x > a.home + 46) a.dir = -1;
        }
      }
      for (let i = a.hearts.length - 1; i >= 0; i--) {
        const h = a.hearts[i];
        h.t += dt; h.y -= dt * 14;
        if (h.t > 1.4) a.hearts.splice(i, 1);
      }
    }
  }

  function drawPets(c, T) {
    /* what the dog left, before anybody steps in it */
    for (const m of messes) {
      if (m.done) continue;
      const x = Math.round(m.x), y = floorAt(m.z);
      const sc = scaleAt(m.z);
      const r = Math.max(2, Math.round(4 * sc));
      ART.px(c, x - r - 2, y - 1, r * 2 + 5, 2, 'rgba(0,0,0,.3)');
      PIX.disc(c, x, y - r, r + 1, '#241708');
      PIX.disc(c, x, y - r, r, '#4a3118');
      PIX.disc(c, x - 1, y - r - 1, Math.max(1, r - 2), '#63431f');
      PIX.disc(c, x + 2, y - r - 3, Math.max(1, r - 3), '#4a3118');
      /* two flies, doing their job */
      const a2 = T * 3 + m.x;
      ART.px(c, x + Math.round(Math.cos(a2) * 6), y - r - 7 + Math.round(Math.sin(a2 * 1.4) * 3),
        1, 1, '#12101d');
      ART.px(c, x + Math.round(Math.cos(a2 + 2) * 5), y - r - 5 + Math.round(Math.sin(a2) * 3),
        1, 1, '#12101d');
    }
    for (const a of pets) drawPet(c, a, T);
  }

  function drawPet(c, a, T) {
    {
      const x = Math.round(a.x);
      const y = Math.round(a.y === undefined ? floorAt(a.z) : a.y);
      const f = a.dir > 0 ? 1 : -1;
      const walking = a.v > 1;
      const step = walking && Math.sin(a.t * 12) > 0 ? 1 : 0;
      const purr = a.pet > 0;
      const R = (dx, dy, w, h, col) =>
        ART.px(c, f > 0 ? x + dx : x - dx - w, y + dy, w, h, col);

      if (a.kind === 'dog') {
        /* a big soft precinct dog: tan, one dark ear, always pleased */
        const fur = '#b07a45', dk = '#6e4a30', lt = '#d0a06a', nose = '#2b2436';
        R(-11, -2, 23, 2, 'rgba(0,0,0,.34)');
        R(-9, -12, 18, 10, dk);
        R(-8, -11, 16, 8, fur);
        R(-8, -11, 16, 2, lt);
        /* the head */
        R(6, -17, 10, 9, dk);
        R(7, -16, 8, 7, fur);
        R(7, -16, 8, 2, lt);
        R(13, -13, 3, 3, dk);            // muzzle
        R(15, -12, 1, 1, nose);
        R(11, -14, 2, 2, '#f4efe0');     // eye
        R(11, -14, 1, 1, nose);
        R(5, -20, 4, 5, dk);             // the flopped ear
        /* the legs, and the tail that never stops */
        R(-6, -3, 3, 4 - step, dk);
        R(0, -3, 3, 3 + step, dk);
        R(5, -3, 3, 4 - step, dk);
        const wag = Math.round(Math.sin(a.t * (purr ? 18 : 7)) * 3);
        for (let i = 0; i < 5; i++) R(-9 - i, -11 - i + wag * (i / 5), 2, 2, fur);
        if (purr) { R(9, -22, 2, 2, '#ffd75e'); R(3, -23, 2, 2, '#ffd75e'); }
      } else {
        /* the cat: black, thin, and unimpressed */
        const fur = '#2b2739', dk = '#181624', lt = '#413b52', eye = '#8ff7c8';
        R(-8, -1, 17, 1, 'rgba(0,0,0,.3)');
        const sit = !walking && !purr;
        if (sit) {
          /* sitting: a loaf with ears */
          R(-6, -11, 13, 10, dk);
          R(-5, -10, 11, 8, fur);
          R(-5, -10, 11, 2, lt);
          R(3, -16, 7, 7, dk);
          R(4, -15, 5, 5, fur);
          R(4, -18, 2, 3, dk); R(7, -18, 2, 3, dk);     // ears
          R(5, -13, 1, 1, eye); R(8, -13, 1, 1, eye);
          const curl = Math.round(Math.sin(a.t * 1.6) * 2);
          for (let i = 0; i < 6; i++) R(-7 - i, -3 - (i > 3 ? curl : 0), 2, 2, fur);
        } else {
          R(-7, -8, 15, 6, dk);
          R(-6, -7, 13, 4, fur);
          R(-6, -7, 13, 1, lt);
          R(5, -13, 7, 7, dk);
          R(6, -12, 5, 5, fur);
          R(6, -15, 2, 3, dk); R(9, -15, 2, 3, dk);
          R(7, -10, 1, 1, eye); R(10, -10, 1, 1, eye);
          R(-5, -2, 2, 2 - step, dk);
          R(0, -2, 2, 1 + step, dk);
          R(4, -2, 2, 2 - step, dk);
          const up = purr ? -6 : 0;
          for (let i = 0; i < 7; i++) {
            R(-8 - i, -7 + up + Math.round(Math.sin(a.t * 3 + i * 0.5) * 2), 2, 2, fur);
          }
        }
      }
      /* what it thinks of you */
      for (const h of a.hearts) {
        const al = (1 - h.t / 1.4).toFixed(2);
        ART.px(c, Math.round(a.x + h.x), Math.round(h.y), 2, 2, 'rgba(255,126,219,' + al + ')');
        ART.px(c, Math.round(a.x + h.x - 2), Math.round(h.y), 2, 1, 'rgba(255,126,219,' + al + ')');
        ART.px(c, Math.round(a.x + h.x + 2), Math.round(h.y), 2, 1, 'rgba(255,126,219,' + al + ')');
      }
    }
  }


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
      if (r.dead) { r.deadT = (r.deadT || 0) + dt; continue; }
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
      /* SHOT. He is on his back with his feet up and he fades out of the
         room in his own time. Nobody comes to collect him. */
      if (r.dead) {
        const a = Math.max(0, 1 - (r.deadT || 0) / 2.6);
        c.globalAlpha = a;
        ART.px(c, x - 6, y - 2, 13 + k, 3, '#4a4250');
        ART.px(c, x - 6, y - 2, 13 + k, 1, '#6b6076');
        ART.px(c, x - 3, y - 5, 2, 3, '#3a3444');
        ART.px(c, x + 2, y - 5, 2, 3, '#3a3444');
        ART.px(c, r.dir > 0 ? x + 7 : x - 8, y - 2, 2, 2, '#b3576b');
        for (let i = 0; i < 4; i++) {
          ART.px(c, x - 8 - i * 2, y + 1, 2, 1, 'rgba(140,34,48,' + (0.4 * a).toFixed(2) + ')');
        }
        c.globalAlpha = 1;
        continue;
      }
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

  function setMark(x, z) { mark = { x, z: z === undefined ? 0 : z, t: 0 }; }

  function drawMark(c, T) {
    if (!mark) return;
    if (me.target === null) { mark.t += 0.06; if (mark.t > 1) { mark = null; return; } }
    else mark.t = 0;
    const a = 1 - mark.t;
    const x = Math.round(mark.x), y = floorAt(mark.z);
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

  /* a stable number per room, so the clouds and the birds in a place are
     always the same clouds and birds and never re-roll on a redraw */
  function seedOf(d) {
    let n = 0;
    const id = (d && d.id) || '';
    for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) % 9973;
    return n;
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
    /* ============================================================
       WHAT IS OVER YOUR HEAD.

       Indoors that is a ceiling: joists, lamp cords, and the dark
       these places keep up there. Outdoors it is the sky, and the
       sky is the loudest clock in this game — so an outdoor room
       hands its whole headroom, plus whatever open band it declares
       with `skyTo`, straight to DAY.

       Drawn BEFORE the camera translate, because the sky is at
       infinity and must not scroll with the room. The room canvas
       leaves that band transparent, so this shows through it.
       ============================================================ */
    if (def.outdoor && typeof DAY !== 'undefined') {
      const sh = oy + (def.skyTo === undefined ? 0 : def.skyTo);
      if (sh > 0) DAY.sky(c, 0, 0, vw2, sh, T, seedOf(def));
    } else if (oy > 0) {
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
    /* THE VAULT, over the room, going by at less than half the rate.
       Indoors only: outdoors that headroom is sky. */
    if (oy > 2 && !def.outdoor) {
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
      /* A HOLE IN A WALL IS ONLY A VAULT IF THERE IS A WALL.

         The quay declared its entire sky band as a depth hole and got the
         brick vault painted into it, which under the new daylight meant a
         black brick ceiling nailed over the Seine. Outdoors there is no
         wall to have a hole in, so there is nothing to do here; and a
         window that says `sky: true` gets the actual sky behind it, which
         is what a window is for. */
      if (def.outdoor) continue;
      if (dp.sky && typeof DAY !== 'undefined') {
        c.save();
        c.beginPath();
        c.rect(dp.x, dp.y, dp.w, dp.h);
        c.clip();
        /* screen space, undoing the camera, because the sky does not scroll */
        /* THE SKY BEHIND A WINDOW IS THE WHOLE SKY, not a sky cropped to
           the window. Sized to the opening it showed the top of the ramp
           and nothing else, and read as a rectangle of flat blue paint;
           sized to the room it shows whatever slice of cloud and ramp
           happens to be at that height, which is what a window does. */
        DAY.sky(c, Math.round(cam), -oy, viewW(), oy + def.floorY, T, seedOf(def));
        /* the reveal of the opening, and the dirt in the corners of it */
        ART.px(c, dp.x, dp.y, dp.w, 1, 'rgba(0,0,0,.30)');
        ART.px(c, dp.x, dp.y, 1, dp.h, 'rgba(0,0,0,.22)');
        ART.px(c, dp.x + dp.w - 1, dp.y, 1, dp.h, 'rgba(0,0,0,.22)');
        c.restore();
        continue;
      }
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

    /* WHAT THE WINDOWS THROW. Drawn after the room and its furniture and
       before the cast, so a frog standing in the light is standing in it
       rather than under it. */
    if (!def.outdoor && typeof DAY !== 'undefined') {
      for (const dp of (def.depth || [])) {
        if (dp.sky) DAY.shaft(c, dp, def.floorY, T, seedOf(def));
      }
    }

    /* the traffic, then the crowd: both behind everybody who matters */
    drawTraffic(c);
    drawCrowd(c, T);

    /* everybody in it, back to front by x-depth then y */
    const cast = [];
    for (const a of (def.actors || [])) {
      if (a.gone) continue;
      cast.push({ y: a.y === undefined ? floorAt(a.z) : a.y, draw: () => drawActor(c, a, T) });
    }
    cast.push({ y: floorAt(me.z) + 0.5, draw: () => drawMe(c, T) });
    drawMark(c, T);
    drawCritters(c, T);
    cast.sort((p, q) => p.y - q.y).forEach(o => o.draw());

    /* ============================================================
       WHERE THE JOB IS.

       The objective says what to do; this says WHERE. A gold chevron
       bobbing over the frog or the prop the current objective wants,
       so nobody has to read a plate and then guess which of eleven
       things in the room it meant.
       ============================================================ */
    if (typeof STORY !== 'undefined' && STORY.objective && !busy) {
      const want = STORY.wantHere ? STORY.wantHere(def) : null;
      if (want) {
        /* well clear of the label plate that lands on whatever you are
           standing next to: an actor gets it over his hat, a prop over
           the top of the thing itself.

           A SPOT CAN BE A WALL, though. The bone wall in the catacombs
           is sixty rows tall and its top is the lintel, so hanging the
           chevron over the top of it put it through the lettering and
           off the ceiling. Hang it over the top of the thing, or forty
           rows over the foot of it, whichever sits lower — and never
           off the top of the room. */
        const wTop = want.top === undefined ? def.floorY - 40
          : (want.bot === undefined ? want.top : Math.max(want.top, want.bot - 40));
        const wy = Math.max(11, wTop - 22);
        const bob = Math.round(Math.sin(T * 3.4) * 2);
        const gx = Math.round(want.x);
        for (let i = 0; i < 7; i++) {
          ART.px(c, gx - 6 + i, wy + bob + i, 2, 2, i === 3 ? '#fff3c4' : '#ffd75e');
          ART.px(c, gx + 6 - i, wy + bob + i, 2, 2, i === 3 ? '#fff3c4' : '#ffd75e');
        }
        ART.px(c, gx - 7, wy + bob - 2, 15, 2, 'rgba(0,0,0,.45)');
        ART.px(c, gx - 1, wy + bob - 9, 2, 6, '#ffd75e');
      }
    }

    /* WHAT THE MOUSE IS ON. Corner brackets in the tool's own colour, so a
       pointer over a room always says what is about to happen and to what. */
    {
      const t = typeof TOOLS === 'undefined' ? null : TOOLS.of();
      const tgt = hoverRat
        ? { x: hoverRat.x, w: 20, top: hoverRat.y - 12, bot: hoverRat.y + 2 }
        : hover;
      if (tgt && !busy && t) {
        const bw = Math.max(18, (tgt.w || 26) + 8);
        const y0 = (tgt.top === undefined ? def.floorY - 46 : tgt.top) - 4;
        const y1 = (tgt.bot === undefined ? def.floorY + 4 : tgt.bot) + 2;
        const x0 = Math.round(tgt.x - bw / 2), x1 = Math.round(tgt.x + bw / 2);
        const L = 5, col = t.tint;
        const pulse = 0.55 + 0.45 * Math.abs(Math.sin(T * 3));
        c.globalAlpha = pulse;
        [[x0, y0, 1, 1], [x1 - L, y0, -1, 1], [x0, y1 - 1, 1, -1], [x1 - L, y1 - 1, -1, -1]]
          .forEach(([bx, by, sx, sy]) => {
            ART.px(c, sx > 0 ? bx : bx + L - 1, by, L, 1, col);
            ART.px(c, sx > 0 ? bx : bx + L - 1, sy > 0 ? by : by, 1, L * sy, col);
          });
        c.globalAlpha = 1;
      }
    }

    /* furniture that people stand behind */
    if (def.onPaintFront) def.onPaintFront(c, T);
    /* THE ANIMALS GO IN FRONT OF IT. A cat is twenty pixels tall and every
       room has a counter across the front of it: behind the furniture, in
       depth order, the dog was simply invisible. */
    drawPets(c, T);
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
       THE HOUR ITSELF.

       Every room belongs to the same day: the light grades it, and
       if you are outdoors the weather falls through it. Without this
       the city is eleven unrelated rooms with a clock in the corner.
       ============================================================ */
    if (typeof CITY !== 'undefined' && G.phase !== 'title') {
      const w = viewW();
      const sky = CITY.sky();
      if (typeof DAY !== 'undefined') DAY.wash(c, cam, -oy, w, H + oy, !def.outdoor);
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

    /* THE EDGES OF THE FRAME, so a room has corners. Indoors that is the
       dark in the corners of a cellar; outdoors a black vignette on a blue
       sky reads as a bruise, so out there it is half the strength and the
       sky end of it goes warm instead of black. */
    const vw = viewW();
    const out = !!def.outdoor;
    for (let i = 0; i < 16; i++) {
      const a = (out ? 0.20 : 0.42) * (1 - i / 16);
      const col = out ? 'rgba(60,44,30,' : 'rgba(0,0,0,';
      ART.px(c, cam, H - 1 - i, vw, 1, col + (a * 0.5) + ')');
      ART.px(c, cam + i, -oy, 1, H + oy, col + (a * 0.7) + ')');
      ART.px(c, cam + vw - 1 - i, -oy, 1, H + oy, col + (a * 0.7) + ')');
    }
    c.restore();

    /* the diegetic label: what the thing under your hand is called */
    const show = hover && Math.abs(hover.x - me.x) < 300 ? hover : near;
    if (show && !busy) plate(show);
    else { const pl = document.getElementById('scene-plate'); if (pl) pl.style.display = 'none'; }
    if (def.onHud) def.onHud(c, K, viewW(), cam);
  }

  /* ============================================================
     THE IDLE.

     Nobody in this game stands still. The chest goes up and down on
     a slow count and the weight comes off one leg every few seconds,
     and both are done by moving the sprite a pixel rather than by
     drawing another one — so every frog in every room breathes for
     free. Standing on the walk frame and twitching to the next one
     (which is what this used to do) reads as a flinch, not a breath.
     ============================================================ */
  /* ============================================================
     STANDING ABOUT.

     Breathing, a weight shift every nine seconds, and — new — a
     slow sway, a shoulder roll, and the small settle somebody
     does when they have been on their feet a while. Everything is
     seeded off the actor's own position so a room full of frogs
     never moves as one animal.
     ============================================================ */
  function idleOf(T, seed) {
    const t = T * 0.85 + (seed % 17) * 0.7;
    const rise = Math.sin(t) > 0.35 ? 1 : 0;              // the chest, 1px
    const ph = (t * 0.11) % 1;                            // a shift every ~9s
    const sway = ph < 0.1 ? Math.sin((ph / 0.1) * Math.PI) : 0;
    /* the long sway: a pixel out and back over about six seconds, which is
       what standing still actually looks like */
    const drift = Math.sin(t * 0.31 + seed) * 0.9;
    /* and the shoulder roll, once in a while */
    const rl = (t * 0.047 + (seed % 7) / 7) % 1;
    const roll = rl < 0.06 ? Math.sin((rl / 0.06) * Math.PI) : 0;
    return {
      rise: rise + (roll > 0.5 ? 1 : 0),
      lean: Math.round(sway * 1.6 + drift),
      roll,
    };
  }

  /* ============================================================
     HOW HE IS WALKING.

     One walk cycle is a machine. A gait is a mood: a frog the
     city likes has a hop in the middle of his stride, and a frog
     on his last two hearts drags one foot and rides low. Both are
     read off the game state, not off a timer, so the way he
     crosses a room tells you how the day is going before you look
     at anything else.
     ============================================================ */
  function gaitOf(T) {
    const speed = Math.hypot(Math.abs(me.v), Math.abs(me.vz) * (band() || 1));
    if (speed < 8) return { hop: 0, drop: 0, tip: 0 };
    /* where in the stride he is: the walk counter, not the clock */
    const ph = (me.walk % 1);
    const k = (typeof STORY !== 'undefined' && STORY.karma) ? STORY.karma() : null;
    const hurt = (typeof G !== 'undefined' && (G.hearts || 6) <= 2);
    const glad = k && k.band >= 2;
    /* THE HOP: up on the pass of the stride, and only if he is pleased */
    const hop = glad ? Math.max(0, Math.sin(ph * Math.PI * 2)) * 2 : 0;
    /* THE DRAG: down on one foot of the two, and only if he is hurt */
    const drop = hurt ? (ph < 0.5 ? 1 : 0) : 0;
    /* everybody leans a little into where they are going */
    const tip = Math.round(Math.sign(me.v) * Math.min(1, Math.abs(me.v) / 60));
    return { hop: Math.round(hop), drop, tip };
  }

  function drawActor(c, a, T) {
    /* HE LOOKS AT YOU WHEN YOU GET CLOSE. A frog who keeps facing the wall
       while a detective walks up to him is furniture; turning his head is
       one line and it makes the room feel occupied. */
    const close = Math.abs(a.x - me.x) < 44;
    const face = close ? (me.x > a.x ? 1 : -1)
      : (a.face === undefined ? -1 : a.face);
    /* an actor mid-line wears the talking face; the rest of the time he
       wears whatever his mood does when it is left alone */
    const ex = a.expr || (a.talking ? 'talk' : faceOf(a.mood, T, Math.round(a.x)));
    const r = rig(a, a.frame || 0, face, a.back, ex);
    const fy = a.y === undefined ? floorAt(a.z) : a.y;
    const id = a.still ? { rise: 0, lean: 0, roll: 0 } : idleOf(T, Math.round(a.x));
    const sc = scaleAt(a.z);
    /* AND WHAT HE IS DOING WITH HIS HANDS. A witness at a counter is
       working: wiping it down, sorting a rack, turning a page. One bob
       and one lean on their own slow loops is enough to sell it. */
    let work = 0;
    if (a.busyAt) {
      const wp = (T * a.busyAt + (a.x % 11) * 0.3) % 1;
      work = Math.round(Math.sin(wp * Math.PI * 2) * 2);
    }
    const w = Math.max(1, Math.round(r.w * sc));
    const h = Math.max(1, Math.round(r.h * sc) - id.rise);
    ART.px(c, Math.round(a.x - w / 3), fy, Math.round(w * 0.66), 2, 'rgba(52,44,32,.32)');
    c.drawImage(r.cv, Math.round(a.x - w / 2) + id.lean + work,
      Math.round(fy - h + 1 + (work ? Math.abs(work) - 1 : 0)), w, h);
  }

  /* ============================================================
     AND WHAT THE DETECTIVE'S OWN FACE IS DOING.

     Read off the state of the shift, not off a timer: he squints
     when he is working something out, winces when he is nearly
     out of hearts, looks pleased when the city thinks well of
     him, and goes bored when there is nothing left to do here.
     ============================================================ */
  function myFace(T) {
    if (me.reach > 0) return 'squint';                 // hand in something
    if (typeof G === 'undefined') return 'neutral';
    if ((G.hearts || 6) <= 2) return 'wince';
    const k = (typeof STORY !== 'undefined' && STORY.karma) ? STORY.karma() : null;
    const mood = !k ? 'neutral'
      : k.band >= 2 ? 'happy'
      : k.band <= -2 ? 'hard'
      : Math.abs(me.v) > 4 ? 'neutral' : 'watch';
    return faceOf(mood, T, 3);
  }

  function drawMe(c, T) {
    /* WALKING AWAY, YOU SEE HIS BACK. The rig is the same frog; the head
       just has nothing on the front of it. */
    const r = rig(SCENE.meDef(), me.frame, me.face, me.faceZ < 0, myFace(T));
    const fy = floorAt(me.z);
    /* the dust goes down first, so his shoes stand in it */
    for (const p2 of puffs) {
      const a = 0.3 * (1 - p2.t / p2.life);
      ART.px(c, Math.round(p2.x), Math.round(fy - 1 + p2.y), 1, 1, 'rgba(214,206,186,' + a.toFixed(3) + ')');
    }
    /* squash on landing, and a whisker of stretch at speed: both pinned to
       the floor so his feet never leave it */
    const sq = me.land * 0.16;
    const st = Math.min(0.05, Math.abs(me.v) / SPEED * 0.05);
    /* standing about, he breathes too */
    const id = Math.abs(me.v) > 4 ? { rise: 0, lean: 0 } : idleOf(T, 3);
    const sc = scaleAt(me.z);
    /* the reach: a lean toward whatever he is doing, and a little crouch */
    const rc = me.reach > 0 ? Math.sin((1 - me.reach / 0.42) * Math.PI) : 0;
    const lean = Math.round(rc * 3) * (me.reachTo || 1);
    const g = gaitOf(T);
    const w = Math.max(1, Math.round(r.w * sc * (1 + sq - st * 0.5 + rc * 0.04)));
    const h = Math.max(1, Math.round(r.h * sc * (1 - sq + st - rc * 0.05)) - id.rise);
    const shW = Math.round(r.w * (0.66 + sq));
    /* THE SHADOW STAYS ON THE FLOOR while he hops off it, which is the only
       thing that makes a hop read as leaving the ground rather than as the
       whole sprite sliding up the screen. */
    ART.px(c, Math.round(me.x - shW / 2), fy, shW, 2,
      'rgba(52,44,32,' + (0.38 - g.hop * 0.06).toFixed(2) + ')');
    c.drawImage(r.cv, Math.round(me.x - w / 2) + id.lean + lean + g.tip,
      Math.round(fy - h + 1 - g.hop + g.drop), w, h);
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
    /* the tools reach into the room through these */
    magnify, ratAt, refreshCursor,
    rats() { return rats; },
    pets() { return pets; },
    messes() { return messes; },
    debugFoul() { if (pets.length) dropMess(pets[0]); },
    killRat(r) {
      r.dead = true; r.deadT = 0;
      setTimeout(() => { const i = rats.indexOf(r); if (i >= 0) rats.splice(i, 1); }, 2600);
    },
    /* where the mouse last was, in room pixels */
    mouseAt() { return mouse; },
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
