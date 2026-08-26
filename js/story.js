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

/* who answers questions in each place, and what the regulars say */
const PLACE_WITNESS = {
  laundry: typeof LAUNDER_DEF !== 'undefined' ? LAUNDER_DEF : null,
  docks: typeof WATCH_DEF !== 'undefined' ? WATCH_DEF : null,
  pawn: typeof PAWN_DEF !== 'undefined' ? PAWN_DEF : null,
  diner: typeof WAITRESS_DEF !== 'undefined' ? WAITRESS_DEF : null,
  bar: typeof BARMAN_DEF !== 'undefined' ? BARMAN_DEF : null,
};

const PLACE_CHAT = {
  laundry: [
    'THE MACHINES RUN ALL NIGHT. NOBODY HEARS ANYTHING OVER THEM.',
    'THEY TOOK HIM OUT THAT DOOR AT FOUR. NOBODY SIGNED FOR HIM EITHER.',
  ],
  docks: [
    'THE CRANE GOES ON AT MIDNIGHT AND NOBODY ASKS WHO BOOKED IT.',
    'YOU CAN PUT ANYTHING IN THIS WATER. IT ALL COMES BACK AT THE BEND.',
  ],
  pawn: [
    'EVERYTHING IN HERE BELONGED TO SOMEBODY WHO NEEDED IT MORE.',
    'I DO NOT ASK. THAT IS THE WHOLE BUSINESS.',
  ],
  diner: [
    'COFFEE IS FRESH AT TWO AND AT FIVE. IN BETWEEN IT IS A THREAT.',
    'HALF THIS ROOM IS RUNNING FROM THE OTHER HALF.',
  ],
  bar: [
    'HE DRINKS HERE. HE DOES NOT TALK HERE.',
    'PUT SOMETHING ON THE JUKEBOX AND THE ROOM FORGETS YOU.',
  ],
};

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
    /* A PIECE ON THE BOARD OPENS DOORS. Three quarters of the city are
       shut to a foreign policeman until somebody has a reason to take
       him there, and a piece is that reason. */
    if (typeof CITY !== 'undefined' && CITY.openUp) {
      CITY.openUp().forEach(pl => {
        const z = CITY.zoneOf(pl.id);
        STORY.note('OPENED: ' + pl.name + (z ? ' - ' + z.name : ''));
        if (typeof PHONE !== 'undefined' && PHONE.notify) {
          PHONE.notify({
            app: 'map', head: (z ? z.name : pl.name) + ' IS OPEN TO YOU',
            body: pl.blurb || pl.sub, tone: 'good',
          });
        }
      });
    }
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
    lineup:   { name: 'THE LINE-UP ROOM', sub: 'SAY ONE NAME AND MEAN IT', from: 300, to: 60 },
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

  /* ============================================================
     WHAT YOU ARE SUPPOSED TO BE DOING.

     One line, derived from the state rather than stored, so it can
     never go stale: the corner of the screen shows it, the phone
     shows it, and a card announces it when it changes.
     ============================================================ */
  objective() {
    const c = G.case;
    if (G.phase === 'duel') return { line: 'GET THROUGH THE SIT-DOWN', icon: 'ic_badge' };
    if (G.phase === 'loot') return { line: 'TAKE WHAT HE HAS AND MOP THE FLOOR', icon: 'ic_bag' };
    if (G.phase === 'ward') return { line: 'GET BACK ON YOUR FEET AND SIGN OUT', icon: 'ic_drop' };
    if (STORY.canFinish() && !STORY.atFinale()) {
      return { line: 'FOURTEEN MARSH ROW. GO AND FINISH IT.', icon: 'ic_star' };
    }
    if (STORY.capHasBrief()) {
      return { line: "SEE CAPTAIN ROOK FOR TONIGHT'S LEAD", icon: 'ic_badge' };
    }
    if (!c) return { line: 'TAKE THE CAR OUT AND WORK THE LEAD', icon: 'ic_map' };
    if (c.known) return { line: 'NO LINE-UP FOR HIM: GO STRAIGHT THROUGH', icon: 'ic_badge' };
    if (c.done) return { line: 'TAKE HIM INTO THE BACK ROOM', icon: 'ic_badge' };
    const left = CASE.left();
    if (left <= 1) return { line: 'BACK TO THE STATION AND SAY THE NAME', icon: 'ic_star' };
    /* out in the city: point at somewhere with something in it */
    const tip = Object.keys(G.tips || {})[0];
    const buried = CITY.totalLeft();
    if (tip && CITY.leftAt(tip)) {
      return { line: 'SEARCH ' + CITY.PLACES[tip].short + ': SOMETHING IS THERE',
        icon: CITY.PLACES[tip].icon, where: tip };
    }
    /* AN ERRAND THAT IS DONE is a guaranteed piece of evidence sitting in
       somebody's mouth. That outranks turning over another bin. */
    const owed = STORY.questsLive().find(x => x.state === 'ready');
    if (owed) {
      const pl = CITY.PLACES[owed.q.place] || {};
      return { line: 'BACK TO ' + (pl.short || 'HIM') + ': ' + owed.q.who + ' OWES YOU',
        icon: pl.icon || 'ic_star', where: owed.q.place };
    }
    if (buried) {
      return { line: 'FIND EVIDENCE: ' + buried + ' PIECE' + (buried > 1 ? 'S' : '') +
        ' STILL OUT THERE  (' + left + ' FACES FIT)', icon: 'ic_case' };
    }
    return { line: left + ' FACES STILL FIT. ASK SOMEBODY, OR GUESS.', icon: 'ic_case' };
  },

  /* has the objective changed since last time anybody looked */
  objectiveKey() { return STORY.objective().line; },

  /* ============================================================
     AND WHICH THING IN THIS ROOM IT MEANS.

     The objective is a sentence; the marker is a chevron over the
     one thing in the room that sentence is about. Returned as the
     spot or actor itself so the scene can put the mark exactly
     where the thing is, whatever room you happen to be in.
     ============================================================ */
  wantHere(def) {
    if (!def) return null;
    const find = (ids) => {
      for (const id of ids) {
        const a = (def.actors || []).find(x => x.id === id && !x.gone);
        if (a) return a;
        const sp = (def.spots || []).find(x => x.id === id && !x.gone);
        if (sp) return sp;
      }
      return null;
    };

    /* at the station */
    if (def.id === 'precinct') {
      if (STORY.capHasBrief()) return find(['cap']);
      if (STORY.canFinish() && !STORY.atFinale()) return find(['board']);
      const c0 = G.case;
      if (c0 && !c0.done && CASE.left() <= 1) return find(['stairs', 'lineup']);
      return find(['street', 'desk']);
    }

    /* out in the city: an errand that is done outranks anything else */
    const owed = (STORY.questsLive() || []).find(x => x.state === 'ready' && x.q.place === G.place);
    if (owed) return find(['wit']);

    /* the prop the glass says is worth turning over */
    if (G.place && G.looked) {
      const hot = CITY.propsAt(G.place).find(pr =>
        G.looked[G.place + ':' + pr] === 1 && !CITY.searched(G.place, pr));
      if (hot) { const sp = find([hot]); if (sp) return sp; }
    }
    /* otherwise the first thing here nobody has been through */
    const open = CITY.unsearchedAt(G.place || '');
    for (const pr of open) { const sp = find([pr]); if (sp) return sp; }
    /* nothing left down here: point at the stairs, or at the way out */
    return find(['stairs', 'street']);
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
        await TUTOR.say('IT IS ON YOUR DESK. ' + ch.where + '.', cap);
        G.briefed = ch.id;
        STORY.note('BRIEFED: ' + ch.title + ' - ' + ch.obj);
        UI.stampSmall('NEW LEAD: ' + ch.where);
        if (G.phase === 'precinct') SCENE.open(ROOMS.precinct());   // relabel the room
        await STORY.capQuestions(cap, ch);
      } else if (STORY.canFinish()) {
        const go = await TUTOR.ask('THE BOARD IS FULL, DETECTIVE. THAT IS A CASE.', [
          { label: 'I AM TAKING THE STAIRS TONIGHT', note: 'GO AND FINISH IT' },
          { label: 'GIVE ME ONE MORE DAY ON IT', dim: true },
        ], cap);
        await TUTOR.say(go === 0
          ? 'TAKE IT UP THOSE STAIRS AND DO NOT GIVE HIM A REASON TO WALK.'
          : 'IT KEEPS. HE HAS KEPT SIX YEARS. JUST DO NOT LOSE THE FILE.',
        Object.assign({ last: true }, cap));
      } else {
        await STORY.capQuestions(cap, ch, U.pick(Math.random, [
          'THE FILE IS THIN AND THE CITY IS NOT PATIENT.',
          'I SIGNED NOTHING TODAY. REMEMBER THAT IF IT GOES WRONG.',
          'SIX YEARS. I KNOW. GO AND GET THE NEXT PIECE.',
        ]));
      }
    });
  },

  /* ------------------------------------------------------------
     AND WHAT YOU SAY BACK TO HIM.

     The captain is the only frog in the building who knows more
     than you do, and none of these are flavour: one puts a pin on
     your map, one puts a fast car under you, one tells you exactly
     how thin the file is. Each one is answered once a chapter, and
     the last thing on the rack is always the door.
     ------------------------------------------------------------ */
  async capQuestions(cap, ch, opener) {
    G.capAsked = G.capAsked || {};
    /* keyed by chapter AND night, so the car is a favour you can ask for
       again tomorrow and the pin is not a thing you farm twice */
    const k = (id) => ch.id + ':' + (G.day || 1) + ':' + id;
    const done = (id) => !!G.capAsked[k(id)];
    const mark = (id) => { G.capAsked[k(id)] = 1; };
    let line = opener || 'ANYTHING ELSE, DETECTIVE? THE DAY IS GOING.';

    for (let turn = 0; turn < 6; turn++) {
      const menu = [];

      if (!done('who')) menu.push({
        id: 'who', label: 'WHO ELSE HAS READ THIS FILE?', note: 'PUTS A PIN ON YOUR MAP',
        run: async () => {
          await TUTOR.say('NOBODY. THAT IS THE PROBLEM AND THAT IS ALSO THE POINT.', cap);
          const buried = ((G.case && G.case.clues) || []).filter(c2 => !c2.seen);
          const tip = buried.find(c2 => !(G.tips || {})[c2.at]) || buried[0];
          if (!tip) {
            await TUTOR.say('THERE IS NOTHING LEFT OUT THERE TO PULL. IT IS ALL IN YOUR COAT.', cap);
            return;
          }
          G.tips = G.tips || {};
          G.tips[tip.at] = 'ROOK PULLED A REPORT ON THIS';
          await TUTOR.say('BUT A UNIFORM WROTE SOMETHING UP AT ' + CITY.PLACES[tip.at].short +
            ' AND NEVER FILED IT. IT IS ON YOUR PHONE NOW.', cap);
          UI.stampSmall('NEW PIN: ' + CITY.PLACES[tip.at].short);
        },
      });

      if (!done('car')) menu.push({
        id: 'car', label: 'I WANT A CAR AND A RADIO.', note: 'THE NEXT DRIVE IS QUICK',
        run: async () => {
          G.fastDrive = 1;
          await TUTOR.say('TAKE THE GREY ONE OFF THE YARD. THE RADIO ONLY RECEIVES, WHICH SUITS ME.', cap);
          UI.stampSmall('RADIO CAR: NEXT DRIVE IS FAST');
        },
      });

      if (!done('wrong')) menu.push({
        id: 'wrong', label: 'WHAT IF I NAME THE WRONG FROG?', note: null,
        run: async () => {
          await TUTOR.say('HE WALKS PAST YOU AND HE LEARNS YOUR FACE. AND YOU STILL OWE ME A NAME.', cap);
          const n = CASE.left();
          const buried = CITY.totalLeft();
          await TUTOR.say(n > 1
            ? n + ' FACES STILL FIT WHAT YOU HAVE. THERE ARE ' + buried +
              ' THINGS LEFT IN THE CITY THAT WOULD CUT THAT DOWN.'
            : 'ONE FACE FITS. THAT IS NOT A GUESS ANY MORE, THAT IS A CASE.', cap);
        },
      });

      if (!done('why')) menu.push({
        id: 'why', label: 'WHY ARE YOU LETTING ME WORK THIS?', note: null,
        run: async () => {
          await TUTOR.say(U.pick(Math.random, [
            'BECAUSE EVERY FROG WHO WORKED IT BEFORE YOU WENT HOME AT SIX AND SLEPT FINE.',
            'BECAUSE THEY BURNED YOUR HOUSE AND YOU CAME BACK IN ON THE MONDAY.',
            'BECAUSE YOU ARE THE ONLY ONE WHO STILL LOOKS AT THAT BOARD LIKE IT OWES HIM MONEY.',
          ]), cap);
          await TUTOR.say('DO NOT MAKE ME SAY IT TWICE.', cap);
        },
      });

      menu.push({ id: 'go', label: 'I AM GOING TO WORK.', dim: true, run: null });

      const pick = await TUTOR.ask(line, menu.map(m => ({ label: m.label, note: m.note, dim: m.dim })), cap);
      const m = menu[pick === undefined || pick < 0 ? menu.length - 1 : pick];
      if (!m || !m.run) break;
      mark(m.id);
      await m.run();
      line = 'ANYTHING ELSE?';
    }
  },

  /* ============================================================
     THE SIDE WORK.

     Three errands the city hands you, each one paid for in the only
     currency that matters out here: something you can put in a bag.
     They are offered in conversation and they are all refusable.
     ============================================================ */

  QUESTS: {
    rats: {
      id: 'rats', place: 'laundry', who: 'THE LAUNDERER', kind: 'job', job: 'rats',
      offer: 'THERE ARE RATS IN MY DRUMS. THREE OF THEM, BIG ONES. GET THEM OUT AND I WILL TELL YOU WHAT I PULLED OUT OF THE DRAIN LAST WEEK.',
      yes: 'GET THE RATS OUT', no: 'I AM NOT PEST CONTROL',
      task: 'THE DRUMS. THREE RATS.',
      wait: 'THE DRUMS ARE STILL MOVING, DETECTIVE.',
      done: 'THE DRUMS ARE CLEAR. NOW TALK.',
      pay: 22,
    },
    tally: {
      id: 'tally', place: 'docks', who: 'THE WATCHMAN', kind: 'search', prop: 'water',
      offer: 'MY TALLY BOOK WENT OFF THE EDGE INTO THE CANAL. FISH IT OUT AND I WILL TELL YOU WHICH CRATE WENT OUT FRIDAY WITH NO NUMBER ON IT.',
      yes: 'I WILL GO IN THE WATER', no: 'THAT IS NOT WATER ANY MORE',
      task: 'THE CANAL UNDER THE PIER.',
      wait: 'IT IS IN THE CANAL. UNDER THE PIER. WHERE ELSE WOULD IT BE.',
      done: 'THAT IS THE BOOK. WET, BUT THAT IS THE BOOK. NOW LISTEN.',
      pay: 24,
    },
    parcel: {
      id: 'parcel', place: 'pawn', who: 'THE BROKER', kind: 'carry', to: 'docks',
      cargo: 'A PARCEL, TIED WITH STRING',
      offer: 'RUN A PARCEL TO THE PIER FOR ME AND DO NOT LOOK IN IT. I WILL LET YOU READ THE PAGE OF THE LEDGER NOBODY READS.',
      yes: 'I WILL RUN IT', no: 'I LOOK IN EVERYTHING',
      task: 'TAKE THE PARCEL TO THE PIER.',
      wait: 'THE PIER. NINETEEN. IT IS NOT A LONG DRIVE.',
      done: 'IT GOT THERE UNOPENED. THE LEDGER IS OPEN.',
      pay: 26,
    },
    tray: {
      id: 'tray', place: 'diner', who: 'THE WAITRESS', kind: 'carry', to: 'precinct',
      cargo: 'A TRAY OF DONUTS, STILL WARM',
      offer: 'RUN A TRAY OF THESE TO THE NIGHT SHIFT AT THE PRECINCT. THEY TIP IN GOSSIP AND I CANNOT SPEND GOSSIP.',
      yes: 'I AM GOING THAT WAY', no: 'I AM NOT A WAITER',
      task: 'GET THE TRAY TO THE PRECINCT.',
      wait: 'THEY GO COLD, HONEY. THE PRECINCT.',
      done: 'THEY ATE THE LOT AND THEY TALKED. HERE IS THE PART THAT IS YOURS.',
      pay: 20,
    },
    door: {
      id: 'door', place: 'bar', who: 'THE BARMAN', kind: 'wait', mins: 20,
      offer: 'WATCH THE DOOR FOR TWENTY MINUTES WHILE I COUNT THE TILL. ANYBODY COMES IN, YOU ARE A CUSTOMER. I WILL REMEMBER WHO SAT IN HERE FRIDAY.',
      yes: 'I WILL WATCH THE DOOR', no: 'NOT MY JOB',
      task: 'TWENTY MINUTES ON THE DOOR.',
      wait: 'YOU ARE MEANT TO BE WATCHING THE DOOR.',
      done: 'NOBODY CAME IN. YOU EARNED THAT.',
      pay: 18,
    },
  },

  questState(id) { return (G.quests = G.quests || {})[id] || 'none'; },

  /* the errand that belongs to wherever you are standing */
  questAt(place) {
    const q = Object.keys(STORY.QUESTS).map(k => STORY.QUESTS[k])
      .find(q2 => q2.place === place);
    return q || null;
  },

  /* every errand you are in the middle of, for the phone */
  questsLive() {
    return Object.keys(STORY.QUESTS).map(k => STORY.QUESTS[k])
      .filter(q => { const st = STORY.questState(q.id); return st === 'taken' || st === 'ready'; })
      .map(q => ({ q, state: STORY.questState(q.id) }));
  },

  /* ------------------------------------------------------------
     THE ERRANDS WATCH THE NIGHT.

     A delivery lands the moment you park at the far end of it; a
     tally book comes up the moment you put your hand in the canal.
     Nobody has to remember to tell the game an errand is done.
     ------------------------------------------------------------ */
  questWatch(ev) {
    const out = [];
    Object.keys(STORY.QUESTS).forEach(id => {
      const q = STORY.QUESTS[id];
      if (STORY.questState(id) !== 'taken') return;
      const hit = (q.kind === 'carry' && ev.arrive === q.to)
        || (q.kind === 'search' && ev.search &&
            ev.search.place === q.place && ev.search.prop === q.prop);
      if (!hit) return;
      G.quests[id] = 'ready';
      STORY.note('ERRAND DONE. GO BACK TO ' + q.who + '.');
      UI.stampSmall('ERRAND DONE: SEE ' + q.who);
      if (typeof PHONE !== 'undefined' && PHONE.notify) {
        PHONE.notify({ app: 'map', tone: 'good',
          head: q.who + ' OWES YOU NOW',
          body: 'THE ERRAND IS DONE. GO BACK FOR WHAT IT PAYS.' });
      }
      SFX.chak && SFX.chak();
      out.push(q);
    });
    return out;
  },

  /* ------------------------------------------------------------
     THE PAY-OFF.

     Every errand is paid in the only currency out here: a piece of
     evidence somebody has been sitting on, plus loose notes. The
     clue comes out of his own place first, so doing a favour where
     you are standing is worth more than doing one across town.
     ------------------------------------------------------------ */
  async questPay(q, opts) {
    opts = opts || {};
    const art = opts.art || SPR.frogCustom('wit:' + q.place, PLACE_WITNESS[q.place] || BARMAN_DEF);
    const who = opts.voice || { name: q.who, nameCol: PIX.PAL.G, rim: PIX.PAL.g, art };
    (G.quests = G.quests || {})[q.id] = 'paid';
    if (G.cargo) delete G.cargo[q.id];
    const clues = (G.case && G.case.clues) || [];
    const cl = clues.find(c2 => !c2.seen && c2.at === q.place) || clues.find(c2 => !c2.seen);
    if (opts.line !== null) await TUTOR.say(opts.line || q.done, who);
    if (!opts.noCash) {
      G.chips += q.pay;
      UI.syncChips && UI.syncChips();
      UI.chipTick && UI.chipTick(q.pay);
    }
    CITY.spend('job', 0.5);
    STORY.note('DID ' + q.who + ' A FAVOUR.');
    STORY.karmaHit('errand');
    if (cl) {
      cl.seen = true;
      cl.foundAt = q.place + ':favour';
      STORY.note('HE GAVE IT UP: ' + cl.text);
      /* HANDED OVER, NOT DUG UP — but it still goes in a bag in front of
         you, so it gets the same beat as everything else you find. */
      await CINE.pickUp(cl, CASE.left(), 'HANDED OVER BY ' + q.who);
    } else if (!opts.noCash) {
      await TUTOR.say('TAKE THE MONEY THEN. ' + q.pay + '.', who);
    }
    if (CITY.nightOver()) await STORY.dawn();
  },

  /* ------------------------------------------------------------
     STANDING IN FRONT OF THE FROG WHO ASKED YOU.

     Returns true if the errand WAS the conversation — an offer you
     took, or a pay-off. Refusing it, or being reminded of it, hands
     you straight back to the questions.
     ------------------------------------------------------------ */
  async offerQuest(place) {
    const q = STORY.questAt(place);
    if (!q) return false;
    const st = STORY.questState(q.id);
    if (st === 'paid') return false;
    const art = SPR.frogCustom('wit:' + place, PLACE_WITNESS[place] || BARMAN_DEF);
    const who = { name: q.who, nameCol: PIX.PAL.N, rim: PIX.PAL.n, art };

    if (st === 'ready') { await STORY.questPay(q); return true; }

    if (st === 'taken') {
      await TUTOR.say(q.wait, Object.assign({ hold: 2100, top: true }, who));
      return false;
    }

    const pick = await TUTOR.ask(q.offer, [
      { label: q.yes, note: 'PAYS IN EVIDENCE' },
      { label: q.no, dim: true },
    ], who);
    if (pick !== 0) return false;

    G.quests[q.id] = 'taken';
    STORY.note('TOOK AN ERRAND FROM ' + q.who + ': ' + q.task);

    /* WHAT TAKING IT ACTUALLY MEANS depends on the errand. */
    if (q.kind === 'job') {                       // do it here, right now
      const r = await JOBS[q.job]();
      if (r.hits >= 2) {
        await STORY.questPay(q, { line: r.hits === 3 ? q.done : 'CLOSE ENOUGH. THE BIG ONE IS GONE.' });
      } else {
        await TUTOR.say('THEY ARE STILL IN THERE. TRY AGAIN WHEN YOUR HANDS STOP SHAKING.', who);
        G.quests[q.id] = 'none';                   // he will ask you again
      }
      return true;
    }
    if (q.kind === 'wait') {                      // it costs you the clock
      CITY.spend('talk', q.mins / (CITY.COST.talk || 6));
      UI.stampSmall('TWENTY MINUTES ON THE DOOR');
      await STORY.questPay(q);
      return true;
    }
    if (q.kind === 'carry') {                     // it goes in your coat
      G.cargo = G.cargo || {};
      G.cargo[q.id] = q.cargo || 'SOMETHING OF HIS';
      UI.stampSmall('IN YOUR COAT: ' + (q.cargo || 'HIS PARCEL'));
    }
    await TUTOR.say('COME BACK WHEN IT IS DONE.', who);
    return true;
  },

  /* ------------------------------------------------------------
     AND YOU COULD ALWAYS LOOK IN IT.

     A parcel you were told not to open is the most interesting
     object in the city. Opening it gets you the evidence tonight
     and costs you the money and the frog who gave it to you.
     ------------------------------------------------------------ */
  async cargoBeat(id) {
    const live = STORY.questsLive().filter(x => x.state === 'ready' && x.q.kind === 'carry'
      && x.q.to === id);
    for (const x of live) {
      const q = x.q;
      const you = { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t };
      const pick = await TUTOR.ask('IT IS TIED WITH STRING AND HE TOLD YOU NOT TO LOOK.', [
        { label: 'DROP IT AND DRIVE BACK', note: 'HE PAYS IN FULL' },
        { label: 'LOOK IN IT', note: 'YOU KEEP WHAT IS IN IT. HE IS DONE WITH YOU.' },
      ], you);
      if (pick === 1) {
        STORY.note('OPENED ' + q.who + "'S PARCEL. HE WILL HEAR ABOUT IT.");
        STORY.karmaHit('parcel');
        await STORY.questPay(q, {
          noCash: true, voice: you,
          line: 'STRING, PAPER, AND SOMETHING HE DID NOT WANT A COP HOLDING.',
        });
        /* and he is done with you: no money, no answers, not tonight */
        G.burned = G.burned || {};
        G.burned[q.place] = 1;
        UI.stampSmall((CITY.PLACES[q.place] || {}).short + ' IS CLOSED TO YOU');
      }
    }
  },

  talkMaybelle() {
    return STORY.converse('may', async () => {
      const may = { art: SPR.frogCustom('maybelle', MAYBELLE_DEF), name: 'OFFICER MAYBELLE', nameCol: PIX.PAL.P, rim: PIX.PAL.p };
      const d = META.load();
      const t = d.trust || 0;

      /* SHE ALWAYS HAS SOMETHING. What it is depends on how many nights
         you have bothered to stop at her desk instead of walking past it. */
      const gift = async () => {
        G.mayTalked = true;
        d.trust = (d.trust || 0) + 1; META.save();
        const n = d.trust;
        if (n < 3) {
          await TUTOR.say(U.pick(Math.random, [
            'NOTHING BUT A SIGNATURE. I PUT YOU IN AT EIGHT, SO YOU OWE ME NOTHING.',
            'THE DESK SERGEANT ASKED WHO STILL BRINGS YOU CASES. I SAID NOBODY ASKS THAT.',
            'ONLY THIS: YOU LOOK TIRED. THAT IS NOT A CRITICISM, IT IS A WORRY.',
          ]), may);
        } else if (n < 6) {
          G.chips += 4; UI.syncChips && UI.syncChips(); UI.chipTick && UI.chipTick(4);
          await TUTOR.say('I PUT COFFEE MONEY IN YOUR COAT. DO NOT ARGUE WITH ME ABOUT IT.', may);
          UI.stampSmall('+4 FROM MAYBELLE');
        } else if (n < 9) {
          G.mayLook = true;
          if (G.case && !G.case.done && !G.case.known) G.case.looks++;
          await TUTOR.say('I PULLED THE FILE BEFORE THE SHIFT CHANGE. ONE MORE LOOK IS IN THERE.', may);
          UI.stampSmall('MAYBELLE: +1 LOOK, ALL DAY');
        } else {
          G.mayHeart = true; G.hearts = E.maxHP();
          await TUTOR.say('WHATEVER HAPPENS UP THERE... COME HOME AFTER. YOU HEAR ME?', may);
          await TUTOR.say('...I MEAN IT.', may);
          UI.stampSmall('MAYBELLE: +1 HEART, ALL DAY');
          SFX.bank();
        }
      };

      let line = G.mayTalked
        ? U.pick(Math.random, ['STILL HERE? GOOD.', 'THE COFFEE IS STILL WARM.', 'YOU KNOW WHERE I AM.'])
        : (t < 3 ? 'LATE ONE AGAIN, DETECTIVE.'
          : t < 6 ? 'YOU LOOK LIKE THE STAIRS BEAT YOU. STAND THERE A MINUTE.'
            : 'I KEPT THE LAMP ON OVER YOUR DESK. NOBODY ASKED WHY.');

      G.mayAsked = G.mayAsked || {};
      for (let turn = 0; turn < 5; turn++) {
        const menu = [];
        if (!G.mayTalked) menu.push({
          id: 'gift', label: 'HAVE YOU GOT ANYTHING FOR ME?', note: 'SHE ALWAYS HAS', run: gift,
        });
        if (!G.mayAsked.desk) menu.push({
          id: 'desk', label: 'WHAT IS THE DESK SAYING ABOUT ME?', run: async () => {
            G.mayAsked.desk = 1;
            await TUTOR.say(t < 6
              ? 'THAT YOU WORK A CASE NOBODY SIGNED. I SAY THE FILING IS NOT MY BUSINESS.'
              : 'THAT YOU ARE GOING TO GET YOURSELF KILLED. I STOPPED ARGUING ABOUT IT.', may);
          },
        });
        if (!G.mayAsked.night) menu.push({
          id: 'night', label: 'DO YOU REMEMBER THAT NIGHT AT MY HOUSE?', run: async () => {
            G.mayAsked.night = 1;
            await TUTOR.say('I WAS THE ONE WHO CALLED IT IN. I HAVE NEVER TOLD YOU THAT.', may);
            await TUTOR.say('I STOOD IN THE STREET AND I COULD NOT GET NEAR THE DOOR.', may);
            d.trust = (d.trust || 0) + 1; META.save();
          },
        });
        if (t >= 6 && !d.promised) menu.push({
          id: 'after', label: 'COME OUT WITH ME WHEN THIS IS OVER.', note: 'SHE WILL HOLD YOU TO IT',
          run: async () => {
            d.promised = 1; d.trust = (d.trust || 0) + 1; META.save();
            await TUTOR.say('THEN FINISH IT. I AM NOT GOING ANYWHERE AND THAT IS THE WHOLE PROBLEM.', may);
            UI.stampSmall('A PROMISE. TRY AND KEEP IT.');
            SFX.bank && SFX.bank();
          },
        });
        menu.push({ id: 'go', label: 'I HAVE TO GO.', dim: true, run: null });

        const pick = await TUTOR.ask(line, menu.map(m => ({ label: m.label, note: m.note, dim: m.dim })), may);
        const m = menu[pick === undefined || pick < 0 ? menu.length - 1 : pick];
        if (!m || !m.run) break;
        await m.run();
        line = U.pick(Math.random, ['ANYTHING ELSE?', 'GO ON.', 'WELL?']);
      }
    });
  },

  wardTalk() {
    return STORY.converse('may', async () => {
      const may = { art: SPR.frogCustom('maybelle', MAYBELLE_DEF), name: 'OFFICER MAYBELLE', nameCol: PIX.PAL.P, rim: PIX.PAL.p };
      const trip = Math.min(2, (G.wardTrips || 1) - 1);
      const open = ['THEY BROUGHT YOU IN AT THREE. I WAS OFF AT ELEVEN.',
        'YOU SAID A NAME WHILE YOU WERE UNDER. IT WAS NOT HIS.',
        'THE DOCTOR ASKED IF YOU HAD FAMILY. I SAID YES.'][trip];
      const d = META.load(); d.trust = (d.trust || 0) + 1; META.save();

      G.wardAsked = G.wardAsked || {};
      let line = open;
      for (let turn = 0; turn < 4; turn++) {
        const menu = [];
        if (!G.wardAsked.stayed) menu.push({
          id: 'stayed', label: 'YOU STAYED?', run: async () => {
            G.wardAsked.stayed = 1;
            await TUTOR.say(['I STAYED.',
              'IT WAS NOT MINE EITHER, BEFORE YOU ASK.',
              'DO NOT MAKE A LIAR OF ME.'][trip], may);
          },
        });
        if (!G.wardAsked.bad) menu.push({
          id: 'bad', label: 'HOW BAD IS IT?', note: null, run: async () => {
            G.wardAsked.bad = 1;
            await TUTOR.say('THE SURGEON WROTE NOT FIT FOR DUTY AND SOMEBODY CROSSED IT OUT.', may);
            await TUTOR.say('IT WAS NOT ME. I WOULD HAVE UNDERLINED IT.', may);
          },
        });
        if (!G.wardAsked.file) menu.push({
          id: 'file', label: 'WHERE IS MY FILE?', note: 'IT IS STILL YOURS', run: async () => {
            G.wardAsked.file = 1;
            await TUTOR.say('IN YOUR COAT, ON THE HOOK, WHERE THE NURSE COULD NOT REACH IT.', may);
            await TUTOR.say('NOBODY HAS TAKEN THE CASE OFF YOU. NOT YET.', may);
          },
        });
        menu.push({ id: 'go', label: 'I AM GETTING UP.', dim: true, run: null });

        const pick = await TUTOR.ask(line, menu.map(m => ({ label: m.label, note: m.note, dim: m.dim })), may);
        const m = menu[pick === undefined || pick < 0 ? menu.length - 1 : pick];
        if (!m || !m.run) break;
        await m.run();
        line = U.pick(Math.random, ['WHAT ELSE.', 'GO ON, ASK.', 'LIE STILL AND TALK.']);
      }
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

  /* The street door does not go anywhere by itself any more: it gets the
     car, and the car is the phone. */
  async goOut() {
    if (!STORY.lead()) {
      await TUTOR.say('YOU HAVE NOWHERE TO BE. SEE THE CAPTAIN FIRST.',
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
      return;
    }
    /* whoever was at the last table is finished with; roll tonight's frog,
       his decoys, and bury the clues across the city */
    if (!G.duel || G.duel.over) { STORY.clearTable(); G.case = null; E.startBlind(); }
    if (!G.case) CASE.build();
    PHONE.open('map');
  },

  /* ============================================================
     THE CITY.

     Driving, searching, asking. Everything out here costs the
     clock, and the clock is the night.
     ============================================================ */

  async travel(id) {
    const p = CITY.PLACES[id];
    if (!p || CITY.at(id) || CINE.busy) return;
    if (!G.case && id !== 'precinct') CASE.build();
    SCENE.close();
    /* the grey car off the yard, if you asked him for it: one fast trip */
    const fast = !!G.fastDrive;
    if (fast) G.fastDrive = 0;
    CITY.spend('travel', fast ? 0.55 : 1);
    G.weather = CITY.rollWeather();
    await CINE.driveTo(p.name);
    if (fast) UI.stampSmall('YOU MADE IT IN HALF THE TIME');
    if (id === 'precinct') {
      G.place = 'precinct';
      G.phase = 'precinct';
      UI.render();
      await STORY.arrive('precinct');
    } else {
      CITY.visit(id);
      G.floor = null;                     // you come in at street level
      G.phase = 'place';
      UI.render();
      await STORY.arrivePlace(id);
    }
    /* anything you were carrying to this end of the city has arrived */
    if (STORY.questWatch({ arrive: id }).length) await STORY.cargoBeat(id);
    if (CITY.nightOver()) await STORY.dawn();
  },

  /* the establishing shot for a place: name, hour and sky */
  async arrivePlace(id) {
    const p = CITY.PLACES[id];
    if (!p || !SCENE.def) return;
    await CINE.establish({
      name: p.name,
      sub: p.sub + '  -  ' + CITY.hhmm() + '  -  ' + CITY.sky().word,
      from: Math.min(SCENE.def.w - 10, SCENE.me.x + 150),
      to: SCENE.me.x, ms: 1700,
    });
  },

  /* ============================================================
     THE PRINT KIT, ON THE BENCH AT THE STATION.

     What you carried back has been handled. Powder, tape, a card,
     and a steady hand gets you a name off it — which is worth a
     face off the wall. It is expensive on purpose: half an hour of
     a night that has none, and once a case.
     ============================================================ */
  async dustJob() {
    if (CINE.busy) return;
    const c = G.case;
    if (!c || c.known) {
      await TUTOR.say('NOTHING ON THE BENCH WORTH POWDERING.',
        { name: 'THE PRINT KIT', nameCol: PIX.PAL.q, rim: PIX.PAL.t, hold: 1900, top: true });
      return;
    }
    if (G.dusted) {
      await TUTOR.say('YOU HAVE LIFTED EVERYTHING THAT WAS ON IT.',
        { name: 'THE PRINT KIT', nameCol: PIX.PAL.q, rim: PIX.PAL.t, hold: 1900, top: true });
      return;
    }
    const got = CITY.found();
    if (!got.length) {
      await TUTOR.say('YOU HAVE NOT BROUGHT ANYTHING BACK TO DUST.',
        { name: 'THE PRINT KIT', nameCol: PIX.PAL.q, rim: PIX.PAL.t, hold: 2100, top: true });
      return;
    }
    const r = await JOBS.prints();
    G.dusted = 1;
    CITY.spend('search', 1.7);
    if (!r.clean) {
      await TUTOR.say(r.hits ? r.hits + ' PARTIALS AND A SMUDGE. NOT ENOUGH TO SAY A NAME WITH.'
        : 'YOU HAVE WIPED THE RIDGE OFF IT. THAT IS THAT.',
        { name: 'THE PRINT KIT', nameCol: PIX.PAL.R, rim: PIX.PAL.r });
      return;
    }
    /* a clean lift is worth a clue: it crosses somebody off */
    const left = (c.clues || []).filter(cl => !cl.seen);
    if (!left.length) {
      await TUTOR.say('A CLEAN ONE. IT MATCHES WHAT YOU ALREADY KNOW.',
        { name: 'THE PRINT KIT', nameCol: PIX.PAL.G, rim: PIX.PAL.g });
      return;
    }
    const cl = left[0];
    cl.seen = true;
    cl.foundAt = 'precinct:dusted';
    STORY.note('LIFTED A PRINT: ' + cl.text);
    SFX.jackpot();
    await CINE.pickUp(cl, CASE.left(), 'LIFTED OFF THE EVIDENCE AT THE STATION');
  },

  /* ============================================================
     UP AND DOWN THE BUILDING.

     The stairs are not a place on the map: they are inside one.
     Going down them costs a couple of minutes and takes you to
     another painted room whose props belong to the same stop.
     ============================================================ */
  async toFloor(to) {
    if (CINE.busy) return;
    const place = G.place;
    const room = PLACES.build(place, to === place ? null : to);
    if (!room) return;
    G.floor = to === place ? null : to;
    CITY.spend('talk');                       // a flight of stairs is a minute
    SCENE.close();
    await UI.goto(() => { G.phase = 'place'; });
    if (G.phase !== 'place') { G.phase = 'place'; UI.render(); }
    await CINE.establish({
      name: room.stairs && room.stairs.to === place ? (room.id === 'cellar' ? 'THE CELLAR'
        : room.id === 'above' ? 'OVER THE SHOP' : 'ANOTHER FLOOR')
        : (CITY.PLACES[place] || {}).name || 'INSIDE',
      sub: CITY.hhmm() + '  -  ' + (room.id === 'cellar' ? 'UNDER THE LAUNDRY'
        : room.id === 'above' ? 'THE BROKER LIVES HERE' : 'GROUND FLOOR'),
      from: Math.min(room.w - 10, (SCENE.me ? SCENE.me.x : 40) + 120),
      to: SCENE.me ? SCENE.me.x : 40, ms: 1300,
    });
    if (CITY.nightOver()) await STORY.dawn();
  },

  /* what the glass said about a prop, if anything: 1 hot, -1 clean, 0 unseen */
  lookedAt(place, prop) {
    return (G.looked && G.looked[place + ':' + prop]) || 0;
  },

  /* ============================================================
     THE PAVEMENT.

     Every dog in this city fouls it and nobody in this city picks
     it up. There is a scoop and a bag on the back of the sanitation
     cart at every stop, and three minutes of your night, and the
     only thing you get for it is that somebody does not step in it.
     ============================================================ */
  async scoopIt(mess) {
    if (CINE.busy) return;
    const r = await JOBS.scoop();
    CITY.spend('talk', 0.5);
    (G.jobsDone = G.jobsDone || {}).scoop = 1;
    if (!r.clean) {
      await TUTOR.say(r.hits ? "MOST OF IT. THE REST IS SOMEBODY ELSE'S PROBLEM NOW."
        : 'YOU HAVE MADE IT WORSE AND YOU HAVE IT ON YOUR SHOE.',
      { name: 'THE PAVEMENT', nameCol: PIX.PAL.q, rim: PIX.PAL.t });
      if (mess) mess.done = r.hits > 0;
      return;
    }
    if (mess) mess.done = true;
    STORY.karmaHit('clean');
    G.chips += 4;
    UI.syncChips && UI.syncChips();
    STORY.note('CLEANED THE PAVEMENT AT ' + ((CITY.PLACES[G.place] || {}).short || 'A STOP') + '.');
    await TUTOR.say(U.pick(Math.random, [
      'CLEAN PAVEMENT. IN THIS CITY THAT IS PRACTICALLY A MIRACLE.',
      'A FROG IN A GOOD COAT WITH A BAG OF THAT. THE STREET SAW IT.',
      'NOBODY IS GOING TO STEP IN IT NOW. THAT IS THE WHOLE REWARD.',
    ]), { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t, hold: 2400, top: true });
  },

  /* ============================================================
     THE THREE CUPS.

     A frog with a folding table and a crowd of his own friends in
     it. You can play — and he will let you win the first one — or
     you can run the table yourself, which pays better and costs
     you something you cannot buy back.
     ============================================================ */
  async cupGame(o) {
    if (CINE.busy) return;
    const art = o && o.key ? SPR.frogCustom(o.key, o.def) : null;
    const who = { name: 'THE CUP MAN', nameCol: PIX.PAL.R, rim: PIX.PAL.r, art };
    if (G.jobsDone && G.jobsDone.cups) {
      await TUTOR.say('WE ARE DONE, YOU AND ME.', Object.assign({ hold: 2000, top: true }, who));
      return;
    }
    const pick = await TUTOR.ask(
      'TEN ON THE BALL, DETECTIVE. THE HAND IS SLOWER THAN THE EYE, THEY SAY.', [
        { label: 'PUT TEN ON IT', note: 'IF YOU CAN FOLLOW IT' },
        { label: 'WARN THE MARK OFF', note: 'HE HAS RENT IN THAT HAND' },
        { label: 'RUN THE TABLE YOURSELF', note: 'IT PAYS. IT COSTS.' },
        { label: 'WALK ON', dim: true },
      ], who);

    if (pick === 1) {
      (G.jobsDone = G.jobsDone || {}).cups = 1;
      STORY.karmaHit('warn');
      CITY.spend('talk');
      await TUTOR.say('THE MARK PUTS HIS MONEY AWAY AND GOES HOME. THE CUP MAN LOOKS AT YOU.',
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
      await TUTOR.say('THAT WAS MY RENT. I HOPE YOU FEEL WONDERFUL.', who);
      return;
    }
    if (pick === 2) {
      (G.jobsDone = G.jobsDone || {}).cups = 1;
      const r = await JOBS.cups(false);
      CITY.spend('job', 0.6);
      STORY.karmaHit('scam');
      const take = 18 + r.hits * 9;
      G.chips += take;
      UI.syncChips && UI.syncChips();
      UI.chipTick && UI.chipTick(take);
      STORY.note('RAN THE CUPS ON THE BUTTE FOR ' + take + '.');
      await TUTOR.say('THEY NEVER SEE IT. ' + take + ' AND A BAD TASTE.',
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
      return;
    }
    if (pick !== 0) return;

    /* playing it straight: he is quicker than you are */
    const r = await JOBS.cups(true);
    (G.jobsDone = G.jobsDone || {}).cups = 1;
    CITY.spend('job', 0.5);
    if (r.won) {
      const win = 22;
      G.chips += win;
      UI.syncChips && UI.syncChips();
      UI.chipTick && UI.chipTick(win);
      STORY.note('BEAT THE CUPS ON THE BUTTE.');
      await TUTOR.say('NOBODY BEATS THAT TABLE. ' + win + ', AND GET OFF MY SQUARE.', who);
      /* and a frog who has just lost money tells you things */
      if (G.case) {
        G.case.quiz = (G.case.quiz || 0) + 1;
        await TUTOR.say('ASK ME YOUR QUESTION. QUICKLY.', who);
      }
    } else {
      const lost = Math.min(10, G.chips);
      G.chips -= lost;
      UI.syncChips && UI.syncChips();
      await TUTOR.say('IT WAS NEVER UNDER THAT ONE. IT IS NEVER UNDER ANY OF THEM.', who);
    }
  },

  /* ============================================================
     THE PAINTER ON THE BUTTE.

     He has been painting the same street for eleven years, he has
     a baguette in his coat and nobody to sit for him. Sitting
     costs you twenty minutes of a night you cannot spare, and he
     talks the entire time — which is the point, because he watches
     this square all day.
     ============================================================ */
  async sitForPainter(o) {
    if (CINE.busy) return;
    const art = o && o.key ? SPR.frogCustom(o.key, o.def) : null;
    const who = { name: 'THE PAINTER', nameCol: PIX.PAL.O, rim: PIX.PAL.o, art };
    if (G.jobsDone && G.jobsDone.sit) {
      await TUTOR.say('I HAVE YOUR FACE. GO AND USE IT SOMEWHERE.',
        Object.assign({ hold: 2000, top: true }, who));
      return;
    }
    const pick = await TUTOR.ask(
      'SIT FOR ME. TWENTY MINUTES. I HAVE HALF A LOAF AND NOBODY TO LOOK AT.', [
        { label: 'I WILL SIT', note: 'HE WATCHES THIS SQUARE ALL DAY' },
        { label: 'NOT TONIGHT', dim: true },
      ], who);
    if (pick !== 0) return;

    (G.jobsDone = G.jobsDone || {}).sit = 1;
    CITY.spend('ask', 1.7);
    STORY.karmaHit('sit');
    await TUTOR.say('HOLD THE HAT. NO — HOLD IT LIKE YOU MEAN IT.', who);
    await TUTOR.say(U.pick(Math.random, [
      'I PAINT THIS STREET EVERY DAY AND EVERY DAY IT IS DIFFERENT PEOPLE.',
      "THE BREAD IS YESTERDAY'S. THE LIGHT IS THE SAME AS IT ALWAYS IS.",
      'YOU HAVE A FACE LIKE A MAN WHO HAS READ THE FILE. THAT IS NOT A COMPLIMENT.',
    ]), who);
    /* and what he saw, which is the actual pay */
    const clues = (G.case && G.case.clues) || [];
    const cl = clues.find(c2 => !c2.seen && c2.at === G.place) || clues.find(c2 => !c2.seen);
    if (cl) {
      cl.seen = true;
      cl.foundAt = 'butte:painter';
      STORY.note('THE PAINTER SAW IT: ' + cl.text);
      await TUTOR.say('AND WHILE YOU SAT THERE I REMEMBERED SOMETHING.', who);
      await CINE.pickUp(cl, CASE.left(), 'FROM A PAINTER WHO NEVER LOOKS AWAY');
    } else {
      G.chips += 8;
      UI.syncChips && UI.syncChips();
      await TUTOR.say('TAKE THE BREAD. IT IS ALL I HAVE AND YOU SAT STILL.', who);
    }
    if (CITY.nightOver()) await STORY.dawn();
  },

  /* ============================================================
     KARMA.

     Nobody in this city keeps a ledger of what you do, so the game
     does. Every deed moves one number: cleaning up after somebody
     else's dog, tipping a busker, letting a scammer keep his cups,
     putting a gun in a witness's face, taking money off a frog who
     had none. It shows on the phone, it changes what the street
     says to you, and at the end it decides which of the two
     endings you have actually earned.
     ============================================================ */
  KARMA: {
    pet: { n: 1, what: 'PUT A HAND OUT TO AN ANIMAL' },
    clean: { n: 3, what: "CLEANED UP AFTER SOMEBODY ELSE'S DOG" },
    tip: { n: 2, what: 'TIPPED A BUSKER WHO NEEDED IT' },
    sit: { n: 2, what: 'SAT FOR A PAINTER WHO HAD NOBODY' },
    warn: { n: 2, what: 'WARNED A MARK OFF THE CUPS' },
    donut: { n: 1, what: 'FED THE NIGHT SHIFT' },
    errand: { n: 1, what: 'DID SOMEBODY A FAVOUR AND MEANT IT' },
    rat: { n: 0, what: 'SHOT A RAT. THE CITY IS INDIFFERENT.' },
    scam: { n: -3, what: 'RAN THE CUPS ON A TOURIST' },
    wide: { n: -1, what: 'FIRED A GUN IN THE STREET' },
    lean: { n: -6, what: "PUT A GUN IN A WITNESS'S FACE" },
    parcel: { n: -2, what: 'OPENED A PARCEL YOU WERE TRUSTED WITH' },
    wrong: { n: -4, what: 'NAMED A FROG WHO HAD DONE NOTHING' },
    steal: { n: -2, what: 'TOOK MONEY OFF SOMEBODY WHO HAD NONE' },
  },

  /* move it, remember why, and say so */
  karmaHit(id, mult) {
    const k = STORY.KARMA[id];
    if (!k) return 0;
    const n = Math.round(k.n * (mult === undefined ? 1 : mult));
    if (!n) return 0;
    G.karmaScore = (G.karmaScore || 0) + n;
    G.karmaLog = G.karmaLog || [];
    G.karmaLog.push({ id, n, what: k.what });
    if (G.karmaLog.length > 24) G.karmaLog.shift();
    /* it follows you between cases, because a reputation does */
    const d = META.load();
    d.karma = (d.karma || 0) + n; META.save();
    if (UI.stampSmall) UI.stampSmall('KARMA ' + (n > 0 ? '+' : '') + n);
    return n;
  },

  /* where you stand, in a word */
  karma() {
    const score = G.karmaScore || 0;
    const last = (G.karmaLog || []).length
      ? G.karmaLog[G.karmaLog.length - 1].what : null;
    const band = score >= 14 ? 0 : score >= 5 ? 1 : score > -5 ? 2 : score > -14 ? 3 : 4;
    const WORD = ['A GOOD COP', 'STILL DECENT', 'A COP', 'GETTING UGLY', 'A BAD COP'];
    const BLURB = [
      'PEOPLE TELL YOU THINGS THEY DO NOT HAVE TO. IT ADDS UP.',
      'NOBODY IS FRIGHTENED OF YOU YET, WHICH HELPS.',
      'YOU HAVE NOT DONE ANYTHING THE CITY WILL REMEMBER EITHER WAY.',
      'WORD IS GETTING ROUND. WITNESSES ARE GETTING SHORTER.',
      'THEY TALK TO YOU BECAUSE THEY ARE AFRAID. IT SHOWS IN THE FILE.',
    ];
    return { score, band, word: WORD[band], blurb: BLURB[band], last };
  },

  /* what a witness thinks of you before you open your mouth */
  karmaMood() {
    const b = STORY.karma().band;
    return b <= 1 ? 1 : b === 2 ? 0 : -1;
  },

  /* ============================================================
     THE JOBS BOARD.

     A detective on this salary works the room. This is every bit
     of paying work the night has in it, where it is, and whether
     you have already done it.
     ============================================================ */
  JOBS_BOARD: [
    { id: 'pour', name: 'WORK THE TAPS', where: 'LE MOULIN ROUGE', icon: 'ic_glass' },
    { id: 'donuts', name: 'MAKE A BATCH', where: 'CAFE DU PONT', icon: 'ic_cup' },
    { id: 'rats', name: 'CLEAR THE DRUMS', where: 'LAVERIE DU CANAL', icon: 'ic_rat' },
    { id: 'scoop', name: 'THE PAVEMENT', where: 'ANYWHERE A DOG HAS BEEN', icon: 'ic_paw' },
    { id: 'sit', name: 'SIT FOR THE PAINTER', where: 'LA BUTTE', icon: 'ic_star' },
    { id: 'cups', name: 'THE THREE CUPS', where: 'LA BUTTE', icon: 'ic_coin' },
    { id: 'kit', name: 'DUST FOR PRINTS', where: 'LA BRIGADE', icon: 'ic_case' },
  ],

  jobsBoard() {
    return STORY.JOBS_BOARD.map(j => Object.assign({}, j, {
      done: !!(G.jobsDone && G.jobsDone[j.id]),
    }));
  },
  jobsOpen() { return STORY.jobsBoard().filter(j => !j.done); },

  /* ============================================================
     THE ONE NICE THING IN THE GAME.

     There is a cat at four of the five stops and a dog at the
     station. Nothing in the case depends on any of them.
     ============================================================ */
  async petIt(a) {
    if (CINE.busy) return;
    a.pet = 2.2;
    a.wait = 2.2;
    for (let i = 0; i < 3; i++) {
      a.hearts.push({ x: -4 + i * 4, y: a.y - (a.kind === 'dog' ? 26 : 22) - i * 3, t: i * 0.2 });
    }
    SFX.tone(a.kind === 'dog' ? 320 : 620, 0.16, 'triangle', 0.06);
    setTimeout(() => SFX.tone(a.kind === 'dog' ? 380 : 720, 0.2, 'triangle', 0.05), 140);
    const d = META.load();
    d.pets = (d.pets || 0) + 1; META.save();
    G.petted = (G.petted || 0) + 1;
    STORY.karmaHit('pet');
    const line = a.kind === 'dog'
      ? U.pick(Math.random, [
        'HE PUTS HIS WHOLE HEAD IN YOUR HAND. HE DOES THIS TO EVERYBODY.',
        'THE DOG DOES NOT CARE WHOSE CASE IT IS. THE DOG IS PLEASED.',
        'SOMEBODY HAS BEEN FEEDING HIM DONUTS. IT WAS YOU.',
      ])
      : U.pick(Math.random, [
        'IT ALLOWS IT. FOR EIGHT SECONDS.',
        'THE CAT HAS BEEN IN THIS ROOM LONGER THAN THE BODY WAS.',
        'IT LEANS ON YOUR LEG AND LOOKS AT THE DOOR. IT KNOWS SOMETHING.',
      ]);
    await TUTOR.say(line, { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t, hold: 2400, top: true });
    /* a cat that likes you is worth exactly one hour of not feeling awful */
    if ((G.petted || 0) === 1) UI.stampSmall('THAT HELPED. SLIGHTLY.');
    if (d.pets === 12) {
      const dd = META.load(); dd.catFriend = 1; META.save();
      UI.stampSmall('EVERY ANIMAL IN THIS CITY KNOWS YOU');
    }
  },

  /* ============================================================
     THE EYEGLASS.

     Searching a prop costs eighteen minutes of a night that only
     has five hundred and sixty. The glass costs five and tells you
     whether it is worth it — most of the time. It is a hunch with a
     lens on it, not an oracle: a dry prop reads clean three times
     in four and lies to you the fourth.
     ============================================================ */
  glassRead(place, prop) {
    /* fixed per prop per night, so looking twice tells you the same thing */
    const h = U.hashSeed('look:' + G.seedStr + ':' + (G.day || 1) + ':' + place + ':' + prop);
    const clue = !!CITY.plantedAt(place, prop);
    if (clue) return { hot: true, sure: true };
    return { hot: (h % 100) < 25, sure: false };     // a quarter of them lie
  },

  async lookClose(hit, x, y) {
    if (CINE.busy || SCENE.busy()) return;
    const wx = hit ? hit.x : x;
    const wy = hit
      ? (hit.top === undefined ? SCENE.H - 40 : (hit.top + (hit.bot === undefined ? SCENE.H - 20 : hit.bot)) / 2)
      : y;
    const cv = SCENE.magnify(wx, wy, 22, 5);
    const label = hit ? (typeof hit.label === 'function' ? hit.label() : hit.label) : null;
    const lines = [];
    const place = G.place;
    const isProp = hit && place && CITY.propsAt(place).indexOf(hit.id) >= 0;

    if (hit && hit.look) lines.push(hit.look);

    /* ============================================================
       A SECRET IS WORTH SOMETHING.

       An easter egg costs nothing to walk past and cannot be found
       without the glass, so finding one has to pay: it is counted
       across every run you ever play, and the phone tells you what
       number it was.
       ============================================================ */
    if (hit && hit.egg) {
      G.eggsSeen = G.eggsSeen || {};
      if (!G.eggsSeen[hit.id]) {
        G.eggsSeen[hit.id] = 1;
        META.bump('eggsFound'); META.save();
        const n = META.stats().eggsFound || 1;
        if (typeof PHONE !== 'undefined' && PHONE.notify) {
          PHONE.notify({ app: 'notes', tone: 'good',
            head: 'FOUND SOMETHING NOBODY PUT THERE',
            body: 'NUMBER ' + n + '. THE GLASS EARNS ITS KEEP.' });
        }
      }
    }

    if (isProp) {
      CITY.spend('look');
      if (CITY.searched(place, hit.id)) {
        lines.push('YOU HAVE ALREADY BEEN THROUGH THIS ONE.');
      } else {
        const r = STORY.glassRead(place, hit.id);
        lines.push(r.hot
          ? 'SOMETHING IN THERE IS NOT DIRT. WORTH THE EIGHTEEN MINUTES.'
          : 'NOTHING IN THERE BUT WHAT YOU WOULD EXPECT.');
        (G.looked = G.looked || {})[place + ':' + hit.id] = r.hot ? 1 : -1;
      }
    } else if (!hit) {
      lines.push(U.pick(Math.random, [
        "WET BRICK AND SOMEBODY ELSE'S PAINT.",
        'THE ROOM, FIVE TIMES CLOSER. IT DOES NOT IMPROVE.',
        'DUST, IN LAYERS. NOBODY HAS CLEANED IN HERE SINCE THE WAR.',
      ]));
    }
    await CINE.glass({ cv, title: label || 'THROUGH THE GLASS', lines });
    if (UI.syncStory) UI.syncStory();
    if (CITY.nightOver()) await STORY.dawn();
  },

  /* ============================================================
     THE IRON, OUT IN A ROOM.

     Rats are vermin and the city pays a nickel a tail. A frog is a
     witness, and the game will let you do it anyway — once, and
     then nobody in that building will look at you again.
     ============================================================ */
  async shootRat(rat, x, y) {
    if (CINE.busy || SCENE.busy()) return;
    SCENE.killRat(rat);
    SFX.shot();
    FX.screen.flash(PIX.PAL.W, 0.22, 0.14);
    FX.screen.shake(6);
    G.ratsShot = (G.ratsShot || 0) + 1;
    STORY.karmaHit('rat');
    const pay = 5;
    G.chips += pay;
    UI.syncChips && UI.syncChips();
    UI.stampSmall('ONE LESS RAT. +' + pay);
    if (G.ratsShot === 10) {
      const d = META.load(); d.ratKing = 1; META.save();
      await TUTOR.say('TEN OF THEM. THE SANITATION DEPARTMENT SHOULD BE PAYING YOU.',
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t, hold: 2400, top: true });
    }
  },

  /* a shot at nothing: noise, and the street hears it */
  async shootWide(x, y) {
    if (CINE.busy || SCENE.busy()) return;
    SFX.shot();
    FX.screen.flash(PIX.PAL.W, 0.18, 0.16);
    FX.screen.shake(5);
    G.heat = (G.heat || 0) + 1;
    STORY.karmaHit('wide');
    await TUTOR.say(U.pick(Math.random, [
      "A HOLE IN SOMEBODY ELSE'S WALL. VERY GOOD, DETECTIVE.",
      'THAT WAS LOUD AND IT WAS NOTHING.',
      'YOU HAVE JUST TOLD THE WHOLE STREET WHERE YOU ARE.',
    ]), { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t, hold: 2000, top: true });
  },

  /* pointing it at somebody who has done nothing yet */
  async aimAt(o) {
    if (CINE.busy || SCENE.busy()) return;
    const isFrog = !!(o.key || o.def);
    if (!isFrog) {
      /* shooting the furniture. It is a way of searching, technically. */
      SFX.shot();
      FX.screen.flash(PIX.PAL.W, 0.18, 0.16);
      FX.screen.shake(5);
      G.heat = (G.heat || 0) + 1;
      await TUTOR.say('YOU SHOT A ' + ((typeof o.label === 'function' ? o.label() : o.label) || 'THING') +
        '. IT DID NOT CONFESS.',
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t, hold: 2200, top: true });
      return;
    }
    const art = o.key ? SPR.frogCustom(o.key, o.def) : null;
    const pick = await TUTOR.ask('YOU ARE POINTING A GUN AT A WITNESS.', [
      { label: 'PUT IT AWAY', note: 'HE DID NOT SEE IT' },
      { label: 'LEAN ON HIM', note: 'HE TALKS. HE ALSO REMEMBERS.' },
    ], { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t, art });
    if (pick !== 1) { TOOLS.set('hand'); return; }

    /* THREATENING A WITNESS WORKS. That is the problem with it. */
    G.heat = (G.heat || 0) + 2;
    STORY.karmaHit('lean');
    STORY.note('PULLED A GUN ON ' + ((typeof o.label === 'function' ? o.label() : o.label) || 'A WITNESS') + '.');
    const place = G.place;
    const clues = (G.case && G.case.clues) || [];
    const cl = clues.find(c2 => !c2.seen && c2.at === place) || clues.find(c2 => !c2.seen);
    if (cl) {
      cl.seen = true;
      cl.foundAt = place + ':leaned';
      await CINE.pickUp(cl, CASE.left(), 'TAKEN AT GUNPOINT');
    } else {
      await TUTOR.say('HE HAS NOTHING. HE IS JUST FRIGHTENED NOW.',
        { name: 'A WITNESS', nameCol: PIX.PAL.R, rim: PIX.PAL.r, art });
    }
    G.burned = G.burned || {};
    G.burned[place] = 1;
    UI.stampSmall(((CITY.PLACES[place] || {}).short || 'HERE') + ' IS CLOSED TO YOU');
    TOOLS.set('hand');
    if (CITY.nightOver()) await STORY.dawn();
  },

  /* ---------- putting your hand in something ---------- */
  async search(place, prop) {
    if (CINE.busy) return;
    /* the props that are jobs, not searches */
    if (prop === 'pour') return STORY.pourJob();
    if (prop === 'donuts') return STORY.donutJob();
    if (prop === 'juke') return STORY.juke();
    if (prop === 'kit') return STORY.dustJob();

    /* THE SHED HAS A NEW LOCK ON IT. Nobody puts a new lock on an empty
       shed, and nobody hands a detective a key. */
    if (place === 'docks' && prop === 'shed' && !(G.picked && G.picked.shed)) {
      const r = await JOBS.lock();
      CITY.spend('talk', 2);
      if (!r.open) {
        await TUTOR.say(r.hits ? r.hits + ' OF THE THREE. THE LAST ONE DROPPED BACK.'
          : 'THE PICK SLIPS. THAT LOCK IS NEWER THAN THE SHED.',
          { name: 'THE LOCK', nameCol: PIX.PAL.S, rim: PIX.PAL.s });
        return;
      }
      (G.picked = G.picked || {}).shed = 1;
      STORY.note('PICKED THE LOCK ON THE SHED AT THE PIER.');
      await TUTOR.say('THE SHACKLE COMES OFF IN YOUR HAND. NOW LOOK INSIDE.',
        { name: 'THE LOCK', nameCol: PIX.PAL.G, rim: PIX.PAL.g });
    }

    if (CITY.searched(place, prop)) {
      await TUTOR.say('YOU HAVE BEEN THROUGH THIS ONCE ALREADY.',
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t, hold: 1600, top: true });
      return;
    }
    const clue = CITY.plantedAt(place, prop);
    CITY.markSearched(place, prop);
    CITY.spend('search');
    SCENE.focus(SCENE.me.x);
    /* somebody asked you to look in exactly this thing */
    const errand = STORY.questWatch({ search: { place, prop } });
    try {
      if (clue) {
        clue.seen = true;
        clue.foundAt = place + ':' + prop;
        STORY.note('FOUND AT ' + CITY.PLACES[place].short + ': ' + clue.text);
        SFX.jackpot();
        await CINE.pickUp(clue, CASE.left(),
          'OUT OF THE ' + String(prop).toUpperCase() + ' AT ' + CITY.PLACES[place].short);
        if (CASE.left() === 1) {
          await TUTOR.say('ONE FACE LEFT. TAKE IT TO THE STATION AND SAY THE NAME.',
            { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
        }
      } else if (errand.length) {
        await TUTOR.say('NOT WHAT YOU CAME FOR, BUT IT IS WHAT HE ASKED FOR.',
          { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
      } else {
        await STORY.nothingIn(place, prop);
      }
    } finally { SCENE.unfocus(); }
    if (CITY.nightOver()) await STORY.dawn();
  },

  /* what a dry prop gives you: junk, a few notes, or the wrong attention */
  async nothingIn(place, prop) {
    const r = (G.rng || Math.random)();
    if (r < 0.18) {
      const cash = 8 + Math.floor((G.rng || Math.random)() * 14);
      G.chips += cash;
      SFX.chip && SFX.chip();
      await TUTOR.say('LOOSE NOTES. ' + cash + ' OF THEM. NOBODY IS COMING BACK FOR IT.',
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
    } else if (r < 0.3) {
      G.heat = Math.min(6, (G.heat || 0) + 1);
      await TUTOR.say('SOMEBODY WATCHED YOU DO THAT. THE STREET WILL KNOW BY MORNING.',
        { name: 'YOU', nameCol: PIX.PAL.R, rim: PIX.PAL.r });
    } else {
      await TUTOR.say(U.pick(G.rng || Math.random, CITY.NOTHING),
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t, hold: 2200, top: true });
    }
  },

  /* ---------- a witness ---------- */
  async askWitness(place, who) {
    if (CINE.busy) return;
    /* ============================================================
       HE WENT HOME.

       Every stop keeps hours, and the frog who knows something is
       only behind that counter between them. Turn up at half past
       five for the launderer and you are talking to a locked door,
       and that is the clock doing what a clock is for.
       ============================================================ */
    if (CITY.open && !CITY.open(place)) {
      const h = CITY.hours(place);
      await TUTOR.say((h && h.who ? h.who : 'WHOEVER WORKS HERE')
        + ' WENT HOME AT ' + STORY.hh(h ? h.shut : 0) + '.',
        { name: 'A LOCKED DOOR', nameCol: PIX.PAL.q, rim: PIX.PAL.t,
          hold: 2100, top: true });
      return;
    }
    /* HE KNOWS WHAT YOU DID. Opening a frog's parcel buys you the evidence
       inside it and costs you everything he was ever going to tell you. */
    if (G.burned && G.burned[place]) {
      await TUTOR.say('I KNOW WHAT YOU OPENED. GET OUT OF MY SHOP.',
        { name: 'A WITNESS', nameCol: PIX.PAL.R, rim: PIX.PAL.r, hold: 2100, top: true });
      return;
    }
    /* an errand outranks a question: he wants something first */
    const q = STORY.questAt(place);
    if (q && STORY.questState(q.id) !== 'paid') {
      const took = await STORY.offerQuest(place);
      if (took) return;
    }
    const c = G.case;
    if (!c) return;
    const open = (c.asks || []).map((a, i) => i).filter(i => CASE.canAsk(i));
    /* ============================================================
       WHOSE STORY IS SET IN THIS ROOM.

       Somebody on that wall told the captain he was standing right
       here this afternoon, and the frog behind this counter is the
       one who would know. That is a different question from any of
       the descriptions, and it goes at the top of the rack.
       ============================================================ */
    const stories = CASE.alibiAt(place);
    if (!open.length && !stories.length) {
      await TUTOR.say('HE HAS TOLD YOU EVERYTHING HE IS GOING TO.',
        { name: 'A WITNESS', nameCol: PIX.PAL.N, rim: PIX.PAL.n, hold: 1900, top: true });
      return;
    }
    if (!open.length || CASE.left() <= 1) {
      /* nothing left to ask about faces — but a story might still be
         standing here, and that is the whole rest of the job */
      if (!stories.length) {
        await TUTOR.say('HE HAS TOLD YOU EVERYTHING HE IS GOING TO.',
          { name: 'A WITNESS', nameCol: PIX.PAL.N, rim: PIX.PAL.n, hold: 1900, top: true });
        return;
      }
    }
    /* fog and hard rain cost him a detail: one fewer question on offer */
    const sky = CITY.sky();
    const show = (CASE.left() <= 1 ? [] : open)
      .slice(0, sky.wit < 0 ? Math.max(1, open.length - 1) : open.length);
    const art = SPR.frogCustom('wit:' + place, PLACE_WITNESS[place] || BARMAN_DEF);
    const replies = stories.map(o => ({
      label: 'WAS ' + o.s.name + ' IN HERE TODAY?',
      note: CASE.hasLever(o.i) ? 'YOU HAVE SOMETHING THAT SAYS OTHERWISE'
        : 'HIS STORY PUTS HIM HERE',
    })).concat(show.map(i => ({ label: c.asks[i].ask })));
    replies.push({ label: 'NOTHING. FORGET IT.', note: 'LEAVE HIM ALONE', dim: true });
    const pickIdx = await TUTOR.ask(
      sky.wit < 0 ? 'I WAS HERE. I DID NOT SEE MUCH IN THAT ' + sky.word + '.'
        : 'I WAS HERE ALL DAY. ASK ME SOMETHING.',
      replies, { name: 'A WITNESS', nameCol: PIX.PAL.N, rim: PIX.PAL.n, art });
    if (pickIdx < 0 || pickIdx >= stories.length + show.length) return;

    /* ---- the story questions come first in the rack ---- */
    if (pickIdx < stories.length) {
      const o = stories[pickIdx];
      const r = CASE.press(o.i);
      CITY.spend('talk', CASE_TUNING.alibiPressCost / (CITY.COST.talk || 6));
      await STORY.converse(who, async () => {
        if (!r) return;
        if (r.broken) {
          await TUTOR.say('HIM? NO. AND I WOULD KNOW.',
            { name: 'A WITNESS', nameCol: PIX.PAL.R, rim: PIX.PAL.r, art });
          if (r.why) {
            await TUTOR.say(r.why + ' — AND HE SAID HE WAS HERE.',
              { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
          }
          STORY.note(r.name + " CANNOT ACCOUNT FOR HIMSELF.");
          STORY.karmaHit && STORY.karmaHit('work');
          await CINE.contradiction(r.name);
        } else if (r.needs) {
          await TUTOR.say('HE WAS HERE. THAT IS WHAT I TOLD THE OTHER ONE.',
            { name: 'A WITNESS', nameCol: PIX.PAL.N, rim: PIX.PAL.n, art });
          await TUTOR.say('HE IS LYING AND I CANNOT PROVE IT YET.',
            { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
        } else {
          await TUTOR.say('HIM? YES. ALL AFTERNOON.',
            { name: 'A WITNESS', nameCol: PIX.PAL.N, rim: PIX.PAL.n, art });
          await TUTOR.say('THEN IT IS NOT HIM. ONE FEWER STORY TO CHECK.',
            { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
        }
      });
      if (CITY.nightOver()) await STORY.dawn();
      return;
    }

    const i = show[pickIdx - stories.length];
    const a = CASE.ask(i);
    CITY.spend('ask');
    if (!a) return;
    await STORY.converse(who, async () => {
      await TUTOR.say(a.reply, {
        name: 'A WITNESS', nameCol: PIX.PAL.N, rim: PIX.PAL.n,
        art: SPR.frogCustom('wit:' + place, PLACE_WITNESS[place] || BARMAN_DEF),
      });
      const n = CASE.left();
      await TUTOR.say(n > 1 ? n + ' OF THEM STILL FIT THAT.' : 'THAT IS ONE FACE. ONLY ONE.',
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
    });
    if (CITY.nightOver()) await STORY.dawn();
  },

  /* an hour, as somebody would say it */
  hh(m) {
    const h = Math.floor((m || 0) / 60) % 24, mm = (m || 0) % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  },

  async placeTalk(place, who) {
    const lines = PLACE_CHAT[place] || ['NOBODY HERE WANTS TO TALK TO A COP.'];
    CITY.spend('talk');
    await TUTOR.say(U.pick(G.rng || Math.random, lines),
      { name: 'A REGULAR', nameCol: PIX.PAL.d, rim: PIX.PAL.D });
  },

  /* ---------- the night runs out ---------- */
  async dawn() {
    if (G.dawnDone) return;
    G.dawnDone = true;
    await CINE.dawnCard();
    STORY.note('THE SHIFT ENDED WITH THE CASE OPEN.');
    SCENE.close();
    G.place = 'precinct';
    G.phase = 'precinct';
    G.clock = CITY.START;                 // nine in the morning, again
    G.dawnDone = false;
    G.weather = CITY.rollWeather();
    UI.render();
    await STORY.arrive('precinct');
    await TUTOR.say('YOU LOST THE DAY. THE CASE IS STILL OPEN AND SO IS THE DOOR.',
      { name: 'THE CAPTAIN', nameCol: PIX.PAL.S, rim: PIX.PAL.s });
  },

  /* ============================================================
     THE SIDE JOBS.

     Nobody in this city gets paid enough. The taps and the fryer
     both pay in money and in somebody deciding they like you,
     which is worth more than the money.
     ============================================================ */

  async pourJob() {
    if (G.jobsDone && G.jobsDone.pour) {
      await TUTOR.say('YOU HAVE DONE YOUR SHIFT. GO AND BE A DETECTIVE.',
        { name: 'THE BARMAN', nameCol: PIX.PAL.N, rim: PIX.PAL.n, hold: 2000, top: true });
      return;
    }
    const r = await JOBS.pour();
    (G.jobsDone = G.jobsDone || {}).pour = 1;
    CITY.spend('job');
    STORY.note('WORKED THE TAPS FOR ' + r.pay + '.');
    await TUTOR.say(r.hits === 3 ? 'THREE CLEAN ONES. ' + r.pay + ' AND I OWE YOU AN ANSWER.'
      : r.hits ? 'CLOSE ENOUGH. ' + r.pay + ' AND WIPE THE BAR.'
        : 'YOU WORE MOST OF THAT. NOTHING FOR YOU.',
      { name: 'THE BARMAN', nameCol: PIX.PAL.N, rim: PIX.PAL.n,
        art: SPR.frogCustom('wit:bar', BARMAN_DEF) });
    /* a good shift buys another question out of him */
    if (r.hits === 3 && G.case) {
      G.case.quiz = (G.case.quiz || 0) + 1;
      await TUTOR.say('ASK ME ONE MORE THING. GO ON.',
        { name: 'THE BARMAN', nameCol: PIX.PAL.N, rim: PIX.PAL.n });
    }
    if (CITY.nightOver()) await STORY.dawn();
  },

  async donutJob() {
    if (G.jobsDone && G.jobsDone.donuts) {
      await TUTOR.say('THE TRAY IS FULL. TAKE ONE AND SIT DOWN.',
        { name: 'THE COOK', nameCol: PIX.PAL.N, rim: PIX.PAL.n, hold: 2000, top: true });
      return;
    }
    const r = await JOBS.donuts();
    (G.jobsDone = G.jobsDone || {}).donuts = 1;
    CITY.spend('job');
    STORY.note('MADE A TRAY OF DONUTS FOR ' + r.pay + '.');
    /* eating on the job is the only medicine in this game */
    if (r.hits > 0 && G.hearts < 6) { G.hearts = Math.min(6, G.hearts + 1); SFX.heal && SFX.heal(); }
    await TUTOR.say(r.hits === 3 ? 'ALL THREE. ' + r.pay + ', AND EAT ONE BEFORE YOU FALL OVER.'
      : r.hits ? 'TWO GOOD ONES. ' + r.pay + '. EAT.'
        : 'YOU BURNED THE LOT. GET OUT OF MY KITCHEN.',
      { name: 'THE COOK', nameCol: PIX.PAL.N, rim: PIX.PAL.n,
        art: SPR.frogCustom('wit:cook', COOK_DEF) });
    /* and the cook tells you where there is still something to find */
    if (r.hits >= 2 && G.case) {
      const left = (G.case.clues || []).filter(cl => !cl.seen && cl.at);
      if (left.length) {
        const where = CITY.PLACES[left[0].at];
        G.tips = G.tips || {};
        G.tips[left[0].at] = 'THE COOK SAYS LOOK HERE';
        await TUTOR.say('MY BROTHER DRIVES A VAN. HE SAYS THERE IS SOMETHING AT ' +
          where.short + '.', { name: 'THE COOK', nameCol: PIX.PAL.N, rim: PIX.PAL.n });
      }
    }
    if (CITY.nightOver()) await STORY.dawn();
  },

  /* ============================================================
     THE LINE-UP, AT THE STATION, LAST.

     You do not name anybody in the field any more. You bring what
     you found back here, they stand them up behind the glass, and
     you say one name out loud.
     ============================================================ */

  async toLineup() {
    if (!G.case) { CASE.build(); }
    const c = G.case;
    if (!c) return;
    /* A BOSS IS NOT A MYSTERY. You have had his face on your own wall for
       six years — there is nobody to stand up next to him. They take you
       straight through to the back room instead. */
    if (c.known) {
      await TUTOR.say('NO LINE-UP FOR THIS ONE. YOU KNOW EXACTLY WHO HE IS.',
        { name: 'CAPTAIN ROOK', nameCol: PIX.PAL.S, rim: PIX.PAL.s });
      return STORY.sitDown();
    }
    if (c.done) return STORY.sitDown();
    if (!CITY.found().length && !(c.asks || []).some(a => a.asked)) {
      await TUTOR.say('YOU HAVE NOTHING ON ANY OF THEM. GO AND FIND SOMETHING.',
        { name: 'THE CAPTAIN', nameCol: PIX.PAL.S, rim: PIX.PAL.s });
      return;
    }
    CITY.spend('lineup');
    await UI.goto(() => { G.phase = 'blind'; });
    /* UI.goto is a no-op while a cinematic still owns the screen: if the
       wipe never ran, take the stairs without it rather than standing in
       the bullpen with nothing happening */
    if (G.phase !== 'blind') { G.phase = 'blind'; UI.render(); }
    await STORY.arrive('lineup');
  },

  /* say a name */
  async nameHim(i) {
    const c = G.case;
    if (!c || c.done) return;
    const s = c.suspects[i];
    const go = await CINE.pick({
      head: 'NUMBER ' + (i + 1) + '. ' + s.name,
      sub: CASE.standing()[i] ? 'EVERYTHING YOU FOUND STILL FITS HIM'
        : 'WHAT YOU FOUND SAYS THIS IS NOT HIM',
      items: [{ label: 'THAT IS HIM' }, { label: 'NOT YET' }],
    });
    if (go !== 0) return;
    const right = CASE.accuse(i);
    if (right) {
      STORY.note('NAMED ' + s.name + '. IT WAS HIM.');
      SFX.jackpot();
      await CINE.namedCard(s, true);
      await STORY.sitDown();
    } else {
      STORY.note('NAMED ' + s.name + '. IT WAS NOT HIM.');
      SFX.backfire && SFX.backfire();
      await CINE.namedCard(s, false);
      await TUTOR.say('HE WALKS OUT PAST YOU. THE ONE YOU WANT KNOWS YOUR FACE NOW.',
        { name: 'THE CAPTAIN', nameCol: PIX.PAL.S, rim: PIX.PAL.s });
      await STORY.sitDown();
    }
  },

  /* ================= what a body is worth ================= */

  /* THE CAPTAIN BEHIND THE GLASS. He will read the table back to you, he
     will count the faces, and he will not pick one for you. */
  async lineupTalk() {
    const cap = { art: SPR.frogCustom('handler', HANDLER_DEF), name: 'CAPTAIN ROOK', nameCol: PIX.PAL.S, rim: PIX.PAL.s };
    let line = CASE.left() > 1
      ? CASE.left() + ' OF THEM STILL FIT WHAT YOU BROUGHT ME.'
      : 'ONE. SAY IT AND I WILL HAVE HIM PUT IN THE BACK ROOM.';
    for (let turn = 0; turn < 5; turn++) {
      const got = CITY.found();
      const menu = [];
      if (got.length) menu.push({
        id: 'read', label: 'READ ME WHAT I BROUGHT BACK.', note: got.length + ' ON THE TABLE',
        run: async () => { await STORY.readFindings(); },
      });
      menu.push({
        id: 'count', label: 'WHO DOES IT STILL FIT?', run: async () => {
          const st = CASE.standing();
          const names = ((G.case && G.case.suspects) || [])
            .filter((s2, i) => st[i]).map(s2 => s2.name);
          await TUTOR.say(names.length > 1
            ? names.join(', ') + '. THAT IS WHO IS LEFT.'
            : (names[0] || 'NOBODY') + '. AND NOBODY ELSE.', cap);
        },
      });
      menu.push({
        id: 'sure', label: 'WHAT IF I AM NOT SURE?', run: async () => {
          await TUTOR.say('THEN DO NOT SAY A NAME. WALK BACK UP AND FIND ME ONE MORE THING.', cap);
          await TUTOR.say('THEY WILL STAND THERE. THEY HAVE NOWHERE TO BE EITHER.', cap);
        },
      });
      menu.push({ id: 'go', label: 'I AM READY.', dim: true, run: null });

      const pick = await TUTOR.ask(line, menu.map(m => ({ label: m.label, note: m.note, dim: m.dim })), cap);
      const m = menu[pick === undefined || pick < 0 ? menu.length - 1 : pick];
      if (!m || !m.run) break;
      await m.run();
      line = 'WELL?';
    }
  },

  async readFindings() {
    const got = CITY.found();
    if (!got.length) {
      await TUTOR.say('AN EMPTY TABLE. YOU HAVE NOT BROUGHT ME ANYTHING.',
        { name: 'THE TABLE', nameCol: PIX.PAL.q, rim: PIX.PAL.d, hold: 2200, top: true });
      return;
    }
    for (const cl of got) {
      await TUTOR.say(cl.text + '  (RULES OUT ' + cl.cut + ')',
        { name: 'WHAT YOU FOUND', nameCol: PIX.PAL.G, rim: PIX.PAL.g });
    }
  },

  async leaveLineup() {
    SCENE.close();
    await UI.goto(() => { G.phase = 'precinct'; });
    await STORY.arrive('precinct');
  },

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
