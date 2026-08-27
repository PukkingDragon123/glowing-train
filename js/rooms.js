'use strict';
/* ============================================================
   SHELL & DEBT — rooms.js
   THE SET.

   Three rooms you walk around in, dressed prop by prop:

     THE PRECINCT — the bullpen at two in the morning. Your desk,
       the captain's door, Maybelle on the front desk, the board
       at the far end, and the street door you leave by.

     THE BOARD ROOM — one wall, everything you know about the
       Bullfrog pinned to it, red string between the pieces, and
       a gap in the middle shaped like an address.

     THE WARD — where you wake up when somebody wins. Rain on
       the window, one machine counting, and a visitor.

   Every room is a SCENE definition: a painter for the backdrop,
   a cast, and a list of things worth walking over to.
   ============================================================ */

const ROOMS = (() => {

  const P = () => PIX.PAL;
  const px = (c, x, y, w, h, col) => ART.px(c, x, y, w, h, col);

  /* THE CAST. Every one of these is a real frog def — the same thing the
     portraits, the mugshots and the table are built from — so the captain
     you walk up to is the captain who talks to you. */
  const CAP_RIG   = { key: 'cap',    def: HANDLER_DEF };
  const MAY_RIG   = { key: 'may',    def: MAYBELLE_DEF };
  const UNI_RIG   = { key: 'dill',   def: DILL_DEF };
  const DRUNK_RIG = { key: 'drunk',  def: DRUNK_DEF };
  const NURSE_RIG = { key: 'nurse',  def: NURSE_DEF };
  const BAR_RIG   = { key: 'barman', def: BARMAN_DEF };

  /* ============================================================
     THE PRECINCT
     ============================================================ */

  function precinct() {
    const W = 620, FY = 104;

    const paint = (c) => {
      const p = P();
      /* --- the shell of the room --- */
      c.drawImage(ART.wall(W, FY + 4, { tone: 'green', railY: 66, seed: 3 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'lino', seed: 5 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0f1316');
      px(c, 0, FY - 1, W, 1, 'rgba(255,255,255,.06)');

      /* --- pipes along the top of the whole run --- */
      c.drawImage(ART.pipes(W, 9, 4), 0, 6);

      /* ============ stage left: the street door ============ */
      px(c, 8, 30, 46, 76, p.K);
      px(c, 11, 33, 40, 73, '#2a2016');
      ART.grain(c, 13, 35, 36, 68, '#20180f', '#3a2c1c', 17);
      /* the wired glass panel, with the street beyond it */
      px(c, 17, 40, 28, 30, p.K);
      px(c, 19, 42, 24, 26, '#16222c');
      for (let i = 0; i < 6; i++) px(c, 19, 42 + i * 5, 24, 1, 'rgba(120,160,190,.14)');
      for (let i = 0; i < 5; i++) px(c, 19 + i * 5, 42, 1, 26, 'rgba(120,160,190,.14)');
      px(c, 22, 56, 6, 12, '#3b4f5e');                  // a bit of wet street
      px(c, 33, 50, 5, 5, '#ffd75e');                   // a lamp out there
      /* the push bar and the sign over it */
      px(c, 20, 78, 22, 3, p.S); px(c, 20, 78, 22, 1, p.M);
      px(c, 12, 22, 38, 8, p.K); px(c, 13, 23, 36, 6, '#5a1a1a');
      px(c, 15, 25, 4, 2, p.W); px(c, 21, 25, 4, 2, p.W); px(c, 27, 25, 4, 2, p.W);
      px(c, 33, 25, 4, 2, p.W); px(c, 39, 25, 4, 2, p.W);

      /* the noticeboard over her head (the desk itself is drawn in front) */
      c.drawImage(ART.corkboard(58, 36, 6), 84, 20);
      /* real mugshots of real frogs, pinned up small */
      const wanted = ['owner', 'vig', 'lily'];
      wanted.forEach((id, i) => {
        const d = FROG_DEFS[id];
        if (!d) return;
        const m = SPR.sceneFrog('pin:' + id, d, 0, 1, 5);
        const bx = 88 + i * 18;
        px(c, bx, 24, 15, 20, '#ded2b4');
        px(c, bx + 1, 25, 13, 13, '#141820');
        c.drawImage(m, bx + 1, 25, 13, 13);
        px(c, bx + 2, 39, 11, 1, '#8d8672');
        px(c, bx + 2, 41, 8, 1, '#8d8672');
        px(c, bx + 6, 23, 3, 2, '#b8232f');
      });

      /* ============ the bullpen: the chairs live behind the desks ============ */
      for (let i = 0; i < 3; i++) {
        const dx = 176 + i * 78;
        c.drawImage(ART.chair(14, 26, i + 1), dx - 4, FY - 26);
      }
      /* the window between the desks, city outside */
      c.drawImage(ART.window(64, 40, false, 8), 214, 20);
      c.drawImage(ART.window(64, 40, false, 12), 320, 20);

      /* ============ the water cooler + the dead plant ============ */
      c.drawImage(ART.art('cooler', 2), 52, FY - 26);
      c.drawImage(ART.art('plant', 2), 400, FY - 26);

      /* ============ filing wall + lockers ============ */
      c.drawImage(ART.cabinet(30, 46, 1, 7), 420, FY - 46);
      c.drawImage(ART.cabinet(30, 46, -1, 9), 452, FY - 46);
      c.drawImage(ART.lockers(56, 52, 4, 3), 484, FY - 52);
      c.drawImage(ART.art('wallclock', 1), 430, 24);
      c.drawImage(ART.radiator(40, 16), 372, FY - 16);

      /* ============ the captain's office door ============ */
      px(c, 262, 34, 40, 72, p.K);
      px(c, 265, 37, 34, 69, '#2f2418');
      ART.grain(c, 266, 39, 32, 64, '#241b10', '#3f3020', 23);
      px(c, 270, 44, 24, 22, p.K);
      px(c, 272, 46, 20, 18, 'rgba(210,230,255,.14)');   // frosted glass
      for (let i = 0; i < 4; i++) px(c, 272, 46 + i * 5, 20, 1, 'rgba(255,255,255,.07)');
      px(c, 274, 52, 16, 3, '#8d8672');                  // the lettering, unreadable
      px(c, 276, 58, 12, 2, '#6d6656');
      px(c, 294, 72, 3, 5, p.G);                         // the handle

      /* ============ the corridor: a hole with the city behind it ============ */
      px(c, 172, 26, 78, 5, '#1a1f26');
      px(c, 172, 26, 78, 1, '#2b333d');
      px(c, 172, 31, 4, 44, '#171c22');
      px(c, 246, 31, 4, 44, '#12161b');
      px(c, 170, 75, 82, 3, '#232a32');
      px(c, 170, 75, 82, 1, '#39424e');
      for (let bx = 181; bx < 244; bx += 12) px(c, bx, 31, 2, 44, '#0a0d11');

      /* ============ the stairs down to the line-up room ============ */
      px(c, 306, 30, 40, 76, p.K);
      px(c, 309, 33, 34, 73, '#101a1e');
      /* the steps, going away from you into the dark */
      for (let i = 0; i < 7; i++) {
        const sy = 44 + i * 8, iw = 30 - i * 3;
        px(c, 311 + Math.round(i * 1.5), sy, iw, 3, '#2a353c');
        px(c, 311 + Math.round(i * 1.5), sy, iw, 1, '#3e4c55');
      }
      px(c, 309, 33, 3, 73, '#1a262c');                  // the rail
      px(c, 340, 33, 3, 73, '#1a262c');
      px(c, 308, 22, 36, 8, p.K);
      px(c, 309, 23, 34, 6, '#1a2a22');
      {
        const t = PIXFONT.render('LINE-UP', { scale: 1, color: '#4fae6d', shadow: null });
        c.drawImage(t, 326 - Math.round(t.width / 2), 24);
      }

      /* ============ the holding cell, stage right ============ */
      c.drawImage(ART.cell(58, 62, 5), 544, FY - 62);

      /* ============ THE BOARD at the far end ============ */
      c.drawImage(ART.corkboard(78, 52, 2), 556 - 92, 26);
      /* strings and pins on it, so it reads from across the room */
      const bx = 556 - 92;
      for (let i = 0; i < 5; i++) {
        px(c, bx + 8 + (i % 3) * 24, 32 + Math.floor(i / 3) * 20, 14, 16, '#ded2b4');
        px(c, bx + 10 + (i % 3) * 24, 34 + Math.floor(i / 3) * 20, 10, 9, '#141820');
        px(c, bx + 8 + (i % 3) * 24, 31 + Math.floor(i / 3) * 20, 3, 2, '#b8232f');
      }
      px(c, bx + 14, 40, 26, 1, '#b8232f');
      px(c, bx + 34, 42, 22, 1, '#b8232f');

      /* --- the light, and everything it does to the room --- */
      for (const lx of [120, 240, 360, 480]) {
        c.drawImage(ART.hangLamp(16, 26, false), lx - 8, 0);
      }
      /* THE PRINT BENCH, between the last desk and the lockers: powder,
         tape, a stack of lift cards and a lamp on a bent neck. */
      ART.box(c, 426, FY - 26, 46, 26, { fill: '#3f3a33', top: '#524b41', bot: '#221f1a', ink: p.K });
      px(c, 430, FY - 32, 8, 6, '#22282e');            // the powder jar
      px(c, 431, FY - 31, 6, 4, '#8d8672');
      px(c, 441, FY - 30, 6, 4, '#2b2436');            // the brush
      px(c, 442, FY - 33, 2, 4, '#4a3f2e');
      px(c, 452, FY - 31, 14, 5, '#ded2b4');           // lift cards
      px(c, 452, FY - 33, 14, 2, '#f0e6c8');
      px(c, 468, FY - 44, 2, 18, '#3a3f46');           // the bench lamp
      px(c, 462, FY - 48, 12, 5, '#3a3f46');
      px(c, 463, FY - 43, 10, 1, '#ffe7a8');
      /* grime in the corners so it isn't a clean box */
      ART.dither(c, 0, FY - 20, W, 20, 'rgba(0,0,0,.22)', 0.12, 31);
    };

    /* Everything on this layer is drawn AFTER the cast, so a frog at a desk
       is behind it — which is the only way a side-on room reads as a room. */
    const front = (c) => {
      const p = P();
      /* Maybelle's counter */
      c.drawImage(ART.desk(70, 22, 2), 78, FY - 22);
      c.drawImage(ART.art('phone', 1), 86, FY - 32);
      c.drawImage(ART.art('files', 1), 126, FY - 33);
      c.drawImage(ART.art('mug', 1), 140, FY - 29);
      px(c, 74, FY - 38, 4, 38, p.K);
      px(c, 75, FY - 37, 2, 37, '#3a2c1c');
      /* the three bullpen desks */
      for (let i = 0; i < 3; i++) {
        const dx = 176 + i * 78;
        c.drawImage(ART.desk(62, 22, i + 3), dx + 10, FY - 22);
        c.drawImage(ART.art('typewriter', 1), dx + 14, FY - 35);
        if (i === 1) c.drawImage(ART.art('ashtray', 1), dx + 44, FY - 28);
        if (i === 2) c.drawImage(ART.art('files', 1), dx + 42, FY - 33);
        if (i === 0) c.drawImage(ART.art('desklamp', 1), dx + 46, FY - 34);
      }
    };

    const spots = [];
    const actors = [];

    /* --- Maybelle, at her desk --- */
    actors.push({
      id: 'may', x: 164, y: FY, key: MAY_RIG.key, def: MAY_RIG.def, face: -1,
      /* she is on the front desk and the front desk is a typewriter */
      job: 'type', mood: 'pleased',
      label: 'OFFICER MAYBELLE',
      hint: () => (G.mayTalked ? 'ALREADY SAID YOUR PIECE' : 'TALK'),
      onUse: () => STORY.talkMaybelle(),
    });
    /* --- the captain, outside his own door --- */
    actors.push({
      id: 'cap', x: 272, y: FY, key: CAP_RIG.key, def: CAP_RIG.def, face: -1,
      /* he stands outside his own door with a cigar and reads the room */
      job: 'smoke', mood: 'hard',
      label: 'CAPTAIN ROOK',
      hint: () => (STORY.capHasBrief() ? 'HE HAS SOMETHING' : 'TALK'),
      onUse: () => STORY.talkCaptain(),
    });
    /* --- a uniform typing up an assault, and a drunk in the cell --- */
    actors.push({ id: 'uni', x: 344, y: FY, key: UNI_RIG.key, def: UNI_RIG.def, face: -1, still: false,
      job: 'type', mood: 'bored',
      label: 'PATROLMAN DILL', hint: 'TALK', onUse: () => STORY.smallTalk('dill') });
    actors.push({ id: 'drunk', x: 566, y: FY, key: DRUNK_RIG.key, def: DRUNK_RIG.def, face: -1, still: true,
      job: 'drink', mood: 'bored',
      label: 'THE DRUNK TANK', hint: 'TALK', onUse: () => STORY.smallTalk('drunk') });
    /* AND THE REST OF A WORKING BULLPEN. Two more at the desks behind —
       one typing up somebody else's night, one going through a file — and a
       sergeant walking the length of the room because he always is. */
    actors.push({ id: 'clerk1', x: 408, y: FY, key: 'clerk1',
      def: Object.assign({}, DILL_DEF, { skin: ['N', 'n', 'n'], flatcap: false }),
      face: -1, job: 'type', mood: 'bored', profile: false,
      label: 'A CLERK', hint: 'HE IS BUSY', onUse: () => STORY.smallTalk('dill') });
    actors.push({ id: 'clerk2', x: 462, y: FY, key: 'clerk2',
      def: Object.assign({}, DILL_DEF, { skin: ['G', 'g', 'h'], glasses: 'round' }),
      face: -1, job: 'read', mood: 'watch',
      label: 'A CLERK', hint: 'HE IS READING', onUse: () => STORY.smallTalk('dill') });
    actors.push({ id: 'sarge', x: 100, y: FY, key: 'sarge',
      def: Object.assign({}, DILL_DEF, { skin: ['e', 'e', 'K'], fat: true }),
      face: 1, job: 'pace', beat: 40, mood: 'hard',
      label: 'THE DUTY SERGEANT', hint: 'HE IS WALKING IT OFF',
      onUse: () => STORY.smallTalk('dill') });

    /* --- the board --- */
    spots.push({
      id: 'board', x: 500, w: 78, top: 26, bot: 78,
      label: 'THE BULLFROG BOARD',
      hint: () => 'OPEN  (' + STORY.intelPct() + '% OF HIM)',
      onUse: () => STORY.openBoard(),
    });
    /* --- your own desk: the case file that sends you out --- */
    spots.push({
      id: 'mydesk', x: 206, w: 60, top: FY - 42,
      label: 'YOUR DESK',
      hint: () => (STORY.lead() ? 'THE LEAD IS ON IT' : 'NOTHING NEW'),
      onUse: () => STORY.openDesk(),
    });
    /* --- the street door: get the car, which means the phone --- */
    spots.push({
      id: 'door', x: 30, w: 46, top: 30,
      label: 'THE STREET',
      hint: () => (STORY.lead() ? 'TAKE THE CAR OUT' : 'NO CASE YET'),
      onUse: () => STORY.goOut(),
    });
    /* --- the stairs down to the line-up room --- */
    spots.push({
      id: 'stairs', x: 326, w: 40, top: 30,
      label: 'DOWN TO THE LINE-UP',
      hint: () => {
        if (!G.case) return 'NOBODY IN IT YET';
        if (G.case.known) return 'NO LINE-UP FOR HIM. GO STRAIGHT THROUGH.';
        const n = CASE.left();
        return n > 1 ? n + ' OF THEM STILL FIT' : 'ONE FACE LEFT. GO AND SAY IT.';
      },
      onUse: () => STORY.toLineup(),
    });
    /* --- the coffee: heals a heart, once a night --- */
    spots.push({
      id: 'coffee', x: 62, w: 16, top: FY - 28,
      label: 'THE COOLER',
      hint: () => (G.hadCoffee ? 'EMPTY' : 'A DRINK'),
      onUse: () => STORY.drink(),
    });
    /* --- the lockers: your iron and your belt --- */
    spots.push({
      id: 'locker', x: 512, w: 56, top: FY - 52,
      label: 'YOUR LOCKER',
      hint: 'WHAT YOU CARRY',
      onUse: () => STORY.openLocker(),
    });
    /* --- THE PRINT BENCH: powder, tape, and half an hour you do not have --- */
    spots.push({
      id: 'kit', x: 448, w: 48, top: FY - 50,
      label: 'THE PRINT BENCH',
      hint: () => (G.dusted ? 'YOU HAVE LIFTED WHAT THERE WAS'
        : (typeof CITY !== 'undefined' && CITY.found().length
          ? 'DUST WHAT YOU BROUGHT BACK' : 'NOTHING TO DUST YET')),
      onUse: () => STORY.dustJob(),
    });

    return {
      id: 'precinct', w: W, floorY: FY, paint, onPaintFront: front, actors, spots,
      /* SERGEANT, WHO IS A DOG. Nobody signed him in either. */
      pets: [{ kind: 'dog', x: 452, name: 'SERGEANT' }],
      depth: [{ x: 176, y: 31, w: 70, h: 44 , sky: true }],
      enterX: 46, enterFace: 1,
      lights: [{ x: 120, y: 14, r: 40 }, { x: 240, y: 14, r: 40 },
               { x: 360, y: 14, r: 40, flicker: true }, { x: 480, y: 14, r: 40 }],
    };
  }

  /* ============================================================
     THE BOARD ROOM — one wall, and how much of him is on it
     ============================================================ */

  function boardRoom() {
    const W = 236, FY = 116, MID = 118;

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'grey', railY: 84, seed: 9 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'board', seed: 2 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0f1316');
      /* the board: most of the wall, and the only thing in the room that matters */
      c.drawImage(ART.corkboard(206, 76, 4), MID - 103, 12);
      /* a table under it with the overflow: files, cold coffee, a spare badge */
      c.drawImage(ART.desk(92, 22, 6), MID - 46, FY - 22);
      c.drawImage(ART.art('files', 1), MID - 38, FY - 33);
      c.drawImage(ART.art('mug', 1), MID - 14, FY - 29);
      c.drawImage(ART.art('ashtray', 1), MID + 4, FY - 28);
      c.drawImage(ART.art('badge', 1), MID + 28, FY - 30);
      c.drawImage(ART.chair(14, 26, 4), MID - 78, FY - 26);
      c.drawImage(ART.chair(14, 26, 5), MID + 62, FY - 26);
      c.drawImage(ART.hangLamp(18, 26, true), MID - 9, 0);
      ART.dither(c, 0, FY - 18, W, 18, 'rgba(0,0,0,.2)', 0.1, 13);
    };

    /* what is pinned up is drawn live — it grows with the case */
    const onPaintOver = (c) => {
      const known = STORY.knownIntel();
      const X0 = MID - 100, PITCH = 40;
      known.cards.forEach((card, i) => {
        const cx = X0 + i * PITCH, cy = 18;
        px(c, cx, cy, 32, 30, PIX.PAL.K);
        px(c, cx + 1, cy + 1, 30, 28, card.got ? '#ded2b4' : '#5c4a30');
        if (card.got) {
          if (card.art === 'face') {
            px(c, cx + 5, cy + 4, 22, 16, '#141820');
            px(c, cx + 9, cy + 7, 14, 12, '#2e7d5b');
            px(c, cx + 11, cy + 9, 3, 3, '#f4efe0'); px(c, cx + 17, cy + 9, 3, 3, '#f4efe0');
            px(c, cx + 12, cy + 10, 2, 2, '#12101d'); px(c, cx + 18, cy + 10, 2, 2, '#12101d');
            px(c, cx + 10, cy + 15, 12, 2, '#12101d');
          } else if (card.art === 'map') {
            px(c, cx + 4, cy + 4, 24, 18, '#1d3a2c');
            for (let k = 0; k < 4; k++) px(c, cx + 4, cy + 6 + k * 4, 24, 1, 'rgba(255,255,255,.12)');
            for (let k = 0; k < 5; k++) px(c, cx + 6 + k * 5, cy + 4, 1, 18, 'rgba(255,255,255,.10)');
            px(c, cx + 16, cy + 12, 4, 4, '#d13b45');
          } else {
            for (let k = 0; k < 6; k++) px(c, cx + 5, cy + 5 + k * 3, 22 - (k % 2) * 6, 1, '#4a4436');
          }
          px(c, cx + 14, cy - 1, 4, 3, '#b8232f');
          px(c, cx + 15, cy - 1, 1, 1, '#ff8a7e');
        } else {
          px(c, cx + 3, cy + 3, 5, 2, 'rgba(240,235,220,.3)');
          px(c, cx + 24, cy + 3, 5, 2, 'rgba(240,235,220,.3)');
          const q = PIXFONT.render('?', { scale: 2, color: '#8d8672', shadow: null });
          c.drawImage(q, cx + 13, cy + 10);
        }
      });
      /* red string between the pieces you have */
      const got = known.cards.filter(k => k.got).length;
      for (let i = 0; i < got - 1; i++) {
        const ax = X0 + i * PITCH + 16, bx2 = X0 + (i + 1) * PITCH + 16;
        for (let x = ax; x < bx2; x++) {
          const t = (x - ax) / (bx2 - ax);
          px(c, x, 49 + Math.round(Math.sin(t * Math.PI) * 5), 1, 1, '#b8232f');
        }
      }
      /* and the readout, cut to the width of the cork */
      const head = PIXFONT.render('WHERE IS HE', { scale: 1, color: PIX.PAL.W, shadow: null });
      c.drawImage(head, Math.round(MID - head.width / 2), 54);
      SPR.fitLines(known.line, 30).slice(0, 2).forEach((ln, i) => {
        const sub = PIXFONT.render(ln, { scale: 1, color: known.ready ? PIX.PAL.G : PIX.PAL.q, shadow: null });
        c.drawImage(sub, Math.round(MID - sub.width / 2), 63 + i * 8);
      });
      const pct = PIXFONT.render(STORY.intelPct() + '% OF HIM', { scale: 1, color: known.ready ? PIX.PAL.G : PIX.PAL.R, shadow: null });
      c.drawImage(pct, Math.round(MID - pct.width / 2), 80);
    };

    const spots = [
      { id: 'back', x: 14, w: 26, top: FY - 40, label: 'BACK TO THE BULLPEN', hint: 'GO',
        onUse: () => STORY.toPrecinct() },
      { id: 'log', x: MID, w: 90, top: 12, bot: 88,
        label: 'THE CASE, SO FAR', hint: 'READ IT', onUse: () => STORY.readLog() },
      { id: 'raid', x: W - 14, w: 26, top: FY - 40,
        label: () => (STORY.canFinish() ? 'FOURTEEN MARSH ROW' : 'NOT ENOUGH YET'),
        hint: () => (STORY.canFinish() ? 'GO AND END IT' : 'FIND MORE'),
        onUse: () => STORY.tryFinale() },
    ];

    return {
      id: 'board', w: W, floorY: FY, paint, onPaintOver, spots, actors: [],
      enterX: 40, enterFace: 1,
      lights: [{ x: MID, y: 14, r: 56, a: 0.06 }],
    };
  }

  /* ============================================================
     THE WARD — you don't die, you wake up
     ============================================================ */

  function ward() {
    const W = 300, FY = 112;

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'tile', railY: 70, seed: 21 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'lino', seed: 12 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0f1316');
      /* rain on a big window, because of course it is still raining */
      c.drawImage(ART.window(72, 46, false, 31), 26, 18);
      /* two beds: yours, and one with the curtain pulled */
      /* your bed, empty: you are the one walking around. Nobody stands in
         front of it — the whole point of the room is the bed you left. */
      c.drawImage(ART.bed(78, 46, false), 118, FY - 46);
      c.drawImage(ART.art('ivbag', 1), 112, FY - 62);
      px(c, 115, FY - 51, 1, 47, p.S);                 // the stand, to the floor
      px(c, 111, FY - 6, 9, 2, p.K);                   // and its feet
      c.drawImage(ART.art('monitor', 1), 200, FY - 58);
      px(c, 204, FY - 47, 2, 43, p.s);
      px(c, 200, FY - 6, 10, 2, p.K);
      /* the curtain rail and a drawn curtain, stage right */
      px(c, 214, 22, 80, 2, p.K);
      for (let x = 218; x < 292; x += 4) px(c, x, 24, 3, 58, x % 8 ? '#38505c' : '#2c4250');
      px(c, 218, 24, 74, 1, '#4a6572');
      /* a chart on the wall and a chair for the visitor */
      px(c, 160, 26, 18, 22, p.K); px(c, 161, 27, 16, 20, p.W);
      for (let i = 0; i < 5; i++) px(c, 163, 30 + i * 3, 12, 1, '#8d8672');
      c.drawImage(ART.chair(14, 26, 9), 214, FY - 26);
      c.drawImage(ART.radiator(34, 14), 60, FY - 14);
      ART.dither(c, 0, 0, W, FY, 'rgba(190,220,255,.02)', 0.05, 41);
    };

    const spots = [
      { id: 'leave', x: 272, w: 30, top: FY - 42,
        label: 'DISCHARGE YOURSELF',
        hint: 'BACK TO WORK',
        onUse: () => STORY.leaveWard() },
      { id: 'chart', x: 169, w: 20, top: 26, bot: 50,
        label: 'YOUR CHART',
        hint: 'READ IT',
        onUse: () => STORY.readChart() },
    ];

    const actors = [
      { id: 'may', x: 92, y: FY, key: MAY_RIG.key, def: MAY_RIG.def, face: 1, still: true,
        tag: 'MAYBELLE', tagCol: PIX.PAL.P,
        label: 'SHE STAYED', hint: 'TALK', onUse: () => STORY.wardTalk() },
      { id: 'nurse', x: 244, y: FY, key: NURSE_RIG.key, def: NURSE_RIG.def, face: -1,
        label: 'THE NURSE', hint: 'TALK', onUse: () => STORY.smallTalk('nurse') },
    ];

    return {
      id: 'ward', w: W, floorY: FY, paint, spots, actors,
      pets: [{ kind: 'cat', x: W - 70, name: 'THE WARD CAT' }],
      enterX: 62, enterFace: 1,
      lights: [{ x: 150, y: 8, r: 70, a: 0.05 }],
    };
  }


  /* ============================================================
     THE LINE-UP ROOM — downstairs at the station, and last.

     You do not name anybody in the field any more. You bring back
     what you dug out of the city, they stand them against the
     height chart under a light that does nobody any favours, and
     you say one name. What you found is on the table behind you;
     anybody it rules out is crossed off where he stands.
     ============================================================ */

  function lineup() {
    const c0 = G.case || (CASE.build(), G.case);
    const n = c0.suspects.length;
    const SP = 56;                                  // how far apart they stand
    const X0 = 150;                                 // where the line starts
    const W = Math.max(520, X0 + n * SP + 130);
    const FY = 106;
    const seed = U.hashSeed(G.seedStr + ':lineup:' + G.chapter);
    const stand = CASE.standing();

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'tile', railY: 76, seed: seed % 61 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'lino', seed: seed % 43 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0e1114');
      px(c, 0, FY - 1, W, 1, 'rgba(255,255,255,.05)');

      /* the way back up to the bullpen */
      px(c, 10, 34, 44, 72, p.K);
      px(c, 13, 37, 38, 69, '#1d2429');
      ART.grain(c, 15, 39, 34, 64, '#161c20', '#28323a', seed % 31);
      px(c, 44, 70, 3, 5, p.h);
      px(c, 14, 26, 38, 7, p.K);
      px(c, 15, 27, 36, 5, '#1a2a22');
      const upSign = PIXFONT.render('UP', { scale: 1, color: '#4fae6d', shadow: null });
      c.drawImage(upSign, 26, 28);

      /* THE HEIGHT CHART, lit hard, painted straight onto the tile */
      const cw = n * SP + 50;
      px(c, X0 - 28, 26, cw, 80, '#2c2f26');
      ART.dither(c, X0 - 28, 26, cw, 80, 'rgba(0,0,0,.22)', 0.1, 7);
      for (let y = 30; y < FY - 4; y += 8) {
        px(c, X0 - 28, y, cw, 1, 'rgba(240,235,220,.16)');
        px(c, X0 - 28, y, 6, 1, 'rgba(240,235,220,.45)');
        px(c, X0 - 28 + cw - 6, y, 6, 1, 'rgba(240,235,220,.3)');
      }
      /* a number stencilled on the chart over each of them, where a frog
         cannot stand on it */
      for (let i = 0; i < n; i++) {
        const t = PIXFONT.render(String(i + 1), { scale: 3, color: 'rgba(240,235,220,.5)', shadow: null });
        c.drawImage(t, X0 + i * SP - Math.round(t.width / 2), 30);
      }

      /* the glass you are standing behind */
      px(c, X0 - 46, 30, 14, 70, p.K);
      px(c, X0 - 44, 32, 10, 66, 'rgba(150,200,220,.10)');
      for (let y = 34; y < 96; y += 6) px(c, X0 - 44, y, 10, 1, 'rgba(220,240,255,.07)');

      /* the table with what you brought back on it */
      ART.box(c, 62, FY - 22, 74, 22, { fill: '#4a4038', top: '#5e5246', bot: '#241d18', ink: p.K });
      px(c, 104, FY - 27, 20, 5, p.K);
      px(c, 105, FY - 26, 18, 3, '#8d9298');
      const got = (typeof CITY !== 'undefined') ? CITY.found().length : 0;
      for (let i = 0; i < Math.min(5, got); i++) {
        px(c, 70 + i * 2, FY - 26 - i * 3, 24, 3, p.K);
        px(c, 71 + i * 2, FY - 26 - i * 3, 22, 2, '#e6dcc4');
      }
      if (!got) {
        px(c, 72, FY - 27, 24, 5, p.K);
        px(c, 73, FY - 26, 22, 3, '#6d6656');
      }

      /* the strip light over each spot, and the grime at the bottom */
      for (let i = 0; i < n; i++) {
        const lx = X0 + i * SP;
        px(c, lx - 9, 8, 18, 5, p.K);
        px(c, lx - 8, 9, 16, 3, '#fff6d8');
      }
      ART.dither(c, 0, FY - 22, W, 22, 'rgba(0,0,0,.22)', 0.1, 29);
    };

    /* the line: anybody the evidence has ruled out stands crossed off */
    const actors = [];
    c0.suspects.forEach((sus, i) => {
      const out = !stand[i];
      actors.push({
        id: 'sus' + i,
        x: X0 + i * SP,
        y: FY,
        def: sus.def,
        key: 'sus:' + sus.name,
        face: -1,
        still: out,
        crossed: out,
        label: () => 'N.' + (i + 1) + '  ' + sus.name,
        hint: () => (out ? 'WHAT YOU FOUND SAYS NO' : 'SAY THE NAME'),
        onUse: () => STORY.nameHim(i),
      });
    });
    /* the captain, on your side of the glass, watching you do it */
    actors.push({
      id: 'cap', x: X0 - 74, y: FY, key: CAP_RIG.key, def: CAP_RIG.def, face: 1, still: true,
      label: 'CAPTAIN ROOK',
      hint: () => (CASE.left() > 1 ? CASE.left() + ' OF THEM STILL FIT' : 'ONE LEFT. SAY IT.'),
      onUse: () => STORY.lineupTalk(),
    });

    const spots = [
      { id: 'file', x: 99, w: 74, top: FY - 36,
        label: 'WHAT YOU BROUGHT BACK',
        hint: () => ((typeof CITY !== 'undefined' ? CITY.found().length : 0) + ' PIECES ON THE TABLE'),
        onUse: () => STORY.readFindings() },
      { id: 'out', x: 32, w: 44, top: 34,
        label: 'BACK UP TO THE BULLPEN',
        hint: 'LEAVE THEM STANDING',
        onUse: () => STORY.leaveLineup() },
    ];

    const onPaintFront = (c) => {
      actors.forEach(a => {
        if (!a.crossed) return;
        const h = SCENE.rigH(a), w = Math.round(h * 0.6);
        const x = a.x, y = FY - h + 4;
        for (let i = 0; i < w; i++) {
          const t = i / w;
          px(c, x - w / 2 + i, y + Math.round(t * (h - 10)), 2, 2, '#b8232f');
          px(c, x + w / 2 - i, y + Math.round(t * (h - 10)), 2, 2, '#b8232f');
        }
      });
    };

    return {
      id: 'lineup', w: W, floorY: FY, paint, onPaintFront, actors, spots,
      enterX: 44, enterFace: 1,
      lights: [{ x: X0 + (n * SP) / 2, y: 10, r: 70, a: 0.1 },
               { x: 100, y: 20, r: 34, flicker: true }],
    };
  }

  return { precinct, boardRoom, ward, lineup, CAP_RIG, MAY_RIG, UNI_RIG };
})();
