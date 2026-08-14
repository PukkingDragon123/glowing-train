'use strict';
/* ============================================================
   SHELL & DEBT — btn.js
   Every button in the game is an arcade button, drawn as pixel
   art rather than described in CSS.

   A CSS gradient with a border-radius is a web button no matter
   how chunky you make it. This paints the real thing per button:
   a dark socket bolted into the panel, a domed plastic cap
   sitting in it, a specular glint on the crown, and a press that
   drops the cap into the socket and takes the label with it.

   The art is drawn in K-pixel blocks at whatever size the button
   ends up, so the same button reads identically at 360px wide
   and 1920 — no stretching, no fractional pixels, no nine-slice.
   ============================================================ */

const BTN = {

  K: 4,                        // one art pixel, in CSS px
  SK: 2,                       // socket depth, in art pixels

  /* Five caps, and that's the whole vocabulary — one per thing a button
     can mean. Each is five values down from crown to shadow. */
  KINDS: {
    felt:   { hi: '#63c47f', top: '#3d9a68', mid: '#2b7050', lo: '#17452f', deep: '#0b2318', rim: '#0a1f16' },
    gold:   { hi: '#fff3b0', top: '#ffd75e', mid: '#e0a63c', lo: '#a5741f', deep: '#6e4c12', rim: '#3a2708' },
    danger: { hi: '#ff9b8e', top: '#ff6a5e', mid: '#d13b45', lo: '#8c2230', deep: '#571220', rim: '#2b0810' },
    cop:    { hi: '#b6e9ff', top: '#7fd7ff', mid: '#3f89c4', lo: '#255b8c', deep: '#12314d', rim: '#0a1c2c' },
    ghost:  { hi: '#4a5268', top: '#343b4e', mid: '#252a39', lo: '#1a1d28', deep: '#101219', rim: '#0b0c11' },
  },
  INK: '#12101d',

  kindOf(el) {
    const c = el.classList;
    if (c.contains('gold')) return 'gold';
    if (c.contains('danger') || c.contains('fire-btn')) return 'danger';
    if (c.contains('cop')) return 'cop';
    if (c.contains('ghost')) return 'ghost';
    return 'felt';
  },

  /* ---------------- geometry ---------------- */

  /* per-block-row horizontal inset for a rounded shape, so bands drawn
     inside the cap follow its corners instead of poking out of them */
  insets(rows, rb) {
    const out = [];
    for (let i = 0; i < rows; i++) {
      const d = Math.min(i, rows - 1 - i);
      out.push(d < rb
        ? rb - Math.round(Math.sqrt(Math.max(0, rb * rb - (rb - d) * (rb - d))))
        : 0);
    }
    return out;
  },

  /* a block-quantised rounded rect: the one primitive everything here uses */
  shape(x, x0, y0, w, h, rb, col) {
    const K = BTN.K;
    const rows = Math.max(1, Math.round(h / K));
    const ins = BTN.insets(rows, rb);
    x.fillStyle = col;
    for (let i = 0; i < rows; i++) {
      const yy = y0 + i * K, hh = Math.min(K, y0 + h - yy);
      const ww = w - ins[i] * K * 2;
      if (ww > 0 && hh > 0) x.fillRect(x0 + ins[i] * K, yy, ww, hh);
    }
  },

  /* ---------------- painting ---------------- */

  paint(el) {
    const cv = el._face;
    if (!cv) return;
    /* Plenty of code rebuilds a button's label with innerHTML = '', which
       throws the face out with it. Put it back rather than making every
       call site remember the button is skinned. */
    if (cv.parentNode !== el) el.insertBefore(cv, el.firstChild);
    const K = BTN.K;
    /* offsetWidth, NOT getBoundingClientRect: panels pop in on a transform,
       and a rect measured mid-scale bakes that scale into the face for good —
       the ResizeObserver never fires again, because the LAYOUT box never
       changed, only the transform did. */
    const w = Math.max(K * 8, Math.round(el.offsetWidth / K) * K);
    const h = Math.max(K * 7, Math.round(el.offsetHeight / K) * K);
    if (!w || !h) return;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    const x = cv.getContext('2d');
    x.clearRect(0, 0, w, h);
    x.imageSmoothingEnabled = false;

    const C = BTN.KINDS[BTN.kindOf(el)] || BTN.KINDS.felt;
    const skirt = BTN.SK * K;
    const down = el.classList.contains('pxb-down') && !el.disabled;
    const capY = down ? skirt : 0;
    const capH = h - skirt;

    /* --- the socket the cap lives in, bolted through the panel --- */
    BTN.shape(x, 0, 0, w, h, 3, BTN.INK);
    BTN.shape(x, K, K, w - K * 2, h - K * 2, 2, C.rim);

    /* --- the cap --- */
    BTN.shape(x, 0, capY, w, capH, 3, BTN.INK);
    const iw = w - K * 2, ih = capH - K * 2;
    const rows = Math.max(1, Math.round(ih / K));
    const ins = BTN.insets(rows, 2);
    const band = (from, to, col) => {
      x.fillStyle = col;
      for (let i = from; i < Math.min(to, rows); i++) {
        const yy = capY + K + i * K, hh = Math.min(K, capY + K + ih - yy);
        const ww = iw - ins[i] * K * 2;
        if (ww > 0 && hh > 0) x.fillRect(K + ins[i] * K, yy, ww, hh);
      }
    };
    band(0, rows, C.mid);                       // the body of the dome
    band(0, 1, C.hi);                           // the crown, catching the room
    band(1, 2, C.top);
    band(rows - 2, rows - 1, C.lo);             // where it rolls away from you
    band(rows - 1, rows, C.deep);

    /* the specular glint every moulded cap has, up and to the left */
    x.fillStyle = C.hi;
    x.fillRect(K * 2 + ins[1] * K, capY + K * 2, K * 3, K);
    x.fillRect(K * 2 + ins[1] * K, capY + K * 3, K, K);

    /* --- selected: the cap gets a gold rim instead of a black one --- */
    if (el.classList.contains('sel')) {
      BTN.shape(x, 0, capY, w, capH, 3, '#ffd75e');
      band(0, rows, C.mid); band(0, 1, C.hi); band(1, 2, C.top);
      band(rows - 2, rows - 1, C.lo); band(rows - 1, rows, C.deep);
      x.fillStyle = C.hi;
      x.fillRect(K * 2 + ins[1] * K, capY + K * 2, K * 3, K);
    }
  },

  /* ---------------- wiring ---------------- */

  skin(el) {
    if (el._face) { BTN.paint(el); return; }
    const cv = document.createElement('canvas');
    cv.className = 'btn-face';
    el._face = cv;
    el.insertBefore(cv, el.firstChild);
    el.classList.add('pxb');
    const down = (v) => () => {
      el.classList.toggle('pxb-down', v);
      BTN.paint(el);
    };
    el.addEventListener('pointerdown', down(true));
    el.addEventListener('pointerup', down(false));
    el.addEventListener('pointerleave', down(false));
    el.addEventListener('pointercancel', down(false));
    el.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') down(true)(); });
    el.addEventListener('keyup', down(false));
    BTN.ro.observe(el);
    BTN.paint(el);
  },

  /* the mark of a button we own: it is a .pixbtn and it is on screen */
  sweep(root) {
    (root || document).querySelectorAll('.pixbtn:not(.pxb)').forEach(BTN.skin);
    /* and re-seat any face that a label rebuild orphaned */
    (root || document).querySelectorAll('.pixbtn.pxb').forEach(el => {
      if (el._face && el._face.parentNode !== el) BTN.paint(el);
    });
  },

  init() {
    BTN.K = window.innerWidth < 520 ? 3 : 4;
    BTN.ro = new ResizeObserver(list => list.forEach(e => BTN.paint(e.target)));
    /* Buttons appear long after render(): the loot panel, the boss card, the
       heat card. Watching the body is cheaper than remembering to call in. */
    new MutationObserver(muts => {
      let dirty = false;
      muts.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        if (n.classList && n.classList.contains('pixbtn')) { BTN.skin(n); dirty = true; }
        else if (n.querySelector && n.querySelector('.pixbtn:not(.pxb)')) { BTN.sweep(n); dirty = true; }
      }));
      return dirty;
    }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', () => {
      const k = window.innerWidth < 520 ? 3 : 4;
      if (k !== BTN.K) { BTN.K = k; }
      document.querySelectorAll('.pxb').forEach(BTN.paint);
    });
    BTN.sweep();
  },
};
