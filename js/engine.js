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
      duel: null, shop: null,
      endless: false,
      run: { duelsWon: 0, shots: 0, damage: 0 },
    };
    META.bump('runs');
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
      fat: rng() < 0.3,
      suit: U.pick(rng, MOOK_SUITS),
      shirt: rng() < 0.5 ? 'W' : 'w',
      tie: rng() < 0.6 ? U.pick(rng, ['d', 'G', 'T', 'n']) : null,
      hat: rng() < 0.35 ? 'fedora' : null, hatCol: 'T', band: 'd',
      flatcap: rng() < 0.25,
      cigar: rng() < 0.3,
      warts: rng() < 0.3,
    };
  },

  startBlind() {
    let opp;
    if (G.blind === 2) {
      const b = E.bossFor(G.ante);
      const scale = G.ante > ANTES ? Math.floor((G.ante - ANTES + 1) / 2) + 1 : 0;
      opp = { boss: b.id, name: b.name, hp: b.hp + scale, aggro: b.aggro,
              frog: b.id, rule: b.rule, desc: b.desc };
    } else {
      opp = {
        boss: null,
        name: U.pick(G.rng, G.blind === 0 ? MOOK_NAMES : CAPO_NAMES),
        hp: MOOK_HP(G.ante, G.blind),
        aggro: Math.min(0.78, 0.35 + G.rng() * 0.3 + (G.ante - 1) * 0.028),
        frog: null, def: E.mookDef(),
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
      if (by === 'you' && target === 'foe' && E.bossIs('croupier') && d.opp.hp < d.opp.maxHP) {
        d.opp.hp++; ev.croakHeal = 1;
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

    const rows = [];
    let sub = E.purse();
    rows.push(['THE PURSE', '+' + sub]);
    rows.push(['HEARTS LEFT', '+' + G.hearts]);
    sub += G.hearts;
    if (E.has('swarm') && d.heartsLost > 0) {
      const s = 2 * d.heartsLost;
      sub += s; rows.push(['THE SWARM', '+' + s]);
    }
    let mult = 1;
    if (E.has('feather') && d.selfBlanks > 0) {
      const m = 1 + 0.1 * d.selfBlanks;
      mult *= m; rows.push(['FEATHER FAN', '×' + m.toFixed(1)]);
    }
    if (E.has('ring')) { mult *= 1.5; rows.push(['KINGPIN RING', '×1.5']); }
    if (G.gunIdx >= 4) { mult *= 1.5; rows.push(['GOLDEN GUN', '×1.5']); }
    const total = Math.round(sub * mult);
    G.chips += total;
    d.payout = { rows, total };
    META.save();

    /* cleared the ante-8 boss → the debt is paid */
    if (G.blind === 2 && G.ante === ANTES && !G.endless) {
      META.bump('wins');
      META.save();
      G.phase = 'won';
    }
    return d.payout;
  },

  onRunOver() {
    META.bump('deaths');
    META.save();
    G.phase = 'over';
  },

  /* ================= shop ================= */

  openShop() {
    const interest = Math.min(ECON.interestCap, Math.floor(G.chips / ECON.interestPer));
    G.chips += interest;
    G.shop = {
      stock: E.rollStock(3),
      rerolls: 0, interest,
      gun: G.gunIdx < GUNS.length - 1 ? GUNS[G.gunIdx + 1] : null,
      gunSold: false,
    };
    G.phase = 'shop';
    return G.shop;
  },

  rollStock(n) {
    const pool = Object.values(TRINKETS)
      .filter(t => META.isUnlocked(t.id) && !E.has(t.id));
    const stock = [];
    for (let i = 0; i < n; i++) {
      const cand = pool.filter(t => !stock.some(s => s.id === t.id));
      if (!cand.length) break;
      const t = U.wpick(G.rng, cand, x => RARITY_META[x.rarity].w);
      stock.push({ id: t.id, sold: false });
    }
    return stock;
  },

  price(base) { return E.has('glove') ? Math.max(1, base - 2) : base; },
  sellValue(tid) { return Math.max(1, Math.floor(TRINKETS[tid].cost / 2)); },

  rerollCost() {
    if (E.has('marked') && G.shop.rerolls === 0) return 0;
    return ECON.reroll + G.shop.rerolls;
  },

  reroll() {
    const c = E.rerollCost();
    if (G.chips < c) return false;
    G.chips -= c;
    G.shop.rerolls++;
    G.shop.stock = E.rollStock(3);
    return true;
  },

  buy(i) {
    const slot = G.shop.stock[i];
    if (!slot || slot.sold) return false;
    const p = E.price(TRINKETS[slot.id].cost);
    if (G.chips < p || G.trinkets.length >= MAX_TRINKETS) return false;
    G.chips -= p;
    slot.sold = true;
    G.trinkets.push({ id: slot.id, used: {} });
    return true;
  },

  buyGun() {
    const g = G.shop.gun;
    if (!g || G.shop.gunSold) return false;
    const p = E.price(g.cost);
    if (G.chips < p) return false;
    G.chips -= p;
    G.gunIdx++;
    META.ownGun(g.id);
    META.save();
    G.shop.gunSold = true;
    G.shop.gun = null;
    return true;
  },

  sell(i) {
    const t = G.trinkets[i];
    if (!t) return false;
    G.chips += E.sellValue(t.id);
    G.trinkets.splice(i, 1);
    return true;
  },

  nextBlind() {
    G.blind++;
    if (G.blind > 2) { G.blind = 0; G.ante++; }
    return E.startBlind();
  },

  goEndless() {
    G.endless = true;
    META.maxStat('bestAnte', ANTES); // keep collection hints truthful
    E.nextBlind();
  },
};
