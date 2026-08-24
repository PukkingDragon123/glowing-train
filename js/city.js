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
      id: 'precinct', name: 'THE PRECINCT', sub: 'HOMICIDE DIVISION - AFTER HOURS',
      short: 'PRECINCT', x: 52, y: 62, icon: 'ic_badge', hub: true,
      blurb: 'YOUR DESK. THE BOARD. THE CAPTAIN.',
    },
    laundry: {
      id: 'laundry', name: 'THE CANAL LAUNDRY', sub: 'WHERE THEY FOUND HIM',
      short: 'LAUNDRY', x: 22, y: 30, icon: 'ic_drum', scene: true,
      blurb: 'THE BODY WAS IN HERE. THE MACHINES ARE STILL WARM.',
    },
    docks: {
      id: 'docks', name: 'PIER NINETEEN', sub: 'THE CANAL GOES OUT TO THE BAY',
      short: 'THE PIER', x: 14, y: 74, icon: 'ic_anchor', scene: true,
      blurb: 'CRATES NOBODY SIGNED FOR AND A CRANE THAT RUNS AT NIGHT.',
    },
    pawn: {
      id: 'pawn', name: 'MARSH ROW PAWN', sub: 'OPEN LATE, ASKS NOTHING',
      short: 'PAWN SHOP', x: 74, y: 34, icon: 'ic_ring', scene: true,
      blurb: 'EVERYTHING TAKEN OFF A BODY ENDS UP BEHIND THIS GLASS.',
    },
    diner: {
      id: 'diner', name: 'THE FLY TRAP', sub: 'COFFEE, DONUTS, NO QUESTIONS',
      short: 'THE DINER', x: 60, y: 18, icon: 'ic_cup', scene: true,
      blurb: 'THE NIGHT SHIFT EATS HERE. SO DOES EVERYBODY ELSE.',
    },
    bar: {
      id: 'bar', name: 'THE GREEN LAMP', sub: 'THE CREW DRINKS HERE',
      short: 'THE BAR', x: 86, y: 78, icon: 'ic_glass', scene: true,
      blurb: 'IF HE HAS FRIENDS, THEY ARE AT THIS BAR TONIGHT.',
    },
  };

  const ORDER = ['laundry', 'docks', 'pawn', 'diner', 'bar'];

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
  };

  /* ---------------------------------------------------------
     THE CLOCK.

     The night is the budget. Everything you do costs minutes and
     when it runs out the shift is over and the captain wants you
     off the street — you keep everything you found.
     --------------------------------------------------------- */
  const START = 20 * 60 + 40;          // 20:40
  const END = 6 * 60;                  // 06:00, next morning

  /* A NIGHT IS 560 MINUTES. Turning over every prop in the city would take
     about 600, so the night is deliberately too short to search everything:
     where you look is the game. */
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
  }

  /* minutes past midnight, wrapped, so 20:40 -> 02:10 counts up */
  function minutesLeft() {
    const now = G.clock === undefined ? START : G.clock;
    return (now >= END ? (24 * 60 - now) + END : END - now);
  }

  function hhmm() {
    const m = ((G.clock === undefined ? START : G.clock) % (24 * 60) + 24 * 60) % (24 * 60);
    const h = Math.floor(m / 60), mm = m % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  }

  /* the hour reads differently at 3am than at 9pm, and the rooms tint with it */
  function watch() {
    const m = ((G.clock === undefined ? START : G.clock) % (24 * 60) + 24 * 60) % (24 * 60);
    if (m >= 20 * 60 || m < 1 * 60) return { id: 'night', word: 'NIGHT', tint: 'rgba(30,40,70,.10)' };
    if (m < 3 * 60) return { id: 'small', word: 'SMALL HOURS', tint: 'rgba(20,26,54,.16)' };
    if (m < 5 * 60) return { id: 'dead', word: 'DEAD HOURS', tint: 'rgba(16,20,44,.20)' };
    return { id: 'grey', word: 'FIRST LIGHT', tint: 'rgba(120,130,160,.10)' };
  }

  function spend(kind, mult) {
    /* ROUNDED, ALWAYS. A half-cost action (a favour, a flight of stairs) used
       to leave a fraction of a minute on the clock, and the corner of the
       screen read 23:41.5 for the rest of the night. */
    const c = Math.round((COST[kind] || 5) * (mult === undefined ? 1 : mult));
    G.clock = Math.round((G.clock === undefined ? START : G.clock)) + c;
    if (UI && UI.syncStory) UI.syncStory();
    return c;
  }

  function nightOver() { return minutesLeft() <= 0; }

  /* ---------------------------------------------------------
     THE SKY.

     Weather is not decoration: fog costs a witness his memory,
     a storm keeps the street empty and rain hides you from the
     uniforms. It rolls every time you drive.
     --------------------------------------------------------- */
  const WEATHER = {
    rain:  { id: 'rain',  word: 'RAIN',        drops: 1.0, wit: 0, heat: -1 },
    pour:  { id: 'pour',  word: 'HARD RAIN',   drops: 1.9, wit: -1, heat: -2 },
    storm: { id: 'storm', word: 'STORM',       drops: 2.4, wit: -1, heat: -2, flash: true },
    fog:   { id: 'fog',   word: 'FOG',         drops: 0.2, wit: -1, heat: -1, haze: true },
    clear: { id: 'clear', word: 'CLEAR, COLD', drops: 0,   wit: 1,  heat: 1 },
  };

  function rollWeather() {
    const r = (G.rng || Math.random)();
    if (r < 0.34) return 'rain';
    if (r < 0.56) return 'pour';
    if (r < 0.7) return 'storm';
    if (r < 0.86) return 'fog';
    return 'clear';
  }

  function sky() { return WEATHER[G.weather] || WEATHER.rain; }

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

  return {
    PLACES, ORDER, PROPS, WEATHER, COST, START, END,
    propsAt, unsearchedAt,
    reset, spend, hhmm, watch, minutesLeft, nightOver,
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
          hint: (G.tips && G.tips[id]) || null,
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
