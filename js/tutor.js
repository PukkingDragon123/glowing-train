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

const TUTOR = {

  /* ---------------- the opening, before the first board ---------------- */

  OPENING: [
    'SIX YEARS I PUT INTO THAT FAMILY, DETECTIVE. THE COURTS HANDED THEM BACK EVERY TIME.',
    'AFTER WHAT THEY DID TO YOUR HOUSE, NOBODY HERE IS GOING TO ASK HOW YOU CLOSE A CASE.',
    'WORK THE FILE. PICK HIM OUT OF THE LINE. BE SURE.',
    'BE SURE. THE WRONG NAME AND THE RIGHT FROG HEARS YOU COMING.',
    'AND CLEAN UP AFTER YOURSELF. IF I HAVE TO SEE IT, I HAVE TO REPORT IT.',
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
  /* THE LINES, WRAPPED ONCE.
     Typing a line on has to leave the plate exactly the size it will end
     up, or the box grows under the reader's eye. So the wrap is computed
     from the whole line and the unsaid half is blanked out — same line
     count, same width, one letter arriving at a time. */
  reveal(lines, n) {
    if (n === null || n === undefined) return lines;
    let left = n;
    return lines.map(l => {
      if (left >= l.length) { left -= l.length; return l; }
      const cut = Math.max(0, left);
      left = 0;
      return l.slice(0, cut) + ' '.repeat(l.length - cut);
    });
  },

  plate(o) {
    const per = o.big ? 30 : (o.asking ? 30 : 34);
    return SPR.speech({
      /* A line nobody is waiting on gets a smaller plate: at full size the
         portrait alone covered the board it was talking about. A line you
         have to answer gets a middling one, so the replies under it are
         not a mile wide. */
      maxW: o.small ? Math.min(window.innerWidth - 40, 560)
        : o.asking ? Math.min(window.innerWidth - 40, 860)
          : Math.min(window.innerWidth - 28, 1180),
      portrait: o.art,
      name: o.name,
      nameCol: o.nameCol,
      lines: TUTOR.reveal(SPR.fitLines(o.line, per), o.reveal),
      foot: o.reveal !== undefined && o.reveal !== null &&
        o.reveal < o.line.length ? null : o.foot,
      rim: o.rim,
    });
  },

  /* ------------------------------------------------------------
     WHILE SOMEBODY IS TALKING, THE CORNERS GET OUT OF THE WAY.

     The reply rack lands exactly where the objective plate lives,
     and a conversation is a scene, not a HUD: the plate and the
     phone fade down for the length of it and come back after.
     ------------------------------------------------------------ */
  hush(on) {
    if (document.body) document.body.classList.toggle('talking', !!on);
  },

  /* one line, with his face on it. Resolves when it is dismissed. */
  say(line, opts) {
    opts = opts || {};
    return new Promise(res => {
      const root = TUTOR.root();
      root.className = 'plate-on' + (opts.big ? ' big' : '') +
        (opts.hold ? ' pass' : '') + (opts.top ? ' top' : '');
      /* a plate nobody is waiting on does not own the frame, so it does not
         push the corners out of the way either */
      const hushed = !opts.hold;
      if (hushed) TUTOR.hush(true);
      root.innerHTML = '';
      const holder = U.el('div', 'tut-plate');
      const build = (reveal) => {
        holder.innerHTML = '';
        holder.appendChild(TUTOR.plate({
          art: opts.art || SPR.frogCustom('handler', HANDLER_DEF),
          name: opts.name || 'THE CAPTAIN',
          nameCol: opts.nameCol,
          rim: opts.rim,
          line,
          reveal,
          foot: opts.hold ? null : (opts.last ? 'GET TO WORK' : 'GO ON'),
          big: opts.big,
          small: !!opts.hold,
        }));
      };
      build(0);
      root.appendChild(holder);
      requestAnimationFrame(() => holder.classList.add('in'));
      if (SFX[opts.snd || 'tick']) SFX[opts.snd || 'tick']();

      /* the line arrives a couple of letters at a time, with a key under it */
      TUTOR.typing = true;
      let typed = 0, typing = null;
      const finishTyping = () => {
        if (typing) { clearInterval(typing); typing = null; }
        TUTOR.typing = false;
        typed = line.length;
        build(null);
      };
      TUTOR.finishTyping = finishTyping;
      typing = setInterval(() => {
        typed += 2;
        if (typed >= line.length) { finishTyping(); return; }
        build(typed);
        if (typed % 6 === 0) SFX.tone(1400 + Math.random() * 500, 0.012, 'square', 0.028);
      }, 26);

      let closed = false;
      const done = () => {
        /* the first tap finishes the line, the second dismisses it */
        if (typing) { finishTyping(); return; }
        if (closed) return;
        closed = true;
        TUTOR._close = null;
        holder.classList.add('out');
        root.removeEventListener('pointerdown', done);
        window.removeEventListener('keydown', key);
        setTimeout(() => {
          if (root.firstChild === holder) {
            root.innerHTML = ''; root.className = 'hidden';
            if (hushed) TUTOR.hush(false);
          }
          res();
        }, 180);
      };
      const key = (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') done(); };
      /* SOMETHING ELSE MAY TAKE THE SCREEN — a scene change, a death, a
         cinematic. If the plate is torn down from outside, the promise still
         has to settle or every await behind it waits for a tap forever. */
      TUTOR._close = () => { if (typing) finishTyping(); done(); };
      if (opts.hold) {
        setTimeout(() => { finishTyping(); done(); }, opts.hold);
      } else {
        root.addEventListener('pointerdown', done);
        window.addEventListener('keydown', key);
      }
    });
  },

  /* ============================================================
     AND WHAT YOU SAY BACK.

     Same plate, but the foot is a rack of things you can actually
     say. The line types itself on first; the replies arrive after
     it, big enough to hit, and the promise resolves with the index
     of the one you picked. Cancel is not an option in a
     conversation — one of them is always "leave it".
     ============================================================ */
  ask(line, replies, opts) {
    opts = opts || {};
    return new Promise(res => {
      const root = TUTOR.root();
      root.className = 'plate-on asking' + (opts.big ? ' big' : '');
      TUTOR.hush(true);
      root.innerHTML = '';
      const holder = U.el('div', 'tut-plate');
      const rack = U.el('div', 'reply-rack');

      const build = (reveal) => {
        holder.innerHTML = '';
        holder.appendChild(TUTOR.plate({
          art: opts.art || SPR.frogCustom('handler', HANDLER_DEF),
          name: opts.name || 'THE CAPTAIN',
          nameCol: opts.nameCol,
          rim: opts.rim,
          line,
          reveal,
          foot: null,
          asking: true,
        }));
      };
      build(0);
      root.appendChild(holder);
      root.appendChild(rack);
      requestAnimationFrame(() => holder.classList.add('in'));
      if (SFX[opts.snd || 'tick']) SFX[opts.snd || 'tick']();

      let typed = 0, typing = null, done = false;
      const k = window.innerWidth < 560 ? 2 : 3;

      const showReplies = () => {
        rack.innerHTML = '';
        replies.forEach((r, i) => {
          const b = U.el('button', 'reply-btn' + (r.dim ? ' dim' : ''));
          b.appendChild(PIXFONT.render('>', { scale: k, color: PIX.PAL.G, shadow: PIX.PAL.K }));
          const col = U.el('span', 'reply-col');
          UI.wrapLines(typeof r === 'string' ? r : r.label, 38).forEach(t => {
            col.appendChild(PIXFONT.render(t, { scale: k, color: PIX.PAL.W, shadow: PIX.PAL.K }));
          });
          if (r.note) col.appendChild(PIXFONT.render(r.note, { scale: Math.max(1, k - 2), color: PIX.PAL.q, shadow: null }));
          b.appendChild(col);
          b.onclick = () => finish(i);
          rack.appendChild(b);
        });
        requestAnimationFrame(() => rack.classList.add('in'));
      };

      const finishTyping = () => {
        if (typing) { clearInterval(typing); typing = null; }
        TUTOR.typing = false;
        typed = line.length;
        build(null);
        showReplies();
      };
      TUTOR.typing = true;
      /* torn down from outside: nobody answered, so it resolves as the
         way out rather than hanging the conversation for good */
      TUTOR._close = () => finish(-1);
      TUTOR.finishTyping = finishTyping;
      typing = setInterval(() => {
        typed += 2;
        if (typed >= line.length) { finishTyping(); return; }
        build(typed);
        if (typed % 6 === 0) SFX.tone(1400 + Math.random() * 500, 0.012, 'square', 0.028);
      }, 24);

      const finish = (i) => {
        if (done) return;
        done = true;
        if (typing) { clearInterval(typing); typing = null; }
        TUTOR.typing = false;
        TUTOR._close = null;
        SFX.chak && SFX.chak();
        holder.classList.add('out');
        rack.classList.remove('in');
        root.removeEventListener('pointerdown', skip);
        window.removeEventListener('keydown', key);
        setTimeout(() => {
          if (root.firstChild === holder) { root.innerHTML = ''; root.className = 'hidden'; TUTOR.hush(false); }
          res(i);
        }, 170);
      };
      /* a tap while it is still typing just gets to the end of the line */
      const skip = (e) => {
        if (e.target && e.target.closest && e.target.closest('.reply-btn')) return;
        if (typing) finishTyping();
      };
      const key = (e) => {
        if (typing && (e.key === ' ' || e.key === 'Enter')) { finishTyping(); return; }
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= replies.length) finish(n - 1);
      };
      root.addEventListener('pointerdown', skip);
      window.addEventListener('keydown', key);
    });
  },

  hide() {
    const close = TUTOR._close;
    TUTOR._close = null;
    if (close) close();                 // settle the promise before the DOM goes
    const r = document.getElementById('tutor-root');
    if (r) { r.innerHTML = ''; r.className = 'hidden'; }
    TUTOR.hush(false);
    TUTOR.typing = false;
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
      /* A HINT IS NOT A CONVERSATION. These arrive while a clock is running
         or while you are stood in a room with things to click, so they say
         their piece over the top of the frame and get out of the way on
         their own — a modal plate over the back room used to cover the
         bribe, the mop and the way out while the noise meter climbed. */
      await TUTOR.say(step.line, { hold: step.hold || 3600, top: true });
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
