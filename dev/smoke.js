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
        await click('#aim-foe');
        await click('#btn-fire');
      }
      await settle();
      await page.waitForTimeout(250);
    }
    /* payout overlay → THE SHOP */
    await page.waitForSelector('#duel-overlay:not(.hidden) .primary', { timeout: 25000 });
  }

  try {
    await page.goto(GAME);
    await page.waitForTimeout(700);
    await shot('01-title');

    /* collection round-trip */
    await click('#btn-collection');
    await page.waitForTimeout(400);
    await shot('02-collection');
    await click('#btn-back');
    await page.waitForTimeout(300);

    /* deal in */
    await page.fill('#seed-input', 'SMOKE-7');
    await click('#btn-deal');
    await page.waitForFunction(() => !DUEL.busy, null, { timeout: 20000 });
    await shot('03-duel-small');

    /* the two aim poses */
    await click('#aim-self');
    await page.waitForTimeout(450);
    await shot('03b-aim-self');
    await click('#aim-foe');
    await page.waitForTimeout(450);
    await shot('03c-aim-foe');

    /* two honest pulls at the mark, then the debug finisher */
    for (let p = 0; p < 2; p++) {
      const s = await state();
      if (s.phase !== 'duel' || s.over || s.busy || s.turn !== 'you') break;
      await click('#aim-foe');
      await click('#btn-fire');
      await settle();
      await page.waitForTimeout(300);
    }
    await shot('04-duel-mid');
    await winDuel();
    await shot('05-payout');
    await click('#duel-overlay .primary');
    await page.waitForTimeout(500);
    await shot('06-shop');

    /* shop: reroll + buy what's affordable */
    await page.locator('button', { hasText: '+20⛁' }).click();
    await click('#btn-reroll');
    await page.waitForTimeout(300);
    const ware = page.locator('#shop-stock .ware-card:not(.sold):not(:disabled)');
    if (await ware.count() > 0) { await ware.first().click(); await page.waitForTimeout(300); }
    await shot('07-shop-bought');
    await click('#btn-go');

    /* big blind — finish it */
    await page.waitForFunction(() => !DUEL.busy, null, { timeout: 25000 });
    await winDuel();
    await click('#duel-overlay .primary');
    await page.waitForTimeout(400);
    await click('#btn-go');

    /* boss blind — intro card, then the kill */
    await page.waitForSelector('#duel-overlay:not(.hidden) .primary', { timeout: 25000 });
    await shot('08-boss-intro');
    await click('#duel-overlay .primary');           // SIT DOWN
    await page.waitForFunction(() => !DUEL.busy, null, { timeout: 25000 });
    await shot('09-boss-duel');
    await winDuel();
    await click('#duel-overlay .primary');
    await page.waitForTimeout(400);
    await click('#btn-go');
    await page.waitForFunction(() => !DUEL.busy, null, { timeout: 25000 });
    await shot('10-ante2');

    const fin = await state();
    console.log('final state:', JSON.stringify(fin));
    if (fin.ante !== 2) errors.push('[flow] expected ante 2, got ' + fin.ante);
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
