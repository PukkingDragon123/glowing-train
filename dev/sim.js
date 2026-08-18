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
const src = ['util.js', 'pix.js', 'data.js', 'meta.js', 'sprites.js', 'case.js', 'engine.js']
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
  function itemIdx(id) { return G.items.indexOf(id); }
  function useItemIf(id, cond) {
    const i = itemIdx(id);
    if (i < 0 || !cond) return false;
    return !!(E.canUseItem(i) && E.useItem(i));
  }

  /* THE STEADY CHECK, AS A DIE ROLL. The real one is a moving marker the
     player has to break the shot on; headless, the bot rolls for it at a
     plausible human skill level that gets worse as the bands tighten. */
  function steadyRoll() {
    const d = G.duel;
    const a = G.ante;
    const pClean = Math.max(0.12, 0.34 - (a - 1) * 0.024);
    const pWide = Math.min(0.22, 0.04 + (a - 1) * 0.024);
    const r = Math.random();
    d.aimClean = r < pClean;
    d.aimWide = !d.aimClean && r > 1 - pWide;
  }
  function pullFoe() { steadyRoll(); return E.pull('foe'); }

  function botTurn() {
    const d = G.duel;
    /* heal when hurting */
    const cig = trinketIdx('cig');
    if (cig >= 0 && G.hearts <= 2 && E.canUseTrinket(cig)) E.useTrinket(cig);
    useItemIf('whiskey', G.hearts <= E.maxHP() - 2);
    useItemIf('coinFlip', G.hearts >= E.maxHP() - 1 && d.opp.hp > 2);
    if (useItemIf('brassKnuckle', d.opp.hp === 1) && d.over) return null;
    useItemIf('smokeBomb', G.hearts === 1 && d.opp.hp > 1);

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
      useItemIf('hollowPoint', d.opp.hp >= 3);
      return pullFoe();
    }
    /* nothing known and the drum looks hot: make the chamber safe */
    if (p >= 0.6 && useItemIf('lucky1', true)) return E.pull('self');
    /* unknown: play the odds like the marks do */
    if (p <= 0.42) {
      const be = trinketIdx('beer');
      if (p >= 0.3 && be >= 0 && E.canUseTrinket(be)) { E.useTrinket(be); return null; }
      return E.pull('self');
    }
    if (p >= 0.85 && E.canUseGun('saw')) E.useGun('saw');
    return pullFoe();
  }

  /* rifle in tell-informed priority, bribe when it's worth it, pay the heat */
  const POCKET_ORDER = ['holster', 'tooth', 'vest', 'hand', 'hat', 'jacket', 'shirt', 'boot'];
  const RARITY_VAL = { common: 1, uncommon: 2, rare: 3, legendary: 4 };

  function botLoot() {
    let guard = 0;
    /* the headless bot has no frame loop, so it spends its own clock: every
       action costs a couple of seconds, and holding still to let the noise
       bleed off costs more. Without this the balance numbers are a lie. */
    const ACT = 2.2, WAIT = 1.6;
    while (G.phase === 'loot' && guard++ < 80) {
      E.lootTick(ACT);
      if (G.loot.done || G.phase !== 'loot') break;
      if (G.loot.pendingCard) {
        // swap over the cheapest-rarity card we hold, if the find is better
        const worst = G.trinkets.reduce((w, t, i) =>
          RARITY_VAL[TRINKETS[t.id].rarity] < RARITY_VAL[TRINKETS[G.trinkets[w].id].rarity] ? i : w, 0);
        const found = RARITY_VAL[TRINKETS[G.loot.pendingCard].rarity];
        E.resolveCard(found > RARITY_VAL[TRINKETS[G.trinkets[worst].id].rarity] ? worst : null);
        continue;
      }
      /* if the room is nearly too loud and there is clock to burn, wait */
      if (!G.loot.caught && G.loot.noise > 0.66 && G.loot.time > 12 && E.lootLeft() > 0) {
        E.lootTick(WAIT);
        continue;
      }
      useItemIf('pliers', G.loot.pockets.some(p => p.id === 'tooth' && !p.taken));
      /* the loupe pays for itself early: it shows every bulge AND buys a pocket */
      useItemIf('loupe', E.lootLeft() >= 3 && !G.loot.pockets.some(p => p.seen));
      /* the shiv goes into the fattest pocket already turned out */
      if (G.loot.tool !== 'shiv') {
        useItemIf('shiv', !E.canRifle() &&
          G.loot.pockets.some(p => p.taken && !p.slit && p.chips >= 4));
      }
      if (G.loot.tool === 'shiv') {
        const lin = G.loot.pockets
          .map((p, i) => ({ p, i })).filter(x => x.p.taken && !x.p.slit)
          .sort((a, b) => b.p.chips - a.p.chips)[0];
        if (lin) { E.rifle(lin.i); continue; }
        G.loot.tool = null;
      }
      if (E.canRifle()) {
        const cand = G.loot.pockets
          .map((p, i) => ({ p, i }))
          .filter(x => !x.p.taken)
          .sort((a, b) => (b.p.bulge - a.p.bulge) ||
            /* when the room is already loud, take the quiet pocket first */
            (G.loot.noise > 0.45 ? E.noiseOf(a.i) - E.noiseOf(b.i) : 0) ||
            (POCKET_ORDER.indexOf(a.p.id) - POCKET_ORDER.indexOf(b.p.id)));
        if (!cand.length) break;
        E.rifle(cand[0].i);
        continue;
      }
      if (E.heatUp()) {
        if (useItemIf('fileFolder', E.lootLeft() >= 2)) continue;
        const reserve = G.blind === 2 ? E.heatDue() : Math.ceil(E.heatDue() / 2);
        if (E.lootLeft() >= 1 && G.loot.bribes < 2 && G.chips >= E.bribeCost() + reserve) {
          if (E.bribe()) continue;
        }
      }
      /* the pockets are done. What is left is the trail on the floor: wipe
         it while there is clock, because leaving it is a fine now and
         dearer protection later. */
      const st = (G.loot.stains || []).findIndex((s2, i) => E.canMop(i));
      if (st >= 0 && !G.loot.caught && G.loot.time > MESS_TUNING.seconds + 3) {
        E.mop(st);
        E.lootTick(MESS_TUNING.seconds);
        continue;
      }
      break;
    }
    /* and pay for whatever is still down there */
    const bill = E.messBill();
    if (bill) {
      G.chips = Math.max(0, G.chips - bill.chips);
      if (bill.heat) G.messHeat = (G.messHeat || 0) + 1;
    }
    const res = E.endLoot();
    if (res.heatDue !== undefined) E.payHeat(); // busts to 'over' on a short pocket
  }

  function playRun(seed, maxAnte) {
    E.newRun(seed);
    if (G.phase === 'station') G.phase = 'blind';
    let guard = 0;
    while (G.phase !== 'over' && guard++ < 6000) {
      if (G.phase === 'won') return { ante: ANTES, won: true };
      if (G.ante > (maxAnte || 12)) return { ante: maxAnte, won: false }; // endless cap for sim
      if (G.phase === 'blind') {
        /* the bot skips a small blind only when it is already flush and healthy */
        if (E.canSkip() && G.blind === 0 && G.chips >= HEAT_COST(G.ante) + 12 && Math.random() < 0.25) E.skipBlind();
        else E.sitDown();
        continue;
      }
      if (G.phase === 'loot') { botLoot(); continue; }
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
  console.log('items used per run:', (META.stats().itemsUsed / N).toFixed(2),
    '· skips:', (META.stats().skips / N).toFixed(2));
  console.log('boss table deaths:', JSON.stringify(bossDeaths));
  console.log('crashes:', crashes);

  /* --- fuzz: random flailing at every decision point --- */
  let fuzzCrashes = 0;
  for (let run = 0; run < 200; run++) {
    try {
      E.newRun('FUZZ-' + run);
      if (G.phase === 'station') G.phase = 'blind';
      let guard = 0;
      while (G.phase !== 'over' && G.phase !== 'won' && guard++ < 4000) {
        if (G.phase === 'blind') {
          if (Math.random() < 0.3 && E.canSkip()) E.skipBlind(); else E.sitDown();
          continue;
        }
        if (G.phase === 'loot') {
          const r = Math.random();
          if (G.loot.pendingCard) {
            E.resolveCard(Math.random() < 0.5 ? null : Math.floor(Math.random() * G.trinkets.length));
          } else if (r < 0.55) {
            E.rifle(Math.floor(Math.random() * G.loot.pockets.length));
          } else if (r < 0.7) {
            E.bribe();
          } else {
            const res = E.endLoot();
            if (res.heatDue !== undefined) E.payHeat();
          }
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
