'use strict';
/* ============================================================
   SHELL & DEBT — data.js
   All content: shells, charms, bosses, roulette fates,
   chickens, flavor text.
   ============================================================ */

const OUTCOMES = ['FIRE', 'DUD', 'JAM', 'BACKFIRE'];

const OUTCOME_META = {
  FIRE:     { icon: '🔥', color: 'var(--fire)',     verb: 'It fires.' },
  DUD:      { icon: '⚪', color: 'var(--dud)',      verb: 'A dull click. Nothing.' },
  JAM:      { icon: '⚙️', color: 'var(--jam)',      verb: 'The mechanism seizes.' },
  BACKFIRE: { icon: '💥', color: 'var(--backfire)', verb: 'It kicks back at YOU.' },
};

/* ------------------------------------------------------------
   SHELLS
   w: outcome weights (relative). base: payout base value.
   rarity: common / uncommon / rare / legendary  (slot & jar pools)
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
    desc: 'All bark, no bite. Reliable combo fuel for DUD callers.',
  },
  feather: {
    id: 'feather', name: 'Feather Shell', icon: '🐔', rarity: 'common', base: 16,
    w: { FIRE: 10, DUD: 70, JAM: 15, BACKFIRE: 5 },
    desc: 'Packed with down. When it resolves: +1 pull this round.',
    special: 'plus_pull',
  },
  buck: {
    id: 'buck', name: 'Shotgun Shell', icon: '🟠', rarity: 'uncommon', base: 34,
    w: { FIRE: 78, DUD: 6, JAM: 10, BACKFIRE: 6 },
    desc: 'A fistful of thunder. Called FIRE grows your streak by 2.',
    special: 'streak2_fire',
  },
  rust: {
    id: 'rust', name: 'Rust Shell', icon: '🟤', rarity: 'uncommon', base: 24,
    w: { FIRE: 20, DUD: 20, JAM: 55, BACKFIRE: 5 },
    desc: 'Corroded to the core. Called JAM: +2 Sleight.',
    special: 'jam_sleight',
  },
  gilded: {
    id: 'gilded', name: 'Gilded Shell', icon: '💰', rarity: 'uncommon', base: 20,
    w: { FIRE: 55, DUD: 25, JAM: 15, BACKFIRE: 5 },
    desc: 'Casing of casino gold. Any correct call on it: +4 chips.',
    special: 'chips4',
  },
  twin: {
    id: 'twin', name: 'Twin Shell', icon: '👯', rarity: 'uncommon', base: 14,
    w: { FIRE: 60, DUD: 25, JAM: 10, BACKFIRE: 5 },
    desc: 'Two loads in one casing. Correct calls pay double and grow the streak by 2.',
    special: 'twin',
  },
  glass: {
    id: 'glass', name: 'Glass Shell', icon: '🔮', rarity: 'uncommon', base: 30,
    w: { FIRE: 45, DUD: 35, JAM: 10, BACKFIRE: 10 },
    desc: 'Transparent — always revealed in the chamber. Shatters forever after resolving.',
    special: 'glass',
  },
  web: {
    id: 'web', name: 'Web Shell', icon: '🕸️', rarity: 'rare', base: 28,
    w: { FIRE: 25, DUD: 25, JAM: 25, BACKFIRE: 25 },
    desc: 'Spun by something patient. The NEXT shell copies whatever this one does.',
    special: 'web',
  },
  echo: {
    id: 'echo', name: 'Echo Shell', icon: '🔁', rarity: 'rare', base: 20,
    w: { FIRE: 25, DUD: 45, JAM: 20, BACKFIRE: 10 },
    desc: 'Hollow and haunted. Resolves as the PREVIOUS outcome this round.',
    special: 'echo',
  },
  smoke: {
    id: 'smoke', name: 'Smoke Shell', icon: '🌫️', rarity: 'rare', base: 24,
    w: { FIRE: 35, DUD: 35, JAM: 20, BACKFIRE: 10 },
    desc: 'The house can\'t see through it either. After it resolves, your next payout ×1.5.',
    special: 'smoke',
  },
  snake: {
    id: 'snake', name: 'Snake Eyes Shell', icon: '🎲', rarity: 'rare', base: 38,
    w: { FIRE: 48, DUD: 2, JAM: 2, BACKFIRE: 48 },
    desc: 'A coin flip with teeth. Fires big or bites back — almost nothing between.',
  },
  cursed: {
    id: 'cursed', name: 'Cursed Shell', icon: '💀', rarity: 'rare', base: 44,
    w: { FIRE: 10, DUD: 10, JAM: 10, BACKFIRE: 70 },
    desc: 'It hums when you hold it. Uncalled BACKFIRE from this shell costs 2 Nerve.',
    special: 'cursed',
  },
  magnet: {
    id: 'magnet', name: 'Magnet Shell', icon: '🧲', rarity: 'legendary', base: 22,
    w: { FIRE: 25, DUD: 25, JAM: 25, BACKFIRE: 25 },
    desc: 'It wants to be wanted. 60% chance to become exactly what you called.',
    special: 'magnet',
  },
  dead: {
    id: 'dead', name: "Dead Man's Shell", icon: '⚰️', rarity: 'legendary', base: 70,
    w: { FIRE: 2, DUD: 2, JAM: 2, BACKFIRE: 94 },
    desc: 'It knows your name. Call the BACKFIRE and get rich — or don\'t, and get buried.',
  },
};

const SHELL_POOLS = {
  common:    ['live', 'blank', 'feather'],
  uncommon:  ['buck', 'rust', 'gilded', 'twin', 'glass'],
  rare:      ['web', 'echo', 'smoke', 'snake', 'cursed'],
  legendary: ['magnet', 'dead'],
};

/* ------------------------------------------------------------
   CHARMS (passive artifacts — the "jokers")
   ------------------------------------------------------------ */

const CHARMS = {
  graveDancer: { id: 'graveDancer', name: 'Grave Dancer', icon: '💃', rarity: 'uncommon', price: 26,
    desc: 'Called BACKFIREs pay ×2.' },
  monocle: { id: 'monocle', name: "Cheat's Monocle", icon: '🧐', rarity: 'common', price: 20,
    desc: '+1 Sleight every round.' },
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
  thumb: { id: 'thumb', name: "Dealer's Thumb", icon: '👍', rarity: 'uncommon', price: 28,
    desc: 'Peek costs no Sleight.' },
  ironNerve: { id: 'ironNerve', name: 'Iron Nerve', icon: '🛡️', rarity: 'uncommon', price: 25,
    desc: '+2 max Nerve, and steadies you (heal 2) on purchase.' },
  greed: { id: 'greed', name: 'Compound Greed', icon: '🧮', rarity: 'common', price: 22,
    desc: 'Interest cap raised from +20 to +40 chips.' },
  echoChamber: { id: 'echoChamber', name: 'Echo Chamber', icon: '📢', rarity: 'rare', price: 40,
    desc: 'Streak multiplier grows half again as fast, and deep rides compound at ×1.75.' },
  snakeCharmer: { id: 'snakeCharmer', name: 'Snake Charmer', icon: '🐍', rarity: 'uncommon', price: 30,
    desc: 'Shells showing 40%+ BACKFIRE odds pay ×2 on any correct call.' },
  ashtray: { id: 'ashtray', name: "Pit Boss's Ashtray", icon: '🚬', rarity: 'uncommon', price: 26,
    desc: 'Once per round, an uncalled JAM refunds the pull.' },
  markedCards: { id: 'markedCards', name: 'Marked Cards', icon: '🃏', rarity: 'uncommon', price: 30,
    desc: "Blackjack: the dealer's hole card is revealed." },
  gremlin: { id: 'gremlin', name: 'Slot Gremlin', icon: '👺', rarity: 'common', price: 20,
    desc: 'Slot machine spins cost half.' },
  fateFinger: { id: 'fateFinger', name: "Fate's Finger", icon: '🎡', rarity: 'rare', price: 38,
    desc: 'Roulette deals you a choice of 3 fates instead of one.' },
  allIn: { id: 'allIn', name: 'All-In Amulet', icon: '🔮', rarity: 'rare', price: 42,
    desc: 'While the pot holds 200+, payouts ×2.' },
  secondWind: { id: 'secondWind', name: 'Second Wind', icon: '🫀', rarity: 'rare', price: 45,
    desc: 'Cheat death once: survive the killing blow at 1 Nerve.' },
  counterfeit: { id: 'counterfeit', name: 'Counterfeit Chips', icon: '🪙', rarity: 'common', price: 18,
    desc: '+8 chips after every round.' },
};

const CHARM_RARITY_WEIGHT = { common: 60, uncommon: 32, rare: 8 };
const MAX_CHARMS = 5;

/* ------------------------------------------------------------
   BOSSES (twists on boss antes 3 / 6 / 8, then endless)
   ------------------------------------------------------------ */

const BOSSES = {
  blindfold: { id: 'blindfold', name: 'The Blindfold', icon: '🎭',
    desc: 'All odds hidden. Peeking disabled. Every call pays a flat ×3.' },
  vig: { id: 'vig', name: 'The Vig', icon: '🩸',
    desc: 'The house skims 25% off everything you bank.' },
  spinner: { id: 'spinner', name: 'The Spinner', icon: '🌀',
    desc: 'The chamber re-spins and re-hides after every pull.' },
  croupier: { id: 'croupier', name: 'The Croupier', icon: '🎩',
    desc: 'No banking until your streak reaches 2. Ride or starve.' },
  collector: { id: 'collector', name: 'The Debt Collector', icon: '💼',
    desc: 'Your score bleeds 15 points after every pull.' },
  cage: { id: 'cage', name: 'The Cage', icon: '🔒',
    desc: 'All Sleight actions disabled. Play the hand you\'re dealt.' },
  owner: { id: 'owner', name: 'THE OWNER', icon: '👁️',
    desc: 'All odds hidden (flat ×3 calls) AND the house skims 20% of every bank.' },
};
const BOSS_POOL = ['blindfold', 'vig', 'spinner', 'croupier', 'collector', 'cage'];

/* ------------------------------------------------------------
   ROULETTE FATES — the wheel rewrites the next round
   ------------------------------------------------------------ */

const FATES = {
  fireFever: { id: 'fireFever', color: 'R', num: 7, name: 'Fire Fever', icon: '🔥',
    desc: 'Next round: FIRE payouts ×2.' },
  bloodNight: { id: 'bloodNight', color: 'R', num: 23, name: 'Blood Night', icon: '🩸',
    desc: 'Next round: BACKFIRE odds +15%, but called BACKFIREs pay ×3.' },
  highRoller: { id: 'highRoller', color: 'R', num: 9, name: 'High Roller', icon: '🎩',
    desc: 'Next round: debt +25%, but the round\'s chip reward is doubled.' },
  looseChamber: { id: 'looseChamber', color: 'R', num: 3, name: 'Loose Chamber', icon: '🔧',
    desc: 'Next round: Eject is free and all base payouts +10.' },
  doubleNothing: { id: 'doubleNothing', color: 'R', num: 21, name: 'Double or Nothing', icon: '🎲',
    desc: 'Next round: your FIRST bank counts double.' },
  grease: { id: 'grease', color: 'B', num: 13, name: 'Greased Pins', icon: '🛢️',
    desc: 'Next round: JAM odds +12%, and called JAMs pay ×3.' },
  longTable: { id: 'longTable', color: 'B', num: 4, name: 'The Long Table', icon: '📏',
    desc: 'Next round: +3 pulls.' },
  coldDeck: { id: 'coldDeck', color: 'B', num: 17, name: 'Cold Deck', icon: '🧊',
    desc: 'Next round: every shell is loaded face-up. Perfect information.' },
  houseEyes: { id: 'houseEyes', color: 'B', num: 11, name: 'House Eyes', icon: '👀',
    desc: 'Next round: no peeking, but all payouts ×1.25.' },
  blanksParty: { id: 'blanksParty', color: 'B', num: 26, name: "Blanks' Party", icon: '🎉',
    desc: 'Next round: DUD payouts ×2.' },
  zeroHour: { id: 'zeroHour', color: 'G', num: 0, name: 'Zero Hour', icon: '🌑',
    desc: 'Next round: debt −35%, payouts ×1.5 — but Nerve damage is DOUBLED.' },
  houseBlinks: { id: 'houseBlinks', color: 'G', num: 100, name: 'The House Blinks', icon: '😉',
    desc: 'Next round: the boss twist is cancelled. If there is none, debt −20%.' },
};

/* ------------------------------------------------------------
   CHICKENS
   ------------------------------------------------------------ */

const CHICKENS = [
  { name: 'Clucktavius', icon: '🐓', flavor: 'a veteran with a thousand-yard stare' },
  { name: 'Sir Pecksalot', icon: '🐔', flavor: 'nobility, allegedly' },
  { name: 'Henrietta Vane', icon: '🐔', flavor: 'runs on spite alone' },
  { name: 'Nugget', icon: '🐤', flavor: 'has everything to prove' },
  { name: 'Bawk Vega', icon: '🐔', flavor: 'plays it too cool' },
  { name: 'Feathers McGraw', icon: '🐧', flavor: 'is... probably a chicken' },
  { name: 'Omelette Danger', icon: '🐣', flavor: 'born yesterday, literally' },
  { name: 'The Colonel\'s Bane', icon: '🐓', flavor: 'wanted in eleven counties' },
];

/* ------------------------------------------------------------
   FLAVOR TEXT
   ------------------------------------------------------------ */

const FLAVOR = {
  hit: [
    'The dealer\'s smile thins.',
    'Somewhere upstairs, an accountant weeps.',
    'The table holds its breath.',
    'Called it clean.',
    'The house pretends not to notice.',
    'Chips whisper across the felt.',
  ],
  miss: [
    'The dealer exhales smoke. "Shame."',
    'The pot evaporates like it was never yours. It wasn\'t.',
    'The house always remembers.',
    'A cold laugh from the cage.',
    'Wrong. The felt drinks your pot.',
  ],
  backfireHurt: [
    'It bites the hand that pulls.',
    'You taste copper and bad decisions.',
    'The chamber laughs first.',
    'Your hands won\'t stop shaking.',
  ],
  bank: [
    'Banked. The house grits its teeth.',
    'You slide the pot off the table.',
    'Cash it before it curses you.',
  ],
  roundWin: [
    'The debt is paid. For now.',
    'The dealer nods you through the velvet rope.',
    'Your marker is torn up. A new one is written.',
  ],
  bigWin: [
    'THE TABLE GOES QUIET.',
    'Pit bosses gather like crows.',
    'Someone unplugs a security camera.',
  ],
};

/* Standard blackjack deck data */
const BJ_SUITS = ['♠', '♥', '♦', '♣'];
const BJ_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/* Slot machine symbols: weight per reel + what 3-of-a-kind pays */
const SLOT_SYMBOLS = [
  { s: '🔥', w: 5 }, { s: '⚪', w: 5 }, { s: '🐔', w: 4 }, { s: '💰', w: 3 },
  { s: '🕸️', w: 2 }, { s: '💀', w: 2 }, { s: '7️⃣', w: 1 },
];
