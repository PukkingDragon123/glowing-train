'use strict';
/* ============================================================
   Balance + fuzz harness for SHELL & DEBT (duel era).
   Loads the real engine headlessly and plays hundreds of runs
   with a sensible bot, then fuzzes random actions.

     node dev/sim.js

   Use after touching HP tables, purses, trinket costs or the
   load-size curve to see how the difficulty curve moved.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const jsdir = path.join(__dirname, '..', 'js') + path.sep;
const src = ['util.js', 'data.js', 'meta.js', 'engine.js']
  .map(f => fs.readFileSync(jsdir + f, 'utf8')).join('\n;\n');

function driver() {

  /* what the bot knows: visible counts (respects Blind Newt) */
  function visible() {
    if (E.countsHidden()) return null;
    const d = G.duel;
    if (E.has('counter')) return E.remaining();
    /* honest players track it themselves — the bot does too */
    return E.remaining();
  }

  function chamberKnown() {
    const d = G.duel;
    return d.known[d.ptr]; // true=live, false=blank, null=unknown
  }

  function trinketIdx(id) { return G.trinkets.findIndex(t => t.id === id); }

  function botTurn() {
    const d = G.duel;
    /* heal when hurting */
    const cig = trinketIdx('cig');
    if (cig >= 0 && G.hearts <= 2 && E.canUseTrinket(cig)) E.useTrinket(cig);

    let known = chamberKnown();
    const v = visible();
    let p = v === null ? 0.5 : (v.l + v.b === 0 ? 0.5 : v.l / (v.l + v.b));

    /* peek when uncertain */
    if (known === null && p > 0.25 && p < 0.75) {
      const gl = trinketIdx('glass');
      if (gl >= 0 && E.canUseTrinket(gl)) { E.useTrinket(gl); known = chamberKnown(); }
    }
    /* mirror a known live into a free turn */
    if (known === true) {
      const mi = trinketIdx('mirror');
      if (mi >= 0 && E.canUseTrinket(mi)) { E.useTrinket(mi); known = chamberKnown(); }
    }
    /* cuff the mark when he's dangerous and we're committed */
    const cu = trinketIdx('cuffs');
    if (cu >= 0 && E.canUseTrinket(cu) && d.opp.hp >= 3 && G.hearts <= 2) E.useTrinket(cu);

    if (known === false) return E.pull('self');
    if (known === true) {
      if (E.canUseGun('saw') && d.opp.hp >= 2) E.useGun('saw');
      if (E.canUseGun('tommy') && d.opp.hp >= 3) E.useGun('tommy');
      return E.pull('foe');
    }
    /* unknown: play the odds like the marks do */
    if (p <= 0.42) {
      const be = trinketIdx('beer');
      if (p >= 0.3 && be >= 0 && E.canUseTrinket(be)) { E.useTrinket(be); return null; }
      return E.pull('self');
    }
    if (p >= 0.85 && E.canUseGun('saw')) E.useGun('saw');
    return E.pull('foe');
  }

  const BUY_ORDER = ['totem', 'gator', 'blood', 'scales', 'clover', 'deadeye', 'cig',
    'glass', 'ring', 'edge', 'cuffs', 'beer', 'mirror', 'shill', 'snake', 'swarm',
    'feather', 'counter', 'fly', 'marked', 'glove', 'watch', 'dirt', 'rosary'];

  function botShop() {
    E.openShop();
    if (G.shop.gun && G.chips >= E.price(G.shop.gun.cost) + 4) E.buyGun();
    let bought = true;
    while (bought) {
      bought = false;
      const avail = G.shop.stock
        .map((s, i) => ({ s, i }))
        .filter(x => !x.s.sold)
        .sort((a, b) => BUY_ORDER.indexOf(a.s.id) - BUY_ORDER.indexOf(b.s.id));
      for (const { s, i } of avail) {
        if (G.trinkets.length >= MAX_TRINKETS) break;
        if (G.chips >= E.price(TRINKETS[s.id].cost) + 2 && E.buy(i)) { bought = true; break; }
      }
    }
    E.nextBlind();
  }

  function playRun(seed, maxAnte) {
    E.newRun(seed);
    let guard = 0;
    while (G.phase !== 'over' && guard++ < 6000) {
      if (G.phase === 'won') return { ante: ANTES, won: true };
      if (G.ante > (maxAnte || 12)) return { ante: maxAnte, won: false }; // endless cap for sim
      if (G.duel.over === 'win') { botShop(); continue; }
      if (G.duel.turn === 'you') botTurn();
      else E.pull(E.oppDecide());
    }
    return { ante: G.ante, won: false, blind: G.blind };
  }

  const N = 500;
  let crashes = 0, wins = 0, duels = 0, shots = 0, gunSum = 0, chipsAtDeath = 0;
  const anteReached = {};
  const bossDeaths = {};

  for (let run = 0; run < N; run++) {
    try {
      const r = playRun('SIM-' + run, 9);
      const cleared = r.won ? ANTES : (G.ante - 1 + (G.blind / 3)); // fractional for reporting
      anteReached[Math.floor(r.won ? 8 : G.ante - (G.blind === 0 && G.ante > 1 ? 0 : 0))] =
        (anteReached[Math.floor(r.won ? 8 : G.ante)] || 0) + 1;
      if (r.won) wins++;
      else if (G.blind === 2 && G.duel && G.duel.opp.boss) {
        bossDeaths[G.duel.opp.boss] = (bossDeaths[G.duel.opp.boss] || 0) + 1;
      }
      duels += G.run.duelsWon; shots += G.run.shots; gunSum += G.gunIdx;
      chipsAtDeath += G.chips;
    } catch (e) {
      crashes++;
      console.log('CRASH run', run, e.message, e.stack.split('\n')[1]);
      if (crashes > 4) break;
    }
  }

  console.log('--- duel bot, N=' + N + ' ---');
  const diedAt = Object.entries(anteReached).sort((a, b) => +a[0] - +b[0]);
  const reached = (n) => diedAt.filter(([k]) => +k >= n).reduce((s, [, v]) => s + v, 0) + 0;
  [2, 3, 4, 5, 6, 7, 8].forEach(n =>
    console.log('reached ante ' + n + ': ' + (reached(n) / N * 100).toFixed(1) + '%'));
  console.log('full wins (bullfrog down):', wins, '(' + (wins / N * 100).toFixed(1) + '%)');
  console.log('avg duels won:', (duels / N).toFixed(1),
    '· avg shots:', (shots / N).toFixed(1),
    '· avg gun idx:', (gunSum / N).toFixed(2),
    '· avg chips held:', (chipsAtDeath / N).toFixed(1));
  console.log('boss table deaths:', JSON.stringify(bossDeaths));
  console.log('crashes:', crashes);

  /* --- fuzz: random flailing at every decision point --- */
  let fuzzCrashes = 0;
  for (let run = 0; run < 200; run++) {
    try {
      E.newRun('FUZZ-' + run);
      let guard = 0;
      while (G.phase !== 'over' && G.phase !== 'won' && guard++ < 4000) {
        if (G.duel.over === 'win') {
          E.openShop();
          if (Math.random() < 0.5) E.reroll();
          if (Math.random() < 0.6) E.buy(Math.floor(Math.random() * 3));
          if (Math.random() < 0.3) E.buyGun();
          if (Math.random() < 0.25 && G.trinkets.length) E.sell(Math.floor(Math.random() * G.trinkets.length));
          E.nextBlind();
          continue;
        }
        if (G.duel.turn === 'you') {
          const r = Math.random();
          if (r < 0.25 && G.trinkets.length) E.useTrinket(Math.floor(Math.random() * G.trinkets.length));
          else if (r < 0.3) E.useGun(Math.random() < 0.5 ? 'saw' : 'tommy');
          else E.pull(Math.random() < 0.5 ? 'self' : 'foe');
        } else {
          E.pull(E.oppDecide());
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
