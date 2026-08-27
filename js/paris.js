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

  /* ============================================================
     THE PALETTE OF A PARIS AFTERNOON.

     Every room in here is painted ONCE, at this one reference
     light: a bright afternoon, sun from the left. The hour is not
     baked in — DAY.wash() grades the whole frame per frame, so the
     same painted stone is cream at noon and apricot at six.

     That is why nothing below is allowed to be a night colour. A
     room painted navy cannot be graded back to daylight; a room
     painted in daylight grades to dusk beautifully.
     ============================================================ */
  const L = {
    /* limestone, which is what this city is made of */
    stone: '#e8dfc6', stoneLit: '#f6efd9', stoneMid: '#cfc4a8',
    stoneDk: '#ab9f86', stoneDeep: '#8a7e68',
    /* zinc roofs and the grey they go */
    zinc: '#98a1ac', zincLit: '#b5bec8', zincDk: '#6f7883',
    /* the green this city paints its ironwork */
    iron: '#3f6b45', ironLit: '#578a57', ironDk: '#26482d',
    /* window glass in daylight: it reflects the sky, it does not glow */
    glass: '#67788a', glassLit: '#9dbcd2', glassDk: '#3f4e5c',
    /* shutters, and the pale mottled bark of a plane tree */
    shut: '#5f7f56', shutDk: '#3d5a3a',
    bark: '#b3a893', barkLit: '#cdc3ac', barkDk: '#8b8270', barkMot: '#93a081',
    /* leaves */
    leaf: '#5f8f45', leafLit: '#7fae57', leafDk: '#3c6130',
    /* pavement */
    sett: '#9a9287', settLit: '#aca496', settDk: '#807869', joint: '#6f6759',
    /* awnings and terrace furniture */
    red: '#b8384a', redDk: '#8a2434', cream: '#efe4cc',
    marble: '#eae2ce', rattan: '#c9a15e', rattanDk: '#96703c',
    brass: '#e0a63c', wood: '#8a6a44', woodDk: '#5d4728',
  };

  function seedFor(id) {
    return U.hashSeed((G.seedStr || 'X') + ':' + (G.chapter || 1) + ':' + id);
  }

  /* ============================================================
     WHY THINGS FLOAT, AND THE ONE-LINE CURE.

     A bench drawn on a pavement at the same brightness as the
     pavement is a bench-shaped hole. The eye reads CONTACT from a
     shadow, not from a coordinate — and half the furniture in this
     city had none, so it all looked like it was hovering an inch
     off the ground even though every one of them was placed
     exactly right.

     `foot` puts the shadow down: darkest and tightest where the
     legs meet the stone, softer and wider as it spreads, and
     always off to the shaded side. Called at the END of a prop, so
     nothing is drawn on top of it.
     ============================================================ */
  function foot(c, x, y, w, spread) {
    const sp = spread === undefined ? 3 : spread;
    px(c, x, y, w, 1, 'rgba(52,44,32,.42)');
    px(c, x + 1, y + 1, w + sp, 1, 'rgba(52,44,32,.26)');
    px(c, x + 2, y + 2, w + sp * 2, 1, 'rgba(52,44,32,.14)');
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
    const stone = L.stone, stoneLit = L.stoneLit, stoneDk = L.stoneDk;
    const roof = L.zinc, roofLit = L.zincLit;
    px(c, x, y, w, h, stone);
    px(c, x, y, w, 2, stoneLit);
    px(c, x, y, 2, h, stoneLit);            // the sunny return, on the left
    px(c, x + w - 3, y, 3, h, stoneDk);
    /* THE MANSARD, ON TOP — and the right way up.

       This was drawn widest at the ridge and narrowest where it meets the
       wall, which is a funnel, not a roof. At the old building height it
       was six rows and nobody noticed; at sixty it made a street of
       inverted grey hoppers. A roof narrows as it goes UP. */
    const rh = Math.max(6, Math.round(h * 0.2));
    for (let i = 0; i < rh; i++) {
      const back = rh - 1 - i;                   // 0 at the eaves, rh-1 at the ridge
      px(c, x + Math.round(back * 0.55), y - rh + i, w - Math.round(back * 1.1), 1,
        back > rh - 3 ? roofLit : roof);
    }
    /* the ridge, and the zinc seams down the slope */
    px(c, x + Math.round((rh - 1) * 0.55), y - rh, w - Math.round((rh - 1) * 1.1), 1, '#cfd6de');
    for (let sx = x + 5; sx < x + w - 4; sx += 9) {
      px(c, sx, y - rh + 2, 1, rh - 2, 'rgba(80,90,102,.45)');
    }
    /* CHIMNEY POTS. A Paris roofline is more pot than roof. */
    for (let k = 0; k < 2 + (seed % 3); k++) {
      const cx2 = x + 5 + Math.floor(rng() * Math.max(1, w - 12));
      const chh = 5 + Math.floor(rng() * 5);
      px(c, cx2, y - rh - chh, 4, chh, '#b08a72');
      px(c, cx2, y - rh - chh, 4, 1, '#d2ac90');
      px(c, cx2 + 3, y - rh - chh, 1, chh, '#8a6a56');
      px(c, cx2, y - rh - chh - 2, 4, 2, '#6f5a4a');
    }
    /* string courses: this city is made of horizontal lines */
    for (let ly = y + 12; ly < y + h - 6; ly += 16) {
      px(c, x, ly, w, 1, stoneLit);
      px(c, x, ly + 1, w, 1, stoneDk);
    }
    /* WINDOWS, tall and thin, with balconies on the good floors. In
       daylight a window is not a lit yellow square — it is a dark pane
       with the sky in the top of it, and the ones standing open are the
       only ones you can see into. */
    for (let ly = y + 4; ly < y + h - 12; ly += 16) {
      for (let lx = x + 4; lx < x + w - 8; lx += 13) {
        const open = rng() < 0.22;
        px(c, lx - 1, ly - 1, 10, 13, L.stoneDk);      // the reveal
        px(c, lx, ly, 8, 11, L.glassDk);
        px(c, lx + 1, ly + 1, 6, 9, L.glass);
        px(c, lx + 1, ly + 1, 6, 3, L.glassLit);       // the sky, in the top of it
        px(c, lx + 4, ly + 1, 1, 9, L.glassDk);        // the mullion
        if (open) {
          px(c, lx + 1, ly + 4, 6, 6, '#4a3b2e');      // the room behind it
          px(c, lx + 5, ly + 4, 2, 6, L.glassLit);     // the leaf, swung in
          if (rng() < 0.45) px(c, lx + 2, ly + 6, 3, 4, '#8a6a44');   // somebody at it
        }
        /* the shutters, folded back against the stone */
        px(c, lx - 2, ly, 2, 11, L.shut);
        px(c, lx - 2, ly, 1, 11, L.shutDk);
        px(c, lx + 8, ly, 2, 11, L.shut);
        px(c, lx + 9, ly, 1, 11, L.shutDk);
        /* iron balcony */
        if (((ly - y) / 16) % 2 === 1) {
          px(c, lx - 3, ly + 10, 14, 1, L.ironDk);
          for (let bx = lx - 3; bx < lx + 11; bx += 2) px(c, bx, ly + 7, 1, 3, L.iron);
          px(c, lx - 3, ly + 7, 14, 1, L.ironLit);
        }
      }
    }
    /* THE SHOPFRONT at the bottom: a fascia, a window with something in
       it, and — on about half of them — an awning.

       NOT ON EVERY BUILDING. Every block used to get an awning two pixels
       wider than itself, so a terrace of them merged into one continuous
       red ribbon running the whole length of the street. Half of them, and
       inset, so the ribbon breaks. */
    const aw = ['#b8384a', '#3f6b45', '#2f4a70', '#8a6a44'][seed % 4];
    px(c, x + 2, y + h - 13, w - 4, 13, L.woodDk);
    px(c, x + 3, y + h - 12, w - 6, 5, L.cream);       // the fascia
    px(c, x + 3, y + h - 12, w - 6, 1, '#ffffff');
    px(c, x + 5, y + h - 10, w - 12, 2, L.woodDk);     // the lettering, unreadable
    /* the glass, and whatever is standing in the window */
    px(c, x + 4, y + h - 7, w - 8, 7, L.glassDk);
    px(c, x + 5, y + h - 6, w - 10, 5, L.glass);
    px(c, x + 5, y + h - 6, w - 10, 2, L.glassLit);
    for (let gx = x + 7; gx < x + w - 8; gx += 7) {
      px(c, gx, y + h - 4, 3, 3, ['#b8384a', '#e0a63c', '#5f8f45'][(gx + seed) % 3]);
    }
    /* and the awning, on the ones that have one */
    if (seed % 2) {
      px(c, x + 1, y + h - 8, w - 2, 4, aw);
      px(c, x + 1, y + h - 8, w - 2, 1, 'rgba(255,255,255,.35)');
      for (let sx = x + 1; sx < x + w - 2; sx += 4) px(c, sx, y + h - 4, 2, 2, aw);
    }
  }

  /* the double-globe cast iron lamp post this whole city is lit by */
  function lamp(c, x, y, h, on) {
    /* A LAMP POST IN DAYLIGHT IS A DARK GREEN POST. Whether the globes
       are burning is not the paint's business any more — the room is
       painted once and the hour moves, so the light in a lamp is drawn
       live by the scene off `def.lights` and gated on DAY.lamps(). What
       is baked here is cold glass. */
    px(c, x - 4, y, 9, 2, L.ironDk);
    px(c, x - 3, y - 3, 7, 3, L.iron);
    px(c, x - 3, y - 3, 1, 3, L.ironLit);
    px(c, x - 1, y - h, 3, h - 2, L.iron);
    px(c, x - 1, y - h, 1, h - 2, L.ironLit);
    /* the arm and the two globes */
    px(c, x - 7, y - h - 2, 15, 2, L.iron);
    px(c, x - 7, y - h - 2, 15, 1, L.ironLit);
    [-6, 6].forEach(d => {
      PIX.disc(c, x + d, y - h - 6, 4, L.ironDk);
      PIX.disc(c, x + d, y - h - 6, 3, on ? '#ffe7a8' : '#cdd6dc');
      PIX.disc(c, x + d - 1, y - h - 7, 1, '#ffffff');       // the highlight on it
      if (on) PIX.disc(c, x + d, y - h - 6, 5, 'rgba(255,231,168,.10)');
    });
    px(c, x - 1, y - h - 9, 3, 4, L.iron);
    px(c, x - 1, y - h - 10, 3, 1, L.brass);
    foot(c, x - 5, y + 2, 11, 4);
  }

  /* a pollarded plane tree: the trunk is the point, the crown is a blob */
  function planeTree(c, x, y, h, seed) {
    const rng = U.mulberry32(seed * 17 + 3);
    /* THE BARK IS THE POINT. A plane tree is not a brown trunk: it is
       pale grey-cream that flakes off in patches and leaves olive
       underneath, which is the one thing that makes it read as this
       city's tree and not any other one. */
    px(c, x - 4, y - h, 9, h, L.bark);
    px(c, x - 4, y - h, 3, h, L.barkLit);
    px(c, x + 3, y - h, 2, h, L.barkDk);
    for (let i = 0; i < 11; i++) {
      const mx = x - 3 + Math.floor(rng() * 7);
      const my = y - h + 3 + Math.floor(rng() * (h - 6));
      px(c, mx, my, 2 + Math.floor(rng() * 2), 3, rng() < 0.5 ? L.barkMot : L.barkDk);
    }
    /* the crown, cut back the way this city cuts them back */
    const cy = y - h - 8;
    PIX.disc(c, x, cy, 16, L.leafDk);
    PIX.disc(c, x - 8, cy + 4, 12, L.leafDk);
    PIX.disc(c, x + 9, cy + 3, 13, L.leafDk);
    PIX.disc(c, x - 3, cy - 2, 12, L.leaf);
    PIX.disc(c, x + 7, cy - 1, 10, L.leaf);
    PIX.disc(c, x - 5, cy - 6, 8, L.leafLit);
    PIX.disc(c, x + 4, cy - 6, 7, L.leafLit);
    /* the individual leaves that break the silhouette up */
    for (let i = 0; i < 20; i++) {
      const lx = x - 16 + Math.floor(rng() * 33);
      const ly = cy - 10 + Math.floor(rng() * 22);
      px(c, lx, ly, 3, 2, rng() < 0.4 ? L.leafLit : L.leaf);
    }
    /* and the shade it throws, which is why anybody planted it */
    foot(c, x - 6, y, 13, 8);
    px(c, x - 16, y + 2, 33, 2, 'rgba(58,52,36,.20)');
    px(c, x - 11, y + 4, 23, 1, 'rgba(58,52,36,.12)');
  }

  /* THE WALLACE FOUNTAIN. Four bronze women holding up a dome, and
     water nobody drinks any more. */
  function wallace(c, x, y) {
    const bronze = L.iron, bronzeLit = L.ironLit, dk = L.ironDk;
    px(c, x - 8, y - 4, 17, 4, dk);
    px(c, x - 7, y - 6, 15, 3, bronze);
    px(c, x - 4, y - 34, 9, 29, bronze);
    px(c, x - 4, y - 34, 2, 29, bronzeLit);
    /* the four caryatids, which at this size are four shoulders */
    [-5, 5].forEach(d => {
      px(c, x + d - 2, y - 30, 4, 18, bronze);
      px(c, x + d - 2, y - 30, 4, 3, bronzeLit);
      px(c, x + d - 1, y - 33, 2, 3, L.ironLit);
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
    foot(c, x - 9, y, 19, 5);
  }

  /* a Morris column: a fat cylinder of theatre posters with a cap */
  function morris(c, x, y, h) {
    px(c, x - 11, y - h, 23, h, L.iron);
    px(c, x - 11, y - h, 3, h, L.ironLit);
    px(c, x + 7, y - h, 5, h, 'rgba(0,0,0,.22)');
    /* the posters, which in daylight are the brightest thing on the street */
    const cols = ['#c8384a', '#e0a63c', '#3f6ba8', '#b8506a'];
    for (let i = 0; i < 3; i++) {
      const py0 = y - h + 8 + i * 22;
      px(c, x - 9, py0, 19, 19, cols[i % cols.length]);
      px(c, x - 8, py0 + 1, 17, 4, 'rgba(255,255,255,.5)');
      px(c, x - 8, py0 + 8, 17, 2, 'rgba(0,0,0,.3)');
      px(c, x - 8, py0 + 12, 12, 2, 'rgba(0,0,0,.25)');
    }
    /* the cap, with the little dome */
    px(c, x - 13, y - h - 4, 27, 5, L.ironDk);
    px(c, x - 9, y - h - 8, 19, 5, L.iron);
    PIX.disc(c, x, y - h - 11, 5, L.iron);
    px(c, x - 1, y - h - 16, 3, 5, L.brass);
    foot(c, x - 12, y, 25, 6);
  }

  /* a green slat bench, the kind bolted to every gravel path in the city */
  function bench(c, x, y, w) {
    const g = L.iron, gl = L.ironLit, dk = L.ironDk;
    px(c, x, y - 10, w, 3, g);
    px(c, x, y - 10, w, 1, gl);
    px(c, x, y - 14, w, 2, g);
    px(c, x, y - 18, w, 2, dk);
    px(c, x + 1, y - 7, 3, 7, dk);
    px(c, x + w - 4, y - 7, 3, 7, dk);
    px(c, x, y - 20, 2, 12, dk);
    px(c, x + w - 2, y - 20, 2, 12, dk);
    foot(c, x, y, w, 4);
  }

  /* the pavement: setts, worn smooth, wet more often than not */
  function cobbles(c, x, y, w, h, seed) {
    const rng = U.mulberry32(seed * 13 + 5);
    px(c, x, y, w, h, L.joint);
    for (let ry = 0; ry < h; ry += 4) {
      const off = (ry / 4) % 2 ? 3 : 0;
      for (let rx = -off; rx < w; rx += 6) {
        const t = rng();
        px(c, x + rx, y + ry, 5, 3, t < 0.3 ? L.settLit : t < 0.68 ? L.sett : L.settDk);
        px(c, x + rx, y + ry, 5, 1, 'rgba(255,255,255,.16)');    // the sun on the crown
        px(c, x + rx, y + ry + 2, 5, 1, 'rgba(70,62,50,.18)');   // and the shade behind
      }
    }
    /* the gutter, and the water somebody sluiced down it this morning */
    px(c, x, y + h - 3, w, 1, 'rgba(80,72,58,.35)');
    px(c, x, y + h - 2, w, 2, 'rgba(150,200,210,.18)');
    for (let k = 0; k < w; k += 7) px(c, x + k, y + h - 2, 3, 1, 'rgba(230,250,255,.20)');
  }

  /* a cafe table with two chairs and somebody's cold coffee on it */
  function cafeTable(c, x, y) {
    /* marble round, cast iron pedestal */
    px(c, x - 9, y - 16, 19, 3, L.marble);
    px(c, x - 9, y - 16, 19, 1, '#ffffff');
    px(c, x - 9, y - 14, 19, 1, 'rgba(90,80,62,.35)');
    px(c, x - 1, y - 13, 3, 13, L.iron);
    px(c, x - 5, y - 1, 11, 2, L.ironDk);
    /* the rattan chairs, which is what a Paris terrace is made of */
    [-15, 14].forEach(d => {
      px(c, x + d - 4, y - 12, 9, 2, L.rattanDk);
      px(c, x + d - 4, y - 22, 9, 10, L.rattan);
      px(c, x + d - 4, y - 22, 9, 2, '#e0bd7c');
      for (let k = 0; k < 9; k += 3) px(c, x + d - 4 + k, y - 21, 1, 9, L.rattanDk);
      px(c, x + d - 3, y - 10, 2, 10, L.ironDk);
      px(c, x + d + 2, y - 10, 2, 10, L.ironDk);
    });
    /* and the coffee, and the little glass of water beside it */
    px(c, x + 1, y - 21, 5, 5, '#ffffff');
    px(c, x + 2, y - 20, 3, 2, '#5a3a22');
    px(c, x + 6, y - 20, 3, 4, 'rgba(210,235,245,.75)');
    px(c, x - 7, y - 19, 4, 3, L.cream);          // the saucer with the bill on it
    /* three shadows, because a table and two chairs are three things */
    foot(c, x - 6, y, 13, 3);
    foot(c, x - 20, y, 10, 2);
    foot(c, x + 9, y, 10, 2);
  }

  /* ============================================================
     THE LANDMARKS.

     Drawn big enough that the frame cannot hold them, because
     that is the only honest way to draw any of these.
     ============================================================ */

  /* LA TOUR EIFFEL. Four legs, two platforms, a lattice you can see the
     sky through, and the gold light they wash it with after dark. */
  function eiffel(c, cx, baseY, topY) {
    /* IRON, NOT TIMBER. The real thing is painted a warm bronze-brown, but
       at a warm enough brown with a soft lattice it came out as scaffolding
       poles: cooler, darker in the shadow, and a lattice with real contrast
       in it is what makes a hundred metres of wrought iron read as metal. */
    const iron = '#6f5c46', ironLit = '#a3906c', ironDk = '#3f3324';
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
        px(c, cx - xa, y, 1, 1, 'rgba(196,176,138,.62)');
        px(c, cx - Math.round(xb * 0.42), y, 1, 1, 'rgba(90,74,52,.55)');
        /* right bay */
        px(c, cx + xa - 1, y, 1, 1, 'rgba(196,176,138,.62)');
        px(c, cx + Math.round(xb * 0.42), y, 1, 1, 'rgba(90,74,52,.55)');
      }
      /* the horizontal girder at each stage */
      const hh = halfAt(t0);
      px(c, cx - hh, baseY - i, hh * 2, 1, 'rgba(196,176,138,.48)');
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
    const stone = L.stone, lit = L.stoneLit, dk = L.stoneDk;
    const w = 106, vw = 38;
    px(c, cx - w / 2, baseY - h, w, h, stone);
    px(c, cx - w / 2, baseY - h, w, 3, lit);
    px(c, cx + w / 2 - 4, baseY - h, 4, h, dk);
    /* the vault, cut out of it */
    const vh = Math.round(h * 0.62);
    px(c, cx - vw / 2, baseY - vh, vw, vh, '#4b4335');
    for (let k = -vw / 2; k <= vw / 2; k++) {
      const y = baseY - vh - Math.round(Math.cos((k / (vw / 2)) * 1.5) * 16);
      px(c, cx + k, y, 1, baseY - vh - y, '#4b4335');
    }
    px(c, cx - vw / 2 - 2, baseY - vh - 18, vw + 4, 2, dk);
    /* the coffers inside the vault */
    for (let i = 0; i < 5; i++) {
      px(c, cx - vw / 2 + 4 + i * 8, baseY - vh - 6, 6, 4, 'rgba(255,255,255,.05)');
    }
    /* the four reliefs, which at this size are four crowds of stone */
    [[-40, 0], [40, 0]].forEach(([d]) => {
      px(c, cx + d - 13, baseY - h + 30, 26, 34, dk);
      px(c, cx + d - 12, baseY - h + 31, 24, 32, L.stoneMid);
      for (let i = 0; i < 9; i++) {
        px(c, cx + d - 10 + (i % 5) * 5, baseY - h + 34 + Math.floor(i / 5) * 13, 4, 11, L.stoneDk);
        px(c, cx + d - 10 + (i % 5) * 5, baseY - h + 34 + Math.floor(i / 5) * 13, 4, 3, L.stoneLit);
      }
    });
    /* the attic storey and its row of shields */
    px(c, cx - w / 2, baseY - h + 12, w, 3, dk);
    for (let k = -w / 2 + 6; k < w / 2 - 6; k += 11) {
      px(c, cx + k, baseY - h + 5, 7, 6, L.stoneMid);
      px(c, cx + k + 1, baseY - h + 6, 5, 4, L.stoneDk);
    }
    /* the flame under the vault, and the flag over it */
    px(c, cx - 8, baseY - 3, 17, 3, '#6b6151');
    px(c, cx - 2, baseY - 8, 5, 5, '#ff9d3c');
    px(c, cx - 1, baseY - 12, 3, 5, '#ffd75e');
    PIX.disc(c, cx, baseY - 9, 9, 'rgba(255,157,60,.13)');
    px(c, cx - 1, baseY - vh - 34, 2, 22, L.stoneDeep);
    px(c, cx + 1, baseY - vh - 34, 7, 5, '#2f4d9c');
    px(c, cx + 8, baseY - vh - 34, 6, 5, '#f4efe0');
    px(c, cx + 14, baseY - vh - 34, 6, 5, '#b8232f');
  }

  /* SACRÉ-CŒUR. Three white domes at the top of a lot of steps. */
  function basilica(c, cx, baseY) {
    const st = '#f4f0e4', lit = '#ffffff', dk = '#cfc8b6', sh = '#ada695';
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
    const glass = 'rgba(150,200,235,.42)', frame = '#8c96a2', warm = '#ffe7a8';
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
    const iron = L.iron, lit = L.ironLit, amber = '#e0a63c';
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
    px(c, x - 24, y - 38, 49, 10, L.ironDk);
    const t = PIXFONT.render('METRO', { scale: 1, color: amber, shadow: null });
    c.drawImage(t, x - Math.round(t.width / 2), y - 36);
    /* the balustrade and the steps going down into the dark */
    px(c, x - 30, y - 12, 61, 3, iron);
    for (let k = -28; k < 30; k += 5) px(c, x + k, y - 10, 2, 10, iron);
    px(c, x - 22, y - 8, 45, 8, '#2b2620');
  }

  /* ============================================================
     1. LA TOUR — the Champ de Mars, under the whole thing
     ============================================================ */
  function tower() {
    const W = 780, FY = 116, seed = seedFor('tower');
    const BAND = 26;

    const paint = (c) => {
      const p = P();
      /* THE SKY IS NOT PAINTED HERE. Everything above the horizon is left
         transparent and `skyTo` tells the scene how far down to hand the
         frame to DAY, which paints the hour into it live — so this park
         is blue at eleven and gold at six without the room being rebuilt.
         What IS painted here is the haze that sits on a horizon: warm,
         pale, and thicker the closer to the ground it gets. */
      for (let i = 0; i < 30; i++) {
        px(c, 0, FY - BAND - 30 + i, W, 1,
          'rgba(238,230,208,' + (0.02 + i * 0.011).toFixed(3) + ')');
      }
      /* THE FAR BANK. There is vertical room in the frame now — the old
         twenty-six-row blocks were a garden wall along the bottom of a
         mostly-blue picture. These are buildings. */
      for (let i = 0; i < 22; i++) {
        const bx = (i * 41 + seed % 23) % (W - 40);
        const bh = 52 + (i % 4) * 11;
        haussmann(c, bx, FY - BAND - 4 - bh, 38, bh, seed + i);
      }
      /* THE TOWER, over everything, cut off by the top of the frame */
      eiffel(c, 372, FY - BAND + 4, -58);

      /* THE GRAVEL of the Champ de Mars, run up into the depth. Dry buff
         sand in the sun, with the darker damp of the morning still under
         the trees, and a lawn either side of the walk. */
      px(c, 0, FY - BAND, W, BAND + 20, '#c2b28c');
      for (let ry = 0; ry < BAND + 18; ry += 3) {
        const t = 1 - ry / (BAND + 18);
        px(c, 0, FY - BAND + ry, W, 3, ry % 6 ? '#c8b892' : '#bcac86');
        px(c, 0, FY - BAND + ry, W, 1, 'rgba(255,250,225,' + (0.10 * t + 0.05).toFixed(3) + ')');
      }
      ART.grain(c, 0, FY - BAND, W, BAND + 20, '#b6a680', '#d2c49c', seed % 31);
      /* the lawns, kept the way this city keeps a lawn */
      px(c, 0, FY - BAND, W, 7, '#6f9450');
      px(c, 0, FY - BAND, W, 2, '#87ab5e');
      px(c, 0, FY - BAND + 6, W, 1, '#4d6c38');
      for (let k = 0; k < W; k += 5) px(c, k, FY - BAND + 1, 2, 4, '#7ea256');
      /* the path edging, and the last of last night's puddles */
      px(c, 0, FY - BAND + 7, W, 1, '#8d7e5e');
      [[300, 34], [700, 30]].forEach(([wx, ww], i) => {
        ART.dither(c, wx, FY - 6, ww, 7, 'rgba(150,200,220,.22)', 0.35, 11 + i * 5);
      });

      /* the trees down both sides of it */
      [40, 128, 640, 730].forEach((tx, i) => planeTree(c, tx, FY - BAND + 6, 40, seed + i));
      /* the lamps along the path */
      [70, 200, 330, 470, 600, 720].forEach(lx => lamp(c, lx, FY - BAND + 8, 34, false));
      /* the benches, the fountain, the kiosk */
      bench(c, 168, FY - 2, 46);
      bench(c, 556, FY - 2, 46);
      wallace(c, 268, FY - 1);
      morris(c, 470, FY - 2, 54);
      /* the chestnut cart, under a striped parasol, doing no trade at all
         because it is twenty degrees out */
      foot(c, 620, FY, 30, 4);
      ART.box(c, 620, FY - 22, 30, 22, { fill: '#8a5a3a', top: '#a87a52', bot: '#4e3220', ink: p.K });
      px(c, 624, FY - 26, 22, 5, '#6b4630');
      px(c, 628, FY - 30, 14, 5, '#c96a1e');
      px(c, 631, FY - 33, 8, 4, '#ff9d3c');
      PIX.disc(c, 635, FY - 30, 14, 'rgba(255,157,60,.08)');
      px(c, 634, FY - 52, 2, 22, L.woodDk);
      for (let k = 0; k < 34; k += 6) {
        px(c, 618 + k, FY - 56, 3, 5, '#b8384a');
        px(c, 621 + k, FY - 56, 3, 5, L.cream);
      }
      px(c, 616, FY - 51, 38, 2, L.cream);
      /* the souvenir stand: forty little towers on a trestle */
      foot(c, 92, FY, 54, 4);
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
        tag: 'A GENDARME ON POINT', tagCol: PIX.PAL.L, witness: true, mood: 'bored' },
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
      skyTo: FY - BAND,
      depthBand: BAND, crowd: { n: 18, z0: 0.45, z1: 1 },
      pets: [{ kind: 'dog', x: 400, name: "A TOURIST'S DOG", fouls: true },
             { kind: 'cat', x: 700, name: 'A PARK CAT' }],
      enterX: 30, enterFace: 1,
      lights: [{ x: 372, y: 30, r: 90, a: 0.130 }, { x: 635, y: FY - 30, r: 30, a: 0.234 }],
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
      /* the sky is DAY's; what is painted here is the haze on the horizon */
      for (let i = 0; i < 34; i++) {
        px(c, 0, FY - BAND - 34 + i, W, 1,
          'rgba(240,232,212,' + (0.02 + i * 0.010).toFixed(3) + ')');
      }
      /* the twelve avenues: blocks of Haussmann running away in both
         directions, with the gaps between them going black */
      for (let i = 0; i < 9; i++) {
        const bx = i * 84 + (seed % 17);
        if (i === 4) continue;                       // the arch stands in this gap
        const bh = 66 + (i % 3) * 9;
        haussmann(c, bx, FY - BAND - bh, 74, bh, seed + i * 3);
      }
      /* THE ARCH, dead centre, too big for the frame */
      arc(c, 360, FY - BAND + 2, 88);

      /* the roundabout: setts, and the white lines nobody obeys */
      cobbles(c, 0, FY - BAND, W, BAND + 20, seed);
      for (let k = 0; k < W; k += 26) {
        px(c, k, FY - BAND + 6, 14, 2, 'rgba(255,252,244,.45)');
      }
      /* the kerb ring round the monument */
      px(c, 240, FY - BAND + 1, 240, 2, '#b8b0a0');
      px(c, 240, FY - BAND + 3, 240, 1, 'rgba(70,62,50,.40)');

      /* the lamps and the trees round the circle */
      [60, 180, 540, 660].forEach(lx => lamp(c, lx, FY - BAND + 6, 32, false));
      [26, 694].forEach((tx, i) => planeTree(c, tx, FY - BAND + 8, 36, seed + i * 5));
      /* the taxi rank */
      /* a 1930s cab: a long bonnet, a tall cabin behind it, mudguards over
         the wheels and a light on the roof that says it is for hire */
      const cab = (x, y) => {
        const body = '#2a2f3a', bodyLit = '#4d5563', dark = '#171a20';
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
        tag: 'A CABBIE ON THE RANK', tagCol: PIX.PAL.G, witness: true, mood: 'happy' },
    ];

    return {
      id: 'arch', w: W, floorY: FY, paint, spots, actors, outdoor: true,
      skyTo: FY - BAND,
      depthBand: BAND, crowd: { n: 14, z0: 0.5, z1: 1 },
      traffic: { n: 5, z0: 0.62, z1: 0.95 },
      pets: [{ kind: 'dog', x: 260, name: 'A DOG OFF ITS LEAD', fouls: true }],
      enterX: 30, enterFace: 1,
      stairs: { to: 'metro', x: 470, label: 'DOWN INTO THE METRO', hint: 'THE LAST TRAIN WENT' },
      lights: [{ x: 360, y: FY - 20, r: 40, a: 0.208 },
               { x: 470, y: FY - 46, r: 26, a: 0.182 }],
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
      /* ============================================================
         THE CITY, A LONG WAY BELOW AND BEHIND.

         Thirty flat slabs with one white dot on each read as a row of
         tombstones, and they were painted in fixed cold greys, so at
         six in the evening the ground went gold and the whole of
         Paris stayed the colour of a filing cabinet. Every block now
         gets a mansard cap, a grid of windows and a chimney, and its
         stone comes from the hour like everything else does.
         ============================================================ */
      const st = (typeof DAY !== 'undefined' && DAY.stone) ? DAY.stone() : null;
      /* DISTANCE FADES INTO THE SKY IT IS STANDING IN, not into a fixed
         cold grey — mixing everything 80% toward slate is how the whole
         of Paris came out the colour of a filing cabinet at sunset. */
      const hazeTo = (typeof DAY !== 'undefined' && DAY.band)
        ? (DAY.band().lo || DAY.band().mid || '#c8d2da') : '#c8d2da';
      const far4 = (n, base) => {
        const t = 0.10 + n * 0.13;
        return (typeof DAY !== 'undefined' && DAY.rgb)
          ? DAY.rgb(DAY.mix(base, hazeTo, t)) : base;
      };
      for (let i = 0; i < 34; i++) {
        const bx = (i * 24 + seed % 23) % (W - 26);
        const far = (i % 4);
        const bw2 = 16 + (i % 4) * 7;
        const top = FY - BAND - 42 - far * 5 - (i % 7) * 3;
        const bot = FY - BAND - 26 + far * 3;
        const face = far4(far, st ? st.mid : '#93a5b4');
        const lit = far4(far, st ? st.lit : '#c2ced6');
        const dark = far4(far, st ? st.shade : '#6f7f8d');
        px(c, bx, top, bw2, bot - top, face);
        px(c, bx, top, 2, bot - top, lit);
        px(c, bx + bw2 - 3, top, 3, bot - top, dark);
        /* THE MANSARD, which is the whole silhouette of this city, and it
           is NARROW AT THE RIDGE. Drawn widest at the top it is a hat on
           a post, and thirty of them are a row of mushrooms. */
        for (let k = 0; k < 6; k++) {
          px(c, bx + k, top - k, bw2 - k * 2, 1,
            k < 2 ? far4(far, '#8f9aa6') : far4(far, '#6f7b86'));
        }
        px(c, bx + 2, top - 6, bw2 - 4, 1, far4(far, '#a8b2bc'));
        /* the windows, in rows, dimmer the further off they are */
        for (let wy = top + 4; wy < bot - 4; wy += 6) {
          for (let wx = bx + 4; wx < bx + bw2 - 5; wx += 6) {
            px(c, wx, wy, 3, 4, far4(far, '#5f6d7a'));
            px(c, wx, wy, 3, 1, far4(far, '#8f9aa6'));
          }
        }
        /* and a chimney or two on the ridge */
        if (i % 2) {
          px(c, bx + 4, top - 11, 3, 6, dark);
          px(c, bx + bw2 - 8, top - 10, 3, 5, dark);
        }
      }
      /* and the haze the distance sits in */
      for (let i = 0; i < 30; i++) {
        px(c, 0, FY - BAND - 30 + i, W, 1,
          'rgba(226,232,238,' + (0.03 + i * 0.012).toFixed(3) + ')');
      }
      /* THE BASILICA, up the hill, floodlit and unbothered */
      basilica(c, 402, FY - BAND - 22);
      /* the great flight of steps up to it */
      for (let i = 0; i < 14; i++) {
        const sw = 224 - i * 8;
        const sy = FY - BAND - 22 + i * 1.7;
        px(c, 402 - sw / 2, sy, sw, 2, L.stoneMid);
        px(c, 402 - sw / 2, sy, sw, 1, L.stoneLit);
        px(c, 402 - sw / 2, sy + 2, sw, 1, 'rgba(88,78,62,.40)');
      }
      /* the iron handrails up the middle of them */
      [-40, 40].forEach(d => {
        for (let i = 0; i < 12; i += 3) {
          px(c, 402 + d, FY - BAND - 22 + i * 1.7, 2, 8, L.iron);
        }
        px(c, 402 + d - 1, FY - BAND - 26, 4, 22, L.iron);
      });
      /* the funicular, off to the side, stopped for the night */
      px(c, 596, FY - BAND - 22, 26, 24, '#8a4a3a');
      px(c, 596, FY - BAND - 22, 26, 2, '#b06a52');
      px(c, 598, FY - BAND - 20, 22, 12, 'rgba(170,210,235,.55)');
      px(c, 598, FY - BAND - 20, 22, 2, 'rgba(240,250,255,.70)');
      px(c, 594, FY - BAND + 2, 30, 3, '#4a4238');
      for (let i = 0; i < 8; i++) px(c, 600 + (i % 2) * 12, FY - BAND - 40 + i * 3, 8, 2, L.zincDk);

      /* PLACE DU TERTRE: cobbles, easels, tables, and a lot of paint */
      cobbles(c, 0, FY - BAND, W, BAND + 20, seed);
      [90, 250, 500, 690].forEach(lx => lamp(c, lx, FY - BAND + 8, 30, false));
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
        foot(c, x - 11, y, 23, 4);
      };
      easel(180, FY - 1, '#3f6a4a');
      easel(228, FY - 1, '#6a4a3f');
      easel(560, FY - 1, '#4a3f6a');
      /* THE FRONT ROW IS NOT PAINTED HERE.

         Everything standing at the near kerb used to go into the backdrop,
         which put it BEHIND a crowd walking about forty feet further away:
         a frog at the back of the square appeared to be standing on the
         near table. Front-row furniture is drawn per frame, after the
         cast, by `front` below. */
      /* the artist's crate of tubes, and his loaf — also front row */
      const _crateSkip = 1;
      if (!_crateSkip) ART.box(c, 120, FY - 14, 26, 14,
        { fill: '#5e5038', top: '#7a6a4a', bot: '#2a231a', ink: p.K });
      for (let i = 0; i < 5; i++) px(c, 123 + i * 5, FY - 18, 3, 5, ['#b8232f', '#e0a63c', '#3a5f9c', '#4fae6d', '#f4efe0'][i]);
      px(c, 148, FY - 8, 22, 5, '#c98a4a');
      px(c, 148, FY - 8, 22, 2, '#e0a86a');
    };

    /* ============================================================
       THE NEAR KERB.

       Drawn every frame, after everybody, so a table three feet from
       the camera is in front of a frog forty feet away instead of
       behind him. Everything in here stands at z 0.
       ============================================================ */
    const front = (c) => {
      /* the scammers' folding table, three cups on it */
      foot(c, 300, FY, 62, 4);
      ART.box(c, 300, FY - 18, 62, 18, { fill: '#4a3f2e', top: '#5e5038', bot: '#241d14', ink: P().K });
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
      foot(c, 120, FY, 26, 3);
      ART.box(c, 120, FY - 14, 26, 14, { fill: '#5e5038', top: '#7a6a4a', bot: '#2a231a', ink: P().K });
      px(c, 124, FY - 18, 6, 5, '#c96a1e');
      px(c, 132, FY - 18, 5, 5, '#3f6a4a');
      px(c, 139, FY - 17, 5, 4, '#2f4a70');
      px(c, 150, FY - 8, 16, 6, '#d9a45c');
      px(c, 150, FY - 8, 16, 2, '#f0c98a');
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
        tag: 'THE CAFE WAITER', tagCol: PIX.PAL.G, witness: true, mood: 'pleased', job: 'wipe' },
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
      id: 'butte', w: W, floorY: FY, paint, onPaintFront: front,
      spots, actors, eggs, outdoor: true,
      skyTo: FY - BAND,
      depthBand: BAND, crowd: { n: 20, z0: 0.4, z1: 1 },
      pets: [{ kind: 'dog', x: 480, name: "A PAINTER'S DOG", fouls: true },
             { kind: 'cat', x: 620, name: 'A ROOF CAT' }],
      enterX: 30, enterFace: 1,
      lights: [{ x: 402, y: FY - BAND - 40, r: 80, a: 0.130 },
               { x: 250, y: FY - 40, r: 34, a: 0.182 },
               { x: 680, y: FY - 40, r: 30, a: 0.182 }],
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
      /* the sky is DAY's; the haze on the far side of the courtyard is not */
      for (let i = 0; i < 24; i++) {
        px(c, 0, FY - BAND - 24 + i, W, 1,
          'rgba(240,234,216,' + (0.02 + i * 0.010).toFixed(3) + ')');
      }
      /* the three wings of the palace, stone and window and stone */
      const wing = (x, w2, h2) => {
        px(c, x, FY - BAND - h2, w2, h2, L.stone);
        px(c, x, FY - BAND - h2, w2, 3, L.stoneLit);
        px(c, x, FY - BAND - h2, 2, h2, L.stoneLit);
        px(c, x + w2 - 4, FY - BAND - h2, 4, h2, L.stoneDk);
        /* the mansard and its dormers */
        for (let i = 0; i < 9; i++) {
          px(c, x + Math.round(i * 0.5), FY - BAND - h2 - 9 + i, w2 - i, 1,
            i < 2 ? L.zincLit : L.zinc);
        }
        for (let dx = x + 8; dx < x + w2 - 12; dx += 22) {
          px(c, dx, FY - BAND - h2 - 8, 12, 8, L.zinc);
          px(c, dx, FY - BAND - h2 - 8, 12, 1, L.zincLit);
          px(c, dx + 2, FY - BAND - h2 - 6, 8, 6, L.glass);
          px(c, dx + 2, FY - BAND - h2 - 6, 8, 2, L.glassLit);
        }
        /* THE ARCADE: tall arched windows. Shut, because the place shut at
           six — so what is in them is the courtyard reflected back at you,
           not a light somebody left on. */
        for (let i = 0; i * 26 < w2 - 20; i++) {
          const wx = x + 10 + i * 26;
          px(c, wx, FY - BAND - h2 + 16, 16, h2 - 26, L.glassDk);
          px(c, wx + 1, FY - BAND - h2 + 17, 14, h2 - 28, L.glass);
          px(c, wx + 1, FY - BAND - h2 + 17, 14, 5, L.glassLit);
          px(c, wx + 8, FY - BAND - h2 + 17, 1, h2 - 28, L.glassDk);
          for (let k = 0; k < 16; k++) {
            const yy = FY - BAND - h2 + 16 - Math.round(Math.sqrt(Math.max(0, 64 - (k - 8) * (k - 8))));
            px(c, wx + k, yy, 1, FY - BAND - h2 + 16 - yy, L.glassDk);
            px(c, wx + k, yy, 1, 2, L.stoneDk);
          }
          /* the caryatid pilasters between them */
          px(c, wx - 5, FY - BAND - h2 + 14, 4, h2 - 24, L.stoneMid);
          px(c, wx - 5, FY - BAND - h2 + 14, 1, h2 - 24, L.stoneLit);
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

      /* the courtyard: pale stone flags, and the fountains in it */
      px(c, 0, FY - BAND, W, BAND + 20, '#cbc2ac');
      for (let ry = 0; ry < BAND + 18; ry += 6) {
        px(c, 0, FY - BAND + ry, W, 1, 'rgba(255,252,240,.30)');
        px(c, 0, FY - BAND + ry + 5, W, 1, 'rgba(90,82,66,.16)');
      }
      for (let rx = 0; rx < W; rx += 30) px(c, rx, FY - BAND, 1, BAND + 18, 'rgba(90,82,66,.18)');
      ART.grain(c, 0, FY - BAND, W, BAND + 20, '#c2b9a3', '#d8cfb8', seed % 37);
      /* the reflecting pools, with the sky in them */
      [[120, 90], [520, 90]].forEach(([wx, ww]) => {
        px(c, wx, FY - 16, ww, 15, '#5f93a8');
        px(c, wx, FY - 16, ww, 2, '#8fc0d0');
        px(c, wx + 2, FY - 14, ww - 4, 11, 'rgba(190,230,245,.35)');
        for (let k = 0; k < ww; k += 9) px(c, wx + k, FY - 10 + ((k + seed) % 3), 5, 1, 'rgba(255,255,255,.45)');
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
        job: 'pace', tag: 'THE GALLERY GUARD', tagCol: PIX.PAL.L, witness: true, mood: 'watch' },
    ];

    return {
      id: 'museum', w: W, floorY: FY, paint, spots, actors, outdoor: true,
      skyTo: FY - BAND,
      depthBand: BAND, crowd: { n: 8, z0: 0.55, z1: 0.95 },
      pets: [{ kind: 'cat', x: 300, name: 'THE COURTYARD CAT' }],
      enterX: 30, enterFace: 1,
      lights: [{ x: 350, y: FY - 30, r: 60, a: 0.182 }],
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
      foot(c, 236, FY, 70, 4);
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
        tag: 'THE KEEPER', tagCol: PIX.PAL.q, witness: true, mood: 'sad' },
    ];

    return {
      id: 'catacombs', w: W, floorY: FY, paint, spots, actors,
      depthBand: BAND,
      pets: [{ kind: 'cat', x: 120, name: 'SOMETHING WHITE' }],
      enterX: 26, enterFace: 1,
      lights: [{ x: 271, y: 24, r: 40, a: 0.208, flicker: true },
               { x: 478, y: FY - 30, r: 22, a: 0.182 }],
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
      lights: [{ x: 120, y: 14, r: 40, a: 0.182 }, { x: 320, y: 14, r: 40, a: 0.182, flicker: true }],
    };
  }

  /* pulled in from places.js so the eggs work the same way out here */
  function egg(o) {
    const key = 'egg:' + o.id;
    const sp = {
      id: key, x: o.x, y: o.y, w: 18,
      top: o.y - 11, bot: o.y + 11,
      egg: true, art: o.art,
      /* nameless until the glass has been on it */
      label: () => ((G.eggs && G.eggs[key]) ? o.label : 'SOMETHING SMALL'),
      hint: () => ((G.eggs && G.eggs[key]) ? o.label : 'THE GLASS MIGHT TELL YOU'),
      look: o.look,
    };
    sp.onUse = () => { (G.eggs = G.eggs || {})[key] = 1; return STORY.lookClose(sp, sp.x, o.y); };
    return sp;
  }

  /* ============================================================
     6. L'OPERA — the grandest staircase in Europe, and the men
        who do business at the bottom of it

     Locked until the board has one piece on it. Nobody takes a
     foreign policeman to the Opera on his first afternoon.
     ============================================================ */
  function opera() {
    const W = 720, FY = 112, seed = seedFor('opera');
    const BAND = 18;

    const paint = (c) => {
      const p = P();
      /* the square, and the buildings closing it in on both sides */
      haussmann(c, -30, FY - BAND - 74, 150, 74, seed + 3);
      haussmann(c, 600, FY - BAND - 70, 160, 70, seed + 8);
      /* haze across the far side */
      for (let i = 0; i < 22; i++) {
        px(c, 0, FY - BAND - 22 + i, W, 1,
          'rgba(240,234,216,' + (0.02 + i * 0.010).toFixed(3) + ')');
      }
      /* ---------- THE PALAIS ----------
         Three storeys of it: an arcade at the bottom, the loggia with
         its columns above that, the attic and the dome over all of it. */
      const bx = 130, bw = 460, base = FY - BAND;
      /* THE HEIGHT BUDGET. A room has sixty-two rows of headroom above
         the floor line and the first pass built a hundred and ninety-four
         rows of opera house into it, so the dome, the attic and both
         gilded groups were painted somewhere off the top of the world.
         Everything below is the same building at two thirds the height. */
      for (let i = 0; i < 7; i++) {
        px(c, bx - 12 + i * 2, base - i * 2, bw + 24 - i * 4, 2,
          i % 2 ? L.stoneMid : L.stone);
        px(c, bx - 12 + i * 2, base - i * 2, bw + 24 - i * 4, 1, L.stoneLit);
      }
      const py = base - 14;
      /* THE ARCADE: seven arches, deep and dark */
      px(c, bx, py - 38, bw, 38, L.stone);
      px(c, bx, py - 38, bw, 3, L.stoneLit);
      for (let i = 0; i < 7; i++) {
        const ax = bx + 14 + i * 63;
        px(c, ax, py - 28, 44, 28, L.stoneDeep);
        for (let k = 0; k < 44; k++) {
          const yy = py - 28 - Math.round(Math.sqrt(Math.max(0, 484 - (k - 22) * (k - 22))) * 0.7);
          px(c, ax + k, yy, 1, py - 28 - yy, L.stoneDeep);
          px(c, ax + k, yy, 1, 2, L.stoneMid);
        }
        px(c, ax + 6, py - 20, 32, 20, '#2a2620');
        px(c, ax - 5, py - 34, 4, 34, L.stoneMid);
        px(c, ax - 5, py - 34, 1, 34, L.stoneLit);
        /* the medallion over each arch */
        PIX.disc(c, ax + 22, py - 35, 4, L.brass);
        PIX.disc(c, ax + 22, py - 35, 2, '#8a5a1a');
      }
      /* THE LOGGIA: paired columns, and a gilded group on the parapet */
      const ly = py - 38;
      /* THE PORTICO IS RECESSED. Pale columns on a pale wall read as slits;
         the wall behind them has to go into shadow before they read as
         columns standing in front of anything. */
      px(c, bx, ly - 40, bw, 40, '#4a4336');
      px(c, bx, ly - 40, bw, 3, L.stoneLit);
      px(c, bx, ly - 37, bw, 2, '#332e25');
      px(c, bx, ly - 5, bw, 5, L.stoneMid);
      px(c, bx, ly - 5, bw, 1, L.stoneLit);
      for (let i = 0; i < 8; i++) {
        const cx0 = bx + 20 + i * 60;
        [0, 20].forEach(d => {
          px(c, cx0 + d, ly - 34, 11, 29, L.stone);
          px(c, cx0 + d, ly - 34, 3, 29, L.stoneLit);
          px(c, cx0 + d + 8, ly - 34, 3, 29, L.stoneDk);
          px(c, cx0 + d - 2, ly - 37, 15, 3, L.stoneLit);   /* the capital */
          px(c, cx0 + d - 2, ly - 8, 15, 3, L.stoneMid);    /* and the base */
        });
        /* and the arch over the dark bay between each pair */
        for (let k = 0; k < 12; k++) {
          const yy = ly - 34 - Math.round(Math.sqrt(Math.max(0, 36 - (k - 6) * (k - 6))));
          px(c, cx0 + 11 + k, yy, 1, 3, L.stoneMid);
        }
      }
      /* the frieze of names nobody reads */
      px(c, bx + 4, ly - 46, bw - 8, 7, L.stoneMid);
      for (let i = 0; i < bw - 20; i += 13) px(c, bx + 12 + i, ly - 44, 7, 3, L.stoneDeep);
      /* THE ATTIC, and the dome */
      const ay = ly - 46;
      px(c, bx + 60, ay - 16, bw - 120, 16, L.stoneMid);
      px(c, bx + 60, ay - 16, bw - 120, 2, L.stoneLit);
      px(c, bx + 60, ay - 16, 3, 16, L.stoneLit);
      /* the drum, and then a dome with some height in it. Eighty-four
         pixels wide and eighteen tall was a hill, not a dome. */
      const dcx = bx + Math.round(bw / 2);
      px(c, dcx - 46, ay - 24, 92, 8, L.stone);
      px(c, dcx - 46, ay - 24, 92, 2, L.stoneLit);
      for (let i = 0; i < 8; i += 3) px(c, dcx - 44 + i * 12, ay - 22, 3, 6, L.stoneDk);
      for (let i = 0; i < 26; i++) {
        const t = i / 26;
        const hw = Math.round(42 * Math.sqrt(Math.max(0, 1 - t * t)));
        px(c, dcx - hw, ay - 24 - i, hw * 2, 1,
          i < 3 ? '#7fa07a' : (i % 6 < 3 ? '#5f8f66' : '#4e7a56'));
        px(c, dcx - hw, ay - 24 - i, 2, 1, '#8fb08a');
        px(c, dcx + hw - 2, ay - 24 - i, 2, 1, '#3d6446');
      }
      /* the ribs, which is what makes a dome look like a dome */
      [-26, -13, 0, 13, 26].forEach(d => {
        for (let i = 0; i < 26; i++) {
          const t = i / 26, hw = 42 * Math.sqrt(Math.max(0, 1 - t * t));
          if (Math.abs(d) > hw - 2) continue;
          px(c, dcx + Math.round(d * (hw / 42)), ay - 24 - i, 1, 1, '#4e7a56');
        }
      });
      px(c, dcx - 6, ay - 54, 12, 6, '#4e7a56');
      px(c, dcx - 6, ay - 54, 12, 1, '#7fa07a');
      px(c, dcx - 2, ay - 60, 4, 7, L.brass);
      PIX.disc(c, dcx, ay - 61, 3, L.brass);
      /* THE GILDED GROUPS on the corners of the attic: a pair of figures
         with an arm up, not a gold bollard. */
      [bx + 74, bx + bw - 86].forEach(gx => {
        px(c, gx - 6, ay - 4, 24, 4, '#8a5a1a');          /* the plinth */
        px(c, gx - 6, ay - 4, 24, 1, L.brass);
        [0, 8].forEach((d, n) => {
          px(c, gx + d, ay - 14, 5, 10, L.brass);          /* a body */
          px(c, gx + d, ay - 14, 2, 10, '#f4d98a');
          px(c, gx + d, ay - 19, 5, 5, L.brass);           /* a head */
          px(c, gx + d + (n ? 5 : -2), ay - 22, 2, 8, L.brass);   /* an arm up */
        });
        px(c, gx + 1, ay - 24, 11, 2, L.brass);            /* and a lyre between */
      });

      /* ---------- THE SQUARE ---------- */
      cobbles(c, 0, FY - BAND, W, BAND + 22, seed);
      px(c, 0, FY - 4, W, 4, L.settDk);
      /* the kerb, and the metro mouth at the corner */
      px(c, 0, FY - BAND, W, 2, L.settLit);
      metroSign(c, 66, FY - 1);
      /* two cabs waiting at the rank, and the rank sign */
      [[500, 0], [592, 1]].forEach(([cx0, k]) => {
        px(c, cx0, FY - 26, 74, 16, k ? '#2f3a52' : '#3a2f2f');
        px(c, cx0, FY - 26, 74, 2, k ? '#4a5570' : '#544040');
        px(c, cx0 + 14, FY - 36, 44, 11, k ? '#2f3a52' : '#3a2f2f');
        px(c, cx0 + 17, FY - 34, 17, 7, 'rgba(160,205,230,.45)');
        px(c, cx0 + 37, FY - 34, 17, 7, 'rgba(160,205,230,.45)');
        px(c, cx0 + 30, FY - 40, 14, 5, k ? '#e0a63c' : '#c9c0a8');
        PIX.disc(c, cx0 + 14, FY - 9, 7, '#1a1720'); PIX.disc(c, cx0 + 60, FY - 9, 7, '#1a1720');
        PIX.disc(c, cx0 + 14, FY - 9, 3, '#4a4d58'); PIX.disc(c, cx0 + 60, FY - 9, 3, '#4a4d58');
        foot(c, cx0 + 4, FY - 2, 68, 3);
      });
      px(c, 470, FY - 48, 3, 48, L.iron);
      px(c, 458, FY - 56, 28, 10, '#e8dfc6');
      px(c, 460, FY - 54, 24, 6, '#3f6ba8');
      /* the morris column and a bench, because this is still a street */
      morris(c, 106, FY - 2, 54);
      bench(c, 30, FY - 2, 46);
      [22, 700].forEach(lx => lamp(c, lx, FY - BAND + 4, 30, true));
      planeTree(c, 660, FY - 2, 58, seed + 5);
      /* the poster case with tonight's bill in it */
      px(c, 150, FY - 46, 34, 44, L.iron);
      px(c, 153, FY - 43, 28, 38, '#e8dfc6');
      px(c, 155, FY - 41, 24, 10, '#b8384a');
      for (let i = 0; i < 5; i++) px(c, 156, FY - 28 + i * 4, 22 - (i % 2) * 6, 2, '#8a7754');
    };

    const spots = [
      { id: 'steps2', x: 300, z: 0.12, w: 90, top: FY - 30, label: 'THE STEPS',
        hint: 'SOMEBODY SAT HERE LONG ENOUGH TO LEAVE SOMETHING' },
      { id: 'bill', x: 167, z: 0.16, w: 34, top: FY - 48, label: 'THE POSTER CASE',
        hint: 'THE GLASS HAS BEEN FORCED AND PUT BACK' },
      { id: 'cab2', x: 537, z: 0.08, w: 74, top: FY - 40, label: 'THE FIRST CAB',
        hint: 'THE MAN IS ASLEEP AND THE METER IS RUNNING' },
      { id: 'grate', x: 66, z: 0.1, w: 30, top: FY - 22, label: 'THE METRO MOUTH',
        hint: 'THE DRAUGHT COMES UP WITH SOMETHING IN IT' },
    ];

    const actors = [
      { id: 'wit', x: 400, z: 0.14, key: 'usher',
        def: typeof NURSE_DEF !== 'undefined' ? NURSE_DEF : null, face: -1,
        job: 'read', tag: 'THE HOUSE MANAGER', tagCol: PIX.PAL.g, witness: true, mood: 'watch' },
    ];

    return {
      id: 'opera', w: W, floorY: FY, paint, spots, actors, outdoor: true,
      /* the sky is painted from the top of the frame DOWN TO here, and the
         room is painted over it — so this is the ground line, not the roof */
      skyTo: FY - BAND,
      depthBand: BAND, crowd: { n: 16, z0: 0.5, z1: 0.96 },
      pets: [{ kind: 'dog', x: 240, name: 'A DOG ON A LONG LEAD' }],
      enterX: 24, enterFace: 1,
      eggs: [egg({ id: 'ticket', x: 330, y: FY - 26, art: 'card4',
        label: 'A TORN TICKET', look: 'ROW C, SEAT 14. THE DATE IS THE NIGHT HE DIED.' })],
      lights: [{ x: 66, y: FY - 14, r: 30, a: 0.130 }],
    };
  }

  /* ============================================================
     7. PERE-LACHAISE — a hill of dead Parisians, and the only
        place in the city where nobody minds you standing still
     ============================================================ */
  function pere() {
    const W = 680, FY = 116, seed = seedFor('pere');
    const BAND = 24;

    const paint = (c) => {
      const p = P();
      /* THE WALL along the top, in shade, with the city over it.

         VALUE, NOT HUE, is what makes a cemetery read: pale tombs
         need something darker than themselves to stand against, and
         the first pass put stone-coloured tombs on a stone-coloured
         wall and got one cream smear across the middle of the frame. */
      px(c, 0, FY - BAND - 54, W, 54, '#a89d84');
      px(c, 0, FY - BAND - 54, W, 3, '#c2b79c');
      for (let rx = 0; rx < W; rx += 22) {
        px(c, rx, FY - BAND - 54, 1, 54, 'rgba(70,62,48,.38)');
      }
      for (let ry = 0; ry < 54; ry += 9) px(c, 0, FY - BAND - 54 + ry, W, 1, 'rgba(255,250,232,.10)');
      /* moss up the bottom of it, and the roofs behind */
      px(c, 0, FY - BAND - 14, W, 14, 'rgba(64,92,52,.26)');
      px(c, 0, FY - BAND - 2, W, 2, 'rgba(40,36,28,.34)');
      for (let i = -20; i < W; i += 74) {
        haussmann(c, i, FY - BAND - 96, 60, 44, seed + i);
      }
      px(c, 0, FY - BAND - 54, W, 4, L.stoneDk);

      /* ---------- THE TOMBS, in three ranks up the slope ----------
         Near ones tall and sharp, far ones small and hazed, because a
         cemetery on a hill is the one place perspective is the subject. */
      const rank = (y, hgt, step, haze) => {
        for (let x = -10; x < W; x += step) {
          const r = ((x * 7 + y * 3 + seed) % 100) / 100;
          const h2 = Math.round(hgt * (0.7 + r * 0.6));
          const w2 = Math.round(step * (0.45 + r * 0.2));
          const kind = Math.floor(r * 3);
          if (kind === 0) {
            /* a chapel, with a door and a little pitched roof */
            px(c, x, y - h2, w2, h2, L.stone);
            px(c, x, y - h2, w2, 2, L.stoneLit);
            px(c, x + w2 - 3, y - h2, 3, h2, L.stoneDk);
            for (let i = 0; i < 7; i++) {
              px(c, x + i, y - h2 - 7 + i, w2 - i * 2, 1, i < 2 ? L.zincLit : L.zinc);
            }
            px(c, x + Math.round(w2 / 2) - 3, y - Math.round(h2 * 0.62), 7,
              Math.round(h2 * 0.62), '#3f3a30');
            px(c, x + Math.round(w2 / 2) - 3, y - Math.round(h2 * 0.62), 7, 2, '#5f5748');
            px(c, x + Math.round(w2 / 2) - 1, y - h2 - 13, 3, 7, L.stoneMid);
            px(c, x + Math.round(w2 / 2) - 3, y - h2 - 11, 7, 2, L.stoneMid);
          } else if (kind === 1) {
            /* a slab with a cross on it */
            px(c, x, y - Math.round(h2 * 0.4), w2, Math.round(h2 * 0.4), L.stoneMid);
            px(c, x, y - Math.round(h2 * 0.4), w2, 2, L.stoneLit);
            px(c, x + Math.round(w2 / 2) - 2, y - h2, 5, Math.round(h2 * 0.62), L.stone);
            px(c, x + Math.round(w2 / 2) - 6, y - Math.round(h2 * 0.74), 13, 4, L.stone);
            px(c, x + Math.round(w2 / 2) - 6, y - Math.round(h2 * 0.74), 13, 1, L.stoneLit);
          } else {
            /* an obelisk, or a broken column, which is the same shape */
            px(c, x + 2, y - h2, w2 - 4, h2, L.stone);
            px(c, x + 2, y - h2, 2, h2, L.stoneLit);
            px(c, x, y - 4, w2, 4, L.stoneMid);
            px(c, x, y - 4, w2, 1, L.stoneLit);
            if (r > 0.8) px(c, x + 2, y - h2, w2 - 4, 3, L.stoneDeep);
          }
          /* a shadow off the right of it and one on the ground under it,
             which is what separates one pale stone from the next */
          px(c, x + w2, y - Math.round(h2 * 0.8), 3, Math.round(h2 * 0.8),
            'rgba(52,46,34,.30)');
          px(c, x - 2, y, w2 + 6, 2, 'rgba(52,46,34,.26)');
          if (haze) px(c, x - 2, y - h2 - 14, w2 + 8, h2 + 18,
            'rgba(238,232,214,' + haze + ')');
        }
      };
      rank(FY - BAND - 8, 30, 40, 0.20);
      rank(FY - BAND + 4, 40, 54, 0.05);

      /* ---------- AND THE THREE YOU CAN ACTUALLY TOUCH ----------
         A field of generated tombs is a texture. The stops the case
         wants have to be objects: a vault with its door off, an angel
         over a slab, a chapel with a gable. Placed by hand where the
         hot spots are, so a marker points at a thing and not at a wall. */
      /* THE OPEN VAULT, door prised off its hinges and leaning */
      const vx = 318, vb = FY - 16;
      px(c, vx, vb - 52, 46, 52, L.stone);
      px(c, vx, vb - 52, 46, 3, L.stoneLit);
      px(c, vx + 42, vb - 52, 4, 52, L.stoneDk);
      for (let i = 0; i < 9; i++) {
        px(c, vx + i * 2, vb - 52 - 9 + i, 46 - i * 4, 1, i < 2 ? L.zincLit : L.zinc);
      }
      px(c, vx + 21, vb - 66, 4, 9, L.stoneMid);
      px(c, vx + 17, vb - 63, 12, 3, L.stoneMid);
      px(c, vx + 12, vb - 36, 22, 36, '#1d1a16');         /* the way in */
      px(c, vx + 12, vb - 36, 22, 2, '#3a352c');
      px(c, vx + 14, vb - 30, 7, 5, '#2f2a22');
      px(c, vx + 36, vb - 34, 9, 34, '#3f3a30');          /* the door, leaning */
      px(c, vx + 36, vb - 34, 3, 34, '#5f5748');
      px(c, vx + 6, vb - 8, 44, 3, 'rgba(0,0,0,.28)');
      /* THE ANGEL over a slab, wings folded */
      const gx2 = 190, gb = FY - 14;
      px(c, gx2 - 16, gb - 12, 34, 12, L.stoneMid);
      px(c, gx2 - 16, gb - 12, 34, 2, L.stoneLit);
      px(c, gx2 - 8, gb - 20, 18, 8, L.stone);
      px(c, gx2 - 5, gb - 44, 11, 25, L.stone);
      px(c, gx2 - 5, gb - 44, 3, 25, L.stoneLit);
      px(c, gx2 - 3, gb - 52, 7, 9, L.stone);             /* a head, bowed */
      px(c, gx2 - 3, gb - 52, 7, 2, L.stoneLit);
      for (let i = 0; i < 16; i++) {                      /* the wings */
        const w2 = Math.round(7 - i * 0.32);
        px(c, gx2 - 12 - Math.round(i * 0.35), gb - 44 + i, w2, 1, L.stoneMid);
        px(c, gx2 + 6 + Math.round(i * 0.35), gb - 44 + i, w2, 1, L.stoneDk);
      }
      px(c, gx2 - 20, gb - 2, 42, 3, 'rgba(0,0,0,.26)');
      /* THE CHAPEL with the gable, up the path a way */
      const cx2 = 430, cb = FY - 18;
      px(c, cx2, cb - 44, 38, 44, L.stone);
      px(c, cx2, cb - 44, 38, 3, L.stoneLit);
      px(c, cx2 + 34, cb - 44, 4, 44, L.stoneDk);
      for (let i = 0; i < 14; i++) {
        px(c, cx2 + 19 - 19 + i, cb - 44 - i, 38 - i * 2, 1, i < 2 ? L.stoneLit : L.stoneMid);
      }
      px(c, cx2 + 12, cb - 30, 14, 30, '#2a2620');
      px(c, cx2 + 12, cb - 30, 14, 2, L.stoneMid);
      px(c, cx2 + 14, cb - 26, 4, 10, '#4a5f6a');
      px(c, cx2 + 20, cb - 26, 4, 10, '#4a5f6a');
      px(c, cx2 + 4, cb - 10, 30, 3, 'rgba(0,0,0,.26)');

      /* ---------- THE PATH ---------- */
      cobbles(c, 0, FY - 18, W, 22, seed + 4);
      px(c, 0, FY - 20, W, 3, L.settLit);
      px(c, 0, FY - 4, W, 4, L.settDk);
      /* the leaves nobody sweeps in this part */
      const rng = U.mulberry32(seed * 7 + 11);
      for (let i = 0; i < 260; i++) {
        const lx = Math.floor(rng() * W), ly = FY - 18 + Math.floor(rng() * 18);
        px(c, lx, ly, 2, 1, rng() < 0.4 ? '#8a6a2a' : (rng() < 0.5 ? '#7a4a22' : '#a08640'));
      }
      /* chestnuts and cypress, which is what actually grows here */
      [70, 300, 560].forEach((tx, i) => planeTree(c, tx, FY - 6, 66 + i * 6, seed + tx));
      [200, 420, 640].forEach((tx) => {
        for (let i = 0; i < 46; i++) {
          const hw = Math.max(1, Math.round(9 * Math.sin((1 - i / 46) * 2.2)));
          px(c, tx - hw, FY - 8 - i, hw * 2, 1, i % 7 < 4 ? '#31502f' : '#26402a');
        }
        px(c, tx - 2, FY - 12, 5, 11, L.barkDk);
        foot(c, tx - 6, FY - 3, 13, 3);
      });
      /* the water tap and the watering cans, which is a cemetery detail */
      px(c, 496, FY - 26, 4, 24, L.iron);
      px(c, 492, FY - 30, 12, 5, L.iron);
      px(c, 500, FY - 27, 7, 3, L.ironLit);
      px(c, 486, FY - 10, 13, 9, '#4a5a4a');
      px(c, 486, FY - 10, 13, 2, '#5f7a5f');
      px(c, 498, FY - 8, 6, 3, '#4a5a4a');
      foot(c, 484, FY - 2, 22, 3);
      /* a bench where somebody sat for a long time */
      bench(c, 130, FY - 3, 52);
      /* the crows */
      [[250, FY - 88], [268, FY - 82], [604, FY - 96]].forEach(([kx, ky]) => {
        px(c, kx, ky, 5, 3, '#1d1a22');
        px(c, kx + 4, ky - 1, 2, 2, '#1d1a22');
        px(c, kx + 1, ky + 3, 1, 2, '#1d1a22');
      });
    };

    /* the tops are the tops of the things drawn above, so a marker
       points at an object and not at the wall behind it */
    const spots = [
      { id: 'tomb', x: 341, z: 0.10, w: 46, top: FY - 68, label: 'THE OPEN VAULT',
        hint: 'THE DOOR HAS BEEN PRISED AND IT WAS NOT A THIEF' },
      { id: 'urn2', x: 496, z: 0.14, w: 30, top: FY - 32, label: 'THE TAP',
        hint: 'SOMEBODY WASHED SOMETHING HERE THIS MORNING' },
      { id: 'leaves', x: 620, z: 0.06, w: 60, top: FY - 20, label: 'THE LEAF DRIFT',
        hint: 'SOMETHING WENT INTO IT ON PURPOSE' },
      { id: 'bench3', x: 156, z: 0.12, w: 52, top: FY - 22, label: 'THE BENCH',
        hint: 'CIGARETTE ENDS. ALL THE SAME BRAND.' },
    ];

    const actors = [
      { id: 'wit', x: 240, z: 0.13, key: 'keeper2',
        def: typeof KEEPER_DEF !== 'undefined' ? KEEPER_DEF
          : (typeof NURSE_DEF !== 'undefined' ? NURSE_DEF : null), face: 1,
        job: 'sweep', tag: 'THE GARDENER', tagCol: PIX.PAL.F, witness: true, mood: 'weary' },
    ];

    return {
      id: 'pere', w: W, floorY: FY, paint, spots, actors, outdoor: true,
      skyTo: FY - BAND - 54,
      depthBand: BAND, crowd: { n: 5, z0: 0.55, z1: 0.9 },
      pets: [{ kind: 'cat', x: 420, name: 'THE CEMETERY CAT' }],
      enterX: 24, enterFace: 1,
      eggs: [egg({ id: 'flower', x: 366, y: FY - 22, art: 'card1',
        label: 'FRESH FLOWERS', look: 'NO NAME ON THE CARD. THE SHOP IS TWO STREETS FROM THE LAVERIE.' })],
    };
  }

  /* ============================================================
     8. LA ZONE — under the ring road, where the city keeps the
        things it does not want photographed

     The last door to open, and the one the finale walks through.
     ============================================================ */
  function perif() {
    const W = 700, FY = 118, seed = seedFor('perif');
    const BAND = 14;

    const paint = (c) => {
      const p = P();
      /* ---------- THE FLYOVER, right over your head ----------

         THE TOP TEN ROWS OF A ROOM ARE WHAT THE SCENE TILES UPWARD to
         fill the headroom above the frame, so they have to be the
         darkest thing in the picture. The first pass put pale concrete
         in them and got a slab of grey filling half the screen. */
      px(c, 0, 0, W, 12, '#1f1f26');
      px(c, 0, 10, W, 4, '#2a2a32');
      px(c, 0, 14, W, 26, '#6f6f76');
      px(c, 0, 36, W, 6, '#4a4a52');
      px(c, 0, 42, W, 5, '#3a3a42');
      for (let rx = 0; rx < W; rx += 96) {
        px(c, rx, 14, 3, 28, '#5a5a62');
        px(c, rx + 3, 14, 1, 28, 'rgba(255,255,255,.10)');
      }
      /* the expansion joints in the soffit */
      for (let rx = 24; rx < W; rx += 48) px(c, rx, 14, 1, 26, 'rgba(30,30,36,.5)');
      /* the stains where forty years of rain has come off it */
      const rng = U.mulberry32(seed * 3 + 19);
      for (let i = 0; i < 90; i++) {
        const sx = Math.floor(rng() * W);
        px(c, sx, 40, 2 + Math.floor(rng() * 4), 6 + Math.floor(rng() * 22),
          'rgba(40,40,46,' + (0.10 + rng() * 0.16).toFixed(3) + ')');
      }
      /* the piers holding it up */
      [90, 330, 570].forEach(pxx => {
        px(c, pxx, 40, 46, FY - BAND - 40, '#5f5f68');
        px(c, pxx, 40, 6, FY - BAND - 40, '#74747c');
        px(c, pxx + 40, 40, 6, FY - BAND - 40, '#46464e');
        px(c, pxx - 6, FY - BAND - 12, 58, 12, '#4a4a52');
        px(c, pxx - 6, FY - BAND - 12, 58, 2, '#63636c');
        /* AND THE TAG somebody put on every one of them. Four coloured
           bars in a row read as a bar chart; a tag is a fat scrawl with
           an outline round it and a drip off the bottom. */
        const ty0 = FY - BAND - 42, col = ['#b8384a', '#e0a63c', '#3f6ba8'][(pxx / 90) % 3 | 0];
        px(c, pxx + 4, ty0 + 4, 6, 12, '#14141a');
        px(c, pxx + 5, ty0 + 5, 5, 10, col);
        px(c, pxx + 10, ty0, 7, 18, '#14141a');
        px(c, pxx + 11, ty0 + 1, 5, 16, col);
        px(c, pxx + 16, ty0 + 6, 10, 9, '#14141a');
        px(c, pxx + 17, ty0 + 7, 9, 7, col);
        px(c, pxx + 26, ty0 + 2, 6, 15, '#14141a');
        px(c, pxx + 27, ty0 + 3, 5, 13, col);
        px(c, pxx + 32, ty0 + 8, 8, 6, '#14141a');
        px(c, pxx + 33, ty0 + 9, 7, 4, col);
        px(c, pxx + 13, ty0 + 17, 2, 7, col);            /* the drip */
        px(c, pxx + 29, ty0 + 16, 2, 5, col);
      });
      /* the daylight that gets in at the open end, and the wedge it
         throws across the floor: without it the whole frame is one value */
      for (let i = 0; i < 30; i++) {
        px(c, 0, FY - BAND - 30 + i, W, 1,
          'rgba(220,214,196,' + (0.015 + i * 0.006).toFixed(3) + ')');
      }
      for (let i = 0; i < 46; i++) {
        px(c, 0, 46 + i, Math.round(200 - i * 2.6), 1,
          'rgba(240,232,206,' + (0.055 - i * 0.001).toFixed(4) + ')');
      }
      /* ---------- THE LOCK-UPS, in the arch of it ---------- */
      const unit = (x, w2, shut2) => {
        px(c, x, FY - BAND - 52, w2, 52, '#4a463e');
        px(c, x, FY - BAND - 52, w2, 3, '#5f5a4e');
        px(c, x + 4, FY - BAND - 44, w2 - 8, 44, shut2 ? '#7a6a52' : '#241f1a');
        if (shut2) {
          for (let ry = 0; ry < 44; ry += 3) {
            px(c, x + 4, FY - BAND - 44 + ry, w2 - 8, 1, 'rgba(0,0,0,.24)');
            px(c, x + 4, FY - BAND - 44 + ry + 1, w2 - 8, 1, 'rgba(255,240,210,.10)');
          }
          px(c, x + Math.round(w2 / 2) - 5, FY - BAND - 6, 11, 4, '#2a2620');
        } else {
          px(c, x + 8, FY - BAND - 30, 12, 28, '#3a3630');
          px(c, x + 26, FY - BAND - 22, 20, 20, '#4a3a24');
        }
        px(c, x + 6, FY - BAND - 50, 16, 5, '#c9c0a8');
        px(c, x + 8, FY - BAND - 49, 12, 3, '#3a3630');
      };
      unit(150, 120, true);
      unit(400, 130, false);
      /* the chain-link fence across the near right */
      for (let fx = 560; fx < W; fx += 4) {
        px(c, fx, FY - BAND - 44, 1, 44, 'rgba(150,150,160,.5)');
      }
      for (let fy = 0; fy < 44; fy += 4) {
        px(c, 560, FY - BAND - 44 + fy, W - 560, 1, 'rgba(150,150,160,.5)');
      }
      px(c, 560, FY - BAND - 48, W - 560, 4, '#5f5f68');
      px(c, 560, FY - BAND - 48, 4, 48, '#5f5f68');
      /* ---------- THE GROUND ---------- */
      px(c, 0, FY - BAND, W, BAND + 20, '#4a4640');
      ART.grain(c, 0, FY - BAND, W, BAND + 20, '#413d38', '#565046', seed % 29);
      for (let rx = 0; rx < W; rx += 60) px(c, rx, FY - BAND, 2, BAND + 18, 'rgba(30,28,26,.32)');
      /* the puddle that never dries under here */
      px(c, 230, FY - 12, 120, 11, '#3a4650');
      px(c, 234, FY - 11, 112, 3, 'rgba(170,200,215,.30)');
      for (let k = 0; k < 112; k += 11) px(c, 236 + k, FY - 7 + ((k + seed) % 3), 6, 1, 'rgba(220,235,245,.24)');
      /* the brazier, which is the only warm thing in the frame */
      px(c, 90, FY - 26, 30, 24, '#3a2f26');
      px(c, 90, FY - 26, 30, 2, '#5f4a3a');
      for (let i = 0; i < 7; i++) {
        px(c, 96 + (i % 4) * 5, FY - 30 - (i % 3) * 3, 4, 5,
          i % 3 ? '#e0631e' : '#f4b23c');
      }
      px(c, 88, FY - 2, 34, 3, 'rgba(0,0,0,.34)');
      /* the dumped car, on its rims */
      px(c, 600, FY - 30, 96, 20, '#4a3a3a');
      px(c, 600, FY - 30, 96, 2, '#5f4a4a');
      px(c, 618, FY - 42, 58, 13, '#4a3a3a');
      px(c, 622, FY - 40, 22, 9, '#2a2620');
      px(c, 648, FY - 40, 22, 9, '#2a2620');
      px(c, 610, FY - 12, 14, 10, '#2a2620');
      px(c, 668, FY - 12, 14, 10, '#2a2620');
      for (let i = 0; i < 12; i++) {
        px(c, 604 + i * 8, FY - 28 + (i % 3), 4, 3, 'rgba(120,70,40,.5)');
      }
      foot(c, 596, FY - 2, 104, 4);
      /* the oil drums, stacked */
      [[350, 0], [372, 1], [361, 2]].forEach(([dx, k]) => {
        const dy = FY - 2 - k * 17;
        px(c, dx, dy - 17, 20, 17, k === 2 ? '#3f5a6a' : '#5a4a2a');
        px(c, dx, dy - 17, 20, 2, k === 2 ? '#557488' : '#7a6a3a');
        px(c, dx, dy - 11, 20, 2, 'rgba(0,0,0,.26)');
        px(c, dx, dy - 6, 20, 2, 'rgba(0,0,0,.26)');
      });
      foot(c, 346, FY - 2, 50, 3);
      /* one lamp on a bracket, which does not reach the corners */
      px(c, 336, FY - BAND - 40, 3, 26, '#3a3a42');
      px(c, 336, FY - BAND - 40, 16, 3, '#3a3a42');
      px(c, 348, FY - BAND - 38, 10, 5, '#e8dcb8');
    };

    const spots = [
      { id: 'roller', x: 465, z: 0.16, w: 60, top: FY - 60, label: 'THE OPEN LOCK-UP',
        hint: 'SOMETHING WAS DRAGGED OUT OF HERE THIS WEEK' },
      { id: 'drum', x: 361, z: 0.08, w: 40, top: FY - 54, label: 'THE DRUMS',
        hint: 'ONE OF THEM IS LIGHTER THAN THE OTHERS' },
      { id: 'wreck', x: 648, z: 0.06, w: 96, top: FY - 46, label: 'THE WRECK',
        hint: 'THE PLATES ARE OFF AND THE SEATS ARE NOT' },
      { id: 'fence', x: 600, z: 0.3, w: 60, top: FY - BAND - 50, label: 'THE FENCE',
        hint: 'CUT AND BENT BACK, AT THE HEIGHT OF A SHOULDER' },
    ];

    const actors = [
      { id: 'wit', x: 130, z: 0.11, key: 'zone',
        def: typeof KEEPER_DEF !== 'undefined' ? KEEPER_DEF
          : (typeof NURSE_DEF !== 'undefined' ? NURSE_DEF : null), face: 1,
        job: 'smoke', tag: 'THE MAN AT THE FIRE', tagCol: PIX.PAL.r, witness: true, mood: 'watch' },
    ];

    return {
      /* NOT OUTDOOR. There is a concrete deck between this place and the
         sky, so the room is lit like an interior and the headroom above
         the frame is more flyover — a `skyTo` of zero did not suppress
         the sky, it just moved the horizon up into the deck. */
      id: 'perif', w: W, floorY: FY, paint, spots, actors,
      depthBand: BAND, crowd: { n: 4, z0: 0.6, z1: 0.92 },
      pets: [{ kind: 'rat', x: 300, name: 'SOMETHING UNDER THE DRUMS' }],
      enterX: 24, enterFace: 1,
      eggs: [egg({ id: 'plate', x: 690, y: FY - 20, art: 'card2',
        label: 'A NUMBER PLATE', look: 'BENT DOUBLE AND THROWN. THE NUMBER IS STILL READABLE.' })],
      lights: [{ x: 105, y: FY - 30, r: 44, a: 0.10 },
        { x: 352, y: FY - BAND - 34, r: 40, a: 0.182 }],
    };
  }

  return {
    BUILD: { tower, arch, butte, museum, catacombs, metro, opera, pere, perif },
    /* the helpers, so places.js and rooms.js can dress themselves in Paris */
    haussmann, lamp, planeTree, wallace, morris, bench, cobbles, cafeTable,
    eiffel, arc, basilica, pyramid, boneWall, metroSign, egg,
  };
})();
