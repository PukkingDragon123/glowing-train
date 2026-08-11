'use strict';
/* ============================================================
   SHELL & DEBT — shop.js
   The between-duels shop: three trinket cards, a reroll that
   gets greedier, the next gun on the ladder, and a look at
   who's waiting at the next table. Replaces the casino floor.
   ============================================================ */

const SHOP = {

  build(app) {
    const bar = U.el('div'); UI.buildTopbar(bar); app.appendChild(bar);

    const wrap = U.el('div'); wrap.id = 'shop-wrap';

    /* sign */
    const head = U.el('div', 'shop-head');
    head.appendChild(UI.txt('THE BACK ROOM', { scale: 4, color: PIX.PAL.G, outline: PIX.PAL.K }));
    if (G.shop.interest > 0) {
      const int = U.el('span', 'toast');
      int.appendChild(UI.txt('INTEREST +' + G.shop.interest, { scale: 2, color: PIX.PAL.G }));
      head.appendChild(int);
    }
    wrap.appendChild(head);

    /* stock row */
    const stock = U.el('div'); stock.id = 'shop-stock';
    wrap.appendChild(stock);

    /* controls row: reroll + next blind + go */
    const ctl = U.el('div'); ctl.id = 'shop-ctl';

    const reroll = U.el('button', 'pixbtn');
    reroll.id = 'btn-reroll';
    reroll.onclick = () => SHOP.onReroll();
    ctl.appendChild(reroll);

    const next = U.el('div', 'next-blind has-tip');
    ctl.appendChild(next);

    const go = U.el('button', 'pixbtn gold primary');
    go.id = 'btn-go';
    go.appendChild(UI.txt('NEXT BLIND', { scale: 3, shadow: null, color: PIX.PAL.K }));
    const kh = U.el('span', 'key-hint'); kh.textContent = 'ENTER';
    go.appendChild(kh);
    go.onclick = () => SHOP.onGo();
    ctl.appendChild(go);

    wrap.appendChild(ctl);

    /* your rack: trinkets are sellable here */
    const rackLab = U.el('div', 'rack-label');
    rackLab.appendChild(UI.txt('YOUR TRINKETS — CLICK TO SELL', { scale: 2, color: PIX.PAL.q }));
    wrap.appendChild(rackLab);
    const rack = U.el('div'); rack.id = 'shop-rack';
    wrap.appendChild(rack);

    app.appendChild(wrap);
    SHOP.sync();
  },

  sync() {
    if (G.phase !== 'shop') return;
    UI.syncChips();

    /* stock cards */
    const stock = document.getElementById('shop-stock');
    stock.innerHTML = '';
    G.shop.stock.forEach((slot, i) => {
      const t = TRINKETS[slot.id];
      const cardBtn = U.el('button', 'ware-card has-tip' + (slot.sold ? ' sold' : ''));
      cardBtn.dataset.tipTrinket = slot.id;
      if (slot.sold) {
        cardBtn.appendChild(U.el('span', 'sold-dust'));
      } else {
        cardBtn.appendChild(SPR.trinketCardEl(slot.id, 4));
        const nm = U.el('div', 'ware-name');
        nm.appendChild(UI.txt(t.name, { scale: 2, color: PIX.PAL.W }));
        cardBtn.appendChild(nm);
        const price = E.price(t.cost);
        const tag = U.el('div', 'price-tag');
        tag.appendChild(UI.txt(String(price), { scale: 2, color: G.chips >= price ? PIX.PAL.G : PIX.PAL.R }));
        tag.appendChild(UI.icon('ic_chip', 2));
        cardBtn.appendChild(tag);
        cardBtn.disabled = G.chips < price || G.trinkets.length >= MAX_TRINKETS;
        cardBtn.onclick = () => {
          if (E.buy(i)) { SFX.coin(); SFX.bank(); SHOP.sync(); }
        };
      }
      stock.appendChild(cardBtn);
    });

    /* the gun case slot */
    const g = G.shop.gun;
    const gunBtn = U.el('button', 'ware-card gun-ware has-tip');
    if (g) {
      gunBtn.dataset.tipGun = g.id;
      gunBtn.appendChild(PIX.el(GUN_SPRITES[g.id], 3));
      const nm = U.el('div', 'ware-name');
      nm.appendChild(UI.txt(g.name, { scale: 2, color: PIX.PAL.G }));
      gunBtn.appendChild(nm);
      const price = E.price(g.cost);
      const tag = U.el('div', 'price-tag');
      tag.appendChild(UI.txt(String(price), { scale: 2, color: G.chips >= price ? PIX.PAL.G : PIX.PAL.R }));
      tag.appendChild(UI.icon('ic_chip', 2));
      gunBtn.appendChild(tag);
      gunBtn.disabled = G.chips < price;
      gunBtn.onclick = () => {
        if (E.buyGun()) {
          SFX.jackpot(); UI.flash('go-gold'); UI.particles('ic_chip', 10);
          SHOP.sync();
        }
      };
    } else {
      gunBtn.dataset.tipGun = E.gun().id;
      gunBtn.classList.add('sold');
      gunBtn.appendChild(PIX.el(GUN_SPRITES[E.gun().id], 3));
      const nm = U.el('div', 'ware-name');
      nm.appendChild(UI.txt(G.shop.gunSold ? 'YOURS' : 'FULLY ARMED', { scale: 2, color: PIX.PAL.q }));
      gunBtn.appendChild(nm);
      gunBtn.disabled = true;
    }
    stock.appendChild(gunBtn);

    /* reroll */
    const reroll = document.getElementById('btn-reroll');
    reroll.innerHTML = '';
    const rc = E.rerollCost();
    reroll.appendChild(UI.txt('REROLL', { scale: 2, shadow: null }));
    reroll.appendChild(UI.txt(rc === 0 ? 'FREE' : String(rc), { scale: 2, shadow: null, color: rc === 0 ? PIX.PAL.N : PIX.PAL.G }));
    if (rc > 0) reroll.appendChild(UI.icon('ic_chip', 2));
    const kh = U.el('span', 'key-hint'); kh.textContent = 'R';
    reroll.appendChild(kh);
    reroll.disabled = G.chips < rc;

    /* next blind preview */
    const nb = E.peekNext();
    const next = document.querySelector('.next-blind');
    next.innerHTML = '';
    next.dataset.tipText = nb.boss
      ? nb.boss.name + ' — ' + nb.boss.desc
      : 'Some poor mook with a marker of his own.';
    next.appendChild(UI.txt('NEXT: ' + nb.name, { scale: 2, color: nb.blind === 2 ? PIX.PAL.R : PIX.PAL.w }));
    const sub = U.el('div', 'next-sub');
    if (nb.boss) sub.appendChild(UI.txt(nb.boss.name, { scale: 2, color: PIX.PAL.R }));
    sub.appendChild(UI.txt('PURSE ' + nb.purse, { scale: 2, color: PIX.PAL.G }));
    next.appendChild(sub);

    /* rack */
    const rack = document.getElementById('shop-rack');
    rack.innerHTML = '';
    for (let i = 0; i < MAX_TRINKETS; i++) {
      const t = G.trinkets[i];
      if (!t) { rack.appendChild(U.el('span', 'tslot-empty')); continue; }
      const card = U.el('button', 'tcard has-tip');
      card.dataset.tipTrinket = t.id;
      card.appendChild(SPR.trinketCardEl(t.id, 3));
      const sv = U.el('div', 'sell-tag');
      sv.appendChild(UI.txt('+' + E.sellValue(t.id), { scale: 2, color: PIX.PAL.G }));
      card.appendChild(sv);
      card.onclick = () => { E.sell(i); SFX.coin(); SHOP.sync(); };
      rack.appendChild(card);
    }
  },

  onReroll() {
    if (G.phase !== 'shop') return;
    if (E.reroll()) { SFX.deal(); SHOP.sync(); }
  },

  onGo() {
    if (G.phase !== 'shop') return;
    SFX.chak();
    E.nextBlind();
    UI.render();
  },
};
