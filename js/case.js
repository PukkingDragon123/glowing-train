'use strict';
/* ============================================================
   SHELL & DEBT — case.js
   THE BOARD.

   Three frogs are drinking in this room and exactly one of them
   is the bounty you came for. Nobody is going to point him out.
   What you have is a case file: a photograph with his head cut
   off, a matchbook, a barman who remembers a hat.

   Every clue is TRUE and every clue rules somebody out. Turn
   over enough of them and the string on the board only reaches
   one poster. Call that one out and he sits down across the
   felt from you, and he is not expecting it.

   Call out the wrong one and you have shown your hand to the
   whole room.
   ============================================================ */

/* ---------------- evidence art ---------------- */

PIX.def('ev_photo', `
KKKKKKKKKK
KWWWWWWWWK
KWttttttWK
KWtSSSStWK
KWtSssStWK
KWttssttWK
KWWWWWWWWK
KWKKWWKKWK
KWWWWWWWWK
KKKKKKKKKK`);

PIX.def('ev_match', `
..KKKK....
.KWWWWK...
KWRRRRWK..
KWWWWWWK..
KWKKKKWK..
KWWWWWWK..
.KWWWWK...
..KWWK.KK.
...KK.KRK.
......KKK.`);

PIX.def('ev_butt', `
..........
....KKKK..
...KWWWWK.
..KWWWWWK.
.KOoWWWK..
KOYoWWK...
KOoKKK....
.KK.......
..........
..........`);

PIX.def('ev_shell', `
...KKKK...
..KggggK..
..KgYYgK..
..KggggK..
..KgggGK..
..KggggK..
..KGgggK..
..KggggK..
...KKKK...
..........`);

PIX.def('ev_glass', `
.KKKKKKKK.
.KLllllLK.
.KLllllLK.
..KLllLK..
...KLLK...
....KK....
....KK....
...KKKK...
..KWWWWK..
...KKKK...`);

PIX.def('ev_print', `
KKKKKKKKKK
KWWWWWWWWK
KWKKKKKKWK
KWKWWWWKWK
KWKWKKWKWK
KWKWWKWKWK
KWKKKKWKWK
KWWWWWWWWK
KWWWWWWWWK
KKKKKKKKKK`);

PIX.def('ev_note', `
KKKKKKKKK.
KWWWWWWWK.
KWKKKKWWK.
KWWWWWWWK.
KWKKKKKWK.
KWWWWWWWK.
KWKKKWWWK.
KWWWWWWWK.
KKKKKKKKK.
..........`);

PIX.def('ic_pin', `
...KKK....
..KRRRK...
.KRRRRRK..
.KRRRRRK..
..KRRRK...
...KWK....
...KWK....
....K.....`);

/* ============================================================
   THE TESTS.
   Each one asks a suspect a yes/no question you could answer by
   looking at him. `of` reads the answer off his portrait def;
   `yes`/`no` are how the clue reads when the answer is one or
   the other, written as something a person in the room said.
   ============================================================ */

const CLUE_TESTS = [
  { id: 'hat', icon: 'ev_photo',
    of: (s) => (s.def.hat === 'tophat' ? 'tophat' : s.def.hat === 'bowler' ? 'bowler'
      : s.def.flatcap ? 'flatcap' : 'bare'),
    say: {
      tophat:  'THE DOORMAN REMEMBERS A TALL HAT',
      bowler:  'THE DOORMAN REMEMBERS A ROUND HAT',
      flatcap: 'THE DOORMAN REMEMBERS A FLAT CAP',
      bare:    'THE DOORMAN REMEMBERS NO HAT AT ALL',
    } },
  { id: 'build', icon: 'ev_glass',
    of: (s) => (s.def.fat ? 'fat' : 'thin'),
    say: { fat: 'THE CHAIR HE SAT IN IS SPLIT', thin: 'THE CHAIR HE SAT IN IS UNMARKED' } },
  { id: 'skin', icon: 'ev_print',
    of: (s) => s.def.skin[0],
    say: null, text: (v) => 'A SCALE ON THE GLASS: ' + SKIN_WORD(v) },
  { id: 'goldtooth', icon: 'ev_shell',
    of: (s) => (s.def.goldtooth ? 'y' : 'n'),
    say: { y: 'THE BARMAN SAW GOLD WHEN HE LAUGHED',
           n: 'THE BARMAN SAW NOTHING IN HIS MOUTH' } },
  { id: 'cigar', icon: 'ev_butt',
    of: (s) => (s.def.cigar ? 'y' : 'n'),
    say: { y: 'A CIGAR BURNED DOWN IN THE ASHTRAY',
           n: 'THE ASHTRAY BY HIS CHAIR IS CLEAN' } },
  { id: 'rings', icon: 'ev_match',
    of: (s) => (s.def.rings ? 'y' : 'n'),
    say: { y: 'THE MATCHBOOK IS SCRATCHED BY A RING',
           n: 'NO RING MARKS ON ANYTHING HE TOUCHED' } },
  { id: 'glasses', icon: 'ev_note',
    of: (s) => (s.def.glasses ? 'y' : 'n'),
    say: { y: 'HE HELD THE NOTE AN INCH FROM HIS FACE',
           n: 'HE READ THE NOTE ACROSS THE ROOM' } },
  { id: 'scar', icon: 'ev_photo',
    of: (s) => (s.def.scar ? 'y' : 'n'),
    say: { y: 'THE PHOTOGRAPH SHOWS A CUT FACE',
           n: 'THE PHOTOGRAPH SHOWS AN UNMARKED FACE' } },
  { id: 'patch', icon: 'ev_photo',
    of: (s) => (s.def.patch ? 'y' : 'n'),
    say: { y: 'HE PLAYED CARDS WITH ONE EYE',
           n: 'HE COUNTED HIS CARDS WITH BOTH EYES' } },
  { id: 'chain', icon: 'ev_shell',
    of: (s) => (s.def.necklace ? 'y' : 'n'),
    say: { y: 'A LINK OF GOLD CHAIN UNDER THE TABLE',
           n: 'NOTHING GOLD LEFT UNDER THE TABLE' } },
  { id: 'warts', icon: 'ev_print',
    of: (s) => (s.def.warts ? 'y' : 'n'),
    say: { y: 'THE PRINT OFF THE GLASS IS PITTED',
           n: 'THE PRINT OFF THE GLASS IS SMOOTH' } },
];

function SKIN_WORD(letter) {
  return ({
    F: 'FELT GREEN', f: 'FELT GREEN', e: 'DARK GREEN', E: 'DARK GREEN',
    B: 'BRASS', b: 'BRASS', u: 'MUD BROWN', U: 'MUD BROWN',
    N: 'SICK MINT', n: 'SICK MINT', P: 'ROSE', p: 'ROSE',
    V: 'BRUISE PURPLE', v: 'BRUISE PURPLE', X: 'BRUISE PURPLE',
    O: 'RUST ORANGE', o: 'RUST ORANGE', w: 'BONE PALE', q: 'BONE PALE',
    s: 'GUNMETAL', S: 'GUNMETAL', t: 'GUNMETAL', T: 'GUNMETAL',
    L: 'ICE BLUE', l: 'ICE BLUE', M: 'SILVER', m: 'SILVER',
  })[letter] || 'HARD TO SAY';
}

/* ============================================================
   THE CASE
   ============================================================ */

const CASE = {

  /* how many looks a run gets before it has bought anything */
  BASE_LOOKS: 2,

  /* Build the board for whoever is sitting down next. The real mark is
     already rolled by the engine — the decoys are built to look like him
     from across a dark room, so the clues have to do the work. */
  build() {
    const rng = G.rng, opp = G.duel.opp;
    const real = { name: opp.name, def: opp.def, traits: (opp.traits || []).slice(), real: true };

    /* A boss is not a mystery. You have had his poster on the wall since
       the night they did it — there is nothing to work out, only a door. */
    if (opp.boss) {
      G.case = {
        suspects: [real], clues: [], looks: 0, known: true,
        accused: 0, right: true, done: true, realIdx: 0,
      };
      G.caseBonus = false;
      return G.case;
    }

    const suspects = [real];
    const usedNames = { [opp.name]: 1 };
    for (let i = 0; i < 2; i++) {
      let s = null;
      for (let tries = 0; tries < 24 && !s; tries++) {
        const traits = E.rollTraits();
        const def = E.traitsToDef(E.mookDef(rng() < 0.5 ? 'mook' : 'capo'), traits);
        /* a decoy that answers every question the same way is not a decoy */
        const same = CLUE_TESTS.every(t => t.of({ def }) === t.of(real));
        if (same) continue;
        const pool = (rng() < 0.5 ? MOOK_NAMES : CAPO_NAMES).filter(n => !usedNames[n]);
        const name = pool.length ? U.pick(rng, pool) : 'JOHN DOE ' + i;
        usedNames[name] = 1;
        s = { name, def, traits, real: false };
      }
      if (s) suspects.push(s);
    }
    U.shuffle(rng, suspects);

    /* Only tests the real frog passes, and only ones that actually cut the
       field — a clue every suspect satisfies is a wasted card. */
    const clues = [];
    CLUE_TESTS.forEach(t => {
      const mine = t.of(real);
      const keeps = suspects.map(s => t.of(s) === mine);
      const cut = keeps.filter(k => !k).length;
      if (!cut) return;
      const text = t.text ? t.text(mine) : (t.say && t.say[mine]);
      if (!text) return;
      clues.push({ id: t.id, icon: t.icon, text, keeps, cut, seen: false });
    });
    /* the sharpest first, then the rest, so an early look is worth taking */
    clues.sort((a, b) => b.cut - a.cut || (rng() < 0.5 ? -1 : 1));
    const deck = clues.slice(0, 5);
    U.shuffle(rng, deck);

    G.case = {
      suspects, clues: deck,
      looks: CASE.looksFor(),
      accused: -1, right: null, done: false,
      realIdx: suspects.findIndex(s => s.real),
    };
    /* a man inside has already turned one over for you */
    let free = 0;
    TOOL_IDS.forEach(id => { if (G.tools && G.tools[id]) free += TOOLS[id].free || 0; });
    for (let i = 0; i < free && i < deck.length; i++) deck[i].seen = true;
    return G.case;
  },

  /* your looks: the base, plus whatever the case room has bought */
  looksFor() {
    let n = CASE.BASE_LOOKS;
    TOOL_IDS.forEach(id => { if (G.tools && G.tools[id]) n += TOOLS[id].looks || 0; });
    return n;
  },

  /* which suspects the clues you HAVE TURNED OVER still allow */
  standing() {
    const c = G.case;
    return c.suspects.map((s, i) => c.clues.every(cl => !cl.seen || cl.keeps[i]));
  },

  /* the case room: tools are bought once and kept for the run */
  canBuy(id) {
    const t = TOOLS[id];
    return !!t && !(G.tools && G.tools[id]) && G.chips >= t.cost;
  },

  buy(id) {
    if (!CASE.canBuy(id)) return false;
    const t = TOOLS[id];
    G.chips -= t.cost;
    G.tools[id] = true;
    /* a tool bought at this board works at this board */
    if (G.case && !G.case.done) {
      G.case.looks += t.looks || 0;
      for (let i = 0; i < (t.free || 0); i++) {
        const cl = G.case.clues.find(c => !c.seen);
        if (cl) cl.seen = true;
      }
    }
    return true;
  },

  flip(i) {
    const c = G.case;
    if (!c || c.done) return false;
    const cl = c.clues[i];
    if (!cl || cl.seen) return false;
    if (c.looks <= 0) return false;
    cl.seen = true;
    c.looks--;
    return true;
  },

  /* Name him. Right, and he walks over here without his hand near his
     coat. Wrong, and the whole room now knows what you are. */
  accuse(i) {
    const c = G.case;
    if (!c || c.done || i < 0 || i >= c.suspects.length) return null;
    c.accused = i;
    c.right = !!c.suspects[i].real;
    c.done = true;
    if (c.right) {
      G.caseBonus = true;
      G.run.called++;
      /* the tells you named are tells you have read */
      (c.suspects[i].traits || []).forEach(t => META.learnTrait(t));
    } else {
      G.caseMiss = true;
      G.run.misnamed++;
      G.duel.opp.hp += CASE_TUNING.missHearts;
      G.duel.opp.maxHP += CASE_TUNING.missHearts;
      G.duel.opp.aggro = Math.min(0.9, G.duel.opp.aggro + CASE_TUNING.missAggro);
    }
    return c.right;
  },
};
