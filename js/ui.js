'use strict';
/* ============================================================
   SHELL & DEBT — ui.js
   Screens & chrome: title, the duel frame (strip, cards,
   controls), overlays (boss intro, payout), collection,
   end screens, tooltips, help, keybinds.
   Mostly wordless: icons + pixel numerals, hover for truth.
   ============================================================ */

/* item cards: the trinket chassis in brass, with belt-tag punch holes */
SPR.itemCard = function (id) {
  return SPR.cached('icard_' + id, () => {
    const it = ITEMS[id], P = PIX.PAL;
    const rc = TRINKET_RAR[it.rarity] || TRINKET_RAR.common;
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
    UI.closeModal();
    if (G.phase !== 'duel' && G.phase !== 'loot') DUEL.stop();
    BG.set({
      title: 'title', collection: 'title', station: 'title',
      duel: G.duel && G.duel.opp && G.duel.opp.boss ? 'boss' : 'round',
      blind: G.duel && G.duel.opp && G.duel.opp.boss ? 'boss' : 'casino',
      loot: G.phase === 'loot' && G.loot && G.loot.dragged ? 'back' : 'casino',
      over: 'dead', won: 'win',
    }[G.phase] || 'round');
    switch (G.phase) {
      case 'title':      UI.buildTitle(app); break;
      case 'collection': UI.buildCollection(app); break;
      case 'station':    UI.buildStation(app); break;
      case 'blind':      UI.buildBlindSelect(app); break;
      case 'duel':
      case 'loot':       UI.buildDuel(app); DUEL.enter(); break;
      case 'over':       UI.buildEnd(app, false); break;
      case 'won':        UI.buildEnd(app, true); break;
    }
    /* card backs drifting behind the quiet screens */
    CINE.ambient(G.phase === 'title' || G.phase === 'collection' || G.phase === 'blind' || G.phase === 'station');
    if (typeof TUTOR !== 'undefined' && TUTOR.armed()) setTimeout(() => TUTOR.check(), 260);
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
    logo.dataset.tipText = 'SHELL & DEBT — seed ' + G.seedStr;
    logo.appendChild(UI.txt('S&D', { scale: 3, color: PIX.PAL.g }));
    L.appendChild(logo);

    /* ante + blind pips */
    const ante = U.el('span', 'has-tip tb-chip');
    ante.dataset.tipKey = 'ante';
    ante.appendChild(UI.txt('FLOOR ' + G.ante, { scale: 3, color: PIX.PAL.W }));
    C.appendChild(ante);
    const pips = U.el('span', 'ante-track has-tip');
    pips.dataset.tipKey = 'blind';
    const LAB = ['S', 'B', '*'];
    for (let i = 0; i < 3; i++) {
      if (i) pips.appendChild(U.el('i', 'at-link' + (i <= G.blind ? ' done' : '')));
      const seg = U.el('span', 'at-seg' + (i < G.blind ? ' done' : i === G.blind ? ' now' : '') + (i === 2 ? ' boss' : ''));
      const lab = U.el('span', 'at-lab'); lab.textContent = LAB[i];
      seg.appendChild(lab);
      seg.appendChild(U.el('span', 'bpip'));
      pips.appendChild(seg);
    }
    C.appendChild(pips);
    const purse = U.el('span', 'tb-chip has-tip');
    purse.dataset.tipKey = 'purse';
    purse.appendChild(UI.txt(String(E.purse()), { scale: 3, color: PIX.PAL.G }));
    purse.appendChild(UI.icon('ic_chip', 3));
    C.appendChild(purse);

    /* chips */
    const chips = U.el('span', 'tb-chip has-tip');
    chips.id = 'tb-chips';
    chips.dataset.tipKey = 'chips';
    chips.appendChild(UI.icon('ic_chip', 3));
    const cnum = U.el('span'); cnum.id = 'tb-chip-num';
    cnum.appendChild(UI.num(G.chips, { color: PIX.PAL.G }));
    chips.appendChild(cnum);
    R.appendChild(chips);

    const mute = U.el('button', 'pixbtn tb-btn');
    mute.id = 'btn-mute';
    mute.appendChild(UI.txt(SFX.muted ? 'X' : ')))', { scale: 3, shadow: null, color: PIX.PAL.w }));
    mute.onclick = () => { SFX.toggleMute(); UI.put(mute, UI.txt(SFX.muted ? 'X' : ')))', { scale: 3, shadow: null, color: PIX.PAL.w })); };
    R.appendChild(mute);
    const help = U.el('button', 'pixbtn tb-btn');
    help.appendChild(UI.txt('?', { scale: 3, shadow: null, color: PIX.PAL.G }));
    help.onclick = () => UI.showHelp();
    R.appendChild(help);

    bar.appendChild(L); bar.appendChild(C); bar.appendChild(R);
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

  buildTitle(app) {
    const s = META.stats();
    const wrap = U.el('div', 'splash board-title');

    /* ---- the murder board: everything on it is pinned, taped or stabbed ---- */
    const board = U.el('div', 'mboard');

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
    }), U.clamp(Math.floor(window.innerWidth / 340), 2, 4)));
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
      m.appendChild(SPR.clone(SPR.mugshot(id, FROG_DEFS[id], 1), 2));
      const tag = U.el('div', 'mb-name');
      tag.appendChild(UI.txt(nm, { scale: 2, color: PIX.PAL.K, shadow: null }));
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
    tagWrap.appendChild(UI.txt('CASE NO.', { scale: 2, color: PIX.PAL.K, shadow: null }));
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
      rec.appendChild(UI.txt('BEST FLOOR ' + s.bestAnte + ' / CLOSED ' + s.wins + ' / LOST ' + s.deaths,
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
      }).then(() => CINE.reloadRoom())
        .then(() => CINE.driveTo())
        .then(() => { UI.render(); return TUTOR.open(); });
    };
    btns.appendChild(deal);

    const hlp = U.el('button', 'pixbtn');
    hlp.appendChild(UI.txt('HOUSE RULES', { scale: 3, shadow: null }));
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
  buildStation(app) {
    const bar = U.el('div'); UI.buildTopbar(bar); app.appendChild(bar);
    const wrap = U.el('div', 'station-wrap');

    /* the room, drawn */
    const cv = document.createElement('canvas');
    const K = U.clamp(Math.floor(Math.min(window.innerWidth / 200, (window.innerHeight - 220) / 120)), 2, 7);
    cv.width = 190 * K; cv.height = 112 * K;
    cv.className = 'pix station-room';
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.scale(K, K);
    const P = PIX.PAL;
    PIX.rect(c, 0, 0, 190, 112, '#141822');
    for (let y = 0; y < 74; y += 5) PIX.rect(c, 0, y, 190, 1, 'rgba(0,0,0,.16)');
    PIX.rect(c, 0, 74, 190, 38, '#1a1610');                       // floorboards
    for (let i = 0; i < 10; i++) PIX.rect(c, i * 20, 74, 1, 38, 'rgba(0,0,0,.3)');
    PIX.rect(c, 0, 74, 190, 2, '#2c2114');
    /* the notice board, with the tiny wall of faces */
    PIX.rect(c, 10, 14, 52, 38, '#241a10');
    PIX.rect(c, 12, 16, 48, 34, '#6b4426');
    for (let i = 0; i < 6; i++) {
      PIX.rect(c, 16 + (i % 3) * 15, 20 + Math.floor(i / 3) * 16, 11, 12, '#ded2b4');
      PIX.rect(c, 18 + (i % 3) * 15, 22 + Math.floor(i / 3) * 16, 7, 7, '#141820');
    }
    /* the counter the captain lives behind */
    PIX.rect(c, 118, 52, 64, 26, P.K);
    PIX.rect(c, 120, 54, 60, 22, '#2c2114');
    PIX.rect(c, 120, 54, 60, 3, '#3a2c18');
    /* the hanging light */
    PIX.rect(c, 94, 0, 2, 12, '#232018');
    PIX.rect(c, 88, 12, 14, 5, '#3a3020');
    c.globalAlpha = 0.13; c.fillStyle = '#ffd75e';
    c.beginPath(); c.moveTo(95, 16); c.lineTo(60, 82); c.lineTo(130, 82); c.closePath(); c.fill();
    c.globalAlpha = 1;
    /* the cell, stage right */
    for (let i = 0; i < 5; i++) PIX.rect(c, 168 + i * 4, 14, 2, 38, '#0e1118');
    wrap.appendChild(cv);

    /* the two of them, standing in the room */
    const folk = U.el('div', 'station-folk');
    const cap = U.el('div', 'st-frog st-cap');
    cap.appendChild(SPR.clone(SPR.frogCustom('handler', HANDLER_DEF), 3));
    cap.appendChild(UI.txt('THE CAPTAIN', { scale: 2, color: PIX.PAL.L }));
    folk.appendChild(cap);
    const may = U.el('div', 'st-frog st-may');
    may.appendChild(SPR.clone(SPR.frogCustom('maybelle', MAYBELLE_DEF), 3));
    const heartRow = U.el('div', 'st-hearts');
    const tr = META.load().trust || 0;
    for (let i = 0; i < 3; i++) {
      heartRow.appendChild(PIX.el(tr >= (i + 1) * 3 ? 'ic_heart' : 'ic_heart_e', 1));
    }
    may.appendChild(UI.txt('OFFICER MAYBELLE', { scale: 2, color: PIX.PAL.P }));
    may.appendChild(heartRow);
    folk.appendChild(may);
    wrap.appendChild(folk);

    /* the choices */
    const btns = U.el('div', 'blind-btns');
    const go = U.el('button', 'pixbtn gold primary big-deal');
    go.id = 'btn-board';
    go.appendChild(UI.txt('THE CASE BOARD', { scale: 4, shadow: null, color: PIX.PAL.K }));
    const kh = U.el('span', 'key-hint'); kh.textContent = 'ENTER';
    go.appendChild(kh);
    go.onclick = () => { SFX.chak(); UI.goto(() => { G.phase = 'blind'; }); };
    btns.appendChild(go);

    const tc = U.el('button', 'pixbtn cop');
    tc.id = 'btn-talk-cap';
    tc.appendChild(UI.txt('TALK: CAPTAIN', { scale: 3, shadow: null }));
    tc.onclick = () => UI.talkCaptain();
    btns.appendChild(tc);

    const tm = U.el('button', 'pixbtn');
    tm.id = 'btn-talk-may';
    tm.appendChild(UI.txt('TALK: MAYBELLE', { scale: 3, shadow: null }));
    tm.onclick = () => UI.talkMaybelle();
    btns.appendChild(tm);
    wrap.appendChild(btns);

    app.appendChild(wrap);
  },

  /* the captain: one job, three moods */
  async talkCaptain() {
    if (UI._talking) return;
    UI._talking = true;
    try {
      const cap = { art: SPR.frogCustom('handler', HANDLER_DEF), name: 'THE CAPTAIN', nameCol: PIX.PAL.L };
      if (!G.capTalked) {
        G.capTalked = true;
        const brief = E.blindName() + (G.duel.opp.boss ? '. IT IS ' + G.duel.opp.name + '. NO LINE-UP TONIGHT.' :
          '. ' + (G.case ? G.case.suspects.length : 3) + ' OF THEM IN THE ROOM.');
        await TUTOR.say('FLOOR ' + G.ante + '. ' + brief, cap);
        await TUTOR.say(U.pick(Math.random, [
          'PAPERWORK SAYS YOU WERE NEVER THERE. KEEP IT THAT WAY.',
          'THE CITY PAYS ME TO NOT LOOK. DO NOT MAKE IT HARD.',
          'COME BACK IN ONE PIECE OR DO NOT COME BACK AT ALL.',
        ]), cap);
      } else {
        await TUTOR.say('THE BOARD, DETECTIVE. IT IS NOT GETTING ANY COLDER.', cap);
      }
    } finally { UI._talking = false; }
  },

  /* Maybelle: trust is slow, real, and it helps */
  async talkMaybelle() {
    if (UI._talking) return;
    UI._talking = true;
    try {
      const may = { art: SPR.frogCustom('maybelle', MAYBELLE_DEF), name: 'OFFICER MAYBELLE', nameCol: PIX.PAL.P, rim: PIX.PAL.p };
      const d = META.load();
      if (G.mayTalked) {
        await TUTOR.say(U.pick(Math.random, [
          'GO ON. AND COME BACK.',
          'I WILL KEEP THE COFFEE WARM.',
          'YOU KNOW WHERE I AM.',
        ]), may);
        return;
      }
      G.mayTalked = true;
      d.trust = (d.trust || 0) + 1;
      META.save();
      const t = d.trust;
      if (t < 3) {
        await TUTOR.say(U.pick(Math.random, [
          'LATE ONE AGAIN? I SIGNED YOU IN AT EIGHT. YOU OWE ME NOTHING.',
          'THE DESK SERGEANT ASKED WHO STILL BRINGS YOU CASES. I SAID NOBODY ASKS THAT.',
          'YOU LOOK TIRED, DETECTIVE. THAT IS NOT A CRITICISM. IT IS A WORRY.',
        ]), may);
      } else if (t < 6) {
        G.chips += 4; UI.syncChips(); UI.chipTick(4);
        await TUTOR.say('I PUT COFFEE MONEY IN YOUR COAT. DO NOT ARGUE WITH ME ABOUT IT.', may);
        UI.stampSmall('+4 FROM MAYBELLE');
      } else if (t < 9) {
        G.mayLook = true;
        if (G.case && !G.case.done && !G.case.known) G.case.looks++;
        await TUTOR.say('I PULLED THE FILE BEFORE THE SHIFT CHANGE. ONE MORE LOOK IS IN THERE FOR YOU.', may);
        UI.stampSmall('MAYBELLE: +1 LOOK, ALL NIGHT');
      } else {
        G.mayHeart = true;
        G.hearts = E.maxHP();
        await TUTOR.say('WHATEVER HAPPENS UP THERE... COME HOME AFTER. YOU HEAR ME?', may);
        await TUTOR.say('...I MEAN IT.', may);
        UI.stampSmall('MAYBELLE: +1 HEART, ALL NIGHT');
        SFX.bank();
      }
    } finally { UI._talking = false; }
  },

  /* ================= the board ================= */

  /* A wanted poster: his face, his name, and the pin that holds it up. */
  /* One frog in the line, full length, against the height chart. Crossed
     off, he goes grey under a stepped red X. Called out, he steps forward. */
  posterEl(s, i, out, called, small) {
    const p = U.el('div', 'suspect' + (out ? ' out' : '') + (called ? ' called' : ''));
    p.dataset.sus = i;
    const k = small ? 2 : 3;
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
    const sc = s.name.length > (small ? 8 : 10) ? 1 : small ? 1 : 2;
    nm.appendChild(UI.txt('N.' + (i + 1), { scale: 1, color: PIX.PAL.q, shadow: null }));
    nm.appendChild(UI.txt(s.name, { scale: sc, color: PIX.PAL.K, shadow: null }));
    p.appendChild(nm);
    return p;
  },

  buildBlindSelect(app) {
    const bar = U.el('div'); UI.buildTopbar(bar); app.appendChild(bar);
    const opp = G.duel.opp;
    if (!G.case) CASE.build();
    const c = G.case;
    const wrap = U.el('div', 'board-wrap');

    const head = U.el('div', 'board-head');
    head.appendChild(UI.txt('FLOOR ' + G.ante + (G.endless ? ' · ENDLESS' : ' OF ' + ANTES),
      { scale: 3, color: PIX.PAL.q }));
    head.appendChild(UI.txt(c.known ? 'YOU KNOW THIS ONE'
      : c.suspects.length + ' IN THE ROOM - ONE OF THEM IS HIM',
      { scale: 4, color: c.known ? PIX.PAL.R : PIX.PAL.W, outline: PIX.PAL.K }));
    const pay = U.el('div', 'board-purse');
    pay.appendChild(UI.txt('BOUNTY ' + BLIND_PURSE(G.ante, G.blind), { scale: 3, color: PIX.PAL.G }));
    pay.appendChild(UI.icon('ic_chip', 3));
    head.appendChild(pay);
    wrap.appendChild(head);

    /* ---- the line-up room: the height wall, and everybody against it ---- */
    const board = U.el('div', 'cork lineup');
    board.id = 'cork';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'strings');
    svg.id = 'cork-strings';
    board.appendChild(svg);

    const row = U.el('div', 'lineup-row' + (c.suspects.length > 5 ? ' wall' : ''));
    const stand = c.known ? [true] : CASE.standing();
    c.suspects.forEach((s, i) => {
      const out = !stand[i];
      const called = c.done && c.accused === i;
      const p = UI.posterEl(s, i, out, called, c.suspects.length > 5);
      if (c.known) p.classList.add('solo');
      if (!c.done && !out) {
        p.classList.add('live');
        p.onclick = () => {
          SFX.chak();
          const right = CASE.accuse(i);
          UI.render();
          UI.callOut(right);
        };
      }
      if (c.done && c.accused === i) {
        const st = U.el('div', 'sus-stamp');
        st.appendChild(UI.wrap(c.right ? 'THAT IS HIM' : 'WRONG MAN', 8,
          { scale: 2, color: c.right ? PIX.PAL.G : PIX.PAL.R, outline: PIX.PAL.K }));
        p.appendChild(st);
      }
      row.appendChild(p);
    });
    board.appendChild(row);

    /* ---- the case file: evidence you can turn over ---- */
    if (!c.known) {
      const file = U.el('div', 'casefile');
      const fh = U.el('div', 'cf-head');
      fh.appendChild(UI.txt('CASE FILE', { scale: 3, color: PIX.PAL.W }));
      fh.appendChild(UI.txt(c.done ? 'CLOSED'
        : c.looks + (c.looks === 1 ? ' LOOK LEFT' : ' LOOKS LEFT'),
        { scale: 3, color: c.looks > 0 && !c.done ? PIX.PAL.G : PIX.PAL.q }));
      file.appendChild(fh);
      const cards = U.el('div', 'ev-row');
      c.clues.forEach((cl, i) => {
        const ev = U.el('div', 'ev' + (cl.seen ? ' up' : ''));
        ev.dataset.clue = i;
        if (cl.seen) {
          ev.appendChild(PIX.el(cl.icon, 3));
          ev.appendChild(UI.wrap(cl.text, 10, { scale: 2, color: PIX.PAL.K, shadow: null }));
        } else {
          ev.appendChild(SPR.clone(SPR.cardBack(), 3));
          if (!c.done && c.looks > 0) {
            ev.classList.add('live');
            ev.onclick = () => { if (CASE.flip(i)) { SFX.deal(); UI.render(); } };
          }
        }
        cards.appendChild(ev);
      });
      file.appendChild(cards);
      board.appendChild(file);

      /* ---- and the questions: you ask, the room answers, faces come down ---- */
      const quiz = U.el('div', 'casefile asks');
      const qh = U.el('div', 'cf-head');
      qh.appendChild(UI.txt('ASK THE ROOM', { scale: 3, color: PIX.PAL.W }));
      qh.appendChild(UI.txt(c.done ? 'NOBODY IS TALKING NOW'
        : c.quiz + (c.quiz === 1 ? ' QUESTION LEFT' : ' QUESTIONS LEFT'),
        { scale: 3, color: c.quiz > 0 && !c.done ? PIX.PAL.N : PIX.PAL.q }));
      qh.appendChild(UI.txt(CASE.left() + ' STILL IN IT', { scale: 3, color: PIX.PAL.O }));
      quiz.appendChild(qh);
      const qrow = U.el('div', 'ask-row');
      (c.asks || []).forEach((a, i) => {
        const b = U.el('button', 'pixbtn ask' + (a.asked ? ' asked' : ''));
        b.disabled = a.asked || !CASE.canAsk(i);
        const col = U.el('div', 'ask-col');
        col.appendChild(UI.wrap(a.ask, 22, { scale: 2, color: a.asked ? PIX.PAL.q : PIX.PAL.W }));
        if (a.asked) col.appendChild(UI.wrap(a.reply, 24, { scale: 2, color: PIX.PAL.N }));
        b.appendChild(col);
        if (!a.asked) {
          b.onclick = () => {
            const ev = CASE.ask(i);
            if (!ev) { SFX.dud(); return; }
            SFX.chak();
            UI.render();
            UI.askedToast(ev);
          };
        }
        qrow.appendChild(b);
      });
      quiz.appendChild(qrow);
      board.appendChild(quiz);
    }
    wrap.appendChild(board);

    /* ---- his tells, once you have named him ---- */
    if (c.done && c.right && opp.traits && opp.traits.length) {
      const tl = U.el('div', 'tell-row');
      opp.traits.forEach(t => {
        const known = META.knowsTell(t);
        const chip = U.el('span', 'bc-tell has-tip' + (known ? '' : ' unknown'));
        chip.appendChild(UI.txt(known ? TRAITS[t].name : '???',
          { scale: 3, color: known ? PIX.PAL.N : PIX.PAL.q }));
        chip.dataset.tipText = known ? TRAITS[t].desc
          : TRAITS[t].hint + ' - you have not read this tell yet.';
        tl.appendChild(chip);
      });
      wrap.appendChild(tl);
    }

    const btns = U.el('div', 'blind-btns');
    const sit = U.el('button', 'pixbtn gold primary big-deal');
    sit.id = 'btn-sit';
    sit.appendChild(SPR.gunEl(E.gun().id, 2));
    sit.appendChild(UI.txt('MOVE IN', { scale: 4, shadow: null, color: PIX.PAL.K }));
    const kh = U.el('span', 'key-hint'); kh.textContent = 'ENTER';
    sit.appendChild(kh);
    sit.onclick = () => { SFX.chak(); UI.goto(() => E.sitDown()); };
    btns.appendChild(sit);

    if (!c.known && !c.done) {
      /* No shop and nothing to own. When the file runs dry you can still put
         something in somebody's hand for one more look, and it costs more
         every time you ask. */
      const g = U.el('button', 'pixbtn cop has-tip');
      g.id = 'btn-grease';
      g.disabled = !CASE.canGrease();
      g.dataset.tipText = 'Somebody in this room will turn one more card over ' +
        'for money. The price goes up every time you ask.';
      g.appendChild(UI.txt('GREASE A PALM', { scale: 3, shadow: null }));
      g.appendChild(UI.txt(String(CASE.greaseCost()), { scale: 3, color: PIX.PAL.G, shadow: null }));
      g.appendChild(PIX.el('ic_chip', 2));
      g.onclick = () => { if (CASE.grease()) { SFX.coin(); UI.render(); } else SFX.dud(); };
      btns.appendChild(g);
    }

    if (E.canSkip()) {
      const skip = U.el('button', 'pixbtn ghost has-tip');
      skip.id = 'btn-skip';
      skip.dataset.tipText = 'Walk past this chair: no purse and no corpse to go through, ' +
        'but somebody in the room owes you a favour instead.';
      skip.appendChild(UI.txt('SKIP FOR A TAG', { scale: 3, shadow: null }));
      const k2 = U.el('span', 'key-hint'); k2.textContent = 'S';
      skip.appendChild(k2);
      skip.onclick = () => {
        let t = null;
        SFX.deal();
        UI.goto(() => { t = E.skipBlind(); }).then(() => {
          if (t) UI.tagToast(t);
        });
      };
      btns.appendChild(skip);
    }

    const info = U.el('button', 'pixbtn has-tip');
    info.id = 'btn-run';
    info.dataset.tipText = 'Everything you are carrying. [TAB]';
    info.appendChild(UI.txt('THE RUN', { scale: 3, shadow: null }));
    info.onclick = () => UI.showRunInfo();
    btns.appendChild(info);
    wrap.appendChild(btns);

    app.appendChild(wrap);
    requestAnimationFrame(UI.drawStrings);
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

  tagToast(t) {
    const box = document.getElementById('fx-particles');
    const el = U.el('div', 'unlock-toast pop');
    el.appendChild(PIX.el(t.icon, 3));
    const col = U.el('div');
    col.appendChild(UI.txt('TAG TAKEN', { scale: 3, color: PIX.PAL.N }));
    col.appendChild(UI.txt(t.name, { scale: 3, color: PIX.PAL.W }));
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
      '<div class="ri-stat"><b>' + r.ante + (r.endless ? '' : '/' + ANTES) + '</b><span>ANTE</span></div>' +
      '<div class="ri-stat"><b>' + r.blindName.split(' ')[0] + '</b><span>BLIND</span></div>' +
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

    /* bottom: trinkets + gun + controls */
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

    /* counts: banner numbers live only with the bead counter */
    const counts = document.getElementById('strip-counts');
    if (counts) {
      counts.innerHTML = '';
      if (E.countsHidden()) {
        counts.appendChild(UI.txt('? / ?', { scale: 3, color: PIX.PAL.q }));
      } else if (E.has('counter')) {
        const { l, b } = E.remaining();
        counts.appendChild(UI.txt(l + '', { scale: 3, color: PIX.PAL.R }));
        counts.appendChild(UI.txt('/', { scale: 3, color: PIX.PAL.q }));
        counts.appendChild(UI.txt(b + '', { scale: 3, color: PIX.PAL.w }));
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

    UI.syncTrinkets();
    UI.syncItems();
    UI.syncGunPanel();
    if (typeof TUTOR !== 'undefined' && TUTOR.armed()) TUTOR.check();
  },

  syncTrinkets() {
    const tr = document.getElementById('trinket-row');
    if (!tr) return;
    tr.innerHTML = '';
    for (let i = 0; i < MAX_TRINKETS; i++) {
      const t = G.trinkets[i];
      if (!t) { tr.appendChild(U.el('span', 'tslot-empty')); continue; }
      const def = TRINKETS[t.id];
      const card = U.el('button', 'tcard has-tip rq-' + def.rarity);
      card.dataset.tipTrinket = t.id;
      card.appendChild(SPR.trinketCardEl(t.id, 4));
      if (def.active) {
        const key = U.el('span', 'key-hint tk'); key.textContent = i + 1;
        card.appendChild(key);
        const pips = U.el('span', 'charge-pips');
        const left = E.chargesLeft(t);
        const max = def.active.per === 'reload' ? (E.has('watch') ? 2 : 1) : 1;
        for (let c = 0; c < max; c++) pips.appendChild(U.el('i', 'cpip' + (c < left ? ' on' : '')));
        card.appendChild(pips);
        card.disabled = !E.canUseTrinket(i) || DUEL.busy;
        card.onclick = () => DUEL.useTrinket(i);
      } else {
        card.disabled = false;
        card.classList.add('passive');
      }
      if (G.phase === 'duel' && E.trinketsLocked() && def.active) card.classList.add('locked');
      tr.appendChild(card);
    }
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
    UI.stampBig(E.blindName(), G.blind === 2 ? PIX.PAL.R : PIX.PAL.G, true);
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

  bossIntro(opp) {
    return new Promise(res => {
      const o = document.getElementById('duel-overlay');
      o.className = 'boss-in';
      o.innerHTML = '';
      const card = U.el('div', 'boss-card slam');
      card.appendChild(SPR.clone(SPR.frogCustom(opp.boss + ':intro', opp.def), 5));
      card.appendChild(UI.txt(opp.name, { scale: 5, color: PIX.PAL.R, outline: PIX.PAL.K }));
      card.appendChild(UI.txt(opp.rule, { scale: 3, color: PIX.PAL.G }));
      const desc = U.el('p', 'boss-desc');
      desc.textContent = opp.desc;
      card.appendChild(desc);
      const purse = U.el('div', 'load-row');
      purse.appendChild(UI.txt('PURSE ' + E.purse(), { scale: 3, color: PIX.PAL.G }));
      purse.appendChild(UI.icon('ic_chip', 3));
      card.appendChild(purse);
      const go = U.el('button', 'pixbtn gold primary');
      go.appendChild(UI.txt('SIT DOWN', { scale: 4, shadow: null, color: PIX.PAL.K }));
      go.onclick = () => { o.className = 'hidden'; o.innerHTML = ''; res(); };
      card.appendChild(go);
      o.appendChild(card);
      UI.shake();
      SFX.lose();
    });
  },

  /* a tell goes into the little black book */
  tellToast(traitId) {
    const t = TRAITS[traitId];
    const box = document.getElementById('fx-particles');
    const el = U.el('div', 'unlock-toast pop');
    el.appendChild(PIX.el('ic_book', 3));
    const col = U.el('div');
    col.appendChild(UI.txt('NEW TELL', { scale: 3, color: PIX.PAL.N }));
    col.appendChild(UI.txt(t.name, { scale: 3, color: PIX.PAL.W }));
    el.appendChild(col);
    box.appendChild(el);
    SFX.bank();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 2600);
  },

  unlockToast(t) {
    const box = document.getElementById('fx-particles');
    const el = U.el('div', 'unlock-toast pop');
    el.appendChild(SPR.trinketCardEl(t.id, 2));
    const col = U.el('div');
    col.appendChild(UI.txt('NEW TRINKET', { scale: 3, color: PIX.PAL.G }));
    col.appendChild(UI.txt(t.name, { scale: 3, color: PIX.PAL.W }));
    el.appendChild(col);
    box.appendChild(el);
    SFX.jackpot();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 2600);
  },

  /* ================= end screens ================= */

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
    cell('ANTE', G.ante, PIX.PAL.G);
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

  buildCollection(app) {
    const meta = META.load();
    const wrap = U.el('div', 'coll-wrap');

    const head = U.el('div', 'coll-head');
    head.appendChild(UI.txt('THE COLLECTION', { scale: 5, color: PIX.PAL.G, outline: PIX.PAL.K }));
    const back = U.el('button', 'pixbtn primary');
    back.id = 'btn-back';
    back.appendChild(UI.txt('BACK', { scale: 3, shadow: null }));
    back.onclick = () => { UI.goto(() => { G.phase = 'title'; }); };
    head.appendChild(back);
    wrap.appendChild(head);

    /* trinkets */
    const t1 = U.el('div', 'coll-sec');
    t1.appendChild(UI.txt('TRINKETS', { scale: 3, color: PIX.PAL.w }));
    const tg = U.el('div', 'coll-grid');
    Object.values(TRINKETS).forEach(t => {
      const open = META.isUnlocked(t.id);
      const cardw = U.el('span', 'has-tip coll-card');
      if (open) {
        cardw.dataset.tipTrinket = t.id;
        cardw.appendChild(SPR.trinketCardEl(t.id, 4));
      } else {
        cardw.dataset.tipText = 'LOCKED — ' + t.unlock.hint + '.';
        cardw.appendChild(SPR.clone(SPR.cardBack(), 4));
      }
      tg.appendChild(cardw);
    });
    t1.appendChild(tg);
    wrap.appendChild(t1);

    /* guns */
    const t2 = U.el('div', 'coll-sec');
    t2.appendChild(UI.txt('THE IRON', { scale: 3, color: PIX.PAL.w }));
    const gg = U.el('div', 'coll-grid');
    GUNS.forEach(g => {
      const owned = meta.gunsOwned[g.id];
      const w = U.el('span', 'has-tip coll-gun');
      w.dataset.tipGun = g.id;
      const el = SPR.gunEl(g.id, 2);
      if (!owned) el.style.filter = 'brightness(0) opacity(.45)';
      w.appendChild(el);
      gg.appendChild(w);
    });
    t2.appendChild(gg);
    wrap.appendChild(t2);

    /* the mob */
    const t3 = U.el('div', 'coll-sec');
    t3.appendChild(UI.txt('THE MOB', { scale: 3, color: PIX.PAL.w }));
    const bg2 = U.el('div', 'coll-grid');
    BOSSES.forEach(b => {
      const kills = meta.bossSeen[b.id] || 0;
      const w = U.el('span', 'has-tip coll-boss');
      const el = SPR.frogEl(b.id, 3);
      if (kills) {
        w.dataset.tipBoss = b.id;
        const k = U.el('div', 'boss-kills');
        k.appendChild(UI.txt('×' + kills, { scale: 3, color: PIX.PAL.G }));
        w.appendChild(el); w.appendChild(k);
      } else {
        w.dataset.tipText = '??? — nobody\'s collected on him yet.';
        el.style.filter = 'brightness(0) opacity(.55)';
        w.appendChild(el);
      }
      bg2.appendChild(w);
    });
    t3.appendChild(bg2);
    wrap.appendChild(t3);

    /* account line */
    const s = meta.stats;
    const line = U.el('div', 'best-line');
    line.appendChild(UI.txt(
      'RUNS ' + s.runs + '   SHOTS ' + s.shots + '   SELF-BLANKS ' + s.selfBlanks +
      '   BOSSES DROPPED ' + s.bossKills, { scale: 3, color: PIX.PAL.q }));
    wrap.appendChild(line);

    app.appendChild(wrap);
  },

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
    ante: () => `<b>ANTE ${G.ante}</b> of ${ANTES}. Every ante is three blinds: small, big, then one of the Bullfrog's people. After the boss, Swamp PD wants <b>${E.heatDue()}⛁</b>.`,
    blind: () => `<b>${E.blindName()}</b> — three frogs in the room, one of them is the bounty. Turn evidence over until the string only reaches one poster, name him, then sit down. Name him right and the purse pays more; name him wrong and he sits down ready for you.`,
    purse: () => `<b>THE TAKE</b> — roughly ${E.purse()} chips sewn into this mark, plus 1 per heart you keep, plus whatever his tells promise.`,
    heat: () => `<b>THE BADGES</b> — every pocket you rifle brings them closer. When they're at the door: bribe (${G.loot ? E.bribeCost() : '?'}⛁) or walk.`,
    clock: () => `<b>THE CLOCK</b> — real seconds, and it does not stop for you. Run it out and they come through the door.`,
    noise: () => `<b>NOISE</b> — every hand you put in him makes some, and it bleeds away if you hold still. Past the red line somebody has heard enough.`,
    mess: () => `<b>THE TRAIL</b> — what he left on the boards coming through the door. Tap a stain to go over it with the rag: it costs you seconds and a little noise. Walk out over the rest and somebody finds it in the morning — that is chips now and dearer protection later.`,
    counts: () => E.countsHidden()
      ? `<b>THE LOAD</b> — Blind Newt keeps the count to himself.`
      : `<b>THE LOAD</b> — this drum loaded with <b>${G.duel.lives} LIVE</b>, <b>${G.duel.blanks} blank</b>.${E.has('counter') ? ' Your bead counter tracks what\'s left.' : ' What\'s left is on you to count.'}`,
    strip: () => `<b>THE DRUM</b> — shells in firing order. The one under the ${'▲'} hammer goes next. Blank on yourself = you keep the turn.`,
  },

  tooltipFor(el) {
    const ds = el.dataset;
    if (ds.tipTrinket) {
      const t = TRINKETS[ds.tipTrinket];
      const r = RARITY_META[t.rarity].label;
      const act = t.active
        ? `<div class="tt-odds">ACTIVE — once a ${t.active.per === 'duel' ? 'duel' : 'load'}</div>`
        : `<div class="tt-odds">passive</div>`;
      return `<div class="tt-name">${t.name} <span class="rar-${t.rarity}">${r}</span></div>
        <div class="tt-desc">${t.desc}</div>${act}`;
    }
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
      const r = RARITY_META[it.rarity].label;
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
        else if (k >= '1' && k <= '5') DUEL.useTrinket(+k - 1);
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
