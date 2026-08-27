/* ============================================================
   SHELL & DEBT — day.js
   THE LIGHT.

   This used to be a night game. Every room was painted its own
   private black and the clock in the corner was the only way to
   know the hour. Now the hour is the loudest thing on screen:
   the shift opens at nine in the morning and closes at seven in
   the evening, and in between the sky walks from a cold blue
   morning through a white noon into gold and then into dusk.

   That is a clock you can read without reading, and it is the
   only clock that matters, because the light going orange means
   you have run out of afternoon.

   WHAT LIVES HERE
     BANDS      six named times of day, each with a full palette
     band()     which one it is, from CITY's clock
     sky()      the sky itself: gradient, cloud banks, sun, birds
     wash()     the grade a room gets laid over it, per frame
     pal()      the stone/leaf/awning colours for right now
     lamps()    whether the street lamps are on

   EVERYTHING IS STEPPED. A gradient here is a stack of 1px rects
   with a dither row between them, never a canvas gradient: this
   game is pixels and a smooth ramp reads as a bug.
   ============================================================ */

const DAY = (() => {

  const px = (c, x, y, w, h, col) => ART.px(c, x, y, w, h, col);

  /* ---------------------------------------------------------
     THE BANDS.

     `from` is minutes past midnight. Each carries everything
     anybody downstream needs, so nothing has to guess:

       hi/mid/lo  the sky, top to horizon
       sun        the disc, its height as a fraction of the sky,
                  and how hard it blooms
       warm/cool  the wash over the room: a warm multiply-ish
                  pass and the colour its shadows go
       lit/shade  Paris limestone in the sun and out of it —
                  every building in the game reads these
       leaf       what a plane tree is this hour
       cloud/keel the body of a cloud and its underside
       lamps      street lamps burning
     --------------------------------------------------------- */
  const BANDS = [
    {
      id: 'first', word: 'FIRST LIGHT', from: 5 * 60,
      hi: '#2c3a63', mid: '#6a6a92', lo: '#c99a86',
      sun: '#ffd9a8', sunY: 0.86, sunA: 0.16,
      shaftA: 0.05,
      warm: 'rgba(255,190,150,0.035)', cool: 'rgba(40,50,90,0.045)',
      rake: 0,
      castWarm: 'rgba(255,190,150,.03)', castCool: 'rgba(40,50,90,.07)',
      lit: '#b9b0a0', shade: '#8a8478', trim: '#6d6860',
      leaf: '#3c5a44', cloud: '#8e8ca8', keel: '#5a5878',
      lamps: true, birds: 1,
    },
    {
      id: 'morning', word: 'MORNING', from: 8 * 60,
      hi: '#5b8fd0', mid: '#93bde4', lo: '#d6e6f2',
      sun: '#fff6dc', sunY: 0.60, sunA: 0.13,
      shaftA: 0.30,
      warm: 'rgba(255,246,220,0.035)', cool: 'rgba(70,100,150,0.045)',
      rake: 0,
      castWarm: 'rgba(255,246,220,.03)', castCool: 'rgba(70,100,150,.03)',
      lit: '#e6ddc8', shade: '#b3ab99', trim: '#8d8676',
      leaf: '#4e7c4a', cloud: '#f4f6f8', keel: '#b9c6d4',
      lamps: false, birds: 3,
    },
    {
      id: 'midday', word: 'MIDDAY', from: 11 * 60,
      hi: '#4f8ada', mid: '#8dc0ec', lo: '#e4eef6',
      sun: '#ffffff', sunY: 0.16, sunA: 0.10,
      shaftA: 0.26,
      warm: 'rgba(255,253,240,0.035)', cool: 'rgba(60,90,140,0.030)',
      rake: 0,
      castWarm: 'rgba(255,253,240,.03)', castCool: 'rgba(60,90,140,.02)',
      lit: '#f2ead4', shade: '#bdb5a2', trim: '#96907f',
      leaf: '#5a8c4e', cloud: '#ffffff', keel: '#c8d4de',
      lamps: false, birds: 2,
    },
    {
      id: 'after', word: 'AFTERNOON', from: 14 * 60,
      hi: '#4d84c8', mid: '#9dc0dd', lo: '#f0e8d6',
      sun: '#fff2c8', sunY: 0.42, sunA: 0.13,
      shaftA: 0.34,
      warm: 'rgba(255,238,200,0.035)', cool: 'rgba(74,96,138,0.040)',
      rake: 0.012,
      castWarm: 'rgba(255,238,200,.04)', castCool: 'rgba(74,96,138,.02)',
      lit: '#f0e2c2', shade: '#b8ac95', trim: '#948b78',
      leaf: '#5d8848', cloud: '#fdf6ea', keel: '#c4c8ca',
      lamps: false, birds: 2,
    },
    {
      id: 'gold', word: 'GOLDEN HOUR', from: 16 * 60 + 30,
      hi: '#3f6fae', mid: '#c99a72', lo: '#ffd08a',
      sun: '#ffcf72', sunY: 0.78, sunA: 0.22,
      shaftA: 0.40,
      warm: 'rgba(255,190,116,0.035)', cool: 'rgba(90,70,120,0.045)',
      rake: 0.026,
      castWarm: 'rgba(255,190,116,.07)', castCool: 'rgba(90,70,120,.04)',
      lit: '#ffd9a2', shade: '#a98a78', trim: '#8a6d5e',
      leaf: '#6b8a3f', cloud: '#ffcfa0', keel: '#b07c72',
      lamps: false, birds: 4,
    },
    {
      id: 'dusk', word: 'DUSK', from: 18 * 60 + 30,
      hi: '#1e2a52', mid: '#4c4a78', lo: '#b4708a',
      sun: '#ff9a68', sunY: 0.93, sunA: 0.18,
      shaftA: 0.13,
      warm: 'rgba(255,155,115,0.035)', cool: 'rgba(38,44,84,0.045)',
      rake: 0.018,
      castWarm: 'rgba(255,155,115,.05)', castCool: 'rgba(38,44,84,.09)',
      lit: '#b49a94', shade: '#7a6c76', trim: '#5f5566',
      leaf: '#3f5a42', cloud: '#a08098', keel: '#5c4a68',
      lamps: true, birds: 2,
    },
    {
      id: 'dark', word: 'AFTER DARK', from: 20 * 60 + 30,
      hi: '#0b1024', mid: '#151c3a', lo: '#2b2f52',
      sun: '#dbe4ff', sunY: 0.22, sunA: 0.07,
      shaftA: 0,
      warm: 'rgba(120,150,220,0.030)', cool: 'rgba(14,18,44,0.045)',
      rake: 0,
      castWarm: 'rgba(120,150,220,.02)', castCool: 'rgba(14,18,44,.14)',
      lit: '#6f6f7e', shade: '#4a4a58', trim: '#3a3a46',
      leaf: '#26382c', cloud: '#2a3050', keel: '#181d34',
      lamps: true, birds: 0,
    },
  ];

  const byId = {};
  BANDS.forEach(b => { byId[b.id] = b; });

  /* ---------------------------------------------------------
     WHICH HOUR IT IS.

     The bands are a ring: 'dark' runs over midnight into
     'first', so the lookup walks backwards from the latest band
     that has already started and falls through to the last one.
     --------------------------------------------------------- */
  function bandAt(minutes) {
    const m = ((minutes | 0) % (24 * 60) + 24 * 60) % (24 * 60);
    for (let i = BANDS.length - 1; i >= 0; i--) if (m >= BANDS[i].from) return BANDS[i];
    return BANDS[BANDS.length - 1];           // before first light: still dark
  }

  /* ============================================================
     A CUTSCENE CAN PIN THE HOUR.

     The light is normally the shift clock, which is right while you
     are working and wrong for a story beat: the prologue is a warm
     morning six years ago and the house he comes home to is the
     middle of the night, and neither of them cares what time it is
     on the case you have not started yet. Pin it, play the scene,
     unpin it. See js/cut.js.
     ============================================================ */
  let pinned = null;

  function now() {
    if (pinned !== null) return pinned;
    return (typeof CITY !== 'undefined' && CITY.minutes) ? CITY.minutes() : 12 * 60;
  }

  function band() {
    return bandAt(now());
  }

  /* how far through the current band we are, 0..1 — the sun slides
     across it instead of jumping at the boundary */
  function through() {
    const m = now();
    const b = bandAt(m);
    const i = BANDS.indexOf(b);
    const next = BANDS[(i + 1) % BANDS.length];
    let span = next.from - b.from;
    if (span <= 0) span += 24 * 60;
    let into = m - b.from;
    if (into < 0) into += 24 * 60;
    return U.clamp(into / span, 0, 1);
  }

  /* the band one step on, for anything that wants to blend toward it */
  function nextBand() {
    const i = BANDS.indexOf(band());
    return BANDS[(i + 1) % BANDS.length];
  }

  function pal() { return band(); }
  function lamps() { return !!band().lamps; }

  /* ---------------------------------------------------------
     THE SKY.

     Drawn in screen space, because the sky is at infinity and
     must not scroll with the room. Three stops dithered into
     each other, two banks of cloud at different rates, the sun
     with a stepped bloom, and birds if the hour has any.
     --------------------------------------------------------- */

  /* COLOUR, AS THREE NUMBERS. Everything in here works on [r,g,b]
     triples and only turns them into a string at the moment of
     painting — mixing strings is how you end up passing 'rgb(9,9,9)'
     to something that wanted '#090909'. */
  function hex(h) {
    if (Array.isArray(h)) return h;
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b);
    return [
      Math.round(A[0] + (B[0] - A[0]) * t),
      Math.round(A[1] + (B[1] - A[1]) * t),
      Math.round(A[2] + (B[2] - A[2]) * t),
    ];
  }
  function rgb(a) { const c = hex(a); return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }

  /* ============================================================
     A RAMP.

     ONE STEP PER ROW, no dither. The first version drew half a
     dozen fat bands and then ran a checker along each seam, which
     at two hundred rows tall and four hundred wide came out as a
     stack of stripes with a dotted line under each one — banding
     with extra steps. A row at a time is both simpler and smooth:
     two hundred rows is two hundred shades, which is more than
     the eye can pick apart, and there is no seam to hide.
     ============================================================ */
  function ramp(c, x, y, w, h, top, bot) {
    const a = hex(top), b = hex(bot);
    const n = Math.max(1, Math.round(h));
    for (let i = 0; i < n; i++) {
      px(c, x, y + i, w, 1, rgb(mix(a, b, i / Math.max(1, n - 1))));
    }
  }

  /* CLOUDS. Stacked lozenges: a body, a lit crown along the top and a
     keel underneath, so they have a light direction instead of being
     grey blobs. Seeded off their own index so they never flicker. */
  function cloud(c, cx, cy, w, h, body, crown, keel) {
    /* SIX OVERLAPPING DISCS ON A FLAT BASE.

       The first pass at this stacked four rectangles and then ruled a
       one-pixel line the full width underneath them, which is a
       beautifully efficient way of drawing a bar with lumps on it. A
       cloud is round on top and flat on the bottom, and the flat bottom
       has to follow the lumps, not cut across them. */
    const n = 6;
    const base = Math.round(cy + h * 0.5);
    const lobes = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      /* a hump: biggest a third of the way in, so it leans like weather */
      const hump = Math.sin(Math.pow(t, 0.8) * Math.PI);
      const r = Math.max(2, Math.round((h * 0.42 + w * 0.05) * (0.42 + hump)));
      const lx = Math.round(cx - w / 2 + w * t);
      lobes.push({ x: lx, y: base - Math.round(r * 0.72), r });
    }
    /* the body */
    lobes.forEach(l => PIX.disc(c, l.x, l.y, l.r, body));
    /* flatten the underside: everything below the base line goes away is
       not something a 2d context will do for us, so the base is simply
       painted back in as the cloud's own floor, lobe by lobe */
    lobes.forEach(l => px(c, l.x - l.r, base, l.r * 2, 2, body));
    /* the crown, on the sunward top of each lobe */
    lobes.forEach(l => {
      PIX.disc(c, l.x, l.y - 1, l.r - 1, crown);
      PIX.disc(c, l.x + 1, l.y + 1, l.r - 1, body);
    });
    /* and the keel it sits on */
    lobes.forEach(l => px(c, l.x - l.r, base + 1, l.r * 2, 1, keel));
  }

  /* the whole sky, into a rect of screen space */
  function sky(c, x, y, w, h, T, seed) {
    if (h <= 0 || w <= 0) return;
    const b = band(), t = through(), nb = nextBand();
    const s = (seed || 0) + 7;
    const tt = T || 0;

    /* the ramp, nudged toward the next hour so the change creeps in */
    const hi = mix(hex(b.hi), hex(nb.hi), t * 0.45);
    const mi = mix(hex(b.mid), hex(nb.mid), t * 0.45);
    const lo = mix(hex(b.lo), hex(nb.lo), t * 0.45);
    const split = Math.round(h * 0.58);
    ramp(c, x, y, w, split, hi, mi);
    ramp(c, x, y + split, w, h - split, mi, lo);

    /* THE SUN. Its height is the band's, walked across the band, and it
       blooms in stepped rings rather than a radial gradient. */
    const sy = y + Math.round(h * U.clamp(b.sunY + (nb.sunY - b.sunY) * t * 0.5, 0.04, 0.97));
    const sx = x + Math.round(w * (0.18 + 0.62 * ((b.from / 60 + t * 2) % 12) / 12));
    if (b.sunA > 0.02) {
      /* THE SUN SCALES WITH THE SKY IT IS IN. At a fixed four-pixel radius
         it was a pinhead in a two-hundred-row sky. And the bloom is RINGS,
         not stacked rectangles — the first pass at that read as a logo
         somebody had pasted on. */
      const R = Math.max(4, Math.round(h * 0.032));
      for (let r = R * 6; r > R; r -= Math.max(1, Math.round(R * 0.4))) {
        PIX.disc(c, sx, sy, r,
          'rgba(255,242,206,' + (b.sunA * (1 - r / (R * 7)) * 0.26).toFixed(3) + ')');
      }
      PIX.disc(c, sx, sy, Math.round(R * 1.5),
        'rgba(255,248,222,' + Math.min(0.8, b.sunA * 2.2).toFixed(3) + ')');
      PIX.disc(c, sx, sy, R, b.sun);
      /* and the little bright core, so it is not a flat disc */
      PIX.disc(c, sx, sy, Math.max(1, Math.round(R * 0.45)), '#ffffff');
    }

    /* TWO BANKS OF CLOUD, the far one slower, both wrapped so a wide
       view never runs out of sky. Weather thickens them. */
    const wx = (typeof CITY !== 'undefined' && CITY.sky) ? CITY.sky() : { drops: 0 };
    const thick = 1 + Math.min(1.4, (wx.drops || 0) * 0.55);
    /* THREE BANKS, and every measurement in them comes off the height of
       the sky rather than a constant: at two hundred rows the old
       fixed-size clouds were a row of dumplings along the top. */
    const U0 = Math.max(6, h * 0.075);            // the unit a cloud is built from
    for (let lane = 0; lane < 3; lane++) {
      const span = Math.round(U0 * (10 + lane * 5));
      const drift = (tt * (1.6 + lane * 2.4)) % span;
      const cy = y + Math.round(h * (0.10 + lane * 0.17));
      const cw = Math.round(U0 * (5.6 - lane * 1.2) * thick);
      const ch = Math.round(U0 * (1.5 - lane * 0.28) * thick);
      /* the far bank is hazier: it takes the keel colour as its body */
      const body = lane === 2 ? b.keel : b.cloud;
      const crown = lane === 0 ? '#ffffff' : b.cloud;
      for (let k = -1; k * span < w + span; k++) {
        const jig = ((s + k * 37 + lane * 11) % 23) - 11;
        cloud(c, x + Math.round(k * span - drift + span * 0.4),
          cy + Math.round(jig * U0 * 0.14),
          cw + (jig % 7) * Math.round(U0 * 0.2), ch, body, crown, b.keel);
      }
    }

    /* BIRDS. Three pixels each, which is all a bird is at this distance. */
    for (let i = 0; i < b.birds * 2; i++) {
      const bx = x + Math.round(((i * 137 + s * 13) % 100) / 100 * w + tt * (9 + i * 3)) % (w + 40) - 20;
      const by = y + Math.round(h * (0.08 + ((i * 29 + s) % 46) / 100));
      const flap = Math.sin(tt * 6 + i) > 0 ? 1 : 0;
      const bw2 = 1 + (i % 2);
      px(c, bx, by, bw2, 1, 'rgba(30,34,50,.60)');
      px(c, bx - bw2 * 2, by - flap, bw2 * 2, 1, 'rgba(30,34,50,.50)');
      px(c, bx + bw2, by - flap, bw2 * 2, 1, 'rgba(30,34,50,.50)');
    }
  }

  /* ---------------------------------------------------------
     THE WASH.

     One pass over the whole room per frame. Warm light from the
     sun's side, the hour's shadow colour everywhere, and — at
     golden hour, which is the point of the whole thing — a band
     of low sun raking across the bottom of the frame.
     --------------------------------------------------------- */
  /* ============================================================
     BAKE — the hour, painted INTO a room, once.

     This used to be a per-frame wash over the whole frame: a screen
     pass at fifty-five percent to lift the night-painted interiors,
     then a cool and a warm on top. Three translucent sheets over
     everything, every frame, and the result was exactly what it
     sounds like — a light filter laid over the game, flattening
     every contrast in it.

     A room is repainted whenever you walk into it and whenever the
     hour turns over, so the honest place for all of that is the
     paint itself. Baked in, the pixels ARE the hour: full contrast,
     no sheet, nothing between the art and the screen.

     The one hard part is that a room canvas is TRANSPARENT where
     the sky shows through, and a blend mode against nothing paints
     the sky. So the original is kept as a mask and stamped back
     over the result with destination-in at the end, which restores
     every transparent pixel exactly.
     ============================================================ */
  function bake(cv, indoor) {
    const b = band();
    const c = cv.getContext('2d');
    if (!c) return;
    /* the mask: what was actually painted */
    const mask = document.createElement('canvas');
    mask.width = cv.width; mask.height = cv.height;
    const mc = mask.getContext('2d');
    mc.imageSmoothingEnabled = false;
    mc.drawImage(cv, 0, 0);

    c.save();
    c.imageSmoothingEnabled = false;
    /* ============================================================
       NO LIFT. THIS WAS THE BRIGHTNESS FILTER OVER EVERYTHING.

       There used to be a `screen` pass here, laying a mid-grey over
       every interior to raise its blacks, on the argument that the
       five working stops were painted for a night shift and needed
       dragging into daylight.

       Measured, on the bar: the room as authored has a mean pixel
       of 37, 31, 28 — proper noir. After this function ran it was
       84, 80, 73. MORE THAN TWICE AS BRIGHT, and the screen pass
       was most of it: plus thirty-nine red, plus thirty-nine
       green, plus thirty-three blue over every pixel that had
       anything painted on it.

       That is a brightness filter. It was not laid over the frame
       so it did not show up when the frame was measured, it was
       baked into the art, which is worse: it could not be turned
       off and it flattened every shadow the rooms were drawn with.

       The art was right all along. This game is a mafia story in
       a city at night, the rooms are lit by their own lamps, and
       the hour is a WHISPER of colour temperature over the top —
       a few per cent, not a doubling.
       ============================================================ */
    c.globalCompositeOperation = 'source-over';
    if (b.cool) px(c, 0, 0, cv.width, cv.height, b.cool);
    if (b.warm) px(c, 0, 0, cv.width, cv.height, b.warm);
    /* and the low sun raking the bottom of the room */
    if (b.rake) {
      const h = cv.height;
      for (let i = 0; i < 12; i++) {
        const a = b.rake * (i / 11);
        px(c, 0, h - Math.round(h * 0.34) + Math.round(i * h * 0.028),
          cv.width, Math.max(1, Math.round(h * 0.028)),
          'rgba(255,' + (b.id === 'gold' ? 186 : 150) + ',110,' + a.toFixed(3) + ')');
      }
    }
    /* put the transparency back */
    c.globalCompositeOperation = 'destination-in';
    c.drawImage(mask, 0, 0);
    c.restore();
  }

  /* ============================================================
     WASH — what is left of it.

     The room carries the hour in its own pixels now. What still
     needs telling is the CAST: sprites are cached band-agnostic,
     so without a whisper of the hour over them a frog at six in
     the evening is lit like a frog at noon. A whisper is all it
     is — a fifth of what this used to be.
     ============================================================ */
  function wash(c, x, y, w, h) {
    const b = band();
    if (b.castCool) px(c, x, y, w, h, b.castCool);
    if (b.castWarm) px(c, x, y, w, h, b.castWarm);
  }

  /* ---------------------------------------------------------
     THE SHAFT.

     A window is not daylight. Daylight is what the window
     THROWS: a slab of warm air leaning across the room and a
     bright patch of floor at the end of it, with dust turning
     over inside it. This is the single thing that tells you an
     interior is happening in the afternoon.

     `win` is the opening in room space, `floorY` the floor it
     lands on, `T` the clock so the dust drifts.
     --------------------------------------------------------- */
  function shaft(c, win, floorY, T, seed) {
    const b = band();
    if (!b.shaftA) return;
    const wet = (typeof CITY !== 'undefined' && CITY.sky) ? CITY.sky().drops : 0;
    const a = b.shaftA * (wet > 1 ? 0.35 : wet > 0.5 ? 0.6 : 1);
    if (a < 0.01) return;
    /* the sun is over on one side, so the shaft leans */
    const lean = b.from >= 14 * 60 ? -1 : 1;
    const x0 = win.x, x1 = win.x + win.w;
    const drop = Math.max(6, floorY - (win.y + win.h));
    const run = Math.round(drop * 0.9);
    /* the slab, in stepped slices so it stays pixels */
    const steps = Math.max(4, Math.round(drop / 3));
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const y = Math.round(win.y + win.h + t * drop);
      const off = Math.round(lean * t * run);
      const fade = (1 - t * 0.45) * a;
      px(c, x0 + off, y, x1 - x0, Math.max(1, Math.round(drop / steps)),
        'rgba(255,244,206,' + fade.toFixed(3) + ')');
      /* the two bright edges of it */
      px(c, x0 + off, y, 1, Math.max(1, Math.round(drop / steps)),
        'rgba(255,250,228,' + (fade * 1.5).toFixed(3) + ')');
      px(c, x1 + off - 1, y, 1, Math.max(1, Math.round(drop / steps)),
        'rgba(255,250,228,' + (fade * 1.2).toFixed(3) + ')');
    }
    /* THE PATCH OF FLOOR at the end of it, which is the brightest thing
       in the room and the reason the room reads as daytime */
    const fx = x0 + Math.round(lean * run);
    px(c, fx, floorY - 2, x1 - x0, 4, 'rgba(255,246,212,' + (a * 1.9).toFixed(3) + ')');
    px(c, fx + 2, floorY, x1 - x0 - 4, 3, 'rgba(255,250,226,' + (a * 1.3).toFixed(3) + ')');
    /* AND THE DUST TURNING OVER IN IT. Twelve motes on their own slow
       loops: without these a shaft is a triangle of paint. */
    const s2 = (seed || 0) + 3;
    for (let i = 0; i < 14; i++) {
      const ph = ((s2 + i * 37) % 100) / 100;
      const t = (ph + T * 0.055 * (0.5 + ((i % 5) / 5))) % 1;
      const y = Math.round(win.y + win.h + t * drop);
      const wob = Math.sin(T * 0.9 + i * 1.7) * ((x1 - x0) * 0.42);
      const x = Math.round(x0 + (x1 - x0) / 2 + wob + lean * t * run);
      px(c, x, y, 1, 1, 'rgba(255,252,232,' + (0.55 * (1 - t * 0.5)).toFixed(2) + ')');
    }
  }

  /* ---------------------------------------------------------
     WHAT THE SUN DOES TO A THING STANDING IN IT.

     Two helpers the builders use so every wall in the city
     agrees about where the light is coming from. Light comes
     from the sun's side of the sky, which after noon is the
     right, so a west face is lit and an east face is not.
     --------------------------------------------------------- */
  function side() { return band().sunY > 0.5 && band().from >= 14 * 60 ? -1 : 1; }

  /* the four tones of a lit facade, for anything made of stone */
  function stone() {
    const b = band();
    return { lit: b.lit, mid: rgb(mix(b.lit, b.shade, 0.45)), shade: b.shade, trim: b.trim };
  }

  return {
    BANDS, byId,
    bandAt, band, nextBand, through, pal, lamps, side, stone,
    /* hold the hour for a scene, then give it back to the clock */
    pin(minutes) { pinned = minutes === null || minutes === undefined ? null : (minutes | 0); },
    unpin() { pinned = null; },
    pinned() { return pinned; },
    sky, wash, bake, shaft, ramp, cloud, mix, hex, rgb,
    /* the word for the corner of the screen */
    word() { return band().word; },
    is(id) { return band().id === id; },
  };
})();
