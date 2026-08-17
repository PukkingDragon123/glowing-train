'use strict';
/* ============================================================
   SHELL & DEBT — tutor.js
   THE HANDLER.

   Somebody has to tell you how this works, once, and then never
   again. He is not a tooltip: he is a frog in a bad coat who
   hands you the file, tells you the three things that will keep
   you alive, and leaves.

   Nothing here blocks the game. Every plate is dismissable, the
   whole thing can be skipped, and a step that has been read is
   marked in the save so a second run is silent.
   ============================================================ */

const HANDLER_DEF = {
  skin: ['B', 'b', 'u'], fat: false, suit: 'u', shirt: 'w', tie: 'd',
  costume: 'trench', hat: 'fedora', hatCol: 'u', band: 'K', cigar: true,
  scar: true,
};

/* whoever it is behind the bar that answers when you ask */
const BARMAN_DEF = {
  skin: ['N', 'n', 'n'], fat: true, suit: 'W', shirt: 'W', bowtie: 'K',
  costume: 'croupier', visor: true,
};

const TUTOR = {

  /* ---------------- the opening, before the first board ---------------- */

  OPENING: [
    'YOU CAME DOWN HERE FOR A NAME. I HAVE FIVE.',
    'THREE OF THEM WILL BE DRINKING IN THAT ROOM TONIGHT.',
    'ONE OF THEM IS THE ONE THAT WENT THROUGH YOUR DOOR.',
    'WORK THE BOARD. NAME HIM. SIT DOWN WITH HIM.',
    'AND WHATEVER YOU DO IN THERE, CLEAN UP AFTER IT.',
  ],

  /* ---------------- the three things that keep you alive ---------------- */

  STEPS: [
    { id: 'board1',
      when: () => G.phase === 'blind' && G.case && !G.case.known && !G.case.done &&
        !G.case.clues.some(c => c.seen) && G.case.looks > 0,
      line: 'TURN A CARD OVER. EVERY ONE OF THEM IS TRUE.' },
    { id: 'board2',
      when: () => G.phase === 'blind' && G.case && !G.case.known && !G.case.done &&
        G.case.clues.some(c => c.seen),
      line: 'THE STRING SHOWS WHO IT CROSSES OFF. ONE POSTER LEFT, SAY THE NAME.' },
    { id: 'board3',
      when: () => G.phase === 'blind' && G.case && G.case.done && G.case.right === false,
      line: 'WRONG FROG. HE HEARD YOU, AND NOW HE GOES FIRST.' },
    { id: 'duel1',
      when: () => G.phase === 'duel' && !DUEL.busy && !DUEL.aim &&
        G.duel && !G.duel.over && G.duel.turn === 'you',
      line: 'CLICK HIS FACE TO BRING IT UP. CLICK AGAIN AND IT GOES OFF.' },
    { id: 'duel2',
      when: () => G.phase === 'duel' && DUEL.aim === 'self' && !DUEL.busy,
      line: 'A BLANK IN YOUR OWN HEAD KEEPS THE TURN. THAT IS THE WHOLE GAME.' },
    { id: 'loot1',
      when: () => G.phase === 'loot' && G.loot && !G.loot.done && !DUEL.busy && E.canRifle(),
      line: 'POCKETS FIRST. THE CLOCK RUNS AND EVERY HAND YOU PUT IN HIM IS NOISE.' },
    { id: 'loot2',
      when: () => G.phase === 'loot' && G.loot && !G.loot.done && !DUEL.busy &&
        !E.canRifle() && E.messLeft() > MESS_TUNING.forgive,
      line: 'NOW THE FLOOR. LEAVE A TRAIL AND THEY FIND IT IN THE MORNING.' },
  ],

  on: false,           // is the handler live this run
  cur: null,           // the step showing right now
  _busy: false,

  seen(id) { return !!META.load().tutor[id]; },
  mark(id) { META.load().tutor[id] = true; META.save(); },

  /* the handler is only around while there is something he has not said */
  armed() {
    return TUTOR.on && TUTOR.STEPS.some(s => !TUTOR.seen(s.id));
  },

  /* ---------------- the plate ---------------- */

  root() {
    let r = document.getElementById('tutor-root');
    if (!r) {
      r = U.el('div');
      r.id = 'tutor-root';
      r.className = 'hidden';
      document.body.appendChild(r);
    }
    return r;
  },

  portrait(k) {
    return SPR.clone(SPR.frogCustom('handler', HANDLER_DEF), k);
  },

  /* ============================================================
     ONE PLATE, DRAWN.
     Frame, rivets, portrait well and every letter go onto a single
     canvas — no CSS box, no gradient, no border-radius. Used by
     the handler and by whoever is holding the gun.
     ============================================================ */
  plate(o) {
    const per = o.big ? 30 : 34;
    return SPR.speech({
      /* A line nobody is waiting on gets a smaller plate: at full size the
         portrait alone covered the board it was talking about. */
      maxW: o.small ? Math.min(window.innerWidth - 40, 560)
        : Math.min(window.innerWidth - 28, 1180),
      portrait: o.art,
      name: o.name,
      nameCol: o.nameCol,
      lines: SPR.fitLines(o.line, per),
      foot: o.foot,
      rim: o.rim,
    });
  },

  /* one line, with his face on it. Resolves when it is dismissed. */
  say(line, opts) {
    opts = opts || {};
    return new Promise(res => {
      const root = TUTOR.root();
      root.className = 'plate-on' + (opts.big ? ' big' : '') +
        (opts.hold ? ' pass' : '') + (opts.top ? ' top' : '');
      root.innerHTML = '';
      const holder = U.el('div', 'tut-plate');
      holder.appendChild(TUTOR.plate({
        art: opts.art || SPR.frogCustom('handler', HANDLER_DEF),
        name: opts.name || 'THE HANDLER',
        nameCol: opts.nameCol,
        rim: opts.rim,
        line,
        foot: opts.hold ? null : (opts.last ? 'GET TO WORK' : 'GO ON'),
        big: opts.big,
        small: !!opts.hold,
      }));
      root.appendChild(holder);
      requestAnimationFrame(() => holder.classList.add('in'));
      if (SFX[opts.snd || 'tick']) SFX[opts.snd || 'tick']();

      let closed = false;
      const done = () => {
        if (closed) return;
        closed = true;
        holder.classList.add('out');
        root.removeEventListener('pointerdown', done);
        window.removeEventListener('keydown', key);
        setTimeout(() => {
          if (root.firstChild === holder) { root.innerHTML = ''; root.className = 'hidden'; }
          res();
        }, 180);
      };
      const key = (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') done(); };
      if (opts.hold) {
        setTimeout(done, opts.hold);          // he is not waiting for you
      } else {
        root.addEventListener('pointerdown', done);
        window.addEventListener('keydown', key);
      }
    });
  },

  hide() {
    const r = document.getElementById('tutor-root');
    if (r) { r.innerHTML = ''; r.className = 'hidden'; }
    TUTOR.cur = null;
  },

  /* ---------------- the opening scene ---------------- */

  async open() {
    TUTOR.on = true;
    if (TUTOR.seen('opening')) return;
    TUTOR._busy = true;
    CINE.letterbox(true);
    for (let i = 0; i < TUTOR.OPENING.length; i++) {
      await TUTOR.say(TUTOR.OPENING[i], { big: true, last: i === TUTOR.OPENING.length - 1 });
    }
    CINE.letterbox(false);
    TUTOR.mark('opening');
    TUTOR._busy = false;
  },

  /* ---------------- the running check ---------------- */

  /* Called whenever a screen syncs. Finds the first thing he has not said
     that is true RIGHT NOW, says it, and marks it read. */
  async check() {
    if (!TUTOR.on || TUTOR._busy || CINE.busy) return;
    if (document.getElementById('tutor-root') &&
        !document.getElementById('tutor-root').classList.contains('hidden')) return;
    const step = TUTOR.STEPS.find(s => !TUTOR.seen(s.id) && s.when());
    if (!step) return;
    TUTOR._busy = true;
    TUTOR.cur = step.id;
    try {
      await TUTOR.say(step.line);
      TUTOR.mark(step.id);
    } finally {
      TUTOR.cur = null;
      TUTOR._busy = false;
    }
  },

  /* the player has heard enough */
  skipAll() {
    TUTOR.STEPS.forEach(s => TUTOR.mark(s.id));
    TUTOR.mark('opening');
    TUTOR.hide();
  },

  /* and the title screen can ask for it back */
  replay() {
    const d = META.load();
    d.tutor = {};
    META.save();
  },
};

/* ============================================================
   WHAT HE SAYS WHEN HE HAS THE GUN.

   The mark is silent while you are holding it — that is your
   half of the table. The moment the iron is in HIS hand he has
   something to say about it, and it goes up on the same drawn
   plate the handler uses, in his own colour, and it does not
   wait for you to click it.
   ============================================================ */

const TALK = {

  busy: false,
  _last: '',

  /* pick a line that has not just been said */
  pick(pool) {
    if (!pool || !pool.length) return null;
    for (let i = 0; i < 6; i++) {
      const l = U.pick(Math.random, pool);
      if (l !== TALK._last) { TALK._last = l; return l; }
    }
    return pool[0];
  },

  /* he has just picked the iron up */
  async takes() {
    if (TALK.busy || !G.duel || G.duel.over) return;
    const opp = G.duel.opp;
    const hurt = opp.hp <= Math.ceil(opp.maxHP / 3);
    const pool = opp.boss ? MARK_LINES.boss
      : hurt ? MARK_LINES.hurt
        : G.hearts <= 2 ? MARK_LINES.winning : MARK_LINES.takes;
    await TALK.line(TALK.pick(pool), 1250);
  },

  /* and after it goes off, one way or the other */
  async after(kind) {
    if (TALK.busy || !G.duel || G.duel.over) return;
    const pool = MARK_LINES[kind];
    if (!pool) return;
    await TALK.line(TALK.pick(pool), 1050);
  },

  async line(line, hold) {
    if (!line || TALK.busy) return;
    TALK.busy = true;
    try {
      const opp = G.duel.opp;
      await TUTOR.say(line, {
        art: SPR.frogCustom(DUEL.oppKey + ':talk', opp.def, 'smug'),
        name: opp.name,
        nameCol: opp.boss ? PIX.PAL.R : PIX.PAL.O,
        rim: opp.boss ? PIX.PAL.d : PIX.PAL.t,
        snd: 'cluck',
        hold: hold || 1100,
      });
    } finally {
      TALK.busy = false;
    }
  },
};
