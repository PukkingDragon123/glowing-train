'use strict';
/* ============================================================
   SHELL & DEBT — ui.js
   Screens & chrome: title, the duel frame (strip, cards,
   controls), overlays, the story HUD, the rooms you walk around
   in, end screens, tooltips, help, keybinds.
   Mostly wordless: icons + pixel numerals, hover for truth.
   ============================================================ */

/* item cards: brass chassis, belt-tag punch holes */
SPR.itemCard = function (id) {
  return SPR.cached('icard_' + id, () => {
    const it = ITEMS[id], P = PIX.PAL;
    const rc = ITEM_RAR[it.rarity] || ITEM_RAR.common;
    const W = 22, H = 28;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    PIX.rect(ctx, 1, 0, W - 2, H, P.K); PIX.rect(ctx, 0, 1, W, H - 2, P.K);
    PIX.rect(ctx, 2, 1, W - 4, H - 2, P.b);
    PIX.rect(ctx, 1, 2, W - 2, H - 4, P.b);
    PIX.rect(ctx, 3, 3, W - 6, H - 6, P[rc[1]]);
    PIX.rect(ctx, 3, 3, W - 6, 1, P.k);
    for (let y = 5; y < H - 5; y += 2) PIX.rect(ctx, 4, y, W - 8, 1, 'rgba(0,0,0,.18)');
    PIX.rect(ctx, 4, 4, 2, 2, P.u); PIX.rect(ctx, W - 6, 4, 2, 2, P.u);   // punch holes
    const rows = (it.glyph || []).filter(r => r && r.length);
    const gw = Math.max.apply(null, rows.map(r => r.length).concat([1]));
    const ox = Math.floor((W - gw) / 2), oy = Math.floor((H - 6 - rows.length) / 2) + 1;
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c !== '.' && c !== ' ') { ctx.fillStyle = P[c] || P.W; ctx.fillRect(ox + i, oy + j, 1, 1); }
      }
    });
    PIX.rect(ctx, 3, H - 5, W - 6, 2, P.u);                               // brass tag foot
    PIX.rect(ctx, W / 2 - 2, H - 5, 4, 2, P[rc[0]]);
    return cv;
  });
};
SPR.itemCardEl = function (id, scale, cls) { return SPR.clone(SPR.itemCard(id), scale, cls); };

/* just the glyph off an item card — the tool rack wants the tool, not its card */
SPR.itemGlyph = function (id) {
  return SPR.cached('iglyph_' + id, () => {
    const P = PIX.PAL;
    const rows = ((ITEMS[id] || {}).glyph || []).filter(r => r && r.length);
    const w = Math.max.apply(null, rows.map(r => r.length).concat([1]));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = Math.max(1, rows.length);
    const ctx = cv.getContext('2d');
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c !== '.' && c !== ' ') { ctx.fillStyle = P[c] || P.W; ctx.fillRect(i, j, 1, 1); }
      }
    });
    return cv;
  });
};
SPR.itemGlyphEl = function (id, scale, cls) { return SPR.clone(SPR.itemGlyph(id), scale, cls); };

const UI = {

  /* ================= router ================= */

  render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    document.body.classList.toggle('at-corpse', G.phase === 'loot');
    document.body.classList.toggle('in-scene', UI.isScene(G.phase));
    UI.closeModal();
    if (G.phase !== 'duel' && G.phase !== 'loot') DUEL.stop();
    if (!UI.isScene(G.phase)) SCENE.close();
    switch (G.phase) {
      case 'title':      UI.buildTitle(app); break;
      case 'precinct':   UI.buildRoom(app, ROOMS.precinct()); break;
      case 'board':      UI.buildRoom(app, ROOMS.boardRoom()); break;
      case 'ward':       UI.buildRoom(app, ROOMS.ward()); break;
      case 'blind':      UI.buildRoom(app, ROOMS.lineup()); break;
      case 'place':      UI.buildRoom(app, PLACES.build(G.place) || ROOMS.precinct()); break;
      case 'duel':
      case 'loot':       UI.buildDuel(app); DUEL.enter(); break;
      case 'ending':     UI.buildEnding(app); break;
      case 'over':       UI.buildEnd(app, false); break;
      case 'won':        UI.buildEnd(app, true); break;
    }
    if (typeof TUTOR !== 'undefined' && TUTOR.armed()) setTimeout(() => TUTOR.check(), 260);
  },

  isScene(ph) {
    return ph === 'precinct' || ph === 'board' || ph === 'ward' ||
      ph === 'blind' || ph === 'place';
  },

  /* a room you walk around in: the story HUD, then the scene */
  buildRoom(app, room) {
    const bar = U.el('div'); UI.buildTopbar(bar); app.appendChild(bar);
    const host = U.el('div'); host.id = 'scene-root'; host.className = 'scene-root';
    app.appendChild(host);
    SCENE.open(room);
  },

  /* Every screen change goes behind the card-rack wipe. fn does whatever
     moves the game on; the render happens while the rack is shut, so the
     player never sees a screen assemble itself. */
  goto(fn, opts) {
    /* a second press while the rack is shut must not advance twice */
    if (CINE.busy) return Promise.resolve();
    return CINE.transition(() => { if (fn) fn(); UI.render(); }, opts);
  },

  /* small builders */
  txt(str, opts) { return PIXFONT.render(str, Object.assign({ scale: 3, shadow: PIX.PAL.K }, opts)); },
  num(n, opts) { return UI.txt(U.fmt(Math.round(n)), opts); },
  /* PIXFONT renders one canvas per string, so a long line has to be broken
     into lines before it is drawn or it just runs off whatever holds it */
  wrap(str, per, opts) {
    const box = U.el('div', 'txt-lines');
    let line = '';
    const push = () => { if (line) box.appendChild(UI.txt(line, opts)); line = ''; };
    str.split(' ').forEach(w => {
      if (line && (line + ' ' + w).length > per) push();
      line = line ? line + ' ' + w : w;
    });
    push();
    return box;
  },
  put(holder, canvas) { if (!holder) return; holder.innerHTML = ''; holder.appendChild(canvas); },
  icon(name, scale, tipKey, tipVal) {
    const w = U.el('span', 'picon' + (tipKey ? ' has-tip' : ''));
    if (tipKey) w.dataset[tipKey] = tipVal || '1';
    w.appendChild(PIX.el(name, scale));
    return w;
  },

  /* ================= topbar ================= */

  buildTopbar(bar) {
    bar.id = 'topbar';
    const L = U.el('div', 'tb-side'), C = U.el('div', 'tb-side'), R = U.el('div', 'tb-side');

    const logo = U.el('span', 'has-tip');
    logo.dataset.tipText = 'SHELL & DEBT - case ' + G.seedStr;
    logo.appendChild(UI.txt('S&D', { scale: 3, color: PIX.PAL.g }));
    L.appendChild(logo);

    /* THE NIGHT. The hour, and what the sky is doing — both of them are
       real: the clock is the budget and the weather is a modifier. */
    if (typeof CITY !== 'undefined' && G.phase !== 'title') {
      const sky = CITY.sky();
      const nite = U.el('span', 'tb-chip has-tip tb-clock');
      nite.id = 'tb-clock';
      nite.dataset.tipText = CITY.watch().word + ' - ' + sky.word + ' - ' +
        Math.max(0, Math.round(CITY.minutesLeft() / 60)) + ' HOURS OF SHIFT LEFT';
      nite.appendChild(UI.txt(CITY.hhmm(), {
        scale: 2, color: CITY.minutesLeft() < 120 ? PIX.PAL.R : PIX.PAL.q }));
      nite.appendChild(UI.txt(sky.word, { scale: 1, color: PIX.PAL.u }));
      L.appendChild(nite);
    }

    /* which chapter of the case you are in, by name — no floors, no antes.
       On a narrow phone the name sets a size down so it never runs into
       the hearts. */
    const ch = STORY.chapter();
    const chip = U.el('span', 'has-tip tb-chip');
    chip.dataset.tipText = ch.obj;
    chip.appendChild(UI.txt(ch.title, { scale: window.innerWidth < 520 ? 2 : 3, color: PIX.PAL.W }));
    C.appendChild(chip);

    /* the board: five pieces of him, filled in as you take them */
    const track = U.el('span', 'intel-track has-tip');
    track.dataset.tipText = 'THE BULLFROG BOARD - ' + STORY.intelPct() + '% OF HIM';
    INTEL_CARDS.forEach(card => {
      track.appendChild(U.el('i', 'ipip' + (STORY.hasCard(card.id) ? ' got' : '')));
    });
    C.appendChild(track);

    /* chips */
    const chips = U.el('span', 'tb-chip has-tip');
    chips.id = 'tb-chips';
    chips.dataset.tipKey = 'chips';
    chips.appendChild(UI.icon('ic_chip', 3));
    const cnum = U.el('span'); cnum.id = 'tb-chip-num';
    cnum.appendChild(UI.num(G.chips, { color: PIX.PAL.G }));
    chips.appendChild(cnum);
    R.appendChild(chips);

    /* the two corner buttons set a size down on a phone so the help button
       never gets pushed off the edge; the CSS keeps them tappable */
    const bk = window.innerWidth < 420 ? 2 : 3;
    const mute = U.el('button', 'pixbtn tb-btn');
    mute.id = 'btn-mute';
    mute.appendChild(UI.txt(SFX.muted ? 'X' : ')))', { scale: bk, shadow: null, color: PIX.PAL.w }));
    mute.onclick = () => { SFX.toggleMute(); UI.put(mute, UI.txt(SFX.muted ? 'X' : ')))', { scale: bk, shadow: null, color: PIX.PAL.w })); };
    R.appendChild(mute);
    /* the phone lives in your coat; the topbar just reminds you it is there */
    if (typeof PHONE !== 'undefined' && UI.isScene(G.phase)) {
      const ph = U.el('button', 'pixbtn tb-btn tb-phone has-tip');
      ph.dataset.tipText = 'THE FROGGOPHONE - map, case file  (P)';
      ph.appendChild(UI.txt('PH', { scale: bk, shadow: null, color: PIX.PAL.G }));
      ph.onclick = () => PHONE.toggle('map');
      R.appendChild(ph);
    }
    const help = U.el('button', 'pixbtn tb-btn');
    help.appendChild(UI.txt('?', { scale: bk, shadow: null, color: PIX.PAL.G }));
    help.onclick = () => UI.showHelp();
    R.appendChild(help);

    bar.appendChild(L); bar.appendChild(C); bar.appendChild(R);
  },

  /* the clock moved: repaint the corner without rebuilding the room */
  syncStory() {
    const n = document.getElementById('tb-clock');
    if (!n || typeof CITY === 'undefined') return;
    const sky = CITY.sky();
    n.innerHTML = '';
    n.dataset.tipText = CITY.watch().word + ' - ' + sky.word + ' - ' +
      Math.max(0, Math.round(CITY.minutesLeft() / 60)) + ' HOURS OF SHIFT LEFT';
    n.appendChild(UI.txt(CITY.hhmm(), {
      scale: 2, color: CITY.minutesLeft() < 120 ? PIX.PAL.R : PIX.PAL.q }));
    n.appendChild(UI.txt(sky.word, { scale: 1, color: PIX.PAL.u }));
  },

  syncChips() {
    const n = document.getElementById('tb-chip-num');
    if (n) UI.put(n, UI.num(G.chips, { color: PIX.PAL.G }));
  },

  chipTick(delta) {
    UI.syncChips();
    const num = document.getElementById('tb-chip-num');
    if (num) { num.classList.remove('tick'); void num.offsetWidth; num.classList.add('tick'); setTimeout(() => num.classList.remove('tick'), 200); }
    const chips = document.getElementById('tb-chips');
    if (!chips) return;
    const f = U.el('span', 'chip-float');
    f.appendChild(UI.txt((delta > 0 ? '+' : '') + delta, { scale: 3, color: delta > 0 ? PIX.PAL.G : PIX.PAL.R }));
    chips.appendChild(f);
    setTimeout(() => f.remove(), 900);
    if (delta > 0) SFX.coin();
  },

  /* ================= title ================= */

  /* ============================================================
     THE ROOM THE BOARD IS IN.

     The menu used to be a board floating in the dark. It is a
     wall now: rain on the window, a desk lamp throwing a cone
     across the cork, the edge of a desk along the bottom with a
     cold coffee and an ashtray on it, and dust in the light.
     ============================================================ */
  titleRoom(host) {
    const cv = document.createElement('canvas');
    cv.className = 'pix title-room';
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    host.appendChild(cv);

    const rng = U.mulberry32(20260820);
    const drops = Array.from({ length: 110 }, () => ({
      x: rng() * 74, y: rng() * 60, s: 0.6 + rng() * 1.6, l: 2 + rng() * 4,
    }));
    const motes = Array.from({ length: 40 }, () => ({
      fx: rng(), fy: rng(), s: 0.1 + rng() * 0.3, ph: rng() * 9,
    }));

    /* The wall is painted once per size. Nothing in it is centred: the
       window hangs off the right edge, the desk sits on the bottom one,
       the lamp hangs at the left. So the room fills any frame it is given
       instead of floating in the middle of a black one. */
    let W = 0, H = 0, DY = 0, WX = 0, back = null;
    const bake = () => {
      DY = H - 32;                                   // the desk surface
      WX = W - 84;                                   // the window frame
      back = ART.cv(W, H);
      const b = back.c;
      b.drawImage(ART.wall(W, H, { tone: 'grey', railY: DY - 14, seed: 77 }), 0, 0);

      /* the window, stage right, with the city out in the rain */
      ART.px(b, WX, 12, 78, 64, '#0d1218');
      ART.px(b, WX + 2, 14, 74, 60, '#141d28');
      for (let bx = WX + 2; bx < WX + 74; bx += 13) {
        const bh = 12 + ((bx * 7) % 26);
        ART.px(b, bx, 74 - bh, 11, bh, '#0c141c');
        for (let ly = 76 - bh; ly < 72; ly += 5) {
          for (let lx = bx + 2; lx < bx + 9; lx += 4) {
            if ((lx * ly) % 5 === 0) ART.px(b, lx, ly, 2, 2, (lx + ly) % 3 ? '#4a6478' : '#ffd75e');
          }
        }
      }
      ART.px(b, WX, 12, 78, 2, '#0a0d12');
      ART.px(b, WX + 38, 12, 2, 64, '#0a0d12');
      ART.px(b, WX, 42, 78, 2, '#0a0d12');
      ART.px(b, WX - 2, 74, 82, 4, '#2a2f38');
      ART.px(b, WX - 2, 74, 82, 1, '#3f4652');

      /* the desk along the bottom of the frame */
      ART.px(b, 0, DY, W, H - DY, '#241a12');
      ART.px(b, 0, DY, W, 3, '#4d301a');
      ART.px(b, 0, DY + 3, W, 1, '#6b4426');
      ART.grain(b, 0, DY + 4, W, H - DY - 4, '#1d150e', '#33251a', 13);

      /* near end: the case file open where you left it, a cold coffee with
         the ring it left, and the phone off the hook */
      ART.px(b, 8, DY + 2, 52, 16, '#12101d');
      ART.px(b, 9, DY + 3, 50, 14, '#ded2b4');
      ART.px(b, 11, DY + 6, 36, 1, '#8d8672');
      ART.px(b, 11, DY + 9, 28, 1, '#8d8672');
      ART.px(b, 11, DY + 12, 32, 1, '#8d8672');
      ART.px(b, 9, DY + 3, 50, 2, '#b8232f');
      ART.px(b, 44, DY, 18, 20, 'rgba(0,0,0,.25)');
      b.drawImage(ART.art('mug', 2), 66, DY + 8);
      ART.px(b, 64, DY + 22, 20, 2, 'rgba(110,74,48,.45)');
      b.drawImage(ART.art('phone', 2), 90, DY + 8);

      /* far end: an ashtray with one still going, the iron he never puts in
         the drawer, and the typewriter with a sheet still in it */
      b.drawImage(ART.art('ashtray', 2), W - 100, DY + 14);
      ART.px(b, W - 96, DY + 12, 8, 1, '#e6dcc4');
      ART.px(b, W - 88, DY + 12, 2, 1, '#ff8a4a');
      b.drawImage(ART.art('gunprop', 2), W - 76, DY + 12);
      b.drawImage(ART.art('typewriter', 2), W - 44, DY - 2);
      ART.px(b, W - 38, DY - 8, 20, 8, '#ded2b4');
      ART.px(b, W - 38, DY - 8, 20, 1, '#f2e9cf');
      ART.px(b, W - 36, DY - 4, 14, 1, '#8d8672');

      /* the desk falls away from the lamp: the far end sits in the dark */
      for (let x = 0; x < W; x += 4) {
        ART.px(b, x, DY - 12, 4, H - DY + 12, 'rgba(6,8,14,' + (0.04 + 0.42 * (x / W)).toFixed(3) + ')');
      }
      /* a tin lamp on a cord over the near end of the board */
      b.drawImage(ART.hangLamp(20, 34, false), 20, 0);
    };

    let raf = null;
    const t0 = performance.now();
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (G.phase !== 'title') { cancelAnimationFrame(raf); raf = null; return; }
      const T = (performance.now() - t0) / 1000;
      const vw = window.innerWidth, vh = window.innerHeight;
      /* an integer scale, then a world big enough to cover the frame at it */
      const K = Math.max(2, Math.min(Math.floor(vw / 240), Math.floor(vh / 150), 8));
      const nW = Math.max(240, Math.ceil(vw / K)), nH = Math.max(150, Math.ceil(vh / K));
      if (!back || nW !== W || nH !== H) { W = nW; H = nH; bake(); }
      if (cv.width !== W * K) {
        cv.width = W * K; cv.height = H * K;
        cv.style.width = cv.width + 'px'; cv.style.height = cv.height + 'px';
      }
      c.setTransform(K, 0, 0, K, 0, 0);
      c.imageSmoothingEnabled = false;
      c.clearRect(0, 0, W, H);
      c.drawImage(back.cv, 0, 0);
      /* rain running down the glass */
      for (const d of drops) {
        const y = (d.y + T * d.s * 26) % 62;
        for (let i = 0; i < d.l; i++) {
          ART.px(c, WX + 2 + Math.round(d.x), 14 + Math.round(y) + i, 1, 1, 'rgba(150,195,225,.16)');
        }
      }
      /* the lamp, guttering, and the cone it puts down the wall */
      const flick = Math.sin(T * 9) > 0.93 ? 0.4 : 1;
      ART.px(c, 28, 16, 4, 3, 'rgba(255,251,232,' + (0.85 * flick) + ')');
      const bands = Math.max(6, Math.ceil((DY + 6 - 19) / 8));
      for (let i = 0; i < bands; i++) {
        const y = 19 + i * 8, hw = 5 + i * 5;
        ART.px(c, 30 - hw, y, hw * 2, 8, 'rgba(255,235,170,' + (0.032 * flick) + ')');
      }
      ART.px(c, 4, DY, 58, 2, 'rgba(255,235,170,' + (0.18 * flick) + ')');
      ART.px(c, 12, DY + 2, 44, 3, 'rgba(255,235,170,' + (0.07 * flick) + ')');
      /* the cigarette on the ashtray, still going */
      for (let i = 0; i < 16; i++) {
        const sx = W - 87 + Math.sin(T * 1.1 + i * 0.45) * (0.6 + i * 0.16);
        ART.px(c, Math.round(sx), DY + 11 - i, 1, 1,
          'rgba(210,205,195,' + (0.13 - i * 0.007) + ')');
      }
      /* dust turning over in the light */
      for (const m of motes) {
        const y = (m.fy * H + T * m.s * 5) % H;
        const x = m.fx * W + Math.sin(T * 0.5 + m.ph) * 3;
        ART.px(c, Math.round(x), Math.round(y), 1, 1, 'rgba(255,240,205,.14)');
      }
      /* the frame goes dark at the edges */
      for (let i = 0; i < 18; i++) {
        const a = 0.5 * (1 - i / 18);
        ART.px(c, 0, i, W, 1, 'rgba(0,0,0,' + (a * 0.5) + ')');
        ART.px(c, 0, H - 1 - i, W, 1, 'rgba(0,0,0,' + (a * 0.4) + ')');
        ART.px(c, i, 0, 1, H, 'rgba(0,0,0,' + (a * 0.6) + ')');
        ART.px(c, W - 1 - i, 0, 1, H, 'rgba(0,0,0,' + (a * 0.6) + ')');
      }
    };
    draw();
  },

  buildTitle(app) {
    const s = META.stats();
    const wrap = U.el('div', 'splash board-title');
    UI.titleRoom(wrap);

    /* a phone held sideways gets one small row of mugshots, not two big ones */
    const tight = window.innerHeight < 560;
    const mugK = tight ? 1 : 2;
    const tagK = tight ? 1 : 2;

    /* ---- the murder board: everything on it is pinned, taped or stabbed ---- */
    const board = U.el('div', 'mboard' + (tight ? ' tight' : ''));

    /* red string first, under everything */
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'strings');
    svg.id = 'title-strings';
    board.appendChild(svg);

    /* the case-file masthead, stabbed through with the knife */
    const head = U.el('div', 'mb-pin mb-title');
    head.appendChild(SPR.clone(SPR.titleCard({
      big: 'HOMICIDE DIVISION - AFTER HOURS',
      huge: 'SHELL & DEBT',
      sub: 'A DETECTIVE FROG STORY',
      col: PIX.PAL.R,
    }), tight ? 2 : U.clamp(Math.floor(window.innerWidth / 340), 2, 4)));
    const knife = PIX.el('prop_knife', 3);
    knife.className = 'mb-knife';
    head.appendChild(knife);
    board.appendChild(head);

    /* the family, pinned up where you cannot stop looking at them */
    const MUGS = [
      ['vig', 'DON BUFO'], ['lily', 'SLICK LILY'], ['owner', 'THE BULLFROG'],
      ['cage', 'WARDEN WART'], ['collector', 'TAXTOAD TONY'],
    ];
    MUGS.forEach(([id, nm], i) => {
      const m = U.el('div', 'mb-pin mb-mug mb-mug' + i);
      m.appendChild(U.el('i', 'poster-pin'));
      m.appendChild(SPR.clone(SPR.mugshot(id, FROG_DEFS[id], 1), mugK));
      const tag = U.el('div', 'mb-name');
      tag.appendChild(UI.txt(nm, { scale: tagK, color: PIX.PAL.K, shadow: null }));
      m.appendChild(tag);
      if (i === 2) {   // the Bullfrog gets the red ring
        const ring = U.el('i', 'mb-ring');
        m.appendChild(ring);
      }
      board.appendChild(m);
    });

    /* what somebody thought of the investigation */
    [[0, '18%', '30%'], [1, '74%', '22%'], [0, '64%', '72%']].forEach(([small, lx, ty], i) => {
      const h = PIX.el(small ? 'prop_hole2' : 'prop_hole', 3);
      h.className = 'mb-hole';
      h.style.left = lx; h.style.top = ty;
      board.appendChild(h);
    });

    /* the case number, on a manila tag you can type on */
    const tagWrap = U.el('div', 'mb-pin mb-seed');
    tagWrap.appendChild(U.el('i', 'poster-pin'));
    tagWrap.appendChild(UI.txt('CASE NO.', { scale: tagK, color: PIX.PAL.K, shadow: null }));
    const inp = U.el('input');
    inp.id = 'seed-input';
    inp.maxLength = 24;
    inp.placeholder = U.randSeedStr();
    inp.spellcheck = false;
    tagWrap.appendChild(inp);
    board.appendChild(tagWrap);

    /* your record, on an index card */
    if (s.runs > 0) {
      const rec = U.el('div', 'mb-pin mb-record');
      rec.appendChild(U.el('i', 'poster-pin'));
      rec.appendChild(UI.txt('DET. VERDE - RECORD', { scale: 2, color: PIX.PAL.K, shadow: null }));
      rec.appendChild(UI.txt('CLOSED ' + s.wins + ' / IN THE WARD ' + s.deaths + ' TIMES',
        { scale: 2, color: PIX.PAL.d, shadow: null }));
      board.appendChild(rec);
    }

    wrap.appendChild(board);

    /* ---- the buttons, on the rail under the board ---- */
    const btns = U.el('div', 'end-btns title-btns');
    const deal = U.el('button', 'pixbtn gold big-deal');
    deal.id = 'btn-deal';
    deal.appendChild(PIX.el('gun_snub', 2));
    deal.appendChild(UI.txt('OPEN THE CASE', { scale: 4, shadow: null, color: PIX.PAL.K }));
    deal.onclick = () => {
      SFX.chak();
      /* the whole story the first time; after that just the last panel.
         Then the load-up, the drive, and the precinct. */
      const seen = META.stats().loreSeen > 0;
      UI.goto(() => E.newRun(inp.value)).then(() => {
        META.bump('loreSeen'); META.save();
        return CINE.lore(seen);
      }).then(() => CINE.driveTo())
        .then(() => {
          UI.render();
          return STORY.arrive('precinct');
        })
        .then(() => TUTOR.open());
    };
    btns.appendChild(deal);

    const hlp = U.el('button', 'pixbtn');
    hlp.appendChild(UI.txt('HOW THIS WORKS', { scale: 3, shadow: null }));
    hlp.onclick = () => UI.showHelp();
    btns.appendChild(hlp);

    if (META.load().tutor && META.load().tutor.opening) {
      const again = U.el('button', 'pixbtn ghost has-tip');
      again.id = 'btn-tutor';
      again.dataset.tipText = 'Have the captain walk you through it again on your next case.';
      again.appendChild(UI.txt('BRIEF ME AGAIN', { scale: 3, shadow: null }));
      again.onclick = () => { TUTOR.replay(); SFX.bank(); UI.stampSmall('HE WILL BE WAITING'); };
      btns.appendChild(again);
    }
    wrap.appendChild(btns);
    app.appendChild(wrap);

    /* string the board up once everything has a rect */
    requestAnimationFrame(() => {
      const R = board.getBoundingClientRect();
      if (!R.width) return;
      svg.setAttribute('viewBox', '0 0 ' + Math.round(R.width) + ' ' + Math.round(R.height));
      const pins = board.querySelectorAll('.mb-mug .poster-pin, .mb-seed .poster-pin');
      const pts = [];
      pins.forEach(pin => {
        const r = pin.getBoundingClientRect();
        pts.push([r.left - R.left + r.width / 2, r.top - R.top + r.height / 2]);
      });
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + 16;
        ln.setAttribute('d', 'M' + a[0] + ' ' + a[1] + ' Q' + mx + ' ' + my + ' ' + b[0] + ' ' + b[1]);
        ln.setAttribute('class', 'str');
        svg.appendChild(ln);
      }
    });
  },

  /* ================= the precinct ================= */

  /* The night starts here: the captain behind his counter, Maybelle at
     the front desk, and the board waiting in the next room. Talking is
     optional. It is also the only warm thing in the game. */

  /* the captain: one job, three moods */

  /* Maybelle: trust is slow, real, and it helps */

  /* ================= the board ================= */

  /* A wanted poster: his face, his name, and the pin that holds it up. */
  /* One frog in the line, full length, against the height chart. Crossed
     off, he goes grey under a stepped red X. Called out, he steps forward. */
  posterEl(s, i, out, called, k) {
    const p = U.el('div', 'suspect' + (out ? ' out' : '') + (called ? ' called' : ''));
    p.dataset.sus = i;
    const art = U.el('div', 'sus-art');
    const cvb = SPR.clone(SPR.fullBody(s.name, s.def), k);
    art.appendChild(cvb);
    if (out) {
      const xw = U.el('div', 'sus-x');
      xw.appendChild(SPR.clone(SPR.bigX(52, 74), k));
      art.appendChild(xw);
    }
    p.appendChild(art);
    const nm = U.el('div', 'sus-tag');
    const sc = k >= 2 && s.name.length <= 10 ? 2 : 1;
    nm.appendChild(UI.txt('N.' + (i + 1), { scale: 1, color: PIX.PAL.q, shadow: null }));
    nm.appendChild(UI.txt(s.name, { scale: sc, color: PIX.PAL.K, shadow: null }));
    p.appendChild(nm);
    return p;
  },

  /* The whole line has to stand inside the frame — heads included. Try the
     big scale first and walk down until every row fits both ways. */
  lineupScale(c) {
    const fb = SPR.fullBody(c.suspects[0].name, c.suspects[0].def);
    const availW = Math.min(window.innerWidth * 0.94, 900) - 44;
    const availH = Math.max(280, window.innerHeight - 250);
    for (let k = 3; k >= 1; k--) {
      if (fb.width * k > availW) continue;
      const perRow = Math.max(1, Math.floor((availW + 10) / (fb.width * k + 10)));
      const rows = Math.ceil(c.suspects.length / perRow);
      if (rows * (fb.height * k + 42) <= availH) return k;
    }
    return 1;
  },


  /* Red string, pinned from a clue to every poster it rules out. This is
     the whole point of the board: you can SEE the field closing. */
  drawStrings() {
    const svg = document.getElementById('cork-strings');
    const cork = document.getElementById('cork');
    if (!svg || !cork || !G.case || G.case.known) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const R = cork.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + Math.round(R.width) + ' ' + Math.round(R.height));
    const at = (el, fx, fy) => {
      const r = el.getBoundingClientRect();
      return [r.left - R.left + r.width * fx, r.top - R.top + r.height * fy];
    };
    const posters = cork.querySelectorAll('.suspect');
    cork.querySelectorAll('.ev.up').forEach(ev => {
      const cl = G.case.clues[+ev.dataset.clue];
      if (!cl) return;
      const a = at(ev, 0.5, 0.04);
      posters.forEach((p, i) => {
        if (cl.keeps[i]) return;
        const b = at(p, 0.5, 0.94);
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + 14;   // the sag in the string
        ln.setAttribute('d', 'M' + a[0] + ' ' + a[1] + ' Q' + mx + ' ' + my + ' ' + b[0] + ' ' + b[1]);
        ln.setAttribute('class', 'str');
        svg.appendChild(ln);
      });
    });
  },

  /* the room answers, on the same drawn plate everybody else uses */
  askedToast(a) {
    if (typeof TUTOR === 'undefined') return;
    TUTOR.say(a.reply, {
      art: SPR.frogCustom('barman', BARMAN_DEF),
      name: 'THE ROOM',
      nameCol: PIX.PAL.N,
      rim: PIX.PAL.t,
      snd: 'tick',
      hold: 1500,
      top: true,            // the rack it is answering is at the bottom
    });
  },

  /* the moment you say a name out loud */
  callOut(right) {
    UI.stampBig(right ? 'CALLED OUT' : 'WRONG MAN', right ? PIX.PAL.G : PIX.PAL.R, true);
    if (right) { SFX.jackpot(); FX.chipRain && FX.chipRain(8); }
    else { SFX.backfire(); UI.shake(); }
  },

  /* a phone held sideways has no height to give a toast: it types smaller */
  toastK() { return window.innerHeight < 480 ? 2 : 3; },

  tagToast(t) {
    const box = document.getElementById('fx-particles');
    const el = U.el('div', 'unlock-toast pop');
    const tk = UI.toastK();
    el.appendChild(PIX.el(t.icon, tk));
    const col = U.el('div');
    col.appendChild(UI.txt('TAG TAKEN', { scale: tk, color: PIX.PAL.N }));
    col.appendChild(UI.txt(t.name, { scale: tk, color: PIX.PAL.W }));
    el.appendChild(col);
    box.appendChild(el);
    SFX.jackpot();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 2400);
  },

  /* ================= the run panel ================= */

  showRunInfo() {
    const r = E.runInfo();
    const items = r.items.length
      ? r.items.map(id => '<div class="ri-row"><b>' + ITEMS[id].name + '</b><span>' + ITEMS[id].desc + '</span></div>').join('')
      : '<div class="ri-row"><span>Belt loops empty.</span></div>';
    const nb = r.next;
    UI.modal(
      '<button class="pixbtn m-close" id="mm-close"></button>' +
      '<div class="ri-head"><h3>THE RUN</h3><span class="ri-seed">SEED ' + U.esc(r.seed) + '</span></div>' +
      '<div class="ri-grid">' +
      '<div class="ri-stat"><b>' + STORY.chapter().id + '/' + CHAPTERS.length + '</b><span>CHAPTER</span></div>' +
      '<div class="ri-stat"><b>' + STORY.intelPct() + '%</b><span>THE BOARD</span></div>' +
      '<div class="ri-stat"><b>' + r.chips + '</b><span>CHIPS</span></div>' +
      '<div class="ri-stat"><b>' + r.hearts + '/' + r.maxHP + '</b><span>HEARTS</span></div>' +
      '<div class="ri-stat"><b>' + r.duelsWon + '</b><span>MARKS DOWN</span></div>' +
      '<div class="ri-stat"><b>' + r.shots + '</b><span>SHOTS</span></div>' +
      '<div class="ri-stat"><b>' + r.damage + '</b><span>DAMAGE</span></div>' +
      '<div class="ri-stat"><b>' + r.skipped + '</b><span>SKIPPED</span></div>' +
      '</div>' +
      '<div class="ri-sec"><h4>YOUR IRON</h4><div class="ri-row"><b>' + r.gun.name + '</b><span>' + r.gun.desc + '</span></div></div>' +
      '<div class="ri-sec"><h4>BELT ' + r.items.length + '/' + E.maxItems() + '</h4>' + items + '</div>' +
      '<p class="ri-foot">Next up: <b>' + nb.name + '</b>' + (nb.boss ? ' - ' + nb.boss.name : '') +
      ', purse ' + nb.purse + '. Swamp PD wants ' + E.heatDue() + ' after this ante\'s boss.</p>'
    );
    const c = document.querySelector('#mm-close');
    c.appendChild(UI.txt('X', { scale: 3, color: PIX.PAL.W, shadow: null }));
    c.onclick = () => UI.closeModal();
  },

  /* ================= the duel frame ================= */

  buildDuel(app) {
    const bar = U.el('div'); UI.buildTopbar(bar); app.appendChild(bar);

    const wrap = U.el('div'); wrap.id = 'duel-wrap';

    /* cylinder strip */
    const stripRow = U.el('div'); stripRow.id = 'strip-row';
    const counts = U.el('span'); counts.id = 'strip-counts'; counts.className = 'has-tip';
    counts.dataset.tipKey = 'counts';
    stripRow.appendChild(counts);
    const strip = U.el('span'); strip.id = 'shell-strip'; strip.className = 'has-tip';
    strip.dataset.tipKey = 'strip';
    stripRow.appendChild(strip);
    const odds = U.el('span'); odds.id = 'strip-odds'; odds.className = 'has-tip';
    stripRow.appendChild(odds);
    const oppName = U.el('span'); oppName.id = 'opp-name';
    stripRow.appendChild(oppName);
    const oppGrip = U.el('span'); oppGrip.id = 'opp-grip'; oppGrip.className = 'hidden';
    stripRow.appendChild(oppGrip);
    wrap.appendChild(stripRow);

    /* the scene */
    const dread = U.el('div'); dread.id = 'dread-wash'; app.appendChild(dread);
    const holder = U.el('div'); holder.id = 'scene-holder';
    const cv = U.el('canvas'); cv.id = 'scene'; cv.className = 'pix';
    cv.width = DUEL.W; cv.height = DUEL.H;
    cv.onclick = (e) => DUEL.sceneClick(e);
    cv.onpointermove = (e) => DUEL.sceneMove(e);
    cv.onpointerleave = () => { DUEL.hoverSpot = -1; DUEL.hoverFace = false; };
    holder.appendChild(cv);

    const stampB = U.el('div'); stampB.id = 'stamp-big'; holder.appendChild(stampB);
    const stampS = U.el('div'); stampS.id = 'stamp-small'; holder.appendChild(stampS);
    const turn = U.el('div'); turn.id = 'turn-stamp'; holder.appendChild(turn);
    const hint = U.el('div'); hint.id = 'hint-bar'; hint.className = 'hidden'; holder.appendChild(hint);
    const banner = U.el('div'); banner.id = 'load-banner'; banner.className = 'hidden'; holder.appendChild(banner);
    const overlay = U.el('div'); overlay.id = 'duel-overlay'; overlay.className = 'hidden'; holder.appendChild(overlay);
    wrap.appendChild(holder);
    app.appendChild(wrap);

    /* bottom: the belt, the iron, the trigger */
    const bottom = U.el('div'); bottom.id = 'duel-bottom';

    const belt = U.el('div', 'item-belt'); belt.id = 'item-belt'; bottom.appendChild(belt);
    /* No aim rail. You click the thing you mean to shoot: his face to put
       the sights on him, your own end of the table to turn it round. The
       keys still work for anyone who wants them. */
    const controls = U.el('div'); controls.id = 'aim-controls';
    const fire = U.el('button', 'pixbtn fire-btn hidden');
    fire.id = 'btn-fire';
    fire.onclick = () => DUEL.onFire();
    controls.appendChild(fire);
    bottom.appendChild(controls);

    const gunP = U.el('div'); gunP.id = 'gun-panel'; bottom.appendChild(gunP);
    app.appendChild(bottom);

    UI.syncDuel();
  },

  /* redraw everything data-driven in the duel frame */
  syncDuel() {
    if (G.phase !== 'duel' && G.phase !== 'won' && G.phase !== 'loot') return;
    const d = G.duel;
    if (!d) return;

    UI.syncChips();
    /* at a corpse there is nothing to aim at and no drum to read: the rail
       keeps your rack and your belt and drops everything else */
    document.body.classList.toggle('at-corpse', G.phase === 'loot');

    /* strip */
    const strip = document.getElementById('shell-strip');
    if (strip) {
      strip.innerHTML = '';
      for (let i = d.ptr; i < d.shells.length; i++) {
        const cell = U.el('span', 'strip-cell' + (i === d.ptr ? ' under-hammer' : ''));
        if (i === d.ptr) {
          const ptr = PIX.el('ic_ptr', 4); ptr.className = 'pix strip-ptr';
          cell.appendChild(ptr);
        }
        const known = d.known[i];
        const master = known === null ? SPR.hiddenMaster() : SPR.backMaster(known ? 'live' : 'blank');
        cell.appendChild(SPR.clone(master, 4));
        strip.appendChild(cell);
      }
    }

    /* what the drum was loaded with — Blind Newt hides it */
    const counts = document.getElementById('strip-counts');
    if (counts) {
      counts.innerHTML = '';
      if (E.countsHidden()) {
        counts.appendChild(UI.txt('? / ?', { scale: 3, color: PIX.PAL.q }));
      } else {
        counts.appendChild(UI.txt(d.lives + '', { scale: 3, color: PIX.PAL.R }));
        counts.appendChild(UI.txt('/', { scale: 3, color: PIX.PAL.q }));
        counts.appendChild(UI.txt(d.blanks + '', { scale: 3, color: PIX.PAL.w }));
        counts.title = '';
      }
    }

    /* THE ODDS. The one number every choice in this game turns on: how
       likely the chamber under the hammer is live. Working it out in your
       head from two bead counts is not depth, it is arithmetic homework. */
    const odds = document.getElementById('strip-odds');
    if (odds) {
      odds.innerHTML = '';
      const o = E.liveOdds();
      if (o === null) {
        odds.appendChild(UI.txt('?? %', { scale: 3, color: PIX.PAL.q }));
        odds.appendChild(UI.txt('LIVE', { scale: 2, color: PIX.PAL.q }));
      } else {
        const pct = Math.round(o * 100);
        const col = pct >= 100 ? PIX.PAL.R : pct === 0 ? PIX.PAL.N
          : pct >= 60 ? PIX.PAL.R : pct >= 34 ? PIX.PAL.O : PIX.PAL.G;
        odds.appendChild(UI.txt(pct + '%', { scale: 4, color: col, outline: PIX.PAL.K }));
        odds.appendChild(UI.txt(pct === 0 ? 'SAFE' : pct === 100 ? 'LIVE' : 'LIVE',
          { scale: 2, color: PIX.PAL.q }));
      }
      odds.className = 'has-tip' + (o !== null && o >= 0.6 ? ' hot' : '');
      odds.dataset.tipText = 'The chance the shell under the hammer is LIVE. ' +
        'Aim at yourself when this is low — a blank there keeps your turn.';
    }

    /* how he is holding it, once he has picked it up */
    const grip = document.getElementById('opp-grip');
    if (grip) {
      const show = d.turn === 'opp' && !d.over;
      grip.className = show ? '' : 'hidden';
      if (show && grip._g !== DUEL.oppGrip) {
        grip._g = DUEL.oppGrip;
        grip.innerHTML = '';
        grip.appendChild(UI.txt((DUEL.GRIPS[DUEL.oppGrip] || {}).label || '',
          { scale: 2, color: PIX.PAL.O }));
      }
    }

    /* opp name plate — hover for his tells */
    const nm = document.getElementById('opp-name');
    if (nm) {
      nm.innerHTML = '';
      nm.className = d.opp.boss ? 'has-tip bossname' : 'has-tip';
      nm.dataset.tipOppTells = '1';
      nm.appendChild(UI.txt(d.opp.name, { scale: 3, color: d.opp.boss ? PIX.PAL.R : PIX.PAL.w }));
    }

    /* turn stamp */
    const turn = document.getElementById('turn-stamp');
    if (turn) {
      turn.innerHTML = '';
      if (!d.over) {
        const yours = d.turn === 'you' && !DUEL.busy;
        turn.appendChild(UI.txt(d.turn === 'you' ? 'YOUR PULL' : d.opp.name + ' HOLDS IT',
          { scale: yours ? 3 : 2, color: d.turn === 'you' ? PIX.PAL.G : PIX.PAL.R,
            outline: yours ? PIX.PAL.K : undefined }));
      }
    }

    /* The rule of the game, on screen, always. It costs one line and it
       stops every new player having to be told twice. */
    const hint = document.getElementById('hint-bar');
    if (hint) {
      const show = G.phase === 'duel' && !d.over;
      hint.className = show ? '' : 'hidden';
      if (show) {
        const msg = d.turn !== 'you'
          ? 'HIS PULL'
          : DUEL.aim === 'self'
            ? 'CLICK YOUR OWN HEAD TO PULL  ·  ANYWHERE ELSE TO STAND DOWN'
            : DUEL.aim === 'foe'
              ? 'CLICK HIS FACE AGAIN TO PULL  ·  ANYWHERE ELSE TO STAND DOWN'
              : 'CLICK HIS FACE TO AIM  ·  YOUR END OF THE TABLE TO TURN IT ROUND';
        if (hint._msg !== msg) {
          hint._msg = msg;
          hint.innerHTML = '';
          hint.appendChild(UI.wrap(msg, 46, { scale: 2, color: PIX.PAL.w }));
        }
      }
    }

    const fire = document.getElementById('btn-fire');
    if (fire) fire.disabled = !(!DUEL.busy && !d.over && d.turn === 'you');

    UI.syncItems();
    UI.syncGunPanel();
    if (typeof TUTOR !== 'undefined' && TUTOR.armed()) TUTOR.check();
  },


  syncItems() {
    const belt = document.getElementById('item-belt');
    if (!belt) return;
    belt.innerHTML = '';
    const slots = E.maxItems();
    for (let i = 0; i < slots; i++) {
      const id = G.items[i];
      if (!id) { belt.appendChild(U.el('span', 'ibelt-slot empty')); continue; }
      const it = ITEMS[id];
      const slot = U.el('button', 'ibelt-slot has-tip rq-' + it.rarity);
      slot.dataset.tipItem = id;
      const card = U.el('span', 'ib-card');
      card.appendChild(SPR.itemCardEl(id, 3));
      slot.appendChild(card);
      const use = U.el('span', 'ib-use'); use.textContent = 'USE';
      slot.appendChild(use);
      const k = U.el('span', 'key-hint ib'); k.textContent = String(6 + i);
      slot.appendChild(k);
      const ok = E.canUseItem(i);
      if (!ITEM_PHASE_OK(id, G.phase)) slot.classList.add('off');
      slot.disabled = !ok || (G.phase === 'duel' && DUEL.busy);
      slot.onclick = () => UI.onUseItem(i);
      belt.appendChild(slot);
    }
  },

  onUseItem(i) {
    const id = G.items[i];
    if (!id || !E.canUseItem(i)) return;
    const slot = document.querySelectorAll('#item-belt .ibelt-slot')[i];
    if (slot) slot.classList.add('burn');
    const r = E.useItem(i);
    if (!r) return;
    const it = ITEMS[id];
    SFX.bank();
    UI.stampSmall(it.name, 'good');
    if (typeof FX !== 'undefined') {
      if (r.type === 'whiskey') FX.floatText(60, 150, '+HEARTS', PIX.PAL.R);
      else if (r.type === 'brassKnuckle') { FX.impactFrame(180, 70); FX.screen.shake(9); }
      else if (r.type === 'smokeBomb') FX.cordite(120, 150, 14);
      else if (r.type === 'hollowPoint') FX.sparks(150, 140, 8, 1.4);
      else if (r.type === 'coinFlip') FX.floatText(120, 130, r.heads ? 'HEADS' : 'TAILS', r.heads ? PIX.PAL.G : PIX.PAL.R);
      else if (r.type === 'shiv') UI.stampSmall('SHIV OUT — PICK AN EMPTY POCKET', 'good');
      else if (r.type === 'loupe') { FX.sparks(180, 120, 12, 1.3); UI.stampSmall('EVERY BULGE SHOWS'); }
    }
    if (r.chips) UI.chipTick(r.chips);
    if (G.phase === 'loot') { LOOT.sync(); UI.syncItems(); return; }
    if (r.over === 'win') { DUEL.busy = true; DUEL.killSequence(); return; }
    UI.syncDuel();
  },

  syncGunPanel() {
    const p = document.getElementById('gun-panel');
    if (!p) return;
    p.innerHTML = '';
    const g = E.gun();
    const spr = U.el('span', 'has-tip gun-spr');
    spr.dataset.tipGun = g.id;
    spr.appendChild(SPR.gunEl(g.id, 2));
    p.appendChild(spr);
    const mk = (kind, key, label, need) => {
      if (G.gunIdx < need) return;
      const b = U.el('button', 'pixbtn gun-act has-tip');
      b.dataset.tipText = label;
      b.appendChild(UI.txt(key, { scale: 3, shadow: null, color: PIX.PAL.G }));
      b.disabled = !E.canUseGun(kind) || DUEL.busy;
      const d = G.duel;
      if (kind === 'saw' && d && d.sawArmed) b.classList.add('sel');
      b.onclick = () => DUEL.useGunActive(kind);
      p.appendChild(b);
    };
    mk('saw', 'Q', 'SAW GRIP — once a duel, your next shot deals DOUBLE.', GUN_ACTIVES.sawn);
    mk('tommy', 'E', 'DOUBLE TAP — once a duel, fire twice before the turn passes.', GUN_ACTIVES.tommy);
  },

  /* ================= stamps & banners ================= */

  stampBig(text, color, small) {
    const z = document.getElementById('stamp-big');
    if (!z) return;
    z.innerHTML = '';
    const c = UI.txt(text, { scale: small ? 3 : 5, color: color || PIX.PAL.W, outline: PIX.PAL.K });
    c.className = 'pix pop';
    z.appendChild(c);
    clearTimeout(UI._sbTo);
    UI._sbTo = setTimeout(() => { z.innerHTML = ''; }, 950);
  },

  stampSmall(text, kind) {
    const z = document.getElementById('stamp-small');
    if (!z) return;
    const t = U.el('span', 'toast pop' + (kind ? ' t-' + kind : ''));
    t.appendChild(UI.txt(text, { scale: 3, color: PIX.PAL.W }));
    z.appendChild(t);
    while (z.children.length > 3) z.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 1400);
  },

  blindBanner() {
    const d = G.duel;
    UI.stampBig(G.blind === 2 ? STORY.chapter().crew : STORY.chapter().where,
      G.blind === 2 ? PIX.PAL.R : PIX.PAL.G, true);
    UI.stampSmall(d.opp.name + ' - PURSE ' + E.purse());
  },

  async loadBanner() {
    const b = document.getElementById('load-banner');
    if (!b) return;
    const d = G.duel;
    b.className = '';
    b.innerHTML = '';
    const box = U.el('div', 'load-box pop');
    const hid = E.countsHidden();
    const row = U.el('div', 'load-row');
    row.appendChild(UI.txt(hid ? '?' : String(d.lives), { scale: 4, color: PIX.PAL.R }));
    row.appendChild(UI.txt('LIVE', { scale: 3, color: PIX.PAL.R }));
    row.appendChild(UI.txt('-', { scale: 3, color: PIX.PAL.q }));
    row.appendChild(UI.txt(hid ? '?' : String(d.blanks), { scale: 4, color: PIX.PAL.W }));
    row.appendChild(UI.txt('BLANK', { scale: 3, color: PIX.PAL.w }));
    box.appendChild(row);
    const shells = U.el('div', 'load-shells');
    box.appendChild(shells);
    b.appendChild(box);
    /* shells drop in one by one — the mix, then hidden */
    const total = d.shells.length;
    for (let i = 0; i < total; i++) {
      await U.sleep(90);
      SFX.tick();
      const s = hid ? SPR.clone(SPR.hiddenMaster(), 4)
        : SPR.clone(SPR.backMaster(i < d.lives ? 'live' : 'blank'), 4);
      s.classList.add('pop');
      shells.appendChild(s);
    }
    await U.sleep(420);
    SFX.spin();
    shells.innerHTML = '';
    for (let i = 0; i < total; i++) {
      shells.appendChild(SPR.clone(SPR.hiddenMaster(), 4));
    }
    await U.sleep(400);
    b.className = 'hidden';
    UI.syncDuel();
  },

  /* THE ONE WHO RUNS THIS ROOM. A card, a name, a rule, and the piece of
     the board he is carrying. No button on it: tap anywhere, or wait, and
     the door opens on its own. */
  bossIntro(opp) {
    return new Promise(res => {
      const o = document.getElementById('duel-overlay');
      if (!o) { res(); return; }
      o.className = 'boss-in';
      o.innerHTML = '';
      const card = U.el('div', 'boss-card slam');
      card.appendChild(SPR.clone(SPR.frogCustom(opp.boss + ':intro', opp.def), 4));
      card.appendChild(UI.txt(opp.name, { scale: 4, color: PIX.PAL.R, outline: PIX.PAL.K }));
      card.appendChild(UI.txt(opp.rule, { scale: 3, color: PIX.PAL.G }));
      const desc = U.el('p', 'boss-desc');
      desc.textContent = opp.desc;
      card.appendChild(desc);
      const paper = STORY.nextCard();
      const line = U.el('div', 'load-row');
      line.appendChild(UI.txt(paper ? 'HE CARRIES ' + paper.name : 'NOTHING ON HIM YOU NEED',
        { scale: 3, color: paper ? PIX.PAL.G : PIX.PAL.q }));
      card.appendChild(line);
      const foot = U.el('div', 'boss-foot');
      foot.appendChild(UI.txt('TAP TO SIT DOWN', { scale: 3, color: PIX.PAL.w }));
      card.appendChild(foot);
      o.appendChild(card);
      UI.shake();
      SFX.lose();
      let done = false;
      const go = () => {
        if (done) return;
        done = true;
        window.removeEventListener('pointerdown', go);
        window.removeEventListener('keydown', go);
        clearTimeout(timer);
        o.className = 'hidden'; o.innerHTML = '';
        res();
      };
      const timer = setTimeout(go, 5200);
      setTimeout(() => {
        window.addEventListener('pointerdown', go);
        window.addEventListener('keydown', go);
      }, 350);
    });
  },

  /* a tell goes into the little black book */
  tellToast(traitId) {
    const t = TRAITS[traitId];
    const box = document.getElementById('fx-particles');
    const el = U.el('div', 'unlock-toast pop');
    const tk = UI.toastK();
    el.appendChild(PIX.el('ic_book', tk));
    const col = U.el('div');
    col.appendChild(UI.txt('NEW TELL', { scale: tk, color: PIX.PAL.N }));
    col.appendChild(UI.txt(t.name, { scale: tk, color: PIX.PAL.W }));
    el.appendChild(col);
    box.appendChild(el);
    SFX.bank();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 2600);
  },

  /* something got pinned to the board: say so, on paper */
  cardToast(card) {
    const box = document.getElementById('fx-particles');
    const el = U.el('div', 'unlock-toast pop');
    const col = U.el('div');
    const tk = UI.toastK();
    col.appendChild(UI.txt('PINNED TO THE BOARD', { scale: tk, color: PIX.PAL.G }));
    col.appendChild(UI.txt(card.name, { scale: tk, color: PIX.PAL.W }));
    el.appendChild(col);
    box.appendChild(el);
    SFX.bank();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 2600);
  },

  /* ================= end screens ================= */

  /* the last card of the story: which ending you got, and the log */
  buildEnding(app) {
    const good = G.ending === 'good';
    const wrap = U.el('div', 'end-wrap');
    wrap.appendChild(UI.wrap(good ? 'CASE CLOSED' : 'CASE BURIED', 16,
      { scale: 7, color: good ? PIX.PAL.G : PIX.PAL.R, outline: PIX.PAL.K }));
    wrap.appendChild(UI.wrap(good
      ? 'HE IS IN A CELL AND YOU ARE STILL A COP. THE FILE HELD.'
      : 'HE IS IN THE GROUND AND SO IS THE FILE. NOBODY WROTE IT DOWN.', 40,
      { scale: 3, color: PIX.PAL.w }));
    const log = U.el('div', 'end-log');
    (G.log || []).slice(-8).forEach(line => {
      log.appendChild(UI.wrap(line, 46, { scale: 2, color: PIX.PAL.q }));
    });
    wrap.appendChild(log);
    const again = U.el('div', 'end-again');
    again.appendChild(UI.wrap('TAP TO OPEN A NEW CASE', 30, { scale: 3, color: PIX.PAL.G }));
    wrap.appendChild(again);
    wrap.onclick = () => UI.goto(() => { G.phase = 'title'; });
    app.appendChild(wrap);
  },

  buildEnd(app, won) {
    const wrap = U.el('div', 'splash');
    const s = META.stats();

    if (won) {
      const f = SPR.frogEl('player', 6, 'breathe');
      wrap.appendChild(f);
      wrap.appendChild(UI.txt('DEBT CLEARED', { scale: 7, color: PIX.PAL.G, outline: PIX.PAL.K }));
      wrap.appendChild(UI.txt('THE BULLFROG IS DOWN. THE SWAMP IS YOURS.', { scale: 3, color: PIX.PAL.w }));
    } else if (G.busted) {
      wrap.appendChild(PIX.el('ic_badge', 8));
      wrap.appendChild(UI.txt('THE BADGES TAKE YOUR MARKER', { scale: 5, color: PIX.PAL.L, outline: PIX.PAL.K }));
      wrap.appendChild(UI.txt('PROTECTION COMES DUE. IT ALWAYS DOES.', { scale: 3, color: PIX.PAL.q }));
    } else {
      const f = SPR.frogEl(G.duel && G.duel.opp.boss ? G.duel.opp.frog : 'owner', 6);
      f.style.filter = 'grayscale(.4) brightness(.8)';
      wrap.appendChild(f);
      wrap.appendChild(UI.txt('THE SWAMP KEEPS YOUR MARKER', { scale: 5, color: PIX.PAL.R, outline: PIX.PAL.K }));
    }

    const grid = U.el('div', 'end-grid');
    const cell = (label, v, col) => {
      const c = U.el('div', 'end-cell');
      c.appendChild(UI.txt(label, { scale: 3, color: PIX.PAL.q }));
      c.appendChild(UI.txt(String(v), { scale: 3, color: col || PIX.PAL.W }));
      grid.appendChild(c);
    };
    cell('CHAPTER', STORY.chapter().id, PIX.PAL.G);
    cell('MARKS DOWN', G.run.duelsWon);
    cell('SHOTS', G.run.shots);
    cell('DAMAGE', G.run.damage, PIX.PAL.R);
    cell('CHIPS', G.chips, PIX.PAL.G);
    cell('SEED', G.seedStr);
    wrap.appendChild(grid);

    const btns = U.el('div', 'end-btns');
    if (won) {
      const endless = U.el('button', 'pixbtn gold primary');
      endless.appendChild(UI.txt('KEEP PLAYING — ENDLESS', { scale: 4, shadow: null, color: PIX.PAL.K }));
      endless.onclick = () => { UI.goto(() => E.goEndless()); };
      btns.appendChild(endless);
    }
    const again = U.el('button', 'pixbtn' + (won ? '' : ' gold primary'));
    again.appendChild(UI.txt('AGAIN', { scale: 3, shadow: null, color: won ? PIX.PAL.W : PIX.PAL.K }));
    again.onclick = () => { UI.goto(() => E.newRun('')); };
    btns.appendChild(again);
    const title = U.el('button', 'pixbtn');
    title.appendChild(UI.txt('TITLE', { scale: 3, shadow: null }));
    title.onclick = () => { UI.goto(() => { G.phase = 'title'; }); };
    btns.appendChild(title);
    wrap.appendChild(btns);

    app.appendChild(wrap);
    if (won) { SFX.jackpot(); UI.particles('ic_chip', 22); UI.flash('go-gold'); }
    else SFX.lose();
  },

  /* ================= collection ================= */


  /* ================= fx (dom layer) ================= */

  flash(cls) {
    const f = document.getElementById('fx-flash');
    f.className = '';
    void f.offsetWidth;
    f.className = cls;
  },

  shake() {
    const s = document.getElementById('fx-shake');
    s.classList.remove('shake');
    void s.offsetWidth;
    s.classList.add('shake');
  },

  particles(spriteName, n) {
    const box = document.getElementById('fx-particles');
    for (let i = 0; i < n; i++) {
      const p = PIX.el(spriteName, Math.random() < 0.5 ? 2 : 3);
      p.classList.add('particle');
      p.style.left = (10 + Math.random() * 80) + 'vw';
      p.style.animationDuration = (0.9 + Math.random() * 1.2) + 's';
      p.style.animationDelay = Math.random() * 0.25 + 's';
      box.appendChild(p);
      setTimeout(() => p.remove(), 2500);
    }
  },

  /* ================= modal & tooltip ================= */

  /* ============================================================
     EVERY LETTER, IN THE PIXEL FONT.

     The panels that were built as HTML strings — help, the run
     sheet, tooltips — were the last places a browser font was
     still drawing text. This walks a subtree and replaces every
     text node with one small canvas PER WORD, so the browser
     still wraps between words but nothing is rendered by the
     system font any more.
     ============================================================ */
  PXCOL: { B: PIX.PAL.G, STRONG: PIX.PAL.G, H3: PIX.PAL.G, H4: PIX.PAL.N, EM: PIX.PAL.N, I: PIX.PAL.N },

  pixelize(root, base) {
    if (!root) return;
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);
    nodes.forEach(n => {
      /* the font has no em-dash, no curly quotes and no chip glyph — swap
         them for something it can actually draw instead of a row of '?' */
      const raw = (n.nodeValue || '')
        .replace(/[\u2014\u2013]/g, '-')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/\u26c1/g, '')
        .replace(/\u00d7/g, 'x')
        .replace(/\s+/g, ' ');
      if (!raw.trim()) return;
      const parent = n.parentElement;
      if (!parent || parent.classList.contains('pxw-done')) return;
      const tag = parent.tagName;
      const col = UI.PXCOL[tag] || base || PIX.PAL.w;
      const sc = (tag === 'H3') ? 3 : 2;
      const frag = document.createDocumentFragment();
      raw.trim().split(' ').forEach(w => {
        if (!w) return;
        const c = PIXFONT.render(w, { scale: sc, color: col, shadow: null });
        c.className = 'pxw';
        frag.appendChild(c);
      });
      parent.replaceChild(frag, n);
    });
  },

  modal(html, noClose) {
    const root = document.getElementById('modal-root');
    root.classList.remove('hidden');
    root.innerHTML = '';
    const m = U.el('div', 'modal', html);
    root.appendChild(m);
    UI.pixelize(m);
    if (!noClose) root.onclick = (e) => { if (e.target === root) UI.closeModal(); };
    else root.onclick = null;
    return m;
  },

  closeModal() {
    const root = document.getElementById('modal-root');
    root.classList.add('hidden');
    root.innerHTML = '';
  },

  modalOpen() {
    return !document.getElementById('modal-root').classList.contains('hidden');
  },

  PANEL_TIPS: {
    chips: () => `<b>CHIPS</b> — the only money down here. It comes out of corpses, and it goes to bribes and Swamp PD protection.`,
    ante: () => `<b>${STORY.chapter().title}</b> — ${STORY.chapter().obj.toLowerCase()}. Every chapter is three rooms; the last one is the frog who runs it, and he carries a piece of the board. After him, the department wants <b>${E.heatDue()}⛁</b> in protection.`,
    blind: () => `<b>THE LINE</b> — the crew drinks in this room and one of them is the frog you came for. Read the file on the bar, ask the barman, look each of them in the face, then name one. Name him right and the bounty pays 30% more; name him wrong and he sits down with an extra heart and the first pull.`,
    purse: () => `<b>THE TAKE</b> — roughly ${E.purse()} chips sewn into this mark, plus 1 per heart you keep, plus whatever his tells promise.`,
    heat: () => `<b>THE BADGES</b> — every pocket you rifle brings them closer. When they're at the door: bribe (${G.loot ? E.bribeCost() : '?'}⛁) or walk.`,
    clock: () => `<b>THE CLOCK</b> — real seconds, and it does not stop for you. Run it out and they come through the door.`,
    noise: () => `<b>NOISE</b> — every hand you put in him makes some, and it bleeds away if you hold still. Past the red line somebody has heard enough.`,
    mess: () => `<b>THE TRAIL</b> — what he left on the boards coming through the door. Tap a stain to go over it with the rag: it costs you seconds and a little noise. Walk out over the rest and somebody finds it in the morning — that is chips now and dearer protection later.`,
    counts: () => E.countsHidden()
      ? `<b>THE LOAD</b> — Blind Newt keeps the count to himself.`
      : `<b>THE LOAD</b> — this drum loaded with <b>${G.duel.lives} LIVE</b>, <b>${G.duel.blanks} blank</b>. What's left is on you to count.`,
    strip: () => `<b>THE DRUM</b> — shells in firing order. The one under the ${'▲'} hammer goes next. Blank on yourself = you keep the turn.`,
  },

  tooltipFor(el) {
    const ds = el.dataset;
    if (ds.tipOppTells) {
      const opp = G.duel && G.duel.opp;
      if (!opp) return null;
      const head = opp.boss
        ? `<div class="tt-name">${opp.name} <span class="rar-rare">${opp.rule}</span></div><div class="tt-desc">${opp.desc}</div>`
        : `<div class="tt-name">${opp.name}</div><div class="tt-desc">A nobody with a marker to collect.</div>`;
      const tells = opp.traits.length
        ? opp.traits.map(t => META.knowsTell(t)
            ? `<div class="tt-odds"><b>${TRAITS[t].name}</b> — ${TRAITS[t].desc}</div>`
            : `<div class="tt-odds"><b>???</b> — ${TRAITS[t].hint}. You haven't read this tell yet.</div>`).join('')
        : `<div class="tt-odds">No tells. A plain frog.</div>`;
      return head + tells;
    }
    if (ds.tipItem) {
      const it = ITEMS[ds.tipItem];
      const r = it.rarity.toUpperCase();
      const when = it.use === 'loot' ? 'at the corpse' : it.use === 'duel' ? 'at the table' : 'anywhere';
      return `<div class="tt-name">${it.name} <span class="rar-${it.rarity}">${r}</span></div>
        <div class="tt-desc">${it.desc}</div><div class="tt-odds">ONE SHOT — ${when}</div>`;
    }
    if (ds.tipGun) {
      const g = GUNS.find(x => x.id === ds.tipGun);
      return `<div class="tt-name">${g.name}</div><div class="tt-desc">${g.desc}</div>`;
    }
    if (ds.tipBoss) {
      const b = BOSSES.find(x => x.id === ds.tipBoss);
      return `<div class="tt-name">${b.name} <span class="rar-rare">${b.rule}</span></div><div class="tt-desc">${b.desc}</div>`;
    }
    if (ds.tipKey && UI.PANEL_TIPS[ds.tipKey]) {
      return `<div class="tt-desc">${UI.PANEL_TIPS[ds.tipKey]()}</div>`;
    }
    if (ds.tipText) return `<div class="tt-desc">${U.esc(ds.tipText)}</div>`;
    return null;
  },

  initTooltip() {
    const tip = document.getElementById('tooltip');
    /* touch: tap to toggle a tooltip pinned under the element */
    if (matchMedia('(hover: none)').matches) {
      document.addEventListener('click', (e) => {
        const t = e.target.closest('.has-tip');
        if (!t) { tip.classList.add('hidden'); return; }
        const html = UI.tooltipFor(t);
        if (!html) { tip.classList.add('hidden'); return; }
        tip.innerHTML = html;
        UI.pixelize(tip);
        tip.classList.remove('hidden');
        const r = t.getBoundingClientRect();
        const tr = tip.getBoundingClientRect();
        let x = Math.min(Math.max(6, r.left), innerWidth - tr.width - 6);
        let y = r.bottom + 8;
        if (y + tr.height > innerHeight - 6) y = Math.max(6, r.top - tr.height - 8);
        tip.style.left = x + 'px'; tip.style.top = y + 'px';
        setTimeout(() => tip.classList.add('hidden'), 3500);
      });
      return;
    }
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('.has-tip');
      if (!t) { tip.classList.add('hidden'); return; }
      const html = UI.tooltipFor(t);
      if (!html) { tip.classList.add('hidden'); return; }
      tip.innerHTML = html;
      UI.pixelize(tip);
      tip.classList.remove('hidden');
    });
    document.addEventListener('mousemove', (e) => {
      if (tip.classList.contains('hidden')) return;
      const pad = 14;
      let x = e.clientX + pad, y = e.clientY + pad;
      const r = tip.getBoundingClientRect();
      if (x + r.width > innerWidth - 8) x = e.clientX - r.width - pad;
      if (y + r.height > innerHeight - 8) y = e.clientY - r.height - pad;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    });
  },

  /* ================= help ================= */

  showHelp() {
    const binds = BINDS.map(([k, v]) => `<p><b>${k}</b> — ${v}</p>`).join('');
    UI.modal(`
      <button class="pixbtn m-close" id="mm-close"></button>
      <div class="help-cols">
        <div>
          <h4>THE DUEL</h4>
          <p>A drum loads with <b>LIVE</b> 🔴 and <b>blank</b> ⚪ shells — you see the mix, not the order.
          Take turns. Aim at <b>the mark</b> or at <b>yourself</b>, then pull.</p>
          <h4>THE ONLY RULE THAT MATTERS</h4>
          <p>A <b>blank into your own head keeps your turn</b>. A live one costs a heart.
          Live into the mark hurts him; blank into him wastes the pull. Empty drum reloads.</p>
          <h4>HEARTS ❤</h4>
          <p>Zero hearts, and the duel — and whoever ran out — is over. Lose and the swamp
          keeps your marker. Hearts refill each duel.</p>
          <h4>THE NIGHT</h4>
          <p>8 antes, 3 blinds each: SMALL, BIG, then a <b>BOSS</b> — one of the Bullfrog's
          people, each with his own house rule. Win a duel: purse + 1 chip per heart kept.</p>
        </div>
        <div>
          <h4>THE LOOT</h4>
          <p>Kill the mark, go through his pockets. Every rifle brings <b>the badges</b>
          closer — three and they're at the door. <b>Bribe</b> to keep digging or walk with
          what you've got. Trinket cards (5 slots, keys 1–5) and guns come out of corpses —
          boss holsters carry your next iron.</p>
          <h4>TELLS</h4>
          <p>What a frog wears is how he plays: a top hat means money, an eye patch means
          he shoots first, the sweats mean he'd rather risk his own head. Loot a frog to
          learn his tells for good — then <b>hover the mark's name</b> to read him.</p>
          <h4>SWAMP PD</h4>
          <p>After every boss, protection money comes due — it scales with the ante.
          Can't pay? They take your marker. That's the debt now.</p>
          <h4>KEYS</h4>
          ${binds}
        </div>
      </div>
    `);
    const c = document.querySelector('#mm-close');
    c.appendChild(UI.txt('X', { scale: 3, color: PIX.PAL.W, shadow: null }));
    c.onclick = () => UI.closeModal();
  },

  /* ================= keys ================= */

  initKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') {
        if (e.key === 'Enter' && G.phase === 'title') document.getElementById('btn-deal').click();
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'm') { document.getElementById('btn-mute') ? document.getElementById('btn-mute').click() : SFX.toggleMute(); return; }
      if (k === 'h' || e.key === '?') { UI.modalOpen() ? UI.closeModal() : UI.showHelp(); return; }
      /* the phone, out of your coat, anywhere you can walk */
      if (k === 'p' && typeof PHONE !== 'undefined' && UI.isScene(G.phase)) {
        PHONE.toggle('map'); return;
      }
      if (e.key === 'Escape' && typeof PHONE !== 'undefined' && PHONE.isOpen()) {
        PHONE.close(); return;
      }
      if (e.key === 'Escape') { UI.closeModal(); return; }
      if (e.key === 'Tab' && (G.phase === 'duel' || G.phase === 'blind' || G.phase === 'loot')) {
        e.preventDefault();
        UI.modalOpen() ? UI.closeModal() : UI.showRunInfo();
        return;
      }
      if (UI.modalOpen()) return;

      /* overlay primary button eats Enter/Space */
      const prim = document.querySelector('#duel-overlay:not(.hidden) .primary, .splash .primary');
      if (prim && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); prim.click(); return; }

      if (G.phase === 'title' && e.key === 'Enter') { document.getElementById('btn-deal').click(); return; }

      if (G.phase === 'blind') {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('btn-sit').click(); }
        else if (k === 's' && document.getElementById('btn-skip')) document.getElementById('btn-skip').click();
      } else if (G.phase === 'duel') {
        if (k === 'a' || e.key === 'ArrowLeft') DUEL.setAim('self');
        else if (k === 'd' || e.key === 'ArrowRight') DUEL.setAim('foe');
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); DUEL.onFire(); }
        else if (k >= '6' && k <= '9') UI.onUseItem(+k - 6);
        else if (k === 'q') DUEL.useGunActive('saw');
        else if (k === 'e') DUEL.useGunActive('tommy');
      } else if (G.phase === 'loot') {
        if (k === 'r') LOOT.onBribe();
        else if (k >= '6' && k <= '9') UI.onUseItem(+k - 6);
        else if (k >= '1' && k <= '9') LOOT.rifleKey(+k);
      }
    });
  },
};
