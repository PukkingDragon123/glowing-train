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

  /* ============================================================
     THE ICON SET.

     Hand-drawn 14x14 marks: one for every app on the phone and one
     for every stop on the map. They are the only pictures in the
     interface, so they carry the whole thing — no glyphs, no emoji,
     no rounded chrome. Drawn one character per pixel like everything
     else, and blown up by whole numbers.
     ============================================================ */

  paint('ic_phone', [
    '..KKKKKKKKKK..',
    '..KSSSSSSSSK..',
    '..KStttttSSK..',
    '..KStLLLtSSK..',
    '..KStLLLtSSK..',
    '..KStttttSSK..',
    '..KSSSSSSSSK..',
    '..KSGKSGKSGK..',
    '..KSKKSKKSKK..',
    '..KSGKSGKSGK..',
    '..KSKKSKKSKK..',
    '..KSGKSGKSGK..',
    '..KSSSSSSSSK..',
    '..KKKKKKKKKK..',
  ]);

  paint('ic_map', [
    'KKKKKKKKKKKKKK',
    'KWWWWWWWWWWWWK',
    'KWWKKKWWWWWWWK',
    'KWKlllKWWWWWWK',
    'KWKlllKKWWWWWK',
    'KWWKKKWlKWWWWK',
    'KWWWWWWWlKWWWK',
    'KWWWWWWWWlKKKK',
    'KWWWWWWWWWlKGK',
    'KWWKKWWWWWlKGK',
    'KWKddKWWWWKKKK',
    'KWKddKWWWWWWWK',
    'KWWKKWWWWWWWWK',
    'KKKKKKKKKKKKKK',
  ]);

  paint('ic_case', [
    '....KKKKKK....',
    '....KuuuuK....',
    'KKKKKKKKKKKKKK',
    'KuuuuuuuuuuuuK',
    'KuBBBBBBBBBBuK',
    'KuBWWWWWWWWBuK',
    'KuBWqqqqqqWBuK',
    'KuBWWWWWWWWBuK',
    'KuBWqqqqWWWBuK',
    'KuBWWWWWWWWBuK',
    'KuBBBBGGBBBBuK',
    'KuuuuuGGuuuuuK',
    'KKKKKKKKKKKKKK',
    '..............',
  ]);

  paint('ic_bag', [
    '.....KKKK.....',
    '....KuuuuK....',
    '...KuKKKKuK...',
    '..KKKKKKKKKK..',
    '..KuuuuuuuuK..',
    '..KuBBBBBBuK..',
    '..KuBGGGGBuK..',
    '..KuBGWWGBuK..',
    '..KuBGWWGBuK..',
    '..KuBGGGGBuK..',
    '..KuBBBBBBuK..',
    '..KuuuuuuuuK..',
    '..KKKKKKKKKK..',
    '..............',
  ]);

  paint('ic_star', [
    '......KK......',
    '.....KGGK.....',
    '.....KGGK.....',
    '..KKKKGGKKKK..',
    '.KGGGGGGGGGGK.',
    '..KGGGGGGGGK..',
    '...KGGGGGGK...',
    '...KGGKKGGK...',
    '..KGGK..KGGK..',
    '..KGK....KGK..',
    '..KK......KK..',
    '..............',
    '..............',
    '..............',
  ]);

  paint('ic_badge', [
    '.....KKKK.....',
    '...KKGGGGKK...',
    '..KGGGGGGGGK..',
    '.KGGKKGGKKGGK.',
    '.KGKWWWWWWKGK.',
    '.KGKWttttWKGK.',
    '.KGKWtGGtWKGK.',
    '.KGKWttttWKGK.',
    '.KGKWWWWWWKGK.',
    '.KGGKKGGKKGGK.',
    '..KGGGGGGGGK..',
    '...KKGGGGKK...',
    '.....KKKK.....',
    '..............',
  ]);

  paint('ic_drum', [
    '.KKKKKKKKKKKK.',
    '.KWWWWWWWWWWK.',
    '.KWttKWWWKtWK.',
    '.KWWWWWWWWWWK.',
    '.KWKKKKKKKKWK.',
    '.KWKttttttKWK.',
    '.KWKtLLLLtKWK.',
    '.KWKtLLLLtKWK.',
    '.KWKttttttKWK.',
    '.KWKKKKKKKKWK.',
    '.KWWWWWWWWWWK.',
    '.KWWWWWWWWWWK.',
    '.KKKKKKKKKKKK.',
    '..............',
  ]);

  paint('ic_anchor', [
    '......KK......',
    '.....KSSK.....',
    '.....KttK.....',
    '......SS......',
    '...KKKSSKKK...',
    '...KSSSSSSK...',
    '......SS......',
    '..K...SS...K..',
    '..KS..SS..SK..',
    '..KS..SS..SK..',
    '..KSSKSSKSSK..',
    '...KSSSSSSK...',
    '....KKKKKK....',
    '..............',
  ]);

  paint('ic_ring', [
    '......KK......',
    '.....KGGK.....',
    '....KGWWGK....',
    '.....KGGK.....',
    '...KKKKKKKK...',
    '..KGGGGGGGGK..',
    '.KGGKKKKKKGGK.',
    '.KGKK....KKGK.',
    '.KGK......KGK.',
    '.KGKK....KKGK.',
    '.KGGKKKKKKGGK.',
    '..KGGGGGGGGK..',
    '...KKKKKKKK...',
    '..............',
  ]);

  paint('ic_cup', [
    '..............',
    '..KKKKKKKK....',
    '..KWWWWWWK....',
    '..KWuuuuWKKK..',
    '..KWuuuuWKWK..',
    '..KWuuuuWKWK..',
    '..KWWWWWWKKK..',
    '..KWWWWWWK....',
    '..KKWWWWKK....',
    '...KKKKKK.....',
    '..KKKKKKKK....',
    '..KwwwwwwK....',
    '..KKKKKKKK....',
    '..............',
  ]);

  paint('ic_glass', [
    '.KKKKKKKKKKKK.',
    '.KLllllllllLK.',
    '.KLGGGGGGGGLK.',
    '.KLGGGGGGGGLK.',
    '..KLGGGGGGLK..',
    '..KKLGGGGLKK..',
    '....KLGGLK....',
    '.....KLLK.....',
    '......KK......',
    '......KK......',
    '....KKKKKK....',
    '...KWWWWWWK...',
    '...KKKKKKKK...',
    '..............',
  ]);

  paint('ic_rat', [
    '................',
    '..KK........KK..',
    '.KttK......KttK.',
    '.KtttKKKKKKtttK.',
    'KtPttttttttttttK',
    'KtWtttttttttttttKK',
    'KKttttttttttttttttK',
    '.KtttttttttttttKKK',
    '..KKtttttttttKK.',
    '...KtKKKKKtKK...',
    '...KKK...KKK....',
    '................',
  ]);

  paint('ic_drop', [
    '......KK......',
    '.....KLLK.....',
    '.....KLLK.....',
    '....KLLLLK....',
    '....KLLLLK....',
    '...KLLWWLLK...',
    '...KLLWWLLK...',
    '..KLLLLLLLLK..',
    '..KLLLLLLLLK..',
    '..KLLLLLLLLK..',
    '...KLLLLLLK...',
    '....KKKKKK....',
    '..............',
    '..............',
  ]);

  /* ---------------- the city, on the map ---------------- */

  paint('ic_tower', [
    '......KK......',
    '......GK......',
    '.....KGGK.....',
    '.....KGGK.....',
    '....KGGGGK....',
    '....KGKKGK....',
    '...KGGGGGGK...',
    '...KGKKKKGK...',
    '..KGGGGGGGGK..',
    '..KGKKKKKKGK..',
    '.KGGKKKKKKGGK.',
    '.KGKKKKKKKKGK.',
    'KGGKKKKKKKKGGK',
    'KKKKKKKKKKKKKK',
  ]);

  paint('ic_arch', [
    '..............',
    '.KKKKKKKKKKKK.',
    '.KwwwwwwwwwwK.',
    '.KwqqqqqqqqwK.',
    '.KwwwwwwwwwwK.',
    '.Kwwwqqqqwwwk.',
    '.KwwKKKKKKwwK.',
    '.KwKKKKKKKKwK.',
    '.KwKKKKKKKKwK.',
    '.KwKKKKKKKKwK.',
    '.KwKKKKKKKKwK.',
    '.KwKKKGGKKKwK.',
    'KKwKKKGGKKKwKK',
    'KKKKKKKKKKKKKK',
  ]);

  paint('ic_dome', [
    '......KK......',
    '.....KGGK.....',
    '....KWWWWK....',
    '...KWWWWWWK...',
    '..KWWWWWWWWK..',
    '..KWWqqqqWWK..',
    '.KWWWWWWWWWWK.',
    'KWWWKWWWWKWWWK',
    'KWWKKWWWWKKWWK',
    'KWWKKKWWKKKWWK',
    'KWWKKKKKKKKWWK',
    'KWWKKKKKKKKWWK',
    'KWWKKKKKKKKWWK',
    'KKKKKKKKKKKKKK',
  ]);

  paint('ic_glass2', [
    '......KK......',
    '.....KLLK.....',
    '.....KLLK.....',
    '....KLLLLK....',
    '....KLKKLK....',
    '...KLLKKLLK...',
    '...KLKKKKLK...',
    '..KLLKKKKLLK..',
    '..KLKKKKKKLK..',
    '.KLLKKKKKKLLK.',
    '.KLKKKKKKKKLK.',
    'KLLKKKKKKKKLLK',
    'KGGGGGGGGGGGGK',
    'KKKKKKKKKKKKKK',
  ]);

  paint('ic_skull', [
    '...KKKKKKKK...',
    '..KWWWWWWWWK..',
    '.KWWWWWWWWWWK.',
    'KWWWWWWWWWWWWK',
    'KWWKKKWWKKKWWK',
    'KWKKKKWWKKKKWK',
    'KWKKKKWWKKKKWK',
    'KWWKKKWWKKKWWK',
    'KWWWWWKKWWWWWK',
    'KWWWWKWWKWWWWK',
    '.KWWWWWWWWWWK.',
    '..KWKWKWKWKWK.',
    '..KWKWKWKWKWK.',
    '...KKKKKKKKK..',
  ]);

  /* ---------------- the tool belt ---------------- */

  paint('ic_hand', [
    '..............',
    '.....KK.......',
    '....KGGK.KK...',
    '....KGGKKGGK..',
    '..KK.KGGKGGKK.',
    '.KGGKKGGKGGKGK',
    '.KGGKGGGGGGKGK',
    '.KGGGGGGGGGGGK',
    '..KGGGGGGGGGK.',
    '..KGGGGGGGGGK.',
    '...KGGGGGGGGK.',
    '....KGGGGGGK..',
    '.....KGGGGK...',
    '......KKKK....',
  ]);

  paint('ic_lens', [
    '...KKKKKK.....',
    '..KWWWWWWK....',
    '.KWLLLLLLWK...',
    'KWLLlllllLWK..',
    'KWLlllllllLWK.',
    'KWLlllllllLWK.',
    'KWLLlllllLLWK.',
    'KWWLLlllLLWWK.',
    '.KWWLLLLLWWK..',
    '..KKWWWWWKK...',
    '....KKGGKK....',
    '......KGGKK...',
    '.......KGGKK..',
    '........KKKK..',
  ]);

  paint('ic_iron', [
    '..............',
    '...KKKKKKKK...',
    '..KSSSSSSSSK..',
    '..KSttttttSK..',
    '.KKSSSSSSSSKK.',
    '.KSSSKKKKSSSK.',
    '.KSSSKssKSSK..',
    '..KKSSSKKK....',
    '...KSSSK......',
    '...KUUUK......',
    '..KUbbUK......',
    '..KUbbUK......',
    '..KUUUUK......',
    '...KKKK.......',
  ]);

  paint('ic_paw', [
    '..............',
    '..KK....KK....',
    '.KGGK..KGGK...',
    '.KGGK..KGGK...',
    '..KK.KK.KK....',
    '....KGGK......',
    '..KK.KK.KK....',
    '.KGGK..KGGK...',
    '..KK....KK....',
    '...KKKKKK.....',
    '..KGGGGGGK....',
    '.KGGGGGGGGK...',
    '.KGGGGGGGGK...',
    '..KKKKKKKK....',
  ]);

  /* ============================================================
     THE EVIDENCE.

     Every clue in the case is a THING, and until now the card that
     announced one drew a grey rectangle where the thing should be.
     These are those things: 16x16, one per test the board runs, and
     they turn up in the pick-up, on the card and in your coat.
     ============================================================ */

  paint('ev_photo', [
    'KKKKKKKKKKKKKKKK',
    'KWWWWWWWWWWWWWWK',
    'KWttttttttttttWK',
    'KWtssssssssssTWK',
    'KWtsSSqqqqsssTWK',
    'KWtsSKKKKqsssTWK',
    'KWtsKFFFFKssTTWK',
    'KWtsKFKKFKssTTWK',
    'KWtsKFFFFKsTTTWK',
    'KWtssKKKKssTTTWK',
    'KWtssssssTTTTTWK',
    'KWttttttTTTTTTWK',
    'KWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWKKK',
    'KWWWWWWWWWWWKK..',
    'KKKKKKKKKKKKK...',
  ]);

  paint('ev_glass', [
    '................',
    '.....KKKKKK.....',
    '...KKLLLLLLKK...',
    '..KLLllllllLLK..',
    '.KLlllWlllllllK.',
    '.KLllWWllllllLK.',
    'KLllWlllllllllLK',
    'KLlWllllllKllllK',
    'KLllllllKKlllllK',
    'KLlllllKllllllLK',
    '.KLllKKllllllLK.',
    '.KLlKlllllllLLK.',
    '..KKLLllllLLKK..',
    '...KKLLLLLLKK...',
    '.....KKKKKK.....',
    '................',
  ]);

  paint('ev_print', [
    'KKKKKKKKKKKKKKKK',
    'KWWWWWWWWWWWWWWK',
    'KWWWKKKKKKKKWWWK',
    'KWWKttttttttKWWK',
    'KWKt.KKKKKK.tKWK',
    'KWKt.KttttK.tKWK',
    'KWKt.Kt..tK.tKWK',
    'KWKt.Kt..tK.tKWK',
    'KWKt.KttttK.tKWK',
    'KWKt.KKKKKK.tKWK',
    'KWWKttttttttKWWK',
    'KWWWKKKKKKKKWWWK',
    'KWWWWWWWWWWWWWWK',
    'KWWKKKWWKKKKWWWK',
    'KWWWWWWWWWWWWWWK',
    'KKKKKKKKKKKKKKKK',
  ]);

  paint('ev_shell', [
    '................',
    '......KKKK......',
    '.....KGGGGK.....',
    '.....KGhhGK.....',
    '....KKGhhGKK....',
    '....KGGGGGGK....',
    '....KGhhhhGK....',
    '....KGhHHhGK....',
    '....KGhHHhGK....',
    '....KGhHHhGK....',
    '....KGhhhhGK....',
    '....KGGhhGGK....',
    '....KKGGGGKK....',
    '.....KKKKKK.....',
    '................',
    '................',
  ]);

  paint('ev_butt', [
    '................',
    '................',
    '..........KKK...',
    '.........KOOK...',
    '........KKoOK...',
    '.....KKKKuoKK...',
    '...KKUUUuuKK....',
    '..KUbbbUUuK.....',
    '..KUbBbbUUK.....',
    '..KUbbbbUK......',
    '...KKUUUKK......',
    '.....KKKK.......',
    '..qq............',
    '.q..q...q.......',
    '................',
    '................',
  ]);

  paint('ev_match', [
    '................',
    '..KKKKKKKKKKKK..',
    '..KddddddddddK..',
    '..KdWWWWWWWWdK..',
    '..KdWKKKKKKWdK..',
    '..KdWKrrrrKWdK..',
    '..KdWKrKKrKWdK..',
    '..KdWKrrrrKWdK..',
    '..KdWKKKKKKWdK..',
    '..KdWWWWWWWWdK..',
    '..KddddddddddK..',
    '..KKKKKKKKKKKK..',
    '...KWKWKWKWK....',
    '...KRKRKRKRK....',
    '...KKKKKKKKK....',
    '................',
  ]);

  paint('ev_note', [
    '................',
    '.KKKKKKKKKKKKKK.',
    '.KWWWWWWWWWWWWK.',
    '.KWttttttWWWWWK.',
    '.KWttttttttWWWK.',
    '.KWWWWWWWWWWWWK.',
    '.KWtttttttttWWK.',
    '.KWttttttWWWWWK.',
    '.KWWWWWWWWWWWWK.',
    '.KWttttttttWWWK.',
    '.KWttttWWWWWWWK.',
    '.KWWWWWWWWWWWWK.',
    '.KWWWWWWWKKKKKK.',
    '.KWWWWWWKK......',
    '.KKKKKKKK.......',
    '................',
  ]);

  /* ============================================================
     AND THE THINGS THAT ARE JUST THERE.

     Nothing in this block is evidence and none of it does anything.
     They are the reward for holding the eyeglass up to a shelf in a
     pawn shop at two in the morning.
     ============================================================ */

  paint('eg_ball', [
    '.....KKKKKK.....',
    '...KKrrrrrrKK...',
    '..KrrrrrrrrrrK..',
    '.KrrrrrrrrrrrrK.',
    '.KrrrrrrrrrrrrK.',
    'KrrrrrrrrrrrrrrK',
    'KKKKKKKKKKKKKKKK',
    'KKKKKKWWWWKKKKKK',
    'KWWWWWWKKWWWWWWK',
    'KWWWWWWKKWWWWWWK',
    'KWWWWWWWWWWWWWWK',
    '.KWWWWWWWWWWWWK.',
    '.KWWWWWWWWWWWWK.',
    '..KWWWWWWWWWWK..',
    '...KKWWWWWWKK...',
    '.....KKKKKK.....',
  ]);

  paint('eg_card', [
    '.KKKKKKKKKKKK...',
    '.KGGGGGGGGGGK...',
    '.KGWWWWWWWWGKKKK',
    '.KGWVVVVVVWGKGGK',
    '.KGWVFFFFVWGKGGK',
    '.KGWVFOOFVWGKGGK',
    '.KGWVFOOFVWGKGGK',
    '.KGWVFFFFVWGKGGK',
    '.KGWVVVVVVWGKGGK',
    '.KGWWWWWWWWGKGGK',
    '.KGWttttttWGKGGK',
    '.KGWtttttWWGKGGK',
    '.KGWWWWWWWWGKGGK',
    '.KGGGGGGGGGGKGGK',
    '.KKKKKKKKKKKKGGK',
    '.............KKK',
  ]);

  paint('eg_flag', [
    '................',
    'KKKKKKKKKKKKKKKK',
    'KrrrrrrrrrrrrrrK',
    'KrrrrrrrrrrrrrrK',
    'KWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWWWK',
    'KVVVVVVVVVVVVVVK',
    'KVVVVVVVVVVVVVVK',
    'KVVVVVVVVVVVVVVK',
    'KVVVVVVVVVVVVVVK',
    'KWWWWWWWWWWWWWWK',
    'KWWWWWWWWWWWWWWK',
    'KrrrrrrrrrrrrrrK',
    'KrrrrrrrrrrrrrrK',
    'KKKKKKKKKKKKKKKK',
    '.K..............',
  ]);

  paint('eg_duck', [
    '................',
    '................',
    '.......KKKK.....',
    '......KGGGGK....',
    '.....KGGKGGK....',
    '.....KGGGGGKKK..',
    '.....KGGGGKOOK..',
    '....KKGGGKKKKK..',
    '..KKGGGGGGGKK...',
    '.KGGGGGGGGGGGK..',
    'KGGGGGGGGGGGGGK.',
    'KGGGGGGGGGGGGK..',
    '.KGGGGGGGGGGK...',
    '..KKGGGGGGKK....',
    '....KKKKKK......',
    '................',
  ]);

  paint('ic_clock', [
    '....KKKKKK....',
    '..KKWWWWWWKK..',
    '.KWWWWWWWWWWK.',
    'KWWKWWWWWWKWWK',
    'KWWWWWKWWWWWWK',
    'KWWWWWKWWWWWWK',
    'KWWWWWKWWWWWWK',
    'KWWWWWKKKKWWWK',
    'KWWWWWWWWWWWWK',
    'KWWKWWWWWWKWWK',
    '.KWWWWWWWWWWK.',
    '..KKWWWWWWKK..',
    '....KKKKKK....',
    '..............',
  ]);

  paint('ic_coin', [
    '....KKKKKK....',
    '..KKGGGGGGKK..',
    '.KGGGGGGGGGGK.',
    'KGGGKGGGGKGGGK',
    'KGGGKGGGGKGGGK',
    'KGGGKKKKKKGGGK',
    'KGGGGKGGKGGGGK',
    'KGGGGKGGKGGGGK',
    'KGGGKKKKKKGGGK',
    'KGGGKGGGGKGGGK',
    '.KGGKGGGGKGGK.',
    '..KKGGGGGGKK..',
    '....KKKKKK....',
    '..............',
  ]);

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
  /* ---- the machine somebody's night gets typed on.

     It was a white box with a dark slot and two rows of dots. A
     typewriter has a CARRIAGE across the top with a knob on each
     end and a sheet standing up out of it, a paper bail, a return
     lever off to the left, and a key bank that STEPS -- three rows
     each one further forward than the last, which is the shape
     everybody recognises before they recognise anything else. ---- */
  paint('typewriter', [
    '.......PPPP.........',
    '......KPPPPK........',
    '..LKKKKPPPPKKKKn....',
    '..LKMMMMMMMMMMKn....',
    '...K@@@@@@@@@@K.....',
    '...KSSSSGSSSSSK.....',
    '..KSssssssssssSK....',
    '..KoOoOoOoOoOoSK....',
    '.KSssssssssssssSK...',
    '.KoOoOoOoOoOoOoSK...',
    'KSssssssssssssssSK..',
    'KoOoOoOoOoOoOoOoSK..',
    '.KSSSSSSSSSSSSSSK...',
    '..KKKKKKKKKKKKKK....',
  ], {
    'P': '#ded2b4', 'M': '#22262e', '@': '#6a737f',
    'L': '#8d8672', 'n': '#8d8672', 'o': 'q', 'O': 'W',
  });

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
  /* ---- the water cooler. It was a flat cyan slab on a grey box, the
     brightest object in the precinct and the least convincing. A bottle
     is GLASS: the light goes through it, there is a meniscus at the top
     of the water and a bright core down the middle, and it sits on a
     cabinet with two taps, a drip tray and a sleeve of cones. ---- */
  paint('cooler', [
    '...KKKKK...',
    '..K#####K..',
    '.K##ww###K.',
    'K=~~~~~~~=K',
    'K=~ww~~~~=K',
    'K=~~~~~~~=K',
    'K=~~~~~~~=K',
    'K=b~~~~~b=K',
    '.K=======K.',
    '.KTTTTTTTK.',
    '.KTbTTTbTK.',
    '.KT-T-T-TK.',
    '.KTsssssTK.',
    '.KKKKKKKKK.',
  ], {
    '#': 'rgba(196,226,238,.42)', '~': 'rgba(120,186,208,.60)',
    'w': 'rgba(240,252,255,.72)', '=': 'rgba(74,120,140,.66)',
    'b': 'rgba(46,84,102,.66)', '-': '#8d8672',
  });

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

  /* ============================================================
     THE DESK, WITH THE NIGHT'S WORK STILL ON IT.

     Three drawers with a brass dash for a pull, a knee hole and a
     bin: that is a desk in outline, which is what it read as. What
     a desk in a bullpen actually has is WEAR -- the front edge is
     worn pale where forearms go, the top is ringed and inked, and
     there is always paper on it. So: real grain in two directions,
     a rubbed nose to the top, drawer pulls with a shadow under the
     lip, a keyhole on the top drawer, and the leavings of a shift.
     ============================================================ */
  function desk(w, h, seed) {
    return cached('desk:' + w + 'x' + h + ':' + (seed || 0), () => {
      const o = cv(w, h), c = o.c, p = P();
      const rng = U.mulberry32((seed || 1) * 37 + 3);
      /* the top slab, overhanging, with a WORN NOSE to it */
      box(c, 0, 0, w, 6, { fill: p.b, top: p.B, bot: p.u, ink: p.K });
      grain(c, 2, 1, w - 4, 4, p.u, p.B, (seed || 1) * 3 + 5);
      px(c, 0, 1, w, 1, 'rgba(255,236,196,.14)');            /* the lit edge */
      px(c, 1, 3, w - 2, 1, 'rgba(214,190,150,.10)');        /* rubbed pale */
      px(c, 0, 5, w, 1, 'rgba(0,0,0,.40)');
      px(c, 0, 6, w, 1, 'rgba(0,0,0,.24)');                  /* its own shadow */
      /* rings and ink on the top, because somebody works here */
      for (let i = 0; i < 3; i++) {
        const rx = 4 + Math.floor(rng() * (w - 12));
        PIX.ring(c, rx, 3, 3 + Math.floor(rng() * 2), 1, 'rgba(0,0,0,.22)');
      }
      for (let i = 0; i < 5; i++) {
        px(c, 3 + Math.floor(rng() * (w - 6)), 2 + Math.floor(rng() * 3), 1, 1,
          'rgba(20,26,40,.44)');
      }
      /* the body, inset */
      box(c, 3, 6, w - 6, h - 6, { fill: p.u, top: p.b, bot: p.U, ink: p.K });
      grain(c, 4, 8, w - 8, h - 12, p.U, p.u, (seed || 1) * 11);
      /* drawers, three of them, with pulls that have a lip and a shadow */
      const dh = Math.max(6, Math.floor((h - 12) / 3));
      const dw = Math.floor((w - 12) * 0.52);
      for (let i = 0; i < 3; i++) {
        const dy = 9 + i * (dh + 1);
        if (dy + dh > h - 3) break;
        box(c, 6, dy, dw, dh, { fill: p.b, top: p.B, bot: p.U, ink: p.K });
        grain(c, 8, dy + 1, dw - 4, dh - 2, p.u, p.B, (seed || 1) * 7 + i);
        px(c, 6, dy - 1, dw, 1, 'rgba(0,0,0,.44)');          /* the gap above it */
        const px0 = 6 + Math.floor(dw / 2) - 4;
        px(c, px0 - 1, dy + Math.floor(dh / 2) - 2, 11, 5, 'rgba(0,0,0,.40)');
        px(c, px0, dy + Math.floor(dh / 2) - 1, 9, 2, p.h);
        px(c, px0, dy + Math.floor(dh / 2) - 1, 9, 1, p.G);
        px(c, px0, dy + Math.floor(dh / 2) + 1, 9, 1, 'rgba(0,0,0,.44)');
        if (i === 0) {                                        /* and a keyhole */
          px(c, 6 + dw - 6, dy + Math.floor(dh / 2) - 1, 2, 3, 'rgba(0,0,0,.66)');
          px(c, 6 + dw - 6, dy + Math.floor(dh / 2) - 2, 2, 1, p.h);
        }
      }
      /* the knee hole: not a black rectangle — a dark space with a bin in it */
      const kx = 6 + dw + 3;
      const kw = w - 12 - dw - 3;
      px(c, kx, 9, kw, h - 12, '#0e0b08');
      px(c, kx, 9, kw, 1, 'rgba(0,0,0,.7)');
      px(c, kx + 1, 10, kw - 2, 2, 'rgba(255,255,255,.04)');
      px(c, kx, 9, 2, h - 12, 'rgba(0,0,0,.5)');
      /* bounced light on the back of the knee hole, low down */
      for (let i = 0; i < 4; i++) {
        px(c, kx + 1, h - 4 - i, kw - 2, 1, 'rgba(190,168,124,' + (0.030 * (4 - i)).toFixed(3) + ')');
      }
      if (kw > 12) {
        /* a waste basket, and the shadow it throws */
        const bw = Math.min(11, kw - 4);
        px(c, kx + 2, h - 3 - 9, bw, 9, '#1a1712');
        px(c, kx + 3, h - 3 - 8, bw - 2, 7, '#2a241a');
        px(c, kx + 3, h - 3 - 8, bw - 2, 1, '#3a3224');
        for (let i = 0; i < 3; i++) {
          px(c, kx + 4, h - 9 + i * 2, bw - 4, 1, 'rgba(0,0,0,.28)');
        }
        px(c, kx + 5, h - 3 - 11, 3, 3, '#ded2b4');
        px(c, kx + 4, h - 3 - 12, 2, 2, '#f0e6c8');
      }
      /* PAPER ON IT: a docket half off the front edge, and a pencil */
      if (w > 40) {
        const sx = 8 + Math.floor(rng() * Math.max(1, w - 34));
        px(c, sx, 0, 18, 3, '#0e0c0a');
        px(c, sx + 1, 0, 16, 2, '#ded2b4');
        px(c, sx + 1, 0, 16, 1, '#f0e6c8');
        px(c, sx + 3, 1, 9, 1, '#8d8672');
        const gx = sx + 22;
        if (gx + 9 < w) {
          px(c, gx, 1, 9, 2, '#0e0c0a');
          px(c, gx, 1, 8, 1, '#c8a83c');
          px(c, gx + 8, 1, 2, 2, '#8d8672');
        }
      }
      dither(c, 0, 0, w, 7, 'rgba(0,0,0,.16)', 0.09, (seed || 2) * 7);
      return o.cv;
    });
  }

  /* ============================================================
     THE CHAIR NOBODY ADJUSTS.

     A tilted seven-pixel bar for a back, a slab for a seat, a post
     and three castors. Seen from the side that came out as a black
     lolly on a stick. A typist's chair has a back with a PAD on it
     and a gap under it, a seat with a nosed front edge, a gas post
     with a collar, and a five-star base whose near arms are longer
     than its far ones.
     ============================================================ */
  function chair(w, h, seed) {
    return cached('chair:' + w + 'x' + h + ':' + (seed || 0), () => {
      const o = cv(w, h), c = o.c, p = P();
      /* the seat sits at just over half the height, not at forty-six per
         cent: at forty-six the pad above it came out FOUR ROWS tall and the
         whole chair read as a letter T on a stick */
      const sy = Math.round(h * 0.54);
      const mid = Math.floor(w / 2);
      /* the back: a pad on a stalk, tilted, with daylight under it */
      const bTop = 0, bBot = Math.max(5, Math.round(sy * 0.66));
      for (let i = bTop; i < bBot; i++) {
        const xx = 2 + Math.round(i * 0.14);
        const bw = 8;
        px(c, xx - 1, i, bw + 2, 1, p.K);
        px(c, xx, i, bw, 1, i < 2 ? p.t : p.T);
        px(c, xx, i, 2, 1, 'rgba(255,255,255,.10)');
        px(c, xx + bw - 2, i, 2, 1, 'rgba(0,0,0,.30)');
      }
      px(c, 2, bTop, 9, 2, p.K);
      px(c, 3, bTop + 1, 7, 1, 'rgba(255,255,255,.12)');
      /* two seams across the pad, so it is upholstery */
      px(c, 3, Math.round(bBot * 0.36), 7, 1, 'rgba(0,0,0,.30)');
      px(c, 4, Math.round(bBot * 0.70), 7, 1, 'rgba(0,0,0,.30)');
      /* the stalk from the pad down to the seat */
      const stx = 4 + Math.round(bBot * 0.14);
      px(c, stx, bBot, 3, sy - bBot + 1, p.K);
      px(c, stx + 1, bBot, 1, sy - bBot + 1, p.s);
      /* the seat: a slab with a nosed front */
      box(c, 1, sy, w - 2, 5, { fill: p.T, top: p.t, bot: p.K, ink: p.K });
      px(c, 1, sy, w - 2, 1, 'rgba(255,255,255,.14)');
      px(c, 1, sy + 4, w - 2, 1, 'rgba(0,0,0,.44)');
      px(c, w - 4, sy + 1, 3, 3, 'rgba(255,255,255,.08)');
      /* the post, with a collar on it */
      px(c, mid - 2, sy + 5, 4, h - sy - 10, p.K);
      px(c, mid - 1, sy + 5, 2, h - sy - 10, p.s);
      px(c, mid - 3, sy + 7, 6, 2, p.K);
      px(c, mid - 2, sy + 7, 4, 1, p.S);
      /* the base: the near arms longer than the far, so it sits in depth */
      px(c, 2, h - 4, w - 4, 2, p.K);
      px(c, 3, h - 4, w - 6, 1, p.s);
      px(c, 4, h - 6, w - 8, 1, 'rgba(0,0,0,.34)');
      for (const [cx, lift] of [[2, 0], [mid - 1, 1], [w - 5, 0]]) {
        px(c, cx, h - 2 - lift, 3, 2, p.K);
        px(c, cx, h - 2 - lift, 1, 1, p.s);
        px(c, cx + 1, h - 3 - lift, 1, 1, 'rgba(255,255,255,.10)');
      }
      return o.cv;
    });
  }

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

  /* ============================================================
     THE TWO SURFACES EVERY ROOM IS MADE OF.

     A wall used to be a dithered field with a rail across it and a
     floor was boards or lino with one bright line at the top. At
     twice the resolution that is what they read as, too: two flat
     fields with a seam. What a room actually has, and what these
     now draw, is a SECOND READ -- the things you only notice on
     the second look, which are the things that make the first look
     convincing:

       the skirting     a board at the bottom with a lit top edge
                        and a line of dust in the angle behind it
       the falloff      darker at the ceiling and darker again at
                        the floor, because light comes from the
                        middle of a room, not from everywhere
       the scuffs       chair-back height, where chairs go
       the sockets      a plate and a conduit run, once or twice
       the contact      a hard shadow in the wall-floor angle, and
                        a band of light bounced back off the floor
       the wear         a walked path down the middle of the floor,
                        grit in the corners, and scratch arcs where
                        a door swings
     ============================================================ */
  function wall(w, h, opt) {
    opt = opt || {};
    const key = 'wall:' + w + 'x' + h + ':' + (opt.tone || 'green') + ':' + (opt.seed || 0)
      + ':' + (opt.railY === undefined ? 'd' : opt.railY);
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
        /* and the grout going at the joins, which is what says old tile */
        const rg = U.mulberry32((opt.seed || 1) * 17);
        for (let i = 0; i < Math.round(w / 26); i++) {
          const gx = Math.floor(rg() * (w - 12)), gy = 2 + Math.floor(rg() * (railY - 12));
          px(c, gx, gy, 12, 1, 'rgba(0,0,0,.20)');
        }
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

      /* ---- THE SECOND READ ---- */
      /* the falloff: the ceiling angle and the floor angle both go dark,
         because a room is lit from the middle of itself */
      for (let y = 0; y < Math.min(14, h); y++) {
        px(c, 0, y, w, 1, 'rgba(0,0,0,' + (0.30 * (1 - y / 14)).toFixed(3) + ')');
      }
      for (let i = 0; i < 10; i++) {
        px(c, 0, h - 1 - i, w, 1, 'rgba(0,0,0,' + (0.26 * (1 - i / 10)).toFixed(3) + ')');
      }
      /* the skirting board, and the dust in the angle above it */
      const skH = Math.max(3, Math.round(h * 0.045));
      px(c, 0, h - skH, w, skH, T[2]);
      px(c, 0, h - skH, w, 1, T[3]);
      px(c, 0, h - skH + 1, w, 1, 'rgba(255,255,255,.09)');
      px(c, 0, h - 2, w, 2, 'rgba(0,0,0,.44)');
      dither(c, 0, h - skH - 2, w, 2, 'rgba(0,0,0,.28)', 0.30, (opt.seed || 1) * 5);
      /* scuffs at chair-back height, where chairs go */
      for (let i = 0; i < Math.round(w / 70); i++) {
        const sx = Math.floor(rng() * (w - 26));
        const sy = railY + Math.round((h - railY - skH) * (0.18 + rng() * 0.30));
        dither(c, sx, sy, 20 + Math.floor(rng() * 14), 3, 'rgba(0,0,0,.24)', 0.34, sx);
        px(c, sx + 2, sy - 1, 14, 1, 'rgba(255,255,255,.05)');
      }
      /* a socket and a conduit run, once or twice along the wall */
      for (let i = 0; i < Math.max(1, Math.round(w / 240)); i++) {
        const sx = 40 + Math.floor(rng() * Math.max(1, w - 90));
        const sy = h - skH - 9;
        px(c, sx, sy, 8, 7, 'rgba(0,0,0,.44)');
        px(c, sx + 1, sy + 1, 6, 5, '#3a4046');
        px(c, sx + 1, sy + 1, 6, 1, '#525a62');
        px(c, sx + 2, sy + 2, 2, 2, '#12161a');
        px(c, sx + 4, sy + 2, 2, 2, '#12161a');
        px(c, sx + 3, sy - 12, 2, 12, 'rgba(0,0,0,.34)');
        px(c, sx + 3, sy - 12, 1, 12, 'rgba(255,255,255,.06)');
      }
      /* the picture rail's own shadow, so it stands off the wall */
      px(c, 0, railY + 1, w, 2, 'rgba(0,0,0,.22)');
      return o.cv;
    });
  }

  /* floorboards or lino, with a light sheen and worn patches */
  function floor(w, h, opt) {
    opt = opt || {};
    const key = 'floor:' + w + 'x' + h + ':' + (opt.tone || 'board') + ':' + (opt.seed || 0);
    return cached(key, () => {
      const o = cv(w, h), c = o.c;
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
        const rng0 = U.mulberry32((opt.seed || 1) * 41);
        for (let y = 0; y < h; y += 7) {
          for (let x = Math.floor(rng0() * 40); x < w; x += 40 + Math.floor(rng0() * 50)) {
            px(c, x, y, 1, 7, 'rgba(0,0,0,.4)');
          }
        }
      }

      /* ---- THE SECOND READ ---- */
      const rng = U.mulberry32((opt.seed || 3) * 53);
      /* the wall's shadow in the angle, hard, then LIGHT BOUNCED BACK off
         the floor a few rows down -- one line at four per cent white was
         the only thing standing between a wall and a floor before */
      for (let i = 0; i < 6; i++) {
        px(c, 0, i, w, 1, 'rgba(0,0,0,' + (0.42 * (1 - i / 6)).toFixed(3) + ')');
      }
      px(c, 0, 6, w, 2, 'rgba(255,255,255,.055)');
      px(c, 0, 8, w, 1, 'rgba(255,255,255,.025)');
      /* the walked path: everybody uses the middle of a room, so the middle
         of the floor is polished and the edges are not */
      const pTop = Math.round(h * 0.16), pBot = h;
      for (let y = pTop; y < pBot; y++) {
        const t = (y - pTop) / Math.max(1, pBot - pTop);
        const hw = Math.round(w * (0.20 + t * 0.26));
        dither(c, Math.round(w / 2 - hw), y, hw * 2, 1, 'rgba(255,255,255,.05)',
          0.16 + t * 0.10, y * 7);
      }
      /* grit and dropped nothing, heavier at the back where nobody sweeps */
      for (let i = 0; i < Math.round(w / 9); i++) {
        const gx = Math.floor(rng() * w);
        const gy = Math.floor(Math.pow(rng(), 2.1) * h);
        px(c, gx, gy, 1 + (rng() < 0.2 ? 1 : 0), 1, 'rgba(0,0,0,.30)');
      }
      for (let i = 0; i < Math.round(w / 130); i++) {          /* wear patches */
        const px2 = Math.floor(rng() * (w - 40)), py = Math.floor(rng() * (h - 14));
        for (let k = 0; k < 5; k++) {
          dither(c, px2 + k * 2, py + k, 34 - k * 5, 2, 'rgba(255,255,255,.05)', 0.22, px2 + k);
        }
      }
      /* and the arc a door scratches, if the room says where a door is */
      if (opt.doorX !== undefined) {
        for (let a = 0; a < 26; a++) {
          const th = (a / 25) * Math.PI * 0.42;
          const r = opt.doorR || 34;
          px(c, Math.round(opt.doorX + Math.cos(th) * r),
            Math.round(1 + Math.sin(th) * r * 0.34), 2, 1, 'rgba(255,255,255,.05)');
        }
      }
      /* the darkest rows are the ones closest to the lens */
      for (let i = 0; i < 8; i++) {
        px(c, 0, h - 1 - i, w, 1, 'rgba(0,0,0,' + (0.20 * (1 - i / 8)).toFixed(3) + ')');
      }
      return o.cv;
    });
  }

  /* ============================================================
     STANDING SOMETHING ON THE FLOOR.

     Every stick of furniture in this game was blitted at an x and
     a y with nothing under it, and a cabinet with nothing under it
     floats however carefully its feet are drawn. This puts the
     shadow down first -- hard and tight along the foot, spreading
     and fading out to one side -- and then the thing on top of it.
     The side it spreads to is the side away from the light, which
     for an interior in this game is overhead and slightly left.
     ============================================================ */
  function stand(c, img, x, y, o) {
    o = o || {};
    const w = img.width, h = img.height;
    const fy = y + h - 1;
    const dir = o.dir === undefined ? 1 : o.dir;
    const a = o.a === undefined ? 1 : o.a;
    const len = Math.round(w * (o.len === undefined ? 0.34 : o.len));
    for (let i = 6; i >= 1; i--) {
      const t = i / 6;
      const ex = Math.round(x + w / 2 + dir * len * t);
      px(c, ex - Math.round(w * 0.5 * (1 - t * 0.5)), fy + Math.round(t * 2),
        Math.max(2, Math.round(w * (1 - t * 0.5))),
        Math.max(1, Math.round(3 - t * 2)),
        'rgba(8,10,15,' + (a * 0.30 * (1 - t) * (1 - t * 0.5)).toFixed(3) + ')');
    }
    px(c, x + 1, fy, w - 2, 2, 'rgba(6,8,12,' + (a * 0.46).toFixed(3) + ')');
    px(c, x + 2, fy + 1, w - 4, 1, 'rgba(4,5,8,' + (a * 0.34).toFixed(3) + ')');
    c.drawImage(img, x, y);
    return img;
  }

  /* ============================================================
     THE CITY, SEEN THROUGH A HOLE IN A WALL.

     A room can declare an opening with `sky: true` and the runtime
     drops DAY.sky in behind it. Sized to the whole room and then
     clipped to a seventy-by-forty doorway, what that produces at
     nine in the morning is a rectangle of flat pale blue -- four
     times brighter than the green room around it, no detail in it
     at all, and the single loudest object in the precinct. It is
     the "light filter over everything" complaint in one prop.

     A window onto a city shows the CITY. Two ranks of roof against
     the sky, the far one hazed so the sky comes through it and the
     near one solid; chimneys, cowls, dormers, aerials, a wire
     between two stacks, a landmark once per run, and lit windows
     after dark. Returned with the sky left TRANSPARENT, so the
     caller draws it over whatever DAY put there, and twice at a
     parallax offset so it slides at a third of the room's rate.
     ============================================================ */
  function vista(w, h, seed, lit) {
    return cached('vista:' + w + 'x' + h + ':' + (seed || 0) + ':' + (lit ? 1 : 0), () => {
      const o = cv(w, h), c = o.c;
      const rng = U.mulberry32((seed || 1) * 71 + 13);
      const HAZE = 'rgba(96,116,140,.52)';
      const HAZE_T = 'rgba(140,162,186,.60)';
      const NEAR = '#161c26';
      const NEAR_T = '#232c38';
      const WARM = '#ffd75e';
      const COOL = 'rgba(150,182,210,.44)';

      /* ---- the far rank: hazed, so the sky reads through it ---- */
      let x = -6;
      while (x < w) {
        const bw = 8 + Math.floor(rng() * 16);
        const bh = Math.round(h * (0.22 + rng() * 0.24));
        px(c, x, h - bh, bw, bh, HAZE);
        px(c, x, h - bh, bw, 1, HAZE_T);
        if (rng() < 0.4) px(c, x + Math.floor(bw / 2), h - bh - 3, 2, 3, HAZE);
        /* a few windows in it, but only as smudges at this distance */
        for (let ly = h - bh + 3; ly < h - 2; ly += 4) {
          for (let lx = x + 2; lx < x + bw - 2; lx += 4) {
            if (rng() < (lit ? 0.20 : 0.07)) px(c, lx, ly, 2, 2, COOL);
          }
        }
        x += bw + 1 + Math.floor(rng() * 3);
      }
      /* the haze bank sitting on the far roofline */
      for (let i = 0; i < 5; i++) {
        px(c, 0, Math.round(h * 0.50) + i, w, 1,
          'rgba(168,190,212,' + (0.10 - i * 0.018).toFixed(3) + ')');
      }

      /* ---- the near rank: solid, with everything a roof has on it ---- */
      const stacks = [];
      x = -8;
      while (x < w) {
        const bw = 12 + Math.floor(rng() * 22);
        const bh = Math.round(h * (0.40 + rng() * 0.34));
        const top = h - bh;
        px(c, x, top, bw, bh, NEAR);
        px(c, x, top, bw, 1, NEAR_T);
        px(c, x, top + 1, bw, 1, 'rgba(0,0,0,.40)');
        /* the mansard slope on some of them, which is what says Paris */
        if (rng() < 0.55) {
          for (let i = 0; i < 5; i++) {
            px(c, x + i, top - 5 + i, bw - i * 2, 1, i < 2 ? NEAR_T : NEAR);
          }
          /* and a dormer in it */
          if (bw > 16) {
            const dx = x + Math.floor(bw / 2) - 3;
            px(c, dx, top - 6, 7, 7, NEAR);
            px(c, dx + 1, top - 5, 5, 4, lit ? WARM : COOL);
            px(c, dx - 1, top - 7, 9, 2, NEAR_T);
          }
        }
        /* chimneys and cowls */
        const nch = 1 + Math.floor(rng() * 2);
        for (let k = 0; k < nch; k++) {
          const cxx = x + 2 + Math.floor(rng() * Math.max(1, bw - 6));
          const chh = 4 + Math.floor(rng() * 6);
          px(c, cxx, top - chh, 4, chh, NEAR);
          px(c, cxx, top - chh, 4, 1, '#3a4450');
          if (rng() < 0.5) { px(c, cxx, top - chh - 2, 4, 2, '#2b3340'); stacks.push([cxx + 2, top - chh - 2]); }
          else stacks.push([cxx + 2, top - chh]);
        }
        /* the windows, in rows, because a building has floors */
        for (let ly = top + 5; ly < h - 3; ly += 6) {
          for (let lx = x + 3; lx < x + bw - 3; lx += 6) {
            if (rng() < (lit ? 0.34 : 0.12)) {
              px(c, lx, ly, 3, 4, rng() < 0.6 ? WARM : COOL);
              px(c, lx, ly, 3, 1, 'rgba(255,255,255,.30)');
            } else {
              px(c, lx, ly, 3, 4, 'rgba(0,0,0,.30)');
            }
          }
        }
        x += bw + 1 + Math.floor(rng() * 4);
      }
      /* the aerials, and one wire slung between two stacks */
      for (const [sx, sy] of stacks) {
        if (rng() < 0.4) {
          px(c, sx, sy - 5, 1, 5, '#39424e');
          for (let i = 0; i < 3; i++) px(c, sx - 2, sy - 5 + i * 2, 5, 1, '#39424e');
        }
      }
      for (let i = 0; i + 1 < stacks.length; i += 3) {
        const a = stacks[i], bq = stacks[i + 1];
        if (!bq || Math.abs(bq[0] - a[0]) > w * 0.5) continue;
        const dx = bq[0] - a[0];
        for (let k = 0; k <= Math.abs(dx); k++) {
          const t = k / Math.max(1, Math.abs(dx));
          px(c, a[0] + Math.round(dx * t),
            Math.round(a[1] + (bq[1] - a[1]) * t + Math.sin(t * Math.PI) * 3), 1, 1,
            'rgba(24,30,40,.8)');
        }
      }
      /* ONE LANDMARK, so the view is of somewhere rather than of buildings */
      const mx = Math.round(w * (0.24 + rng() * 0.5));
      const mh = Math.round(h * 0.92);
      px(c, mx - 7, h - mh, 14, mh, 'rgba(70,86,106,.66)');
      px(c, mx - 7, h - mh, 14, 1, 'rgba(150,172,196,.70)');
      px(c, mx - 10, h - Math.round(mh * 0.72), 20, 3, 'rgba(70,86,106,.66)');
      for (let i = 0; i < 8; i++) {                      /* the dome on it */
        const rw = Math.round(13 - i * 1.4);
        px(c, mx - Math.round(rw / 2), h - mh - 8 + i, rw, 1,
          i < 2 ? 'rgba(160,182,206,.70)' : 'rgba(84,102,124,.66)');
      }
      px(c, mx - 1, h - mh - 14, 2, 7, 'rgba(84,102,124,.72)');
      px(c, mx - 1, h - mh - 16, 2, 2, lit ? WARM : 'rgba(180,200,220,.7)');
      /* and the pigeons, because there always are */
      for (let i = 0; i < 3; i++) {
        const bx2 = Math.floor(rng() * w), by2 = Math.round(h * (0.16 + rng() * 0.2));
        px(c, bx2, by2, 3, 1, 'rgba(30,36,46,.7)');
        px(c, bx2 + 1, by2 - 1, 1, 1, 'rgba(30,36,46,.7)');
      }
      return o.cv;
    });
  }

  return {
    cv, cached, px, box, dither, grain, rivets, paint, art,
    desk, chair, cabinet, lockers, cell, window: window_, radiator,
    corkboard, bed, barCounter, crate, hangLamp, pipes, wall, floor, vista, stand,
  };
})();
