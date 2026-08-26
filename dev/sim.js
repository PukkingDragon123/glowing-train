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
const src = ['util.js', 'pix.js', 'data.js', 'meta.js', 'sprites.js', 'city.js',
  'case.js', 'story.js', 'engine.js']
  .map(f => fs.readFileSync(jsdir + f, 'utf8')).join('\n;\n');

/* The story layer talks to the screen when a human is watching. Headless,
   the screen is a set of no-ops — every rule the bot exercises is in
   engine.js and story.js, and none of it needs a canvas. */
const STUBS = `
  /* THE LIGHT, headless.

     CITY.watch() asks DAY which band of the day it is, and the bands are
     pure data, so the real thing would work here — but day.js also draws,
     and drawing wants a canvas. This is the data half of it, so the bot
     runs against the same six bands the player sees and a stray call to
     watch() cannot take the whole run down. */
  const DAY = {
    BANDS: [{ id: 'morning', word: 'MORNING', from: 8 * 60 },
            { id: 'midday', word: 'MIDDAY', from: 11 * 60 },
            { id: 'after', word: 'AFTERNOON', from: 14 * 60 },
            { id: 'gold', word: 'GOLDEN HOUR', from: 16 * 60 + 30 },
            { id: 'dusk', word: 'DUSK', from: 18 * 60 + 30 }],
    bandAt(m) {
      const mm = ((m | 0) % 1440 + 1440) % 1440;
      for (let i = DAY.BANDS.length - 1; i >= 0; i--) {
        if (mm >= DAY.BANDS[i].from) return DAY.BANDS[i];
      }
      return DAY.BANDS[0];
    },
    band() { return DAY.bandAt(CITY.minutes ? CITY.minutes() : 12 * 60); },
    word() { return DAY.band().word; },
    is(id) { return DAY.band().id === id; },
    lamps() { return DAY.band().id === 'dusk'; },
    sky(){}, wash(){}, shaft(){}, ramp(){}, cloud(){},
    mix(){ return [0, 0, 0]; }, hex(){ return [0, 0, 0]; }, rgb(){ return '#000'; },
    pal() { return DAY.band(); }, nextBand() { return DAY.band(); }, through() { return 0; },
    side() { return 1; }, stone() { return {}; },
  };
  const UI = { render(){}, stampSmall(){}, stampBig(){}, syncChips(){}, chipTick(){},
    shake(){}, syncDuel(){}, wrap(){}, txt(){}, goto(fn){ if (fn) fn(); return Promise.resolve(); } };
  const TUTOR = { say: async () => {}, skipAll(){}, armed(){ return false; }, check(){} };
  const SCENE = { close(){}, open(){}, walkTo(){}, focus(){}, unfocus(){},
    me: { x: 40 }, def: null };
  const PHONE = { open(){}, close(){}, toggle(){}, isOpen(){ return false; },
    /* the notification layer is presentation, but the CLOCK rings it, so
       the stub has to keep the ledger the rules read back */
    notify(o){ (G.notes = G.notes || []).push(o || {}); return o; },
    unread(){ return 0; }, markRead(){}, notes(){ return G.notes || []; } };
  const JOBS = { pour: async () => ({ hits: 0, perfect: 0, pay: 0, rounds: 3 }),
    donuts: async () => ({ hits: 0, perfect: 0, pay: 0, rounds: 3 }),
    rats: async () => ({ hits: 0, perfect: 0, pay: 0, rounds: 3 }),
    lock: async () => ({ hits: 0, perfect: 0, rounds: 3, open: false }),
    prints: async () => ({ hits: 0, perfect: 0, rounds: 3, clean: false }) };
  const TOOLS = { cur: () => 'hand', is: () => false, set() {}, reset() {}, of: () => ({}),
    onKey: () => false, LIST: [] };
  const FX = { screen: { flash() {}, shake() {}, vignette() {}, chroma() {}, slowmo() {},
    heartbeat() {} } };
  const PLACES = { build(){ return null; }, has(){ return false; }, floorsOf(){ return []; } };
  const CINE = { driveTo: async () => {}, ambulance: async () => {}, dragLoad: async () => {},
    chapterCard: async () => {}, ending: async () => {}, titleBeat: async () => {},
    choice: async () => 'bullet', pick: async () => -1, anteClear: async () => {},
    pickUp: async () => {}, glass: async () => {}, namedCard: async () => {}, dawnCard: async () => {},
    establish: async () => {}, letterbox(){}, busy: false };
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
        workTheCity();
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
      searches: G.simSearches || 0, nightsOut: G.simNightsOut || 0,
      errands: G.simErrands || 0, looks: G.simLooks || 0,
      presses: G.simPresses || 0, broke: G.simBroke || 0,
      shutOut: G.simShutOut || 0,
      named: G.run.called, misnamed: G.run.misnamed,
    };
  }

  /* THE INVESTIGATION, played by a bot with no eyes and no hunches.

     It drives to a stop, puts its hand in something at random, pays the
     clock for it, and keeps going until the night is gone or one face is
     left standing. Then it goes back to the station and says a name. A
     real player knows things this bot cannot — which is the point: these
     numbers are the floor, not the ceiling. */
  /* ------------------------------------------------------------
     AN ERRAND, HEADLESS.

     The real thing is a conversation, a lid dropped on a rat and a
     drive across town. What matters to the curve is the trade: a
     slice of clock for a guaranteed piece of evidence. The bot pays
     the same clock and takes the same payout, so the numbers below
     are what a player who works the city actually sees.
     ------------------------------------------------------------ */
  function payErrand(q) {
    G.quests[q.id] = 'paid';
    CITY.spend('job', 0.5);
    const clues = (G.case && G.case.clues) || [];
    const cl = clues.find(c2 => !c2.seen && c2.at === q.place) || clues.find(c2 => !c2.seen);
    if (cl) cl.seen = true;
    return !!cl;
  }

  /* standing in front of the frog who is offering: take it or do not */
  function tryErrand(place) {
    const q = STORY.questAt(place);
    if (!q) return 0;
    const st = STORY.questState(q.id);
    if (st === 'paid') return 0;
    if (st === 'ready') { payErrand(q); return 1; }
    if (st === 'taken') return 0;
    if (Math.random() > 0.7) return 0;            // not every player says yes
    G.quests = G.quests || {};
    G.quests[q.id] = 'taken';
    if (q.kind === 'job') {
      /* three rats, one lid: the same die roll the duel's steady check gets */
      if (Math.random() < 0.66) { payErrand(q); return 1; }
      G.quests[q.id] = 'none';
      return 0;
    }
    if (q.kind === 'wait') { CITY.spend('talk', q.mins / CITY.COST.talk); payErrand(q); return 1; }
    if (q.kind === 'search') {
      const props = CITY.unsearchedAt(place);
      if (props.indexOf(q.prop) < 0) return 0;    // somebody already turned it over
      CITY.markSearched(place, q.prop);
      CITY.spend('search');
      const clue = CITY.plantedAt(place, q.prop);
      if (clue) clue.seen = true;
      G.quests[q.id] = 'ready';
      return 0;                                   // he pays when you go back to him
    }
    return 0;                                     // a carry pays off across town
  }

  function workTheCity() {
    if (!G.case) CASE.build();
    const c = G.case;
    if (c.known || c.done) return;
    CITY.reset();                          // a fresh night per lead
    G.place = 'precinct';
    let guard = 0, searches = 0, errands = 0, looks = 0;
    let presses = 0, broke = 0, shutOut = 0;
    while (!CITY.nightOver() && CASE.left() > 1 && guard++ < 80) {
      /* somewhere in TONIGHT'S FILE with anything left to turn over. The
         city has eleven stops and the case only touches seven: a bot that
         drives to all of them is measuring a game nobody plays. */
      const stops = CASE.stops();
      const open = stops.filter(id => CITY.unsearchedAt(id).length);
      if (!open.length) break;
      /* a bot with a tip follows it; otherwise it picks a stop at random */
      const tipped = open.filter(id => G.tips && G.tips[id]);
      const to = (tipped.length && Math.random() < 0.6 ? tipped : open)[
        Math.floor(Math.random() * (tipped.length && Math.random() < 0.6 ? tipped.length : open.length))
      ] || open[0];
      if (!CITY.at(to)) {
        CITY.spend('travel'); CITY.visit(to); G.weather = CITY.rollWeather();
        STORY.questWatch({ arrive: to });         // anything you were carrying is here
      }
      errands += tryErrand(to);
      /* WORK THE ROOM WITH THE GLASS FIRST. Five minutes a prop to find out
         whether it is worth eighteen — which is how the city is meant to be
         played now that it has twenty-five things in it. The glass lies a
         quarter of the time on a dry prop, so the bot still digs blanks. */
      let here = 0;
      while (here++ < 4 && !CITY.nightOver() && CASE.left() > 1) {
        const props = CITY.unsearchedAt(to);
        if (!props.length) break;
        const prop = props[Math.floor(Math.random() * props.length)];
        const read = STORY.glassRead(to, prop);
        CITY.spend('look');
        looks++;
        if (!read.hot) continue;                 // the glass says leave it
        CITY.markSearched(to, prop);
        CITY.spend('search');
        searches++;
        const clue = CITY.plantedAt(to, prop);
        if (clue) clue.seen = true;
      }
      /* WHOSE STORY IS SET HERE.

         The counter frog knows whether the name on that wall was really
         standing where he says he was, and a bot that never asks is
         measuring a game with half its police work missing. It asks
         whenever there is a story to check here, and it can only break
         the one story that is a lie if it has already turned over the
         piece of evidence that proves it. */
      if (CITY.open ? CITY.open(to) : true) {
        const stories = CASE.alibiAt(to);
        /* A DETECTIVE LEANS ON THE ONE HE CAN PROVE. The phone tells the
           player which story he is holding something against, so a bot
           that presses at random is measuring a game nobody plays: it
           takes the provable one first and only guesses if there is
           nothing better in the room. */
        const armed = stories.filter(o => CASE.hasLever(o.i));
        const pick = armed.length ? armed
          : (Math.random() < 0.55 ? stories : []);
        if (pick.length) {
          const o = pick[Math.floor(Math.random() * pick.length)];
          const r2 = CASE.press(o.i);
          if (r2) { presses++; if (r2.broken) broke = 1; }
          CITY.spend('talk', 1.7);
        }
        /* and asks the witness something on the way out */
        if (Math.random() < 0.4) {
          const i = (c.asks || []).findIndex((a, k) => CASE.canAsk(k));
          if (i >= 0) { CASE.ask(i); CITY.spend('ask'); }
        }
      } else shutOut++;
    }
    CITY.spend('lineup');
    G.simSearches = (G.simSearches || 0) + searches;
    G.simLooks = (G.simLooks || 0) + looks;
    G.simErrands = (G.simErrands || 0) + errands;
    G.simPresses = (G.simPresses || 0) + presses;
    G.simBroke = (G.simBroke || 0) + broke;
    G.simShutOut = (G.simShutOut || 0) + shutOut;
    G.simNightsOut = (G.simNightsOut || 0) + (CITY.nightOver() ? 1 : 0);
    const stand = CASE.standing();
    const live = stand.map((ok, i) => ok ? i : -1).filter(i => i >= 0);
    if (!live.length) return;
    CASE.accuse(live[Math.floor(Math.random() * live.length)]);
  }

  const N = 500;
  let crashes = 0, finales = 0, boards = 0, badges = 0, goodEndings = 0;
  let chapters = 0, cards = 0, wards = 0, duelsWon = 0, shots = 0, gunSum = 0;
  let searches = 0, nightsOut = 0, named = 0, misnamed = 0, errands = 0, looks = 0;
  let presses = 0, broke = 0, shutOut = 0;
  const collapse = {};

  for (let run = 0; run < N; run++) {
    try {
      const r = playRun('SIM-' + run, 9);
      chapters += r.chapter; cards += r.cards; wards += r.wardTrips;
      searches += r.searches; nightsOut += r.nightsOut; errands += r.errands;
      looks += r.looks;
      presses += r.presses; broke += r.broke; shutOut += r.shutOut;
      named += r.named; misnamed += r.misnamed;
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
  console.log('errands run: avg', (errands / N).toFixed(2), 'per run ·',
    'glass looks: avg', (looks / N).toFixed(1), 'per run');
  console.log('alibis: avg', (presses / N).toFixed(2), 'stories checked ·',
    (broke / N).toFixed(2), 'broken ·',
    (shutOut / N).toFixed(2), 'arrivals after closing time');
  console.log('the investigation: avg', (searches / N).toFixed(1), 'props searched per run ·',
    (named / N).toFixed(2), 'named right ·', (misnamed / N).toFixed(2), 'named wrong ·',
    (nightsOut / N).toFixed(2), 'nights ran out');
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
          if (Math.random() < 0.5) workTheCity();
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
