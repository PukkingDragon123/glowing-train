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
    const o = document.getElementById('duel-overlay');
    if (!o) return;
    o.className = 'loot-in';
    o.innerHTML = '';

    const panel = U.el('div', 'loot-panel pop');
    panel.id = 'loot-panel';

    const head = U.el('div', 'loot-head');
    head.appendChild(UI.txt('THE TAKE', { scale: 3, color: PIX.PAL.G, outline: PIX.PAL.K }));
    const who = U.el('span', 'has-tip');
    who.dataset.tipOppTells = '1';
    who.appendChild(UI.txt(G.duel.opp.name, { scale: 2, color: PIX.PAL.w }));
    head.appendChild(who);
    panel.appendChild(head);

    /* the badges bar */
    const heatWrap = U.el('div', 'heat-wrap has-tip');
    heatWrap.dataset.tipKey = 'heat';
    const heatLab = U.el('span'); heatLab.id = 'heat-label';
    heatWrap.appendChild(heatLab);
    const bar = U.el('div', 'heat-bar');
    const fill = U.el('div', 'heat-fill'); fill.id = 'heat-fill';
    bar.appendChild(fill);
    heatWrap.appendChild(bar);
    panel.appendChild(heatWrap);

    const list = U.el('div'); list.id = 'pocket-list';
    panel.appendChild(list);

    const swap = U.el('div'); swap.id = 'card-swap'; swap.className = 'hidden';
    panel.appendChild(swap);

    const acts = U.el('div'); acts.id = 'loot-actions';
    const bribe = U.el('button', 'pixbtn'); bribe.id = 'btn-bribe';
    bribe.onclick = () => LOOT.onBribe();
    acts.appendChild(bribe);
    const walk = U.el('button', 'pixbtn gold primary'); walk.id = 'btn-walk';
    walk.appendChild(UI.txt('WALK OUT', { scale: 2, shadow: null, color: PIX.PAL.K }));
    const kh = U.el('span', 'key-hint'); kh.textContent = 'ENTER';
    walk.appendChild(kh);
    walk.onclick = () => LOOT.onWalk();
    acts.appendChild(walk);
    panel.appendChild(acts);

    o.appendChild(panel);
    LOOT.sync();
  },

  sync() {
    if (G.phase !== 'loot' || !G.loot) return;
    UI.syncChips();
    const L = G.loot;

    /* pockets */
    const list = document.getElementById('pocket-list');
    if (!list) return;
    list.innerHTML = '';
    let keyN = 0;
    L.pockets.forEach((p, i) => {
      const b = U.el('button', 'pocket-btn' + (p.taken ? ' taken' : ''));
      const lab = U.el('span', 'pocket-lab');
      lab.appendChild(UI.txt(p.label, { scale: 2, color: p.taken ? PIX.PAL.q : PIX.PAL.W }));
      b.appendChild(lab);
      const val = U.el('span', 'pocket-val');
      if (p.taken) {
        if (p.gun) val.appendChild(PIX.el(GUN_SPRITES[GUNS[G.gunIdx].id], 1));
        else if (p.card) val.appendChild(SPR.trinketCardEl(p.card, 1));
        if (p.lint && !p.card) val.appendChild(UI.txt('LINT', { scale: 2, color: PIX.PAL.q }));
        else if (p.chips > 0) {
          val.appendChild(UI.txt('+' + p.chips, { scale: 2, color: PIX.PAL.G }));
          val.appendChild(UI.icon('ic_chip', 1));
        }
      } else {
        keyN++;
        const k = U.el('span', 'key-hint tk'); k.textContent = keyN;
        b.appendChild(k);
        val.appendChild(UI.txt('?', { scale: 2, color: PIX.PAL.q }));
        b.disabled = !E.canRifle();
        b.onclick = () => LOOT.rifle(i);
      }
      b.appendChild(val);
      list.appendChild(b);
    });

    /* heat */
    const heat = E.heatUp();
    const fill = document.getElementById('heat-fill');
    const lab = document.getElementById('heat-label');
    const pct = Math.min(1, L.sinceBribe / LOOT_CFG.freePockets);
    fill.style.width = (pct * 100) + '%';
    fill.classList.toggle('hot', heat);
    lab.innerHTML = '';
    lab.appendChild(UI.txt(heat ? 'THE BADGES ARE HERE' : 'THE BADGES', {
      scale: 2, color: heat ? PIX.PAL.R : PIX.PAL.q,
    }));

    /* bribe button */
    const bribe = document.getElementById('btn-bribe');
    bribe.innerHTML = '';
    const cost = E.bribeCost();
    bribe.appendChild(UI.txt('BRIBE', { scale: 2, shadow: null }));
    bribe.appendChild(UI.txt(cost === 0 ? 'FREE' : String(cost),
      { scale: 2, shadow: null, color: cost === 0 ? PIX.PAL.N : PIX.PAL.G }));
    if (cost > 0) bribe.appendChild(UI.icon('ic_chip', 2));
    const kh = U.el('span', 'key-hint'); kh.textContent = 'R';
    bribe.appendChild(kh);
    const canBribe = heat && G.chips >= cost && E.lootLeft() > 0;
    bribe.disabled = !canBribe;
    bribe.classList.toggle('pulse-red', heat && canBribe);

    /* card swap flow */
    const swap = document.getElementById('card-swap');
    if (L.pendingCard) {
      swap.className = 'pop';
      swap.innerHTML = '';
      swap.appendChild(UI.txt('RACK FULL — SWAP?', { scale: 2, color: PIX.PAL.G }));
      const row = U.el('div', 'swap-row');
      const found = U.el('span', 'tcard');
      found.appendChild(SPR.trinketCardEl(L.pendingCard, 3));
      row.appendChild(found);
      row.appendChild(UI.txt('FOR', { scale: 2, color: PIX.PAL.q }));
      G.trinkets.forEach((t, i) => {
        const c = U.el('button', 'tcard has-tip');
        c.dataset.tipTrinket = t.id;
        c.appendChild(SPR.trinketCardEl(t.id, 3));
        c.onclick = () => { E.resolveCard(i); SFX.bank(); LOOT.sync(); };
        row.appendChild(c);
      });
      const skip = U.el('button', 'pixbtn');
      skip.appendChild(UI.txt('LEAVE IT', { scale: 2, shadow: null }));
      skip.onclick = () => { E.resolveCard(null); SFX.click(); LOOT.sync(); };
      row.appendChild(skip);
      swap.appendChild(row);
    } else {
      swap.className = 'hidden';
    }
  },

  rifle(i) {
    const before = G.chips;
    const p = E.rifle(i);
    if (!p) return;
    DUEL.lootFx(p);
    if (G.chips > before) UI.chipTick(G.chips - before);
    if (p.gun) UI.stampSmall('HIS IRON IS YOURS — ' + E.gun().name);
    if (p.card) SFX.jackpot();
    LOOT.sync();
  },

  /* rifle by number key: nth untaken pocket */
  rifleKey(n) {
    if (G.phase !== 'loot') return;
    let seen = 0;
    for (let i = 0; i < G.loot.pockets.length; i++) {
      if (G.loot.pockets[i].taken) continue;
      seen++;
      if (seen === n) { LOOT.rifle(i); return; }
    }
  },

  onBribe() {
    if (G.phase !== 'loot') return;
    const c = E.bribeCost();
    if (E.bribe()) {
      SFX.coin(); SFX.chak();
      if (c > 0) UI.chipTick(-c);
      UI.stampSmall(c === 0 ? 'THE BADGE LOOKS AWAY' : 'THE BADGE POCKETS IT');
      LOOT.sync();
    }
  },

  onWalk() {
    if (G.phase !== 'loot' || !G.loot || G.loot.done) return;
    const res = E.endLoot();
    (res.learned || []).forEach((t, i) => setTimeout(() => UI.tellToast(t), 300 + i * 700));
    const fresh = META.check();
    fresh.forEach((t, i) => setTimeout(() => UI.unlockToast(t), 600 + i * 700));
    if (res.won) { UI.render(); return; }
    if (res.heatDue) { LOOT.heatOverlay(res.heatDue); return; }
    UI.render(); // next blind is already dealt
  },

  /* after a boss: Swamp PD wants protection, or the marker */
  heatOverlay(cost) {
    const o = document.getElementById('duel-overlay');
    o.className = 'heat-in';
    o.innerHTML = '';
    const card = U.el('div', 'heat-card pop');
    card.appendChild(PIX.el('ic_badge', 4));
    card.appendChild(UI.txt('SWAMP PD', { scale: 4, color: PIX.PAL.L, outline: PIX.PAL.K }));
    card.appendChild(UI.txt('PROTECTION MONEY', { scale: 2, color: PIX.PAL.w }));
    const row = U.el('div', 'load-row');
    row.appendChild(UI.txt(String(cost), { scale: 5, color: G.chips >= cost ? PIX.PAL.G : PIX.PAL.R }));
    row.appendChild(UI.icon('ic_chip', 3));
    card.appendChild(row);

    const pay = U.el('button', 'pixbtn gold primary');
    pay.id = 'btn-heat';
    pay.appendChild(UI.txt(G.chips >= cost ? 'PAY THE BADGES' : 'HAND OVER THE MARKER',
      { scale: 2, shadow: null, color: PIX.PAL.K }));
    pay.onclick = () => {
      const ok = E.payHeat();
      if (ok) { SFX.coin(); UI.chipTick(-cost); }
      else SFX.lose();
      UI.render();
    };
    card.appendChild(pay);
    o.appendChild(card);
    UI.shake();
    SFX.jamSfx();
  },
};

/* data.js exposes the tuning as LOOT — keep the module name clear of it */
const LOOT_CFG = LOOT_TUNING;
