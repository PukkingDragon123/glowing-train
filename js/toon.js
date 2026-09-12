'use strict';
/* ============================================================
   SHELL & DEBT — toon.js
   THE BALLOON, AND WHAT POPS OUT OF IT.

   Everybody in this game talked on a sheet of manila. It was a
   good sheet — fibre tooth, punched holes, a photograph clipped
   to the corner — and it was the wrong object. A case file is
   something you READ. What a frog with a cigarette in his mouth
   needs is something he SAYS, and the drawing for that was
   settled in newspapers a hundred years ago: heavy ink, bone
   fill, and a tail pointing at whoever is to blame for it.

   So this is the balloon. Four of them, actually — a spoken one,
   a shout with the spikes on, a thought with its lobes and its
   little trail of dots, and a whisper drawn with a dry pen. The
   line picks its own shape off its own punctuation, which means
   a hundred and thirty-eight call sites got the shout for free.

   And underneath: the layer that everything else in a cartoon
   lives on. The bang over a gun, the dust curling up off a heel,
   the vein on a forehead, the four-point star off something that
   hurt. None of it is CSS and none of it is a font — it is all
   drawn at one pixel per pixel and blown up by an integer, the
   same as every other thing on screen.
   ============================================================ */

const TOON = (function () {

  const P = PIX.PAL;

  /* INK IS NOT BLACK AND BONE IS NOT WHITE. Pure #000 on pure #fff is a
     word processor; a printed balloon is warm paper with a very dark blue
     line round it, and the difference is most of why one reads as a comic
     and the other reads as a dialog box. */
  const INK   = '#100e1a';
  const FILL  = '#f6f1e2';
  const LIT   = '#fffdf3';
  const SHADE = '#d2c9b0';
  const TEXT  = '#171524';
  const SOFT  = '#6b6478';
  const COOL  = '#eef1f8';        // a thought is a colder sheet than a shout
  const DRY   = '#e6e2d2';        // and a whisper is a thinner one

  /* ============================================================
     ONE GLYPH AT A TIME.

     PIXFONT renders a whole string to a canvas, which is right for
     a label and wrong for a line that is arriving: the letters that
     have just landed have to sit a pixel high of the ones that have
     settled, and you cannot move one letter of a finished canvas.
     So the balloon draws its own text a character at a time out of
     a cache, which costs about eighty blits a rebuild and buys the
     whole bounce.
     ============================================================ */
  const CW = 5, CH = 7, ADV = 6;          // the 5x7 cell, and its advance
  const GC = {};
  function glyph(ch, col) {
    const k = ch + '|' + col;
    if (!GC[k]) GC[k] = PIXFONT.render(ch, { scale: 1, color: col, shadow: null });
    return GC[k];
  }
  /* PIXFONT pads its canvas by one pixel on every side when there is no
     shadow and no outline under it, so the cell lands at (1,1). */
  const GPAD = 1;
  function putGlyph(c, ch, x, y, col) {
    if (ch === ' ') return;
    c.drawImage(glyph(ch, col), x - GPAD, y - GPAD);
  }
  function strW(s) { return s.length ? s.length * ADV - 1 : 0; }

  /* ============================================================
     THE SILHOUETTE, TWICE.

     A cartoon outline is a dilation: the shape drawn fat in ink,
     then the same shape drawn normal in bone on top of it. Do it
     any other way — stroke it, trace its edge, walk its perimeter
     — and the spiky one and the lobed one each need their own
     special case. Draw the silhouette twice and every variant
     gets its ink for nothing.
     ============================================================ */

  const RND = {};
  function corner(r) {
    if (!RND[r]) {
      const a = [];
      for (let i = 0; i < r; i++) {
        const dy = r - 0.5 - i;
        a.push(r - Math.round(Math.sqrt(Math.max(0, r * r - dy * dy))));
      }
      RND[r] = a;
    }
    return RND[r];
  }

  /* a rounded slab in pixel steps — rows `from`..`to` only, so the same
     routine lays the fill, the lit top edge and the cel shade under it */
  function slabBand(c, x, y, w, h, r, from, to, col) {
    r = Math.max(0, Math.min(r, Math.floor(h / 2), Math.floor(w / 2)));
    const ins = corner(r);
    for (let i = Math.max(0, from); i < Math.min(h, to); i++) {
      const d = i < r ? ins[i] : (i >= h - r ? ins[h - 1 - i] : 0);
      PIX.rect(c, x + d, y + i, w - d * 2, 1, col);
    }
  }
  function slab(c, x, y, w, h, r, col) { slabBand(c, x, y, w, h, r, 0, h, col); }

  /* a spike, drawn as stacked spans. dir: -1 up / +1 down for V, and the
     same for left / right on H. */
  function spikeV(c, cx, y, bw, len, dir, col) {
    for (let i = 0; i <= len; i++) {
      const hw = Math.max(1, Math.round((bw / 2) * (1 - i / (len + 1))));
      PIX.rect(c, cx - hw, y + dir * i, hw * 2, 1, col);
    }
  }
  function spikeH(c, x, cy, bw, len, dir, col) {
    for (let i = 0; i <= len; i++) {
      const hh = Math.max(1, Math.round((bw / 2) * (1 - i / (len + 1))));
      PIX.rect(c, x + dir * i, cy - hh, 1, hh * 2, col);
    }
  }

  /* the tail: a wedge off the bottom edge, leaning towards whoever said it */
  function wedge(c, tx, ty, wide, len, lean, inf, col) {
    for (let i = 0; i <= len + inf; i++) {
      const t = Math.min(1, i / len);
      const hw = Math.max(1, Math.round((wide / 2) * (1 - t * 0.86)) + inf);
      PIX.rect(c, Math.round(tx - lean * t) - hw, ty + i, hw * 2, 1, col);
    }
  }

  /* ============================================================
     WHAT SHAPE THE LINE IS.

     Nobody is going to go back through a hundred and thirty-eight
     call sites and mark which ones are shouted, and they should
     not have to: the line already says. A line that ends in a bang
     is shouted, one that trails off in dots is thought, one asking
     something gets the query mark over it, and everything else is
     spoken. Punctuation has been doing this job since 1902.
     ============================================================ */
  function kindOf(line, o) {
    if (o && o.kind) return o.kind;
    const s = String(line || '').trim();
    if (/!/.test(s)) return 'shout';
    if (/\.\.\.$/.test(s)) return 'think';
    /* ------------------------------------------------------------
       AND `hold` IS NOT A WHISPER.

       First cut read a held line -- one nobody has to click -- as
       muttered, and held is how nearly all of story.js talks: every
       witness answer, every line you say back, the print kit. Three
       quarters of the game came up drawn with a dry pen.

       A line with NO NAME on it and nobody waiting is the handler
       in your ear, and that is the only thing in here that whispers.
       ------------------------------------------------------------ */
    if (o && o.hold && !o.name && !o.big) return 'whisper';
    return 'say';
  }

  /* and what pops out of it when it lands */
  function markOf(line) {
    const s = String(line || '').trim();
    if (/!\s*$/.test(s)) return 'bang';
    if (/\?\s*$/.test(s)) return 'query';
    if (/\.\.\.$/.test(s)) return 'think';
    return null;
  }

  /* ============================================================
     THE HEAD AT THE END OF THE TAIL.

     The portrait used to be a photograph clipped into the margin
     of the sheet, which is a thing a case file has and a thing a
     balloon does not. Here he is a cut-out: the same head, given
     a hard ink line all the way round by stamping his own
     silhouette eight ways under him, sat in the corner with the
     tail coming down onto his hat.
     ============================================================ */
  function inkOf(art) {
    if (!art) return null;
    if (art._toonInk) return art._toonInk;
    const cv = document.createElement('canvas');
    cv.width = art.width; cv.height = art.height;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(art, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = INK;
    c.fillRect(0, 0, cv.width, cv.height);
    art._toonInk = cv;
    return cv;
  }

  function paleOf(art) {
    if (!art) return null;
    if (art._toonPale) return art._toonPale;
    const cv = document.createElement('canvas');
    cv.width = art.width; cv.height = art.height;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(art, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = FILL;
    c.fillRect(0, 0, cv.width, cv.height);
    art._toonPale = cv;
    return cv;
  }

  const RING8 = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  const RING16 = [[-2, 0], [2, 0], [0, -2], [0, 2], [-2, -1], [-2, 1], [2, -1], [2, 1],
    [-1, -2], [1, -2], [-1, 2], [1, 2], [-2, -2], [2, -2], [-2, 2], [2, 2]];

  /* ============================================================
     A STICKER, NOT A SILHOUETTE.

     The ink line alone was not enough. Half this cast wears a dark
     coat and a dark hat, this game is set at night, and a very dark
     blue outline round a very dark blue frog sat on a very dark
     floor is a hole in the screen. So there is a BONE rim outside
     the ink -- the white edge every die-cut sticker and every
     cartoon cel has had -- and he lifts off whatever is behind him.
     ============================================================ */
  function cutout(c, art, x, y) {
    const pale = paleOf(art), ink = inkOf(art);
    if (pale) RING16.forEach(([dx, dy]) => c.drawImage(pale, x + dx, y + dy));
    if (ink) RING8.forEach(([dx, dy]) => c.drawImage(ink, x + dx, y + dy));
    c.drawImage(art, x, y);
  }

  /* ============================================================
     THE BALLOON.

     Same arguments the manila sheet took, because the point of
     this exercise was to change what talking LOOKS like and not
     to go and edit every line in the game:

       lines[]   already wrapped by the caller
       name      who is saying it, on a tab tacked to the top edge
       portrait  his head, which the tail then points at
       foot      the prompt in the bottom corner
       reveal    how many characters have arrived
       kind      say | shout | think | whisper
       k         the blow-up, pinned by the caller
       maxW      and what the frame can actually hold
     ============================================================ */
  function bubble(o) {
    o = o || {};
    const kind = o.kind || 'say';
    const lines = (o.lines || []).map(s => String(s));
    const name = o.name ? String(o.name) : '';
    const foot = o.foot ? String(o.foot) : '';
    const art = o.portrait || null;

    const PADX = 7, PADY = 6, LEAD = 10, TABH = 11, TAILL = 13;
    const EXT = kind === 'shout' ? 6 : kind === 'think' ? 4 : 0;

    /* ---------- measure ---------- */
    let textW = 0;
    lines.forEach(l => { textW = Math.max(textW, strW(l)); });
    if (name) textW = Math.max(textW, strW(name) - 8);
    if (foot) textW = Math.max(textW, strW(foot) + 10);
    const coreW = textW + PADX * 2;
    const coreH = PADY * 2 + Math.max(1, lines.length) * LEAD - 3 + (foot ? 9 : 0);

    /* ---------- place ---------- */
    const bustW = art ? art.width : 0, bustH = art ? art.height : 0;
    const coreX = (art ? Math.round(bustW * 0.60) : 4) + EXT;
    const coreY = (name ? TABH + 1 : 4) + EXT;
    const tailX = coreX + 14, tailY = coreY + coreH;
    /* ============================================================
       THE TAIL HAS TO BE SOMEWHERE.

       First cut put the head four rows ABOVE the balloon's bottom
       edge, so the head -- drawn last, on top -- covered the tail
       completely and the balloon came out as a floating box with a
       frog under it. The tail is the whole grammar of a balloon:
       without it nothing on screen says who is talking.

       So there are eight rows of clear air between the bottom edge
       and the top of his hat, the tail crosses them, and its last
       five rows land ON the hat, which is where a comic has always
       put it. Costs twenty pixels of height. Worth it.
       ============================================================ */
    const bustY = art ? tailY + 8 : 0;

    const BUSTX = 2;                 /* the bone rim needs somewhere to go */
    const W = coreX + coreW + EXT + 5;
    const H = (art ? bustY + bustH + 2 : tailY + EXT) + 5;

    /* THE BLOW-UP. Pinned by the caller so the balloon is a fixed size
       rather than a fraction of whatever monitor it lands on — but a
       pinned two still has to FIT, so on a phone too narrow for it the
       blow-up drops rather than the balloon running off the edge. */
    const K = o.k
      ? Math.max(1, Math.min(o.k, Math.floor((o.maxW || 1e9) / W) || 1))
      : U.clamp(Math.floor((o.maxW || 1200) / W), 1, 4);

    const cv = document.createElement('canvas');
    cv.width = W * K; cv.height = H * K;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.save();
    c.scale(K, K);

    const body = kind === 'think' ? COOL : kind === 'whisper' ? DRY : FILL;
    const rad = kind === 'shout' ? 3 : 6;

    /* ---------- the silhouette, three times: shadow, ink, fill ----------
       A cartoon has a hard shadow and not a blur, so it is the same shape
       again, three down and four over, in one flat black. */
    const shape = (inf, col, dx, dy) => {
      c.save();
      if (dx || dy) c.translate(dx, dy);
      slab(c, coreX - inf, coreY - inf, coreW + inf * 2, coreH + inf * 2, rad + inf, col);
      if (kind === 'shout') {
        /* the spikes: four to a side at least, and they alternate long-short
           so it reads as torn rather than as a gear wheel */
        const nx = Math.max(4, Math.round(coreW / 22));
        for (let i = 0; i < nx; i++) {
          const px2 = coreX + Math.round((i + 0.5) * coreW / nx);
          const ln = (i % 2 ? 5 : 3) + inf;
          spikeV(c, px2, coreY - inf, 13, ln, -1, col);
          spikeV(c, px2, coreY + coreH - 1 + inf, 13, (i % 2 ? 3 : 5) + inf, 1, col);
        }
        const ny = Math.max(2, Math.round(coreH / 16));
        for (let i = 0; i < ny; i++) {
          const py2 = coreY + Math.round((i + 0.5) * coreH / ny);
          spikeH(c, coreX - inf, py2, 12, (i % 2 ? 5 : 3) + inf, -1, col);
          spikeH(c, coreX + coreW - 1 + inf, py2, 12, (i % 2 ? 3 : 5) + inf, 1, col);
        }
      } else if (kind === 'think') {
        /* lobes: a cloud is a rectangle with bites taken OUT of the flat
           and lumps put ON it, so the lumps ride the edge */
        const step = 13;
        for (let x = coreX + 6; x < coreX + coreW - 5; x += step) {
          PIX.disc(c, x, coreY, 5 + inf, col);
          PIX.disc(c, x + 6, coreY + coreH - 1, 5 + inf, col);
        }
        for (let y = coreY + 6; y < coreY + coreH - 5; y += step) {
          PIX.disc(c, coreX, y, 5 + inf, col);
          PIX.disc(c, coreX + coreW - 1, y, 5 + inf, col);
        }
      }
      /* THE TAIL, AND ONLY IF SOMEBODY SAID IT. A lock, a print kit and
         the case log get a caption box with no tail, because a tail is a
         claim about who is talking and none of them is talking. */
      if (art) {
        if (kind === 'think') {
          PIX.disc(c, tailX - 1, tailY + 4, 4 + inf, col);
          PIX.disc(c, tailX - 7, tailY + 11, 3 + inf, col);
          PIX.disc(c, tailX - 12, tailY + 16, 2 + inf, col);
        } else if (kind === 'shout') {
          /* a jag, not a cone: a shout comes out of him like a bolt */
          wedge(c, tailX, tailY - 1, 10, 7, 5, inf, col);
          wedge(c, tailX - 6, tailY + 6, 8, 8, -3, inf, col);
        } else {
          wedge(c, tailX, tailY - 1, 11, TAILL + 1, 8, inf, col);
        }
      }
      c.restore();
    };

    shape(2, 'rgba(8,6,14,.42)', 3, 4);
    shape(2, INK, 0, 0);
    shape(0, body, 0, 0);

    /* ---------- the light on it ----------
       One lit row inside the top edge, a two-row cel shade inside the
       bottom, and the inner right-hand edge dropped a step. A flat fill
       is a rectangle; this is an object. */
    slabBand(c, coreX, coreY, coreW, coreH, rad, 0, 1, LIT);
    slabBand(c, coreX, coreY, coreW, coreH, rad, coreH - 2, coreH, SHADE);
    for (let y = coreY + Math.round(coreH * 0.52); y < coreY + coreH - 2; y++) {
      PIX.rect(c, coreX + coreW - 3, y, 2, 1, SHADE);
    }
    /* a whisper is drawn with a dry pen: the ink is broken up, so the
       balloon reads as somebody keeping their voice down */
    if (kind === 'whisper') {
      for (let x = coreX - 2; x < coreX + coreW + 2; x += 4) {
        PIX.rect(c, x, coreY - 2, 2, 2, body);
        PIX.rect(c, x + 2, coreY + coreH, 2, 2, body);
      }
      for (let y = coreY - 2; y < coreY + coreH + 2; y += 4) {
        PIX.rect(c, coreX - 2, y, 2, 2, body);
        PIX.rect(c, coreX + coreW, y + 2, 2, 2, body);
      }
    }
    /* AND WHOSE LINE IT IS, IN THE EDGE. The mark's plate used to carry
       his colour on its rim; the balloon carries it as a hairline just
       inside the ink, which is the only place it can go without turning
       the whole thing into his colour. */
    if (o.rim) {
      slabBand(c, coreX + 1, coreY + 1, coreW - 2, coreH - 2, rad - 1, 0, 1, o.rim);
      slabBand(c, coreX + 1, coreY + 1, coreW - 2, coreH - 2, rad - 1, coreH - 3, coreH - 2, o.rim);
    }

    /* ---------- the name, on a tab tacked to the top edge ---------- */
    if (name) {
      const tw = strW(name), tabW = tw + 9, tabX = coreX + 4, tabY = coreY - TABH + 2;
      const fillCol = o.nameCol || P.G;
      PIX.rect(c, tabX + 1, tabY + 2, tabW, TABH, 'rgba(8,6,14,.38)');
      slab(c, tabX - 2, tabY - 2, tabW + 4, TABH + 4, 3, INK);
      slab(c, tabX, tabY, tabW, TABH, 2, fillCol);
      slabBand(c, tabX, tabY, tabW, TABH, 2, 0, 1, 'rgba(255,255,255,.34)');
      slabBand(c, tabX, tabY, tabW, TABH, 2, TABH - 1, TABH, 'rgba(0,0,0,.22)');
      /* ink on gold, bone on anything dark: a name you cannot read is a
         decoration, and two of the speakers in this game wear maroon */
      const dark = lum(fillCol) < 0.52;
      let x = tabX + 5;
      for (let i = 0; i < name.length; i++) {
        putGlyph(c, name[i], x, tabY + 2, dark ? P.W : INK);
        x += ADV;
      }
    }

    /* ---------- the words ----------
       The line is measured whole and painted in part: the balloon comes
       up the size it will END at and fills in, so the box never grows
       under the reader. And the last two characters to arrive sit a pixel
       high, which is the difference between a line appearing and a frog
       saying it. */
    const rev = (o.reveal === null || o.reveal === undefined) ? Infinity : o.reveal;
    let seen = 0, ty = coreY + PADY;
    lines.forEach(l => {
      let x = coreX + PADX;
      for (let i = 0; i < l.length; i++) {
        const at = seen + i;
        if (at >= rev) break;
        const fresh = rev !== Infinity && (rev - at) <= 2;
        putGlyph(c, l[i], x, ty + (fresh ? -1 : 0), TEXT);
        x += ADV;
      }
      seen += l.length;
      ty += LEAD;
    });

    /* ---------- and the prompt, with a chevron on it ---------- */
    if (foot) {
      const fw = strW(foot);
      const fx = coreX + coreW - PADX - fw, fy = coreY + coreH - PADY - CH + 1;
      let x = fx;
      for (let i = 0; i < foot.length; i++) { putGlyph(c, foot[i], x, fy, SOFT); x += ADV; }
      for (let i = 0; i < 4; i++) PIX.rect(c, fx - 8 + i, fy + 1 + i, 7 - i * 2, 1, SOFT);
    }

    /* ---------- the head, cut out and stuck in the corner ---------- */
    if (art) {
      /* HE BOUNCES WHILE HE TALKS. The mouth was already flapping; a head
         that flaps its mouth and never moves is a puppet, so he takes a
         pixel of hop on the same beat. */
      const hop = o.hop ? -1 : 0;
      PIX.rect(c, BUSTX + 3, bustY + bustH + 1, bustW - 6, 2, 'rgba(8,6,14,.34)');
      cutout(c, art, BUSTX, bustY + hop);
    }

    c.restore();
    cv.toonK = K;
    cv.toonW = W; cv.toonH = H;
    /* WHERE THE MARK GOES. The bang that pops when the line lands has to
       come off the top-right corner of the balloon and not off the corner
       of the canvas, which on a shout are six pixels apart. */
    cv.markAt = { x: (coreX + coreW - 6) * K, y: (coreY + 2) * K };
    return cv;
  }

  /* relative luminance, for deciding whether a name goes on in ink or bone */
  function lum(col) {
    const s = String(col);
    let r = 0, g = 0, b = 0;
    if (s[0] === '#' && s.length >= 7) {
      r = parseInt(s.slice(1, 3), 16); g = parseInt(s.slice(3, 5), 16); b = parseInt(s.slice(5, 7), 16);
    } else return 1;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  /* ============================================================
     THE MARKS.

     A cartoon says what somebody is feeling with a shape over
     their head, and it has done since Winsor McCay: a bang for
     surprise, a query for confusion, a bead of sweat for the
     thing you have just realised, four lines crossed on a
     forehead for the thing you are about to do about it. Drawn
     as pixel maps in the game's own palette, same as the props.
     ============================================================ */

  PIX.def('toon_bang', `
..KKKK..
.KYYYYK.
.KGGGGK.
.KGGGGK.
.KGGGGK.
..KGGK..
..KGGK..
..KGGK..
...KK...
........
..KKKK..
.KGGGGK.
.KGGGGK.
..KKKK..`);

  PIX.def('toon_query', `
..KKKK..
.KLLLLK.
KLLKKLLK
KLK..KLK
.....KLK
....KLK.
...KLK..
..KLK...
..KLLK..
..KKKK..
........
..KKKK..
.KLLLLK.
..KKKK..`);

  PIX.def('toon_sweat', `
...KK...
...KK...
..KLLK..
..KLLK..
.KWLLLK.
.KWLLLK.
KWLLLLLK
KWLLLLLK
KWLLLLLK
.KLLLLK.
..KKKK..`);

  PIX.def('toon_vein', `
.KK...KK.
KRRK.KRRK
KRRRKRRRK
.KRRRRRK.
..KRRRK..
.KRRRRRK.
KRRRKRRRK
KRRK.KRRK
.KK...KK.`);

  /* A STAR HAS A WAIST. The first cut was four arms of even width, which
     is a plus sign; a twinkle is concave between its points, so the arms
     have to flare where they meet. */
  PIX.def('toon_star', `
.....K.....
....KYK....
....KYK....
...KKYKK...
.KKYYYYYKK.
KYYYYYYYYYK
.KKYYYYYKK.
...KKYKK...
....KYK....
....KYK....
.....K.....`);

  PIX.def('toon_dots', `
.KK....KK....KK.
KWWK..KWWK..KWWK
KWWK..KWWK..KWWK
.KK....KK....KK.`);

  const MARKS = {
    bang: 'toon_bang', query: 'toon_query', sweat: 'toon_sweat',
    vein: 'toon_vein', star: 'toon_star', think: 'toon_dots',
  };

  /* ============================================================
     AND THE BANG ITSELF.

     A burst is the word with a torn star behind it, and both have
     to be built to fit the word, so it cannot be a pixel map. The
     star is a ring of spikes of alternating length with a dry
     jitter on each one — seeded off the word, so BANG is always
     the same BANG and never boils between frames.
     ============================================================ */
  const BURST = {};
  function burstArt(word, col) {
    const key = word + '|' + col;
    if (BURST[key]) return BURST[key];
    const txt = PIXFONT.render(word, { scale: 2, color: col || P.Y, outline: INK });
    const rx = Math.round(txt.width / 2) + 12, ry = Math.round(txt.height / 2) + 10;
    const W = rx * 2 + 20, H = ry * 2 + 20;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    const cx = W / 2, cy = H / 2;

    /* EVERY SPIKE DECIDED ONCE. The ink pass and the fill pass are the
       same star at two sizes, so they have to agree about where it went;
       drawing it twice from a live generator gave the outline a different
       set of spikes to the inside and the whole thing crawled. */
    const rng = U.mulberry32(U.hashSeed('burst:' + word));
    const N = 18, inner = 0.70;
    const spikes = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const long = (i % 2 === 0 ? 1.34 : 1.02) * (0.88 + rng() * 0.3);
      spikes.push({
        ax: cx + Math.cos(a) * rx * long, ay: cy + Math.sin(a) * ry * long,
        bx: cx + Math.cos(a + Math.PI * 2 / N) * rx * inner,
        by: cy + Math.sin(a + Math.PI * 2 / N) * ry * inner,
        px: cx + Math.cos(a - Math.PI / N) * rx * inner,
        py: cy + Math.sin(a - Math.PI / N) * ry * inner,
      });
    }
    const star = (inf, fill) => {
      spikes.forEach(s2 => tri(c, s2.px, s2.py, s2.ax, s2.ay, s2.bx, s2.by, inf, fill));
      PIX.disc(c, cx, cy, Math.round(Math.min(rx, ry) * inner) + inf + 1, fill);
    };
    star(2, INK);
    star(0, col || P.O);
    /* a hot core, so the word is not sat on the same flat as the rim */
    PIX.disc(c, cx, cy, Math.round(Math.min(rx, ry) * 0.52), P.Y);
    c.drawImage(txt, Math.round(cx - txt.width / 2), Math.round(cy - txt.height / 2));
    BURST[key] = cv;
    return cv;
  }

  /* a filled triangle out of horizontal spans — no paths, no antialiasing */
  function tri(c, x1, y1, x2, y2, x3, y3, inf, col) {
    const cx = (x1 + x2 + x3) / 3, cy = (y1 + y2 + y3) / 3;
    const g = (x, y) => inf ? [x + (x - cx) * 0.09 + Math.sign(x - cx) * inf,
      y + (y - cy) * 0.09 + Math.sign(y - cy) * inf] : [x, y];
    const p = [g(x1, y1), g(x2, y2), g(x3, y3)].sort((a, b) => a[1] - b[1]);
    const y0 = Math.round(p[0][1]), y2r = Math.round(p[2][1]);
    const at = (a, b, y) => a[0] + (b[0] - a[0]) * ((y - a[1]) / ((b[1] - a[1]) || 1));
    for (let y = y0; y <= y2r; y++) {
      const xa = at(p[0], p[2], y);
      const xb = y < p[1][1] ? at(p[0], p[1], y) : at(p[1], p[2], y);
      const l = Math.round(Math.min(xa, xb)), r = Math.round(Math.max(xa, xb));
      PIX.rect(c, l, y, Math.max(1, r - l + 1), 1, col);
    }
  }

  /* a dust curl: lobes with an ink line round them, lit on top */
  const PUFF = {};
  function puffArt(seed) {
    const key = 'p' + (seed % 6);
    if (PUFF[key]) return PUFF[key];
    const rng = U.mulberry32(U.hashSeed('puff:' + key));
    const R = 9, W = R * 4, H = R * 3;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const lobes = [];
    for (let i = 0; i < 5; i++) {
      lobes.push({ x: 7 + i * 6 + (rng() - 0.5) * 3, y: H - 8 - rng() * 9, r: 4 + rng() * 4 });
    }
    lobes.forEach(l => PIX.disc(c, l.x, l.y, l.r + 2, INK));
    lobes.forEach(l => PIX.disc(c, l.x, l.y, l.r, P.w));
    lobes.forEach(l => PIX.disc(c, l.x, l.y - 1, Math.max(1, l.r - 2), P.W));
    PUFF[key] = cv;
    return cv;
  }

  /* ============================================================
     THE LAYER.

     One canvas over the whole window, its own ticker, and the
     ticker stops dead the moment the list is empty — a cartoon
     layer that runs a requestAnimationFrame all night to draw
     nothing is a battery bug with a smile on it.

     Marks can be pinned to the SCREEN (over the balloon, over a
     button) or to the ROOM, in which case they are resolved
     through the camera every frame and ride along with it.
     ============================================================ */

  let lay = null, lc = null, items = [], raf = 0, last = 0;

  function layer() {
    if (lay && lay.isConnected) return lay;
    lay = document.getElementById('toon-lay');
    if (!lay) {
      lay = document.createElement('canvas');
      lay.id = 'toon-lay';
      document.body.appendChild(lay);
    }
    lc = lay.getContext('2d');
    lc.imageSmoothingEnabled = false;
    return lay;
  }

  function push(it) {
    it.t = 0;
    it.life = it.life || 900;
    it.k = it.k || 2;
    items.push(it);
    if (items.length > 40) items.splice(0, items.length - 40);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    return it;
  }

  /* the squash-and-stretch entrance, ON TWOS. Cartoons are not drawn at
     sixty frames a second and a pop that eases smoothly reads as CSS; six
     held poses in two hundred milliseconds reads as animation. */
  const POP = [0.34, 0.88, 1.32, 1.12, 0.94, 1.05];
  function popK(t) {
    const f = Math.floor(t / 34);
    return f < POP.length ? POP[f] : 1;
  }

  function tick(now) {
    raf = 0;
    const el = layer();
    const w = window.innerWidth, h = window.innerHeight;
    if (el.width !== w || el.height !== h) {
      el.width = w; el.height = h;
      lc = el.getContext('2d');
      lc.imageSmoothingEnabled = false;
    }
    const dt = Math.min(80, now - last);
    last = now;
    lc.clearRect(0, 0, w, h);
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.t += dt;
      if (it.t >= it.life) { items.splice(i, 1); continue; }
      const u = it.t / it.life;
      /* world-pinned marks ride the camera */
      if (it.wx !== undefined && typeof SCENE !== 'undefined' && SCENE.screenAt) {
        const s = SCENE.screenAt(it.wx, it.wy);
        if (s) {
          it.x = s.x; it.y = s.y;
          if (it.autoK) it.k = Math.max(2, Math.round(s.k * 0.6));
        }
      }
      const rise = it.vy ? it.vy * it.t * 0.06 : 0;
      const drift = it.vx ? it.vx * it.t * 0.06 : 0;
      lc.globalAlpha = u > 0.72 ? Math.max(0, 1 - (u - 0.72) / 0.28) : 1;
      if (it.paint) {
        it.paint(lc, it, u);
      } else {
        /* THE POSE IS ALREADY STEPPED, IN TIME. Rounding the SCALE as well
           -- to quarters, which the first cut did -- collapsed 0.88, 1.12,
           0.94 and 1.05 all onto 1.0 and threw the entire overshoot away:
           what was left was small, big, done. The destination rectangle is
           rounded to whole pixels, which is what keeps it crisp. */
        const s = it.pop === false ? 1 : popK(it.t);
        const dw = Math.max(1, Math.round(it.cv.width * it.k * s));
        const dh = Math.max(1, Math.round(it.cv.height * it.k * s));
        /* a MARK is on him, so it hangs by its bottom edge; a BANG is the
           thing that happened, so it sits on the point it is given */
        lc.drawImage(it.cv, Math.round(it.x + drift - dw / 2),
          Math.round(it.y + rise - (it.mid ? dh / 2 : dh)), dw, dh);
      }
    }
    lc.globalAlpha = 1;
    if (items.length) raf = requestAnimationFrame(tick);
  }

  /* ============================================================
     WHAT THE GAME CALLS.
     ============================================================ */

  const API = {

    /* a mark over a point on the SCREEN */
    mark(x, y, kind, o) {
      o = o || {};
      const nm = MARKS[kind] || MARKS.bang;
      const cv = PIX.make(nm, 1);
      if (!cv) return null;
      return push({ cv, x, y, k: o.k || 3, life: o.life || 820, vy: o.vy === undefined ? -0.5 : o.vy });
    },

    /* the same, over somebody standing in the room */
    markWorld(wx, wy, kind, o) {
      o = o || {};
      const nm = MARKS[kind] || MARKS.bang;
      const cv = PIX.make(nm, 1);
      if (!cv) return null;
      /* A MARK OVER A FROG HAS TO BE THE SIZE OF THE FROG. Pinned at three
         it came out as a sixteen-pixel tick beside a head a hundred pixels
         wide, so unless the caller says otherwise it takes its blow-up off
         the room's own scale, resolved with the camera every frame. */
      return push({ cv, wx, wy, x: 0, y: 0, k: o.k || 3, autoK: !o.k,
        life: o.life || 900, vy: o.vy === undefined ? -0.4 : o.vy });
    },

    /* BANG. POW. CRACK. */
    pow(x, y, word, col, o) {
      o = o || {};
      const cv = burstArt(String(word || 'BANG').toUpperCase(), col || P.O);
      return push({ cv, x, y, mid: true, k: o.k || 1.5, life: o.life || 620, vy: -0.12 });
    },

    /* dust off a heel, a coat, a body landing */
    puff(x, y, n, o) {
      o = o || {};
      const out = [];
      for (let i = 0; i < (n || 2); i++) {
        const cv = puffArt((Math.random() * 6) | 0);
        out.push(push({ cv, x: x + (Math.random() - 0.5) * 14, y: y + 4, k: o.k || 1.5,
          mid: true, life: 520 + Math.random() * 260, vy: -0.5 - Math.random() * 0.5,
          vx: (Math.random() - 0.5) * 1.6 }));
      }
      return out;
    },
    puffWorld(wx, wy, n, o) {
      o = o || {};
      const out = [];
      for (let i = 0; i < (n || 2); i++) {
        const cv = puffArt((Math.random() * 6) | 0);
        out.push(push({ cv, wx: wx + (Math.random() - 0.5) * 8, wy, x: 0, y: 0,
          k: o.k || 1.2, mid: true, life: 480 + Math.random() * 240,
          vy: -0.45 - Math.random() * 0.4, vx: (Math.random() - 0.5) * 1.4 }));
      }
      return out;
    },

    /* four-point stars off something that hurt */
    stars(x, y, n, o) {
      o = o || {};
      const out = [];
      for (let i = 0; i < (n || 3); i++) {
        const a = (i / (n || 3)) * Math.PI * 2 + Math.random();
        out.push(push({ cv: PIX.make('toon_star', 1), mid: true,
          x: x + Math.cos(a) * 16, y: y + Math.sin(a) * 12,
          k: o.k || 2, life: 460 + Math.random() * 200, vy: -0.8 }));
      }
      return out;
    },

    /* speed lines: somebody left in a hurry */
    zip(x, y, dir, o) {
      o = o || {};
      const d = dir < 0 ? -1 : 1, k = o.k || 2;
      const seed = U.mulberry32(U.hashSeed('zip:' + Math.round(x) + ':' + Math.round(y)));
      const rows = [];
      for (let i = 0; i < 4; i++) rows.push({ y: (i - 1.5) * 6, len: 14 + seed() * 20 });
      return push({
        x, y, life: o.life || 300, pop: false,
        paint(c, it, u) {
          c.save();
          c.translate(it.x, it.y);
          c.scale(k, k);
          rows.forEach((r, i) => {
            const len = Math.round(r.len * (1 - u * 0.55));
            const off = Math.round(u * 16) * d;
            PIX.rect(c, d < 0 ? -off - len : off, r.y - 1, len, 3, INK);
            PIX.rect(c, d < 0 ? -off - len : off, r.y, len, 1, i % 2 ? P.W : P.q);
          });
          c.restore();
        },
      });
    },

    /* a scene change takes its marks with it */
    clear() { items.length = 0; if (lc && lay) lc.clearRect(0, 0, lay.width, lay.height); },
    live() { return items.length; },

    /* the balloon */
    bubble, kindOf, markOf,
    /* and what a probe needs to see */
    INK, FILL, TEXT,
    debugBurst(word) { return burstArt(String(word).toUpperCase(), P.O); },
  };

  return API;
})();
