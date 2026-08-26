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
  function meter(o) {
    return new Promise(resolve => {
      const rounds = o.rounds || 3;
      const root = CINE.pickRoot ? CINE.pickRoot() : CINE.stage();
      root.className = 'job-on';
      root.innerHTML = '';

      const W = 132, H = 84;
      const K = U.clamp(Math.floor(Math.min(window.innerWidth * 0.8 / W,
        window.innerHeight * 0.55 / H)), 2, 6);

      const wrap = U.el('div', 'job-card');
      const head = U.el('div', 'job-head');
      head.appendChild(PIXFONT.render(o.head, { scale: 3, color: PIX.PAL.W, shadow: PIX.PAL.K }));
      head.appendChild(PIXFONT.render(o.sub, { scale: 1, color: PIX.PAL.q, shadow: null }));
      wrap.appendChild(head);

      const cv = document.createElement('canvas');
      cv.width = W * K; cv.height = H * K;
      cv.className = 'pix job-cv';
      wrap.appendChild(cv);
      const c = cv.getContext('2d');
      c.imageSmoothingEnabled = false;
      c.scale(K, K);

      const foot = U.el('div', 'job-foot');
      const tally = U.el('div', 'job-tally');
      foot.appendChild(tally);
      foot.appendChild(PIXFONT.render(o.key || 'TAP TO STOP IT', { scale: 2, color: PIX.PAL.G, shadow: null }));
      wrap.appendChild(foot);
      root.appendChild(wrap);
      requestAnimationFrame(() => wrap.classList.add('in'));

      let round = 0, hits = 0, perfect = 0;
      let x = 0, dir = 1, live = true, flash = 0, done = false;
      const band = o.band || 0.22;              // how wide the sweet spot is
      const speed = o.speed || 1.15;            // sweeps per second
      /* the target wanders a little each round so it cannot be learned */
      let centre = 0.5;

      const rng = G.rng || Math.random;
      const newRound = () => {
        centre = 0.3 + rng() * 0.4;
        x = 0; dir = 1; live = true;
      };
      newRound();

      const drawTally = () => {
        tally.innerHTML = '';
        for (let i = 0; i < rounds; i++) {
          const pip = U.el('i', 'job-pip' + (i < round ? (i < hits ? ' hit' : ' miss') : ''));
          tally.appendChild(pip);
        }
      };
      drawTally();

      let last = performance.now();
      const step = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (live) {
          x += dir * speed * dt;
          if (x > 1) { x = 1; dir = -1; }
          if (x < 0) { x = 0; dir = 1; }
        }
        if (flash > 0) flash = Math.max(0, flash - dt * 3);
        o.draw(c, W, H, { x, centre, band, round, hits, flash, live });
        if (!done) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);

      const finish = () => {
        done = true;
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
        live = false;
        const off = Math.abs(x - centre);
        const good = off <= band / 2;
        const dead = off <= band / 6;
        if (good) { hits++; if (dead) perfect++; SFX.jackpot ? SFX.chak() : null; }
        else SFX.backfire && SFX.backfire();
        flash = 1;
        round++;
        drawTally();
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
     THE TAPS. A glass, a tap, and a line you are aiming for.
     --------------------------------------------------------- */
  function drawGlass(c, W, H, s) {
    const P = PIX.PAL;
    ART.px(c, 0, 0, W, H, '#141b16');
    ART.dither(c, 0, 0, W, H, 'rgba(0,0,0,.3)', 0.1, 11);
    /* the bar top */
    ART.px(c, 0, H - 12, W, 12, '#4d301a');
    ART.px(c, 0, H - 12, W, 2, '#77603f');
    /* the tap */
    ART.px(c, 58, 6, 8, 22, P.K);
    ART.px(c, 59, 7, 6, 20, '#8d9298');
    ART.px(c, 60, 8, 2, 18, '#c9d2d8');
    ART.px(c, 62, 26, 4, 8, P.K);
    ART.px(c, 63, 27, 2, 7, '#5a636c');
    /* the glass, and how full it is */
    const gx = 52, gy = 34, gw = 24, gh = 38;
    ART.px(c, gx - 1, gy - 1, gw + 2, gh + 2, P.K);
    ART.px(c, gx, gy, gw, gh, 'rgba(180,220,235,.10)');
    const fill = Math.round(gh * s.x);
    ART.px(c, gx, gy + gh - fill, gw, fill, '#c98a1a');
    ART.px(c, gx, gy + gh - fill, gw, 2, '#e0c23a');
    /* the head on it */
    if (fill > 4) {
      ART.px(c, gx, gy + gh - fill - 3, gw, 3, '#f2ead2');
      ART.px(c, gx + 2, gy + gh - fill - 4, gw - 6, 2, '#fffaf0');
    }
    /* THE LINE you are pouring to */
    const ly = gy + gh - Math.round(gh * s.centre);
    const half = Math.round(gh * s.band / 2);
    ART.px(c, gx - 6, ly - half, gw + 12, half * 2, 'rgba(111,247,216,.14)');
    ART.px(c, gx - 6, ly, gw + 12, 1, '#6ff7d8');
    ART.px(c, gx - 8, ly - 1, 3, 3, '#6ff7d8');
    ART.px(c, gx + gw + 5, ly - 1, 3, 3, '#6ff7d8');
    /* the pour, while it is running */
    if (s.live) {
      for (let y = 34; y < gy + gh - fill; y += 3) {
        ART.px(c, 63, y, 2, 2, 'rgba(230,200,120,.7)');
      }
    }
    if (s.flash > 0) {
      ART.px(c, 0, 0, W, H, 'rgba(255,240,200,' + (s.flash * 0.2).toFixed(3) + ')');
    }
    /* the glasses already done, lined up on the bar */
    for (let i = 0; i < s.hits; i++) {
      ART.px(c, 8 + i * 12, H - 26, 9, 14, P.K);
      ART.px(c, 9 + i * 12, H - 25, 7, 12, '#c98a1a');
      ART.px(c, 9 + i * 12, H - 25, 7, 3, '#f2ead2');
    }
  }

  /* ---------------------------------------------------------
     THE FRYER. A tray, a dial, and the moment the oil is right.
     --------------------------------------------------------- */
  function drawFryer(c, W, H, s) {
    const P = PIX.PAL;
    ART.px(c, 0, 0, W, H, '#181414');
    ART.dither(c, 0, 0, W, H, 'rgba(0,0,0,.3)', 0.1, 13);
    /* the fryer, with the oil moving in it */
    ART.px(c, 22, 30, 88, 34, P.K);
    ART.px(c, 24, 32, 84, 30, '#6e4a1c');
    for (let i = 0; i < 84; i += 4) {
      const h = 2 + ((i * 7 + Math.round(s.x * 40)) % 5);
      ART.px(c, 24 + i, 34, 3, h, '#8f6224');
    }
    ART.px(c, 24, 32, 84, 2, '#a8762c');
    /* the donuts in the basket */
    for (let i = 0; i < 3; i++) {
      const dx = 40 + i * 24, dy = 44 + (i === s.round % 3 ? Math.round(Math.sin(s.x * 6) * 2) : 0);
      PIX.disc(c, dx, dy, 9, P.K);
      PIX.disc(c, dx, dy, 8, i < s.hits ? '#e0a86a' : '#c98a4a');
      PIX.disc(c, dx, dy, 3, '#3a2a18');
      if (i < s.hits) { PIX.disc(c, dx, dy - 1, 7, '#e56aa8'); PIX.disc(c, dx, dy, 3, '#3a2a18'); }
    }
    /* THE DIAL: the needle sweeps, the band is the right heat */
    const bx = 14, by = 12, bw = 104;
    ART.px(c, bx - 1, by - 1, bw + 2, 10, P.K);
    ART.px(c, bx, by, bw, 8, '#22282e');
    for (let i = 0; i < bw; i += 6) ART.px(c, bx + i, by + 6, 1, 2, '#3e474e');
    const cw = Math.round(bw * s.band), cx = bx + Math.round(bw * s.centre);
    ART.px(c, cx - (cw >> 1), by, cw, 8, 'rgba(111,247,216,.22)');
    ART.px(c, cx - 1, by, 2, 8, '#6ff7d8');
    const nx = bx + Math.round(bw * s.x);
    ART.px(c, nx - 1, by - 3, 3, 14, P.K);
    ART.px(c, nx, by - 2, 1, 12, '#ff6a5e');
    if (s.flash > 0) ART.px(c, 0, 0, W, H, 'rgba(255,200,120,' + (s.flash * 0.22).toFixed(3) + ')');
    /* the steam */
    for (let i = 0; i < 6; i++) {
      const sy = 28 - i * 3, sx = 60 + Math.round(Math.sin(s.x * 4 + i) * (2 + i));
      ART.px(c, sx, sy, 1, 1, 'rgba(220,215,205,' + (0.16 - i * 0.02) + ')');
    }
  }

  /* ---------------------------------------------------------
     THE DRUMS. A rat runs the pipe over the washers. You have one
     lid and you drop it when he is over the open drum. He is fast,
     he is fat, and there are three of him.
     --------------------------------------------------------- */
  function drawRats(c, W, H, s) {
    const P = PIX.PAL;
    /* the wash-house: tile, damp, and a light that does not reach the floor */
    ART.px(c, 0, 0, W, H, '#151a1e');
    ART.dither(c, 0, 0, W, H, 'rgba(0,0,0,.32)', 0.1, 17);
    for (let y = 4; y < 46; y += 7) ART.px(c, 0, y, W, 1, 'rgba(240,235,220,.045)');
    for (let x = 6; x < W; x += 11) ART.px(c, x, 0, 1, 46, 'rgba(240,235,220,.035)');
    ART.px(c, 0, H - 20, W, 20, '#1b2226');
    ART.px(c, 0, H - 20, W, 1, 'rgba(240,235,220,.07)');
    /* standing water, because it is always standing */
    ART.px(c, 0, H - 6, W, 6, 'rgba(90,150,150,.10)');
    for (let x = 3; x < W; x += 13) ART.px(c, x, H - 5, 6, 1, 'rgba(160,220,220,.10)');

    /* THE WASHERS. Three of them, and the middle one is open. */
    const DR = [16, 58, 100];
    DR.forEach((dx, i) => {
      ART.px(c, dx - 13, H - 46, 26, 28, P.K);
      ART.px(c, dx - 12, H - 45, 24, 26, '#3a4248');
      ART.px(c, dx - 12, H - 45, 24, 2, '#525d64');
      PIX.disc(c, dx, H - 32, 9, P.K);
      PIX.disc(c, dx, H - 32, 8, i === 1 ? '#0c0f12' : '#26343a');
      if (i !== 1) PIX.disc(c, dx - 2, H - 34, 3, 'rgba(200,230,235,.16)');
      ART.px(c, dx - 10, H - 19, 20, 3, P.K);
    });

    /* THE OPEN DRUM slides to where the lid is going to come down */
    const tx = 8 + Math.round((W - 16) * s.centre);
    const half = Math.max(6, Math.round((W - 16) * s.band / 2));
    ART.px(c, tx - half, 46, half * 2, H - 62, 'rgba(111,247,216,.10)');
    ART.px(c, tx - half, 46, half * 2, 1, 'rgba(111,247,216,.35)');
    ART.px(c, tx - half, 46, 1, H - 62, 'rgba(111,247,216,.35)');
    ART.px(c, tx + half - 1, 46, 1, H - 62, 'rgba(111,247,216,.35)');
    /* the lid, hanging over it on a chain */
    ART.px(c, tx - 1, 2, 2, 12, '#6a7480');
    ART.px(c, tx - 11, 13, 22, 5, P.K);
    ART.px(c, tx - 10, 14, 20, 3, '#98a2ab');
    ART.px(c, tx - 10, 14, 20, 1, '#cfd8de');

    /* THE PIPE he runs along */
    const py = 44;
    ART.px(c, 0, py, W, 5, P.K);
    ART.px(c, 0, py + 1, W, 3, '#4a4038');
    ART.px(c, 0, py + 1, W, 1, '#655648');
    for (let x = 10; x < W; x += 22) { ART.px(c, x, py - 1, 3, 7, P.K); ART.px(c, x, py, 3, 5, '#5d5044'); }

    /* THE RAT. Fat, wet, and going the other way in a second.
       Authored facing right and mirrored through R/D, so there is one rat
       and not two that disagree about where his face is. */
    if (s.live || s.flash > 0) {
      const rx = 14 + Math.round((W - 28) * s.x), ry = py - 10;
      const back = s.x > 0.5 ? -1 : 1;
      const dark = '#231c2c', body = '#6b6076', lit = '#988ca2', pink = '#c4909c';
      const R = (dx, dy, w, h, col) =>
        ART.px(c, back > 0 ? rx + dx : rx - dx - w, ry + dy, w, h, col);
      const D = (dx, dy, r, col) =>
        PIX.disc(c, back > 0 ? rx + dx : rx - dx, ry + dy, r, col);
      const step = Math.round(s.x * 30) % 2;

      /* his shadow, and the tail out behind him */
      ART.px(c, rx - 12, py - 1, 26, 1, 'rgba(0,0,0,.45)');
      for (let i = 0; i < 11; i++) {
        const ty = 4 - Math.round(Math.sin(i * 0.55 + s.x * 10) * 2);
        R(-10 - i, ty, 2, 2, dark);
        if (i > 8) R(-10 - i, ty, 2, 1, pink);
      }
      /* the silhouette, one size up, so he has an edge on the dark pipe */
      D(-4, 0, 6, dark); D(2, 1, 5, dark); D(8, 1, 4, dark); D(13, 3, 4, dark);
      R(16, 4, 5, 4, dark);
      /* and the wet fur inside it */
      D(-4, 0, 5, body); D(2, 1, 4, body); D(8, 1, 3, body); D(13, 3, 3, body);
      R(17, 5, 3, 2, body);
      /* the light is over him, so the back of him catches it */
      D(-4, -2, 3, lit); D(2, -1, 3, lit); D(8, -1, 2, lit);
      /* the ear, the eye, the nose */
      R(7, -6, 5, 5, dark);
      R(8, -5, 3, 3, pink);
      R(12, 1, 3, 3, dark);
      R(12, 1, 2, 2, '#ffe07a');
      R(12, 1, 1, 1, '#fffbe6');
      R(19, 6, 2, 2, pink);
      /* whiskers */
      R(20, 3, 5, 1, 'rgba(240,235,220,.30)');
      R(20, 8, 5, 1, 'rgba(240,235,220,.22)');
      /* three feet on the pipe and one in the air */
      R(-7, 6, 3, 3 - step, dark);
      R(-1, 6, 3, 2 + step, dark);
      R(6, 6, 3, 3 - step, dark);
    }

    /* THE LID COMING DOWN, on the frame you dropped it */
    if (s.flash > 0.15) {
      const drop = Math.round((1 - s.flash) * (H - 34));
      ART.px(c, tx - 13, 15 + drop, 26, 7, P.K);
      ART.px(c, tx - 12, 16 + drop, 24, 5, '#b6c0c8');
      ART.px(c, tx - 12, 16 + drop, 24, 2, '#e2e9ee');
      for (let i = 0; i < 5; i++) {
        ART.px(c, tx - 16 - i * 2, 18 + drop - i, 2, 2, 'rgba(240,235,220,.2)');
        ART.px(c, tx + 14 + i * 2, 18 + drop - i, 2, 2, 'rgba(240,235,220,.2)');
      }
    }

    if (s.flash > 0) ART.px(c, 0, 0, W, H, 'rgba(160,255,230,' + (s.flash * 0.16).toFixed(3) + ')');

    /* the sack, with tonight's catch in it */
    ART.px(c, W - 22, H - 16, 18, 14, P.K);
    ART.px(c, W - 21, H - 15, 16, 12, '#4b4436');
    ART.px(c, W - 21, H - 15, 16, 2, '#665d49');
    for (let i = 0; i < s.hits; i++) ART.px(c, W - 19 + i * 5, H - 12, 3, 6, '#5b5163');
  }

  /* ---------------------------------------------------------
     THE LOCK. Three pins, a pick, and a shed on a pier with
     something in it. Miss and the pin drops back.
     --------------------------------------------------------- */
  function drawLock(c, W, H, s) {
    const P = PIX.PAL;
    ART.px(c, 0, 0, W, H, '#0e1216');
    ART.dither(c, 0, 0, W, H, 'rgba(0,0,0,.3)', 0.1, 19);
    /* the padlock, filling the frame, seen from the side */
    ART.box(c, 22, 22, 88, 54, { fill: '#4d545e', top: '#697382', bot: '#22262c', ink: P.K });
    ART.rivets(c, 26, 26, 8, 11, '#2b3037', '#8d9298');
    /* the shackle */
    for (let i = 0; i < 20; i++) {
      const a = Math.PI + (i / 19) * Math.PI;
      ART.px(c, 66 + Math.round(Math.cos(a) * 22) - 3, 22 + Math.round(Math.sin(a) * 16), 6, 6, P.K);
      ART.px(c, 66 + Math.round(Math.cos(a) * 22) - 2, 23 + Math.round(Math.sin(a) * 16), 4, 4, '#8d9298');
    }
    /* the keyway, and the three pins in it */
    ART.px(c, 34, 34, 64, 32, P.K);
    ART.px(c, 36, 36, 60, 28, '#171b20');
    for (let i = 0; i < 3; i++) {
      const px0 = 44 + i * 18;
      const done2 = i < s.hits;
      const live = i === s.round;
      /* the pin, and how high it is sitting */
      const h = done2 ? 20 : (live ? Math.round(20 * s.x) : 4);
      ART.px(c, px0, 60 - h, 8, h + 4, done2 ? '#e0a63c' : '#6a7480');
      ART.px(c, px0, 60 - h, 8, 2, done2 ? '#ffd75e' : '#98a2ab');
      ART.px(c, px0 - 1, 59 - h, 10, 1, P.K);
      /* THE SHEAR LINE this pin has to stop on */
      if (live) {
        const ly = 60 - Math.round(20 * s.centre);
        const half = Math.max(2, Math.round(20 * s.band / 2));
        ART.px(c, px0 - 4, ly - half, 16, half * 2, 'rgba(111,247,216,.2)');
        ART.px(c, px0 - 4, ly, 16, 1, '#6ff7d8');
      }
    }
    /* the pick, going in */
    ART.px(c, 96, 58, 30, 2, '#c9d2d8');
    ART.px(c, 118, 56, 12, 6, '#4a3f2e');
    if (s.flash > 0) ART.px(c, 0, 0, W, H, 'rgba(200,240,255,' + (s.flash * 0.18).toFixed(3) + ')');
    /* the pins already set, as a row of gold */
    for (let i = 0; i < s.hits; i++) ART.px(c, 8 + i * 5, H - 8, 3, 4, '#ffd75e');
  }

  /* ---------------------------------------------------------
     THE PRINTS. A brush over a lift card: too light and you get
     nothing, too hard and you wipe the ridge off.
     --------------------------------------------------------- */
  function drawPrints(c, W, H, s) {
    const P = PIX.PAL;
    ART.px(c, 0, 0, W, H, '#191d24');
    ART.dither(c, 0, 0, W, H, 'rgba(0,0,0,.28)', 0.1, 13);
    /* the card on the bench */
    ART.box(c, 18, 26, 96, 44, { fill: '#ded2b4', top: '#f0e6c8', bot: '#a99a78', ink: P.K });
    ART.grain(c, 21, 29, 90, 38, '#d2c5a4', '#e8dcbc', 17);
    /* the print coming up, ring by ring, as you get them */
    const cx = 66, cy = 48;
    for (let r = 2 + s.hits * 4; r >= 2; r -= 4) {
      PIX.disc(c, cx, cy, r, r % 8 === 2 ? '#8d8672' : '#5a5648');
    }
    if (s.hits) PIX.disc(c, cx, cy, 2, '#2b2436');
    /* THE PRESSURE BAR down the left: the band is the right weight */
    const bx = 8, by = 20, bh = 56;
    ART.px(c, bx - 1, by - 1, 8, bh + 2, P.K);
    ART.px(c, bx, by, 6, bh, '#22282e');
    const bandH = Math.max(4, Math.round(bh * s.band));
    const cyb = by + Math.round(bh * s.centre);
    ART.px(c, bx, cyb - (bandH >> 1), 6, bandH, 'rgba(111,247,216,.24)');
    ART.px(c, bx, cyb, 6, 1, '#6ff7d8');
    const ny = by + Math.round(bh * s.x);
    ART.px(c, bx - 3, ny - 1, 12, 3, P.K);
    ART.px(c, bx - 2, ny, 10, 1, '#ff6a5e');
    /* the brush, riding the bar */
    ART.px(c, 118, ny - 8, 8, 18, '#4a3f2e');
    ART.px(c, 119, ny - 7, 6, 6, '#6e4a30');
    for (let i = 0; i < 7; i++) ART.px(c, 112 + i, ny + 2 + (i % 2), 2, 6, '#2b2436');
    if (s.flash > 0) ART.px(c, 0, 0, W, H, 'rgba(255,240,200,' + (s.flash * 0.2).toFixed(3) + ')');
  }

  /* ---------------------------------------------------------
     THE PAVEMENT. A dog has been here. The scoop is on a stick and
     the bag is in your other hand and the whole city is watching.
     --------------------------------------------------------- */
  function drawScoop(c, W, H, s) {
    const P = PIX.PAL;
    /* the pavement, close up, wet */
    ART.px(c, 0, 0, W, H, '#2b2e33');
    for (let ry = 0; ry < H; ry += 7) {
      const off = ((ry / 7) % 2) ? 6 : 0;
      for (let rx = -off; rx < W; rx += 12) {
        ART.px(c, rx, ry, 11, 6, (rx + ry) % 5 ? '#31353b' : '#2a2d33');
        ART.px(c, rx, ry, 11, 1, 'rgba(255,255,255,.05)');
      }
    }
    ART.dither(c, 0, 0, W, H, 'rgba(90,150,160,.08)', 0.12, 17);
    /* WHAT THE DOG LEFT, in the middle, drawn with as much dignity as
       the situation allows: three coils and a shine on them */
    const tx = 8 + Math.round((W - 16) * s.centre);
    if (s.hits < 3) {
      for (let i = 2; i >= s.hits; i--) {
        const cy = H - 22 + i * 4;
        const r = 9 - i * 2;
        PIX.disc(c, tx, cy, r + 1, '#2a1c10');
        PIX.disc(c, tx, cy, r, '#4a3118');
        PIX.disc(c, tx - 2, cy - 2, Math.max(1, r - 4), '#63431f');
      }
      /* the flies, because of course */
      for (let i = 0; i < 3; i++) {
        const a = s.x * 6 + i * 2.1;
        ART.px(c, tx + Math.round(Math.cos(a) * 13), H - 28 + Math.round(Math.sin(a * 1.3) * 6),
          1, 1, '#12101d');
      }
    } else {
      /* a clean flag of pavement where it used to be */
      ART.px(c, tx - 12, H - 18, 25, 12, '#3a4046');
      ART.px(c, tx - 12, H - 18, 25, 2, '#4d545c');
    }
    /* THE SCOOP, swinging, and the band that is over the thing itself */
    const half = Math.max(5, Math.round((W - 16) * s.band / 2));
    ART.px(c, tx - half, H - 34, half * 2, 30, 'rgba(111,247,216,.10)');
    ART.px(c, tx - half, H - 34, 1, 30, 'rgba(111,247,216,.35)');
    ART.px(c, tx + half - 1, H - 34, 1, 30, 'rgba(111,247,216,.35)');
    const sx = 8 + Math.round((W - 16) * s.x);
    ART.px(c, sx - 1, 4, 3, H - 40, '#6e4a30');           // the handle
    ART.px(c, sx - 1, 4, 1, H - 40, '#8a5f3d');
    ART.px(c, sx - 9, H - 38, 19, 5, P.K);                // the pan
    ART.px(c, sx - 8, H - 37, 17, 3, '#9aa3b8');
    ART.px(c, sx - 8, H - 34, 17, 2, '#646d84');
    /* the bag in your other hand, filling up */
    ART.px(c, W - 22, H - 26, 16, 24, '#20242a');
    ART.px(c, W - 22, H - 26, 16, 2, '#333944');
    for (let i = 0; i < s.hits; i++) ART.px(c, W - 19 + i * 4, H - 10, 3, 6, '#4a3118');
    if (s.flash > 0) ART.px(c, 0, 0, W, H, 'rgba(200,255,220,' + (s.flash * 0.14).toFixed(3) + ')');
  }

  /* ---------------------------------------------------------
     THE CUPS. Three of them, one ball, and a frog who does this
     for a living. The band is the cup it is under; the marker is
     your eye, and his hands are faster than it.
     --------------------------------------------------------- */
  function drawCups(c, W, H, s) {
    const P = PIX.PAL;
    ART.px(c, 0, 0, W, H, '#181a20');
    ART.dither(c, 0, 0, W, H, 'rgba(0,0,0,.3)', 0.1, 13);
    /* the folding table, and the crowd behind it */
    for (let i = 0; i < 7; i++) {
      const bx = 6 + i * 19;
      ART.px(c, bx, 8, 11, 16, '#22262e');
      ART.px(c, bx + 2, 4, 7, 6, '#2f4436');
      ART.px(c, bx + 1, 2, 9, 3, '#12101d');
    }
    ART.px(c, 0, 26, W, 4, '#12101d');
    ART.box(c, 8, 30, W - 16, 16, { fill: '#4a3f2e', top: '#61533b', bot: '#241d14', ink: P.K });
    ART.px(c, 8, 46, W - 16, H - 46, '#1c1f24');
    /* THE THREE CUPS. The one over the ball is the band. */
    for (let i = 0; i < 3; i++) {
      const cx2 = 26 + i * 40;
      const lifted = s.flash > 0.3 && Math.abs((s.centre * W) - cx2) < 20;
      const cy = 30 - (lifted ? 12 : 0);
      /* the ball, if this cup is up and it was under it */
      if (lifted) {
        PIX.disc(c, cx2 + 8, 26, 4, P.K);
        PIX.disc(c, cx2 + 8, 26, 3, '#f4efe0');
      }
      ART.px(c, cx2, cy - 16, 17, 17, P.K);
      ART.px(c, cx2 + 1, cy - 15, 15, 15, '#b8232f');
      ART.px(c, cx2 + 1, cy - 15, 15, 3, '#d94a52');
      ART.px(c, cx2 + 1, cy - 4, 15, 3, '#8c1a24');
      ART.px(c, cx2 - 1, cy - 1, 19, 2, P.K);
      ART.px(c, cx2, cy - 1, 17, 1, '#8c1a24');
    }
    /* his hands, moving, which is the whole trick */
    const hx = 12 + Math.round((W - 24) * ((s.x * 1.7) % 1));
    ART.px(c, hx - 7, 14, 15, 9, '#2f5a3a');
    ART.px(c, hx - 6, 15, 13, 6, '#4f8a55');
    ART.px(c, hx - 6, 15, 13, 2, '#6fae70');
    /* YOUR EYE: the marker you are stopping */
    const ex = 8 + Math.round((W - 16) * s.x);
    ART.px(c, ex - 1, H - 20, 3, 14, '#ffd75e');
    ART.px(c, ex - 5, H - 8, 11, 3, '#ffd75e');
    ART.px(c, ex - 3, H - 24, 7, 4, '#12101d');
    ART.px(c, ex - 2, H - 23, 5, 2, '#ffe7a8');
    /* the band: where the ball actually is */
    const half = Math.max(6, Math.round((W - 16) * s.band / 2));
    const bx2 = 8 + Math.round((W - 16) * s.centre);
    ART.px(c, bx2 - half, H - 6, half * 2, 3, 'rgba(111,247,216,.22)');
    /* the pot, and the tally */
    for (let i = 0; i < s.hits; i++) ART.px(c, W - 14 - i * 6, 34, 4, 4, '#ffd75e');
    if (s.flash > 0) ART.px(c, 0, 0, W, H, 'rgba(255,240,200,' + (s.flash * 0.16).toFixed(3) + ')');
  }

  /* THE RANGE. A paper target on a rail, and a sight that swings across
     it: six shots, and the band is tight because a police range is
     supposed to be. Drawn as the target you are actually shooting at
     rather than a bar, because the whole point is that it is a target. */
  function drawTarget(c, W, H, st) {
    const t = st.x, band = st.band, live = st.live, centre = st.centre;
    /* the range: a lane, a backstop, a light overhead */
    ART.px(c, 0, 0, W, H, '#242028');
    ART.px(c, 0, 0, W, 8, '#1a171e');
    ART.px(c, 0, H - 14, W, 14, '#38322c');
    ART.px(c, 0, H - 14, W, 1, '#4e463c');
    for (let i = 4; i < W; i += 18) ART.px(c, i, H - 12, 9, 2, 'rgba(255,240,210,.07)');
    /* the sandbags at the back */
    for (let i = 0; i < W; i += 14) {
      ART.px(c, i, 14, 13, 9, '#5f5744');
      ART.px(c, i, 14, 13, 2, '#736a53');
    }
    /* THE TARGET, and the rings on it */
    const tx = Math.round(W * 0.5), ty = 44;
    ART.px(c, tx - 2, ty + 14, 4, H - 14 - ty - 14, '#4a3f2e');
    ART.px(c, tx - 22, ty - 20, 44, 40, '#e9e2cc');
    ART.px(c, tx - 22, ty - 20, 44, 1, '#ffffff');
    ART.px(c, tx - 22, ty + 19, 44, 1, '#b8b09a');
    [16, 12, 8, 4].forEach((r, i) => {
      for (let a = 0; a < 60; a++) {
        const th = (a / 60) * Math.PI * 2;
        ART.px(c, Math.round(tx + Math.cos(th) * r), Math.round(ty + Math.sin(th) * r * 0.9),
          1, 1, i % 2 ? '#8a8272' : '#2a2620');
      }
    });
    PIX.disc(c, tx, ty, 3, '#b8384a');
    /* THE BAND you have to be inside, painted on the target where the
       meter actually put it — the meter rolls a new centre every round
       and drawing it at the middle would be a lie. */
    const bw = Math.max(3, Math.round(44 * band));
    ART.px(c, tx - 22 + Math.round(44 * centre - bw / 2), ty - 20, bw, 40,
      'rgba(111,247,216,.16)');
    ART.px(c, tx - 22 + Math.round(44 * centre), ty - 20, 1, 40, 'rgba(111,247,216,.4)');
    /* AND THE SIGHT, swinging across it */
    const sx = Math.round(tx - 22 + 44 * t);
    ART.px(c, sx, ty - 24, 1, 48, live ? '#ffd75e' : '#6a6252');
    ART.px(c, sx - 4, ty, 9, 1, live ? '#ffd75e' : '#6a6252');
    ART.px(c, sx - 1, ty - 1, 3, 3, live ? '#ff6a5e' : '#6a6252');
  }

  return {
    meter,

    /* SIX SHOTS ON THE BRIGADE RANGE. Nobody pays you; it is a test. */
    async range() {
      const r = await meter({
        head: 'THE RANGE', sub: 'SIX SHOTS. FOUR OF THEM HAVE TO LAND.',
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
        sub: 'THREE RATS. DROP THE LID ON THE OPEN ONE.',
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
        sub: 'THREE PINS. SET EACH ONE ON THE SHEAR LINE.',
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
        sub: 'THREE LIFTS. NOT TOO HARD OR THE RIDGE GOES.',
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
        sub: 'THREE PASSES. GET THE SCOOP OVER IT.',
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
        sub: 'FOLLOW THE BALL. STOP ON THE CUP IT IS UNDER.',
        key: 'TAP TO CALL IT',
        rounds: 3, band: hard ? 0.12 : 0.17, speed: hard ? 1.9 : 1.5,
        draw: drawCups,
      });
      return { hits: r.hits, perfect: r.perfect, rounds: r.rounds, won: r.hits >= 2 };
    },

    /* a tray of donuts. Money, a heart back, and the cook talks. */
    async donuts() {
      const r = await meter({
        head: 'MAKE A BATCH',
        sub: 'THREE DONUTS. STOP THE NEEDLE IN THE HEAT.',
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
