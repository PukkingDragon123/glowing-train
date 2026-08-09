'use strict';
/* ============================================================
   SHELL & DEBT — engine.js
   Run state + all core rules: the chamber, odds, calls,
   pot/streak/banking, antes, bosses, fates, economy.
   ============================================================ */

const DEBTS = [150, 250, 400, 600, 900, 1350, 2000, 3000];
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
    if (E.fateIs('houseBlinks') && !G.boss) d = Math.round(d * 0.8);
    return d;
  },

  startRound() {
    // boss for this ante (may be cancelled by The House Blinks)
    G.boss = G.bossSchedule[G.ante]
      || (G.ante > WIN_ANTE ? U.pick(G.rng, BOSS_POOL.concat('owner')) : null);
    if (E.fateIs('houseBlinks') && G.boss) G.boss = null;

    G.debt = E.currentDebt();
    G.score = 0;
    G.pot = 0;
    G.streak = 0;

    G.pullsMax = 10 + (E.fateIs('longTable') ? 3 : 0);
    G.pulls = G.pullsMax;
    G.sleightMax = 4 + (E.has('monocle') ? 1 : 0);
    G.sleight = G.sleightMax;

    G.flags = {
      rabbitUsed: false, ashtrayUsed: false, vampUsed: false,
      firstBankDone: false, secondWindUsed: G.flags ? G.flags.secondWindUsed : false,
      forcedNext: null, lastOutcome: null,
      smokePending: false, spiderArmed: false,
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
    // chamber empty — try a reload
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

  effWeights(inst) {
    const w = Object.assign({}, SHELLS[inst.id].w);
    if (E.fateIs('bloodNight')) w.BACKFIRE += 15;
    if (E.fateIs('grease')) w.JAM += 12;
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
    // hidden: average over all hidden shells currently in the chamber
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
    const echo = E.has('echoChamber');
    const linear = 1 + (echo ? 1.5 : 1.0) * n;
    const geo = Math.pow(echo ? 1.75 : 1.5, n);
    return Math.min(echo ? 40 : 30, Math.max(linear, geo));
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
    if (E.fateIs('looseChamber')) base += 10;
    const mult = odds.blind ? 3 : E.callMult(odds.probs[call]);
    const sm = E.streakMult(G.streak + 1);
    return Math.ceil(base * mult * sm);
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
      jammed: false, reloaded: false, roundOver: null, // 'won' | 'lost' | null
      streakGain: 0,
    };

    /* --- determine outcome --- */
    if (E.has('rabbit') && !G.flags.rabbitUsed) {
      R.outcome = call; R.forcedBy = 'rabbit'; G.flags.rabbitUsed = true;
      R.notes.push('🐇 The Loaded Rabbit twitches. It could not miss.');
    } else if (inst.id === 'magnet' && G.rng() < 0.6) {
      R.outcome = call; R.forcedBy = 'magnet';
      R.notes.push('🧲 The Magnet Shell bends to your will.');
    } else if (G.flags.forcedNext) {
      R.outcome = G.flags.forcedNext; R.forcedBy = 'web';
      R.notes.push('🕸️ The web holds — the outcome was already decided.');
    } else if (inst.id === 'echo' && G.flags.lastOutcome) {
      R.outcome = G.flags.lastOutcome; R.forcedBy = 'echo';
      R.notes.push('🔁 The Echo Shell repeats history.');
    } else {
      const w = E.effWeights(inst);
      R.outcome = U.wpick(G.rng, OUTCOMES, o => w[o]);
    }
    G.flags.forcedNext = null;
    if (inst.id === 'web') {
      G.flags.forcedNext = R.outcome;
      R.notes.push('🕸️ Silk threads onto the next shell — it will do the same.');
    }
    G.flags.lastOutcome = R.outcome;

    R.correct = (R.outcome === call);

    /* --- scoring / punishment --- */
    if (R.correct) {
      G.stats.hits++;
      let base = shell.base;
      if (E.fateIs('looseChamber')) base += 10;
      if (E.has('horseshoe') && R.outcome === 'DUD') base += 12;

      let gain = 1;
      if (inst.id === 'buck' && R.outcome === 'FIRE') gain++;
      if (inst.id === 'twin') gain++;
      G.streak += gain;
      R.streakGain = gain;

      const potBefore = G.pot;
      let pay = base * mult * E.streakMult(G.streak);
      if (inst.id === 'twin') { pay *= 2; R.notes.push('👯 Twin Shell — it counts twice.'); }

      if (E.fateIs('fireFever') && R.outcome === 'FIRE') pay *= 2;
      if (E.fateIs('blanksParty') && R.outcome === 'DUD') pay *= 2;
      if (E.fateIs('grease') && R.outcome === 'JAM') pay *= 3;
      if (E.fateIs('bloodNight') && R.outcome === 'BACKFIRE') pay *= 3;
      if (E.fateIs('zeroHour')) pay *= 1.5;
      if (E.fateIs('houseEyes')) pay *= 1.25;

      if (E.has('graveDancer') && R.outcome === 'BACKFIRE') {
        pay *= 2; R.notes.push('💃 The Grave Dancer approves. ×2.');
      }
      if (E.has('snakeCharmer') && E.effWeights(inst).BACKFIRE >= 0.4) {
        pay *= 2; R.notes.push('🐍 Snake Charmer — venom pays. ×2.');
      }
      if (E.has('allIn') && potBefore >= 200) {
        pay *= 2; R.notes.push('🔮 All-In Amulet burns bright. ×2.');
      }
      if (G.flags.smokePending) {
        pay *= 1.5; G.flags.smokePending = false;
        R.notes.push('🌫️ You strike from the smoke. ×1.5.');
      }
      if (G.flags.spiderArmed) {
        pay *= 3; G.flags.spiderArmed = false;
        R.notes.push('🕷️ Web of Fate — the trap springs. ×3.');
      }

      R.payout = Math.ceil(pay);
      G.pot += R.payout;
      G.stats.bestPayout = Math.max(G.stats.bestPayout, R.payout);

      if (inst.id === 'gilded') { G.chips += 4; R.notes.push('💰 Gilded casing: +4 chips.'); }
      if (inst.id === 'rust' && R.outcome === 'JAM') {
        G.sleight += 2; R.notes.push('🟤 Rust flakes reveal the trick: +2 Sleight.');
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

    /* --- post-resolution shell effects --- */
    if (G.flags.spiderArmed !== true && E.has('spider') && R.outcome === 'JAM') {
      G.flags.spiderArmed = true;
      R.notes.push('🕷️ The spider stirs. Your next payout ×3.');
    }
    if (inst.id === 'smoke') {
      G.flags.smokePending = true;
      R.notes.push('🌫️ Smoke floods the table. Next payout ×1.5.');
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
      R.notes.push('🌀 The Spinner whirls the chamber blind again.');
    }
    if (E.bossIs('collector') && G.score > 0) {
      const drain = Math.min(15, G.score);
      G.score -= drain;
      R.notes.push(`💼 The Debt Collector skims ${drain} off your score.`);
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
      // final forced bank
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
    if (E.fateIs('doubleNothing') && !G.flags.firstBankDone) amt *= 2;
    if (E.bossIs('vig')) amt *= 0.75;
    if (E.bossIs('owner')) amt *= 0.8;
    return Math.floor(amt);
  },

  doBank() {
    if (!E.canBank()) return null;
    const amt = E.bankAmount();
    const taxed = amt < G.pot;
    const doubled = E.fateIs('doubleNothing') && !G.flags.firstBankDone && amt > G.pot;
    G.flags.firstBankDone = true;
    G.score += amt;
    G.stats.bestBank = Math.max(G.stats.bestBank, amt);
    G.pot = 0;
    G.streak = 0;
    if (E.has('vampire') && amt >= 100 && !G.flags.vampUsed && G.nerve < G.nerveMax) {
      G.nerve++; G.flags.vampUsed = true;
    }
    const res = { amt, taxed, doubled, won: false };
    if (G.score >= G.debt) { E.roundWon(null); res.won = true; }
    return res;
  },

  /* ================= sleight ================= */

  sleightBlocked() { return E.bossIs('cage'); },

  peekCost() { return E.has('thumb') ? 0 : 1; },
  peekAllowed() {
    if (E.sleightBlocked() || E.blindRound() || E.fateIs('houseEyes')) return false;
    const top = E.topHole();
    return !!(top && !top.revealed) && G.sleight >= E.peekCost();
  },
  doPeek() {
    if (!E.peekAllowed()) return false;
    G.sleight -= E.peekCost();
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

  ejectCost() { return E.fateIs('looseChamber') ? 0 : 1; },
  ejectAllowed() {
    return !E.sleightBlocked() && G.sleight >= E.ejectCost() && !!E.topHole()
      && (E.shellsInChamber() + G.reserve.length) > 1;
  },
  doEject() {
    if (!E.ejectAllowed()) return false;
    G.sleight -= E.ejectCost();
    const top = E.topHole();
    G.holes[G.ptr] = null;
    G.spent.push(top.inst);
    const r = {};
    E.advancePtrAfter(r);
    return { inst: top.inst, reloaded: !!r.reloaded };
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
    const cap = E.has('greed') ? 40 : 20;
    return Math.min(cap, Math.floor(G.chips / 10) * 2);
  },

  roundWon(R) {
    G.flags.roundWon = true;
    G.stats.antesCleared = Math.max(G.stats.antesCleared, G.ante);
    G.stats.totalScore += G.score;

    let base = 30 + 4 * G.pulls;
    if (E.fateIs('highRoller')) base *= 2;
    const inter = E.interest();
    const extra = E.has('counterfeit') ? 8 : 0;
    G.flags.reward = { base, inter, extra, total: base + inter + extra };
    G.chips += G.flags.reward.total;
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
    if (G.ante === WIN_ANTE && G.phase !== 'endless-continue') {
      // handled by UI: win screen shows first; UI calls E.continueEndless()
    }
    G.ante++;
    G.fate = G.nextFate;
    G.nextFate = null;
    E.startRound();
  },

  continueEndless() {
    G.phase = 'round';
    E.nextAnte();
  },

  upcomingBoss() {
    const nextAnte = G.ante + 1;
    let b = G.bossSchedule[nextAnte] || (nextAnte > WIN_ANTE ? 'random' : null);
    if (G.nextFate === 'houseBlinks' && b && b !== 'random') b = null;
    return b;
  },

  gameOver(reason) {
    G.phase = 'gameover';
    G.overReason = reason; // 'nerve' | 'debt'
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
