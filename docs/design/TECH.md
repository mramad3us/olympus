# TECH

How OLYMPUS is built: the module layout and its import rules, the tick and its layers, the event queue, the `skip()` engines, the state and the owner of each of its keys, saves and the schema policy, determinism and its tests, the pixel stage's renderer and its budgets, the instruments renderer, the one worker, the porting plan from LONGHAUL and tradecraft, testing, tooling, debug mode, and the performance budgets with how each is measured.

Written 2026-11-05 against `docs/DESIGN.md` (the hub), the research notes (`docs/research/tradecraft-method.md`, `tradecraft-sim-world.md`, `tradecraft-art-render.md`, `longhaul-visuals.md`, `longhaul-physics.md`, `longhaul-combat.md`), the other sections as they stood that day (SETTING, TIME, BODY, SKILLS, WEAPONS, COMBAT, PEOPLE, CAREER, PLACES, VIEWS), and the engine already built in `src/core`, `src/render` and `src/art` during the 0.0.x round. Numbers marked **measured** were taken on 2026-11-05 on the user's Mac (Apple M5 Pro, 24 GB, node 22.18.0), by the repo's own tests or by scratch scripts that import LONGHAUL's modules read-only. The user's decisions are quoted with their dates; my own are marked **(my call)** and hold until the user overrules them. Revised the same day after five critics reviewed the whole design: corrections 14 to 24 (§1.3) and the sections they name come from that review.

---

## The model in short

- **Code flows one way.** `src/core` (the engine, no game knowledge) is under `src/data` (pure tables), `src/world` (LONGHAUL's background), `src/sim` (the game), and `src/art`, `src/render` and `src/ui` sit on top. `src/main.js` wires them in the browser. The sim is pure: no DOM, no three.js, no real time. It reports facts on the bus. These rules are checked by `tests/syntax.test.mjs`.
- **One tick at 20 Hz** (`TICK_MS` 50), in a fixed order of named fast layers. Per-second work is staggered across the twenty ticks of a second by a hash of each id. A **slow step** runs each game minute, and it is the same function a skip calls. Hourly and daily work are **events in one queue**, which live play and skips dispatch alike.
- **`skip()` has three engines behind one state record** (`state.skip`). Fast-forward runs the real ticks faster. The outcome engine steps on a **grid set by the skip's kind**: whole game minutes under a splash, whole hours for a chapter day, event to event only where no clock is shown (the prologue, node's fixtures). The splash's target only decides how many grid steps a frame runs, never where a step ends. All three are sliced across frames so the picture never stalls, and the result never depends on how they were sliced or how fast the splash ran.
- **State is plain JSON.** Its top-level keys are reserved, each belongs to one design section, and each domain registers its keys at `createSim`, so a second claim fails. `$` keys are runtime only. Derived data must be a pure function of saved state. Ids follow one table (§2.3.1), checked by a validator per kind.
- **Saves are per world.** IndexedDB `olympus` v2 has three stores: saves, the profile (which outlives worlds) and a cache. Saves are canonical JSON with a digest. Standard keeps `auto`, an `auto-prev` rotated on time, a `day` slot, nine manual slots and the `edge` slot. Ironman keeps one slot and a hidden `ironman-prev` for a damaged save. `SAVE_SCHEMA` changes additively through `upgradeState`. Saves export and import as files. A **bug report** carries the last autosave and every input since, so the bug replays exactly.
- **Determinism**: integer time, named rng streams, hashes for anything cosmetic, budgets inside the sim counted in work units and never in milliseconds, sorted iteration wherever order decides, transcendental results rounded before they are saved, canonical saves. It is tested by save and load mid-run, a key-order fuzz, slice and target independence, fast-forward against lived time, an id check on every save, and replays.
- **The renderer** is tradecraft's pixel stage, already ported and made faster:
  - one scene pass with multiple render targets (MRT) for the part IDs;
  - static boxes batched into one draw call per atlas page, and outdoor chunks streamed within a budget;
  - people in one instanced draw from an array atlas;
  - static lamp pools tiled and drawn analytically, so the number of lamps is unbounded (my call);
  - a fixed set of shader programs, compiled at boot;
  - textures allocated once and filled by banded uploads. Whole uploads happen only behind a cut.
- **Instruments** are drawn in Canvas2D at device resolution inside a pixel-art bezel. Each one draws a *picture* of what its source knows, never the truth.
- **One worker**, for painting and geometry. The sim and the world stay on the main thread, because the measured costs leave plenty of room and determinism stays simple (my call).
- **Budgets**:
  - 60 fps with p95 at or under 18 ms;
  - the sim at or under 2 ms a tick in the busiest area, and at or under 8 ms under a 4× CPU throttle;
  - GPU budgets per pass for an integrated GPU (Iris Xe or 680M class) at 1080p, with a ladder of degrade steps that keeps the look;
  - at most 160 draw calls in the worst scene;
  - at most 1 MB uploaded in a frame;
  - one table of people per scene: live agents, persistent people, puppets, crowd and drawn instances;
  - saves at or under 1.5 MB after the standby week, re-derived from the records' measured sizes.

  They are measured by heavy tests and by a bench card that the user can run on Windows and paste back.

---

## 1. Ground rules and what exists today

### 1.1 Inherited rules (the hub, CLAUDE.md)

These are settled and not repeated in detail here:
- vanilla ES modules, no build step, fully offline, and three.js 0.186.1 vendored for the stage only;
- Canvas2D for the instruments, plain DOM for the UI, IndexedDB for saves;
- the sim is pure, ticks are integer milliseconds in a fixed order, and a decision made in one tick acts in the next;
- state is plain data, `$` keys are runtime only, and `SAVE_SCHEMA` changes go through additive `upgradeState`;
- one seeded rng with streams, and hashes for anything cosmetic;
- units in constant names, and a prose header on every module;
- one quantity, one helper, and the `window.__olympus` debug handle;
- tests print the numbers that matter;
- 60 fps on the Mac and on Windows (ANGLE over D3D11), no texture upload that hitches, static geometry batched, one instanced draw for the crowd, and the sim under 2 ms a tick.

The user's standing performance asks carry over from LONGHAUL and tradecraft:
- "Perform as well as possible; as much background generation as possible done without rendering actual graphics, yet immersive" (the OLYMPUS brief, 2026-11-05, as quoted in `longhaul-visuals.md` §1);
- "each time I turn it staggers almost a second" (tradecraft on Windows, 2026-10-29: one 64 MB atlas re-sent whole);
- "Build everything as if it's going to scale to huge proportions" (LONGHAUL memory `feedback_scale.md`, 2026-03-24);
- "only refactor the tech from there if it's the best way" (the brief).

### 1.2 Built in the 0.0.x engine round (as of 2026-11-05)

| Module | What it is | Proven by (measured) |
|---|---|---|
| `src/core/clock.js`, `calendar.js` | Integer ms since 2351-03-22 08:00 UTC. The UTC calendar uses Hinnant's algorithm. MSD follows Allison and McEwen, with the Mars local clock, the timeslip and the Mars year. `state.clock = { ms, tick, holds }` | `core-calendar` 10 tests, against Mars24's worked example |
| `src/core/loop.js` | Fixed 50 ms ticks from an accumulator, capped at 250 ms a frame (5 ticks). It has named layers: fast layers every tick, periodic layers on their period's boundaries. The player's pause and the sim's holds are kept apart. It has a synchronous `skip()` that steps a minute at a time, and errors are contained | "a week: 10,080 minutes and 168 hours stepped in 0.6 ms" |
| `src/core/state.js` | The reserved domains, canonical JSON (keys sorted), ±Infinity and NaN carried, a refusal of anything that is not plain data, and `addUpgrade(id, fn)` | `core-state` 7 tests |
| `src/core/store.js` | IndexedDB `olympus`, store `saves`, slots `auto`, `manual-1` to `manual-9` and `ironman`, records stamped with VERSION, export and import | "3,000 ticks of a dummy sim: 1.6 µs a tick … byte-identical saves" |
| `src/core/rng.js`, `hash.js` | sfc32 bit for bit with tradecraft, named saved streams, `stream(...seeds)`, FNV-1a `hash`, `hash01`, `hashPick`, and a cyrb53 `digest` | `core-rng` 6 tests |
| `src/core/bus.js` | tradecraft's and LONGHAUL's bus merged. A listener that throws never throws into the sim | |
| `src/core/keys.js`, `input.js` | Keys read by physical code with AZERTY labels, hold and tap (`TAP_MS` 220), a per-tick snapshot, and the mouse in stage pixels | `core-input` 6 tests |
| `src/core/debug.js` | `window.__olympus` and the URL parameters (`play`, `seed`, `hour`, `mode`, `debug`) | `browser`, `core-browser` |
| `src/render/scale.js` | `PX_PER_M` 16 or 24 from `?ppm=` (24 by default) | |
| `src/render/stage.js`, `camera.js`, `materials.js`, `post.js`, `lights.js`, `moods.js`, `fog.js` | tradecraft's stage. The scene is drawn **once** into two attachments (colour plus part IDs, WebGL2 MRT). The palette snap reads a 64³ lookup **baked on the GPU** (a 512 × 512 pass). The blit is sharp-bilinear. There are 10 lamp-slot pairs. The fog mask is 96 × 128 RG8 (24 KB) | |
| `src/render/batch.js`, `batch-math.js`, `pack.js`, `textures.js`, `cards.js`, `cutaway.js`, `walls.js` | An area's boxes become one buffer and **one draw call per atlas page**, packed shelf by shelf. Pages are uploaded in bands. Cards stand upright. The dollhouse cutaway has a deck mode | "400 boxes: 2,400 quads … 1 atlas page → 1 draw call"; "323 paintings on 1 page of 1024 × 640, 91% filled" |
| `src/art/tone.js`, `palette.js`, `paint.js`, `brush.js`, `tiles.js`, `font.js` | tradecraft's colour maths and its 116-colour palette exactly, plus the MARS, SHIP and EUROPA palettes. The painter writes typed arrays, and the alpha byte carries the glow class. Tiles repeat seamlessly. The pixel font is 3 × 5, with stencils | `render-palette`, `render-batch` |
| `src/ui/boot.js`, `style.css`, `src/main.js` | The title on paper, the menu and keys cards, and a placeholder `sandbox` scenario | `core-browser` 4 tests |
| `tools/*`, `play.sh`, `play.cmd`, `tests/run.mjs`, `helpers.mjs`, `browser.mjs`, `syntax.test.mjs`, `version.test.mjs` | The method: play copy, promotion, releases, the server, shots, keep-awake, the runner (`heavy`, `QUICK`, `SKIP`, `TIMEOUT_MS`) | `syntax` 6 rules |

This section specifies what these modules become and everything around them.

### 1.3 Corrections this section makes to other sections

TECH owns the layout, the state's top level and the implementation. Where an earlier section assumed otherwise, the following holds. The owners should align their text in their next change.

1. **The clock is `state.clock`** (`{ ms, tick, holds, seq }`), not TIME's `state.time.ms`. TIME's top-level key `time` holds TIME's own records (§6.1). `clock.tick` counts lived ticks only; a skip does not add to it, and TIME §5.4's `tick += (t1 − t0) / TICK_MS` is dropped. Staggering reads the game-time phase `floor(clock.ms / TICK_MS) mod N`, which is the same whether time was lived or skipped (my call). `clock.seq` counts every loop tick, held or not, so inputs can be keyed to it (§8.3).
2. **The reserved `sites` domain is renamed `places`**, which PLACES's §1.10 shape (`{ live, sites }`) fills.
3. **VIEWS's `src/art/density.js` is `src/render/scale.js`**, and its `?density=` is `?ppm=` (both already built). `?density=` is accepted as an alias.
4. **The palette lookup is baked on the GPU** (built), not on the CPU in a worker as VIEWS §2.5 proposed. A 64³ bake takes one 512 × 512 draw.
5. **Lamps**: VIEWS's `LAMP_SLOTS` 16 is replaced by tiled static pools with no limit on count, plus 10 dynamic slots (§9.6).
6. **Bus fact names are kebab-case** (`skip-start`, `skip-end`), not VIEWS's `skip:start`. They are listed in one registry (§2.7).
7. **No wall-clock budget inside the sim.** PLACES's "6 solves or 1.5 ms of solving per tick" becomes 6 solves or `PATH_NODES_TICK` 8,000 node expansions per tick. PLACES's "4 ms of sim per chunk" becomes lazy, pure generation (§8.1, rules 6 and 7).
8. **Fitness lives in `src/sim/body/fitness.js`**, where BODY §2.7 put it. SKILLS's `value()` reads effective fitness from it through the injected helper.
9. **The event queue is saved as its heap array**, not sorted (§4). The order is a pure function of the operations done, so determinism is the same, and saving stays a pure read.
10. **Autosave**: `main.js`'s stub (every 30 game minutes) is replaced by TIME §13's triggers, implemented in §7.4.
11. **SETTING's tables go in `src/data/setting/`**, not `src/sim/setting/`. Many domains and the UI read them: ranks, MOS, names, uniforms, the calendar's definitions.
12. **Data are `.js` modules, never `.json` files.** COMBAT's `drills/*.json` become `src/sim/combat/drills/*.js`. A module keeps its prose header (checked), loads with the import graph, and needs no fetch (my call).
13. **Module folders are the owners' own proposals**, adopted as they wrote them: WEAPONS's `src/sim/arms/`, COMBAT's `src/sim/combat/` list, and PLACES's `src/sim/places/` list (§2.1).
14. **The light helper is `lightLevel(state, x, z, ms)` in `src/sim/places/light.js`** (§2.1, §9.6), the name VIEWS uses. PLACES §3.9, VIEWS §2.7 and ROADMAP's 0.0.4 row, which write `src/sim/light.js`, read `src/sim/places/light.js`.
15. **`state.events` is the event queue and nothing else** (§4). PEOPLE §2.5's log of notable happenings, which it also called `state.events`, is `state.happenings`, owned by PEOPLE, with ids `n<n>` (§2.3.1, §6.1). PEOPLE §2.5, §9 and §13.2 rename it.
16. **Ids follow the one table of §2.3.1.** The player is an ordinary person id (`p<n>`), never `me`, `p0` or `p:player`; units are written `2/4-E-2-1`; guns, magazines and suits are items (`i<n>`). Each owner rewrites the JSON samples in its section to match, in the contract patch that builds `core/ids.js` (§18).
17. **Kit and items have one shape and one owner** (§6.1, §6.7): every item record lives in `state.items` (WEAPONS), and a person carries `kit = { tmpl, worn, hands }` with the containers' contents riding in the containers. WEAPONS owns `arms/kit.js` alone (VIEWS draws it). BODY §2.5's `p.wear.suit` is `p.kit.worn.suit`; WEAPONS §4.1's "a sheet's `arms`, a lying item's `arms`, a rack's `arms`" is "the gun's record in `items`, held by a person's kit, a place's lying list or a fixture".
18. **`units` is a top-level key owned by PEOPLE**, as PEOPLE §2.6 writes it, and **`chapter` and `voyage` sit under `time`**, not at the top level as TIME §13 writes them.
19. **A skip's step grid is set by its kind, never by the splash's target** (§5.3). TIME §5.4's `t1 = min(t0 + MIN_MS, targetMs, …)` and §5.7's event-driven shortcut under a splash are replaced: splashed skips step whole minutes, chapter days whole hours, and only skips of a new kind, `world` (the prologue, the successor's gap, node's fixtures: no clock shown), go event to event.
20. **People per scene are set in §16.7.** Everyone live in view is drawn (nobody pops), so PEOPLE §13.2's "figures drawn 80" is replaced by the drawn counts there, and `MAX_PEOPLE` rises from VIEWS's 160 to 256.
21. **Slots** (§7.2): nine manual slots (CAREER §23's "any number of slots" reads "nine manual slots"), the `edge` slot ROADMAP §2.6 asks for, a `day` slot, and a hidden `ironman-prev`.
22. **The honesty marks stay out of the fiction** (§15.5): `debugUsed`, `imported` and `recovered` are kept in the save's meta, the load list and the profile, never on the Memorial Wall or the service-record papers. CAREER §23's `imported` "on its record, the memorial and the profile" reads "on the profile and the load list".
23. **The world layer lands at 0.2, whole** (§5.8, §12.4): traffic, politics, conflict, forces and intel are ported together. At 0.1 the news archive is SETTING §7.7's authored timeline (ROADMAP §5.7's fallback, made the plan). ROADMAP's 0.0.12 row and §15.5's LONGHAUL column move `gravity.js`, `lambert.js`, `spatial-hash.js`, `world.js`'s rails, `politics.js`, `conflict.js`, `forces.js` and `intel.js` to 0.2 beside `traffic.js`, and keep the constants, the ephemeris, `bodyfacts.js`, the hull, faction and name data and the display modules at 0.0.12.
24. **Chrome's V8 and node's are different versions** (§8.1, rule 11). TIME §14 rule 8 ("the user's Chrome and the node tests" as one engine) is refined: transcendental results are rounded before they are saved, and a page replay is the authority when node's V8 differs.

---

## 2. Module layout

### 2.1 The tree

```
index.html                  the page: one stylesheet, the import map for three, src/main.js
src/main.js                 browser wiring: loop, input, store, stage, UI, worker, debug handle
src/core/                   the engine: no game knowledge, no DOM except the two edges
  clock.js calendar.js loop.js bus.js rng.js hash.js state.js keys.js debug.js          (built)
  store.js input.js         the browser edge (BROWSER_EDGE): saves, keyboard and mouse    (built)
  queue.js                  the event queue: a binary heap kept in the state (§4)
  record.js                 the input recorder and the replay feeder (§8.3)
  facts.js                  the registry of bus facts (§2.7)
  ids.js                    the id table and a validator per kind (§2.3.1); counters; put/drop on
                            id-keyed maps with cached sorted ids; ids(map); cmpId; byDistanceThenId()
  num.js                    q(x, step): rounding a transcendental result to its resolution (§8.1, rule 11)
  profile.js                per-layer timing in perf mode (writes only to its own runtime object)
src/data/                   pure tables shared by several domains or the UI: literals, frozen, no logic
  activities.js pod.js furniture.js backgrounds.js hulls.js factions.js bodyfacts.js
  setting/   SETTING's tables, one module per table: ranks.js mos.js names.js uniforms.js
             calendar.js units.js …  (SETTING §1 proposed src/sim/setting/: correction 11)
src/world/                  the background (LONGHAUL's): knows nothing of people or the player
  constants.js ephemeris.js gravity.js lambert.js kepler.js worlds.js rails.js spatial.js
  politics.js conflict.js forces.js intel.js traffic.js news.js voyage.js dropship.js
  optics.js prologue.js jobs.js
src/sim/                    the game: pure, facts on the bus
  game.js                   the composition root (§2.5)
  jobs.js                   recurring jobs by name, merged from every domain (§4.3)
  log.js                    the log and its records (§6.5)
  time/      activities.js skip.js interrupts.js pod.js chapters.js papers.js devices.js estimate.js
  body/      (BODY §2.7: body.js energy.js water.js elimination.js hygiene.js sleep.js stress.js
              thermal.js air.js radiation.js gload.js conditioning.js fitness.js motion.js
              health.js medicine.js aid.js diagnosis.js suit.js drugs.js mods.js)
  skills/    (SKILLS §16: skills.js checks.js xp.js training.js schools.js rust.js templates.js
              know.js feel.js instinct.js instinct/base.js instinct/field.js)
  arms/      (WEAPONS §15: calibres.js models.js ballistics.js firearms.js drills.js carry.js
              shot.js shooting.js penetrate.js upkeep.js armoury.js qual.js explosives.js
              brass.js gunner.js) kit.js (items, containers and load-bearing gear: WEAPONS; §6.7)
  combat/    (COMBAT §18: fight.js steps.js cover.js coverfield.js suppress.js board.js fighter.js
              team.js drills/*.js orders.js roe.js eof.js nonlethal.js cqc.js grenade.js
              casualty.js shipfight.js hits.js dc.js boarding.js eva.js offscreen.js aar.js)
             threat.js reflex.js director.js pictures.js
  people/    person.js roster.js schedule.js behaviour.js walk.js steer.js crowd.js
             perception.js hearing.js relations.js memory.js gossip.js talk.js orders.js
             discipline.js arcs.js lod.js interact.js names.js
  places/    (PLACES §14: model.js plan.js fixtures.js nav.js graph.js chunks.js air.js fire.js
              thermal.js utilities.js weather-mars.js env.js validate.js templates/)
             grid.js collide.js light.js (lightLevel: correction 14) affordance.js
  career/    career.js creation.js standing.js promotion.js pay.js deployments.js mail.js
             memorial.js unlocks.js
  scenarios/ sandbox.js standby.js squadbay.js range.js mess.js samples.js
src/art/                    painters: pixels into typed arrays; no GPU, no DOM
  tone.js palette.js paint.js brush.js tiles.js font.js                                   (built)
  sprites/   roles.js shade.js poses.js rigs.js compose.js templates/<variant>.js
  doll.js weaponcard.js furniture/(kit.js base.js ship.js europa.js) structures.js props.js
  plaque.js bezel.js icons.js sky.js
  jobs.js                   the paint and build jobs (§11.2), callable on either thread
  worker.js                 the worker's entry
src/render/                 the pixel stage (three.js lives here and only here)
  scale.js camera.js stage.js materials.js post.js lights.js moods.js fog.js batch.js
  batch-math.js pack.js textures.js cards.js cutaway.js walls.js                          (built)
  view.js crowd.js decals.js props.js chunks.js pools.js far.js fogcast.js uploads.js
  warm.js stats.js splash.js windows.js
src/ui/                     plain DOM over the canvas; never three
  boot.js style.css                                                                        (built)
  dom.js presenter.js pointers.js plaque.js splash.js
  hud/       watch.js toasts.js prompt.js balloons.js radio.js suit.js tags.js
  cards/     menu.js keys.js sheet.js inventory.js aid.js mind.js log.js papers.js
             choice.js talk.js reflex.js terminal.js settings.js bench.js debug.js report.js
  displays/  kit.js fit.js labels.js marks.js zoom.js scalebar.js
  screens/   view.js system.js planetary.js local.js threat.js scope.js groundtac.js
             terminal.js rangetower.js seat.js
  audio/     presenter.js synth.js mixer.js
vendor/three/ vendor/fonts/  samples/  tests/  tools/
```

Files listed with a domain are proposals made by that domain's section, adopted here. A section may add files within its own folders without changing this document. A new top folder needs a change here.

### 2.2 Import rules (checked)

| A module in | may import |
|---|---|
| `src/core` | `src/core` |
| `src/data` | `src/data` |
| `src/world` | `src/core`, `src/data`, `src/world` |
| `src/sim` | `src/core`, `src/data`, `src/world`, `src/sim` |
| `src/art` | `src/core`, `src/data`, `src/art` |
| `src/render` | `src/core`, `src/data`, `src/art`, `src/render`, `three`, and the pure sim helpers named in `SIM_FOR_VIEW` (`places/light.js`, `people/perception.js` visibility, `body/motion.js` poses) |
| `src/ui` | anything in `src` except `three` |
| `src/main.js` | anything |
| `src/art/worker.js` (and everything it imports) | `src/core`, `src/data`, `src/art`, and the render modules whose header says `Pure.` (`batch-math.js`, `pack.js`). Nothing in its import closure may import `three` |

`tests/syntax.test.mjs` gains three rules:
- the matrix above, read from the code with comments and strings blanked, as its other checks are;
- no `Date`, no `performance`, no `setTimeout` and no `requestAnimationFrame` in `src/sim`, `src/world` or `src/data`. In `src/core` they are allowed only in `loop.js` (frame timing and stats), `store.js` (`savedAt`) and `input.js` (event times);
- `three` imported only under `src/render`.

`BROWSER_EDGE` stays `store.js` and `input.js`.

### 2.3 Module conventions

- **Header.** The first line is `// OLYMPUS <folder>: <what it is>.` Then the model in prose, and for a port its source: "Ported from tradecraft v0.2.0-rc3 `src/sim/checks.js` (79 lines)", with what changed. This is checked: at least one sentence.
- **Functions over plain data.** A sim function takes `(state, bus, …)` or a record, and returns plain values. No class instance is ever stored in the state. Runtime objects (heaps, Maps, grids, typed arrays) live only under `$` keys.
- **No module-level mutable state** in `src/sim` and `src/world`, except memo caches of pure functions keyed by their inputs. Each such module exports `resetCaches()`. The test "two games in one process" (§13.6) proves that nothing leaks between games.
- **Constants** are `UPPER_SNAKE` with their unit (`REACH_M`, `TICK_MS`, `DOSE_SV`, `PATH_NODES_TICK`). Tables are `Object.freeze`d.
- **Ids** are strings in one grammar per kind, listed in the table below and checked by `core/ids.js` (§2.3.1).
- **Iteration that decides anything** goes through `ids(map)` (the map's ids in `cmpId` order, cached: §2.3.2) or a query that returns a deterministic order (`byDistanceThenId`). Never iterate `Object.keys` of a state object to make a choice (§8.1, rule 9).

#### 2.3.1 The id table

The sections wrote the same things several ways: the player as `me`, `p0` and `p:player`; a person as `p12`, `p:0042` and `p-sgt-okafor`; a unit as `2/4-E-2-1`, `u-1-2-E-2-4`, `1/2/E/2/4` and `E/2/1`; a fixture as `f:e1:rack:07` and `fx:mess:t14:s3`; a gun as `r7#p.3` beside items as `i:9921`. This table is the one grammar (my call); owners rewrite their samples to it (correction 16).

**Counted ids** are a lower-case prefix and a decimal counter from 1, with no separator: `<prefix><n>`. The counter is `state.meta.next[prefix]`, and an id is never reused in a world (§6.4).

| Prefix | Kind | Example | Records owned by |
|---|---|---|---|
| `p` | a person of tiers 1 to 3: the player, a squadmate, a promoted crowd member | `p42` | PEOPLE |
| `a` | an actor on the live area | `a7` | PEOPLE |
| `i` | an item: every gun, magazine, suit, cartridge, pouch, IFAK part, letter or tool that has a record (§6.7) | `i9921` | WEAPONS |
| `e` | an event in the queue | `e812` | TIME |
| `k` | a skip | `k37` | TIME |
| `n` | a happening (PEOPLE's notable things; `h` is the hulls') | `n8812` | PEOPLE |
| `h` | a saved hull | `h44` | TECH (the port), COMBAT |
| `fm` | a member of a marine's family | `fm2` | CAREER |
| `fg` | a fight | `fg193` | COMBAT |
| `od` | an order given | `od77` | COMBAT |
| `uf` | a use-of-force record | `uf412` | COMBAT |
| `sh` | a shot, as a hit record names it | `sh812` | WEAPONS |
| `ob` | ordnance in flight | `ob5521` | COMBAT |
| `sv` | a salvo | `sv12` | COMBAT |
| `ai` | an ammunition issue | `ai88` | WEAPONS |

A new counted kind adds its row here in the change that first makes one. Single letters are kept for the seven kinds that fill saves.

**Other ids**:

| Kind | Form | Examples | Owner |
|---|---|---|---|
| world | `w-<seed>`; a second world on the same seed `w-<seed>-<n>` | `w-48213` | TECH |
| career | `c-<world seed>-<n>`, n its order in the world | `c-48213-1` | CAREER |
| unit | `<battalion>/<regiment>`, then `-<company letter>`, `-<platoon>`, `-<squad>`, `-ft<n>` for a fire team; a headquarters `-hq`; any other unit a kebab segment under its parent | `2/4`, `2/4-E`, `2/4-E-2-1`, `2/4-E-2-1-ft2`, `2/4-E-hq` | PEOPLE (the tree, PEOPLE §2.6's own form), SETTING (the order of battle) |
| site, area, room, zone | PLACES's forms: kebab segments joined by `.` | `melas`, `melas.echo.1`, `e1.bay-2-1`, `e1.z.bay-2-1` | PLACES |
| fixture, opening | `f:` or `o:`, then the template's path in `:`-joined kebab segments | `f:e1:rack:07`, `o:e1:bay-2-1` | PLACES |
| spot or seat | `<fixture id>#<n>` (a seat is a spot of its fixture: PEOPLE's `fx:mess:t14:s3` is `f:mess:t14#3`) | `f:mess:t14#3`, `f:armoury:rack-e2#14` | PLACES |
| data record | the key in its table, kebab-case or lowerCamel, unique in that table | `r7`, `6.5x40r`, `shower`, `react-to-contact` | the table's owner |

Rules (my calls):
- **The player is an ordinary person.** Their id is whatever `p<n>` the roster gave them, `state.player.id` names it, and `playerId(state)` is the one helper. No alias (`me`, `p0`, `p:player`) appears in saved data. The next recruit (CAREER §21) is a new person in the same world, and the last one's id must stay on the memorial and in people's memories.
- **A promoted crowd member gets a `p` id** (never PEOPLE §2.2's `x<seed>`); the seed it came from is kept in its `look.seed`.
- **A gun is an item.** WEAPONS's `r7#p.3` is `i<n>` with `model: 'r7'`; its serial (`HAD R7 0412 3378`) is still a hash of its id.
- **Fields that hold an id** are named `id`, `<role>Id` or `<role>Ids` (`leaderId`, `subjectId`, `assignedId`), or `who`. Maps keyed by id are registered as such by their owner at `createSim` (§2.5). The validator walk of §8.2 relies on both.
- **Order.** `cmpId(a, b)` compares the kind, then the number, then the rest: a total order in which `p9` comes before `p10`.

`core/ids.js` exports `ID_KINDS` (the two tables as patterns), `isId(kind, s)` and `kindOf(s)`. The determinism suite walks every save it makes and asserts that every id passes its kind's validator and names a record that exists, or one on the memorial (§8.2, `game-ids`).

#### 2.3.2 Sorted ids without sorting

`ids(map)` is called per decision per tick over `people` (about 230 records), `items` (up to 2,000) and a site's fixtures, so it must not allocate and sort each time (my call):
- an id-keyed map is changed only through `put(state, map, id, rec)` and `drop(state, map, id)` in `core/ids.js`, which keep the map's ids in `cmpId` order in a runtime key on the map (`map.$ids`), inserting by binary search;
- `ids(map)` returns that array (frozen in debug), built once after a load and never re-sorted;
- in debug runs every 64th call, and every call in the determinism suite, asserts that it equals the map's own non-`$` keys sorted by `cmpId`, so a write that bypassed `put` is found at once.

### 2.4 Data modules

`src/data/*.js` export frozen literals: `export const ACTIVITIES = Object.freeze({ shower: { … } })`. They contain no functions, apart from tiny pure helpers that read the same table. They are imported, never fetched, so they load with the modules and work offline.
- **Every record has a stable id.** Saves refer to data by id. An authored template carries a version (`'melas@1'`; PLACES §9: a site pins `template@version`). When a change would move saved geometry, the version goes up and `upgradeState` decides what an older save keeps (§7.7).
- **Where a table lives.** A table read by more than one domain or by the UI goes in `src/data`. A table read only by its own domain may sit in that domain's folder, under the same rules: WEAPONS's `arms/calibres.js` and `models.js`, COMBAT's `combat/drills/*.js`, PLACES's `places/templates/`.
- **Owners.** Each table is owned by the section whose content it holds. TECH owns only their form.

### 2.5 The composition root: `src/sim/game.js`

`createSim({ loop, bus })` is the one place where the game is put together:
1. it registers each domain's top-level state keys and id-keyed maps (`registerDomain(owner, { keys, idMaps, init })`, in `core/state.js`): a key claimed twice throws at once, naming both claimants, and a key not in §6.1's table throws too;
2. it registers the fast layers, in the order of §3.1;
3. it registers the slow contributors, in the order of §3.4;
4. it merges the jobs registry (§4.3);
5. it installs the actions table, which routes each input action by its prefix to its owner (`people`, `hand`, `instinct`, `ready`, `shoot`, `digit:n`, `inv:…`, `aid:…`, `skip:stop`, `skip:chunk`, …).

The test `game-domains` (§13.6) checks the registry three ways: the registered keys are exactly §6.1's table; each domain's `init`, run alone on an empty state, creates only its own keys, so the domains' keys are disjoint; and every save made in the determinism suite has no top-level key outside the registry. Two agents building in parallel (ROADMAP §2.7) can therefore never both write one key unnoticed.

`newGame({ seed, mode, scenario, startMs, worldId })` builds a fresh state through the scenario. `continueWorld(state, careerOpts)` starts the next recruit in an existing world (CAREER §21). `createSim` holds no state of its own: everything it needs is in `state` or is a pure function of it. So the same file runs:
- in the page;
- in node for the tests and the bots (`tests/game.mjs`, §13.2);
- in `tools/replay.mjs`.

### 2.6 The browser edge and the UI's way into the sim

- **The UI never changes the state.** Every choice in a card, a menu or a splash becomes an **action** (a string, or a small plain object `{ act, args }`). The UI queues it through `input.queue(action)`, and it goes into the next tick's snapshot (`input.act`). The recorder keeps it like a key press (§8.3). This is tradecraft's rule (`ui.js`: "player choices go back through callbacks as action strings consumed by the next tick"), made complete.
- **The sim never reads the UI.** It reports facts on the bus. `src/ui/presenter.js` is LONGHAUL's single place that decides how each fact is shown: a log line, a toast, a balloon, a card, a sound (`js/ui/presenter.js`, 328 lines, its pattern).
- **What the UI may read**: the state (read only) and the exported helpers of the sims (one quantity, one helper: the watch calls `calendar.js`, the sheet calls `body/mods.js`, the step panel calls `arms/shooting.js options()`). UI code never computes a quantity of the sim on its own.

### 2.7 Bus facts

Facts are kebab-case names with plain-data payloads (the bus's header convention). `src/core/facts.js` lists every name with its owner and a one-line description of its payload. The syntax test fails on an `emit('<literal>')` whose name is not registered, and it lists registered names that are never emitted. The core facts:

| Fact | Payload | Owner |
|---|---|---|
| `hold` | `{ held, holds }` | TECH (built) |
| `skip-start` | `{ id, activity, kind, fromMs, toMs, where, posture, mask }` | TIME |
| `skip-frame` | `{ id, atMs, ticker: [new lines], frame: sample \| null }`, once per frame of a skip | TIME |
| `skip-interrupt` | `{ id, atMs, by, prio, line, reflex }` | TIME |
| `skip-end` | `{ id, activity, fromMs, toMs, planned, interrupted, by, outcome, papers }` | TIME |
| `autosave` | `{ why: 'skip' \| 'day' \| 'area' \| 'live' \| 'combat' \| 'death' \| 'edge' \| … }` | TIME and CAREER (ask), TECH (writes) |
| `log` | `{ entry }`, a record appended to `state.log` | TECH |
| `roll` | `{ roll }` (SKILLS §15.2's record) | SKILLS |
| `say` | `{ who, text, kind: 'speech' \| 'radio' \| 'bark' \| 'pa', durMs }` | PEOPLE |
| `area-enter`, `area-leave` | `{ site, area, from, portal }` | PLACES |
| `chunk-in`, `chunk-out` | `{ site, area, i, j }` | PLACES |
| `sound` | `{ kind, x, y, z, area, db, src }` | VIEWS (audio), PEOPLE (hearing) |
| `fx` | `{ kind, x, y, z, atMs, dir, size }` (a muzzle flash, an impact, sparks, steam) | WEAPONS, COMBAT, PLACES |
| `papers` | `{ papers: [ … ] }` | TIME, CAREER |
| `body-stage`, `body-event`, `body-interrupt`, `body-dead` | BODY §2.4 | BODY |
| `broke` | `{ where, message }`, a lost tick or a failed listener | TECH |

Every other fact is registered by its owning section in the same table, in the same change that first emits it.

---

## 3. The tick

### 3.1 One tick, in order

`createSim` registers these fast layers on the loop (`loop.register('fast', fn, { name, whileHeld })`) in this order. The budget column gives the mean per tick in the busiest area: the mess hall at noon, with 160 live agents (48 persistent people at L0 and L1, 12 puppets and 100 crowd: §16.7). The measuring machine is the Mac.

| # | Name | Does | Module (owner) | Runs while held | Budget |
|---|---|---|---|---|---|
| 0 | `due` | dispatch every event with `atMs ≤ clock.ms` (§4) | `core/queue.js`, `sim/jobs.js` (TECH, TIME) | no | 0.02 ms |
| 1 | `input` | apply the snapshot: actions routed to their owners, held keys to the player's intent | `sim/game.js` (all) | **yes** | 0.03 ms |
| 2 | `player` | the player moves: busy plan, walking, bounding, zero-g push-offs; speeds from BODY, collision from PLACES | `people/walk.js`, `body/motion.js`, `places/collide.js` | no | 0.03 ms |
| 3 | `actors` | every live actor moves: steering, path following, kinematic agents | `people/steer.js`, `people/walk.js` (PEOPLE) | no | 0.25 ms |
| 4 | `bodyFast` | BODY's fast cadence for the player and every L0 and L1 person: gait and traction, stamina, G-LOC reserve, suit pressure, breath-hold, falls | `body/*` (BODY) | no | 0.10 ms |
| 5 | `rehash` | the actor grid, rebuilt from `actors.list` in its saved order | `places/grid.js` (PLACES) | no | 0.03 ms |
| 6 | `look` | the player's eyes every tick. NPC sightings for the bucket `phase mod 20` (staggered), and hearing of the last tick's sounds | `people/perception.js`, `hearing.js` (PEOPLE) | no | 0.15 ms |
| 7 | `think` | NPC decisions for the same bucket, plus actors woken by an event or a sighting | `people/behaviour.js` (PEOPLE) | no | 0.10 ms |
| 8 | `rules` | in this order, as COMBAT §23 asks: (a) timed actions advance (handling steps, CQC exchanges, fighters' orders in progress); (b) shots and blasts resolve (WEAPONS's `flight()`, penetration, fragments), and up to `BRASS_LIVE` 64 moving cases fly; (c) suppression decays (COMBAT); (d) inertial bodies (120 Hz substeps, BODY); (e) fast environment: flows with τ under 5 s, door and hatch motion (PLACES §3.1); (f) noise emitted | `arms/*`, `combat/*`, `body/motion.js`, `places/air.js` | no | 0.40 ms |
| 9 | `paths` | serve queued path requests within `PATH_SOLVES_TICK` 6 and `PATH_NODES_TICK` 8,000 node expansions; the player's own first, then persistent people, then the crowd | `places/nav.js` (PLACES) | no | 0.60 ms |
| 10 | `second` | the per-second work of bucket `phase mod 20` (§3.3); on whole seconds, the global per-second work, including PLACES's live-area zones at 1 Hz | many | no | 0.10 ms, amortised |
| 11 | `offers` | `$offer` (what R would do), the instinct's candidates, the F reach | `places/affordance.js`, `skills/instinct.js` | **yes** | 0.02 ms |

Then the loop moves the clock (`ms += 50`, `tick += 1`). Then come the periodic layers whose boundary was crossed: `slow` at each whole game minute (§3.4). After the frame's ticks, `main.js` runs the autosave check (§7.4).

**Next tick, not this one.** Steps 6 to 8 write intents (`actor.intent`, `actor.task`, a path request). Steps 2, 3 and 9 read them on the next tick. A shot fired in step 8 is heard in step 6 of the next tick. This is both source projects' rule, and it is why a tick's result does not depend on the order of actors within a step. COMBAT's requested order (perception, then fighters' decisions, then timed actions and movement, then shots and blasts, then suppression decay) holds with movement at the head of the next tick. A move decided in step 7 is walked in step 3 of the following tick, before that tick's shots resolve.

**Holds** (stop motion, talk, a reflex card) are the loop's (built). While `state.clock.holds` is non-empty, only `input` and `offers` run, and the clock stands. A hold set mid-tick freezes that tick at once, as the built loop does: the layers after the one that set it run only if they run while held. So a hold set by step 8 skips steps 9 and 10, still runs step 11, and the clock does not move that tick: the step panel (`offers`) is current on the frozen frame. `core-loop` tests this case (§13.6).

**The sum** is 1.83 ms mean in the busiest area. The minute boundary adds the slow step (§3.4) to one tick in 1,200. Quiet areas (the squad bay at night, a range lane) are expected near 0.3 ms.

### 3.2 Staggering and work units

- **Bucketed per-entity work.** An actor's per-second work runs on the tick where `phase mod 20 = hash(id) mod 20`, and `phase = floor(clock.ms / TICK_MS)`. So a crowd's second costs a twentieth of it each tick, and no tick carries all of it (tradecraft did this by hand for followers and onlookers; here it is a rule). Work at other periods uses the same form: `hash(id) mod (periodMs / TICK_MS)`.
- **Work units, not milliseconds.** Anything in the sim that limits how much work a tick does counts units of work: path node expansions, solves, chunk cells generated, people placed. It never counts real time. That keeps a tick's result a function of the state and the input alone (§8.1). Wall-clock budgets exist only outside the sim: in the render, the paint worker, and the slicing of skips across frames.
- **Spatial queries** return results sorted by distance, ties broken by id (`byDistanceThenId`). The actor grid is rebuilt every tick from the saved actor list, as tradecraft's `rehash()` was. That costs about 0.03 ms for 160 actors and has no history to diverge.

### 3.3 The per-second layer

`second` (step 10) does two things each tick:
- **the bucket's people**: BODY's second cadence for L0 and L1 people whose bucket is due (bleeding, pain, hypoxia dose, heat sub-steps, drugs), and PEOPLE's per-second checks (noticing, the onlooker ring, walk-in and walk-out decisions for scheduled people);
- **on whole seconds** (`clock.ms mod 1000 = 0`): the player's second cadence (BODY), the live area's zones (PLACES §3.1: gas exchange, life support, temperature, fire cells, alarms, lighting state, at 1 Hz), the crowd topped up out of view (`people/crowd.js populate`), the instinct's `settle()` (SKILLS), and the HUD's offers.

The layer is **live only**. It does not run in an outcome skip, because there TIME §5.4 puts bleeding, the slow body and every zone of the site in `slowStep`, a minute at a time with exactly composing steps (PLACES §3.1: "lived seconds and skipped minutes agree"). In a fast-forward skip it runs normally, since a fast-forward is lived ticks.

### 3.4 The slow layer: `slowStep(state, bus, fromMs, toMs, ctx)`

This is one function. Live play calls it at every whole game minute, with `[minuteStart, minuteEnd]`. The outcome engine calls it for each of its steps (§5.3), with `ctx.skipping` true. It runs the registered **contributors** in TIME §5.4's order:

| # | Contributor | What | Owner |
|---|---|---|---|
| 1 | `places.envStep` | the current site's compartments: gases, temperatures, breaches and vents, radiation and gravity fields. In live play, the zones outside the live area; in a skip, every zone of the site (the live area's run at 1 Hz in live play, §3.3) | PLACES |
| 2 | `body.slowStep` | the player and every L0 and L1 person: air uptake, core heat, dose, G exposure from `voyage.feltAt`, consciousness, the minute cadence; in a skip, bleeding a minute at a time | BODY |
| 3 | `people.tier2Step` | L2 people at the site: schedule transitions and need crossings, in closed form | PEOPLE |
| 4 | `ships.step` | ship systems and life support, the voyage's leg transitions. When driven hulls exist, COMBAT §13's ship layer runs **one minute ahead**: at the boundary of minute m it resolves minute m + 1 (LONGHAUL's `minuteTick` order for those hulls only) and posts the interior's events at their seconds into the queue, where step 0 of each tick, or the outcome engine, dispatches them | PLACES, TIME, COMBAT |
| 5 | `time.crossings` | re-solve the player's need crossings if steps 1 to 4 changed a rate | BODY, TIME |

Each contributor is registered as:

```
registerSlow({
  name: 'body',
  step(state, bus, fromMs, toMs, ctx),   // must give the same result for one call over [a, c]
                                         // as for two calls over [a, b] and [b, c] while steady
  steady(state) → boolean,               // nothing in my care changes except by closed form
  nextChangeMs(state, fromMs) → ms | Infinity   // the next time I need a step of my own
})
```

Work that is closed form may be spread over the minute's 1,200 ticks by id hash (TIME §11.2: tier-2 schedule lookups), as long as the end-of-minute result is identical. Work that integrates (gases, heat, the player) runs at the boundary.

A contributor that is `steady` does no work on a step: its anchors and rates stand, and its closed form is evaluated when something reads it or when its rates change (TIME §5.5). That is what makes a quiet minute step cost a few µs, and it is why the size of the steps cannot move its floats. `steady` and `nextChangeMs` also choose the grid of `day` and `world` skips (§5.3).

### 3.5 Hourly and daily work

The loop's built-in `world` hourly layer is not used for game work (my call). TIME §11.3's hourly and daily slots are **recurring job events** in the queue (§4.3): `hour@:17Z` hot-zone incidents, `day@05:00Z` politics, `local@00:00` the sol's schedules, and so on. A job runs in step 0 of the tick whose clock reaches it, or in the outcome engine's step that reaches it, and then posts its next occurrence. One mechanism serves both modes, and the skip engine (§5.3) ends a step at each of these jobs as at any event.

### 3.6 Loop modes

The loop runs in one of four modes, decided each frame:

| Mode | When | What a frame does |
|---|---|---|
| `paused` | any pause reason (Space, an overlay, a hidden tab) | no ticks. The accumulator waits. The render runs |
| `live` | default | the accumulator's ticks, at most 5 a frame (built) |
| `ff` | `state.skip.kind === 'ff'` | up to `FF_TICKS_FRAME` 40 ticks and `FF_FRAME_MS` 8 ms of real time a frame, with the skip's fixed input. The accumulator is reset |
| `outcome` | `state.skip.kind` is `'outcome'`, `'out'`, `'day'` or `'world'` | `advanceSkip()`: the whole grid steps that end by the splash's target (`world`: no target), at most `SKIP_FRAME_MS` 4 ms of real time a frame (8 ms for the prologue behind its papers, §5.8) |

Holds work inside `live` and `ff` as they do today. When a skip ends, the loop returns to `live` with an empty accumulator: the splash's real seconds are never owed to the sim.

### 3.7 Errors in a tick

These are built. A tick that throws is lost: its clock does not move, `broke` is emitted, a toast says so once, and the next tick runs. The error's first lines go into `meta.errors` (the last 20, saved, so an exported save carries them). A skip whose contributor throws stops with `stopped: 'error'`, and its outcomes apply to the time lived. Render and UI errors are caught per frame and per listener, and they never touch the state.

---

## 4. The event queue (`src/core/queue.js`)

### 4.1 Shape

`state.events` is an array kept as a **binary min-heap**, ordered by `(atMs, prio, seq)`. It holds the queue and nothing else (correction 15). Each entry is TIME §5.6's record, saved without its null and default fields (§6.6):

```json
{ "id": "e812", "seq": 812, "atMs": 1234567000, "prio": 3, "kind": "job", "src": "world:zones", "payload": { "job": "zoneIncidents" } }
```

- A missing `who`, `area`, `line`, `tone` or `reflex` reads as null. This record is 117 B; with its five nulls written out it was 178 B (measured, minified JSON).
- `seq` comes from `state.meta.next.e`, so ids and tie-breaks are deterministic.
- `atMs` is a whole second. `post()` rounds it down (TIME §5.6).
- The heap array is saved as it is (correction 9). Its order is a function of the operations performed, so a loaded game continues identically. The debug overlay shows it sorted.
- Cancelling is lazy. `cancel(state, src)` marks matching entries `dead: true`, using a runtime `$events.bySrc` index (src → seqs) rebuilt on load in array order. `popDue` skips dead entries. When dead entries pass a quarter of the heap, the heap is compacted: it is rebuilt by heapify over the live entries in array order, which is deterministic.

### 4.2 API

```
post(state, ev)                      → id     // assigns seq and id; atMs floored to the second
cancel(state, src, pred?)            → n      // by source key (TIME §5.6: "sources write their own events and may cancel them")
nextAt(state)                        → ms | Infinity
popDue(state, tMs)                   → [ev…]  // every live event with atMs ≤ tMs, in (atMs, prio, seq) order
hazard(state, { src, key, ratePerMin, gen }) → id   // pre-drawn: atMs = now + floorSec(−ln(u) / rate × MIN_MS)
                                                    // u from stream(src, key, gen); redraw on a rate change with gen + 1
size(state), live(state)             // for tests and the save meter
```

The dispatcher (`sim/jobs.js dispatch(state, bus, ev)`) calls the handler registered for `ev.kind` (and `ev.payload.job` for jobs). The handler applies the event's world effects whatever any skip mask says. The skip engine then decides whether the event stops the skip (TIME §7).

### 4.3 Recurring jobs

A job is an event that posts its successor. `kind: 'job'`, `payload: { job: 'politicsDay', every: 'day@05:00Z' }`. The `every` grammar:
- `hour@:MMZ`: every UTC hour at minute MM;
- `day@HH:MMZ`: every UTC day;
- `local@HH:MM`: every sol at that Mars local time, at the current site's longitude (TIME's `msAtMarsTime`, built);
- `week@<weekday>/HH:MM`: weekly, as SETTING's week defines it;
- `every@<ms>`: an absolute period from the career's start (TIME §11.3: "Absolute periods").

`sim/jobs.js` merges the domains' tables (`world/jobs.js`, `people/schedule.js`, `career/*`, `places/env.js`, `combat/director.js`). Jobs are referenced **by name**, so the save holds plain data. When a job name disappears in a later version, `upgradeState` drops its events. A game posts all its recurring jobs at `newGame` and `continueWorld`. A test asserts that each registered job has exactly one live occurrence at all times.

### 4.4 Caps and tests

- At most 4,000 live events (TIME §13). The standby-week bot prints the queue's maximum size each sol and fails above 4,000. My estimate for 0.1 is 300 to 600: about 15 recurring jobs, the PoD's blocks, people's schedule events and pre-drawn hazards.
- `core-queue` test: 100,000 random posts, cancels and pops against a sorted reference list. It prints operations per millisecond and asserts identical pop sequences, and that a save and load at every 10,000th operation changes nothing.

---

## 5. `skip()`: the implementation

TIME §5 owns the contract: the activities, the masks, the interrupts, what happens at the end. This section is how the engine does it.

### 5.1 From the 0.0.x skip to the sliced engines

The built `loop.skip(ms, { what, outcomes, interrupt })` runs a whole skip synchronously, stepping the periodic layers a minute at a time. It stays as **`skipNow()`** for tests, debug keys and node, and its five `core-loop` tests stay as tests of `skipNow`. In 0.1 the engine moves to `src/sim/time/skip.js` and changes in three ways:
1. **It is resumable.** `state.skip` holds its progress, so it can be sliced across frames and saved in the middle.
2. **It calls `slowStep()`** (§3.4) rather than stepping every periodic layer, on a step grid set by the skip's kind (§5.3).
3. **Interrupts come from the event queue** (outcome) or from the fast layers (`ff`), as TIME §5.2 says.

### 5.2 Starting: `beginSkip(state, bus, req)`

The sim calls it during a tick: an activity began at its fixture, a chapter day was chosen, the player fell unconscious. TIME's checks run first (§5.3 of TIME: not in stop motion, no known threat, at the spot, the activity's preconditions, the obligation check). Then:

```
kind = req.kind ?? (req.planMs < FF_MAX_MS ? 'ff' : 'outcome')       // FF_MAX_MS = 120,000
state.skip = { id: 'k' + next.k++, kind, activity, who, where, posture, mask, resolver,
               fromMs: now, toMs: now + planMs, atMs: now, chunkMs, chunks: 0,
               ticker: [], frame: [], stop: null, result: {}, cmds: [] }
emit('skip-start', …)
```

The current tick ends normally. The loop sees `state.skip` on the next frame and changes mode.

### 5.3 Advancing: `advanceSkip(state, bus, targetMs, budget)`

**Where a step ends is a function of the skip's kind and the state, never of the target or the budget** (my call). The target, which the splash sets each frame from its curve (TIME §6.2), only decides how many whole steps a frame may run. Exponential processes compose only "to float rounding" (TIME §5.5), so a step cut wherever a frame's target fell would give the page and a node replay different bits: the grid prevents it.

```
gridNext(s, state, t0):                               // the end of the next step, before events and toMs
  outcome, out:  floorToMinute(t0) + MIN_MS           // whole game minutes on the live minute grid: the splash's clock moves by the minute
  day:           allSteady(state) ? floorToHour(t0) + HOUR_MS : floorToMinute(t0) + MIN_MS
  world:         allSteady(state) ? minNextChange(state, t0) : floorToMinute(t0) + MIN_MS   // event to event: no clock is shown

advanceSkip(state, bus, targetMs, budget):            // outcome, out, day and world kinds
  s = state.skip; newLines = []
  loop:
    if s.stop or clock.ms ≥ s.toMs or budget.over(): break
    if s.cmds has 'stop' with atMs ≤ clock.ms: s.stop = { atMs: clock.ms, by: 'player' }; break
    t0 = clock.ms
    t1 = min(s.toMs, nextAt(state), gridNext(s, state, t0))
    t1 = min(s.toMs, max(t1, nextWholeSecond(t0)))   // never a zero step; events sit on whole seconds
    if t1 > targetMs: break                           // the target gates whole steps; it never cuts one
    slowStep(state, bus, t0, t1, { skipping: true, skip: s })
    activityStep(state, s, t0, t1)                    // TIME: the activity's own accruals
    clock.ms = t1
    for ev in popDue(state, t1):
      dispatch(state, bus, ev)
      if stops(s.mask, ev): s.stop = { atMs: t1, by: ev.id }; emit('skip-interrupt', …); break
      if ev.line: s.ticker.push(line); newLines.push(line)
    if s.cmds has 'chunk' and t1 ≥ s.toMs: s.toMs += s.chunkMs; s.chunks++
    sample = frameSample(state, s, t1); if changed: s.frame.push(sample)
  emit('skip-frame', { id: s.id, atMs: clock.ms, ticker: newLines, frame: last sample if new })
  if clock.ms ≥ s.toMs or s.stop: finishSkip(state, bus)
```

- **The kinds' grids.** Splashed activity skips (`outcome`) and unconsciousness (`out`) step on whole game minutes, ending early at an event's second. Chapter days (`day`) step on whole hours, falling to minutes while any contributor is not steady (someone bleeds, a compartment is off its set point, a voyage leg is ramping), so a step never spans a process without a closed form. `world` skips (the prologue, §5.8; the successor's gap, CAREER §21; node's moment fixtures and career runs) show no clock and take no target, so they may go event to event while everything is steady.
- **The target gates, it never cuts.** A step runs only if it ends at or before the target. The day splash's target therefore reaches the sim by whole hours and an activity splash's by whole minutes, whether or not the UI floors it. "To the end" sets the target to `toMs`. With no splash (node, the tests, `?nostore` benches) the target is `toMs`, and `skipNow` (§5.6) walks exactly the grid the page walks.
- `budget.over()` is the loop's: real time used this frame against `SKIP_FRAME_MS` 4. It is read between steps, so it decides only **where the slicing falls**, never what a step computes (test "slice independence", §8.2).
- `allSteady` is the AND of the contributors' `steady()`. `minNextChange` is the minimum of their `nextChangeMs()`. Both are functions of the state, so the grid is the same in the page, in node and in a replay.
- **The cost.** An 8-hour sleep is now 480 minute steps plus its events (about 40), not "about 40 steps". In a quiet barracks a steady minute step does no contributor work (§3.4), so it costs a few µs: about 2 to 3 ms for the night, plus eight hourly jobs at up to 0.5 ms, about 7 ms in all (my estimate), inside TIME §5.10's 25 ms. A night beside a process that is not steady pays up to TIME's 0.05 ms ceiling on every step, 24 ms for the steps alone, and is budgeted separately in §5.9.
- **`ff` kind**: the loop runs real ticks with the skip's input (`NO_INPUT` plus the activity's held posture). A fast layer may set `s.stop` (perception, contact, COMBAT), and so may step 0 when a due event's priority breaks the mask. After each tick, the loop checks `clock.ms ≥ s.toMs || s.stop` and calls `finishSkip`.

### 5.4 Finishing: `finishSkip(state, bus)`

TIME §5.8's sequence is implemented as written:
1. the activity closes, with the fraction lived;
2. BODY and PEOPLE settle in closed form;
3. persistent people are placed by `whereAt`, and the crowd is recycled when the gap is 120 s or more;
4. papers are drained;
5. `skip-end` is emitted;
6. if the skip stopped early, the player is landed, with a reflex where one is plausible;
7. `state.skip = null`;
8. an autosave is asked for with `{ why: 'skip' }`.

Placement and recycling happen while the splash still hides the stage, so the zoom-out reveals a world that is already consistent. VIEWS draws the splash; the loop only feeds it.

### 5.5 The splash's target and the player's commands

- **The target.** Each frame the splash computes how far its clock has got (TIME §6.2's curve) and gives that to the loop (`loop.skipTarget(ms)`). With no splash (node, the tests, `?nostore` benches), the target is `toMs`. "To the end" is the UI setting the target to `toMs`: it is not a sim input, because the result does not depend on the target (§5.3: the target only gates whole grid steps). The test `game-targets` (§8.2) proves it.
- **Commands that change the outcome** are sim actions: `skip:stop` ("stop here") and `skip:chunk` ("one more chunk", for reading and study). They are queued like any action and written into `s.cmds` with the `atMs` the engine had reached when it received them. That `atMs` is always the end of a grid step (the clock at the end of the frame before), so the command applies exactly there, before the next step, in the page and in a replay alike. The recorder keeps `{ skipId, atMs, cmd }`. A replay advances the skip with each recorded `atMs` as its target, which it reaches exactly because the grid is the same, then feeds the command (§8.3).

### 5.6 `skipNow(state, bus, req)`

This is `beginSkip`, then `advanceSkip` with `targetMs = Infinity` and no budget, then the finish. It serves tests, `__olympus.skip(ms)` (an `idle` activity with mask `D`: TIME §19), the debug keys `[` and `]`, and the bots in node. It keeps the kind the page would use, so it steps the page's grid and reaches the page's bits; only callers that ask for `kind: 'world'` (fixtures, career runs) go event to event.

### 5.7 Saving inside a skip

`state.skip` is saved, so a save made mid-splash resumes it from `atMs` (TIME §13: "with a 0.4 s zoom-in"). Autosaves never fall inside `advanceSkip`. They run at the end of the frame, after the frame's last step, so a saved skip always sits on a step boundary.

### 5.8 The prologue: the world rolled to the start

SETTING §2.3 opens every new world by rolling LONGHAUL's start state from the epoch (2351-03-22 08:00 UTC) to the start (2351-12-19 02:20 UTC). That is 271.76 days, `START_MS` 23,480,400,000 (SETTING §3.7 owns the instant), rolled as outcomes.

**It lands at 0.2, with the whole world layer** (correction 23; ROADMAP §5.7's fallback, made the plan, my call). LONGHAUL's hourly `zoneIncidents` takes its pirate, proxy and blockade losses from traffic ships in transit through each zone ("≤ 500 sampled from a hash query, refreshed exactly before counting", `longhaul-combat.md` §11.4), and those losses feed politics. Without traffic, a 0.1 prologue would roll a world that is not LONGHAUL's tuned one. So:
- **At 0.1** the news archive is SETTING §7.7's authored timeline, a data module (`src/data/setting/timeline.js`) read by date, and `state.world` stays empty (§6.1, §6.6). Every reader of the world (the news board, CAREER §5.7's crisis check) asks `world/news.js`, which at 0.1 answers from the timeline.
- **At 0.2** traffic, politics, conflict, forces and intel are ported together (§12.4), and the same calls answer from the live layer.
- **An 0.1 save carries over** through `upgradeState`: the world is rolled from the world's seed, from the epoch to the save's own `clock.ms`, with the authored timeline injected as fixed incidents (SETTING's third constraint). The news the player read at 0.1 therefore stays true at 0.2, and the edge save plays on (ROADMAP §2.6). A new 0.2 world rolls the same function to `START_MS`.

`world/prologue.js` runs the roll as a **`world` skip** (§5.3: event to event, no target):
- **What runs**: the world's recurring jobs (`world/jobs.js`: politics daily, zones and forces hourly, the news relayed and archived) at their TIME slots, and each UTC day's traffic regenerated from its seed (§6.6).
- **What does not run**: anything about people, places, the player or the director. They do not exist yet.
- **SETTING's three constraints** are applied by the jobs in prologue mode: the MCR to UN relation held above −70, the two Europa zones pinned from 2351-06-01, and the authored Europa timeline injected as fixed incidents on their dates.
- **Traffic through a zone.** Regenerating about 3,000 rails into a hash for each of 6,500 hours would cost more than the whole roll. Instead, once a UTC day, each zone finds the day's transits whose chord passes within its radius (most start or end at the zone's body) and solves each one's entry and exit times on its closed form. The hourly count is then a lookup over those intervals, and only the ships counted are evaluated exactly, as LONGHAUL refreshes its sample before counting (my call).
- **The roll is seeded by the world** (`stream('prologue', worldSeed)`), so it is deterministic. A golden hash pins its result for seed 48213.
- **Where it runs**: on the main thread, sliced at 8 ms a frame behind the enlistment papers. Creating a recruit takes the player minutes, and the roll needs seconds. If the player finishes first, "Report to Melas" waits with one line ("The Corps is finishing your orders.") and a progress fraction.
- **Budget**: at or under 3 s of compute on the Mac. My estimate: about 6,500 hourly zone steps at 0.15 ms and about 820 daily jobs at under 1 ms each, about 1.5 s, plus the zones' daily traffic intervals (at most 8 zones × a few dozen transits × about 10 µs a solve, under 1 s over the 272 days). The test `world-prologue` prints the compute ms, the zones born, the incidents, the hulls lost and the final relations, and asserts the constraints.
- **Against LONGHAUL.** The test `world-year` (0.2, heavy) runs a year from the epoch on five seeds with regenerated traffic and prints, beside LONGHAUL's printed year (`longhaul-combat.md` §11.4: zones born pirates 83, insurgency 33, standoff 10, proxy 14, front 2, blockade 1, skirmish 1; 301 hulls lost in the fights that ended; 29 ships taken by pirates in 120 days), the zones born by kind, the ships taken by kind and the hulls lost. Each seed's count must fall within three standard deviations of a Poisson count whose mean is LONGHAUL's printed value (pirate zones 83 ± 27, for instance), the room for chance a single printed year allows.

### 5.9 Budgets (TIME §5.10, as the engine must meet them)

| Work | Budget | How it is met |
|---|---|---|
| one quiet outcome step | ≤ 0.05 ms | contributors in closed form; a steady contributor does no work (§3.4) |
| an 8-hour sleep in a quiet barracks | ≤ 25 ms in all, sliced at 4 ms a frame | 480 minute steps at a few µs plus about 40 event steps: about 7 ms (§5.3) |
| an 8-hour sleep with a process that is not steady (a squadmate bleeding, a compartment off its set point) | ≤ 30 ms (my call) | 480 minute steps at ≤ 0.05 ms, plus the events |
| a chapter day of 24 h | ≤ 30 ms | 24 hour steps; 24 hourly jobs at ≤ 0.5 ms, three daily jobs at ≤ 5 ms, each at its own slot |
| a 12-day voyage carried on | ≤ 0.5 s, spread over the day splashes | 288 hour steps with 288 hourly jobs and 36 daily ones, about 0.33 s (my estimate from LONGHAUL's measured costs, §11.1) |
| fast-forward | ≤ 8 ms of real time a frame | 40 ticks at about 0.2 ms in an ordinary area |

---

## 6. State

### 6.1 Top-level keys and their owners

The top level is reserved. A new key needs a change to this table. The owner defines the shape inside the key, and other sections reach into it only through the owner's exported functions.

| Key | Owner | What | Notes |
|---|---|---|---|
| `meta` | TECH | `{ game: 'olympus', schema, version, seed, worldId, mode, scenario, createdMs, next: { p, a, i, e, k, n, h, … }, errors: [≤20], debugUsed, imported, recovered }` | `mode` is the career's (CAREER §23); `debugUsed`, `imported` and `recovered` are honesty marks (§7.3, §15.5, CAREER §23); `next` has one counter per prefix of §2.3.1 |
| `clock` | TIME (built by TECH) | `{ ms, tick, holds, seq }` | correction 1 |
| `rng` | TECH | `{ main: [4 words], <stream>: [4 words], … }` | built; streams named by their owner |
| `events` | TIME (implemented by TECH) | the queue's heap array, and nothing else | §4; correction 15 |
| `skip` | TIME | the running skip, or null | §5 |
| `time` | TIME | `{ chapter, voyage, pod, alarms, interrupts: { perSol, perSkip }, liveSinceSaveMs }` | the clock is not here; `chapter` and `voyage` are here, not at the top level (correction 18) |
| `player` | PEOPLE | `{ id, actor, waypoint, presets, keeps }` | a pointer and the controller's own bits; `id` is the player's ordinary person id (§2.3.1), and the person is `people[player.id]` |
| `people` | PEOPLE | `{ <personId>: person }`, an id-keyed map and nothing else: the sheets of tiers 1 to 3, with `body` (BODY), `skills` (SKILLS), `kit` (WEAPONS, §6.7), gauges | PEOPLE §2.3; a person's memories are a runtime index over `happenings` |
| `units` | PEOPLE | `{ <unit path>: unit }`: the unit tree and its billets | PEOPLE §2.6, kept at the top level so `people` stays a map of persons only (correction 18) |
| `happenings` | PEOPLE | the ring of notable things and who knows them: at most 1,200 records, ids `n<n>` | PEOPLE §2.5's "event log", renamed (correction 15); kept for the memorial past the ring when of weight 5 |
| `actors` | PEOPLE | `{ list: [actor…] }`: the bodies on the live area, persistent and crowd, in a stable order | rebuilt into the grid every tick |
| `mind` | PEOPLE | the player's knowledge: `seen` (ghosts), `felt`, `heard`, `known` (SKILLS §15.3), `map` (PLACES: what is known of places) | "we only know what we know" |
| `talk` | PEOPLE | an open conversation, or null | a save in a talk resumes in it (TIME §13) |
| `names` | PEOPLE (pools from SETTING) | the registry of every full name in the world, by kind (people, ships, operations) | PEOPLE §3.5, SETTING §12 |
| `fights` | COMBAT | one record per fight in the live area (COMBAT §2.1) | empty in peace |
| `stop` | WEAPONS (with COMBAT for CQC) | the stop-motion context: the mode, the step panel's state, the bracketed target, a timed step in progress | null outside stop motion; a save in stop motion resumes in it (TIME §13) |
| `items` | WEAPONS | `{ <itemId>: item }`: every item that has a record (guns, magazines, suits, pouches, IFAK parts, letters, tools), wherever it is | §6.7; a gun's state is its record here, so a gun dropped is the same gun picked up |
| `armoury` | WEAPONS | the armoury's accountability records by gun id, and the ammunition issues (WEAPONS §10.7) | the guns themselves are in `items`, held by a rack's fixture when racked |
| `places` | PLACES | `{ live: { site, area }, sites: { … } }` | PLACES §1.10; correction 2; a site's lying list holds item ids and positions, the records are in `items` |
| `world` | TECH (porting LONGHAUL), with content from SETTING (powers, the prologue's constraints) and COMBAT (zones, forces) | `{ politics, zones, forces, hulls, stations, intel, news, traffic: { gen }, driven }` | §6.6; civil traffic is regenerated, not saved; the three AP transports (SETTING §6) are saved hulls with a non-combat Navy role; at 0.1 it stays empty, because the archive is the authored timeline, a pure function of the date (§5.8) |
| `career` | CAREER | the current career (CAREER §3.1) | `career.edge = { atMs, next }` once the content edge is reached (ROADMAP §2.6) |
| `careers` | CAREER | past careers in this world, as summaries | the next recruit (CAREER §21) |
| `memorial` | CAREER | the world's dead (CAREER §20) | never capped |
| `log` | TECH (the record), SKILLS (roll text) | at most `LOG_MAX` 1,500 records, newest last | §6.5 |
| `flags` | TECH | one-shot facts and migrations done | built |

### 6.2 A new game's state (0.1, abridged)

```json
{
  "meta": { "game": "olympus", "schema": 1, "version": "0.1.0", "seed": 48213, "worldId": "w-48213",
            "mode": "standard", "scenario": "standby", "createdMs": 23480400000,
            "next": { "p": 233, "a": 2, "i": 412, "e": 41, "k": 1, "n": 1, "h": 1 }, "errors": [] },
  "clock": { "ms": 23480400000, "tick": 0, "holds": [], "seq": 0 },
  "rng": { "main": [1, 2, 3, 4], "people": [5, 6, 7, 8] },
  "events": [ { "id": "e1", "seq": 1, "atMs": 23506800000, "prio": 5, "kind": "job", "src": "people:pod", "payload": { "job": "podPublish", "every": "local@20:00" } } ],
  "skip": null,
  "time": { "chapter": null, "voyage": null, "pod": { }, "alarms": [], "interrupts": { "perSol": 0, "perSkip": 0 }, "liveSinceSaveMs": 0 },
  "player": { "id": "p233", "actor": "a1", "waypoint": null, "presets": {}, "keeps": {} },
  "people": { "p233": { "id": "p233", "name": "…", "body": { "v": 1, "tmpl": "m-adult" }, "skills": { },
                        "kit": { "tmpl": "newjoin-arrival", "worn": { "torso": "i401", "belt": "i402" }, "hands": [null, "i403"] } } },
  "units": { "2/4-E-2-1": { "parentId": "2/4-E-2", "billets": { "ft2-r": "p233" } } },
  "happenings": [],
  "actors": { "list": [ { "id": "a1", "who": "p233", "x": 51.25, "z": 1.5, "face": "down", "gait": "idle" } ] },
  "mind": { "seen": {}, "felt": [], "heard": [], "known": {}, "map": {} },
  "talk": null, "names": { "people": {}, "ships": {}, "ops": {} }, "fights": [], "stop": null,
  "items": { "i7": { "type": "gun", "model": "r7", "chamber": "empty", "mode": "safe" },
             "i403": { "type": "paper", "kind": "check-in-sheet" } },
  "armoury": { "guns": { "i7": { "assignedId": "p233", "log": [] } }, "ammoIssues": [] },
  "places": { "live": { "site": "melas", "area": "melas.echo.1" }, "sites": { "melas": { "seed": 418211, "template": "melas@1",
              "fixtures": { "f:armoury:rack-e2": { "holds": { "14": "i7" } } } } } },
  "world": { },
  "career": { "id": "c-48213-1", "world": "w-48213", "status": "arriving" },
  "careers": [], "memorial": [],
  "log": [], "flags": {}
}
```

Every top-level key is present. Inside a domain, fields at their defaults (null, false, zero where zero is the default, empty) are left out (§6.6), which is why `meta` carries no `debugUsed: false`.

### 6.3 Runtime keys and derived data

- **`$` keys** at any depth are dropped from saves (built). By convention a domain's derived data sits in one root key: `$places` (nav grids, the site graph, the area cache, chunk geometry), `$people` (path queue, steering scratch, `$known`), `$events` (the queue's index), `$items` (each item's holder, §6.7), `$world` (the spatial hash, the day's traffic lanes), `$body` (memoised crossings). An id-keyed map keeps its sorted ids in its own `$ids` (§2.3.2). The renderer and the UI **never** store anything in the state: their runtime lives in their own modules.
- **Derived data is a pure function of saved state** (or of the code alone, like WEAPONS's ballistic tables: one per load, environment class and barrel, at 5 m steps, built at boot as a memo of `arms/ballistics.js`, allowed by §2.3 as a memo of a pure function; budget at or under 150 ms, my estimate, measured by `arms-ballistics`). It may be computed early, in background slices or on the worker, but any sim read that finds it missing builds it at once, synchronously (rule 7, §8.1). A cache hit and a cache miss must give the same answer, which is why loading a game (cold caches) and carrying on (warm caches) continue identically.
- **No `$` key may hold the only copy of anything the game needs after a load.** The test "save, load, compare" runs every 250th tick of the determinism run (built, extended to the real sim).

### 6.4 Ids and counters

`meta.next` holds one counter per prefix of §2.3.1. `ids.js` provides `nextId(state, prefix)` → `prefix + n` (`p42`, `i9921`, `fg3`). Ids are never reused, so a dead marine's id stays on the memorial and in people's memories. A crowd extra has no id until promoted: it is `{ seed, plan }`, and it gets a `p` id the moment the player interacts with it (tradecraft `interact.js person()`). An NPC's issue kit has no item ids until it is materialised (§6.7).

### 6.5 The log

```json
{ "seq": 4182, "atMs": 1234567000, "kind": "roll", "tone": "note",
  "roll": { "skill": "weapons", "d20": 9, "value": 7, "mods": [["rested", 1], ["cold hands", -1]], "dc": 12, "margin": 2 },
  "who": "p233", "area": "melas.range" }
```

- **A roll record stores no `text`.** J renders "Weapon handling 14 against 12: passed" from the roll by SKILLS's `rollText(roll)`, whose wording is picked by hash, so it reads the same every time. Other records keep a short `text`, or a `{ line, args }` key into their owner's line table. Defaults are left out (`hidden: false`, `seen: true`). The record above is 196 B; with its text and defaults written out it was 268 B (measured, minified JSON).
- `LOG_MAX` is 1,500 records (my call; tradecraft kept 500; down from 2,000 to fit §6.6 once the records were measured): about 300 KB, and two to three busy sols of rolls.
- Older records are dropped from the front. What lasts beyond them is the career's record (CAREER) and people's memories (PEOPLE).
- Every roll is readable in J with its whole sum (the hub). The J log pages through the ring.

### 6.6 Size budgets

The first budgets (an event at 75 B, a log record at 160 B, a tier-2 person at 1.2 KB) summed to 1.77 MB against their own 1.5 MB total, and the sections' own samples are larger still. Measured on 2026-11-05 as minified JSON (a scratch script over the samples as the sections print them): TIME's event 178 B; the log record 268 B; BODY §2.5's body 1,427 B; PEOPLE §2.3's person 1,696 B with an empty body, so 3.1 KB with one; PEOPLE §2.5's happening 264 B plus about 37 B for every knower, so a negligent discharge the whole company has heard of is about 7 KB; WEAPONS §4.1's gun 707 B. Written that way, the standby week's save would be about 2.5 MB (my estimate, with the week's counts of the table below), and `toJSON` (about 5 µs a KB, §7.4) would pass its 10 ms.

**The rules that bring it back** (my calls; each owner applies them to its own records):
1. **No defaults on disk.** Null, false, empty and default fields are left out, and the owner's reader fills them (`withDefaults(kind, rec)`). The event falls to 117 B (§4.1), and PEOPLE's person, its body aside, to about 1.27 KB.
2. **A body is its deltas from a template.** `body = { v, tmpl, …what differs }`, the template (`m-adult`, `f-adult`, by build) holding the resting values. An off-map marine's body is about 440 B.
3. **The log stores rolls, not their text** (§6.5): 196 B a roll.
4. **Knowledge is kept by group.** A happening's `known` holds groups ("2/4-E-2-1 saw it, distortion 0"; "2/4-E heard it told, distortion 1") with per-person exceptions, so the company-wide one is about 0.3 KB, not 7 KB (PEOPLE §2.5 and §9 to adopt).
5. **Stubs expire.** A crowd member promoted by an F press, and any tier-3 stub, is deleted once no happening of weight 2 or more names it, so stubs do not keep forever (PEOPLE §2.2 to adopt).
6. **Kit is lazy** (§6.7): an NPC's issue kit is a template name until one of its items does something.
7. **Gun records drop what the rack makes plain**: a racked, cleared gun saves only what differs from its model's defaults, about 250 B.

| Domain | At the end of the standby week (my estimate) | Size each, after the rules | Budget |
|---|---|---|---|
| `people` | tier 1: 24 (with ties to tier 1 and the platoon); tier 2: 170 (ties to their squad and chain); tier 3: 30 at Melas; stubs: about 50 | 3.7 KB, 2.2 KB, 1.7 KB, 0.25 KB | ≤ 560 KB |
| `units` | Echo Company's tree and the battalion's billets | | ≤ 10 KB |
| `happenings` | about 500 of the ring's 1,200 | about 0.3 KB | ≤ 150 KB (the full ring is about 400 KB: the 0.2 budget) |
| `events` | about 600 (§4.4) of the cap of 4,000 | 117 B | ≤ 70 KB |
| `log` | 1,500 | 196 B | ≤ 300 KB |
| `items` and `armoury` | about 230 guns of the company and the base, a few hundred materialised items, the accountability records, the issue log capped (WEAPONS to set it: my proposal, the last 7 sols, older days kept as counts) | gun 250 B, magazine 99 B, record 85 B | ≤ 150 KB |
| `places` | PLACES §1.10's caps (500 marks a site; lying items as ids and positions, their records in `items`) | | ≤ 150 KB |
| `world` | empty at 0.1 (§5.8); forces, stations, zones, politics, news at 0.2, with **civil traffic not saved** (below) | | ≤ 10 KB at 0.1; ≤ 250 KB at 0.2 |
| everything else | `meta`, `clock`, `rng`, `skip`, `time`, `player`, `actors` (160 at about 0.1 KB), `mind`, `talk`, `names`, `fights`, `stop`, `career`, `careers`, `memorial`, `flags` | | ≤ 100 KB |
| **total** | | | **≤ 1.5 MB** target at 0.1 (2 MB at 0.2's edge, ROADMAP §15.2); a hard fail above 4 MB |

`save-size` (§13.6) prints each domain's KB and its record counts at the end of each sol of the recruit's week, warns on a domain over its budget and fails on the total, so the estimates above are replaced by measured numbers at the first run of the real sim.

**Incremental serialisation, before 0.3's 3 MB** (my call; built in 0.2, §18). At about 5 µs a KB (§7.4), a 3 MB save would take 15 ms to encode. So `toJSON` keeps each top-level key's canonical JSON string with a dirty flag, set by the domain's own mutators (`touch(state, key)`), and writes only the dirty keys again. The whole save is assembled from the strings in sorted key order, so it is byte-identical to a fresh `toJSON`, and its digest is the same. In debug and in the determinism suite, every save is also encoded fresh and compared, so a mutation that forgot its `touch` fails at once.

**Civil traffic is regenerated, not saved** (my call). LONGHAUL's default world saves 3,130 ships at 698 B each: 2.13 MB of a 2.22 MB save (measured). OLYMPUS's marine never trades or flies, and sees traffic only on screens. So `world/traffic.js` generates each UTC day's departures per lane from `stream('traffic', worldSeed, dayIndex, lane)`, each one a closed-form transit rail (LONGHAUL `world.js transitStateAt`). A hull is promoted into `world.hulls` the moment anything happens to it (hailed, boarded, fought, lost, met), as tradecraft promotes a passer-by. Military forces (UN 56, MCR 12 and OPA 8 hulls in commission, plus command ships, pirates and police: about 130 hulls at 0.7 KB, or about 90 KB) are saved, because they carry history (LONGHAUL v1.12.1, 2026-10-25: "hulls come from the yards, never from thin air").

### 6.7 Kit and items

The range (0.0.6), the lane (0.0.8) and the Tank (0.0.10) all need this shape first, so it is settled before 0.0.6, with one owner: **WEAPONS** owns `items`, the `kit` inside a person, `arms/kit.js` and the slots and containers (VIEWS draws them, BODY sums their mass). TECH fixes only the form (my call, from the reviewers' proposal):

```
person.kit = {
  tmpl: 'rifleman-garrison',                 // the issue template, until materialised
  worn:  { <slot>: itemId },                 // utilities, belt, carrier, pack, helmet, suit: WEAPONS names the slots
  hands: [rightId | null, leftId | null]
}
state.items = {
  'i311': { type: 'carrier', model: 'pc-m3', holds: ['i320', 'i321', 'i322'] },     // pouches ride on the carrier
  'i320': { type: 'pouch', model: 'mag2', holds: ['i402', 'i403'] },                 // two magazines, reach order first
  'i401': { type: 'mag', fam: 'had30c', n: 30, load: 'ball' },
  'i7':   { type: 'gun', model: 'r7', mag: 'i401', chamber: 'empty', mode: 'safe' }  // WEAPONS §4.1's state, by id; i401 is held by the gun
}
```

- **One record per item, in one place.** Every item's record is in `state.items`, wherever the item is. The same ids serve guns, magazines (a gun's `mag` is an item id), suits and their cartridges (BODY §19.2), pouches, IFAK parts, letters and tools.
- **One holder per item.** An item is held by exactly one of: a person's `kit.worn` or `kit.hands`; a container's `holds` (a pouch, a pack, a uniform's pocket, a locker's or rack's fixture state); a gun's `mag` or mount (an optic, a launcher); a site's lying list (`places.sites.<site>.items: [{ id, area, x, z }]`). The contents ride with their container, so a dropped pack keeps what is in it. This differs from the proposal's `carried: { containerId: [itemIds] }` on the person for that reason (my call). `$items.holder` is rebuilt on load, and `game-ids` asserts that every item is held exactly once and that every holder's id names an item that exists.
- **Lazy kit.** An NPC's issue kit is only `kit.tmpl` until one of its items is drawn, used, dropped, taken, searched or inspected. Then `materialise(state, personId)` gives the template's items ids and records (WEAPONS §4.1's lazy state, applied to all kit). The player's kit is materialised at the start. A crowd member has no kit record at all.
- **Moving an item** goes through `arms/kit.js move(state, itemId, toHolder)`, the one function that changes a holder, so the holder index never drifts.

---

## 7. Saves

### 7.1 Stores

IndexedDB database `olympus`, **version 2**. Its `onupgradeneeded` keeps version 1's `saves` store and adds the other two:

| Store | keyPath | Holds |
|---|---|---|
| `saves` | `slot` | save records (§7.3) |
| `profile` | `key` (one record, `'profile'`) | CAREER §3.2's profile: unlocks, careers across worlds, the worlds list. It outlives any world |
| `cache` | `key` | generated assets the game may rebuild at any time: sky surface maps (`sky:Phobos:1024x512:v1`), and later anything else heavy and pure. Cleared freely; never needed for correctness |

`localStorage` holds settings only, all under `olympus.*`: `olympus.settings` (JSON: key layout, short splashes, audio, accessibility, the quality level of §16.6), `olympus.debug`, `olympus.picks` (the gallery), `olympus.scores` (the test scenes' score cards, ROADMAP §2.2), `olympus.debug.overlays`. Every access is wrapped in try/catch, so a private window falls back to defaults (LONGHAUL `wm.js`).

### 7.2 Slots and worlds

A slot is `<worldId>:<name>`:
- `w-48213:auto` and `w-48213:auto-prev` (a Standard career: the latest autosave and an older one, rotated on time, §7.4; TIME §13);
- `w-48213:day` (Standard: the sol's first quiet moment after local 00:00, §7.4; my call);
- `w-48213:manual-1` to `manual-9` (Standard: nine manual slots; CAREER §23's "any number of slots" reads nine, correction 21);
- `w-48213:edge` (the content edge's save, ROADMAP §2.6: written once when the career reaches the build's edge, loaded on the next minor). In Ironman there is no separate edge slot: the `ironman` slot is the edge save;
- `w-48213:ironman` (an Ironman career's one slot per world, CAREER §23);
- `w-48213:ironman-prev` (Ironman: hidden, rotated on time like `auto-prev`, never listed; offered only by the loader's recovery, §7.3; my call).

The built store's unprefixed slots are read as world `w-legacy` (pre-1.0 "where it comes naturally"). Continue on the title opens the most recent record across worlds. The load list groups records by world, with the world's date, the career's name, grade and mode, and its honesty marks (§15.5).

### 7.3 The record

```json
{ "slot": "w-48213:auto", "world": "w-48213", "career": "c-48213-1", "json": "<canonical state JSON>",
  "digest": "188cc2865b727c", "bytes": 912384, "about": "Pvt Holloway · Sol 307 · 06:12 · Base Melas",
  "version": "0.1.3", "schema": 1, "mode": "standard", "seed": 48213, "gameMs": 123456789000,
  "savedAt": 1793900000000, "marks": [] }
```

`digest` is `hash.js digest(json)`, written when saved and checked on load. `marks` copies the state's honesty marks (`debugUsed`, `imported`, `recovered`) for the load list. A record whose digest fails, or whose state will not load (`fromJSON` or `upgradeState` throws, or each of the first 20 ticks after the load is lost, §3.7), is reported ("this save is damaged"), and the loader offers recovery:
- **Standard**: `auto-prev`, then `day`, then the newest manual slot of the world.
- **Ironman**: the hidden `ironman-prev`, offered only here. A career recovered this way is marked `meta.recovered = true`, shown beside `imported` and `debugUsed` (§15.5), so honesty is kept without losing the career to a bug (my call). A softlock the digest cannot see is a bug report (§7.6): the fix ships in code and the same save plays on.

### 7.4 Writing

- **Triggers** are TIME §13's, as `autosave` facts. `main.js` coalesces them: at most one write per frame, after the frame's ticks or skip steps.
- **When.** A live trigger (`AUTOSAVE_LIVE_MS`: 5 minutes of unpaused live play, counted by `time.liveSinceSaveMs` in game time) waits for a **quiet frame**: no tick owed beyond one, not in stop motion, not within 0.5 s of a shot. It waits at most 10 s, then writes anyway. Skip ends, area changes and chapter days write at once, because they sit behind a cut or a splash.
- **How.** `toJSON` (canonical) on the main thread. It measured 2.6 ms for a 508 KB synthetic save shaped like 0.1's (13 tier-1 sheets, 180 tier-2, 600 events, 2,000 log lines, 140 hulls, 800 items), about 5 µs a KB, so about 8 ms at 1.5 MB. From 0.2 it encodes only the dirty keys (§6.6). Then an IndexedDB `put`, which is asynchronous. Saving is **a pure read**: it changes nothing in the state (`liveSinceSaveMs` is reset by the sim when it asks, not by the writer).
- **Rotation, on time** (my call). Area changes write an autosave at every door, so copying `auto` to `auto-prev` at every write would leave `auto-prev` seconds behind `auto`, and a bug that corrupts the state or softlocks it would be in both within moments. So a Standard autosave copies the existing `auto` to `auto-prev`, in the same transaction, **only** when the existing `auto-prev` is at least `AUTO_PREV_GAME_MS` 600,000 (10 game minutes) older than the save being written, or at least `AUTO_PREV_REAL_MS` 300,000 (5 real minutes, by `savedAt`) older. `ironman-prev` rotates from `ironman` by the same rule.
- **The day slot.** At the first quiet frame after local 00:00 (00:00 after the timeslip, TIME §2.4), a Standard career also writes `day`: one slot per world, a sol old at most, which no door can overwrite.
- **Leaving.** `pagehide` and `visibilitychange` (hidden) start a write at once. Chrome finishes an IndexedDB transaction begun in `pagehide`. The 5-minute live cadence bounds what could be lost if it did not.
- **Ironman** writes only its slot (and its hidden `ironman-prev` by rotation), and at the extra moments TIME §13 lists (combat begins, death).
- **The edge.** On reaching the content edge, CAREER sets `career.edge` and asks for an autosave with `{ why: 'edge' }`; the writer puts it in `edge` (Standard) or `ironman` (Ironman), then the edge card shows (ROADMAP §2.6).

### 7.5 Loading

`fromJSON` (built) parses, checks `meta.game`, refuses a newer schema, and runs `upgradeState`. Then every runtime index is rebuilt from the saved order (§4.1, §6.3), the loop is set to the state's mode (§3.6: a saved skip resumes), and the stage builds the live area behind a cut. A load measured 7.6 ms for 508 KB, so about 23 ms at 1.5 MB, well inside the area-change budget.

### 7.6 Export, import and bug reports

- **Export** (Esc, "Save to a file", both modes): the canonical state JSON, named `olympus-<worldId>-<mode>-<UTC stamp>.json` (built, with the world added). Import reads it through `fromJSON`. An Ironman career restored from an export is marked `meta.imported = true`, shown on the profile and the load list, never in the fiction (§15.5, correction 22).
- **Report a problem** (Esc, and the toast after a lost tick): `olympus-report-<worldId>-<UTC stamp>.json`:

  ```json
  { "olympus": "report", "version": "0.1.3", "renderer": "ANGLE (Apple, ANGLE Metal Renderer: Apple M5 Pro)",
    "engine": { "browser": "Chrome 142.0.7444.60", "v8": "14.2", "platform": "macOS" },
    "screen": [3456, 2234, 2], "ppm": 24, "anchor": "<the last autosave's JSON>", "anchorSeq": 41200,
    "inputs": [[41201, {"mx": 1}, 37], [41238, {"act": ["people"]}, 1]], "skipCmds": [["k37", 1234560000, "stop"]],
    "checkpoints": [[41200, "188cc2865b727c"]], "errors": ["tick: TypeError …"], "stats": { }, "state": "<the state now>" }
  ```

  `engine` comes from `navigator.userAgentData.getHighEntropyValues(['fullVersionList', 'platform'])`; V8's version follows Chrome's milestone (Chrome 124 shipped V8 12.4, the one node 22 carries). `tools/replay.mjs` replays it (§8.3). The user's bug then becomes a test (tradecraft: "a test that pins a bug fails without the fix").

### 7.7 Schema policy

- `SAVE_SCHEMA` stays 1 for as long as every change can be filled in.
  - **Additive** changes go through `addUpgrade(id, fn)` (built). A domain fills what an older save lacks with `??=`, once, keyed by id.
  - **A rename or a change of meaning** is a one-shot migration in its domain's upgrade, guarded by `flags['mig:<id>']`.
  - **A change no upgrade can make** (a site template whose geometry moved under saved items, or a heap whose order rules changed) bumps `SAVE_SCHEMA`.
- **Before 1.0**, the user's tradecraft rule holds: "Before 1.0, old saves are kept only where it comes naturally" (2026-10-26, carried until they say otherwise). A schema bump refuses older saves with the message "This career was saved by OLYMPUS v0.1.4, before a change it cannot carry. Start a new career: your profile and the memorial are kept." The profile store and its unlocks are never versioned away.
- **After 1.0**, every bump must ship a migration.
- **Data versions.** Templates carry `@n`. A save names the version it was built from, and an upgrade may keep an old template version loadable or rebuild it.
- **Tests.** `core-state` keeps its upgrade tests. Each release that adds an upgrade adds a fixture save, made by the previous release, under `tests/fixtures/`, loaded and run 400 ticks without error (my call: cheap, and it catches a silent break).

---

## 8. Determinism

### 8.1 Rules

Rules marked (checked) are enforced by `tests/syntax.test.mjs` or by a test of their own.

1. **Time is integer ms** on the 50 ms grid. Events and durations are whole seconds. No float time anywhere. (built)
2. **One seeded rng with named streams** (`rngOf(state, name)`, saved). Things generated from their own seed use `stream(...seeds)` (unsaved, pure). No `Math.random` in `src`. (checked)
3. **Cosmetics come from hashes**: lines, faces, posters, the splash's crowd, the instinct's wording (`hash01`, `hashPick`). A cosmetic choice never draws from a stream. (Review; the test "cosmetics don't move dice" toggles every cosmetic option and asserts identical digests.)
4. **No real time in the sim.** No `Date`, no `performance`, no timers in `src/sim`, `src/world` or `src/data`. (checked)
5. **A tick is a function of the state and the input.** Everything a tick needs is in `state`, in the input snapshot, or a pure function of them.
6. **Budgets inside the sim are work units**: solves, node expansions, cells generated. Never milliseconds (correction 7).
7. **Derived data is pure and forced on demand** (§6.3). Background precomputation may only warm caches.
8. **Decisions act next tick** (§3.1), so the order of actors within a step does not change the result.
9. **Sorted iteration where order decides**: `ids(map)` (the cached ids in `cmpId` order, §2.3.2), queries `byDistanceThenId`, sorts with total comparators (ties by id; V8's sort is stable). A JS object's own key order is insertion order, but a canonical save writes keys sorted, so the same object iterates in a different order after a load. The key-order fuzz test (§8.2) catches any decision that depends on it.
10. **Runtime indexes are rebuilt from saved order**: the actor grid every tick, the events' index on load, the site graph from the template, the sorted ids and the items' holders on load.
11. **Floats and engines.** The user's Chrome (on the Mac and on Windows) and node 22 run different V8 versions (node 22 carries V8 12.4; Chrome's follows its milestone, 14.x in late 2026), and `Math.pow` and the transcendental functions have changed between V8 releases before. So (my call, refining TIME §14 rule 8):
    - **a transcendental result is rounded to its quantity's resolution before it is saved or compared with a threshold**, by `core/num.js q(x, step)`: the rng's draws (built), WEAPONS's ballistics (drop, drift and time of flight, before they decide a hit), BODY's exponentials (core heat, gas, blood, bone and conditioning, before they are written back), PLACES's gas and pressure decays. Each owner names its resolutions in its module header (my proposal: 1e-4 for °C and %, 1 Pa, 0.1 mm, 1e-6 rad). An ulp's difference between engines then almost never survives into a saved number;
    - **saves are not expected to move between engines in play**, and where one does (a bug report replayed in node), the report names its engine (§7.6) and `tools/replay.mjs` warns when node's V8 differs, and replays in the system Chrome through playwright on request (`--page`), the authoritative replay (§8.3).
12. **Saving and rendering are pure reads.** No listener, renderer or writer mutates the state. (checked by a test that wraps the state in a deep-freezing proxy during render and save in debug runs)
13. **Every player decision enters as an input** on a tick, or as a skip command at an `atMs` (§2.6, §5.5).

### 8.2 The tests

Each `game-*` test has a **quick** variant in the squad bay at night (13 people, 600 lived ticks, a 30-minute outcome skip), which runs in `npm run test:quick`, and a **heavy** variant in `mess-noon` (160 live agents, §16.7), which runs in `npm test` (my call). In `mess-noon`, `game-determinism` alone is 6,000 ticks and a skip run three ways, at up to 2 ms a tick: about 36 s, too much for the quick suite's 60 s (§13.7).

| Test (file) | What it does (heavy variant; the quick one is the same in the squad bay) | Prints | Must hold |
|---|---|---|---|
| `game-determinism` | The real sim (`tests/game.mjs`), scenario `mess` at 12:00. The recruit bot for 3,000 ticks, an outcome skip of 2 h, 3,000 more ticks. Run three ways: plain; save and load at tick 1,500; save and load inside the skip after its third slice | the three digests, µs per lived tick (mean and p99), µs per simulated minute, save KB | identical digests |
| `game-ids` | Inside `game-determinism`: every save it makes is walked; every id-keyed map's keys and every `id`, `…Id`, `…Ids` and `who` field must pass its kind's validator (§2.3.1) and name a record that exists or one on the memorial; every item is held exactly once (§6.7) | ids checked by kind; dangling ids; items by holder kind | none invalid, none dangling |
| `game-keyorder` | Load the mid-run save, rebuild every object in the state with its keys in **reversed** order (deep), and run on | digests both ways | identical |
| `game-slices` | The same 8-hour sleep advanced with budgets of one step a frame, seven steps a frame, and all at once | three digests, steps taken | identical |
| `game-targets` | One 8-hour sleep advanced under three target curves (TIME §6.2's ease, a linear one, and a stalling one that holds at 10% for 40 frames then jumps to the end) and by `skipNow`, each with a `skip:stop` fed at 05:00 into the sleep at the same `atMs`, as a replay feeds it; then a chapter day under two curves | five digests, steps taken, the stop's `atMs` | identical |
| `game-ff` | A 90-second fast-forward against 1,800 ticks lived with the same activity input (quick: 30 s and 600 ticks) | both digests | identical |
| `game-twogames` | Game A run, then game B fresh in the same process, against B run alone | digests | identical (no module state leaks) |
| `game-cosmetics` | Run with every cosmetic setting flipped (short splashes, line variants, density 16 against 24) | digests | identical |
| `browser` (built, extended) | In Chrome: save, 400 ticks, load, the same 400 ticks | bytes | identical |
| `game-replay` (heavy, browser) | Record 2 minutes of the recruit bot playing in the page through real key events, export a report, replay it in a second page and in node | the page's, the second page's and node's digests; both V8 versions; the first divergence if any | the page replay identical always; node's identical while rule 11's rounding holds (this test is its check) |
| `time-parity` | TIME §15 test 8 (lived equals skipped), run through this engine | TIME's numbers | TIME's tolerances |

### 8.3 Recording and replays

- `src/core/record.js` keeps, since the last autosave (the **anchor**):
  - every non-empty tick input as `[seq, input, count]`, run-length encoded, since walking repeats the same input for seconds;
  - every skip command `[skipId, atMs, cmd]`;
  - a checkpoint digest at each autosave.

  Memory is about 360 KB for five minutes of steady walking before run-length encoding, and far less after.
- **A replay** (`tools/replay.mjs`, `__olympus.replay(report)`) loads the anchor and steps the sim by `seq`. Each recorded input goes in at its seq, and `NO_INPUT` goes in between, with held ticks fed as held. Each skip is advanced to each recorded command's `atMs` as its target, the command fed there, then on to the end (§5.5). The replay prints the digest at each checkpoint and the first checkpoint that differs.
- **Which engine.** `tools/replay.mjs` prints the report's engine (§7.6) beside node's (`process.versions.v8`) and warns when the V8 versions differ. `--page` replays in the system Chrome through playwright-core on a port of 8230 to 8239 (CLAUDE.md), with `__olympus.replay(report)`: the authoritative replay when node's result differs from the report's checkpoints (rule 11).
- **Input completeness** is a test: the recruit bot plays a sol in the page while recording; the replay must reach the same final digest.

---

## 9. The renderer

VIEWS owns what the picture shows; this section is how it is drawn and what it may cost.

### 9.1 The pipeline (built)

`src/render/stage.js` is tradecraft's `pixelStage` with three changes already made. Per frame:
1. **Shadows.** The shadow map is redrawn only when the sun's 2 m step changes or the area does.
2. **Scene pass.** The scene is drawn **once** into two colour attachments (HalfFloat colour, RGBA8 part IDs) plus depth, using WebGL2 MRT. Every stage material is patched by `olyMaterial()` to write `pc_fragId`. tradecraft drew every opaque mesh twice for its ID pass.
3. **Post pass.** One full-screen quad, in VIEWS §2.5's order: the colour, the fog of awareness, outlines from the IDs and depth, air, body veils, grade, and the palette snap by **one `texelFetch` into a 64³ lookup baked on the GPU** whenever the palette changes. tradecraft looped over 116 colours per pixel: 60 M distances a frame at 960 × 540.
4. **Blit**, sharp-bilinear, to the window's device pixels.

### 9.2 What draws what, and the draw-call budget

| Layer | Drawn as | Draw calls, typical / worst |
|---|---|---|
| shadow map (on a step change only) | the static batches | 0 / 12 |
| the live area's static kit (walls, floors, furniture, thresholds) | one batch per atlas page (§9.3) | 2 / 4 |
| outdoor chunks of the near ring | one batch per chunk page | 0 / 24 |
| moving pieces (doors, hatches, locker doors, vehicles, a turning fan) | a small batch each (`props.js`), at most `PROPS_MAX` 40 | 10 / 40 |
| glass and thin things (transparent) | sorted, one batch each kind | 2 / 8 |
| people | one instanced draw of cards, one of blobs, one of muzzle flashes, one of ground rings (floating) | 3 / 4 |
| decals (blood, brass, magazines, boot prints, scorch, holes) | one instanced draw from the decal atlas | 1 / 2 |
| prop cards (plants, crates, rocks, cables) | one instanced draw per atlas | 1 / 2 |
| the far window (§9.9) | the scene again for its camera | 0 / 60 |
| post, far composite, blit | full-screen quads | 2 / 3 |
| **total** | | **about 25 / about 160** |

The target is **at most 160 in the worst bench scene** (my call). VIEWS §14's "under 600" stays as the hard failure. Triangles are not the cost (tradecraft's busiest frame was 7,256). Draw calls are, on ANGLE over D3D11 most of all.

### 9.3 Static geometry: areas, atlases and streamed chunks

- **An area** (a room, a deck, a building's floor) is built once when it goes live (`batch.js`, built). Its boxes become quads in one vertex buffer per atlas page. Faces map one texel to one screen pixel, and world-anchored tiles run on across quads. Paintings are packed shelf by shelf (`pack.js`, built: 91% fill measured). The build is a generator. Behind the area change's cut (VIEWS §5.5) it runs whole, within `AREA_BUILD_MS` 250 ms of paint, build and upload. The cut holds until it is done, for at most 1 s, and then shows what is ready.
- **The area cache.** PLACES keeps two recent areas in `$areaCache` for 10 game minutes. The render keeps their GPU groups for as long as memory allows (§16.4), so going back through a door costs nothing.
- **Outdoor chunks** (`CHUNK_M` 32 m, PLACES §2.4) are built in `render/chunks.js` by a generator, within `CHUNK_FRAME_MS` 3 ms of main-thread work a frame. The geometry arrays come from the worker (§11.2), and the main thread only uploads them. **Nothing pops into view**: the near ring's `REACH_M` 56 m is double the view's half-diagonal (24 × 13.5 m at most gives 27.5 m), so a chunk is built at least 28 m before it can be seen. Chunks are built ahead along the direction of travel first, and freed one frame after their replacement is drawn, so shared programs are never recompiled (tradecraft's `dying` list).
- **Ground runs.** A chunk's 1 m material cells are merged into runs of the same tile (world-anchored, so they still repeat seamlessly). That cuts a chunk's ground from 1,024 quads to a few dozen (my call), and a typical chunk stays under 600 KB of vertex data.
- **Tiles are painted once per site.** A site's tile kinds (regolith variants, slabs, deck plate) go into one tile atlas painted at site load. Chunks only reference it. So streaming a chunk uploads geometry, never new tile textures.

### 9.4 People: one instanced draw

`render/crowd.js` adapts tradecraft's (293 lines):
- **The atlas is a `DataArrayTexture` of 4096² layers**, allocated empty on the GPU and filled by sub-image copies (`renderer.copyTextureToTexture` with a region and a layer position: `texSubImage3D`, present in the vendored r186). Layers are 1 at density A and 2 at B (VIEWS §3.7).
- **Bands, not whole sheets.** A person's frames are allocated by band (street, weapon class, stance, environment, drill and PT, fight). Each band takes one LRU slot. A band is composed when first needed: a sleeper needs no weapon frames.
- **Composition happens in the worker** (§11.2). The pixels come back as a transferable buffer and join the upload queue. `SHEETS_PER_FRAME` is 2 (VIEWS). The player's own figure is composed on the main thread at once if the worker is busy: it is never deferred.
- **Per instance**: matrix, cell (layer, x, y, w, h), tint (`lightLevel` from the same helper the dice read, correction 14), flags (long cell, rotated, lifted, ghost). `MAX_PEOPLE` is 256 instances (VIEWS had 160): the largest drawn count of §16.7, a crowd scene's 224 live agents and 32 ghosts. `MAX_FLASHES` is 24.
- **Frames follow the sim**: stride for walks, step state for handling, the sim's clock for timings (VIEWS §3.6). Interpolation stops across a jump over `JUMP_M` 1.5 m (tradecraft; the user, 2026-11-04: "NPCs streak accross the screen when they spawn").

### 9.5 Decals, props and effects

- **Decals** (`render/decals.js`) merge tradecraft's `blood.js`, `items.js` and `prints.js` into one instanced draw over one decal atlas (1024², painted at site load with every decal kind):
  - **saved marks** (blood, scorch, holes) come from PLACES's lists (at most 500 a site);
  - **brass** follows WEAPONS §2: up to 64 moving cases are drawn as particles, and a case at rest is drawn from its 1 m tile's count (`brass[tile]`), scattered on the tile by hash. Nothing is dropped from view until the brass is policed, so the brass never pops out (the hub);
  - **prints and tracks** are a ring of 512 a kind, runtime only (PLACES §1.10; the user, 2026-11-04, wanted footprints "without it being too heavy in performance").
- **Effects** (`fx` facts): muzzle flashes, impacts, sparks and steam are instanced cards with lifetimes on the sim's clock, so a held clock holds them.

### 9.6 Light: tiled static pools, ten dynamic slots

tradecraft lit lamp pools with 10 pairs of spotlights moved to the nearest lamps each frame. Pools further away went dark, and adding lights to three rebuilds programs. Here (my call):
- **Static pools** (ceiling lamps, desk lamps, emergency lamps, sodium street lamps) are a per-area table. It has two parts:
  - a float texture of up to 256 lamps (`x, z, r, core, ring, kind, colour index`);
  - a grid texture of 4 m cells, RGBA8, holding up to four lamp indices per cell.

  The batch and card shaders loop over **at most four lamps per fragment**, computing each pool analytically: a core to r, a ring to 1.5 r, hard-edged, "as pixel art draws a pool of light". Each lamp's strength comes from the mood's per-kind uniform. Walls read the grid at their foot, by the fog's rule (a surface y metres up reads the ground y × 0.5 m south). The count of lamps no longer touches the program, and a 100 m troop deck can light every fixture.
- **Dynamic lights** (a muzzle flash's 3 m, a hand torch, suit lamps, vehicle lights, a flickering failed tube) keep the built 10 slot pairs, with no falloff and hard edges (`lights.js`).
- **One helper.** `places/light.js lightLevel(state, x, z, ms)` computes the same pools on the CPU for sprite tints and for perception's light level (the name VIEWS and PEOPLE use; correction 14). The test `light` (VIEWS §14) compares it with a GPU readback in a test-only page. Readback is allowed in tests only (§9.10).

The existing strip-light map (`uGlowMap`: floor strips, battle strips) stays as built.

### 9.7 Textures and uploads

- **Allocate once.** Every texture the stage uses is allocated at site or area load at its final size: tile atlas, area pages, the decal atlas, the people array, light tables, the fog, the lookup, and the render targets. Allocation uses data-less textures with `texStorage` semantics.
- **Fill in bands.** `render/uploads.js` is one queue for all mid-play uploads: people bands, chunk geometry, a repainted sign, a window's sky. It drains at most `UPLOAD_BYTES_FRAME` 1 MB and `UPLOAD_FRAME_MS` 2 ms a frame, the player's figure first (tradecraft: half a megabyte per sheet; VIEWS §14: "no upload over 1 MB in a frame").
- **Whole uploads only behind a cut**: an area load, a site load, the title. Never while the world is on screen (tradecraft on Windows, 2026-10-29: "each time I turn it staggers almost a second").
- **The CPU keeps no copies** of GPU pages, except the area pages it may need to rebuild after a context loss (§9.10), and those are regenerable anyway.

### 9.8 Shader programs: one fixed set, warmed at boot

The stage uses **these programs and no others**:
- `batch` (opaque static, with the tiled pools);
- `batch-transparent` (glass, thin);
- `card` (single sprites and props);
- `crowd` (instanced people);
- `blob`;
- `flash` (unlit instanced);
- `decal`;
- the shadow depth variant of `batch`;
- `post`, `blit` and `lut-bake`.

That is 11, with a ceiling of 16. `render/warm.js` builds a hidden warm scene with one mesh of each, and compiles it at boot with `renderer.compileAsync` (KHR_parallel_shader_compile where present: ANGLE over D3D11 compiles slowly, and compiling in parallel keeps the title responsive). The perf test counts `linkProgram` calls after the first frame of the first area and fails on any. A material with a new `defines` combination is a code review failure.

### 9.9 The far window and the splash zoom

- **The far window** (VIEWS §2.4) renders the scene again from a second orthographic camera into a small target pair (colour plus IDs, 2 × `FAR_R_PX`), through the same post program with its own 24 × 24 fog cells, and composites it before the blit. It opens only over **built** chunks. The range area pre-builds its target line at entry, and an outdoor far point builds its chunk with priority, so the 0.2 s dissolve starts once the chunk is ready. It costs at most +3 ms of GPU and +60 draw calls.
- **The splash's zoom** (VIEWS §2.4: "a crop of the picture, still rendered at zoom 1, blitted larger") is the blit with a source rectangle. It costs nothing extra.

### 9.10 Picking, readback and context loss

- **Picking is on the CPU.** A screen point goes to the ground through the camera's inverse, then to actors by their screen boxes (most southern first, as the cards overlap) and to fixtures by their footprints. **No `readPixels` in play** (it stalls the pipeline, on D3D11 most of all). The syntax rule allows it only in `src/render/stats.js` under the test flag.
- **Context loss.** On `webglcontextlost` the game pauses (a pause reason) and shows "the display is being restored". On `webglcontextrestored` the stage rebuilds its targets, the program set, the live area (repainted from its pure painters) and the people bands (recomposed). The sim never notices. tradecraft's `forceContextLoss()` on dispose stays (built), because "a browser keeps 16 or so" contexts.

### 9.11 A frame, in order (`render/view.js`)

tradecraft's `view.js` order, rewritten around OLYMPUS's sim (VIEWS §13):
1. the area or deck change and its cut;
2. the mood (sky, sun, lamp kinds, glow classes) from `places/light.js`;
3. interpolated positions (`alpha`), with jumps over 1.5 m not glided;
4. the camera: follow, the eye-lead, clamps, shake;
5. builds within budget: chunks ahead, a waiting area page, people bands composed;
6. lights: the pools table updated if lamps changed, dynamic slots;
7. air and weather uniforms;
8. sprite tints;
9. the fog mask (`fogcast.js`: symmetric shadowcasting over 0.5 m cells from the eyes against the area's opaque cells, then the cone, the reach and the light from perception's own formulas). It is recomputed when the eyes move 0.25 m or turn 3°, and once a game second, in at most 1 ms (tradecraft's eased fog: in 0.08 s, out 0.4 s);
10. people as remembered: ghosts frozen where last seen, from `state.mind.seen`;
11. the crowd instances, decals and effects;
12. the upload queue drained;
13. `stage.render()`;
14. the far window;
15. stats.

**Budget**: view CPU at most 4 ms a frame on the Mac (tradecraft measured 2.3 to 3.4 ms).

---

## 10. The instruments renderer

### 10.1 Screens over the stage

A screen (VIEWS §6.2) is DOM over the running stage:
- **The bezel** is a small canvas painted by `art/bezel.js` at stage-pixel size and scaled by the blit's factor with `image-rendering: pixelated`, so its pixels are the world's pixels.
- **Inside it** is the display: a `FitCanvas` (LONGHAUL `js/ui/dom.js`, 139 lines) at device resolution. Its DPR is clamped to 2, and it resizes its backing store only when its size or DPR changes.

The stage keeps rendering behind, dimmed. A screen is not an overlay, so the game is not paused (VIEWS §6.1). At most one screen view is open at a time, plus the suit HUD's small tac in the visor band.

### 10.2 The picture: knowledge, not truth

A screen draws a **picture**: a plain object produced by the sim for the screen's source, never `state.world` read directly (VIEWS §6.1: "Only what that screen knows"; LONGHAUL v1.12.18, 2026-10-31: "displays go by what the ship knows").

```
pictureFor(state, sourceId, ms) → {
  source, atMs, ageMs,                     // "PICTURE 9 s OLD"
  frame: 'ship' | 'body' | 'site',         // the coordinates the marks are in
  own: { pos, vel, heading, hull },        // the screen's own platform
  contacts: [{ id, kind, faction, pos, vel, hollow, ageMs, sigmaM, name, tags }],
  routes: [ … ], zones: [ … ],
  lagMs                                    // light lag to where the data came from
}
```

- `combat/pictures.js` builds pictures for sensor sources (COMBAT owns which source knows what). `places/` builds them for the base network's terminals and the range tower.
- Pictures are recomputed at the source's own cadence, at most 1 Hz (the repeater's `REPEATER_LAG_S` 5 s is built into `atMs`), and held in `$pictures`.
- The ephemeris is the one truth a screen may draw directly ("the ephemeris (always right about planets)", VIEWS §6.1). The import rule lets `src/ui/screens/*` import `src/world/ephemeris.js` and `optics.js`, and nothing else from `src/world`. (checked)
- The test `screens-know` (VIEWS §14) puts a contact in the truth that the source does not hold, and asserts that no mark is drawn for it.

### 10.3 The kit and the screens

| OLYMPUS | From LONGHAUL (lines) | Verdict |
|---|---|---|
| `ui/displays/kit.js` | `css/console.css` tokens, the `COL` tables | adapt: VIEWS §6.3's palette, weights, dashes |
| `ui/displays/labels.js` | `js/ui/labels.js` (105) | reuse as is: no overlap, priority-sorted, "left off rather than printed over another" |
| `ui/displays/marks.js` | `js/ui/marks.js` (104) | adapt: squad chevrons, reported contacts |
| `ui/displays/fit.js`, `ui/dom.js` | `js/ui/dom.js` (139) | reuse: `FitCanvas`, diffed `setText` and `setHTML` |
| `ui/displays/zoom.js`, `scalebar.js` | `solar-map.js` (630), `telescope.js` (886) | lift: eased zoom anchored at the pointer, round scale bars |
| `ui/pointers.js` | `js/ui/tooltip.js` (154) | reuse: pixel pointers in whole device pixels, at most 32 px |
| `ui/screens/system.js` | `js/ui/solar-map.js` (630) | adapt: the data side rewritten on pictures |
| `ui/screens/planetary.js` | `js/ui/worldzones.js` (184) | adapt; ship the font it names |
| `ui/screens/local.js` | `js/ui/tac.js` (544), `hull-art.js` (316) | adapt |
| `ui/screens/threat.js` | `js/ui/combat.js` ThreatView (of 327) | adapt |
| `ui/screens/scope.js` | `js/ui/telescope.js` (886), `js/sim/telescope.js` (280) maths | adapt, cut down; "below the horizon" and occultation lines added |
| `ui/screens/groundtac.js`, `terminal.js`, `rangetower.js`, `seat.js` | new on the kit | |

### 10.4 Cadence and budgets

| Screen | Redraws | Budget per redraw (1080p display canvas) |
|---|---|---|
| system map | on a picture change, during zoom or pan, and 4 Hz for a pulsing beacon | ≤ 4 ms; a point cloud past 1,500 marks (LONGHAUL's `Uint32Array` over `ImageData`) |
| local and threat | 30 Hz while a contact moves on screen, else on change | ≤ 3 ms |
| scope | 30 Hz while slewing, else 4 Hz (grain) | ≤ 4 ms, worlds cached by view key (LONGHAUL `SkyPainter`) |
| ground tac (suit) | 10 Hz | ≤ 1.5 ms (it stays open while you play) |
| terminal, range tower | on change | ≤ 2 ms |

`Labels` stays under 1 ms for 1,000 marks (LONGHAUL's 48 px grid). Fonts are IBM Plex Sans Condensed and Mono, latin subset WOFF2, shipped in `vendor/fonts/` with their OFL texts (`longhaul-visuals.md` §5.5: LONGHAUL shipped none). They are loaded with `FontFace` and awaited before a screen's first draw.

### 10.5 The sky

`src/art/sky.js` is LONGHAUL's `js/ui/scope-sky.js` (568 lines) made pure: its surface maps and its sphere ray-caster write into typed arrays, and the canvas calls move to the callers. It has two finishes (`longhaul-visuals.md` §8):
- **Optical**, for the scope and camera screens: LONGHAUL's look, at device resolution.
- **Pixel**, for the open sky ("look up" at night, VIEWS §6.8) and for windows. It is sampled on the stage's grid, snapped to the place's palette on the CPU (the same metric, through a CPU copy of the lookup), and drawn on a 2D canvas at stage resolution with `image-rendering: pixelated`. **It needs no WebGL upload at all.** It redraws at 2 to 4 Hz: Phobos crosses the Melas sky in about 4.2 hours (TIME), and a star field drifts a pixel in minutes. A window in the world is a small texture (a 1 m porthole is 24 px), refreshed at most once a game minute through the upload queue.
- **Surface maps at 2048 × 1024** (Mars, Europa, Jupiter, Earth) or 1024 × 512 (Phobos, Deimos, small moons) are made **in the worker**. LONGHAUL's 512 × 256 maps measured 23 ms (Phobos), 43 (Mars), 50 (Europa), 82 (Earth) and 107 (Jupiter). Sixteen times the pixels puts the big ones at 0.4 to 1.7 s each. They are cached in IndexedDB `cache` (keyed by body, size and generator version), so a later boot loads one in about 10 ms. 0.1 needs only Phobos and Deimos, because Mars is the ground underfoot.

---

## 11. Workers

### 11.1 No worker for the sim or the world (my call)

The sim and the background world run on the main thread, in the same tick as everything else. The reasons:
- **The costs leave room.** The busiest area's sim budget is 2 ms a tick (§3.1). LONGHAUL's whole default system (3,146 entities) measured 0.187 ms per game minute, and 0.057 ms per minute stepped lite. OLYMPUS steps its world hourly and daily, not by the minute (§3.5), and keeps civil traffic in closed form (§6.6). A world hour is expected well under 1 ms, and the costliest daily job under 10 ms, at its own slot, inside a skip or a sliced frame.
- **The prologue too** (§5.8, from 0.2): 271.76 days of world jobs and regenerated traffic fit in seconds, sliced behind the enlistment papers, so it needs no thread of its own.
- **Determinism is simplest in one thread.** A worker world would need its own copy of the state, a protocol for the sim to ask "where is that hull now", and replies that arrive a frame later. All of that is machine-dependent latency inside game logic, and it violates rule 5 unless every exchange is made synchronous, which defeats the worker.
- **Saves stay one object.** A save is the main thread's state, written in one pass.

If the world ever exceeds its budget (a full war with ground garrisons, past 0.3), the move would be to run world jobs as **outcome oracles** in a worker, requested a game hour ahead and applied at their slot. That is deterministic, because the request and the application are both in game time. It is not planned.

### 11.2 The paint worker

One module worker, `src/art/worker.js` (`new Worker(url, { type: 'module' })`). It runs two when `navigator.hardwareConcurrency` is 8 or more (my call). It runs **pure jobs** from `src/art/jobs.js`, and the same functions run on the main thread when no worker is available:

| Job | Input | Output (transferable) | Typical (my estimate) |
|---|---|---|---|
| `sheet` | a person's look spec, a band, the variant | the band's pixels and its frame table | 1.5 to 3 ms (VIEWS §3.7 `SHEET_MS`) |
| `area` | an area's plan and finishes | its paintings, packed into pages, and its batch arrays | 30 to 120 ms behind the cut |
| `chunk` | a site seed, `(i, j)`, the plan's clip | the chunk's batch arrays (ground runs, dressing) | 5 to 15 ms |
| `sky` | a body, a size, the generator version | its surface map | 0.4 to 1.7 s, then cached |
| `doll` | the close figure's spec | its pixels | ≤ 15 ms (VIEWS §14) |

- **The protocol** is a message `{ id, job, args }` answered by `{ id, ok, buffers, meta }`, the buffers sent in the transfer list. No `SharedArrayBuffer`.
- **Priority**: the player's sheet, then visible people, then the next area, then chunks ahead, then sky maps.
- **The worker is cosmetic.** Its outputs are pixels and geometry for the stage only. The sim never waits on it, so its timing cannot touch determinism. Its outputs are still pure: the test `worker` asserts that worker and main-thread outputs have equal digests, byte for byte.
- **Fallback**: if `new Worker` throws, `art/jobs.js` runs on the main thread as generators within 4 ms a frame (tradecraft's yielding builders).

### 11.3 No SharedArrayBuffer, no COOP or COEP

As the method note recommends (`tradecraft-method.md` §5.2), the game needs no cross-origin isolation. `tools/serve.py` sends no COOP or COEP headers, so local play matches any static host (itch.io, GitHub Pages). Adding them would be a recorded decision.

---

## 12. The porting plan

### 12.1 Rules for a port

- **Copied** means the file is brought over with its maths intact, renamed with an `OLYMPUS:` header naming its source and version, its tests ported with it, and its numbers checked against the source's printed ones (rng: "tradecraft's sequence bit for bit", built).
- **Adapted** means rewritten on the source's structure and constants, with what changed listed in the header and in CHANGELOG.md.
- **Referenced** means only its numbers and patterns are used, cited in the new module's header.
- The sources are read-only: read, import pure modules from scratch scripts for numbers, never change them, never run their release scripts or use their ports (CLAUDE.md).

### 12.2 Already ported (0.0.x)

| Source (lines) | OLYMPUS | How |
|---|---|---|
| tradecraft `src/sim/rng.js` (67) | `src/core/rng.js` | copied, plus named saved streams |
| tradecraft `src/sim/bus.js` (10), LONGHAUL `js/core/events.js` (39) | `src/core/bus.js` | merged, listener errors contained |
| tradecraft `src/sim/state.js` (57), LONGHAUL `js/sim/save.js` (45) | `src/core/state.js` | merged; canonical; NaN; `addUpgrade` |
| tradecraft `src/sim/clock.js` (62), LONGHAUL `js/core/clock.js` (64) | `src/core/clock.js`, `calendar.js` | adapted: ms at LONGHAUL's epoch, MSD and Mars local time |
| tradecraft `src/ui/store.js` (47), LONGHAUL `js/storage.js`, `js/ui/persistence.js` (92) | `src/core/store.js` | merged |
| tradecraft `src/ui/input.js` (76) | `src/core/keys.js`, `input.js` | adapted: a pure key machine split out |
| tradecraft `src/main.js` (509), loop and debug | `src/core/loop.js`, `debug.js`, `src/main.js` | adapted: layers, holds, skip |
| tradecraft `src/art/pixelart.js` (1,103) | `src/render/stage.js`, `camera.js`, `post.js`, `lights.js`, `moods.js`, `materials.js`, `scale.js`; `src/art/tone.js`, `palette.js`, `paint.js`, `tiles.js`, `font.js`, `brush.js` | adapted: MRT, GPU lookup snap, glow classes in alpha |
| tradecraft `src/render/interior.js` (198), `cutaway.js` (56) | `src/render/cutaway.js`, `walls.js` | adapted: deck mode, strips |
| tradecraft tools and tests (method) | `tools/*`, `tests/run.mjs`, `helpers.mjs`, `browser.mjs`, `syntax`, `version` | adapted (method note §12) |

### 12.3 To port from tradecraft, by milestone

| Source (lines) | OLYMPUS | Verdict | What changes | When |
|---|---|---|---|---|
| `src/art/sprites.js` (1,587) | `src/art/sprites/*` | adapt | roles and shading kept; templates per picked variant; military kit; true-left layers; VIEWS §3.4's frames | 0.0.x |
| `src/render/crowd.js` (293) | `src/render/crowd.js` | adapt | array atlas, bands, long and rotated cells, `MAX_PEOPLE` 256 (§16.7) | 0.0.x |
| `src/art/furniture.js` (1,700) | `src/art/furniture/*` | adapt the kit, new makers | whole-pixel boxes, parts, `GLASS`, `THIN`, `compact()` as is; military and ship kinds | 0.0.x to 0.1 |
| `tools/gallery.mjs` (83), `samples/index.html` (99) | the same paths | adapt | port 8212, `olympus.picks`, pixel mode | 0.0.x |
| `src/sim/light.js` (143) | `src/sim/places/light.js` | adapt | `lightLevel` (correction 14); the Mars sun (Mars24), moods, tiled pools on the CPU | 0.0.x |
| `src/sim/checks.js` (79), `skills.js` (56), `xp.js` (74), `training.js` (98), `rust.js` (65), `know.js` (80), `belief.js` (66), `sense.js` (179), `instinct.js` (53), `tutorial/earpiece.js` (119) | `src/sim/skills/*` | adapt or port (SKILLS §16) | | 0.1 |
| `src/sim/fitness.js` (77), `needs.js` (129), `thermal.js` (159), `health.js` (404), `medicine.js` (251), `aid.js` (340), `diagnosis.js` (282), `blood.js` (47) | `src/sim/body/*` | adapt (BODY §2.7) | | 0.1 |
| `src/sim/firearms.js` (487), `shooting.js` (637), `gunwork.js` (142), `armoury.js` (67), `armour.js` (247), `paper.js` (94), `armed.js` (549, `gunner()`), `scenarios/range.js` (415, `safety()`) | `src/sim/arms/*` | adapt (WEAPONS §15) | | 0.1 |
| `src/sim/items.js` (278), `clothes.js` (311) | `src/sim/arms/kit.js` | adapt (WEAPONS; VIEWS draws it) | pockets become load-bearing gear; `state.items` and `person.kit` (§6.7) | the shape before 0.0.6; the port 0.0.6 |
| `src/sim/reflex.js` (76), `cover.js` (135), `weapons.js` (106, the melee table) | `src/sim/combat/reflex.js`, `cover.js`, `cqc.js` | adapt (COMBAT §18) | | 0.1 (reflex, cover for the range and drills), later (the rest) |
| `src/sim/people.js` (225), `interiors/staffing.js` (174), `crowd.js` (319), `agents.js` (579, routes and stops), `perception.js` (265), `interact.js` (291), `habits.js` (148) | `src/sim/people/*` | adapt (PEOPLE) | areas and a navgraph replace the street rows | 0.1 |
| `src/sim/world.js` (177), `interiors/plan.js` (75), `furniture.js` (145), `use.js` (48), `path.js` (59), `range.js` (83), `acts.js` (315) | `src/sim/places/*`, `src/data/furniture.js` | adapt (PLACES) | A* on a binary heap; grids cached per area and class | 0.1 |
| `src/sim/log.js` (27) | `src/sim/log.js` | adapt | §6.5's record | 0.1 |
| `src/sim/game.js` (620) | `src/sim/game.js` | reference | the order of the tick and the shape of `skip()`; the body is rewritten | 0.1 |
| `src/art/doll.js` (903) | `src/art/doll.js`, `weaponcard.js` | adapt strongly (VIEWS §4) | | 0.1 |
| `src/render/blood.js` (62), `items.js` (95), `prints.js` (64) | `src/render/decals.js` | reuse, merged | one instanced draw | 0.1 |
| `src/render/view.js` (710) | `src/render/view.js` | rewrite, order kept (§9.11) | | 0.1 |
| `src/art/pixeltown.js` (2,312): `keep`, `compact`, `bevel`, `fineBricks`, `stones` | `src/art/brush.js`, `structures.js` | port the helpers | | 0.1 |
| `src/art/townsprites.js` (464): `foliage`, `propCard` | `src/art/props.js` | adapt | | 0.1 (cards), later (dome parks) |
| `src/render/town.js` (474) | `src/render/chunks.js` | reference: the generator in budget, see-through cards | | 0.1 |
| `src/ui/plaque.js` (190), `pockets.js` (142), `body.js` (92), `mind.js` (265) | `src/ui/plaque.js`, `cards/inventory.js`, `aid.js`, `mind.js` | adapt | | 0.1 |
| `src/ui/ui.js` (1,169), `style.css` | `src/ui/hud/*`, `cards/*` | reference: tokens and grammar kept, split into one module per screen | | 0.1 |
| `tests/bots.mjs` (129), `rangebot.mjs` (93), `shopwalk.mjs` (45), `world.test.mjs` (171) | `tests/bots/*`, `game-determinism` | reference (pattern) | | 0.1 |
| `src/sim/cqc.js` (473), `cqctext.js` (217), `cqcshow.js` (136), `fight.js` (206), `wounded.js` (177), `onlookers.js` (164), `scenarios/dojo.js` (419) | `src/sim/combat/*`, `people/*` | adapt (COMBAT §18, PEOPLE) | | the mat room at 0.1, the rest later |
| `tools/vendor-three.mjs` (61) | `tools/vendor-three.mjs` | reuse when three is upgraded | | as needed |

### 12.4 To port from LONGHAUL, by milestone

| Source (lines) | OLYMPUS | Verdict | What changes | When |
|---|---|---|---|---|
| `js/core/constants.js` (31) | `src/world/constants.js` | reuse, extended | `C_MS` 299,792,458; the warp table dropped | 0.1 |
| `js/sim/ephemeris.js` (180) | `src/world/ephemeris.js` | copy | none (TIME's numbers are measured on it) | 0.1 (Phobos, Deimos, the Sun in the Melas sky) |
| `js/sim/bodyfacts.js` (111) | `src/data/bodyfacts.js` | copy, text edited (SETTING) | | 0.1 |
| `js/ui/scope-sky.js` (568) | `src/art/sky.js` | adapt | made pure; maps to 2048 in the worker; pixel finish | 0.1 |
| `js/ui/labels.js` (105), `marks.js` (104), `dom.js` (139), `tooltip.js` (154), `presenter.js` (328, pattern) | `src/ui/displays/*`, `ui/dom.js`, `ui/pointers.js`, `ui/presenter.js` | reuse or adapt | | 0.1 (wall terminal, range tower) |
| `js/sim/gravity.js` (161), `lambert.js` (119), `spatial-hash.js` (114) | `src/world/` | copy | `feltG()` added beside gravity | 0.2 (the world layer's forces need the rails and the hash) |
| `js/sim/worlds.js` (425) | `src/world/worlds.js` | adapt: the physics half | air, wells, orbits, sites, the solar day | 0.2 |
| `js/sim/world.js` (487): `orbitStateAt`, `transitStateAt`, `restingOrbit`, `propagateFree` | `src/world/rails.js` | adapt: pure functions lifted | | 0.2 |
| `js/sim/politics.js` (373), `conflict.js` (606), `forces.js` (781), `intel.js` (396), `traffic.js` (492) | `src/world/` | adapt, **together** (correction 23) | jobs at TIME's slots; SETTING §2.3's prologue constraints and injected timeline; ground zone kinds (COMBAT); the AP transports as non-combat hulls (SETTING §6); traffic for transits only, regenerated daily (§6.6), with each zone's daily transit intervals (§5.8); `world-year` against LONGHAUL's printed year | 0.2 (the prologue, and the live news). At 0.1 the wall terminal's news is SETTING §7.7's authored timeline, through `world/news.js` |
| `js/sim/ship-classes.js` (616), `factions.js` (231) | `src/data/hulls.js`, `factions.js` | data | SETTING's faces and sub-factions | 0.1 (the authored archive names them) |
| `js/sim/names.js` (1,255), `careers.js` (365, given names by home) | `src/data/setting/names.js` | data (SETTING §12, PEOPLE §3.5) | pools by culture and home; the registry is `state.names` | 0.1 |
| `js/sim/crew.js` (521, G physiology), `inertia.js` (140) | `src/sim/body/gload.js`, `motion.js` | adapt (BODY) | per minute becomes per second | 0.2 |
| `js/sim/fire.js` (134), `life-support.js` (287) | `src/sim/places/env.js` | adapt or reference (PLACES) | per compartment | 0.2 |
| `js/sim/ship-layout.js` (607) | `src/data/decks/*` | reference (PLACES) | | 0.2 |
| `js/ui/solar-map.js` (630), `worldzones.js` (184), `tac.js` (544), `scanner.js` (169), `combat.js` (327), `hull-art.js` (316) | `src/ui/screens/*` | adapt (§10.3) | | 0.2 |
| `js/sim/planetary.js` (681) | `src/world/dropship.js`, `kepler.js` | adapt: integrators with the craft injected | | 0.3 |
| `js/sim/telescope.js` (280), `js/ui/telescope.js` (886) | `src/world/optics.js`, `src/ui/screens/scope.js` | copy the maths; adapt the picture | | 0.3 |
| `js/sim/weapons.js` (155), `sensors.js` (258), `combatants.js` (278), `ordnance.js` (675), `damage.js` (594), `agents.js` (1,111), `boarding.js` (594), `js/ui/scope-fx.js` (689) | `src/world/ship/*`, `src/sim/combat/*`, `src/ui/screens/scope-fx.js` | adapt (COMBAT §13 and §18; `longhaul-combat.md` §16) | one minute ahead of the interior, with timestamped interior events (§3.4); the player's ship becomes one more agent | later |
| `js/sim/jobs.js` (62), the damage-control job board | `src/sim/combat/board.js` | reuse (COMBAT §13) | not to be confused with `src/sim/jobs.js`, the recurring jobs | later |

### 12.5 Not ported

- **tradecraft**:
  - the street world: `cities/*`, `countries/*`, `city.js`, `map/street.js`, `metro.js`, `buses.js`, `taxi.js`, `traffic.js`, `police.js`, `emergency.js` (reference for casualties), `dial.js`, `phone.js`, `market.js`, `shops.js` (reference for the PX);
  - the spy scenarios: `sdr`, `tail`, `watch`, `hunted`;
  - `hunt.js` (reference for pursuit), `pixeltown.js`'s street painters, `arabic.js`;
  - the rejected realistic pipeline (`tools/blender/*`, `fetch-asset.mjs`, `fetch-cmu.sh`, the MPFB and Mixamo parts of `setup.sh`; the user, 2026-10-25: "pixel art 100%, but simple, almost 2D");
  - `tools/gen.sh` and any image generation, by MCP or by script (the user, 2026-11-05: "btw we don't use the image gen mcp at all in the other projects"). Every image and sound is drawn by the game's code.
- **LONGHAUL**:
  - the WebGL2 3D views (`js/ui/gl/*`, `exterior.js`, `hullcam.js`, `shuttlecam.js`) and `roomcam.js` (reference for lighting states);
  - the captain's console: `console.js`, `wm.js`, `app.js`, `advisor.js`, `nav.js` and `autopilot.js` (the latter two references for crew-safety interlocks);
  - `docking.js`, `contracts.js`, `market.js`, `crew-ai.js`, the 4,161-line legacy CSS.

---

## 13. Testing

### 13.1 Kinds of test

| Kind | Where | Runs | Example |
|---|---|---|---|
| unit sims | `tests/<domain>-*.test.mjs`, node | quick | `body-water`, `skills-checks`, `core-queue` |
| golden hashes | in the test that generates | quick | Base Melas' site digest, the roster's digest |
| statistical | N trials, rates printed, room for chance | quick (small N), heavy (big N) | `skills-checks` 100,000 rolls (heavy) |
| parity | lived against skipped, live minute against skip step | quick, with a heavy 8-hour variant | `time-parity` |
| determinism | §8.2 | quick in the squad bay; heavy in `mess-noon`, and replay | `game-determinism` |
| headless game with bots | node, the full sim, no render | heavy | `bots-week` |
| browser | Chrome headless on the GPU, its own port | heavy | `browser`, `core-browser`, `views-*` |
| performance | Chrome, scripted scenes, printed tables | heavy | `perf`, `uploads`, `soak` |

Files stay flat in `tests/` (the runner reads that one folder), prefixed by domain: `core-`, `render-`, `art-`, `time-`, `body-`, `skills-`, `weapons-`, `combat-`, `people-`, `places-`, `career-`, `world-`, `views-`, `game-`, `browser-`, `perf-`. Helper modules sit beside them: `helpers.mjs`, `browser.mjs`, `game.mjs`, `golden.mjs`, and `bots/*.mjs`. Names are sentences about the behaviour, with the user's words and date when a test pins their ask (CLAUDE.md).

### 13.2 The headless game and the bots

- **`tests/game.mjs`** builds the real game with no render: `createGame({ scenario, seed, mode })` → `{ state, bus, loop, sim, step(n, inputOrBot), skipNow(req), run(ms, bot), digest() }`. Skips run synchronously (`targetMs = Infinity`), with the same code and the same step grid as the page (§5.3). A bus recorder collects facts for assertions.
- **A bot** is `(state, me, mem) → input` for one tick, pure. Its memory is plain data on its actor (`me.bot`), so it saves and loads with the game (tradecraft `bots.mjs`). Bots press only what a player can press: actions, digits, moves. They never write the state.
- **The toolkit** (`tests/bots/lib.mjs`, my call). A bot written ad hoc for each moment breaks with every content change, and every moment test, fixture and bench depends on bots. So bots are built from primitives on the same actions table the player's keys reach (§2.5), each a small state machine whose memory is plain data in `me.bot`:

  | Primitive | Does | Ends |
  |---|---|---|
  | `goTo(spot)` | sets the waypoint action (`state.player.waypoint`, as the mouse does) and walks it; where the waypoint is refused, presses ZQSD toward the next cell of a path it asks `places/nav.js` for | arrived, or failed with its reason after `BOT_STUCK_S` 10 s without progress |
  | `use(fixtureUse)` | at the fixture's spot, R, then the offered use's digit (a shower, a rack, a rifle-cleaning table) | the activity begun, or refused with the instinct's `why` |
  | `answer(cardKind, option)` | waits for a card of that kind (the late card, a reflex, a talk choice) and picks the option by its digit | picked, or failed if another card came |
  | `doSteps([…])` | the step panel's steps by digit, in order, each waiting for the last to finish (handling steps, stop-motion shots) | all done, or the first refused step with its reason |
  | `waitUntil(pred, timeoutMs)` | no input until `pred(state)` | the predicate, or the timeout |
  | `plan([…])` | runs primitives in sequence; a failure ends the plan with the primitive's reason | |

  It grows from 0.0.4, where `walker` is `goTo` over every spot. Each join extends the `recruit` bot with the content it joins, so the moment tests arrive with their content (ROADMAP §2.3). A failed primitive prints its reason and the tick, so a content change that breaks a bot says where.
- **Bots for 0.1**:

  | Bot | Plays | Prints |
  |---|---|---|
  | `recruit` | the Plan of the Day: reveille, the head, shower, dress, formation, chow, PT, the range, classes, rifle cleaning, free time, letters, taps. It uses skips as a player would, and answers instinct prompts with T | the sol's timeline (each block's real and game minutes), lateness, needs bands at taps, rolls made, skips taken |
  | `rangebot` | tradecraft's `shootRange` re-made for WEAPONS' steps: checked clear, magazines filled, loaded, safe off only on the line, the course fired, stoppages cleared, unloaded, shown clear. Faults on request: `sweep`, `finger`, `offline-safe-off`, `no-check` | rounds, hits, time per step, the safety officer's reactions |
  | `walker` | every portal of every area to every spot, for all three clearance classes | reached, failed with its reason, path length and expansions |
  | `slob` | skips the shower, sleep and cleaning | BODY's consequences, discipline events |
  | `idler` | does nothing for a sol | the world going on: missed formations, the squad leader's search, the summons |

- **Speed.** At about 50 µs a lived tick in an ordinary area (my estimate: the dummy sim measured 1.6 µs, and the real one is budgeted at 2 ms in the busiest area), a recruit's sol of 40 to 70 lived minutes is 48,000 to 84,000 ticks, 2.4 to 4.2 s of compute. A standby week is 30 s or so: a heavy test.

### 13.3 Browser tests

`tests/browser.mjs` is built: `withGame(fn, { port, query, init, ready })`, the system Chrome headless with `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`, errors collected and failing the test, and `frameMs(page)`. Additions:
- **`window.__ready`** turns true only when three frames have been drawn **with nothing pending**: area built, uploads drained, visible sheets composed, worker idle for the visible set. The limit is 10 s, after which it turns true and `__report.pending` says what was still waiting (so shots never catch a half-built frame).
- **The page's facts.** `withGame` gives the test a `facts` recorder on the page's bus (`__olympus.bus`).
- **Key presses go by code** (`page.keyboard.down('KeyW')`), as the game reads them (CLAUDE.md).

### 13.4 Performance tests and the bench card

- **Scenes** (`?bench=<scene>`). Each runs a scripted 20 s: a camera path and bot activity.

  | Scene | Milestone |
  |---|---|
  | `squadbay-night` | 0.1 |
  | `parade-platoon` (42 in formation, outdoors, chunks) | 0.1 |
  | `range-far` (firing line, the far window open at 200 m) | 0.1 |
  | `mess-noon` (160 live agents: the busiest area, §16.7) | 0.1 |
  | `troopship-battle` (a berthing deck under battle red, couches, a floater) | 0.2 |
  | `europa-street` | 0.3 |
  | `cavern-riot` (a crowd scene: 200 civilians in a cavern when shots start, COMBAT §20's `crowd`; §16.7) | 0.3 |

  The people in each scene are §16.7's table.

- **`tests/perf.test.mjs`** (heavy) runs each scene in Chrome on the Mac three times:
  - unthrottled;
  - under a 4× CPU throttle (`Emulation.setCPUThrottlingRate` over CDP), the stand-in for the integrated class's laptop CPU (§16.6);
  - under 6× for the walking scenes.

  It prints one row per scene and run: frame median, p95, p99, frames over 25 ms, draw calls (max), triangles, programs, uploads (max per frame and mean), view CPU ms, sim ms per tick (mean and p99), ticks per frame, GPU ms per pass (shadow, scene, post, far window, blit: §16.6), the quality level, JS heap, and our own GPU byte count. It fails on §16's budgets, the throttled ones included.
- **`tests/uploads.test.mjs`** (heavy) is a 60 s walk through Base Melas with 60 people. It prints bytes uploaded per frame (max, mean), sheets composed per frame and layers in use, and asserts no frame over 1 MB, no whole-texture upload after the first area, and no program linked after it.
- **`tests/soak.test.mjs`** (heavy) runs the recruit bot in the page for 10 minutes. It prints heap at start and end after a forced GC (`--js-flags=--expose-gc`), lost ticks and errors, and asserts heap growth under 20 MB and no errors.
- **The bench card** (`?bench=all`, or Settings, Benchmark) runs the same scenes in the user's own browser. It shows the table with the machine's renderer string (`WEBGL_debug_renderer_info`), DPR, window size, `hardwareConcurrency`, the GPU ms per pass and the quality level it would choose (§16.6), and offers **Copy results**, so the user can run it on Windows and paste the result into the conversation: the gallery's "Copy my picks" pattern. Headless Chrome on a Mac hides Windows upload stalls (tradecraft PIPELINE, 2026-10-29), so this card is how ANGLE over D3D11 gets judged (my call).

### 13.5 Golden hashes

`tests/golden.mjs` provides `golden(name, value, expected)`. It digests the canonical JSON of `value` (or the bytes of a typed array) and compares. With `PRINT_HASH=1` it prints `golden('<name>', …, '<digest>')` lines ready to paste. A golden re-set on purpose is said so in CHANGELOG.md (tradecraft's way). Goldens at 0.1:
- the Base Melas site (rooms, fixtures, spots, openings), and a chunk's tiles and dressing;
- the company roster from seed 48213, and sol 1's schedules for the squad;
- the palette per place, and the lookup sampled at 4,096 cells;
- each sprite variant's sheet for 6 kit specs;
- an area's atlas packing;
- the day's traffic lanes (0.2).

### 13.6 TECH's own tests and their printed numbers

| Test | Prints | Must hold |
|---|---|---|
| `syntax` (extended) | modules parsed; each rule's violations | none (the import matrix, real time, `three` only in render, the facts registry, headers, no em dashes, no `Math.random`, no `readPixels` outside stats) |
| `core-queue` | operations per ms over 100,000 random operations; the maximum heap size | identical pop order against a sorted reference; save and load mid-way change nothing |
| `core-store` (extended) | slots per world, with each slot's age in game minutes and real seconds; profile and cache stores; `auto-prev` and `ironman-prev` rotation over a scripted walk through 30 doors in 4 game minutes; the `day` slot after 00:00; the `edge` slot; digest on load; bytes and ms to write and read | two rotations of `auto-prev` at least 10 game minutes or 5 real minutes apart, so 30 doors leave it untouched; a damaged record is reported and `auto-prev` (Standard) or `ironman-prev` (Ironman, which then marks `recovered`) offered |
| `core-loop` (extended) | the four modes; ticks per frame in `ff`; steps per frame in `outcome` and the grid of each skip kind; the hold set mid-tick | `ff` never exceeds 40 ticks a frame; a skip resumes after a load; a hold set by step 8 skips steps 9 and 10, runs step 11, and leaves the clock where it was |
| `core-ids` | each kind's validator on good and bad samples; `ids(map)` against a fresh sort over 100,000 random puts and drops; the cost of `ids(people)` per call | identical orders; no allocation per call |
| `game-domains` | the registered top-level keys and their owners; each domain's `init` alone | the registry equals §6.1's table; no key claimed twice; no save key outside the registry (§2.5) |
| `game-determinism`, `-ids`, `-keyorder`, `-slices`, `-targets`, `-ff`, `-twogames`, `-cosmetics` | §8.2 | identical digests; every id valid |
| `game-tick` | the tick's mean and p99 per fast layer in `mess-noon` (node), the slow step's cost on the minute | the sum at or under 2 ms mean; the minute tick at or under 4 ms |
| `game-jobs` | each recurring job's next occurrence after a standby week | exactly one live occurrence per job |
| `world-prologue` (0.2) | compute ms, with the zones' traffic intervals apart; zones born and ended; incidents; hulls lost; the MCR to UN relation at its lowest and at the start; the golden digest for seed 48213 | at or under 3 s; SETTING §2.3's three constraints hold |
| `world-year` (0.2, heavy) | §5.8: a year on five seeds with regenerated traffic, beside LONGHAUL's printed year | each count within LONGHAUL's room for chance |
| `world-upgrade` (0.2) | an 0.1 edge-save fixture loaded, its world rolled from its seed to its clock; the archive's authored headlines found again | the authored timeline intact; the save plays on 400 ticks |
| `save-size` | the save's size by domain and its record counts (people by tier, stubs, happenings, events, log, items) at the end of each sol of the recruit's week | at or under 1.5 MB in all, each domain within §6.6 (a warning, not a failure); events at or under 4,000; log at or under 1,500 |
| `save-cost` | `toJSON` and `fromJSON` ms on the week's last save; from 0.2, the incremental encode's ms and its check against a fresh one | at or under 10 ms and 30 ms on the Mac; the incremental save byte-identical |
| `worker` (browser) | the digest of each job's output from the worker and from the main thread; ms each | equal digests |
| `bots-week` (heavy) | per sol: lived ticks, skips, compute ms, sim ms per tick, errors, lateness, the queue's size, save KB | no errors; the budgets |

### 13.7 Run times

- `npm run test:quick` stays under **60 s** on the Mac. It is what runs while the user may be playing (CLAUDE.md). The runner prints the quick suite's total and **fails it above 60 s** (`QUICK_LIMIT_S`). A run that fails on time alone while the user plays is run again on a quiet machine before anything is changed, since the machine is shared.
- `npm test`, heavy included, stays under **10 minutes**.
- What keeps the quick suite inside its minute: the determinism family runs in the squad bay there (§8.2), statistical tests run small N, and anything over 5 s is heavy (my call).

The runner already prints each test's ms. A test whose time doubles from one release to the next is a finding worth reporting.

---

## 14. Tooling

| Tool | State | Usage | What it does |
|---|---|---|---|
| `./play.sh [--dev]`, `play.cmd` | built | | the play copy on :8200, the working tree on :8201 |
| `tools/promote.sh [vX.Y.Z \| --status]` | built | | moves the play copy, only on the user's go |
| `tools/release.sh patch \| minor \| rc [--major] \| major --user-validated "<summary>" --trailer …` | built | | CHANGELOG, VERSION, tests, commit, tag, push |
| `tools/serve.py <port> <dir>` | built | | no-store, a queue of 128, 127.0.0.1, types set in code; add `.woff2`, `.wav`, `.ogg`, `.json` if missing |
| `tools/shot.mjs <url> <out.png> [--size WxH] [--ready expr] [--timeout ms]` | built | | a screenshot that fails on errors; add `--pixel WxH` (shoot at 3×, point-sample back, keep a PNG at 2×: tradecraft's pixel mode) |
| `tools/awake.sh` | built | | the keep-awake lease |
| `tools/gallery.mjs [filter]` | to port (0.0.x) | :8212 | shoots every `samples/NNN-name/sample.json` view (`{ title, about, pixel, views: [{ name, query }] }`) into `samples/<id>/shots/`, `samples/index.json` and a contact sheet; the page has ★ picks and "Copy my picks" (`olympus.picks`) |
| `tools/perf.mjs [scene…] [--throttle 4] [--seconds 20] [--port 8223]` | new (0.1) | | the perf scenes from the command line, the same table as `perf.test.mjs`, without failing |
| `tools/replay.mjs <report.json \| save.json> [--inputs file] [--until seq] [--page] [--port 8230]` | new (0.1) | | headless replay (§8.3): checkpoint digests and the first divergence; warns when the report's V8 is not node's; `--page` replays in the system Chrome, the authority (rule 11) |
| `tools/savecat.mjs <save.json \| report.json>` | new (0.1) | | a save's version, schema, mode, honesty marks, the clock in its three faces, size by domain, events by kind and the next 20, log tail, ids by kind, digest |
| `tools/sheet.mjs <variant> <spec.json> <out.png> [--scale 4]` | new (0.0.x) | | a sprite sheet painted in node by the pure painters, written with a tiny PNG encoder over `node:zlib` (`tools/png.mjs`), no dependency |
| `tools/fonts.mjs` | new (0.1) | | copies IBM Plex WOFF2 subsets and their OFL licences from `../longhaul/fonts` into `vendor/fonts/` (read-only source; "a script, never a hand edit") |
| `tools/vendor-three.mjs` | to port when needed | | re-vendors three.js on an upgrade |

Ports follow CLAUDE.md:
- **8223** for browser tests and `tools/perf.mjs` (never both at once);
- **8212** for the gallery;
- **8230 to 8239** for agents' smoke runs.

Every tool kills the server it starts.

---

## 15. Debug mode and overlays

### 15.1 Turning it on

`?debug=1`, or `localStorage['olympus.debug'] = '1'` (both built), or Settings, Debug (§20, question 3). In debug mode:
- **Backquote** (the `²` key top left on AZERTY, read by code) opens the **debug card**. It pauses, as any card does.
- **F9** toggles the perf HUD.
- **F10** toggles the last set of overlays.
- **`[` and `]`** skip 15 minutes and an hour as an `idle` activity (built).

### 15.2 The handle

`window.__olympus` (built) keeps: `state`, `step(n, input)`, `start`, `newGame`, `save`, `load`, `skip`, `pause`, `version`, `loop`, `bus`. It adds:

| Member | What |
|---|---|
| `view` | the stage's `stats` (the last frame's draw calls, triangles, programs, uploads, view ms) and `idle` (nothing pending) |
| `perf` | per-layer tick timings (`core/profile.js`) and frame histograms |
| `events()` | the queue sorted, with clock faces |
| `tiers()` | every person's level (L0 to L4) and where `whereAt` puts them |
| `record()`, `report()`, `replay(report)` | the recorder (§8.3) |
| `bot(name)` | run a bot in the page |
| `goto(timeOrSpot)` | debug only, marks the save (§15.5) |

`window.__report` carries numbers a page publishes about itself (benches, samples). `window.__renderer` is the GL renderer string. `tools/shot.mjs` prints both (built).

### 15.3 URL parameters

| Parameter | What | State |
|---|---|---|
| `?play=<scenario>` | skip the title: `sandbox`; at 0.1 also `standby`, `squadbay`, `range`, `mess`, and the sample scenes | built |
| `?play=test-<id>` | a test scene (ROADMAP §2.2), from the first scene (0.0.6): its own world, marked so, never writing a career, the profile or the memorial | new |
| `?play=moment-<id>` | a moment fixture (ROADMAP §2.3): the career save in `tests/fixtures/moment-<id>.json`, fetched from the served tree (the one fixture the game ever fetches, and only through this parameter), its world marked `moment` | new |
| `?start=<rung>` (alone, or with `?play=standby`) | a new career at that rung (CAREER §22: `newjoin` by default), from the enlistment paper's seeded defaults, skipping the title and the paper; a rung not yet unlocked needs `&debug=1` | new |
| `&drill=1` | "I know the drill" (CAREER §5.6): the arrival was yesterday, start at 05:30 reveille on sol 1. CAREER's `?start=newjoin&drill=1&seed=48213` is valid as written | new |
| `&seed=<n>` | the world's seed | built |
| `&hour=<h>` | the Mars local hour at the start | built |
| `&t=MY211.S590.1240`, `&utc=2351-12-19T02:20Z` | a start time (TIME §19). The examples are SETTING §3.7's start itself (Sol 590 of MY 211, 12:40 Melas time). A time before the start (`START_MS`) is accepted only with `&debug=1`, for samples and shots of another season: no career exists before it | new |
| `&mode=ironman` | the career's mode | built |
| `&debug=1` | debug mode | built |
| `?ppm=16 \| 24` (alias `?density=`) | the density | built |
| `&scene=<id>`, `&mood=<name>`, `&weather=<τ>` | samples and shots (VIEWS §17) | new |
| `&bot=<name>` | a bot plays in the page | new |
| `&bench=<scene \| all>` | the bench card | new |
| `&perf=1` | the perf HUD and GL counters | new |
| `&short=1` | short splashes | new |
| `&slot=<world:name>` | load a slot at once | new |
| `&nostore=1` | no IndexedDB writes (shots, benches, agents' smoke runs) | new |

### 15.4 Overlays

Toggled by digit in the debug card, kept in `olympus.debug.overlays`, drawn as a Canvas2D layer over the stage in stage pixels (never inside the stage's passes, so they cost the game nothing when off):

| # | Overlay | Shows |
|---|---|---|
| 1 | nav | the grid per clearance class (C0, C1, C2), cell costs, blocked cells |
| 2 | paths | live paths, queued requests, the last failures with their reason |
| 3 | perception | cones, the awareness radius, reach, who sees whom (lines), heard sounds |
| 4 | fog | the raw mask cells, seen and felt |
| 5 | walls | line-of-sight walls and their 8 m bins, cover objects with their stop shares |
| 6 | actors | ids, tiers, task, schedule block, intent, bucket |
| 7 | grid | the actor grid's buckets |
| 8 | areas | area and chunk bounds (built, building, dropping), portals, the site graph |
| 9 | air | compartments coloured by pressure, O₂ and CO₂; breaches and vents |
| 10 | light | lamp cells and their indices, `lightLevel` values under the pointer, dynamic slots |
| 11 | parts | the MRT's part-ID attachment and depth, shown in place of the picture |
| 12 | sound | sources and their audible radii |
| 13 | events | the next 20 events with their times in all three faces |
| 14 | rng | draws per stream this sol |
| 15 | perf | the frame-time graph, tick ms by layer, draw calls, uploads, heap |
| 16 | save | the save's size by domain, last save ms, `liveSinceSaveMs` |

### 15.5 Commands, and the honesty marks

The debug card's commands:
- skip by minutes, or go to a time (Melas or UTC);
- set the mood or the weather;
- teleport to a spot;
- spawn a person, or set the crowd's density;
- give an item;
- set a need;
- wound, heal, kill;
- open any screen;
- run a bot;
- reload at the other density.

Every command writes a log line tagged `[debug]` and sets `meta.debugUsed = true` (my call). Debug never opens a god mode: "mistakes cost" (the hub's pillar 7).

**Where the marks show** (my call, correction 22). The three honesty marks, `debugUsed`, `imported` (an Ironman career restored from an export, §7.6) and `recovered` (an Ironman career restored from `ironman-prev`, §7.3), are kept for honesty and for bug triage: in the save's `meta`, on the save record (§7.3), in the load list, on the profile's list of careers, and in `savecat`. They are **never shown in the fiction**: not on the Memorial Wall, not in the service-record papers, not in anything a character can read. The user asked for these tools: test aids (tradecraft: "give us a gun in free walk so i can test these things"), Legends that "should be available even with debug mode off" (tradecraft, 2026-11-03), and JSON export and import "either way" (the kickoff, 2026-11-05) so bugs can be replayed. Branding a career's memorial for using them would punish testing. Question 3 of §20 lets the user choose otherwise.

---

## 16. Performance budgets and how they are measured

### 16.1 Targets

These are measured on the Mac, with Chrome on ANGLE Metal at density B (960 × 540) in a 1600 × 1000 window, unless a row says otherwise.

| Measure | Budget | Measured by |
|---|---|---|
| frame time, median | ≤ 16.7 ms (vsync) in every bench scene | `perf`, the bench card |
| frame time, p95 | ≤ 18 ms (VIEWS §14) | the same |
| frame time, p99 while walking | ≤ 25 ms; no frame over 50 ms after an area's first 3 s | the same |
| under a 4× CPU throttle (the integrated class's CPU, §16.6) | walking scenes (`squadbay-night`, `range-far`, `parade-platoon`) hold a 60 fps median; `mess-noon` and the crowd scenes: median ≤ 25 ms, p95 ≤ 33 ms, which is about 15.6 ms on a CPU 2.5× slower than the Mac's | `perf` |
| under a 6× CPU throttle | walking scenes hold a 60 fps median; no frame over 50 ms (tradecraft's measure) | `perf` |
| sim per lived tick, busiest area | ≤ 2.0 ms mean (the hub); ≤ 4 ms at a minute boundary; **≤ 8 ms mean under the 4× throttle** (the same budget held where the integrated class's CPU is stood in for: a growth faster than the throttle, from garbage collection or cache misses, fails it) | `game-tick` (node), `perf` (Chrome, throttled), `__olympus.perf` |
| GPU per pass, integrated class at 1080p | §16.6's table; the Mac holds its column | `perf`, the bench card |
| view CPU per frame | ≤ 4 ms | `view.stats` |
| UI DOM per frame | ≤ 1 ms (diffed writes; HUD text at most 10 Hz except the prompt on change) | `perf` |
| draw calls | ≤ 160 in the worst bench scene; 600 fails | `view.stats` |
| programs | ≤ 16; 0 linked after the first area's first frame | GL counters |
| uploads mid-play | ≤ 1 MB and ≤ 2 ms a frame; 0 whole-texture uploads except behind a cut | GL counters, `uploads` |
| boot to the title | ≤ 1.5 s | `browser` |
| title to the first playable frame | ≤ 3 s cold, ≤ 1.5 s with the cache | `browser` |
| area change | ≤ 250 ms behind the cut; the new area's first frame ≤ 33 ms | `perf` |
| skips | TIME §5.10 (§5.9 above) | `time-*`, `bots-week` |
| save | ≤ 10 ms to encode, write asynchronous; ≤ 30 ms to load | `save-cost` |
| save size | ≤ 1.5 MB after the standby week; 4 MB fails | `save-size` |
| JS heap | ≤ 300 MB; ≤ 20 MB of growth over a 10-minute soak | `soak` |
| GPU memory (our own count) | ≤ 384 MB at B | `view.stats` |

### 16.2 The sim's budget by domain

The mean per lived tick in `mess-noon` is listed in §3.1. In short:

| Domain | Share |
|---|---|
| PEOPLE (actors, perception, thinking: §3.1's steps 3, 6 and 7, within PEOPLE §13.2's 0.8 ms less its paths) | 0.50 ms |
| paths (PLACES, in work units) | 0.60 ms |
| rules (WEAPONS, COMBAT, inertia, fast environment) | 0.40 ms |
| BODY fast and per-second | 0.20 ms |
| events, input, rehash, offers, the player's walking | 0.13 ms |
| **total** | **1.83 ms**, as §3.1 sums it |

Each owning section's tests print their share. `game-tick` prints the whole and fails over 2 ms, and `perf` prints it under the 4× throttle, where it fails over 8 ms (§16.1).

### 16.3 The frame at 60 fps

The Mac's 16.7 ms frame is spent as:
- sim: 1.2 ticks on average × 2 ms = 2.4 ms;
- view CPU: 4 ms;
- UI: 1 ms;
- GPU (in parallel): at most 3 ms at B, by the per-pass budgets of §16.6 (a third of the integrated class's 9 ms). The earlier figure, "about 6 ms", was an unmeasured estimate for the M5 Pro; on the integrated class it would have been 18 to 24 ms, over the frame;
- slack: 4 ms or more, for the worker's messages, garbage collection and the odd upload.

These are ceilings. The 4× throttle rows of §16.1 hold the real numbers lower where the integrated class needs it: in `mess-noon`, sim, view and UI together must stay near 6 ms on the Mac.

A skip frame is spent the same way, with the sim's share given to `advanceSkip` (4 ms) or to fast-forward ticks (8 ms, when the stage draws only the time-lapse).

### 16.4 Memory (GPU, our own count at B)

| Item | Bytes |
|---|---|
| render targets (960 × 540: HalfFloat colour, RGBA8 IDs, depth, finished picture) | about 10 MB |
| shadow map (2048², depth; 1024² and 4 MB from quality 1, §16.6) | 16 MB |
| palette lookup (64³ RGBA8) | 1 MB |
| fog, strips, the lamp table and grid | under 2 MB |
| tile atlas (one per site, 2048²) | 16 MB |
| area pages (live plus 2 cached areas, at most 2 pages of 2048² each) | at most 96 MB |
| chunk geometry (near ring, 12 chunks × 0.6 MB) | about 8 MB |
| people (2 layers of 4096²) | 128 MB |
| decal atlas (1024²) | 4 MB |
| **total** | **about 280 MB**, budget 384 MB |

When the count would pass the budget, cached areas are freed first, then people bands unseen longest.

### 16.5 How things are measured

- **Frames**: rAF timestamps over a scene's 20 s. The tests print the median, p95, p99 and the count of frames over 25 ms (built: `frameMs(page)`).
- **CPU split**: `performance.now()` around the sim's frame share, `view.frame` and the UI update. With `?perf=1` or in debug, `core/profile.js` times each registered layer and each slow contributor.
- **GPU work**: `EXT_disjoint_timer_query_webgl2` where Chrome exposes it, one query around each pass (shadow, scene, post, far window, blit). Where it is not exposed (the boot probe says so in `__report`), the bench card falls back to **pass repetition**: with the camera still, each pass is drawn 1, 3 and 5 extra times a frame into a throwaway target for 3 s each, and the slope of the median frame time over the extra draws is taken as the pass's cost. The extra draws push the frame past vsync, so the slope is visible even where one draw fits (my call). Never "n/a".
- **GL counters** (`render/stats.js instrumentGL(gl)`, only with `?perf`, `?bench`, debug or in tests):
  - it wraps `texImage2D`, `texSubImage2D`, `texImage3D`, `texSubImage3D`, `texStorage2D`, `texStorage3D`, `bufferData`, `bufferSubData`, `compileShader` and `linkProgram`;
  - it counts calls and bytes per frame, with bytes computed from the dimensions and the format;
  - tradecraft's lesson: "count what goes to the GPU … and treat any big upload or mid-game compile as a Windows hitch" (PIPELINE, 2026-10-29).
- **Draw calls and triangles**: three's `renderer.info` with `autoReset` off across one frame, as the research probe did.
- **Heap**: `performance.memory` in Chrome; forced GC in tests.
- **GPU memory**: our own accounting of every texture and buffer we allocate (`stats.gpuBytes`).

### 16.6 Windows and the integrated class

The user plays on Windows too ("passers-by vanished in the middle of the street", the user on Windows, tradecraft 2026-10-26). Nothing here can run ANGLE over D3D11 automatically, and the default target (§20, question 2) is an integrated GPU of the last four years (Intel Iris Xe or AMD 680M class) at 1080p and density B. That GPU is roughly a quarter to a third of the M5 Pro's, and its laptop CPU about 2 to 2.5 times slower single-threaded (my estimates, from public benchmark scores). So:

**GPU budgets per pass** (my call; the integrated class at 1080p, density B: the stage's 960 × 540 picture blitted to 1920 × 1080):

| Pass | Integrated class | The Mac must hold (a third) |
|---|---|---|
| shadow map (only on a sun step or an area change) | ≤ 2 ms in that frame | ≤ 0.7 ms |
| scene, MRT | ≤ 4 ms | ≤ 1.3 ms |
| post | ≤ 3 ms | ≤ 1.0 ms |
| far window, when open | ≤ 1.5 ms | ≤ 0.5 ms |
| blit to the window | ≤ 0.5 ms | ≤ 0.2 ms |
| **an ordinary frame** | **≤ 7.5 ms** (9 with the far window) | ≤ 2.5 ms (3) |

- **Measured first.** The built stage (`?play=sandbox`, then each bench scene as it lands) is measured per pass on the Mac (§16.5) in the next renderer patch, before more is drawn on it, and the Mac's column is checked against the measure: a pass over its column is cut down before features are added to it. The numbers from Windows come from the bench card.
- **The CPU.** The 4× throttle stands in for the laptop's CPU with margin for Chrome's own work: the throttled rows of §16.1 (a 60 fps median in walking scenes; `mess-noon` at a 25 ms median, about 15.6 ms on the real laptop; the sim at 8 ms a tick) are the CPU's budgets for that class.

**The degrade ladder: what gives way** (my call). If the bench card from Windows comes back under 60 fps, the card's per-pass and per-layer split says whether the GPU or the CPU is short, and the game steps down a `quality` level. Every step keeps the look: the density (`PX_PER_M`), the palette snap, the outline's width, the pools' hard two-ring shape, the fog of awareness and the people drawn never change. Each step is a uniform or a render target's size, never a new program, so nothing recompiles (§9.8):

| Level | Step | What it costs the picture |
|---|---|---|
| 1 | shadow map 2048² → 1024² | a texel grows from 2.2 to 4.4 cm over the 45 m the map covers, about one stage pixel at B (4.2 cm): edges stay pixel-sharp |
| 2 | lamps per fragment 4 → 2 | a 4 m cell lit by three or four lamps keeps its two nearest; pools rarely overlap that much |
| 3 | outline taps 8 → 4 (the cross only) | a diagonal corner can lose one outline pixel |
| 4 | dynamic light slots 10 → 6 | the farthest muzzle flashes and torches light nothing |
| 5 | the far window at half resolution, drawn 2 × 2 | visibly coarser, so it comes last |

- **GPU-short**: the levels in order until the card's frame fits. **CPU-short**: the view's CPU steps first (the fog recomputed on a 0.5 m eye move instead of 0.25 m, sprite tints and the HUD's text at 5 Hz instead of 10), then the same ladder.
- **What never gives way: the sim.** It is the game: its work cannot depend on the machine (rule 5, §8.1), and neither can the crowd's density or the people in an area. If the ladder is not enough, the shortfall is written in the release's CHANGELOG entry, and the cost is cut in the design for every machine (a dated decision), never on one.
- **How the level is chosen.** The bench card proposes a level; Settings can pin one (`olympus.settings`). Otherwise the game watches the first 10 s of each area and steps down at most one level, only behind an area change's cut, with a toast that says so. It never steps down while the world is on screen, so nothing changes under the player's eyes.

The standing rules:
- the bench card (§13.4) is the measure;
- every release that touches the renderer says in its CHANGELOG entry whether the bench card's numbers from Windows are needed;
- the rules that guard Windows are enforced on the Mac: no compiles mid-play, no big uploads, few draw calls, no readback, the Mac's per-pass column, and the throttled rows.

### 16.7 People per scene

One table for every kind of scene, so buffers, the atlas and the LOD rules are sized from one place (my call; correction 20). Everyone live in the view is drawn, live or as a ghost where last seen: nobody pops in or out.

| Scene (bench) | Persistent at L0 and L1 | Puppets | Crowd | Live agents | Drawn, at most (live in view plus ghosts) | Milestone |
|---|---|---|---|---|---|---|
| `squadbay-night` | 14 (the squad, the fire watch) | 0 | 0 | 14 | 14 | 0.1 |
| `range-far` | 48 (the platoon's 42, the range staff 6) | 0 | 0 | 48 | 48 | 0.1 |
| `parade-platoon` | 42 | 0 | 20 (other units passing) | 62 | 62 | 0.1 |
| `mess-noon` (the busiest) | 48 | 12 (the rest of Echo's sitting) | 100 (PEOPLE §12.2's noon peak) | 160 | 180 (with 20 ghosts) | 0.1 |
| `troopship-battle` | 48 | 0 | 40 (the crew on watch, another company) | 88 | 100 | 0.2 |
| `europa-street` | 19 (the squad, a few of the town's notables) | 0 | 120 | 139 | 160 | 0.3 |
| `cavern-riot` (a crowd scene) | 24 (the squad, an MP team) | 0 | 200 (PEOPLE §12.6's largest protest) | 224 | 256 (with 32 ghosts) | 0.3 |
| **caps** | **48** (PEOPLE §13.2); 24 in a crowd scene | **count in the crowd's cap** | **120**; 200 in a crowd scene | **168**; 224 in a crowd scene | **`MAX_PEOPLE` 256**; ghosts at most `GHOSTS_MAX` 32 | |

- **Puppets** are persistent people driven by crowd steering when more are scheduled into an area than its persistent cap allows (PEOPLE §13.1). A puppet takes a crowd slot, so the crowd and its puppets stay within 120.
- **A crowd scene** is an area PEOPLE declares one while a protest or riot is on (PEOPLE §12.6: at most 200). There the crowd's cap rises to 200 and the persistent cap falls to 24 (the rest of the platoon are puppets or held back by their orders), so live agents stay at 224. The crowd outside the close ring looks and thinks every fourth tick (LONGHAUL's lite steps, as TIME §5.2 uses them for fast-forward). `cavern-riot` budgets it in the 0.3 bench at the hub's 2 ms a tick. If the bench fails, the fallback is that the protest's members past 120 wait outside the cavern's doors as an outcome crowd (counted by PEOPLE, not simulated) until a live one leaves (my call).
- **Drawn** counts are what `render/crowd.js` and the people atlas are sized for: `MAX_PEOPLE` 256 instances. PEOPLE §13.2's "figures drawn 80" is replaced by this column, and VIEWS's `MAX_PEOPLE` 160 by 256.

---

## 17. Fun

**What the engine makes possible for the player.**
- **Time spent for real, and cheaply.** Because an 8-hour sleep is 480 minute steps in about 7 ms, every activity can cost its honest time behind its splash, and the player can spend a sol's hours as freely as tradecraft's user wanted ("pass the time things should be natural and time should feel like a currency", 2026-10-27). The splash never stalls the picture.
- **A world that agrees with itself.** Lived and skipped hours give the same body, the same queue of events, the same people where their schedules say. Nobody pops in or out, because chunks are built before they can be seen and people come through doors. The fog and the dice share one function. Players trust what they see, and that trust is what lets the game be lethal (pillar 7) without feeling unfair.
- **Screens that lie as real screens do.** A tactical picture nine seconds old, a report three minutes stale, Jupiter as it was 53 minutes ago: the picture contract makes uncertainty part of the story.
- **Careers that persist.** A world outlives its recruit. The memorial, the people who remember, and the date running on are all one save, so a death is never a reset.
- **Ironman that means it.** One slot, saves at combat and death, honest marks for imports, recoveries and debug, kept on the profile and out of the fiction. A bug that damages the save does not end the career: the hidden `ironman-prev` brings it back, marked.

**Where it could turn into chores, and what removes them.**
- **Waiting on loads**: area changes build behind a scene cut in at most 250 ms, chunks stream ahead, sky maps are cached. There are no loading screens in play.
- **Losing progress**: autosaves after every skip, every area change and every five minutes of live play; `auto-prev` behind them, at least ten game minutes older, and the `day` slot behind that; a digest check on load.
- **Testing being punished**: the debug card and imports leave their marks on the profile and the load list, never on the Memorial Wall (§15.5).
- **A slow machine**: the degrade ladder steps down behind a cut and keeps the look (§16.6).
- **Reporting bugs** (the user's chore): one menu line writes a report that replays exactly, so the user never has to describe how they got there.
- **Testing on Windows** (the user's chore): one card, one button, one paste.
- **Choosing the look** (the user's chore, tradecraft's way): the gallery's ★ picks and "Copy my picks".

---

## 18. Build order

ROADMAP owns the milestone numbers; this is what TECH builds, in order.

**0.0.x, before the first playable** (the engine round continues, with VIEWS's look round):
1. `src/sim/game.js` with the domain registry (§2.5), the named fast layers of §3.1 (stubs where a domain is not built yet), `registerSlow`, and the actions table.
2. **The contract patch**: `core/ids.js` with the id table and its validators, `put`, `drop` and the cached `ids` (§2.3.1, §2.3.2), `core/num.js`, `core/queue.js`, `sim/jobs.js`, `core/facts.js`, and the extended syntax rules (§2.2, §2.7). The owners rewrite their sections' samples to the id table in the same patch (correction 16).
3. The state's domains of §6.1. Rename `sites` to `places`; add `events`, `skip`, `time`, `actors`, `units`, `happenings`, `mind`, `talk`, `names`, `fights`, `stop`, `items`, `armoury`, `career`, `careers`, `memorial`, `meta.next`, `clock.seq`; `game-domains`.
4. The sliced skip engines (`time/skip.js`) on the kinds' grids (§5.3), and the loop's four modes. `skipNow` keeps the five `core-loop` skip tests passing; `game-targets` is added with them.
5. Store v2: worlds in slots, `profile` and `cache` stores, `auto-prev` and `ironman-prev` rotated on time, the `day` and `edge` slots, digests and recovery, the report export with its engine.
6. `tests/game.mjs`, the determinism suite of §8.2 in its quick and heavy variants (with a dummy domain where real ones are missing), `game-ids`, and `golden.mjs`; the runner's quick total and its 60 s limit.
7. For the look round: the sprite and crowd ports with the array atlas (`MAX_PEOPLE` 256), `tools/gallery.mjs` and `samples/` (four variants × five scenes, VIEWS §2.3), `tools/sheet.mjs`, `?scene=` and `?mood=`.
8. The paint worker with the `sheet` and `area` jobs; `render/uploads.js`, `warm.js`, `stats.js` with per-pass GPU timing (or pass repetition); `__ready` with nothing pending. **The built stage is measured per pass on the Mac** against §16.6's column, and the bench card's per-pass split is ready for Windows.
9. From 0.0.4: `tests/bots/lib.mjs`, the bot toolkit (§13.2), with `walker` as its first user. **Before 0.0.6**: the kit and items shape of §6.7 (WEAPONS's), so the range, the lane and the Tank build on it.

**0.1, a standby week at Base Melas:**
- `render/view.js`;
- chunks streamed (the parade deck, the range, the company street);
- decals;
- the tiled lamp pools;
- the far window;
- the splash crop;
- `fogcast.js`;
- the instrument kit, the wall terminal and the range tower display;
- the sky module with the pixel finish (Phobos and Deimos maps in the worker and cache);
- the ephemeris, constants and the factions, hull and name data, and `world/news.js` answering from SETTING §7.7's authored timeline (`src/data/setting/timeline.js`), so the wall terminal's news is SETTING's 2351 (§5.8; correction 23);
- the presenter and the audio skeleton (VIEWS);
- the debug card and overlays 1 to 16;
- the recruit, range, walker, slob and idler bots, on the toolkit;
- `bots-week`, `save-size`, `save-cost`, `game-tick`, the throttled `perf` rows;
- the perf scenes `squadbay-night`, `parade-platoon`, `range-far` and `mess-noon`, with the bench card and the degrade ladder (§16.6);
- `tools/replay.mjs` (with `--page`), `savecat.mjs`, `perf.mjs` and `fonts.mjs`;
- the first fixture save for the upgrade tests (the 0.1 edge save, ROADMAP §2.6).

**0.2, the voyage:**
- the world layer, whole (§12.4: gravity, rails, the spatial hash, traffic, politics, conflict, forces and intel together, `worlds.js`'s physics half), with every world job at TIME's slots, and the voyage plan;
- the prologue (§5.8), and `upgradeState` rolling an 0.1 save's world from its seed to its clock; `world-prologue`, `world-year`, `world-upgrade`;
- incremental serialisation by domain (§6.6), before 0.3's 3 MB;
- the world's save budget test;
- decks as areas with the ladder dissolve;
- the system, local, threat and planetary screens on pictures;
- `troopship-battle` in the bench;
- the 12-day chapter's compute test.

**0.3, Europa:** drop-ship profiles, optics and the scope screen, the ground tac and the suit HUD's tac, the Europa sky maps, `europa-street` and `cavern-riot` (the crowd scene of §16.7) in the bench, and the vacuum audio path.

**Later:** ship combat (the ordnance, damage and agents ports, with driven hulls in the slow step), boarding with target hulls generated as sites, CQC, special-operations sites, and the world's outcome oracle in a worker only if §11.1's budget is ever passed.

---

## 19. Cross-references

What TECH relies on from the other sections:

- **SETTING**: the start instant (§3.7 of SETTING: 2351-12-19 02:20 UTC, Sol 590 of MY 211 at 12:40 Melas time, `START_MS` 23,480,400,000) for `newGame` and the URL examples of §15.3; the prologue's constraints and the injected Europa timeline (SETTING §2.3, run by §5.8 here from 0.2); §7.7's authored timeline as a data module, `src/data/setting/timeline.js`, the news archive at 0.1; the order of battle for unit paths (§2.3.1); the week's definition, for `week@` jobs; name pools and every other table, in `src/data/setting/` (correction 11); the AP transports as non-combat hulls.
- **TIME**:
  - the `skip()` contract (§5 of TIME): the activities table (`src/data/activities.js`), masks and priorities, `finishSkip`'s order, the splash curve that sets `skipTarget`;
  - the step grid by kind (§5.3, correction 19), with a new kind `world` beside `ff`, `outcome`, `day` and `out` in TIME §5.3: TIME §5.4's step rule, §5.7's event-driven shortcut (now `world` skips only) and §5.10's "about 40 steps" for a sleep (now 480 minute steps in about 7 ms) to be aligned;
  - the recurring slots;
  - the voyage plan's maths (`world/voyage.js` implements TIME §12);
  - autosave triggers, and the `day` slot after 00:00;
  - `chapter` and `voyage` under `state.time` (TIME §13: correction 18);
  - the player as an ordinary `p` id and units as `2/4-E-2-1` in §5.3 and §9.1's samples (correction 16);
  - `?t=` and `?utc=` examples on the start date (§15.3), and TIME §14 rule 8 refined by rule 11 (correction 24);
  - TIME should adopt corrections 1, 9, 10, 16, 18, 19 and 24.
- **BODY**: `bodyAdvance` and `nextCrossings` as closed forms that compose exactly; the contributor's `steady` (doing no work while steady) and `nextChangeMs`; the fast and per-second cadences split as in §3.1 and §3.3; `capacity()` for poses (`SIM_FOR_VIEW`); the body saved as deltas from a template (§6.6); exponentials rounded by `q()` before they are written back, with their resolutions (rule 11); the suit at `p.kit.worn.suit` (§2.5 of BODY), its record and its cartridge in `items` (correction 17).
- **SKILLS**: `check()` drawing only from named streams; the roll record for the log (§6.5) and `rollText(roll)`, so a roll's text is rendered, not stored; the instinct's `settle()` on whole seconds; the player's id in place of `"by": "me"` (correction 16).
- **WEAPONS**: the module list of `src/sim/arms/` (WEAPONS §15); **the owner of `items`, `person.kit` and `arms/kit.js`** (§6.7, correction 17), settled before 0.0.6: the slots, the containers and their capacities, `materialise`, `move`; guns as items (`i<n>`) in place of `r7#p.3` (WEAPONS §4.1), and the `armoury` records by gun id; the issue log capped (§6.6); the `stop` key's contents; ballistic tables as a memo at boot (at or under 150 ms), their results rounded by `q()` (rule 11); the rng streams `shot`, `frag`, `fuse`, `throw` and `hole`; brass as particles (`BRASS_LIVE` 64) and tile counts; `fx` and `sound` facts for shots.
- **COMBAT**: `state.fights`; its module list (COMBAT §18, with drills as `.js`: correction 12); the order inside `rules` (§3.1, step 8); `threatKnown(state)`; `pictures.js` for every sensor source; the director's encounters as events; the ship layer one minute ahead as slow contributor 4; the zone and force data for `world`; the ids of §2.3.1 in §2.1's and §6's samples (`fg`, `od`, `uf`, `ob`, `sv`; people as `p<n>`, units as `2/4-E-2-1`); the `crowd` test's 200 civilians as §16.7's crowd scene.
- **PEOPLE**:
  - `whereAt` and `whereIs` in closed form, and the L0 to L4 levels;
  - **`state.happenings`** for PEOPLE §2.5's log of notable things, ids `n<n>`, with `known` kept by group and per-person exceptions (§6.6), in §2.5, §9 and §13.2 (corrections 15 and 16);
  - `units` at the top level as PEOPLE §2.6 has it, and the person record's `kit` (WEAPONS's) beside `body` and `skills` (§6.1);
  - the ids of §2.3.1 in every sample (`p:0042` is `p42`; the player is their own `p` id; a promoted crowd member is a `p` id, not `x<seed>`; `fx:mess:t14:s3` is `f:mess:t14#3`; `subject` is `subjectId`);
  - stubs that expire when no happening of weight 2 or more names them (§6.6);
  - the per-scene table of §16.7, replacing §13.2's "figures drawn 80"; the crowd scene's caps; puppets in the crowd's cap;
  - the `names` registry;
  - the per-domain budgets of §16.2 (PEOPLE §13.2);
  - perception's formulas, shared with `fogcast.js`, reading `lightLevel` (correction 14);
  - the crowd as `{ seed, plan }` until promoted;
  - the bots' world.
- **PLACES**:
  - `state.places` (correction 2) and its module list (PLACES §14, correction 13);
  - `src/sim/places/light.js` with `lightLevel` in §3.9 (correction 14);
  - the site's lying list as item ids and positions, the records in `items`; fixture state `holds` for racks and lockers (§6.7);
  - the player's own `p` id in fixture samples (`assigned`), and `unit:2/4-E-2` for access (§2.3.1);
  - the live area's zones at 1 Hz in the per-second layer, the rest of the site in `slowStep`, all of them in a skip (§3.3, §3.4);
  - the nav grid and A* in work units (correction 7);
  - pure, lazily forced chunk generation;
  - `envStep` with `steady` and `nextChangeMs`; gas and pressure decays rounded by `q()` (rule 11);
  - the site's tile kinds, for the tile atlas painted at load;
  - the lamp list per area, for the tiled pools.
- **CAREER**: the profile's shape (stored in `profile`), `continueWorld`, the memorial in the world save; the honesty marks (`debugUsed`, `imported`, `recovered`) on the profile and the load list, **not** on the memorial or the papers (§15.5, correction 22: CAREER §23 to align); nine manual slots in CAREER §23 (correction 21); `career.edge` and the `edge` autosave (§7.4); `?start=<rung>` and `&drill=1` (§15.3); family members as `fm<n>`; §5.7's crisis check through `world/news.js` (§5.8).
- **VIEWS**:
  - the frame's passes (§9.1 implements VIEWS §2.5 with corrections 4 and 5);
  - `lightLevel` in `src/sim/places/light.js` (correction 14);
  - `MAX_PEOPLE` 256 and the drawn counts of §16.7 (correction 20);
  - the atlas bands;
  - the splash's look and its target curve;
  - the screens' content;
  - the audio presenter's sounds;
  - the bench scenes' content;
  - the degrade ladder's steps, judged to keep the look (§16.6);
  - VIEWS should adopt corrections 3 to 6, 14 and 20.
- **ROADMAP**: milestone numbers and acceptance moments for §18's order; the `test-<id>` and `moment-<id>` scenarios and the `edge` slot it asked for (§15.3, §7.2); the world core moved from 0.0.12 to 0.2 in §4.3 and §15.5, the 0.0.4 row's `src/sim/places/light.js`, and §15.2's save budgets (1.5 MB at 0.1, 2 MB at 0.2's edge) as §6.6 derives them (corrections 14 and 23); `cavern-riot` adopted as §16.7's crowd scene.

---

## 20. Open questions for the user

1. **Which browsers?** OLYMPUS is built and tested in Chrome (the user's browser on the Mac and on Windows). Edge shares the engine. Should Firefox and Safari be supported too? *Default: Chrome-family only, others best effort and untested.* Supporting them would add test runs, and some float results could differ (§8.1, rule 11).
2. **Your Windows machine.** What GPU does it have, and will you run the bench card from it after renderer changes and paste the numbers back? *Default: yes to the card, and budgets set so that an integrated GPU of the last four years (Intel Iris Xe or AMD 680M class) holds 60 fps at density B at 1080p: §16.6's per-pass budgets, the 4× CPU throttle as its CPU, and the degrade ladder if it falls short.*
3. **Debug in your play copy.** Should Settings offer Debug (overlays, the bench, commands) in the copy you play, with any command marking that career's save `debugUsed`? *Default: offered, and marked on the profile and the load list only, never on the Memorial Wall or the papers (§15.5).* Should the mark show in the fiction after all?
4. **Old saves before 1.0.** Tradecraft's rule was "kept only where it comes naturally" (2026-10-26). Does it carry over, so that a change no upgrade can make refuses older careers, while your profile, unlocks and memorial are always kept? *Default: carried over.*
5. **A hosted copy.** The repo is public. Should a release also be playable from GitHub Pages, beside `./play.sh`? *Default: local only.* Nothing in the design prevents hosting: relative paths, no special headers (§11.3), saves per origin.
