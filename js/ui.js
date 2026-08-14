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

const UI = {

  /* ================= router ================= */

  render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    UI.closeModal();
    if (G.phase !== 'duel' && G.phase !== 'loot') DUEL.stop();
    BG.set({
      title: 'title', collection: 'title',
      duel: G.duel && G.duel.opp && G.duel.opp.boss ? 'boss' : 'round',
      blind: G.duel && G.duel.opp && G.duel.opp.boss ? 'boss' : 'casino',
      loot: 'casino', over: 'dead', won: 'win',
    }[G.phase] || 'round');
    switch (G.phase) {
      case 'title':      UI.buildTitle(app); break;
      case 'collection': UI.buildCollection(app); break;
      case 'blind':      UI.buildBlindSelect(app); break;
      case 'duel':
      case 'loot':       UI.buildDuel(app); DUEL.enter(); break;
      case 'over':       UI.buildEnd(app, false); break;
      case 'won':        UI.buildEnd(app, true); break;
    }
    /* card backs drifting behind the quiet screens */
    CINE.ambient(G.phase === 'title' || G.phase === 'collection' || G.phase === 'blind');
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
    ante.appendChild(UI.txt('ANTE ' + G.ante, { scale: 3, color: PIX.PAL.W }));
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
    const wrap = U.el('div', 'splash');

    const frogs = U.el('div', 'title-frogs');
    ['vig', 'croupier', 'player', 'owner', 'lily'].forEach((id, i) => {
      const f = SPR.frogEl(id, id === 'player' ? 5 : 4, i % 2 ? 'breathe2' : 'breathe');
      if (id !== 'player') f.style.filter = 'brightness(.62)';
      frogs.appendChild(f);
    });
    wrap.appendChild(frogs);

    const logo = U.el('div', 'logo-stack');
    logo.appendChild(UI.txt('SHELL & DEBT', { scale: 7, color: PIX.PAL.G, outline: PIX.PAL.K }));
    logo.appendChild(UI.txt('RUSSIAN ROULETTE WITH THE FROG MOB', { scale: 3, color: PIX.PAL.w }));
    wrap.appendChild(logo);

    const seedRow = U.el('div', 'seed-row');
    const inp = U.el('input');
    inp.id = 'seed-input';
    inp.maxLength = 24;
    inp.placeholder = U.randSeedStr();
    inp.spellcheck = false;
    seedRow.appendChild(inp);
    wrap.appendChild(seedRow);

    const deal = U.el('button', 'pixbtn gold big-deal');
    deal.id = 'btn-deal';
    deal.appendChild(PIX.el('gun_snub', 2));
    deal.appendChild(UI.txt('SIT DOWN', { scale: 4, shadow: null, color: PIX.PAL.K }));
    deal.onclick = () => { SFX.chak(); UI.goto(() => E.newRun(inp.value)); };
    wrap.appendChild(deal);

    const row2 = U.el('div', 'end-btns');
    const coll = U.el('button', 'pixbtn');
    coll.id = 'btn-collection';
    coll.appendChild(UI.txt('COLLECTION', { scale: 3, shadow: null }));
    coll.onclick = () => { UI.goto(() => { G.phase = 'collection'; }); };
    row2.appendChild(coll);
    const hlp = U.el('button', 'pixbtn');
    hlp.appendChild(UI.txt('HOUSE RULES', { scale: 3, shadow: null }));
    hlp.onclick = () => UI.showHelp();
    row2.appendChild(hlp);
    wrap.appendChild(row2);

    if (s.runs > 0) {
      const best = U.el('div', 'best-line');
      best.appendChild(UI.txt(
        'BEST ANTE ' + s.bestAnte + '   WINS ' + s.wins + '   MARKERS LOST ' + s.deaths,
        { scale: 3, color: PIX.PAL.q }));
      wrap.appendChild(best);
    }
    app.appendChild(wrap);
  },

  /* ================= the blind select ================= */

  buildBlindSelect(app) {
    const bar = U.el('div'); UI.buildTopbar(bar); app.appendChild(bar);
    const opp = G.duel.opp;
    const wrap = U.el('div', 'blind-wrap');

    const head = U.el('div', 'blind-head');
    head.appendChild(UI.txt('ANTE ' + G.ante + (G.endless ? ' - ENDLESS' : ' OF ' + ANTES),
      { scale: 3, color: PIX.PAL.G, outline: PIX.PAL.K }));
    wrap.appendChild(head);

    const row = U.el('div', 'blind-row');
    for (let i = 0; i < 3; i++) {
      const isNow = i === G.blind, done = i < G.blind;
      const card = U.el('div', 'blind-card' + (isNow ? ' now' : done ? ' done' : '') + (i === 2 ? ' boss' : ''));
      const tag = U.el('div', 'bc-tag');
      tag.appendChild(UI.txt(BLIND_NAMES[i], { scale: 3, color: i === 2 ? PIX.PAL.R : PIX.PAL.w }));
      card.appendChild(tag);

      if (isNow) {
        const art = U.el('div', 'bc-art');
        art.appendChild(SPR.clone(SPR.frogCustom((opp.boss || opp.name) + ':sel', opp.def), 5));
        card.appendChild(art);
        const nm = U.el('div', 'bc-name has-tip');
        nm.dataset.tipOppTells = '1';
        nm.appendChild(UI.txt(opp.name, { scale: 3, color: opp.boss ? PIX.PAL.R : PIX.PAL.W }));
        card.appendChild(nm);
        if (opp.rule) {
          const rl = U.el('div', 'bc-rule');
          rl.appendChild(UI.txt(opp.rule, { scale: 3, color: PIX.PAL.G }));
          card.appendChild(rl);
        }
        const st = U.el('div', 'bc-stats');
        for (let h = 0; h < opp.maxHP; h++) st.appendChild(PIX.el('ic_heart', 3));
        card.appendChild(st);
        if (opp.traits && opp.traits.length) {
          const tl = U.el('div', 'bc-tells');
          opp.traits.forEach(t => {
            const known = META.knowsTell(t);
            const chip = U.el('span', 'bc-tell has-tip' + (known ? '' : ' unknown'));
            chip.appendChild(UI.txt(known ? TRAITS[t].name : '???',
              { scale: 3, color: known ? PIX.PAL.N : PIX.PAL.q }));
            chip.dataset.tipText = known ? TRAITS[t].desc
              : TRAITS[t].hint + ' - you have not read this tell yet.';
            tl.appendChild(chip);
          });
          card.appendChild(tl);
        }
      } else {
        const art = U.el('div', 'bc-art dim');
        art.appendChild(SPR.clone(SPR.cardBack(), 6));
        card.appendChild(art);
      }

      const pay = U.el('div', 'bc-purse');
      pay.appendChild(UI.txt(String(BLIND_PURSE(G.ante, i)), { scale: 3, color: PIX.PAL.G }));
      pay.appendChild(UI.icon('ic_chip', 3));
      card.appendChild(pay);
      row.appendChild(card);
    }
    wrap.appendChild(row);

    if (G.tagsTaken.length) {
      const tr = U.el('div', 'tag-row');
      tr.appendChild(UI.txt('TAGS TAKEN', { scale: 3, color: PIX.PAL.q }));
      G.tagsTaken.slice(-6).forEach(id => {
        const t = TAGS[id];
        const chip = U.el('span', 'tag-chip has-tip');
        chip.dataset.tipText = t.name + ' - ' + t.desc;
        chip.appendChild(PIX.el(t.icon, 2));
        chip.appendChild(UI.txt(t.name, { scale: 3, color: PIX.PAL.G }));
        tr.appendChild(chip);
      });
      wrap.appendChild(tr);
    }

    const btns = U.el('div', 'blind-btns');
    const sit = U.el('button', 'pixbtn gold primary big-deal');
    sit.id = 'btn-sit';
    sit.appendChild(SPR.gunEl(E.gun().id, 2));
    sit.appendChild(UI.txt('SIT DOWN', { scale: 4, shadow: null, color: PIX.PAL.K }));
    const kh = U.el('span', 'key-hint'); kh.textContent = 'ENTER';
    sit.appendChild(kh);
    sit.onclick = () => { SFX.chak(); UI.goto(() => E.sitDown()); };
    btns.appendChild(sit);

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
    const cards = r.trinkets.length
      ? r.trinkets.map(id => '<div class="ri-row"><b>' + TRINKETS[id].name + '</b><span>' + TRINKETS[id].desc + '</span></div>').join('')
      : '<div class="ri-row"><span>Nothing but the iron.</span></div>';
    const items = r.items.length
      ? r.items.map(id => '<div class="ri-row"><b>' + ITEMS[id].name + '</b><span>' + ITEMS[id].desc + '</span></div>').join('')
      : '<div class="ri-row"><span>Belt loops empty.</span></div>';
    const tags = r.tags.length
      ? r.tags.map(id => '<span class="ri-pill">' + TAGS[id].name + '</span>').join('')
      : '<span class="ri-pill off">none</span>';
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
      '<div class="ri-sec"><h4>TRINKETS ' + r.trinkets.length + '/' + MAX_TRINKETS + '</h4>' + cards + '</div>' +
      '<div class="ri-sec"><h4>BELT ' + r.items.length + '/' + E.maxItems() + '</h4>' + items + '</div>' +
      '<div class="ri-sec"><h4>TAGS</h4><div class="ri-pills">' + tags + '</div></div>' +
      '<p class="ri-foot">Next up: <b>' + nb.name + '</b>' + (nb.boss ? ' - ' + nb.boss.name : '') +
      ', purse ' + nb.purse + '. Swamp PD wants ' + HEAT_COST(r.ante) + ' after this ante\'s boss.</p>'
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
    const oppName = U.el('span'); oppName.id = 'opp-name';
    stripRow.appendChild(oppName);
    wrap.appendChild(stripRow);

    /* the scene */
    const holder = U.el('div'); holder.id = 'scene-holder';
    const cv = U.el('canvas'); cv.id = 'scene'; cv.className = 'pix';
    cv.width = DUEL.W; cv.height = DUEL.H;
    cv.onclick = (e) => DUEL.sceneClick(e);
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
    const tr = U.el('div'); tr.id = 'trinket-row'; bottom.appendChild(tr);
    const belt = U.el('div', 'item-belt'); belt.id = 'item-belt'; bottom.appendChild(belt);
    const controls = U.el('div'); controls.id = 'aim-controls';

    const mkAim = (label, key, aim) => {
      const b = U.el('button', 'pixbtn aim-btn');
      b.id = 'aim-' + aim;
      b.appendChild(UI.txt(label, { scale: 3, shadow: null }));
      const k = U.el('span', 'key-hint'); k.textContent = key;
      b.appendChild(k);
      b.onclick = () => DUEL.setAim(aim);
      return b;
    };
    controls.appendChild(mkAim('AT YOU', 'A', 'self'));

    const fire = U.el('button', 'pixbtn fire-btn');
    fire.id = 'btn-fire';
    fire.appendChild(UI.txt('FIRE', { scale: 3, shadow: null, color: PIX.PAL.W }));
    const fk = U.el('span', 'key-hint'); fk.textContent = 'SPACE';
    fire.appendChild(fk);
    fire.onclick = () => DUEL.onFire();
    controls.appendChild(fire);

    controls.appendChild(mkAim('AT HIM', 'D', 'foe'));
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

    /* first-run helper */
    const hint = document.getElementById('hint-bar');
    if (hint) {
      const fresh = META.stats().shots < 30 && G.ante === 1 && G.blind === 0 && !d.over;
      hint.className = fresh ? '' : 'hidden';
      if (fresh) {
        hint.textContent = DUEL.aim === 'foe'
          ? 'tap HIM again to fire — or tap YOURSELF: a blank there keeps your turn'
          : 'tap YOURSELF again to risk it — a blank keeps your turn';
      }
    }

    /* aim + fire buttons */
    const aimS = document.getElementById('aim-self'), aimF = document.getElementById('aim-foe');
    const fire = document.getElementById('btn-fire');
    const canAct = !DUEL.busy && !d.over && d.turn === 'you';
    if (aimS) { aimS.classList.toggle('sel', DUEL.aim === 'self'); aimS.disabled = !canAct; }
    if (aimF) { aimF.classList.toggle('sel', DUEL.aim === 'foe'); aimF.disabled = !canAct; }
    if (fire) fire.disabled = !canAct;

    UI.syncTrinkets();
    UI.syncItems();
    UI.syncGunPanel();
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

  modal(html, noClose) {
    const root = document.getElementById('modal-root');
    root.classList.remove('hidden');
    root.innerHTML = '';
    const m = U.el('div', 'modal', html);
    root.appendChild(m);
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
    ante: () => `<b>ANTE ${G.ante}</b> of ${ANTES}. Every ante is three blinds: small, big, then one of the Bullfrog's people. After the boss, Swamp PD wants <b>${HEAT_COST(G.ante)}⛁</b>.`,
    blind: () => `<b>${E.blindName()}</b> — put the mark across the table down, then go through his pockets.`,
    purse: () => `<b>THE TAKE</b> — roughly ${E.purse()} chips sewn into this mark, plus 1 per heart you keep, plus whatever his tells promise.`,
    heat: () => `<b>THE BADGES</b> — every pocket you rifle brings them closer. When they're at the door: bribe (${G.loot ? E.bribeCost() : '?'}⛁) or walk.`,
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
