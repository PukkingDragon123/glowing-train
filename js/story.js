'use strict';
/* ============================================================
   SHELL & DEBT — story.js
   THE CASE.

   There are no rounds and no antes. There is a case file with
   the Bullfrog's name on it, a board with five holes in it, and
   however many nights it takes you to fill them.

   Every lead you work puts one more piece on that board. Fill
   it and you can prove where he sleeps — walk in with the file
   and he goes down in a courtroom. Walk in without it and the
   only thing you can do to him is the thing he did to you.

   That is the whole game, and it is the two endings.
   ============================================================ */

/* ------------------------------------------------------------
   THE FIVE PIECES. Each one is a thing you physically take off
   somebody's body and pin to the cork.
   ------------------------------------------------------------ */
const INTEL_CARDS = [
  { id: 'face',   art: 'face', name: 'A PHOTOGRAPH',
    line: 'HIM, OUTSIDE A CLUB HE DOES NOT OWN ON PAPER.' },
  { id: 'ledger', art: 'doc',  name: 'THE VIG LEDGER',
    line: 'WHO PAYS HIM, WHEN, AND WHAT IN.' },
  { id: 'route',  art: 'map',  name: 'THE ROUTE',
    line: 'THE SAME FOUR STREETS, EVERY THURSDAY, ARMOURED.' },
  { id: 'name',   art: 'doc',  name: 'THE NAME ON THE DEED',
    line: 'A DEAD AUNT OWNS THE BUILDING HE LIVES IN.' },
  { id: 'addr',   art: 'map',  name: 'THE ADDRESS',
    line: 'FOURTEEN MARSH ROW. THE TOP TWO FLOORS.' },
];

/* ------------------------------------------------------------
   THE CHAPTERS. Each is one rung of his organisation, and each
   has a brief from the captain and a place to go.
   ------------------------------------------------------------ */
const CHAPTERS = [
  { id: 1, title: 'THE COLLECTOR',
    where: 'A LAUNDRY ON THE CANAL', crew: 'THE COLLECTION CREW',
    brief: ['SOMEBODY IS TAKING ENVELOPES OUT OF THE CANAL LAUNDRY EVERY FRIDAY.',
            'ONE OF THE FROGS DRINKING IN THAT ROOM CARRIES THE ROUTE. FIND OUT WHICH.'],
    obj: 'IDENTIFY THE COLLECTOR AND TAKE WHAT HE CARRIES' },
  { id: 2, title: 'THE BOOKKEEPER',
    where: 'A BACK OFFICE ON EEL STREET', crew: 'THE COUNTING HOUSE',
    brief: ['THE MONEY GOES SOMEWHERE AND SOMEBODY WRITES IT DOWN.',
            'FIND THE ONE WITH INK ON HIS FINGERS.'],
    obj: 'FIND THE LEDGER' },
  { id: 3, title: 'THE DRIVER',
    where: 'A GARAGE UNDER THE VIADUCT', crew: 'THE WHEELMEN',
    brief: ['HE MOVES THE BULLFROG FOUR STREETS EVERY THURSDAY AND NEVER THE SAME WAY TWICE.',
            'EXCEPT HE DOES. THEY ALWAYS DO.'],
    obj: 'GET THE ROUTE OFF THE WHEELMAN' },
  { id: 4, title: 'THE LAWYER',
    where: 'A CLUB THAT CLOSES AT FOUR', crew: 'THE PAPER MEN',
    brief: ['THE ONE WHO GOT HIM OUT BY NOON. YOU HAVE WAITED SIX YEARS FOR THIS ONE.',
            'HE DOES NOT CARRY A GUN. HE CARRIES SOMETHING WORSE.'],
    obj: 'TAKE THE DEED OFF THE LAWYER' },
  { id: 5, title: 'THE COUSIN',
    where: 'A TENEMENT ON MARSH ROW', crew: 'FAMILY',
    brief: ['THE DEED SAYS A DEAD AUNT OWNS IT. THE DEAD AUNT HAS A LIVING SON.',
            'HE WILL KNOW WHICH FLOOR.'],
    obj: 'GET THE ADDRESS' },
  { id: 6, title: 'THE ENFORCER',
    where: 'THE STAIRWELL AT FOURTEEN MARSH ROW', crew: 'THE DOOR',
    brief: ['HE IS THE REASON NOBODY GETS UPSTAIRS. HE WAS AT YOUR DOOR THAT NIGHT.',
            'WHATEVER YOU DO IN THERE, THE FILE STAYS CLEAN OR IT IS WORTH NOTHING.'],
    obj: 'GET PAST THE DOOR' },
  { id: 7, title: 'THE ROOM BELOW',
    where: 'THE FLOOR UNDER HIS', crew: 'THE LAST OF THEM',
    brief: ['EVERYBODY HE STILL TRUSTS IS IN ONE ROOM AND THEY KNOW YOU ARE COMING.',
            'AFTER THIS THERE IS ONLY HIM.'],
    obj: 'CLEAR THE FLOOR' },
  { id: 8, title: 'THE BULLFROG',
    where: 'THE TOP TWO FLOORS', crew: 'HIM',
    brief: ['THIS IS THE ONE. TAKE THE FILE UP THOSE STAIRS AND HE DIES IN A COURTROOM.',
            'GO UP WITHOUT IT AND YOU ARE JUST ANOTHER FROG WITH A GUN.'],
    obj: 'END IT' },
];

const STORY = {

  /* ================= state ================= */

  reset() {
    G.chapter = 1;
    G.intelCards = [];          // ids from INTEL_CARDS, in the order taken
    G.log = [];                 // the case log, newest last
    G.wardTrips = 0;
    G.badgePulled = false;
    G.hadCoffee = false;
    G.briefed = 0;              // which chapter's brief you have heard
    G.ending = null;
    STORY.note('THE CASE IS OPEN AGAIN. NOBODY SIGNED OFF ON THAT.');
  },

  chapter() { return CHAPTERS[Math.min(CHAPTERS.length, Math.max(1, G.chapter || 1)) - 1]; },
  note(line) { (G.log = G.log || []).push(line); },

  /* ---- intel ---- */
  hasCard(id) { return (G.intelCards || []).indexOf(id) >= 0; },
  intelPct() { return Math.round(((G.intelCards || []).length / INTEL_CARDS.length) * 100); },
  knownIntel() {
    const cards = INTEL_CARDS.map(c => ({ art: c.art, got: STORY.hasCard(c.id) }));
    const got = (G.intelCards || []).length;
    const ready = got >= INTEL_CARDS.length;
    const line = ready ? 'FOURTEEN MARSH ROW - THE TOP TWO FLOORS'
      : got === 0 ? 'NOTHING ON HIM THAT WOULD HOLD IN A ROOM'
      : INTEL_CARDS.filter(c => STORY.hasCard(c.id)).slice(-1)[0].line;
    return { cards, ready, line };
  },
  /* the next piece the case wants */
  nextCard() { return INTEL_CARDS.find(c => !STORY.hasCard(c.id)); },
  /* a body gave up its papers */
  takeCard() {
    const c = STORY.nextCard();
    if (!c) return null;
    G.intelCards.push(c.id);
    STORY.note('PINNED: ' + c.name + ' - ' + c.line);
    return c;
  },
  canFinish() { return (G.intelCards || []).length >= INTEL_CARDS.length; },

  /* ================= movement between rooms ================= */

  /* WALKING INTO A PLACE IS A SHOT. Every arrival gets bars, a camera
     move across the room and the name of the place typed over it. */
  ARRIVALS: {
    precinct: { name: 'THE PRECINCT', sub: 'HOMICIDE DIVISION - AFTER HOURS', from: 560, to: 60 },
    board:    { name: 'THE BOARD ROOM', sub: 'NOBODY SIGNED OFF ON THIS CASE', from: 220, to: 40 },
    ward:     { name: 'THE CITY INFIRMARY', sub: 'AGAINST MEDICAL ADVICE', from: 280, to: 70 },
    lead:     { name: null, sub: 'THE CREW DRINKS HERE', from: 0, to: 0 },
  },

  async arrive(kind, nameOverride) {
    const a = STORY.ARRIVALS[kind];
    if (!a || !SCENE.def) return;
    const to = SCENE.me.x;
    await CINE.establish({
      name: nameOverride || a.name || '',
      sub: a.sub,
      from: Math.min(a.from, SCENE.def.w - 10),
      to, ms: 1700,
    });
  },

  async toPrecinct() {
    await UI.goto(() => { G.phase = 'precinct'; });
    return STORY.arrive('precinct');
  },
  async openBoard() {
    await UI.goto(() => { G.phase = 'board'; });
    return STORY.arrive('board');
  },
  toWard() { return UI.goto(() => { G.phase = 'ward'; }); },

  /* the assignment you have in hand, if any */
  lead() { return G.briefed >= (G.chapter || 1) ? STORY.chapter() : null; },
  capHasBrief() { return G.briefed < (G.chapter || 1); },

  /* ================= the people ================= */

  /* A CONVERSATION IS A SCENE. Bars close, the camera holds on whoever is
     talking, nobody walks anywhere, and it all opens back up afterwards. */
  async converse(who, fn) {
    if (STORY._talking) return;
    STORY._talking = true;
    const inRoom = !!(typeof SCENE !== 'undefined' && SCENE.def);
    let mark = null;
    if (inRoom) {
      mark = (SCENE.def.actors || []).find(a => a.id === who);
      CINE.letterbox(true);
      if (mark) SCENE.focus((mark.x + SCENE.me.x) / 2);
      else SCENE.focus(SCENE.me.x);
      await U.sleep(220);
    }
    try {
      await fn();
    } finally {
      if (inRoom) { CINE.letterbox(false); SCENE.unfocus(); }
      STORY._talking = false;
    }
  },

  talkCaptain() {
    return STORY.converse('cap', async () => {
      const cap = { art: SPR.frogCustom('handler', HANDLER_DEF), name: 'CAPTAIN ROOK', nameCol: PIX.PAL.L, rim: PIX.PAL.t };
      const ch = STORY.chapter();
      if (STORY.capHasBrief()) {
        await TUTOR.say('CHAPTER ' + ch.id + '. ' + ch.title + '.', cap);
        for (const l of ch.brief) await TUTOR.say(l, cap);
        await TUTOR.say('IT IS ON YOUR DESK. ' + ch.where + '.', Object.assign({ last: true }, cap));
        G.briefed = ch.id;
        STORY.note('BRIEFED: ' + ch.title + ' - ' + ch.obj);
        UI.stampSmall('NEW LEAD: ' + ch.where);
        if (G.phase === 'precinct') SCENE.open(ROOMS.precinct());   // relabel the room
      } else if (STORY.canFinish()) {
        await TUTOR.say('THE BOARD IS FULL, DETECTIVE. THAT IS A CASE.', cap);
        await TUTOR.say('TAKE IT UP THOSE STAIRS AND DO NOT GIVE HIM A REASON TO WALK.', Object.assign({ last: true }, cap));
      } else {
        await TUTOR.say(U.pick(Math.random, [
          'THE FILE IS THIN AND THE CITY IS NOT PATIENT. GO.',
          'I SIGNED NOTHING TONIGHT. REMEMBER THAT IF IT GOES WRONG.',
          'SIX YEARS. I KNOW. GO AND GET THE NEXT PIECE.',
        ]), cap);
      }
    });
  },

  talkMaybelle() {
    return STORY.converse('may', async () => {
      const may = { art: SPR.frogCustom('maybelle', MAYBELLE_DEF), name: 'OFFICER MAYBELLE', nameCol: PIX.PAL.P, rim: PIX.PAL.p };
      const d = META.load();
      if (G.mayTalked) {
        await TUTOR.say(U.pick(Math.random, ['GO ON. AND COME BACK.', 'I WILL KEEP THE COFFEE WARM.', 'YOU KNOW WHERE I AM.']), may);
        return;
      }
      G.mayTalked = true;
      d.trust = (d.trust || 0) + 1; META.save();
      const t = d.trust;
      if (t < 3) {
        await TUTOR.say(U.pick(Math.random, [
          'LATE ONE AGAIN? I SIGNED YOU IN AT EIGHT. YOU OWE ME NOTHING.',
          'THE DESK SERGEANT ASKED WHO STILL BRINGS YOU CASES. I SAID NOBODY ASKS THAT.',
          'YOU LOOK TIRED. THAT IS NOT A CRITICISM. IT IS A WORRY.',
        ]), may);
      } else if (t < 6) {
        G.chips += 4; UI.syncChips && UI.syncChips(); UI.chipTick && UI.chipTick(4);
        await TUTOR.say('I PUT COFFEE MONEY IN YOUR COAT. DO NOT ARGUE WITH ME ABOUT IT.', may);
        UI.stampSmall('+4 FROM MAYBELLE');
      } else if (t < 9) {
        G.mayLook = true;
        if (G.case && !G.case.done && !G.case.known) G.case.looks++;
        await TUTOR.say('I PULLED THE FILE BEFORE THE SHIFT CHANGE. ONE MORE LOOK IS IN THERE.', may);
        UI.stampSmall('MAYBELLE: +1 LOOK, ALL NIGHT');
      } else {
        G.mayHeart = true; G.hearts = E.maxHP();
        await TUTOR.say('WHATEVER HAPPENS UP THERE... COME HOME AFTER. YOU HEAR ME?', may);
        await TUTOR.say('...I MEAN IT.', may);
        UI.stampSmall('MAYBELLE: +1 HEART, ALL NIGHT');
        SFX.bank();
      }
    });
  },

  wardTalk() {
    return STORY.converse('may', async () => {
      const may = { art: SPR.frogCustom('maybelle', MAYBELLE_DEF), name: 'OFFICER MAYBELLE', nameCol: PIX.PAL.P, rim: PIX.PAL.p };
      const lines = [
        ['THEY BROUGHT YOU IN AT THREE. I WAS OFF AT ELEVEN.', 'I STAYED.'],
        ['YOU SAID A NAME WHILE YOU WERE UNDER. IT WAS NOT HIS.', 'IT WAS NOT MINE EITHER.'],
        ['THE DOCTOR ASKED IF YOU HAD FAMILY. I SAID YES.', 'DO NOT MAKE A LIAR OF ME.'],
      ][Math.min(2, (G.wardTrips || 1) - 1)];
      for (const l of lines) await TUTOR.say(l, may);
      const d = META.load(); d.trust = (d.trust || 0) + 1; META.save();
    });
  },

  smallTalk(who) {
    return STORY.converse(who === 'dill' ? 'uni' : who, async () => {
      const pools = {
        dill: { name: 'PATROLMAN DILL', art: SPR.frogCustom('dill', DILL_DEF), col: PIX.PAL.L, lines: [
          'THREE DRUNKS AND A BITE. SLOW NIGHT.',
          'THEY SAY YOU WORK A CASE NOBODY SIGNED. I DID NOT HEAR THAT FROM ME.',
          'IF YOU NEED A CAR AT FOUR IN THE MORNING, I AM ON UNTIL SIX.',
        ] },
        drunk: { name: 'THE DRUNK TANK', art: SPR.frogCustom('drunk', DRUNK_DEF), col: PIX.PAL.q, lines: [
          'I SEEN HIM. BIG FROG. GOLD IN HIS MOUTH. HE DO NOT WALK, HE GET WALKED.',
          'MARSH ROW. THAT IS ALL I SAY. MARSH ROW AND A GREEN DOOR.',
          'YOU GOT A CIGARETTE? NO? THEN I NEVER SAID NOTHING.',
        ] },
        nurse: { name: 'THE NURSE', art: SPR.frogCustom('nurse', NURSE_DEF), col: PIX.PAL.W, lines: [
          'FOUR HOLES IN SIX YEARS. WE HAVE A FILE ON YOU THICKER THAN THE HOSPITAL.',
          'YOU CAN GO WHEN YOU CAN STAND. THAT IS THE WHOLE TEST.',
          'THE ONE IN THE NEXT BED CAME IN AFTER YOU. HE IS NOT GOING HOME.',
        ] },
      };
      const p = pools[who] || pools.dill;
      await TUTOR.say(U.pick(Math.random, p.lines), {
        art: p.art, name: p.name, nameCol: p.col, rim: PIX.PAL.t,
      });
    });
  },

  /* ================= things in the rooms ================= */

  async openDesk() {
    const ch = STORY.lead();
    if (!ch) {
      await TUTOR.say('NOTHING ON IT BUT SOMEBODY ELSE\'S OVERTIME. GO AND SEE THE CAPTAIN.',
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
      return;
    }
    await TUTOR.say(ch.obj + '.', { name: 'THE FILE', nameCol: PIX.PAL.G, rim: PIX.PAL.h });
    await TUTOR.say(ch.where + '. ' + ch.crew + ' DRINK THERE.',
      { name: 'THE FILE', nameCol: PIX.PAL.G, rim: PIX.PAL.h, last: true });
  },

  async drink() {
    if (G.hadCoffee) {
      await TUTOR.say('DRY SINCE TUESDAY.', { name: 'THE COOLER', nameCol: PIX.PAL.q, rim: PIX.PAL.t });
      return;
    }
    G.hadCoffee = true;
    const before = G.hearts;
    G.hearts = Math.min(E.maxHP(), G.hearts + 1);
    SFX.bank();
    UI.stampSmall(G.hearts > before ? 'THAT IS ONE HEART BACK' : 'NOTHING LEFT TO MEND');
  },

  async openLocker() {
    const g = E.gun();
    const items = (G.items || []).map(i => ITEMS[i].name).join(' - ') || 'NOTHING BUT LINT';
    await TUTOR.say(g.name + ' - ' + g.desc, { name: 'YOUR IRON', nameCol: PIX.PAL.S, rim: PIX.PAL.t });
    await TUTOR.say(items, { name: 'YOUR BELT', nameCol: PIX.PAL.S, rim: PIX.PAL.t, last: true });
  },

  async readLog() {
    const lines = (G.log || []).slice(-6);
    if (!lines.length) { await TUTOR.say('EMPTY. START WORKING.', { name: 'THE CASE LOG', rim: PIX.PAL.t }); return; }
    for (const l of lines) await TUTOR.say(l, { name: 'THE CASE LOG', nameCol: PIX.PAL.G, rim: PIX.PAL.h });
  },

  async readChart() {
    await TUTOR.say('ADMITTED ' + (G.wardTrips || 1) + ' TIME' + ((G.wardTrips || 1) > 1 ? 'S' : '') +
      ' THIS CASE. GUNSHOT. DISCHARGED AGAINST ADVICE.',
      { name: 'YOUR CHART', nameCol: PIX.PAL.W, rim: PIX.PAL.t });
    if ((G.wardTrips || 0) >= 2) {
      await TUTOR.say('A NOTE FROM THE DEPARTMENT SURGEON: NOT FIT FOR DUTY. SOMEBODY CROSSED IT OUT.',
        { name: 'YOUR CHART', nameCol: PIX.PAL.R, rim: PIX.PAL.d, last: true });
    }
  },


  /* ================= working the room ================= */

  /* Walk up to a frog and actually look at him: the close view, every
     tell he carries, and the one thing you can do about it. */
  async lookAt(i) {
    const c = G.case;
    if (!c || c.done) return;
    const sus = c.suspects[i];
    const stand = c.known ? [true] : CASE.standing();
    if (!stand[i]) {
      await TUTOR.say('HE IS RULED OUT. THE FILE SAYS SO.',
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
      return;
    }
    /* what you can see on him from a yard away */
    const tells = (sus.def.hat ? ['A HAT'] : sus.def.flatcap ? ['A FLAT CAP'] : ['NO HAT'])
      .concat(sus.def.fat ? ['HEAVY'] : ['LEAN'])
      .concat(sus.def.warts ? ['ROUGH SKIN'] : [])
      .concat(sus.def.glasses ? ['GLASSES'] : [])
      .concat(sus.def.scar ? ['A MARKED FACE'] : [])
      .concat(sus.def.goldtooth ? ['GOLD IN HIS MOUTH'] : [])
      .concat(sus.def.cigar ? ['SMOKING'] : [])
      .concat(sus.def.rings ? ['RINGS'] : []);
    const shot = SPR.mugshot('look:' + sus.name, sus.def, 2);
    const idx = await CINE.pick({
      head: sus.name,
      sub: tells.join('  -  '),
      items: [
        { label: 'THAT IS HIM', sub: 'NAME HIM', art: shot },
        { label: 'NOT YET', sub: 'KEEP LOOKING' },
      ],
    });
    if (idx !== 0) return;
    SFX.chak();
    const right = CASE.accuse(i);
    STORY.note((right ? 'NAMED HIM RIGHT: ' : 'NAMED THE WRONG FROG: ') + sus.name + '.');
    UI.render();
    await U.sleep(260);
    await TUTOR.say(right ? 'THAT IS HIM. HE COMES QUIETLY.' : 'WRONG FROG. THE WHOLE ROOM HEARD YOU.',
      { name: right ? 'YOU' : 'THE ROOM', nameCol: right ? PIX.PAL.G : PIX.PAL.R,
        rim: right ? PIX.PAL.h : PIX.PAL.d, last: true });
  },

  /* the barman answers one question, honestly, and the room thins out */
  async askRoom() {
    const c = G.case;
    if (!c || c.done) return;
    const live = (c.asks || []).map((a, i) => ({ a, i })).filter(o => CASE.canAsk(o.i));
    if (!c.quiz || !live.length) {
      await TUTOR.say('I HAVE TOLD YOU WHAT I SAW. DRINK OR GO.',
        { name: 'THE BARMAN', nameCol: PIX.PAL.w, rim: PIX.PAL.t });
      return;
    }
    if (!live.length) {
      await TUTOR.say('NOTHING LEFT WORTH ASKING.', { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
      return;
    }
    const idx = await CINE.pick({
      head: 'ASK THE BARMAN',
      sub: c.quiz + ' QUESTION' + (c.quiz === 1 ? '' : 'S') + ' LEFT  -  ' + CASE.standing().filter(Boolean).length + ' STILL IN IT',
      items: live.map(o => ({ label: o.a.ask })),
    });
    if (idx < 0) return;
    const ev = CASE.ask(live[idx].i);
    if (!ev) { SFX.dud(); return; }
    SFX.chak();
    UI.render();
    await U.sleep(220);
    await TUTOR.say(ev.reply || 'I DO NOT REMEMBER.',
      { name: 'THE BARMAN', nameCol: PIX.PAL.w, rim: PIX.PAL.t, last: true });
  },

  /* the file on the bar: turn a piece of evidence over */
  async readEvidence() {
    const c = G.case;
    if (!c || c.done) return;
    const unseen = (c.clues || []).map((cl, i) => ({ cl, i })).filter(o => !o.cl.seen);
    if (!c.looks || !unseen.length) {
      /* nothing free left — somebody will always turn one for money */
      const cost = CASE.greaseCost();
      if (CASE.canGrease()) {
        const yes = await CINE.pick({
          head: 'THE FILE IS SPENT',
          sub: 'A CLERK DOWNTOWN WILL PULL ONE MORE FOR ' + cost + ' CHIPS',
          items: [{ label: 'PAY HIM', sub: cost + ' CHIPS' }, { label: 'LEAVE IT' }],
        });
        if (yes === 0 && CASE.grease()) { SFX.coin(); UI.render(); }
        return;
      }
      await TUTOR.say('EVERY PAGE IN IT IS TURNED.', { name: 'THE FILE', nameCol: PIX.PAL.G, rim: PIX.PAL.h });
      return;
    }
    const idx = await CINE.pick({
      head: 'THE CASE FILE',
      sub: c.looks + ' LOOK' + (c.looks === 1 ? '' : 'S') + ' LEFT',
      items: unseen.map(o => ({ label: 'AN UNREAD PAGE', art: PIX.make(o.cl.icon, 3) })),
    });
    if (idx < 0) return;
    if (CASE.flip(unseen[idx].i)) {
      SFX.deal();
      const cl = c.clues[unseen[idx].i];
      UI.render();
      await U.sleep(200);
      await TUTOR.say(cl.text, { name: 'THE FILE', nameCol: PIX.PAL.G, rim: PIX.PAL.h, last: true });
    }
  },

  async juke() {
    SFX.spin();
    await TUTOR.say(U.pick(Math.random, [
      'SOMETHING SLOW COMES ON. NOBODY IN HERE IS DANCING.',
      'THE RECORD SKIPS ON THE SAME WORD, TWICE.',
      'A TRUMPET, A ROOM FULL OF FROGS WHO WISH YOU WOULD LEAVE.',
    ]), { name: 'THE JUKEBOX', nameCol: PIX.PAL.P, rim: PIX.PAL.p });
  },

  /* through the back door: the table, the drum, the two of you */
  async sitDown() {
    const c = G.case;
    if (c && !c.done && !c.known) {
      const go = await CINE.pick({
        head: 'YOU HAVE NOT NAMED ANYBODY',
        sub: 'GO IN BLIND AND YOU TAKE WHOEVER FOLLOWS YOU',
        items: [{ label: 'GO IN ANYWAY' }, { label: 'KEEP WORKING' }],
      });
      if (go !== 0) return;
    }
    SCENE.close();
    E.sitDown();
    G.phase = 'duel';
    UI.render();
  },

  async leaveLead() {
    const go = await CINE.pick({
      head: 'WALK OUT ON THIS ROOM?',
      sub: 'THE LEAD GOES COLD AND THE CAPTAIN HEARS ABOUT IT',
      items: [{ label: 'GO BACK TO THE PRECINCT' }, { label: 'STAY' }],
    });
    if (go !== 0) return;
    STORY.note('WALKED OUT OF ' + STORY.chapter().where + '.');
    SCENE.close();
    await CINE.driveTo('THE PRECINCT');
    G.phase = 'precinct';
    UI.render();
    await STORY.arrive('precinct');
  },

  /* ================= going out to work the lead ================= */

  async goOut() {
    if (!STORY.lead()) {
      await TUTOR.say('YOU HAVE NOWHERE TO BE. SEE THE CAPTAIN FIRST.',
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
      return;
    }
    /* whoever was at the last table is finished with; make sure there is
       somebody at this one */
    if (!G.duel || G.duel.over) { STORY.clearTable(); G.case = null; E.startBlind(); }
    SCENE.close();
    await CINE.driveTo(STORY.chapter().where);
    G.phase = 'blind';
    UI.render();
    await STORY.arrive('lead', STORY.chapter().where);
  },

  /* ================= what a body is worth ================= */

  /* called from the loot when his papers are in your hand */
  onDossier() {
    const c = STORY.takeCard();
    if (c) {
      G.intel = (G.intel || 0) + 1;
      return c;
    }
    return null;
  },

  /* the chapter is done: the mark is cold and looted */
  advance() {
    const ch = STORY.chapter();
    STORY.note('CLOSED: ' + ch.title + '.');
    G.chapter = Math.min(CHAPTERS.length, (G.chapter || 1) + 1);
    G.hadCoffee = false;
    G.mayTalked = false;
  },

  /* ================= the ward, instead of a game over ================= */

  /* THE BILL, AND WHAT ELSE IT COST YOU. Pure bookkeeping, no screen: the
     cinematic and the ward are the caller's business, and the balance
     harness needs to be able to price a bad night without a canvas. */
  wardCost() {
    G.wardTrips = (G.wardTrips || 0) + 1;
    META.bump('deaths');
    const bill = Math.min(G.chips, 12 + G.wardTrips * 6);
    G.chips -= bill;
    let lostName = null;
    if (G.wardTrips >= 2 && (G.intelCards || []).length && Math.random() < 0.5) {
      const lost = G.intelCards.pop();
      lostName = (INTEL_CARDS.find(c => c.id === lost) || {}).name || null;
      STORY.note('LOST IN THE AMBULANCE: ' + lostName);
    }
    if (G.wardTrips >= 3 && !G.badgePulled) {
      G.badgePulled = true;
      STORY.note('THE DEPARTMENT TOOK YOUR BADGE. THE CASE IS YOURS ALONE NOW.');
    }
    STORY.note('WOKE UP IN THE WARD. BILL: ' + bill + ' CHIPS.');
    G.hearts = Math.max(2, Math.round(E.maxHP() / 2));
    G.case = null;
    G.briefed = Math.min(G.briefed, (G.chapter || 1) - 1);   // you have to be re-briefed
    return { bill, lostName };
  },

  /* THE TABLE IS PACKED UP AFTERWARDS, NOT DURING. The death cinematic is
     still looking at the frog who shot you while this runs, so clearing the
     duel out from under it is how you get a black screen and a stack trace. */
  clearTable() {
    G.duel = null;
    G.loot = null;
  },

  async rushToWard() {
    const { bill, lostName } = STORY.wardCost();
    await CINE.ambulance(bill, lostName);
    STORY.clearTable();
    /* somebody else is standing in that room by the time you can walk: the
       lead has to be re-dealt or there is nobody at the next line-up */
    E.startBlind();
    G.phase = 'ward';
    UI.render();
    await STORY.arrive('ward');
  },

  async leaveWard() {
    await TUTOR.say('YOU CAN GO WHEN YOU CAN STAND.', { name: 'THE NURSE', nameCol: PIX.PAL.W, rim: PIX.PAL.t });
    SCENE.close();
    await CINE.driveTo('THE PRECINCT');
    G.phase = 'precinct';
    UI.render();
    await STORY.arrive('precinct');
  },

  /* ================= the end of it ================= */

  async tryFinale() {
    if (!STORY.canFinish()) {
      await TUTOR.say('FIVE PIECES OR IT IS NOT A CASE. YOU HAVE ' + (G.intelCards || []).length + '.',
        { name: 'THE BOARD', nameCol: PIX.PAL.R, rim: PIX.PAL.d });
      return;
    }
    /* the board is full: the finale is the last chapter's room */
    G.chapter = CHAPTERS.length;
    G.briefed = CHAPTERS.length;
    SCENE.close();
    await CINE.driveTo('FOURTEEN MARSH ROW');
    G.phase = 'blind';
    UI.render();
  },

  /* he is down and it is the last chapter: the player picks */
  async endgame() {
    const clean = STORY.canFinish() && !G.badgePulled;
    let idx = -1;
    while (idx < 0) {
      idx = await CINE.pick({
        head: 'HE IS ON THE FLOOR AND STILL BREATHING',
        sub: clean ? 'THE FILE IS IN YOUR COAT AND THE BADGE IS STILL YOURS'
                   : 'NO FILE. NO BADGE. NOBODY WAITING ON PAPERWORK.',
        cancel: false,
        items: [
          { label: 'THE BADGE', sub: clean ? 'CUFF HIM' : 'NOTHING TO CHARGE HIM WITH',
            art: ART.art('badge', 3), dim: !clean },
          { label: 'THE BULLET', sub: 'WHAT HE DID AT YOUR DOOR',
            art: ART.art('gunprop', 3) },
        ],
      });
    }
    if (idx === 0 && clean) {
      G.ending = 'good';
      META.bump('wins');
      STORY.note('ENDING: HE WENT DOWN IN A COURTROOM.');
    } else {
      G.ending = 'bad';
      STORY.note('ENDING: HE WENT DOWN IN THE DARK.');
    }
    META.save();
    G.wonRun = true;
    await CINE.ending(G.ending);
    G.phase = 'ending';
    UI.render();
  },

  atFinale() { return (G.chapter || 1) >= CHAPTERS.length; },
};
