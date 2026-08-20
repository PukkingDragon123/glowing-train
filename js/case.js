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

/* ------------------------------------------------------------
   THE SAME FACTS, AS THINGS YOU CAN HOLD.

   The clue lines above were written for a file you read at a bar:
   somebody remembers a hat. Clues are dug out of the city now —
   out of a drain, a fire barrel, a pawnbroker's case — so they
   have to read like an object in an evidence bag instead of like
   hearsay. Same tests, same logic, different voice.
   ------------------------------------------------------------ */

const FOUND_TEXT = {
  hat: {
    tophat:  'A TALL SILK HAT, KICKED UNDER A BENCH',
    fedora:  'A FEDORA WITH A SWEAT LINE IN THE BAND',
    bowler:  'A ROUND HAT, TRODDEN FLAT',
    flatcap: 'A FLAT CAP, WRUNG OUT AND STILL WET',
    bare:    'NO HATBAND MARK ON HIM ANYWHERE',
  },
  build: {
    fat: 'A COAT LET OUT TWICE AT THE SEAMS',
    thin: 'A COAT TAKEN IN AT THE SEAMS',
  },
  goldtooth: {
    y: 'A GOLD TOOTH CAP, SPAT OUT AND KEPT',
    n: 'A DENTAL CARD WITH NO GOLD ON IT',
  },
  cigar: {
    y: 'CIGAR ASH, STILL SOFT',
    n: 'NOT ONE BURN AND NOT ONE MATCH',
  },
  rings: {
    y: 'A RING SCRATCH DRAGGED ACROSS BRASS',
    n: 'NO RING MARKS ON ANY OF IT',
  },
  glasses: {
    y: 'ONE CRACKED LENS, GROUND THICK',
    n: 'A READING CARD HE PASSED CLEAN',
  },
  scar: {
    y: 'A BLOODY DRESSING IN THE BIN',
    n: 'A PHOTOGRAPH OF AN UNMARKED FACE',
  },
  patch: {
    y: 'AN EYE PATCH WITH THE STRAP SNAPPED',
    n: 'TWO GOOD EYES IN THE PHOTOGRAPH',
  },
  chain: {
    y: 'A LINK OF HEAVY GOLD CHAIN',
    n: 'NOTHING GOLD IN ANY OF IT',
  },
  warts: {
    y: 'A PRINT OFF THE GLASS, PITTED ALL OVER',
    n: 'A PRINT OFF THE GLASS, SMOOTH AS A BOTTLE',
  },
};

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

/* how the room answers a question about the frog you are hunting */
const ASK_REPLY = {
  hat:       (v) => (v === 'bare' ? 'NO HAT. BARE HEAD ALL NIGHT.'
    : v === 'tophat' ? 'A TALL ONE. YOU COULD NOT MISS IT.'
      : v === 'bowler' ? 'A ROUND ONE. BOWLER.' : 'A FLAT CAP.'),
  build:     (v) => (v === 'fat' ? 'BIG FROG. TOOK TWO CHAIRS.' : 'THIN. ALL ELBOWS.'),
  skin:      (v) => 'HE WAS ' + SKIN_WORD(v) + '.',
  goldtooth: (v) => (v === 'y' ? 'GOLD. RIGHT AT THE FRONT.' : 'NOTHING IN HIS MOUTH BUT TEETH.'),
  cigar:     (v) => (v === 'y' ? 'SMOKING THE WHOLE TIME.' : 'HE NEVER LIT ANYTHING.'),
  rings:     (v) => (v === 'y' ? 'RINGS. HEAVY ONES.' : 'BARE HANDS.'),
  glasses:   (v) => (v === 'y' ? 'GLASSES, YES.' : 'NO GLASSES.'),
  scar:      (v) => (v === 'y' ? 'HIS FACE WAS OPENED UP ONCE.' : 'CLEAN FACE.'),
  patch:     (v) => (v === 'y' ? 'ONE EYE. PATCH ON THE OTHER.' : 'BOTH EYES, BOTH WORKING.'),
  chain:     (v) => (v === 'y' ? 'A ROPE OF GOLD AT THE THROAT.' : 'NOTHING ROUND HIS NECK.'),
  warts:     (v) => (v === 'y' ? 'ROUGH SKIN. PITTED ALL OVER.' : 'SMOOTH AS A BOTTLE.'),
};

/* ============================================================
   THE CASE
   ============================================================ */

const CASE = {

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
        suspects: [real], clues: [], looks: 0, known: true, grease: 0,
        accused: 0, right: true, done: true, realIdx: 0,
      };
      G.caseBonus = false;
      return G.case;
    }

    /* more faces on the wall as you climb, and fewer looks to sort them */
    const want = CASE_TUNING.suspects(G.ante);
    const suspects = [real];
    const usedNames = { [opp.name]: 1 };
    for (let i = 0; i < want - 1; i++) {
      let s = null;
      for (let tries = 0; tries < 30 && !s; tries++) {
        const traits = E.rollTraits();
        const def = E.traitsToDef(E.mookDef(rng() < 0.5 ? 'mook' : 'capo'), traits);
        /* A decoy has to LOOK like him or it is not a decoy: it must answer
           at least half the questions the same way, and differ on at least
           one — otherwise the board is either trivial or unsolvable. */
        let same = 0;
        CLUE_TESTS.forEach(t => { if (t.of({ def }) === t.of(real)) same++; });
        if (same === CLUE_TESTS.length) continue;
        if (same < CLUE_TESTS.length * 0.55) continue;
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
      const text = (FOUND_TEXT[t.id] && FOUND_TEXT[t.id][mine]) ||
        (t.text ? t.text(mine) : (t.say && t.say[mine]));
      if (!text) return;
      clues.push({ id: t.id, icon: t.icon, text, keeps, cut, seen: false });
    });

    /* THE FILE IS NOT A SOLUTION. Keep the blunt clues — the ones that only
       cross off one face — and no more than one clue that cuts the board in
       half, so it always takes several looks and sometimes takes a guess. */
    U.shuffle(rng, clues);
    const wide = clues.filter(c => c.cut >= suspects.length - 1);
    const rest = clues.filter(c => c.cut < suspects.length - 1);
    const deck = rest.concat(wide.slice(0, 1));
    U.shuffle(rng, deck);

    /* THE QUESTIONS. Every one is a feature of the frog you are hunting,
       and asking it crosses off everybody who does not match. They are
       what makes a nine-face wall solvable at all — but you only get a
       couple of them, so which one you ask is the whole game. */
    const asks = CASE_ASKS.map(a => {
      const test = CLUE_TESTS.find(t => t.id === a.id);
      if (!test) return null;
      const mine = test.of(real);
      const keeps = suspects.map(s2 => test.of(s2) === mine);
      const cut = keeps.filter(k => !k).length;
      if (!cut) return null;                 // a question nobody fails is a wasted breath
      /* AND NO SINGLE QUESTION WINS THE BOARD. On a big wall a four-way
         answer like the hat could leave exactly one face standing, which
         turns the whole thing into one click. Anything that decisive is
         left out of the rack, so it always takes two. */
      if (suspects.length >= 5 && keeps.filter(k => k).length < 2) return null;
      const reply = ASK_REPLY[a.id] ? ASK_REPLY[a.id](mine) : null;
      if (!reply) return null;
      return { id: a.id, ask: a.ask, reply, keeps, cut, asked: false };
    }).filter(Boolean);
    /* the sharpest ones last, so the rack is not sorted by how good it is */
    U.shuffle(rng, asks);

    G.case = {
      suspects, clues: deck.slice(0, Math.max(3, Math.ceil(suspects.length / 2))),
      asks: asks.slice(0, 6),
      looks: CASE_TUNING.looks(G.ante) + (G.mayLook ? 1 : 0),
      quiz: CASE_TUNING.asks(G.ante),
      grease: 0,
      accused: -1, right: null, done: false,
      realIdx: suspects.findIndex(s => s.real),
    };
    /* the papers you took off the last one: a clue is already turned over */
    const deck2 = G.case.clues;
    while ((G.intel || 0) > 0 && deck2.some(c => !c.seen)) {
      deck2.find(c => !c.seen).seen = true;
      G.intel--;
    }
    CASE.plant();
    return G.case;
  },

  /* ------------------------------------------------------------
     PLANTING.

     A clue is not a card you turn over at a table any more: it is
     a thing in a place. Every unseen clue gets buried in one prop
     in one of the five stops, spread so that no single trip solves
     the case and no stop is a dead end. The order the props come
     back in is seeded, so the same case is the same hunt.
     ------------------------------------------------------------ */
  plant() {
    const c = G.case;
    if (!c || typeof CITY === 'undefined') return;
    const rng = G.rng || Math.random;
    /* every searchable prop in the city, place by place. This comes off
       CITY.PROPS rather than off the rooms: planting a case must not have
       to paint five canvases, and the balance harness has no canvas at all. */
    const slots = CITY.ORDER.map(id => ({
      place: id, props: U.shuffle(rng, CITY.propsAt(id)),
    }));
    /* deal round the city so the clues are never all in one room */
    let ring = 0;
    c.clues.filter(cl => !cl.seen).forEach(cl => {
      for (let tries = 0; tries < slots.length; tries++) {
        const s2 = slots[(ring + tries) % slots.length];
        if (s2.props.length) {
          cl.at = s2.place;
          cl.prop = s2.props.pop();
          ring = (ring + tries + 1) % slots.length;
          return;
        }
      }
    });
    /* one of them is on the record: the captain hands you the first stop */
    const first = c.clues.find(cl => !cl.seen && cl.at);
    G.tips = {};
    if (first) G.tips[first.at] = 'THE CAPTAIN SAYS START HERE';
    return c.clues;
  },

  /* which suspects the clues you HAVE TURNED OVER still allow */
  standing() {
    const c = G.case;
    return c.suspects.map((s, i) =>
      c.clues.every(cl => !cl.seen || cl.keeps[i]) &&
      (c.asks || []).every(a => !a.asked || a.keeps[i]));
  },

  /* how many faces are still in it */
  left() {
    return CASE.standing().filter(Boolean).length;
  },

  /* ---- asking out loud ---- */
  canAsk(i) {
    const c = G.case;
    return !!c && !c.done && !c.known && c.quiz > 0 && c.asks && c.asks[i] && !c.asks[i].asked;
  },
  ask(i) {
    if (!CASE.canAsk(i)) return null;
    const c = G.case;
    c.asks[i].asked = true;
    c.quiz--;
    return c.asks[i];
  },

  /* what one more look off the books costs, and whether you can cover it */
  greaseCost() {
    const c = G.case;
    return CASE_TUNING.greaseBase + CASE_TUNING.greaseStep * ((c && c.grease) || 0);
  },
  canGrease() {
    const c = G.case;
    if (!c || c.done || c.known) return false;
    const wantLook = c.looks <= 0 && c.clues.some(cl => !cl.seen);
    const wantAsk = c.quiz <= 0 && (c.asks || []).some(a => !a.asked);
    return (wantLook || wantAsk) && G.chips >= CASE.greaseCost();
  },
  grease() {
    if (!CASE.canGrease()) return false;
    const c = G.case;
    G.chips -= CASE.greaseCost();
    c.grease++;
    /* it buys back whichever one you ran out of first */
    if (c.looks <= 0 && c.clues.some(cl => !cl.seen)) c.looks++;
    else c.quiz++;
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
      (c.suspects[i].traits || []).forEach(t => META.learnTrait(t));
    } else {
      /* THE PUNISHMENT. You said a name and it was the wrong one: the frog
         you actually came for heard it, the room charged you for the show,
         and he is the one holding the iron first. */
      G.caseMiss = true;
      G.run.misnamed++;
      G.chips = Math.max(0, G.chips - CASE_TUNING.missChips);
      G.duel.opp.hp += CASE_TUNING.missHearts;
      G.duel.opp.maxHP += CASE_TUNING.missHearts;
      G.duel.opp.aggro = Math.min(0.92, G.duel.opp.aggro + CASE_TUNING.missAggro);
      G.duel.turn = 'opp';
    }
    return c.right;
  },
};
