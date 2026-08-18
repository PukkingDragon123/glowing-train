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

  /* the people who work here, drawn with the same rig you are */
  const CAP_RIG = { key: 'cap', skin: ['q', 'w', 'k'], coat: 't', coatDark: 'K', coatLit: 's', shirt: 'W', tie: 'd', cap: true, hatCol: 't', fat: true, badge: true };
  const MAY_RIG = { key: 'may', skin: ['F', 'f', 'e'], coat: 'v', coatDark: 'X', coatLit: 'V', shirt: 'W', tie: 'p', cap: true, hatCol: 'X', badge: true };
  const UNI_RIG = { key: 'uni', skin: ['f', 'e', 'E'], coat: 'T', coatDark: 'K', coatLit: 't', shirt: 'L', tie: 'K', cap: true, hatCol: 'K', badge: true };
  const DRUNK_RIG = { key: 'drunk', skin: ['B', 'b', 'u'], coat: 'u', coatDark: 'U', coatLit: 'b', shirt: null, hat: true, hatCol: 'U', band: 'K' };
  const NURSE_RIG = { key: 'nurse', skin: ['F', 'f', 'e'], coat: 'W', coatDark: 'w', coatLit: 'W', shirt: 'L', tie: 'l' };

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
      c.drawImage(ART.corkboard(56, 34, 6), 84, 22);
      for (let i = 0; i < 3; i++) c.drawImage(ART.art('wanted', 1), 88 + i * 17, 26);

      /* ============ the bullpen: the chairs live behind the desks ============ */
      for (let i = 0; i < 3; i++) {
        const dx = 176 + i * 78;
        c.drawImage(ART.chair(14, 26, i + 1), dx - 4, FY - 26);
      }
      /* the window between the desks, city outside */
      c.drawImage(ART.window(64, 40, false, 8), 214, 20);
      c.drawImage(ART.window(64, 40, false, 12), 320, 20);

      /* ============ the water cooler + the dead plant ============ */
      c.drawImage(ART.art('cooler', 1), 158, FY - 26);
      c.drawImage(ART.art('plant', 1), 404, FY - 26);

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
      id: 'may', x: 106, y: FY, def: MAY_RIG, face: 1,
      label: 'OFFICER MAYBELLE',
      hint: () => (G.mayTalked ? 'ALREADY SAID YOUR PIECE' : 'TALK'),
      onUse: () => STORY.talkMaybelle(),
    });
    /* --- the captain, outside his own door --- */
    actors.push({
      id: 'cap', x: 256, y: FY, def: CAP_RIG, face: -1,
      label: 'CAPTAIN ROOK',
      hint: () => (STORY.capHasBrief() ? 'HE HAS SOMETHING' : 'TALK'),
      onUse: () => STORY.talkCaptain(),
    });
    /* --- a uniform typing up an assault, and a drunk in the cell --- */
    actors.push({ id: 'uni', x: 344, y: FY, def: UNI_RIG, face: -1, still: false,
      label: 'PATROLMAN DILL', hint: 'TALK', onUse: () => STORY.smallTalk('dill') });
    actors.push({ id: 'drunk', x: 566, y: FY, def: DRUNK_RIG, face: -1, still: true,
      label: 'THE DRUNK TANK', hint: 'TALK', onUse: () => STORY.smallTalk('drunk') });

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
    /* --- the street door: go work the lead --- */
    spots.push({
      id: 'door', x: 30, w: 46, top: 30,
      label: 'THE STREET',
      hint: () => (STORY.lead() ? 'GO' : 'NO ADDRESS YET'),
      onUse: () => STORY.goOut(),
    });
    /* --- the coffee: heals a heart, once a night --- */
    spots.push({
      id: 'coffee', x: 160, w: 16, top: FY - 28,
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

    return {
      id: 'precinct', w: W, floorY: FY, paint, onPaintFront: front, actors, spots,
      enterX: 46, enterFace: 1,
      lights: [{ x: 120, y: 14, r: 40 }, { x: 240, y: 14, r: 40 },
               { x: 360, y: 14, r: 40, flicker: true }, { x: 480, y: 14, r: 40 }],
    };
  }

  /* ============================================================
     THE BOARD ROOM — one wall, and how much of him is on it
     ============================================================ */

  function boardRoom() {
    const W = 300, FY = 116;

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'grey', railY: 84, seed: 9 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'board', seed: 2 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0f1316');
      /* the big board, most of the wall */
      c.drawImage(ART.corkboard(212, 74, 4), 44, 12);
      /* a table under it with the overflow: files, a projector, cold coffee */
      c.drawImage(ART.desk(96, 22, 6), 100, FY - 22);
      c.drawImage(ART.art('files', 1), 108, FY - 33);
      c.drawImage(ART.art('mug', 1), 132, FY - 29);
      c.drawImage(ART.art('ashtray', 1), 150, FY - 28);
      c.drawImage(ART.art('badge', 1), 176, FY - 30);
      /* two chairs nobody sits in */
      c.drawImage(ART.chair(14, 28, 4), 74, FY - 28);
      c.drawImage(ART.chair(14, 28, 5), 214, FY - 28);
      c.drawImage(ART.hangLamp(18, 30, true), 140, 0);
      ART.dither(c, 0, FY - 18, W, 18, 'rgba(0,0,0,.2)', 0.1, 13);
    };

    /* what is actually pinned up is drawn live — it grows with intel */
    const onPaintOver = (c) => {
      const known = STORY.knownIntel();
      const P0 = P();
      /* the five cards of the address, revealed one at a time */
      known.cards.forEach((card, i) => {
        const cx = 58 + i * 40, cy = 20;
        px(c, cx, cy, 32, 30, PIX.PAL.K);
        px(c, cx + 1, cy + 1, 30, 28, card.got ? '#ded2b4' : '#5c4a30');
        if (card.got) {
          /* a photograph or a document, depending which piece it is */
          if (card.art === 'face') {
            px(c, cx + 5, cy + 4, 22, 16, '#141820');
            px(c, cx + 9, cy + 7, 14, 12, '#2e7d5b');
            px(c, cx + 11, cy + 9, 3, 3, '#f4efe0'); px(c, cx + 17, cy + 9, 3, 3, '#f4efe0');
            px(c, cx + 12, cy + 10, 2, 2, '#12101d'); px(c, cx + 18, cy + 10, 2, 2, '#12101d');
            px(c, cx + 10, cy + 15, 12, 2, '#12101d');
          } else if (card.art === 'map') {
            px(c, cx + 4, cy + 4, 24, 18, '#1d3a2c');
            for (let i2 = 0; i2 < 4; i2++) px(c, cx + 4, cy + 6 + i2 * 4, 24, 1, 'rgba(255,255,255,.12)');
            for (let i2 = 0; i2 < 5; i2++) px(c, cx + 6 + i2 * 5, cy + 4, 1, 18, 'rgba(255,255,255,.10)');
            px(c, cx + 16, cy + 12, 4, 4, '#d13b45');
          } else {
            for (let i2 = 0; i2 < 6; i2++) px(c, cx + 5, cy + 5 + i2 * 3, 22 - (i2 % 2) * 6, 1, '#4a4436');
          }
          /* the pin */
          px(c, cx + 14, cy - 1, 4, 3, '#b8232f');
          px(c, cx + 15, cy - 1, 1, 1, '#ff8a7e');
        } else {
          /* an empty slot: tape corners and a question mark */
          px(c, cx + 3, cy + 3, 5, 2, 'rgba(240,235,220,.3)');
          px(c, cx + 24, cy + 3, 5, 2, 'rgba(240,235,220,.3)');
          const q = PIXFONT.render('?', { scale: 2, color: '#8d8672', shadow: null });
          c.drawImage(q, cx + 13, cy + 10);
        }
      });
      /* red string between everything you have */
      const got = known.cards.filter(k => k.got).length;
      for (let i = 0; i < got - 1; i++) {
        const ax = 58 + i * 40 + 16, bx2 = 58 + (i + 1) * 40 + 16;
        for (let x = ax; x < bx2; x++) {
          const t = (x - ax) / (bx2 - ax);
          px(c, x, 51 + Math.round(Math.sin(t * Math.PI) * 5), 1, 1, '#b8232f');
        }
      }
      /* the headline, the readout and the count — cut to the width of cork */
      const head = PIXFONT.render('WHERE IS HE', { scale: 1, color: PIX.PAL.W, shadow: null });
      c.drawImage(head, Math.round(150 - head.width / 2), 54);
      SPR.fitLines(known.line, 34).slice(0, 2).forEach((ln, i) => {
        const sub = PIXFONT.render(ln, { scale: 1, color: known.ready ? PIX.PAL.G : PIX.PAL.q, shadow: null });
        c.drawImage(sub, Math.round(150 - sub.width / 2), 63 + i * 8);
      });
      const pct = PIXFONT.render(STORY.intelPct() + '% OF HIM', { scale: 1, color: known.ready ? PIX.PAL.G : PIX.PAL.R, shadow: null });
      c.drawImage(pct, Math.round(150 - pct.width / 2), 79);
    };

    const spots = [
      { id: 'back', x: 24, w: 30, top: FY - 40, label: 'BACK TO THE BULLPEN', hint: 'GO', onUse: () => STORY.toPrecinct() },
      { id: 'log', x: 150, w: 90, top: 12, bot: 86,
        label: 'THE CASE, SO FAR',
        hint: 'READ IT',
        onUse: () => STORY.readLog() },
      { id: 'raid', x: 262, w: 30, top: FY - 40,
        label: () => (STORY.canFinish() ? 'HIS ADDRESS' : 'NOT ENOUGH YET'),
        hint: () => (STORY.canFinish() ? 'GO AND END IT' : 'FIND MORE'),
        onUse: () => STORY.tryFinale() },
    ];

    return {
      id: 'board', w: W, floorY: FY, paint, onPaintOver, spots, actors: [],
      enterX: 40, enterFace: 1,
      lights: [{ x: 140, y: 16, r: 60, a: 0.06 }],
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
      c.drawImage(ART.bed(78, 46, true), 106, FY - 46);
      c.drawImage(ART.art('ivbag', 1), 100, FY - 62);
      px(c, 103, FY - 51, 1, 22, p.S);                 // the stand
      px(c, 99, FY - 30, 9, 2, p.K);
      c.drawImage(ART.art('monitor', 1), 186, FY - 58);
      px(c, 190, FY - 47, 2, 18, p.s);
      /* the curtain rail and a drawn curtain, stage right */
      px(c, 214, 22, 80, 2, p.K);
      for (let x = 218; x < 292; x += 4) px(c, x, 24, 3, 58, x % 8 ? '#38505c' : '#2c4250');
      px(c, 218, 24, 74, 1, '#4a6572');
      /* a chart on the wall and a chair for the visitor */
      px(c, 160, 26, 18, 22, p.K); px(c, 161, 27, 16, 20, p.W);
      for (let i = 0; i < 5; i++) px(c, 163, 30 + i * 3, 12, 1, '#8d8672');
      c.drawImage(ART.chair(14, 26, 9), 150, FY - 26);
      c.drawImage(ART.radiator(34, 14), 60, FY - 14);
      ART.dither(c, 0, 0, W, FY, 'rgba(190,220,255,.03)', 0.08, 41);
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
      { id: 'may', x: 146, y: FY, def: MAY_RIG, face: 1, still: true,
        tag: 'MAYBELLE', tagCol: PIX.PAL.P,
        label: 'SHE STAYED', hint: 'TALK', onUse: () => STORY.wardTalk() },
      { id: 'nurse', x: 244, y: FY, def: NURSE_RIG, face: -1,
        label: 'THE NURSE', hint: 'TALK', onUse: () => STORY.smallTalk('nurse') },
    ];

    return {
      id: 'ward', w: W, floorY: FY, paint, spots, actors,
      enterX: 62, enterFace: 1,
      lights: [{ x: 150, y: 8, r: 70, a: 0.05 }],
    };
  }


  /* ============================================================
     THE LEAD — the room the crew drinks in.

     This is where identification happens, and it happens by
     walking the line: up to a frog, look at him, cross him off.
     The barman answers questions. The file is on the bar. The
     door at the end is how you take somebody into the back.
     ============================================================ */

  function lineup() {
    const c0 = G.case || (CASE.build(), G.case);
    const n = c0.suspects.length;
    const SP = 46;                                  // how far apart they stand
    const X0 = 150;                                 // where the line starts
    const W = Math.max(560, X0 + n * SP + 150);
    const FY = 106;
    const seed = U.hashSeed(G.seedStr + ':' + G.chapter + ':' + G.blind);

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'brick', railY: 70, seed: seed % 97 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 6, { tone: 'board', seed: seed % 53 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0d0b09');
      px(c, 0, FY - 1, W, 1, 'rgba(255,255,255,.05)');

      /* ---- stage left: the way in, and the way out with a body ---- */
      px(c, 10, 34, 44, 72, p.K);
      px(c, 13, 37, 38, 69, '#1f1710');
      ART.grain(c, 15, 39, 34, 64, '#181109', '#2e2216', seed % 31);
      px(c, 44, 70, 3, 5, p.h);
      px(c, 16, 26, 34, 8, p.K); px(c, 17, 27, 32, 6, '#3a1216');
      px(c, 20, 29, 3, 2, '#ff6a5e'); px(c, 26, 29, 3, 2, '#ff6a5e');
      px(c, 32, 29, 3, 2, '#ff6a5e'); px(c, 38, 29, 3, 2, '#ff6a5e');

      /* ---- the bar, running along under the line ---- */
      c.drawImage(ART.barCounter(96, 26, seed % 17), 62, FY - 26);
      /* the bottles behind it, on two shelves */
      for (let i = 0; i < 11; i++) {
        const bx = 66 + i * 8, h2 = 8 + (i % 3) * 3;
        px(c, bx, 52 - h2, 4, h2, ['#2e7d5b', '#8c2230', '#a5741f', '#3f89c4'][i % 4]);
        px(c, bx, 52 - h2, 1, h2, 'rgba(255,255,255,.2)');
        px(c, bx + 1, 54 - h2, 2, 2, '#12101d');
      }
      px(c, 62, 52, 96, 3, p.K); px(c, 63, 52, 94, 1, '#6b4426');
      px(c, 62, 38, 96, 3, p.K); px(c, 63, 38, 94, 1, '#6b4426');
      /* the mirror strip behind the bottles, tarnished */
      px(c, 64, 40, 92, 11, '#1b2028');
      ART.dither(c, 64, 40, 92, 11, 'rgba(200,220,235,.06)', 0.2, 5);

      /* ---- the height chart the line stands against ---- */
      px(c, X0 - 24, 30, n * SP + 40, 76, '#2a2b22');
      ART.dither(c, X0 - 24, 30, n * SP + 40, 76, 'rgba(0,0,0,.2)', 0.1, 7);
      for (let y = 34; y < FY - 4; y += 8) {
        px(c, X0 - 24, y, n * SP + 40, 1, 'rgba(240,235,220,.16)');
        px(c, X0 - 24, y, 5, 1, 'rgba(240,235,220,.4)');
      }

      /* ---- tables, stools, a jukebox: a room somebody drinks in ---- */
      for (let i = 0; i < 3; i++) {
        const tx = X0 + 20 + i * (SP * Math.max(1, Math.floor(n / 3)));
        if (tx > W - 90) break;
        px(c, tx, FY - 14, 26, 3, p.K);                       // the table top
        px(c, tx + 1, FY - 14, 24, 2, '#4d301a');
        px(c, tx + 11, FY - 11, 4, 11, p.K);                  // the pedestal
        px(c, tx + 8, FY - 1, 10, 2, p.K);
        px(c, tx + 4, FY - 17, 3, 4, '#8c2230');              // a glass on it
        px(c, tx + 18, FY - 16, 4, 3, '#3a3f52');             // and an ashtray
      }
      /* the jukebox, lit, at the end of the room */
      const jx = W - 74;
      px(c, jx, FY - 46, 30, 46, p.K);
      px(c, jx + 2, FY - 44, 26, 42, '#3a1c22');
      px(c, jx + 4, FY - 42, 22, 14, '#12101d');
      for (let i = 0; i < 5; i++) px(c, jx + 6 + i * 4, FY - 40, 2, 10, ['#ff6a5e', '#ffd75e', '#6ff7d8', '#ff7edb', '#7fd7ff'][i]);
      px(c, jx + 4, FY - 26, 22, 3, '#a5741f');
      px(c, jx + 6, FY - 20, 18, 12, '#241a10');
      px(c, jx, FY - 48, 30, 3, '#6e4c12');

      /* ---- the back door: where the sit-down happens ---- */
      const dx = W - 36;
      px(c, dx, 40, 30, 66, p.K);
      px(c, dx + 2, 42, 26, 64, '#20303a');
      ART.dither(c, dx + 3, 43, 24, 62, 'rgba(0,0,0,.25)', 0.14, 11);
      px(c, dx + 6, 50, 18, 20, p.K);
      px(c, dx + 8, 52, 14, 16, '#0d1418');
      px(c, dx + 24, 74, 3, 5, p.S);
      /* the lamp over it, and the sign nobody reads */
      px(c, dx + 4, 32, 22, 7, p.K);
      px(c, dx + 5, 33, 20, 5, '#1a2620');
      px(c, dx + 8, 35, 3, 2, '#4fae6d'); px(c, dx + 14, 35, 3, 2, '#4fae6d');

      /* ---- smoke pooling under the ceiling, and grime at the floor ---- */
      ART.dither(c, 0, 24, W, 16, 'rgba(200,200,210,.05)', 0.16, 13);
      ART.dither(c, 0, FY - 16, W, 16, 'rgba(0,0,0,.24)', 0.12, 17);
    };

    /* ---- the line itself: one scene frog per suspect ---- */
    const actors = [];
    const stand = c0.known ? [true] : CASE.standing();
    c0.suspects.forEach((sus, i) => {
      const out = !stand[i];
      actors.push({
        id: 'sus' + i,
        x: X0 + i * SP,
        y: FY,
        def: SCENE.rigFromFrog(sus.def, sus.name),
        face: -1,
        still: out,
        crossed: out,
        label: () => (out ? sus.name + ' - RULED OUT' : 'N.' + (i + 1) + '  ' + sus.name),
        hint: () => (out ? 'HE IS NOT YOUR FROG' : 'LOOK AT HIM'),
        onUse: () => STORY.lookAt(i),
      });
    });

    /* the barman, behind his own bar, and the file on it */
    actors.push({
      id: 'barman', x: 108, y: FY, def: {
        key: 'barman', skin: ['w', 'q', 'q'], coat: 'w', coatDark: 'q', coatLit: 'W',
        shirt: 'W', tie: 'K', fat: true,
      }, face: 1,
      label: 'THE BARMAN',
      hint: () => (G.case && G.case.quiz > 0 && (G.case.asks || []).some((a, i) => CASE.canAsk(i))
        ? G.case.quiz + ' QUESTIONS LEFT' : 'HE IS DONE TALKING'),
      onUse: () => STORY.askRoom(),
    });

    const spots = [
      { id: 'file', x: 76, w: 26, top: FY - 34,
        label: 'THE CASE FILE',
        hint: () => (G.case && G.case.looks > 0 ? G.case.looks + ' LOOKS LEFT' : 'NOTHING LEFT TO READ'),
        onUse: () => STORY.readEvidence() },
      { id: 'juke', x: W - 60, w: 30, top: FY - 48,
        label: 'THE JUKEBOX',
        hint: 'PUT SOMETHING ON',
        onUse: () => STORY.juke() },
      { id: 'back', x: W - 20, w: 30, top: 40,
        label: () => (G.case && G.case.done ? 'TAKE HIM IN THE BACK' : 'THE BACK ROOM'),
        hint: () => (G.case && G.case.done ? 'SIT DOWN WITH HIM' : 'GO IN WITHOUT NAMING ANYBODY'),
        onUse: () => STORY.sitDown() },
      { id: 'out', x: 32, w: 44, top: 34,
        label: 'THE STREET',
        hint: 'WALK AWAY FROM THIS ONE',
        onUse: () => STORY.leaveLead() },
    ];

    /* the crossed-off frogs get a red X painted over them, in the room */
    const onPaintFront = (c) => {
      actors.forEach(a => {
        if (!a.crossed) return;
        const x = a.x, y = FY - 40;
        for (let i = 0; i < 22; i++) {
          px(c, x - 11 + i, y + 4 + i, 2, 2, '#b8232f');
          px(c, x + 11 - i, y + 4 + i, 2, 2, '#b8232f');
        }
      });
    };

    return {
      id: 'lineup', w: W, floorY: FY, paint, onPaintFront, actors, spots,
      enterX: 44, enterFace: 1,
      lights: [{ x: 110, y: 20, r: 40 }, { x: X0 + (n * SP) / 2, y: 14, r: 60, a: 0.07 },
               { x: W - 50, y: 20, r: 36, flicker: true }],
    };
  }

  return { precinct, boardRoom, ward, lineup, CAP_RIG, MAY_RIG, UNI_RIG };
})();
