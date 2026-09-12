'use strict';
/* ============================================================
   SHELL & DEBT — menu.js
   THE TITLE IS A SHOT, NOT A NOTICEBOARD.

   What was here before was a corkboard: a masthead card stabbed
   with a knife, five mugshots on pins, red string between them,
   and a painted office behind it. It told you who was in the game
   before you had met any of them, and it did not move.

   This is the first thirty seconds of the film instead. A wet
   street outside a tabac at two in the morning. He is under the
   awning with a cigarette, in the only light on the block. The
   camera breathes. Something comes out of the alley, and he does
   not talk to it.

   It runs in the REAL scene runtime -- the same rig, the same
   room canvas, the same walk cycle the game uses -- so the menu
   cannot drift away from what the game looks like. A title screen
   drawn by hand is a title screen that goes stale the week after
   somebody changes the frog.
   ============================================================ */

const MENU = (() => {
  const px = (c, x, y, w, h, col) => ART.px(c, x, y, w, h, col);
  const P = () => PIX.PAL;

  /* the set, in room pixels. Narrow: this is a composed shot and
     the camera only ever walks a little way along it. */
  /* ------------------------------------------------------------
     BLOCKING.

     The frame holds about 213 room columns and the menu owns the
     left third of it, so the geometry is set by where the RAIL is
     rather than by what looks tidy on its own: he stands just past
     the middle, clear of the words, and the alley mouth sits at
     the right-hand edge so they walk in from off screen.
     ------------------------------------------------------------ */
  /* The building is drawn in its OWN coordinates, from zero, and then
     set down at X0 along a street that is wider than the frame -- because
     a camera cannot move in a room the same size as the shot. At 272 wide
     the pan clamped to nothing and the whole drift did not happen. */
  const X0 = 104, FY = 104;
  const AWN_X = 16, AWN_W = 132, AWN_Y = 42;     /* the awning over him */
  const LAMP_X = 172, LAMP_Y = 20;               /* the lamp, down by the alley */
  const BULB_X = 104, BULB_Y = 47;               /* the bulb under the awning */
  const SHOP_W = 152;                            /* where the tabac ends */
  const ALLEY_X = 186, ALLEY_W = 58;             /* where they come from */
  const BLOCK = 272;                             /* the whole frontage */
  const W = X0 + BLOCK + 40;

  /* and the same landmarks in street coordinates, for everything that is
     not the baked painting: the light, the reel, the camera */
  const LAMP = X0 + LAMP_X;
  const BULB = X0 + BULB_X;
  const AWN = X0 + AWN_X;
  const ALLEY = X0 + ALLEY_X;
  const HIM = X0 + 104;                          /* where he stands */
  const MARK = X0 + 156;                         /* where they stop */
  const CAM = HIM - 4;                           /* him just past the middle */

  /* ------------------------------------------------------------
     THE RAIN.

     Its own field, not the one in scene.js: that one is driven by
     the hour and the weather and is switched off at the title
     phase, and this street is raining because the film says so.
     Three depths -- far, mid, near -- because rain that is all one
     speed reads as a screen wipe rather than as weather.
     ------------------------------------------------------------ */
  const RAIN = (() => {
    const rng = U.mulberry32(19771103);
    return Array.from({ length: 260 }, () => {
      const d = rng();
      return {
        x: rng(), y: rng(),
        /* near drops are longer, faster and paler */
        depth: d,
        len: 3 + Math.round(d * 7),
        sp: 130 + d * 260,
        a: 0.10 + d * 0.26,
      };
    });
  })();
  /* and what it does when it lands */
  const SPLASH = (() => {
    const rng = U.mulberry32(19840517);
    return Array.from({ length: 34 }, () => ({ x: rng(), ph: rng() * 9, sp: 1.6 + rng() * 2.4 }));
  })();

  /* ============================================================
     THE SET, BAKED ONCE.
     ============================================================ */
  function paint(c) {
    const p = P();

    /* ---- the night behind everything ---- */
    px(c, 0, 0, W, FY + 2, '#070a10');
    /* a bruise of city light in the sky, off to the right */
    for (let i = 0; i < 26; i++) {
      px(c, 0, i, W, 1, 'rgba(40,58,92,' + (0.16 * (1 - i / 26)).toFixed(3) + ')');
    }

    /* everything from here to the restore is the BUILDING, drawn from its
       own zero and set down along the street */
    c.save();
    c.translate(X0, 0);

    /* ---- the building front: a tabac, shut, with one lit pane ---- */
    px(c, 0, 8, SHOP_W, FY - 8, '#181017');
    ART.grain(c, 0, 8, SHOP_W, FY - 8, '#120b11', '#22161f', 31);
    /* the stone courses */
    for (let y = 12; y < FY; y += 11) px(c, 0, y, SHOP_W, 1, 'rgba(0,0,0,.34)');
    /* the shop window, dark but for the till lamp behind it */
    px(c, 22, 52, 64, 40, '#0a0f14');
    px(c, 24, 54, 60, 36, '#12202a');
    ART.dither(c, 24, 54, 60, 36, 'rgba(255,214,140,.10)', 0.22, 7);
    px(c, 52, 54, 2, 36, '#0a0f14');
    px(c, 24, 70, 60, 2, '#0a0f14');
    /* the till lamp: the warm smudge deep inside */
    PIX.disc(c, 68, 78, 7, 'rgba(255,196,110,.10)');
    PIX.disc(c, 68, 78, 4, 'rgba(255,212,140,.16)');
    /* the door, shut, with the closed sign on it */
    px(c, 100, 48, 30, FY - 48, '#0d0a10');
    px(c, 102, 50, 26, FY - 52, '#1a1119');
    px(c, 106, 62, 18, 12, '#0a0f14');
    px(c, 108, 64, 14, 8, '#243444');
    px(c, 112, 84, 4, 2, '#7d5210');

    /* ---- THE NEON. The one saturated thing in the frame. ---- */
    neon(c);

    /* ---- the awning he is standing under ---- */
    for (let i = 0; i < 8; i++) {
      const band = Math.floor(i / 2) % 2;
      px(c, AWN_X - i, AWN_Y + i, AWN_W + i * 2, 1, band ? '#5c1620' : '#2a1016');
    }
    px(c, AWN_X - 8, AWN_Y + 8, AWN_W + 16, 2, '#0a0508');
    /* the scallops along its edge */
    for (let sx = AWN_X - 8; sx < AWN_X + AWN_W + 8; sx += 9) {
      px(c, sx + 2, AWN_Y + 10, 5, 3, '#3a121a');
      px(c, sx + 3, AWN_Y + 13, 3, 1, '#0a0508');
    }
    /* THE BULB UNDER THE AWNING. He is lit from directly overhead by a
       forty-watt bulb on a flex, which is the only reason you can see his
       face at all -- and the reason the rain coming off the awning edge
       is the brightest thing at his feet. */
    /* A DISC AT RADIUS THREE IS A DIAMOND, and a gold diamond hanging
       over his hat read as a sparkle rather than as a forty-watt bulb.
       Drawn as the thing it is: flex, brass cap, glass. */
    px(c, BULB_X, AWN_Y + 10, 1, BULB_Y - AWN_Y - 12, '#1a1a22');
    px(c, BULB_X - 1, BULB_Y - 3, 3, 2, '#6e4c12');       /* the cap */
    px(c, BULB_X - 1, BULB_Y - 3, 3, 1, '#a5741f');
    px(c, BULB_X - 2, BULB_Y - 1, 5, 4, '#ffe6a8');       /* the glass */
    px(c, BULB_X - 1, BULB_Y + 3, 3, 1, '#ffe6a8');
    px(c, BULB_X - 1, BULB_Y, 2, 2, '#fff6d8');           /* the filament */
    /* the halo, soft, so it does not come out as a second shape */
    for (let r = 5; r >= 2; r--) {
      PIX.disc(c, BULB_X, BULB_Y, r, 'rgba(255,224,150,' + (0.055 / (r - 1)).toFixed(3) + ')');
    }

    /* the poles holding it up */
    px(c, AWN_X + 4, AWN_Y + 10, 2, FY - AWN_Y - 10, '#14161c');
    px(c, AWN_X + AWN_W - 6, AWN_Y + 10, 2, FY - AWN_Y - 10, '#14161c');

    /* ---- the wall between the shop and the alley ---- */
    px(c, SHOP_W, 6, ALLEY_X - SHOP_W, FY - 6, '#141018');
    ART.grain(c, SHOP_W, 6, ALLEY_X - SHOP_W, FY - 6, '#0e0a12', '#1e1722', 17);
    /* a bill pasted up and coming away at the corner */
    px(c, 156, 44, 22, 30, '#2a2620');
    px(c, 158, 46, 18, 26, '#3c362c');
    for (let y = 50; y < 70; y += 5) px(c, 160, y, 14, 1, 'rgba(0,0,0,.30)');
    px(c, 172, 44, 6, 7, '#1a1118');                 /* the peeled corner */
    /* the drainpipe, which is where most of the water is going */
    px(c, 180, 6, 4, FY - 6, '#0f1216');
    px(c, 180, 6, 1, FY - 6, '#252c34');
    for (let y = 18; y < FY; y += 22) px(c, 179, y, 6, 3, '#0f1216');

    /* ---- THE ALLEY. Nothing in it. That is the point. ---- */
    px(c, ALLEY_X, 0, ALLEY_W, FY + 2, '#04060a');
    px(c, ALLEY_X - 2, 0, 2, FY + 2, '#0a0d12');
    px(c, ALLEY_X + ALLEY_W, 0, 2, FY + 2, '#0a0d12');
    /* a far wall a long way down it, barely there */
    px(c, ALLEY_X + 8, 30, ALLEY_W - 16, FY - 30, '#070a0f');
    ART.dither(c, ALLEY_X + 8, 30, ALLEY_W - 16, FY - 34, 'rgba(60,80,110,.05)', 0.2, 23);

    /* ---- and the block carrying on past it ---- */
    px(c, ALLEY_X + ALLEY_W, 10, BLOCK - ALLEY_X - ALLEY_W, FY - 10, '#12101a');
    ART.grain(c, ALLEY_X + ALLEY_W, 10, BLOCK - ALLEY_X - ALLEY_W, FY - 10, '#0d0b14', '#1b1824', 41);

    c.restore();
    /* ---- the pavement, and the road past the kerb ---- */
    px(c, 0, FY, W, 132 - FY, '#0b0e13');
    /* the flags, wet */
    for (let x = 0; x < W; x += 17) px(c, x, FY, 1, 132 - FY, 'rgba(0,0,0,.34)');
    px(c, 0, FY, W, 1, '#1d242c');
    px(c, 0, FY + 1, W, 1, 'rgba(0,0,0,.45)');
    /* the kerb and the gutter running with water */
    px(c, 0, FY + 16, W, 2, '#0a0d11');
    px(c, 0, FY + 18, W, 132 - FY - 18, '#080b0f');
    px(c, 0, FY + 18, W, 1, 'rgba(120,160,200,.10)');

    /* ---- the puddles, which are where the neon actually lives ---- */
    puddle(c, X0 + 80, FY + 8, 58, 7, 0.30);
    puddle(c, X0 + 150, FY + 12, 40, 6, 0.20);
    puddle(c, X0 + 228, FY + 6, 34, 5, 0.16);

    /* ---- the lamp column, and the pool it throws ----
       PAINTED AFTER THE RESTORE, so it is in street coordinates like the
       cone that comes off it. In building coordinates the post stood a
       hundred pixels away from its own light. */
    px(c, LAMP - 1, LAMP_Y + 8, 3, FY - LAMP_Y - 8, '#0e1116');
    px(c, LAMP - 1, LAMP_Y + 8, 1, FY - LAMP_Y - 8, '#222932');
    px(c, LAMP - 6, LAMP_Y + 2, 12, 3, '#0e1116');
    px(c, LAMP - 4, LAMP_Y + 5, 8, 4, '#ffe6a8');
    px(c, LAMP - 3, LAMP_Y + 5, 6, 2, '#fff6d8');

    /* the dark in the corners, so the frame has edges */
    for (let i = 0; i < 18; i++) {
      const a = 0.40 * (1 - i / 18);
      px(c, i, 0, 1, 132, 'rgba(0,0,0,' + a.toFixed(3) + ')');
      px(c, W - 1 - i, 0, 1, 132, 'rgba(0,0,0,' + a.toFixed(3) + ')');
      px(c, 0, i, W, 1, 'rgba(0,0,0,' + (a * 0.7).toFixed(3) + ')');
    }
  }

  /* THE SIGN. Two words of neon over a shut shop, and the whole
     colour budget of the frame goes on it. */
  function neon(c) {
    const R = '#ff2e4d', RD = '#8c1226', G = '#ffd75e';
    /* the box it is bolted to */
    px(c, 26, 18, 96, 22, '#0a0a10');
    px(c, 26, 18, 96, 1, '#1c1c26');
    /* TABAC, in tube */
    const word = PIXFONT.render('TABAC', { scale: 2, color: R, shadow: null });
    c.drawImage(word, 26 + Math.round((96 - word.width) / 2), 22);
    /* the carrot that says tabac in France, hanging off the end */
    PIX.disc(c, 112, 46, 5, RD);
    PIX.disc(c, 112, 45, 4, R);
    px(c, 111, 40, 2, 4, '#2a7a4e');
    /* the tubes' own bloom, baked soft */
    for (let i = 3; i >= 1; i--) {
      px(c, 26 - i, 18 - i, 96 + i * 2, 22 + i * 2, 'rgba(255,46,77,' + (0.05 / i).toFixed(3) + ')');
    }
    px(c, 26, 41, 96, 1, 'rgba(255,46,77,.16)');
    /* a gold underline, for the one warm note */
    px(c, 34, 38, 80, 1, 'rgba(255,215,94,.30)');
  }

  /* standing water: a dark sheet with the sign bleeding into it */
  function puddle(c, x, y, w, h, a) {
    SPR.ellipse ? SPR.ellipse(c, x + w / 2, y + h / 2, w / 2, h / 2, '#060a10')
      : px(c, x, y, w, h, '#060a10');
    px(c, x + 2, y + 1, w - 4, 1, 'rgba(120,160,200,' + (a * 0.5).toFixed(3) + ')');
    /* the neon, upside down and broken up */
    for (let i = 0; i < w; i += 3) {
      if ((i * 7) % 5 === 0) continue;
      px(c, x + i, y + 2 + ((i * 3) % (h - 2)), 2, 1, 'rgba(255,46,77,' + (a * 0.55).toFixed(3) + ')');
    }
    px(c, x + Math.round(w * 0.62), y + 3, 3, 1, 'rgba(255,215,94,' + a.toFixed(3) + ')');
  }

  /* ============================================================
     WHAT MOVES.
     ============================================================ */
  let live = false;              /* the reel is running */
  /* ------------------------------------------------------------
     THE CAMERA IS OURS.

     SCENE.pan is an async loop that calls look() every 24ms until it
     lands, and nothing outside it can call it off. So stopping the
     menu did not stop the camera: press PLAY mid-drift and the pan
     carried on writing over the look() that was supposed to hold on
     his face. One from/to pair, moved by the same ticker that ages
     the bodies, and it stops when the ticker does.
     ------------------------------------------------------------ */
  let camA = 0, camB = 0, camT = 0, camMs = 1;
  let flashT = 0;                /* muzzle flash, in seconds remaining */
  let bodies = [];               /* what is left on the pavement */
  let smokeT = 0;                /* his cigarette, for the ember */

  /* the light this street actually has: a cone off the lamp, the
     neon wash, and the rain going through both */
  function onPaintFront(c, T) {
    /* both cones go over the set but UNDER the cast, so he stands in the
       light rather than behind it */
    cone(c, LAMP, LAMP_Y + 8, 40, 70, 0.055);
    /* the bulb is close over his head, so its cone is short and hot, and
       it flickers the way a cheap flex does */
    const f = Math.sin(T * 21) > 0.93 ? 0.55 : 1;
    cone(c, BULB, BULB_Y + 3, 22, FY - BULB_Y - 3, 0.085 * f);
  }

  function cone(c, x, y, spread, drop, a) {
    for (let i = 0; i < drop; i++) {
      const t = i / drop;
      const hw = 4 + t * spread;
      px(c, Math.round(x - hw), y + i, Math.round(hw * 2), 1,
        'rgba(255,231,163,' + (a * (1 - t)).toFixed(4) + ')');
    }
  }

  /* ------------------------------------------------------------
     THE CIGARETTE.

     `smoke` is an idle job an ACTOR can be given -- it puts a cig in
     the hand and a curl of grey over it -- and the player is not an
     actor: he has an arm pose and nothing in it. So the one thing
     the whole shot is named after had to be drawn here, off the
     posed hand, which SCENE.meHand hands back in room pixels.
     ------------------------------------------------------------ */
  function cigarette(c, T) {
    if (smokeT <= 0) return;
    const h = SCENE.meHand && SCENE.meHand();
    if (!h) return;
    const x = Math.round(h.x) + 2, y = Math.round(h.y) - 3;
    /* he drags on it every four seconds and it glows while he does */
    const drag = Math.max(0, Math.sin(T * 1.5) - 0.86) / 0.14;
    /* the stick */
    px(c, x, y, 5, 1, '#efe6cc');
    px(c, x, y + 1, 5, 1, '#c9bfa4');
    /* the ember, and what the ember does to the rain round it */
    px(c, x + 5, y, 1, 1, drag > 0.2 ? '#ffb45e' : '#e0631e');
    if (drag > 0.2) {
      PIX.disc(c, x + 5, y, 3, 'rgba(255,140,40,' + (0.10 * drag).toFixed(3) + ')');
      PIX.disc(c, x + 5, y, 2, 'rgba(255,180,80,' + (0.16 * drag).toFixed(3) + ')');
    }
    /* and the smoke, which is the only thing in this street going up */
    for (let i = 0; i < 9; i++) {
      const t = ((T * 0.5 + i * 0.11) % 1);
      const sy = y - 2 - t * 22;
      const sx = x + 5 + Math.sin(t * 5.2 + i) * (1 + t * 4);
      px(c, Math.round(sx), Math.round(sy), 1, 1,
        'rgba(206,202,190,' + (0.26 * (1 - t)).toFixed(3) + ')');
    }
  }

  /* the near floor: bodies lie on it, and the gutter runs over it */
  function onPaintNear(c, T) {
    cigarette(c, T);
    bodies.forEach(b => {
      const a = Math.max(0, Math.min(1, b.t / 0.6));
      c.globalAlpha = Math.min(1, b.life);
      /* A HEAP HAS TO READ AGAINST THE PAVEMENT IT IS ON. The first
         version was drawn in the same value as the wet flags -- #0d1016
         on #0b0e13 -- and a body you cannot see is a shot that did not
         land. It is lit by the same bulb he is, so it gets a top edge. */
      /* A HEAP HAS TO READ AGAINST THE PAVEMENT IT IS ON, and it has to
         have a silhouette: the first version was a 28x6 stripe in the same
         value as the wet flags, and a body you cannot see is a shot that
         did not land. A back, a shoulder, a hat off in the water. */
      const bx = Math.round(b.x);
      px(c, bx - 15, FY - 7, 26, 7, '#2b2030');            /* the coat */
      px(c, bx - 17, FY - 5, 4, 5, '#2b2030');
      px(c, bx + 9, FY - 9, 9, 9, '#2b2030');              /* the shoulder */
      px(c, bx - 15, FY - 7, 26, 1, '#584862');            /* the wet top edge */
      px(c, bx + 9, FY - 9, 9, 1, '#584862');
      px(c, bx - 12, FY - 5, 20, 1, 'rgba(255,231,163,.12)');
      px(c, bx - 21, FY - 2, 7, 3, '#2b2030');             /* the arm, out */
      px(c, bx - 21, FY - 2, 7, 1, '#4a3c54');
      px(c, bx - 23, FY - 1, 3, 2, '#3e5a3a');             /* and the hand */
      px(c, bx + 20, FY - 5, 10, 5, '#181420');            /* the hat, come off */
      px(c, bx + 20, FY - 5, 10, 1, '#3a3044');
      px(c, bx + 22, FY - 7, 6, 2, '#181420');
      /* and what is running out of him, thinning into the rain */
      const run = Math.round(20 * a);
      px(c, bx - 14, FY - 1, run, 2, 'rgba(140,22,34,.62)');
      px(c, bx - 14, FY + 1, run, 1, 'rgba(90,14,22,.40)');
      /* which the neon finds, because everything wet in this street does */
      px(c, bx - 10, FY, Math.round(run * 0.6), 1, 'rgba(255,46,77,.20)');
      c.globalAlpha = 1;
    });
  }

  /* the rain, the splashes and the muzzle flash: all in front */
  function onPaintFore(c, T, cam, vw) {
    /* ---- the rain ---- */
    const span = 150;
    for (const d of RAIN) {
      const y = ((d.y * span + T * d.sp) % span) - 18;
      /* ON A SLANT, and the slant comes off the same fall the drop is
         doing -- rain that goes straight down in a still frame reads as a
         screen wipe, and rain whose angle is unrelated to its speed reads
         as confetti. */
      const x = cam - 10 + ((d.x * (vw + 40) + T * 14 * d.depth) % (vw + 40)) - y * 0.16;
      for (let k = 0; k < d.len; k++) {
        px(c, Math.round(x + k * 0.16), Math.round(y + k), 1, 1,
          'rgba(170,205,235,' + d.a.toFixed(3) + ')');
      }
    }
    /* ---- what it does when it lands ---- */
    for (const s of SPLASH) {
      const ph = (T * s.sp + s.ph) % 1;
      if (ph > 0.34) continue;
      const x = Math.round(cam + s.x * vw);
      const r = Math.round(ph * 9);
      const a = (0.22 * (1 - ph / 0.34)).toFixed(3);
      px(c, x - r, FY + 6, 1, 1, 'rgba(180,210,235,' + a + ')');
      px(c, x + r, FY + 6, 1, 1, 'rgba(180,210,235,' + a + ')');
    }
    /* ---- and the rain coming OFF the awning in a sheet ---- */
    for (let i = 0; i < 26; i++) {
      const x = AWN - 8 + i * ((AWN_W + 16) / 26);
      const y = ((T * 190 + i * 37) % (FY - AWN_Y - 12)) + AWN_Y + 12;
      px(c, Math.round(x), Math.round(y), 1, 4, 'rgba(170,205,235,.16)');
    }

    /* ---- THE FLASH. Three frames, and it lights the street. ---- */
    if (flashT > 0) {
      const a = Math.min(1, flashT / 0.12);
      const hx = SCENE.me ? SCENE.me.x + 13 : HIM + 13;
      const hy = FY - 26;
      PIX.disc(c, hx + 3, hy, 5, 'rgba(255,244,208,' + (0.95 * a).toFixed(3) + ')');
      PIX.disc(c, hx + 8, hy, 3, 'rgba(255,214,120,' + (0.8 * a).toFixed(3) + ')');
      PIX.disc(c, hx + 12, hy, 2, 'rgba(255,170,60,' + (0.5 * a).toFixed(3) + ')');
      /* the star: four spikes off the muzzle, which is what a flash IS */
      px(c, hx - 4, hy, 22, 1, 'rgba(255,236,170,' + (0.65 * a).toFixed(3) + ')');
      px(c, hx + 3, hy - 7, 1, 15, 'rgba(255,236,170,' + (0.40 * a).toFixed(3) + ')');
      /* and the whole street takes it for one frame */
      px(c, cam, -40, vw, 190, 'rgba(255,232,180,' + (0.10 * a).toFixed(3) + ')');
    }
  }

  /* ============================================================
     THE ROOM.
     ============================================================ */
  function street() {
    return {
      id: 'menu_street', w: W, floorY: FY,
      paint, onPaintFront, onPaintNear, onPaintFore,
      /* nobody walks here but the reel, and nothing is clickable */
      actors: [], spots: [],
      enterX: HIM, enterFace: 1,
      lights: [{ x: LAMP, y: LAMP_Y + 6, r: 44, a: 0.13 },
               { x: X0 + 74, y: 30, r: 30, a: 0.07, bare: true }],
    };
  }

  /* ============================================================
     THE REEL.

     A loop of shots rather than one animation, so it can be cut
     out of at any point: every wait goes through nap(), which
     gives up the moment the menu is told to stop.
     ============================================================ */
  async function nap(ms) {
    let left = ms;
    while (left > 0 && live) {
      const slice = Math.min(80, left);
      await U.sleep(slice);
      left -= slice;
    }
    return live;
  }

  /* somebody comes out of the alley. Not a character -- a coat. */
  function walker(i) {
    return {
      id: 'menu_walk' + i, x: ALLEY + 26, y: FY,
      key: 'mk' + i, def: FROG_DEFS[['vig', 'cage', 'collector'][i % 3]] || FROG_DEFS.player,
      face: -1, mood: 'hard', still: false,
    };
  }

  async function reel() {
    let round = 0;
    while (live) {
      /* ---- 1. THE HOLD. He smokes. The camera breathes. ---- */
      SCENE.meArm('up');
      smokeT = 1;
      if (!await nap(900)) return;
      dolly(CAM, CAM + 13, 3400);
      if (!await nap(2600)) return;

      /* ---- 2. SOMETHING COMES OUT OF THE ALLEY ---- */
      const n = 1 + (round % 2 ? 1 : 0);             /* every other time, two */
      const cast = [];
      for (let i = 0; i < n; i++) {
        const a = walker(round * 2 + i);
        a.x = ALLEY + 26 + i * 20;
        SCENE.def.actors.push(a);
        cast.push(a);
      }
      dolly(CAM + 13, CAM + 22, 2200);
      cast.forEach((a, i) => SCENE.send(a, MARK + i * 18, 26));
      if (!await nap(1500)) { cull(cast); return; }

      /* ---- 3. HE HEARS IT. The cigarette stays in his mouth. ---- */
      SCENE.meFace('angry');
      SCENE.place(SCENE.me ? SCENE.me.x : HIM, 1);
      if (!await nap(620)) { cull(cast); return; }

      /* ---- 4. AND HE DOES NOT TALK TO IT ---- */
      /* the cigarette goes down with the arm: it is the same hand */
      smokeT = 0;
      SCENE.meArm('point');
      if (!await nap(260)) { cull(cast); return; }
      for (const a of cast) {
        if (!live) { cull(cast); return; }
        fire(a.x);
        a.gone = true;
        bodies.push({ x: a.x, t: 0, life: 1 });
        if (!await nap(300)) { cull(cast); return; }
      }
      cull(cast);

      /* ---- 5. AND GOES BACK TO HIS CIGARETTE ---- */
      if (!await nap(700)) return;
      SCENE.meArm('up');
      smokeT = 1;
      SCENE.meFace(null);
      dolly(CAM + 22, CAM, 3800);
      if (!await nap(2400)) return;
      round++;
    }
  }

  function fire(at) {
    flashT = 0.17;
    if (typeof SFX !== 'undefined' && SFX.shot) SFX.shot();
    if (typeof FX !== 'undefined' && FX.screen) {
      FX.screen.shake(4);
      FX.screen.flash(PIX.PAL.W, 0.10, 0.14);
    }
    /* ============================================================
       AND THE CARTOON OF IT.

       The flash and the shake are the physics of a gun going off.
       The BANG is the drawing -- a torn star with the word in it,
       over the frog he has just put down, which is how a shot has
       been drawn on paper since long before anybody filmed one.
       ============================================================ */
    if (typeof TOON === 'undefined' || at === undefined) return;
    const s = SCENE.screenAt && SCENE.screenAt(at, FY - 30);
    if (!s) return;
    /* AND THE SIZE OF IT COMES OFF THE ROOM. Pinned at one and a half it
       came out as a hundred-and-fifty-pixel sticker next to a muzzle flash
       four times its size; a bang has to be as big as the gun. */
    const kk = Math.max(1.6, s.k * 0.42);
    TOON.pow(s.x, s.y, WORDS[shots % WORDS.length], PIX.PAL.O, { k: kk });
    TOON.stars(s.x, s.y - 8, 3, { k: Math.max(2, Math.round(s.k * 0.5)) });
    /* and the dust he goes down in, pinned to the pavement rather than to
       the screen, so it stays under him while the camera is still drifting */
    TOON.puffWorld(at, FY, 3, { k: Math.max(1, s.k * 0.28) });
    shots++;
  }
  /* a different word each time, because three identical BANGs in a row is
     a repeated asset and not a comic */
  const WORDS = ['BANG', 'POW', 'CRACK', 'BLAM'];
  let shots = 0;

  /* take the walkers back off the stage */
  function cull(cast) {
    if (!SCENE.def || !SCENE.def.actors) return;
    SCENE.def.actors = SCENE.def.actors.filter(a => cast.indexOf(a) < 0);
  }

  function dolly(from, to, ms) { camA = from; camB = to; camT = 0; camMs = Math.max(1, ms); }

  /* the bodies wash away, because the street does not keep them */
  let tick = 0;
  function ticker() {
    if (!live) return;
    /* the drift, eased in and out so it reads as a camera and not a slide */
    camT = Math.min(1, camT + 33 / camMs);
    const k = camT < 0.5 ? 2 * camT * camT : 1 - Math.pow(-2 * camT + 2, 2) / 2;
    SCENE.look(camA + (camB - camA) * k);
    if (SCENE.busy() !== true) SCENE.busy(true);
    flashT = Math.max(0, flashT - 0.033);
    bodies.forEach(b => { b.t += 0.033; if (b.t > 6) b.life -= 0.015; });
    bodies = bodies.filter(b => b.life > 0);
    tick = setTimeout(ticker, 33);
  }

  /* ============================================================
     ON AND OFF.
     ============================================================ */
  function start() {
    if (live) return;
    live = true;
    bodies = []; flashT = 0;
    if (typeof TOON !== 'undefined') TOON.clear();
    SCENE.open(street());
    SCENE.busy(true);                 /* nothing here is clickable */
    SCENE.place(HIM, 1);
    SCENE.meArm('up');
    camA = camB = CAM; camT = 1;
    SCENE.look(CAM);
    ticker();
    reel();
  }

  function stop() {
    live = false;
    clearTimeout(tick);
    bodies = [];
    SCENE.meArm('');
    SCENE.meFace(null);
  }

  /* ============================================================
     AND THEN HE LOOKS AT YOU.

     Press PLAY and the reel stops mid-breath: the cigarette goes,
     he turns out of the street and square to the frame, and the
     camera walks in until he is the only thing in it. THEN the
     wipe. A title screen that cuts straight to a loading card
     throws away the one moment the whole menu was building to.
     ============================================================ */
  async function faceYou() {
    live = false;
    clearTimeout(tick);
    /* he flicks it away and squares up */
    SCENE.meArm('');
    SCENE.meFace('angry');
    if (typeof SFX !== 'undefined' && SFX.tick) SFX.tick();
    /* HE DOES NOT TURN ROUND SLOWLY. Speed lines off both shoulders, which
       is the only way a drawing has ever said that something moved fast. */
    if (typeof TOON !== 'undefined' && SCENE.screenAt) {
      const s = SCENE.screenAt(HIM, FY - 26);
      if (s) {
        TOON.zip(s.x - 84, s.y, -1, { k: Math.max(2, Math.round(s.k * 0.6)), life: 420 });
        TOON.zip(s.x + 84, s.y, 1, { k: Math.max(2, Math.round(s.k * 0.6)), life: 420 });
      }
    }
    await U.sleep(140);
    SCENE.look(SCENE.me ? SCENE.me.x : HIM);
    push(1.9, 1500);
    await U.sleep(460);
    /* AND THEN HE STOPS GLARING AND JUST LOOKS. His default face is
       already the face of a man who lost his family -- see the mood set
       in js/sprites.js -- so handing it back IS the expression. */
    SCENE.meFace(null);
    await U.sleep(900);
    return true;
  }

  /* the camera walks in on the room canvas itself */
  function push(to, ms) {
    const host = document.getElementById('scene-root');
    const cv = host && host.querySelector('canvas');
    if (!cv) return;
    cv.style.transformOrigin = '50% 62%';
    cv.style.transition = 'transform ' + ms + 'ms cubic-bezier(.3,.0,.2,1)';
    requestAnimationFrame(() => { cv.style.transform = 'scale(' + to + ')'; });
  }
  function unpush() {
    const host = document.getElementById('scene-root');
    const cv = host && host.querySelector('canvas');
    if (!cv) return;
    cv.style.transition = ''; cv.style.transform = ''; cv.style.transformOrigin = '';
  }

  return { start, stop, faceYou, street, unpush, running() { return live; },
    /* the probe needs to put one on the pavement without waiting for a round */
    debugBody(x) { bodies.push({ x, t: 3, life: 1 }); } };
})();
