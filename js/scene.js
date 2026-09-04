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
  let backBand = '';             // the hour it was painted at
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
  let fore = null;                 // what is in FRONT of the cast, if anything
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
  function rig(d, frame, face, back, expr, arm) {
    const down = lodFor();
    const cv = SPR.rigLOD((d.key || SPR.defKey(d)) + (back ? ':b' : ''),
      d.def || d, frame, face, down, back, expr, arm);
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
    /* ============================================================
       AND THE ONE THE PLAYER ACTUALLY WEARS.

       He came home off shift six years ago and the door was open.
       He is in a foreign city with a cigarette end in an evidence
       bag and a revolver he had to hand over at the airport. He
       does not beam at people because his karma is good — which is
       what he used to do, and what looked ridiculous.

       Flat, tired, watchful, and hard when it is warranted. There
       is no smile in this rotation at all. The warm face exists,
       it just has to be EARNED by something specific happening,
       it lasts a couple of seconds, and then he goes back to this.
       ============================================================ */
    grim:    ['neutral', 'bored', 'blink', 'neutral', 'squint', 'think'],
    weary:   ['bored', 'neutral', 'blink', 'sad', 'bored'],
    grimmer: ['angry', 'squint', 'blink', 'neutral', 'doubt'],
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

  let forceK = 0;                // the harness pinning a scale for a comparison
  let oy = 0;                    // how far down the room sits in the frame
  let mouse = { x: 0, y: 0, on: false };
  let hoverRat = null;

  /* PAINTABLE ROWS ABOVE ROOM ROW 0. Declared up here rather than beside
     paintBack because the headroom cap below reads it, and a const read
     before its own declaration throws on the way in. */
  const PAD = 150;

  /* HOW MUCH HEADROOM A ROOM GETS.

     Outdoors it is sky and there is no such thing as too much of it, so
     the frame fills — capped only by how far above row 0 the paint
     actually goes. Indoors it is a ceiling, and a ceiling a hundred and
     thirty rows tall is a cathedral, so interiors take a band and let the
     surround do the rest. */
  /* Outdoors, enough sky that the tower has air over it and no more: at
     the full PAD there were seventy-six empty rows above the top platform
     and the street was a strip along the bottom of a mostly blue frame.
     Indoors, a tall ceiling rather than a cathedral. */
  const CEIL_OUT = 62;
  const CEIL_IN = 54;
  function ceilMax() { return (def && def.outdoor) ? CEIL_OUT : CEIL_IN; }

  function scale() {
    const host = document.getElementById('scene-root');
    const w = window.innerWidth;
    const h = host ? host.clientHeight || (window.innerHeight - 66) : window.innerHeight - 66;
    /* ============================================================
       HOW BIG IS A ROOM PIXEL.

       This used to fill the height and then step UP to the nearest
       multiple of three, which on an ordinary desktop landed on
       SIX: every room pixel six screen pixels across, and only two
       hundred and fourteen pixels of a seven-hundred-and-eighty
       pixel room in frame. That is what "low resolution" looks
       like — not blur, just enormous pixels and a camera inside
       somebody's coat.

       So: take the SMALLEST multiple of FOOT that still fills the
       frame properly. Three instead of six means

         - a room pixel is three screen pixels, not six,
         - twice as much of the room is in frame,
         - the full-detail rig lands at 1:1, so every pixel the
           cast is drawn with is a pixel you see, and
         - there is room above the walls for actual sky.

       It has to be a multiple of FOOT either way: any other scale
       makes the rig downscale by three through a smoothing filter,
       and THAT is blur.
       ============================================================ */
    const fits = (k) => {
      if (k < 2) return false;
      /* two hundred room pixels is about six metres of street: enough to
         see who is coming, which is the floor for playability */
      if (w / k < 200) return false;
      /* the floor line has to be on screen or he is standing off the
         bottom of the frame: 122 rows keeps the deepest floor (118) plus
         a strip of foreground under it */
      return Math.floor(h / k) >= 122;
    };
    /* ============================================================
       AND HOW CLOSE THE CAMERA STANDS.

       FOOT is three, so the only scales that keep the rig at full
       detail are three and six — there is nothing clean in
       between, and any other number downscales the rig through a
       filter, which is real blur.

       THREE was the old default and it puts four hundred and
       twenty-seven room pixels in frame: most of a room, and a
       cast eighty screen pixels tall in the middle of it. SIX
       halves what is in frame and doubles the cast, and it used to
       look bad — but that was the milky cast over the frame, which
       has been measured out of existence. With the frame clean,
       six is the better shot for a game about faces.

       So six is the default where it fits, three is what a short
       or narrow window gets, and Z switches between them for
       anybody who would rather see the whole room.
       ============================================================ */
    const wide = (typeof META !== 'undefined' && META.load)
      ? !!META.load().wideShot : false;
    let k = 0;
    if (forceK && fits(forceK)) k = forceK;
    else if (!wide && fits(FOOT * 2)) k = FOOT * 2;
    else for (let m = FOOT; m <= 12; m += FOOT) if (fits(m)) { k = m; break; }
    if (!k) {
      /* nothing FOOT-friendly fits — a short landscape phone. Fall back to
         filling the height and accept the softer rig. */
      k = Math.max(2, Math.floor(h / H));
      while (k > 2 && w / k < 190) k--;
    }
    K = k;
    cv.width = Math.ceil(w / K) * K;
    /* How many world rows the frame can actually hold. More than the room
       is headroom and gets a ceiling; fewer means the bottom strip of
       foreground floor goes over the edge, which nobody misses — cropping
       the TOP would take the lamps, the signs and the arches with it. */
    const rows = Math.max(60, Math.floor(h / K));
    const worldH = Math.min(rows, H + ceilMax());
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
    fore = d.fore ? paintFore(d) : null;
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
    def = null; back = null; fore = null;
  }

  /* ============================================================
     THE ROOM CANVAS HAS SKY ABOVE IT NOW.

     Every room is authored in a coordinate space where row 0 is
     the top of the frame and the landmarks are deliberately drawn
     off it — the Eiffel Tower's first platform is at row minus
     fifty-eight, because the point of the tower is that the frame
     cannot hold it.

     That was true when the frame was 132 rows. At half the pixel
     size the frame holds two hundred and sixty, and the extra rows
     were coming out as empty sky over a tower that stopped in
     mid-air. So the canvas is PAD rows taller than the room and
     the paint is translated down into it: room coordinate 0 is
     still room coordinate 0, negative rows now land on canvas
     instead of being clipped, and everything the builders already
     draw up there simply appears.
     ============================================================ */
  function paintBack(d) {
    const o = ART.cv(d.w, H + PAD);
    o.c.save();
    o.c.translate(0, PAD);
    d.paint(o.c, d.w, H);
    o.c.restore();
    /* AND THE HOUR GOES IN THE PAINT. Not over the frame every frame — in
       the pixels, once, so the room is at full contrast with nothing
       between it and the screen. */
    if (typeof DAY !== 'undefined' && DAY.bake) DAY.bake(o.cv, !d.outdoor);
    backBand = (typeof DAY !== 'undefined') ? DAY.band().id : '';
    return o.cv;
  }

  /* the same treatment for whatever is in FRONT of the cast: same
     coordinate space, same bake, so a counter is lit like the wall it
     stands against */
  function paintFore(d) {
    const o = ART.cv(d.w, H + PAD);
    o.c.save();
    o.c.translate(0, PAD);
    d.fore(o.c, d.w, H);
    o.c.restore();
    if (typeof DAY !== 'undefined' && DAY.bake) DAY.bake(o.cv, !d.outdoor);
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

  /* is the eyeglass in your hand right now */
  const glassOut = () => typeof TOOLS !== 'undefined' && TOOLS.is('glass');

  /* ============================================================
     WHAT IS IN REACH.

     `quiet` is for the walk-past label — the thing the game names
     at you because you happened to stop next to it. An easter egg
     is never that: it is not in this list at all unless the
     eyeglass is out, and it is never in the quiet list, so the
     only way to find the Thai flag on the shelf or the cards
     under the till is to sweep the room with the glass and notice
     the glint. They used to shout their own names at anybody who
     walked past, which is the opposite of a secret.
     ============================================================ */
  function targets(quiet) {
    if (!def) return [];
    const out = [];
    for (const a of (def.actors || [])) if (!a.gone) out.push(a);
    for (const s of (def.spots || [])) {
      if (s.gone || (s.when && !s.when())) continue;
      if (s.egg && (quiet || !glassOut())) continue;
      out.push(s);
    }
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

  /* ============================================================
     WHAT IS UNDER THE POINTER.

     THE SMALLEST BOX WINS. It used to be the nearest centre, and a
     nearest-centre rule makes anything small that sits on top of
     anything big unreachable: the eighteen-pixel easter egg on the
     bar stool was at the same x as the stool, so pointing at it
     always got the stool. The specific thing beats the general one,
     and a tie in size falls back to the nearer centre.
     ============================================================ */
  function pick(x, y) {
    let best = null, bestA = 1e9, bd = 1e9;
    for (const o of targets()) {
      const w = o.w || 26;
      /* a thing standing back in the room has its box up there with it */
      const fy = floorAt(o.z), dy = fy - def.floorY;
      const top = o.top === undefined ? fy - 44 : o.top + dy;
      const bot = o.bot === undefined ? fy + 6 : o.bot + dy;
      /* GENEROUS. Four pixels of slop round a hotspot is right for a finger
         on a phone and mean for a mouse on a desk: a click two pixels off
         the kettle walked him to the floor next to it and did nothing,
         which reads as the game ignoring you. Ten either side, twelve
         above -- and the smallest box still wins, so a mug on a desk is
         still pickable over the desk it is on. */
      if (x > o.x - w / 2 - 10 && x < o.x + w / 2 + 10 && y > top - 12 && y < bot + 8) {
        const area = w * Math.max(1, bot - top), dd = Math.abs(x - o.x);
        if (area < bestA - 1 || (Math.abs(area - bestA) <= 1 && dd < bd)) {
          bestA = area; bd = dd; best = o;
        }
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
    /* the earned expression, running out */
    if (warmT > 0) { warmT = Math.max(0, warmT - dt); if (!warmT) warmKind = null; }

    /* ------------------------------------------------------------
       AND THE ONES WHO PACE.

       Everybody else works on the spot. A frog with the job 'pace'
       walks a short beat and turns round at the end of it, which is
       the only behaviour that has to move him rather than move his
       arms — so it happens here rather than in the draw.
       ------------------------------------------------------------ */
    /* ------------------------------------------------------------
       AND THE ONES A SCRIPT IS DRIVING.

       A cutscene is a room with somebody walking across it, so an
       actor needs to be able to be told to go somewhere and then
       get on with it -- same walk cycle, same feet, same rig as
       when you are playing. See CUT.
       ------------------------------------------------------------ */
    for (const a of (def.actors || [])) {
      if (a._goto === undefined || a.gone) continue;
      const dx = a._goto - a.x;
      const sp = a._gspeed || 26;
      if (Math.abs(dx) <= sp * dt) {
        a.x = a._goto; a._goto = undefined; a.frame = 0; a._step = null;
        if (a._gthen) { const f = a._gthen; a._gthen = null; f(); }
        continue;
      }
      a.x += Math.sign(dx) * sp * dt;
      a.face = Math.sign(dx);
      a._gw = (a._gw || 0) + dt * (sp * 0.29);
      a.frame = Math.floor(a._gw) % (SPR.WALK_FRAMES || 8);
      a._step = { ph: a._gw % 1, amt: Math.min(1, sp / 40) };
    }
    for (const a of (def.actors || [])) {
      if (a.job !== 'pace' || a.gone || a.talking || a._goto !== undefined) continue;
      if (a._home === undefined) { a._home = a.x; a._dir = 1; a._wait = 0; }
      if (a._wait > 0) { a._wait -= dt; a.frame = 0; a._step = null; continue; }
      a.x += a._dir * 13 * dt;
      a.face = a._dir;
      a._pw = (a._pw || 0) + dt * 7;
      a.frame = Math.floor(a._pw) % 8;
      a._step = { ph: a._pw % 1, amt: 0.62 };
      const span = a.beat || 22;
      if ((a._dir > 0 && a.x > a._home + span) || (a._dir < 0 && a.x < a._home - span)) {
        a._dir = -a._dir;
        a._wait = 0.7 + (Math.abs(Math.round(a._home)) % 5) * 0.2;
      }
    }
    /* ============================================================
       A TURN WAS A MIRROR FLIP.

       me.face went from plus one to minus one between two frames and
       the whole sprite reversed in a single tick, which at this size
       reads as a glitch rather than as a man turning round -- and it
       was most of what made the movement look ugly, because you do it
       every time you tap the other side of the room.

       So the FACING lags: me.turn walks toward me.face over about a
       fifth of a second, the sprite is squashed horizontally to how
       far through the turn it is, and the drawing itself flips at the
       exact frame the squash is narrowest. Which is how a cartoon has
       always turned somebody round.
       ============================================================ */
    if (me.turn === undefined) me.turn = me.face;
    me.turn = U.approach(me.turn, me.face, 11, dt);
    for (const a of (def.actors || [])) {
      if (a.turn === undefined) a.turn = a.face || 1;
      a.turn = U.approach(a.turn, a.face || 1, 11, dt);
    }
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
    for (const o of targets(true)) {
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
    /* THE HOUR TURNED OVER WHILE YOU WERE IN HERE. Searching a room costs
       eighteen minutes a prop, so an afternoon walked in can be a golden
       hour walked out of — repaint rather than let the room lie about the
       light coming through its own windows. */
    if (def && typeof DAY !== 'undefined' && DAY.band().id !== backBand) {
      back = paintBack(def);
    }
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
      /* ============================================================
         THE WALL GOES UP.

         The headroom over an interior used to be a flat navy slab
         with a brick vault sliding across it, and at half the pixel
         size that came out as a black bar nailed over the top of the
         room — the same mistake the outdoor rooms had, in a
         different colour.

         A room has a wall. So take the top ten rows of the room's
         OWN paint and tile them upward: the brick, the tile, the
         boarding, whatever this place is made of, carries on up to
         the ceiling and gets darker as it goes, the way a wall
         actually does. Then the joists and the lamp cords go over
         the top of it.
         ============================================================ */
      const camr = Math.round(cam);
      const bandH = 10;
      for (let y2 = oy - bandH; y2 > -bandH; y2 -= bandH) {
        const hh = Math.min(bandH, oy - Math.max(0, y2));
        if (hh <= 0) continue;
        c.drawImage(back, 0, PAD, back.width, bandH,
          -camr, Math.max(0, y2), back.width, bandH);
      }
      /* it gets darker toward the ceiling, and cooler */
      for (let i = 0; i < oy; i++) {
        const t = 1 - i / oy;
        ART.px(c, 0, i, vw2, 1, 'rgba(16,14,22,' + (0.62 * t * t).toFixed(3) + ')');
      }
      /* joists across, in perspective: closer together toward the top */
      for (let i = 1; i * i < oy * 3; i++) {
        const y = oy - Math.round(i * i * 0.9);
        if (y < 1) break;
        ART.px(c, 0, y, vw2, 1, 'rgba(255,244,220,.06)');
        ART.px(c, 0, y + 1, vw2, 1, 'rgba(0,0,0,.34)');
      }
      /* the beams running the other way, tied to world x so they scroll */
      for (let x = -(camr % 46); x < vw2; x += 46) {
        ART.px(c, x, 0, 3, oy, 'rgba(0,0,0,.30)');
        ART.px(c, x, 0, 1, oy, 'rgba(255,244,220,.05)');
      }
      /* the cords of whatever hangs in this room, going up into it */
      for (const L of (def.lights || [])) {
        const lx = Math.round(L.x - camr);
        if (lx < -4 || lx > vw2 + 4) continue;
        ART.px(c, lx, 0, 1, oy + 2, '#2a2d38');
      }
      /* the picture rail where the wall meets the room proper */
      ART.px(c, 0, oy - 1, vw2, 1, 'rgba(255,244,220,.10)');
      ART.px(c, 0, oy, vw2, 2, 'rgba(0,0,0,.45)');
    }

    c.translate(-Math.round(cam), oy);
    /* the painted room, pulled up so its row 0 lands on the frame's row 0 */
    c.drawImage(back, 0, -PAD);

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
        /* ---- AND THEN THE CITY, over the sky, sliding at a third of the
           room's rate. Sky alone in a seventy-by-forty opening is a
           rectangle of flat pale blue with nothing in it, four times
           brighter than the room around it. ---- */
        const lit = (typeof DAY !== 'undefined')
          && ['dusk', 'dark', 'first'].indexOf(DAY.band().id) >= 0;
        const vis = ART.vista(Math.max(40, dp.w), Math.max(16, dp.h), seedOf(def), lit);
        const vspan = vis.width;
        const voff = dp.x - (Math.round(cam * 0.33) % vspan);
        c.drawImage(vis, voff, dp.y + dp.h - vis.height);
        c.drawImage(vis, voff + vspan, dp.y + dp.h - vis.height);
        /* ---- AND THE GLASS. You are inside a dark room looking out, so
           the outside is knocked back and the pane is dirty. ---- */
        ART.px(c, dp.x, dp.y, dp.w, dp.h, 'rgba(16,20,30,.30)');
        for (let i = 0; i < 6; i++) {
          const a = (0.20 - i * 0.032).toFixed(3);
          ART.px(c, dp.x + i, dp.y + i, dp.w - i * 2, 1, 'rgba(10,14,20,' + a + ')');
          ART.px(c, dp.x + i, dp.y + dp.h - 1 - i, dp.w - i * 2, 1, 'rgba(10,14,20,' + a + ')');
          ART.px(c, dp.x + i, dp.y + i, 1, dp.h - i * 2, 'rgba(10,14,20,' + a + ')');
          ART.px(c, dp.x + dp.w - 1 - i, dp.y + i, 1, dp.h - i * 2, 'rgba(10,14,20,' + a + ')');
        }
        /* one raking reflection off the pane, and the muck it has run in */
        for (let i = 0; i < dp.h; i++) {
          ART.px(c, dp.x + Math.round(dp.w * 0.16) + i, dp.y + i, Math.max(2, dp.w >> 3), 1,
            'rgba(214,232,248,.055)');
        }
        for (let i = 0; i < Math.round(dp.w / 7); i++) {
          const gx = dp.x + ((i * 37) % dp.w);
          ART.px(c, gx, dp.y + dp.h - 2 - ((i * 13) % Math.max(2, dp.h >> 2)), 1,
            1 + (i % 3), 'rgba(0,0,0,.24)');
        }
        /* the reveal of the opening */
        ART.px(c, dp.x, dp.y, dp.w, 1, 'rgba(0,0,0,.44)');
        ART.px(c, dp.x, dp.y + 1, dp.w, 1, 'rgba(255,255,255,.07)');
        ART.px(c, dp.x, dp.y, 1, dp.h, 'rgba(0,0,0,.30)');
        ART.px(c, dp.x + dp.w - 1, dp.y, 1, dp.h, 'rgba(0,0,0,.30)');
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
    /* a cutscene can take him out of his own shot */
    if (!me.hidden) cast.push({ y: floorAt(me.z) + 0.5, draw: () => drawMe(c, T) });
    drawMark(c, T);
    drawCritters(c, T);
    cast.sort((p, q) => p.y - q.y).forEach(o => o.draw());

    /* ------------------------------------------------------------
       THE FOREGROUND.

       Everything above is behind the cast, which is right for a
       wall and wrong for a counter: a clerk standing BEHIND a bar
       came out standing on top of it. A room can declare a fore()
       painter for the things that are in front of everybody --
       counters, rails, the near edge of a bench -- and it is
       cached and drawn exactly like the room art, over the top.
       ------------------------------------------------------------ */
    if (fore) c.drawImage(fore, 0, -PAD);

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

    /* ============================================================
       WHAT IS CLICKABLE, ALWAYS.

       Every hotspot and every person in this game has had a bracket
       round it on hover since the tools went in, and click-to-walk-
       and-use has worked the whole time. The problem was never the
       machinery: it was that a room full of things you can click
       looked exactly like a room full of things you cannot, until
       your pointer was already on top of one. On a phone you sweep
       a thumb around and find out. With a mouse you look, and if
       nothing looks clickable you decide nothing is.

       So everything interactive now carries a small standing mark --
       two ticks and a dot, dim, on a slow pulse seeded off its own
       position so a wall of them never blinks in time. Hover still
       puts the full bracket on, and a click still sends him. It just
       tells you the offer is there first.
       ============================================================ */
    if (!busy) {
      for (const o of targets()) {
        if (o === hover || o.gone) continue;
        if (!o.onUse && !o.onLook) continue;
        if (o.egg && !glassOut()) continue;        /* secrets stay secret */
        const fy2 = floorAt(o.z), dy2 = fy2 - def.floorY;
        const ty = (o.top === undefined ? fy2 - 44 : o.top + dy2) - 3;
        const mx2 = Math.round(o.x);
        /* a DIAMOND, not a dot: one pale pixel on a busy wall is a piece of
           grit, and the point of this is that you can see it without
           looking for it. Amber over a person, ice over a thing. */
        const ph2 = 0.50 + 0.34 * Math.abs(Math.sin(T * 1.9 + (Math.abs(mx2) % 19) * 0.4));
        /* amber over a PERSON, ice over a thing -- and a person is an
           actor, which is the thing that carries a def; spots have labels
           too, so labels do not tell them apart */
        const hot = !!o.def;
        const c1 = hot ? '#ffd75e' : '#7fd7ff';
        const c2 = hot ? '#fff3c4' : '#d6f2ff';
        const bob2 = Math.round(Math.sin(T * 1.9 + (Math.abs(mx2) % 11)) * 1);
        const yy = ty + bob2;
        c.globalAlpha = ph2;
        for (let i = 0; i < 4; i++) {                 /* the ink diamond */
          const wd = 7 - Math.abs(i - 1) * 2;
          ART.px(c, mx2 - (wd >> 1), yy - 2 + i, wd, 1, 'rgba(6,8,14,.72)');
        }
        ART.px(c, mx2 - 2, yy - 1, 5, 1, c1);
        ART.px(c, mx2 - 1, yy - 2, 3, 1, c1);
        ART.px(c, mx2 - 1, yy, 3, 1, c1);
        ART.px(c, mx2, yy - 1, 1, 1, c2);
        c.globalAlpha = ph2 * 0.34;                   /* and the halo on it */
        ART.px(c, mx2 - 4, yy - 1, 9, 1, c1);
        ART.px(c, mx2 - 1, yy - 4, 3, 7, c1);
        c.globalAlpha = 1;
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

    /* ============================================================
       THE GLINT.

       With the glass in your hand, and only then, every easter egg
       in the room catches a little light — one pixel, on a slow
       count, out of phase with its neighbours. Without the glass
       there is nothing there at all. That is the whole game of
       finding them: sweep the room and watch for the sparkle.
       ============================================================ */
    if (glassOut()) {
      for (const s of (def.spots || [])) {
        if (!s.egg || s.gone) continue;
        const fy = floorAt(s.z), dy = fy - def.floorY;
        const gy = (s.top === undefined ? fy - 10 : s.top + dy) - 4;
        const ph = Math.sin(T * 2.4 + (s.x % 23)) ;
        if (ph < 0.55) continue;
        const a2 = ((ph - 0.55) / 0.45).toFixed(2);
        ART.px(c, s.x, gy, 1, 1, 'rgba(255,248,210,' + a2 + ')');
        ART.px(c, s.x - 2, gy, 1, 1, 'rgba(255,248,210,' + (a2 * 0.5).toFixed(2) + ')');
        ART.px(c, s.x + 2, gy, 1, 1, 'rgba(255,248,210,' + (a2 * 0.5).toFixed(2) + ')');
        ART.px(c, s.x, gy - 2, 1, 1, 'rgba(255,248,210,' + (a2 * 0.5).toFixed(2) + ')');
        ART.px(c, s.x, gy + 2, 1, 1, 'rgba(255,248,210,' + (a2 * 0.5).toFixed(2) + ')');
      }
    }
    /* THE ANIMALS GO IN FRONT OF IT. A cat is twenty pixels tall and every
       room has a counter across the front of it: behind the furniture, in
       depth order, the dog was simply invisible. */
    drawPets(c, T);
    /* the lamps, over the cast, so people stand in the light */
    for (const L of (def.lights || [])) {
      const flick = L.flicker ? (Math.sin(T * 13 + L.x) > 0.86 ? 0.5 : 1) : 1;
      /* A LIGHT CAN POOL ON SOMETHING THAT IS NOT THE FLOOR. A lamp over a
         counter throws its pool on the counter; sending every pool to the
         floor hid half of them behind the furniture. */
      cone(c, L.x, L.y, L.r || 46, (L.a || 0.14) * flick,
        L.fy === undefined ? def.floorY : L.fy, L.bare);
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
      /* ============================================================
         NO CAST OVER THE FRAME. NOT EVEN A WHISPER.

         The hour is baked into the room canvas by DAY.bake when the
         room is painted, which is the honest place for it. This used
         to ALSO lay two translucent sheets over the finished frame
         every tick — a warm one and a cool one, three or four per
         cent each. Measured on a real room that came to plus four
         red, plus five green, plus six blue on the mean pixel, blue
         shifted, over every pixel in the picture: which is the
         definition of a filter over the game, and it is exactly what
         it looked like. If an hour needs more character it goes in
         the bake, where it lands on the art once.
         ============================================================ */
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
    /* IF YOU CAN CLICK IT YOU CAN READ IT. The label was gated on the thing
       being within three hundred pixels of HIM, which on a room twice that
       wide meant pointing at something across the room told you nothing --
       and clicking it sends him there, so it was gated on the wrong thing. */
    const show = hover || near;
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
  /* ============================================================
     THE BOUNCE.

     Everybody in this game walked FLAT. The legs cycled, the arms
     swung, the head lagged a pixel -- and the body itself travelled
     along a perfectly level line, because the only vertical motion
     in the gait was a hop gated behind good karma and a limp gated
     behind low hearts. A cartoon walk does not work like that. The
     body rises over the leg that is carrying it and drops onto the
     one that is landing, TWICE a stride, and it squashes on the
     drop and stretches at the top.

     So: one shared bounce, taken off the walk phase, used by the
     player and by every actor who is going somewhere.

       hop      up over each pass of the stride, two per stride
       squash   +ve wider-and-shorter at the contacts, -ve taller
                -and-narrower at the top of each pass
       tip      the lean into the direction of travel

     Everything is scaled by `amt`, which is how fast the figure is
     actually moving, so a stroll is a nod and a run is a bounce.
     ============================================================ */
  function stepBounce(ph, amt) {
    const up = Math.abs(Math.sin(ph * Math.PI * 2));
    return {
      hop: up * 3.4 * amt,
      /* at the contacts up is 0 and he is squashed; at the pass up is 1
         and he is stretched. Centred on 0.44 rather than 0.5 because a
         walk spends longer in contact than in the air. */
      squash: (0.44 - up) * 0.13 * amt,
    };
  }

  function gaitOf() {
    const speed = Math.hypot(Math.abs(me.v), Math.abs(me.vz) * (band() || 1));
    if (speed < 6) return { hop: 0, drop: 0, tip: 0, squash: 0 };
    /* where in the stride he is: the walk counter, not the clock */
    const NF2 = SPR.WALK_FRAMES || 8;
    const ph = (me.walk / NF2) % 1;
    const amt = Math.min(1, speed / 62);
    const b = stepBounce(ph, amt);
    const k = (typeof STORY !== 'undefined' && STORY.karma) ? STORY.karma() : null;
    const hurt = (typeof G !== 'undefined' && (G.hearts || 6) <= 2);
    const glad = k && k.band >= 2;
    /* pleased with himself, he skips: the same bounce again on top */
    const hop = b.hop * (glad ? 1.55 : 1);
    /* THE DRAG: down on one foot of the two, and only if he is hurt */
    const drop = hurt ? (ph < 0.5 ? 1 : 0) : 0;
    /* everybody leans a little into where they are going */
    const tip = Math.round(Math.sign(me.v) * Math.min(2, Math.abs(me.v) / 34));
    return { hop: Math.round(hop), drop, tip, squash: b.squash };
  }

  /* ============================================================
     WHAT SOMEBODY IS DOING WHILE YOU ARE NOT TALKING TO THEM.

     Everybody in every room used to breathe, and that was the
     whole of it: nine frogs standing perfectly still with their
     chests going up and down. At the old camera distance you
     could not tell. The camera is closer now and you can.

     So an actor gets a JOB, and a job is three things: a loop
     with its own period, what the body does on that loop, and
     the thing in his hands while he does it. The clerk types, the
     one at the next desk turns a page, the barman wipes down the
     counter he has wiped a thousand times, the watchman smokes,
     somebody eats at the cafe, and the frog with nothing to do
     walks four steps one way and four steps back.

     Props are drawn at the hand: six to ten room pixels, which at
     the close camera is enough to read as a cup or a pencil.
     ============================================================ */
  const DOING = {
    /* job      period  what the body does           prop */
    /* THE DESK ALREADY HAS A TYPEWRITER ON IT. Drawing a second one at
       hand height put a machine through the middle of the clerk; the peck
       of the shoulders is what reads as typing anyway. */
    /* arm: which of SPR.ARM_POSE the near arm holds. The whole body used
       to shuffle a pixel or two sideways and a prop floated at chest
       height beside it; now the arm is actually in the pose and the prop
       is in the hand the rig reports. */
    type:   { per: 0.34, body: 'peck', prop: null, arm: 'type' },
    notes:  { per: 2.60, body: 'lean', prop: 'pad', arm: 'hold' },
    read:   { per: 3.40, body: 'lean', prop: 'paper', arm: 'hold' },
    drink:  { per: 3.80, body: 'raise', prop: 'glass' },
    eat:    { per: 2.20, body: 'raise', prop: 'bite' },
    smoke:  { per: 4.60, body: 'raise', prop: 'cig' },
    wipe:   { per: 1.20, body: 'swing', prop: 'rag' },
    sweep:  { per: 1.70, body: 'swing', prop: 'broom' },
    sort:   { per: 1.50, body: 'peck', prop: null, arm: 'reach' },
    pace:   { per: 7.00, body: 'walk', prop: null },
    watch:  { per: 5.20, body: 'turn', prop: null },
  };

  /* the little things they hold, all drawn facing `dir` */
  function prop(c, kind, x, y, dir, T, ph) {
    const px = (a, b, w, h, col) => ART.px(c, a, b, w, h, col);
    if (kind === 'keys') {
      /* the machine, not the hands: a carriage and a stack of paper */
      px(x - 7, y + 1, 15, 5, '#3a3d48');
      px(x - 7, y + 1, 15, 1, '#565b6c');
      px(x - 5, y - 3, 11, 4, '#2a2d38');
      px(x - 4, y - 2, 9, 2, '#e2d7b8');
      for (let i = 0; i < 5; i++) {
        px(x - 5 + i * 3, y + 3, 2, 1, (Math.floor(ph * 5) === i) ? '#c9c0a8' : '#8d8672');
      }
    } else if (kind === 'pad') {
      px(x - 4 * dir, y, 9, 7, '#e2d7b8');
      px(x - 4 * dir, y, 9, 1, '#f2e9cf');
      px(x - 3 * dir, y + 2, 7, 1, 'rgba(34,32,28,.5)');
      px(x - 3 * dir, y + 4, 5, 1, 'rgba(34,32,28,.5)');
      /* the pencil, moving down the page */
      px(x + 4 * dir, y + 1 + Math.round(ph * 4), 4, 1, '#c9a24a');
      px(x + 7 * dir, y + 1 + Math.round(ph * 4), 1, 1, '#22201c');
    } else if (kind === 'paper') {
      const turn = ph > 0.86;
      px(x - 6 * dir, y - 1, 13, 10, '#e2d7b8');
      px(x - 6 * dir, y - 1, 13, 1, '#f2e9cf');
      for (let i = 0; i < 4; i++) px(x - 5 * dir, y + 1 + i * 2, 10 - (i % 2) * 3, 1, 'rgba(34,32,28,.45)');
      if (turn) px(x + 3 * dir, y - 2, 5, 11, '#f2e9cf');
    } else if (kind === 'glass') {
      px(x, y, 5, 6, 'rgba(200,225,235,.55)');
      px(x, y, 5, 1, '#e8f2f6');
      px(x + 1, y + 2, 3, 4, '#8a5a1a');
      px(x, y + 6, 5, 1, 'rgba(0,0,0,.35)');
    } else if (kind === 'bite') {
      px(x, y, 7, 5, '#c9a24a');
      px(x, y, 7, 1, '#e2c274');
      px(x + 1, y + 2, 5, 2, '#8a5a2a');
      if (ph > 0.5) px(x + 5, y, 2, 2, '#e2d7b8');   /* a piece gone */
    } else if (kind === 'cig') {
      px(x, y + 2, 6, 1, '#efe6cc');
      px(x + 6, y + 2, 1, 1, '#e0631e');
      for (let i = 0; i < 3; i++) {
        px(x + 6, y - 1 - i * 2 - Math.round(ph * 3), 1, 1,
          'rgba(206,202,190,' + (0.30 - i * 0.08).toFixed(2) + ')');
      }
    } else if (kind === 'rag') {
      px(x, y + 2, 8, 3, '#c2cbd4');
      px(x, y + 2, 8, 1, '#e2e8ee');
      px(x + 2, y + 5, 4, 1, 'rgba(0,0,0,.28)');
    } else if (kind === 'broom') {
      px(x, y - 8, 1, 12, '#8a6a44');
      px(x - 3, y + 4, 8, 4, '#b8963c');
      px(x - 3, y + 4, 8, 1, '#d8b45c');
    }
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
    /* ============================================================
       NO PROFILE. THE SIDE VIEW IS GONE.

       An actor used to turn to you when you came close and stand
       edge-on the rest of the time, and the walking rig went into
       profile whenever it moved sideways. It was rebuilt twice --
       once as its own drawing rather than the front bust squeezed
       narrow, then again with a lit panel, a slimmer depth and an
       arm with a line round it -- and it never once looked as good
       as the front view of the same frog. A head-on cartoon with a
       hat and two eyes reads instantly; the same animal edge-on is
       a wedge with a coat behind it.

       So there is no side view. Everybody faces the lens, and the
       facing mirrors, which is what this game did for its first
       twenty waves and what most 2D cartoons have always done.
       ============================================================ */
    const fy = a.y === undefined ? floorAt(a.z) : a.y;
    const id = a.still ? { rise: 0, lean: 0, roll: 0 } : idleOf(T, Math.round(a.x));
    const sc = scaleAt(a.z);
    /* AND WHAT HE IS DOING WITH HIS HANDS. A witness at a counter is
       working: wiping it down, sorting a rack, turning a page. The arm
       goes into a real pose and alternates between two of them, which is
       how a hand-drawn cycle has always done it. */
    let work = 0, lift = 0, arm = '';
    const job = DOING[a.job];
    if (job) {
      /* his own phase, so two clerks at two desks are never in step */
      const ph = ((T / job.per) + (Math.abs(Math.round(a.x)) % 17) * 0.11) % 1;
      const sw = Math.sin(ph * Math.PI * 2);
      arm = job.arm || '';
      if (job.body === 'peck') work = Math.round(sw * 1.2);
      else if (job.body === 'lean') { work = Math.round(sw); lift = Math.round(Math.abs(sw)); }
      else if (job.body === 'raise') {
        lift = ph < 0.34 ? Math.round(ph * 9) : (ph < 0.5 ? 3 : 0);
        arm = ph > 0.20 && ph < 0.62 ? 'up' : 'reach';
      } else if (job.body === 'swing') {
        /* SIX FRAMES OF ONE SWEEP, out and back. This used to flip between
           two poses whose wrists sit eleven pixels apart on the y, so the
           hand jumped rather than travelled -- and the body slid four
           pixels sideways to cover for it, which just added a second
           motion going the wrong way. The body leans WITH the hand now,
           half as far. */
        const SW = [1, 2, 3, 4, 3, 2];
        const i2 = Math.min(SW.length - 1, Math.floor(ph * SW.length));
        arm = 'wipe' + SW[i2];
        work = Math.round((SW[i2] - 2.5) * 0.8);
      } else if (job.body === 'turn') work = sw > 0 ? 1 : -1;
      a._ph = ph;
    } else if (a.busyAt) {
      const wp = (T * a.busyAt + (a.x % 11) * 0.3) % 1;
      work = Math.round(Math.sin(wp * Math.PI * 2) * 2);
    }
    if (a.arm) arm = a.arm;                 /* a script can hold a pose */
    /* the same lagged turn everybody else gets: an actor walking across a
       cutscene and turning round at the end of it used to reverse between
       two frames */
    const atf = (a.turn === undefined ? face : (a.turn >= 0 ? 1 : -1));
    const atw = Math.max(0.24, Math.abs(a.turn === undefined ? 1 : a.turn));
    const r = rig(a, a.frame || 0, a.turn === undefined ? face : atf,
      a.back, ex, arm);
    /* AND HOW BIG HE IS. Depth already scales everybody, which is the right
       rule for a room and the wrong one for a CHILD: a boy standing next to
       his father is smaller without being further away. */
    const sc2 = sc * (a.scale || 1);
    /* AND HE BOUNCES IF HE IS WALKING. An actor crossing a room on the same
       flat line as the furniture is the thing that made a busy room read as
       a diorama with one moving part. */
    const ab = a._step ? stepBounce(a._step.ph, a._step.amt) : { hop: 0, squash: 0 };
    const w = Math.max(1, Math.round(r.w * sc2 * atw * (1 + ab.squash)));
    const h = Math.max(1, Math.round(r.h * sc2 * (1 - ab.squash)) - id.rise);
    const ahop = Math.round(ab.hop);
    castShadow(c, Math.round(a.x), fy + Math.round(ab.hop * 0.4), w,
      0.42 - ab.hop * 0.08);
    c.drawImage(r.cv, Math.round(a.x - w / 2) + id.lean + work,
      Math.round(fy - h + 1 - ahop + (work ? Math.abs(work) - 1 : 0)), w, h);
    /* AND WHAT IS IN HIS HANDS — in the hand the rig reports, so the glass
       arrives at his mouth and the rag arrives on the counter. */
    if (job && job.prop) {
      const dx = Math.round(a.x - w / 2) + id.lean + work;
      const dy = Math.round(fy - h + 1 - ahop + (work ? Math.abs(work) - 1 : 0));
      const hd = r.cv.hand;
      const hx = hd ? Math.round(dx + hd.x * (w / r.cv.width))
        : Math.round(a.x + (w * 0.52) * face);
      const hy = hd ? Math.round(dy + hd.y * (h / r.cv.height))
        : Math.round(fy - h * 0.42) - lift;
      prop(c, job.prop, hx, hy, face, T, a._ph || 0);
    }
  }

  /* ============================================================
     WHAT A FIGURE PUTS ON THE FLOOR.

     Everybody in this game stood on a two-row bar at a third
     opacity, and an object with a bar under it does not read as
     standing on the floor -- it reads as having a bar under it. A
     contact shadow is DARKEST and TIGHTEST where the feet touch,
     it spreads and fades as it goes, and it goes AWAY from
     whatever is lighting the room, which every room already
     declares as def.lights.
     ============================================================ */
  function castShadow(c, x, fy, w, a) {
    let dir = 1, near = 1e9;
    for (const L of (def && def.lights) || []) {
      const dd = Math.abs(L.x - x);
      if (dd < near) { near = dd; dir = L.x <= x ? 1 : -1; }
    }
    const len = Math.round(w * (near > 110 ? 0.55 : 1.15));
    /* eight steps, not one per pixel: this runs for every actor every frame */
    for (let i = 8; i >= 1; i--) {
      const t = i / 8;
      SPR.ellipse(c, Math.round(x + dir * len * t), fy + Math.round(t * 2),
        Math.max(1, Math.round(w * 0.44 * (1 - t * 0.62))),
        Math.max(1, Math.round(3.2 * (1 - t * 0.7))),
        'rgba(9,11,17,' + (a * 0.62 * (1 - t) * (1 - t * 0.6)).toFixed(3) + ')');
    }
    SPR.ellipse(c, x, fy, Math.round(w * 0.46), 3, 'rgba(8,10,14,' + (a * 0.95).toFixed(3) + ')');
    SPR.ellipse(c, x, fy + 1, Math.round(w * 0.30), 2, 'rgba(5,6,9,' + (a * 1.25).toFixed(3) + ')');
  }

  /* ============================================================
     AND WHAT THE DETECTIVE'S OWN FACE IS DOING.

     Read off the state of the shift, not off a timer: he squints
     when he is working something out, winces when he is nearly
     out of hearts, looks pleased when the city thinks well of
     him, and goes bored when there is nothing left to do here.
     ============================================================ */
  /* ------------------------------------------------------------
     A WARM FACE HAS TO BE EARNED, AND IT DOES NOT LAST.

     Something good happens — the dog leans on him, an errand pays,
     a story comes apart — and he allows himself about two seconds
     of it. SCENE.beat('good') is what the rest of the game calls.
     ------------------------------------------------------------ */
  let warmT = 0, warmKind = null;
  function beat(kind) {
    warmKind = kind;
    warmT = kind === 'good' ? 2.2 : kind === 'wry' ? 1.6 : 1.2;
  }

  function myFace(T) {
    if (me.reach > 0) return 'squint';                 // hand in something
    if (typeof G === 'undefined') return 'neutral';
    if ((G.hearts || 6) <= 2) return 'wince';
    /* the earned moment, while it lasts */
    if (warmT > 0) {
      if (warmKind === 'good') return (warmT % 0.9) > 0.45 ? 'happy' : 'grin';
      if (warmKind === 'wry') return 'smug';
      if (warmKind === 'bad') return 'angry';
    }
    const k = (typeof STORY !== 'undefined' && STORY.karma) ? STORY.karma() : null;
    /* HE DOES NOT SMILE BECAUSE HIS PAPERWORK IS IN ORDER. Good standing
       makes him steadier, not happier; bad standing makes him harder. */
    const mood = !k ? 'grim'
      : k.band <= -2 ? 'grimmer'
      : k.band <= -1 ? 'hard'
      : (CITY && CITY.minutesLeft && CITY.minutesLeft() < 120) ? 'weary'
      : Math.abs(me.v) > 4 ? 'grim' : 'watch';
    return faceOf(mood, T, 3);
  }

  function drawMe(c, T) {
    /* WHICH WAY HE IS TURNED.

       Walking away you see his back. Walking INTO or OUT OF the depth you
       see him front or back on. And walking along the street — which is
       what he is doing most of the time he is moving at all — you see him
       in profile, because that is what walking sideways looks like. */
    const back = me.faceZ < 0;
    /* a cutscene can pin his face and put his arm in a pose — reaching for
       the ashtray, handing the iron over the counter */
    /* the drawing flips at the narrowest point of the turn, not at the
       instant the input changed */
    const tf = (me.turn === undefined ? me.face : me.turn) >= 0 ? 1 : -1;
    const tw = Math.max(0.24, Math.abs(me.turn === undefined ? 1 : me.turn));
    const r = rig(SCENE.meDef(), me.frame, tf, back,
      me.expr || myFace(T), me.arm);
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
    const g = gaitOf();
    /* the walk's own squash rides on top of the landing squash: wider and
       shorter at each contact, taller and narrower over each pass */
    const gq = g.squash || 0;
    const w = Math.max(1, Math.round(r.w * sc * tw * (1 + sq + gq - st * 0.5 + rc * 0.04)));
    const h = Math.max(1, Math.round(r.h * sc * (1 - sq - gq + st - rc * 0.05)) - id.rise);
    const shW = Math.round(r.w * (0.66 + sq + gq));
    /* THE SHADOW STAYS ON THE FLOOR while he hops off it, which is the only
       thing that makes a hop read as leaving the ground rather than as the
       whole sprite sliding up the screen. */
    castShadow(c, Math.round(me.x), fy + Math.round(g.hop * 0.4), shW,
      0.50 - g.hop * 0.10);
    c.drawImage(r.cv, Math.round(me.x - w / 2) + id.lean + lean + g.tip,
      Math.round(fy - h + 1 - g.hop + g.drop), w, h);
  }

  /* A lamp cone. Kept faint on purpose: a visible triangle painted on a
     wall reads as a bug, so most of the light lands on the floor. */
  /* ============================================================
     A LAMP, NOW THAT IT HAS TO DO THE WORK.

     There used to be a mid-grey screened over every interior to
     raise its blacks, and while that was there a lamp only had to
     suggest itself — five per cent of warm over a room that was
     already flat. The lift is gone. The rooms are as dark as they
     were painted, which is a mafia story in a city at night, and
     the light has to come from the things in the room that make
     light.

     So a lamp is four things now, all of them LOCAL, because
     local is the whole point: light in darkness rather than a
     brighter darkness everywhere.

       THE BLOOM     the air right at the bulb, hottest
       THE CONE      the shaft down to the floor, narrowing off
       THE POOL      an ellipse on the floor under it
       THE BOUNCE    what the wall behind it does about all that
     ============================================================ */
  function cone(c, x, y, r, a, fy, bare) {
    const drop = Math.max(8, fy - y);
    /* THE BOUNCE: the wall around the lamp lifts, and only there */
    for (let i = 1; i <= 5; i++) {
      ART.px(c, Math.round(x - r * 0.5 * i / 5 - 6), Math.round(y - 10 - i * 2),
        Math.round(r * i / 5 + 12), Math.round(6 + i * 3),
        'rgba(255,226,158,' + (a * (0.34 - i * 0.05)).toFixed(4) + ')');
    }
    /* THE CONE. ROW BY ROW, WITH A SOFT EDGE.

       This used to be a dozen stacked rectangles, each one wider than the
       last, and at any decent scale the width jumps read as a staircase:
       the light under a hall pendant came out as a stepped pyramid sitting
       on the floor. One row at a time and two nested widths per row costs
       a few hundred fills a frame and gives it an edge that falls off
       instead of a flight of stairs. */
    for (let i = 0; i < drop; i++) {
      const t = i / drop;
      const hw = 4 + t * r * 0.62;
      const fall = 1 - t * 0.58;
      const yy = Math.round(y + i);
      ART.px(c, Math.round(x - hw), yy, Math.round(hw * 2), 1,
        'rgba(255,231,163,' + (a * 0.26 * fall).toFixed(4) + ')');
      ART.px(c, Math.round(x - hw * 0.62), yy, Math.round(hw * 1.24), 1,
        'rgba(255,234,176,' + (a * 0.28 * fall).toFixed(4) + ')');
    }
    /* THE POOL on the floor: an ellipse, brightest at the middle */
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const hw = Math.round(r * (0.34 + t * 0.74));
      ART.px(c, x - hw, fy - 5 + i, hw * 2, 1,
        'rgba(255,236,178,' + (a * (2.1 - t * 1.5)).toFixed(4) + ')');
    }
    /* THE BLOOM at the bulb itself, which is the only hot thing — and only
       if there IS a bulb there. A light with nothing drawn at the source
       (a shaft through a window, the spill from the next room) blooms into
       a white star floating on the wall, which is worse than no light. */
    if (bare) return;
    for (let i = 4; i >= 1; i--) {
      PIX.disc(c, Math.round(x), Math.round(y + 2), i * 3,
        'rgba(255,244,208,' + (a * (0.5 - i * 0.08)).toFixed(4) + ')');
    }
    PIX.disc(c, Math.round(x), Math.round(y + 2), 2, 'rgba(255,250,226,' + Math.min(0.85, a * 6).toFixed(3) + ')');
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
        /* a label over a prop is a small card: no stamp, no punched holes */
        small: true,
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
    H, open, close, walkTo, rig, rigH, rigPic, beat,
    /* Z: the whole room, or close enough to see a face */
    toggleZoom() {
      if (typeof META === 'undefined') return false;
      const m = META.load();
      m.wideShot = !m.wideShot;
      META.save();
      scale();
      if (typeof UI !== 'undefined' && UI.stampSmall) {
        UI.stampSmall(m.wideShot ? 'CAMERA: THE WHOLE ROOM' : 'CAMERA: CLOSE IN');
      }
      return !m.wideShot;
    },
    /* the ?debug harness pokes these so a screenshot can catch the vermin */
    /* what the frame is actually rendering at, for the resolution probe */
    debugRes() {
      return { K, H, FOOT, down: lodFor(), oy, viewW: viewW(), viewH: viewH(),
        floorY: def ? def.floorY : null, roomW: def ? def.w : null };
    },
    debugRats(n) { for (let i = 0; i < (n || 1); i++) spawnRat(); },
    /* the harness compares the shot at both available scales */
    debugForceK(k) { forceK = k || 0; scale(); },
    /* the live gait, so a probe can prove the bounce is actually moving him
       rather than take a picture of one frame of it and guess */
    debugGait() {
      const g = gaitOf();
      return { hop: g.hop, squash: +(g.squash || 0).toFixed(4), tip: g.tip,
        walk: +me.walk.toFixed(3), v: Math.round(me.v) };
    },
    /* the harness asks what is under a point, so the egg rules can be
       asserted rather than eyeballed */
    debugPick(x, y) { return pick(x, y === undefined ? (def ? def.floorY - 10 : 100) : y); },
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

    /* ============================================================
       WHAT A CUTSCENE NEEDS FROM A ROOM.

       A cutscene in this game is a ROOM with a script over it, not
       a painted card: same rig, same lamps, same floor, same
       parallax, and the camera doing the work. Everything below is
       the handle a script needs to hold on it. See js/cut.js.
       ============================================================ */

    /* take the detective out of his own shot, or put him back */
    hideMe(v) { me.hidden = !!v; },
    /* pin his face and his near arm for a beat, or hand them back */
    meFace(k) { me.expr = k || null; },
    meArm(k) { me.arm = k || ''; },
    /* where his posed hand is, in room pixels, so a script can put a thing
       in it — the cigarette, the tray, the passport */
    meHand() {
      const back = me.faceZ < 0;
      const r = rig(SCENE.meDef(), me.frame, me.face, back,
        me.expr || 'neutral', me.arm);
      const h = r.cv.hand;
      if (!h) return null;
      const sc = scaleAt(me.z), w = r.w * sc, hh = r.h * sc;
      return { x: me.x - w / 2 + h.x * (w / r.cv.width),
        y: floorAt(me.z) - hh + h.y * (hh / r.cv.height) };
    },
    /* park him, facing whichever way, without a walk */
    place(x, face, z) {
      me.x = x; me.target = null; me.act = null; me.walk = 0; me.frame = 0;
      if (face) me.face = face;
      if (z !== undefined) { me.z = z; me.tz = null; }
    },
    /* somebody by id, so a script can talk about them by name */
    actor(id) { return (def && def.actors || []).find(a => a.id === id) || null; },
    /* send somebody walking, and tell me when they arrive */
    send(id, x, speed) {
      const a = typeof id === 'string' ? SCENE.actor(id) : id;
      if (!a) return Promise.resolve();
      a._goto = x; a._gspeed = speed || 26;
      return new Promise(res => { a._gthen = res; });
    },
    /* and the same for him: walk there, resolve when the feet stop */
    async meTo(x, z) {
      walkTo(x, z);
      for (let i = 0; i < 700; i++) {
        if (me.target === null) break;
        await U.sleep(28);
      }
      mark = null;
    },
    /* A HARD CUT, not a zoom. The world is drawn on an integer pixel
       grid: easing between scales would put him on half a pixel and
       turn the whole room to mush, so the close-up is a cut, which is
       what a cut is for. */
    cutIn(on) {
      forceK = on ? 6 : 3;
      scale();
      if (back && def) { back = paintBack(def); fore = def.fore ? paintFore(def) : null; }
    },
    cutFree() {
      forceK = 0; scale();
      if (def) { back = paintBack(def); fore = def.fore ? paintFore(def) : null; }
    },
  };
})();
