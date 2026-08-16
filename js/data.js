'use strict';
/* ============================================================
   SHELL & DEBT — data.js
   All content: trinkets, guns, the mob, blinds, economy.
   The game is a duel now — everything here feeds it.
   ============================================================ */

/* ------------------------------------------------------------
   ECONOMY / RUN SHAPE
   ------------------------------------------------------------ */

const ANTES = 8;              // beat the ante-8 boss to clear your marker
const PLAYER_HP = 5;          // base hearts (totem +1, golden gun +1)
const MAX_TRINKETS = 5;
const MAX_ITEMS = 3;          // belt loops: one-shot consumables you loot off corpses

const ECON = {
  start: 6,                   // starting chips
};

/* chips sewn into a corpse (before traits and multipliers) */
function BLIND_PURSE(ante, blind) {
  return [4 + ante, 6 + 2 * ante, 12 + 3 * ante][blind];
}

/* ------------------------------------------------------------
   THE LOOT — no shop. You kill the mark, you go through his
   pockets. The badges give you so long; bribes buy more time.
   After every BOSS corpse, Swamp PD wants protection money —
   can't pay, and they take your marker.
   ------------------------------------------------------------ */

/* ------------------------------------------------------------
   OUT BACK: TIME AND NOISE.

   Two meters, pulling opposite ways. TIME drains the whole while
   you are back there — somebody is going to come looking. NOISE
   spikes every time you put a hand in him and bleeds off if you
   hold still. Rush and the noise brings the law; creep and the
   clock runs out with his boot still on.
   ------------------------------------------------------------ */
const LOOT_TUNING = {
  seconds: 42,                // on the clock when the door shuts
  secondsPerAnte: -2,         // and it gets shorter as you climb
  noiseDecay: 0.115,          // per second, when your hands are still
  noiseGrace: 0.55,           // how quiet the room goes after a bribe
  /* how loud each pocket is to go into */
  noise: {
    hat: 0.16, jacket: 0.24, shirt: 0.22, vest: 0.26,
    hand: 0.20, boot: 0.34, holster: 0.30, tooth: 0.52,
  },
  slitNoise: 0.12,            // the shiv is quiet; that is the point of it
  bribeBase: 3, bribePerAnte: 1, bribeStep: 3, // bribe = base + ante + step*bribesPaid
  trinketChance: [0.5, 0.65, 1.0],             // per blind: odds one pocket hides a card
  itemChance: [0.45, 0.6, 0.9],                // per blind: odds one pocket hides a belt item
};

/* item rarity weights per blind — same shape/order as the trinket table's RW rows */
const ITEM_RW = [[65, 28, 6, 1], [50, 33, 14, 3], [25, 40, 27, 8]];

function HEAT_COST(ante) { return 6 + 6 * ante; } // protection, after each boss

/* ------------------------------------------------------------
   TRAITS — tells you can read across the table, once you've
   learned them (loot a frog that has one). The notebook
   remembers. Rolled onto mooks; bosses have signature sets.
   fx: hp / aggro / chips (corpse money).
   ------------------------------------------------------------ */

const TRAITS = {
  tophat:    { name: 'TOP HAT', hint: 'big hat, deep pockets', chips: 6,
    desc: 'Big hat, deep pockets: his corpse carries +6 chips.' },
  bowler:    { name: 'BOWLER', hint: 'a careful frog', aggro: -0.12,
    desc: 'A careful frog. Slower to point the iron at you.' },
  flatcap:   { name: 'FLAT CAP', hint: 'hungry and mean', aggro: 0.12, chips: -3,
    desc: 'Hungry and mean: quicker to shoot you, lighter pockets (−3 chips).' },
  goldtooth: { name: 'GOLD TOOTH', hint: 'something glints when he grins', chips: 0,
    desc: 'Something glints when he grins. Pliers pay +5 chips at the loot.' },
  rings:     { name: 'RINGS', hint: 'heavy hands', chips: 4,
    desc: 'Heavy hands: the HAND pocket always pays (+4 chips).' },
  scar:      { name: 'SCAR', hint: 'he has done this before', hp: 1,
    desc: 'He has done this before: +1 heart.' },
  patch:     { name: 'EYE PATCH', hint: 'no depth perception, no fear', aggro: 0.15,
    desc: 'No depth perception, no fear: much quicker to shoot you.' },
  sweats:    { name: 'THE SWEATS', hint: 'dripping under the lamp', aggro: -0.15,
    desc: 'Panics under the lamp: would rather point it at himself than at you.' },
  cigar:     { name: 'CIGAR', hint: 'a calm smoke', hp: 1,
    desc: 'Cool head, thick skin: +1 heart.' },
  vest:      { name: 'FANCY VEST', hint: 'buttons and a watch chain', chips: 4,
    desc: 'Buttons and a watch chain: the VEST pocket always pays (+4 chips).' },

  /* ---- newer tells ---- */
  chain:     { name: 'GOLD CHAIN', hint: 'a fat rope of gold at the throat', chips: 7, aggro: 0.05,
    desc: 'He wears the payroll: +7 chips on the corpse, and he likes an audience (a little quicker to shoot you).' },
  loudtie:   { name: 'LOUD TIE', hint: 'a tie you can hear', aggro: 0.1, chips: -2,
    desc: 'All show, no shirt: quicker to point it at you, and his pockets are 2 chips lighter.' },
  braces:    { name: 'BRACES', hint: 'jacket off, braces on', hp: 1, aggro: -0.06,
    desc: 'Settled in for a long sit: +1 heart, and he is in no hurry.' },
  badge:     { name: 'TIN BADGE', hint: 'a badge pinned inside the coat', chips: 9, hot: true,
    desc: 'He was on the pad: +9 chips — but killing a badge brings the badges. ONE fewer free pocket at this corpse.' },
};
const MOOK_TRAIT_POOL = Object.keys(TRAITS);

/* ------------------------------------------------------------
   TAGS — skip a blind and you take a tag instead of a corpse.
   No purse, no pockets, no cards: just the favour. Bosses can
   never be skipped.
   ------------------------------------------------------------ */

const TAGS = {
  purse:  { id: 'purse',  name: 'FAT ENVELOPE', icon: 'ic_chip',
    desc: 'Somebody owed you: +10 chips, right now.' },
  pocket: { id: 'pocket', name: 'INSIDE MAN', icon: 'ic_badge',
    desc: 'A badge owes you a favour: +1 free pocket at the next corpse.' },
  item:   { id: 'item',   name: 'CARE PACKAGE', icon: 'ic_chip',
    desc: 'Left at the bar for you: a free belt item, right now.' },
  nerve:  { id: 'nerve',  name: 'DUTCH COURAGE', icon: 'ic_heart',
    desc: '+1 max heart for the next duel only.' },
  iron:   { id: 'iron',   name: 'GUNRUNNER', icon: 'ic_lock',
    desc: 'A word with the armourer: the next corpse holsters your next gun.' },
};
const TAG_POOL = ['purse', 'pocket', 'item', 'nerve', 'iron'];

const BLIND_NAMES = ['SMALL BLIND', 'BIG BLIND', 'BOSS BLIND'];

/* mook hearts: small blind / big blind opponents */
const MOOK_STEP = [0, 1, 1, 2, 3, 3, 4, 4];
function MOOK_HP(ante, blind) {
  const step = ante <= 8 ? MOOK_STEP[ante - 1] : 3 + (ante - 8);
  return (blind === 0 ? 2 : 3) + step;
}

/* shells per load (before Loaded Scales) */
function LOAD_SIZE(ante, rng) {
  return 3 + (ante >= 3 ? 1 : 0) + (ante >= 6 ? 1 : 0) + U.ri(rng, 0, 1);
}

/* ------------------------------------------------------------
   GUNS — the iron ladder. Bought in the shop, perks stack.
   ------------------------------------------------------------ */

const GUNS = [
  { id: 'snub', name: 'SNUB .38', cost: 0,
    desc: 'Grandpa\'s revolver. It has seen things.' },
  { id: 'colt', name: 'LONG COLT', cost: 12,
    desc: 'A longer barrel finds the gap: your FIRST live hit each duel deals +1.' },
  { id: 'sawn', name: 'SAWN-OFF', cost: 20,
    desc: 'Once a duel [Q]: choke the grip — your next shot deals DOUBLE damage.' },
  { id: 'tommy', name: 'TOMMY GUN', cost: 32,
    desc: 'Once a duel [E]: double tap — your turn doesn\'t pass for one extra shot.' },
  { id: 'golden', name: 'THE GOLDEN GUN', cost: 48,
    desc: 'The Bullfrog\'s own. Payouts ×1.5 and +1 max heart.' },
];
const GUN_ACTIVES = { sawn: 2, tommy: 3 }; // gunIdx needed

/* ------------------------------------------------------------
   TRINKETS — 24 cards, 5 slots. Passives always on;
   actives show a key hint and burn charges.
   active.per: 'duel' | 'reload'
   unlock: { stat, need, hint } — locked until the account stat hits it.
   ------------------------------------------------------------ */

const RARITY_META = {
  common:    { w: 55, label: 'COMMON' },
  uncommon:  { w: 30, label: 'UNCOMMON' },
  rare:      { w: 12, label: 'RARE' },
  legendary: { w: 3,  label: 'LEGENDARY' },
};

const TRINKETS = {
  /* ---- commons (4) ---- */
  cig: { id: 'cig', name: 'CIGARILLO', rarity: 'common', cost: 4,
    active: { per: 'duel' },
    desc: 'Once a duel: a long drag steadies you. Heal 1 heart.',
    glyph: ['.....q..', '....q...', '........', 'uuuuuubO', 'uuuuuubO'] },
  beer: { id: 'beer', name: 'FLAT BEER', rarity: 'common', cost: 4,
    active: { per: 'reload' },
    desc: 'Once a load: rack the chambered shell out, sight unseen.',
    glyph: ['WWWWW...', 'GGGGGSS.', 'GGGGG.S.', 'GGGGG.S.', 'GGGGGSS.', 'KKKKK...'] },
  glass: { id: 'glass', name: 'MONOCLE', rarity: 'common', cost: 4,
    active: { per: 'reload' },
    desc: 'Once a load: peek the shell under the hammer.',
    glyph: ['.KKKK...', 'KGGGGK..', 'KGWWGK..', 'KGGGGK..', '.KKKK.G.', '.....G..'] },
  shill: { id: 'shill', name: 'SHILL CHIP', rarity: 'common', cost: 4,
    desc: 'The house loves a showman: +2 chips every blank you fire at yourself.',
    glyph: ['..RRR...', '.RWWWR..', 'RWRRRWR.', 'RWRWRWR.', 'RWRRRWR.', '.RWWWR..', '..RRR...'] },
  counter: { id: 'counter', name: 'BEAD COUNTER', rarity: 'common', cost: 4,
    desc: 'Keeps the count for you: the LIVE / BLANK tally stays pinned up.',
    glyph: ['KKKKKKK.', 'K.R.R.K.', 'KKKKKKK.', 'K.G.G.K.', 'KKKKKKK.', 'K.W.W.K.', 'KKKKKKK.'] },
  fly: { id: 'fly', name: 'FLY PAPER', rarity: 'common', cost: 4,
    desc: 'Something lands on every dud: +1 chip whenever ANY blank is fired.',
    glyph: ['.WW..WW.', 'WWWKKWWW', '.WKKKKW.', '..KKKK..', '..KKKK..', '...KK...'] },

  /* ---- uncommons (7) ---- */
  cuffs: { id: 'cuffs', name: 'RUSTY CUFFS', rarity: 'uncommon', cost: 7,
    active: { per: 'duel' },
    desc: 'Once a duel: cuff the mark to the chair. He skips his next turn.',
    glyph: ['.SS..SS.', 'S..SS..S', 'S..SS..S', 'S..SS..S', '.SS..SS.'] },
  deadeye: { id: 'deadeye', name: 'DEAD EYE', rarity: 'uncommon', cost: 7,
    desc: 'You see the FIRST shell of every load for what it is.',
    glyph: ['..RRR...', '.R...R..', 'R..W..R.', 'R.WWW.R.', 'R..W..R.', '.R...R..', '..RRR...'] },
  blood: { id: 'blood', name: 'BAD BLOOD', rarity: 'uncommon', cost: 7,
    desc: 'First impressions: your live hits deal +1 while the mark is at full hearts.',
    glyph: ['...R....', '...R....', '..RRR...', '.RRRRR..', '.RRRRR..', '.RRRRR..', '..RRR...'] },
  snake: { id: 'snake', name: 'SNAKE OIL', rarity: 'uncommon', cost: 7,
    desc: 'Swallow the pain, spit it back: after you take a live hit, your next live hit deals +1.',
    glyph: ['.FFFF...', 'F....F..', '......F.', '...FFF..', '..F.....', '.FFFFFF.', '......R.'] },
  marked: { id: 'marked', name: 'MARKED CARD', rarity: 'uncommon', cost: 7,
    desc: 'You know the badge: the FIRST bribe at every corpse is free.',
    glyph: ['KKKKK...', 'KWWWK...', 'KWGWK...', 'KWWWK...', 'KWGWK...', 'KWWWK...', 'KKKKK...'] },
  glove: { id: 'glove', name: "CROUPIER'S GLOVE", rarity: 'uncommon', cost: 7,
    desc: 'A firm handshake with the law: bribes cost 2 less (min 1).',
    glyph: ['..WWW...', '.WWWWW..', '.WWWWW..', 'WWWWWWW.', '.WWWWW..', '.WWWW...', '..WW....'] },
  feather: { id: 'feather', name: 'FEATHER FAN', rarity: 'uncommon', cost: 7,
    desc: 'Play it cool: every self-blank adds +10% to the corpse\'s chips.',
    glyph: ['.....W..', '....WW..', '...WWW..', '..WWW...', '.WWW....', '.WW.....', '.W......'] },

  /* ---- rares (7) ---- */
  rosary: { id: 'rosary', name: 'ROSARY', rarity: 'rare', cost: 10,
    desc: 'Once a run, the killing shot leaves you at 1 heart instead. Then it crumbles.',
    unlock: { stat: 'deaths', need: 1, hint: 'die at the table once' },
    glyph: ['..GGG...', '.G...G..', '.G...G..', '..GGG...', '...W....', '..WWW...', '...W....', '...W....'] },
  scales: { id: 'scales', name: 'LOADED SCALES', rarity: 'rare', cost: 10,
    desc: 'A thumb on the balance: every load gets ONE extra blank.',
    glyph: ['...S....', '.SSSSS..', 'S..S..S.', 'SS.S.SS.', '...S....', '...S....', '..SSS...'] },
  mirror: { id: 'mirror', name: 'MIRROR SHARD', rarity: 'rare', cost: 10,
    active: { per: 'duel' },
    desc: 'Once a duel: hold it to the chamber — the shell under the hammer FLIPS.',
    unlock: { stat: 'bestAnte', need: 3, hint: 'clear ante 3' },
    glyph: ['L.......', 'LL......', 'LWL.....', 'LWLL....', 'LLLLL...', 'LLLLLL..'] },
  totem: { id: 'totem', name: 'TOAD TOTEM', rarity: 'rare', cost: 10,
    desc: 'An old god with your face: +1 max heart.',
    glyph: ['.F...F..', 'FFF.FFF.', 'FKF.FKF.', 'FFFFFFF.', 'FFFFFFF.', '.FFFFF..', '.F...F..'] },
  watch: { id: 'watch', name: 'POCKET WATCH', rarity: 'rare', cost: 10,
    desc: 'Time is a flat cylinder: your once-a-load trinkets work TWICE a load.',
    unlock: { stat: 'activesUsed', need: 15, hint: 'use 15 trinket actives' },
    glyph: ['..GGG...', '.G...G..', 'G..W..G.', 'G..WW.G.', 'G.....G.', '.G...G..', '..GGG...', '...G....'] },
  dirt: { id: 'dirt', name: 'GRAVE DIRT', rarity: 'rare', cost: 10,
    desc: 'You salted the seat: live shells the mark fires at HIMSELF deal +1.',
    unlock: { stat: 'oppSelfKills', need: 1, hint: 'watch a mark do it to himself' },
    glyph: ['.WWWWW..', 'WWWWWWW.', 'WKWWWKW.', 'WWWWWWW.', '.WWKWW..', '.W.W.W..'] },
  clover: { id: 'clover', name: 'SWAMP CLOVER', rarity: 'rare', cost: 10,
    desc: 'Four leaves, one favor: live shells fired AT YOU fizzle to blanks 1 time in 6.',
    unlock: { stat: 'bestAnte', need: 5, hint: 'clear ante 5' },
    glyph: ['.FF.FF..', 'FFFFFFF.', '.FFFFF..', 'FFFFFFF.', 'FF.F.FF.', '...F....', '..F.....'] },

  /* ---- legendaries (4) ---- */
  ring: { id: 'ring', name: 'KINGPIN RING', rarity: 'legendary', cost: 15,
    desc: 'Kiss it: every corpse carries ×1.5 chips.',
    unlock: { stat: 'bestAnte', need: 6, hint: 'clear ante 6' },
    glyph: ['G.G.G.G.', 'GGGGGGG.', 'GRGRGRG.', '.GGGGG..', '.GGGGG..'] },
  gator: { id: 'gator', name: 'GATOR TOOTH', rarity: 'legendary', cost: 15,
    desc: 'Something older than the swamp: your live hits deal +1.',
    unlock: { stat: 'maxDmgOneDuel', need: 6, hint: 'deal 6 damage in a single duel' },
    glyph: ['.WW.....', '.WWW....', '..WWW...', '..WWWW..', '...WWW..', '...WW...', '....W...'] },
  edge: { id: 'edge', name: 'HOUSE EDGE', rarity: 'legendary', cost: 15,
    desc: 'The odds were never fair: every mark sits down with −1 heart.',
    unlock: { stat: 'flawless', need: 3, hint: 'win 3 duels untouched' },
    glyph: ['RRRRRR..', '....RR..', '...RR...', '..RR....', '..RR....', '..RR....'] },
  swarm: { id: 'swarm', name: 'THE SWARM', rarity: 'legendary', cost: 15,
    desc: 'They can smell it on you: corpses carry +2 chips per heart you lost taking them.',
    unlock: { stat: 'clutchWins', need: 1, hint: 'win a duel at your last heart' },
    glyph: ['K..K....', '.KK...K.', '.....KK.', '..K.....', '.KK..K..', '....KK..', 'K.....K.', '.K...KK.'] },

  /* ---- second wave: the belt-item era ---- */
  dice: { id: 'dice', name: 'LOADED DICE', rarity: 'common', cost: 4,
    active: { per: 'reload' },
    desc: 'Once a load: roll the drum over. Same shells, new order — you see what lands under the hammer, and forget the rest.',
    glyph: ['.KKKKKK.', 'KWWWWWWK', 'KWGWWKWK', 'KWWKKWWK', 'KWKWWKWK', 'KWWWWWWK', '.KKKKKK.'] },
  gauze: { id: 'gauze', name: 'RAG TOURNIQUET', rarity: 'common', cost: 4,
    desc: 'The FIRST live shell that hits you each duel deals 1 less.',
    glyph: ['..WWWW..', '.WwwwwW.', 'WwWWWWwW', 'WwWRRWwW', 'WwWWWWwW', '.WwwwwW.', '..WWWW..'] },
  ledger: { id: 'ledger', name: 'THE LEDGER', rarity: 'uncommon', cost: 7,
    desc: 'You keep books on them too: bribes never get more expensive at a corpse.',
    glyph: ['eeeeeeG.', 'eWWWWWG.', 'eWKKKWe.', 'eWWWWWe.', 'eWKKKWe.', 'eWWWWWe.', 'eeeeeee.'] },
  belt: { id: 'belt', name: 'TOOL BELT', rarity: 'uncommon', cost: 7,
    desc: 'One more loop: +1 belt slot for items (4 instead of 3).',
    glyph: ['.KKKKKKK', 'KGGKuuuU', 'KGKKbbbU', 'KGGKuuuU', '.KKKKKKK'] },
  pockets: { id: 'pockets', name: 'DEEP POCKETS', rarity: 'uncommon', cost: 7,
    desc: 'You rifle faster than they walk: +1 free pocket at every corpse before the badges arrive.',
    unlock: { stat: 'looted', need: 40, hint: 'rifle 40 pockets' },
    glyph: ['..GG.G..', 'ttttttt.', 'tTTTTTt.', 'tTTTTTt.', '.tTTTt..', '..ttt...'] },
  shiv: { id: 'shiv', name: 'RUSTY SHIV', rarity: 'rare', cost: 10,
    active: { per: 'duel' },
    desc: 'Once a duel: under the table, no shell spent — 1 damage and your turn stays yours.',
    unlock: { stat: 'duelsWon', need: 20, hint: 'win 20 duels' },
    glyph: ['.....SS.', '....SSs.', '...SSs..', '..SSs...', '.uub....', 'uKKb....', 'uub.....'] },
  nail: { id: 'nail', name: 'COFFIN NAIL', rarity: 'rare', cost: 10,
    desc: 'Nothing left to lose: while you are at 1 heart, your live hits deal +2.',
    unlock: { stat: 'clutchWins', need: 3, hint: 'win 3 duels at your last heart' },
    glyph: ['SSSSSS..', 'sSSSSs..', '..SS....', '..Sb....', '..bS....', '..SS....', '..ss....', '..K.....'] },
  contract: { id: 'contract', name: 'THE CONTRACT', rarity: 'legendary', cost: 15,
    desc: 'Signed in somebody\'s blood: every corpse carries an ITEM, guaranteed.',
    unlock: { stat: 'bossKills', need: 8, hint: 'kill 8 bosses' },
    glyph: ['wWWWWWw.', 'WKKKKKW.', 'WWWWWWW.', 'WKKKKKW.', 'WWWWWWW.', 'WKKKKKW.', 'wWWdddW.', '...dRd..'] },
};

/* ------------------------------------------------------------
   ITEMS — one-shot consumables, 3 belt loops. Trinkets are
   who you are; items are what you do RIGHT NOW. Looted off
   corpses like cards, burned on use.
   use: 'duel'  — only mid-duel, on your turn
        'loot'  — only while going through his pockets
        'any'   — either phase
   ------------------------------------------------------------ */

const ITEMS = {
  whiskey: { id: 'whiskey', name: 'BAD WHISKEY', rarity: 'common', use: 'duel',
    desc: 'Drain it: heal 2 hearts (never above your max).',
    glyph: ['..KKK...', '..bBb...', '..bBb...', '.KBBBK..', '.bBBBb..', '.bWWWb..', '.bBBBb..', '.KKKKK..'] },

  pliers: { id: 'pliers', name: 'PLIERS', rarity: 'common', use: 'any',
    desc: 'In a duel: you see the LAST shell of the load. At a corpse: yank the GOLD TOOTH free — the badges do not count it.',
    glyph: ['SS...SS.', '.SS.SS..', '..SSS...', '...S....', '..sSs...', '.t...t..', 't.....t.', 'T.....T.'] },

  coinFlip: { id: 'coinFlip', name: 'TWO-HEAD COIN', rarity: 'common', use: 'duel',
    desc: 'Call it in the air: heads heal 1 heart, tails cost 1 (never your last). Either way the table pays you +6 chips.',
    glyph: ['.W....W.', '..GGGG..', '.GhGGhG.', '.GGKKGG.', '.GhGGhG.', '..GGGG..', '.W....W.'] },

  spareBlank: { id: 'spareBlank', name: 'SPARE BLANK', rarity: 'uncommon', use: 'duel',
    desc: 'Thumb an extra BLANK into the drum, somewhere you have not reached. The count goes up.',
    glyph: ['.wwww...', '.wWWw.W.', '.wWWwWWW', '.wWWw.W.', '.qqqq...', '.GBBG...', '.hGGh...'] },

  spareLive: { id: 'spareLive', name: 'SPARE LIVE', rarity: 'uncommon', use: 'duel',
    desc: 'Thumb an extra LIVE into the drum, somewhere you have not reached. Sweetens the gun before you hand it over.',
    glyph: ['.rrrr...', '.rRRr.W.', '.rRRrWWW', '.rRRr.W.', '.dddd...', '.GBBG...', '.hGGh...'] },

  brassKnuckle: { id: 'brassKnuckle', name: 'BRASS KNUCKLES', rarity: 'uncommon', use: 'duel',
    desc: 'No shell, no drum, no turn lost: deal 1 damage across the table right now.',
    glyph: ['.GGGGGG.', 'GKGKGKGK', 'GKGKGKGK', 'GGGGGGGG', '.gggggg.', '..hhhh..'] },

  fileFolder: { id: 'fileFolder', name: 'FILE FOLDER', rarity: 'uncommon', use: 'loot',
    desc: 'Hand the badges somebody else\'s paperwork: the heat at this corpse clears for free — no bribe, no chips.',
    glyph: ['..WWWW..', 'BBWWWWW.', 'BBBBBBBB', 'BBBBBBBb', 'bBBBBBBb', 'bbbbbbbb'] },

  hollowPoint: { id: 'hollowPoint', name: 'HOLLOW POINT', rarity: 'rare', use: 'duel',
    desc: 'Score the tip: the next LIVE shell you put in the mark deals +2.',
    glyph: ['..SS....', '.SKKS...', '.SSSS...', '.SSSS...', '.gGGg...', '.gGGg...', '.hGGh...', '.hhhh...'] },

  smokeBomb: { id: 'smokeBomb', name: 'SMOKE BOMB', rarity: 'rare', use: 'duel',
    desc: 'Kick it under the table: the mark\'s next shot AT YOU misses entirely, live or not.',
    glyph: ['.....oO.', '.qq..u..', 'qqqq.u..', '.ttttt..', 'tSttttT.', 'ttttttT.', 'tttttTT.', '.tttTT..'] },

  shiv: { id: 'shiv', name: 'THE SHIV', rarity: 'uncommon', use: 'loot',
    desc: 'Arm it, then go back into a pocket you have already emptied and slit the lining. Whatever fell through is yours, and the badges never see you do it.',
    glyph: ['......SM', '.....SS.', '....SS..', '...SS...', '..SS....', '.buub...', 'bBBBb...', '.KKK....'] },

  loupe: { id: 'loupe', name: 'JEWELLER\'S LOUPE', rarity: 'rare', use: 'loot',
    desc: 'Screw it into your eye: every bulge on him shows at once, and you get one more pocket before the badges start counting.',
    glyph: ['..hhhh..', '.hLLLLh.', 'hLWWLLLh', 'hLWLLLLh', 'hLLLLLLh', '.hLLLLh.', '..hhhh..', '...KK...'] },

  lucky1: { id: 'lucky1', name: "SAINT'S MEDAL", rarity: 'legendary', use: 'duel',
    desc: 'Kiss it once: the shell under the hammer BECOMES a blank. The count knows.',
    glyph: ['.dd.dd..', '.dd.dd..', '..MMM...', '.MMWMM..', '.MWWWM..', '.MMWMM..', '..MMM...'] },
};

const ITEM_IDS = Object.keys(ITEMS);

/* can this item legally be reached for in this phase? */
function ITEM_PHASE_OK(id, phase) {
  const it = ITEMS[id];
  if (!it) return false;
  return it.use === 'any' || it.use === (phase === 'loot' ? 'loot' : 'duel');
}

/* ------------------------------------------------------------
   THE MOB — one boss per ante, in a fixed order. Each twists
   the duel. id doubles as the FROG_DEFS portrait key.
   ------------------------------------------------------------ */

const BOSSES = [
  { id: 'croupier', traits: ['bowler'], name: 'CROAKER', hp: 2, aggro: 0.42,
    rule: 'SWALLOWS BLANKS',
    desc: 'House croupier. Blanks you fire at him HEAL him 1 — aim like you mean it.' },
  { id: 'blindfold', traits: ['scar'], name: 'BLIND NEWT', hp: 5, aggro: 0.5,
    rule: 'PLAYS IT BLIND',
    desc: 'He can\'t see the load. Now neither can you: LIVE / BLANK counts stay hidden.' },
  { id: 'collector', traits: ['vest', 'goldtooth'], name: 'TAXTOAD TONY', hp: 6, aggro: 0.5,
    rule: 'CHARGES THE SEAT',
    desc: 'The vig runs while you sit: every trigger pull YOU take costs 1 chip.' },
  { id: 'spinner', traits: ['sweats'], name: 'DIZZY SAL', hp: 6, aggro: null, // null = coin-flip brain
    rule: 'NEVER SITS STILL',
    desc: 'The drum re-shuffles after EVERY shot. Peeks don\'t survive him. Neither does math.' },
  { id: 'lily', traits: ['rings'], name: 'SLICK LILY', hp: 7, aggro: 0.6,
    rule: 'DISARMING',
    desc: 'She already charmed your iron: your GUN tricks are locked this duel.' },
  { id: 'cage', traits: ['patch'], name: 'WARDEN WART', hp: 7, aggro: 0.55,
    rule: 'NO TOYS IN THE YARD',
    desc: 'Everything on the table stays on the table: trinket ACTIVES are locked this duel.' },
  { id: 'vig', traits: ['tophat', 'rings', 'cigar'], name: 'DON BUFO', hp: 9, aggro: 0.5,
    rule: 'TOO FAT TO FALL',
    desc: 'Nine hearts of blubber. There is no trick. Start shooting.' },
  { id: 'owner', traits: ['tophat', 'goldtooth', 'rings', 'scar'], name: 'THE BULLFROG', hp: 9, aggro: 0.65,
    rule: 'THE DEBT HIMSELF',
    desc: 'The first time he dies, he gets back up — and hits for 2 once he\'s angry.' },
];

/* small/big blind opponents — procedural mooks */
const MOOK_NAMES = ['TAD', 'WEBS', 'BENNY', 'SPOTS', 'HOPPER', 'MUDGE', 'LOU', 'FLIP', 'GILLS', 'DIP',
  'SKEETER', 'CROAK', 'PUDDLE', 'WEEDY', 'NIPPER', 'SLIMEY PETE', 'BUG EYE', 'REEDS', 'TOECAP',
  'LITTLE MARSH', 'DUCKWEED', 'SPAWN', 'MOSSY', 'TWO TOES', 'WHISTLER', 'SOGGY AL'];
const CAPO_NAMES = ['POCKETS', 'KNUCKLES', 'THE EEL', 'BIG MO', 'SLICK', 'RIBBIT ROY', 'CUE BALL', 'FAT TONGUE',
  'THE HERON', 'MARBLE JOE', 'SIX-FINGER SID', 'MAMA GREEN', 'THE UNDERTAKER', 'BOG STANLEY',
  'PENNY WEBB', 'THE ACCOUNTANT', 'LEFTY LILYPAD', 'GRAVEL GUS', 'THREE-CARD TESS', 'IRON JAW'];

/* ------------------------------------------------------------
   TAUNTS — one line, muttered across the felt. Keyed by
   situation; the scene can float one in a speech bubble.
     afterSelfBlank    he pointed it at himself and got a dud
     afterHittingYou   he just put a live one in you
     afterYouSelfBlank you pointed it at yourself and got a dud
     lowHearts         he is down to his last heart
     reload            the drum was just refilled
   ------------------------------------------------------------ */

const TAUNTS = {
  afterSelfBlank: [
    'Empty. Like your marker.',
    'See? Nothing to it.',
    'I do this sober.',
    'Still my turn, friend.',
    'The swamp likes me today.',
    'Warm one. Yours will not be.',
  ],
  afterHittingYou: [
    'That is the vig.',
    'Bleed quieter, would you.',
    'That is one heart of interest.',
    'You are into me for more than chips now.',
    'Hold still, it goes faster.',
    'One down. You have got, what, a few?',
  ],
  afterYouSelfBlank: [
    'Lucky. Do it again.',
    'You are enjoying that too much.',
    'Big man. Big empty gun.',
    'Keep going, I can wait.',
    'That was the easy one.',
  ],
  lowHearts: [
    'Last one. Make it count for nothing.',
    'I have been shot in nicer rooms.',
    'You would not shoot a family frog.',
    'Take the chips. Take them and go.',
    'I got tadpoles, you know.',
  ],
  reload: [
    'Fresh load. New arithmetic.',
    'Count them again, I dare you.',
    'House loads it. House knows it.',
    'Cylinder is full. So is your marker.',
    'Somebody wipe the grip.',
  ],
};

/* pick a line; rng is U.mulberry32-style (0..1) */
function TAUNT(rng, kind) {
  const pool = TAUNTS[kind];
  if (!pool || !pool.length) return null;
  return pool[Math.floor(rng() * pool.length)];
}

/* mook portrait ingredients (fed to the frog rig) */
const MOOK_SKINS = [
  ['F', 'f', 'e'], ['B', 'b', 'u'], ['O', 'o', 'o'], ['N', 'n', 'n'],
  ['w', 'q', 'q'], ['s', 't', 't'], ['f', 'e', 'e'], ['V', 'v', 'X'],
];
const MOOK_SUITS = ['T', 't', 'k', 'u'];

/* ------------------------------------------------------------
   KEYBINDS — shown in help and the hint bar.
   ------------------------------------------------------------ */

const BINDS = [
  ['A', 'aim at yourself'],
  ['D', 'aim at the mark'],
  ['SPACE', 'pull the trigger'],
  ['1–5', 'use a trinket'],
  ['6–8', 'use a belt item'],
  ['Q', 'saw grip (SAWN-OFF)'],
  ['E', 'double tap (TOMMY GUN)'],
  ['R', 'bribe the badges (looting)'],
  ['ENTER', 'walk out / next blind'],
  ['M', 'mute'],
  ['H', 'house rules'],
];
