'use strict';
/* ============================================================
   SHELL & DEBT — art.js
   THE PROP SHOP.

   Everything a room is furnished with, drawn here. Two kinds of
   asset live in this file:

     1. PAINTED ART — hand-authored pixel maps, one character per
        pixel, the way you'd draw them on paper. Small hero props
        (the typewriter, the wall clock, the coffee machine) are
        drawn pixel by pixel because that is the only way they
        read as objects instead of boxes.

     2. BUILT ART — furniture that has to come in arbitrary sizes
        (desks, counters, beds, cabinets) is assembled from a
        shading kit: ink outline, top light, bottom shadow, wood
        grain, dither, rivets, wear. Same look, any dimension.

   Nothing here is a flat rectangle. Every surface gets a light
   side, a dark side, and something on it.
   ============================================================ */

const ART = (() => {

  const CACHE = {};

  function cv(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return { cv: c, c: x };
  }

  function cached(key, fn) {
    if (!CACHE[key]) CACHE[key] = fn();
    return CACHE[key];
  }

  const px = (c, x, y, w, h, col) => {
    if (!col || w <= 0 || h <= 0) return;
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  /* ---------- the shading kit ---------- */

  /* A box with a light edge, a dark edge and an ink line — the
     single most useful thing in the file. */
  function box(c, x, y, w, h, o) {
    o = o || {};
    const ink = o.ink === undefined ? PIX.PAL.K : o.ink;
    if (ink) px(c, x, y, w, h, ink);
    const i = o.ink === null ? 0 : 1;
    const fw = w - i * 2, fh = h - i * 2;
    if (o.fill) px(c, x + i, y + i, fw, fh, o.fill);
    if (o.top) px(c, x + i, y + i, fw, o.topH || 1, o.top);
    if (o.bot) px(c, x + i, y + h - i - (o.botH || 1), fw, o.botH || 1, o.bot);
    if (o.left) px(c, x + i, y + i, o.leftW || 1, fh, o.left);
    if (o.right) px(c, x + w - i - (o.rightW || 1), y + i, o.rightW || 1, fh, o.right);
  }

  /* stipple: the difference between "a colour" and "a material" */
  function dither(c, x, y, w, h, col, density, seed) {
    const rng = U.mulberry32(seed || 7);
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        if (rng() < (density || 0.18)) px(c, x + xx, y + yy, 1, 1, col);
      }
    }
  }

  /* wood: long grain lines with knots, never the same twice */
  function grain(c, x, y, w, h, dark, light, seed) {
    const rng = U.mulberry32(seed || 11);
    for (let i = 0; i < Math.max(2, Math.round(h / 3)); i++) {
      const gy = y + Math.floor(rng() * h);
      let gx = x + Math.floor(rng() * 4);
      while (gx < x + w) {
        const run = 2 + Math.floor(rng() * 7);
        px(c, gx, gy, Math.min(run, x + w - gx), 1, rng() < 0.35 ? light : dark);
        gx += run + 1 + Math.floor(rng() * 3);
      }
    }
  }

  /* bolts along an edge, for anything institutional */
  function rivets(c, x, y, n, step, col, hi) {
    for (let i = 0; i < n; i++) {
      px(c, x + i * step, y, 2, 2, col);
      px(c, x + i * step, y, 1, 1, hi || PIX.PAL.W);
    }
  }

  /* ============================================================
     PAINTED ART — hand-drawn pixel maps.
     Letters are palette keys from PIX.PAL unless the map
     overrides them with a hex string.
     ============================================================ */

  const MAPS = {};

  function paint(name, rows, map) {
    MAPS[name] = { rows: rows.filter(r => r !== undefined), map: map || {} };
  }

  function art(name, k) {
    k = k || 1;
    return cached('art:' + name + '@' + k, () => {
      const d = MAPS[name];
      if (!d) return cv(1, 1).cv;
      const w = Math.max(...d.rows.map(r => r.length));
      const h = d.rows.length;
      const o = cv(w * k, h * k);
      for (let y = 0; y < h; y++) {
        const row = d.rows[y];
        for (let x = 0; x < row.length; x++) {
          const ch = row[x];
          if (ch === '.' || ch === ' ') continue;
          const v = d.map[ch];
          const col = v !== undefined ? (PIX.PAL[v] || v) : PIX.PAL[ch];
          if (col) px(o.c, x * k, y * k, k, k, col);
        }
      }
      return o.cv;
    });
  }

  /* ---- the typewriter on the bullpen desk ---- */
  paint('typewriter', [
    '....KKKKKKKKKK....',
    '...KWWWWWWWWWWK...',
    '..KWKKKKKKKKKKWK..',
    '..KWK::::::::KWK..',
    '..KWK::::::::KWK..',
    '.KKWKKKKKKKKKKWKK.',
    '.KSSSSSSSSSSSSSSK.',
    'KSssssssssssssssSK',
    'KSoOoOoOoOoOoOoOSK',
    'KSssssssssssssssSK',
    'KSoOoOoOoOoOoOoOSK',
    'KSssssssssssssssSK',
    '.KKKKKKKKKKKKKKKK.',
  ], { ':': '#2a3140', 'o': 'q', 'O': 'W' });

  /* ---- the wall clock nobody winds ---- */
  paint('wallclock', [
    '...KKKKKKK...',
    '..KUUUUUUUK..',
    '.KUbbbbbbbUK.',
    'KUbWWWWWWWbUK',
    'KUbWKqWqKWWbK',
    'KUbWqKqKqWWbK',
    'KUbWWqKKWWWbK',
    'KUbWWKqqWWWbK',
    'KUbWWWqWWWWbK',
    'KUbWWWWWWWbUK',
    '.KUbbbbbbbUK.',
    '..KUUUUUUUK..',
    '...KKKKKKK...',
  ], {});

  /* ---- the percolator that has been on since Tuesday ---- */
  paint('coffee', [
    '..KKKKKKKKK..',
    '.KTTTTTTTTTK.',
    '.KTSSSSSSSTK.',
    '.KTSttttSSTK.',
    '.KTSttttSSTK.',
    '.KTTTTTTTTTK.',
    '.KTdddddTTTK.',
    '.KTdRRRdTTTK.',
    '.KTdRRRdTTTK.',
    '.KTdddddTTTK.',
    '.KTTTTTTTTTK.',
    '.KKKKKKKKKKK.',
    '..KsssssssK..',
  ], {});

  /* ---- desk telephone, the kind with a cradle ---- */
  paint('phone', [
    '.KKKKKKKKKK.',
    'KZZZZZZZZZZK',
    'KZKKKKKKKKZK',
    'KZKTTTTTTKZK',
    'KZKTsssSTKZK',
    'KZKTTTTTTKZK',
    'KKKKKKKKKKKK',
    'KZZZZZZZZZZK',
    'KZqZZZZZZqZK',
    '.KKKKKKKKKK.',
  ], {});

  /* ---- a stack of case files, spines out ---- */
  paint('files', [
    '..KKKKKKKKKKK..',
    '.KwwwwwwwwwwwK.',
    '.KwKKKKKKKKKwK.',
    'KWWWWWWWWWWWWWK',
    'KWKdKKKKKKKKKWK',
    'KqqqqqqqqqqqqqK',
    'KwwwwwwwwwwwwwK',
    'KwKKKKKdKKKKKwK',
    'KWWWWWWWWWWWWWK',
    'KqqqqqqqqqqqqqK',
    '.KKKKKKKKKKKKK.',
  ], {});

  /* ---- gooseneck desk lamp, lit ---- */
  paint('desklamp', [
    '....KKKK....',
    '...KGGGGK...',
    '..KGYYYYGK..',
    '..KGYYYYGK..',
    '...KGGGGK...',
    '....KhhK....',
    '.....Kh.....',
    '.....Kh.....',
    '....KKhK....',
    '...KhhhhK...',
    '..KhhhhhhK..',
    '.KKKKKKKKKK.',
  ], {});

  /* ---- the potted thing in the corner, mostly dead ---- */
  paint('plant', [
    '.....e......',
    '..e..e...e..',
    '.eEe.eE.eEe.',
    '..eEeeEeeE..',
    '...eEeEeE...',
    '....eEeE....',
    '.....EE.....',
    '.....EE.....',
    '..KKKKKKKK..',
    '.KbbbbbbbbK.',
    '.KbuuuuuubK.',
    '.KKbbbbbbKK.',
    '..KKKKKKKK..',
  ], {});

  /* ---- water cooler, one bubble ---- */
  paint('cooler', [
    '..KKKKKKK..',
    '.KLLLLLLLK.',
    'KLlLLLLLlLK',
    'KLLWLLLLLLK',
    'KLlLLLLLlLK',
    '.KLLLLLLLK.',
    '..KKKKKKK..',
    '.KTTTTTTTK.',
    '.KTsssssTK.',
    '.KTsWWWsTK.',
    '.KTsssssTK.',
    '.KTTTTTTTK.',
    '.KKKKKKKKK.',
  ], {});

  /* ---- IV drip, hospital ---- */
  paint('ivbag', [
    '...KKK...',
    '..KSSSK..',
    '.KKKKKKK.',
    'KNNNNNNNK',
    'KNnnnnnNK',
    'KNnnnnnNK',
    'KNNnnnNNK',
    '.KNNNNNK.',
    '..KKKKK..',
    '...KsK...',
    '...KsK...',
  ], {});

  /* ---- the ward monitor, one green line ---- */
  paint('monitor', [
    'KKKKKKKKKKKKKK',
    'KTTTTTTTTTTTTK',
    'KTZZZZZZZZZZTK',
    'KTZFZZZZZZZZTK',
    'KTZFZZFZZZZZTK',
    'KTZFZFFFZZZZTK',
    'KTZFFFFFFFFFTK',
    'KTZZZZZZZZZZTK',
    'KTTTTTTTTTTTTK',
    'KTsSsTTTTTRTTK',
    'KKKKKKKKKKKKKK',
  ], {});

  /* ---- WANTED sheet, pinned ---- */
  paint('wanted', [
    '.KKKKKKKKKKK.',
    'KWWWWWWWWWWWK',
    'KWdddddddddWK',
    'KWKKKKKKKKKWK',
    'KWKffFFfffKWK',
    'KWKfFFFFFfKWK',
    'KWKFFKFFKFFKK',
    'KWKFFFFFFFFKK',
    'KWKFFKKKKFFKK',
    'KWKKKKKKKKKWK',
    'KWqqqqqqqqqWK',
    'KWqqqqqqqqqWK',
    '.KKKKKKKKKKK.',
  ], {});

  /* ---- a mug, chipped ---- */
  paint('mug', [
    'KKKKKK..',
    'KWWWWK..',
    'KWuuWKKK',
    'KWuuWKWK',
    'KWuuWKWK',
    'KWWWWKKK',
    '.KKKK...',
  ], {});

  /* ---- the ashtray, working overtime ---- */
  paint('ashtray', [
    '..WW......',
    '.KqqKK....',
    'KsssssssK.',
    'KsttttssK.',
    '.KssssssK.',
    '..KKKKKK..',
  ], {});

  /* ---- revolver on a desk, side on ---- */
  paint('gunprop', [
    '.....KKKKKKKK.',
    '....KSSSSSSSSK',
    '.KKKSsssssssSK',
    'KSSSSSSSSSSSSK',
    'KSssKKKKKKKKK.',
    'KSsK..KuuK....',
    '.KKK.KuuuK....',
    '.....KuuK.....',
    '.....KuK......',
  ], {});

  /* ---- a badge, on its own ---- */
  paint('badge', [
    '...KKK...',
    '..KGGGK..',
    '.KGgGgGK.',
    'KGgGGGgGK',
    'KGGGKGGGK',
    'KGgGGGgGK',
    '.KGgGgGK.',
    '..KGGGK..',
    '...KKK...',
  ], {});

  /* ============================================================
     BUILT ART — furniture, any size, same hand.
     ============================================================ */

  const P = () => PIX.PAL;

  /* a wooden desk seen side-on, with a drawer bank and a worn top */
  function desk(w, h, seed) {
    return cached('desk:' + w + 'x' + h + ':' + (seed || 0), () => {
      const o = cv(w, h), c = o.c, p = P();
      /* the top slab, overhanging */
      box(c, 0, 0, w, 6, { fill: p.b, top: p.B, bot: p.u, ink: p.K });
      grain(c, 2, 2, w - 4, 3, p.u, p.B, (seed || 1) * 3 + 5);
      /* the body, inset */
      box(c, 3, 6, w - 6, h - 6, { fill: p.u, top: p.b, bot: p.U, ink: p.K });
      /* drawers, three of them, with pulls */
      const dh = Math.max(6, Math.floor((h - 12) / 3));
      for (let i = 0; i < 3; i++) {
        const dy = 9 + i * (dh + 1);
        if (dy + dh > h - 3) break;
        box(c, 6, dy, Math.floor((w - 12) * 0.52), dh, { fill: p.b, top: p.B, bot: p.U, ink: p.K });
        const px0 = 6 + Math.floor((w - 12) * 0.52 / 2) - 3;
        px(c, px0, dy + Math.floor(dh / 2) - 1, 7, 2, p.h);
        px(c, px0, dy + Math.floor(dh / 2) - 1, 7, 1, p.G);
      }
      /* the knee hole: not a black rectangle — a dark space with a bin in it */
      const kx = 6 + Math.floor((w - 12) * 0.52) + 3;
      const kw = w - 12 - Math.floor((w - 12) * 0.52) - 3;
      px(c, kx, 9, kw, h - 12, '#0e0b08');
      px(c, kx, 9, kw, 1, 'rgba(0,0,0,.7)');
      px(c, kx + 1, 10, kw - 2, 2, 'rgba(255,255,255,.04)');
      if (kw > 12) {
        /* a waste basket, and the shadow it throws */
        const bw = Math.min(11, kw - 4);
        px(c, kx + 2, h - 3 - 9, bw, 9, '#1a1712');
        px(c, kx + 3, h - 3 - 8, bw - 2, 7, '#2a241a');
        px(c, kx + 3, h - 3 - 8, bw - 2, 1, '#3a3224');
        px(c, kx + 5, h - 3 - 11, 3, 3, '#ded2b4');
      }
      dither(c, 0, 0, w, 7, 'rgba(0,0,0,.16)', 0.09, (seed || 2) * 7);
      return o.cv;
    });
  }

  /* an office chair, side on, on a five-star base */
  function chair(w, h, seed) {
    return cached('chair:' + w + 'x' + h + ':' + (seed || 0), () => {
      const o = cv(w, h), c = o.c, p = P();
      const sy = Math.round(h * 0.46);
      /* back rest, tilted by one pixel per two rows */
      for (let i = 0; i < sy - 2; i++) {
        const xx = 2 + Math.round(i * 0.12);
        px(c, xx, i, 7, 1, p.K);
        px(c, xx + 1, i, 5, 1, i < 3 ? p.t : p.T);
      }
      px(c, 2, 0, 8, 2, p.K);
      /* the seat */
      box(c, 1, sy, w - 2, 6, { fill: p.T, top: p.t, bot: p.K, ink: p.K });
      /* post */
      px(c, Math.floor(w / 2) - 2, sy + 6, 4, h - sy - 10, p.K);
      px(c, Math.floor(w / 2) - 1, sy + 6, 2, h - sy - 10, p.s);
      /* the star base + castors */
      px(c, 2, h - 4, w - 4, 2, p.K);
      px(c, 3, h - 4, w - 6, 1, p.s);
      for (const cx of [3, Math.floor(w / 2) - 1, w - 5]) {
        px(c, cx, h - 2, 3, 2, p.K);
        px(c, cx, h - 2, 1, 1, p.s);
      }
      return o.cv;
    });
  }

  /* filing cabinet: four drawers, labels, one left open */
  function cabinet(w, h, openIdx, seed) {
    return cached('cab:' + w + 'x' + h + ':' + openIdx + ':' + (seed || 0), () => {
      const o = cv(w, h), c = o.c, p = P();
      box(c, 0, 0, w, h, { fill: p.t, top: p.s, bot: p.K, left: p.s, right: p.T, ink: p.K });
      dither(c, 1, 1, w - 2, h - 2, 'rgba(0,0,0,.13)', 0.1, (seed || 3) * 5);
      const n = 4, dh = Math.floor((h - 6) / n);
      for (let i = 0; i < n; i++) {
        const dy = 3 + i * dh;
        const out = i === openIdx ? 3 : 0;
        box(c, 2 - out, dy, w - 4 + out, dh - 2, { fill: p.T, top: p.s, bot: p.K, ink: p.K });
        /* the label window and the pull */
        px(c, 5 - out, dy + 2, Math.max(4, Math.floor(w * 0.3)), 3, p.w);
        px(c, 5 - out, dy + 2, Math.max(4, Math.floor(w * 0.3)), 1, p.W);
        const hx = Math.floor(w / 2) - 3 - out;
        px(c, hx, dy + Math.floor(dh / 2) + 1, 7, 2, p.S);
        px(c, hx, dy + Math.floor(dh / 2) + 1, 7, 1, p.M);
        if (out) { px(c, 2 - out, dy, out, dh - 2, p.K); px(c, 3 - out, dy + 1, 1, dh - 4, p.Z); }
      }
      /* a mug ring on the top, because of course */
      px(c, Math.floor(w * 0.6), 1, 5, 1, 'rgba(110,74,48,.5)');
      return o.cv;
    });
  }

  /* an institutional locker bank */
  function lockers(w, h, n, seed) {
    return cached('lock:' + w + 'x' + h + ':' + n + ':' + (seed || 0), () => {
      const o = cv(w, h), c = o.c, p = P();
      box(c, 0, 0, w, h, { fill: p.e, top: p.f, bot: p.K, ink: p.K });
      const dw = Math.floor(w / n);
      for (let i = 0; i < n; i++) {
        const dx = i * dw;
        box(c, dx + 1, 2, dw - 2, h - 4, { fill: p.E, top: p.e, left: p.e, right: p.K, ink: p.K });
        /* vents at the top, a lock, a number plate */
        for (let v = 0; v < 3; v++) px(c, dx + 4, 5 + v * 2, dw - 8, 1, p.K);
        px(c, dx + dw - 6, Math.floor(h / 2), 2, 4, p.S);
        px(c, dx + 4, 12, 5, 4, p.w);
        px(c, dx + 5, 13, 3, 2, p.K);
        if ((seed || 1) % (i + 2) === 0) dither(c, dx + 2, h - 14, dw - 4, 10, 'rgba(0,0,0,.2)', 0.14, i * 13 + 3);
      }
      return o.cv;
    });
  }

  /* the holding cell: bars, a bench, and somebody's shadow */
  function cell(w, h, seed) {
    return cached('cell:' + w + 'x' + h + ':' + (seed || 0), () => {
      const o = cv(w, h), c = o.c, p = P();
      px(c, 0, 0, w, h, '#0a0c11');
      /* the far wall of it, tiled */
      for (let y = 4; y < h - 6; y += 6) px(c, 2, y, w - 4, 1, 'rgba(255,255,255,.04)');
      /* a bench and a bucket */
      box(c, 6, h - 20, Math.floor(w * 0.5), 5, { fill: p.u, top: p.b, ink: p.K });
      px(c, 8, h - 15, 3, 8, p.K); px(c, 6 + Math.floor(w * 0.5) - 5, h - 15, 3, 8, p.K);
      /* bars, with highlights down the left of each */
      for (let x = 2; x < w - 2; x += 7) {
        px(c, x, 0, 3, h, p.K);
        px(c, x, 0, 1, h, p.s);
        px(c, x + 1, 0, 1, h, p.t);
      }
      px(c, 0, 0, w, 3, p.K); px(c, 0, h - 3, w, 3, p.K);
      px(c, 0, 3, w, 1, p.s);
      return o.cv;
    });
  }

  /* a barred window with rain running down it and city light behind */
  function window_(w, h, barred, seed) {
    return cached('win:' + w + 'x' + h + ':' + barred + ':' + (seed || 0), () => {
      const o = cv(w, h), c = o.c, p = P();
      box(c, 0, 0, w, h, { fill: '#14202c', top: '#20303c', bot: p.K, ink: p.K });
      /* the night outside: a skyline and a couple of lit windows */
      const rng = U.mulberry32((seed || 5) * 17);
      px(c, 2, 2, w - 4, h - 4, '#101a26');
      let bx = 2;
      while (bx < w - 4) {
        const bw = 5 + Math.floor(rng() * 9), bh = 8 + Math.floor(rng() * (h - 14));
        px(c, bx, h - 4 - bh, Math.min(bw, w - 4 - bx), bh, '#0a121c');
        for (let ly = h - 6 - bh; ly < h - 6; ly += 4) {
          for (let lx = bx + 1; lx < Math.min(bx + bw - 1, w - 5); lx += 3) {
            if (rng() < 0.22) px(c, lx, ly, 2, 2, rng() < 0.4 ? '#ffd75e' : '#5b7f9c');
          }
        }
        bx += bw + 1;
      }
      /* rain on the glass: short diagonal streaks */
      for (let i = 0; i < Math.round(w * h / 26); i++) {
        const rx = 2 + Math.floor(rng() * (w - 5)), ry = 2 + Math.floor(rng() * (h - 8));
        const len = 2 + Math.floor(rng() * 4);
        for (let s = 0; s < len; s++) px(c, rx + s, ry + s, 1, 1, 'rgba(160,200,230,.20)');
      }
      /* the frame: a cross of mullions, then bars if this is the cells */
      px(c, Math.floor(w / 2) - 1, 0, 2, h, p.K);
      px(c, 0, Math.floor(h / 2) - 1, w, 2, p.K);
      px(c, Math.floor(w / 2), 0, 1, h, '#2a3a48');
      if (barred) for (let x = 4; x < w - 3; x += 6) { px(c, x, 1, 2, h - 2, p.K); px(c, x, 1, 1, h - 2, p.s); }
      /* sill */
      box(c, -1, h - 3, w + 2, 4, { fill: p.q, top: p.w, bot: p.K, ink: null });
      return o.cv;
    });
  }

  /* a cast-iron radiator, the kind that knocks */
  function radiator(w, h) {
    return cached('rad:' + w + 'x' + h, () => {
      const o = cv(w, h), c = o.c, p = P();
      for (let x = 0; x < w - 2; x += 5) {
        box(c, x, 2, 5, h - 4, { fill: p.q, top: p.w, bot: p.K, right: p.K, ink: p.K });
        px(c, x + 2, 4, 1, h - 8, 'rgba(255,255,255,.14)');
      }
      px(c, 0, 0, w, 3, p.K); px(c, 1, 1, w - 2, 1, p.w);
      px(c, 0, h - 3, w, 3, p.K);
      px(c, w - 4, h - 8, 3, 6, p.h);
      return o.cv;
    });
  }

  /* the cork board: cork, pins, string, and whatever is pinned to it */
  function corkboard(w, h, seed) {
    return cached('cork:' + w + 'x' + h + ':' + (seed || 0), () => {
      const o = cv(w, h), c = o.c, p = P();
      box(c, 0, 0, w, h, { fill: '#6b4426', top: '#8a5c34', bot: '#3d2414', ink: '#241a10', leftW: 2, rightW: 2, left: '#7a4e2c', right: '#4d301a' });
      dither(c, 3, 3, w - 6, h - 6, 'rgba(0,0,0,.18)', 0.16, (seed || 4) * 9);
      dither(c, 3, 3, w - 6, h - 6, 'rgba(255,255,255,.05)', 0.1, (seed || 4) * 3);
      return o.cv;
    });
  }

  /* a hospital bed, side on, with somebody's shape under the sheet */
  function bed(w, h, occupied) {
    return cached('bed:' + w + 'x' + h + ':' + !!occupied, () => {
      const o = cv(w, h), c = o.c, p = P();
      /* head and foot rails */
      box(c, 0, 4, 4, h - 8, { fill: p.S, top: p.M, ink: p.K });
      box(c, w - 5, 10, 4, h - 14, { fill: p.S, top: p.M, ink: p.K });
      for (let y = 8; y < h - 12; y += 5) px(c, 1, y, 3, 1, p.m);
      /* the mattress */
      box(c, 3, Math.round(h * 0.42), w - 7, 8, { fill: p.w, top: p.W, bot: p.q, ink: p.K });
      /* nobody in it: the sheet thrown back, the pillow still dented */
      if (!occupied) {
        const my = Math.round(h * 0.42);
        px(c, 5, my - 5, 15, 6, p.K);
        px(c, 6, my - 4, 13, 4, '#eef2f8');
        px(c, 8, my - 3, 9, 1, '#cfd6e2');
        for (let i = 0; i < 4; i++) {
          px(c, Math.round(w * 0.4) + i * 7, my - 4 - (i % 2), 6, 5, p.K);
          px(c, Math.round(w * 0.4) + i * 7 + 1, my - 3 - (i % 2), 4, 4, '#cfd6e2');
        }
      }
      /* the sheet, and the shape of somebody under it */
      if (occupied) {
        const my = Math.round(h * 0.42);
        /* the body: a long low mound, higher at the chest */
        for (let i = 0; i < w - 22; i++) {
          const t = i / (w - 22);
          const rise = Math.round(Math.sin(t * Math.PI) * 4) + 2;
          px(c, 10 + i, my - rise, 1, rise + 1, i % 7 === 0 ? '#b9c1cf' : '#cfd6e2');
        }
        px(c, 10, my - 6, w - 22, 1, p.K);
        /* the sheet folded back over the chest */
        px(c, Math.round(w * 0.42), my - 5, Math.round(w * 0.3), 4, '#e8eef7');
        px(c, Math.round(w * 0.42), my - 5, Math.round(w * 0.3), 1, p.W);
        /* the pillow, and a frog's head on it */
        px(c, 5, my - 9, 13, 8, p.K);
        px(c, 6, my - 8, 11, 6, '#eef2f8');
        px(c, 8, my - 12, 10, 6, p.K);
        px(c, 9, my - 11, 8, 4, '#2e7d5b');
        px(c, 10, my - 13, 3, 3, p.K);
        px(c, 11, my - 12, 2, 2, '#2e7d5b');
        px(c, 14, my - 13, 3, 3, p.K);
        px(c, 15, my - 12, 2, 2, '#2e7d5b');
      }
      /* the frame and castors */
      px(c, 3, Math.round(h * 0.42) + 8, w - 7, 2, p.K);
      for (const cx of [6, w - 12]) { px(c, cx, h - 5, 3, 3, p.K); px(c, cx, h - 5, 1, 1, p.s); }
      return o.cv;
    });
  }

  /* a bar counter with a brass rail and bottles behind */
  function barCounter(w, h, seed) {
    return cached('bar:' + w + 'x' + h + ':' + (seed || 0), () => {
      const o = cv(w, h), c = o.c, p = P();
      box(c, 0, 0, w, 6, { fill: p.b, top: p.B, bot: p.u, ink: p.K });
      grain(c, 1, 1, w - 2, 4, p.u, p.B, (seed || 6) * 5);
      box(c, 2, 5, w - 4, h - 5, { fill: p.U, top: p.u, ink: p.K });
      /* panelling */
      for (let x = 5; x < w - 5; x += 12) {
        box(c, x, 9, 9, h - 14, { fill: p.u, top: p.b, bot: p.U, ink: null });
      }
      /* the brass foot rail */
      px(c, 1, h - 6, w - 2, 2, p.h);
      px(c, 1, h - 6, w - 2, 1, p.G);
      return o.cv;
    });
  }

  /* wooden crates, stacked, stencilled */
  function crate(s, seed) {
    return cached('crate:' + s + ':' + (seed || 0), () => {
      const o = cv(s, s), c = o.c, p = P();
      box(c, 0, 0, s, s, { fill: p.b, top: p.B, bot: p.U, left: p.B, right: p.u, ink: p.K });
      grain(c, 2, 2, s - 4, s - 4, p.u, p.B, (seed || 8) * 11);
      /* the diagonal brace */
      for (let i = 2; i < s - 2; i++) px(c, i, s - 2 - i + 2, 2, 2, p.u);
      px(c, 2, Math.floor(s / 2), s - 4, 2, p.u);
      px(c, 2, Math.floor(s / 2), s - 4, 1, p.B);
      /* a stencil letter */
      px(c, Math.floor(s / 2) - 3, 4, 2, 6, 'rgba(20,16,10,.5)');
      px(c, Math.floor(s / 2) + 1, 4, 2, 6, 'rgba(20,16,10,.5)');
      px(c, Math.floor(s / 2) - 3, 6, 6, 2, 'rgba(20,16,10,.5)');
      return o.cv;
    });
  }

  /* a hanging bulb in a tin shade, with its cone */
  function hangLamp(w, h, cone) {
    return cached('lamp:' + w + 'x' + h + ':' + !!cone, () => {
      const o = cv(w, h + (cone ? 60 : 0)), c = o.c, p = P();
      px(c, Math.floor(w / 2) - 1, 0, 2, Math.floor(h * 0.45), '#2a2d38');
      px(c, Math.floor(w / 2), 0, 1, Math.floor(h * 0.45), '#3a3d48');
      /* the tin shade, stepped */
      const sy = Math.floor(h * 0.45);
      for (let i = 0; i < 5; i++) {
        const iw = 4 + i * Math.max(1, Math.floor(w / 6));
        px(c, Math.floor(w / 2) - Math.floor(iw / 2), sy + i * 2, iw, 2, i < 2 ? '#4a4438' : '#332f26');
      }
      px(c, Math.floor(w / 2) - 2, sy + 10, 4, 3, '#ffe9a3');
      px(c, Math.floor(w / 2) - 1, sy + 10, 2, 2, '#fffbe8');
      if (cone) {
        for (let i = 0; i < 10; i++) {
          const hw = 4 + i * 4;
          px(c, Math.floor(w / 2) - hw, sy + 13 + i * 6, hw * 2, 6, 'rgba(255,233,163,.045)');
        }
      }
      return o.cv;
    });
  }

  /* pipes running along a wall, with a joint and a drip */
  function pipes(w, h, seed) {
    return cached('pipe:' + w + 'x' + h + ':' + (seed || 0), () => {
      const o = cv(w, h), c = o.c, p = P();
      box(c, 0, 2, w, 5, { fill: p.s, top: p.S, bot: p.K, ink: null });
      px(c, 0, 2, w, 1, p.K); px(c, 0, 6, w, 1, p.K);
      const rng = U.mulberry32((seed || 9) * 13);
      for (let x = 6; x < w - 6; x += 18 + Math.floor(rng() * 12)) {
        box(c, x, 1, 5, 7, { fill: p.t, top: p.s, ink: p.K });
      }
      /* a bracket or two into the wall */
      for (let x = 12; x < w - 8; x += 40) px(c, x, 0, 2, 3, p.K);
      return o.cv;
    });
  }

  /* institutional wall: two-tone with a chair rail, stains and a scuff */
  function wall(w, h, opt) {
    opt = opt || {};
    const key = 'wall:' + w + 'x' + h + ':' + (opt.tone || 'green') + ':' + (opt.seed || 0);
    return cached(key, () => {
      const o = cv(w, h), c = o.c;
      const T = {
        green: ['#1d2a26', '#243430', '#16211e', '#2f403a'],
        grey:  ['#1e222c', '#262b36', '#171a22', '#333a48'],
        tile:  ['#20282e', '#28323a', '#181e23', '#36424c'],
        brick: ['#241c1a', '#2c2220', '#1a1413', '#3a2c28'],
      }[opt.tone || 'green'];
      px(c, 0, 0, w, h, T[0]);
      /* upper field, dithered so it isn't dead flat */
      dither(c, 0, 0, w, h, T[1], 0.14, (opt.seed || 1) * 3);
      dither(c, 0, 0, w, h, T[2], 0.1, (opt.seed || 1) * 7);
      const railY = opt.railY === undefined ? Math.round(h * 0.62) : opt.railY;
      /* the darker wainscot below the rail */
      px(c, 0, railY, w, h - railY, T[2]);
      dither(c, 0, railY, w, h - railY, T[0], 0.12, (opt.seed || 1) * 11);
      px(c, 0, railY - 2, w, 2, T[3]);
      px(c, 0, railY, w, 1, '#0f1316');
      /* tiling, if this is a tiled room */
      if (opt.tone === 'tile') {
        for (let y = 2; y < railY; y += 9) px(c, 0, y, w, 1, 'rgba(255,255,255,.05)');
        for (let x = 0; x < w; x += 12) px(c, x, 0, 1, railY, 'rgba(0,0,0,.12)');
      }
      if (opt.tone === 'brick') {
        for (let y = 0; y < h; y += 6) {
          px(c, 0, y, w, 1, 'rgba(0,0,0,.28)');
          for (let x = (y / 6) % 2 ? 0 : 7; x < w; x += 14) px(c, x, y, 1, 6, 'rgba(0,0,0,.24)');
        }
      }
      /* damp coming through in a couple of places */
      const rng = U.mulberry32((opt.seed || 2) * 29);
      for (let i = 0; i < 3; i++) {
        const sx = Math.floor(rng() * (w - 30)), sw = 10 + Math.floor(rng() * 16);
        /* damp comes down the wall in a taper, heaviest at the top */
        for (let y = 0; y < Math.floor(railY * 0.66); y++) {
          const k = 1 - y / (railY * 0.66);
          dither(c, sx + Math.floor((1 - k) * 3), y, Math.max(2, Math.round(sw * k)), 1,
            'rgba(0,0,0,.22)', 0.16 * k + 0.03, i * 31 + y);
        }
      }
      return o.cv;
    });
  }

  /* floorboards or lino, with a light sheen and worn patches */
  function floor(w, h, opt) {
    opt = opt || {};
    const key = 'floor:' + w + 'x' + h + ':' + (opt.tone || 'board') + ':' + (opt.seed || 0);
    return cached(key, () => {
      const o = cv(w, h), c = o.c, p = P();
      if (opt.tone === 'lino') {
        px(c, 0, 0, w, h, '#1a2028');
        for (let x = 0; x < w; x += 14) {
          for (let y = 0; y < h; y += 14) {
            const d = ((x / 14) + (y / 14)) % 2;
            px(c, x, y, 14, 14, d ? '#1e252e' : '#161c23');
          }
        }
        /* the seams between the sheets, and the wear down the middle */
        for (let x = 0; x < w; x += 14) px(c, x, 0, 1, h, 'rgba(0,0,0,.22)');
        dither(c, 0, 2, w, Math.max(2, h - 6), 'rgba(255,255,255,.025)', 0.08, 3);
      } else {
        px(c, 0, 0, w, h, '#2a2118');
        for (let y = 0; y < h; y += 7) {
          px(c, 0, y, w, 1, 'rgba(0,0,0,.34)');
          px(c, 0, y + 1, w, 1, 'rgba(255,255,255,.04)');
          grain(c, 0, y + 2, w, 4, '#241c14', '#382c1e', (opt.seed || 1) * 13 + y);
        }
        /* board ends, staggered */
        const rng = U.mulberry32((opt.seed || 1) * 41);
        for (let y = 0; y < h; y += 7) {
          for (let x = Math.floor(rng() * 40); x < w; x += 40 + Math.floor(rng() * 50)) {
            px(c, x, y, 1, 7, 'rgba(0,0,0,.4)');
          }
        }
      }
      /* the sheen where the light lands, drawn as a soft band */
      px(c, 0, 0, w, 2, 'rgba(255,255,255,.05)');
      return o.cv;
    });
  }

  return {
    cv, cached, px, box, dither, grain, rivets, paint, art,
    desk, chair, cabinet, lockers, cell, window: window_, radiator,
    corkboard, bed, barCounter, crate, hangLamp, pipes, wall, floor,
  };
})();
