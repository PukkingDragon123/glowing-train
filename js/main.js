'use strict';
/* ============================================================
   SHELL & DEBT — main.js
   Boot, global listeners, optional ?debug harness.
   ============================================================ */

window.addEventListener('DOMContentLoaded', () => {
  SFX.loadMutePref();
  META.load();
  BG.init();
  UI.initTooltip();
  UI.initKeys();

  // Audio contexts must wake on a user gesture.
  document.addEventListener('pointerdown', () => SFX.init(), { once: true });

  G.phase = 'title';
  UI.render();

  if (new URLSearchParams(location.search).has('debug')) {
    const bar = U.el('div', '');
    bar.style.cssText = 'position:fixed;bottom:8px;right:8px;z-index:300;display:flex;gap:6px;opacity:.85';
    const mk = (label, fn) => {
      const b = U.el('button', '', label);
      b.style.cssText = 'font-size:11px;padding:4px 8px;background:#272c3d;border:2px solid #12101d;color:#f4efe0';
      b.onclick = fn;
      bar.appendChild(b);
    };
    mk('+20⛁', () => { G.chips += 20; UI.syncChips(); if (G.phase === 'loot') LOOT.sync(); });
    mk('kill foe', () => {
      if (G.phase !== 'duel' || G.duel.over) return;
      G.duel.opp.hp = 1;
      G.duel.shells[G.duel.ptr] = true;
      G.duel.known[G.duel.ptr] = true;
      UI.syncDuel();
    });
    mk('reveal', () => {
      if (G.phase !== 'duel') return;
      G.duel.known = G.duel.shells.map(s => s);
      UI.syncDuel();
    });
    mk('unlock all', () => { META.unlockAll(); });
    document.body.appendChild(bar);
    window.G2 = () => G; window.E = E; window.UI = UI; window.DUEL = DUEL; window.LOOT = LOOT;
    window.CINE = CINE; window.COPS = COPS; // console access
  }
});
