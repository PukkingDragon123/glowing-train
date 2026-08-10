'use strict';
/* ============================================================
   Balance + fuzz harness for SHELL & DEBT.
   Loads the real game engine headlessly (no browser needed) and
   plays hundreds of runs with simple bot policies.

     node dev/sim.js

   Use this after touching DEBTS, shell tables, callMult or
   streakMult to see how the difficulty curve moved.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const jsdir = path.join(__dirname, '..', 'js') + path.sep;
const src = ['util.js', 'data.js', 'engine.js']
  .map(f => fs.readFileSync(jsdir + f, 'utf8')).join('\n;\n');

function driver() {
  const N = 400;
  const anteReached = {};
  let crashes = 0, wins = 0;

  for (let run = 0; run < N; run++) {
    try {
      E.newRun('SIM-' + run);
      let guard = 0;
      while (G.phase === 'round' && guard++ < 3000) {
        if (G.flags.roundWon) {
          // naive shop: play machines, climb the gun ladder, buy charms
          E.toCasino();
          G.machinePlays += 3; // stands in for slots/blackjack visits
          while (E.canBuyGun()) E.buyGun();
          for (const id of G.casino.stock.slice()) {
            if (!id) continue;
            const c = CHARMS[id];
            if (G.chips >= E.price(c.price) + 15 && G.charms.length < MAX_CHARMS) {
              G.chips -= E.price(c.price);
              G.charms.push(id);
              if (id === 'ironNerve') { G.nerveMax += 2; G.nerve = Math.min(G.nerveMax, G.nerve + 2); }
              G.casino.stock[G.casino.stock.indexOf(id)] = null;
            }
          }
          if (G.chips >= E.price(28) + 20) { G.chips -= E.price(28); E.addShellById(E.randomShellByRarity('rare')); }
          E.nextAnte();
          continue;
        }
        if (E.peekAllowed() && Math.random() < 0.5) E.doPeek();
        const odds = E.topOdds();
        let call = 'FIRE';
        if (!odds.blind && odds.probs) {
          call = OUTCOMES.reduce((a, b) => odds.probs[a] >= odds.probs[b] ? a : b);
        }
        // exploit forced outcomes when known
        if (G.flags.forcedNext) call = G.flags.forcedNext;
        const R = E.doPull(call);
        if (!R) break;
        if (G.phase !== 'round' || G.flags.roundWon) continue;
        const need = G.debt - G.score;
        if (E.canBank() && (E.bankAmount() >= need || (G.streak >= 3 && G.pot >= 120) || G.pot >= 300)) {
          E.doBank();
        }
      }
      const a = G.stats.antesCleared;
      anteReached[a] = (anteReached[a] || 0) + 1;
      if (a >= 8) wins++;
    } catch (e) {
      crashes++;
      console.log('CRASH run', run, e.message, e.stack.split('\n')[1]);
      if (crashes > 4) break;
    }
  }

  console.log('--- greedy bot, N=' + N + ' ---');
  const clearedAtLeast = (n) => Object.entries(anteReached)
    .filter(([k]) => +k >= n).reduce((s, [, v]) => s + v, 0);
  [1, 2, 3, 4, 5, 6, 8].forEach(n =>
    console.log('cleared ante ' + n + '+: ' + (clearedAtLeast(n) / N * 100).toFixed(1) + '%'));
  console.log('full wins:', wins, 'crashes:', crashes);

  /* --- fuzz: random policy hammering every action --- */
  let fuzzCrashes = 0;
  for (let run = 0; run < 150; run++) {
    try {
      E.newRun('FUZZ-' + run);
      let guard = 0;
      while (G.phase === 'round' && guard++ < 2000) {
        if (G.flags.roundWon) {
          E.toCasino();
          if (Math.random() < 0.5 && G.casino.stock[0]) {
            const id = G.casino.stock[0];
            if (G.charms.length < MAX_CHARMS) G.charms.push(id);
            G.casino.stock[0] = null;
          }
          if (Math.random() < 0.4) E.addShellById(E.randomShellByRarity(
            ['common', 'uncommon', 'rare', 'legendary'][Math.floor(Math.random() * 4)]));
          if (Math.random() < 0.4) G.nextFate = U.pick(Math.random, Object.keys(FATES));
          G.machinePlays += Math.floor(Math.random() * 4);
          if (Math.random() < 0.5) while (E.canBuyGun()) E.buyGun();
          E.nextAnte();
          continue;
        }
        const r = Math.random();
        if (r < 0.12 && E.peekAllowed()) E.doPeek();
        else if (r < 0.18 && E.spinAllowed()) E.doSpin();
        else if (r < 0.25 && E.loadAllowed() && G.reserve.length) {
          E.doLoad(G.reserve[Math.floor(Math.random() * G.reserve.length)].uid);
        } else {
          E.doPull(U.pick(Math.random, OUTCOMES));
          if (Math.random() < 0.3 && E.canBank()) E.doBank();
        }
      }
    } catch (e) {
      fuzzCrashes++;
      console.log('FUZZ CRASH run', run, e.message, e.stack.split('\n')[1]);
      if (fuzzCrashes > 4) break;
    }
  }
  console.log('fuzz done, crashes:', fuzzCrashes);
}

new Function(src + '\n;(' + driver.toString() + ')();')();
