/* ============================================================
   THE PHONE.

   It is 1937 and you are carrying a slab of glass, which is the
   one thing in this game nobody in it remarks on. There is no bar
   across the top of the play area: the clock, the money, the case,
   the map, your pockets and your conscience are all in here.

     LOCK SCREEN   the hour, the date, and what came in
     HOME          a grid of apps, and a dock along the bottom
     PLAN          the city from above. Tap a stop, drive there.
     CASE          what you turned over, what it rules out, who fits.
     COAT          what is in it: tools, cargo, evidence bags.
     WORK          what you are supposed to be doing, and how far in.
     KARMA         what this city thinks of you, and why.
     JOBS          what is going on tonight that pays.

   Everything is drawn: the device, the notch, the status bar, the
   icons, the map and the type. No glyph fonts, no emoji, no
   rounded chrome, nothing small.
   ============================================================ */

const PHONE = (() => {

  /* view is 'lock', 'home', or the id of an app */
  let view = 'lock', app = 'map', tick = null;

  /* the apps, in the order they sit on the home screen. The last four are
     also the dock, because those are the four you actually use. */
  const APPGRID = [
    { id: 'map', word: 'PLAN', icon: 'ic_map', dock: true },
    { id: 'case', word: 'CASE', icon: 'ic_case', dock: true },
    { id: 'kit', word: 'COAT', icon: 'ic_bag', dock: true },
    { id: 'job', word: 'WORK', icon: 'ic_star', dock: true },
    { id: 'karma', word: 'KARMA', icon: 'ic_paw' },
    { id: 'jobs', word: 'JOBS', icon: 'ic_coin' },
  ];

  function layer() {
    let r = document.getElementById('phone-root');
    if (!r) {
      r = U.el('div');
      r.id = 'phone-root';
      r.className = 'hidden';
      document.body.appendChild(r);
    }
    return r;
  }

  /* how big everything on the screen is drawn */
  function scale() {
    return (window.innerWidth < 600 || window.innerHeight < 520) ? 2 : 3;
  }

  function line(str, k, col, sh) {
    return PIXFONT.render(str, { scale: k, color: col || '#eae4d0',
      shadow: sh === undefined ? '#0a1a12' : sh });
  }

  /* ============================================================
     THE PLAN.

     A folded paper map of Paris, kept in a coat pocket. It used to
     be a hundred and thirty random rectangles with a sine wave
     through them, which is what a city looks like if you have
     never been to one.

     What is on it now is the actual shape of the place: the Seine
     making its long westward arc with the two islands in the
     middle of it, the twenty arrondissements spiralling out from
     them, the star of twelve avenues at the Etoile, the grands
     boulevards, the parks, the hill at Montmartre with contours
     on it, and the wall round the whole thing.

     Drawn as paper — buff, grained, creased where it folds — with
     sepia ink on it, because that is what you would actually be
     holding.
     ============================================================ */
  /* TWICE THE PAPER.

     This was 220 x 140 blown up by two, which is a map at half
     resolution with the magnification turned up — every street a
     fat bar, every landmark a lozenge. Same size on screen, four
     times the pixels: a street can be three px wide with a kerb on
     it, a block can be individual buildings, and a landmark can be
     a drawing of the landmark. */
  const MW = 440, MH = 280;

  /* the paper, the ink, and the water */
  const M = {
    paper: '#e9dcbc', paperLit: '#f6eed6', paperDk: '#d6c69f',
    grain: '#dfd0ae', crease: '#c9b795',
    ink: '#6b5a3c', inkLo: '#8a7754', inkHi: '#42361f',
    block: '#ddceac', blockDk: '#c9b791', blockLit: '#efe3c4', roof: '#c2ae88',
    water: '#8fb6c8', waterLo: '#6b96ac', waterHi: '#bcd8e4',
    park: '#9aac72', parkDk: '#778b52', parkLit: '#b8c78d',
    road: '#f6efdb', roadEdge: '#bfad86',
    rail: '#9a8a6a', red: '#b8384a', gold: '#c98a2a',
  };

  /* THE SEINE, at the new scale: in from the south-east, the long
     westward arc through the middle, out to the west. */
  const SEINE = [
    [452, 236], [420, 226], [392, 212], [352, 196], [320, 180],
    [292, 168], [268, 158], [244, 154], [220, 152], [200, 154],
    [184, 158], [168, 161], [152, 161], [136, 157], [120, 149],
    [104, 141], [88, 135], [72, 132], [52, 134], [28, 140], [-8, 148],
  ];

  function polyBand(c, pts, w, col, edge) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        const x = Math.round(x0 + (x1 - x0) * t);
        const y = Math.round(y0 + (y1 - y0) * t);
        ART.px(c, x, y - Math.floor(w / 2), 1, w, col);
        if (edge) {
          ART.px(c, x, y - Math.floor(w / 2), 1, 1, edge);
          ART.px(c, x, y + Math.ceil(w / 2) - 1, 1, 1, edge);
        }
      }
    }
  }

  /* ---- the little drawings that sit on a stop ---- */
  function glyphTower(c, x, y) {
    for (let i = 0; i < 14; i++) {
      const hw = Math.max(1, Math.round(6 * Math.pow(1 - i / 14, 1.8)));
      ART.px(c, x - hw, y - 14 + i, 1, 1, M.inkHi);
      ART.px(c, x + hw, y - 14 + i, 1, 1, M.inkHi);
    }
    ART.px(c, x - 5, y - 6, 11, 1, M.inkHi);
    ART.px(c, x - 3, y - 10, 7, 1, M.inkHi);
    ART.px(c, x - 6, y, 13, 1, M.inkHi);
  }
  function glyphArch(c, x, y) {
    ART.px(c, x - 6, y - 11, 13, 11, M.inkHi);
    ART.px(c, x - 3, y - 6, 7, 6, M.paperLit);
    for (let k = -3; k <= 3; k++) {
      ART.px(c, x + k, y - 7 - Math.round(Math.cos(k / 3 * 1.4) * 2), 1, 2, M.paperLit);
    }
    ART.px(c, x - 7, y - 13, 15, 2, M.inkHi);
  }
  function glyphDome(c, x, y) {
    ART.px(c, x - 7, y - 4, 15, 5, M.inkHi);
    for (let i = 0; i < 6; i++) {
      const hw = Math.round(5 * Math.pow(1 - i * i / 36, 0.6));
      ART.px(c, x - hw, y - 5 - i, hw * 2 + 1, 1, M.inkHi);
    }
    ART.px(c, x, y - 13, 1, 3, M.inkHi);
  }

  function drawMap() {
    const key = 'phmap:' + (G.seedStr || 'CITY') + ':' + (G.weather || 'x') + ':v5';
    return ART.cached(key, () => {
      const o = ART.cv(MW, MH), c = o.c;
      const rng = U.mulberry32(U.hashSeed((G.seedStr || 'CITY') + ':map'));

      /* ---------- THE PAPER ---------- */
      ART.px(c, 0, 0, MW, MH, M.paper);
      for (let i = 0; i < 3400; i++) {
        ART.px(c, Math.floor(rng() * MW), Math.floor(rng() * MH), 1, 1,
          rng() < 0.5 ? M.grain : M.paperLit);
      }
      /* the foxing round the edges of anything kept in a pocket */
      for (let i = 0; i < 420; i++) {
        const e = Math.floor(rng() * 4);
        const x = e === 0 ? Math.floor(rng() * MW) : e === 1 ? MW - 1 - Math.floor(rng() * 16)
          : e === 2 ? Math.floor(rng() * MW) : Math.floor(rng() * 16);
        const y = e === 0 ? Math.floor(rng() * 16) : e === 1 ? Math.floor(rng() * MH)
          : e === 2 ? MH - 1 - Math.floor(rng() * 16) : Math.floor(rng() * MH);
        ART.px(c, x, y, 1 + Math.floor(rng() * 2), 1, M.paperDk);
      }

      /* ---------- THE BUILT CITY ----------
         Individual buildings, not blocks: at this resolution a block can
         have houses in it, which is the whole difference between a plan
         and a diagram. Density falls off toward the wall. */
      const cx0 = 212, cy0 = 148;
      for (let i = 0; i < 2600; i++) {
        const bw = 3 + Math.floor(rng() * 7), bh = 3 + Math.floor(rng() * 6);
        const bx = Math.floor(rng() * (MW - bw)), by = Math.floor(rng() * (MH - bh));
        const d = Math.hypot((bx - cx0) / (MW * 0.52), (by - cy0) / (MH * 0.52));
        if (rng() < d * 0.95) continue;
        const t = rng();
        ART.px(c, bx, by, bw, bh, t < 0.28 ? M.roof : t < 0.6 ? M.blockDk : M.block);
        ART.px(c, bx, by, bw, 1, M.blockLit);
        ART.px(c, bx, by + bh - 1, bw, 1, M.blockDk);
        ART.px(c, bx + bw - 1, by, 1, bh, M.blockDk);
      }

      /* ---------- THE PARKS ---------- */
      const park = (x, y, w, h, wild) => {
        ART.px(c, x, y, w, h, M.park);
        ART.px(c, x, y, w, 1, M.parkLit);
        ART.px(c, x, y + h - 1, w, 1, M.parkDk);
        for (let i = 0; i < w * h / 5; i++) {
          ART.px(c, x + Math.floor(rng() * w), y + Math.floor(rng() * h), 1, 1,
            rng() < 0.5 ? M.parkDk : M.parkLit);
        }
        if (wild) {
          for (let i = 0; i < w * h / 22; i++) {
            PIX.disc(c, x + Math.floor(rng() * w), y + Math.floor(rng() * h),
              2 + Math.floor(rng() * 2), M.parkDk);
          }
        } else {
          /* a formal garden has paths through it */
          for (let gx = x + 6; gx < x + w - 4; gx += 12) ART.px(c, gx, y + 1, 1, h - 2, M.road);
          ART.px(c, x + 1, y + Math.floor(h / 2), w - 2, 1, M.road);
        }
      };
      park(4, 92, 52, 68, true);            // the Bois, off west
      park(392, 116, 48, 60, true);         // and the other one, off east
      park(176, 124, 40, 16);               // the Tuileries, along the river
      park(168, 192, 32, 28);               // the Luxembourg
      park(344, 80, 36, 24, true);          // Buttes-Chaumont
      park(360, 148, 32, 24, true);         // Pere Lachaise
      park(76, 124, 24, 32);                // the Champ de Mars

      /* ---------- THE RIVER ---------- */
      polyBand(c, SEINE, 17, M.waterLo, M.roadEdge);
      polyBand(c, SEINE, 13, M.water, M.waterHi);
      polyBand(c, SEINE, 5, M.waterHi, null);
      /* the quays, a pale line either side of the whole length */
      polyBand(c, SEINE, 19, 'rgba(191,173,134,.5)', null);
      polyBand(c, SEINE, 17, M.waterLo, null);
      polyBand(c, SEINE, 13, M.water, M.waterHi);
      polyBand(c, SEINE, 4, M.waterHi, null);
      /* THE TWO ISLANDS, which is where this city started */
      [[206, 150, 38, 10], [252, 152, 24, 8]].forEach(([ix, iy, iw, ih]) => {
        ART.px(c, ix, iy, iw, ih, M.block);
        ART.px(c, ix, iy, iw, 1, M.blockLit);
        ART.px(c, ix, iy + ih - 1, iw, 1, M.blockDk);
        ART.px(c, ix - 1, iy + 1, 1, ih - 2, M.waterHi);
        ART.px(c, ix + iw, iy + 1, 1, ih - 2, M.waterHi);
        /* and the one church on the bigger of them */
        if (iw > 30) { ART.px(c, ix + 8, iy + 2, 8, 6, M.roof); ART.px(c, ix + 11, iy, 2, 3, M.inkHi); }
      });
      /* the bridges: a lot of them, and all of them short */
      for (let i = 0; i < SEINE.length - 1; i += 1) {
        const [bx, by] = SEINE[i];
        if (bx < 8 || bx > MW - 12) continue;
        ART.px(c, bx, by - 11, 3, 23, M.rail);
        ART.px(c, bx, by - 11, 3, 1, M.paperLit);
        ART.px(c, bx + 1, by - 10, 1, 21, 'rgba(120,106,78,.5)');
      }

      /* ---------- THE STREETS ----------
         Pale: on a printed plan the streets are the paper showing through
         and the blocks are the ink, never the other way round. */
      const road = (x, y, w, h) => {
        ART.px(c, x, y, w, h, M.road);
        ART.px(c, x, y, w, 1, '#ffffff');
        ART.px(c, x, y + h - 1, w, 1, M.roadEdge);
      };
      road(120, 132, 240, 4);              // Rivoli
      road(104, 176, 260, 4);              // Saint-Germain
      /* the grands boulevards, in a shallow arc across the right bank */
      for (let x = 112; x < 380; x++) {
        const y = Math.round(104 + Math.sin((x - 112) / 268 * Math.PI) * -18);
        ART.px(c, x, y, 1, 4, M.road);
        ART.px(c, x, y, 1, 1, '#ffffff');
        ART.px(c, x, y + 3, 1, 1, M.roadEdge);
      }
      /* the long verticals, with kerbs */
      [144, 236, 316].forEach(x => road(x, 16, 4, MH - 32));
      [192, 280].forEach(x => road(x, 156, 3, MH - 172));

      /* ---------- THE ETOILE ---------- */
      const ex = 108, ey = 80;
      for (let a = 0; a < 12; a++) {
        const th = (a / 12) * Math.PI * 2 + 0.26;
        for (let r = 6; r < 68; r++) {
          const x = Math.round(ex + Math.cos(th) * r);
          const y = Math.round(ey + Math.sin(th) * r * 0.8);
          if (x < 0 || x >= MW || y < 0 || y >= MH) break;
          ART.px(c, x, y, 2, 2, r < 52 ? M.road : M.roadEdge);
        }
      }
      PIX.disc(c, ex, ey, 9, M.road);
      PIX.disc(c, ex, ey, 7, M.paperLit);
      glyphArch(c, ex, ey + 6);
      /* the Champs-Elysees, from the star down to the gardens */
      for (let i = 0; i < 78; i++) {
        ART.px(c, ex + 8 + i, 80 + Math.round(i * 0.52), 1, 5, M.road);
        ART.px(c, ex + 8 + i, 80 + Math.round(i * 0.52), 1, 1, '#ffffff');
      }

      /* ---------- MONTMARTRE ---------- */
      for (let r = 34; r > 6; r -= 7) {
        for (let a = 0; a < 120; a++) {
          const th = (a / 120) * Math.PI * 2;
          ART.px(c, Math.round(244 + Math.cos(th) * r),
            Math.round(42 + Math.sin(th) * r * 0.62), 1, 1,
            a % 7 < 5 ? M.inkLo : M.paperDk);
        }
      }
      glyphDome(c, 244, 44);
      /* and the tower, over on the Champ de Mars */
      glyphTower(c, 88, 140);

      /* ---------- THE WALL ---------- */
      for (let a = 0; a < 520; a++) {
        const th = (a / 520) * Math.PI * 2;
        const x = Math.round(cx0 + Math.cos(th) * (MW * 0.47));
        const y = Math.round(cy0 + Math.sin(th) * (MH * 0.44));
        if (x < 2 || x >= MW - 2 || y < 2 || y >= MH - 2) continue;
        ART.px(c, x, y, 2, 2, a % 8 < 5 ? M.inkLo : M.paperDk);
      }

      /* ---------- WHAT THE WEATHER IS DOING TO THE PAPER ---------- */
      const sk = CITY.sky();
      if (sk.drops > 0.6) {
        for (let i = 0; i < 90 * sk.drops; i++) {
          PIX.disc(c, Math.floor(rng() * MW), Math.floor(rng() * MH),
            1 + Math.floor(rng() * 3), 'rgba(150,140,110,.14)');
        }
      }
      if (sk.haze) {
        for (let i = 0; i < MH; i += 4) ART.px(c, 0, i, MW, 1, 'rgba(240,232,208,.12)');
      }

      /* ---------- THE FOLDS ---------- */
      [Math.round(MW / 3), Math.round(MW * 2 / 3)].forEach(fx => {
        ART.px(c, fx, 0, 1, MH, 'rgba(160,146,112,.30)');
        ART.px(c, fx + 1, 0, 1, MH, 'rgba(255,250,232,.26)');
      });
      ART.px(c, 0, Math.round(MH / 2), MW, 1, 'rgba(160,146,112,.26)');
      ART.px(c, 0, Math.round(MH / 2) + 1, MW, 1, 'rgba(255,250,232,.22)');

      /* ---------- THE CARTOUCHE, THE ROSE AND THE SCALE ---------- */
      ART.px(c, 8, MH - 56, 132, 40, M.paperLit);
      ART.px(c, 8, MH - 56, 132, 2, '#ffffff');
      ART.px(c, 8, MH - 18, 132, 2, M.inkLo);
      ART.px(c, 8, MH - 56, 2, 40, M.inkLo);
      ART.px(c, 138, MH - 56, 2, 40, M.inkLo);
      const t1 = PIXFONT.render('PLAN DE PARIS', { scale: 2, color: M.inkHi, shadow: null });
      c.drawImage(t1, 14, MH - 51);
      const t2 = PIXFONT.render('POLICE JUDICIAIRE', { scale: 1, color: M.inkLo, shadow: null });
      c.drawImage(t2, 14, MH - 33);
      const t2b = PIXFONT.render('BRIGADE CRIMINELLE', { scale: 1, color: M.inkLo, shadow: null });
      c.drawImage(t2b, 14, MH - 25);
      /* the scale bar, over on the other side */
      const sbx = MW - 118;
      for (let i = 0; i < 5; i++) {
        ART.px(c, sbx + i * 12, MH - 30, 12, 6, i % 2 ? M.paperLit : M.inkHi);
      }
      ART.px(c, sbx, MH - 32, 60, 2, M.inkHi);
      ART.px(c, sbx, MH - 24, 60, 2, M.inkHi);
      const t3 = PIXFONT.render('1 KM', { scale: 2, color: M.inkHi, shadow: null });
      c.drawImage(t3, sbx + 66, MH - 32);
      /* the compass rose, top right */
      const rx = MW - 30, ry = 30;
      PIX.disc(c, rx, ry, 20, M.paperLit);
      for (let a = 0; a < 96; a++) {
        const th = (a / 96) * Math.PI * 2;
        ART.px(c, Math.round(rx + Math.cos(th) * 18), Math.round(ry + Math.sin(th) * 18), 1, 1, M.inkLo);
        if (a % 8 === 0) {
          ART.px(c, Math.round(rx + Math.cos(th) * 15), Math.round(ry + Math.sin(th) * 15), 2, 2, M.inkLo);
        }
      }
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy], i) => {
        for (let r = 0; r < 16; r++) {
          const wdt = Math.max(1, 5 - Math.floor(r / 4));
          ART.px(c, rx + dx * r - (dx ? 0 : Math.floor(wdt / 2)),
            ry + dy * r - (dy ? 0 : Math.floor(wdt / 2)),
            dx ? 1 : wdt, dy ? 1 : wdt, i === 0 ? M.red : M.inkHi);
        }
      });
      const tn = PIXFONT.render('N', { scale: 2, color: M.red, shadow: null });
      c.drawImage(tn, rx - 5, ry - 38);

      /* ---------- THE EDGE OF THE SHEET ---------- */
      for (let i = 0; i < 3; i++) {
        const a = (0.20 - i * 0.06).toFixed(2);
        ART.px(c, 0, i, MW, 1, 'rgba(90,78,54,' + a + ')');
        ART.px(c, 0, MH - 1 - i, MW, 1, 'rgba(90,78,54,' + a + ')');
        ART.px(c, i, 0, 1, MH, 'rgba(90,78,54,' + a + ')');
        ART.px(c, MW - 1 - i, 0, 1, MH, 'rgba(90,78,54,' + a + ')');
      }
      return o.cv;
    });
  }

  /* ============================================================
     THE ROUTES.

     Not cached: it changes every time you find something. A dashed
     line from where you are to every stop the file still wants,
     with the drive time on the longest one, so the plan answers
     "where next" and not just "where is everything".
     ============================================================ */
  function drawRoutes() {
    const o = ART.cv(MW, MH), c = o.c;
    const from = CITY.PLACES[G.place || 'precinct'];
    if (!from) return o.cv;
    const fx = Math.round(from.x / 100 * MW), fy = Math.round(from.y / 100 * MH);
    const want = (typeof CASE !== 'undefined' && CASE.stops) ? CASE.stops() : [];
    want.forEach((id) => {
      const to = CITY.PLACES[id];
      if (!to || id === from.id) return;
      const hot = !!(G.tips && G.tips[id]) && CITY.leftAt(id) > 0;
      const tx = Math.round(to.x / 100 * MW), ty = Math.round(to.y / 100 * MH);
      const n = Math.max(1, Math.round(Math.hypot(tx - fx, ty - fy)));
      for (let k = 0; k <= n; k++) {
        if ((k >> 2) % 2) continue;                 /* dashed, longer dashes */
        const t = k / n;
        const x = Math.round(fx + (tx - fx) * t);
        const y = Math.round(fy + (ty - fy) * t);
        ART.px(c, x, y, 2, 2, hot ? M.red : 'rgba(107,90,60,.55)');
        if (hot) ART.px(c, x, y + 2, 2, 1, 'rgba(255,255,255,.30)');
      }
    });
    /* and a ring round where you are standing */
    for (let a = 0; a < 60; a++) {
      const th = (a / 60) * Math.PI * 2;
      if (a % 5 >= 4) continue;
      ART.px(c, Math.round(fx + Math.cos(th) * 12), Math.round(fy + Math.sin(th) * 12), 2, 2, '#2f7f6a');
    }
    return o.cv;
  }

  /* one stop on the map: its own icon, its name, and whether it is hot */
  function pin(entry, k) {
    const p = entry.place;
    const here = CITY.at(p.id);
    const hot = !!(G.tips && G.tips[p.id]) && CITY.leftAt(p.id) > 0;
    /* A CITY BIGGER THAN THE CASE. Eleven stops, and tonight's file only
       touches seven of them: the rest are dimmed so nobody burns
       thirty-five minutes driving to the catacombs for nothing. */
    const inCase = typeof CASE === 'undefined' || CASE.stops().indexOf(p.id) >= 0;
    /* somebody at this stop is owed something, or owes you something */
    const errand = (typeof STORY !== 'undefined' && STORY.questsLive ? STORY.questsLive() : [])
      .find(x => x.q.place === p.id || (x.q.kind === 'carry' && x.q.to === p.id && x.state === 'taken'));
    /* ============================================================
       A STORY YOU CAN BREAK, AND WHETHER THE DOOR IS STILL OPEN.

       These two together are the whole shape of the afternoon: a
       name you are holding something against, the stop his story
       is set at, and how long you have got before the frog who
       could contradict him goes home.
       ============================================================ */
    const stories = (typeof CASE !== 'undefined' && CASE.alibiAt) ? CASE.alibiAt(p.id) : [];
    const provable = stories.some(o => CASE.hasLever(o.i));
    const shut = (typeof CITY.open === 'function') && !CITY.open(p.id);
    const closing = !shut && CITY.untilShut && CITY.untilShut(p.id) <= 75;
    /* A NAME PLATE ON A PIN NEAR THE EDGE HANGS OFF THE PAPER. Anchor it
       inwards instead: the plate is wider than the pin, so a stop out at
       the wall has to grow its label back toward the middle. */
    const edge = p.x >= 68 ? ' tag-left' : p.x <= 30 ? ' tag-right' : '';
    const b = U.el('button', 'map-pin' + (here ? ' here' : '') + (hot ? ' hot' : '') +
      (errand ? ' errand' : '') + (inCase ? '' : ' cold') + edge +
      (provable ? ' story' : '') + (shut ? ' shut' : closing ? ' closing' : ''));
    b.style.left = p.x + '%';
    b.style.top = p.y + '%';
    b.appendChild(SPR.clone(ART.art(p.icon || 'ic_map', k), 1));
    const tag = U.el('span', 'pin-tag');
    /* the errand mark rides INSIDE the tag: floating it over the pin put it
       on top of whatever stop happened to be drawn next door */
    if (errand) {
      tag.appendChild(SPR.clone(ART.art(errand.state === 'ready' ? 'ic_star' : 'ic_bag',
        Math.max(1, k - 1)), 1));
    }
    tag.appendChild(line(p.short, Math.max(1, k - 1), here ? '#6ff7d8' : '#eae4d0'));
    b.appendChild(tag);
    if (hot) {
      const bang = U.el('span', 'pin-bang');
      bang.appendChild(line('!', k, '#ffd75e'));
      b.appendChild(bang);
    }
    /* a story here you can take apart */
    if (provable) {
      const st = U.el('span', 'pin-story');
      st.appendChild(line('?', k, '#ff6a5e'));
      b.appendChild(st);
    }
    /* and what the clock is doing to the door */
    if (shut || closing) {
      const cl = U.el('span', 'pin-shut');
      cl.appendChild(line(shut ? 'SHUT' : CITY.untilShut(p.id) + 'M',
        Math.max(1, k - 1), shut ? '#8d8672' : '#ff9a6e', null));
      b.appendChild(cl);
    }
    b.onclick = () => {
      if (here) { SFX.tick && SFX.tick(); return; }
      PHONE.close();
      STORY.travel(p.id);
    };
    return b;
  }

  /* ---------- the screen furniture ---------- */
  /* ============================================================
     THE STATUS BAR.

     Carrier, signal, the hour, and a battery that is always about
     to matter. Drawn, like everything else, one pixel at a time.
     ============================================================ */
  function statusBar(k) {
    const bar = U.el('div', 'ph-status');
    const left = CITY.minutesLeft();
    /* HOW MUCH SHIFT IS LEFT, as a percentage. This used to add the wrap
       round midnight into the total, which was right for a night shift and
       is nonsense for a day one: it made a full battery read as twelve
       percent. The shift is simply END minus START now. */
    const total = Math.max(1, (CITY.END || 0) - (CITY.START || 0));
    const pc = U.clamp(Math.round((left / total) * 100), 0, 100);

    /* the carrier, and the signal beside it */
    const l = U.el('span', 'ph-stat');
    const sig = ART.cv(11, 8);
    for (let i = 0; i < 4; i++) {
      const h = 2 + i * 2, on = i < 3;
      ART.px(sig.c, i * 3, 8 - h, 2, h, on ? '#eae4d0' : 'rgba(234,228,208,.28)');
    }
    l.appendChild(SPR.clone(sig.cv, Math.max(1, k - 1)));
    l.appendChild(line('SURETE', Math.max(1, k - 1), '#8fb3a0', null));
    bar.appendChild(l);

    /* the hour, in the middle, because that is where it lives */
    const mid = U.el('span', 'ph-stat');
    mid.appendChild(line(CITY.hhmm(), k, left < 120 ? '#ff6a5e' : '#eae4d0', null));
    bar.appendChild(mid);

    /* and the battery, which is the night */
    const r = U.el('span', 'ph-stat');
    r.appendChild(line(pc + '%', Math.max(1, k - 1), pc < 25 ? '#ff6a5e' : '#8fb3a0', null));
    const bat = ART.cv(20, 10);
    ART.px(bat.c, 0, 1, 17, 8, '#eae4d0');
    ART.px(bat.c, 1, 2, 15, 6, '#0b1a12');
    ART.px(bat.c, 17, 4, 2, 3, '#eae4d0');
    const fill = Math.max(1, Math.round(15 * pc / 100));
    ART.px(bat.c, 1, 2, fill, 6, pc < 25 ? '#ff6a5e' : '#8ff7c8');
    r.appendChild(SPR.clone(bat.cv, Math.max(1, k - 1)));
    bar.appendChild(r);
    return bar;
  }

  /* ============================================================
     THE LOCK SCREEN.

     The hour twice the size of anything else, the date under it,
     and whatever came in while the phone was in your coat.
     ============================================================ */
  function lockScreen(k) {
    const wrap = U.el('div', 'ph-lock');
    const hour = U.el('div', 'ph-hour');
    hour.appendChild(line(CITY.hhmm(), k + 3, '#f4efe0', '#04120c'));
    wrap.appendChild(hour);
    const w = CITY.watch(), sky = CITY.sky();
    wrap.appendChild(line('NIGHT ' + (G.day || 1) + '  -  ' + w.word + '  -  ' + sky.word,
      Math.max(1, k - 1), '#8fb3a0', null));

    /* the notifications: what the night has told you so far */
    const notes = U.el('div', 'ph-notes');
    const ob = STORY.objective();
    const push = (icon, head, body2) => {
      const n = U.el('div', 'ph-note');
      n.appendChild(SPR.clone(ART.art(icon, Math.max(1, k - 1)), 1));
      const col = U.el('div', 'ph-cluecol');
      col.appendChild(line(head, Math.max(1, k - 1), '#eae4d0', null));
      UI.wrapLines(body2, 30).forEach(t => col.appendChild(line(t, 1, '#8fb3a0', null)));
      n.appendChild(col);
      notes.appendChild(n);
    };
    push(ob.icon || 'ic_star', 'LA BRIGADE', ob.line);
    const owed = (STORY.questsLive() || []).filter(x => x.state === 'ready');
    if (owed.length) push('ic_bag', owed[0].q.who, 'HE OWES YOU. GO BACK FOR IT.');
    const km = STORY.karma ? STORY.karma() : null;
    if (km && km.last) push('ic_paw', 'KARMA ' + (km.score > 0 ? '+' : '') + km.score, km.last);
    wrap.appendChild(notes);

    const go = U.el('button', 'ph-unlock');
    go.appendChild(line('SLIDE TO UNLOCK', k, '#0b1a14', null));
    go.onclick = () => { view = 'home'; SFX.tick && SFX.tick(); render(); };
    wrap.appendChild(go);
    return wrap;
  }

  /* ============================================================
     THE HOME SCREEN.

     A grid of apps with their names under them, and a dock along
     the bottom with the four you actually open.
     ============================================================ */
  function homeScreen(k) {
    const wrap = U.el('div', 'ph-home');
    const grid = U.el('div', 'ph-grid');
    APPGRID.forEach(a => {
      const b = U.el('button', 'ph-icon');
      b.appendChild(SPR.clone(ART.art(a.icon, k + 1), 1));
      b.appendChild(line(a.word, Math.max(1, k - 1), '#eae4d0', '#04120c'));
      /* a badge, when the app has something waiting in it */
      const n = badgeFor(a.id);
      if (n) {
        const bd = U.el('span', 'ph-badge');
        bd.appendChild(line(String(n), Math.max(1, k - 1), '#f4efe0', null));
        b.appendChild(bd);
      }
      b.onclick = () => { view = a.id; app = a.id; SFX.tick && SFX.tick(); render(); };
      grid.appendChild(b);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  /* how many things are waiting in each app */
  function badgeFor(id) {
    if (id === 'map') return (STORY.questsLive() || []).filter(x => x.state === 'ready').length;
    if (id === 'case') return CITY.found().length;
    if (id === 'kit') return Object.keys(G.cargo || {}).length;
    if (id === 'jobs') return (STORY.jobsOpen ? STORY.jobsOpen().length : 0);
    return 0;
  }

  /* the dock: the same four apps, always there */
  function dock(k) {
    const row = U.el('div', 'ph-dock');
    APPGRID.filter(a => a.dock).forEach(a => {
      const b = U.el('button', 'ph-tab' + (view === a.id ? ' on' : ''));
      b.appendChild(SPR.clone(ART.art(a.icon, k), 1));
      b.appendChild(line(a.word, Math.max(1, k - 1), view === a.id ? '#0b1a14' : '#8ff7c8', null));
      b.onclick = () => { view = a.id; app = a.id; SFX.tick && SFX.tick(); render(); };
      row.appendChild(b);
    });
    return row;
  }

  /* the bar at the top of an open app: back to the home screen, and a name */
  function navBar(k, title) {
    const bar = U.el('div', 'ph-nav');
    const back = U.el('button', 'ph-back');
    back.appendChild(line('<', k, '#8ff7c8', null));
    back.onclick = () => { view = 'home'; SFX.tick && SFX.tick(); render(); };
    bar.appendChild(back);
    bar.appendChild(line(title, k, '#eae4d0', null));
    const pad = U.el('span'); pad.style.minWidth = '28px';
    bar.appendChild(pad);
    return bar;
  }

  /* ============================================================
     KARMA — what this city thinks of you, and why
     ============================================================ */
  function karmaApp(k) {
    const wrap = U.el('div', 'ph-app ph-scroll');
    const km = STORY.karma();
    const head = U.el('div', 'ph-head');
    head.appendChild(line(km.word, k + 1, km.score >= 0 ? '#8ff7c8' : '#ff6a5e'));
    head.appendChild(line((km.score > 0 ? '+' : '') + km.score + '  KARMA',
      k, '#eae4d0', null));
    UI.wrapLines(km.blurb, 30).forEach(t => head.appendChild(line(t, Math.max(1, k - 1), '#8fb3a0', null)));
    wrap.appendChild(head);

    /* the bar, from bad to good, with you on it */
    const bar = ART.cv(120, 12);
    ART.px(bar.c, 0, 3, 120, 6, '#123');
    ART.px(bar.c, 0, 3, 60, 6, 'rgba(209,59,69,.35)');
    ART.px(bar.c, 60, 3, 60, 6, 'rgba(46,196,169,.35)');
    ART.px(bar.c, 59, 1, 2, 10, 'rgba(244,239,224,.5)');
    const px2 = U.clamp(60 + Math.round(km.score * 2.2), 2, 117);
    ART.px(bar.c, px2 - 2, 0, 5, 12, '#12101d');
    ART.px(bar.c, px2 - 1, 1, 3, 10, km.score >= 0 ? '#8ff7c8' : '#ff6a5e');
    wrap.appendChild(SPR.clone(bar.cv, Math.max(1, k - 1)));

    const log = U.el('div', 'ph-clues');
    const deeds = (G.karmaLog || []).slice(-7).reverse();
    if (!deeds.length) {
      const row = U.el('div', 'ph-clue');
      row.appendChild(line('NOTHING EITHER WAY, YET.', Math.max(1, k - 1), '#5f8f7f', null));
      log.appendChild(row);
    }
    deeds.forEach(d => {
      const row = U.el('div', 'ph-clue' + (d.n > 0 ? ' got' : ''));
      row.appendChild(SPR.clone(ART.art(d.n > 0 ? 'ic_paw' : 'ic_iron', Math.max(1, k - 1)), 1));
      const col = U.el('div', 'ph-cluecol');
      UI.wrapLines(d.what, 30).forEach(t => col.appendChild(line(t, Math.max(1, k - 1), '#eae4d0', null)));
      col.appendChild(line((d.n > 0 ? '+' : '') + d.n, 1, d.n > 0 ? '#6ff7d8' : '#ff6a5e', null));
      row.appendChild(col);
      log.appendChild(row);
    });
    wrap.appendChild(log);
    return wrap;
  }

  /* ============================================================
     JOBS — what is going on tonight that pays
     ============================================================ */
  function jobsApp(k) {
    const wrap = U.el('div', 'ph-app ph-scroll');
    const head = U.el('div', 'ph-head');
    head.appendChild(line('WORK GOING SPARE', k, '#eae4d0'));
    head.appendChild(line('NOBODY LIVES ON THIS SALARY', Math.max(1, k - 1), '#8fb3a0', null));
    wrap.appendChild(head);
    const list = U.el('div', 'ph-clues');
    (STORY.jobsBoard ? STORY.jobsBoard() : []).forEach(j => {
      const row = U.el('div', 'ph-clue' + (j.done ? '' : ' got'));
      row.appendChild(SPR.clone(ART.art(j.icon || 'ic_coin', Math.max(1, k - 1)), 1));
      const col = U.el('div', 'ph-cluecol');
      col.appendChild(line(j.name, Math.max(1, k - 1), j.done ? '#5f8f7f' : '#eae4d0', null));
      UI.wrapLines(j.done ? 'DONE TONIGHT' : j.where, 32)
        .forEach(t => col.appendChild(line(t, 1, j.done ? '#3f6f5f' : '#8fb3a0', null)));
      row.appendChild(col);
      list.appendChild(row);
    });
    wrap.appendChild(list);
    return wrap;
  }

  /* ---------- FROGGOMAP ---------- */
  function mapApp(k) {
    const wrap = U.el('div', 'ph-app');
    /* AT THIS RESOLUTION THE PAPER WANTS TO BE 1:1. Four times the pixels
       in the same space on screen is the whole point; blowing it up again
       would throw that straight back away. */
    const K = U.clamp(Math.floor(Math.min(window.innerWidth * 0.88 / MW,
      window.innerHeight * 0.54 / MH)), 1, 4);
    const holder = U.el('div', 'map-holder');
    holder.appendChild(SPR.clone(drawMap(), K));
    /* the routes ride on their own layer over the paper: the paper is
       cached for the whole night and the routes change every time you
       turn something over */
    const rt = SPR.clone(drawRoutes(), K);
    rt.className = 'map-route';
    holder.appendChild(rt);
    holder.style.width = (MW * K) + 'px';
    holder.style.height = (MH * K) + 'px';
    /* THE PINS SHRINK WITH THE PAPER. At the old resolution a marker had
       to be chunky to read at all; on a plan with individual buildings on
       it the same marker covers half an arrondissement. */
    CITY.board().forEach(e => holder.appendChild(pin(e, 1)));
    holder.appendChild(pin({ place: CITY.PLACES.precinct, visited: true, left: 0 }, 1));
    wrap.appendChild(holder);

    const foot = U.el('div', 'ph-foot');
    const p = CITY.here();
    foot.appendChild(line(p ? p.blurb : '', Math.max(1, k - 1), '#8fb3a0', null));
    /* WHAT IS ABOUT TO SHUT. The single most useful line on the phone:
       the frogs who know things go home, and the order the city closes in
       is the order you have to work it. */
    const soon = CITY.closingSoon ? CITY.closingSoon(120) : [];
    if (soon.length) {
      const id = soon[0], h = CITY.hours(id);
      const mins = CITY.untilShut(id);
      foot.appendChild(line((CITY.PLACES[id] ? CITY.PLACES[id].short : id)
        + ' SHUTS AT ' + Math.floor(h.shut / 60) + ':00'
        + '  -  ' + mins + ' MINUTES',
        Math.max(1, k - 1), mins < 45 ? '#ff9a6e' : '#e0c07a', null));
    }
    foot.appendChild(line('A DRIVE COSTS ' + CITY.COST.travel + ' MINUTES OF DAYLIGHT',
      Math.max(1, k - 1), '#5f8f7f', null));
    wrap.appendChild(foot);
    return wrap;
  }

  /* ---------- CASE FILE ---------- */
  function caseApp(k) {
    const wrap = U.el('div', 'ph-app ph-scroll');
    const c0 = G.case;
    if (!c0) {
      wrap.appendChild(line('NO OPEN CASE', k, '#8ff7c8'));
      wrap.appendChild(line('SEE THE CAPTAIN', Math.max(1, k - 1), '#5f8f7f', null));
      return wrap;
    }
    const head = U.el('div', 'ph-head');
    head.appendChild(line(STORY.chapter().title, k, '#eae4d0'));
    head.appendChild(line(CITY.found().length + ' OF ' + c0.clues.length + ' TURNED OVER  -  ' +
      CASE.left() + ' FACES FIT', Math.max(1, k - 1), '#8fb3a0', null));
    wrap.appendChild(head);

    /* the faces, with the ones your evidence has ruled out greyed */
    const stand = CASE.standing();
    const faces = U.el('div', 'ph-faces');
    c0.suspects.forEach((s2, i) => {
      const cell = U.el('div', 'ph-face' + (stand[i] ? '' : ' out'));
      cell.appendChild(SPR.clone(SPR.mugshot('ph:' + s2.name, s2.def, 1), Math.max(1, k - 1)));
      cell.appendChild(line(s2.name, 1, stand[i] ? '#eae4d0' : '#57585c', null));
      faces.appendChild(cell);
    });
    wrap.appendChild(faces);

    /* what you have, and what is still buried */
    const list = U.el('div', 'ph-clues');
    c0.clues.forEach(cl => {
      const row = U.el('div', 'ph-clue' + (cl.seen ? ' got' : ''));
      if (cl.seen) {
        row.appendChild(SPR.clone(ART.art('ic_case', Math.max(1, k - 1)), 1));
        const col = U.el('div', 'ph-cluecol');
        col.appendChild(line(cl.text, Math.max(1, k - 1), '#eae4d0', null));
        col.appendChild(line('RULES OUT ' + cl.cut, 1, '#ff9a6e', null));
        row.appendChild(col);
      } else {
        row.appendChild(SPR.clone(ART.art('ic_drop', Math.max(1, k - 1)), 1));
        const col = U.el('div', 'ph-cluecol');
        col.appendChild(line('STILL OUT THERE', Math.max(1, k - 1), '#5f8f7f', null));
        col.appendChild(line((G.tips && G.tips[cl.at]) || 'SOMEWHERE IN THE CITY', 1, '#3f6f5f', null));
        row.appendChild(col);
      }
      list.appendChild(row);
    });
    wrap.appendChild(list);

    /* ============================================================
       WHERE THEY SAY THEY WERE.

       The other half of the file. Every face on that wall told
       somebody where he was this afternoon, and the only way to
       settle it is to go to that stop and ask the frog who would
       have seen him — with something in your hand, if he is lying.

       Three states, and the phone says which: not checked yet,
       checked and it held, or checked and it came apart.
       ============================================================ */
    if (c0.suspects.some(s2 => s2.alibi)) {
      const ah = U.el('div', 'ph-head');
      ah.appendChild(line('WHERE THEY SAY THEY WERE', k, '#eae4d0'));
      wrap.appendChild(ah);
      const al = U.el('div', 'ph-clues');
      c0.suspects.forEach((s2, i) => {
        const a = s2.alibi;
        if (!a) return;
        const st = a.broken ? ' broke' : a.checked ? ' got' : '';
        const row = U.el('div', 'ph-alibi' + st + (stand[i] ? '' : ' out'));
        row.appendChild(SPR.clone(ART.art(a.broken ? 'ic_star'
          : a.checked ? 'ic_case' : 'ic_map', Math.max(1, k - 1)), 1));
        const col = U.el('div', 'ph-cluecol');
        col.appendChild(line(s2.name, Math.max(1, k - 1),
          a.broken ? '#ff6a5e' : stand[i] ? '#eae4d0' : '#57585c', null));
        col.appendChild(line(a.say, 1,
          a.broken ? '#ff9a6e' : a.checked ? '#8fb3a0' : '#a8977a', null));
        col.appendChild(line(
          a.broken ? 'THAT IS A LIE AND YOU CAN PROVE IT'
            : a.checked ? 'CHECKED OUT. IT WAS NOT HIM.'
            : (CASE.hasLever(i) ? 'GO AND ASK. YOU HAVE SOMETHING.'
              : 'NOBODY HAS CHECKED IT'),
          1, a.broken ? '#ffd75e' : '#6f6252', null));
        al.appendChild(row);
      });
      wrap.appendChild(al);
    }
    return wrap;
  }

  /* ---------- THE KIT ---------- */
  function kitApp(k) {
    const wrap = U.el('div', 'ph-app ph-scroll');
    const head = U.el('div', 'ph-head');
    head.appendChild(line('WHAT IS IN YOUR COAT', k, '#eae4d0'));
    head.appendChild(line((G.items || []).length + ' OF ' + E.maxItems() + ' TOOLS  -  ' +
      CITY.found().length + ' EVIDENCE BAGS', Math.max(1, k - 1), '#8fb3a0', null));
    wrap.appendChild(head);

    /* the iron you are carrying */
    const gun = E.gun();
    const gunRow = U.el('div', 'ph-kit');
    const gcell = U.el('div', 'kit-cell');
    gcell.appendChild(SPR.clone(gun && SPR.gunSprite ? SPR.gunSprite(gun.id) : ART.art('ic_badge', 2),
      Math.max(1, k - 2)));
    gcell.appendChild(line(gun ? gun.name : 'YOUR IRON', 1, '#eae4d0', null));
    gunRow.appendChild(gcell);

    /* the belt */
    (G.items || []).forEach((id, i) => {
      const it = ITEMS[id] || {};
      const cell = U.el('div', 'kit-cell');
      cell.appendChild(SPR.itemGlyphEl(id, Math.max(2, k)));
      cell.appendChild(line(it.name || id, 1, '#eae4d0', null));
      cell.appendChild(line(String(6 + i), 1, '#5f8f7f', null));
      gunRow.appendChild(cell);
    });
    if (!(G.items || []).length) {
      const cell = U.el('div', 'kit-cell empty');
      cell.appendChild(line('NOTHING ON THE BELT', 1, '#5f8f7f', null));
      gunRow.appendChild(cell);
    }
    wrap.appendChild(gunRow);

    /* SOMEBODY ELSE'S PROPERTY, in your coat, until you put it down */
    const cargo = Object.keys(G.cargo || {});
    if (cargo.length) {
      const cg = U.el('div', 'ph-clues');
      cargo.forEach(id => {
        const q = STORY.QUESTS[id] || {};
        const row = U.el('div', 'ph-clue');
        row.appendChild(SPR.clone(ART.art('ic_bag', Math.max(1, k - 1)), 1));
        const col = U.el('div', 'ph-cluecol');
        col.appendChild(line(G.cargo[id], Math.max(1, k - 1), '#eae4d0', null));
        col.appendChild(line('FOR ' + (q.who || 'SOMEBODY') + '  -  ' +
          ((CITY.PLACES[q.to] || {}).short || 'ACROSS TOWN'), 1, '#e0a63c', null));
        row.appendChild(col);
        cg.appendChild(row);
      });
      wrap.appendChild(cg);
    }

    /* the evidence you are carrying, in bags */
    const bags = U.el('div', 'ph-clues');
    const got = CITY.found();
    if (!got.length) {
      const row = U.el('div', 'ph-clue');
      row.appendChild(SPR.clone(ART.art('ic_bag', Math.max(1, k - 1)), 1));
      row.appendChild(line('NO EVIDENCE BAGS YET', Math.max(1, k - 1), '#5f8f7f', null));
      bags.appendChild(row);
    }
    got.forEach(cl => {
      const row = U.el('div', 'ph-clue got');
      /* the thing itself, not a generic tag */
      row.appendChild(SPR.clone(ART.art(cl.icon || 'ev_note', Math.max(1, k - 1)), 1));
      const col = U.el('div', 'ph-cluecol');
      col.appendChild(line(cl.text, Math.max(1, k - 1), '#eae4d0', null));
      col.appendChild(line('FROM ' + ((CITY.PLACES[cl.at] || {}).short || 'THE CITY'), 1, '#8fb3a0', null));
      row.appendChild(col);
      bags.appendChild(row);
    });
    wrap.appendChild(bags);
    return wrap;
  }

  /* ---------- THE JOB ---------- */
  function jobApp(k) {
    const wrap = U.el('div', 'ph-app ph-scroll');
    const ob = STORY.objective();

    const big = U.el('div', 'ph-obj');
    big.appendChild(SPR.clone(ART.art(ob.icon || 'ic_star', k + 1), 1));
    const col = U.el('div', 'ph-cluecol');
    col.appendChild(line('RIGHT NOW', Math.max(1, k - 1), '#e0a63c', null));
    UI.wrapLines(ob.line, 26).forEach(t => col.appendChild(line(t, k, '#eae4d0')));
    big.appendChild(col);
    wrap.appendChild(big);

    const ch = STORY.chapter();
    const head = U.el('div', 'ph-head');
    head.appendChild(line(ch.title, k, '#eae4d0'));
    UI.wrapLines(ch.obj, 30).forEach(t => head.appendChild(line(t, Math.max(1, k - 1), '#8fb3a0', null)));
    wrap.appendChild(head);

    /* the board: five pieces of him */
    const board = U.el('div', 'ph-board');
    board.appendChild(line('THE BULLFROG BOARD  ' + STORY.intelPct() + '%', Math.max(1, k - 1), '#eae4d0', null));
    const pips = U.el('div', 'ph-pips');
    INTEL_CARDS.forEach(card => {
      const pip = U.el('i', 'ph-pip' + (STORY.hasCard(card.id) ? ' got' : ''));
      pips.appendChild(pip);
    });
    board.appendChild(pips);
    wrap.appendChild(board);

    /* THE ERRANDS. What the city asked you for, and where to take it. */
    const live = STORY.questsLive();
    if (live.length) {
      const er = U.el('div', 'ph-errands');
      er.appendChild(line('ERRANDS', Math.max(1, k - 1), '#e0a63c', null));
      live.forEach(x => {
        const ready = x.state === 'ready';
        const row = U.el('div', 'ph-clue' + (ready ? ' got' : ''));
        row.appendChild(SPR.clone(ART.art(ready ? 'ic_star' : 'ic_bag', Math.max(1, k - 1)), 1));
        const col = U.el('div', 'ph-cluecol');
        col.appendChild(line(x.q.who, Math.max(1, k - 1), '#eae4d0', null));
        UI.wrapLines(ready
          ? 'DONE. GO BACK TO ' + ((CITY.PLACES[x.q.place] || {}).short || 'HIM')
          : x.q.task, 32).forEach(t => col.appendChild(line(t, 1, ready ? '#6ff7d8' : '#8fb3a0', null)));
        row.appendChild(col);
        er.appendChild(row);
      });
      wrap.appendChild(er);
    }

    /* the last few things that happened */
    const log = (G.log || []).slice(-4).reverse();
    if (log.length) {
      const lg = U.el('div', 'ph-log');
      lg.appendChild(line('THE FILE SAYS', Math.max(1, k - 1), '#5f8f7f', null));
      log.forEach(l => UI.wrapLines(l, 34).forEach(t => lg.appendChild(line(t, 1, '#8fb3a0', null))));
      wrap.appendChild(lg);
    }
    return wrap;
  }

  function render() {
    const root = layer();
    const k = scale();
    root.className = 'phone-on';
    root.innerHTML = '';

    const body = U.el('div', 'ph-body');
    /* THE NOTCH. A slab of glass with a bite out of the top of it, the
       earpiece and the camera in the bite, because that is what a phone
       looks like and nobody in 1937 is going to ask. */
    const notch = U.el('div', 'ph-notch');
    const grille = U.el('i', 'ph-ear');
    notch.appendChild(grille);
    notch.appendChild(U.el('i', 'ph-lens'));
    body.appendChild(notch);

    const screen = U.el('div', 'ph-screen');
    screen.appendChild(statusBar(k));

    if (view === 'lock') {
      screen.appendChild(lockScreen(k));
    } else if (view === 'home') {
      screen.appendChild(homeScreen(k));
      screen.appendChild(dock(k));
    } else {
      const a = APPGRID.find(x => x.id === view) || APPGRID[0];
      screen.appendChild(navBar(k, a.word));
      screen.appendChild(view === 'case' ? caseApp(k)
        : view === 'kit' ? kitApp(k)
          : view === 'job' ? jobApp(k)
            : view === 'karma' ? karmaApp(k)
              : view === 'jobs' ? jobsApp(k) : mapApp(k));
      screen.appendChild(dock(k));
    }
    body.appendChild(screen);

    /* the home bar, which is how you get out of anything */
    const keys = U.el('div', 'ph-keys');
    const homeBtn = U.el('button', 'ph-home-bar');
    homeBtn.onclick = () => {
      if (view === 'home' || view === 'lock') PHONE.close();
      else { view = 'home'; SFX.tick && SFX.tick(); render(); }
    };
    keys.appendChild(homeBtn);
    const shut = U.el('button', 'big-btn ph-shut');
    shut.appendChild(line('POCKET IT', k, '#0b1a14', null));
    shut.onclick = () => PHONE.close();
    keys.appendChild(shut);
    body.appendChild(keys);

    root.appendChild(body);
    requestAnimationFrame(() => body.classList.add('in'));
  }

  return {
    open(which) {
      if (typeof CINE !== 'undefined' && CINE.busy) return;
      if (typeof UI !== 'undefined' && !UI.isScene(G.phase)) return;
      /* asked for an app, go straight to it; asked for nothing, the lock
         screen, because that is what taking a phone out looks like */
      if (which) { app = which; view = which; }
      else if (view === 'lock' || !view) view = 'lock';
      render();
      SFX.tick && SFX.tick();
      if (tick) clearInterval(tick);
      tick = setInterval(() => {
        const r = document.getElementById('phone-root');
        if (!r || r.className !== 'phone-on') return;
        const s = r.querySelector('.ph-status');
        if (s && s.parentNode) s.parentNode.replaceChild(statusBar(scale()), s);
      }, 4000);
    },
    close() {
      if (tick) { clearInterval(tick); tick = null; }
      const r = document.getElementById('phone-root');
      if (!r) return;
      const b = r.querySelector('.ph-body');
      if (b) b.classList.add('out');
      setTimeout(() => { r.innerHTML = ''; r.className = 'hidden'; }, 160);
    },
    isOpen() {
      const r = document.getElementById('phone-root');
      return !!(r && r.className === 'phone-on');
    },
    toggle(which) { PHONE.isOpen() ? PHONE.close() : PHONE.open(which); },
    app() { return view === 'lock' || view === 'home' ? view : app; },
    /* the lock screen next time it comes out of the coat */
    lock() { view = 'lock'; },
  };
})();
