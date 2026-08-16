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
    ['home',   'THEY ATE AT SIX. ALL OF THEM.'],
    ['door',   'AT SEVEN, THE DOOR CAME IN.'],
    ['after',  'THE HOUSE TOOK EVERYTHING BUT YOU.'],
    ['tower',  'THE HOUSE IS EIGHT FLOORS HIGH.'],
    ['stairs', 'THEY ARE ALL UPSTAIRS.'],
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
      const reel = short ? CINE.LORE.slice(3) : CINE.LORE;
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
      tail.appendChild(UI.txt('ONE FLOOR AT A TIME', { scale: 3, color: PIX.PAL.q }));
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
