'use strict';
/* ============================================================
   SHELL & DEBT — ui.js
   All presentation: pixel HUD, the living cylinder, stamps,
   toasts, tooltips, title & end screens. Nearly wordless —
   icons and numbers on screen, prose only in hover tooltips.
   ============================================================ */

/* a couple of UI-only sprites */
PIX.def('ic_trigger', `
....KKKKKK....
..KKRRRRRRKK..
.KRRRYYRRRRRK.
.KRRYWWYRRRRK.
KRRRYWWYRRRRrK
KRRRRYYRRRRrrK
KRRRRRRRRRrrdK
KrRRRRRRRrrddK
.KrrRRRrrrddK.
.KdrrrrrdddK..
..KKddddddKK..
....KKKKKK....`);

PIX.def('ic_arrow_r', `
K....
KK...
KKK..
KKKK.
KKKKK
KKKK.
KKK..
KK...
K....`.replace(/K/g, 'W'));

const UI = {
  call: null,
  busy: false,
  $: {},
  cyl: { rot: 0, target: 0, flash: null, snapshot: null, raf: null },
  toasts: [],

  /* ================= router ================= */

  render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    UI.stopCylLoop();
    app.appendChild(UI.buildTopbar());
    if (G.phase === 'round') { BG.set(G.boss ? 'boss' : 'round'); UI.buildRound(app); }
    else if (G.phase === 'casino') { BG.set('casino'); CASINO.buildFloor(app); }
    else if (G.phase === 'gameover') { BG.set('dead'); UI.buildEnd(app, false); }
    else if (G.phase === 'win') { BG.set('win'); UI.buildEnd(app, true); }
    else { BG.set('title'); UI.buildTitle(app); }
  },

  /* small builders */
  txt(str, opts) { return PIXFONT.render(str, Object.assign({ scale: 2, shadow: PIX.PAL.K }, opts)); },
  num(n, opts) { return UI.txt(U.fmt(Math.round(n)), opts); },
  put(holder, canvas) { if (!holder) return; holder.innerHTML = ''; holder.appendChild(canvas); },
  icon(name, scale, tipKey, tipVal) {
    const c = PIX.el(name, scale || 2);
    if (tipKey) { c.classList.add('has-tip'); c.dataset[tipKey] = tipVal || '1'; }
    return c;
  },

  buildTopbar() {
    const bar = U.el('div');
    bar.id = 'topbar';
    const inRun = ['round', 'casino'].includes(G.phase);

    const left = U.el('div', 'tb-side');
    const logo = UI.txt('SHELL&DEBT', { scale: 2, color: PIX.PAL.G, outline: PIX.PAL.K });
    logo.classList.add('breathe');
    left.appendChild(logo);
    if (inRun) {
      const seed = UI.txt(G.seedStr, { scale: 1, color: PIX.PAL.q, shadow: null });
      seed.style.opacity = .6;
      left.appendChild(seed);
    }
    bar.appendChild(left);

    const right = U.el('div', 'tb-side');
    if (inRun) {
      const ante = U.el('span', 'tb-chip has-tip');
      ante.dataset.tipText = 'ANTE ' + G.ante + (G.ante > WIN_ANTE ? ' — ENDLESS' : '') +
        ' — debt: ' + U.fmt(G.debt || 0);
      ante.appendChild(UI.icon('ic_chip', 2));
      ante.appendChild(UI.txt('A' + G.ante, { scale: 2, color: PIX.PAL.N }));
      right.appendChild(ante);
      if (G.phase === 'round' && G.boss) {
        const b = SPR.emblemEl('boss', G.boss, 2, 'has-tip pulse-red');
        b.dataset.tipBoss = G.boss;
        right.appendChild(b);
      }
      if (G.phase === 'round' && G.fate) {
        const f = SPR.emblemEl('fate', G.fate, 2, 'has-tip');
        f.dataset.tipFate = G.fate;
        right.appendChild(f);
      }
    }
    const mkBtn = (id, iconName, tip, fn) => {
      const b = U.el('button', 'pixbtn tb-btn has-tip');
      b.id = id;
      b.dataset.tipText = tip;
      b.appendChild(PIX.el(iconName, 2));
      b.onclick = fn;
      return b;
    };
    right.appendChild(mkBtn('btn-help', 'ic_help', 'House rules', () => { SFX.click(); UI.showHelp(); }));
    right.appendChild(mkBtn('btn-mute', SFX.muted ? 'ic_sound_off' : 'ic_sound_on', 'Sound', (e) => {
      SFX.init(); const m = SFX.toggleMute();
      const btn = e.currentTarget; btn.innerHTML = '';
      btn.appendChild(PIX.el(m ? 'ic_sound_off' : 'ic_sound_on', 2));
      if (!m) SFX.click();
    }));
    if (inRun) right.appendChild(mkBtn('btn-abandon', 'ic_flag', 'Abandon the run', () => {
      if (confirm('Walk away from the table? The run ends here.')) {
        E.gameOver('walk'); UI.render();
      }
    }));
    bar.appendChild(right);
    return bar;
  },

  /* ================= title ================= */

  buildTitle(app) {
    const best = E.loadBest();
    const wrap = U.el('div', 'splash');

    const logoBox = U.el('div', 'logo-stack');
    const l1 = UI.txt('SHELL', { scale: 9, color: PIX.PAL.G, outline: PIX.PAL.K, shadow: PIX.PAL.H });
    const amp = UI.txt('&', { scale: 6, color: PIX.PAL.r, outline: PIX.PAL.K });
    const l2 = UI.txt('DEBT', { scale: 9, color: PIX.PAL.r, outline: PIX.PAL.K, shadow: PIX.PAL.D });
    l1.classList.add('breathe'); l2.classList.add('breathe2'); amp.classList.add('breathe');
    logoBox.append(l1, amp, l2);
    wrap.appendChild(logoBox);

    // spinning cylinder centerpiece
    const cylCv = document.createElement('canvas');
    cylCv.width = 120; cylCv.height = 120;
    cylCv.className = 'pix title-cyl';
    wrap.appendChild(cylCv);
    const tctx = cylCv.getContext('2d');
    const fakeHoles = ['live', 'blank', 'cursed', 'gilded', 'web', 'buck']
      .map(id => ({ inst: { id, uid: 0 }, revealed: true }));
    let trot = 0;
    const spinTitle = () => {
      if (!document.body.contains(cylCv)) return;
      trot += 0.006;
      tctx.clearRect(0, 0, 120, 120);
      SPR.drawCylinder(tctx, { cx: 60, cy: 60, r: 52, rot: trot, holes: fakeHoles, ptr: -1, blind: false });
      requestAnimationFrame(spinTitle);
    };
    requestAnimationFrame(spinTitle);

    const row = U.el('div', 'seed-row');
    const input = U.el('input');
    input.id = 'seed-in';
    input.maxLength = 24;
    input.placeholder = 'CURSED SEED';
    input.spellcheck = false;
    row.appendChild(input);
    wrap.appendChild(row);

    const deal = U.el('button', 'pixbtn gold big-deal');
    deal.id = 'btn-deal';
    deal.append(PIX.el('ic_trigger', 3), UI.txt('DEAL', { scale: 4, color: PIX.PAL.K, shadow: null }));
    wrap.appendChild(deal);
    deal.onclick = () => {
      SFX.init(); SFX.chak();
      UI.call = null;
      E.newRun(input.value);
      UI.render();
    };

    if (best) {
      const b = U.el('div', 'best-line has-tip');
      b.dataset.tipText = 'Deepest run — seed ' + best.seed;
      b.append(UI.icon('ic_crown', 2), UI.txt('A' + best.ante, { scale: 2, color: PIX.PAL.G }),
        UI.icon('ic_bank', 2), UI.num(best.score, { scale: 2, color: PIX.PAL.w }));
      wrap.appendChild(b);
    }
    app.appendChild(wrap);
  },

  /* ================= round screen ================= */

  buildRound(app) {
    const grid = U.el('div');
    grid.id = 'round-grid';
    grid.innerHTML = `
      <div class="col" id="left-col">
        <div class="ppanel has-tip" data-tip-key="debt">
          <div class="prow"><span class="picon" id="i-debt"></span><span id="p-debt"></span></div>
          <div class="prow"><span class="picon" id="i-score"></span><span id="p-score"></span></div>
          <div class="pixbar"><div class="ghost" id="p-ghost"></div><div class="fill" id="p-fill"></div></div>
        </div>
        <div class="ppanel has-tip" data-tip-key="pot">
          <div class="prow"><span class="picon" id="i-pot"></span><span id="p-pot"></span></div>
          <div class="prow" id="p-streak"></div>
          <button class="pixbtn bank" id="btn-bank"></button>
        </div>
        <div class="ppanel">
          <div class="prow has-tip" data-tip-key="nerve" id="p-nerve"></div>
          <div class="prow has-tip" data-tip-key="pulls" id="p-pulls"></div>
          <div class="prow has-tip" data-tip-key="sleight" id="p-sleight"></div>
          <div class="prow has-tip" data-tip-key="chips"><span class="picon" id="i-chips"></span><span id="p-chips"></span></div>
        </div>
      </div>

      <div id="center-col">
        <div id="chamber-zone">
          <canvas id="cyl" class="pix" width="230" height="240"></canvas>
          <div id="stamp-zone"></div>
          <div id="toast-zone"></div>
        </div>
      </div>

      <div class="col" id="right-col">
        <div class="ppanel has-tip" data-tip-key="call">
          <div id="call-btns"></div>
          <button class="pixbtn pull" id="btn-pull"></button>
        </div>
        <div class="ppanel has-tip" data-tip-key="sleightPanel">
          <div class="sleight-row">
            <button class="pixbtn sl" id="btn-peek"></button>
            <button class="pixbtn sl" id="btn-spin"></button>
            <button class="pixbtn sl" id="btn-eject"></button>
            <button class="pixbtn sl" id="btn-load"></button>
          </div>
        </div>
      </div>

      <div id="bottom-bar">
        <div class="ppanel tray has-tip" data-tip-key="pouch" style="flex:1.5">
          <div class="chip-strip" id="p-pouch"></div>
        </div>
        <div class="ppanel tray has-tip" data-tip-key="charms">
          <div class="chip-strip" id="p-charms"></div>
        </div>
      </div>
    `;
    app.appendChild(grid);

    UI.$ = {};
    ['p-debt', 'p-score', 'p-fill', 'p-ghost', 'p-pot', 'p-streak', 'p-chips', 'p-nerve',
      'p-pulls', 'p-sleight', 'btn-bank', 'call-btns', 'btn-pull', 'btn-peek', 'btn-spin',
      'btn-eject', 'btn-load', 'stamp-zone', 'toast-zone', 'cyl', 'p-pouch', 'p-charms',
      'i-debt', 'i-score', 'i-pot', 'i-chips']
      .forEach(id => UI.$[id] = grid.querySelector('#' + id));

    UI.put(UI.$['i-debt'], PIX.el('ic_debt', 2));
    UI.put(UI.$['i-score'], PIX.el('ic_bank', 2));
    UI.put(UI.$['i-pot'], PIX.el('ic_pot', 2));
    UI.put(UI.$['i-chips'], PIX.el('ic_chip', 2));

    UI.$['btn-bank'].onclick = () => UI.onBank();
    UI.$['btn-pull'].onclick = () => UI.onPull();
    UI.$['btn-peek'].onclick = () => UI.onSleight('peek');
    UI.$['btn-spin'].onclick = () => UI.onSleight('spin');
    UI.$['btn-eject'].onclick = () => UI.onSleight('eject');
    UI.$['btn-load'].onclick = () => UI.onSleight('load');

    UI.cyl.rot = -G.ptr * Math.PI / 3;
    UI.cyl.target = UI.cyl.rot;
    UI.startCylLoop();
    UI.sync();
  },

  /* ---------- cylinder loop ---------- */

  startCylLoop() {
    const cv = UI.$['cyl'];
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const loop = () => {
      if (G.phase !== 'round' || !document.body.contains(cv)) { UI.cyl.raf = null; return; }
      const c = UI.cyl;
      const diff = c.target - c.rot;
      if (Math.abs(diff) > 0.002) c.rot += diff * 0.16;
      else c.rot = c.target;

      ctx.clearRect(0, 0, cv.width, cv.height);
      // hammer at top
      PIX.draw(ctx, 'hammer', cv.width / 2 - 10, 0, 2);
      const holes = c.snapshot ? c.snapshot.holes : G.holes;
      const ptr = c.snapshot ? c.snapshot.ptr : G.ptr;
      SPR.drawCylinder(ctx, {
        cx: cv.width / 2, cy: 128, r: 92,
        rot: c.rot,
        holes, ptr, blind: E.blindRound(),
      });
      // flash effect at the hammer position
      if (c.flash && performance.now() < c.flash.until) {
        const frames = c.flash.frames;
        const fi = Math.min(frames.length - 1,
          Math.floor((performance.now() - c.flash.start) / 70));
        PIX.draw(ctx, frames[fi], cv.width / 2 - PIX.size(frames[fi]).w, 30, 2);
      } else c.flash = null;

      UI.cyl.raf = requestAnimationFrame(loop);
    };
    if (!UI.cyl.raf) UI.cyl.raf = requestAnimationFrame(loop);
  },

  stopCylLoop() {
    if (UI.cyl.raf) { cancelAnimationFrame(UI.cyl.raf); UI.cyl.raf = null; }
    UI.cyl.snapshot = null; UI.cyl.flash = null;
  },

  cylRotateToPtr(extraSpin) {
    // target only ever decreases, so the cylinder always turns the same way
    const want = -G.ptr * Math.PI / 3;
    const down = ((UI.cyl.target - want) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    UI.cyl.target -= down + (extraSpin ? Math.PI * 2 : 0);
  },

  flashAtHammer(type) {
    const frames = {
      FIRE: ['flash_1', 'flash_2', 'flash_3'],
      DUD: ['puff_1', 'puff_2'],
      JAM: ['spark_1', 'spark_1'],
      BACKFIRE: ['burst_red', 'flash_2', 'flash_3'],
    }[type] || ['puff_1'];
    UI.cyl.flash = { frames, start: performance.now(), until: performance.now() + frames.length * 90 };
  },

  /* ---------- sync ---------- */

  sync() {
    if (G.phase !== 'round' || !UI.$['p-debt']) return;
    const $ = UI.$;

    UI.put($['p-debt'], UI.num(G.debt, { scale: 4, color: PIX.PAL.R }));
    UI.put($['p-score'], UI.num(G.score, { scale: 3, color: PIX.PAL.G }));
    const pct = U.clamp(G.score / G.debt * 100, 0, 100);
    $['p-fill'].style.width = pct + '%';
    const ghostPct = U.clamp((G.pot > 0 ? E.bankAmount() : 0) / G.debt * 100, 0, 100 - pct);
    $['p-ghost'].style.left = pct + '%';
    $['p-ghost'].style.width = ghostPct + '%';

    UI.put($['p-pot'], UI.num(G.pot, { scale: 4, color: PIX.PAL.N }));
    const sm = E.streakMult(Math.max(1, G.streak));
    const smStr = 'x' + (Math.round(sm * 100) / 100);
    const streakRow = $['p-streak'];
    streakRow.innerHTML = '';
    streakRow.appendChild(UI.txt(smStr, { scale: 2, color: G.streak > 1 ? PIX.PAL.V : PIX.PAL.q }));
    for (let i = 0; i < Math.min(G.streak, 8); i++) {
      streakRow.appendChild(PIX.el('spark_1', 1));
    }

    const bb = $['btn-bank'];
    const bankable = E.canBank();
    bb.disabled = !bankable || UI.busy;
    bb.innerHTML = '';
    bb.classList.toggle('locked', E.bossIs('croupier') && G.streak < 2 && G.pot > 0);
    bb.appendChild(PIX.el('ic_bank', 2));
    if (G.pot > 0) {
      const amt = E.bankAmount();
      bb.appendChild(UI.num(amt, { scale: 2, color: amt < G.pot ? PIX.PAL.R : PIX.PAL.G }));
    } else {
      bb.appendChild(UI.txt('BANK', { scale: 2, color: PIX.PAL.q }));
    }

    // hearts / bullets / sleight pips / chips
    const nerveRow = $['p-nerve']; nerveRow.innerHTML = '';
    for (let i = 0; i < G.nerveMax; i++) {
      const h = PIX.el(i < G.nerve ? 'ic_heart' : 'ic_heart_off', 2);
      if (i < G.nerve && G.nerve <= 1) h.classList.add('pulse-red');
      nerveRow.appendChild(h);
    }
    const pullsRow = $['p-pulls']; pullsRow.innerHTML = '';
    const totalPulls = Math.min(Math.max(G.pullsMax, G.pulls), 14);
    for (let i = 0; i < totalPulls; i++) {
      pullsRow.appendChild(PIX.el(i < G.pulls ? 'ic_bullet' : 'ic_bullet_off', 2));
    }
    const slRow = $['p-sleight']; slRow.innerHTML = '';
    for (let i = 0; i < Math.max(G.sleightMax, G.sleight); i++) {
      slRow.appendChild(PIX.el(i < G.sleight ? 'ic_diamond' : 'ic_diamond_off', 2));
    }
    UI.put($['p-chips'], UI.num(G.chips, { scale: 3, color: PIX.PAL.G }));

    UI.syncCalls();
    UI.syncSleight();
    UI.syncPouch();
    UI.syncCharms();
  },

  syncCalls() {
    const $ = UI.$;
    const odds = E.topOdds();
    const box = $['call-btns'];
    box.innerHTML = '';
    const icons = { FIRE: 'ic_fire', DUD: 'ic_dud', JAM: 'ic_jam', BACKFIRE: 'ic_backfire' };
    OUTCOMES.forEach(o => {
      const p = odds.blind ? null : (odds.probs ? odds.probs[o] : null);
      const mult = E.callMult(p);
      const btn = U.el('button', 'pixbtn call-btn has-tip' + (UI.call === o ? ' sel sel-' + o : ''));
      btn.dataset.tipCall = o;
      btn.appendChild(PIX.el(icons[o], 2));
      const mid = U.el('span', 'call-mid');
      mid.appendChild(UI.txt(o === 'BACKFIRE' ? 'BACK' : o, { scale: 2, color: PIX.PAL.W }));
      mid.appendChild(UI.txt(odds.blind ? '??%' : Math.round((p || 0) * 100) + '%' + (odds.hidden ? '?' : ''),
        { scale: 1, color: PIX.PAL.q, shadow: null }));
      btn.appendChild(mid);
      btn.appendChild(UI.txt('x' + mult, { scale: 2, color: PIX.PAL.G }));
      btn.disabled = UI.busy || G.flags.roundWon;
      btn.onclick = () => { SFX.click(); UI.call = o; UI.sync(); };
      box.appendChild(btn);
    });

    const pull = $['btn-pull'];
    pull.disabled = UI.busy || !UI.call || G.flags.roundWon || !E.topHole() || G.pulls <= 0;
    pull.innerHTML = '';
    pull.appendChild(PIX.el('ic_trigger', 3));
    const pcol = U.el('span', 'pull-col');
    pcol.appendChild(UI.txt('PULL', { scale: 3, color: PIX.PAL.W, outline: PIX.PAL.K }));
    if (UI.call) {
      const est = U.el('span', 'est-row');
      est.appendChild(PIX.el({ FIRE: 'ic_fire', DUD: 'ic_dud', JAM: 'ic_jam', BACKFIRE: 'ic_backfire' }[UI.call], 1));
      est.appendChild(UI.txt('+' + U.fmt(E.estPayout(UI.call)), { scale: 1, color: PIX.PAL.N, shadow: null }));
      pcol.appendChild(est);
    }
    pull.appendChild(pcol);
  },

  syncSleight() {
    const $ = UI.$;
    const mk = (btn, iconName, cost, allowed, tip) => {
      btn.innerHTML = '';
      btn.appendChild(PIX.el(iconName, 2));
      const c = U.el('span', 'cost-pips');
      for (let i = 0; i < cost; i++) c.appendChild(PIX.el('ic_diamond', 1));
      if (cost === 0) c.appendChild(UI.txt('0', { scale: 1, color: PIX.PAL.N, shadow: null }));
      btn.appendChild(c);
      btn.disabled = UI.busy || G.flags.roundWon || !allowed;
      btn.classList.add('has-tip');
      btn.dataset.tipText = tip;
    };
    const caged = E.sleightBlocked();
    mk($['btn-peek'], 'ic_eye', E.peekCost(), E.peekAllowed(),
      caged ? 'The Cage: sleight is off' : (E.blindRound() || E.fateIs('houseEyes'))
        ? 'Peeking is forbidden this round' : 'PEEK — reveal the shell under the hammer');
    mk($['btn-spin'], 'ic_spin', 1, E.spinAllowed(),
      caged ? 'The Cage: sleight is off' : 'SPIN — shuffle and re-hide the chamber');
    mk($['btn-eject'], 'ic_eject', E.ejectCost(), E.ejectAllowed(),
      caged ? 'The Cage: sleight is off' : 'EJECT — discard the top shell unseen');
    mk($['btn-load'], 'ic_load', 1, E.loadAllowed(),
      caged ? 'The Cage: sleight is off' : 'LOAD — swap a pouch shell under the hammer');
  },

  syncPouch() {
    const box = UI.$['p-pouch'];
    box.innerHTML = '';
    G.reserve.forEach(inst => {
      const c = SPR.shellEl(inst.id, 2, 'has-tip shell-spr wob');
      c.dataset.tipShell = inst.id;
      box.appendChild(c);
    });
    G.spent.forEach(inst => {
      const c = SPR.shellEl(inst.id, 2, 'has-tip shell-spr dim');
      c.dataset.tipShell = inst.id;
      box.appendChild(c);
    });
  },

  syncCharms() {
    const box = UI.$['p-charms'];
    box.innerHTML = '';
    G.charms.forEach(id => {
      const el = SPR.charmEl(id, 3, 'has-tip wob');
      el.dataset.tipCharm = id;
      box.appendChild(el);
    });
    for (let i = G.charms.length; i < MAX_CHARMS; i++) {
      box.appendChild(U.el('span', 'charm-slot-empty'));
    }
  },

  /* ================= actions ================= */

  async onPull() {
    if (UI.busy || !UI.call) return;
    if (G.phase !== 'round' || G.flags.roundWon) return;
    UI.busy = true;
    UI.sync();

    SFX.chak();
    // freeze the current chamber view for the strike
    UI.cyl.snapshot = { holes: G.holes.map(h => h ? { inst: h.inst, revealed: h.revealed } : null), ptr: G.ptr };
    await U.sleep(180);

    const R = E.doPull(UI.call);
    if (!R) { UI.cyl.snapshot = null; UI.busy = false; UI.sync(); return; }

    UI.flashAtHammer(R.outcome);
    if (R.outcome === 'FIRE') { SFX.shot(); UI.flash('go-fire'); UI.shake(); BG.pulse('#ff9d3c'); }
    else if (R.outcome === 'DUD') SFX.dud();
    else if (R.outcome === 'JAM') SFX.jamSfx();
    else { SFX.backfire(); UI.flash('go-back'); UI.shake(); BG.pulse('#ff2e4d', 500); }

    UI.stamp(R);
    R.notes.forEach(n => UI.toastNote(n));
    if (R.correct) { SFX.coin(); if (R.payout >= 150) UI.particles('ic_coin', 12); }
    else if (R.nerveLost > 0) { SFX.hurt(); UI.particles('ic_heart', 4); }

    await U.sleep(430);
    UI.cyl.snapshot = null;
    UI.cylRotateToPtr(false);
    if (R.reloaded) { SFX.spin(); UI.cylRotateToPtr(true); }

    UI.busy = false;
    UI.sync();

    if (R.roundOver === 'won') await UI.roundWonFlow();
    else if (R.roundOver === 'dead' || R.roundOver === 'lost') await UI.deathFlow();
  },

  async onBank() {
    if (UI.busy || !E.canBank()) return;
    const res = E.doBank();
    if (!res) return;
    SFX.bank();
    UI.flash('go-gold');
    BG.pulse('#ffd75e');
    UI.stampBank(res);
    if (res.amt >= 200) UI.particles('ic_coin', 16);
    UI.sync();
    if (res.won) await UI.roundWonFlow();
  },

  async onSleight(kind) {
    if (UI.busy || G.phase !== 'round' || G.flags.roundWon) return;
    if (kind === 'peek') {
      if (!E.doPeek()) return;
      SFX.click();
    } else if (kind === 'spin') {
      if (!E.doSpin()) return;
      SFX.spin();
      UI.cylRotateToPtr(true);
    } else if (kind === 'eject') {
      const r = E.doEject();
      if (!r) return;
      SFX.chak();
      UI.toast([SPR.shellEl(r.inst.id, 2)], PIX.el('ic_eject', 2));
      UI.cylRotateToPtr(!!r.reloaded);
    } else if (kind === 'load') {
      UI.showLoadPicker();
      return;
    }
    UI.sync();
  },

  showLoadPicker() {
    if (!E.loadAllowed()) return;
    const m = UI.modal(`
      <button class="pixbtn m-close" id="mm-close"></button>
      <div class="m-head" id="lp-head"></div>
      <div class="chip-strip" id="load-strip"></div>
    `);
    m.querySelector('#lp-head').appendChild(PIX.el('ic_load', 3));
    const closeB = m.querySelector('#mm-close');
    closeB.appendChild(UI.txt('X', { scale: 2, color: PIX.PAL.W }));
    closeB.onclick = () => { SFX.click(); UI.closeModal(); };
    const strip = m.querySelector('#load-strip');
    G.reserve.forEach(inst => {
      const b = U.el('button', 'pixbtn shell-pick has-tip');
      b.dataset.tipShell = inst.id;
      b.appendChild(SPR.shellEl(inst.id, 3));
      b.onclick = () => {
        const done = E.doLoad(inst.uid);
        if (done) {
          SFX.chak();
          UI.closeModal();
          UI.sync();
        }
      };
      strip.appendChild(b);
    });
  },

  /* ================= stamps & toasts (wordless feedback) ================= */

  stamp(R) {
    const zone = UI.$['stamp-zone'];
    if (!zone) return;
    const colors = { FIRE: PIX.PAL.O, DUD: PIX.PAL.w, JAM: PIX.PAL.g, BACKFIRE: PIX.PAL.R };
    const box = U.el('div', 'stamp pop');
    const word = R.outcome === 'BACKFIRE' ? 'BACKFIRE' : R.outcome;
    box.appendChild(UI.txt(word, { scale: 4, color: colors[R.outcome], outline: PIX.PAL.K }));
    const sub = U.el('div', 'stamp-sub');
    if (R.correct) {
      sub.appendChild(UI.txt('+' + U.fmt(R.payout), { scale: 3, color: PIX.PAL.N, outline: PIX.PAL.K }));
      sub.appendChild(UI.txt('x' + R.mult, { scale: 2, color: PIX.PAL.G }));
    } else if (R.nerveLost > 0) {
      for (let i = 0; i < R.nerveLost; i++) sub.appendChild(PIX.el('ic_heart_off', 2));
    } else if (G.pot === 0 && !R.correct) {
      sub.appendChild(PIX.el('ic_pot', 2));
      sub.appendChild(UI.txt('=0', { scale: 2, color: PIX.PAL.R }));
    }
    box.appendChild(sub);
    zone.innerHTML = '';
    zone.appendChild(box);
  },

  stampBank(res) {
    const zone = UI.$['stamp-zone'];
    if (!zone) return;
    const box = U.el('div', 'stamp pop');
    const row = U.el('div', 'stamp-sub');
    row.appendChild(PIX.el('ic_bank', 3));
    row.appendChild(UI.txt('+' + U.fmt(res.amt), { scale: 4, color: PIX.PAL.G, outline: PIX.PAL.K }));
    box.appendChild(row);
    zone.innerHTML = '';
    zone.appendChild(box);
  },

  // map engine note strings (emoji-prefixed) to icon toasts
  toastNote(note) {
    const MAP = [
      ['🐇', 'charm', 'rabbit'], ['🧲', 'shell', 'magnet'], ['🕸', 'shell', 'web'],
      ['🔁', 'shell', 'echo'], ['👯', 'shell', 'twin'], ['💰', 'shell', 'gilded'],
      ['🟤', 'shell', 'rust'], ['🔮', 'shell', 'glass'], ['🌫', 'shell', 'smoke'],
      ['🕷', 'charm', 'spider'], ['💃', 'charm', 'graveDancer'], ['🐍', 'charm', 'snakeCharmer'],
      ['🚬', 'charm', 'ashtray'], ['🐔', 'shell', 'feather'], ['🫀', 'charm', 'secondWind'],
      ['💼', 'boss', 'collector'], ['🌀', 'boss', 'spinner'],
    ];
    let icon = null;
    for (const [emo, kind, id] of MAP) {
      if (note.includes(emo)) {
        icon = kind === 'shell' ? SPR.shellEl(id, 2)
          : kind === 'charm' ? SPR.charmEl(id, 2)
          : SPR.emblemEl('boss', id, 2);
        break;
      }
    }
    // pull a number out of the note if there is one (+4, ×3, -15…)
    const numMatch = note.match(/([+\-x×]\s?\d+(?:\.\d+)?|\d+(?:\.\d+)?x|\+\d)/);
    const parts = [];
    if (icon) parts.push(icon);
    if (numMatch) {
      parts.push(UI.txt(numMatch[0].replace('×', 'x').replace(/\s/g, ''),
        { scale: 2, color: PIX.PAL.N }));
    }
    if (!parts.length) return;
    UI.toast(parts);
  },

  toast(parts, extraIcon) {
    const zone = UI.$['toast-zone'];
    if (!zone) return;
    const t = U.el('div', 'toast');
    if (extraIcon) t.appendChild(extraIcon);
    parts.forEach(p => t.appendChild(p));
    zone.appendChild(t);
    while (zone.children.length > 3) zone.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 1900);
  },

  /* ================= round end flows ================= */

  async roundWonFlow() {
    UI.busy = true;
    SFX.win();
    UI.flash('go-gold');
    BG.pulse('#ffd75e', 700);
    UI.particles('ic_coin', 22);
    await U.sleep(650);
    UI.busy = false;

    const r = G.flags.reward;
    const isFinal = G.ante === WIN_ANTE && !G.endlessMode;
    const m = UI.modal('<div class="won-box"></div>', true);
    const box = m.querySelector('.won-box');

    const head = U.el('div', 'm-head');
    head.appendChild(PIX.el('ic_crown', 4));
    head.appendChild(UI.txt('A' + G.ante, { scale: 4, color: PIX.PAL.N, outline: PIX.PAL.K }));
    box.appendChild(head);

    const rows = U.el('div', 'reward-rows');
    const addRow = (iconName, canvas) => {
      const rw = U.el('div', 'reward-row');
      rw.appendChild(PIX.el(iconName, 2));
      rw.appendChild(canvas);
      rows.appendChild(rw);
    };
    addRow('ic_bank', UI.num(G.score, { scale: 3, color: PIX.PAL.G }));
    addRow('ic_chip', UI.num(r.base, { scale: 3, color: PIX.PAL.W }));
    if (r.inter + r.extra > 0) addRow('ic_coin', UI.num(r.inter + r.extra, { scale: 3, color: PIX.PAL.W }));
    box.appendChild(rows);

    const total = U.el('div', 'reward-total');
    total.appendChild(UI.txt('+' + U.fmt(r.total), { scale: 4, color: PIX.PAL.G, outline: PIX.PAL.K }));
    total.appendChild(PIX.el('ic_chip', 3));
    box.appendChild(total);

    const go = U.el('button', 'pixbtn gold big-go');
    go.id = 'mm-go';
    go.appendChild(UI.txt(isFinal ? 'THE OWNER' : '>', { scale: 4, color: PIX.PAL.K, shadow: null }));
    box.appendChild(go);
    go.onclick = () => {
      SFX.click();
      UI.closeModal();
      if (isFinal) { E.winRun(); UI.render(); }
      else { E.toCasino(); UI.render(); }
    };
  },

  async deathFlow() {
    UI.busy = true;
    SFX.lose();
    BG.pulse('#8c2230', 900);
    await U.sleep(900);
    UI.busy = false;
    UI.render();
  },

  /* ================= end screens ================= */

  buildEnd(app, won) {
    const wrap = U.el('div', 'splash');
    const s = G.stats;

    const art = U.el('div', 'end-art ' + (won ? 'breathe' : 'pulse-red'));
    art.appendChild(PIX.el(won ? 'ic_crown' : 'ic_skull', 10));
    wrap.appendChild(art);

    const word = won ? 'THE OWNER FOLDS'
      : G.overReason === 'nerve' ? 'YOUR NERVE BREAKS'
      : G.overReason === 'walk' ? 'YOU WALK AWAY'
      : 'THE HOUSE COLLECTS';
    wrap.appendChild(UI.txt(word, {
      scale: 4, color: won ? PIX.PAL.G : PIX.PAL.R, outline: PIX.PAL.K,
    }));

    const grid = U.el('div', 'end-grid');
    const cell = (iconName, canvas, tip) => {
      const c = U.el('div', 'end-cell has-tip');
      c.dataset.tipText = tip;
      c.appendChild(PIX.el(iconName, 2));
      c.appendChild(canvas);
      grid.appendChild(c);
    };
    cell('ic_chip', UI.txt('A' + s.antesCleared, { scale: 3, color: PIX.PAL.N }), 'Antes cleared');
    cell('ic_bank', UI.num(s.totalScore, { scale: 3, color: PIX.PAL.G }), 'Total score banked');
    cell('ic_pot', UI.num(s.bestPayout, { scale: 3, color: PIX.PAL.W }), 'Best single payout');
    cell('ic_coin', UI.num(s.chipsPeak, { scale: 3, color: PIX.PAL.W }), 'Chip peak');
    cell('ic_backfire', UI.num(s.backfiresEaten, { scale: 3, color: PIX.PAL.R }), 'Backfires eaten');
    cell('ic_bullet', UI.txt(s.hits + '/' + s.pulls, { scale: 3, color: PIX.PAL.W }), 'Hits / pulls');
    wrap.appendChild(grid);

    const seedLine = UI.txt(G.seedStr, { scale: 1, color: PIX.PAL.q, shadow: null });
    seedLine.style.opacity = .6;
    wrap.appendChild(seedLine);

    const btns = U.el('div', 'end-btns');
    if (won) {
      const down = U.el('button', 'pixbtn gold');
      down.id = 'btn-endless';
      down.append(PIX.el('ic_debt', 2), UI.txt('ENDLESS', { scale: 3, color: PIX.PAL.K, shadow: null }));
      down.onclick = () => { SFX.chak(); G.endlessMode = true; E.toCasino(); UI.render(); };
      btns.appendChild(down);
    }
    const again = U.el('button', 'pixbtn ' + (won ? '' : 'gold'));
    again.id = 'btn-again';
    again.append(PIX.el('ic_trigger', 2), UI.txt('AGAIN', { scale: 3, color: won ? PIX.PAL.W : PIX.PAL.K, shadow: null }));
    again.onclick = () => { SFX.chak(); UI.call = null; E.newRun(''); UI.render(); };
    btns.appendChild(again);
    const door = U.el('button', 'pixbtn');
    door.id = 'btn-title';
    door.append(UI.txt('<', { scale: 3, color: PIX.PAL.W }));
    door.onclick = () => { SFX.click(); G.phase = 'title'; UI.render(); };
    btns.appendChild(door);
    wrap.appendChild(btns);

    app.appendChild(wrap);
  },

  /* ================= fx ================= */

  flash(cls) {
    const f = document.getElementById('fx-flash');
    f.className = '';
    void f.offsetWidth;
    f.className = cls;
  },

  shake() {
    const s = document.getElementById('fx-shake');
    s.classList.remove('shake');
    void s.offsetWidth;
    s.classList.add('shake');
  },

  particles(spriteName, n) {
    const box = document.getElementById('fx-particles');
    for (let i = 0; i < n; i++) {
      const p = PIX.el(spriteName, Math.random() < 0.5 ? 2 : 3);
      p.classList.add('particle');
      p.style.left = (10 + Math.random() * 80) + 'vw';
      p.style.animationDuration = (0.9 + Math.random() * 1.2) + 's';
      p.style.animationDelay = Math.random() * 0.25 + 's';
      box.appendChild(p);
      setTimeout(() => p.remove(), 2500);
    }
  },

  /* ================= modal & tooltip ================= */

  modal(html, noClose) {
    const root = document.getElementById('modal-root');
    root.classList.remove('hidden');
    root.innerHTML = '';
    const m = U.el('div', 'modal', html);
    root.appendChild(m);
    if (!noClose) root.onclick = (e) => { if (e.target === root) UI.closeModal(); };
    else root.onclick = null;
    return m;
  },

  closeModal() {
    const root = document.getElementById('modal-root');
    root.classList.add('hidden');
    root.innerHTML = '';
  },

  modalOpen() {
    return !document.getElementById('modal-root').classList.contains('hidden');
  },

  PANEL_TIPS: {
    debt: () => `<b>THE DEBT</b> — bank <b>${U.fmt(G.debt)}</b> score before your pulls run out. Banked: ${U.fmt(G.score)}.`,
    pot: () => `<b>THE POT</b> — correct calls pile up here. Bank it to make it score; one wrong call burns it. Streak multiplier: ×${Math.round(E.streakMult(Math.max(1, G.streak)) * 100) / 100}.`,
    nerve: () => `<b>NERVE</b> — an uncalled BACKFIRE costs 1 (cursed shells 2). At zero, the run ends.`,
    pulls: () => `<b>PULLS</b> — trigger pulls left this round: ${G.pulls}.`,
    sleight: () => `<b>SLEIGHT</b> — points spent on peeking, spinning, ejecting and loading.`,
    chips: () => `<b>CHIPS</b> — casino money. Spend it on the floor between antes.`,
    call: () => `<b>THE CALL</b> — pick what the next shell does. Rarer calls pay bigger multipliers. Hidden shells show the chamber average.`,
    sleightPanel: () => `<b>SLEIGHT OF HAND</b> — 👁 peek · 🌀 spin · ⏏ eject · load a chosen shell.`,
    pouch: () => `<b>SHELL POUCH</b> — your collection. ${G.reserve.length} in reserve, ${E.shellsInChamber()} chambered, ${G.spent.length} spent this round.`,
    charms: () => `<b>CHARMS</b> — passive artifacts. ${G.charms.length}/${MAX_CHARMS} slots used.`,
  },

  tooltipFor(el) {
    const ds = el.dataset;
    if (ds.tipShell) {
      const s = SHELLS[ds.tipShell];
      const w = E.effWeights({ id: s.id });
      const odds = OUTCOMES.map(o =>
        `${OUTCOME_META[o].icon}${Math.round(w[o] * 100)}%`).join(' ');
      return `<div class="tt-name">${s.name} <span class="rar-${s.rarity}">${s.rarity.toUpperCase()}</span></div>
        <div class="tt-desc">${s.desc}</div>
        <div class="tt-odds">${odds} · base ${s.base}</div>`;
    }
    if (ds.tipCharm) {
      const c = CHARMS[ds.tipCharm];
      return `<div class="tt-name">${c.name} <span class="rar-${c.rarity}">${c.rarity.toUpperCase()}</span></div>
        <div class="tt-desc">${c.desc}</div>`;
    }
    if (ds.tipBoss) {
      const b = BOSSES[ds.tipBoss];
      return `<div class="tt-name">${b.icon} ${b.name}</div><div class="tt-desc">${b.desc}</div>`;
    }
    if (ds.tipFate) {
      const f = FATES[ds.tipFate];
      return `<div class="tt-name">${f.icon} ${f.name}</div>
        <div class="tt-desc">${f.desc.replace('Next round:', 'This round:')}</div>`;
    }
    if (ds.tipCall) {
      const o = ds.tipCall;
      const blurbs = {
        FIRE: 'It goes off. The bread and butter of live shells.',
        DUD: 'A dead click. Blanks and feathers love this call.',
        JAM: 'The mechanism seizes — the shell stays in the chamber, revealed.',
        BACKFIRE: 'It bites the hand. Uncalled: −1 Nerve. Called: profit.',
      };
      return `<div class="tt-name">${OUTCOME_META[o].icon} ${o}</div><div class="tt-desc">${blurbs[o]}</div>`;
    }
    if (ds.tipStation) {
      const s = CASINO.STATION_TIPS[ds.tipStation];
      return s ? `<div class="tt-name">${s[0]}</div><div class="tt-desc">${s[1]}</div>` : null;
    }
    if (ds.tipKey && UI.PANEL_TIPS[ds.tipKey]) {
      return `<div class="tt-desc">${UI.PANEL_TIPS[ds.tipKey]()}</div>`;
    }
    if (ds.tipText) return `<div class="tt-desc">${U.esc(ds.tipText)}</div>`;
    return null;
  },

  initTooltip() {
    const tip = document.getElementById('tooltip');
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('.has-tip');
      if (!t) { tip.classList.add('hidden'); return; }
      const html = UI.tooltipFor(t);
      if (!html) { tip.classList.add('hidden'); return; }
      tip.innerHTML = html;
      tip.classList.remove('hidden');
    });
    document.addEventListener('mousemove', (e) => {
      if (tip.classList.contains('hidden')) return;
      const pad = 14;
      let x = e.clientX + pad, y = e.clientY + pad;
      const r = tip.getBoundingClientRect();
      if (x + r.width > innerWidth - 8) x = e.clientX - r.width - pad;
      if (y + r.height > innerHeight - 8) y = e.clientY - r.height - pad;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    });
  },

  /* ================= help ================= */

  showHelp() {
    UI.modal(`
      <button class="pixbtn m-close" id="mm-close"></button>
      <div class="help-cols">
        <div>
          <h4>THE CHAMBER</h4>
          <p>Shells load blind from your pouch. Each pull, the shell under the hammer resolves:
          🔥 FIRE · ⚪ DUD · ⚙ JAM · 💥 BACKFIRE.</p>
          <h4>THE CALL</h4>
          <p>Call the outcome before pulling. Rarer calls pay bigger multipliers (the ×numbers).
          Hidden shells (?) show the average odds of everything hidden in the chamber.</p>
          <h4>POT & STREAK</h4>
          <p>Correct calls fill the pot and grow the ×streak. <b>BANK</b> converts pot to score and
          resets the streak. A wrong call burns the whole pot.</p>
          <h4>THE DEBT</h4>
          <p>Bank the debt number before your bullets run out, or the run ends.</p>
        </div>
        <div>
          <h4>NERVE ❤</h4>
          <p>Uncalled BACKFIRE: −1 (cursed shells −2). Zero = dead. Called backfires pay instead.</p>
          <h4>SLEIGHT ◆</h4>
          <p>👁 peek the top shell · 🌀 spin/re-hide · ⏏ eject unseen · load a chosen shell on top.
          A JAMmed shell stays chambered, revealed.</p>
          <h4>THE CASINO</h4>
          <p>Between antes: 🎰 slots pay in shells · 🃏 blackjack pays chips (21 exact = shell) ·
          🎡 the wheel rewrites the next round · 🐔 derby longshots shed feathers ·
          🏚 the pawn shop sells charms & pouch surgery. Click the door to face the next ante.</p>
          <h4>KEYS</h4>
          <p>1–4 call · SPACE pull · B bank. Hover anything for details.</p>
        </div>
      </div>
    `);
    const c = document.querySelector('#mm-close');
    c.appendChild(UI.txt('X', { scale: 2, color: PIX.PAL.W, shadow: null }));
    c.onclick = () => UI.closeModal();
  },

  initKeys() {
    document.addEventListener('keydown', (e) => {
      if (G.phase !== 'round' || UI.modalOpen() || UI.busy) return;
      if (e.target.tagName === 'INPUT') return;
      const map = { '1': 'FIRE', '2': 'DUD', '3': 'JAM', '4': 'BACKFIRE' };
      if (map[e.key]) { UI.call = map[e.key]; SFX.click(); UI.sync(); }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); UI.onPull(); }
      else if (e.key.toLowerCase() === 'b') UI.onBank();
    });
  },

  log() { /* wordless build — kept for compatibility */ },
};
