/* ============================================================
   SHELL & DEBT — dev/promo.js
   THE STORE PAGE ART, OUT OF THE GAME ITSELF.

   Nothing here is painted separately. It opens the title card,
   waits for the frog to put somebody down in the rain, and
   photographs the real frame at the real blow-up -- six screen
   pixels to the room pixel -- so every pixel on the cover is a
   pixel the game draws. The title goes over the top in the
   game's own font.

     promo/cover-630x500.png     itch.io cover / thumbnail
     promo/banner-1920x480.png   itch.io page banner
     promo/banner-960x240.png    the same, at the page's own width

   node dev/promo.js   (needs playwright-core and the chromium at
   /opt/pw-browsers/chromium, same as the smoke test)
   ============================================================ */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const GAME = 'file://' + path.join(ROOT, 'index.html') + '?debug';
const OUT = path.join(ROOT, 'promo');
fs.mkdirSync(OUT, { recursive: true });

const HIDE = `#dev-bar,.title-rail,.skip-badge,#tooltip{display:none!important}`;

/* wait on the title reel until the shot lands and the bang is full size */
async function onTheBang(p) {
  for (let i = 0; i < 200; i++) {
    const n = await p.evaluate(() => (typeof TOON !== 'undefined' ? TOON.live() : 0));
    if (n > 0) { await p.waitForTimeout(230); return true; }
    await p.waitForTimeout(60);
  }
  return false;
}

/* the title, drawn in the game's own font, laid over the frame */
async function title(p, o) {
  await p.evaluate((o) => {
    const P = PIX.PAL;
    const wrap = document.createElement('div');
    wrap.id = 'promo-title';
    wrap.style.cssText = `position:fixed;left:${o.x}px;top:${o.y}px;z-index:400;display:flex;flex-direction:column;align-items:${o.align || 'center'};gap:${o.gap || 10}px;pointer-events:none;width:${o.w}px`;
    const add = (txt, sc, col, outline) => {
      const cv = PIXFONT.render(txt, { scale: sc, color: col, outline: outline || P.K, shadow: { color: 'rgba(0,0,0,.7)', dx: 1, dy: 1 } });
      cv.style.imageRendering = 'pixelated';
      wrap.appendChild(cv);
    };
    if (o.kicker) add(o.kicker, o.ks || 2, P.q);
    add('SHELL & DEBT', o.scale, P.R);
    if (o.sub) add(o.sub, o.ss || 2, P.W);
    if (o.hook) {
      const gap = document.createElement('div'); gap.style.height = (o.hookGap || 6) + 'px'; wrap.appendChild(gap);
      add(o.hook, o.hs || 2, P.G);
    }
    document.body.appendChild(wrap);
  }, o);
}

/* a soft dark edge so the title reads over the rain, drawn in pixels */
async function vignette(p, clip, side) {
  await p.evaluate(({ clip, side }) => {
    const cv = document.createElement('canvas');
    cv.width = clip.width; cv.height = clip.height;
    cv.style.cssText = `position:fixed;left:${clip.x}px;top:${clip.y}px;z-index:390;pointer-events:none;image-rendering:pixelated`;
    const c = cv.getContext('2d');
    const step = 6;
    for (let y = 0; y < clip.height; y += step) {
      for (let x = 0; x < clip.width; x += step) {
        let a = 0;
        if (side === 'top') a = Math.max(0, 1 - y / (clip.height * 0.46)) * 0.86;
        if (side === 'left') a = Math.max(Math.max(0, 1 - x / (clip.width * 0.40)) * 0.70, Math.max(0, 1 - y / (clip.height * 0.30)) * 0.80);
        const edge = Math.min(x, y, clip.width - x, clip.height - y) / (Math.min(clip.width, clip.height) * 0.18);
        a = Math.max(a, (1 - Math.min(1, edge)) * 0.45);
        if (a > 0.01) { c.fillStyle = 'rgba(4,4,8,' + a.toFixed(3) + ')'; c.fillRect(x, y, step, step); }
      }
    }
    document.body.appendChild(cv);
  }, { clip, side });
}

async function frogOnScreen(p) {
  return p.evaluate(() => {
    const me = SCENE.me, r = SCENE.debugRes();
    const s = SCENE.screenAt(me.x, r.floorY);
    return { x: s.x, y: s.y, k: s.k };
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
  const errs = [];

  /* ---------------- the cover ---------------- */
  {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(GAME); await p.waitForTimeout(900);
    await p.addStyleTag({ content: HIDE });
    await onTheBang(p);
    const f = await frogOnScreen(p);
    const clip = { x: Math.round(Math.max(0, Math.min(1280 - 630, f.x - 170))), y: Math.round(Math.max(0, Math.min(800 - 500, f.y - 452))), width: 630, height: 500 };
    await vignette(p, clip, 'top');
    await title(p, { x: clip.x, y: clip.y + 22, w: 630, scale: 6, sub: 'A DETECTIVE FROG STORY', hook: 'THE CODE WAS NEVER FOR HIM.', gap: 8 });
    await p.waitForTimeout(80);
    await p.screenshot({ path: path.join(OUT, 'cover-630x500.png'), clip });
    await p.close();
  }

  /* ---------------- the banner ---------------- */
  {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(GAME); await p.waitForTimeout(900);
    await p.addStyleTag({ content: HIDE });
    await onTheBang(p);
    const f = await frogOnScreen(p);
    const clip = { x: 0, y: Math.round(Math.max(0, Math.min(1080 - 480, f.y - 430))), width: 1920, height: 480 };
    await vignette(p, clip, 'left');
    await title(p, { x: 70, y: clip.y + 110, w: 720, align: 'flex-start', scale: 9,
      kicker: 'HOMICIDE DIVISION - AFTER HOURS', ks: 3, sub: 'A DETECTIVE FROG STORY', ss: 3,
      hook: 'THE CODE WAS NEVER FOR HIM.', hs: 3, gap: 12 });
    await p.waitForTimeout(80);
    const file = path.join(OUT, 'banner-1920x480.png');
    await p.screenshot({ path: file, clip });
    /* and the same banner at the page's own width, halved on whole pixels */
    const small = await b.newPage({ viewport: { width: 960, height: 240 } });
    const data = fs.readFileSync(file).toString('base64');
    await small.setContent(`<body style="margin:0"><img src="data:image/png;base64,${data}" style="width:960px;height:240px;image-rendering:pixelated;display:block"></body>`);
    await small.waitForTimeout(150);
    await small.screenshot({ path: path.join(OUT, 'banner-960x240.png') });
    await small.close();
    await p.close();
  }

  await b.close();
  console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'promo art written to promo/');
})();
