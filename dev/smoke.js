'use strict';
/* ============================================================
   Headless browser smoke test for SHELL & DEBT.

   Drives the whole case the way a player does: out of the murder
   board, through the reload and the drive, around the bullpen on
   foot, up to the captain, out to the lead, along the line-up,
   through the back door, across the table, out back with the
   body, and home again — then the ward, and both endings.

   Fails on any console error or page error.

     node dev/smoke.js [path-to-chromium]

   Screenshots land in dev/shots/.
   ============================================================ */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const GAME = 'file://' + path.join(__dirname, '..', 'index.html') + '?debug';
const SHOTS = path.join(__dirname, 'shots');
const EXE = process.argv[2] || process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const errors = [];
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message + '\n      ' +
    String(e.stack || '').split('\n').slice(1, 4).join('\n      ')));

  let shots = 0;
  const shot = async (name) => {
    await page.screenshot({ path: path.join(SHOTS, name + '.png') });
    shots++;
    console.log('shot:', name);
  };
  const click = (sel) => page.locator(sel).first().click({ timeout: 6000 });
  const state = () => page.evaluate(() => ({
    phase: G2().phase, chapter: G2().chapter, briefed: G2().briefed,
    cards: (G2().intelCards || []).length, hearts: G2().hearts, chips: G2().chips,
    ward: G2().wardTrips || 0, badge: !G2().badgePulled,
    turn: G2().duel ? G2().duel.turn : null,
    over: G2().duel ? G2().duel.over : null,
    busy: typeof DUEL !== 'undefined' ? DUEL.busy : false,
  }));

  /* ---------- the drawn plates people talk in ----------
     A plate waits for a tap and the next line can arrive a beat later, so
     "cleared" means gone and still gone. Click the plate itself, not a
     fixed point, or the click lands on the room behind it. */
  const clearPlates = async (tries) => {
    let quiet = 0;
    for (let i = 0; i < (tries || 26) && quiet < 3; i++) {
      const plate = page.locator('#tutor-root:not(.hidden)');
      if (await plate.count() === 0) { quiet++; await page.waitForTimeout(130); continue; }
      quiet = 0;
      const box = await plate.first().boundingBox().catch(() => null);
      if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height - 20);
      else await page.mouse.click(720, 620);
      await page.waitForTimeout(210);
    }
    return await page.locator('#tutor-root:not(.hidden)').count() === 0;
  };
  /* ---------- the drawn picker ---------- */
  const pickCard = async (n) => {
    await page.waitForSelector('.pick-card', { timeout: 8000 });
    await page.waitForTimeout(260);              // let the spread settle
    const cards = page.locator('.pick-card');
    const count = await cards.count();
    await cards.nth(Math.min(n, count - 1)).click({ timeout: 5000 });
    await page.waitForTimeout(320);
  };
  const pickerUp = () => page.locator('.pick-card').count();

  /* the cinematics play over the room behind them; wait them out before
     taking a picture of the room */
  const settle = async (ms) => {
    await page.waitForFunction(
      () => !CINE.busy && !document.querySelector('#cine-stage.anim-cut') &&
            !document.querySelector('#cine-stage.ante-cut'),
      null, { timeout: ms || 30000 }).catch(() => {});
    await page.waitForTimeout(400);
  };

  /* ---------- walking around a room ---------- */
  const walkTo = async (x) => {
    await page.evaluate((wx) => SCENE.walkTo(wx), x);
    await page.waitForFunction((wx) => Math.abs(SCENE.me.x - wx) < 4, x, { timeout: 12000 }).catch(() => {});
    await page.waitForTimeout(120);
  };
  /* ---------- the table ---------- */
  const breakShot = async (verdict) => {
    const got = await page.waitForFunction(
      () => !!DUEL.aimBar && !DUEL.aimBar.done, null, { timeout: 8000 }).catch(() => null);
    if (!got) return false;
    await page.evaluate((v) => {
      const b = DUEL.aimBar;
      b.sp = 0; b.dir = 0;
      b.x = b.centre * b.w + (v === 'wide' ? b.good + 8 : v === 'good' ? b.clean + 2 : 0);
    }, verdict || 'clean');
    await page.waitForTimeout(50);
    await page.mouse.click(6, 6);
    await page.waitForTimeout(520);
    return true;
  };

  /* play the duel out to a win, breaking every shot clean */
  const winDuel = async (label) => {
    let waits = 0;
    for (let i = 0; i < 40; i++) {
      const s = await state();
      if (s.phase !== 'duel' || s.over) break;
      /* a lieutenant's card waits for a tap before the table is live */
      if (await page.locator('#duel-overlay.boss-in').count() > 0) {
        await page.mouse.click(720, 620);
        await page.waitForTimeout(400);
        continue;
      }
      if (s.busy || s.turn !== 'you') {
        if (++waits % 8 === 0) console.log('  waiting on the table: ' + JSON.stringify(s));
        if (waits > 40) { errors.push('[flow] the table never came back to you: ' + JSON.stringify(s)); break; }
        await page.waitForTimeout(650);
        continue;
      }
      await page.evaluate(() => {
        const d = G2().duel;
        d.shells[d.ptr] = true; d.known[d.ptr] = true;   // deterministic: a live round
        DUEL.setAim('foe'); DUEL.onFire();
      });
      await breakShot('clean');
      if (label && i === 0) await shot(label);
      await page.waitForTimeout(700);
    }
    /* the back room, unless the run already carried us somewhere else */
    const gotLoot = await page.waitForFunction(
      () => (G2().phase === 'loot' && LOOT.ready) || G2().phase === 'ending',
      null, { timeout: 45000 }).catch(() => null);
    if (!gotLoot) {
      const s = await state();
      if (s.phase === 'duel') errors.push('[flow] the table never resolved: ' + JSON.stringify(s));
      else console.log('  (no back room this time: ' + s.phase + ')');
    }
    await page.waitForTimeout(500);
  };

  /* go through his coat, mop the floor, walk out */
  const doLoot = async (label) => {
    if ((await state()).phase !== 'loot') { console.log('  (nothing to loot)'); return; }
    if (label) await shot(label);
    for (let i = 0; i < 9; i++) {
      const ok = await page.evaluate((k) => {
        if (!E.canSearch(k)) return false;
        E.rifle(k); if (LOOT.sync) LOOT.sync();
        return true;
      }, i);
      if (ok) await page.waitForTimeout(180);
    }
    /* the mop, on whatever he left on the boards */
    for (let i = 0; i < 10; i++) {
      const ok = await page.evaluate((k) => {
        if (!E.canMop(k)) return false;
        E.mop(k); if (LOOT.sync) LOOT.sync();
        return true;
      }, i);
      if (ok && i === 0 && label) await shot(label + '-mop');
      if (!ok) break;
      await page.waitForTimeout(140);
    }
    await clearPlates(8);
    const bribe = page.locator('#btn-bribe:not([disabled])');
    if (await bribe.count() > 0) {
      await bribe.click({ timeout: 4000 }).catch(() => {});   // optional, never fatal
      await page.waitForTimeout(900);
    }
    await page.evaluate(() => LOOT.onWalk());
    /* the heat overlay after a lieutenant, if it is due */
    const heat = await page.waitForSelector('#btn-heat', { timeout: 6000 }).catch(() => null);
    if (heat) {
      if (label) await shot(label + '-heat');
      await click('#btn-heat');
    }
    /* out of the back room: the bullpen, or the end of the story */
    await page.waitForFunction(() => G2().phase !== 'loot', null, { timeout: 45000 })
      .catch(() => errors.push('[flow] never got out of the back room'));
    await page.waitForTimeout(700);
  };

  try {
    /* ================= 1. the murder board ================= */
    await page.goto(GAME);
    await page.waitForTimeout(700);
    await shot('01-title');
    await page.evaluate(() => { const i = document.getElementById('seed-input'); if (i) i.value = 'SMOKE'; });
    await click('#btn-deal');

    /* the lore reel, then the reload room, then the drive */
    await page.waitForTimeout(1400);
    await shot('02-lore');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    if (await page.locator('#cine-stage.anim-cut').count() > 0) await shot('03-reload');
    await page.waitForTimeout(2600);
    if (await page.locator('#cine-stage.anim-cut').count() > 0) await shot('04-drive');

    /* ================= 2. the bullpen ================= */
    await page.waitForFunction(() => G2().phase === 'precinct' && !!document.querySelector('.scene-cv'),
      null, { timeout: 40000 });
    await settle();
    await clearPlates();
    await page.waitForTimeout(600);
    await shot('05-precinct');

    /* tap-to-move: the canvas is the whole control surface. The captain's
       opening lines can land between clearing and tapping, so give it a few
       goes before calling it broken. */
    let walked = 0, beforeX = 0, afterX = 0;
    for (let attempt = 0; attempt < 4 && !walked; attempt++) {
      await clearPlates();
      beforeX = await page.evaluate(() => SCENE.me.x);
      const box = await page.locator('.scene-cv').boundingBox();
      await page.mouse.click(box.x + box.width * (attempt % 2 ? 0.3 : 0.62),
        box.y + box.height * 0.86);
      await page.waitForTimeout(1700);
      afterX = await page.evaluate(() => SCENE.me.x);
      if (Math.abs(afterX - beforeX) > 6) walked = 1;
    }
    console.log('walk: ' + Math.round(beforeX) + ' -> ' + Math.round(afterX));
    if (!walked) errors.push('[input] tapping the floor did not move the detective');
    await shot('06-walking');

    /* the front desk */
    await page.evaluate(() => { STORY.talkMaybelle(); });
    await page.waitForTimeout(500);
    await shot('07-maybelle');
    await clearPlates();

    /* the captain, and the brief */
    await page.evaluate(() => { STORY.talkCaptain(); });
    await page.waitForTimeout(500);
    await shot('08-captain');
    await clearPlates(18);
    const briefed = await state();
    if (!briefed.briefed) errors.push('[flow] the captain never handed over a lead');

    /* the locker and the cooler, because they are in the room */
    await page.evaluate(() => { STORY.openLocker(); });
    await page.waitForTimeout(400);
    await clearPlates();
    await page.evaluate(() => { STORY.drink(); });
    await page.waitForTimeout(400);
    await clearPlates();

    /* ================= 3. the board ================= */
    await page.evaluate(() => { STORY.openBoard(); });
    await page.waitForFunction(() => G2().phase === 'board' && !!document.querySelector('.scene-cv'),
      null, { timeout: 20000 });
    await settle();
    await shot('09-board');
    await page.evaluate(() => { STORY.readLog(); });
    await page.waitForTimeout(400);
    await clearPlates();
    await page.evaluate(() => { STORY.tryFinale(); });       // not yet: it should refuse
    await page.waitForTimeout(500);
    await clearPlates();
    if ((await state()).phase !== 'board') errors.push('[flow] the finale opened without a full board');
    await page.evaluate(() => { STORY.toPrecinct(); });
    await page.waitForFunction(() => G2().phase === 'precinct', null, { timeout: 20000 });
    await page.waitForTimeout(600);

    /* ================= 4. out to the lead ================= */
    await page.evaluate(() => { STORY.goOut(); });
    await page.waitForFunction(() => G2().phase === 'blind' && !!document.querySelector('.scene-cv'),
      null, { timeout: 40000 });
    await settle();
    await shot('10-lead');

    /* the file on the bar */
    await page.evaluate(() => { STORY.readEvidence(); });
    if (await pickerUp()) { await shot('11-evidence'); await pickCard(0); await clearPlates(); }
    /* a question for the barman */
    await page.evaluate(() => { STORY.askRoom(); });
    if (await pickerUp()) { await shot('12-ask'); await pickCard(0); await clearPlates(); }
    await page.waitForTimeout(400);
    await shot('13-line-thinned');

    /* walk the line and name the one the file points at */
    const realIdx = await page.evaluate(() => G2().case.suspects.findIndex(s => s.real));
    await walkTo(await page.evaluate((i) => {
      const a = SCENE.def.actors.find(x => x.id === 'sus' + i);
      return a ? a.x - 16 : 200;
    }, realIdx));
    await page.evaluate((i) => { STORY.lookAt(i); }, realIdx);
    if (await pickerUp()) { await shot('14-look'); await pickCard(0); }
    await clearPlates();
    await page.waitForTimeout(500);
    await shot('15-named');

    /* ================= 5. the table ================= */
    await page.evaluate(() => { STORY.sitDown(); });
    if (await pickerUp()) await pickCard(0);
    await page.waitForFunction(() => G2().phase === 'duel', null, { timeout: 25000 });
    await page.waitForTimeout(1800);
    await shot('16-sitdown');
    await page.waitForFunction(() => !DUEL.busy || G2().duel.over, null, { timeout: 30000 });
    await shot('17-duel');
    await winDuel('18-steady');

    /* ================= 6. out back ================= */
    await doLoot('19-loot');
    const home = await state();
    console.log('after the first lead:', JSON.stringify(home));
    await shot('20-home');
    if (home.phase !== 'precinct' && home.phase !== 'blind') {
      errors.push('[flow] the body did not lead home, got ' + home.phase);
    }

    /* ================= 7. the ward ================= */
    await page.evaluate(() => { STORY.rushToWard(); });
    await page.waitForTimeout(1800);
    await shot('21-ambulance');
    await page.waitForFunction(() => G2().phase === 'ward' && !!document.querySelector('.scene-cv'),
      null, { timeout: 30000 });
    await settle();
    await shot('22-ward');
    await page.evaluate(() => { STORY.wardTalk(); });
    await page.waitForTimeout(400);
    await clearPlates();
    await page.evaluate(() => { STORY.readChart(); });
    await page.waitForTimeout(300);
    await clearPlates();
    await page.evaluate(() => { STORY.leaveWard(); });
    await clearPlates();
    await page.waitForFunction(() => G2().phase === 'precinct' || G2().phase === 'blind',
      null, { timeout: 40000 });
    await page.waitForTimeout(600);
    const woke = await state();
    if (woke.ward !== 1) errors.push('[flow] the ward trip was not recorded');
    console.log('after the ward:', JSON.stringify(woke));

    /* ================= 8. up to the lieutenant ================= */
    /* Work leads the way the game hands them out until the one who runs the
       room turns up — he is the frog carrying a piece of the board. */
    let pinned = 0;
    for (let lead = 0; lead < 3 && !pinned; lead++) {
      await page.evaluate(() => { G2().briefed = G2().chapter; });
      const ph = (await state()).phase;
      if (ph === 'precinct') {
        await page.evaluate(() => { STORY.goOut(); });
        await page.waitForFunction(() => G2().phase === 'blind', null, { timeout: 40000 });
        await settle();
      }
      const isBoss = await page.evaluate(() => G2().blind === 2);
      if (isBoss) await shot('23-lieutenant');
      await page.evaluate(() => { STORY.sitDown(); });
      if (await pickerUp()) await pickCard(0);
      await page.waitForFunction(() => G2().phase === 'duel', null, { timeout: 25000 });
      await page.waitForTimeout(1500);
      if (isBoss) await shot('24-boss-duel');
      await winDuel();
      await doLoot(isBoss ? '25-boss-loot' : null);
      pinned = (await state()).cards;
      console.log('  lead ' + (lead + 1) + (isBoss ? ' (the lieutenant)' : '') +
        ' done, pieces pinned: ' + pinned);
    }
    const after = await state();
    console.log('after working the chapter:', JSON.stringify(after));
    if (!after.cards) errors.push('[flow] three leads and nothing went on the board');

    /* ================= 9. mobile ================= */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(700);
    await shot('26-mobile-precinct');
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(700);
    await shot('27-mobile-landscape');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);

    /* ================= 10. both endings ================= */
    await page.evaluate(() => {
      G2().intelCards = ['face', 'ledger', 'route', 'name', 'addr'];
      G2().badgePulled = false;
    });
    await settle();
    await page.evaluate(() => { STORY.endgame(); });
    await page.waitForSelector('.pick-card', { timeout: 10000 });
    await page.waitForTimeout(500);
    await shot('28-choice');
    await pickCard(0);                              // the badge
    await page.waitForTimeout(2400);
    await shot('29-court');
    await page.waitForTimeout(2600);
    await shot('30-graves');
    await page.waitForTimeout(3000);
    await page.mouse.click(720, 500);
    await page.waitForFunction(() => G2().phase === 'ending', null, { timeout: 30000 });
    await page.waitForTimeout(600);
    await shot('31-ending');
    const end = await page.evaluate(() => G2().ending);
    if (end !== 'good') errors.push('[flow] the badge did not produce the good ending, got ' + end);

    /* and the other one */
    await page.evaluate(() => { G2().ending = null; CINE.ending('bad'); });
    await page.waitForTimeout(1100);
    await shot('32-bad-room');
    await page.waitForTimeout(2400);
    await shot('33-bad-chair');
    await page.waitForTimeout(2600);
    await page.mouse.click(720, 500);
    await page.waitForTimeout(600);

    const fin = await state();
    console.log('final state:', JSON.stringify(fin));
    console.log('systems:', JSON.stringify(await page.evaluate(() => ({
      scene: typeof SCENE !== 'undefined', story: typeof STORY !== 'undefined',
      art: typeof ART !== 'undefined', rooms: typeof ROOMS !== 'undefined',
      items: Object.keys(ITEMS).length, costumes: Object.keys(COSTUMES || {}).length,
      chapters: CHAPTERS.length, pieces: INTEL_CARDS.length,
      trinketsGone: typeof TRINKETS === 'undefined',
    }))));
  } catch (e) {
    errors.push('[threw] ' + e.message);
    await shot('99-failure');
  }

  await browser.close();
  console.log('');
  if (errors.length) {
    console.log('SMOKE TEST FAILED —', errors.length, 'problem(s):');
    errors.forEach(e => console.log('  ' + e));
    process.exit(1);
  }
  console.log('SMOKE TEST PASSED — no console/page errors, ' + shots + ' shots.');
})();
