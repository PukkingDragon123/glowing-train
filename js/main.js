'use strict';
/* ============================================================
   SHELL & DEBT — main.js
   Boot, global listeners, optional ?debug harness.
   ============================================================ */

window.addEventListener('DOMContentLoaded', () => {
  SFX.loadMutePref();
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
      b.style.cssText = 'font-size:11px;padding:4px 8px';
      b.onclick = fn;
      bar.appendChild(b);
    };
    mk('+100⛁', () => { G.chips += 100; UI.sync(); if (CASINO.syncChips) CASINO.syncChips(); });
    mk('+250 score', () => {
      if (G.phase !== 'round') return;
      G.score += 250;
      if (G.score >= G.debt && !G.flags.roundWon) { E.roundWon(null); UI.roundWonFlow(); }
      UI.sync();
    });
    mk('reveal', () => {
      if (G.phase !== 'round') return;
      G.holes.forEach(h => { if (h) h.revealed = true; });
      UI.sync();
    });
    mk('shells', () => {
      ['web', 'cursed', 'magnet', 'dead', 'glass', 'buck'].forEach(id => E.addShellById(id));
      UI.sync();
    });
    document.body.appendChild(bar);
    window.G = G; window.E = E; window.UI = UI; // console access
  }
});
