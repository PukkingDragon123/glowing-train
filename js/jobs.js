/* ============================================================
   THE SIDE JOBS.

   A detective on this salary works the room. Two little jobs you
   can do anywhere in the city that will have you:

     THE TAPS     pull three pints without wearing them
     THE FRYER    turn out a tray of donuts
     THE DRUMS    put a lid on three rats

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

  return {
    meter,

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
