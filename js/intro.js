/* ============================================================
   SHELL & DEBT — intro.js
   THE APPLICATION.

   HOW YOU GOT HERE used to live in this file as eight painted
   cards, 220 by 124, held up one at a time with a caption typed
   underneath. That is now js/cut.js, and it is not cards any
   more: it is the house, the security hall and the aircraft
   built as ROOMS and played through the same SCENE runtime the
   rest of the game runs on, with the camera panning across them
   and the same rig walking through them. Slides do not belong in
   front of a game that looks like that.

   What is left here is the part that was never a picture: the
   Brigade will not hand a case to a foreign cop with a cigarette
   end and a grudge, so before you get a card you sit an exam.

     THE PAPER      four questions about how this game is played,
                    answered out loud, with the captain reading
                    your answers back to you across his desk.
     THE RANGE      six shots. Four of them have to land.

   The office is a room too — CUT.office() — so the captain is
   actually in it, behind the desk, with Paris out of the window
   at four in the morning and your form on his blotter.
   ============================================================ */

const INTRO = (() => {

  /* THE OPENING IS A SEQUENCE OF ROOMS NOW. This stays as the name
     the rest of the game calls it by. */
  function play() { return CUT.play(); }
  function skip() { CUT.skip(); skipped_ = true; }
  let skipped_ = false;

  /* ============================================================
     THE EXAM.

     Four questions, and they are all questions about how this
     game is actually played, so a player who reads the captain's
     answers back has been taught the loop by somebody who talks
     like a cop instead of by a tooltip. The range is the same
     steady-hand meter every other trade in this game uses,
     because it is the same hand.
     ============================================================ */

  const PAPER = [
    {
      q: 'A WITNESS PUTS YOUR SUSPECT SOMEWHERE ELSE. YOU HAVE NOTHING TO SAY OTHERWISE. WHAT IS THE STORY?',
      a: ['UNBROKEN. IT STANDS UNTIL I CAN BREAK IT.',
          'BROKEN. HE IS OBVIOUSLY LYING.',
          'IRRELEVANT. I NAME HIM ANYWAY.'],
      right: 0,
      why: 'A STORY YOU CANNOT BREAK IS A STORY THAT HOLDS. WRITE THAT DOWN.',
    },
    {
      q: 'IT IS HALF PAST FOUR. THE LAUNDERER SHUTS AT FIVE AND THE PAWN AT SIX. WHERE DO YOU GO?',
      a: ['THE PAWN. IT IS CLOSER.',
          'THE LAUNDERER. HE SHUTS FIRST.',
          'NEITHER. I SEARCH THE STREET.'],
      right: 1,
      why: 'YOU WORK A CITY IN THE ORDER IT CLOSES. NOT THE ORDER IT IS DRAWN IN.',
    },
    {
      q: 'TWENTY-FIVE THINGS TO TURN OVER AND SIX HUNDRED MINUTES. HOW DO YOU SPEND THEM?',
      a: ['TURN OVER EVERYTHING IN ORDER.',
          'GUESS, AND TURN OVER THE GUESSES.',
          'LOOK AT EVERYTHING FIRST. TURN OVER WHAT LOOKS BACK.'],
      right: 2,
      why: 'THREE MINUTES WITH A GLASS SAVES EIGHTEEN WITH YOUR HANDS. THAT IS THE JOB.',
    },
    {
      q: 'YOU NAME THE WRONG FROG IN A LINE-UP. WHAT HAVE YOU DONE?',
      a: ['NOTHING. I TRY AGAIN.',
          'TOLD THE ONE I WANT THAT I AM COMING.',
          'WASTED TWENTY MINUTES.'],
      right: 1,
      why: 'A ROOM FULL OF PEOPLE HEARD YOU. INCLUDING HIM.',
    },
  ];

  async function application() {
    /* SKIPPED THE OPENING? Then you skipped the exam with it, and the
       captain signs you off in the middle of the range: a conditional
       pass, which is exactly what a man who walked in off a plane gets. */
    if (skipped_ || CUT.wasSkipped()) {
      G.paperScore = 2; G.rangeScore = 4; G.badge = true; G.applied = true;
      if (G.introClean === undefined) G.introClean = true;
      CUT.unstage();
      CUT.black(false);
      CINE.letterbox(false);
      return CINE.titleBeat('BRIGADE CRIMINELLE', 'CONDITIONAL. DO NOT MAKE ME REGRET IT.',
        PIX.PAL.g);
    }
    /* ---- THE PAPER ---- */
    CINE.letterbox(true);
    /* the opening went out on black; this comes up out of it */
    CUT.black(true);
    CUT.stage(CUT.office(false), 190);
    await U.sleep(90);
    await CUT.rise(700);
    await TUTOR.say('YOU ARE NOT A POLICEMAN HERE. YOU ARE A FORM. SIT DOWN AND FILL IT IN.',
      { name: 'THE CAPTAIN', nameCol: PIX.PAL.S, rim: PIX.PAL.s });
    let right = 0;
    for (let i = 0; i < PAPER.length; i++) {
      const q = PAPER[i];
      const pick = await TUTOR.ask('QUESTION ' + (i + 1) + ' OF ' + PAPER.length
        + '.  ' + q.q,
        q.a.map(a => ({ label: a })),
        { name: 'THE PAPER', nameCol: PIX.PAL.q, rim: PIX.PAL.t });
      const ok = pick === q.right;
      if (ok) right++;
      await TUTOR.say((ok ? 'CORRECT. ' : 'NO. ') + q.why,
        { name: 'THE CAPTAIN', nameCol: PIX.PAL.S, rim: PIX.PAL.s,
          rimCol: ok ? PIX.PAL.F : PIX.PAL.r });
    }
    G.paperScore = right;
    await TUTOR.say(right + ' OF ' + PAPER.length + '. '
      + (right >= 3 ? 'THAT IS A PASS. BARELY.' : 'THAT IS A FAIL, AND I AM SIGNING IT ANYWAY.'),
      { name: 'THE CAPTAIN', nameCol: PIX.PAL.S, rim: PIX.PAL.s });

    /* ---- THE RANGE ---- */
    /* the stamp goes on the form, in the room, while he is still talking */
    CUT.stage(CUT.office(true), 190);
    SFX.tone(150, 0.07, 'square', 0.07);
    await TUTOR.say('DOWNSTAIRS. SIX SHOTS. I WANT FOUR.',
      { name: 'THE CAPTAIN', nameCol: PIX.PAL.S, rim: PIX.PAL.s });
    CUT.unstage();
    CUT.black(false);
    CINE.letterbox(false);
    const r = await JOBS.range();
    G.rangeScore = r.hits;
    const pass = r.hits >= 4;
    await TUTOR.say(r.hits + ' OF 6. '
      + (pass ? 'YOU CAN HIT A THING THAT IS NOT MOVING. GOOD ENOUGH.'
        : 'FOUR WAS THE NUMBER. TAKE THE BADGE ANYWAY, NOBODY ELSE WANTS THIS CASE.'),
      { name: 'THE CAPTAIN', nameCol: PIX.PAL.S, rim: PIX.PAL.s });

    /* ---- AND THE CARD ---- */
    G.badge = true;
    G.applied = true;
    /* a good application is worth something you can feel */
    if (right >= 3 && pass) {
      G.chips = (G.chips || 0) + 20;
      if (typeof STORY !== 'undefined' && STORY.karmaHit) STORY.karmaHit('work');
    }
    await CINE.titleBeat('BRIGADE CRIMINELLE',
      right >= 3 && pass ? 'PASSED. BOTH PAPERS.' : 'CONDITIONAL. DO NOT MAKE ME REGRET IT.',
      right >= 3 && pass ? PIX.PAL.G : PIX.PAL.g);
  }

  return {
    play, application, PAPER, skip,
    skipped() { return skipped_; },
  };
})();
