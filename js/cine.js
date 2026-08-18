'use strict';
/* ============================================================
   SHELL & DEBT — cine.js
   The stuff between the things you do: the card-rack wipe every
   screen change goes behind, the lamp clicking on when you sit,
   the boss walking in under letterbox bars, and the ante-clear
   interstitial where the night's take rains down on the felt.

   Everything here is skippable. Nothing here decides anything.
   ============================================================ */

const CINE = {

  busy: false,
  _tex: null,

  root() {
    let r = document.getElementById('cine-root');
    if (!r) {
      r = U.el('div');
      r.id = 'cine-root';
      r.className = 'hidden';
      document.body.appendChild(r);
    }
    return r;
  },

  /* The cutscene layer is deliberately NOT the wipe layer: a wipe that
     finished while a cut-in was still playing used to erase it. */
  stage() {
    let r = document.getElementById('cine-stage');
    if (!r) {
      r = U.el('div');
      r.id = 'cine-stage';
      r.className = 'hidden';
      document.body.appendChild(r);
    }
    return r;
  },

  amb() {
    let r = document.getElementById('cine-amb');
    if (!r) {
      r = U.el('div');
      r.id = 'cine-amb';
      document.body.appendChild(r);
    }
    return r;
  },

  /* upscale a sprite once and keep it as a CSS-usable data URI, so the
     DOM half of the cinematics uses the same pixels the canvas does */
  _urls: {},
  url(name, master, k) {
    const key = name + '@' + k;
    if (CINE._urls[key]) return CINE._urls[key];
    const cv = document.createElement('canvas');
    cv.width = master.width * k; cv.height = master.height * k;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(master, 0, 0, cv.width, cv.height);
    CINE._urls[key] = { url: cv.toDataURL(), w: cv.width, h: cv.height };
    return CINE._urls[key];
  },

  /* the card back, tileable */
  tex() { return CINE.url('back', SPR.cardBack(), 3); },
  chipTex() { return CINE.url('chip', PIX.make('ic_chip', 1), 4); },

  /* ============================================================
     THE WIPE. A rack of card backs sweeps shut across the frame,
     the screen changes behind it, then the same rack keeps going
     and sweeps off the other side. Alternate columns run opposite
     ways, staggered, on steps() timing so it reads as pixels.
     ============================================================ */
  async transition(fn, opts) {
    opts = opts || {};
    if (CINE.busy) { if (fn) fn(); return; }
    CINE.busy = true;
    const root = CINE.root();
    const tex = CINE.tex();
    root.className = 'wipe';
    root.innerHTML = '';
    const w = tex.w;
    const n = Math.ceil(window.innerWidth / w) + 1;
    for (let i = 0; i < n; i++) {
      const c = U.el('div', 'wcol ' + (i % 2 ? 'wd' : 'wu'));
      c.style.left = (i * w) + 'px';
      c.style.width = w + 'px';
      c.style.backgroundImage = 'url(' + tex.url + ')';
      c.style.backgroundSize = tex.w + 'px ' + tex.h + 'px';
      c.style.transitionDelay = (i * 6) + 'ms';
      root.appendChild(c);
    }
    SFX.deal();
    try {
      await U.sleep(24);
      root.classList.add('shut');
      await U.sleep(190 + n * 6);
      SFX.click();
      if (fn) fn();
      if (opts.hold) await U.sleep(opts.hold);
      root.classList.add('open');
      await U.sleep(210 + n * 6);
    } finally {
      root.innerHTML = '';
      root.className = 'hidden';
      CINE.busy = false;
    }
  },

  /* the lights going out, for anything that ends badly */
  async iris(fn, hold) {
    if (CINE.busy) { if (fn) fn(); return; }
    CINE.busy = true;
    const root = CINE.root();
    root.className = 'iris';
    root.innerHTML = '';
    root.appendChild(U.el('div', 'iris-lid'));
    try {
      await U.sleep(24);
      root.classList.add('shut');
      await U.sleep(560);
      if (fn) fn();
      if (hold) await U.sleep(hold);
      root.classList.add('open');
      await U.sleep(480);
    } finally {
      root.innerHTML = '';
      root.className = 'hidden';
      CINE.busy = false;
    }
  },

  /* ============================================================
     BLOOD ON THE LENS.

     You do not watch him fall. The shot lands and the next thing
     that happens is on the glass in front of you: one splat, then
     four, then the frame is gone. Behind it the scene changes.
     Then it wipes, badly, the way a sleeve wipes a lens.
     ============================================================ */
  async bloodWipe(fn, hold) {
    if (CINE.busy) { if (fn) fn(); return; }
    CINE.busy = true;
    const root = CINE.root();
    root.className = 'blood';
    root.innerHTML = '';
    const sheet = U.el('div', 'blood-sheet');
    root.appendChild(sheet);

    /* the splats, biggest first, thrown from the middle of the frame */
    const W = window.innerWidth, H = window.innerHeight;
    const K = Math.max(2, Math.round(Math.min(W, H) / 260));
    const plan = [
      [46, 50, 50, 0], [34, 30, 38, 70], [30, 72, 60, 120],
      [26, 18, 66, 190], [24, 84, 30, 250], [20, 58, 22, 310],
      [18, 40, 82, 360], [16, 90, 74, 410],
    ];
    plan.forEach(([r, px, py, delay], i) => {
      const art = CINE.url('splat' + i, SPR.bloodSplat(1000 + i * 37, r), K);
      const el = U.el('i', 'bsplat');
      el.style.backgroundImage = 'url(' + art.url + ')';
      el.style.width = art.w + 'px';
      el.style.height = art.h + 'px';
      el.style.left = 'calc(' + px + '% - ' + (art.w / 2) + 'px)';
      el.style.top = 'calc(' + py + '% - ' + (art.h / 2) + 'px)';
      el.style.animationDelay = delay + 'ms';
      sheet.appendChild(el);
    });

    try {
      SFX.hurt();
      await U.sleep(120);
      FX.screen.shake && FX.screen.shake(14);
      await U.sleep(460);
      SFX.tone(60, 0.5, 'sawtooth', 0.2, 0, -22);
      root.classList.add('flood');          // and the rest of the glass goes
      await U.sleep(420);
      if (fn) fn();
      if (hold) await U.sleep(hold);
      root.classList.add('wipe');           // a sleeve, badly, in two strokes
      await U.sleep(620);
    } finally {
      root.innerHTML = '';
      root.className = 'hidden';
      CINE.busy = false;
    }
  },

  /* ============================================================
     SITTING DOWN. The room is dark; the lamp above the table
     clicks on; the camera settles in on the felt; a lower third
     tells you whose chair this is.
     ============================================================ */
  async sitDown(opp, blindName) {
    DUEL.dark = 1; DUEL.lamp = 0;
    CINE.pushIn(1.09, 900);
    await DUEL.sleep(260);
    /* the tube stutters before it takes */
    for (const [on, ms] of [[0.5, 60], [0, 70], [0.85, 50], [0.15, 60], [1, 0]]) {
      DUEL.lamp = on;
      DUEL.dark = 1 - on * 0.85;
      SFX.click();
      if (ms) await DUEL.sleep(ms);
    }
    SFX.chak();
    FX.screen.flash && FX.screen.flash(PIX.PAL.Y, 0.22);
    DUEL.dark = 0.15; DUEL.lamp = 1;
    await DUEL.sleep(120);
    DUEL.dark = 0;
    await CINE.lowerThird(blindName, opp.name, 'PURSE ' + E.purse(),
      opp.boss ? PIX.PAL.R : PIX.PAL.G);
  },

  /* the camera easing in toward the table */
  pushIn(from, ms) {
    const cv = document.getElementById('scene');
    if (!cv) return;
    cv.style.transition = 'none';
    cv.style.transformOrigin = '50% 56%';
    cv.style.transform = 'scale(' + from + ')';
    requestAnimationFrame(() => {
      cv.style.transition = 'transform ' + ms + 'ms steps(10)';
      cv.style.transform = 'scale(1)';
    });
    clearTimeout(CINE._pinTo);
    CINE._pinTo = setTimeout(() => { cv.style.transition = ''; cv.style.transform = ''; }, ms + 120);
  },

  /* a plaque that slides in along the bottom of the frame and leaves */
  async lowerThird(title, name, sub, col) {
    const root = CINE.stage();
    root.className = 'plate';
    root.innerHTML = '';
    const p = U.el('div', 'cine-plate');
    const bar = U.el('div', 'cine-plate-bar');
    p.appendChild(bar);
    const body = U.el('div', 'cine-plate-body');
    if (title) body.appendChild(UI.txt(title, { scale: 3, color: col || PIX.PAL.G }));
    if (name) body.appendChild(UI.txt(name, { scale: 5, color: PIX.PAL.W, outline: PIX.PAL.K }));
    if (sub) body.appendChild(UI.txt(sub, { scale: 3, color: PIX.PAL.q }));
    p.appendChild(body);
    root.appendChild(p);
    await U.sleep(20);
    p.classList.add('in');
    await DUEL.sleep(1250);
    p.classList.add('out');
    await U.sleep(280);
    root.innerHTML = '';
    root.className = 'hidden';
  },

  /* ============================================================
     A BOSS WALKS IN. Bars close over the top and bottom of the
     frame, his shape crosses the room, his name lands like a
     stamp, then the bars go and you are looking at him.
     ============================================================ */
  letterbox(on) {
    let l = document.getElementById('cine-bars');
    if (!l) {
      l = U.el('div');
      l.id = 'cine-bars';
      l.appendChild(U.el('i', 'bar-t'));
      l.appendChild(U.el('i', 'bar-b'));
      document.body.appendChild(l);
    }
    l.className = on ? 'on' : '';
  },

  async bossEntrance(opp) {
    CINE.letterbox(true);
    DUEL.dark = 0.55;
    const root = CINE.stage();
    root.className = 'boss-cut';
    root.innerHTML = '';
    /* his silhouette crossing the room, big and backlit. Integer scale only,
       picked off the viewport — a fractional one gives uneven pixels. */
    const sil = U.el('div', 'boss-sil');
    const k = U.clamp(Math.floor(Math.min(window.innerWidth * 0.30, window.innerHeight * 0.46) / 46), 3, 9);
    sil.appendChild(SPR.clone(SPR.frogCustom(opp.boss + ':cut', opp.def), k));
    root.appendChild(sil);
    SFX.tone(70, 0.9, 'sawtooth', 0.22, 0, -18);
    await U.sleep(30);
    sil.classList.add('in');
    await DUEL.sleep(560);
    /* the name lands */
    const nm = U.el('div', 'boss-slug');
    nm.appendChild(UI.txt(opp.name, { scale: 7, color: PIX.PAL.R, outline: PIX.PAL.K }));
    nm.appendChild(UI.txt(opp.rule, { scale: 3, color: PIX.PAL.G }));
    root.appendChild(nm);
    UI.shake();
    SFX.lose();
    FX.screen.flash && FX.screen.flash(PIX.PAL.R, 0.3);
    await DUEL.sleep(1100);
    sil.classList.add('out');
    nm.classList.add('out');
    await U.sleep(300);
    root.innerHTML = '';
    root.className = 'hidden';
    DUEL.dark = 0;
    CINE.letterbox(false);
  },

  /* ============================================================
     LOADING UP.
     The camera pulls back from the board to the desk: the drum is
     open, six shells go in one at a time, it snaps shut, it spins.
     Any tap skips it.
     ============================================================ */
  async reloadRoom() {
    const root = CINE.stage();
    root.className = 'anim-cut';
    root.innerHTML = '';
    CINE.letterbox(true);
    const cv = document.createElement('canvas');
    const K = U.clamp(Math.floor(Math.min(window.innerWidth / 190, window.innerHeight / 130)), 2, 7);
    cv.width = 180 * K; cv.height = 108 * K;
    cv.className = 'pix anim-frame';
    root.appendChild(cv);
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.scale(K, K);

    let skip = false;
    const bail = () => { skip = true; };
    window.addEventListener('pointerdown', bail);
    window.addEventListener('keydown', bail);

    const P = PIX.PAL;
    const draw = (t) => {
      c.clearRect(0, 0, 180, 108);
      PIX.rect(c, 0, 0, 180, 108, '#0b0e13');
      /* the lamp cone */
      c.globalAlpha = 0.15; c.fillStyle = '#ffd75e';
      c.beginPath(); c.moveTo(92, 0); c.lineTo(30, 92); c.lineTo(156, 92); c.closePath(); c.fill();
      c.globalAlpha = 1;
      PIX.rect(c, 0, 88, 180, 20, '#1d160e');            // the desk
      PIX.rect(c, 0, 88, 180, 3, '#2c2114');
      /* the drum, open, huge in frame */
      const cx = 92, cy = 56;
      PIX.disc(c, cx, cy, 26, P.K);
      PIX.disc(c, cx, cy, 24, P.t);
      PIX.disc(c, cx, cy, 22, P.s);
      const shells = Math.min(6, Math.floor(t / 0.36));
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 - Math.PI / 2 + (t > 2.6 ? t * 9 : 0);
        const sx = Math.round(cx + Math.cos(a) * 13), sy = Math.round(cy + Math.sin(a) * 13);
        PIX.disc(c, sx, sy, 6, P.K);
        PIX.disc(c, sx, sy, 5, i < shells ? P.g : '#0d1015');
        if (i < shells) PIX.disc(c, sx, sy, 2, P.G);
      }
      PIX.disc(c, cx, cy, 4, P.K);
      /* your hands, blocks at the frame edge */
      PIX.rect(c, 40, 74, 26, 20, P.K);
      PIX.rect(c, 42, 76, 22, 18, '#2e7d5b');
      PIX.rect(c, 116, 70, 24, 24, P.K);
      PIX.rect(c, 118, 72, 20, 22, '#2e7d5b');
      /* one shell held up, on its way in */
      if (shells < 6) {
        const hy = 40 - (t % 0.36) * 40;
        PIX.rect(c, 124, Math.round(hy), 6, 10, P.K);
        PIX.rect(c, 125, Math.round(hy) + 1, 4, 8, P.g);
      }
      if (t > 2.6) {
        const lab = PIXFONT.render('LOADED.', { scale: 1, color: P.W, shadow: null });
        c.drawImage(lab, Math.round(92 - lab.width / 2), 96);
      }
    };

    try {
      const t0 = performance.now();
      let last = -1;
      while (!skip) {
        const t = (performance.now() - t0) / 1000;
        if (t > 3.4) break;
        draw(t);
        const beat = Math.floor(t / 0.36);
        if (beat !== last && beat < 6) { SFX.click(); last = beat; }
        if (beat === 6 && last === 5) { SFX.chak(); last = 7; }
        if (t > 2.6 && last === 7) { SFX.spin(); last = 8; }
        await U.sleep(33);
      }
    } finally {
      window.removeEventListener('pointerdown', bail);
      window.removeEventListener('keydown', bail);
      root.innerHTML = '';
      root.className = 'hidden';
      CINE.letterbox(false);
    }
  },

  /* ============================================================
     THE DRIVE. Rain, wipers, two depths of skyline going by, and
     the precinct at the end of it. This is the loading screen.
     ============================================================ */
  async driveTo() {
    const root = CINE.stage();
    root.className = 'anim-cut';
    root.innerHTML = '';
    const cv = document.createElement('canvas');
    const K = U.clamp(Math.floor(Math.min(window.innerWidth / 190, window.innerHeight / 130)), 2, 7);
    cv.width = 180 * K; cv.height = 108 * K;
    cv.className = 'pix anim-frame';
    root.appendChild(cv);
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.scale(K, K);

    let skip = false;
    const bail = () => { skip = true; };
    window.addEventListener('pointerdown', bail);
    window.addEventListener('keydown', bail);
    const P = PIX.PAL;
    const rng = U.mulberry32(99);
    const stars = [];
    for (let i = 0; i < 26; i++) stars.push([rng() * 180, rng() * 40]);

    const draw = (t) => {
      c.clearRect(0, 0, 180, 108);
      PIX.rect(c, 0, 0, 180, 108, '#070a12');
      stars.forEach(([sx, sy]) => PIX.rect(c, Math.round(sx), Math.round(sy), 1, 1, 'rgba(200,220,255,.35)'));
      /* far skyline, slow */
      const off1 = Math.round(t * 26) % 90;
      for (let i = -1; i < 4; i++) {
        const bx = i * 90 - off1;
        PIX.rect(c, bx, 34, 34, 46, '#10141f');
        PIX.rect(c, bx + 40, 24, 26, 56, '#0e1220');
        PIX.rect(c, bx + 70, 42, 16, 38, '#111627');
        for (let w = 0; w < 8; w++) {
          PIX.rect(c, bx + 4 + (w % 4) * 8, 40 + Math.floor(w / 4) * 12, 3, 4,
            (w + i) % 3 ? '#3a3520' : '#a5741f');
        }
      }
      /* near buildings, fast */
      const off2 = Math.round(t * 78) % 140;
      for (let i = -1; i < 3; i++) {
        const bx = i * 140 - off2;
        PIX.rect(c, bx, 52, 60, 30, '#151a28');
        PIX.rect(c, bx + 12, 56, 8, 10, '#e0a63c');
        PIX.rect(c, bx + 80, 46, 40, 36, '#121624');
        PIX.rect(c, bx + 88, 52, 7, 9, '#6e4c12');
        /* a streetlight */
        PIX.rect(c, bx + 66, 44, 2, 38, '#0b0e14');
        PIX.rect(c, bx + 62, 42, 10, 3, '#0b0e14');
        PIX.disc(c, bx + 67, 47, 3, '#fff3b0');
      }
      /* the road */
      PIX.rect(c, 0, 82, 180, 26, '#0d1016');
      PIX.rect(c, 0, 82, 180, 2, '#1c2230');
      const dash = Math.round(t * 120) % 24;
      for (let i = -1; i < 9; i++) PIX.rect(c, i * 24 - dash, 94, 12, 2, 'rgba(200,200,210,.35)');
      /* the car, bobbing */
      const bob = Math.round(Math.sin(t * 9) * 1);
      const carY = 70 + bob;
      PIX.rect(c, 56, carY + 2, 52, 12, P.K);
      PIX.rect(c, 58, carY + 3, 48, 10, '#2b3346');
      PIX.rect(c, 66, carY - 6, 30, 10, P.K);
      PIX.rect(c, 68, carY - 5, 26, 8, '#2b3346');
      PIX.rect(c, 70, carY - 3, 10, 5, '#7fd7ff');       // glass
      PIX.rect(c, 84, carY - 3, 8, 5, '#7fd7ff');
      PIX.disc(c, 66, carY + 14, 5, P.K); PIX.disc(c, 66, carY + 14, 3, '#3f465c');
      PIX.disc(c, 98, carY + 14, 5, P.K); PIX.disc(c, 98, carY + 14, 3, '#3f465c');
      /* headlight */
      c.globalAlpha = 0.2; c.fillStyle = '#fff3b0';
      c.beginPath(); c.moveTo(108, carY + 4); c.lineTo(150, carY - 2); c.lineTo(150, carY + 14); c.closePath(); c.fill();
      c.globalAlpha = 1;
      /* rain, driving sideways */
      for (let i = 0; i < 60; i++) {
        const rx = (i * 37 + Math.round(t * 220)) % 190 - 5;
        const ry = (i * 53) % 100;
        PIX.rect(c, 180 - rx, ry, 2, 1, 'rgba(127,215,255,.22)');
      }
      const lab = PIXFONT.render('TO THE PRECINCT', { scale: 1, color: P.q, shadow: null });
      c.drawImage(lab, Math.round(90 - lab.width / 2), 99);
    };

    try {
      SFX.tone(60, 2.4, 'sawtooth', 0.05, 0, 4);
      const t0 = performance.now();
      while (!skip) {
        const t = (performance.now() - t0) / 1000;
        if (t > 2.6) break;
        draw(t);
        await U.sleep(33);
      }
    } finally {
      window.removeEventListener('pointerdown', bail);
      window.removeEventListener('keydown', bail);
      root.innerHTML = '';
      root.className = 'hidden';
    }
  },

  /* ============================================================
     CLEANING UP.
     The little loading scene between the shot and the back room:
     you, small, dragging him by the boots across the dark.
     ============================================================ */
  async dragLoad() {
    const root = CINE.stage();
    root.className = 'anim-cut';
    root.innerHTML = '';
    const cv = document.createElement('canvas');
    const K = U.clamp(Math.floor(Math.min(window.innerWidth / 190, window.innerHeight / 130)), 2, 7);
    cv.width = 180 * K; cv.height = 108 * K;
    cv.className = 'pix anim-frame';
    root.appendChild(cv);
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.scale(K, K);

    let skip = false;
    const bail = () => { skip = true; };
    window.addEventListener('pointerdown', bail);
    window.addEventListener('keydown', bail);
    const P = PIX.PAL;

    const draw = (t) => {
      c.clearRect(0, 0, 180, 108);
      PIX.rect(c, 0, 0, 180, 108, '#0c0e14');
      /* one bare bulb over the middle of the room, swinging a little */
      const sw = Math.round(Math.sin(t * 2.2) * 3);
      PIX.rect(c, 90 + sw, 0, 1, 14, '#2a2d38');
      PIX.rect(c, 88 + sw, 14, 5, 4, '#3a3d48');
      PIX.rect(c, 89 + sw, 18, 3, 3, '#ffe9a3');
      PIX.rect(c, 88 + sw, 21, 5, 1, 'rgba(255,233,163,.5)');
      for (let i = 0; i < 8; i++) {                        // a thin beam, not a wall
        const yy = 22 + i * 8, hw = 3 + i * 3;
        PIX.rect(c, 90 + sw - hw, yy, hw * 2, 8, 'rgba(255,233,163,.05)');
        const cw = Math.max(2, Math.round(hw * 0.45));     // warmer core up the middle
        PIX.rect(c, 90 + sw - cw, yy, cw * 2, 8, 'rgba(255,233,163,.06)');
      }
      PIX.rect(c, 0, 84, 180, 24, '#181c28');
      PIX.rect(c, 0, 84, 180, 2, '#262b3a');
      PIX.rect(c, 90 + sw - 30, 84, 60, 2, 'rgba(255,233,163,.22)');  // the pool it leaves
      PIX.rect(c, 90 + sw - 22, 86, 44, 3, 'rgba(255,233,163,.09)');
      /* the doorway he is going through, stage left */
      PIX.rect(c, 6, 38, 26, 48, '#1f1913');
      PIX.rect(c, 9, 41, 20, 45, '#2e2416');
      PIX.rect(c, 25, 62, 2, 4, '#8d8672');               // knob
      const x0 = 150 - t * 34;                 // the sad little convoy
      const step = Math.floor(t * 6) % 2;
      /* him: flat on his back, arms trailing, fully intact */
      PIX.rect(c, x0 + 12, 74, 30, 9, P.K);
      PIX.rect(c, x0 + 13, 75, 28, 7, '#272c3d');
      PIX.disc(c, x0 + 44, 77, 6, P.K);
      PIX.disc(c, x0 + 44, 77, 5, '#2e7d5b');   // his head, lolling
      PIX.rect(c, x0 + 40, 70, 9, 3, P.K);      // hat, sliding off
      PIX.rect(c, x0 + 16, 82, 4, 4, P.K);      // trailing hand
      PIX.rect(c, x0 + 24, 83, 4, 3, P.K);
      /* you: leaned back into the pull, walking backwards, boots in hand */
      PIX.rect(c, x0 - 6, 66 + step, 13, 14, P.K);         // torso, tipped
      PIX.rect(c, x0 - 5, 67 + step, 11, 12, '#2e7d5b');
      PIX.rect(c, x0 - 10, 58 + step, 9, 9, P.K);          // head thrown back
      PIX.rect(c, x0 - 9, 59 + step, 7, 7, '#4fae6d');
      PIX.rect(c, x0 - 12, 56 + step, 12, 3, P.K);         // your hat stays on
      PIX.rect(c, x0 - 8, 57 + step, 2, 2, P.K);           // squeezed-shut eye
      PIX.rect(c, x0 + 4, 70 + step, 8, 3, P.K);           // arms, straight to the boots
      PIX.rect(c, x0 + 5, 71 + step, 6, 1, '#2e7d5b');
      PIX.rect(c, x0 + 10, 72, 8, 4, P.K);                 // his boots, in your fists
      PIX.rect(c, x0 - 8 + step * 2, 80, 5, 4, P.K);       // your feet, digging in
      PIX.rect(c, x0 - 1 - step * 2, 80, 5, 4, P.K);
      /* effort, in little pips */
      if (step) { PIX.rect(c, x0 - 13, 54, 2, 2, '#bfe3ff'); PIX.rect(c, x0 - 15, 58, 1, 1, '#bfe3ff'); }
      /* the smear he leaves */
      PIX.rect(c, Math.round(x0 + 46), 82, Math.round(170 - x0 - 40), 2, 'rgba(87,18,32,.5)');
      /* dust off the boards */
      if (step) PIX.rect(c, x0 + 8, 78, 2, 2, 'rgba(141,134,114,.4)');
      const lab = PIXFONT.render('CLEANING UP', { scale: 1, color: P.q, shadow: null });
      c.drawImage(lab, Math.round(90 - lab.width / 2), 96);
      const dots = '.'.repeat(1 + (Math.floor(t * 2) % 3));
      const d2 = PIXFONT.render(dots, { scale: 1, color: P.q, shadow: null });
      c.drawImage(d2, Math.round(90 + lab.width / 2 + 2), 96);
    };

    try {
      const t0 = performance.now();
      let lastGrunt = -1;
      while (!skip) {
        const t = (performance.now() - t0) / 1000;
        if (t > 2.4) break;
        draw(t);
        const g = Math.floor(t / 0.66);
        if (g !== lastGrunt) { SFX.tick(); lastGrunt = g; }
        await U.sleep(33);
      }
    } finally {
      window.removeEventListener('pointerdown', bail);
      window.removeEventListener('keydown', bail);
      root.innerHTML = '';
      root.className = 'hidden';
    }
  },

  /* ============================================================
     THE CUT-IN.
     Half a second of somebody's face crossing the frame on a
     skewed banner the moment a live round commits — the Persona
     beat. Red variant for the ones that end people.
     ============================================================ */
  cutIn(art, word, opts) {
    opts = opts || {};
    const layer = U.el('div', 'cutin' + (opts.red ? ' red' : ''));
    const band = U.el('div', 'ci-band');
    const inner = U.el('div', 'ci-inner');
    /* speed lines, drawn */
    const lines = document.createElement('canvas');
    lines.width = 480; lines.height = 120;
    const lc = lines.getContext('2d');
    for (let i = 0; i < 26; i++) {
      const y = (i * 37) % 120;
      lc.fillStyle = i % 3 ? 'rgba(244,239,224,.16)' : 'rgba(244,239,224,.34)';
      lc.fillRect((i * 53) % 200, y, 180 + (i * 29) % 160, 2);
    }
    lines.className = 'ci-lines pix';
    inner.appendChild(lines);
    const face = U.el('div', 'ci-face');
    face.appendChild(SPR.clone(art, U.clamp(Math.floor(window.innerHeight / 220), 2, 5)));
    inner.appendChild(face);
    if (word) {
      const w = U.el('div', 'ci-word');
      w.appendChild(PIXFONT.render(word, {
        scale: U.clamp(Math.floor(window.innerHeight / 170), 2, 6),
        color: opts.red ? PIX.PAL.R : PIX.PAL.W, outline: PIX.PAL.K,
      }));
      inner.appendChild(w);
    }
    band.appendChild(inner);
    layer.appendChild(band);
    document.body.appendChild(layer);
    SFX.chak();
    requestAnimationFrame(() => layer.classList.add('go'));
    setTimeout(() => layer.remove(), 620);
  },

  /* ============================================================
     THE MARKER CHANGES HANDS.
     One card, drawn, held long enough to read.
     ============================================================ */
  async deathCard(who) {
    const root = CINE.stage();
    root.className = 'death-cut';
    root.innerHTML = '';
    const card = U.el('div', 'death-card');
    const K = U.clamp(Math.floor(window.innerWidth / 300), 2, 6);
    card.appendChild(SPR.clone(SPR.titleCard({
      big: 'THE SWAMP KEEPS',
      huge: 'YOUR MARKER',
      sub: who ? 'TAKEN BY ' + who : '',
      foot: 'FLOOR ' + G.ante + ' OF 8',
      col: PIX.PAL.R,
    }), K));
    root.appendChild(card);
    await U.sleep(20);
    card.classList.add('in');
    SFX.tone(90, 1.2, 'sawtooth', 0.16, 0, -50);
    await DUEL.sleep(2100);
    card.classList.add('out');
    await U.sleep(320);
    root.innerHTML = '';
    root.className = 'hidden';
  },

  /* ============================================================
     ANTE CLEARED. The take rains onto the felt and the marker
     gets one more line struck off it.
     ============================================================ */
  async anteClear(ante, chips) {
    const root = CINE.stage();
    root.className = 'ante-cut';
    root.innerHTML = '';
    const card = U.el('div', 'ante-card');
    card.appendChild(UI.txt('ANTE ' + ante, { scale: 5, color: PIX.PAL.q }));
    card.appendChild(UI.txt('CLEARED', { scale: 8, color: PIX.PAL.G, outline: PIX.PAL.K }));
    const row = U.el('div', 'load-row');
    row.appendChild(UI.txt('YOU KEEP ' + U.fmt(chips), { scale: 3, color: PIX.PAL.W }));
    row.appendChild(UI.icon('ic_chip', 3));
    card.appendChild(row);
    card.appendChild(UI.txt('NEXT: ANTE ' + (ante + 1), { scale: 3, color: PIX.PAL.R }));
    root.appendChild(card);
    /* the take falling past the lens */
    const chip = CINE.chipTex();
    for (let i = 0; i < 26; i++) {
      const c = U.el('i', 'ante-chip');
      c.style.backgroundImage = 'url(' + chip.url + ')';
      c.style.width = chip.w + 'px';
      c.style.height = chip.h + 'px';
      c.style.left = (4 + Math.random() * 92) + '%';
      c.style.animationDelay = (Math.random() * 900) + 'ms';
      c.style.animationDuration = (900 + Math.random() * 700) + 'ms';
      c.style.setProperty('--sp', (0.7 + Math.random() * 0.7).toFixed(2));
      root.appendChild(c);
    }
    await U.sleep(20);
    card.classList.add('in');
    SFX.jackpot();
    await DUEL.sleep(1900);
    card.classList.add('out');
    await U.sleep(300);
    root.innerHTML = '';
    root.className = 'hidden';
  },

  /* ============================================================
     HOW YOU CAME TO BE HERE.
     Five rooms, one line each, no faces. It plays once at the
     top of a run and any tap skips the rest of it — a story you
     cannot get out of is not a story, it is a wall.
     ============================================================ */
  LORE: [
    ['lineup',  'YOU PICKED HIM OUT OF THE LINE. GOOD POLICE WORK.'],
    ['verdict', 'HIS LAWYERS HAD HIM OUT BY NOON.'],
    ['door',    'AT SEVEN, THE DOOR CAME IN.'],
    ['funeral', 'IT RAINED. HE SENT FLOWERS.'],
    ['oath',    'YOU KEPT THE BADGE. AND THE GUN.'],
  ],

  loreSkip: false,

  async lore(short) {
    const root = CINE.stage();
    root.className = 'lore-cut';
    root.innerHTML = '';
    CINE.loreSkip = false;
    CINE.letterbox(true);
    const bail = () => { CINE.loreSkip = true; };
    window.addEventListener('pointerdown', bail);
    window.addEventListener('keydown', bail);

    const hold = async (ms) => {
      const step = 40;
      for (let t = 0; t < ms; t += step) {
        if (CINE.loreSkip) return;
        await U.sleep(step);
      }
    };

    try {
      const reel = short ? CINE.LORE.slice(4) : CINE.LORE;
      for (const [art, line] of reel) {
        if (CINE.loreSkip) break;
        root.innerHTML = "";
        const card = U.el('div', 'lore-card');
        const k = U.clamp(Math.floor(Math.min(window.innerWidth * 0.92 / 180,
          window.innerHeight * 0.66 / 108)), 2, 7);
        card.appendChild(SPR.clone(SPR.lorePanel(art), k));
        const cap = U.el('div', 'lore-line');
        cap.appendChild(UI.txt(line, { scale: 3, color: PIX.PAL.w, outline: PIX.PAL.K }));
        card.appendChild(cap);
        root.appendChild(card);
        await U.sleep(20);
        card.classList.add('in');
        SFX.tone(90 + Math.random() * 20, 0.5, 'sine', 0.10, 0, -30);
        await hold(2100);
        card.classList.add('out');
        await U.sleep(CINE.loreSkip ? 40 : 320);
      }
      if (short) return;
      const tail = U.el('div', 'lore-card lore-tail');
      tail.appendChild(UI.txt('SHELL & DEBT', { scale: 7, color: PIX.PAL.R, outline: PIX.PAL.K }));
      tail.appendChild(UI.txt('FIND THEM FIRST', { scale: 3, color: PIX.PAL.q }));
      root.innerHTML = '';
      root.appendChild(tail);
      await U.sleep(20);
      tail.classList.add('in');
      SFX.lose();
      await hold(1500);
    } finally {
      window.removeEventListener('pointerdown', bail);
      window.removeEventListener('keydown', bail);
      root.innerHTML = '';
      root.className = 'hidden';
      CINE.letterbox(false);
    }
  },

  /* ============================================================
     THE CLIMB. Between antes: the house from the street with one
     more floor of it behind you.
     ============================================================ */
  async climb(ante) {
    const root = CINE.stage();
    root.className = 'ante-cut';
    root.innerHTML = '';
    const card = U.el('div', 'ante-card climb');
    card.appendChild(UI.txt('FLOOR ' + Math.min(ante, 8) + ' OF 8', { scale: 4, color: PIX.PAL.q }));
    const art = U.el('div', 'climb-art');
    const k = U.clamp(Math.floor(Math.min(window.innerWidth * 0.5 / 180,
      window.innerHeight * 0.42 / 108)), 2, 6);
    art.appendChild(SPR.clone(SPR.lorePanel('tower'), k));
    /* the floor you have just cleared, marked on the front of the house */
    const pip = U.el('i', 'climb-pip');
    pip.style.bottom = (10 + Math.min(ante - 1, 7) * 11) * k + 'px';
    pip.style.width = (64 * k) + 'px';
    pip.style.height = (7 * k) + 'px';
    art.appendChild(pip);
    card.appendChild(art);
    card.appendChild(UI.txt('ONE MORE BETWEEN YOU AND THE TOP', { scale: 3, color: PIX.PAL.w }));
    root.appendChild(card);
    await U.sleep(20);
    card.classList.add('in');
    SFX.chak();
    await DUEL.sleep(1500);
    card.classList.add('out');
    await U.sleep(300);
    root.innerHTML = '';
    root.className = 'hidden';
  },

  /* ============================================================
     AMBIENCE. Card backs drifting across the menus, because an
     empty swirl behind a title screen is a wasted swirl.
     ============================================================ */
  ambient(on) {
    const r = CINE.amb();
    r.innerHTML = '';
    r.className = on ? 'on' : '';
    if (!on) return;
    const tex = CINE.tex();
    for (let i = 0; i < 7; i++) {
      const c = U.el('i', 'drift-card');
      c.style.backgroundImage = 'url(' + tex.url + ')';
      c.style.width = tex.w + 'px';
      c.style.height = tex.h + 'px';
      c.style.top = (Math.random() * 92) + '%';
      c.style.animationDuration = (16 + Math.random() * 16) + 's';
      c.style.animationDelay = (-Math.random() * 24) + 's';
      c.style.setProperty('--spin', (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 26) + 'deg');
      r.appendChild(c);
    }
  },
};
