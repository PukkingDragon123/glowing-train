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

/* ============================================================
   WHOSE FACE IS ON THE PLATE.

   A HUNDRED AND THIRTY-EIGHT LINES OF DIALOGUE IN THIS GAME AND
   NOT ONE OF THEM PASSED A PORTRAIT, so every one of them —
   including the twenty-five spoken as YOU — showed the captain.
   You have been having conversations with yourself wearing
   somebody else's face all game.

   Fixing that at the call sites means editing a hundred and
   thirty-eight of them and getting it wrong again next time a
   line is added, so it is resolved from the name instead. The
   name is already there, it is already right, and it is the one
   thing every caller passes.

   Anything that is not a person gets NO portrait: a lock, a
   print kit, a case log and the pavement do not have faces, and
   giving them one was half of why the plate looked wrong.
   ============================================================ */
const NOT_A_PERSON = [
  'THE FILE', 'THE PAPER', 'THE LOCK', 'THE PRINT KIT', 'THE CASE LOG',
  'YOUR CHART', 'YOUR IRON', 'YOUR BELT', 'THE PAVEMENT', 'WORK THE TAPS',
  'THE BOARD', 'THE PLAN', 'THE CLOCK', 'THE MACHINE', 'THE LEDGER',
];

/* name -> the def to build a head from. Missing names fall through to a
   frog seeded off the name itself, so an unnamed witness at least has
   the SAME face every time he speaks. */
const CAST = () => ({
  'THE CAPTAIN': typeof HANDLER_DEF !== 'undefined' ? HANDLER_DEF : null,
  'CAPTAIN ROOK': typeof HANDLER_DEF !== 'undefined' ? HANDLER_DEF : null,
  'OFFICER MAYBELLE': typeof MAYBELLE_DEF !== 'undefined' ? MAYBELLE_DEF : null,
  'THE BARMAN': typeof BARMAN_DEF !== 'undefined' ? BARMAN_DEF : null,
  'THE COOK': typeof COOK_DEF !== 'undefined' ? COOK_DEF : null,
  'THE NURSE': typeof NURSE_DEF !== 'undefined' ? NURSE_DEF : null,
  'THE LAUNDERER': typeof LAUNDER_DEF !== 'undefined' ? LAUNDER_DEF : null,
  'THE BROKER': typeof PAWN_DEF !== 'undefined' ? PAWN_DEF : null,
  'THE WAITRESS': typeof WAITRESS_DEF !== 'undefined' ? WAITRESS_DEF : null,
  'THE WATCHMAN': typeof WATCH_DEF !== 'undefined' ? WATCH_DEF : null,
  'DILL': typeof DILL_DEF !== 'undefined' ? DILL_DEF : null,
});

/* ============================================================
   THE ROOM ALREADY KNOWS WHO IS TALKING.

   CAST above is eleven hand-written names, and the game says lines
   as far more than eleven speakers. Anything not on the list fell
   through to the hash fallback and was handed one of nine spare
   civilian faces with its skin moved -- which is a fine face for a
   hawker nobody ever drew, and completely wrong for somebody
   standing on screen at the time. His wife says a line as CLEO and
   got a randomly tinted waitress; his son says one as TOBIAS and
   got a randomly tinted pawnbroker. Neither of their defs is even
   reachable from here: WIFE_DEF and BOY_DEF are consts inside the
   cutscene module.

   So ASK THE STAGE first. Every actor in a room carries its own
   def and the name it is labelled with, which is the same string
   the line is spoken under. Match on that and the portrait is the
   speaker by construction -- for the family, for every witness,
   and for anybody added later without touching this file.
   ============================================================ */
function stageArt(n) {
  if (typeof SCENE === 'undefined' || !SCENE.def) return null;
  for (const a of (SCENE.def.actors || [])) {
    if (!a || !a.def) continue;
    const names = [a.label, a.tag, a.name, a.id];
    for (const v of names) {
      if (v && String(v).toUpperCase() === n) {
        return SPR.frogCustom('stage:' + (a.key || a.id || n), a.def);
      }
    }
  }
  return null;
}

function speakerArt(name) {
  if (!name) return null;
  const n = String(name).toUpperCase();
  if (NOT_A_PERSON.indexOf(n) >= 0) return null;
  /* YOU is you. This is the one that was most wrong. */
  if (n === 'YOU' || n.indexOf('YOU') === 0) {
    const d = (typeof DUEL !== 'undefined' && DUEL.myDef) ? DUEL.myDef() : null;
    return d ? SPR.frogCustom('me', d) : null;
  }
  const onStage = stageArt(n);
  if (onStage) return onStage;
  const known = CAST()[n];
  if (known) return SPR.frogCustom('cast:' + n, known);
  /* ------------------------------------------------------------
     SOMEBODY THE GAME HAS NOT WRITTEN A FACE FOR.

     A witness at the laverie, a hawker under the Tower, the man at
     the fire. They need a face that is theirs, is the same face
     every time that name speaks, and — this is the part the first
     attempt got wrong — actually renders.

     Synthesising a def from a hash does not render: `hat` is a
     name and not a yes, `costume` is a name and not a flag, and
     half the combinations of glasses, lashes and braces came out
     as headgear floating over an empty collar. So nothing is
     synthesised. There are fifteen hand-drawn faces in this game
     that are known to work; an unwritten speaker is given one of
     them by the hash of his own name, with only the SKIN moved,
     which is three palette letters and cannot break a silhouette.
     ------------------------------------------------------------ */
  const spare = [];
  [typeof BARMAN_DEF !== 'undefined' && BARMAN_DEF,
    typeof COOK_DEF !== 'undefined' && COOK_DEF,
    typeof DILL_DEF !== 'undefined' && DILL_DEF,
    typeof DRUNK_DEF !== 'undefined' && DRUNK_DEF,
    typeof LAUNDER_DEF !== 'undefined' && LAUNDER_DEF,
    typeof NURSE_DEF !== 'undefined' && NURSE_DEF,
    typeof PAWN_DEF !== 'undefined' && PAWN_DEF,
    typeof WAITRESS_DEF !== 'undefined' && WAITRESS_DEF,
    typeof WATCH_DEF !== 'undefined' && WATCH_DEF].forEach(d => { if (d) spare.push(d); });
  /* NOT the casino cast. FROG_DEFS holds the old table players, and half
     of them have their faces covered on purpose — the blindfold frog is
     wearing a blindfold, the spinner has spirals for eyes. Pulled into a
     dialogue portrait they read as two cream domes and no face. The nine
     above are Paris civilians and all nine have faces. */
  if (!spare.length) return null;
  /* AND THE SKIN IS A RAMP, NOT THREE RANDOM LETTERS. A skin is a
     light-mid-dark triple and the three have to belong together; picking
     each one out of the whole palette independently gave several of them
     a bone-white head, which with a pale pair of glasses on it read as
     two cream domes and no face at all. These nine triples are lifted
     off frogs that already render. */
  const RAMPS = [
    ['F', 'f', 'e'], ['N', 'n', 'n'], ['G', 'g', 'h'], ['P', 'p', 'p'],
    ['e', 'e', 'K'], ['f', 'e', 'E'], ['B', 'b', 'u'], ['S', 's', 't'],
    ['L', 'l', 'l'],
  ];
  const seed = U.hashSeed('speaker:' + n);
  /* two independent draws, or nine names land on two faces */
  const base = spare[(seed * 2654435761 >>> 8) % spare.length];
  const skin = RAMPS[(seed * 40503 >>> 3) % RAMPS.length];
  return SPR.frogCustom('speaker:' + n, Object.assign({}, base, { skin }));
}

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
     ONE BALLOON, DRAWN.

     It used to be a case file: a sheet of manila with the
     speaker's photograph clipped into the margin and his words
     typed underneath. Good object, wrong one -- a case file is
     something you READ, and this is somebody TALKING.

     So it is a balloon now (see TOON.bubble): heavy ink, bone
     fill, a cel shadow under it, his name on a tab tacked to the
     top edge, and a tail coming down out of it onto his own head,
     cut out and stood in the corner. It picks its own shape off
     the line's punctuation, so a question comes up spoken, a
     line that trails off comes up as a thought with its little
     chain of dots, and the two lines in this game that end in a
     bang come up with the spikes on.
     ============================================================ */
  plate(o) {
    /* CHARACTERS TO A LINE is what actually sets the width -- the balloon
       is as wide as its widest line. Twenty-six is about a column of
       newsprint. It comes DOWN on a narrow screen rather than letting the
       blow-up drop, because a five-pixel capital is not a letter. */
    const narrow = window.innerWidth < 620;
    const per = o.big ? (narrow ? 22 : 30) : (narrow ? 19 : 26);
    /* ============================================================
       A NOTE, NOT A BANNER.

       Everything in here is drawn at one pixel per pixel and blown
       up by an integer at the end, and the blow-up is PINNED rather
       than taken off the window: sized off the monitor it came to
       789 by 219 on a desktop, which is sixty-two per cent of the
       width, in the middle of the frame, over the person speaking.
       Two, in the corner, small type, read close.
       ============================================================ */
    const K = o.big ? 3 : 2;
    return TOON.bubble({
      k: K,
      /* the overflow guard, not the size: whatever the frame can actually
         hold, so a pinned two drops to one on a phone too narrow for it
         rather than running off the edge */
      maxW: window.innerWidth - 24,
      portrait: o.art,
      name: o.name,
      nameCol: o.nameCol,
      rim: o.rim,
      kind: o.kind,
      /* THE LINE IS MEASURED WHOLE AND PAINTED IN PART. The balloon comes
         up the size it will END at and fills in, so the box never grows
         under the reader -- and the last letters to land sit a pixel high,
         which is the difference between text appearing and a frog saying
         something. */
      lines: SPR.fitLines(o.line, per),
      reveal: o.reveal,
      hop: o.hop,
      foot: o.reveal !== undefined && o.reveal !== null &&
        o.reveal < o.line.length ? null : o.foot,
    });
  },

  /* ============================================================
     AND WHAT POPS WHEN THE LINE LANDS.

     A cartoon says what somebody is feeling with a shape over
     their head, and it has been doing it since Winsor McCay: a
     bang for surprise, a query for a question, a little chain of
     dots for a thought. It goes over the SPEAKER, wherever he is
     actually standing in the room -- the balloon is in the corner
     and he is not -- and falls back to the corner of the balloon
     for a line said by somebody who is not on stage.
     ============================================================ */
  punch(line, opts, holder) {
    if (typeof TOON === 'undefined') return;
    opts = opts || {};
    /* ------------------------------------------------------------
       A SHOUT MOVES THE CAMERA. A TAUNT DOES NOT.

       The mark asks for the spiky balloon on every line he says with
       the iron in his hand, and he says two or three a duel across
       twenty-odd duels a run -- shaking the frame for all of them is
       a tic, not an effect. The frame moves for a line that is
       actually SHOUTED, which in this whole script is two of them.
       ------------------------------------------------------------ */
    if (/!/.test(String(line)) && typeof UI !== 'undefined' && UI.shake) UI.shake();
    const m = TOON.markOf(line);
    if (!m) return;
    const w = (typeof SCENE !== 'undefined' && SCENE.headOf) ? SCENE.headOf(opts.name) : null;
    if (w) { TOON.markWorld(w.x + 9, w.y - 3, m, { k: 2 }); return; }
    const cv = holder && holder.querySelector('canvas');
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const at = cv.markAt || { x: r.width - 20, y: 8 };
    TOON.mark(r.left + at.x, r.top + at.y, m, { k: 2 });
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

  /* the left column only: what he is saying sits on top of it */
  mumble(on) {
    if (document.body) document.body.classList.toggle('mumbling', !!on);
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
      /* ============================================================
         A MUTTERED LINE LANDS ON THE OBJECTIVE CARD.

         The plate lives in the bottom-left corner now, which is where
         the objective card and the tool belt already are. A line you
         have to answer hushes the whole HUD out of the way. A line
         nobody is waiting on must not -- the clock, the money and the
         slips are half the point of it -- so it fades only the left
         column and leaves the right stack alone.
         ============================================================ */
      else TUTOR.mumble(true);
      root.innerHTML = '';
      /* WHAT SHAPE THIS LINE IS. Off its own punctuation, once, before
         anything is drawn -- the class is what CSS reads to decide whether
         the balloon arrives or arrives and then rattles. */
      const kind = TOON.kindOf(line, opts);
      const holder = U.el('div', 'tut-plate ' + kind);
      /* A LOCK HAS NO FACE. speakerArt returns null for the things that
         are not people, and falling through to the handler put the
         captain's photograph on the print kit and the case log. */
      const base = opts.art || speakerArt(opts.name)
        || (opts.name ? null : SPR.frogCustom('handler', HANDLER_DEF));
      const build = (reveal) => {
        holder.innerHTML = '';
        /* HIS MOUTH MOVES WHILE HE IS TALKING. Three characters a flap,
           which at this type speed is about eighty milliseconds — a frog
           saying something rather than a photograph with words beside it.
           And he takes a pixel of hop on the same beat, because a head
           that flaps its mouth and never moves is a puppet. */
        const flap = reveal !== null && reveal !== undefined &&
          Math.floor(reveal / 6) % 2 === 0;
        const art = reveal === null || reveal === undefined ? base
          : SPR.portraitTalk(base, flap);
        holder.appendChild(TUTOR.plate({
          art,
          name: opts.name || 'THE CAPTAIN',
          nameCol: opts.nameCol,
          rim: opts.rim,
          kind,
          hop: flap,
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
        TUTOR.punch(line, opts, holder);
      };
      TUTOR.finishTyping = finishTyping;
      typing = setInterval(() => {
        typed += 3;
        if (typed >= line.length) { finishTyping(); return; }
        build(typed);
        if (typed % 9 === 0) SFX.tone(1400 + Math.random() * 500, 0.012, 'square', 0.028);
      }, 22);

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
            if (hushed) TUTOR.hush(false); else TUTOR.mumble(false);
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
      const kind = TOON.kindOf(line, opts);
      const holder = U.el('div', 'tut-plate ' + kind);
      const rack = U.el('div', 'reply-rack');

      /* A LOCK HAS NO FACE. speakerArt returns null for the things that
         are not people, and falling through to the handler put the
         captain's photograph on the print kit and the case log. */
      const base = opts.art || speakerArt(opts.name)
        || (opts.name ? null : SPR.frogCustom('handler', HANDLER_DEF));
      const build = (reveal) => {
        holder.innerHTML = '';
        const flap = reveal !== null && reveal !== undefined &&
          Math.floor(reveal / 6) % 2 === 0;
        const art = reveal === null || reveal === undefined ? base
          : SPR.portraitTalk(base, flap);
        holder.appendChild(TUTOR.plate({
          art,
          name: opts.name || 'THE CAPTAIN',
          nameCol: opts.nameCol,
          rim: opts.rim,
          kind,
          hop: flap,
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
          /* THE LABEL, IN TEXT, ON THE BUTTON. Every word in this rack is
             rendered as a canvas of pixels, so the button carries no text
             at all -- which is fine for a player and useless to a screen
             reader or to a test that wants to answer a PARTICULAR
             question rather than whichever one happens to be on top. */
          const lbl = (typeof r === 'string' ? r : r.label) || '';
          b.dataset.label = lbl;
          b.setAttribute('aria-label', lbl + (r.note ? ' - ' + r.note : ''));
          /* THE NUMBER, NOT A CHEVRON. The number keys already worked and
             nothing said so; now the key is printed on the thing it
             presses, which is the only honest place for it. */
          const num = U.el('span', 'reply-num');
          /* INK ON BUFF STOCK. Bone-white letters with a black drop shadow
             are for a lit screen; these are cards, so the words are typed
             in the same ink as the sheet they answer. */
          num.appendChild(PIXFONT.render(String(i + 1), { scale: k, color: '#8a2418', shadow: null }));
          b.appendChild(num);
          const col = U.el('span', 'reply-col');
          UI.wrapLines(typeof r === 'string' ? r : r.label, 38).forEach(t => {
            col.appendChild(PIXFONT.render(t, { scale: k, color: '#22201c', shadow: null }));
          });
          if (r.note) col.appendChild(PIXFONT.render(r.note, { scale: Math.max(1, k - 2), color: '#6b6454', shadow: null }));
          b.appendChild(col);
          b.onclick = () => finish(i);
          /* a mouse gets the same feedback a thumb does */
          b.onmouseenter = () => { SFX.tone(1100, 0.02, 'square', 0.02); };
          rack.appendChild(b);
        });
        requestAnimationFrame(() => rack.classList.add('in'));
      };

      const finishTyping = () => {
        if (typing) { clearInterval(typing); typing = null; }
        TUTOR.typing = false;
        typed = line.length;
        build(null);
        TUTOR.punch(line, opts, holder);
        showReplies();
      };
      TUTOR.typing = true;
      /* torn down from outside: nobody answered, so it resolves as the
         way out rather than hanging the conversation for good */
      TUTOR._close = () => finish(-1);
      TUTOR.finishTyping = finishTyping;
      typing = setInterval(() => {
        typed += 3;
        if (typed >= line.length) { finishTyping(); return; }
        build(typed);
        if (typed % 9 === 0) SFX.tone(1400 + Math.random() * 500, 0.012, 'square', 0.028);
      }, 20);

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
    TUTOR.mumble(false);
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
  /* which face the plate would put on a line by this speaker -- so a probe
     can compare it with the actor's own head instead of squinting at it */
  debugSpeakerArt(name) { return speakerArt(name); },
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
      /* FOUR LINES ON A FOREHEAD. He is not making conversation across
         that table, and the oldest drawing for that goes over his head
         while he says it -- but only when he has a reason. A vein on
         every taunt of every duel is wallpaper; a vein from a lieutenant,
         or from anybody at all once you are down to your last two, is
         somebody enjoying himself. */
      const needled = opp.boss || (G.hearts || 6) <= 2;
      if (needled && typeof TOON !== 'undefined' && typeof DUEL !== 'undefined' && DUEL.screenXY) {
        const sp = DUEL.screenXY(180, 40);
        if (sp) TOON.mark(sp.x, sp.y, 'vein',
          { k: Math.max(2, Math.round(sp.k * 1.1)), life: 820, vy: -0.12 });
      }
      await TUTOR.say(line, {
        art: SPR.frogCustom(DUEL.oppKey + ':talk', opp.def, 'smug'),
        name: opp.name,
        nameCol: opp.boss ? PIX.PAL.R : PIX.PAL.O,
        rim: opp.boss ? PIX.PAL.d : PIX.PAL.t,
        snd: 'cluck',
        /* HE IS NOT MAKING CONVERSATION. The mark talks with the iron in
           his hand, across a table, in a cellar -- every line of it is
           shouted, and none of it ends in a bang, so the shape has to be
           asked for rather than read off the punctuation. */
        kind: 'shout',
        hold: hold || 1100,
      });
    } finally {
      TALK.busy = false;
    }
  },
};
