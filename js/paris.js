/* ============================================================
   SHELL & DEBT — paris.js
   THE CITY IT IS ACTUALLY SET IN.

   The five working stops — the laundry, the quay, the pawn, the
   café, the cabaret — are the case. These are the city the case
   happens in: the Tower over the Champ de Mars, the Arch at the
   top of the avenue, the white domes on the Butte, the glass
   pyramid in the palace courtyard, the tunnels of bones under
   Denfert, and the tiled platform below the Étoile.

   Every one of them is a WIDE room with a walkable depth band, a
   crowd in the far half of it, and a landmark big enough that the
   frame cannot hold all of it. You come here to work — there are
   things to search and frogs to lean on — but mostly you come
   here because it is the most beautiful part of a very ugly
   business.
   ============================================================ */

const PARIS = (() => {

  const px = (c, x, y, w, h, col) => ART.px(c, x, y, w, h, col);
  const P = () => PIX.PAL;

  function seedFor(id) {
    return U.hashSeed((G.seedStr || 'X') + ':' + (G.chapter || 1) + ':' + id);
  }

  /* ============================================================
     THE FURNITURE OF PARIS.

     None of this is a landmark and all of it is why a street in
     this city does not look like a street in any other one.
     ============================================================ */

  /* HAUSSMANN. Cream stone, iron balconies, shutters, a zinc mansard
     roof with dormers in it, and one window in five with a light on. */
  function haussmann(c, x, y, w, h, seed) {
    const rng = U.mulberry32(seed * 31 + 7);
    const stone = '#6d6759', stoneLit = '#837c6b', stoneDk = '#4e4941';
    const roof = '#3b4048', roofLit = '#4d535d';
    px(c, x, y, w, h, stone);
    px(c, x, y, w, 2, stoneLit);
    px(c, x + w - 2, y, 2, h, stoneDk);
    /* the mansard, on top */
    const rh = Math.max(6, Math.round(h * 0.2));
    for (let i = 0; i < rh; i++) {
      px(c, x + Math.round(i * 0.55), y - rh + i, w - Math.round(i * 1.1), 1,
        i < 2 ? roofLit : roof);
    }
    /* string courses: this city is made of horizontal lines */
    for (let ly = y + 12; ly < y + h - 6; ly += 16) {
      px(c, x, ly, w, 1, stoneLit);
      px(c, x, ly + 1, w, 1, stoneDk);
    }
    /* windows, tall and thin, with balconies on the good floors */
    for (let ly = y + 4; ly < y + h - 12; ly += 16) {
      for (let lx = x + 4; lx < x + w - 8; lx += 13) {
        const lit = rng() < 0.22;
        px(c, lx, ly, 8, 11, '#181a20');
        px(c, lx + 1, ly + 1, 6, 9, lit ? '#e8c46a' : '#22262e');
        if (lit) {
          px(c, lx + 1, ly + 1, 6, 3, '#f4dc9a');
          if (rng() < 0.4) px(c, lx + 2, ly + 5, 3, 5, '#3a2f28');   // somebody at it
        }
        /* the shutters, folded back */
        px(c, lx - 1, ly, 1, 11, '#4a5a48');
        px(c, lx + 8, ly, 1, 11, '#4a5a48');
        /* iron balcony */
        if (((ly - y) / 16) % 2 === 1) {
          px(c, lx - 2, ly + 10, 12, 1, '#2a2d33');
          for (let bx = lx - 2; bx < lx + 10; bx += 2) px(c, bx, ly + 7, 1, 3, '#2a2d33');
        }
      }
    }
    /* the shopfront at the bottom, dark and shuttered */
    px(c, x, y + h - 12, w, 12, '#262a2f');
    px(c, x, y + h - 12, w, 2, '#3a4046');
    for (let sx = x + 2; sx < x + w - 3; sx += 5) px(c, sx, y + h - 9, 3, 8, '#1c2024');
  }

  /* the double-globe cast iron lamp post this whole city is lit by */
  function lamp(c, x, y, h, on) {
    px(c, x - 3, y, 7, 2, '#20242a');
    px(c, x - 2, y - 2, 5, 2, '#2a2f36');
    px(c, x - 1, y - h, 3, h - 2, '#2a2f36');
    px(c, x - 1, y - h, 1, h - 2, '#3d444d');
    /* the arm and the two globes */
    px(c, x - 7, y - h - 2, 15, 2, '#2a2f36');
    [-6, 6].forEach(d => {
      PIX.disc(c, x + d, y - h - 6, 4, '#20242a');
      PIX.disc(c, x + d, y - h - 6, 3, on ? '#ffe7a8' : '#3a3f46');
      if (on) PIX.disc(c, x + d, y - h - 6, 5, 'rgba(255,231,168,.10)');
    });
    px(c, x - 1, y - h - 8, 3, 3, '#2a2f36');
  }

  /* a pollarded plane tree: the trunk is the point, the crown is a blob */
  function planeTree(c, x, y, h, seed) {
    const rng = U.mulberry32(seed * 17 + 3);
    px(c, x - 3, y - h, 7, h, '#4a4438');
    px(c, x - 3, y - h, 2, h, '#5d5647');
    px(c, x - 1, y - h + 4, 1, h - 6, 'rgba(0,0,0,.3)');
    /* the mottle that gives a plane tree away */
    for (let i = 0; i < 7; i++) {
      px(c, x - 2 + Math.floor(rng() * 5), y - h + 4 + Math.floor(rng() * (h - 8)), 2, 3, '#7d7565');
    }
    /* the crown, cut back the way this city cuts them back */
    const cy = y - h - 8;
    PIX.disc(c, x, cy, 15, '#1d2a22');
    PIX.disc(c, x - 7, cy + 4, 11, '#1d2a22');
    PIX.disc(c, x + 8, cy + 3, 12, '#1d2a22');
    PIX.disc(c, x - 4, cy - 5, 9, '#26362c');
    PIX.disc(c, x + 6, cy - 3, 8, '#26362c');
    for (let i = 0; i < 12; i++) {
      px(c, x - 14 + Math.floor(rng() * 28), cy - 8 + Math.floor(rng() * 18), 2, 2, '#31463a');
    }
  }

  /* THE WALLACE FOUNTAIN. Four bronze women holding up a dome, and
     water nobody drinks any more. */
  function wallace(c, x, y) {
    const bronze = '#2f5a4a', bronzeLit = '#43705d', dk = '#1b3a2f';
    px(c, x - 8, y - 4, 17, 4, dk);
    px(c, x - 7, y - 6, 15, 3, bronze);
    px(c, x - 4, y - 34, 9, 29, bronze);
    px(c, x - 4, y - 34, 2, 29, bronzeLit);
    /* the four caryatids, which at this size are four shoulders */
    [-5, 5].forEach(d => {
      px(c, x + d - 2, y - 30, 4, 18, bronze);
      px(c, x + d - 2, y - 30, 4, 3, bronzeLit);
      px(c, x + d - 1, y - 33, 2, 3, '#2a4f42');
    });
    /* the dome and its little crown */
    px(c, x - 9, y - 38, 19, 4, dk);
    px(c, x - 8, y - 40, 17, 3, bronze);
    px(c, x - 6, y - 42, 13, 2, bronzeLit);
    px(c, x - 2, y - 45, 5, 3, bronze);
    px(c, x - 1, y - 47, 3, 2, '#e0a63c');
    /* the water */
    px(c, x, y - 12, 1, 8, 'rgba(160,220,235,.35)');
    px(c, x - 3, y - 5, 7, 2, 'rgba(160,220,235,.18)');
  }

  /* a Morris column: a fat cylinder of theatre posters with a cap */
  function morris(c, x, y, h) {
    px(c, x - 11, y - h, 23, h, '#1f3a30');
    px(c, x - 11, y - h, 3, h, '#2b4c40');
    px(c, x + 7, y - h, 5, h, 'rgba(0,0,0,.3)');
    /* the posters */
    const cols = ['#7d2028', '#9c7430', '#2f4a70', '#63202a'];
    for (let i = 0; i < 3; i++) {
      const py0 = y - h + 8 + i * 22;
      px(c, x - 9, py0, 19, 19, cols[i % cols.length]);
      px(c, x - 8, py0 + 1, 17, 4, 'rgba(255,255,255,.5)');
      px(c, x - 8, py0 + 8, 17, 2, 'rgba(0,0,0,.3)');
      px(c, x - 8, py0 + 12, 12, 2, 'rgba(0,0,0,.25)');
    }
    /* the cap, with the little dome */
    px(c, x - 13, y - h - 4, 27, 5, '#18302a');
    px(c, x - 9, y - h - 8, 19, 5, '#1f3a30');
    PIX.disc(c, x, y - h - 11, 5, '#1f3a30');
    px(c, x - 1, y - h - 16, 3, 5, '#2b4c40');
  }

  /* a green slat bench, the kind bolted to every gravel path in the city */
  function bench(c, x, y, w) {
    const g = '#2f4a34', gl = '#3f603f', dk = '#1c2e20';
    px(c, x, y - 10, w, 3, g);
    px(c, x, y - 10, w, 1, gl);
    px(c, x, y - 14, w, 2, g);
    px(c, x, y - 18, w, 2, dk);
    px(c, x + 1, y - 7, 3, 7, dk);
    px(c, x + w - 4, y - 7, 3, 7, dk);
    px(c, x, y - 20, 2, 12, dk);
    px(c, x + w - 2, y - 20, 2, 12, dk);
  }

  /* the pavement: setts, worn smooth, wet more often than not */
  function cobbles(c, x, y, w, h, seed) {
    const rng = U.mulberry32(seed * 13 + 5);
    px(c, x, y, w, h, '#2b2e33');
    for (let ry = 0; ry < h; ry += 4) {
      const off = (ry / 4) % 2 ? 3 : 0;
      for (let rx = -off; rx < w; rx += 6) {
        const t = rng();
        px(c, x + rx, y + ry, 5, 3, t < 0.3 ? '#33373d' : t < 0.65 ? '#2e3238' : '#26292e');
        px(c, x + rx, y + ry, 5, 1, 'rgba(255,255,255,.04)');
      }
    }
    /* the gutter, and what is in it */
    px(c, x, y + h - 3, w, 1, 'rgba(0,0,0,.35)');
    px(c, x, y + h - 2, w, 2, 'rgba(90,150,160,.10)');
  }

  /* a cafe table with two chairs and somebody's cold coffee on it */
  function cafeTable(c, x, y) {
    px(c, x - 9, y - 16, 19, 3, '#8d8672');
    px(c, x - 9, y - 16, 19, 1, '#b0a894');
    px(c, x - 1, y - 13, 3, 13, '#2a2f36');
    px(c, x - 5, y - 1, 11, 2, '#2a2f36');
    /* the little round chairs */
    [-15, 14].forEach(d => {
      px(c, x + d - 4, y - 12, 9, 2, '#3a2f28');
      px(c, x + d - 4, y - 22, 9, 10, '#4a3f36');
      px(c, x + d - 4, y - 22, 9, 2, '#5f5245');
      px(c, x + d - 3, y - 10, 2, 10, '#241d17');
      px(c, x + d + 2, y - 10, 2, 10, '#241d17');
    });
    px(c, x + 2, y - 20, 4, 4, '#ded2b4');
    px(c, x + 2, y - 20, 4, 1, '#f0e6c8');
  }

  /* ============================================================
     THE LANDMARKS.

     Drawn big enough that the frame cannot hold them, because
     that is the only honest way to draw any of these.
     ============================================================ */

  /* LA TOUR EIFFEL. Four legs, two platforms, a lattice you can see the
     sky through, and the gold light they wash it with after dark. */
  function eiffel(c, cx, baseY, topY) {
    const iron = '#5a4a38', ironLit = '#7d6848', ironDk = '#382c20';
    const H2 = baseY - topY;
    /* THE PROFILE. The real curve: an exponential taper, which is why the
       thing does not read as a pyramid. Get this wrong and you have drawn
       a Mayan temple with a lift in it. */
    const halfAt = (t) => Math.round(74 * Math.pow(1 - t, 2.1) + 4);

    /* the four legs, and the open air between them */
    for (let i = 0; i <= H2; i++) {
      const t = i / H2;
      const hw = halfAt(t);
      const y = baseY - i;
      const legW = Math.max(2, Math.round(11 * (1 - t) + 2));
      px(c, cx - hw, y, legW, 1, iron);
      px(c, cx + hw - legW, y, legW, 1, iron);
      px(c, cx - hw, y, 1, 1, ironLit);
      px(c, cx + hw - 1, y, 1, 1, 'rgba(0,0,0,.3)');
      /* the inner pair of legs, behind the outer ones */
      const ihw = Math.round(hw * 0.42);
      px(c, cx - ihw, y, Math.max(1, legW - 1), 1, ironDk);
      px(c, cx + ihw - legW + 1, y, Math.max(1, legW - 1), 1, ironDk);
    }

    /* THE LATTICE. Diagonal bracing in Xs between the legs — the single
       thing that makes iron read as iron rather than as a wall. */
    for (let i = 0; i < H2; i += 10) {
      const t0 = i / H2, t1 = Math.min(1, (i + 10) / H2);
      const h0 = halfAt(t0), h1 = halfAt(t1);
      for (let k = 0; k <= 10; k++) {
        const f = k / 10;
        const y = baseY - i - k;
        const xa = Math.round(h0 + (h1 - h0) * f);
        const xb = Math.round(h0 + (h1 - h0) * (1 - f));
        /* left bay */
        px(c, cx - xa, y, 1, 1, 'rgba(125,104,72,.45)');
        px(c, cx - Math.round(xb * 0.42), y, 1, 1, 'rgba(125,104,72,.32)');
        /* right bay */
        px(c, cx + xa - 1, y, 1, 1, 'rgba(125,104,72,.45)');
        px(c, cx + Math.round(xb * 0.42), y, 1, 1, 'rgba(125,104,72,.32)');
      }
      /* the horizontal girder at each stage */
      const hh = halfAt(t0);
      px(c, cx - hh, baseY - i, hh * 2, 1, 'rgba(125,104,72,.35)');
    }

    /* THE FIRST ARCH. It springs from the legs and hangs, and it is the
       shape everybody actually remembers the tower by. */
    const at = 0.30;
    const ay = baseY - Math.round(H2 * at);
    const ah = halfAt(at);
    for (let k = -ah; k <= ah; k++) {
      const f = Math.abs(k) / ah;
      const y = ay + Math.round((1 - Math.cos(f * Math.PI / 2)) * 40);
      px(c, cx + k, y, 1, 4, iron);
      px(c, cx + k, y, 1, 1, ironLit);
      /* the ironwork filling the spandrel over it */
      if (Math.abs(k) % 7 === 0) px(c, cx + k, y, 1, ay - y + 4, 'rgba(125,104,72,.20)');
    }

    /* the two platforms, only just wider than the tower is at that height */
    [[at, 8], [0.60, 5]].forEach(([t, over]) => {
      const w = halfAt(t) + over;
      const y = baseY - Math.round(H2 * t);
      px(c, cx - w, y - 6, w * 2, 6, ironDk);
      px(c, cx - w, y - 6, w * 2, 2, ironLit);
      px(c, cx - w, y, w * 2, 1, 'rgba(0,0,0,.45)');
      for (let k = -w + 3; k < w - 3; k += 6) px(c, cx + k, y - 5, 3, 3, '#ffe7a8');
      /* the balustrade round it */
      for (let k = -w; k < w; k += 3) px(c, cx + k, y - 9, 1, 4, 'rgba(90,74,56,.8)');
    });

    /* the top, the lantern, the beacon — if any of it is in frame */
    if (topY > -40) {
      px(c, cx - 6, topY + 6, 13, 8, ironDk);
      px(c, cx - 4, topY + 2, 9, 5, iron);
      px(c, cx - 2, topY - 6, 5, 9, iron);
      px(c, cx - 1, topY - 12, 3, 7, '#8d9298');
      PIX.disc(c, cx, topY - 14, 3, '#fff3c4');
      PIX.disc(c, cx, topY - 14, 6, 'rgba(255,243,196,.16)');
    }

    /* the wash of gold light they put on it after dark */
    for (let i = 0; i < H2; i += 3) {
      const t = i / H2, hw = halfAt(t);
      px(c, cx - hw, baseY - i, hw * 2, 1,
        'rgba(224,166,60,' + (0.06 * (1 - t * 0.4)).toFixed(3) + ')');
    }
    /* and what it throws on the gravel underneath */
    PIX.disc(c, cx, baseY + 6, 120, 'rgba(224,166,60,.035)');
  }

  /* L'ARC DE TRIOMPHE. One vault, two piers, the reliefs, the attic. */
  function arc(c, cx, baseY, h) {
    const stone = '#7a7263', lit = '#948b78', dk = '#565043';
    const w = 106, vw = 38;
    px(c, cx - w / 2, baseY - h, w, h, stone);
    px(c, cx - w / 2, baseY - h, w, 3, lit);
    px(c, cx + w / 2 - 4, baseY - h, 4, h, dk);
    /* the vault, cut out of it */
    const vh = Math.round(h * 0.62);
    px(c, cx - vw / 2, baseY - vh, vw, vh, '#12141a');
    for (let k = -vw / 2; k <= vw / 2; k++) {
      const y = baseY - vh - Math.round(Math.cos((k / (vw / 2)) * 1.5) * 16);
      px(c, cx + k, y, 1, baseY - vh - y, '#12141a');
    }
    px(c, cx - vw / 2 - 2, baseY - vh - 18, vw + 4, 2, dk);
    /* the coffers inside the vault */
    for (let i = 0; i < 5; i++) {
      px(c, cx - vw / 2 + 4 + i * 8, baseY - vh - 6, 6, 4, 'rgba(255,255,255,.05)');
    }
    /* the four reliefs, which at this size are four crowds of stone */
    [[-40, 0], [40, 0]].forEach(([d]) => {
      px(c, cx + d - 13, baseY - h + 30, 26, 34, dk);
      px(c, cx + d - 12, baseY - h + 31, 24, 32, '#6b6456');
      for (let i = 0; i < 9; i++) {
        px(c, cx + d - 10 + (i % 5) * 5, baseY - h + 34 + Math.floor(i / 5) * 13, 4, 11, '#8a8271');
        px(c, cx + d - 10 + (i % 5) * 5, baseY - h + 34 + Math.floor(i / 5) * 13, 4, 3, '#a49b86');
      }
    });
    /* the attic storey and its row of shields */
    px(c, cx - w / 2, baseY - h + 12, w, 3, dk);
    for (let k = -w / 2 + 6; k < w / 2 - 6; k += 11) {
      px(c, cx + k, baseY - h + 5, 7, 6, '#8a8271');
      px(c, cx + k + 1, baseY - h + 6, 5, 4, '#6b6456');
    }
    /* the flame under the vault, and the flag over it */
    px(c, cx - 8, baseY - 3, 17, 3, '#3a3f46');
    px(c, cx - 2, baseY - 8, 5, 5, '#ff9d3c');
    px(c, cx - 1, baseY - 12, 3, 5, '#ffd75e');
    PIX.disc(c, cx, baseY - 9, 9, 'rgba(255,157,60,.13)');
    px(c, cx - 1, baseY - vh - 34, 2, 22, '#4a4438');
    px(c, cx + 1, baseY - vh - 34, 7, 5, '#2f4d9c');
    px(c, cx + 8, baseY - vh - 34, 6, 5, '#f4efe0');
    px(c, cx + 14, baseY - vh - 34, 6, 5, '#b8232f');
  }

  /* SACRÉ-CŒUR. Three white domes at the top of a lot of steps. */
  function basilica(c, cx, baseY) {
    const st = '#d8d2c2', lit = '#efe9d8', dk = '#a49d8c', sh = '#8c8676';
    /* the body of it */
    px(c, cx - 46, baseY - 34, 92, 34, st);
    px(c, cx - 46, baseY - 34, 92, 2, lit);
    px(c, cx + 40, baseY - 34, 6, 34, sh);
    /* the arcade across the front */
    for (let i = 0; i < 5; i++) {
      const ax = cx - 38 + i * 19;
      px(c, ax, baseY - 16, 13, 16, '#3a3a38');
      for (let k = 0; k < 13; k++) {
        const y = baseY - 16 - Math.round(Math.sqrt(Math.max(0, 42 - (k - 6) * (k - 6))));
        px(c, ax + k, y, 1, baseY - 16 - y, '#3a3a38');
      }
      px(c, ax - 2, baseY - 16, 2, 16, dk);
    }
    /* THE DOMES: one big, two small, all of them too white for this city */
    /* A DOME IS WIDEST AT ITS BASE. Drawn off a sine it pinches at both
       ends and you have painted a paper lantern; drawn off this it is the
       slightly pointed cupola that is actually up there. */
    const dome = (dx, r, up) => {
      const dcx = cx + dx, dby = baseY - 34 - up;
      const dh = Math.round(r * 1.45);
      px(c, dcx - r - 3, dby, r * 2 + 7, 4, dk);
      px(c, dcx - r - 2, dby - 3, r * 2 + 5, 3, sh);
      for (let i = 0; i <= dh; i++) {
        const f = i / dh;
        const hw = Math.max(1, Math.round(r * Math.pow(1 - f * f, 0.62)));
        px(c, dcx - hw, dby - 3 - i, hw * 2, 1, st);
        /* the light comes from the left, the way it does on the real one */
        px(c, dcx - hw, dby - 3 - i, Math.max(1, Math.round(hw * 0.5)), 1, lit);
        px(c, dcx + hw - 2, dby - 3 - i, 2, 1, sh);
      }
      /* the ribs down it */
      for (let k = -r + 2; k <= r - 2; k += Math.max(3, Math.round(r / 3))) {
        const f = Math.abs(k) / r;
        const top = Math.round(dh * Math.sqrt(Math.max(0, 1 - Math.pow(f, 1 / 0.31))));
        px(c, dcx + k, dby - 3 - top, 1, top, 'rgba(140,134,118,.5)');
      }
      /* the lantern and the cross on top */
      px(c, dcx - 4, dby - 6 - dh, 9, 6, st);
      px(c, dcx - 3, dby - 5 - dh, 7, 4, dk);
      px(c, dcx - 1, dby - 13 - dh, 3, 8, st);
      px(c, dcx - 3, dby - 11 - dh, 7, 2, st);
      px(c, dcx - 2, dby - 16 - dh, 5, 3, '#e0a63c');
    };
    dome(0, 22, 6);
    dome(-38, 11, 2);
    dome(38, 11, 2);
    /* the bell tower off to one side */
    px(c, cx + 58, baseY - 62, 20, 62, st);
    px(c, cx + 58, baseY - 62, 20, 2, lit);
    px(c, cx + 72, baseY - 62, 6, 62, sh);
    px(c, cx + 62, baseY - 54, 5, 12, '#3a3a38');
    px(c, cx + 69, baseY - 54, 5, 12, '#3a3a38');
    px(c, cx + 56, baseY - 68, 24, 7, dk);
    px(c, cx + 62, baseY - 78, 12, 11, st);
    px(c, cx + 66, baseY - 84, 4, 7, dk);
    /* and the floodlight on all of it */
    px(c, cx - 50, baseY - 90, 100, 90, 'rgba(255,247,220,.045)');
  }

  /* THE PYRAMID in the palace courtyard, lit from the inside. */
  function pyramid(c, cx, baseY, w, h) {
    const glass = 'rgba(190,225,245,.30)', frame = '#4a525d', warm = '#ffe7a8';
    for (let i = 0; i < h; i++) {
      const t = i / h, hw = Math.round((w / 2) * (1 - t));
      px(c, cx - hw, baseY - i, hw * 2, 1, glass);
    }
    /* the lattice: the whole point of the thing */
    for (let i = 0; i < h; i += 5) {
      const t = i / h, hw = Math.round((w / 2) * (1 - t));
      px(c, cx - hw, baseY - i, hw * 2, 1, frame);
      px(c, cx - hw, baseY - i, hw * 2, 1, 'rgba(255,231,168,.16)');
    }
    for (let k = -w / 2; k <= w / 2; k += 8) {
      const top = Math.round(h * (1 - Math.abs(k) / (w / 2)));
      for (let i = 0; i < top; i += 2) px(c, cx + k, baseY - i, 1, 1, frame);
    }
    /* the light coming up out of the hole in the ground */
    px(c, cx - w / 2, baseY - 3, w, 4, warm);
    PIX.disc(c, cx, baseY - 6, Math.round(w * 0.6), 'rgba(255,231,168,.07)');
    px(c, cx - 2, baseY - h - 3, 5, 4, frame);
  }

  /* A WALL OF BONES. Femurs stacked like cordwood, with skulls in
     courses through it, which is exactly how they really did it. */
  function boneWall(c, x, y, w, h, seed) {
    const rng = U.mulberry32(seed * 19 + 11);
    const b1 = '#c9c1a8', b2 = '#aaa189', b3 = '#8a8372', dk = '#4f4a3e';
    px(c, x, y, w, h, '#221f1a');
    /* THE COURSES. Femur ends most of the way up, and a row of skulls every
       so often, which is exactly how they stacked them. Nothing here is on
       a grid: a grid reads as tiling and tiling reads as wallpaper. */
    let ry = 0;
    let row = 0;
    while (ry < h) {
      const skullRow = (row % 3) === 1;
      const rh = skullRow ? 7 : 5;
      let rx = -Math.floor(rng() * 4);
      while (rx < w) {
        if (skullRow) {
          const sw = 8, sh = 6;
          if (rx + 2 < w) {
            /* the cranium */
            PIX.disc(c, x + rx + 4, y + ry + 3, 4, b2);
            PIX.disc(c, x + rx + 4, y + ry + 2, 3, b1);
            /* two sockets and the nose */
            px(c, x + rx + 2, y + ry + 2, 2, 2, dk);
            px(c, x + rx + 5, y + ry + 2, 2, 2, dk);
            px(c, x + rx + 4, y + ry + 4, 1, 2, dk);
            /* the jaw */
            px(c, x + rx + 3, y + ry + 5, 4, 2, b3);
            px(c, x + rx + 3, y + ry + 6, 4, 1, dk);
          }
          rx += sw + Math.floor(rng() * 2);
        } else {
          const t = rng();
          const bw2 = 4 + (t < 0.25 ? 1 : 0);
          /* the sawn end of a femur: round, not square */
          PIX.disc(c, x + rx + 2, y + ry + 2, 2, t < 0.4 ? b1 : t < 0.75 ? b2 : b3);
          px(c, x + rx, y + ry + 1, bw2, 1, 'rgba(240,234,214,.35)');
          px(c, x + rx + bw2 - 1, y + ry + 1, 1, 3, dk);
          rx += bw2 + 1 + Math.floor(rng() * 2);
        }
      }
      /* the shadow line under each course */
      px(c, x, y + ry + rh - 1, w, 1, 'rgba(0,0,0,.34)');
      ry += rh;
      row++;
    }
    /* two centuries of damp coming through it, and the dark at the edges */
    ART.dither(c, x, y, w, h, 'rgba(40,58,52,.20)', 0.14, seed % 29);
    for (let i = 0; i < 10; i++) {
      px(c, x, y + i, w, 1, 'rgba(0,0,0,' + (0.30 - i * 0.03).toFixed(3) + ')');
      px(c, x, y + h - 1 - i, w, 1, 'rgba(0,0,0,' + (0.24 - i * 0.024).toFixed(3) + ')');
    }
  }

  /* the art nouveau mouth of a metro station, from the street */
  function metroSign(c, x, y) {
    const iron = '#1f3a30', lit = '#2b4c40', amber = '#e0a63c';
    /* the two whiplash standards */
    [-24, 24].forEach(d => {
      px(c, x + d - 2, y - 40, 4, 40, iron);
      px(c, x + d - 2, y - 40, 1, 40, lit);
      px(c, x + d - 5, y - 46, 11, 7, iron);
      PIX.disc(c, x + d, y - 50, 5, iron);
      PIX.disc(c, x + d, y - 50, 3, amber);
      PIX.disc(c, x + d, y - 50, 6, 'rgba(224,166,60,.12)');
    });
    /* the sign between them */
    px(c, x - 26, y - 40, 53, 14, iron);
    px(c, x - 24, y - 38, 49, 10, '#12241d');
    const t = PIXFONT.render('METRO', { scale: 1, color: amber, shadow: null });
    c.drawImage(t, x - Math.round(t.width / 2), y - 36);
    /* the balustrade and the steps going down into the dark */
    px(c, x - 30, y - 12, 61, 3, iron);
    for (let k = -28; k < 30; k += 5) px(c, x + k, y - 10, 2, 10, iron);
    px(c, x - 22, y - 8, 45, 8, '#0b0e10');
  }

  /* ============================================================
     1. LA TOUR — the Champ de Mars, under the whole thing
     ============================================================ */
  function tower() {
    const W = 780, FY = 116, seed = seedFor('tower');
    const BAND = 26;

    const paint = (c) => {
      const p = P();
      /* the night over the park, and the city glow at the bottom of it */
      px(c, 0, 0, W, FY, '#0e1220');
      for (let i = 0; i < 46; i++) {
        px(c, 0, FY - BAND - 46 + i, W, 1,
          'rgba(60,74,110,' + (0.02 + i * 0.004).toFixed(3) + ')');
      }
      /* the far bank: rooftops, small, and the river between */
      for (let i = 0; i < 22; i++) {
        const bx = (i * 41 + seed % 23) % (W - 40);
        haussmann(c, bx, FY - BAND - 30 - (i % 3) * 6, 38, 26 + (i % 3) * 6, seed + i);
      }
      /* THE TOWER, over everything, cut off by the top of the frame */
      eiffel(c, 372, FY - BAND + 4, -58);

      /* the gravel of the Champ de Mars, run up into the depth */
      px(c, 0, FY - BAND, W, BAND + 20, '#3a3630');
      for (let ry = 0; ry < BAND + 18; ry += 3) {
        const t = 1 - ry / (BAND + 18);
        px(c, 0, FY - BAND + ry, W, 3, ry % 6 ? '#3e3a33' : '#37332d');
        px(c, 0, FY - BAND + ry, W, 1, 'rgba(255,255,255,' + (0.02 * t).toFixed(3) + ')');
      }
      ART.grain(c, 0, FY - BAND, W, BAND + 20, '#332f29', '#443f37', seed % 31);
      /* the path edging, and the puddles the rain leaves in the gravel */
      px(c, 0, FY - BAND, W, 1, '#4d4740');
      [[90, 26], [300, 34], [520, 22], [700, 30]].forEach(([wx, ww], i) => {
        ART.dither(c, wx, FY - 6, ww, 7, 'rgba(130,180,210,.20)', 0.4, 11 + i * 5);
      });

      /* the trees down both sides of it */
      [40, 128, 640, 730].forEach((tx, i) => planeTree(c, tx, FY - BAND + 6, 40, seed + i));
      /* the lamps along the path */
      [70, 200, 330, 470, 600, 720].forEach(lx => lamp(c, lx, FY - BAND + 8, 34, true));
      /* the benches, the fountain, the kiosk */
      bench(c, 168, FY - 2, 46);
      bench(c, 556, FY - 2, 46);
      wallace(c, 268, FY - 1);
      morris(c, 470, FY - 2, 54);
      /* the chestnut brazier, which is the only warm thing out here */
      ART.box(c, 620, FY - 22, 30, 22, { fill: '#3a2f28', top: '#4a3d33', bot: '#1d1713', ink: p.K });
      px(c, 624, FY - 26, 22, 5, '#2a231c');
      px(c, 628, FY - 30, 14, 5, '#c96a1e');
      px(c, 631, FY - 33, 8, 4, '#ff9d3c');
      PIX.disc(c, 635, FY - 30, 14, 'rgba(255,157,60,.10)');
      /* the souvenir stand: forty little towers on a trestle */
      ART.box(c, 92, FY - 20, 54, 20, { fill: '#4a3f2e', top: '#5e5038', bot: '#241d14', ink: p.K });
      for (let i = 0; i < 9; i++) {
        const sx = 96 + i * 6;
        px(c, sx, FY - 26, 1, 6, '#e0a63c');
        px(c, sx - 1, FY - 22, 3, 2, '#e0a63c');
      }
      px(c, 92, FY - 32, 54, 7, '#b8232f');
      const st = PIXFONT.render('SOUVENIRS', { scale: 1, color: '#f4efe0', shadow: null });
      c.drawImage(st, 96, FY - 30);
    };

    const spots = [
      { id: 'gravel', x: 168, z: 0.1, w: 46, top: FY - 22, label: 'UNDER THE BENCH',
        hint: 'WHAT THE GRAVEL KEPT' },
      { id: 'stand', x: 119, z: 0.16, w: 54, top: FY - 34, label: 'THE SOUVENIR STAND',
        hint: 'FORTY LITTLE TOWERS AND A CASH BOX' },
      { id: 'brazier', x: 635, z: 0.16, w: 30, top: FY - 34, label: 'THE CHESTNUT BRAZIER',
        hint: 'SOMEBODY BURNED SOMETHING IN HERE' },
      { id: 'kiosk', x: 470, z: 0.4, w: 26, top: FY - 58, label: 'THE MORRIS COLUMN',
        hint: 'BEHIND THE POSTERS' },
    ];

    const actors = [
      { id: 'wit', x: 300, z: 0.14, y: undefined, key: 'watch',
        def: typeof WATCH_DEF !== 'undefined' ? WATCH_DEF : null, face: -1,
        tag: 'THE NIGHT GENDARME', tagCol: PIX.PAL.L, witness: true },
      { id: 'busk', x: 556, z: 0.12, key: 'busk',
        def: typeof DILL_DEF !== 'undefined' ? DILL_DEF : null, face: -1,
        tag: 'AN ACCORDION', tagCol: PIX.PAL.P },
    ];

    const eggs = [
      egg({ id: 'duck2', x: 268, y: FY - 8, art: 'eg_duck',
        label: 'SOMETHING IN THE FOUNTAIN',
        look: 'A RUBBER DUCK, GOING NOWHERE, IN WATER NOBODY DRINKS ANY MORE.' }),
    ];

    return {
      id: 'tower', w: W, floorY: FY, paint, spots, actors, eggs, outdoor: true,
      depthBand: BAND, crowd: { n: 18, z0: 0.45, z1: 1 },
      pets: [{ kind: 'dog', x: 400, name: "A TOURIST'S DOG", fouls: true },
             { kind: 'cat', x: 700, name: 'A PARK CAT' }],
      enterX: 30, enterFace: 1,
      lights: [{ x: 372, y: 30, r: 90, a: 0.05 }, { x: 635, y: FY - 30, r: 30, a: 0.09 }],
    };
  }

  /* ============================================================
     2. L'ARC — the top of the avenue, twelve roads, one flame
     ============================================================ */
  function arch() {
    const W = 720, FY = 112, seed = seedFor('arch');
    const BAND = 22;

    const paint = (c) => {
      const p = P();
      px(c, 0, 0, W, FY, '#101426');
      for (let i = 0; i < 40; i++) {
        px(c, 0, FY - BAND - 40 + i, W, 1,
          'rgba(70,84,120,' + (0.02 + i * 0.005).toFixed(3) + ')');
      }
      /* the twelve avenues: blocks of Haussmann running away in both
         directions, with the gaps between them going black */
      for (let i = 0; i < 9; i++) {
        const bx = i * 84 + (seed % 17);
        if (i === 4) continue;                       // the arch stands in this gap
        haussmann(c, bx, FY - BAND - 44, 74, 44, seed + i * 3);
      }
      /* THE ARCH, dead centre, too big for the frame */
      arc(c, 360, FY - BAND + 2, 88);

      /* the roundabout: setts, and the white lines nobody obeys */
      cobbles(c, 0, FY - BAND, W, BAND + 20, seed);
      for (let k = 0; k < W; k += 26) {
        px(c, k, FY - BAND + 6, 14, 2, 'rgba(240,235,220,.12)');
      }
      /* the kerb ring round the monument */
      px(c, 240, FY - BAND + 1, 240, 2, '#4a4e55');
      px(c, 240, FY - BAND + 3, 240, 1, 'rgba(0,0,0,.4)');

      /* the lamps and the trees round the circle */
      [60, 180, 540, 660].forEach(lx => lamp(c, lx, FY - BAND + 6, 32, true));
      [26, 694].forEach((tx, i) => planeTree(c, tx, FY - BAND + 8, 36, seed + i * 5));
      /* the taxi rank */
      /* a 1930s cab: a long bonnet, a tall cabin behind it, mudguards over
         the wheels and a light on the roof that says it is for hire */
      const cab = (x, y) => {
        const body = '#20242c', bodyLit = '#333944', dark = '#0e1013';
        px(c, x + 2, y - 2, 54, 2, 'rgba(0,0,0,.4)');
        /* the running board and the sills */
        px(c, x + 6, y - 6, 46, 3, dark);
        /* the bonnet */
        px(c, x + 2, y - 15, 22, 10, body);
        px(c, x + 2, y - 15, 22, 2, bodyLit);
        px(c, x + 1, y - 12, 2, 7, dark);
        px(c, x + 3, y - 13, 1, 6, 'rgba(255,255,255,.10)');
        /* the cabin, taller than the bonnet */
        px(c, x + 24, y - 25, 26, 20, body);
        px(c, x + 24, y - 25, 26, 2, bodyLit);
        px(c, x + 26, y - 22, 9, 8, 'rgba(150,200,220,.22)');
        px(c, x + 37, y - 22, 10, 8, 'rgba(150,200,220,.16)');
        px(c, x + 47, y - 24, 3, 19, 'rgba(0,0,0,.3)');
        /* the mudguards, which is what makes it old */
        [11, 44].forEach(d => {
          for (let k = -7; k <= 7; k++) {
            const yy = y - 8 - Math.round(Math.sqrt(Math.max(0, 49 - k * k)));
            px(c, x + d + k, yy, 1, 3, dark);
          }
        });
        /* the wheels */
        [11, 44].forEach(d => {
          PIX.disc(c, x + d, y - 4, 5, p.K);
          PIX.disc(c, x + d, y - 4, 4, '#26292f');
          PIX.disc(c, x + d, y - 4, 2, '#4d535d');
        });
        /* the lamp on the wing and the sign on the roof */
        PIX.disc(c, x + 3, y - 17, 3, '#ffe7a8');
        px(c, x + 30, y - 29, 14, 5, '#b8232f');
        px(c, x + 31, y - 28, 12, 3, '#e0a63c');
        px(c, x + 52, y - 14, 3, 3, '#d13b45');
      };
      cab(120, FY - 2);
      cab(556, FY - 2);
      /* the metro mouth, which is how you get downstairs */
      metroSign(c, 470, FY - 1);
      /* the wreaths at the foot of the flame */
      [[344, 0], [372, 1]].forEach(([wx, i]) => {
        PIX.disc(c, wx, FY - 8, 9, '#1d3a26');
        PIX.disc(c, wx, FY - 8, 7, '#2c5a38');
        PIX.disc(c, wx, FY - 8, 4, '#101a12');
        px(c, wx - 2, FY - 12, 5, 3, i ? '#b8232f' : '#f4efe0');
      });
      bench(c, 250, FY - 2, 44);
    };

    const spots = [
      { id: 'flame', x: 360, z: 0.5, w: 30, top: FY - BAND - 14, label: 'THE FLAME',
        hint: 'IT HAS NOT GONE OUT SINCE 1923' },
      { id: 'wreath', x: 358, z: 0.12, w: 44, top: FY - 20, label: 'THE WREATHS',
        hint: 'SOMEBODY LEFT MORE THAN FLOWERS' },
      { id: 'cab', x: 146, z: 0.1, w: 52, top: FY - 30, label: 'THE TAXI RANK',
        hint: 'ASK WHAT THE DRIVER CARRIED' },
      { id: 'bench2', x: 272, z: 0.1, w: 44, top: FY - 24, label: 'THE BENCH',
        hint: 'UNDER THE SLATS' },
      { id: 'map', x: 470, z: 0.16, w: 40, top: FY - 52, label: 'THE METRO MAP',
        hint: 'SOMETHING PINNED TO IT' },
    ];

    const actors = [
      { id: 'wit', x: 556, z: 0.1, key: 'cabbie',
        def: typeof DILL_DEF !== 'undefined' ? DILL_DEF : null, face: -1,
        tag: 'A NIGHT CABBIE', tagCol: PIX.PAL.G, witness: true },
    ];

    return {
      id: 'arch', w: W, floorY: FY, paint, spots, actors, outdoor: true,
      depthBand: BAND, crowd: { n: 14, z0: 0.5, z1: 1 },
      traffic: { n: 5, z0: 0.62, z1: 0.95 },
      pets: [{ kind: 'dog', x: 260, name: 'A DOG OFF ITS LEAD', fouls: true }],
      enterX: 30, enterFace: 1,
      stairs: { to: 'metro', x: 470, label: 'DOWN INTO THE METRO', hint: 'THE LAST TRAIN WENT' },
      lights: [{ x: 360, y: FY - 20, r: 40, a: 0.08 },
               { x: 470, y: FY - 46, r: 26, a: 0.07 }],
    };
  }

  /* ============================================================
     3. LA BUTTE — Montmartre: the domes, the steps, the painters
     ============================================================ */
  function butte() {
    const W = 740, FY = 118, seed = seedFor('butte');
    const BAND = 24;

    const paint = (c) => {
      const p = P();
      px(c, 0, 0, W, FY, '#0f1322');
      /* the city, a long way below and behind */
      for (let i = 0; i < 30; i++) {
        const bx = (i * 27 + seed % 19) % (W - 24);
        px(c, bx, FY - BAND - 52 - (i % 4) * 3, 22, 20 + (i % 4) * 3, '#171d2c');
        if (i % 3 === 0) px(c, bx + 4, FY - BAND - 48, 3, 3, 'rgba(255,231,168,.5)');
      }
      /* THE BASILICA, up the hill, floodlit and unbothered */
      basilica(c, 402, FY - BAND - 22);
      /* the great flight of steps up to it */
      for (let i = 0; i < 14; i++) {
        const sw = 224 - i * 8;
        const sy = FY - BAND - 22 + i * 1.7;
        px(c, 402 - sw / 2, sy, sw, 2, '#6a6459');
        px(c, 402 - sw / 2, sy, sw, 1, '#8a8377');
        px(c, 402 - sw / 2, sy + 2, sw, 1, 'rgba(0,0,0,.4)');
      }
      /* the iron handrails up the middle of them */
      [-40, 40].forEach(d => {
        for (let i = 0; i < 12; i += 3) {
          px(c, 402 + d, FY - BAND - 22 + i * 1.7, 2, 8, '#2a2f36');
        }
        px(c, 402 + d - 1, FY - BAND - 26, 4, 22, '#2a2f36');
      });
      /* the funicular, off to the side, stopped for the night */
      px(c, 596, FY - BAND - 22, 26, 24, '#2b3038');
      px(c, 598, FY - BAND - 20, 22, 12, 'rgba(150,200,220,.18)');
      px(c, 594, FY - BAND + 2, 30, 3, '#1c2024');
      for (let i = 0; i < 8; i++) px(c, 600 + (i % 2) * 12, FY - BAND - 40 + i * 3, 8, 2, '#3a3f46');

      /* PLACE DU TERTRE: cobbles, easels, tables, and a lot of paint */
      cobbles(c, 0, FY - BAND, W, BAND + 20, seed);
      [90, 250, 500, 690].forEach(lx => lamp(c, lx, FY - BAND + 8, 30, true));
      [40, 640].forEach((tx, i) => planeTree(c, tx, FY - BAND + 10, 34, seed + i * 7));
      /* the easels, in a row, with a half-finished city on each */
      const easel = (x, y, col) => {
        px(c, x - 12, y - 34, 24, 26, '#c9c0a8');
        px(c, x - 11, y - 33, 22, 24, '#8fa8b8');
        px(c, x - 11, y - 20, 22, 11, col);
        px(c, x - 9, y - 30, 6, 8, '#e8dcbc');
        px(c, x - 1, y - 27, 9, 6, '#3a4f6a');
        px(c, x - 2, y - 8, 4, 8, '#4a3f2e');
        px(c, x - 10, y - 2, 9, 2, '#4a3f2e');
        px(c, x + 4, y - 2, 9, 2, '#4a3f2e');
        px(c, x - 14, y - 36, 28, 3, '#5a4f3a');
      };
      easel(180, FY - 1, '#3f6a4a');
      easel(228, FY - 1, '#6a4a3f');
      easel(560, FY - 1, '#4a3f6a');
      /* the scammers' folding table, three cups on it */
      ART.box(c, 300, FY - 18, 62, 18, { fill: '#4a3f2e', top: '#5e5038', bot: '#241d14', ink: p.K });
      for (let i = 0; i < 3; i++) {
        const cx2 = 312 + i * 19;
        px(c, cx2, FY - 26, 11, 8, '#b8232f');
        px(c, cx2, FY - 26, 11, 2, '#d94a52');
        px(c, cx2 - 1, FY - 19, 13, 2, '#8c1a24');
      }
      /* a cafe spilling onto the square */
      cafeTable(c, 660, FY - 1);
      cafeTable(c, 706, FY - 1);
      /* the artist's crate of tubes, and his loaf */
      ART.box(c, 120, FY - 14, 26, 14, { fill: '#5e5038', top: '#7a6a4a', bot: '#2a231a', ink: p.K });
      for (let i = 0; i < 5; i++) px(c, 123 + i * 5, FY - 18, 3, 5, ['#b8232f', '#e0a63c', '#3a5f9c', '#4fae6d', '#f4efe0'][i]);
      px(c, 148, FY - 8, 22, 5, '#c98a4a');
      px(c, 148, FY - 8, 22, 2, '#e0a86a');
    };

    const spots = [
      { id: 'easel', x: 204, z: 0.12, w: 60, top: FY - 40, label: 'THE EASELS',
        hint: 'HE PAINTS THE SAME STREET EVERY NIGHT' },
      { id: 'steps', x: 402, z: 0.62, w: 120, top: FY - BAND - 22, label: 'THE STEPS',
        hint: 'WHAT ROLLED DOWN THEM' },
      { id: 'crate2', x: 133, z: 0.1, w: 26, top: FY - 22, label: 'THE PAINT CRATE',
        hint: 'TUBES, RAGS, AND SOMETHING ELSE' },
      { id: 'table', x: 331, z: 0.12, w: 62, top: FY - 28, label: 'THE CUP TABLE',
        hint: 'THREE CUPS AND A CROWD' },
    ];

    const actors = [
      { id: 'paint', x: 152, z: 0.1, key: 'artist',
        def: typeof COOK_DEF !== 'undefined' ? COOK_DEF : null, face: 1,
        tag: 'THE PAINTER', tagCol: PIX.PAL.O, job: 'sit' },
      { id: 'scam', x: 331, z: 0.22, key: 'scam',
        def: typeof PAWN_DEF !== 'undefined' ? PAWN_DEF : null, face: -1,
        tag: 'THE CUP MAN', tagCol: PIX.PAL.R, job: 'cups' },
      { id: 'wit', x: 600, z: 0.1, key: 'waiter',
        def: typeof WAITRESS_DEF !== 'undefined' ? WAITRESS_DEF : null, face: -1,
        tag: 'THE CAFE WAITER', tagCol: PIX.PAL.G, witness: true },
    ];

    const eggs = [
      egg({ id: 'ball3', x: 660, y: FY - 22, art: 'eg_ball',
        label: 'SOMETHING ON THE TABLE',
        look: 'A RED AND WHITE BALL SOMEBODY LEFT WITH THEIR COFFEE. STILL WARM.' }),
      egg({ id: 'flag3', x: 228, y: FY - 40, art: 'eg_flag',
        label: 'A FLAG ON THE EASEL',
        look: 'A LITTLE FLAG PINNED TO THE FRAME. HE SAYS THE LIGHT IS BETTER THERE.' }),
    ];

    return {
      id: 'butte', w: W, floorY: FY, paint, spots, actors, eggs, outdoor: true,
      depthBand: BAND, crowd: { n: 20, z0: 0.4, z1: 1 },
      pets: [{ kind: 'dog', x: 480, name: "A PAINTER'S DOG", fouls: true },
             { kind: 'cat', x: 620, name: 'A ROOF CAT' }],
      enterX: 30, enterFace: 1,
      lights: [{ x: 402, y: FY - BAND - 40, r: 80, a: 0.05 },
               { x: 250, y: FY - 40, r: 34, a: 0.07 },
               { x: 680, y: FY - 40, r: 30, a: 0.07 }],
    };
  }

  /* ============================================================
     4. LE MUSEE — the palace courtyard after closing
     ============================================================ */
  function museum() {
    const W = 700, FY = 110, seed = seedFor('museum');
    const BAND = 20;

    const paint = (c) => {
      const p = P();
      px(c, 0, 0, W, FY, '#0d1120');
      /* the three wings of the palace, stone and window and stone */
      const wing = (x, w2, h2) => {
        px(c, x, FY - BAND - h2, w2, h2, '#6b6455');
        px(c, x, FY - BAND - h2, w2, 3, '#877f6c');
        px(c, x + w2 - 4, FY - BAND - h2, 4, h2, '#4c4740');
        /* the mansard and its dormers */
        for (let i = 0; i < 9; i++) {
          px(c, x + Math.round(i * 0.5), FY - BAND - h2 - 9 + i, w2 - i, 1, i < 2 ? '#4d535d' : '#3b4048');
        }
        for (let dx = x + 8; dx < x + w2 - 12; dx += 22) {
          px(c, dx, FY - BAND - h2 - 8, 12, 8, '#3b4048');
          px(c, dx + 2, FY - BAND - h2 - 6, 8, 6, '#22262e');
        }
        /* the arcade: tall arched windows, a few of them lit */
        for (let i = 0; i * 26 < w2 - 20; i++) {
          const wx = x + 10 + i * 26;
          const lit = ((i * 7 + seed) % 5) === 0;
          px(c, wx, FY - BAND - h2 + 16, 16, h2 - 26, '#191c22');
          px(c, wx + 1, FY - BAND - h2 + 17, 14, h2 - 28, lit ? '#e8c46a' : '#252a32');
          for (let k = 0; k < 16; k++) {
            const yy = FY - BAND - h2 + 16 - Math.round(Math.sqrt(Math.max(0, 64 - (k - 8) * (k - 8))));
            px(c, wx + k, yy, 1, FY - BAND - h2 + 16 - yy, '#191c22');
          }
          /* the caryatid pilasters between them */
          px(c, wx - 5, FY - BAND - h2 + 14, 4, h2 - 24, '#7a7263');
          px(c, wx - 5, FY - BAND - h2 + 14, 1, h2 - 24, '#948b78');
        }
      };
      wing(0, 240, 60);
      wing(460, 240, 60);
      wing(240, 220, 42);

      /* THE PYRAMID, lit from underneath, in the middle of all that stone */
      pyramid(c, 350, FY - BAND + 1, 130, 54);
      /* the two little ones beside it */
      pyramid(c, 250, FY - BAND + 1, 40, 17);
      pyramid(c, 450, FY - BAND + 1, 40, 17);

      /* the courtyard: pale stone, and the fountains in it */
      px(c, 0, FY - BAND, W, BAND + 20, '#4a4740');
      for (let ry = 0; ry < BAND + 18; ry += 6) {
        px(c, 0, FY - BAND + ry, W, 1, 'rgba(255,255,255,.045)');
      }
      for (let rx = 0; rx < W; rx += 30) px(c, rx, FY - BAND, 1, BAND + 18, 'rgba(0,0,0,.14)');
      ART.grain(c, 0, FY - BAND, W, BAND + 20, '#443f39', '#524d45', seed % 37);
      /* the reflecting pools */
      [[120, 90], [520, 90]].forEach(([wx, ww]) => {
        px(c, wx, FY - 16, ww, 15, '#1d3138');
        px(c, wx, FY - 16, ww, 2, '#2d4a52');
        px(c, wx + 2, FY - 14, ww - 4, 11, 'rgba(120,200,215,.14)');
        for (let k = 0; k < ww; k += 9) px(c, wx + k, FY - 10 + ((k + seed) % 3), 5, 1, 'rgba(180,230,240,.16)');
        /* the jet in the middle of it */
        px(c, wx + ww / 2, FY - 30, 1, 15, 'rgba(190,235,245,.35)');
        px(c, wx + ww / 2 - 3, FY - 32, 7, 3, 'rgba(190,235,245,.20)');
      });
      [40, 660].forEach(lx => lamp(c, lx, FY - BAND + 6, 28, true));
      /* a crate by the loading door, which is how things really leave a museum */
      ART.box(c, 620, FY - 24, 40, 24, { fill: '#6e4a30', top: '#8a5f3d', bot: '#3a2618', ink: p.K });
      px(c, 624, FY - 20, 32, 2, '#4a3020');
      px(c, 624, FY - 12, 32, 2, '#4a3020');
      px(c, 628, FY - 30, 8, 7, '#b8232f');
      px(c, 596, FY - 44, 20, 44, '#2b3038');
      px(c, 598, FY - 42, 16, 40, '#171b21');
      px(c, 610, FY - 26, 3, 4, '#e0a63c');
    };

    const spots = [
      { id: 'fountain', x: 165, z: 0.08, w: 90, top: FY - 34, label: 'THE POOL',
        hint: 'SOMETHING WENT IN AND NOBODY FISHED IT OUT' },
      { id: 'glass', x: 350, z: 0.5, w: 90, top: FY - BAND - 50, label: 'THE PYRAMID',
        hint: 'THE GLASS HAS A HANDPRINT ON IT' },
      { id: 'crate3', x: 640, z: 0.1, w: 40, top: FY - 32, label: 'THE CRATE',
        hint: 'STAMPED FOR SOMEWHERE ELSE' },
      { id: 'door', x: 606, z: 0.3, w: 22, top: FY - 48, label: 'THE LOADING DOOR',
        hint: 'THE LOCK IS NEWER THAN THE PALACE' },
    ];

    const actors = [
      { id: 'wit', x: 480, z: 0.12, key: 'guard',
        def: typeof NURSE_DEF !== 'undefined' ? NURSE_DEF : null, face: -1,
        tag: 'THE NIGHT GUARD', tagCol: PIX.PAL.L, witness: true },
    ];

    return {
      id: 'museum', w: W, floorY: FY, paint, spots, actors, outdoor: true,
      depthBand: BAND, crowd: { n: 8, z0: 0.55, z1: 0.95 },
      pets: [{ kind: 'cat', x: 300, name: 'THE COURTYARD CAT' }],
      enterX: 30, enterFace: 1,
      lights: [{ x: 350, y: FY - 30, r: 60, a: 0.07 }],
    };
  }

  /* ============================================================
     5. LES CATACOMBES — six million of them, and one meeting
     ============================================================ */
  function catacombs() {
    const W = 540, FY = 114, seed = seedFor('catacombs');
    const BAND = 16;

    const paint = (c) => {
      const p = P();
      px(c, 0, 0, W, FY + 20, '#120f0c');
      /* the tunnel: a barrel vault, cut by cross passages */
      for (let i = 0; i < 30; i++) {
        const t = i / 30;
        px(c, 0, i, W, 1, 'rgba(60,52,42,' + (0.5 - t * 0.4).toFixed(3) + ')');
      }
      /* THE WALLS, which are made of people */
      boneWall(c, 0, 28, W, FY - BAND - 30, seed);
      /* the arches: three of them, going back */
      [[110, 62, 44], [270, 74, 52], [430, 62, 44]].forEach(([ax, aw, ah], i) => {
        px(c, ax - aw / 2, FY - BAND - ah, aw, ah, '#0b0a08');
        for (let k = -aw / 2; k <= aw / 2; k++) {
          const y = FY - BAND - ah - Math.round(Math.cos((k / (aw / 2)) * 1.5) * 12);
          px(c, ax + k, y, 1, FY - BAND - ah - y, '#0b0a08');
        }
        /* the stone ring round the mouth of it */
        for (let k = -aw / 2 - 2; k <= aw / 2 + 2; k++) {
          const y = FY - BAND - ah - Math.round(Math.cos((k / (aw / 2 + 2)) * 1.5) * 13);
          px(c, ax + k, y - 2, 1, 3, '#5f5a4c');
          px(c, ax + k, y - 2, 1, 1, '#7d7768');
        }
        /* and what is stacked in the mouth of the middle one */
        if (i === 1) boneWall(c, ax - aw / 2 + 6, FY - BAND - ah + 10, aw - 12, ah - 12, seed + 3);
      });
      /* THE PLAQUE OVER THE MIDDLE ARCH, which says the only thing
         anybody remembers about this place. Two lines of the 5x7 font
         need eleven rows between them, not six: a rendered line is seven
         dots tall with a row of padding top and bottom, so anything
         tighter smears the descenders of one line through the caps of
         the next and the whole thing reads as gravel. */
      px(c, 232, FY - BAND - 96, 78, 28, '#3a3630');
      px(c, 234, FY - BAND - 94, 74, 24, '#57524a');
      const t2 = PIXFONT.render('ARRETE', { scale: 1, color: '#cfc7ae', shadow: null });
      c.drawImage(t2, 234 + Math.round((74 - t2.width) / 2), FY - BAND - 92);
      const t3 = PIXFONT.render("C'EST ICI", { scale: 1, color: '#cfc7ae', shadow: null });
      c.drawImage(t3, 234 + Math.round((74 - t3.width) / 2), FY - BAND - 81);

      /* the floor: wet limestone dust, and the water it collects in */
      px(c, 0, FY - BAND, W, BAND + 20, '#2e2a23');
      for (let ry = 0; ry < BAND + 18; ry += 4) {
        px(c, 0, FY - BAND + ry, W, 2, ry % 8 ? '#3e392f' : '#363128');
      }
      ART.grain(c, 0, FY - BAND, W, BAND + 20, '#332e26', '#454034', seed % 41);
      px(c, 150, FY - 10, 96, 11, 'rgba(40,70,72,.5)');
      for (let k = 0; k < 96; k += 8) px(c, 152 + k, FY - 8 + ((k + seed) % 3), 5, 1, 'rgba(140,210,215,.12)');
      /* a niche with a candle in it, which is somebody's idea of respect */
      px(c, 470, FY - BAND - 26, 22, 26, '#0b0a08');
      px(c, 476, FY - BAND - 14, 5, 12, '#ded2b4');
      px(c, 477, FY - BAND - 18, 3, 5, '#ff9d3c');
      PIX.disc(c, 478, FY - BAND - 16, 13, 'rgba(255,157,60,.10)');
      /* the one electric lamp somebody strung down here, hung clear of
         the plaque so the cord does not run through the lettering */
      px(c, 190, 0, 2, 22, '#2a2f36');
      PIX.disc(c, 191, 24, 5, '#2a2f36');
      PIX.disc(c, 191, 25, 3, '#ffe7a8');
      PIX.disc(c, 191, 25, 12, 'rgba(255,231,168,.09)');
      /* the table they meet at, and the two chairs nobody dusted */
      ART.box(c, 236, FY - 20, 70, 8, { fill: '#4a3f2e', top: '#61533b', bot: '#241d14', ink: p.K });
      px(c, 244, FY - 12, 4, 12, '#2a231a');
      px(c, 294, FY - 12, 4, 12, '#2a231a');
      px(c, 256, FY - 26, 12, 7, '#8d8672');
      px(c, 258, FY - 24, 8, 3, '#c9c0a8');
      /* THE DARK. Six million of them and one bulb: everything more than a
         few feet from it goes away, which is the whole feeling of the place. */
      for (let i = 0; i < W; i += 2) {
        const d = Math.abs(i - 271) / (W / 2);
        px(c, i, 0, 2, FY + 20, 'rgba(6,6,8,' + (0.12 + d * 0.55).toFixed(3) + ')');
      }
    };

    const spots = [
      { id: 'bones', x: 270, z: 0.62, w: 66, top: 40, bot: FY - BAND, label: 'THE WALL',
        hint: 'ONE OF THEM IS NOT AS OLD AS THE OTHERS' },
      { id: 'niche', x: 481, z: 0.2, w: 24, top: FY - 44, label: 'THE NICHE',
        hint: 'SOMEBODY LIT A CANDLE FOR SOMEBODY' },
      { id: 'plaque', x: 271, z: 0.7, w: 62, top: 12, bot: 40, label: 'THE PLAQUE',
        hint: 'STOP. THIS IS THE EMPIRE OF THE DEAD.' },
      { id: 'pool', x: 198, z: 0.06, w: 96, top: FY - 16, label: 'THE STANDING WATER',
        hint: 'SOMETHING WENT IN HERE' },
    ];

    const actors = [
      { id: 'wit', x: 400, z: 0.12, key: 'ossu',
        def: typeof BARMAN_DEF !== 'undefined' ? BARMAN_DEF : null, face: -1,
        tag: 'THE KEEPER', tagCol: PIX.PAL.q, witness: true },
    ];

    return {
      id: 'catacombs', w: W, floorY: FY, paint, spots, actors,
      depthBand: BAND,
      pets: [{ kind: 'cat', x: 120, name: 'SOMETHING WHITE' }],
      enterX: 26, enterFace: 1,
      lights: [{ x: 271, y: 24, r: 40, a: 0.08, flicker: true },
               { x: 478, y: FY - 30, r: 22, a: 0.07 }],
    };
  }

  /* ============================================================
     6. LE METRO — under the Etoile, after the last train
     ============================================================ */
  function metro() {
    const W = 480, FY = 112, seed = seedFor('metro');
    const BAND = 14;

    const paint = (c) => {
      const p = P();
      /* the vault, in white bevel tile, going grey with a century of smoke */
      px(c, 0, 0, W, FY, '#1b2024');
      for (let ry = 4; ry < FY - BAND - 6; ry += 6) {
        const off = ((ry / 6) % 2) ? 5 : 0;
        for (let rx = -off; rx < W; rx += 10) {
          px(c, rx, ry, 9, 5, ry < 20 ? '#8a8f8c' : '#a9aeaa');
          px(c, rx, ry, 9, 1, '#c2c7c2');
          px(c, rx, ry + 4, 9, 1, 'rgba(0,0,0,.22)');
        }
      }
      ART.dither(c, 0, 0, W, FY - BAND, 'rgba(30,26,20,.22)', 0.14, seed % 31);
      /* the curve of the vault: darker at the top */
      for (let i = 0; i < 26; i++) {
        px(c, 0, i, W, 1, 'rgba(10,14,16,' + (0.55 - i * 0.02).toFixed(3) + ')');
      }
      /* the station name in enamel, in a frame, twice */
      [70, 330].forEach(sx => {
        px(c, sx, 34, 96, 20, '#1f3a30');
        px(c, sx + 2, 36, 92, 16, '#2b4c40');
        const t = PIXFONT.render('ETOILE', { scale: 2, color: '#f4efe0', shadow: null });
        c.drawImage(t, sx + Math.round((96 - t.width) / 2), 40);
      });
      /* the adverts, pasted and re-pasted */
      px(c, 200, 30, 66, 44, '#3a3630');
      px(c, 203, 33, 60, 38, '#b8232f');
      px(c, 206, 38, 54, 10, '#f4efe0');
      px(c, 206, 52, 40, 6, 'rgba(244,239,224,.6)');
      px(c, 206, 60, 30, 5, 'rgba(244,239,224,.4)');
      /* the platform, and the yellow line nobody stands behind */
      px(c, 0, FY - BAND, W, BAND + 20, '#4a4740');
      for (let rx = 0; rx < W; rx += 22) px(c, rx, FY - BAND, 1, BAND + 18, 'rgba(0,0,0,.16)');
      px(c, 0, FY - BAND + 3, W, 2, '#e0a63c');
      px(c, 0, FY - BAND + 5, W, 1, 'rgba(0,0,0,.3)');
      ART.grain(c, 0, FY - BAND, W, BAND + 20, '#443f39', '#565049', seed % 29);
      /* THE TRACK, in the near foreground, below the platform edge */
      px(c, 0, FY + 2, W, 20, '#14171a');
      px(c, 0, FY + 4, W, 2, '#2a2f36');
      for (let rx = 0; rx < W; rx += 12) px(c, rx, FY + 8, 8, 3, '#3a2f28');
      px(c, 0, FY + 12, W, 2, '#5a636c');
      px(c, 0, FY + 17, W, 2, '#5a636c');
      /* the tunnel mouth, and one red light a long way down it */
      px(c, W - 90, 22, 90, FY - 22, '#07090b');
      for (let k = 0; k < 40; k++) {
        const y = 22 + Math.round(Math.sin((k / 40) * 1.6) * 10);
        px(c, W - 90 + k, y, 1, FY - 22 - y, '#07090b');
      }
      px(c, W - 26, FY - 30, 3, 3, '#ff6a5e');
      PIX.disc(c, W - 25, FY - 29, 7, 'rgba(255,106,94,.10)');
      /* a wooden bench and a bin nobody empties */
      bench(c, 120, FY - 1, 50);
      px(c, 300, FY - 18, 20, 18, '#2b3038');
      px(c, 298, FY - 20, 24, 3, '#3d444d');
      px(c, 304, FY - 24, 6, 5, '#8d8672');
      /* the grate the draught comes up through */
      px(c, 380, FY - 4, 40, 4, p.K);
      for (let i = 0; i < 9; i++) px(c, 383 + i * 4, FY - 3, 2, 3, '#0b0e10');
    };

    const spots = [
      { id: 'bench3', x: 145, z: 0.1, w: 50, top: FY - 26, label: 'THE BENCH',
        hint: 'SOMEBODY SLEPT HERE AND LEFT IN A HURRY' },
      { id: 'grate2', x: 400, z: 0.08, w: 40, top: FY - 12, label: 'THE GRATE',
        hint: 'THE DRAUGHT BRINGS THINGS UP' },
      { id: 'poster', x: 233, z: 0.5, w: 66, top: 26, bot: 78, label: 'THE ADVERT',
        hint: 'SOMETHING PASTED OVER SOMETHING' },
    ];

    return {
      id: 'metro', w: W, floorY: FY, paint, spots, actors: [],
      depthBand: BAND, crowd: { n: 5, z0: 0.55, z1: 0.9 },
      pets: [{ kind: 'cat', x: 330, name: 'A PLATFORM CAT' }],
      enterX: 40, enterFace: 1,
      stairs: { to: 'arch', x: 20, label: 'BACK UP TO THE STREET', hint: 'INTO THE TRAFFIC' },
      lights: [{ x: 120, y: 14, r: 40, a: 0.07 }, { x: 320, y: 14, r: 40, a: 0.07, flicker: true }],
    };
  }

  /* pulled in from places.js so the eggs work the same way out here */
  function egg(o) {
    const sp = {
      id: 'egg:' + o.id, x: o.x, y: o.y, w: 18,
      top: o.y - 11, bot: o.y + 11,
      egg: true, art: o.art, label: o.label, hint: 'WORTH A CLOSER LOOK', look: o.look,
    };
    sp.onUse = () => STORY.lookClose(sp, sp.x, o.y);
    return sp;
  }

  return {
    BUILD: { tower, arch, butte, museum, catacombs, metro },
    /* the helpers, so places.js and rooms.js can dress themselves in Paris */
    haussmann, lamp, planeTree, wallace, morris, bench, cobbles, cafeTable,
    eiffel, arc, basilica, pyramid, boneWall, metroSign, egg,
  };
})();
