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
        hint: 'NIGHT&#39;S TAKINGS' },
    ];

    const actors = [
      { id: 'wit', x: 402, y: FY, key: 'launder', def: LAUNDER_DEF, face: -1, still: true,
        tag: 'THE LAUNDERER', tagCol: PIX.PAL.G, witness: true },
    ];

    return { id: 'laundry', w: W, floorY: FY, paint, onPaintFront, actors, spots,
      enterX: 34, enterFace: 1,
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
      /* no wall: the bay, the far bank and the sky */
      px(c, 0, 0, W, FY + 4, '#0a0f16');
      for (let i = 0; i < W; i += 7) {
        const h = 10 + ((i * 13 + seed) % 26);
        px(c, i, 44 - h, 7, h, '#0d141c');
        if ((i + seed) % 3 === 0) px(c, i + 2, 44 - h + 4, 2, 2, '#3f5568');
        if ((i + seed) % 11 === 0) px(c, i + 4, 44 - h + 9, 2, 2, '#e0c23a');
      }
      px(c, 0, 44, W, 3, '#0b1118');
      /* THE WATER. Flat black, banded, with the city broken up on it in a
         few long smears. Anything busier than this reads as television
         static rather than a canal. */
      px(c, 0, 47, W, FY - 47, '#0a1219');
      for (let y = 48; y < FY; y += 2) {
        const t = (y - 48) / (FY - 48);
        px(c, 0, y, W, 1, 'rgba(16,40,56,' + (0.55 - t * 0.35).toFixed(3) + ')');
      }
      /* the lit windows, pulled down into the water under themselves */
      const rw = U.mulberry32(seed * 13 + 5);
      for (let n = 0; n < 5; n++) {
        const rx = 10 + Math.floor(rw() * (W - 20));
        for (let y = 50; y < FY - 4; y += 4) {
          const w2 = 2 + ((y + rx) % 3);
          px(c, rx + ((y >> 2) % 2), y, w2, 1,
            'rgba(224,194,58,' + (0.16 - (y - 50) * 0.0018).toFixed(3) + ')');
        }
      }
      /* a dozen long flat streaks, and nothing else */
      for (let n = 0; n < 14; n++) {
        const sy = 52 + Math.floor(rw() * (FY - 60));
        const sx = Math.floor(rw() * (W - 60)), sw = 24 + Math.floor(rw() * 44);
        px(c, sx, sy, sw, 1, 'rgba(140,190,220,.07)');
      }
      /* the chop right under the boards */
      for (let i = 0; i < W; i += 4) {
        px(c, i, FY - 6 + ((i * 5 + seed) % 3), 3, 1, 'rgba(150,200,230,.12)');
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
      /* the lamp on it */
      px(c, W - 144, 16, 6, 5, p.K);
      px(c, W - 143, 17, 4, 3, '#ffe7a3');

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
        tag: 'THE WATCHMAN', tagCol: PIX.PAL.S, witness: true },
    ];

    return { id: 'docks', w: W, floorY: FY, paint, actors, spots, outdoor: true,
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
        hint: 'DEAD PEOPLE&#39;S THINGS' },
    ];

    const actors = [
      { id: 'wit', x: 288, y: FY, key: 'pawn', def: PAWN_DEF, face: -1, still: true,
        tag: 'THE BROKER', tagCol: PIX.PAL.Y, witness: true },
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

    return { id: 'pawn', w: W, floorY: FY, paint, onPaintFront, actors, spots,
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

      /* the street window, all down the near end */
      nightWindow(c, 8, 20, 96, 40, seed % 23);
      px(c, 6, 60, 100, 4, '#2a2f38');
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
        tag: 'THE WAITRESS', tagCol: PIX.PAL.P, witness: true },
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

    return { id: 'diner', w: W, floorY: FY, paint, onPaintFront, actors, spots,
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

      /* the back bar: bottles, the tarnished mirror, the green lamp */
      for (let i = 0; i < 14; i++) {
        const bx = 84 + i * 9, h2 = 8 + (i % 3) * 4;
        px(c, bx, 54 - h2, 5, h2, ['#2e7d5b', '#8c2230', '#a5741f', '#3f89c4'][i % 4]);
        px(c, bx, 54 - h2, 1, h2, 'rgba(255,255,255,.2)');
        px(c, bx + 1, 56 - h2, 3, 2, '#12101d');
      }
      px(c, 80, 54, 130, 3, p.K); px(c, 81, 54, 128, 1, '#6b4426');
      px(c, 80, 38, 130, 3, p.K); px(c, 81, 38, 128, 1, '#6b4426');
      px(c, 82, 40, 126, 12, '#1b2028');
      ART.dither(c, 82, 40, 126, 12, 'rgba(200,220,235,.06)', 0.2, 5);
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
        tag: 'THE BARMAN', tagCol: PIX.PAL.N, witness: true },
      { id: 'drunk', x: 300, y: FY, key: 'drunk', def: DRUNK_DEF, face: -1, still: true,
        tag: 'A REGULAR', tagCol: PIX.PAL.d },
    ];

    return { id: 'bar', w: W, floorY: FY, paint, onPaintFront, actors, spots,
      enterX: 34, enterFace: 1,
      lights: [{ x: 142, y: 26, r: 44 }, { x: 300, y: 16, r: 40, a: 0.06 },
               { x: W - 47, y: 20, r: 34, flicker: true }] };
  }

  const BUILD = { laundry, docks, pawn, diner, bar };

  return {
    /* a place, dressed for tonight, with the searching wired up */
    build(id) {
      const fn = BUILD[id];
      if (!fn) return null;
      const room = fn();
      /* every prop goes through the story so clue plumbing lives in one
         place, and each one says whether it has already been turned over */
      room.spots = (room.spots || []).map(sp => {
        const base = sp.hint;
        return Object.assign({}, sp, {
          hint: () => (CITY.searched(id, sp.id) ? 'NOTHING LEFT HERE'
            : (typeof base === 'function' ? base() : base)),
          onUse: () => STORY.search(id, sp.id),
        });
      });
      /* the witnesses answer questions; everybody else just talks */
      room.actors = (room.actors || []).map(a => Object.assign({}, a, {
        label: a.tag || a.label,
        hint: a.witness ? () => (CASE.left() > 1 ? 'ASK HIM SOMETHING' : 'HE IS DONE TALKING')
          : 'TALK',
        onUse: a.witness ? () => STORY.askWitness(id, a.id) : () => STORY.placeTalk(id, a.id),
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
  };
})();
