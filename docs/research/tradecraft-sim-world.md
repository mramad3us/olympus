# TRADECRAFT: world sim, NPCs, UI framework (research for OLYMPUS)

Researched 2026-11-05 from `/Users/deaumas/lab/vibe/claudecode/tradecraft` at VERSION `0.2.0-rc3` (read-only). All paths below are relative to that repo unless marked otherwise. Line numbers are from that version. "The user" means the same person who asked for OLYMPUS. Dated quotes are theirs, from tradecraft's code headers, DESIGN.md and CHANGELOG.md. They are tastes that carry over.

Files read in full or nearly: `src/sim/game.js`, `world.js`, `agents.js`, `people.js`, `crowd.js`, `habits.js`, `needs.js`, `perception.js`, `sense.js`, `interact.js`, `acts.js`, `talk.js`, `dial.js` (header and services), `career.js`, `thermal.js`, `clock.js`, `state.js`, `rng.js`, `bus.js`, `log.js`, `checks.js`, `skills.js`, `know.js`, `instinct.js` (header), `interiors/{plan,furniture,use,path,flat,staffing}.js`, `src/main.js`, `src/ui/{input,store,ui,mind}.js`. Skimmed: `campaign.js`, `scenarios/campaign.js`, `weather.js`, `clothes.js`, `wet.js`, `shops.js`, `fitness.js`, `reflex.js`, `items.js`, `onlookers.js`, `notice.js`, `emergency.js`, `police.js`, `belief.js`, `knowledge.js`, `xp.js`, `clubs.js`, `training.js`, `reading.js`, `interiors/{shop,embassy,range}.js`, `map/interior.js`, `render/crowd.js`, `ui/{pockets,plaque,body}.js`, `style.css`, `docs/DESIGN.md`, `docs/PLAYTESTS.md`, `CLAUDE.md`.

> **Correction to the brief:** `src/sim/dial.js` is not a dialogue system. It is the campaign's **phone services** (ringing for food, a taxi, a dead drop, a clinic, extraction). The conversation system is `src/sim/talk.js`, and it is very thin: four canned choices. Both are covered in section 13.

---

## 1. What matters most for OLYMPUS (summary)

1. **Time is real: one game second per real second.** `TICK_MS = 50` gives 20 ticks a second. There are no speed controls. Time only jumps through **actions that take time**, which call `skip(state, bus, ms)`. A skip gives the world *outcomes* for the gap instead of simulating it. The user's OLYMPUS brief asks for the same thing ("full days … moving in real time until we do things that spend time like eating"). Tradecraft has **no splash screen** for a skip, only log lines, "papers" (a summary card) and a white flash for scene cuts. OLYMPUS has to build the illustrated splash and fast-forward itself.
2. **The sim is pure, deterministic and saved as plain JSON.** A seeded sfc32 rng is kept in the state. Side streams (`stream(...seeds)`) are used for anything that must not move the main dice. Keys starting with `$` are runtime-only. A test proves that a save and load mid-run changes nothing: identical JSON after 3,000 ticks. Reuse this core almost as-is: `rng.js`, `bus.js`, `state.js` pattern, `store.js`, the debug handle.
3. **NPCs come in two tiers.** (a) Persistent **sheets** in `state.people`: skills, three social gauges from −5 to +5 that drift back one step a week, a look, wounds, needs. (b) Throwaway **passers-by** generated from a seed. They are never saved beyond their seed and plan, and are promoted to a saved sheet the moment you interact with one (`interact.js person()`). Bodies on the map are **actors** with an `ai` block. Persistent NPCs with real daily lives are mostly **not built**: only the embassy's staff rota (`interiors/staffing.js`) and route-walking "agents" exist. OLYMPUS's squadmates with lives are new work, and `staffing.js` is the best seed for it.
4. **Crowd level of detail ("the bubble").** Passers-by exist only on the focus's street and the street either side, within 45 m along them. That is up to about 36 per street at peak, about 108 in all. They spawn only off-screen or out of doors. They are recycled entirely after a skip of 120 s or more. Agents on unloaded streets walk on kinematically, "in the background". Sim cost was measured at **0.13 to 0.36 ms per tick** on the heaviest street. Everyone renders in one instanced draw.
5. **Perception is the game.** Each actor has a heading, a view cone (100° plus 2° per point of Awareness, at most 170°) and an all-round awareness radius (2.5 m plus 0.2 m per point). Sight range is set by the light: 10 m + 42 m × light, so 52 m by day and about 15 m in the dark, and weather caps it. Line of sight is blocked by building walls. The **same visibility function drives the screen fog and the dice**. The player's memory of who was where is drawn frozen and dimmed. This is directly reusable for top-down close-up play (helmets, NVG and smoke would plug in as modifiers).
6. **Needs are few and closed-form.** Hunger is "hours since you ate" (thresholds at 6, 14, 48 and 72 h, death at 21 days). Stress runs 0–100 with decay. Fatigue is "hours since you woke" (−1 at 16 h, −3 at 20 h, then −1 every 3 h down to −12). Core temperature relaxes exponentially. Wetness is tracked. There is **no thirst, hygiene, bladder or bowel**, and only an implicit sleep need. The "time since X" style makes skips trivial and is the right pattern for OLYMPUS's longer needs list.
7. **The interaction grammar.** F is a context menu on whoever is within 1.8 m. T does what the instinct's line offers (the scene's one-line advice). R uses what is at hand (an affordance). G draws, X shoots in stop-motion, H is first aid, I the inventory, C the character sheet, Tab the mind, J the log, Space pauses, Esc opens the menu. Keys are read by **physical position** (`KeyboardEvent.code`) and labelled in the player's layout, AZERTY by default. Each action becomes a "busy plan" of `['go', x, z]` and `['wait', ticks, face, gait]` steps, which moving cancels.
8. **Interiors are pure data plans.** A plan has rooms, openings, cutaway walls (outer walls 2.8 m, inner walls cut to 1.0 m for the camera), furniture from a sized catalogue with uses (`sleep`, `eat`, `wash`, `toilet`, `cook` and so on), seats and spots, and an A* path on a 0.25 m grid. Flats are generated from a seed. This is a strong base for barracks, mess halls, ship decks and habitat modules.
9. **The UI is plain DOM over the canvas, built by one 1,169-line `ui.js`.** It has a dark "glass" card style headed by pixel-art plaques, "paper" sheets for briefs, a one-line instinct prompt at the foot of the screen, toasts at the top left (16 s, three at most), speech balloons, and a watch at the top right. The *look and grammar* are worth copying. The monolith is not: split it.

---

## 2. Architecture and rules of the code

`CLAUDE.md` sets the rules, carried over from longhaul. OLYMPUS should keep them:

- Vanilla ES modules, no build step, no runtime dependencies, browser, IndexedDB saves, fully offline. three.js is vendored (`vendor/three/`, import map in `index.html`). It is used for the 45° orthographic pixel-art view.
- **The sim is pure** (`src/sim`). It never touches the DOM. It reports facts on a bus (`sim/bus.js`) and never reads anything back. `src/render` draws, `src/ui` handles keys, screens and saves, and `src/art` holds the painters and sprites.
- **One tick at a time, in a fixed, documented order.** Decisions made in one tick act in the next.
- **State is plain data.** `$`-prefixed keys are runtime-only and stripped from saves. Schema changes are additive, through `upgradeState`. Before 1.0, old saves are kept "only where it comes naturally" (the user, 2026-10-26).
- **Randomness goes only through `sim/rng.js`.** Units go in constant names (`rangeM`, `speedMs`).
- **Scale is set early.** Spatial indexes, no per-tick work over every entity, and "far-away things get outcomes, not simulation".
- **From day one:** a debug handle on `window` and save export/import as JSON ("Longhaul had to decode Chrome's IndexedDB blobs to get at a save").
- **Visuals obey the sim.** "One quantity shows one number on every screen, computed by one shared helper."
- Every module opens with a prose header explaining its model, and comments explain why. Tests print the numbers that matter.

Coupling caveat: the sim is pure but **heavily cross-imported**. `game.js` imports about 50 modules. The street model (rows of east–west streets, constants `Z.*`, `LINE.*`, `townOf()`, `sectionOf()`) runs through agents, crowd, acts, perception, habits and interact. Most NPC and route code assumes that street cross-section. That is the main reuse obstacle (section 20).

---

## 3. The time scale

### 3.1 The clock (`src/sim/clock.js`)

- Game time is **whole milliseconds since 2026-01-01 00:00, Moscow time**, in `state.time.ms`. Whole ms so that a tick adds exactly and a long game never drifts.
- `TICK_MS = 50`, so 20 ticks per real second. `SEC`, `MIN`, `HOUR` and `DAY` (86,400,000 ms) are constants. `TZ_H = 3` is Moscow.
- The calendar uses Howard Hinnant's civil-date algorithms: pure integer arithmetic, no `Date`, identical in every browser and in tests. `calendar(ms)` returns `{year, month, day, weekday 0=Mon, doy, dayIndex, hour, minute, second}`. Helpers: `hourOfDay`, `clockText` ("16:05"), `dateText`, `stampText`.
- The header (lines 7–11) states the model: "Time runs one second for one second while the player is on a map; actions that take time (sleep, travel, the cover job) jump it (the caller adds their length and the world gets outcomes for the gap, not a tick-by-tick simulation)."
- **For OLYMPUS:** keep integer ms and the 50 ms tick. Replace the day with a **Mars sol** (88,775,244 ms, 24 h 39 m 35.244 s) for local time on Mars. Keep an Earth UTC calendar alongside for orders and pay (the Hinnant code can be reused for the Earth side). `hourOfDay` becomes "hour of sol" with whatever display convention is chosen (a stretched 24-hour clock or real Mars hours: an open question).

### 3.2 Real time, pausing, overlays (`src/main.js`, loop at lines 468–489)

- An accumulator loop: `dt = min(0.25 s, real dt)`, `acc += dt`, and `while (acc >= 0.05) step(...)`. So at most 5 ticks of catch-up per frame. The previous positions are kept (`prev`) and the view interpolates with `alpha = acc / TICK`.
- The sim steps only when `live = !paused && !ui.overlay()`. **Any open overlay pauses the game**: the menu, log, character sheet, inventory, mind, choice cards, briefs and papers. Space toggles `paused`. A hidden tab (`visibilitychange`) pauses and autosaves.
- "**Time stands still**" modes inside the sim (`game.js` line 245): if a fight waits for a choice (`state.fight.phase === 'choose'`), a conversation is open (`state.talk`), a shot is being chosen (`state.shoot.phase === 'choose'`), or a reflex card is up (`state.$reflex`), `step()` returns early. Ticks still run, but nothing advances. The user's taste (2026-10-26): "talk should pause the game, like combat".
- **No speed controls.** DESIGN.md, Time: "Real time, one second for one second. Pause any time. No speed controls; time moves through actions that take time." In debug mode `]` skips 1 h and `[` skips 15 min (main.js line 436).
- HUD toast timers run on `hudMs`, which advances only when not paused and with no overlay (`ui.js` around line 520). So a 16 s log line is not missed under a card.

### 3.3 `skip()`: time passing without ticks (`game.js` lines 424–448)

`skip(state, bus, ms)` is the single engine for "an activity that takes time". In order:
1. Blood on the street weathers for the gap (`blood.js wash`, per minute).
2. **Whoever bleeds bleeds through it a minute at a time** (the only sub-stepped part: `bloodBeat` per 60 s).
3. The clock jumps by a whole number of ticks.
4. For every person in `state.people`: gauge drift (`people.js drift`) and healing (`health.js heal(p, ms/DAY, …)`, where off-map NPCs count as "tended"). For the player also: wet-days, body notes into the log, and body heat lived a minute at a time (`thermal.js live`).
5. Emergency calls the hours have resolved (`emergency.caughtUp`).
6. **The crowd:** if the gap is at least `RECYCLE_S = 120` s, every passer-by who isn't a casualty is dropped and the street is refilled anywhere at the new hour's density (`crowd.js recycle`). Otherwise `populate` tops it up.
7. Weeks of fitness and months of skill rust roll over (`fitness.js rollWeeks`, `rust.js rustRoll`).
8. An `autosave` event fires if a 30-minute boundary was crossed.

The campaign wraps skips in `passTo()` (`scenarios/campaign.js` line 596). It calls `skip()`, then `campaign.pass(c, from, to)` for the calendar's consequences (days worked or missed, pay on the 1st, the weekly review, arrests and heat), and emits `papers` cards for the UI to show one after another.

### 3.4 Activities: lived or skipped, and their durations

| Activity | How | Duration | Where |
|---|---|---|---|
| Sleep (bed at 20:00 or later, before 05:00, or fatigue ≤ −3) | skip to `WAKE_H` 07:00 | to next 07:00 | `campaign.js rest()`; stress −60 (`soothe`), hunger **not** reset |
| Bed by day: a nap | skip | `NAP_MIN` 60 min, removes `NAP_EASES_H` 4 h of tiredness | `scenarios/campaign.js` line 202, 478 |
| Bed by day: lie down | skip | `REST_MIN` 30 min, stress −`REST_CALM` 15 | same |
| Eat at the flat's table | skip | 20 min, calm −20; uses one of `LARDER_START` 6 meals | lines 535–541 |
| A bite at a café counter | skip (shop `long`) | `EAT_S` 120 s | `shops.js`, `needs.js` |
| Wash at the basin ("hot water, a shave, a clean shirt"; a shower if wet) | skip | 15 min; clears `bloody`, `wet`, `shiver` | `wash()`, line 553 |
| Change clothes at the wardrobe | skip | `DRESS_S` 240 s | `clothes.js` |
| The cover job (desk) | skip | to 18:00 (or an excuse time); cover +6/day × share | `campaign.js work()` |
| Lie low a day | skip | to the next morning | `lieLow()` |
| Gym / club / class / language school | skip | the class's hours; one hard session per 18 h (`WORKOUT_GAP_H`) | `shops.js`, `clubs.js`, `training.js` |
| Read a book | skip in 10-min chunks (`READ_MIN`), card re-offered | as long as you like | `reading.js` |
| Metro / bus / taxi ride | skip | 6 min wait + 4 min a street | `campaign.js TRAVEL`, `metro.js`, `buses.js`, `taxi.js` |
| Hospital, police cell | skip | `HOSPITAL_H` 8 h etc. | `emergency.js`, `armed.js` |
| Kiosk paper, phone box, notices | **lived** (busy wait) | 25 / 45 / 30 s | `acts.js KIOSK_S`, `PHONE_S`, `NOTICES_S` |
| Café window coffee, café reading | **lived** (`LIVED` set) until you move | open-ended | `shops.js` line 64 |
| Tie up / search / strangle someone down | **lived**, crouched | 60 / 20 / 150 s (×1.6 on a failed CQC roll) | `interact.js` |
| Shoelace, phone glance, pick up | **lived** | 3 s / 20 s / 0.6 s | `acts.js` |
| Gun work at the table (load mags) | lived if ≤ `LIVE_MAX_S`, else skipped | per round | `gunwork.js` |

How a skip is shown: one or two **log lines** ("Bread, cheese, the kettle, the radio low: twenty minutes."), the HUD clock jumping, and **papers** cards for days (pay, the weekly review, news, cables). `ui.flash()` (`ui.js` around line 1144) is a 1.6 s white fade used for scene cuts ("a blow, and another time"). **There is no illustrated splash screen or visible fast-forward.** The user's OLYMPUS brief explicitly asks for "a splash screen illustrating the action and a time fast-forward", so this is new for OLYMPUS. A natural fit: `skip()` emits a `skip` bus event `{what, fromMs, toMs}`, the UI shows the splash and animates the clock, and the sim has already resolved the outcome.

The user's quotes on time are collected in section 19: time as a currency, no fast travel to work, the crowd recycled after a skip, sleep not feeding you, reading in 10-minute chunks. Fast travel was removed from the menus as a result: you walk or take transit.

---

## 4. The tick (`src/sim/game.js` `step()`, lines 162–391)

Input per tick: `{ mx, mz (−1…1), run (Shift), slow (Alt), look (E held), act: [actions], frame }`.

1. **Actions are dispatched** (lines 170–242): fight moves, `talk:`, `interact:<id>:<actor>` (F menu), `tend:` and `aid:` (first aid), `metro:`, `police:`, `shop:`, `taxi:`, `bus:`, `read:`, `draw` (G), `aim` (X), `reflex:`, `shoot:`, `inv:`, `glance` (E tap), `use` (R → `acts.affordance()` then `acts.act()`). Anything else goes to `scenario.act` (T is `'instinct'`, and `desk:*` is the campaign's).
2. **Time stands still** check (line 245).
3. Feet taken: a fight, shooting, a scenario hold, being inside a shop or in a cab takes the player's movement. A long shop activity triggers `skip()` (line 248). Traffic ticks, then taxi and bus waiting.
4. **The player's movement** (lines 266–314): the busy plan (`busy()`, lines 407–422) or E-look (turning the eyes, slanting along shop glass) or walking. Speed is `WALK_MS 1.45` / `STROLL_MS 0.95` / `RUN_MS 3.6` m/s × weather footing × thermal slow × wound mobility. Then skid on ice, cover posture, down when fallen, glance-back eyes, and window-glass detection.
5. **Step 2, everyone moves** (lines 316–321): agents along routes (`stepAgent`), walkers by steering (`crowd.walk`), the player by velocity with sliding collision (`world.move`). Going off the map through a lane loads the next street (`changeMap`/`loadRow`).
6. **Step 3** (lines 327–333): `rehash` the actor grid. The player **looks** (`perception.look` over `near(…, LOOK_M=50)`). Followers watch their targets and re-route every `ROUTE_EVERY=10` ticks, staggered by a hash of the id.
7. **Step 4, everyone thinks** (lines 334–339): passers-by `noticeAgent` (head turns), walkers `think`, the scenario's own characters `scenario.think`.
8. **Step 5** (lines 341–348): `fight.tick`, `shooting.tick`, `armed.tick` (NPC guns in real time), `hunt.tick`, `scenario.tick`, tutor, and then `state.$offer = affordance()` (what R would do, for the HUD).
9. **Step 6, once a second** (`tick % 20 === 0`, lines 350–385): blood drips; fitness distance walked or run and the week/month rolls; weather on blood each minute; `bloodBeat` for everyone; `notice` (blood on you seen); `senseTick` (the "feel"); **`needsTick`**; `learnTick` (streets known); `wetTick`; **`bodyHeat`**; auto-wait at a bus stop after 4 s still; transit followers; police patrols and eyes, armed police, emergency, hunt; held/hospital skips; wounds heal each game minute; `weatherTick`; slips while running on ice; and **`refocus` (sections) plus `populate` (crowd)** around the focus.
10. **Step 7, the clock**: `time.ms += 50`, `tick++`, and an `autosave` event each 30 game minutes (`AUTOSAVE_MS`).

Cheap per-tick work: movement, grid rebuild, the player's look (one radius query), passer-by notice (distance check against the cached player). Everything heavier runs once a second or is staggered.

---

## 5. State, saves, export/import

### 5.1 Shape (`src/sim/state.js` header, lines 9–22)

```
game:'tradecraft', schema, version, seed, rng[4 words], tick, time{ms}
scenario{kind,…}, country, legend{id,name,cover,floor}, player (person id), focus (actor id)
people{ id: sheet }          persistent people, the player among them
map{ kind, seed, row, i0, i1, crowd, inPlay, city }   enough to regenerate it
actors[ … ]                  who's on the map, where, doing what
nextActor, heat{'legend@country':0–100}, log[≤500], flags{}
mind{ seen{ actorId:[x,z,face,gait,stride,ms,lookKey] }, felt, known, told, rolled }
weather (optional pin), campaign (the persistent career), assignment
```

- `toJSON(state)` is `JSON.stringify` with a replacer dropping any key that starts with `$`, at any depth (`$world`, `$route`, `$sky`, `$me`, `$offer`, `$reflex`…).
- `fromJSON(text)` checks `game === 'tradecraft'`, refuses `schema > SAVE_SCHEMA`, and calls `upgradeState` (additive `??=` fills, plus one-shot migrations guarded by `flags`). `SAVE_SCHEMA = 1`.
- Passers-by's routes (about 2 KB each) are **not saved**. Their plan (`ai.plan: {kind:'passer', seed, from, to}`) is, and the route is re-planned the same way on load (`agents.js PLANNERS`, `routeOf()`).
- Determinism test (`tests/world.test.mjs` around lines 70–87): run 3,000 ticks twice, and once with a save and load at tick 1,500. All three JSONs must be identical. The test prints µs per tick and the save size.

### 5.2 Storage (`src/ui/store.js`)

- IndexedDB database `'tradecraft'` v1, object store `'saves'`, keyPath `slot`. Record `{ slot, json, about, version, savedAt }`. Slots are `'auto'` and `'manual'` (debug mode only). Per browser origin, so the play server (:8100) and dev server (:8101) never share saves.
- Autosave every 30 game minutes, on every map change, on `pagehide`, on tab hide, and on quit to title. The design (DESIGN.md, Saves): "They're for continuing, not for undoing". No difficulty settings.
- **Export:** a Blob download `tradecraft-<scenario>-<stamp>.json`. **Import:** a file input → `fromJSON` → `launch`. Menu (Esc): Resume, Save to a file ("to keep, or to send with a bug"), Load a save file…, debug save/load, Quit.
- localStorage holds settings and meta outside the save: `tradecraft.debug`, `tradecraft.farm` (tutorial done), `tradecraft.world` (the world to continue with the next officer), `tradecraft.career` (the highest rung reached, which unlocks starts).

### 5.3 The debug handle (`main.js` lines 491–500)

`window.__tradecraft = { state, view, step(n, input), start(stateOrJSON), newGame(opts), save() → JSON, pause(p), skip(ms), autosave }`, plus `window.__ready = true` after 3 frames. URL params: `?play=<scenario>&seed=&hour=&city=&autoplay[=m]&chapter=`, `?lesson=`, `?weather=snow-heavy-gale`, `?armour=heavy|none`, `?gun`. Errors in a tick are caught: that tick is lost, a toast says so once, and the game carries on (`broke()`, line 444: "Esc → Save to a file, to report it").

---

## 6. The world at runtime (`src/sim/world.js`)

- The saved map is only `state.map`. Everything derived lives in `state.$world`: generated sections, a blocker grid (`BUCKET_M = 4` m buckets, hashed `ix*73856093 ^ iz*19349663`), building walls (for line of sight) binned along x every `WALL_BIN_M = 8` m, and lamps.
- Sections are 45 m long (`map/layout.js SECTION_M`). They are generated within `REACH_M = 70` m of the focus, dropped beyond `DROP_M = 115` m, and announced on the bus (`section+` / `section-`) so the renderer builds or frees meshes. `map.inPlay` is saved, so a load resumes the very same street.
- `move(state, a, dx, dz)`: a circle of `RADIUS_M = 0.25` against blocker rectangles, axis by axis (sliding along walls). When stuck on a corner with a gap within `NUDGE_M = 0.2` to one side, it is eased round. **People don't block each other** ("a crowd would trap the player"): passers-by steer round others, and the player walks through.
- `rehash()` rebuilds the actor grid every tick, skipping agents on other rows. `near(x, z, r)` is the radius query. `exitAt()` detects walking off through a lane.
- Map kinds: `'street'` (one row of the city), `'dojo'` (a room), `'interior'` (a plan as a single section: flat, embassy, range; `map/interior.js planOf()` centres the plan in a 45 m section so the street machinery works unchanged).
- **Fit for OLYMPUS:** the grid, `move()`, `near()`, `rehash()` and lineClear-with-bins are generic and reusable. The section-streaming along an x axis, and rows linked by lanes, are tradecraft's street model. OLYMPUS needs maps that are decks, modules, corridors, airlocks and surface tiles, with a generic connectivity graph (doors, hatches, ladders, lifts) rather than "rows".

---

## 7. NPC architecture

### 7.1 Persistent sheets (`src/sim/people.js`)

- `sheet({ id, name, sex, cls, os, skills:{key:[base, practice]}, langs, look, persistent, met })` → plus `gauges:{fear, trust, affinity}`. Other fields grow on it: `age`, `born`, `needs{ate, stress, ms}`, `injuries`, `blood`, `core`, `wet`, `bloody`, `hand`, `items`, `armour`, `fit`, `rust`, `xp`, `known` (false for a stranger), `seen` ("the man in the beige coat").
- **Gauges** −5…+5 (`GAUGE_MAX`), `nudge()` ±1 for a notable exchange and ±2–3 for a big moment. `drift()` moves each one step toward 0 for every whole week since `met` (`DRIFT_DAYS = 7`), applied lazily when time passes. Design (DESIGN.md, People): fear is how wary they are of acting against us, trust whether they believe us and do what we say, affinity whether they like us.
- Classes (`skills.js CLASSES`): `spook` (over-skill Tradecraft with weights), `soldier` (Warfighting, weights empty), `cop` (Intuition), `criminal` (Streetwise), `civilian` (none). The skill value is `round((base + practice) × (1 + weight × os/100))`, minus rust, plus `strain`. Bases: untrained 0, course 5, advanced 10, expert 15, master 20. Practice 0–3. A civilian sits around 0–8.
- `passerby(seed, city, band)`: deterministic from `stream('passerby', seed)`. 52% women, age 18–77, skills 0–8, the city's names, languages and look, dressed for the day's temperature band from a stream of its own, CQC from another stream, so "who they are doesn't change".
- Generators for officers (`handler()`), Farm trainees and instructors (`recruit()`), and the embassy Marine (`staffing.js MARINE_OS 50`, `MARINE_SKILLS`: cqc 12, weapons 14, fitness 14, awareness 11). The user (2026-11-04): "the marine in ambassy reads as a civilian, they are military that should count for something".
- **Promotion:** `interact.js person()` (lines 143–151). Touching a passer-by (F menu) creates `state.people['x<seed>']` from the seed, marks it `known: false`, gives it carried items, and links `actor.who`. From then on it is persistent.

### 7.2 Actors and AI kinds

Actor: `{ id 'a<n>'|'s<n>', who (sheet id)|null, seed (passer-by)|null, row, x, z, vx, vz, face ('up'|'down'|'left'|'right'), head (radians; 0 east, π/2 south toward the camera), gait ('idle'|'walk'|'run'|'sit'|'down'|'crouch'|'kneel'|'phone'|'slump'|'stagger'…), stride (m walked, drives animation frames), stuck, ai, busy, hidden, glass, … }`.

| `ai.kind` | What | Moved by | Thinks in |
|---|---|---|---|
| `null` | the player (or the focus) | velocity + `world.move` | input |
| `'agent'` | route-walkers: targets, watchers, the player in autoplay; **passers-by** (`ai.civ`) | `agents.stepAgent()` kinematic along a planned route | stops, followers' `routeFollower` |
| `'walker'` | a scenario's people on step plans `['go',x,z]`, `['wait',t,face,gait]`, `['gone']` | `crowd.steer()` + `crowd.walk()` | `crowd.think` |
| `'staff'`, `'applicant'` | the embassy's people | step plans + `sit`/`stand`/`leave` | `staffing.think()` |
| other | a scenario's characters | scenario | `scenario.think` |

Common AI fields: `downUntil` (knocked out), `tied`, `hurt` (shot: `wounded.js`), `fighting`, `gunner`, `wait`/`waiting` (at a stop), `pace`, `f`/`f0` (lateral lane fraction), `eyesOn`, `look` (onlooker), `$missUntil`.

### 7.3 Agents: route-walkers (`src/sim/agents.js`)

- Routes come from `city.js` (A* over the city graph of walking "lines" joined by zebras, park paths and lanes, with per-walker cost noise so two walkers take different ways). An agent walks the route **kinematically** at its own lateral fraction of the way's width (`placeAt(route, s, f)`), so **nothing can block it**. On the loaded street it slows behind people (`yieldTo`, leaning aside at `LEAN = 0.04` of the width per tick), waits for cars and detours round stopped ones (`DETOUR_AFTER_S 1.2`, give up after 20 s).
- **Off the loaded street it walks on all the same, unseen and undrawn**, and is where it should be when its street loads (header lines 3–8). This is tradecraft's "background game", and the template for OLYMPUS's off-screen NPC life.
- **Stops** on a route (`route.stops`, sorted by `s`): `{ s, ticks, face, head, gait, hidden, glass, wide, kind, check, slowM }`. The agent slows over `slowM` metres before a stop (a "tell"), waits there facing a way, possibly hidden (inside a shop), and the scenario hears `onStop(…,'tell'|'start'|'end')`. A shop stop on the loaded street becomes a **visit**: the walker goes in through the door, along an interior path (`interiors/path.js`) to the counter at `VISIT_MS = 1.0` m/s, stands there, and walks back out (`visitOf`/`visitStep`, lines 291–317), visible through the glass.
- Down, tied, shot, over the pain threshold or in shock: they stop where they are, `slump`ed or `down` (line 202). The user (2026-11-04): "over a certain pain threshold, people just lit up against a wall or lie down".
- `RUN_GAIT_MS = 2.3`: faster than that animates as a run. The user (2026-11-03): "someone fleeing a shot runs, not a very fast walk".
- **Followers** (`ai.follow`, lines 335–579) build a trail of where they *saw* the target, bridge gaps with planned routes, keep `keep` metres back (never more than `KEEP_SIGHT 0.6` of the eye's reach), look away when the target checks (`stop.check`), walk on ahead when the target comes their way, hurry out of sight (`HURRY 1.6`), guess lanes (`LANE_HEAD_M 11`), wait on doors (`DOOR_WAIT_S 120`), search (`SEARCH_S 8`), and give up. Reliability (DESIGN.md): 959/960 chases across ten streets through a live crowd. Spy-specific, but the "trail of what I saw + guess + search" structure is how an OLYMPUS pursuer or patrol could hunt a player.

### 7.4 The crowd (`src/sim/crowd.js`)

| Constant | Value | Meaning |
|---|---|---|
| `CROWD_PER_100M` | 40 | at the busiest hour, along a street |
| `WINDOW_M` | 45 | passers-by live within this distance of the focus along the street |
| `BUBBLE_ROWS` | 1 | and on the streets 1 either side (3 rows in all) |
| target per row | `round(40 × 0.9 × density(h) × map.crowd × crowdK(weather))` | **36 at peak**, so about 108 across the bubble |
| `DEST_ROWS` | [2, 5] | they're going to a door 2–5 streets away |
| `DEST_ALONG_M` | [120, 600] | and this far along |
| `SPAWN_M` | [27, 40] | in-view row: spawn this far out (off screen) |
| `SCREEN_HALF_M` | [24, 22] | the picture's half-size plus margin: nobody appears or vanishes inside it |
| `SPEED_MS` | [1.05, 1.6] | walking speeds |
| `SPACE_M` | 0.8 | personal space in steering |
| `STUCK_S` | 3 | blocked this long → skip the step |
| `RECYCLE_S` | 120 | a skip this long → a new crowd |

- `density(ms)`: a piecewise-linear curve over the hour: 0h 0.12, 5h 0.06, 7h 0.5, 8.5h 1.0, 10h 0.7, 13h 0.85, 15h 0.75, 18h 1.0, 20h 0.7, 22h 0.35, 24h 0.12. Weather multiplies it (`weather.js CROWD_K`: a heavy downpour 0.35, a gale 0.75).
- `populate()` runs once a second and on map change. It drops whoever left the bubble or went in at their door (`stays()`), then for each row tops up to target. 25% come out of a door. On the in-view row the rest come in from beyond the screen's edge, walking inward, and only if the spawn point is unseen (outside `SCREEN_HALF_M` or not in the player's sight). On side rows they appear anywhere. `fill: true` (new game or map) allows spawning anywhere.
- A passer-by's route is `withHabits(..., 'civil')` (`habits.js`) plus a final `'enter'` stop, hidden, at their door. **Followed, a passer-by leads somewhere real**: the user wanted "a destination in mind… where the tail would end if it were an actual mission".
- `lies(state, a)`: casualties (down, shot, dead) are **kept** through skips and street changes until the emergency services take them. The user (2026-11-04): "shot and down NPCs get recycled out when we skip time or move away and come back they should stay loaded for a reasonable amount of time".
- `steer()` (lines 267–293), for walkers: slow behind someone ahead within 1 m, push off within `SPACE_M`, step to the right for oncoming people, stay in the lane band.

### 7.5 Habits on a route (`src/sim/habits.js`)

`STYLES` sets the stops a walker makes: `calm`, `wary` (checks for a tail), `civil` (passers-by), `none`. For civilians: look in a shop window (0.15 per stretch), go into a shop (0.10, once a walk, 20–45 s inside), stop on the phone (`pause` 0.25, 4–7 s, gait `'phone'`: the user, 2026-10-28, "Looking at smartphone should become a thing some NPCs do"), sit on a boulevard bench (0.30, 20–120 s), with `lookEvery` [70, 160] m. Detours are added only where the street's clear-test passes (`spur()`), so "a route with habits is as walkable as without". **For OLYMPUS:** a habitat civilian's errands (a noodle stall, a kiosk, a bench in the arboretum) are the same mechanism.

### 7.6 Building staff on a rota (`src/sim/interiors/staffing.js`), the best model for barracks life

- `rota(plan, ms)`: who is due today and from when to when. Deterministic from `hash(plan.seed, day, post.id)`. The Marine is on the desk round the clock. On workdays only: the chief from about 07:54–08:36 to 18:24–19:48; colleagues in between 08:24 and 09:18, out between 17:39 and 18:21, `LATE 0.22` of them till 19:00–21:00; one in twelve off (`OFF 1/12`); the consular officer for `CONSULAR_H [9,13]` and a bit after.
- `staffTick()` runs once a second while the embassy is the map. Whoever is due and absent spawns (walking in from the street door, or **already at their post if the clock jumped** more than 2 min: `jump = ms − life.at > 2*MIN`). Whoever is no longer due walks out, or is dropped at once after a jump. Applicants: one may come every `APPLICANT_EVERY_MIN 5` (chance 0.6) while the visa room is open; after a jump, 0–3 are found already seated.
- `think()`: at the post, a wait of `SIT_MIN [6,18]` minutes; then with chance 0.35 an errand (water cooler, cabinets, the chief's office) for `ERRAND_S [25,90]` s and back. Applicants: walk to a free seat, sit `WAIT_MIN [5,18]` min, the window `WINDOW_MIN [2,4]` min, leave. `unstick()` re-plans the path after 2 s without progress and teleports after 4 s.
- The user (2026-10-28): "the ambassy looks to be static, NPCs should move around (not much but still) leave the office at 6pm …, there also should be some turnover in the visas room, and nobody at 6pm since these tend to close earlier than that".
- **For OLYMPUS:** generalise this into a per-NPC daily schedule (reveille, PT, chow, training blocks, duty posts, liberty, rack time), resolved by hash per sol. Lived in detail when on the player's map; "put right at once" after a skip; tracked by outcomes when off-map. This is the core of "squadmates with their own lives".

### 7.7 How NPCs react

- **Noticing the player** (`crowd.js notice()`, lines 236–259): a passer-by within `RUN_NOTICE_M 9` m turns its head to the player for `NOTICE_S 1.5` s if the player runs past in front of them, or if the player stares at them (E held, within `STARE_M 6` m, within 0.3 rad, for `STARE_S 1.5` s). "So you see what they see."
- **Onlookers round a casualty** (`onlookers.js`): within `NOTICE_M 12` m, if they can see it. `GATHER_P 0.4` come to look in a ring `RING_M [2.2, 3.4]` m off (at most `RING_MAX 8`), `PHONE_P 0.5` with phones out, for `ONLOOK_S [90, 300]` s or until the police tape goes up. The rest give it a berth (`CLEAR_M 2`) or turn back. Each NPC checks on its own tick within the second, so the cost is spread. The user (2026-11-04): "they seem to not care about stepping over a cop that is bleeding out, they would either steer wide away, or pool around the bodies with their phones out".
- **Emergency services** (`emergency.js`): witnesses within `SEE_DOWN_M 25` m call (`CALL_P 0.1`/s), stand on the phone `ON_PHONE_S 40`, describe you if they saw you at it in the last `VIOLENT_S 120`; police and ambulance arrive by car (the country's minutes), treat (`TREAT_S [60,150]`), stretcher, cordon `CORDON_H 24` h. The user (2026-11-03): "people are just ignoring this shot woman on the ground, they should call the emergency services …".
- **Police** (`police.js`): patrols by the hour's dice and the country's `patrolP`; they weigh what shows on you (`notice.js mods()`: blood on the face +4, on the clothes +2, a thing in the hand +3, at the belt +2, a bulge +1, a plate carrier +4); stops as a Papers-Please-style card.
- **Fights** (`interact.js owners.street`): a civilian's nerve check after each exchange. The chance of fleeing is `(0.25 civilian / 0.05 trained) + 0.3 if hurt + 0.03 × CQC gap + 0.15 if stunned`, × 0.35 with a blade in hand, capped at 0.9. Cops and soldiers never flee. Witnesses within `WITNESS_M 25` m who can see it add heat (`WITNESS_HEAT 1` each, at most 6, ×4 for a killing). The victim's gauges move: fear +3, affinity −2.
- **Reflex** (`reflex.js`): when the player sees something coming (a hand reaching, a gun coming up), time stops for a choice card. The user (2026-11-03): "a reflex mode, where time stops when things require it". They later asked (2026-11-04) for a way to keep a choice for a while (`KEEP_S 120`): "the reflex window is spammed on us".

### 7.8 How many NPCs, LOD, cost

- DESIGN target: "**About 50 people on screen** at the busiest", "a store for a few hundred persistent characters", "no city simulation … far-away things get outcomes".
- LOD tiers: (1) on screen in sight: full think plus render; (2) on the loaded street out of sight: full sim, drawn as frozen memory ghosts; (3) on adjacent rows: passers-by sim (kinematic) but not on the hash grid; (4) agents anywhere in the city: kinematic route-walking, nothing else; (5) everyone else: sheets only, updated lazily on skip (`drift`, `heal`); (6) throwaway: a seed.
- Measured (CHANGELOG line 187): "The sim was never the cost: **0.13 to 0.36 ms a tick**" on Moscow at rush hour in the rain while running, on a machine slowed sixfold. The hitches were all the renderer's (painting a whole street in a frame), fixed by spreading painting over frames. Walking holds 60 fps with p99 16.8 ms. A street change takes 50–60 ms.
- Rendering (`render/crowd.js`): every person's sprite sheet (38 frames × 4 facings, 28 × 34 cells) goes into a slot of one GPU atlas (110 slots, LRU reuse), uploaded per sheet with `copyTextureToTexture` (half a MB), never the whole atlas (the whole-atlas upload once caused a 1 s stall on Windows: "each time I turn it staggers almost a second", 2026-10-29). A cap on new sheets painted per frame; fight frames painted lazily. **One InstancedMesh draw for the crowd**, a second for shadows, a third for muzzle flashes. Animation frames advance with distance walked (`stride`), so feet never slide.

---

## 8. Perception and awareness (`src/sim/perception.js`)

| Constant | Value |
|---|---|
| `CONE_DEG` | 100 (+ `CONE_PER_AWARENESS` 2 per point, at most `CONE_MAX_DEG` 170); the player lying awake sees all round |
| `AWARE_M` | 2.5 + `AWARE_PER` 0.2 per point (+ `sharpM(os)` = (os−50)²/200 m above Tradecraft 50: 10 m at 95) |
| sight range `reach()` | `min(SIGHT_M 10 + LIGHT_M 42 × light, weather.sightM)` m: 52 m by day, 30 m into a lamp's pool, about 15 m in the dark; heavy snow 28, extreme fog 10 |
| `SEEN` | 0.5 threshold of soft `visibility()` 0…1 |
| `FORGET_M` | 70: memories farther than this are dropped |
| `CIVILIAN_AWARENESS` | 4 (passers-by without a sheet) |
| glass | shop windows and parked cars as mirrors: `GLASS_K 0.75` of range, `GLASS_MAX_DEG 60` slant, `BODY_DEG 24` your own back |

`openness()` (lines 149–158): `d < 1 → 1`. The awareness part is `clamp((aware + 0.75 − d) / 1.5)`. The far part is `clamp((range + 2 − d)/4) × clamp((cone + 0.12 − |Δθ|)/0.24)`. Take the max of the two. `visibility()` sets it to 0 if a building wall cuts the segment (`lineClear`, Liang–Barsky against wall rectangles binned by x). **People, cars and trees don't block sight.** Then the glass and "felt" patches are added.

- **The same function draws the screen and decides the dice** (header line 28–30). On screen, what the character isn't aware of is dimmed and frozen as last seen. The player's memory is `state.mind.seen[id] = [x, z, face, gait, stride, ms, lookKey]`, renewed every tick for whoever is visible, deleted when the remembered spot is in view again and they're not there, or when it's beyond 70 m. The user (2026-10-26): "a notion of where we're looking and what characters are aware of". A later fix (2026-11-04) followed "half frozen scenes".
- NPC perception is computed on demand: `seesActor(state, a, b) = !b.hidden && sees(eyes(a), b.x, b.z)`. There is no NPC memory structure beyond followers' trails and scenario state.
- **What's felt** (`sense.js`), a Tradecraft "sixth sense". Every `EYES_EVERY_S 6` s, for each watcher who can see you: Awareness d20 + skill + `os²/400` against `24 + their Deception + d/8`. Every `QUARRY_EVERY_S 4` s for a quarry out of sight: Tracking against `30 + d/8 (+3 indoors, +4 another street)`. Reach is `feelM = 12 + total²/10` m. A hit lays a "felt" patch (radius 3.5–6.5 m, 3.5–9 s, offset 0–1.5 m by grade) that lifts the fog there and counts as "in view" for the rules too. False hunches happen below a total of 30. For OLYMPUS: a special-ops "situational awareness" perk, or the reveal of contacts on a squad's datalink, could reuse the patch mechanism.
- **Reading people** (`know.js`): an Analysis check, DC 12, −2 beyond 6 m, −3 in the dark. It gives ranges on `READABLE = [fitness, cqc, awareness, weapons]` (half-width `max(1, round(8 − margin/2.5))`, 12 on a failure), narrowed by later reads. Class shows at margin ≥ 4, training level at ≥ 12. Fights reveal bounds.
- **We only know what we know** (DESIGN.md): failed rolls read exactly like nothing happening. `belief.js` shows heat and cover standing as words with a skill-dependent error and a confidence ("sure, thinking so, guessing"). The user (2026-10-28): "what we see is what our character evaluates as being true".

---

## 9. Needs (`src/sim/needs.js`, `campaign.js fatigue()`, `thermal.js`, `wet.js`)

| Need | Model | Thresholds and effects | Restored by |
|---|---|---|---|
| **Hunger** | `hoursFed = (now − needs.ate)/h` (a closed form, no rate integration) | `HUNGRY_H 6` −1 to every roll; `STARVING_H 14` −2; `WEAK_H 48` −3 and no running; `FAINT_H 72` a chance per hour `min(0.9, 0.2 × (1 + days past))` of fainting `FAINT_MIN [4,12]` min; `DIE_H 504` (21 days) dead. Faint/weak/death only in the campaign | eating: café `EAT_S 120` s, the flat's table 20 min (from a larder of `LARDER_START 6` meals, refilled by groceries), the canteen lunch on workdays, a hospital, a cell |
| **Stress** 0–100 | `strain(v)` adds; decays `CALM_PER_MIN 0.5`/min, `SIT_CALM_PER_MIN 2` sitting or inside | `ON_EDGE 50`: −1 Deception, Social, Awareness; `FRAYED 75`: −2, and `SLIP_CHANCE 0.35`/min of an unmeant glance back | a bite, rest −30, sleep −60. Strain from DESIGN: fight begun +12, blow +3, wound +5, seen by the man you follow +8 |
| **Fatigue** | `h = (now − c.awake)/h` | `TIRED_H 16` −1 to every skill; `EXHAUSTED_H 20` −3, then −1 per `WEAR_H 3` h, at most `WORN_MAX 12`; words at 36 ("dead on your feet") and 48 h ("seeing things") | sleep to 07:00 (`rest()`); a nap removes 4 h |
| **Core temperature** | °C, relaxes toward a target with `exp(−1/τ)` per minute, `τ` 60 cold / 45 heat / 30 indoors | <36 shivering −1, <35 hypothermia −3 and ×0.85 speed, <33 −6 ×0.7, <31 down, <28 dead; >38 −1, >39.5 −3 ×0.85, >41 down, >42.5 dead | indoors, clothing warmth, running +1.2 °C |
| **Wet** 0–100 | soaks per second by rain/snow level (`SOAK_PER_S`: light rain 0.083/s, so 20 min to wet through); umbrella ×0.12, hood ×0.45; dries 0.012/s outside, 0.045/s inside | ≥60 and below 10 °C → shivering −1; a chance of catching a cold (4–7 days, −1, sneezes) | a shower or change at home |
| **Hurt** | `health.js` wounds, blood volume, pain | into every roll through `checks.js` | first aid, hospital, healing days |
| Training load | weekly fitness points (`fitness.js`) | effective fitness ±3 around base | gym 10 pts, class 7, 0.6/km walked, 2.5/km run |

Needs enter every roll: `checks.js side()` adds `health.mods(body, skill)` and `needs.mods(body, skill)`, and each modifier is shown by name in the log ("− 1 (hungry)").

**Not modelled at all:** thirst/water, hygiene/body odour (only `bloody` and `wet`), bladder/bowel (the `toilet` furniture use exists, but nothing uses it; café "toilets" only wash blood off), sleep quality, caffeine, alcohol, gravity, air. OLYMPUS needs all of these. Recommendation: keep tradecraft's **"time since X" plus thresholds** style for each (water: hours since drink scaled by exertion and heat; bladder: since last relief, faster after drinking; hygiene: since shower, faster with PT and the suit; sleep debt: hours awake plus a debt ledger), because it resolves exactly over any skip and costs nothing per tick.

The user's quotes on needs are collected in section 19: hunger and stress, a limit to hunger, fatigue costing skill, one workout a day (`WORKOUT_GAP_H 18`), effective fitness, limited groceries, nothing consumed unasked, and Rimworld and Project Zomboid as the reference for health.

---

## 10. Interactions: F, T, R and the busy plan

### 10.1 F, someone at hand (`src/sim/interact.js`)

- `atHand()`: whoever is within `REACH_M 1.8` m, ranked by `distance − 1.2 × cos(angle off heading)` (those in front first). A key cap is drawn over their head while F would reach them (`ui.js` "reach").
- `options()` → `[{ id, label, ok, why, sub }]`, greyed with a reason when not available. **Talk**; **Violence** ▸ (hit, sucker punch with a Deception vs Awareness roll if they're looking, push, grab needing `GRAB_CQC 9`, stab with a blade drawn); **Read** (Analysis; plus a Medicine look if they're hurt); **First aid** if they bleed, have a broken limb or can't stand. Someone down: tie them (`TIE_S 60`), search (`SEARCH_S 20`: weapons taken if they fit), strip armour (`STRIP_S`: a carrier 60 s, a vest 120, a helmet 15), or kill by what's in your hand (gun 1 s and loud, blade `THROAT_S 4`, bludgeon `BLUDGEON_S 8`, strangle `STRANGLE_S 150` against `STRANGLE_DC 8`).
- The UI menu (`ui.js openInteract`, line 903): sits next to them in the picture, number keys by `e.code` (so AZERTY digits work), Backspace goes back from a submenu, F or Esc closes.
- The user (2026-10-26): "the interact button F that when close to someone should open the contextual menu to do things like TALK, VIOLENCE … READ". And (2026-11-03): "violence in that context should be things like 'tie down' or other options to kill them with what we have on us (knife is different than gun or bare hands)".

### 10.2 T, the instinct line (`src/sim/instinct.js`, the scenarios)

- Each scene yields instinct rules (most pressing first): `{ id, tone: calm|note|warn|urgent, text with {key} placeholders, act }`. `settle()` keeps the line already up while its rule still fires and nothing more pressing does (no flicker), and drops a line at once when its rule stops firing ("no advice that no longer applies"). T sends `'instinct'`, and the scene does `prompt.act`.
- The prompt box at the foot of the screen (`ui.js` around lines 495–508) shows one line, its tone as its border colour (urgent red, blinking 3 times), keys rendered as `<kbd>` in the player's layout. Then **R's offer appended as a chip** ("{use} look in the window"). The body's own line (bleeding, cold) takes over when it is more pressing (`aid.js bodyLine`).
- Cosmetic variety without dice: `acts.js say1()` picks a line by `hash(id, floor(ms/12000))`, so "the instinct mustn't move the game's rolls".
- The user (2026-10-26): "we need a serious instinct overhaul, it is mostly useless, giving advice that doesn't even apply to some situations".

### 10.3 R, what's at hand (`src/sim/acts.js`)

- `affordance(state, me)` → `{ act, text }` or null, in priority order: a book while seated; an item lying within reach (pick up); in a shop: counter / ledge / basin / back door; a metro door; a kiosk / phone box / bus shelter / notice board; at the kerb: zebra or taxi; a parked car's window; a shop window; a bench; a crossing.
- `act()` turns it into the player's **busy plan**: `me.busy = { what, steps: [['go', x, z], …, ['wait', ticks, face, gait]], wait, since, done }`. `game.js busy()` (lines 407–422) walks the `go` steps at `WALK_MS` (giving up if a second's walking hasn't closed the distance by 5 cm) and holds the `wait` steps. Moving cancels it (`n > 0.01 && !input.look → me.busy = null`). `done` keys fire follow-ups (`'downed:…'`, `'scene:…'`).
- Interiors use the same thing: `interiors/use.js walkTo(state, a, spot)` paths round furniture and adds `['wait', 1, spot.face, 'idle']`. The campaign then acts on arrival (`state.scenario.using`).
- The user (2026-10-28): "'T' as a universal key interferes when several things can be done with it … when the option to call of the meeting for a brush pass is available, we can't look in a shop". So T and R were split, and "it's a game engine thing": R affordances are the engine's, not each scene's.

---

## 11. Interiors (`src/sim/interiors/*.js`, `src/sim/map/interior.js`)

### 11.1 Plans (`plan.js`)

Pure data, metres, x east and z south (toward the camera):
- `rooms: [{id, kind ('living','bedroom','kitchen','bath','hall','office','lobby'…), x0,z0,x1,z1, floor, paint, wall}]`
- `openings: [{axis:'x'|'z', at, a, b, kind:'doorway'|'door'|'front'}]`, `windows`, `windowsS` (street side, cut low)
- `items: [{kind, x, z, face, look}]` (furniture), `spots: [{kind ('sleep','phone','wash','eat','cook','window','read','dress','desk','chief'…), x, z, face, seat?}]`, `exits: [{id, x0,z0,x1,z1, to}]`, `lights`, `decor`, `staff`, `seats`, `errands`.
- `walls(plan)` merges room edges per line, cuts the openings out, and gives heights for the **cutaway**: outer north/east/west walls stand `WALL_H 2.8` m; the street side and every inner wall are cut to `CUT_H 1.0` m "so no wall hides the room behind it" (the camera looks north, 45° down). `WALL_T 0.16`, `OUTER_T 0.3`. `mirror(plan)` flips east–west. `STEP_M 0.4` past a door counts as out (the user, 2026-10-28: "The door to exit the embassy is finicky").

### 11.2 Furniture catalogue (`furniture.js`)

`FURNITURE[kind] = { w, d, h, block, wall, y0, use, seats:[{dx,dz,face}], spot, staff }`, in real proportions against a 1.7 m person (a bed 1.6 × 2.1 m, a single bed 0.9 × 2.0, a wardrobe 1.2 × 0.6 × 2.0, a toilet 0.4 × 0.7, a bathtub 1.7 × 0.75…). **Uses:** `sleep, sit, eat, cook, wash, toilet, phone, work, read, watch, store, buy, pay, drink, bake, change, post, lift, stairs, screen, exchange, door, coat, basket`. `footprint()` swaps w and d when turned left or right. `seatsOf(item, 'seats'|'spot'|'staff')` gives world positions and facings. Groups: home, stairwell, shops, office/embassy (security desk, metal detector, X-ray, vault door, water cooler), range (booth divider, range bench, bullet trap). The art (`src/art/furniture.js`) draws every kind to these sizes "within a pixel".

### 11.3 Paths (`path.js`)

`wayAcross(S, ax, az, bx, bz)`: a grid of `CELL_M 0.25` m squares over the plan, each free if a 0.27 m circle at its centre touches no blocker. A* over 8 neighbours (no corner-cutting), then string-pulled straight along free cells. Computed on demand, nothing kept ("a flat is a few hundred squares"). **Caveat:** the open set is a plain array scanned linearly (lines 26–29), which is quadratic. Fine for a flat, too slow for a 100 m ship deck. Use a binary heap and cache the free grid per plan in OLYMPUS.

### 11.4 Generated flats (`flat.js`)

Three layouts by seed: `bands` (10.5–12 × 7.6–8.4 m: bedroom, bath and hall at the back; living room and kitchen in front), `corridor` (11–12.5 × 8.4–9.2), `studio` (8.5–9.5 × 6.8–7.2). Each is mirrored half the time and dressed by the city's way of keeping house (wallpaper patterns, floors by room, woods, fabrics, a phone colour, decor clear of windows and tall pieces, Moscow's carpet over the bed, a light mood), with moving boxes before unpacking (`UNPACKED_DAYS 3`). Spots: `dress, sleep, phone, wash, eat, cook, window, read`. The user (2026-10-27): "make sure appartments are generated to a point, meaning that colors, decorations, ambiance, layouts needs variability".

### 11.5 What each home spot does (`scenarios/campaign.js` `use()`, lines 485–551; `SPOT_LINE` 561–572)

The instinct names the spot ("Your bed. {instinct}: sleep till seven."), and T walks there and acts:
- **bed**: sleep, or a card offering nap / lie down;
- **basin**: a card with wash and the bathroom cabinet's supplies, one at a time;
- **kitchen table**: eat (larder) or gun work;
- **wardrobe**: what to wear and what to keep, armour on or off;
- **window**: look out at the street from above, the flat's watch point;
- **phone**: answer or call;
- **armchair**: read;
- **door**: what to wear out (coat, umbrella).

At the embassy: **desk** → the work day; **chief** → his card. These are exactly the "world appliances that skip time" OLYMPUS wants (a shower, a rack, a mess-hall table, a footlocker, a weapons-cleaning bench).

### 11.6 Shops, embassy, range

`shop.js` sets a shop's ground-floor plan into its building on the street (front room behind the window, back room, back door to the lane). The street "opens like a dollhouse" round you (`render/cutaway.js`), and others see you through the glass. `embassy.js` has a lobby with the Marine's desk, metal detector, X-ray, flags; the consular room; corridor; chief's office; station room behind a vault door; the tank. `range.js` has an indoor range: `LANES 5`, `LANE_M 1.8`, firing line, `DISTANCES_M [7, 15, 25]`, stands, trap. That last one is directly relevant to OLYMPUS marksmanship qualification.

User (2026-10-27): "let's build a lot of interiors, like appartments, there should be a lot of multiroom interiors including buildings in cities, supermarkets etc, bakeries should be built etc, and doing the things like going out the back should be a thing we do when inside and not abstracted".

---

## 12. The campaign's day and career (skimmed: `campaign.js`, `career.js`)

- **The day:** cover job `WORK {from 9, to 18}` on weekdays, `WAKE_H 7`; the canteen lunch counts as a meal (`eat(now − 4h)`). Missing a day costs cover standing (`COVER_MISSED 10`); a day's work earns `COVER_PER_DAY 6`. Sick days: the first in 30 days is free, then −2 each.
- **Assignments** are planned a week ahead each day (`plan()`): per-asset cadence `sdr [3,6]` days, `tail [4,8]`, `watch [5,9]`; one a day at most, never overlapping; evening slots 18:30–20:30 on workdays and 14:00–19:00 at weekends. Deterministic per day (`stream('plan', seed, d)`). They are walked to (the mind's map sets a waypoint), begun at their place with T inside a time window, and **missed if late**. `pass()` settles the calendar: pay on the 1st (`SALARY 7200` $/month, `FUND 2500`), the weekly review on Sunday night, arrests, expulsion at heat 95.
- **Career** (`career.js`): between postings, `LEAVE_WEEKS 3`, then language school by FSI category (`LANG_WEEKS`: fr/es 30, de 36, ru 44, ar/zh 88), skill floors with `WEEKS_PER_POINT = 2 + 0.25 × base`; schools with flavour lines (Delta selection, Ground Branch…); `planPaper()` gives orders as a paper with each phase. Age from `born`; retirement at `RETIRE_AGE 60` at a posting's end; the next officer `SUCCESSOR_WEEKS 8` later, in the same world. The user (2026-11-04): "we should track the year in game, because between stations, there may be mandatory trainings and long periods of time can pass"; "a campaign is the same until we start a new one (geopolitics and date/time continue on the same timeline when we die or retire an officer and pick the next one)".
- **For OLYMPUS:** postings become deployments, schools become MOS/Recon/special-ops pipelines, the weekly review becomes fitness reports and promotion boards, and assignment cadence becomes the training schedule and duty roster. `career.js`'s "weeks skipped with a paper per phase" is the right shape for basic training, travel to Europa, and so on.

---

## 13. Dialogue and phone

### 13.1 `talk.js`: conversation (thin)

- `state.talk = { who, id, round, said:[{ours, theirs}] }`. Time stands still while it is open.
- `CHOICES`: ask the time, ask the way, small talk, leave it there. Our line comes from `OURS[id]`. Their reply comes by `mood(p)`: `afraid` if fear ≥ 3 (they leave), `cold` if affinity ≤ −2, `warm` if affinity + trust ≥ 3, else `neutral`. The pick is by `hash(round, who.length, tick)`, with no rng. The time they tell is the watch's, spoken to five minutes ("Twenty to").
- Each choice nudges a gauge by 0 (resetting drift contact). The UI talkbox (`ui.js` around line 391) sits next to them with the last 3 exchanges and number keys.
- DESIGN.md plans the real thing: "approaches (charm, convince, elicit, lie, intimidate, bribe, ask a favour, reassure, threaten, pitch) … each leads to a check", hooks halve a DC, and "a KLM style minigame for at least some conversations" (the user, 2026-10-26). **None of that is built.** OLYMPUS must design its own dialogue: orders, briefings, chain of command, banter, squadmates' relationships. Use tradecraft's gauges, mood words and opposed rolls as the base.
- Scripted speech goes through `log.js speak()`. A line's quoted words go in a **balloon over the speaker** for 16 s (the user, 2026-10-27: "speech bubbles for scripted speech"). The rest goes top left. The earpiece (`kind: 'radio'`) is a box over the prompt with `READ_S + words × WORD_S + 5` s life: good for comms chatter in OLYMPUS.

### 13.2 `dial.js`: phone services (campaign)

`services(state)` → `[{ key, label, ok, why, phones:[{key, label, ok, why}] }]`: food to the flat (`FOOD_USD 18`, at the door in 30–45 min), a taxi (3–6 min), a clean gun by dead drop, equipment, a clandestine clinic, a clean-up crew, extraction, the black market's versions (`BM_TRAP` chance of a sting). `ring(state, bus, key, phone)` charges support, money or heat (`OWN_HEAT 4` on a watched line, nothing from a burner), and schedules the outcome in `c.rung`, checked each second by `second()`. The pattern of a menu of services, each with `ok`/`why`, then a channel choice, with deferred delivery, maps to OLYMPUS requisitions and comms (the armoury, the QM, medical, calling a squadmate). The content is skip.

---

## 14. Input (`src/ui/input.js`)

- **Physical keys** (`KeyboardEvent.code`), labelled by `navigator.keyboard.getLayoutMap()` where Chrome has it, else **AZERTY labels by default** (the user: "don't give me the QWERTY keybinds"). The map: `KeyQ→A, KeyW→Z, KeyA→Q, KeyZ→W, Semicolon→M, KeyM→',', Comma→';', Period→':', BracketLeft→'^', BracketRight→'$'`. `label(action)` gives a key's on-screen name. `{key}` placeholders in any text become `<kbd>` with that label (`ui.js keyed()`).
- `KEYS`: up `KeyW`, left `KeyA`, down `KeyS`, right `KeyD` (Z Q S D on AZERTY), arrows too; run `ShiftLeft`; slow `AltLeft` (Option on a Mac); interact `KeyF`; inventory `KeyI`; aid `KeyH`; instinct `KeyT`; watch `KeyE`; sheet `KeyC`; camera `KeyP`; hit `KeyK`, grapple `KeyL`, guard `Semicolon` (M on AZERTY); gun `KeyG`; aim `KeyX`; use `KeyR`; mindmap `Tab`; log `KeyJ`; pause `Space`; menu `Escape`. `?` (by `e.key`, Shift+comma on AZERTY) shows or hides the keys.
- `poll()` → `{mx, mz, run, slow, look}` each tick. E is **hold vs tap**: `TAP_MS 220`, so a tap is `'glance'` and a hold is `look`. Action keys fire once on keydown (ignoring repeat). Meta/Ctrl combinations are left to the browser; focus in inputs is ignored; move keys, Tab, Space and Alt `preventDefault`; window blur clears held keys.
- Digits in menus are read by `e.code` (`Digit1`/`Numpad1`), because AZERTY's top row types `& é " '` without Shift (`ui.js digit()`).
- Mouse: menus only, except shooting (hover to bracket a target, click to aim, click again to fire). The user (2026-11-03): "Make aiming more natural … but no list".

---

## 15. The UI framework (`src/ui/ui.js`, `mind.js`, `pockets.js`, `plaque.js`, `body.js`, `style.css`)

### 15.1 Structure

- `createUI({ input, cb })` builds plain DOM over the canvas (`#frame`) and returns methods. The UI **never changes the state**: player choices go back through callbacks as action strings (`acts.push('desk:…')`) consumed by the next tick. The sim tells the UI what to show via bus events.
- Bus events the UI listens to (`main.js` lines 190–246): `log`, `read`, `aid`, `autosave`, `assignment`, `papers`, `call`, `desk-open`, `chief`, `door`, `table`, `bench`, `wardrobe`, `basin`, `reading`, `bed`, `safehouse`, `photo`, `shop`, `reflex`, `bus`, `metro`, `police`, `taxi`, `scenario-end`, `cut`, `brief`, `map`. Many of them just open a choice card via `ui.openChoices(STAMP, TITLE, [{key,label,off}], act)`.
- **Picture:** `RES 640 × 360` base, extended on other window shapes up to `RES_MAX = [2 × 24 × 16, 430]` = 768 × 430 in code (DESIGN.md says 736 × 430), scaled to fill with every pixel the same size. **16 px per metre**, orthographic, 45° down. HUD placement: `sx = RES[0]/2 + (x − cam.x) × 16`, `sy = RES[1]/2 + (z − cam.z) × 16 − height_m × 16`, then × the frame scale `k`.
- `update(state, paused, view)` runs every frame and is long (lines 250–552). It uses `dataset.key` caching to avoid re-rendering unchanged elements.

### 15.2 HUD elements

- **The watch** (top right): time, date (year once not 2026), place (street name under the player), sky and temperature, what's in hand, status icons (the hunt's three, police and ambulance badges). DESIGN.md: "A clock only if the character carries something that tells the time".
- **Toasts** (top left): log lines, at most 3, `TOAST_S 16` s, a roll's short form with its full sum on hover; the user wanted 16 s (twice the 8 s it was).
- **Balloons** over speakers, lifted clear of other tags.
- **The instinct prompt** at the foot (section 10.2), plus the R chip.
- **Plaques** drawn in the picture's own pixel font: places that are yours over their doors, marked faces, felt contacts (at the picture's edge with an arrow and distance when off-screen), the goal pointer (waypoint) at the edge. The user (2026-10-27): "infocards need to be revamped, they feel low quality, low tech too sharp and practical", which led to the enamelled pixel plaques.
- **Over people:** the F key, a "you" caret when crowded, `?`/`!` awareness bubbles, a fight's intent icon and states, shooting brackets and reticle with the hit %.
- A blood-loss veil (opacity by blood lost), a PAUSED banner, a keys bar folded behind `?` (the user, 2026-10-27: "put the keybinds behind '?' key instead of always in the bar at the bottom").

### 15.3 Cards and screens (all pause the game)

| Key | Screen | Content |
|---|---|---|
| Esc | Menu (dark glass) | resume, save to file, load file, debug save/load, quit; debug toggle |
| J | **Log** | every line newest first, timestamped, roll sums; unseen events only in debug after the scene |
| C | **Character sheet** "PERSONNEL" | 4-column grid: the body figure with wounds numbered (`body.js figure()` on `art/doll.js`); "On you" (wounds, pain, tired, core °C, fed/stress words), the fitness graphic (cells ±3 round base, weekly load bar, hover infocard), what you carry; "What you are" (over-skill bar plus XP bar, skills table with level, practice dots, rust, × multiplier, value); "The file" (age, languages, background, the legend, the posting, the record of assignments and reviews) |
| I | **Inventory** (`pockets.js`) | a figure in the clothes you wear, pockets on it, each pocket a tile (coat ×2, inside, trousers ×2, beltline, sling) with pixel icons and how full it is, what shows or bulges; the hand, armour, the shop's bag; buttons take out / put away / drop |
| Tab | **The mind** (`mind.js`) | leaves 1–5: **Ahead** (agenda, waypoint buttons, next brief, "the day": lie low / walk on), **The city** (a pixel map of known streets, 2 rows each side, zoom levels `[0.75…3.6]` m/px, arrows, place filters, click to set a waypoint), **People** (network, call panels), **Where you stand** (believed heat and cover, money, needs), **The phone** (services) |
| F | Interact menu, then **Read** card | your read of them: figure, wounds, ranges on bars, class |
| H | **First aid** | body figure, findings, numbered options with why and "Do it" |
| context | **Choice cards** | stamp + title plaque, numbered buttons, optional "keep" toggle |
| — | **Papers** (cream paper, Courier) | briefs, results, debriefs, pay, reviews, the officer picker, calls |

Visual tokens (`style.css`): `--ink #1a1214`, `--paper #f4efe6`, `--brass #e7b84a`, `--red #9e3c36`, `--muted #8f96a6`, `--hud rgba(20,21,28,0.78)`; fonts `--mono` (ui-monospace/SF Mono) for the glass and `--type` (Courier New) for paper. The glass is `rgba(20,21,28,0.94)` with a 1 px border `#353947` and radius 4. Prompt tones: calm `#4c5262`, note `#3b6296`, warn brass, urgent red.

The user's quotes on UI are collected in section 19. The direction is consistent: purpose-built screens rather than generic paper, graphics and hover infocards rather than words, and a zoomed, navigable map of what the character knows.

---

## 16. Performance notes for crowds (for OLYMPUS habitats)

- Keep sim and render costs separate and measured. Tradecraft found the sim was never the bottleneck at about 100 actors (0.13–0.36 ms/tick). All its hitches came from painting textures and uploading atlases. OLYMPUS should budget the same way: instanced sprite draws, a per-sheet atlas upload, painting spread across frames, and a `view.stats` breakdown per frame (`window.__tradecraft.view.stats` exists).
- Per-tick O(n) is fine at about 100 actors: one hash rebuild, one movement pass, cheap notice checks against a cached player (`state.$me`). Everything heavier runs once a second, staggered by id hash (followers every 10 ticks, onlookers once a second each on their own tick).
- No NPC–NPC collision (steering only), and kinematic route-following for agents.
- Off-screen and off-map: no perception and no drawing. Throwaways are regenerated from seeds rather than stored. Sections, weather, passers-by, flats and rotas are all **pure functions of (seed, place, time)**. That is "as much background generation as possible done without rendering", which is exactly the user's OLYMPUS ask.
- Line of sight: building walls binned by x (8 m bins) with a stamp counter to test each wall once per query.

---

## 17. Reuse assessment for OLYMPUS

| Module | Verdict | Why |
|---|---|---|
| `src/sim/rng.js` (sfc32, `stream`, `hash`, `d20`, `weighted`) | **reuse as-is** | pure, tiny, saved as 4 words; side streams are essential for determinism |
| `src/sim/bus.js` | **reuse as-is** | 10 lines, pure |
| `src/sim/state.js` (toJSON `$` stripping, `fromJSON`, `upgradeState`) | **adapt** | the pattern is right; the shape and migrations are tradecraft's; change the `game` marker |
| `src/ui/store.js` (IndexedDB slots, export/import file) | **reuse as-is** (rename DB) | generic |
| `src/sim/clock.js` | **adapt** | keep integer ms, `TICK_MS 50`, Hinnant for Earth UTC; add the Mars sol (88,775,244 ms), a Mars-local clock and sol numbering; drop the Moscow TZ |
| `src/sim/log.js` (`say`, `speak` with balloons, `LOG_MAX 500`) | **adapt** | the mechanism is good; detach `xp.fromRoll` |
| `src/sim/checks.js` (d20 + skill + named mods vs DC; opposed, ties to the player; `checkText`) | **adapt** | the user wants "RPG-like resolution of challenges" as in tradecraft; reuse the shape, rewire body/need mods |
| `src/sim/skills.js` (base + practice × over-skill weights; classes) | **adapt** | the `soldier`/Warfighting class exists with empty weights; OLYMPUS defines the marine skills and weights |
| `src/sim/game.js` (tick order, `skip()`, `busy()`) | **reference / rewrite** | the structure (input → move → look → think → rules → once-a-second → clock) and `skip()` are the template; the body is entangled with taxis, metro, police, spycraft |
| `src/sim/world.js` (bucket grids, `move()` slide+nudge, `near`, `rehash`) | **adapt** | grids and movement are generic; section streaming along x and row exits are street-specific |
| `src/sim/perception.js` | **adapt** | cone/aware/reach/LOS/soft visibility/memory ghosts fit a top-down soldier game perfectly; drop the glass mirror; add light from habitat lamps, helmet visor FOV, NVG/thermal, smoke and dust, vacuum (no sound) |
| `src/sim/sense.js` ("the feel") | **reference** | spy-flavoured; the "felt patch lifts the fog" trick could serve a squad datalink or special-forces awareness |
| `src/sim/know.js` (Read: ranges narrowed by reads) | **adapt** | sizing up a stranger or a recruit; fine as-is in spirit |
| `src/sim/belief.js` | **reference** | "what the character believes" words with confidence: good for morale or standing |
| `src/sim/people.js` (sheets, gauges + weekly drift, `passerby(seed)`) | **adapt** | the structure is reusable; replace names and looks with Martian, Belter and Earther cultures; add relationships between NPCs, which tradecraft lacks |
| `src/sim/agents.js` (kinematic route agents with stops, background walking) | **adapt (core) / skip (followers)** | the route + stops + visit + off-map walking core is valuable; it depends on `city.js`'s street graph, so it needs a generic navgraph; the follower AI is spy-specific (reference for pursuit) |
| `src/sim/crowd.js` (bubble, density curve, spawn-unseen, recycle, `lies`) | **adapt** | the rules are right for habitat crowds (Ceres concourse, Europa dome); tied to rows and `LINE`, so re-express on module/zone graphs |
| `src/sim/habits.js` | **reference** | stop styles become civilians' errands |
| `src/sim/interiors/staffing.js` (rota by hash, live vs jump, errands, applicants) | **adapt (high value)** | closest thing to "NPCs with their own lives"; generalise to per-NPC schedules for barracks and mess hall |
| `src/sim/needs.js` | **adapt** | the hunger and stress code and the "time since X" style; extend to water, sleep debt, hygiene, bladder/bowel, gravity, air |
| `campaign.js fatigue()` | **adapt** | hours awake → modifiers |
| `src/sim/thermal.js` | **adapt** | the core temperature exp model suits vac-suits, cold Europa, hot reactor decks; replace clothing warmth with suit thermal control |
| `src/sim/wet.js` | **reference** | rain is irrelevant; the soak/dry model could become sweat in a suit |
| `src/sim/weather.js` | **reference** | pure-function-of-(place, day) weather is a good pattern for Mars dust storms and seasons; the content is Earth cities |
| `src/sim/clothes.js` | **reference** | slots, wardrobe, what's worn when going out; OLYMPUS: uniforms, PT kit, armour, vac suits, footlocker |
| `src/sim/items.js` + `ui/pockets.js` | **adapt** | volumes and pockets with "what shows" (the user: "no magic inventory, volumes and pockets"); OLYMPUS adds load-bearing gear, mag pouches, rucks |
| `src/sim/interact.js` | **adapt** | F menu grammar (`atHand`, options with `ok`/`why`, submenus, crouched timed actions); the content is street violence |
| `src/sim/acts.js` | **adapt** | the `affordance()` + busy plan pattern is the R key; the street content is skip |
| `src/sim/instinct.js` | **reuse (settle) / adapt** | `settle()` is generic; OLYMPUS writes its own rules (the squad leader's voice, training cues) |
| `src/sim/talk.js` | **reference only** | too thin; build a real dialogue system |
| `src/sim/dial.js` | **skip** (pattern reference) | spy phone services; the services-with-channel pattern could serve requisitions |
| `src/sim/career.js` | **reference** | the between-postings training phases → military schools; age and retirement |
| `src/sim/campaign.js` | **reference** | week-ahead deterministic scheduling, cadences, `work()` share-of-day, pay, weekly review → duty roster and fitness reports |
| `src/sim/interiors/plan.js` | **reuse / adapt** | rooms, openings, cutaway walls are generic; ships need multiple decks and hatches |
| `src/sim/interiors/furniture.js` | **adapt** | the sized catalogue with uses, seats, spots, staff is exactly right; add racks/bunks, footlockers, gun racks, showers, heads, mess lines, med bays, airlock lockers |
| `src/sim/interiors/use.js` | **reuse as-is** | spots, `walkTo`, `exitHere` |
| `src/sim/interiors/path.js` | **adapt** | correct A*; swap the linear open list for a heap and cache free grids for big decks |
| `src/sim/interiors/flat.js` | **reference** | seeded layout plus dressing; write barracks, ship and habitat generators the same way |
| `interiors/{shop,embassy,range}.js` | **reference** (range: **adapt**) | the range is a ready model for qualification |
| `src/sim/map/interior.js` | **reference** | planOf centring trick |
| `src/main.js` | **adapt** | accumulator loop, overlay pause, error containment, debug handle, URL params |
| `src/ui/input.js` | **reuse / adapt** | physical codes, AZERTY labels, tap vs hold; change the `KEYS` table |
| `src/ui/ui.js` | **reference / rewrite** | copy the look and grammar (glass cards, plaques, prompt, toasts, balloons, keyed text); split the 1,169-line monolith into per-screen modules |
| `src/ui/mind.js` | **adapt** | the Tab mind becomes the marine's datapad (agenda, a known-map with waypoints, people, standing) |
| `src/ui/plaque.js`, `body.js` | **adapt** | pixel plaques and the wounded-body figure are the house style |
| `src/render/crowd.js` | **reference** (another slice) | instancing plus atlas strategy for crowds |

Overall: the **engine conventions and small pure modules** are reusable directly. The **NPC and crowd engines** are reusable in design but bound to the street-row model, so they should be re-implemented over a generic zone/navgraph with the same rules. The **content** (spycraft, cities, phones, police) is skip. The user's own rule for OLYMPUS: "only refactor the tech from there if it's the best way".

---

## 18. Gaps between tradecraft and what OLYMPUS asks for

1. **The splash screen and fast-forward** for time-spending activities: not in tradecraft. Build `skip` events plus an illustrated card with a running clock.
2. **NPCs with their own lives** (fully fledged and permanent): tradecraft has only the embassy rota and route-walkers. Persistent NPC schedules, needs, relationships, memory and off-screen outcomes are new. Suggested shape: each persistent NPC has a sol-schedule template (by unit and role) resolved by `hash(npcId, sol, block)`; on the player's map they act through `staffing.js`-style step plans; off-map their state is computed in closed form on demand ("where is Cpl. X at time t" = schedule lookup); needs use "time since X".
3. **Needs list:** water, hygiene, bladder/bowel, sleep debt, gravity effects (Mars 0.38 g, transit 0 g, burns under high g), air (O₂/CO₂ in suits and habitats). Only hunger, stress, fatigue, core temperature, wet and wounds exist.
4. **Dialogue:** a real system is needed: chain of command, briefings, banter. Tradecraft's is four canned lines.
5. **A map model beyond streets:** decks, modules, airlocks, surface tiles, ships; multi-floor. Tradecraft's maps are one-floor rows. Interiors are single plans with exits.
6. **Interiors at scale:** the path grid must be faster; cutaway for multi-deck ships.
7. **Weapon handling detail** (another slice): tradecraft has `firearms.js`, `shooting.js` and `gunwork.js` with stop-motion shooting and mags. OLYMPUS adds safety and muzzle discipline.

---

## 19. User preferences found (dated, verbatim where quoted)

These are the user's tastes, recorded across tradecraft. They should carry into OLYMPUS.

- 2026-10-26: "a notion of where we're looking and what characters are aware of" (perception drives screen and dice).
- 2026-10-26: "at night we don't get a malus to sight?" (light-dependent sight range).
- 2026-10-26: "the interact button F that when close to someone should open the contextual menu to do things like TALK, VIOLENCE … READ".
- 2026-10-26: "talk should pause the game, like combat, we will find a KLM style minigame for at least some conversations".
- 2026-10-26: "very little storage space, no magic inventory, volumes and pockets. Concealed weapons only when concealable".
- 2026-10-26: "don't give me the QWERTY keybinds" (AZERTY labels default; keys by position).
- 2026-10-26: "formalize where NPCs are going, pathfinding that works 100% of the time"; passers-by need "a destination in mind… where the tail would end if it were an actual mission".
- 2026-10-26: women's and men's haircuts must differ "so who's who reads at a glance".
- 2026-10-26: "Before 1.0, old saves are kept only where it comes naturally".
- 2026-10-26 (CLAUDE.md): "stop killing the brightness" (machine keep-awake).
- 2026-10-27: "speech bubbles for scripted speech, they should linger as long as when using the top left text".
- 2026-10-27: "hunger and stress needs".
- 2026-10-27: "let's build a lot of interiors … doing the things like going out the back should be a thing we do when inside and not abstracted".
- 2026-10-27: "pass the time things should be natural and time should feel like a currency".
- 2026-10-27: "make sure appartments are generated to a point, meaning that colors, decorations, ambiance, layouts needs variability".
- 2026-10-27: "environments reuse exactly the same elements, please generate at least three more kinds of everything".
- 2026-10-27: "put the keybinds behind '?' key instead of always in the bar at the bottom".
- 2026-10-27: "infocards need to be revamped, they feel low quality, low tech too sharp and practical".
- 2026-10-27: "when we start the campaign, it should be in the appartment of the starter character".
- 2026-10-28: "'T' as a universal key interferes when several things can be done with it" (T and R split).
- 2026-10-28: "when sleeping, the hunger meter is frozen that's a bug".
- 2026-10-28: "the ambassy looks to be static, NPCs should move around (not much but still) leave the office at 6pm …".
- 2026-10-28: "most menus need revamping, the generic paper isn't adapted to inventory".
- 2026-10-28: "The TAB key for desk should be the mindmap, the character's knowledge not the desk".
- 2026-10-28: "what we see is what our character evaluates as being true".
- 2026-10-28: "Looking at smartphone should become a thing some NPCs do".
- 2026-10-28: "Implement a robust health system inspired by Rimworld and Project Zomboid" (quoted in `wet.js`).
- 2026-10-28: "The underground selection should be graphical with points of interest drawn on the map".
- 2026-10-28: "a section with an actual map (known only again, it's our mind) where we can select waypoints".
- 2026-10-28: "The door to exit the embassy is finicky, we have to really try to get out".
- 2026-10-29: "we should not have the option to just fast travel to work, it would skip all the gameplay".
- 2026-10-29: "each time I turn it staggers almost a second" (performance hitches are noticed).
- 2026-10-31: "i never asked to take the medication when washing up" (nothing consumed unasked).
- 2026-10-31: "why are all these items … not taking any inventory space ?".
- 2026-10-31: read a book "for as long as we want (one way to pass time, in chunks of 10min)".
- 2026-11-03: "time passing (like during a judo class) doesn't seem to recycle the NPCs on the map?".
- 2026-11-03: "extreme fatigue … should chip away at skill efficiency"; "a notion of fatigue preventing … working out more than once a day".
- 2026-11-03: "fitness should remain a skill, but there should be a shadow skill called effective fitness … Walking would be part of exercising … high level athletes require more training than lambda joes".
- 2026-11-03: "There should be a reflex mode, where time stops when things require it".
- 2026-11-03: "people are just ignoring this shot woman on the ground, they should call the emergency services".
- 2026-11-03: "someone fleeing a shot runs, not a very fast walk".
- 2026-11-03: "the map should be zoomed in our position, showing 2 streets around us maximum, and a zooming and arrows control to navigate".
- 2026-11-03: body screens "should include graphical representations (high quality based on inventory screen)".
- 2026-11-03: "the flat should have limited groceries".
- 2026-11-03: "Make aiming more natural … but no list".
- 2026-11-03: "add temperature, seasons and link them to NPC clothing … hypothermia and heat strokes".
- 2026-11-03: "don't give a firearm to officers by default, firearms need to be rare … acquiring one should be a whole thing" (tradecraft's world; OLYMPUS marines are issued arms, but the realism stance holds).
- 2026-11-04: "there should be a limit to how hungry we get before we pass out and die or get taken to a hospital".
- 2026-11-04: "over a certain pain threshold, people just lit up against a wall or lie down".
- 2026-11-04: "shot and down NPCs … should stay loaded for a reasonable amount of time".
- 2026-11-04: "they would either steer wide away, or pool around the bodies with their phones out".
- 2026-11-04: "the marine in ambassy reads as a civilian, they are military that should count for something".
- 2026-11-04: "the reflex window is spammed on us too, there should be a way to remember our choice for a while".
- 2026-11-04: "too wordy, this needs to be a on-hover infocard"; "too many words, this should be graphics"; "this is clunky".
- 2026-11-04: "we should track the year in game … long periods of time can pass"; "a campaign is the same until we start a new one (geopolitics and date/time continue on the same timeline …)".
- 2026-11-04: "who shouts to drop it ? I don't see any police near me" (sounds you hear but can't see get a felt marker at the screen edge).
- Design pillars carried from DESIGN.md: "Mistakes cost"; "Text carries it" (log lines 16 s, balloons); "Generated, but it should feel authored"; the worries "clunky mechanics, an inconsistent experience, empty gameplay"; "Every number means the same thing everywhere: one shared helper per quantity"; "An active day takes 20–40 real minutes".

---

## 20. Open questions for the user (raised by this slice)

1. **Mars clock display:** show local time in Mars hours (a 24-hour clock stretched over the sol, as in Mars missions) or real Earth hours that roll past 24:39? And does the HUD show Earth UTC as well?
2. **How the fast-forward splash plays:** a fixed illustrated card plus a fast-spinning clock that can be interrupted (an alarm, someone arrives), or a non-interruptible cut? Tradecraft never interrupts a skip.
3. **Whether "a full day in real time" holds:** tradecraft's active day takes 20–40 real minutes because work and sleep skip. For a marine on standby, should PT, drill and classes be lived in real time, or be skippable blocks with outcomes like the tradecraft gym?
4. **Squadmates:** how many fully fledged NPCs (a fire team of 4, a squad of 13, a platoon of about 40)? And how deep is their simulation off-screen: positions and needs by schedule only, or relationships evolving among themselves?
5. **Should the "instinct" voice stay** (the character's own inner advice), become the squad leader or NCO on comms, or both?
6. **Should OLYMPUS keep AZERTY-by-default labels** and the same key map (Z Q S D, F, T, R, G, X, I, C, Tab, J), adding keys for weapon handling (safety, mag release, chamber check)?
7. **How does conversation play:** a real dialogue system with approaches and checks (DESIGN.md's plan, never built), or kept mostly abstract with time standing still as in tradecraft?
