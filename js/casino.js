'use strict';
/* ============================================================
   SHELL & DEBT — casino.js
   The between-rounds casino floor: slots, blackjack, roulette,
   the chicken derby, and the pawn shop.
   ============================================================ */

const CASINO = {

  /* ================= the floor ================= */

  buildFloor(app) {
    const wrap = U.el('div', '');
    wrap.id = 'casino-wrap';
    const r = G.flags.reward || { total: 0 };
    wrap.innerHTML = `
      <div class="casino-head">
        <h1>🎰 THE MIDNIGHT FLOOR</h1>
        <div class="neon-sub">EVERYTHING IS GAMBLING · EVERYTHING COMBOS</div>
      </div>
      <div class="reward-strip">
        <span>ANTE ${G.ante} PAID · reward <b>+${U.fmt(r.total)}</b> chips</span>
        <span>YOUR CHIPS: <b class="mono" id="floor-chips">⛁ ${U.fmt(G.chips)}</b></span>
        <span>NERVE: <b>${'🫀'.repeat(G.nerve)}${'🖤'.repeat(Math.max(0, G.nerveMax - G.nerve))}</b></span>
        <span>POUCH: <b>${G.bag.length} shells</b></span>
      </div>
      <div class="stations" id="stations"></div>
      <div class="next-table">
        <div class="nt-info" id="nt-info"></div>
        <button class="big-btn gold-btn" id="btn-next">🚬 NEXT TABLE ▶</button>
      </div>
    `;
    app.appendChild(wrap);

    const defs = [
      { id: 'slots', icon: '🎰', name: 'ONE-ARMED BANDIT', open: () => CASINO.openSlots(),
        tag: 'Feed it chips, it spits out shells. Sometimes. Triple sevens pay legendary.',
        uses: () => `${G.casino.slotsLeft} spins left tonight` },
      { id: 'bj', icon: '🃏', name: 'BLACKJACK', open: () => CASINO.openBlackjack(),
        tag: 'Beat the dealer for chips. Hit exactly 21 and win a shell off the table.',
        uses: () => `${G.casino.bjLeft} hands left tonight` },
      { id: 'roulette', icon: '🎡', name: 'WHEEL OF FATES', open: () => CASINO.openRoulette(),
        tag: 'The wheel decides what tomorrow\'s table looks like. Bet on where it lands, if you dare.',
        uses: () => G.casino.rouletteLeft ? 'the wheel turns once a night' : 'the wheel is still' },
      { id: 'derby', icon: '🐔', name: 'CHICKEN DERBY', open: () => CASINO.openDerby(),
        tag: 'Four birds, one winner, zero integrity. Longshot winners shed valuable feathers.',
        uses: () => `${G.casino.derbyLeft} races left tonight` },
      { id: 'pawn', icon: '🏚️', name: 'PAWN SHOP', open: () => CASINO.openPawn(),
        tag: 'Charms, surgery for your shell pouch, and other quiet arrangements.',
        uses: () => 'always open' },
    ];
    const st = wrap.querySelector('#stations');
    defs.forEach(d => {
      const b = U.el('button', 'station');
      b.innerHTML = `<span class="st-icon">${d.icon}</span>
        <span class="st-name">${d.name}</span>
        <span class="st-tag">${d.tag}</span>
        <span class="st-uses" id="uses-${d.id}">${d.uses()}</span>`;
      b.onclick = () => { SFX.click(); d.open(); };
      st.appendChild(b);
      d.el = b;
    });
    CASINO.defs = defs;

    wrap.querySelector('#btn-next').onclick = () => {
      SFX.chak();
      UI.closeModal();
      E.nextAnte();
      UI.render();
      UI.log(`ANTE ${G.ante}. The house wants ${U.fmt(G.debt)}.`, true);
      if (G.boss) UI.log(`${BOSSES[G.boss].icon} ${BOSSES[G.boss].name}: ${BOSSES[G.boss].desc}`);
      if (G.fate) UI.log(`${FATES[G.fate].icon} The wheel's fate is live: ${FATES[G.fate].name}.`);
    };

    CASINO.syncFloor();
  },

  syncFloor() {
    const chipsEl = document.getElementById('floor-chips');
    if (chipsEl) chipsEl.textContent = '⛁ ' + U.fmt(G.chips);
    (CASINO.defs || []).forEach(d => {
      const uses = document.getElementById('uses-' + d.id);
      if (uses) {
        const left = { slots: G.casino.slotsLeft, bj: G.casino.bjLeft, derby: G.casino.derbyLeft,
          roulette: G.casino.rouletteLeft }[d.id];
        uses.textContent = ({
          slots: `${G.casino.slotsLeft} spins left tonight`,
          bj: `${G.casino.bjLeft} hands left tonight`,
          roulette: G.casino.rouletteLeft ? 'the wheel turns once a night' : 'the wheel is still',
          derby: `${G.casino.derbyLeft} races left tonight`,
          pawn: 'always open',
        })[d.id];
        if (left !== undefined && left <= 0) d.el.classList.add('spent-station');
      }
    });
    const nt = document.getElementById('nt-info');
    if (nt) {
      const nextAnte = G.ante + 1;
      let debt = (nextAnte <= DEBTS.length)
        ? DEBTS[nextAnte - 1]
        : Math.round(DEBTS[DEBTS.length - 1] * Math.pow(1.6, nextAnte - DEBTS.length) / 10) * 10;
      const boss = E.upcomingBoss();
      const bossTxt = boss === 'random' ? '<span class="warn">❓ an unscheduled twist</span>'
        : boss ? `<span class="warn">${BOSSES[boss].icon} ${BOSSES[boss].name} — ${BOSSES[boss].desc}</span>`
        : 'no boss twist scheduled';
      const fateTxt = G.nextFate
        ? `<div class="fate-note">${FATES[G.nextFate].icon} Fate queued: ${FATES[G.nextFate].name} — ${FATES[G.nextFate].desc}</div>`
        : '';
      nt.innerHTML = `<b>NEXT TABLE — ANTE ${nextAnte}</b> · base debt ≈ <b>${U.fmt(debt)}</b><br>${bossTxt}${fateTxt}`;
    }
  },

  chipsBar(extra) {
    return `<div class="bet-row"><span class="bet-lab">CHIPS</span>
      <b class="mono" style="color:var(--gold-hi)" id="mm-chips">⛁ ${U.fmt(G.chips)}</b>${extra || ''}</div>`;
  },

  syncChips() {
    const el = document.getElementById('mm-chips');
    if (el) el.textContent = '⛁ ' + U.fmt(G.chips);
    G.stats.chipsPeak = Math.max(G.stats.chipsPeak, G.chips);
    CASINO.syncFloor();
  },

  betPicker(id, amounts) {
    return `<div class="bet-row"><span class="bet-lab">WAGER</span>
      ${amounts.map((a, i) => `<button class="bet-btn ${i === 0 ? 'sel' : ''}" data-bet="${a}" data-group="${id}">⛁${a}</button>`).join('')}
    </div>`;
  },

  wireBetPicker(modal, id, onChange) {
    modal.querySelectorAll(`[data-group="${id}"]`).forEach(b => {
      b.onclick = () => {
        SFX.click();
        modal.querySelectorAll(`[data-group="${id}"]`).forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        if (onChange) onChange(+b.dataset.bet);
      };
    });
  },

  getBet(modal, id) {
    const sel = modal.querySelector(`[data-group="${id}"].sel`);
    return sel ? +sel.dataset.bet : 5;
  },

  /* ================= SLOTS ================= */

  slotCost() { return E.price(E.has('gremlin') ? 3 : 6); },

  openSlots() {
    const m = UI.modal(`
      <button class="m-close" id="mm-close">✕</button>
      <h2>🎰 ONE-ARMED BANDIT</h2>
      <div class="m-sub">It eats chips and dreams. Three of a kind pays in SHELLS. ${U.esc('Sevens pay in legends.')}</div>
      ${CASINO.chipsBar()}
      <div class="slot-frame" id="slot-frame"></div>
      <div style="text-align:center">
        <button class="big-btn gold-btn" id="btn-spin-slots"></button>
        <div class="result-line" id="slot-result"></div>
      </div>
      <div class="paytable">
        <div>🔥🔥🔥 → Shotgun Shell</div>
        <div>⚪⚪⚪ → 2 Blank Shells +4⛁</div>
        <div>🐔🐔🐔 → Feather Shell +6⛁</div>
        <div>🕸️🕸️🕸️ → Web Shell</div>
        <div>💀💀💀 → Cursed Shell +10⛁ (condolences)</div>
        <div>💰💰💰 → 40⛁</div>
        <div>7️⃣7️⃣7️⃣ → JACKPOT: legendary shell +60⛁</div>
        <div>7️⃣7️⃣ any → 12⛁</div>
        <div>pair 🔥/⚪ → matching common shell</div>
        <div>pair 🕸️ → sometimes a Web Shell</div>
        <div>3 straight losses → a Blank Shell in sympathy</div>
      </div>
    `);
    m.querySelector('#mm-close').onclick = () => { SFX.click(); UI.closeModal(); };

    const frame = m.querySelector('#slot-frame');
    const tapes = [];
    for (let i = 0; i < 3; i++) {
      const reel = U.el('div', 'reel');
      const tape = U.el('div', 'tape');
      tape.innerHTML = `<div class="cell">🎰</div>`;
      reel.appendChild(tape);
      frame.appendChild(reel);
      tapes.push(tape);
    }

    const btn = m.querySelector('#btn-spin-slots');
    const syncBtn = () => {
      const cost = CASINO.slotCost();
      btn.innerHTML = `PULL THE ARM — ⛁${cost}`;
      btn.disabled = G.casino.slotsLeft <= 0 || G.chips < cost;
      if (G.casino.slotsLeft <= 0) btn.innerHTML = 'THE ARM IS TIRED';
    };
    syncBtn();

    btn.onclick = async () => {
      const cost = CASINO.slotCost();
      if (G.chips < cost || G.casino.slotsLeft <= 0) return;
      G.chips -= cost;
      G.casino.slotsLeft--;
      CASINO.syncChips();
      btn.disabled = true;
      m.querySelector('#slot-result').textContent = '';
      SFX.spin();

      // pick outcomes, build tapes, animate
      const res = [0, 1, 2].map(() => U.wpick(G.rng, SLOT_SYMBOLS, s => s.w).s);
      tapes.forEach((tape, i) => {
        const filler = Array.from({ length: 14 + i * 4 },
          () => U.pick(Math.random, SLOT_SYMBOLS).s);
        tape.innerHTML = filler.concat(res[i]).map(s => `<div class="cell">${s}</div>`).join('');
        tape.style.transition = 'none';
        tape.style.transform = 'translateY(0)';
        void tape.offsetHeight;
        tape.style.transition = `transform ${1.4 + i * 0.4}s cubic-bezier(.15,.85,.25,1)`;
        tape.style.transform = `translateY(-${(filler.length) * 100}px)`;
      });
      await U.sleep(2350);
      CASINO.slotPayout(res, m.querySelector('#slot-result'));
      CASINO.syncChips();
      syncBtn();
    };
  },

  slotPayout(res, out) {
    const count = {};
    res.forEach(s => count[s] = (count[s] || 0) + 1);
    const three = Object.keys(count).find(s => count[s] === 3);
    const pair = Object.keys(count).find(s => count[s] === 2);
    const gained = [];
    let chips = 0, txt = '';

    const give = (id) => { E.addShellById(id); gained.push(SHELLS[id]); };

    if (three) {
      switch (three) {
        case '🔥': give('buck'); txt = 'TRIPLE FIRE!'; break;
        case '⚪': give('blank'); give('blank'); chips = 4; txt = 'TRIPLE BLANKS.'; break;
        case '🐔': give('feather'); chips = 6; txt = 'TRIPLE BIRDS!'; break;
        case '🕸️': give('web'); txt = 'THE WEB SPINS!'; break;
        case '💀': give('cursed'); chips = 10; txt = 'TRIPLE SKULLS. our condolences.'; break;
        case '💰': chips = 40; txt = 'MONEY MONEY MONEY!'; break;
        case '7️⃣': {
          const id = U.pick(G.rng, SHELL_POOLS.legendary);
          give(id); chips = 60; txt = '🚨 JACKPOT 🚨';
          G.stats.jackpots++;
          SFX.jackpot(); UI.flash('go-gold'); UI.particles('🪙', 30);
          break;
        }
      }
      G.casino.pityCount = 0;
    } else if (count['7️⃣'] === 2) {
      chips = 12; txt = 'two sevens — close enough for the house.';
      G.casino.pityCount = 0;
    } else if (pair === '🔥') { give('live'); txt = 'a pair of flames.'; G.casino.pityCount = 0; }
    else if (pair === '⚪') { give('blank'); txt = 'a pair of nothings.'; G.casino.pityCount = 0; }
    else if (pair === '🐔') { chips = 3; txt = 'two birds, three chips.'; G.casino.pityCount = 0; }
    else if (pair === '💰') { chips = 6; txt = 'a glint of gold.'; G.casino.pityCount = 0; }
    else if (pair === '🕸️' && G.rng() < 0.25) { give('web'); txt = 'something crawled out of the machine.'; G.casino.pityCount = 0; }
    else if (pair === '💀') { txt = 'two skulls stare back. nothing else.'; G.casino.pityCount++; }
    else {
      G.casino.pityCount++;
      txt = 'the machine hums, unimpressed.';
    }

    if (!three && !gained.length && !chips && G.casino.pityCount >= 3) {
      give('blank'); txt += ' the house slides you a blank in sympathy.';
      G.casino.pityCount = 0;
    }

    G.chips += chips;
    if (gained.length || chips) SFX.coin();
    out.innerHTML = `${res.join(' ')} — ${U.esc(txt)}${gained.length ? '<br>WON: ' + gained.map(s => s.icon + ' ' + s.name).join(', ') : ''}${chips ? ` <b>+${chips}⛁</b>` : ''}`;
  },

  /* ================= BLACKJACK ================= */

  openBlackjack() {
    const m = UI.modal(`
      <button class="m-close" id="mm-close">✕</button>
      <h2>🃏 BLACKJACK</h2>
      <div class="m-sub">Dealer stands on 17. Blackjack pays 3:2. Win with exactly 21 and a shell falls off the table.${E.has('markedCards') ? ' <span style="color:var(--purple)">Your marked cards show the hole card.</span>' : ''}</div>
      ${CASINO.chipsBar()}
      ${CASINO.betPicker('bj', [5, 10, 25])}
      <div class="bj-table">
        <div><div class="bj-hand-label">DEALER <span class="hand-total" id="bj-dtotal"></span></div>
          <div class="cards-row" id="bj-dealer"></div></div>
        <div><div class="bj-hand-label">YOU <span class="hand-total" id="bj-ptotal"></span></div>
          <div class="cards-row" id="bj-player"></div></div>
      </div>
      <div class="bet-row">
        <button class="big-btn gold-btn" id="bj-deal"></button>
        <button class="big-btn" id="bj-hit" disabled>HIT</button>
        <button class="big-btn" id="bj-stand" disabled>STAND</button>
        <button class="big-btn" id="bj-double" disabled>DOUBLE</button>
      </div>
      <div class="result-line" id="bj-result"></div>
    `);
    m.querySelector('#mm-close').onclick = () => { SFX.click(); UI.closeModal(); };
    CASINO.wireBetPicker(m, 'bj');

    const S = { deck: [], p: [], d: [], bet: 0, live: false, done: false };
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

    const cardEl = (c, down) => {
      const red = ['♥', '♦'].includes(c.s);
      return `<div class="pcard ${red ? 'red' : ''} ${down ? 'facedown' : ''}">
        <span>${down ? '' : c.r}</span><span class="suit">${down ? '' : c.s}</span><span style="transform:rotate(180deg)">${down ? '' : c.r}</span></div>`;
    };

    const paint = (reveal) => {
      $('bj-player').innerHTML = S.p.map(c => cardEl(c)).join('');
      $('bj-dealer').innerHTML = S.d.map((c, i) =>
        cardEl(c, i === 1 && !reveal && !E.has('markedCards'))).join('');
      $('bj-ptotal').textContent = S.p.length ? val(S.p) : '';
      $('bj-dtotal').textContent = S.d.length
        ? (reveal || E.has('markedCards') ? val(S.d) : val([S.d[0]]) + ' + ?') : '';
    };

    const syncBtns = () => {
      $('bj-deal').innerHTML = G.casino.bjLeft > 0 ? `DEAL — bet ⛁${CASINO.getBet(m, 'bj')}` : 'THE PIT BOSS CUTS YOU OFF';
      $('bj-deal').disabled = S.live || G.casino.bjLeft <= 0 || G.chips < CASINO.getBet(m, 'bj');
      $('bj-hit').disabled = !S.live;
      $('bj-stand').disabled = !S.live;
      $('bj-double').disabled = !S.live || S.p.length !== 2 || G.chips < S.bet;
    };
    CASINO.wireBetPicker(m, 'bj', () => syncBtns());

    const draw = () => {
      if (!S.deck.length) {
        BJ_SUITS.forEach(s => BJ_RANKS.forEach(r => S.deck.push({ s, r })));
        U.shuffle(G.rng, S.deck);
      }
      return S.deck.pop();
    };

    const finish = async (msg, delta, shellWin) => {
      S.live = false;
      paint(true);
      if (delta > 0) { SFX.coin(); G.stats.bjWins++; }
      if (delta < 0) SFX.dud();
      G.chips += Math.max(0, delta + S.bet); // stake was escrowed at deal
      let extra = '';
      if (shellWin) {
        const pool = G.rng() < 0.7 ? 'common' : 'uncommon';
        const id = E.randomShellByRarity(pool);
        E.addShellById(id);
        extra = ` A ${SHELLS[id].icon} ${SHELLS[id].name} slides off the table into your pouch.`;
      }
      $('bj-result').innerHTML = `${msg}${delta > 0 ? ` <b>+${delta}⛁</b>` : delta < 0 ? ` <b style="color:var(--backfire)">−${-delta}⛁</b>` : ''}${U.esc(extra)}`;
      CASINO.syncChips();
      syncBtns();
    };

    const dealerPlay = async () => {
      S.live = false; syncBtns();
      paint(true);
      while (val(S.d) < 17) {
        await U.sleep(550);
        S.d.push(draw()); SFX.deal();
        paint(true);
      }
      const pv = val(S.p), dv = val(S.d);
      if (dv > 21) finish('Dealer busts.', S.bet, pv === 21);
      else if (pv > dv) finish(`${pv} beats ${dv}.`, S.bet, pv === 21);
      else if (pv < dv) finish(`Dealer's ${dv} takes it.`, -S.bet, false);
      else finish('Push. Your chips crawl back.', 0, false);
    };

    $('bj-deal').onclick = async () => {
      S.bet = CASINO.getBet(m, 'bj');
      if (G.chips < S.bet || G.casino.bjLeft <= 0) return;
      SFX.deal();
      G.chips -= S.bet;           // escrow the stake
      G.casino.bjLeft--;
      S.deck = []; S.p = []; S.d = []; S.live = true;
      $('bj-result').textContent = '';
      S.p.push(draw(), draw());
      S.d.push(draw(), draw());
      paint(false);
      CASINO.syncChips();
      syncBtns();
      const pv = val(S.p), dv = val(S.d);
      if (pv === 21 && dv === 21) return finish('Two blackjacks. The universe shrugs.', 0, false);
      if (pv === 21) return finish('BLACKJACK.', Math.ceil(S.bet * 1.5), true);
      if (dv === 21) return finish('Dealer blackjack. Of course.', -S.bet, false);
    };

    $('bj-hit').onclick = () => {
      if (!S.live) return;
      SFX.deal();
      S.p.push(draw());
      paint(false);
      if (val(S.p) > 21) finish(`Bust at ${val(S.p)}.`, -S.bet, false);
      else if (val(S.p) === 21) dealerPlay();
      else syncBtns();
    };
    $('bj-stand').onclick = () => { if (S.live) dealerPlay(); };
    $('bj-double').onclick = () => {
      if (!S.live || S.p.length !== 2 || G.chips < S.bet) return;
      SFX.deal();
      G.chips -= S.bet;
      S.bet *= 2;
      CASINO.syncChips();
      S.p.push(draw());
      paint(false);
      if (val(S.p) > 21) finish(`Doubled into a bust at ${val(S.p)}. Bold.`, -S.bet, false);
      else dealerPlay();
    };

    paint(false);
    syncBtns();
  },

  /* ================= ROULETTE ================= */

  // classic wheel order: greens opposite each other, red/black alternating
  fateWheel() {
    const all = Object.values(FATES);
    const R = all.filter(f => f.color === 'R');
    const B = all.filter(f => f.color === 'B');
    const Gs = all.filter(f => f.color === 'G');
    const order = [Gs[0], R[0], B[0], R[1], B[1], R[2], B[2], Gs[1], R[3], B[3], R[4], B[4]];
    return order.filter(Boolean);
  },

  openRoulette() {
    const fateList = CASINO.fateWheel();
    const segs = fateList.map((f, i) => {
      const col = f.color === 'R' ? '#7e1f2e' : f.color === 'B' ? '#14161c' : '#14523a';
      return `${col} ${i * 30}deg ${(i + 1) * 30}deg`;
    }).join(', ');

    const m = UI.modal(`
      <button class="m-close" id="mm-close">✕</button>
      <h2>🎡 WHEEL OF FATES</h2>
      <div class="m-sub">Wherever it lands rewrites the NEXT round — for everyone at the table.
        Side-bet on the color if you like: red/black pays 2×, green pays 7×.</div>
      ${CASINO.chipsBar()}
      <div class="roulette-zone">
        <div id="rwheel-box">
          <div class="r-pin">▼</div>
          <div id="rwheel" style="background:
            repeating-conic-gradient(transparent 0deg 28.6deg, rgba(212,175,55,.4) 28.6deg 30deg),
            conic-gradient(${segs})"></div>
        </div>
        <div id="r-side">
          <div class="bet-row"><span class="bet-lab">COLOR</span>
            <button class="bet-btn" data-col="R" style="color:#ff8a9a">RED</button>
            <button class="bet-btn" data-col="B">BLACK</button>
            <button class="bet-btn" data-col="G" style="color:#69e6b0">GREEN</button>
            <button class="bet-btn sel" data-col="none">NO BET</button>
          </div>
          ${CASINO.betPicker('rl', [5, 10, 25])}
          <button class="big-btn gold-btn" id="btn-spin-wheel"></button>
          <div class="result-line" id="r-result"></div>
        </div>
      </div>
      <div id="r-fate-zone"></div>
    `);
    m.querySelector('#mm-close').onclick = () => { SFX.click(); UI.closeModal(); };
    CASINO.wireBetPicker(m, 'rl');
    m.querySelectorAll('[data-col]').forEach(b => {
      b.onclick = () => {
        SFX.click();
        m.querySelectorAll('[data-col]').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
      };
    });

    const btn = m.querySelector('#btn-spin-wheel');
    const syncBtn = () => {
      btn.textContent = G.casino.rouletteLeft > 0 ? 'SPIN THE WHEEL' : 'THE WHEEL SLEEPS';
      btn.disabled = G.casino.rouletteLeft <= 0;
    };
    syncBtn();

    btn.onclick = async () => {
      if (G.casino.rouletteLeft <= 0) return;
      const colSel = m.querySelector('[data-col].sel').dataset.col;
      const bet = colSel === 'none' ? 0 : CASINO.getBet(m, 'rl');
      if (bet > G.chips) {
        m.querySelector('#r-result').textContent = 'Not enough chips for that side-bet.';
        return;
      }

      if (E.has('fateFinger')) {
        // Fate's Finger: choose among 3
        const opts = U.shuffle(G.rng, fateList.slice()).slice(0, 3);
        const zone = m.querySelector('#r-fate-zone');
        zone.innerHTML = `<div class="m-sub" style="margin-top:14px">🎡 Fate's Finger — pick where it lands:</div>
          <div class="fate-pick-row"></div>`;
        const row = zone.querySelector('.fate-pick-row');
        opts.forEach(f => {
          const c = U.el('div', 'fate-card',
            `<div class="f-name">${f.icon} ${f.name} <span style="font-size:11px">(${f.color === 'R' ? 'RED' : f.color === 'B' ? 'BLACK' : 'GREEN'} ${f.num})</span></div>
             <div class="f-desc">${f.desc}</div>`);
          c.onclick = () => { row.querySelectorAll('.fate-card').forEach(x => x.style.opacity = .4); CASINO.spinTo(m, f, bet, colSel); zone.innerHTML = ''; };
          row.appendChild(c);
        });
        return;
      }

      const fate = U.pick(G.rng, fateList);
      CASINO.spinTo(m, fate, bet, colSel);
    };
  },

  async spinTo(m, fate, bet, colSel) {
    const fateList = CASINO.fateWheel();
    const idx = fateList.indexOf(fate);
    G.casino.rouletteLeft = 0;
    if (bet) { G.chips -= bet; CASINO.syncChips(); }
    m.querySelector('#btn-spin-wheel').disabled = true;

    SFX.spin();
    const wheel = m.querySelector('#rwheel');
    // pointer at top: rotate so segment center lands under the pin
    const segCenter = idx * 30 + 15;
    const target = 360 * 4 + (360 - segCenter);
    wheel.style.transform = `rotate(${target}deg)`;
    for (let i = 0; i < 12; i++) setTimeout(() => SFX.tick(), i * 220);
    await U.sleep(3300);

    G.nextFate = fate.id;
    let winTxt = '';
    if (bet) {
      if (colSel === fate.color) {
        const pay = fate.color === 'G' ? bet * 7 : bet * 2;
        G.chips += pay;
        winTxt = ` Your color hits: <b>+${pay}⛁</b>.`;
        SFX.coin();
      } else {
        winTxt = ` Your side-bet of ${bet}⛁ vanishes.`;
      }
    }
    const colName = fate.color === 'R' ? 'RED' : fate.color === 'B' ? 'BLACK' : 'GREEN';
    m.querySelector('#r-result').innerHTML =
      `${colName} ${fate.num === 100 ? '00' : fate.num}.${winTxt}`;
    m.querySelector('#r-fate-zone').innerHTML = `
      <div style="display:flex;justify-content:center;margin-top:14px">
        <div class="fate-card">
          <div class="f-name">${fate.icon} ${fate.name}</div>
          <div class="f-desc">${fate.desc}</div>
          <div class="f-desc" style="color:var(--ink-dim)">Queued for the next table.</div>
        </div>
      </div>`;
    CASINO.syncChips();
  },

  /* ================= CHICKEN DERBY ================= */

  openDerby() {
    const m = UI.modal(`
      <button class="m-close" id="mm-close">✕</button>
      <h2>🐔 CHICKEN DERBY</h2>
      <div class="m-sub">Four athletes of questionable provenance. Pick your bird, name your stake.
        Longshots (5:1+) that win for you shed a Feather Shell.${E.has('whisperer') ? ' <span style="color:var(--purple)">The birds listen to you: wins pay double & always shed feathers.</span>' : ''}</div>
      ${CASINO.chipsBar()}
      ${CASINO.betPicker('derby', [5, 10, 25])}
      <div class="chicken-pick" id="chick-pick"></div>
      <div class="derby-track" id="derby-track"></div>
      <div class="bet-row">
        <button class="big-btn gold-btn" id="btn-race"></button>
        <div class="result-line" id="derby-result" style="margin:0"></div>
      </div>
    `);
    m.querySelector('#mm-close').onclick = () => { SFX.click(); UI.closeModal(); };
    CASINO.wireBetPicker(m, 'derby');

    const S = { field: [], pick: -1, running: false };

    const rollField = () => {
      const birds = U.shuffle(G.rng, CHICKENS.slice()).slice(0, 4);
      const odds = U.shuffle(G.rng, [2, 3, 5, 8]);
      S.field = birds.map((b, i) => ({ ...b, odds: odds[i], pos: 0 }));
      S.pick = -1;
      const pickBox = m.querySelector('#chick-pick');
      pickBox.innerHTML = '';
      S.field.forEach((c, i) => {
        const b = U.el('button', 'chick-btn',
          `<span style="font-size:24px">${c.icon}</span>
           <span>${c.name}<span class="ch-fl">${c.flavor}</span></span>
           <span class="ch-odds mono">${c.odds}:1</span>`);
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
      const track = m.querySelector('#derby-track');
      track.innerHTML = S.field.map((c, i) =>
        `<div class="lane"><span class="runner" id="run-${i}">${c.icon}</span><span class="finish">🏁</span></div>`).join('');
    };

    const btn = m.querySelector('#btn-race');
    const syncBtn = () => {
      const bet = CASINO.getBet(m, 'derby');
      if (G.casino.derbyLeft <= 0) { btn.textContent = 'THE BIRDS ARE ASLEEP'; btn.disabled = true; return; }
      btn.textContent = S.pick < 0 ? 'PICK A BIRD' : `RACE — ⛁${bet} on ${S.field[S.pick].name}`;
      btn.disabled = S.running || S.pick < 0 || G.chips < bet;
    };
    CASINO.wireBetPicker(m, 'derby', () => syncBtn());

    btn.onclick = async () => {
      if (S.running || S.pick < 0 || G.casino.derbyLeft <= 0) return;
      const bet = CASINO.getBet(m, 'derby');
      if (G.chips < bet) return;
      S.running = true;
      G.chips -= bet;
      G.casino.derbyLeft--;
      CASINO.syncChips();
      syncBtn();
      m.querySelector('#derby-result').textContent = '';

      // simulate: speed weight ∝ 1/odds
      const track = m.querySelector('#derby-track');
      const W = track.clientWidth - 60;
      S.field.forEach(c => c.pos = 0);
      let winner = -1;
      SFX.cluck();
      while (winner < 0) {
        await U.sleep(160);
        S.field.forEach((c, i) => {
          const pace = (1 / c.odds) * 2.2;
          c.pos += (G.rng() * 0.9 + 0.25) * pace * 26 + G.rng() * 7;
          const el = m.querySelector('#run-' + i);
          if (el) el.style.left = Math.min(c.pos, W) + 'px';
          if (c.pos >= W && winner < 0) winner = i;
        });
        if (Math.random() < 0.3) SFX.tick();
        if (!document.getElementById('derby-track')) return; // modal closed mid-race
      }
      await U.sleep(350);

      const wc = S.field[winner];
      let txt;
      if (winner === S.pick) {
        let pay = bet * wc.odds;
        if (E.has('whisperer')) pay *= 2;
        G.chips += pay + bet;
        G.stats.derbyWins++;
        SFX.win(); UI.particles('🐔', 10);
        txt = `${wc.icon} ${wc.name} takes it! <b>+${pay}⛁</b>`;
        if (wc.odds >= 5 || E.has('whisperer')) {
          E.addShellById('feather');
          txt += ' — and sheds a 🐔 Feather Shell!';
        }
      } else {
        SFX.dud();
        txt = `${wc.icon} ${wc.name} wins. Your bird ${S.field[S.pick].name} owes you an apology.`;
      }
      m.querySelector('#derby-result').innerHTML = txt;
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
      <button class="m-close" id="mm-close">✕</button>
      <h2>🏚️ PAWN SHOP</h2>
      <div class="m-sub">"Everything here belonged to somebody who didn't make it. Browse."${E.has('houseKey') ? ' <span style="color:var(--purple)">Your House Key opens the back room: −25%.</span>' : ''}</div>
      ${CASINO.chipsBar()}
      <h3 style="color:var(--ink-dim);letter-spacing:2px;font-size:12px;margin-top:8px">CHARMS — ${G.charms.length}/${MAX_CHARMS} SLOTS USED</h3>
      <div class="pawn-grid" id="pawn-charms"></div>
      <div class="bet-row" style="margin-top:6px">
        <button class="bet-btn" id="btn-reroll"></button>
      </div>
      <h3 style="color:var(--ink-dim);letter-spacing:2px;font-size:12px;margin-top:14px">SERVICES</h3>
      <div class="pawn-grid" id="pawn-services"></div>
      <div class="result-line" id="pawn-result"></div>
    `);
    m.querySelector('#mm-close').onclick = () => { SFX.click(); UI.closeModal(); };

    const out = m.querySelector('#pawn-result');

    const paintCharms = () => {
      const grid = m.querySelector('#pawn-charms');
      grid.innerHTML = '';
      G.casino.stock.forEach((id, slot) => {
        const w = U.el('div', 'ware' + (id ? '' : ' sold'));
        if (!id) { w.innerHTML = '<div class="w-desc">sold</div>'; grid.appendChild(w); return; }
        const c = CHARMS[id];
        const cost = E.price(c.price);
        w.innerHTML = `
          <div class="w-head"><span class="w-icon">${c.icon}</span> ${c.name}</div>
          <span class="rarity-${c.rarity}">${c.rarity.toUpperCase()}</span>
          <div class="w-desc">${c.desc}</div>
          <button class="w-buy">BUY — ⛁${cost}</button>`;
        const btn = w.querySelector('.w-buy');
        btn.disabled = G.chips < cost || G.charms.length >= MAX_CHARMS;
        if (G.charms.length >= MAX_CHARMS) btn.textContent = 'CHARM SLOTS FULL';
        btn.onclick = () => {
          if (G.chips < cost || G.charms.length >= MAX_CHARMS) return;
          G.chips -= cost;
          G.charms.push(id);
          if (id === 'ironNerve') { G.nerveMax += 2; G.nerve = Math.min(G.nerveMax, G.nerve + 2); }
          G.casino.stock[slot] = null;
          SFX.coin();
          out.innerHTML = `${c.icon} ${c.name} is yours. ${U.esc('It hums faintly.')}`;
          CASINO.syncChips();
          paintCharms();
          paintServices();
        };
        grid.appendChild(w);
      });
      const rr = m.querySelector('#btn-reroll');
      const rc = E.price(G.casino.rerollCost);
      rr.textContent = `♻️ NEW STOCK — ⛁${rc}`;
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
      { icon: '🗑️', name: 'Melt a Shell', price: 12,
        desc: 'Remove one shell from your pouch forever. Thin the herd, sharpen the odds.',
        can: () => G.bag.length > 3,
        run: (done) => CASINO.pickShell(m, 'Melt which shell?', (inst) => {
          G.bag = G.bag.filter(s => s.uid !== inst.uid);
          done(`The ${SHELLS[inst.id].name} melts into slag.`);
        }) },
      { icon: '🪞', name: 'Mirror a Shell', price: 22,
        desc: 'Duplicate one shell in your pouch. The copy doesn\'t know it\'s a copy.',
        can: () => true,
        run: (done) => CASINO.pickShell(m, 'Mirror which shell?', (inst) => {
          E.addShellById(inst.id);
          done(`A second ${SHELLS[inst.id].name} shivers into being.`);
        }) },
      { icon: '🫙', name: 'Mystery Jar', price: 28,
        desc: 'A jar with something rare inside. No refunds, no questions.',
        can: () => true,
        run: (done) => {
          const id = E.randomShellByRarity(G.rng() < 0.8 ? 'rare' : 'legendary');
          E.addShellById(id);
          done(`Inside: ${SHELLS[id].icon} ${SHELLS[id].name}.`);
        } },
      { icon: '🪡', name: 'Stitch Your Nerve', price: 25,
        desc: 'Back-room medicine. Restore 1 Nerve.',
        can: () => G.nerve < G.nerveMax,
        run: (done) => { G.nerve++; done('The needle work is ugly but it holds. +1 Nerve.'); } },
    ];

    const paintServices = () => {
      const grid = m.querySelector('#pawn-services');
      grid.innerHTML = '';
      services.forEach(sv => {
        const cost = E.price(sv.price);
        const w = U.el('div', 'ware');
        w.innerHTML = `
          <div class="w-head"><span class="w-icon">${sv.icon}</span> ${sv.name}</div>
          <div class="w-desc">${sv.desc}</div>
          <button class="w-buy">⛁${cost}</button>`;
        const btn = w.querySelector('.w-buy');
        btn.disabled = G.chips < cost || !sv.can();
        btn.onclick = () => {
          if (G.chips < cost || !sv.can()) return;
          sv.run((msg) => {
            G.chips -= cost;
            SFX.coin();
            out.textContent = msg;
            CASINO.syncChips();
            paintCharms();
            paintServices();
          });
        };
        grid.appendChild(w);
      });
    };

    paintCharms();
    paintServices();
  },

  // small inline shell picker used by pawn services
  pickShell(m, label, onPick) {
    const out = m.querySelector('#pawn-result');
    out.innerHTML = `${U.esc(label)}<br><div class="chip-strip" id="pick-strip" style="margin-top:8px"></div>`;
    const strip = out.querySelector('#pick-strip');
    G.bag.forEach(inst => {
      const s = SHELLS[inst.id];
      const c = U.el('button', 'shell-chip selectable has-tip', s.icon);
      c.dataset.tipShell = inst.id;
      c.onclick = () => onPick(inst);
      strip.appendChild(c);
    });
  },
};
