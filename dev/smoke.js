'use strict';
/* ============================================================
   Headless browser smoke test for SHELL & DEBT.
   Drives a full loop: title → run → pulls/bank/sleight →
   round win → every casino mini-game → next ante, and fails
   on any console error or page error.

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
  const click = (sel) => page.locator(sel).first().click({ timeout: 5000 });

  try {
    await page.goto(GAME);
    await page.waitForTimeout(600);
    await shot('01-title');

    await page.fill('#seed-in', 'SMOKE-42');
    await click('#btn-deal');
    await page.waitForTimeout(700);
    await shot('02-round-start');

    if (!await page.locator('#btn-peek').isDisabled()) {
      await click('#btn-peek');
      await page.waitForTimeout(300);
    }

    for (let i = 0; i < 6; i++) {
      const call = i % 2 === 0 ? 1 : 2;
      await page.locator('.call-btn').nth(call - 1).click();
      await page.waitForTimeout(150);
      if (await page.locator('#btn-pull').isDisabled()) break;
      await click('#btn-pull');
      await page.waitForTimeout(1300);
      if (!await page.locator('#btn-bank').isDisabled() && i % 2 === 1) {
        await click('#btn-bank');
        await page.waitForTimeout(400);
      }
      if (await page.locator('#mm-go').count() > 0) break;
    }
    await shot('03-round-mid');

    if (await page.locator('#mm-go').count() === 0) {
      if (!await page.locator('#btn-spin').isDisabled()) {
        await click('#btn-spin'); await page.waitForTimeout(700);
      }
      if (!await page.locator('#btn-load').isDisabled()) {
        await click('#btn-load');
        await page.waitForTimeout(300);
        const chips = page.locator('#load-strip button');
        if (await chips.count() > 0) await chips.first().click();
        else await click('.m-close');
        await page.waitForTimeout(300);
      }
    }

    // force the round win via the ?debug buttons
    for (let i = 0; i < 4; i++) {
      if (await page.locator('#mm-go').count() > 0) break;
      await page.locator('button', { hasText: '+250 score' }).click();
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(1200);
    await shot('04-round-won');
    await click('#mm-go');
    await page.waitForTimeout(500);
    await shot('05-casino');

    for (let i = 0; i < 3; i++) await page.locator('button', { hasText: '+100⛁' }).click();

    await page.locator('.station[data-station="slots"]').click();
    await page.waitForTimeout(300);
    await click('#btn-spin-slots');
    await page.waitForTimeout(2800);
    await shot('06-slots');
    await click('.m-close');

    await page.locator('.station[data-station="bj"]').click();
    await page.waitForTimeout(300);
    await click('#bj-deal');
    await page.waitForTimeout(600);
    if (!await page.locator('#bj-stand').isDisabled()) {
      await click('#bj-stand');
      await page.waitForTimeout(2500);
    }
    await shot('07-blackjack');
    await click('.m-close');

    await page.locator('.station[data-station="roulette"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-col="R"]').click();
    await click('#btn-spin-wheel');
    await page.waitForTimeout(3800);
    await shot('08-roulette');
    await click('.m-close');

    await page.locator('.station[data-station="derby"]').click();
    await page.waitForTimeout(300);
    await page.locator('.chick-btn').first().click();
    await click('#btn-race');
    await page.waitForTimeout(6000);
    await shot('09-derby');
    await click('.m-close');

    await page.locator('.station[data-station="pawn"]').click();
    await page.waitForTimeout(300);
    await shot('10-pawn');
    const buy = page.locator('#pawn-charms .w-buy:not([disabled])');
    if (await buy.count() > 0) { await buy.first().click(); await page.waitForTimeout(300); }
    await click('.m-close');

    await click('#btn-next');
    await page.waitForTimeout(700);
    await shot('11-ante2');

    const state = await page.evaluate(() => ({
      ante: G.ante, debt: G.debt, chips: G.chips, phase: G.phase,
      bag: G.bag.length, charms: G.charms.length,
    }));
    console.log('final state:', JSON.stringify(state));
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
