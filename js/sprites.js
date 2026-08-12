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

const FROG_DEFS = {
  player:    { skin: ['F', 'f', 'e'], fat: false, suit: 'T', shirt: 'W', tie: 'd',
               hat: 'fedora', hatCol: 'T', band: 'd', cigar: true },
  blindfold: { skin: ['w', 'q', 'q'], fat: false, suit: 't', shirt: 'w', tie: 't',
               glasses: 'round' },
  vig:       { skin: ['B', 'b', 'u'], fat: true, suit: 'k', shirt: 'W', tie: 'G',
               hat: 'fedora', hatCol: 'U', band: 'G', cigar: true, warts: true },
  spinner:   { skin: ['N', 'n', 'n'], fat: false, suit: 't', shirt: 'W', bowtie: 'r',
               spiral: true },
  croupier:  { skin: ['f', 'e', 'e'], fat: false, suit: 'k', shirt: 'W', bowtie: 'd',
               visor: true },
  collector: { skin: ['O', 'o', 'o'], fat: true, suit: 't', shirt: 'w', tie: 'T',
               glasses: 'square', warts: true },
  cage:      { skin: ['s', 't', 't'], fat: false, suit: 'stripes', shirt: 'w', tie: null,
               flatcap: true },
  lily:      { skin: ['P', 'p', 'X'], fat: false, suit: 'd', shirt: 'P', tie: null,
               lips: 'R', lashes: true, necklace: 'W', earring: 'G', cigholder: true },
  owner:     { skin: ['v', 'X', 'X'], fat: true, suit: 'k', shirt: 'W', tie: 'G',
               hat: 'tophat', hatCol: 'k', band: 'G', goldEyes: true, cigar: true, warts: true },
  dealer:    { skin: ['F', 'f', 'e'], fat: false, suit: 'W', shirt: 'W', bowtie: 'K',
               visor: true },
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

  /* little shoulders — the head is the point */
  const sw = fat ? 21 : 14;
  PIX.rect(ctx, cx - sw - 1, H - 7, sw * 2 + 2, 7, P.K);
  if (d.suit === 'stripes') {
    for (let x = -sw; x <= sw; x++) {
      ctx.fillStyle = (x + 100) % 4 < 2 ? P.t : P.T;
      ctx.fillRect(cx + x, H - 6, 1, 6);
    }
  } else {
    PIX.rect(ctx, cx - sw, H - 6, sw * 2 + 1, 6, P[d.suit] || P.T);
  }
  PIX.rect(ctx, cx - 3, H - 6, 7, 6, P[d.shirt] || P.W);
  if (d.tie) PIX.rect(ctx, cx - 1, H - 5, 3, 5, P[d.tie]);
  if (d.necklace) {
    for (let x = -5; x <= 5; x += 2) {
      PIX.rect(ctx, cx + x, H - 5 + (Math.abs(x) > 3 ? 0 : 1), 1, 1, P[d.necklace] || P.W);
    }
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

/* seated body for the duel table — true stepped pixel-art: no
   diagonals, only stair-stepped rects, chunky K outlines, side
   shading. Collar, lapels, buttons, cuffs; vest/tie/rings on top. */
SPR.buildBody = function (d) {
  const P = PIX.PAL;
  const W = 116, H = 60;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const cx = 58;
  const fat = !!d.fat;
  const suit = d.suit === 'stripes' ? P.t : (P[d.suit] || P.T);
  const shirt = P[d.shirt] || P.W;
  const skin = P[d.skin[0]], shade = P[d.skin[1]];

  /* neck */
  PIX.rect(ctx, cx - 8, 0, 16, 8, P.K);
  PIX.rect(ctx, cx - 7, 0, 14, 7, skin);
  PIX.rect(ctx, cx - 7, 5, 14, 2, shade);

  /* torso profile: half-width per row, stepped every few rows */
  const prof = [];
  for (let y = 0; y < H; y++) {
    let hw;
    if (y < 2) hw = 14; else if (y < 4) hw = 20; else if (y < 6) hw = 25;
    else if (y < 8) hw = 29; else if (y < 11) hw = 32; else if (y < 15) hw = 34;
    else if (y < 26) hw = 35; else if (y < 38) hw = 36; else if (y < 50) hw = 37;
    else hw = 38;
    if (fat) {
      hw += 9;
      if (y >= 24) hw += Math.min(7, 2 + ((y - 24) >> 2)); // the belly steps out
    }
    prof.push(Math.min(hw, 56));
  }
  /* outline pass, then suit pass */
  for (let y = 2; y < H; y++) {
    const hw = prof[y], hwUp = prof[y - 1] || 0;
    PIX.rect(ctx, cx - hw - 1, y, (hw + 1) * 2 + 1, 1, P.K);
    if (y === 2) continue;                       // top edge stays ink
    if (hw > hwUp + 1) {                         // step ledges get an ink cap
      PIX.rect(ctx, cx - hw - 1, y, hw - hwUp, 1, P.K);
      PIX.rect(ctx, cx + hwUp + 1, y, hw - hwUp + 1, 1, P.K);
    }
    PIX.rect(ctx, cx - hw, y, hw * 2 + 1, 1, suit);
  }
  /* side shading (light from the lamp, top-left) + inner highlight */
  for (let y = 4; y < H; y++) {
    const hw = prof[y];
    PIX.rect(ctx, cx + hw - 4, y, 4, 1, 'rgba(0,0,0,.28)');
    PIX.rect(ctx, cx - hw + 1, y, 2, 1, 'rgba(255,255,255,.08)');
  }
  if (d.suit === 'stripes') {
    for (let x = -52; x <= 52; x += 5) {
      for (let y = 4; y < H; y++) {
        if (Math.abs(x) <= prof[y] - 2) PIX.rect(ctx, cx + x, y, 2, 1, P.T);
      }
    }
  }
  if (fat) { // belly crease
    PIX.rect(ctx, cx - prof[H - 8] + 10, H - 8, (prof[H - 8] - 10) * 2, 1, 'rgba(0,0,0,.3)');
  }

  /* shirt: stepped collar V opening to a straight panel */
  const shirtRows = [[2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 7]];
  shirtRows.forEach(([y, hw]) => {
    PIX.rect(ctx, cx - hw - 1, y, hw * 2 + 3, 1, P.K);
    PIX.rect(ctx, cx - hw, y, hw * 2 + 1, 1, shirt);
  });
  for (let y = 8; y < 38; y++) {
    PIX.rect(ctx, cx - 8, y, 17, 1, P.K);
    PIX.rect(ctx, cx - 7, y, 15, 1, shirt);
  }
  PIX.rect(ctx, cx - 7, 33, 15, 5, 'rgba(0,0,0,.2)');
  /* collar points: little stepped wings */
  [[-1], [1]].forEach(([s]) => {
    PIX.rect(ctx, cx + s * 4 - 2, 2, 4, 2, shirt);
    PIX.rect(ctx, cx + s * 7 - 2, 4, 4, 2, shirt);
    PIX.rect(ctx, cx + s * 9 - 1, 6, 3, 2, shirt);
    PIX.rect(ctx, cx + s * 9 - 1, 8, 3, 1, 'rgba(0,0,0,.25)');
  });
  for (let y = 12; y <= 30; y += 6) PIX.rect(ctx, cx - 1, y, 2, 2, P.q); // buttons

  /* lapels: stair-stepped, ink edge with suit face */
  [[-1], [1]].forEach(([s]) => {
    for (let i = 0; i < 8; i++) {
      const lx = cx + s * (13 - i) - 2, ly = 3 + i * 2;
      PIX.rect(ctx, lx, ly, 4, 3, P.K);
      PIX.rect(ctx, lx + (s < 0 ? 1 : 0), ly, 3, 2, suit);
    }
    // notch at the top
    PIX.rect(ctx, cx + s * 14 - 2, 3, 4, 2, P.K);
  });
  /* pocket square, left breast */
  PIX.rect(ctx, cx - 26, 20, 6, 4, P.K);
  PIX.rect(ctx, cx - 25, 20, 4, 3, P.W);

  /* arms: continuous stepped tubes — shoulder out to elbow, forearm in */
  [[-1], [1]].forEach(([sgn]) => {
    const baseHw = fat ? 44 : 35;
    const shX = cx + sgn * (baseHw - 7);
    const elX = cx + sgn * (baseHw + 5);
    const haX = cx + sgn * (baseHw - 9);
    const y0 = 9, y1 = 32, y2 = 57;
    const centerAt = (y) => {
      const t = y < y1 ? (y - y0) / (y1 - y0) : (y - y1) / (y2 - y1);
      const a = y < y1 ? shX : elX, b = y < y1 ? elX : haX;
      return Math.round((a + (b - a) * t) / 2) * 2;   // 2px stair steps
    };
    for (let y = y0 - 1; y <= y2; y++) {              // ink pass, capped ends
      const c = centerAt(Math.min(Math.max(y, y0), y2 - 1));
      const w = (y > y1 - 4 && y < y1 + 4) ? 12 : 11; // a little elbow
      PIX.rect(ctx, c - (w >> 1), y, w, 1, P.K);
    }
    for (let y = y0; y < y2; y++) {                   // suit pass + shading
      const c = centerAt(y);
      const w = (y > y1 - 4 && y < y1 + 4) ? 10 : 9;
      PIX.rect(ctx, c - (w >> 1), y, w, 1, suit);
      PIX.rect(ctx, c + (sgn < 0 ? -(w >> 1) : (w >> 1) - 2), y, 2, 1, 'rgba(0,0,0,.25)');
      if (y === y0 + 1 || y === y0 + 2) PIX.rect(ctx, c - (w >> 1), y, w, 1, 'rgba(255,255,255,.07)');
    }
    /* cuff peeking at the wrist */
    const wc = centerAt(y2 - 1);
    PIX.rect(ctx, wc - 5, y2 - 3, 10, 4, P.K);
    PIX.rect(ctx, wc - 4, y2 - 3, 8, 3, shirt);
  });

  /* vest / tie / bowtie on top */
  if (d.vest) {
    [[-1], [1]].forEach(([s]) => {
      for (let y = 6; y < 36; y++) {
        PIX.rect(ctx, cx + s * 9 - (s < 0 ? 4 : 0), y, 5, 1, P.d);
      }
      PIX.rect(ctx, cx + s * 9 - (s < 0 ? 5 : 0), 6, 1, 30, P.K);
    });
    PIX.rect(ctx, cx - 1, 12, 2, 2, P.G); PIX.rect(ctx, cx - 1, 20, 2, 2, P.G);
    for (let i = 0; i < 8; i++) {
      PIX.rect(ctx, cx + 6 + i, 26 + ((i * i) >> 2), 1, 1, P.G); // watch chain sag
    }
  }
  if (d.tie) {
    const tc = P[d.tie] === undefined ? P.d : P[d.tie];
    PIX.rect(ctx, cx - 3, 6, 6, 4, P.K); PIX.rect(ctx, cx - 2, 7, 4, 3, tc);   // knot
    PIX.rect(ctx, cx - 2, 10, 4, 14, tc);
    PIX.rect(ctx, cx - 1, 24, 2, 3, tc);                                       // tip
    PIX.rect(ctx, cx - 2, 14, 1, 8, 'rgba(0,0,0,.3)');
  }
  if (d.bowtie) {
    const bc = P[d.bowtie] || P.d;
    PIX.rect(ctx, cx - 8, 3, 6, 6, P.K); PIX.rect(ctx, cx + 2, 3, 6, 6, P.K);
    PIX.rect(ctx, cx - 7, 4, 5, 4, bc); PIX.rect(ctx, cx + 3, 4, 5, 4, bc);
    PIX.rect(ctx, cx - 2, 4, 4, 4, P.K); PIX.rect(ctx, cx - 1, 5, 2, 2, bc);
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
