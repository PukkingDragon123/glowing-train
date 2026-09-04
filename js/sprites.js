'use strict';
/* ============================================================
   SHELL & DEBT — sprites.js
   Every piece of pixel art in the game, hand-drawn as text
   maps against the global palette, plus the procedural
   composers for the big set pieces (cylinder, cards, wheel).

   Palette letters: see PIX.PAL. '.' = transparent.
   Substitution letters 1/2/3 are re-mapped per variant.
   ============================================================ */

/* ---------------- shell cartridge (pouch view) 12x18 ---------------- */

const SHELL_TPL = `
....KKKK....
...K3311K...
..K331111K..
..K331111K..
..K311111K..
..K311111K..
..K311112K..
..K111112K..
..K111122K..
..K111122K..
..K112222K..
..KBGBBBBK..
..KbBBBBbK..
..KbBBBBbK..
..KubbbbuK..
.KKuuuuuuKK.
KbBBBBBBBBbK
.KKKKKKKKKK.`;

/* type marks stamped on the payload (5 wide, drawn at row 4) */
const SHELL_MARKS = {
  buck:   ['.K.K.', 'K.K.K', '.K.K.'],
  rust:   ['K..K.', '..K..', 'K..K.'],
  gilded: ['..YY.', '.YY..', 'YY...'],
  glass:  ['...WW', '..WW.', '.WW..'],
  web:    ['K.K.K', '.KKK.', 'K.K.K'],
  cursed: ['W.W..', '.....', 'WWW..'],
  magnet: ['K...K', 'K...K', '.KKK.'],
  dead:   ['..W..', '.WWW.', '..W..', '..W..'],
  feather:['...o.', '..o..', '.o...'],
};

/* 1: payload main · 2: payload shadow · 3: payload highlight */
const SHELL_COLORS = {
  live:    { 1: 'r', 2: 'd', 3: 'R' },
  blank:   { 1: 'w', 2: 'q', 3: 'W' },
  feather: { 1: 'W', 2: 'w', 3: 'W' },
  buck:    { 1: 'O', 2: 'o', 3: 'Y' },
  rust:    { 1: 'b', 2: 'u', 3: 'B' },
  gilded:  { 1: 'G', 2: 'h', 3: 'Y' },
  glass:   { 1: 'L', 2: 'l', 3: 'W' },
  web:     { 1: 'V', 2: 'v', 3: 'W' },
  cursed:  { 1: 's', 2: 'T', 3: 'S' },
  magnet:  { 1: 'M', 2: 'm', 3: 'W' },
  dead:    { 1: 'k', 2: 'Z', 3: 't' },
};

/* ---------------- small icons ---------------- */

PIX.def('ic_fire', `
......O.......
.....KOK......
....KOYOK.....
....KOYOK.....
...KOYYYOK....
..KOYYYYYOK...
..KOYWWYYOK...
.KOYYWWYYYOK..
.KOYWWWWYYOK..
.KoOYYYYYOoK..
..KoOOOOOoK...
...KKoooKK....`);

PIX.def('ic_dud', `
....KKKKK.....
..KKwwwwwKK...
.KwwWWWwwwwK..
.KwWWwwwwwwK..
KwWWwwwwwwwqK.
KwWwwwwwwwqqK.
KwwwwwwwwqqqK.
.KwwwwwwqqqK..
.KwwwwqqqqqK..
..KKqqqqqKK...
....KKKKK.....`);

PIX.def('ic_jam', `
.....KK..KK.....
..K.KssK.KsK.K..
.KsKKssKKssKKsK.
.KssssssssssssK.
..KssSSSSSSssK..
.KssSKKKKKKSssK.
.KsSKK....KKSsK.
.KsSK......KSsK.
.KsSKK....KKSsK.
.KssSKKKKKKSssK.
..KssSSSSSSssK..
.KssssssssssssK.
.KsKKssKKssKKsK.
..K.KssK.KssK...`);

PIX.def('ic_backfire', `
.......KK.......
...K..KRRK..K...
...KK.KRRK.KK...
....KRKRRKRK....
..KKKRRRRRRKKK..
.KRRRRYYYYRRRRK.
..KKRRYWWYRRKK..
..KKRRYWWYRRKK..
.KRRRRYYYYRRRRK.
..KKKRRRRRRKKK..
....KRKRRKRK....
...KK.KRRK.KK...
...K..KRRK..K...
.......KK.......`);

PIX.def('ic_eye', `
....KKKKKK....
..KKwwwwwwKK..
.KwwwKKKKwwwK.
KwwKKLLLLKKwwK
KwKKLLKKLLKKwK
KwwKKLLLLKKwwK
.KwwwKKKKwwwK.
..KKwwwwwwKK..
....KKKKKK....`);

PIX.def('ic_spin', `
...KKKKKK.....
..KNNNNNNK....
.KNNKKKKNNK...
.KNK...KKNKK..
.KNK..KNNNNNK.
.KNK...KNNNK..
........KNK...
.KNK.....K....
.KNNK.........
..KNNKKKKNNK..
...KNNNNNNK...
....KKKKKK....`);

PIX.def('ic_load', `
..KKKKKKKKKK..
.KssssssssssK.
.KsTTTTTTTTsK.
..KKKKKKKKKK..
.....KNNK.....
.....KNNK.....
..KNNKNNKNNK..
...KNNNNNNK...
....KNNNNK....
.....KNNK.....
......KK......`);

PIX.def('ic_heart', `
.KK...KK.
KRRK.KRRK
KRWRKRRRK
KRRRRRRRK
.KRRRRRK.
..KRRRK..
...KRK...
....K....`);

PIX.def('ic_heart_off', `
.KK...KK.
KTTK.KTTK
KTTTKTTTK
KTTTTTTTK
.KTTTTTK.
..KTTTK..
...KTK...
....K....`);

PIX.def('ic_bullet', `
.KKK.
KRRRK
KRRdK
KBBBK
KBGBK
KbBbK
KbBbK
KuuuK
.KKK.`);

PIX.def('ic_bullet_off', `
.KKK.
KtttK
KtttK
KtttK
KtttK
KtttK
KtttK
KTTTK
.KKK.`);

PIX.def('ic_diamond', `
...K...
..KNK..
.KNNNK.
KNNWNNK
.KNNNK.
..KNK..
...K...`);

PIX.def('ic_diamond_off', `
...K...
..KTK..
.KTTTK.
KTTTTTK
.KTTTK.
..KTK..
...K...`);

PIX.def('ic_chip', `
..KKKKKKKK..
.KRWRRRRWRK.
KRrRrrrrRrRK
.KKKKKKKKKK.
.KGWGGGGWGK.
KGgGggggGgGK
.KKKKKKKKKK.
.KWwWWWWwWK.
KwqwqqqqwqwK
.KKKKKKKKKK.`);

PIX.def('ic_coin', `
..KKKK..
.KGYGGK.
KGYGGghK
KGGGGghK
KGGGGghK
KhgggghK
.KhhhhK.
..KKKK..`);

PIX.def('ic_skull', `
..KKKKKK..
.KWWWWWWK.
KWWWWWWWWK
KWKKWWKKWK
KWKKWWKKWK
KWWWWWWWWK
.KWKWWKWK.
.KWWWWWWK.
..KWKWKW..
..KKKKKK..`);

PIX.def('ic_bank', `
.....KKKK.....
..KKKGGGKKK...
.KGGGGGGGGGK..
KGgKKKKKKKgGK.
KgK.......KgK.
KgK.KKKK..KgK.
KgK.KGGK..KgK.
KgK.KKKK..KgK.
KgK.......KgK.
KGgKKKKKKKgGK.
.KGGGGGGGGGK..
..KKKKKKKKK...`);

PIX.def('ic_pot', `
....KKKKK.....
..KKNNNNNKK...
.KNnNNNNNnNK..
.KKKKKKKKKKK..
..KGGGGGGGK...
.KGgGGGGGgGK..
.KKKKKKKKKKK..
..KWWWWWWWK...
.KwWWWWWWWwK..
.KKKKKKKKKKK..`);

PIX.def('ic_debt', `
....KKKKKK....
..KKrrrrrrKK..
.KrrrrrrrrrrK.
.KrrWWrrWWrrK.
KrrWKKrrKKWrrK
KrrWKKrrKKWrrK
.KrrrrrrrrrrK.
.KrrrWWWWrrrK.
.KrrWrWrWrrrK.
..KKrrrrrrKK..
....KKKKKK....`);

PIX.def('ic_crown', `
K...K...K...K
KK.KKK.KKK.KK
KGKGGGKGGGKGK
KGGGGGGGGGGGK
KGgGgGgGgGgGK
KGGGGGGGGGGGK
KKKKKKKKKKKKK`);

PIX.def('ic_flag', `
K.........
KWWWWWW...
KWrrrrW...
KWrrrrW...
KWWWWWW...
K.........
K.........
K.........`);

PIX.def('ic_sound_on', `
....K....KK..
...KK.K...KK.
..KWK..K.K.K.
KKKWK.K.K..K.
KWWWK.K.K..K.
KKKWK.K.K..K.
..KWK..K.K.K.
...KK.K...KK.
....K....KK..`);

PIX.def('ic_sound_off', `
....K...K..K.
...KK....KK..
..KWK....KK..
KKKWK...K..K.
KWWWK........
KKKWK...K..K.
..KWK....KK..
...KK....KK..
....K...K..K.`);

PIX.def('ic_help', `
..KKKKK..
.KGGGGGK.
KGGKKKGGK
KGK..KGGK
....KGGK.
...KGGK..
...KGK...
...KK....
...KGK...
...KKK...`);

/* ---------------- slot symbols 14x14 ---------------- */

PIX.def('sym_fire', `
......KK......
.....KOK......
....KOYOK.....
...KOYYOK.....
...KOYYYOK....
..KOYWWYYOK...
..KOYWWYYOK...
.KOYYWWYYYOK..
.KOYWWWWYYOK..
.KoOYYYYYOoK..
..KoOOOOOoK...
...KKoooKK....`);

PIX.def('sym_blank', `
....KKKKK.....
..KKwwwwwKK...
.KwWWWwwwwwK..
.KwWWwwwwwwK..
KwWWwwwwwwwwK.
KwWwwwwwwwqqK.
KwwwwwwwwqqqK.
.KwwwwwwqqqK..
.KwwwwqqqqqK..
..KKqqqqqKK...
....KKKKK.....`);

PIX.def('sym_bird', `
....KKKK......
..KKWWWWKK....
.KWWWWWWWWK...
.KWKWWWWWWK...
KWWWWWWWWWWKK.
KWWWWWWWWWKOK.
.KWWWWWWWWKK..
..KKWWWWKK....
....KKKK......
....KgK.......
....KgK.......
...KggK.......`);

PIX.def('sym_gold', `
.....KKKK.....
....KhhhhK....
...KhGGGGhK...
..KGGGGGGGGK..
.KGYGGGGGGgK..
.KGGGGGGGGgK..
.KGGGKKKGGgK..
.KGGKGGGKGgK..
.KGGGKKKGGgK..
.KGGGKGGGGgK..
..KGGGKGGgK...
...KhhhhhK....
....KKKKK.....`);

PIX.def('sym_web', `
K....KK....K
.K..KVVK..K.
..KVVVVVVK..
.KVKVVVVKVK.
KVVVKVVKVVVK
KVVVVKKVVVVK
KVVVVKKVVVVK
KVVVKVVKVVVK
.KVKVVVVKVK.
..KVVVVVVK..
.K..KVVK..K.
K....KK....K`);

PIX.def('sym_skull', `
..KKKKKKKK..
.KWWWWWWWWK.
KWWWWWWWWWWK
KWWKKWWKKWWK
KWWKKWWKKWWK
KWWWWWKWWWWK
.KWWWWWWWWK.
.KWKWKWKWK..
.KWWWWWWWWK.
..KKKKKKKK..`);

PIX.def('sym_seven', `
.KKKKKKKKK..
KRRRRRRRRRK.
KRrrrrrrRRK.
KKKKKKKRRK..
......KRRK..
.....KRRK...
....KRRK....
....KRRK....
...KRRK.....
...KRRK.....
...KKK......`);

/* ---------------- card suits ---------------- */

PIX.def('suit_spade', `
...K...
..KKK..
.KKKKK.
KKKKKKK
KKKKKKK
..KKK..
.KKKKK.`);
PIX.def('suit_heart', `
.KK.KK.
KKKKKKK
KKKKKKK
KKKKKKK
.KKKKK.
..KKK..
...K...`);
PIX.def('suit_diamond', `
...K...
..KKK..
.KKKKK.
KKKKKKK
.KKKKK.
..KKK..
...K...`);
PIX.def('suit_club', `
..KKK..
..KKK..
KK.K.KK
KKKKKKK
KK.K.KK
..KKK..
.KKKKK.`);

/* ---------------- chicken 14x12, 2 frames ---------------- */

const CHICK_RUN_1 = `
......KrrK......
......K11KKKO...
......K1111KK...
..KKK111111K....
.K1111111111K...
K11111111111K...
K21111111111K...
K22111111111K...
.K2211111111K...
..KK21111KK.....
....K11K.K1K....
....KgK...KgK...
...KggK...KggK..`;
const CHICK_RUN_2 = `
......KrrK......
......K11KKKO...
......K1111KK...
..KKK111111K....
.K1111111111K...
K11111111111K...
K21111111111K...
K22111111111K...
.K2211111111K...
..KK21111KK.....
.....K11K.......
.....KgKgK......
....KggKggK.....`;

const CHICK_COLORS = {
  white: { 1: 'W', 2: 'w' },
  brown: { 1: 'B', 2: 'b' },
  black: { 1: 's', 2: 't' },
  gold:  { 1: 'G', 2: 'g' },
};
Object.keys(CHICK_COLORS).forEach(c => {
  PIX.def('chick_' + c + '_1', CHICK_RUN_1, CHICK_COLORS[c]);
  PIX.def('chick_' + c + '_2', CHICK_RUN_2, CHICK_COLORS[c]);
});

/* chicken head portrait 12x12 */
const CHICK_HEAD = `
....KrrK....
...Kr11rK...
..KK1111K...
..K111111KK.
.K11K11111KO
.K1111111KKK
.K1111111K..
..K111111K..
..K211112K..
...K2112K...
....KKKK....`;
Object.keys(CHICK_COLORS).forEach(c =>
  PIX.def('head_' + c, CHICK_HEAD, CHICK_COLORS[c]));

/* ---------------- hammer & effects ---------------- */

PIX.def('hammer', `
..KKKKKK..
.KSSSSSSK.
.KSssssSK.
..KSssSK..
..KSssSK..
...KSsK...
...KSsK...
....KK....
...KGGK...
....KK....`);

PIX.def('flash_1', `
.......Y.......
......KYK......
...Y.KYYYK.Y...
....KYYWYYK....
..KYYWWWWWYYK..
Y.KYWWWWWWWYK.Y
..KYYWWWWWYYK..
....KYYWYYK....
...Y.KYYYK.Y...
......KYK......
.......Y.......`);
PIX.def('flash_2', `
....O.....O....
.....KOOOK.....
..O.KOYYYOK.O..
....KOYWYOK....
.O.KOYWWWYOK.O.
....KOYWYOK....
..O.KOYYYOK.O..
.....KOOOK.....
....O.....O....`);
PIX.def('flash_3', `
...o...o...
..K.KoK.K..
.o.KooK.o..
..KoooK....
.o.KoK...o.
....K......`);

PIX.def('puff_1', `
...KKKK....
..KSSSSK...
.KSSMMSSK..
.KSMMMMSK..
..KSSSSK...
...KKKK....`);
PIX.def('puff_2', `
..KKK..KK..
.KSSSKKSSK.
.KSMSSSSMK.
..KSSKSSK..
...KK..K...`);

PIX.def('spark_1', `
..K.K..
.KgGK..
K.GYG.K
.KGgK..
..K.K..`);

PIX.def('burst_red', `
...R....R...
..KRK..KRK..
.KRRRKKRRRK.
..KRWRRWRK..
.KRRWWWWRRK.
..KRWRRWRK..
.KRRRKKRRRK.
..KRK..KRK..
...R....R...`);

/* ---------------- charm tokens ---------------- */

const CHARM_BASE = `
....KKKKKKKK....
..KK11111111KK..
.K111222222111K.
.K112222222211K.
K11222222222211K
K12222222222221K
K12222222222221K
K12222222222221K
K12222222222221K
K11222222222211K
.K112222222211K.
.K111222222111K.
..KK11111111KK..
....KKKKKKKK....`;
const CHARM_RAR = {
  common:   { 1: 's', 2: 'T' },
  uncommon: { 1: 'n', 2: 'E' },
  rare:     { 1: 'v', 2: 'X' },
};
Object.keys(CHARM_RAR).forEach(r => PIX.def('charmbase_' + r, CHARM_BASE, CHARM_RAR[r]));

/* 8x8-ish glyphs, drawn centered on the token */
const CHARM_GLYPHS = {
  graveDancer: ['..WW..', '.WWWW.', '..WW..', '.RWWR.', 'R.WW.R', '..WW..', '.W..W.', 'W....W'],
  monocle:     ['.KKKK.', 'KGGGGK', 'KGWWGK', 'KGGGGK', '.KKKK.', '....KG', '....KG', '.....G'],
  rabbit:      ['.W..W.', '.W..W.', '.WWWW.', 'WWWWWW', 'WWKWKW', 'WWWWWW', '.WWWW.', '..WW..'],
  spider:      ['W.WW.W', '.WWWW.', 'WWKKWW', '.WWWW.', 'W.WW.W', '..WW..', '.W..W.', ''],
  horseshoe:   ['.GGGG.', 'GG..GG', 'G....G', 'G....G', 'G....G', 'G.KK.G', '', ''],
  houseKey:    ['.GGG..', 'G...G.', 'G...G.', '.GGG..', '..G...', '..GG..', '..G...', '..GG..'],
  whisperer:   ['..WW..', '.WWWW.', 'WWWWWO', 'WWWWW.', '.WWWW.', '..WW..', '..gg..', ''],
  vampire:     ['W....W', 'WW..WW', 'WWWWWW', '.WWWW.', '.W..W.', '.W..W.', '', ''],
  ironNerve:   ['SSSSSS', 'S....S', 'S.RR.S', 'S.RR.S', '.S..S.', '..SS..', '', ''],
  ashtray:     ['......', 'W.W.W.', '.W.W..', 'SSSSSS', 'S....S', '.SSSS.', '', ''],
  allIn:       ['..LL..', '.LLLL.', 'LLWWLL', 'LLLLLL', '.LLLL.', '..LL..', '', ''],
  secondWind:  ['.R..R.', 'RRRRRR', 'RRRRRR', '.RRRR.', '..RR..', '.R....', 'R.....', ''],
};

/* ---------------- boss / fate glyphs ---------------- */

const BOSS_GLYPHS = {
  blindfold: ['KKKKKKKK', 'KWWWWWWK', 'KWKWWKWK', 'KWWWWWWK', 'KKKKKKKK', '', '', ''],
  vig:       ['...R....', '..RRR...', '.RRRRR..', '.RRRRR..', 'RRRRRRR.', '.RRRRR..', '..RRR...', ''],
  spinner:   ['..SSS...', '.S...S..', 'S..S..S.', 'S.SSS.S.', 'S..S..S.', '.S...S..', '..SSS...', ''],
  croupier:  ['.KKKKK..', '.KKKKK..', 'KKKKKKK.', '.WWWWW..', '..WWW...', '', '', ''],
  collector: ['.bbbbbb.', 'b......b', 'bbbbbbbb', 'b.KGGK.b', 'b.KGGK.b', 'bbbbbbbb', '', ''],
  cage:      ['KKKKKKK.', 'K.K.K.K.', 'K.K.K.K.', 'K.K.K.K.', 'K.K.K.K.', 'KKKKKKK.', '', ''],
  lily:      ['........', 'RR...RR.', 'RRRRRRR.', '.RRRRR..', '..RRR...', '', '', ''],
  owner:     ['..VVVV..', '.VWWWWV.', 'VWWKKWWV', 'VWKKKKWV', '.VWKKWV.', '..VVVV..', '', ''],
};

const FATE_GLYPHS = {
  fireFever:    ['...O....', '..OO....', '..OYO...', '.OYYO...', '.OYWYO..', 'OYWWYO..', '.OYYO...', '..OO....'],
  bloodNight:   ['...R....', '...R....', '..RRR...', '.RRRRR..', '.RRRRR..', '.RRRRR..', '..RRR...', ''],
  highRoller:   ['.KKKKK..', '.KKKKK..', 'KKKKKKK.', '.GGGGG..', '..GGG...', '', '', ''],
  longTable:    ['KKKKKKKK', 'K......K', 'KKKKKKKK', '.K....K.', '.K....K.', '', '', ''],
  coldDeck:     ['...L....', '.L.L.L..', '..LLL...', 'LLLLLLL.', '..LLL...', '.L.L.L..', '...L....', ''],
  blanksParty:  ['..W.....', '.WWW....', 'WWWWW...', '.WWW.G..', '..W.G.G.', '....G...', '', ''],
  zeroHour:     ['..KKK...', '.KVVVK..', 'KV...VK.', 'KV...VK.', 'KV...VK.', '.KVVVK..', '..KKK...', ''],
  houseBlinks:  ['.KK.KK..', 'KWWKKKK.', 'KWKK....', '.KK.KK..', '', '', '', ''],
};

/* ---------------- neon signs 22x14 ---------------- */

function neonSign(name, glyphRows, col) {
  const w = 22, h = 16;
  const rows = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      if (y === 0 || y === h - 1 || x === 0 || x === w - 1) row += 'K';
      else if (y === 1 || y === h - 2 || x === 1 || x === w - 2) row += 'T';
      else row += 'Z';
    }
    rows.push(row.split(''));
  }
  const gh = glyphRows.filter(r => r.length).length;
  const gw = Math.max(...glyphRows.map(r => r.length));
  const ox = Math.floor((w - gw) / 2), oy = Math.floor((h - gh) / 2);
  glyphRows.forEach((r, j) => {
    for (let i = 0; i < r.length; i++) {
      if (r[i] !== '.' && r[i] !== ' ' && r[i] !== '') rows[oy + j][ox + i] = col;
    }
  });
  PIX.def(name, rows.map(r => r.join('')).join('\n'));
}

neonSign('sign_slots', ['.NNNNN.', '.....N.', '....N..', '...N...', '..N....', '..N....', '..N....'], 'N');
neonSign('sign_bj',    ['..PP...', '.PPPP..', 'PPPPPP.', 'PPPPPP.', '..PP...', '.PPPP..'], 'P');
neonSign('sign_wheel', ['..GGG..', '.G.G.G.', 'G..G..G', 'GGGGGGG', 'G..G..G', '.G.G.G.', '..GGG..'], 'G');
neonSign('sign_derby', ['...OO..', '..OOOO.', 'OOOOOO.', 'OOOOOOO', '.OOOO..', '..O.O..'], 'O');
neonSign('sign_pawn',  ['.V...V.', 'V.V.V.V', '.V...V.', '...V...', '..V.V..', '...V...'], 'V');

/* ============================================================
   SPR — composed / procedural sprites
   ============================================================ */

const SPR = {

  cache: {},

  cached(key, builder) {
    if (!SPR.cache[key]) SPR.cache[key] = builder();
    return SPR.cache[key];
  },

  clone(master, scale, cls) {
    const cv = document.createElement('canvas');
    cv.width = master.width * scale; cv.height = master.height * scale;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(master, 0, 0, cv.width, cv.height);
    cv.className = 'pix' + (cls ? ' ' + cls : '');
    return cv;
  },

  /* cartridge sprite for a shell type */
  shellMaster(id) {
    return SPR.cached('shell_' + id, () => {
      const name = '_shell_' + id;
      PIX.def(name, SHELL_TPL, SHELL_COLORS[id] || SHELL_COLORS.live);
      const base = PIX.make(name, 1);
      const cv = document.createElement('canvas');
      cv.width = base.width; cv.height = base.height;
      const ctx = cv.getContext('2d');
      ctx.drawImage(base, 0, 0);
      const mark = SHELL_MARKS[id];
      if (mark) {
        mark.forEach((row, j) => {
          for (let i = 0; i < row.length; i++) {
            const c = row[i];
            if (c !== '.' && c !== ' ') {
              ctx.fillStyle = PIX.PAL[c] || PIX.PAL.K;
              ctx.fillRect(3 + i, 3 + j, 1, 1);
            }
          }
        });
      }
      return cv;
    });
  },

  shellEl(id, scale, cls) { return SPR.clone(SPR.shellMaster(id), scale, cls); },

  /* chamber-view back of a shell: colored ring, brass base, primer, type mark */
  backMaster(id) {
    return SPR.cached('back_' + id, () => {
      const P = PIX.PAL;
      const col = SHELL_COLORS[id] || SHELL_COLORS.live;
      const cv = document.createElement('canvas');
      cv.width = 20; cv.height = 20;
      const ctx = cv.getContext('2d');
      PIX.disc(ctx, 10, 10, 9, P.K);
      PIX.disc(ctx, 10, 10, 8, P[col[2]] || P.d);  // dark ring shade
      PIX.disc(ctx, 9, 9, 7, P[col[1]] || P.r);    // colored ring
      PIX.disc(ctx, 9, 9, 6, P[col[3]] || P.R);    // ring highlight
      PIX.disc(ctx, 10, 10, 6, P[col[1]] || P.r);
      PIX.disc(ctx, 10, 10, 4, P.h);               // brass base
      PIX.disc(ctx, 10, 11, 3, P.g);
      PIX.disc(ctx, 9, 9, 2, P.B);
      PIX.disc(ctx, 10, 10, 1, P.K);               // primer
      ctx.fillStyle = P.Y; ctx.fillRect(9, 9, 1, 1);
      const mark = SHELL_MARKS[id];
      if (mark) {
        const rows = mark.filter(r => r.length);
        const gw = Math.max(...rows.map(r => r.length));
        const ox = Math.floor((20 - gw) / 2);
        const oy = Math.floor((20 - rows.length) / 2);
        ctx.globalAlpha = 0.85;
        rows.forEach((row, j) => {
          for (let i = 0; i < row.length; i++) {
            const c = row[i];
            if (c !== '.' && c !== ' ') {
              ctx.fillStyle = c === 'K' ? P.K : (P[c] || P.W);
              ctx.fillRect(ox + i, oy + j, 1, 1);
            }
          }
        });
        ctx.globalAlpha = 1;
      }
      return cv;
    });
  },

  hiddenMaster() {
    return SPR.cached('back_hidden', () => {
      const cv = document.createElement('canvas');
      cv.width = 20; cv.height = 20;
      const ctx = cv.getContext('2d');
      PIX.disc(ctx, 10, 10, 9, PIX.PAL.K);
      PIX.disc(ctx, 10, 10, 8, PIX.PAL.T);
      PIX.disc(ctx, 9, 9, 7, PIX.PAL.t);
      PIX.disc(ctx, 10, 11, 6, PIX.PAL.T);
      // little '?'
      ctx.fillStyle = PIX.PAL.q;
      [[8,6],[9,5],[10,5],[11,6],[11,7],[10,8],[10,9],[10,12]]
        .forEach(([x,y]) => ctx.fillRect(x, y, 1, 1));
      return cv;
    });
  },

  /* charm token */
  charmMaster(id) {
    return SPR.cached('charm_' + id, () => {
      const c = CHARMS[id];
      const base = PIX.make('charmbase_' + (c ? c.rarity : 'common'), 1);
      const cv = document.createElement('canvas');
      cv.width = base.width; cv.height = base.height;
      const ctx = cv.getContext('2d');
      ctx.drawImage(base, 0, 0);
      const glyph = CHARM_GLYPHS[id];
      if (glyph) {
        const rows = glyph.filter(r => r.length);
        const gw = Math.max(...rows.map(r => r.length));
        const ox = Math.floor((16 - gw) / 2), oy = Math.floor((16 - rows.length) / 2);
        rows.forEach((row, j) => {
          for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch !== '.' && ch !== ' ') {
              ctx.fillStyle = PIX.PAL[ch] || PIX.PAL.W;
              ctx.fillRect(ox + i, oy + j, 1, 1);
            }
          }
        });
      }
      return cv;
    });
  },

  charmEl(id, scale, cls) { return SPR.clone(SPR.charmMaster(id), scale, cls); },

  /* boss / fate emblem on a banner shield */
  emblemMaster(kind, id) {
    return SPR.cached('emb_' + kind + '_' + id, () => {
      const cv = document.createElement('canvas');
      cv.width = 16; cv.height = 16;
      const ctx = cv.getContext('2d');
      const edge = kind === 'boss' ? PIX.PAL.d : PIX.PAL.v;
      const fill = kind === 'boss' ? PIX.PAL.D : PIX.PAL.X;
      PIX.panel(ctx, 1, 1, 14, 14, fill, PIX.PAL.K, edge);
      const glyph = (kind === 'boss' ? BOSS_GLYPHS : FATE_GLYPHS)[id];
      if (glyph) {
        const rows = glyph.filter(r => r.length);
        const gw = Math.max(...rows.map(r => r.length));
        const ox = Math.floor((16 - gw) / 2), oy = Math.floor((16 - rows.length) / 2);
        rows.forEach((row, j) => {
          for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch !== '.' && ch !== ' ') {
              ctx.fillStyle = PIX.PAL[ch] || PIX.PAL.W;
              ctx.fillRect(ox + i, oy + j, 1, 1);
            }
          }
        });
      }
      return cv;
    });
  },

  emblemEl(kind, id, scale, cls) { return SPR.clone(SPR.emblemMaster(kind, id), scale, cls); },

  /* playing card 26x36 */
  cardMaster(rank, suit, faceUp) {
    const key = 'card_' + (faceUp ? rank + suit : 'back');
    return SPR.cached(key, () => {
      const w = 26, h = 36;
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      if (!faceUp) {
        PIX.panel(ctx, 1, 1, w - 2, h - 2, PIX.PAL.d, PIX.PAL.K, PIX.PAL.r);
        PIX.dither(ctx, 5, 5, w - 10, h - 10, PIX.PAL.d, PIX.PAL.r);
        PIX.frame(ctx, 4, 4, w - 8, h - 8, PIX.PAL.K);
        return cv;
      }
      PIX.panel(ctx, 1, 1, w - 2, h - 2, PIX.PAL.W, PIX.PAL.K, PIX.PAL.w);
      const red = suit === '♥' || suit === '♦';
      const col = red ? PIX.PAL.r : PIX.PAL.K;
      const suitName = { '♠': 'suit_spade', '♥': 'suit_heart', '♦': 'suit_diamond', '♣': 'suit_club' }[suit];
      // corner rank
      const t = PIXFONT.render(rank, { scale: 1, color: col });
      ctx.drawImage(t, 2, 2);
      // center suit, tinted
      const sm = PIX.make(suitName, 1);
      const tint = document.createElement('canvas');
      tint.width = sm.width; tint.height = sm.height;
      const tctx = tint.getContext('2d');
      tctx.drawImage(sm, 0, 0);
      tctx.globalCompositeOperation = 'source-in';
      tctx.fillStyle = col;
      tctx.fillRect(0, 0, tint.width, tint.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tint, Math.round((w - sm.width * 2) / 2), Math.round(h / 2 - sm.height + 2), sm.width * 2, sm.height * 2);
      return cv;
    });
  },

  cardEl(rank, suit, faceUp, scale) {
    return SPR.clone(SPR.cardMaster(rank, suit, faceUp), scale, 'pcard-pix');
  },

  /* the revolver cylinder — drawn fresh each frame onto a ctx.
     opts: {cx, cy, r, rot (rad), holes, ptr, blind, flashFrame} */
  drawCylinder(ctx, o) {
    const { cx, cy, r } = o;
    // drop shadow
    PIX.disc(ctx, cx + 3, cy + 5, r, 'rgba(0,0,0,.45)');
    // body
    PIX.disc(ctx, cx, cy, r, PIX.PAL.K);
    PIX.disc(ctx, cx, cy, r - 2, PIX.PAL.t);
    PIX.disc(ctx, cx - 2, cy - 3, r - 5, PIX.PAL.s);
    PIX.disc(ctx, cx + 1, cy + 1, r - 9, PIX.PAL.t);
    PIX.disc(ctx, cx, cy, r - 14, PIX.PAL.T);
    PIX.ring(ctx, cx, cy, r - 2, PIX.PAL.T);
    PIX.studs(ctx, cx, cy, r - 7, 12, PIX.PAL.T, PIX.PAL.S);
    // holes
    const hr = Math.round(r * 0.26);
    const hd = Math.round(r * 0.6);
    for (let i = 0; i < 6; i++) {
      const a = o.rot + (i * Math.PI / 3) - Math.PI / 2;
      const hx = Math.round(cx + Math.cos(a) * hd);
      const hy = Math.round(cy + Math.sin(a) * hd);
      PIX.disc(ctx, hx, hy, hr + 2, PIX.PAL.K);
      PIX.disc(ctx, hx, hy, hr, PIX.PAL.Z);
      PIX.disc(ctx, hx + 1, hy + 1, hr - 2, '#05060a');
      const h = o.holes[i];
      if (h) {
        const master = (h.revealed && !o.blind) ? SPR.backMaster(h.inst.id) : SPR.hiddenMaster();
        const s = Math.max(1, Math.floor((hr * 2 - 6) / master.width));
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(master, hx - (master.width * s >> 1), hy - (master.height * s >> 1),
          master.width * s, master.height * s);
      }
      if (i === o.ptr && o.holes[i]) {
        PIX.ring(ctx, hx, hy, hr + 1, PIX.PAL.G);
        PIX.ring(ctx, hx, hy, hr + 2, PIX.PAL.h);
      }
    }
    // hub
    PIX.disc(ctx, cx, cy, Math.round(r * 0.2), PIX.PAL.K);
    PIX.disc(ctx, cx, cy, Math.round(r * 0.2) - 2, PIX.PAL.s);
    PIX.disc(ctx, cx - 1, cy - 2, Math.round(r * 0.2) - 5, PIX.PAL.S);
    PIX.disc(ctx, cx, cy, 2, PIX.PAL.T);
  },

  /* the roulette wheel — per-pixel segment fill; rot in radians */
  drawWheel(ctx, cx, cy, r, rot, segColors, ballAngle, ballDist) {
    PIX.disc(ctx, cx + 2, cy + 3, r + 4, 'rgba(0,0,0,.4)');
    PIX.disc(ctx, cx, cy, r + 4, PIX.PAL.K);
    PIX.disc(ctx, cx, cy, r + 2, PIX.PAL.u);
    PIX.disc(ctx, cx, cy, r, PIX.PAL.U);
    const n = segColors.length;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d2 = x * x + y * y;
        if (d2 > (r - 2) * (r - 2) || d2 < 36) continue;
        let a = Math.atan2(y, x) - rot + Math.PI / 2;
        a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const seg = Math.floor(a / (Math.PI * 2) * n) % n;
        const border = (a / (Math.PI * 2) * n) % 1;
        ctx.fillStyle = (border < 0.045 || border > 0.955) ? PIX.PAL.h : segColors[seg];
        ctx.fillRect(cx + x, cy + y, 1, 1);
      }
    }
    PIX.disc(ctx, cx, cy, 6, PIX.PAL.K);
    PIX.disc(ctx, cx, cy, 4, PIX.PAL.g);
    PIX.disc(ctx, cx - 1, cy - 1, 2, PIX.PAL.G);
    if (ballAngle !== undefined) {
      const bx = Math.round(cx + Math.cos(ballAngle) * ballDist);
      const by = Math.round(cy + Math.sin(ballAngle) * ballDist);
      PIX.disc(ctx, bx, by, 2, PIX.PAL.K);
      PIX.disc(ctx, bx, by, 1, PIX.PAL.W);
    }
  },
};

/* ============================================================
   THE FROG MOB — procedural portrait builder.
   One consistent face rig (eye bulbs, heavy lids, wide frown,
   suit) with per-character skin, weight and accessories, so
   the whole cast stays on-model. Fat toads get real jowls.
   ============================================================ */

/* ============================================================
   THE WARDROBE — layered garment data.

   Every entry of COSTUMES is PURE DATA describing which layers
   exist and which PIX.PAL letters they wear. SPR.costumeOf(def)
   resolves a frog def (either the new `costume` key or the legacy
   suit/shirt/tie/bowtie/vest keys) into one normalised outfit
   object, which SPR.buildBody / SPR.buildFrog render back-to-front:

     torso -> shirt(+collar,placket,buttons) -> waistcoat ->
     neckwear -> jacket/overcoat(lapels,buttons,pockets) ->
     accessories -> sleeves -> cuffs

   Layer fields (all optional):
     jacket / overcoat  col dark lapel(notch|peak|shawl|none) lapelW
                        satin dbl buttons rows gorge open openBot close
                        stripe pockets(welt|patch|flap) buttonCol
     waistcoat          col dark top close buttons buttonCol stripe
     gown               col dark neckline(sweetheart|halter)
     shirt              col collar(point|spread|wing|band) cuff studs rolled
     neck               type(tie|bowtie|cravat|none) col pat(stripe|dot) loose
     acc                pocketSquare boutonniere watchChain chainLong braces
                        armGarters epaulets badge belt gloves stole cummerbund
                        sash lapelPin pearls radio apron
   ============================================================ */

/* rough perceived brightness of a palette letter (0..255) */
function palLum(letter) {
  const hex = PIX.PAL[letter] || '#000000';
  const r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16),
        b = parseInt(hex.substr(5, 2), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114);
}

/* one darker partner per palette letter, for shadow sides / stripes */
const DARKER = {
  K: 'K', k: 'K', Z: 'K',
  W: 'w', w: 'q', q: 'k',
  G: 'g', g: 'h', h: 'H', H: 'K',
  R: 'r', r: 'd', d: 'D', D: 'K',
  F: 'f', f: 'e', e: 'E', E: 'K',
  S: 's', s: 't', t: 'T', T: 'k',
  B: 'b', b: 'u', u: 'U', U: 'K',
  N: 'n', n: 'e', P: 'p', p: 'X',
  V: 'v', v: 'X', X: 'k',
  O: 'o', o: 'u', Y: 'G',
  L: 'l', l: 't', M: 'm', m: 's',
};

const COSTUMES = {

  /* 1 — three-piece chalk pinstripe: waistcoat + notch lapels + tie */
  pinstripe: {
    label: 'PINSTRIPE 3-PIECE', tintable: true, era: 'fedora',
    jacket: { col: 't', lapel: 'notch', lapelW: 5, buttons: 2, gorge: 5, open: 15,
              close: 27, stripe: 'chalk', pockets: 'welt' },
    waistcoat: { col: 'T', top: 8, close: 21, buttons: 4, buttonCol: 'q' },
    shirt: { col: 'W', collar: 'point' },
    neck: { type: 'tie', col: 'd', pat: 'stripe' },
    acc: { pocketSquare: 'W', watchChain: 'G' },
  },

  /* 2 — six-button double-breasted, peak lapels, big shoulders */
  doubleBreast: {
    label: 'DOUBLE-BREASTED', tintable: true, era: 'fedora', shoulder: 4,
    jacket: { col: 'k', lapel: 'peak', lapelW: 6, dbl: true, buttons: 3, rows: 2,
              gorge: 5, open: 17, close: 20, pockets: 'flap' },
    shirt: { col: 'W', collar: 'spread' },
    neck: { type: 'tie', col: 'G', pat: 'dot' },
    acc: { pocketSquare: 'W', lapelPin: 'G' },
  },

  /* 3 — dinner jacket: shawl lapel, wing collar, bowtie, cummerbund */
  tux: {
    label: 'DINNER JACKET', tintable: false, era: 'tophat',
    jacket: { col: 'k', dark: 'K', lapel: 'shawl', lapelW: 6, satin: true, buttons: 1,
              gorge: 4, open: 19, close: 33, pockets: 'welt' },
    shirt: { col: 'W', collar: 'wing', studs: 'K' },
    neck: { type: 'bowtie', col: 'K' },
    acc: { cummerbund: 'k', boutonniere: 'W', pocketSquare: 'W' },
  },

  /* 4 — white tie: tailcoat cut away, waistcoat, sash, watch chain */
  tails: {
    label: 'WHITE TIE & TAILS', tintable: false, era: 'tophat', shoulder: 2,
    jacket: { col: 'k', dark: 'K', lapel: 'peak', lapelW: 6, satin: true, buttons: 0,
              gorge: 4, open: 18, openBot: 10, close: 46, pockets: null },
    waistcoat: { col: 'W', dark: 'w', top: 7, close: 20, buttons: 3, buttonCol: 'q' },
    shirt: { col: 'W', collar: 'wing', studs: 'q' },
    neck: { type: 'bowtie', col: 'W' },
    acc: { sash: 'd', watchChain: 'G', boutonniere: 'R', pearls: null },
  },

  /* 5 — the don's overcoat: fat pinstripe double-breasted, fur collar */
  donCoat: {
    label: 'DON\'S OVERCOAT', tintable: true, era: 'fedora', pad: 4, shoulder: 5,
    overcoat: { col: 'k', dark: 'K', lapel: 'peak', lapelW: 8, big: true, dbl: true,
                buttons: 3, rows: 2, gorge: 5, open: 19, close: 24, stripe: 'chalk',
                pockets: 'flap', fur: 'T', stormFlap: true },
    waistcoat: { col: 'D', top: 8, close: 19, buttons: 4, buttonCol: 'G' },
    shirt: { col: 'W', collar: 'spread' },
    neck: { type: 'tie', col: 'G', pat: 'dot' },
    acc: { pocketSquare: 'W', watchChain: 'G', lapelPin: 'G' },
  },

  /* 6 — belted overcoat, collar up, shirt + tie underneath */
  trench: {
    label: 'BELTED OVERCOAT', tintable: true, era: 'fedora', pad: 3, shoulder: 3,
    overcoat: { col: 'q', dark: 'k', lapel: 'notch', lapelW: 7, big: true, dbl: true,
                buttons: 2, rows: 2, gorge: 6, open: 16, close: 22, pockets: 'flap',
                stormFlap: true },
    shirt: { col: 'w', collar: 'point' },
    neck: { type: 'tie', col: 'd' },
    acc: { belt: 'u' },
  },

  /* 7 — no jacket: shirt, braces, arm garters, sleeves rolled */
  shirtsleeves: {
    label: 'SHIRTSLEEVES', tintable: false, era: 'flatcap',
    shirt: { col: 'W', collar: 'point', rolled: true, cuff: 'W' },
    neck: { type: 'tie', col: 'd', loose: true },
    waistcoat: { col: 't', dark: 'T', buttons: 5, outer: true },
    acc: { braces: 'T', armGarters: 'd' },
  },

  /* 8 — house livery: waistcoat over shirt, arm garters, bowtie, apron */
  croupier: {
    label: 'HOUSE LIVERY', tintable: false, era: 'visor',
    waistcoat: { col: 'd', dark: 'D', top: 6, close: 18, buttons: 4, buttonCol: 'G',
                 outer: true },
    shirt: { col: 'W', collar: 'band', cuff: 'W' },
    neck: { type: 'bowtie', col: 'K' },
    acc: { armGarters: 'G', apron: 'q', watchChain: null },
  },

  /* 9 — warden's tunic: brass buttons, epaulets, patch pockets, belt */
  uniform: {
    label: 'WARDEN TUNIC', tintable: true, era: 'flatcap', shoulder: 2,
    jacket: { col: 'e', dark: 'E', lapel: 'none', buttons: 4, dbl: true, rows: 2,
              gorge: 3, open: 5, close: 6, pockets: 'patch', buttonCol: 'G' },
    shirt: { col: 'w', collar: 'band' },
    neck: { type: 'none' },
    acc: { epaulets: 'G', belt: 'U', badge: 'G' },
  },

  /* 10 — evening gown, long gloves, fur stole, pearls */
  gown: {
    label: 'EVENING GOWN', tintable: true, era: 'none',
    gown: { col: 'd', dark: 'D', neckline: 'sweetheart' },
    neck: { type: 'none' },
    acc: { gloves: 'W', stole: 'W', pearls: 'W' },
  },

  /* 11 — zoot: huge shoulders, enormous peak lapels, long chain */
  zoot: {
    label: 'ZOOT SUIT', tintable: true, era: 'fedora', shoulder: 6, pad: 1,
    jacket: { col: 'X', lapel: 'peak', lapelW: 8, buttons: 1, gorge: 6, open: 20,
              close: 32, stripe: 'chalk', pockets: 'flap' },
    shirt: { col: 'W', collar: 'spread' },
    neck: { type: 'tie', col: 'R', pat: 'stripe' },
    acc: { chainLong: 'G', pocketSquare: 'R' },
  },

  /* 12 — Swamp PD: tunic, brass buttons, badge, shoulder radio, belt */
  cop: {
    label: 'SWAMP PD', tintable: false, era: 'flatcap', shoulder: 2,
    jacket: { col: 't', dark: 'T', lapel: 'none', buttons: 4, dbl: false,
              gorge: 3, open: 5, close: 6, pockets: 'patch', buttonCol: 'G' },
    shirt: { col: 'l', collar: 'band' },
    neck: { type: 'none' },
    acc: { epaulets: 'S', belt: 'K', badge: 'M', radio: 'T' },
  },

  /* 13 — cheap shabby sack suit, frayed hem, sad little tie */
  shabby: {
    label: 'CHEAP SUIT', tintable: true, era: 'flatcap',
    jacket: { col: 'b', lapel: 'notch', lapelW: 4, buttons: 3, gorge: 7, open: 12,
              close: 21, pockets: 'patch', frayed: true, wrinkles: true },
    shirt: { col: 'w', collar: 'point' },
    neck: { type: 'tie', col: 'U', loose: true },
    acc: {},
  },

  /* 14 — plain single-breasted sack suit (the workaday default) */
  sack: {
    label: 'SACK SUIT', tintable: true, era: 'fedora',
    jacket: { col: 'T', lapel: 'notch', lapelW: 5, buttons: 2, gorge: 5, open: 14,
              close: 25, pockets: 'welt' },
    shirt: { col: 'W', collar: 'point' },
    neck: { type: 'tie', col: 'd' },
    acc: { pocketSquare: null },
  },

  /* 15 — sober 3-piece with a spread collar and a fat watch chain */
  threePiece: {
    label: 'THREE PIECE', tintable: true, era: 'bowler',
    jacket: { col: 'u', dark: 'U', lapel: 'notch', lapelW: 5, buttons: 3, gorge: 5,
              open: 14, close: 26, pockets: 'welt' },
    waistcoat: { col: 'U', top: 8, close: 20, buttons: 5, buttonCol: 'G' },
    shirt: { col: 'w', collar: 'spread' },
    neck: { type: 'cravat', col: 'T' },
    acc: { watchChain: 'G', lapelPin: 'G' },
  },
};

/* which wardrobe a procedural opponent may draw from, by rank */
const COSTUME_POOL = {
  mook: ['shabby', 'sack', 'sack', 'shabby', 'shirtsleeves', 'threePiece'],
  capo: ['pinstripe', 'sack', 'doubleBreast', 'threePiece', 'zoot', 'trench'],
  boss: ['doubleBreast', 'tux', 'tails', 'trench', 'uniform', 'zoot', 'cop',
         'pinstripe', 'donCoat'],
};

/* ---- resolver: def -> concrete outfit ---- */

function costumeClone(src) {
  const out = {};
  for (const k in src) {
    const v = src[k];
    out[k] = (v && typeof v === 'object' && !Array.isArray(v)) ? costumeClone(v) : v;
  }
  return out;
}

/* legacy defs (no `costume` key) still have to look like somebody */
function legacyCostume(d) {
  if (d.suit === 'stripes') return 'zoot';
  if (d.bowtie) return d.visor ? 'croupier' : 'tux';
  if (d.vest) return 'threePiece';
  if (d.braces) return 'shirtsleeves';
  return 'sack';
}

SPR.costumeOf = function (d) {
  const legacy = !d || !d.costume || !COSTUMES[d.costume];
  const id = legacy ? legacyCostume(d || {}) : d.costume;
  const C = costumeClone(COSTUMES[id] || COSTUMES.sack);
  C.id = id;
  d = d || {};

  /* fill in the dark partner of every garment colour */
  ['jacket', 'overcoat', 'waistcoat', 'gown'].forEach(k => {
    if (C[k] && !C[k].dark) C[k].dark = DARKER[C[k].col] || 'K';
  });
  if (!C.acc) C.acc = {};

  /* the suit letter tints the outermost tailored layer */
  const suitLetter = (typeof d.suit === 'string' && d.suit !== 'stripes' && PIX.PAL[d.suit])
    ? d.suit : null;
  if (suitLetter && C.tintable) {
    const tgt = C.overcoat || C.jacket || C.gown;
    if (tgt) { tgt.col = suitLetter; tgt.dark = DARKER[suitLetter] || 'K'; }
    if (C.waistcoat && !C.waistcoat.outer) {
      C.waistcoat.col = DARKER[suitLetter] || 'T';
      C.waistcoat.dark = DARKER[C.waistcoat.col] || 'K';
    }
  }
  if (d.suit === 'stripes') {
    const t = C.overcoat || C.jacket;
    if (t) t.stripe = 'chalk';
  }
  if (d.shirt && PIX.PAL[d.shirt] && C.shirt) C.shirt.col = d.shirt;

  /* neckwear from the legacy keys */
  if (d.bowtie && PIX.PAL[d.bowtie]) {
    C.neck = { type: 'bowtie', col: d.bowtie, loose: !!d.loosened };
  } else if (d.tie && PIX.PAL[d.tie]) {
    if (C.neck && C.neck.type === 'cravat') C.neck.col = d.tie;
    else C.neck = { type: 'tie', col: d.tie, pat: (C.neck && C.neck.pat) || null,
                    loose: !!d.loosened || !!(C.neck && C.neck.loose) };
  } else if (legacy && (d.tie === null || d.tie === undefined) && !d.bowtie) {
    C.neck = { type: 'none' };
  }
  if (d.loosened && C.neck) C.neck.loose = true;

  /* a legacy `vest` trait bolts a waistcoat onto anything */
  if (d.vest && !C.waistcoat) {
    C.waistcoat = { col: 'd', dark: 'D', top: 8, close: 20, buttons: 4, buttonCol: 'G' };
    if (!C.acc.watchChain) C.acc.watchChain = 'G';
  }
  /* braces only read as braces when there is no coat over them — the legacy
     `braces` trait on a def that also wears a jacket would otherwise paint
     suspenders straight across a buttoned coat front */
  if (d.braces && !C.acc.braces && !C.jacket && !C.overcoat && !C.gown) C.acc.braces = 'T';
  if (d.badge && !C.acc.badge) C.acc.badge = 'L';
  return C;
};

/* ============================================================
   THE CLOSED HAND — the one that hangs off a sleeve.

   Nine pixels across and ten down, which at room scale is about
   a fifth of the width of his head: the size a hand actually is.
   Built the way a hand is built rather than as a blob with lines
   on it — a squarish back with four knuckles across the top of
   it, four digits curling under, a pad on the end of each, and a
   thumb crossing the front. Every pose below is the same hand
   with the digits moved, so a fist and a pointing finger are
   recognisably the same frog's hand.
   ============================================================ */
SPR.handPose = function (ctx, x, y, d, sgn, pose, opts) {
  const P = PIX.PAL;
  opts = opts || {};
  const skin = P[(d.skin && d.skin[0]) || 'F'] || P.F;
  const shade = P[(d.skin && d.skin[1]) || 'f'] || P.f;
  const dark = P[(d.skin && d.skin[2]) || 'e'] || P.e;
  const INK = P.K;
  const LIT = 'rgba(255,255,255,.20)';
  const f = sgn < 0 ? -1 : 1;            // outward: away from his body
  /* A HAND IS A FRACTION OF A SHOULDER. The rig used to draw this at a fixed
     nine pixels whatever size the body was, so when the body came down to
     human proportions the hands stayed the size of dinner plates. k scales
     the row tables and everything hung off them. */
  const K = opts.k === undefined ? 1 : Math.max(0.4, opts.k);
  const q = (n) => Math.max(1, Math.round(n * K));

  if (!opts.noCuff) {                    // the sleeve the wrist comes out of
    const cuffC = SPR.cuffColor ? SPR.cuffColor(d) : (P[d.shirt] || P.W);
    PIX.rect(ctx, x - q(4), y - q(6), q(8), q(5), INK);
    PIX.rect(ctx, x - q(3), y - q(6), q(6), q(4), cuffC);
    PIX.rect(ctx, x - q(3), y - q(6), q(6), 1, 'rgba(255,255,255,.18)');
    PIX.rect(ctx, x - q(3), y - q(3), q(6), 1, 'rgba(0,0,0,.30)');
    if (opts.link) PIX.rect(ctx, x + f * q(2) - 1, y - q(5), q(2), q(2), P.G);
  }

  /* ROW TABLES, not a loop of digits.
     Each entry is [inward, outward] in pixels from the wrist centre, so the
     whole hand mirrors on f and every silhouette is deliberate. At this size
     — nine across, ten down, about a fifth of the width of his head — a hand
     is a rounded mass with three grooves in it and a thumb on the near side.
     Anything more detailed than that turns to soup the moment the room
     scales it, and anything less is the cabbage this used to be. */
  /* ROUNDER. These tables used to hold a flat four-and-four for four rows
     running, which is a nine-wide rectangle with a chamfer on it -- at room
     scale a little green brick on the end of each arm. A hand is a BALL
     with digits curled into it, so every table now bows: narrow at the
     wrist, widest a third of the way down, narrow again at the fingertips,
     one step at a time so the edge stays a circle and not a diamond. */
  const SIL = {
    hang:  [[2, 2], [4, 4], [5, 5], [5, 6], [5, 6], [5, 6], [5, 5], [4, 4], [3, 3], [2, 2]],
    fist:  [[2, 3], [4, 5], [5, 6], [6, 7], [6, 7], [5, 6], [4, 5], [2, 3]],
    point: [[2, 2], [4, 4], [5, 10], [5, 11], [5, 5], [4, 4], [3, 3], [2, 2]],
    grip:  [[2, 4], [4, 6], [5, 7], [5, 8], [5, 8], [5, 7], [4, 5], [2, 3]],
  };
  const raw = SIL[pose] || SIL.hang;
  /* the table, scaled and de-duplicated: at k = 0.6 two source rows land on
     the same output row, and drawing both just wastes fills */
  const rows = K === 1 ? raw : (() => {
    const out = [];
    const n = Math.max(4, Math.round(raw.length * K));
    for (let i = 0; i < n; i++) {
      const r = raw[Math.min(raw.length - 1, Math.round(i / K))];
      out.push([q(r[0]), q(r[1])]);
    }
    return out;
  })();
  const N = rows.length;
  const lo = (i) => x - f * rows[i][0], hi = (i) => x + f * rows[i][1];
  const at = (i) => {
    const a = Math.min(lo(i), hi(i)), b = Math.max(lo(i), hi(i));
    return { a, w: b - a + 1 };
  };

  /* the ink pass: one row taller and one wider all round, so the hand keeps
     its own outline even against a black coat */
  for (let i = -1; i <= N; i++) {
    const r = at(U.clamp(i, 0, N - 1));
    PIX.rect(ctx, r.a - 1, y + i, r.w + 2, 1, INK);
  }
  /* the fill, shaded down the length: the back of the hand catches the lamp,
     the curled digits underneath are in its shadow */
  for (let i = 0; i < N; i++) {
    const r = at(i), t = i / (N - 1);
    PIX.rect(ctx, r.a, y + i, r.w, 1, t > 0.62 ? shade : skin);
    if (i === 0) PIX.rect(ctx, r.a, y + i, r.w, 1, LIT);
    PIX.rect(ctx, f < 0 ? r.a : r.a + r.w - 1, y + i, 1,
      1, t > 0.5 ? dark : shade);                     /* the far edge rolls off */
  }

  if (pose === 'hang' || pose === 'fist') {
    /* THE KNUCKLES, four bumps along the outward edge, and the grooves
       between the digits curling under them. This is the whole read: a fist
       is knuckles-then-grooves, a relaxed hand is the same thing softer. */
    const kx = x + f * q(pose === 'fist' ? 4 : 3);
    const kstep = Math.max(1, q(2));
    for (let k = 0; k < 4 && 1 + k * kstep < N; k++) {
      const ky = y + 1 + k * kstep;
      PIX.rect(ctx, kx, ky, 1, 1, pose === 'fist' ? 'rgba(255,255,255,.30)' : LIT);
      PIX.rect(ctx, kx, ky + 1, 1, 1, dark);
    }
    const g0 = y + q(pose === 'fist' ? 4 : 5);
    for (let g = 0; g < 3; g++) {
      PIX.rect(ctx, x + f * q(g * 2 - 2), g0, 1, Math.max(1, N - (g0 - y) - 1), dark);
    }
    /* the pads on the ends of the curled digits */
    for (let g = 0; g < 3; g++) {
      PIX.rect(ctx, x + f * q(g * 2 - 1), y + N - 2, 1, 1, shade);
    }
  } else if (pose === 'point') {
    /* one digit out level, a pad on the end of it, the rest folded away */
    PIX.rect(ctx, x + f * 5, y + 2, 1, 2, LIT);
    PIX.rect(ctx, x + f * 9, y + 2, 1, 2, 'rgba(255,255,255,.28)');
    PIX.rect(ctx, x + f * 4, y + 4, 1, 3, dark);
    PIX.rect(ctx, x - f, y + 4, 1, 3, dark);
    PIX.rect(ctx, x + f, y + 4, 1, 3, dark);
  } else {
    /* GRIP: the digits run across the front of whatever he is holding, so
       what you see is four stacked bands with the gaps between them */
    for (let k = 0; k < 4; k++) {
      const ky = y + 1 + k * 2;
      PIX.rect(ctx, x, ky, f * 6, 1, shade);
      PIX.rect(ctx, x, ky + 1, f * 6, 1, dark);
      PIX.rect(ctx, x + f * 5, ky, 1, 1, LIT);
    }
  }

  /* THE THUMB, on the near side, crossing the front of the hand. Two pixels
     wide with a pad on it: the one part of a hand that is unmistakable at
     any size, and the reason a mitten reads as a mitten. */
  const tx = x - f * (rows[Math.min(2, N - 1)][0] + 1);
  const ty = y + q(pose === 'grip' ? 1 : 2);
  const tw = Math.max(1, q(2)), th = Math.max(2, q(4));
  PIX.rect(ctx, tx - 1, ty - 1, tw + 2, th + 2, INK);
  PIX.rect(ctx, tx - (f < 0 ? tw - 1 : 0), ty, tw, th, skin);
  PIX.rect(ctx, tx - (f < 0 ? tw - 1 : 0), ty, 1, th, LIT);
  PIX.rect(ctx, tx - 1, ty + th, tw + 2, 2, INK);
  PIX.rect(ctx, tx - (f < 0 ? tw - 1 : 0), ty + th, tw, 1, shade);

  /* the freckling the rest of him has, seeded the same way */
  const hr = SPR.defRng(d);
  for (let i = 0; i < (K < 0.8 ? 1 : 3); i++) {
    PIX.rect(ctx, x + Math.round((hr() - 0.5) * q(5)),
      y + 1 + Math.floor(hr() * q(4)), 1, 1, shade);
  }

  if (opts.dim) {
    /* A HAND AT HIS SIDE IS IN HIS SHADOW. Left at full skin value it is the
       brightest thing on a noir figure and reads as a green blob at hip
       height, which is exactly what it looked like. */
    for (let i = -1; i <= N; i++) {
      const r = at(U.clamp(i, 0, N - 1));
      PIX.rect(ctx, r.a, y + i, r.w, 1, 'rgba(0,0,0,' + opts.dim + ')');
    }
  }

  if (d.rings) {
    PIX.rect(ctx, x - f * q(2), y + q(4), q(2), q(2), INK);
    PIX.rect(ctx, x - f * q(2), y + q(4), q(2), 1, P.G);
  }
  if (d.knuckles) {                      /* brass, over the knuckle row */
    for (let k = 0; k < 4 && 1 + k * q(2) < N; k++) {
      PIX.rect(ctx, x + f * q(3) - (f < 0 ? 1 : 0), y + 1 + k * q(2), q(2), q(2), INK);
      PIX.rect(ctx, x + f * q(3) - (f < 0 ? 1 : 0), y + 1 + k * q(2), q(2), 1, P.G);
    }
  }
};

/* ============================================================
   THE FROG HAND — four fingers, each ending in a fat round toe
   pad, webbing between them. Drawn splayed on the felt, seen
   from the player's low angle. Used by the seated mark, the
   corpse and the cops.
   sgn: -1 left hand, +1 right hand (thumb side flips)

   POSES. The splayed fan is a hand lying ON something: it was
   the only pose there was, and hung off the end of a standing
   frog's sleeve it read as a cabbage — a bright green fan of
   digits at hip height on every body in the game. A hand that is
   not resting on anything is CLOSED, and it is small: about a
   fifth of the width of his head. So the fan stays for the felt
   and everything else gets a real one.

     splay  flat on the felt, digits fanned      (the default)
     hang   at his side, loosely curled          (standing rig)
     fist   shut, knuckles out                   (angry, punching)
     point  index out, the rest curled           (accusing)
     grip   wrapped round something              (a glass, a gun)
   ============================================================ */
SPR.frogHand = function (ctx, x, y, d, sgn, opts) {
  const P = PIX.PAL;
  opts = opts || {};
  const skin = P[d.skin[0]] || P.F;
  const shade = P[d.skin[1]] || P.f;
  const dark = P[d.skin[2]] || P.e;
  const INK = P.K;
  const pose = opts.pose || (opts.grip ? 'grip' : 'splay');
  const grip = pose === 'grip' || !!opts.grip;
  if (pose !== 'splay') {
    SPR.handPose(ctx, x, y, d, sgn, pose, opts);
    return;
  }

  /* sleeve cuff the wrist comes out of */
  if (!opts.noCuff) {
    const cuffC = SPR.cuffColor ? SPR.cuffColor(d) : (P[d.shirt] || P.W);
    PIX.rect(ctx, x - 5, y - 9, 10, 5, INK);
    PIX.rect(ctx, x - 4, y - 9, 8, 4, cuffC);
    PIX.rect(ctx, x - 4, y - 6, 8, 1, 'rgba(0,0,0,.3)');
    PIX.rect(ctx, x - 4, y - 9, 8, 1, 'rgba(255,255,255,.18)');
    if (opts.link) PIX.rect(ctx, x + sgn * 3 - 1, y - 8, 2, 2, P.G);
  }

  /* back of the hand */
  PIX.disc(ctx, x, y - 1, 6, INK);
  PIX.disc(ctx, x, y - 1, 5, skin);
  /* the same freckling the rest of him has, seeded the same way */
  const hr = SPR.defRng(d);
  for (let i = 0; i < 5; i++) {
    const a = hr() * Math.PI * 2, rr = Math.sqrt(hr()) * 3.4;
    PIX.rect(ctx, Math.round(x + Math.cos(a) * rr), Math.round(y - 1 + Math.sin(a) * rr), 1, 1, shade);
  }
  PIX.rect(ctx, x - sgn * 2 - 1, y - 4, 3, 2, 'rgba(255,255,255,.30)');  // knuckle, wet
  PIX.rect(ctx, x - sgn * 2 - 1, y - 5, 2, 1, 'rgba(255,255,255,.16)');
  SPR.ellipse(ctx, x, y + 2, 5, 2, shade);                              // palm heel

  /* four fingers — outer two shorter, splayed like a fan, fat toe pads */
  const F = grip ? [[-4, 2], [-1, 3], [2, 3], [5, 2]]
                 : [[-5, 3], [-2, 5], [2, 5], [5, 3]];
  F.forEach(([fx, len], i) => {
    const bx = x + fx * (sgn < 0 ? -1 : 1);
    if (i > 0) {                                    // webbing between digits
      const px = x + F[i - 1][0] * (sgn < 0 ? -1 : 1);
      const lo = Math.min(bx, px), wdt = Math.abs(bx - px);
      PIX.rect(ctx, lo, y, wdt, 3, INK);
      PIX.rect(ctx, lo, y, wdt, 2, dark);
    }
    PIX.rect(ctx, bx - 2, y - 1, 4, len + 2, INK);            // digit ink
    PIX.rect(ctx, bx - 1, y - 1, 2, len + 1, skin);           // digit
    PIX.disc(ctx, bx, y + len + 1, 3, INK);                   // toe pad
    PIX.disc(ctx, bx, y + len + 1, 2, skin);
    PIX.rect(ctx, bx - 1, y + len, 1, 1, 'rgba(255,255,255,.3)');
    PIX.rect(ctx, bx - 1, y + len + 3, 2, 1, dark);           // pad shadow
  });

  if (d.rings) {
    PIX.rect(ctx, x - sgn * 3 - 1, y + 1, 3, 2, INK);
    PIX.rect(ctx, x - sgn * 3 - 1, y + 1, 3, 1, P.G);
    PIX.rect(ctx, x + sgn * 2 - 1, y, 3, 2, INK);
    PIX.rect(ctx, x + sgn * 2 - 1, y, 3, 1, P.G);
  }
  if (d.knuckles) {
    for (let k = -1; k <= 1; k++) {
      PIX.rect(ctx, x + k * 4 - 1, y - 3, 3, 3, INK);
      PIX.rect(ctx, x + k * 4 - 1, y - 3, 2, 2, P.G);
    }
  }
};

/* colour the duel scene should use for the visible cuff at the wrist */
SPR.cuffColor = function (d) {
  d = d || {};
  const C = SPR.costumeOf(d);
  if (C.acc.gloves) return PIX.PAL[C.acc.gloves] || PIX.PAL.W;
  if (C.shirt && C.shirt.rolled) {
    return PIX.PAL[(d.skin && d.skin[0]) || 'F'] || PIX.PAL.F;
  }
  const l = (C.shirt && (C.shirt.cuff || C.shirt.col)) || d.shirt || 'W';
  return PIX.PAL[l] || PIX.PAL.W;
};

/* the outermost garment colour — handy for confetti / silhouettes */
SPR.outerColor = function (d) {
  const C = SPR.costumeOf(d);
  const g = C.overcoat || C.jacket || C.gown ||
    (C.waistcoat && C.waistcoat.outer ? C.waistcoat : null) || C.shirt;
  return PIX.PAL[(g && g.col) || 'T'] || PIX.PAL.T;
};

/* ============================================================
   FIRST PERSON — your own two hands on your side of the felt.

   Deliberately the SAME hand the rest of the cast has, only
   nearer and flipped so the digits point away from the lens. A
   bespoke giant hand was tried twice and read as furniture at
   every size; and your hands should look like a frog's hands.
   ============================================================ */

/* one step up the palette — the near field needs a rim light or the
   whole thing silts up into a single green mass */
const LIGHTER = {
  K: 'k', k: 'T', W: 'Y', w: 'W', q: 'w',
  G: 'Y', g: 'G', h: 'g', H: 'h',
  R: 'O', r: 'R', d: 'r', D: 'd',
  F: 'N', f: 'F', e: 'f', E: 'e',
  S: 'M', s: 'S', t: 's', T: 't',
  B: 'W', b: 'B', u: 'b', U: 'u',
  N: 'L', n: 'N', P: 'W', p: 'P', V: 'L', v: 'V', X: 'v',
  O: 'Y', o: 'O', Y: 'W', L: 'W', l: 'L', M: 'W', m: 'M', Z: 'K',
};

/* a stepped tapered tube between two points: the one primitive every
   near-field limb is built from. Ink pass, then fill pass, stepped along
   whichever axis it travels furthest on — so it can run diagonally
   without ever laying down an anti-aliased edge. */
SPR.povTube = function (ctx, x0, y0, x1, y1, w0, w1, col, dk, lt, stripe) {
  const dx = x1 - x0, dy = y1 - y0;
  const horiz = Math.abs(dx) >= Math.abs(dy);
  const span = Math.abs(horiz ? dx : dy);
  if (!span) return;
  const st = (horiz ? dx : dy) < 0 ? -1 : 1;
  const at = (i) => {
    const t = i / span, e = t * t * 0.32 + t * 0.68;
    return {
      a: (horiz ? x0 : y0) + i * st,
      b: Math.round(horiz ? y0 + dy * e : x0 + dx * e),
      w: Math.max(3, Math.round(w0 + (w1 - w0) * t)),
    };
  };
  const bar = (a, lo, len, col) => horiz
    ? PIX.rect(ctx, a, lo, 1, len, col)
    : PIX.rect(ctx, lo, a, len, 1, col);
  for (let i = -1; i <= span + 1; i++) {
    const q = at(U.clamp(i, 0, span));
    bar(q.a, q.b - (q.w >> 1) - 1, q.w + 2, PIX.PAL.K);
  }
  for (let i = 0; i <= span; i++) {
    const q = at(i), hw = q.w >> 1, roll = Math.max(2, (q.w * 0.28) | 0);
    bar(q.a, q.b - hw, q.w, col);
    if (dk) bar(q.a, q.b + hw - roll, roll, dk);
    if (lt) bar(q.a, q.b - hw, 2, lt);
    if (stripe && q.w > 12) [-4, 3].forEach(o => bar(q.a, q.b + o, 1, stripe));
  }
};

/* the shirt cuff at the wrist — a band, not a big pale box */
SPR.povCuff = function (ctx, cx, cy, d, sgn) {
  const P = PIX.PAL, INK = P.K;
  const cuffC = P[d.cuff] || SPR.cuffColor(d);
  PIX.rect(ctx, cx - 12, cy - 4, 25, 9, INK);
  PIX.rect(ctx, cx - 11, cy - 3, 23, 7, cuffC);
  PIX.rect(ctx, cx - 11, cy + 1, 23, 3, 'rgba(0,0,0,.34)');
  PIX.rect(ctx, cx - 11, cy - 3, 23, 1, 'rgba(255,255,255,.20)');
  PIX.rect(ctx, cx + sgn * 7, cy - 1, 4, 4, INK);
  PIX.rect(ctx, cx + sgn * 7, cy - 1, 3, 3, P.G);
};

/* ============================================================
   YOUR OWN HAND, NEAR THE LENS.

   The far-field hand rig scaled up read as a bunch of grapes:
   round pads, round knuckles, round palm. Nothing this close to
   the camera should be a circle. This one is BLOCKS — every
   part is an axis-aligned rectangle, ink pass then fill pass,
   so it stays a drawing at any size.

   Origin is the WRIST. Digits reach away from you, up the
   screen. sgn +1 is your right hand, -1 your left; the whole
   thing mirrors about the wrist.
   ============================================================ */
SPR.povPaw = function (ctx, cx, cy, d, sgn, k, grip) {
  const P = PIX.PAL, INK = P.K;
  const skin = P[d.skin[0]] || P.F, shade = P[d.skin[1]] || P.f, dark = P[d.skin[2]] || P.e;
  const flip = sgn < 0 ? -1 : 1;
  const R = (x, y, w, h, col) => {
    const x0 = flip < 0 ? -(x + w) : x;
    PIX.rect(ctx, cx + Math.round(x0 * k), cy + Math.round(y * k),
      Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)), col);
  };

  /* One hand, four ways to hold it. 'grip' is a legacy boolean from the
     table rig; everything else names a pose. */
  const mode = grip === true ? 'grip' : (grip || 'open');
  const LEN = mode === 'grip' ? [6, 8, 8, 6]
    : mode === 'flat' ? [13, 14, 14, 12]
      : mode === 'one' ? [4, 17, 4, 4]                 // the one he means
        : [10, 14, 13, 9];
  const DX = mode === 'flat' ? [-11, -6, -1, 4] : [-11, -5, 1, 7];
  const tips = LEN.map(l => -14 - l);

  /* ---- one ink silhouette under the lot ---- */
  const mass = (col, g) => {
    R(-11 - g, -14 - g, 22 + g * 2, 18 + g * 2, col);              // back of the hand
    R(-9 - g, 3 - g, 18 + g * 2, 7 + g * 2, col);                  // wrist
    DX.forEach((dx, i) => {
      R(dx - g, tips[i] - g, 5 + g * 2, LEN[i] + 3 + g * 2, col);  // the digit
      R(dx - 1 - g, tips[i] - 4 - g, 7 + g * 2, 5 + g * 2, col);   // and its pad
    });
    R(10 - g, -9 - g, 7 + g * 2, 9 + g * 2, col);                  // thumb, two steps
    R(14 - g, -14 - g, 6 + g * 2, 7 + g * 2, col);
  };
  mass(INK, 1);
  mass(skin, 0);

  /* ---- webbing: a stepped wedge between every pair of digits ---- */
  for (let i = 0; i < 3; i++) {
    const a = DX[i] + 5, w = DX[i + 1] - a;
    if (w <= 0) { R(DX[i + 1] - 1, tips[i + 1], 1, LEN[i + 1] + 3, 'rgba(0,0,0,.28)'); continue; }
    for (let r = 0; r < 4; r++) R(a, -14 - r, w, 1, r < 2 ? dark : shade);
  }

  /* ---- the light. It is over the table and behind you, so the near
     edge of every part is lit and the far edge rolls off. ---- */
  R(-11, -14, 3, 18, 'rgba(255,255,255,.13)');
  R(6, -14, 5, 18, 'rgba(0,0,0,.26)');
  R(-11, 1, 22, 3, 'rgba(0,0,0,.20)');
  DX.forEach((dx, i) => {
    R(dx, tips[i], 2, LEN[i] + 3, 'rgba(255,255,255,.12)');
    R(dx + 3, tips[i], 2, LEN[i] + 3, 'rgba(0,0,0,.22)');
    R(dx - 1, tips[i] - 4, 7, 1, 'rgba(255,255,255,.16)');
    R(dx - 1, tips[i], 7, 1, 'rgba(0,0,0,.24)');
  });
  R(10, -9, 2, 9, 'rgba(255,255,255,.12)');
  R(15, -14, 5, 1, 'rgba(255,255,255,.14)');

  /* ---- knuckles: three squared ridges across the back of it ---- */
  for (let i = 0; i < 4; i++) {
    R(DX[i], -16, 5, 2, shade);
    R(DX[i], -17, 5, 1, 'rgba(255,255,255,.16)');
  }
  R(-11, -12, 22, 1, 'rgba(0,0,0,.16)');

  /* ---- freckling, seeded off him, in blocks and not dots ---- */
  const rng = SPR.defRng(d);
  for (let i = 0; i < 7; i++) {
    R(Math.round(-9 + rng() * 16), Math.round(-11 + rng() * 13), 2, 2, shade);
  }
  if (d.rings) {
    R(DX[0] - 1, tips[0] + 5, 7, 3, INK);
    R(DX[0] - 1, tips[0] + 5, 7, 2, P.G);
    R(DX[3] - 1, tips[3] + 4, 7, 3, INK);
    R(DX[3] - 1, tips[3] + 4, 7, 2, P.g);
  }
};

/* kept as the name every call site already uses */
SPR.povHand = function (ctx, cx, cy, d, sgn, k, grip) {
  SPR.povPaw(ctx, cx, cy, d, sgn, k, grip);
};

/* ============================================================
   THE RAG.

   DUEL.reach carried a `rag: true` flag from the day the trail
   was added and NOTHING ever read it, so going over a stain on
   the boards was done with a bare green fist and a two-pixel
   vibration. This is the cloth: a bunched mass over the knuckles
   with folds in it and a hem that hangs below the hand, and it
   takes the colour up as you use it -- `soak` from 0 to 1 walks
   it from grey linen to something you would not want to hold.

   Drawn AFTER the hand, because the hand is holding it.
   cx, cy is the same wrist the paw was drawn at. k matches the
   hand's k so the two are the same size.
   ============================================================ */
SPR.povRag = function (ctx, cx, cy, k, sgn, soak) {
  k = k || 0.6;
  soak = U.clamp(soak || 0, 0, 1);
  /* IT IS HELD, NOT WORN. At fifty-six by forty it covered the whole fist
     and came out as a bread roll with two green fingertips on top of it;
     the cloth is smaller than the hand and hangs off the FRONT of it, so
     the knuckles still read and you can see what is doing the wiping. */
  const w = Math.max(9, Math.round(38 * k));
  const h = Math.max(7, Math.round(24 * k));
  const x0 = Math.round(cx - (sgn < 0 ? w * 0.66 : w * 0.34));
  const y0 = Math.round(cy + h * 0.16);
  /* linen, going over to blood */
  const mix = (a, b) => Math.round(a + (b - a) * soak);
  const lit = 'rgb(' + mix(214, 150) + ',' + mix(208, 40) + ',' + mix(190, 52) + ')';
  const mid = 'rgb(' + mix(168, 106) + ',' + mix(162, 24) + ',' + mix(144, 34) + ')';
  const dk = 'rgb(' + mix(112, 62) + ',' + mix(106, 14) + ',' + mix(92, 22) + ')';
  const INK = PIX.PAL.K;
  /* the bunched mass: three overlapping lumps, so the silhouette is cloth
     and not a folded napkin */
  const lump = (fx, fy, rx, ry, col) =>
    SPR.ellipse(ctx, x0 + Math.round(w * fx), y0 + Math.round(h * fy),
      Math.max(2, Math.round(w * rx)), Math.max(2, Math.round(h * ry)), col);
  lump(0.44, 0.44, 0.52, 0.50, INK);
  lump(0.78, 0.62, 0.28, 0.36, INK);
  lump(0.44, 0.42, 0.48, 0.44, mid);
  lump(0.78, 0.60, 0.24, 0.30, mid);
  lump(0.34, 0.28, 0.32, 0.24, lit);
  /* folds: two creases running out of the grip */
  for (let i = 0; i < 2; i++) {
    const fy = y0 + Math.round(h * (0.40 + i * 0.26));
    PIX.rect(ctx, x0 + Math.round(w * 0.14), fy, Math.round(w * 0.64), 1, dk);
    PIX.rect(ctx, x0 + Math.round(w * 0.18), fy + 1, Math.round(w * 0.50), 1,
      'rgba(255,255,255,.14)');
  }
  /* the hem, hanging below the hand with a corner off one side */
  const hy = y0 + Math.round(h * 0.80);
  PIX.rect(ctx, x0 + Math.round(w * 0.12), hy, Math.round(w * 0.74), 2, INK);
  PIX.rect(ctx, x0 + Math.round(w * 0.14), hy, Math.round(w * 0.70), 1, dk);
  /* ONE CORNER HANGS. A cloth with a level hem is a flannel; the corner
     off one side is the whole difference between the two. */
  const cw = Math.max(3, Math.round(w * 0.22));
  const cx0 = x0 + (sgn < 0 ? Math.round(w * 0.04) : Math.round(w * 0.74));
  const ch = Math.max(3, Math.round(h * 0.44));
  for (let i = 0; i < ch; i++) {
    const ww = Math.max(1, cw - Math.round((i / ch) * cw));
    PIX.rect(ctx, cx0 + (sgn < 0 ? cw - ww : 0) - 1, hy + 1 + i, ww + 2, 1, INK);
    PIX.rect(ctx, cx0 + (sgn < 0 ? cw - ww : 0), hy + 1 + i, ww, 1, i < 2 ? mid : dk);
  }
};

/* a forearm entering from off-frame, in your pinstripe sleeve */
SPR.povSleeve = SPR.povTube;

/* ============================================================
   GESTURES.
   Nobody at this table talks. What a frog has instead is one
   hand, which he keeps under the felt until he wants to say
   something with it: palms up, flat over the eyes, or one digit
   raised at you across the lamp.
   Drawn upright, digits pointing UP, origin at the wrist.
   ============================================================ */
SPR.frogGesture = function (ctx, cx, cy, d, kind, sgn) {
  /* All three are the same blocky paw held differently — a flat hand over
     his eyes, one digit up, or an open palm. Nothing here is a circle. */
  const mode = kind === 'flat' ? 'flat' : kind === 'finger' ? 'one' : 'open';
  SPR.povPaw(ctx, cx, cy, d, sgn || 1, 1, mode);
};

/* ============================================================
   THE HAND YOU HOLD THINGS WITH, AT TRUE SIZE.

   frogFist was a stack of rounded rectangles thirty-four pixels
   wide, drawn through a transform at scale one-half. Every crease
   in it landed on half a pixel and vanished, every digit came out
   the same thickness as the one above it, and the thumb was a
   fifth finger laid across the top. On screen it was a cluster of
   green sausages.

   So this is authored at whatever width it is asked for, in
   integer pixels, and cached -- the same rule the profile bust
   follows, for the same reason. A hand is nearly all creases and
   a resampled crease is not a crease.

   What a human hand looks like from behind, closed round
   something, is:

     the back      a trapezoid, WIDER at the knuckle end than at
                   the wrist, with three tendons standing up on it
     the knuckles  four domes in an arc, the middle two highest
     the fingers   from each knuckle, going away, TAPERING, with a
                   crease at the middle joint, and the tip curling
                   back so you see a sliver of pad and a nail
     the thumb     off the side, THICKER than any finger, one
                   crease, a broad flat nail, laid over the top

   Digits wrap to the LEFT; the wrist anchor is on the right edge
   and reported as cv.wrist, so the caller can put the cuff there.
   ============================================================ */
SPR.povFist = function (d, w, o) {
  o = o || {};
  w = Math.max(12, Math.round(w));
  const key = 'pfist_' + (d.id || d.name || 'x') + ':' + w
    + (o.wet ? 'w' : '') + (d.rings ? 'r' : '');
  return SPR.cached(key, () => {
    const P = PIX.PAL, INK = P.K;
    const skin = P[d.skin[0]] || P.F;
    const shade = P[d.skin[1]] || P.f;
    const dark = P[d.skin[2]] || P.e;
    const H = Math.max(13, Math.round(w * 1.02));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = H;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    const u = (n) => Math.max(1, Math.round(n * w / 32));
    const NAIL = 'rgba(242,235,218,.62)';

    /* THE LEADING EDGE. A fist is a rounded MASS with the knuckles on the
       front of it, not a stack of horizontal bars -- which is what four
       fingers-with-creases came out as, five parallel green sticks with a
       sixth on top for a thumb, at every size the game asks for. So: one
       silhouette, four knuckles in an arc on the front of it, four short
       phalanges wrapping away underneath, and the thumb crossing the top
       DIAGONALLY, because a different direction is what makes a thumb
       read as a thumb at twenty pixels. */
    /* to the power of six tenths, so the mass is FULL at the top and bottom
       and only tapers right at the ends: a plain sine came out a lens, and
       left a wedge of nothing between the thumb and the top of the hand */
    /* AND THE BACK EDGE BOWS TOO. It came off seven per cent of the width,
       which is a straight vertical wall at any size the game asks for: the
       front of the hand was a curve and the back was a plank, and the whole
       thing read as a green brick with a stripe on it. Both edges bow now,
       and the arc is taken to a lower power so the taper is spread over the
       mass instead of crammed into the last two rows. */
    const arcAt = (y) => Math.pow(Math.sin(Math.PI
      * U.clamp((y / (H - 1) - 0.02) / 0.96, 0, 1)), 0.62);
    /* BOTH EDGES OFF THE SAME ARC, from the same centre line. Insetting
       each edge by its own fraction of the width leaves row zero fifty-three
       per cent wide however hard the arc bows -- a flat top with a corner at
       each end, which is what kept reading as a wedge. Off a shared centre
       the top and bottom rows converge to a point and the silhouette is a
       ball, biased toward the wrist side because a fist is deepest at the
       knuckles. */
    /* the centre line sits right of middle so the phalanges that wrap off
       the front edge have canvas to wrap INTO -- at 0.46 the front of the
       mass reached x = 2 and the fingertips were being clipped by the left
       edge of the sprite */
    /* AN OVAL, NOT A BALL. Both edges off one arc at equal reach made a
       sphere -- a green tennis ball with a sausage on it, knuckles and all
       gone. A fist is deep front-to-back and shallow across: the FRONT edge
       barely bows, because that is the straightish line the knuckles sit on,
       and the BACK edge does all the rounding. */
    const CX = w * 0.50;
    const EL = (y) => Math.round(CX - arcAt(y) * w * 0.17);
    const ER = (y) => Math.round(CX + arcAt(y) * w * 0.44);
    const ft = Math.max(3, Math.round(H * 0.17));          /* one phalanx thick */

    /* ---- 1. THE PHALANGES, wrapping away off the front edge. Drawn first,
            so the mass lands over where they leave the knuckles. ---- */
    const KY = [0, 1, 2, 3].map(i => Math.round(H * (0.19 + i * 0.187)));
    const KL = [u(7), u(8), u(7), u(5)];                   /* shorter down the hand */
    for (let i = 3; i >= 0; i--) {
      const y = KY[i] - (ft >> 1), len = KL[i];
      const x1 = EL(KY[i]) + u(3), x0 = Math.max(0, x1 - len);
      PIX.rect(c, x0 - 1, y - 1, x1 - x0 + 2, ft + 2, INK);
      PIX.rect(c, x0, y, x1 - x0, ft, i < 2 ? skin : shade);
      PIX.rect(c, x0, y, x1 - x0, 1, 'rgba(255,255,255,.18)');
      PIX.rect(c, x0, y + ft - 1, x1 - x0, 1, 'rgba(0,0,0,.30)');
      /* the tip, curled back under: a pad with a small nail on it */
      if (len >= u(6)) {
        PIX.rect(c, x0 - 1, y, u(3) + 2, ft + 1, INK);
        PIX.rect(c, x0, y + 1, u(3), ft - 1, shade);
        /* the nail only at a size where two pixels of it is not just noise */
        if (u(2) >= 2) PIX.rect(c, x0 + 1, y + 2, u(2) - 1, Math.max(1, ft - 3), NAIL);
      }
    }

    /* ---- 2. THE MASS ---- */
    for (let y = 0; y < H; y++) {
      const xl = EL(y), xr = ER(y);
      if (xr <= xl) continue;
      const t = y / (H - 1);
      PIX.rect(c, xl - 1, y, xr - xl + 3, 1, INK);
      PIX.rect(c, xl, y, xr - xl + 1, 1, t < 0.52 ? skin : shade);
      PIX.rect(c, xl, y, Math.max(1, u(2)), 1, 'rgba(255,255,255,.15)');
      PIX.rect(c, xr - Math.max(1, u(2)), y, Math.max(1, u(2)), 1, 'rgba(0,0,0,.26)');
    }
    /* the tendons, running back from the knuckles into the wrist */
    for (let i = 0; i < 3; i++) {
      const ty = Math.round((KY[i] + KY[i + 1]) / 2), xl = EL(ty);
      if (ER(ty) - xl < u(6)) continue;
      PIX.rect(c, xl + u(4), ty, ER(ty) - xl - u(5), 1, 'rgba(0,0,0,.22)');
      PIX.rect(c, xl + u(4), ty - 1, ER(ty) - xl - u(5), 1, 'rgba(255,255,255,.08)');
    }

    /* ---- 3. THE KNUCKLES, four domes on the front of the mass ---- */
    for (let i = 0; i < 4; i++) {
      const ky = KY[i], r = Math.max(2, u(i === 1 || i === 2 ? 3.6 : 3.0));
      const kx = EL(ky) + r - 1;
      PIX.disc(c, kx, ky, r + 1, INK);
      PIX.disc(c, kx, ky, r, skin);
      PIX.disc(c, kx - Math.max(1, u(1)), ky - Math.max(1, u(1)),
        Math.max(1, r - u(2)), 'rgba(255,255,255,.22)');
      /* the crease below each one, which is what makes four of them read
         as four rather than as one lumpy edge */
      PIX.rect(c, kx - r, ky + r, r + u(5), 1, 'rgba(0,0,0,.34)');
      PIX.rect(c, kx - r, ky + r + 1, r + u(4), 1, 'rgba(255,255,255,.07)');
    }

    /* ---- 4. THE THUMB, across the top on the diagonal ----
            AS A ROUND TUBE, NOT A RUN OF COLUMNS. Stepping columns of equal
            height along a diagonal and inking each one draws a
            parallelogram: the thumb came out as a flat green plate laid
            across the top of the hand with a hard black edge, which is most
            of why the whole fist read as a wedge. Discs down the same line
            give a tube with round ends for free, and the taper toward the
            tip is what says thumb. ---- */
    const tt = ft + Math.max(1, u(2));
    const ax = Math.round(w * 0.62), ay = Math.max(2, Math.round(H * 0.11));
    const bx = Math.max(1, Math.round(w * 0.12)), by = Math.round(H * 0.34);
    const steps = Math.max(4, Math.round(Math.hypot(ax - bx, by - ay)));
    const R0 = Math.max(2, Math.round(tt * 0.56)), R1 = Math.max(2, Math.round(tt * 0.42));
    const col = (i) => {
      const t = i / steps;
      return { x: Math.round(ax + (bx - ax) * t), y: Math.round(ay + (by - ay) * t),
        r: Math.round(R0 + (R1 - R0) * t) };
    };
    /* ALL THE INK FIRST, THEN ALL THE SKIN -- otherwise each disc's outline
       paints over the fill the disc before it laid down. */
    for (let i = 0; i <= steps; i++) { const q = col(i); PIX.disc(c, q.x, q.y, q.r + 1, INK); }
    for (let i = 0; i <= steps; i++) { const q = col(i); PIX.disc(c, q.x, q.y, q.r, skin); }
    /* lit along the top of the tube, shaded along the bottom */
    for (let i = 0; i <= steps; i++) {
      const q = col(i);
      PIX.rect(c, q.x, q.y - q.r, 1, Math.max(1, u(1)), 'rgba(255,255,255,.20)');
      PIX.rect(c, q.x, q.y + q.r - 1, 1, Math.max(1, u(1)), 'rgba(0,0,0,.34)');
    }
    /* its one crease, square across the shaft */
    const cq = col(Math.round(steps * 0.46));
    PIX.rect(c, cq.x, cq.y - cq.r + 1, 1, cq.r * 2 - 2, 'rgba(0,0,0,.40)');
    PIX.rect(c, cq.x + 1, cq.y - cq.r + 1, 1, cq.r * 2 - 2, 'rgba(255,255,255,.13)');
    /* and the NAIL: broad, flat, lying on top of the tip, with its corners
       taken off so it is a nail and not a postage stamp */
    /* LYING ALONG THE THUMB, not a square blob on the end of it: six by six
       of pale grey on the tip read as a bolt through his hand. */
    const nw = Math.max(3, u(3)), nh = Math.max(2, R1 - Math.max(1, u(1)));
    const nx = bx - Math.max(1, u(1)), ny = by - (nh >> 1);
    for (let r2 = 0; r2 < nh; r2++) {
      const inw = (r2 === 0 || r2 === nh - 1) ? 1 : 0;
      PIX.rect(c, nx + inw - 1, ny + r2, nw - inw * 2 + 2, 1, INK);
      PIX.rect(c, nx + inw, ny + r2, nw - inw * 2, 1, r2 === 0 ? 'rgba(255,252,244,.78)' : NAIL);
    }
    PIX.rect(c, nx + 1, ny + nh - 1, nw - 2, 1, 'rgba(0,0,0,.24)');
    /* the web, where it leaves the hand */
    PIX.rect(c, ax - u(3), ay + tt, u(5), 1, 'rgba(0,0,0,.34)');

    if (d.rings) {
      const ry = KY[2] - (ft >> 1), rx = Math.max(0, EL(KY[2]) - u(2));
      PIX.rect(c, rx, ry - 1, 3, ft + 2, INK);
      PIX.rect(c, rx + 1, ry, 1, ft, P.G);
    }
    if (o.wet) {
      const my = Math.round(H * 0.44);
      PIX.rect(c, EL(my) + u(5), my, Math.max(2, ER(my) - EL(my) - u(8)), 1,
        'rgba(255,255,255,.16)');
      PIX.rect(c, EL(my) + u(6), my + u(4), Math.max(2, ER(my) - EL(my) - u(11)), 1,
        'rgba(255,255,255,.10)');
    }
    /* the wrist, where the mass turns into the arm */
    const wy = Math.round(H * 0.80);
    if (ER(wy) - EL(wy) > u(8)) {
      PIX.rect(c, EL(wy) + u(6), wy, ER(wy) - EL(wy) - u(7), 1, 'rgba(0,0,0,.24)');
      PIX.rect(c, EL(wy) + u(6), wy + 1, ER(wy) - EL(wy) - u(8), 1, 'rgba(255,255,255,.07)');
    }
    cv.wrist = { x: w - 1, y: Math.round(H * 0.52) };
    return cv;
  });
};

/* THE OLD SIGNATURE, kept so every existing caller still works.

   The duel draws this hand through a rotate and a scale of about a half,
   and asks for a nominal thirty-four. So: read the scale off the context,
   ask the true-size draw for thirty-four TIMES it, and undo the scale
   before blitting -- the hand comes out the size the caller wanted, but
   its pixels are its own rather than three fifths of one each. The
   rotation still resamples, and nothing can be done about that. */
SPR.frogFist = function (ctx, cx, cy, d, o) {
  o = o || {};
  let k = 1;
  if (ctx.getTransform) {
    const m = ctx.getTransform();
    k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
  }
  k = U.clamp(k, 0.1, 6);
  const cv = SPR.povFist(d, U.clamp(Math.round(34 * k), 12, 110), o);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1 / k, 1 / k);
  ctx.drawImage(cv, -cv.wrist.x, -cv.wrist.y);
  ctx.restore();
};


const FROG_DEFS = {
  player:    { skin: ['F', 'f', 'e'], fat: false, suit: 'T', shirt: 'W', tie: 'd',
               costume: 'pinstripe', braces: true, glasses: 'shades',
               hat: 'fedora', hatCol: 'T', band: 'd', cigar: true },
  blindfold: { skin: ['w', 'q', 'q'], fat: false, suit: 'u', shirt: 'w', tie: 'U',
               costume: 'shabby', glasses: 'round' },
  vig:       { skin: ['B', 'b', 'u'], fat: true, suit: 'k', shirt: 'W', tie: 'G',
               costume: 'donCoat',
               hat: 'fedora', hatCol: 'U', band: 'G', cigar: true, warts: true },
  spinner:   { skin: ['N', 'n', 'n'], fat: false, suit: 't', shirt: 'W', bowtie: 'r',
               costume: 'tux', loosened: true, spiral: true },
  croupier:  { skin: ['f', 'e', 'e'], fat: false, suit: 'k', shirt: 'W', bowtie: 'd',
               costume: 'croupier', visor: true },
  collector: { skin: ['O', 'o', 'o'], fat: true, suit: 't', shirt: 'w', tie: 'T',
               costume: 'threePiece', glasses: 'square', warts: true },
  cage:      { skin: ['s', 't', 't'], fat: false, suit: 'stripes', shirt: 'w', tie: null,
               costume: 'uniform', flatcap: true },
  lily:      { skin: ['P', 'p', 'X'], fat: false, suit: 'd', shirt: 'P', tie: null,
               costume: 'gown',
               lips: 'R', lashes: true, necklace: 'W', earring: 'G', cigholder: true },
  owner:     { skin: ['v', 'X', 'X'], fat: true, suit: 'k', shirt: 'W', bowtie: 'W',
               costume: 'tails',
               hat: 'tophat', hatCol: 'k', band: 'G', goldEyes: true, cigar: true, warts: true },
  dealer:    { skin: ['F', 'f', 'e'], fat: false, suit: 'W', shirt: 'W', bowtie: 'K',
               costume: 'croupier', visor: true },
  cop:       { skin: ['f', 'e', 'e'], fat: true, suit: 't', shirt: 'l', tie: null,
               costume: 'cop', flatcap: true, warts: true },
};

/* what makes one frog a different frog from another, as a string */
SPR.defKey = function (d) {
  return (d.skin || []).join('') + '|' + (d.costume || '') + '|' + (d.suit || '') +
    '|' + (d.shirt || '') + '|' + (d.tie || '') + (d.fat ? 'F' : '') + (d.hat || '');
};

/* Every frog is freckled the same way every time you meet him: the
   scatter is seeded off his own def, not off Math.random. */
SPR.defRng = function (d) {
  return U.mulberry32(U.hashSeed(SPR.defKey(d)));
};

/* ============================================================
   RIM LIGHT.
   A dark suit against a dark room is a hole in the screen. Take
   the sprite's own silhouette, flood it with one colour, and lay
   it down a couple of pixels toward the lamp before drawing the
   real thing over it: the shape gets an edge without anyone
   hand-painting one on every part.
   ============================================================ */
SPR.silhouette = function (key, src, col) {
  return SPR.cached('sil:' + key + ':' + col, () => {
    const cv = document.createElement('canvas');
    cv.width = src.width; cv.height = src.height;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(src, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = col;
    c.fillRect(0, 0, cv.width, cv.height);
    return cv;
  });
};

/* a stepped rounded rect — an ellipse reads as a blob at gun scale, and a
   plain rect reads as a brick; the irons and the buttons both want this */
SPR.rrect = function (ctx, x0, y0, w, h, r, col) {
  ctx.fillStyle = col;
  for (let y = 0; y < h; y++) {
    const d = Math.min(y, h - 1 - y);
    let inset = 0;
    if (d < r) inset = r - Math.round(Math.sqrt(Math.max(0, r * r - (r - d) * (r - d))));
    const ww = w - inset * 2;
    if (ww > 0) ctx.fillRect(Math.round(x0 + inset), Math.round(y0 + y), Math.round(ww), 1);
  }
};

SPR.ellipse = function (ctx, cx, cy, rx, ry, col) {
  ctx.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y / ry) * (y / ry))));
    ctx.fillRect(Math.round(cx - span), Math.round(cy + y), span * 2 + 1, 1);
  }
};

/* ============================================================
   THE FROG RIG v2 — big cartoon heads, expressions, tells.
   buildFrog(def, expr) draws a bust portrait; frogBody(def)
   draws the seated body the duel scene puts under the head.
   Expressions: neutral · grin · worry · angry · pain · smug · dead
   Visible tells (goldtooth, scar, patch, rings, vest, hats…)
   are rolled as TRAITS and drawn right on the frog.
   ============================================================ */


SPR.buildFrog = function (d, expr) {
  expr = expr || 'neutral';
  const P = PIX.PAL;
  const skin = P[d.skin[0]], shade = P[d.skin[1]], dark = P[d.skin[2]];
  const W = 46, H = 42, cx = 23;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  const fat = !!d.fat;
  const rx = fat ? 20 : 15;              // BIG cartoon head
  const ry = fat ? 14 : 12;
  const headY = 25;
  /* Eye bulbs ride ON the skull rather than defining its width — set them
     as wide as the head and the whole top squares off into a plateau. */
  const er = fat ? 6 : 5;
  const ex = fat ? 11 : 8;
  const ey = headY - ry;

  /* ---- the costume at the neck: BACK layers (the head covers most) ---- */
  const C = SPR.costumeOf(d);
  const CO = C.overcoat || C.jacket || null;
  const cAcc = C.acc || {};
  const cSh = C.shirt;
  const bare = !!C.gown;                       // strapless gown: bare shoulders
  const outerL = CO ? CO.col : (C.gown ? C.gown.col : (cSh ? cSh.col : 'T'));
  const outer = bare ? skin : (P[outerL] || P.T);
  const outerDk = bare ? shade : (P[(CO && CO.dark) || DARKER[outerL]] || P.k);
  const sw = fat ? 21 : 14;
  const gTop = H - 10;
  PIX.rect(ctx, cx - sw + 2, gTop, (sw - 2) * 2 + 1, 2, P.K);
  PIX.rect(ctx, cx - sw - 1, gTop + 2, (sw + 1) * 2 + 1, H - gTop - 2, P.K);
  PIX.rect(ctx, cx - sw + 2, gTop + 1, (sw - 2) * 2 + 1, 1, outer);
  PIX.rect(ctx, cx - sw, gTop + 3, sw * 2 + 1, H - gTop - 3, outer);
  PIX.rect(ctx, cx + sw - 3, gTop + 3, 3, H - gTop - 3, 'rgba(0,0,0,.26)');
  PIX.rect(ctx, cx - sw, gTop + 3, 2, H - gTop - 3, 'rgba(255,255,255,.09)');
  if (CO && CO.stripe === 'chalk') {
    for (let x = -sw; x <= sw; x += (CO.stripeGap || 5)) {
      PIX.rect(ctx, cx + x, gTop + 1, 1, H - gTop - 1, 'rgba(244,239,224,.22)');
    }
  }
  if (cAcc.epaulets) {
    const ec = P[cAcc.epaulets] || P.G;
    [-1, 1].forEach(s => {
      const x0 = s < 0 ? cx - sw : cx + sw - 7;
      PIX.rect(ctx, x0 - 1, gTop + 1, 9, 4, P.K);
      PIX.rect(ctx, x0, gTop + 2, 7, 2, ec);
      PIX.rect(ctx, x0, gTop + 2, 7, 1, 'rgba(255,255,255,.22)');
    });
  }
  if (cAcc.stole) {
    const fc = P[cAcc.stole] || P.W, fd = P[DARKER[cAcc.stole]] || P.w;
    PIX.rect(ctx, cx - sw - 2, gTop, (sw + 2) * 2 + 1, 5, P.K);
    PIX.dither(ctx, cx - sw - 1, gTop + 1, (sw + 1) * 2 + 1, 3, fc, fd);
  }
  if (cAcc.radio) {
    PIX.rect(ctx, cx - sw - 1, gTop + 1, 5, 8, P.K);
    PIX.rect(ctx, cx - sw, gTop + 2, 3, 6, P[cAcc.radio] || P.T);
    PIX.rect(ctx, cx - sw, gTop + 3, 3, 1, P.s);
  }

  /* ============================================================
     HEAD AND EYES, AS ONE SILHOUETTE.

     A frog's eyes are part of its skull, not two balls stuck on top
     of it. Drawing them as separate discs left a hard notch where
     each one met the head. So: an ink pass over head AND both bulbs
     first, then a fill pass over the same three shapes — the second
     pass buries the internal outlines and what is left is one
     creature with a lumpy top.
     ============================================================ */
  const EY = ey;
  [P.K, skin].forEach((col, pass) => {
    const g = pass ? 0 : 1;
    SPR.ellipse(ctx, cx, headY, rx + g, ry + g, col);
    PIX.disc(ctx, cx - ex, EY, er + g, col);
    PIX.disc(ctx, cx + ex, EY, er + g, col);
  });
  /* the shelf under each bulb, and the jowl under the whole head */
  [-ex, ex].forEach(o => SPR.ellipse(ctx, cx + o, EY + er - 1, er - 1, 2, shade));
  SPR.ellipse(ctx, cx, headY + 6, rx - 2, 5, shade);
  PIX.rect(ctx, cx - 2, EY + er - 2, 5, 2, shade);          // the dip between them
  if (fat) {
    SPR.ellipse(ctx, cx - rx + 5, headY + 6, 6, 5, shade);
    SPR.ellipse(ctx, cx + rx - 5, headY + 6, 6, 5, shade);
    PIX.rect(ctx, cx - 7, headY + 11, 15, 1, dark);
  }
  /* ---- the skin itself: mottling, and the wet look ----
     A frog is not a flat colour. Every one gets a stable scatter of
     darker mottling seeded off his own def, so the same frog is
     freckled the same way every time you see him, and a wet
     specular arc over the crown that is what actually sells "amphibian"
     rather than "green man". */
  const rng = SPR.defRng(d);
  for (let i = 0; i < (fat ? 15 : 11); i++) {
    const a = rng() * Math.PI * 2, rr = Math.sqrt(rng());
    const mx2 = Math.round(cx + Math.cos(a) * rx * rr * 0.92);
    const my2 = Math.round(headY + Math.sin(a) * ry * rr * 0.92);
    if (my2 < headY - ry + 3) continue;                 // not up over the brow
    const big = rng() < 0.3;
    PIX.disc(ctx, mx2, my2, big ? 2 : 1, shade);
    if (big) PIX.rect(ctx, mx2 - 1, my2 - 1, 1, 1, dark);
  }
  /* the wet crown, and a second slick on each bulb */
  for (let i = -6; i <= 6; i++) {
    const t = i / 6;
    PIX.rect(ctx, cx + i * 2, headY - ry + 2 + Math.round(t * t * 3), 2, 1, 'rgba(255,255,255,.13)');
  }
  [-ex, ex].forEach(o => {
    PIX.rect(ctx, cx + o - 3, ey - er + 2, 3, 1, 'rgba(255,255,255,.18)');
    PIX.rect(ctx, cx + o - 3, ey - er + 3, 1, 1, 'rgba(255,255,255,.10)');
  });
  /* the throat, which is a different skin from the top of him */
  SPR.ellipse(ctx, cx, headY + ry - 3, rx - 6, 4, shade);
  SPR.ellipse(ctx, cx, headY + ry - 4, rx - 8, 3, skin);

  /* nostrils, because a face without them is a balloon */
  PIX.rect(ctx, cx - 3, headY - 1, 2, 2, dark);
  PIX.rect(ctx, cx + 2, headY - 1, 2, 2, dark);
  if (d.warts) {
    [[-rx + 6, headY + 2], [rx - 7, headY - 1], [3, headY + 7]]
      .forEach(o => { PIX.disc(ctx, cx + o[0], o[1], 2, shade); PIX.disc(ctx, cx + o[0], o[1] - 1, 1, skin); });
  }
  if (d.spots) {
    [[-rx + 5, headY - 2], [rx - 7, headY + 3], [-4, headY + 8], [7, headY - 4]]
      .forEach(sp => PIX.disc(ctx, cx + sp[0], sp[1], 2, shade));
  }

  /* ---- the eyeball itself, and the brow that does the acting ---- */
  /* These frogs are professionals. They do not emote — they are sitting
     across a table from a man with a gun and they have done it before.
     Every expression here is one or two pixels off deadpan; what changes
     is the LID and the pupil, not the whole face. */
  const EX = {
    /*            lid   pupil  brow-in  brow-out  brow-y   extras */
    neutral: { lid: 2, pup: 3, bi: 0, bo: 0, by: 0 },
    smug:    { lid: 3, pup: 3, bi: 1, bo: 0, by: 0 },
    worry:   { lid: 0, pup: 2, bi: -1, bo: 0, by: -1 },
    grin:    { lid: 2, pup: 3, bi: 0, bo: 0, by: 0 },
    angry:   { lid: 3, pup: 3, bi: 1, bo: -1, by: 1 },
    pain:    { lid: 0, pup: 0, bi: 1, bo: 0, by: 0 },
    dead:    { lid: 0, pup: 0, bi: 0, bo: 0, by: 0 },
    blink:   { lid: 7, pup: 3, bi: 0, bo: 0, by: 0 },   // the whole idle tell
    talk:    { lid: 2, pup: 3, bi: 0, bo: -1, by: 0 },  // brows up, mid-sentence
    talk2:   { lid: 2, pup: 3, bi: 0, bo: 0, by: 0 },

    /* ============================================================
       THE REST OF WHAT A FACE DOES.

       The old set was seven deadpans, which suited a game where
       every scene was a man with a gun at eleven at night. It is
       an afternoon in Paris now and people are pleased, bored,
       suspicious, embarrassed and delighted, so:

         arc      the eye closes into a happy upward curve
         low      a lower lid comes UP, which is what a real smile
                  does to an eye and what nothing here did before
         roll     the pupil goes off to one side (thinking, sniffing)
         one      the expression is asymmetric — one eye only
         cheek    a blush, drawn under the eye
       ============================================================ */
    happy:   { lid: 1, pup: 3, bi: 0, bo: -1, by: -1, low: 2, cheek: 1 },
    joy:     { lid: 0, pup: 3, bi: 0, bo: -2, by: -1, arc: 1, cheek: 1 },
    laugh:   { lid: 0, pup: 3, bi: 0, bo: -2, by: -1, arc: 1, cheek: 1 },
    sad:     { lid: 1, pup: 2, bi: -2, bo: 1, by: 0, low: 1 },
    wince:   { lid: 4, pup: 2, bi: 1, bo: 0, by: 1, one: 1 },
    squint:  { lid: 5, pup: 2, bi: 1, bo: 1, by: 1 },
    wink:    { lid: 1, pup: 3, bi: 0, bo: -1, by: 0, one: 2, low: 2 },
    think:   { lid: 3, pup: 3, bi: -1, bo: -2, by: -1, roll: -1 },
    sniff:   { lid: 2, pup: 2, bi: 0, bo: -1, by: 0, roll: 1 },
    alarm:   { lid: 0, pup: 5, bi: -1, bo: -2, by: -2 },
    doubt:   { lid: 3, pup: 3, bi: 0, bo: 0, by: 0, tilt: 2 },
    blush:   { lid: 2, pup: 3, bi: 0, bo: -1, by: 0, cheek: 2, low: 1 },
    bored:   { lid: 4, pup: 3, bi: 0, bo: 1, by: 1, roll: -1 },
  };
  const X = EX[expr] || EX.neutral;

  const drawEye = (off, side) => {
    if (expr === 'dead') {                       // X X
      ctx.fillStyle = P.k;
      PIX.disc(ctx, cx + off, EY, er - 1, P.w);
      ctx.fillStyle = P.K;
      for (let i = -3; i <= 3; i++) {
        ctx.fillRect(cx + off + i, EY + i, 1, 1);
        ctx.fillRect(cx + off + i, EY - i, 1, 1);
      }
      return;
    }
    if (expr === 'blink') {                      // lids all the way down
      PIX.disc(ctx, cx + off, EY, er - 1, skin);
      PIX.rect(ctx, cx + off - er + 1, EY, er * 2 - 1, 1, shade);
      PIX.rect(ctx, cx + off - er + 2, EY + 1, er * 2 - 3, 1, dark);
      for (let i = 0; i < er * 2 + 1; i++) {
        PIX.rect(ctx, cx + off - er + i, EY - er + 1, 1, 3, P.K);
      }
      return;
    }
    if (expr === 'pain') {                       // screwed shut, a hard line
      PIX.rect(ctx, cx + off - er + 1, EY - 1, er * 2 - 1, 2, P.K);
      PIX.rect(ctx, cx + off - er + 2, EY, er * 2 - 3, 1, dark);
      for (let i = 0; i < 3; i++) {              // crow's feet
        PIX.rect(ctx, cx + off + side * (er - 1 + i), EY - 3 + i * 2, 2, 1, dark);
      }
      return;
    }
    /* AN EYE SHUT IN A SMILE. Not a blink — a blink is a flat lid coming
       straight down and reads as asleep. This is an upward arc with the
       skin above it, which is the whole difference between a frog who is
       delighted and a frog who has nodded off. */
    const solo = X.one && side > 0 ? false : X.one ? true : false;
    if (X.arc && (!X.one || solo)) {
      PIX.disc(ctx, cx + off, EY, er - 1, skin);
      for (let i = 0; i < er * 2 - 1; i++) {
        const t = (i - (er - 1)) / (er - 1);
        const yy = EY + 1 + Math.round(Math.abs(t) * 2) - 1;
        PIX.rect(ctx, cx + off - er + 1 + i, yy, 1, 2, P.K);
        PIX.rect(ctx, cx + off - er + 1 + i, yy + 2, 1, 1, dark);
      }
      /* the crease at the outer corner that a real smile puts there */
      PIX.rect(ctx, cx + off + side * (er - 1), EY - 2, 2, 1, dark);
      PIX.rect(ctx, cx + off + side * (er - 1), EY + 3, 2, 1, dark);
      return;
    }
    /* A WINK, or a wince: one eye does something the other does not. */
    if (X.one === 2 && side < 0) {
      PIX.disc(ctx, cx + off, EY, er - 1, skin);
      PIX.rect(ctx, cx + off - er + 1, EY, er * 2 - 1, 2, P.K);
      PIX.rect(ctx, cx + off - er + 2, EY + 2, er * 2 - 3, 1, dark);
      for (let i = 0; i < er * 2 + 1; i++) {
        PIX.rect(ctx, cx + off - er + i, EY - er + 1, 1, 3, P.K);
      }
      return;
    }
    /* sclera, iris, pupil, catchlight */
    PIX.disc(ctx, cx + off, EY + 1, er - 2, P.W);
    const iris = d.goldEyes ? P.G : d.spiral ? P.N : P.g;
    PIX.disc(ctx, cx + off, EY + 1, er - 3, iris);
    if (d.spiral) {
      ctx.fillStyle = P.K;
      ctx.fillRect(cx + off - 1, EY, 3, 1); ctx.fillRect(cx + off + 1, EY + 1, 1, 1);
      ctx.fillRect(cx + off - 1, EY + 2, 2, 1);
    } else {
      /* a frog pupil is a horizontal slot; a scared one shrinks to a dot,
         and one that is thinking about something is not looking at you */
      const pw = Math.max(1, X.pup), ph = expr === 'worry' ? 2 : 3;
      const px = cx + off + (expr === 'smug' ? -side * 2 : 0)
        + (X.roll ? X.roll * 2 : 0);
      PIX.rect(ctx, px - (pw >> 1), EY - (ph >> 1) + 1, pw, ph, P.K);
      PIX.rect(ctx, px - (pw >> 1) - 1, EY + 1, 1, 1, P.K);
      PIX.rect(ctx, px + (pw >> 1), EY + 1, 1, 1, P.K);
      PIX.rect(ctx, px - 1, EY - 1, 1, 1, P.W);          // catchlight
    }
    /* the heavy lid, coming DOWN off the top of the bulb */
    if (X.lid > 0) {
      PIX.disc(ctx, cx + off, EY - er + X.lid - 1, er, skin);
      PIX.rect(ctx, cx + off - er + 1, EY - er + X.lid + 1, er * 2 - 1, 1, shade);
    }
    /* THE LOWER LID, coming UP. Nothing in here did this before, and it
       is the single cheapest way to make a face look pleased rather than
       merely not-unhappy: a smile pushes the cheek into the eye. */
    if (X.low > 0) {
      PIX.disc(ctx, cx + off, EY + er - X.low + 1, er, skin);
      PIX.rect(ctx, cx + off - er + 2, EY + er - X.low - 1, er * 2 - 3, 1, shade);
    }
    /* and the brow, which is where the whole expression actually lives.
       A tilt makes the two brows disagree, which is what scepticism is. */
    const bi = X.bi + (X.tilt ? (side > 0 ? X.tilt : -X.tilt) : 0);
    const bo = X.bo + (X.tilt ? (side > 0 ? -X.tilt : X.tilt) : 0);
    for (let i = 0; i < er * 2 + 1; i++) {
      const t = i / (er * 2);
      const inner = side < 0 ? 1 - t : t;
      const dy = Math.round(bi * inner + bo * (1 - inner));
      const bx = cx + off - er + i, by = EY - er + 1 + X.by + dy;
      PIX.rect(ctx, bx, by, 1, 3, P.K);
      PIX.rect(ctx, bx, by + 1, 1, 1, dark);
    }
    if (d.lashes) {
      PIX.rect(ctx, cx + off - er + 1, EY - er + 2, 1, 2, P.K);
      PIX.rect(ctx, cx + off + er - 1, EY - er + 2, 1, 2, P.K);
    }
  };
  drawEye(-ex, -1); drawEye(ex, 1);

  /* THE CHEEKS. A blush, or the flush of somebody enjoying themselves —
     stippled rather than solid, so it reads as skin and not as make-up. */
  if (X.cheek) {
    /* A PINK FROG CANNOT BLUSH PINK. Maybelle is rose-coloured and the
       first pass drew her blush in P.p, which vanished into her face.
       A flush is redder than the skin it is on, whatever the skin is. */
    const blush = X.cheek > 1 ? P.r : P.R;
    [-1, 1].forEach(sg => {
      const bx = cx + sg * (ex + 2), by = EY + er + 1;
      for (let i = 0; i < 7; i++) {
        const ox = (i % 3) - 1, oy = (i / 3) | 0;
        if ((i + (sg > 0 ? 0 : 1)) % 2) continue;
        PIX.rect(ctx, bx + ox * 2, by + oy, 2, 1, blush);
      }
      if (X.cheek > 1) PIX.rect(ctx, bx - 2, by + 1, 5, 1, blush);
    });
  }

  if (d.patch) {                                 // eye patch, left eye
    PIX.disc(ctx, cx - ex, ey, er - 1, P.K);
    PIX.disc(ctx, cx - ex - 1, ey - 1, 2, P.T);
    PIX.rect(ctx, cx - ex - er - 2, ey - er + 1, er + 3, 1, P.K);
    PIX.rect(ctx, cx - ex + 2, ey - er, er + 3, 1, P.K);
  }
  if (d.glasses === 'round') {
    [-ex, ex].forEach(off => {
      PIX.disc(ctx, cx + off, ey, er - 1, P.K);
      PIX.disc(ctx, cx + off, ey, er - 2, P.T);
      ctx.fillStyle = P.S; ctx.fillRect(cx + off - 2, ey - 3, 3, 1);
    });
    PIX.rect(ctx, cx - ex + er - 2, ey - 1, (ex - er + 2) * 2, 1, P.K);
  }
  if (d.glasses === 'square') {
    [-ex, ex].forEach(off => {
      PIX.rect(ctx, cx + off - 5, ey - 4, 10, 9, P.K);
      PIX.rect(ctx, cx + off - 4, ey - 3, 8, 7, P.L);
      PIX.rect(ctx, cx + off - 1, ey - 1, 3, 4, P.K);
    });
    PIX.rect(ctx, cx - ex + 5, ey - 1, ex * 2 - 10, 1, P.K);
  }
  /* SHADES. Two flat black lenses across the bulbs with a bar between and
     a hard white glint on each — you cannot read a frog behind these, which
     is the point of wearing them to work. */
  if (d.glasses === 'shades') {
    const lw = er + 1, lh = er - 1;
    /* A steel frame, or the lenses read as part of a dark hat. */
    PIX.rect(ctx, cx - ex - lw - 2, ey - lh - 2, (ex + lw) * 2 + 5, lh * 2 + 5, P.K);
    PIX.rect(ctx, cx - ex - lw - 1, ey - lh - 1, (ex + lw) * 2 + 3, lh * 2 + 3, P.s);
    PIX.rect(ctx, cx - ex - lw - 1, ey - lh - 1, (ex + lw) * 2 + 3, 1, P.S);
    [-ex, ex].forEach(off => {
      PIX.rect(ctx, cx + off - lw, ey - lh, lw * 2 + 1, lh * 2 + 1, P.K);
      PIX.rect(ctx, cx + off - lw + 1, ey - lh + 1, lw * 2 - 1, lh * 2 - 1, '#0b0d12');
      /* the glint, top-left, two hard steps — the only thing in them */
      PIX.rect(ctx, cx + off - lw + 2, ey - lh + 2, 5, 2, P.W);
      PIX.rect(ctx, cx + off - lw + 2, ey - lh + 4, 2, 2, 'rgba(244,239,224,.5)');
      PIX.rect(ctx, cx + off + 1, ey + lh - 4, 3, 2, 'rgba(154,163,184,.35)');
    });
    PIX.rect(ctx, cx - ex + lw, ey - 3, (ex - lw) * 2 + 1, 4, P.K);   // the bar
    PIX.rect(ctx, cx - ex + lw, ey - 2, (ex - lw) * 2 + 1, 2, P.s);
    PIX.rect(ctx, cx - ex + lw, ey - 2, (ex - lw) * 2 + 1, 1, P.S);
    /* and the arms, going back over the bulbs */
    PIX.rect(ctx, cx - ex - lw - 5, ey - lh + 2, 5, 3, P.K);
    PIX.rect(ctx, cx - ex - lw - 5, ey - lh + 3, 5, 1, P.s);
    PIX.rect(ctx, cx + ex + lw + 1, ey - lh + 2, 5, 3, P.K);
    PIX.rect(ctx, cx + ex + lw + 1, ey - lh + 3, 5, 1, P.s);
  }
  if (d.visor) {
    PIX.rect(ctx, cx - ex - er, ey - 4, (ex + er) * 2 + 1, 1, P.K);
    PIX.rect(ctx, cx - ex - er + 1, ey - 6, (ex + er) * 2 - 1, 2, P.n);
    PIX.rect(ctx, cx - ex - er + 1, ey - 7, (ex + er) * 2 - 1, 1, P.N);
  }

  /* nostrils */
  PIX.rect(ctx, cx - 3, headY - 4, 1, 2, dark);
  PIX.rect(ctx, cx + 3, headY - 4, 1, 2, dark);

  /* ============================================================
     THE MOUTH. A frog's is nearly as wide as its head, and a frog
     has NO TEETH — so all seven of these are the same wide line bent
     different ways, and what shows inside an open one is gum, a pale
     maxillary ridge along the top jaw, and tongue. Corners up or
     down does more work than a mouthful of enamel ever did.
     ============================================================ */
  const mw = rx - 4, my = headY + 3;
  const gum = P.D, gumLit = P.d, tongue = P.r, tongueLo = P.d;
  /* the one bit of hardware in there: a gold stud set in his lip */
  const goldStud = (gx, gy) => {
    if (!d.goldtooth) return;
    PIX.rect(ctx, gx - 1, gy - 1, 4, 4, P.K);
    PIX.rect(ctx, gx, gy, 2, 2, P.G);
    PIX.rect(ctx, gx, gy, 1, 1, P.Y);
  };

  /* one bent line: lift raises the CORNERS, sag drops the middle */
  const line = (lift, sag, col, th, yoff) => {
    ctx.fillStyle = col || P.K;
    for (let i = -mw; i <= mw; i++) {
      const t = Math.abs(i) / mw, tt = t * t;
      const y = my + (yoff || 0) + Math.round(sag * (1 - tt) - lift * tt);
      ctx.fillRect(cx + i, y, 1, th || 2);
    }
  };
  /* the inside of an open mouth: gum, then a tongue lying in it */
  const maw = (h, tongueOut) => {
    SPR.ellipse(ctx, cx, my + 2, mw - 2, h + 1, P.K);
    SPR.ellipse(ctx, cx, my + 2, mw - 3, h, gum);
    /* the pale ridge along the upper jaw — this is what a frog has
       instead of a top row of teeth */
    for (let i = -mw + 4; i <= mw - 4; i++) {
      const t = Math.abs(i) / (mw - 3);
      PIX.rect(ctx, cx + i, my + 2 - Math.round((h + 1) * Math.sqrt(Math.max(0, 1 - t * t))), 1, 1, gumLit);
    }
    SPR.ellipse(ctx, cx, my + h, mw - 6, Math.max(1, h - 2), tongueLo);
    SPR.ellipse(ctx, cx, my + h - 1, mw - 7, Math.max(1, h - 3), tongue);
    PIX.rect(ctx, cx - 1, my + h - 2, 1, Math.max(1, h - 1), tongueLo);   // the groove down it
    if (tongueOut) {
      PIX.rect(ctx, cx + 1, my + h - 1, 5, 6, P.K);
      PIX.rect(ctx, cx + 2, my + h - 1, 3, 5, tongue);
      PIX.rect(ctx, cx + 3, my + h, 1, 3, tongueLo);
      PIX.rect(ctx, cx + 2, my + h + 3, 3, 1, tongueLo);
    }
  };

  switch (expr) {
    case 'grin': {
      /* he is pleased. He does not show you teeth he does not have and
         he does not beam — the line goes up two pixels at the ends. */
      line(2, 0);
      line(2, 0, shade, 1, 2);
      PIX.rect(ctx, cx - mw - 1, my - 3, 2, 3, P.K);
      PIX.rect(ctx, cx + mw, my - 3, 2, 3, P.K);
      goldStud(cx + mw - 6, my - 1);
      break;
    }
    case 'smug': {
      /* one corner up. That is the entire performance. */
      ctx.fillStyle = P.K;
      for (let i = -mw; i <= mw; i++) {
        const t = (i + mw) / (2 * mw);
        ctx.fillRect(cx + i, my - Math.round(t * t * 2), 1, 2);
      }
      ctx.fillStyle = shade;
      for (let i = -mw + 1; i <= mw - 1; i++) {
        const t = (i + mw) / (2 * mw);
        ctx.fillRect(cx + i, my + 2 - Math.round(t * t * 2), 1, 1);
      }
      goldStud(cx + mw - 6, my - 1);
      break;
    }
    case 'worry': {
      /* the line is flat. It is the sweat that gives him away. */
      line(-1, 0);
      line(-1, 0, shade, 1, 2);
      PIX.rect(ctx, cx - rx + 3, ey - 1, 2, 4, P.L);      // flop sweat
      PIX.rect(ctx, cx - rx + 3, ey - 2, 1, 1, P.W);
      PIX.rect(ctx, cx + rx - 5, ey + 2, 2, 3, P.L);
      break;
    }
    case 'angry': {
      /* set. Two pixels down at the corners and a jaw he is holding shut. */
      line(-3, 0);
      line(-3, 0, shade, 1, 2);
      PIX.rect(ctx, cx - 5, my + 4, 11, 2, P.K);
      PIX.rect(ctx, cx - 4, my + 4, 9, 1, shade);
      goldStud(cx + mw - 6, my + 1);
      break;
    }
    case 'talk': {
      /* MID-WORD. The jaw is down, the ridge shows, the tongue is moving.
         A plate flips between this and neutral while the line types itself
         on, which is the difference between a frog talking to you and a
         photograph of a frog with words next to it. */
      maw(2, false);
      line(-1, -1, P.K, 2, -1);
      PIX.rect(ctx, cx - mw - 1, my - 1, 2, 4, P.K);
      PIX.rect(ctx, cx + mw, my - 1, 2, 4, P.K);
      break;
    }
    case 'talk2': {
      /* the half-closed beat between two syllables */
      maw(1, false);
      line(-2, 0, P.K, 2, 0);
      break;
    }
    case 'pain': {
      /* it opens a little. That is all he gives you. */
      maw(1, false);
      line(-1, -2, P.K, 2, -2);
      PIX.rect(ctx, cx - mw - 1, my - 2, 2, 4, P.K);
      PIX.rect(ctx, cx + mw, my - 2, 2, 4, P.K);
      break;
    }
    case 'dead': {
      /* slack, hanging open, and the tongue is out of it for good */
      maw(3, true);
      line(-1, -2, P.K, 2, -3);
      break;
    }

    /* ============================================================
       THE REST OF THE MOUTH.

       A frog's mouth is a very wide line, which means it can carry
       an enormous amount of expression for very few pixels: two at
       the corners is the difference between content and delighted.
       ============================================================ */
    case 'happy': {
      /* pleased with himself and not hiding it: up three at the ends,
         with the fold under the corner that a real smile makes */
      line(3, 0);
      line(3, 0, shade, 1, 2);
      PIX.rect(ctx, cx - mw - 1, my - 4, 2, 4, P.K);
      PIX.rect(ctx, cx + mw, my - 4, 2, 4, P.K);
      PIX.rect(ctx, cx - mw - 2, my - 1, 2, 1, dark);
      PIX.rect(ctx, cx + mw + 1, my - 1, 2, 1, dark);
      goldStud(cx + mw - 6, my - 1);
      break;
    }
    case 'joy': {
      /* open. The corners go up past the ends of the line, the jaw is
         down, and you can see the whole roof of his mouth. */
      maw(2, false);
      for (let i = -mw - 1; i <= mw + 1; i++) {
        const t = Math.abs(i) / (mw + 1);
        PIX.rect(ctx, cx + i, my - Math.round(t * t * 5), 1, 2, P.K);
      }
      PIX.rect(ctx, cx - mw - 2, my - 5, 2, 3, P.K);
      PIX.rect(ctx, cx + mw + 1, my - 5, 2, 3, P.K);
      break;
    }
    case 'laugh': {
      /* wide open, head back, tongue up out of the way */
      maw(4, false);
      for (let i = -mw - 1; i <= mw + 1; i++) {
        const t = Math.abs(i) / (mw + 1);
        PIX.rect(ctx, cx + i, my - Math.round(t * t * 6), 1, 2, P.K);
      }
      PIX.rect(ctx, cx - 3, my + 1, 7, 2, P.r);          // the tongue, up
      break;
    }
    case 'sad': {
      /* down four at the ends, and the lower lip pushed out under it */
      line(-4, 0);
      line(-4, 0, shade, 1, 2);
      PIX.rect(ctx, cx - mw - 1, my + 1, 2, 4, P.K);
      PIX.rect(ctx, cx + mw, my + 1, 2, 4, P.K);
      PIX.rect(ctx, cx - 4, my + 4, 9, 2, shade);
      PIX.rect(ctx, cx - 3, my + 5, 7, 1, skin);
      break;
    }
    case 'wince': {
      /* crooked: one corner up, the other tucked, teeth nearly shut */
      ctx.fillStyle = P.K;
      for (let i = -mw; i <= mw; i++) {
        const t = (i + mw) / (2 * mw);
        ctx.fillRect(cx + i, my - Math.round(Math.sin(t * Math.PI) * 3) + 1, 1, 2);
      }
      PIX.rect(ctx, cx + mw - 2, my - 3, 3, 2, P.W);      // one tooth showing
      break;
    }
    case 'squint':
    case 'bored': {
      /* a flat line and nothing else. He is waiting for you to finish. */
      line(0, 0);
      line(0, 0, shade, 1, 2);
      break;
    }
    case 'wink': {
      /* the wink is in the eye; the mouth just has to agree with it */
      line(2, 0);
      line(2, 0, shade, 1, 2);
      PIX.rect(ctx, cx + mw, my - 3, 2, 3, P.K);
      goldStud(cx + mw - 6, my - 1);
      break;
    }
    case 'think': {
      /* pursed, and pushed over to one side of his face */
      ctx.fillStyle = P.K;
      for (let i = -mw + 2; i <= mw - 4; i++) ctx.fillRect(cx + i - 2, my, 1, 2);
      PIX.rect(ctx, cx - mw, my - 1, 2, 4, P.K);
      PIX.rect(ctx, cx + mw - 5, my - 2, 3, 5, shade);    // the cheek, bunched
      break;
    }
    case 'sniff': {
      /* a small o, and the nostrils working */
      SPR.ellipse(ctx, cx, my + 1, 4, 3, P.K);
      SPR.ellipse(ctx, cx, my + 1, 3, 2, gum);
      PIX.rect(ctx, cx - 4, headY - 2, 3, 3, dark);
      PIX.rect(ctx, cx + 2, headY - 2, 3, 3, dark);
      break;
    }
    case 'alarm': {
      /* the jaw has dropped and he has not decided what to do about it */
      maw(3, false);
      line(-1, -3, P.K, 2, -3);
      PIX.rect(ctx, cx - mw - 1, my - 3, 2, 5, P.K);
      PIX.rect(ctx, cx + mw, my - 3, 2, 5, P.K);
      break;
    }
    case 'doubt': {
      /* flat, and shoved half a face to the left, which is what somebody
         does with their mouth when they do not believe you */
      ctx.fillStyle = P.K;
      for (let i = -mw; i <= mw - 3; i++) ctx.fillRect(cx + i - 1, my, 1, 2);
      ctx.fillStyle = shade;
      for (let i = -mw + 1; i <= mw - 4; i++) ctx.fillRect(cx + i - 1, my + 2, 1, 1);
      PIX.rect(ctx, cx - mw - 2, my - 1, 2, 4, P.K);
      break;
    }
    case 'blush': {
      /* a small closed smile from somebody who would rather you had not
         said that in front of everybody */
      ctx.fillStyle = P.K;
      for (let i = -mw + 3; i <= mw - 3; i++) {
        const t = Math.abs(i) / (mw - 3);
        ctx.fillRect(cx + i, my - Math.round((1 - t * t) * 2), 1, 2);
      }
      break;
    }
    default: {                                    // neutral: a wide frog frown
      line(-2, 0);
      line(-2, 0, shade, 1, 2);
      goldStud(cx + mw - 6, my + 1);
    }
  }

  if (d.lips && expr !== 'dead' && expr !== 'pain') {
    ctx.fillStyle = P[d.lips] || P.R;
    for (let x = -4; x <= 4; x++) {
      const b = Math.round(Math.pow(Math.abs(x) / mw, 2) * 4);
      ctx.fillRect(cx + x, my + b + 2, 1, 1);
    }
    ctx.fillRect(cx - 1, my + 3, 3, 1);
  }

  /* face furniture */
  if (d.scar) {
    ctx.fillStyle = dark;
    for (let i = 0; i < 6; i++) ctx.fillRect(cx + rx - 10 + i, headY - 3 + i, 1, 1);
    ctx.fillRect(cx + rx - 9, headY - 2, 1, 1); ctx.fillRect(cx + rx - 7, headY, 1, 1);
    ctx.fillRect(cx + rx - 10, headY, 2, 1); ctx.fillRect(cx + rx - 7, headY - 3, 2, 1);
  }
  if (d.warts) {
    [[-rx + 4, headY - 1], [rx - 5, headY + 2], [-6, headY - 6], [7, headY + 7], [-rx + 6, headY + 7]]
      .forEach(([wx, wy]) => {
        PIX.rect(ctx, cx + wx, wy, 2, 1, dark);
        PIX.rect(ctx, cx + wx, wy - 1, 1, 1, P[d.skin[2]]);
      });
  }
  if (d.earring) {
    PIX.rect(ctx, cx - rx - 1, headY + 4, 1, 2, P[d.earring] || P.G);
    PIX.rect(ctx, cx + rx, headY + 4, 1, 2, P[d.earring] || P.G);
  }

  /* ---- the costume at the neck: FRONT layers, tucked under the chin ---- */
  {
    const fTop = Math.min(H - 4, headY + ry - 1);
    const rows = H - fTop;
    const cSt = (cSh && cSh.collar) || 'point';
    const shirtC = P[(cSh && cSh.col) || d.shirt] || P.W;
    const N = C.neck || { type: 'none' };

    /* lapel tips flanking the collar */
    if (CO && CO.lapel !== 'none') {
      for (let i = 0; i < rows; i++) {
        [-1, 1].forEach(s => {
          const x0 = cx + s * (9 + i * 2) - (s < 0 ? 4 : 0);
          PIX.rect(ctx, x0 - 1, fTop + i, 6, 1, P.K);
          PIX.rect(ctx, x0, fTop + i, 4, 1, outer);
          PIX.rect(ctx, x0, fTop + i, 4, 1,
            CO.satin ? 'rgba(255,255,255,.20)' : 'rgba(255,255,255,.10)');
        });
      }
      if (CO.lapel === 'peak') {                 // peak spikes riding up
        [-1, 1].forEach(s => {
          for (let i = 0; i < 3; i++) {
            const x0 = cx + s * (13 + i * 2) - (s < 0 ? 3 : 0);
            PIX.rect(ctx, x0 - 1, fTop - 1 - i, 5, 2, P.K);
            PIX.rect(ctx, x0, fTop - 1 - i, 3, 1, outer);
          }
        });
      }
      if (CO.fur) {
        const fc = P[CO.fur] || P.T;
        [-1, 1].forEach(s => {
          const x0 = s < 0 ? cx - 17 : cx + 12;
          PIX.rect(ctx, x0 - 1, fTop - 1, 7, rows + 1, P.K);
          PIX.dither(ctx, x0, fTop - 1, 5, rows, fc, outerDk);
        });
      }
    }

    /* shirt collar / gown neckline */
    if (bare) {
      for (let i = 0; i < Math.min(3, rows); i++) {
        const hwv = 5 + i * 3;
        PIX.rect(ctx, cx - hwv - 1, H - 3 + i, hwv * 2 + 3, 1, P.K);
        PIX.rect(ctx, cx - hwv, H - 3 + i, hwv * 2 + 1, 1, P[C.gown.col] || P.d);
      }
    } else if (cSt === 'band') {
      PIX.rect(ctx, cx - 8, fTop - 1, 17, 4, P.K);
      PIX.rect(ctx, cx - 7, fTop - 1, 15, 3, shirtC);
      PIX.rect(ctx, cx - 7, fTop + 1, 15, 1, 'rgba(0,0,0,.22)');
      if (CO && CO.buttonCol) PIX.rect(ctx, cx - 1, fTop, 2, 2, P[CO.buttonCol] || P.G);
    } else {
      PIX.rect(ctx, cx - 7, fTop - 1, 15, 2, P.K);
      PIX.rect(ctx, cx - 6, fTop - 1, 13, 1, shirtC);
      for (let i = 0; i < rows; i++) {
        const out = cSt === 'wing' ? Math.min(i, 1) : (cSt === 'spread' ? i + 1 : i);
        [-1, 1].forEach(s => {
          const x0 = cx + s * (4 + out) - (s < 0 ? 3 : 0);
          PIX.rect(ctx, x0 - 1, fTop + i, 5, 1, P.K);
          PIX.rect(ctx, x0, fTop + i, 3, 1, shirtC);
          if (i === rows - 1) PIX.rect(ctx, x0, fTop + i, 3, 1, 'rgba(0,0,0,.22)');
        });
      }
    }

    /* neckwear */
    if (N.type === 'tie') {
      const tc = P[N.col] || P.d;
      const kx = cx + (N.loose ? 1 : 0);
      PIX.rect(ctx, kx - 4, fTop, 8, 5, P.K);
      PIX.rect(ctx, kx - 3, fTop + 1, 6, 3, tc);
      PIX.rect(ctx, kx - 3, fTop + 1, 6, 1, 'rgba(255,255,255,.18)');
      PIX.rect(ctx, kx - 3, fTop + 4, 6, H - fTop - 4, P.K);
      PIX.rect(ctx, kx - 2, fTop + 4, 4, H - fTop - 4, tc);
      PIX.rect(ctx, kx + 1, fTop + 4, 1, H - fTop - 4, 'rgba(0,0,0,.26)');
    } else if (N.type === 'bowtie') {
      const bc = P[N.col] || P.d, bd = P[DARKER[N.col]] || P.K;
      const tl = N.loose ? 1 : 0;
      /* fat frogs push fTop to H-4; keep the whole bow on the canvas */
      const ty = Math.min(fTop, H - 6 - 2 * tl) + tl;
      PIX.rect(ctx, cx - 10, ty - tl, 7, 6, P.K);
      PIX.rect(ctx, cx + 3, ty + tl, 7, 6, P.K);
      PIX.rect(ctx, cx - 9, ty + 1 - tl, 5, 4, bc);
      PIX.rect(ctx, cx + 4, ty + 1 + tl, 5, 4, bc);
      PIX.rect(ctx, cx - 9, ty + 3 - tl, 5, 1, bd);
      PIX.rect(ctx, cx + 4, ty + 3 + tl, 5, 1, bd);
      PIX.rect(ctx, cx - 3, ty + 1, 7, 5, P.K);
      PIX.rect(ctx, cx - 2, ty + 2, 5, 3, bc);
      PIX.rect(ctx, cx - 2, ty + 2, 5, 1, 'rgba(255,255,255,.18)');
    } else if (N.type === 'cravat') {
      const cc = P[N.col] || P.T;
      PIX.rect(ctx, cx - 6, fTop, 13, rows, P.K);
      PIX.rect(ctx, cx - 5, fTop + 1, 11, rows - 1, cc);
      PIX.rect(ctx, cx + 2, fTop + 1, 3, rows - 1, 'rgba(0,0,0,.24)');
      PIX.rect(ctx, cx - 4, fTop + 1, 4, 1, 'rgba(255,255,255,.16)');
      PIX.rect(ctx, cx - 1, fTop + 2, 2, 2, P.G);
    }

    /* pearls / necklace ride over the collar */
    const pearl = cAcc.pearls || d.necklace;
    if (pearl) {
      const pc = P[pearl] || P.W;
      for (let i = -4; i <= 4; i++) {
        const yy = fTop - 1 + Math.round((4 - Math.abs(i)) * 0.5);
        PIX.rect(ctx, cx + i * 2 - 1, yy, 2, 2, P.K);
        PIX.rect(ctx, cx + i * 2 - 1, yy, 2, 1, pc);
      }
    }
    if (cAcc.badge) {
      const bc = P[cAcc.badge] || P.L;
      PIX.rect(ctx, cx - 15, fTop + 1, 5, 5, P.K);
      PIX.rect(ctx, cx - 14, fTop + 2, 3, 3, bc);
      PIX.rect(ctx, cx - 14, fTop + 2, 1, 1, P.W);
    }
  }

  /* hat brim throws a shadow across the top of the eye bulbs */
  if (d.hat || d.flatcap) {
    const brimY = d.hat === 'tophat' ? 10 : (d.flatcap ? 8 : 9);
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    PIX.rect(ctx, 0, brimY, W, 2, 'rgba(0,0,0,.26)');
    PIX.rect(ctx, 0, brimY + 2, W, 1, 'rgba(0,0,0,.13)');
    ctx.restore();
  }

  /* hats (over everything) — the crown sits between the eye bulbs */
  const hatTop = 0;
  if (d.hat === 'fedora') {
    const hc = P[d.hatCol] || P.T;
    PIX.rect(ctx, cx - 7, hatTop, 15, 7, P.K);
    PIX.rect(ctx, cx - 6, hatTop + 1, 13, 6, hc);
    PIX.rect(ctx, cx - 6, hatTop + 4, 13, 2, P[d.band] || P.d);
    PIX.rect(ctx, cx - 10, hatTop + 7, 21, 2, P.K);
    PIX.rect(ctx, cx - 9, hatTop + 7, 19, 1, hc);
    PIX.rect(ctx, cx - 4, hatTop + 1, 5, 1, P.W);
  }
  if (d.hat === 'tophat') {
    const hc = P[d.hatCol] || P.k;
    PIX.rect(ctx, cx - 7, hatTop, 15, 9, P.K);
    PIX.rect(ctx, cx - 6, hatTop, 13, 8, hc);
    PIX.rect(ctx, cx - 6, hatTop + 6, 13, 2, P[d.band] || P.G);
    PIX.rect(ctx, cx - 11, hatTop + 8, 23, 2, P.K);
    PIX.rect(ctx, cx - 10, hatTop + 8, 21, 1, hc);
  }
  if (d.hat === 'bowler') {
    PIX.disc(ctx, cx, hatTop + 6, 7, P.K);
    PIX.disc(ctx, cx, hatTop + 6, 6, P.u);
    PIX.rect(ctx, cx - 10, hatTop + 7, 21, 2, P.K);
    PIX.rect(ctx, cx - 9, hatTop + 7, 19, 1, P.u);
    PIX.rect(ctx, cx - 5, hatTop + 5, 11, 2, P.U);
  }
  if (d.flatcap) {
    PIX.rect(ctx, cx - 8, hatTop + 2, 17, 5, P.K);
    PIX.rect(ctx, cx - 7, hatTop + 3, 15, 4, P.t);
    PIX.rect(ctx, cx - 10, hatTop + 6, 9, 2, P.K);
    PIX.rect(ctx, cx - 9, hatTop + 6, 7, 1, P.s);
  }

  /* smokes (front-most) */
  if (d.cigar && expr !== 'dead') {
    PIX.rect(ctx, cx + mw - 2, my + 1, 8, 3, P.K);
    PIX.rect(ctx, cx + mw - 1, my + 2, 6, 1, P.b);
    PIX.rect(ctx, cx + mw + 5, my + 2, 1, 1, P.O);
    PIX.rect(ctx, cx + mw + 5, my - 1, 1, 1, P.q);
    PIX.rect(ctx, cx + mw + 6, my - 3, 1, 1, P.q);
  }
  if (d.cigholder && expr !== 'dead') {
    PIX.rect(ctx, cx + mw - 1, my + 1, 9, 1, P.K);
    PIX.rect(ctx, cx + mw + 8, my, 2, 2, P.K);
    PIX.rect(ctx, cx + mw + 8, my, 1, 1, P.O);
    PIX.rect(ctx, cx + mw + 9, my - 2, 1, 1, P.q);
    PIX.rect(ctx, cx + mw + 8, my - 4, 1, 1, P.q);
  }
  return cv;
};

/* ------------------------------------------------------------
   seated body for the duel table — true stepped pixel-art: no
   diagonals, only stair-stepped rects, chunky K outlines, side
   shading from the hanging lamp (top-left highlight, right shade).
   Layers, back to front:
     torso -> shirt/skin in the front opening (collar, placket,
     buttons) -> waistcoat -> neckwear -> jacket/overcoat lapels,
     buttons, pockets -> chest accessories -> sleeves -> sleeve
     accessories -> bowtie.
   ------------------------------------------------------------ */
SPR.buildBody = function (d, o) {
  o = o || {};
  /* SEATED: he is behind a table, so the forearms go down out of frame
     instead of stopping in mid-air with a shirt cuff on the end. They also
     hang closer to the body — the bowed-out elbow of the standing pose
     reads as a robot arm once the hands are gone. */
  const seated = !!o.seated;
  /* TUCKED: standing at full length, but with the arms in against the ribs
     the way the seated pose has them. The bowed-out elbow of the old
     standing pose reads as a gorilla once you can see the whole frog. */
  const tuck = !!o.tuck;
  const armIn = seated || tuck;
  /* THE SWING, -1..1. The arms used to be baked stiff into the bust and only
     the hands bobbed, which is what made the walk look broken: a limb that
     does not move attached to a hand that does. Now the elbow and the wrist
     travel with the stride and the hand is hung off wherever the wrist
     actually ended up. */
  const swing = Math.max(-1, Math.min(1, o.swing || 0));
  const P = PIX.PAL;
  const C = SPR.costumeOf(d);
  const W = 116, H = 60, cx = 58;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  const fat = !!d.fat;
  const L = (l, fb) => (l && P[l]) || fb;
  const skin = P[d.skin[0]], skShade = P[d.skin[1]], skDark = P[d.skin[2]];
  const INK = P.K;
  const SH1 = 'rgba(0,0,0,.28)';       // right-side shadow
  const SH2 = 'rgba(0,0,0,.18)';       // soft crease
  const SH3 = 'rgba(0,0,0,.38)';       // hard seam
  const HI = 'rgba(255,255,255,.09)';  // left highlight
  const SHEEN = 'rgba(255,255,255,.26)'; // satin / silk
  const CHALK = 'rgba(244,239,224,.22)'; // chalk stripe

  const O = C.overcoat || C.jacket || null;   // outermost tailored layer
  const vc = C.waistcoat, vcOuter = !!(vc && vc.outer);
  const sh = C.shirt, gown = C.gown, acc = C.acc || {};
  const N = C.neck || { type: 'none' };

  /* ---------- colours ---------- */
  let baseL, baseD, stripe = null, stripeGap = 5;
  if (O) { baseL = O.col; baseD = O.dark; stripe = O.stripe; stripeGap = O.stripeGap || 5; }
  else if (gown) { baseL = gown.col; baseD = gown.dark; }
  else if (sh) { baseL = sh.col; baseD = DARKER[sh.col] || 'q'; }
  else { baseL = 'T'; baseD = 'k'; }
  const base = L(baseL, P.T), baseDk = L(baseD, P.k);
  const shirtC = L(sh && sh.col, P.W);
  const shirtDk = L(sh && DARKER[sh.col], P.w);

  /* ---------- torso profile (half-width per row) ---------- */
  const pad = C.pad || 0, shX = C.shoulder || 0;
  /* A tailored jacket is WIDEST at the shoulder and tapers to the waist —
     the old profile had it backwards (narrow shoulders, wide gut), which is
     why the arms looked bolted on. Rows 4-17 are the padded shoulder line. */
  const prof = [];
  for (let y = 0; y < H; y++) {
    let hw;
    if (y < 2) hw = 15;                       // neck root
    else if (y < 3) hw = 25;                  // trapezius, one hard step
    else if (y < 4) hw = 34;
    else if (y < 15) hw = tuck ? 34 : 41;     // THE shoulder line — the widest point
    else if (y < 21) hw = (tuck ? 34 : 40) - (y - 15) * 2;  // hard taper under the pad
    else if (y < 36) hw = 30;                 // ribs — narrow, so the arms hang clear
    else if (y < 48) hw = 31;                 // waist
    else hw = 33;                             // seat spreading on the chair
    if (fat) {
      hw += 8;
      if (y >= 22) hw += Math.min(8, 2 + ((y - 22) >> 2)); // the belly steps out
    }
    hw += pad;
    if (shX) {
      if (y >= 3 && y <= 18) hw += shX;
      else if (y > 18 && y <= 24) hw += Math.round(shX * (24 - y) / 6);
    }
    prof.push(Math.min(hw, 55));
  }

  /* ---------- 1. neck + torso silhouette ---------- */
  PIX.rect(ctx, cx - 8, 0, 16, 8, INK);
  PIX.rect(ctx, cx - 7, 0, 14, 7, skin);
  PIX.rect(ctx, cx - 7, 5, 14, 2, skShade);

  for (let y = 2; y < H; y++) {
    const hw = prof[y], hwUp = prof[y - 1] || 0;
    PIX.rect(ctx, cx - hw - 1, y, (hw + 1) * 2 + 1, 1, INK);
    if (y === 2) continue;                        // top edge stays ink
    if (hw > hwUp + 1) {                          // step ledges get an ink cap
      PIX.rect(ctx, cx - hw - 1, y, hw - hwUp, 1, INK);
      PIX.rect(ctx, cx + hwUp + 1, y, hw - hwUp + 1, 1, INK);
    }
    PIX.rect(ctx, cx - hw, y, hw * 2 + 1, 1, base);
  }
  for (let y = 4; y < H; y++) {                   // lamp light: left hi, right shade
    const hw = prof[y];
    PIX.rect(ctx, cx + hw - 4, y, 4, 1, SH1);
    PIX.rect(ctx, cx - hw + 1, y, 2, 1, HI);
  }
  if (stripe === 'chalk') {
    for (let x = -54; x <= 54; x += stripeGap) {
      for (let y = 3; y < H; y++) if (Math.abs(x) <= prof[y] - 3) PIX.rect(ctx, cx + x, y, 1, 1, CHALK);
    }
  }
  if (fat) {                                      // belly step + crease
    const bp = prof[H - 8];
    PIX.rect(ctx, cx - bp + 10, H - 8, (bp - 10) * 2, 1, 'rgba(0,0,0,.3)');
    PIX.rect(ctx, cx - bp + 14, H - 18, (bp - 14) * 2, 1, SH2);
  }

  /* ---------- geometry of the front opening ---------- */
  const gorge = O ? O.gorge : 3;
  const closeY = O ? O.close : H;
  const openTop = O ? O.open : (fat ? 26 : 22);
  const openBot = O ? (O.openBot === undefined ? 2 : O.openBot) : (fat ? 26 : 22);
  function frontHW(y) {
    if (!O) {
      if (y < 1) return 0;
      return Math.min(openTop, Math.max(4, prof[y] - 13));
    }
    if (y < gorge || y > closeY) return 0;
    const span = Math.max(1, closeY - gorge);
    const t = Math.min(1, (y - gorge) / span);
    return Math.max(2, Math.round((openTop * (1 - t) + openBot * t) / 2) * 2);
  }
  const frontBot = Math.min(H - 1, O ? closeY : H - 1);

  /* ---------- 2. shirt (or bare skin, for a gown) ---------- */
  if (gown) {
    for (let y = 0; y < 14; y++) {                // stepped neckline
      const f = 16 - Math.round(y * 1.4 / 2) * 2;
      if (f < 1) continue;
      PIX.rect(ctx, cx - f - 1, y, f * 2 + 3, 1, INK);
      PIX.rect(ctx, cx - f, y, f * 2 + 1, 1, skin);
      PIX.rect(ctx, cx + f - 2, y, 2, 1, 'rgba(0,0,0,.2)');
      PIX.rect(ctx, cx - f + 1, y, 1, 1, 'rgba(255,255,255,.10)');
    }
    if (gown.neckline !== 'halter') {             // sweetheart point rising centre
      for (let i = 0; i < 7; i++) {
        const hwv = i + 1;
        PIX.rect(ctx, cx - hwv - 1, 4 + i, hwv * 2 + 3, 1, INK);
        PIX.rect(ctx, cx - hwv, 4 + i, hwv * 2 + 1, 1, base);
      }
    }
    PIX.rect(ctx, cx - 5, 11, 11, 1, skDark);     // collarbone hint
  } else {
    for (let y = 1; y <= frontBot; y++) {
      const f = frontHW(y);
      if (f < 2) continue;
      PIX.rect(ctx, cx - f - 1, y, 1, 1, INK);
      PIX.rect(ctx, cx + f + 1, y, 1, 1, INK);
      PIX.rect(ctx, cx - f, y, f * 2 + 1, 1, shirtC);
      if (f >= 4) PIX.rect(ctx, cx + f - 2, y, 2, 1, SH2);
    }
    /* placket + shirt buttons / studs down the centre */
    const plTop = Math.max(2, gorge + 4);
    for (let y = plTop; y <= frontBot; y++) {
      if (frontHW(y) < 3) continue;
      PIX.rect(ctx, cx - 2, y, 1, 1, 'rgba(0,0,0,.13)');
      PIX.rect(ctx, cx + 2, y, 1, 1, 'rgba(0,0,0,.13)');
    }
    const studC = L(sh && sh.studs, shirtDk);
    for (let y = plTop + 3; y <= frontBot; y += 6) {
      if (frontHW(y) < 3) continue;
      PIX.rect(ctx, cx - 1, y, 2, 2, studC);
      PIX.rect(ctx, cx - 1, y, 1, 1, 'rgba(255,255,255,.25)');
    }
    /* collar */
    const cst = (sh && sh.collar) || 'point';
    const f0 = Math.max(4, frontHW(gorge + 1));
    if (cst === 'band') {
      PIX.rect(ctx, cx - f0 - 3, 0, (f0 + 3) * 2 + 1, 5, INK);
      PIX.rect(ctx, cx - f0 - 2, 0, (f0 + 2) * 2 + 1, 4, shirtC);
      PIX.rect(ctx, cx - f0 - 2, 3, (f0 + 2) * 2 + 1, 1, SH2);
    } else {
      const WINGS = { point: [[3, 4], [4, 5], [5, 6], [6, 5], [7, 4]],
                      spread: [[2, 6], [3, 7], [4, 8], [5, 7]],
                      wing: [[2, 5], [3, 5], [4, 4]] };
      const wing = WINGS[cst] || WINGS.point;
      [-1, 1].forEach(s => {
        wing.forEach(([row, out], i) => {
          const y = 1 + row, x = cx + (s < 0 ? -3 - out : 3 + out - 3);
          PIX.rect(ctx, x - 1, y, 5, 2, INK);
          PIX.rect(ctx, x, y, 3, 2, shirtC);
          if (i === wing.length - 1) PIX.rect(ctx, x, y + 2, 3, 1, SH1);
        });
        PIX.rect(ctx, cx + s * 5 - 2, 1, 4, 2, shirtC);   // collar band
      });
    }
  }

  /* braces (suspenders) sit straight on the shirt — never on top of a coat,
     so every row is clipped to whatever shirt is actually showing */
  if (acc.braces && !gown) {
    const bc = L(acc.braces, P.T), bd = L(DARKER[acc.braces], P.k);
    [-1, 1].forEach(s => {
      for (let y = 8; y < H; y++) {
        const t = Math.min(1, y / 34);
        const bw = Math.round((13 * (1 - t) + 7 * t) / 2) * 2;
        if (bw + 3 > frontHW(y)) continue;         // hidden under the jacket
        const bx = cx + s * bw;
        PIX.rect(ctx, bx - 3, y, 6, 1, INK);
        PIX.rect(ctx, bx - 2, y, 4, 1, bc);
        PIX.rect(ctx, bx + 1, y, 1, 1, bd);
      }
    });
    if (frontHW(30) > 12) {
      PIX.rect(ctx, cx - 9, 30, 3, 3, P.G); PIX.rect(ctx, cx + 7, 30, 3, 3, P.G);
    }
  }

  /* ---------- 3. waistcoat ---------- */
  if (vc) {
    const vcC = L(vc.col, P.T), vcD = L(vc.dark, P.k);
    const vTop = vc.top === undefined ? 8 : vc.top;
    const vClose = vc.close === undefined ? 20 : vc.close;
    const vBot = vcOuter ? H : Math.min(H, closeY + 2);
    for (let y = vTop; y < vBot; y++) {
      const f = vcOuter ? Math.min(prof[y] - 9, 27) : frontHW(y);
      if (f < 3) continue;
      let inner = 0;
      if (y < vClose) {
        const t = (y - vTop) / Math.max(1, vClose - vTop);
        inner = Math.max(2, Math.round((9 * (1 - t)) / 2) * 2);
      }
      if (inner <= 0) {
        PIX.rect(ctx, cx - f - 1, y, f * 2 + 3, 1, INK);
        PIX.rect(ctx, cx - f, y, f * 2 + 1, 1, vcC);
      } else {
        PIX.rect(ctx, cx - f - 1, y, f - inner + 2, 1, INK);
        PIX.rect(ctx, cx + inner - 1, y, f - inner + 2, 1, INK);
        PIX.rect(ctx, cx - f, y, f - inner, 1, vcC);
        PIX.rect(ctx, cx + inner + 1, y, f - inner, 1, vcC);
      }
      PIX.rect(ctx, cx + f - 2, y, 2, 1, SH1);
      PIX.rect(ctx, cx - f, y, 1, 1, 'rgba(255,255,255,.10)');
    }
    /* buttons down the closed part, gold if brass */
    const bc = L(vc.buttonCol, P.q);
    const nb = vc.buttons || 4;
    for (let i = 0; i < nb; i++) {
      const y = vClose + 1 + i * 5;
      if (y > vBot - 3) break;
      PIX.rect(ctx, cx - 2, y - 1, 5, 5, INK);
      PIX.rect(ctx, cx - 1, y, 3, 3, bc);
      PIX.rect(ctx, cx - 1, y, 2, 1, 'rgba(255,255,255,.34)');
      PIX.rect(ctx, cx, y + 2, 2, 1, SH3);
      if (fat) {                                  // the buttons strain
        PIX.rect(ctx, cx - 6, y + 1, 4, 1, SH2);
        PIX.rect(ctx, cx + 3, y + 1, 4, 1, SH2);
      }
    }
    if (vcOuter) {                                // livery: welt pockets low
      [-1, 1].forEach(s => {
        const px = cx + s * 20 - (s < 0 ? 8 : 0);
        PIX.rect(ctx, px - 1, 33, 10, 3, INK);
        PIX.rect(ctx, px, 33, 8, 2, vcD);
      });
    }
  }

  /* ---------- 4. neckwear that lives UNDER the lapels ---------- */
  const nTop = O ? gorge + 1 : 3;
  if (N.type === 'tie') {
    const tc = L(N.col, P.d), tl = 'rgba(255,255,255,.20)';
    const kx = cx + (N.loose ? 2 : 0);
    const kY = nTop + (N.loose ? 3 : 0);
    PIX.rect(ctx, kx - 4, kY, 8, 7, INK);
    PIX.rect(ctx, kx - 3, kY + 1, 6, 5, tc);
    PIX.rect(ctx, kx - 3, kY + 1, 6, 1, 'rgba(255,255,255,.16)');
    PIX.rect(ctx, kx + 1, kY + 1, 2, 5, SH2);
    const tipY = Math.min(H - 3, O ? Math.max(closeY - 2, kY + 14) : 36);
    for (let y = kY + 6; y <= tipY; y++) {
      const half = (y > tipY - 3) ? Math.max(1, 3 - (y - (tipY - 3))) : 3;
      PIX.rect(ctx, kx - half - 1, y, half * 2 + 3, 1, INK);
      PIX.rect(ctx, kx - half, y, half * 2 + 1, 1, tc);
      PIX.rect(ctx, kx + half - 1, y, 1, 1, 'rgba(0,0,0,.26)');
      if (N.pat === 'stripe') {
        const xo = ((((y >> 1) * 2) % 8) - 4);
        PIX.rect(ctx, kx + Math.max(-half, Math.min(half - 1, xo)), y, 2, 1, tl);
      } else if (N.pat === 'dot' && (y % 4) === 1) {
        PIX.rect(ctx, kx - 1 + ((y % 8) < 4 ? -1 : 1), y, 2, 1, tl);
      }
    }
  }
  if (N.type === 'cravat') {
    const cc = L(N.col, P.T);
    const rows = [[7, 0], [8, 2], [8, 4], [7, 6], [6, 8], [4, 10]];
    rows.forEach(([hwv, dy]) => {
      PIX.rect(ctx, cx - hwv - 1, nTop + dy, hwv * 2 + 3, 2, INK);
      PIX.rect(ctx, cx - hwv, nTop + dy, hwv * 2 + 1, 2, cc);
      PIX.rect(ctx, cx + hwv - 2, nTop + dy, 2, 2, SH1);
    });
    PIX.rect(ctx, cx - 4, nTop + 3, 3, 1, 'rgba(255,255,255,.16)');
    PIX.rect(ctx, cx + 1, nTop + 6, 4, 1, SH2);
    PIX.rect(ctx, cx - 1, nTop + 5, 3, 3, INK);   // stick pin
    PIX.rect(ctx, cx, nTop + 6, 2, 2, P.G);
  }

  /* ---------- 5. jacket / overcoat: lapels, closure, pockets ---------- */
  if (O && O.lapel !== 'none') {
    const lw = O.lapelW || 5;
    const f0 = frontHW(gorge);
    for (let y = gorge; y <= Math.min(closeY, H - 1); y++) {
      const f = frontHW(y);
      if (f < 2) continue;
      const extra = (y < gorge + 4 && O.lapel === 'shawl') ? 2 : 0;
      [-1, 1].forEach(s => {
        const x0 = s < 0 ? cx - f - 1 - lw - extra : cx + f + 2;
        const wd = lw + extra;
        PIX.rect(ctx, x0, y, wd, 1, base);
        PIX.rect(ctx, x0, y, wd, 1, O.satin ? SHEEN : 'rgba(255,255,255,.15)');
        PIX.rect(ctx, s < 0 ? x0 - 1 : x0 + wd, y, 1, 1, INK);              // lapel edge
        PIX.rect(ctx, s < 0 ? x0 : x0 + wd - 1, y, 1, 1, 'rgba(255,255,255,.22)');
      });
    }
    if (O.lapel === 'notch') {
      [-1, 1].forEach(s => {
        const ox = cx + s * (f0 + 1 + lw);
        PIX.rect(ctx, s < 0 ? ox - 2 : ox - 1, gorge, 4, 2, INK);
        PIX.rect(ctx, s < 0 ? ox - 1 : ox - 1, gorge + 2, 3, 1, INK);
      });
    }
    if (O.lapel === 'peak') {                    // stepped peaks pointing up-out
      [-1, 1].forEach(s => {
        for (let i = 0; i < 4; i++) {
          const py = gorge + 1 - i;
          if (py < 0) break;
          const ox = cx + s * (f0 + 1 + lw + i);
          const x0 = s < 0 ? ox - 1 : ox - 2;
          PIX.rect(ctx, x0, py, 4, 2, INK);
          PIX.rect(ctx, x0 + 1, py, 2, 1, base);
          PIX.rect(ctx, x0 + 1, py, 2, 1, O.satin ? SHEEN : HI);
        }
      });
    }
    if (O.lapel === 'shawl') {                   // unbroken satin roll over the top
      [-1, 1].forEach(s => {
        for (let i = 0; i < 3; i++) {
          const ox = cx + s * (f0 - 1 + i * 2);
          PIX.rect(ctx, s < 0 ? ox - lw : ox, gorge - 1 - i, lw, 2, INK);
          PIX.rect(ctx, s < 0 ? ox - lw + 1 : ox, gorge - 1 - i, lw - 1, 1, base);
          PIX.rect(ctx, s < 0 ? ox - lw + 1 : ox, gorge - 1 - i, lw - 1, 1, SHEEN);
        }
      });
    }
    if (O.fur) {                                 // fur collar, dithered
      const fc = L(O.fur, P.T);
      [-1, 1].forEach(s => {
        for (let i = 0; i < 5; i++) {
          const x0 = cx + s * (f0 + lw + 1 + i) - (s < 0 ? 3 : 0);
          PIX.rect(ctx, x0, gorge - 2 + i, 4, 3, INK);
          PIX.dither(ctx, x0 + 1, gorge - 2 + i, 2, 2, fc, baseDk);
        }
      });
    }
  }
  if (O) {
    const bcol = L(O.buttonCol, palLum(baseL) < 90 ? P.q : P[DARKER[baseL]] || P.k);
    const bhi = O.buttonCol ? 'rgba(255,255,255,.38)' : 'rgba(255,255,255,.34)';
    if (O.dbl) {
      /* the wrap-over edge, stair-stepped in */
      const wEnd = Math.min(H - 1, closeY + 10);
      for (let y = gorge; y <= wEnd; y++) {
        const t = Math.min(1, (y - gorge) / Math.max(1, wEnd - gorge));
        const xw = Math.round(((frontHW(gorge) + 2) * (1 - t) + 11 * t) / 2) * 2;
        PIX.rect(ctx, cx + xw, y, 1, 1, SH3);
      }
      const rows = O.rows || 2, per = O.buttons || 3;
      for (let r = 0; r < rows; r++) {
        for (let i = 0; i < per; i++) {
          const y = closeY + i * 6, bx = cx + (r === 0 ? -11 : 8);
          if (y > H - 5) break;
          PIX.rect(ctx, bx - 1, y - 1, 5, 5, INK);
          PIX.rect(ctx, bx, y, 3, 3, bcol);
          PIX.rect(ctx, bx, y, 2, 1, bhi);
          PIX.rect(ctx, bx + 1, y + 2, 2, 1, SH3);
        }
      }
    } else if (O.buttons) {
      for (let i = 0; i < O.buttons; i++) {
        const y = closeY + i * 6;
        if (y > H - 5) break;
        PIX.rect(ctx, cx - 2, y - 1, 5, 5, INK);
        PIX.rect(ctx, cx - 1, y, 3, 3, bcol);
        PIX.rect(ctx, cx - 1, y, 2, 1, bhi);
        PIX.rect(ctx, cx, y + 2, 2, 1, SH3);
      }
    }
    /* front darts — quiet tailoring lines */
    [-1, 1].forEach(s => {
      for (let y = Math.max(18, closeY - 4); y < H - 4; y++) {
        PIX.rect(ctx, cx + s * 15, y, 1, 1, 'rgba(0,0,0,.12)');
      }
    });
    /* pockets */
    const hipY = 34, hipHW = prof[hipY] - 5;
    if (O.pockets === 'welt' || O.pockets === 'flap') {
      PIX.rect(ctx, cx - 27, 15, 10, 3, INK);            // breast welt
      PIX.rect(ctx, cx - 26, 15, 8, 2, baseDk);
      [-1, 1].forEach(s => {
        const x0 = s < 0 ? cx - hipHW : cx + hipHW - 15;
        if (O.pockets === 'flap') {
          PIX.rect(ctx, x0 - 1, hipY, 17, 6, INK);
          PIX.rect(ctx, x0, hipY, 15, 4, base);
          PIX.rect(ctx, x0, hipY, 15, 1, HI);
          PIX.rect(ctx, x0, hipY + 4, 15, 1, SH1);
        } else {
          PIX.rect(ctx, x0 - 1, hipY, 17, 3, INK);
          PIX.rect(ctx, x0, hipY, 15, 2, baseDk);
        }
      });
    } else if (O.pockets === 'patch') {
      PIX.rect(ctx, cx - 27, 13, 11, 9, INK);            // breast patch
      PIX.rect(ctx, cx - 26, 14, 9, 7, base);
      PIX.rect(ctx, cx - 26, 14, 9, 2, baseDk);
      PIX.rect(ctx, cx - 22, 15, 2, 1, L(O.buttonCol, baseDk));
      [-1, 1].forEach(s => {
        const x0 = s < 0 ? cx - hipHW : cx + hipHW - 15;
        PIX.rect(ctx, x0 - 1, hipY - 2, 17, 12, INK);
        PIX.rect(ctx, x0, hipY - 1, 15, 10, base);
        PIX.rect(ctx, x0, hipY - 1, 15, 2, baseDk);
        PIX.rect(ctx, x0 + 6, hipY, 3, 2, L(O.buttonCol, baseDk));
        PIX.rect(ctx, x0 + 13, hipY - 1, 2, 10, SH1);
      });
    }
  }

  if (O && O.stormFlap) {                        // overcoat gun flap over one chest
    const fY = gorge + 2, fB = Math.min(H - 6, closeY + 12);
    for (let y = fY; y < fB; y++) {
      const t = Math.min(1, (y - fY) / Math.max(1, fB - fY));
      const xo = Math.round((frontHW(fY) + 4) * (1 - t) * 0.5 + 13) ;
      PIX.rect(ctx, cx + xo, y, 1, 1, INK);
      PIX.rect(ctx, cx + xo - 3, y, 3, 1, HI);
    }
    PIX.rect(ctx, cx + 13, fB, 10, 1, INK);
  }
  if (O && O.wrinkles) {                         // cheap cloth, sagging
    [[-24, 22, 7], [-19, 27, 6], [16, 24, 8], [20, 30, 6], [-10, 34, 9], [8, 36, 8]]
      .forEach(([ox, oy, wd]) => PIX.rect(ctx, cx + ox, oy, wd, 1, SH2));
  }

  /* ---------- 6. chest accessories ---------- */
  if (acc.pocketSquare) {
    const pc = L(acc.pocketSquare, P.W);
    PIX.rect(ctx, cx - 26, 12, 9, 4, INK);
    PIX.rect(ctx, cx - 25, 13, 3, 3, pc);
    PIX.rect(ctx, cx - 21, 12, 3, 4, pc);
    PIX.rect(ctx, cx - 23, 14, 2, 2, pc);
  }
  if (acc.boutonniere) {
    const fc = L(acc.boutonniere, P.W);
    PIX.rect(ctx, cx - 22, 11, 5, 5, INK);
    PIX.rect(ctx, cx - 21, 12, 3, 3, fc);
    PIX.rect(ctx, cx - 20, 13, 1, 1, P.G);
    PIX.rect(ctx, cx - 19, 15, 1, 3, P.f);
  }
  if (acc.lapelPin) {
    PIX.rect(ctx, cx - 20, 18, 3, 3, INK);
    PIX.rect(ctx, cx - 19, 19, 2, 2, L(acc.lapelPin, P.G));
  }
  if (acc.badge) {
    const bc = L(acc.badge, P.L);
    const star = [[0, 2, 1], [-1, 3, 3], [-2, 4, 5], [-2, 5, 5], [-1, 6, 3], [0, 7, 1]];
    star.forEach(([ox, oy, wd]) => {
      PIX.rect(ctx, cx - 22 + ox - 1, 13 + oy, wd + 2, 1, INK);
      PIX.rect(ctx, cx - 22 + ox, 13 + oy, wd, 1, bc);
    });
    PIX.rect(ctx, cx - 23, 17, 3, 1, bc);
    PIX.rect(ctx, cx - 22, 17, 1, 1, P.W);
  }
  if (acc.watchChain || acc.chainLong) {
    const gc = L(acc.watchChain || acc.chainLong, P.G);
    const long = !!acc.chainLong;
    const y0 = vc ? (vc.close || 20) + 3 : 24;
    const span = long ? 20 : 12, drop = long ? 18 : 6;
    for (let i = 0; i <= span; i++) {
      const t = i / span;
      const yy = y0 + Math.round(Math.sin(t * Math.PI) * drop);
      PIX.rect(ctx, cx + 3 + i, yy, 1, 1, gc);
      if ((i & 3) === 0) PIX.rect(ctx, cx + 3 + i, yy + 1, 1, 1, L(DARKER[acc.watchChain || acc.chainLong], P.h));
    }
    PIX.rect(ctx, cx + 2, y0 - 1, 3, 3, INK);
    PIX.rect(ctx, cx + 3, y0, 2, 2, gc);
  }
  if (acc.cummerbund) {
    const cc = L(acc.cummerbund, P.k);
    const cbY = Math.max(31, closeY + 1);
    const cbW = Math.min(prof[cbY] - 10, 20);
    PIX.rect(ctx, cx - cbW - 1, cbY - 1, cbW * 2 + 3, 9, INK);
    PIX.rect(ctx, cx - cbW, cbY, cbW * 2 + 1, 7, cc);
    for (let i = 0; i < 3; i++) PIX.rect(ctx, cx - cbW, cbY + 1 + i * 2, cbW * 2 + 1, 1, SH2);
    PIX.rect(ctx, cx - cbW, cbY, cbW * 2 + 1, 1, 'rgba(255,255,255,.14)');
    PIX.rect(ctx, cx + cbW - 2, cbY, 2, 7, SH1);
  }
  if (acc.sash) {                                 // stair-stepped shoulder sash
    const sc = L(acc.sash, P.d), sd = L(DARKER[acc.sash], P.D);
    for (let y = 8; y < 44; y++) {
      const x = cx - 24 + Math.round((y - 8) * 1.2 / 2) * 2;
      PIX.rect(ctx, x - 1, y, 10, 1, INK);
      PIX.rect(ctx, x, y, 8, 1, sc);
      PIX.rect(ctx, x + 6, y, 2, 1, sd);
      PIX.rect(ctx, x, y, 1, 1, 'rgba(255,255,255,.14)');
    }
  }
  if (acc.belt) {
    const bc = L(acc.belt, P.U);
    const bY = 38;
    PIX.rect(ctx, cx - prof[bY] - 1, bY - 1, (prof[bY] + 1) * 2 + 1, 8, INK);
    PIX.rect(ctx, cx - prof[bY], bY, prof[bY] * 2 + 1, 6, bc);
    PIX.rect(ctx, cx - prof[bY], bY, prof[bY] * 2 + 1, 1, 'rgba(255,255,255,.10)');
    PIX.rect(ctx, cx - prof[bY], bY + 5, prof[bY] * 2 + 1, 1, SH1);
    PIX.rect(ctx, cx - 6, bY - 1, 13, 8, INK);    // buckle
    PIX.rect(ctx, cx - 5, bY, 11, 6, P.G);
    PIX.rect(ctx, cx - 2, bY + 1, 5, 4, INK);
    PIX.rect(ctx, cx - 5, bY, 11, 1, P.Y);
  }
  if (acc.apron) {
    const ac = L(acc.apron, P.w);
    const aY = 36;
    for (let y = aY; y < H; y++) {
      const hw = Math.min(prof[y] - 17, 16);
      PIX.rect(ctx, cx - hw - 1, y, hw * 2 + 3, 1, INK);
      PIX.rect(ctx, cx - hw, y, hw * 2 + 1, 1, ac);
      PIX.rect(ctx, cx + hw - 3, y, 3, 1, SH2);
      PIX.rect(ctx, cx - hw, y, 1, 1, 'rgba(255,255,255,.12)');
    }
    const aHw = Math.min(prof[aY] - 17, 16);
    PIX.rect(ctx, cx - aHw - 1, aY - 1, aHw * 2 + 3, 4, INK);
    PIX.rect(ctx, cx - aHw, aY, aHw * 2 + 1, 2, L(DARKER[acc.apron], P.q));
    PIX.rect(ctx, cx - 3, aY, 7, 2, L(acc.apron, P.w));
  }
  if (acc.stole || acc.pearls || d.necklace) {
    if (acc.stole) {                            // fur stole across the shoulders
      const fc = L(acc.stole, P.W), fd = L(DARKER[acc.stole], P.w);
      for (let y = 1; y < 12; y++) {
        const hw = Math.min(prof[y] + 1, 46);
        if (y < 4 && !gown) continue;
        PIX.rect(ctx, cx - hw - 1, y, (hw + 1) * 2 + 1, 1, INK);
        PIX.dither(ctx, cx - hw, y, hw * 2 + 1, 1, fc, fd);
      }
      for (let y = 12; y < 22; y++) {              // the two ends hanging down
        [-1, 1].forEach(s => {
          const x0 = cx + s * 22 - (s < 0 ? 7 : 0);
          PIX.rect(ctx, x0 - 1, y, 9, 1, INK);
          PIX.dither(ctx, x0, y, 7, 1, fc, fd);
        });
      }
    }
    if (acc.pearls || d.necklace) {
      const pc = L(acc.pearls || d.necklace, P.W);
      for (let i = -5; i <= 5; i++) {
        const yy = 13 + Math.round((5 - Math.abs(i)) * 0.7);
        PIX.rect(ctx, cx + i * 2 - 1, yy, 2, 2, INK);
        PIX.rect(ctx, cx + i * 2 - 1, yy, 2, 1, pc);
      }
    }
  }

  /* a jacketless torso is a big flat panel — sculpt it so it reads as cloth */
  if (!O && sh && !vcOuter) {
    for (let y = 4; y < H; y++) {
      const hw = prof[y];
      PIX.rect(ctx, cx + hw - 7, y, 6, 1, SH2);        // right side falls away
      PIX.rect(ctx, cx + hw - 1, y, 1, 1, SH3);        // side seam
      PIX.rect(ctx, cx - hw + 1, y, 3, 1, HI);         // lit left edge
      PIX.rect(ctx, cx - hw, y, 1, 1, SH2);
    }
    PIX.rect(ctx, cx - 30, 30, 3, 1, SH3);             // yoke seam hints
    PIX.rect(ctx, cx + 27, 30, 3, 1, SH3);
    /* chest pocket with a flap */
    PIX.rect(ctx, cx + 13, 20, 12, 9, SH3);
    PIX.rect(ctx, cx + 14, 21, 10, 7, shirtC);
    PIX.rect(ctx, cx + 13, 20, 12, 2, SH2);
    PIX.rect(ctx, cx + 18, 24, 2, 2, shirtDk);
  }

  /* ---------- 7. sleeves ----------
     Arms belong UNDER the coat: they are drawn onto their own layer and
     composited behind everything already painted, so the padded shoulder
     overlaps the sleeve head instead of the sleeve sitting on the chest. */
  const armCv = document.createElement('canvas');
  armCv.width = W; armCv.height = H;
  const actx = armCv.getContext('2d');
  let baseHw = (fat ? 50 : 43) + Math.round(pad * 0.5) + Math.round(shX * 0.6);
  baseHw = Math.min(baseHw, 52);
  /* seated, the arms come in against the ribs — out at the standing width
     they poke past the coat's shoulder and the silhouette turns into steps */
  if (armIn) baseHw -= 7;
  const rolled = !!(sh && sh.rolled);
  const sleeveC = gown ? L(acc.gloves || gown.col, P.W) : base;
  /* must agree with SPR.cuffColor — duel.js paints the felt-hand cuff from it */
  const cuffC = gown ? L(acc.gloves, P.W)
    : (rolled ? skin : L((sh && (sh.cuff || sh.col)) || 'W', P.W));
  const bulky = O && O.big ? 2 : 0;

  [-1, 1].forEach(sgn => {
    /* Anatomy of a frog leaning on a table: the shoulder sits under the coat's
       padded cap, the upper arm hangs just inside the silhouette, and the
       FOREARM swings forward and inward over the coat to reach the felt.
       Upper arm -> behind layer. Forearm -> front layer, fully outlined, so it
       reads as a limb instead of another panel of jacket. */
    const shoX = cx + sgn * (baseHw - 9);          // sleeve head, tucked under the cap
    /* Seated the arm hangs: shoulder, elbow and wrist stack up almost in a
       line. Bowed out the way the standing pose does it, the two-pixel
       stair steps turn the whole limb into a right angle. */
    /* ONE ARM IN, ONE ARM OUT. The offset is the same sign on both sides, so
       in screen space one arm comes across the body while the other swings
       away from it — which is what a stride looks like from the front.
       Mirroring it per side (the obvious thing) makes him shrug instead. */
    /* SIX PIXELS, inside a bust that then gets fitted down to two thirds:
       four on screen, on a figure a hundred and thirty tall. Thirteen. */
    const sw = Math.round(swing * 13);
    /* AND ONE HAND RIDES HIGHER. Sliding both arms sideways alone reads as a
       slide; the arm coming across also lifts while the trailing one hangs,
       and that vertical difference is what sells it at room size. */
    const lift = Math.round(sgn * swing * 4);
    const elX0 = cx + sgn * (baseHw - (armIn ? 8 : 1)) + Math.round(sw * 0.45);
    const haX  = cx + sgn * (baseHw - (armIn ? 13 : 9)) + sw;   // wrist leads the swing
    /* seated, the sleeve head starts BELOW the coat's shoulder line, so the
       arm grows out of the jacket instead of notching a step into it */
    const y0 = seated ? 13 : 8;
    const y2 = seated ? H : 57 - Math.round(Math.abs(sw) * 0.35) - lift;
    /* HOW BENT THE ELBOW IS, this frame. The arm coming across the body is
       folded; the one trailing behind is nearly straight. Without this the
       limb is a pipe that slides about, which is exactly what it looked
       like: no elbow, no forearm, no arm. */
    const fold = seated ? 0.34
      : U.clamp(0.40 + sgn * swing * 0.46, 0.06, 0.92);
    /* a folded arm's elbow rides UP as well as out — the joint is the thing
       that takes up the slack when the hand comes in */
    const yEl = (seated ? 30 : 29) - Math.round(fold * 3) - Math.round(lift * 0.5);
    const elX = elX0 + sgn * Math.round(fold * 4);
    const centerAt = (y) => {
      const t = y < yEl ? (y - y0) / (yEl - y0) : (y - yEl) / (y2 - yEl);
      const a = y < yEl ? shoX : elX, b = y < yEl ? elX : haX;
      return Math.round((a + (b - a) * t) / 2) * 2;   // 2px stair steps
    };
    /* TWO BONES, NOT A TUBE. The old arm ran 12 wide from the shoulder cap
       to the cuff with one pixel of taper in it, and a body drawn that way
       has no joints anywhere: it reads as furniture. A real limb is widest
       at the deltoid, narrows into the elbow, swells again over the top of
       the forearm and pinches to a wrist half the width of the shoulder. */
    const widthAt = (y) => {
      let w;
      if (y <= yEl) {
        const t = U.clamp((y - y0) / Math.max(1, yEl - y0), 0, 1);
        w = 14 - 4 * (t * 0.55 + t * t * 0.45);
      } else if (seated) {
        /* hanging under a table there is no wrist to taper to, and a point
           on the end of the arm reads as a stick */
        const t = U.clamp((y - yEl) / Math.max(1, y2 - yEl), 0, 1);
        w = 11 - 2 * t;
      } else {
        const t = U.clamp((y - yEl) / Math.max(1, y2 - yEl), 0, 1);
        w = 11 - 4.4 * (t * 0.35 + t * t * 0.65)
          + 2 * Math.sin(Math.min(1, t * 2.4) * Math.PI);
      }
      return Math.round(w) + (y <= (rolled ? 26 : y2) ? bulky : 0);
    };
    const rollY = rolled ? 26 : y2 + 1;

    /* ---- upper arm: BEHIND the coat ---- */
    for (let y = y0 - 1; y <= yEl + 2; y++) {
      const c = centerAt(U.clamp(y, y0, y2 - 1)), w = widthAt(y);
      PIX.rect(actx, c - (w >> 1), y, w, 1, INK);
    }
    for (let y = y0; y <= yEl + 1; y++) {
      const c = centerAt(y), w = widthAt(y) - 2;
      const bare = y > rollY;
      PIX.rect(actx, c - (w >> 1), y, w, 1, bare ? skin : sleeveC);
      PIX.rect(actx, c + (sgn < 0 ? -(w >> 1) : (w >> 1) - 2), y, 2, 1, SH1);
      if (y <= y0 + 2) PIX.rect(actx, c - (w >> 1), y, w, 1, 'rgba(255,255,255,.08)');
      if (!bare && stripe === 'chalk') {
        const lx = c - (w >> 1) + ((Math.abs(c) + 1) % stripeGap);
        PIX.rect(actx, lx, y, 1, 1, CHALK);
        PIX.rect(actx, lx + stripeGap, y, 1, 1, CHALK);
      }
    }

    /* ---- forearm ----
       Standing, it swings forward over the coat and needs its own outline.
       Seated, it just goes down past the table edge: keeping it on the
       BEHIND layer means no second dark line running down the ribs, and
       the arm reads as one limb coming out from under the shoulder. */
    const fctx = seated ? actx : ctx;
    for (let y = yEl - 3; y <= y2; y++) {
      const c = centerAt(U.clamp(y, y0, y2 - 1)), w = widthAt(y);
      PIX.rect(fctx, c - (w >> 1), y, w, 1, INK);       // full outline against the coat
    }
    for (let y = yEl - 2; y < y2; y++) {
      const c = centerAt(y), w = widthAt(y) - 2;
      const bare = y > rollY;
      PIX.rect(fctx, c - (w >> 1), y, w, 1, bare ? skin : sleeveC);
      /* A LIMB, NOT A PANEL OF JACKET. On a coat this dark the black
         outline disappears and all you see is a hand sliding about on a
         slab, which is exactly what made the walk look broken. So the
         forearm is lifted a shade out of the coat, rim-lit down its
         outer edge, and it lays a hard shadow on the coat down its
         inner one — the arm is in front of him now, and it reads. */
      if (!seated) PIX.rect(fctx, c - (w >> 1), y, w, 1, 'rgba(255,255,255,.09)');
      const outX = sgn < 0 ? c - (w >> 1) : c + (w >> 1) - 2;
      const inX = sgn < 0 ? c + (w >> 1) - 1 : c - (w >> 1);
      PIX.rect(fctx, outX, y, 2, 1, 'rgba(255,255,255,.20)');
      PIX.rect(fctx, inX, y, 1, 1, SH1);
      if (!seated) PIX.rect(fctx, inX + (sgn < 0 ? 1 : -2), y, 2, 1, 'rgba(0,0,0,.45)');
      if (!bare && stripe === 'chalk') {
        const lx = c - (w >> 1) + ((Math.abs(c) + 1) % stripeGap);
        PIX.rect(fctx, lx, y, 1, 1, CHALK);
      }
      if (bare && (y & 3) === 0) PIX.rect(fctx, c - 1, y, 2, 1, skShade);
    }
    /* THE ELBOW IS A JOINT, not a crease drawn on a pipe. The two tapered
       bones meet in a rounded knob: light on the point of it, shadow in
       the crook, and the cloth creasing away from the fold. */
    const ec = centerAt(yEl);
    const bareEl = yEl > rollY;
    PIX.disc(fctx, ec, yEl, 6, INK);
    PIX.disc(fctx, ec, yEl, 5, bareEl ? skin : sleeveC);
    PIX.disc(fctx, ec + sgn * 2, yEl - 1, 2, 'rgba(255,255,255,.17)');
    PIX.rect(fctx, ec - sgn * 4 - 1, yEl - 2, 3, 5, SH3);
    PIX.rect(fctx, ec - 3, yEl + 3, 6, 1, SH2);
    PIX.rect(fctx, ec - 2, yEl - 4, 5, 1, SH3);
    if (fold > 0.55) {                        /* creases fan out of a hard fold */
      PIX.rect(fctx, ec - sgn * 3 - 1, yEl + 1, 4, 1, SH2);
      PIX.rect(fctx, ec - sgn * 2 - 1, yEl - 2, 3, 1, SH2);
    }

    /* the sleeve head, rounded, so the shoulder is a shoulder and not a step */
    const shc = centerAt(y0);
    PIX.disc(actx, shc, y0 + 5, 8, INK);
    PIX.disc(actx, shc, y0 + 5, 7, sleeveC);
    PIX.disc(actx, shc - sgn, y0 + 3, 4, 'rgba(255,255,255,.08)');

    /* shoulder cap: the coat's own seam riding over the sleeve head. Seated,
       the rounded head already does that job and the bar just floats. */
    const sc = centerAt(y0);
    if (!seated) {
      PIX.rect(ctx, sc - 7, y0 - 1, 14, 2, INK);
      PIX.rect(ctx, sc - 6, y0, 12, 1, base);
      PIX.rect(ctx, sc - 6, y0 + 1, 12, 1, SH2);
    }

    if (rolled) {                                    // the roll itself
      const rc = centerAt(rollY);
      PIX.rect(ctx, rc - 8, rollY - 3, 16, 7, INK);
      PIX.rect(ctx, rc - 7, rollY - 3, 14, 5, sleeveC);
      PIX.rect(ctx, rc - 7, rollY + 1, 14, 1, SH2);
      PIX.rect(ctx, rc - 7, rollY - 3, 14, 1, 'rgba(255,255,255,.14)');
    }
    if (O && O.frayed) {                             // worn-through elbow
      PIX.rect(ctx, ec - 4, yEl - 3, 9, 7, 'rgba(0,0,0,.22)');
      PIX.rect(ctx, ec - 3, yEl - 2, 3, 2, baseDk);
      PIX.rect(ctx, ec + 1, yEl + 1, 3, 2, baseDk);
    }

    /* cuff at the wrist — the scene's felt hands butt straight up against
       this. Seated, there is no wrist to show: the arm is under the table. */
    if (!seated) {
      const wc = centerAt(y2 - 1);
      /* the cuff is a band round the wrist, so it is only a shade wider
         than the wrist now is — 12 across on a 7px wrist was a bracelet */
      PIX.rect(ctx, wc - 5, y2 - 4, 10, 5, INK);
      PIX.rect(ctx, wc - 4, y2 - 4, 8, 4, cuffC);
      PIX.rect(ctx, wc - 4, y2 - 4, 8, 1, 'rgba(255,255,255,.16)');
      PIX.rect(ctx, wc - 4, y2 - 1, 8, 1, SH1);
      if (!gown && !rolled) {                        // cuff link
        PIX.rect(ctx, wc + (sgn < 0 ? -3 : 1), y2 - 3, 2, 2, P.G);
      }
    }

    /* sleeve accessories, on the forearm where you can see them */
    /* both of these are bands ROUND the arm, so they take their width from
       the arm at the height they sit at — a fixed 14 was wider than the
       forearm it was supposed to be strapped to */
    if (acc.armGarters) {
      const gc = L(acc.armGarters, P.d);
      const gy = yEl + 5, gcx = centerAt(gy), gw = widthAt(gy) + 1;
      PIX.rect(ctx, gcx - (gw >> 1) - 1, gy - 1, gw + 2, 7, INK);
      PIX.rect(ctx, gcx - (gw >> 1), gy, gw, 5, gc);
      PIX.rect(ctx, gcx - (gw >> 1), gy, gw, 1, 'rgba(255,255,255,.2)');
      PIX.rect(ctx, gcx - (gw >> 1), gy + 4, gw, 1, SH1);
    }
    if (acc.gloves) {                                // glove top above the elbow
      const gl = L(acc.gloves, P.W);
      const gy = 24, gcx = centerAt(gy), gw = widthAt(gy) + 1;
      PIX.rect(ctx, gcx - (gw >> 1) - 1, gy - 1, gw + 2, 5, INK);
      PIX.rect(ctx, gcx - (gw >> 1), gy, gw, 3, L(DARKER[acc.gloves], P.w));
      PIX.rect(ctx, gcx - (gw >> 1), gy, gw, 1, gl);
    }
  });

  /* drop the upper-arm layer in behind the coat */
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.drawImage(armCv, 0, 0);
  ctx.restore();

  /* where the sleeves end, so the scene can put the hands exactly there.
     wrist is the old symmetric report; wristAt is the real per-side one,
     which is the only thing that can follow a swing. */
  cv.wrist = { dx: baseHw - (armIn ? 13 : 9), dy: 56, cx: cx, h: H };
  cv.wristAt = [-1, 1].map(sgn => {
    const sw = Math.round(swing * 13);
    const lift = Math.round(sgn * swing * 4);
    return {
      sgn,
      x: cx + sgn * (baseHw - (armIn ? 13 : 9)) + sw,
      y: 56 - Math.round(Math.abs(sw) * 0.35) - lift,
    };
  });

  /* epaulets ride ON TOP of the shoulder, not under it */
  [-1, 1].forEach(sgn => {
    if (acc.epaulets) {
      const ec = L(acc.epaulets, P.G);
      const x0 = sgn < 0 ? cx - baseHw - 1 : cx + baseHw - 10;
      PIX.rect(ctx, x0 - 1, 5, 13, 5, INK);
      PIX.rect(ctx, x0, 6, 11, 3, ec);
      PIX.rect(ctx, x0, 6, 11, 1, 'rgba(255,255,255,.22)');
      PIX.rect(ctx, x0 + (sgn < 0 ? 1 : 8), 7, 2, 2, INK);
    }
  });

  if (acc.radio) {                                   // shoulder mic on the left
    const rc = L(acc.radio, P.T);
    const x0 = cx - baseHw - 1;
    PIX.rect(ctx, x0, 11, 9, 12, INK);
    PIX.rect(ctx, x0 + 1, 12, 7, 10, rc);
    PIX.rect(ctx, x0 + 2, 13, 5, 3, P.s);
    PIX.rect(ctx, x0 + 2, 18, 5, 1, P.K);
    PIX.rect(ctx, x0 + 3, 8, 2, 4, P.K);
    PIX.rect(ctx, x0 + 3, 7, 2, 1, P.R);
  }

  /* ---------- 9. bowtie sits in front of everything ---------- */
  if (N.type === 'bowtie') {
    const bc = L(N.col, P.d), bd = L(DARKER[N.col], P.K);
    const byy = nTop + (N.loose ? 3 : 0), bxx = cx + (N.loose ? 2 : 0);
    const tilt = N.loose ? 1 : 0;
    PIX.rect(ctx, bxx - 10, byy - tilt, 8, 8, INK);
    PIX.rect(ctx, bxx + 3, byy + tilt, 8, 8, INK);
    PIX.rect(ctx, bxx - 9, byy + 1 - tilt, 6, 6, bc);
    PIX.rect(ctx, bxx + 4, byy + 1 + tilt, 6, 6, bc);
    PIX.rect(ctx, bxx - 9, byy + 4 - tilt, 6, 2, bd);
    PIX.rect(ctx, bxx + 4, byy + 4 + tilt, 6, 2, bd);
    PIX.rect(ctx, bxx - 3, byy + 1, 7, 6, INK);      // knot
    PIX.rect(ctx, bxx - 2, byy + 2, 5, 4, bc);
    PIX.rect(ctx, bxx - 2, byy + 2, 5, 1, 'rgba(255,255,255,.18)');
  }
  return cv;
};

SPR.frogMaster = function (id, expr) {
  return SPR.cached('frog_' + id + '_' + (expr || 'neutral'),
    () => SPR.buildFrog(FROG_DEFS[id] || FROG_DEFS.player, expr));
};

/* mooks: same rig, any def */
SPR.frogCustom = function (key, def, expr) {
  const cv = SPR.cached('frogc_' + key + '_' + (expr || 'neutral'),
    () => SPR.buildFrog(def, expr));
  /* WHO THIS IS, WRITTEN ON THE CANVAS. Every dialogue plate in the game
     is handed a finished portrait, so without this there is no way to ask
     for the same frog with his mouth open. */
  cv.pkey = key; cv.pdef = def; cv.pexpr = expr || 'neutral';
  return cv;
};

/* the same portrait, mid-word: a plate flips between these two while the
   line types itself on, and stops on the closed one when it lands */
SPR.portraitTalk = function (art, open) {
  if (!art || !art.pkey || !art.pdef) return art;
  if (art.pexpr && art.pexpr !== 'neutral') return art;   // an angry frog stays angry
  return SPR.frogCustom(art.pkey, art.pdef, open ? 'talk' : 'talk2');
};

SPR.bodyCustom = function (key, def, seated) {
  return SPR.cached('body_' + key + (seated ? '_sit' : ''),
    () => SPR.buildBody(def, { seated: seated }));
};

/* the same bust with its arms in, for a frog you can see the legs of */
SPR.bodyStanding = function (key, def, swing) {
  const sw = Math.round((swing || 0) * 100) / 100;
  return SPR.cached('body_' + key + '_stand' + sw,
    () => SPR.buildBody(def, { tuck: true, swing: sw }));
};

SPR.frogEl = function (id, scale, cls, expr) {
  return SPR.clone(SPR.frogMaster(id, expr), scale, cls);
};

/* ============================================================
   THE IRONS.

   Built out of parts rather than drawn as fixed art, because the
   duel needs to cock the hammer and index the cylinder frame by
   frame — a revolver whose cylinder never turns isn't a revolver.
   Every gun is a side view pointing RIGHT and reports its own
   grip and muzzle anchors, so duel.js never guesses where your
   fist closes or where the flash comes out.
   ============================================================ */

const GUN_FINISH = {
  /* bone as a highlight blows out at gun scale — the top of a barrel is
     bright steel, not white paint */
  steel:  { hi: 'M', lit: 'S', mid: 's', dk: 't', deep: 'T' },
  blued:  { hi: 'S', lit: 's', mid: 't', dk: 'T', deep: 'k' },
  gold:   { hi: 'Y', lit: 'G', mid: 'g', dk: 'h', deep: 'H' },
};

const GUN_RIGS = {
  snub:   { kind: 'revolver', barrel: 13, finish: 'steel', wood: 'b', chambers: 5, rib: false },
  colt:   { kind: 'revolver', barrel: 31, finish: 'blued', wood: 'u', chambers: 6, rib: true },
  sawn:   { kind: 'sawn', barrel: 30, finish: 'blued', wood: 'b' },
  tommy:  { kind: 'smg', barrel: 30, finish: 'blued', wood: 'u' },
  golden: { kind: 'revolver', barrel: 27, finish: 'gold', wood: 'b', chambers: 6, rib: true, engrave: true },
};

/* the metal on a round part: light on top, dark underneath, so a barrel
   reads as a tube and a cylinder reads as a drum */
function gunRound(ctx, x, y, w, h, F) {
  const P = PIX.PAL;
  const band = Math.max(1, h >> 2);
  PIX.rect(ctx, x, y, w, band, P[F.lit]);
  PIX.rect(ctx, x, y, w, 1, P[F.hi]);
  PIX.rect(ctx, x, y + h - band, w, band, P[F.dk]);
  PIX.rect(ctx, x, y + h - 1, w, 1, P[F.deep]);
}

/* ONE silhouette, not a pile of boxes.

   Every metal part goes down twice: an ink pass grown 1px in every
   direction, then a fill pass. Where two parts touch, the second one's
   fill buries the first one's outline, so the frame, barrel, cylinder and
   trigger guard read as a single machined object instead of separate
   rectangles with seams between them. */
function gunPlate(ctx, parts, fill) {
  const INK = PIX.PAL.K;
  parts.forEach(p => SPR.rrect(ctx, p[0] - 1, p[1] - 1, p[2] + 2, p[3] + 2, (p[4] || 0) + 1, INK));
  parts.forEach(p => SPR.rrect(ctx, p[0], p[1], p[2], p[3], p[4] || 0, fill));
}

/* a walnut grip panel: rows leaning back and down, checkered in the middle */
function gunGrip(ctx, rig, x0, y0, len, lean) {
  const P = PIX.PAL, INK = P.K;
  const wood = P[rig.wood] || P.b;
  const woodD = P[DARKER[rig.wood] || 'u'] || P.u;
  const woodL = P[LIGHTER[rig.wood] || 'B'] || P.B;
  const span = [];
  for (let i = 0; i < len; i++) {
    const t = i / (len - 1);
    const round = t > 0.82 ? Math.round((t - 0.82) * 26) : 0;
    span.push([Math.round(x0 - t * lean) + round, Math.round(x0 + 10 - t * lean * 0.3) - round]);
  }
  span.forEach(([lx, rx], i) => PIX.rect(ctx, lx - 1, y0 + i - 1, rx - lx + 2, 3, INK));
  span.forEach(([lx, rx], i) => {
    PIX.rect(ctx, lx, y0 + i, rx - lx, 1, wood);
    PIX.rect(ctx, lx, y0 + i, 2, 1, woodL);
    PIX.rect(ctx, rx - 2, y0 + i, 2, 1, woodD);
    if (i > 2 && i < len - 4) {
      for (let cx = lx + 3; cx < rx - 3; cx += 2) {
        if (((cx + i) & 3) === 0) PIX.rect(ctx, cx, y0 + i, 1, 1, woodD);
      }
    }
  });
  /* the medallion every mob revolver has screwed into the panel */
  const mid = span[(len * 0.42) | 0];
  const mx = Math.round((mid[0] + mid[1]) / 2), my = y0 + ((len * 0.42) | 0);
  PIX.disc(ctx, mx, my, 3, INK);
  PIX.disc(ctx, mx, my, 2, P.g);
  PIX.rect(ctx, mx - 1, my - 1, 1, 1, P.G);
}

/* knock a rounded hole through whatever has been drawn: the inside of a
   trigger guard is air, and air has to be cleared, not painted */
function gunPunch(ctx, x, y, w, h, r) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  SPR.rrect(ctx, x, y, w, h, r, '#000');
  ctx.restore();
}

/* ---- the revolver: snub, long colt, the golden gun ---- */
function gunRevolver(ctx, rig, F, cocked, cyl) {
  const P = PIX.PAL, INK = P.K, mid = P[F.mid];
  const CX = 13, CW = 15, CT = 8, CH = 18;          // the cylinder
  const BX = CX + CW;                               // barrel meets the frame here
  const MX = BX + rig.barrel;                       // the muzzle
  const SY = rig.rib ? 4 : 7;                       // front sight sits on the rib

  /* --- the whole machined body in one silhouette --- */
  const parts = [
    [7, 6, BX - 5, 5, 1],                           // frame + top strap
    [BX - 2, 11, MX - BX + 2, 8, 1],                // barrel
    [BX + 2, 19, MX - BX - 5, 4, 1],                // ejector shroud
    [MX - 5, SY, 4, 5, 1],                          // front sight blade
    [CX, CT, CW, CH, 4],                            // cylinder
    [4, 6, 11, 22, 3],                              // standing breech / sideplate
    [12, 25, 18, 12, 5],                            // trigger guard bow
    [11, 22, 12, 6, 1],                             // frame bottom into the guard
  ];
  if (rig.rib) parts.push([BX - 2, 8, MX - BX + 2, 3, 1]);
  if (cocked) { parts.push([0, 3, 9, 5, 1]); parts.push([5, 5, 6, 6, 1]); }
  else parts.push([4, 2, 9, 6, 1]);
  gunPlate(ctx, parts, mid);
  gunPunch(ctx, 15, 27, 12, 7, 3);                  // inside of the guard

  /* --- shading, part by part, over the flat plate --- */
  gunRound(ctx, BX - 2, 11, MX - BX + 2, 8, F);
  PIX.rect(ctx, MX - 3, 11, 3, 8, P[F.dk]);         // the crown
  PIX.rect(ctx, MX - 1, 11, 1, 8, P[F.deep]);
  PIX.rect(ctx, MX - 3, 11, 3, 1, P[F.lit]);
  gunRound(ctx, BX + 2, 19, MX - BX - 5, 4, F);
  gunRound(ctx, 7, 6, BX - 5, 5, F);
  if (rig.rib) {
    gunRound(ctx, BX - 2, 8, MX - BX + 2, 3, F);
    for (let x = BX + 1; x < MX - 4; x += 3) PIX.rect(ctx, x, 9, 1, 1, P[F.deep]);
  }
  PIX.rect(ctx, MX - 4, SY, 2, 4, P[F.lit]);
  PIX.rect(ctx, 10, 7, 4, 2, INK);                  // the rear sight notch
  PIX.rect(ctx, 11, 7, 2, 1, P[F.deep]);

  /* the cylinder. Its flutes scroll UP as it indexes: seen side-on, a
     cylinder turning about the bore axis moves its grooves vertically. */
  PIX.rect(ctx, CX + 2, CT + 1, CW - 4, 2, P[F.lit]);
  PIX.rect(ctx, CX + 3, CT + 1, CW - 6, 1, P[F.hi]);
  PIX.rect(ctx, CX + 2, CT + CH - 3, CW - 4, 2, P[F.dk]);
  PIX.rect(ctx, CX + 3, CT + CH - 2, CW - 6, 1, P[F.deep]);
  const n = rig.chambers || 6, per = 6;
  const off = Math.round(((cyl || 0) % n) / n * per);
  for (let gy = CT + 3 - per + off; gy < CT + CH - 4; gy++) {
    if (gy < CT + 3 || (gy - CT - 3 + per - off) % per !== 0) continue;
    PIX.rect(ctx, CX + 2, gy, CW - 4, 1, P[F.dk]);
    PIX.rect(ctx, CX + 2, gy + 1, CW - 4, 1, P[F.deep]);
  }
  /* its own hard edges, or the drum disappears into the frame behind it */
  PIX.rect(ctx, CX + CW - 1, CT + 3, 1, CH - 6, INK);
  PIX.rect(ctx, CX + CW - 3, CT + 3, 2, CH - 6, P[F.lit]);   // front face of the drum
  PIX.rect(ctx, CX, CT + 3, 1, CH - 6, INK);
  PIX.rect(ctx, CX + 1, CT + 3, 1, CH - 6, P[F.dk]);
  if (rig.engrave) for (let gy = CT + 4; gy < CT + CH - 4; gy += 5) {
    PIX.rect(ctx, CX + 5, gy, 5, 1, P[F.hi]);
  }

  /* the breech, its screw, and the hammer's checkered spur */
  PIX.rect(ctx, 5, 7, 9, 2, P[F.lit]);
  PIX.rect(ctx, 5, 24, 9, 3, P[F.dk]);
  PIX.disc(ctx, 9, 17, 3, P[F.dk]);
  PIX.rect(ctx, 8, 17, 3, 1, P[F.deep]);
  if (cocked) {
    PIX.rect(ctx, 1, 4, 7, 1, P[F.lit]);
    for (let x = 1; x < 8; x += 2) PIX.rect(ctx, x, 4, 1, 1, P[F.deep]);
    PIX.rect(ctx, 6, 6, 5, 4, P[F.dk]);
  } else {
    PIX.rect(ctx, 5, 3, 7, 1, P[F.lit]);
    for (let x = 5; x < 12; x += 2) PIX.rect(ctx, x, 3, 1, 1, P[F.deep]);
    PIX.rect(ctx, 5, 6, 7, 2, P[F.dk]);
  }

  /* trigger, hanging in the cleared bow */
  PIX.rect(ctx, 18, 26, 4, 9, INK);
  PIX.rect(ctx, 19, 27, 2, 7, P[F.lit]);
  PIX.rect(ctx, 19, 32, 2, 2, P[F.dk]);

  /* --- the grip, over the frame's tang so there is no seam --- */
  gunGrip(ctx, rig, 6, 24, 17, 3);

  return { grip: [11, 33], muzzle: [MX, 15], W: MX + 3, H: 44 };
}

/* ---- the sawn-off: two tubes, a splinter forend, no stock left ---- */
function gunSawn(ctx, rig, F) {
  const P = PIX.PAL, INK = P.K, mid = P[F.mid];
  const BX = 15, MX = BX + rig.barrel;
  gunPlate(ctx, [
    [BX - 2, 8, MX - BX + 2, 6, 1],                 // over/under, top tube
    [BX - 2, 15, MX - BX + 2, 6, 1],                // bottom tube
    [4, 7, 13, 19, 2],                              // receiver
    [5, 3, 8, 5, 1],                                // top lever
    [6, 24, 16, 11, 5],                             // guard
  ], mid);
  gunPunch(ctx, 9, 26, 10, 7, 3);
  gunRound(ctx, BX - 2, 8, MX - BX + 2, 6, F);
  gunRound(ctx, BX - 2, 15, MX - BX + 2, 6, F);
  /* the lower tube lives in the upper one's shadow, and there is a hard
     black seam between them — otherwise it reads as one fat barrel */
  PIX.rect(ctx, BX - 2, 15, MX - BX + 2, 4, P[F.dk]);
  PIX.rect(ctx, BX - 2, 15, MX - BX + 2, 1, P[F.mid]);
  PIX.rect(ctx, BX - 2, 20, MX - BX + 2, 1, P[F.deep]);
  PIX.rect(ctx, BX - 2, 14, MX - BX + 2, 1, INK);
  PIX.rect(ctx, MX - 3, 8, 3, 13, P[F.dk]);         // the muzzles
  PIX.rect(ctx, MX - 1, 8, 1, 13, P[F.deep]);
  PIX.rect(ctx, MX - 3, 8, 3, 1, P[F.lit]);
  PIX.rect(ctx, MX - 6, 5, 3, 4, INK);              // the bead, on a stalk
  PIX.rect(ctx, MX - 5, 5, 1, 3, P[F.hi]);
  PIX.rect(ctx, 5, 8, 11, 2, P[F.lit]);
  PIX.rect(ctx, 5, 22, 11, 3, P[F.dk]);
  PIX.rect(ctx, 6, 4, 6, 2, P[F.lit]);
  PIX.disc(ctx, 15, 21, 3, P[F.dk]);                // the hinge pin
  /* the splinter forend clamped under the tubes */
  const wood = P[rig.wood] || P.b, woodD = P[DARKER[rig.wood] || 'u'];
  for (let i = 0; i < 6; i++) {
    const w = 22 - i * 3;
    PIX.rect(ctx, BX + 5, 21 + i, w + 2, 1, INK);
    PIX.rect(ctx, BX + 6, 21 + i, w, 1, i > 3 ? woodD : wood);
    PIX.rect(ctx, BX + 6, 21 + i, 2, 1, P[LIGHTER[rig.wood] || 'B']);
  }
  PIX.rect(ctx, 12, 25, 4, 8, INK);
  PIX.rect(ctx, 13, 26, 2, 6, P[F.lit]);
  gunGrip(ctx, rig, 1, 23, 15, 4);
  return { grip: [6, 31], muzzle: [MX, 14], W: MX + 3, H: 40 };
}

/* ---- the tommy gun: receiver, drum, foregrip, cut-down stock ---- */
function gunSmg(ctx, rig, F) {
  const P = PIX.PAL, INK = P.K, mid = P[F.mid];
  const BX = 24, MX = BX + rig.barrel;
  gunPlate(ctx, [
    [BX - 3, 10, MX - BX - 5, 7, 1],                // finned barrel
    [MX - 9, 8, 9, 11, 2],                          // Cutts compensator
    [5, 9, 21, 13, 2],                              // receiver
    [8, 5, 5, 5, 1],                                // rear sight
    [16, 20, 10, 4, 1],                             // magazine well
    [7, 22, 14, 10, 4],                             // guard
  ], mid);
  gunPunch(ctx, 10, 24, 8, 6, 3);
  gunRound(ctx, BX - 3, 10, MX - BX - 5, 7, F);
  for (let x = BX; x < MX - 11; x += 3) PIX.rect(ctx, x, 11, 1, 5, P[F.deep]);
  gunRound(ctx, MX - 9, 8, 9, 11, F);
  for (let y = 10; y < 18; y += 2) PIX.rect(ctx, MX - 8, y, 7, 1, P[F.deep]);
  PIX.rect(ctx, 6, 10, 19, 2, P[F.lit]);
  PIX.rect(ctx, 6, 19, 19, 3, P[F.dk]);
  PIX.rect(ctx, 9, 6, 3, 3, P[F.deep]);
  PIX.rect(ctx, 21, 12, 4, 4, P[F.deep]);           // ejection port
  /* the drum, under the well */
  PIX.disc(ctx, 21, 30, 11, INK);
  PIX.disc(ctx, 21, 30, 10, P[F.mid]);
  PIX.disc(ctx, 21, 29, 9, P[F.lit]);
  PIX.disc(ctx, 21, 30, 6, P[F.dk]);
  PIX.disc(ctx, 21, 30, 3, P[F.lit]);
  PIX.disc(ctx, 21, 30, 1, P[F.deep]);
  for (let a = 0; a < 8; a++) {
    const ang = a / 8 * Math.PI * 2;
    PIX.rect(ctx, 21 + Math.round(Math.cos(ang) * 8) - 1,
      30 + Math.round(Math.sin(ang) * 8) - 1, 2, 2, P[F.deep]);
  }
  /* foregrip out front, cut-down stock behind */
  const wood = P[rig.wood] || P.u, woodL = P[LIGHTER[rig.wood] || 'B'];
  /* the vertical foregrip, out under the barrel where a hand goes */
  const FGX = MX - 17;
  for (let i = 0; i < 12; i++) {
    const w = i < 2 ? 9 : i > 9 ? 9 : 7;
    PIX.rect(ctx, FGX - (w >> 1) - 1, 18 + i, w + 2, 1, INK);
    PIX.rect(ctx, FGX - (w >> 1), 18 + i, w, 1, wood);
    PIX.rect(ctx, FGX - (w >> 1), 18 + i, 2, 1, woodL);
    if (i > 2 && i < 9 && (i & 1)) PIX.rect(ctx, FGX - 1, 18 + i, 3, 1, P[DARKER[rig.wood] || 'U']);
  }
  /* the stock, sawn short but still a stock */
  for (let i = 0; i < 15; i++) {
    const w = 11 - ((i / 3) | 0);
    PIX.rect(ctx, 0, 16 + i, w + 1, 1, INK);
    PIX.rect(ctx, 0, 16 + i, w, 1, wood);
    PIX.rect(ctx, 0, 16 + i, 2, 1, woodL);
    PIX.rect(ctx, w - 3, 16 + i, 2, 1, P[DARKER[rig.wood] || 'U']);
  }
  PIX.rect(ctx, 12, 23, 4, 8, INK);
  PIX.rect(ctx, 13, 24, 2, 6, P[F.lit]);
  return { grip: [13, 28], muzzle: [MX, 13], W: MX + 3, H: 44 };
}

/* build (and cache) one iron. cocked/cyl only matter for revolvers. */
SPR.gunMaster = function (id, cocked, cyl) {
  const rig = GUN_RIGS[id] || GUN_RIGS.snub;
  const key = 'gun:' + id + ':' + (cocked ? 1 : 0) + ':' + (cyl || 0);
  return SPR.cached(key, () => {
    const F = GUN_FINISH[rig.finish] || GUN_FINISH.steel;
    /* build into a generous scratch canvas, then crop to what it reported */
    const scratch = document.createElement('canvas');
    scratch.width = 140; scratch.height = 50;
    const sctx = scratch.getContext('2d');
    sctx.imageSmoothingEnabled = false;
    const info = rig.kind === 'sawn' ? gunSawn(sctx, rig, F)
      : rig.kind === 'smg' ? gunSmg(sctx, rig, F)
        : gunRevolver(sctx, rig, F, cocked, cyl);
    const cv = document.createElement('canvas');
    cv.width = info.W; cv.height = info.H;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(scratch, 0, 0);
    cv.grip = info.grip;
    cv.muzzle = info.muzzle;
    return cv;
  });
};

/* the resting sprite, for menus and anything that doesn't animate */
SPR.gunSprite = function (id) { return SPR.gunMaster(id, false, 0); };
SPR.gunEl = function (id, scale, cls) { return SPR.clone(SPR.gunMaster(id, false, 0), scale, cls); };

const GUN_SPRITES = { snub: 'snub', colt: 'colt', sawn: 'sawn',
  tommy: 'tommy', golden: 'golden' };

/* padlock for locked stations */
PIX.def('ic_lock', `
...KKKK...
..KssssK..
.KsK..KsK.
.KsK..KsK.
KKKKKKKKKK
KGGGGGGGGK
KGGGKKGGGK
KGGGKKGGGK
KGGGGKGGGK
KGGGGGGGGK
KKKKKKKKKK`);

/* tiny full-body frogs, for a room seen from across it */
PIX.def('patron_toad', `
......KKKK......
..KK.KbBBbK.KK..
.KbbKKBBBBKKbbK.
.KbKWKBBBBKWKbK.
..KKKKbbbbKKKK..
..KbbbbbbbbbbK..
.KbbBBBBBBBBbbK.
.KbBBBBBBBBBBbK.
.KbBBWWBBWWBBbK.
.KbbBBBBBBBBbbK.
..KKbbbbbbbbKK..
...KuuK..KuuK...`);

/* ============================================================
   DUEL-ERA SPRITES — hearts, chips, the ghost, trinket cards.
   ============================================================ */

PIX.def('ic_heart', `
.KK..KK.
KRRKKRRK
KRWRRRRK
KRRRRRRK
.KRRRRK.
..KRRK..
...KK...`);

PIX.def('ic_heart_e', `
.KK..KK.
KTTKKTTK
KTtTTTTK
KTTTTTTK
.KTTTTK.
..KTTK..
...KK...`);

PIX.def('ic_chip', `
...KKKK...
..KRRWRK..
.KWRRRRWK.
.KRRWWRRK.
.KRRWWRRK.
.KWRRRRWK.
..KRWRRK..
...KKKK...`);

PIX.def('ic_ptr', `
GGGGG
.GGG.
..G..`);

PIX.def('ghost_frog', `
..W....W..
.WWW..WWW.
.WKW..WKW.
..WWWWWW..
.WWWWWWWW.
.WWwWWwWW.
.WWWWWWWW.
..WWWWWW..
..W.WW.W..`);

/* how good a thing off a corpse is, as two palette letters: the belt cards
   are stamped in these and nothing else uses them */
const ITEM_RAR = {
  common:    ['s', 'T'],
  uncommon:  ['n', 'E'],
  rare:      ['v', 'X'],
  legendary: ['g', 'H'],
};



/* face-down card for locked collection slots */

/* swamp pd badge */
PIX.def('ic_badge', `
....KK....
...KLLK...
.KKLLLLKK.
KLLLLLLLLK
.KLLLLLLK.
..KLLLLK..
..KLLLLK..
.KLLKKLLK.
.KLK..KLK.
..K....K..`);

/* the little black book */
PIX.def('ic_book', `
.KKKKKKKK.
KTTTTTTTTK
KTWWWWWWTK
KTWqqqWWTK
KTWWWWWWTK
KTWqqqqWTK
KTWWWWWWTK
KTWqqWWWTK
KTWWWWWWTK
.KKKKKKKK.`);

/* ============================================================
   LORE PANELS.

   Five rooms, drawn the way you remember rooms: the shapes are
   right and the details are gone. No faces — everybody in these
   is a silhouette, because that is how it comes back to you at
   four in the morning.

   Each panel is 180x108 and gets scaled up whole.
   ============================================================ */

const LORE_W = 180, LORE_H = 108;

/* a seated frog, as a shape only */
function loreSit(ctx, x, y, k, col, hat) {
  SPR.ellipse(ctx, x, y - 16 * k, 11 * k, 10 * k, col);          // head
  PIX.disc(ctx, x - 7 * k, y - 24 * k, 4 * k, col);              // bulbs
  PIX.disc(ctx, x + 7 * k, y - 24 * k, 4 * k, col);
  SPR.rrect(ctx, x - 13 * k, y - 8 * k, 26 * k, 14 * k, 5 * k, col);
  if (hat) {
    SPR.ellipse(ctx, x, y - 28 * k, 16 * k, 3 * k, col);
    SPR.rrect(ctx, x - 8 * k, y - 38 * k, 16 * k, 11 * k, 4 * k, col);
  }
}

/* a standing frog in a coat, as a shape only */
function loreStand(ctx, x, y, k, col, hat) {
  SPR.ellipse(ctx, x, y - 44 * k, 10 * k, 9 * k, col);
  PIX.disc(ctx, x - 6 * k, y - 51 * k, 4 * k, col);
  PIX.disc(ctx, x + 6 * k, y - 51 * k, 4 * k, col);
  SPR.rrect(ctx, x - 12 * k, y - 36 * k, 24 * k, 36 * k, 6 * k, col);
  PIX.rect(ctx, x - 16 * k, y - 34 * k, 5 * k, 24 * k, col);      // arms down at his sides
  PIX.rect(ctx, x + 12 * k, y - 34 * k, 5 * k, 24 * k, col);
  if (hat) {
    SPR.ellipse(ctx, x, y - 55 * k, 15 * k, 3 * k, col);
    SPR.rrect(ctx, x - 8 * k, y - 64 * k, 16 * k, 10 * k, 4 * k, col);
  }
}

function loreRain(ctx, seed, n, col) {
  const r = U.mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.round(r() * LORE_W), y = Math.round(r() * LORE_H);
    PIX.rect(ctx, x, y, 1, 3 + Math.round(r() * 4), col);
  }
}

SPR.lorePanel = function (name) {
  return SPR.cached('lore_' + name, () => {
    const P = PIX.PAL;
    const cv = document.createElement('canvas');
    cv.width = LORE_W; cv.height = LORE_H;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;

    if (name === 'lineup') {
      /* the identification room: four of them under the lights behind the
         glass, and you on the dark side of it, pointing */
      PIX.rect(c, 0, 0, LORE_W, LORE_H, '#0a0d12');
      PIX.rect(c, 12, 12, LORE_W - 24, 58, '#241f18');            // the window frame
      PIX.rect(c, 15, 15, LORE_W - 30, 52, '#cfc2a0');            // the lit wall
      for (let y = 20; y < 64; y += 9) PIX.rect(c, 15, y, LORE_W - 30, 1, '#a89a78');
      for (let i = 0; i < 4; i++) {
        loreStand(c, 40 + i * 34, 66, 0.72, '#1c1812', i !== 2);
      }
      /* the one you picked, boxed in red */
      PIX.rect(c, 96, 18, 32, 2, '#d13b45'); PIX.rect(c, 96, 62, 32, 2, '#d13b45');
      PIX.rect(c, 96, 18, 2, 46, '#d13b45'); PIX.rect(c, 126, 18, 2, 46, '#d13b45');
      /* you, this side of the glass, arm up */
      loreStand(c, 30, 118, 1.05, '#04060a', true);
      PIX.rect(c, 38, 74, 26, 5, '#04060a');                      // the pointing arm
      PIX.rect(c, 62, 72, 6, 4, '#04060a');
      PIX.rect(c, 0, 100, LORE_W, 8, '#06080c');
      return cv;
    }

    if (name === 'verdict') {
      /* the courthouse steps. He walks, and he looks straight at you. */
      PIX.rect(c, 0, 0, LORE_W, LORE_H, '#10131a');
      PIX.rect(c, 52, 6, 76, 70, '#1d2027');                      // the doorway column
      PIX.rect(c, 66, 12, 48, 62, '#e8dcbe');                     // the light inside
      PIX.rect(c, 70, 12, 6, 62, '#cfc2a0');
      for (let i = 0; i < 4; i++) PIX.rect(c, 0, 76 + i * 8, LORE_W, 5, i % 2 ? '#22262e' : '#191d24');
      loreStand(c, 66, 86, 0.8, '#0a0806', true);                 // a goon
      loreStand(c, 114, 86, 0.8, '#0a0806', true);                // a goon
      /* him: wide, tall hat, mid-frame */
      loreStand(c, 90, 92, 1.0, '#070604', true);
      PIX.rect(c, 82, 30, 17, 3, '#3a2c18');                      // cigar line
      /* the flashbulbs going off */
      [[24, 40], [150, 34], [38, 62]].forEach(([fx, fy]) => {
        PIX.rect(c, fx - 4, fy, 9, 1, '#fff3b0'); PIX.rect(c, fx, fy - 4, 1, 9, '#fff3b0');
        PIX.rect(c, fx - 1, fy - 1, 3, 3, '#ffffff');
      });
      return cv;
    }

    if (name === 'door') {
      /* what came through it */
      PIX.rect(c, 0, 0, LORE_W, LORE_H, '#120d0a');
      PIX.rect(c, 58, 8, 64, 100, '#241a12');
      PIX.rect(c, 62, 12, 56, 96, '#e8c86a');                     // the light behind them
      c.globalAlpha = 0.5;
      PIX.rect(c, 62, 12, 56, 96, '#ff9d3c');
      c.globalAlpha = 1;
      loreStand(c, 78, 106, 0.78, '#0a0705', true);
      loreStand(c, 100, 108, 0.86, '#0a0705', true);
      loreStand(c, 120, 106, 0.78, '#0a0705', true);
      PIX.disc(c, 112, 62, 9, '#fff3b0');
      PIX.disc(c, 112, 62, 5, '#ffffff');
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2;
        PIX.rect(c, Math.round(112 + Math.cos(a) * 14), Math.round(62 + Math.sin(a) * 14), 2, 2, '#fff3b0');
      }
      return cv;
    }

    if (name === 'funeral') {
      /* it rained. He sent flowers. */
      PIX.rect(c, 0, 0, LORE_W, LORE_H, '#171c26');
      PIX.rect(c, 0, 84, LORE_W, LORE_H - 84, '#10141c');         // the wet grass
      PIX.rect(c, 0, 84, LORE_W, 2, '#222b3a');
      /* three stones: two small, one tall */
      [[58, 66, 14, 20], [86, 62, 16, 24], [116, 68, 13, 18]].forEach(([sx, sy, w, h]) => {
        PIX.rect(c, sx - 1, sy - 1, w + 2, h + 2, '#0b0e14');
        PIX.rect(c, sx, sy, w, h, '#3a4152');
        PIX.rect(c, sx, sy, w, 3, '#4a5266');
        PIX.rect(c, sx + 2, sy + 6, w - 4, 1, '#2b3140');
        PIX.rect(c, sx + 2, sy + 9, w - 4, 1, '#2b3140');
      });
      /* his flowers, at the tall one. You know whose they are. */
      PIX.rect(c, 88, 82, 12, 5, '#1c5540');
      [[89, 80], [93, 79], [97, 81]].forEach(([fx, fy]) => PIX.rect(c, fx, fy, 2, 2, '#d13b45'));
      /* you, alone, under an umbrella */
      loreStand(c, 32, 106, 0.95, '#05070b', false);
      PIX.rect(c, 16, 44, 34, 4, '#0b0d12');                      // the canopy
      PIX.rect(c, 20, 40, 26, 4, '#0b0d12');
      PIX.rect(c, 31, 48, 2, 22, '#0b0d12');                      // the stick
      loreRain(c, 23, 110, 'rgba(127,215,255,.20)');
      return cv;
    }

    if (name === 'tower') {
      /* the family's tower, from the street, in the rain — the climb card */
      PIX.rect(c, 0, 0, LORE_W, LORE_H, '#080c14');
      for (let i = 0; i < 40; i++) {
        PIX.disc(c, (i * 41) % LORE_W, (i * 17) % 40, 1, 'rgba(200,220,255,.10)');
      }
      PIX.rect(c, 54, 10, 72, 98, '#161b28');
      PIX.rect(c, 54, 10, 4, 98, '#20273a');
      PIX.rect(c, 122, 10, 4, 98, '#0e1220');
      for (let f = 0; f < 8; f++) {
        const y = 96 - f * 11;
        const lit = f < 3 ? '#e0a63c' : f < 6 ? '#a5741f' : '#6e4c12';
        PIX.rect(c, 58, y, 64, 2, '#0a0d14');
        for (let w = 0; w < 5; w++) PIX.rect(c, 62 + w * 12, y - 6, 7, 5, lit);
      }
      PIX.rect(c, 60, 4, 60, 8, '#12101d');
      PIX.rect(c, 62, 5, 56, 6, '#ff6a5e');
      PIX.rect(c, 66, 6, 4, 4, '#fff3b0');
      PIX.rect(c, 74, 6, 4, 4, '#fff3b0');
      PIX.rect(c, 82, 6, 4, 4, '#fff3b0');
      SPR.ellipse(c, 90, 108, 46, 6, 'rgba(224,166,60,.14)');
      loreStand(c, 90, 108, 0.6, '#04060a', true);
      loreRain(c, 11, 70, 'rgba(127,215,255,.16)');
      return cv;
    }

    /* 'oath' — the badge stays on the desk light. So does the iron. */
    PIX.rect(c, 0, 0, LORE_W, LORE_H, '#0b0e13');
    /* rain on the window behind */
    PIX.rect(c, 118, 10, 46, 40, '#070a10');
    PIX.rect(c, 120, 12, 42, 36, '#101b2c');
    PIX.rect(c, 140, 12, 2, 36, '#070a10');
    loreRain(c, 31, 26, 'rgba(127,215,255,.14)');
    /* the lamp and its cone */
    PIX.rect(c, 28, 18, 3, 14, '#232018');
    PIX.rect(c, 20, 30, 20, 6, '#3a3020');
    c.globalAlpha = 0.16; c.fillStyle = '#ffd75e';
    c.beginPath(); c.moveTo(30, 34); c.lineTo(8, 78); c.lineTo(78, 78); c.closePath(); c.fill();
    c.globalAlpha = 1;
    /* the desk */
    PIX.rect(c, 4, 76, 172, 5, '#2c2114');
    PIX.rect(c, 4, 81, 172, 22, '#1d160e');
    /* the badge: a star in a circle of tin */
    PIX.disc(c, 44, 70, 7, '#0b0e13');
    PIX.disc(c, 44, 70, 6, '#7fd7ff');
    PIX.disc(c, 44, 70, 4, '#3f89c4');
    PIX.rect(c, 43, 66, 2, 8, '#b6e9ff'); PIX.rect(c, 40, 69, 8, 2, '#b6e9ff');
    /* the iron beside it */
    PIX.rect(c, 58, 66, 22, 4, '#12101d');
    PIX.rect(c, 58, 64, 14, 3, '#272c3d');
    PIX.rect(c, 74, 68, 5, 7, '#12101d');
    /* you, head down over both */
    loreSit(c, 96, 84, 1.1, '#04060a', true);
    return cv;
  });
};

/* ============================================================
   BLOOD ON THE LENS.
   A splat is not a circle and it is not a starburst: it is a
   ragged blob with a couple of long throws off one edge and a
   scatter of drops around it. Built in blocks on a seed, so the
   same shot always throws the same shape.
   ============================================================ */
SPR.bloodSplat = function (seed, R) {
  return SPR.cached('splat_' + seed + '_' + R, () => {
    const rng = U.mulberry32(seed);
    const P = PIX.PAL;
    /* Work on a coarse cell grid, not on pixels: a splat drawn per-pixel
       comes out a circle no matter how you jitter the radius. Big square
       cells give it the stepped, torn edge it is supposed to have. */
    const CELL = Math.max(2, Math.round(R / 7));
    const N = Math.ceil(R * 2.6 / CELL) | 1;
    const S = N * CELL;
    const cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    const mid = (N - 1) / 2;

    /* a ragged radius: eight arms of wildly different length, plus two
       notches bitten out of it */
    const arms = [];
    for (let i = 0; i < 10; i++) arms.push(0.42 + rng() * 0.72);
    arms[(rng() * 10) | 0] = 0.16;
    arms[(rng() * 10) | 0] = 0.22;
    const radAt = (a2) => {
      const t = ((a2 / (Math.PI * 2) + 1) % 1) * 10;
      const i = Math.floor(t);
      return arms[i] * (1 - (t - i)) + arms[(i + 1) % 10] * (t - i);
    };
    const cell = (gx, gy, col) => {
      if (gx < 0 || gy < 0 || gx >= N || gy >= N) return;
      c.fillStyle = col;
      c.fillRect(gx * CELL, gy * CELL, CELL, CELL);
    };

    const rCells = R / CELL;
    for (let gy = 0; gy < N; gy++) {
      for (let gx = 0; gx < N; gx++) {
        const dx = gx - mid, dy = gy - mid;
        const d = Math.sqrt(dx * dx + dy * dy);
        const lim = rCells * radAt(Math.atan2(dy, dx));
        if (d > lim) continue;
        cell(gx, gy, d > lim * 0.72 ? P.D : d > lim * 0.34 ? P.d : P.r);
      }
    }

    /* throws: four fingers of shrinking cells flung off one side */
    const dir = rng() * Math.PI * 2;
    for (let t = 0; t < 4; t++) {
      const a2 = dir + (rng() - 0.5) * 1.8;
      const len = rCells * (1.1 + rng() * 1.5);
      for (let s2 = 0; s2 < len; s2++) {
        if (s2 > len * 0.5 && rng() < 0.35) continue;      // it breaks up as it goes
        const gx = Math.round(mid + Math.cos(a2) * (rCells * 0.7 + s2));
        const gy = Math.round(mid + Math.sin(a2) * (rCells * 0.7 + s2));
        cell(gx, gy, s2 < len * 0.4 ? P.D : P.d);
      }
    }
    /* and the scatter around it */
    for (let i = 0; i < 12; i++) {
      const a2 = rng() * Math.PI * 2, dd = rCells * (1.05 + rng() * 0.55);
      cell(Math.round(mid + Math.cos(a2) * dd), Math.round(mid + Math.sin(a2) * dd), P.D);
    }
    return cv;
  });
};

/* ============================================================
   THE PLATE PEOPLE TALK ON.

   It used to be a dark green slab behind a chunky grey bezel with
   rivets in the corners and scanlines over the fill — a pocket
   calculator from 1994, in a game about a detective in 1937 Paris
   who carries a case file everywhere he goes.

   It is that case file now. A sheet of manila with a fibre tooth
   to it, a red rule across the top, the speaker's name typed on
   it in ink, and the words underneath in the same ink. The
   portrait is a PHOTOGRAPH CLIPPED TO THE SHEET: white border,
   its own shadow, a steel clip over the top edge. Anything that
   is not a person — a lock, a print kit, the case log — gets no
   photograph and a rubber stamp instead, because a lock does not
   have a face and giving it one was half of what was wrong.
   ============================================================ */
SPR.speech = function (o) {
  const P = PIX.PAL;
  const pad = 7, gap = 6;

  /* PAPER, INK, AND THE RED OF A CASE FILE. Not palette letters: this
     surface is paper and paper is not in the palette. */
  const PAPER = '#e2d7b8', PAPER_LIT = '#f2e9cf', PAPER_DK = '#c9bc99';
  const TOOTH = '#d8cbaa', SHADE = '#b3a684';
  const INK = '#22201c', INK_SOFT = '#4a463c', RED = '#8a2418';

  /* Everything inside is drawn at ONE pixel per pixel and the whole plate
     is blown up by an integer at the end. Render the text big and scale the
     canvas down in CSS instead and the letters go soft, which defeats the
     entire point of a pixel font. */
  const name = o.name ? PIXFONT.render(o.name, { scale: 1, color: INK, shadow: null }) : null;
  const lines = (o.lines || []).map(l =>
    PIXFONT.render(l, { scale: 1, color: INK, shadow: null }));
  const foot = o.foot ? PIXFONT.render(o.foot, { scale: 1, color: INK_SOFT, shadow: null }) : null;

  /* a photograph is bordered, so it needs more room than the head in it */
  const BORD = 3;
  const pw = o.portrait ? o.portrait.width + BORD * 2 : 0;
  const ph = o.portrait ? o.portrait.height + BORD * 2 : 0;
  let tw = Math.max(name ? name.width : 0, foot ? foot.width + 20 : 0);
  lines.forEach(l => { tw = Math.max(tw, l.width); });
  let th = (name ? name.height + 5 : 0) + (foot ? foot.height + 4 : 0);
  lines.forEach(l => { th += l.height + 3; });

  /* ---------- WHAT IS IN THE LEFT MARGIN ----------
     A photograph, a rubber stamp, or nothing. Decided ONCE, before the
     sheet is measured, because deciding it again while painting is how
     the stamp came to be drawn into a margin the sheet had not reserved
     and pushed the last word of the line off the right-hand edge. */
  const STAMP_W = 26;
  const bigEnough = !o.small && th > 20 && tw > 130;
  const marg = o.portrait ? 'photo' : (bigEnough ? 'stamp' : 'none');
  const gutter = marg === 'photo' ? pw + gap
    : marg === 'stamp' ? STAMP_W + gap + 3 : 0;

  const W = gutter + tw + pad * 2 + 4;
  const H = Math.max(ph, th) + pad * 2 + 8;

  /* the blow-up factor is chosen from the room the plate has, not guessed */
  const K = U.clamp(Math.floor((o.maxW || 1200) / W), 2, 6);

  const cv = document.createElement('canvas');
  cv.width = W * K; cv.height = H * K;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.save();
  c.scale(K, K);
  const px = (x, y, w, h, col) => PIX.rect(c, x, y, w, h, col);

  /* ---------- THE SHEET ----------
     A drop shadow under it, then the paper, then the tooth of the stock. */
  px(2, 3, W - 2, H - 3, 'rgba(0,0,0,.45)');
  px(0, 0, W - 2, H - 3, PAPER);
  px(0, 0, W - 2, 1, PAPER_LIT);
  px(0, 0, 1, H - 3, PAPER_LIT);
  px(W - 3, 0, 1, H - 3, PAPER_DK);
  px(0, H - 4, W - 2, 1, PAPER_DK);
  /* THE TOOTH OF THE STOCK, and not much of it. Six per cent of the
     sheet in two contrasting tones came out as sandpaper; paper is
     mostly one colour with a suggestion of grain in it. */
  const seed = U.hashSeed('sheet:' + W + ':' + H + ':' + ((o.lines || [])[0] || ''));
  const rng = U.mulberry32(seed);
  for (let i = 0; i < Math.round(W * H * 0.014); i++) {
    px(Math.floor(rng() * (W - 2)), Math.floor(rng() * (H - 4)), 1, 1,
      rng() < 0.6 ? TOOTH : 'rgba(242,233,207,.55)');
  }
  /* the crease down a sheet that has lived in a coat pocket — a whisper,
     because at full strength it is a seam through the middle of the words */
  const fold = Math.round(W * 0.62);
  px(fold, 1, 1, H - 5, 'rgba(150,138,110,.12)');
  px(fold + 1, 1, 1, H - 5, 'rgba(255,250,232,.14)');

  /* ---------- THE HEAD OF THE FORM ---------- */
  px(0, 0, W - 2, 2, RED);
  px(0, 2, W - 2, 1, 'rgba(120,32,20,.35)');
  /* two punched holes down the left margin, on a sheet with room for them */
  if (!o.small && H > 34) {
    [Math.round(H * 0.30), Math.round(H * 0.70)].forEach(hy => {
      PIX.disc(c, 5, hy, 3, '#0f0d0b');
      PIX.disc(c, 5, hy - 1, 2, '#3a352c');
      px(3, hy + 2, 5, 1, 'rgba(255,250,232,.45)');
    });
  }

  /* ---------- THE PHOTOGRAPH, CLIPPED ON ---------- */
  const tx = pad + 3 + gutter;
  if (marg === 'photo') {
    const bx = pad, by = pad + 1;
    px(bx + 1, by + 2, pw, ph, 'rgba(0,0,0,.35)');
    px(bx, by, pw, ph, '#f6f2e6');                  /* the white border */
    px(bx, by, pw, 1, '#ffffff');
    px(bx, by + ph - 1, pw, 1, '#c4bfae');
    px(bx + BORD - 1, by + BORD - 1, pw - BORD * 2 + 2, ph - BORD * 2 + 2, '#1a1c22');
    c.drawImage(o.portrait, bx + BORD, by + BORD);
    /* the steel clip over the top edge of the photograph */
    const cx = bx + Math.round(pw / 2) - 5;
    px(cx, by - 3, 11, 3, '#8d94a0');
    px(cx, by - 3, 11, 1, '#bfc6d2');
    px(cx + 1, by, 2, 5, '#8d94a0');
    px(cx + 8, by, 2, 5, '#8d94a0');
    px(cx + 1, by, 2, 1, '#bfc6d2');
  } else if (marg === 'stamp') {
    /* NO FACE. A rubber stamp in the margin instead, on the slant — but
       only on a sheet big enough to carry one: on the little objective
       card it landed on top of the first two words. */
    const sw = STAMP_W, sh = 12, sx = pad, sy = pad + 2;
    for (let i = 0; i < sh; i++) {
      const off = Math.round((i - sh / 2) * 0.25);
      const edge = i === 0 || i === sh - 1;
      px(sx + off, sy + i, sw, 1, edge ? 'rgba(138,36,24,.85)' : 'rgba(138,36,24,.10)');
    }
    px(sx - 3, sy, 2, sh, 'rgba(138,36,24,.85)');
    px(sx + sw - 1, sy, 2, sh, 'rgba(138,36,24,.85)');
    const st = PIXFONT.render('NOTE', { scale: 1, color: 'rgba(138,36,24,.9)', shadow: null });
    c.drawImage(st, sx + Math.round((sw - st.width) / 2), sy + 3);
  }

  /* ---------- THE TYPING ----------
     A typewriter does not print an even line: every glyph sits a pixel
     high or low of the baseline and the ribbon is dry in places. That is
     one row of jitter per line, which is the whole difference between
     "text in a box" and "somebody typed this". */
  let ty = pad + 3;
  if (name) {
    c.drawImage(name, tx, ty);
    px(tx, ty + name.height + 1, Math.min(tw, name.width + 8), 1, 'rgba(34,32,28,.45)');
    ty += name.height + 5;
  }
  lines.forEach((l, i) => {
    c.drawImage(l, tx, ty + ((i % 2) ? 0 : 0));
    ty += l.height + 3;
  });
  if (foot) {
    /* the prompt, pencilled in the bottom corner */
    const fx = W - pad - 4 - foot.width, fy = H - pad - 5 - foot.height;
    c.drawImage(foot, fx, fy);
    px(fx - 1, fy + foot.height + 1, foot.width + 2, 1, 'rgba(74,70,60,.40)');
  }

  c.restore();
  return cv;
};

/* ============================================================
   A TITLE CARD, DRAWN.
   Stacked lines on a ruled plate with a hard rule under the big
   one. Used by the cutscenes so no interstitial in the game is
   made of CSS text.
   ============================================================ */
SPR.titleCard = function (o) {
  const P = PIX.PAL;
  const rows = [];
  if (o.big) rows.push({ cv: PIXFONT.render(o.big, { scale: 1, color: P.q, shadow: null }), gap: 3 });
  if (o.huge) rows.push({ cv: PIXFONT.render(o.huge, { scale: 2, color: o.col || P.W, shadow: null }), gap: 5, rule: true });
  if (o.sub) rows.push({ cv: PIXFONT.render(o.sub, { scale: 1, color: P.w, shadow: null }), gap: 3 });
  if (o.foot) rows.push({ cv: PIXFONT.render(o.foot, { scale: 1, color: P.q, shadow: null }), gap: 0 });

  const pad = 8;
  let W = 0, H = pad * 2;
  rows.forEach(r => { W = Math.max(W, r.cv.width); H += r.cv.height + r.gap + (r.rule ? 4 : 0); });
  W += pad * 2;

  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  PIX.rect(c, 0, 0, W, H, P.K);
  PIX.rect(c, 1, 1, W - 2, H - 2, '#0a0e14');
  PIX.rect(c, 1, 1, W - 2, 1, 'rgba(255,255,255,.10)');
  PIX.rect(c, 0, 0, W, 3, o.col || P.W);
  PIX.rect(c, 0, H - 3, W, 3, o.col || P.W);
  for (let y = 4; y < H - 4; y += 3) PIX.rect(c, 2, y, W - 4, 1, 'rgba(0,0,0,.30)');

  let y = pad;
  rows.forEach(r => {
    c.drawImage(r.cv, Math.round((W - r.cv.width) / 2), y);
    y += r.cv.height + r.gap;
    if (r.rule) { PIX.rect(c, pad, y, W - pad * 2, 1, o.col || P.W); y += 4; }
  });
  return cv;
};

/* break a string into lines that fit a character budget */
SPR.fitLines = function (str, per) {
  const out = [];
  let line = '';
  str.split(' ').forEach(w => {
    if (line && (line + ' ' + w).length > per) { out.push(line); line = ''; }
    line = line ? line + ' ' + w : w;
  });
  if (line) out.push(line);
  return out;
};

/* a stain on the floorboards, seen from above: flatter, no throws */
SPR.floorStain = function (seed, R) {
  return SPR.cached('stain_' + seed + '_' + R, () => {
    const rng = U.mulberry32(seed);
    const W = R * 2 + 2, H = Math.round(R * 1.3) + 2;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const P = PIX.PAL;
    const cx = R + 1, cy = Math.round(R * 0.65) + 1;
    const lump = [];
    for (let i = 0; i < 12; i++) lump.push(0.6 + rng() * 0.4);
    for (let y = -cy; y <= cy; y++) {
      const t = (y / cy + 1) / 2 * 12;
      const i = Math.floor(t), f = t - i;
      const w = Math.round(R * (lump[i] * (1 - f) + lump[Math.min(11, i + 1)] * f) *
        Math.sqrt(Math.max(0, 1 - (y / cy) * (y / cy))));
      if (w > 0) {
        PIX.rect(c, cx - w, cy + y, w * 2, 1, P.K);              // it has an edge
        PIX.rect(c, cx - w + 1, cy + y, w * 2 - 2, 1, P.D);
        if (Math.abs(y) < cy * 0.62) PIX.rect(c, cx - w + 3, cy + y, w * 2 - 6, 1, P.d);
        if (Math.abs(y) < cy * 0.3) PIX.rect(c, cx - w + 5, cy + y, Math.max(1, w - 4), 1, P.r);
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = rng() * Math.PI * 2;
      PIX.rect(c, Math.round(cx + Math.cos(a) * R * 1.0),
        Math.round(cy + Math.sin(a) * cy * 1.05), 1 + ((rng() * 2) | 0), 1, P.D);
    }
    return cv;
  });
};

/* ============================================================
   THE MURDER BOARD — props for the title screen.
   A knife somebody put through a photograph, the holes somebody
   else put through the board, and the tape holding the rest up.
   ============================================================ */

PIX.def('prop_knife', `
..............KK
.............KWK
............KWSK
...........KWSK.
..........KWSK..
.........KWSK...
........KWSK....
.......KWSK.....
......KWSK......
.....KWSK.......
....KKKK........
...KuUK.........
..KuUK..........
.KuUK...........
KUUK............
KKK.............`);

PIX.def('prop_hole', `
...KKK...
..KkkkK..
.KkZZZkK.
KkZZZZZkK
KkZZZZZkK
KkZZZZZkK
.KkZZZkK.
..KkkkK..
...KKK...`);

PIX.def('prop_hole2', `
..KK..
.KZZK.
KZZZZK
KZZZZK
.KZZK.
..KK..`);

/* a strip of aged sticky tape, drawn once and rotated by CSS */
SPR.tapeStrip = function (w) {
  return SPR.cached('tape_' + w, () => {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = 7;
    const c = cv.getContext('2d');
    c.fillStyle = 'rgba(220,205,160,.72)';
    c.fillRect(0, 0, w, 7);
    c.fillStyle = 'rgba(255,255,255,.25)';
    c.fillRect(0, 0, w, 2);
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.fillRect(0, 5, w, 2);
    /* torn ends */
    c.clearRect(0, 0, 1, 2); c.clearRect(0, 5, 1, 2);
    c.clearRect(w - 1, 1, 1, 2); c.clearRect(w - 1, 4, 1, 3);
    return cv;
  });
};

/* a polaroid of a frog, for pinning to the board */
SPR.mugshot = function (key, def, k) {
  return SPR.cached('mug_' + key + '_' + k, () => {
    const head = SPR.frogCustom('mug:' + key, def);
    const w = head.width * k + 12, h = head.height * k + 22;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    PIX.rect(c, 0, 0, w, h, PIX.PAL.K);
    PIX.rect(c, 1, 1, w - 2, h - 2, '#ded2b4');
    PIX.rect(c, 5, 5, w - 10, head.height * k + 2, '#141820');
    c.drawImage(head, 6, 6, head.width * k, head.height * k);
    return cv;
  });
};

/* ============================================================
   FULL LENGTH.
   The line-up needs the whole frog: the torso rig, then legs in
   the same suit, then shoes. Nobody has drawn these frogs below
   the belt before because the table always hid it.
   ============================================================ */
/* ============================================================
   ONE WHOLE FROG.

   The only full-length frog in the game. The line-up posters use
   it at full size, the rooms use it shrunk down, and both are
   the same sprite built out of the same head, the same costumed
   body and the same four-fingered hands — so the frog you walk
   past in the bullpen is the frog you sit down across from.

   opts: { frame } — 0..7 of the walk cycle. Frame 0 is standing.

   EIGHT FRAMES, NOT FOUR. Four was two poses and their mirrors, which
   at any decent frame rate reads as a flicker between two drawings.
   Eight sampled off a sine gives the stride a middle: the leg leaves
   the ground, passes, plants, and takes the weight, and the arm on the
   other side does the same thing a beat behind it.
   ============================================================ */
SPR.WALK_FRAMES = 8;

/* ============================================================
   ARM POSES — what he is doing with the near arm.

   A body that only ever hangs its arms at its sides has one
   thing to say. These are the poses the rooms actually need: a
   hand out to take something, a hand up by the head, a finger
   pointed at somebody, a hand held in against the chest, a rag
   going back and forth, two hands down on a typewriter. The
   near arm is redrawn over the torso from the shoulder to the
   wrist, which is how a 2D drawing gestures.

   Positions are fractions of the rig box: wx/ex are signed from
   the centre line, wy/ey are measured down from the top.
   ============================================================ */
SPR.ARM_POSE = {
  reach: { ex: 0.20, ey: 0.62, wx: 0.40, wy: 0.58, hand: 'grip' },
  up:    { ex: 0.20, ey: 0.58, wx: 0.26, wy: 0.38, hand: 'hang' },
  point: { ex: 0.20, ey: 0.60, wx: 0.44, wy: 0.53, hand: 'point' },
  hold:  { ex: 0.18, ey: 0.62, wx: 0.16, wy: 0.58, hand: 'grip' },
  /* ============================================================
     THE WIPE IS FOUR POSES, NOT TWO.

     A frog wiping a table alternated between `wipe` and `reach`,
     and those two put the wrist at wy 0.66 and 0.58 -- eight per
     cent of the figure apart, eleven pixels on this rig -- so her
     hand TELEPORTED up and down twice a second while her whole
     body slid four pixels sideways under it. It read as a fault,
     because it is one: a two-frame switch is not a cycle.

     The rig caches a canvas per pose, so a continuous arm angle is
     not on offer. Four poses are: the wrist tracks ACROSS at one
     height, and the caller ping-pongs 0-1-2-3-2-1 through them,
     which is six frames of one sweep out and back.
     ============================================================ */
  wipe:  { ex: 0.20, ey: 0.62, wx: 0.36, wy: 0.66, hand: 'grip' },
  wipe1: { ex: 0.19, ey: 0.63, wx: 0.13, wy: 0.65, hand: 'grip' },
  wipe2: { ex: 0.20, ey: 0.62, wx: 0.23, wy: 0.65, hand: 'grip' },
  wipe3: { ex: 0.21, ey: 0.62, wx: 0.33, wy: 0.65, hand: 'grip' },
  wipe4: { ex: 0.22, ey: 0.61, wx: 0.42, wy: 0.66, hand: 'grip' },
  type:  { ex: 0.17, ey: 0.62, wx: 0.24, wy: 0.66, hand: 'grip' },
  fist:  { ex: 0.20, ey: 0.60, wx: 0.34, wy: 0.50, hand: 'fist' },
};

/* the phase of the cycle, -1..1, as a smooth curve rather than a table */
SPR.walkPhase = function (frame) {
  const n = SPR.WALK_FRAMES;
  return Math.sin(((frame % n) / n) * Math.PI * 2);
};

/* ============================================================
   THE CARTOON PASS.

   Every part of the rig is drawn with its own ink line, which is
   right up close and disappears the moment he stands in front of
   a busy room: the coat is dark, the wall is dark, and the
   silhouette goes with it. This walks the alpha channel once and
   lays a hard black line all the way round the outside of him,
   then puts a rim light down the side the lamps are on — which is
   the whole difference between a drawing and a smudge.
   ============================================================ */
/* ============================================================
   THE LINE ROUND HIM.

   One pixel, four-connected, is a technical outline: it separates a
   sprite from its background and it does nothing else. What makes a
   drawing read as a CARTOON at this size is a line thick enough to
   be a line -- two pixels, all eight ways round, so it closes over
   the diagonals instead of leaving a staircase of single pixels down
   every sloping edge.

   And the rim goes up with it. A pixel with nothing above-left of it
   is catching the lamp; at plus forty-six it was a suggestion, and
   the whole point of a bold outline is that the thing inside it has
   to be bright enough to survive being framed in near-black.

   Takes the thickness in passes. Everything that is not the walking
   rig still asks for one, because a one-pixel line is right for a
   mugshot at portrait size.
   ============================================================ */
SPR.inkEdge = function (cv, rim, t) {
  const c = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const passes = Math.max(1, t || 1);
  for (let pass = 0; pass < passes; pass++) {
    const im = c.getImageData(0, 0, W, H);
    const d = im.data;
    const out = new Uint8ClampedArray(d);
    const A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : d[(y * W + x) * 4 + 3];
    const first = pass === 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (d[i + 3] > 24) {
          /* a solid pixel with nothing above-left of it catches the lamp --
             and only on the first pass, or the rim walks outward with the
             outline and ends up as a halo */
          if (rim && first && A(x - 1, y) < 24 && A(x, y - 1) < 24) {
            out[i] = Math.min(255, d[i] + 62);
            out[i + 1] = Math.min(255, d[i + 1] + 62);
            out[i + 2] = Math.min(255, d[i + 2] + 62);
          }
          continue;
        }
        /* a hole with something next to it becomes the outline. Eight ways,
           so a sloping edge gets a line rather than a staircase. */
        if (A(x - 1, y) > 128 || A(x + 1, y) > 128
          || A(x, y - 1) > 128 || A(x, y + 1) > 128
          || A(x - 1, y - 1) > 128 || A(x + 1, y - 1) > 128
          || A(x - 1, y + 1) > 128 || A(x + 1, y + 1) > 128) {
          out[i] = 12; out[i + 1] = 10; out[i + 2] = 24; out[i + 3] = 255;
        }
      }
    }
    im.data.set(out);
    c.putImageData(im, 0, 0);
  }
  return cv;
};

SPR.frogWhole = function (key, def, opts) {
  opts = opts || {};
  const frame = ((opts.frame | 0) % SPR.WALK_FRAMES + SPR.WALK_FRAMES) % SPR.WALK_FRAMES;
  const back = !!opts.back;
  /* WHAT HIS FACE IS DOING, in the room, at full size. Everybody in a
     room used to wear the same deadpan all day: the expression set was
     only ever reached by the portraits in a conversation. Now a frog
     standing at a counter can be bored, pleased, or watching you. */
  const ex = opts.expr || 'neutral';
  /* AND WHICH WAY HE IS TURNED. Front or back, and that is the whole
     list. There was a profile once; it is gone. See the note above
     SPR.frogWhole. */
  /* AND WHAT HIS NEAR ARM IS DOING — see SPR.ARM_POSE. */
  const armP = SPR.ARM_POSE[opts.arm] ? opts.arm : '';
  return SPR.cached('whole_' + key + ':' + frame + ':' + ex
    + (back ? ':b' : '') + (armP ? ':a' + armP : ''), () => {
    const P = PIX.PAL;
    const ph = SPR.walkPhase(frame);
    /* THE HEAD. Front-on and back-on share one canvas — the back view
       repaints the face out. */
    const head = SPR.frogCustom('fb:' + key + ':' + ex, def, ex);
    const body = SPR.bodyStanding('fb:' + key, def, ph);
    /* PROPORTION. The portrait head and the duel bust were both drawn for a
       frog sitting at a table, where you never see him below the chest. Used
       whole they made a barrel: a huge head on a slab of shoulders with
       stumps under it. So the head comes down, the bust comes in, and the
       legs take the height back — roughly a third head, a third body, a
       third leg, and taller than he is wide. */
    /* ============================================================
       PROPORTION, MEASURED RATHER THAN GUESSED.

       The rig was a mascot and the numbers said so. Measured on the
       finished figure: the head was 0.37 of the total height and the
       body was 0.51 as wide as it was tall. A cartoon person is
       0.18-0.22 and 0.26. He was not a stylised man, he was a barrel
       with a beach ball on it.

       So the figure is now laid out on HEADS, the way a person is
       drawn. Five and a half of them, which is heroic-cartoon: real
       people are seven and a half and look gangly at this size.

         head    28     0.21 of the figure, hat included
         neck     2     how far the head overlaps the collar, so a
                        few rows of throat actually show
         torso   44     shoulder to hip
         legs    56     hip to sole
         ----------
                130     and the rig box does not change, so every
                        room's furniture is still the right size

       The head also comes in NARROWER than its own aspect: a frog's
       skull is wide, but drawn at its full width it came out as wide
       as his shoulders, and nothing with a head as wide as its
       shoulders has ever read as a person.

       Width comes down with it. The bust is authored 116 wide with
       the arms out; fitted into 48 the coat lands about 34 across,
       which on a 132 figure is 0.26 -- a person. Both the head and
       the bust go through SPR.fit to get there, because nearest
       neighbour at a fractional scale drops columns and a dropped
       column is a missing eyelid or half a pinstripe.
       ============================================================ */
    /* ============================================================
       AND THEN BACK TO CARTOON, DELIBERATELY.

       The measured pass above is correct about people and wrong about
       this game. Taken to a head fraction of 0.21 and an aspect of
       0.30 he came out a slim, sensible, forgettable man in a coat --
       and the whole cast around him is saturated, bold and drawn like
       a cartoon, so he stopped belonging to it.

       Cartoon is not the same mistake as mascot. A mascot was 0.37 of
       the height in head and half as wide as it was tall: a beach
       ball on a barrel with no joints in it. What this is aiming at is
       the middle -- heroic cartoon, four heads and a bit:

         head    35     0.27 of the figure, hat included
         neck     2
         torso   44     shoulder to hip, unchanged
         legs    48     shorter than a person's, which is most of
                        what makes a drawing read as a cartoon
         ----------
                129     the rig box is unchanged, so every room's
                        furniture is still the right size against him

       And he is CHUNKY: the bust comes in at eighty-four per cent of
       its own aspect rather than sixty-two, which widens the drawn
       figure from thirty-seven to fifty and thickens every limb with
       it, because SLIM is derived from it. Bold shapes, exaggerated
       proportions -- and every joint, hand and finger the measured
       pass built stays exactly where it is. Cartoony is a shape
       language, not an excuse for a solid block.
       ============================================================ */
    /* ============================================================
       THE ORIGINAL CARTOON NUMBERS, ASKED FOR BY NAME.

       These are the pre-measurement proportions, restored exactly:
       the head scaled a shade PAST its own canvas, a bust nearly as
       wide as the whole sprite, an eight-pixel neck overlap so the
       head sits down into the collar, and short legs.

         head    47     0.35 of the figure -- a third of him, hat in
         neck     8     how far the head sinks into the shoulders
         torso   44
         legs    38     short, which is the single loudest thing a
                        cartoon does to a body
         ----------
                134     and the drawn figure is about half as wide as
                        it is tall, which measures 0.51

       Which is a mascot by the numbers, and that is the point: this
       is a cartoon about frogs in hats. The reason it did not work
       the FIRST time these numbers were here is not the numbers -- it
       is that back then a leg was a single slab from hip to shoe with
       a crease painted across it and an arm was a sliver of rect down
       the side of a coat. Everything the two rebuild waves earned
       stays: tapered bones, elbows, knees, a sole that plants, hands
       with a thumb and four fingers, a head that arrives a beat late.
       Chunky cartoon with real joints in it, rather than a
       barrel with a beach ball on top.
       ============================================================ */
    /* ============================================================
       BIGGER HEAD. A third was a mascot; this is a CARTOON mascot.

       47 / 8 / 44 / 38 measured out at a head 0.30 of the figure,
       which is twice a person and still shy of what the drawing
       wants. The head goes to 58 and the torso and legs come in to
       pay for it, so he does not also get taller:

         head  47 -> 58    now 0.42 of the whole figure
         neck   8 -> 11    it sinks further into the collar, or the
                           extra eleven rows arrive as neck
         torso 44 -> 39
         legs  38 -> 33    short legs are the loudest cartoon cue
                           there is, and a big head over short legs
                           is the whole silhouette

       The total comes out at 138 against 137, so nothing that
       depends on his height in a room has to move.
       ============================================================ */
    const HEAD_H = 58, NECK = 11, TORSO = 39, LEGS = 33, RISE = 5;
    const hh = HEAD_H;
    const hw = Math.max(6, Math.round(head.width * (HEAD_H / head.height)));
    const bh = TORSO + NECK;
    const bw = Math.round(body.width * (bh / body.height));
    const W = Math.max(bw, hw) + 12;
    /* two spare rows at the top: the torso rises off planted feet rather
       than the whole frog sliding up and down together -- plus THREE more,
       because a two-pixel outline round a head that starts on row zero gets
       its top two rows cut off by the edge of the canvas */
    const BRIM = 3;
    const H = hh + bh - NECK + LEGS + RISE + BRIM;
    /* everything that used to be a hard pixel count on a 65-wide figure is
       now a fraction of the shoulders, so one number moves the whole rig */
    const SLIM = bw / 100;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;

    /* THE WALK. Two legs in opposite phase, the whole frog rising on the
       passing beats. The bob is twice the stride frequency, because you go
       up once per step and there are two steps in a cycle. */
    /* ============================================================
       THE WALK HAD NO AMPLITUDE IN IT.

       Every part of the machinery was already here -- tapered bones, a
       knee that folds, a sole that stays planted while the hips rise
       over it, arms opposing the legs. And then every number driving it
       was small enough to be invisible: the ankle travelled four pixels
       on a figure a hundred and thirty tall, the foot lifted four, the
       body rose two, and the arm swung six inside a bust that was then
       fitted down to two thirds. Eight frames of a man standing still,
       very slightly.

       Doubled and then some, which is what a cartoon walk is: not more
       machinery, more OF it.
       ============================================================ */
    const swing = Math.round(ph * 11);
    /* THE BOB WAS UPSIDE DOWN, and it moved the feet with it. You are at
       your TALLEST at the passing beat, when the supporting leg is straight
       under you, and lowest at the stride ends, where both legs are out at
       an angle. And the foot on the ground does not move at all: the hips
       rise and fall over it. So the torso bobs and the sole stays on
       groundY, which is a fixed row of the canvas. */
    const bobU = (1 + Math.cos(((frame % SPR.WALK_FRAMES) /
      SPR.WALK_FRAMES) * Math.PI * 4)) / 2;          // 1 passing, 0 at full stride
    const bob = RISE - Math.round(bobU * RISE);
    /* THE HEAD ARRIVES LATE. A head that rises and falls in lockstep with
       the hips is a head bolted to a torso; one frame of lag out of eight
       is the whole of it. And the sway is the weight going from one foot to
       the other -- the head leans one way while the shoulders go the other,
       which is the read everybody recognises as walking. */
    const bobU2 = (1 + Math.cos((((frame + 1) % SPR.WALK_FRAMES) /
      SPR.WALK_FRAMES) * Math.PI * 4)) / 2;
    /* CLAMPED TO ONE PIXEL. Taken as its own five-pixel bob the head went
       down while the shoulders went up and swallowed his own neck: the lag
       is a nudge off the body's bob, not a second bob. */
    /* FOLLOW-THROUGH. The head arrives a beat after the shoulders, which was
       clamped to a single pixel back when the head was a third of him. At
       forty per cent and with the room bouncing him three pixels a step,
       one pixel of lag is invisible: two reads as weight. */
    const headBob = bob + U.clamp(
      Math.round(((RISE - bobU2 * RISE) - bob) * 0.7), -2, 2);
    const sway = Math.round(SPR.walkPhase(frame) * 2);
    const bodyTop = BRIM + hh - NECK + bob;
    const cx = Math.round(W / 2);
    const groundY = H - 6;                            // where the soles rest

    /* legs first, so the coat hem sits over them */
    const C = SPR.costumeOf(def);
    const O = C.overcoat || C.jacket || null;
    /* THE TROUSERS ARE NOT THE COAT. Painted in the coat's own dark, the hem
       and the legs came out as one black mass with two shoes under it. Half
       a step up separates them and costs nothing. */
    const legC = P[(O && O.dark) || 'k'] || P.k;
    const legLift = 'rgba(255,255,255,.06)';
    const hipY = bodyTop + bh - 6;
    /* the legs scale with the shoulders. A thigh fifteen pixels wide on a
       thirty-four pixel torso is half his own body: that was the old rig's
       proportion and it is a rugby player's. */
    const LW = (n) => Math.max(4, Math.round(n * SLIM * 1.10));
    const spread = LW(def.fat ? 13 : 10);
    const shoeC = '#1c1a2c';

    /* ONE TAPERED BONE between two points, stepped down y so it can lean
       without ever laying down a soft edge. Ink pass, fill pass, rim down
       the lit side, shadow down the other. Every limb below is two of
       these and a joint — which is the whole of the fix. The old leg was
       a single 14-wide slab from the hip to the shoe with a crease painted
       across it: a table leg in a trouser, and it is why he read as solid. */
    const bone = (x0, ya, x1, yb, w0, w1, col, bulge, lift) => {
      const n = Math.max(1, yb - ya);
      const at = (y) => {
        const t = U.clamp((y - ya) / n, 0, 1);
        let w = w0 + (w1 - w0) * t;
        if (bulge) w += bulge * Math.sin(Math.min(1, t * 2.1) * Math.PI);
        return { x: Math.round(x0 + (x1 - x0) * t), w: Math.max(4, Math.round(w)) };
      };
      for (let y = ya - 1; y <= yb + 1; y++) {
        const a = at(y);
        PIX.rect(c, a.x - (a.w >> 1) - 1, y, a.w + 2, 1, P.K);
      }
      for (let y = ya; y <= yb; y++) {
        const a = at(y), lo = a.x - (a.w >> 1);
        PIX.rect(c, lo, y, a.w, 1, col);
        if (lift) PIX.rect(c, lo, y, a.w, 1, lift);
        PIX.rect(c, lo, y, 2, 1, 'rgba(255,255,255,.07)');
        PIX.rect(c, lo + a.w - 3, y, 3, 1, 'rgba(0,0,0,.28)');
      }
    };

    /* WHICH WAY THE LEG IS GOING, not just where it is. Sine says where in
       the stride it sits; cosine says the direction of travel. Moving
       forward it is in the air with the knee folded; moving back it is on
       the ground taking the weight with the knee locked. Four frames of
       this and a walk stops being a slide. */
    const co = Math.cos(((frame % SPR.WALK_FRAMES) / SPR.WALK_FRAMES) * Math.PI * 2);
    const order = swing >= 0 ? [-1, 1] : [1, -1];
    order.forEach(sgn => {
      const st = sgn * ph;                  // -1 behind him .. +1 out in front
      const air = Math.max(0, sgn * co);    // >0 while it is swinging through
      const fold = air * 0.9 + Math.max(0, -st) * 0.3;
      const lift = Math.round(air * 9);
      const hx = cx + sgn * spread;
      const ax = hx + Math.round(st * 8);   // the ankle leads
      const solY = groundY - lift;          // the sole; planted unless airborne
      const ankY = solY - 5;
      /* the knee breaks FORWARD out of the hip-ankle line as it folds. Head
         on there is nowhere forward to go, so the fold reads in the shin
         and the rising heel instead. */
      const kneeY = hipY + Math.round((ankY - hipY) * 0.48) - Math.round(fold * 2);
      const kx = Math.round(hx + (ax - hx) * 0.42)
        + sgn * Math.round(fold * 1.5);

      bone(hx, hipY, kx, kneeY, LW(def.fat ? 17 : 15), LW(11), legC, 0, legLift);
      /* the knee: a knob with cloth pulling over it */
      const kr = Math.max(3, LW(6));
      PIX.disc(c, kx, kneeY, kr, P.K);
      PIX.disc(c, kx, kneeY, kr - 1, legC);
      PIX.rect(c, kx - 2, kneeY - 2, 3, 2, 'rgba(255,255,255,.14)');
      PIX.rect(c, kx - kr + 1, kneeY + kr - 3, kr * 2 - 2, 1, 'rgba(0,0,0,.34)');
      /* the crease the cloth takes down the front of the shin */
      PIX.rect(c, Math.round((kx + ax) / 2) - 1, kneeY + 5, 1,
        Math.max(0, ankY - kneeY - 7), 'rgba(255,255,255,.06)');
      /* the shin, with the calf swelling under the knee */
      bone(kx, kneeY, ax, ankY, LW(11), LW(8), legC, 1.8 * SLIM * 1.6, legLift);
      PIX.rect(c, ax - 5, ankY - 2, 10, 2, 'rgba(0,0,0,.34)');   // the trouser breaks

      /* THE FOOT ROLLS. Flat through the stance, toe down as it pushes off,
         toe up as it comes in to land. Two pixels of pitch across fifteen
         columns, and the shoe tapers to the toe so it is a shoe and not a
         brick. */
      const toe = st > 0.5 ? -1 : (st < -0.5 ? 1 : 0);
      const face = sgn;
      const SHOE = Math.max(7, LW(15)), SHOH = Math.max(4, LW(6));
      for (let i = 0; i <= SHOE; i++) {
        const tt = i / SHOE;
        const xx = ax - face * Math.round(SHOE * 0.34) + face * i;
        const dy = Math.round(toe * tt * 2);
        const hgt = SHOH - Math.round(tt * 2);
        PIX.rect(c, xx, ankY + dy, 1, hgt + 1, P.K);
        PIX.rect(c, xx, ankY + dy, 1, hgt, shoeC);
        PIX.rect(c, xx, ankY + dy, 1, 1, 'rgba(255,255,255,.16)');
        PIX.rect(c, xx, ankY + dy + hgt - 1, 1, 1, 'rgba(0,0,0,.5)');
      }
    });

    /* THE COAT CARRIES ON PAST THE HIP. Without this the bust stops dead at
       the waist and the trousers start, and he reads as two frogs stacked
       up. The hem kicks with the stride. */
    const coatC = P[(O && O.col) || 'T'] || P.T;
    const coatD = P[(O && O.dark) || 'k'] || P.k;
    const skirtY = bodyTop + bh - 4;
    const skW = Math.round(bw * 0.27);
    const kick = Math.round(swing * 0.35);
    PIX.rect(c, cx - skW - 1 + kick, skirtY, skW * 2 + 2, 14, P.K);
    PIX.rect(c, cx - skW + kick, skirtY, skW * 2, 12, coatC);
    PIX.rect(c, cx - skW + kick, skirtY + 8, skW * 2, 4, coatD);
    PIX.rect(c, cx - skW + kick, skirtY, 2, 12, 'rgba(255,255,255,.07)');
    PIX.rect(c, cx + skW - 3 + kick, skirtY, 3, 12, 'rgba(0,0,0,.26)');
    PIX.rect(c, cx + kick, skirtY + 5, 1, 9, 'rgba(0,0,0,.34)');   // the vent

    const sbw = bw;
    const shw = hw;
    const bodyFit = SPR.fit('body_' + key + ':' + frame, body, sbw, bh);
    c.drawImage(bodyFit, Math.round((W - sbw) / 2) + sway, bodyTop);

    /* HANDS. The bust stops at a shirt cuff because the duel paints the
       hands onto the felt itself. Standing up he needs his own, hung on the
       wrist the body reports, swinging against the leg on the same beat. */
    const wr = body.wristAt;
    if (wr) {
      const bx = Math.round((W - sbw) / 2);
      wr.forEach(w => {
        /* the near arm is posed below, so it does not also get a hand
           hanging at his hip — that is how you end up with three */
        if (armP && w.sgn > 0) return;
        /* HANGING, NOT SPLAYED. The felt pose put a fan of four green digits
           at hip height on every standing frog in the game. */
        /* the wrists come back in the bust's own coordinates, so they scale
           into the fitted bust exactly as the pixels did, and the hand is
           drawn at the same fraction: a hand is about a quarter of the
           shoulder width on a person, and it was half on this rig. */
        const kx = sbw / body.width, ky = bh / body.height;
        SPR.frogHand(c, bx + Math.round(w.x * kx), bodyTop + Math.round(w.y * ky),
          def, w.sgn, { noCuff: true, pose: 'hang', dim: 0.54, k: SLIM * 1.55 });
      });
    }

    const headFit = SPR.fit('head_' + key + ':' + ex + (back ? 'b' : ''),
      head, shw, hh);
    c.drawImage(headFit, Math.round((W - shw) / 2) - sway, BRIM + headBob);

    /* ------------------------------------------------------------
       WALKING AWAY FROM YOU.

       Same frog, same hat, same coat — and nothing on the front of
       his head, because you are behind him. The face is painted out
       in his own skin with the nape shadow under the hat band and
       the shoulders read the rest. Cheaper than a second rig and at
       room scale you cannot tell the difference.
       ------------------------------------------------------------ */
    if (back) {
      /* the coat has no lapels and no tie on the back of it: one panel of
         cloth between the sleeves, a yoke seam across the shoulders and a
         vent down the middle */
      const bx2 = Math.round((W - bw) / 2);
      /* the bust was measured: the torso occupies 0.20 to 0.80 of the body
         canvas, the shirt collar sits in its top tenth and the tie knot in
         the tenth under that. A panel starting at 0.16 of the height left
         both of them showing, so a frog walking away from you was wearing
         his tie on his back. It starts at 0.04 now. */
      /* the bust was measured too: the arms sit outside 0.30 and 0.68 of
         its width, so the panel runs between them and the sleeves keep
         their own silhouette instead of being swallowed by a slab. */
      const px0 = bx2 + Math.round(bw * 0.28), pw = Math.round(bw * 0.44);
      const py0 = bodyTop + Math.round(bh * 0.04), ph = Math.round(bh * 0.94);
      /* THE SHOULDERS ARE NOT SQUARE. Three inset rows off the top and the
         panel stops being a wardrobe with a frog's head on it. */
      /* the welt pocket and the white pocket square sit at 0.28 of the bust,
         right on the panel's own left edge, so they peek out from behind a
         man walking away. One patch of cloth over that corner. */
      PIX.rect(c, bx2 + Math.round(bw * 0.24), bodyTop + Math.round(bh * 0.16),
        Math.round(bw * 0.14), Math.round(bh * 0.16), coatC);
      [2, 1, 0].forEach((n, i2) => PIX.rect(c, px0 + n, py0 + i2, pw - n * 2, 1, coatC));
      PIX.rect(c, px0, py0 + 3, pw, ph - 3, coatC);
      /* SAME CLOTH AS THE FRONT. A flat panel of coat colour is a slab, and
         the chalk stripe is most of what says `suit` at this size — the back
         of a pinstripe jacket has it too. */
      const CO2 = SPR.costumeOf(def);
      const OUT2 = (CO2 && (CO2.overcoat || CO2.jacket)) || null;
      if (OUT2 && OUT2.stripe === 'chalk') {
        const gap = OUT2.stripeGap || 5;
        for (let sx = 3; sx < pw - 3; sx += gap) {
          PIX.rect(c, px0 + sx, py0 + 3, 1, ph - 4, 'rgba(244,239,224,.22)');
        }
      }
      PIX.rect(c, px0 + 2, py0, pw - 4, 2, 'rgba(255,255,255,.07)');
      PIX.rect(c, px0, py0 + 6, pw, 1, 'rgba(0,0,0,.34)');          // the yoke
      PIX.rect(c, px0 + Math.round(pw / 2), py0 + 7, 1, ph - 7, 'rgba(0,0,0,.30)');
      PIX.rect(c, px0 + pw - 3, py0 + 2, 3, ph - 2, 'rgba(0,0,0,.20)');
      /* the vent: a slot up from the hem, which is the one detail that says
         you are looking at the back of a jacket and not the front of one */
      PIX.rect(c, px0 + Math.round(pw / 2) - 1, py0 + ph - 12, 2, 12, 'rgba(0,0,0,.42)');
      const hx = Math.round((W - hw) / 2);
      const sk = P[def.skin[0]] || P.F;
      const sh = P[def.skin[1]] || P.f;
      const dk = P[def.skin[2]] || P.e;
      /* THE SKULL FROM BEHIND, AND HIS HAT LEFT ALONE.

         This used to paint a dome of skin over the middle of the head
         canvas and take the crown of the hat with it: a frog walking away
         from you was bare-headed with a brim floating behind his ears. The
         head canvas was measured -- 46x42, the brim bottom at 0.28 of the
         height, the lenses right under it at 0.30, the collar from 0.86 --
         so the repaint runs from just below the brim at 0.28 down to 0.83,
         which covers the glasses and the face and leaves the hat alone, and
         it lands on the head's own drawn position rather than the body's
         bob. */
      const cx2 = hx + Math.round(hw / 2);
      const hy = BRIM + headBob;                 // where the head actually is
      const at = (f) => hy + Math.round(hh * f);
      /* the brim bottom is at 0.28 and the lens tops are one row under it,
         so a band of skin goes across there and the dome starts at 0.29.
         Taking the dome up any higher instead eats the crown, and a frog
         walking away from you in a skullcap is worse than one in a hat. */
      PIX.rect(c, cx2 - Math.round(hw * 0.36), at(0.28),
        Math.round(hw * 0.72), Math.max(2, Math.round(hh * 0.05)), sk);
      SPR.ellipse(c, cx2, at(0.565), Math.round(hw * 0.40), Math.round(hh * 0.275), sk);
      SPR.ellipse(c, cx2, at(0.65), Math.round(hw * 0.36), Math.round(hh * 0.18), sh);
      /* THE TWO HUMPS A FROG'S EYES MAKE, SEEN FROM BEHIND, and the crease
         between them. Without these the back of his head is a green pill:
         they are the one piece of shape back there, so they go on TOP of the
         skull with a lit crown and a shadow under each, and the sagittal
         line runs down between them. */
      const eo = Math.round(hw * 0.20);
      const ehy = at(0.40);
      const er = Math.max(5, Math.round(hw * 0.17));
      [-1, 1].forEach(sg => {
        const ex2 = cx2 + sg * eo;
        SPR.ellipse(c, ex2, ehy, er, Math.max(4, Math.round(er * 0.74)), sk);
        /* the hump only reads if it is LIT on top and CUT UNDER: same skin
           either side of a one-pixel line is one shape, not two */
        PIX.rect(c, ex2 - er + 2, ehy - Math.round(er * 0.62),
          (er - 2) * 2, 2, 'rgba(255,255,255,.22)');
        PIX.rect(c, ex2 - er + 1, ehy + Math.round(er * 0.62), (er - 1) * 2, 1, dk);
        PIX.rect(c, ex2 - er + 2, ehy + Math.round(er * 0.62) + 1,
          (er - 2) * 2, 1, sh);
        /* the ear drum, which is a real thing on the side of a frog's head
           and the only landmark back here that is not symmetry */
        PIX.disc(c, ex2 + sg * Math.round(er * 0.72), ehy + Math.round(er * 0.28),
          2, sh);
        PIX.rect(c, ex2 + sg * Math.round(er * 0.72) - 1,
          ehy + Math.round(er * 0.28) - 1, 2, 1, dk);
      });
      PIX.rect(c, cx2, at(0.34), 1, Math.round(hh * 0.32), sh);
      PIX.rect(c, cx2 - 1, at(0.34), 1, Math.round(hh * 0.32), 'rgba(0,0,0,.22)');
      /* the nape, and the collar under it */
      PIX.rect(c, cx2 - Math.round(hw * 0.30), at(0.84),
        Math.round(hw * 0.60), 3, dk);
      PIX.rect(c, cx2 - Math.round(hw * 0.22), at(0.88),
        Math.round(hw * 0.44), 2, 'rgba(0,0,0,.35)');
    }

    /* ------------------------------------------------------------
       THE POSED ARM.

       Drawn last, over the coat, from the near shoulder to wherever
       the pose puts the wrist — and it reports where the hand ended
       up, so whatever he is holding can be put IN it instead of
       floating at a guessed height near his chest.
       ------------------------------------------------------------ */
    if (armP) {
      const A = SPR.ARM_POSE[armP];
      const shX = cx + Math.round(bw * 0.26);
      const shY = bodyTop + Math.round(bh * 0.20);
      const exx = cx + Math.round(W * A.ex);
      const eyy = Math.round(H * A.ey);
      const wxx = cx + Math.round(W * A.wx);
      const wyy = Math.round(H * A.wy);
      const tone = 'rgba(255,255,255,.10)';
      bone(shX, shY, exx, eyy, 11, 9, coatC, 0, tone);
      bone(exx, eyy, wxx, wyy - 4, 9, 6, coatC, 1.2, tone);
      PIX.disc(c, exx, eyy, 4, coatC);
      PIX.disc(c, exx, eyy, 4, tone);
      PIX.disc(c, shX, shY + 2, 6, P.K);
      PIX.disc(c, shX, shY + 2, 5, coatC);
      PIX.rect(c, shX - 5, shY, 10, 2, 'rgba(255,255,255,.09)');
      PIX.rect(c, wxx - 4, wyy - 6, 8, 5, P.K);
      PIX.rect(c, wxx - 3, wyy - 6, 6, 4, SPR.cuffColor(def));
      PIX.rect(c, wxx - 3, wyy - 6, 6, 1, 'rgba(255,255,255,.16)');
      SPR.frogHand(c, wxx, wyy - 1, def, 1, { noCuff: true, pose: A.hand, dim: 0.18 });
      cv.hand = { x: wxx, y: wyy + 3 };
    }

    /* and one hard line all the way round him, with a rim light on it.
       TWO pixels, because this is a cartoon. */
    SPR.inkEdge(cv, true, 2);
    return cv;
  });
};

/* the standing pose, for posters and line-ups */
SPR.fullBody = function (key, def) { return SPR.frogWhole(key, def, { frame: 0 }); };

/* ============================================================
   THE SAME FROG, ROOM SIZE.

   A room is drawn at about a third of portrait scale, so the
   whole frog gets sampled down by an integer factor rather than
   redrawn — the silhouette, the hat, the coat and the hands all
   survive, and nothing can drift out of step with the big rig
   because there is only one rig.
   ============================================================ */
/* ============================================================
   THE SAME FROG, SMALLER, WITHOUT LOSING HIM.

   Rooms used to take the 102x129 rig and throw away two pixels in
   every three with nearest-neighbour, which is what killed him: a
   shirt collar, a hat band and a pair of shades are all one or two
   pixels wide, so most of them simply vanished and the rest turned
   to mush.

   This resamples properly — a box filter, which is what smoothing
   ON does on a downscale — then hardens the result back up: alpha
   is thresholded so there is no half-transparent fringe, and the
   silhouette is re-inked one pixel deep so he still reads as a
   drawing rather than a smudge.

   Rooms now prefer to draw the full-detail rig and let the screen
   scale it up by a whole number (see SCENE), so these LODs are for
   the frame sizes where that does not come out even, plus mugshots
   and pins.
   ============================================================ */
/* ============================================================
   FIT — a canvas resampled into a target box and hardened back
   to hard pixels.

   Nearest-neighbour drawImage at a fractional scale DROPS rows
   and columns: a pinstripe becomes a dotted line and a face
   loses an eyelid. So a downscale goes through a box filter with
   smoothing ON — which is the correct way to shrink a bitmap —
   and then the result is hardened: alpha thresholded so there is
   no half-transparent fringe, and the outermost solid pixels
   darkened so the silhouette is still a drawing rather than a
   smudge. This is the pass rigLOD has always used on the whole
   figure; the rig needs it on the HEAD and the BUST too now that
   those are drawn at human proportions rather than at the size
   they happen to be authored at.
   ============================================================ */
SPR.fit = function (key, src, w, h) {
  return SPR.cached('fit_' + key + ':' + w + 'x' + h, () => {
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
    const soft = document.createElement('canvas');
    soft.width = w; soft.height = h;
    const sc = soft.getContext('2d');
    sc.imageSmoothingEnabled = true;
    sc.imageSmoothingQuality = 'high';
    sc.drawImage(src, 0, 0, src.width, src.height, 0, 0, w, h);
    const img = sc.getImageData(0, 0, w, h);
    const d = img.data;
    const solid = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (d[i + 3] > 108) { d[i + 3] = 255; solid[y * w + x] = 1; }
        else d[i + 3] = 0;
      }
    }
    const on = (x, y) => (x < 0 || y < 0 || x >= w || y >= h)
      ? false : solid[y * w + x] === 1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!solid[y * w + x]) continue;
        if (on(x - 1, y) && on(x + 1, y) && on(x, y - 1) && on(x, y + 1)) continue;
        const i = (y * w + x) * 4;
        d[i] = Math.round(d[i] * 0.40);
        d[i + 1] = Math.round(d[i + 1] * 0.40);
        d[i + 2] = Math.round(d[i + 2] * 0.44);
      }
    }
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const oc = out.getContext('2d');
    oc.imageSmoothingEnabled = false;
    oc.putImageData(img, 0, 0);
    return out;
  });
};


SPR.rigLOD = function (key, def, frame, face, down, back, expr, arm) {
  down = down || 3;
  /* EIGHT FRAMES, NOT FOUR. This used to fold the frame number modulo four,
     which quietly threw away half of the walk cycle the rig had drawn. */
  const NF = SPR.WALK_FRAMES;
  const f = (((frame | 0) % NF) + NF) % NF;
  const fc = face < 0 ? -1 : 1;
  const ex = expr || 'neutral';
  const ap = SPR.ARM_POSE[arm] ? arm : '';
  return SPR.cached('lod_' + key + ':' + f + ':' + fc + ':' + down + ':' + ex
    + (back ? ':b' : '') + (ap ? ':a' + ap : ''), () => {
    const src = SPR.frogWhole(key, def, {
      frame: f, back: !!back, expr: ex, arm: ap });
    /* where the posed hand is, in the coordinates of whatever comes back,
       flipped with him — the rooms put the rag or the glass there */
    const hand = src.hand ? { x: src.hand.x, y: src.hand.y } : null;
    const carry = (out) => {
      if (hand) {
        out.hand = {
          x: fc < 0 ? out.width - Math.round(hand.x / down) : Math.round(hand.x / down),
          y: Math.round(hand.y / down),
        };
      }
      return out;
    };
    if (down === 1 && fc > 0) return carry(src);
    const w = Math.max(1, Math.round(src.width / down));
    const h = Math.max(1, Math.round(src.height / down));

    /* 1. the resample, with smoothing ON because this is a downscale */
    const soft = document.createElement('canvas');
    soft.width = w; soft.height = h;
    const sc = soft.getContext('2d');
    sc.imageSmoothingEnabled = true;
    sc.imageSmoothingQuality = 'high';
    sc.drawImage(src, 0, 0, src.width, src.height, 0, 0, w, h);

    if (down === 1) {
      /* nothing to harden, just the flip */
      const out = document.createElement('canvas');
      out.width = w; out.height = h;
      const oc = out.getContext('2d');
      oc.imageSmoothingEnabled = false;
      oc.translate(w, 0); oc.scale(-1, 1);
      oc.drawImage(src, 0, 0);
      return carry(out);
    }

    /* 2. harden it: cut the fringe, then ink the edge one pixel deep */
    const img = sc.getImageData(0, 0, w, h);
    const d = img.data;
    const on = (x, y) => (x < 0 || y < 0 || x >= w || y >= h)
      ? false : d[(y * w + x) * 4 + 3] > 110;
    const solid = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (d[i + 3] > 110) { d[i + 3] = 255; solid[y * w + x] = 1; }
        else d[i + 3] = 0;
      }
    }
    /* the outline goes on the outermost solid pixels, darkened rather
       than replaced, so a pale coat keeps its own colour underneath */
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!solid[y * w + x]) continue;
        if (on(x - 1, y) && on(x + 1, y) && on(x, y - 1) && on(x, y + 1)) continue;
        const i = (y * w + x) * 4;
        d[i] = Math.round(d[i] * 0.34);
        d[i + 1] = Math.round(d[i + 1] * 0.34);
        d[i + 2] = Math.round(d[i + 2] * 0.38);
      }
    }
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    if (fc < 0) { c.translate(w, 0); c.scale(-1, 1); }
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    tmp.getContext('2d').putImageData(img, 0, 0);
    c.drawImage(tmp, 0, 0);
    return carry(cv);
  });
};

/* the old name, kept because mugshots and cork pins ask for it */
SPR.sceneFrog = function (key, def, frame, face, down) {
  return SPR.rigLOD(key, def, frame, face, down || 3);
};

/* a big stepped X, for crossing somebody off the line-up */
SPR.bigX = function (w, h) {
  return SPR.cached('bigx_' + w + '_' + h, () => {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    const P = PIX.PAL;
    const T = Math.max(4, Math.round(w / 12));
    const steps = Math.max(8, Math.round(h / 4));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = Math.round(t * (h - T));
      const x1 = Math.round(t * (w - T));
      const x2 = Math.round((1 - t) * (w - T));
      c.fillStyle = P.K;
      c.fillRect(x1 - 1, y - 1, T + 2, T + 2);
      c.fillRect(x2 - 1, y - 1, T + 2, T + 2);
    }
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = Math.round(t * (h - T));
      const x1 = Math.round(t * (w - T));
      const x2 = Math.round((1 - t) * (w - T));
      c.fillStyle = P.r;
      c.fillRect(x1, y, T, T);
      c.fillRect(x2, y, T, T);
      c.fillStyle = P.R;
      c.fillRect(x1, y, T, 2);
      c.fillRect(x2, y, T, 2);
    }
    return cv;
  });
};
