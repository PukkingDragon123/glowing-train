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
    /* the hour and the weather belong to the scene, not to the shift clock */
    hour(m) { if (typeof DAY !== 'undefined') DAY.pin(m); },
    weather(id) { if (typeof G !== 'undefined') G.weather = id; },
    /* THE ZOOM RIGHT IN. Not a camera move -- the game's own eyeglass: the
       room five times closer in a round window with the lines under it.
       That is what a close-up is in this game, and it is the same
       instrument the player will use on every clue for the next six
       years, which is exactly why the story turns on it. */
    async glass(x, y, title, lines) {
      gate();
      const cv = SCENE.magnify(x, y, 20, 5);
      await CINE.glass({ cv, title: title, lines: lines });
      gate();
    },
    shake() { if (typeof UI !== 'undefined' && UI.shake) UI.shake(); },
    thud(f, l) { SFX.tone(f || 70, l || 0.16, 'sine', 0.09); },
    /* change the set, then rebuild the cached art so it shows */
    set(def, k, v) { def[k] = v; SCENE.open(def); },
  };

  /* ============================================================
     HOME, TEN PAST SEVEN, SIX YEARS AGO.

     The one bright set in the game, and it has to earn that: this
     is the room the rest of SHELL & DEBT is about losing. So it
     gets the most detail of anything in here and all of it is
     domestic — the kettle going, the sun over the sink, three
     coats on three hooks and one of them is small, two pairs of
     shoes and one pair is small, a crayon drawing of a frog family
     stuck to the larder with a magnet.

     Warm means warm PIGMENT, not a warm filter. The paper is
     butter with a little sprig on it, the wood is honey, the floor
     is scrubbed board with a rag rug on it, and the only cool
     thing in the room is the sky out of the window.

     Laid out once, by name, because the last set I placed by
     offsets put the sideboard inside the armchair:

       SINK    the window, the sun, the washing-up
       STOVE   the kettle and the pan
       LARDER  the drawing, and the boy's height marked up the jamb
       TABLE   three places laid, one of them low
       SOFA    the reader is under the left cushion
       HEARTH  the mantel, the clock, the photograph
       HOOKS   three coats, two of them grown-up
       DOOR    the glass panel, and the milk on the step

     st: { pan, plate, book, satchel } — what the script has
     changed about the set so far.
     ============================================================ */
  function home(st) {
    st = st || {};
    const W = 740, FY = 112;
    /* MEASURED SO NOTHING LANDS ON ANYTHING. First pass had the satchel
       inside the front door and the standing lamp inside the hall table;
       these are the left and right edges of every piece, worked out once:
         sink   22..102   stove 104..167   larder 170..220
         table 224..328   sofa  352..458   hearth 466..552
         hallt 562..596   hooks 606..668   door  684..732 */
    const SINK = 30, STOVE = 110, LARDER = 176, TABLE = 272, SOFA = 392,
      HEARTH = 496, HALLT = 562, HOOKS = 616, DOOR = 706;

    const paint = (c) => {
      const p = P();

      /* ---- THE SHELL: butter paper, honey dado, scrubbed boards ---- */
      /* THE SAME SATURATION PASS THE REST OF THE GAME GOT. The house is
         warm on purpose -- it is the one room in this story that is -- but
         warm and PALE is not the same thing as warm. Butter paper at
         forty-eight per cent chroma next to a cast at sixty-two read as
         beige; this is ochre. */
      px(c, 0, 0, W, FY, '#6a5320');
      px(c, 0, 0, W, FY - 34, '#8f6d22');
      /* THE PAPER. A sprig every twelve by ten, and only two pixels of
         contrast in it: on a four-by-six grid at full contrast the same
         motif read as television static. */
      for (let y = 4; y < FY - 40; y += 10) {
        for (let x = ((y / 10) % 2) ? 4 : 10; x < W; x += 12) {
          px(c, x, y, 1, 3, '#a37d24');
          px(c, x - 2, y + 1, 5, 1, '#a37d24');
          px(c, x - 1, y + 4, 3, 1, '#a37d24');
        }
      }
      ART.dither(c, 0, 0, W, FY - 34, '#7d5e1a', 0.07, 5);
      /* the picture rail and the honey dado under it */
      px(c, 0, FY - 40, W, 3, '#b58a2c');
      px(c, 0, FY - 40, W, 1, '#d4a63c');
      px(c, 0, FY - 37, W, 2, 'rgba(70,48,24,.34)');
      px(c, 0, FY - 34, W, 34, '#7a5518');
      for (let x = 4; x < W; x += 26) {
        px(c, x, FY - 30, 20, 26, '#8a611c');
        px(c, x, FY - 30, 20, 1, '#a87c28');
        px(c, x, FY - 5, 20, 1, 'rgba(60,40,20,.40)');
        px(c, x + 19, FY - 30, 1, 26, 'rgba(60,40,20,.30)');
      }
      px(c, 0, FY - 6, W, 6, '#5c3f10');
      px(c, 0, FY - 6, W, 1, '#7e5a18');
      /* the boards, and a rag rug over them in the middle of the room */
      c.drawImage(ART.floor(W, SCENE.H - FY + 8, { tone: 'board', seed: 3 }), 0, FY - 2);
      /* SCRUBBED, NOT SOOTED. ART.floor is a police-station board at
         #2a2118; a kitchen floor with the sun on it is two shades up and
         warm, so the whole thing gets a honey wash and a sheen. */
      px(c, 0, FY - 2, W, SCENE.H - FY + 8, 'rgba(226,176,104,.20)');
      px(c, 0, FY - 3, W, 2, '#4a3a20');
      px(c, 0, FY - 1, W, 5, 'rgba(255,238,196,.10)');
      for (let x = 0; x < W; x += 7) px(c, x, FY, 1, SCENE.H - FY + 6, 'rgba(120,84,40,.14)');
      /* the ceiling: whitewash, warm, with a beam across it */
      px(c, 0, -46, W, 46, '#3a2e1c');
      px(c, 0, 0, W, 9, '#cfb266');
      px(c, 0, 0, W, 2, '#e8c878');
      px(c, 0, 9, W, 3, 'rgba(70,48,24,.30)');
      for (let x = 0; x < W; x += 96) {
        px(c, x, 0, 6, 9, '#8a7048');
        px(c, x, 0, 6, 1, '#a98a52');
      }

      /* ---- THE SINK, and the sun coming over it ---- */
      const wx = SINK, wy = 20, ww = 62, wh = 42;
      px(c, wx - 4, wy - 4, ww + 8, wh + 8, '#4a3a20');
      px(c, wx - 3, wy - 3, ww + 6, wh + 6, '#c4a468');
      px(c, wx, wy, ww, wh, '#b8d8ea');
      /* a garden out of it: a hedge, a line of washing, a bright sky */
      for (let y = wy; y < wy + 20; y++) {
        px(c, wx, y, ww, 1, DAY.rgb(DAY.mix([150, 200, 232], [212, 234, 244],
          (y - wy) / 20)));
      }
      px(c, wx, wy + 20, ww, 10, '#6d9450');
      ART.dither(c, wx, wy + 20, ww, 10, '#578040', 0.3, 9);
      px(c, wx, wy + 28, ww, wh - 28, '#7ea256');
      for (let i = 0; i < 5; i++) {                    /* washing on a line */
        px(c, wx + 8 + i * 11, wy + 14, 8, 9, ['#e8e2d0', '#d8c8e0', '#e8e2d0', '#cfe0e8', '#e8dcc4'][i]);
        px(c, wx + 8 + i * 11, wy + 14, 8, 1, '#f4efe0');
      }
      px(c, wx + 2, wy + 13, ww - 4, 1, '#8a7448');
      px(c, wx + 26, wy + 6, 7, 4, '#f4efe0');          /* a cloud */
      px(c, wx + 30, wy + 4, 8, 3, '#fbf7ec');
      /* the glazing bars, then the sun sitting IN the glass */
      px(c, wx + Math.round(ww / 2) - 1, wy, 2, wh, '#c4a468');
      px(c, wx, wy + Math.round(wh / 2) - 1, ww, 2, '#c4a468');
      px(c, wx, wy, ww, 1, 'rgba(255,255,255,.34)');
      /* the sill, a pot of herbs, and the washing-up */
      px(c, wx - 6, wy + wh, ww + 12, 5, '#d0b478');
      px(c, wx - 6, wy + wh, ww + 12, 1, '#eccf92');
      px(c, wx + 4, wy + wh - 8, 11, 8, '#a85a3c');     /* the pot */
      px(c, wx + 4, wy + wh - 8, 11, 1, '#c47048');
      for (let i = 0; i < 6; i++) {
        px(c, wx + 5 + i * 2, wy + wh - 13 + (i % 3), 2, 6, '#4e7c42');
      }
      ART.inked(c, wx - 12, FY - 48, ww + 26, 46, (c) => {
      px(c, wx - 8, FY - 30, ww + 18, 6, '#c8ac74');    /* the draining board */
      px(c, wx - 8, FY - 30, ww + 18, 1, '#e4c88c');
      px(c, wx - 4, FY - 24, ww + 10, 20, '#8a7048');   /* the cupboard under it */
      px(c, wx - 4, FY - 24, ww + 10, 1, '#a4884c');
      px(c, wx + 4, FY - 20, 24, 14, 'rgba(70,48,24,.26)');
      px(c, wx + 32, FY - 20, 24, 14, 'rgba(70,48,24,.26)');
      px(c, wx + 26, FY - 15, 4, 2, '#e8d49a');
      px(c, wx + 34, FY - 15, 4, 2, '#e8d49a');
      px(c, wx + 18, FY - 36, 30, 7, '#b0bcc4');        /* the basin */
      px(c, wx + 18, FY - 36, 30, 1, '#ccd8de');
      px(c, wx + 30, FY - 44, 3, 9, '#c8cfd4');         /* the tap */
      px(c, wx + 30, FY - 45, 8, 3, '#c8cfd4');
      for (let i = 0; i < 3; i++) {                     /* two cups on the board */
        px(c, wx - 6 + i * 9, FY - 36, 7, 6, ['#f0e8d4', '#e8dcd0', '#f0e8d4'][i]);
        px(c, wx - 6 + i * 9, FY - 36, 7, 1, '#fbf7ec');
      }
      });
      /* and the shaft it throws across the floor, painted, warm */
      for (let i = 0; i < 12; i++) {
        const t = i / 11;
        px(c, wx + 6 + Math.round(t * 44), wy + wh + 6 + Math.round(t * 44),
          Math.round(ww * (0.6 + t * 0.5)), 5,
          'rgba(255,238,176,' + (0.075 - t * 0.005).toFixed(3) + ')');
      }

      /* ---- THE STOVE. Cream enamel with a black hob and a brass rail:
             a kitchen range, not the grey monolith this was. ---- */
      ART.inked(c, STOVE - 9, FY - 58, 62, 57, (c) => {
      px(c, STOVE - 4, FY - 36, 50, 34, '#4a3c2e');     /* the ink under it */
      px(c, STOVE - 3, FY - 35, 48, 32, '#dcd0b4');
      px(c, STOVE - 3, FY - 35, 48, 2, '#f0e6cc');
      px(c, STOVE + 40, FY - 35, 5, 32, 'rgba(90,70,44,.24)');
      px(c, STOVE - 4, FY - 39, 50, 4, '#2e2a2c');      /* the hob */
      px(c, STOVE - 4, FY - 39, 50, 1, '#585458');
      for (let i = 0; i < 3; i++) {
        PIX.disc(c, STOVE + 6 + i * 14, FY - 37, 4, '#1e1c1e');
        PIX.disc(c, STOVE + 6 + i * 14, FY - 37, 3, '#3a3638');
      }
      px(c, STOVE - 6, FY - 44, 54, 2, '#c8b06a');      /* the brass rail */
      px(c, STOVE - 6, FY - 44, 54, 1, '#e8cc84');
      px(c, STOVE - 6, FY - 44, 2, 6, '#c8b06a');
      px(c, STOVE + 46, FY - 44, 2, 6, '#c8b06a');
      /* a checked tea towel over the far end of the rail, because this is
         somebody's house -- and off the pan, where it read as a flag */
      for (let i = 0; i < 12; i++) {
        px(c, STOVE + 34 + i, FY - 42, 1, 11 - Math.abs(6 - i), i % 3 ? '#c8524c' : '#e8e0cc');
      }
      px(c, STOVE + 2, FY - 28, 34, 18, '#c4b494');     /* the oven door */
      px(c, STOVE + 2, FY - 28, 34, 1, '#e0d4b8');
      px(c, STOVE + 6, FY - 24, 26, 11, '#3a3230');
      px(c, STOVE + 8, FY - 22, 10, 7, 'rgba(255,170,60,.38)');   /* alight */
      px(c, STOVE + 10, FY - 21, 6, 4, 'rgba(255,222,128,.46)');
      px(c, STOVE + 6, FY - 9, 26, 3, '#c8b06a');       /* the handle */
      px(c, STOVE + 6, FY - 9, 26, 1, '#e8cc84');
      /* the kettle, going, on the near ring */
      px(c, STOVE - 2, FY - 50, 17, 11, '#4a4448');
      px(c, STOVE - 1, FY - 49, 15, 9, '#8e989e');
      px(c, STOVE - 1, FY - 49, 15, 2, '#bcc4c8');
      px(c, STOVE + 14, FY - 47, 6, 3, '#8e989e');      /* the spout */
      px(c, STOVE + 15, FY - 48, 4, 2, '#4a4448');
      px(c, STOVE + 2, FY - 53, 10, 4, '#4a4448');      /* the handle */
      px(c, STOVE + 3, FY - 53, 8, 2, '#a8b0b6');
      });
      /* THE STEAM STAYS OUTSIDE THE INK. It is eight soft alpha puffs
         climbing out of the frame the range is drawn in, and run through
         the outline pass each one comes back as a black-edged dot. */
      for (let i = 0; i < 8; i++) {
        px(c, STOVE + 18 + Math.round(Math.sin(i * 0.85) * 3), FY - 52 - i * 3,
          2, 2, 'rgba(252,246,232,' + (0.26 - i * 0.03).toFixed(3) + ')');
      }
      /* the pan, with the eggs in it if he has cooked them */
      ART.inked(c, STOVE + 10, FY - 50, 40, 12, (c) => {
      SPR.ellipse(c, STOVE + 24, FY - 42, 11, 4, '#26232a');
      SPR.ellipse(c, STOVE + 24, FY - 43, 10, 3, '#48434c');
      SPR.ellipse(c, STOVE + 24, FY - 44, 8, 2, '#5e5860');
      px(c, STOVE + 34, FY - 45, 12, 3, '#26232a');     /* the handle */
      px(c, STOVE + 34, FY - 45, 12, 1, '#4a4448');
      if (st.pan) {
        px(c, STOVE + 18, FY - 45, 7, 3, '#f6e8a8');
        px(c, STOVE + 20, FY - 44, 3, 2, '#f0a83c');
        px(c, STOVE + 26, FY - 45, 7, 3, '#f6e8a8');
        px(c, STOVE + 28, FY - 44, 3, 2, '#f0a83c');
      }
      });

      /* ---- THE LARDER, and the two best things in the room on it ----
             inside ART.inked, so the whole press gets the same one-pixel
             black line the furniture and the cast have. See ART.inked. */
      ART.inked(c, LARDER - 9, FY - 77, 56, 76, (c) => {
      px(c, LARDER, FY - 74, 44, 72, '#8e6e44');
      px(c, LARDER, FY - 74, 44, 3, '#ac8a58');
      px(c, LARDER + 40, FY - 74, 4, 72, 'rgba(60,40,20,.34)');
      px(c, LARDER + 3, FY - 70, 34, 30, 'rgba(60,40,20,.22)');
      px(c, LARDER + 3, FY - 70, 34, 1, 'rgba(255,236,190,.14)');
      px(c, LARDER + 3, FY - 36, 34, 30, 'rgba(60,40,20,.22)');
      px(c, LARDER + 34, FY - 52, 3, 6, '#e8d49a');     /* the handles */
      px(c, LARDER + 34, FY - 30, 3, 6, '#e8d49a');
      /* THE DRAWING. Four frogs in crayon, holding hands, under a yellow
         sun with a smile on it, held on with a red magnet. This is the
         whole prologue in twelve pixels. */
      px(c, LARDER + 7, FY - 66, 26, 20, '#f4eeda');
      px(c, LARDER + 7, FY - 66, 26, 1, '#fbf8ee');
      px(c, LARDER + 8, FY - 65, 24, 1, 'rgba(0,0,0,.08)');
      px(c, LARDER + 27, FY - 64, 4, 4, '#ffd447');     /* the sun */
      px(c, LARDER + 28, FY - 63, 2, 1, '#a07a10');
      for (let i = 0; i < 4; i++) {
        const kx = LARDER + 10 + i * 5, kh = i === 2 ? 5 : (i === 3 ? 4 : 8);
        px(c, kx, FY - 51 - kh, 3, kh, ['#5aa050', '#c86a92', '#5aa050', '#e0a84c'][i]);
        px(c, kx, FY - 52 - kh, 3, 2, '#3e7c38');
        px(c, kx + 3, FY - 50 - Math.round(kh * 0.6), 2, 1, '#3e7c38');
      }
      px(c, LARDER + 8, FY - 48, 24, 1, '#5aa050');    /* the ground line */
      px(c, LARDER + 18, FY - 67, 3, 3, '#c03a2c');    /* the magnet */
      /* and the boy's height, pencilled up the door jamb with the years */
      for (let i = 0; i < 4; i++) {
        const hy = FY - 22 - i * 7;
        px(c, LARDER - 6, hy, 5, 1, '#6a5030');
        px(c, LARDER - 6, hy - 3, 3, 2, '#6a5030');
      }
      });

      /* ---- THE TABLE, three places laid, one of them low ---- */
      /* the top of the table only: the cloth hanging off the near edge and
         the legs under it are painted in FRONT of the cast, below, so that
         the family is AT the table instead of standing on the floor in
         front of it */
      px(c, TABLE - 34, FY - 32, 74, 5, '#a88450');
      px(c, TABLE - 34, FY - 32, 74, 1, '#c8a468');
      /* two plates, a jug, a jam pot, and flowers */
      px(c, TABLE - 28, FY - 35, 14, 3, '#f0e8d4');
      px(c, TABLE - 28, FY - 35, 14, 1, '#fbf7ec');
      px(c, TABLE + 2, FY - 35, 14, 3, '#f0e8d4');
      px(c, TABLE + 2, FY - 35, 14, 1, '#fbf7ec');
      if (st.plate) {                                   /* the boy's egg on it */
        px(c, TABLE + 5, FY - 37, 8, 3, '#f6e8a8');
        px(c, TABLE + 7, FY - 36, 3, 2, '#f0a83c');
      }
      px(c, TABLE - 10, FY - 42, 9, 7, '#dce4e8');      /* the milk jug */
      px(c, TABLE - 10, FY - 42, 9, 1, '#f0f4f6');
      px(c, TABLE - 1, FY - 40, 3, 3, '#dce4e8');
      px(c, TABLE + 20, FY - 39, 7, 4, '#a8324c');      /* the jam */
      px(c, TABLE + 20, FY - 40, 7, 2, '#e8dcc0');
      px(c, TABLE + 30, FY - 44, 6, 9, '#9ab0c4');      /* the flowers */
      px(c, TABLE + 30, FY - 44, 6, 1, '#c0d0dc');
      px(c, TABLE + 32, FY - 50, 2, 7, '#4e7c42');
      px(c, TABLE + 29, FY - 53, 4, 4, '#e8a0b8');
      px(c, TABLE + 33, FY - 51, 3, 3, '#f0d060');
      px(c, TABLE + 27, FY - 49, 3, 3, '#d8e0f0');
      /* three chairs: two grown-up and one with a cushion on it */
      const chair = (cxx, h, cushion) => {
        px(c, cxx, FY - 20, 16, 4, '#8e6e44');
        px(c, cxx, FY - 20, 16, 1, '#ac8a58');
        px(c, cxx + 1, FY - 16, 3, 14, '#7a5c38');
        px(c, cxx + 12, FY - 16, 3, 14, '#7a5c38');
        px(c, cxx + 1, FY - 20 - h, 3, h, '#7a5c38');
        px(c, cxx + 12, FY - 20 - h, 3, h, '#7a5c38');
        px(c, cxx, FY - 22 - h, 16, 3, '#8e6e44');
        px(c, cxx, FY - 22 - h, 16, 1, '#ac8a58');
        for (let i = 0; i < 2; i++) px(c, cxx + 5 + i * 4, FY - 20 - h, 2, h, '#6e5230');
        if (cushion) {
          px(c, cxx + 1, FY - 24, 14, 5, '#c86a92');
          px(c, cxx + 1, FY - 24, 14, 1, '#e08cae');
          px(c, cxx + 1, FY - 20, 14, 1, 'rgba(80,30,50,.34)');
        }
      };
      chair(TABLE - 48, 18, false);
      chair(TABLE + 40, 18, false);
      chair(TABLE - 12, 12, true);

      /* ---- THE SOFA. The reader is under the left cushion. ---- */
      px(c, SOFA - 34, FY - 40, 82, 38, '#4a6a58');
      px(c, SOFA - 34, FY - 40, 82, 3, '#5e8068');
      px(c, SOFA + 42, FY - 40, 6, 38, 'rgba(20,40,30,.34)');
      px(c, SOFA - 34, FY - 26, 82, 3, 'rgba(20,40,30,.28)');   /* the back seam */
      px(c, SOFA - 40, FY - 34, 10, 32, '#547660');             /* the arms */
      px(c, SOFA - 40, FY - 34, 10, 2, '#6a8c74');
      px(c, SOFA + 46, FY - 34, 10, 32, '#547660');
      px(c, SOFA + 46, FY - 34, 10, 2, '#6a8c74');
      /* two seat cushions, and the left one is sitting proud of the frame
         because there is a PENCIL CASE down the side of it */
      const prd = st.kit && st.kit.pencils ? 0 : 2;
      px(c, SOFA - 30, FY - 24 - prd, 36, 10, '#5e8068');
      px(c, SOFA - 30, FY - 24 - prd, 36, 2, '#74987e');
      px(c, SOFA + 8, FY - 24, 36, 10, '#5e8068');
      px(c, SOFA + 8, FY - 24, 36, 2, '#74987e');
      if (!st.kit || !st.kit.pencils) {
        /* ============================================================
           HIS PENCIL CASE, IN PLAIN SIGHT.

           This spot used to hide a school reader that only turned up
           if you held the spyglass over the cushion first, and then
           needed a second tap to pick up. Two gates and a tool on the
           first search in the game. It is a stripy zip case with a
           pencil out the end of it, sitting where anybody would see
           it, and one tap has it.
           ============================================================ */
        /* ON THE FAR CUSHION, not the near one. The spot's own x is where
           the game stands you to use it, so anything drawn within ten
           pixels of it spends the whole search behind your own coat. */
        for (let i = 0; i < 7; i++) {
          px(c, SOFA + 12 + i * 2, FY - 28, 2, 5, i % 2 ? '#d8484c' : '#f0e8d4');
        }
        px(c, SOFA + 12, FY - 29, 14, 1, '#f8f2e0');            /* the zip */
        px(c, SOFA + 12, FY - 24, 14, 1, 'rgba(40,20,20,.40)');
        px(c, SOFA + 26, FY - 27, 5, 2, '#e0b048');             /* a pencil out of it */
        px(c, SOFA + 31, FY - 27, 2, 2, '#2c2a34');
      }
      /* two scatter cushions, one of them embroidered */
      px(c, SOFA - 26, FY - 36, 14, 12, '#c8a44c');
      px(c, SOFA - 26, FY - 36, 14, 2, '#e0bc60');
      px(c, SOFA - 22, FY - 32, 6, 5, '#a8842c');
      px(c, SOFA + 26, FY - 36, 14, 12, '#a8687c');
      px(c, SOFA + 26, FY - 36, 14, 2, '#c07c92');
      px(c, SOFA + 30, FY - 33, 6, 2, '#e0c0cc');
      /* a knitted blanket over the near arm */
      for (let i = 0; i < 12; i++) {
        px(c, SOFA + 46, FY - 32 + i, 10, 1, i % 3 ? '#b8543c' : '#c86848');
      }
      px(c, SOFA + 52, FY - 20, 5, 10, '#b8543c');
      /* ============================================================
         AND THE HOUSE IS DRESSED FROM THE CATALOGUE TOO.

         The wall above the dado was seventy rows of ochre paper for
         the length of the room, and the one thing on it was a
         corkboard. The layout comment at the top of this function has
         the span of every piece of furniture in here, so these go in
         the gaps between them: above the range, above the table,
         above the sofa, and in the hall.
         ============================================================ */
      FURN.hang(c, 'curtain', SINK - 12, 10, 86, 50, { mat: 'rose' });
      FURN.hang(c, 'shelf', STOVE + 16, 22, 50, 20, { mat: 'pine', seed: 11 });
      FURN.hang(c, 'clock', TABLE - 38, 12, 24, 42, { mat: 'walnut', hour: 7, min: 20 });
      FURN.hang(c, 'picture', TABLE + 4, 16, 34, 26, { mat: 'brass', seed: 3 });
      FURN.hang(c, 'picture', SOFA - 18, 14, 30, 34, { mat: 'walnut', kind: 'mirror' });
      FURN.hang(c, 'sconce', SOFA + 34, 20, 16, 20, { mat: 'cream' });
      FURN.hang(c, 'picture', HALLT - 4, 18, 32, 26, { mat: 'oak', seed: 5 });
      FURN.stand(c, 'dresser', 226, FY - 60, 44, 60, { mat: 'pine', seed: 7 });
      FURN.stand(c, 'plant', 336, FY - 30, 20, 30, { mat: 'copper', seed: 9 });
      FURN.stand(c, 'standlamp', 462, FY - 62, 18, 62, { mat: 'mustard' });

      /* ============================================================
         A THIRD DRESSING PASS.

         The room was furnished and it was decorated, and it was
         still a bit tidy for a house with a six-year-old in it on a
         Tuesday morning. This is the layer that says somebody LIVES
         here rather than has furnished here: a stool pulled out from
         the sink, a radiator under the mirror, a plant and a hatstand
         in the hall, a box of kindling by the range -- and the things
         on the surfaces, which is where a kitchen keeps its life.
         ============================================================ */
      /* NO STOOL BY THE SINK. The catalogue's stool is a bar stool -- a
         round seat on a steel pedestal -- and at sixteen by thirty in a
         kitchen it read as a mushroom. */
      FURN.stand(c, 'crate', 148, FY - 20, 22, 20, { mat: 'oak', seed: 13 });
      FURN.hang(c, 'radiator', 466, FY - 22, 36, 14, { mat: 'cream' });
      /* NO HATSTAND. There is nowhere in this hall to put one: the front
         door is painted after the dressing so 686 is behind it, and at 646
         it is behind the backpack, which is painted after it too. The hall
         already has a coat rack, a table, a hat, a radio, shoes and a duck
         in it -- a hatstand next to a row of coat hooks is the same
         sentence twice. */
      FURN.stand(c, 'plant', 672, FY - 34, 22, 34, { mat: 'teal', seed: 4 });

      /* THE LARDER TOP: milk, jam, and a loaf on a board */
      ART.inked(c, LARDER + 1, FY - 88, 46, 16, (c) => {
        px(c, LARDER + 4, FY - 84, 6, 11, '#dfe8ea');            /* the milk bottle */
        px(c, LARDER + 4, FY - 84, 6, 2, '#f4fbfc');
        px(c, LARDER + 5, FY - 87, 4, 3, '#dfe8ea');
        px(c, LARDER + 5, FY - 88, 4, 2, '#c8a44c');             /* the foil cap */
        px(c, LARDER + 4, FY - 78, 6, 5, 'rgba(255,255,255,.34)');
        px(c, LARDER + 13, FY - 81, 8, 8, '#8e3a2c');            /* the jam */
        px(c, LARDER + 13, FY - 81, 8, 2, '#a84e3c');
        px(c, LARDER + 14, FY - 83, 6, 2, '#c8a44c');
        px(c, LARDER + 14, FY - 78, 6, 3, '#d8cdb4');            /* the label */
        px(c, LARDER + 25, FY - 76, 18, 3, '#a98a52');           /* the board */
        px(c, LARDER + 25, FY - 76, 18, 1, '#c8a468');
        px(c, LARDER + 27, FY - 82, 13, 6, '#c08a4c');           /* the loaf */
        px(c, LARDER + 27, FY - 82, 13, 2, '#dca868');
        for (let i = 0; i < 3; i++) {                            /* the scores */
          px(c, LARDER + 29 + i * 4, FY - 83, 2, 2, '#e8c48c');
        }
        px(c, LARDER + 40, FY - 80, 4, 4, '#e8dcc0');            /* the cut end */
      });

      /* THE TABLE TOP: a teapot, and the sugar */
      ART.inked(c, TABLE + 4, FY - 48, 34, 18, (c) => {
        px(c, TABLE + 8, FY - 42, 16, 11, '#b8543c');            /* the teapot */
        px(c, TABLE + 8, FY - 42, 16, 2, '#d0684c');
        px(c, TABLE + 8, FY - 34, 16, 2, 'rgba(40,12,8,.44)');
        px(c, TABLE + 11, FY - 45, 9, 3, '#b8543c');             /* the lid */
        px(c, TABLE + 14, FY - 47, 3, 2, '#c8b06a');             /* the knob */
        px(c, TABLE + 23, FY - 40, 5, 2, '#b8543c');             /* the spout */
        px(c, TABLE + 26, FY - 39, 3, 3, '#9e4632');
        px(c, TABLE + 5, FY - 39, 4, 5, '#b8543c');              /* the handle */
        px(c, TABLE + 5, FY - 39, 2, 5, '#9e4632');
        px(c, TABLE + 27, FY - 36, 8, 5, '#f0e8d4');             /* the sugar bowl */
        px(c, TABLE + 27, FY - 36, 8, 1, '#fbf7ec');
        px(c, TABLE + 29, FY - 37, 4, 1, '#e4dcc4');
      });

      /* THE SOFA ARM: yesterday's paper, folded once */
      ART.inked(c, SOFA + 42, FY - 40, 20, 12, (c) => {
        px(c, SOFA + 45, FY - 37, 14, 5, '#d8cdb4');
        px(c, SOFA + 45, FY - 37, 14, 1, '#e8e0cc');
        px(c, SOFA + 45, FY - 33, 14, 1, 'rgba(60,50,36,.44)');
        for (let i = 0; i < 3; i++) px(c, SOFA + 47, FY - 36 + i * 2, 10, 1, 'rgba(60,50,36,.34)');
        px(c, SOFA + 47, FY - 36, 5, 1, '#3a3228');
      });

      /* AND THE WEAR. A worn path in the boards from the door to the
         kitchen, because that is the line every morning in this house
         takes, and a scuffed skirting where a small frog kicks it. */
      for (let i = 0; i < 5; i++) {
        px(c, 20, FY - 5 + i, W - 40, 1, 'rgba(212,196,158,' + (0.05 - i * 0.008).toFixed(3) + ')');
      }
      for (let i = 0; i < 26; i++) {
        const sx2 = 40 + ((i * 149) % (W - 90));
        px(c, sx2, FY - 3 - (i % 3), 3 + (i % 4), 1, 'rgba(30,18,8,.22)');
      }

      /* ============================================================
         AND THE SMALL STUFF, which is what makes a room somebody's.

         Furniture is what a house is fitted with. What says a CHILD
         lives here is a pull-along duck left in the hall, blocks and
         a ball on the floor by the sofa, a drawing pinned up crooked,
         and the cat asleep on the hearth rug where the fire was.
         ============================================================ */
      FURN.stand(c, 'kettle', 140, FY - 39 - 22, 22, 22, { mat: 'steel' });
      FURN.stand(c, 'fruit', 62, FY - 34 - 16, 26, 16, { mat: 'teal' });
      FURN.stand(c, 'posy', 246, FY - 60 - 24, 12, 24, { mat: 'rose' });
      FURN.hang(c, 'drawing', 302, 22, 24, 20, {});
      FURN.stand(c, 'toys', 344, FY - 16, 30, 16, { mat: 'oxblood' });
      /* on the rug in front of the sofa, not at 468 -- the hearth owns 466
         to 552 and is painted after the dressing, so that is a cat behind a
         fireplace */
      FURN.stand(c, 'cat', 436, FY - 16, 28, 16, { mat: 'ebony' });
      FURN.stand(c, 'slippers', 528, FY - 10, 22, 10, { mat: 'oxblood' });
      FURN.stand(c, 'radio', 566, FY - 30 - 20, 28, 20, { mat: 'walnut', seed: 13 });
      FURN.stand(c, 'duck', 596, FY - 18, 24, 18, { mat: 'mustard' });

      /* the rag rug in front of it */
      px(c, SOFA - 30, FY - 1, 96, 9, '#8a5a48');
      px(c, SOFA - 30, FY - 1, 96, 1, '#a4705a');
      for (let x = SOFA - 26; x < SOFA + 62; x += 12) {
        px(c, x, FY + 1, 8, 6, '#a06450');
        px(c, x + 6, FY + 3, 6, 4, '#7c5040');
      }

      /* ---- THE HEARTH ---- */
      px(c, HEARTH - 24, FY - 56, 52, 54, '#8a7c70');
      px(c, HEARTH - 24, FY - 56, 52, 3, '#a89a8c');
      px(c, HEARTH - 18, FY - 46, 40, 44, '#2a2220');           /* the opening */
      px(c, HEARTH - 16, FY - 44, 36, 40, '#1c1614');
      /* a fire laid but not lit, because it is July and it is morning */
      for (let i = 0; i < 5; i++) {
        px(c, HEARTH - 12 + i * 7, FY - 12, 6, 4, '#4a3628');
        px(c, HEARTH - 10 + i * 5, FY - 16, 5, 3, '#3e2c20');
      }
      px(c, HEARTH - 14, FY - 6, 32, 4, '#3a3230');
      /* the mantel, the clock, the photograph, two candlesticks */
      px(c, HEARTH - 30, FY - 60, 64, 5, '#a98a52');
      px(c, HEARTH - 30, FY - 60, 64, 1, '#c8a468');
      px(c, HEARTH - 30, FY - 55, 64, 2, 'rgba(60,40,20,.34)');
      px(c, HEARTH - 8, FY - 76, 18, 16, '#8e6e44');            /* the clock */
      px(c, HEARTH - 8, FY - 76, 18, 2, '#ac8a58');
      PIX.disc(c, HEARTH + 1, FY - 68, 6, '#f0e8d4');
      PIX.disc(c, HEARTH + 1, FY - 68, 5, '#fbf7ec');
      px(c, HEARTH + 1, FY - 71, 1, 4, '#3a2c1c');
      px(c, HEARTH + 1, FY - 68, 4, 1, '#3a2c1c');
      px(c, HEARTH - 26, FY - 74, 15, 14, '#a98a52');           /* the photograph */
      px(c, HEARTH - 25, FY - 73, 13, 12, '#d8cdb4');
      px(c, HEARTH - 23, FY - 71, 4, 6, '#6a8a96');
      px(c, HEARTH - 18, FY - 70, 4, 5, '#96707c');
      px(c, HEARTH - 14, FY - 68, 3, 3, '#8a9a70');
      px(c, HEARTH + 16, FY - 72, 3, 12, '#c8b06a');            /* candlesticks */
      px(c, HEARTH + 15, FY - 60, 5, 2, '#c8b06a');
      px(c, HEARTH + 17, FY - 76, 1, 4, '#f0e8d4');
      px(c, HEARTH + 24, FY - 70, 3, 10, '#c8b06a');
      px(c, HEARTH + 23, FY - 60, 5, 2, '#c8b06a');
      /* HIS CRAYONS, left up here last night where he could not reach them */
      if (!st.kit || !st.kit.crayons) {
        px(c, HEARTH + 4, FY - 66, 13, 6, '#6a4a2a');           /* the tin */
        px(c, HEARTH + 4, FY - 66, 13, 1, '#8a6438');
        px(c, HEARTH + 4, FY - 61, 13, 1, 'rgba(30,16,8,.44)');
        const CR = ['#d8484c', '#48a0d8', '#e0b048', '#5aa050', '#c86a92'];
        for (let i = 0; i < 5; i++) {
          px(c, HEARTH + 5 + i * 2, FY - 70, 2, 4, CR[i]);
          px(c, HEARTH + 5 + i * 2, FY - 71, 2, 1, '#f4eeda');
        }
      }
      /* the standing lamp beside it, on, because the hall is still dim */
      px(c, HEARTH + 40, FY - 8, 12, 6, '#8e6e44');
      px(c, HEARTH + 45, FY - 58, 2, 50, '#a98a52');
      px(c, HEARTH + 36, FY - 72, 20, 14, '#d8b060');
      px(c, HEARTH + 36, FY - 72, 20, 2, '#f0cc80');
      px(c, HEARTH + 38, FY - 58, 16, 2, 'rgba(255,224,150,.44)');

      /* ---- THE HALL: three coats, two pairs of shoes ---- */
      px(c, HOOKS - 10, FY - 68, 56, 5, '#8e6e44');
      px(c, HOOKS - 10, FY - 68, 56, 1, '#ac8a58');
      px(c, HOOKS - 10, FY - 63, 56, 2, 'rgba(60,40,20,.36)');
      for (let i = 0; i < 4; i++) {
        px(c, HOOKS - 4 + i * 15, FY - 62, 3, 5, '#c8b06a');
        px(c, HOOKS - 4 + i * 15, FY - 58, 5, 2, '#d8c078');
      }
      /* his, hers, and one that comes up to your knee */
      const coat = (cxx, w2, h2, col, hi, lo) => {
        px(c, cxx, FY - 58, w2, h2, col);
        px(c, cxx, FY - 58, w2, 2, hi);
        px(c, cxx + w2 - 3, FY - 58, 3, h2, lo);
        px(c, cxx + 2, FY - 54, w2 - 4, 1, 'rgba(255,255,255,.10)');
        px(c, cxx, FY - 58 + h2 - 1, w2, 1, 'rgba(0,0,0,.30)');
      };
      coat(HOOKS - 8, 14, 40, '#3a4048', '#4e5660', '#242a30');
      coat(HOOKS + 8, 14, 36, '#7c4458', '#96566c', '#542c3c');
      coat(HOOKS + 24, 11, 22, '#c07038', '#d8884a', '#8e4e22');
      /* ============================================================
         HIS BACKPACK, on the fourth hook, and it FILLS UP.

         It was a flat brown rectangle that either was there or was
         not. It is a bag now -- flap, buckle, side pocket, two straps
         -- and once his pencil case and his crayons are in it a
         pencil and a red crayon are sticking out of the pocket, so
         the room shows you the errand is done rather than a line of
         dialogue telling you.
         ============================================================ */
      if (!st.kit || !st.kit.bag) {
        const bx = HOOKS + 36, by = FY - 58;
        px(c, bx + 4, by - 2, 3, 4, '#6e4420');                 /* the loop */
        px(c, bx, by + 2, 18, 16, '#8e5a2c');                   /* the body */
        px(c, bx, by + 2, 18, 2, '#a8703c');
        px(c, bx + 15, by + 2, 3, 16, 'rgba(50,28,10,.36)');
        px(c, bx, by + 2, 18, 7, '#a06638');                    /* the flap */
        px(c, bx, by + 8, 18, 1, 'rgba(40,22,8,.50)');
        px(c, bx + 7, by + 7, 4, 3, '#3a2c22');                 /* the buckle */
        px(c, bx + 8, by + 8, 2, 1, '#c8b06a');
        px(c, bx + 2, by + 11, 8, 6, '#7c4c24');                /* the side pocket */
        px(c, bx + 2, by + 11, 8, 1, '#96602e');
        for (let i = 0; i < 2; i++) {                           /* the straps */
          px(c, bx + 3 + i * 9, by + 17, 3, 4, '#6e4420');
        }
        if (st.kit && st.kit.pencils && st.kit.crayons) {
          px(c, bx + 4, by + 8, 2, 4, '#e0b048');               /* a pencil */
          px(c, bx + 4, by + 8, 2, 1, '#2c2a34');
          px(c, bx + 7, by + 9, 2, 3, '#d8484c');               /* and a crayon */
        }
      }
      /* two pairs of shoes, and one pair is small */
      px(c, HOOKS - 8, FY - 8, 13, 6, '#3a2c22');
      px(c, HOOKS - 8, FY - 8, 13, 1, '#54402e');
      px(c, HOOKS + 6, FY - 8, 13, 6, '#3a2c22');
      px(c, HOOKS + 6, FY - 8, 13, 1, '#54402e');
      px(c, HOOKS + 22, FY - 6, 9, 4, '#8e3a2c');
      px(c, HOOKS + 22, FY - 6, 9, 1, '#a84e3c');
      px(c, HOOKS + 32, FY - 6, 9, 4, '#8e3a2c');
      px(c, HOOKS + 32, FY - 6, 9, 1, '#a84e3c');
      /* the hall table, his hat and his keys on it */
      px(c, HALLT, FY - 30, 34, 4, '#8e6e44');
      px(c, HALLT, FY - 30, 34, 1, '#ac8a58');
      px(c, HALLT + 2, FY - 26, 3, 24, '#7a5c38');
      px(c, HALLT + 29, FY - 26, 3, 24, '#7a5c38');
      px(c, HALLT + 2, FY - 14, 30, 2, '#7a5c38');             /* the stretcher */
      px(c, HALLT + 5, FY - 36, 18, 6, '#2c2a34');             /* the fedora */
      px(c, HALLT + 3, FY - 31, 22, 2, '#2c2a34');
      px(c, HALLT + 5, FY - 36, 18, 1, '#484654');
      px(c, HALLT + 5, FY - 34, 18, 1, '#8e2c24');
      px(c, HALLT + 26, FY - 33, 5, 3, '#c8b06a');             /* the keys */
      px(c, HALLT + 29, FY - 32, 3, 1, '#c8b06a');

      /* ---- THE FRONT DOOR, shut, with the morning behind the glass ---- */
      px(c, DOOR - 22, 14, 48, FY - 14, '#7a5c38');
      px(c, DOOR - 25, 12, 54, 4, '#a98a52');
      px(c, DOOR - 25, 12, 54, 1, '#c8a468');
      px(c, DOOR - 19, 20, 42, FY - 24, '#8e6e44');
      px(c, DOOR - 19, 20, 42, 2, '#ac8a58');
      px(c, DOOR - 15, 26, 34, 26, '#4a3a20');                 /* the glass panel */
      px(c, DOOR - 14, 27, 32, 24, '#dcecf4');
      for (let i = 0; i < 3; i++) px(c, DOOR - 14 + i * 11, 27, 1, 24, '#b8cfdc');
      px(c, DOOR - 14, 35, 32, 1, '#b8cfdc');
      px(c, DOOR - 12, 29, 12, 8, 'rgba(255,255,255,.5)');
      px(c, DOOR - 15, 62, 34, 22, 'rgba(60,40,20,.22)');      /* the lower panel */
      px(c, DOOR - 15, 62, 34, 1, 'rgba(255,236,190,.14)');
      px(c, DOOR - 20, 66, 4, 4, '#c8b06a');                   /* the knob */
      px(c, DOOR - 21, 74, 5, 8, '#c8b06a');                   /* the letter box */
      px(c, DOOR - 20, 76, 3, 4, '#3a2c1c');
      /* and the light it lays down on the boards inside */
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        px(c, DOOR - 16 - Math.round(t * 26), 54 + Math.round(t * 54),
          Math.round(34 * (0.7 + t * 0.6)), 5,
          'rgba(255,244,206,' + (0.055 - t * 0.005).toFixed(3) + ')');
      }
    };

    /* ---- and what is in FRONT of everybody ---- */
    const fore = (c) => {
      /* the near edge of the breakfast table: a checked cloth hanging over
         it and two legs under. A frog standing behind this line has his
         legs hidden by it, which is what sitting at a table looks like
         from the side without a single frame of sitting animation. */
      px(c, TABLE - 32, FY - 28, 68, 11, '#e8e0c8');
      px(c, TABLE - 32, FY - 28, 68, 1, '#f8f2e0');
      /* a red gingham check, which is the one pattern that says kitchen */
      for (let x = TABLE - 30; x < TABLE + 34; x += 8) {
        px(c, x, FY - 27, 4, 4, '#d8a08c');
        px(c, x + 4, FY - 23, 4, 4, '#d8a08c');
        px(c, x, FY - 27, 4, 1, '#e8b8a4');
      }
      for (let x = TABLE - 32; x < TABLE + 36; x += 4) {
        px(c, x, FY - 28, 1, 11, 'rgba(180,120,100,.22)');
      }
      for (let y = FY - 27; y < FY - 17; y += 4) {
        px(c, TABLE - 32, y, 68, 1, 'rgba(180,120,100,.22)');
      }
      /* and a scalloped hem, so it hangs instead of ending */
      for (let i = 0; i < 17; i++) {
        const hx = TABLE - 32 + i * 4;
        px(c, hx, FY - 17, 4, 1, '#d0c4a8');
        px(c, hx + 1, FY - 16, 2, 1, '#e8e0c8');
        px(c, hx + 1, FY - 15, 2, 1, 'rgba(60,40,20,.30)');
      }
      px(c, TABLE - 32, FY - 17, 68, 1, 'rgba(60,40,20,.20)');
      px(c, TABLE - 26, FY - 16, 5, 14, '#8e6e44');
      px(c, TABLE - 26, FY - 16, 2, 14, '#a4804c');
      px(c, TABLE + 28, FY - 16, 5, 14, '#8e6e44');
      px(c, TABLE + 28, FY - 16, 2, 14, '#a4804c');
      px(c, TABLE - 28, FY - 3, 66, 3, 'rgba(60,40,20,.26)');
    };

    const spots = [
      { id: 'stove', x: STOVE + 20, w: 44, top: FY - 58, bot: FY - 14,
        label: 'THE STOVE', hint: 'COOK' },
      { id: 'sofa', x: SOFA - 12, w: 40, top: FY - 40, bot: FY - 12,
        label: 'THE CUSHIONS', hint: 'LOOK' },
      { id: 'hearth', x: HEARTH, w: 46, top: FY - 78, bot: FY - 6,
        label: 'THE MANTEL', hint: 'LOOK' },
      { id: 'hooks', x: HOOKS + 16, w: 60, top: FY - 68, bot: FY - 2,
        label: 'THE HOOKS', hint: 'LOOK' },
      { id: 'door', x: DOOR - 4, w: 44, top: 14, bot: FY - 2,
        label: 'THE FRONT DOOR', hint: 'GO' },
    ];

    return {
      id: 'cut_home:' + (st.pan ? 'p' : '') + (st.plate ? 'e' : '')
        + (st.kit ? (st.kit.pencils ? 'P' : '') + (st.kit.crayons ? 'C' : '')
          + (st.kit.bag ? 'B' : '') : ''),
      w: W, floorY: FY, paint, fore, spots,
      actors: [
        /* ============================================================
           THEY ARE PEOPLE IN A ROOM, NOT SCENERY THAT TALKS.

           Both of these were tags on a backdrop: they had a name
           floating over them and they spoke when the script said so,
           and there was nothing you could do about either of them.
           An actor in this game gets a bracket round it, a label, a
           hint and an onUse the moment it declares them -- the same
           machinery every clerk and barman in the city already uses --
           so the two people this whole story is about get it too. Walk
           up, tap, and they answer; and what they answer depends on
           what you have done to the room.

           They also DO something while you are not talking to them.
           She wipes the table down and stirs the pot; he swings his
           legs and reads. Two idle behaviours out of a table that
           already had ten in it.
           ============================================================ */
        { id: 'wife', x: TABLE - 62, y: FY, face: 1, key: 'cutWife',
          def: WIFE_DEF, job: 'wipe', profile: false, mood: 'pleased',
          label: 'CLEO', hint: 'TALK',
          tag: 'CLEO', tagCol: PIX.PAL.P },
        /* UP ON THE CUSHION. Stood on the floor at sixty-two per cent his
           head came out below the tablecloth, which is a boy hiding under
           the table rather than eating at it. Feet at FY-20 puts them
           behind the cloth and his head a clear twenty rows above it --
           and that IS the pose: a small frog kneeling up on a cushion to
           reach his egg. */
        { id: 'boy', x: TABLE - 6, y: FY - 20, face: -1, key: 'cutBoy',
          def: BOY_DEF, scale: 0.66, still: true, profile: false,
          job: st.pan ? 'eat' : 'read', mood: 'pleased',
          label: 'TOBIAS', hint: 'TALK',
          tag: 'TOBIAS', tagCol: PIX.PAL.O },
      ],
      enterX: STOVE + 44, enterFace: 1,
      lights: [
        { x: SINK + 30, y: 44, r: 70, a: 0.17, fy: FY - 2, bare: true },
        { x: HEARTH + 46, y: FY - 56, r: 40, a: 0.17, fy: FY - 4 },
        { x: DOOR - 4, y: 40, r: 54, a: 0.13, fy: FY - 2, bare: true },
      ],
      marks: { SINK, STOVE, LARDER, TABLE, SOFA, HEARTH, HOOKS, DOOR },
    };
  }

  /* ============================================================
     THE HOUSE — the same house, that night.

     He was told not to go home. He went home.

     Read left to right, because that is the order he finds it
     in: the front door forced off its lock, the hall with the
     telephone off its table, the archway, and then the front room
     with her chair on its side, the window up, and an ashtray
     with a second one of those cigarettes in it.

     Nothing is described anywhere. The set is the exposition,
     and every warm thing in the prologue has its cold twin in
     here: the same paper, the same chair, the same boards.
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
     THE SCHOOL GATE, twenty past eight.

     Nine seconds of screen time and it has one job: be the last
     completely ordinary thing that ever happens to him. So it is
     railings, a horse chestnut, a bell on a bracket, a hopscotch
     grid chalked on the pavement, a bicycle leaning on the fence
     and two other children going in.
     ============================================================ */
  function school() {
    const W = 380, FY = 106;
    const GATE = 196;

    const paint = (c) => {
      /* the sky, and the school behind the railings */
      for (let y = -30; y < 46; y++) {
        px(c, 0, y, W, 1, DAY.rgb(DAY.mix([120, 176, 216], [214, 230, 242],
          (y + 30) / 76)));
      }
      px(c, 30, 6, 5, 3, 'rgba(255,255,255,.5)');
      px(c, 36, 4, 9, 4, 'rgba(255,255,255,.62)');
      px(c, 240, 10, 12, 4, 'rgba(255,255,255,.5)');
      /* the building: red brick, tall sashes, a bell on a bracket. Started
         six rows ABOVE the frame first time, which filled the top of the
         shot with brick and threw the sky away. */
      px(c, 60, 8, 260, 48, '#8a4438');
      px(c, 60, 8, 260, 3, '#a4564a');
      px(c, 56, 4, 268, 5, '#6e3630');
      px(c, 56, 4, 268, 1, '#96504a');
      for (let y = 12; y < 54; y += 5) {
        px(c, 60, y, 260, 1, 'rgba(0,0,0,.20)');
        for (let x = 60 + ((y / 5) % 2 ? 0 : 6); x < 320; x += 12) {
          px(c, x, y, 1, 5, 'rgba(0,0,0,.16)');
        }
      }
      for (let i = 0; i < 5; i++) {
        const sx = 76 + i * 50;
        px(c, sx - 2, 16, 30, 34, '#5e2e26');
        px(c, sx, 18, 26, 30, '#b8cbd6');
        px(c, sx, 18, 26, 1, '#dae6ec');
        px(c, sx + 12, 18, 2, 30, '#5e2e26');
        px(c, sx, 32, 26, 2, '#5e2e26');
        px(c, sx + 2, 20, 9, 7, 'rgba(255,255,255,.34)');
      }
      px(c, 178, -8, 5, 13, '#5a5450');                  /* the bell bracket */
      px(c, 176, -10, 12, 3, '#5a5450');
      px(c, 180, -4, 8, 8, '#c8a848');
      px(c, 181, -3, 6, 5, '#e8cc74');
      px(c, 183, 3, 2, 3, '#8a7430');
      /* the wall, the railings, and the gate standing open */
      px(c, 0, 50, W, 6, '#7a6a58');
      px(c, 0, 50, W, 1, '#96866e');
      for (let x = 4; x < W; x += 9) {
        if (x > GATE - 34 && x < GATE + 34) continue;
        px(c, x, 12, 3, 40, '#2e3a34');
        px(c, x, 12, 1, 40, '#46564c');
        px(c, x, 8, 3, 4, '#2e3a34');
        px(c, x + 1, 6, 1, 3, '#46564c');
      }
      px(c, GATE - 38, 6, 6, 48, '#2a3630');
      px(c, GATE + 32, 6, 6, 48, '#2a3630');
      px(c, GATE - 38, 2, 6, 5, '#c8a848');
      px(c, GATE + 32, 2, 6, 5, '#c8a848');
      for (let x = GATE - 30; x < GATE + 32; x += 8) px(c, x, 16, 2, 36, '#34423a');
      px(c, GATE - 30, 16, 60, 2, '#34423a');
      px(c, GATE - 30, 32, 60, 2, '#34423a');
      /* a horse chestnut over the wall */
      px(c, 316, 20, 8, 36, '#5a4630');
      for (let i = 0; i < 26; i++) {
        const a = i * 2.399, r = 8 + (i % 4) * 7;
        PIX.disc(c, 320 + Math.round(Math.cos(a) * r),
          12 + Math.round(Math.sin(a) * r * 0.6),
          9 - (i % 3) * 2, i % 3 ? '#4e7c42' : '#3e6636');
      }
      PIX.disc(c, 326, 4, 8, '#5a8c4a');
      /* the pavement, and hopscotch chalked on it */
      c.drawImage(ART.floor(W, SCENE.H - FY + 8, { tone: 'lino', seed: 6 }), 0, FY - 2);
      px(c, 0, 56, W, FY - 56, '#8e8478');
      ART.dither(c, 0, 56, W, FY - 56, '#7e7468', 0.24, 3);
      for (let x = 0; x < W; x += 26) px(c, x, 56, 1, FY - 56, 'rgba(0,0,0,.14)');
      px(c, 0, 56, W, 2, '#a49a8c');
      px(c, 0, FY - 3, W, 3, '#5e564c');
      for (let i = 0; i < 5; i++) {
        px(c, 60 + (i % 2) * 13, FY - 30 - i * 7, 13, 6, 'rgba(248,244,232,.34)');
        px(c, 60 + (i % 2) * 13, FY - 30 - i * 7, 13, 1, 'rgba(255,255,255,.42)');
      }
      px(c, 62, FY - 22, 3, 3, 'rgba(248,244,232,.44)');
      /* a milk crate and a bicycle against the railings, because a gate
         with nothing leaning on it is a drawing of a gate */
      px(c, 250, FY - 14, 20, 12, '#4a6a7c');
      px(c, 250, FY - 14, 20, 2, '#5e8296');
      for (let i = 0; i < 4; i++) px(c, 253 + i * 4, FY - 11, 3, 8, 'rgba(0,0,0,.24)');
      if (PIX.ring) {
        PIX.ring(c, 300, FY - 12, 10, '#2c2a2c');
        PIX.ring(c, 328, FY - 12, 10, '#2c2a2c');
      }
      px(c, 306, FY - 26, 20, 3, '#8a2c24');
      px(c, 300, FY - 22, 30, 2, '#2c2a2c');
      px(c, 322, FY - 30, 3, 8, '#2c2a2c');
    };

    return {
      id: 'cut_school', w: W, floorY: FY, paint, outdoor: true, skyTo: FY,
      spots: [{ id: 'gate', x: GATE, w: 60, top: 6, bot: FY - 4,
        label: 'THE GATE', hint: 'SEE HIM IN' }],
      actors: [
        { id: 'kid1', x: 96, y: FY, face: 1, key: 'cutKid1', def: KID1_DEF,
          scale: 0.6, job: 'pace', beat: 16 },
        { id: 'kid2', x: 300, y: FY, face: -1, key: 'cutKid2', def: KID2_DEF,
          scale: 0.62, still: true },
      ],
      enterX: 40, enterFace: 1,
      lights: [],
      marks: { GATE },
    };
  }

  /* ============================================================
     HIS DESK, a quarter past nine, and the envelope on it.

     Small-town homicide: two desks, a fan that does not help, a
     coffee going cold, a spike of paper, and a window with the
     water tower out of it. The turn in the whole game happens on
     this blotter.
     ============================================================ */
  function desk(st) {
    st = st || {};
    const W = 340, FY = 108;
    const DESK = 150;

    const paint = (c) => {
      const p = P();
      c.drawImage(ART.wall(W, FY + 4, { tone: 'grey', railY: 72, seed: 11 }), 0, 0);
      c.drawImage(ART.floor(W, SCENE.H - FY + 8, { tone: 'board', seed: 15 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#0d0f13');
      px(c, 0, -40, W, 46, '#0e1014');
      px(c, 0, 6, W, 3, '#20242c');
      /* a hot flat morning out of the window, and a water tower in it */
      const wx = 226, wy = 18, ww = 84, wh = 46;
      px(c, wx - 4, wy - 4, ww + 8, wh + 8, p.K);
      for (let y = wy; y < wy + wh; y++) {
        px(c, wx, y, ww, 1, DAY.rgb(DAY.mix([132, 180, 214], [226, 226, 208],
          (y - wy) / wh)));
      }
      px(c, wx, wy + wh - 12, ww, 12, '#8e8a6a');
      px(c, wx + 20, wy + 8, 4, 24, '#5e5a50');
      px(c, wx + 44, wy + 8, 4, 24, '#5e5a50');
      px(c, wx + 16, wy + 2, 36, 10, '#6e6a5c');
      px(c, wx + 16, wy + 2, 36, 2, '#8a8676');
      px(c, wx + 22, wy - 2, 24, 4, '#6e6a5c');
      px(c, wx + 14, wy + 12, 40, 2, '#4e4a42');
      for (let i = 0; i < 4; i++) px(c, wx + 60 + i * 6, wy + wh - 18, 4, 6, '#7a7660');
      px(c, wx + ww / 2 - 1, wy, 2, wh, '#3a3e46');
      px(c, wx, wy + 22, ww, 2, '#3a3e46');
      px(c, wx, wy, ww, 1, 'rgba(255,255,255,.24)');
      px(c, wx - 6, wy + wh, ww + 12, 4, '#2e3238');
      /* a blind half down over it, and a fan on the wall */
      px(c, wx - 4, wy - 4, ww + 8, 8, '#5a5e64');
      for (let i = 0; i < 9; i++) {
        px(c, wx - 2, wy - 3 + i, ww + 4, 1,
          i % 2 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.06)');
      }
      px(c, 40, 16, 3, 10, '#4a4e54');
      PIX.disc(c, 41, 30, 9, '#3a3e44');
      PIX.disc(c, 41, 30, 8, '#4e535a');
      px(c, 33, 29, 17, 2, '#7c828a');
      px(c, 36, 22, 10, 15, 'rgba(255,255,255,.06)');
      /* THE DESK, side on, and the paper on it */
      px(c, DESK - 40, FY - 34, 96, 6, '#4a3626');
      px(c, DESK - 40, FY - 34, 96, 1, '#664c34');
      px(c, DESK - 40, FY - 28, 96, 3, 'rgba(0,0,0,.40)');
      px(c, DESK - 30, FY - 36, 52, 2, '#1e2a22');                /* the blotter */
      px(c, DESK - 30, FY - 36, 52, 1, '#2c3c30');
      c.drawImage(ART.art('typewriter', 1), DESK + 14, FY - 48);
      px(c, DESK - 38, FY - 40, 14, 6, '#8e8a78');               /* a spike of paper */
      for (let i = 0; i < 4; i++) px(c, DESK - 37, FY - 41 - i, 12, 1, '#d8d0b8');
      px(c, DESK - 32, FY - 46, 2, 6, '#9aa0a8');
      px(c, DESK - 6, FY - 42, 7, 6, '#e0d8c0');                 /* the coffee, cold */
      px(c, DESK - 6, FY - 42, 7, 1, '#f4eeda');
      px(c, DESK + 1, FY - 40, 2, 3, '#e0d8c0');
      px(c, DESK - 5, FY - 41, 5, 2, '#4a3420');
      /* THE ENVELOPE. No stamp on it, which is the first thing wrong. */
      if (!st.opened) {
        px(c, DESK - 27, FY - 40, 28, 5, '#e8dcc0');
        px(c, DESK - 27, FY - 40, 28, 1, '#f6eed8');
        px(c, DESK - 21, FY - 39, 15, 2, 'rgba(120,100,70,.5)');
        px(c, DESK - 27, FY - 36, 28, 1, 'rgba(90,74,50,.44)');
        px(c, DESK - 14, FY - 40, 2, 5, 'rgba(90,74,50,.30)');
      } else {
        /* opened: the letter flat on the blotter, the cigarette on top of it */
        px(c, DESK - 29, FY - 42, 32, 8, '#f2ead2');
        px(c, DESK - 29, FY - 42, 32, 1, '#fbf6e6');
        px(c, DESK - 29, FY - 35, 32, 1, 'rgba(90,74,50,.34)');
        /* HAND PRINTED, IN CAPITALS, BY SOMEBODY BEING CAREFUL. Four ruled
           lines of ink and one of them red: a blank cream slab on a blotter
           is a sheet of paper, and this has to read as a letter. */
        px(c, DESK - 26, FY - 41, 18, 1, '#8a2418');
        for (let i = 0; i < 4; i++) {
          px(c, DESK - 26, FY - 39 + i, [26, 22, 25, 14][i], 1, '#4a4238');
        }
        px(c, DESK + 1, FY - 36, 2, 1, '#4a4238');
        px(c, DESK - 29, FY - 44, 13, 2, '#e8dcc0');
        px(c, DESK - 29, FY - 44, 13, 1, '#f6eed8');
        px(c, DESK + 5, FY - 39, 9, 2, '#e8e0cc');               /* the cigarette */
        px(c, DESK + 13, FY - 39, 3, 2, '#8a6a3c');
        px(c, DESK + 5, FY - 39, 9, 1, '#f6f0e0');
        px(c, DESK + 4, FY - 39, 2, 2, '#3a3028');
      }
      /* the second desk behind, and a board of notices */
      px(c, 40, FY - 30, 62, 5, '#4a3626');
      px(c, 40, FY - 30, 62, 1, '#664c34');
      px(c, 44, FY - 25, 54, 14, '#40301f');
      px(c, 52, FY - 36, 24, 6, '#8e8a78');
      c.drawImage(ART.corkboard(56, 34, 3), 128, 22);
    };

    /* the desk front goes over the cast, so he stands AT it */
    const fore = (c) => {
      px(c, DESK - 42, FY - 27, 100, 4, '#3a2a1c');
      px(c, DESK - 42, FY - 27, 100, 1, '#54402c');
      px(c, DESK - 42, FY - 23, 100, 21, '#33261a');
      px(c, DESK - 34, FY - 21, 34, 15, 'rgba(0,0,0,.30)');
      px(c, DESK + 6, FY - 21, 34, 15, 'rgba(0,0,0,.30)');
      px(c, DESK - 20, FY - 14, 8, 2, '#c8a848');
      px(c, DESK + 20, FY - 14, 8, 2, '#c8a848');
      px(c, DESK - 42, FY - 4, 100, 3, '#221a12');
    };

    return {
      id: 'cut_desk' + (st.opened ? '_o' : ''), w: W, floorY: FY, paint, fore,
      spots: [{ id: 'post', x: DESK - 13, w: 34, top: FY - 46, bot: FY - 30,
        label: st.opened ? 'THE LETTER' : 'THE POST', hint: 'OPEN IT' }],
      actors: [],
      enterX: 60, enterFace: 1,
      lights: [
        { x: 150, y: 8, r: 70, a: 0.22, fy: FY, bare: true },
        { x: 268, y: 40, r: 70, a: 0.22, fy: FY - 2, bare: true },
        { x: DESK, y: FY - 40, r: 34, a: 0.13, fy: FY - 32, bare: true },
      ],
      marks: { DESK },
    };
  }

  /* ============================================================
     THE TABAC.

     Six years before Paris, in a town where nobody sells them: a
     counter, a wall of packets, a till with a bell on it, and a
     frog who has been behind it for thirty years and knows every
     brand in the state by the smell of it.
     ============================================================ */
  function tabac() {
    const W = 320, FY = 106;
    const COUNT = 168;
    const CTOP = FY - 26;

    const paint = (c) => {
      px(c, 0, 0, W, FY, '#6a5440');
      px(c, 0, 0, W, FY - 30, '#7e654b');
      ART.dither(c, 0, 0, W, FY, '#5c4835', 0.14, 21);
      px(c, 0, FY - 32, W, 3, '#9a7c50');
      px(c, 0, FY - 32, W, 1, '#b6945e');
      c.drawImage(ART.floor(W, SCENE.H - FY + 8, { tone: 'board', seed: 19 }), 0, FY - 2);
      px(c, 0, FY - 3, W, 2, '#221a12');
      px(c, 0, -40, W, 46, '#14100c');
      px(c, 0, 6, W, 3, '#2c2418');
      /* THE WALL OF PACKETS. Six shelves, fifteen a shelf, every one a
         different two colours: that is what the back of a tobacconist is,
         and it is the reason one gap in it means something. */
      const bx = 66, by = 14;
      px(c, bx - 4, by - 4, 190, 78, '#2e2418');
      const A = ['#c8443c', '#3e6ea8', '#d8a83c', '#4e8a52', '#8a4a8e', '#c8763c', '#4a4a52', '#b8b0a0'];
      const B = ['#e8645c', '#5e8ec8', '#f0c85c', '#6eaa72', '#aa6aae', '#e8965c', '#6a6a72', '#d8d0c0'];
      for (let r = 0; r < 6; r++) {
        const ry = by + r * 12;
        px(c, bx - 2, ry + 9, 186, 3, '#6a5232');
        px(c, bx - 2, ry + 9, 186, 1, '#86663e');
        for (let i = 0; i < 15; i++) {
          const cx0 = bx + i * 12, k = (r * 15 + i) % 8;
          px(c, cx0, ry, 10, 9, A[k]);
          px(c, cx0, ry, 10, 2, B[k]);
          px(c, cx0 + 2, ry + 4, 6, 2, 'rgba(255,255,255,.30)');
          px(c, cx0 + 9, ry, 1, 9, 'rgba(0,0,0,.28)');
        }
      }
      /* the one gap on the shelf, and a price card under it */
      px(c, bx + 84, by + 24, 10, 9, '#1e1810');
      px(c, bx + 80, by + 34, 18, 5, '#e8dcc0');
      px(c, bx + 82, by + 36, 12, 1, '#5a5040');
      /* a hanging sign, and a calendar with the days crossed off */
      px(c, 20, 12, 34, 20, '#8a2c24');
      px(c, 20, 12, 34, 2, '#a84038');
      for (let i = 0; i < 3; i++) px(c, 24, 17 + i * 5, 26 - i * 6, 2, '#e8dcc0');
      px(c, 34, 4, 2, 9, '#3a2c1c');
      px(c, 274, 18, 26, 34, '#d8cdb4');
      px(c, 274, 18, 26, 8, '#8a2c24');
      for (let r = 0; r < 4; r++) {
        for (let i = 0; i < 6; i++) px(c, 276 + i * 4, 28 + r * 6, 3, 3, '#8a8272');
      }
      px(c, 288, 34, 3, 3, '#c8443c');
    };

    const fore = (c) => {
      /* the counter: glass fronted, with cigars laid out in it */
      px(c, COUNT - 118, CTOP, 250, 6, '#6a5232');
      px(c, COUNT - 118, CTOP, 250, 2, '#8c6c42');
      px(c, COUNT - 118, CTOP, 250, 1, '#a8834e');
      px(c, COUNT - 118, CTOP + 6, 250, 18, '#3e3222');
      px(c, COUNT - 112, CTOP + 9, 236, 12, '#2a3a34');
      for (let i = 0; i < 21; i++) {
        px(c, COUNT - 108 + i * 11, CTOP + 11, 8, 3, '#6e4a28');
        px(c, COUNT - 108 + i * 11, CTOP + 11, 8, 1, '#8a5e34');
        px(c, COUNT - 104 + i * 11, CTOP + 15, 3, 3, '#c8a848');
      }
      px(c, COUNT - 118, CTOP + 24, 250, 3, '#241c12');
      /* the till, and a bell beside it */
      px(c, COUNT + 62, CTOP - 20, 34, 20, '#5a4a3a');
      px(c, COUNT + 62, CTOP - 20, 34, 2, '#7c6448');
      px(c, COUNT + 66, CTOP - 16, 26, 9, '#2a2218');
      for (let i = 0; i < 4; i++) px(c, COUNT + 68 + i * 6, CTOP - 14, 4, 5, '#c8a848');
      px(c, COUNT + 74, CTOP - 24, 10, 4, '#8a7448');
      PIX.disc(c, COUNT + 52, CTOP - 5, 5, '#c8a848');
      PIX.disc(c, COUNT + 52, CTOP - 5, 4, '#e8cc74');
      px(c, COUNT + 51, CTOP - 11, 3, 3, '#8a7430');
      /* and the ashtray on the counter, which is where the cigarette goes */
      c.drawImage(ART.art('ashtray', 1), COUNT - 26, CTOP - 8);
    };

    return {
      id: 'cut_tabac', w: W, floorY: FY, paint, fore,
      spots: [{ id: 'ask', x: COUNT - 14, w: 40, top: CTOP - 12, bot: CTOP + 6,
        label: 'THE CIGARETTE', hint: 'SHOW HIM' }],
      actors: [
        { id: 'tabac', x: COUNT + 30, y: FY - 4, face: -1, still: true,
          key: 'cutTabac', def: TABAC_DEF, job: 'smoke',
          tag: 'THE TABAC', tagCol: PIX.PAL.B },
      ],
      enterX: 40, enterFace: 1,
      lights: [
        { x: 160, y: 8, r: 70, a: 0.28, fy: CTOP },
        { x: 40, y: 10, r: 48, a: 0.20, fy: FY, bare: true },
        { x: 268, y: 12, r: 44, a: 0.16, fy: CTOP, bare: true },
      ],
      marks: { COUNT },
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
  /* ============================================================
     THE TWO PEOPLE THIS WHOLE GAME IS ABOUT.

     Hand-drawn from the existing costume names, like everybody
     else: a made-up combination comes out as headgear floating
     over an empty collar. She is in an apron over shirtsleeves
     because she is making breakfast; he is a small frog in a
     jumper with a school cap on, drawn at sixty-two per cent, and
     that number is the whole reason actors can be scaled.
     ============================================================ */
  const WIFE_DEF = {
    skin: ['P', 'p', 'X'], fat: false, suit: 'l', shirt: 'l', tie: null,
    costume: 'croupier', apron: true, lashes: true, lips: 'R',
  };
  const BOY_DEF = {
    skin: ['F', 'f', 'e'], fat: false, suit: 'o', shirt: 'W', tie: null,
    costume: 'shirtsleeves', cap: true, hatCol: 'o', spots: true, braces: true,
  };

  /* two other children going in, and the frog behind the counter */
  const KID1_DEF = {
    skin: ['N', 'n', 'f'], fat: false, suit: 'V', shirt: 'W', tie: null,
    costume: 'shirtsleeves', cap: true, hatCol: 'v', lashes: true,
  };
  const KID2_DEF = {
    skin: ['B', 'b', 'u'], fat: true, suit: 'S', shirt: 'W', tie: null,
    costume: 'shirtsleeves', cap: true, hatCol: 's', spots: true,
  };
  const TABAC_DEF = {
    skin: ['w', 'q', 't'], fat: true, suit: 'T', shirt: 'W', tie: 'd',
    costume: 'threePiece', glasses: 'round', warts: true, cigar: true,
  };

  const GUARD_DEF = {
    skin: ['h', 'g', 'e'], fat: false, suit: 'u', shirt: 'l', tie: null,
    costume: 'cop', flatcap: true, hatCol: 'u', scar: true,
  };
  const CLERK_DEF = {
    skin: ['F', 'f', 'e'], fat: true, suit: 'T', shirt: 'W', tie: 'u',
    costume: 'threePiece', glasses: 'round', warts: true,
  };

  /* ============================================================
     THE PROLOGUE — a Tuesday, and nothing happens.

     Every game has to teach four things: how to move, how to use
     a thing, how to talk to somebody, and how to look closely.
     Most games teach them with a box of text in the corner of a
     grey room. This one teaches them by needing them, in a warm
     kitchen, cooking an egg for a small frog who is going to be
     late — so that the first hour of SHELL & DEBT is the last
     ordinary morning of his life and you PLAY it rather than
     being told about it afterwards.

       0:00  tap the floor to walk          -> the kitchen
       0:20  use a thing                    -> the stove, three eggs
       0:50  walk up to somebody, talk      -> the boy at the table
       1:10  hold the glass up to something -> the missing reader
       1:40  the satchel, the door, the car
       2:00  the school gate. he waves.
       2:20  the desk. an envelope with no stamp on it.

     The last beat is the only one that is not a lesson, and by
     then you have been taught everything you need to understand
     exactly what it means.
     ============================================================ */
  async function prologue() {
    /* ============================================================
       THREE THINGS, AND YOU CAN SEE ALL THREE.

       The first search in this game used to be one school reader
       hidden under a cushion behind a SPYGLASS gate: hold the tool
       over the sofa to reveal it, tap again to pick it up, and a
       line of dialogue to tell you the tool exists. Two gates and an
       inventory item, in the tutorial, before you have walked twenty
       pixels.

       It is his school kit now -- pencil case, crayons, backpack --
       all three drawn where anybody would see them, one tap each, no
       tool. The tally is stamped as you go, the bag fills up in
       front of you, and the door will not open until he has the lot.
       ============================================================ */
    const st = { pan: false, plate: false,
      kit: { pencils: false, crayons: false, bag: false } };
    const kitLeft = () => ['pencils', 'crayons', 'bag'].filter(k => !st.kit[k]).length;
    const kitDone = () => kitLeft() === 0;
    let H = home(st);
    const M = H.marks;

    /* the set changes as he does things to it, and a repaint is the only
       way a cached room can show that */
    const redress = (S, camX) => {
      H = home(st);
      SCENE.open(H);
      SCENE.busy(true);
      if (camX !== undefined) SCENE.look(camX);
      wire(S);
    };

    /* every spot in the house answers, and what it answers changes */
    let wired = null;
    function wire(S) {
      wired = S;
      const d = SCENE.def;
      if (!d) return;
      d.spots.forEach(sp => {
        if (sp.id === 'stove') {
          sp.look = 'TWO RINGS, A KETTLE AND NO TIME.';
          sp.onUse = async () => {
            if (st.pan) { await S.say('YOU', 'THAT IS BREAKFAST DONE.', PIX.PAL.F); return; }
            const r = await JOBS.breakfast();
            st.pan = true;
            st.plate = r.hits > 0;
            redress(S, M.TABLE - 20);
            await S.say('YOU', r.hits >= 2
              ? 'BOTH OF THEM PERFECT. HE WILL NOT EVEN NOTICE.'
              : (r.hits ? 'ONE GOOD ONE. HE CAN HAVE THAT ONE.'
                : 'BROWN ROUND THE EDGE. HE PUTS KETCHUP ON IT ANYWAY.'), PIX.PAL.F);
          };
        }
        /* ---- the three things, one tap each ---- */
        const KIT = {
          pencils: { at: 'sofa', name: 'HIS PENCIL CASE',
            look: 'THE CUSHION IS SITTING PROUD, AND THERE IS A ZIP SHOWING.',
            got: 'IT WAS DOWN THE SIDE OF THE CUSHION. IT IS ALWAYS DOWN THE '
              + 'SIDE OF THE CUSHION.', tone: 880 },
          crayons: { at: 'hearth', name: 'HIS CRAYONS',
            look: 'A TIN OF CRAYONS ON THE MANTEL, WHERE HE CANNOT REACH THEM.',
            got: 'HE WAS DRAWING UP HERE LAST NIGHT AND I PUT THEM WHERE HE '
              + 'COULD NOT GET AT THEM.', tone: 990 },
          bag: { at: 'hooks', name: 'HIS BACKPACK',
            look: 'THREE COATS, TWO PAIRS OF SHOES, AND A BAG ON THE END HOOK.',
            got: 'BAG. THAT IS THE LOT.', tone: 660 },
        };
        const LEFT = () => Object.keys(KIT).filter(k => !st.kit[k]).length;
        Object.keys(KIT).forEach(k => {
          const K = KIT[k];
          if (sp.id !== K.at) return;
          sp.label = st.kit[k] ? sp.label : K.name;
          sp.hint = () => (st.kit[k] ? 'LOOK' : 'TAKE');
          sp.look = () => (st.kit[k] ? K.look.replace(/^THE|^A /, 'NOTHING ON ') : K.look);
          sp.onUse = async () => {
            if (st.kit[k]) {
              await S.say('YOU', 'GOT THAT ONE.', PIX.PAL.F);
              return;
            }
            st.kit[k] = true;
            SFX.tone(K.tone, 0.07, 'square', 0.055);
            setTimeout(() => SFX.tone(K.tone * 1.5, 0.09, 'triangle', 0.05), 70);
            redress(S, SCENE.me ? SCENE.me.x : undefined);
            const n = LEFT();
            if (typeof UI !== 'undefined' && UI.stampSmall) {
              UI.stampSmall(K.name + (n ? '  -  ' + n + ' TO GO' : '  -  THAT IS EVERYTHING'));
            }
            await S.say('YOU', K.got, PIX.PAL.F);
            if (!n) {
              const b2 = S.actor('boy');
              if (b2) b2.mood = 'happy';
              S.face('happy');
              await S.say('TOBIAS', 'YOU FOUND ALL OF IT.', PIX.PAL.O);
              S.face(null);
            }
          };
        });
        if (sp.id === 'door') {
          sp.look = 'A MORNING WITH NOTHING WRONG WITH IT.';
          sp.onUse = async () => {
            const n = ['pencils', 'crayons', 'bag'].filter(k => !st.kit[k]).length;
            if (n) {
              await S.say('YOU', n === 1
                ? 'ONE MORE THING AND WE CAN GO.'
                : 'NOT WITHOUT HIS THINGS. ' + n + ' STILL IN THIS HOUSE SOMEWHERE.',
                PIX.PAL.F);
              return;
            }
            st.done = true;
          };
        }
      });
    }

    /* ---------------- 1. THE KITCHEN ---------------- */
    await shot(H, async (S, def) => {
      S.hour(7 * 60 + 20);
      S.weather('fine');
      S.black(true);
      S.cam(M.SINK + 20);
      S.place(M.STOVE + 40, -1, 0.10);
      await S.wait(240);
      await S.rise(1000);
      await S.card('SIX YEARS AGO', 'A TUESDAY, AND NOTHING HAPPENS', 2100);
      await S.say('CLEO', 'KETTLE IS ON. HE HAS NOT FOUND HIS SHOES YET.',
        PIX.PAL.P);

      /* --- TEACH: TAP THE FLOOR TO WALK. Not a tooltip; he is simply
             standing in the wrong place and the room is yours. --- */
      wire(S);
      SCENE.busy(false);
      if (typeof UI !== 'undefined' && UI.stampSmall) {
        UI.stampSmall('TAP THE FLOOR TO WALK');
      }
      const x0 = SCENE.me.x;
      for (let i = 0; i < 500; i++) {
        gate();
        if (Math.abs(SCENE.me.x - x0) > 22) break;
        await U.sleep(120);
      }
      SCENE.busy(true);
      await S.say('YOU', 'ALL RIGHT. EGGS.', PIX.PAL.F);

      /* --- TEACH: USE A THING. The stove has a bracket round it and a
             word on it, same as every door and drawer in the game. --- */
      SCENE.busy(false);
      if (typeof UI !== 'undefined' && UI.stampSmall) {
        UI.stampSmall('WALK UP TO A THING AND TAP IT');
      }
      for (let i = 0; i < 900 && !st.pan; i++) { gate(); await U.sleep(120); }
      SCENE.busy(true);

      /* --- TEACH: TALK. The boy is a thing with a bracket round him too. */
      await S.pan(SCENE.def ? M.STOVE : M.STOVE, M.TABLE - 10, 1800);
      /* ============================================================
         THE TWO CONVERSATIONS THIS GAME IS ACTUALLY ABOUT.

         Both of these used to be one line each, fired by the script,
         with nothing you could say back. They are proper exchanges
         now -- state-aware, with replies, with faces on them -- and
         they can be had as many times as you like, because a boy who
         has one thing to say is a sign, not a son.

         Everything they say knows what you have done: whether the egg
         is on the plate, whether the reader has turned up, whether
         you have already told him off for not looking properly. And
         both of them react -- his face goes happy when you feed him,
         hers goes tired when you say you will be late, and yours
         goes warm for about two seconds, which is the only place in
         this entire game it is allowed to.
         ============================================================ */
      const boy = S.actor('boy');
      if (boy) {
        boy.label = 'TOBIAS';
        boy.hint = () => (kitDone() ? 'HE IS READY' : 'TALK');
        boy.onUse = async () => {
          const b = S.actor('boy');
          /* ---- after the book has turned up: he is just a happy kid ---- */
          if (kitDone()) {
            if (b) b.mood = 'happy';
            const r0 = await S.ask('TOBIAS', 'CAN WE GO THE WAY WITH THE BRIDGE.',
              ['WE CAN GO THE WAY WITH THE BRIDGE.', 'WE ARE ALREADY LATE.',
               'EAT YOUR EGG FIRST.']);
            if (r0 === 0) {
              S.face('happy');
              await S.say('TOBIAS', 'YES! I WANT TO SEE IF THE BOAT IS THERE.',
                PIX.PAL.O);
              await S.say('YOU', 'THEN GET YOUR SHOES ON.', PIX.PAL.F);
              S.face(null);
            } else if (r0 === 1) {
              await S.say('TOBIAS', 'WE ARE ALWAYS LATE. IT IS FINE.', PIX.PAL.O);
              await S.say('CLEO', 'HE IS NOT WRONG.', PIX.PAL.P);
            } else {
              await S.say('TOBIAS', 'I HAVE EATEN MOST OF IT.', PIX.PAL.O);
              await S.say('YOU', 'MOST IS NOT ALL.', PIX.PAL.F);
            }
            return;
          }
          /* ---- some of it in, some of it not: he counts ---- */
          if (st.asked) {
            const n = kitLeft();
            const HAVE = [['pencils', 'MY PENCIL CASE'], ['crayons', 'MY CRAYONS'],
              ['bag', 'MY BAG']].filter(k => !st.kit[k[0]]).map(k => k[1]);
            await S.say('TOBIAS', n === 1
              ? 'JUST ' + HAVE[0] + ' NOW.'
              : 'STILL ' + HAVE.join(' AND ') + '.', PIX.PAL.O);
            if (n === 1) await S.say('YOU', 'THEN WE ARE NEARLY OUT OF THE DOOR.', PIX.PAL.F);
            return;
          }
          /* ---- the first proper conversation in the game ---- */
          if (!st.asked) {
            await S.say('TOBIAS', 'I CANNOT FIND MY THINGS FOR SCHOOL.', PIX.PAL.O);
            await S.say('TOBIAS', 'MY PENCIL CASE AND MY CRAYONS AND MY BAG. '
              + 'ALL OF THEM.', PIX.PAL.O);
            const r1 = await S.ask('YOU', 'ALL THREE AT ONCE?',
              ['THEN WE FIND ALL THREE. WHERE WERE YOU SITTING?',
               'YOU HAVE LOOKED. YOU HAVE NOT SEARCHED.',
               'TAKE MINE. IT IS A NOTEBOOK AND A PENCIL AND NO CRAYONS.']);
            if (r1 === 0) {
              if (b) b.mood = 'happy';
              await S.say('TOBIAS', 'ON THE SOFA. AND THE FLOOR. AND THE SOFA AGAIN.',
                PIX.PAL.O);
              await S.say('YOU', 'THEN WE START AT THE SOFA.', PIX.PAL.F);
            } else if (r1 === 2) {
              if (b) b.mood = 'happy';
              S.face('happy');
              await S.say('TOBIAS', 'CAN I REALLY?', PIX.PAL.O);
              await S.say('CLEO', 'HE CANNOT. FIND HIS OWN.', PIX.PAL.P);
              S.face(null);
            } else {
              await S.say('TOBIAS', 'WHAT IS THE DIFFERENCE.', PIX.PAL.O);
              await S.say('YOU', 'ABOUT THIRTY YEARS AND A BADGE.', PIX.PAL.F);
            }
            st.asked = true;
            return;
          }
          /* ---- and afterwards he has more than one thing to say ---- */
          const lines = st.pan
            ? ['THE WHITE IS THE BEST BIT.', 'IS THERE MORE.',
               'CAN I HAVE THE CRUSTS.']
            : ['I AM HUNGRY.', 'MUM SAYS YOU BURN THEM.',
               'ARE YOU MAKING EGGS OR NOT.'];
          await S.say('TOBIAS', lines[(st._bt = (st._bt || 0) + 1) % lines.length],
            PIX.PAL.O);
        };
      }

      /* ---- AND CLEO, who had no interaction at all ---- */
      const wife = S.actor('wife');
      if (wife) {
        wife.label = 'CLEO';
        wife.hint = 'TALK';
        wife.onUse = async () => {
          const wf = S.actor('wife');
          if (!st.pan) {
            const r = await S.ask('CLEO', 'HE HAS TO BE OUT OF THAT DOOR IN TEN '
              + 'MINUTES AND HE HAS NOT EATEN.',
              ['I AM DOING THE EGGS NOW.', 'HE CAN HAVE BREAD.',
               'HE COULD BE LATE ONCE.']);
            if (r === 0) {
              if (wf) wf.mood = 'pleased';
              await S.say('CLEO', 'THANK YOU. TWO. THE PAN IS ALREADY ON.',
                PIX.PAL.P);
            } else if (r === 1) {
              if (wf) wf.mood = 'hard';
              await S.say('CLEO', 'HE HAD BREAD YESTERDAY.', PIX.PAL.P);
              await S.say('YOU', 'ALL RIGHT. EGGS.', PIX.PAL.F);
            } else {
              if (wf) wf.mood = 'hard';
              await S.say('CLEO', 'HE COULD. YOU COULD ALSO COOK HIM AN EGG.',
                PIX.PAL.P);
            }
            return;
          }
          if (!kitDone()) {
            const r = await S.ask('CLEO', 'HE HAS LOST HALF HIS SCHOOL BAG AGAIN.',
              ['I WILL FIND IT.', 'HE SHOULD LOOK PROPERLY.',
               'WHERE WAS HE SITTING LAST NIGHT.']);
            if (r === 2) {
              await S.say('CLEO', 'ON THE SOFA. WITH HIS FEET UP, AS USUAL. '
                + 'AND HIS CRAYONS WENT ON THE MANTEL.', PIX.PAL.P);
              await S.say('YOU', 'THAT IS TWO STATEMENTS AND TWO LOCATIONS.', PIX.PAL.F);
            } else if (r === 0) {
              if (wf) wf.mood = 'pleased';
              await S.say('CLEO', 'YOU ALWAYS DO. IT IS VERY IRRITATING.',
                PIX.PAL.P);
            } else {
              await S.say('CLEO', 'HE IS EIGHT.', PIX.PAL.P);
            }
            return;
          }
          const r = await S.ask('CLEO', 'GO ON, THEN. BEFORE THE BOTH OF YOU '
            + 'TALK YOURSELVES INTO ANOTHER HOUR.',
            ['I WILL BE BACK BY SIX.', 'IT MIGHT BE LATE.',
             'COME WITH US.']);
          if (r === 0) {
            if (wf) wf.mood = 'happy';
            S.face('happy');
            await S.say('CLEO', 'SIX. I WILL HOLD YOU TO IT.', PIX.PAL.P);
            S.face(null);
          } else if (r === 1) {
            if (wf) wf.mood = 'sad';
            await S.say('CLEO', 'IT IS ALWAYS MIGHT.', PIX.PAL.P);
            await S.say('YOU', 'IT IS ALWAYS THE JOB.', PIX.PAL.F);
          } else {
            await S.say('CLEO', 'AND WHO WOULD BE HERE WHEN YOU BOTH GET BACK.',
              PIX.PAL.P);
          }
        };
      }
      SCENE.busy(false);
      if (typeof UI !== 'undefined' && UI.stampSmall) {
        UI.stampSmall('WALK UP TO SOMEBODY AND TAP THEM');
      }
      for (let i = 0; i < 900 && !st.asked; i++) { gate(); await U.sleep(120); }
      SCENE.busy(true);

      /* --- TEACH: FETCH THREE THINGS. The tool tutorial used to live
             here -- set the glass, say a line about holding it up to
             things, wait for one book to come out from under a cushion.
             A boy's school kit does the same teaching without a tool
             and without a gate: three named things, three taps, and a
             tally on screen as they come in. --- */
      await S.say('YOU', 'PENCIL CASE. CRAYONS. BAG. '
        + 'THE CUSHIONS, THE MANTEL AND THE HOOKS.', PIX.PAL.F);
      hudOn(true);
      SCENE.busy(false);
      if (typeof UI !== 'undefined' && UI.stampSmall) {
        UI.stampSmall('WALK UP TO A THING AND TAP IT TO TAKE IT');
      }
      for (let i = 0; i < 1400 && !kitDone(); i++) { gate(); await U.sleep(120); }
      SCENE.busy(true);
      await S.say('CLEO', 'HE IS A POLICEMAN, TOBIAS. IT IS ALL HE DOES.',
        PIX.PAL.P);

      /* --- and out of the door --- */
      SCENE.busy(false);
      if (typeof UI !== 'undefined' && UI.stampSmall) UI.stampSmall('THE BAG, THEN THE DOOR');
      for (let i = 0; i < 1400 && !st.done; i++) { gate(); await U.sleep(120); }
      SCENE.busy(true);
      hudOn(false);
      await S.say('CLEO', 'BE BACK BY SIX. IT IS YOUR TURN TO COOK PROPERLY.',
        PIX.PAL.P);
      S.face('happy');
      await S.say('YOU', 'I WILL BRING SOMETHING.', PIX.PAL.F);
      S.face(null);
      await S.fade(700);
    });

    /* ---------------- 2. THE DRIVE, AND THE GATE ---------------- */
    if (typeof CINE !== 'undefined' && CINE.driveTo) await CINE.driveTo('THE SCHOOL');
    await shot(school(), async (S, def) => {
      S.hour(8 * 60 + 20);
      S.weather('fine');
      S.black(true);
      S.cam(120);
      S.place(70, 1, 0.14);
      await S.wait(200);
      await S.rise(760);
      /* the boy walks himself in, which is the only thing in this whole
         prologue that happens without you */
      const b = { id: 'tob', x: 92, y: def.floorY, face: 1, key: 'cutBoyG',
        def: BOY_DEF, scale: 0.66 };
      def.actors.push(b);
      await S.wait(300);
      await S.say('TOBIAS', 'YOU DO NOT HAVE TO COME IN.', PIX.PAL.O);
      S.face('happy');
      await S.say('YOU', 'I AM NOT COMING IN. I AM WATCHING YOU GO IN.', PIX.PAL.F);
      S.face(null);
      await S.pan(120, def.marks.GATE + 20, 1700);
      await S.send('tob', def.marks.GATE + 8, 22);
      await S.wait(300);
      b.face = -1;
      b.arm = 'up';
      SFX.tone(1180, 0.05, 'square', 0.05);
      await S.wait(700);
      await S.say('TOBIAS', 'BYE!', PIX.PAL.O);
      b.arm = '';
      await S.send('tob', def.marks.GATE + 40, 26);
      b.gone = true;
      await S.wait(500);
      await S.fade(700);
    });

    /* ---------------- 3. THE DESK, AND THE ENVELOPE ---------------- */
    if (typeof CINE !== 'undefined' && CINE.driveTo) await CINE.driveTo('THE STATION');
    const D = { opened: false };
    await shot(desk(D), async (S, def) => {
      S.hour(9 * 60 + 15);
      S.weather('haze');
      S.black(true);
      S.cam(110);
      S.place(70, 1, 0.12);
      await S.wait(200);
      await S.rise(820);
      await S.card('MONDAY, TEN DAYS LATER', 'AND THE POST CAME UP FROM THE DESK', 2100);
      await S.pan(110, def.marks.DESK, 1900);
      await S.say('YOU', 'NO STAMP ON IT. SOMEBODY WALKED IT IN.', PIX.PAL.F);

      let opened = false;
      def.spots.forEach(sp => {
        sp.look = 'AN ENVELOPE WITH MY NAME ON IT AND NOTHING ELSE.';
        sp.onUse = async () => { opened = true; };
      });
      SCENE.busy(false);
      if (typeof UI !== 'undefined' && UI.stampSmall) UI.stampSmall('OPEN IT');
      for (let i = 0; i < 900 && !opened; i++) { gate(); await U.sleep(120); }
      SCENE.busy(true);

      /* ---- the letter ---- */
      D.opened = true;
      const D2 = desk(D);
      SCENE.open(D2);
      SCENE.busy(true);
      SCENE.look(def.marks.DESK + 6);
      SCENE.place(def.marks.DESK - 34, 1, 0.12);
      await S.wait(400);
      S.shake();
      S.thud(48, 0.34);
      S.face('alarm');
      await S.wait(600);
      await S.say('THE LETTER', 'WE HAVE YOUR WIFE AND WE HAVE YOUR BOY.',
        PIX.PAL.q);
      await S.say('THE LETTER', 'THEY ARE ALIVE THIS MORNING. DO NOT GO HOME. '
        + 'DO NOT TELL YOUR CAPTAIN.', PIX.PAL.q);
      await S.say('THE LETTER', 'THERE IS NOTHING YOU CAN PAY US. '
        + 'THIS IS FOR SOMETHING YOU DID.', PIX.PAL.q);
      S.face('worry');
      await S.say('YOU', 'THERE IS SOMETHING IN THE FOLD.', PIX.PAL.F);
      S.face(null);

      /* ---- AND THE ZOOM RIGHT IN. The eyeglass, on one cigarette end. */
      S.cutIn(true);
      SCENE.look(def.marks.DESK + 10);
      await S.wait(500);
      S.arm('reach');
      await S.wait(560);
      S.arm('up');
      await S.glass(def.marks.DESK + 10, def.floorY - 39, 'IN THE FOLD OF THE LETTER', [
        'ONE CIGARETTE END. SMOKED DOWN TO THE PRINT AND PUT OUT CAREFULLY.',
        'GAULOISE. CAPORAL. AND UNDER THAT, IN FOUR POINT: PARIS.',
        'NOBODY IN THIS STATE SELLS THEM.',
      ]);
      S.arm('');
      S.free();
      await S.fade(760);
    });

    /* ---------------- 4. THE TABAC, who confirms it ---------------- */
    await shot(tabac(), async (S, def) => {
      S.hour(10 * 60);
      S.black(true);
      S.cam(110);
      S.place(60, 1, 0.12);
      await S.wait(200);
      await S.rise(760);
      await S.card('THE TABAC ON SIXTH', 'THIRTY YEARS BEHIND THAT COUNTER', 1900);
      await S.pan(110, def.marks.COUNT, 1700);
      let asked = false;
      def.spots.forEach(sp => {
        sp.look = 'A WALL OF EVERY BRAND SOLD WITHIN A HUNDRED MILES. '
          + 'AND ONE GAP IN IT.';
        sp.onUse = async () => { asked = true; };
      });
      SCENE.busy(false);
      if (typeof UI !== 'undefined' && UI.stampSmall) UI.stampSmall('SHOW HIM THE CIGARETTE');
      for (let i = 0; i < 900 && !asked; i++) { gate(); await U.sleep(120); }
      SCENE.busy(true);
      await S.say('THE TABAC', 'I HAVE NOT SOLD ONE OF THOSE IN MY LIFE.',
        PIX.PAL.B);
      await S.say('THE TABAC', 'NOR HAS ANYBODY BETWEEN HERE AND THE COAST. '
        + 'THAT IS A FRENCH CIGARETTE, FRIEND.', PIX.PAL.B);
      await S.say('THE TABAC', 'WHOEVER PUT THAT OUT BOUGHT IT IN PARIS.',
        PIX.PAL.B);
      S.face('hard');
      await S.say('YOU', 'THEN THAT IS WHERE THEY ARE.', PIX.PAL.F);
      S.face(null);
      await S.fade(800);
    });
  }

  /* the HUD is the cutscene's to hand back: the prologue needs the tool
     belt visible, because the belt is the thing it is teaching */
  function hudOn(v) {
    document.body.classList.toggle('cut-hud', !!v);
  }

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
      await S.card('THAT NIGHT', 'HE HAD BEEN TOLD NOT TO GO HOME', 2000);

      /* --- 0:04 HE COMES IN THROUGH IT. Not placed in the room: he walks
             over the threshold out of the rain, which is the difference
             between a shot and a diagram. --- */
      S.place(10, 1, 0.10);
      S.hide(false);
      S.face('hard');
      await S.wait(240);
      await S.meTo(M.DOOR + 26);
      await S.wait(320);
      await S.say('YOU', 'THE LOCK WAS OFF THE JAMB. THEY DID NOT KNOCK.',
        PIX.PAL.F);
      S.face(null);

      /* --- 0:09 THE HALL. He walks it; the camera goes with him. --- */
      const walk = S.meTo(M.HALL + 26);
      await S.pan(M.DOOR + 10, M.HALL + 40, 2400);
      await walk;
      S.face('hard');
      await S.say('YOU', 'THE TELEPHONE IS OFF THE TABLE. SHE GOT AS FAR AS '
        + 'PICKING IT UP.', PIX.PAL.F);
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
      await S.say('YOU', 'HER CHAIR IS ON ITS SIDE. SHE FOUGHT THEM IN HERE.',
        PIX.PAL.F);
      S.face('worry');
      await S.say('YOU', 'AND THE WINDOW IS UP. IN NOVEMBER.', PIX.PAL.F);
      await S.say('YOU', 'NO BLOOD. NOBODY IS DEAD IN THIS HOUSE.', PIX.PAL.F);
      S.face(null);

      /* --- three places, and you have to look. The room's own spots,
             the room's own markers, the room's own walk-and-use: this
             beat is not a cutscene at all any more, it is the game. --- */
      const SAID = {
        chair: 'HIS READER IS UNDER IT. HE WAS SITTING HERE AT SEVEN O CLOCK.',
        window: 'UP FROM THE INSIDE, AND THE SILL IS SCUFFED BOTH WAYS. '
          + 'THEY WENT OUT OF IT CARRYING SOMETHING.',
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
      await S.glass(M.TABLE + 8, def.floorY - 42, 'IN THE ASHTRAY', [
        'THE SECOND ONE TODAY. SAME PRINT, SAME FOUR POINT TYPE.',
        'HE STOOD IN MY FRONT ROOM AND FINISHED IT WHILE HE WAITED.',
        'GAULOISE. CAPORAL. PARIS.',
      ]);
      S.face('hard');
      await S.say('YOU', 'THEY ARE NOT IN THIS COUNTRY ANY MORE.', PIX.PAL.F);
      S.face(null);
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
    const wasWeather = (typeof G !== 'undefined') ? G.weather : null;
    try {
      await prologue();
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
      document.body.classList.remove('cut-hud');
      /* the hour and the weather belong to the shift again */
      if (typeof DAY !== 'undefined') DAY.unpin();
      if (typeof G !== 'undefined' && wasWeather) G.weather = wasWeather;
      if (typeof TOOLS !== 'undefined') TOOLS.set('hand');
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
    play, skip, prologue, opening, airport, flight, stage, unstage,
    fade, rise, black,
    /* the exam is signed off short if the player walked out of the opening */
    wasSkipped() { return didSkip; },
    home, school, desk, tabac, house, orly, cabin, office,
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
