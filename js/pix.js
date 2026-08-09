'use strict';
/* ============================================================
   SHELL & DEBT — pix.js
   Pixel-art engine: the global palette, a sprite compiler for
   hand-drawn pixel maps, and procedural drawing helpers used
   to compose the big set pieces (cylinder, cabinets, tables).
   ============================================================ */

const PIX = (() => {

  /* ---------- the one palette everything uses ---------- */
  const PAL = {
    K: '#12101d',  // ink outline
    k: '#1c1a2c',  // deep shadow
    W: '#f4efe0',  // bone
    w: '#c9c0a8',  // aged bone
    q: '#8d8672',  // dust

    // gold
    G: '#ffd75e', g: '#e0a63c', h: '#a5741f', H: '#6e4c12',
    // reds
    R: '#ff6a5e', r: '#d13b45', d: '#8c2230', D: '#571220',
    // felt greens
    F: '#4fae6d', f: '#2e7d5b', e: '#1c5540', E: '#103527',
    // steel
    S: '#9aa3b8', s: '#646d84', t: '#3f465c', T: '#272c3d',
    // brass / wood
    B: '#d99a6c', b: '#a2704a', u: '#6e4a30', U: '#452c1c',
    // neon
    N: '#6ff7d8', n: '#2ec4a9',
    P: '#ff7edb', p: '#c247a3',
    V: '#b18cff', v: '#7350c9', X: '#42307a',
    // misc
    O: '#ff9d3c', o: '#c96a1e', // orange flame
    Y: '#fff3b0',               // hot highlight
    L: '#7fd7ff', l: '#3f89c4', // ice blue / glass
    M: '#c9d2da', m: '#7e8a94', // silver light / dark
    Z: '#101418',
  };

  const DEFS = {};   // name -> {rows, map}
  const CACHE = {};  // name@scale -> canvas

  function def(name, art, map) {
    const rows = art.split('\n').map(r => r.replace(/\s+$/, '')).filter(r => r.length);
    DEFS[name] = { rows, map: map || {} };
  }

  function colorOf(ch, map) {
    if (ch === '.' || ch === ' ') return null;
    const v = map[ch];
    if (v !== undefined) return PAL[v] || v;   // map values are palette letters (or raw hex)
    return PAL[ch] || null;
  }

  function make(name, scale = 1) {
    const key = name + '@' + scale;
    if (CACHE[key]) return CACHE[key];
    const d = DEFS[name];
    if (!d) return null;
    const w = Math.max(...d.rows.map(r => r.length));
    const h = d.rows.length;
    const cv = document.createElement('canvas');
    cv.width = w * scale; cv.height = h * scale;
    const ctx = cv.getContext('2d');
    for (let y = 0; y < h; y++) {
      const row = d.rows[y];
      for (let x = 0; x < row.length; x++) {
        const col = colorOf(row[x], d.map);
        if (col) { ctx.fillStyle = col; ctx.fillRect(x * scale, y * scale, scale, scale); }
      }
    }
    CACHE[key] = cv;
    return cv;
  }

  // fresh <canvas> element copy (masters can't live in two DOM spots)
  function el(name, scale = 1, cls) {
    const m = make(name, 1);
    const cv = document.createElement('canvas');
    if (!m) { cv.width = cv.height = scale * 8; return cv; }
    cv.width = m.width * scale; cv.height = m.height * scale;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(m, 0, 0, cv.width, cv.height);
    cv.className = 'pix' + (cls ? ' ' + cls : '');
    return cv;
  }

  function draw(ctx, name, x, y, scale = 1) {
    const m = make(name, 1);
    if (!m) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(m, Math.round(x), Math.round(y), m.width * scale, m.height * scale);
  }

  function size(name) {
    const m = make(name, 1);
    return m ? { w: m.width, h: m.height } : { w: 0, h: 0 };
  }

  /* ---------- procedural helpers (logical-pixel space) ---------- */

  function rect(ctx, x, y, w, h, col) {
    ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function frame(ctx, x, y, w, h, col) { // 1px outline
    rect(ctx, x, y, w, 1, col); rect(ctx, x, y + h - 1, w, 1, col);
    rect(ctx, x, y, 1, h, col); rect(ctx, x + w - 1, y, 1, h, col);
  }

  // chunky outlined panel with stepped (chamfered) corners
  function panel(ctx, x, y, w, h, fill, edge, hi) {
    rect(ctx, x + 2, y, w - 4, h, fill);
    rect(ctx, x, y + 2, w, h - 4, fill);
    rect(ctx, x + 1, y + 1, w - 2, h - 2, fill);
    // outline
    ctx.fillStyle = edge;
    rect(ctx, x + 2, y - 1, w - 4, 1, edge); rect(ctx, x + 2, y + h, w - 4, 1, edge);
    rect(ctx, x - 1, y + 2, 1, h - 4, edge); rect(ctx, x + w, y + 2, 1, h - 4, edge);
    rect(ctx, x, y, 2, 1, edge); rect(ctx, x, y, 1, 2, edge);
    rect(ctx, x + w - 2, y, 2, 1, edge); rect(ctx, x + w - 1, y, 1, 2, edge);
    rect(ctx, x, y + h - 1, 2, 1, edge); rect(ctx, x, y + h - 2, 1, 2, edge);
    rect(ctx, x + w - 2, y + h - 1, 2, 1, edge); rect(ctx, x + w - 1, y + h - 2, 1, 2, edge);
    if (hi) { rect(ctx, x + 2, y + 1, w - 4, 1, hi); rect(ctx, x + 1, y + 2, 1, h - 4, hi); }
  }

  function dither(ctx, x, y, w, h, colA, colB) { // 2x2 checker
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      ctx.fillStyle = ((i + j) & 1) ? colA : colB;
      ctx.fillRect(x + i, y + j, 1, 1);
    }
  }

  function disc(ctx, cx, cy, r, col) { // filled pixel circle via scanlines
    ctx.fillStyle = col;
    for (let y = -r; y <= r; y++) {
      const span = Math.floor(Math.sqrt(r * r - y * y));
      ctx.fillRect(Math.round(cx - span), Math.round(cy + y), span * 2 + 1, 1);
    }
  }

  function ring(ctx, cx, cy, r, col) { // 1px circle outline
    ctx.fillStyle = col;
    let x = r, y = 0, err = 1 - r;
    const put = (px, py) => ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
    while (x >= y) {
      put(cx + x, cy + y); put(cx - x, cy + y); put(cx + x, cy - y); put(cx - x, cy - y);
      put(cx + y, cy + x); put(cx - y, cy + x); put(cx + y, cy - x); put(cx - y, cy - x);
      y++;
      if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
    }
  }

  /* studded metal ring — used by the cylinder */
  function studs(ctx, cx, cy, r, n, col, colHi) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
      rect(ctx, x - 1, y - 1, 2, 2, col);
      rect(ctx, x - 1, y - 1, 1, 1, colHi);
    }
  }

  return { PAL, def, make, el, draw, size, rect, frame, panel, dither, disc, ring, studs, DEFS };
})();
