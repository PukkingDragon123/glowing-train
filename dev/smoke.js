'use strict';
/* ============================================================
   Headless browser smoke test for SHELL & DEBT.

   Drives the whole case the way a player does: out of the murder
   board, through the drive across town, around the bullpen on
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
/* a stale shot from an older run is worse than a missing one: docs/ picks
   it up and the README ends up illustrated with last week's build */
fs.rmSync(SHOTS, { recursive: true, force: true });
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

  /* ---------- PLAYING A SKILL METER ----------
     The lock on the shed, the range, the drinks: all the same sweep with
     a band in it, and none of them can be beaten by clicking blindly.
     Poll the sweep, tap when the needle is inside the band. That is what
     a player does with their eyes; this is the same thing with a clock. */
  const playMeter = async (label) => {
    for (let taps = 0; taps < 40; taps++) {
      let fired = false;
      for (let poll = 0; poll < 240; poll++) {
        const m = await page.evaluate(() =>
          (typeof JOBS !== 'undefined' && JOBS.debugMeter) ? JOBS.debugMeter() : null);
        if (!m) return taps;                       /* the meter is finished */
        if (m.live && Math.abs(m.x - m.centre) <= m.band * 0.30) {
          await page.mouse.click(640, 400);
          fired = true;
          await page.waitForTimeout(620);
          break;
        }
        await page.waitForTimeout(12);
      }
      if (!fired) { errors.push('[meter] never lined up: ' + label); return taps; }
    }
    return 40;
  };
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
      /* A RACK OF REPLIES WILL NOT CLEAR ITSELF. Somebody has to say one of
         them, and the way out is always the last one on the rack. */
      if (await page.locator('#tutor-root.asking').count() > 0) {
        await page.evaluate(() => { if (TUTOR.typing && TUTOR.finishTyping) TUTOR.finishTyping(); });
        await page.waitForTimeout(150);
        const btns = page.locator('#tutor-root.asking .reply-btn');
        const n = await btns.count();
        if (n) {
          await btns.nth(n - 1).click({ timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(260);
          continue;
        }
      }
      const box = await plate.first().boundingBox().catch(() => null);
      if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height - 20);
      else await page.mouse.click(720, 620);
      await page.waitForTimeout(210);
    }
    return await page.locator('#tutor-root:not(.hidden)').count() === 0;
  };

  /* ---------- and what you say back ----------
     Pick a reply off the rack by index; leave it out for the way out. */
  const reply = async (n) => {
    const up = await page.waitForSelector('#tutor-root.asking .reply-btn', { timeout: 9000 })
      .catch(() => null);
    if (!up) return 0;
    await page.evaluate(() => { if (TUTOR.typing && TUTOR.finishTyping) TUTOR.finishTyping(); });
    await page.waitForTimeout(180);
    const btns = page.locator('#tutor-root.asking .reply-btn');
    const count = await btns.count();
    if (!count) return 0;
    const i = (n === undefined || n < 0) ? count - 1 : Math.min(n, count - 1);
    await btns.nth(i).click({ timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(320);
    return count;
  };
  /* a plate types itself on; a picture of half a word looks like a bug */
  const finishType = async () => {
    await page.evaluate(() => { if (TUTOR.typing && TUTOR.finishTyping) TUTOR.finishTyping(); });
    await page.waitForTimeout(140);
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
      () => !CINE.busy && !document.querySelector("#cine-stage.anim-cut") &&
            !document.querySelector("#cine-stage.ante-cut") &&
            !document.querySelector(".loc-card"),
      null, { timeout: ms || 30000 }).catch(() => {});
    /* and let any plate finish typing so a picture never catches half a word */
    await page.evaluate(() => { if (TUTOR.typing && TUTOR.finishTyping) TUTOR.finishTyping(); });
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
    /* the ?debug cheat bar is for the harness, not for the pictures */
    await page.addStyleTag({ content: '#dev-bar{display:none!important}' });
    await page.waitForTimeout(700);
    await shot('01-title');
    await page.evaluate(() => { const i = document.getElementById('seed-input'); if (i) i.value = 'SMOKE'; });
    await click('#btn-deal');

    /* the lore reel, then the drive across town */
    await page.waitForTimeout(1400);
    await shot('02-lore');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1200);

    /* ---------- the opening, which a first run now plays ----------
       IT IS NOT CARDS ANY MORE. The opening is seven ROOMS played through
       the SCENE runtime (js/cut.js) -- the family house at breakfast, the
       school gate, his desk, the tabac, then the same house that night,
       Orly and the cabin. The harness proves the first of them the way it
       proves any other room (the scene canvas is up and the room has the
       id the script says), plays two beats of the prologue for real, and
       then Escapes, because seven rooms, two minigames and an exam is not
       a smoke test. */
    if (await page.locator('body.in-cut').count() > 0) {
      await shot('02b-intro');
      const room = await page.evaluate(() => (SCENE.def || {}).id || '');
      if (room.indexOf('cut_home') !== 0) {
        errors.push('[intro] the prologue is not in the family house: ' + room);
      }
      /* the house has five things in it to use, and the first lesson is
         over as soon as he walks anywhere */
      const spots = await page.evaluate(() =>
        (typeof CUT !== 'undefined' && CUT.debugSpots) ? CUT.debugSpots() : []);
      if (spots.indexOf('stove') < 0 || spots.indexOf('sofa') < 0) {
        errors.push('[intro] the kitchen has no stove and no sofa: ' + spots.join(','));
      }
      for (let i = 0; i < 12; i++) {
        await clearPlates(3);
        if (await page.evaluate(() => !SCENE.busy())) break;
        await page.waitForTimeout(300);
      }
      await page.evaluate(() => { SCENE.walkTo(SCENE.me.x + 44); });
      await page.waitForTimeout(1200);
      await shot('02c-intro-room');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(900);
      await page.evaluate(() => { if (typeof INTRO !== 'undefined') INTRO.skip(); });
      /* and the exam folds up with it, so the badge is still signed */
      await page.waitForFunction(() => !document.body.classList.contains('in-cut'),
        null, { timeout: 25000 })
        .catch(() => errors.push('[intro] the opening would not skip'));
      await clearPlates();
      const badge = await page.evaluate(() => ({ b: !!G2().badge, a: !!G2().applied }));
      if (!badge.b || !badge.a) errors.push('[intro] skipped the opening without a badge');
      /* the hour and the weather have to go back to the shift */
      const pin = await page.evaluate(() => (typeof DAY !== 'undefined' && DAY.pinned) ? DAY.pinned() : null);
      if (pin !== null) errors.push('[intro] the opening left the clock pinned at ' + pin);
      await page.waitForTimeout(700);
    }
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
    await finishType();
    await shot('07-maybelle');
    await clearPlates();

    /* the captain, and the brief. It ends in a rack of things you can ask
       him: take one for real, photograph it, then take the way out. */
    await page.evaluate(() => { STORY.talkCaptain(); });
    await page.waitForTimeout(500);
    await finishType();
    await shot('08-captain');
    for (let i = 0; i < 14; i++) {
      if (await page.locator('#tutor-root.asking .reply-btn').count() > 0) break;
      const plate = page.locator('#tutor-root:not(.hidden)');
      if (await plate.count() === 0) { await page.waitForTimeout(160); continue; }
      const box = await plate.first().boundingBox().catch(() => null);
      if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height - 20);
      await page.waitForTimeout(230);
    }
    const rackSize = await page.locator('#tutor-root.asking .reply-btn').count();
    if (!rackSize) errors.push('[dialogue] the captain never offered a reply');
    else {
      await shot('08b-replies');
      await reply(0);                       // ask him something
      await clearPlates(8);
      await reply();                        // and then get to work
    }
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

    /* ================= 4. out into the city ================= */
    /* the phone comes out of the coat: the map is the only way to the car */
    await page.evaluate(() => { STORY.goOut(); });
    await page.waitForSelector('#phone-root.phone-on', { timeout: 20000 });
    await page.waitForTimeout(400);
    await shot('10-phone-map');
    /* the case file app, and then away */
    await page.evaluate(() => { PHONE.open('case'); });
    await page.waitForTimeout(400);
    await shot('11-phone-case');
    await page.evaluate(() => { PHONE.close(); });
    await page.waitForTimeout(300);

    /* dig up every clue the case planted, wherever it planted them */
    const plan = await page.evaluate(() => {
      if (!G2().case) CASE.build();
      return G2().case.clues.filter(c => !c.seen).map(c => ({ at: c.at, prop: c.prop }));
    });
    console.log('  the case is buried in: ' + plan.map(x => x.at + '/' + x.prop).join(', '));
    let dug = 0, errandRun = 0, lockShot = 0, pickShot = 0;
    for (const step of plan) {
      await page.evaluate((x) => { STORY.travel(x); }, step.at);
      await page.waitForFunction((x) => G2().phase === 'place' && G2().place === x && !CINE.busy,
        step.at, { timeout: 40000 });
      await settle();
      await clearPlates(6);
      if (!dug) { await shot('12-' + step.at); }

      /* THE FROG BEHIND THE COUNTER WANTS A FAVOUR FIRST. Take it: the
         laundry one is a lid and three rats, the rest are legwork. */
      if (!errandRun) {
        const q = await page.evaluate((x) => {
          const q2 = STORY.questAt(x);
          return q2 && STORY.questState(q2.id) === 'none' ? { id: q2.id, kind: q2.kind } : null;
        }, step.at);
        if (q) {
          errandRun = 1;
          await page.evaluate((x) => { STORY.askWitness(x, 'wit'); }, step.at);
          await page.waitForSelector('#tutor-root.asking .reply-btn', { timeout: 9000 })
            .catch(() => errors.push('[errand] nobody offered you anything'));
          await page.waitForTimeout(400);
          await shot('12b-errand');
          await reply(0);                                  // yes, I will do it
          if (q.kind === 'job') {
            const card = await page.waitForSelector('.job-card', { timeout: 9000 }).catch(() => null);
            if (!card) errors.push('[errand] the drums never opened');
            else {
              await page.waitForTimeout(700);
              await shot('12c-rats');
              for (let t = 0; t < 3; t++) {
                await page.mouse.click(640, 400);
                await page.waitForTimeout(800);
              }
              await page.waitForTimeout(700);
            }
          }
          await clearPlates(10);
          await page.mouse.click(700, 120);                 // clear a clue card if he paid in one
          await page.waitForTimeout(500);
          await clearPlates(8);
          let st = await page.evaluate((id) => STORY.questState(id), q.id);
          console.log('  errand ' + q.id + ' after the offer: ' + st);
          /* THE RATS GET AWAY SOMETIMES — they are supposed to, and a blind
             harness misses more than a player does. What has to work either
             way is the pay-off, so drive that directly. */
          if (st !== 'paid') {
            /* NEVER AWAIT A LINE OF DIALOGUE FROM IN HERE. The pay-off
               talks, and a plate waits for a tap that only the harness
               outside can give it, so awaiting it hangs for ever. Fire
               it, tap the plates out here, then read the state back. */
            await page.evaluate((id) => {
              const q2 = Object.keys(STORY.QUESTS).map(k => STORY.QUESTS[k])
                .find(x => x.id === id);
              G2().quests[id] = 'ready';
              STORY.questPay(q2);
            }, q.id);
            await page.waitForTimeout(700);
            await clearPlates(10);
            await page.mouse.click(700, 120);
            await page.waitForTimeout(400);
            await clearPlates(10);
            st = await page.evaluate((id) => STORY.questState(id), q.id);
          }
          console.log('  errand ' + q.id + ': ' + st);
          if (st !== 'paid') errors.push('[errand] the pay-off went nowhere: ' + st);
        }
      }
      /* walk over to it, then put your hand in it */
      await page.evaluate((pr) => {
        const sp = SCENE.def.spots.find(s2 => s2.id === pr);
        if (sp) SCENE.walkTo(sp.x - 14);
      }, step.prop);
      await page.waitForTimeout(900);
      /* an errand at this stop may already have paid this very clue out, so
         only demand the pick-up when there is still something buried here */
      const buried = await page.evaluate((pr) =>
        !!CITY.plantedAt(G2().place, pr), step.prop);
      await page.evaluate((pr) => { STORY.search(G2().place, pr); }, step.prop);
      await page.waitForTimeout(700);
      /* SOME PROPS FIGHT BACK. The shed on the pier has a new lock on it and
         searching it opens the pick meter first. */
      if (await page.locator('.job-card').count()) {
        if (!lockShot) { lockShot = 1; await shot('12d-lock'); }
        /* THE LOCK HAS TO BE PICKED, NOT MASHED. Sixteen blind taps miss
           the band sixteen times, the lock stays on, and everything
           behind that door — including the clue the harness is waiting
           for — never happens. */
        await playMeter('the lock on the ' + step.prop);
        /* the card animates out over about two tenths of a second, so give
           it that before calling it stuck */
        await page.waitForFunction(() => !document.querySelector('.job-card'),
          null, { timeout: 4000 })
          .catch(() => errors.push('[lock] the pick meter would not finish'));
        await page.waitForTimeout(700);
        await clearPlates(6);
        /* AND THE METER DOES THE SEARCH ITSELF once the lock is off, so
           asking again just puts a new lock on the door: the harness was
           opening the shed, searching it a second time, and then waiting
           for a pick-up behind a meter it had reopened. */
        const done = await page.evaluate((pr) => CITY.searched(G2().place, pr), step.prop);
        if (!done) {
          await page.evaluate((pr) => { STORY.search(G2().place, pr); }, step.prop);
          await page.waitForTimeout(900);
        }
      }
      if (buried) {
        /* the pick-up plays as an animation, so wait for it rather than
           sampling one frame and hoping */
        await page.waitForSelector('.pick-card', { timeout: 6000 }).catch(() => {});
        await page.waitForTimeout(900);
        if (await page.locator('.pick-card').count()) {
          if (!pickShot) { pickShot = 1; await shot('13-clue'); }
        } else {
          const why = await page.evaluate((pr) => ({
            prop: pr, planted: !!CITY.plantedAt(G2().place, pr),
            searched: CITY.searched(G2().place, pr),
            cineBusy: typeof CINE !== 'undefined' ? !!CINE.busy : null,
            sceneBusy: typeof SCENE !== 'undefined' ? !!SCENE.busy() : null,
            job: !!document.querySelector('.job-card'),
            plate: !!document.querySelector('.tut-plate'),
          }), step.prop);
          errors.push('[pick-up] finding something showed no pick-up ' + JSON.stringify(why));
        }
      }
      await page.mouse.click(700, 120);
      await page.waitForTimeout(700);
      await clearPlates(8);
      dug++;
    }
    /* ---------- the belt: the glass, the iron, and what they do ---------- */
    {
      const before = await page.evaluate(() => CITY.minutesLeft());
      await page.evaluate(() => TOOLS.set('glass'));
      await page.waitForTimeout(200);
      await shot('12e-belt');
      const prop = await page.evaluate(() => {
        const open = CITY.unsearchedAt(G2().place);
        const sp = (SCENE.def.spots || []).find(s2 => open.indexOf(s2.id) >= 0);
        if (!sp) return null;
        STORY.lookClose(sp, sp.x, 70);
        return sp.id;
      });
      if (prop) {
        await page.waitForSelector('.glass-card', { timeout: 8000 })
          .catch(() => errors.push('[glass] the eyeglass never opened'));
        await page.waitForTimeout(400);
        await shot('12f-glass');
        await page.mouse.click(640, 740);
        await page.waitForTimeout(500);
        const after = await page.evaluate(() => CITY.minutesLeft());
        if (after >= before) errors.push('[glass] looking cost nothing');
      }
      /* an easter egg, through the same glass */
      const egg = await page.evaluate(() => {
        const e = (SCENE.def.spots || []).find(s2 => s2.egg);
        if (!e) return null;
        e.onUse();
        return e.id;
      });
      if (egg) {
        await page.waitForSelector('.glass-card', { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(400);
        await shot('12g-egg');
        await page.mouse.click(640, 740);
        await page.waitForTimeout(500);
      } else errors.push('[eggs] nothing hidden in this room');

      /* the iron, on a rat */
      await page.evaluate(() => TOOLS.set('iron'));
      await page.waitForTimeout(200);
      const shotRat = await page.evaluate(async () => {
        const before2 = G2().ratsShot || 0;
        let r = SCENE.rats().find(x => !x.dead);
        if (!r) { SCENE.debugRats && SCENE.debugRats(1); r = SCENE.rats().find(x => !x.dead); }
        if (!r) return 'no rats';
        STORY.shootRat(r, r.x, r.y);
        return (G2().ratsShot || 0) > before2 ? 'shot' : 'missed';
      });
      console.log('  the iron: ' + shotRat);
      await page.waitForTimeout(400);
      await clearPlates(4);
      await page.evaluate(() => TOOLS.set('hand'));
      await page.waitForTimeout(200);
    }

    /* ---------- another floor of the same building ---------- */
    {
      const st = await page.evaluate(() => {
        const sp = (SCENE.def.spots || []).find(s2 => s2.id === 'stairs');
        if (!sp) return null;
        sp.onUse();
        return sp.label;
      });
      if (st) {
        await page.waitForFunction(() => !CINE.busy && !SCENE.busy(), null, { timeout: 30000 })
          .catch(() => {});
        await page.waitForTimeout(600);
        await clearPlates(4);
        await shot('12h-floor');
        const fl = await page.evaluate(() => ({ floor: G2().floor,
          spots: (SCENE.def.spots || []).map(x => x.id) }));
        console.log('  another floor: ' + fl.floor + ' [' + fl.spots.join(' ') + ']');
        if (!fl.floor) errors.push('[floors] the stairs went nowhere');
        /* and back down */
        await page.evaluate(() => {
          const sp = (SCENE.def.spots || []).find(s2 => s2.id === 'stairs');
          if (sp) sp.onUse();
        });
        await page.waitForFunction(() => !CINE.busy && !SCENE.busy(), null, { timeout: 30000 })
          .catch(() => {});
        await page.waitForTimeout(500);
        await clearPlates(4);
      }
    }

    /* ---------- and the one nice thing in the game ---------- */
    {
      const pet = await page.evaluate(async () => {
        const a = SCENE.pets()[0];
        if (!a) return null;
        STORY.petIt(a);
        return a.kind;
      });
      if (pet) {
        await page.waitForTimeout(700);
        await shot('12i-pet');
        await clearPlates(4);
      } else errors.push('[pets] no animal in this room');
    }

    /* ---------- THE SECRETS ----------
       An easter egg is not a signpost. Without the eyeglass in your hand
       it is not a target at all — pointing at it finds whatever real
       prop it is sitting on — and even with the glass out it will not
       tell you its name until you have looked. */
    {
      const eg = await page.evaluate(() => {
        const spots = (SCENE.def && SCENE.def.spots) || [];
        const e = spots.find(s => s.egg);
        if (!e) return null;
        const x = Math.round(e.x);
        const y = Math.round(e.y === undefined ? (e.top + e.bot) / 2 : e.y);
        const was = TOOLS.cur();
        TOOLS.set('hand');
        const hand = SCENE.debugPick(x, y);
        TOOLS.set('glass');
        const glass = SCENE.debugPick(x, y);
        /* the name is only hidden until you have LOOKED, and this run may
           already have looked, so ask what a fresh one would say */
        const seen = G2().eggs && G2().eggs[e.id];
        if (seen) delete G2().eggs[e.id];
        const lbl = glass && (typeof glass.label === 'function' ? glass.label() : glass.label);
        if (seen) (G2().eggs = G2().eggs || {})[e.id] = seen;
        TOOLS.set(was);
        return { handEgg: !!(hand && hand.egg), glassEgg: !!(glass && glass.egg), lbl };
      });
      if (!eg) console.log('  no easter egg in this room to check');
      else {
        if (eg.handEgg) errors.push('[eggs] an easter egg is pickable with the bare hand');
        if (!eg.glassEgg) errors.push('[eggs] the eyeglass cannot find the easter egg');
        if (eg.glassEgg && eg.lbl !== 'SOMETHING SMALL') {
          errors.push('[eggs] an unfound egg is giving its name away: ' + eg.lbl);
        }
        console.log('  eggs: hidden from the hand, found by the glass, unnamed until looked at');
      }
    }

    /* ---------- THE ALIBIS: press one, and break one ----------
       Every suspect says where he was and one of them is lying. Both
       halves have to work: a story that holds tells you it was not him,
       and a story that comes apart is the best beat in the game. */
    {
      const set = await page.evaluate(() => {
        if (!G2().case) CASE.build();
        const c = G2().case;
        const withAl = c.suspects.filter(s2 => s2.alibi).length;
        /* AN ERRAND OUTRANKS A QUESTION, and rightly so — but it means the
           first reply in the rack would be "yes I'll run your parcel"
           rather than the story question, and the harness would answer
           the wrong one. Settle anything owed here first. */
        const q = STORY.questAt(G2().place);
        if (q) G2().quests[q.id] = 'paid';
        /* stage it: move the guilty frog's story to the room we are in,
           and make sure the piece of evidence that breaks it is in hand */
        const ri = c.realIdx;
        c.suspects[ri].alibi.at = G2().place;
        const lev = c.suspects[ri].alibi.lever;
        const cl = c.clues.find(x => x.id === lev);
        if (cl) cl.seen = true;
        return { withAl, here: CASE.alibiAt(G2().place).length, armed: CASE.hasLever(ri), ri };
      });
      console.log('  alibis: ' + set.withAl + ' stated, ' + set.here
        + ' checkable here, lever in hand: ' + set.armed);
      if (!set.withAl) errors.push('[alibi] nobody stated where they were');
      if (!set.armed) errors.push('[alibi] the lever never reached the coat');
      /* the phone has to show them */
      await page.evaluate(() => { PHONE.open('case'); });
      await page.waitForTimeout(500);
      await shot('14d-alibis');
      await page.evaluate(() => { PHONE.close(); });
      await page.waitForTimeout(300);
      /* NEVER AWAIT DIALOGUE FROM IN HERE: the press talks, and a plate
         waits for a tap only the harness can give it. */
      await page.evaluate(() => { STORY.askWitness(G2().place, 'wit'); });
      await page.waitForSelector('#tutor-root.asking .reply-btn', { timeout: 9000 })
        .catch(() => errors.push('[alibi] nobody offered to talk about a name'));
      await page.waitForTimeout(400);
      await shot('14e-press');
      await reply(0);                                    // the story question is first
      await page.waitForTimeout(1200);
      await clearPlates(12);
      await page.waitForTimeout(600);
      await clearPlates(10);
      /* G2() LIVES IN THE PAGE. Reading it out here is a Node reference to
         a browser global, which throws — and threw only once the press
         actually worked and there was a name to look up. */
      const broke = await page.evaluate(() => {
        const i2 = CASE.broken();
        return { i: i2, name: i2 >= 0 ? G2().case.suspects[i2].name : null };
      });
      console.log('  story broken: ' + (broke.name || 'none'));
      if (broke.i < 0) errors.push('[alibi] the story never came apart');
    }

    /* the phone, with the day's work on it */
    await page.evaluate(() => { PHONE.open('job'); });
    await page.waitForTimeout(500);
    await shot('14b-phone-job');
    await page.evaluate(() => { PHONE.open('kit'); });
    await page.waitForTimeout(400);
    await shot('14c-phone-kit');
    await page.evaluate(() => { PHONE.close(); });
    await page.waitForTimeout(300);

    const left = await page.evaluate(() => CASE.left());
    console.log('  clues dug: ' + dug + ', faces still fitting: ' + left);
    if (dug && left >= (await page.evaluate(() => G2().case.suspects.length))) {
      errors.push('[flow] found every clue and it ruled nobody out');
    }

    /* a witness, and the sky he saw it through */
    await page.evaluate(() => { STORY.askWitness(G2().place, 'wit'); });
    await page.waitForTimeout(700);
    if (await pickerUp()) { await shot('14-witness'); await pickCard(0); await clearPlates(10); }

    /* a shift on the taps, because the rent is due */
    await page.evaluate(() => { STORY.travel('bar'); });
    await page.waitForFunction(() => G2().place === 'bar' && !CINE.busy, null, { timeout: 40000 });
    await settle();
    await clearPlates(6);
    await page.evaluate(() => { STORY.pourJob(); });
    await page.waitForTimeout(900);
    if (await page.locator('.job-card').count()) {
      await shot('15-taps');
      for (let i = 0; i < 3; i++) { await page.mouse.click(700, 400); await page.waitForTimeout(700); }
      await page.waitForTimeout(600);
      await clearPlates(10);
    } else errors.push('[flow] the taps job never opened');

    /* ================= 5. back to the station, and the line-up ================= */
    await page.evaluate(() => { STORY.travel('precinct'); });
    await page.waitForFunction(() => G2().phase === 'precinct' && !CINE.busy, null, { timeout: 40000 });
    await clearPlates(6);
    await page.evaluate(() => { STORY.toLineup(); });
    await page.waitForFunction(() => G2().phase === 'blind' && !!document.querySelector('.scene-cv'),
      null, { timeout: 40000 });
    await settle();
    await clearPlates(6);
    await shot('16-lineup');
    /* say the name of whoever the evidence still allows */
    const nameIdx = await page.evaluate(() => {
      const st = CASE.standing();
      const real = G2().case.suspects.findIndex(s2 => s2.real);
      return st[real] ? real : st.findIndex(Boolean);
    });
    await page.evaluate((i) => { STORY.nameHim(i); }, nameIdx);
    await page.waitForTimeout(700);
    if (await pickerUp()) { await shot('17-name'); await pickCard(0); }
    await page.waitForTimeout(1500);
    await shot('18-named');
    await page.mouse.click(700, 120);
    await page.waitForTimeout(900);
    await clearPlates(8);

    /* ================= 6. the table ================= */
    if ((await state()).phase !== 'duel') await page.evaluate(() => { STORY.sitDown(); });
    if (await pickerUp()) await pickCard(0);
    await page.waitForFunction(() => G2().phase === 'duel', null, { timeout: 25000 });
    await page.waitForTimeout(1800);
    await shot('19-sitdown');
    await page.waitForFunction(() => !DUEL.busy || G2().duel.over, null, { timeout: 30000 });
    await shot('20-duel');
    await winDuel('21-steady');

    /* ================= 6. out back ================= */
    await doLoot('22-loot');
    const home = await state();
    console.log('after the first lead:', JSON.stringify(home));
    await shot('23-home');
    if (home.phase !== 'precinct' && home.phase !== 'blind') {
      errors.push('[flow] the body did not lead home, got ' + home.phase);
    }

    /* ================= 7. the ward ================= */
    await page.evaluate(() => { STORY.rushToWard(); });
    await page.waitForTimeout(1800);
    await shot('24-ambulance');
    await page.waitForFunction(() => G2().phase === 'ward' && !!document.querySelector('.scene-cv'),
      null, { timeout: 30000 });
    await settle();
    await shot('25-ward');
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
        /* the city part is proved above; from here the shortcut is to take
           the night's findings as read and go straight to the line-up */
        /* let anything still running finish FIRST: a cinematic in flight can
           deal a fresh case, which would throw away the findings below */
        await settle();
        await clearPlates(6);
        await page.evaluate(() => {
          if (!G2().case) CASE.build();
          (G2().case.clues || []).forEach(cl => { cl.seen = true; });
        });
        await page.evaluate(() => { STORY.toLineup(); });
        /* Either the stairs open the line-up or, for a frog you already
           know, the captain waves you straight through with a line first.
           Both paths can park a plate in the way, so tap through while
           watching for the phase to move. */
        for (let t = 0; t < 24; t++) {
          const ph2 = (await state()).phase;
          if (ph2 === 'blind' || ph2 === 'duel') break;
          await clearPlates(3);
          await page.waitForTimeout(300);
        }
        const ph3 = (await state()).phase;
        if (ph3 !== 'blind' && ph3 !== 'duel') {
          errors.push('[flow] the stairs went nowhere, still in ' + ph3);
          break;
        }
        await clearPlates(4);
        if ((await state()).phase === 'blind') { await settle(); await clearPlates(4); }
        const i2 = await page.evaluate(() => {
          if (G2().phase !== 'blind') return -1;
          const st = CASE.standing();
          const real = G2().case.suspects.findIndex(s2 => s2.real);
          return st[real] ? real : Math.max(0, st.findIndex(Boolean));
        });
        if (i2 >= 0) {
          await page.evaluate((i) => { STORY.nameHim(i); }, i2);
          await page.waitForTimeout(600);
          if (await pickerUp()) await pickCard(0);
          await page.waitForTimeout(1400);
          await page.mouse.click(700, 120);
          await page.waitForTimeout(700);
          await clearPlates(8);
        }
      }
      const isBoss = await page.evaluate(() => G2().blind === 2);
      if (isBoss) await shot('26-lieutenant');
      if ((await state()).phase !== 'duel') await page.evaluate(() => { STORY.sitDown(); });
      if (await pickerUp()) await pickCard(0);
      await page.waitForFunction(() => G2().phase === 'duel', null, { timeout: 25000 });
      await page.waitForTimeout(1500);
      if (isBoss) await shot('27-boss-duel');
      await winDuel();
      await doLoot(isBoss ? '28-boss-loot' : null);
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
    await shot('29-mobile-precinct');
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(700);
    await shot('30-mobile-landscape');
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
    await shot('31-choice');
    await pickCard(0);                              // the badge
    await page.waitForTimeout(2400);
    await shot('32-court');
    await page.waitForTimeout(2600);
    await shot('33-graves');
    await page.waitForTimeout(3000);
    await page.mouse.click(720, 500);
    await page.waitForFunction(() => G2().phase === 'ending', null, { timeout: 30000 });
    await page.waitForTimeout(600);
    await shot('34-ending');
    const end = await page.evaluate(() => G2().ending);
    if (end !== 'good') errors.push('[flow] the badge did not produce the good ending, got ' + end);

    /* and the other one */
    await page.evaluate(() => { G2().ending = null; CINE.ending('bad'); });
    await page.waitForTimeout(1100);
    await shot('35-bad-room');
    await page.waitForTimeout(2400);
    await shot('36-bad-chair');
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
