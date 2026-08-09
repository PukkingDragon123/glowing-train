'use strict';
/* ============================================================
   SHELL & DEBT — ui.js
   Screens, the chamber wheel, panels, tooltips, FX, log.
   ============================================================ */

const UI = {
  call: null,        // currently selected call
  busy: false,       // input lock during animations
  logLines: [],
  holeEls: new Map(), // uid -> element
  $: {},             // cached element refs for the round screen

  /* ================= boot / router ================= */

  render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    UI.holeEls.clear();
    app.appendChild(UI.buildTopbar());
    if (G.phase === 'round') UI.buildRound(app);
    else if (G.phase === 'casino') CASINO.buildFloor(app);
    else if (G.phase === 'gameover') UI.buildEnd(app, false);
    else if (G.phase === 'win') UI.buildEnd(app, true);
    else UI.buildTitle(app);
  },

  buildTopbar() {
    const bar = U.el('div', '');
    bar.id = 'topbar';
    const inRun = ['round', 'casino'].includes(G.phase);
    let tags = '';
    if (inRun) {
      tags += `<span class="ante-tag">ANTE ${G.ante}${G.ante > WIN_ANTE ? ' · ENDLESS' : ''}</span>`;
      if (G.phase === 'round' && G.boss) {
        const b = BOSSES[G.boss];
        tags += `<span class="boss-tag has-tip" data-tip-boss="${G.boss}">${b.icon} ${b.name}</span>`;
      }
      if (G.phase === 'round' && G.fate) {
        const f = FATES[G.fate];
        tags += `<span class="fate-tag has-tip" data-tip-fate="${G.fate}">${f.icon} ${f.name}</span>`;
      }
    }
    bar.innerHTML = `
      <div class="logo">SHELL <em>&amp;</em> DEBT</div>
      ${inRun ? `<span class="seed mono">${U.esc(G.seedStr)}</span>` : ''}
      <div class="spacer"></div>
      ${tags}
      <button id="btn-help">RULES</button>
      <button id="btn-mute">${SFX.muted ? '🔇' : '🔊'}</button>
      ${inRun ? '<button id="btn-abandon" title="Abandon this run">🏳️</button>' : ''}
    `;
    bar.querySelector('#btn-help').onclick = () => { SFX.click(); UI.showHelp(); };
    bar.querySelector('#btn-mute').onclick = (e) => {
      SFX.init(); const m = SFX.toggleMute();
      e.target.textContent = m ? '🔇' : '🔊';
      if (!m) SFX.click();
    };
    const ab = bar.querySelector('#btn-abandon');
    if (ab) ab.onclick = () => {
      if (confirm('Walk away from the table? The run ends here.')) {
        E.gameOver('debt'); G.overReason = 'walk'; UI.render();
      }
    };
    return bar;
  },

  /* ================= title ================= */

  buildTitle(app) {
    const best = E.loadBest();
    const wrap = U.el('div', 'splash');
    wrap.innerHTML = `
      <h1>SHELL <em>&amp;</em> DEBT</h1>
      <div class="tagline">
        The house found you. The chamber is loaded. Call the shot — <b style="color:var(--fire)">FIRE</b>,
        <b style="color:var(--dud)">DUD</b>, <b style="color:var(--jam)">JAM</b> or
        <b style="color:var(--backfire)">BACKFIRE</b> — ride the pot, bank the streak,
        and pay your debt before your nerve runs out.<br>
        Everything is gambling. Everything combos. Nobody leaves rich. Prove it wrong.
      </div>
      <div class="seed-row">
        <input id="seed-in" maxlength="24" placeholder="CURSED SEED (optional)" spellcheck="false">
      </div>
      <button class="big-btn gold-btn" id="btn-deal">🎰 &nbsp;DEAL ME IN</button>
      <button class="big-btn" id="btn-rules2">HOW TO PLAY</button>
      ${best ? `<div class="best-line">Deepest run: <b>ANTE ${best.ante}</b> · ${U.fmt(best.score)} total score · seed <span class="mono">${U.esc(best.seed)}</span></div>` : ''}
      <div class="best-line" style="opacity:.6">a 2D dark casino roguelike · inspired by the greats, cursed by the rest</div>
    `;
    app.appendChild(wrap);
    wrap.querySelector('#btn-deal').onclick = () => {
      SFX.init(); SFX.chak();
      const seed = wrap.querySelector('#seed-in').value;
      UI.call = null; UI.logLines = [];
      E.newRun(seed);
      UI.render();
      UI.log(`The velvet door closes behind you. Seed: ${G.seedStr}`, true);
      UI.log(`ANTE ${G.ante} — the house wants ${U.fmt(G.debt)}.`);
    };
    wrap.querySelector('#btn-rules2').onclick = () => { SFX.init(); UI.showHelp(); };
  },

  /* ================= round screen ================= */

  buildRound(app) {
    const grid = U.el('div', '');
    grid.id = 'round-grid';
    grid.innerHTML = `
      <div class="col" id="left-col">
        <div class="panel">
          <h3>THE DEBT</h3>
          <div class="debt-num mono" id="p-debt"></div>
          <div class="stat-row"><span class="lab">YOUR SCORE</span><span class="score-num mono" id="p-score"></span></div>
          <div class="debt-bar"><div class="ghost" id="p-ghost"></div><div class="fill" id="p-fill"></div></div>
        </div>
        <div class="panel">
          <h3>THE POT <span style="float:right" id="p-streak-lab"></span></h3>
          <div class="pot-num mono" id="p-pot"></div>
          <div class="streak-tag" id="p-streak"></div>
          <button class="btn-bank" id="btn-bank"></button>
        </div>
        <div class="panel">
          <h3>YOU</h3>
          <div class="stat-row"><span class="lab">CHIPS</span><span class="mono" style="color:var(--gold-hi)" id="p-chips"></span></div>
          <div class="stat-row"><span class="lab">NERVE</span><span class="hearts" id="p-nerve"></span></div>
          <div class="stat-row"><span class="lab">PULLS</span><span class="mono" id="p-pulls"></span></div>
          <div class="stat-row"><span class="lab">SLEIGHT</span><span class="pips" id="p-sleight"></span></div>
        </div>
      </div>

      <div id="center-col">
        <div id="chamber-zone">
          <div class="hammer" id="hammer">▼</div>
          <div id="wheel"><div class="axis"></div></div>
          <div id="holes-layer" style="position:absolute;inset:0;pointer-events:none"></div>
        </div>
        <div id="banner-zone"></div>
        <div id="log"></div>
      </div>

      <div class="col" id="right-col">
        <div class="panel">
          <h3>THE CALL</h3>
          <div id="call-btns"></div>
          <button class="btn-pull" id="btn-pull"></button>
        </div>
        <div class="panel">
          <h3>SLEIGHT OF HAND</h3>
          <div class="sleight-row">
            <button id="btn-peek"></button>
            <button id="btn-spin"></button>
            <button id="btn-eject"></button>
            <button id="btn-load"></button>
          </div>
        </div>
      </div>

      <div id="bottom-bar">
        <div class="panel" style="flex:1.4">
          <h3>SHELL POUCH <span id="p-pouch-count"></span></h3>
          <div class="chip-strip" id="p-pouch"></div>
        </div>
        <div class="panel">
          <h3>CHARMS</h3>
          <div class="chip-strip" id="p-charms"></div>
        </div>
      </div>
    `;
    app.appendChild(grid);

    UI.$ = {};
    ['p-debt', 'p-score', 'p-fill', 'p-ghost', 'p-pot', 'p-streak', 'p-chips', 'p-nerve',
      'p-pulls', 'p-sleight', 'btn-bank', 'call-btns', 'btn-pull', 'btn-peek', 'btn-spin',
      'btn-eject', 'btn-load', 'banner-zone', 'log', 'wheel', 'holes-layer', 'hammer',
      'p-pouch', 'p-pouch-count', 'p-charms']
      .forEach(id => UI.$[id] = grid.querySelector('#' + id));

    UI.$['btn-bank'].onclick = () => UI.onBank();
    UI.$['btn-pull'].onclick = () => UI.onPull();
    UI.$['btn-peek'].onclick = () => UI.onSleight('peek');
    UI.$['btn-spin'].onclick = () => UI.onSleight('spin');
    UI.$['btn-eject'].onclick = () => UI.onSleight('eject');
    UI.$['btn-load'].onclick = () => UI.onSleight('load');

    UI.renderLog();
    UI.sync();
  },

  /* ---------- incremental sync of the round screen ---------- */

  sync() {
    if (G.phase !== 'round' || !UI.$['p-debt']) return;
    const $ = UI.$;

    $['p-debt'].textContent = U.fmt(G.debt);
    $['p-score'].textContent = U.fmt(G.score);
    const pct = U.clamp(G.score / G.debt * 100, 0, 100);
    $['p-fill'].style.width = pct + '%';
    const ghostPct = U.clamp((G.pot > 0 ? E.bankAmount() : 0) / G.debt * 100, 0, 100 - pct);
    $['p-ghost'].style.left = pct + '%';
    $['p-ghost'].style.width = ghostPct + '%';

    $['p-pot'].textContent = U.fmt(G.pot);
    $['p-streak'].textContent = G.streak > 0
      ? `streak ${G.streak} — payouts ×${E.streakMult(G.streak).toFixed(2).replace(/\.?0+$/, '')}`
      : 'no streak — first hit pays ×1';
    const bankable = E.canBank();
    const bb = $['btn-bank'];
    bb.disabled = !bankable || UI.busy;
    if (G.pot <= 0) bb.textContent = 'BANK — pot is empty';
    else if (E.bossIs('croupier') && G.streak < 2) bb.textContent = `🎩 BANK LOCKED (streak < 2)`;
    else {
      const amt = E.bankAmount();
      bb.textContent = `BANK ${U.fmt(amt)}${amt !== G.pot ? (amt < G.pot ? ' (taxed)' : ' (×2!)') : ''}`;
    }

    $['p-chips'].textContent = '⛁ ' + U.fmt(G.chips);
    $['p-nerve'].innerHTML = Array.from({ length: G.nerveMax },
      (_, i) => `<span class="${i < G.nerve ? '' : 'off'}">🫀</span>`).join('');
    $['p-pulls'].innerHTML = `${G.pulls} <span style="color:var(--ink-dim)">/ ${G.pullsMax}</span>`;
    $['p-sleight'].innerHTML = Array.from({ length: Math.max(G.sleightMax, G.sleight) },
      (_, i) => `<span class="${i < G.sleight ? '' : 'off'}">◆</span>`).join('');

    UI.syncCalls();
    UI.syncSleight();
    UI.syncChamber();
    UI.syncPouch();
    UI.syncCharms();
  },

  syncCalls() {
    const $ = UI.$;
    const odds = E.topOdds();
    const box = $['call-btns'];
    box.innerHTML = '';
    OUTCOMES.forEach(o => {
      const m = OUTCOME_META[o];
      const p = odds.blind ? null : (odds.probs ? odds.probs[o] : null);
      const mult = E.callMult(p);
      const btn = U.el('button', 'call-btn' + (UI.call === o ? ` sel-${o}` : ''));
      btn.innerHTML = `
        <span class="ic">${m.icon}</span>
        <span>${o}<span class="odds">${odds.blind ? 'odds: ??' : (p === null ? '—' : 'odds: ' + Math.round(p * 100) + '%')}${odds.hidden && !odds.blind ? ' (est.)' : ''}</span></span>
        <span class="mult mono">×${mult}</span>
      `;
      btn.disabled = UI.busy || G.flags.roundWon;
      btn.onclick = () => { SFX.click(); UI.call = o; UI.sync(); };
      box.appendChild(btn);
    });

    const pull = $['btn-pull'];
    pull.disabled = UI.busy || !UI.call || G.flags.roundWon || !E.topHole() || G.pulls <= 0;
    pull.innerHTML = UI.call
      ? `PULL THE TRIGGER<span class="est">${OUTCOME_META[UI.call].icon} calling ${UI.call} — a hit pays ≈${U.fmt(E.estPayout(UI.call))}</span>`
      : `PULL THE TRIGGER<span class="est">choose your call first</span>`;
  },

  syncSleight() {
    const $ = UI.$;
    const caged = E.sleightBlocked();
    const tag = (cost) => cost === 0 ? '<span class="cost">free</span>' : `<span class="cost">◆${cost}</span>`;
    const top = E.topHole();

    $['btn-peek'].innerHTML = `👁️ PEEK ${tag(E.peekCost())}`;
    $['btn-peek'].disabled = UI.busy || G.flags.roundWon || !E.peekAllowed();
    if (E.blindRound() || E.fateIs('houseEyes')) $['btn-peek'].title = 'Peeking is forbidden this round.';
    else $['btn-peek'].title = top && top.revealed ? 'The next shell is already revealed.' : 'Reveal the shell under the hammer.';

    $['btn-spin'].innerHTML = `🌀 SPIN ${tag(1)}`;
    $['btn-spin'].disabled = UI.busy || G.flags.roundWon || !E.spinAllowed();
    $['btn-spin'].title = 'Shuffle and re-hide the chamber.';

    $['btn-eject'].innerHTML = `⏏️ EJECT ${tag(E.ejectCost())}`;
    $['btn-eject'].disabled = UI.busy || G.flags.roundWon || !E.ejectAllowed();
    $['btn-eject'].title = 'Discard the shell under the hammer, sight unseen.';

    $['btn-load'].innerHTML = `🫳 LOAD ${tag(1)}`;
    $['btn-load'].disabled = UI.busy || G.flags.roundWon || !E.loadAllowed();
    $['btn-load'].title = 'Swap a shell from your pouch into the top chamber.';

    if (caged) ['btn-peek', 'btn-spin', 'btn-eject', 'btn-load'].forEach(b => {
      $[b].title = '🔒 The Cage: Sleight is disabled this round.';
    });
  },

  /* ---------- chamber wheel ---------- */

  holePos(slotOffset) {
    // slotOffset 0 = under the hammer (top), increasing clockwise
    const a = (slotOffset * 60 - 90) * Math.PI / 180;
    const R = 112;
    return { x: Math.cos(a) * R, y: Math.sin(a) * R };
  },

  syncChamber(instant) {
    const layer = UI.$['holes-layer'];
    if (!layer) return;
    const zone = layer.parentElement;
    const cx = zone.clientWidth / 2, cy = zone.clientHeight / 2;

    // hammer position
    const hp = UI.holePos(0);
    UI.$['hammer'].style.top = (cy + hp.y - 68) + 'px';

    const seen = new Set();
    for (let i = 0; i < 6; i++) {
      const h = G.holes[i];
      if (!h) continue;
      const off = ((i - G.ptr) % 6 + 6) % 6;
      const p = UI.holePos(off);
      const uid = h.inst.uid;
      seen.add(uid);
      let el = UI.holeEls.get(uid);
      if (!el) {
        el = U.el('div', 'hole');
        el.style.pointerEvents = 'auto';
        layer.appendChild(el);
        UI.holeEls.set(uid, el);
        if (instant) el.style.transition = 'none';
      }
      el.className = 'hole' + (off === 0 ? ' top-hole' : '');
      el.style.transition = instant ? 'none' : 'transform .45s cubic-bezier(.3,1.2,.4,1)';
      el.style.transform = `translate(${cx + p.x - 42}px, ${cy + p.y - 42}px)`;
      el.style.left = '0'; el.style.top = '0'; el.style.margin = '0';

      const shell = SHELLS[h.inst.id];
      const blind = E.blindRound();
      const show = h.revealed && !blind;
      el.innerHTML = show
        ? `<div class="shell-disc has-tip" data-tip-shell="${h.inst.id}"><span class="rim"></span>${shell.icon}</div>`
        : `<div class="shell-disc hidden-shell has-tip" data-tip-hidden="1"><span class="rim"></span>?</div>`;
      if (instant) requestAnimationFrame(() => { el.style.transition = ''; });
    }
    // drop removed shells
    for (const [uid, el] of UI.holeEls) {
      if (!seen.has(uid)) { el.remove(); UI.holeEls.delete(uid); }
    }
  },

  wheelPulse(spin) {
    const w = UI.$['wheel'];
    if (!w) return;
    w.classList.add('spinning');
    const cur = UI._wrot || 0;
    UI._wrot = cur - (spin ? 420 : 60);
    w.style.transform = `rotate(${UI._wrot}deg)`;
    setTimeout(() => w.classList.remove('spinning'), spin ? 1000 : 460);
  },

  /* ---------- pouch & charms ---------- */

  syncPouch() {
    const $ = UI.$;
    const box = $['p-pouch'];
    box.innerHTML = '';
    const inChamber = E.shellsInChamber();
    $['p-pouch-count'].textContent =
      ` — ${G.reserve.length} in pouch · ${inChamber} chambered · ${G.spent.length} spent`;
    G.reserve.forEach(inst => {
      const s = SHELLS[inst.id];
      const c = U.el('span', 'shell-chip has-tip', s.icon);
      c.dataset.tipShell = inst.id;
      box.appendChild(c);
    });
    G.spent.forEach(inst => {
      const s = SHELLS[inst.id];
      const c = U.el('span', 'shell-chip dim has-tip', s.icon);
      c.dataset.tipShell = inst.id;
      box.appendChild(c);
    });
    if (!G.reserve.length && !G.spent.length) {
      box.innerHTML = '<span style="color:var(--ink-dim);font-size:12px">every shell you own is loaded</span>';
    }
  },

  syncCharms() {
    const box = UI.$['p-charms'];
    box.innerHTML = '';
    G.charms.forEach(id => {
      const c = CHARMS[id];
      const el = U.el('span', 'charm-chip has-tip', c.icon);
      el.dataset.tipCharm = id;
      box.appendChild(el);
    });
    for (let i = G.charms.length; i < MAX_CHARMS; i++) {
      box.appendChild(U.el('span', 'charm-slot-empty', '+'));
    }
  },

  /* ================= actions ================= */

  async onPull() {
    if (UI.busy || !UI.call) return;
    if (G.phase !== 'round' || G.flags.roundWon) return;
    UI.busy = true;
    UI.sync();

    SFX.chak();
    UI.wheelPulse(false);
    await U.sleep(340);

    const R = E.doPull(UI.call);
    if (!R) { UI.busy = false; UI.sync(); return; }

    // outcome FX
    const meta = OUTCOME_META[R.outcome];
    if (R.outcome === 'FIRE') { SFX.shot(); UI.flash('go-fire'); UI.shake(); }
    else if (R.outcome === 'DUD') { SFX.dud(); }
    else if (R.outcome === 'JAM') { SFX.jamSfx(); }
    else { SFX.backfire(); UI.flash('go-back'); UI.shake(); }

    const forcedTxt = { rabbit: '🐇 rigged', magnet: '🧲 magnetized', web: '🕸️ webbed', echo: '🔁 echoed' }[R.forcedBy];
    let sub = `${R.shell.name}${R.wasRevealed ? '' : ' (was hidden)'}${forcedTxt ? ' · ' + forcedTxt : ''}`;
    let payHtml = '';
    if (R.correct) {
      payHtml = `<div class="pay">CALLED IT — pot +${U.fmt(R.payout)} <span style="color:var(--ink-dim)">(×${R.mult} call · ×${E.streakMult(G.streak).toFixed(2).replace(/\.?0+$/, '')} streak)</span></div>`;
      SFX.coin();
    } else if (R.nerveLost > 0) {
      payHtml = `<div class="pay" style="color:var(--backfire)">−${R.nerveLost} NERVE ${U.pick(Math.random, FLAVOR.backfireHurt)}</div>`;
      SFX.hurt();
    } else {
      payHtml = `<div class="pay" style="color:var(--ink-dim)">missed the call — the pot burns</div>`;
    }
    UI.banner(`<div class="banner">
      <div class="big" style="color:${meta.color}">${meta.icon} ${R.outcome}</div>
      <div class="sub">${U.esc(sub)} — ${meta.verb}</div>
      ${payHtml}</div>`);

    UI.log(`${meta.icon} ${R.outcome}${R.correct ? ` · called · +${U.fmt(R.payout)} to pot` : ' · missed'}`,
      R.correct);
    R.notes.forEach(n => UI.log(n));
    if (R.correct && G.pot >= 300) UI.log(U.pick(Math.random, FLAVOR.bigWin), true);
    else if (R.correct) UI.log(U.pick(Math.random, FLAVOR.hit));
    else UI.log(U.pick(Math.random, FLAVOR.miss));

    if (R.correct && R.payout >= 150) UI.particles('✨', 14);

    if (R.jammed) await U.sleep(200);
    if (R.reloaded) {
      await U.sleep(300);
      SFX.spin(); UI.wheelPulse(true);
      UI.log('The cylinder swings open — fresh shells slide home.');
      UI.syncChamber(true);
    }

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
    UI.log(`🏦 Banked ${U.fmt(res.amt)}${res.taxed ? ' after the house took its cut' : ''}${res.doubled ? ' — DOUBLED' : ''}. ${U.pick(Math.random, FLAVOR.bank)}`, true);
    if (res.amt >= 200) UI.particles('🪙', 18);
    UI.sync();
    if (res.won) await UI.roundWonFlow();
  },

  async onSleight(kind) {
    if (UI.busy || G.phase !== 'round' || G.flags.roundWon) return;
    if (kind === 'peek') {
      if (!E.doPeek()) return;
      SFX.click();
      const top = E.topHole();
      UI.log(`👁️ Peek: the next shell is a ${SHELLS[top.inst.id].name}.`);
    } else if (kind === 'spin') {
      if (!E.doSpin()) return;
      SFX.spin(); UI.wheelPulse(true);
      UI.log('🌀 You spin the cylinder. Everything blurs.');
      UI.syncChamber(true);
    } else if (kind === 'eject') {
      const r = E.doEject();
      if (!r) return;
      SFX.chak();
      UI.log(`⏏️ Ejected: it was a ${SHELLS[r.inst.id].name}.`);
      if (r.reloaded) { SFX.spin(); UI.wheelPulse(true); UI.syncChamber(true); }
    } else if (kind === 'load') {
      UI.showLoadPicker();
      return;
    }
    UI.sync();
  },

  showLoadPicker() {
    if (!E.loadAllowed()) return;
    const m = UI.modal(`
      <button class="m-close" id="mm-close">✕</button>
      <h2>🫳 LOAD THE CHAMBER</h2>
      <div class="m-sub">Pick a shell from your pouch. It goes under the hammer — the shell there now returns to the pouch. Costs ◆1.</div>
      <div class="chip-strip" id="load-strip" style="gap:10px"></div>
    `);
    const strip = m.querySelector('#load-strip');
    G.reserve.forEach(inst => {
      const s = SHELLS[inst.id];
      const c = U.el('button', 'shell-chip selectable has-tip', s.icon);
      c.dataset.tipShell = inst.id;
      c.style.width = '52px'; c.style.height = '52px'; c.style.fontSize = '26px';
      c.onclick = () => {
        const done = E.doLoad(inst.uid);
        if (done) {
          SFX.chak();
          UI.log(`🫳 Loaded a ${SHELLS[done.id].name} under the hammer.`);
          UI.closeModal();
          UI.sync();
        }
      };
      strip.appendChild(c);
    });
    m.querySelector('#mm-close').onclick = () => { SFX.click(); UI.closeModal(); };
  },

  /* ================= round end flows ================= */

  async roundWonFlow() {
    UI.busy = true;
    SFX.win();
    UI.flash('go-gold');
    UI.particles('🪙', 26);
    UI.log(U.pick(Math.random, FLAVOR.roundWin), true);
    await U.sleep(700);
    UI.busy = false;

    const r = G.flags.reward;
    const isFinal = G.ante === WIN_ANTE && !G.endlessMode;
    const m = UI.modal(`
      <h2 style="color:var(--neon)">DEBT PAID — ANTE ${G.ante} CLEARED</h2>
      <div class="m-sub">${U.esc(U.pick(Math.random, FLAVOR.roundWin))}</div>
      <div class="end-stats">
        <div><div class="es-lab">SCORE</div><div class="es-val mono">${U.fmt(G.score)} / ${U.fmt(G.debt)}</div></div>
        <div><div class="es-lab">PAYOUT</div><div class="es-val mono">+${U.fmt(r.total)} chips</div></div>
        <div><div class="es-lab">BASE + PULLS</div><div class="es-val mono">${U.fmt(r.base)}</div></div>
        <div><div class="es-lab">INTEREST${r.extra ? ' + COUNTERFEIT' : ''}</div><div class="es-val mono">${U.fmt(r.inter + r.extra)}</div></div>
      </div>
      <button class="big-btn gold-btn" id="mm-go">${isFinal ? '👁️ FACE THE LEDGER' : '🎰 ONTO THE CASINO FLOOR'}</button>
    `, true);
    m.querySelector('#mm-go').onclick = () => {
      SFX.click();
      UI.closeModal();
      if (isFinal) { E.winRun(); UI.render(); }
      else { E.toCasino(); UI.render(); }
    };
  },

  async deathFlow() {
    UI.busy = true;
    SFX.lose();
    await U.sleep(900);
    UI.busy = false;
    UI.render();
  },

  /* ================= end screens ================= */

  buildEnd(app, won) {
    const wrap = U.el('div', 'splash');
    const s = G.stats;
    const reasons = {
      nerve: ['YOUR NERVE BREAKS', 'The last backfire takes more than skin. The house sweeps your chips into the dark.'],
      debt: ['THE HOUSE COLLECTS', `The debt stood at ${U.fmt(G.debt)}. You brought ${U.fmt(G.score)}. It is not a negotiation.`],
      walk: ['YOU WALK AWAY', 'The doorman doesn\'t look at you. Nobody ever looks at the ones who leave.'],
    };
    const head = won
      ? ['<em>THE OWNER FOLDS</em>', 'Eight antes deep, the ledger burns. The eye behind the cage blinks first. The chamber is yours now.']
      : reasons[G.overReason] || reasons.debt;

    wrap.innerHTML = `
      <h1 style="font-size:44px">${head[0]}</h1>
      <div class="tagline">${head[1]}</div>
      <div class="end-stats">
        <div><div class="es-lab">ANTES CLEARED</div><div class="es-val mono">${s.antesCleared}${won ? ' — ALL' : ''}</div></div>
        <div><div class="es-lab">TOTAL SCORE</div><div class="es-val mono">${U.fmt(s.totalScore)}</div></div>
        <div><div class="es-lab">BEST SINGLE PAYOUT</div><div class="es-val mono">${U.fmt(s.bestPayout)}</div></div>
        <div><div class="es-lab">BEST BANK</div><div class="es-val mono">${U.fmt(s.bestBank)}</div></div>
        <div><div class="es-lab">PULLS / HITS</div><div class="es-val mono">${s.pulls} / ${s.hits}</div></div>
        <div><div class="es-lab">BACKFIRES EATEN</div><div class="es-val mono">${s.backfiresEaten}</div></div>
        <div><div class="es-lab">CHIP PEAK</div><div class="es-val mono">${U.fmt(s.chipsPeak)}</div></div>
        <div><div class="es-lab">SEED</div><div class="es-val mono" style="font-size:14px">${U.esc(G.seedStr)}</div></div>
      </div>
      ${won ? '<button class="big-btn gold-btn" id="btn-endless">🕳️ KEEP DESCENDING (ENDLESS)</button>' : ''}
      <button class="big-btn ${won ? '' : 'gold-btn'}" id="btn-again">🎰 ANOTHER RUN</button>
      <button class="big-btn" id="btn-title">BACK TO THE DOOR</button>
    `;
    app.appendChild(wrap);
    const endless = wrap.querySelector('#btn-endless');
    if (endless) endless.onclick = () => {
      SFX.chak();
      G.endlessMode = true;
      E.toCasino();
      UI.render();
    };
    wrap.querySelector('#btn-again').onclick = () => {
      SFX.chak();
      UI.call = null; UI.logLines = [];
      E.newRun('');
      UI.render();
      UI.log(`New marker signed. Seed: ${G.seedStr}`);
    };
    wrap.querySelector('#btn-title').onclick = () => { SFX.click(); G.phase = 'title'; UI.render(); };
  },

  /* ================= banner / log / fx ================= */

  banner(html) {
    const z = UI.$['banner-zone'];
    if (!z) return;
    z.innerHTML = html;
  },

  log(msg, hot) {
    UI.logLines.unshift({ msg, hot });
    UI.logLines = UI.logLines.slice(0, 4);
    UI.renderLog();
  },

  renderLog() {
    const el = UI.$['log'] || document.getElementById('log');
    if (!el) return;
    el.innerHTML = UI.logLines
      .map((l, i) => `<div class="${i === 0 ? 'l0' : ''}" ${l.hot && i === 0 ? 'style="color:var(--gold-hi)"' : ''}>${l.msg}</div>`)
      .join('');
  },

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

  particles(emoji, n) {
    const box = document.getElementById('fx-particles');
    for (let i = 0; i < n; i++) {
      const p = U.el('span', 'particle', emoji);
      p.style.left = Math.random() * 100 + 'vw';
      p.style.animationDuration = (0.9 + Math.random() * 1.3) + 's';
      p.style.animationDelay = Math.random() * 0.3 + 's';
      p.style.fontSize = (14 + Math.random() * 16) + 'px';
      box.appendChild(p);
      setTimeout(() => p.remove(), 2600);
    }
  },

  /* ================= modal & tooltip ================= */

  modal(html, noClose) {
    const root = document.getElementById('modal-root');
    root.classList.remove('hidden');
    root.innerHTML = '';
    const m = U.el('div', 'modal', html);
    root.appendChild(m);
    if (!noClose) {
      root.onclick = (e) => { if (e.target === root) UI.closeModal(); };
    } else root.onclick = null;
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

  tooltipFor(el) {
    if (el.dataset.tipShell) {
      const s = SHELLS[el.dataset.tipShell];
      const w = E.effWeights ? E.effWeights({ id: s.id }) : null;
      const odds = w ? OUTCOMES.map(o =>
        `${OUTCOME_META[o].icon}${Math.round(w[o] * 100)}%`).join(' · ') : '';
      return `<div class="tt-name">${s.icon} ${s.name} <span class="rarity-${s.rarity}">${s.rarity.toUpperCase()}</span></div>
        <div class="tt-desc">${s.desc}</div>
        <div class="tt-odds">${odds} · base ${s.base}</div>`;
    }
    if (el.dataset.tipCharm) {
      const c = CHARMS[el.dataset.tipCharm];
      return `<div class="tt-name">${c.icon} ${c.name} <span class="rarity-${c.rarity}">${c.rarity.toUpperCase()}</span></div>
        <div class="tt-desc">${c.desc}</div>`;
    }
    if (el.dataset.tipBoss) {
      const b = BOSSES[el.dataset.tipBoss];
      return `<div class="tt-name">${b.icon} ${b.name}</div><div class="tt-desc">${b.desc}</div>`;
    }
    if (el.dataset.tipFate) {
      const f = FATES[el.dataset.tipFate];
      return `<div class="tt-name">${f.icon} ${f.name}</div><div class="tt-desc">${f.desc.replace('Next round:', 'This round:')}</div>`;
    }
    if (el.dataset.tipHidden) {
      return `<div class="tt-name">❓ UNKNOWN SHELL</div>
        <div class="tt-desc">One of the shells loaded this cycle. The call odds shown are the average across every hidden shell in the chamber.</div>`;
    }
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
      <button class="m-close" id="mm-close">✕</button>
      <h2>HOUSE RULES</h2>
      <div class="m-sub">Read them once. The house won't repeat itself.</div>
      <div class="help-cols">
        <div>
          <h4>THE CHAMBER</h4>
          <p>A cursed cylinder loaded from your <b>shell pouch</b>. Each pull, the shell under the hammer resolves as
          <b style="color:var(--fire)">FIRE</b>, <b style="color:var(--dud)">DUD</b>,
          <b style="color:var(--jam)">JAM</b> or <b style="color:var(--backfire)">BACKFIRE</b>.</p>
          <h4>THE CALL</h4>
          <p>Before pulling, <b>call the outcome</b>. Rarer calls pay bigger multipliers.
          Hidden shells show the average odds of everything hidden in the chamber — peek, load and count shells to beat the average.</p>
          <h4>POT &amp; STREAK</h4>
          <p>Correct calls add to the <b>pot</b> and grow your <b>streak multiplier</b>.
          <b>BANK</b> moves the pot into your score (and resets the streak). A wrong call <b>burns the whole pot</b>. Push or cash — that's the game.</p>
          <h4>THE DEBT</h4>
          <p>Bank enough score to pay each ante's debt before your pulls run out. Fail, and the run ends.</p>
        </div>
        <div>
          <h4>NERVE</h4>
          <p>An <b>uncalled BACKFIRE</b> costs 1 Nerve (cursed shells: 2). At zero, you're done.
          Call the backfire and you ride the blast for profit instead.</p>
          <h4>SLEIGHT OF HAND</h4>
          <p><b>👁️ Peek</b> the top shell · <b>🌀 Spin</b> to reshuffle · <b>⏏️ Eject</b> the top shell ·
          <b>🫳 Load</b> a chosen shell under the hammer. Limited uses per round.</p>
          <h4>JAM</h4>
          <p>A jammed shell <b>stays in the chamber</b> (now revealed) and comes around again. The pull is still spent.</p>
          <h4>THE CASINO</h4>
          <p>Between antes: <b>🎰 slots</b> pay out new shells, <b>🃏 blackjack</b> pays chips (21 exactly wins a shell),
          <b>🎡 roulette</b> rewrites the next round, <b>🐔 the derby</b> is honest work, and the <b>🏚️ pawn shop</b> sells charms.</p>
          <h4>KEYS</h4>
          <p><b>1–4</b> choose call · <b>SPACE</b> pull · <b>B</b> bank.</p>
        </div>
      </div>
    `).querySelector('#mm-close').onclick = () => UI.closeModal();
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
};
