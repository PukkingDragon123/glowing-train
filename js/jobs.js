/* ============================================================
   THE SIDE JOBS.

   A detective on this salary works the room. Two little jobs you
   can do anywhere in the city that will have you:

     THE TAPS     pull three pints without wearing them
     THE FRYER    turn out a tray of donuts
     THE DRUMS    put a lid on three rats
     THE LOCK     three pins on a shed nobody wants opened
     THE PRINTS   lift three clean ones off what you brought back
     THE SCOOP    what the dog left, off the pavement, before
                  somebody steps in it
     THE CUPS     three cups, one ball, and a frog who does this
                  for a living

   Both are the same shape — a moving thing you have to stop in
   the right place, three times — and both pay in the two things
   you are always short of: money and somebody's goodwill. The
   goodwill is worth more: a barman who likes you answers another
   question, and a cook who likes you tells you which end of the
   city still has something in it.
   ============================================================ */

const JOBS = (() => {

  /* ---------------------------------------------------------
     THE WIDGET.

     One canvas, one moving marker, one band to stop it in. The
     caller says what it looks like and what the words are; this
     only knows about hitting and missing.
     --------------------------------------------------------- */
  /* ============================================================
     THE FRAME.

     Every trade in this game used to happen on a card: a hundred
     and thirty-two pixels by eighty-four, floated in the middle of
     a dark screen with a headline over it and a caption under it.
     It was a dialog box with a picture in it, and it felt like
     one -- you were never pouring a pint, you were operating a
     widget.

     So a trade is now a SHOT. Same size as a room, same letterbox,
     filling the frame: the wall behind, the surface you are
     working on, the thing you are working on standing on it, and
     YOUR OWN ARMS coming in from the bottom of the frame in your
     pinstripe sleeves. The needle is a strip low in the picture
     rather than a header, and the caption is drawn into the
     canvas, because a caption in the DOM is a caption on a dialog.
     ============================================================ */
  const FW = 214, FH = 132;
  const SURF = 84;                     /* where the near surface starts */

  /* ---- the room behind whatever you are doing ---- */
  function povWall(c, o) {
    o = o || {};
    const hi = o.hi || [38, 44, 52], lo = o.lo || [18, 22, 27];
    for (let y = 0; y < SURF + 2; y++) {
      const t = y / (SURF + 2);
      c.fillStyle = 'rgb(' + Math.round(hi[0] + (lo[0] - hi[0]) * t) + ','
        + Math.round(hi[1] + (lo[1] - hi[1]) * t) + ','
        + Math.round(hi[2] + (lo[2] - hi[2]) * t) + ')';
      c.fillRect(0, y, FW, 1);
    }
    ART.dither(c, 0, 0, FW, SURF + 2, 'rgba(0,0,0,.30)', 0.12, o.seed || 7);
    if (o.railY !== undefined) {
      ART.px(c, 0, o.railY, FW, 3, o.rail || 'rgba(255,255,255,.07)');
      ART.px(c, 0, o.railY + 3, FW, 2, 'rgba(0,0,0,.32)');
    }
    /* one lamp, off frame above, so the whole picture has a direction */
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      ART.px(c, Math.round(FW * 0.5 - 40 - t * 60), Math.round(t * SURF),
        Math.round(80 + t * 120), 4,
        'rgba(255,236,186,' + (0.055 - t * 0.002).toFixed(3) + ')');
    }
  }

  /* ---- the surface it is all standing on, seen at a shallow angle ---- */
  function povSurface(c, o) {
    o = o || {};
    const y = o.y === undefined ? SURF : o.y;
    const top = o.top || '#4a4034', face = o.face || '#2c261e';
    /* the top, receding: lighter at the back, and it gets darker toward you
       because you are standing in your own light */
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      c.fillStyle = 'rgba(0,0,0,' + (t * 0.26).toFixed(3) + ')';
      ART.px(c, 0, y + i, FW, 1, top);
      c.fillRect(0, y + i, FW, 1);
    }
    ART.px(c, 0, y - 1, FW, 2, o.edgeHi || 'rgba(255,255,255,.16)');
    ART.px(c, 0, y + 14, FW, 3, o.lip || '#5c4e3e');
    ART.px(c, 0, y + 14, FW, 1, 'rgba(255,255,255,.20)');
    ART.px(c, 0, y + 17, FW, FH - y - 17, face);
    ART.dither(c, 0, y + 17, FW, FH - y - 17, 'rgba(0,0,0,.34)', 0.16, 11);
    ART.px(c, 0, y + 17, FW, 2, 'rgba(0,0,0,.40)');
  }

  /* ---- A FIST ROUND SOMETHING. povPaw is an open paw and at half scale
         it reads as a mitten. This is the closed hand, authored at the size
         it is drawn at and blitted on whole pixels: through a scale of one
         half every crease in it landed on half a pixel and went away, which
         is how two hands on a pan handle came out as four green sausages.
         The wrist anchor is where the cuff goes. ---- */
  function povGrip(c, x, y, k, sgn, wet) {
    const d = (typeof DUEL !== 'undefined' && DUEL.myDef) ? DUEL.myDef() : null;
    if (!d || !SPR.povFist) return;
    const cv = SPR.povFist(d, Math.max(12, Math.round(52 * k)), { wet: !!wet });
    if (sgn < 0) {
      c.save();
      c.translate(Math.round(x), Math.round(y));
      c.scale(-1, 1);
      c.drawImage(cv, -cv.wrist.x, -cv.wrist.y);
      c.restore();
    } else {
      c.drawImage(cv, Math.round(x) - cv.wrist.x, Math.round(y) - cv.wrist.y);
    }
  }

  /* ---- your arm, in from off frame, with a hand on the end of it ---- */
  function povArm(c, o) {
    const d = (typeof DUEL !== 'undefined' && DUEL.myDef) ? DUEL.myDef() : null;
    if (!d) return;
    const P = PIX.PAL;
    const C = SPR.costumeOf(d);
    const O = C.overcoat || C.jacket || null;
    const col = P[(O && O.col) || 'T'] || P.T;
    const dk = P[(O && O.dark) || 'k'] || P.k;
    const lt = 'rgba(255,255,255,.14)';
    SPR.povTube(c, o.x0, o.y0, o.x1, o.y1, o.w0 || 22, o.w1 || 15, col, dk, lt);
    /* bare: the sleeve only, for the shots that draw their own hand. The
       cuff goes with it -- left in, it floated in the open next to a hand
       drawn somewhere else. */
    if (o.bare) return;
    /* the cuff, then the paw */
    const cuff = SPR.cuffColor ? SPR.cuffColor(d) : P.W;
    const cw = (o.w1 || 15) + 4;
    ART.px(c, o.x1 - (cw >> 1) - 1, o.y1 - 3, cw + 2, 8, P.K);
    ART.px(c, o.x1 - (cw >> 1), o.y1 - 3, cw, 6, cuff);
    ART.px(c, o.x1 - (cw >> 1), o.y1 - 3, cw, 2, 'rgba(255,255,255,.20)');
    if (o.fist) povGrip(c, o.x1, o.y1 + (o.hy || 9), o.k || 0.6, o.sgn || 1, o.wet);
    else if (SPR.povPaw) {
      SPR.povPaw(c, o.x1, o.y1 + (o.hy || 8), d, o.sgn || 1, o.k || 0.7,
        o.grip === undefined ? true : o.grip);
    }
  }

  /* ---- THE NEEDLE, low in the picture, not a header ---- */
  function povDial(c, s, o) {
    o = o || {};
    const bw = 150, bx = Math.round((FW - bw) / 2), by = FH - 26;
    ART.px(c, bx - 2, by - 2, bw + 4, 11, 'rgba(6,8,12,.82)');
    ART.px(c, bx - 1, by - 1, bw + 2, 9, PIX.PAL.K);
    ART.px(c, bx, by, bw, 7, '#14181d');
    for (let i = 0; i < bw; i += 7) ART.px(c, bx + i, by + 5, 1, 2, '#2c333a');
    const tint = o.tint || '#6ff7d8';
    const cw = Math.max(4, Math.round(bw * s.band));
    const cxx = bx + Math.round(bw * s.centre);
    ART.px(c, cxx - (cw >> 1), by, cw, 7, o.bandFill || 'rgba(111,247,216,.22)');
    ART.px(c, cxx - 1, by, 2, 7, tint);
    ART.px(c, cxx - (cw >> 1), by, cw, 1, 'rgba(255,255,255,.16)');
    const nx = bx + Math.round(bw * s.x);
    ART.px(c, nx - 2, by - 3, 4, 13, PIX.PAL.K);
    ART.px(c, nx - 1, by - 2, 2, 11, s.live ? '#ff6a5e' : '#8d8672');
    ART.px(c, nx - 1, by - 2, 2, 2, '#ffd0c8');
  }

  /* ---- and what it is called, drawn INTO the picture ---- */
  const capCache = {};
  function cap(str, scale, col) {
    const k = str + '|' + scale + '|' + col;
    if (!capCache[k]) capCache[k] = PIXFONT.render(str, { scale, color: col, shadow: PIX.PAL.K });
    return capCache[k];
  }
  /* THE BRIEF, AND THEN GET OUT OF THE WAY.

     The title and a wrapped sub-line on one opaque plate in the
     top-left came out a hundred and forty pixels wide on a
     two-hundred-and-fourteen pixel frame -- two thirds of the
     width -- and it sat on exactly the thing you were supposed to
     be looking at. It covered the pin cutaway on the lock, the
     rat on the pipe over the drums, the lifted print on the
     dusting bench and the mirror behind the cups. A first-person
     view has to be a view.

     So the sub-line is a SLATE. It comes up over the shot for a
     second at the top of the job, says what the job is, and fades
     off. What stays is the title: one line, small, dim, in the
     corner, with no plate under it at all. */
  function povSlate(c, o, t, armAt) {
    const IN = 0.16, OUT = 0.40;
    if (t > armAt + OUT) return;
    const a = t < IN ? t / IN : (t < armAt ? 1 : 1 - (t - armAt) / OUT);
    /* SCALE ONE, ON PAPER. A scale-two headline is twelve pixels a
       character: DUST IT FOR PRINTS came out two hundred and fifteen
       wide on a two-hundred-and-fourteen pixel frame. And a dark
       slate mid-fade is a grey veil over the shot with grey letters
       on it, which is the milky filter this game has spent four
       waves getting rid of. It is a docket now -- cream paper, black
       ink -- which is what the rest of this game's UI is made of. */
    const h = cap(o.head, 1, '#17150f');
    const lines = UI.wrapLines ? UI.wrapLines(o.sub, 22) : [o.sub];
    const subs = lines.slice(0, 3).map(x => cap(x, 1, '#5c5140'));
    const bw2 = Math.max(h.width, ...subs.map(x => x.width)) + 16;
    const bh2 = h.height + 5 + subs.length * 9 + 9;
    const bx = Math.round((FW - bw2) / 2);
    const by = Math.round(FH * 0.34 - bh2 / 2) - Math.round((1 - a) * 5);
    c.save();
    c.globalAlpha = a;
    ART.px(c, bx + 2, by + 3, bw2, bh2, 'rgba(0,0,0,.50)');       /* its shadow */
    ART.px(c, bx - 1, by - 1, bw2 + 2, bh2 + 2, '#0c0e12');
    ART.px(c, bx, by, bw2, bh2, '#e8dcc0');
    ART.px(c, bx, by, bw2, 1, '#fbf7ec');
    ART.px(c, bx, by + bh2 - 2, bw2, 2, '#c9bb9c');
    ART.px(c, bx + 6, by + h.height + 5, bw2 - 12, 1, '#a3947a');
    c.drawImage(h, bx + 8, by + 4);
    subs.forEach((x, i) => c.drawImage(x, bx + 8, by + h.height + 9 + i * 9));
    /* two punch holes and a bulldog clip, so it is a docket off a spike */
    PIX.disc(c, bx + 5, by + bh2 - 6, 2, '#b3a488');
    PIX.disc(c, bx + bw2 - 6, by + bh2 - 6, 2, '#b3a488');
    ART.px(c, bx + (bw2 >> 1) - 8, by - 4, 16, 5, '#2e3238');
    ART.px(c, bx + (bw2 >> 1) - 7, by - 3, 14, 2, '#7c848c');
    c.restore();
  }

  /* A SMUDGE OF INK, feathered, cached. A dim label needs a ground: THE
     RANGE was tan letters over a cream paper target and BREAKFAST was tan
     letters over a tan kitchen wall. Built once per size, because doing it
     a pixel at a time every frame is fifteen hundred fills a frame. */
  const scrimCache = {};
  function scrim(w, h) {
    const k = w + 'x' + h;
    if (!scrimCache[k]) {
      const cv2 = document.createElement('canvas');
      cv2.width = w; cv2.height = h;
      const cc = cv2.getContext('2d');
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const a3 = 0.52 * Math.min(1, (w - x) / 18) * (1 - y / h);
          if (a3 <= 0.004) continue;
          cc.fillStyle = 'rgba(4,5,8,' + a3.toFixed(3) + ')';
          cc.fillRect(x, y, 1, 1);
        }
      }
      scrimCache[k] = cv2;
    }
    return scrimCache[k];
  }

  function povCaption(c, o, s, rounds) {
    /* the title, in the corner, out of the way of the picture */
    const t2 = cap(o.head, 1, '#d6ccae');
    c.drawImage(scrim(t2.width + 22, 16), 0, 0);
    c.drawImage(t2, 4, 4);
    const key = cap(o.key || 'TAP TO STOP IT', 1, PIX.PAL.G);
    ART.px(c, Math.round((FW - key.width) / 2) - 3, FH - 13, key.width + 6, 11,
      'rgba(6,8,12,.62)');
    c.drawImage(key, Math.round((FW - key.width) / 2), FH - 12);
    /* the tally, as pips over the dial, on their own plate */
    const p0 = Math.round(FW / 2 - rounds * 4), py = FH - 33;
    ART.px(c, p0 - 3, py - 2, rounds * 8 + 3, 8, 'rgba(6,8,12,.66)');
    ART.px(c, p0 - 3, py - 2, rounds * 8 + 3, 1, 'rgba(255,255,255,.07)');
    for (let i = 0; i < rounds; i++) {
      const px2 = p0 + i * 8;
      ART.px(c, px2, py, 5, 4, PIX.PAL.K);
      /* AT HOME NOTHING GOES RED. A miss in the kitchen is an egg with a
         brown edge on it, and a red pip says you have failed your family
         before breakfast. */
      ART.px(c, px2 + 1, py + 1, 3, 2,
        i < s.round
          ? (i < s.hits ? '#6ff7d8' : (o.kind === 'home' ? '#c8a03c' : '#ff6a5e'))
          : '#3a4149');
    }
    povSlate(c, o, s.T, s.armAt);
  }

  /* the whole surround in one call, since every trade wants it */
  function povFrame(c, o, s, rounds) {
    povDial(c, s, o.dial);
    povCaption(c, o, s, rounds);
    if (s.flash > 0) {
      ART.px(c, 0, 0, FW, FH, 'rgba(255,226,150,' + (s.flash * 0.16).toFixed(3) + ')');
    }
  }

  function meter(o) {
    return new Promise(resolve => {
      const rounds = o.rounds || 3;
      const root = CINE.pickRoot ? CINE.pickRoot() : CINE.stage();
      root.className = 'job-on';
      root.innerHTML = '';

      /* the same whole-number scale rule the rooms use: a trade is a shot,
         so it is drawn at the size a shot is drawn at */
      const K = U.clamp(Math.floor(Math.min(window.innerWidth / FW,
        window.innerHeight / FH)), 1, 8);

      const wrap = U.el('div', 'job-card');
      const cv = document.createElement('canvas');
      cv.width = FW * K; cv.height = FH * K;
      cv.className = 'pix job-cv';
      wrap.appendChild(cv);
      root.appendChild(wrap);
      const c = cv.getContext('2d');
      c.imageSmoothingEnabled = false;
      c.scale(K, K);
      requestAnimationFrame(() => wrap.classList.add('in'));

      let round = 0, hits = 0, perfect = 0;
      let x = 0, dir = 1, live = true, flash = 0, done = false;
      /* THE BRIEF HOLDS THE NEEDLE. The docket is up over the shot for the
         first second and a bit, and the needle used to be sweeping behind
         it the whole time, so round one was decided by a card you were
         still reading. A tap while it is up skips it instead of firing. */
      let armAt = 1.30;
      const band = o.band || 0.22;              // how wide the sweet spot is
      const speed = o.speed || 1.15;            // sweeps per second
      /* the target wanders a little each round so it cannot be learned */
      let centre = 0.5;

      const rng = G.rng || Math.random;
      const newRound = () => {
        centre = 0.3 + rng() * 0.4;
        x = 0; dir = 1; live = true;
        if (round > 0) armAt = 0;                      /* only round one waits */
      };
      newRound();

      let last = performance.now(), T = 0;
      const step = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now; T += dt;
        const armed = live && T >= armAt;
        if (armed) {
          x += dir * speed * dt;
          if (x > 1) { x = 1; dir = -1; }
          if (x < 0) { x = 0; dir = 1; }
        }
        if (flash > 0) flash = Math.max(0, flash - dt * 3);
        const s = { x, centre, band, round, hits, flash, live: armed, T, rounds, armAt };
        /* CLEAR IT FIRST. The old card was 132 by 84 and every draw filled
           the whole of it; these are shots with a room behind them and any
           row a set does not cover keeps LAST frame's pixels, which came
           out as pale wedges of accumulated caption behind the pistol. */
        c.fillStyle = '#05060a';
        c.fillRect(0, 0, FW, FH);
        o.draw(c, FW, FH, s);
        povFrame(c, o, s, rounds);
        if (!done) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);

      /* THE HARNESS HAS TO BE ABLE TO PLAY THIS. A skill meter cannot be
         beaten by clicking blindly, and a headless test that cannot pick
         a lock cannot test anything behind a locked door. This is a
         read-only window onto the sweep: the harness polls it and taps
         when the needle is inside the band, which is exactly what a
         player does with their eyes. */
      JOBS._meter = {
        get x() { return x; }, get centre() { return centre; },
        get band() { return band; }, get live() { return live && T >= armAt; },
        get round() { return round; }, get rounds() { return rounds; },
      };

      const finish = () => {
        done = true;
        JOBS._meter = null;
        window.removeEventListener('pointerdown', hit);
        window.removeEventListener('keydown', key);
        wrap.classList.add('out');
        setTimeout(() => {
          root.innerHTML = ''; root.className = 'hidden';
          resolve({ hits, perfect, rounds });
        }, 180);
      };

      const hit = () => {
        if (!live || done) return;
        if (T < armAt) { armAt = T + 0.04; return; }   /* a tap skips the brief */
        live = false;
        const off = Math.abs(x - centre);
        const good = off <= band / 2;
        const dead = off <= band / 6;
        if (good) { hits++; if (dead) perfect++; SFX.jackpot ? SFX.chak() : null; }
        else SFX.backfire && SFX.backfire();
        flash = 1;
        round++;
        setTimeout(() => {
          if (round >= rounds) finish();
          else newRound();
        }, 520);
      };
      const key = (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hit(); }
      };
      setTimeout(() => {
        window.addEventListener('pointerdown', hit);
        window.addEventListener('keydown', key);
      }, 220);
    });
  }

  /* ---------------------------------------------------------
     BREAKFAST, from over his own shoulder.

     The window over the sink at the back, tile, the range top
     across the middle of the frame with two rings on it, the
     kettle going, and the pan dead centre with an egg setting in
     it. His left hand is on the pan handle and his right is
     holding a slice over it, both in pinstripe. This is the shot
     the whole first-person pass was for.
     --------------------------------------------------------- */
  function drawPan(c, W, H, s) {
    povWall(c, { hi: [150, 132, 88], lo: [96, 80, 50], railY: 52, seed: 9 });
    /* the window over the sink, with the garden in it */
    ART.px(c, 18, 8, 62, 40, '#4a3a20');
    ART.px(c, 21, 11, 56, 34, '#b8d8ea');
    for (let y = 11; y < 30; y++) {
      ART.px(c, 21, y, 56, 1, DAY.rgb(DAY.mix([150, 200, 232], [212, 234, 244],
        (y - 11) / 19)));
    }
    ART.px(c, 21, 30, 56, 15, '#6d9450');
    ART.dither(c, 21, 30, 56, 15, '#578040', 0.3, 9);
    for (let i = 0; i < 4; i++) {
      ART.px(c, 27 + i * 13, 22, 9, 8, ['#e8e2d0', '#d8c8e0', '#cfe0e8', '#e8dcc4'][i]);
      ART.px(c, 27 + i * 13, 22, 9, 1, '#f4efe0');
    }
    ART.px(c, 22, 21, 54, 1, '#8a7448');
    ART.px(c, 48, 11, 2, 34, '#4a3a20');
    ART.px(c, 21, 27, 56, 2, '#4a3a20');
    /* tile behind the range */
    for (let y = 52; y < SURF; y += 8) {
      ART.px(c, 0, y, W, 1, 'rgba(255,255,255,.10)');
      for (let x = ((y / 8) % 2) ? 0 : 6; x < W; x += 12) ART.px(c, x, y, 1, 8, 'rgba(0,0,0,.16)');
    }
    /* a shelf of jars, and the towel rail */
    ART.px(c, 118, 20, 84, 4, '#8e6e44');
    ART.px(c, 118, 20, 84, 1, '#ac8a58');
    for (let i = 0; i < 5; i++) {
      const jx = 122 + i * 16;
      ART.px(c, jx, 8, 12, 12, ['#8a6a3c', '#6a7a4a', '#8a4a3c', '#5a6a7a', '#7a6a2a'][i]);
      ART.px(c, jx, 8, 12, 2, 'rgba(255,255,255,.20)');
      ART.px(c, jx + 3, 5, 6, 3, '#c8b06a');
      ART.px(c, jx + 1, 13, 10, 3, 'rgba(240,232,212,.5)');
    }

    /* ---- THE RANGE TOP ---- */
    povSurface(c, { y: SURF, top: '#33302f', face: '#d8ccb0', lip: '#2a2728',
      edgeHi: 'rgba(255,255,255,.10)' });
    /* two rings behind, one under the pan */
    for (let i = 0; i < 2; i++) {
      const rx = 40 + i * 132;
      SPR.ellipse(c, rx, SURF + 5, 15, 5, '#1c1a1c');
      SPR.ellipse(c, rx, SURF + 4, 13, 4, '#3a3638');
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2;
        ART.px(c, Math.round(rx + Math.cos(a) * 9), Math.round(SURF + 4 + Math.sin(a) * 3),
          2, 1, '#2a2628');
      }
    }
    /* THE KETTLE on the left ring, going. A rectangle with a nozzle on it
       is a toaster; a kettle has a shoulder, a lid with a knob, a spout
       that RISES, a strap handle over the top and a rivet either side. */
    const kx2 = 40, kb = SURF + 2;
    SPR.ellipse(c, kx2, kb, 19, 5, '#26232a');                  /* on the ring */
    for (let y = kb - 20; y <= kb; y++) {
      const t = (y - (kb - 20)) / 20;
      const hw5 = Math.round(11 + Math.sin(t * 2.4) * 6);
      ART.px(c, kx2 - hw5 - 1, y, hw5 * 2 + 3, 1, '#26232a');
      ART.px(c, kx2 - hw5, y, hw5 * 2 + 1, 1, t < 0.5 ? '#98a2a8' : '#79838a');
      ART.px(c, kx2 - hw5, y, 3, 1, '#c0c8cc');                 /* the lit side */
      ART.px(c, kx2 + hw5 - 2, y, 3, 1, 'rgba(0,0,0,.26)');
    }
    ART.px(c, kx2 - 10, kb - 12, 20, 1, 'rgba(255,255,255,.16)');
    ART.px(c, kx2 - 9, kb - 21, 18, 3, '#26232a');              /* the lid */
    ART.px(c, kx2 - 8, kb - 21, 16, 2, '#aab2b8');
    ART.px(c, kx2 - 3, kb - 25, 6, 4, '#26232a');               /* its knob */
    ART.px(c, kx2 - 2, kb - 24, 4, 3, '#8a949a');
    for (let i = 0; i < 7; i++) {                               /* the spout, rising */
      ART.px(c, kx2 + 11 + i, kb - 12 - Math.round(i * 0.9), 3, 5, '#26232a');
      ART.px(c, kx2 + 11 + i, kb - 11 - Math.round(i * 0.9), 2, 3, '#98a2a8');
      ART.px(c, kx2 + 11 + i, kb - 11 - Math.round(i * 0.9), 2, 1, '#c0c8cc');
    }
    for (let i = 0; i < 9; i++) {                               /* the strap handle */
      const a4 = Math.PI * (0.10 + i / 8 * 0.80);
      ART.px(c, kx2 - Math.round(Math.cos(a4) * 11), kb - 21 - Math.round(Math.sin(a4) * 8),
        2, 2, '#3a3640');
    }
    ART.px(c, kx2 - 12, kb - 19, 3, 3, '#3a3640');
    ART.px(c, kx2 + 10, kb - 19, 3, 3, '#3a3640');
    for (let i = 0; i < 9; i++) {
      ART.px(c, 66 + Math.round(Math.sin(s.T * 2 + i * 0.8) * 4), SURF - 20 - i * 5,
        3, 3, 'rgba(252,246,232,' + (0.24 - i * 0.024).toFixed(3) + ')');
    }

    /* ---- THE PAN, dead centre, at a shallow angle ---- */
    const pcx = 108, pcy = SURF + 2;
    SPR.ellipse(c, pcx, pcy + 2, 42, 15, '#151315');
    SPR.ellipse(c, pcx, pcy, 40, 14, '#2e2a2c');
    SPR.ellipse(c, pcx, pcy - 1, 36, 12, '#464146');
    SPR.ellipse(c, pcx, pcy, 33, 10, '#231f23');
    ART.px(c, pcx - 30, pcy - 12, 60, 3, 'rgba(255,255,255,.10)');
    /* the butter, sliding with the needle */
    const bx2 = pcx - 22 + Math.round(s.x * 44);
    ART.px(c, bx2, pcy + 2, 9, 4, 'rgba(255,222,140,.44)');
    /* THE EGG, setting as the needle travels */
    const cook = Math.min(1, 0.22 + s.x * 0.92);
    const ew = Math.round(9 + cook * 13), eh = Math.round(4 + cook * 6);
    SPR.ellipse(c, pcx - 2, pcy - 1, ew + 2, eh + 1, '#0f0d0e');
    SPR.ellipse(c, pcx - 2, pcy - 1, ew, eh, cook > 0.88 ? '#e8d894' : '#f6efc8');
    SPR.ellipse(c, pcx - 2, pcy - 2, Math.round(ew * 0.7), Math.round(eh * 0.6),
      'rgba(255,255,255,.16)');
    PIX.disc(c, pcx, pcy - 1, Math.round(3 + cook * 3), cook > 0.88 ? '#dc8420' : '#f0a83c');
    PIX.disc(c, pcx, pcy - 2, Math.max(1, Math.round(1 + cook * 2)), '#f8cc70');
    if (cook > 0.94) {
      for (let i = 0; i < 6; i++) {
        ART.px(c, pcx - 20 + i * 7, pcy - 6 - (i % 3), 3, 2, 'rgba(80,60,42,.5)');
      }
    }
    /* the handle, off to the right, and the steam over all of it */
    ART.px(c, pcx + 36, pcy - 4, 34, 7, '#1c1a1c');
    ART.px(c, pcx + 36, pcy - 4, 34, 2, '#3e3a3c');
    for (let i = 0; i < 8; i++) {
      ART.px(c, pcx - 6 + Math.round(Math.sin(s.T * 2.6 + i) * (3 + i)),
        pcy - 12 - i * 6, 3, 3, 'rgba(250,244,230,' + (0.22 - i * 0.024).toFixed(3) + ')');
    }

    /* the plate, out past the handle so your hand is not standing in it */
    SPR.ellipse(c, 196, SURF + 9, 22, 9, '#a89c80');
    SPR.ellipse(c, 196, SURF + 7, 20, 8, '#f0e8d4');
    SPR.ellipse(c, 196, SURF + 6, 17, 6, '#fbf7ec');
    SPR.ellipse(c, 196, SURF + 6, 12, 4, '#efe7d2');
    for (let i = 0; i < s.hits; i++) {
      SPR.ellipse(c, 190 + i * 7, SURF + 6, 7, 3, '#e8d894');
      PIX.disc(c, 190 + i * 7, SURF + 6, 2, '#f0a83c');
    }

    /* ---- AND YOUR OWN TWO ARMS ---- */
    /* ---- AND YOUR OWN TWO ARMS, one on the handle and one on the slice ----
       They come in from off the bottom corners, so the frame reads as YOUR
       shoulders, and each one ends ON something rather than in mid-air. */
    /* HIS RIGHT, ON THE PAN HANDLE. It used to end at row ninety-eight,
       twelve pixels under a handle at eighty-six, so the hand was holding
       air below the pan; and the needle strip starts at a hundred and
       three, so the bottom third of it was behind the HUD. */
    povArm(c, { x0: 216, y0: 142, x1: 168, y1: 82, w0: 24, w1: 13, sgn: 1,
      k: 0.48, fist: true, hy: 4 });
    /* and his left, holding the slice, coming in low and left of the egg so
       the egg is never behind it */
    ART.px(c, 38, 92, 46, 5, '#1c1a1c');
    ART.px(c, 38, 92, 46, 2, '#4a4448');
    ART.px(c, 74, 86, 24, 12, '#0f0d0e');
    ART.px(c, 75, 87, 22, 10, '#7c848a');
    ART.px(c, 75, 87, 22, 3, '#a2aab0');
    for (let i = 0; i < 4; i++) ART.px(c, 78 + i * 5, 90, 2, 6, '#4a5058');
    povArm(c, { x0: 2, y0: 148, x1: 46, y1: 88, w0: 24, w1: 13, sgn: -1,
      k: 0.46, fist: true, hy: 4 });
  }

  /* ---------------------------------------------------------
     THE TAPS, from behind the bar.
     --------------------------------------------------------- */
  function drawGlass(c, W, H, s) {
    povWall(c, { hi: [42, 34, 30], lo: [22, 18, 16], railY: 62, seed: 13 });
    /* the back bar: a shelf of bottles in front of a mirror, and the
       optics above them, all out of focus because you are looking down */
    ART.px(c, 0, 58, W, 5, '#4a3626');
    ART.px(c, 0, 58, W, 1, '#66492f');
    ART.px(c, 0, 63, W, 2, 'rgba(0,0,0,.44)');
    for (let i = 0; i < 14; i++) {
      const bx2 = 6 + i * 15, bh2 = 20 + (i % 4) * 5;
      const col = ['#2e6a4a', '#7a2a2e', '#8a6a2a', '#2a4a7a', '#6a2a5a'][i % 5];
      ART.px(c, bx2, 58 - bh2, 10, bh2, col);
      ART.px(c, bx2, 58 - bh2, 10, 2, 'rgba(255,255,255,.18)');
      ART.px(c, bx2, 58 - bh2, 3, bh2, 'rgba(255,255,255,.12)');
      ART.px(c, bx2 + 3, 58 - bh2 - 6, 4, 6, col);
      ART.px(c, bx2 + 1, 58 - bh2 + 8, 8, 4, 'rgba(240,232,212,.62)');
      ART.px(c, bx2 - 1, 56, 12, 2, 'rgba(0,0,0,.34)');    /* on the shelf */
    }
    ART.px(c, 0, 0, W, 30, 'rgba(10,8,12,.40)');
    ART.px(c, 0, 0, W, 8, '#2a2018');                      /* the shelf over them */
    ART.px(c, 0, 8, W, 2, 'rgba(0,0,0,.40)');
    povSurface(c, { y: SURF, top: '#5a4028', face: '#3a2818', lip: '#7a5a34' });

    /* ---- THE TAP COLUMN. It used to run from row thirty to row
       eighty-four and the glass was drawn from fifty to ninety ON TOP of
       it, both translucent, so the middle of the shot was a grey window
       with a beer-coloured bar behind it. The column ends where the glass
       begins, and the pour crosses the gap. ---- */
    const tx = 104;
    ART.px(c, tx - 12, 6, 24, 6, '#2e3238');               /* the mount */
    ART.px(c, tx - 12, 6, 24, 2, '#585f68');
    ART.px(c, tx - 9, 10, 18, 34, '#0e1013');
    ART.px(c, tx - 8, 11, 16, 32, '#43484f');
    ART.px(c, tx - 8, 11, 5, 32, 'rgba(255,255,255,.16)');
    ART.px(c, tx + 4, 11, 4, 32, 'rgba(0,0,0,.34)');
    ART.px(c, tx - 8, 11, 16, 2, '#6a727c');
    ART.px(c, tx - 6, 26, 12, 8, '#8a6a2a');               /* the brewery badge */
    ART.px(c, tx - 5, 27, 10, 6, '#c8b06a');
    ART.px(c, tx - 4, 29, 8, 2, 'rgba(60,44,16,.7)');
    ART.px(c, tx - 5, 43, 10, 12, '#0e1013');              /* the spout */
    ART.px(c, tx - 4, 44, 8, 11, '#4e555c');
    ART.px(c, tx - 4, 44, 3, 11, '#7c848c');
    ART.px(c, tx - 5, 54, 10, 2, '#22262a');
    /* the handle, over on the right where your hand comes in */
    ART.px(c, tx + 6, 16, 22, 7, '#0e1013');
    ART.px(c, tx + 7, 17, 20, 5, '#c8b06a');
    ART.px(c, tx + 7, 17, 20, 2, '#e8cc84');
    ART.px(c, tx + 24, 12, 8, 15, '#0e1013');
    ART.px(c, tx + 25, 13, 6, 13, '#8a7430');
    ART.px(c, tx + 25, 13, 3, 13, '#b09a4a');

    /* ---- THE DRIP TRAY, and the glass standing on it ---- */
    ART.px(c, 74, 90, 62, 8, '#191d21');
    ART.px(c, 75, 91, 60, 6, '#2f353b');
    ART.px(c, 75, 91, 60, 1, '#5c646c');
    for (let i = 0; i < 15; i++) ART.px(c, 77 + i * 4, 92, 2, 4, '#12161a');

    /* ---- THE GLASS, filling with the needle ---- */
    const gw = 34, gx = tx - 17, gy = 58, gh = 34, gb = gy + gh;
    SPR.ellipse(c, gx + gw / 2 + 4, gb + 2, 19, 4, 'rgba(0,0,0,.40)');
    ART.px(c, gx - 1, gy - 1, gw + 2, gh + 4, 'rgba(6,8,10,.44)');   /* the ink */
    const fill = Math.round(gh * U.clamp(s.x, 0, 1) * 0.92);
    const fy = gb - fill;
    /* the empty part of the glass only: washed over the beer, an amber this
       dark came out as a barely-warmer grey */
    ART.px(c, gx, gy, gw, Math.max(0, fy - gy) + 2, 'rgba(196,214,228,.15)');
    if (fill > 3) {
      ART.px(c, gx + 2, fy, gw - 4, fill, '#b8791c');
      ART.px(c, gx + 2, fy, gw - 4, Math.min(fill, 5), '#efe1bf');   /* the head */
      ART.px(c, gx + 2, fy, gw - 4, 1, '#fbf7ec');
      ART.px(c, gx + 2, fy + 2, gw - 4, 1, 'rgba(255,255,255,.34)');
      ART.px(c, gx + 3, fy + 5, 4, fill - 5, 'rgba(255,236,180,.30)');
      for (let i = 0; i < 12; i++) {                                 /* the bead */
        const t = ((s.T * 0.8 + i * 0.19) % 1);
        ART.px(c, gx + 5 + ((i * 9) % (gw - 12)),
          gb - 2 - Math.round(t * (fill - 6)), 1, 1,
          'rgba(255,250,232,' + (0.50 * (1 - t)).toFixed(2) + ')');
      }
    }
    /* the glass itself, over the beer: rim, base, two highlights */
    ART.px(c, gx, gy, 4, gh + 2, 'rgba(240,250,255,.26)');
    ART.px(c, gx + 5, gy + 3, 2, gh - 8, 'rgba(255,255,255,.22)');
    ART.px(c, gx + gw - 4, gy, 4, gh + 2, 'rgba(20,26,32,.26)');
    ART.px(c, gx + gw - 8, gy + 4, 2, gh - 10, 'rgba(255,255,255,.13)');
    SPR.ellipse(c, gx + gw / 2, gy + 1, gw / 2, 4, 'rgba(236,248,255,.30)');
    SPR.ellipse(c, gx + gw / 2, gy + 1, gw / 2 - 3, 2, 'rgba(16,20,26,.34)');
    SPR.ellipse(c, gx + gw / 2, gb + 1, gw / 2, 4, 'rgba(236,248,255,.22)');
    SPR.ellipse(c, gx + gw / 2, gb, gw / 2 - 5, 2, 'rgba(255,255,255,.20)');
    ART.px(c, gx + 1, gb - 5, gw - 2, 2, 'rgba(255,255,255,.12)');
    /* THE LINE YOU ARE AIMING FOR, etched right on the glass */
    const ly = gb - Math.round(gh * s.centre * 0.92);
    ART.px(c, gx - 2, ly, gw + 4, 1, 'rgba(255,255,255,.55)');
    ART.px(c, gx - 2, ly + 1, gw + 4, 1, 'rgba(0,0,0,.34)');
    ART.px(c, gx + gw + 2, ly - 2, 5, 5, PIX.PAL.K);
    ART.px(c, gx + gw + 2, ly - 1, 4, 3, PIX.PAL.G);
    ART.px(c, gx - 6, ly - 2, 5, 5, PIX.PAL.K);
    ART.px(c, gx - 5, ly - 1, 4, 3, PIX.PAL.G);
    /* the pour, crossing the gap from spout to rim */
    if (s.live) {
      for (let y = 56; y < gy + 3; y++) {
        const w2 = 3 + ((y + Math.round(s.T * 60)) % 3 === 0 ? 1 : 0);
        ART.px(c, tx - 1 + Math.round(Math.sin((y + s.T * 120) * 0.5)), y, w2, 1,
          'rgba(236,212,150,.72)');
      }
      for (let i = 0; i < 5; i++) {                        /* and the splash back */
        ART.px(c, tx - 8 + ((i * 5 + Math.round(s.T * 30)) % 16),
          fy - 2 - ((i * 3 + Math.round(s.T * 40)) % 5), 1, 1, 'rgba(250,240,214,.5)');
      }
    }

    /* ---- THE REST OF THE BAR, in the channels the needle leaves free ---- */
    ART.px(c, 4, 78, 22, 20, '#0e1013');                   /* a stack of coasters */
    for (let i = 0; i < 5; i++) {
      ART.px(c, 5, 79 + i * 4, 20, 3, i % 2 ? '#8e7a52' : '#a08c62');
      ART.px(c, 5, 79 + i * 4, 20, 1, '#bda87a');
    }
    ART.px(c, 186, 74, 24, 12, '#2a4450');                 /* the bar towel */
    ART.px(c, 184, 72, 24, 4, '#355664');
    ART.px(c, 188, 78, 16, 2, 'rgba(0,0,0,.30)');
    ART.px(c, 186, 84, 24, 2, 'rgba(0,0,0,.34)');
    ART.px(c, 152, 80, 20, 18, 'rgba(6,8,10,.36)');        /* last man's empty */
    ART.px(c, 153, 81, 18, 17, 'rgba(196,214,228,.14)');
    ART.px(c, 153, 81, 3, 17, 'rgba(240,250,255,.24)');
    SPR.ellipse(c, 162, 82, 9, 3, 'rgba(236,248,255,.26)');
    ART.px(c, 153, 94, 18, 3, 'rgba(184,121,28,.34)');
    for (let i = 0; i < 11; i++) {                          /* rings on the wood */
      PIX.ring(c, 20 + i * 18, 100 + (i % 2) * 3, 5 + (i % 3), 1, 'rgba(0,0,0,.14)');
    }

    povArm(c, { x0: 0, y0: 152, x1: gx - 8, y1: 84, w0: 26, w1: 14, sgn: -1,
      k: 0.5, fist: true, hy: 4 });
    povArm(c, { x0: 214, y0: 150, x1: tx + 34, y1: 26, w0: 26, w1: 15, sgn: 1,
      k: 0.5, fist: true, hy: 4 });
  }

  /* ---------------------------------------------------------
     THE DRUMS. A rat runs the pipe over the washers. You have one
     lid and you drop it when he is over the open drum.
     --------------------------------------------------------- */
  function drawRats(c, W, H, s) {
    povWall(c, { hi: [34, 44, 48], lo: [16, 22, 26], railY: 24, seed: 21 });
    for (let y = 4; y < SURF; y += 9) {
      ART.px(c, 0, y, W, 1, 'rgba(255,255,255,.05)');
      for (let x = 0; x < W; x += 14) ART.px(c, x, y, 1, 9, 'rgba(0,0,0,.14)');
    }
    /* THE PIPE, across the frame, with the rat on it. It ran at row forty,
       which is where the lid hangs, so the lid covered the run. */
    ART.px(c, 0, 24, W, 8, '#4a5058');
    ART.px(c, 0, 24, W, 2, '#6e767e');
    ART.px(c, 0, 30, W, 2, 'rgba(0,0,0,.36)');
    ART.px(c, 0, 32, W, 3, 'rgba(0,0,0,.22)');
    for (let i = 0; i < 5; i++) {
      ART.px(c, 18 + i * 44, 22, 6, 12, '#5a626a');
      ART.px(c, 18 + i * 44, 22, 2, 12, '#767e86');
    }
    for (let i = 0; i < 3; i++) {                     /* a drip off a joint */
      const t = ((s.T * 0.7 + i * 0.4) % 1);
      ART.px(c, 40 + i * 62, 34 + Math.round(t * 42), 1, 3,
        'rgba(160,200,220,' + (0.30 * (1 - t)).toFixed(2) + ')');
    }
    povSurface(c, { y: SURF, top: '#3a4046', face: '#22282c', lip: '#4e565e' });
    /* three drums, the open one lit */
    for (let i = 0; i < 3; i++) {
      const dx = 34 + i * 66, open = i === s.round % 3;
      ART.px(c, dx - 24, SURF - 26, 48, 40, '#2a3036');
      ART.px(c, dx - 24, SURF - 26, 48, 3, '#4a5258');
      SPR.ellipse(c, dx, SURF - 24, 23, 8, open ? '#0e1214' : '#3a4248');
      if (open) {
        SPR.ellipse(c, dx, SURF - 24, 20, 6, '#182024');
        ART.px(c, dx - 14, SURF - 26, 28, 2, 'rgba(150,200,220,.20)');
      } else {
        SPR.ellipse(c, dx, SURF - 26, 22, 7, '#525a60');
        ART.px(c, dx - 8, SURF - 29, 16, 3, '#6e767e');
      }
      for (let k = 0; k < 3; k++) ART.px(c, dx - 20, SURF - 16 + k * 9, 40, 2, 'rgba(0,0,0,.26)');
    }
    /* THE RAT, running the pipe. He was a grey lozenge with a dashed line
       behind him; he has a hump, a haunch, an ear, an eye and a tail that
       curves, and he bobs as he runs. */
    const rx = Math.round(16 + s.x * (W - 44));
    const bob = Math.round(Math.sin(s.T * 14) * 1);
    const ry = 14 + bob;
    ART.px(c, rx + 3, 22, 18, 2, 'rgba(0,0,0,.34)');          /* on the pipe */
    SPR.ellipse(c, rx + 11, ry + 4, 11, 5, '#2b2930');        /* the ink */
    SPR.ellipse(c, rx + 11, ry + 3, 10, 4, '#57515e');        /* the body */
    SPR.ellipse(c, rx + 7, ry + 2, 6, 4, '#66606d');          /* the hump */
    SPR.ellipse(c, rx + 20, ry + 3, 6, 4, '#2b2930');         /* the head, ink */
    SPR.ellipse(c, rx + 20, ry + 2, 5, 3, '#57515e');
    ART.px(c, rx + 24, ry + 2, 3, 2, '#c69aa2');              /* the nose */
    ART.px(c, rx + 21, ry, 3, 3, '#2b2930');                  /* the ear */
    ART.px(c, rx + 22, ry + 1, 2, 2, '#8a6f78');
    ART.px(c, rx + 22, ry + 2, 2, 1, '#f0e8d4');              /* the eye */
    for (let i = 0; i < 3; i++) {                             /* the legs, running */
      const lp = Math.sin(s.T * 14 + i * 2.1) > 0 ? 0 : 2;
      ART.px(c, rx + 5 + i * 6, ry + 6, 2, 3 - lp, '#3d3843');
    }
    for (let i = 0; i < 8; i++) {                             /* the tail */
      ART.px(c, rx - 1 - i * 2, ry + 5 - Math.round(Math.sin(i * 0.7) * 3), 3, 1, '#8a848c');
    }
    /* THE LID, HELD OVER THE OPEN ONE. It used to hang at a fixed
       hundred, which on a bad round was over a drum that already
       had a lid on it, so the shot said nothing about what you
       were about to do. It goes where the hole is. */
    const lx = 34 + (s.round % 3) * 66;
    povArm(c, { x0: 214, y0: 150, x1: lx + 26, y1: 42, w0: 26, w1: 15, sgn: 1,
      k: 0.5, fist: true, hy: 4 });
    /* HELD CLEAR OF IT. At row sixty-six the lid sat exactly on the mouth
       at SURF minus twenty-four, so the shot read as a drum that was
       already shut. It hangs sixteen pixels over the hole. */
    SPR.ellipse(c, lx, SURF - 24, 18, 5, 'rgba(0,0,0,.44)');   /* its shadow, in the drum */
    SPR.ellipse(c, lx, 46, 26, 8, '#1c2024');
    SPR.ellipse(c, lx, 44, 24, 7, '#6e767e');
    SPR.ellipse(c, lx, 42, 20, 5, '#8e969e');
    SPR.ellipse(c, lx - 4, 41, 10, 3, '#aab2ba');
    ART.px(c, lx - 8, 38, 16, 3, '#1c2024');
    ART.px(c, lx - 7, 35, 14, 5, '#5a626a');
    ART.px(c, lx - 7, 35, 14, 1, '#8e969e');
    /* and the wet floor under all of it, because this is a cellar */
    for (let i = 0; i < 5; i++) {
      const wx = 12 + i * 46;
      SPR.ellipse(c, wx, FH - 6 - (i % 2) * 5, 16 + (i % 3) * 5, 4,
        'rgba(120,170,190,.07)');
    }
  }

  /* ---------------------------------------------------------
     THE LOCK. Up against the door, a pick in one hand and a
     wrench in the other, and a cutaway of three pins.
     --------------------------------------------------------- */
  function drawLock(c, W, H, s) {
    povWall(c, { hi: [58, 44, 30], lo: [30, 22, 15], seed: 5 });
    /* the door, filling the frame: boards, a rail, and the plate */
    for (let x = 0; x < W; x += 26) {
      ART.px(c, x, 0, 1, FH, 'rgba(0,0,0,.30)');
      ART.px(c, x + 1, 0, 2, FH, 'rgba(255,255,255,.05)');
      ART.grain(c, x + 3, 0, 22, FH, '#4a3826', '#5e4832', x);
    }
    ART.px(c, 0, 26, W, 6, '#5e4832');
    ART.px(c, 0, 26, W, 2, '#7a5e40');
    ART.px(c, 0, 32, W, 2, 'rgba(0,0,0,.36)');
    /* THE PLATE AND THE KEYHOLE, dead centre */
    const kx = 108, ky = 66;
    ART.px(c, kx - 26, ky - 30, 52, 60, '#0e0c0a');
    ART.px(c, kx - 24, ky - 28, 48, 56, '#8a8278');
    ART.px(c, kx - 24, ky - 28, 48, 3, '#b0a89c');
    ART.px(c, kx - 24, ky + 25, 48, 3, 'rgba(0,0,0,.34)');
    for (let i = 0; i < 2; i++) {
      PIX.disc(c, kx, ky - 20 + i * 44, 3, '#3a3630');
      PIX.disc(c, kx, ky - 20 + i * 44, 2, '#6e675e');
    }
    PIX.disc(c, kx, ky - 4, 9, '#141210');
    PIX.disc(c, kx, ky - 4, 7, '#2a2620');
    ART.px(c, kx - 3, ky - 2, 6, 14, '#141210');
    ART.px(c, kx - 2, ky - 1, 4, 12, '#2a2620');
    /* THE CUTAWAY: three pins in a strip, the live one moving */
    const sx = 40, sy = 20, sw = 136;
    ART.px(c, sx - 2, sy - 2, sw + 4, 26, 'rgba(6,8,12,.72)');
    ART.px(c, sx, sy, sw, 22, '#1a1a1e');
    ART.px(c, sx, sy + 12, sw, 1, 'rgba(255,255,255,.30)');   /* the shear line */
    for (let i = 0; i < 3; i++) {
      const px2 = sx + 24 + i * 44;
      const set = i < s.hits;
      const h2 = set ? 12 : Math.round(4 + (i === s.round % 3 ? s.x * 14 : 6));
      ART.px(c, px2 - 4, sy + 1, 8, 20, '#0e0e12');
      ART.px(c, px2 - 3, sy + 22 - h2, 6, h2 - 1, set ? '#c8b06a' : '#8e969e');
      ART.px(c, px2 - 3, sy + 22 - h2, 6, 1, set ? '#e8cc84' : '#b6bec6');
      ART.px(c, px2 - 3, sy + 2, 6, Math.max(1, 10 - h2), '#4a4a52');
    }
    /* the pick and the wrench, in your two hands */
    povArm(c, { x0: 4, y0: 150, x1: 68, y1: 84, w0: 26, w1: 14, sgn: -1, k: 0.48, fist: true, hy: 4 });
    ART.px(c, 74, 78, 42, 4, '#1c1a1c');
    ART.px(c, 74, 78, 42, 1, '#8e969e');
    ART.px(c, 112, 74, 8, 8, '#6e767e');
    povArm(c, { x0: 212, y0: 152, x1: 152, y1: 58, w0: 26, w1: 15, sgn: 1, k: 0.5, fist: true, hy: 4 });
    ART.px(c, 106, 56, 44, 3, '#1c1a1c');
    ART.px(c, 106, 56, 44, 1, '#a8b0b6');
    ART.px(c, 102, 54, 8, 6, '#8e969e');
  }

  /* ---------------------------------------------------------
     THE PRINTS. A tumbler off the scene under the bench lamp, a
     camel brush in your hand, and a ridge that comes up if you
     use the right weight. The glass used to be a translucent
     rectangle with a line on it, which reads as a smudge on the
     lens, not as glass; it is now a real tumbler with a rim, a
     wall, a base and a bloom of lamplight through it. And the
     print is DEVELOPED, not flickered: every lift you land leaves
     more of it on the glass for good.
     --------------------------------------------------------- */
  function drawPrints(c, W, H, s) {
    povWall(c, { hi: [40, 46, 54], lo: [20, 24, 30], railY: 34, seed: 3 });
    /* the evidence shelf behind: bagged jars, out of focus */
    ART.px(c, 126, 2, 84, 34, '#232931');
    ART.px(c, 128, 4, 80, 30, '#11161b');
    for (let i = 0; i < 4; i++) {
      const jx = 133 + i * 19;
      ART.px(c, jx, 10, 13, 22, 'rgba(150,196,180,.20)');
      ART.px(c, jx, 10, 13, 2, 'rgba(214,240,232,.26)');
      ART.px(c, jx, 10, 2, 22, 'rgba(214,240,232,.16)');
      ART.px(c, jx + 2, 25, 9, 4, 'rgba(0,0,0,.34)');
      ART.px(c, jx + 3, 14, 7, 3, 'rgba(232,220,192,.30)');   /* the label */
    }
    ART.px(c, 126, 36, 84, 3, '#2d343b');
    ART.px(c, 126, 36, 84, 1, 'rgba(255,255,255,.10)');
    /* the lamp's cone coming down over the bench from off frame left */
    for (let i = 0; i < 30; i++) {
      const t = i / 29;
      ART.px(c, Math.round(28 - t * 26), Math.round(t * (SURF - 14)),
        Math.round(70 + t * 90), 3,
        'rgba(255,238,196,' + (0.075 - t * 0.002).toFixed(3) + ')');
    }
    povSurface(c, { y: SURF - 14, top: '#2a3038', face: '#181c22', lip: '#3e454e' });
    /* the pool of lamplight ON the bench, so the shot has a centre */
    SPR.ellipse(c, 100, SURF - 4, 76, 13, 'rgba(255,238,196,.10)');
    SPR.ellipse(c, 100, SURF - 4, 52, 9, 'rgba(255,238,196,.08)');

    /* THE TUMBLER, standing, lit from the left */
    const gx = 100, gTop = SURF - 60, gBot = SURF - 12, gw = 21;
    SPR.ellipse(c, gx + 6, gBot + 1, gw + 8, 6, 'rgba(0,0,0,.40)');   /* its shadow */
    ART.px(c, gx - gw, gTop, gw * 2, gBot - gTop, 'rgba(158,196,214,.13)');
    ART.px(c, gx - gw, gTop, 4, gBot - gTop, 'rgba(226,244,252,.30)');
    ART.px(c, gx + gw - 4, gTop, 4, gBot - gTop, 'rgba(226,244,252,.20)');
    ART.px(c, gx - gw + 5, gTop + 6, 3, gBot - gTop - 20, 'rgba(255,255,255,.20)');
    SPR.ellipse(c, gx, gTop, gw, 5, 'rgba(226,244,252,.34)');         /* the rim */
    SPR.ellipse(c, gx, gTop, gw - 3, 3, 'rgba(20,26,32,.40)');
    SPR.ellipse(c, gx, gBot, gw, 5, 'rgba(226,244,252,.24)');         /* the base */
    SPR.ellipse(c, gx, gBot - 1, gw - 5, 3, 'rgba(255,255,255,.22)');
    ART.px(c, gx - gw + 2, gBot - 8, gw * 2 - 4, 2, 'rgba(255,255,255,.14)');

    /* THE PRINT, developing on the near wall of it. What is already
       lifted stays; the live ridge answers the needle. */
    const got = s.hits / Math.max(1, s.rounds || 3);
    const live = U.clamp(1 - Math.abs(s.x - s.centre) * 2.4, 0, 1);
    const up = U.clamp(got * 0.62 + live * 0.52, 0, 1);
    const px3 = gx - 9, py3 = gTop + 31;
    for (let i = 0; i < 8; i++) {
      const rr = 4 + i * 2.3;
      SPR.ellipse(c, px3, py3, Math.round(rr), Math.round(rr * 1.22),
        'rgba(24,20,18,' + (up * (0.40 - i * 0.038)).toFixed(3) + ')');
      SPR.ellipse(c, px3, py3, Math.round(rr) - 1, Math.round(rr * 1.22) - 1,
        'rgba(158,196,214,' + (up * 0.06).toFixed(3) + ')');
    }
    ART.px(c, px3 - 5, py3 + 13, 11, 1, 'rgba(24,20,18,' + (up * 0.30).toFixed(3) + ')');

    /* THE BRUSH, tip ON the print, twirling with the needle */
    const bAng = (s.x - 0.5) * 0.5;
    povArm(c, { x0: 214, y0: 152, x1: 152, y1: 44, w0: 26, w1: 15, sgn: 1,
      k: 0.5, fist: true, hy: 4 });
    c.save();
    c.translate(px3 + 4, py3 - 8);
    c.rotate(-0.72 + bAng);
    ART.px(c, 0, -4, 54, 8, '#100e0c');
    ART.px(c, 1, -3, 52, 6, '#3c2c1c');
    ART.px(c, 1, -3, 52, 2, '#63482e');
    ART.px(c, 36, -5, 8, 10, '#8e969e');                    /* the ferrule */
    ART.px(c, 36, -5, 8, 2, '#c2cad0');
    for (let i = 0; i < 9; i++) {                           /* the camel hair */
      ART.px(c, -12 + (i % 3), -4 + i, 14 - (i % 3), 1,
        'rgba(214,208,192,' + (0.46 + (i % 3) * 0.12).toFixed(2) + ')');
    }
    c.restore();
    /* powder coming off it */
    for (let i = 0; i < 7; i++) {
      const t = ((s.T * 1.4 + i * 0.31) % 1);
      ART.px(c, px3 - 12 + Math.round(Math.sin(i * 2.1 + s.T) * 4) + i,
        py3 - 14 + Math.round(t * 26), 2, 2,
        'rgba(188,182,172,' + ((1 - t) * 0.32).toFixed(3) + ')');
    }
    /* THE LIFTS, taped up on the near lip where they do not collide */
    for (let i = 0; i < s.hits; i++) {
      const cx3 = 16 + i * 26, cy3 = SURF + 4;
      ART.px(c, cx3 - 1, cy3 - 1, 22, 17, 'rgba(0,0,0,.44)');
      ART.px(c, cx3, cy3, 20, 15, '#e8dcc0');
      ART.px(c, cx3, cy3, 20, 1, '#fbf7ec');
      for (let k = 0; k < 5; k++) {
        SPR.ellipse(c, cx3 + 10, cy3 + 7, 3 + k, 2 + k, 'rgba(70,60,48,.36)');
      }
      ART.px(c, cx3 + 5, cy3 - 2, 10, 3, 'rgba(226,240,246,.34)');   /* the tape */
    }
  }
  /* ---------------------------------------------------------
     THE PAVEMENT. Nobody pays you for this.

     The whole composition used to sit in the last twenty rows of
     the frame, underneath the needle strip: the railings ate half
     the picture, then a flat band of kerb, and the thing you were
     actually scooping was down behind the dial. It has all come up
     -- railings and tree in the top quarter, kerb, then a long run
     of wet pavement with the job on it at the middle of the frame.
     --------------------------------------------------------- */
  function drawScoop(c, W, H, s) {
    povWall(c, { hi: [104, 132, 156], lo: [58, 74, 88], seed: 31 });
    /* the far side of the street, low contrast, out of focus */
    for (let i = 0; i < 5; i++) {
      const bx3 = -10 + i * 48;
      ART.px(c, bx3, 2, 44, 22, 'rgba(30,38,48,.30)');
      for (let k = 0; k < 3; k++) {
        ART.px(c, bx3 + 6 + k * 13, 7, 8, 11, 'rgba(200,214,230,.10)');
      }
    }
    /* the railings, and a plane tree behind them */
    ART.px(c, 148, 0, 9, 32, '#4e3c28');
    ART.px(c, 148, 0, 3, 32, '#634a30');
    for (let i = 0; i < 14; i++) {
      PIX.disc(c, 153 + Math.round(Math.cos(i * 2.4) * 26),
        6 + Math.round(Math.sin(i * 2.4) * 9), 9, i % 2 ? '#3f6a38' : '#33562e');
    }
    for (let i = 0; i < 8; i++) {
      PIX.disc(c, 150 + Math.round(Math.cos(i * 1.7) * 20),
        4 + Math.round(Math.sin(i * 1.7) * 6), 4, '#4e7c42');
    }
    ART.px(c, 0, 12, W, 3, '#252f2a');
    for (let x = 4; x < W; x += 11) {
      ART.px(c, x, 14, 3, 22, '#2b352f');
      ART.px(c, x, 14, 1, 22, '#3a463e');
      ART.px(c, x - 1, 12, 5, 3, '#333f38');                /* the finial */
    }
    ART.px(c, 0, 34, W, 4, '#252f2a');

    /* ---- THE PAVEMENT, AS ONE RECEDING PLANE ----
       This used to be povSurface, which is a counter: a strip of top,
       a lit lip, then a vertical FRONT. A pavement has no front. It
       runs from the kerb to your shoes, and it came out as a flat
       brown field of noise with a grey box stuck on it. So it is a
       plane now: pale stone that darkens toward you because you are
       standing in your own shadow, courses that spread as they come
       in, and joints that converge on the vanishing point. */
    const KERB = 38, VPX = W / 2;
    ART.px(c, 0, KERB, W, 5, '#9c9284');                    /* the kerbstone */
    ART.px(c, 0, KERB, W, 1, '#bbb1a0');
    for (let x = 0; x < W; x += 34) ART.px(c, x, KERB, 1, 5, 'rgba(0,0,0,.26)');
    ART.px(c, 0, KERB + 5, W, 2, 'rgba(0,0,0,.40)');
    const P0 = KERB + 7;
    for (let y = P0; y < FH; y++) {
      const t = (y - P0) / (FH - P0);
      const g = Math.round(150 - t * 66);                   /* into your own shadow */
      c.fillStyle = 'rgb(' + g + ',' + (g - 6) + ',' + (g - 18) + ')';
      c.fillRect(0, y, W, 1);
    }
    ART.dither(c, 0, P0, W, FH - P0, 'rgba(0,0,0,.12)', 0.07, 11);
    /* the courses: level lines that spread out as the plane comes at you */
    for (let i = 1; i < 7; i++) {
      const y = Math.round(P0 + Math.pow(i / 6, 1.9) * (FH - P0));
      ART.px(c, 0, y, W, 1, 'rgba(255,255,255,.10)');
      ART.px(c, 0, y + 1, W, 1, 'rgba(0,0,0,.24)');
    }
    /* and the joints, converging */
    for (let i = -4; i <= 4; i++) {
      for (let y = P0; y < FH; y++) {
        const t = (y - P0) / (FH - P0);
        const x = Math.round(VPX + i * 26 * (0.55 + t * 1.7));
        if (x < 0 || x >= W) continue;
        ART.px(c, x, y, 1, 1, 'rgba(0,0,0,' + (0.10 + t * 0.12).toFixed(3) + ')');
      }
    }
    /* a grating set INTO the stone, gum, a dropped leaf, a dead cigarette */
    ART.px(c, 12, 92, 34, 15, 'rgba(0,0,0,.44)');
    ART.px(c, 13, 93, 32, 13, '#4a4640');
    for (let i = 0; i < 5; i++) ART.px(c, 15, 95 + i * 2, 28, 1, '#1b1a18');
    ART.px(c, 13, 93, 32, 1, '#7c766c');
    for (let i = 0; i < 9; i++) {
      SPR.ellipse(c, 54 + ((i * 47) % 148), 74 + ((i * 37) % 50), 2 + (i % 2), 2,
        'rgba(0,0,0,.14)');
    }
    SPR.ellipse(c, 186, 104, 7, 4, '#6d5c2f');
    ART.px(c, 183, 99, 3, 6, '#5b4b26');
    ART.px(c, 150, 118, 9, 3, '#e6ded0');
    ART.px(c, 157, 118, 4, 3, '#3a3630');

    /* WHAT YOU ARE HERE FOR. It goes DOWN as you clear it -- three passes
       took three taps and left the pavement exactly as filthy as it started,
       which is the sort of thing that makes a job feel like a slot machine. */
    const mx = Math.round(W * s.centre), my = 82;
    const gone = U.clamp(s.hits / s.rounds, 0, 1);
    const mk = 1 - gone * 0.82;
    if (mk > 0.2) {
      const R = (n) => Math.max(1, Math.round(n * mk));
      SPR.ellipse(c, mx + 5, my + 5, R(20), R(6), 'rgba(0,0,0,.34)');
      SPR.ellipse(c, mx, my, R(17), R(8), '#33240f');
      SPR.ellipse(c, mx, my - R(3), R(14), R(6), '#553c1c');
      SPR.ellipse(c, mx - R(4), my - R(6), R(7), R(4), '#6b4f26');
      SPR.ellipse(c, mx - R(5), my - R(7), R(3), R(2), 'rgba(255,236,196,.22)');
      for (let i = 0; i < 4; i++) {
        SPR.ellipse(c, mx - R(16) + i * R(11), my + R(7) + (i % 2) * R(4),
          R(4), R(2), 'rgba(45,32,14,.55)');
      }
      for (let i = 0; i < 4; i++) {                         /* and the flies */
        ART.px(c, mx - 10 + Math.round(Math.sin(s.T * 5 + i * 2) * 13),
          my - 22 + Math.round(Math.cos(s.T * 4 + i * 1.7) * 8), 2, 2, 'rgba(18,16,14,.66)');
      }
    } else {
      /* a clean wet patch where it was */
      SPR.ellipse(c, mx, my, 15, 5, 'rgba(150,160,150,.16)');
      SPR.ellipse(c, mx - 3, my - 1, 6, 2, 'rgba(220,230,226,.14)');
    }
    /* ============================================================
       THE SCOOP AND THE BRUSH, ONE IN EACH HAND.

       What was here was a flat grey rect with a stick drawn THROUGH
       the middle of it and a hand forty pixels past its far end
       holding nothing. On screen it read as an open laptop lying on
       the pavement, and the second hand sat on the needle strip with
       air in it. Two faults, both geometric:

         the pan was a rect      a pan you are looking down into is a
                                 trapezoid -- floor, two side walls,
                                 a back wall -- and the thing that
                                 says `pan` is the LIP on the stone
         the hands held nothing  the grips have to be ON the tools,
                                 so the handle ends in the right hand
                                 and the brush block sits in the left

       So: the pan is authored as a tray in perspective with its lip
       against the paving, the handle leaves its back corner and runs
       up into the right fist, and the left hand comes in with the
       brush and sweeps at the pan's mouth on the same beat. Both
       travel with the needle; the mess does not move.
       ============================================================ */
    /* THE TRAVEL IS CLAMPED SO THE BRUSH STAYS IN THE PICTURE. The pan
       swept from 30 to 148 and the brush hangs thirty-eight pixels to its
       left, which put the whole left hand off the frame at the near end. */
    const px = Math.round(58 + s.x * (W - 116));      // the pan's centre
    /* IT IS CARRIED, NOT DRAGGED. On the stone the pan and the brush both
       crossed the mess and the three of them came out as one brown smudge,
       so the whole rig rides a dozen rows higher with its shadow left down
       on the paving, and it THUMPS the last of the way when you land one. */
    const PY = 54 + Math.round((s.flash || 0) * 9);   // its back edge, in the air
    const PH = 15;                                    // how deep it is, in rows
    const lipW = 40, backW = 26;
    const wAt = (i2) => Math.round(backW + (i2 / (PH - 1)) * (lipW - backW));
    /* the shadow it throws, DOWN ON THE STONE where the pan is not: that
       is the whole of what says the thing is held in the air */
    const shY = 92 - Math.round((s.flash || 0) * 4);
    for (let i2 = 0; i2 < 5; i2++) {
      const w = wAt(PH - 1) - i2 * 4;
      ART.px(c, px - (w >> 1) + i2 * 2 + 3, shY + i2, w, 1, 'rgba(0,0,0,.30)');
    }
    ART.px(c, px - 13, shY + 1, 26, 3, 'rgba(0,0,0,.22)');
    /* the back wall, standing up off the stone */
    ART.px(c, px - (backW >> 1) - 1, PY - 9, backW + 2, 11, '#0d1014');
    ART.px(c, px - (backW >> 1), PY - 8, backW, 9, '#5e666f');
    ART.px(c, px - (backW >> 1), PY - 8, backW, 2, '#89929c');
    ART.px(c, px - (backW >> 1), PY - 1, backW, 2, 'rgba(0,0,0,.40)');
    /* the floor of the pan, which is the bit you are aiming */
    for (let i2 = 0; i2 < PH; i2++) {
      const w = wAt(i2), t = i2 / (PH - 1);
      const g = Math.round(112 + t * 46);
      ART.px(c, px - (w >> 1) - 1, PY + i2, w + 2, 1, '#0d1014');
      ART.px(c, px - (w >> 1), PY + i2, w, 1,
        'rgb(' + g + ',' + (g + 4) + ',' + (g + 12) + ')');
      /* the two side walls catch the lamp on one edge and lose it on the other */
      ART.px(c, px - (w >> 1), PY + i2, 2, 1, 'rgba(255,255,255,.24)');
      ART.px(c, px + (w >> 1) - 2, PY + i2, 2, 1, 'rgba(0,0,0,.26)');
    }
    /* THE LIP. One bright line where the steel meets the paving, which is
       the whole reason this reads as a pan and not a card lying flat. */
    ART.px(c, px - (lipW >> 1) - 1, PY + PH, lipW + 2, 2, '#0d1014');
    ART.px(c, px - (lipW >> 1), PY + PH, lipW, 1, '#d2dae4');
    /* and what is already in it, once you have landed one */
    if (s.hits > 0) {
      SPR.ellipse(c, px, PY + 6, 11, 4, '#3d2a11');
      SPR.ellipse(c, px - 2, PY + 5, 7, 2, '#5b4020');
    }
    /* THE HANDLE, out of the pan's back corner, THROUGH the fist, and a
       stub out the top of it. A shaft that stops inside the hand reads as
       a hand resting on nothing; the stub is what makes it held. */
    const shaft = (x0, y0, x1, y1, at) => {
      SPR.povTube(c, x0, y0, x1, y1, 7, 5, '#4a3722', '#241a0e',
        'rgba(255,236,190,.22)');
      return [Math.round(x0 + (x1 - x0) * at), Math.round(y0 + (y1 - y0) * at)];
    };
    const [gx, gy] = shaft(px + 8, PY - 6, px + 52, PY - 42, 0.70);
    ART.px(c, px + 5, PY - 9, 8, 5, '#20304a');       // the socket
    ART.px(c, px + 5, PY - 9, 8, 2, '#3d5578');
    povArm(c, { x0: 220, y0: 152, x1: gx, y1: gy, w0: 26, w1: 13, sgn: 1, k: 0.46,
      fist: true, hy: 4 });
    /* THE BRUSH, in the left hand, sweeping at the pan's mouth. It sits
       CLEAR of the pan and clear of the mess -- drawn over either, the
       three of them came out as one brown smudge. */
    const swp = Math.sin(s.T * 7) * 0.5 + 0.5;        // the stroke
    const bxp = px - 38 - Math.round(swp * 6), byp = PY + 8 + Math.round(swp * 3);
    const [hx2, hy2] = shaft(bxp + 8, byp - 5, bxp - 30, byp - 44, 0.70);
    ART.px(c, bxp - 3, byp - 6, 22, 7, '#0d1014');    // the block
    ART.px(c, bxp - 2, byp - 5, 20, 5, '#6b4d24');
    ART.px(c, bxp - 2, byp - 5, 20, 2, '#8f6a33');
    for (let i2 = 0; i2 < 10; i2++) {                 // the bristles
      const h = 5 + (i2 % 3);
      ART.px(c, bxp - 1 + i2 * 2, byp + 1, 1, h, i2 % 2 ? '#c8a468' : '#a8813f');
    }
    ART.px(c, bxp - 2, byp + 9, 20, 1, 'rgba(0,0,0,.30)');
    povArm(c, { x0: 0, y0: 158, x1: hx2, y1: hy2, w0: 26, w1: 13,
      sgn: -1, k: 0.42, fist: true, hy: 4 });
    /* the grit it kicks up off the stone */
    for (let i2 = 0; i2 < 5; i2++) {
      const t = (s.T * 2.4 + i2 * 0.4) % 1;
      ART.px(c, bxp + 6 + Math.round(t * 22), byp + 6 - Math.round(Math.sin(t * 3.1) * 9),
        1, 1, 'rgba(210,198,170,' + (0.5 - t * 0.4).toFixed(2) + ')');
    }
  }

  /* ---------------------------------------------------------
     THE THREE CUPS, from your side of the trestle.

     Two sets of hands: HIS come down into frame from above, one on
     the cup he is working, and yours comes up from the bottom with
     a finger out at the one you are calling. The called cup lifts
     and the ball is under it or it is not.
     --------------------------------------------------------- */
  function drawCups(c, W, H, s) {
    povWall(c, { hi: [96, 112, 130], lo: [46, 54, 66], seed: 41 });
    /* the arcade behind him: shopfronts, an awning, a couple of passers-by */
    for (let i = 0; i < 6; i++) {
      const bx2 = 2 + i * 37;
      ART.px(c, bx2, 8, 32, 42, 'rgba(18,22,30,.36)');
      ART.px(c, bx2 + 3, 16, 26, 18, 'rgba(200,214,230,.16)');
      ART.px(c, bx2 + 3, 16, 26, 2, 'rgba(226,238,250,.22)');
      ART.px(c, bx2 - 1, 6, 36, 4, i % 2 ? 'rgba(120,40,44,.36)' : 'rgba(40,60,90,.36)');
    }
    for (let i = 0; i < 3; i++) {                    /* passers-by, silhouettes */
      const wx = 24 + i * 74 + Math.round(Math.sin(s.T * 0.5 + i) * 6);
      ART.px(c, wx, 30, 8, 20, 'rgba(12,14,20,.44)');
      PIX.disc(c, wx + 4, 28, 5, 'rgba(12,14,20,.44)');
    }
    ART.px(c, 0, 50, W, 4, 'rgba(10,12,18,.44)');
    povSurface(c, { y: 60, top: '#6a4a2c', face: '#3a2818', lip: '#8a6238' });
    /* the trestle's cloth, with a fold and a worn patch */
    ART.px(c, 0, 60, W, 16, '#7a2a2e');
    ART.dither(c, 0, 60, W, 16, '#5e1e22', 0.28, 7);
    ART.px(c, 0, 59, W, 2, '#96383c');
    ART.px(c, 0, 74, W, 3, 'rgba(0,0,0,.34)');
    for (let i = 0; i < 4; i++) ART.px(c, 30 + i * 52, 60, 2, 16, 'rgba(0,0,0,.20)');
    SPR.ellipse(c, 150, 68, 20, 5, 'rgba(220,200,180,.08)');
    /* HIS SLEEVES, down from off frame. The hands go on AFTER the cups,
       because a hand behind a cup is a green blob in the gap between two
       cups with a white bar floating over it, which is what these were. */
    const hisI = ((s.T * 0.9) | 0) % 3;
    const hisX = 46 + hisI * 60;
    /* ONE HAND ON THIS CUP, ONE ON THE NEXT -- a shuffle in progress. At
       plus and minus thirty they landed in the gaps between cups, hanging
       in mid-air; at plus and minus fourteen they were both on the same cup
       and you could not see the cup. */
    const SLV = [[hisX - 2, -1], [hisX + (hisI === 2 ? -62 : 62), 1]];
    for (const [ax, k2] of SLV) {
      SPR.povTube(c, ax + k2 * 30, -20, ax, 30, 21, 14,
        '#22262e', '#12141a', 'rgba(255,255,255,.08)');
    }
    /* THREE CUPS, and they TAPER -- a thimble cup is narrower at the top,
       and thirty by thirty-two square reads as a bucket. */
    const called = Math.round(s.centre * 3 - 0.5);
    for (let i = 0; i < 3; i++) {
      const cx2 = 46 + i * 60;
      const lifted = s.flash > 0.3 && i === U.clamp(called, 0, 2);
      const cy = 68 - (lifted ? 22 : 0);
      SPR.ellipse(c, cx2 + 4, 70, 17, 4, 'rgba(0,0,0,.44)');
      if (lifted) {
        SPR.ellipse(c, cx2, 68, 8, 3, 'rgba(0,0,0,.38)');
        PIX.disc(c, cx2, 64, 6, PIX.PAL.K);
        PIX.disc(c, cx2, 64, 5, '#f4efe0');
        PIX.disc(c, cx2 - 2, 62, 2, '#fbf9f0');
      }
      const TOP = cy - 32, BOT = cy - 2;
      for (let y = TOP; y <= BOT; y++) {
        const t = (y - TOP) / (BOT - TOP);
        const hw2 = Math.round(9 + t * t * 6 + t * 3);          /* nine out to eighteen */
        ART.px(c, cx2 - hw2 - 1, y, hw2 * 2 + 3, 1, PIX.PAL.K);
        const sh = y < TOP + 5 ? '#d94a52' : (y > BOT - 6 ? '#8c1a24' : '#b8232f');
        ART.px(c, cx2 - hw2, y, hw2 * 2 + 1, 1, sh);
        ART.px(c, cx2 - hw2, y, 3, 1, 'rgba(0,0,0,.26)');       /* turned away */
        ART.px(c, cx2 + hw2 - 2, y, 3, 1, 'rgba(0,0,0,.16)');
        if (y > TOP + 4 && y < BOT - 6) {
          ART.px(c, cx2 - hw2 + 4, y, 4, 1, 'rgba(255,255,255,.15)');
        }
      }
      SPR.ellipse(c, cx2, TOP, 10, 3, '#7c141d');               /* the closed top */
      SPR.ellipse(c, cx2, TOP - 1, 8, 2, '#c33b45');
      ART.px(c, cx2 - 20, BOT, 41, 4, PIX.PAL.K);               /* the rim on the cloth */
      ART.px(c, cx2 - 19, BOT + 1, 39, 2, '#8c1a24');
      ART.px(c, cx2 - 19, BOT + 1, 39, 1, '#a8202c');
      ART.px(c, cx2 - 6, cy - 22, 13, 2, 'rgba(255,255,255,.08)');
      for (let k = 0; k < 3; k++) {                             /* wear, where he grips */
        ART.px(c, cx2 + 6 + k, cy - 14 + k * 3, 2, 1, 'rgba(240,220,200,.14)');
      }
    }
    /* HIS HANDS, now ON the cup he is working */
    for (const [ax, k2] of SLV) {
      ART.px(c, ax - 9, 26, 18, 7, '#0e1014');
      ART.px(c, ax - 8, 27, 16, 5, '#e2dccc');                  /* the cuff */
      ART.px(c, ax - 8, 27, 16, 2, '#fbf7ec');
      ART.px(c, ax - 8, 32, 17, 12, '#123a28');                 /* the back of the hand */
      ART.px(c, ax - 7, 33, 15, 10, '#1f6b46');
      ART.px(c, ax - 7, 33, 15, 3, '#2b8b5c');
      for (let f = 0; f < 4; f++) {                             /* four digits, draped */
        const fx = ax - 7 + f * 4, fl = 9 - Math.abs(f - 1) * 2;
        ART.px(c, fx, 43, 4, fl + 1, '#123a28');
        ART.px(c, fx, 43, 3, fl, '#1f6b46');
        ART.px(c, fx, 43, 3, 2, '#2b8b5c');
      }
      ART.px(c, ax + k2 * 9 - 1, 36, 4, 8, '#123a28');          /* and the thumb */
      ART.px(c, ax + k2 * 9 - 1, 36, 3, 7, '#256f4a');
    }
    /* the trestle he set this up on, so the near half of the frame is a
       thing and not a brown field: an apron under the cloth, two legs
       and the paving it stands on */
    ART.px(c, 0, 77, W, 5, '#4a3320');
    ART.px(c, 0, 77, W, 1, '#6b4c2d');
    ART.px(c, 0, 82, W, 2, 'rgba(0,0,0,.44)');
    for (const lx2 of [24, 190]) {
      ART.px(c, lx2, 84, 9, FH - 84, '#3a2818');
      ART.px(c, lx2, 84, 3, FH - 84, '#54402a');
      ART.px(c, lx2 - 3, 84, 15, 3, 'rgba(0,0,0,.40)');
    }
    for (let y = 84; y < FH; y++) {
      const t = (y - 84) / (FH - 84);
      c.fillStyle = 'rgb(' + Math.round(74 - t * 34) + ',' + Math.round(68 - t * 32)
        + ',' + Math.round(60 - t * 28) + ')';
      c.fillRect(0, y, W, 1);
    }
    ART.dither(c, 0, 84, W, FH - 84, 'rgba(0,0,0,.16)', 0.09, 19);
    for (let i = 1; i < 4; i++) {
      ART.px(c, 0, 84 + Math.round(Math.pow(i / 3, 1.8) * (FH - 84)), W, 1,
        'rgba(0,0,0,.20)');
    }
    /* a handful of his marks on the ground: a chalk ring and two coins */
    PIX.ring(c, 108, 112, 26, 1, 'rgba(232,226,208,.14)');
    PIX.disc(c, 88, 120, 3, '#8e7a3a');
    PIX.disc(c, 132, 116, 3, '#8e7a3a');

    /* YOUR HAND, up over the near edge with the index out AT the cup.

       It used to lie flat at row ninety-two pointing sideways, under the
       apron, in the dark -- a hand nowhere near the thing it was calling.
       Then it was a hand block with a nine-pixel green post on top of it
       AND povArm's own fist underneath, which is two hands' worth of frog
       in one arm. povArm goes bare and this draws the one hand, rotated,
       so the finger runs along the line it is pointing down. */
    const px4 = 46 + U.clamp(Math.round(s.x * 3 - 0.5), 0, 2) * 60;
    povArm(c, { x0: 214, y0: 160, x1: px4 + 36, y1: 102, w0: 27, w1: 17,
      sgn: 1, bare: true });
    c.save();
    /* the pivot sits down and right of the cup and the finger runs UP AND
       LEFT to it: at minus nought-point-nine-two radians the finger came
       out pointing up and to the RIGHT, away from everything */
    c.translate(px4 + 30, 96);
    c.rotate(-2.43);
    ART.px(c, -17, -10, 12, 20, PIX.PAL.K);                /* your own cuff */
    ART.px(c, -16, -9, 10, 18, '#e2dccc');
    ART.px(c, -16, -9, 4, 18, '#fbf7ec');
    ART.px(c, -6, -11, 22, 22, '#0c2418');                 /* the back of the hand */
    ART.px(c, -5, -10, 20, 20, '#1f6b46');
    ART.px(c, -5, -10, 20, 5, '#2b8b5c');
    ART.px(c, -5, 4, 20, 3, 'rgba(0,0,0,.24)');
    for (let f = 0; f < 3; f++) {                          /* three digits, folded under */
      ART.px(c, -2 + f * 6, 9, 7, 8, '#0c2418');
      ART.px(c, -1 + f * 6, 9, 5, 7, '#256f4a');
      ART.px(c, -1 + f * 6, 9, 5, 2, '#2f8455');
    }
    const FL = 25;                                         /* the index, out and tapering */
    for (let i = 0; i < FL; i++) {
      const t = i / (FL - 1);
      const hw3 = Math.max(2, Math.round(4.2 - t * 1.6));
      ART.px(c, 13 + i, -hw3 - 2, 1, hw3 * 2 + 4, '#0c2418');
      ART.px(c, 13 + i, -hw3 - 1, 1, hw3 * 2 + 1, '#2b8b5c');
      ART.px(c, 13 + i, -hw3 - 1, 1, 2, '#4fb583');
    }
    PIX.disc(c, 13 + FL, -1, 3, '#0c2418');
    PIX.disc(c, 12 + FL, -1, 2, '#3ca070');
    ART.px(c, 10, -6, 2, 12, 'rgba(0,0,0,.24)');           /* the knuckle */
    c.restore();
    /* and the call, chalked on the cloth in front of the cup */
    ART.px(c, px4 - 10, 72, 21, 2, 'rgba(111,247,216,.50)');
    ART.px(c, px4 - 1, 66, 2, 6, 'rgba(111,247,216,.50)');
    ART.px(c, px4 - 4, 66, 8, 2, 'rgba(111,247,216,.50)');
  }

  /* ---------------------------------------------------------
     THE FRYER. A batch of donuts, and oil that has a right heat.
     The tongs were two grey bars and a block; they are now tongs,
     with a bow, two tapering arms and a donut in the jaws when
     there is one to lift.
     --------------------------------------------------------- */
  function drawFryer(c, W, H, s) {
    povWall(c, { hi: [46, 36, 30], lo: [22, 17, 14], railY: 40, seed: 13 });
    /* the shelf over the fryer, with trays and a stack of boxes on it */
    ART.px(c, 0, 6, W, 4, '#3c332a');
    ART.px(c, 0, 6, W, 1, '#5c503f');
    ART.px(c, 0, 10, W, 2, 'rgba(0,0,0,.40)');
    for (let i = 0; i < 4; i++) {
      const tx = 8 + i * 52;
      ART.px(c, tx, -6 + (i % 2) * 2, 42, 12, '#2c2620');
      ART.px(c, tx, 2, 42, 4, '#463c30');
      ART.px(c, tx + 2, 3, 38, 1, 'rgba(255,255,255,.10)');
    }
    ART.px(c, 150, 12, 34, 24, '#5a3f26');
    ART.px(c, 150, 12, 34, 3, '#7a5836');
    for (let i = 0; i < 3; i++) ART.px(c, 152, 18 + i * 6, 30, 1, 'rgba(0,0,0,.30)');
    /* the tiled wall behind, with grease shine on it */
    for (let y = 42; y < SURF; y += 8) {
      ART.px(c, 0, y, W, 1, 'rgba(255,255,255,.08)');
      for (let x = ((y / 8) % 2) ? 0 : 6; x < W; x += 12) ART.px(c, x, y, 1, 8, 'rgba(0,0,0,.14)');
    }
    ART.px(c, 8, 44, 18, SURF - 46, 'rgba(255,236,186,.05)');
    povSurface(c, { y: SURF - 10, top: '#3a3630', face: '#22201c', lip: '#4e4840' });
    /* THE VAT, with the oil moving in it */
    const vx = 30, vy = SURF - 42, vw = 156, vh = 46;
    ART.px(c, vx - 4, vy - 4, vw + 8, vh + 8, '#141210');
    ART.px(c, vx - 3, vy - 3, vw + 6, vh + 6, '#4a423a');
    ART.px(c, vx - 3, vy - 3, vw + 6, 2, '#6c6154');
    ART.px(c, vx, vy, vw, vh, '#2c2822');
    ART.px(c, vx + 4, vy + 4, vw - 8, vh - 8, '#6e4a1c');
    for (let i = 0; i < vw - 12; i += 5) {
      const hh2 = 3 + ((i * 7 + Math.round(s.x * 60)) % 6);
      ART.px(c, vx + 6 + i, vy + 6, 4, hh2, '#8f6224');
    }
    ART.px(c, vx + 4, vy + 4, vw - 8, 3, '#a8762c');
    ART.px(c, vx + 4, vy + 4, vw - 8, 1, 'rgba(255,226,150,.34)');
    /* the basket, and three donuts in it */
    ART.px(c, vx + 14, vy + 12, vw - 28, 24, 'rgba(20,18,14,.30)');
    for (let i = 0; i < 12; i++) {
      ART.px(c, vx + 16 + i * 12, vy + 12, 1, 24, 'rgba(255,236,186,.10)');
    }
    for (let i = 0; i < 3; i++) {
      const dx = vx + 40 + i * 40;
      const dy = vy + 26 + (i === s.round % 3 ? Math.round(Math.sin(s.T * 6) * 2) : 0);
      SPR.ellipse(c, dx, dy + 12, 13, 4, 'rgba(0,0,0,.30)');
      PIX.disc(c, dx, dy, 13, '#241a10');
      PIX.disc(c, dx, dy, 12, i < s.hits ? '#e0a86a' : '#c98a4a');
      PIX.disc(c, dx - 3, dy - 3, 7, i < s.hits ? '#eec089' : '#d79c5c');
      PIX.disc(c, dx, dy, 4, '#3a2a18');
      if (i < s.hits) {
        PIX.disc(c, dx, dy - 2, 11, '#e56aa8');
        PIX.disc(c, dx - 3, dy - 5, 5, '#f288bd');
        PIX.disc(c, dx, dy, 4, '#3a2a18');
        for (let k = 0; k < 5; k++) ART.px(c, dx - 8 + k * 4, dy - 8 + (k % 3) * 3, 2, 2, '#f4efe0');
      }
    }
    /* the steam off it: puffs that spread and thin, not a dotted line */
    for (let i = 0; i < 11; i++) {
      const t = i / 10;
      const sy2 = vy - 4 - i * 4;
      const sw2 = 4 + Math.round(t * 13);
      for (let k = 0; k < 2; k++) {
        SPR.ellipse(c, 94 + Math.round(Math.sin(s.T * 2.2 + i * 0.8 + k * 2) * (4 + t * 16))
          + k * 8, sy2, sw2, 2 + Math.round(t * 3),
          'rgba(232,226,212,' + (0.13 * (1 - t)).toFixed(3) + ')');
      }
    }
    /* THE TONGS, in your hand, jaws open over the live donut */
    const gap = 3 + Math.round((1 - Math.abs(s.x - s.centre) * 2) * 4);
    povArm(c, { x0: 214, y0: 152, x1: 168, y1: 74, w0: 26, w1: 15, sgn: 1,
      k: 0.5, fist: true, hy: 4 });
    ART.px(c, 156, 66, 12, 16, '#33383e');                 /* the bow */
    ART.px(c, 156, 66, 12, 2, '#767d84');
    ART.px(c, 158, 68, 8, 12, '#4e555c');
    for (const sgn2 of [-1, 1]) {                          /* the two arms */
      for (let i = 0; i < 42; i++) {
        const t = i / 41;
        const yy = 74 + sgn2 * Math.round(gap * (0.35 + t * 1.0));
        ART.px(c, 156 - i, yy - 2, 1, 4, '#0f1113');
        ART.px(c, 156 - i, yy - 1, 1, 2 + (t > 0.8 ? 1 : 0),
          sgn2 < 0 ? '#a4acb4' : '#7e868e');
      }
    }
    ART.px(c, 112, 74 - gap - 3, 6, 4, '#b6bec6');          /* the jaws */
    ART.px(c, 112, 74 + gap, 6, 4, '#8e969e');
    /* THE NEAR COUNTER. Everything below the vat was one flat dark band,
       which is where a kitchen keeps the tray you are filling. It lives in
       the two side channels: the needle strip runs from x=32 to x=182 and
       the pips sit at the middle of row ninety-nine, so a shaker at x=96
       came out with three tally pips stuck to the side of it. */
    const ny = SURF + 12;
    ART.px(c, -2, ny - 2, 30, 26, '#0f0d0b');               /* the cooling rack, left */
    ART.px(c, -1, ny - 1, 28, 24, '#453a2c');
    ART.px(c, -1, ny - 1, 28, 3, '#5e5040');
    for (let i = 0; i < 5; i++) ART.px(c, -1, ny + 4 + i * 4, 28, 1, 'rgba(0,0,0,.24)');
    for (let i = 0; i < Math.min(3, s.hits); i++) {
      const dx2 = 6 + i * 9, dy2 = ny + 12 - i * 4;
      SPR.ellipse(c, dx2, dy2 + 8, 9, 3, 'rgba(0,0,0,.40)');
      PIX.disc(c, dx2, dy2, 9, '#241a10');
      PIX.disc(c, dx2, dy2, 8, '#e0a86a');
      PIX.disc(c, dx2 - 2, dy2 - 2, 4, '#eec089');
      PIX.disc(c, dx2, dy2, 3, '#3a2a18');
    }
    ART.px(c, 186, ny - 6, 14, 26, '#0f0d0b');              /* the sugar shaker, right */
    ART.px(c, 187, ny - 5, 12, 24, '#c8c0ae');
    ART.px(c, 187, ny - 5, 4, 24, '#e4dccc');
    ART.px(c, 188, ny - 9, 10, 4, '#8e969e');
    ART.px(c, 188, ny - 9, 10, 1, '#c2cad0');
    for (let i = 0; i < 6; i++) {
      ART.px(c, 190 + (i % 3) * 3, ny - 8 + ((i / 3) | 0) * 2, 1, 1, '#3a3630');
    }
    ART.px(c, 190, ny + 4, 8, 7, '#8c1a24');                /* its label */
    ART.px(c, 191, ny + 6, 6, 1, 'rgba(255,255,255,.30)');
    ART.px(c, 202, ny + 8, 14, 14, '#2a4450');              /* the cloth, thrown down */
    ART.px(c, 200, ny + 6, 14, 4, '#355664');
    ART.px(c, 204, ny + 12, 10, 2, 'rgba(0,0,0,.30)');
    ART.px(c, 202, ny + 20, 14, 2, 'rgba(0,0,0,.34)');
    /* a spill of sugar and one dropped ring on the near boards */
    for (let i = 0; i < 9; i++) {
      ART.px(c, 30 + ((i * 23) % 24), ny + 6 + ((i * 13) % 14), 1, 1, 'rgba(240,234,220,.30)');
    }
  }

  /* ---------------------------------------------------------
     THE RANGE. Down the lane, over the sights.
     --------------------------------------------------------- */
  function drawTarget(c, W, H, st) {
    povWall(c, { hi: [30, 34, 40], lo: [14, 16, 20], seed: 23 });
    /* the booth, either side, and the lane running away */
    ART.px(c, 0, 0, 34, FH, '#20242a');
    ART.px(c, 30, 0, 4, FH, '#2e343c');
    ART.px(c, 34, 0, 3, FH, '#0e1013');
    ART.px(c, W - 34, 0, 34, FH, '#20242a');
    ART.px(c, W - 34, 0, 4, FH, '#2e343c');
    ART.px(c, W - 37, 0, 3, FH, '#0e1013');
    ART.px(c, 37, 0, W - 74, FH, '#171a1f');
    ART.dither(c, 37, 0, W - 74, FH, 'rgba(0,0,0,.3)', 0.1, 9);
    /* the acoustic baffles on the booth walls */
    for (let y = 6; y < FH; y += 13) {
      ART.px(c, 2, y, 26, 9, '#262b32');
      ART.px(c, 2, y, 26, 1, '#343b44');
      ART.px(c, W - 28, y + 5, 26, 9, '#262b32');
      ART.px(c, W - 28, y + 5, 26, 1, '#343b44');
    }
    /* the lane, running away: a floor that gets darker with distance and
       two lines of matting converging on the target */
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const y = Math.round(FH - t * 62);
      ART.px(c, Math.round(37 + t * 34), y, Math.round(W - 74 - t * 68), 3,
        'rgba(58,52,44,' + (0.9 - t * 0.7).toFixed(3) + ')');
    }
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      ART.px(c, Math.round(58 + t * 22), Math.round(FH - 6 - t * 52),
        Math.round(W - 116 - t * 44), 1, 'rgba(120,104,80,' + (0.34 - t * 0.26).toFixed(3) + ')');
    }
    /* THE PAPER, at the far end */
    const tx = Math.round(37 + (W - 74) * st.centre), ty = 32;
    ART.px(c, tx - 27, ty - 27, 54, 54, 'rgba(0,0,0,.44)');
    ART.px(c, tx - 26, ty - 26, 52, 52, '#e8dcc0');
    ART.px(c, tx - 26, ty - 26, 52, 2, '#fbf7ec');
    ART.px(c, tx - 26, ty + 22, 52, 2, '#bfb193');
    for (let i = 4; i >= 1; i--) {
      PIX.disc(c, tx, ty, i * 6, i % 2 ? '#2a2620' : '#e8dcc0');
    }
    PIX.disc(c, tx, ty, 4, '#8a2418');
    PIX.disc(c, tx - 1, ty - 1, 2, '#b8382a');
    for (let i = 0; i < st.hits; i++) {
      PIX.disc(c, tx - 8 + i * 7, ty - 4 + (i % 2) * 8, 3, '#1a1614');
      PIX.disc(c, tx - 8 + i * 7, ty - 4 + (i % 2) * 8, 2, '#0a0908');
    }
    /* the wire it hangs on, and the lamp over it */
    ART.px(c, tx - 1, 0, 2, ty - 26, '#3a4048');
    ART.px(c, tx - 14, 1, 28, 5, '#3a4048');
    ART.px(c, tx - 14, 1, 28, 1, '#585f68');
    for (let i = 0; i < 12; i++) {
      ART.px(c, tx - 12 - i, 6 + i, 24 + i * 2, 1,
        'rgba(255,240,200,' + (0.09 - i * 0.006).toFixed(3) + ')');
    }
    /* the spent brass on the mat, and last week's paper in the corner */
    for (let i = 0; i < 9; i++) {
      const cx4 = 46 + ((i * 41) % 124), cy4 = 92 + ((i * 29) % 34);
      ART.px(c, cx4, cy4, 4, 2, '#0e0c0a');
      ART.px(c, cx4, cy4, 3, 1, '#a8862c');
    }
    for (let i = 0; i < 3; i++) {
      ART.px(c, 40 + i, 118 - i * 3, 22, 4, '#c9bb9c');
      ART.px(c, 40 + i, 118 - i * 3, 22, 1, '#e8dcc0');
    }

    /* ---- THE PISTOL, IN YOUR TWO HANDS.
       It used to sit at FH minus thirty-four, which put the grip, both
       hands and the trigger guard behind the needle strip: the whole
       reason for a first-person shot, buried under the HUD. It sits
       eighteen rows higher, and it is a pistol rather than a black box --
       slide, ejection port, hammer, a rear notch you look THROUGH and a
       front blade you line up in it. ---- */
    const gy = FH - 52, gx = 107 + Math.round((st.x - 0.5) * 20);
    /* the two hands first, so the gun sits in them */
    povArm(c, { x0: 16, y0: 156, x1: gx - 20, y1: gy + 12, w0: 29, w1: 17,
      sgn: -1, k: 0.62, fist: true, hy: 3 });
    povArm(c, { x0: 200, y0: 158, x1: gx + 22, y1: gy + 14, w0: 29, w1: 17,
      sgn: 1, k: 0.62, fist: true, hy: 3 });
    /* the grip, between them */
    ART.px(c, gx - 9, gy + 4, 18, 22, '#0c0c0e');
    ART.px(c, gx - 8, gy + 5, 16, 20, '#2c2620');
    for (let i = 0; i < 6; i++) ART.px(c, gx - 8, gy + 8 + i * 3, 16, 1, 'rgba(0,0,0,.40)');
    ART.px(c, gx - 8, gy + 5, 4, 20, 'rgba(255,255,255,.07)');
    /* the frame and the slide, seen from behind and slightly above */
    ART.px(c, gx - 23, gy - 9, 46, 16, '#0c0c0e');
    ART.px(c, gx - 22, gy - 8, 44, 14, '#22232a');
    ART.px(c, gx - 22, gy - 8, 44, 3, '#4c4e58');
    ART.px(c, gx - 22, gy - 5, 44, 1, 'rgba(255,255,255,.14)');
    ART.px(c, gx - 22, gy + 3, 44, 3, 'rgba(0,0,0,.44)');
    ART.px(c, gx + 4, gy - 4, 14, 5, '#101116');           /* the ejection port */
    ART.px(c, gx + 4, gy - 4, 14, 1, '#5a5c66');
    for (let i = 0; i < 4; i++) {                          /* the slide serrations */
      ART.px(c, gx - 20 + i * 3, gy - 7, 1, 12, 'rgba(0,0,0,.34)');
    }
    ART.px(c, gx - 6, gy - 15, 11, 7, '#0c0c0e');          /* the hammer, back */
    ART.px(c, gx - 5, gy - 14, 9, 5, '#3a3b44');
    ART.px(c, gx - 5, gy - 14, 9, 1, '#666875');
    /* THE REAR NOTCH you look through */
    ART.px(c, gx - 12, gy - 13, 5, 6, '#0c0c0e');
    ART.px(c, gx - 11, gy - 12, 3, 4, '#585a64');
    ART.px(c, gx + 8, gy - 13, 5, 6, '#0c0c0e');
    ART.px(c, gx + 9, gy - 12, 3, 4, '#585a64');
    /* the barrel going away, and THE FRONT BLADE in the notch */
    const bl = 26;
    for (let i = 0; i < bl; i++) {
      const t = i / (bl - 1);
      const hw4 = Math.round(7 - t * 3);
      const by4 = gy - 6 - Math.round(t * 12);
      ART.px(c, gx - hw4, by4, hw4 * 2, 3, '#191a20');
      ART.px(c, gx - hw4, by4, hw4 * 2, 1, 'rgba(255,255,255,.10)');
    }
    ART.px(c, gx - 4, gy - 22, 8, 5, '#0c0c0e');           /* the muzzle */
    ART.px(c, gx - 3, gy - 21, 6, 3, '#33353c');
    ART.px(c, gx - 2, gy - 27, 4, 6, '#0c0c0e');           /* the blade */
    ART.px(c, gx - 1, gy - 26, 2, 5, '#9aa2aa');
    /* and the sight picture: a hairline from the blade to the paper, so you
       can see whether you are on it before you pull */
    const off = Math.abs(st.x - st.centre);
    if (off < st.band * 0.9) {
      const a2 = (1 - off / (st.band * 0.9)) * 0.30;
      for (let y = ty + 6; y < gy - 27; y += 3) {
        ART.px(c, gx, y, 1, 2, 'rgba(255,226,150,' + a2.toFixed(3) + ')');
      }
    }
    /* the trigger guard, and the finger in it */
    ART.px(c, gx - 11, gy + 6, 5, 9, '#0c0c0e');
    ART.px(c, gx - 2, gy + 7, 6, 3, '#1f6b46');
  }

  return {
    /* the live sweep, for the harness only */
    debugMeter() { return JOBS._meter ? { x: JOBS._meter.x, centre: JOBS._meter.centre, band: JOBS._meter.band, live: JOBS._meter.live, round: JOBS._meter.round, rounds: JOBS._meter.rounds } : null; },
    meter,

    /* SIX SHOTS ON THE BRIGADE RANGE. Nobody pays you; it is a test. */
    async range() {
      const r = await meter({
        head: 'THE RANGE', sub: 'SIX SHOTS. FOUR HAVE TO LAND.',
        key: 'TAP TO FIRE',
        rounds: 6, band: 0.15, speed: 1.35,
        draw: drawTarget,
      });
      return { hits: r.hits, perfect: r.perfect, rounds: r.rounds, pass: r.hits >= 4 };
    },

    /* three pints. Money, and a barman who will answer one more thing. */
    async pour() {
      const r = await meter({
        head: 'WORK THE TAPS',
        sub: 'THREE GLASSES. STOP AT THE LINE.',
        key: 'TAP TO STOP THE POUR',
        rounds: 3, band: 0.2, speed: 0.85,
        draw: drawGlass,
      });
      const pay = r.hits * 14 + r.perfect * 6;
      G.chips += pay;
      return { pay, hits: r.hits, perfect: r.perfect, rounds: r.rounds };
    },

    /* three rats out of a launderer's drums. He pays in what he found. */
    async rats() {
      const r = await meter({
        head: 'CLEAR THE DRUMS',
        sub: 'THREE RATS. LID ON THE OPEN DRUM.',
        key: 'TAP TO DROP THE LID',
        rounds: 3, band: 0.16, speed: 1.55,
        draw: drawRats,
      });
      const pay = r.hits * 6 + r.perfect * 4;
      G.chips += pay;
      return { pay, hits: r.hits, perfect: r.perfect, rounds: r.rounds };
    },

    /* three pins. Nothing to spend, everything to open. */
    async lock() {
      const r = await meter({
        head: 'PICK THE LOCK',
        sub: 'THREE PINS. ON THE SHEAR LINE.',
        key: 'TAP TO SET THE PIN',
        rounds: 3, band: 0.17, speed: 1.05,
        draw: drawLock,
      });
      return { hits: r.hits, perfect: r.perfect, rounds: r.rounds, open: r.hits >= 3 };
    },

    /* three clean lifts off what you brought back to the station */
    async prints() {
      const r = await meter({
        head: 'DUST IT FOR PRINTS',
        sub: 'THREE LIFTS. NOT TOO HARD.',
        key: 'TAP AT THE RIGHT WEIGHT',
        rounds: 3, band: 0.2, speed: 0.95,
        draw: drawPrints,
      });
      return { hits: r.hits, perfect: r.perfect, rounds: r.rounds, clean: r.hits >= 3 };
    },

    /* the pavement. Nobody pays you for this. You do it anyway. */
    async scoop() {
      const r = await meter({
        head: 'THE PAVEMENT',
        sub: 'THREE PASSES. SCOOP OVER IT.',
        key: 'TAP TO SCOOP',
        rounds: 3, band: 0.2, speed: 1.1,
        draw: drawScoop,
      });
      return { hits: r.hits, perfect: r.perfect, rounds: r.rounds, clean: r.hits >= 3 };
    },

    /* three cups, one ball, and a frog who does this for a living */
    async cups(hard) {
      const r = await meter({
        head: 'THE THREE CUPS',
        sub: 'FOLLOW THE BALL. CALL THE CUP.',
        key: 'TAP TO CALL IT',
        rounds: 3, band: hard ? 0.12 : 0.17, speed: hard ? 1.9 : 1.5,
        draw: drawCups,
      });
      return { hits: r.hits, perfect: r.perfect, rounds: r.rounds, won: r.hits >= 2 };
    },

    /* three eggs, for a small frog who is going to be late */
    /* ============================================================
       BREAKFAST IS NOT A TRADE.

       This ran on the same numbers as picking a lock -- three rounds,
       a band a fifth of the sweep wide, three quarters of a sweep a
       second -- because it was built out of the same widget. But the
       house is where the game teaches you to tap something, on the one
       morning it is going to spend the rest of itself taking away from
       you. A skill check there is a skill check in the wrong place.

       So: TWO eggs instead of three, a band nearly half the sweep
       wide, two thirds of the speed, and it cannot be failed -- a miss
       is an egg with a brown edge on it, which is still breakfast.
       ============================================================ */
    async breakfast() {
      const r = await meter({
        head: 'BREAKFAST',
        sub: 'TWO EGGS. TAP WHEN THE WHITE SETS.',
        key: 'TAP TO PLATE IT',
        rounds: 2, band: 0.46, speed: 0.46, kind: 'home',
        draw: drawPan,
      });
      /* fed either way: nobody in this house goes to school hungry */
      return { hits: r.hits, perfect: r.perfect, rounds: r.rounds, fed: true };
    },

    /* a tray of donuts. Money, a heart back, and the cook talks. */
    async donuts() {
      const r = await meter({
        head: 'MAKE A BATCH',
        sub: 'THREE DONUTS. STOP IN THE HEAT.',
        key: 'TAP WHEN THE OIL IS RIGHT',
        rounds: 3, band: 0.18, speed: 1.35,
        draw: drawFryer,
      });
      const pay = r.hits * 10 + r.perfect * 5;
      G.chips += pay;
      return { pay, hits: r.hits, perfect: r.perfect, rounds: r.rounds };
    },
  };
})();
