# SHELL & DEBT

**A murder-mystery in the swamp city, in hand-drawn pixel art. No build, no
assets, no network — every pixel is drawn by the game at boot.**

You were the good cop. You picked the Bullfrog out of a line-up and his
lawyers had him out by noon. At seven that night the door came in. It rained
at the funeral and he sent flowers. You kept the badge, and the gun.

Six years later there is a board in the back of the precinct with five holes
in it, and nobody's name on the case but yours. Fill the board and the man
goes down in a courtroom. Turn up at his door without it and the only thing
you can do to him is the thing he did to you.

Every night of it is the same shape: **the captain gives you a lead, the city
hides the evidence, and the clock runs out at six.** Drive out to five places,
put your hand in the drains and the fire barrels and the pawnbroker's case,
work out which of the frogs standing in the line-up downstairs is the one who
did it, say his name, and then sit down across a table from him with one
revolver between you.

That is the whole game, and it is the two endings.

![The murder board](docs/screen-title.png)

## Play it

```
# open index.html in a browser, or:
python3 -m http.server 8080   # then visit http://localhost:8080
```

Plain HTML/CSS/JS. Every sprite, prop, room, letter and cutscene is drawn by
the game from code — there is not one image file in the repository. Works on
phones. Sounds are synthesized with WebAudio. Cases are seeded. What the
department remembers about you persists in localStorage.

## The rooms you walk around in

![The precinct](docs/screen-precinct.png)

There is no menu strip and no button bar. A room is a place: **tap the floor
and the detective walks there**, drag to look down the room, and the things
you can do are objects in it. Walk up to a thing and it says what it is on a
little drawn plate over its own head; tap again and you do it.

Rooms arrive like scenes in a film. The cinema bars close, the camera pans
the length of the room while the name of the place types itself onto a card,
and only then does it hand the controls back. When somebody talks the bars
come back, the camera holds on the two of you, nobody walks anywhere, and the
line types itself out under his face one key at a time.

The bullpen at two in the morning has a front desk with a phone and a
percolator, three desks with typewriters and one live lamp, a water cooler, a
dead plant, filing cabinets, lockers, a radiator, a wall clock nobody winds,
a holding cell with somebody in it, rain on the windows, pipes along the
ceiling, and the board at the far end. People stand *behind* the furniture,
the lamps put light on the floor, and the ceiling has joists in the dark.

- **Captain Rook** hands you the next chapter of the case.
- **Officer Maybelle** works the front desk. Talk to her once a night.
- **Patrolman Dill** has nothing to report. The **drunk tank** has a lot.
- **Your desk** holds the lead. **The lockers** hold your iron and your belt.
  **The cooler** is worth one heart a night.
- **The street door** gets the car, which means **the phone** (`P`).
- **The stairs** go down to the line-up room, when you have something on
  somebody.

### The board

![The Bullfrog board](docs/screen-board.png)

Five pieces make a case: a **photograph**, the **vig ledger**, the **route**,
the **name on the deed**, and the **address**. Each one is a thing you take
off a body and pin to cork, and the red string grows between them as you go.
At five pieces the gap in the middle spells out fourteen Marsh Row.

The board is also the readout the old ante ladder used to be — **the only
number this game shows you is how much of him you have.**

## The case

Eight chapters, bottom to top: the collector, the bookkeeper, the driver,
the lawyer, the cousin, the enforcer, the floor below his, and him. Each
chapter is a room of his people and the frog who runs it — **and every
lieutenant carries one piece of the board.**

![Officer Maybelle](docs/screen-maybelle.png)

Maybelle's trust is slow and it is real: it starts as talk, becomes coffee
money in your coat, then a file pulled before the shift change (**+1 look at
the evidence, all night**), and one night, *"whatever happens up there — come
home after"* — **+1 heart, all night**. It carries between cases.

## The city

![FroggoMap](docs/screen-map.png)

The case is not in one room any more. **It is buried in five places across
town**, and the only way to it is the brick in your coat.

**The FroggoPhone** (tap `PH`, or `P`) is the only menu in the game:

- **FROGGOMAP** — the city drawn from above, the canal cutting through it,
  five stops and the station. Tap one and you drive there. A stop with
  something in it wears a gold `!`; a stop where somebody is owed a favour
  wears the errand bag.
- **CASE FILE** — what you have turned over, what each piece rules out, and
  which faces still fit.
- **THE KIT** — your coat, laid out: the iron, the belt, every evidence bag
  you are carrying, and anything you agreed to run across town for somebody
  else.
- **THE JOB** — what you are supposed to be doing *right now*, tonight's
  chapter, the Bullfrog board, every errand you are in the middle of, and the
  last few lines of the file.

![The kit](docs/screen-kit.png)

![The job](docs/screen-job.png)

![The case file](docs/screen-casefile.png)

The five stops, and what they are:

| Where | What is in it |
|---|---|
| **THE CANAL LAUNDRY** | the crime scene: three drums, a chalk outline, a floor drain, the tape still up |
| **PIER NINETEEN** | crates nobody signed for, a fire barrel, black water, a shed with a new lock |
| **MARSH ROW PAWN** | everything taken off a body, behind glass, and a ledger of who brought it in |
| **THE FLY TRAP** | coffee, donuts, the night shift, and a cook who watches the street |
| **THE GREEN LAMP** | where the crew drinks, with a barman who answers if you work a shift |

![The canal laundry](docs/screen-scene.png)

![Pier Nineteen in the rain](docs/screen-pier.png)

### The night is the clock

Every place you drive to costs **35 minutes**, every prop you put your hand
in costs **18**, a question costs **12**. The shift ends at **06:00** —
turning over everything in the city would take about **600 minutes and you
have 560**, so *where you look* is the whole game. Run the night out and the
captain pulls you off the street; you keep what you found.

The sky is not decoration either. It rolls every time you drive: **rain**,
**hard rain**, **storm**, **fog**, **clear and cold**. Fog and heavy rain
cost a witness a detail; clear weather means the street can see you working.

### Clues are things, not hunches

![What was in the drain](docs/screen-clue.png)

Every clue in the case is planted in exactly one prop in one place. Put your
hand in the right drain and you come out with **a gold tooth cap**, **a
cracked lens**, **a bloody dressing**, **cigar ash still soft**, **a coat let
out twice at the seams** — and every one of them crosses faces off. Put your
hand in the wrong one and you get lint, a bus ticket from March, sometimes a
few loose notes, and sometimes somebody watching you do it.

Witnesses fill the gaps: the launderer, the watchman, the broker, the
waitress, the barman. *Was he wearing a hat? Both eyes? Any gold in his
mouth?* They answer honestly — and the weather decides how much they saw.

### Talking back

![What you say back](docs/screen-replies.png)

Nobody talks *at* you any more. Every conversation in the game ends in a rack
of things you can actually say, big enough to hit with a thumb and numbered
if you would rather use the keys. The captain's brief is a conversation you
can push on — *who else has read this file?* puts a pin on your map, *I want
a car and a radio* gets you across town in half the time, *what if I name the
wrong frog?* gets you the count of faces that still fit. The front desk, the
hospital bed and the frog behind the line-up glass all answer the same way,
and every rack has a way out on the bottom of it.

### Side work

![Working the taps](docs/screen-taps.png)

Nobody on this salary can afford petrol. **Work the taps** at the Green Lamp
(three pints, stop each pour on the line) and the barman owes you an answer.
**Make a batch** at the Fly Trap (three donuts, stop the needle in the heat)
and you eat one — *the only medicine in this game* — and the cook tells you
which end of the city still has something in it.

### Errands, which pay in evidence

Everybody in this city wants something, and none of them take money. Ask a
witness a question and he will ask you for a favour first — **and the favour
pays in a piece of evidence he has been sitting on all night.** One per
stop, one night each:

![An errand](docs/screen-errand.png)

| Who | What he wants | What it actually is |
|---|---|---|
| **THE LAUNDERER** | three rats out of his drums | drop the lid on a rat running the pipe, three times |
| **THE WATCHMAN** | his tally book out of the canal | put your hand in the black water under the pier |
| **THE BROKER** | a parcel run to Pier Nineteen | *and he told you not to look in it* |
| **THE WAITRESS** | a tray of donuts to the night shift | drive it to the precinct before it goes cold |
| **THE BARMAN** | twenty minutes on the door | twenty minutes off your clock, paid on the spot |

![Clearing the drums](docs/screen-rats.png)

The evidence comes out of *his own place first*, so a favour where you are
standing is worth more than one across town. Refuse and nothing is lost —
he still answers your questions. And the parcel is the interesting one:
carry it to the pier and you can drop it and drive back for the full payoff,
**or open it there** and keep what is inside tonight — which costs you his
money and every answer he had, because he will not talk to you again before
morning.

## The line-up

![The line-up room](docs/screen-lineup.png)

You do not name anybody in the field. You take what you dug up back to the
station, go **down the stairs off the bullpen**, and they stand them against
the height chart under a light that does nobody any favours. What you found
is on the table behind you. Anybody your evidence rules out is **crossed off
where he stands**.

![Saying the name](docs/screen-named.png)

Then you say one name out loud.

| Naming him | What happens |
|---|---|
| **right** | they put him in the back room, and the bounty pays **30% more** |
| **wrong** | he walks out past you, −6 chips, he sits down with **an extra heart**, and **he shoots first** |

A frog you already know — a lieutenant, the Bullfrog himself — needs no
line-up. You have had his face on your own wall for six years. They wave you
straight through.

## The table

![The table](docs/screen-duel.png)

Through the back door there is a revolver, a posted mix of **LIVE** and
**blank** shells in an order nobody knows, and a table. You are the camera:
your own two hands on the felt and the iron in your right fist.

- **Click his face** — the iron comes up. **Click again** and it goes off.
- **Click your own end of the table** — the camera crosses it and you see
  yourself from his chair, the muzzle against your own temple. A blank
  **keeps your turn**. That is the whole game.

### Breaking the shot

![The steady check](docs/screen-steady.png)

Across a table is a shot you can miss. Point and pull and the bore drifts: a
rail comes up with a marker sweeping it, a green band and a gold one inside
that.

| Where you break it | What happens |
|---|---|
| **the gold band** | through the eye — **+2 damage** |
| **the green band** | a normal hit |
| **outside both** | into the wall behind his ear, and the chamber is gone |

Faster and tighter every chapter. Against your own head there is no check.

![The cut-in](docs/screen-cutin.png)

The moment a live round commits, somebody's face crosses the frame on a
skewed banner. It runs black most nights. **When the round is going to end
somebody, it runs red.** Down to one heart, the lens closes in and you can
hear your own pulse.

## Out back

![Out back](docs/screen-loot.png)

You never watch him fall. The shot goes off, the lens goes red, and when it
wipes you are already out back with the door shut — and between the two
rooms there is a small sad loading scene of you dragging him by the boots
under a swinging bulb.

The body is **fully intact**, because this was never about what the round
did. It is about what is in his coat. Almost no interface: a strip of meters,
your tools in the corner, and the room. **Search him with your own hands** —
hat, coat, vest, hand, boot, mouth.

- **TIME** — real seconds, shorter every chapter.
- **NOISE** — every pocket makes some; a boot or a gold tooth makes a lot.
- **THE TRAIL** — dragging a frog through a doorway leaves marks. Tap one and
  your arm goes out with the mop: three passes each, and the boards come back.

![The mop](docs/screen-mop.png)

Get heard and a uniform comes through the back door tapping his nightstick:
**bribe** him or walk. After a lieutenant, the department wants protection
money — and if you cannot pay it, **they take your badge instead**, which
quietly closes one of the two endings.

## Dying is not the end of it

![The ambulance](docs/screen-ambulance.png)

There is no game over in this game. Lose the table and an ambulance comes
through the rain, the ceiling of a corridor goes past your own eyes, and a
clerk stamps a form: gunshot, treated, discharged against advice.

![The ward](docs/screen-ward.png)

You wake up in the ward with rain on the window, a machine counting, a chart
with your name on it — and Maybelle, who was off at eleven and stayed. It
costs chips, and after the second trip it can cost you a piece of the board
out of your coat. **Three trips and the department takes the badge.**

Then you discharge yourself and go back to work, because nobody else is going
to.

## The two endings

![The choice](docs/screen-choice.png)

Fill the board, walk into fourteen Marsh Row, and put him on the floor. He is
still breathing. You get one decision:

- **THE BADGE** — cuff him and let the file do it. Available only if the
  board is full **and** the badge is still yours. He goes down in a
  courtroom, the sun comes up through the high windows, and it stops raining
  over two headstones.
- **THE BULLET** — one flash in a dark room, nobody writes it down, and the
  last shot of the game is you sitting in his chair with his board burning on
  the wall behind you.

![The courtroom](docs/screen-court.png)

![His chair](docs/screen-bad.png)

## Everything that moves

All drawn, all procedural, no sprite sheets, tap to skip the long ones.
Every frog in this list is the **same model** — one head, one costumed body,
one pair of legs, built once and integer-downsampled for rooms. The frog who
walks the bullpen, the frog pinned to the cork, the frog across the table and
the frog leaning into a cut-in are the same frog.

1. The title room — rain on the glass, the lamp over the desk, a city awake
2. The lore reel — the line-up, the verdict, the door, the rain, the oath
3. The arrival — bars close, the camera pans the room, and the name of the
   place types itself onto the card with the hour and the weather under it
4. The drive across town — parallax skylines, rain, wipers, a destination
5. The walk — he leans into it, coasts, brakes into the mark and lands on it
   with a squash, a heel knock and a puff of dust
6. The walk cycle — four frames off the ground covered, not off the clock
7. The card-file wipe between rooms (venetian blinds, with an evidence tab)
8. Rain falling through an outdoor room, splashing on the boards, and the
   lightning off the bay
9. Fog in soft banks, and the city smeared down into the canal
10. The evidence card — what you pulled out of the drain, held up to the light
11. Saying the name: his mugshot, and the stamp that lands on it
12. The taps — a glass filling, a head on it, and the line you are aiming for
13. The fryer — oil moving, a needle sweeping, three donuts glazed
14. The drums — a fat wet rat running a pipe, and a lid on a chain
15. The FroggoMap — a city from above with the rain falling on all of it
16. Idle blinks, weight shifts, and the tongue taking flies (a verlet chain)
17. Lamp cones, floor pools, flickering tubes and dust in the air
18. Dialogue under cinema bars: the camera holds, the line types, a key ticks
19. The sit-down — dark room, his eyes, the lamp stuttering on
20. A lieutenant's entrance under cinema bars, with his name stamped on it
21. The four-beat cock: hammer, cylinder, the held beat, the drop
22. The steady check — the sweep, the bands, and the break
23. Muzzle flash, cordite, the casing on the felt
24. The slug in the air, with a shock ring and a wake
25. The Persona cut-in — skewed banner, speed lines, red when it is lethal
26. His grip, in four styles, arm anchored at the shoulder
27. His reactions — the facepalm, the raised digit, the shrug
28. Blood that lands, runs and stays — on him, and on your lens
29. The blood-splat kill wipe, coming off like a sleeve on glass
30. The drag loader — you, him, one swinging bulb, a smear on the boards
31. First-person searching: your arm out, dust off the lining, his weight
32. The mop — three passes a stain
33. The bribe — chips arcing into a glove, one at a time
34. The last-heart dread: a closing vignette and a heartbeat, twice a bar
35. The ambulance — the wagon in the rain, then the corridor from a gurney
36. The chapter card, and the take raining past the lens
37. The dawn card — the sky coming up grey and the shift ending on you
38. The courtroom, the gavel, and the first daylight in the game
39. Two headstones and the rain stopping
40. A burning board, and a frog-shaped hole in a chair

## Keys

Tapping is the whole control scheme, but: `A`/`D` or the arrows walk, `E` or
`SPACE` uses what you are standing next to, **`P` takes the phone out of your
coat**, `ENTER` sits down or walks out, `6–8` are the belt, `Q`/`E` are the
gun tricks at the table, `R` bribes, `TAB` opens the case, `M` mutes, `H` is
the house rules.

## Project layout

```
index.html        entry point
style.css         the pixel skin: chunky panels, CRT overlay, zero radius
js/util.js        seeded RNG (mulberry32), helpers, procedural WebAudio SFX
js/pixfont.js     the hand-drawn 5×7 typeface every letter is set in
js/pix.js         pixel engine: the palette, a sprite compiler, draw helpers
js/art.js         THE PROP SHOP: painted pixel maps + the shading kit
js/scene.js       the side-on rooms: tap-to-move, camera, walk rig, plates
js/city.js        THE CITY: five stops, the clock, the sky, what is searchable
js/places.js      the five stops, painted: laundry, pier, pawn, diner, bar
js/phone.js       the FroggoPhone: the map, the file, the kit, the only menu
js/jobs.js        the side work: the taps, the fryer, the drums
js/rooms.js       the station: bullpen, board room, ward, line-up room
js/story.js       THE CASE: chapters, the board, dialogue, errands, endings
js/data.js        the crew, the guns, the belt, the questions, the tuning
js/meta.js        what survives a case: stats, learned tells, her trust
js/sprites.js     THE ONE FROG MODEL, the iron rig, mugshots, splats, plates
js/engine.js      pure rules: the duel, his brain, the loot, the heat
js/case.js        the identification game: suspects, evidence, questions
js/duel.js        the drawn table: expressions, grips, the steady check
js/cine.js        every cutscene, and the film rig they all run on
js/cops.js        the uniforms: the walk-in, the bribe, the bust
js/loot.js        out back: first-person searching, the meters, the mop
js/tutor.js       the drawn speech plate, the reply rack, and the handler
js/ui.js          the story HUD, the live title room, the duel frame, help
js/btn.js         the arcade buttons the few remaining screens use
js/fx.js          smoke, gore, chip arcs, slow-mo, ambient dust
js/main.js        boot (+ ?debug harness)
dev/sim.js        headless balance + fuzz harness (node dev/sim.js)
dev/smoke.js      full browser smoke test (node dev/smoke.js)
```

### Tuning knobs

- The identification game — `CASE_TUNING` and `CASE_ASKS` in `js/data.js`
- The steady check — `AIM_TUNING` (sweep speed and band widths per chapter)
- The trail and what it costs — `MESS_TUNING`
- Bounties, heat, bribes — `BLIND_PURSE` / `HEAT_COST` / `LOOT_TUNING`
- The chapters and the five pieces — `CHAPTERS` / `INTEL_CARDS` in `js/story.js`
- What a room is furnished with — the scene definitions in `js/rooms.js`
- The night, the sky and what a search costs — `COST` / `WEATHER` in `js/city.js`
- Which props exist to be searched — `CITY.PROPS` in `js/city.js`

### Dev checks

```
node dev/sim.js      # 500 bot cases + 200 fuzz cases against the real engine
node dev/smoke.js    # drives the whole story in headless Chromium
```

Current curve, for a bot with **no eyes and no hunches**: it drives to a
random stop, puts its hand in things at random, pays the clock for all of it,
and names whoever is left standing.

- **43%** fill the board
- **39%** reach the Bullfrog at all
- **17%** could still take the good ending when they get there
- **4.1** trips to the ward per run
- **~10** props searched per case, and **3 nights in 16 run out** before it
  has enough to say a name

A player who follows the captain's tip, reads what the evidence actually
rules out, asks the witness the one question that splits the field, breaks
the shot clean and mops the floor does far better than that on every line.
That is the point.

---

*A blank in your own head is a free turn. Take his papers — the board is five
holes wide.* 🐸🔎
