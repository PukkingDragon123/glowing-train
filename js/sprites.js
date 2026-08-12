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
  PIX.rect(ctx, x - sgn * 2 - 1, y - 4, 3, 2, 'rgba(255,255,255,.22)');  // knuckle light
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

const FROG_DEFS = {
  player:    { skin: ['F', 'f', 'e'], fat: false, suit: 'T', shirt: 'W', tie: 'd',
               costume: 'pinstripe', braces: true,
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
  const ex = fat ? 12 : 9, ey = 11;      // eye bulbs
  const er = 6;

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

  /* head */
  SPR.ellipse(ctx, cx, headY, rx + 1, ry + 1, P.K);
  SPR.ellipse(ctx, cx, headY, rx, ry, skin);
  SPR.ellipse(ctx, cx, headY + 6, rx - 2, 5, shade);
  if (fat) {
    SPR.ellipse(ctx, cx - rx + 5, headY + 6, 6, 5, shade);
    SPR.ellipse(ctx, cx + rx - 5, headY + 6, 6, 5, shade);
    PIX.rect(ctx, cx - 7, headY + 11, 15, 1, dark);
  }
  if (d.spots) {
    [[-rx + 5, headY - 2], [rx - 7, headY + 3], [-4, headY + 8], [7, headY - 4]]
      .forEach(([sx, sy]) => PIX.disc(ctx, cx + sx, sy, 2, shade));
  }

  /* --- eyes, by expression --- */
  const drawEye = (off, side) => {
    PIX.disc(ctx, cx + off, ey, er + 1, P.K);
    PIX.disc(ctx, cx + off, ey, er, skin);
    if (expr === 'dead') {                       // X X
      ctx.fillStyle = P.K;
      for (let i = -2; i <= 2; i++) {
        ctx.fillRect(cx + off + i, ey + i, 1, 1);
        ctx.fillRect(cx + off + i, ey - i, 1, 1);
      }
      return;
    }
    if (expr === 'pain') {                       // squeezed shut
      ctx.fillStyle = P.K;
      for (let i = 0; i <= 4; i++) {
        ctx.fillRect(cx + off - 2 + i, ey - 2 + Math.abs(2 - i), 1, 1);
        ctx.fillRect(cx + off - 2 + i, ey + 2 - Math.abs(2 - i), 1, 1);
      }
      return;
    }
    PIX.disc(ctx, cx + off, ey + 1, er - 2, P.W);
    if (d.goldEyes) PIX.disc(ctx, cx + off, ey + 1, er - 3, P.G);
    ctx.fillStyle = P.K;
    if (d.spiral) {
      ctx.fillRect(cx + off - 1, ey, 3, 1); ctx.fillRect(cx + off + 1, ey + 1, 1, 1);
      ctx.fillRect(cx + off - 1, ey + 2, 2, 1);
    } else if (expr === 'worry') {
      ctx.fillRect(cx + off - 1, ey + 1, 2, 2);  // tiny scared pupil
    } else if (expr === 'smug') {
      ctx.fillRect(cx + off + (side < 0 ? 1 : -3), ey + 1, 2, 3);
    } else {
      ctx.fillRect(cx + off - 1, ey, 3, 4);      // big cartoon pupil
      ctx.fillStyle = P.W; ctx.fillRect(cx + off, ey + 1, 1, 1);
      ctx.fillStyle = P.K;
    }
    if (expr === 'neutral' || expr === 'smug') { // heavy mobster lids
      PIX.disc(ctx, cx + off, ey - (expr === 'smug' ? 1 : 3), er - 2, skin);
      PIX.rect(ctx, cx + off - er + 2, ey - (expr === 'smug' ? 0 : 2), er * 2 - 3, 1, shade);
    }
    if (expr === 'angry') {                      // V brows
      ctx.fillStyle = P.K;
      for (let i = 0; i < er - 1; i++) {
        ctx.fillRect(cx + off + (side < 0 ? -er + 2 + i : er - 3 - i), ey - er + 1 + Math.floor(i * 0.8), 2, 1);
      }
    }
    if (expr === 'worry') {                      // brow up, whites wide
      ctx.fillStyle = dark;
      ctx.fillRect(cx + off - 3, ey - er - 1, 7, 1);
    }
    if (d.lashes && expr !== 'dead') {
      PIX.rect(ctx, cx + off - er + 1, ey - er + 2, 1, 2, P.K);
      PIX.rect(ctx, cx + off, ey - er - 1, 1, 2, P.K);
      PIX.rect(ctx, cx + off + er - 1, ey - er + 2, 1, 2, P.K);
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
  if (d.visor) {
    PIX.rect(ctx, cx - ex - er, ey - 4, (ex + er) * 2 + 1, 1, P.K);
    PIX.rect(ctx, cx - ex - er + 1, ey - 6, (ex + er) * 2 - 1, 2, P.n);
    PIX.rect(ctx, cx - ex - er + 1, ey - 7, (ex + er) * 2 - 1, 1, P.N);
  }

  /* nostrils */
  PIX.rect(ctx, cx - 3, headY - 4, 1, 2, dark);
  PIX.rect(ctx, cx + 3, headY - 4, 1, 2, dark);

  /* --- mouth, by expression (2px cartoon lines) --- */
  const mw = rx - 4, my = headY + 4;
  const curve = (dir, depth) => {
    ctx.fillStyle = P.K;
    for (let x = -mw; x <= mw; x++) {
      const b = Math.round(Math.pow(Math.abs(x) / mw, 2) * depth);
      ctx.fillRect(cx + x, my + dir * b, 1, 2);
    }
  };
  switch (expr) {
    case 'grin': {
      curve(-1, 5);
      ctx.fillStyle = P.W;
      for (let x = -mw + 2; x <= mw - 2; x++) {
        const b = Math.round(Math.pow(Math.abs(x) / mw, 2) * 5);
        ctx.fillRect(cx + x, my - b + 2, 1, 2);
      }
      ctx.fillStyle = P.K;
      for (let x = -mw + 3; x <= mw - 3; x += 4) ctx.fillRect(cx + x, my, 1, 3);
      if (d.goldtooth) { ctx.fillStyle = P.G; ctx.fillRect(cx + 3, my + 1, 2, 2); }
      break;
    }
    case 'smug': {
      ctx.fillStyle = P.K;
      for (let x = -mw + 2; x <= mw - 1; x++) {
        const t = (x + mw) / (2 * mw);
        ctx.fillRect(cx + x, my + 2 - Math.round(t * t * 4), 1, 2);
      }
      if (d.goldtooth) { ctx.fillStyle = P.G; ctx.fillRect(cx + mw - 4, my - 1, 2, 2); }
      break;
    }
    case 'worry': {
      ctx.fillStyle = P.K;
      for (let x = -mw + 2; x <= mw - 2; x++) {
        ctx.fillRect(cx + x, my + 1 + ((x & 2) ? 1 : 0), 1, 2);
      }
      PIX.rect(ctx, cx - rx + 3, ey - 2, 2, 3, P.L);   // flop sweat
      PIX.rect(ctx, cx - rx + 3, ey - 3, 1, 1, P.L);
      break;
    }
    case 'angry': {
      PIX.rect(ctx, cx - mw + 1, my, mw * 2 - 1, 4, P.K);
      ctx.fillStyle = P.W;
      ctx.fillRect(cx - mw + 2, my + 1, mw * 2 - 3, 2);
      ctx.fillStyle = P.K;
      for (let x = -mw + 3; x <= mw - 2; x += 3) ctx.fillRect(cx + x, my + 1, 1, 2);
      if (d.goldtooth) { ctx.fillStyle = P.G; ctx.fillRect(cx + 2, my + 1, 2, 2); }
      break;
    }
    case 'pain':
    case 'dead': {
      SPR.ellipse(ctx, cx, my + 2, 4, 3, P.K);
      SPR.ellipse(ctx, cx, my + 2, 2, 1, P.D);
      if (expr === 'dead') {                      // tongue out
        PIX.rect(ctx, cx + 3, my + 3, 4, 3, P.K);
        PIX.rect(ctx, cx + 4, my + 3, 3, 2, P.R);
      }
      break;
    }
    default: {                                    // neutral droop
      curve(1, 4);
      if (d.goldtooth) { ctx.fillStyle = P.G; ctx.fillRect(cx + mw - 5, my + 3, 2, 1); }
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
SPR.buildBody = function (d) {
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
    const elX  = cx + sgn * (baseHw - 1);          // elbow bows out past the ribs
    const haX  = cx + sgn * (baseHw - 9);          // wrist back in, onto the felt
    const y0 = 8, yEl = 30, y2 = 57;
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

    /* ---- forearm: IN FRONT, coming toward the felt ---- */
    for (let y = yEl - 3; y <= y2; y++) {
      const c = centerAt(U.clamp(y, y0, y2 - 1)), w = widthAt(y);
      PIX.rect(ctx, c - (w >> 1), y, w, 1, INK);        // full outline against the coat
    }
    for (let y = yEl - 2; y < y2; y++) {
      const c = centerAt(y), w = widthAt(y) - 2;
      const bare = y > rollY;
      PIX.rect(ctx, c - (w >> 1), y, w, 1, bare ? skin : sleeveC);
      /* round the tube: lit on the inside edge, shaded on the outside */
      PIX.rect(ctx, c + (sgn < 0 ? -(w >> 1) : (w >> 1) - 2), y, 2, 1, SH1);
      PIX.rect(ctx, c + (sgn < 0 ? (w >> 1) - 1 : -(w >> 1)), y, 1, 1, 'rgba(255,255,255,.07)');
      if (!bare && stripe === 'chalk') {
        const lx = c - (w >> 1) + ((Math.abs(c) + 1) % stripeGap);
        PIX.rect(ctx, lx, y, 1, 1, CHALK);
      }
      if (bare && (y & 3) === 0) PIX.rect(ctx, c - 1, y, 2, 1, skShade);
    }
    /* elbow crease where the sleeve bends onto the table */
    const ec = centerAt(yEl);
    PIX.rect(ctx, ec - 4, yEl - 1, 8, 1, SH3);
    PIX.rect(ctx, ec - 3, yEl + 1, 6, 1, SH2);

    /* shoulder cap: the coat's own seam riding over the sleeve head */
    const sc = centerAt(y0);
    PIX.rect(ctx, sc - 7, y0 - 1, 14, 2, INK);
    PIX.rect(ctx, sc - 6, y0, 12, 1, base);
    PIX.rect(ctx, sc - 6, y0 + 1, 12, 1, SH2);

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

    /* cuff at the wrist — the scene's felt hands butt straight up against this */
    const wc = centerAt(y2 - 1);
    PIX.rect(ctx, wc - 6, y2 - 4, 12, 5, INK);
    PIX.rect(ctx, wc - 5, y2 - 4, 10, 4, cuffC);
    PIX.rect(ctx, wc - 5, y2 - 4, 10, 1, 'rgba(255,255,255,.16)');
    PIX.rect(ctx, wc - 5, y2 - 1, 10, 1, SH1);
    if (!gown && !rolled) {                          // cuff link
      PIX.rect(ctx, wc + (sgn < 0 ? -4 : 2), y2 - 3, 2, 2, P.G);
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

SPR.bodyCustom = function (key, def) {
  return SPR.cached('body_' + key, () => SPR.buildBody(def));
};

SPR.frogEl = function (id, scale, cls, expr) {
  return SPR.clone(SPR.frogMaster(id, expr), scale, cls);
};

/* ============================================================
   THE GUNS — side views, pointing right.
   ============================================================ */

PIX.def('gun_snub', `
..............................
......KKKKKKKKKKKKK...........
....KKSSSSSSSSSSSSSKK.........
...KSSMMSSSSSSSSSSSSSKKKK.....
..KSsKKKKKKKsSSSSSSSSSSSK.....
..KSsKtttttKsSSMMSSKKKKK......
..KSsKtOtOtKsSSSSSK...........
..KSsKtttttKsSSSSK............
..KSsKKKKKKKsSSSK.............
...KSSSSSSSSSSSK..............
....KKKKbbKKKKK...............
.......KbBBbK.................
.......KbBbbK.................
........KbbbK.................
........KbbK..................
........KKKK..................`);

PIX.def('gun_colt', `
..........................................
......KKKKKKKKKKKKKKKKKKKKKKKKKKKKK.......
....KKSSSSSSSSSSSSSSSSSSSSSSSSSSSSSKK.....
...KSSMMSSSSSSSSSSSSSSSSSSSSSSMMSSSSK.....
..KSsKKKKKKKsSSSSSSSSSSSSSSSSSSSSSSSK.....
..KSsKtttttKsSSMMSSKKKKKKKKKKKKKKKK.......
..KSsKtOtOtKsSSSSSK.......................
..KSsKtttttKsSSSSK........................
..KSsKKKKKKKsSSSK.........................
...KSSSSSSSSSSSK..........................
....KKKKbbKKKKK...........................
.......KbBBbK.............................
.......KbBbbK.............................
........KbbbK.............................
........KbbK..............................
........KKKK..............................`);

PIX.def('gun_sawn', `
....................................
..KKKKKKKKKKKKKKKKKKKKKKKKK.........
.KSSSSSSSSSSSSSSSSSSSSSSSSSK........
.KsKKKKKKKKKKKKKKKKKKKKKKKsK........
.KSSMMSSSSSSSSSSSSSSSSSSSSSK........
.KsKKKKKKKKKKKKKKKKKKKKKKKsK........
.KSSSSSSSSSSSSSSSSSSSSSSSSSK........
..KKKKbbbbbbKKKKKKKKKKKKKKK.........
....KbbBBBBbbbK.....................
.....KbbBBBbbbK.....................
......KKbbBbbK......................
........KKbbbK......................
..........KKKK......................`);

PIX.def('gun_tommy', `
..............................................
........KK....................................
.......KssK...KKKKKKKKKKKKKKKKKKKKKKKKK.......
......KKssKKKSSSSSSSSSSSSSSSSSSSSSSSSSSK......
.....KSSSSSSSSSSMMSSSSSSSSSSSSSSSSSSMMSK......
....KSSSSSSSSSSSSSSSSSSSSSSSSSSSKKKKKKK.......
....KSKKKKKKKKbbbbKKKKKKbbbKKKKK..............
....KSK.....KbBBbbbK...KbBbbK.................
...KKKK....KbbBBbbK....KbbbbK.................
...KttK....KbbbbbK.....KbbbK..................
...KttttK..KKKKKK......KKKK...................
....KKttttK...................................
......KKKKttK.................................
.........KKKK.................................`);

PIX.def('gun_golden', `
..........................................
......KKKKKKKKKKKKKKKKKKKKKKKKKKKKK.......
....KKGGGGGGGGGGGGGGGGGGGGGGGGGGGGGKK.....
...KGGYYGGGGGGGGGGGGGGGGGGGGGGYYGGGGK.....
..KGgKKKKKKKgGGGGGGGGGGGGGGGGGGGGGGGK.....
..KGgKhhhhhKgGGYYGGKKKKKKKKKKKKKKKK.......
..KGgKhYhYhKgGGGGGK.......................
..KGgKhhhhhKgGGGGK........................
..KGgKKKKKKKgGGGK.........................
...KGGGGGGGGGGGK..........................
....KKKKhhKKKKK...........................
.......KhGGhK.............................
.......KhGhhK.............................
........KhhhK.............................
........KhhK..............................
........KKKK..............................`);

const GUN_SPRITES = { snub: 'gun_snub', colt: 'gun_colt', sawn: 'gun_sawn',
  tommy: 'gun_tommy', golden: 'gun_golden' };

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
