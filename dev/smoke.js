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
  async function winDuel() {
    for (let i = 0; i < 12; i++) {
      const s = await state();
      if (s.phase !== 'duel' || s.over) break;
      if (!s.busy && s.turn === 'you') {
        await page.locator('button', { hasText: 'kill foe' }).click();
        await aimFoe();
        await page.evaluate(() => DUEL.onFire());
      }
      await settle();
      await page.waitForTimeout(250);
    }
    /* the kill blacks out straight into the back room */
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
    if (shotName) await shot(shotName);
    await click('#btn-walk');
    await page.waitForTimeout(400);
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
    await shot('02b-blind-select');
    /* the board: turn a clue over, watch the string reach a poster, name him */
    const ev1 = page.locator('.ev.live').first();
    if (await ev1.count() > 0) { await ev1.click(); await page.waitForTimeout(400); }
    await shot('02b2-board-clue');
    /* the case room, with money in the pocket so a tool can actually be bought */
    for (let i = 0; i < 3; i++) {
      await page.locator('button', { hasText: '+20⛁' }).click();
      await page.waitForTimeout(80);
    }
    await click('#btn-tools');
    await page.waitForTimeout(300);
    await shot('02b3-case-room');
    const buy = page.locator('.tool-buy:not([disabled])').first();
    if (await buy.count() > 0) { await buy.click(); await page.waitForTimeout(400); }
    await shot('02b3b-tool-bought');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
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

    /* two honest pulls at the mark, then the debug finisher */
    for (let p = 0; p < 2; p++) {
      const s = await state();
      if (s.phase !== 'duel' || s.over || s.busy || s.turn !== 'you') break;
      await aimFoe();
      await page.evaluate(() => DUEL.onFire());
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
