'use strict';
/* ============================================================
   SHELL & DEBT — loot.js
   No shop. You go through the mark's pockets while the corpse
   is warm and the badges close in. Bribes buy more time; after
   a boss, Swamp PD wants protection money either way.
   ============================================================ */

const LOOT = {

  /* the loot panel rides the duel scene's overlay */
  overlay() {
    LOOT.ready = true;
    const o = document.getElementById('duel-overlay');
    if (!o) return;
    o.className = 'loot-in fp';
    o.innerHTML = '';

    /* FIRST PERSON. No panel, no list of buttons: the room is the
       interface. A thin strip of meters up top, your tools in one corner,
       the way out in the other. Everything else is the corpse. */
    const strip = U.el('div', 'fp-strip');
    ['time', 'noise', 'mess'].forEach(kind => {
      const w = U.el('div', 'meter has-tip m-' + kind);
      w.dataset.tipKey = kind === 'time' ? 'clock' : kind === 'noise' ? 'noise' : 'mess';
      const lab = U.el('span', 'm-lab'); lab.id = 'm-lab-' + kind;
      w.appendChild(lab);
      const bar = U.el('div', 'm-bar');
      const fill = U.el('div', 'm-fill'); fill.id = 'm-fill-' + kind;
      bar.appendChild(fill);
      if (kind === 'noise') { const line = U.el('i', 'm-line'); bar.appendChild(line); }
      w.appendChild(bar);
      strip.appendChild(w);
    });
    o.appendChild(strip);

    const tools = U.el('div'); tools.id = 'loot-tools';
    o.appendChild(tools);

    const hint = U.el('div', 'loot-hint fp-hint');
    hint.appendChild(UI.txt('SEARCH HIM · WIPE THE TRAIL · EDGES TO LOOK', { scale: 2, color: PIX.PAL.q }));
    o.appendChild(hint);

    const swap = U.el('div'); swap.id = 'card-swap'; swap.className = 'hidden';
    o.appendChild(swap);

    const acts = U.el('div', 'fp-acts'); acts.id = 'loot-actions';
    const bribe = U.el('button', 'pixbtn'); bribe.id = 'btn-bribe';
    bribe.onclick = () => LOOT.onBribe();
    acts.appendChild(bribe);
    const walk = U.el('button', 'pixbtn gold primary'); walk.id = 'btn-walk';
    walk.appendChild(UI.txt('WALK OUT', { scale: 3, shadow: null, color: PIX.PAL.K }));
    const kh = U.el('span', 'key-hint'); kh.textContent = 'ENTER';
    walk.appendChild(kh);
    walk.onclick = () => LOOT.onWalk();
    acts.appendChild(walk);
    o.appendChild(acts);

    LOOT.sync();
  },

  /* The two meters move every frame; the panel behind them does NOT.
     Rebuilding the pocket list ten times a second made its buttons
     jitter out from under the pointer. */
  tick() {
    if (G.phase !== 'loot' || !G.loot) return;
    const L = G.loot;
    const heat = E.heatUp();
    const tf = document.getElementById('m-fill-time');
    const nf = document.getElementById('m-fill-noise');
    const mf = document.getElementById('m-fill-mess');
    const tl = document.getElementById('m-lab-time');
    const nl = document.getElementById('m-lab-noise');
    const ml = document.getElementById('m-lab-mess');
    if (tf) {
      const t = L.maxTime ? L.time / L.maxTime : 0;
      tf.style.width = (t * 100) + '%';
      tf.classList.toggle('low', t < 0.34);
      tl.innerHTML = '';
      tl.appendChild(UI.txt(Math.ceil(L.time) + 'S', {
        scale: 3, color: t < 0.34 ? PIX.PAL.R : PIX.PAL.W, outline: PIX.PAL.K }));
    }
    if (nf) {
      const n = Math.min(1, L.noise);
      nf.style.width = (n * 100) + '%';
      nf.classList.toggle('loud', n > 0.68);
      nl.innerHTML = '';
      nl.appendChild(UI.txt(heat ? 'HEARD' : n > 0.68 ? 'TOO LOUD' : n > 0.34 ? 'NOISY' : 'QUIET', {
        scale: 2, color: heat || n > 0.68 ? PIX.PAL.R : n > 0.34 ? PIX.PAL.O : PIX.PAL.q }));
    }
    if (mf) {
      const m = E.messLeft();
      mf.style.width = (m * 100) + '%';
      mf.classList.toggle('dirty', m > MESS_TUNING.forgive);
      ml.innerHTML = '';
      ml.appendChild(UI.txt(m <= MESS_TUNING.forgive ? 'CLEAN' : Math.round(m * 100) + '%', {
        scale: 2, color: m > MESS_TUNING.forgive ? PIX.PAL.R : PIX.PAL.N }));
    }
    document.body.classList.toggle('heard', heat);
    document.body.classList.toggle('loud', !heat && L.noise > 0.68);
    /* the bribe button and the search rows only care about caught/not */
    if (LOOT._wasCaught !== heat) { LOOT._wasCaught = heat; LOOT.sync(); }
    if (typeof TUTOR !== 'undefined' && TUTOR.armed() && DUEL.t % 40 === 0) TUTOR.check();
  },

  sync() {
    if (G.phase !== 'loot' || !G.loot) return;
    UI.syncChips();
    const L = G.loot;
    const heat = E.heatUp();

    /* no pocket list in first person: the corpse is the list */
    const list = document.getElementById('pocket-list');
    if (list) list.innerHTML = '';

    /* the tool rack */
    const tools = document.getElementById('loot-tools');
    if (tools) {
      tools.innerHTML = '';
      const chip = (cls, glyphEl, label, on, fn) => {
        const b = U.el('button', 'tool-chip' + cls);
        if (glyphEl) b.appendChild(glyphEl);
        b.appendChild(UI.txt(label, { scale: 2, color: on ? PIX.PAL.K : PIX.PAL.w }));
        if (fn) b.onclick = fn; else b.disabled = true;
        return b;
      };
      tools.appendChild(chip(L.tool ? '' : ' on', null, 'BARE HANDS', !L.tool,
        L.tool ? () => { L.tool = null; SFX.click(); LOOT.sync(); } : null));
      G.items.forEach((id, i) => {
        if (!ITEM_PHASE_OK(id, 'loot')) return;
        const armed = L.tool === id;
        tools.appendChild(chip((armed ? ' on' : '') + ' has-tip',
          SPR.itemGlyphEl(id, 3, 'tool-ico'), ITEMS[id].name, armed,
          DUEL.busy ? null : () => UI.onUseItem(i)));
      });
    }
    const hint = document.querySelector('.loot-hint');
    if (hint) {
      hint.innerHTML = '';
      hint.appendChild(UI.txt(heat ? 'THEY HEARD YOU — PAY OR WALK'
        : L.tool === 'shiv' ? 'SHIV OUT — PICK AN EMPTY POCKET'
          : 'TAP HIM TO SEARCH',
        { scale: 2, color: heat ? PIX.PAL.R : L.tool ? PIX.PAL.N : PIX.PAL.q }));
    }

    LOOT.tick();

    /* bribe button — the overlay may not be up yet (the drag loader plays
       first), and a sync that fires in that window must not explode */
    const bribe = document.getElementById('btn-bribe');
    if (!bribe) return;
    bribe.innerHTML = '';
    BTN.paint(bribe);                      // innerHTML just evicted its face
    const cost = E.bribeCost();
    bribe.appendChild(UI.txt('BRIBE', { scale: 3, shadow: null }));
    bribe.appendChild(UI.txt(cost === 0 ? 'FREE' : String(cost),
      { scale: 3, shadow: null, color: cost === 0 ? PIX.PAL.N : PIX.PAL.G }));
    if (cost > 0) bribe.appendChild(UI.icon('ic_chip', 3));
    const kh = U.el('span', 'key-hint'); kh.textContent = 'R';
    bribe.appendChild(kh);
    const canBribe = heat && G.chips >= cost;
    bribe.disabled = !canBribe;
    bribe.classList.toggle('pulse-red', heat && canBribe);
    if (heat && !COPS.active) { COPS.arrive(); LOOT.callout('THEY HEARD THAT', 'pay them or walk out now'); }

    /* the belt is full and his coat had one more thing in it */
    const swap = document.getElementById('card-swap');
    if (L.pendingItem) {
      swap.className = 'pop';
      swap.innerHTML = '';
      swap.appendChild(UI.txt('BELT FULL — SWAP?', { scale: 3, color: PIX.PAL.G }));
      const row = U.el('div', 'swap-row');
      const found = U.el('span', 'tcard');
      found.appendChild(SPR.itemCardEl(L.pendingItem, 4));
      row.appendChild(found);
      row.appendChild(UI.txt('FOR', { scale: 3, color: PIX.PAL.q }));
      G.items.forEach((id, i) => {
        const c = U.el('button', 'tcard has-tip');
        c.dataset.tipItem = id;
        c.appendChild(SPR.itemCardEl(id, 4));
        c.onclick = () => { E.resolveItem(i); SFX.bank(); LOOT.sync(); UI.syncItems(); };
        row.appendChild(c);
      });
      const skip = U.el('button', 'pixbtn');
      skip.appendChild(UI.txt('LEAVE IT', { scale: 3, shadow: null }));
      skip.onclick = () => { E.resolveItem(null); SFX.click(); LOOT.sync(); };
      row.appendChild(skip);
      swap.appendChild(row);
    } else {
      swap.className = 'hidden';
    }
  },

  /* the blue strip that slides in when the law shows up */
  callout(title, sub) {
    if (document.querySelector('.cop-callout')) return;
    const wrap = document.getElementById('duel-wrap');
    const holder = document.getElementById('scene-holder');
    if (!wrap || !holder) return;
    const cc = U.el('div', 'cop-callout' + (title ? ' bust' : ''));
    const bd = U.el('span', 'cc-badge'); bd.appendChild(PIX.el('ic_badge', 3));
    cc.appendChild(bd);
    const tx = U.el('span', 'cc-text');
    tx.appendChild(document.createTextNode(title || 'THE BADGES ARE HERE'));
    const s2 = U.el('b', 'cc-sub');
    s2.textContent = sub || 'bribe them or walk out';
    tx.appendChild(s2);
    cc.appendChild(tx);
    wrap.insertBefore(cc, holder);
    const wash = document.getElementById('siren-wash');
    if (wash) wash.classList.add('on');
  },

  retireCallout() {
    const cc = document.querySelector('.cop-callout');
    const wash = document.getElementById('siren-wash');
    if (wash) wash.classList.remove('on');
    if (cc) { cc.classList.add('out'); setTimeout(() => cc.remove(), 340); }
  },

  /* the take itself — called by DUEL.searchAt once the hand is in there */
  take(i, sx, sy) {
    const before = G.chips;
    const p = E.rifle(i);
    if (!p) return;
    DUEL.lootFx(p, sx, sy);
    if (G.chips > before) UI.chipTick(G.chips - before);
    if (p.gun) UI.stampSmall('HIS IRON IS YOURS — ' + E.gun().name);
    if (p.foundDossier) {
      SFX.jackpot();
      UI.stampBig('HIS PAPERS', PIX.PAL.N, true);
      UI.stampSmall('NEXT LINE-UP: ONE CLUE ALREADY TURNED');
      FX.floatText(sx || 175, (sy || 128) - 10, 'INTEL', PIX.PAL.N);
    }
    /* the sound of it: a ring on the meter, and the room going quiet */
    const loud = p.noise || 0;
    if (loud > 0.3) { FX.screen.shake(Math.round(loud * 12)); SFX.jamSfx(); }
    if (p.heard) LOOT.heard();
    LOOT.sync();
  },

  /* somebody at the door has heard enough */
  heard() {
    SFX.backfire();
    FX.screen.shake(16);
    FX.screen.vignette(PIX.PAL.d, 0.9, 0.02);
    UI.shake();
    if (!COPS.active) COPS.arrive();
    LOOT.callout('THEY HEARD THAT', 'pay them or walk out now');
  },

  /* kept for anything that wants the old one-call behaviour */
  rifle(i) { DUEL.searchAt(i); },

  /* search by number key: nth untaken pocket */
  rifleKey(n) {
    if (G.phase !== 'loot') return;
    let seen = 0;
    for (let i = 0; i < G.loot.pockets.length; i++) {
      if (G.loot.pockets[i].taken) continue;
      seen++;
      if (seen === n) { DUEL.searchAt(i); return; }
    }
  },

  onBribe() {
    if (G.phase !== 'loot') return;
    const c = E.bribeCost();
    if (E.bribe()) {
      SFX.coin(); SFX.chak();
      if (c > 0) UI.chipTick(-c);
      UI.stampSmall(c === 0 ? 'THE BADGE LOOKS AWAY' : 'THE BADGE POCKETS IT', 'cop');
      COPS.bribe(c);
      LOOT.retireCallout();
      LOOT.sync();
    }
  },

  async onWalk() {
    if (G.phase !== 'loot' || !G.loot || G.loot.done) return;
    /* WHAT YOU LEFT ON THE FLOOR. Walk out over it and somebody finds it in
       the morning; that costs money now and heat later. */
    const bill = E.messBill();
    if (bill) {
      G.chips = Math.max(0, G.chips - bill.chips);
      if (bill.heat) G.messHeat = (G.messHeat || 0) + 1;
      UI.syncChips();
      UI.stampBig('YOU LEFT A TRAIL', PIX.PAL.R, true);
      SFX.jamSfx(); UI.shake();
      UI.chipTick(-bill.chips);
      await U.sleep(950);
    } else if (G.loot.stains && G.loot.stains.length) {
      UI.stampBig('NOTHING TO FIND', PIX.PAL.N, true);
      SFX.bank();
      await U.sleep(600);
    }
    if (G.blind !== 2) LOOT.retireCallout();
    const res = E.endLoot();
    (res.learned || []).forEach((t, i) => setTimeout(() => UI.tellToast(t), 300 + i * 700));
    const fresh = META.check();
    fresh.forEach((t, i) => setTimeout(() => UI.unlockToast(t), 600 + i * 700));
    if (res.finale) { SCENE.close(); DUEL.stop(); STORY.endgame(); return; }
    if (res.heatDue) { LOOT.heatOverlay(res.heatDue); return; }
    /* back to the bullpen: pin what you took to the board, get the next lead */
    UI.goto(() => { G.phase = 'precinct'; });
  },

  /* after a boss: Swamp PD wants protection, or the marker */
  heatOverlay(cost) {
    const o = document.getElementById('duel-overlay');
    o.className = 'heat-in';
    o.innerHTML = '';
    const card = U.el('div', 'heat-card pop');
    card.appendChild(PIX.el('ic_badge', 5));
    card.appendChild(UI.txt('SWAMP PD', { scale: 4, color: PIX.PAL.L, outline: PIX.PAL.K }));
    card.appendChild(UI.txt('PROTECTION MONEY', { scale: 3, color: PIX.PAL.w }));
    const row = U.el('div', 'load-row');
    row.appendChild(UI.txt(String(cost), { scale: 6, color: G.chips >= cost ? PIX.PAL.G : PIX.PAL.R }));
    row.appendChild(UI.icon('ic_chip', 3));
    card.appendChild(row);

    const pay = U.el('button', 'pixbtn gold primary');
    pay.id = 'btn-heat';
    pay.appendChild(UI.txt(G.chips >= cost ? 'PAY THE BADGES' : 'HAND OVER THE MARKER',
      { scale: 3, shadow: null, color: PIX.PAL.K }));
    pay.onclick = async () => {
      pay.disabled = true;
      const cleared = G.ante;
      const ok = E.payHeat();
      if (ok) { SFX.coin(); UI.chipTick(-cost); await COPS.paid(); }
      else { SFX.lose(); await COPS.bust(); }
      LOOT.retireCallout();
      o.className = 'hidden'; o.innerHTML = '';
      if (ok) await CINE.anteClear(cleared, G.chips);
      await CINE.chapterCard();         // one more rung of his organisation, gone
      UI.goto(() => { G.phase = 'precinct'; });
    };
    card.appendChild(pay);
    o.appendChild(card);
    UI.shake();
    SFX.jamSfx();
    LOOT.callout('SWAMP PD AT THE DOOR', 'protection money comes due');
    COPS.shakedown(G.chips >= cost ? 3 : 2);
  },
};

/* data.js exposes the tuning as LOOT — keep the module name clear of it */
const LOOT_CFG = LOOT_TUNING;
