/* ============================================================
   THE FROGGOPHONE.

   A brick of a thing with a green screen. It is the only menu in
   the game and it is diegetic: you take it out of your coat, it
   tells you the time, the weather and what you know, and it is
   how you get the car.

   Two apps:
     FROGGOMAP   the city, five stops, tap one and drive there
     CASE FILE   what you have turned over and who is left

   The map itself is drawn pixel art on a canvas; the pins are
   real buttons sitting on top of it, because a drawn hotspot you
   cannot click is just a picture.
   ============================================================ */

const PHONE = (() => {

  let root = null, app = 'map', tick = null;

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

  /* ---------- the drawn city ---------- */
  const MW = 132, MH = 96;               // map, in map pixels

  function drawMap() {
    const o = ART.cv(MW, MH), c = o.c, p = PIX.PAL;
    const seed = U.hashSeed((G.seedStr || 'CITY') + ':map');
    const rng = U.mulberry32(seed);

    /* the ground: blocks of a wet city seen from above */
    ART.px(c, 0, 0, MW, MH, '#0c1116');
    for (let i = 0; i < 90; i++) {
      const bw = 6 + Math.floor(rng() * 14), bh = 5 + Math.floor(rng() * 12);
      const bx = Math.floor(rng() * (MW - bw)), by = Math.floor(rng() * (MH - bh));
      ART.px(c, bx, by, bw, bh, rng() < 0.4 ? '#151d24' : '#121a20');
      ART.px(c, bx, by, bw, 1, 'rgba(255,255,255,.04)');
    }
    /* the canal, cutting the map corner to corner */
    for (let x = 0; x < MW; x++) {
      const y = Math.round(28 + Math.sin(x * 0.06) * 10 + x * 0.28);
      ART.px(c, x, y, 1, 7, '#12303c');
      ART.px(c, x, y, 1, 1, '#1d4c5e');
    }
    /* the roads: two rings and the spokes between them */
    const road = (x, y, w, h) => {
      ART.px(c, x, y, w, h, '#232c33');
      ART.px(c, x, y, w, 1, '#2e3941');
    };
    road(0, 44, MW, 3); road(0, 74, MW, 3);
    road(30, 0, 3, MH); road(74, 0, 3, MH); road(104, 0, 3, MH);
    /* the lights on them */
    for (let x = 4; x < MW; x += 9) ART.px(c, x, 45, 1, 1, 'rgba(255,220,140,.5)');
    for (let y = 6; y < MH; y += 11) ART.px(c, 31, y, 1, 1, 'rgba(255,220,140,.4)');

    /* the weather, over the whole city */
    const s = CITY.sky();
    if (s.haze) ART.dither(c, 0, 0, MW, MH, 'rgba(190,205,215,.16)', 0.5, 7);
    if (s.drops > 0.6) {
      for (let i = 0; i < 60 * s.drops; i++) {
        ART.px(c, Math.floor(rng() * MW), Math.floor(rng() * MH), 1, 2, 'rgba(150,195,225,.18)');
      }
    }
    /* the frame the screen puts round it */
    for (let i = 0; i < 3; i++) {
      const a = 0.5 - i * 0.15;
      ART.px(c, 0, i, MW, 1, 'rgba(0,0,0,' + a + ')');
      ART.px(c, 0, MH - 1 - i, MW, 1, 'rgba(0,0,0,' + a + ')');
      ART.px(c, i, 0, 1, MH, 'rgba(0,0,0,' + a + ')');
      ART.px(c, MW - 1 - i, 0, 1, MH, 'rgba(0,0,0,' + a + ')');
    }
    return o.cv;
  }

  /* one pin: a marker, a name and how much is left there */
  function pin(entry, K) {
    const P = PIX.PAL;
    const p = entry.place;
    const b = U.el('button', 'map-pin' + (CITY.at(p.id) ? ' here' : '') +
      (entry.left > 0 && entry.visited ? ' hot' : ''));
    b.style.left = (p.x) + '%';
    b.style.top = (p.y) + '%';
    const head = U.el('i', 'pin-dot');
    b.appendChild(head);
    const tag = U.el('span', 'pin-tag');
    tag.appendChild(PIXFONT.render(p.short, { scale: 1, color: '#eae4d0', shadow: '#12101d' }));
    b.appendChild(tag);
    if (CITY.at(p.id)) {
      const you = U.el('span', 'pin-you');
      you.appendChild(PIXFONT.render('YOU', { scale: 1, color: '#6ff7d8', shadow: '#12101d' }));
      b.appendChild(you);
    }
    b.onclick = () => {
      if (CITY.at(p.id)) { SFX.bad && SFX.bad(); return; }
      PHONE.close();
      STORY.travel(p.id);
    };
    return b;
  }

  /* ---------- the screen furniture ---------- */
  function statusBar() {
    const bar = U.el('div', 'ph-status');
    const s = CITY.sky();
    const left = CITY.minutesLeft();
    bar.appendChild(PIXFONT.render(CITY.hhmm(), { scale: 2, color: '#8ff7c8', shadow: '#0a1a12' }));
    const mid = U.el('span', 'ph-mid');
    mid.appendChild(PIXFONT.render(s.word, { scale: 1, color: '#7fd7ff', shadow: '#0a1a12' }));
    mid.appendChild(PIXFONT.render(CITY.watch().word, { scale: 1, color: '#5f8f7f', shadow: '#0a1a12' }));
    bar.appendChild(mid);
    bar.appendChild(PIXFONT.render(Math.max(0, Math.round(left / 60)) + 'H LEFT',
      { scale: 1, color: left < 120 ? '#ff6a5e' : '#8ff7c8', shadow: '#0a1a12' }));
    return bar;
  }

  function tabs() {
    const row = U.el('div', 'ph-tabs');
    [['map', 'FROGGOMAP'], ['case', 'CASE FILE']].forEach(([id, word]) => {
      const b = U.el('button', 'ph-tab' + (app === id ? ' on' : ''));
      b.appendChild(PIXFONT.render(word, { scale: 2, color: app === id ? '#12101d' : '#8ff7c8', shadow: null }));
      b.onclick = () => { app = id; SFX.tick && SFX.tick(); render(); };
      row.appendChild(b);
    });
    return row;
  }

  /* ---------- FROGGOMAP ---------- */
  function mapApp() {
    const wrap = U.el('div', 'ph-app ph-map');
    const K = U.clamp(Math.floor(Math.min(window.innerWidth * 0.8 / MW,
      window.innerHeight * 0.45 / MH)), 2, 5);
    const holder = U.el('div', 'map-holder');
    const cv = SPR.clone(drawMap(), K);
    cv.className = 'pix';
    holder.appendChild(cv);
    holder.style.width = (MW * K) + 'px';
    holder.style.height = (MH * K) + 'px';
    CITY.board().forEach(entry => holder.appendChild(pin(entry, K)));
    /* the precinct is always on the map, and always home */
    holder.appendChild(pin({ place: CITY.PLACES.precinct, visited: true, left: 0 }, K));
    wrap.appendChild(holder);

    const foot = U.el('div', 'ph-foot');
    const p = CITY.here();
    foot.appendChild(PIXFONT.render(p ? p.blurb : '', { scale: 1, color: '#8fb3a0', shadow: null }));
    foot.appendChild(PIXFONT.render('A DRIVE COSTS ' + CITY.COST.travel + ' MINUTES',
      { scale: 1, color: '#5f8f7f', shadow: null }));
    wrap.appendChild(foot);
    return wrap;
  }

  /* ---------- CASE FILE ---------- */
  function caseApp() {
    const wrap = U.el('div', 'ph-app ph-case');
    const c0 = G.case;
    if (!c0) {
      wrap.appendChild(PIXFONT.render('NO OPEN CASE', { scale: 2, color: '#8ff7c8', shadow: null }));
      return wrap;
    }
    /* what the body and the scene said */
    const head = U.el('div', 'ph-row');
    head.appendChild(PIXFONT.render((G.caseName || 'THE CASE'), { scale: 2, color: '#eae4d0', shadow: '#0a1a12' }));
    head.appendChild(PIXFONT.render(CITY.found().length + ' / ' + c0.clues.length + ' TURNED OVER',
      { scale: 1, color: '#8fb3a0', shadow: null }));
    wrap.appendChild(head);

    /* the clues, and what each one rules out */
    const list = U.el('div', 'ph-clues');
    c0.clues.forEach(cl => {
      const row = U.el('div', 'ph-clue' + (cl.seen ? ' got' : ''));
      if (cl.seen) {
        row.appendChild(PIXFONT.render('* ' + cl.text, { scale: 1, color: '#eae4d0', shadow: null }));
        row.appendChild(PIXFONT.render('  RULES OUT ' + cl.cut, { scale: 1, color: '#ff9a6e', shadow: null }));
      } else {
        const where = CITY.PLACES[cl.at];
        row.appendChild(PIXFONT.render('? STILL OUT THERE', { scale: 1, color: '#5f8f7f', shadow: null }));
        row.appendChild(PIXFONT.render('  ' + ((G.tips && G.tips[cl.at]) || (where ? 'SOMEWHERE IN THE CITY' : '')),
          { scale: 1, color: '#3f6f5f', shadow: null }));
      }
      list.appendChild(row);
    });
    wrap.appendChild(list);

    /* who is left standing */
    const stand = CASE.standing();
    const faces = U.el('div', 'ph-faces');
    c0.suspects.forEach((s, i) => {
      const cell = U.el('div', 'ph-face' + (stand[i] ? '' : ' out'));
      cell.appendChild(SPR.clone(SPR.mugshot('ph:' + s.name, s.def, 1), 1));
      cell.appendChild(PIXFONT.render(s.name, { scale: 1, color: stand[i] ? '#eae4d0' : '#5a5a5a', shadow: null }));
      faces.appendChild(cell);
    });
    wrap.appendChild(faces);

    const foot = U.el('div', 'ph-foot');
    const n = stand.filter(Boolean).length;
    foot.appendChild(PIXFONT.render(n > 1 ? n + ' FACES STILL FIT' : 'ONE FACE LEFT. GO AND SAY IT.',
      { scale: 2, color: n > 1 ? '#8fb3a0' : '#6ff7d8', shadow: null }));
    wrap.appendChild(foot);
    return wrap;
  }

  function render() {
    root = layer();
    root.className = 'phone-on';
    root.innerHTML = '';
    const body = U.el('div', 'ph-body');
    /* the earpiece grille and the aerial, so it reads as a phone */
    body.appendChild(U.el('i', 'ph-aerial'));
    const screen = U.el('div', 'ph-screen');
    screen.appendChild(statusBar());
    screen.appendChild(tabs());
    screen.appendChild(app === 'case' ? caseApp() : mapApp());
    body.appendChild(screen);

    const keys = U.el('div', 'ph-keys');
    const shut = U.el('button', 'pixbtn ph-shut');
    shut.appendChild(PIXFONT.render('POCKET IT', { scale: 2, shadow: null, color: PIX.PAL.K }));
    shut.onclick = () => PHONE.close();
    keys.appendChild(shut);
    body.appendChild(keys);
    root.appendChild(body);
    requestAnimationFrame(() => body.classList.add('in'));
  }

  return {
    open(which) {
      /* DUEL.busy is about the table, not about the game: gate on where you
         actually are instead, or the phone never comes out of the coat */
      if (typeof CINE !== 'undefined' && CINE.busy) return;
      if (typeof UI !== 'undefined' && !UI.isScene(G.phase)) return;
      app = which || app || 'map';
      render();
      SFX.tick && SFX.tick();
      /* the clock keeps ticking on the screen while it is open */
      if (tick) clearInterval(tick);
      tick = setInterval(() => {
        const s = document.querySelector('#phone-root .ph-status');
        if (s && s.parentNode) s.parentNode.replaceChild(statusBar(), s);
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
  };
})();
