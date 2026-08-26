/* ============================================================
   THE CITY.

   Five places, a clock and the weather.

   The case used to happen in one room: you read a file at a bar,
   asked the barman two questions and picked a face. Now the case
   is spread across the city. Every clue is buried in a PROP in a
   PLACE — a drain, a mattress, a till — and the only way to it is
   to drive over there and put your hand in.

   This file owns the world: where the places are, what is in
   them, what time it is, what the sky is doing, and what happens
   when you search something. The rooms themselves are painted in
   places.js; the phone that drives you there is phone.js.
   ============================================================ */

const CITY = (() => {

  /* ---------------------------------------------------------
     THE MAP.

     Five stops plus the precinct. x/y are FroggoMap coordinates
     (0-100 across the city), which is also the order the drive
     cinematic uses to decide how long the trip is.
     --------------------------------------------------------- */
  const PLACES = {
    precinct: {
      id: 'precinct', name: 'LA BRIGADE', sub: 'HOMICIDE, THIRD FLOOR, AFTER HOURS',
      short: 'LA BRIGADE', x: 50, y: 56, icon: 'ic_badge', hub: true,
      blurb: 'YOUR DESK. THE BOARD. THE CAPTAIN.',
    },
    laundry: {
      id: 'laundry', name: 'LAVERIE DU CANAL', sub: 'WHERE THEY FOUND HIM',
      short: 'THE LAVERIE', x: 74, y: 26, icon: 'ic_drum', scene: true,
      blurb: 'THE BODY WAS IN HERE. THE MACHINES ARE STILL WARM.',
    },
    docks: {
      id: 'docks', name: 'QUAI DE LA RAPEE', sub: 'THE RIVER GOES OUT PAST HERE',
      short: 'THE QUAI', x: 80, y: 70, icon: 'ic_anchor', scene: true,
      blurb: 'CRATES NOBODY SIGNED FOR AND A CRANE THAT RUNS AT NIGHT.',
    },
    pawn: {
      id: 'pawn', name: 'MONT-DE-PIETE', sub: 'OPEN LATE, ASKS NOTHING',
      short: 'THE PAWN', x: 62, y: 34, icon: 'ic_ring', scene: true,
      blurb: 'EVERYTHING TAKEN OFF A BODY ENDS UP BEHIND THIS GLASS.',
    },
    diner: {
      id: 'diner', name: 'CAFE DU PONT', sub: 'COFFEE, PASTRY, NO QUESTIONS',
      short: 'THE CAFE', x: 44, y: 44, icon: 'ic_cup', scene: true,
      blurb: 'THE NIGHT SHIFT EATS HERE. SO DOES EVERYBODY ELSE.',
    },
    bar: {
      id: 'bar', name: 'LE MOULIN ROUGE', sub: 'THE CREW DRINKS UNDER THE WINDMILL',
      short: 'THE MOULIN', x: 46, y: 12, icon: 'ic_glass', scene: true,
      blurb: 'IF HE HAS FRIENDS, THEY ARE UNDER THAT WINDMILL TONIGHT.',
    },

    /* ---------------------------------------------------------
       AND THE CITY ITSELF.

       Five places you work and six you cross. The landmarks are
       not decoration: they have things in them to turn over, frogs
       in them to lean on, and they are where the crew does its
       business, because nobody watches you in a crowd.
       --------------------------------------------------------- */
    tower: {
      id: 'tower', name: 'LA TOUR', sub: 'THE CHAMP DE MARS, UNDER ALL OF IT',
      short: 'LA TOUR', x: 20, y: 50, icon: 'ic_tower', scene: true,
      blurb: 'EIGHT THOUSAND TONS OF IRON AND NOBODY LOOKING DOWN.',
    },
    arch: {
      id: 'arch', name: "L'ARC", sub: 'TWELVE AVENUES AND A FLAME',
      short: "L'ARC", x: 24, y: 30, icon: 'ic_arch', scene: true,
      blurb: 'EVERY CAR IN THE CITY GOES ROUND IT AND NONE OF THEM STOP.',
    },
    butte: {
      id: 'butte', name: 'LA BUTTE', sub: 'MONTMARTRE, ABOVE THE WHOLE MESS',
      short: 'LA BUTTE', x: 56, y: 8, icon: 'ic_dome', scene: true,
      blurb: 'PAINTERS, PICKPOCKETS AND THE WHITEST CHURCH IN FRANCE.',
    },
    museum: {
      id: 'museum', name: 'LE MUSEE', sub: 'THE PALACE COURTYARD, AFTER CLOSING',
      short: 'LE MUSEE', x: 48, y: 40, icon: 'ic_glass2', scene: true,
      blurb: 'A GLASS PYRAMID LIT FROM UNDERNEATH AND TWO TIRED GUARDS.',
    },
    catacombs: {
      id: 'catacombs', name: 'LES CATACOMBES', sub: 'SIX MILLION OF THEM, DOWN THERE',
      short: 'THE BONES', x: 40, y: 82, icon: 'ic_skull', scene: true,
      blurb: 'THE ONLY ROOM IN THIS CITY NOBODY HAS EVER BUGGED.',
    },

    /* ---------------------------------------------------------
       AND THE PARTS OF THE CITY YOU HAVE TO EARN.

       A foreign policeman on his first afternoon gets the five
       stops on the file and the streets in between. He does not
       get the Opera, he does not get taken up the hill to the
       cemetery, and nobody drives him under the ring road until
       there is a reason. `lock` is that reason: the number of
       pieces that have to be on the board first.
       --------------------------------------------------------- */
    opera: {
      id: 'opera', name: "L'OPERA", sub: 'THE GRANDEST STAIRCASE IN EUROPE',
      short: "L'OPERA", x: 52, y: 26, icon: 'ic_dome', scene: true,
      lock: 1, lockWhy: 'THE BRIGADE DOES NOT SEND A NEW MAN TO THE OPERA.',
      blurb: 'THE MONEY IN THIS CITY GOES IN THE FRONT. THE REST GOES ROUND THE BACK.',
    },
    pere: {
      id: 'pere', name: 'PERE-LACHAISE', sub: 'A HILL OF DEAD PARISIANS',
      short: 'THE HILL', x: 90, y: 40, icon: 'ic_skull', scene: true,
      lock: 2, lockWhy: 'NOBODY HAS GIVEN YOU A NAME UP THERE YET.',
      blurb: 'THE ONE PLACE IN PARIS WHERE STANDING STILL IS NOT SUSPICIOUS.',
    },
    perif: {
      id: 'perif', name: 'LA ZONE', sub: 'UNDER THE RING ROAD',
      short: 'LA ZONE', x: 14, y: 84, icon: 'ic_anchor', scene: true,
      lock: 4, lockWhy: 'YOU DO NOT KNOW THIS PLACE EXISTS YET.',
      blurb: 'WHERE THE CITY KEEPS THE THINGS IT DOES NOT WANT PHOTOGRAPHED.',
    },
  };

  /* ---------------------------------------------------------
     THE ZONES.

     Eleven pins on a sheet of paper is a list. The same eleven
     inside eight named quarters is a city — and once the plan has
     quarters on it, a locked stop is a locked QUARTER, which is a
     much better thing to be told you cannot go to.

     x/y/w/h are on the same 0-100 grid the pins use.
     --------------------------------------------------------- */
  const ZONES = [
    { id: 'butte', name: 'MONTMARTRE', x: 38, y: 0, w: 30, h: 22,
      places: ['bar', 'butte'], tint: '#c9b795' },
    { id: 'opera', name: "L'OPERA", x: 44, y: 18, w: 20, h: 18,
      places: ['opera'], tint: '#c2ae88' },
    { id: 'marais', name: 'LE MARAIS', x: 58, y: 18, w: 26, h: 24,
      places: ['pawn', 'laundry'], tint: '#c9b795' },
    { id: 'etoile', name: "L'ETOILE", x: 10, y: 18, w: 28, h: 22,
      places: ['arch'], tint: '#c2ae88' },
    { id: 'mars', name: 'CHAMP DE MARS', x: 8, y: 40, w: 28, h: 24,
      places: ['tower'], tint: '#c9b795' },
    { id: 'louvre', name: 'LE LOUVRE', x: 38, y: 32, w: 20, h: 20,
      places: ['museum', 'diner'], tint: '#c2ae88' },
    { id: 'cite', name: "L'ILE", x: 42, y: 48, w: 20, h: 18,
      places: ['precinct'], tint: '#c9b795' },
    { id: 'bercy', name: 'BERCY', x: 68, y: 58, w: 26, h: 24,
      places: ['docks'], tint: '#c2ae88' },
    { id: 'lachaise', name: 'PERE-LACHAISE', x: 80, y: 28, w: 20, h: 24,
      places: ['pere'], tint: '#c9b795' },
    { id: 'parnasse', name: 'MONTPARNASSE', x: 28, y: 70, w: 26, h: 26,
      places: ['catacombs'], tint: '#c2ae88' },
    { id: 'zone', name: 'LA ZONE', x: 4, y: 74, w: 24, h: 24,
      places: ['perif'], tint: '#b8ae94' },
  ];

  const ZONE_OF = {};
  ZONES.forEach(z => z.places.forEach(pl => { ZONE_OF[pl] = z; }));

  const ORDER = ['laundry', 'docks', 'pawn', 'diner', 'bar',
    'tower', 'arch', 'butte', 'museum', 'catacombs',
    'opera', 'pere', 'perif'];

  /* the five you work a case in. The landmarks are where the crew is. */
  const WORK = ['laundry', 'docks', 'pawn', 'diner', 'bar'];

  /* ---------------------------------------------------------
     WHAT THERE IS TO SEARCH.

     The canonical list of props per place. places.js owns where
     each one sits and what it looks like; this owns the fact that
     it exists, so the case can be planted (and the balance harness
     can play a night) without painting a single canvas.
     --------------------------------------------------------- */
  const PROPS = {
    /* THE LAST TWO IN EACH OF THESE ARE DOWNSTAIRS OR UPSTAIRS. A building
       is not one room: the laundry has a cellar the canal comes into and
       the broker sleeps over his own shop, and the case can be buried on
       either floor. */
    laundry: ['drain', 'machine', 'cart', 'outline', 'till', 'sump', 'boiler'],
    docks:   ['crates', 'barrel', 'water', 'shed', 'rope'],
    pawn:    ['case', 'ledger', 'safe', 'shelf', 'cot', 'strongbox'],
    diner:   ['urn', 'booth', 'bin', 'hatch'],
    bar:     ['stool', 'till', 'coats'],
    /* and the city: fewer things, but the ones worth crossing town for */
    tower:      ['gravel', 'stand', 'brazier', 'kiosk'],
    arch:       ['flame', 'wreath', 'cab', 'bench2', 'map'],
    butte:      ['easel', 'steps', 'crate2', 'table'],
    museum:     ['fountain', 'glass', 'crate3', 'door'],
    catacombs:  ['bones', 'niche', 'plaque', 'pool'],
    /* and the three you have to earn */
    opera:      ['steps2', 'bill', 'cab2', 'grate'],
    pere:       ['tomb', 'urn2', 'leaves', 'bench3'],
    perif:      ['roller', 'drum', 'wreck', 'fence'],
  };

  /* ---------------------------------------------------------
     THE CLOCK.

     The night is the budget. Everything you do costs minutes and
     when it runs out the shift is over and the captain wants you
     off the street — you keep everything you found.
     --------------------------------------------------------- */
  const START = 9 * 60;                // 09:00
  const END = 19 * 60;                 // 19:00, same day

  /* A SHIFT IS 600 MINUTES OF DAYLIGHT. It opens at nine in the morning
     and the captain wants you off the street at seven, and in between the
     sky walks from morning through noon into gold and then into dusk — so
     the light is the clock, and the light going orange is the game telling
     you that you are nearly out of afternoon.

     Paris has eleven stops in it and about forty-five things to turn over,
     which is well over a thousand minutes of searching: the day is
     deliberately far too short to do it all. The eyeglass is what makes it
     playable — three minutes to find out whether a thing is worth the
     eighteen — and where you look is still the whole game. */
  const COST = {
    travel: 35, search: 18, ask: 12, talk: 6, job: 45, lineup: 20,
    /* THE GLASS is the cheap move: three minutes to find out whether a
       prop is worth the eighteen that turning it over costs. The city has
       twenty-five things in it and the night has 560 minutes: without a way
       to triage that, a night is nothing but blank drawers. */
    look: 3,
  };

  function reset() {
    G.clock = START;
    G.day = (G.day || 0) + 1;
    G.weather = rollWeather();
    G.searched = {};
    G.jobsDone = {};
    /* the errands are a NIGHT's worth of goodwill, not a run's: whoever
       you did a favour for last night wants something else tonight */
    G.quests = {};
    G.cargo = {};
    G.capAsked = {};
    G.burned = {};
    /* the last-call warnings are per shift: whoever shut on you yesterday
       is going to shut on you again today, and you want telling again */
    G.rang = {};
    G.notes = [];
  }

  /* HOW MUCH DAY IS LEFT.

     The shift used to run over midnight, so this wrapped. It does not any
     more, and the wrap was actively dangerous: overshooting seven in the
     evening rolled the clock the long way round and told the player they
     had twenty-three hours of afternoon in hand. Clamp instead. */
  function minutesLeft() {
    const now = G.clock === undefined ? START : G.clock;
    return Math.max(0, END - now);
  }

  /* minutes past midnight, for anything that wants the raw hour — the
     light, mostly, which is the loudest clock in the game */
  function minutes() {
    return ((G.clock === undefined ? START : G.clock) % (24 * 60) + 24 * 60) % (24 * 60);
  }

  function hhmm() {
    const m = ((G.clock === undefined ? START : G.clock) % (24 * 60) + 24 * 60) % (24 * 60);
    const h = Math.floor(m / 60), mm = m % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  }

  /* THE HOUR. One source of truth for it, and it is DAY: the six bands
     carry the whole palette, so anybody who wants to know what colour it
     is out there asks the light and not the clock. */
  function watch() { return DAY.bandAt(minutes()); }

  function spend(kind, mult) {
    /* ROUNDED, ALWAYS. A half-cost action (a favour, a flight of stairs) used
       to leave a fraction of a minute on the clock, and the corner of the
       screen read 23:41.5 for the rest of the night. */
    const c = Math.round((COST[kind] || 5) * (mult === undefined ? 1 : mult));
    G.clock = Math.round((G.clock === undefined ? START : G.clock)) + c;
    if (UI && UI.syncStory) UI.syncStory();
    lastCall();
    return c;
  }

  /* ---------------------------------------------------------
     LAST CALL.

     The whole afternoon is a question of which door shuts first,
     and the answer used to be buried in a badge on a pin nobody
     was looking at. Now, the first time a stop that matters drops
     under the wire, the phone says so once — and only once, and
     only for the stops tonight's file actually wants.
     --------------------------------------------------------- */
  function lastCall() {
    if (typeof PHONE === 'undefined' || !PHONE.notify) return;
    G.rang = G.rang || {};
    const want = (typeof CASE !== 'undefined' && CASE.stops) ? CASE.stops() : ORDER;
    want.forEach(id => {
      if (G.rang[id] || locked(id)) return;
      const left = untilShut(id);
      if (left === null || left <= 0 || left > 45) return;
      const h = HOURS[id];
      G.rang[id] = 1;
      PHONE.notify({ app: 'map', tone: 'time',
        head: (PLACES[id] ? PLACES[id].short : id) + ' SHUTS IN ' + left + ' MINUTES',
        body: (h && h.who ? h.who : 'WHOEVER IS IN THERE') + ' GOES HOME AND TAKES IT WITH THEM.' });
    });
  }

  /* the shift is over. Still called nightOver everywhere because
     everything in the game calls it that, and renaming it buys nothing. */
  function nightOver() { return minutesLeft() <= 0; }

  /* ============================================================
     WHO IS STILL BEHIND THE COUNTER.

     A day shift means the people you need go home. Every stop has
     a frog in it who knows something, and every one of them
     finishes at a different hour: the launderer locks up at five,
     the pawnbroker at six, the man on the quay works late and the
     cabaret does not open until the evening.

     This is the thing that makes the clock bite. Before it, an
     hour spent was an hour of searching you did not do; now an
     hour spent can be a witness you will never get to speak to,
     and the plan has to be read in the order the city closes.
     ============================================================ */
  const HOURS = {
    laundry:   { open: 7 * 60,  shut: 17 * 60,      who: 'THE LAUNDERER' },
    pawn:      { open: 9 * 60,  shut: 18 * 60,      who: 'THE BROKER' },
    diner:     { open: 6 * 60,  shut: 18 * 60 + 30, who: 'THE WAITRESS' },
    docks:     { open: 6 * 60,  shut: 19 * 60,      who: 'THE WATCHMAN' },
    bar:       { open: 16 * 60, shut: 23 * 60,      who: 'THE BARMAN' },
    catacombs: { open: 9 * 60,  shut: 17 * 60,      who: 'THE KEEPER' },
    museum:    { open: 10 * 60, shut: 18 * 60,      who: 'THE GUARD' },
    butte:     { open: 8 * 60,  shut: 19 * 60,      who: 'THE PAINTER' },
    /* the street never closes */
    tower:     { open: 0,       shut: 24 * 60,      who: 'A HAWKER' },
    arch:      { open: 0,       shut: 24 * 60,      who: 'A CABBIE' },
    metro:     { open: 5 * 60,  shut: 24 * 60,      who: 'A GUARD' },
    opera:     { open: 11 * 60, shut: 18 * 60 + 30, who: 'THE HOUSE MANAGER' },
    pere:      { open: 8 * 60,  shut: 17 * 60 + 30, who: 'THE GARDENER' },
    /* nothing under a flyover has opening hours */
    perif:     { open: 0,       shut: 24 * 60,      who: 'THE MAN AT THE FIRE' },
  };

  function hours(id) { return HOURS[id] || null; }

  /* is there anybody at this stop to talk to right now */
  function open(id) {
    const h = HOURS[id];
    if (!h) return true;
    const m = minutes();
    return m >= h.open && m < h.shut;
  }

  /* how long until they lock up, in minutes — negative once they have */
  function untilShut(id) {
    const h = HOURS[id];
    if (!h) return 24 * 60;
    return h.shut - minutes();
  }

  /* the ones that are about to close, soonest first, for the plan */
  function closingSoon(within) {
    const w = within === undefined ? 90 : within;
    return Object.keys(HOURS)
      .filter(id => open(id) && untilShut(id) <= w)
      .sort((a, b) => untilShut(a) - untilShut(b));
  }

  /* ---------------------------------------------------------
     THE SKY.

     Weather is not decoration: fog costs a witness his memory,
     a storm keeps the street empty and rain hides you from the
     uniforms. It rolls every time you drive.
     --------------------------------------------------------- */
  const WEATHER = {
    fine:  { id: 'fine',  word: 'FINE',          drops: 0,   wit: 1,  heat: 1 },
    high:  { id: 'high',  word: 'HIGH CLOUD',    drops: 0,   wit: 1,  heat: 0 },
    haze:  { id: 'haze',  word: 'HEAT HAZE',     drops: 0.1, wit: -1, heat: 1, haze: true },
    show:  { id: 'show',  word: 'SHOWERS',       drops: 0.9, wit: 0,  heat: -1 },
    warm:  { id: 'warm',  word: 'WARM RAIN',     drops: 1.6, wit: -1, heat: -2 },
    thund: { id: 'thund', word: 'THUNDER',       drops: 2.2, wit: -1, heat: -2, flash: true },
  };

  /* A DAY SHIFT IS MOSTLY DRY. The old roll was two-thirds rain because a
     night detective wants his streets wet; an afternoon in Paris does not,
     and the whole point of the daylight is being able to see it. */
  function rollWeather() {
    const r = (G.rng || Math.random)();
    if (r < 0.34) return 'fine';
    if (r < 0.56) return 'high';
    if (r < 0.68) return 'haze';
    if (r < 0.84) return 'show';
    if (r < 0.94) return 'warm';
    return 'thund';
  }

  function sky() { return WEATHER[G.weather] || WEATHER.fine; }

  /* ---------------------------------------------------------
     WHERE YOU ARE
     --------------------------------------------------------- */
  function here() { return PLACES[G.place || 'precinct']; }
  function at(id) { return (G.place || 'precinct') === id; }

  /* how far it is, in map units, so the drive is longer across town */
  function distance(a, b) {
    const A = PLACES[a], B = PLACES[b];
    if (!A || !B) return 40;
    return Math.round(Math.hypot(A.x - B.x, A.y - B.y));
  }

  /* ---------------------------------------------------------
     SEARCHING A PROP.

     Every clue in the case was planted in exactly one prop in
     one place when the case was built. Searching is the only way
     to turn one over. Anything with nothing in it still costs the
     clock, and sometimes turns up cash, a favour or the wrong
     kind of attention.
     --------------------------------------------------------- */
  function searchKey(place, prop) { return place + ':' + prop; }

  function searched(place, prop) {
    return !!(G.searched && G.searched[searchKey(place, prop)]);
  }

  /* what is buried here, if anything */
  function plantedAt(place, prop) {
    const c = G.case;
    if (!c || !c.clues) return null;
    return c.clues.find(cl => cl.at === place && cl.prop === prop && !cl.seen) || null;
  }

  /* everything still buried in this place */
  function leftAt(place) {
    const c = G.case;
    if (!c || !c.clues) return 0;
    return c.clues.filter(cl => cl.at === place && !cl.seen).length;
  }

  function totalLeft() {
    const c = G.case;
    if (!c || !c.clues) return 0;
    return c.clues.filter(cl => !cl.seen).length;
  }

  function found() {
    const c = G.case;
    if (!c || !c.clues) return [];
    return c.clues.filter(cl => cl.seen);
  }

  /* the junk you turn up when there was nothing to turn up */
  const NOTHING = [
    "LINT. A BUTTON. SOMEBODY ELSE'S BAD NIGHT.",
    'NOTHING. WHOEVER CAME THROUGH HERE WAS CAREFUL.',
    'WET PAPER. THE INK IS GONE.',
    'A DEAD ROACH AND A BUS TICKET FROM MARCH.',
    'EMPTY. SOMEBODY GOT HERE FIRST.',
  ];

  /* every prop in a place, and the ones nobody has been through yet */
  function propsAt(id) { return (PROPS[id] || []).slice(); }
  function unsearchedAt(id) { return propsAt(id).filter(pr => !searched(id, pr)); }

  /* ---------------------------------------------------------
     WHAT IS OPEN TO YOU AT ALL.

     Separate from HOURS: hours say whether anybody is behind the
     counter, this says whether the city has told you the place
     exists. A locked stop is not dimmed, it is shut, and the plan
     draws a padlock on the quarter it is in.
     --------------------------------------------------------- */
  function pinned() { return (G.intelCards || []).length; }
  function locked(id) {
    const p = PLACES[id];
    if (!p || !p.lock) return false;
    if (G.unlocked && G.unlocked[id]) return false;
    return pinned() < p.lock;
  }
  function lockWhy(id) {
    const p = PLACES[id];
    if (!p || !p.lock) return null;
    const need = p.lock - pinned();
    return (p.lockWhy || 'NOT YET.') + '  '
      + (need === 1 ? 'ONE MORE PIECE ON THE BOARD.'
        : need + ' MORE PIECES ON THE BOARD.');
  }
  /* called when the board gains a piece: returns the stops that just
     opened, so somebody can put a notification on the phone about it */
  function openUp() {
    const out = [];
    if (!G.unlocked) G.unlocked = {};
    ORDER.forEach(id => {
      const p = PLACES[id];
      if (!p.lock || G.unlocked[id]) return;
      if (pinned() >= p.lock) { G.unlocked[id] = 1; out.push(p); }
    });
    return out;
  }

  return {
    PLACES, ORDER, WORK, PROPS, WEATHER, COST, START, END,
    ZONES, zoneOf(id) { return ZONE_OF[id] || null; },
    locked, lockWhy, openUp, pinned,
    propsAt, unsearchedAt,
    reset, spend, hhmm, watch, minutes, minutesLeft, nightOver,
    HOURS, hours, open, untilShut, closingSoon,
    rollWeather, sky, here, at, distance,
    searchKey, searched, plantedAt, leftAt, totalLeft, found, NOTHING,

    /* mark a prop as turned over */
    markSearched(place, prop) {
      if (!G.searched) G.searched = {};
      G.searched[searchKey(place, prop)] = 1;
    },

    /* the whole city, in map order, with what is known about each */
    board() {
      return ORDER.map(id => {
        const p = PLACES[id];
        return {
          id, place: p,
          visited: !!(G.visited && G.visited[id]),
          left: leftAt(id),
          /* is this stop part of tonight's case at all */
          inCase: (typeof CASE === 'undefined' ? true : CASE.stops().indexOf(id) >= 0),
          hint: (G.tips && G.tips[id]) || null,
          zone: ZONE_OF[id] || null,
          locked: locked(id),
          lockWhy: lockWhy(id),
        };
      });
    },

    visit(id) {
      if (!G.visited) G.visited = {};
      G.visited[id] = 1;
      G.place = id;
    },
  };
})();
