'use strict';
/* ============================================================
   Headless browser smoke test for SHELL & DEBT (duel era).
   Drives a real run: title → collection → small blind duel →
   big blind → boss intro → shop (buy, reroll) → ante 2.
   Fails on any console error or page error.

     npm i playwright-core   (or use an existing install)
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
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));

  const shot = async (name) => {
    await page.screenshot({ path: path.join(SHOTS, name + '.png') });
    console.log('shot:', name);
  };
  const click = (sel) => page.locator(sel).first().click({ timeout: 6000 });
  /* the aim rail is gone — you click the scene at world coordinates */
  const world = (wx, wy) => page.evaluate(([x, y]) => {
    const r = DUEL.cv.getBoundingClientRect();
    return { x: r.left + (x + DUEL.OX) / DUEL.W * r.width,
             y: r.top + (y + DUEL.OY) / DUEL.H * r.height };
  }, [wx, wy]);
  const tapWorld = async (wx, wy) => {
    const p2 = await world(wx, wy);
    await page.mouse.click(p2.x, p2.y);
  };
  const aimFoe = () => page.evaluate(() => DUEL.setAim('foe'));
  /* Every shot across the table now runs the steady check. Park the marker
     where we want it and break the shot, so the test is deterministic. */
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
  const aimSelf = () => page.evaluate(() => DUEL.setAim('self'));
  /* every screen change goes behind the card-rack wipe — let it finish */
  const wiped = () => page.waitForFunction(
    () => typeof CINE === 'undefined' || !CINE.busy, null, { timeout: 15000 });
  const state = () => page.evaluate(() => ({
    phase: G2().phase, ante: G2().ante, blind: G2().blind,
    turn: G2().duel ? G2().duel.turn : null,
    over: G2().duel ? G2().duel.over : null,
    busy: DUEL.busy, chips: G2().chips, hearts: G2().hearts,
  }));
  const settle = () => page.waitForFunction(
    () => !DUEL.busy || G2().phase !== 'duel' ||
      document.querySelector('#duel-overlay:not(.hidden) .primary'),
    null, { timeout: 25000 });

  /* win the current duel deterministically via the ?debug rig */
  let sawBlood = false;
  async function winDuel() {
    for (let i = 0; i < 12; i++) {
      const s = await state();
      if (s.phase !== 'duel' || s.over) break;
      if (!s.busy && s.turn === 'you') {
        await page.locator('button', { hasText: 'kill foe' }).click();
        await aimFoe();
        /* fire and DO NOT await the sequence — evaluate() would not resolve
           until the whole kill cinematic had already played out */
        await page.evaluate(() => { DUEL.onFire(); });
        await breakShot('clean');
        /* the kill does not cut — it lands on the glass in front of you */
        if (!sawBlood) {
          for (let t = 0; t < 20; t++) {
            if (await page.locator('#cine-root.blood').count() > 0) {
              await page.waitForTimeout(340);
              await shot('04c-blood-wipe');
              sawBlood = true;
              break;
            }
            await page.waitForTimeout(70);
          }
        }
      }
      await settle();
      await page.waitForTimeout(250);
    }
    /* the kill does not cut: it lands on the glass in front of you */
    await page.waitForFunction(
      () => document.querySelector('#cine-root.blood') || DUEL.room === 'back',
      null, { timeout: 25000 }).catch(() => {});
    if (await page.locator('#cine-root.blood').count() > 0) {
      await page.waitForTimeout(360);
      await shot('04c-blood-wipe');
    }
    await page.waitForFunction(() => DUEL.room === 'back', null, { timeout: 25000 });
    await page.waitForFunction(() => typeof CINE === 'undefined' || !CINE.busy, null, { timeout: 15000 });
    await page.waitForSelector('#loot-panel', { timeout: 25000 });
    await page.waitForTimeout(300);
  }

  /* rifle pockets until the badges arrive, bribe once, then walk out */
  async function lootAndGo(shotName) {
    /* the pockets are places on the corpse now: the panel rows are the
       fallback, and each one plays the reach-and-dig before it pays out */
    for (let i = 0; i < 6; i++) {
      await page.waitForFunction(() => !DUEL.busy, null, { timeout: 20000 });
      const btn = page.locator('.pocket-btn:not(.taken):not(:disabled)');
      if (await btn.count() === 0) break;
      await btn.first().click();
      await page.waitForFunction(() => !DUEL.busy, null, { timeout: 20000 });
      await page.waitForTimeout(150);
      /* full rack / full belt? leave the find */
      const skip = page.locator('#card-swap button.pixbtn');
      if (await skip.count() > 0) { await skip.last().click(); await page.waitForTimeout(200); }
    }
    /* the badges should be at the door now — catch the cop and pay him off */
    const cop = await page.evaluate(() => !!(window.COPS && COPS.active));
    if (cop && shotName) await shot(shotName + '-cop');
    const bribe = page.locator('#btn-bribe:not([disabled])');
    if (await bribe.count() > 0) {
      await bribe.click();
      await page.waitForTimeout(900);
      if (shotName) await shot(shotName + '-bribed');
    }
    /* mop the trail he left coming through the door */
    for (let i = 0; i < 8; i++) {
      const st = await page.evaluate(() => {
        const L = G2().loot;
        if (!L || !L.stains) return null;
        const i = L.stains.findIndex(s => !s.done);
        if (i < 0) return null;
        const p = DUEL.stainPos(L.stains[i]);
        const r = DUEL.cv.getBoundingClientRect();
        return { x: r.left + (p[0] + DUEL.OX) / DUEL.W * r.width,
                 y: r.top + (p[1] + DUEL.OY) / DUEL.H * r.height };
      });
      if (!st) break;
      await page.mouse.move(st.x, st.y);
      await page.waitForTimeout(80);
      if (i === 0 && shotName) await shot(shotName + '-mop');
      await page.mouse.click(st.x, st.y);
      await page.waitForFunction(() => !DUEL.busy, null, { timeout: 20000 });
      await page.waitForTimeout(80);
    }
    if (shotName) await shot(shotName);
    await click('#btn-walk');
    /* walking out plays the trail verdict before anything else happens */
    await page.waitForFunction(
      () => document.querySelector('#btn-heat') || document.querySelector('#btn-sit'),
      null, { timeout: 20000 });
    await page.waitForTimeout(250);
    const heat = page.locator('#btn-heat');
    if (await heat.count() > 0) {
      await shot(shotName ? shotName + '-heat' : 'heat');
      await heat.click();
      /* the cop pockets it (slow — he salutes and walks out), then the
         ante-clear interstitial comes up */
      await page.waitForSelector('.ante-card.in', { timeout: 20000 });
      await page.waitForTimeout(500);
      await shot(shotName ? shotName + '-ante-clear' : 'ante-clear');
      await wiped();
      await page.waitForTimeout(400);
    }
    await wiped();
  }

  try {
    await page.goto(GAME);
    await page.waitForTimeout(700);
    await shot('01-title');

    /* collection round-trip */
    await click('#btn-collection');
    await wiped();
    await page.waitForTimeout(300);
    await shot('02-collection');
    await click('#btn-back');
    await wiped();
    await page.waitForTimeout(200);

    /* deal in */
    await page.fill('#seed-input', 'SMOKE-7');
    await click('#btn-deal');
    await page.waitForSelector('#btn-sit', { timeout: 10000 });
    await wiped();
    /* the lore reel plays over the board on a fresh run */
    await page.waitForTimeout(900);
    await shot('01b-lore-1');
    await page.waitForTimeout(2400);
    await shot('01b-lore-2');
    await page.keyboard.press('Escape');            // any key gets you out of it
    await page.waitForFunction(
      () => !document.querySelector('#cine-stage.lore-cut'), null, { timeout: 20000 });
    await page.waitForTimeout(400);

    /* the handler: he says his piece once, and a click gets rid of each line */
    await page.waitForFunction(
      () => document.querySelector('#tutor-root:not(.hidden)'), null, { timeout: 15000 })
      .catch(() => {});
    if (await page.locator('#tutor-root:not(.hidden)').count() > 0) {
      await shot('01c-handler');
      for (let i = 0; i < 8; i++) {
        if (await page.locator('#tutor-root:not(.hidden)').count() === 0) break;
        await page.locator('#tutor-root').click({ position: { x: 30, y: 30 } });
        await page.waitForTimeout(320);
      }
    }
    /* and once on the board, in the middle of the thing he is talking about */
    await page.waitForTimeout(500);
    if (await page.locator('#tutor-root:not(.hidden)').count() > 0) {
      await shot('01d-handler-board');
    }
    await page.evaluate(() => TUTOR.skipAll());
    await page.waitForTimeout(200);
    await shot('02b-blind-select');
    /* the board: turn a clue over, watch the string reach a poster, name him */
    const ev1 = page.locator('.ev.live').first();
    if (await ev1.count() > 0) { await ev1.click(); await page.waitForTimeout(400); }
    await shot('02b2-board-clue');
    /* ask the room something, and watch faces come off the wall */
    const q1 = page.locator('.pixbtn.ask:not([disabled])').first();
    if (await q1.count() > 0) {
      await q1.click();
      await page.waitForTimeout(700);
      await shot('02b2b-asked');
      await page.waitForTimeout(1100);
    }
    /* spend the file down, then pay somebody to turn one more over */
    for (let i = 0; i < 5; i++) {
      const e = page.locator('.ev.live').first();
      if (await e.count() === 0) break;
      await e.click();
      await page.waitForTimeout(200);
    }
    for (let i = 0; i < 5; i++) {
      const q = page.locator('.pixbtn.ask:not([disabled])').first();
      if (await q.count() === 0) break;
      await q.click();
      await page.waitForTimeout(260);
    }
    for (let i = 0; i < 3; i++) {
      await page.locator('button', { hasText: '+20⛁' }).click();
      await page.waitForTimeout(80);
    }
    const grease = page.locator('#btn-grease:not([disabled])');
    if (await grease.count() > 0) { await grease.click(); await page.waitForTimeout(300); }
    await shot('02b3-greased');
    const pos = page.locator('.poster.live').first();
    if (await pos.count() > 0) { await pos.click(); await page.waitForTimeout(800); }
    await shot('02b4-board-called');
    /* the run panel */
    await click('#btn-run');
    await page.waitForTimeout(350);
    await shot('02c-run-panel');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await click('#btn-sit');
    await wiped();
    await page.waitForTimeout(900);
    await shot('03-cine-sitdown');
    await page.waitForFunction(() => !DUEL.busy, null, { timeout: 25000 });
    await shot('03-duel-small');

    /* the two aim poses — driven the way a player does it, by clicking */
    await tapWorld(180, 52);
    await page.waitForTimeout(300);
    await shot('03d-reticle');
    await tapWorld(180, 190);
    await page.waitForTimeout(750);
    await shot('03b-aim-self');
    await aimFoe();
    await page.waitForTimeout(450);
    await shot('03c-aim-foe');

    /* two honest pulls at the mark, then the debug finisher. He says his
       piece the moment the iron is in his hand, so catch that too. */
    let sawTalk = false;
    for (let p = 0; p < 3; p++) {
      const s = await state();
      if (s.phase !== 'duel' || s.over || s.busy || s.turn !== 'you') break;
      await aimFoe();
      await page.evaluate(() => { DUEL.onFire(); });
      if (p === 0) {
        /* the steady check, mid-sweep */
        await page.waitForFunction(() => !!DUEL.aimBar, null, { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(120);
        await shot('03e-steady');
      }
      await breakShot(p === 0 ? 'good' : 'clean');
      if (!sawTalk) {
        for (let t = 0; t < 40; t++) {
          if (await page.locator('#tutor-root.pass').count() > 0) {
            await page.waitForTimeout(180);
            await shot('04d-mark-talks');
            sawTalk = true;
            break;
          }
          await page.waitForTimeout(90);
        }
      }
      await settle();
      await page.waitForTimeout(300);
    }
    /* the belt: use whatever we're carrying */
    const belt = page.locator('#item-belt .ibelt-slot:not(.empty):not([disabled])');
    if (await belt.count() > 0) {
      await shot('04b-belt');
      await belt.first().click();
      await page.waitForTimeout(600);
    }
    await shot('04-duel-mid');
    await winDuel();
    await shot('05-loot');
    /* give ourselves bribe money and test one bribe if the badges are up */
    await page.locator('button', { hasText: '+20⛁' }).click();
    /* the corpse itself is clickable: take one pocket by tapping HIM */
    const spot = await page.evaluate(() => {
      const i = G2().loot.pockets.findIndex((p, n) => E.canSearch(n));
      if (i < 0) return null;
      const s = DUEL.spotPos(G2().loot.pockets[i]);
      const r = DUEL.cv.getBoundingClientRect();
      return { x: r.left + (s[0] + DUEL.OX) / DUEL.W * r.width,
               y: r.top + (s[1] + DUEL.OY) / DUEL.H * r.height };
    });
    if (spot) {
      await page.mouse.move(spot.x, spot.y);
      await page.waitForTimeout(120);
      await shot('05b-search-spot');
      await page.mouse.click(spot.x, spot.y);
      await page.waitForTimeout(600);
      await shot('05c-searching');
      await page.waitForFunction(() => !DUEL.busy, null, { timeout: 20000 });
    }
    await lootAndGo('06-loot-done');

    /* mobile layout check (on the blind select, then in the duel) */
    await page.waitForSelector('#btn-sit', { timeout: 25000 });
    await page.setViewportSize({ width: 430, height: 860 });
    await page.waitForTimeout(600);
    await shot('07-mobile');
    await page.setViewportSize({ width: 860, height: 430 });
    await page.waitForTimeout(600);
    await shot('07b-landscape');
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(600);
    await shot('07c-small');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(400);

    /* big blind — sit down, then finish it */
    await click('#btn-sit');
    await wiped();
    await page.waitForFunction(() => !DUEL.busy, null, { timeout: 25000 });
    await shot('07d-duel-mobile-check');
    await winDuel();
    await lootAndGo(null);

    /* boss blind — the select screen names him, then the intro card */
    await page.waitForSelector('#btn-sit', { timeout: 20000 });
    await shot('08a-boss-select');
    await click('#btn-sit');
    await wiped();
    await page.waitForTimeout(1100);
    await shot('08-cine-boss-cut');
    await page.waitForSelector('#duel-overlay:not(.hidden) .primary', { timeout: 25000 });
    await shot('08-boss-intro');
    await click('#duel-overlay .primary');           // SIT DOWN
    await page.waitForFunction(() => !DUEL.busy, null, { timeout: 30000 });
    await shot('09-boss-duel');
    await winDuel();
    await page.locator('button', { hasText: '+20⛁' }).click();
    await lootAndGo('10-boss-loot');
    await page.waitForSelector('#btn-sit', { timeout: 25000 });
    await shot('11-ante2');

    const fin = await state();
    console.log('final state:', JSON.stringify(fin));
    const sys = await page.evaluate(() => ({
      fx: typeof FX !== 'undefined' && typeof FX.bloodBurst === 'function',
      cops: typeof COPS !== 'undefined' && typeof COPS.arrive === 'function',
      items: Object.keys(ITEMS).length,
      costumes: Object.keys(COSTUMES).length,
      trinkets: Object.keys(TRINKETS).length,
      itemsUsed: META.stats().itemsUsed,
      bribes: META.stats().bribesPaid,
      cine: typeof CINE !== 'undefined' && typeof CINE.transition === 'function',
    }));
    console.log('systems:', JSON.stringify(sys));
    if (!sys.fx) errors.push('[systems] FX not loaded');
    if (!sys.cops) errors.push('[systems] COPS not loaded');
    if (!sys.cine) errors.push('[systems] CINE not loaded');
    if (sys.items < 8) errors.push('[systems] ITEMS table too small');
    if (fin.ante !== 2) errors.push('[flow] expected ante 2, got ' + fin.ante);
    if (fin.phase !== 'blind') errors.push('[flow] expected the blind select, got ' + fin.phase);
  } catch (e) {
    errors.push('[script] ' + e.message);
    await shot('99-failure');
  }

  await browser.close();
  if (errors.length) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.log(e));
    process.exit(1);
  }
  console.log('\nSMOKE TEST PASSED — no console/page errors.');
})();
