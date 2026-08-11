'use strict';
/* ============================================================
   SHELL & DEBT — engine.js
   Pure rules, no DOM. A run is 8 antes × 3 blinds; every
   blind is a duel: a cylinder of LIVE and BLANK shells, you
   and a mark across the felt taking turns. Blank on yourself
   keeps your turn. Zero hearts ends somebody.
   ============================================================ */

let G = {};

const E = {

  /* ================= run ================= */

  newRun(seedStr) {
    seedStr = (seedStr && seedStr.trim()) ? seedStr.trim().toUpperCase() : U.randSeedStr();
    G = {
      phase: 'duel',
      seedStr, rng: U.mulberry32(U.hashSeed(seedStr)),
      ante: 1, blind: 0,                    // blind: 0 small · 1 big · 2 boss
      chips: ECON.start, gunIdx: 0,
      trinkets: [],                         // { id, used:{duel,reload} }
      hearts: PLAYER_HP,
      duel: null, loot: null,
      endless: false, wonRun: false, busted: false,
      run: { duelsWon: 0, shots: 0, damage: 0 },
    };
    META.bump('runs');
    /* grandpa's keepsake: one common card so you never walk in empty-handed */
    const commons = Object.values(TRINKETS).filter(t => t.rarity === 'common');
    G.trinkets.push({ id: commons[Math.floor(G.rng() * commons.length)].id, used: {} });
    E.startBlind();
    return G;
  },

  gun() { return GUNS[G.gunIdx]; },
  has(tid) { return G.trinkets.some(t => t.id === tid); },
  trinketBy(tid) { return G.trinkets.find(t => t.id === tid); },
  maxHP() { return PLAYER_HP + (E.has('totem') ? 1 : 0) + (G.gunIdx >= 4 ? 1 : 0); },

  bossFor(ante) {
    if (ante <= ANTES) return BOSSES[ante - 1];
    return BOSSES[Math.floor(G.rng() * (BOSSES.length - 1))]; // endless: anyone, scaled
  },

  blindName() { return BLIND_NAMES[G.blind]; },
  purse() { return BLIND_PURSE(G.ante, G.blind); },

  /* what's coming next (for the shop preview) */
  peekNext() {
    let ante = G.ante, blind = G.blind + 1;
    if (blind > 2) { blind = 0; ante++; }
    const boss = blind === 2 && ante <= ANTES ? BOSSES[ante - 1] : null;
    return { ante, blind, name: BLIND_NAMES[blind], purse: BLIND_PURSE(ante, blind), boss };
  },

  /* ================= starting a duel ================= */

  mookDef() {
    const rng = G.rng;
    return {
      skin: U.pick(rng, MOOK_SKINS),
      fat: rng() < 0.35,
      suit: U.pick(rng, MOOK_SUITS),
      shirt: rng() < 0.5 ? 'W' : 'w',
      tie: rng() < 0.5 ? U.pick(rng, ['d', 'G', 'T', 'n']) : null,
      bowtie: rng() < 0.15 ? 'r' : null,
      warts: rng() < 0.25,
      spots: rng() < 0.3,
      earring: rng() < 0.12 ? 'G' : null,
    };
  },

  /* roll tells onto a mook (hats are exclusive); deeper antes wear more */
  rollTraits() {
    const rng = G.rng;
    const r = rng();
    const cap = G.ante <= 2 ? 1 : G.ante <= 5 ? 2 : 3;
    const n = Math.min(cap, r < 0.15 ? 0 : r < 0.55 ? 1 : r < 0.87 ? 2 : 3);
    const hats = ['tophat', 'bowler', 'flatcap'];
    const out = [];
    let guard = 0;
    while (out.length < n && guard++ < 20) {
      const t = U.pick(rng, MOOK_TRAIT_POOL);
      if (out.includes(t)) continue;
      if (hats.includes(t) && out.some(x => hats.includes(x))) continue;
      out.push(t);
    }
    return out;
  },

  /* paint the tells onto the portrait def */
  traitsToDef(def, traits) {
    for (const t of traits) {
      if (t === 'tophat') def.hat = 'tophat';
      else if (t === 'bowler') def.hat = 'bowler';
      else if (t === 'flatcap') def.flatcap = true;
      else if (t === 'cigar') def.cigar = true;
      else def[t] = true;   // goldtooth, rings, scar, patch, sweats, vest
    }
    return def;
  },

  startBlind() {
    let opp;
    if (G.blind === 2) {
      const b = E.bossFor(G.ante);
      const scale = G.ante > ANTES ? Math.floor((G.ante - ANTES + 1) / 2) + 1 : 0;
      // boss tells are signature: cosmetic + loot, their hp/aggro already priced in
      const def = E.traitsToDef(Object.assign({}, FROG_DEFS[b.id]), b.traits);
      opp = { boss: b.id, name: b.name, hp: b.hp + scale, aggro: b.aggro,
              frog: b.id, rule: b.rule, desc: b.desc, traits: b.traits.slice(), def };
    } else {
      const traits = E.rollTraits();
      const def = E.traitsToDef(E.mookDef(), traits);
      let hp = MOOK_HP(G.ante, G.blind);
      let aggro = Math.min(0.78, 0.35 + G.rng() * 0.3 + (G.ante - 1) * 0.028);
      for (const t of traits) {
        hp += TRAITS[t].hp || 0;
        aggro += TRAITS[t].aggro || 0;
      }
      opp = {
        boss: null,
        name: U.pick(G.rng, G.blind === 0 ? MOOK_NAMES : CAPO_NAMES),
        hp, aggro: U.clamp(aggro, 0.18, 0.85),
        frog: null, def, traits,
      };
    }
    if (E.has('edge')) opp.hp = Math.max(1, opp.hp - 1);
    opp.maxHP = opp.hp;

    G.hearts = E.maxHP();
    G.duel = {
      opp, turn: 'you', over: null,
      shells: [], ptr: 0, known: [], lives: 0, blanks: 0, loads: 0, shots: 0,
      sawArmed: false, sawUsed: false, tommyUsed: false, extraShots: 0,
      cuffed: false, coltSpent: false, snakePrimed: false, revived: false,
      selfBlanks: 0, heartsLost: 0, dmgDealt: 0,
      payout: null,
    };
    G.trinkets.forEach(t => { t.used = {}; });
    G.phase = 'duel';
    return E.reload();
  },

  reload() {
    const d = G.duel, rng = G.rng;
    d.loads++;
    const total = LOAD_SIZE(G.ante, rng);
    const frac = Math.min(0.72, 0.32 + rng() * 0.30 + G.ante * 0.016);
    const lives = U.clamp(Math.round(total * frac), 1, total - 1);
    let blanks = total - lives;
    if (E.has('scales')) blanks++;
    const arr = [];
    for (let i = 0; i < lives; i++) arr.push(true);
    for (let i = 0; i < blanks; i++) arr.push(false);
    U.shuffle(rng, arr);
    d.shells = arr; d.ptr = 0;
    d.known = arr.map(() => null);
    d.lives = lives; d.blanks = blanks;
    G.trinkets.forEach(t => { t.used.reload = 0; });
    if (E.has('deadeye')) d.known[0] = d.shells[0];
    return { lives, blanks, total: lives + blanks };
  },

  bossIs(id) { return !!(G.duel && G.duel.opp.boss === id); },
  countsHidden() { return E.bossIs('blindfold'); },
  trinketsLocked() { return E.bossIs('cage'); },
  gunLocked() { return E.bossIs('lily'); },

  /* live/blank still in the drum (the truth — UI decides what to show) */
  remaining() {
    const d = G.duel;
    let l = 0, b = 0;
    for (let i = d.ptr; i < d.shells.length; i++) d.shells[i] ? l++ : b++;
    return { l, b };
  },

  shellsLeft() { return G.duel.shells.length - G.duel.ptr; },

  /* ================= THE PULL ================= */

  /* target: 'self' | 'foe' — relative to whoever's turn it is */
  pull(target) {
    const d = G.duel, by = d.turn;
    const live = d.shells[d.ptr];
    const ev = {
      by, target, live, dmg: 0, victim: null,
      fizzled: false, rosary: false, sawed: false,
      extraTurn: false, tommyShot: false, cuffSkip: false,
      shuffled: false, reloaded: null, over: null,
      croakHeal: 0, tonyTax: 0, revived: false, chips: 0,
    };
    d.ptr++; d.shots++; G.run.shots++;

    if (by === 'you') {
      META.bump('shots');
      if (E.bossIs('collector') && G.chips > 0) { G.chips--; ev.tonyTax = 1; }
    }

    /* -- damage math -- */
    let dmg = 0;
    if (live) {
      dmg = 1;
      if (by === 'you') {
        if (target === 'foe') {
          if (G.gunIdx >= 1 && !d.coltSpent) { dmg++; d.coltSpent = true; }
          if (E.has('blood') && d.opp.hp === d.opp.maxHP) dmg++;
          if (E.has('snake') && d.snakePrimed) { dmg++; d.snakePrimed = false; }
          if (E.has('gator')) dmg++;
        }
        if (d.sawArmed) { dmg *= 2; d.sawArmed = false; ev.sawed = true; }
      } else {
        if (d.opp.boss === 'owner' && d.revived) dmg = 2; // phase two: he's angry now
        if (target === 'foe') { // the mark is shooting YOU
          if (E.has('clover') && G.rng() < 1 / 6) { ev.fizzled = true; dmg = 0; }
        } else if (E.has('dirt')) dmg++; // he did it to himself, on salted felt
      }
    } else {
      /* -- blank bookkeeping -- */
      if (E.has('fly')) { G.chips += 1; ev.chips += 1; }
      if (by === 'you' && target === 'self') {
        d.selfBlanks++;
        META.bump('selfBlanks');
        if (E.has('shill')) { G.chips += 2; ev.chips += 2; }
      }
      if (by === 'you' && target === 'foe' && E.bossIs('croupier') &&
          d.opp.hp < d.opp.maxHP && (d.croakHeals || 0) < 1) {
        d.opp.hp++; ev.croakHeal = 1;
        d.croakHeals = (d.croakHeals || 0) + 1;
      }
    }

    /* -- apply damage -- */
    if (live && dmg > 0) {
      const victim = target === 'self' ? by : (by === 'you' ? 'foe' : 'you');
      ev.victim = victim;
      if (victim === 'you') {
        if (dmg >= G.hearts && E.has('rosary')) {
          G.hearts = 1; ev.rosary = true; dmg = 0;
          G.trinkets = G.trinkets.filter(t => t.id !== 'rosary');
        } else {
          G.hearts -= dmg;
          d.heartsLost += dmg;
          if (E.has('snake')) d.snakePrimed = true;
          META.bump('liveTaken');
          if (G.hearts <= 0) { G.hearts = 0; d.over = 'loss'; }
        }
      } else {
        d.opp.hp -= dmg;
        if (by === 'you') { d.dmgDealt += dmg; G.run.damage += dmg; }
        if (d.opp.hp <= 0) {
          if (d.opp.boss === 'owner' && !d.revived) {
            d.revived = true; d.opp.hp = 4; ev.revived = true;
          } else {
            d.opp.hp = 0; d.over = 'win';
            if (by === 'opp' && target === 'self') META.bump('oppSelfKills');
          }
        }
      }
      ev.dmg = dmg;
    }

    /* -- whose turn now -- */
    if (!d.over) {
      if (!live && target === 'self') {
        ev.extraTurn = true;                       // the whole game, right here
      } else if (by === 'you' && d.extraShots > 0) {
        d.extraShots--; ev.extraTurn = true; ev.tommyShot = true;
      } else if (by === 'you' && d.cuffed) {
        d.cuffed = false; ev.cuffSkip = true;      // mark is cuffed: still you
      } else {
        d.turn = by === 'you' ? 'opp' : 'you';
      }
    }

    /* -- dizzy sal: the drum never settles -- */
    if (!d.over && E.bossIs('spinner') && d.ptr < d.shells.length) {
      const rest = d.shells.slice(d.ptr);
      U.shuffle(G.rng, rest);
      for (let i = 0; i < rest.length; i++) {
        d.shells[d.ptr + i] = rest[i];
        d.known[d.ptr + i] = null;
      }
      ev.shuffled = true;
    }

    if (!d.over && d.ptr >= d.shells.length) ev.reloaded = E.reload();

    if (d.over === 'win') E.onDuelWon();
    if (d.over === 'loss') E.onRunOver();
    ev.over = d.over;
    return ev;
  },

  /* ================= the mark's brain ================= */

  oppDecide() {
    const d = G.duel;
    const { l, b } = E.remaining();
    if (l === 0) return 'self';
    if (b === 0) return 'foe';
    const p = l / (l + b);
    let a = d.opp.aggro === null ? G.rng() : d.opp.aggro; // dizzy sal flips a coin
    if (d.opp.hp === 1) a -= 0.07;                        // last heart: play it safer
    return p >= 1 - a ? 'foe' : 'self';
  },

  /* ================= trinket actives ================= */

  chargesLeft(t) {
    const def = TRINKETS[t.id];
    if (!def.active) return 0;
    if (def.active.per === 'duel') return t.used.duel ? 0 : 1;
    const max = E.has('watch') ? 2 : 1;
    return Math.max(0, max - (t.used.reload || 0));
  },

  canUseTrinket(i) {
    const t = G.trinkets[i];
    if (!t || G.phase !== 'duel' || G.duel.over || G.duel.turn !== 'you') return false;
    if (E.trinketsLocked()) return false;
    if (E.chargesLeft(t) <= 0) return false;
    if (t.id === 'cig' && G.hearts >= E.maxHP()) return false;
    if (t.id === 'cuffs' && G.duel.cuffed) return false;
    return true;
  },

  useTrinket(i) {
    if (!E.canUseTrinket(i)) return null;
    const t = G.trinkets[i], d = G.duel;
    const def = TRINKETS[t.id];
    if (def.active.per === 'duel') t.used.duel = 1;
    else t.used.reload = (t.used.reload || 0) + 1;
    META.bump('activesUsed');

    switch (t.id) {
      case 'cig':
        G.hearts++;
        return { type: 'heal' };
      case 'beer': {
        const was = d.shells[d.ptr];
        was ? d.lives-- : d.blanks--;
        d.ptr++;
        const reloaded = d.ptr >= d.shells.length ? E.reload() : null;
        return { type: 'eject', live: was, reloaded };
      }
      case 'glass':
        d.known[d.ptr] = d.shells[d.ptr];
        return { type: 'peek', live: d.shells[d.ptr] };
      case 'cuffs':
        d.cuffed = true;
        return { type: 'cuffs' };
      case 'mirror':
        d.shells[d.ptr] = !d.shells[d.ptr];
        d.known[d.ptr] = d.shells[d.ptr];
        return { type: 'mirror', live: d.shells[d.ptr] };
    }
    return null;
  },

  /* ================= gun actives ================= */

  canUseGun(kind) {
    const d = G.duel;
    if (!d || G.phase !== 'duel' || d.over || d.turn !== 'you' || E.gunLocked()) return false;
    if (kind === 'saw') return G.gunIdx >= GUN_ACTIVES.sawn && !d.sawUsed;
    if (kind === 'tommy') return G.gunIdx >= GUN_ACTIVES.tommy && !d.tommyUsed;
    return false;
  },

  useGun(kind) {
    if (!E.canUseGun(kind)) return null;
    const d = G.duel;
    if (kind === 'saw') { d.sawUsed = true; d.sawArmed = true; return { type: 'saw' }; }
    d.tommyUsed = true; d.extraShots++; return { type: 'tommy' };
  },

  /* ================= duel end / payout ================= */

  onDuelWon() {
    const d = G.duel;
    G.run.duelsWon++;
    META.bump('duelsWon');
    if (d.heartsLost === 0) META.bump('flawless');
    if (G.hearts === 1) META.bump('clutchWins');
    META.maxStat('maxDmgOneDuel', d.dmgDealt);
    if (G.blind === 2) {
      META.addBossKill(d.opp.boss);
      META.maxStat('bestAnte', G.ante);
    }

    /* what's sewn into the corpse */
    let sub = E.purse() + G.hearts;
    for (const t of d.opp.traits) sub += TRAITS[t].chips || 0;
    if (E.has('swarm') && d.heartsLost > 0) sub += 2 * d.heartsLost;
    let mult = 1;
    if (E.has('feather') && d.selfBlanks > 0) mult *= 1 + 0.1 * d.selfBlanks;
    if (E.has('ring')) mult *= 1.5;
    if (G.gunIdx >= 4) mult *= 1.5;
    const budget = Math.max(1, Math.round(sub * mult));

    /* cleared the ante-8 boss → the debt is paid (after you loot him) */
    if (G.blind === 2 && G.ante === ANTES && !G.endless) {
      META.bump('wins');
      G.wonRun = true;
    }
    META.save();
    E.openLoot(budget);
  },

  onRunOver() {
    META.bump('deaths');
    META.save();
    G.phase = 'over';
  },

  /* ================= the loot ================= */

  /* build the corpse's pockets from the kill budget + his tells */
  openLoot(budget) {
    const rng = G.rng, opp = G.duel.opp, tr = opp.traits;
    const pockets = [];
    const hat = tr.find(t => ['tophat', 'bowler', 'flatcap'].includes(t));
    if (hat) pockets.push({ id: 'hat', label: 'HIS HAT', w: hat === 'tophat' ? 2.4 : 1.2 });
    pockets.push({ id: 'jacket', label: 'JACKET', w: 1.4 });
    pockets.push(tr.includes('vest')
      ? { id: 'vest', label: 'THE VEST', w: 1, min: TRAITS.vest.chips }
      : { id: 'shirt', label: 'SHIRT', w: 1 });
    pockets.push(tr.includes('rings')
      ? { id: 'hand', label: 'HIS HAND', w: 0.8, min: TRAITS.rings.chips }
      : { id: 'hand', label: 'HIS HAND', w: 0.7 });
    pockets.push({ id: 'boot', label: 'BOOT', w: 0.6 });
    if (tr.includes('goldtooth')) pockets.push({ id: 'tooth', label: 'GOLD TOOTH', fixed: 5 });
    if (opp.boss) pockets.push({ id: 'holster', label: 'HOLSTER',
      gun: G.gunIdx < GUNS.length - 1, fixed: G.gunIdx < GUNS.length - 1 ? 0 : 8 });

    /* split the budget over the weighted pockets */
    const soft = pockets.filter(p => p.fixed === undefined);
    const wsum = soft.reduce((s, p) => s + p.w, 0);
    soft.forEach(p => {
      p.chips = Math.max(0, Math.round(budget * p.w / wsum) + U.ri(rng, -1, 1));
      if (p.min) p.chips = Math.max(p.min, p.chips);
    });
    /* one pocket is a dud — its chips slide into another (flies included) */
    const duds = soft.filter(p => !p.min);
    if (duds.length > 1) {
      const dud = U.pick(rng, duds);
      const rich = soft.find(p => p !== dud);
      rich.chips += dud.chips;
      dud.chips = 0; dud.lint = true;
    }
    pockets.forEach(p => { if (p.fixed !== undefined) p.chips = p.fixed; p.taken = false; });

    /* maybe a trinket card in one of them */
    if (rng() < LOOT_TUNING.trinketChance[G.blind]) {
      const RW = [[60, 30, 9, 1], [45, 35, 16, 4], [15, 40, 32, 13]][G.blind];
      const rar = ['common', 'uncommon', 'rare', 'legendary'];
      const pool = Object.values(TRINKETS).filter(t => META.isUnlocked(t.id) && !E.has(t.id));
      if (pool.length) {
        const card = U.wpick(rng, pool, t => RW[rar.indexOf(t.rarity)]);
        U.pick(rng, pockets.filter(p => !p.gun)).card = card.id;
      }
    }
    /* something square shows through the cloth */
    pockets.forEach(p => { p.bulge = !!(p.card || p.gun); });

    G.loot = { pockets, sinceBribe: 0, bribes: 0, pendingCard: null, done: false };
    G.phase = 'loot';
    return G.loot;
  },

  lootLeft() { return G.loot.pockets.filter(p => !p.taken).length; },
  canRifle() {
    return G.phase === 'loot' && !G.loot.done && !G.loot.pendingCard &&
      G.loot.sinceBribe < LOOT_TUNING.freePockets;
  },
  heatUp() { // the badges are at the door
    return G.phase === 'loot' && !G.loot.done &&
      G.loot.sinceBribe >= LOOT_TUNING.freePockets && E.lootLeft() > 0;
  },

  rifle(i) {
    if (!E.canRifle()) return null;
    const p = G.loot.pockets[i];
    if (!p || p.taken) return null;
    p.taken = true;
    G.loot.sinceBribe++;
    G.chips += p.chips;
    META.bump('looted');
    if (p.gun) { G.gunIdx++; META.ownGun(GUNS[G.gunIdx].id); META.save(); }
    if (p.card) {
      if (G.trinkets.length < MAX_TRINKETS) G.trinkets.push({ id: p.card, used: {} });
      else G.loot.pendingCard = p.card;
    }
    return p;
  },

  /* full trinket rack: swap or leave the found card */
  resolveCard(replaceIdx) {
    const card = G.loot.pendingCard;
    if (!card) return;
    if (replaceIdx !== null && G.trinkets[replaceIdx]) {
      G.trinkets[replaceIdx] = { id: card, used: {} };
    }
    G.loot.pendingCard = null;
  },

  bribeCost() {
    if (E.has('marked') && G.loot.bribes === 0) return 0;
    let c = LOOT_TUNING.bribeBase + G.ante * LOOT_TUNING.bribePerAnte + G.loot.bribes * LOOT_TUNING.bribeStep;
    if (E.has('glove')) c = Math.max(1, c - 2);
    return c;
  },

  bribe() {
    const c = E.bribeCost();
    if (!G.loot || G.loot.done || G.chips < c || E.lootLeft() === 0) return false;
    G.chips -= c;
    G.loot.bribes++;
    G.loot.sinceBribe = 0;
    META.bump('bribesPaid');
    return true;
  },

  /* walk out: learn his tells, then face the badges if it's a boss */
  endLoot() {
    if (G.loot.pendingCard) G.loot.pendingCard = null; // left it on the corpse
    G.loot.done = true;
    const learned = [];
    for (const t of G.duel.opp.traits) if (META.learnTrait(t)) learned.push(t);
    META.save();
    if (G.wonRun) { G.phase = 'won'; return { learned, won: true }; }
    if (G.blind === 2) return { learned, heatDue: HEAT_COST(G.ante) };
    E.nextBlind();
    return { learned };
  },

  /* protection money after a boss. Can't pay = they take the marker. */
  payHeat() {
    const cost = HEAT_COST(G.ante);
    if (G.chips < cost) {
      G.busted = true;
      META.bump('deaths');
      META.save();
      G.phase = 'over';
      return false;
    }
    G.chips -= cost;
    META.bump('heatPaid');
    E.nextBlind();
    return true;
  },

  nextBlind() {
    G.blind++;
    if (G.blind > 2) { G.blind = 0; G.ante++; }
    return E.startBlind();
  },

  goEndless() {
    G.endless = true;
    G.wonRun = false;
    META.maxStat('bestAnte', ANTES); // keep collection hints truthful
    E.nextBlind();
  },
};
