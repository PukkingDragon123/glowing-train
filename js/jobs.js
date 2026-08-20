/* ============================================================
   THE SIDE JOBS.

   A detective on this salary works the room. Two little jobs you
   can do anywhere in the city that will have you:

     THE TAPS     pull three pints without wearing them
     THE FRYER    turn out a tray of donuts

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
