/* ============================================================
   THE FURNITURE SHOP.

   Every room in this game was dressed by hand, in place, out of
   ART.box and ART.px: a desk here, a cabinet there, and whenever
   a room needed something nobody had drawn yet it got a rectangle
   with a highlight on the top edge. That is why the places all
   had the same silhouette -- boxes of different sizes against a
   wall -- and why a bar with nothing on its walls stayed a bar
   with nothing on its walls.

   So there is a catalogue now. Every piece:

     - is authored at whatever size it is asked for, in fractions
       of that size, so a sideboard in a small room and a sideboard
       in a big one are the same sideboard;
     - is CACHED by name and size, because these get drawn once
       into a room canvas and then never again;
     - carries its own second read -- wear where hands go, a lit
       top edge, a shadow under the overhang, joints, fixings,
       the dirt that collects in its corners;
     - is SATURATED. The walls went from a third chroma to two
       thirds and the furniture has to come with them, or a
       painted room fills up with grey boxes. Upholstery, enamel,
       lacquer and paint are where a cartoon interior keeps its
       colour;
     - reports where it stands (cv.foot) and how tall it is at the
       front (cv.top), so the room can put things ON it and the
       cast can stand BEHIND it.

   Colours come in as a PALETTE NAME rather than a hex, so a room
   can order the same armchair in oxblood, bottle green or mustard
   and get one that belongs in it.
   ============================================================ */
const FURN = (() => {

  const cv = (w, h) => ART.cv(w, h);
  const px = (c, x, y, w, h, col) => ART.px(c, x, y, w, h, col);
  const box = (c, x, y, w, h, o) => ART.box(c, x, y, w, h, o);
  const grain = (c, x, y, w, h, a, b, s) => ART.grain(c, x, y, w, h, a, b, s);
  const dith = (c, x, y, w, h, col, d, s) => ART.dither(c, x, y, w, h, col, d, s);

  /* ---- THE MATERIALS. Named, saturated, and always four steps: the lit
         edge, the body, the shade and the ink. A material with three steps
         is a colour with a highlight on it. ---- */
  const MAT = {
    /* woods */
    walnut:   { lit: '#8a5a30', mid: '#5c3a1c', dk: '#361f0d', ink: '#160c04' },
    oak:      { lit: '#a8783c', mid: '#7a5324', dk: '#4a3012', ink: '#1c1206' },
    ebony:    { lit: '#3c3644', mid: '#241f2c', dk: '#141018', ink: '#0a070d' },
    pine:     { lit: '#c39a54', mid: '#96712f', dk: '#5e4517', ink: '#241a08' },
    /* upholstery, which is where the colour is */
    oxblood:  { lit: '#a8342c', mid: '#7a1f1c', dk: '#4a0f10', ink: '#1e0607' },
    bottle:   { lit: '#2f8a5a', mid: '#1c5c3a', dk: '#0e3320', ink: '#04150c' },
    petrol:   { lit: '#2f6a96', mid: '#1c4466', dk: '#0e2440', ink: '#040d1c' },
    plum:     { lit: '#8a3c96', mid: '#5c2466', dk: '#331240', ink: '#12061c' },
    mustard:  { lit: '#c8a02c', mid: '#96741a', dk: '#5e470a', ink: '#241b03' },
    teal:     { lit: '#2f9096', mid: '#1c6066', dk: '#0e3640', ink: '#04161c' },
    rose:     { lit: '#d4707c', mid: '#a04a58', dk: '#652832', ink: '#280d12' },
    cream:    { lit: '#f4efe0', mid: '#d4c8aa', dk: '#9a8d6e', ink: '#3a3324' },
    /* hard things */
    enamel:   { lit: '#eef2f2', mid: '#c6cecc', dk: '#8a9694', ink: '#2c3634' },
    steel:    { lit: '#b6c0c8', mid: '#7c8894', dk: '#4a5460', ink: '#1a2028' },
    brass:    { lit: '#ffd75e', mid: '#c8991e', dk: '#7a5c0e', ink: '#2e2205' },
    copper:   { lit: '#e08a4c', mid: '#a85c26', dk: '#663310', ink: '#251206' },
    glass:    { lit: 'rgba(214,240,250,.46)', mid: 'rgba(140,190,214,.26)',
                dk: 'rgba(60,100,124,.30)', ink: 'rgba(10,20,28,.60)' },
  };
  /* ============================================================
     AND TWO MORE STEPS, DERIVED.

     Four steps is a colour with a highlight on it, which is what
     every one of these pieces was: ink, body, shade, and one lit
     row along the top. At the sizes rooms ask for -- a dresser is
     sixty rows tall -- four steps means a flat field with a line
     on it, and the eye reads flat field.

     So each material gets a fifth and sixth step worked out from
     the ones it already has: `hi`, the lit step taken most of the
     way to white, for the specular on a moulding or a brass pull;
     and `sh`, halfway between the body and the shade, for the
     step a bevel needs between its face and its edge. Derived
     rather than hand-authored so twenty materials do not become
     forty entries that can drift apart.
     ============================================================ */
  const hex = (h) => {
    if (typeof h !== 'string' || h[0] !== '#') return null;
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16)];
  };
  const mix = (a, b, t) => {
    const A = hex(a), B = hex(b);
    if (!A || !B) return a;
    return '#' + [0, 1, 2].map(i =>
      Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join('');
  };
  Object.keys(MAT).forEach(k => {
    const m = MAT[k];
    m.hi = hex(m.lit) ? mix(m.lit, '#ffffff', 0.42) : m.lit;
    m.sh = hex(m.mid) ? mix(m.mid, m.dk, 0.5) : m.mid;
  });
  const M = (name) => MAT[name] || MAT.walnut;

  /* ---- WOOD FIGURE, not noise. `grain` scatters single pixels, which at
         this size is dirt. Timber has a few long cathedral arcs running up
         it, and three of those say `wood` where four hundred speckles say
         `static`. ---- */
  function figure(c, x, y, w, h, m, seed) {
    const n = Math.max(2, Math.round(w / 13));
    for (let i = 0; i < n; i++) {
      const bx = x + Math.round((i + 0.5) * (w / n));
      const amp = 1 + ((seed + i * 7) % 3);
      const per = 7 + ((seed + i * 5) % 9);
      for (let yy = 0; yy < h; yy++) {
        const dx = Math.round(Math.sin((yy / per) + i * 1.7) * amp);
        const cx2 = bx + dx;
        if (cx2 < x || cx2 >= x + w) continue;
        px(c, cx2, y + yy, 1, 1, m.sh);
        if (cx2 + 1 < x + w) px(c, cx2 + 1, y + yy, 1, 1, m.lit);
      }
    }
  }

  /* ---- A DRAWER PULL: a backplate and a bail, which is the one piece of
         hardware that says `furniture` rather than `box`. ---- */
  function pull(c, x, y, w, m) {
    const B = MAT.brass;
    const pw = Math.max(5, w);
    px(c, x - 1, y - 1, pw + 2, 6, B.ink);
    px(c, x, y, pw, 4, B.dk);
    px(c, x, y, pw, 1, B.mid);
    px(c, x + 1, y + 2, pw - 2, 2, B.mid);
    px(c, x + 1, y + 2, pw - 2, 1, B.lit);
    px(c, x + Math.round(pw / 2) - 1, y + 1, 2, 1, B.hi);
  }

  /* ---- AND AN ESCUTCHEON, for anything that locks ---- */
  function keyhole(c, x, y, m) {
    const B = MAT.brass;
    px(c, x - 1, y - 1, 5, 8, B.ink);
    px(c, x, y, 3, 6, B.dk);
    px(c, x, y, 3, 1, B.lit);
    px(c, x + 1, y + 2, 1, 3, '#0a0806');
    px(c, x + 1, y + 1, 1, 1, '#0a0806');
  }

  const CACHE = {};
  function make(key, w, h, draw) {
    const k = key + ':' + w + 'x' + h;
    if (CACHE[k]) return CACHE[k];
    /* ============================================================
       AND A LINE ROUND IT.

       The cast carries an ink outline and the furniture did not, so a
       room came out as outlined frogs standing in front of flat colour
       blocks. Every piece gets one now -- ONE pixel, not the cast's two,
       because a room whose chairs are outlined as heavily as the frogs
       sitting on them has no foreground left.

       It goes OUTWARD, into a margin, and the first attempt at this went
       inward instead: any opaque pixel next to a hole became ink, which
       needs no spare canvas and keeps the piece's exact bounds. It also
       EATS anything thin. A tap is three pixels wide and a brass rail is
       two rows tall; inked a pixel from each side they came back as a
       black stick and a black arc. So the drawing is done two pixels
       smaller inside its own canvas and the outline is dilated out into
       the pixel that leaves free -- same bounds, same placement, and
       nothing thin is lost.
       ============================================================ */
    const W = Math.max(4, w), H = Math.max(4, h);
    const o = cv(W, H);
    o.c.translate(1, 1);
    draw(o.c, W - 2, H - 2);
    o.c.setTransform(1, 0, 0, 1, 0, 0);
    if (typeof SPR !== 'undefined' && SPR.inkEdge) SPR.inkEdge(o.cv, false, 1);
    o.cv.foot = h - 1;
    CACHE[k] = o.cv;
    return o.cv;
  }

  /* ---- a panel with a bevel: the unit almost everything is built from ---- */
  /* ---- A RAISED PANEL, in six steps rather than a rect with a lit row.
         ink round it, a chamfer lit at the top-left and shaded at the
         bottom-right, a scribe line one step in, the field, the figure,
         and a specular on the top-left corner of the chamfer. ---- */
  function panel(c, x, y, w, h, m, o) {
    o = o || {};
    const t = Math.max(1, Math.min(3, o.bevel || (w > 26 && h > 16 ? 2 : 1)));
    px(c, x - 1, y - 1, w + 2, h + 2, m.ink);
    px(c, x, y, w, h, m.mid);
    /* the chamfer */
    px(c, x, y, w, t, m.lit);
    px(c, x, y, t, h, m.lit);
    px(c, x, y + h - t, w, t, m.dk);
    px(c, x + w - t, y, t, h, m.dk);
    /* the scribe line where the chamfer meets the field */
    if (w > 10 && h > 8) {
      px(c, x + t, y + t, w - t * 2, 1, m.sh);
      px(c, x + t, y + t, 1, h - t * 2, m.sh);
      px(c, x + t, y + h - t - 1, w - t * 2, 1, 'rgba(255,255,255,.10)');
      px(c, x + w - t - 1, y + t, 1, h - t * 2, 'rgba(255,255,255,.08)');
    }
    if (o.grain !== false && w > 12 && h > 10) {
      figure(c, x + t + 1, y + t + 1, w - (t + 1) * 2, h - (t + 1) * 2, m,
        (o.seed || 3) * 7);
    } else if (o.grain !== false) {
      grain(c, x + 1, y + 1, w - 2, h - 2, m.dk, m.lit, (o.seed || 3) * 7);
    }
    px(c, x, y, Math.min(3, t + 1), 1, m.hi);
    px(c, x, y, 1, Math.min(3, t + 1), m.hi);
  }

  /* ---- a moulded frame round an opening: a door, a mirror, a picture ---- */
  /* ---- a moulded frame round an opening: TWO steps, because one is a
         border and two is a moulding ---- */
  function moulding(c, x, y, w, h, m, t) {
    t = t || 3;
    px(c, x - 1, y - 1, w + 2, h + 2, m.ink);
    px(c, x, y, w, t, m.lit);
    px(c, x, y + h - t, w, t, m.dk);
    px(c, x, y, t, h, m.lit);
    px(c, x + w - t, y, t, h, m.dk);
    /* the second step: an ovolo one pixel in, lit the other way, so the
       frame has a section instead of an edge */
    px(c, x + 1, y + 1, w - 2, 1, m.hi);
    px(c, x + 1, y + 1, 1, h - 2, m.hi);
    px(c, x + 1, y + h - 2, w - 2, 1, m.sh);
    px(c, x + w - 2, y + 1, 1, h - 2, m.sh);
    px(c, x + t, y + t, w - t * 2, 1, 'rgba(0,0,0,.40)');
    px(c, x + t, y + t + 1, w - t * 2, 1, 'rgba(0,0,0,.18)');
    px(c, x + t, y + h - t - 1, w - t * 2, 1, 'rgba(255,255,255,.12)');
  }

  /* ---- turned legs, which is what stops a table being a plank on blocks ---- */
  function legs(c, x, y, w, h, m, n, o) {
    o = o || {};
    const lw = Math.max(3, Math.round(w * (o.lw || 0.07)));
    for (let i = 0; i < n; i++) {
      const lx = Math.round(x + (w - lw) * (n === 1 ? 0.5 : i / (n - 1)));
      /* TAPERED, and with a foot on it. A leg of constant width is a
         table leg the way a rect is a table: the taper and the pad at
         the bottom are the whole difference. */
      for (let yy = 0; yy < h; yy++) {
        const t2 = yy / Math.max(1, h - 1);
        const ww = Math.max(2, lw - Math.round(t2 * (lw > 5 ? 2 : 1)));
        const lx2 = lx + ((lw - ww) >> 1);
        px(c, lx2 - 1, y + yy, ww + 2, 1, m.ink);
        px(c, lx2, y + yy, ww, 1, m.mid);
        px(c, lx2, y + yy, Math.max(1, ww >> 1), 1, m.lit);
        px(c, lx2 + ww - 1, y + yy, 1, 1, m.dk);
      }
      /* the turning: three collars down it, each with a lit shoulder */
      for (let k = 1; k <= 3; k++) {
        const ky = y + Math.round(h * (k / 4));
        px(c, lx - 1, ky, lw + 2, 3, m.ink);
        px(c, lx - 1, ky, lw + 2, 2, m.dk);
        px(c, lx - 1, ky, lw + 2, 1, m.hi);
      }
      /* and the pad it stands on */
      px(c, lx - 2, y + h - 2, lw + 4, 2, m.ink);
      px(c, lx - 1, y + h - 2, lw + 2, 1, m.mid);
      if (o.castor) {
        px(c, lx - 1, y + h - 2, lw + 2, 3, MAT.steel.ink);
        px(c, lx, y + h - 2, lw, 2, MAT.steel.mid);
      }
    }
  }

  /* ============================================================
     THE CATALOGUE
     ============================================================ */
  const PIECES = {};
  const piece = (name, fn) => { PIECES[name] = fn; };

  /* ---- 1. AN ARMCHAIR, seen three-quarters from the side. Wings, a
          seat cushion that sags, a skirt, and a worn arm-top where a hand
          has been going for thirty years. ---- */
  piece('armchair', (c, w, h, o) => {
    const m = M(o.mat || 'oxblood'), wd = M(o.wood || 'walnut');
    const backT = Math.round(h * 0.06), seatY = Math.round(h * 0.56);
    /* the back, taller at the far side */
    px(c, 2, backT, w - 12, seatY - backT + 6, m.ink);
    px(c, 3, backT + 1, w - 14, seatY - backT + 4, m.mid);
    px(c, 3, backT + 1, w - 14, 2, m.lit);
    px(c, 3, backT + 1, 3, seatY - backT + 4, m.lit);
    /* the buttoning, which is what says armchair rather than box */
    for (let r = 0; r < 3; r++) {
      for (let q = 0; q < 3; q++) {
        const bx = 8 + q * Math.round((w - 26) / 2.4);
        const by = backT + 6 + r * Math.round((seatY - backT) / 3.4);
        if (bx > w - 14) continue;
        px(c, bx, by, 2, 2, m.dk);
        px(c, bx, by, 1, 1, m.lit);
        px(c, bx - 2, by + 2, 5, 1, 'rgba(0,0,0,.20)');
      }
    }
    /* the near arm: a roll, with the top worn pale */
    const armY = Math.round(h * 0.40);
    px(c, w - 14, armY - 1, 13, seatY - armY + 8, m.ink);
    px(c, w - 13, armY, 11, seatY - armY + 6, m.mid);
    px(c, w - 13, armY, 11, 3, m.lit);
    px(c, w - 12, armY + 1, 9, 1, 'rgba(255,255,255,.16)');
    px(c, w - 5, armY + 3, 3, seatY - armY + 3, m.dk);
    /* the seat cushion, sagging in the middle */
    for (let x = 3; x < w - 3; x++) {
      const t = (x - 3) / Math.max(1, w - 7);
      const sag = Math.round(Math.sin(Math.PI * t) * 2);
      px(c, x, seatY + sag, 1, 8, m.mid);
      px(c, x, seatY + sag, 1, 2, m.lit);
      px(c, x, seatY + sag + 6, 1, 2, m.dk);
    }
    px(c, 2, seatY + 8, w - 4, 2, m.ink);
    /* the skirt and the feet */
    px(c, 3, seatY + 10, w - 6, h - seatY - 14, wd.mid);
    px(c, 3, seatY + 10, w - 6, 1, wd.lit);
    grain(c, 4, seatY + 11, w - 8, h - seatY - 16, wd.dk, wd.lit, (o.seed || 1) * 5);
    legs(c, 3, h - 5, w - 6, 5, wd, 2, { lw: 0.09 });
  });

  /* ---- 2. A SOFA. Same language, three cushions, longer. ---- */
  piece('sofa', (c, w, h, o) => {
    const m = M(o.mat || 'bottle'), wd = M(o.wood || 'walnut');
    const backT = Math.round(h * 0.08), seatY = Math.round(h * 0.58);
    px(c, 2, backT, w - 4, seatY - backT + 6, m.ink);
    px(c, 3, backT + 1, w - 6, seatY - backT + 4, m.mid);
    px(c, 3, backT + 1, w - 6, 2, m.lit);
    /* three back cushions with a seam between each */
    for (let i = 1; i < 3; i++) {
      const sx = 3 + Math.round((w - 6) * i / 3);
      px(c, sx, backT + 2, 1, seatY - backT + 2, m.dk);
      px(c, sx + 1, backT + 2, 1, seatY - backT + 2, m.lit);
    }
    dith(c, 4, backT + 2, w - 8, seatY - backT, m.dk, 0.10, (o.seed || 2) * 11);
    /* both arms, the near one lower */
    for (const ax of [2, w - 13]) {
      px(c, ax, Math.round(h * 0.40) - 1, 12, seatY - Math.round(h * 0.40) + 8, m.ink);
      px(c, ax + 1, Math.round(h * 0.40), 10, seatY - Math.round(h * 0.40) + 6, m.mid);
      px(c, ax + 1, Math.round(h * 0.40), 10, 3, m.lit);
    }
    /* the seat, three cushions, each sagging */
    for (let i = 0; i < 3; i++) {
      const x0 = 13 + Math.round((w - 26) * i / 3), cw = Math.round((w - 26) / 3) - 1;
      for (let x = x0; x < x0 + cw; x++) {
        const t = (x - x0) / Math.max(1, cw - 1);
        const sag = Math.round(Math.sin(Math.PI * t) * 2);
        px(c, x, seatY + sag, 1, 9, m.mid);
        px(c, x, seatY + sag, 1, 2, m.lit);
        px(c, x, seatY + sag + 7, 1, 2, m.dk);
      }
      px(c, x0 - 1, seatY, 1, 10, m.ink);
    }
    px(c, 2, seatY + 10, w - 4, 2, m.ink);
    px(c, 3, seatY + 12, w - 6, h - seatY - 16, wd.mid);
    px(c, 3, seatY + 12, w - 6, 1, wd.lit);
    legs(c, 4, h - 5, w - 8, 5, wd, 3, { lw: 0.05 });
  });

  /* ---- 3. A SIDEBOARD: two doors, a drawer run, a plinth, and the
          things people leave on top of it. ---- */
  piece('sideboard', (c, w, h, o) => {
    const wd = M(o.mat || 'walnut'), br = M('brass');
    /* the top slab, overhanging both ends */
    px(c, 0, 0, w, 5, wd.ink);
    px(c, 1, 1, w - 2, 3, wd.mid);
    px(c, 1, 1, w - 2, 1, wd.lit);
    grain(c, 2, 2, w - 4, 2, wd.dk, wd.lit, (o.seed || 1) * 3);
    px(c, 1, 4, w - 2, 1, 'rgba(0,0,0,.44)');
    /* the carcase */
    px(c, 3, 5, w - 6, h - 10, wd.ink);
    px(c, 4, 6, w - 8, h - 12, wd.dk);
    /* a drawer run across the top */
    const dh = Math.round((h - 12) * 0.26);
    const nd = Math.max(2, Math.round(w / 26));
    for (let i = 0; i < nd; i++) {
      const dx = 5 + Math.round((w - 10) * i / nd), dw = Math.round((w - 10) / nd) - 2;
      panel(c, dx, 8, dw, dh, wd, { seed: (o.seed || 1) + i });
      px(c, dx + (dw >> 1) - 4, 8 + (dh >> 1) - 1, 9, 3, br.ink);
      px(c, dx + (dw >> 1) - 4, 8 + (dh >> 1) - 1, 9, 2, br.mid);
      px(c, dx + (dw >> 1) - 4, 8 + (dh >> 1) - 1, 9, 1, br.lit);
    }
    /* two doors under it, with a moulded field in each */
    const doorY = 8 + dh + 3, doorH = h - doorY - 8;
    for (let i = 0; i < 2; i++) {
      const dx = 5 + Math.round((w - 10) * i / 2), dw = Math.round((w - 10) / 2) - 2;
      panel(c, dx, doorY, dw, doorH, wd, { seed: (o.seed || 1) + 9 + i });
      moulding(c, dx + 4, doorY + 4, dw - 8, doorH - 8, wd, 2);
      px(c, dx + dw - 7, doorY + (doorH >> 1) - 2, 3, 5, br.ink);
      px(c, dx + dw - 7, doorY + (doorH >> 1) - 2, 2, 4, br.mid);
    }
    /* the plinth, and the shadow it casts back under itself */
    px(c, 3, h - 8, w - 6, 8, wd.ink);
    px(c, 4, h - 7, w - 8, 6, wd.dk);
    px(c, 4, h - 7, w - 8, 1, wd.mid);
    px(c, 4, h - 3, w - 8, 3, 'rgba(0,0,0,.44)');
  });

  /* ---- 4. A DRESSER: a sideboard with open shelves over it, and plates
          standing on edge in them. ---- */
  piece('dresser', (c, w, h, o) => {
    const wd = M(o.mat || 'pine');
    const baseY = Math.round(h * 0.52);
    /* the rack above */
    px(c, 2, 0, w - 4, baseY, wd.ink);
    px(c, 3, 1, w - 6, baseY - 2, wd.dk);
    px(c, 3, 1, w - 6, 2, wd.mid);
    px(c, 0, 0, w, 4, wd.ink);
    px(c, 1, 1, w - 2, 2, wd.lit);
    const shelves = Math.max(2, Math.round(baseY / 16));
    for (let i = 1; i <= shelves; i++) {
      const sy = Math.round(baseY * i / (shelves + 0.4));
      px(c, 3, sy, w - 6, 3, wd.ink);
      px(c, 3, sy, w - 6, 2, wd.mid);
      px(c, 3, sy, w - 6, 1, wd.lit);
      px(c, 3, sy + 3, w - 6, 2, 'rgba(0,0,0,.40)');
      /* plates on edge, and the odd cup hanging under the shelf */
      const pal = [M('cream'), M('teal'), M('rose'), M('mustard')];
      for (let q = 0; q < Math.round((w - 10) / 11); q++) {
        const pm = pal[(q + i) % pal.length];
        const pxx = 6 + q * 11, r = Math.min(5, Math.round(baseY / (shelves + 1) * 0.32));
        PIX.disc(c, pxx + 4, sy - r - 1, r + 1, pm.ink);
        PIX.disc(c, pxx + 4, sy - r - 1, r, pm.mid);
        PIX.disc(c, pxx + 3, sy - r - 2, Math.max(1, r - 2), pm.lit);
        if ((q + i) % 3 === 0) {
          px(c, pxx + 2, sy + 5, 6, 4, pm.ink);
          px(c, pxx + 3, sy + 5, 4, 3, pm.mid);
          px(c, pxx + 7, sy + 6, 2, 1, pm.lit);
        }
      }
    }
    /* the base cupboard */
    px(c, 0, baseY, w, 5, wd.ink);
    px(c, 1, baseY + 1, w - 2, 3, wd.mid);
    px(c, 1, baseY + 1, w - 2, 1, wd.lit);
    px(c, 2, baseY + 5, w - 4, h - baseY - 8, wd.ink);
    for (let i = 0; i < 2; i++) {
      const dx = 4 + Math.round((w - 8) * i / 2), dw = Math.round((w - 8) / 2) - 2;
      panel(c, dx, baseY + 7, dw, h - baseY - 14, wd, { seed: (o.seed || 1) + i });
      px(c, dx + dw - 6, baseY + 7 + ((h - baseY - 14) >> 1), 3, 4, M('brass').mid);
    }
    px(c, 2, h - 4, w - 4, 4, wd.ink);
    px(c, 3, h - 3, w - 6, 2, wd.dk);
  });

  /* ---- 5. A BOOKCASE, with books that are not all the same height. ---- */
  piece('bookcase', (c, w, h, o) => {
    const wd = M(o.mat || 'oak');
    const rng = U.mulberry32((o.seed || 1) * 61);
    px(c, 0, 0, w, h, wd.ink);
    px(c, 2, 2, w - 4, h - 4, wd.dk);
    px(c, 0, 0, w, 3, wd.mid);
    px(c, 0, 0, w, 1, wd.lit);
    px(c, 0, 0, 3, h, wd.mid);
    px(c, w - 3, 0, 3, h, wd.dk);
    const shelves = Math.max(2, Math.round(h / 22));
    const sp = (h - 6) / shelves;
    const cols = [M('oxblood'), M('bottle'), M('petrol'), M('mustard'),
      M('plum'), M('walnut'), M('teal'), M('cream')];
    for (let i = 0; i < shelves; i++) {
      const sy = Math.round(3 + sp * (i + 1)) - 3;
      /* the books, standing, leaning, and one lot fallen over */
      let x = 4;
      const lean = rng() < 0.3;
      while (x < w - 6) {
        const bw = 2 + Math.floor(rng() * 4);
        const bh = Math.round(sp * (0.52 + rng() * 0.34));
        const m = cols[Math.floor(rng() * cols.length)];
        if (x + bw > w - 5) break;
        px(c, x, sy - bh, bw, bh, m.ink);
        px(c, x, sy - bh, bw, bh - 1, m.mid);
        px(c, x, sy - bh, 1, bh - 1, m.lit);
        if (bh > 8) px(c, x, sy - bh + 3, bw, 1, M('brass').mid);
        x += bw + (rng() < 0.2 ? 2 : 0);
      }
      if (lean && x < w - 14) {
        /* a stack lying on its side at the end of the row */
        for (let k = 0; k < 3; k++) {
          const m = cols[(i + k) % cols.length];
          px(c, x + 1, sy - 3 - k * 3, Math.min(12, w - 6 - x), 3, m.ink);
          px(c, x + 1, sy - 3 - k * 3, Math.min(12, w - 6 - x), 2, m.mid);
        }
      }
      px(c, 2, sy, w - 4, 3, wd.ink);
      px(c, 2, sy, w - 4, 2, wd.mid);
      px(c, 2, sy, w - 4, 1, wd.lit);
    }
  });

  /* ---- 6. A STANDING LAMP: a shade with light coming THROUGH it, a
          brass stem and a weighted foot. ---- */
  piece('standlamp', (c, w, h, o) => {
    const br = M('brass'), sm = M(o.mat || 'mustard');
    const shH = Math.round(h * 0.24), shW = w - 2;
    /* the shade, wider at the bottom, lit from inside */
    for (let y = 0; y < shH; y++) {
      const t = y / Math.max(1, shH - 1);
      const ww = Math.round(shW * (0.56 + t * 0.44));
      const x0 = Math.round((w - ww) / 2);
      px(c, x0 - 1, y, ww + 2, 1, sm.ink);
      px(c, x0, y, ww, 1, sm.mid);
      px(c, x0, y, Math.max(1, Math.round(ww * 0.22)), 1, sm.lit);
      if (t > 0.5) px(c, x0, y, ww, 1, 'rgba(255,232,168,' + ((t - 0.5) * 0.34).toFixed(3) + ')');
    }
    px(c, Math.round((w - shW) / 2), shH - 1, shW, 2, sm.dk);
    /* the bulb glow under the shade */
    for (let i = 0; i < 5; i++) {
      const ww = Math.round(shW * (0.9 - i * 0.1));
      px(c, Math.round((w - ww) / 2), shH + 1 + i, ww, 1,
        'rgba(255,236,180,' + (0.24 - i * 0.045).toFixed(3) + ')');
    }
    /* the stem, with a collar */
    const sx = Math.round(w / 2) - 1;
    px(c, sx - 1, shH, 4, h - shH - 6, br.ink);
    px(c, sx, shH, 2, h - shH - 6, br.mid);
    px(c, sx, shH, 1, h - shH - 6, br.lit);
    const cy = shH + Math.round((h - shH) * 0.44);
    px(c, sx - 3, cy, 8, 3, br.ink);
    px(c, sx - 2, cy, 6, 2, br.mid);
    px(c, sx - 2, cy, 6, 1, br.lit);
    /* the foot */
    const fw = Math.round(w * 0.62);
    px(c, Math.round((w - fw) / 2), h - 6, fw, 6, br.ink);
    px(c, Math.round((w - fw) / 2) + 1, h - 5, fw - 2, 4, br.dk);
    px(c, Math.round((w - fw) / 2) + 1, h - 5, fw - 2, 1, br.mid);
  });

  /* ---- 7. A RUG. Lies on the floor, has a border and a pattern in it,
          and its ends are frayed. ---- */
  piece('rug', (c, w, h, o) => {
    const m = M(o.mat || 'oxblood'), a = M(o.trim || 'mustard');
    px(c, 1, 0, w - 2, h, m.ink);
    px(c, 2, 1, w - 4, h - 2, m.mid);
    px(c, 2, 1, w - 4, 1, m.lit);
    px(c, 2, h - 2, w - 4, 1, m.dk);
    /* the border */
    px(c, 4, 3, w - 8, 1, a.mid);
    px(c, 4, h - 4, w - 8, 1, a.mid);
    px(c, 4, 3, 1, h - 6, a.mid);
    px(c, w - 5, 3, 1, h - 6, a.mid);
    /* a repeating figure down the middle */
    const n = Math.max(2, Math.round((w - 16) / 14));
    for (let i = 0; i < n; i++) {
      const cx2 = 8 + Math.round((w - 16) * (i + 0.5) / n), cy2 = Math.round(h / 2);
      px(c, cx2 - 4, cy2 - 1, 9, 3, a.dk);
      px(c, cx2 - 1, cy2 - 3, 3, 7, a.dk);
      px(c, cx2 - 3, cy2, 7, 1, a.lit);
      px(c, cx2, cy2 - 2, 1, 5, a.lit);
    }
    dith(c, 2, 1, w - 4, h - 2, m.dk, 0.10, (o.seed || 4) * 13);
    /* the fringe, at both ends */
    for (let y = 1; y < h - 1; y += 2) {
      px(c, 0, y, 2, 1, m.dk);
      px(c, w - 2, y, 2, 1, m.dk);
    }
  });

  /* ---- 8. A MIRROR or a PICTURE in a frame, with the room in it. ---- */
  piece('picture', (c, w, h, o) => {
    const fm = M(o.mat || 'brass');
    moulding(c, 0, 0, w, h, fm, Math.max(2, Math.round(w * 0.07)));
    const t = Math.max(2, Math.round(w * 0.07));
    const iw = w - t * 2 - 2, ih = h - t * 2 - 2;
    const ix = t + 1, iy = t + 1;
    if (o.kind === 'mirror') {
      /* A MIRROR IS NOT A HOLE. At five to fifteen per cent of white over a
         near-black ground it came out as a black rectangle in a frame. What
         a mirror on a wall actually shows is the room BEHIND you, which at
         this size is a soft vertical ramp with the ceiling light at the top
         of it -- bright enough to read as glass. */
      px(c, ix, iy, iw, ih, '#3d5560');
      for (let y = 0; y < ih; y++) {
        const t = y / Math.max(1, ih - 1);
        px(c, ix, iy + y, iw, 1,
          'rgba(206,232,244,' + (0.34 - t * 0.26).toFixed(3) + ')');
      }
      /* the reflected ceiling, and the reflected far wall under it */
      px(c, ix, iy, iw, Math.max(1, Math.round(ih * 0.22)), 'rgba(236,248,255,.26)');
      px(c, ix, iy + Math.round(ih * 0.52), iw, 1, 'rgba(20,30,38,.30)');
      /* one raking streak, and the silvering going at a corner */
      for (let i = 0; i < ih; i++) {
        px(c, ix + Math.round(iw * 0.20) + i, iy + i, Math.max(2, iw >> 3), 1,
          'rgba(236,248,255,.12)');
      }
      dith(c, ix, iy + ih - 6, Math.min(10, iw), 6, 'rgba(90,70,50,.34)', 0.4, 5);
    } else {
      /* a seascape, because that is what is on every wall of every rented
         room: a horizon, a sail, a headland */
      const sky = ['#2a4a6a', '#3a5f80', '#4a7496'];
      for (let y = 0; y < ih; y++) {
        px(c, ix, iy + y, iw, 1, y < ih * 0.55 ? sky[Math.floor(y / (ih * 0.2)) % 3] : '#1d3a4a');
      }
      px(c, ix, iy + Math.round(ih * 0.55), iw, 1, 'rgba(214,236,246,.40)');
      const shx = ix + Math.round(iw * 0.34);
      px(c, shx, iy + Math.round(ih * 0.30), 1, Math.round(ih * 0.26), '#e8dcc0');
      for (let i = 0; i < Math.round(ih * 0.22); i++) {
        px(c, shx + 1, iy + Math.round(ih * 0.34) + i, Math.max(1, i >> 1), 1, '#e8dcc0');
      }
      px(c, ix + Math.round(iw * 0.62), iy + Math.round(ih * 0.48), Math.round(iw * 0.3), 4, '#24402e');
      px(c, ix, iy, iw, ih, 'rgba(60,40,20,.14)');   /* varnish gone yellow */
    }
    /* the wire it hangs on and the wall shadow under the frame */
    px(c, 1, h - 1, w - 2, 1, 'rgba(0,0,0,.44)');
  });

  /* ---- 9. CURTAINS, hung either side of a window, with a pelmet. ---- */
  piece('curtain', (c, w, h, o) => {
    const m = M(o.mat || 'plum'), br = M('brass');
    /* the pole and the pelmet */
    px(c, 0, 0, w, 3, br.ink);
    px(c, 0, 0, w, 2, br.mid);
    px(c, 0, 0, w, 1, br.lit);
    PIX.disc(c, 2, 1, 2, br.mid);
    PIX.disc(c, w - 3, 1, 2, br.mid);
    /* two drops, gathered, each with folds that read as cloth */
    const dw = Math.round(w * 0.30);
    for (const side of [0, 1]) {
      const x0 = side ? w - dw : 0;
      for (let y = 3; y < h; y++) {
        const t = (y - 3) / Math.max(1, h - 4);
        const ww = Math.round(dw * (0.78 + t * 0.22));
        const xx = side ? w - ww : 0;
        px(c, xx, y, ww, 1, m.mid);
        /* the folds */
        for (let k = 0; k < 4; k++) {
          const fx = xx + Math.round(ww * (0.14 + k * 0.24));
          px(c, fx, y, 1, 1, m.dk);
          px(c, fx + 1, y, 1, 1, m.lit);
        }
        if (t > 0.7) px(c, xx, y, ww, 1, 'rgba(0,0,0,' + ((t - 0.7) * 0.5).toFixed(3) + ')');
      }
      /* the tie-back, pulling it in at two thirds height */
      const ty = Math.round(h * 0.62);
      px(c, x0, ty, dw, 3, br.ink);
      px(c, x0, ty, dw, 2, br.mid);
      px(c, x0, ty, dw, 1, br.lit);
    }
  });

  /* ---- 10. A COOKING RANGE: enamel, a black hob, a brass rail, an oven
           door with a window in it, and a kettle's ring of heat. ---- */
  piece('range', (c, w, h, o) => {
    const en = M(o.mat || 'cream'), br = M('brass'), st = M('steel');
    px(c, 0, 4, w, h - 4, en.ink);
    px(c, 1, 5, w - 2, h - 6, en.mid);
    px(c, 1, 5, w - 2, 2, en.lit);
    px(c, 1, 5, 2, h - 6, en.lit);
    px(c, w - 3, 5, 2, h - 6, en.dk);
    /* the hob: black iron with the rings on it */
    px(c, 2, 4, w - 4, 8, '#1a1614');
    px(c, 2, 4, w - 4, 1, '#3a332c');
    const rings = Math.max(2, Math.round(w / 22));
    for (let i = 0; i < rings; i++) {
      const rx = Math.round((w - 4) * (i + 0.5) / rings) + 2;
      PIX.ring(c, rx, 8, Math.min(5, Math.round(w / (rings * 4))), 1, '#4a4038');
      PIX.disc(c, rx, 8, 2, '#0e0c0a');
      if (i === 0) PIX.ring(c, rx, 8, Math.min(5, Math.round(w / (rings * 4))), 1, 'rgba(255,120,40,.44)');
    }
    /* the brass rail across the front */
    px(c, 1, 16, w - 2, 2, br.ink);
    px(c, 2, 16, w - 4, 1, br.lit);
    /* the oven door, with a window and a handle */
    const dy = 22, dh = h - dy - 8;
    px(c, 4, dy, w - 8, dh, en.ink);
    px(c, 5, dy + 1, w - 10, dh - 2, en.dk);
    px(c, 5, dy + 1, w - 10, 1, en.mid);
    px(c, 8, dy + 5, w - 16, dh - 12, '#120e0c');
    px(c, 9, dy + 6, w - 18, dh - 14, 'rgba(255,150,60,.20)');
    px(c, 9, dy + 6, w - 18, 1, 'rgba(255,190,120,.30)');
    px(c, 6, dy + dh - 5, w - 12, 3, st.ink);
    px(c, 6, dy + dh - 5, w - 12, 2, st.mid);
    px(c, 6, dy + dh - 5, w - 12, 1, st.lit);
    /* the dials, and the towel over the rail */
    for (let i = 0; i < 3; i++) {
      const dx = 6 + i * 8;
      if (dx + 5 > w - 4) break;
      PIX.disc(c, dx + 2, 20, 2, st.ink);
      PIX.disc(c, dx + 2, 20, 1, st.lit);
    }
    px(c, w - 16, 17, 12, 14, M('teal').mid);
    px(c, w - 16, 17, 12, 2, M('teal').lit);
    for (let i = 0; i < 3; i++) px(c, w - 15, 21 + i * 4, 10, 1, M('teal').dk);
    px(c, 1, h - 4, w - 2, 4, en.ink);
    px(c, 2, h - 3, w - 4, 2, en.dk);
  });

  /* ---- 11. A WOODEN SCREEN, three leaves, for a corner. ---- */
  piece('screen', (c, w, h, o) => {
    const wd = M(o.mat || 'ebony'), cl = M(o.cloth || 'rose');
    const lw = Math.round(w / 3);
    for (let i = 0; i < 3; i++) {
      const x0 = i * lw, top = Math.round(h * (i === 1 ? 0.00 : 0.05));
      px(c, x0, top, lw - 1, h - top, wd.ink);
      px(c, x0 + 1, top + 1, lw - 3, h - top - 2, wd.mid);
      px(c, x0 + 1, top + 1, lw - 3, 2, wd.lit);
      px(c, x0 + 1, top + 1, 2, h - top - 2, wd.lit);
      /* the cloth panel. Painted in the cloth's DARK it was three slabs of
         plum with dots on them: the panel is the light thing on a screen
         and the frame is the dark thing round it. */
      px(c, x0 + 4, top + 5, lw - 9, h - top - 12, cl.mid);
      px(c, x0 + 4, top + 5, lw - 9, 1, cl.lit);
      px(c, x0 + 4, h - 8, lw - 9, 1, cl.dk);
      /* and a printed figure on it: a stem with leaves off it, twice */
      for (let k = 0; k < 2; k++) {
        const fy = top + 10 + k * Math.round((h - top - 26) / 2);
        const fx = x0 + Math.round(lw / 2) - 1;
        const fh = Math.round((h - top - 26) / 2) - 2;
        if (fh < 6) break;
        px(c, fx, fy, 1, fh, cl.dk);
        for (let q = 0; q < 3; q++) {
          const qy = fy + 2 + q * Math.round(fh / 3), dir = q % 2 ? 1 : -1;
          px(c, fx + (dir > 0 ? 1 : -4), qy, 4, 1, cl.dk);
          px(c, fx + dir * 5, qy - 1, 2, 2, cl.lit);
        }
      }
      /* the hinges */
      if (i < 2) {
        for (let k = 0; k < 2; k++) {
          px(c, x0 + lw - 2, Math.round(h * (0.28 + k * 0.4)), 3, 5, M('brass').ink);
          px(c, x0 + lw - 2, Math.round(h * (0.28 + k * 0.4)), 3, 4, M('brass').mid);
        }
      }
    }
  });

  /* ---- 12. A CLOCK on the wall: a case, a dial, hands that say a time. */
  piece('clock', (c, w, h, o) => {
    const wd = M(o.mat || 'walnut'), br = M('brass');
    /* THE DIAL HAS TO BE THE THING. A wooden bezel three pixels thick round
       a cream face with one-pixel marks came out as a dartboard: the bezel
       is thin and DARK, the face is bright, the marks are bold, and the two
       hands are the highest-contrast thing on the piece. */
    const r = Math.round(Math.min(w, Math.round(h * 0.72)) * 0.48);
    const cx2 = w >> 1, cy2 = r + 2;
    PIX.disc(c, cx2, cy2, r + 2, wd.ink);
    PIX.disc(c, cx2, cy2, r + 1, wd.dk);
    PIX.disc(c, cx2, cy2 - 1, r, wd.mid);
    PIX.disc(c, cx2, cy2, r - 1, '#0e0c0a');
    PIX.disc(c, cx2, cy2, r - 2, '#f4efe0');
    PIX.disc(c, cx2 - 1, cy2 - 1, Math.max(1, r - 5), '#fbf7ec');
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      const rr = r - 3, bold = i % 3 === 0;
      const mx = cx2 + Math.round(Math.cos(a) * rr), my = cy2 + Math.round(Math.sin(a) * rr);
      px(c, mx - (bold ? 1 : 0), my - (bold ? 1 : 0), bold ? 2 : 1, bold ? 2 : 1,
        bold ? '#1a1614' : '#6d6656');
    }
    const hh2 = (o.hour === undefined ? 10 : o.hour % 12) / 12 * Math.PI * 2 - Math.PI / 2;
    const mm = (o.min === undefined ? 10 : o.min) / 60 * Math.PI * 2 - Math.PI / 2;
    for (let i = 0; i < r - 3; i++) {
      if (i < (r - 3) * 0.56) {
        px(c, cx2 + Math.round(Math.cos(hh2) * i) - 1, cy2 + Math.round(Math.sin(hh2) * i) - 1,
          2, 2, '#141210');
      }
      if (i < (r - 3) * 0.86) {
        px(c, cx2 + Math.round(Math.cos(mm) * i), cy2 + Math.round(Math.sin(mm) * i),
          1, 1, '#141210');
      }
    }
    PIX.disc(c, cx2, cy2, 2, br.ink);
    PIX.disc(c, cx2, cy2, 1, br.mid);
    /* the pendulum case under it, if there is room */
    if (h - cy2 - r > 10) {
      const ch = h - cy2 - r;
      px(c, cx2 - 6, cy2 + r, 13, ch, wd.ink);
      px(c, cx2 - 5, cy2 + r, 11, ch - 1, wd.dk);
      px(c, cx2 - 5, cy2 + r, 3, ch - 1, wd.mid);
      px(c, cx2 - 3, cy2 + r + 2, 7, ch - 6, '#0a0806');
      px(c, cx2, cy2 + r + 2, 1, ch - 9, br.dk);
      PIX.disc(c, cx2, h - 6, 3, br.ink);
      PIX.disc(c, cx2, h - 6, 2, br.mid);
      px(c, cx2 - 6, h - 3, 13, 3, wd.ink);
      px(c, cx2 - 5, h - 3, 11, 2, wd.mid);
    }
  });

  /* ---- 13. A POT PLANT, alive or dead. ---- */
  piece('plant', (c, w, h, o) => {
    const pot = M(o.mat || 'copper');
    const dead = !!o.dead;
    const lf = dead ? M('walnut') : M('bottle');
    const potH = Math.round(h * 0.30);
    for (let y = 0; y < potH; y++) {
      const t = y / Math.max(1, potH - 1);
      const ww = Math.round(w * (0.72 - t * 0.22));
      const x0 = Math.round((w - ww) / 2);
      px(c, x0 - 1, h - potH + y, ww + 2, 1, pot.ink);
      px(c, x0, h - potH + y, ww, 1, pot.mid);
      px(c, x0, h - potH + y, Math.max(1, Math.round(ww * 0.24)), 1, pot.lit);
    }
    px(c, Math.round(w * 0.12), h - potH, Math.round(w * 0.76), 3, pot.ink);
    px(c, Math.round(w * 0.13), h - potH, Math.round(w * 0.74), 2, pot.lit);
    px(c, Math.round(w * 0.20), h - potH + 3, Math.round(w * 0.60), 2, '#241a10');
    /* the leaves: a fan of them off a short stem, drooping if it is dead */
    const rng = U.mulberry32((o.seed || 2) * 47);
    const sx = w >> 1;
    px(c, sx - 1, h - potH - Math.round(h * 0.18), 2, Math.round(h * 0.18), lf.dk);
    const n = dead ? 4 : 7;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * (0.18 + 0.64 * (i / (n - 1))) + (dead ? 0.5 : 0);
      const len = Math.round(h * (dead ? 0.16 : 0.30) * (0.7 + rng() * 0.5));
      let x = sx, y = h - potH - Math.round(h * 0.16);
      for (let k = 0; k < len; k++) {
        const droop = dead ? k * k * 0.010 : k * k * 0.004;
        x = sx + Math.cos(a) * k;
        y = h - potH - Math.round(h * 0.16) + Math.sin(a) * k + droop;
        const lw2 = Math.max(1, Math.round(3 - k / len * 2));
        px(c, Math.round(x), Math.round(y), lw2, lw2, k < len * 0.6 ? lf.mid : lf.dk);
        if (k % 4 === 0) px(c, Math.round(x), Math.round(y), 1, 1, lf.lit);
      }
    }
  });

  /* ---- 14. A CRATE / TEA CHEST, stencilled. ---- */
  piece('crate', (c, w, h, o) => {
    const wd = M(o.mat || 'pine');
    px(c, 0, 0, w, h, wd.ink);
    px(c, 1, 1, w - 2, h - 2, wd.mid);
    grain(c, 2, 2, w - 4, h - 4, wd.dk, wd.lit, (o.seed || 1) * 9);
    for (const bx of [1, w - 4]) {
      px(c, bx, 1, 3, h - 2, wd.dk);
      px(c, bx, 1, 1, h - 2, wd.lit);
    }
    for (const by of [1, h - 4]) {
      px(c, 1, by, w - 2, 3, wd.dk);
      px(c, 1, by, w - 2, 1, wd.lit);
    }
    /* the diagonal brace, and a stencil over it */
    for (let i = 0; i < w - 8; i++) {
      px(c, 4 + i, 4 + Math.round(i * (h - 10) / (w - 8)), 2, 2, wd.dk);
    }
    if (w > 22 && h > 16) {
      px(c, Math.round(w * 0.22), Math.round(h * 0.40), Math.round(w * 0.56), 2, '#2a2620');
      px(c, Math.round(w * 0.30), Math.round(h * 0.52), Math.round(w * 0.40), 2, '#2a2620');
    }
  });

  /* ---- 15. A BARREL, on its end or on its side. ---- */
  piece('barrel', (c, w, h, o) => {
    const wd = M(o.mat || 'oak'), st = M('steel');
    for (let y = 0; y < h; y++) {
      const t = y / Math.max(1, h - 1);
      const ww = Math.round(w * (0.80 + Math.sin(Math.PI * t) * 0.20));
      const x0 = Math.round((w - ww) / 2);
      px(c, x0 - 1, y, ww + 2, 1, wd.ink);
      px(c, x0, y, ww, 1, wd.mid);
      px(c, x0, y, Math.max(1, Math.round(ww * 0.20)), 1, wd.lit);
      px(c, x0 + ww - 2, y, 2, 1, wd.dk);
    }
    /* the staves and the hoops */
    for (let i = 1; i < 5; i++) {
      const sxx = Math.round(w * i / 5);
      px(c, sxx, 2, 1, h - 4, 'rgba(0,0,0,.30)');
    }
    for (const hy of [Math.round(h * 0.14), Math.round(h * 0.50), Math.round(h * 0.84)]) {
      const t = hy / Math.max(1, h - 1);
      const ww = Math.round(w * (0.80 + Math.sin(Math.PI * t) * 0.20));
      const x0 = Math.round((w - ww) / 2);
      px(c, x0 - 1, hy, ww + 2, 3, st.ink);
      px(c, x0, hy, ww, 2, st.mid);
      px(c, x0, hy, ww, 1, st.lit);
    }
    px(c, Math.round(w * 0.42), Math.round(h * 0.62), 4, 4, '#1a1208');
    px(c, Math.round(w * 0.42), Math.round(h * 0.62), 3, 3, M('brass').mid);
  });

  /* ---- 16. A BAR STOOL. ---- */
  piece('stool', (c, w, h, o) => {
    const m = M(o.mat || 'oxblood'), st = M('steel');
    const seatY = Math.round(h * 0.18);
    PIX.disc(c, w >> 1, seatY, Math.round(w * 0.46), m.ink);
    PIX.disc(c, w >> 1, seatY, Math.round(w * 0.44) - 1, m.mid);
    PIX.disc(c, w >> 1, seatY - 1, Math.round(w * 0.34), m.lit);
    px(c, Math.round(w * 0.08), seatY + Math.round(w * 0.30), Math.round(w * 0.84), 3, m.dk);
    /* the column and the ring */
    const sx = (w >> 1) - 1;
    px(c, sx - 1, seatY + Math.round(w * 0.30), 4, h - seatY - Math.round(w * 0.30) - 3, st.ink);
    px(c, sx, seatY + Math.round(w * 0.30), 2, h - seatY - Math.round(w * 0.30) - 3, st.mid);
    px(c, sx, seatY + Math.round(w * 0.30), 1, h - seatY - Math.round(w * 0.30) - 3, st.lit);
    const ry = Math.round(h * 0.70);
    px(c, Math.round(w * 0.16), ry, Math.round(w * 0.68), 2, st.ink);
    px(c, Math.round(w * 0.18), ry, Math.round(w * 0.64), 1, st.lit);
    px(c, Math.round(w * 0.16), ry, 2, 5, st.mid);
    px(c, Math.round(w * 0.82), ry, 2, 5, st.mid);
    /* the foot */
    px(c, Math.round(w * 0.12), h - 3, Math.round(w * 0.76), 3, st.ink);
    px(c, Math.round(w * 0.14), h - 3, Math.round(w * 0.72), 2, st.dk);
  });

  /* ---- 17. A SHELF with things on it, which is how a wall stops being
           a wall. ---- */
  piece('shelf', (c, w, h, o) => {
    const wd = M(o.mat || 'walnut');
    const sy = h - 4;
    px(c, 0, sy, w, 4, wd.ink);
    px(c, 0, sy, w, 3, wd.mid);
    px(c, 0, sy, w, 1, wd.lit);
    /* the brackets */
    for (const bx of [3, w - 8]) {
      for (let i = 0; i < 5; i++) px(c, bx, sy + 3 + i, 5 - i, 1, wd.dk);
    }
    /* and what is on it: tins, jars, a bottle, a book, a photograph */
    const rng = U.mulberry32((o.seed || 1) * 29);
    const cols = [M('mustard'), M('teal'), M('oxblood'), M('bottle'), M('copper'), M('plum')];
    let x = 2;
    while (x < w - 6) {
      const kind = Math.floor(rng() * 4);
      const m = cols[Math.floor(rng() * cols.length)];
      const ih = Math.min(h - 6, 6 + Math.floor(rng() * (h - 10)));
      const iw = kind === 3 ? 3 + Math.floor(rng() * 3) : 5 + Math.floor(rng() * 5);
      if (x + iw > w - 4) break;
      if (kind === 0) {                                 /* a tin */
        px(c, x, sy - ih, iw, ih, m.ink);
        px(c, x + 1, sy - ih + 1, iw - 2, ih - 1, m.mid);
        px(c, x + 1, sy - ih + 1, 2, ih - 1, m.lit);
        px(c, x + 1, sy - Math.round(ih * 0.6), iw - 2, 2, M('cream').mid);
      } else if (kind === 1) {                          /* a jar */
        px(c, x, sy - ih, iw, ih, 'rgba(10,20,28,.5)');
        px(c, x + 1, sy - ih + 2, iw - 2, ih - 2, m.mid);
        px(c, x + 1, sy - ih + 2, 2, ih - 2, 'rgba(255,255,255,.24)');
        px(c, x + 1, sy - ih, iw - 2, 2, M('brass').mid);
      } else if (kind === 2) {                          /* a bottle */
        px(c, x + Math.round(iw / 2) - 1, sy - ih, 3, Math.round(ih * 0.34), m.dk);
        px(c, x, sy - Math.round(ih * 0.7), iw, Math.round(ih * 0.7), m.ink);
        px(c, x + 1, sy - Math.round(ih * 0.7) + 1, iw - 2, Math.round(ih * 0.7) - 2, m.mid);
        px(c, x + 1, sy - Math.round(ih * 0.7) + 1, 2, Math.round(ih * 0.7) - 2, m.lit);
      } else {                                          /* a book, leaning */
        px(c, x, sy - ih, iw, ih, m.ink);
        px(c, x, sy - ih, iw - 1, ih - 1, m.mid);
        px(c, x, sy - ih, 1, ih - 1, m.lit);
      }
      x += iw + 1 + Math.floor(rng() * 2);
    }
  });

  /* ---- 18. A WALL SCONCE, which is a lamp that is also decoration. ---- */
  piece('sconce', (c, w, h, o) => {
    const br = M('brass'), sm = M(o.mat || 'cream');
    px(c, (w >> 1) - 2, Math.round(h * 0.34), 5, Math.round(h * 0.5), br.ink);
    px(c, (w >> 1) - 1, Math.round(h * 0.34), 3, Math.round(h * 0.5), br.mid);
    px(c, (w >> 1) - 1, Math.round(h * 0.34), 1, Math.round(h * 0.5), br.lit);
    px(c, (w >> 1) - 4, h - 4, 9, 4, br.ink);
    px(c, (w >> 1) - 3, h - 4, 7, 3, br.dk);
    /* the shade, a half cone, lit inside */
    const shH = Math.round(h * 0.34);
    for (let y = 0; y < shH; y++) {
      const t = y / Math.max(1, shH - 1);
      const ww = Math.round(w * (0.40 + t * 0.58));
      const x0 = Math.round((w - ww) / 2);
      px(c, x0 - 1, y, ww + 2, 1, sm.ink);
      px(c, x0, y, ww, 1, sm.mid);
      px(c, x0, y, Math.max(1, Math.round(ww * 0.3)), 1, sm.lit);
    }
    for (let i = 0; i < 4; i++) {
      const ww = Math.round(w * (0.9 - i * 0.12));
      px(c, Math.round((w - ww) / 2), shH + i, ww, 1,
        'rgba(255,236,180,' + (0.26 - i * 0.055).toFixed(3) + ')');
    }
  });

  /* ---- 19. WALLPAPER, as a piece: a strip a room can tile across its
           upper wall so the field is not a dither. ---- */
  piece('paper', (c, w, h, o) => {
    const m = M(o.mat || 'bottle');
    px(c, 0, 0, w, h, m.dk);
    /* the stripe */
    for (let x = 0; x < w; x += 8) {
      px(c, x, 0, 3, h, m.mid);
      px(c, x, 0, 1, h, 'rgba(255,255,255,.05)');
    }
    /* and a sprig on it, two pixels of contrast, on a wide grid */
    for (let y = 4; y < h; y += 14) {
      for (let x = ((y / 14) % 2 ? 6 : 0); x < w; x += 16) {
        px(c, x + 2, y, 2, 1, m.lit);
        px(c, x + 1, y + 1, 4, 1, m.lit);
        px(c, x + 2, y + 2, 2, 1, m.lit);
      }
    }
    dith(c, 0, 0, w, h, 'rgba(0,0,0,.22)', 0.06, (o.seed || 1) * 17);
  });

  /* ---- 20. A RADIATOR, ribbed, with the paint gone at the top. ---- */
  piece('radiator', (c, w, h, o) => {
    const m = M(o.mat || 'enamel');
    px(c, 0, 0, w, h, m.ink);
    const ribs = Math.max(3, Math.round(w / 7));
    for (let i = 0; i < ribs; i++) {
      const rx = 1 + Math.round((w - 2) * i / ribs), rw = Math.round((w - 2) / ribs) - 1;
      px(c, rx, 1, rw, h - 2, m.mid);
      px(c, rx, 1, Math.max(1, rw >> 1), h - 2, m.lit);
      px(c, rx + rw - 1, 1, 1, h - 2, m.dk);
    }
    px(c, 1, 1, w - 2, 2, m.lit);
    px(c, 1, h - 3, w - 2, 2, m.dk);
    dith(c, 1, 1, w - 2, 4, 'rgba(120,80,40,.30)', 0.24, (o.seed || 1) * 7);
    /* the valve */
    px(c, w - 5, h - 8, 4, 7, M('brass').ink);
    px(c, w - 5, h - 8, 3, 6, M('brass').mid);
    px(c, w - 5, h - 8, 3, 1, M('brass').lit);
  });

  /* ---- 21. A HAT STAND, with what he left on it. ---- */
  piece('hatstand', (c, w, h, o) => {
    const wd = M(o.mat || 'ebony');
    const sx = (w >> 1) - 1;
    px(c, sx - 1, 4, 4, h - 8, wd.ink);
    px(c, sx, 4, 2, h - 8, wd.mid);
    px(c, sx, 4, 1, h - 8, wd.lit);
    /* the pegs */
    for (let i = 0; i < 4; i++) {
      const py = 8 + i * 5, dir = i % 2 ? 1 : -1;
      px(c, sx + (dir > 0 ? 2 : -5), py, 4, 2, wd.ink);
      px(c, sx + (dir > 0 ? 2 : -5), py, 4, 1, wd.mid);
      PIX.disc(c, sx + dir * 6, py + 1, 2, wd.lit);
    }
    /* the foot */
    px(c, Math.round(w * 0.16), h - 5, Math.round(w * 0.68), 4, wd.ink);
    px(c, Math.round(w * 0.18), h - 5, Math.round(w * 0.64), 3, wd.dk);
    /* and a hat, and a coat hanging */
    px(c, sx - 7, 4, 16, 3, '#1a1a24');
    px(c, sx - 4, 0, 10, 5, '#22222e');
    px(c, sx - 4, 3, 10, 1, M('oxblood').mid);
    for (let y = 14; y < h - 8; y++) {
      const t = (y - 14) / Math.max(1, h - 22);
      const ww = Math.round(4 + t * 8);
      px(c, sx + 3, y, ww, 1, '#2a2f42');
      px(c, sx + 3, y, 2, 1, '#3c4460');
    }
  });

  /* ---- 22. A SINK with a draining board, taps and a splashback. ---- */
  piece('sink', (c, w, h, o) => {
    const en = M(o.mat || 'enamel'), br = M('brass'), st = M('steel');
    /* the splashback, tiled */
    const bh = Math.round(h * 0.30);
    px(c, 0, 0, w, bh, '#0f424f');
    for (let y = 2; y < bh; y += 6) px(c, 0, y, w, 1, 'rgba(255,255,255,.12)');
    for (let x = 0; x < w; x += 8) px(c, x, 0, 1, bh, 'rgba(0,0,0,.24)');
    px(c, 0, bh - 2, w, 2, 'rgba(0,0,0,.40)');
    /* the slab it is all set into */
    px(c, 0, bh, w, h - bh, en.ink);
    px(c, 1, bh + 1, w - 2, h - bh - 2, en.mid);
    px(c, 1, bh + 1, w - 2, 2, en.lit);
    /* THE BASIN, which has to be a HOLE: at forty-six per cent of the
       remaining height it was a thin dark band and the whole piece read as
       a white box with a stripe on it. It takes most of the slab, it is
       dark at the bottom and it has a rim you can see the thickness of. */
    const bx = Math.round(w * 0.08), bw2 = Math.round(w * 0.50);
    const byy = bh + 4, bhh = Math.max(8, h - bh - 9);
    px(c, bx - 1, byy - 1, bw2 + 2, bhh + 2, en.dk);
    px(c, bx, byy, bw2, bhh, en.ink);
    for (let y = 0; y < bhh; y++) {
      const t = y / Math.max(1, bhh - 1);
      px(c, bx + 1, byy + y, bw2 - 2, 1,
        'rgb(' + Math.round(38 - t * 18) + ',' + Math.round(52 - t * 24)
        + ',' + Math.round(58 - t * 26) + ')');
    }
    px(c, bx + 1, byy, bw2 - 2, 1, 'rgba(255,255,255,.22)');
    px(c, bx + 1, byy + bhh - 2, bw2 - 2, 2, 'rgba(0,0,0,.44)');
    /* a puddle in the bottom of it, and the plug */
    px(c, bx + 3, byy + bhh - 5, bw2 - 6, 3, 'rgba(120,190,214,.22)');
    PIX.disc(c, bx + (bw2 >> 1), byy + bhh - 4, 2, st.mid);
    px(c, bx + (bw2 >> 1) + 2, byy + bhh - 6, 5, 1, st.dk);
    /* the draining board, grooved, sloping into the basin */
    const dx = bx + bw2 + 3;
    for (let i = 0; i < 5; i++) {
      const gy = byy + 2 + i * Math.max(2, Math.round((bhh - 6) / 5));
      if (gy > h - 5) break;
      px(c, dx, gy, w - dx - 2, 1, 'rgba(0,0,0,.30)');
      px(c, dx, gy + 1, w - dx - 2, 1, 'rgba(255,255,255,.14)');
    }
    px(c, dx - 1, byy, 1, bhh, 'rgba(0,0,0,.34)');
    /* the taps */
    for (let i = 0; i < 2; i++) {
      const tx = bx + 4 + i * (bw2 - 10);
      px(c, tx, bh - 6, 3, 7, br.ink);
      px(c, tx, bh - 6, 2, 6, br.mid);
      px(c, tx - 1, bh - 8, 5, 3, br.ink);
      px(c, tx - 1, bh - 8, 4, 2, br.lit);
    }
    px(c, 0, h - 3, w, 3, en.ink);
    px(c, 1, h - 2, w - 2, 2, en.dk);
  });

  /* ---- 23. A BED, with a quilt and a brass frame. ---- */
  piece('bed', (c, w, h, o) => {
    const br = M(o.frame || 'brass'), q = M(o.mat || 'rose');
    const headH = Math.round(h * 0.62);
    /* the head, brass, with rails */
    px(c, 1, h - headH, 4, headH, br.ink);
    px(c, 2, h - headH, 2, headH, br.mid);
    px(c, 2, h - headH, 1, headH, br.lit);
    PIX.disc(c, 3, h - headH - 1, 3, br.mid);
    px(c, 1, h - headH, Math.round(w * 0.30), 3, br.ink);
    px(c, 2, h - headH, Math.round(w * 0.30) - 2, 2, br.mid);
    for (let i = 1; i < 4; i++) {
      const rx = 5 + i * 4;
      if (rx > w * 0.30) break;
      px(c, rx, h - headH + 2, 2, headH - Math.round(h * 0.30), br.dk);
      px(c, rx, h - headH + 2, 1, headH - Math.round(h * 0.30), br.mid);
    }
    /* the mattress and the quilt over it, with a fold at the top */
    const my = h - Math.round(h * 0.34);
    px(c, 3, my, w - 5, Math.round(h * 0.30), M('cream').ink);
    px(c, 4, my + 1, w - 7, Math.round(h * 0.30) - 2, M('cream').mid);
    px(c, 8, my - 3, w - 11, Math.round(h * 0.26), q.ink);
    px(c, 9, my - 2, w - 13, Math.round(h * 0.26) - 2, q.mid);
    px(c, 9, my - 2, w - 13, 2, q.lit);
    for (let x = 10; x < w - 6; x += 9) px(c, x, my - 1, 1, Math.round(h * 0.24), q.dk);
    for (let y = my + 2; y < my + Math.round(h * 0.24); y += 7) px(c, 9, y, w - 13, 1, q.dk);
    /* the pillow */
    px(c, 5, my - 6, 14, 7, M('cream').ink);
    px(c, 6, my - 5, 12, 5, M('cream').lit);
    px(c, 6, my - 2, 12, 2, M('cream').dk);
    /* the foot rail and the legs */
    px(c, w - 5, my - 8, 4, Math.round(h * 0.34) + 8, br.ink);
    px(c, w - 4, my - 8, 2, Math.round(h * 0.34) + 8, br.mid);
    PIX.disc(c, w - 3, my - 9, 3, br.mid);
    px(c, 3, h - 3, 3, 3, br.dk);
    px(c, w - 6, h - 3, 3, 3, br.dk);
  });

  /* ---- 24. A DINER BOOTH: a bench back and a table, seen side on. ---- */
  piece('booth', (c, w, h, o) => {
    const m = M(o.mat || 'oxblood'), st = M('steel'), tp = M('cream');
    const backH = Math.round(h * 0.66);
    px(c, 0, h - backH, Math.round(w * 0.34), backH, m.ink);
    px(c, 1, h - backH + 1, Math.round(w * 0.34) - 2, backH - 2, m.mid);
    px(c, 1, h - backH + 1, Math.round(w * 0.34) - 2, 2, m.lit);
    for (let y = h - backH + 4; y < h - 8; y += 6) {
      px(c, 2, y, Math.round(w * 0.34) - 4, 1, m.dk);
      px(c, 2, y + 1, Math.round(w * 0.34) - 4, 1, 'rgba(255,255,255,.07)');
    }
    px(c, 0, h - backH, Math.round(w * 0.34), 2, st.mid);   /* the chrome cap */
    /* the seat */
    px(c, 0, h - Math.round(h * 0.26), Math.round(w * 0.46), Math.round(h * 0.12), m.ink);
    px(c, 1, h - Math.round(h * 0.26) + 1, Math.round(w * 0.46) - 2, Math.round(h * 0.12) - 2, m.mid);
    px(c, 1, h - Math.round(h * 0.26) + 1, Math.round(w * 0.46) - 2, 2, m.lit);
    /* the table, on a single column */
    const ty = h - Math.round(h * 0.42);
    px(c, Math.round(w * 0.36), ty, Math.round(w * 0.62), 4, tp.ink);
    px(c, Math.round(w * 0.36), ty, Math.round(w * 0.62), 3, tp.mid);
    px(c, Math.round(w * 0.36), ty, Math.round(w * 0.62), 1, tp.lit);
    px(c, Math.round(w * 0.36), ty + 4, Math.round(w * 0.62), 1, 'rgba(0,0,0,.44)');
    const cxx = Math.round(w * 0.66);
    px(c, cxx - 2, ty + 5, 5, h - ty - 8, st.ink);
    px(c, cxx - 1, ty + 5, 3, h - ty - 8, st.mid);
    px(c, cxx - 1, ty + 5, 1, h - ty - 8, st.lit);
    px(c, cxx - 7, h - 3, 15, 3, st.ink);
    px(c, cxx - 6, h - 3, 13, 2, st.dk);
    /* the ketchup, the sugar and the napkins */
    px(c, Math.round(w * 0.44), ty - 8, 4, 8, M('oxblood').mid);
    px(c, Math.round(w * 0.44), ty - 10, 4, 2, M('oxblood').dk);
    px(c, Math.round(w * 0.52), ty - 6, 5, 6, 'rgba(226,240,248,.44)');
    px(c, Math.round(w * 0.52), ty - 7, 5, 1, st.mid);
    px(c, Math.round(w * 0.78), ty - 4, 8, 4, tp.lit);
  });


  /* ============================================================
     THE CUTE SHELF.

     Everything above is furniture: things a room is fitted with.
     What makes a room somebody's is the small stuff left lying
     about in it, and a house with a child in it is the fullest room
     in any game. These are all SMALL -- ten to thirty pixels -- and
     they are all specific: not "a toy" but a wooden duck on a
     string, not "a plant" but a jam jar with one flower in it.
     ============================================================ */

  /* a wooden pull-along duck, on a string */
  piece('duck', (c, w, h, o) => {
    const m = M(o.mat || 'mustard'), wd = M('pine');
    const bh = Math.round(h * 0.56);
    SPR.ellipse(c, Math.round(w * 0.46), h - bh, Math.round(w * 0.42), Math.round(bh * 0.52), m.ink);
    SPR.ellipse(c, Math.round(w * 0.46), h - bh - 1, Math.round(w * 0.38), Math.round(bh * 0.46), m.mid);
    SPR.ellipse(c, Math.round(w * 0.36), h - bh - 2, Math.round(w * 0.20), Math.round(bh * 0.24), m.lit);
    PIX.disc(c, Math.round(w * 0.78), h - bh - Math.round(bh * 0.44), Math.round(w * 0.17), m.ink);
    PIX.disc(c, Math.round(w * 0.78), h - bh - Math.round(bh * 0.44), Math.round(w * 0.14), m.mid);
    px(c, Math.round(w * 0.88), h - bh - Math.round(bh * 0.44), 4, 2, M('copper').mid);
    px(c, Math.round(w * 0.74), h - bh - Math.round(bh * 0.56), 2, 2, '#141210');
    /* the board and the two wheels */
    px(c, 1, h - 5, w - 2, 3, wd.ink);
    px(c, 2, h - 5, w - 4, 2, wd.mid);
    for (const wx of [Math.round(w * 0.22), Math.round(w * 0.70)]) {
      PIX.disc(c, wx, h - 2, 3, wd.ink);
      PIX.disc(c, wx, h - 2, 2, M('copper').mid);
    }
    for (let i = 0; i < Math.round(w * 0.5); i++) {
      px(c, i, h - 6 - Math.round(Math.sin(i * 0.5) * 2), 1, 1, 'rgba(232,220,190,.6)');
    }
  });

  /* a jam jar with one flower in it */
  piece('posy', (c, w, h, o) => {
    const g = 'rgba(206,236,246,';
    const jh = Math.round(h * 0.44);
    px(c, 1, h - jh, w - 2, jh, 'rgba(10,20,28,.5)');
    px(c, 2, h - jh + 1, w - 4, jh - 2, g + '.30)');
    px(c, 2, h - jh + 1, 2, jh - 2, g + '.52)');
    px(c, 2, h - Math.round(jh * 0.62), w - 4, Math.round(jh * 0.5), 'rgba(140,196,214,.36)');
    px(c, 1, h - jh, w - 2, 2, g + '.44)');
    const st = M('bottle');
    for (let i = 0; i < h - jh; i++) {
      px(c, Math.round(w / 2) + Math.round(Math.sin(i * 0.2) * 1), h - jh - i, 1, 1, st.mid);
    }
    px(c, Math.round(w / 2) - 3, h - jh - Math.round(h * 0.3), 3, 1, st.lit);
    const fm = M(o.mat || 'rose');
    PIX.disc(c, Math.round(w / 2), 3, 3, fm.ink);
    PIX.disc(c, Math.round(w / 2), 3, 2, fm.mid);
    PIX.disc(c, Math.round(w / 2) - 1, 2, 1, fm.lit);
    for (const dx of [-3, 3]) {
      PIX.disc(c, Math.round(w / 2) + dx, 4, 2, fm.mid);
    }
    PIX.disc(c, Math.round(w / 2), 3, 1, M('mustard').lit);
  });

  /* a bowl of fruit */
  piece('fruit', (c, w, h, o) => {
    const b = M(o.mat || 'teal');
    const fr = [M('oxblood'), M('mustard'), M('bottle'), M('rose')];
    for (let i = 0; i < 4; i++) {
      const fx = 4 + i * Math.round((w - 10) / 3.4), fy = h - Math.round(h * 0.52);
      const m = fr[i % fr.length], r = Math.max(2, Math.round(w * 0.11));
      PIX.disc(c, fx, fy - (i % 2) * 2, r + 1, m.ink);
      PIX.disc(c, fx, fy - (i % 2) * 2, r, m.mid);
      PIX.disc(c, fx - 1, fy - 1 - (i % 2) * 2, Math.max(1, r - 2), m.lit);
    }
    const bh2 = Math.round(h * 0.48);
    for (let y = 0; y < bh2; y++) {
      const t = y / Math.max(1, bh2 - 1);
      const ww = Math.round(w * (0.98 - t * 0.34));
      const x0 = Math.round((w - ww) / 2);
      px(c, x0 - 1, h - bh2 + y, ww + 2, 1, b.ink);
      px(c, x0, h - bh2 + y, ww, 1, y < 2 ? b.lit : b.mid);
      px(c, x0, h - bh2 + y, Math.max(1, Math.round(ww * 0.2)), 1, b.lit);
    }
  });

  /* two slippers, side by side, one kicked over */
  piece('slippers', (c, w, h, o) => {
    const m = M(o.mat || 'oxblood');
    for (let i = 0; i < 2; i++) {
      const sx = i * Math.round(w * 0.52), tilt = i;
      const sw = Math.round(w * 0.46);
      SPR.ellipse(c, sx + Math.round(sw / 2), h - 3 + tilt, Math.round(sw / 2), 3, m.ink);
      SPR.ellipse(c, sx + Math.round(sw / 2), h - 4 + tilt, Math.round(sw / 2) - 1, 2, m.mid);
      px(c, sx + 1, h - 7 + tilt, Math.round(sw * 0.6), 4, m.ink);
      px(c, sx + 2, h - 6 + tilt, Math.round(sw * 0.6) - 2, 3, m.mid);
      px(c, sx + 2, h - 6 + tilt, Math.round(sw * 0.5), 1, m.lit);
    }
  });

  /* a child's drawing, pinned up crooked */
  piece('drawing', (c, w, h, o) => {
    px(c, 1, 1, w - 2, h - 2, 'rgba(0,0,0,.34)');
    px(c, 0, 0, w - 2, h - 2, '#f0e6c8');
    px(c, 0, 0, w - 2, 1, '#fbf7ec');
    /* three frogs and a sun, in wax crayon */
    const cols = ['#5fc97d', '#d94a52', '#7fd7ff'];
    for (let i = 0; i < 3; i++) {
      const fx = 3 + i * Math.round((w - 8) / 3), fy = h - 6;
      PIX.disc(c, fx + 2, fy - 5, 2, cols[i]);
      px(c, fx + 1, fy - 3, 3, 3, cols[i]);
      px(c, fx, fy, 1, 2, cols[i]);
      px(c, fx + 4, fy, 1, 2, cols[i]);
    }
    PIX.disc(c, w - 6, 4, 2, '#ffd75e');
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2;
      px(c, w - 6 + Math.round(Math.cos(a) * 4), 4 + Math.round(Math.sin(a) * 4), 1, 1, '#ffd75e');
    }
    px(c, 1, 2, w - 4, 1, 'rgba(120,100,70,.20)');
    px(c, Math.round(w / 2) - 2, -1, 4, 3, '#b8232f');   /* the pin */
    px(c, Math.round(w / 2) - 1, -1, 2, 2, '#e04a54');
  });

  /* a cat, asleep in a curl */
  piece('cat', (c, w, h, o) => {
    const m = M(o.mat || 'ebony');
    SPR.ellipse(c, Math.round(w / 2), h - 3, Math.round(w * 0.46), 4, 'rgba(6,8,12,.40)');
    SPR.ellipse(c, Math.round(w / 2), h - Math.round(h * 0.42), Math.round(w * 0.44),
      Math.round(h * 0.40), m.ink);
    SPR.ellipse(c, Math.round(w / 2), h - Math.round(h * 0.44), Math.round(w * 0.40),
      Math.round(h * 0.36), m.mid);
    SPR.ellipse(c, Math.round(w * 0.40), h - Math.round(h * 0.54), Math.round(w * 0.24),
      Math.round(h * 0.18), m.lit);
    /* the head, tucked in, and two ears */
    const hx = Math.round(w * 0.74), hy = h - Math.round(h * 0.46);
    PIX.disc(c, hx, hy, Math.round(w * 0.17) + 1, m.ink);
    PIX.disc(c, hx, hy, Math.round(w * 0.17), m.mid);
    px(c, hx - 4, hy - Math.round(w * 0.17) - 1, 3, 3, m.ink);
    px(c, hx + 2, hy - Math.round(w * 0.17) - 1, 3, 3, m.ink);
    px(c, hx - 3, hy, 2, 1, '#8fe6c0');                  /* one eye, half open */
    px(c, hx + 2, hy, 2, 1, '#8fe6c0');
    /* the tail, curled round */
    for (let i = 0; i < Math.round(w * 0.5); i++) {
      const a = i / (w * 0.5) * Math.PI * 1.1;
      px(c, Math.round(w * 0.20 + Math.cos(a + 2.2) * w * 0.24),
        h - 4 + Math.round(Math.sin(a + 2.2) * 3), 2, 2, m.mid);
    }
  });

  /* a wireless set, with a dial and a cloth grille */
  piece('radio', (c, w, h, o) => {
    const wd = M(o.mat || 'walnut'), br = M('brass');
    px(c, 0, 2, w, h - 2, wd.ink);
    px(c, 1, 3, w - 2, h - 4, wd.mid);
    grain(c, 2, 4, w - 4, h - 6, wd.dk, wd.lit, (o.seed || 1) * 5);
    for (let i = 0; i < 4; i++) px(c, 2 + i, 2 - Math.min(2, i), w - 4 - i * 2, 1, wd.lit);
    /* the grille */
    const gx = 3, gw = Math.round(w * 0.52);
    px(c, gx, 6, gw, h - 11, '#2a1f14');
    for (let y = 7; y < h - 6; y += 2) px(c, gx + 1, y, gw - 2, 1, '#4a3a26');
    px(c, gx, 6, gw, 1, wd.lit);
    /* the tuning dial, lit */
    const dx = gx + gw + 3;
    px(c, dx, 7, w - dx - 3, 8, '#141210');
    px(c, dx + 1, 8, w - dx - 5, 6, '#e8dcc0');
    for (let i = 0; i < 5; i++) px(c, dx + 2 + i * 3, 9, 1, 4, '#7a6a4a');
    px(c, dx + 4, 8, 1, 6, '#d94a52');
    PIX.disc(c, dx + Math.round((w - dx) / 2), h - 8, 3, br.ink);
    PIX.disc(c, dx + Math.round((w - dx) / 2), h - 8, 2, br.mid);
  });

  /* a kettle, steaming */
  piece('kettle', (c, w, h, o) => {
    const st = M(o.mat || 'steel');
    const kb = h - 2;
    SPR.ellipse(c, Math.round(w / 2), kb, Math.round(w * 0.40), 3, st.ink);
    for (let y = kb - Math.round(h * 0.52); y <= kb; y++) {
      const t = (y - (kb - h * 0.52)) / (h * 0.52);
      const hw2 = Math.round(w * (0.22 + Math.sin(t * 2.2) * 0.16));
      px(c, Math.round(w / 2) - hw2 - 1, y, hw2 * 2 + 3, 1, st.ink);
      px(c, Math.round(w / 2) - hw2, y, hw2 * 2 + 1, 1, t < 0.5 ? st.mid : st.dk);
      px(c, Math.round(w / 2) - hw2, y, 2, 1, st.lit);
    }
    px(c, Math.round(w / 2) - 4, kb - Math.round(h * 0.56), 9, 3, st.ink);
    px(c, Math.round(w / 2) - 3, kb - Math.round(h * 0.56), 7, 2, st.lit);
    px(c, Math.round(w / 2) - 1, kb - Math.round(h * 0.64), 3, 3, st.ink);
    px(c, Math.round(w / 2) - 1, kb - Math.round(h * 0.64), 2, 2, st.mid);
    /* the spout, rising, and the steam off it */
    for (let i = 0; i < Math.round(w * 0.28); i++) {
      px(c, Math.round(w * 0.72) + i, kb - Math.round(h * 0.34) - Math.round(i * 0.8),
        3, 4, st.ink);
      px(c, Math.round(w * 0.72) + i, kb - Math.round(h * 0.34) - Math.round(i * 0.8) + 1,
        2, 2, st.lit);
    }
    for (let i = 0; i < 5; i++) {
      px(c, Math.round(w * 0.94) - i + (i % 2) * 2, Math.max(0, kb - Math.round(h * 0.56) - i * 3),
        2, 2, 'rgba(240,244,248,' + (0.30 - i * 0.05).toFixed(2) + ')');
    }
    /* the strap handle */
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * (0.12 + i / 7 * 0.76);
      px(c, Math.round(w / 2) - Math.round(Math.cos(a) * w * 0.24),
        kb - Math.round(h * 0.56) - Math.round(Math.sin(a) * h * 0.22), 2, 2, st.dk);
    }
  });

  /* a ball, and a pair of building blocks */
  piece('toys', (c, w, h, o) => {
    const b = M(o.mat || 'oxblood');
    PIX.disc(c, Math.round(w * 0.26), h - Math.round(h * 0.42), Math.round(h * 0.40) + 1, b.ink);
    PIX.disc(c, Math.round(w * 0.26), h - Math.round(h * 0.42), Math.round(h * 0.40), b.mid);
    PIX.disc(c, Math.round(w * 0.20), h - Math.round(h * 0.54), Math.round(h * 0.16), b.lit);
    px(c, Math.round(w * 0.10), h - Math.round(h * 0.44), Math.round(h * 0.66), 2, M('cream').mid);
    const cols = [M('mustard'), M('petrol'), M('bottle')];
    for (let i = 0; i < 3; i++) {
      const bx = Math.round(w * 0.56) + (i % 2) * 9, by = h - 6 - Math.floor(i / 2) * 8;
      const m = cols[i];
      px(c, bx, by, 9, 7, m.ink);
      px(c, bx + 1, by + 1, 7, 5, m.mid);
      px(c, bx + 1, by + 1, 7, 1, m.lit);
      px(c, bx + 3, by + 2, 3, 3, m.dk);
    }
  });

  /* ============================================================
     THE PUBLIC FACE
     ============================================================ */
  return {
    MAT,
    /* the list, so a room (or a probe) can ask what exists */
    names: () => Object.keys(PIECES),
    /* one piece, at a size, cached */
    get(name, w, h, o) {
      const fn = PIECES[name];
      if (!fn) return null;
      o = o || {};
      const key = name + ':' + (o.mat || '') + ':' + (o.wood || '') + ':'
        + (o.cloth || '') + ':' + (o.trim || '') + ':' + (o.kind || '')
        + ':' + (o.seed || 0) + ':' + (o.dead ? 'd' : '')
        + ':' + (o.hour === undefined ? '' : o.hour + '.' + o.min);
      return make(key, w, h, (c, W, H) => fn(c, W, H, o));
    },
    /* draw one standing on the floor, with the shadow it throws */
    stand(c, name, x, y, w, h, o) {
      const img = this.get(name, w, h, o);
      if (!img) return null;
      return ART.stand(c, img, x, y, o);
    },
    /* or hung on a wall, with the shadow it throws DOWN the wall */
    hang(c, name, x, y, w, h, o) {
      const img = this.get(name, w, h, o);
      if (!img) return null;
      ART.px(c, x + 2, y + 3, w, h, 'rgba(6,8,12,.34)');
      c.drawImage(img, x, y);
      return img;
    },
  };
})();
