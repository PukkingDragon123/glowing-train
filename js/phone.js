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

  /* ---------- the drawn city ---------- */
  const MW = 148, MH = 104;

  function drawMap() {
    const key = 'phmap:' + (G.seedStr || 'CITY') + ':' + (G.weather || 'x');
    return ART.cached(key, () => {
      const o = ART.cv(MW, MH), c = o.c;
      const rng = U.mulberry32(U.hashSeed((G.seedStr || 'CITY') + ':map'));

      /* the ground: a city of blocks seen from above, wet */
      ART.px(c, 0, 0, MW, MH, '#0a0f14');
      for (let i = 0; i < 130; i++) {
        const bw = 5 + Math.floor(rng() * 15), bh = 4 + Math.floor(rng() * 13);
        const bx = Math.floor(rng() * (MW - bw)), by = Math.floor(rng() * (MH - bh));
        ART.px(c, bx, by, bw, bh, rng() < 0.35 ? '#16202a' : '#111922');
        ART.px(c, bx, by, bw, 1, 'rgba(255,255,255,.05)');
        ART.px(c, bx, by + bh - 1, bw, 1, 'rgba(0,0,0,.4)');
      }
      /* THE SEWER CANAL, which is what this city is built on */
      for (let x = 0; x < MW; x++) {
        const y = Math.round(30 + Math.sin(x * 0.055) * 11 + x * 0.26);
        ART.px(c, x, y, 1, 9, '#123a34');
        ART.px(c, x, y, 1, 1, '#1e5f52');
        ART.px(c, x, y + 8, 1, 1, '#0a201d');
        if ((x + Math.round(rng() * 3)) % 17 === 0) ART.px(c, x, y + 3, 1, 2, '#2e8f78');
      }
      /* the roads, and the lamps down them */
      const road = (x, y, w, h) => {
        ART.px(c, x, y, w, h, '#242d35');
        ART.px(c, x, y, w, 1, '#333e49');
      };
      road(0, 48, MW, 4); road(0, 80, MW, 4);
      road(34, 0, 4, MH); road(82, 0, 4, MH); road(116, 0, 4, MH);
      for (let x = 3; x < MW; x += 8) ART.px(c, x, 49, 1, 1, 'rgba(255,220,140,.55)');
      for (let y = 4; y < MH; y += 9) ART.px(c, 35, y, 1, 1, 'rgba(255,220,140,.4)');
      /* the weather over all of it */
      const s = CITY.sky();
      if (s.haze) {
        for (let i = 0; i < MH; i += 2) ART.px(c, 0, i, MW, 1, 'rgba(200,212,222,.05)');
      }
      if (s.drops > 0.6) {
        for (let i = 0; i < 70 * s.drops; i++) {
          ART.px(c, Math.floor(rng() * MW), Math.floor(rng() * MH), 1, 2, 'rgba(150,195,225,.16)');
        }
      }
      /* the screen's own edge */
      for (let i = 0; i < 3; i++) {
        const a = (0.5 - i * 0.15).toFixed(2);
        ART.px(c, 0, i, MW, 1, 'rgba(0,0,0,' + a + ')');
        ART.px(c, 0, MH - 1 - i, MW, 1, 'rgba(0,0,0,' + a + ')');
        ART.px(c, i, 0, 1, MH, 'rgba(0,0,0,' + a + ')');
        ART.px(c, MW - 1 - i, 0, 1, MH, 'rgba(0,0,0,' + a + ')');
      }
      return o.cv;
    });
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
    const b = U.el('button', 'map-pin' + (here ? ' here' : '') + (hot ? ' hot' : '') +
      (errand ? ' errand' : '') + (inCase ? '' : ' cold'));
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
    const total = CITY.START ? (24 * 60 - CITY.START) + CITY.END : 560;
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
    const K = U.clamp(Math.floor(Math.min(window.innerWidth * 0.82 / MW,
      window.innerHeight * 0.42 / MH)), 2, 6);
    const holder = U.el('div', 'map-holder');
    holder.appendChild(SPR.clone(drawMap(), K));
    holder.style.width = (MW * K) + 'px';
    holder.style.height = (MH * K) + 'px';
    CITY.board().forEach(e => holder.appendChild(pin(e, Math.max(2, k))));
    holder.appendChild(pin({ place: CITY.PLACES.precinct, visited: true, left: 0 }, Math.max(2, k)));
    wrap.appendChild(holder);

    const foot = U.el('div', 'ph-foot');
    const p = CITY.here();
    foot.appendChild(line(p ? p.blurb : '', Math.max(1, k - 1), '#8fb3a0', null));
    foot.appendChild(line('A DRIVE COSTS ' + CITY.COST.travel + ' MINUTES OF THE NIGHT',
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
