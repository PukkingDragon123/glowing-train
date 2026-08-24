/* ============================================================
   SHELL & DEBT — tools.js
   WHAT IS IN YOUR HANDS.

   A detective has three of them, and which one is out changes
   what a click means:

     THE HAND      walk, open, search, talk. The default.
     THE EYEGLASS  hold it up to something and look at it properly.
                   The room is drawn at full pixel detail and most
                   of that detail is too small to see at room
                   scale — so the glass magnifies the actual
                   painted room, and everything hidden in the art
                   is in there waiting.
     THE IRON      point it at something. Rats are fair game. A
                   frog is not, and the game will let you anyway.

   The tool owns the mouse cursor, so a mouse over the room always
   says what the click is about to do.
   ============================================================ */

const TOOLS = (() => {

  const LIST = [
    { id: 'hand', word: 'HAND', key: '1', icon: 'ic_hand',
      hint: 'WALK, OPEN, SEARCH, TALK', tint: '#6ff7d8' },
    { id: 'glass', word: 'EYEGLASS', key: '2', icon: 'ic_lens',
      hint: 'LOOK CLOSE AT SOMETHING', tint: '#ffd75e' },
    { id: 'iron', word: 'THE IRON', key: '3', icon: 'ic_iron',
      hint: 'AIM AT IT. RATS ARE FAIR GAME.', tint: '#ff6a5e' },
  ];

  let cur = 'hand';
  const cursors = {};

  function of(id) { return LIST.find(t => t.id === (id || cur)) || LIST[0]; }

  /* ---------------------------------------------------------
     THE CURSOR.

     Drawn, not a system arrow: a pointing glove, a lens with a
     handle, or a set of crosshairs, blown up to 2x and handed to
     CSS as a data URL with its own hot spot.
     --------------------------------------------------------- */
  function cursorFor(id) {
    if (cursors[id]) return cursors[id];
    const K = 2, S = 16;
    const cv = document.createElement('canvas');
    cv.width = S * K; cv.height = S * K;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.scale(K, K);
    const P = PIX.PAL;
    const px = (x, y, w, h, col) => ART.px(c, x, y, w, h, col);

    if (id === 'iron') {
      /* crosshairs, with a gap in the middle so you can see what you are
         about to do to whatever is under them */
      const g = P.K, r = '#ff6a5e';
      px(1, 7, 5, 2, g); px(10, 7, 5, 2, g);
      px(7, 1, 2, 5, g); px(7, 10, 2, 5, g);
      px(1, 7, 5, 1, r); px(10, 8, 5, 1, r);
      px(7, 1, 1, 5, r); px(8, 10, 1, 5, r);
      px(7, 7, 2, 2, r);
      cursors[id] = { url: cv.toDataURL(), hx: 8 * K, hy: 8 * K };
      return cursors[id];
    }
    if (id === 'glass') {
      /* the lens, held up: rim, glass, and a handle going down-right */
      PIX.disc(c, 6, 6, 6, P.K);
      PIX.disc(c, 6, 6, 5, '#cfe6f2');
      PIX.disc(c, 6, 6, 4, 'rgba(127,215,255,.55)');
      px(4, 3, 3, 1, '#ffffff');
      px(3, 4, 1, 2, '#ffffff');
      px(10, 10, 2, 2, P.K);
      px(11, 11, 4, 4, P.K);
      px(12, 12, 3, 3, '#e0a63c');
      cursors[id] = { url: cv.toDataURL(), hx: 6 * K, hy: 6 * K };
      return cursors[id];
    }
    /* the hand: a pointing glove */
    px(5, 1, 3, 6, P.K);
    px(6, 2, 1, 5, '#f4efe0');
    px(3, 6, 9, 8, P.K);
    px(4, 7, 7, 6, '#8fe6c8');
    px(4, 7, 7, 2, '#c9f7e4');
    px(4, 12, 7, 1, 'rgba(0,0,0,.35)');
    px(7, 7, 1, 5, 'rgba(0,0,0,.22)');
    cursors[id] = { url: cv.toDataURL(), hx: 6 * K, hy: 2 * K };
    return cursors[id];
  }

  /* what CSS should put on the element the mouse is over */
  function css(id, hot) {
    const c = cursorFor(id || cur);
    return 'url(' + c.url + ') ' + c.hx + ' ' + c.hy + ', ' + (hot ? 'pointer' : 'default');
  }

  return {
    LIST, of, cursorFor, css,

    cur() { return cur; },
    is(id) { return cur === id; },

    set(id) {
      if (!LIST.some(t => t.id === id) || cur === id) return false;
      cur = id;
      SFX.tick && SFX.tick();
      if (UI.syncTools) UI.syncTools();
      if (SCENE.refreshCursor) SCENE.refreshCursor();
      const t = of(id);
      UI.stampSmall && UI.stampSmall(t.word + ': ' + t.hint);
      return true;
    },

    /* the belt goes round on TAB-less keys, so a thumb can cycle it too */
    cycle() {
      const i = LIST.findIndex(t => t.id === cur);
      TOOLS.set(LIST[(i + 1) % LIST.length].id);
    },

    /* a keypress, if it belongs to us */
    onKey(k) {
      const t = LIST.find(t2 => t2.key === k);
      if (t) { TOOLS.set(t.id); return true; }
      if (k === 'q') { TOOLS.cycle(); return true; }
      return false;
    },

    reset() { cur = 'hand'; },
  };
})();
