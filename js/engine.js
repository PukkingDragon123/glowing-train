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
      ante: 1, blind: 0,                    // the internal difficulty rung; the
                                            // player sees chapters, never numbers
      chips: ECON.start, gunIdx: 0,
      items: [],                            // belt: item ids (dupes allowed)
      hearts: PLAYER_HP,
      duel: null, loot: null,
      endless: false, wonRun: false, busted: false,
      skipped: 0, messHeat: 0,
      case: null, caseBonus: false, caseMiss: false, intel: 0,
      mayTalked: false, mayLook: false, mayHeart: false, capTalked: false,
      run: { duelsWon: 0, shots: 0, damage: 0, called: 0, misnamed: 0 },
    };
    META.bump('runs');
    /* A badge, a gun, a belt and a board with five holes in it. */
    STORY.reset();
    /* the night, the sky, and a city with nothing turned over in it yet */
    if (typeof CITY !== 'undefined') CITY.reset();
    G.place = 'precinct';
    G.visited = { precinct: 1 };
    E.startBlind();
    /* the case starts in the bullpen */
    G.phase = 'precinct';
    return G;
  },

  gun() { return GUNS[G.gunIdx]; },
  maxHP() { return PLAYER_HP + (G.mayHeart ? 1 : 0) + (G.gunIdx >= 4 ? 1 : 0); },

  /* ---- belt items ---- */
  maxItems() { return MAX_ITEMS; },
  hasItem(id) { return G.items.indexOf(id) >= 0; },
  itemRoom() { return G.items.length < E.maxItems(); },
  giveItem(id) { if (!E.itemRoom()) return false; G.items.push(id); return true; },
  /* ============================================================
     TIME AND NOISE. The clock runs the whole time you are back
     there; the noise you make bleeds away if you hold still. Cross
     the noise line and somebody at the door has heard enough.
     ============================================================ */

  /* ticked by the scene, in real seconds */
  lootTick(dt) {
    const L = G.loot;
    if (!L || L.done || G.phase !== 'loot') return null;
    if (L.noise > 0) L.noise = Math.max(0, L.noise - LOOT_TUNING.noiseDecay * dt);
    if (L.caught) return null;                 // the clock stops while they are on you
    L.time = Math.max(0, L.time - dt);
    if (L.time <= 0) { L.caught = true; L.overtime = true; return 'time'; }
    return null;
  },

  /* how loud going into this pocket would be, right now */
  noiseOf(i) {
    const p = G.loot && G.loot.pockets[i];
    if (!p) return 0;
    if (p.taken) return LOOT_TUNING.slitNoise;
    let n = LOOT_TUNING.noise[p.id] !== undefined ? LOOT_TUNING.noise[p.id] : 0.24;
    return n;
  },

  addNoise(n) {
    const L = G.loot;
    if (!L) return false;
    L.noise = Math.min(1.4, L.noise + n);
    if (L.noise >= 1 && !L.caught) { L.caught = true; return true; }
    return false;
  },

  /* kept for the notebook copy that still talks about free pockets */
  freePockets() { return 3; },

  /* ============================================================
     THE MESS.
     Dragging a frog through a doorway leaves a trail, and the
     trail is what hangs you. Every stain you wipe up costs you
     seconds off the clock and a little noise; every one you
     leave is something for somebody to find in the morning.
     ============================================================ */
  makeMess() {
    const L = G.loot;
    if (!L) return;
    const rng = G.rng;
    const n = MESS_TUNING.stains(G.ante);
    L.stains = [];
    /* a trail, not a scatter: it runs from the back door to where he
       stopped, because that is the way you brought him in */
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      L.stains.push({
        x: Math.round(316 - t * 76 + (rng() - 0.5) * 14),
        y: Math.round(2 + t * 22 + (rng() - 0.5) * 7),    // offset from the floor line
        r: 8 + Math.round(rng() * 8),
        seed: (rng() * 100000) | 0,
        done: false,
      });
    }
    L.mess = 1;
  },

  /* how much of the room is still evidence, 0..1 */
  messLeft() {
    const L = G.loot;
    if (!L || !L.stains || !L.stains.length) return 0;
    return L.stains.filter(s => !s.done).length / L.stains.length;
  },

  canMop(i) {
    const L = G.loot;
    return !!(L && !L.done && !L.caught && L.stains && L.stains[i] && !L.stains[i].done);
  },

  /* wipe one up. It is not free: the clock eats it and the rag talks. */
  mop(i) {
    if (!E.canMop(i)) return null;
    const L = G.loot;
    L.stains[i].done = true;
    L.time = Math.max(0, L.time - MESS_TUNING.seconds);
    const heard = E.addNoise(MESS_TUNING.noise);
    return { heard, left: E.messLeft() };
  },

  /* what you left behind, priced. Called when you walk out. */
  messBill() {
    const left = E.messLeft();
    if (left <= MESS_TUNING.forgive) return null;
    const over = left - MESS_TUNING.forgive;
    return {
      left,
      chips: Math.round(MESS_TUNING.fine * over * (1 + (G.ante - 1) * 0.25)),
      heat: over > 0.5,
    };
  },

  /* damage outside the shell cycle (knuckles, shiv): flat, no gun bonuses */
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
    opp.maxHP = opp.hp;

    G.hearts = E.maxHP();
    G.duel = {
      opp, turn: 'you', over: null,
      shells: [], ptr: 0, known: [], lives: 0, blanks: 0, loads: 0, shots: 0,
      sawArmed: false, sawUsed: false, tommyUsed: false, extraShots: 0,
      cuffed: false, coltSpent: false, revived: false,
      selfBlanks: 0, heartsLost: 0, dmgDealt: 0,
      hollow: false, smoke: false,
      aimWide: false, aimClean: false,
      payout: null,
    };
    /* DUTCH COURAGE rides along for exactly one duel */
    G.phase = 'blind';                       // the board sits you down
    G.caseBonus = false; G.caseMiss = false;
    CASE.build();
    return E.reload();
  },

  reload() {
    const d = G.duel, rng = G.rng;
    d.loads++;
    const total = LOAD_SIZE(G.ante, rng);
    const frac = Math.min(0.72, 0.32 + rng() * 0.30 + G.ante * 0.016);
    const lives = U.clamp(Math.round(total * frac), 1, total - 1);
    let blanks = total - lives;
    const arr = [];
    for (let i = 0; i < lives; i++) arr.push(true);
    for (let i = 0; i < blanks; i++) arr.push(false);
    U.shuffle(rng, arr);
    d.shells = arr; d.ptr = 0;
    d.known = arr.map(() => null);
    d.lives = lives; d.blanks = blanks;
    return { lives, blanks, total: lives + blanks };
  },

  /* ---- the run: blind select, sitting down, skipping for a tag ---- */

  atBoss() { return G.blind === 2; },

  sitDown() {
    if (G.phase !== 'blind') return false;
    G.phase = 'duel';
    return true;
  },

  /* everything you are carrying, for the run panel */
  runInfo() {
    return {
      seed: G.seedStr, ante: G.ante, blind: G.blind, blindName: E.blindName(),
      chips: G.chips, hearts: G.hearts, maxHP: E.maxHP(), gun: E.gun(),
      items: G.items.slice(),
      duelsWon: G.run.duelsWon, shots: G.run.shots, damage: G.run.damage,
      skipped: G.skipped, endless: G.endless,
      next: E.peekNext(),
    };
  },

  bossIs(id) { return !!(G.duel && G.duel.opp.boss === id); },
  countsHidden() { return E.bossIs('blindfold'); },
  beltLocked() { return E.bossIs('cage'); },
  gunLocked() { return E.bossIs('lily'); },

  /* live/blank still in the drum (the truth — UI decides what to show) */
  remaining() {
    const d = G.duel;
    let l = 0, b = 0;
    for (let i = d.ptr; i < d.shells.length; i++) d.shells[i] ? l++ : b++;
    return { l, b };
  },

  shellsLeft() { return G.duel.shells.length - G.duel.ptr; },

  /* The one number that actually decides every choice in this game:
     how likely the chamber under the hammer is live, right now. Returns
     null when the load is hidden and you are guessing blind. */
  liveOdds() {
    const d = G.duel;
    if (!d) return null;
    const k = d.known[d.ptr];
    if (k === true) return 1;
    if (k === false) return 0;
    if (E.countsHidden()) return null;
    const r = E.remaining(), n = r.l + r.b;
    return n ? r.l / n : 0;
  },

  /* ================= THE PULL ================= */

  /* target: 'self' | 'foe' — relative to whoever's turn it is */
  pull(target) {
    const d = G.duel, by = d.turn;
    if (d.over) return null;          // nobody shoots a finished table
    const live = d.shells[d.ptr];
    const ev = {
      by, target, live, dmg: 0, victim: null,
      fizzled: false, sawed: false,
      extraTurn: false, tommyShot: false, cuffSkip: false,
      shuffled: false, reloaded: null, over: null,
      croakHeal: 0, tonyTax: 0, revived: false, chips: 0,
    };
    d.ptr++; d.shots++; G.run.shots++;
    ev.wide = false; ev.clean = false;

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
          if (d.hollow) { dmg += 2; d.hollow = false; ev.hollow = true; }
        }
        if (d.sawArmed) { dmg *= 2; d.sawArmed = false; ev.sawed = true; }
        /* WHERE YOU PUT IT. The steady check has already run: a clean break
           puts it through the eye, a bad one throws the round into the wall
           behind him and the chamber is spent all the same. */
        if (target === 'foe') {
          /* skill pays double now that there is no card rack to lean on */
          if (d.aimWide) { dmg = 0; ev.wide = true; }
          else if (d.aimClean) { dmg += 2; ev.clean = true; }
        }
      } else {
        if (d.opp.boss === 'owner' && d.revived) dmg = 2; // phase two: he's angry now
        if (target === 'foe') { // the mark is shooting YOU
          if (d.smoke) { d.smoke = false; ev.smoked = true; dmg = 0; }
        }
      }
    } else {
      /* -- blank bookkeeping -- */
      if (by === 'opp' && target === 'foe' && d.smoke) { d.smoke = false; ev.smoked = true; }
      if (by === 'you' && target === 'self') {
        d.selfBlanks++;
        META.bump('selfBlanks');
      }
      if (by === 'you' && target === 'foe' && E.bossIs('croupier') &&
          d.opp.hp < d.opp.maxHP && (d.croakHeals || 0) < 1) {
        d.opp.hp++; ev.croakHeal = 1;
        d.croakHeals = (d.croakHeals || 0) + 1;
      }
    }

    d.aimWide = false; d.aimClean = false;

    /* -- apply damage -- */
    if (live && dmg > 0) {
      const victim = target === 'self' ? by : (by === 'you' ? 'foe' : 'you');
      ev.victim = victim;
      if (victim === 'you') {
        G.hearts -= dmg;
        d.heartsLost += dmg;
        META.bump('liveTaken');
        if (G.hearts <= 0) { G.hearts = 0; d.over = 'loss'; }
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

  /* ================= belt items ================= */

  canUseItem(i) {
    const id = G.items[i];
    if (!id || !ITEMS[id]) return false;
    if (G.phase === 'duel') {
      const d = G.duel;
      if (!d || d.over || d.turn !== 'you') return false;
      if (!ITEM_PHASE_OK(id, 'duel')) return false;
      if (E.beltLocked()) return false;                  // Warden Wart takes the belt
      if (id === 'whiskey' && G.hearts >= E.maxHP()) return false;
      if (id === 'hollowPoint' && d.hollow) return false;
      if (id === 'smokeBomb' && d.smoke) return false;
      if (id === 'lucky1' && d.shells[d.ptr] === false) return false;
      if (id === 'pliers' && d.known[d.shells.length - 1] !== null) return false;
      return true;
    }
    if (G.phase === 'loot') {
      if (!G.loot || G.loot.done || G.loot.pendingItem) return false;
      if (!ITEM_PHASE_OK(id, 'loot')) return false;
      if (id === 'fileFolder') return (G.loot.caught || G.loot.noise > 0.35) && E.lootLeft() > 0;
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
      case 'fileFolder':
        G.loot.caught = false; G.loot.noise = 0; G.loot.overtime = false;
        if (G.loot.time < 12) G.loot.time = 12;
        r.cleared = true; break;
      /* the shiv is not spent when you take it out — it is spent when you
         put it into a lining, so arming it is the whole of the use here */
      case 'shiv': G.loot.tool = 'shiv'; r.armed = true; break;
      case 'loupe':
        G.loot.pockets.forEach(p => { p.seen = true; });
        G.loot.bonusFree = (G.loot.bonusFree || 0) + 1;
        r.seen = true; break;
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
    let mult = 1;
    /* you named him before he sat down: the room paid for that */
    if (G.caseBonus) mult *= 1 + CASE_TUNING.hit;
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

  /* protection scales with the ante AND with every trail you left behind */
  heatDue() { return HEAT_COST(G.ante) + (G.messHeat || 0) * 8; },

  /* You do not get a game over. You get an ambulance, a bill, and a chart
     with your name on it. The case stays open because you are the only one
     who still thinks it is a case. */
  onRunOver() {
    META.save();
    return STORY.rushToWard();
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

    /* HIS PAPERS. Intel about the family, sewn into a coat more often than
       not: take it and one clue on the next line-up is already turned over
       when you walk in. This is what a detective is in the room FOR. */
    const bossPaper = !!G.duel.opp.boss && !STORY.canFinish();
    if ((bossPaper || (rng() < 0.18 && !G.duel.opp.boss)) && STORY.nextCard()) {
      const target = U.pick(rng, pockets.filter(p => !p.gun && p.id !== 'tooth'));
      if (target) target.dossier = true;
    }
    /* and maybe something for the belt */
    if (rng() < LOOT_TUNING.itemChance[G.blind]) {
      const rar = ['common', 'uncommon', 'rare', 'legendary'];
      const IW = ITEM_RW[G.blind];
      const pickId = U.wpick(rng, ITEM_IDS, id => IW[rar.indexOf(ITEMS[id].rarity)]);
      const spots = pockets.filter(p => !p.gun && !p.dossier);
      if (pickId && spots.length) U.pick(rng, spots).item = pickId;
    }

    /* something square shows through the cloth */
    pockets.forEach(p => { p.bulge = !!(p.dossier || p.gun || p.item); });

    G.loot = { pockets, bribes: 0, pendingItem: null,
      done: false, tool: null, bonusFree: 0, dragged: false,
      stains: [], mess: 0,
      noise: 0, caught: false, busted: false,
      time: Math.max(18, LOOT_TUNING.seconds + LOOT_TUNING.secondsPerAnte * (G.ante - 1)
        ),
      maxTime: 0 };
    G.loot.maxTime = G.loot.time;
    G.phase = 'loot';
    return G.loot;
  },

  lootLeft() { return G.loot.pockets.filter(p => !p.taken).length; },
  canRifle() {
    return G.phase === 'loot' && !G.loot.done && !G.loot.caught;
  },
  heatUp() { return G.phase === 'loot' && !G.loot.done && !!G.loot.caught; },

  /* can this pocket be gone into right now, and with what */
  canSearch(i) {
    const L = G.loot, p = L && L.pockets[i];
    if (!p || G.phase !== 'loot' || L.done || L.caught) return false;
    if (p.taken) return L.tool === 'shiv' && !p.slit;        // the lining is still there
    return true;
  },

  rifle(i) {
    const p = G.loot && G.loot.pockets[i];
    if (!p || !E.canSearch(i)) return null;
    /* SLITTING THE LINING: a pocket you already emptied, opened up with the
       shiv. Small take, and the badges never see your hands do it. */
    const loud = E.noiseOf(i);
    if (p.taken) {
      G.loot.tool = null;
      p.slit = true;
      const found = 1 + Math.ceil(p.chips * 0.5);
      G.chips += found;
      META.bump('looted');
      const heard = E.addNoise(loud);
      return { id: p.id, label: p.label, chips: found, slit: true, taken: true, noise: loud, heard };
    }
    p.taken = true;
    G.chips += p.chips;
    META.bump('looted');
    p.noise = loud;
    p.heard = E.addNoise(loud);
    if (p.gun) { G.gunIdx++; META.ownGun(GUNS[G.gunIdx].id); META.save(); }
    if (p.item && !E.giveItem(p.item)) G.loot.pendingItem = p.item;
    if (p.dossier) { p.foundCard = STORY.onDossier(); p.foundDossier = true; }
    return p;
  },

  /* full belt: swap or leave the item you found */
  resolveItem(replaceIdx) {
    const id = G.loot.pendingItem;
    if (!id) return;
    if (replaceIdx !== null && G.items[replaceIdx]) G.items[replaceIdx] = id;
    G.loot.pendingItem = null;
  },

  bribeCost() {
    let c = LOOT_TUNING.bribeBase + G.ante * LOOT_TUNING.bribePerAnte +
      G.loot.bribes * LOOT_TUNING.bribeStep;
    return c;
  },

  bribe() {
    const c = E.bribeCost();
    if (!G.loot || G.loot.done || G.chips < c || !G.loot.caught) return false;
    G.chips -= c;
    G.loot.bribes++;
    G.loot.caught = false;
    G.loot.noise = LOOT_TUNING.noiseGrace;
    /* they cost you the rest of the clock too if they came for the time */
    if (G.loot.overtime) { G.loot.overtime = false; G.loot.time = Math.max(10, G.loot.maxTime * 0.4); }
    META.bump('bribesPaid');
    return true;
  },

  /* walk out: learn his tells, then face the badges if it's a boss */
  endLoot() {
    if (G.loot.pendingItem) G.loot.pendingItem = null;
    G.loot.done = true;
    const learned = [];
    for (const t of G.duel.opp.traits) if (META.learnTrait(t)) learned.push(t);
    META.save();
    /* the Bullfrog himself, on the floor of his own flat: that is the end of
       the story, and the player picks which end it is */
    if (G.duel.opp.boss === 'owner') return { learned, finale: true };
    if (G.blind === 2) return { learned, heatDue: E.heatDue() };
    E.nextBlind();
    return { learned };
  },

  /* protection money after a boss. Can't pay = they take the marker. */
  /* Protection money. You cannot be run out of the game any more — if you
     cannot pay, they take the badge instead, and a case with no badge behind
     it can only ever end one way. */
  payHeat() {
    const cost = E.heatDue();
    if (G.chips < cost) {
      G.chips = 0;
      if (!G.badgePulled) {
        G.badgePulled = true;
        STORY.note('COULD NOT PAY. THEY TOOK THE BADGE AND LEFT YOU THE CASE.');
      }
      META.save();
      E.nextBlind();
      return false;
    }
    G.chips -= cost;
    META.bump('heatPaid');
    E.nextBlind();
    return true;
  },

  nextBlind() {
    G.blind++;
    if (G.blind > 2) { G.blind = 0; G.ante++; STORY.advance(); }
    return E.startBlind();
  },

  goEndless() {
    G.endless = true;
    G.wonRun = false;
    META.maxStat('bestAnte', ANTES); // keep collection hints truthful
    E.nextBlind();
  },
};
