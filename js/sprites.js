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
   THE FROG HAND — four fingers, each ending in a fat round toe
   pad, webbing between them. Drawn splayed on the felt, seen
   from the player's low angle. Used by the seated mark, the
   corpse and the cops.
   sgn: -1 left hand, +1 right hand (thumb side flips)
   ============================================================ */
SPR.frogHand = function (ctx, x, y, d, sgn, opts) {
  const P = PIX.PAL;
  opts = opts || {};
  const skin = P[d.skin[0]] || P.F;
  const shade = P[d.skin[1]] || P.f;
  const dark = P[d.skin[2]] || P.e;
  const INK = P.K;
  const grip = !!opts.grip;          // curled around something instead of splayed

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
   A HAND CLOSED AROUND SOMETHING.
   The splayed hand is wrong for a grip: four digits fanned out
   over a gun butt read as a shrub. This is the back of a fist,
   knuckles toward the lens, the digits wrapping away to the
   LEFT across whatever it is holding, thumb laid over the top.
   Nominal 30 wide — scale it with the transform.
   ============================================================ */
SPR.frogFist = function (ctx, cx, cy, d, o) {
  o = o || {};
  const P = PIX.PAL, INK = P.K;
  const skin = P[d.skin[0]] || P.F, shade = P[d.skin[1]] || P.f, dark = P[d.skin[2]] || P.e;

  /* the digits first, so the back of the hand lands on top of them */
  for (let i = 0; i < 4; i++) {
    const fy = cy - 12 + i * 8, len = i === 3 ? 13 : 17 - Math.abs(i - 1) * 2;
    SPR.rrect(ctx, cx - 14 - len, fy - 1, len + 8, 10, 4, INK);
    SPR.rrect(ctx, cx - 13 - len, fy, len + 6, 8, 3, i < 2 ? skin : shade);
    PIX.rect(ctx, cx - 13 - len, fy, len + 6, 2, 'rgba(255,255,255,.16)');
    PIX.rect(ctx, cx - 13 - len, fy + 6, len + 6, 2, 'rgba(0,0,0,.30)');
    PIX.rect(ctx, cx - 16 - len, fy + 1, 7, 7, INK);           // the knuckle of it
    PIX.rect(ctx, cx - 15 - len, fy + 2, 5, 5, i < 2 ? skin : shade);
  }

  /* the back of the hand, one mass over the top of the digits */
  SPR.rrect(ctx, cx - 16, cy - 16, 34, 38, 11, INK);
  SPR.rrect(ctx, cx - 14, cy - 14, 30, 34, 10, skin);
  SPR.rrect(ctx, cx - 14, cy + 6, 30, 14, 8, shade);
  PIX.rect(ctx, cx - 12, cy - 14, 24, 3, 'rgba(255,255,255,.20)');

  /* the tendons standing up over the knuckles when it is held tight */
  for (let i = 0; i < 3; i++) {
    PIX.rect(ctx, cx - 12, cy - 8 + i * 8, 22, 1, 'rgba(0,0,0,.26)');
    PIX.rect(ctx, cx - 12, cy - 9 + i * 8, 22, 1, 'rgba(255,255,255,.09)');
  }
  const rng = SPR.defRng(d);
  for (let i = 0; i < 7; i++) {
    PIX.rect(ctx, Math.round(cx - 12 + rng() * 24), Math.round(cy - 12 + rng() * 28), 2, 2, shade);
  }

  /* the thumb, laid over the top of the grip and pointing away */
  SPR.rrect(ctx, cx - 22, cy - 24, 38, 14, 6, INK);
  SPR.rrect(ctx, cx - 20, cy - 22, 34, 11, 5, skin);
  PIX.rect(ctx, cx - 20, cy - 22, 34, 2, 'rgba(255,255,255,.20)');
  PIX.rect(ctx, cx - 20, cy - 14, 34, 3, 'rgba(0,0,0,.22)');
  PIX.rect(ctx, cx - 26, cy - 22, 10, 10, INK);
  PIX.rect(ctx, cx - 25, cy - 21, 8, 8, skin);
  PIX.rect(ctx, cx - 24, cy - 20, 3, 2, 'rgba(255,255,255,.25)');

  if (d.rings) {
    PIX.rect(ctx, cx - 24, cy - 4, 5, 6, INK);
    PIX.rect(ctx, cx - 24, cy - 3, 4, 4, P.G);
  }
  if (o.wet) PIX.rect(ctx, cx - 6, cy - 10, 14, 4, 'rgba(255,255,255,.10)');
  void dark;
};

/* ============================================================
   A FROG IN PROFILE, CLOSE.
   Seen from the side he is a different animal from the one the
   table shows you: one bulb instead of two, a snout carrying
   most of the length of the skull, a mouth line running nearly
   back to the drum, and no chin to speak of.

   Faces LEFT. Origin is the middle of the skull, which is
   nominally 46x33 — scale it with the transform, never by
   passing sizes in, or the outlines stop being one pixel.
   ============================================================ */
SPR.frogProfile = function (ctx, cx, cy, d, o) {
  o = o || {};
  const P = PIX.PAL, INK = P.K;
  const skin = P[d.skin[0]] || P.F, shade = P[d.skin[1]] || P.f, dark = P[d.skin[2]] || P.e;

  /* THE HAT GOES ON FIRST. A frog's eyes sit on top of his skull, so a
     fedora rides behind them: the bulb has to come out over the brim, and
     the only way to get that is to lay the hat down before the head. */
  if (o.hat !== false && d.hat) {
    const hc = P[d.hatCol] || P.T, hb = P[d.band] || P.d, lt = P[LIGHTER[d.hatCol]] || P.t;
    SPR.rrect(ctx, cx - 8, cy - 68, 48, 38, 15, INK);
    SPR.rrect(ctx, cx - 6, cy - 66, 44, 36, 14, hc);
    PIX.rect(ctx, cx - 6, cy - 58, 9, 28, lt);                  // the lit side of the crown
    PIX.rect(ctx, cx + 4, cy - 62, 6, 22, 'rgba(0,0,0,.26)');   // the pinch in the crown
    PIX.rect(ctx, cx - 6, cy - 44, 44, 9, INK);
    PIX.rect(ctx, cx - 6, cy - 43, 44, 7, hb);                  // the band
    /* the brim, dipping toward the front the way a worn one does */
    SPR.ellipse(ctx, cx + 4, cy - 34, 48, 8, INK);
    SPR.ellipse(ctx, cx + 4, cy - 36, 45, 6, hc);
    SPR.ellipse(ctx, cx - 28, cy - 30, 22, 5, INK);
    SPR.ellipse(ctx, cx - 28, cy - 32, 19, 4, hc);
    SPR.ellipse(ctx, cx + 8, cy - 38, 38, 3, lt);
  }

  /* ink pass, then fill pass, over every lump at once — they bury each
     other's outlines and it comes out one silhouette, not five blobs */
  /* On a frog the mouth IS the bottom of the head: the line runs from the
     tip of the snout back past the drum and there is barely a jaw under
     it. Build the mass to end there, with only a shallow lip and the
     throat sac below. */
  const mass = (col, g) => {
    SPR.ellipse(ctx, cx + 16, cy - 6, 28 + g, 23 + g, col);     // cranium, tall at the back
    SPR.ellipse(ctx, cx - 8, cy - 2, 33 + g, 20 + g, col);      // the middle of the skull
    SPR.ellipse(ctx, cx - 34, cy + 2, 24 + g, 14 + g, col);     // snout, tapering forward
    PIX.disc(ctx, cx - 52, cy + 3, 9 + g, col);                 // the blunt tip of it
    SPR.ellipse(ctx, cx - 6, cy + 10, 34 + g, 7 + g, col);      // the lower lip
    SPR.ellipse(ctx, cx + 16, cy + 12, 20 + g, 10 + g, col);    // the throat sac
    PIX.disc(ctx, cx - 14, cy - 28, 20 + g, col);               // the one eye bulb
  };
  mass(INK, 2);
  mass(skin, 0);

  /* the lamp is out over the table, in front of him and above: the back of
     the head and everything under the jaw roll away from it */
  SPR.ellipse(ctx, cx + 26, cy + 2, 20, 19, shade);
  SPR.ellipse(ctx, cx + 32, cy + 8, 14, 12, dark);
  SPR.ellipse(ctx, cx - 6, cy + 14, 30, 4, shade);              // under the lip
  SPR.ellipse(ctx, cx - 44, cy + 8, 12, 6, shade);              // under the snout

  /* freckling, seeded off him, so it never crawls between frames */
  const rng = SPR.defRng(d);
  for (let i = 0; i < 30; i++) {
    const a = rng() * Math.PI * 2, rr = Math.sqrt(rng());
    PIX.disc(ctx, Math.round(cx - 8 + Math.cos(a) * 36 * rr),
      Math.round(cy - 2 + Math.sin(a) * 18 * rr), rng() < 0.28 ? 3 : 2, shade);
  }
  if (d.warts) {
    for (let i = 0; i < 7; i++) {
      const a = rng() * Math.PI * 2, rr = 0.5 + rng() * 0.5;
      const wx = Math.round(cx + 2 + Math.cos(a) * 30 * rr);
      const wy = Math.round(cy - 4 + Math.sin(a) * 16 * rr);
      PIX.disc(ctx, wx, wy, 3, dark); PIX.disc(ctx, wx - 1, wy - 1, 2, shade);
    }
  }

  /* the mouth: from the tip of the snout back to under the drum, stepped
     along its own length so it never anti-aliases */
  const line = [[-60, 1], [-46, 6], [-28, 9], [-6, 10], [14, 9], [32, 4]];
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i], b = line[i + 1], n = b[0] - a[0];
    for (let s = 0; s < n; s++) {
      const t = s / n;
      const px = Math.round(cx + a[0] + n * t);
      const py = Math.round(cy + a[1] + (b[1] - a[1]) * t);
      PIX.rect(ctx, px, py, 1, 3, INK);
      PIX.rect(ctx, px, py + 3, 1, 2, shade);
      if (s % 2 === 0) PIX.rect(ctx, px, py - 2, 1, 2, 'rgba(255,255,255,.07)');
    }
  }
  PIX.disc(ctx, cx - 54, cy - 6, 2, INK);                       // nostril
  PIX.rect(ctx, cx - 58, cy - 10, 5, 2, 'rgba(255,255,255,.12)');

  /* the eye. Near-expressionless: a heavy lid, a slit that only tracks,
     and a blink that is the only thing it ever does. */
  PIX.disc(ctx, cx - 14, cy - 28, 18, shade);
  PIX.disc(ctx, cx - 17, cy - 31, 14, skin);
  if (o.blink) {
    SPR.ellipse(ctx, cx - 23, cy - 29, 15, 13, shade);
    PIX.rect(ctx, cx - 38, cy - 29, 31, 2, INK);
  } else {
    SPR.ellipse(ctx, cx - 24, cy - 29, 14, 13, INK);
    SPR.ellipse(ctx, cx - 24, cy - 29, 12, 11, o.gold ? P.Y : P.O);
    SPR.ellipse(ctx, cx - 27, cy - 29, 4, 10, INK);             // slit pupil
    PIX.rect(ctx, cx - 32, cy - 35, 3, 3, 'rgba(255,255,255,.8)');
    /* the lid comes down over the top third of it, always */
    SPR.ellipse(ctx, cx - 20, cy - 42, 20, 9, skin);
    PIX.rect(ctx, cx - 39, cy - 38, 35, 2, 'rgba(0,0,0,.45)');
  }

  /* the drum on the side of the head */
  PIX.disc(ctx, cx + 22, cy - 6, 11, INK);
  PIX.disc(ctx, cx + 22, cy - 6, 9, shade);
  PIX.disc(ctx, cx + 22, cy - 6, 6, dark);
  PIX.disc(ctx, cx + 19, cy - 9, 3, shade);

  /* wet — a slick over the crown of the bulb, one down the snout */
  for (let i = -5; i <= 5; i++) {
    PIX.rect(ctx, cx - 18 + i * 3, cy - 44 + Math.round(i * i * 0.5), 3, 2, 'rgba(255,255,255,.13)');
  }
  PIX.rect(ctx, cx - 50, cy - 4, 16, 2, 'rgba(255,255,255,.10)');
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

/* the profile head, baked once, so it can be rimmed and reused */
SPR.PROF_OX = 120;
SPR.PROF_OY = 130;
SPR.profileCv = function (d, blink) {
  return SPR.cached('prof:' + SPR.defKey(d) + (blink ? ':b' : ''), () => {
    const cv = document.createElement('canvas');
    cv.width = 220; cv.height = 200;
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    SPR.frogProfile(c, SPR.PROF_OX, SPR.PROF_OY, d, { blink: blink });
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
    /*            lid   pupil  brow-in  brow-out  brow-y */
    neutral: { lid: 2, pup: 3, bi: 0, bo: 0, by: 0 },
    smug:    { lid: 3, pup: 3, bi: 1, bo: 0, by: 0 },
    worry:   { lid: 0, pup: 2, bi: -1, bo: 0, by: -1 },
    grin:    { lid: 2, pup: 3, bi: 0, bo: 0, by: 0 },
    angry:   { lid: 3, pup: 3, bi: 1, bo: -1, by: 1 },
    pain:    { lid: 0, pup: 0, bi: 1, bo: 0, by: 0 },
    dead:    { lid: 0, pup: 0, bi: 0, bo: 0, by: 0 },
    blink:   { lid: 7, pup: 3, bi: 0, bo: 0, by: 0 },   // the whole idle tell
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
    /* sclera, iris, pupil, catchlight */
    PIX.disc(ctx, cx + off, EY + 1, er - 2, P.W);
    const iris = d.goldEyes ? P.G : d.spiral ? P.N : P.g;
    PIX.disc(ctx, cx + off, EY + 1, er - 3, iris);
    if (d.spiral) {
      ctx.fillStyle = P.K;
      ctx.fillRect(cx + off - 1, EY, 3, 1); ctx.fillRect(cx + off + 1, EY + 1, 1, 1);
      ctx.fillRect(cx + off - 1, EY + 2, 2, 1);
    } else {
      /* a frog pupil is a horizontal slot; a scared one shrinks to a dot */
      const pw = Math.max(1, X.pup), ph = expr === 'worry' ? 2 : 3;
      const px = cx + off + (expr === 'smug' ? -side * 2 : 0);
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
    /* and the brow, which is where the whole expression actually lives */
    const bi = X.bi, bo = X.bo;
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
    else if (y < 15) hw = 41;                 // THE shoulder line — the widest point
    else if (y < 21) hw = 40 - (y - 15) * 2;  // hard taper under the pad
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
  if (seated) baseHw -= 7;
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
    const elX  = cx + sgn * (baseHw - (seated ? 8 : 1));   // elbow, out past the ribs
    const haX  = cx + sgn * (baseHw - (seated ? 13 : 9));  // wrist in toward the felt
    /* seated, the sleeve head starts BELOW the coat's shoulder line, so the
       arm grows out of the jacket instead of notching a step into it */
    const y0 = seated ? 13 : 8, yEl = 30, y2 = seated ? H : 57;
    const centerAt = (y) => {
      const t = y < yEl ? (y - y0) / (yEl - y0) : (y - yEl) / (y2 - yEl);
      const a = y < yEl ? shoX : elX, b = y < yEl ? elX : haX;
      return Math.round((a + (b - a) * t) / 2) * 2;   // 2px stair steps
    };
    const widthAt = (y) => {
      const el = Math.abs(y - yEl) < 4;
      let w = el ? 13 : 12;
      if (y > yEl) w = 12 - Math.round((y - yEl) / 12);   // forearm tapers to the wrist
      return w + (y <= (rolled ? 26 : y2) ? bulky : 0);
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
      /* round the tube: lit on the inside edge, shaded on the outside */
      PIX.rect(fctx, c + (sgn < 0 ? -(w >> 1) : (w >> 1) - 2), y, 2, 1, SH1);
      PIX.rect(fctx, c + (sgn < 0 ? (w >> 1) - 1 : -(w >> 1)), y, 1, 1, 'rgba(255,255,255,.07)');
      if (!bare && stripe === 'chalk') {
        const lx = c - (w >> 1) + ((Math.abs(c) + 1) % stripeGap);
        PIX.rect(fctx, lx, y, 1, 1, CHALK);
      }
      if (bare && (y & 3) === 0) PIX.rect(fctx, c - 1, y, 2, 1, skShade);
    }
    /* elbow crease where the sleeve bends onto the table */
    const ec = centerAt(yEl);
    PIX.rect(fctx, ec - 4, yEl - 1, 8, 1, SH3);
    PIX.rect(fctx, ec - 3, yEl + 1, 6, 1, SH2);

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
      PIX.rect(ctx, wc - 6, y2 - 4, 12, 5, INK);
      PIX.rect(ctx, wc - 5, y2 - 4, 10, 4, cuffC);
      PIX.rect(ctx, wc - 5, y2 - 4, 10, 1, 'rgba(255,255,255,.16)');
      PIX.rect(ctx, wc - 5, y2 - 1, 10, 1, SH1);
      if (!gown && !rolled) {                        // cuff link
        PIX.rect(ctx, wc + (sgn < 0 ? -4 : 2), y2 - 3, 2, 2, P.G);
      }
    }

    /* sleeve accessories, on the forearm where you can see them */
    if (acc.armGarters) {
      const gc = L(acc.armGarters, P.d);
      const gy = 34, gcx = centerAt(gy);
      PIX.rect(ctx, gcx - 7, gy - 1, 14, 7, INK);
      PIX.rect(ctx, gcx - 6, gy, 12, 5, gc);
      PIX.rect(ctx, gcx - 6, gy, 12, 1, 'rgba(255,255,255,.2)');
      PIX.rect(ctx, gcx - 6, gy + 4, 12, 1, SH1);
    }
    if (acc.gloves) {                                // glove top above the elbow
      const gl = L(acc.gloves, P.W);
      const gy = 24, gcx = centerAt(gy);
      PIX.rect(ctx, gcx - 7, gy - 1, 14, 5, INK);
      PIX.rect(ctx, gcx - 6, gy, 12, 3, L(DARKER[acc.gloves], P.w));
      PIX.rect(ctx, gcx - 6, gy, 12, 1, gl);
    }
  });

  /* drop the upper-arm layer in behind the coat */
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.drawImage(armCv, 0, 0);
  ctx.restore();

  /* where the sleeves end, so the scene can put the hands exactly there */
  cv.wrist = { dx: baseHw - 9, dy: 56, cx: cx, h: H };

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
  return SPR.cached('frogc_' + key + '_' + (expr || 'neutral'),
    () => SPR.buildFrog(def, expr));
};

SPR.bodyCustom = function (key, def, seated) {
  return SPR.cached('body_' + key + (seated ? '_sit' : ''),
    () => SPR.buildBody(def, { seated: seated }));
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

/* tiny full-body patrons for the casino floor */
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

/* ---------------- trinket cards (balatro-style) ---------------- */

const TRINKET_RAR = {
  common:    ['s', 'T'],
  uncommon:  ['n', 'E'],
  rare:      ['v', 'X'],
  legendary: ['g', 'H'],
};

SPR.trinketCard = function (id) {
  return SPR.cached('tcard_' + id, () => {
    const t = TRINKETS[id];
    const P = PIX.PAL;
    const rc = TRINKET_RAR[t.rarity];
    const W = 22, H = 28;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    // chunky card: ink border, rarity frame, dark face
    PIX.rect(ctx, 1, 0, W - 2, H, P.K); PIX.rect(ctx, 0, 1, W, H - 2, P.K);
    PIX.rect(ctx, 2, 1, W - 4, H - 2, P[rc[0]]);
    PIX.rect(ctx, 1, 2, W - 2, H - 4, P[rc[0]]);
    PIX.rect(ctx, 3, 3, W - 6, H - 6, P[rc[1]]);
    PIX.rect(ctx, 3, 3, W - 6, 1, P.k);
    // face texture
    for (let y = 5; y < H - 5; y += 2) PIX.rect(ctx, 4, y, W - 8, 1, 'rgba(0,0,0,.18)');
    // glyph, centered in the upper area
    const rows = (t.glyph || []).filter(r => r && r.length);
    const gw = Math.max(...rows.map(r => r.length), 1);
    const ox = Math.floor((W - gw) / 2), oy = Math.floor((H - 8 - rows.length) / 2) + 1;
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c !== '.' && c !== ' ') {
          ctx.fillStyle = P[c] || P.W;
          ctx.fillRect(ox + i, oy + j, 1, 1);
        }
      }
    });
    // rarity gem at the bottom
    PIX.rect(ctx, W / 2 - 2, H - 7, 4, 3, P.K);
    PIX.rect(ctx, W / 2 - 1, H - 6, 2, 1, P[rc[0]]);
    if (t.rarity === 'legendary') { // gold corner sparks
      PIX.rect(ctx, 3, 3, 2, 2, P.G); PIX.rect(ctx, W - 5, 3, 2, 2, P.G);
      PIX.rect(ctx, 3, H - 5, 2, 2, P.G); PIX.rect(ctx, W - 5, H - 5, 2, 2, P.G);
    }
    return cv;
  });
};

SPR.trinketCardEl = function (id, scale, cls) {
  return SPR.clone(SPR.trinketCard(id), scale, cls);
};

/* face-down card for locked collection slots */
SPR.cardBack = function () {
  return SPR.cached('tcard_back', () => {
    const P = PIX.PAL;
    const W = 22, H = 28;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    PIX.rect(ctx, 1, 0, W - 2, H, P.K); PIX.rect(ctx, 0, 1, W, H - 2, P.K);
    PIX.rect(ctx, 2, 1, W - 4, H - 2, P.t);
    PIX.rect(ctx, 1, 2, W - 2, H - 4, P.t);
    PIX.rect(ctx, 3, 3, W - 6, H - 6, P.T);
    for (let y = 4; y < H - 4; y += 3) {
      for (let x = 4 + (y % 2); x < W - 4; x += 3) {
        PIX.rect(ctx, x, y, 1, 1, P.t);
      }
    }
    // big ? in the middle
    const q = ['.WWW.', 'W...W', '...W.', '..W..', '.....', '..W..'];
    q.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] === 'W') { ctx.fillStyle = P.q; ctx.fillRect(8 + i, 10 + j, 1, 1); }
      }
    });
    return cv;
  });
};

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

    if (name === 'home') {
      /* the kitchen, lit by one bulb, before any of it */
      PIX.rect(c, 0, 0, LORE_W, LORE_H, '#2a1d14');
      for (let y = 0; y < 74; y += 6) PIX.rect(c, 0, y, LORE_W, 1, 'rgba(0,0,0,.16)');
      PIX.rect(c, 0, 74, LORE_W, LORE_H - 74, '#1a120c');
      PIX.rect(c, 22, 14, 40, 34, '#0d1520');                     // the window
      PIX.rect(c, 24, 16, 36, 30, '#16243a');
      PIX.rect(c, 41, 16, 2, 30, '#0d1520');
      PIX.rect(c, 24, 30, 36, 2, '#0d1520');
      /* the bulb and its cone */
      PIX.rect(c, 118, 0, 2, 16, '#4a3a28');
      PIX.disc(c, 119, 18, 4, '#ffd75e');
      c.globalAlpha = 0.14; c.fillStyle = '#ffd75e';
      c.beginPath(); c.moveTo(119, 20); c.lineTo(80, 82); c.lineTo(160, 82); c.closePath(); c.fill();
      c.globalAlpha = 1;
      SPR.rrect(c, 84, 66, 74, 8, 3, '#3a2a1a');                  // the table
      PIX.rect(c, 92, 74, 4, 14, '#2a1d12');
      PIX.rect(c, 146, 74, 4, 14, '#2a1d12');
      loreSit(c, 100, 68, 0.8, '#0d0a08', false);                 // two small ones
      loreSit(c, 142, 68, 0.8, '#0d0a08', false);
      loreSit(c, 121, 70, 1.0, '#0d0a08', true);                  // and one in a hat
      PIX.disc(c, 121, 60, 3, '#e0a63c');                         // supper on the table
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
      /* the flash, off the one in the middle */
      PIX.disc(c, 112, 62, 9, '#fff3b0');
      PIX.disc(c, 112, 62, 5, '#ffffff');
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2;
        PIX.rect(c, Math.round(112 + Math.cos(a) * 14), Math.round(62 + Math.sin(a) * 14), 2, 2, '#fff3b0');
      }
      return cv;
    }

    if (name === 'after') {
      /* the same room, an hour later, and one of you left standing in it */
      PIX.rect(c, 0, 0, LORE_W, LORE_H, '#0f141c');
      for (let y = 0; y < 74; y += 6) PIX.rect(c, 0, y, LORE_W, 1, 'rgba(0,0,0,.22)');
      PIX.rect(c, 0, 74, LORE_W, LORE_H - 74, '#080b10');
      PIX.rect(c, 22, 14, 40, 34, '#070a10');
      PIX.rect(c, 24, 16, 36, 30, '#101b2c');
      /* the bulb, still swinging */
      PIX.rect(c, 114, 0, 2, 18, '#2a2a30');
      PIX.disc(c, 115, 20, 4, '#6b6f7a');
      SPR.rrect(c, 84, 66, 74, 8, 3, '#1a1a22');
      PIX.rect(c, 92, 74, 4, 14, '#141419');
      /* the chair gone over */
      PIX.rect(c, 60, 84, 22, 4, '#141419');
      PIX.rect(c, 60, 88, 4, 12, '#141419');
      /* what is on the boards */
      SPR.ellipse(c, 108, 92, 22, 5, '#2a0a12');
      SPR.ellipse(c, 104, 91, 13, 3, '#571220');
      loreStand(c, 143, 100, 0.72, '#05070a', true);              // you, in the doorway
      loreRain(c, 7, 26, 'rgba(127,215,255,.10)');
      return cv;
    }

    if (name === 'tower') {
      /* the house, from the street, in the rain */
      PIX.rect(c, 0, 0, LORE_W, LORE_H, '#080c14');
      for (let i = 0; i < 40; i++) {
        PIX.disc(c, (i * 41) % LORE_W, (i * 17) % 40, 1, 'rgba(200,220,255,.10)');
      }
      PIX.rect(c, 54, 10, 72, 98, '#161b28');                     // the tower
      PIX.rect(c, 54, 10, 4, 98, '#20273a');
      PIX.rect(c, 122, 10, 4, 98, '#0e1220');
      for (let f = 0; f < 8; f++) {                               // eight floors of it
        const y = 96 - f * 11;
        const lit = f < 3 ? '#e0a63c' : f < 6 ? '#a5741f' : '#6e4c12';
        PIX.rect(c, 58, y, 64, 2, '#0a0d14');
        for (let w = 0; w < 5; w++) PIX.rect(c, 62 + w * 12, y - 6, 7, 5, lit);
      }
      PIX.rect(c, 60, 4, 60, 8, '#12101d');                       // the sign on the roof
      PIX.rect(c, 62, 5, 56, 6, '#ff6a5e');
      PIX.rect(c, 66, 6, 4, 4, '#fff3b0');
      PIX.rect(c, 74, 6, 4, 4, '#fff3b0');
      PIX.rect(c, 82, 6, 4, 4, '#fff3b0');
      SPR.ellipse(c, 90, 108, 46, 6, 'rgba(224,166,60,.14)');     // wet street
      loreStand(c, 90, 108, 0.6, '#04060a', true);
      loreRain(c, 11, 70, 'rgba(127,215,255,.16)');
      return cv;
    }

    /* 'stairs' — the bottom of the only staircase that matters */
    PIX.rect(c, 0, 0, LORE_W, LORE_H, '#0b0f16');
    for (let s = 0; s < 9; s++) {
      const y = 100 - s * 9, w = 108 - s * 8;
      PIX.rect(c, 90 - w / 2, y, w, 5, '#1d2330');
      PIX.rect(c, 90 - w / 2, y, w, 1, '#2b3346');
      PIX.rect(c, 90 - w / 2, y + 5, w, 4, '#101520');
    }
    c.globalAlpha = 0.20; c.fillStyle = '#ffd75e';
    c.beginPath(); c.moveTo(90, 12); c.lineTo(40, 108); c.lineTo(140, 108); c.closePath(); c.fill();
    c.globalAlpha = 1;
    PIX.rect(c, 70, 6, 40, 16, '#e8c86a');                        // the door at the top
    PIX.rect(c, 74, 8, 32, 14, '#ffd75e');
    loreStand(c, 90, 104, 0.9, '#05070b', true);
    /* the iron, in his hand, held low */
    PIX.rect(c, 106, 84, 12, 4, '#05070b');
    PIX.rect(c, 116, 82, 4, 8, '#05070b');
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
   A SPEECH PLATE, DRAWN AND NOT STYLED.
   Every panel in this game is pixels except the ones CSS was
   making, and a gradient with a border-radius is not pixel art.
   This builds the whole thing — frame, rivets, portrait well,
   name bar, wrapped lines — onto one canvas at one scale.
   ============================================================ */
SPR.speech = function (o) {
  const P = PIX.PAL;
  const pad = 6, gap = 5;

  /* Everything inside is drawn at ONE pixel per pixel and the whole plate
     is blown up by an integer at the end. Render the text big and scale the
     canvas down in CSS instead and the letters go soft, which defeats the
     entire point of a pixel font. */
  const name = o.name ? PIXFONT.render(o.name, { scale: 1, color: o.nameCol || P.G, shadow: null }) : null;
  const lines = (o.lines || []).map(l =>
    PIXFONT.render(l, { scale: 1, color: P.W, shadow: null }));
  const foot = o.foot ? PIXFONT.render(o.foot, { scale: 1, color: P.q, shadow: null }) : null;

  const pw = o.portrait ? o.portrait.width : 0;
  const ph = o.portrait ? o.portrait.height : 0;
  let tw = Math.max(name ? name.width : 0, foot ? foot.width : 0);
  lines.forEach(l => { tw = Math.max(tw, l.width); });
  let th = (name ? name.height + 3 : 0) + (foot ? foot.height + 3 : 0);
  lines.forEach(l => { th += l.height + 2; });

  const bodyW = pw + (pw ? gap : 0) + tw;
  const W = bodyW + pad * 2 + 4;
  const H = Math.max(ph, th) + pad * 2 + 4;

  /* the blow-up factor is chosen from the room the plate has, not guessed */
  const K = U.clamp(Math.floor((o.maxW || 1200) / W), 2, 6);

  const cv = document.createElement('canvas');
  cv.width = W * K; cv.height = H * K;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.save();
  c.scale(K, K);

  /* --- the box: ink, bevel, felt, and a rivet in every corner --- */
  SPR.rrect(c, 0, 0, W, H, 4, P.K);
  SPR.rrect(c, 1, 1, W - 2, H - 2, 3, o.rim || P.f);
  SPR.rrect(c, 2, 2, W - 4, H - 4, 3, P.K);
  SPR.rrect(c, 3, 3, W - 6, H - 6, 2, '#0d1a14');
  PIX.rect(c, 3, 3, W - 6, 1, 'rgba(255,255,255,.10)');
  PIX.rect(c, 3, H - 4, W - 6, 1, 'rgba(0,0,0,.5)');
  [[3, 3], [W - 7, 3], [3, H - 7], [W - 7, H - 7]].forEach(([rx, ry]) => {
    PIX.rect(c, rx, ry, 4, 4, P.K);
    PIX.rect(c, rx + 1, ry + 1, 2, 2, o.rim || P.f);
  });
  /* a hatch of scanlines over the fill, so it is not a flat slab */
  for (let y = 5; y < H - 5; y += 3) PIX.rect(c, 4, y, W - 8, 1, 'rgba(0,0,0,.22)');

  /* --- the portrait, in its own well --- */
  let tx = pad + 2;
  if (o.portrait) {
    PIX.rect(c, pad, pad, pw + 2, ph + 2, P.K);
    PIX.rect(c, pad + 1, pad + 1, pw, ph, '#08120d');
    c.drawImage(o.portrait, pad + 1, pad + 1);
    PIX.rect(c, pad + pw + 3, pad, 1, ph + 2, 'rgba(0,0,0,.55)');
    tx = pad + pw + 3 + gap;
  }

  /* --- the words --- */
  let ty = pad + 2;
  if (name) { c.drawImage(name, tx, ty); ty += name.height + 3; }
  lines.forEach(l => { c.drawImage(l, tx, ty); ty += l.height + 2; });
  if (foot) c.drawImage(foot, W - pad - 2 - foot.width, H - pad - 2 - foot.height);

  c.restore();
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
