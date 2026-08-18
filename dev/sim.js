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
const src = ['util.js', 'pix.js', 'data.js', 'meta.js', 'sprites.js', 'case.js', 'story.js', 'engine.js']
  .map(f => fs.readFileSync(jsdir + f, 'utf8')).join('\n;\n');

/* The story layer talks to the screen when a human is watching. Headless,
   the screen is a set of no-ops — every rule the bot exercises is in
   engine.js and story.js, and none of it needs a canvas. */
const STUBS = `
  const UI = { render(){}, stampSmall(){}, stampBig(){}, syncChips(){}, chipTick(){},
    shake(){}, syncDuel(){}, wrap(){}, txt(){}, goto(fn){ if (fn) fn(); return Promise.resolve(); } };
  const TUTOR = { say: async () => {}, skipAll(){}, armed(){ return false; }, check(){} };
  const SCENE = { close(){}, open(){}, walkTo(){} };
  const CINE = { driveTo: async () => {}, ambulance: async () => {}, dragLoad: async () => {},
    chapterCard: async () => {}, ending: async () => {}, titleBeat: async () => {},
    choice: async () => 'bullet', pick: async () => -1, anteClear: async () => {} };
`;

function driver() {

  /* what the bot knows: visible counts (respects Blind Newt) */
  function visible() {
    if (E.countsHidden()) return null;
    /* honest players track it themselves — the bot does too */
    return E.remaining();
  }

  function chamberKnown() {
    const d = G.duel;
    return d.known[d.ptr]; // true=live, false=blank, null=unknown
  }

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
    /* the belt, played the way a careful player plays it */
    useItemIf('whiskey', G.hearts <= E.maxHP() - 2);
    useItemIf('coinFlip', G.hearts >= E.maxHP() - 1 && d.opp.hp > 2);
    if (useItemIf('brassKnuckle', d.opp.hp === 1) && d.over) return null;
    useItemIf('smokeBomb', G.hearts === 1 && d.opp.hp > 1);

    let known = chamberKnown();
    const v = visible();
    const p = v === null ? 0.5 : (v.l + v.b === 0 ? 0.5 : v.l / (v.l + v.b));

    /* the pliers show the last shell, which is worth knowing late in a load */
    if (known === null && E.shellsLeft() <= 2) useItemIf('pliers', true);
    known = chamberKnown();

    if (known === false) return E.pull('self');
    if (known === true) {
      if (E.canUseGun('saw') && d.opp.hp >= 2) E.useGun('saw');
      if (E.canUseGun('tommy') && d.opp.hp >= 3) E.useGun('tommy');
      useItemIf('hollowPoint', d.opp.hp >= 3);
      return pullFoe();
    }
    /* nothing known and the drum looks hot: make the chamber safe */
    if (p >= 0.6 && useItemIf('lucky1', true)) return E.pull('self');
    if (p <= 0.42) return E.pull('self');
    if (p >= 0.85 && E.canUseGun('saw')) E.useGun('saw');
    return pullFoe();
  }

  /* rifle in tell-informed priority, bribe when it's worth it, pay the heat */
  const POCKET_ORDER = ['holster', 'tooth', 'vest', 'hand', 'hat', 'jacket', 'shirt', 'boot'];

  function botLoot() {
    let guard = 0;
    /* the headless bot has no frame loop, so it spends its own clock: every
       action costs a couple of seconds, and holding still to let the noise
       bleed off costs more. Without this the balance numbers are a lie. */
    const ACT = 2.2, WAIT = 1.6;
    while (G.phase === 'loot' && guard++ < 80) {
      E.lootTick(ACT);
      if (G.loot.done || G.phase !== 'loot') break;
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
    if (res.finale) return { finale: true };
    if (res.heatDue !== undefined) E.payHeat();   // short pocket costs the badge
    /* the UI walks you back to the bullpen; headless, go straight to the lead */
    if (G.phase === 'loot') G.phase = 'blind';
    return res;
  }

  /* THE CASE, PLAYED THROUGH. There is no game over any more: a bot that
     loses a duel wakes up in the ward, gets patched up and goes back out.
     What ends a run is the board filling up and the finale being taken, or
     the case collapsing after too many trips to the infirmary. */
  const WARD_LIMIT = 4;

  function resumeCase() {
    G.hearts = E.maxHP();
    G.briefed = G.chapter;            // the captain re-briefs you
    G.case = null;
    /* a finished table gets packed up and a new lead dealt; a live one is
       left exactly where it was */
    if (!G.duel || G.duel.over) { STORY.clearTable(); E.startBlind(); }
    G.phase = 'blind';
  }

  function playRun(seed, maxAnte) {
    E.newRun(seed);
    resumeCase();
    let guard = 0, wardTrips = 0, finale = false;
    while (guard++ < 6000) {
      if (G.phase === 'ward') {
        wardTrips++;
        if (wardTrips > WARD_LIMIT) break;      // the case collapses
        resumeCase();
        continue;
      }
      if (G.ante > (maxAnte || 12)) break;
      if (G.phase === 'precinct' || G.phase === 'board') { resumeCase(); continue; }
      if (G.phase === 'blind') {
        /* the bot works the room: it turns every free clue and asks every
           free question, then names whoever is still standing */
        workTheRoom();
        E.sitDown();
        continue;
      }
      if (G.phase === 'loot') {
        const r = botLoot();
        if (r && r.finale) { finale = true; break; }
        continue;
      }
      /* Dying already ran STORY.wardCost() through E.onRunOver(), which
         clears the table — so the ward is something we notice, not do. */
      /* Dying ran STORY.wardCost() through E.onRunOver(). The ward scene
         itself is a screen we do not have out here, so notice the trip and
         pick the case back up. */
      if ((G.wardTrips || 0) > wardTrips) {
        wardTrips = G.wardTrips;
        if (wardTrips > WARD_LIMIT) break;      // the case collapses
        resumeCase();
        continue;
      }
      if (!G.duel) { resumeCase(); continue; }
      if (G.duel.over) { if (G.phase === 'duel') G.phase = 'blind'; continue; }
      if (G.duel.turn === 'you') botTurn();
      else E.pull(E.oppDecide());
    }
    return {
      chapter: G.chapter, cards: (G.intelCards || []).length, wardTrips, finale,
      boardFull: STORY.canFinish(), badge: !G.badgePulled,
    };
  }

  /* the identification game, played by a bot with no eyes: it uses the free
     looks and questions, then names one of whoever is left */
  function workTheRoom() {
    if (!G.case) CASE.build();
    const c = G.case;
    if (c.known || c.done) return;
    let guard = 0;
    while (c.looks > 0 && guard++ < 20) {
      const i = c.clues.findIndex(cl => !cl.seen);
      if (i < 0) break;
      CASE.flip(i);
    }
    guard = 0;
    while (c.quiz > 0 && guard++ < 20) {
      const i = (c.asks || []).findIndex((a, k) => CASE.canAsk(k));
      if (i < 0) break;
      CASE.ask(i);
    }
    /* one more look off the books, if it is affordable and the field is wide */
    if (CASE.canGrease() && CASE.left() > 2 && G.chips >= CASE.greaseCost() * 2) CASE.grease();
    const stand = CASE.standing();
    const live = stand.map((ok, i) => ok ? i : -1).filter(i => i >= 0);
    if (!live.length) return;
    CASE.accuse(live[Math.floor(Math.random() * live.length)]);
  }

  const N = 500;
  let crashes = 0, finales = 0, boards = 0, badges = 0, goodEndings = 0;
  let chapters = 0, cards = 0, wards = 0, duelsWon = 0, shots = 0, gunSum = 0;
  const collapse = {};

  for (let run = 0; run < N; run++) {
    try {
      const r = playRun('SIM-' + run, 9);
      chapters += r.chapter; cards += r.cards; wards += r.wardTrips;
      if (r.finale) finales++;
      if (r.boardFull) boards++;
      if (r.badge) badges++;
      if (r.finale && r.boardFull && r.badge) goodEndings++;
      const key = r.finale ? 'reached the Bullfrog' : r.wardTrips > 4 ? 'case collapsed' : 'ran out of leads';
      collapse[key] = (collapse[key] || 0) + 1;
      duelsWon += G.run.duelsWon; shots += G.run.shots; gunSum += G.gunIdx;
    } catch (e) {
      crashes++;
      console.log('CRASH run', run, e.message, e.stack.split('\n')[1]);
      if (crashes > 4) break;
    }
  }

  console.log('--- the case, N=' + N + ' bots ---');
  console.log('board filled (all 5 pieces):', (boards / N * 100).toFixed(1) + '%');
  console.log('took the finale:            ', (finales / N * 100).toFixed(1) + '%');
  console.log('kept the badge:             ', (badges / N * 100).toFixed(1) + '%');
  console.log('GOOD ending available:      ', (goodEndings / N * 100).toFixed(1) + '%');
  console.log('avg chapters closed:', (chapters / N).toFixed(2),
    '· avg pieces pinned:', (cards / N).toFixed(2),
    '· avg ward trips:', (wards / N).toFixed(2));
  console.log('avg duels won:', (duelsWon / N).toFixed(1),
    '· avg shots:', (shots / N).toFixed(1),
    '· avg gun idx:', (gunSum / N).toFixed(2));
  console.log('how runs ended:', JSON.stringify(collapse));
  console.log('crashes:', crashes);

  /* --- fuzz: random flailing at every decision point --- */
  let fuzzCrashes = 0;
  for (let run = 0; run < 200; run++) {
    try {
      E.newRun('FUZZ-' + run);
      resumeCase();
      let guard = 0, trips = 0;
      while (guard++ < 4000) {
        if (G.phase === 'ward') { if (++trips > 4) break; resumeCase(); continue; }
        if (G.phase === 'precinct' || G.phase === 'board' || G.phase === 'ending') { resumeCase(); continue; }
        if (G.phase === 'blind') {
          if (Math.random() < 0.5) workTheRoom();
          E.sitDown();
          continue;
        }
        if (G.phase === 'loot') {
          const r = Math.random();
          if (r < 0.55) {
            E.rifle(Math.floor(Math.random() * G.loot.pockets.length));
          } else if (r < 0.7) {
            E.bribe();
          } else {
            const res = E.endLoot();
            if (res.finale) break;
            if (res.heatDue !== undefined) E.payHeat();
            if (G.phase === 'loot') G.phase = 'blind';
          }
          continue;
        }
        if ((G.wardTrips || 0) > trips) {
          trips = G.wardTrips;
          if (trips > 4) break;
          resumeCase();
          continue;
        }
        if (!G.duel) { resumeCase(); continue; }
        if (G.duel.over) { if (G.phase === 'duel') G.phase = 'blind'; continue; }
        if (G.duel.turn === 'you') {
          const r = Math.random();
          if (r < 0.3) E.useGun(Math.random() < 0.5 ? 'saw' : 'tommy');
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

new Function(STUBS + '\n;' + src + '\n;(' + driver.toString() + ')();')();
