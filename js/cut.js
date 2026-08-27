/* ============================================================
   CUT — CUTSCENES THAT ARE ROOMS.

   The opening used to be a slide projector. Thirteen painted
   cards, 220 by 124, each one held up while a line of text was
   typed under it: the house, the room, the ashtray, the airport,
   the cabin. They were nice drawings and they were still slides,
   and the game they introduced does not look like that at all —
   it looks like a lit room with a frog walking across it, seen
   from the side, with a camera that follows him.

   So the cutscenes are rooms now. The same SCENE runtime, the
   same rig with its new elbows and knees, the same lamps, the
   same floor, the same parallax and the same dialogue plates.
   What a cutscene adds is that nobody is driving: the script
   walks him in, pans the camera across the wreckage, cuts in
   close on the thing that matters, and puts the lines over the
   top of it. Everything you see in the opening you will see
   again while you are playing, because it is the same machinery.

   THE SCRIPT API is deliberately tiny — it is the vocabulary of
   a shot list, not a language:

     cam / pan / cutIn      where the camera is and how it moves
     place / meTo / arm     where he is and what he does
     send                   somebody else walks
     say / card             lines over the live room
     fade / rise / shake    the punctuation between shots
     set / repaint          change the set and rebuild the art

   Every await goes through gate(), so one press of Escape drops
   out of all of it — a player who has seen the opening once
   should never have to sit through it again.
   ============================================================ */

const CUT = (() => {
  const px = (c, x, y, w, h, col) => ART.px(c, x, y, w, h, col);
  const P = () => PIX.PAL;

  const SKIP = { cutSkip: true };
  let skipping = false;
  let didSkip = false;                /* did the player walk out of it */
  let running = false;
  let onKey = null;

  function skip() { skipping = true; }
  function gate() { if (skipping) throw SKIP; }

  /* ------------------------------------------------------------
     THE BLACK. A cutscene needs to be able to go to black and
     come back, and the card-rack wipe is the wrong instrument —
     that is for changing screens. This is one pane of black with
     an opacity on it.
     ------------------------------------------------------------ */
  function pane() {
    let l = document.getElementById('cut-fade');
    if (!l) { l = U.el('div'); l.id = 'cut-fade'; document.body.appendChild(l); }
    return l;
  }
  async function fade(ms) {
    const l = pane();
    l.className = 'on';
    l.style.transitionDuration = (ms || 520) + 'ms';
    await U.sleep((ms || 520) + 40);
  }
  async function rise(ms) {
    const l = pane();
    l.style.transitionDuration = (ms || 620) + 'ms';
    l.className = '';
    await U.sleep((ms || 620) + 40);
  }
  function black(on) {
    const l = pane();
    l.style.transitionDuration = '0ms';
    l.className = on ? 'on' : '';
  }

  /* ------------------------------------------------------------
     ONE SHOT: a room, and a script that drives it.
     ------------------------------------------------------------ */
  async function shot(def, script) {
    gate();
    SCENE.open(def);
    SCENE.busy(true);                 /* nobody walks unless told to */
    SCENE.hideMe(false);
    SCENE.meArm('');
    SCENE.meFace(null);
    await U.sleep(70);
    try {
      await script(API, def);
    } finally {
      SCENE.busy(false);
      SCENE.meArm('');
      SCENE.meFace(null);
      SCENE.hideMe(false);
      SCENE.cutFree();
    }
  }

  /* the vocabulary a script gets */
  const API = {
    async wait(ms) { gate(); await U.sleep(ms); gate(); },
    cam(x) { SCENE.look(x); },
    async pan(a, b, ms) {
      gate();
      const was = SCENE.busy();
      await SCENE.pan(a, b, ms);
      SCENE.busy(was);                /* pan hands the room back; a shot does not */
      gate();
    },
    cutIn(on) { SCENE.cutIn(on); },
    free() { SCENE.cutFree(); },
    place(x, face, z) { SCENE.place(x, face, z); },
    hide(v) { SCENE.hideMe(v); },
    arm(k) { SCENE.meArm(k); },
    face(k) { SCENE.meFace(k); },
    hand() { return SCENE.meHand(); },
    async meTo(x, z) { gate(); await SCENE.meTo(x, z); gate(); },
    async send(id, x, sp) { gate(); await SCENE.send(id, x, sp); gate(); },
    actor(id) { return SCENE.actor(id); },
    beat(k) { SCENE.beat(k); },
    /* a line, spoken over the live room, on the game's own plate */
    async say(name, text, col) {
      gate();
      await TUTOR.say(text, {
        name: name, nameCol: col || PIX.PAL.F, rim: PIX.PAL.t,
      });
      gate();
    },
    /* and a question, with the same reply cards the game uses */
    async ask(name, text, opts) {
      gate();
      const r = await TUTOR.ask(text, opts, { name: name, nameCol: PIX.PAL.q, rim: PIX.PAL.t });
      gate();
      return r;
    },
    /* the location card, typed over the room rather than over black */
    async card(name, sub, ms) {
      gate();
      const c = CINE.locationCard(name, sub);
      await U.sleep(ms || 1900);
      await c.close();
      gate();
    },
    fade, rise, black,
    shake() { if (typeof UI !== 'undefined' && UI.shake) UI.shake(); },
    thud(f, l) { SFX.tone(f || 70, l || 0.16, 'sine', 0.09); },
    /* change the set, then rebuild the cached art so it shows */
    set(def, k, v) { def[k] = v; SCENE.open(def); },
  };

  /* ============================================================
     THE HOUSE — the first thirty seconds of the game.

     Read left to right, because that is the order you find it
     in: the front door standing open onto the rain, the hall
     with the telephone off its table, the archway, and then the
     front room with her chair on its side, the window up, and an
     ashtray with somebody else's cigarette in it.

     Nothing is described anywhere. The set is the exposition.
     ============================================================ */
  function house() {
    const W = 520, FY = 112;
    const DOOR = 46, HALL = 150, ARCH = 214;
    /* THE FRONT ROOM, LAID OUT ONCE, BY NAME. Every prop in here was
       originally placed as an offset from one number and they all landed on
       top of each other: the sideboard was inside the overturned chair and
       the lamp was inside the table. A set is a floor plan, so here is the
       floor plan. */
    const SIDEB = 226, CHAIR = 300, WINX = 330, LAMP = 366, TABLE = 452;

    /* THE WALL IS PAPER, NOT MOSS. ART.wall is a police station: dithered
       institutional green with damp coming through it. A house has paper on
       the wall, a picture rail, a dado and a skirting, and it is warm even
       when it is dark — which is the whole difference between somewhere a
       frog works and somewhere a frog lived. */
    const room = (c, x0, x1, warm) => {
      const base = warm ? '#2c2119' : '#241d1c';
      const lite = warm ? '#3a2c20' : '#2e2523';
      const dark = warm ? '#1c1510' : '#171212';
      px(c, x0, 0, x1 - x0, FY, base);
      /* the paper: a narrow stripe, two shades apart, barely there */
      for (let x = x0; x < x1; x += 6) px(c, x, 0, 2, FY - 26, lite);
      for (let x = x0 + 3; x < x1; x += 12) px(c, x, 0, 1, FY - 26, dark);
      ART.dither(c, x0, 0, x1 - x0, FY, dark, 0.14, 13);
      /* the picture rail, high, with a shadow under it */
      px(c, x0, 22, x1 - x0, 3, lite);
      px(c, x0, 22, x1 - x0, 1, 'rgba(255,255,255,.10)');
      px(c, x0, 25, x1 - x0, 2, 'rgba(0,0,0,.34)');
      /* the dado rail and the darker panelling under it */
      px(c, x0, FY - 30, x1 - x0, 30, dark);
      px(c, x0, FY - 32, x1 - x0, 3, lite);
      px(c, x0, FY - 32, x1 - x0, 1, 'rgba(255,255,255,.10)');
      for (let x = x0 + 4; x < x1; x += 22) {
        px(c, x, FY - 26, 16, 20, 'rgba(255,255,255,.03)');
        px(c, x, FY - 26, 16, 1, 'rgba(255,255,255,.06)');
        px(c, x, FY - 7, 16, 1, 'rgba(0,0,0,.30)');
      }
      /* and the skirting the floor meets */
      px(c, x0, FY - 6, x1 - x0, 6, '#191310');
      px(c, x0, FY - 6, x1 - x0, 1, 'rgba(255,255,255,.07)');
    };

    const paint = (c) => {
      const p = P();
      /* ---- the shell ---- */
      room(c, 0, ARCH + 4, false);                 /* the hall, cooler */
      room(c, ARCH + 4, W, true);                  /* the front room, warmer */
      c.drawImage(ART.floor(W, SCENE.H - FY + 8, { tone: 'board', seed: 5 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0d0b0a');
      /* the ceiling: plaster, and a shadow where it meets the wall */
      px(c, 0, -46, W, 46, '#0a0908');
      px(c, 0, 0, W, 7, '#241d18');
      px(c, 0, 0, W, 1, '#332921');
      px(c, 0, 7, W, 3, 'rgba(0,0,0,.42)');

      /* ---- THE FRONT DOOR, STANDING OPEN ---- */
      px(c, DOOR - 32, 12, 64, FY - 12, '#120f0d');            /* the reveal */
      px(c, DOOR - 35, 10, 70, 4, '#2e241b');                  /* the lintel */
      px(c, DOOR - 35, 10, 70, 1, '#423426');
      px(c, DOOR - 35, 10, 4, FY - 10, '#2a211a');             /* the jambs */
      px(c, DOOR + 31, 10, 4, FY - 10, '#241c16');
      /* the night through the gap: a wet step, rain, a lamp four doors down */
      px(c, DOOR - 28, 14, 56, FY - 20, '#080b11');
      for (let i = 0; i < 54; i++) {
        const rx = DOOR - 27 + ((i * 37) % 54);
        const ry = 15 + ((i * 61) % (FY - 30));
        px(c, rx, ry, 1, 3 + (i % 3), 'rgba(150,180,210,.18)');
      }
      px(c, DOOR - 24, 34, 6, 16, 'rgba(226,206,146,.13)');
      px(c, DOOR - 23, 36, 4, 12, 'rgba(236,216,156,.22)');
      px(c, DOOR - 22, 38, 2, 8, 'rgba(255,240,196,.42)');
      px(c, DOOR - 28, FY - 12, 56, 10, '#101419');            /* the step */
      px(c, DOOR - 28, FY - 12, 56, 1, 'rgba(180,204,226,.20)');
      px(c, DOOR - 20, FY - 10, 14, 2, 'rgba(190,214,236,.14)');
      /* THE DOOR ITSELF, swung inward: a slab stepping away from us, so it
         narrows and darkens as it goes, and its edge catches the hall bulb */
      for (let i = 0; i < 24; i++) {
        const t = i / 23;
        const top = 14 + Math.round(t * 7);
        const bot = FY - 4 - Math.round(t * 3);
        px(c, DOOR + 7 + i, top, 1, bot - top,
          t > 0.8 ? '#241a12' : (t > 0.4 ? '#31241a' : '#3d2e21'));
      }
      px(c, DOOR + 7, 14, 1, FY - 18, 'rgba(255,236,190,.30)');  /* the lit edge */
      px(c, DOOR + 30, 21, 2, FY - 28, '#0f0b08');
      px(c, DOOR + 11, 30, 15, 26, 'rgba(0,0,0,.24)');           /* two panels */
      px(c, DOOR + 11, 30, 15, 1, 'rgba(255,255,255,.07)');
      px(c, DOOR + 12, 62, 13, 22, 'rgba(0,0,0,.24)');
      px(c, DOOR + 12, 62, 13, 1, 'rgba(255,255,255,.06)');
      px(c, DOOR + 26, 66, 4, 3, p.Y);                           /* the knob */
      px(c, DOOR + 26, 66, 4, 1, '#fff0b4');
      /* and the reason it is open. The lock plate is split and the screws
         have come out of the jamb: he did not knock. */
      px(c, DOOR + 30, 60, 4, 12, '#4e535c');
      px(c, DOOR + 30, 65, 4, 2, '#0a0a0c');
      px(c, DOOR + 27, 63, 4, 2, '#767c86');
      px(c, DOOR + 34, 62, 3, 1, '#5a606a');
      px(c, DOOR + 36, 70, 2, 1, '#5a606a');
      for (let i = 0; i < 7; i++) {                              /* splinters */
        px(c, DOOR + 33 + (i % 3), 58 + i * 3, 2, 1, '#4a3826');
      }

      /* ---- THE HALL ---- */
      /* the pendant, drawn, so the light in this room comes from somewhere */
      /* the pendant hangs INTO the frame: a light with no fitting under it
         is a white star floating on the wallpaper */
      px(c, 119, 0, 2, 14, '#241c14');
      px(c, 110, 14, 20, 3, '#0f0c0a');
      px(c, 111, 14, 18, 2, '#4a3a26');
      for (let i = 0; i < 9; i++) {
        px(c, 112 + i, 17, 16 - i * 2, 1, i < 4 ? '#3e3022' : '#2c2216');
      }
      px(c, 117, 18, 6, 4, 'rgba(255,244,206,.85)');
      px(c, 118, 19, 4, 3, '#fff6d6');
      /* a runner up the middle of the boards, rucked at one end */
      px(c, 84, FY - 2, 118, 9, '#251a1e');
      px(c, 84, FY - 2, 118, 1, '#31232a');
      for (let x = 88; x < 200; x += 9) px(c, x, FY, 1, 6, 'rgba(0,0,0,.26)');
      px(c, 190, FY - 6, 18, 6, '#2c1f26');
      px(c, 190, FY - 6, 18, 1, '#3a2933');
      /* coat hooks on a board, one coat up, one on the floor */
      px(c, 88, 40, 50, 5, '#2c2118');
      px(c, 88, 40, 50, 1, '#3e3024');
      px(c, 88, 45, 50, 1, 'rgba(0,0,0,.40)');
      for (let i = 0; i < 3; i++) {
        px(c, 96 + i * 16, 45, 3, 5, '#6a6f78');
        px(c, 96 + i * 16, 48, 5, 2, '#7c828c');
      }
      px(c, 94, 50, 16, 36, '#1d242c');                          /* the coat still up */
      px(c, 94, 50, 16, 2, '#28313b');
      px(c, 94, 74, 16, 1, 'rgba(0,0,0,.34)');
      px(c, 106, 52, 4, 30, 'rgba(0,0,0,.26)');
      px(c, 120, FY - 10, 30, 10, '#232a33');                     /* and one down */
      px(c, 120, FY - 10, 30, 1, '#2e3742');
      px(c, 126, FY - 6, 10, 6, 'rgba(0,0,0,.34)');
      /* the hall table, and the telephone off it */
      px(c, HALL - 6, FY - 34, 42, 5, '#3b2b1d');
      px(c, HALL - 6, FY - 34, 42, 1, '#54402c');
      px(c, HALL - 6, FY - 29, 42, 2, 'rgba(0,0,0,.40)');
      px(c, HALL - 3, FY - 27, 4, 25, '#2c2016');
      px(c, HALL + 31, FY - 27, 4, 25, '#2c2016');
      px(c, HALL + 10, FY - 38, 16, 5, '#141a1e');               /* the base, still up */
      px(c, HALL + 10, FY - 38, 16, 1, '#242c32');
      px(c, HALL + 4, FY - 8, 16, 8, '#0f1317');                 /* the handset, on the boards */
      px(c, HALL + 4, FY - 8, 16, 1, '#1e242a');
      px(c, HALL + 7, FY - 10, 10, 3, '#161c22');
      for (let i = 0; i < 14; i++) {                             /* and the cord */
        px(c, HALL + 20 + i, FY - 10 - Math.round(Math.sin(i * 0.8) * 3) - i,
          1, 1, '#0c0f13');
      }
      /* a picture, hanging crooked, its glass gone */
      px(c, 250, 30, 30, 26, '#0e0b09');
      px(c, 251, 31, 28, 24, '#33261a');
      px(c, 254, 34, 22, 18, '#37444c');
      px(c, 257, 37, 7, 11, '#5a686e');
      px(c, 266, 36, 7, 12, '#4c5a62');
      for (let i = 0; i < 6; i++) {
        px(c, 254 + i * 4, 34 + (i % 3) * 5, 6, 1, 'rgba(255,255,255,.20)');
      }
      px(c, 263, 25, 1, 6, '#4a4038');
      px(c, 258, 58, 8, 2, 'rgba(255,255,255,.13)');             /* glass on the floor */

      /* ---- THE ARCHWAY into the front room ---- */
      px(c, ARCH, 12, 6, FY - 12, '#100d0b');
      px(c, ARCH - 3, 10, 12, 4, '#2e241b');
      px(c, ARCH + 5, 12, 2, FY - 12, 'rgba(255,255,255,.06)');
      px(c, ARCH - 1, 12, 1, FY - 12, 'rgba(0,0,0,.44)');

      /* ---- THE FRONT ROOM ---- */
      /* the rug, and the stain on it nobody is going to talk about */
      px(c, CHAIR - 12, FY - 1, 208, 11, '#2b2124');
      px(c, CHAIR - 12, FY - 1, 208, 1, '#3a2c30');
      ART.dither(c, CHAIR - 12, FY - 1, 208, 10, '#1e1618', 0.32, 19);
      for (let x = CHAIR - 8; x < CHAIR + 190; x += 20) {
        px(c, x, FY + 2, 12, 5, 'rgba(70,48,44,.30)');
      }
      px(c, CHAIR + 62, FY + 2, 34, 7, 'rgba(24,8,9,.66)');
      px(c, CHAIR + 72, FY + 1, 18, 2, 'rgba(38,10,11,.5)');

      /* the sideboard with the wireless, untouched, which is its own kind of
         wrong: nobody came here for the silver */
      px(c, SIDEB, FY - 34, 58, 32, '#33261a');
      px(c, SIDEB, FY - 34, 58, 2, '#4a3624');
      px(c, SIDEB + 4, FY - 28, 22, 18, 'rgba(0,0,0,.34)');
      px(c, SIDEB + 28, FY - 28, 22, 18, 'rgba(0,0,0,.34)');
      px(c, SIDEB + 12, FY - 22, 6, 2, p.Y);
      px(c, SIDEB + 36, FY - 22, 6, 2, p.Y);
      px(c, SIDEB + 8, FY - 48, 34, 15, '#3e2e1e');
      px(c, SIDEB + 8, FY - 48, 34, 1, '#54402a');
      px(c, SIDEB + 13, FY - 44, 14, 9, '#191920');
      for (let i = 0; i < 4; i++) px(c, SIDEB + 14, FY - 43 + i * 2, 12, 1, 'rgba(200,200,180,.16)');
      px(c, SIDEB + 32, FY - 43, 4, 4, p.Y);
      px(c, SIDEB + 32, FY - 38, 4, 2, '#5a4a2c');
      /* the wedding photograph over it, hanging crooked, its glass gone */
      px(c, SIDEB + 10, 30, 30, 26, '#0e0b09');
      px(c, SIDEB + 11, 31, 28, 24, '#33261a');
      px(c, SIDEB + 14, 34, 22, 18, '#37444c');
      px(c, SIDEB + 17, 37, 7, 11, '#5a686e');
      px(c, SIDEB + 26, 36, 7, 12, '#4c5a62');
      for (let i = 0; i < 6; i++) {
        px(c, SIDEB + 14 + i * 4, 34 + (i % 3) * 5, 6, 1, 'rgba(255,255,255,.20)');
      }
      px(c, SIDEB + 23, 25, 1, 6, '#4a4038');
      px(c, SIDEB + 18, 58, 8, 2, 'rgba(255,255,255,.13)');      /* glass, on the boards */

      /* HER CHAIR, ON ITS SIDE.

         The first go at this was a mass with two bars sticking out of it and
         it read as a crate. What makes a chair a chair is that you can SEE
         THROUGH THE BACK OF IT: four spindles with wall between them. Lying
         down, that back is a horizontal, its spindles point sideways at you,
         two legs are off the floor and two are on it, and no other object in
         a room looks remotely like that. */
      const chY = FY - 2;                   /* the boards it is lying on */
      /* the seat, edge on: a slab with the cushion piped along the top */
      px(c, CHAIR + 16, chY - 26, 40, 26, '#0d0a0b');
      px(c, CHAIR + 18, chY - 24, 36, 22, '#33262c');
      px(c, CHAIR + 18, chY - 24, 36, 2, '#463441');
      px(c, CHAIR + 50, chY - 24, 4, 22, 'rgba(0,0,0,.42)');
      px(c, CHAIR + 21, chY - 20, 30, 14, 'rgba(255,255,255,.05)');
      px(c, CHAIR + 21, chY - 20, 30, 1, 'rgba(255,255,255,.12)');
      px(c, CHAIR + 21, chY - 7, 30, 1, 'rgba(0,0,0,.34)');
      /* THE BACK, now a horizontal: two rails with four spindles between
         them, and the room showing through the gaps */
      px(c, CHAIR - 12, chY - 30, 30, 5, '#0d0a0b');
      px(c, CHAIR - 11, chY - 29, 28, 3, '#4a3744');
      px(c, CHAIR - 11, chY - 29, 28, 1, '#5e4756');
      px(c, CHAIR - 12, chY - 9, 30, 5, '#0d0a0b');
      px(c, CHAIR - 11, chY - 8, 28, 3, '#3a2a34');
      px(c, CHAIR - 11, chY - 8, 28, 1, '#4c3846');
      for (let i = 0; i < 4; i++) {
        const sx = CHAIR - 8 + i * 7;
        px(c, sx - 1, chY - 27, 5, 19, '#0d0a0b');
        px(c, sx, chY - 26, 3, 17, '#3e2d38');
        px(c, sx, chY - 26, 1, 17, 'rgba(255,255,255,.10)');
        px(c, sx + 2, chY - 26, 1, 17, 'rgba(0,0,0,.34)');
      }
      /* TWO LEGS OFF THE FLOOR, pointing at you, with feet on the ends */
      px(c, CHAIR + 22, chY - 42, 8, 18, '#0d0a0b');
      px(c, CHAIR + 23, chY - 41, 6, 17, '#2a1f26');
      px(c, CHAIR + 23, chY - 41, 2, 17, 'rgba(255,255,255,.08)');
      px(c, CHAIR + 21, chY - 44, 10, 4, '#0d0a0b');
      px(c, CHAIR + 22, chY - 43, 8, 2, '#3e2d38');
      px(c, CHAIR + 42, chY - 38, 8, 14, '#0d0a0b');
      px(c, CHAIR + 43, chY - 37, 6, 13, '#2a1f26');
      px(c, CHAIR + 43, chY - 37, 2, 13, 'rgba(255,255,255,.08)');
      px(c, CHAIR + 41, chY - 40, 10, 4, '#0d0a0b');
      px(c, CHAIR + 42, chY - 39, 8, 2, '#3e2d38');
      /* and the two that are still on the boards, foreshortened */
      px(c, CHAIR + 26, chY - 4, 7, 5, '#241a20');
      px(c, CHAIR + 26, chY - 4, 7, 1, '#38292f');
      px(c, CHAIR + 44, chY - 3, 7, 4, '#241a20');
      px(c, CHAIR + 44, chY - 3, 7, 1, '#38292f');
      /* the shadow it throws on the rug */
      px(c, CHAIR - 14, chY, 74, 4, 'rgba(0,0,0,.34)');
      px(c, CHAIR - 8, chY + 3, 58, 3, 'rgba(0,0,0,.22)');

      /* THE WINDOW, SASH UP: he came in and he went out the same way. */
      const wx = WINX, wy = 14, ww = 68, wh = 50;
      px(c, wx - 4, wy - 4, ww + 8, wh + 8, '#0e0b09');
      px(c, wx, wy, ww, wh, '#070a10');
      px(c, wx, wy + 28, ww, wh - 28, '#0b0f16');               /* the wet road */
      px(c, wx, wy + 34, ww, 2, 'rgba(150,176,200,.10)');
      px(c, wx + 10, wy + 6, 5, 18, 'rgba(226,206,146,.14)');   /* the street lamp */
      px(c, wx + 11, wy + 8, 3, 14, 'rgba(240,220,160,.24)');
      px(c, wx + 8, wy + 32, 9, 12, 'rgba(226,206,146,.10)');
      for (let i = 0; i < 40; i++) {
        px(c, wx + 2 + ((i * 29) % (ww - 4)), wy + 2 + ((i * 43) % (wh - 6)), 1, 4,
          'rgba(158,186,214,.20)');
      }
      /* the lower sash pushed right up: the gap is the top half of the hole */
      px(c, wx - 2, wy + 22, ww + 4, 5, '#2a2118');
      px(c, wx - 2, wy + 22, ww + 4, 1, '#3e3024');
      px(c, wx - 2, wy + 26, ww + 4, 1, 'rgba(0,0,0,.44)');
      px(c, wx + Math.round(ww / 2) - 1, wy + 27, 2, wh - 27, '#2a2118');
      px(c, wx, wy + 38, ww, 2, '#2a2118');
      px(c, wx - 4, wy + wh, ww + 8, 5, '#33261a');              /* the sill */
      px(c, wx - 4, wy + wh, ww + 8, 1, '#4a3826');
      px(c, wx - 6, wy + wh + 4, ww + 12, 3, '#241a12');
      /* the curtain, lifted by the wind coming in over the sill */
      for (let i = 0; i < 18; i++) {
        const h = 44 - Math.round(Math.sin(i * 0.40) * 9);
        px(c, wx + ww + 2 + i, wy - 2, 1, h, i % 4 ? '#2a2028' : '#352632');
      }
      px(c, wx + ww + 2, wy - 4, 18, 3, '#3e2e38');
      px(c, wx + ww + 2, wy - 4, 18, 1, '#4e3a46');
      /* and the light it throws down onto the boards, PAINTED rather than
         lit: a shaft that comes from a lamp object moves with the lamp, and
         moonlight through a sash does not move */
      for (let i = 0; i < 10; i++) {
        const t = i / 9;
        px(c, wx - 10 - Math.round(t * 34), wy + wh + 6 + Math.round(t * 40),
          Math.round(ww * (0.5 + t * 0.8)), 5,
          'rgba(180,204,230,' + (0.05 - t * 0.004).toFixed(3) + ')');
      }

      /* the standing lamp, down, shade still on the end of it */
      px(c, LAMP, FY - 8, 56, 5, '#3a3038');
      px(c, LAMP, FY - 8, 56, 1, '#50434c');
      px(c, LAMP - 6, FY - 11, 10, 8, '#2a2228');                /* the base */
      px(c, LAMP + 56, FY - 16, 20, 14, '#4a3a2c');              /* the shade */
      px(c, LAMP + 56, FY - 16, 20, 2, '#624c38');
      px(c, LAMP + 60, FY - 12, 12, 10, 'rgba(0,0,0,.34)');

      /* THE LOW TABLE, and on it the only thing in this house that matters */
      px(c, TABLE - 6, FY - 38, 62, 6, '#40301f');
      px(c, TABLE - 6, FY - 38, 62, 1, '#5c4630');
      px(c, TABLE - 6, FY - 32, 62, 2, 'rgba(0,0,0,.42)');
      px(c, TABLE - 2, FY - 30, 5, 28, '#2e2216');
      px(c, TABLE + 47, FY - 30, 5, 28, '#2e2216');
      px(c, TABLE + 4, FY - 16, 44, 3, '#241a10');
      /* two cups. One of them has been over for six hours. */
      px(c, TABLE + 4, FY - 45, 9, 7, '#c0b7a2');
      px(c, TABLE + 4, FY - 45, 9, 1, '#ded4bc');
      px(c, TABLE + 13, FY - 43, 2, 4, '#a8a08c');
      px(c, TABLE + 20, FY - 41, 10, 3, '#c0b7a2');              /* over on its side */
      px(c, TABLE + 20, FY - 41, 10, 1, '#ded4bc');
      px(c, TABLE + 30, FY - 40, 9, 2, 'rgba(86,66,38,.6)');     /* and what came out */
      px(c, TABLE + 22, FY - 38, 14, 1, 'rgba(86,66,38,.38)');
      /* the ashtray, and his cigarette in it, still where he left it */
      c.drawImage(ART.art('ashtray', 1), TABLE + 30, FY - 45);
      px(c, TABLE + 36, FY - 44, 5, 2, '#e8dcc0');
      px(c, TABLE + 41, FY - 44, 2, 2, '#8a2418');

      /* the hall a shade under the front room, so the eye goes right */
      px(c, 0, 0, ARCH, FY, 'rgba(6,6,10,.20)');
    };

    const spots = [
      { id: 'chair', x: CHAIR + 28, w: 60, top: FY - 46, bot: FY + 4,
        label: 'HER CHAIR', hint: 'LOOK' },
      { id: 'window', x: WINX + 34, w: 74, top: 12, bot: 70,
        label: 'THE WINDOW', hint: 'LOOK' },
      { id: 'table', x: TABLE + 24, w: 62, top: FY - 48, bot: FY + 2,
        label: 'THE TABLE', hint: 'LOOK' },
    ];

    return {
      id: 'cut_house', w: W, floorY: FY, paint, spots, actors: [],
      enterX: DOOR + 4, enterFace: 1,
      lights: [
        { x: 120, y: 20, r: 44, a: 0.17, fy: FY },
        { x: WINX + 34, y: 34, r: 58, a: 0.13, fy: FY - 2, bare: true },
        { x: TABLE + 24, y: FY - 54, r: 30, a: 0.11, fy: FY - 34, bare: true },
      ],
      marks: { DOOR, HALL, ARCH, ROOM: CHAIR + 20, TABLE: TABLE + 24 },
    };
  }

  /* ============================================================
     ORLY — the security hall, at night, three weeks later.

     The first real decision in the game happens in a room you
     can walk about in, at a counter, with two officers behind
     it: hand the iron over and lose it, or put it through the
     machine in your case and find out what that costs.
     ============================================================ */
  function orly() {
    const W = 520, FY = 108;
    const BOARD = 44, COUNT = 300, ARCHX = 372;
    /* THE COUNTER TOP, at the height a counter actually is: a frog stands
       about forty-seven room rows tall, so a top at twenty-six leaves his
       head and shoulders over it. At thirty-four he was a head on a wall. */
    const CTOP = FY - 26;

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'grey', railY: 78, seed: 3 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 8, { tone: 'lino', seed: 8 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0b0e13');
      px(c, 0, -40, W, 46, '#0a0d12');
      px(c, 0, 6, W, 3, '#1a2029');
      px(c, 0, 9, W, 2, 'rgba(0,0,0,.40)');

      /* ---- THE APRON, through a wall of glass ---- */
      const GY = 16, GH = 50;
      px(c, 0, GY - 3, W, GH + 6, '#070a11');
      for (let y = GY; y < GY + 26; y++) {
        const t = (y - GY) / 26;
        px(c, 0, y, W, 1, DAY.rgb(DAY.mix([9, 12, 22], [17, 21, 34], t)));
      }
      px(c, 0, GY + 26, W, GH - 26, '#0e1219');
      px(c, 0, GY + 26, W, 1, 'rgba(120,150,180,.10)');
      /* runway lights, receding to a point */
      for (let i = 0; i < 26; i++) {
        px(c, 10 + i * 20, GY + 30 + (i % 3), 2, 1,
          i % 4 ? 'rgba(226,196,116,.55)' : 'rgba(150,220,255,.55)');
      }
      /* ONE AIRCRAFT, SIDE ON. Drawn tail-on first, which from across an
         apron is a cross on a stick: nobody reads an aeroplane from behind.
         Side on it is a nose, a row of windows, a fin at one end and two
         engines slung under a wing, and it reads at a glance. */
      const ax = 214, ay = GY + 16;
      px(c, ax + 10, ay, 118, 14, '#333b48');                  /* the fuselage */
      px(c, ax + 10, ay, 118, 2, '#525c6a');
      px(c, ax + 10, ay + 11, 118, 3, '#161b22');              /* the dark belly */
      for (let i = 0; i < 6; i++) {                            /* the nose, stepped */
        px(c, ax + 10 - i * 2, ay + 1 + i, 3, 13 - i * 2, '#333b48');
        px(c, ax + 10 - i * 2, ay + 1 + i, 3, 1, '#4a5462');
      }
      px(c, ax + 2, ay + 4, 6, 4, '#0d1218');                  /* the flight deck */
      px(c, ax + 3, ay + 5, 4, 2, 'rgba(180,214,244,.44)');
      for (let i = 0; i < 11; i++) px(c, ax + 26 + i * 8, ay + 4, 4, 3, 'rgba(206,226,250,.40)');
      px(c, ax + 122, ay + 2, 4, 10, '#2c333e');               /* the tail cone */
      /* the fin, wide at the root and narrow at the tip, raked back */
      for (let i = 0; i < 16; i++) {
        px(c, ax + 108 + Math.round(i * 0.7), ay - i, 14 - Math.round(i * 0.55), 1,
          i > 12 ? '#3e4854' : '#333b48');
      }
      px(c, ax + 108, ay - 15, 7, 2, '#5a6472');
      px(c, ax + 116, ay - 6, 22, 3, '#2c333e');               /* the tailplane */
      px(c, ax + 116, ay - 6, 22, 1, '#414b57');
      /* the wing coming at us, and the engines under it */
      px(c, ax + 38, ay + 13, 60, 5, '#28303a');
      px(c, ax + 38, ay + 13, 60, 1, '#3e4854');
      px(c, ax + 36, ay + 16, 5, 3, 'rgba(255,90,80,.7)');     /* the nav light */
      px(c, ax + 50, ay + 17, 16, 7, '#242c36');
      px(c, ax + 50, ay + 17, 16, 1, '#3a4450');
      px(c, ax + 74, ay + 17, 16, 7, '#242c36');
      px(c, ax + 74, ay + 17, 16, 1, '#3a4450');
      px(c, ax + 20, ay + 24, 8, 5, '#171c23');                /* the gear */
      px(c, ax + 66, ay + 24, 10, 5, '#171c23');
      /* and the steps up to the door, with a light at the top of them */
      for (let i = 0; i < 8; i++) px(c, ax + 132 + i * 2, ay + 4 + i * 3, 12 - i, 2, '#2a323c');
      px(c, ax + 128, ay + 2, 5, 5, 'rgba(240,220,150,.30)');

      /* the mullions, in front of all of it */
      for (let x = 0; x < W; x += 44) px(c, x, GY - 3, 5, GH + 6, '#1a2029');
      px(c, 0, GY - 3, W, 3, '#1a2029');
      px(c, 0, GY + GH, W, 5, '#1a2029');
      px(c, 0, GY + GH, W, 1, '#2c343f');

      /* ---- THE DEPARTURES BOARD, split-flap ---- */
      const by = 24;
      px(c, BOARD - 3, by - 3, 90, 40, p.K);
      px(c, BOARD, by, 84, 34, '#0c0f12');
      px(c, BOARD, by, 84, 1, '#242a32');
      for (let r = 0; r < 5; r++) {
        const ry = by + 3 + r * 6;
        px(c, BOARD + 2, ry, 80, 5, '#12161b');
        px(c, BOARD + 2, ry + 2, 80, 1, 'rgba(0,0,0,.62)');
        for (let i = 0; i < 3; i++) px(c, BOARD + 4 + i * 3, ry + 1, 2, 3, '#8e8e7c');
        for (let i = 0; i < 8; i++) {
          px(c, BOARD + 18 + i * 4, ry + 1, 3, 3, r === 1 ? '#d8c07c' : '#7e8474');
        }
        px(c, BOARD + 62, ry + 1, 3, 3, '#8e8e7c');
        px(c, BOARD + 70, ry + 1, 8, 3, r === 1 ? '#8a7a4a' : '#5e6458');
      }
      px(c, BOARD + 16, by + 8, 48, 6, 'rgba(226,196,116,.09)');

      /* ---- THE HALL SIDE OF THE COUNTER: the sign, and a queue rail ---- */
      px(c, COUNT - 122, CTOP - 30, 66, 22, p.K);
      px(c, COUNT - 121, CTOP - 29, 64, 20, '#b0a488');
      px(c, COUNT - 121, CTOP - 29, 64, 1, '#c8bc9e');
      for (let r = 0; r < 3; r++) px(c, COUNT - 116, CTOP - 25 + r * 5, 52 - r * 12, 2, '#373226');
      px(c, COUNT - 116, CTOP - 14, 16, 2, '#8a2418');
      for (let i = 0; i < 4; i++) {
        px(c, 120 + i * 34, FY - 26, 3, 26, '#3a414c');
        px(c, 120 + i * 34, FY - 28, 5, 3, '#535c69');
        px(c, 120 + i * 34, FY - 28, 5, 1, '#6c7683');
        if (i) px(c, 120 + (i - 1) * 34, FY - 24, 34, 2, 'rgba(198,182,112,.30)');
        if (i) px(c, 120 + (i - 1) * 34, FY - 22, 34, 1, 'rgba(0,0,0,.34)');
      }

      /* ---- THE X-RAY, standing ON the counter, so it is behind the cast ---- */
      const mx = ARCHX;
      px(c, mx, CTOP - 42, 96, 42, '#303844');
      px(c, mx, CTOP - 42, 96, 3, '#4a5462');
      px(c, mx + 88, CTOP - 42, 8, 42, 'rgba(0,0,0,.36)');
      px(c, mx + 8, CTOP - 34, 32, 30, '#0b0e12');             /* the mouth */
      for (let i = 0; i < 11; i++) px(c, mx + 9 + i * 3, CTOP - 34, 2, 25, '#282d36');
      px(c, mx + 50, CTOP - 34, 36, 22, '#0d151c');            /* the screen */
      px(c, mx + 52, CTOP - 32, 32, 18, '#153029');
      for (let i = 0; i < 7; i++) {
        px(c, mx + 54 + i * 4, CTOP - 28 + (i % 3) * 4, 3, 3, 'rgba(110,236,182,.38)');
      }
      px(c, mx + 52, CTOP - 32, 32, 1, 'rgba(110,236,182,.20)');
      px(c, mx + 20, CTOP - 46, 4, 4, 'rgba(255,90,70,.7)');   /* the lamp on top */
    };

    /* ---- and what is IN FRONT of everybody: the counter itself ---- */
    const fore = (c) => {
      px(c, COUNT - 130, CTOP, 300, 9, '#2c333d');
      px(c, COUNT - 130, CTOP, 300, 2, '#4a5461');
      px(c, COUNT - 130, CTOP, 300, 1, '#5e6a78');
      px(c, COUNT - 130, CTOP + 9, 300, 12, '#191e25');
      for (let x = COUNT - 126; x < COUNT + 168; x += 18) {
        px(c, x, CTOP + 11, 1, 9, 'rgba(0,0,0,.30)');
        px(c, x + 1, CTOP + 11, 1, 9, 'rgba(255,255,255,.03)');
      }
      /* a kickboard set back under it, so it is furniture and not masonry */
      px(c, COUNT - 126, CTOP + 21, 292, 3, '#0e1216');
      px(c, COUNT - 126, CTOP + 21, 292, 1, 'rgba(255,255,255,.05)');
      /* two trays on the near edge, one of them empty and waiting */
      px(c, COUNT - 44, CTOP - 5, 30, 6, '#4a3a22');
      px(c, COUNT - 44, CTOP - 5, 30, 2, '#67532f');
      px(c, COUNT - 40, CTOP - 3, 22, 3, 'rgba(0,0,0,.40)');
      px(c, COUNT + 6, CTOP - 4, 28, 5, '#3e3222');
      px(c, COUNT + 6, CTOP - 4, 28, 1, '#584626');
      /* somebody's case, up on the belt end */
      px(c, COUNT + 96, CTOP - 12, 28, 12, '#3a2a1c');
      px(c, COUNT + 96, CTOP - 12, 28, 2, '#523c28');
      px(c, COUNT + 106, CTOP - 15, 8, 4, '#2c2016');
      px(c, COUNT + 96, CTOP - 6, 28, 1, 'rgba(0,0,0,.40)');
    };

    const spots = [
      { id: 'tray', x: COUNT - 30, w: 36, top: CTOP - 12, bot: CTOP + 6,
        label: 'THE TRAY', hint: 'HAND IT IN' },
      { id: 'belt', x: ARCHX + 26, w: 44, top: CTOP - 40, bot: CTOP + 4,
        label: 'THE MACHINE', hint: 'LET IT RIDE' },
    ];

    return {
      id: 'cut_orly', w: W, floorY: FY, paint, fore, spots,
      actors: [
        { id: 'guard', x: COUNT - 6, y: FY - 4, face: -1, still: true,
          key: 'orlyGuard', def: GUARD_DEF, job: 'watch', profile: false,
          tag: 'DOUANE', tagCol: PIX.PAL.B },
        { id: 'clerk', x: COUNT + 150, y: FY - 4, face: -1, still: true,
          key: 'orlyClerk', def: CLERK_DEF, job: 'notes', profile: false },
      ],
      enterX: 60, enterFace: 1,
      lights: [
        { x: 90, y: 8, r: 60, a: 0.13, fy: FY, bare: true },
        { x: COUNT + 20, y: 10, r: 78, a: 0.19, fy: CTOP, bare: true },
        { x: W - 70, y: 8, r: 54, a: 0.12, fy: FY, bare: true },
      ],
      marks: { COUNT, BOARD, ARCHX },
    };
  }

  /* ============================================================
     THE CABIN — three hours over the water, and then the lights.
     ============================================================ */
  function cabin(lit) {
    const W = 320, FY = 104;

    const paint = (c) => {
      const p = P();
      /* the tube: a curved ceiling, bins down both sides, the aisle floor */
      px(c, 0, -30, W, 40, '#0c1014');
      px(c, 0, 6, W, FY - 6, '#242a2e');
      ART.dither(c, 0, 6, W, FY - 6, '#1a1f23', 0.2, 11);
      for (let x = 0; x < W; x += 1) {
        const t = Math.abs(x % 64 - 32) / 32;
        px(c, x, 6, 1, 4 + Math.round(t * 2), '#1a1f24');
      }
      px(c, 0, 10, W, 2, 'rgba(255,255,255,.05)');
      /* the overhead bins, latched */
      px(c, 0, 14, W, 18, '#2c3238');
      px(c, 0, 14, W, 2, '#3e464e');
      px(c, 0, 30, W, 2, 'rgba(0,0,0,.42)');
      for (let x = 6; x < W; x += 44) {
        px(c, x, 16, 40, 14, '#262c32');
        px(c, x, 16, 40, 1, '#363e46');
        px(c, x + 34, 22, 4, 3, '#5a626c');
      }
      /* reading lights, a couple of them on, each with a housing under it
         so the light in this tube comes out of something */
      for (let x = 24; x < W; x += 44) {
        const on = !(x % 88);
        px(c, x - 1, 11, 6, 3, '#1c2228');
        px(c, x, 12, 4, 2, on ? 'rgba(248,230,166,.72)' : '#2a3038');
        if (on) px(c, x + 1, 12, 2, 1, '#fff4d2');
      }
      /* the air vent strip, and the curve of the sidewall under the bins */
      px(c, 0, 34, W, 2, '#1e242a');
      for (let x = 2; x < W; x += 5) px(c, x, 34, 2, 1, 'rgba(0,0,0,.42)');
      px(c, 0, 36, W, 1, 'rgba(255,255,255,.05)');
      /* the windows: ovals, and what is out of them */
      for (let i = 0; i < 5; i++) {
        const wx = 22 + i * 60, wy = 40;
        px(c, wx - 2, wy - 2, 30, 26, '#1c2228');
        px(c, wx - 2, wy - 2, 30, 1, '#2e363e');
        px(c, wx, wy, 26, 22, '#070a10');
        /* rounded corners, so they are ovals and not portholes */
        px(c, wx, wy, 3, 3, '#1c2228'); px(c, wx + 23, wy, 3, 3, '#1c2228');
        px(c, wx, wy + 19, 3, 3, '#1c2228'); px(c, wx + 23, wy + 19, 3, 3, '#1c2228');
        if (lit) {
          /* PARIS, FROM EIGHT THOUSAND FEET. A grid, and the two rivers
             of light that are the boulevards. */
          for (let k = 0; k < 44; k++) {
            const gx = wx + 2 + ((k * 17) % 22), gy = wy + 4 + ((k * 29) % 16);
            px(c, gx, gy, 1, 1, k % 5 ? 'rgba(240,220,150,.7)' : 'rgba(255,240,200,.9)');
          }
          for (let k = 0; k < 10; k++) {
            px(c, wx + 3 + k * 2, wy + 8 + Math.round(Math.sin(k * 0.8) * 3), 2, 1,
              'rgba(255,236,190,.8)');
          }
        } else {
          for (let k = 0; k < 7; k++) {
            px(c, wx + 3 + ((k * 11) % 20), wy + 3 + ((k * 7) % 16), 1, 1,
              'rgba(200,220,255,.34)');
          }
        }
        px(c, wx + 1, wy + 1, 24, 1, 'rgba(255,255,255,.07)');
      }
      /* the seats, in profile, three rows of them */
      for (let i = 0; i < 4; i++) {
        const sx = 18 + i * 78;
        px(c, sx - 1, FY - 50, 36, 48, '#0d0b10');             /* ink round the whole seat */
        px(c, sx, FY - 42, 34, 40, '#2a2230');
        px(c, sx + 30, FY - 42, 4, 40, 'rgba(0,0,0,.36)');
        /* the headrest: narrower than the back, with a seam under it */
        px(c, sx + 3, FY - 49, 26, 9, '#332a3c');
        px(c, sx + 3, FY - 49, 26, 2, '#4a3e58');
        px(c, sx + 3, FY - 41, 26, 1, 'rgba(0,0,0,.44)');
        px(c, sx + 2, FY - 40, 28, 20, '#332a3c');             /* the back cushion */
        px(c, sx + 2, FY - 40, 28, 1, '#443a50');
        for (let k = 0; k < 3; k++) {
          px(c, sx + 4, FY - 36 + k * 6, 24, 1, 'rgba(0,0,0,.26)');
        }
        px(c, sx - 2, FY - 20, 42, 8, '#241d2a');              /* the seat pan */
        px(c, sx - 2, FY - 20, 42, 2, '#3a3040');
        px(c, sx - 2, FY - 13, 42, 1, 'rgba(0,0,0,.44)');
        px(c, sx + 32, FY - 30, 6, 12, '#1e1824');             /* the armrest */
        px(c, sx + 32, FY - 30, 6, 1, '#342b3c');
        px(c, sx + 4, FY - 12, 6, 10, '#191320');              /* two legs */
        px(c, sx + 24, FY - 12, 6, 10, '#191320');
        px(c, sx + 4, FY - 3, 30, 3, 'rgba(0,0,0,.36)');
        px(c, sx + 6, FY - 46, 4, 4, 'rgba(255,255,255,.07)');
        /* a tray table folded up on the back of it */
        px(c, sx + 6, FY - 26, 20, 2, '#241d2a');
        px(c, sx + 6, FY - 26, 20, 1, 'rgba(255,255,255,.08)');
      }
      c.drawImage(ART.floor(W, SCENE.H - FY + 8, { tone: 'lino', seed: 2 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0b0e12');
      px(c, 0, FY, W, 4, '#1a2028');                            /* the aisle runner */
      px(c, 0, FY, W, 1, '#242c36');
    };

    return {
      id: 'cut_cabin' + (lit ? '_lit' : ''), w: W, floorY: FY, paint,
      spots: [{ id: 'window', x: 142, w: 32, top: 38, bot: 66,
        label: 'THE WINDOW', hint: 'LOOK OUT' }],
      actors: [],
      enterX: 60, enterFace: 1,
      lights: [
        { x: 68, y: 14, r: 40, a: 0.12, fy: FY },
        { x: 200, y: 14, r: 44, a: 0.14, fy: FY },
      ],
    };
  }

  /* ============================================================
     36 QUAI DES ORFEVRES — the captain's office, where the badge
     gets signed or does not.

     The exam used to be held up on a painted card while the
     captain talked over it. It is a room: he is behind the desk
     in it, the window behind him has Paris in it, and the paper
     is on the blotter in front of you.
     ============================================================ */
  function office(stamped) {
    const W = 300, FY = 108;

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'green', railY: 70, seed: 17 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 8, { tone: 'board', seed: 9 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0c1013');
      px(c, 0, -40, W, 48, '#0a0d11');
      px(c, 0, 8, W, 2, '#182028');

      /* the window behind him, and Paris in it at four in the morning */
      const wx = 176, wy = 18, ww = 96, wh = 52;
      px(c, wx - 3, wy - 3, ww + 6, wh + 6, p.K);
      px(c, wx, wy, ww, wh, '#0b1018');
      for (let i = 0; i < 90; i++) {
        const lx = wx + 2 + ((i * 19) % (ww - 4));
        const ly = wy + 20 + ((i * 31) % (wh - 22));
        px(c, lx, ly, 1, 1, i % 6 ? 'rgba(230,206,140,.5)' : 'rgba(250,236,190,.8)');
      }
      /* the roofline, mansards narrow at the ridge */
      for (let x = 0; x < ww; x += 12) {
        const rh = 8 + ((x / 12) % 3) * 3;
        px(c, wx + x, wy + 18 - rh, 12, rh, '#131820');
        px(c, wx + x + 3, wy + 18 - rh - 3, 6, 3, '#131820');
        px(c, wx + x + 4, wy + 20 - rh, 2, 2, 'rgba(240,214,150,.5)');
      }
      px(c, wx, wy, ww, 1, 'rgba(255,255,255,.07)');
      px(c, wx + ww / 2 - 1, wy, 2, wh, '#1c232c');
      px(c, wx, wy + 24, ww, 2, '#1c232c');
      /* rain on the glass */
      for (let i = 0; i < 22; i++) {
        px(c, wx + 3 + ((i * 41) % (ww - 6)), wy + 2 + ((i * 17) % (wh - 8)), 1, 4,
          'rgba(170,200,225,.14)');
      }

      /* filing cabinets and a board of faces down the left */
      c.drawImage(ART.cabinet(40, 60, 1, 5), 14, FY - 60);
      c.drawImage(ART.corkboard(56, 40, 7), 62, 22);
      /* the tricolour on a stand, because this is a French police station.
         Dropped two thirds of the way to the room's own value: a flag at
         full saturation in a noir interior is a poster. */
      px(c, 104, FY - 68, 2, 66, '#3a3028');
      px(c, 106, FY - 68, 8, 16, '#25314f');
      px(c, 114, FY - 68, 8, 16, '#a49c8c');
      px(c, 122, FY - 68, 8, 16, '#6a2a26');
      px(c, 106, FY - 68, 24, 1, 'rgba(255,255,255,.13)');
      px(c, 106, FY - 53, 24, 1, 'rgba(0,0,0,.40)');
      px(c, 106, FY - 60, 24, 1, 'rgba(0,0,0,.20)');
    };

    /* THE DESK GOES IN FRONT OF HIM. He is behind it, which is the whole
       point of a captain and a desk, and a room painted in one layer draws
       his knees over the drawers. */
    const fore = (c) => {
      c.drawImage(ART.desk(104, 44, 4), 118, FY - 44);
      px(c, 130, FY - 46, 76, 3, '#1e2a22');                  /* the blotter */
      px(c, 130, FY - 46, 76, 1, '#2c3c30');
      px(c, 140, FY - 49, 34, 4, stamped ? '#e6dcc0' : '#d8cfb4');   /* the form */
      px(c, 140, FY - 49, 34, 1, '#f2e9cf');
      for (let r = 0; r < 2; r++) px(c, 143, FY - 48 + r * 2, 26 - r * 8, 1, '#4a4436');
      if (stamped) {
        px(c, 158, FY - 50, 14, 6, 'rgba(138,36,24,.86)');    /* the stamp, wet */
        px(c, 160, FY - 49, 10, 4, 'rgba(180,60,40,.5)');
      }
      c.drawImage(ART.art('typewriter', 1), 122, FY - 58);
      c.drawImage(ART.art('desklamp', 1), 214, FY - 60);
      px(c, 228, FY - 48, 6, 3, '#2a2016');
    };

    return {
      id: 'cut_office' + (stamped ? '_s' : ''), w: W, floorY: FY, paint, fore,
      spots: [], actors: [
        { id: 'cap', x: 196, y: FY - 26, face: -1, still: true,
          key: 'introCap', def: HANDLER_DEF, job: 'smoke', profile: false,
          tag: 'THE CAPTAIN', tagCol: PIX.PAL.S },
      ],
      enterX: 96, enterFace: 1,
      lights: [
        { x: 222, y: FY - 58, r: 44, a: 0.20, fy: FY - 46 },
        { x: 60, y: 10, r: 40, a: 0.10, fy: FY, bare: true },
      ],
    };
  }

  /* two faces for the counter, hand-drawn rather than synthesised: the
     costume system needs names, not flags, and a made-up combination comes
     out as headgear floating over an empty collar */
  const GUARD_DEF = {
    skin: ['h', 'g', 'e'], fat: false, suit: 'u', shirt: 'l', tie: null,
    costume: 'cop', flatcap: true, hatCol: 'u', scar: true,
  };
  const CLERK_DEF = {
    skin: ['F', 'f', 'e'], fat: true, suit: 'T', shirt: 'W', tie: 'u',
    costume: 'threePiece', glasses: 'round', warts: true,
  };

  /* ============================================================
     THE OPENING, AS A SHOT LIST.

     Thirty seconds, in one room, with the camera doing the work:

       0:00  black. one line of the hour, and the door.
       0:04  the door, open, rain behind it. he walks in.
       0:09  the camera pans the hall with him. the telephone.
       0:16  through the arch: the room. the chair on its side.
       0:22  he stops. cut in close. one line.
       0:26  three places to look. one of them is the ashtray.
       0:30  the cigarette. GAULOISE. PARIS.
     ============================================================ */
  async function opening() {
    const H = house();
    const M = H.marks;
    await shot(H, async (S, def) => {
      /* --- 0:00 BLACK, then a hall out of the dark, and rain --- */
      S.black(true);
      S.cam(M.DOOR + 10);
      S.hide(true);
      await S.wait(280);
      SFX.tone(46, 0.9, 'sine', 0.05);              /* the weather, low */
      await S.rise(1100);
      await S.card('SIX YEARS AGO', 'YOU GOT OFF SHIFT AT ELEVEN', 2000);

      /* --- 0:04 HE COMES IN THROUGH IT. Not placed in the room: he walks
             over the threshold out of the rain, which is the difference
             between a shot and a diagram. --- */
      S.place(10, 1, 0.10);
      S.hide(false);
      S.face('hard');
      await S.wait(240);
      await S.meTo(M.DOOR + 26);
      await S.wait(320);
      await S.say('YOU', 'THE DOOR WAS ALREADY OPEN.', PIX.PAL.F);
      S.face(null);

      /* --- 0:09 THE HALL. He walks it; the camera goes with him. --- */
      const walk = S.meTo(M.HALL + 26);
      await S.pan(M.DOOR + 10, M.HALL + 40, 2400);
      await walk;
      S.face('hard');
      await S.say('YOU', 'THE TELEPHONE WAS OFF THE TABLE. NOBODY CALLED ANYBODY.',
        PIX.PAL.F);
      S.face(null);

      /* --- 0:16 THROUGH THE ARCH, and the room lands in one move --- */
      await S.pan(M.HALL + 40, M.ROOM + 26, 2300);
      await S.meTo(M.ROOM - 34);
      S.place(M.ROOM - 34, 1, 0.10);
      await S.wait(380);
      /* --- 0:22 HE SEES IT. --- */
      S.shake();
      S.thud(58, 0.26);
      S.face('alarm');
      await S.wait(560);
      await S.say('YOU', 'HER CHAIR WAS ON ITS SIDE.', PIX.PAL.F);
      S.face('worry');
      await S.say('YOU', 'AND THE WINDOW WAS UP. IN NOVEMBER.', PIX.PAL.F);
      S.face(null);

      /* --- three places, and you have to look. The room's own spots,
             the room's own markers, the room's own walk-and-use: this
             beat is not a cutscene at all any more, it is the game. --- */
      const SAID = {
        chair: 'NOBODY IN IT. NOTHING UNDER IT. SHE NEVER LEFT IT UNTIDY.',
        window: 'OPEN FROM THE INSIDE. SHE LET HIM IN.',
        table: 'TWO CUPS. ONE OF THEM IS NOT OURS. AND AN ASHTRAY.',
      };
      const seen = {};
      let found = false;
      /* the spots answer through the room, so hook their onUse */
      def.spots.forEach(sp => {
        sp.onUse = async () => {
          if (seen[sp.id]) return;
          seen[sp.id] = true;
          sp.done = true;
          S.face('squint');
          await S.say('YOU', SAID[sp.id], PIX.PAL.F);
          S.face(null);
          if (sp.id === 'table') found = true;
        };
      });
      SCENE.busy(false);
      if (typeof UI !== 'undefined' && UI.stampSmall) {
        UI.stampSmall('THREE PLACES. ONE OF THEM MATTERS.');
      }
      for (let i = 0; i < 900 && !found; i++) {
        gate();
        await U.sleep(120);
      }
      SCENE.busy(true);

      /* --- the cigarette. The whole game is in this pixel. --- */
      await S.meTo(M.TABLE - 22);
      S.place(M.TABLE - 22, 1, 0.10);
      S.cutIn(true);
      S.cam(M.TABLE - 6);
      await S.wait(500);
      S.arm('reach');
      S.face('squint');
      await S.wait(620);
      S.arm('up');
      await S.wait(420);
      await S.say('YOU', 'HALF SMOKED. STILL WARM.', PIX.PAL.F);
      await S.say('YOU', 'GAULOISE. NOBODY IN THIS STATE SELLS THEM.', PIX.PAL.F);
      S.arm('');
      S.face(null);
      S.free();
      await S.fade(760);
    });
  }

  /* ============================================================
     ORLY — the decision, played at a counter.
     ============================================================ */
  async function airport() {
    const O = orly();
    const C = O.marks.COUNT;
    let choice = null;
    await shot(O, async (S, def) => {
      S.black(true);
      S.cam(80);
      S.place(60, 1, 0.12);
      await S.wait(200);
      await S.rise(820);
      await S.card('ORLY', 'THREE WEEKS LATER, BY WAY OF EVERYTHING YOU OWNED', 2000);
      await S.pan(80, C, 2400);
      await S.meTo(C - 76);
      S.place(C - 76, 1, 0.12);
      await S.say('DOUANE', 'METAL IN THE TRAY. ALL OF IT.', PIX.PAL.B);
      S.face('hard');
      await S.say('YOU', 'I HAVE ONE THING IN THIS COAT WORTH KEEPING.', PIX.PAL.F);
      S.face(null);

      def.spots.forEach(sp => {
        sp.onUse = async () => {
          if (choice) return;
          choice = sp.id;
        };
      });
      SCENE.busy(false);
      if (typeof UI !== 'undefined' && UI.stampSmall) {
        UI.stampSmall('THE TRAY, OR THE MACHINE.');
      }
      for (let i = 0; i < 900 && !choice; i++) { gate(); await U.sleep(120); }
      SCENE.busy(true);

      await S.meTo(C + (choice === 'tray' ? 8 : 60));
      S.cutIn(true);
      S.cam(C + 20);
      S.arm('reach');
      await S.wait(560);
      if (choice === 'tray') {
        S.arm('hold');
        await S.wait(360);
        await S.say('YOU', 'IT WAS MY SERVICE PIECE. IT STAYED IN FRANCE.', PIX.PAL.F);
        await S.say('DOUANE', 'SIGN THERE. YOU GET A RECEIPT, NOT THE GUN.', PIX.PAL.B);
      } else {
        await S.wait(500);
        S.shake();
        S.thud(54, 0.2);
        await S.say('DOUANE', 'STOP. THE BAG. OPEN IT.', PIX.PAL.B);
        S.face('hard');
        await S.say('YOU', 'IT IS DECLARED. PAPERS IN THE SIDE POCKET.', PIX.PAL.F);
        await S.say('DOUANE', 'THEN YOU WAIT WHILE I READ THEM. ALL OF THEM.', PIX.PAL.B);
        S.face(null);
      }
      S.arm('');
      S.free();
      await S.fade(700);
    });
    return choice;
  }

  /* ============================================================
     THE CABIN — the last shot before the badge.
     ============================================================ */
  async function flight(kept) {
    await shot(cabin(false), async (S) => {
      S.black(true);
      S.hide(true);
      S.cam(40);
      await S.wait(200);
      await S.rise(820);
      await S.pan(30, 220, 3000);
      S.place(150, 1, 0.10);
      S.hide(false);
      await S.wait(300);
      await S.say('YOU', kept === 'tray'
        ? 'THEY KEPT THE GUN. I KEPT THE ADDRESS ON THE PACKET.'
        : 'FOUR HOURS IN A SIDE ROOM AND THEY GAVE IT BACK ANYWAY.', PIX.PAL.F);
      await S.fade(420);
    });
    await shot(cabin(true), async (S) => {
      S.black(true);
      S.place(150, 1, 0.10);
      S.cam(120);
      await S.wait(160);
      await S.rise(760);
      S.cutIn(true);
      S.cam(150);
      await S.wait(600);
      await S.say('YOU', 'AND THEN THE LIGHTS CAME UP OUT OF THE DARK.', PIX.PAL.F);
      await S.card('PARIS', 'AND SOMEBODY DOWN THERE SMOKES GAULOISES', 2200);
      S.free();
      await S.fade(820);
    });
  }

  /* ------------------------------------------------------------
     the whole opening, with one escape hatch over all of it
     ------------------------------------------------------------ */
  async function play() {
    if (running) return;
    running = true;
    skipping = false;
    document.body.classList.add('in-cut');
    /* the screen belongs to the cutscene: no title board behind it, no HUD
       over it, and the scene canvas is the only thing in #app */
    if (typeof UI !== 'undefined' && UI.buildStage) UI.buildStage();
    CINE.letterbox(true);
    onKey = (ev) => { if (ev.key === 'Escape') skip(); };
    window.addEventListener('keydown', onKey);
    try {
      await opening();
      const kept = await airport();
      await flight(kept);
    } catch (e) {
      if (e !== SKIP) throw e;
    } finally {
      didSkip = skipping;
      window.removeEventListener('keydown', onKey);
      onKey = null;
      CINE.letterbox(false);
      document.body.classList.remove('in-cut');
      SCENE.close();
      /* THE LAST SHOT ENDS ON BLACK and the exam raises from it, so the
         black stays up unless the player walked out -- in which case
         clearing it is the only way they get their screen back. */
      if (skipping) black(false);
      running = false;
      skipping = false;
    }
  }

  /* ------------------------------------------------------------
     PARK A ROOM AND HOLD IT. For a sequence that is all dialogue
     and no camera work -- the exam -- the caller wants the room up
     behind its own plates and nothing else driving it.
     ------------------------------------------------------------ */
  function stage(def, camX) {
    SCENE.open(def);
    SCENE.busy(true);
    if (camX !== undefined) SCENE.look(camX);
    return def;
  }
  function unstage() {
    SCENE.busy(false);
    SCENE.cutFree();
    SCENE.close();
  }

  return {
    play, skip, opening, airport, flight, stage, unstage,
    fade, rise, black,
    /* the exam is signed off short if the player walked out of the opening */
    wasSkipped() { return didSkip; },
    house, orly, cabin, office,
    get running() { return running; },
    /* the harness drives the interactive beats by id rather than by
       clicking at a guessed pixel */
    debugSpots() {
      const d = SCENE.def;
      return d && d.spots ? d.spots.map(s => s.id) : [];
    },
    debugUse(id) {
      const d = SCENE.def;
      const sp = d && d.spots && d.spots.find(s => s.id === id);
      if (sp && sp.onUse) sp.onUse();
      return !!sp;
    },
  };
})();
