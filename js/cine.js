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

  /* A DECISION GETS ITS OWN LAYER. Pickers used to share the cutscene
     stage, so a cinematic ending half a second later wiped the cards out
     from under the player's hand. */
  pickRoot() {
    let r = document.getElementById('cine-pick');
    if (!r) {
      r = U.el('div');
      r.id = 'cine-pick';
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

  /* The wipe used to be a rack of card backs. This is a murder case, not
     a card game: the screen now closes behind a bank of venetian blinds
     with a case-file tab riveted to each slat. */
  slat() {
    return ART.cached('slatcol', () => {
      const W = 34, H = 96;
      const o = ART.cv(W, H), c = o.c, P = PIX.PAL;
      ART.px(c, 0, 0, W, H, '#10131a');
      for (let y = 0; y < H; y += 6) {
        ART.px(c, 0, y, W, 5, '#1b2028');
        ART.px(c, 0, y, W, 1, '#2b323c');
        ART.px(c, 0, y + 4, W, 1, '#0a0d12');
      }
      /* the pull cord and its knot, down the middle */
      ART.px(c, W / 2 - 1, 0, 1, H, '#3a4250');
      ART.px(c, W / 2 - 2, H / 2, 3, 4, '#5a6270');
      /* a paper tab, taped on, because everything here is evidence */
      ART.px(c, 4, 30, 26, 16, P.K);
      ART.px(c, 5, 31, 24, 14, '#ded2b4');
      ART.px(c, 7, 34, 20, 1, '#8d8672');
      ART.px(c, 7, 37, 14, 1, '#8d8672');
      ART.px(c, 7, 40, 18, 1, '#8d8672');
      ART.px(c, 5, 31, 24, 2, '#b8232f');
      return o.cv;
    });
  },
  tex() { return CINE.url('slat', CINE.slat(), 1); },
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

  /* ============================================================
     WHERE YOU ARE.

     A location card, typed on over the room itself: no black
     screen, no loading — the bars come in, the camera walks the
     room, the name of the place arrives a letter at a time, and
     the bars go out into play.
     ============================================================ */
  locationCard(name, sub) {
    const root = CINE.stage();
    root.className = 'loc-cut';
    root.innerHTML = '';
    const card = U.el('div', 'loc-card');
    const line = U.el('div', 'loc-name');
    const subl = U.el('div', 'loc-sub');
    card.appendChild(line);
    card.appendChild(subl);
    root.appendChild(card);

    /* the name types on, a letter at a time, with a key under each one */
    let i = 0;
    const step = () => {
      i++;
      line.innerHTML = '';
      line.appendChild(UI.txt(name.slice(0, i), { scale: 5, color: PIX.PAL.W, outline: PIX.PAL.K }));
      if (i % 2 === 0) SFX.tone(1500 + Math.random() * 400, 0.014, 'square', 0.03);
      if (i < name.length) setTimeout(step, 46);
      else if (sub) {
        setTimeout(() => {
          subl.appendChild(UI.txt(sub, { scale: 3, color: PIX.PAL.G }));
          subl.classList.add('in');
        }, 160);
      }
    };
    step();
    requestAnimationFrame(() => card.classList.add('in'));
    return {
      close: async () => {
        card.classList.add('out');
        await U.sleep(320);
        root.innerHTML = '';
        root.className = 'hidden';
      },
    };
  },

  /* the whole arrival: bars, a pan across the room, the card, and out */
  async establish(o) {
    o = o || {};
    CINE.letterbox(true);
    const card = CINE.locationCard(o.name || '', o.sub || '');
    const pan = SCENE.pan(o.from === undefined ? 0 : o.from,
      o.to === undefined ? 0 : o.to, o.ms || 1700);
    await Promise.all([pan, U.sleep(o.ms || 1700)]);
    await card.close();
    CINE.letterbox(false);
    SCENE.unfocus();
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
     THE DRIVE. Rain, wipers, two depths of skyline going by, and
     the precinct at the end of it. This is the loading screen.
     ============================================================ */
  async driveTo(dest) {
    dest = dest || 'THE PRECINCT';
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
      const lab = PIXFONT.render('TO ' + dest, { scale: 1, color: P.q, shadow: null });
      c.drawImage(lab, Math.round(90 - lab.width / 2), 99);
      const dots = '.'.repeat(1 + (Math.floor(t * 2) % 3));
      const d2 = PIXFONT.render(dots, { scale: 1, color: P.q, shadow: null });
      c.drawImage(d2, Math.round(90 + lab.width / 2 + 2), 99);
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
      foot: STORY.chapter().title,
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
    card.appendChild(UI.txt('THE ROOM IS', { scale: 5, color: PIX.PAL.q }));
    card.appendChild(UI.txt('CLEARED', { scale: 8, color: PIX.PAL.G, outline: PIX.PAL.K }));
    const row = U.el('div', 'load-row');
    row.appendChild(UI.txt('YOU KEEP ' + U.fmt(chips), { scale: 3, color: PIX.PAL.W }));
    row.appendChild(UI.icon('ic_chip', 3));
    card.appendChild(row);
    card.appendChild(UI.txt('THE BOARD IS ' + STORY.intelPct() + '% OF HIM', { scale: 3, color: PIX.PAL.R }));
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
     A CANVAS FILM STRIP.
     Every cinematic below runs on the same rig: one pixel canvas
     blown up by an integer, a draw(t) per shot, tap to skip.
     Shots are listed with their length so a scene can be cut
     like a scene instead of animated like a loop.
     ============================================================ */
  async film(shots, opts) {
    opts = opts || {};
    const root = CINE.stage();
    root.className = 'anim-cut';
    root.innerHTML = '';
    const W = opts.w || 180, H = opts.h || 108;
    const cv = document.createElement('canvas');
    const K = U.clamp(Math.floor(Math.min(window.innerWidth / (W + 10), window.innerHeight / (H + 22))), 2, 8);
    cv.width = W * K; cv.height = H * K;
    cv.className = 'pix anim-frame';
    root.appendChild(cv);
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.scale(K, K);
    if (opts.bars) CINE.letterbox(true);

    let skip = false, skipAll = false;
    const bail = () => { skip = true; if (opts.skipAll) skipAll = true; };
    window.addEventListener('pointerdown', bail);
    window.addEventListener('keydown', bail);
    try {
      for (const shot of shots) {
        skip = false;
        if (shot.snd) shot.snd();
        const t0 = performance.now();
        for (;;) {
          const t = (performance.now() - t0) / 1000;
          if (t > shot.len || skipAll) break;
          if (skip && t > 0.12) break;
          c.clearRect(0, 0, W, H);
          shot.draw(c, t, W, H);
          /* the caption, if the shot carries one */
          if (shot.cap) {
            const lab = PIXFONT.render(shot.cap, { scale: 1, color: PIX.PAL.W, shadow: PIX.PAL.K });
            c.drawImage(lab, Math.round(W / 2 - lab.width / 2), H - 12);
          }
          await U.sleep(28);
        }
      }
    } finally {
      window.removeEventListener('pointerdown', bail);
      window.removeEventListener('keydown', bail);
      root.innerHTML = '';
      root.className = 'hidden';
      if (opts.bars) CINE.letterbox(false);
    }
  },

  /* ============================================================
     THE AMBULANCE. You do not get a game over; you get a bill.
     Two shots: the wagon coming through the rain, and the
     ceiling of the corridor going past your own eyes.
     ============================================================ */
  async ambulance(bill, lostName) {
    const P = PIX.PAL;
    const rng = U.mulberry32(773);
    const stars = Array.from({ length: 30 }, () => [rng() * 180, rng() * 30]);

    const street = (c, t, W, H) => {
      PIX.rect(c, 0, 0, W, H, '#05070c');
      stars.forEach(([x, y]) => PIX.rect(c, Math.round(x), Math.round(y), 1, 1, 'rgba(200,220,255,.25)'));
      /* skyline going by */
      const off = Math.round(t * 90) % 120;
      for (let i = -1; i < 3; i++) {
        const bx = i * 120 - off;
        PIX.rect(c, bx, 40, 46, 42, '#0c1018');
        PIX.rect(c, bx + 52, 30, 30, 52, '#0a0e16');
        PIX.rect(c, bx + 88, 46, 24, 36, '#0e1220');
        for (let w = 0; w < 10; w++) {
          if ((w + i) % 3) continue;
          PIX.rect(c, bx + 5 + (w % 5) * 9, 46 + Math.floor(w / 5) * 14, 3, 4, '#8a6a1e');
        }
      }
      /* wet road with the light of the wagon smeared down it */
      PIX.rect(c, 0, 82, W, H - 82, '#0b0e14');
      PIX.rect(c, 0, 82, W, 2, '#1a2030');
      const strobe = Math.sin(t * 22) > 0 ? '#d13b45' : '#3f89c4';
      for (let i = 0; i < 26; i++) {
        PIX.rect(c, (i * 13 + Math.round(t * 200)) % W, 86 + (i % 5) * 4, 8, 1,
          i % 3 ? 'rgba(255,255,255,.06)' : strobe.replace(')', ',.25)').replace('#', 'rgba(').length ? 'rgba(200,60,70,.18)' : '');
      }
      /* the wagon, side on, coming toward the right of frame */
      const ax = -50 + t * 130;
      PIX.rect(c, ax, 58, 56, 24, P.K);
      PIX.rect(c, ax + 1, 59, 54, 22, '#e8e2d0');            // the box
      PIX.rect(c, ax + 1, 59, 54, 3, P.W);
      PIX.rect(c, ax + 4, 64, 14, 10, '#9aa3b8');            // the window
      PIX.rect(c, ax + 5, 65, 12, 8, '#2b3a4a');
      PIX.rect(c, ax + 24, 66, 26, 3, '#d13b45');            // the stripe
      PIX.rect(c, ax + 34, 71, 4, 10, '#d13b45');            // the cross
      PIX.rect(c, ax + 31, 74, 10, 4, '#d13b45');
      PIX.rect(c, ax + 46, 52, 12, 7, P.K);                  // the light bar
      PIX.rect(c, ax + 47, 53, 10, 5, strobe);
      PIX.disc(c, ax + 12, 82, 5, P.K); PIX.disc(c, ax + 12, 82, 3, '#3f465c');
      PIX.disc(c, ax + 44, 82, 5, P.K); PIX.disc(c, ax + 44, 82, 3, '#3f465c');
      /* what the light does to the street */
      c.globalAlpha = 0.16; c.fillStyle = strobe;
      c.fillRect(0, 40, W, H - 40);
      c.globalAlpha = 1;
      /* rain, hard, sideways */
      for (let i = 0; i < 70; i++) {
        const rx = (i * 31 + Math.round(t * 260)) % (W + 10) - 5;
        const ry = (i * 47) % H;
        PIX.rect(c, W - rx, ry, 3, 1, 'rgba(160,200,235,.20)');
      }
    };

    const corridor = (c, t, W, H) => {
      /* your own view, flat on your back, being run down a corridor */
      PIX.rect(c, 0, 0, W, H, '#0a0f14');
      /* ceiling tiles rushing away over you */
      const sp = Math.max(0, 1 - t * 0.22);
      const off = Math.round((t * 150) % 30);
      for (let i = -1; i < 6; i++) {
        const y = i * 30 - off;
        PIX.rect(c, 0, y, W, 2, '#161d24');
        for (let x = 0; x < W; x += 34) PIX.rect(c, x, y, 2, 30, '#141a20');
      }
      /* the strip lights, one every other tile, streaking with the speed */
      for (let i = -1; i < 6; i++) {
        const y = i * 60 - Math.round((t * 150) % 60);
        PIX.rect(c, 52, y, 76, 7, '#2a333c');
        PIX.rect(c, 54, y + 1, 72, 5, '#ffe9a3');
        PIX.rect(c, 54 - Math.round(sp * 10), y + 2, 72 + Math.round(sp * 20), 3, '#fffbe8');
        for (let k = 0; k < 6; k++) {
          PIX.rect(c, 40, y + 8 + k * 3, 100, 1, 'rgba(255,233,163,' + (0.06 - k * 0.008) + ')');
        }
      }
      /* the gurney rails, running away from your own eyes */
      for (let i = 0; i < 22; i++) {
        const k2 = i / 22;
        PIX.rect(c, Math.round(6 + k2 * 26), H - 2 - i * 2, 4, 2, 'rgba(154,163,184,' + (0.5 - k2 * 0.4) + ')');
        PIX.rect(c, Math.round(W - 10 - k2 * 26), H - 2 - i * 2, 4, 2, 'rgba(154,163,184,' + (0.5 - k2 * 0.4) + ')');
      }
      /* the drip, swinging on its pole above you */
      const sw = Math.round(Math.sin(t * 5) * 4);
      PIX.rect(c, 30 + sw, 0, 2, 26, '#5a6270');
      const bag = ART.art('ivbag', 2);
      c.drawImage(bag, 22 + sw, 20);
      /* the two of them running you in — from flat on your back they are
         faces at the top of the frame, looking down at you, not walls */
      const port = (px2, tone, dark, phase, sgn) => {
        const lean = Math.round(Math.sin(t * 8 + phase) * 2);
        const y0 = 1 + lean;
        /* the shoulders, wedging in from the corner */
        PIX.rect(c, px2 - 6 * sgn, y0 + 15, 34, 16, P.K);
        PIX.rect(c, px2 - 5 * sgn, y0 + 16, 32, 14, tone);
        PIX.rect(c, px2 - 5 * sgn, y0 + 16, 32, 2, 'rgba(255,255,255,.08)');
        /* the head, upside down to us because he is over the top of you */
        PIX.rect(c, px2, y0 + 4, 22, 13, P.K);
        PIX.rect(c, px2 + 1, y0 + 5, 20, 11, tone);
        PIX.rect(c, px2 + 1, y0 + 12, 20, 4, dark);
        /* both bulbs, low on the skull from this angle */
        [4, 13].forEach(ex => {
          PIX.rect(c, px2 + ex, y0 + 13, 6, 5, P.K);
          PIX.rect(c, px2 + ex + 1, y0 + 14, 4, 3, tone);
          PIX.rect(c, px2 + ex + 2, y0 + 15, 2, 2, P.K);
        });
        /* the mouth line, and the white cap on top */
        PIX.rect(c, px2 + 2, y0 + 9, 18, 1, dark);
        PIX.rect(c, px2 - 1, y0 + 1, 24, 4, P.K);
        PIX.rect(c, px2, y0 + 2, 22, 2, '#e8e2d0');
        /* the arm coming down the edge of the frame, and the hand on the rail */
        const ax = sgn > 0 ? px2 - 4 : px2 + 24;
        PIX.rect(c, ax, y0 + 26, 8, 30, P.K);
        PIX.rect(c, ax + 1, y0 + 27, 6, 28, tone);
        PIX.rect(c, ax - 1, y0 + 54, 10, 7, P.K);
        PIX.rect(c, ax, y0 + 55, 8, 5, dark);
      };
      port(14, '#2e7d5b', '#1c5540', 0, 1);
      port(W - 36, '#276a4c', '#164434', 2.1, -1);
      /* the mask coming down over the lens */
      if (t > 1.1) {
        const a = Math.min(0.8, (t - 1.1) * 0.9);
        c.globalAlpha = a; c.fillStyle = '#e8e2d0';
        c.fillRect(30, H - 60, W - 60, 40);
        c.globalAlpha = 1;
      }
      /* the edges closing in */
      const vig = Math.min(0.75, t * 0.24);
      for (let i = 0; i < 16; i++) {
        const a = vig * (1 - i / 16);
        PIX.rect(c, 0, i, W, 1, 'rgba(0,0,0,' + a + ')');
        PIX.rect(c, 0, H - 1 - i, W, 1, 'rgba(0,0,0,' + a + ')');
        PIX.rect(c, i, 0, 1, H, 'rgba(0,0,0,' + a * 0.7 + ')');
        PIX.rect(c, W - 1 - i, 0, 1, H, 'rgba(0,0,0,' + a * 0.7 + ')');
      }
    };

    const bench = (c, t, W, H) => {
      /* the bill, on a form, on a clipboard */
      PIX.rect(c, 0, 0, W, H, '#0c1014');
      PIX.rect(c, 40, 14, 100, 84, P.K);
      PIX.rect(c, 42, 16, 96, 80, '#ded2b4');
      PIX.rect(c, 42, 16, 96, 6, '#b8232f');
      const head = PIXFONT.render('CITY INFIRMARY', { scale: 1, color: '#141820', shadow: null });
      c.drawImage(head, 90 - head.width / 2, 26);
      for (let i = 0; i < 5; i++) PIX.rect(c, 50, 36 + i * 6, 60 + (i % 2) * 18, 1, '#8d8672');
      const b1 = PIXFONT.render('GUNSHOT - TREATED', { scale: 1, color: '#3a3428', shadow: null });
      c.drawImage(b1, 50, 68);
      const b2 = PIXFONT.render(bill + ' CHIPS', { scale: 2, color: '#8c2230', shadow: null });
      c.drawImage(b2, 50, 78);
      if (lostName && t > 0.7) {
        const b3 = PIXFONT.render('LOST: ' + lostName, { scale: 1, color: '#8c2230', shadow: null });
        c.drawImage(b3, 44, 92);
      }
      /* a stamp coming down at the end */
      if (t > 1.2) {
        const k = Math.min(1, (t - 1.2) * 6);
        const s = Math.round(3 - k * 2);
        const st = PIXFONT.render('DISCHARGED', { scale: s, color: 'rgba(140,34,48,.85)', shadow: null });
        c.save();
        c.translate(92, 60); c.rotate(-0.14);
        c.drawImage(st, -st.width / 2, -st.height / 2);
        c.restore();
        if (k >= 1 && !bench._rang) { bench._rang = true; SFX.chak(); }
      }
    };

    await CINE.film([
      { len: 1.7, draw: street, cap: 'THEY GOT TO YOU FIRST', snd: () => { SFX.tone(880, 0.4, 'square', 0.06); SFX.tone(660, 0.4, 'square', 0.06, 0.4); } },
      { len: 1.9, draw: corridor, snd: () => SFX.tone(1100, 0.06, 'sine', 0.05) },
      { len: 1.9, draw: bench, cap: 'AGAINST MEDICAL ADVICE' },
    ], { bars: true });
  },

  /* ============================================================
     PICK ONE. A drawn spread of cards — questions to put to a
     room, evidence to turn over, a face to name. Tap one, or tap
     the dark to back out. No button strip anywhere.
     ============================================================ */
  pick(o) {
    return new Promise(res => {
      const root = CINE.pickRoot();
      root.className = 'choice';
      root.innerHTML = '';
      const wrap = U.el('div', 'ch-wrap pickwrap');
      if (o.head) {
        const head = U.el('div', 'ch-head');
        head.appendChild(UI.wrap(o.head, 34, { scale: 3, color: PIX.PAL.W, outline: PIX.PAL.K }));
        if (o.sub) head.appendChild(UI.wrap(o.sub, 44, { scale: 2, color: PIX.PAL.q }));
        wrap.appendChild(head);
      }
      const row = U.el('div', 'ch-row pickrow');
      const K = U.clamp(Math.floor(window.innerWidth / 520), 2, 4);
      const anyArt = (o.items || []).some(it => it.art);
      (o.items || []).forEach((it, i) => {
        const card = U.el('div', 'pick-card' + (it.dim ? ' dim' : ''));
        const cv = document.createElement('canvas');
        const W = 84, Hh = anyArt ? 100 : 62;
        cv.width = W * K; cv.height = Hh * K;
        cv.className = 'pix';
        const c = cv.getContext('2d');
        c.imageSmoothingEnabled = false;
        c.scale(K, K);
        /* a paper card, taped at the top, typed on */
        PIX.rect(c, 0, 0, W, Hh, PIX.PAL.K);
        PIX.rect(c, 1, 1, W - 2, Hh - 2, it.dim ? '#8f8a7a' : '#ded2b4');
        PIX.rect(c, 1, 1, W - 2, 2, it.dim ? '#a09a88' : '#efe6cc');
        PIX.rect(c, 1, Hh - 3, W - 2, 2, 'rgba(0,0,0,.18)');
        for (let y = 6; y < Hh - 4; y += 4) PIX.rect(c, 3, y, W - 6, 1, 'rgba(0,0,0,.05)');
        PIX.rect(c, W / 2 - 9, -1, 18, 4, 'rgba(240,235,220,.55)');
        /* the art, fitted into its window rather than spilling over the type */
        if (it.art) {
          const a = it.art, bw = 72, bh = 52;
          const k2 = Math.min(bw / a.width, bh / a.height);
          const aw = Math.max(1, Math.round(a.width * k2)), ah = Math.max(1, Math.round(a.height * k2));
          PIX.rect(c, 5, 5, W - 10, bh + 2, '#141820');
          PIX.rect(c, 5, 5, W - 10, 1, 'rgba(0,0,0,.5)');
          c.drawImage(a, Math.round(W / 2 - aw / 2), 6 + Math.round((bh - ah) / 2), aw, ah);
        }
        const ty = anyArt ? 62 : 10;
        const lab = SPR.fitLines(it.label, 14).slice(0, 3);
        lab.forEach((ln, j) => {
          const l = PIXFONT.render(ln, { scale: 1, color: '#141820', shadow: null });
          c.drawImage(l, Math.round(W / 2 - l.width / 2), ty + j * 9);
        });
        if (it.sub) {
          SPR.fitLines(it.sub, 13).slice(0, 3).forEach((ln, j) => {
            const l2 = PIXFONT.render(ln, { scale: 1, color: '#8c2230', shadow: null });
            c.drawImage(l2, Math.round(W / 2 - l2.width / 2), ty + lab.length * 9 + 2 + j * 8);
          });
        }
        card.appendChild(cv);
        if (!it.dim) card.onclick = (ev) => {
          ev.stopPropagation();
          SFX.deal();
          root.innerHTML = ''; root.className = 'hidden';
          res(i);
        };
        row.appendChild(card);
      });
      wrap.appendChild(row);
      if (o.cancel !== false) {
        const out = U.el('div', 'pick-out');
        out.appendChild(UI.wrap('TAP THE DARK TO STEP BACK', 34, { scale: 2, color: PIX.PAL.q }));
        wrap.appendChild(out);
        root.onclick = () => { root.innerHTML = ''; root.className = 'hidden'; res(-1); };
      }
      root.appendChild(wrap);
      requestAnimationFrame(() => wrap.classList.add('in'));
    });
  },

  /* ============================================================
     THE TWO ENDINGS.
     ============================================================ */
  async ending(kind) {
    const P = PIX.PAL;

    /* --- shared: rain that can stop --- */
    const rain = (c, t, W, H, amt) => {
      for (let i = 0; i < Math.round(70 * amt); i++) {
        const rx = (i * 29 + Math.round(t * 190)) % (W + 8) - 4;
        const ry = (i * 41 + Math.round(t * 260)) % H;
        PIX.rect(c, rx, ry, 1, 3, 'rgba(160,200,235,.18)');
      }
    };

    if (kind === 'good') {
      /* SHOT 1 — a courtroom, from the back of the gallery.
         Everybody in it is drawn with the walking rig, so they read as
         frogs instead of boxes with eyes. */
      /* everybody in the room is a real frog def, same as the table uses */
      const JUDGE = { key: 'judge', def: {
        skin: ['w', 'q', 'k'], fat: true, suit: 'K', shirt: 'W', tie: 'K',
        costume: 'tails', warts: true } };
      const BULL = { key: 'dock', def: Object.assign({}, FROG_DEFS.owner || {}, { hat: false }) };
      const CLERK = { key: 'clerk', def: {
        skin: ['B', 'b', 'u'], fat: false, suit: 'T', shirt: 'W', tie: 'K',
        costume: 'shirtsleeves', glasses: 'shades' } };
      const court = (c, t, W, H) => {
        const dawn = Math.min(1, t / 1.7);
        PIX.rect(c, 0, 0, W, H, '#14121a');
        c.drawImage(ART.wall(W, 82, { tone: 'brick', railY: 56, seed: 61 }), 0, 0);
        c.drawImage(ART.floor(W, H - 78, { tone: 'board', seed: 9 }), 0, 78);

        /* two high windows with real panes, and the first daylight in the game */
        [104, 148].forEach((wx, k) => {
          PIX.rect(c, wx, 6, 34, 30, P.K);
          /* sky in the top panes, low sun in the bottom ones */
          for (let wy = 0; wy < 26; wy++) {
            const kk = wy / 26;
            PIX.rect(c, wx + 2, 8 + wy, 30, 1,
              'rgb(' + Math.round(52 + kk * 130 + dawn * 60) + ',' +
                       Math.round(72 + kk * 110 + dawn * 50) + ',' +
                       Math.round(96 + kk * 60) + ')');
          }
          PIX.rect(c, wx + 2, 8, 30, 26, 'rgba(255,226,168,' + (dawn * 0.3) + ')');
          PIX.rect(c, wx + 16, 8, 2, 26, P.K);
          PIX.rect(c, wx + 2, 20, 30, 2, P.K);
          PIX.rect(c, wx + 2, 8, 30, 1, 'rgba(255,255,255,.25)');
          /* the shafts it throws down into the room */
          for (let i2 = 0; i2 < 7; i2++) {
            PIX.rect(c, wx - 4 - i2 * 3 + k * 2, 36 + i2 * 6, 30, 5,
              'rgba(255,228,168,' + (dawn * 0.035) + ')');
          }
        });

        /* the bench: panelled, with a rail and the state's seal on it */
        PIX.rect(c, 44, 44, 92, 34, P.K);
        PIX.rect(c, 46, 46, 88, 30, '#4d301a');
        ART.grain(c, 47, 47, 86, 28, '#3a2414', '#6b4426', 5);
        for (let px2 = 52; px2 < 128; px2 += 20) {
          PIX.rect(c, px2, 52, 15, 20, '#3d2615');
          PIX.rect(c, px2, 52, 15, 1, '#6b4426');
        }
        PIX.rect(c, 44, 42, 92, 3, '#7a5230');
        PIX.rect(c, 44, 42, 92, 1, '#a5741f');
        PIX.rect(c, 82, 32, 18, 11, P.h);
        PIX.rect(c, 84, 34, 14, 7, P.G);
        PIX.rect(c, 88, 36, 6, 3, P.h);
        /* the judge behind it, and the clerk below */
        c.drawImage(SCENE.rigPic(JUDGE, 0, -1), 78, 12);
        c.drawImage(SCENE.rigPic(CLERK, 0, 1), 34, 44);

        /* the dock, stage right: him standing in it, cuffed to the rail,
           smaller than he has ever been. The rail goes on AFTER him. */
        PIX.rect(c, 148, 46, 42, 32, P.K);
        PIX.rect(c, 150, 48, 38, 28, '#241a12');
        c.drawImage(SCENE.rigPic(BULL, 0, -1), 156, 38);
        PIX.rect(c, 148, 62, 42, 4, P.K);                     // the rail across him
        PIX.rect(c, 149, 63, 40, 2, '#4d301a');
        PIX.rect(c, 149, 63, 40, 1, '#6b4426');
        for (let bx2 = 152; bx2 < 188; bx2 += 7) {            // and the bars under it
          PIX.rect(c, bx2, 66, 2, 12, P.K);
          PIX.rect(c, bx2, 66, 1, 12, '#3a2a1c');
        }
        PIX.rect(c, 166, 58, 12, 4, P.S);                     // the cuffs
        PIX.rect(c, 170, 59, 4, 2, P.M);

        /* the gavel, coming down on the last beat */
        if (t > 1.6) {
          const k2 = Math.min(1, (t - 1.6) * 9);
          const gy = 26 + Math.round(k2 * 14);
          PIX.rect(c, 112, gy, 13, 6, P.K);
          PIX.rect(c, 113, gy + 1, 11, 4, '#6b4426');
          PIX.rect(c, 113, gy + 1, 11, 1, '#8a5c34');
          PIX.rect(c, 117, gy + 6, 3, 9, '#4d301a');
          if (k2 >= 1 && !court._bang) {
            court._bang = true; SFX.shot();
            FX.screen.flash && FX.screen.flash(P.W, 0.18);
          }
        }

        /* the gallery: the backs of heads between us and all of it */
        PIX.rect(c, 0, 82, W, 4, '#231a12');
        for (let gx = 6; gx < W; gx += 26) {
          PIX.rect(c, gx, 86, 18, 22, P.K);
          PIX.rect(c, gx + 2, 88, 14, 20, '#1a1420');
          PIX.rect(c, gx + 5, 84, 8, 5, P.K);
        }
        PIX.rect(c, 0, H - 8, W, 8, '#0e0a12');
      };

      /* SHOT 2 — two stones, and the rain finally stopping */
      const graves = (c, t, W, H) => {
        const amt = Math.max(0, 1 - t / 1.5);
        /* the sky, going from wet grey to a low sun */
        for (let y = 0; y < 66; y++) {
          const k2 = y / 66;
          const dawnk = (1 - amt);
          PIX.rect(c, 0, y, W, 1,
            'rgb(' + Math.round(16 + k2 * 30 + dawnk * 60) + ',' +
                     Math.round(20 + k2 * 28 + dawnk * 40) + ',' +
                     Math.round(28 + k2 * 20 + dawnk * 22) + ')');
        }
        /* the city, far off and done with all of this */
        for (let bx2 = 0; bx2 < W; bx2 += 17) {
          const bh = 6 + ((bx2 * 7) % 13);
          PIX.rect(c, bx2, 60 - bh, 15, bh, '#161c22');
        }
        PIX.rect(c, 0, 60, W, 3, '#101720');
        /* the railing along the top of the hill */
        for (let fx = 4; fx < W; fx += 9) PIX.rect(c, fx, 56, 1, 6, '#0e1216');
        PIX.rect(c, 0, 57, W, 1, '#0e1216');
        /* the grass, dark and wet, not a green field of noise */
        PIX.rect(c, 0, 62, W, H - 62, '#15231b');
        ART.dither(c, 0, 62, W, H - 62, '#1b2f22', 0.13, 9);
        ART.dither(c, 0, 62, W, H - 62, '#0e1a14', 0.1, 21);
        for (let gx = 0; gx < W; gx += 3) {
          PIX.rect(c, gx, 62 + ((gx * 5) % 5), 1, 2, '#233c2b');
        }
        /* the two stones, with the light catching their tops */
        [[62, 'M'], [92, 'K']].forEach(([gx]) => {
          PIX.rect(c, gx, 40, 22, 26, P.K);
          PIX.rect(c, gx + 1, 41, 20, 24, '#5d646c');
          PIX.rect(c, gx + 1, 41, 20, 2, '#868d96');
          PIX.rect(c, gx + 1, 41, 3, 24, '#6d747c');
          PIX.rect(c, gx + 5, 47, 12, 1, '#3a4048');
          PIX.rect(c, gx + 6, 51, 10, 1, '#3a4048');
          PIX.rect(c, gx + 7, 55, 8, 1, '#3a4048');
          PIX.rect(c, gx + 3, 66, 16, 3, P.K);
          PIX.rect(c, gx + 4, 66, 14, 1, '#4a5058');
        });
        /* flowers: his, dead. yours, new. */
        PIX.rect(c, 66, 69, 3, 3, '#4a3a2a');
        PIX.rect(c, 71, 70, 3, 2, '#4a3a2a');
        PIX.rect(c, 96, 68, 3, 3, '#d13b45');
        PIX.rect(c, 100, 69, 3, 3, '#ff7edb');
        PIX.rect(c, 104, 68, 2, 3, '#ffd75e');
        /* the two of you, backs to us, far enough apart to be honest */
        c.drawImage(SCENE.rigPic(SCENE.meDef(), 0, -1), 124, 30);
        c.drawImage(SCENE.rigPic(ROOMS.MAY_RIG, 0, -1), 148, 30);
        rain(c, t, W, H, amt);
        if (amt < 0.08) PIX.rect(c, 0, 0, W, H, 'rgba(255,226,170,.05)');
      };

      await CINE.film([
        { len: 2.4, draw: court, cap: 'THE STATE VERSUS THE BULLFROG' },
        { len: 2.6, draw: graves, cap: 'IT STOPPED RAINING' },
      ], { bars: true });
      await CINE.titleBeat('CASE CLOSED', 'YOU STAYED A COP.', P.G);
    } else {
      /* SHOT 1 — the room, one flash, and what is left of you in it */
      const room = (c, t, W, H) => {
        PIX.rect(c, 0, 0, W, H, '#08090d');
        c.drawImage(ART.wall(W, 80, { tone: 'grey', railY: 56, seed: 71 }), 0, 0);
        c.drawImage(ART.floor(W, H - 76, { tone: 'board', seed: 3 }), 0, 76);
        c.drawImage(ART.hangLamp(16, 24, true), 84, 0);
        /* him on the floor, intact, and you standing over it */
        PIX.rect(c, 60, 84, 40, 8, P.K);
        PIX.rect(c, 61, 85, 38, 6, '#3a3f52');
        PIX.disc(c, 58, 88, 6, P.K); PIX.disc(c, 58, 88, 5, '#2e7d5b');
        PIX.rect(c, 96, 86, 26, 3, 'rgba(87,18,32,.6)');
        c.drawImage(SCENE.rigPic(SCENE.meDef(), 0, -1), 104, 48);
        /* the flash, once, hard */
        if (t > 0.5 && t < 0.62) {
          PIX.rect(c, 0, 0, W, H, 'rgba(255,251,232,.85)');
          if (!room._bang) { room._bang = true; SFX.shot(); }
        }
        /* the smoke off it, and the file you never filed on the floor */
        if (t > 0.62) {
          for (let i = 0; i < 8; i++) {
            const sy = 60 - (t - 0.62) * 22 - i * 3;
            PIX.rect(c, 100 + Math.round(Math.sin(i + t * 3) * 3), sy, 3, 2, 'rgba(180,180,190,' + (0.16 - i * 0.018) + ')');
          }
          PIX.rect(c, 126, 88, 16, 3, '#ded2b4');
          PIX.rect(c, 128, 86, 12, 3, '#c9c0a8');
        }
      };

      /* SHOT 2 — you in his chair, with his room around you */
      const chair = (c, t, W, H) => {
        PIX.rect(c, 0, 0, W, H, '#0a0810');
        c.drawImage(ART.wall(W, 80, { tone: 'brick', railY: 58, seed: 83 }), 0, 0);
        c.drawImage(ART.floor(W, H - 76, { tone: 'board', seed: 8 }), 0, 76);
        /* his desk, his bottle, his lamp — now yours */
        c.drawImage(ART.desk(84, 30, 4), 48, 66);
        c.drawImage(ART.art('desklamp', 1), 56, 54);
        c.drawImage(ART.art('gunprop', 1), 96, 60);
        /* you, in the big chair, facing us: a frog-shaped hole in the room */
        PIX.rect(c, 72, 44, 38, 26, P.K);                // the chair back behind you
        PIX.rect(c, 74, 46, 34, 24, '#100d16');
        PIX.rect(c, 78, 34, 26, 36, P.K);                // shoulders, sloping
        PIX.rect(c, 80, 36, 22, 34, '#141019');
        PIX.rect(c, 76, 38, 30, 6, P.K);
        PIX.rect(c, 77, 39, 28, 4, '#141019');
        PIX.rect(c, 84, 22, 16, 14, P.K);                // the skull
        PIX.rect(c, 85, 23, 14, 12, '#171a20');
        PIX.rect(c, 82, 18, 20, 5, P.K);                 // the hat, still on indoors
        PIX.rect(c, 83, 19, 18, 3, '#101318');
        PIX.rect(c, 78, 21, 28, 2, P.K);                 // the brim
        PIX.rect(c, 86, 25, 4, 3, P.K);                  // both bulbs
        PIX.rect(c, 94, 25, 4, 3, P.K);
        PIX.rect(c, 87, 26, 3, 2, '#d13b45');            // two eyes, the wrong colour now
        PIX.rect(c, 95, 26, 3, 2, '#d13b45');
        PIX.rect(c, 85, 32, 14, 1, '#241820');           // the mouth line
        /* his glass, at your elbow now */
        PIX.rect(c, 112, 62, 5, 6, P.K);
        PIX.rect(c, 113, 63, 3, 4, '#6b4426');
        /* the board behind, burning down to nothing */
        const burn = Math.min(1, t / 2);
        c.drawImage(ART.corkboard(50, 32, 4), 8, 12);
        /* it burns from the bottom up, and what is left is char */
        const eatenTo = 12 + Math.round(32 * (1 - burn));
        PIX.rect(c, 8, eatenTo, 50, 12 + 32 - eatenTo, '#0d0a08');
        ART.dither(c, 8, 12, 50, Math.max(1, eatenTo - 12), 'rgba(20,14,10,.7)', 0.3 * burn, 5);
        for (let i = 0; i < 14; i++) {
          const ex = 9 + (i * 7) % 48;
          PIX.rect(c, ex, eatenTo - (i % 3), 1, 1, i % 2 ? '#ff9d3c' : '#ffd75e');
          if (i % 4 === 0) PIX.rect(c, ex, eatenTo - 4 - (i % 5), 1, 1, 'rgba(255,157,60,.5)');
        }
        PIX.rect(c, 8, eatenTo - 1, 50, 1, '#c9541e');
        rain(c, t, W, H, 1);
      };

      await CINE.film([
        { len: 2.3, draw: room, cap: 'NOBODY WROTE IT DOWN' },
        { len: 2.6, draw: chair, cap: 'SOMEBODY HAS TO RUN IT' },
      ], { bars: true });
      await CINE.titleBeat('CASE BURIED', 'YOU BECAME THE ADDRESS.', P.R);
    }
  },

  /* the card between chapters: what you closed, and what is left of him */
  async chapterCard() {
    const ch = STORY.chapter();
    const pct = STORY.intelPct();
    const root = CINE.stage();
    root.className = 'anim-cut';
    root.innerHTML = '';
    const wrap = U.el('div', 'tb-card');
    wrap.appendChild(UI.wrap('THE CASE MOVES', 22, { scale: 4, color: PIX.PAL.q }));
    wrap.appendChild(UI.wrap(ch.title, 20, { scale: 7, color: PIX.PAL.W, outline: PIX.PAL.K }));
    wrap.appendChild(UI.wrap(ch.obj, 36, { scale: 3, color: PIX.PAL.G }));
    wrap.appendChild(UI.wrap('THE BOARD IS ' + pct + '% OF HIM', 30, { scale: 3, color: pct >= 100 ? PIX.PAL.G : PIX.PAL.R }));
    root.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('in'));
    SFX.bank();
    await U.sleep(1500);
    await new Promise(res => {
      const done = () => { window.removeEventListener('pointerdown', done); window.removeEventListener('keydown', done); res(); };
      window.addEventListener('pointerdown', done); window.addEventListener('keydown', done);
      setTimeout(done, 2600);
    });
    root.innerHTML = ''; root.className = 'hidden';
  },

  /* ============================================================
     THE THING IN YOUR HAND.

     You put your hand in a drain and came out with something. The
     bars close, the room goes away, and what you found is held up
     to the light with what it means written under it.
     ============================================================ */
  async clueCard(clue, left) {
    const root = CINE.stage();
    CINE.letterbox(true);
    root.className = 'anim-cut';
    root.innerHTML = '';
    const wrap = U.el('div', 'clue-card');

    /* the evidence bag: a manila envelope with a window in it */
    const K = U.clamp(Math.floor(Math.min(window.innerWidth / 120, window.innerHeight / 90)), 2, 6);
    const o = ART.cv(96, 62), c = o.c, P = PIX.PAL;
    ART.box(c, 0, 0, 96, 62, { fill: '#ded2b4', top: '#f0e6c8', bot: '#a99a78', ink: P.K });
    ART.grain(c, 3, 3, 90, 56, '#d2c5a4', '#e8dcbc', 19);
    ART.px(c, 6, 6, 84, 18, '#12101d');
    ART.px(c, 7, 7, 82, 16, 'rgba(150,200,220,.18)');       // the window
    ART.px(c, 6, 30, 60, 2, '#8d8672');
    ART.px(c, 6, 36, 74, 2, '#8d8672');
    ART.px(c, 6, 42, 48, 2, '#8d8672');
    /* the evidence stamp, sized to the word rather than the other way round */
    const st = PIXFONT.render('EVIDENCE', { scale: 1, color: '#ffe7e0', shadow: null });
    const sw = st.width + 6;
    ART.px(c, 90 - sw, 44, sw, 12, '#b8232f');
    ART.px(c, 91 - sw, 45, sw - 2, 10, '#8c1a24');
    c.drawImage(st, 93 - sw, 48);
    /* whatever it was, sitting in the window */
    const ic = clue.icon && PIX.get ? null : null;
    ART.px(c, 40, 10, 16, 10, '#3a3f52');
    ART.px(c, 42, 12, 12, 6, '#6f7a94');
    wrap.appendChild(SPR.clone(o.cv, K));

    const head = U.el('div', 'clue-head');
    head.appendChild(UI.wrap('YOU FOUND SOMETHING', 22, { scale: 3, color: PIX.PAL.q }));
    head.appendChild(UI.wrap(clue.text, 26, { scale: 4, color: PIX.PAL.W, outline: PIX.PAL.K }));
    head.appendChild(UI.wrap(left > 1 ? left + ' FACES STILL FIT' : 'THAT IS ONE FACE LEFT',
      26, { scale: 3, color: left > 1 ? PIX.PAL.G : PIX.PAL.Y }));
    wrap.appendChild(head);
    root.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('in'));
    SFX.bank();
    await new Promise(res => {
      const done = () => {
        window.removeEventListener('pointerdown', done);
        window.removeEventListener('keydown', done);
        res();
      };
      setTimeout(() => {
        window.addEventListener('pointerdown', done);
        window.addEventListener('keydown', done);
      }, 350);
      setTimeout(done, 4200);
    });
    root.innerHTML = ''; root.className = 'hidden';
    CINE.letterbox(false);
  },

  /* you said a name out loud */
  async namedCard(sus, right) {
    const root = CINE.stage();
    CINE.letterbox(true);
    root.className = 'anim-cut';
    root.innerHTML = '';
    const wrap = U.el('div', 'tb-card');
    const K = U.clamp(Math.floor(window.innerHeight / 190), 2, 5);
    /* mugshot's third argument is a SCALE, not a face: passing a word for it
       builds a zero-size canvas and the whole card throws on draw */
    wrap.appendChild(SPR.clone(SPR.mugshot('named:' + sus.name, sus.def, 1), K));
    wrap.appendChild(UI.wrap(sus.name, 20, { scale: 5, color: PIX.PAL.W, outline: PIX.PAL.K }));
    wrap.appendChild(UI.wrap(right ? 'THAT IS HIM' : 'WRONG FROG',
      20, { scale: 7, color: right ? PIX.PAL.G : PIX.PAL.R, outline: PIX.PAL.K }));
    wrap.appendChild(UI.wrap(right ? 'THEY ARE PUTTING HIM IN THE BACK ROOM'
      : 'HE WALKS. AND HE TELLS THE ONE YOU WANT.',
      34, { scale: 3, color: PIX.PAL.q }));
    root.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('in'));
    right ? SFX.jackpot() : (SFX.backfire && SFX.backfire());
    await new Promise(res => {
      const done = () => {
        window.removeEventListener('pointerdown', done);
        window.removeEventListener('keydown', done);
        res();
      };
      setTimeout(() => {
        window.addEventListener('pointerdown', done);
        window.addEventListener('keydown', done);
      }, 400);
      setTimeout(done, 4000);
    });
    root.innerHTML = ''; root.className = 'hidden';
    CINE.letterbox(false);
  },

  /* the night ran out on you */
  async dawnCard() {
    const root = CINE.stage();
    root.className = 'anim-cut';
    root.innerHTML = '';
    const K = U.clamp(Math.floor(Math.min(window.innerWidth / 190, window.innerHeight / 120)), 2, 7);
    const cv = document.createElement('canvas');
    cv.width = 180 * K; cv.height = 108 * K;
    cv.className = 'pix anim-frame';
    root.appendChild(cv);
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.scale(K, K);
    /* the sky coming up grey over the rooftops */
    const t0 = performance.now();
    await new Promise(res => {
      const draw = () => {
        const t = Math.min(1, (performance.now() - t0) / 2600);
        const up = U.ease.inOutQuad(t);
        c.fillStyle = '#0a0e14'; c.fillRect(0, 0, 180, 108);
        for (let y = 0; y < 70; y++) {
          const a = Math.max(0, up - y / 90);
          ART.px(c, 0, 70 - y, 180, 1, 'rgba(150,160,180,' + (a * 0.5).toFixed(3) + ')');
        }
        for (let i = 0; i < 180; i += 6) {
          const h = 16 + ((i * 17) % 30);
          ART.px(c, i, 70 - h, 6, h, '#0c1017');
          if ((i % 18) === 0) ART.px(c, i + 2, 70 - h + 4, 2, 2, 'rgba(255,220,140,' + (0.5 - up * 0.5) + ')');
        }
        ART.px(c, 0, 70, 180, 38, '#090c11');
        const w1 = PIXFONT.render('06:00', { scale: 3, color: '#eae4d0', shadow: '#12101d' });
        const w2 = PIXFONT.render('THE SHIFT IS OVER', { scale: 2, color: '#8fb3a0', shadow: '#12101d' });
        c.drawImage(w1, Math.round(90 - w1.width / 2), 80);
        c.drawImage(w2, Math.round(90 - w2.width / 2), 94);
        if (t < 1) requestAnimationFrame(draw); else setTimeout(res, 900);
      };
      draw();
    });
    root.innerHTML = ''; root.className = 'hidden';
  },

  /* a full-bleed card at the end of a reel */
  async titleBeat(head, sub, col) {
    const root = CINE.stage();
    root.className = 'anim-cut';
    root.innerHTML = '';
    const wrap = U.el('div', 'tb-card');
    wrap.appendChild(UI.wrap(head, 20, { scale: 8, color: col || PIX.PAL.W, outline: PIX.PAL.K }));
    wrap.appendChild(UI.wrap(sub, 34, { scale: 3, color: PIX.PAL.q }));
    root.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('in'));
    SFX.bank();
    await new Promise(res => {
      const done = () => { window.removeEventListener('pointerdown', done); window.removeEventListener('keydown', done); res(); };
      setTimeout(() => { window.addEventListener('pointerdown', done); window.addEventListener('keydown', done); }, 400);
      setTimeout(done, 4200);
    });
    root.innerHTML = ''; root.className = 'hidden';
  },
};
