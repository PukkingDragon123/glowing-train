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
      items: [],                            // belt: item ids (dupes allowed)
      hearts: PLAYER_HP,
      duel: null, loot: null,
      endless: false, wonRun: false, busted: false,
      tag: null, tagsTaken: [], skipped: 0,
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

  /* ---- belt items ---- */
  maxItems() { return MAX_ITEMS + (E.has('belt') ? 1 : 0); },
  hasItem(id) { return G.items.indexOf(id) >= 0; },
  itemRoom() { return G.items.length < E.maxItems(); },
  giveItem(id) { if (!E.itemRoom()) return false; G.items.push(id); return true; },
  freePockets() { return LOOT_TUNING.freePockets + (E.has('pockets') ? 1 : 0)
    + (G.tagPocket ? 1 : 0)
    - (G.duel && G.duel.opp.traits.some(t => TRAITS[t] && TRAITS[t].hot) ? 1 : 0); },

  /* damage outside the shell cycle (knuckles, shiv): flat, no gun/trinket bonuses */
  freeHit(dmg) {
    const d = G.duel;
    d.opp.hp -= dmg;
    d.dmgDealt += dmg; G.run.damage += dmg;
    if (d.opp.hp <= 0) {
      if (d.opp.boss === 'owner' && !d.revived) { d.revived = true; d.opp.hp = 4; }
      else { d.opp.hp = 0; d.over = 'win'; E.onDuelWon(); }
    }
    return dmg;
  },

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

  /* who wears what: street mooks are NOT handed police tunics or evening gowns */
  mookDef(rank) {
    const rng = G.rng;
    const pool = (typeof COSTUME_POOL !== 'undefined' && COSTUME_POOL[rank])
      ? COSTUME_POOL[rank] : null;
    const def = {
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
    if (pool) def.costume = U.pick(rng, pool);
    /* a bare frog head reads as unfinished — most of them wear something */
    if (rng() < 0.55) {
      const lids = rank === 'capo'
        ? [['hat', 'fedora'], ['hat', 'bowler'], ['hat', 'fedora'], ['flatcap', true]]
        : [['flatcap', true], ['flatcap', true], ['hat', 'bowler'], ['hat', 'fedora']];
      const [k, v] = U.pick(rng, lids);
      def[k] = v;
      def.hatCol = U.pick(rng, ['T', 't', 'u', 'k']);
      def.band = U.pick(rng, ['d', 'K', 'u']);
    }
    if (def.bowtie) def.tie = null;
    return def;
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
      if (t === 'tophat') { def.hat = 'tophat'; def.flatcap = false; }
      else if (t === 'bowler') { def.hat = 'bowler'; def.flatcap = false; }
      else if (t === 'flatcap') { def.flatcap = true; def.hat = null; }
      else if (t === 'cigar') def.cigar = true;
      else if (t === 'chain') def.necklace = 'G';           // fat rope of gold
      else if (t === 'loudtie') { def.tie = 'P'; def.bowtie = null; }
      else if (t === 'braces') { def.costume = 'shirtsleeves'; def.braces = true; }
      else if (t === 'badge') def.tinBadge = true;          // pinned inside the coat
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
      const def = E.traitsToDef(E.mookDef(G.blind === 0 ? 'mook' : 'capo'), traits);
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
      hollow: false, smoke: false, gauzeUsed: false,
      payout: null,
    };
    G.trinkets.forEach(t => { t.used = {}; });
    /* DUTCH COURAGE rides along for exactly one duel */
    if (G.tag === 'nerve') { G.hearts += 1; G.duel.bonusHeart = true; G.tag = null; }
    G.phase = 'blind';                       // the select screen sits you down
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

  /* ---- the run: blind select, sitting down, skipping for a tag ---- */

  atBoss() { return G.blind === 2; },

  sitDown() {
    if (G.phase !== 'blind') return false;
    G.phase = 'duel';
    return true;
  },

  canSkip() { return G.phase === 'blind' && G.blind !== 2; },

  rollTag() { return U.pick(G.rng, TAG_POOL); },

  /* take the tag instead of the corpse */
  skipBlind() {
    if (!E.canSkip()) return null;
    const id = E.rollTag();
    G.tagsTaken.push(id);
    G.skipped++;
    META.bump('skips');
    switch (id) {
      case 'purse': G.chips += 10; break;
      case 'item': {
        const pool = ITEM_IDS.filter(x => ITEMS[x]);
        const pick = U.pick(G.rng, pool);
        if (!E.giveItem(pick)) G.tag = null;
        break;
      }
      case 'pocket': G.tagPocket = true; break;
      case 'nerve': G.tag = 'nerve'; break;
      case 'iron': G.tagIron = true; break;
    }
    META.save();
    E.nextBlind();
    return TAGS[id];
  },

  /* everything you are carrying, for the run panel */
  runInfo() {
    return {
      seed: G.seedStr, ante: G.ante, blind: G.blind, blindName: E.blindName(),
      chips: G.chips, hearts: G.hearts, maxHP: E.maxHP(), gun: E.gun(),
      trinkets: G.trinkets.map(t => t.id),
      items: G.items.slice(),
      tags: G.tagsTaken.slice(),
      duelsWon: G.run.duelsWon, shots: G.run.shots, damage: G.run.damage,
      skipped: G.skipped, endless: G.endless,
      next: E.peekNext(),
    };
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
          if (E.has('nail') && G.hearts === 1) dmg += 2;
          if (d.hollow) { dmg += 2; d.hollow = false; ev.hollow = true; }
        }
        if (d.sawArmed) { dmg *= 2; d.sawArmed = false; ev.sawed = true; }
      } else {
        if (d.opp.boss === 'owner' && d.revived) dmg = 2; // phase two: he's angry now
        if (target === 'foe') { // the mark is shooting YOU
          if (d.smoke) { d.smoke = false; ev.smoked = true; dmg = 0; }
          else if (E.has('clover') && G.rng() < 1 / 6) { ev.fizzled = true; dmg = 0; }
        } else if (E.has('dirt')) dmg++; // he did it to himself, on salted felt
      }
    } else {
      /* -- blank bookkeeping -- */
      if (E.has('fly')) { G.chips += 1; ev.chips += 1; }
      if (by === 'opp' && target === 'foe' && d.smoke) { d.smoke = false; ev.smoked = true; }
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
      if (victim === 'you' && E.has('gauze') && !d.gauzeUsed) {
        d.gauzeUsed = true; dmg = Math.max(0, dmg - 1); ev.gauze = true;
      }
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
    if (t.id === 'dice' && E.shellsLeft() < 2) return false;
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
      case 'dice': {
        const rest = d.shells.slice(d.ptr);
        U.shuffle(G.rng, rest);
        for (let i = 0; i < rest.length; i++) {
          d.shells[d.ptr + i] = rest[i];
          d.known[d.ptr + i] = null;
        }
        return { type: 'shuffle' };
      }
      case 'shiv':
        return { type: 'shiv', dmg: E.freeHit(1) };
    }
    return null;
  },

  /* ================= belt items ================= */

  canUseItem(i) {
    const id = G.items[i];
    if (!id || !ITEMS[id]) return false;
    if (G.phase === 'duel') {
      const d = G.duel;
      if (!d || d.over || d.turn !== 'you') return false;
      if (!ITEM_PHASE_OK(id, 'duel')) return false;
      if (E.trinketsLocked()) return false;              // Warden Wart takes the belt too
      if (id === 'whiskey' && G.hearts >= E.maxHP()) return false;
      if (id === 'hollowPoint' && d.hollow) return false;
      if (id === 'smokeBomb' && d.smoke) return false;
      if (id === 'lucky1' && d.shells[d.ptr] === false) return false;
      if (id === 'pliers' && d.known[d.shells.length - 1] !== null) return false;
      return true;
    }
    if (G.phase === 'loot') {
      if (!G.loot || G.loot.done || G.loot.pendingCard || G.loot.pendingItem) return false;
      if (!ITEM_PHASE_OK(id, 'loot')) return false;
      if (id === 'fileFolder') return G.loot.sinceBribe > 0 && E.lootLeft() > 0;
      if (id === 'pliers') return G.loot.pockets.some(p => p.id === 'tooth' && !p.taken);
      return true;
    }
    return false;
  },

  useItem(i) {
    if (!E.canUseItem(i)) return null;
    const id = G.items[i], d = G.duel;
    G.items.splice(i, 1);                   // one shot: it is gone either way
    META.bump('itemsUsed');
    const r = { type: id };
    switch (id) {
      case 'whiskey':
        G.hearts = Math.min(E.maxHP(), G.hearts + 2);
        r.hearts = G.hearts; break;
      case 'coinFlip':
        r.heads = G.rng() < 0.5;
        if (r.heads) G.hearts = Math.min(E.maxHP(), G.hearts + 1);
        else if (G.hearts > 1) { G.hearts--; d.heartsLost++; }
        G.chips += 6; r.chips = 6; break;
      case 'pliers':
        if (G.phase === 'loot') {
          const t = G.loot.pockets.find(p => p.id === 'tooth' && !p.taken);
          if (t) { t.taken = true; G.chips += t.chips; r.chips = t.chips; r.pocket = 'tooth'; }
        } else {
          const last = d.shells.length - 1;
          d.known[last] = d.shells[last];
          r.live = d.shells[last]; r.at = last;
        }
        break;
      case 'spareBlank':
      case 'spareLive': {
        const live = id === 'spareLive';
        const at = U.ri(G.rng, d.ptr, d.shells.length);   // never behind the hammer
        d.shells.splice(at, 0, live);
        d.known.splice(at, 0, null);
        live ? d.lives++ : d.blanks++;
        r.live = live; r.at = at; break;
      }
      case 'hollowPoint': d.hollow = true; break;
      case 'smokeBomb':   d.smoke = true;  break;
      case 'lucky1': {
        r.was = d.shells[d.ptr];
        if (r.was) { d.shells[d.ptr] = false; d.lives--; d.blanks++; }
        d.known[d.ptr] = false; break;
      }
      case 'brassKnuckle': r.dmg = E.freeHit(1); break;
      case 'fileFolder': G.loot.sinceBribe = 0; r.cleared = true; break;
    }
    r.over = G.duel ? G.duel.over : null;
    return r;
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
    if (G.tagIron && G.gunIdx < GUNS.length - 1) {
      pockets.push({ id: 'holster', label: 'HOLSTER', gun: true, fixed: 0 });
      G.tagIron = false;
    } else if (opp.boss) pockets.push({ id: 'holster', label: 'HOLSTER',
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
    /* and maybe something for the belt */
    if (rng() < (E.has('contract') ? 1 : LOOT_TUNING.itemChance[G.blind])) {
      const rar = ['common', 'uncommon', 'rare', 'legendary'];
      const IW = ITEM_RW[G.blind];
      const pickId = U.wpick(rng, ITEM_IDS, id => IW[rar.indexOf(ITEMS[id].rarity)]);
      const spots = pockets.filter(p => !p.gun && !p.card);
      if (pickId && spots.length) U.pick(rng, spots).item = pickId;
    }

    /* something square shows through the cloth */
    pockets.forEach(p => { p.bulge = !!(p.card || p.gun || p.item); });

    G.loot = { pockets, sinceBribe: 0, bribes: 0, pendingCard: null, pendingItem: null, done: false };
    G.phase = 'loot';
    return G.loot;
  },

  lootLeft() { return G.loot.pockets.filter(p => !p.taken).length; },
  canRifle() {
    return G.phase === 'loot' && !G.loot.done && !G.loot.pendingCard &&
      G.loot.sinceBribe < E.freePockets();
  },
  heatUp() { // the badges are at the door
    return G.phase === 'loot' && !G.loot.done &&
      G.loot.sinceBribe >= E.freePockets() && E.lootLeft() > 0;
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
    if (p.item && !E.giveItem(p.item)) G.loot.pendingItem = p.item;
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

  /* full belt: swap or leave the item you found */
  resolveItem(replaceIdx) {
    const id = G.loot.pendingItem;
    if (!id) return;
    if (replaceIdx !== null && G.items[replaceIdx]) G.items[replaceIdx] = id;
    G.loot.pendingItem = null;
  },

  bribeCost() {
    if (E.has('marked') && G.loot.bribes === 0) return 0;
    let c = LOOT_TUNING.bribeBase + G.ante * LOOT_TUNING.bribePerAnte +
      (E.has('ledger') ? 0 : G.loot.bribes * LOOT_TUNING.bribeStep);
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
    if (G.loot.pendingItem) G.loot.pendingItem = null;
    G.loot.done = true;
    G.tagPocket = false;
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
