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
  const MW = 220, MH = 140;

  /* the paper, the ink, and the water */
  const M = {
    paper: '#e9dcbc', paperLit: '#f4ead0', paperDk: '#d8c8a4',
    grain: '#dfd0ae', crease: '#c9b795',
    ink: '#6b5a3c', inkLo: '#8a7754', inkHi: '#4a3d28',
    block: '#ddceac', blockDk: '#cdbc98', roof: '#c2ae88',
    water: '#8fb6c8', waterLo: '#6f9aae', waterHi: '#b3d2df',
    park: '#9aac72', parkDk: '#7d9058', parkLit: '#b4c489',
    road: '#f2e8ce', roadEdge: '#c4b28c',
    rail: '#9a8a6a', red: '#b8384a', gold: '#c98a2a',
  };

  /* THE SEINE. Sampled off the real thing: in from the south-east,
     the big westward arc through the middle, out to the west. x,y in
     map units, and the width of the river at that point. */
  const SEINE = [
    [222, 118], [204, 112], [188, 104], [172, 96], [158, 88],
    [146, 82], [134, 78], [122, 76], [110, 76], [100, 77],
    [92, 79], [84, 80], [76, 80], [68, 78], [60, 74],
    [52, 70], [44, 67], [36, 66], [26, 67], [14, 70], [-4, 74],
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

  function drawMap() {
    const key = 'phmap:' + (G.seedStr || 'CITY') + ':' + (G.weather || 'x') + ':v3';
    return ART.cached(key, () => {
      const o = ART.cv(MW, MH), c = o.c;
      const rng = U.mulberry32(U.hashSeed((G.seedStr || 'CITY') + ':map'));

      /* ---------- THE PAPER ---------- */
      ART.px(c, 0, 0, MW, MH, M.paper);
      for (let i = 0; i < 900; i++) {
        ART.px(c, Math.floor(rng() * MW), Math.floor(rng() * MH), 1, 1,
          rng() < 0.5 ? M.grain : M.paperLit);
      }
      /* the foxing round the edges of anything kept in a pocket */
      for (let i = 0; i < 120; i++) {
        const e = Math.floor(rng() * 4);
        const x = e === 0 ? Math.floor(rng() * MW) : e === 1 ? MW - 1 - Math.floor(rng() * 9)
          : e === 2 ? Math.floor(rng() * MW) : Math.floor(rng() * 9);
        const y = e === 0 ? Math.floor(rng() * 9) : e === 1 ? Math.floor(rng() * MH)
          : e === 2 ? MH - 1 - Math.floor(rng() * 9) : Math.floor(rng() * MH);
        ART.px(c, x, y, 1 + Math.floor(rng() * 2), 1, M.paperDk);
      }

      /* ---------- THE BUILT CITY ----------
         Blocks, denser toward the middle, with the grain of the street
         running through them. Nothing random about the density: a plan
         of Paris is solid in the centre and breaks up at the wall. */
      const cx0 = 106, cy0 = 74;
      for (let i = 0; i < 520; i++) {
        const bw = 3 + Math.floor(rng() * 9), bh = 3 + Math.floor(rng() * 7);
        const bx = Math.floor(rng() * (MW - bw)), by = Math.floor(rng() * (MH - bh));
        /* how far out of town this is, 0 at the islands and 1 at the wall */
        const d = Math.hypot((bx - cx0) / (MW * 0.52), (by - cy0) / (MH * 0.52));
        if (rng() < d * 0.95) continue;
        ART.px(c, bx, by, bw, bh, rng() < 0.34 ? M.roof : M.block);
        ART.px(c, bx, by, bw, 1, M.paperLit);
        ART.px(c, bx, by + bh - 1, bw, 1, M.blockDk);
      }

      /* ---------- THE PARKS ---------- */
      const park = (x, y, w, h, wild) => {
        ART.px(c, x, y, w, h, M.park);
        ART.px(c, x, y, w, 1, M.parkLit);
        ART.px(c, x, y + h - 1, w, 1, M.parkDk);
        for (let i = 0; i < w * h / 7; i++) {
          ART.px(c, x + Math.floor(rng() * w), y + Math.floor(rng() * h), 1, 1,
            rng() < 0.5 ? M.parkDk : M.parkLit);
        }
        if (wild) {                     /* the two woods get real canopy */
          for (let i = 0; i < w * h / 14; i++) {
            PIX.disc(c, x + Math.floor(rng() * w), y + Math.floor(rng() * h), 2, M.parkDk);
          }
        }
      };
      park(2, 46, 26, 34, true);          // the Bois, off west
      park(196, 58, 24, 30, true);        // and the other one, off east
      park(88, 62, 20, 8);                // the Tuileries, along the river
      park(84, 96, 16, 14);               // the Luxembourg
      park(172, 40, 18, 12);              // Buttes-Chaumont
      park(180, 74, 16, 12);              // Pere Lachaise
      /* the Champ de Mars, which is where the tower is */
      park(38, 62, 12, 16);

      /* ---------- THE RIVER ----------
         Quays first, then the water inside them, so the water has banks. */
      polyBand(c, SEINE, 9, M.waterLo, M.roadEdge);
      polyBand(c, SEINE, 7, M.water, M.waterHi);
      polyBand(c, SEINE, 3, M.waterHi, null);
      /* THE TWO ISLANDS, which is where this city started */
      [[104, 76, 18, 5], [126, 77, 11, 4]].forEach(([ix, iy, iw, ih]) => {
        ART.px(c, ix, iy, iw, ih, M.block);
        ART.px(c, ix, iy, iw, 1, M.paperLit);
        ART.px(c, ix, iy + ih - 1, iw, 1, M.blockDk);
        ART.px(c, ix - 1, iy + 1, 1, ih - 2, M.waterHi);
        ART.px(c, ix + iw, iy + 1, 1, ih - 2, M.waterHi);
      });
      /* the bridges: a lot of them, and all of them short */
      for (let i = 0; i < SEINE.length - 1; i += 2) {
        const [bx, by] = SEINE[i];
        if (bx < 4 || bx > MW - 6) continue;
        ART.px(c, bx, by - 6, 2, 13, M.rail);
        ART.px(c, bx, by - 6, 2, 1, M.paperLit);
      }

      /* ---------- THE STREETS ----------
         A road here is PALE: on a printed plan the streets are the paper
         showing through and the blocks are the ink, not the other way
         round. Drawing them dark is what made the old map read as a
         circuit board. */
      const road = (x, y, w, h) => {
        ART.px(c, x, y, w, h, M.road);
        ART.px(c, x, y, w, 1, '#ffffff');
        if (h > 1) ART.px(c, x, y + h - 1, w, 1, M.roadEdge);
        else ART.px(c, x, y + 1, w, 1, M.roadEdge);
      };
      /* Rivoli and Saint-Germain, either side of the water */
      road(60, 66, 120, 2);
      road(52, 88, 130, 2);
      /* the grands boulevards, in a shallow arc across the right bank */
      for (let x = 56; x < 190; x++) {
        const y = Math.round(52 + Math.sin((x - 56) / 134 * Math.PI) * -9);
        ART.px(c, x, y, 1, 2, M.road);
        ART.px(c, x, y, 1, 1, '#ffffff');
      }
      /* the long verticals */
      [72, 118, 158].forEach(x => road(x, 8, 2, MH - 16));
      [96, 140].forEach(x => road(x, 78, 2, MH - 86));

      /* ---------- THE ETOILE ----------
         Twelve avenues out of one point, which is the single most
         recognisable piece of street plan in the world. */
      const ex = 54, ey = 40;
      for (let a = 0; a < 12; a++) {
        const th = (a / 12) * Math.PI * 2 + 0.26;
        for (let r = 3; r < 34; r++) {
          const x = Math.round(ex + Math.cos(th) * r);
          const y = Math.round(ey + Math.sin(th) * r * 0.8);
          if (x < 0 || x >= MW || y < 0 || y >= MH) break;
          ART.px(c, x, y, 1, 1, r < 26 ? M.road : M.roadEdge);
        }
      }
      PIX.disc(c, ex, ey, 4, M.road);
      PIX.disc(c, ex, ey, 3, M.paperLit);
      PIX.disc(c, ex, ey, 1, M.ink);
      /* the Champs-Elysees, from the star down to the gardens */
      for (let i = 0; i < 40; i++) {
        ART.px(c, ex + 4 + i, 40 + Math.round(i * 0.52), 1, 3, M.road);
        ART.px(c, ex + 4 + i, 40 + Math.round(i * 0.52), 1, 1, '#ffffff');
      }

      /* ---------- MONTMARTRE ----------
         The one piece of relief in the city, so it gets contours. */
      for (let r = 16; r > 3; r -= 4) {
        for (let a = 0; a < 64; a++) {
          const th = (a / 64) * Math.PI * 2;
          ART.px(c, Math.round(122 + Math.cos(th) * r),
            Math.round(20 + Math.sin(th) * r * 0.62), 1, 1, M.inkLo);
        }
      }
      ART.px(c, 120, 17, 5, 2, M.paperLit);
      ART.px(c, 121, 15, 3, 2, M.paperLit);

      /* ---------- THE WALL ----------
         The old fortifications, coming down all through the thirties and
         still what everybody means by the edge of Paris. */
      for (let a = 0; a < 260; a++) {
        const th = (a / 260) * Math.PI * 2;
        const x = Math.round(cx0 + Math.cos(th) * (MW * 0.47));
        const y = Math.round(cy0 + Math.sin(th) * (MH * 0.44));
        if (x < 1 || x >= MW - 1 || y < 1 || y >= MH - 1) continue;
        ART.px(c, x, y, 1, 1, a % 6 < 4 ? M.inkLo : M.paperDk);
      }

      /* ---------- WHAT THE WEATHER IS DOING TO THE PAPER ---------- */
      const sk = CITY.sky();
      if (sk.drops > 0.6) {
        for (let i = 0; i < 40 * sk.drops; i++) {
          const x = Math.floor(rng() * MW), y = Math.floor(rng() * MH);
          PIX.disc(c, x, y, 1 + Math.floor(rng() * 2), 'rgba(150,140,110,.16)');
        }
      }
      if (sk.haze) {
        for (let i = 0; i < MH; i += 3) ART.px(c, 0, i, MW, 1, 'rgba(240,232,208,.14)');
      }

      /* ---------- THE FOLDS ----------
         Two verticals and one horizontal, which is how a map this size
         goes into a coat. */
      [Math.round(MW / 3), Math.round(MW * 2 / 3)].forEach(fx => {
        ART.px(c, fx, 0, 1, MH, 'rgba(160,146,112,.34)');
        ART.px(c, fx + 1, 0, 1, MH, 'rgba(255,250,232,.30)');
      });
      ART.px(c, 0, Math.round(MH / 2), MW, 1, 'rgba(160,146,112,.30)');
      ART.px(c, 0, Math.round(MH / 2) + 1, MW, 1, 'rgba(255,250,232,.26)');

      /* ---------- THE CARTOUCHE, THE ROSE AND THE SCALE ---------- */
      /* the title, bottom left, on its own panel */
      ART.px(c, 4, MH - 27, 62, 18, M.paperLit);
      ART.px(c, 4, MH - 27, 62, 1, '#ffffff');
      ART.px(c, 4, MH - 10, 62, 1, M.inkLo);
      ART.px(c, 4, MH - 27, 1, 18, M.inkLo);
      ART.px(c, 65, MH - 27, 1, 18, M.inkLo);
      const t1 = PIXFONT.render('PLAN DE PARIS', { scale: 1, color: M.inkHi, shadow: null });
      c.drawImage(t1, 7, MH - 24);
      const t2 = PIXFONT.render('JUDICIAIRE', { scale: 1, color: M.inkLo, shadow: null });
      c.drawImage(t2, 7, MH - 16);
      /* the scale bar, over on the other side so it is not sharing rows
         with the title — the first pass had them printed on top of
         each other and it read as a smudge */
      const sbx = MW - 54;
      for (let i = 0; i < 5; i++) {
        ART.px(c, sbx + i * 6, MH - 14, 6, 3, i % 2 ? M.paperLit : M.inkHi);
      }
      ART.px(c, sbx, MH - 15, 30, 1, M.inkHi);
      ART.px(c, sbx, MH - 11, 30, 1, M.inkHi);
      const t3 = PIXFONT.render('1 KM', { scale: 1, color: M.inkHi, shadow: null });
      c.drawImage(t3, sbx + 33, MH - 15);
      /* the compass rose, top right */
      const rx = MW - 16, ry = 15;
      PIX.disc(c, rx, ry, 10, M.paperLit);
      for (let a = 0; a < 48; a++) {
        const th = (a / 48) * Math.PI * 2;
        ART.px(c, Math.round(rx + Math.cos(th) * 9), Math.round(ry + Math.sin(th) * 9), 1, 1, M.inkLo);
      }
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy], i) => {
        for (let r = 0; r < 8; r++) {
          const wdt = Math.max(1, 3 - Math.floor(r / 3));
          ART.px(c, rx + dx * r - (dx ? 0 : Math.floor(wdt / 2)),
            ry + dy * r - (dy ? 0 : Math.floor(wdt / 2)),
            dx ? 1 : wdt, dy ? 1 : wdt, i === 0 ? M.red : M.inkHi);
        }
      });
      const tn = PIXFONT.render('N', { scale: 1, color: M.red, shadow: null });
      c.drawImage(tn, rx - 2, ry - 19);

      /* ---------- THE EDGE OF THE SHEET ---------- */
      for (let i = 0; i < 2; i++) {
        const a = (0.22 - i * 0.10).toFixed(2);
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
        if ((k >> 1) % 2) continue;                 /* dashed */
        const t = k / n;
        const x = Math.round(fx + (tx - fx) * t);
        const y = Math.round(fy + (ty - fy) * t);
        ART.px(c, x, y, 1, 1, hot ? M.red : 'rgba(107,90,60,.55)');
        if (hot) ART.px(c, x, y + 1, 1, 1, 'rgba(255,255,255,.35)');
      }
    });
    /* and a ring round where you are standing */
    for (let a = 0; a < 30; a++) {
      const th = (a / 30) * Math.PI * 2;
      ART.px(c, Math.round(fx + Math.cos(th) * 6), Math.round(fy + Math.sin(th) * 6), 1, 1,
        a % 4 < 3 ? '#2f7f6a' : 'rgba(0,0,0,0)');
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
    /* A NAME PLATE ON A PIN NEAR THE EDGE HANGS OFF THE PAPER. Anchor it
       inwards instead: the plate is wider than the pin, so a stop out at
       the wall has to grow its label back toward the middle. */
    const edge = p.x >= 68 ? ' tag-left' : p.x <= 30 ? ' tag-right' : '';
    const b = U.el('button', 'map-pin' + (here ? ' here' : '') + (hot ? ' hot' : '') +
      (errand ? ' errand' : '') + (inCase ? '' : ' cold') + edge);
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
    const K = U.clamp(Math.floor(Math.min(window.innerWidth * 0.86 / MW,
      window.innerHeight * 0.50 / MH)), 1, 6);
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
    CITY.board().forEach(e => holder.appendChild(pin(e, Math.max(2, k))));
    holder.appendChild(pin({ place: CITY.PLACES.precinct, visited: true, left: 0 }, Math.max(2, k)));
    wrap.appendChild(holder);

    const foot = U.el('div', 'ph-foot');
    const p = CITY.here();
    foot.appendChild(line(p ? p.blurb : '', Math.max(1, k - 1), '#8fb3a0', null));
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
