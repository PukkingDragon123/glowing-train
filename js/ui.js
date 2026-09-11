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
      case 'place':      UI.buildRoom(app,
        PLACES.build(G.place, G.floor) || ROOMS.precinct()); break;
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

  /* ============================================================
     A BARE STAGE.

     A cutscene is a ROOM and nothing else: no HUD, no objective
     card, no tool belt, no phone tab. The opening used to be a
     full-screen overlay so it did not care what was under it;
     now that it is a real room, it needs the screen to itself or
     the title board sits behind it. See js/cut.js.
     ============================================================ */
  buildStage() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    document.body.classList.add('in-scene');
    const host = U.el('div');
    host.id = 'scene-root';
    host.className = 'scene-root';
    app.appendChild(host);
    return host;
  },

  /* a room you walk around in: the story HUD, then the scene */
  buildRoom(app, room) {
    const host = U.el('div'); host.id = 'scene-root'; host.className = 'scene-root';
    app.appendChild(host);
    SCENE.open(room);
    UI.buildCorner(app, 'scene');
  },

  /* ============================================================
     THE CORNERS.

     There is no bar across the top of the game any more. What was
     in it lives in two places: the phone in your coat, and a plate
     in the corner that says what you are supposed to be doing.
     Both are drawn pixel art at whole-number scales, and both are
     big enough to hit with a thumb.
     ============================================================ */
  buildCorner(app, kind) {
    /* THE HUD IS DRAWN AT THE SAME RESOLUTION AS THE GAME.

       It was scale three, which was right when a room pixel was six
       screen pixels: chunky furniture in front of a chunky world. The
       world renders at half that now, and scale three furniture in front
       of it reads as a mobile game's buttons pasted over a painting. Two
       everywhere, and three only on a screen big enough that two would be
       hard to read across the room. */
    const K = (window.innerWidth < 560 || window.innerHeight < 460) ? 2
      : (window.innerWidth > 1700 ? 3 : 2);
    const wrap = U.el('div', 'corner-ui corner-' + kind);

    if (kind === 'scene') {
      /* what you are doing, top left, with the mark that goes with it */
      const ob = STORY.objective();
      const plate = U.el('div', 'obj-plate');
      plate.id = 'obj-plate';
      plate.appendChild(SPR.clone(ART.art(ob.icon || 'ic_star', K), 1));
      const col = U.el('div', 'obj-col');
      /* ink on buff stock, like the sheet and the cards */
      col.appendChild(UI.txt('OBJECTIVE', { scale: K - 1, color: '#8a2418', shadow: null }));
      col.appendChild(UI.wrap(ob.line, 34, { scale: K, color: '#22201c', shadow: null }));
      plate.appendChild(col);
      plate.onclick = () => PHONE.open('job');

      /* THE BELT. What is in your hands, and what a click is going to do
         with it. Three big drawn buttons, because this is the only control
         in the game that changes what everything else means. */
      const col2 = U.el('div', 'corner-left');
      col2.appendChild(plate);
      const belt = U.el('div', 'tool-belt');
      belt.id = 'tool-belt';
      UI.fillBelt(belt, K);
      col2.appendChild(belt);
      wrap.appendChild(col2);
    }

    /* the right-hand stack: the phone, the money, and the two switches */
    const stack = U.el('div', 'corner-stack');

    /* and above all of it, the slips: what just changed and by how much */
    if (kind === 'scene') {
      const led = U.el('div', 'ledger');
      led.id = 'ledger';
      stack.appendChild(led);
      UI.ledgerWatch();
    }

    if (kind === 'scene') {
      const ph = U.el('button', 'big-btn phone-btn');
      ph.id = 'btn-phone';
      ph.appendChild(SPR.clone(ART.art('ic_phone', K + 1), 1));
      ph.appendChild(UI.txt('PHONE', { scale: K, color: PIX.PAL.G, shadow: PIX.PAL.K }));
      /* the unread count, which the notification layer pokes in place */
      const bg = U.el('span', 'phone-badge hidden');
      bg.id = 'tb-phone-badge';
      ph.appendChild(bg);
      ph.onclick = () => PHONE.toggle('map');
      stack.appendChild(ph);
      UI.syncPhoneBadge();
    }

    const cash = U.el('div', 'corner-chip has-tip');
    cash.id = 'corner-cash';
    cash.dataset.tipKey = 'chips';
    cash.appendChild(SPR.clone(ART.art('ic_coin', K - 1), 1));
    const num = U.el('span'); num.id = 'tb-chip-num';
    num.appendChild(UI.num(G.chips, { scale: K, color: PIX.PAL.G }));
    cash.appendChild(num);
    stack.appendChild(cash);

    if (kind === 'scene' && typeof CITY !== 'undefined') {
      const clk = U.el('div', 'corner-chip');
      clk.id = 'corner-clock';
      clk.appendChild(SPR.clone(ART.art('ic_clock', K - 1), 1));
      const cc = U.el('span');
      cc.appendChild(UI.txt(CITY.hhmm(), { scale: K,
        color: CITY.minutesLeft() < 120 ? PIX.PAL.R : PIX.PAL.W }));
      clk.appendChild(cc);
      stack.appendChild(clk);

      /* ============================================================
         HOW MUCH OF THE FILE YOU HAVE.

         The objective card says what to do next. It never said how
         far along you were, so a night of turning over drawers felt
         identical whether you had four of the five or none of them.
         Two numbers and the faces still standing, always on screen.
         ============================================================ */
      const ev = U.el('div', 'corner-chip has-tip');
      ev.id = 'corner-case';
      ev.dataset.tipKey = 'evidence';
      ev.appendChild(SPR.clone(ART.art('ic_case', K - 1), 1));
      const en = U.el('span'); en.id = 'tb-case-num';
      UI.put(en, UI.caseCount(K));
      ev.appendChild(en);
      ev.onclick = () => PHONE.open('case');
      stack.appendChild(ev);
    }

    const sw = U.el('div', 'corner-row');
    const mute = U.el('button', 'big-btn sq');
    mute.id = 'btn-mute';
    mute.appendChild(UI.txt(SFX.muted ? 'X' : ')))', { scale: K, shadow: null, color: PIX.PAL.w }));
    mute.onclick = () => {
      SFX.toggleMute();
      UI.put(mute, UI.txt(SFX.muted ? 'X' : ')))', { scale: K, shadow: null, color: PIX.PAL.w }));
    };
    sw.appendChild(mute);
    const help = U.el('button', 'big-btn sq');
    help.appendChild(UI.txt('?', { scale: K, shadow: null, color: PIX.PAL.G }));
    help.onclick = () => UI.showHelp();
    sw.appendChild(help);
    stack.appendChild(sw);

    wrap.appendChild(stack);
    app.appendChild(wrap);
  },

  /* the three tools, drawn, with the key that picks each one on it */
  fillBelt(belt, K) {
    if (typeof TOOLS === 'undefined') return;
    belt.innerHTML = '';
    TOOLS.LIST.forEach(t => {
      const b = U.el('button', 'tool-btn' + (TOOLS.is(t.id) ? ' on' : ''));
      b.dataset.tool = t.id;
      b.appendChild(SPR.clone(ART.art(t.icon, K), 1));
      const col = U.el('span', 'tool-col');
      col.appendChild(UI.txt(t.word, { scale: Math.max(1, K - 1), shadow: null,
        color: TOOLS.is(t.id) ? PIX.PAL.K : PIX.PAL.W }));
      col.appendChild(UI.txt(t.key, { scale: 1, shadow: null,
        color: TOOLS.is(t.id) ? PIX.PAL.K : PIX.PAL.q }));
      b.appendChild(col);
      b.onclick = () => TOOLS.set(t.id);
      belt.appendChild(b);
    });
  },

  syncTools() {
    const belt = document.getElementById('tool-belt');
    if (!belt) return;
    const K = (window.innerWidth < 560 || window.innerHeight < 460) ? 2 : 3;
    UI.fillBelt(belt, K);
  },

  /* the objective changed under us: repaint the plate in place */
  syncObjective() {
    const plate = document.getElementById('obj-plate');
    if (!plate || typeof STORY === 'undefined') return;
    const K = (window.innerWidth < 560 || window.innerHeight < 460) ? 2 : 3;
    const ob = STORY.objective();
    if (plate.dataset.line === ob.line) return;
    plate.dataset.line = ob.line;
    plate.innerHTML = '';
    plate.appendChild(SPR.clone(ART.art(ob.icon || 'ic_star', K), 1));
    const col = U.el('div', 'obj-col');
    col.appendChild(UI.txt('OBJECTIVE', { scale: K - 1, color: '#8a2418', shadow: null }));
    col.appendChild(UI.wrap(ob.line, 26, { scale: K, color: '#22201c', shadow: null }));
    plate.appendChild(col);
    plate.classList.remove('bump'); void plate.offsetWidth; plate.classList.add('bump');
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
  /* the same break, but as strings, for anybody drawing their own lines */
  wrapLines(str, per) {
    const out = [];
    let line = '';
    String(str || '').split(' ').forEach(w => {
      if (line && (line + ' ' + w).length > per) { out.push(line); line = ''; }
      line = line ? line + ' ' + w : w;
    });
    if (line) out.push(line);
    return out;
  },

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


  /* the clock moved: repaint the corner without rebuilding the room */
  /* EVIDENCE n/m, and the faces it has not cleared yet */
  caseCount(K) {
    const got = (typeof CITY !== 'undefined' && CITY.found) ? CITY.found().length : 0;
    const left = (typeof CITY !== 'undefined' && CITY.totalLeft) ? CITY.totalLeft() : 0;
    const faces = (typeof CASE !== 'undefined' && CASE.left) ? CASE.left() : 0;
    const row = U.el('span', 'case-row');
    row.appendChild(UI.txt(got + '/' + (got + left), { scale: K,
      color: got ? PIX.PAL.G : PIX.PAL.w }));
    if (faces) row.appendChild(UI.txt(faces + (faces === 1 ? ' FACE' : ' FACES'),
      { scale: Math.max(1, K - 1), color: faces === 1 ? PIX.PAL.G : PIX.PAL.q }));
    return row;
  },

  syncStory() {
    const K = (window.innerWidth < 560 || window.innerHeight < 460) ? 2 : 3;
    const clk = document.getElementById('corner-clock');
    if (clk && typeof CITY !== 'undefined') {
      clk.innerHTML = '';
      clk.appendChild(SPR.clone(ART.art('ic_clock', K - 1), 1));
      const cc = U.el('span');
      cc.appendChild(UI.txt(CITY.hhmm(), { scale: K,
        color: CITY.minutesLeft() < 120 ? PIX.PAL.R : PIX.PAL.W }));
      clk.appendChild(cc);
    }
    const cse = document.getElementById('tb-case-num');
    if (cse) UI.put(cse, UI.caseCount(K));
    UI.syncObjective();
  },

  /* ============================================================
     THE RED NUMBER ON THE PHONE.

     Poked in place by PHONE.notify, because a notification that
     rebuilt the whole interface to show a badge took whatever was
     mid-animation down with it.
     ============================================================ */
  syncPhoneBadge() {
    const b = document.getElementById('tb-phone-badge');
    if (!b) return;
    const n = (typeof PHONE !== 'undefined' && PHONE.unread) ? PHONE.unread() : 0;
    if (!n) { b.className = 'phone-badge hidden'; b.innerHTML = ''; return; }
    b.className = 'phone-badge';
    b.innerHTML = '';
    b.appendChild(UI.txt(n > 9 ? '9+' : String(n), { scale: 2, color: PIX.PAL.W }));
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
  /* THE PAINTED OFFICE the corkboard hung in -- a wall, a desk, a lamp,
     a window with rain behind it and dust in the air, a hundred and forty
     lines of it -- was the backdrop for a title screen that no longer
     exists. The title is a real room now, played in the scene runtime:
     see js/menu.js. */


  /* ============================================================
     THE TITLE IS A SHOT.

     It used to be a corkboard: a masthead stabbed with a knife,
     five mugshots on pins, red string between them, and a painted
     office behind it. It named five frogs you had not met and it
     did not move.

     It is the opening of the film now -- see js/menu.js -- and the
     menu itself is two words on the left over it. Everything the
     board carried that a player actually needs (the case number,
     the record, how it works) is behind SETTINGS, where it does
     not stand between you and the shot.
     ============================================================ */
  buildTitle(app) {
    const s = META.stats();
    const wrap = U.el('div', 'title-cine');
    app.appendChild(wrap);

    /* the room the menu is played in: a real scene, not a picture */
    const host = U.el('div');
    host.id = 'scene-root';
    host.className = 'scene-root';
    wrap.appendChild(host);
    MENU.start();

    /* ---- the rail, down the left, over the street ---- */
    const rail = U.el('div', 'title-rail');

    const logo = U.el('div', 'tr-logo');
    logo.appendChild(SPR.clone(SPR.titleCard({
      big: 'HOMICIDE DIVISION - AFTER HOURS',
      huge: 'SHELL & DEBT',
      sub: 'A DETECTIVE FROG STORY',
      col: PIX.PAL.R,
    }), window.innerWidth < 720 ? 1 : 2));
    rail.appendChild(logo);

    /* the seed lives in settings now, but the run still reads it */
    const inp = U.el('input');
    inp.id = 'seed-input';
    inp.maxLength = 24;
    inp.placeholder = U.randSeedStr();
    inp.spellcheck = false;
    inp.className = 'hidden';
    rail.appendChild(inp);

    const play = U.el('button', 'pixbtn gold tr-btn');
    play.id = 'btn-deal';
    play.appendChild(PIX.el('gun_snub', 2));
    play.appendChild(UI.txt('PLAY', { scale: 4, shadow: null, color: PIX.PAL.K }));
    play.onclick = () => UI.startRun(inp.value);
    rail.appendChild(play);

    const set = U.el('button', 'pixbtn tr-btn');
    set.id = 'btn-settings';
    set.appendChild(UI.txt('SETTINGS', { scale: 3, shadow: null }));
    set.onclick = () => UI.showSettings();
    rail.appendChild(set);

    if (s.runs > 0) {
      const rec = U.el('div', 'tr-record');
      rec.appendChild(UI.txt('CLOSED ' + s.wins + '   IN THE WARD ' + s.deaths,
        { scale: 2, color: PIX.PAL.q, shadow: PIX.PAL.K }));
      rail.appendChild(rec);
    }

    wrap.appendChild(rail);
  },

  /* ============================================================
     AND THEN HE LOOKS AT YOU.

     Pressing PLAY does not cut. The reel stops where it is, he
     turns square to the frame, the camera walks in until he is the
     only thing in it, and THEN the wipe. The whole menu is built
     toward that one second and throwing it away for a loading card
     would be the only wrong thing to do with it.
     ============================================================ */
  startRun(seed) {
    const btns = document.querySelectorAll('.title-rail button');
    btns.forEach(b => { b.disabled = true; });
    const rail = document.querySelector('.title-rail');
    if (rail) rail.classList.add('gone');
    SFX.chak();
    return MENU.faceYou().then(() => {
      MENU.stop();
      /* ============================================================
         HOW A RUN STARTS.

         First time through, you play how you got here: the house,
         the room, the thing in the ashtray, the security line, the
         flight, the descent — and then the application, because the
         Brigade does not hand a case to a foreign cop with a
         cigarette end. After that it is the last panel of the reel
         and straight to work, because nobody wants to sit through
         an airport twice.
         ============================================================ */
      const seen = META.stats().loreSeen > 0;
      return UI.goto(() => { MENU.unpush(); E.newRun(seed); }).then(() => {
        META.bump('loreSeen'); META.save();
        if (seen) return CINE.lore(true);
        return CINE.lore(false)
          .then(() => INTRO.play())
          .then(() => INTRO.application());
      }).then(() => CINE.driveTo())
        .then(() => {
          UI.render();
          return STORY.arrive('precinct');
        })
        .then(() => TUTOR.open());
    });
  },

  /* ============================================================
     SETTINGS.

     There was no settings screen. Sound was a corner button that
     only existed inside a room, the camera distance was an
     undocumented Z, the case number was a tag on a corkboard and
     the house rules were a button on the title. All four are the
     same kind of thing -- what you want set before you start -- so
     they are in one place.
     ============================================================ */
  showSettings() {
    const m = META.load();
    const box = UI.modal('<button class="pixbtn m-close" id="mm-close"></button>' +
      '<div class="set-cols"></div>', false);
    const cols = box.querySelector('.set-cols');

    const row = (label, note, ctl) => {
      const r = U.el('div', 'set-row');
      const t = U.el('div', 'set-lab');
      t.appendChild(UI.txt(label, { scale: 2, color: PIX.PAL.G, shadow: null }));
      if (note) t.appendChild(UI.txt(note, { scale: 1, color: PIX.PAL.q, shadow: null }));
      r.appendChild(t);
      r.appendChild(ctl);
      cols.appendChild(r);
      return r;
    };
    /* a two-state switch, drawn, that says which state it is in */
    const toggle = (on, words, fn) => {
      const b = U.el('button', 'pixbtn set-tog' + (on() ? ' on' : ''));
      const paint = () => {
        b.innerHTML = '';
        b.className = 'pixbtn set-tog' + (on() ? ' on' : '');
        b.appendChild(UI.txt(on() ? words[0] : words[1],
          { scale: 2, shadow: null, color: on() ? PIX.PAL.K : PIX.PAL.w }));
      };
      b.onclick = () => { fn(); paint(); };
      paint();
      return b;
    };

    row('SOUND', 'THE SHOT, THE RAIN, THE TYPING',
      toggle(() => !SFX.muted, ['ON', 'OFF'], () => SFX.toggleMute()));

    row('CAMERA', 'HOW CLOSE IT STANDS',
      toggle(() => !META.load().wideShot, ['CLOSE IN', 'THE WHOLE ROOM'], () => {
        /* SCENE.toggleZoom flips the flag AND rescales the open room, which
           at the title means you watch the street change distance under the
           panel -- which is the point of a camera setting. */
        if (typeof SCENE !== 'undefined' && SCENE.toggleZoom) SCENE.toggleZoom();
        else { const d = META.load(); d.wideShot = !d.wideShot; META.save(); }
      }));

    /* the case number: same seed, same night, every time */
    const seedWrap = U.el('div', 'set-seed');
    const seed = U.el('input');
    seed.maxLength = 24;
    seed.spellcheck = false;
    const live = document.getElementById('seed-input');
    seed.placeholder = (live && live.placeholder) || U.randSeedStr();
    seed.value = (live && live.value) || '';
    seed.oninput = () => { if (live) live.value = seed.value.toUpperCase(); };
    seedWrap.appendChild(seed);
    row('CASE NUMBER', 'THE SAME NUMBER DEALS THE SAME NIGHT', seedWrap);

    const hlp = U.el('button', 'pixbtn');
    hlp.appendChild(UI.txt('READ IT', { scale: 2, shadow: null }));
    hlp.onclick = () => { UI.closeModal(); UI.showHelp(); };
    row('HOW THIS WORKS', 'THE SHIFT, THE TOOLS, THE KEYS', hlp);

    if (m.tutor && m.tutor.opening) {
      const again = U.el('button', 'pixbtn');
      again.appendChild(UI.txt('BRIEF ME AGAIN', { scale: 2, shadow: null }));
      again.onclick = () => {
        TUTOR.replay(); SFX.bank();
        UI.closeModal(); UI.stampSmall('HE WILL BE WAITING');
      };
      row('THE CAPTAIN', 'HAVE HIM WALK YOU THROUGH IT', again);
    }

    const c = box.querySelector('#mm-close');
    c.appendChild(UI.txt('X', { scale: 3, color: PIX.PAL.W, shadow: null }));
    c.onclick = () => UI.closeModal();
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

    UI.buildCorner(app, 'duel');
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

  /* ============================================================
     A CHECKLIST, PINNED UP.

     An errand with three things in it needs somewhere you can see
     all three at once. A stamp in the corner tells you what you
     just picked up and then goes away; a list tells you what is
     left, which is the thing you actually want to know while you
     are walking round a room looking for it.

     Drawn, not DOM: a torn sheet of buff stock with a pin through
     the top of it, the item's own sprite beside each line, and a
     box that gets a tick in it. The sprites are the SAME catalogue
     pieces the room draws, at eighteen pixels instead of seventy,
     so the thing on the list is visibly the thing on the sofa.

     items: [{ art, name, done }] where art is a canvas.
     ============================================================ */
  kitList(title, items, K) {
    K = K || 2;
    const IW = 20, ROW = 22, PAD = 7;
    let tw = 0;
    items.forEach(it => {
      const t = PIXFONT.render(it.name, { scale: 1, color: '#22201c' });
      tw = Math.max(tw, t.width);
    });
    const head = PIXFONT.render(title, { scale: 1, color: '#8a2418' });
    const W = Math.max(head.width + PAD * 2, PAD * 2 + IW + 5 + tw + 5 + 9);
    const H = PAD * 2 + 12 + items.length * ROW;
    const cv = document.createElement('canvas');
    cv.width = W * K; cv.height = H * K;
    cv.className = 'pix';
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.scale(K, K);
    /* the paper: buff stock, a ruled margin, and a torn bottom edge */
    ART.px(c, 0, 0, W, H, '#1a1610');
    ART.px(c, 1, 1, W - 2, H - 2, '#e8dfc4');
    ART.px(c, 1, 1, W - 2, 1, '#f6efd8');
    ART.px(c, 1, H - 3, W - 2, 2, 'rgba(90,76,44,.24)');
    for (let x = 1; x < W - 1; x += 3) {
      ART.px(c, x, H - 2, 2, 1, (x / 3 | 0) % 2 ? '#e8dfc4' : '#1a1610');
    }
    ART.px(c, PAD - 3, 12, 1, H - 18, 'rgba(160,60,40,.34)');
    /* the pin */
    PIX.disc(c, Math.round(W / 2), 4, 3, '#1a1610');
    PIX.disc(c, Math.round(W / 2), 4, 2, '#c03a2c');
    ART.px(c, Math.round(W / 2) - 1, 3, 1, 1, '#e8705c');
    c.drawImage(head, PAD, 7);
    items.forEach((it, i) => {
      const y = PAD + 12 + i * ROW;
      /* the box, and the tick in it */
      ART.px(c, PAD - 2, y + 5, 9, 9, '#1a1610');
      ART.px(c, PAD - 1, y + 6, 7, 7, it.done ? '#cfe0c4' : '#f4eeda');
      if (it.done) {
        for (let k = 0; k < 3; k++) ART.px(c, PAD + k, y + 10 + k, 1, 1, '#2f7a3c');
        for (let k = 0; k < 4; k++) ART.px(c, PAD + 2 + k, y + 12 - k, 1, 1, '#2f7a3c');
      }
      /* the thing itself */
      if (it.art) {
        const sc = Math.min(IW / it.art.width, (ROW - 4) / it.art.height, 1);
        const iw = Math.max(1, Math.round(it.art.width * sc));
        const ih = Math.max(1, Math.round(it.art.height * sc));
        c.save();
        if (it.done) c.globalAlpha = 0.42;
        c.drawImage(it.art, PAD + 9, y + Math.round((ROW - 2 - ih) / 2), iw, ih);
        c.restore();
      }
      const t = PIXFONT.render(it.name, { scale: 1, color: it.done ? '#8a8470' : '#22201c' });
      c.drawImage(t, PAD + 9 + IW + 4, y + Math.round((ROW - t.height) / 2));
      /* and a line through it once it is in */
      if (it.done) {
        ART.px(c, PAD + 9 + IW + 3, y + Math.round(ROW / 2) - 1,
          t.width + 2, 1, 'rgba(60,50,36,.62)');
      }
    });
    return cv;
  },

  /* mount (or refresh) the checklist in the corner. Pass null to clear. */
  showKit(title, items) {
    let z = document.getElementById('kit-list');
    if (!items) { if (z) z.remove(); return; }
    if (!z) {
      z = U.el('div'); z.id = 'kit-list';
      document.body.appendChild(z);
      requestAnimationFrame(() => z.classList.add('in'));
    }
    const K = window.innerWidth > 1500 ? 3 : 2;
    z.innerHTML = '';
    z.appendChild(UI.kitList(title, items, K));
    return z;
  },

  /* ============================================================
     AND THE CARD WHEN YOU ACTUALLY GET ONE.

     A stamp in the corner is a receipt. This is the moment: the
     screen dims, a card comes up with the thing drawn four times
     the size the room ever shows it, its name under it, and a line
     from whoever cares that you found it.
     ============================================================ */
  gotItem(art, name, line, ms) {
    return new Promise(res => {
      const root = U.el('div'); root.id = 'got-item';
      const K = window.innerWidth < 620 ? 3 : 4;
      const IW = 76, PAD = 10;
      const nm = PIXFONT.render(name, { scale: 2, color: '#22201c' });
      const ln = line ? PIXFONT.render(line, { scale: 1, color: '#6a5a3c' }) : null;
      const W = Math.max(IW + PAD * 2, nm.width + PAD * 2,
        ln ? ln.width + PAD * 2 : 0);
      const H = PAD * 2 + 10 + IW + 6 + nm.height + (ln ? ln.height + 4 : 0);
      const cv = document.createElement('canvas');
      cv.width = W * K; cv.height = H * K;
      cv.className = 'pix';
      const c = cv.getContext('2d');
      c.imageSmoothingEnabled = false;
      c.scale(K, K);
      /* the card */
      ART.px(c, 0, 0, W, H, '#1a1610');
      ART.px(c, 1, 1, W - 2, H - 2, '#efe6cc');
      ART.px(c, 1, 1, W - 2, 2, '#fbf6e4');
      ART.px(c, 1, H - 3, W - 2, 2, 'rgba(90,76,44,.26)');
      ART.px(c, 4, 4, W - 8, H - 8, 'rgba(0,0,0,0)');
      /* a ruled border inside it */
      ART.px(c, 4, 4, W - 8, 1, 'rgba(140,60,40,.44)');
      ART.px(c, 4, H - 5, W - 8, 1, 'rgba(140,60,40,.44)');
      ART.px(c, 4, 4, 1, H - 8, 'rgba(140,60,40,.44)');
      ART.px(c, W - 5, 4, 1, H - 8, 'rgba(140,60,40,.44)');
      const cap = PIXFONT.render('FOUND IT', { scale: 1, color: '#8a2418' });
      c.drawImage(cap, Math.round((W - cap.width) / 2), 7);
      /* the thing, as big as the card will take */
      if (art) {
        const sc = Math.min(IW / art.width, IW / art.height);
        const iw = Math.max(1, Math.round(art.width * sc));
        const ih = Math.max(1, Math.round(art.height * sc));
        const ix = Math.round((W - iw) / 2), iy = PAD + 10 + Math.round((IW - ih) / 2);
        /* a soft plate under it so it is not floating on paper */
        SPR.ellipse(c, Math.round(W / 2), iy + ih + 1,
          Math.round(iw * 0.46), 3, 'rgba(90,76,44,.20)');
        c.drawImage(art, ix, iy, iw, ih);
      }
      c.drawImage(nm, Math.round((W - nm.width) / 2), PAD + 10 + IW + 6);
      if (ln) c.drawImage(ln, Math.round((W - ln.width) / 2), PAD + 10 + IW + 8 + nm.height);
      root.appendChild(cv);
      document.body.appendChild(root);
      requestAnimationFrame(() => root.classList.add('in'));
      SFX.tone(660, 0.06, 'square', 0.05);
      setTimeout(() => SFX.tone(990, 0.10, 'triangle', 0.05), 80);
      setTimeout(() => SFX.tone(1320, 0.12, 'triangle', 0.04), 170);
      const done = () => {
        root.classList.add('out');
        setTimeout(() => { root.remove(); res(); }, 220);
        window.removeEventListener('pointerdown', done);
      };
      setTimeout(() => window.addEventListener('pointerdown', done), 200);
      setTimeout(done, ms || 1700);
    });
  },

  /* ============================================================
     THE LEDGER.

     This game was full of things that happened where nothing said
     they had. Eighteen minutes came off the shift for a search and
     the only sign of it was two digits changing in the corner; the
     street got hotter, the purse got lighter, a face came off the
     board, and every bit of it silent. Every change prints a slip
     now: what moved, which way, and by how much.

     It is a SAMPLER, not a set of hooks. Anything that touches the
     clock or the purse -- a search, a favour, a bribe, a taxi, a
     beat halfway through a cutscene -- gets its slip without
     knowing the ledger exists, and no change can print twice
     because the snapshot moves with it.
     ============================================================ */
  LEDGER: { seen: null, timer: 0 },

  tick(text, kind) {
    const z = document.getElementById('ledger');
    if (!z) return;
    const col = kind === 'bad' ? PIX.PAL.R : kind === 'good' ? PIX.PAL.G
      : kind === 'time' ? '#e8b64c' : PIX.PAL.W;
    const t = U.el('div', 'slip slip-' + (kind || 'plain'));
    t.style.setProperty('--rule', col);
    t.appendChild(UI.txt(text, { scale: 2, color: col, shadow: PIX.PAL.K }));
    z.appendChild(t);
    while (z.children.length > 4) z.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 360); }, 2600);
  },

  /* what the numbers are right now */
  ledgerShot() {
    return {
      day: G.day || 0,
      clock: Math.round(G.clock || 0),
      chips: G.chips || 0,
      heat: G.heat || 0,
      karma: Math.round(G.karmaScore || 0),
      ev: (typeof CITY !== 'undefined' && CITY.found) ? CITY.found().length : 0,
      faces: (typeof CASE !== 'undefined' && CASE.left) ? CASE.left() : 0,
    };
  },

  /* forget the last reading: a new shift is not a hundred slips */
  ledgerReset() { UI.LEDGER.seen = UI.ledgerShot(); },

  ledgerWatch() {
    if (UI.LEDGER.timer) return;
    UI.ledgerReset();
    UI.LEDGER.timer = setInterval(() => {
      const now = UI.ledgerShot(), was = UI.LEDGER.seen;
      /* NOTHING TO PRINT ON YET: HOLD THE READING, do not advance it. The
         thirty-five minutes a taxi costs come off the clock while the room
         is still being built, and a snapshot that moved anyway would have
         eaten the one slip the player most wanted. A conversation counts as
         nothing to print on -- the corners fade right out for one, and that
         is where half the evidence in the game changes hands. The slips
         land as he steps away from the counter instead. */
      if (!document.getElementById('ledger')) return;
      if (document.body.classList.contains('talking')) return;
      UI.LEDGER.seen = now;
      /* a whole new shift is not a hundred slips */
      if (!was || now.day !== was.day) return;
      const mins = now.clock - was.clock;
      if (mins > 0) UI.tick('-' + mins + ' MIN', 'time');
      const cash = now.chips - was.chips;
      if (cash) UI.tick((cash > 0 ? '+' : '-') + Math.abs(cash) + ' FRANCS', cash > 0 ? 'good' : 'bad');
      if (now.heat > was.heat) UI.tick('HEAT +' + (now.heat - was.heat), 'bad');
      const k = now.karma - was.karma;
      if (k) UI.tick('GOODWILL ' + (k > 0 ? '+' : '-') + Math.abs(k), k > 0 ? 'good' : 'bad');
      if (now.ev > was.ev) {
        const total = now.ev + ((typeof CITY !== 'undefined' && CITY.totalLeft) ? CITY.totalLeft() : 0);
        UI.tick('EVIDENCE ' + now.ev + ' OF ' + total, 'good');
      }
      if (now.faces < was.faces) UI.tick(now.faces + (now.faces === 1 ? ' FACE LEFT' : ' FACES LEFT'), 'good');
    }, 420);
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
    evidence: () => {
      const got = CITY.found().length, tot = got + CITY.totalLeft(), f = CASE.left();
      return `<b>THE FILE</b> — <b>${got} of ${tot}</b> pieces in hand, and <b>${f} face${f === 1 ? '' : 's'}</b> the story still fits. Every piece you turn up crosses somebody off it. When one face is left, take the name to the station.`;
    },
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

  /* ============================================================
     HOW THIS WORKS.

     This screen used to explain a different game. Every word of it
     was about a drum of live and blank shells, eight antes, boss
     frogs with house rules and protection money to Swamp PD -- and
     the game it is now is a shift on the clock in Paris, walking
     rooms and turning over drawers. A player who pressed H to find
     out what he was doing was told, in detail, about something that
     is not on the screen.
     ============================================================ */
  showHelp() {
    const binds = BINDS.map(([k, v]) => `<p><b>${k}</b> — ${v}</p>`).join('');
    const C = (typeof CITY !== 'undefined') ? CITY.COST : { travel: 35, search: 18, ask: 12, look: 3 };
    UI.modal(`
      <button class="pixbtn m-close" id="mm-close"></button>
      <div class="help-cols">
        <div>
          <h4>THE SHIFT</h4>
          <p>A body, a file, and a day to work it. The buff card top-left is
          <b>what to do next</b> — click it for the whole file. A <b>gold chevron</b> bobs over
          the thing that card means.</p>
          <h4>THE CLOCK IS THE GAME</h4>
          <p>It starts at <b>09:00</b> and only goes one way. Crossing town <b>${C.travel} min</b> —
          turning a prop over <b>${C.search}</b> — a question <b>${C.ask}</b> — the glass <b>${C.look}</b>.</p>
          <p>Every minute it takes prints a <b>slip</b> in the corner — and so does every
          franc, every piece of evidence, every bit of goodwill. If a number moved, the
          corner says so.</p>
          <h4>WHAT YOU HAVE</h4>
          <p>The chip by the clock reads <b>EVIDENCE n/m</b> and how many <b>faces</b> the story
          still fits. Every piece crosses somebody off. One face left — take the name to
          the station and say it.</p>
          <h4>THE THREE TOOLS</h4>
          <p><b>THE HAND</b> turns a thing over. <b>THE EYEGLASS</b> costs ${C.look} minutes to say
          whether a prop is worth the ${C.search}, and it is the only way to see what nobody
          put there. <b>THE IRON</b> works on a witness. That is the problem with it.</p>
        </div>
        <div>
          <h4>WHAT THE ROOM REMEMBERS</h4>
          <p>You will be back in this room four times tonight, so it keeps the marks and
          you do not have to.</p>
          <p><b>GOLD PIP</b> — the glass says what is in there is not dirt.
          <b>SLATE PIP</b> — the glass cleared it. Keep your ${C.search} minutes.
          <b>CHALK CROSS ON THE BOARDS</b> — you have been through it.</p>
          <h4>WHOEVER IS BEHIND THE COUNTER</h4>
          <p>Every stop keeps hours and the frog who knows something goes home. Ask him,
          press him, catch the story that does not fit the one next door. A contradiction
          takes a face off the board. Turn up after closing and you are talking to a
          locked door — the phone rings you first.</p>
          <h4>WHAT THE STREET THINKS</h4>
          <p><b>HEAT</b> is somebody watching you do it. <b>GOODWILL</b> is the favours you did on
          the way past. Both change what people will tell you.</p>

          <h4>NOTHING HERE IS COMPULSORY</h4>
          <p>Every cutscene in this game can be walked out of. A <b>SKIP</b> badge appears in
          the bottom corner a moment into any of them — click it, or press <b>ESC</b>. In the
          opening that skips the whole thing, not just the shot you are in.</p>
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
      /* Z: how close the camera stands. Two scales, both of them crisp. */
      if (k === 'z' && typeof SCENE !== 'undefined' && SCENE.toggleZoom
        && UI.isScene(G.phase)) { SCENE.toggleZoom(); return; }
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
