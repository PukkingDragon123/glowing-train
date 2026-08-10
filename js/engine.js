'use strict';
/* ============================================================
   SHELL & DEBT — engine.js
   Run state + all core rules: the chamber, odds, calls,
   pot/streak/banking, guns, antes, the mob, economy.
   ============================================================ */

const DEBTS = [150, 250, 400, 620, 950, 1450, 2200, 3400];
const WIN_ANTE = 8;

const G = {}; // the run state — rebuilt by E.newRun()

const E = {

  /* ================= run lifecycle ================= */

  newRun(seedStr) {
    G.seedStr = (seedStr && seedStr.trim()) ? seedStr.trim().toUpperCase() : U.randSeedStr();
    G.rng = U.mulberry32(U.hashSeed(G.seedStr));

    G.ante = 1;
    G.chips = 20;
    G.nerveMax = 3;
    G.nerve = 3;
    G.charms = [];
    G.gunIdx = 0;        // your iron (index into GUNS)
    G.machinePlays = 0;  // total casino games played this run

    // starting bag: instances {uid, id}
    G.bag = [];
    ['live', 'live', 'live', 'live', 'blank', 'blank', 'blank', 'feather', 'rust', 'glass']
      .forEach(id => G.bag.push({ uid: U.uid(), id }));

    // boss schedule for the run
    const pool = BOSS_POOL.slice();
    U.shuffle(G.rng, pool);
    G.bossSchedule = { 3: pool[0], 6: pool[1], 8: 'owner' };

    G.fate = null;      // fate active THIS round
    G.nextFate = null;  // fate queued by roulette for next round
    G.boss = null;
    G.flags = null;     // wiped so nothing leaks from a previous run
    G.endlessMode = false;

    G.stats = {
      pulls: 0, hits: 0, misses: 0, bestPayout: 0, bestBank: 0,
      totalScore: 0, backfiresEaten: 0, chipsPeak: 20,
      jackpots: 0, bjWins: 0, derbyWins: 0, antesCleared: 0,
    };

    G.phase = 'round';
    E.startRound();
  },

  currentDebt() {
    let d = (G.ante <= DEBTS.length)
      ? DEBTS[G.ante - 1]
      : Math.round(DEBTS[DEBTS.length - 1] * Math.pow(1.6, G.ante - DEBTS.length) / 10) * 10;
    if (E.fateIs('highRoller')) d = Math.round(d * 1.25);
    if (E.fateIs('zeroHour')) d = Math.round(d * 0.65);
    return d;
  },

  startRound() {
    G.boss = G.bossSchedule[G.ante]
      || (G.ante > WIN_ANTE ? U.pick(G.rng, BOSS_POOL.concat('owner')) : null);
    const blinkSpared = E.fateIs('houseBlinks') && !!G.boss; // the boss stays home
    if (blinkSpared) G.boss = null;

    G.debt = E.currentDebt();
    if (E.fateIs('houseBlinks') && !blinkSpared) G.debt = Math.round(G.debt * 0.8);
    G.score = 0;
    G.pot = 0;
    G.streak = 0;

    G.pullsMax = 10 + (E.fateIs('longTable') ? 3 : 0) + (G.gunIdx >= 3 ? 2 : 0);
    G.pulls = G.pullsMax;
    G.sleightMax = 3 + (E.has('monocle') ? 1 : 0);
    G.sleight = G.sleightMax;

    G.flags = {
      rabbitUsed: false, ashtrayUsed: false, vampUsed: false,
      secondWindUsed: G.flags ? G.flags.secondWindUsed : false,
      forcedNext: null,
      spiderArmed: false,
      roundWon: false, reward: null,
    };

    // deal the bag into reserve; chamber loads from it
    G.reserve = U.shuffle(G.rng, G.bag.slice());
    G.holes = [null, null, null, null, null, null];
    G.ptr = 0;
    G.spent = [];
    E.ensureChamber();

    G.phase = 'round';
  },

  /* ================= chamber plumbing ================= */

  ensureChamber() {
    if (G.holes.some(h => h)) return false;
    if (!G.reserve.length) return false;
    for (let i = 0; i < 6 && G.reserve.length; i++) {
      const inst = G.reserve.shift();
      G.holes[i] = { inst, revealed: inst.id === 'glass' || E.fateIs('coldDeck') };
    }
    G.ptr = 0;
    return true; // reloaded
  },

  topHole() { return G.holes[G.ptr] || null; },

  shellsInChamber() { return G.holes.filter(h => h).length; },

  advancePtr() {
    for (let step = 1; step <= 6; step++) {
      const i = (G.ptr + step) % 6;
      if (G.holes[i]) { G.ptr = i; return step; }
    }
    if (E.ensureChamber()) return 'reload';
    return 'empty';
  },

  shuffleChamber() { // spin: occupied shells land in random holes, re-hidden
    const shells = G.holes.filter(h => h);
    U.shuffle(G.rng, shells);
    G.holes = [null, null, null, null, null, null];
    const slots = U.shuffle(G.rng, [0, 1, 2, 3, 4, 5]).slice(0, shells.length).sort((a, b) => a - b);
    shells.forEach((h, k) => {
      h.revealed = h.inst.id === 'glass' || E.fateIs('coldDeck');
      G.holes[slots[k]] = h;
    });
    G.ptr = G.holes.findIndex(h => h);
    if (G.ptr < 0) G.ptr = 0;
  },

  /* ================= odds & payouts ================= */

  has(charmId) { return G.charms.includes(charmId); },
  fateIs(id) { return !!(G.fate && G.fate === id); },
  bossIs(id) { return G.boss === id; },
  blindRound() { return E.bossIs('blindfold') || E.bossIs('owner'); },

  /* guns */
  gun() { return GUNS[G.gunIdx]; },
  nextGun() { return GUNS[G.gunIdx + 1] || null; },
  gunBase() { return G.gunIdx >= 1 ? 6 : 0; },
  canBuyGun() {
    const n = E.nextGun();
    return !!n && G.chips >= E.price(n.cost) && G.machinePlays >= n.req;
  },
  buyGun() {
    if (!E.canBuyGun()) return false;
    G.chips -= E.price(E.nextGun().cost);
    G.gunIdx++;
    return true;
  },
  notePlay() { G.machinePlays++; },

  unlocked(station) { return G.ante >= (UNLOCKS[station] || 1); },

  effWeights(inst) {
    const w = Object.assign({}, SHELLS[inst.id].w);
    if (E.fateIs('bloodNight')) w.BACKFIRE += 15;
    const total = OUTCOMES.reduce((s, o) => s + w[o], 0);
    const out = {};
    OUTCOMES.forEach(o => out[o] = w[o] / total);
    return out;
  },

  // what the player sees for the shell about to resolve
  topOdds() {
    if (E.blindRound()) return { blind: true, probs: null, hidden: true };
    const top = E.topHole();
    if (!top) return { blind: false, probs: null, hidden: true };
    if (top.revealed) return { blind: false, probs: E.effWeights(top.inst), hidden: false };
    const hidden = G.holes.filter(h => h && !h.revealed);
    const probs = { FIRE: 0, DUD: 0, JAM: 0, BACKFIRE: 0 };
    hidden.forEach(h => {
      const w = E.effWeights(h.inst);
      OUTCOMES.forEach(o => probs[o] += w[o]);
    });
    OUTCOMES.forEach(o => probs[o] /= hidden.length || 1);
    return { blind: false, probs, hidden: true };
  },

  callMult(p) {
    if (p === null || p === undefined) return 3; // blind rounds: flat ×3
    const m = 1.0 / Math.max(p, 0.04);
    return Math.round(U.clamp(m, 1.1, 25) * 10) / 10;
  },

  streakMult(streak) {
    // chunky linear growth early, compounding growth on deep rides
    const n = Math.max(0, streak - 1);
    return Math.min(30, Math.max(1 + n, Math.pow(1.5, n)));
  },

  // rough preview of what a correct call would pay right now
  estPayout(call) {
    const odds = E.topOdds();
    const top = E.topHole();
    if (!top) return 0;
    let base;
    if (odds.hidden && !odds.blind) {
      const hid = G.holes.filter(h => h && !h.revealed);
      base = hid.reduce((s, h) => s + SHELLS[h.inst.id].base, 0) / (hid.length || 1);
    } else if (odds.blind) {
      const all = G.holes.filter(h => h);
      base = all.reduce((s, h) => s + SHELLS[h.inst.id].base, 0) / (all.length || 1);
    } else {
      base = SHELLS[top.inst.id].base;
    }
    base += E.gunBase();
    const mult = odds.blind ? 3 : E.callMult(odds.probs[call]);
    let gain = 1;
    if (call === 'FIRE' && G.gunIdx >= 2) gain++;
    if (call === 'FIRE' && !odds.hidden && top.inst.id === 'buck') gain++;
    const sm = E.streakMult(G.streak + gain);
    let est = base * mult * sm;
    if (G.gunIdx >= 4) est *= 1.5;
    return Math.ceil(est);
  },

  /* ================= THE PULL ================= */

  doPull(call) {
    if (G.phase !== 'round' || G.flags.roundWon) return null;
    if (!OUTCOMES.includes(call)) return null;
    const top = E.topHole();
    if (!top || G.pulls <= 0) return null;

    const inst = top.inst;
    const shell = SHELLS[inst.id];
    const wasRevealed = top.revealed;
    const odds = E.topOdds();
    const pCall = odds.blind ? null : odds.probs[call];
    const mult = E.callMult(pCall);

    G.pulls--;
    G.stats.pulls++;

    const R = {
      call, shell, inst, wasRevealed, mult,
      outcome: null, forcedBy: null, correct: false,
      payout: 0, notes: [], nerveLost: 0, dead: false,
      jammed: false, reloaded: false, roundOver: null,
      streakGain: 0,
    };

    /* --- determine outcome --- */
    if (E.has('rabbit') && !G.flags.rabbitUsed) {
      R.outcome = call; R.forcedBy = 'rabbit'; G.flags.rabbitUsed = true;
      R.notes.push('🐇 The Loaded Rabbit twitches. It could not miss.');
    } else if (inst.id === 'magnet' && G.rng() < 0.6) {
      R.outcome = call; R.forcedBy = 'magnet';
      R.notes.push('🧲 The Magnet Shell bends to your will.');
    } else if (G.flags.forcedNext && G.flags.forcedNext.fromUid !== inst.uid) {
      R.outcome = G.flags.forcedNext.outcome; R.forcedBy = 'web';
      R.notes.push('🕸️ The web holds — the outcome was already decided.');
    } else {
      const w = E.effWeights(inst);
      R.outcome = U.wpick(G.rng, OUTCOMES, o => w[o]);
    }
    G.flags.forcedNext = null;
    if (inst.id === 'web') {
      G.flags.forcedNext = { outcome: R.outcome, fromUid: inst.uid };
      R.notes.push('🕸️ Silk threads onto the next shell — it will do the same.');
    }

    R.correct = (R.outcome === call);

    /* --- scoring / punishment --- */
    if (R.correct) {
      G.stats.hits++;
      let base = shell.base + E.gunBase();
      if (E.has('horseshoe') && R.outcome === 'DUD') base += 12;

      let gain = 1;
      if (inst.id === 'buck' && R.outcome === 'FIRE') gain++;
      if (G.gunIdx >= 2 && R.outcome === 'FIRE') gain++;   // sawn-off
      G.streak += gain;
      R.streakGain = gain;

      const potBefore = G.pot;
      let pay = base * mult * E.streakMult(G.streak);

      if (E.fateIs('fireFever') && R.outcome === 'FIRE') pay *= 2;
      if (E.fateIs('blanksParty') && R.outcome === 'DUD') pay *= 2;
      if (E.fateIs('bloodNight') && R.outcome === 'BACKFIRE') pay *= 3;
      if (E.fateIs('zeroHour')) pay *= 1.5;

      if (E.has('graveDancer') && R.outcome === 'BACKFIRE') {
        pay *= 2; R.notes.push('💃 The Grave Dancer approves. ×2.');
      }
      if (E.has('allIn') && potBefore >= 200) {
        pay *= 2; R.notes.push('🔮 All-In Amulet burns bright. ×2.');
      }
      if (G.flags.spiderArmed) {
        pay *= 3; G.flags.spiderArmed = false;
        R.notes.push('🕷️ Web of Fate — the trap springs. ×3.');
      }
      if (G.gunIdx >= 4) pay *= 1.5; // the golden gun

      R.payout = Math.ceil(pay);
      G.pot += R.payout;
      G.stats.bestPayout = Math.max(G.stats.bestPayout, R.payout);

      if (inst.id === 'gilded') { G.chips += 4; R.notes.push('💰 Gilded casing: +4 chips.'); }
      if (inst.id === 'rust' && R.outcome === 'JAM') {
        G.sleight += 1; R.notes.push('🟤 Rust flakes reveal the trick: +1 Trick.');
      }
    } else {
      G.stats.misses++;
      if (G.pot > 0) R.notes.push(`The pot of ${U.fmt(G.pot)} burns on the felt.`);
      G.pot = 0;
      G.streak = 0;

      if (R.outcome === 'BACKFIRE') {
        let dmg = (inst.id === 'cursed') ? 2 : 1;
        if (E.fateIs('zeroHour')) dmg *= 2;
        G.nerve -= dmg;
        R.nerveLost = dmg;
        G.stats.backfiresEaten++;
        if (G.nerve <= 0) {
          if (E.has('secondWind') && !G.flags.secondWindUsed) {
            G.nerve = 1; G.flags.secondWindUsed = true;
            R.notes.push('🫀 SECOND WIND — your heart restarts out of spite.');
          } else {
            R.dead = true;
          }
        }
      }
      if (R.outcome === 'JAM' && E.has('ashtray') && !G.flags.ashtrayUsed) {
        G.pulls++; G.flags.ashtrayUsed = true;
        R.notes.push('🚬 The Pit Boss waves it off — pull refunded.');
      }
    }

    /* --- post-resolution effects --- */
    if (G.flags.spiderArmed !== true && E.has('spider') && R.outcome === 'JAM') {
      G.flags.spiderArmed = true;
      R.notes.push('🕷️ The spider stirs. Your next payout ×3.');
    }

    /* --- disposition --- */
    if (R.outcome === 'JAM') {
      R.jammed = true;
      top.revealed = true; // you watched it seize — you know this one now
      E.advancePtrAfter(R);
    } else {
      if (inst.id === 'feather') {
        G.pulls++;
        R.notes.push('🐔 Feathers everywhere — the pull refunds itself. +1 pull.');
      }
      G.holes[G.ptr] = null;
      G.spent.push(inst);
      if (inst.id === 'glass') {
        G.bag = G.bag.filter(s => s.uid !== inst.uid);
        R.notes.push('🔮 The Glass Shell shatters. Gone forever.');
      }
      E.advancePtrAfter(R);
    }

    if (E.bossIs('spinner') && E.shellsInChamber() > 0) {
      E.shuffleChamber();
      R.notes.push('🌀 Dizzy Sal whirls the chamber blind again.');
    }
    if (E.bossIs('collector') && G.score > 0) {
      const drain = Math.min(15, G.score);
      G.score -= drain;
      R.notes.push(`💼 TaxToad Tony skims ${drain} off your score.`);
    }

    /* --- end-of-round checks --- */
    if (R.dead) {
      E.gameOver('nerve');
      R.roundOver = 'dead';
      return R;
    }
    if (G.score >= G.debt) {
      E.roundWon(R);
      return R;
    }
    const outOfShells = E.shellsInChamber() === 0 && G.reserve.length === 0;
    if (G.pulls <= 0 || outOfShells) {
      if (outOfShells && G.pulls > 0) R.notes.push('The chamber runs dry. Nothing left to fire.');
      if (G.pot > 0) {
        const banked = E.bankAmount();
        G.score += banked;
        R.notes.push(`Last call — the table banks your pot: +${U.fmt(banked)}.`);
        G.pot = 0; G.streak = 0;
      }
      if (G.score >= G.debt) E.roundWon(R);
      else { E.gameOver('debt'); R.roundOver = 'lost'; }
    }
    return R;
  },

  advancePtrAfter(R) {
    const adv = E.advancePtr();
    if (adv === 'reload') R.reloaded = true;
  },

  /* ================= banking ================= */

  canBank() {
    if (G.pot <= 0 || G.phase !== 'round' || G.flags.roundWon) return false;
    if (E.bossIs('croupier') && G.streak < 2) return false;
    return true;
  },

  bankAmount() {
    let amt = G.pot;
    if (E.bossIs('vig')) amt *= 0.75;
    if (E.bossIs('owner')) amt *= 0.8;
    return Math.floor(amt);
  },

  doBank() {
    if (!E.canBank()) return null;
    const amt = E.bankAmount();
    const taxed = amt < G.pot;
    G.score += amt;
    G.stats.bestBank = Math.max(G.stats.bestBank, amt);
    G.pot = 0;
    G.streak = 0;
    if (E.has('vampire') && amt >= 100 && !G.flags.vampUsed && G.nerve < G.nerveMax) {
      G.nerve++; G.flags.vampUsed = true;
    }
    const res = { amt, taxed, won: false };
    if (G.score >= G.debt) { E.roundWon(null); res.won = true; }
    return res;
  },

  /* ================= tricks (peek / spin / load) ================= */

  sleightBlocked() { return E.bossIs('cage'); },

  peekAllowed() {
    if (E.sleightBlocked() || E.blindRound()) return false;
    const top = E.topHole();
    return !!(top && !top.revealed) && G.sleight >= 1;
  },
  doPeek() {
    if (!E.peekAllowed()) return false;
    G.sleight -= 1;
    E.topHole().revealed = true;
    return true;
  },

  spinAllowed() {
    return !E.sleightBlocked() && G.sleight >= 1 && E.shellsInChamber() > 1;
  },
  doSpin() {
    if (!E.spinAllowed()) return false;
    G.sleight -= 1;
    E.shuffleChamber();
    return true;
  },

  loadAllowed() {
    return !E.sleightBlocked() && G.sleight >= 1 && G.reserve.length > 0 && !!E.topHole();
  },
  doLoad(uid) {
    if (!E.loadAllowed()) return false;
    const idx = G.reserve.findIndex(s => s.uid === uid);
    if (idx < 0) return false;
    G.sleight -= 1;
    const inst = G.reserve.splice(idx, 1)[0];
    const top = E.topHole();
    if (top) G.reserve.push(top.inst); // swap the current top back into the pouch
    G.holes[G.ptr] = { inst, revealed: true };
    return inst;
  },

  /* ================= round end / economy ================= */

  interest() {
    return Math.min(20, Math.floor(G.chips / 10) * 2);
  },

  roundWon(R) {
    G.flags.roundWon = true;
    G.stats.antesCleared = Math.max(G.stats.antesCleared, G.ante);
    G.stats.totalScore += G.score;

    let base = 30 + 4 * G.pulls;
    if (E.fateIs('highRoller')) base *= 2;
    const total = base + E.interest();
    G.flags.reward = { total };
    G.chips += total;
    G.stats.chipsPeak = Math.max(G.stats.chipsPeak, G.chips);
    if (R) R.roundOver = 'won';
  },

  toCasino() {
    if (!G.flags.roundWon) return;
    G.phase = 'casino';
    G.fate = null; // this round's fate is spent
    G.casino = {
      slotsLeft: 5, bjLeft: 3, derbyLeft: 2, rouletteLeft: 1,
      rerollCost: 6,
      stock: E.rollCharmStock(),
      pityCount: 0,
    };
  },

  rollCharmStock() {
    const owned = new Set(G.charms);
    const pool = Object.values(CHARMS).filter(c => !owned.has(c.id));
    const stock = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const c = U.wpick(G.rng, pool, x => CHARM_RARITY_WEIGHT[x.rarity]);
      stock.push(c.id);
      pool.splice(pool.indexOf(c), 1);
    }
    return stock;
  },

  price(n) { return E.has('houseKey') ? Math.ceil(n * 0.75) : n; },

  addShellById(id) {
    const inst = { uid: U.uid(), id };
    G.bag.push(inst);
    return inst;
  },

  randomShellByRarity(rarity) {
    return U.pick(G.rng, SHELL_POOLS[rarity]);
  },

  nextAnte() {
    G.ante++;
    G.fate = G.nextFate;
    G.nextFate = null;
    E.startRound();
  },

  upcomingBoss() {
    const nextAnte = G.ante + 1;
    let b = G.bossSchedule[nextAnte] || (nextAnte > WIN_ANTE ? 'random' : null);
    if (G.nextFate === 'houseBlinks' && b && b !== 'random') b = null;
    return b;
  },

  gameOver(reason) {
    G.phase = 'gameover';
    G.overReason = reason; // 'nerve' | 'debt' | 'walk'
    E.saveBest();
  },

  winRun() {
    G.phase = 'win';
    E.saveBest();
  },

  saveBest() {
    try {
      const prev = JSON.parse(localStorage.getItem('shelldebt.best') || 'null');
      const cur = {
        ante: G.stats.antesCleared, score: G.stats.totalScore,
        seed: G.seedStr, when: Date.now(),
      };
      if (!prev || cur.ante > prev.ante || (cur.ante === prev.ante && cur.score > prev.score)) {
        localStorage.setItem('shelldebt.best', JSON.stringify(cur));
      }
    } catch (e) { /* private mode etc. */ }
  },

  loadBest() {
    try { return JSON.parse(localStorage.getItem('shelldebt.best') || 'null'); }
    catch (e) { return null; }
  },
};
