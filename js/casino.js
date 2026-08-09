'use strict';
/* ============================================================
   SHELL & DEBT — casino.js
   The Midnight Floor as a drawn pixel scene: a slot cabinet,
   a blackjack table with its dealer, the wheel, the chicken
   pen, the pawn booth and the exit door. Plus the five
   mini-games, all sprites and numbers.
   ============================================================ */

/* casino-only sprites */
PIX.def('chip_r', `
..KKKKKK..
.KWrrrrWK.
KrWrrrrWrK
KrrrrrrrrK
KWrrrrrrWK
.KWrrrrWK.
..KKKKKK..`);
PIX.def('chip_k', `
..KKKKKK..
.KWttttWK.
KtWttttWtK
KttttttttK
KWttttttWK
.KWttttWK.
..KKKKKK..`);
PIX.def('chip_g', `
..KKKKKK..
.KWffffWK.
KfWffffWfK
KffffffffK
KWffffffWK
.KWffffWK.
..KKKKKK..`);
PIX.def('ic_melt', `
....KKKK....
..KK.OO.KK..
....KOYK....
..KKKKKKKK..
.KssssssssK.
.KsLLLLLLsK.
..KsLLLLsK..
...KssssK...
....KKKK....`);
PIX.def('ic_mirror', `
...KKKKK...
..KGLLLGK..
.KGLWLLLGK.
.KGLLWLLGK.
.KGLLLWLGK.
..KGLLLGK..
...KKKKK...
....KGK....
...KGGGK...`);
PIX.def('ic_jar', `
..KKKKKK..
..KwwwwK..
.KKKKKKKK.
.KLLLLLLK.
.KLVLLLLK.
.KLVVLLLK.
.KLLLLLLK.
..KKKKKK..`);
PIX.def('ic_needle', `
........KK
.......KWK
......KWK.
.....KWK..
....KWK...
...KWK....
..KRK.....
.KRK......
KK........`);
PIX.def('ic_dice', `
.KKKKKKK..
KWWWWWWWK.
KWKWWWKWK.
KWWWWWWWK.
KWWWKWWWK.
KWWWWWWWK.
KWKWWWKWK.
KWWWWWWWK.
.KKKKKKK..`);

const CASINO = {

  LW: 420, LH: 220,
  ambientTimer: null,
  defs: null,

  STATION_TIPS: {
    slots: ['🎰 ONE-ARMED BANDIT', 'Feed it chips, it pays in SHELLS. Triples drop good ammo; triple 7s drop a legendary. Three dry spins and the house slips you a blank in sympathy.'],
    bj: ['🃏 BLACKJACK', 'Beat the dealer for chips. Win with exactly 21 and a shell falls off the table. Dealer stands on 17.'],
    roulette: ['🎡 WHEEL OF FATES', 'One spin a night. Wherever it lands REWRITES the next round. Side-bet a color if you dare — red/black pays 2×, green 7×.'],
    derby: ['🐔 CHICKEN DERBY', 'Four athletes of questionable provenance. Longshot winners (5:1+) you backed shed a Feather Shell.'],
    pawn: ['🏚 PAWN SHOP', 'Charms and pouch surgery: melt a shell, mirror a shell, mystery jars, stitches for your nerve.'],
    door: ['🚬 THE NEXT TABLE', 'Walk through to face the next ante. The number over the door is the next debt.'],
  },

  /* ================= the floor scene ================= */

  buildFloor(app) {
    const wrap = U.el('div');
    wrap.id = 'casino-wrap';
    const stage = U.el('div');
    stage.id = 'casino-stage';
    wrap.appendChild(stage);
    app.appendChild(wrap);

    // integer scale to fit
    const fit = () => {
      const availW = wrap.clientWidth - 8, availH = wrap.clientHeight - 8;
      const s = Math.max(1, Math.floor(Math.min(availW / CASINO.LW, availH / CASINO.LH)));
      stage.style.width = CASINO.LW * s + 'px';
      stage.style.height = CASINO.LH * s + 'px';
      stage.dataset.scale = s;
      stage.querySelectorAll('.sc').forEach(el => {
        el.style.left = el.dataset.x * s + 'px';
        el.style.top = el.dataset.y * s + 'px';
        el.style.width = el.dataset.w * s + 'px';
        el.style.height = el.dataset.h * s + 'px';
      });
    };

    // background
    const bg = document.createElement('canvas');
    bg.width = CASINO.LW; bg.height = CASINO.LH;
    bg.className = 'pix sc';
    bg.dataset.x = 0; bg.dataset.y = 0; bg.dataset.w = CASINO.LW; bg.dataset.h = CASINO.LH;
    CASINO.drawBackdrop(bg.getContext('2d'));
    stage.appendChild(bg);

    // stations: [id, x, y, w, h, drawFn, signSprite, signX]
    const ST = [
      ['slots', 16, 46, 58, 98, CASINO.drawSlotsCab, 'sign_slots', 34],
      ['bj', 84, 88, 70, 56, CASINO.drawBJTable, 'sign_bj', 104],
      ['roulette', 162, 88, 66, 56, CASINO.drawRouletteTable, 'sign_wheel', 182],
      ['derby', 236, 86, 68, 58, CASINO.drawDerbyPen, 'sign_derby', 258],
      ['pawn', 312, 42, 62, 102, CASINO.drawPawnBooth, 'sign_pawn', 332],
    ];
    CASINO.stationCvs = {};
    ST.forEach(([id, x, y, w, h, drawFn, sign, signX]) => {
      if (sign) {
        const sg = PIX.el(sign, 1, 'sc neon-flicker');
        const ss = PIX.size(sign);
        sg.dataset.x = signX; sg.dataset.y = 16; sg.dataset.w = ss.w; sg.dataset.h = ss.h;
        stage.appendChild(sg);
      }
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.className = 'pix sc station has-tip';
      cv.dataset.station = id;
      cv.dataset.tipStation = id;
      cv.dataset.x = x; cv.dataset.y = y; cv.dataset.w = w; cv.dataset.h = h;
      drawFn(cv.getContext('2d'), w, h, 0);
      cv.onclick = () => {
        SFX.click();
        ({ slots: CASINO.openSlots, bj: CASINO.openBlackjack, roulette: CASINO.openRoulette,
           derby: CASINO.openDerby, pawn: CASINO.openPawn })[id]();
      };
      stage.appendChild(cv);
      CASINO.stationCvs[id] = { cv, drawFn, w, h };
    });

    // exit door
    const door = document.createElement('canvas');
    door.width = 34; door.height = 110;
    door.className = 'pix sc station has-tip';
    door.id = 'btn-next';
    door.dataset.tipStation = 'door';
    door.dataset.x = 380; door.dataset.y = 34; door.dataset.w = 34; door.dataset.h = 110;
    stage.appendChild(door);
    CASINO.doorCv = door;
    door.onclick = () => {
      SFX.chak();
      UI.closeModal();
      CASINO.stopAmbient();
      E.nextAnte();
      UI.render();
    };

    // HUD chips / nerve / pouch (top-left)
    const hud = U.el('div', 'sc cas-hud');
    hud.dataset.x = 8; hud.dataset.y = 4; hud.dataset.w = 200; hud.dataset.h = 26;
    hud.id = 'cas-hud';
    stage.appendChild(hud);

    fit();
    window.onresize = fit;
    CASINO.syncFloor();
    CASINO.startAmbient();
  },

  drawBackdrop(ctx) {
    const W = CASINO.LW, H = CASINO.LH, P = PIX.PAL;
    // wall
    PIX.rect(ctx, 0, 0, W, 96, '#191430');
    for (let x = 0; x < W; x += 60) {
      PIX.rect(ctx, x, 0, 2, 96, '#120e24');
      PIX.rect(ctx, x + 2, 0, 1, 96, '#221c40');
    }
    // string lights
    for (let x = 4; x < W; x += 8) {
      ctx.fillStyle = (x / 8) % 3 === 0 ? P.G : '#2a2348';
      ctx.fillRect(x, 8, 1, 1);
      ctx.fillStyle = '#2a2348';
      ctx.fillRect(x - 4, 7, 1, 1);
    }
    // wainscot + baseboard
    PIX.rect(ctx, 0, 84, W, 12, '#241a12');
    PIX.rect(ctx, 0, 84, W, 1, P.h);
    PIX.rect(ctx, 0, 95, W, 1, P.K);
    // carpet
    PIX.rect(ctx, 0, 96, W, H - 96, '#2a0a14');
    for (let y = 96; y < H; y += 6) {
      for (let x = ((y / 6) % 2) * 6; x < W; x += 12) {
        ctx.fillStyle = '#38101c';
        ctx.fillRect(x, y + 2, 2, 2);
        ctx.fillStyle = '#1c0710';
        ctx.fillRect(x + 6, y + 2, 1, 1);
      }
    }
    // light cones over stations
    ctx.globalAlpha = 0.055;
    [45, 118, 194, 268, 342].forEach(cx => {
      ctx.fillStyle = '#fff3b0';
      for (let y = 12; y < 96; y += 1) {
        const half = 3 + (y - 12) * 0.34;
        ctx.fillRect(cx - half, y, half * 2, 1);
      }
    });
    ctx.globalAlpha = 1;
    // lamps
    [45, 118, 194, 268, 342].forEach(cx => {
      PIX.rect(ctx, cx, 2, 1, 6, P.K);
      PIX.rect(ctx, cx - 4, 8, 9, 3, P.K);
      PIX.rect(ctx, cx - 3, 9, 7, 2, P.g);
      PIX.rect(ctx, cx - 2, 11, 5, 1, P.Y);
    });
  },

  /* --- station drawings (w × h logical canvases) --- */

  drawSlotsCab(ctx, w, h, tick) {
    const P = PIX.PAL;
    ctx.clearRect(0, 0, w, h);
    // legs + shadow
    PIX.rect(ctx, 4, h - 4, w - 8, 3, 'rgba(0,0,0,.5)');
    PIX.rect(ctx, 6, h - 8, 4, 6, P.U); PIX.rect(ctx, w - 12, h - 8, 4, 6, P.U);
    // body
    PIX.panel(ctx, 2, 12, w - 10, h - 20, P.t, P.K, P.s);
    PIX.rect(ctx, 4, 14, 3, h - 26, P.T);
    // marquee
    PIX.panel(ctx, 4, 2, w - 14, 14, P.d, P.K, P.r);
    for (let i = 0; i < 5; i++) {
      const on = tick >= 0 ? ((i + tick) % 3 === 0) : i % 2 === 0;
      ctx.fillStyle = on ? P.Y : P.H;
      ctx.fillRect(8 + i * 8, 6, 3, 3);
    }
    PIX.draw(ctx, 'sym_seven', Math.round(w / 2) - 12, 4, 1);
    // screen with 3 windows
    PIX.panel(ctx, 8, 22, w - 22, 26, P.Z, P.K);
    for (let i = 0; i < 3; i++) {
      PIX.rect(ctx, 11 + i * 12, 26, 10, 16, P.K);
      PIX.rect(ctx, 12 + i * 12, 27, 8, 14, P.W);
      const syms = ['sym_fire', 'sym_gold', 'sym_skull'];
      const m = PIX.make(syms[(i + (tick > 0 ? tick : 0)) % 3], 1);
      ctx.save();
      ctx.beginPath(); ctx.rect(12 + i * 12, 27, 8, 14); ctx.clip();
      ctx.drawImage(m, 12 + i * 12 - 2, 28, 12, 12);
      ctx.restore();
    }
    // lever
    PIX.rect(ctx, w - 7, 26, 3, 3, P.K);
    PIX.rect(ctx, w - 6, 12, 2, 16, P.s);
    PIX.disc(ctx, w - 5, 10, 2, P.r);
    // buttons + tray
    PIX.rect(ctx, 12, 54, 6, 4, P.r); PIX.rect(ctx, 22, 54, 6, 4, P.G); PIX.rect(ctx, 32, 54, 6, 4, P.n);
    PIX.panel(ctx, 10, 64, w - 26, 12, P.T, P.K);
    PIX.rect(ctx, 14, 68, w - 34, 4, P.Z);
    // coin glint
    if (tick % 4 === 1) PIX.draw(ctx, 'ic_coin', w - 20, 66, 1);
  },

  drawBJTable(ctx, w, h, tick) {
    const P = PIX.PAL;
    ctx.clearRect(0, 0, w, h);
    // dealer silhouette
    const dx = Math.round(w / 2);
    PIX.disc(ctx, dx, 10, 6, P.k);
    PIX.rect(ctx, dx - 9, 15, 18, 12, P.k);
    PIX.rect(ctx, dx - 2, 16, 4, 2, P.r); // bowtie
    PIX.disc(ctx, dx - 2, 9, 1, P.q); PIX.disc(ctx, dx + 2, 9, 1, P.q); // eyes
    // half-round table
    for (let y = 0; y < 22; y++) {
      const half = Math.floor(Math.sqrt(1 - Math.pow(y / 22, 2)) * (w / 2 - 2));
      PIX.rect(ctx, dx - half, 26 + y, half * 2, 1, y < 3 ? P.b : (y < 5 ? P.K : P.f));
    }
    PIX.rect(ctx, dx - (w / 2 - 4), 31, w - 8, 2, P.e);
    // cards on felt
    const card = (x, y, red) => {
      PIX.rect(ctx, x, y, 5, 7, P.K); PIX.rect(ctx, x + 1, y + 1, 3, 5, P.W);
      ctx.fillStyle = red ? P.r : P.K; ctx.fillRect(x + 2, y + 3, 1, 1);
    };
    card(dx - 14, 34, true); card(dx - 7, 36, false); card(dx + 4, 35, true);
    // chips
    PIX.draw(ctx, 'chip_r', dx + 12, 36, 1);
    PIX.rect(ctx, dx - 20, 40, 4, 2, P.G); PIX.rect(ctx, dx - 20, 38, 4, 2, P.g);
    // stools
    PIX.rect(ctx, dx - 18, h - 6, 8, 2, P.U); PIX.rect(ctx, dx + 10, h - 6, 8, 2, P.U);
    if (tick % 6 === 2) { ctx.fillStyle = P.W; ctx.fillRect(dx - 2 + (tick % 2), 9, 1, 1); } // blink
  },

  drawRouletteTable(ctx, w, h, tick) {
    const P = PIX.PAL;
    ctx.clearRect(0, 0, w, h);
    // table
    PIX.panel(ctx, 2, 18, w - 4, h - 24, P.f, P.K, P.F);
    PIX.rect(ctx, 4, 20, w - 8, 2, P.e);
    PIX.rect(ctx, 2, h - 8, w - 4, 3, P.b);
    // wheel (slow idle turn)
    const segs = [];
    const fl = Object.values(FATES);
    for (let i = 0; i < 12; i++) {
      const c = fl[i % fl.length].color;
      segs.push(c === 'R' ? P.d : c === 'B' ? P.Z : P.e);
    }
    SPR.drawWheel(ctx, 18, h - 24, 13, (tick || 0) * 0.12, segs);
    // bet grid
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 4; gx++) {
      ctx.fillStyle = (gx + gy) % 2 ? P.d : P.Z;
      ctx.fillRect(36 + gx * 6, h - 34 + gy * 6, 5, 5);
    }
    PIX.frame(ctx, 35, h - 35, 26, 19, P.W);
    PIX.draw(ctx, 'chip_g', 40, h - 18, 1);
  },

  drawDerbyPen(ctx, w, h, tick) {
    const P = PIX.PAL;
    ctx.clearRect(0, 0, w, h);
    // banner
    PIX.rect(ctx, 4, 2, 2, 16, P.u); PIX.rect(ctx, w - 6, 2, 2, 16, P.u);
    PIX.rect(ctx, 4, 2, w - 8, 6, P.O);
    PIX.rect(ctx, 4, 2, w - 8, 1, P.Y);
    for (let x = 6; x < w - 6; x += 6) { ctx.fillStyle = P.K; ctx.fillRect(x, 4, 1, 2); }
    // dirt
    PIX.panel(ctx, 2, 22, w - 4, h - 28, P.u, P.K, P.b);
    PIX.dither(ctx, 5, 26, w - 10, h - 36, '#5d3d26', '#523522');
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = P.q;
      ctx.fillRect(6 + (i * 37) % (w - 14), 28 + (i * 23) % (h - 40), 1, 1);
    }
    // fence
    for (let x = 2; x < w - 2; x += 10) PIX.rect(ctx, x, 30, 2, h - 36, P.U);
    PIX.rect(ctx, 2, 34, w - 4, 2, P.b);
    PIX.rect(ctx, 2, 44, w - 4, 2, P.b);
    // chickens pecking
    const f1 = (tick || 0) % 2 === 0 ? 'chick_white_1' : 'chick_white_2';
    const f2 = (tick || 0) % 2 === 1 ? 'chick_brown_1' : 'chick_brown_2';
    PIX.draw(ctx, f1, 10, h - 22, 1);
    PIX.draw(ctx, f2, w - 30, h - 26, 1);
  },

  drawPawnBooth(ctx, w, h, tick) {
    const P = PIX.PAL;
    ctx.clearRect(0, 0, w, h);
    // body
    PIX.panel(ctx, 2, 14, w - 4, h - 18, P.u, P.K, P.b);
    // awning
    for (let i = 0; i < Math.floor((w - 4) / 8); i++) {
      const col = i % 2 ? P.d : P.w;
      PIX.rect(ctx, 2 + i * 8, 6, 8, 8, col);
      PIX.rect(ctx, 4 + i * 8, 14, 4, 2, col);
    }
    PIX.rect(ctx, 2, 5, w - 4, 1, P.K);
    // three golden balls
    PIX.disc(ctx, 12, 24, 3, P.K); PIX.disc(ctx, 12, 23, 2, P.G);
    PIX.disc(ctx, 20, 26, 3, P.K); PIX.disc(ctx, 20, 25, 2, P.G);
    PIX.disc(ctx, 28, 24, 3, P.K); PIX.disc(ctx, 28, 23, 2, P.G);
    // barred window with wares
    PIX.panel(ctx, 8, 34, w - 16, 34, P.Z, P.K);
    PIX.draw(ctx, 'charmbase_rare', 12, 42, 1);
    PIX.draw(ctx, 'charmbase_uncommon', 32, 46, 1);
    ctx.fillStyle = 'rgba(20,16,40,.35)'; ctx.fillRect(9, 35, w - 18, 32);
    for (let x = 12; x < w - 12; x += 8) PIX.rect(ctx, x, 34, 2, 34, P.T);
    // counter + lamp glow
    PIX.rect(ctx, 4, 70, w - 8, 4, P.b);
    PIX.rect(ctx, 4, 70, w - 8, 1, P.B);
    if ((tick || 0) % 5 !== 4) { ctx.fillStyle = P.Y; ctx.fillRect(w - 14, 76, 2, 2); }
    PIX.rect(ctx, w - 15, 78, 4, 6, P.T);
  },

  drawDoor(ctx) {
    const P = PIX.PAL, w = 34, h = 110;
    ctx.clearRect(0, 0, w, h);
    // debt over the door
    const debtNum = PIXFONT.render(U.fmt(CASINO.nextDebt()), { scale: 1, color: P.G, shadow: P.K });
    ctx.drawImage(debtNum, Math.max(0, Math.round((w - debtNum.width) / 2)), 0);
    // boss warning emblem
    const boss = E.upcomingBoss();
    if (boss && boss !== 'random') {
      const em = SPR.emblemMaster('boss', boss);
      ctx.drawImage(em, Math.round(w / 2 - 8), 10);
    } else if (boss === 'random') {
      const q = PIXFONT.render('?', { scale: 2, color: P.R, shadow: P.K });
      ctx.drawImage(q, Math.round(w / 2 - q.width / 2), 10);
    }
    const fate = G.nextFate;
    if (fate) {
      const em = SPR.emblemMaster('fate', fate);
      ctx.drawImage(em, Math.round(w / 2 - 8), boss ? 27 : 10);
    }
    // frame + door
    const dy = 46;
    PIX.panel(ctx, 2, dy, w - 4, h - dy - 2, P.b, P.K, P.B);
    PIX.rect(ctx, 6, dy + 4, w - 12, h - dy - 10, P.D);
    PIX.frame(ctx, 6, dy + 4, w - 12, h - dy - 10, P.K);
    PIX.rect(ctx, 9, dy + 8, w - 18, 18, P.d);
    PIX.frame(ctx, 9, dy + 8, w - 18, 18, P.K);
    PIX.rect(ctx, 9, dy + 30, w - 18, 22, P.d);
    PIX.frame(ctx, 9, dy + 30, w - 18, 22, P.K);
    PIX.disc(ctx, w - 11, dy + 30, 2, P.G);
    // neon arrow above handle
    const ar = PIXFONT.render('>', { scale: 2, color: P.N });
    ctx.drawImage(ar, Math.round(w / 2 - ar.width / 2), dy + 12);
  },

  nextDebt() {
    const nextAnte = G.ante + 1;
    return (nextAnte <= DEBTS.length)
      ? DEBTS[nextAnte - 1]
      : Math.round(DEBTS[DEBTS.length - 1] * Math.pow(1.6, nextAnte - DEBTS.length) / 10) * 10;
  },

  startAmbient() {
    CASINO.stopAmbient();
    let tick = 0;
    CASINO.ambientTimer = setInterval(() => {
      if (G.phase !== 'casino' || !document.getElementById('casino-stage')) {
        CASINO.stopAmbient(); return;
      }
      tick++;
      ['slots', 'bj', 'roulette', 'derby', 'pawn'].forEach(id => {
        const st = CASINO.stationCvs[id];
        if (st) st.drawFn(st.cv.getContext('2d'), st.w, st.h, tick);
      });
    }, 420);
  },

  stopAmbient() {
    if (CASINO.ambientTimer) { clearInterval(CASINO.ambientTimer); CASINO.ambientTimer = null; }
  },

  syncFloor() {
    const hud = document.getElementById('cas-hud');
    if (hud) {
      hud.innerHTML = '';
      const row = (icon, canvas) => {
        const r = U.el('span', 'hud-bit');
        r.appendChild(PIX.el(icon, 2));
        r.appendChild(canvas);
        hud.appendChild(r);
      };
      row('ic_chip', UI.num(G.chips, { scale: 2, color: PIX.PAL.G }));
      row('ic_heart', UI.txt(G.nerve + '/' + G.nerveMax, { scale: 2, color: PIX.PAL.R }));
      const pouch = U.el('span', 'hud-bit');
      pouch.appendChild(SPR.shellEl('live', 1));
      pouch.appendChild(UI.num(G.bag.length, { scale: 2, color: PIX.PAL.w }));
      hud.appendChild(pouch);
    }
    if (CASINO.doorCv) CASINO.drawDoor(CASINO.doorCv.getContext('2d'));
    // grey out spent stations
    Object.entries(CASINO.stationCvs || {}).forEach(([id, st]) => {
      const left = { slots: G.casino.slotsLeft, bj: G.casino.bjLeft, derby: G.casino.derbyLeft,
        roulette: G.casino.rouletteLeft }[id];
      st.cv.classList.toggle('spent-station', left !== undefined && left <= 0);
    });
  },

  chipsRow() {
    const d = U.el('div', 'bet-row');
    const b = U.el('span', 'hud-bit');
    b.id = 'mm-chips';
    b.appendChild(PIX.el('ic_chip', 2));
    b.appendChild(UI.num(G.chips, { scale: 3, color: PIX.PAL.G }));
    d.appendChild(b);
    return d;
  },

  syncChips() {
    const el = document.getElementById('mm-chips');
    if (el) {
      el.innerHTML = '';
      el.appendChild(PIX.el('ic_chip', 2));
      el.appendChild(UI.num(G.chips, { scale: 3, color: PIX.PAL.G }));
    }
    G.stats.chipsPeak = Math.max(G.stats.chipsPeak, G.chips);
    CASINO.syncFloor();
  },

  betPicker(group, amounts) {
    const d = U.el('div', 'bet-row');
    amounts.forEach((a, i) => {
      const b = U.el('button', 'pixbtn bet-btn' + (i === 0 ? ' sel' : ''));
      b.dataset.bet = a; b.dataset.group = group;
      b.appendChild(PIX.el('ic_coin', 2));
      b.appendChild(UI.txt('' + a, { scale: 2, color: PIX.PAL.W }));
      d.appendChild(b);
    });
    return d;
  },

  wireBetPicker(modal, group, onChange) {
    modal.querySelectorAll(`[data-group="${group}"]`).forEach(b => {
      b.onclick = () => {
        SFX.click();
        modal.querySelectorAll(`[data-group="${group}"]`).forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        if (onChange) onChange(+b.dataset.bet);
      };
    });
  },

  getBet(modal, group) {
    const sel = modal.querySelector(`[data-group="${group}"].sel`);
    return sel ? +sel.dataset.bet : 5;
  },

  mkClose(m) {
    const b = m.querySelector('.m-close');
    if (b) {
      b.appendChild(UI.txt('X', { scale: 2, color: PIX.PAL.W, shadow: null }));
      b.onclick = () => { SFX.click(); UI.closeModal(); };
    }
  },

  /* ================= SLOTS ================= */

  slotCost() { return E.price(E.has('gremlin') ? 3 : 6); },

  openSlots() {
    const m = UI.modal(`
      <button class="pixbtn m-close"></button>
      <div class="mg-wrap">
        <div id="slot-machine">
          <canvas id="slot-cab" class="pix" width="120" height="104"></canvas>
          <div id="reel-strip"></div>
        </div>
        <div class="bet-row" id="slot-ctl"></div>
        <div class="mg-result" id="slot-result"></div>
        <div class="pay-icons" id="slot-pay"></div>
      </div>
    `);
    CASINO.mkClose(m);

    const cab = m.querySelector('#slot-cab');
    CASINO.drawSlotCabinetBig(cab.getContext('2d'), 0, false);

    // three reel canvases overlay the cabinet windows
    const strip = m.querySelector('#reel-strip');
    const reels = [];
    const SYMS = SLOT_SYMBOLS.map(s => s.s);
    const SPRITE = { '🔥': 'sym_fire', '⚪': 'sym_blank', '🐔': 'sym_bird', '💰': 'sym_gold',
      '🕸️': 'sym_web', '💀': 'sym_skull', '7️⃣': 'sym_seven' };
    for (let i = 0; i < 3; i++) {
      const cv = document.createElement('canvas');
      cv.width = 20; cv.height = 24;
      cv.className = 'pix reel-cv';
      cv.style.left = (18 + i * 30) + 'px';
      strip.appendChild(cv);
      reels.push({ cv, ctx: cv.getContext('2d'), offset: 0, strip: [], spinning: false, result: '🔥' });
      CASINO.drawReel(reels[i], SPRITE);
    }

    const ctl = m.querySelector('#slot-ctl');
    ctl.appendChild(CASINO.chipsRow());
    const spinBtn = U.el('button', 'pixbtn gold');
    spinBtn.id = 'btn-spin-slots';
    ctl.appendChild(spinBtn);
    const pips = U.el('span', 'uses-pips');
    ctl.appendChild(pips);

    const syncBtn = () => {
      spinBtn.innerHTML = '';
      spinBtn.appendChild(PIX.el('ic_coin', 2));
      spinBtn.appendChild(UI.txt('' + CASINO.slotCost(), { scale: 3, color: PIX.PAL.K, shadow: null }));
      spinBtn.appendChild(UI.txt('SPIN', { scale: 2, color: PIX.PAL.K, shadow: null }));
      spinBtn.disabled = G.casino.slotsLeft <= 0 || G.chips < CASINO.slotCost();
      pips.innerHTML = '';
      for (let i = 0; i < 5; i++) pips.appendChild(PIX.el(i < G.casino.slotsLeft ? 'ic_diamond' : 'ic_diamond_off', 1));
    };
    syncBtn();

    // pictogram paytable
    const pay = m.querySelector('#slot-pay');
    const payRow = (symName, n, out) => {
      const r = U.el('span', 'pay-cell');
      for (let i = 0; i < n; i++) r.appendChild(PIX.el(symName, 1));
      r.appendChild(UI.txt('=', { scale: 1, color: PIX.PAL.q, shadow: null }));
      out.forEach(o => r.appendChild(o));
      pay.appendChild(r);
    };
    payRow('sym_fire', 3, [SPR.shellEl('buck', 1)]);
    payRow('sym_blank', 3, [SPR.shellEl('blank', 1), SPR.shellEl('blank', 1)]);
    payRow('sym_bird', 3, [SPR.shellEl('feather', 1)]);
    payRow('sym_web', 3, [SPR.shellEl('web', 1)]);
    payRow('sym_skull', 3, [SPR.shellEl('cursed', 1)]);
    payRow('sym_gold', 3, [PIX.el('ic_coin', 1), UI.txt('40', { scale: 1, color: PIX.PAL.G, shadow: null })]);
    payRow('sym_seven', 3, [SPR.shellEl('magnet', 1), SPR.shellEl('dead', 1), UI.txt('60', { scale: 1, color: PIX.PAL.G, shadow: null })]);

    spinBtn.onclick = async () => {
      const cost = CASINO.slotCost();
      if (G.chips < cost || G.casino.slotsLeft <= 0) return;
      G.chips -= cost;
      G.casino.slotsLeft--;
      CASINO.syncChips();
      spinBtn.disabled = true;
      m.querySelector('#slot-result').innerHTML = '';
      SFX.spin();
      CASINO.drawSlotCabinetBig(cab.getContext('2d'), 1, true);

      const res = [0, 1, 2].map(() => U.wpick(G.rng, SLOT_SYMBOLS, s => s.w).s);
      const spins = reels.map((r, i) => CASINO.spinReel(r, SPRITE, SYMS, res[i], 900 + i * 450));
      await Promise.all(spins);
      CASINO.drawSlotCabinetBig(cab.getContext('2d'), 0, false);
      CASINO.slotPayout(res, m.querySelector('#slot-result'), SPRITE);
      CASINO.syncChips();
      syncBtn();
    };
  },

  drawSlotCabinetBig(ctx, leverState, lightsOn) {
    const P = PIX.PAL, w = 120, h = 104;
    ctx.clearRect(0, 0, w, h);
    PIX.panel(ctx, 4, 10, w - 20, h - 14, P.t, P.K, P.s);
    PIX.rect(ctx, 7, 13, 4, h - 20, P.T);
    // marquee
    PIX.panel(ctx, 8, 0, w - 28, 14, P.d, P.K, P.r);
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = (lightsOn ? (i % 2 === 0) : (i % 3 === 0)) ? P.Y : P.H;
      ctx.fillRect(12 + i * 10, 4, 4, 4);
    }
    // window plate
    PIX.panel(ctx, 12, 20, w - 36, 36, P.Z, P.K);
    for (let i = 0; i < 3; i++) {
      PIX.rect(ctx, 17 + i * 30, 25, 24, 28, P.K);
      PIX.rect(ctx, 18 + i * 30, 26, 22, 26, P.W);
    }
    // lever
    PIX.rect(ctx, w - 14, 34, 6, 6, P.K);
    if (leverState === 0) {
      PIX.rect(ctx, w - 12, 14, 3, 22, P.s);
      PIX.disc(ctx, w - 10, 11, 3, P.r);
      PIX.disc(ctx, w - 11, 10, 1, P.R);
    } else {
      PIX.rect(ctx, w - 12, 38, 3, 20, P.s);
      PIX.disc(ctx, w - 10, 59, 3, P.r);
    }
    // button row + tray
    PIX.rect(ctx, 20, 62, 10, 6, P.r); PIX.rect(ctx, 36, 62, 10, 6, P.G); PIX.rect(ctx, 52, 62, 10, 6, P.n);
    PIX.panel(ctx, 16, 74, w - 44, 20, P.T, P.K);
    PIX.rect(ctx, 22, 80, w - 56, 8, P.Z);
  },

  drawReel(reel, SPRITE) {
    const ctx = reel.ctx;
    ctx.clearRect(0, 0, 20, 24);
    ctx.fillStyle = PIX.PAL.W;
    ctx.fillRect(0, 0, 20, 24);
    const m = PIX.make(SPRITE[reel.result] || 'sym_fire', 1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(m, 3, 5, 14, 14);
  },

  spinReel(reel, SPRITE, SYMS, result, dur) {
    return new Promise(res => {
      const ctx = reel.ctx;
      const strip = [];
      for (let i = 0; i < 14; i++) strip.push(SYMS[Math.floor(Math.random() * SYMS.length)]);
      strip.push(result);
      const start = performance.now();
      const tick = () => {
        const t = (performance.now() - start) / dur;
        if (t >= 1) {
          reel.result = result;
          CASINO.drawReel(reel, SPRITE);
          SFX.chak();
          res();
          return;
        }
        const ease = 1 - Math.pow(1 - t, 2.4);
        const pos = ease * (strip.length - 1) * 24;
        ctx.fillStyle = PIX.PAL.W;
        ctx.fillRect(0, 0, 20, 24);
        ctx.imageSmoothingEnabled = false;
        const idx = Math.floor(pos / 24);
        const off = pos % 24;
        for (let k = -1; k <= 1; k++) {
          const si = U.clamp(idx + k, 0, strip.length - 1);
          const mm = PIX.make(SPRITE[strip[si]] || 'sym_fire', 1);
          ctx.drawImage(mm, 3, 5 + k * 24 - off + 24, 14, 14);
        }
        // motion lines
        ctx.fillStyle = 'rgba(18,16,29,.25)';
        ctx.fillRect(0, 0, 20, 3); ctx.fillRect(0, 21, 20, 3);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  },

  slotPayout(res, out, SPRITE) {
    const count = {};
    res.forEach(s => count[s] = (count[s] || 0) + 1);
    const three = Object.keys(count).find(s => count[s] === 3);
    const pair = Object.keys(count).find(s => count[s] === 2);
    const gained = [];
    let chips = 0;

    const give = (id) => { E.addShellById(id); gained.push(id); };

    if (three) {
      switch (three) {
        case '🔥': give('buck'); break;
        case '⚪': give('blank'); give('blank'); chips = 4; break;
        case '🐔': give('feather'); chips = 6; break;
        case '🕸️': give('web'); break;
        case '💀': give('cursed'); chips = 10; break;
        case '💰': chips = 40; break;
        case '7️⃣': {
          give(U.pick(G.rng, SHELL_POOLS.legendary));
          chips = 60;
          G.stats.jackpots++;
          SFX.jackpot(); UI.flash('go-gold'); UI.particles('ic_coin', 26); BG.pulse('#ffd75e', 800);
          break;
        }
      }
      G.casino.pityCount = 0;
    } else if (count['7️⃣'] === 2) { chips = 12; G.casino.pityCount = 0; }
    else if (pair === '🔥') { give('live'); G.casino.pityCount = 0; }
    else if (pair === '⚪') { give('blank'); G.casino.pityCount = 0; }
    else if (pair === '🐔') { chips = 3; G.casino.pityCount = 0; }
    else if (pair === '💰') { chips = 6; G.casino.pityCount = 0; }
    else if (pair === '🕸️' && G.rng() < 0.25) { give('web'); G.casino.pityCount = 0; }
    else G.casino.pityCount++;

    if (!gained.length && !chips && G.casino.pityCount >= 3) {
      give('blank');
      G.casino.pityCount = 0;
    }

    G.chips += chips;
    if (gained.length || chips) SFX.coin();

    out.innerHTML = '';
    if (gained.length) {
      gained.forEach(id => {
        const s = SPR.shellEl(id, 3, 'has-tip pop');
        s.dataset.tipShell = id;
        out.appendChild(s);
      });
    }
    if (chips) {
      out.appendChild(PIX.el('ic_coin', 2));
      out.appendChild(UI.txt('+' + chips, { scale: 3, color: PIX.PAL.G }));
    }
    if (!gained.length && !chips) {
      out.appendChild(UI.txt('...', { scale: 3, color: PIX.PAL.q }));
    }
  },

  /* ================= BLACKJACK ================= */

  openBlackjack() {
    const m = UI.modal(`
      <button class="pixbtn m-close"></button>
      <div class="mg-wrap">
        <div class="bj-felt">
          <div class="bj-row"><span class="bj-total" id="bj-dtotal"></span><div class="cards-row" id="bj-dealer"></div></div>
          <div class="bj-divider"></div>
          <div class="bj-row"><span class="bj-total" id="bj-ptotal"></span><div class="cards-row" id="bj-player"></div></div>
        </div>
        <div class="bet-row" id="bj-ctl"></div>
        <div class="bet-row" id="bj-acts"></div>
        <div class="mg-result" id="bj-result"></div>
      </div>
    `);
    CASINO.mkClose(m);

    const ctl = m.querySelector('#bj-ctl');
    ctl.appendChild(CASINO.chipsRow());
    ctl.appendChild(CASINO.betPicker('bj', [5, 10, 25]));
    const pips = U.el('span', 'uses-pips');
    ctl.appendChild(pips);

    const acts = m.querySelector('#bj-acts');
    const mkAct = (id, canvasParts, gold) => {
      const b = U.el('button', 'pixbtn' + (gold ? ' gold' : ''));
      b.id = id;
      canvasParts.forEach(p => b.appendChild(p));
      acts.appendChild(b);
      return b;
    };
    const dealB = mkAct('bj-deal', [UI.txt('DEAL', { scale: 3, color: PIX.PAL.K, shadow: null })], true);
    const hitB = mkAct('bj-hit', [UI.txt('+', { scale: 3, color: PIX.PAL.N })]);
    const standB = mkAct('bj-stand', [UI.txt('STAND', { scale: 2, color: PIX.PAL.W })]);
    const dblB = mkAct('bj-double', [UI.txt('X2', { scale: 3, color: PIX.PAL.G })]);

    const S = { deck: [], p: [], d: [], bet: 0, live: false };
    const $ = (id) => m.querySelector('#' + id);

    const val = (hand) => {
      let t = 0, aces = 0;
      hand.forEach(c => {
        if (c.r === 'A') { t += 11; aces++; }
        else if (['J', 'Q', 'K'].includes(c.r)) t += 10;
        else t += +c.r;
      });
      while (t > 21 && aces--) t -= 10;
      return t;
    };

    const paint = (reveal) => {
      const dRow = $('bj-dealer'), pRow = $('bj-player');
      dRow.innerHTML = ''; pRow.innerHTML = '';
      S.p.forEach(c => pRow.appendChild(SPR.cardEl(c.r, c.s, true, 2)));
      S.d.forEach((c, i) => {
        const up = !(i === 1 && !reveal && !E.has('markedCards'));
        dRow.appendChild(SPR.cardEl(c.r, c.s, up, 2));
      });
      UI.put($('bj-ptotal'), S.p.length
        ? UI.txt('' + val(S.p), { scale: 3, color: val(S.p) > 21 ? PIX.PAL.R : PIX.PAL.W }) : UI.txt('', { scale: 1 }));
      UI.put($('bj-dtotal'), S.d.length
        ? ((reveal || E.has('markedCards'))
          ? UI.txt('' + val(S.d), { scale: 3, color: PIX.PAL.W })
          : UI.txt(val([S.d[0]]) + '+?', { scale: 3, color: PIX.PAL.q }))
        : UI.txt('', { scale: 1 }));
    };

    const syncBtns = () => {
      dealB.innerHTML = '';
      dealB.appendChild(UI.txt('DEAL', { scale: 3, color: PIX.PAL.K, shadow: null }));
      dealB.appendChild(PIX.el('ic_coin', 2));
      dealB.appendChild(UI.txt('' + CASINO.getBet(m, 'bj'), { scale: 2, color: PIX.PAL.K, shadow: null }));
      dealB.disabled = S.live || G.casino.bjLeft <= 0 || G.chips < CASINO.getBet(m, 'bj');
      hitB.disabled = !S.live;
      standB.disabled = !S.live;
      dblB.disabled = !S.live || S.p.length !== 2 || G.chips < S.bet;
      pips.innerHTML = '';
      for (let i = 0; i < 3; i++) pips.appendChild(PIX.el(i < G.casino.bjLeft ? 'ic_diamond' : 'ic_diamond_off', 1));
    };
    CASINO.wireBetPicker(m, 'bj', syncBtns);

    const draw = () => {
      if (!S.deck.length) {
        BJ_SUITS.forEach(s => BJ_RANKS.forEach(r => S.deck.push({ s, r })));
        U.shuffle(G.rng, S.deck);
      }
      return S.deck.pop();
    };

    const finish = (delta, shellWin, push) => {
      S.live = false;
      paint(true);
      if (delta > 0) { SFX.coin(); G.stats.bjWins++; }
      if (delta < 0) SFX.dud();
      G.chips += Math.max(0, delta + S.bet);
      const out = $('bj-result');
      out.innerHTML = '';
      out.appendChild(PIX.el('ic_chip', 2));
      out.appendChild(UI.txt(delta > 0 ? '+' + delta : delta < 0 ? '' + delta : '=',
        { scale: 3, color: delta > 0 ? PIX.PAL.G : delta < 0 ? PIX.PAL.R : PIX.PAL.q }));
      if (shellWin) {
        const pool = G.rng() < 0.7 ? 'common' : 'uncommon';
        const id = E.randomShellByRarity(pool);
        E.addShellById(id);
        const sp = SPR.shellEl(id, 3, 'has-tip pop');
        sp.dataset.tipShell = id;
        out.appendChild(sp);
      }
      CASINO.syncChips();
      syncBtns();
    };

    const dealerPlay = async () => {
      S.live = false; syncBtns();
      paint(true);
      while (val(S.d) < 17) {
        await U.sleep(500);
        S.d.push(draw()); SFX.deal();
        paint(true);
      }
      const pv = val(S.p), dv = val(S.d);
      if (dv > 21) finish(S.bet, pv === 21);
      else if (pv > dv) finish(S.bet, pv === 21);
      else if (pv < dv) finish(-S.bet, false);
      else finish(0, false, true);
    };

    dealB.onclick = () => {
      S.bet = CASINO.getBet(m, 'bj');
      if (G.chips < S.bet || G.casino.bjLeft <= 0) return;
      SFX.deal();
      G.chips -= S.bet;
      G.casino.bjLeft--;
      S.deck = []; S.p = []; S.d = []; S.live = true;
      $('bj-result').innerHTML = '';
      S.p.push(draw(), draw());
      S.d.push(draw(), draw());
      paint(false);
      CASINO.syncChips();
      syncBtns();
      const pv = val(S.p), dv = val(S.d);
      if (pv === 21 && dv === 21) return finish(0, false, true);
      if (pv === 21) return finish(Math.ceil(S.bet * 1.5), true);
      if (dv === 21) return finish(-S.bet, false);
    };

    hitB.onclick = () => {
      if (!S.live) return;
      SFX.deal();
      S.p.push(draw());
      paint(false);
      if (val(S.p) > 21) finish(-S.bet, false);
      else if (val(S.p) === 21) dealerPlay();
      else syncBtns();
    };
    standB.onclick = () => { if (S.live) dealerPlay(); };
    dblB.onclick = () => {
      if (!S.live || S.p.length !== 2 || G.chips < S.bet) return;
      SFX.deal();
      G.chips -= S.bet;
      S.bet *= 2;
      CASINO.syncChips();
      S.p.push(draw());
      paint(false);
      if (val(S.p) > 21) finish(-S.bet, false);
      else dealerPlay();
    };

    paint(false);
    syncBtns();
  },

  /* ================= ROULETTE ================= */

  fateWheel() {
    const all = Object.values(FATES);
    const R = all.filter(f => f.color === 'R');
    const B = all.filter(f => f.color === 'B');
    const Gs = all.filter(f => f.color === 'G');
    return [Gs[0], R[0], B[0], R[1], B[1], R[2], B[2], Gs[1], R[3], B[3], R[4], B[4]].filter(Boolean);
  },

  openRoulette() {
    const m = UI.modal(`
      <button class="pixbtn m-close"></button>
      <div class="mg-wrap">
        <div class="roulette-zone">
          <canvas id="rwheel-cv" class="pix" width="104" height="104"></canvas>
          <div id="r-side">
            <div class="bet-row" id="r-colors"></div>
            <div class="bet-row" id="r-amounts"></div>
            <button class="pixbtn gold" id="btn-spin-wheel"></button>
            <div class="mg-result" id="r-result"></div>
          </div>
        </div>
        <div id="r-fate-zone"></div>
      </div>
    `);
    CASINO.mkClose(m);

    const fateList = CASINO.fateWheel();
    const P = PIX.PAL;
    const segColors = fateList.map(f => f.color === 'R' ? P.d : f.color === 'B' ? P.Z : P.e);
    const cv = m.querySelector('#rwheel-cv');
    const ctx = cv.getContext('2d');
    let rot = 0.3;
    SPR.drawWheel(ctx, 52, 52, 46, rot, segColors);
    // pin
    ctx.fillStyle = P.G;
    ctx.fillRect(50, 0, 4, 5);
    ctx.fillRect(51, 5, 2, 2);

    const colors = m.querySelector('#r-colors');
    [['R', 'chip_r'], ['B', 'chip_k'], ['G', 'chip_g'], ['none', null]].forEach(([col, spr], i) => {
      const b = U.el('button', 'pixbtn bet-btn' + (col === 'none' ? ' sel' : ''));
      b.dataset.col = col;
      if (spr) b.appendChild(PIX.el(spr, 2));
      else b.appendChild(UI.txt('-', { scale: 2, color: P.q }));
      colors.appendChild(b);
      b.onclick = () => {
        SFX.click();
        colors.querySelectorAll('[data-col]').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
      };
    });
    m.querySelector('#r-amounts').appendChild(CASINO.betPicker('rl', [5, 10, 25]));
    CASINO.wireBetPicker(m, 'rl');

    const btn = m.querySelector('#btn-spin-wheel');
    btn.appendChild(UI.txt('SPIN', { scale: 3, color: P.K, shadow: null }));
    btn.disabled = G.casino.rouletteLeft <= 0;

    btn.onclick = () => {
      if (G.casino.rouletteLeft <= 0) return;
      const colSel = m.querySelector('[data-col].sel').dataset.col;
      const bet = colSel === 'none' ? 0 : CASINO.getBet(m, 'rl');
      if (bet > G.chips) return;

      if (E.has('fateFinger')) {
        const opts = U.shuffle(G.rng, fateList.slice()).slice(0, 3);
        const zone = m.querySelector('#r-fate-zone');
        zone.innerHTML = '';
        const row = U.el('div', 'fate-pick-row');
        opts.forEach(f => {
          const c = U.el('button', 'pixbtn fate-card has-tip');
          c.dataset.tipFate = f.id;
          c.appendChild(SPR.emblemEl('fate', f.id, 3));
          c.appendChild(UI.txt('' + (f.num === 100 ? '00' : f.num),
            { scale: 2, color: f.color === 'R' ? P.R : f.color === 'G' ? P.F : P.w }));
          c.onclick = () => { zone.innerHTML = ''; CASINO.spinTo(m, f, bet, colSel, cv, segColors, fateList); };
          row.appendChild(c);
        });
        zone.appendChild(row);
        return;
      }
      CASINO.spinTo(m, U.pick(G.rng, fateList), bet, colSel, cv, segColors, fateList);
    };
  },

  async spinTo(m, fate, bet, colSel, cv, segColors, fateList) {
    const P = PIX.PAL;
    const idx = fateList.indexOf(fate);
    G.casino.rouletteLeft = 0;
    if (bet) { G.chips -= bet; CASINO.syncChips(); }
    m.querySelector('#btn-spin-wheel').disabled = true;

    SFX.spin();
    const ctx = cv.getContext('2d');
    // land segment idx under the pin (top): segment center angle = idx*30+15 deg from rot origin
    const segA = (idx + 0.5) / fateList.length * Math.PI * 2;
    const final = Math.PI * 8 + (Math.PI * 1.5 - segA); // pin sits at -90°
    const dur = 3000;
    const start = performance.now();
    let lastTick = 0;
    await new Promise(res => {
      const anim = () => {
        const t = Math.min(1, (performance.now() - start) / dur);
        const ease = 1 - Math.pow(1 - t, 3);
        const rot = ease * final;
        ctx.clearRect(0, 0, 104, 104);
        const ballA = -rot * 1.6 - Math.PI / 2;
        const ballD = 40 - ease * 10;
        SPR.drawWheel(ctx, 52, 52, 46, rot, segColors, t < 1 ? ballA : Math.PI * 1.5 - 0.001, t < 1 ? ballD : 34);
        ctx.fillStyle = P.G;
        ctx.fillRect(50, 0, 4, 5); ctx.fillRect(51, 5, 2, 2);
        if (t - lastTick > 0.08) { SFX.tick(); lastTick = t; }
        if (t < 1) requestAnimationFrame(anim); else res();
      };
      requestAnimationFrame(anim);
    });

    G.nextFate = fate.id;
    const out = m.querySelector('#r-result');
    out.innerHTML = '';
    const chipSpr = fate.color === 'R' ? 'chip_r' : fate.color === 'B' ? 'chip_k' : 'chip_g';
    out.appendChild(PIX.el(chipSpr, 2));
    out.appendChild(UI.txt('' + (fate.num === 100 ? '00' : fate.num),
      { scale: 3, color: fate.color === 'R' ? P.R : fate.color === 'G' ? P.F : P.W }));
    if (bet) {
      if (colSel === fate.color) {
        const pay = fate.color === 'G' ? bet * 7 : bet * 2;
        G.chips += pay;
        out.appendChild(UI.txt('+' + pay, { scale: 3, color: P.G }));
        SFX.coin();
      } else {
        out.appendChild(UI.txt('-' + bet, { scale: 3, color: P.R }));
      }
    }
    const zone = m.querySelector('#r-fate-zone');
    zone.innerHTML = '';
    const card = U.el('div', 'fate-card big has-tip pop');
    card.dataset.tipFate = fate.id;
    card.appendChild(SPR.emblemEl('fate', fate.id, 4));
    const arrow = U.el('span', 'fate-arrow');
    arrow.appendChild(UI.txt('>', { scale: 2, color: P.V }));
    arrow.appendChild(PIX.el('ic_chip', 2));
    arrow.appendChild(UI.txt('A' + (G.ante + 1), { scale: 2, color: P.V }));
    card.appendChild(arrow);
    zone.appendChild(card);
    CASINO.syncChips();
  },

  /* ================= CHICKEN DERBY ================= */

  openDerby() {
    const m = UI.modal(`
      <button class="pixbtn m-close"></button>
      <div class="mg-wrap">
        <div class="bet-row" id="derby-ctl"></div>
        <div id="chick-pick"></div>
        <canvas id="derby-cv" class="pix" width="360" height="112"></canvas>
        <div class="bet-row">
          <button class="pixbtn gold" id="btn-race"></button>
          <div class="mg-result" id="derby-result"></div>
        </div>
      </div>
    `);
    CASINO.mkClose(m);

    const ctl = m.querySelector('#derby-ctl');
    ctl.appendChild(CASINO.chipsRow());
    ctl.appendChild(CASINO.betPicker('derby', [5, 10, 25]));
    const pips = U.el('span', 'uses-pips');
    ctl.appendChild(pips);

    const cv = m.querySelector('#derby-cv');
    const ctx = cv.getContext('2d');
    const S = { field: [], pick: -1, running: false };
    const PALS = ['white', 'brown', 'black', 'gold'];

    const drawTrack = (posArr, frame) => {
      const P = PIX.PAL, W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      // crowd band
      PIX.rect(ctx, 0, 0, W, 16, '#191430');
      for (let x = 2; x < W; x += 4) {
        ctx.fillStyle = ['#3a3358', '#2a2348', '#443a66'][(x / 4) % 3 | 0];
        PIX.disc(ctx, x, 6 + ((x * 7) % 5), 1, ctx.fillStyle);
      }
      PIX.rect(ctx, 0, 16, W, 2, P.K);
      // lanes
      for (let l = 0; l < 4; l++) {
        const y = 18 + l * 23;
        PIX.rect(ctx, 0, y, W, 23, l % 2 ? '#5d3d26' : '#523522');
        for (let x = 0; x < W; x += 8) PIX.rect(ctx, x, y + 22, 4, 1, '#3a2617');
        for (let i = 0; i < 10; i++) {
          ctx.fillStyle = '#6e4a30';
          ctx.fillRect((i * 53 + l * 17) % W, y + 4 + (i * 11) % 16, 1, 1);
        }
      }
      // finish line
      for (let y = 18; y < H; y += 4) {
        PIX.rect(ctx, W - 14, y, 3, 2, P.W); PIX.rect(ctx, W - 14, y + 2, 3, 2, P.K);
      }
      PIX.rect(ctx, W - 6, 12, 2, H - 12, P.u);
      PIX.draw(ctx, 'ic_flag', W - 12, 2, 1);
      // chickens
      S.field.forEach((c, i) => {
        const y = 20 + i * 23;
        const x = Math.round(posArr ? posArr[i] : 4);
        const spr = 'chick_' + PALS[i] + '_' + ((frame + i) % 2 + 1);
        PIX.draw(ctx, spr, x, y + 3, 1);
        if (posArr && Math.random() < 0.4) {
          ctx.fillStyle = 'rgba(200,180,140,.5)';
          ctx.fillRect(x - 3, y + 14, 2, 1);
        }
      });
    };

    const rollField = () => {
      const birds = U.shuffle(G.rng, CHICKENS.slice()).slice(0, 4);
      const odds = U.shuffle(G.rng, [2, 3, 5, 8]);
      S.field = birds.map((b, i) => ({ ...b, odds: odds[i], pos: 4 }));
      S.pick = -1;
      const pickBox = m.querySelector('#chick-pick');
      pickBox.innerHTML = '';
      S.field.forEach((c, i) => {
        const b = U.el('button', 'pixbtn chick-btn has-tip');
        b.dataset.tipText = c.name + ' — ' + c.flavor;
        b.appendChild(PIX.el('head_' + PALS[i], 2));
        b.appendChild(UI.txt(c.odds + ':1', { scale: 2, color: PIX.PAL.G }));
        b.onclick = () => {
          if (S.running) return;
          SFX.cluck();
          S.pick = i;
          pickBox.querySelectorAll('.chick-btn').forEach(x => x.classList.remove('sel'));
          b.classList.add('sel');
          syncBtn();
        };
        pickBox.appendChild(b);
      });
      drawTrack(null, 0);
    };

    const btn = m.querySelector('#btn-race');
    const syncBtn = () => {
      btn.innerHTML = '';
      if (G.casino.derbyLeft <= 0) {
        btn.appendChild(UI.txt('...', { scale: 3, color: PIX.PAL.q, shadow: null }));
        btn.disabled = true;
      } else {
        btn.appendChild(UI.txt('RACE', { scale: 3, color: PIX.PAL.K, shadow: null }));
        btn.disabled = S.running || S.pick < 0 || G.chips < CASINO.getBet(m, 'derby');
      }
      pips.innerHTML = '';
      for (let i = 0; i < 2; i++) pips.appendChild(PIX.el(i < G.casino.derbyLeft ? 'ic_diamond' : 'ic_diamond_off', 1));
    };
    CASINO.wireBetPicker(m, 'derby', syncBtn);

    btn.onclick = async () => {
      if (S.running || S.pick < 0 || G.casino.derbyLeft <= 0) return;
      const bet = CASINO.getBet(m, 'derby');
      if (G.chips < bet) return;
      S.running = true;
      G.chips -= bet;
      G.casino.derbyLeft--;
      CASINO.syncChips();
      syncBtn();
      m.querySelector('#derby-result').innerHTML = '';

      const W = cv.width - 30;
      S.field.forEach(c => c.pos = 4);
      let winner = -1, frame = 0;
      SFX.cluck();
      while (winner < 0) {
        await U.sleep(120);
        frame++;
        S.field.forEach((c, i) => {
          const pace = (1 / c.odds) * 2.2;
          c.pos += (G.rng() * 0.9 + 0.25) * pace * 18 + G.rng() * 5;
          if (c.pos >= W && winner < 0) winner = i;
        });
        if (!document.body.contains(cv)) return;
        drawTrack(S.field.map(c => Math.min(c.pos, W)), frame);
        if (Math.random() < 0.3) SFX.tick();
      }
      await U.sleep(300);

      const wc = S.field[winner];
      const out = m.querySelector('#derby-result');
      out.innerHTML = '';
      out.appendChild(PIX.el('head_' + PALS[winner], 2));
      if (winner === S.pick) {
        let pay = bet * wc.odds;
        if (E.has('whisperer')) pay *= 2;
        G.chips += pay + bet;
        G.stats.derbyWins++;
        SFX.win(); UI.particles('ic_coin', 10);
        out.appendChild(UI.txt('+' + pay, { scale: 3, color: PIX.PAL.G }));
        if (wc.odds >= 5 || E.has('whisperer')) {
          E.addShellById('feather');
          const sp = SPR.shellEl('feather', 2, 'has-tip pop');
          sp.dataset.tipShell = 'feather';
          out.appendChild(sp);
        }
      } else {
        SFX.dud();
        out.appendChild(UI.txt('-' + bet, { scale: 3, color: PIX.PAL.R }));
      }
      CASINO.syncChips();
      S.running = false;
      if (G.casino.derbyLeft > 0) rollField();
      syncBtn();
    };

    rollField();
    syncBtn();
  },

  /* ================= PAWN SHOP ================= */

  openPawn() {
    const m = UI.modal(`
      <button class="pixbtn m-close"></button>
      <div class="mg-wrap">
        <div class="bet-row" id="pawn-ctl"></div>
        <div class="pawn-grid" id="pawn-charms"></div>
        <div class="bet-row"><button class="pixbtn" id="btn-reroll"></button></div>
        <div class="pawn-grid" id="pawn-services"></div>
        <div class="mg-result" id="pawn-result"></div>
      </div>
    `);
    CASINO.mkClose(m);
    m.querySelector('#pawn-ctl').appendChild(CASINO.chipsRow());

    const out = m.querySelector('#pawn-result');

    const priceTag = (cost, dark) => {
      const t = U.el('span', 'price-tag');
      t.appendChild(PIX.el('ic_coin', 2));
      t.appendChild(UI.txt('' + cost, { scale: 2, color: dark ? PIX.PAL.K : PIX.PAL.G, shadow: dark ? null : PIX.PAL.K }));
      return t;
    };

    const paintCharms = () => {
      const grid = m.querySelector('#pawn-charms');
      grid.innerHTML = '';
      G.casino.stock.forEach((id, slot) => {
        const w = U.el('div', 'ware' + (id ? '' : ' sold'));
        if (!id) {
          w.appendChild(U.el('span', 'sold-dust'));
          grid.appendChild(w);
          return;
        }
        const c = CHARMS[id];
        const cost = E.price(c.price);
        const spr = SPR.charmEl(id, 4, 'has-tip wob');
        spr.dataset.tipCharm = id;
        w.appendChild(spr);
        const btn = U.el('button', 'pixbtn w-buy' + (G.chips >= cost && G.charms.length < MAX_CHARMS ? ' gold' : ''));
        btn.appendChild(priceTag(cost, G.chips >= cost && G.charms.length < MAX_CHARMS));
        btn.disabled = G.chips < cost || G.charms.length >= MAX_CHARMS;
        btn.onclick = () => {
          if (G.chips < cost || G.charms.length >= MAX_CHARMS) return;
          G.chips -= cost;
          G.charms.push(id);
          if (id === 'ironNerve') { G.nerveMax += 2; G.nerve = Math.min(G.nerveMax, G.nerve + 2); }
          G.casino.stock[slot] = null;
          SFX.coin();
          out.innerHTML = '';
          const won = SPR.charmEl(id, 4, 'pop has-tip');
          won.dataset.tipCharm = id;
          out.appendChild(won);
          CASINO.syncChips();
          paintCharms();
          paintServices();
        };
        w.appendChild(btn);
        grid.appendChild(w);
      });
      const rr = m.querySelector('#btn-reroll');
      const rc = E.price(G.casino.rerollCost);
      rr.innerHTML = '';
      rr.appendChild(PIX.el('ic_dice', 2));
      rr.appendChild(priceTag(rc, false));
      rr.disabled = G.chips < rc;
      rr.onclick = () => {
        if (G.chips < rc) return;
        G.chips -= rc;
        G.casino.rerollCost += 3;
        G.casino.stock = E.rollCharmStock();
        SFX.chak();
        CASINO.syncChips();
        paintCharms();
      };
    };

    const services = [
      { icon: 'ic_melt', price: 12, tip: 'MELT — remove one shell from your pouch forever.',
        can: () => G.bag.length > 3,
        run: (done) => CASINO.pickShell(m, (inst) => {
          G.bag = G.bag.filter(s => s.uid !== inst.uid);
          done(SPR.shellEl(inst.id, 2, 'dim'));
        }) },
      { icon: 'ic_mirror', price: 22, tip: 'MIRROR — duplicate one shell in your pouch.',
        can: () => true,
        run: (done) => CASINO.pickShell(m, (inst) => {
          E.addShellById(inst.id);
          done(SPR.shellEl(inst.id, 2, 'pop'));
        }) },
      { icon: 'ic_jar', price: 28, tip: 'MYSTERY JAR — a random rare (sometimes legendary) shell.',
        can: () => true,
        run: (done) => {
          const id = E.randomShellByRarity(G.rng() < 0.8 ? 'rare' : 'legendary');
          E.addShellById(id);
          const sp = SPR.shellEl(id, 3, 'pop has-tip');
          sp.dataset.tipShell = id;
          done(sp);
        } },
      { icon: 'ic_needle', price: 25, tip: 'STITCH — restore 1 Nerve.',
        can: () => G.nerve < G.nerveMax,
        run: (done) => { G.nerve++; done(PIX.el('ic_heart', 3)); } },
    ];

    const paintServices = () => {
      const grid = m.querySelector('#pawn-services');
      grid.innerHTML = '';
      services.forEach(sv => {
        const cost = E.price(sv.price);
        const w = U.el('div', 'ware has-tip');
        w.dataset.tipText = sv.tip + ' Cost: ' + cost + ' chips.';
        w.appendChild(PIX.el(sv.icon, 3));
        const btn = U.el('button', 'pixbtn w-buy' + (G.chips >= cost && sv.can() ? ' gold' : ''));
        btn.appendChild(priceTag(cost, G.chips >= cost && sv.can()));
        btn.disabled = G.chips < cost || !sv.can();
        btn.onclick = () => {
          if (G.chips < cost || !sv.can()) return;
          sv.run((resultEl) => {
            G.chips -= cost;
            SFX.coin();
            out.innerHTML = '';
            if (resultEl) out.appendChild(resultEl);
            CASINO.syncChips();
            paintCharms();
            paintServices();
          });
        };
        w.appendChild(btn);
        grid.appendChild(w);
      });
    };

    paintCharms();
    paintServices();
  },

  pickShell(m, onPick) {
    const out = m.querySelector('#pawn-result');
    out.innerHTML = '';
    const strip = U.el('div', 'chip-strip');
    strip.id = 'pick-strip';
    G.bag.forEach(inst => {
      const b = U.el('button', 'pixbtn shell-pick has-tip');
      b.dataset.tipShell = inst.id;
      b.appendChild(SPR.shellEl(inst.id, 2));
      b.onclick = () => onPick(inst);
      strip.appendChild(b);
    });
    out.appendChild(strip);
  },
};
