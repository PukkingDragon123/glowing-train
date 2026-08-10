'use strict';
/* ============================================================
   SHELL & DEBT — data.js
   All content: shells, charms, the frog mob, guns, fates.
   Trimmed to the good stuff — fewer, more distinct pieces.
   ============================================================ */

const OUTCOMES = ['FIRE', 'DUD', 'JAM', 'BACKFIRE'];

const OUTCOME_META = {
  FIRE:     { icon: '🔥', verb: 'It fires.' },
  DUD:      { icon: '⚪', verb: 'A dull click. Nothing.' },
  JAM:      { icon: '⚙️', verb: 'The mechanism seizes.' },
  BACKFIRE: { icon: '💥', verb: 'It kicks back at YOU.' },
};

/* ------------------------------------------------------------
   SHELLS — 11 types, each with one clear job.
   w: outcome weights. base: payout value.
   ------------------------------------------------------------ */

const SHELLS = {
  live: {
    id: 'live', name: 'Live Shell', icon: '🔴', rarity: 'common', base: 18,
    w: { FIRE: 70, DUD: 18, JAM: 8, BACKFIRE: 4 },
    desc: 'Standard issue. Mostly does what it says on the brass.',
  },
  blank: {
    id: 'blank', name: 'Blank Shell', icon: '⚪', rarity: 'common', base: 15,
    w: { FIRE: 6, DUD: 80, JAM: 12, BACKFIRE: 2 },
    desc: 'All bark, no bite. Reliable streak fuel for DUD callers.',
  },
  feather: {
    id: 'feather', name: 'Feather Shell', icon: '🐔', rarity: 'common', base: 16,
    w: { FIRE: 10, DUD: 70, JAM: 15, BACKFIRE: 5 },
    desc: 'Packed with down. When it resolves: +1 pull this round.',
  },
  buck: {
    id: 'buck', name: 'Shotgun Shell', icon: '🟠', rarity: 'uncommon', base: 34,
    w: { FIRE: 78, DUD: 6, JAM: 10, BACKFIRE: 6 },
    desc: 'A fistful of thunder. Called FIRE grows your streak by 2.',
  },
  rust: {
    id: 'rust', name: 'Rust Shell', icon: '🟤', rarity: 'uncommon', base: 24,
    w: { FIRE: 20, DUD: 20, JAM: 55, BACKFIRE: 5 },
    desc: 'Corroded to the core. Called JAM: +1 Trick.',
  },
  gilded: {
    id: 'gilded', name: 'Gilded Shell', icon: '💰', rarity: 'uncommon', base: 20,
    w: { FIRE: 55, DUD: 25, JAM: 15, BACKFIRE: 5 },
    desc: 'Casing of casino gold. Any correct call on it: +4 chips.',
  },
  glass: {
    id: 'glass', name: 'Glass Shell', icon: '🔮', rarity: 'uncommon', base: 30,
    w: { FIRE: 45, DUD: 35, JAM: 10, BACKFIRE: 10 },
    desc: 'Transparent — always revealed in the chamber. Shatters forever after resolving.',
  },
  web: {
    id: 'web', name: 'Web Shell', icon: '🕸️', rarity: 'rare', base: 28,
    w: { FIRE: 25, DUD: 25, JAM: 25, BACKFIRE: 25 },
    desc: 'Spun by something patient. The NEXT shell copies whatever this one does.',
  },
  cursed: {
    id: 'cursed', name: 'Cursed Shell', icon: '💀', rarity: 'rare', base: 44,
    w: { FIRE: 10, DUD: 10, JAM: 10, BACKFIRE: 70 },
    desc: 'It hums when you hold it. Uncalled BACKFIRE from this shell costs 2 Nerve.',
  },
  magnet: {
    id: 'magnet', name: 'Magnet Shell', icon: '🧲', rarity: 'legendary', base: 22,
    w: { FIRE: 25, DUD: 25, JAM: 25, BACKFIRE: 25 },
    desc: 'It wants to be wanted. 60% chance to become exactly what you called.',
  },
  dead: {
    id: 'dead', name: "Dead Man's Shell", icon: '⚰️', rarity: 'legendary', base: 70,
    w: { FIRE: 2, DUD: 2, JAM: 2, BACKFIRE: 94 },
    desc: 'It knows your name. Call the BACKFIRE and get rich — or don\'t, and get buried.',
  },
};

const SHELL_POOLS = {
  common:    ['live', 'blank', 'feather'],
  uncommon:  ['buck', 'rust', 'gilded', 'glass'],
  rare:      ['web', 'cursed'],
  legendary: ['magnet', 'dead'],
};

/* ------------------------------------------------------------
   GUNS — your iron. Bought at the gun case; the house only
   arms regulars, so each one needs total machine plays.
   Perks stack as you climb the ladder.
   ------------------------------------------------------------ */

const GUNS = [
  { id: 'snub', name: 'SNUB .38', cost: 0, req: 0,
    desc: 'Grandpa\'s revolver. It has seen things.' },
  { id: 'colt', name: 'LONG COLT', cost: 30, req: 3,
    desc: 'A longer barrel, a longer reach: all base payouts +6.' },
  { id: 'sawn', name: 'SAWN-OFF', cost: 55, req: 7,
    desc: 'Subtlety is for banks. Called FIRE grows your streak by 1 extra.' },
  { id: 'tommy', name: 'TOMMY GUN', cost: 85, req: 12,
    desc: 'Chicago typewriter. +2 pulls every round.' },
  { id: 'golden', name: 'THE GOLDEN GUN', cost: 130, req: 18,
    desc: 'The Bullfrog\'s own. Every payout ×1.5.' },
];

/* ------------------------------------------------------------
   CHARMS — 12 passive artifacts.
   ------------------------------------------------------------ */

const CHARMS = {
  graveDancer: { id: 'graveDancer', name: 'Grave Dancer', icon: '💃', rarity: 'uncommon', price: 26,
    desc: 'Called BACKFIREs pay ×2.' },
  monocle: { id: 'monocle', name: "Cheat's Monocle", icon: '🧐', rarity: 'common', price: 20,
    desc: '+1 Trick every round.' },
  rabbit: { id: 'rabbit', name: 'Loaded Rabbit', icon: '🐇', rarity: 'rare', price: 36,
    desc: 'The first call each round cannot miss.' },
  spider: { id: 'spider', name: 'Web of Fate', icon: '🕷️', rarity: 'uncommon', price: 24,
    desc: 'After any JAM, your next payout ×3.' },
  horseshoe: { id: 'horseshoe', name: 'Rusty Horseshoe', icon: '🍀', rarity: 'common', price: 18,
    desc: 'DUD payouts get +12 base value.' },
  houseKey: { id: 'houseKey', name: 'House Key', icon: '🗝️', rarity: 'uncommon', price: 24,
    desc: 'Everything in the casino costs 25% less.' },
  whisperer: { id: 'whisperer', name: 'Chicken Whisperer', icon: '🐔', rarity: 'common', price: 20,
    desc: 'Derby wins pay double. Winning birds always drop a Feather Shell.' },
  vampire: { id: 'vampire', name: 'Vampire Chip', icon: '🧛', rarity: 'uncommon', price: 30,
    desc: 'Banking 100+ points heals 1 Nerve (once per round).' },
  ironNerve: { id: 'ironNerve', name: 'Iron Nerve', icon: '🛡️', rarity: 'uncommon', price: 25,
    desc: '+2 max Nerve, and steadies you (heal 2) on purchase.' },
  ashtray: { id: 'ashtray', name: "Pit Boss's Ashtray", icon: '🚬', rarity: 'uncommon', price: 26,
    desc: 'Once per round, an uncalled JAM refunds the pull.' },
  allIn: { id: 'allIn', name: 'All-In Amulet', icon: '🔮', rarity: 'rare', price: 42,
    desc: 'While the pot holds 200+, payouts ×2.' },
  secondWind: { id: 'secondWind', name: 'Second Wind', icon: '🫀', rarity: 'rare', price: 45,
    desc: 'Cheat death once: survive the killing blow at 1 Nerve.' },
};

const CHARM_RARITY_WEIGHT = { common: 60, uncommon: 32, rare: 8 };
const MAX_CHARMS = 5;

/* ------------------------------------------------------------
   THE MOB — boss antes are collection visits from the
   Bullfrog's people. Each twists one rule.
   ------------------------------------------------------------ */

const BOSSES = {
  blindfold: { id: 'blindfold', name: 'BLIND NEWT', icon: '🎭', fat: false,
    desc: 'He can\'t see. Now you can\'t either: all odds hidden, no peeking, every call pays a flat ×3.' },
  vig: { id: 'vig', name: 'DON BUFO', icon: '🩸', fat: true,
    desc: 'The fat man takes his taste: 25% skimmed off everything you bank.' },
  spinner: { id: 'spinner', name: 'DIZZY SAL', icon: '🌀', fat: false,
    desc: 'He never stops twitching. The chamber re-spins and re-hides after every pull.' },
  croupier: { id: 'croupier', name: 'CROAKER', icon: '🎩', fat: false,
    desc: 'House croupier. No banking until your streak reaches 2 — ride or starve.' },
  collector: { id: 'collector', name: 'TAXTOAD TONY', icon: '💼', fat: true,
    desc: 'Every pull, his briefcase eats 15 of your score.' },
  cage: { id: 'cage', name: 'WARDEN WART', icon: '🔒', fat: false,
    desc: 'Nothing up your sleeves — all Tricks disabled this round.' },
  owner: { id: 'owner', name: 'THE BULLFROG', icon: '👁️', fat: true,
    desc: 'The owner himself. All odds hidden (flat ×3 calls) AND 20% skimmed off every bank.' },
};
const BOSS_POOL = ['blindfold', 'vig', 'spinner', 'croupier', 'collector', 'cage'];

/* ------------------------------------------------------------
   ROULETTE FATES — 8 pockets that rewrite the next round.
   ------------------------------------------------------------ */

const FATES = {
  fireFever: { id: 'fireFever', color: 'R', num: 7, name: 'Fire Fever', icon: '🔥',
    desc: 'Next round: FIRE payouts ×2.' },
  bloodNight: { id: 'bloodNight', color: 'R', num: 23, name: 'Blood Night', icon: '🩸',
    desc: 'Next round: BACKFIRE odds +15%, but called BACKFIREs pay ×3.' },
  highRoller: { id: 'highRoller', color: 'R', num: 9, name: 'High Roller', icon: '🎩',
    desc: 'Next round: debt +25%, but the round\'s chip reward is doubled.' },
  longTable: { id: 'longTable', color: 'B', num: 4, name: 'The Long Table', icon: '📏',
    desc: 'Next round: +3 pulls.' },
  coldDeck: { id: 'coldDeck', color: 'B', num: 17, name: 'Cold Deck', icon: '🧊',
    desc: 'Next round: every shell is loaded face-up. Perfect information.' },
  blanksParty: { id: 'blanksParty', color: 'B', num: 26, name: "Blanks' Party", icon: '🎉',
    desc: 'Next round: DUD payouts ×2.' },
  zeroHour: { id: 'zeroHour', color: 'G', num: 0, name: 'Zero Hour', icon: '🌑',
    desc: 'Next round: debt −35%, payouts ×1.5 — but Nerve damage is DOUBLED.' },
  houseBlinks: { id: 'houseBlinks', color: 'G', num: 100, name: 'The House Blinks', icon: '😉',
    desc: 'Next round: the boss stays home. If none was coming, debt −20%.' },
};

/* ------------------------------------------------------------
   STATION UNLOCKS — the floor opens up as you go deeper.
   ------------------------------------------------------------ */

const UNLOCKS = { slots: 1, pawn: 1, guncase: 2, bj: 2, roulette: 3, derby: 4 };

/* ------------------------------------------------------------
   CHICKENS
   ------------------------------------------------------------ */

const CHICKENS = [
  { name: 'Clucktavius', flavor: 'a veteran with a thousand-yard stare' },
  { name: 'Sir Pecksalot', flavor: 'nobility, allegedly' },
  { name: 'Henrietta Vane', flavor: 'runs on spite alone' },
  { name: 'Nugget', flavor: 'has everything to prove' },
  { name: 'Bawk Vega', flavor: 'plays it too cool' },
  { name: 'Feathers McGraw', flavor: 'is... probably a chicken' },
  { name: 'Omelette Danger', flavor: 'born yesterday, literally' },
  { name: "The Colonel's Bane", flavor: 'wanted in eleven counties' },
];

/* Standard blackjack deck data */
const BJ_SUITS = ['♠', '♥', '♦', '♣'];
const BJ_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/* Slot machine symbols: weight per reel */
const SLOT_SYMBOLS = [
  { s: '🔥', w: 5 }, { s: '⚪', w: 5 }, { s: '🐔', w: 4 }, { s: '💰', w: 3 },
  { s: '🕸️', w: 2 }, { s: '💀', w: 2 }, { s: '7️⃣', w: 1 },
];
