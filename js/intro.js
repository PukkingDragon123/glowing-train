/* ============================================================
   SHELL & DEBT — intro.js
   HOW YOU GOT HERE.

   The game used to open on a slideshow: eight painted panels with
   a caption under each, and then you were a detective in Paris
   with no explanation of why a frog with an American accent is
   working a Paris murder.

   This is the explanation, and you play it.

     THE HOUSE      you come home. The door is open.
     THE ROOM       three places to look. One of them has the
                    only thing the killer left behind in it.
     THE DEPARTURE  a security line, and a pistol you are not
                    allowed to take. What you do about that is
                    the first real decision in the game.
     THE AIRCRAFT   nine hours over the water.
     THE DESCENT    Paris out of the window at first light.

   Then the Brigade will not let a foreign cop work a case
   without a card, so:

     THE PAPER      four questions, answered out loud, and the
                    captain reads the answers back to you.
     THE RANGE      six shots. Four of them have to land.

   EVERY BEAT IS INTERACTIVE OR IT IS NOT IN HERE. If a panel
   would only be looked at, it is a panel in the reel that
   already exists. What is in this file is the things you do.

   All of it drawn, like everything else: no images, at boot.
   ============================================================ */

const INTRO = (() => {

  const px = (c, x, y, w, h, col) => ART.px(c, x, y, w, h, col);
  const P = () => PIX.PAL;
  /* two colours and a distance between them, as something canvas will take */
  const mix = (a, b, t) => (typeof DAY !== 'undefined' && DAY.mix)
    ? DAY.rgb(DAY.mix(a, b, t)) : a;

  /* the card these scenes are painted on: wide, cinematic, and the
     same shape every time so the cuts do not jump */
  const CW = 220, CH = 124;

  function card() {
    const o = ART.cv(CW, CH);
    return o;
  }

  /* how big the card can be drawn on this screen, as a whole number */
  function scale() {
    return U.clamp(Math.floor(Math.min(window.innerWidth * 0.94 / CW,
      window.innerHeight * 0.78 / CH)), 2, 8);
  }

  /* ------------------------------------------------------------
     THE WAY OUT.

     Thirteen beats is a lot to sit through twice, and a beat with
     hot spots on it cannot be got past by mashing a key, so the
     opening carries a real skip: one press and the whole thing —
     reel and application both — folds up and hands you the badge.
     `skipping` is the flag; SKIP is what a beat throws once it is
     set, and `play` catches it in the finally it already had.
     ------------------------------------------------------------ */
  let skipping = false;
  const SKIP = { skip: true };
  function skip() { skipping = true; }
  function skipButton(onSkip) {
    const b = U.el('button', 'intro-skip');
    b.appendChild(UI.txt('SKIP', { scale: 1, color: PIX.PAL.q, shadow: PIX.PAL.K }));
    b.onclick = (ev) => { ev.stopPropagation(); skipping = true; onSkip(); };
    return b;
  }

  /* ------------------------------------------------------------
     SHOW ONE CARD, and wait for a tap on it.

     `hot` is a list of { x, y, w, h, id } — the places on this
     card you can actually touch. With no hot spots it is a plain
     beat and any tap moves on; with them, the tap resolves to the
     id you hit and nothing else does anything.
     ------------------------------------------------------------ */
  function rawShow(paint, opts) {
    opts = opts || {};
    return new Promise(res => {
      const root = CINE.stage();
      root.className = 'intro-on';
      root.innerHTML = '';
      const K = scale();
      const wrap = U.el('div', 'intro-card');

      const o = card();
      paint(o.c);
      const cv = SPR.clone(o.cv, K);
      cv.className = 'pix intro-frame';
      wrap.appendChild(cv);

      if (opts.head) {
        const h = U.el('div', 'intro-head');
        h.appendChild(UI.txt(opts.head, { scale: 2, color: PIX.PAL.g, shadow: null }));
        wrap.insertBefore(h, cv);
      }
      if (opts.line) {
        const l = U.el('div', 'intro-line');
        l.appendChild(UI.wrap(opts.line, 46,
          { scale: 2, color: PIX.PAL.W, outline: PIX.PAL.K }));
        wrap.appendChild(l);
      }
      if (opts.foot) {
        const f = U.el('div', 'intro-foot');
        f.appendChild(UI.txt(opts.foot, { scale: 1, color: PIX.PAL.q, shadow: null }));
        wrap.appendChild(f);
      }

      /* the hot spots, as buttons laid over the card at card scale */
      const hot = opts.hot || [];
      if (hot.length) {
        const layer = U.el('div', 'intro-hot');
        layer.style.width = (CW * K) + 'px';
        layer.style.height = (CH * K) + 'px';
        hot.forEach(h => {
          const b = U.el('button', 'intro-spot' + (h.done ? ' done' : ''));
          b.style.left = (h.x * K) + 'px';
          b.style.top = (h.y * K) + 'px';
          b.style.width = (h.w * K) + 'px';
          b.style.height = (h.h * K) + 'px';
          if (h.label) {
            const t = U.el('span', 'intro-tag');
            t.appendChild(UI.txt(h.label, { scale: 1, color: PIX.PAL.W, shadow: PIX.PAL.K }));
            b.appendChild(t);
          }
          b.onclick = (ev) => {
            ev.stopPropagation();
            SFX.tick && SFX.tick();
            done(h.id);
          };
          layer.appendChild(b);
        });
        wrap.appendChild(layer);
      }

      root.appendChild(wrap);
      wrap.appendChild(skipButton(() => done('__skip')));
      requestAnimationFrame(() => wrap.classList.add('in'));
      if (opts.sfx !== false) SFX.tone(70 + Math.random() * 30, 0.5, 'sine', 0.08, 0, -24);

      let finished = false;
      const done = (id) => {
        if (finished) return;
        finished = true;
        window.removeEventListener('pointerdown', anywhere);
        window.removeEventListener('keydown', anywhere);
        wrap.classList.add('out');
        setTimeout(() => {
          root.innerHTML = ''; root.className = 'hidden';
          res(id);
        }, 220);
      };
      const anywhere = (ev) => {
        /* ESCAPE IS THE SKIP, not the next beat: a card with hot spots on
           it cannot be got past any other way from a keyboard. */
        if (ev && ev.key === 'Escape') { skipping = true; done('__skip'); return; }
        if (!hot.length) done(null);
      };
      setTimeout(() => {
        window.addEventListener('pointerdown', anywhere);
        window.addEventListener('keydown', anywhere);
      }, 340);
    });
  }

  /* ------------------------------------------------------------
     HOLD A CARD UP while a conversation happens over the top of
     it. `show` clears itself on a tap; this does not, so a beat
     made of several lines of dialogue keeps its set behind it.
     ------------------------------------------------------------ */
  let held = null;
  function hold(paint, opts) {
    opts = opts || {};
    const root = CINE.stage();
    root.className = 'intro-on held';
    root.innerHTML = '';
    const K = U.clamp(Math.floor(Math.min(window.innerWidth * 0.92 / CW,
      window.innerHeight * 0.62 / CH)), 2, 8);
    const wrap = U.el('div', 'intro-card held');
    const o = card();
    paint(o.c);
    const cv = SPR.clone(o.cv, K);
    cv.className = 'pix intro-frame';
    wrap.appendChild(cv);
    if (opts.head) {
      const h = U.el('div', 'intro-head');
      h.appendChild(UI.txt(opts.head, { scale: 2, color: PIX.PAL.g, shadow: null }));
      wrap.insertBefore(h, cv);
    }
    root.appendChild(wrap);
    if (opts.skip !== false) wrap.appendChild(skipButton(() => { drop(); }));
    requestAnimationFrame(() => wrap.classList.add('in'));
    held = root;
  }
  function drop() {
    if (!held) return;
    held.innerHTML = ''; held.className = 'hidden';
    held = null;
  }

  /* ============================================================
     THE PAINTINGS.
     ============================================================ */

  /* a night sky over a low American street: this is not Paris yet */
  function nightSky(c, h) {
    for (let i = 0; i < h; i++) {
      const t = i / h;
      const r = Math.round(10 + t * 26), g = Math.round(12 + t * 22), b = Math.round(28 + t * 30);
      px(c, 0, i, CW, 1, 'rgb(' + r + ',' + g + ',' + b + ')');
    }
    const rng = U.mulberry32(4021);
    for (let i = 0; i < 60; i++) {
      px(c, Math.floor(rng() * CW), Math.floor(rng() * h * 0.8), 1, 1,
        'rgba(220,230,255,' + (0.2 + rng() * 0.5).toFixed(2) + ')');
    }
    /* the moon, low and cold */
    PIX.disc(c, 176, 18, 12, 'rgba(220,232,255,.06)');
    PIX.disc(c, 176, 18, 7, '#cfd8ea');
    PIX.disc(c, 179, 16, 5, 'rgba(0,0,0,.18)');
  }

  /* THE HOUSE. A porch light on, and the front door standing open. */
  function houseCard(c, open) {
    nightSky(c, 66);
    /* the street, and the neighbours' places going off both ways */
    px(c, 0, 66, CW, CH - 66, '#1b1d24');
    const rng = U.mulberry32(9112);
    for (let i = -8; i < CW; i += 33) {
      const th = 14 + Math.floor(rng() * 8);
      const ry = 66 - th;
      for (let r = 0; r < 7; r++) {                     /* a roof, so it is a house */
        px(c, i + r * 2, ry - 7 + r, 30 - r * 4, 1, '#191b21');
      }
      px(c, i, ry, 30, th, '#20242c');
      px(c, i, ry, 30, 1, '#2b303a');
      if (rng() < 0.7) px(c, i + 6, ry + 5, 5, 6, '#3a3222');
      if (rng() < 0.5) px(c, i + 18, ry + 5, 5, 6, '#463a22');
    }
    /* a tree on the corner, all silhouette */
    px(c, 200, 40, 4, 30, '#151720');
    for (let i = 0; i < 30; i++) {
      const a = i * 2.399, r = 4 + (i % 5) * 3;
      PIX.disc(c, Math.round(202 + Math.cos(a) * r), Math.round(34 + Math.sin(a) * r * 0.7),
        4, '#171a23');
    }
    /* the house: clapboard, a pitched roof, a porch */
    const hx = 74, hy = 34, hw = 72, hh = 44;
    px(c, hx - 4, hy + 6, hw + 8, 4, '#2a2119');
    for (let i = 0; i < 12; i++) {
      px(c, hx + i * 3, hy + 6 - i, hw - i * 6, 2, i < 2 ? '#4a3b2c' : '#33291e');
    }
    px(c, hx + hw - 22, hy - 5, 7, 12, '#2a2119');      /* the chimney */
    px(c, hx + hw - 23, hy - 6, 9, 2, '#3a2f22');
    px(c, hx, hy + 10, hw, hh, '#5f5748');
    for (let ly = hy + 10; ly < hy + 10 + hh; ly += 4) {
      px(c, hx, ly, hw, 1, 'rgba(255,250,235,.07)');
      px(c, hx, ly + 3, hw, 1, 'rgba(0,0,0,.22)');
    }
    px(c, hx, hy + 10, 2, hh, 'rgba(0,0,0,.28)');
    px(c, hx + hw - 2, hy + 10, 2, hh, 'rgba(0,0,0,.28)');
    /* two windows, both dark, both with a sill */
    [[hx + 8, hy + 18], [hx + hw - 24, hy + 18]].forEach(([wx, wy]) => {
      px(c, wx - 1, wy - 1, 18, 16, '#3a3226');
      px(c, wx, wy, 16, 14, '#191c22');
      px(c, wx + 1, wy + 1, 14, 12, '#242a34');
      px(c, wx + 1, wy + 1, 14, 4, '#2d3542');
      px(c, wx + 7, wy + 1, 2, 12, '#191c22');
      px(c, wx + 1, wy + 6, 14, 1, '#191c22');
      px(c, wx - 2, wy + 13, 20, 2, '#4a4034');
    });
    /* the porch, and the light nobody turned off */
    px(c, hx - 7, hy + 39, hw + 14, 4, '#3a3226');
    px(c, hx - 7, hy + 39, hw + 14, 1, '#5a4c38');
    px(c, hx - 6, hy + 43, 3, 11, '#2a231a');
    px(c, hx + hw + 3, hy + 43, 3, 11, '#2a231a');
    px(c, hx - 7, hy + 53, hw + 14, 3, '#241d16');
    /* the porch lamp: a housing, a bulb, and a glow that falls off
       instead of one big translucent disc that reads as a smudge */
    const lx = hx + hw / 2 + 14;
    px(c, lx - 3, hy + 37, 7, 3, '#2a231a');
    px(c, lx - 2, hy + 40, 5, 5, '#ffd98a');
    px(c, lx - 1, hy + 41, 3, 3, '#fff4d0');
    px(c, lx - 3, hy + 45, 7, 2, '#2a231a');
    for (let i = 1; i <= 4; i++) {
      PIX.disc(c, lx, hy + 42, 3 + i * 3, 'rgba(255,217,138,' + (0.05 - i * 0.008).toFixed(3) + ')');
    }
    /* THE DOOR. Shut, this is a house. Open, it is a crime scene. */
    const dx = hx + hw / 2 - 7;
    px(c, dx - 1, hy + 30, 16, 24, '#2a231a');
    if (open) {
      px(c, dx, hy + 30, 14, 24, '#0a0a0c');
      px(c, dx + 10, hy + 30, 4, 24, '#3d3226');       /* the door, swung in */
      px(c, dx, hy + 30, 14, 2, 'rgba(0,0,0,.6)');
      /* the light from inside, falling out onto the boards */
      for (let i = 0; i < 10; i++) {
        px(c, dx - i, hy + 53 + i, 14 + i * 2, 1,
          'rgba(255,220,150,' + (0.11 - i * 0.010).toFixed(3) + ')');
      }
    } else {
      px(c, dx, hy + 30, 14, 24, '#4a3b2c');
      px(c, dx + 1, hy + 32, 12, 8, '#3f3125');
      px(c, dx + 1, hy + 42, 12, 10, '#3f3125');
      px(c, dx + 10, hy + 40, 2, 2, '#c9a24a');
    }
    /* the path up from the kerb, and a fence along the front */
    for (let i = 0; i < 12; i++) {
      px(c, dx + 3 - i, hy + 56 + i * 3, 8 + i * 2, 2, i % 2 ? '#33302a' : '#3a3630');
    }
    for (let i = 0; i < CW; i += 7) {
      if (i > dx - 22 && i < dx + 26) continue;
      px(c, i, 80, 2, 10, '#2a2620');
      px(c, i, 80, 2, 1, '#3a352c');
    }
    px(c, 0, 82, CW, 1, '#2f2b24');
    /* a mailbox with the flag still up */
    px(c, 152, 78, 2, 12, '#2a2620');
    px(c, 148, 72, 11, 6, '#3a3f48');
    px(c, 148, 72, 11, 1, '#4e5560');
    px(c, 158, 70, 2, 5, '#8a2a1a');
    /* the street lamp, and the pool it makes */
    px(c, 12, 30, 3, 56, '#20232a');
    px(c, 12, 30, 12, 3, '#20232a');
    px(c, 20, 32, 7, 4, '#ffd98a');
    for (let i = 0; i < 12; i++) {
      PIX.disc(c, 23, 34 + i * 5, 4 + i * 2, 'rgba(255,217,138,.022)');
    }
    /* the car on the kerb, still warm */
    px(c, 18, 92, 46, 11, '#2b3346');
    px(c, 18, 92, 46, 2, '#4a5570');
    px(c, 18, 100, 46, 3, '#1c2231');
    for (let i = 0; i < 9; i++) {                       /* a roof that curves */
      px(c, 26 + Math.round(i * 0.4), 92 - i, 27 - Math.round(i * 0.9), 1, '#2b3346');
    }
    px(c, 29, 86, 9, 5, 'rgba(160,205,230,.45)');
    px(c, 40, 86, 8, 5, 'rgba(160,205,230,.45)');
    px(c, 24, 90, 2, 3, '#4a5570');                     /* the mirror */
    px(c, 62, 94, 3, 3, '#c9a24a');                     /* a light left on */
    PIX.disc(c, 27, 103, 5, '#14121c'); PIX.disc(c, 53, 103, 5, '#14121c');
    PIX.disc(c, 27, 103, 2, '#3a3d48'); PIX.disc(c, 53, 103, 2, '#3a3d48');
    /* the road */
    px(c, 0, CH - 10, CW, 10, '#15171d');
    px(c, 0, CH - 10, CW, 1, '#22252d');
    for (let i = 6; i < CW; i += 22) px(c, i, CH - 6, 11, 2, 'rgba(230,225,205,.30)');
  }

  /* THE ROOM. Three places to look, and one of them has it. */
  function roomCard(c, found) {
    /* wallpaper, and a picture rail */
    px(c, 0, 0, CW, CH, '#2a2620');
    for (let i = 0; i < CW; i += 8) {
      px(c, i, 0, 3, 74, 'rgba(255,240,210,.035)');
      px(c, i + 4, 0, 1, 74, 'rgba(0,0,0,.10)');
      px(c, i + 1, 18, 1, 1, 'rgba(255,220,170,.07)');
      px(c, i + 1, 46, 1, 1, 'rgba(255,220,170,.07)');
    }
    px(c, 0, 12, CW, 2, '#3a3226');
    px(c, 0, 74, CW, 6, '#3a3226');                     /* the skirting */
    px(c, 0, 74, CW, 1, '#4e422f');
    px(c, 0, 80, CW, CH - 80, '#241f1a');
    for (let i = 0; i < CW; i += 13) px(c, i, 80, 1, CH - 80, 'rgba(0,0,0,.20)');
    /* THE RUG, which has to lie down: a rectangle painted between two
       horizontals reads as a panel standing against the wall, so it is
       drawn as a trapezoid, narrow at the back and wide at our feet. */
    const rt = 88, rb = 118;
    for (let y = rt; y <= rb; y++) {
      const t = (y - rt) / (rb - rt);
      const half = Math.round(56 + t * 46), edge = t < 0.10 || t > 0.90;
      px(c, 110 - half, y, half * 2, 1, edge ? '#7d4046' : '#5a2a2e');
      if (!edge) px(c, 110 - half + 4, y, half * 2 - 8, 1, '#6e3438');
    }
    for (let i = 0; i < 13; i++) {                      /* the medallion, closed */
      const y = 94 + i * 2, t = (y - rt) / (rb - rt), half = Math.round(56 + t * 46);
      const arm = (6 - Math.abs(6 - i)) * 3;      /* widest in the middle */
      px(c, 110 - 6 - arm, y, 4, 2, '#8a4a4e');
      px(c, 110 + 3 + arm, y, 4, 2, '#8a4a4e');
      px(c, 110 - half + 6, y, 3, 1, '#8a4a4e');
      px(c, 110 + half - 9, y, 3, 1, '#8a4a4e');
    }
    for (let i = -102; i < 102; i += 5) px(c, 110 + i, rb, 3, 4, '#7d4046'); /* the fringe */
    /* ------------------------------------------------------------
       THE ARMCHAIR. Her chair. It has to read as a chair somebody
       sat in every evening, which means a back with a roll on it,
       two arms in front of that back, a cushion between the arms,
       and feet — not a slab with a lighter slab beside it.
       ------------------------------------------------------------ */
    for (let i = 0; i < 5; i++) {                       /* the rolled top */
      px(c, 24 + (4 - i), 44 + i, 44 - (4 - i) * 2, 1, i < 2 ? '#5d596e' : '#4e4a5c');
    }
    px(c, 24, 49, 44, 32, '#3d3a48');                   /* the back */
    px(c, 26, 52, 40, 20, '#454154');                   /* buttoned, faintly */
    [[36, 58], [54, 58], [45, 66]].forEach(([bxp, byp]) => {
      px(c, bxp, byp, 2, 2, '#332f3c');
    });
    px(c, 24, 49, 1, 32, 'rgba(255,255,255,.07)');
    px(c, 67, 49, 1, 32, 'rgba(0,0,0,.30)');
    /* the arms, in front of the back, with a roll on each */
    for (let i = 0; i < 4; i++) {
      px(c, 18 + (3 - i), 58 + i, 14 - (3 - i) * 2, 1, i < 2 ? '#565064' : '#453f52');
      px(c, 60 + (3 - i), 58 + i, 14 - (3 - i) * 2, 1, i < 2 ? '#413c4c' : '#332f3c');
    }
    px(c, 18, 62, 14, 22, '#453f52');
    px(c, 60, 62, 14, 22, '#332f3c');
    px(c, 18, 62, 1, 22, 'rgba(255,255,255,.08)');
    /* the seat, sagging where she sat */
    px(c, 32, 70, 28, 12, '#4a4458');
    for (let i = 0; i < 28; i++) {
      px(c, 32 + i, 70 + Math.round(Math.sin(i / 27 * Math.PI) * 2), 1, 2, '#565064');
    }
    px(c, 32, 80, 28, 3, '#2f2c39');
    /* feet, and the shadow they stand in */
    px(c, 17, 84, 58, 2, 'rgba(0,0,0,.26)');
    px(c, 22, 84, 6, 5, '#3a2f1e'); px(c, 64, 84, 6, 5, '#3a2f1e');
    px(c, 22, 88, 6, 1, '#241d13'); px(c, 64, 88, 6, 1, '#241d13');
    /* a throw folded over the near arm, with a fringe on it */
    px(c, 18, 56, 16, 14, '#6b5a3c');
    px(c, 18, 56, 16, 2, '#8a7550');
    px(c, 18, 68, 16, 2, '#4e402a');
    for (let i = 0; i < 16; i += 3) px(c, 18 + i, 70, 2, 3, '#8a7550');
    /* THE TABLE, with an ashtray on it, and a chair gone over beside it */
    px(c, 94, 60, 58, 4, '#6b5334');
    px(c, 94, 60, 58, 1, '#8a6c44');
    px(c, 94, 64, 58, 2, '#4a3a24');
    px(c, 99, 66, 4, 22, '#4a3a24'); px(c, 143, 66, 4, 22, '#4a3a24');
    px(c, 99, 86, 48, 2, '#3f321f');
    /* THE ASHTRAY: a shallow oval dish, not a grey box */
    for (let y = 0; y < 7; y++) {
      const t = (y - 3) / 3.4, half = Math.round(13 * Math.sqrt(Math.max(0, 1 - t * t)));
      px(c, 122 - half, 53 + y, half * 2, 1, y < 2 ? '#b0b8c2' : '#8a929c');
    }
    px(c, 110, 55, 24, 3, '#4e545c');
    px(c, 112, 56, 20, 1, '#3a4046');
    px(c, 109, 52, 26, 1, '#c2cbd4');
    /* THE CHAIR, gone over: the seat on its edge, the back flat on the
       floor, the legs in the air. An upright chair says nothing. */
    px(c, 150, 100, 26, 5, '#4a3720');                  /* the back, lying down */
    px(c, 150, 100, 26, 1, '#6b5334');
    px(c, 150, 92, 4, 9, '#4a3720'); px(c, 172, 92, 4, 9, '#4a3720');
    px(c, 150, 90, 26, 3, '#5a4426');
    px(c, 176, 88, 11, 26, '#5a4426');                  /* the seat, on edge */
    px(c, 176, 88, 11, 2, '#7a5e36');
    px(c, 176, 112, 11, 2, '#3f2e1a');
    [90, 111].forEach(y => {                            /* two legs, sideways */
      px(c, 187, y, 13, 3, '#4a3720');
      px(c, 187, y, 13, 1, '#6b5334');
      px(c, 196, y + (y > 100 ? -3 : 3), 3, 4, '#3f2e1a');
    });
    px(c, 191, 93, 3, 20, '#4a3720');                   /* the rung between them */
    px(c, 149, 114, 40, 2, 'rgba(0,0,0,.26)');
    /* THE WINDOW, open, with the curtain moving */
    px(c, 168, 18, 44, 46, '#14161c');
    px(c, 170, 20, 40, 42, '#1d2733');
    px(c, 170, 20, 40, 9, '#2c3d52');
    px(c, 188, 20, 2, 42, '#14161c');
    px(c, 170, 40, 40, 1, '#14161c');
    for (let i = 0; i < 10; i++) {                      /* the curtain, lifting */
      px(c, 164 + i, 14 + i, 12 - Math.round(i / 3), 58 - i * 2, i < 4 ? '#5f5344' : '#4a4034');
    }
    px(c, 204, 14, 12, 58, '#4a4034');
    px(c, 206, 16, 8, 54, '#5f5344');
    px(c, 162, 12, 58, 3, '#3a3226');
    /* THE LAMP, over on its side, the shade crushed under it */
    for (let i = 0; i < 10; i++) {
      px(c, 72 + i, 80 + Math.round(i * 0.2), 2, 12 - i, '#b8ae94');
    }
    px(c, 71, 80, 3, 12, '#5f5344');                    /* the mouth of the shade */
    px(c, 72, 82, 1, 8, '#3f372c');
    px(c, 80, 84, 3, 3, '#e8dcb8');                     /* and the bulb in it */
    px(c, 82, 82, 16, 4, '#8d8672');                    /* the stem */
    px(c, 82, 82, 16, 1, '#a8a294');
    px(c, 98, 80, 6, 8, '#5f5344');                     /* the base */
    px(c, 98, 80, 6, 1, '#7a6c58');
    for (let i = 0; i < 14; i++) {                      /* the cord, trailing */
      px(c, 104 + i, 86 + Math.round(Math.sin(i * 0.6) * 2), 1, 1, '#2a2620');
    }
    px(c, 71, 90, 30, 2, 'rgba(0,0,0,.22)');
    /* a small wooden frog on wheels, left where it was left */
    px(c, 122, 112, 12, 7, '#4a7f44');
    px(c, 124, 108, 8, 5, '#5e9a56');
    px(c, 125, 109, 2, 2, '#12101d'); px(c, 129, 109, 2, 2, '#12101d');
    PIX.disc(c, 124, 119, 2, '#2a2118'); PIX.disc(c, 132, 119, 2, '#2a2118');
    /* THE PHOTOGRAPH on the wall, knocked crooked: a mount, a mat, and
       three of them in it, which is why the rest of this matters. */
    for (let i = 0; i < 24; i++) {
      const sl = Math.round(i * 0.16);
      px(c, 36 + sl, 18 + i, 32, 1, (i < 2 || i > 21) ? '#5a4426' : '#3a2f1e');
    }
    for (let i = 3; i < 21; i++) {
      const sl = Math.round(i * 0.16);
      px(c, 39 + sl, 18 + i, 26, 1, '#c9c0a8');
    }
    for (let i = 5; i < 19; i++) {
      const sl = Math.round(i * 0.16);
      px(c, 41 + sl, 18 + i, 22, 1, '#3d5164');
    }
    px(c, 44, 26, 5, 6, '#5e9a56'); px(c, 45, 27, 1, 1, '#12101d'); px(c, 47, 27, 1, 1, '#12101d');
    px(c, 51, 25, 6, 8, '#7ab06e'); px(c, 52, 27, 1, 1, '#12101d'); px(c, 55, 27, 1, 1, '#12101d');
    px(c, 58, 28, 4, 5, '#8ab894'); px(c, 59, 29, 1, 1, '#12101d');
    px(c, 42, 34, 22, 3, '#2a3a4a');
    px(c, 51, 14, 1, 5, '#4a4034');                     /* the nail it is on */
    /* THE LIGHT FROM THE HALL, coming in behind you */
    for (let i = 0; i < 34; i++) {
      px(c, 0, 74 + i, Math.round(74 - i * 1.4), 1,
        'rgba(255,220,150,' + (0.055 - i * 0.0015).toFixed(4) + ')');
    }
    px(c, 0, 0, 4, CH, 'rgba(255,220,150,.05)');
    /* and the thing you found, once you have found it */
    if (found) {
      px(c, 118, 52, 7, 3, '#efe6cc');
      px(c, 124, 52, 3, 3, '#8a5a2a');
      px(c, 118, 51, 7, 1, '#ffffff');
      PIX.disc(c, 122, 53, 9, 'rgba(255,220,150,.12)');
    }
  }

  /* ------------------------------------------------------------
     THE CIGARETTE, very close. A brand nobody in this country
     smokes, which is the only reason any of the rest happens.

     The lettering is the subject of the shot, so it gets room:
     the first pass printed GAULOISE and PARIS on top of each
     other and hung the second one off the end of the butt.
     ------------------------------------------------------------ */
  function buttCard(c) {
    px(c, 0, 0, CW, CH, '#191612');
    for (let i = 0; i < CH; i += 3) px(c, 0, i, CW, 1, 'rgba(255,240,210,.018)');
    /* a hard light from above and to the left, and nothing else */
    for (let i = 0; i < 46; i++) {
      px(c, 0, i, CW, 1, 'rgba(255,238,200,' + (0.020 - i * 0.0004).toFixed(4) + ')');
    }

    /* THE ASHTRAY: a shallow glass dish, most of the lower frame */
    const cx = 110, cy = 100, rx = 94, ry = 17;
    for (let y = -ry - 5; y <= ry; y++) {
      const t = y / ry;
      if (Math.abs(t) > 1) continue;
      const half = Math.round(rx * Math.sqrt(1 - t * t));
      px(c, cx - half, cy + y, half * 2, 1, y < -ry + 6 ? '#4a463c' : '#6f6a5c');
    }
    for (let y = -ry + 4; y <= ry - 6; y++) {
      const t = y / (ry - 5);
      if (Math.abs(t) > 1) continue;
      const half = Math.round((rx - 12) * Math.sqrt(1 - t * t));
      px(c, cx - half, cy + y, half * 2, 1, '#3f3b33');
    }
    px(c, cx - 88, cy - ry - 4, 176, 1, '#8d8778');       /* the lit rim */
    px(c, cx - 40, cy + ry - 8, 80, 2, '#4a463c');
    /* ash, and the flecks of it that went over the side */
    const rng = U.mulberry32(3311);
    for (let i = 0; i < 90; i++) {
      const a = rng() * Math.PI * 2, r = rng();
      px(c, Math.round(cx + Math.cos(a) * r * 74), Math.round(cy + Math.sin(a) * r * 9 + 2),
        1 + (i % 2), 1, i % 3 ? 'rgba(190,184,168,.28)' : 'rgba(140,134,120,.5)');
    }

    /* ------------------------------------------------------------
       THE BUTT: a hundred and fifty pixels of it, lying in the
       notch with the printing facing us.
       ------------------------------------------------------------ */
    const bx = 34, by = 66, bl = 152, bh = 26;
    px(c, bx + 6, by + bh + 1, bl - 4, 4, 'rgba(0,0,0,.35)');
    /* the tube, shaded like a tube */
    for (let i = 0; i < bh; i++) {
      const t = i / (bh - 1);
      const inset = (i === 0 || i === bh - 1) ? 3 : (i === 1 || i === bh - 2) ? 1 : 0;
      const col = t < 0.14 ? '#ffffff' : t < 0.34 ? '#f8f2dc'
        : t < 0.62 ? '#eee6cc' : t < 0.84 ? '#d9cfb4' : '#b8ae94';
      px(c, bx + inset, by + i, bl - inset * 2, 1, col);
    }
    /* the paper's fibre, just enough of it to not be flat */
    for (let i = 0; i < 60; i++) {
      const fx = bx + 4 + Math.floor(rng() * 84), fy = by + 3 + Math.floor(rng() * (bh - 6));
      px(c, fx, fy, 1, 1, rng() < 0.5 ? 'rgba(255,255,255,.22)' : 'rgba(140,130,105,.14)');
    }
    /* THE FILTER, and the seam where it is joined on */
    const fx0 = bx + 92, fw = bl - 92;
    for (let i = 0; i < bh; i++) {
      const t = i / (bh - 1);
      const inset = (i === 0 || i === bh - 1) ? 3 : (i === 1 || i === bh - 2) ? 1 : 0;
      const col = t < 0.14 ? '#f0c273' : t < 0.34 ? '#e0a63c'
        : t < 0.62 ? '#c98a3c' : t < 0.84 ? '#a86e2a' : '#8a5a1a';
      px(c, fx0 + inset, by + i, fw - inset * 2, 1, col);
    }
    for (let i = 0; i < fw - 6; i += 4) {                 /* the cork print */
      px(c, fx0 + 3 + i, by + 3, 2, bh - 6, 'rgba(120,74,20,.22)');
    }
    px(c, fx0 - 2, by + 1, 3, bh - 2, '#8a5a1a');
    px(c, fx0 + 1, by + 1, 1, bh - 2, 'rgba(255,235,190,.35)');
    /* the gold band nobody in this country prints */
    px(c, fx0 + 6, by + 2, 3, bh - 4, '#f4d98a');
    px(c, fx0 + 6, by + 2, 1, bh - 4, '#fff4d0');
    /* THE BURNT END, with the ash still on it */
    px(c, bx - 8, by + 3, 10, bh - 6, '#3a2c1c');
    px(c, bx - 12, by + 6, 6, bh - 12, '#241a12');
    px(c, bx - 3, by + 8, 4, bh - 16, '#6b3a1a');
    px(c, bx - 2, by + 10, 2, 3, '#c85a2a');
    px(c, bx - 14, by + 9, 4, 6, 'rgba(200,192,176,.55)');

    /* ------------------------------------------------------------
       THE LETTERING, which is the whole point of the shot.
       ------------------------------------------------------------ */
    const t1 = PIXFONT.render('GAULOISE', { scale: 1, color: '#3a2f1a', shadow: null });
    c.drawImage(t1, bx + 18, by + 10);
    px(c, bx + 18, by + 8, t1.width, 1, 'rgba(90,74,40,.45)');
    px(c, bx + 18, by + 20, t1.width, 1, 'rgba(90,74,40,.45)');
    const t2 = PIXFONT.render('PARIS', { scale: 1, color: '#7a1e10', shadow: null });
    c.drawImage(t2, fx0 + 16, by + 10);

    /* the smoke that has not quite gone */
    for (let i = 0; i < 16; i++) {
      const w = i < 5 ? 3 : i < 10 ? 2 : 1;
      const sx = bx - 10 + Math.round(Math.sin(i * 0.55) * (3 + i * 0.5));
      px(c, sx, by + 4 - i * 4, w, 4, 'rgba(206,202,190,' + (0.17 - i * 0.010).toFixed(3) + ')');
    }
  }

  /* ------------------------------------------------------------
     ONE PERSON IN A CROWD.

     The cards need people standing about in them — a queue, a
     cabin, a hall — and the full rig is far too big for a figure
     that is thirty pixels tall and nine metres away. This is the
     cheap version: the same silhouette every time so a crowd
     reads as a crowd and not as a row of different mistakes.

     `fy` is the floor. He is 38 tall and 16 wide.
     ------------------------------------------------------------ */
  function folk(c, x, fy, o) {
    o = o || {};
    const coat = o.coat || '#39404e', dark = o.dark || '#262b36';
    const skin = o.skin || '#5e9a56', shade = o.shade || '#3f6e3c';
    /* what he is standing on */
    px(c, x - 1, fy - 1, 18, 2, 'rgba(0,0,0,.28)');
    px(c, x + 2, fy - 10, 5, 10, dark);
    px(c, x + 9, fy - 10, 5, 10, dark);
    px(c, x + 1, fy - 2, 6, 2, '#14121a');
    px(c, x + 9, fy - 2, 6, 2, '#14121a');
    /* the coat */
    px(c, x, fy - 26, 16, 17, coat);
    px(c, x, fy - 26, 16, 2, o.lit || '#4c5566');
    px(c, x, fy - 26, 3, 17, dark);
    px(c, x + 13, fy - 26, 3, 17, dark);
    px(c, x + 7, fy - 24, 2, 15, 'rgba(0,0,0,.25)');
    /* the head, with a jaw and a brow */
    px(c, x + 2, fy - 39, 12, 13, skin);
    px(c, x + 2, fy - 39, 12, 2, o.top || '#7ab06e');
    px(c, x + 2, fy - 29, 12, 3, shade);
    px(c, x + 1, fy - 36, 1, 7, shade);
    px(c, x + 14, fy - 36, 1, 7, shade);
    if (!o.back) {
      px(c, x + 4, fy - 35, 3, 2, '#12101d');
      px(c, x + 9, fy - 35, 3, 2, '#12101d');
      px(c, x + 5, fy - 30, 6, 1, '#2a3a26');
    }
    /* a cap, if he is anybody official */
    if (o.cap) {
      px(c, x + 1, fy - 42, 14, 4, o.cap);
      px(c, x + 1, fy - 42, 14, 1, 'rgba(255,255,255,.18)');
      px(c, x, fy - 38, 16, 2, '#161a22');
      if (o.badge) px(c, x + 7, fy - 41, 2, 2, '#e0a63c');
    } else if (o.hat) {
      px(c, x + 2, fy - 43, 12, 5, o.hat);
      px(c, x, fy - 38, 16, 2, o.hat);
    }
  }

  /* THE DEPARTURE HALL. A queue, a desk, a sign, and a machine. */
  function airportCard(c, stage) {
    /* the hall: a high concourse, lit from a roof you cannot see */
    px(c, 0, 0, CW, CH, '#3a3a42');
    for (let i = 0; i < 46; i++) {
      px(c, 0, i, CW, 1, 'rgba(220,230,245,' + (0.11 - i * 0.0022).toFixed(3) + ')');
    }
    /* the floor, polished, with the hall reflected in it */
    px(c, 0, 90, CW, CH - 90, '#4e4a48');
    for (let i = 0; i < CW; i += 18) px(c, i, 90, 9, CH - 90, '#544f4c');
    px(c, 0, 90, CW, 1, '#6f6866');
    for (let i = 0; i < CW; i += 7) px(c, i, 95, 4, 1, 'rgba(255,255,255,.06)');
    px(c, 0, 90, CW, 5, 'rgba(255,255,255,.04)');

    /* ------------------------------------------------------------
       THE GLAZING, and what is standing on the other side of it.

       The first pass put a cream triangle behind the glass and
       called it an aeroplane; it read as a shark. This is the
       whole aircraft, side on, small enough to be a hundred
       metres away: tube, fin, tailplane, wing, engine, and a row
       of windows.
       ------------------------------------------------------------ */
    const gx = 126, gy = 24, gw = 88, gh = 50;
    px(c, gx - 2, gy - 2, gw + 4, gh + 4, '#2a2e36');
    /* morning, out there */
    for (let i = 0; i < gh - 10; i++) {
      const t = i / (gh - 10);
      px(c, gx, gy + i, gw, 1, mix('#8fb2cc', '#c6d2d2', t));
    }
    /* the apron */
    px(c, gx, gy + gh - 10, gw, 10, '#4a4a50');
    px(c, gx, gy + gh - 10, gw, 1, '#63636a');
    px(c, gx + 4, gy + gh - 5, gw - 8, 1, 'rgba(240,220,120,.5)');
    const ax = gx + 4, ay = gy + gh - 14;               /* nose, and the waterline */
    /* the fin, swept */
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      px(c, ax + 58 + Math.round(t * 11), ay - i, Math.round(14 - t * 9), 1, '#eae4d0');
      px(c, ax + 58 + Math.round(t * 11), ay - i, 1, 1, '#2a2e36');
    }
    px(c, ax + 63, ay - 14, 7, 7, '#b8384a');
    /* the tailplane */
    px(c, ax + 54, ay - 2, 16, 2, '#cfc8b4');
    /* the tube: a nose that tapers and a tail that lifts */
    for (let i = 0; i < 68; i++) {
      const t = i / 68;
      const top = ay - 8 + (t < 0.10 ? Math.round((0.10 - t) * 34) : 0)
        - (t > 0.86 ? Math.round((t - 0.86) * 22) : 0);
      const bot = ay + (t < 0.08 ? -Math.round((0.08 - t) * 30) : 0)
        - (t > 0.88 ? Math.round((t - 0.88) * 14) : 0);
      px(c, ax + i, top, 1, Math.max(1, bot - top), '#eee8d4');
      px(c, ax + i, top, 1, 1, '#ffffff');
      px(c, ax + i, bot - 2, 1, 2, '#8e8878');
      px(c, ax + i, bot, 1, 1, 'rgba(20,20,24,.35)');
    }
    px(c, ax, ay - 8, 1, 8, '#2a2e36');
    px(c, ax + 2, ay - 4, 66, 1, '#b8384a');            /* the cheatline */
    for (let i = 10; i < 60; i += 5) px(c, ax + i, ay - 6, 2, 2, '#5f7f96');
    px(c, ax + 2, ay - 7, 4, 3, '#2a3a4a');             /* the flight deck */
    /* the wing, and the engine slung under it */
    for (let i = 0; i < 22; i++) {
      px(c, ax + 24 + i, ay - 1 + Math.round(i * 0.30), Math.max(1, 5 - Math.round(i * 0.2)),
        2, '#cfc8b4');
    }
    px(c, ax + 26, ay + 2, 12, 5, '#9a9482');
    px(c, ax + 26, ay + 2, 12, 1, '#c2bba6');
    /* undercarriage, so it is standing and not floating */
    px(c, ax + 8, ay, 2, 4, '#3a3a3e'); px(c, ax + 30, ay + 6, 2, 3, '#3a3a3e');
    px(c, ax + 7, ay + 4, 4, 2, '#1a1a1e'); px(c, ax + 29, ay + 9, 4, 2, '#1a1a1e');
    /* the jetway reaching for the door */
    px(c, gx + 66, ay - 12, 22, 9, '#78787e');
    px(c, gx + 66, ay - 12, 22, 1, '#9a9aa0');
    for (let i = 0; i < 22; i += 4) px(c, gx + 66 + i, ay - 10, 2, 5, '#4a4a50');
    /* the mullions, over all of it */
    for (let i = 0; i <= gw; i += 14) px(c, gx + i, gy, 2, gh, '#39414c');
    px(c, gx, gy + 22, gw, 2, '#39414c');
    px(c, gx, gy, gw, 2, '#39414c'); px(c, gx, gy + gh - 2, gw, 2, '#39414c');
    px(c, gx + 1, gy + 1, gw - 2, 1, 'rgba(255,255,255,.16)');

    /* THE CLOCK, and the sign pointing the way you are going */
    PIX.disc(c, 108, 40, 9, '#22262e');
    PIX.disc(c, 108, 40, 7, '#dcd6c2');
    px(c, 108, 34, 1, 7, '#22262e'); px(c, 108, 40, 5, 1, '#22262e');
    PIX.disc(c, 108, 40, 1, '#8a2a1a');
    px(c, 14, 34, 62, 12, '#2c333e');
    px(c, 14, 34, 62, 1, '#3f4a58');
    c.drawImage(PIXFONT.render('GATES', { scale: 1, color: '#8fd0b0', shadow: null }), 18, 36);
    for (let i = 0; i < 5; i++) px(c, 56 + i, 39 - i, 1, 1 + i * 2, '#8fd0b0');
    px(c, 50, 39, 8, 2, '#8fd0b0');

    /* ------------------------------------------------------------
       THE BOARD, hung across the ceiling.

       Two lines of a 5x7 font stacked ten rows apart came out
       printed through each other, so the two lines are side by
       side now, on one baseline, in a band as wide as the hall.
       ------------------------------------------------------------ */
    const s1 = PIXFONT.render('DEPARTURES', { scale: 2, color: '#e0a63c', shadow: null });
    const s2 = PIXFONT.render('ORLY  GATE 6', { scale: 1, color: '#8fd0b0', shadow: null });
    px(c, 88, 0, 2, 4, '#14161c'); px(c, 148, 0, 2, 4, '#14161c');
    px(c, 4, 2, CW - 8, 24, '#14161c');
    px(c, 5, 3, CW - 10, 22, '#1b232e');
    px(c, 5, 3, CW - 10, 1, '#33445a');
    px(c, 5, 24, CW - 10, 1, '#0d1016');
    for (let i = 6; i < CW - 6; i += 3) px(c, i, 14, 1, 1, 'rgba(255,255,255,.03)');
    c.drawImage(s1, 10, 5);
    c.drawImage(s2, CW - 12 - s2.width, 11);
    px(c, CW - 16 - s2.width, 6, 1, 16, '#33445a');

    /* THE TWO OFFICERS on the far side of the counter */
    folk(c, 110, 90, { coat: '#22364e', dark: '#1a2a3e', cap: '#1d3a62', badge: 1, lit: '#2f4a70' });
    folk(c, 88, 90, { coat: '#2f4a70', dark: '#22364e', cap: '#1d3a62', badge: 1, lit: '#3f5f86' });

    /* THE MACHINE: an arch with a rubber curtain, and a belt through it */
    px(c, 2, 52, 38, 38, '#2f353f');
    px(c, 6, 56, 30, 26, '#14161c');
    for (let i = 0; i < 30; i += 3) px(c, 6 + i, 56, 2, 22, '#232833');
    px(c, 2, 52, 38, 3, '#454d5a');
    px(c, 4, 78, 34, 4, '#1a1e26');
    px(c, 36, 78, 44, 4, '#3f4653');                    /* the belt, coming out */
    px(c, 36, 78, 44, 1, '#5a6472');
    for (let i = 38; i < 80; i += 6) px(c, i, 80, 3, 2, '#2a2f38');
    /* THE COUNTER, standing on the floor and hiding their feet */
    px(c, 40, 82, 62, 18, '#3a3f48');
    px(c, 40, 82, 62, 2, '#525a66');
    px(c, 40, 96, 62, 4, '#262a31');
    px(c, 46, 86, 22, 9, '#333842');
    px(c, 74, 86, 22, 9, '#333842');
    px(c, 39, 99, 64, 2, 'rgba(0,0,0,.30)');
    /* the tray on the belt, clear of everybody */
    px(c, 42, 74, 26, 5, '#7a4a1e');
    px(c, 42, 74, 26, 1, '#a3702c');
    px(c, 44, 75, 22, 3, '#5c3714');

    /* TWO PEOPLE WAITING, with their backs to us */
    folk(c, 150, 100, { coat: '#4a3a5a', dark: '#332844', skin: '#7ab06e', hat: '#2a2118', back: 1 });
    folk(c, 176, 108, { coat: '#5a4a34', dark: '#3f3324', skin: '#8ab894', back: 1 });
    /* somebody's case, stood on end where somebody left it */
    px(c, 196, 100, 18, 22, '#4a3524');
    px(c, 196, 100, 18, 2, '#6b5334');
    px(c, 196, 108, 18, 2, '#33251a');
    px(c, 203, 96, 5, 5, '#2a2118');
    px(c, 195, 121, 20, 2, 'rgba(0,0,0,.30)');

    /* THE ROPE ACROSS THE FRONT OF THE FRAME: you are in the queue, and
       the barrier is between the camera and the desk. */
    [4, 58, 112].forEach((i, n) => {
      px(c, i, 100, 4, 24, '#6a6252');
      px(c, i, 100, 1, 24, '#a39a82');
      px(c, i + 3, 100, 1, 24, '#4a4438');
      px(c, i - 3, 121, 10, 3, '#4a4438');
      px(c, i - 4, 123, 12, 2, 'rgba(0,0,0,.30)');
      PIX.disc(c, i + 2, 99, 3, '#c9c0a8');
      PIX.disc(c, i + 2, 98, 1, '#f0e8d0');
      if (n < 2) {
        for (let t = 0; t <= 54; t++) {
          const u = t / 54;
          const y = 104 + Math.round(Math.sin(u * Math.PI) * 7);
          px(c, i + 2 + t, y, 1, 3, '#8d8672');
          px(c, i + 2 + t, y, 1, 1, '#b8ae94');
        }
      }
    });

    /* WHAT IS IN YOUR HAND, depending on where we are */
    if (stage === 'gun') {
      /* THE PISTOL, in the tray: slide, barrel, guard, grip */
      px(c, 44, 69, 22, 5, '#39404e');
      px(c, 44, 69, 22, 1, '#9aa3b8');
      px(c, 44, 73, 22, 1, '#22262e');
      px(c, 62, 70, 5, 3, '#2a2f36');
      px(c, 46, 74, 6, 6, '#241c14');
      px(c, 47, 74, 4, 5, '#3a2c1c');
      px(c, 52, 74, 7, 2, '#2a2f36');
      px(c, 53, 76, 5, 1, '#39404e');
      px(c, 58, 74, 2, 3, '#2a2f36');
    }
    if (stage === 'stopped') {
      /* three of them now, and one has a hand on your arm */
      folk(c, 66, 106, { coat: '#2f4a70', dark: '#22364e', cap: '#1d3a62', badge: 1 });
      px(c, 58, 82, 15, 4, '#5e9a56');
      px(c, 58, 82, 15, 1, '#7ab06e');
      px(c, 56, 81, 3, 6, '#4a7f44');
    }
  }

  /* ------------------------------------------------------------
     THE CABIN. Nine hours over the water, and then the morning.

     Seen from your own seat, which means: the seat back in front
     of you fills the bottom of the frame, you can see over it to
     the tops of the heads in the rows ahead, the bins run along
     the top, and the window is on the wall to your right. The
     first pass was two flat blue slabs and a window pasted on
     the wall, which is what a cabin looks like if you have never
     been in one.
     ------------------------------------------------------------ */
  function cabinCard(c, night) {
    const wall = night ? '#242833' : '#4e4a42';
    const dim = night ? '#1a1c24' : '#3a3630';
    const seam = night ? '#171a21' : '#332f28';
    const trim = night ? '#31364a' : '#65604f';
    px(c, 0, 0, CW, CH, dim);
    /* the ceiling, curving away over your head */
    for (let i = 0; i < 14; i++) px(c, i * 2, i, CW - i * 4, 1, night ? '#272b38' : '#57524a');
    px(c, 0, 13, CW, 2, seam);
    /* THE BINS: one long lid, latched every so often, and the lights
       and vents in the panel underneath it */
    px(c, 0, 15, CW, 17, wall);
    px(c, 0, 15, CW, 2, trim);
    px(c, 0, 30, CW, 4, seam);
    for (let i = 10; i < CW; i += 34) {
      px(c, i, 17, 2, 13, seam);
      px(c, i + 15, 25, 6, 2, trim);
    }
    for (let i = 22; i < CW; i += 34) {
      px(c, i, 31, 5, 2, night ? '#3a3f52' : '#d8cfb4');
      px(c, i + 9, 31, 3, 2, night ? '#2a2f3e' : '#8d8672');
      if (!night && i === 90) px(c, i + 9, 31, 3, 2, '#ffd98a');
    }
    /* the seat-belt sign, on, because it always is */
    px(c, 96, 18, 26, 11, '#191c22');
    px(c, 97, 19, 24, 9, '#2a1f14');
    px(c, 100, 22, 5, 4, '#e0a63c'); px(c, 106, 22, 4, 4, '#e0a63c');
    px(c, 111, 22, 6, 4, '#e0a63c');
    /* ------------------------------------------------------------
       THE ROWS AHEAD: each row a thinner band than the one in
       front of it, with the crown of a head coming up over most
       of the headrests. This is the whole trick of the shot — and
       the first pass got the geometry backwards, giving every row
       the same top and stacking them into one blue wall.
       ------------------------------------------------------------ */
    const rows = [
      { top: 40, h: 9, w: 13, sh: 0.36 },
      { top: 49, h: 12, w: 17, sh: 0.18 },
      { top: 61, h: 25, w: 23, sh: 0 },
    ];
    const base = night ? '#22303e' : '#2a3a4a';
    rows.forEach((r, ri) => {
      for (let x = 4; x < 146; x += r.w + 2) {
        const w = Math.min(r.w, 146 - x);
        if (w < 7) continue;
        /* the crown of a head, first, so the headrest cuts it off */
        if ((x * 7 + ri * 11) % 9 < 3) {
          const hw = Math.max(6, Math.round(w * 0.58)), hh = Math.round(hw * 0.85);
          const hx = x + Math.round((w - hw) / 2);
          /* a dome, not a cone: the first pass tapered over the top four
             rows only and gave everybody a witch's hat */
          for (let i = 0; i < hh + 3; i++) {
            const u = Math.min(1, i / hh), k = 1 - u;
            const in_ = Math.round((1 - Math.sqrt(Math.max(0, 1 - k * k))) * (hw / 2));
            px(c, hx + in_, r.top - hh + i, Math.max(1, hw - in_ * 2), 1,
              i < 2 ? (night ? '#3a6136' : '#7ab06e') : (night ? '#2f5230' : '#5e9a56'));
          }
          if (r.sh) px(c, hx, r.top - hh, hw, hh + 3, 'rgba(10,12,18,' + r.sh + ')');
        }
        px(c, x, r.top, w, r.h, base);
        px(c, x, r.top, w, 2, night ? '#31445a' : '#3d5164');
        px(c, x + 2, r.top + 3, w - 4, Math.max(2, Math.round(r.h * 0.35)),
          night ? '#1d2733' : '#243342');          /* the headrest cover */
        px(c, x + 1, r.top + 3 + Math.round(r.h * 0.45), w - 2, 1, 'rgba(0,0,0,.24)');
        px(c, x + w - 1, r.top, 1, r.h, 'rgba(0,0,0,.35)');
        px(c, x, r.top, 1, r.h, 'rgba(255,255,255,.06)');
        if (r.h > 18) {                             /* the near row gets a pocket */
          px(c, x + 3, r.top + 14, w - 6, 7, night ? '#1a222e' : '#20303e');
          px(c, x + 3, r.top + 14, w - 6, 1, night ? '#2b3a4c' : '#33465a');
          if ((x % 3) === 1) px(c, x + 6, r.top + 12, 9, 3, '#8d8672');
        }
        if (r.sh) px(c, x, r.top, w, r.h, 'rgba(10,12,18,' + r.sh + ')');
      }
    });
    /* ------------------------------------------------------------
       THE WALL ON YOUR RIGHT, and the window in it.
       ------------------------------------------------------------ */
    px(c, 148, 30, CW - 148, 62, wall);
    px(c, 148, 30, 2, 62, seam);
    px(c, 148, 30, CW - 148, 2, trim);
    px(c, 176, 32, 1, 58, seam);
    const wx = 156, wy = 40, ww = 50, wh = 40;
    px(c, wx - 6, wy - 6, ww + 12, wh + 14, night ? '#191c22' : '#3f3b34');
    px(c, wx - 4, wy - 8, ww + 8, 4, trim);              /* the shade rail */
    px(c, wx - 3, wy - 3, ww + 6, wh + 6, night ? '#2a2e38' : '#6b6558');
    px(c, wx - 3, wy - 3, ww + 6, 2, night ? '#3a3f4c' : '#8d8672');
    /* the reveal, and then the view: an aircraft window is a rounded
       rectangle, not a rectangle */
    for (let i = 0; i < wh; i++) {
      const t = Math.abs((i / (wh - 1)) * 2 - 1);
      const inset = Math.round(Math.pow(t, 3.2) * 11);
      px(c, wx + inset, wy + i, ww - inset * 2, 1, night ? '#0d1424' : '#7fb0d8');
      px(c, wx + inset, wy + i, 1, 1, 'rgba(0,0,0,.35)');
      px(c, wx + ww - inset - 1, wy + i, 1, 1, 'rgba(255,255,255,.10)');
    }
    if (night) {
      /* THE OCEAN AT NIGHT IS NOTHING, and that is the point — but a
         black hole is not a shot, so: stars up top, a moon-lit cloud
         deck below, and the wing in silhouette between them. */
      const rng = U.mulberry32(77);
      for (let i = 0; i < 22; i++) {
        const sx = wx + 6 + Math.floor(rng() * (ww - 12));
        const sy = wy + 3 + Math.floor(rng() * (wh * 0.5));
        px(c, sx, sy, 1, 1, 'rgba(210,226,255,' + (0.22 + rng() * 0.5).toFixed(2) + ')');
      }
      for (let i = 0; i < 8; i++) {
        px(c, wx + 4, wy + wh - 14 + i, ww - 8, 1,
          'rgba(120,150,190,' + (0.05 + i * 0.018).toFixed(3) + ')');
      }
      for (let i = 0; i < 5; i++) {
        PIX.disc(c, wx + 8 + i * 9, wy + wh - 6 + (i % 2) * 2, 5, 'rgba(150,175,210,.20)');
      }
      /* the wing, and the lights on the end of it, out there */
      for (let i = 0; i < 32; i++) {
        px(c, wx + 10 + i, wy + wh - 16 + Math.round(i * 0.26), 1, 8, '#141a26');
        px(c, wx + 10 + i, wy + wh - 16 + Math.round(i * 0.26), 1, 1, '#2a3446');
      }
      px(c, wx + 41, wy + wh - 9, 3, 3, '#ff6a5e');
      px(c, wx + 41, wy + wh - 9, 1, 1, '#ffd0c8');
      px(c, wx + 24, wy + wh - 5, 2, 2, 'rgba(255,255,255,.8)');
    } else {
      /* cloud tops, from above, with the sea between them */
      for (let i = 0; i < wh; i++) {
        const t = i / wh;
        px(c, wx + 4, wy + i, ww - 8, 1, mix('#5f9fd0', '#bcd8e8', t));
      }
      for (let i = 0; i < 7; i++) {
        PIX.disc(c, wx + 6 + i * 7, wy + 26 + (i % 3) * 3, 5 + (i % 2) * 2, '#ffffff');
      }
      px(c, wx + 4, wy + 30, ww - 8, 10, 'rgba(255,255,255,.72)');
      px(c, wx + 8, wy + 8, 12, 3, 'rgba(255,255,255,.8)');
      px(c, wx + 26, wy + 14, 8, 2, 'rgba(255,255,255,.6)');
      /* the wing, catching the sun */
      for (let i = 0; i < 32; i++) {
        px(c, wx + 10 + i, wy + wh - 14 + Math.round(i * 0.24), 1, 7, '#9a9caa');
        px(c, wx + 10 + i, wy + wh - 14 + Math.round(i * 0.24), 1, 1, '#d0d2dc');
      }
    }
    /* your own reflection in the glass, faintly */
    px(c, wx + 5, wy + 6, 13, 16, 'rgba(90,150,110,.13)');
    px(c, wx + 7, wy + 9, 3, 2, 'rgba(20,18,28,.20)');
    /* ------------------------------------------------------------
       THE SEAT IN FRONT OF YOU, close enough to touch, with the
       tray down and what is on it.
       ------------------------------------------------------------ */
    px(c, 0, 86, 148, 4, seam);
    px(c, 2, 88, 66, 36, night ? '#22303e' : '#2a3a4a');
    px(c, 2, 88, 66, 3, night ? '#31445a' : '#3d5164');
    px(c, 72, 88, 70, 36, night ? '#22303e' : '#2a3a4a');
    px(c, 72, 88, 70, 3, night ? '#31445a' : '#3d5164');
    px(c, 68, 86, 4, 38, night ? '#161c26' : '#1d2733');
    px(c, 8, 96, 54, 12, night ? '#1d2733' : '#243342');  /* the seat pocket */
    px(c, 8, 96, 54, 1, night ? '#2b3a4c' : '#33465a');
    px(c, 14, 92, 22, 6, '#8d8672');                      /* a magazine in it */
    px(c, 14, 92, 22, 1, '#c9c0a8');
    px(c, 78, 96, 58, 12, night ? '#1d2733' : '#243342');
    px(c, 78, 96, 58, 1, night ? '#2b3a4c' : '#33465a');
    /* THE TRAY, down, with a coffee going cold on it and the only
       thing you brought with you */
    px(c, 76, 108, 68, 5, '#8d8672');
    px(c, 76, 108, 68, 1, '#c1b9a2');
    px(c, 76, 113, 68, 2, '#5f5a4e');
    px(c, 86, 100, 11, 9, '#e8e0cc');
    px(c, 86, 100, 11, 2, '#5a3a22');
    px(c, 97, 102, 3, 4, '#e8e0cc');
    px(c, 110, 101, 28, 8, 'rgba(210,220,230,.30)');      /* the bag */
    px(c, 110, 101, 28, 1, 'rgba(240,246,252,.55)');
    px(c, 115, 104, 15, 3, '#f4ecd4');
    px(c, 127, 104, 5, 3, '#c98a3c');
    px(c, 112, 102, 6, 2, '#b8384a');
  }

  /* ------------------------------------------------------------
     THE DESCENT. Paris out of the window at first light.

     The first pass drew a field of evenly-scattered dots on sand
     with three straight boulevards across it, and it came out
     looking exactly like a brick wall with a blue snake on it.
     What makes an aerial read is density and perspective: the
     blocks get bigger and darker as they come towards you, the
     roads narrow as they go away, and the haze eats the far edge.
     ------------------------------------------------------------ */
  function descentCard(c) {
    const HZ = 52;                                        /* the horizon */
    /* the sky, from the band the game actually thinks it is */
    if (typeof DAY !== 'undefined' && DAY.sky) DAY.sky(c, 0, 0, CW, HZ + 2, 0, 11);
    else for (let i = 0; i < HZ + 2; i++) px(c, 0, i, CW, 1, mix('#2f5f9c', '#cfd8dc', i / HZ));
    /* the haze the city sits in */
    for (let i = 0; i < 16; i++) {
      px(c, 0, HZ - 10 + i, CW, 1, 'rgba(236,226,206,' + (0.30 + i * 0.035).toFixed(3) + ')');
    }
    /* the sun, just up, and the light it throws down the river */
    PIX.disc(c, 168, HZ - 18, 7, '#fff0c0');
    for (let i = 1; i <= 5; i++) {
      PIX.disc(c, 168, HZ - 18, 7 + i * 4, 'rgba(255,232,168,' + (0.09 - i * 0.014).toFixed(3) + ')');
    }

    /* THE GROUND. Limestone, and a lot of it. */
    for (let i = HZ; i < CH; i++) {
      const t = (i - HZ) / (CH - HZ);
      px(c, 0, i, CW, 1, mix('#cfc4a8', '#9e9376', t));
    }
    /* the parks, which are the only green from up here */
    [[6, 66, 34, 10], [166, 74, 48, 14], [92, 100, 30, 12]].forEach(([x, y, w, h]) => {
      px(c, x, y, w, h, '#5f7a4a');
      px(c, x, y, w, 1, '#74905a');
      for (let i = 0; i < w; i += 5) px(c, x + i, y + Math.round(h / 2), 3, 1, '#8a9e6a');
    });

    /* ------------------------------------------------------------
       THE BOULEVARDS, radiating from the Etoile, narrowing as they
       go away. Drawn before the blocks so the blocks sit between
       them instead of on top of them.
       ------------------------------------------------------------ */
    const ex = 62, ey = 76;
    const road = (x0, y0, x1, y1, w) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) {
        const u = i / n, x = Math.round(x0 + (x1 - x0) * u), y = Math.round(y0 + (y1 - y0) * u);
        /* a road that leaves the ground is a wire in the sky */
        if (y < HZ + 1 || y >= CH || x < 0 || x >= CW) continue;
        const ww = Math.max(1, Math.round(w * (0.4 + (y - HZ) / (CH - HZ) * 0.9)));
        px(c, x - Math.floor(ww / 2), y, ww, 1, '#e6dcc0');
      }
    };
    for (let a = 0; a < 12; a++) {
      const th = (a / 12) * Math.PI * 2;
      road(ex, ey, Math.round(ex + Math.cos(th) * 150), Math.round(ey + Math.sin(th) * 90), 2);
    }
    road(0, 62, CW, 70, 2); road(0, 92, CW, 84, 2); road(0, 116, CW, 104, 3);
    road(130, HZ, 150, CH, 2); road(196, HZ, 186, CH, 2);

    /* ------------------------------------------------------------
       THE BLOCKS: dense, bigger and darker as they come at you,
       each one a roof with a lit face and a shadow off it.
       ------------------------------------------------------------ */
    const rng = U.mulberry32(6108);
    for (let i = 0; i < 1500; i++) {
      const y = HZ + 1 + Math.floor(Math.pow(rng(), 0.72) * (CH - HZ - 2));
      const x = Math.floor(rng() * CW);
      const t = (y - HZ) / (CH - HZ);
      const w = 2 + Math.floor(rng() * 3 + t * 5), h = 1 + Math.floor(t * 4 + rng() * 2);
      const roof = rng() < 0.32 ? mix('#7c6f58', '#4a4234', t) : mix('#c2b795', '#8d8266', t);
      px(c, x, y, w, h, roof);
      px(c, x, y, w, 1, mix('#e2d8bc', '#b8ac90', t));
      px(c, x, y + h, w, 1, 'rgba(60,52,38,' + (0.16 + t * 0.24).toFixed(2) + ')');
      if (t > 0.45 && rng() < 0.30) px(c, x + w, y + 1, 1, h, 'rgba(60,52,38,.22)');
    }
    /* the haze again, over the far blocks, so distance reads */
    for (let i = 0; i < 14; i++) {
      px(c, 0, HZ + i, CW, 1, 'rgba(236,226,206,' + (0.34 - i * 0.024).toFixed(3) + ')');
    }

    /* ------------------------------------------------------------
       THE RIVER, meandering, with its banks and its bridges.
       ------------------------------------------------------------ */
    const river = [];
    for (let x = 0; x < CW; x++) {
      river[x] = 82 + Math.round(Math.sin(x / 66) * 8 + Math.sin(x / 17) * 2 - x * 0.030);
    }
    for (let x = 0; x < CW; x++) {
      const y = river[x], t = (y - HZ) / (CH - HZ), w = Math.round(4 + t * 5);
      px(c, x, y - 1, 1, 1, '#8d8266');
      px(c, x, y, 1, w, mix('#6f9db4', '#4e7f9c', t));
      px(c, x, y, 1, 1, '#a8ccdc');
      px(c, x, y + w, 1, 1, '#7c6f58');
      if (x > 150 && x < 200 && (x % 3)) px(c, x, y + 1, 1, 2, 'rgba(255,240,200,.30)');
    }
    for (let b = 0; b < 7; b++) {                         /* the bridges */
      const x = 14 + b * 30, y = river[x], t = (y - HZ) / (CH - HZ);
      px(c, x, y - 1, 3, Math.round(6 + t * 5), '#d8cdb0');
      px(c, x, y - 1, 3, 1, '#f0e6c8');
    }
    /* the island in the middle of it */
    const ix = 108, iy = river[ix];
    px(c, ix - 12, iy + 1, 26, 4, '#b8ac90');
    px(c, ix - 12, iy + 1, 26, 1, '#d8cdb0');
    px(c, ix - 2, iy - 1, 5, 5, '#8d8266');

    /* THE ETOILE: a ring, and the arch standing in the middle of it */
    for (let a = 0; a < 40; a++) {
      const th = (a / 40) * Math.PI * 2;
      px(c, Math.round(ex + Math.cos(th) * 9), Math.round(ey + Math.sin(th) * 6), 2, 1, '#e6dcc0');
    }
    px(c, ex - 3, ey - 3, 7, 6, '#e8dec2');
    px(c, ex - 3, ey - 3, 7, 1, '#fff6dc');
    px(c, ex - 1, ey - 1, 3, 4, '#8d8266');
    px(c, ex + 4, ey + 3, 5, 2, 'rgba(60,52,38,.34)');

    /* THE TOWER, on the bank, with its shadow lying east. Iron in
       the morning is warm and pale, not a black stump. */
    const tx = 150, tb = river[tx] + 9;
    px(c, tx + 3, tb - 1, 30, 3, 'rgba(60,52,38,.30)');
    for (let i = 0; i < 30; i++) {
      const hw = Math.max(1, Math.round(7 * Math.pow(1 - i / 30, 1.9)));
      px(c, tx - hw, tb - i, hw * 2, 1, i > 26 ? '#b8a486' : '#a08c68');
      px(c, tx - hw, tb - i, 1, 1, '#c2b092');
      if (i === 9 || i === 18) px(c, tx - hw - 2, tb - i, hw * 2 + 4, 1, '#c9b795');
    }
    px(c, tx - 7, tb - 3, 3, 4, '#8d7856'); px(c, tx + 4, tb - 3, 3, 4, '#8d7856');
    px(c, tx - 6, tb - 6, 12, 1, '#c9b795');

    /* ------------------------------------------------------------
       THE WING across the bottom of the frame, on a diagonal
       because the aircraft is banking onto final.
       ------------------------------------------------------------ */
    for (let x = 0; x < 172; x++) {
      const y = CH - 30 + Math.round(x * 0.115);
      const th = Math.round(15 - x * 0.045);
      px(c, x, y, 1, th, '#8d8fa0');
      px(c, x, y, 1, 2, '#c2c4d2');
      px(c, x, y + th - 2, 1, 2, '#5f6270');
      if (x % 24 < 2 && x > 30) px(c, x, y + 2, 1, th - 4, 'rgba(50,52,62,.5)');
    }
    /* the engine, slung UNDER the wing and forward of it */
    px(c, 26, CH - 12, 8, 6, '#5f6270');                  /* the pylon */
    px(c, 20, CH - 8, 44, 16, '#6a6d7c');
    px(c, 20, CH - 8, 44, 3, '#a0a3b4');
    px(c, 20, CH - 8, 44, 1, '#c8cad6');
    px(c, 18, CH - 6, 4, 12, '#3a3d48');                  /* the fan face */
    px(c, 19, CH - 4, 2, 8, '#22242c');
    px(c, 62, CH - 5, 4, 10, '#2a2d38');
    px(c, 166, CH - 8, 5, 7, '#ff6a5e');                  /* the wingtip light */
    px(c, 167, CH - 7, 3, 5, '#ffd0c8');
  }

  /* ------------------------------------------------------------
     THE CAPTAIN'S OFFICE.

     The paper test used to play with nothing behind it, which
     meant it played over whatever happened to be on screen — on
     a first run, the title board, with the buttons showing. A
     scene needs a set, so here is the set: his desk, his window,
     his filing cabinet, and the form waiting on the near edge.

     `stage` is 'paper' while you are filling it in and 'stamp'
     once he has signed the thing.
     ------------------------------------------------------------ */
  function officeCard(c, stage) {
    /* the wall, and the light coming through the blind */
    px(c, 0, 0, CW, CH, '#4a4438');
    for (let i = 0; i < 40; i++) px(c, 0, i, CW, 1, 'rgba(255,240,200,' + (0.05 - i * 0.001).toFixed(3) + ')');
    px(c, 0, 60, CW, 3, '#5f5748');
    px(c, 0, 63, CW, 20, '#3f3a30');
    /* THE WINDOW, with a venetian blind half down. He sits in front
       of it, which is how you get a captain in silhouette. */
    px(c, 4, 8, 78, 52, '#2a261e');
    for (let i = 0; i < 48; i++) {
      const t = i / 48;
      px(c, 7, 11 + i, 72, 1, mix('#9fc4dc', '#e8dcb8', t));
    }
    for (let i = 0; i < 28; i += 3) {
      px(c, 7, 11 + i, 72, 2, 'rgba(40,36,28,.80)');
      px(c, 7, 11 + i, 72, 1, 'rgba(180,170,140,.35)');
    }
    px(c, 7, 38, 72, 1, '#2a261e');
    px(c, 74, 10, 3, 28, '#2a261e');                     /* the cord */
    px(c, 4, 58, 78, 4, '#5f5748');
    /* the light it throws across the wall */
    for (let i = 0; i < 22; i++) {
      px(c, 84 + i * 2, 12 + i, 34, 2, 'rgba(255,240,200,.04)');
    }
    /* THE PORTRAIT, and the clock next to it */
    px(c, 100, 10, 34, 28, '#3a2f1e');
    px(c, 103, 13, 28, 22, '#8d8672');
    px(c, 107, 17, 9, 12, '#5e9a56');
    px(c, 108, 20, 2, 2, '#12101d'); px(c, 113, 20, 2, 2, '#12101d');
    px(c, 118, 19, 10, 10, '#2a3a4a');
    px(c, 103, 32, 28, 3, '#6b6558');
    PIX.disc(c, 152, 24, 11, '#2a261e');
    PIX.disc(c, 152, 24, 9, '#dcd6c2');
    px(c, 152, 17, 1, 8, '#2a261e'); px(c, 152, 24, 6, 1, '#2a261e');
    PIX.disc(c, 152, 24, 1, '#8a2a1a');
    /* THE FILING CABINET, and the plant nobody waters */
    px(c, 176, 22, 40, 61, '#4e4a42');
    px(c, 176, 22, 40, 2, '#6b6558');
    for (let i = 0; i < 3; i++) {
      px(c, 179, 28 + i * 18, 34, 16, '#3f3b34');
      px(c, 179, 28 + i * 18, 34, 1, '#5a554a');
      px(c, 190, 34 + i * 18, 12, 3, '#8d8672');
    }
    px(c, 182, 6, 28, 16, '#3a2f1e');
    for (let i = 0; i < 5; i++) {
      PIX.disc(c, 188 + i * 5, 8 - (i % 2) * 3, 5, '#4a7f44');
      PIX.disc(c, 188 + i * 5, 8 - (i % 2) * 3, 3, '#5e9a56');
    }
    /* ------------------------------------------------------------
       THE CAPTAIN, sitting against his own window, which means you
       get him in half-silhouette. He is two feet away across a
       desk, so he is drawn at the size that implies and not at the
       size of somebody standing in a queue.
       ------------------------------------------------------------ */
    const kx = 40, kb = 84;                              /* centre, and the desk line */
    px(c, kx - 26, kb - 30, 52, 30, '#2f3646');          /* the shoulders */
    px(c, kx - 26, kb - 30, 52, 3, '#3f4758');
    px(c, kx - 26, kb - 30, 4, 30, '#232936');
    px(c, kx + 22, kb - 30, 4, 30, '#232936');
    px(c, kx - 9, kb - 30, 18, 30, '#3a4152');           /* the shirt front */
    px(c, kx - 9, kb - 30, 18, 2, '#4a5366');
    px(c, kx - 2, kb - 28, 4, 26, '#7a1e10');            /* and a tie on it */
    px(c, kx - 12, kb - 32, 24, 4, '#c9c0a8');           /* the collar */
    px(c, kx - 12, kb - 32, 24, 1, '#e2d8bc');
    px(c, kx + 12, kb - 26, 5, 5, '#e0a63c');            /* the shield on his chest */
    px(c, kx + 13, kb - 25, 3, 3, '#8a5a1a');
    /* the head, big, and lit only down one side */
    px(c, kx - 13, kb - 56, 26, 25, '#4f7f4a');
    px(c, kx - 13, kb - 56, 26, 3, '#639a5c');
    px(c, kx - 13, kb - 56, 6, 25, '#365a33');
    px(c, kx - 14, kb - 50, 1, 13, '#365a33');
    px(c, kx + 13, kb - 50, 1, 13, '#365a33');
    px(c, kx - 11, kb - 36, 22, 5, '#3d6839');           /* the jaw */
    /* eyes with a brow over them, and a mouth that is not enjoying this */
    px(c, kx - 9, kb - 50, 8, 3, '#e8e0cc'); px(c, kx + 2, kb - 50, 8, 3, '#e8e0cc');
    px(c, kx - 6, kb - 50, 3, 3, '#12101d'); px(c, kx + 5, kb - 50, 3, 3, '#12101d');
    px(c, kx - 10, kb - 53, 9, 2, '#2f5230'); px(c, kx + 1, kb - 53, 9, 2, '#2f5230');
    px(c, kx - 6, kb - 40, 13, 2, '#2a4426');
    px(c, kx - 7, kb - 41, 2, 2, '#2a4426');
    /* the cap, with a peak on it */
    px(c, kx - 14, kb - 64, 28, 8, '#1d3a62');
    px(c, kx - 14, kb - 64, 28, 2, '#2f4a70');
    px(c, kx - 4, kb - 63, 9, 5, '#e0a63c');
    px(c, kx - 17, kb - 57, 34, 3, '#141a26');
    px(c, kx - 17, kb - 57, 34, 1, '#2a3446');
    /* his hands, resting on the desk top and not hovering above it */
    px(c, kx - 26, kb, 14, 7, '#4f7f4a');
    px(c, kx - 26, kb, 14, 2, '#639a5c');
    px(c, kx - 26, kb + 6, 14, 1, '#365a33');
    px(c, kx + 12, kb, 14, 7, '#4f7f4a');
    px(c, kx + 12, kb, 14, 2, '#639a5c');
    px(c, kx + 12, kb + 6, 14, 1, '#365a33');
    /* ------------------------------------------------------------
       THE DESK, across the frame, seen from the chair you are in.
       ------------------------------------------------------------ */
    px(c, 0, 83, CW, 8, '#6b5334');
    px(c, 0, 83, CW, 2, '#8a6c44');
    px(c, 0, 91, CW, 33, '#4a3a24');
    for (let i = 0; i < CW; i += 26) px(c, i, 91, 1, 33, 'rgba(0,0,0,.22)');
    px(c, 0, 118, CW, 6, '#3f3120');
    /* the blotter */
    px(c, 62, 86, 96, 30, '#2f4a34');
    px(c, 62, 86, 96, 2, '#3f6142');
    px(c, 62, 114, 96, 2, '#22381f');
    /* the lamp, on, over on the far side */
    px(c, 148, 70, 4, 14, '#3a3d48');
    px(c, 140, 62, 20, 8, '#2a3a4a');
    px(c, 142, 68, 16, 3, '#ffd98a');
    for (let i = 1; i <= 4; i++) {
      PIX.disc(c, 150, 72, 6 + i * 5, 'rgba(255,217,138,' + (0.05 - i * 0.009).toFixed(3) + ')');
    }
    px(c, 142, 82, 18, 3, '#2a3a4a');
    /* the typewriter, shoved to one side */
    px(c, 166, 68, 40, 17, '#3a3d48');
    px(c, 166, 68, 40, 2, '#565b6c');
    px(c, 170, 62, 32, 7, '#2a2d38');
    px(c, 172, 63, 28, 4, '#c9c0a8');
    for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) {
      px(c, 170 + i * 4, 74 + r * 5, 3, 3, '#8d8672');
    }
    px(c, 164, 82, 44, 3, '#2a2d38');
    /* a stack of dossiers, in the gap between him and the typewriter */
    for (let i = 0; i < 5; i++) {
      px(c, 108 + (i % 2), 78 - i * 3, 26, 4, i % 2 ? '#c9c0a8' : '#b8ae94');
      px(c, 108 + (i % 2), 78 - i * 3, 26, 1, '#e2d8bc');
      px(c, 110 + (i % 2), 80 - i * 3, 8, 1, '#8a2a1a');
    }
    /* ------------------------------------------------------------
       THE FORM, on the near edge of the desk, facing you.
       ------------------------------------------------------------ */
    px(c, 72, 90, 76, 32, '#efe6cc');
    px(c, 72, 90, 76, 2, '#ffffff');
    px(c, 72, 120, 76, 2, '#c9c0a8');
    px(c, 76, 94, 30, 3, '#5f5344');
    for (let i = 0; i < 6; i++) {
      px(c, 76, 101 + i * 3, 60 - (i % 3) * 8, 1, '#8d8672');
    }
    px(c, 130, 94, 14, 12, '#dcd0b0');
    px(c, 131, 95, 12, 10, '#8ab894');
    px(c, 133, 97, 8, 6, '#4f7f4a');
    /* the pen, uncapped, lying where you left it */
    for (let i = 0; i < 22; i++) px(c, 96 + i, 118 - Math.round(i * 0.3), 1, 3, '#22262e');
    px(c, 94, 118, 4, 3, '#c9a24a');
    px(c, 116, 112, 4, 3, '#8a2a1a');
    if (stage === 'stamp') {
      /* HE HAS SIGNED IT. */
      for (let i = 0; i < 22; i++) {
        const t = i / 22;
        px(c, 100 - Math.round(t * 3), 96 + i, Math.round(6 + t * 3), 1, 'rgba(122,30,16,.0)');
      }
      px(c, 92, 96, 46, 20, 'rgba(122,30,16,.14)');
      px(c, 92, 96, 46, 2, '#7a1e10'); px(c, 92, 114, 46, 2, '#7a1e10');
      px(c, 92, 96, 2, 20, '#7a1e10'); px(c, 136, 96, 2, 20, '#7a1e10');
      const st = PIXFONT.render('ADMIS', { scale: 1, color: '#7a1e10', shadow: null });
      c.drawImage(st, 92 + Math.round((46 - st.width) / 2), 103);
    }
  }

  /* ============================================================
     THE REEL.
     ============================================================ */

  async function play() {
    CINE.letterbox(true);
    skipping = false;
    /* every beat goes through here so one press gets you out of all of them */
    const show = async (paint, opts) => {
      if (skipping) throw SKIP;
      const r = await rawShow(paint, opts);
      if (skipping || r === '__skip') { skipping = true; throw SKIP; }
      return r;
    };
    try {
      /* ---- 1. THE HOUSE ---- */
      await show((c) => houseCard(c, false), {
        head: 'SIX YEARS AGO', line: 'YOU GOT OFF SHIFT AT ELEVEN.',
        foot: 'TAP',
      });
      await show((c) => houseCard(c, true), {
        line: 'THE DOOR WAS ALREADY OPEN.',
        foot: 'TAP',
      });

      /* ---- 2. THE ROOM. Three places, and you have to look. ---- */
      let found = false, looks = 0;
      const looked = {};
      const HOT = [
        { id: 'chair', x: 24, y: 44, w: 46, h: 46, label: 'THE CHAIR' },
        { id: 'window', x: 164, y: 16, w: 54, h: 60, label: 'THE WINDOW' },
        { id: 'table', x: 96, y: 52, w: 54, h: 38, label: 'THE TABLE' },
      ];
      const SAID = {
        chair: 'HER CHAIR. NOBODY IN IT. NOTHING UNDER IT.',
        window: 'OPEN FROM THE INSIDE. HE WAS LET IN.',
        table: 'AN ASHTRAY. YOU DO NOT SMOKE. SHE NEVER DID.',
      };
      while (!found) {
        const pick = await show((c) => roomCard(c, looked.table), {
          head: looks ? 'WHAT ELSE' : 'LOOK AT SOMETHING',
          line: looks ? null : 'THE ROOM IS THE ONLY WITNESS YOU ARE GOING TO GET.',
          foot: 'THREE PLACES. ONE OF THEM MATTERS.',
          hot: HOT.map(h => ({ ...h, done: !!looked[h.id] })),
        });
        looks++;
        looked[pick] = true;
        await TUTOR.say(SAID[pick] || 'NOTHING.',
          { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });
        if (pick === 'table') found = true;
      }

      /* ---- 3. THE THING HE LEFT ---- */
      await show(buttCard, {
        head: 'IN THE ASHTRAY',
        line: 'HALF SMOKED. STILL WARM. AND NOBODY IN THIS STATE SELLS THEM.',
        foot: 'TAP',
      });
      await TUTOR.say('GAULOISE. PARIS.',
        { name: 'YOU', nameCol: PIX.PAL.F, rim: PIX.PAL.t });

      /* ---- 4. THE DEPARTURE. The first real decision. ---- */
      await show((c) => airportCard(c, null), {
        head: 'THREE WEEKS LATER', line: 'ORLY, BY WAY OF EVERYTHING YOU OWNED.',
        foot: 'TAP',
      });
      let through = false, tries = 0;
      while (!through) {
        const pick = await TUTOR.ask(
          tries ? 'SIR. THE BAG. AGAIN.' : 'ANYTHING TO DECLARE? ANYTHING ON YOU?',
          [
            { label: 'HAND OVER THE PISTOL.', note: 'IT GOES IN THE HOLD. YOU GET IT BACK.' },
            { label: 'NOTHING ON ME.', note: 'THERE IS SOMETHING ON YOU' },
            { label: 'I AM A POLICE OFFICER.', note: 'NOT IN THIS COUNTRY YOU ARE NOT' },
          ],
          { name: 'SECURITY', nameCol: PIX.PAL.L, rim: PIX.PAL.l, big: true });
        if (pick === 0) {
          await show((c) => airportCard(c, 'gun'), {
            head: 'THE TRAY',
            line: 'THEY TAG IT, THEY BAG IT, AND IT FLIES IN THE HOLD LIKE A SUITCASE.',
            foot: 'TAP',
          });
          await TUTOR.say('IT WILL BE AT THE DESK AT ORLY. SIGN FOR IT THERE.',
            { name: 'SECURITY', nameCol: PIX.PAL.L, rim: PIX.PAL.l });
          through = true;
          G.introClean = true;
        } else {
          tries++;
          await show((c) => airportCard(c, 'stopped'), {
            head: 'THE MACHINE DISAGREES',
            line: pick === 2
              ? 'A BADGE FROM SIX THOUSAND MILES AWAY IS A PIECE OF TIN HERE.'
              : 'IT WENT THROUGH THE MACHINE. THE MACHINE DOES NOT CARE WHAT YOU SAID.',
            foot: 'TAP',
          });
          G.introClean = false;
        }
      }

      /* ---- 5. THE FLIGHT ---- */
      await show((c) => cabinCard(c, true), {
        head: 'SOMEWHERE OVER THE ATLANTIC',
        line: 'NINE HOURS. YOU DID NOT SLEEP FOR ANY OF THEM.',
        foot: 'TAP',
      });
      await show((c) => cabinCard(c, false), {
        line: 'YOU HAVE ONE THING. A CIGARETTE END AND THE CITY THAT MAKES THEM.',
        foot: 'TAP',
      });

      /* ---- 6. THE DESCENT ---- */
      await show(descentCard, {
        head: 'PARIS',
        line: 'SIX MILLION OF THEM DOWN THERE AND ONE OF THEM WAS IN YOUR HOUSE.',
        foot: 'TAP',
      });
    } catch (e) {
      if (e !== SKIP) throw e;
    } finally {
      CINE.letterbox(false);
      const root = CINE.stage();
      root.innerHTML = ''; root.className = 'hidden';
    }
  }

  /* ============================================================
     THE APPLICATION.

     A foreign cop with a dead family and a cigarette end does not
     get handed a case. He gets handed a form.

     Four questions on paper, and six shots on the range. The
     paper is real — the answers are in the game's own rules, and
     getting them wrong costs you standing with the captain before
     you have met him. The range is the same steady-hand meter
     every other trade in this game uses, because it is the same
     hand.
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
    if (skipping) {
      G.paperScore = 2; G.rangeScore = 4; G.badge = true; G.applied = true;
      if (G.introClean === undefined) G.introClean = true;
      drop();
      CINE.letterbox(false);
      return CINE.titleBeat('BRIGADE CRIMINELLE', 'CONDITIONAL. DO NOT MAKE ME REGRET IT.',
        PIX.PAL.g);
    }
    /* ---- THE PAPER ---- */
    CINE.letterbox(true);
    hold((c) => officeCard(c, 'paper'), { head: 'BRIGADE CRIMINELLE - 36 QUAI DES ORFEVRES' });
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
    hold((c) => officeCard(c, 'stamp'), { head: 'SIGNED' });
    await TUTOR.say('DOWNSTAIRS. SIX SHOTS. I WANT FOUR.',
      { name: 'THE CAPTAIN', nameCol: PIX.PAL.S, rim: PIX.PAL.s });
    drop();
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
    play, application, PAPER, hold, drop, skip,
    skipped() { return skipping; },
    /* the cards, exposed so the harness can shoot them without playing */
    cards: { houseCard, roomCard, buttCard, airportCard, cabinCard, descentCard, officeCard },
    CW, CH,
  };
})();
