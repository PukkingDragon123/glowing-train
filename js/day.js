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
      lift: 'rgba(96,104,140,.30)',
      warm: 'rgba(255,190,150,.06)', cool: 'rgba(40,50,90,.20)',
      lit: '#b9b0a0', shade: '#8a8478', trim: '#6d6860',
      leaf: '#3c5a44', cloud: '#8e8ca8', keel: '#5a5878',
      lamps: true, birds: 1,
    },
    {
      id: 'morning', word: 'MORNING', from: 8 * 60,
      hi: '#5b8fd0', mid: '#93bde4', lo: '#d6e6f2',
      sun: '#fff6dc', sunY: 0.60, sunA: 0.13,
      shaftA: 0.30,
      lift: 'rgba(168,158,128,.54)',
      warm: 'rgba(255,244,214,.05)', cool: 'rgba(70,100,150,.13)',
      lit: '#e6ddc8', shade: '#b3ab99', trim: '#8d8676',
      leaf: '#4e7c4a', cloud: '#f4f6f8', keel: '#b9c6d4',
      lamps: false, birds: 3,
    },
    {
      id: 'midday', word: 'MIDDAY', from: 11 * 60,
      hi: '#4f8ada', mid: '#8dc0ec', lo: '#e4eef6',
      sun: '#ffffff', sunY: 0.16, sunA: 0.10,
      shaftA: 0.26,
      lift: 'rgba(176,170,146,.58)',
      warm: 'rgba(255,252,236,.04)', cool: 'rgba(60,90,140,.10)',
      lit: '#f2ead4', shade: '#bdb5a2', trim: '#96907f',
      leaf: '#5a8c4e', cloud: '#ffffff', keel: '#c8d4de',
      lamps: false, birds: 2,
    },
    {
      id: 'after', word: 'AFTERNOON', from: 14 * 60,
      hi: '#4d84c8', mid: '#9dc0dd', lo: '#f0e8d6',
      sun: '#fff2c8', sunY: 0.42, sunA: 0.13,
      shaftA: 0.34,
      lift: 'rgba(184,162,126,.56)',
      warm: 'rgba(255,236,196,.07)', cool: 'rgba(74,96,138,.12)',
      lit: '#f0e2c2', shade: '#b8ac95', trim: '#948b78',
      leaf: '#5d8848', cloud: '#fdf6ea', keel: '#c4c8ca',
      lamps: false, birds: 2,
    },
    {
      id: 'gold', word: 'GOLDEN HOUR', from: 16 * 60 + 30,
      hi: '#3f6fae', mid: '#c99a72', lo: '#ffd08a',
      sun: '#ffcf72', sunY: 0.78, sunA: 0.22,
      shaftA: 0.40,
      lift: 'rgba(176,124,80,.48)',
      warm: 'rgba(255,186,110,.13)', cool: 'rgba(90,70,120,.16)',
      lit: '#ffd9a2', shade: '#a98a78', trim: '#8a6d5e',
      leaf: '#6b8a3f', cloud: '#ffcfa0', keel: '#b07c72',
      lamps: false, birds: 4,
    },
    {
      id: 'dusk', word: 'DUSK', from: 18 * 60 + 30,
      hi: '#1e2a52', mid: '#4c4a78', lo: '#b4708a',
      sun: '#ff9a68', sunY: 0.93, sunA: 0.18,
      shaftA: 0.13,
      lift: 'rgba(74,72,104,.26)',
      warm: 'rgba(255,150,110,.09)', cool: 'rgba(38,44,84,.24)',
      lit: '#b49a94', shade: '#7a6c76', trim: '#5f5566',
      leaf: '#3f5a42', cloud: '#a08098', keel: '#5c4a68',
      lamps: true, birds: 2,
    },
    {
      id: 'dark', word: 'AFTER DARK', from: 20 * 60 + 30,
      hi: '#0b1024', mid: '#151c3a', lo: '#2b2f52',
      sun: '#dbe4ff', sunY: 0.22, sunA: 0.07,
      shaftA: 0,
      lift: 'rgba(30,36,64,.10)',
      warm: 'rgba(120,150,220,.04)', cool: 'rgba(14,18,44,.30)',
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

  function band() {
    const m = (typeof CITY !== 'undefined' && CITY.minutes) ? CITY.minutes() : 12 * 60;
    return bandAt(m);
  }

  /* how far through the current band we are, 0..1 — the sun slides
     across it instead of jumping at the boundary */
  function through() {
    const m = (typeof CITY !== 'undefined' && CITY.minutes) ? CITY.minutes() : 12 * 60;
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

  /* a stepped ramp between two colours, with a dither row on each seam */
  function ramp(c, x, y, w, h, top, bot, steps) {
    const n = Math.max(2, steps || 7);
    const a = hex(top), b = hex(bot);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const y0 = y + Math.round((i / n) * h);
      const y1 = y + Math.round(((i + 1) / n) * h);
      px(c, x, y0, w, Math.max(1, y1 - y0), rgb(mix(a, b, t)));
      /* the dither: every other pixel of the seam takes the step below,
         so the joins read as texture instead of as banding */
      if (i && y1 - y0 > 1) {
        const d = rgb(mix(a, b, (i - 0.5) / (n - 1)));
        for (let k = (i % 2); k < w; k += 2) px(c, x + k, y0, 1, 1, d);
      }
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
    ramp(c, x, y, w, Math.round(h * 0.55), hi, mi, 6);
    ramp(c, x, y + Math.round(h * 0.55), w, h - Math.round(h * 0.55), mi, lo, 7);

    /* THE SUN. Its height is the band's, walked across the band, and it
       blooms in stepped rings rather than a radial gradient. */
    const sy = y + Math.round(h * U.clamp(b.sunY + (nb.sunY - b.sunY) * t * 0.5, 0.04, 0.97));
    const sx = x + Math.round(w * (0.18 + 0.62 * ((b.from / 60 + t * 2) % 12) / 12));
    if (b.sunA > 0.02) {
      /* THE BLOOM IS RINGS, NOT RECTS. Stacked rectangles round a sun
         read as a white bar with a lump in it — the first pass at this
         looked like a logo somebody had pasted on the sky. Discs. */
      for (let r = 30; r > 7; r -= 3) {
        PIX.disc(c, sx, sy, r,
          'rgba(255,242,206,' + (b.sunA * (1 - r / 34) * 0.32).toFixed(3) + ')');
      }
      PIX.disc(c, sx, sy, 6, 'rgba(255,248,222,' + Math.min(0.85, b.sunA * 2.6).toFixed(3) + ')');
      PIX.disc(c, sx, sy, 4, b.sun);
    }

    /* TWO BANKS OF CLOUD, the far one slower, both wrapped so a wide
       view never runs out of sky. Weather thickens them. */
    const wx = (typeof CITY !== 'undefined' && CITY.sky) ? CITY.sky() : { drops: 0 };
    const thick = 1 + Math.min(1.4, (wx.drops || 0) * 0.55);
    for (let lane = 0; lane < 2; lane++) {
      const span = 150 + lane * 90;
      const drift = (tt * (2.4 + lane * 3.1)) % span;
      const cy = y + Math.round(h * (lane ? 0.30 : 0.14));
      const cw = Math.round((lane ? 40 : 58) * thick);
      const ch = Math.round((lane ? 8 : 12) * thick);
      const body = lane ? b.keel : b.cloud;
      const crown = lane ? b.cloud : '#ffffff';
      for (let k = -1; k * span < w + span; k++) {
        const jig = ((s + k * 37 + lane * 11) % 23) - 11;
        cloud(c, x + Math.round(k * span - drift + span * 0.4), cy + jig,
          cw + (jig % 7) * 2, ch, body, crown, b.keel);
      }
    }

    /* BIRDS. Three pixels each, which is all a bird is at this distance. */
    for (let i = 0; i < b.birds; i++) {
      const bx = x + Math.round(((i * 137 + s * 13) % 100) / 100 * w + tt * (9 + i * 3)) % (w + 40) - 20;
      const by = y + Math.round(h * (0.10 + ((i * 29 + s) % 40) / 100));
      const flap = Math.sin(tt * 6 + i) > 0 ? 1 : 0;
      px(c, bx, by, 1, 1, 'rgba(30,34,50,.55)');
      px(c, bx - 2, by - flap, 2, 1, 'rgba(30,34,50,.45)');
      px(c, bx + 1, by - flap, 2, 1, 'rgba(30,34,50,.45)');
    }
  }

  /* ---------------------------------------------------------
     THE WASH.

     One pass over the whole room per frame. Warm light from the
     sun's side, the hour's shadow colour everywhere, and — at
     golden hour, which is the point of the whole thing — a band
     of low sun raking across the bottom of the frame.
     --------------------------------------------------------- */
  function wash(c, x, y, w, h, indoor) {
    const b = band();
    /* ============================================================
       THE LIFT, and only indoors.

       The five working stops were painted for a night shift: a laundry
       at eleven at night is nearly black, and no amount of warm tint
       laid ON TOP of black makes it daylight — additive tinting a dark
       room just makes a dark room with a colour cast.

       So indoors gets one SCREEN pass first, which is the one blend a
       2d context will do for us that actually raises a black. That
       turns the cellar into a room with the shutters open, and then the
       normal grade puts the hour back on top of it.
       ============================================================ */
    if (indoor && b.lift) {
      const prev = c.globalCompositeOperation;
      c.globalCompositeOperation = 'screen';
      px(c, x, y, w, h, b.lift);
      c.globalCompositeOperation = prev;
    }
    if (b.cool) px(c, x, y, w, h, b.cool);
    if (b.warm) px(c, x, y, w, h, b.warm);
    if (b.id === 'gold' || b.id === 'dusk') {
      /* the rake: brighter at the bottom, in steps */
      for (let i = 0; i < 10; i++) {
        const a = (b.id === 'gold' ? 0.030 : 0.020) * (i / 9);
        px(c, x, y + h - Math.round(h * 0.42) + Math.round(i * h * 0.042), w,
          Math.max(1, Math.round(h * 0.042)),
          'rgba(255,' + (b.id === 'gold' ? 186 : 140) + ',110,' + a.toFixed(3) + ')');
      }
    }
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
    sky, wash, shaft, ramp, cloud, mix, hex, rgb,
    /* the word for the corner of the screen */
    word() { return band().word; },
    is(id) { return band().id === id; },
  };
})();
