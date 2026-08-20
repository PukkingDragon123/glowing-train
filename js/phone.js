/* ============================================================
   THE FROGGOPHONE.

   A brick with a green screen, and the only interface in the game.
   There is no bar across the top of the play area any more: the
   clock, the money, the case, the map and your pockets are all in
   here, behind four icons.

     FROGGOMAP   the city from above. Tap a stop, drive there.
     CASE FILE   what you turned over, what it rules out, who fits.
     THE KIT     what is in your coat: tools, and the evidence bags.
     THE JOB     what you are supposed to be doing, and how far in.

   Everything is drawn: the map, the icons, the frame, the type. No
   glyph fonts, no emoji, no rounded chrome, nothing small.
   ============================================================ */

const PHONE = (() => {

  let app = 'map', tick = null;

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
    /* somebody at this stop is owed something, or owes you something */
    const errand = (typeof STORY !== 'undefined' && STORY.questsLive ? STORY.questsLive() : [])
      .find(x => x.q.place === p.id || (x.q.kind === 'carry' && x.q.to === p.id && x.state === 'taken'));
    const b = U.el('button', 'map-pin' + (here ? ' here' : '') + (hot ? ' hot' : '') +
      (errand ? ' errand' : ''));
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
  function statusBar(k) {
    const bar = U.el('div', 'ph-status');
    const s = CITY.sky();
    const left = CITY.minutesLeft();

    const t = U.el('span', 'ph-stat');
    t.appendChild(SPR.clone(ART.art('ic_clock', k - 1), 1));
    t.appendChild(line(CITY.hhmm(), k, left < 120 ? '#ff6a5e' : '#8ff7c8'));
    bar.appendChild(t);

    const mid = U.el('span', 'ph-stat col');
    mid.appendChild(line(s.word, Math.max(1, k - 1), '#7fd7ff'));
    mid.appendChild(line(Math.max(0, Math.round(left / 60)) + 'H OF SHIFT LEFT',
      Math.max(1, k - 2), '#5f8f7f'));
    bar.appendChild(mid);

    const m = U.el('span', 'ph-stat');
    m.appendChild(SPR.clone(ART.art('ic_coin', k - 1), 1));
    m.appendChild(line(String(G.chips), k, '#ffd75e'));
    bar.appendChild(m);
    return bar;
  }

  const APPS = [
    ['map', 'MAP', 'ic_map'],
    ['case', 'CASE', 'ic_case'],
    ['kit', 'KIT', 'ic_bag'],
    ['job', 'JOB', 'ic_star'],
  ];

  function tabs(k) {
    const row = U.el('div', 'ph-tabs');
    APPS.forEach(([id, word, icon]) => {
      const b = U.el('button', 'ph-tab' + (app === id ? ' on' : ''));
      b.appendChild(SPR.clone(ART.art(icon, k), 1));
      b.appendChild(line(word, Math.max(1, k - 1), app === id ? '#0b1a14' : '#8ff7c8', null));
      b.onclick = () => { app = id; SFX.tick && SFX.tick(); render(); };
      row.appendChild(b);
    });
    return row;
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
      row.appendChild(SPR.clone(ART.art('ic_case', Math.max(1, k - 1)), 1));
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
    body.appendChild(U.el('i', 'ph-aerial'));
    /* the earpiece grille, so the brick reads as a phone */
    const top = U.el('div', 'ph-grille');
    for (let i = 0; i < 7; i++) top.appendChild(U.el('i'));
    body.appendChild(top);

    const screen = U.el('div', 'ph-screen');
    screen.appendChild(statusBar(k));
    screen.appendChild(tabs(k));
    screen.appendChild(app === 'case' ? caseApp(k)
      : app === 'kit' ? kitApp(k)
        : app === 'job' ? jobApp(k) : mapApp(k));
    body.appendChild(screen);

    const keys = U.el('div', 'ph-keys');
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
      app = which || app || 'map';
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
    app() { return app; },
  };
})();
