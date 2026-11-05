# TRADECRAFT design, part 2: "Moment to moment" (DESIGN.md lines 301-452)

Research note for OLYMPUS. Source: `/Users/deaumas/lab/vibe/claudecode/tradecraft/docs/DESIGN.md` lines 301-452, the section `## Moment to moment`, read in full. Constants were checked against the code in `/Users/deaumas/lab/vibe/claudecode/tradecraft/src/sim/*.js` (paths below are relative to `tradecraft/`). Where the section only points elsewhere (guns, controls), I pulled in the target lines (DESIGN.md 585-586, 637-679, 776-803) as cross-references and marked them so. Tradecraft is read-only reference: nothing there was changed.

How to read the attributions. "The user" means the human who directs both projects. Their decisions carry over to OLYMPUS as taste. Dates come from DESIGN.md where it gives them, otherwise from the version that shipped the decision, mapped through `CHANGELOG.md`:
- v0.0.x = 2026-10-26
- 0.1.0-rc1..rc24 = 2026-10-27
- rc27..rc36 = 2026-10-28
- rc37..rc50 = 2026-10-29
- rc53/rc54 = 2026-10-31
- rc56 and 0.1.1..0.1.13 = 2026-11-03
- 0.1.36..0.1.42 = 2026-11-04
- 0.2.0 = 2026-11-05

"My call" in DESIGN.md means the agent that built tradecraft picked the number, not the user.

---

## 0. The core of the feel, in one paragraph

Tradecraft plays top-down in real time, 20 ticks a second (`src/sim/clock.js` TICK_MS = 50). You control only two things: where you walk and where you face. Looking is passive. Everyone, the player included, sees through one perception function (`src/sim/perception.js`). That same function decides the dice and draws the screen: what your character isn't aware of is dimmed and frozen where it was last seen. Every uncertain thing is a d20 + skill + modifiers roll against a DC, or an opposed roll (`src/sim/checks.js`), and the log can show every modifier.

Violence uses **stop motion**. Close combat is rock-paper-scissors, one exchange a second, with time frozen until you choose. Shooting is a mode entered on purpose. Each step of readying and firing a gun is picked from a panel, the world advances by that step's duration, then freezes again.

An action that takes time (a meal, a browse, a wash, a rest) **skips the clock**. The world gets computed outcomes for the gap and is not simulated tick by tick (`src/sim/game.js` skip()). Only a few things are "lived through" in real time, such as the coffee at a café window you watch the street from.

The body has six parts, each with its own damage. There is blood volume as a percentage, bleeding rates per wound, first aid with DCs and durations scaled by Medicine, infection, pain, and fever. Needs (hunger, stress, fatigue) are meters that turn into roll penalties. Inventory is volumes and pockets, with no magic storage.

This is exactly the layer OLYMPUS wants for a Martian marine.

---

## 1. Controls (keys), as built

Source: `src/ui/input.js` (76 lines), DESIGN.md "Controls" (lines 776-803).

- Keys are read by **physical position** (`KeyboardEvent.code`). On-screen labels show the player's own layout via `navigator.keyboard.getLayoutMap()` (Chrome). Where the browser can't tell, labels fall back to **AZERTY**. The user's words: "don't give me the QWERTY keybinds", recorded as "the user's, the only player". So the move keys are labelled **Z Q S D**, and the guard key prints **M** (the physical `Semicolon` key).
- `KEYS` (input.js line 16):

| Action | Code (physical) | AZERTY label | Does |
|---|---|---|---|
| move | KeyW/KeyA/KeyS/KeyD + arrows | Z Q S D | walk |
| run | ShiftLeft | Shift | run (draws attention) |
| slow | AltLeft | Alt / Option | stroll while held (my call): keep a slow pace without stopping |
| interact | KeyF | F | context menu on whoever is within reach (1.8 m); numbers or click pick an option |
| inventory | KeyI | I | what you carry: take out, put away, drop |
| aid | KeyH | H | first aid on yourself; also rest |
| instinct | KeyT | T | do what the instinct's line offers ("sit with him", "call it off", "Hide now!", answer the phone) |
| watch | KeyE | E | **hold** (>= TAP_MS 220 ms): stand and look, the move keys turn the eyes; **tap**: glance back over the shoulder while walking on (GLANCE_S 1.2 s) |
| sheet | KeyC | C | character sheet (body doll, wounds, skills, file) |
| camera | KeyP | P | take a photo if carrying a camera |
| hit / grapple / guard | KeyK / KeyL / Semicolon | K / L / M | CQC moves; Shift held = spend an advantage point ("edge") |
| gun | KeyG | G | draw a weapon (a gun: enters the shooting mode with the draw as first step) |
| aim | KeyX | X | enter/leave the stop-motion shooting mode |
| use | KeyR | R | use what's at hand: shop window, bench, kiosk, counter, basin, back door, taxi, station door, something lying within reach (pick up) |
| mindmap | Tab | Tab | "the mind": what the character knows |
| log | KeyJ | J | the log (every roll's full sum) |
| pause | Space | Space | pause |
| menu | Escape | Esc | menu |
| help | whatever types "?" | Shift+, on AZERTY | key table on screen, folded to "? keys" until asked |

- **T and R were split** on 2026-10-28 (0.1.0-rc29). The user: "'T' as a universal key interferes when several things can be done with it ... when the option to call off the meeting for a brush pass is available, we can't look in a shop". So T is the *instinct's suggestion* and R is *what's at hand*, and neither hides the other. F is *people*. Three context keys with three distinct scopes (people / suggestion / world object) is a pattern worth keeping.
- "Put the keybinds behind '?' key instead of always in the bar at the bottom" (the user, 2026-10-27).
- E-hold at a shop window: left/right slant the eyes along the glass (70 deg/s, up to 60 deg), up returns to straight in, down turns away (0.1.0-rc21, the user: "tends to slant the wrong direction (up instead of left)").
- "The mouse is for menus" (DESIGN Controls). In shooting mode the mouse is also used to point and aim (0.1.13). See section 14.
- The sim takes input as plain data: `{ mx, mz, run, slow, look, act: [...] }` (game.js line 152). The input layer is separate from the pure sim.

**OLYMPUS:** reuse the scheme as is: AZERTY-labelled physical keys, F people / R world / T suggestion, E look and glance, K/L/M for CQC, G/X for weapons, H aid, I inventory, C sheet, Tab mind, J log. Add new keys only for military-specific actions (safety, magazine, chamber), probably inside the weapon mode's numbered panel rather than as global keys, the way tradecraft does it.

---

## 2. Movement

DESIGN line 303; `src/sim/game.js` lines 80-84.

- Walk **1.45 m/s** (WALK_MS). Stroll **0.95 m/s** (Alt held). Run **3.6 m/s** (RUN_MS). Running "draws attention": a watcher's scan gets +6 against you when you run, and passers-by turn their heads to someone running past.
- **No sneaking system** (no noise, no crouch). "Sneaking assignments are played through perception, disguise and the instinct: T does what it says ('Hide now!'), whenever there's something to hide behind" (line 315). Deception covers looking innocent.
- **No driving.** "A car is fast travel, with its tail risk" (Q150).
- The wounded move slower: `src/sim/health.js` MOBILITY:
  - legs: hurt 0.85, wounded 0.55, out 0.3
  - torso: hurt 0.9, wounded 0.65
  - blood: pale 0.85, shock 0.6
  - a gunshot under 3 days old 0.8
  - You can't run below 0.7 of your pace (RUN_BELOW), or in shock, or weak from hunger.
  - Crawling is 0.25 m/s, x0.6 with one arm (CRAWL_MS, CRAWL_ONE_ARM).
- A busy plan (`me.busy`: steps like `['go', x, z]`, `['wait', ticks, face, gait]`) moves the player for scripted bits, such as stepping to the end of a pane. **Any movement input cancels it** (game.js line 269). A walk-to step is given up after one second without getting closer (stuck detection).

**OLYMPUS:** keep the three gaits and "moving cancels the action". Gravity should change the speeds, though. This is my suggestion, not the user's: Froude scaling, where the preferred walk and the walk-to-run transition scale with sqrt(g*L). At Mars 0.38 g the transition falls to about 0.62x Earth's (sqrt 0.38). Low g also favours a loping or bounding run, with more airtime and less traction on a turn. A Belter-type or Mars-born body might have a different Fitness and gait baseline.

---

## 3. Time: real time, and actions that skip the clock

DESIGN lines 379 (shops), 433, 441; `src/sim/game.js` skip() lines 425-448, busy() lines 405-424; `src/sim/shops.js` header.

- Real time at 20 Hz. The clock advances with ticks. An autosave fires every 30 game minutes.
- **An action that takes time is skipped** (0.1.0-rc27, 2026-10-28). The user's complaint: "went to buy a book in a bookstore, never came out even after 3 minutes". "The clock skips it and your feet are yours again at once, where you stood."
- `skip(state, bus, ms)` is "time passing without ticks: the world gets outcomes for the gap, not a simulation of it". During a skip:
  - blood on the street washes by the weather
  - whoever is bleeding bleeds through it, a minute at a time (bloodBeat per 60 s)
  - people's gauges drift
  - wounds heal by the day fraction (heal())
  - wetness dries
  - body heat runs
  - emergency calls get "caught up"
  - the street's crowd is recycled or repopulated if the gap is long
  - training weeks and skill rust roll
  - the autosave fires if a 30-min boundary was crossed
- **Lived vs skipped.** Only a few actions are lived in real time (`LIVED = {'sit','read'}` in shops.js). The café window coffee (SIT_S 180 s) is watched in real time, and moving ends it ("half the coffee left"). Everything else skips.
- Durations of world actions, from DESIGN and code:

| Action | Duration | Notes |
|---|---|---|
| bite to eat at a counter | 120 s (EAT_S) | resets hunger; stress -8 |
| browse at a counter | 40 s in code (BROWSE_S); DESIGN says "a minute's browse" | natural cover |
| wash blood off face at a café basin | 90 s (WASH_S) | |
| buy and put on a coat off the rail | 150 s (COAT_S) | |
| café window coffee (lived) | 180 s (SIT_S) | moving ends it |
| out the back door | 20 s (YARD_S) | yard, gate, out of sight |
| kiosk paper | 25 s, $1 | cover |
| phone box | 45 s | cover |
| notice board | 30 s | cover |
| tie shoelace | not again within 40 s (LACE_AGAIN_S) | cover |
| gym session / class / lesson | 90 / 120 / 90 min | skipped; one hard session a day (WORKOUT_GAP_H 18 h) |
| range evening | 75 min (RANGE_S) | |
| rest (H) | up to 8 h (REST_H), skipped | somewhere warm, blood regenerates |
| first aid actions | 5 s to 4 min x Medicine pace | stooped over the wound; moving stops it |

- "A night skipped and a day walked count the same" for infection. Hazards are summed against a threshold set by the dice when the wound was made, so the result doesn't depend on whether time was ticked or skipped. **Important design rule for OLYMPUS:** every slow process (hygiene, hunger, infection, O2, CO2, radiation dose) must give the same answer whether lived or skipped.

**OLYMPUS:** this is the user's explicit want ("activities that skip time ... a shower ... takes a chunk of clock time"; "a splash screen illustrating the action and a time fast-forward"). Tradecraft has the skip model but no splash screen: the clock just jumps and a log line appears. OLYMPUS must add the illustrated splash card and visible fast-forward. Keep tradecraft's "outcomes for the gap" contract, and "your feet are yours again at once, where you stood".

---

## 4. Perception (the user, 2026-10-26: "a notion of where we're looking and what characters are aware of")

DESIGN lines 306-313; `src/sim/perception.js` (265 lines); render `src/render/view.js` lines 36-50, 120-130; shader `src/art/pixelart.js` setFog.

This replaces the first design's "no sight lines". Everyone faces a heading (`a.head`, radians, 0 east, pi/2 south toward the camera).

### 4.1 What a character sees (`eyes()`, `openness()`, `visibility()`)

- **Cone ahead:** 100 deg + 2 deg per point of Awareness, at most 170 deg (CONE_DEG, CONE_PER_AWARENESS, CONE_MAX_DEG). The edge is soft: a 0.24 rad ramp (openness() line 158).
  - The player lying on the ground, awake, sees all round (pi half-angle). The user, 2026-11-04: "half the world is frozen some of it keeps moving".
- **Range set by the light at the spot looked at:** `reach = min(SIGHT_M + LIGHT_M x lightLevel, weather sightM)` = 10 m + 42 m x light.
  - By day: 52 m.
  - A man under a street lamp at night: 30 m. One in the dark between lamps: 15 m.
  - "The night street is islands of light". v0.0.40, the user: "at night we don't get a malus to sight?" Before that it was a flat 22 m.
  - The far edge is a soft 4 m ramp.
  - Weather caps it: heavy rain or snow some, fog a lot (`weather.js` sightM()).
- **Situational awareness radius, all round:** 2.5 m + 0.2 m per point of Awareness (AWARE_M, AWARE_PER), with a 1.5 m soft edge. Inside 1 m, always seen. "The edge of the eye, footsteps, the sense of someone there."
  - Past Tradecraft 50 the radius widens by (os - 50)^2 / 200 m: 0.5 m at 60, 4.5 m at 80, 10 m at 95.
- **Shop window as mirror** (v0.0.32, the user: "it would also not show as much as when looking directly since we act as a barrier to what's directly behind us").
  - The glass shows what the eye's cone takes in of the street's reflection, through the pane and no further, out to 0.75 of the range (GLASS_K: the path there and back).
  - Looking straight in shows the road behind. Slanted along the glass (up to 60 deg, GLASS_MAX_DEG), it shows the pavement behind on that side.
  - A 24 deg sector straight behind (BODY_DEG) is your own back.
  - You must stand within 1.5 m of the pane (GLASS_REACH_M), eyes into it. An NPC using a window to check slants 50 deg back the way they came (GLASS_BACK_DEG).
  - A parked car's window is the same mirror (0.1.0-rc45, 2026-10-29, R at the kerb; the user's list item "car windows").
- **Line of sight:** buildings block (axis-aligned wall rectangles, Liang-Barsky segment test, binned by WALL_BIN_M). People, cars and trees don't block sight; "the street is seen over and between them". Cover against bullets is a separate system (`src/sim/cover.js`).
- `visibility()` is soft, 0..1, and the view dims by it. `sees()` is the hard threshold SEEN = 0.5 that the rules read. **"The same function draws the screen and decides the dice."**
- Civilians without a sheet have Awareness 4 (CIVILIAN_AWARENESS).

### 4.2 On screen

- What the character isn't aware of is **dimmed**: "darker, greyer, colder", with a dithered edge (a 4x4 ordered dither in the post shader). The look is near black at night ("the edge of sight is a shadow").
- Implementation:
  - A ground-plane mask of 0.5 m cells (FOG_CELL_M), 96x128 cells = 48x64 m round the camera (FOG_N), each the visibility of that spot from the player's eyes.
  - Dim factor 0.48 (dimK).
  - The mask eases in fast (0.08 s) and out slowly (0.4 s), "as eyes do". Felt patches ease out over 1.1 s.
  - It is recomputed only when the eyes move, turn or change, or once per game second. Only the easing runs every frame.
  - A building takes the visibility of its walls' feet: "a building lights up when its wall is seen".
- **Memory.** People out of sight are drawn **frozen where they were last seen, mid-step, dimmed**, until that spot is looked at again. Then they've moved on or gone. Per actor the record holds `[x, z, face, gait, stride, ms, look key]`. Forgotten beyond 70 m (FORGET_M).
- **Camera lean** where the eyes go: walking 1-2.5 m, looking with E held 1.5-8 m (LEAD_M), eased over 0.35 s (the user, 2026-10-26: "targets up and down are out of the field of view").
- In a fight, a landing blow jolts the picture 1-3 px for 4 ticks (SHAKE_TICKS).

### 4.3 Everyone else

- NPCs see by the same rules. **A check against us needs us in the checker's sight.**
- An NPC's new awareness shows over their head while we watch them: **"?"** half-noticed, **"!"** has seen us.
- Passers-by turn their heads to someone running past, or to someone staring at them from close by (E held, 1.5 s).

### 4.4 Knowing only what we know (the user, 2026-10-26)

- "We learn of what we see." A target's look back that we didn't see isn't narrated. The **result paper** tells it afterwards ("what you didn't see"), and the change in him may be noticed later (Awareness).
- "What a tail writes down, what a target saw while we weren't looking, whether a meeting was watched: the character doesn't know, so the player isn't told." Caught at it (a roll), the line is **hedged** ("she may have seen you check"). In full only in debug mode.
- **Skill reads the signs** (the user, 2026-10-26). A failed roll for noticing signs "reads exactly as a month without signs: no hedging ('as far as you can tell') and no other clue to what hasn't reached the character".

### 4.5 Looking back

E tapped is an action: the eyes go over the shoulder for 1.2 s, walking on. Whoever has us in sight may notice it (our Deception vs their Awareness): "someone who checks behind them has something behind them". The scenes count glances. Stress at "frayed" (75+) makes unintended glances (section 21).

**OLYMPUS:** reuse the perception model almost entirely: cone + awareness radius + light-limited range + wall occlusion + frozen memory + same-function-for-screen-and-dice. Adapt it for:
- Ship interiors and habitat corridors: tile or wall grids instead of street rectangles.
- Helmets: a visor narrows the cone and maybe blocks peripheral awareness.
- Vacuum: no sound, so the "footsteps" awareness radius should shrink or vanish outside atmosphere, except through vibration in a deck or suit radio. This is a strong realism hook.
- Light: Mars surface is about 43% of Earth's sunlight, Europa about 3.7%; shadowed craters; helmet lamps make their own "pools".
- Thermal/IR or helmet HUD sensors as extra "felt" channels (see section 5).

The shop-window mirror is street-specific. Skip it, or reuse its mirror math for reflective visors, polished bulkheads or security-camera monitors.

---

## 5. The feel: instinct as perception (`src/sim/sense.js`, 179 lines)

DESIGN lines 317-322 (0.1.0-rc54, 2026-10-31). The user: "Tradecraft and other skills like tracking should give us some sort of instinct that allows us to 'feel' when we're being watched (to an extent, dice rolls) giving us a sort of intuition materialized by seeing what we're not looking at (reveal part of the map in our blind spots). The same logic should show us where whoever we're tailing has gone to. It so that some operative with 80 tradecraft+ is sort of a super officer capable of tailing from insane distances with zero chances of being made in effect, while being almost impossible to tail without them knowing."

- A scene names who's watching (`eyesOn`) and whom you're after (`quarry`).
- **The roll:** d20 + skill + Tradecraft bonus os^2/400 (30 -> 2, 40 -> 4, 60 -> 9, 80 -> 16, 95 -> 23), drawn from its own RNG stream "so nothing else's dice move".
  - **Eyes on you:** every 6 s, for each watcher with you in their sight. Awareness vs DC 24 + their Deception + 1 per 8 m.
  - **Your quarry:** every 4 s while your eyes don't have him. Tracking vs DC 30 + 1 per 8 m (+3 indoors, +4 on another street).
  - Reach limit: 12 m + total^2/10 (FEEL_BASE_M, FEEL_K). A miss says nothing.
- **Grades by margin** (GRADES):
  - margin >= 10: a sure, wide patch, 6.5 m, lasting 9 s (until the next roll)
  - margin >= 4: clear, 5 m, 6 s
  - margin >= 0: a flash, 3.5 m, 3.5 s, slightly offset
- Patches lift the fog mask "in a cold tint" (the mask's second channel). Whoever is in a patch is drawn, `inView()` of them is true, and so a tell can be read. Felt but off-screen: a blue plaque at the screen edge says who and how far. A quarry leaves a dim trail (TRAIL_R 1.7, every 2 m, at most 9 points). With nothing else to follow, the camera leans toward what's felt.
- A face felt at the top grade (margin 10) counts as "having followed you" (not again within 20 s). So three of those make "a tail" with no test move. Short of that it's "a feeling, not evidence".
- Past Tradecraft 50, the all-round awareness widens (section 4.1). Acts can go unremarked: Deception + Tradecraft vs 24 + Awareness.
- **Hunch / false alarm:** below a feel of 30, now and then (every 40 s check) a flash round a passer-by, worded as the faint real thing. "Only a master's feeling is a fact."
- Measured by bots ("up the ladder"): Handler (38) felt a covert team 5 of 6 evenings, 49 s in; Tradecraft 60 all 6, 6 s in; 80/95 all 6 and called a tail.

**OLYMPUS:** the soldier class already exists in `src/sim/skills.js` with overskill **"Warfighting"** and empty weights. The feel maps naturally onto a soldier's combat awareness: feeling a sniper's eyes, a contact behind a bulkhead, where a fleeing target went. A special-forces operator with high Warfighting becomes the user's "super officer" analogue. Adapt the module. The mechanics (periodic rolls, grade -> patch radius and duration, reach growing with the skill squared, a false-alarm hunch for low skill) are generic. The scene coupling (`eyesOn`, `quarry`, street rows, `Z` lanes) must go.

---

## 6. Skill growth by experience (`src/sim/xp.js`; 0.1.3, 2026-11-03)

DESIGN lines 323-327. The user, after a legend went from 95 to 97 on one tail: "tradecraft increase should be heavily logarithmic, taking A LOT of missions to improve significantly as we get better ... add a XP system with difficulty and mission classes, difficulty and risk increase the amount of XP, riskier stations would carry more ... losing a tail would bring more XP than not doing anything wrong as we're being watched, and each successful roll should bring in some XP".

- **XP per assignment** = class x outcome x difficulty x risk.
  - Class (MISSION_XP): asset meeting 12, tail 10, photograph 10, range 6.
  - Outcome: done well 1, soft print 0.7, called off rightly 0.8, called off for nothing 0.25, failure 0.1-0.4.
  - Difficulty: target craft careless 0.85 / trained 1.15 / jumpy 1.25 / sharp 1.35; team on you none 1 / overt 1.2 / covert 1.5.
  - Risk: station Moscow 1.4, Beirut 1.3, Cairo 1.2, London 0.8; +0.5% per heat point over 20; trip abroad 1.2.
  - Example: an asset meeting in Moscow, clean, is 16.8 XP; under a covert team 25.2.
- Shaking a team off: +6 overt, +10 covert. **Every roll that goes your way: +0.1** (about 3 per evening's tail).
- Cost of the next point: `cost(os) = round(8 x 6.25^((os-20)/20))` (COST0 8, COST_FROM 20). That gives 8 XP at 20, 20 at 30, 50 at 40, 312 at 60, 1,953 at 80, about 7,700 at 95: **x6.25 every 20 points**. "A legend barely moves." The debrief says what was earned and how near the next point is.

**OLYMPUS:** adapt for military progression (Warfighting, Weapon handling, Medicine, Fitness). Mission class x outcome x difficulty x risk (combat zone, enemy quality), plus micro-XP per successful roll, plus a log-like cost curve. This matches the user's "realism" taste: training days should move skills slowly, live operations faster. Note that tradecraft also has training (`training.js`), rust (`rust.js`) and fitness weeks (`fitness.js`). Those are covered in other slices.

---

## 7. Observation, tailing and being tailed (tradecraft-specific scenarios, condensed)

DESIGN lines 329-373; `src/sim/scenarios/watch.js`, `tail.js`, `sdr.js`, `src/sim/habits.js`, `src/sim/instinct.js`. These are the spy game's mechanic tests. For OLYMPUS they matter as **patterns for NPC suspicion and detection**: insurgent spotters and crowds during peacekeeping, sentries and patrols during special ops.

- **Observation** (Q142; test 0.1.0-rc11, 2026-10-27). Hold E to watch someone: time passes and their sheet reveals itself by checks; staring too long risks their Awareness; P takes a photo.
  - A minder sweeps the street every 8 s and adds suspicion for loitering with no reason within 30 m for 40 s (+3), staring (+4) and a camera raised (+6), against your Deception. A shop window, kiosk, bench or café table counts as a reason.
  - Photo: Tech vs 8 + distance/3, within 32 m by day (20 at dusk, 12 under lamps). Made by 3 is sharp, made is soft, missed is a blur. The frame as drawn becomes the result paper's print.
- **Tailing** (Q143; test v0.0.21, 2026-10-26).
  - The target runs a careful man's habits: a look back every 55-100 m (35-65 m when wary), shop-window glances, lane-mouth and zebra checks. That makes about 14 checks a calm walk, 23 a wary one.
  - Most checks come with a **tell** of 1.6-2.6 s ("he slows, drifts to the glass") that an Awareness roll can read.
  - Each check is a **scan**: the first moment we're in his sight, he rolls Pathfinding vs our Deception. Main modifiers: distance (<5 m +6, <10 m +3, >15 m -2, >25 m -4, >35 m -6), across the road -3, crowd -2 to -4, dark -4, running +6, stopping when he stopped +3, at a shop window or bench -3.
  - **Twice and you're made.** Near things raise his alertness (0-100), which shortens his check interval. Seen once, he dry-cleans: 14-22 m back, then a longer way.
  - **No arrow over him** (the user): a marker for the first 30 s, then your eyes. A close look (E held 2 s within 24 m) tells him from grey-coated decoys. Not seen for 90 s, he's gone.
  - Balance by the follower bot: ours 15 vs his 5 = 88% success, vs 10 = 71%, vs 15 = 4%. At equal bases he wins 3 evenings in 4 ("d20 against d20 is a wide spread").
- **The instinct's voice** (v0.0.46, 2026-10-27; the user: "we need a serious instinct overhaul, it is mostly useless, giving advice that doesn't even apply to some situations").
  - A list of rules, tested every tick. The shown line stays while its rule fires and nothing more pressing does, and goes the moment it stops applying.
  - Where nothing applies, it states the situation (gap in metres and its trend, people between). "The voice of training, with dry humour now and then" (the user).
- **Being tailed** (test v0.0.24, 2026-10-26).
  - The evening draws nobody (3 in 10), an overt pair 8-13 m back, or a covert team of three 17-26 m back handing over every 70-110 s.
  - **"They go by what they've seen"** (0.1.0-rc56; the user, 2026-11-03: "does the tailing parties also roll to decide if they still know where we are? It seems like they always see me even at night … they also see me through walls and in buildings?").
    - The team shares by radio only the last sighting and heading (3 s relay). Out of sight, they go there plus 4 s along the heading.
    - Losing you triggers a Tracking vs Pathfinding roll; won, they read where you went (6 s).
    - Lost after 40 s (overt) or 30 s (covert) unseen.
  - Spotting them: Pathfinding vs their Deception (overt 5, covert 18, passer-by 2) at check moments. Twice is "seen before", three times "a tail".
  - "Seen again" only counts when a face copies a move it had no reason to copy (stopping, crossing, reversing with you). "Confirming a tail takes moves that test it, which is the trade's own rule."
  - **What they write down** (running, a glance back, a shop-window check at +5 to you, jaywalking, doubling back) costs 3 heat each. You don't know unless you catch them at it.

**OLYMPUS:** reference only for the scenarios. Reusable ideas:
1. NPC checks as **scans with a readable tell beforehand**.
2. Accumulating **alertness** that shortens the check interval.
3. **"Twice and you're made"** thresholds.
4. Teams that share only **last-seen position + heading by radio**, never omniscience (the user's 2026-11-03 complaint).
5. The instinct as a **priority rule list**.
6. **Bot-measured balance grids** in the tests.

---

## 8. Travel and transit (reference/skip for OLYMPUS, condensed)

DESIGN lines 374-391; `src/sim/buses.js`, `transit.js`, `metro.js`, `taxi.js`, `traffic.js`; `src/ui/tubemap.js`.

- **Travel** (Q151): metro, bus, taxi or car between points of interest. Transit is a playable map when it matters, otherwise a cutscene.
- **No skipping the commute** (0.1.0-rc50, 2026-10-29). The user: "we should not have the option to just fast travel to work, it would skip all the gameplay like shaking watchers etc., same with going back home". **Taste to carry over:** never offer fast travel that skips the gameplay the trip contains.
- **A real network** (0.1.0-rc23, 2026-10-27; the user: "make sure we can take buses, underground (especially in london) where applicable"; "buses and trains would not drop you off anywhere, they would have a city network and stations").
  - Bus lines of 16 stops, at least about 300 m apart (0.1.19, the user: "bus stops should never be this close together"). A bus every 6-12 min, doubled at night; it waits 20 s with its doors open. **The destination card stops the clock.** The ride is skipped time.
  - **Graphical metro map** (0.1.0-rc36, 2026-10-28; the user: "The underground selection should be graphical with points of interest drawn on the map"): lines in colour, ticks and change rings, names placed without overlap, you in yellow, walked streets brighter, known places coloured, keys 1-9 to the posting's places.
- **Who rides with you** (bus rc44, metro rc39, cab rc43, all 2026-10-29). Followers within 25-30 m who saw you board come along.
  - Each leg is Deception vs Tracking: +2 to them on your heels within 8 m; +2 to you in rush hours; +4 to you stepping off as the doors close.
  - Kept, they surface 4-12 s after you.
- **Taxi hailed for real** (the user, 2026-10-27: "hailing a taxi should be fully animated, and only available when a taxi is close ? and they could be already busy and ignore us").
  - A free taxi (roof light lit; 35-70% of taxis by hour) 12-90 m off in your lane is required.
  - The arm goes up; it brakes, eases 0.7 m to the kerb, stops with its back door by you and waits 25 s. The picture rides with it 3.5 s, then the ride is skipped.
- **Traffic** (0.1.0-rc17): a car every 8 s by day (13 evening, 32 night) at 32-45 km/h. Cars stop for zebras and for people in the road. Stepping out under a car's nose: a horn, stress +8.

**OLYMPUS:** skip the city transit code. Keep these patterns for habitat trams, Mars tube trains, elevators, drop ships, shuttles and long Epstein transits:
- The vehicle waits with its doors open, then a stopped-clock destination card.
- The ride is skipped time, with outcomes for the gap.
- Pursuers who saw you board ride along by opposed rolls.
- A graphical network map with known places.

The user's "space being big and travel taking a long time" makes multi-day skips central.

---

## 9. Conspicuousness: blood, weapons, bulges (`src/sim/notice.js`, 64 lines)

DESIGN line 375 (0.1.0-rc9, 2026-10-27; the user: "conspicuous wounds and blood (more heat, faces remembered), cleaning up in public toilets and businesses with toilets").

- Blood on the face (a head wound) or clothes (anything else) is seen by whoever is within 10 m (SEEN_M) and can see you. Every 20 s a bloody face is seen (40 s for a stained coat) costs +1 heat, at most 6 a day.
- For anyone looking for you, what shows is a modifier: bloody face +4, stained coat +2, something in hand +3, a weapon in the beltline with no covering top +2, a pocket bulging past 60% +1, a sneeze (sick) +3 for 6 s.
- Washing: a café, bar or restaurant toilet (90 s) washes the face. Worn blood fades in a day anyway.

**OLYMPUS:** adapt. Conspicuousness modifiers carry over to peacekeeping and covert special ops: weapon carried vs slung vs holstered, a uniform vs civilian clothes, blood and wounds. The heat system itself is spy-specific; OLYMPUS would map it onto local hostility, rules of engagement and command discipline.

---

## 10. Places to watch from, and walking into shops

DESIGN lines 376-379.

- **Lateral observation spots** (0.1.0-rc10, 2026-10-27; the user: "lateral observation spots: bus shelters, kiosks, phone booths, car windows, café tables, notice boards"):

| Spot | Time | Effect on a tail target's look | Being-tailed look at faces |
|---|---|---|---|
| kiosk | 25 s, $1 | -2 | +1 |
| phone box | 45 s | -3 | +2 |
| café window table | 3 min, a coffee | (inside, out of the street's sight) | +2 |
| bus shelter | sit | -3 | +2 |
| notice board | 30 s | -2 | +1 |

- **Bus shelters** (0.1.0-rc16): procedurally placed, a shelter in about half of sections (one per 115-145 m), 3.2 x 0.65 m, open front, city-specific fascia text (ОСТАНОВКА / BUS STOP / موقف), lit at night. Generated "from a stream of their own so nothing else on the street moves".
- **In a shop** (0.1.0-rc9 menu; walked in since rc24, 2026-10-27; the user: "doing the things like going out the back should be a thing we do when inside and not abstracted"):
  - Every shop has a real ground-floor interior: front room 4.8 m deep, back room 3 m behind a staff door, sometimes a back door.
  - Furniture by kind from a kit: a grocer's shelves and fridges, a bakery's display and oven, a café's counter, window ledge, kitchen and toilet, a clothes rail and fitting room.
  - Someone behind every counter (view-only). Lamps lit at night, so occupants are seen through the glass from the dark. Walls stop the eyes; glass stops the feet, not the eyes.
  - T at points: counter (browse, bite, clothes, goods, books, the hours of a gym, club or school), window ledge (coffee lived 3 min, or a book), basin (wash), back door (by kind: café 85%, restaurant 90%, bar 80%, grocer 70%, clothes 50%, books 40%; never bank, pharmacy or exchange; 20 s across the yard into a lane within 30 m, 7 m up it).
  - **Dollhouse cutaway view** while inside (`src/render/cutaway.js`): the building as it stood, with the shop's slot cut from pavement to roof, the cut hatched like a section drawing, upper floors marked by their slabs.
  - NPCs visit shops too (0.1.0-rc41): in at the door, round the furniture at 1 m/s to the counter, 20-45 s, back out.
  - Followers wait on the pavement in view of the door for 2 minutes, then they've lost you.

**OLYMPUS:** reference. The base's facilities (mess, showers, latrines, armoury, infirmary, gym, PX, barracks bunk) are OLYMPUS's "shops": walked-in interiors with appliances and T/R points that start time-skipping actions. The **cutaway dollhouse view** is a good idea for multi-deck ship interiors seen top-down.

---

## 11. CQC: close combat in stop motion (`src/sim/cqc.js` 473 lines, `fight.js` 206, `cqcshow.js` 136, `cqctext.js` 217)

DESIGN lines 392-410 (built v0.0.35, 2026-10-26; numbers mostly "my calls" except where the user is quoted).

### 11.1 Core loop

- **Rock-paper-scissors, second by second, with time paused until you choose.** K hits, L grapples, M guards. Guard beats hit, hit beats grapple, grapple beats guard.
- Each exchange: **their move is chosen first, then ours.**
  - Guard vs hit: blocked, and the guard earns an edge.
  - Hit vs grab: lands clean, x1.5 (CLEAN_K), the head more often.
  - Grab vs guard: a throw, 3-5 to the torso (THROW_PTS).
  - Same move both ways: an opposed CQC roll, ties to us. The winner's hit lands; the winner's grab throws; two guards circle.
- A hit does 2-5 points (HIT_PTS) to a part, plus 1 per 5 points of CQC the hitter has over the other (EDGE_PER_PT). Where it lands (HIT_AT weights): torso 45, head 30, arms 8 each, legs 4.5 each. Hurts then cost that fighter's CQC (section 16).
- Fight gap 1.5 m (FIGHT_GAP_M).

### 11.2 Intent read

- A higher CQC gives a chance to see the opponent's next move: **6% per point of CQC over theirs, at most 90%** (READ_PER_PT, READ_MAX). Ours shows over them before we choose (their move, or "?"). Theirs answers our move with what beats it. **Only the better fighter reads at all.**
- Their choice otherwise: a style mix (even, striker, wrestler, careful), turned against the move we lean on. That is 2% per point of their CQC, at most 70% (ADAPT_PER_CQC, ADAPT_MAX), over our last 4 moves, each earlier one weighted 0.6 of the next. When our last move beat theirs, 70% of the time they "think a step further" and play our own move back (0.1.0-rc8: the reviewer won 68% of even bouts playing the counter-counter; now 61%).

### 11.3 Advantage points ("edges")

- A successful guard against a hit grants one, up to one per 10 CQC (at least one).
- **Zero-sum** (v0.0.44, 2026-10-26, the user: "when gaining advantage if the opponent has points, it should remove their points before adding some to us").
- Spent with the move, Shift held, and only if it does something: with a hit, double damage if it lands; with a grab, a punch walked into does nothing; with a guard, a throw is stopped.
- **The riposte** (v0.0.40, 2026-10-26, the user: "when you block normally you get an advantage, when you block with shift, you keep the advantage point and also hit back"): a cover with Shift and an edge in hand that meets a hit answers at once for 1.5x a hit's damage (RIPOSTE_K), mostly to the head, and the hitter is **dazed**. The edge is kept. Result: hitting into someone far better (CQC 8 into 26) ends a bout in under four exchanges.
- **AI edges** (the user: "AI doesn't use their advantage… using it when you can't read the opponent"): not reading you, they spend one 70% of the time (SPEND_BLIND); reading your hit, they riposte; at max, now and then. Never on someone stunned in a bout (a foul).

### 11.4 Techniques by level (v0.0.37, 2026-10-26; the user: "we could also hit with other body parts depending on the CQC level, beginners would only punch")

The move is chosen; how it's done is the fighter's level (TECHNIQUES):

| Move | Level -> technique |
|---|---|
| Hit | <7 slow wide swing; 6 jab; 8 cross; 11 hook; 13 front kick; 17 elbow, knee; 19 low kick (staggers); 22 palm to the jaw (may stun); 26 kick to the head (may stun) |
| Grab | <9 shove (staggers, no throw); 9 hip throw; 14 sweep; 21 arm lock; 27 choke (may stun) |
| Cover | block; 12 parry; 20 slip (both may leave the attacker off balance) |

### 11.5 Handicaps (v0.0.40, 2026-10-26; the user: "stuns and dazes should have effects like preventing blocks or hit or grab")

| State | Trigger | Effect next exchange |
|---|---|---|
| staggered | a blow taking 30% of a part's capacity (STAGGER_AT), low kick, shove, parry, slip | no grab, -3 |
| dazed | a head blow taking 25% (DAZE_AT), 50% of the time; a riposte always; palm, head kick, choke likelier | no cover, -4 |
| stunned | a head blow taking 50% (STUN_AT), 60% | nothing at all: whatever comes lands |

None of the three reads anyone. A forbidden move does nothing, and the move panel greys it out. The instinct line states the status and its meaning in any fight (v0.0.43, the user: "instinct reminders about dazed (us or opponent), staggered and stunned").

### 11.6 Fight enders (v0.0.43, 2026-10-26)

The user: "when hitting a stunned opponent with advantage, we attempt a fight ender since they can't defend, hits try to knock them out, grabs try breaking limbs (if skilled enough, otherwise it's just a crazy charge and we slam them against the floor …) it's a CQC check against a difficulty derived from their CQC and fitness. If check is failed, damage is still increased and likely to result in a crack, fracture or other long term injury. Doing so during a friendly bout is considered a breach of ethics … such a hit can result in death".

- Shift + hit or grab on a stunned opponent is a CQC check vs **DC = 4 + their CQC + floor(their Fitness / 2)**. Between equals that succeeds 75%; CQC 10 on 20, 26%; 30 on 24, 96%.
- Hit: knockout. Grab: from CQC 21 (BREAK_CQC) a broken arm or leg (they give up); below that a slam into the floor (down).
- Failed: double damage anyway, and a fracture 45% of the time (FRACTURE_ON_BOTCH: broken jaw, eye socket, ribs, forearm or shin; -3 to the part, the jaw -2 to everything, 6 weeks) or a crack.
- **Death chance** on a knockout or slam: `min(0.6, 0.02 + 0.5 x max(0, wear - 0.35))`, halved if botched, where wear is the average head+torso damage share. Someone at 60% worn: 14.5%.
- They do it to you too when you're stunned and they hold an edge (a grab 40% of the time from someone able to break an arm). In a bout it's a foul: nothing pulled, the bout lost, the instructor's opinion with it; killing a classmate ends the course.

### 11.7 The picture and the words

- `cqcshow.js` (v0.0.37, the user: "animations should be sped up and have more impact", "take CQC level into account"). Each exchange is a timeline of ticks:
  - a wind-up, long for a beginner, a flick for an expert
  - the strike with a lunge step (hit 0.42 m, grapple 0.5)
  - the impact held 3 ticks (0.15 s, HITSTOP) with the picture jolting 1-3 px
  - knockback 0.35-0.85 m by force (KNOCK_M), reeling, staggering or standing dazed
  - a throw puts them down 0.7 m back (DOWN_M); they get up through a kneel
  - An exchange runs 0.45 s (an expert's blocked kick) to 0.95 s (a beginner thrown).
  - **No sparks** (the user).
- `cqctext.js`: each exchange told from our side in lines picked from many, by technique, outcome, part and force (light, solid, heavy, brutal); "theirs as it looks, ours as it feels".

### 11.8 Ending and balance

- A real fight ends when someone is out cold, down or can't stand. A **bout** (sparring: blows at half, BOUT_K 0.5) goes to 3 points (a hit or shove 1, a throw, lock or choke 2), stopped if a head or torso is wounded.
- Balance (`node tests/run.mjs cqc`, bouts to three): CQC 8 vs 2 wins 83%, vs 8 53%, vs 14 17%, vs 30 1%; 20 vs 10 98%.
- Who can fight (0.1.0-rc7): passers-by 0-8 (most 0-3), FSB watchers 12-18, a former officer 10, his contact 15, a source 2, hunters 11-14.

### 11.9 The dojo tutorial (v0.0.35; the user: "a demo starter in a CIA dojo where young agents are taught how to fight, it will serve as a tutorial for CQC")

- The Farm, week six, in gym kit. The instructor Hale calls drills: cover a punch, grab a cover, hit a grab, mixed, spend an edge. Then bouts to three vs a weaker classmate (you read them a third of the time), an even one, a better one (CQC 11 vs your 8), and Hale (CQC 30, reads you 9 times in 10). Bruises stay on your sheet.
- **"The Farm, remembered"** (v0.0.41, the user: "once we did it once, remember it so next time … snap flash forward to the last part about fighting the three trainees and Hale, then change of scenery").
  - Once done, the title offers it as a memory: straight to the four bouts. When Hale's ends, you hit the floor, and it isn't the mat.
  - A white flash, and Moscow nineteen years on: on your back on cobbles, a real fight vs an FSB officer (CQC 24) with your CQC 30.

**OLYMPUS:** adapt cqc.js nearly as is. It's pure, data-driven and tested. Changes:
- Armour and helmets: tradecraft already has `src/sim/armour.js` (247 lines) for plates and soft vests in fights.
- EVA suits: suit integrity as a damage target; a grab on a hose or seal as a special technique.
- Low g: throws last longer and send people further, footing for grabs is poor, and in zero g there's no "down" (grapples dominate, hits lack a base).
- Military CQC syllabi (MCMAP-like belts) as the technique ladder.

A boot-camp or MCMAP sparring tutorial with a drill instructor is the OLYMPUS analogue of the dojo, and the "remembered, then flash forward to the real thing" device fits a marine's career start.

---

## 12. F: what you can do with someone (`src/sim/interact.js`, 291 lines)

DESIGN lines 411-415 (v0.0.40, 2026-10-26, the user's: "the interact button F that when close to someone should open the contextual menu to do things like TALK, VIOLENCE … READ").

- Whoever is within **1.8 m** (REACH_M), in front first, then nearest. A key shows over them. A menu picks by number or click. Each option is `{ id, label, ok, why }`: **greyed with the reason** when not possible.
- **Talk:** a conversation, **time standing still as in a fight** (the user: "talk should pause the game, like combat"). Ask the time, the way, small talk, leave. Their answers depend on how they feel about you (afraid, cold, neutral, warm). "A KLM-style minigame will come"; conversation proper is mechanic test 4.
- **Violence** openings (OPENINGS) start the fight's first exchange on the spot:
  - hit
  - **sucker punch**: they mustn't see it coming, so out of their sight or your Deception vs their Awareness. It lands on them open with an edge spent: double, may stun.
  - push (a shove: off balance)
  - grab (CQC 9+, GRAB_CQC)
  - stab (needs a blade)
  - Caught unawares, they're open. After every exchange, someone who won't fight on runs (a civilian, hurt, outclassed). Out cold, they lie 60 s (DOWN_S). Witnesses within 25 m remember a face: heat +1 each, up to 6, x4 for a killing (KILL_HEAT_K). Victims fear you afterwards.
  - Someone carrying a blade draws it when the fight turns against them ("Steel"): at 20% wear (DRAW_HURT), a criminal at once.
- **Someone on the ground** (0.1.13, 2026-11-03; the user: "violence in that context should be things like 'tie down' or other options to kill them with what we have on us (knife is different than gun or bare hands)"). Out cold, shot down, collapsed or tied: no openings, no talk. Instead:

| Action | Time | Notes |
|---|---|---|
| tie them up | 60 s (TIE_S) | their own belt and laces; down till freed |
| search | 20 s (SEARCH_S) | what they carry; weapons taken if there's room; a vest found |
| strip armour | heavy 60 s, light 120 s, helmet 15 s (STRIP_S) | |
| kill with a blade across the throat | 4 s | |
| kill with something heavy | 8 s | |
| kill with the gun to the head | 1 s | the shot is heard |
| kill with bare hands | 150 s, x1.6 if a CQC roll vs 8 fails | |

  Each is done crouched over them for its time; moving first does nothing. Seen as a fight is. The dead can only be searched.
- **Read** (the user: "display the guessed character sheet of someone else, analysis skill drives how good we are at it, as well as what we discovered about them"; `src/sim/know.js`):
  - An Analysis check, DC 12 (-2 at distance, -3 in the dark), on what shows at a glance: Fitness, CQC, Awareness, Weapon handling.
  - Each comes back as a **range that holds the truth, never centred on it**. Width is 8 - margin/2.5 (at least 1) on a success, 12 on a failure. Each read narrows them.
  - Margin 4 tells the class (civilian, police, soldier, one of the trade, criminal). Margin 12 tells how well trained (little, trained, well, very well).
  - A fight tells bounds: beaten by them, their CQC is near yours or above; beating them, not far above.
  - Kept between encounters, shown on their sheet as guessed. A fight auto-reads on squaring up and every 4 exchanges (v0.0.44, the user: "during combat it should automatically do READ against our opponent").

**OLYMPUS:** adapt. The F menu with greyed options and reasons, talk pausing time, openings, downed-person options (restrain with zip-ties as kit, search, strip armour, first aid, drag) and Read as ranged, never-centred estimates. All of it fits a military game: restraining a detainee during peacekeeping, assessing a hostile. Add military-specific options: order (halt, hands up, get down), escort, hand over, frisk.

---

## 13. Knives, improvised weapons, and carrying

DESIGN lines 416-422 (v0.0.45, 2026-10-26; the user: "create variety of knives and improvised weapons to populate the world with, fight is still CQC and works the same"); `src/sim/weapons.js` (106 lines), `src/sim/items.js` (278 lines).

### 13.1 The nineteen weapons (WEAPONS table)

k = damage multiple of a fist; bleed = cut multiplier; guard = how well it blocks; grab = penalty to grabs; awkward = penalty to every roll.

| Weapon | kind | k | bleed | guard | grab | awkward | carry | special |
|---|---|---|---|---|---|---|---|---|
| penknife | knife | 2.2 | 1.0 | 0 | 0 | 0 | pocket | |
| box cutter | knife | 1.6 | 0.9 | 0 | 0 | 0 | pocket | |
| switchblade | knife | 2.4 | 1.1 | 0 | 0 | 0 | pocket | |
| kitchen knife | knife | 2.6 | 1.3 | 0 | 0 | 0 | belt | |
| finka | knife | 2.7 | 1.3 | 0.1 | 0 | 0 | belt | |
| combat knife | knife | 2.9 | 1.4 | 0.2 | 0 | 0 | belt | |
| screwdriver | point | 1.8 | 0.8 | 0 | 0 | 0 | pocket | |
| bottle | blunt | 1.3 | | 0.1 | -1 | 0 | hand | breaks 45% into a broken bottle |
| broken bottle | blade | 1.6 | 1.1 | 0 | -1 | -1 | hand | |
| half a brick | blunt | 1.8 | | 0.2 | -2 | -2 | hand | |
| hammer | blunt | 1.8 | | 0.4 | -1 | 0 | belt | cracks bones (+0.3) |
| spanner | blunt | 1.5 | | 0.5 | -1 | 0 | belt | |
| pipe | blunt, long | 1.7 | | 0.85 | -3 | -1 | hand | |
| crowbar | blunt, long | 1.9 | | 0.9 | -3 | -1 | hand | |
| stick | blunt, long | 1.15 | | 0.6 | -2 | 0 | hand | |
| umbrella | blunt, long | 0.8 | | 0.4 | -2 | -1 | hand | "an umbrella is not a weapon ???" (the user, 2026-11-04): everyday, never suspicious |
| snow shovel | blunt, long | 1.3 | | 0.75 | -6 (no grab) | -3 | hand | |
| bike lock | blunt | 1.9 | | 0.7 | -2 | -1 | hand | |
| chain | blunt | 1.4 | | 0 | -3 | -2 | hand | |

### 13.2 Fight rules when armed

- A hit is mostly the weapon's: slash, stab, club, or thrust with the end of a long thing. The trained use it 75% of the time (kicks, knees, elbows the rest, never a punch with the knife hand); the untrained 92%. Armed technique targets:
  - slash: head 32, torso 44, arms 10
  - stab: torso 68, head 10
  - club: head 50, torso 28
  - thrust: torso 60, head 40
- A cover is held with the weapon if guard >= 0.4. Blocking a blade or heavy weapon with less than SOLID_GUARD 0.8 (a pipe or crowbar) is a CQC roll for a clean block. Lost, it comes through at 40% of a blow (THROUGH_K), mostly into the forearms (36 each), never past 60% of a part (THROUGH_CAP). Between equals it comes through 46% of the time; for the better blocker 12%, the worse 83%.
- A grab with a full hand pays the weapon's grab penalty and may fumble (8% per point; a pipe 21%, a knife never). A grab that lands may disarm: arm lock 50%, throw 15%, sweep 15%, choke 20%, shove 8%. The weapon lies where it fell.
- **Armed, Shift + hit on a stunned opponent is an attempt to kill** (the user). Same check as a fight ender; failed, a terrible wound that may kill anyway.
- Balance: CQC 10 with a penknife vs 10 bare-handed wins 50% (35% bare); 20 bare-handed vs 10 with a kitchen knife wins 80%.

### 13.3 In the world and on the body

- **Lying about:** made from the street's seed (never inside a blocker), by place (bottles by bins, pipes and bricks down alleys, a shovel by an arch, a stick under trees, a box cutter by a shop door). About two every 45 m. Picked up, gone from there for good; dropped, it lies where it fell (`state.items.taken`, `state.items.dropped`).
- **Carried** (the user, 2026-10-26: "no backpack or similar yet, so only pockets and weapons can be shoved in our beltline"):
  - In a pocket, tucked in the beltline (two), or held.
  - T (now R) picks up what's within reach (1.1 m, REACH_M) into the hand. G takes out the next weapon or puts it away; in a fight, that exchange you can only cover. I shows what you carry (take out, put away, drop).
  - What's in your hand shows under the watch on the HUD and in the sprite's hand.
- **Others:** a passer-by mostly carries nothing (about one man in 15 has a penknife, switchblade, box cutter or screwdriver), from their own seeded stream.

---

## 14. Guns (slice line 423), and the Firearms section it defers to (lines 637-679, cross-reference)

The slice itself says only this: "G draws a gun ... Every draw, shot and reload is a Weapon handling check, with fumbles on failure; a natural 1 can mean a shot in the foot. Shooting is paused second by second, like CQC: pick a target, then a Weapon handling roll against distance and cover (Q146)." Reload's key "when guns come" was R, which became "use what's at hand" in 0.1.0-rc29.

What was built is in DESIGN.md lines 637-679 (another research note should cover it in depth). The essentials, because OLYMPUS's weapon handling hinges on them:

- **The user, 2026-11-03:** "The goal isn't to make this a third person shooter or similar. Shooting is going to be integrated in a stop motion way, heavily relying on the weapons skill."
- **A gun is a stateful object** (`src/sim/firearms.js`, 487 lines; 44 MODELS). It tracks:
  - its magazine (an object `mag#n`, rounds counted, one model's)
  - the chamber (live / dud / spent case / empty)
  - a jam
  - the slide locked back
  - the safety (if the model has one)
  - condition (worn by firing and neglect)
  - **whether the holder knows what's in it**
  - Rounds are named calibres (0.1.7: "ammunition shouldn't be 'rounds' it should be very specific calibers"), 20 a box.
- **Every action has a base time and a Weapon handling roll**:
  - draw from a beltline holster 1.0 s / coat pocket 1.6 / inside pocket 1.7 / trouser pocket 2.3 / bag 4
  - safety 0.4 s
  - rack 0.8 s; slide release 0.3 s
  - magazine out 0.5 s dropped / 1.4 s kept; magazine in 1.4 s
  - jam drill 4 s; press-check 1.6 s; chamber by hand 3 s
  - fill a magazine 2.2 s a round; put away 1.3 s
  - Time is multiplied by a pace: untrained 1.6x, Handler (7) 1.4x, expert (21) 0.9x, master (31+) 0.5x. The thumb's work (safety, selector, decocker) uses pace squared.
- **Fumbles** (0.1.7: "fumbling should have consequences … accidental discharge and the bullet should potentially actually hit something depending on what we're facing"):
  - short by under 6: +60% time
  - by 6: dropped
  - by 10 with the gun ready: it goes off
  - On a discharge while drawing, a third of the time the round goes into your own leg.
- **Muzzle discipline** (0.1.11; the user: "high weapons skill should at least protect in ways of muzzle discipline allowing us not to shoot some random civilian in the head"): a fumbled discharge points somewhere safe 0% untrained, 29% at 10, 71% at 20, 97% from 28.
  - Range safety (line 585): the muzzle is your heading. Past 60 deg off downrange: a warning. Past 100 deg, or aimed at a person: stopped.
  - "Nobody grabs for a falling gun."
- **Stop-motion mode** (X; `src/sim/shooting.js`, 637 lines):
  - Each readying step is picked by a digit from a panel that shows each step's time. **The world advances by that step's time, your feet held, then stops again.**
  - Targets are what's in view and in the frame, within 60 m. Head, body or legs. A plaque shows the odds and range.
  - Mouse pointing (0.1.13: "Make aiming more natural … but no list").
  - "No aim, no shot" (0.1.11).
  - **G with a gun means intent** (0.1.7): it enters the mode with the draw as first step.
- **Aim** = sight picture 0.6 s x pace + turn at 90 + 6 x WH deg/s; past the arms' arc (30 + 2 deg/pt, at most 100) the feet turn. Holding the aim steadies it: +3 a second, at most +4.
- **Shot DC** = 6 + (0.45 m + 0.01 m^2) x gun accuracy.
  - Target: +6 head, +3 legs.
  - Shooter: target walking -2 / running -5; dark -4; being shot at -4; your wounds.
  - Handler hit rates at 3/7/15/25/40 m: 94/89/60/16/6%. Master: 94/94/94/95/41%.
  - Double taps from WH 8, triples from 18 (0.1.27).
  - Cover per object: building 1, car 0.6, bin 1/3, bench 1/4, glass 0 (0.1.38, the user, 2026-11-04).
- **NPCs run the same steps in real time** at their own pace (`src/sim/armed.js`). Being shot at costs your rolls.
- **Gun work at the table** (`src/sim/gunwork.js`): unload, load, strip and clean, fill magazines. Bad fumbles fire into the table, lose rounds, or bend magazine lips.
- **Wounds:** 7 points x calibre x gun; a head shot is fatal 60% of the time. Knockdown times by part, pain and adrenaline (section 15).

**OLYMPUS:** this layer is the user's stated core ("guns played in detail: reloading = remove magazine, insert other magazine, clear chamber, aim etc."; "Shooting should play as in tradecraft, with weapon handling"). Adapt it:
- an MCRN arsenal
- a selector (semi, burst, auto)
- slings (items.js already has a `sling` space, 125 cm, 8 L)
- continuous muzzle tracking everywhere on base, not only at the range
- low-g and zero-g recoil, no air drag
- pressure-hull breach risk inside ships and habitats

---

## 15. Health, part by part (`src/sim/health.js`, 404 lines)

DESIGN lines 424-427 (v0.0.34, 2026-10-26; the user: "health bodypart by bodypart").

- Six parts, damage points vs capacity: **head 6, torso 12, each arm 8, each leg 9**, x (1 + Fitness/20) (FITNESS_K). Fitness 10 gives half as much again.
- States by share of capacity: unhurt; **bruised** (any); **hurt** (1/3); **wounded** (2/3: serious, needs care); **out** (all: an arm or leg broken, the torso down, the head out cold).
- What it costs (shown in the log like any modifier):

| Part | hurt | wounded | out |
|---|---|---|---|
| head | -1 every check | -3 (dazed) | out cold |
| torso (ribs) | -1 CQC and Fitness | -3 | down |
| arm | -1 CQC and Weapon handling | -3 | broken: -4 CQC, -6 with a gun, no grappling |
| leg | -1 CQC | -2, walk x0.8 | broken: -4, hobble x0.5 |

- Mending: bruises and hurts heal by a fifth of capacity a day (HEAL_PER_DAY 0.2). A wound or worse waits for care: tended, it mends at half a bruise's pace (WOUND_HEAL 0.5), and only with nothing on it still wanting care.
- `canStand()`: not dead, not thermally down, not fainted, blood >= 55%, at least one leg not out, torso and head not out.

### 15.1 Injuries besides damage (v0.0.38, 2026-10-26)

The user: "a lot of damage could trigger cracks and some types of damages can cut (not bare handed) and blood can be drawn from getting hit in the face hard enough".

| Injury | Trigger | Effect | Heals |
|---|---|---|---|
| crack (rib, forearm, shin, cheekbone) | a blow taking >= 50% of the part's capacity; chance 0.4 + 2 x (force - 0.5) | -2 to what the part does; cheekbone -1 to everything | 21 days |
| split brow or lip | a face blow >= 30%, 45% chance | bleeds 2-5 min at 0.15%/min | 7 days |
| bloody nose | a face blow >= 20%, 40% chance | bleeds 1-2.5 min at 0.1%/min | 1 day |
| cut (an edge: blade or glass) | any edged hit > 5% | bleeds 3-10 min (shallow); deep: 6 h untended | 10 days |
| fracture | a botched fight ender (45%) | -3; jaw -2 to everything | 42 days |
| blunt (a vest-stopped round) | | bruise, maybe a cracked rib | |

Listed under their part on the sheet.

### 15.2 Blood (0.1.0-rc1, 2026-10-27; the user: "work on the bleeding out system, with blood-pressure health stat")

- Blood volume is % of the body's (p.blood). Each bleeding injury has a rate in % per minute:
  - bloody nose 0.1, split lip 0.15
  - shallow cut (0.3 + 3 x force) x weapon bleed, under 1
  - clean blade hit 1 + 8 x force, x the weapon's bleed (a clean kitchen-knife stab: 5.5)
  - **cut artery** 10-15: chance 15% + 20% x force of a deep cut to a limb or the neck, force >= 0.35, not the torso
- Shallow cuts stop on their own; deep ones and arteries only with care.
- **Thresholds (BLOOD):**

| Blood left | Band | Effect |
|---|---|---|
| < 85% | pale | -1 to everything |
| < 70% | shock | -3, no running |
| < 55% | collapsed | down |
| < 45% | dead | bled out |

  "The figures are the textbook's classes of haemorrhage, roughly." Untended, a clean stab kills in about 10 min, an artery in 4.5.
- **Regeneration:** 2% an hour once nothing bleeds (REGEN_PER_H: "a litre in half a day"; raised from 0.5 in 0.1.0-rc4 because "the reviewer found [it] never came back in play"). Collapsed with nothing bleeding, you come round after 90 s, in shock.
- Rest (H, where time is yours): up to 8 hours somewhere warm, skipped. **Through a skip, it goes on bleeding.**
- **Moving bleeds** (the user, 2026-11-04: "Moving away should increase blood loss if realistic"): x1.25 crawling, x1.5 walking, x2.5 running (EXERTION).
- Adrenaline: 60% pain off for 40 s, fading over 80 s (ADRENALINE). The pain limit is 30 + 2 x Fitness (PAIN_LIMIT).
- Down from a shot: KNOCK_S by part (arm 4-12, leg 10-30, torso 20-60, head graze 15-35 s), x1.3/2/3 by pain band, x1.3/2 pale or shock, x0.4 if trained, clamped 2-180 s (the user, 2026-11-04: "being knocked down is a logical result of getting shot. Staying down should be justified (pain level, shot in legs, blood loss, loss of consciousness)").
- **On screen:** the sheet shows your blood; **the screen's edges darken as it goes**; the instinct says when you're bleeding and how fast.

### 15.3 Blood on the ground (`src/sim/blood.js`, `src/render/blood.js`)

The user: "pixel level blood splatter on the ground and lingering blood traces on the damaged part".

- A blow that draws blood, or lands on a face already bleeding, flings a spatter the way it went: a few big drops near, fine ones far, **pixel by pixel**.
- Whoever bleeds drips where they stand every 3-7 s (DRIP_S). At most 120 decals (DECALS_MAX).
- It stays where it fell and **darkens as it dries**. Rain washes it (WASH_H by rain level 0/0.6/1.5/3 h).
- On the person it's worn on the face (or clothes for a cut) until a day has washed it off.

---

## 16. First aid (`src/sim/aid.js` 340 lines, `src/sim/medicine.js` 251, `src/sim/diagnosis.js` 282)

DESIGN lines 429-434 (0.1.0-rc1, 2026-10-27; the user: "bandaging, splinting and other kinds of medical first aid … the right skills to drive how good we are with medical stuff").

### 16.1 Access and rules

- **H** for yourself, **F -> First aid** for someone at hand.
- On yourself -2 (SELF_MOD). One-handed (a wounded or broken arm) -4 (ONE_HAND_MOD).
- Each action takes its time **stooped over it**, the time shown on its option. Moving stops it, but the effect already made stays.
- **Time scales with Medicine** (2026-11-04; the user: "every first aid action should also take time proportionally to medicine skill"):
  - `pace = max(0.5, 1.6 / (1 + Medicine/16.7))`: x1.6 at 0, x1.0 at 10, x0.73 at 20, x0.57 at 30.
  - Pressure held is the same for anyone.
- Options are greyed with the reason when not possible. They name the wounds as known by diagnosis.

### 16.2 Action table (base times at Medicine 10, SECONDS)

| Action | DC | Time | Effect |
|---|---|---|---|
| press on it | no roll | 60 s held (PRESS_S) | while still, bleeds at 35% (PRESSURE_K) |
| dress (a bandage from the kit only) | 8 shallow / 12 deep / 16 artery | 45 s | made: a cut stops, an artery slows to 30% (ARTERY_HELD). Missed: soaks through, nothing changes, the next try -2, then -4 (RETRY_MOD; 0.1.0-rc4: a miss used to slow it anyway, "so retrying always won") |
| tourniquet (the kit's only) | 10 | 25 s | it stops; the limb is no use until a hospital; on past 2 h the limb starves (TOURNIQUET_SAFE_H; 0.15 of capacity an hour harm); loosen 10 s, re-bleeds unless the artery is tied |
| splint (the kit's only) | 12 | 120 s | the break costs half |
| bandage (put on or changed on an open wound) | | 40 s | keeps it clean; a day old it's dirty (BANDAGE_DIRTY_H 24) |
| antiseptic | no roll | 30 s | an open wound cleaned: hardly goes bad after; on an infected one, -8 severity |
| stitch (suture kit) | 13 deep / 18 artery tied off; -2 on the face | 240 s | the bleeding stops, it knits 1.6x as fast, no scar; clean it first or the dirt is sewn in |
| set a broken limb | 14 | 60 s | set: knits straight; unset: crooked, -1 for good (a scar) |
| poultice (arnica) | | 40 s | for a day (POULTICE_H 24): pain halved, bruises mend 1.6x as fast |
| painkillers | | 5 s | 6 h (DOSE_H), 60% of pain off; not again within 4 h |
| antibiotics | | 5 s | a 5-day course |

- Success rates: Medicine 5 dresses a deep cut on someone else about 2 times in 3 (less on yourself); Medicine 15, 93%.
- **User decisions, 2026-11-04 (strongly flavoured, carry over):**
  - "remove the ability to just rip a strip from a shirt to bandage on the fly, we will build a crafting system later on to make bandages from clothing"
  - "same comment about tourniquet without belt"
  - "don't keep the splint if it uses a non consumed item (shirt strips are not an item) I don't want an infinite splint thing just by having wood on me"
  - So: **no infinite improvised supplies; only consumable kit items, crafting later.** IMPROVISED = -2 is kept in the code for the crafting to come.

### 16.3 Supplies (SUPPLIES, medicine.js line 42; sizes from weapons.js SIZES)

| Supply | Uses | Price | Length, volume |
|---|---|---|---|
| bandage | 1 | $3 | 8 cm, 0.08 L |
| antiseptic | 6 | $6 | 12 cm, 0.12 L |
| suture kit | 3 | $25 | 14 cm, 0.12 L |
| splint (folding) | 1 | $15 | 24 cm, 0.4 L (a coat pocket or nothing) |
| tourniquet | 1 | $20 | 15 cm, 0.12 L |
| painkillers | 10 doses | $5 | 10 cm, 0.04 L |
| arnica poultice | 3 | $6 | 12 cm, 0.08 L |
| antibiotics course | 1 | $30 | 10 cm, 0.04 L |
| first-aid kit | 4 bandages, 3 antiseptic, 4 painkillers, a poultice | $28 | |

- A chemist sells everything; a grocer sells bandages and painkillers.
- The flat's bathroom cabinet starts with 2 bandages, 3 antiseptic and 6 painkillers, taken at the basin, "what you choose and no more".

### 16.4 Diagnosis: a look at a body (0.1.13, 2026-11-03)

The user: "reading them should give us MUCH more information about what we can see, like them bleeding, entry wounds etc"; "medicine skill should lead to us rolling for diagnosis".

- **Plain sight** (anyone's): up or down, conscious, where the wounds are and whether they bleed badly, a dressing, tourniquet or splint, pale, a limb that hangs wrong. On yourself, what hurts too.
- **A look:** Medicine vs DC 10. Modifiers: dark -3, dusk -1, the subject walking -2 or running -5, yourself -2. What it finds by margin:

| Margin | Finds |
|---|---|
| -4 | whether someone down breathes |
| 0 | what made each wound, how fast it bleeds |
| +2 | an artery, a break, the blood's state (shock) |
| +4 | a bullet's exit (or none), a crack, what it'll take |
| +8 | bleeding inside, found or ruled out; the blood left with the minutes it gives |

- A natural 1 finds nothing. **A failed look says the safe thing** ("treat it as bad; if in doubt, a hospital") and never that there's nothing inside.
- Kept 30 min, re-rolled no sooner than 60 s on the same body, the better result kept.
- Bleed-rate words: >= 8 "bleeding fast: minutes, not hours", >= 3 "heavily", >= 0.5 "steadily", else "a trickle".
- Tests, two bullets in the chest, 400 looks: Medicine 0 finds them 56% and the internal bleeding 14%; 10: 93% / 66%; 20: 96% / 96%.
- **Body doll UI** (`src/ui/body.js`, `src/art/doll.js`): wounds drawn where they are, numbered plaques beside, the same numbers on the rows and the options.

### 16.5 Professional care (0.1.0-rc42, 2026-10-29)

- The embassy Health Unit nurse (working days 9-18): 1 h, discreet. Every open wound cleaned, stitched and bandaged, a break set and splinted, antibiotics, painkillers. An artery is beyond her.
- A hospital A&E: 4-6 h, everything including tying the artery and removing the tourniquet. A knife wound is reported: a policeman at the curtain, +8 heat.

### 16.6 Infection, pain, scars (0.1.0-rc36, 2026-10-28)

The user: "introduce bandages and other healing furniture that we should be able to use on relevant wounds (bandage a bleeding wound, disinfect wide wound, apply poultry to bruises etc, set broken limbs etc.), Implement a robust health system inspired by Rimworld and Project Zomboid".

- **Infection hazard per day**, dirty and untended (INFECT_P): deep cut or artery 12%, shallow cut 4%, split brow 1.5%.
  - Multipliers: a fresh bandage x0.25; cleaned x0.08; stitched clean x0.6; stitched dirty x1.4; after 4 days (closing) x0.3.
  - Summed against a threshold the dice set when the wound was made, so ticked and skipped time agree.
- **Infected: a race.**
  - Severity starts at 12 and grows by depth a day (deep 20, shallow 5, split 4).
  - The body fights back 12 + Fitness/2 a day; antibiotics add 30; antiseptic -8.
  - Feverish at 25 (-1), high fever at 55 (-2), delirious at 80 (-4), dead of sepsis at 100.
- Tests, a deep cut, Fitness 5, three weeks:

| Care | Infected | Dead |
|---|---|---|
| left open | 65% | 45% |
| strip of shirt | 54% | 47% |
| bandage changed daily | 19% | 15% |
| cleaned, stitched, bandaged | 2% | 1% |

  Antibiotics when it turns, or Fitness 30: nobody dead. Off the map, people "see their own doctors".
- **Pain points** (PAIN): bruised 3, hurt 9, wounded 18, out 30; crack 8, fracture 22, cut 3, deep 10, artery 12, split 2, nose 1, blunt 4; infection adds.
  - Bands: 25 in pain (-1), 45 bad pain (-2), 70 agony (-3), to every roll **but a fight's** ("adrenaline: you feel it after").
  - A splint and a poultice halve their part's pain; painkillers take 60% off.
- **Healing rules:**
  - "A gash open to the air doesn't close; an unsplinted break knits at half the pace" (KNIT_UNSPLINTED 0.5).
  - Any care marks a part tended. A wounded part mends only once tended, at half a bruise's pace, and only with nothing on it wanting care.
- **Scars:** a break knitted unset, a deep cut never stitched (face, arm).
- Wounds age a minute at a time in play and a day at a time through a skip.
- **Surfacing:**
  - The first-aid card lists wounds, their care, and what you have to tend them with.
  - The sheet shows each injury's care, pain and fever; the inventory shows the supplies.
  - **The instinct says what wants doing**: an infection, a gash open, a dressing to change, a break unsplinted, a tourniquet on too long, pain.

**OLYMPUS:** this health and medicine stack is the strongest reuse candidate in this slice. Adapt it with:
- an IFAK as the kit, a combat lifesaver / corpsman skill progression, a TCCC-like (MARCH) priority list in the instinct
- chest seals and needle decompression for gunshots, hemostatic gauze, field triage
- decompression and barotrauma, hypoxia (a blood-band-like O2 meter), CO2, radiation dose, high-g effects (G-LOC, petechiae), long-term low-g effects (bone density, muscle atrophy, fluid shift), suit punctures

The user's "medical aid and healing" request matches it exactly.

---

## 17. Wet and the cold (`src/sim/wet.js`, 106 lines; 0.1.0-rc37, 2026-10-29)

After the user's "how do i use my umbrella, it's raining" and "no hood for clothes that don't have a hood though", and modelled on Project Zomboid's wet and cold.

- Soak 0-100. Light rain wets you through in about 20 min, heavy in 6-7, a downpour in 4 (SOAK_PER_S: rain 0.083/0.25/0.4 per s). Sleet a bit slower, snow at half.
- An umbrella in hand keeps 88% off (65% in strong wind, furled in a gale); a hood 55%.
- Drying: outdoors slowly (DRY_OUT_PER_S 0.012: 2 h+), indoors about 40 min (0.045); dry clothes at home at once.
- Log words: damp (30), wet through (60), soaked (90).
- Wet through below 10 C outdoors: shivering, -1 to every roll. Shivering risks a cold (a hazard a minute by how cold, less if fit: 2 h soaked at 1 C gives the unfit about half, the fit a fifth). A cold lasts 4-7 days at -1 to every roll (painkillers lift it while they work), with a loud sneeze every 150-420 s that gives anyone looking for you +3 for 6 s.
- `src/sim/thermal.js` (159 lines) handles body heat (other slice).

**OLYMPUS:** reference. Mars and Europa have no rain, but the soak-dry-chill pattern maps onto suit thermal load, sweat and humidity inside a suit, hypothermia on Europa's surface, and hygiene (sweat and grime accumulate, a shower resets them). Keep the design rule: **a slow accumulator with named thresholds -> roll penalties -> a hazard rolled per minute -> an illness lasting days.**

---

## 18. Needs (`src/sim/needs.js`, 129 lines)

DESIGN lines 436-443 (design Q149; built 0.1.0-rc10, 2026-10-27; the user: "hunger and stress needs").

- **Hunger:** hours since eating.
  - 6 h: hungry, -1 to every roll (HUNGRY_H). 14 h: starving, -2 (STARVING_H).
  - Past that (0.1.36, 2026-11-04; the user: "there should be a limit to how hungry we get before we pass out and die or get taken to a hospital"): weak at 48 h (-3, no running); faint spells from 72 h (a chance an hour, 20% plus a fifth more per day past it, of passing out 4-12 min; on a street someone calls an ambulance and the hospital feeds you); dead at 3 weeks.
  - Food: a bite at a café, bar, restaurant, shawarma place, bakery, grocer or food hall (2 min at the counter, inside, since rc24); a rest; the canteen; the flat's kitchen table; a day lying low. A hospital stay and a cell end in a meal.
  - **Sleep doesn't feed you** (0.1.0-rc32, 2026-10-28; the user: "when sleeping, the hunger meter is frozen that's a bug"). You wake as long from your last meal as it's been.
- **Stress** 0-100.
  - Up: a fight begun +12, a bout +3, a blow taken +3, a wound +5, seen by the man you follow +8, known by a hunter +10, catching a watcher at it +6, a near miss with a car +8.
  - Down: 0.5/min (CALM_PER_MIN), 2/min sitting or inside (SIT_CALM_PER_MIN); a bite -8, a rest -30, a night's sleep -60.
  - **On edge** from 50: -1 to Deception, Social, Awareness. **Frayed** from 75: -2, and a 35% chance a minute of an unmeant glance back over the shoulder, which the scenes count like any glance ("high stress brings mistakes").
- **Tired** (0.1.8, 2026-11-03; `src/sim/campaign.js` fatigue(); the user: "extreme fatigue (like from not sleeping for too long) should chip away at skill efficiency"):
  - Awake over 16 h: -1 to every skill. Over 20 h: -3, then a point more every 3 h, at most -12.
  - 24 h -4, 30 h -6, 36 h -8 ("dead on your feet"), 48 h -12 ("seeing things for want of sleep"). Sleep wipes it.
- **One hard session a day** (0.1.8; the user: "a notion of fatigue preventing among other things, working out more than once a day (including martial arts and other strenuous things)"): for 18 h after a gym or club session, the next is listed but unavailable ("you trained today: your body needs a day of it").
- Needs and body modifiers go into **every roll the player makes** (`checks.js` side() adds `bodyMods` + `needMods` when a side names its body).

**OLYMPUS:** adapt and extend. The user's list for OLYMPUS adds hygiene, bodily functions (bladder, bowel), water (thirst), air, fitness, and G effects. The tradecraft pattern carries straight over:
- hours since X -> banded penalties -> a hard limit with collapse and death
- fed by world appliances via time-skipping actions
- sleep advances the meters instead of freezing them
- one-hard-session-a-day fatigue gating

Mars sol = 24 h 39 min 35 s, so the meters must run on game-clock hours, not "days".

---

## 19. Inventory: volumes, pockets, what shows (`src/sim/items.js` placed(), `src/sim/weapons.js` SIZES)

DESIGN lines 444-447. The user (2026-10-26): "very little storage space, no magic inventory, volumes and pockets. Concealed weapons only when concealable", clothes that can be changed, clothes shops to buy a change of clothes when tailed, no backpack yet, and money. Begun v0.0.45 (2026-10-26); volumes 0.1.0-rc18 (2026-10-27); "**everything takes room**" 0.1.0-rc53 (2026-10-31; the user: "why are all these items … not taking any inventory space ?").

### 19.1 Spaces (SPACES)

| Space | Count | Volume | Max length | Condition |
|---|---|---|---|---|
| trouser pocket | 2 | 0.3 L | 16 cm | not with a dress |
| inside pocket | 1 | 0.4 L | 26 cm | coat, jacket or suit |
| coat outside pocket | 2 | 0.9 L | 24 cm | coat, jacket or suit |
| beltline | 2 | 0.5 L | 36 cm | one thing each; **weapons only**; not with a dress |
| sling | 1 | 8 L | 125 cm | long guns only; always shows (added with firearms) |
| shop's bag | overflow | | | "which is on you": first aid can use it, a burner in it can call |
| hand | 1 | | | pipes, crowbars, sticks and shovels: hand only |

### 19.2 Placement algorithm (placed())

1. List everything carried: wallet (11 cm, 0.1 L) and phone (15 cm, 0.1 L) first and always (for named people), burners, items, supply packs (each pack by its uses), books, loose rounds by box of 20 per calibre.
2. Sort by bulk, biggest first (wallet and phone ranked first).
3. For each thing, the candidate spaces are those where the length fits, the volume fits (used + l <= capacity), and one-only spaces are empty. The beltline takes weapons only, the sling long guns only, and long guns go only in the sling.
4. Prefer a space where it **hides**: the beltline is hidden if a covering top (coat, jacket, suit, sweater) hangs over it; a pocket is hidden if filled <= 60% (BULGE). A gun prefers a hidden beltline (its holster). Otherwise take the first that fits.
5. What doesn't fit isn't carried. It goes to the shop's bag, or is put away at home. Supplies and burners can be thrown away from I to make room. At home, supplies go in the bathroom cabinet.

- Example: "two trouser pockets take a wallet, a phone and four bandages, and no more".
- **What shows** (notice.js): a beltline item with no covering top +2; a pocket past 60% (a bulge) +1; a weapon in the hand +3; being tailed, a weapon showing at the belt is written down like one in hand.
- I shows where each thing is, whether it shows or bulges, and the room left (`src/ui/pockets.js`).
- Sizes are in section 13.1 and 16.3. Other examples: a book 18 cm, 0.35 L; a box of rounds 9 cm, 0.12 L.

### 19.3 Money and clothes

- **Money** (0.1.0-rc10; `src/sim/money.js`): cash on the character, dollars underneath ($300 to start), shown in local currency (RUB at 95, GBP at 0.79, $ in Beirut, EGP at 48). A bite $6, a taxi $4 + $1.50 a street, a coat $120.
- **Clothes** (0.1.0-rc10): a clothes shop sells a coat off the rail (150 s), a colour you weren't wearing, the old one left. Watchers looking for the old coat look past you half the time (overt) or 30% (covert); seen, it's written down.

**OLYMPUS:** adapt the placed() algorithm with military load-carrying spaces:
- plate carrier pouches (magazine pouches sized to a magazine family), admin pouch, IFAK pouch, dump pouch
- a holster (thigh or belt), a rifle sling (one-point or two-point), a backpack (assault pack vs ruck)
- a hard-suit's external mounts, and ship lockers and footlockers as the "home cabinet"

Keep "no magic inventory", "everything takes room", "wallet and phone placed first", and "what doesn't fit isn't carried". A marine's issued kit list replaces the civilian pockets. The **show/bulge** logic becomes relevant to plain-clothes special ops.

---

## 20. The phone, the mind map, papers

DESIGN lines 448-451 (brief in this slice; detail elsewhere).

- **The phone:** "One tool, used anonymously. Using a smartphone is bad tradecraft 90% of the time." Telephones and burners came in 0.1.0-rc35 (other slice).
- **The mind map (Tab)** (Q144): what the character knows, open anywhere: people, places, links, traits found, hooks, leads, the network. Since 0.1.0-rc35 it has four leaves: Ahead, The city (the map in their head, waypoints), People, Where you stand. Backed by `src/sim/knowledge.js`; drawn in the HUD's "dark glass" (`src/ui/mind.js`).
- **Papers** are physical (briefs, photos, documents), read, moved and filed at a desk (home, office, safe house), "Papers, Please-style". Carrying papers is a risk in a search.

**OLYMPUS:** the mind map maps onto a soldier's knowledge (unit roster, chain of command, known places on base, mission briefs). Physical papers become orders, briefings and tablets/hand terminals. The "dark glass" HUD style is part of tradecraft's look (another slice).

---

## 21. Testing and balancing method (cross-cutting, worth copying)

- `tests/run.mjs`: each `*.test.mjs` default-exports `[{ name, fn, heavy? }]`. `QUICK=1` skips the heavy ones ("use it whenever the user may be playing, since their game shares the machine"). Filter by substring. 81 test files.
- **Balance by bots.** Nearly every mechanic in this section quotes numbers measured by scripted players over seeded evenings:
  - the follower bot 20 m back for tailing
  - "walking straight", "checker" and "pro" bots for being tailed
  - bouts for CQC, 2000 draws for fumbles, 400 looks for diagnosis
  - medicine outcomes over 3 weeks
  - `tests/bots.mjs`, `tests/rangebot.mjs`, `tests/shopwalk.mjs`
- Results go into DESIGN.md next to the rule, with the date and the before/after when tuned (e.g. "0.1.0-rc8: the reviewer won 68% ... now 61%"). This is what makes the design doc a durable record.
- Determinism (`src/sim/rng.js`): sfc32 state kept in the game state (saves carry the dice), and `stream(...seeds)` for independent sub-streams ("from a stream of its own, so nothing else's dice move"). **Nothing in the sim calls Math.random.**
- The sim is pure: no DOM, no clock of its own (game.js header). It takes input as data and reports on an event bus.

**OLYMPUS:** reuse the runner pattern and the rule "every mechanic ships with a bot-measured balance line in DESIGN.md".

---

## 22. Reuse assessment (this slice's modules)

All tradecraft sim modules checked here are plain ES modules with no DOM access and no Math.random. Their imports are other sim modules only. The coupling is to tradecraft's street world (`map/street.js` Z lanes, sections, `cities/`, `world.js`), its heat and police, and its campaign.

| Module (tradecraft path) | Lines | Verdict | Why |
|---|---|---|---|
| `src/sim/checks.js` | 79 | **reuse** | d20 + skill + mods vs DC, natural 1/20, opposed with ties to the player, hook halving, readable log text. Generic and tiny; depends only on rng, skills, health.mods, needs.mods (inject those). |
| `src/sim/rng.js` | small | **reuse** | sfc32 + splitmix seeding + `stream(...)` sub-streams + hash. Pure, deterministic, save-friendly. |
| `src/sim/clock.js` | small | **adapt** | TICK_MS 50, SEC/MIN/HOUR/DAY. OLYMPUS needs a Mars sol (88,775.244 s), ship time and Earth UTC side by side. |
| `src/ui/input.js` | 76 | **adapt** | physical-code keys, AZERTY fallback labels, E tap/hold (220 ms), "?" help. Change the bindings table only. |
| `src/sim/game.js` skip() / busy() | 620 total | **adapt (pattern)** | "outcomes for the gap" skip and cancellable busy plans are exactly OLYMPUS's time-skip activities; the body of game.js is street-specific. |
| `src/sim/perception.js` | 265 | **adapt** | the cone, awareness radius, light-limited reach, soft visibility, SEEN threshold, wall occlusion with binned walls, frozen memory and inView are generic. Remove the glass mirror (or keep for visors and monitors); generalise walls to deck/tile geometry; add vacuum (no sound) and helmet FOV. |
| `src/render/view.js` fog mask + `src/art/pixelart.js` setFog | | **adapt/reference** | a ground mask of 0.5 m cells, eased, dithered dim, cold-tint second channel for "felt". Tied to tradecraft's Three.js pixel stage; rendering choice is another slice's call. |
| `src/sim/sense.js` | 179 | **adapt** | the "feel" mechanic (periodic rolls -> graded patches lifting the fog, quarry trail, hunch false alarms) becomes Warfighting/combat awareness. Strip the scene and street coupling. |
| `src/sim/instinct.js` | 53 | **adapt (pattern)** | a rule list with priority, each yielding a line while it applies. Small; the rules themselves are street-specific. |
| `src/sim/xp.js` | small | **adapt** | class x outcome x difficulty x risk, +0.1 a won roll, cost x6.25 every 20 points. Retune for military careers. |
| `src/sim/cqc.js` + `fight.js` + `cqcshow.js` + `cqctext.js` | 473+206+136+217 | **adapt (near as-is)** | complete, tested, user-shaped CQC (RPS, reads, edges, riposte, handicaps, techniques by level, fight enders, armed fighting). Add suits, low/zero g, military techniques; text lines need a military register. |
| `src/sim/interact.js` | 291 | **adapt** | F menu, openings, downed options (tie, search, strip, kill by means), witnesses. Add military verbs (order, detain, escort, frisk). |
| `src/sim/know.js` | 80 | **adapt** | Read as ranges never centred on the truth, class at margin 4, training at 12. Add rank/unit/insignia reading. |
| `src/sim/weapons.js` | 106 | **adapt** | melee table and SIZES; replace with military melee (bayonet, entrenching tool, rifle butt) and kit sizes. |
| `src/sim/items.js` | 278 | **adapt** | placed() algorithm (sizes, spaces, hide/bulge, overflow bag) is good; replace SPACES with load-bearing gear; drop street litter placement or reuse for debris on stations. |
| `src/sim/health.js` | 404 | **adapt (high value)** | parts, states, mods, injuries, blood %, bleed rates, exertion, knockdown, crawl, adrenaline, pain limit. Extend with vacuum, hypoxia, radiation, G-forces. Couples to thermal.js and armour.js. |
| `src/sim/aid.js` | 340 | **adapt (high value)** | first aid options, DCs, Medicine pace, self and one-hand penalties, retry penalty. Swap the civilian kit for an IFAK and TCCC items; drop embassy/hospital heat. |
| `src/sim/medicine.js` | 251 | **adapt (high value)** | supplies, infection race, pain bands, healing rules, scars. Pure apart from rng, clock, skills. |
| `src/sim/diagnosis.js` | 282 | **adapt** | Medicine look with margin-gated findings, the safe-advice failure, the body doll. |
| `src/ui/body.js`, `src/art/doll.js` | | **adapt/reference** | body doll with numbered wound plaques; restyle for a uniform or suit. |
| `src/sim/blood.js` + `src/render/blood.js` | 47 + | **reuse/adapt** | pixel spatter by direction, drips every 3-7 s, darkening, wash. In low g, spatter flies further and falls slower (adapt the ballistics). |
| `src/sim/needs.js` | 129 | **adapt** | hunger and stress bands, slip mistakes, starvation limits. Add thirst, hygiene, bladder/bowel, O2/CO2, sleep (fatigue lives in campaign.js). |
| `src/sim/wet.js` | 106 | **reference** | rain soak and colds don't exist on Mars; the accumulator pattern is useful for sweat, grime and suit thermal load. |
| `src/sim/notice.js` | 64 | **adapt** | conspicuousness modifiers; useful for plain-clothes ops and peacekeeping. |
| `src/sim/shops.js`, `src/sim/acts.js` | 345, 315 | **reference** | walk-in interiors with T/R points that start timed actions; the cutaway view. Street-coupled; OLYMPUS base facilities replace shops. |
| `src/render/cutaway.js` | | **reference** | dollhouse cut of a building while inside; candidate for multi-deck ship views. |
| `src/sim/taxi.js`, `buses.js`, `metro.js`, `transit.js`, `traffic.js`, `src/ui/tubemap.js` | 199/162/138/155/358 | **skip (reference)** | city transit; keep only the patterns (doors-open wait, stop-clock destination card, riders who saw you board, ride as skipped time). The tube-map rendering idea could inform a ship-deck or habitat transit map. |
| `src/sim/scenarios/watch.js`, `tail.js`, `sdr.js`, `habits.js` | | **reference** | spy scenarios; reuse ideas (scan checks with tells, alertness, radio-shared last-known position, bot balance grids) for sentries, insurgents and patrols. |
| `src/sim/firearms.js`, `shooting.js`, `gunwork.js`, `armed.js`, `cover.js` (outside slice) | 487/637/142/549/135 | **adapt (core)** | see section 14; the user's OLYMPUS brief names this layer directly. |
| `tests/run.mjs` + bots | | **reuse (pattern)** | tiny runner with QUICK/heavy/SKIP; bot balance measured into the design doc. |

---

## 23. OLYMPUS translation notes (mine, flagged as suggestions)

These follow from this slice plus the user's OLYMPUS brief, not from tradecraft's user:

1. **Weapon handling for a marine** extends tradecraft's stateful gun:
   - Continuous muzzle-direction tracking against friendlies and civilians (tradecraft's range safety made universal on base).
   - Safety and selector state shown on the HUD.
   - Magazines in pouches by count; press-checks to *know* the chamber state (tradecraft's "holder knows what's in it").
   - An unloading drill at the armoury clearing barrel.
   - Negligent discharge consequences (NJP, Article 15-like), mirroring tradecraft's fumble ladder.
2. **Stop motion vs the user's OLYMPUS wish** ("Shooting should play as in tradecraft"): keep X mode, steps chosen with times shown, the world advancing per step, NPCs acting in real time at their skill's pace, cover modelled per object.
3. **Perception in space:**
   - No sound in vacuum, so the awareness radius drops to contact/vibration plus suit radio.
   - Helmet visors narrow the cone.
   - Light is low on Europa and mixed on Mars; helmet lamps make "islands of light", as tradecraft's night street does.
4. **Time skipping** with illustrated splash cards (the user's OLYMPUS brief) on top of tradecraft's skip(): eat, shower, sleep, PT, drill, maintenance, transit. Every slow process must agree between ticked and skipped time (tradecraft's infection-threshold trick).
5. **Health extensions:** decompression (ebullism, barotrauma), hypoxia and hypercapnia as blood-band-style meters, g-load (sustained g on a drop ship or under thrust: G-LOC thresholds, the juice), and low-g long-term effects (bone loss, fluid shift) as slow skill and Fitness modifiers.
6. **Needs extensions:** thirst, hygiene (a shower appliance), bladder/bowel (latrine, suit MAG), sleep tied to the duty roster, stress from combat and confinement.
7. **The F/R/T trio** maps to people (F: talk, order, aid, restrain), world appliances (R: shower, bunk, mess line, rack, locker, hatch, console) and the instinct/NCO voice (T: "Check your muzzle", "Get to cover", "Tourniquet that leg"). Consider making the instinct the voice of training or the squad leader, as tradecraft's is "the voice of training, with dry humour now and then".

---

## 24. Index of the user's preferences in this slice (dates; full quotes inline above)

- **2026-10-26:**
  - perception: "where we're looking and what characters are aware of"
  - "we only know what we know"
  - skill reads the signs (a failed roll reads like no signs)
  - no arrow over the target
  - night sight should depend on light (v0.0.40)
  - shop-window reflection limited by your own back (v0.0.32); window checks less conspicuous (v0.0.32)
  - CIA dojo as the CQC tutorial
  - techniques by CQC level, "beginners would only punch"
  - faster, more impactful animations, no sparks
  - stuns and dazes forbid moves
  - riposte with Shift keeps the edge
  - talk pauses the game like combat
  - "remember it, snap flash forward" for a repeated tutorial
  - fight enders with ethics in bouts
  - status reminders by the instinct
  - zero-sum advantage points; auto-Read in fights
  - variety of knives and improvised weapons ("fight is still CQC")
  - only pockets and beltline, no backpack yet
  - "very little storage space, no magic inventory, volumes and pockets. Concealed weapons only when concealable"
  - health body part by body part
  - cracks, cuts and facial bleeding
- **2026-10-27:**
  - instinct overhaul ("mostly useless")
  - shops entered and walked, not abstracted
  - conspicuous blood and cleaning up in toilets
  - lateral observation spots
  - buses and underground with real networks and stations
  - taxi hailing fully animated and only with a taxi near
  - the bleeding-out system with a blood-pressure stat
  - first aid with skill-driven quality
  - hunger and stress needs
  - keybinds behind "?"
- **2026-10-28:**
  - timed actions skip the clock ("never came out even after 3 minutes")
  - T and R split
  - graphical metro map
  - Rimworld/Project Zomboid-style care (bandage, disinfect, poultice, set limbs)
  - sleep must not freeze hunger
- **2026-10-29:**
  - no fast travel to work or home
  - umbrella and hood behaviour in rain
- **2026-10-31:**
  - the instinct "feel" that reveals blind spots, with high skill as a "super officer"
  - everything takes inventory space
- **2026-11-03:**
  - logarithmic skill growth with an XP system
  - pursuers must roll and not see through walls
  - violence on downed people by means (tie, knife, gun, bare hands)
  - richer reading of bodies and Medicine diagnosis
  - extreme fatigue chips skills
  - one strenuous session a day
  - firearms in stop motion, fumbles with real discharges, muzzle discipline by skill, no shot without aim, drawing a gun means intent, specific calibres
- **2026-11-04:**
  - no shirt-strip bandages, belt tourniquets or infinite splints (crafting later)
  - first-aid time scales with Medicine
  - moving increases bleeding
  - knockdown from gunshots, justified by the body
  - a starvation limit with collapse, hospital or death
  - eyes all round when lying down
  - "an umbrella is not a weapon"
  - a cover system
  - natural aiming without a list
- **Undated:**
  - AZERTY labels ("don't give me the QWERTY keybinds")
  - the instinct's dry humour
  - bus stops at least about 300 m apart (0.1.19)

---

## 25. Open questions this slice raises for OLYMPUS

1. Stop motion scope: should OLYMPUS keep tradecraft's opt-in X mode (time frozen only in the mode, NPCs acting in real time otherwise)? Or does squad combat need a broader tactical pause covering squadmates' orders?
2. CQC in suits and low g: keep the RPS loop unchanged with modifiers, or add suit-specific moves (seal or hose grabs, visor strikes)? In zero g, does "down" exist?
3. The instinct's voice: a marine's training ("the voice of training"), a squad leader on the radio (as Hale's earpiece in tradecraft's tutorial), or both?
4. How strict should continuous muzzle discipline be outside combat: warnings and NJP-style consequences, as on tradecraft's range, applied everywhere on base?
5. Splash-screen time skips: are they skippable or interruptible (an alarm mid-shower), and does the player see a fast-forward clock?
6. Inventory: issued kit only (with the armoury as the source), or personal purchases at a PX too? Does the user want encumbrance (mass) as well as volume, given gravity changes between Mars, ships under thrust and Europa?
7. Medicine scope: a full TCCC/corpsman layer (chest seals, needle decompression, IV fluids) beyond tradecraft's set? Is the "no improvised supplies until crafting" rule kept?
8. Read/know: should reading an NPC also show rank, unit and specialties from insignia (a soldier's equivalent of class at margin 4)?

---

*Word count note: this file condenses about 87,000 characters of source (152 lines) plus code checks; numbers were verified against the code where marked (perception.js, checks.js, health.js, aid.js, medicine.js, needs.js, items.js, weapons.js, cqc.js, interact.js, know.js, diagnosis.js, sense.js, wet.js, notice.js, blood.js, cqcshow.js, fight.js, shops.js, game.js, input.js, view.js, xp.js, skills.js).*
