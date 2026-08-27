/* ============================================================
   THE FIVE PLACES.

   Every one is a side-on room you walk around, painted the same
   way the precinct is: a wall, a floor, furniture the cast stands
   behind, lamps that put light on the boards. What makes them
   different from the station is that everything in them can be
   SEARCHED — and one of them is hiding the thing that crosses a
   face off your list.

   Each place returns the same shape SCENE.open wants:
     { id, w, floorY, paint, onPaintFront, actors, spots, lights }

   Searchable props are spots whose onUse goes through
   STORY.search(placeId, propId), so the clue plumbing lives in
   one place and these files only have to look like somewhere.
   ============================================================ */

const PLACES = (() => {

  const px = (c, x, y, w, h, col) => ART.px(c, x, y, w, h, col);
  const P = () => PIX.PAL;

  /* the seed for a place is stable for the whole case, so the grime
     does not crawl around the walls every time you walk back in */
  function seedFor(id) {
    return U.hashSeed((G.seedStr || 'X') + ':' + (G.chapter || 1) + ':' + id);
  }

  /* ============================================================
     THE THINGS THAT ARE JUST THERE.

     None of this is evidence. A pokeball behind the pawn shop
     glass, a monster card somebody left on the bar, a flag over a
     kitchen hatch, a rubber duck in a laundry drum. They are
     painted into the room at their real size, which at room scale
     is a smudge — so the only way to know what any of them is is
     to hold the eyeglass up to it.
     ============================================================ */
  function egg(o) {
    const key = 'egg:' + o.id;
    const sp = {
      id: key, x: o.x, y: o.y, w: 18,
      top: o.y - 11, bot: o.y + 11,
      egg: true, art: o.art,
      /* THE NAME IS THE PRIZE. Until you have held the glass to it, the
         plate says nothing useful — an easter egg that announces itself
         is a signpost. */
      label: () => ((G.eggs && G.eggs[key]) ? o.label : 'SOMETHING SMALL'),
      hint: () => ((G.eggs && G.eggs[key]) ? o.label : 'THE GLASS MIGHT TELL YOU'),
      look: o.look,
    };
    sp.onUse = () => { (G.eggs = G.eggs || {})[key] = 1; return STORY.lookClose(sp, sp.x, o.y); };
    return sp;
  }

  /* whatever eggs a room declared, painted into it at 1:1 */
  function paintEggs(c, eggs) {
    (eggs || []).forEach(e => {
      const a = ART.art(e.art, 1);
      c.drawImage(a, Math.round(e.x - a.width / 2), Math.round(e.y - a.height / 2));
    });
  }

  /* ---------- shared furniture ---------- */

  /* rain on the inside of a window, and the street light through it */
  function nightWindow(c, x, y, w, h, seed) {
    c.drawImage(ART.window(w, h, false, seed), x, y);
    const s = CITY.sky();
    if (s.drops > 0.5) {
      for (let i = 0; i < w; i += 3) {
        if ((i * 7 + seed) % 5 === 0) px(c, x + 2 + i, y + 3, 1, 4 + ((i + seed) % 6), 'rgba(150,195,225,.10)');
      }
    }
  }

  /* a wet floor: the lamps come back up off the boards */
  function sheen(c, x, y, w, h, a) {
    ART.dither(c, x, y, w, h, 'rgba(150,190,220,' + (a || 0.05) + ')', 0.1, 23);
  }

  /* FOG. Dither at any real density reads as television static, so fog is
     flat horizontal bands with a couple of drifting banks in them. */
  function haze(c, x, y, w, h, seed) {
    for (let i = 0; i < h; i += 2) {
      const t = i / h;
      px(c, x, y + i, w, 1, 'rgba(196,208,216,' + (0.03 + t * 0.05).toFixed(3) + ')');
    }
    const rng = U.mulberry32((seed || 3) * 29 + 11);
    for (let n = 0; n < 8; n++) {
      const by = y + Math.floor(rng() * h), bw = 40 + Math.floor(rng() * 90);
      const bx = x + Math.floor(rng() * Math.max(1, w - bw));
      px(c, bx, by, bw, 2 + Math.floor(rng() * 3), 'rgba(206,216,224,.05)');
    }
  }

  /* THE FRAME ROUND A HOLE. The scene fills the hole itself with the
     sewer vault, sliding past at a third of the rate; this is the
     brickwork, the lintel and the bars that sit in front of it. */
  function archFrame(c, x, y, w, h, opt) {
    opt = opt || {};
    const p = P();
    /* the lintel and the jambs, stepped like real brick */
    px(c, x - 4, y - 5, w + 8, 5, '#1a1f26');
    px(c, x - 4, y - 5, w + 8, 1, '#2b333d');
    for (let i = 0; i < w + 8; i += 9) px(c, x - 4 + i, y - 5, 1, 5, 'rgba(0,0,0,.4)');
    px(c, x - 4, y, 4, h, '#171c22');
    px(c, x + w, y, 4, h, '#12161b');
    px(c, x - 4, y + h - 2, w + 8, 3, '#0d1116');
    /* the sill, wet */
    px(c, x - 5, y + h, w + 10, 3, '#232a32');
    px(c, x - 5, y + h, w + 10, 1, '#39424e');
    if (opt.bars) {
      for (let bx = x + 5; bx < x + w - 3; bx += 11) {
        px(c, bx, y, 2, h, '#0a0d11');
        px(c, bx, y, 1, h, 'rgba(140,170,200,.10)');
      }
      px(c, x, y + Math.round(h * 0.45), w, 2, '#0a0d11');
    }
    if (opt.grate) {
      for (let gy = y + 4; gy < y + h - 2; gy += 6) px(c, x, gy, w, 2, 'rgba(10,14,18,.7)');
    }
  }

  /* a hanging shop sign, lit */
  function sign(c, x, y, w, word, col) {
    px(c, x, y, w, 12, P().K);
    px(c, x + 1, y + 1, w - 2, 10, '#1a1420');
    px(c, x + 2, y + 2, w - 4, 8, col);
    px(c, x + 2, y + 2, w - 4, 1, 'rgba(255,255,255,.3)');
    /* the wire it hangs off */
    px(c, x + (w >> 1) - 1, 0, 2, y, P().K);
    if (word) {
      const t = PIXFONT.render(word, { scale: 1, color: '#12101d', shadow: null });
      c.drawImage(t, x + Math.round((w - t.width) / 2), y + 3);
    }
  }

  /* the search-me glint every prop with something in it gets */
  function glint(c, x, y, on) {
    if (!on) return;
    px(c, x, y, 2, 2, 'rgba(255,240,170,.5)');
  }

  /* ============================================================
     1. THE CANAL LAUNDRY — the crime scene
     ============================================================ */
  function laundry() {
    const W = 430, FY = 108, seed = seedFor('laundry');

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'tile', railY: 66, seed: seed % 91 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'lino', seed: seed % 47 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0f1316');
      sheen(c, 0, FY - 2, W, 20, 0.06);

      /* the way in, off the towpath */
      px(c, 8, 30, 46, 76, p.K);
      px(c, 11, 33, 40, 73, '#16202a');
      ART.grain(c, 13, 35, 36, 68, '#101821', '#22303c', seed % 29);
      px(c, 44, 70, 3, 5, p.h);
      sign(c, 6, 18, 52, 'LAUNDRY', '#3a7d6a');

      /* THE MACHINES. Three drums, one door open, one still turning. */
      for (let i = 0; i < 3; i++) {
        const mx = 70 + i * 46;
        ART.box(c, mx, FY - 46, 42, 46, { fill: '#cdd3d8', top: '#e6ebee', bot: '#7f878e', left: '#e0e5e8', right: '#9aa2a8', ink: p.K });
        ART.grain(c, mx + 2, FY - 44, 38, 42, '#bcc3c9', '#dde2e6', seed + i * 7);
        /* the drum door */
        const open = i === 1;
        PIX.disc(c, mx + 21, FY - 26, 13, p.K);
        PIX.disc(c, mx + 21, FY - 26, 12, open ? '#0d1116' : '#2a3540');
        if (!open) {
          PIX.disc(c, mx + 21, FY - 26, 9, '#4a5c6a');
          PIX.disc(c, mx + 18, FY - 29, 4, 'rgba(255,255,255,.18)');
          /* the wash still going round */
          const a = (i * 1.7) % 6.28;
          px(c, mx + 21 + Math.round(Math.cos(a) * 5), FY - 26 + Math.round(Math.sin(a) * 5), 3, 3, '#c9d2d8');
        }
        /* the coin slot and the dial */
        px(c, mx + 6, FY - 42, 12, 4, p.K);
        px(c, mx + 7, FY - 41, 10, 2, '#5a646c');
        px(c, mx + 30, FY - 42, 8, 8, p.K);
        px(c, mx + 31, FY - 41, 6, 6, '#8d9298');
        px(c, mx + 33, FY - 40, 2, 3, '#22282e');
      }

      /* THE OUTLINE. Where he was, in chalk, with the tape still up. */
      const ox = 236;
      const chalk = 'rgba(236,232,214,.62)';
      px(c, ox, FY - 3, 40, 2, chalk);
      px(c, ox, FY - 3, 2, -12, chalk);
      px(c, ox - 2, FY - 16, 16, 2, chalk);
      px(c, ox + 14, FY - 22, 2, 8, chalk);
      px(c, ox + 14, FY - 22, 14, 2, chalk);
      px(c, ox + 26, FY - 16, 2, 14, chalk);
      px(c, ox + 34, FY - 12, 8, 2, chalk);
      /* the tape, strung across the corner */
      for (let x = 196; x < 330; x += 4) {
        px(c, x, 74 + Math.round(Math.sin(x * 0.12) * 2), 3, 2, x % 8 ? '#e0c23a' : '#12101d');
      }

      /* the cart of sheets, the drain, the till */
      ART.box(c, 314, FY - 26, 46, 26, { fill: '#4a4038', top: '#5e5246', bot: '#2a231d', ink: p.K });
      for (let i = 0; i < 5; i++) px(c, 318 + i * 8, FY - 32 - (i % 3), 8, 8 + (i % 3), '#ded2b4');
      px(c, 316, FY - 4, 6, 4, p.K); px(c, 352, FY - 4, 6, 4, p.K);
      /* the floor drain, in a wet patch */
      ART.dither(c, 288, FY - 8, 30, 10, 'rgba(120,170,200,.18)', 0.3, 13);
      px(c, 294, FY - 6, 18, 6, p.K);
      for (let i = 0; i < 4; i++) px(c, 296 + i * 4, FY - 5, 2, 4, '#0b0f13');
      /* THE CANAL ARCH. The laundry backs onto the water: this is the hole
         it backs onto, and the vault behind it slides past on its own. */
      archFrame(c, 232, 24, 84, 44, { bars: true });

      /* ============================================================
         AND EVERYTHING ELSE A WASH-HOUSE HAS IN IT.

         The room was three machines, a chalk outline and a lot of
         tile. What makes it a place somebody worked in all week is
         the rest of it: sheets on a line across the middle, a
         folding table with a stack nobody came back for, the
         soap shelf, a mop in a bucket, and the water everywhere.
         ============================================================ */

      /* SHEETS ON A LINE, across the midground. Hung at a height you look
         under, so the room has something between you and the back wall. */
      px(c, 62, 30, 300, 1, '#5a5040');
      for (let i = 0; i < 5; i++) {
        const sx = 74 + i * 58, sw = 34 + (i % 2) * 8;
        const sh = 22 + ((i * 7 + seed) % 10);
        px(c, sx, 30, sw, sh, i % 2 ? '#cfc7b2' : '#ded6c2');
        px(c, sx, 30, sw, 2, '#f0e9d6');
        px(c, sx, 30 + sh - 2, sw, 2, 'rgba(0,0,0,.22)');
        /* the fold shadows down it, and the sag at the bottom */
        for (let k = 4; k < sw - 3; k += 7) px(c, sx + k, 32, 1, sh - 4, 'rgba(0,0,0,.10)');
        px(c, sx + 2, 30 + sh, sw - 4, 1, 'rgba(0,0,0,.3)');
        /* two pegs */
        px(c, sx + 3, 28, 2, 4, '#8d6a3a');
        px(c, sx + sw - 5, 28, 2, 4, '#8d6a3a');
      }

      /* THE FOLDING TABLE, with a stack nobody came back for */
      ART.box(c, 176, FY - 30, 54, 8, { fill: '#8d8672', top: '#a8a08a', bot: '#4a4638', ink: p.K });
      px(c, 182, FY - 22, 4, 22, p.K);
      px(c, 220, FY - 22, 4, 22, p.K);
      for (let i = 0; i < 4; i++) {
        px(c, 184 + (i % 2) * 2, FY - 36 + i * 2, 38 - i * 2, 3, i % 2 ? '#ded2b4' : '#cfc4a6');
        px(c, 184 + (i % 2) * 2, FY - 36 + i * 2, 38 - i * 2, 1, '#f0e6c8');
      }

      /* THE SOAP SHELF, and the row of tins on it */
      px(c, 366, 52, 58, 3, '#4a4038');
      px(c, 366, 55, 58, 2, 'rgba(0,0,0,.3)');
      for (let i = 0; i < 5; i++) {
        const tx = 370 + i * 11;
        px(c, tx, 42, 9, 10, i % 2 ? '#4f7d9c' : '#9c6a4f');
        px(c, tx, 42, 9, 2, i % 2 ? '#6f9dbc' : '#bc8a6f');
        px(c, tx + 2, 45, 5, 3, '#ded2b4');
      }

      /* A MOP IN A BUCKET, left where somebody dropped it */
      px(c, 44, FY - 14, 16, 14, p.K);
      px(c, 45, FY - 13, 14, 12, '#3f5a60');
      px(c, 45, FY - 13, 14, 2, '#5f7a80');
      px(c, 46, FY - 6, 12, 5, 'rgba(120,190,200,.5)');
      px(c, 56, FY - 46, 3, 34, '#8d6a3a');
      px(c, 52, FY - 50, 11, 6, '#a8a08a');
      px(c, 52, FY - 50, 11, 2, '#c9c0a8');

      /* WATER, EVERYWHERE. It is a laundry: the floor is never dry. */
      [[96, 20], [188, 26], [268, 18], [340, 22]].forEach(([wx, ww], i) => {
        ART.dither(c, wx, FY - 5, ww, 6, 'rgba(120,180,210,.16)', 0.35, 11 + i * 4);
        px(c, wx + 2, FY - 2, ww - 4, 1, 'rgba(170,215,235,.16)');
      });

      /* the strip light, and the damp in the corners */
      for (const lx of [110, 210, 310]) c.drawImage(ART.hangLamp(16, 22, false), lx - 8, 0);
      ART.dither(c, 0, FY - 24, W, 24, 'rgba(0,0,0,.2)', 0.1, 31);
    };

    /* the front counter, painted over the cast, so the launderer is behind it */
    const onPaintFront = (c) => {
      const p = P();
      ART.box(c, 374, FY - 30, 52, 30, { fill: '#5d4a33', top: '#77603f', bot: '#2e2418', ink: p.K });
      ART.box(c, 388, FY - 42, 24, 12, { fill: '#8d9298', top: '#b3b8bd', bot: '#4a5056', ink: p.K });
      px(c, 392, FY - 39, 16, 5, '#22282e');
      px(c, 378, FY - 34, 6, 4, '#8c2230');
    };

    const spots = [
      { id: 'drain', x: 303, w: 28, top: FY - 12, label: 'THE FLOOR DRAIN',
        hint: 'PUT YOUR HAND IN IT' },
      { id: 'machine', x: 137, w: 42, top: FY - 46, label: 'THE OPEN DRUM',
        hint: 'SOMEBODY LEFT A WASH IN' },
      { id: 'cart', x: 336, w: 46, top: FY - 34, label: 'THE SHEET CART',
        hint: 'GO THROUGH IT' },
      { id: 'outline', x: 256, w: 46, top: FY - 24, label: 'WHERE HE WAS',
        hint: 'LOOK AT THE FLOOR' },
      { id: 'till', x: 400, w: 52, top: FY - 42, label: 'THE TILL',
        hint: "NIGHT'S TAKINGS" },
    ];

    const actors = [
      { id: 'wit', x: 402, y: FY, key: 'launder', def: LAUNDER_DEF, face: -1, still: true,
        tag: 'THE LAUNDERER', tagCol: PIX.PAL.G, witness: true, mood: 'shifty', job: 'sort' },
    ];

    const eggs = [
      egg({ id: 'duck', x: 137, y: FY - 30, art: 'eg_duck',
        label: 'SOMETHING YELLOW IN THE DRUM',
        look: "A RUBBER DUCK, GOING ROUND WITH SOMEBODY'S SHIRTS. IT HAS SEEN THINGS." }),
    ];

    return { id: 'laundry', w: W, floorY: FY, paint, onPaintFront, actors, spots, eggs,
      pets: [{ kind: 'cat', x: 300, name: 'THE LAUNDRY CAT' }],
      depth: [{ x: 232, y: 24, w: 84, h: 44 , sky: true }],
      enterX: 34, enterFace: 1,
      stairs: { to: 'cellar', x: 214, label: 'THE CELLAR STEPS', hint: 'DOWN INTO THE WET' },
      lights: [{ x: 110, y: 14, r: 40 }, { x: 210, y: 14, r: 42, flicker: true },
               { x: 310, y: 14, r: 40 }] };
  }

  /* ============================================================
     2. PIER NINETEEN — crates, a crane and black water
     ============================================================ */
  function docks() {
    const W = 470, FY = 106, seed = seedFor('docks');

    const paint = (c) => {
      const p = P();
      /* NO WALL: the water, the far bank, and the sky, which is DAY's.
         Rows 0..43 are left transparent and `skyTo` hands them over. */
      /* THE FAR BANK. Blocks of real width with roofs on them, not a
         column of fixed-width posts — the first pass at this stepped
         across in sevens and came out as a picket fence. */
      const rb = U.mulberry32(seed * 7 + 3);
      let bx2 = -6;
      while (bx2 < W + 6) {
        const bw = 16 + Math.floor(rb() * 20);
        const h = 14 + Math.floor(rb() * 20);
        const far = rb();
        /* the haze of the river takes the contrast out of it */
        const tone = far < 0.34 ? '#c6c2ae' : far < 0.68 ? '#b8b4a2' : '#d0ccba';
        px(c, bx2, 40 - h, bw, h, tone);
        px(c, bx2, 40 - h, bw, 1, '#e2ddc9');
        px(c, bx2 + bw - 2, 40 - h, 2, h, 'rgba(110,104,86,.22)');
        /* the mansard */
        const rh = 3 + Math.floor(rb() * 3);
        for (let i = 0; i < rh; i++) {
          px(c, bx2 + i, 40 - h - rh + i, bw - i * 2, 1, i ? '#a6adb6' : '#c0c7ce');
        }
        /* windows: three rows of them, dark against the stone */
        for (let wy = 40 - h + 4; wy < 38; wy += 6) {
          for (let wx = bx2 + 3; wx < bx2 + bw - 3; wx += 6) {
            px(c, wx, wy, 3, 4, '#8d94a0');
            px(c, wx, wy, 3, 1, '#b6c4d0');
          }
        }
        bx2 += bw + 1;
      }
      /* the quay wall on the far side, and the trees along the top of it */
      px(c, 0, 40, W, 5, '#c0b69c');
      px(c, 0, 40, W, 1, '#dcd2b6');
      px(c, 0, 44, W, 3, '#9a9080');
      for (let tx = 6; tx < W; tx += 27) {
        PIX.disc(c, tx, 36, 6, '#4a6f3c');
        PIX.disc(c, tx - 2, 34, 4, '#5f8c48');
        px(c, tx, 38, 1, 4, '#8a7f68');
      }
      /* THE WATER. Green-brown river, banded, with the sky broken up on it
         in a few long smears. Anything busier than this reads as
         television static rather than a river. */
      px(c, 0, 47, W, FY - 47, '#5e7d6a');
      /* THE BANDS GET TALLER AS THE WATER COMES AT YOU. Flat stripes of a
         constant height read as a painted wall; a band that doubles in
         height from the far bank to your boots reads as a surface going
         away from you, which is the only thing that sells water. */
      {
        let y = 48, k = 0;
        while (y < FY) {
          const t = (y - 48) / (FY - 48);
          const bh = 1 + Math.round(t * 3);
          px(c, 0, y, W, bh, 'rgba(122,170,166,' + (0.44 - t * 0.30).toFixed(3) + ')');
          px(c, 0, y, W, 1, 'rgba(196,226,214,' + (0.20 - t * 0.13).toFixed(3) + ')');
          /* and the darker trough under each band */
          px(c, 0, y + bh, W, 1, 'rgba(48,74,64,' + (0.16 + t * 0.12).toFixed(3) + ')');
          y += bh + 1 + (k++ % 2);
        }
      }
      const rw = U.mulberry32(seed * 13 + 5);
      /* the far bank, pulled down into the water under itself */
      for (let n = 0; n < 6; n++) {
        const rx = 10 + Math.floor(rw() * (W - 20));
        for (let y = 50; y < FY - 4; y += 4) {
          const w2 = 3 + ((y + rx) % 4);
          px(c, rx + ((y >> 2) % 2), y, w2, 1,
            'rgba(220,214,196,' + (0.22 - (y - 50) * 0.0026).toFixed(3) + ')');
        }
      }
      /* AND THE SUN ON IT, which is the whole reason to draw a river. The
         glitter is not scattered evenly: it runs in a lane from the sun to
         your feet, widening as it comes, and that lane is what makes the
         flat green read as something wet. */
      const lane = Math.round(W * 0.62);
      for (let n = 0; n < 150; n++) {
        const t = rw();
        const gy = 50 + Math.round(t * (FY - 56));
        const spread = 8 + Math.round(t * 46);
        const gx = lane + Math.round((rw() - 0.5) * 2 * spread);
        if (gx < 0 || gx > W) continue;
        px(c, gx, gy, 1 + Math.floor(rw() * 3), 1,
          'rgba(255,252,228,' + (0.20 + rw() * 0.55).toFixed(2) + ')');
      }
      /* a barge going down, and one tied up, because a river has traffic */
      [[60, 0.30], [300, 0.62]].forEach(([bgx, bt], i) => {
        const by = 50 + Math.round(bt * (FY - 56));
        const bl = 54 - i * 12;
        px(c, bgx, by, bl, 5, '#4a4034');
        px(c, bgx, by, bl, 1, '#6f6250');
        px(c, bgx + 4, by - 4, 12, 4, '#8a3a34');
        px(c, bgx + 4, by - 4, 12, 1, '#b05a4c');
        px(c, bgx + bl - 14, by - 3, 8, 3, '#5f7f78');
        px(c, bgx, by + 5, bl, 2, 'rgba(40,60,54,.45)');
        for (let k = 0; k < bl; k += 5) px(c, bgx + k, by + 7, 3, 1, 'rgba(230,250,240,.30)');
      });
      /* the chop right under the boards */
      for (let i = 0; i < W; i += 4) {
        px(c, i, FY - 6 + ((i * 5 + seed) % 3), 3, 1, 'rgba(235,250,240,.28)');
      }

      /* the boards you stand on */
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'board', seed: seed % 53 }), 0, FY - 2);
      px(c, 0, FY - 4, W, 3, '#1b1409');
      px(c, 0, FY - 2, W, 1, 'rgba(255,255,255,.05)');
      sheen(c, 0, FY - 2, W, 22, 0.08);

      /* THE CRANE, up the far end, still working */
      px(c, W - 90, 12, 8, FY - 14, p.K);
      px(c, W - 88, 14, 4, FY - 18, '#4a4238');
      px(c, W - 140, 12, 60, 6, p.K);
      px(c, W - 138, 13, 56, 3, '#5a5044');
      px(c, W - 120, 18, 2, 26, p.S);
      px(c, W - 126, 44, 14, 10, p.K);
      px(c, W - 124, 46, 10, 6, '#7a6a2a');
      /* the lamp on it, which nobody has needed since sunrise */
      px(c, W - 144, 16, 6, 5, p.K);
      px(c, W - 143, 17, 4, 3, '#cdd6dc');

      /* CRATES, stacked wrong */
      const stack = [[70, 3], [118, 2], [166, 1], [250, 2], [300, 1]];
      stack.forEach(([x, n], i) => {
        for (let j = 0; j < n; j++) {
          const s = 28 - j * 2;
          c.drawImage(ART.crate(s, seed + i * 3 + j), x + j * 2, FY - s * (j + 1) + j * 2);
        }
      });
      /* a barrel with a fire in it, and the light it throws */
      const bx = 206;
      ART.box(c, bx, FY - 30, 24, 30, { fill: '#5a3a22', top: '#6e4a2c', bot: '#2a1a10', ink: p.K });
      px(c, bx + 2, FY - 28, 20, 2, '#3a2416');
      /* the fire in it: three tongues, none of them the same width */
      px(c, bx + 3, FY - 34, 18, 5, '#c9491c');
      px(c, bx + 5, FY - 37, 13, 4, '#e0662a');
      px(c, bx + 7, FY - 40, 5, 5, '#ffb03a');
      px(c, bx + 13, FY - 41, 4, 6, '#ffb03a');
      px(c, bx + 9, FY - 44, 3, 4, '#ffe7a3');
      px(c, bx + 14, FY - 45, 2, 3, '#ffe7a3');
      /* and the smoke off it */
      for (let i = 0; i < 5; i++) {
        px(c, bx + 10 + ((i * 7 + seed) % 5) - 2, FY - 48 - i * 4, 2, 2,
          'rgba(180,175,170,' + (0.14 - i * 0.02) + ')');
      }
      /* mooring bollards and a coil of rope */
      [40, 356, 420].forEach(x => {
        ART.box(c, x, FY - 12, 12, 12, { fill: '#3a3f46', top: '#525860', bot: '#20242a', ink: p.K });
        px(c, x - 1, FY - 15, 14, 4, p.K);
        px(c, x, FY - 14, 12, 2, '#5a616a');
      });
      for (let i = 0; i < 3; i++) PIX.disc(c, 384, FY - 6 - i, 9 - i * 2, i ? '#3a3226' : p.K);

      /* the shed, locked */
      ART.box(c, 340, FY - 52, 54, 52, { fill: '#2f3a34', top: '#3e4c44', bot: '#18201c', ink: p.K });
      ART.grain(c, 342, FY - 50, 50, 48, '#26302a', '#3a463e', seed % 37);
      px(c, 358, FY - 40, 18, 22, p.K);
      px(c, 360, FY - 38, 14, 18, '#141a16');
      px(c, 364, FY - 30, 6, 5, p.G);
      px(c, 344, FY - 56, 46, 5, p.K);

      /* the rain, if it is raining, and the fog if it is not */
      const s = CITY.sky();
      if (s.haze) haze(c, 0, 30, W, FY - 30, seed % 23);
      ART.dither(c, 0, 0, W, 30, 'rgba(0,0,0,.3)', 0.1, 41);
    };

    const spots = [
      { id: 'crates', x: 130, w: 60, top: FY - 58, label: 'THE CRATES',
        hint: 'NOBODY SIGNED FOR THESE' },
      { id: 'barrel', x: 218, w: 26, top: FY - 40, label: 'THE FIRE BARREL',
        hint: 'SOMETHING WAS BURNED HERE' },
      { id: 'water', x: 40, w: 30, top: FY - 14, label: 'THE WATER',
        hint: 'REACH DOWN' },
      { id: 'shed', x: 366, w: 54, top: FY - 52, label: 'THE LOCKED SHED',
        hint: 'THE LOCK IS NEW' },
      { id: 'rope', x: 384, w: 22, top: FY - 14, label: 'THE ROPE COIL',
        hint: 'CUT, NOT UNTIED' },
    ];

    const actors = [
      { id: 'wit', x: 322, y: FY, key: 'watch', def: WATCH_DEF, face: -1,
        job: 'smoke', tag: 'THE WATCHMAN', tagCol: PIX.PAL.S, witness: true, mood: 'bored' },
    ];

    const eggs = [
      /* ON the crate, not above it: at the close camera an easter egg
         hanging eight pixels off the top of a stack is a balloon */
      egg({ id: 'ball', x: 134, y: FY - 50, art: 'eg_ball',
        label: 'SOMETHING RED AND WHITE',
        look: 'A RED AND WHITE BALL WITH A BUTTON ON IT. THE CRATE SAYS KANTO.' }),
    ];

    return { id: 'docks', w: W, floorY: FY, paint, actors, spots, outdoor: true, eggs,
      skyTo: 44,
      pets: [{ kind: 'cat', x: 250, name: 'A PIER CAT' }],
      depth: [{ x: 0, y: 0, w: W, h: 44 , sky: true }],
      enterX: 26, enterFace: 1,
      lights: [{ x: 206, y: 60, r: 40, a: 0.1 }, { x: W - 144, y: 18, r: 46, flicker: true }] };
  }

  /* ============================================================
     3. MARSH ROW PAWN — everything taken off a body
     ============================================================ */
  function pawn() {
    const W = 400, FY = 106, seed = seedFor('pawn');

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'brick', railY: 72, seed: seed % 83 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'board', seed: seed % 41 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0d0b09');

      /* the door, with the bell over it */
      px(c, 10, 32, 44, 74, p.K);
      px(c, 13, 35, 38, 71, '#251c14');
      px(c, 18, 42, 28, 26, p.K);
      px(c, 20, 44, 24, 22, 'rgba(200,220,255,.1)');
      px(c, 44, 72, 3, 5, p.h);
      px(c, 28, 28, 8, 5, p.K); px(c, 30, 29, 4, 3, '#c9a227');
      sign(c, 8, 16, 56, 'PAWN', '#8c2230');

      /* THE SHELVES: what people gave up, in rows */
      for (let r = 0; r < 3; r++) {
        const sy = 36 + r * 22;
        px(c, 76, sy + 14, 150, 3, p.K);
        px(c, 77, sy + 14, 148, 1, '#6b4426');
        for (let i = 0; i < 9; i++) {
          const ix = 80 + i * 16, kind = (i + r * 3 + seed) % 6;
          if (kind === 0) { px(c, ix, sy + 4, 8, 10, '#8d9298'); px(c, ix + 1, sy + 5, 6, 3, '#c9d2d8'); }
          else if (kind === 1) { PIX.disc(c, ix + 4, sy + 9, 5, '#c9a227'); PIX.disc(c, ix + 4, sy + 9, 3, '#e6c84a'); }
          else if (kind === 2) { px(c, ix + 1, sy + 2, 6, 12, '#3a2f52'); px(c, ix + 2, sy + 3, 4, 4, '#6f5aa8'); }
          else if (kind === 3) { px(c, ix, sy + 8, 9, 6, '#5d4a33'); px(c, ix + 3, sy + 5, 3, 3, p.K); }
          else if (kind === 4) { px(c, ix + 2, sy + 6, 5, 8, '#7f2f2f'); px(c, ix + 3, sy + 7, 3, 2, '#c94a4a'); }
          else { px(c, ix + 1, sy + 7, 7, 7, '#2f3a44'); px(c, ix + 2, sy + 8, 5, 2, '#5f7a8c'); }
        }
      }

      /* THE SAFE, half hidden behind the counter */
      ART.box(c, 344, FY - 40, 44, 40, { fill: '#2c333a', top: '#3d464e', bot: '#171c21', ink: p.K });
      ART.rivets(c, 346, FY - 38, 40, 36, '#5a636c', 8);
      PIX.disc(c, 366, FY - 22, 8, p.K);
      PIX.disc(c, 366, FY - 22, 6, '#8d9298');
      px(c, 365, FY - 27, 2, 6, '#22282e');
      px(c, 352, FY - 36, 24, 4, p.K);

      /* the lamp over the counter */
      c.drawImage(ART.hangLamp(18, 28, false), 270, 0);
      c.drawImage(ART.hangLamp(14, 20, false), 120, 0);

      /* the way through to the back, where the good stuff is */
      archFrame(c, 60, 34, 40, 66, {});

      /* a birdcage, because somebody pawned a bird */
      px(c, 232, 14, 22, 4, p.K);
      for (let x = 234; x < 254; x += 4) px(c, x, 18, 2, 26, p.K);
      px(c, 232, 44, 22, 4, p.K);
      px(c, 240, 30, 7, 8, '#e0c23a');
      px(c, 242, 28, 3, 3, '#c98a1a');
      px(c, 242, 4, 2, 10, p.K);

      ART.dither(c, 0, FY - 20, W, 20, 'rgba(0,0,0,.24)', 0.1, 29);
    };

    const spots = [
      { id: 'case', x: 288, w: 92, top: FY - 52, label: 'THE GLASS CASE',
        hint: 'WHAT CAME IN TONIGHT' },
      { id: 'ledger', x: 269, w: 30, top: FY - 44, label: 'THE LEDGER',
        hint: 'WHO BROUGHT IT IN' },
      { id: 'safe', x: 366, w: 44, top: FY - 40, label: 'THE SAFE',
        hint: 'ASK HIM TO OPEN IT' },
      { id: 'shelf', x: 150, w: 150, top: 36, bot: 96, label: 'THE SHELVES',
        hint: "DEAD PEOPLE'S THINGS" },
    ];

    const actors = [
      { id: 'wit', x: 288, y: FY, key: 'pawn', def: PAWN_DEF, face: -1, still: true,
        tag: 'THE BROKER', tagCol: PIX.PAL.Y, witness: true, mood: 'watch', job: 'notes' },
    ];

    /* the glass case and its counter are painted over him, so he is behind
       the till the way a broker always is */
    const onPaintFront = (c) => {
      const p = P();
      ART.box(c, 240, FY - 34, 96, 34, { fill: '#5d4a33', top: '#7a6142', bot: '#2e2418', ink: p.K });
      ART.box(c, 244, FY - 52, 88, 18, { fill: 'rgba(150,200,220,.14)', top: 'rgba(220,240,255,.3)', bot: p.K, ink: p.K });
      for (let i = 0; i < 5; i++) {
        const ix = 250 + i * 17;
        if (i % 2) { PIX.disc(c, ix + 4, FY - 42, 4, '#c9a227'); PIX.disc(c, ix + 4, FY - 42, 2, '#f0d76a'); }
        else { px(c, ix, FY - 46, 9, 8, '#8d9298'); px(c, ix + 1, FY - 45, 7, 3, '#dfe6ea'); }
      }
      for (let x = 244; x < 332; x += 8) px(c, x, FY - 52, 2, 18, 'rgba(30,40,50,.5)');
      /* the ledger, open on the counter */
      px(c, 256, FY - 40, 26, 6, p.K);
      px(c, 257, FY - 39, 24, 4, '#ded2b4');
      px(c, 259, FY - 38, 20, 1, '#8d8672');
    };

    const eggs = [
      egg({ id: 'card', x: 178, y: 58, art: 'eg_card',
        label: 'A CARD IN A SLEEVE',
        look: 'A MONSTER ON A CARD, IN A PLASTIC SLEEVE, PRICED AT MORE THAN THE SAFE.' }),
      egg({ id: 'flag', x: 262, y: 52, art: 'eg_flag',
        label: 'A LITTLE FLAG',
        look: 'RED, WHITE AND BLUE IN BANDS. SOMEBODY A LONG WAY FROM HOME PAWNED IT.' }),
    ];

    return { id: 'pawn', w: W, floorY: FY, paint, onPaintFront, actors, spots, eggs,
      pets: [{ kind: 'cat', x: 120, name: 'THE SHOP CAT' }],
      stairs: { to: 'above', x: 336, label: 'THE STAIRS UP', hint: 'HE LIVES OVER THE SHOP' },
      depth: [{ x: 60, y: 34, w: 40, h: 66 , sky: true }],
      enterX: 34, enterFace: 1,
      lights: [{ x: 120, y: 20, r: 34 }, { x: 279, y: 28, r: 44 }] };
  }

  /* ============================================================
     4. THE FLY TRAP — coffee, donuts, the night shift
     ============================================================ */
  function diner() {
    const W = 430, FY = 108, seed = seedFor('diner');

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'tile', railY: 60, seed: seed % 77 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'lino', seed: seed % 39 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#12161a');
      /* the checker floor this place would actually have */
      for (let x = 0; x < W; x += 12) {
        for (let y = FY; y < SCENE.H; y += 12) {
          if (((x / 12) + (y / 12)) % 2 === 0) px(c, x, y, 12, 12, 'rgba(230,235,240,.05)');
        }
      }

      /* the street window, all down the near end: a real hole with the
         city going past it rather than a picture of one */
      archFrame(c, 10, 20, 92, 40, {});
      px(c, 6, 60, 100, 4, '#2a2f38');
      px(c, 6, 60, 100, 1, '#454e5a');
      sign(c, 22, 8, 68, 'THE FLY TRAP', '#c94a4a');

      /* the back bar: urn, hatch, pie case, a donut tower */
      ART.box(c, 128, FY - 62, 34, 36, { fill: '#8d9298', top: '#b8bfc4', bot: '#4a5056', ink: p.K });
      px(c, 134, FY - 56, 22, 4, '#22282e');
      px(c, 140, FY - 40, 10, 8, p.K);
      px(c, 142, FY - 38, 6, 4, '#3a2a18');
      for (let i = 0; i < 4; i++) {                       // the donuts, on a spike
        const dy = FY - 34 - i * 7;
        PIX.disc(c, 190, dy, 9, p.K);
        PIX.disc(c, 190, dy, 8, i % 2 ? '#c98a4a' : '#e0a86a');
        PIX.disc(c, 190, dy, 3, '#2a1d12');
        if (i === 3) { PIX.disc(c, 190, dy - 1, 7, '#e56aa8'); PIX.disc(c, 190, dy, 3, '#2a1d12'); }
      }
      px(c, 214, FY - 44, 40, 18, p.K);                   // the pie case
      px(c, 216, FY - 42, 36, 14, 'rgba(160,210,230,.16)');
      px(c, 218, FY - 34, 14, 5, '#e0a86a');
      px(c, 236, FY - 34, 14, 5, '#c9d2d8');
      px(c, 270, FY - 58, 46, 32, p.K);                   // the kitchen hatch
      px(c, 272, FY - 56, 42, 28, '#1a2028');
      px(c, 272, FY - 34, 42, 4, '#5a636c');
      for (let i = 0; i < 3; i++) px(c, 276 + i * 14, FY - 52, 10, 3, '#e0662a');
      /* the menu board over the hatch */
      px(c, 268, FY - 74, 50, 14, p.K);
      px(c, 270, FY - 72, 46, 10, '#1d2a26');
      for (let i = 0; i < 3; i++) px(c, 273, FY - 70 + i * 3, 20 + (i * 7) % 18, 1, '#8fb3a0');

      /* the booths at the far end */
      for (let i = 0; i < 2; i++) {
        const bx = 348 + i * 40;
        ART.box(c, bx, FY - 40, 30, 14, { fill: '#8c2230', top: '#c94a4a', bot: '#4a1218', ink: p.K });
        ART.box(c, bx, FY - 26, 30, 8, { fill: '#5d4a33', top: '#7a6142', bot: '#2e2418', ink: p.K });
        px(c, bx + 4, FY - 18, 3, 18, p.K);
        px(c, bx + 23, FY - 18, 3, 18, p.K);
      }

      for (const lx of [90, 200, 320]) c.drawImage(ART.hangLamp(16, 20, false), lx - 8, 0);
      ART.dither(c, 0, FY - 18, W, 18, 'rgba(0,0,0,.18)', 0.08, 19);
    };

    const spots = [
      { id: 'urn', x: 145, w: 34, top: FY - 62, label: 'THE COFFEE URN',
        hint: 'A CUP AND A LOOK ROUND' },
      { id: 'booth', x: 363, w: 30, top: FY - 40, label: 'THE CORNER BOOTH',
        hint: 'SOMEBODY SAT HERE ALL NIGHT' },
      { id: 'bin', x: 410, w: 24, top: FY - 24, label: 'THE BIN',
        hint: 'GO THROUGH IT' },
      { id: 'donuts', x: 190, w: 22, top: FY - 66, label: 'THE DONUTS',
        hint: 'MAKE A BATCH' },
      { id: 'hatch', x: 293, w: 46, top: FY - 58, label: 'THE KITCHEN HATCH',
        hint: 'THE COOK SEES THE STREET' },
    ];

    const actors = [
      { id: 'wit', x: 246, y: FY, key: 'waitress', def: WAITRESS_DEF, face: -1, still: true,
        tag: 'THE WAITRESS', tagCol: PIX.PAL.P, witness: true, mood: 'pleased', job: 'wipe' },
      { id: 'cook', x: 300, y: FY, key: 'cook', def: COOK_DEF, face: -1, still: true,
        tag: 'THE COOK', tagCol: PIX.PAL.N },
    ];

    /* THE COUNTER, painted over the cast: the staff work behind it and the
       stools are on your side of it */
    const onPaintFront = (c) => {
      const p = P();
      ART.box(c, 120, FY - 26, 220, 26, { fill: '#98a0a6', top: '#dfe6ea', bot: '#5a6268', ink: p.K });
      px(c, 122, FY - 24, 216, 2, '#e8eef2');
      /* the front is tiled, with a chrome rail along the top of it */
      px(c, 122, FY - 20, 216, 2, '#c94a4a');
      for (let x = 124; x < 338; x += 11) px(c, x, FY - 18, 1, 16, 'rgba(30,40,46,.5)');
      for (let y = FY - 18; y < FY; y += 6) px(c, 122, y, 216, 1, 'rgba(255,255,255,.05)');
      ART.grain(c, 122, FY - 16, 216, 14, '#8d959b', '#a8b0b6', 17);
      /* a cup and a plate somebody left on it */
      px(c, 168, FY - 31, 8, 6, p.K);
      px(c, 169, FY - 30, 6, 4, '#e8eef2');
      px(c, 232, FY - 29, 12, 3, p.K);
      px(c, 233, FY - 28, 10, 1, '#dfe6ea');
      /* the stools, on your side */
      for (let i = 0; i < 6; i++) {
        const sx = 138 + i * 36;
        px(c, sx, FY - 6, 4, 6, p.K);
        px(c, sx - 6, FY - 12, 16, 6, p.K);
        px(c, sx - 5, FY - 11, 14, 4, '#8c2230');
        px(c, sx - 5, FY - 11, 14, 1, '#c94a4a');
      }
    };

    const eggs = [
      egg({ id: 'flag2', x: 293, y: FY - 72, art: 'eg_flag',
        label: 'A FLAG OVER THE HATCH',
        look: 'THE COOK IS FROM SOMEWHERE WARMER. THE CHILLI OIL IS HIS OWN.' }),
    ];

    return { id: 'diner', w: W, floorY: FY, paint, onPaintFront, actors, spots, eggs,
      pets: [{ kind: 'cat', x: 400, name: 'THE DINER CAT' }],
      depth: [{ x: 10, y: 20, w: 92, h: 40 , sky: true }],
      enterX: 30, enterFace: 1,
      lights: [{ x: 90, y: 14, r: 38 }, { x: 200, y: 14, r: 40 }, { x: 320, y: 14, r: 38, flicker: true }] };
  }

  /* ============================================================
     5. THE GREEN LAMP — where the crew drinks
     ============================================================ */
  function bar() {
    const W = 460, FY = 106, seed = seedFor('bar');

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'brick', railY: 70, seed: seed % 97 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'board', seed: seed % 53 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0d0b09');
      px(c, 0, FY - 1, W, 1, 'rgba(255,255,255,.05)');

      /* the door out, under a dead sign */
      px(c, 10, 34, 44, 72, p.K);
      px(c, 13, 37, 38, 69, '#1f1710');
      ART.grain(c, 15, 39, 34, 64, '#181109', '#2e2216', seed % 31);
      px(c, 44, 70, 3, 5, p.h);
      sign(c, 8, 20, 52, 'THE LAMP', '#2e7d5b');

      /* ------------------------------------------------------------
         THE BACK BAR.

         Fourteen five-pixel tabs of colour along a shelf read as a row
         of postage stamps, which is what a bottle looks like when the
         camera is far enough away not to care. It is not far away any
         more. A bottle is a shoulder, a neck, a cap and a label, and it
         catches the light down one side.
         ------------------------------------------------------------ */
      px(c, 80, 38, 130, 3, p.K); px(c, 81, 38, 128, 1, '#6b4426');
      px(c, 82, 40, 126, 14, '#171b22');               /* the mirror behind */
      ART.dither(c, 82, 40, 126, 14, 'rgba(200,220,235,.05)', 0.2, 5);
      for (let i = 0; i < 16; i++) {
        const bx = 84 + i * 8;
        const h2 = 13 + (i % 4) * 3;                    /* how tall this one is */
        const top = 54 - h2;
        const glass = ['#2e7d5b', '#8c2230', '#a5741f', '#3f89c4', '#6b4426'][i % 5];
        const lit = ['#4fae82', '#c2465a', '#d8a23c', '#6fb2e0', '#9a6f42'][i % 5];
        /* the body, three wide, with a lit edge down the left of it */
        px(c, bx, top + 4, 6, h2 - 4, glass);
        px(c, bx, top + 4, 1, h2 - 4, lit);
        px(c, bx + 5, top + 4, 1, h2 - 4, 'rgba(0,0,0,.34)');
        /* the shoulder, stepping in to the neck */
        px(c, bx + 1, top + 2, 4, 2, glass);
        px(c, bx + 1, top + 2, 1, 2, lit);
        px(c, bx + 2, top, 2, 3, glass);
        px(c, bx + 2, top, 1, 3, lit);
        /* the cap, and a foil collar on the tall ones */
        px(c, bx + 2, top - 2, 2, 2, i % 3 ? '#c9a24a' : '#8d8672');
        if (h2 > 18) px(c, bx + 1, top + 1, 4, 1, '#c9a24a');
        /* the label, which is the only thing you actually read */
        px(c, bx, top + 8, 6, 4, '#e2d7b8');
        px(c, bx, top + 8, 6, 1, '#f2e9cf');
        px(c, bx + 1, top + 9, 4, 1, 'rgba(34,32,28,.55)');
        /* and what is left in it */
        if (i % 3 === 1) px(c, bx + 1, top + 4, 4, 3, 'rgba(12,14,18,.45)');
      }
      px(c, 80, 54, 130, 3, p.K); px(c, 81, 54, 128, 1, '#6b4426');
      px(c, 81, 53, 128, 1, 'rgba(255,240,210,.14)');   /* the shelf's lit lip */
      /* the lamp the place is named after */
      px(c, 140, 12, 4, 10, p.K);
      PIX.disc(c, 142, 26, 10, p.K);
      PIX.disc(c, 142, 26, 8, '#1e6b4a');
      PIX.disc(c, 142, 24, 5, '#3fae7a');

      /* tables, chairs, a coat rack, the jukebox */
      for (let i = 0; i < 4; i++) {
        const tx = 250 + i * 48;
        if (tx > W - 70) break;
        px(c, tx, FY - 16, 28, 3, p.K);
        px(c, tx + 1, FY - 16, 26, 2, '#4d301a');
        px(c, tx + 12, FY - 13, 4, 13, p.K);
        px(c, tx + 9, FY - 1, 10, 2, p.K);
        px(c, tx + 4, FY - 20, 3, 4, '#8c2230');
        px(c, tx + 20, FY - 19, 4, 3, '#3a3f52');
      }
      px(c, 232, 40, 4, 40, p.K);                       // the coat rack
      px(c, 226, 40, 16, 4, p.K);
      px(c, 224, 44, 10, 20, '#2a3038');
      px(c, 236, 44, 10, 16, '#3a2a2a');
      const jx = W - 62;
      px(c, jx, FY - 46, 30, 46, p.K);
      px(c, jx + 2, FY - 44, 26, 42, '#3a1c22');
      px(c, jx + 4, FY - 42, 22, 14, '#12101d');
      for (let i = 0; i < 5; i++) px(c, jx + 6 + i * 4, FY - 40, 2, 10, ['#ff6a5e', '#ffd75e', '#6ff7d8', '#ff7edb', '#7fd7ff'][i]);
      px(c, jx + 4, FY - 26, 22, 3, '#a5741f');
      px(c, jx, FY - 48, 30, 3, '#6e4c12');

      /* the grate the smell comes in through */
      archFrame(c, 250, 26, 66, 32, { grate: true });

      /* the door to the back room, where sit-downs happen */
      const dx = W - 26;
      px(c, dx, 42, 24, 64, p.K);
      px(c, dx + 2, 44, 20, 62, '#20303a');
      px(c, dx + 4, 52, 14, 18, p.K);
      px(c, dx + 6, 54, 10, 14, '#0d1418');
      px(c, dx + 18, 76, 3, 5, p.S);

      ART.dither(c, 0, 24, W, 16, 'rgba(200,200,210,.05)', 0.16, 13);
      ART.dither(c, 0, FY - 16, W, 16, 'rgba(0,0,0,.24)', 0.12, 17);
    };

    /* the counter goes in front of the cast so the barman is behind it */
    const onPaintFront = (c) => {
      c.drawImage(ART.barCounter(130, 26, seed % 17), 80, FY - 26);
      px(c, 96, FY - 30, 4, 5, '#8c2230');
      px(c, 96, FY - 31, 4, 1, '#d13b45');
      px(c, 150, FY - 29, 6, 3, '#3a3f52');
      px(c, 152, FY - 31, 1, 2, '#c9c0a8');
      px(c, 186, FY - 32, 5, 7, 'rgba(220,240,255,.35)');
    };

    const spots = [
      { id: 'stool', x: 200, w: 26, top: FY - 30, label: 'HIS STOOL',
        hint: 'NOBODY ELSE SITS THERE' },
      { id: 'till', x: 120, w: 30, top: FY - 34, label: 'THE TILL',
        hint: 'WHAT WENT THROUGH IT' },
      { id: 'coats', x: 234, w: 24, top: 40, bot: 84, label: 'THE COAT RACK',
        hint: 'GO THROUGH THE POCKETS' },
      { id: 'juke', x: W - 47, w: 30, top: FY - 48, label: 'THE JUKEBOX',
        hint: 'PUT SOMETHING ON' },
      { id: 'pour', x: 140, w: 40, top: FY - 30, label: 'THE TAPS',
        hint: 'WORK A SHIFT' },
    ];

    const actors = [
      { id: 'wit', x: 168, y: FY, key: 'barman', def: BARMAN_DEF, face: 1, still: true,
        tag: 'THE BARMAN', tagCol: PIX.PAL.N, witness: true, mood: 'hard', job: 'wipe' },
      { id: 'drunk', x: 300, y: FY, key: 'drunk', def: DRUNK_DEF, face: -1, still: true,
        tag: 'A REGULAR', tagCol: PIX.PAL.d },
    ];

    const eggs = [
      egg({ id: 'card2', x: 200, y: FY - 34, art: 'eg_card',
        label: 'A CARD ON THE BAR',
        look: 'SOMEBODY WAS PLAYING A GAME OF CARDS WITH MONSTERS ON THEM. HE LOST.' }),
    ];

    return { id: 'bar', w: W, floorY: FY, paint, onPaintFront, actors, spots, eggs,
      pets: [{ kind: 'cat', x: 300, name: 'THE BAR CAT' }],
      depth: [{ x: 250, y: 26, w: 66, h: 32 , sky: true }],
      enterX: 34, enterFace: 1,
      /* THE LAMP THE PLACE IS NAMED AFTER pools on the back bar, and the
         two over the counter pool on the counter, not on a floor six
         inches behind it where nobody can see them. */
      lights: [{ x: 142, y: 26, r: 46, a: 0.20, fy: 56 },
               { x: 150, y: 34, r: 52, a: 0.22, fy: 60 },
               { x: 300, y: 16, r: 40, a: 0.18, fy: 60 },
               { x: W - 47, y: 20, r: 34, a: 0.17, flicker: true }] };
  }

  /* ============================================================
     THE FLOORS NOBODY SHOWS YOU.

     A building is not one room. The laundry has a cellar under it
     where the canal comes in, and the broker sleeps over his own
     shop. Both are their own painted rooms with their own props in
     them, reached by the stairs on the ground floor — so the city
     is deeper than the map says it is.
     ============================================================ */

  /* under the laundry: the canal comes in here and nobody has mopped */
  function laundryCellar() {
    const W = 300, FY = 112, seed = seedFor('cellar');

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'brick', railY: 0, seed: seed % 77 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'board', seed: seed % 41 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0b0f11');
      /* THE WATER. The canal is on the other side of this wall and it knows. */
      px(c, 0, FY - 2, W, 14, 'rgba(30,70,74,.55)');
      for (let x = 2; x < W; x += 9) {
        px(c, x, FY + ((x * 7 + seed) % 5), 6, 1, 'rgba(120,200,200,.12)');
      }
      /* pipes across the ceiling, dripping */
      c.drawImage(ART.pipes(W, 12, seed % 31), 0, 12);
      px(c, 0, 30, W, 2, '#1a1f24');
      /* the boiler, big and asleep */
      ART.box(c, 30, FY - 62, 58, 62, { fill: '#3a3129', top: '#4c4034', bot: '#1d1813', ink: p.K });
      PIX.disc(c, 59, FY - 36, 17, p.K);
      PIX.disc(c, 59, FY - 36, 15, '#241d17');
      PIX.disc(c, 59, FY - 36, 8, '#5a2b12');
      PIX.disc(c, 59, FY - 36, 5, '#c96a1e');
      px(c, 44, FY - 70, 30, 9, p.K);
      px(c, 46, FY - 68, 26, 5, '#2a231c');
      ART.rivets(c, 34, FY - 58, 7, 9, p.K, '#6b5a48');
      /* the sump: a hole in the floor with a grate off it */
      px(c, 176, FY - 6, 46, 8, p.K);
      px(c, 178, FY - 5, 42, 6, '#0a0d0e');
      for (let i = 0; i < 5; i++) px(c, 180 + i * 9, FY - 5, 2, 6, '#2a3033');
      px(c, 226, FY - 8, 20, 4, '#333b3e');
      /* shelves of somebody's paperwork, gone to mould */
      ART.box(c, 236, FY - 54, 52, 54, { fill: '#4a3f2e', top: '#5e5038', bot: '#241d14', ink: p.K });
      for (let r = 0; r < 3; r++) {
        px(c, 238, FY - 46 + r * 16, 48, 2, '#2a2318');
        for (let i = 0; i < 4; i++) {
          px(c, 240 + i * 12, FY - 44 + r * 16, 9, 12, i % 2 ? '#7d7a68' : '#8d8672');
          px(c, 240 + i * 12, FY - 44 + r * 16, 9, 2, 'rgba(0,0,0,.3)');
        }
      }
      /* the steps back up, at the near end */
      for (let i = 0; i < 6; i++) {
        px(c, 4, FY - 8 - i * 9, 26 + i * 3, 9, i % 2 ? '#2a2f33' : '#232a2e');
        px(c, 4, FY - 8 - i * 9, 26 + i * 3, 1, 'rgba(255,255,255,.06)');
      }
      sheen(c, 0, FY - 2, W, 16, 0.08);
      ART.grain(c, 0, 0, W, SCENE.H, '#0d1114', '#161c20', seed % 53);
    };

    const spots = [
      { id: 'sump', x: 199, w: 46, top: FY - 14, label: 'THE SUMP',
        hint: 'THE CANAL COMES IN HERE' },
      { id: 'boiler', x: 59, w: 58, top: FY - 64, label: 'THE BOILER',
        hint: 'STILL WARM. SOMETHING IS BEHIND IT.' },
    ];

    const eggs = [
      egg({ id: 'ball2', x: 262, y: FY - 40, art: 'eg_ball',
        label: 'SOMETHING IN THE FILES',
        look: 'ANOTHER ONE OF THOSE BALLS, FILED UNDER B. SOMEBODY IS COLLECTING THEM.' }),
    ];

    return { id: 'cellar', w: W, floorY: FY, paint, spots, eggs, indoorDark: true,
      pets: [{ kind: 'cat', x: 150, name: 'A CELLAR CAT' }],
      enterX: 30, enterFace: 1,
      stairs: { to: 'laundry', x: 16, label: 'BACK UP THE STEPS', hint: 'INTO THE NOISE' },
      lights: [{ x: 100, y: 32, r: 34, a: 0.182, flicker: true },
               { x: 250, y: 32, r: 30, a: 0.130 }] };
  }

  /* over the pawn shop: where the broker actually lives */
  function pawnAbove() {
    const W = 280, FY = 106, seed = seedFor('above');

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'grey', railY: 58, seed: seed % 63 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'board', seed: seed % 37 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#12100e');
      nightWindow(c, 196, 26, 54, 46, seed % 19);
      /* a cot, slept in tonight */
      c.drawImage(ART.bed(76, 30, false), 30, FY - 30);
      /* a strongbox under it, which is the whole reason he sleeps here */
      ART.box(c, 112, FY - 20, 34, 20, { fill: '#2f3540', top: '#404858', bot: '#191d24', ink: p.K });
      px(c, 124, FY - 13, 10, 8, p.K);
      px(c, 126, FY - 11, 6, 4, '#e0a63c');
      ART.rivets(c, 115, FY - 18, 5, 7, p.K, '#7c8697');
      /* a table with his supper on it and the day's takings beside it */
      c.drawImage(ART.desk(62, 30, seed % 11), 150, FY - 30);
      px(c, 162, FY - 40, 16, 6, '#8d8672');
      px(c, 164, FY - 42, 12, 3, '#c9c0a8');
      px(c, 186, FY - 38, 14, 4, '#e0a63c');
      /* a picture of somebody, turned to the wall */
      px(c, 88, 40, 22, 26, p.K);
      px(c, 90, 42, 18, 22, '#5e5038');
      px(c, 92, 44, 14, 18, '#4a3f2e');
      /* the stairs back down, at the far end */
      for (let i = 0; i < 6; i++) {
        px(c, W - 30 - i * 3, FY - 8 - i * 9, 26 + i * 3, 9, i % 2 ? '#3a3229' : '#2f2822');
        px(c, W - 30 - i * 3, FY - 8 - i * 9, 26 + i * 3, 1, 'rgba(255,255,255,.06)');
      }
      ART.grain(c, 0, 0, W, SCENE.H, '#100e12', '#1a171e', seed % 43);
    };

    const spots = [
      { id: 'cot', x: 68, w: 76, top: FY - 34, label: 'THE COT',
        hint: 'HE SLEEPS OVER HIS OWN SHOP' },
      { id: 'strongbox', x: 129, w: 36, top: FY - 24, label: 'THE STRONGBOX',
        hint: 'WHAT HE DOES NOT PUT IN THE SAFE' },
    ];

    const eggs = [
      egg({ id: 'card3', x: 172, y: FY - 44, art: 'eg_card',
        label: 'A CARD BY HIS SUPPER',
        look: 'HE HAS BEEN READING THE BACK OF IT WHILE HE EATS. THE HOLO IS WORN OFF.' }),
    ];

    return { id: 'above', w: W, floorY: FY, paint, spots, eggs,
      pets: [{ kind: 'cat', x: 210, name: 'HIS CAT' }],
      enterX: W - 30, enterFace: -1,
      stairs: { to: 'pawn', x: W - 16, label: 'BACK DOWN', hint: 'INTO THE SHOP' },
      lights: [{ x: 170, y: 20, r: 38, a: 0.208 }] };
  }

  const BUILD = { laundry, docks, pawn, diner, bar, cellar: laundryCellar, above: pawnAbove };

  /* the extra floors, by the place they belong to */
  const FLOORS = { laundry: ['cellar'], pawn: ['above'] };

  return {
    /* a place, dressed for tonight, with the searching wired up.
       `floor` names another room in the same building — the laundry
       cellar, the room over the pawn shop — and the props there
       belong to the place you drove to, not to the floor. */
    build(id, floor) {
      /* the landmarks live in paris.js: looked up here rather than imported
         so neither file has to load before the other */
      const want = floor || id;
      const fn = BUILD[want] ||
        (typeof PARIS !== 'undefined' ? PARIS.BUILD[want] : null);
      if (!fn) return null;
      const room = fn();
      room.place = id;
      /* every prop goes through the story so clue plumbing lives in one
         place, and each one says whether it has already been turned over.
         An easter egg is not a prop and does not get searched. */
      room.spots = (room.spots || []).map(sp => {
        if (sp.egg || sp.noSearch) return sp;
        const base = sp.hint;
        return Object.assign({}, sp, {
          hint: () => (CITY.searched(id, sp.id) ? 'NOTHING LEFT HERE'
            : (STORY.lookedAt && STORY.lookedAt(id, sp.id) === 1 ? 'THE GLASS SAYS SOMETHING IS IN THERE'
              : (typeof base === 'function' ? base() : base))),
          onUse: () => STORY.search(id, sp.id),
        });
      });
      /* the eggs go in as things you can look at, and get painted in */
      if (room.eggs && room.eggs.length) {
        const inner = room.paint;
        room.paint = (c, w, h) => { inner(c, w, h); paintEggs(c, room.eggs); };
        room.spots = room.spots.concat(room.eggs);
      }
      /* and the stairs, if this building has another floor */
      if (room.stairs) {
        const st = room.stairs;
        room.spots = room.spots.concat([{
          id: 'stairs', x: st.x, w: 40, top: 24, bot: room.floorY + 4,
          noSearch: true,
          label: st.label, hint: st.hint,
          onUse: () => STORY.toFloor(st.to),
        }]);
      }
      /* the witnesses answer questions; everybody else just talks — except
         the ones with a job on them, who want something first */
      room.actors = (room.actors || []).map(a => Object.assign({}, a, {
        label: a.tag || a.label,
        hint: a.job === 'cups' ? 'TEN ON THE BALL'
          : a.job === 'sit' ? 'HE WANTS SOMEBODY TO SIT'
            : a.witness ? () => (CASE.left() > 1 ? 'ASK HIM SOMETHING' : 'HE IS DONE TALKING')
              : 'TALK',
        onUse: a.job === 'cups' ? () => STORY.cupGame(a)
          : a.job === 'sit' ? () => STORY.sitForPainter(a)
            : a.witness ? () => STORY.askWitness(id, a.id)
              : () => STORY.placeTalk(id, a.id),
      }));
      /* and the way out is the phone in your coat */
      room.spots.push({
        id: 'street', x: room.enterX === undefined ? 30 : room.enterX, w: 46, top: 30,
        label: 'THE STREET',
        hint: 'GET THE CAR',
        onUse: () => PHONE.open('map'),
      });
      return room;
    },
    has(id) { return !!BUILD[id]; },
    /* which floors a place has, for the phone and the tests */
    floorsOf(id) { return FLOORS[id] || []; },
  };
})();
