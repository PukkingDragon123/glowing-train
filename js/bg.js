'use strict';
/* ============================================================
   SHELL & DEBT — bg.js
   The swirling paint background. Rendered at low resolution
   and scaled up pixelated, in the spirit of a certain
   poker-adjacent masterpiece.
   ============================================================ */

const BG = (() => {
  const LW = 192, LH = 108;
  let cv, ctx, img, buf32;
  let t = 0, raf = null, running = false;
  let pulseCol = null, pulseUntil = 0;

  const MODES = {
    title:  ['#0d2018', '#123227', '#0f2b1e', '#1a3a24'],
    round:  ['#0d2418', '#143626', '#0f2b1c', '#2a1018'],
    boss:   ['#200d14', '#2e1220', '#1a0a10', '#301622'],
    casino: ['#12240f', '#1a3a24', '#2a1018', '#123227'],
    dead:   ['#16090d', '#200d14', '#0f0609', '#1a0a10'],
    win:    ['#1f1a08', '#2e2609', '#171204', '#3a2e0e'],
  };
  let cols = MODES.title.map(hex2rgb);
  let target = cols;

  function hex2rgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }

  function lerp(a, b, k) { return a + (b - a) * k; }

  function frame() {
    raf = null;
    t += 0.0045;
    // ease palette toward target
    cols = cols.map((c, i) => c.map((v, j) => lerp(v, target[i][j], 0.06)));

    let pulse = null;
    if (pulseCol && performance.now() < pulseUntil) pulse = pulseCol;
    else pulseCol = null;

    const cx = LW / 2, cy = LH / 2;
    const N = cols.length;
    let p = 0;
    for (let y = 0; y < LH; y++) {
      const dy = (y - cy) * 1.7;
      for (let x = 0; x < LW; x++) {
        const dx = x - cx;
        const r = Math.sqrt(dx * dx + dy * dy);
        const a = Math.atan2(dy, dx);
        let v = a / (Math.PI * 2) * 3 + r * 0.055 - t * 2 + Math.sin(r * 0.11 - t * 3) * 0.35;
        v = ((v % N) + N) % N;
        let band = v | 0;
        // soft dither on band edges
        if ((v - band) > 0.82 && ((x ^ y) & 1)) band = (band + 1) % N;
        let c = cols[band];
        if (pulse && ((x + y) & 3) === 0) c = pulse;
        buf32[p++] = (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0];
      }
    }
    ctx.putImageData(img, 0, 0);
    if (running) raf = requestAnimationFrame(frame);
  }

  return {
    init() {
      cv = document.getElementById('bg-swirl');
      if (!cv) return;
      cv.width = LW; cv.height = LH;
      ctx = cv.getContext('2d');
      img = ctx.createImageData(LW, LH);
      buf32 = new Uint32Array(img.data.buffer);
      running = true;
      if (!raf) raf = requestAnimationFrame(frame);
    },
    set(mode) {
      target = (MODES[mode] || MODES.round).map(hex2rgb);
    },
    pulse(hex, ms) {
      pulseCol = hex2rgb(hex);
      pulseUntil = performance.now() + (ms || 350);
    },
  };
})();
