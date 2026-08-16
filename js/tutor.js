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

  /* one line, with his face on it. Resolves when it is dismissed. */
  say(line, opts) {
    opts = opts || {};
    return new Promise(res => {
      const root = TUTOR.root();
      root.className = 'plate-on' + (opts.big ? ' big' : '');
      root.innerHTML = '';
      const plate = U.el('div', 'tut-plate');
      const face = U.el('div', 'tut-face');
      face.appendChild(TUTOR.portrait(opts.big ? 4 : 3));
      plate.appendChild(face);
      const body = U.el('div', 'tut-body');
      body.appendChild(UI.txt('THE HANDLER', { scale: 2, color: PIX.PAL.G }));
      body.appendChild(UI.wrap(line, opts.big ? 34 : 40, { scale: 3, color: PIX.PAL.W, outline: PIX.PAL.K }));
      plate.appendChild(body);
      const go = U.el('div', 'tut-go');
      go.appendChild(UI.txt(opts.last ? 'GET TO WORK' : 'GO ON', { scale: 2, color: PIX.PAL.q }));
      plate.appendChild(go);
      root.appendChild(plate);
      requestAnimationFrame(() => plate.classList.add('in'));
      SFX.tick();

      const done = () => {
        plate.classList.add('out');
        root.removeEventListener('pointerdown', done);
        window.removeEventListener('keydown', key);
        setTimeout(() => {
          if (root.firstChild === plate) { root.innerHTML = ''; root.className = 'hidden'; }
          res();
        }, 180);
      };
      const key = (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') done(); };
      root.addEventListener('pointerdown', done);
      window.addEventListener('keydown', key);
      opts.hold ? setTimeout(done, opts.hold) : 0;
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
