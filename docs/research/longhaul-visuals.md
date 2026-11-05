# LONGHAUL: visuals, UI and architecture (research note for OLYMPUS)

Slice: how LONGHAUL draws its telescope (planets, moons, the Sun, stars), its system map and its ship tactical displays; its UI shell (window manager, panels, docks, bus and presenter); fonts, palette, the tick loop and time warp, saves and performance tricks; and what OLYMPUS should port. Written 2026-11-05 from LONGHAUL v1.12.21 (branch `overhaul`, last commit 2026-10-31/11-01), read-only, with 67 screenshots taken in headless Chrome at 1600×1000 (prefix `longhaul-`, in `docs/research/shots/`).

All paths below are relative to `/Users/deaumas/lab/vibe/claudecode/longhaul/` unless absolute. Line numbers are from v1.12.21.

---

## 0. The short version for OLYMPUS builders

1. **The planetary/telescope renderer is the most portable thing LONGHAUL has.** `js/ui/scope-sky.js` (568 lines) has no game dependencies except the ephemeris body list. It makes every world's surface in code from a seed (27 bodies: giants' bands and storms, Earth's continents/clouds/city lights, Mars, Io's volcanoes, Europa's lineae, cratered rocks, irregular small moons), ray-casts it pixel by pixel as a lit sphere at its true phase and rotation, draws Saturn's rings, the Sun through a solar filter (limb darkening, granulation, sunspots) and a deterministic hashed starfield. Port it nearly as-is, but raise its surface-map resolution (512×256 is blotchy and stair-stepped once a world fills the screen; see the Mars-from-Phobos shots) and give it a pixel-art finish if OLYMPUS wants its sky to match its sprites.
2. **The optics maths is pure and correct**: `js/sim/telescope.js` (diffraction limit, magnitudes from albedo/area/phase/distance, drive plumes as point sources, flashes, field and digital zoom). Reuse the formulas.
3. **The ship-display grammar is the look the user asked for.** The solar map (`solar-map.js`), local space (`tac.js`), scanner (`scanner.js`) and threat board (`combat.js` ThreatView) are Canvas2D, hairline, dark-adapted, avionics-coloured, with a name-placement pass (`labels.js`) that never prints one name over another. The code is tightly coupled to LONGHAUL's sim (intel, sensors, flags, factions), so port the *grammar and helpers* (palette, line weights, dash patterns, `Labels`, `marks.js`, `FitCanvas`, scale bars, eased pointer-anchored zoom) and rewrite the data adapters.
4. **Architecture to keep**: pure sim / UI split, a `bus` of facts with one `presenter` deciding how each is shown, plain-data state with `$`-prefixed runtime keys stripped on save, IndexedDB saves with a schema number, seeded RNG, units in constant names, prose headers on every module. **Architecture to change**: LONGHAUL's atomic step is one game *minute*, and its "1×" is 60× real time. A foot soldier needs sub-second ticks at true 1:1, and Mars sols.
5. **Skip the WebGL2 3D** (`js/ui/gl/*`, `exterior.js`, `hullcam.js`, `shuttlecam.js`, `figures.js`) for core gameplay. It is lit 3D solids, rigged CC0 bodies and filmic bloom, not top-down pixel art. Mine it as reference: room lighting states, crew postures under G, Mars-dome/Europa-rig town styles for a drop-ship descent.

---

## 1. The user's tastes and decisions that bear on this slice

From the OLYMPUS brief (the user, given to this research on 2026-11-05):
- "Mostly top-down at different scales (longhaul's telescope views of planets and stars, and how ship tactical maps are drawn: something like that when looking at a tactical screen on a ship)." The user explicitly wants LONGHAUL's telescope and tactical-map look carried into OLYMPUS's in-world ship screens.
- "High-resolution pixel art for close-up gameplay." So OLYMPUS will mix two registers: pixel-art world, and crisp instrument displays inside it.
- "The main moving around and UI should look something like ../tradecraft (artistic direction and controls; not necessarily the same tech)." LONGHAUL's console UI (section 6) is therefore **not** the target look for OLYMPUS's main UI. It is the look for diegetic ship consoles.
- "Realism in physics, air, gravity, space being big and travel taking a long time." LONGHAUL's telescope is built on exactly that (light lag, diffraction, magnitude limits, a far ship as a point or nothing).
- "Perform as well as possible; as much background generation as possible done without rendering actual graphics, yet immersive." LONGHAUL's LOD calendar and "outcomes, not simulation" rules (section 2.5) are the precedent.
- "Only refactor the tech from there if it's the best way."
- "Build from the ground up with functional test versions and a promotion script to test the latest stable version (like tradecraft)."
- "Full days (Mars sols, not 24h) moving in real time until we do things that spend time like eating (a splash screen illustrating the action and a time fast-forward)."

From LONGHAUL's `CLAUDE.md` (the user's working conventions for LONGHAUL, current at v1.12.21; they show how the user likes a codebase run):
- "Vanilla ES modules, no build step, no runtime dependencies, IndexedDB saves."
- "The sim is pure. `js/sim/` never touches the DOM. It reports facts through the `emit` it is given (the bus); `js/ui/presenter.js` decides how they are shown."
- "State is plain data. Keys starting with `$` are runtime-only and stripped from saves. A save from another `SAVE_SCHEMA` is refused (no migrations). Prefer additive changes that `upgradeState` can fill in on load, so players keep their games."
- "Randomness only through `core/rng.js`, so tests can seed it."
- "Units ... Constants carry their unit in the name (`standoffM`, `launchAU`, `rangeM`). A wrong unit once made pirates charge to 800 km instead of 800,000 km, so check them."
- "Every module opens with a header block explaining the model in prose. Comments explain *why*."
- "Keep `README.md`, `docs/*.md` and the module headers in step with the code."
- Versioning: "Every round of changes bumps `js/version.js` ... committed as `vX.Y.Z: short summary`." "Only when the user declares a release candidate and validates it does the minor move ... Never bump the minor on your own."
- "The user often plays from the working copy while asking for changes. Then build and test in a scratch copy and apply the patch only when they say go."
- "Kill any server you start for a smoke test."
- Serve with `Cache-Control: no-store` and a deep listen queue (`play.sh`): "A plain caching server lets Chrome mix old and new modules after an update, and the game then fails to load with 'does not provide an export named …'."

Visual direction LONGHAUL's history records (project decisions; the commits do not quote the user on them):
- v0.1.0 (2026-03-22): "game platform with 8-bit pixel art ship interface". The original design system (`css/main.css` header): "8-bit retro-futuristic. CRT glow meets pixel precision", Press Start 2P / Chakra Petch / Share Tech Mono, teal `#4FD1C5` and amber `#E2A355`.
- v0.18.0 (2026-10-22), "the flight console — a new UI": "New type (IBM Plex), pixel pointers, the console's own tooltips, no fake scan lines." `css/console.css` header: "A working ship's displays in 2351: dark-adapted, calm, dense. Hairline frames, labels and units, numbers that line up, and colour that means something (avionics convention) ... Nothing decorative: no scan lines, no glow for its own sake, no grain. The pixel face survives only in the pointers and a few tiny identifiers."
- v0.19.0 (2026-10-22): nothing floats over a display; names never overlap ("left off rather than printed over another").
- v0.21.0 (2026-10-22): pixel pointers sized to whole device pixels, ≤32 px.
- v0.25.0 (2026-10-23): "the telescope rebuilt — worlds and the Sun, plume filters, a mount that slews and holds, a fight as it would look".
- v1.4.0 / v1.5.0 (2026-10-25): telescope zoom steps; worlds' planetary space drawn on the map.
- v1.10.0 (2026-10-25): "the map over a world's disc: names haloed, a big disc drawn as a dark tint of its colour with its limb".

So LONGHAUL went from pixel art to a sober instrument look for its displays, and kept pixel art only in pointers. OLYMPUS goes back to pixel art for the world, with instrument displays as the user's stated reference for ship screens.

---

## 2. Architecture

### 2.1 Layers (docs/ARCHITECTURE.md lines 3–11)

| Folder | Contents | Rule |
|---|---|---|
| `js/core/` | `clock.js` (integer game minutes), `rng.js` (seeded mulberry32), `events.js` (bus), `constants.js` | no game knowledge |
| `js/sim/` | 75 modules, the whole simulation | pure: never touches the DOM; reports facts on the bus |
| `js/ui/` | 51 modules + `gl/` (9) | reads sim state, calls sim functions, listens to the bus |

`js/main.js` (7 lines) boots `js/ui/app.js` `boot()`, which creates or loads a game and runs a `GameLoop` (`sim/game.js` line 529) from `requestAnimationFrame`. Around 31k lines of UI and CSS (`wc` over `js/ui`, `css`, `index.html`); `css/main.css` alone is 4,161 lines (much of it overridden).

### 2.2 State, runtime keys, saves

- One plain serializable object. `$`-prefixed keys are runtime caches (dozens in use, e.g. `$via`, `$seen`, `$px/$py/$pd` (memoized body positions), `$inertia`, `$jinkG`, `$combatWarp`, `$inBay`, `$plans`, `$channel`).
- `js/sim/save.js`: `serialize` = `JSON.stringify(state, replacer)`; the replacer drops any key starting with `$` and encodes `±Infinity` as `'__inf__'` / `'__-inf__'`; `deserialize` checks `data.schema === SAVE_SCHEMA` (7, `sim/game.js` line 66), calls `resetWorld` and `upgradeState`, and otherwise throws "This save is from an older version … start a new game".
- `js/storage.js`: IndexedDB `longhaul_db` version 1. Store `saves` (keyPath `id`, indexes `timestamp`, `name`), records `{ id, name, timestamp, version, meta, data }` where `data` is the JSON string. Store `settings` (keyPath `key`, `{ key, value }`). `listSaves` returns all without payloads, newest first.
- `js/ui/persistence.js`: `saveCurrent(name, id)` with `meta: { ship, date, where, credits }`; autosave `setInterval` every `ui.settings.autosaveMinutes` real minutes (default 5; options 0/1/5/10), id `'autosave'`; quicksave Ctrl+S id `'quicksave'`; also on `visibilitychange` (hidden) and `beforeunload`. A `saving` flag prevents overlap.
- Window/panel layout is a per-viewer convenience in `localStorage['lh.layout.v1']` (wm.js line 28), wrapped in try/catch so private windows fall back to defaults.
- Scale facts (ARCHITECTURE.md line 91): a default game's save is about 2.5 MB; 3.9 MB after 50 game years; a 200k-entity save is about 150 MB, written in about half a second.

### 2.3 The tick loop and time warp

- **Clock** (`core/clock.js`): one integer, `state.clock.minute`, minutes since `start = 2351-03-22 08:00 UTC`. Calendar values are derived with `Date.UTC` and never stored. `formatDuration` rounds to the unit shown first ("59.6 min is 1h, not 0h 60m").
- **Speeds** (`core/constants.js`): `SPEED_MIN_PER_SEC = [0, 1, 60, 1440]`, game minutes per real second, labelled on the rail as pause, `1×`, `60×`, `1440×` (keys Space, 1, 2, 3). **LONGHAUL's 1× is one game minute per real second, i.e. 60× true time.**
- **`GameLoop.frame(dt)`** (`sim/game.js` lines 567–627):
  - `dt` capped at 0.25 s.
  - If an inertial event is running (crew thrown about by a flip), it plays in real seconds (`updateInertia(s, dt)`) and the minute clock waits.
  - Docking at 1×: the minute is flown in game seconds at `PROX_RATES = [1, 5, 20, 60]` s/s (`sim/docking.js` line 102), `frameStep(s, 1)` per second, `minuteTick` every 60.
  - Otherwise `acc += dt × SPEED_MIN_PER_SEC[speed]`; `while (acc >= 1 && steps < 3000) minuteTick(s, { lite: speed >= 3 && acc >= 1 })`. So at 1440× every minute but the last of a frame is a **lite** minute (skips `world.tick` near-refresh, sensors, comms; `forcesTick` lite). Excess beyond 3000 minutes a frame is dropped.
  - After stepping, `world.background(minute, backgroundBudget(count, steps))`: the far world's calendar, `min(1000, ceil(count × minutes / 1440) + 1)` entities a frame.
  - `alpha` = fraction of the next minute owed (or seconds flown / 60 when docking), handed to every renderer for interpolation (`tac.js` keeps last and current relative positions and lerps; `exterior.js` predicts entities to `minute + alpha`).
  - `maxSpeed(state)` (`sim/autopilot.js` line 661) caps warp: battle stations, manual throttle, flips, the first five minutes of a burn, unmanned helm → 1×; docking → 2; `$combatWarp` from combat. If speed exceeds the cap mid-frame it is lowered at once and `speed-limited` is emitted.
- **`minuteTick`** order (ARCHITECTURE.md lines 46–64): gravity epoch, machinery limits and autopilot command, our ship flies, clock+1 and near-world refresh, NPC ships fly last minute's commands, station-keeping, ordnance and terrain, then people (G-loads, physiology, needs, careers), plant (fire, life support, reactor), sensors/comms/traffic control, and the wider world (combat decisions, law, politics, market, traffic, intel). "All ships move before any torpedo is resolved, and every decision made in step 10 is flown in the next minute."

### 2.4 Event bus and presenter

- `core/events.js` (39 lines): `EventBus` with `on` (returns an unsubscribe), `off`, `emit` (copies the handler list; also calls `'*'` handlers with `(type, payload)`), `clear`. One shared `bus`.
- The sim never imports the bus directly in hot code; it is handed `emit` (`(t, p) => bus.emit(t, p)`).
- `js/ui/presenter.js` (328 lines, about 150 handlers in one `HANDLERS` table) is "the only place that decides how a fact is shown": a log line (`logEntry(text, kind)`), a toast (`toast(text, 'ok'|'warn'|'danger'|'nav'|'info')`), a dialog, a body class (`inertia-active`). Example: `'crew-died': ({ member, cause }) => { logEntry(...,'danger'); toast(`${member.name} has died`, 'danger'); }`.
- `js/ui/fx.js` (48 lines): a short real-time list of positioned combat effects (`detonation 2600 ms, intercept 900, hit 1600, pdc 700, strafe 700`), max 200, each stamped with the sim minute its position is for (`m`), so close views carry it to their own moment.
- `js/ui/toast.js`: the latest two messages (4.5 s each, duplicates within 1.5 s dropped) live in the flight band, never over a display.
- `js/ui/context.js`: the shared `ui` object (`state`, `loop`, `alpha`, `screen`, `settings`, `selection`, `nav`). Sim state never lives there.

### 2.5 Level of detail and performance tricks

From ARCHITECTURE.md and the code:
- Target 200k+ entities; "No per-minute work over all entities". Spatial hash (`world.query`), small indexed sets (`world.stations`, `world.driven`, `world.forces`, `world.beacons`).
- `HORIZON_AU = 0.105`: entities nearer refresh every minute; the far world keeps a calendar of when each has business and refreshes its position only before it could come within the horizon. Traffic "never thinks" until something near the player needs it to act (then it becomes an agent). Far conflict is "outcomes, not simulations".
- Budgets measured: about 6 ms per game minute at 200k with 25k in sensor range; 55–60 fps at 1 day/s docked at Ceres at 200k; about 42 fps on the map.
- `bodyPos` memoizes the last answer per body (`$pd`, `$px`, `$py`): a minute asks where Mars is thousands of times.
- UI side:
  - Only the visible display renders (`updateNav` switches on the tab; `stage.js` "a camera draws only while it can be seen").
  - DOM writes are diffed: `setText`/`setHTML` (`dom.js`) keep the last value in a WeakMap and skip identical writes.
  - Slow panels on timers: camera bar 250 ms, selection 400 ms, fire-control panel 250 ms; small room-camera feeds at a quarter of the frame rate.
  - `FitCanvas` (`dom.js` line 111) resizes its backing store only when the container size or DPR changes; DPR clamped to 2.
  - `SkyPainter` caches each world's last raster keyed by view size, phase in degrees, sun side and rotation in 1/720 turns, so a disc costs nothing until it turns half a degree.
  - Surfaces are generated lazily once per world and memoized.
  - `scope-fx.js` draws glows from cached 64×64 radial sprites ("far cheaper than a gradient each time").
  - The solar map falls back to a point cloud for more than 1,500 plot reports: it writes pixels straight into a `Uint32Array` over an `ImageData` (ABGR `0x806A7A8A`), still clickable.
  - `Labels` places names through a 48 px grid of placed boxes, so thousands of marks and hundreds of names stay under a millisecond.
  - The route ETA flies the route forward in 3 ms slices per frame (`ETA_SLICE_MS`, 150 minutes between clock checks).
  - One shared WebGL2 canvas for every 3D view (`gl/gl.js`): it only grows (max 4096 px a side), each render uses its lower-left corner and is copied out at once.
  - Room cameras render the static room once per deck, size and lighting state into offscreen layers, one per tile row, so people can be drawn between rows and hidden by nearer furniture.

---

## 3. The telescope

Files: `js/sim/telescope.js` (280, pure optics), `js/ui/telescope.js` (886, the picture), `js/ui/scope-sky.js` (568, worlds, Sun, stars), `js/ui/scope-fx.js` (689, combat effects), driven by `js/ui/stage.js` (the EXTERIOR display's TELESCOPE feed). All drawing is Canvas2D, except that a resolved hull or station is rendered on the GPU (`gl/ships3d.js` `renderScene` with an orthographic camera) and copied in. Nothing is loaded from the network.

### 3.1 Optics model (js/sim/telescope.js)

Constants (lines 65–103):

| Constant | Value | Meaning |
|---|---|---|
| `WAVELENGTH_M` | 550e-9 | |
| `SCOPES` by TL | TL1 0.3 m / lock 400,000 km; TL2 0.5 m / 1,000,000 km; TL3 0.8 m / 1,500,000 km; TL4 1.2 m / 2,000,000 km | mirror diameter, lock range |
| `JITTER_RAD` | 0.4e-6 | mount shake, quiet ship |
| `BURN_JITTER_RAD` | 2e-6 per G | our own thrust |
| `MAG_LIMIT` | 16 | video frame, 0.5 m mirror |
| `HULL_ALBEDO` | 0.15 | × tech stealth factor |
| `PLUME_W_PER_N` | 500 W/N | visible light of a fusion torch per newton |
| `FLASH_W` | nuclear 1e15, fusion 3e15, he 3e11, kinetic 2e10, intercept 1e10 W | |
| `AFT_BLIND` | 0.26 rad (15°) | blinded by our own plume looking aft |
| `NATIVE_FIELD` | 512 elements | narrowest optical field |
| `WIDE_FIELD_RAD` | 0.6 rad (34°) | widest field |
| `SENSOR_ELEMENTS` | 1024 | pixels across the field when zoomed out |
| `FILTERS` | off {plume 0, hull 0, flash 0, own 1}; plume {5, 0.5, 3, 0.45}; deep {9, 1.2, 7, 0.2} | magnitudes removed |
| `SUN_GLARE_RAD` | 0.17 rad (10°) | scattered sunlight washes the frame |
| `GEOM_ALBEDO` | per world: Mars 0.17, Jupiter 0.54, Europa 0.67, Enceladus 1.38, Ceres 0.09… | |
| `SUN_MAG` | −26.74 at 1 AU; `SOLAR_FLUX` 1361 W/m² | |

Formulas:
- `scopeOf(state)` (line 106): `diff = 1.22 λ / D`; `jitter = (JITTER + g × BURN_JITTER) / perf`; `resRad = hypot(diff, jitter)` (TL2: 1.34 µrad diffraction, i.e. 13 m at 10,000 km); `magLimit = 16 + 5 log10(D/0.5) + 2.5 log10(perf)`; `lockM = lockKm × 1000 × perf`; `working = !blackout`.
- `lambert(α) = (sin α + (π − α) cos α) / π` (Lambert sphere phase function).
- `reflectMag(A, albedo, sunAU, d, α) = −26.74 − 2.5 log10( albedo · A · lambert(α) / (π d² sunAU²) )`.
- `pointMag(W, d) = −26.74 − 2.5 log10( W / (4π d²) / 1361 )`; `flashMag(kind, d) = pointMag(FLASH_W[kind], d)`.
- `sightOf(state, e, …)` (line 168): line of sight, `sinA = |sin(facing − bearing)|`, `foreshorten = max(sinA, W/L)`, angular size `L·foreshorten/d`, projected area, phase at the target (angle between Sun and us), `hullMag`, `plumeMag` (thrust in N × 500 W), `elements = angRad / resRad`, and a **regime**: `resolved` (≥6 elements), `blob` (seen, ≥1.5), `point` (seen), `plume` (only the drive is above the limit), `none`; a point or blob whose plume is 5 magnitudes brighter becomes `plume`. Also `sunRight`, `noseRight`, `away` (cosine: nose away from us means its exhaust points at us).
- `cameraRes(sc, field) = max(resRad, field / 1024)`: zoomed out, the sensor's pixels limit resolution.
- `ownPlume(state, bearing, filter)`: within 15° of our own lit exhaust; unfiltered blind, filtered `wash`, `blur = 1 + 3·thick·own + 1.5·thick`, where `thick = min(1, 0.55 + 0.25 g)`.
- `bodySight(body, tm, from)` (line 237): world position at the moment its light left (`lagS = d / c`), `radRad = asin(R/d)`, phase, `mag` (Sun: −26.74 + 5 log10(d/AU)).
- `bodiesInField(tm, from, bearing, field)`: every body within `field × 0.75 + radRad`, sorted farthest first. `occulter(...)`: a nearer body covering the line of sight.
- **The sim is two-dimensional.** Positions are (x, y) in AU in one plane; bodies are on circular coplanar orbits (`sim/ephemeris.js`; the body sheet quotes eccentricity and inclination, but the motion ignores them). In the telescope, the plane is the horizon: every world sits on the frame's horizontal centre line, and only stars (hashed elevation) and contacts (a hashed off-plane offset, `Z_SPREAD = 0.2` × min(distance to target, 20 km)) leave it.

### 3.2 The picture pipeline (js/ui/telescope.js `ScopeView.render`, lines 178–449)

Per frame, on a `FitCanvas` (`.scope-canvas`):
1. **Target**: `{ kind: 'entity' | 'body', id }`. For an entity, `lockOn` → predicted position at `tm − lightTime` (`predictEntity`) and `sightOf`. A target lost or blown apart: the mount keeps tracking where it was going on its last velocity for `LINGER_MS = 13000` (its fireball's life).
2. **Mount**: a new target triggers a slew, `dur = clamp(0.35 + |Δ| / 1.4, 0.35, 1.6)` s, smoothstep-eased; stars streak by the angle moved × px/rad.
3. **Field**: zoom levels (`zoomLevels`, line 98) = `WIDE_FIELD_RAD` halved repeatedly down to `DIGITAL = 24` resolution elements (TL2 0.5 m: ×1 … ×17,853; TL4 1.2 m: ×1 … ×36,305; the screenshots show ×1, ×4, ×32, ×512, ×1,024, ×2,048, ×4,096, ×16,384, ×17,853, ×36,305). AUTO picks the narrowest step that frames the target (hull ≥ `FRAME_AT = 12` elements: `FILL = 0.55` of the frame; world ≥ 4 elements: `FILL_WORLD = 0.62`, ×2.35 width for Saturn's rings); manual steps (+/−, wheel) hold until AUTO or a new target. The field eases with τ = 0.6 s (0.2 s when pulling back to fit a fireball).
4. **Exposure**: start at the limit; a sunlit resolved hull → `magLimit − 10`; anything brighter than `mShow − 9` sets `mShow = mag + 9`; the Sun counts with `SOLAR_ND = 12.5` mag; `gain = clamp((mShow − (limit − 10)) / 10, 0, 1)` + 0.1 (PLUME) or 0.25 (DEEP); `exposure = clamp(1/30 × 10^((mShow − limit)/2.5), 1e-6, 1/30)` s. Shown as "EXPOSURE 1/1000k s · GAIN 0 dB" for a bright world, "1/35 s · GAIN 24 dB" for faint Ceres.
5. **Background** `#000`, then the stars (`drawStars`), then worlds farther than the target, then the target and other contacts in the field (`drawThing`), then nearer worlds, then fight effects (`ScopeFx.draw`).
6. **Washes**: our own exhaust (radial white-blue), solar glare within 10° (linear gradient from the Sun's side, `k = (1 − off/10°)² × (0.35 + 0.65 × filter.own)`), the sensor's response to flashes (`drawSensor`: ghosts, bloom column, radiation snow, white-out), then **grain**: a 128×128 noise tile (cubed uniform noise to 90, 0.2% hot pixels at 200), alpha `0.02 + 0.07 × gain`, composite `lighter`, shifted randomly each frame.
7. **HUD** (`hud()`, line 646), 10 px IBM Plex Mono with a 3 px `rgba(0,0,0,0.75)` outline (`label()`, line 795):
   - top left: `TELESCOPE 0.5 m · TRACKING|SLEWING|HOLDING LAST POSITION|OCCULTED|NO LOCK`, exposure/gain/filters, `IMAGE 53.3 min OLD`;
   - top right: name (faction colour, or sun-amber for a world) + marks, `RANGE … · LIGHT …`, `SIZE … · RESOLVES … (… m)` or `DIAMETER 30″ (140k km) · MAG −1.8`, `PHASE 9° · 99% LIT`, `FIELD … · ZOOM ×2,048 AUTO`;
   - the reticle: corner brackets (L = 9 px, pad 10 px) round the target's box, cyan (amber when lost or occulted); a 4 px broken boresight cross in `rgba(62,199,230,0.35)`;
   - Sun pointer: an amber triangle at the left or right edge with `☉ 33°`;
   - bottom left: a scale bar of a round length (1, 2, 5 × 10ⁿ m) ≥70 px, "50k km at the target";
   - bottom centre: one sentence that says why the picture looks as it does ("RESOLVED · 643 resolution elements across it", "DRIVE PLUME · the hull is lost in its glare: FILTER to bring it out", "A CRESCENT · the Sun beyond it", "THE SUN · through the solar filter: the photosphere, its granulation, sunspots", "NOTHING ABOVE THE NOISE · it would be magnitude 18.2; the camera reaches 16.0").
   - Colours: `DIM rgba(122,142,162,0.9)`, `TEXT rgba(190,205,220,0.95)`, `CYAN rgba(62,199,230,0.75)`, `WARN rgba(240,169,58,0.98)`, `SUNC rgba(255,196,110,0.95)`.

**A point of light** (`psf`, line 840): `s` magnitudes above what the frame shows; `I = min(1, 0.2 + 0.13 s)`; `r = max(1.1, psfPx)`; `over = max(0, s − 6)` saturates and blooms: radius `r (2 + 0.9 over)`, white core to colour; `over > 1` throws four diffraction spikes of length `r (4 + 6 over)` and alpha `min(0.7, (over − 1) × 0.12)`. `psfPx = max(0.7, 0.5 × cameraRes × px/rad × blur)`.

**A lit drive** is a psf at the stern (`[205,222,255]`) plus, on a resolved hull, a short exhaust cone (linear gradient white → `rgba(90,130,255,0)`, `exhaust()` line 864). Looking up its exhaust, a radial glow covers the hull. A hull outshone by its plume (`glareK`) is dimmed; the FILTER button pulses amber (`.suggest`) when a filter would help.

**A resolved hull** (`solidShape`, line 560): rendered on the GPU through `orthoCamera` along our line of sight with the plane's up as up, the Sun placed at the true phase on the true side, `sunI 3.4`, `exposure 1.15`, rolled by a hashed angle ("as its crew left it"), only the on-screen part rendered (≤4096 px), then blurred with `ctx.filter = blur(…)` to the optics' resolution. Without WebGL2: `hull-art.js` drawn side-on, shaded with a linear black gradient by phase, `brightness(1.6) contrast(1.1)`.

### 3.3 Stars: hashed, not catalogued (scope-sky.js lines 495–565)

There is **no star catalogue**. The sky is a grid in (azimuth round the plane, elevation out of it):
- fine cells `CELL = 2.5e-4` rad (≈52″), `STARS_PER_CELL = 17.6` stars to magnitude 19 (≈2.8×10⁸ per steradian), used when the field holds ≤900 fine cells;
- bright cells `BRIGHT_CELL = 0.02` rad (≈1.15°), 3.6 stars per cell to magnitude 9, for wide fields; nothing drawn past 2,500 cells.
- Per cell, `n = floor(per × (0.55 + 0.9 × hash(i, j, 1)))`; per star, `m = faint + log10(hash) / 0.45` (so the count grows as 10^(0.45 m)), position from two more hashes, tint: 20% blue `[190,210,255]`, 20% orange `[255,214,170]`, otherwise `[228,232,245]`.
- Drawn if the exposure reaches it (`s = mShow − m > 0`), alpha `min(1, 0.12 + 0.11 s)`: a square of side `2 × max(0.6, 0.8 psfPx)` when small, a full `psf` when bright, a horizontal streak while slewing (alpha ÷ √(streak/2)).
- Same stars in the same places at every zoom: the hash is deterministic. `brightStars(faintest = 6.5)` exports the bright sky as unit vectors for the hull cameras' perspective lens.
- `hash(a, b, c)` is an integer hash (multiply by large primes, xor-shift) to [0,1); `rng(seed)` is mulberry32. The UI has its own seeded randomness so it never disturbs the sim's stream.

### 3.4 Worlds: procedural surfaces and a sphere ray-caster (scope-sky.js lines 23–453)

**Surface maps.** `TW × TH = 512 × 256` RGB (Uint8), features laid out on a `256 × 128` grid and scaled ×2. Earth also has a 512×256 night-lights map. Value noise `noise2` (smoothstep-interpolated hashed lattice, wrapped in longitude) and `fbm` (4–5 octaves, lacunarity 2, gain 0.5). `paint(rgb, u, v, r, fn)` applies a falloff function within a radius, wrapping in longitude and squeezed toward the poles by `1/max(0.2, cos lat)`.

The `LOOK` table (line 77) gives each world a kind and colours:

| Kind | Worlds | How it is made |
|---|---|---|
| `giant` | Jupiter (8 bands `#D9C6A4 … #9E6E48`, spot `#B5523A`, limb 0.55), Saturn (6 bands, rings, limb 0.5), Uranus, Neptune (spot `#24366E`) | band index `t = Y/DH × nBands × 1.7 + (fbm(X/32, Y/8) − 0.5) × 1.3` (wavy belts), smoothstep between bands, turbulence darkening ×0.85 by fbm, an oval storm at (0.62, 0.64) of the map 5% × 4.5% across (the Great Red Spot) |
| `cloud` | Venus `#E9D4A2/#D7B983`, Titan `#D59A45` (haze) | `sin(lat × 7 + (n − 0.5) × 4)` latitude bands |
| `earth` | Earth (air `[120,170,255]`) | land = fbm at 1/32, coast at 0.555–0.575, ocean `[16,42,98]→[30,72,140]`, ground green→olive→desert by a dryness fbm and latitude, ice caps past `|lat| ≈ 1.08–1.2` rad, cloud bands swirled by `sin(Y/9)`, cover `(cl − 0.5) × 2.6`, city lights (7% of land pixels × land excess, intensity 120–255) |
| `mars` | Mars `#B9573A/#6F3423`, air `[196,178,190]`, caps | dark albedo regions from fbm 0.46–0.62, bright dust; **terraformed**: a young northern sea `[38,62,84]` over the low plains, lakes in low basins, lichen/grass `[112,108,70]` round the water, polar caps past `|lat| ≈ 1.3–1.4` |
| `io` | Io | sulphur plains, 70 dark vents, 6 lopsided red fallout rings `[196,96,52]` |
| `europa` | Europa `#D8CDB7/#8E6B4E` | two families of warped sine cracks (lineae) `|sin(X·6π/DW + Y·0.21 + w1·11)|` and `|sin(X·10π/DW − Y·0.17 + w2·9)|`, thresholded, plus brownish chaos patches `[176,132,100]` |
| `ice` | Enceladus | near-white |
| `iapetus` | Iapetus | two-tone leading hemisphere `cos(lon − 0.3)` |
| `rock` (default) | Mercury, Luna (9 maria, 260 craters), Phobos (irregular 0.28), Deimos (0.22), Ganymede, Callisto, Saturn's mid moons, Ceres (3 bright spots), Vesta (big crater 0.5), Pallas, Hygiea, Juno, Interamnia | fbm mottling, maria as soft dark blobs, craters with a darker floor, a soft light rim (`d > 0.78`), 12% fresh ones with bright ejecta to 2.4 r; sizes `(rnd³ × 10 + 0.7) × 2` map px |

`surfaceMap(name)` (line 234) hands the same map to the GPU for the shuttle's close-up ground (`gl/world3d.js`), Earth's clouds split into their own layer.

**The sphere** (`SkyPainter.raster`, line 305): for each pixel of the disc's box, `(nx, ny)` normalized by radius, `nz = √(1 − r²)`; an irregular small body scales the edge by `1 + irr × (fbm(angle) − 0.5) × 2`. Longitude `atan2(nx, nz) + rot × 2π`, latitude `asin(−ny)`; bilinear sample of the map. Light: Sun vector `Sx = ±sin(phase)` (side by `sunRight`), `Sz = cos(phase)`; `λ = nx·Sx + nz·Sz`; `I = max(λ, 0) × min(1, (λ + 0.06)/0.12 + 0.5)` (soft terminator) `× (1 − limbK + limbK √nz) + 0.012` (limb darkening `limbK` = look.limb, 0.25 with air, 0.1 without; a 0.012 floor). Close in (`rPx > 260`) a fine grain modulates I by 0.95–1.05. Earth's night side adds city lights where `λ < 0.03`. Just outside the limb (`1 < r² < 1.07`) the air's scattered light: alpha `(1 − (r − 1)/0.035) × (0.32 max(0, lit + 0.25) + 0.25 max(0, −Sz)⁴) × 230` in the air's colour (a bright day-side rim, a faint full ring when backlit).
- `viewOf` (line 481): a disc up to `MAX_R = 220` px radius is cast whole and scaled; bigger, only the part on screen is cast, at most 480 samples across (`step = max(1, max(vw, vh) / 480)`), so a world filling the frame stays near screen resolution.
- Rotation: `rot = (days / |rotH/24|) mod 1`, retrograde negative; cache key quantized to 1/720 turn.
- Drawn with `drawImage` and `ctx.filter = blur(0.45 × cameraRes × px/rad)` when >0.4 px, so a world at the digital-zoom limit looks properly soft (Ganymede at ×36,305 is a blur, as it should be: 1.1″).

**Saturn's rings** (`rings`, line 375): opened 0.35 rad (20°); four elliptical stroked bands at radii ×R: C 1.24–1.53 (alpha 0.18), B 1.53–1.95 (0.62), Cassini division 1.95–2.03 (0.04), A 2.03–2.27 (0.42), colour `rgba(226,206,160)`, lit `0.3 + 0.7 max(0, cos(0.9 × phase))`; the back half (clipped above the centre) before the globe, the front half after.

**The Sun** (`drawSun`, `sunRaster`, lines 394–452): a warm glow from 0.95 R to 1.6 R (`rgba(255,190,110,0.35)` → 0); the disc with limb darkening `I = 1 − 0.62(1 − μ) − 0.18(1 − μ)²`; granulation as two octaves of fine value noise (`0.93 + 0.1 × noise`), plus, when the disc is big enough, a 256×256 Worley-style granule tile (`granules()`: 18×18 jittered points, F2 − F1 cell edges as dark lanes, granules ≈1/700 of the radius ≈1,000 km); faculae brightening toward the limb (μ < 0.35); five sunspot groups at ±5–35° latitude (a leader, a follower, small ones), umbra ×0.24, penumbra ×0.6 with radial fibril ripple, turning with a 25.4-day rotation; colour `(255, 196, 110) × I`. The solar filter is put in automatically (ND 12.5 mag, shown as "SOLAR FILTER ND 5").

### 3.5 A fight through the telescope (scope-fx.js)

Effects run on the wall clock (a flash is a moment whatever the warp) and are anchored in space at the moment seen, carried on with the velocity of what they happened to. Kinds and lifetimes: `nuclear 7000 ms` (white-out, a lumpy edge-bright plasma shell kilometres across cooling white → orange → dull red, sparks, plates), `fusion 12000` (reactor: brighter, a shock ring, the ship in glowing pieces), `he 3600` (a hit on the hull's face, fireball tens of metres, incandescent fragments, venting air, glowing breach), `kinetic 2200`, `intercept 1900`, `pdc 1100` (muzzle flashes at the turrets, tracers), `strafe 1300` (rounds converging over their real time of flight, `gap / max(300, PDC_MUZZLE + closing)` s, hits on the faces we see). Colour ramps: `HEAT [255,255,250] → [255,232,160] → [255,166,72] → [226,88,34] → [120,30,16]`, `PLASMA` starting blue-white. Brightness by `flashMag(kind, d) + filter.flash` against the exposure. The sensor: ghosts along the line through the frame's centre (four tinted rings), a bloom column, radiation snow (up to 1,600 hot pixels), white-out. One in five rounds a tracer, 12 tracers/s per stream.

### 3.6 What the screenshots show, and issues found

- From Phobos Naval Yard (on Phobos' surface, 6,000 km over Mars), Mars is 42.4° across and fills the 34° field (`longhaul-telescope-mars.png`, `-mars-gate.png`, `-mars-zoom.png`): rust plains with darker albedo blobs, blue-grey northern sea and lakes, a soft vignette at the limb. **The 512×256 map is visibly too coarse at this scale**: coastlines stair-step in 8–10 px blocks and the ×4 zoom is a smeary orange field. OLYMPUS will show Mars, Phobos, Deimos and Europa from close (barracks windows, drop ships, orbit), so its maps need 4–8× the resolution, or detail made per view (more fbm octaves evaluated at the sample point rather than baked in), or a deliberate pixel-art quantization that turns the blockiness into style.
- Jupiter from Mars (6.41 AU, 30″, ×2,048; `-jupiter.png`, `-jupiter-dpr2.png`, `-jupiter-crop.png`): convincing banded disc with wavy belt edges and turbulence, limb darkening, a faint warm rim, the right amount of softness. The GRS was on the far side. At DPR 2 the canvas renders 1916×1646 device px, smooth (no pixel art).
- Saturn (`-saturn.png`, 19″): globe with bands, rings with the Cassini division, front/back occlusion right.
- Earth (`-earth.png`, 1.99 AU, 8.8″, 83% lit): continents, oceans, swirled clouds, terminator on the right.
- The Sun (`-sun.png`): amber disc with limb darkening, granulation texture, one sunspot, warm halo.
- Venus (`-venus.png`): a thin cream crescent, "A CRESCENT · the Sun beyond it". Luna (`-luna.png`): a soft grey gibbous disc with maria at ×16,384. Ganymede (`-ganymede.png`): a beige blur at ×36,305. Ceres (`-ceres.png`): a barely-there point among faint stars at gain 24 dB with visible sensor grain. Phobos (`-phobos.png`) and Deimos (`-deimos.png`, `-deimos-gate.png`): lumpy irregular crescents.
- A ship 100 m away (`-ship.png`): a GPU-lit freighter hull, panel seams, lit ports, red/green nav lights, faction stripe, Mars's limb behind; readouts "RESOLVED · 643 resolution elements across it".
- **Silent occultation**: docked on Phobos' surface, Phobos covers 81.6° of sky (`bodiesInField` returned `Phobos: 11 km, r = 81.56°` for Saturn's, Earth's and Luna's bearings). The frames for Saturn, Earth and Luna were black: physically right (the moon you stand on hides them) but the HUD said "100% LIT" with no "OCCULTED · behind Phobos" line, because `occulter` is only consulted for entity targets (`telescope.js` line 275), not world targets. OLYMPUS's surface telescopes and windows must say "below the horizon".
- Minor: `worldzones.js` asks for `"IBM Plex Sans"` (line 45), which is not shipped (only Plex Sans Condensed and Mono), so those labels fall back to the system sans-serif.

---

## 4. The ship displays (main view tabs)

### 4.1 The shared grammar

**Palette** (`css/console.css` lines 21–42; the same hexes hard-coded in each canvas module's `COL`/`C`):

| Token | Hex | Meaning |
|---|---|---|
| `--c-void` | `#05070A` | display background |
| `--c-bg` | `#0A0E13` | panels, rails |
| `--c-raise` / `--c-raise2` | `#0F151C` / `#141C25` | buttons, panel heads, hover |
| `--c-line` / `--c-line2` | `#1C2632` / `#2A3846` | hairlines, borders |
| `--c-text` / `text2` / `text3` | `#D8E1EA` / `#94A3B2` / `#5E6D7C` | primary / secondary / dim |
| `--c-own` | `#5FD38D` | us, nominal |
| `--c-sel` | `#3EC7E6` | selectable, selected, informative |
| `--c-route` | `#D46BE0` | the route; what our work points at |
| `--c-caution` | `#F0A93A` | caution; a ship running dark |
| `--c-warn` | `#EF5350` | warning, inbound, hostile |
| `--c-mil` | `#E07B4F` | military/proxy zones |
| `--c-data` | `#EDF2F7` | key figures (the clock, the ship's name) |
| `--c-flag` | `#FFE15C` | the captain's lettered flags |
| marks | flag `#FFE15C`, mission `#D46BE0`, dark `#F0A93A`, wreck `#7A8794` | `marks.js` line 23 |
| factions | UN `#4A90D9`, MCR `#C1553B`, OPA `#E2A355`, independent `#8A8A6A`, pirate `#C05AA0`, player `#4FD1C5` | `sim/factions.js` lines 26–37 |

Map-specific: AU rings `rgba(42,56,70,0.55)`, ring text `rgba(94,109,124,0.9)`, orbits `rgba(52,70,88,0.75)`, minor orbits `rgba(42,56,70,0.6)`, the Belt `rgba(150,135,110,0.06)`, light-time rings `rgba(240,169,58,0.35)`, their text `0.7`. Threat board: background `#0A0608` (red-black), decade rings `rgba(90,40,40,0.35 + 0.05 d)`, labels `rgba(160,90,90,0.7)`.

**Line weights**: 1 px hairlines everywhere (grid and reticle lines offset +0.5 to land on pixels); 1.5 px for selection brackets, station squares, FOB diamonds, mission diamonds, hollow (dark) marks, our hull outline; 2 px for the route under way. Dash patterns: AU rings `[2,6]`, minor orbits `[1,4]`, a dark ship's report ring `[2,2]`, a report's uncertainty circle `[1,4]`, light-time rings `[1,6]`, hot zones `[6,4]`, the route being planned `[7,5]`, a torpedo's aim line `[2,4]`, the scanner lock ring `[3,2]`, scanner axes `[2,5]`, the PDC gun envelope `[2,3]`, tactical highlight `[3,3]`.

**Type in canvases**: names 11 px IBM Plex Sans Condensed 500 (stations 600, planets 12 px 600 in caps); readouts and ring labels 10 px IBM Plex Mono; tactical labels 10 px Mono (7 px on a small panel). `Labels` draws a halo of the background colour (3 px) round each name on the map so names read over world discs.

**Marks** (`marks.js`, same on every display and list): a ship squawking its transponder is a solid mark; running dark, hollow (`paintMark`: fill background, stroke colour 1.5 px) and called DARK in amber; a wreck hollow and grey; what our work points at inside a magenta diamond (dashed for a "possible"), the job's tag after its name; the captain's flags as a yellow pennant (pole 12 px, triangle 8×7) with its letter on a dark chip at the mark's shoulder, never crowded off.

**Labels pass** (`labels.js`, 105 lines, no dependencies): `add(text, x, y, { off, font, color, alpha, pri, fixed, above, side, tags })` and `block(x0, y0, x1, y1)`; at the end of the frame, names are sorted by priority and each tries right, left, above, below of its mark (or a given side first; `fixed` names have one place), must lie inside the display and not overlap anything placed (a 48 px cell grid); a name with no free place is left off. Tags (DARK, a job) are written after the name in their own colours. Our ship's name has priority 100, the target 9, SOS 7, stations 6, planets 8.

**Picking**: each display keeps a list of `{ id, x, y }` hits; nearest within 14–18 px wins (bodies biased by −60 px², stations by −80 px² on the map so a station isn't lost under its traffic). The map offers a pick list when several are under the pointer. The pointer turns to the pixel hand over anything pickable (`dom.js pointAt`), crosshair otherwise.

### 4.2 The solar map (solar-map.js, 630 lines)

"It is the console's main display, drawn the way a nav display is: no starfield (stars tell a navigator nothing here), hairline orbits, the Belt as the band it is, colour that means something ... and nothing that moves unless the thing it shows does (a distress beacon's pulse is the one exception)." (header, lines 13–20)

- Camera: centre (AU) and `scale` px/AU from `MIN_SCALE = 6` (whole system) to `MAX_SCALE = 4e8` (≈0.4 km/px). Views: SHIP (follows us, 0.6 AU radius), INNER (1.9 AU), BELT (3.5), SYSTEM (32), TARGET. Wheel zoom `k = exp(−deltaY × 0.0018)`, eased 28% of the log-distance per frame, keeping the point under the pointer still. Drag to pan (follow released after 4 px of movement).
- Draw order: void; the Belt as one 2.1–3.3 AU stroked annulus (only when scale < 4000); dashed AU rings at 0.5, 1, 1.5, 2, 3, 5, 10, 20, 30 AU (drawn when 24 px < radius < 4 × diagonal), labelled `1 AU` above; hairline orbits (moons and asteroids dotted; skipped when < 4 px or > 20,000 px radius); influence spheres as radial gradients in faction colour at 11% alpha (`col + '1C'`), hot zones as 5% fills with a dashed ring and their kind and body labelled; the Sun as a radial gradient (white → `rgba(255,214,120,0.85)` → transparent, ≥4 px); a picked world's planetary space (`worldzones.js`, under and over the bodies); bodies as dots (planet ≥3.5 px, moon ≥2, asteroid ≥1.6, true size when larger; above 18 px a disc becomes a dark tint of its colour with a 1.5 px limb so names and tracks read over it; Saturn's ring an ellipse 2.2 × 0.6 R); moons hidden inside the planet's dot until their orbit is ≥6 px; entities (stations as 8 px squares with a centre dot, drawn over traffic; ships as arrowheads 5/3.5 px along heading when burning, along velocity when coasting, with a 8 px exhaust line; FOBs as 7 px diamonds; ordnance 3 px squares with a dashed line to their aim point); the plot's reports (rings of 3 px, faded `max(0.25, 0.75 − 0.5 × age / 3 days)`, with their uncertainty circle dotted when it says something, a point cloud past 1,500); light-time rings round us (1 light-second, 1 light-minute, 10 light-minutes, dotted amber); the route (magenta, 2 px) and the planned route (cyan, dashed); our ship (green arrowhead on a 7 px void disc, a velocity line showing one hour of coast, capped 160 px); all names (`Labels`); hover ring and hover tooltip (dark box `rgba(18,26,35,0.96)`, `#2A3846` border); the selection's corner brackets (r 12, arms 5); scale bar (bottom right, about 120 px, 1/2/5/10 × 10ⁿ km, in Mono 10 px).
- Status line at the foot (DOM, `#nav-info`, 11 px Mono `--c-text3`): `SUN 1.524 AU · HELIO V 22.7 km/s · LIVE 97 · PLOT 0 · LAST DIGEST …`.
- Screenshots: `longhaul-shell-solar.png` (default ship view at Mars, Phobos Naval Yard and our arrowhead, light-minute ring, a red-brown wash of MCR influence), `-solar-inner.png` (Mercury, Venus, Earth with Luna Shipyards' square, AU rings, 10 light-min ring, soft influence blooms), `-solar-belt.png` (the Belt as a faint band, every Belt station in OPA amber squares with their rock's name in grey), `-solar-system.png` (out to Neptune, 5/10/20/30 AU rings, names placed without collision), `-solar-mars-card.png` (Mars picked: the card with PLOT / LOOK / DETAILS and the full CONTEXT sheet), `-solar-mars-space.png` (Mars's planetary space: the true-size disc, PLANETARY SPACE · 0.01 G · 20,898 km ring, HIGH ORBIT 19,226 km in green, STATIONARY 20,428 km in amber, Deimos, and some 40 named traffic arrowheads round Phobos in faction colours, none overlapping), `-solar-jupiter-space.png` (Jupiter's space: 0.03/0.1/0.3 G contours, Galilean moons, Ganymede Station).

### 4.3 A world's space (worldzones.js, 184 lines)

Drawn when a world is picked or we are in it, "light and thin": the pull as a wash `rgba(120,196,255,…)` from the ground to 0.01 G (log-scaled), contours at 0.03, 0.1, 0.3, 1 G; the Hill sphere dashed far out; the high parking orbit green, the stationary orbit amber, the low orbit band violet; the air as a glow in its colour (`AIR_TINT`: Mars `217,138,106`, Earth `111,183,255`, Titan `217,165,74`, …) from the ground to the entry interface; airspaces round the equator as ticks at the limb in their authority's colour, names written outward, spaceports as points turning with the world; our shuttles' tracks (burns dashed, coasts dotted, the air's stretch solid, the pad a ring). Each piece appears only once it is a few pixels across. This is the closest existing thing to an OLYMPUS "Mars orbit / drop to the surface" map.

### 4.4 Local space (tac.js, 544 lines)

"Ship-centred, nose-up. True positions of everything within a few km, interpolated between sim minutes." (header)
- Ranges `TAC_RANGES_M = [1000, 5000, 25000]` (buttons 1 KM, 5 KM, 25 KM); px/m = (min(W, H)/2) / range; grid every quarter range `rgba(42,56,70,0.32)`; three range rings at thirds `rgba(42,56,70,0.7)`, labelled `0.33 km` etc. right of centre where no name is; `FWD` at the top (12 px Plex Sans Condensed).
- Rotation so our nose points up: `rot = π/2 − facing`.
- **Our hull** is drawn as an outline of its own deck plan (`buildHullPath`: the tile rows of every deck, 32 px tiles, stepped outline with a 3 px margin), fill `#0F151C`, stroke `#5FD38D` 1.5 px, at a stylized size (`SHIP_PX_BIG = [60, 24, 8]` px for the three zooms; a 25 m hull would be sub-pixel) with a 2 px dot at its centre. At 25 km it is a 3 px green square inside a torch star when lit.
- **Our plume** "the way it looks": a fireball about 2 ship lengths then a taper about 13 (`k = min(1.4, 0.45 + 0.35 √g)`), a vertical linear gradient white → `rgba(224,232,255,0.8)` → `rgba(160,200,255,0.45)` → `rgba(90,140,255,0.18)` → transparent, flickering `0.85 + 0.15 sin(40t) sin(23t)`; at 25 km a radial torch star (70 px). RCS jets as 5×2 px amber ticks.
- **Contacts** only as our sensors hold them (`liveKnowledge`): 1 km, a silhouette from `hull-art.js` seen from above, its length growing with the log of the real hull length (`(10 + 9 log10(L/20)) × 1.6` px), stations as rings with turning spokes; 5 km, arrowheads 7/5 px (hollow when dark) with an exhaust tick when burning, stations as 6 px diamonds; 25 km, 3 px dots (a glowing 10 px torch when burning; hollow 5 px squares when dark). Colours by faction, SOS red with a pulsing ring, wrecks grey. Names in 10 px Mono beside the mark with the range under it in `rgba(122,142,162,0.8)`, crowded ones left off (pick first, then flags and mission targets, then nearest). Selection: four 45° arcs at r = 20 ± 1.5 px, pulsing, cyan 1.5 px; the reference target a dashed green ring; off-screen reference as an edge arrow with its name inside.
- Combat effects over it: PDC streaks `rgba(255,214,140)`, detonations as radial gradients sized from their true radius, hits as growing dots.
- Screenshots: `-local-1km.png` (our freighter's outline, Phobos Naval Yard's red ring-and-spokes, a neighbour's top-view silhouette), `-local-5km.png`, `-local-25km.png`, `-local-corvette-1km.png` (the Tharsis corvette's outline alone at the gate).

### 4.5 The scanner (scanner.js, 169 lines)

"The fused board, so no sweeping beam (nothing on the ship scans in a circle)": nose-up, radius `min(cx, cy) − 30`; three range rings (outer in `line2`), labelled in the band's units; dashed fore-aft and beam axes; bearing ticks every 30° (6 px), labels every 90° (`NOSE`, `90°`, `180°`, `270°`); our ship a small green triangle; contacts as 3 px dots in faction colour (stations 4 px squares; hollow when dark), hostile with a red 1.5 px square round it, our fire-control target a red cross, the sensor lock an amber dashed ring, a lit plume a faint ring; ordnance as small diamonds (red when coming for us, with its name and time to impact); bands SHORT ~150k km (all sensors), MEDIUM ~1.5M km (radar), LONG ~15M km (telescopes: drive plumes and beacons). Header text at top left (`SHORT RANGE · ~150k km`, 12 px 600) and the count at top right. Screenshots: `-scanner-short.png` (95 contacts clustered round Phobos), `-scanner-long.png` (155 contacts out to 0.1 AU, several `SIG-xxxxxx DARK` signatures).

### 4.6 Weapons: the threat board and fire control (combat.js, 327 lines)

The threat board is nose-up like the scanner but **logarithmic, 1 km to 10,000,000 km on one screen** (`DECADES = 7`, `radius(km) = R × log10(km) / 7`), "because a fight spans both: a torpedo launched from millions of km arrives in seconds of PDC fire at a few km." Red-black background, decade rings labelled 10 km … 10M km, the PDC envelope as a green 6% fill and the gun range as a dashed green ring, inbound torpedoes as red diamonds with a line to us and their ETA, hostiles boxed in red, the target with a rotating red cross. The right side holds the fire-control panel (DOM): TARGET, TORPEDOES (magazine, tube readiness chips, warhead HE/NUKE, profile FAST/COLD COAST, FIRE), POINT DEFENSE (AUTO/HOLD/ENGAGE, mounts, rounds), AIM (DISABLE/DISARM/KILL), HELM (BATTLE STATIONS, EVASIVE), THREATS, STATUS. Screenshot `-weapons.png`.

### 4.7 Exterior cameras (skimmed; GPU)

The EXTERIOR tab (X) holds four feeds on one bar (`stage.js`): DRONE (our ship and what is round it at true scale, `exterior.js` + `gl/ships3d.js` oblique camera, lit 3D solids, shadows, plumes, floodlit ports, the rock under a surface port ray-cast as cratered regolith), HULL (four fixed 80° lenses on our plating, `hullcam.js`, perspective camera, the telescope's bright stars and worlds behind), SHUTTLE (NOSE/DOWN/TAIL during a planetary run, `shuttlecam.js` + `gl/world3d.js` ground from the telescope's surface map at true size with relief, `air3d.js` Rayleigh and haze scattering, Earth's cloud deck, `town3d.js` spaceport and town in each world's style: "Mars's domes over their districts, tubes between them, industry outside ... Europa's rigs"), and TELESCOPE. No drone out means no picture of our own hull ("nothing aboard sees the whole ship from outside"). Screenshots `-hullcam-fwd.png` (Mars's limb huge on the right, our dorsal plating, a neighbour 98 m off labelled), `-hullcam-aft.png` (looking down the hull, Phobos' surface behind), `-drone.png` (Phobos Naval Yard's lattice tower, docked hulls, the regolith, berth labels), `-drone-corvette.png` (our corvette alone, 100 m scale bar).

### 4.8 Room cameras (skimmed)

`roomcam.js` (2,438 lines) builds each compartment in 3D from its deck's tile grid (a tile ≈1.5 m) seen from a fixed high corner camera, lit by a per-texel light map from the room's lights with soft occlusion, with **lighting states, worst first: vacuum (main lights dead, a flickering panel, rime), blackout (floor strips only), emergency (amber lamps, panels at a tenth), battle stations (panels dimmed, red strips), normal (cool white), and fire laid over any of them** (flicker, flames, smoke under the deckhead). The overlay is what a real camera carries: id and compartment, pressure and O₂ (`101 kPa O₂ 20.9%`), the ship's clock. People are joints posed from what the sim says (stations, couch, bunk asleep on their side under a blanket, autodoc, mess stool, treadmill, adrift, braced under hard burns, pinned flat by crushing ones, thrown, down, dead, carried) and rendered as rigged CC0 bodies (`gl/figures.js`, Quaternius Universal Base Characters) in department-coloured jumpsuits or white vac suits with helmet and pack. Screenshots: `-roomcam-deck1.png`…`-deck9.png` (freighter), `-roomcam-corvette-1-bridge.png` … `-8-reactor.png` (Tharsis corvette under battle-stations red strips), `-roomcam-corvette-suits.png` (a crewman in a white vac suit at a bridge station), `-rooms-panel.png` (the small feeds grid).

---

## 5. The UI shell

### 5.1 Layout (index.html, 332 lines)

Screens are `.screen` divs faded in and out (`app.js showScreen`, 500 ms): landing (pixel-art SVG ship logo, LONGHAUL in Plex, "DEEP SPACE OPERATIONS", a 4 px-grid-snapped twinkling SVG starfield), new game (ship name, captain, licence picker in faction-coloured cards, crew ±, a ship list with TL chips and a hull portrait from `hull-art.js`, LAUNCH), load (save list with meta and two-click delete), settings.

The game screen is "the ship's flight console" (`console.js` header):
- **Top rail** (40 px, `--c-bg`, hairline bottom): ship name (15 px 600 `--c-data`), the licence/flag chip, whose space (11 px Mono caps), the date and clock (13 px Mono), the time-warp segmented control (pause/1×/60×/1440×; active green, paused amber, restricted 35% opacity), annunciators (MASTER CAUTION/WARNING, BATTLE STATIONS, ALL HANDS SUITED; 74×30 px boxes, 9.5 px 600 caps, lit red or amber with a two-blink brightness animation), a threat annunciator, then the menu (COMMS, STN, ENG, CREW, JOBS, MSN, SVC, LIB with count badges) and three icon buttons. Short of room, the ship's name gives way first, then whose space, never the clock (`@media` at 1600/1300 px).
- **Left dock**: SHIP panel (drive, attitude, reference velocity, orbit, space, hull, mass, cargo; SYSTEMS as a 3-column grid of chips with a coloured left edge and a health bar; STORES as two columns with 3 px level bars) and CREW & ROOMS (a grid of small camera feeds). **Right dock**: CONTEXT (whatever is picked: a body's science sheet, a contact's full sheet, a crew member, a machine) and ROUTE.
- **Main view**: a tab bar (SOLAR, LOCAL, SCANNER, WEAPONS, EXTERIOR; 12 px 600 letter-spaced caps, active underlined cyan, WEAPONS underlined red; a dot marks a tab with something to see) with each tab's controls; the **flight band** (32 px line of chips: nav status DOCKED/HOLDING in green/magenta/amber/red, the route's progress, the secure-for-burn prompt with crew dots, traffic control's chip with HAIL, the latest two messages); the display itself; the picked thing's card (248 px, dark, cyan top border) on the display; the log drawer.
- **Bottom bar** (40 px): VIGIL (the ship's AI) with its top advisory and its one-click action, the radio ticker, the LOG button with a count.
- **Windows** over everything (`wm-layer`).

### 5.2 Window manager (wm.js, 345 lines; console.js, 100)

- Docks hold **panels**: a 28 px header (caret toggle, 11 px 600 caps title, tools, a ⧉ pop-out button) and a scrolling body. A panel collapses to its strip, can be `fit` (as tall as its content, max 72%) or share the dock by `weight` (flex-grow), and can be popped out into a floating window and docked back. Dock widths are dragged on 5 px splitters (min 220, max 560, defaults 300 left and 340 right), double-click hides a dock.
- **Floating windows**: title bar (drag to move), resize grip, close button, raise on pointerdown (z from 100 up, `win-focus` class), clamped into the console on open and resize (8 px margin), Esc closes the top one (`closeTop`) unless it opted out.
- **Adopting dialogs**: existing dialog overlays (`#dialog-station`, `#dialog-comms`, …) become windows; their modules keep showing and hiding them by `style.display`; a `MutationObserver` notices them appear, places and raises them, and syncs the title from the first `.dialog-title`.
- Layout remembered in localStorage (`win[id] = {x, y, w, h}`, `panel[id] = {collapsed, floating, weight}`, `dock = {left, right, leftHidden, rightHidden}`), saved 250 ms after the last change.
- No dependency except `$` from `dom.js`. Reusable as-is in any DOM UI.

### 5.3 Tooltips and pixel pointers (tooltip.js, 154 lines)

- Every `title` becomes the console's own tooltip: moved to `data-tip` on first hover so the browser's never shows, shown after a 380 ms dwell anchored above (or below) the element, gone on leave, press, wheel or key.
- **Pointers are pixel art drawn from string maps** (`'#'` outline `#0A0E13`, `'.'` fill `#E8EEF4`, the crosshair's fill cyan `#3EC7E6`): arrow (12×18), hand, cross, move, ew, ns, nwse, text. Rendered to crisp-edged SVG data URIs (`shape-rendering="crispEdges"`) and set as CSS variables (`--cur-default`, `--cur-hand`, `--cur-cross`, …) that every stylesheet's `cursor:` uses with the system pointer as fallback. One art pixel = `max(1, round(dpr × 1.4)) / dpr` CSS px (a whole number of device pixels; the arrow 18×27 device px on Retina), never over 32 px (Chrome swaps bigger ones for the system's near the window edge); redrawn when the window moves to a screen of another density (`matchMedia('(resolution: …dppx)')`). This is directly useful to a pixel-art game.

### 5.4 The older 8-bit design system

`css/main.css` (4,161 lines) is "AAA Design System, 8-bit retro-futuristic. CRT glow meets pixel precision": `--bg-void #04080E`, `--accent #4FD1C5` (teal), `--warm #E2A355` (amber), `--ok #6BCB77`, `--danger #E25555`, `--info #5BC0EB`, text `#C8D6E5/#7A8EA2/#566B82`, fonts Press Start 2P / Chakra Petch / Share Tech Mono, `--tile-size 32px`. `console.css` loads last and remaps these tokens onto its own, and `console-type.css` replaces every pixel-face rule with Plex at a readable size. `js/svg-icons.js` (1,895 lines) builds 8-bit icons and tiles from strings of palette letters as SVG `<rect>` pixels (`pxRow`, `sprite`), a pattern OLYMPUS can reuse for code-made UI pixel icons.

### 5.5 Fonts and licences

Shipped in `fonts/` as latin-subset WOFF2, declared in `css/fonts.css` and `css/console.css`:

| Family | Weights | Use | Licence |
|---|---|---|---|
| IBM Plex Sans Condensed | 400, 500, 600 | console UI, canvas names | SIL Open Font License 1.1 (IBM) |
| IBM Plex Mono | 400, 500 | numbers, readouts, canvas labels | SIL OFL 1.1 |
| Chakra Petch | 300–700 | old design system (overridden) | SIL OFL 1.1 (Cadson Demak) |
| Press Start 2P | 400 | old pixel face (overridden; "a few tiny identifiers") | SIL OFL 1.1 (CodeMan38) |
| Share Tech Mono | 400 | old mono (overridden) | SIL OFL 1.1 |

**No licence texts are shipped** in `fonts/` (only `assets/crew/LICENSE.txt` for the CC0 bodies). OFL 1.1 requires the licence to accompany redistributed fonts; OLYMPUS should ship `fonts/OFL-*.txt`. Press Start 2P is an 8×8-pixel face, too coarse for "high-resolution pixel art" body text; OLYMPUS will need either a hand-made pixel font at a larger grid or Plex for dense text (an open question).

---

## 6. Screenshot catalogue (docs/research/shots/longhaul-*.png)

Taken 2026-11-05 at 1600×1000, DPR 1 unless noted, headless Chrome with SwiftShader WebGL2 (3D available). Two runs: an armed light freighter docked at Phobos Naval Yard (MCR licence), and a Tharsis-class corvette (`mcrn-corvette`, crew 9) built with `createGame({ docked: false })` holding at Phobos' approach gate. No page or console errors in either run.

Overall visual style: near-black navy grounds (`#05070A` displays, `#0A0E13` panels), 1 px slate hairlines, small letter-spaced caps for headings, monospaced figures right-aligned, colour used sparingly and semantically (green us, cyan selection, magenta route, amber caution, red danger, faction hues for others). Smooth anti-aliased vector rendering at native resolution; no pixel art except the pointers and the landing logo. Dense: about 40 data lines visible at once round the display.

| File | What it shows |
|---|---|
| `longhaul-landing.png` | Landing: tiny pixel-art ship logo (teal/amber), LONGHAUL in Plex, dim pixel starfield |
| `longhaul-new-game.png` | New mission: licence cards in faction colours (MCRN selected red), ship list with TL chips, hull portraits top and side |
| `longhaul-shell-solar.png` | The whole console: rail, SHIP and CREW & ROOMS docks, SOLAR display at Mars, CONTEXT and ROUTE, VIGIL bar and radio |
| `longhaul-rail.png`, `-panel-left.png`, `-panel-right.png`, `-ai-bar.png` | The rail, docks and bottom bar alone |
| `longhaul-solar-inner.png`, `-solar-belt.png`, `-solar-system.png` | The map at three scales: AU rings, hairline orbits, Belt band, station squares, collision-free names |
| `longhaul-solar-mars-card.png` | Mars picked: card on the display (PLOT/LOOK/DETAILS), body sheet in CONTEXT |
| `longhaul-solar-mars-space.png` | Mars's planetary space at true scale with dozens of named contacts round Phobos |
| `longhaul-solar-jupiter-space.png` | Jupiter's planetary space, G contours, Galilean moons, Ganymede Station |
| `longhaul-solar-dpr2.png` | The map at DPR 2 (3200×2000) |
| `longhaul-local-1km.png`, `-5km.png`, `-25km.png` | Local space at its three ranges; our deck-plan outline, station ring, neighbours |
| `longhaul-local-corvette-1km.png` | The corvette's outline alone at the gate |
| `longhaul-scanner-short.png`, `-scanner-long.png` | The scanner board, short and long bands |
| `longhaul-weapons.png` | The logarithmic threat board and the fire-control panel |
| `longhaul-telescope-mars.png`, `-mars-gate.png` | Mars filling the frame from Phobos: terraformed sea, coarse texture visible |
| `longhaul-telescope-mars-zoom.png` | Mars at ×4 manual zoom: the 512×256 map's limit |
| `longhaul-telescope-deimos.png`, `-deimos-gate.png`, `-phobos.png` | Irregular small moons as crescents |
| `longhaul-telescope-jupiter.png`, `-jupiter-crop.png`, `-jupiter-dpr2.png` | Jupiter from Mars at ×2,048 (the crop is the canvas alone; DPR 2 at 1916×1646) |
| `longhaul-telescope-saturn.png` | Saturn and its rings, the Cassini division |
| `longhaul-telescope-earth.png` | Earth at 83% lit: continents, clouds |
| `longhaul-telescope-sun.png` | The Sun through the solar filter: limb darkening, granulation, a sunspot |
| `longhaul-telescope-venus.png`, `-luna.png`, `-ganymede.png`, `-ceres.png`, `-europa.png` | Crescent Venus; Luna a soft gibbous disc at ×16,384; Ganymede a blur at the TL4 digital limit (×36,305); Ceres a faint point among stars with grain; Europa's frame (TL2) with Jupiter beside it |
| `longhaul-telescope-ship.png` | A freighter 100 m off, GPU-lit, Mars's limb behind |
| `longhaul-hullcam-fwd.png`, `-hullcam-aft.png` | Hull cameras: dorsal plating, Mars, labels with range |
| `longhaul-drone.png`, `-drone-corvette.png` | The drone's picture: Phobos Naval Yard's tower and berths; our corvette alone |
| `longhaul-shell-battle-stations.png` | BATTLE STATIONS lit, every room feed under red strips, warp locked to 1× |
| `longhaul-rooms-panel.png`, `-roomcam-window.png`, `-roomcam-big.png`, `-roomcam-deck1..9.png` | The freighter's compartments (bridge, quarters with a sleeper, mess with a crewman on the treadmill…) |
| `longhaul-roomcam-corvette-1-bridge.png` … `-8-reactor.png`, `-roomcam-corvette-suits.png` | The corvette's compartments under red light; a vac-suited crewman |
| `longhaul-window-engineering.png`, `-window-library.png` | Floating windows (engineering board, ship's library) |

---

## 7. Reuse assessment for OLYMPUS

| Module | Verdict | Why |
|---|---|---|
| `js/core/events.js` | reuse as-is | 39 lines, no deps, wildcard, unsubscribe |
| `js/core/rng.js` | reuse / adapt | seeded mulberry32 + helpers; one global stream (OLYMPUS may want per-system streams so NPC lives don't reshuffle on code changes) |
| `js/core/clock.js` | adapt | integer minutes on an Earth UTC calendar; OLYMPUS needs seconds (or finer) and a Mars sol calendar (sol = 88,775.244 s) |
| `js/core/constants.js` | adapt | AU, GM_SUN, G0 reusable; the warp table is not |
| `sim/game.js` `GameLoop` | adapt (pattern) | the accumulator, warp caps, lite steps, background budget and `alpha` are right; the minute granularity and 60× "1×" are wrong for a foot soldier |
| `sim/save.js`, `storage.js`, `ui/persistence.js` | reuse with renames | `$`-stripping, ±Infinity, schema gate, IndexedDB records with meta, autosave cadence |
| `ui/context.js`, `ui/presenter.js` | reuse the pattern | one place maps facts to log/toast/dialog; content is LONGHAUL's |
| `ui/toast.js`, `ui/log.js` | adapt | small; the placement rule (never over the play view) carries over |
| `ui/tooltip.js` | reuse as-is | own tooltips and DPR-correct pixel-art pointers: made for a pixel-art game |
| `ui/wm.js` | adapt | generic docked panels and floating windows with remembered layout; whether OLYMPUS wants docks depends on the tradecraft-style UI |
| `ui/console.js`, `index.html` shell | reference only | a captain's console; OLYMPUS's main UI follows tradecraft |
| `ui/dom.js` | reuse; add a pixel variant | `FitCanvas`, diffed `setText/setHTML`, formatters (`fmtKm`, `fmtSpeed`, `fmtG`…); OLYMPUS's pixel view needs integer scaling and `imageSmoothingEnabled = false` |
| `ui/labels.js` | reuse as-is | the no-overlap name pass, 105 lines, no deps |
| `ui/marks.js` | adapt | DARK hollow / mission diamond / lettered flags; recolour and rename for squads, objectives, waypoints |
| `ui/solar-map.js` | adapt | the user's reference look for nav screens; rewrite the data side (intel plot, factions) against OLYMPUS's model, keep drawing rules and constants |
| `ui/worldzones.js` | adapt | planetary space, orbits, air, airspaces: the Mars orbit and drop map; fix the font name |
| `ui/tac.js` | adapt | ship-centred nose-up tactical screen with plume and RCS art: the ship's local tactical display a marine sees in a drop ship or CIC |
| `ui/scanner.js`, `ui/combat.js` ThreatView | adapt | sensor board and log-range threat board for ship-combat scenes; the fire-control panel as reference |
| `ui/telescope.js` | adapt | the camera model (slew, zoom steps, exposure, HUD) is reusable; it imports about 20 sim modules and the GPU, so cut it down to worlds, stars and point sources and add a "below the horizon" message |
| `ui/scope-sky.js` | reuse as-is, then upgrade | pure (only `BODIES`); raise map resolution or detail per view, choose Mars's look (terraformed or not), add Europa close-up detail, optionally quantize to a pixel palette |
| `ui/scope-fx.js` | adapt | true-scale fight effects; use for space battles seen from a viewport or tactical camera |
| `sim/telescope.js` | reuse as-is (the maths) | pure optics formulas; `scopeOf` reads LONGHAUL state (adapt the inputs) |
| `sim/ephemeris.js` | reuse (another slice covers it) | the one place body positions live; circular coplanar orbits; Mars, Phobos, Deimos, Jovian moons with radius, rotation, GM, air |
| `ui/hull-art.js` | adapt | any hull or station drawn flat from its model at any scale (top/side), role-toned: tactical icons and portraits |
| `ui/exterior.js`, `hullcam.js`, `shuttlecam.js` | reference only | the GPU's 3D views; a different art direction |
| `ui/gl/*` (ships3d, hullmesh, post, damage, world3d, air3d, town3d, figures) | skip for gameplay; reference | WebGL2 lit solids, rigged bodies, filmic bloom; world3d + air3d + town3d could inspire a drop-ship descent cinematic; post.js's exposure/bloom as reference |
| `assets/crew/` (Quaternius CC0) | skip | 3D bodies; OLYMPUS uses pixel sprites |
| `ui/roomcam.js` | reference only | the lighting states, light maps with occlusion, camera overlay (kPa, O₂, clock) and posture list map well onto top-down pixel-art interiors |
| `css/console.css` tokens | adapt | palette and type for in-world ship screens |
| `js/svg-icons.js` | reference | string-mapped pixel sprites as SVG rects: a quick way to make UI pixel icons in code |
| fonts | reuse IBM Plex for diegetic screens | OFL; ship the licence texts |

---

## 8. Recommendations for OLYMPUS's planetary/telescope views and ship tactical screens

1. **One sky module, two finishes.** Port `scope-sky.js` as OLYMPUS's `sky` module (stars, worlds, Sun), with:
   - surface maps at 2048×1024 or better for Mars, Phobos, Deimos, Europa, Jupiter (lazily generated, maybe in a Worker, cached in IndexedDB), or extra fbm octaves evaluated per sample when `rPx > 260`;
   - a `finish: 'optical' | 'pixel'` option: optical for in-world telescope and camera screens (as LONGHAUL), pixel for windows and sky views in the pixel-art world (sample at the art's pixel grid, quantize to a per-world colour ramp, optional ordered dither, no blur);
   - a 3D-aware view: OLYMPUS will need a sky seen from a planet's surface (elevation, azimuth, time of sol, latitude), which LONGHAUL's in-plane bearing does not give. The sphere ray-caster only needs a Sun direction in the disc's frame, which can come from real 3D vectors.
2. **Keep the optics honest.** Reuse `sim/telescope.js`'s formulas for anything the player sees at a distance (a ship's drive seen from Mars at night, Phobos crossing the sky, Jupiter from Europa, 671,000 km out: a disc about 12° across). Light lag on the HUD is cheap and memorable.
3. **Ship tactical screens: port the grammar, not the files.** Write a small `displays/` kit: palette tokens, line-weight and dash constants, `Labels`, marks, scale bar, eased pointer-anchored zoom, `FitCanvas` at DPR ≤2, the corner-bracket selection, the reticle. Then build OLYMPUS's screens on it: the system map (transit progress over weeks), the local tactical ring display, the log-range threat board, the scanner. Draw them crisp at native resolution inside a pixel-art bezel, so the world stays pixel art and the screen reads as a screen.
4. **Time.** Replace the minute tick with a fine tick (for example 0.1 s while the soldier acts: weapon handling, shooting) and a coarse tick for fast-forwards (sleeping, eating, a shower, a transit), with LONGHAUL's lite-step idea for the far world and the `alpha` interpolation for rendering. Keep LONGHAUL's warp caps by situation ("time warp locked: maneuver in progress" becomes "locked: under fire").
5. **Performance**: reuse the habits in section 2.5 (render only what is visible, diff the DOM, cache rasters by view key, sprite-cache glows, point clouds past a few thousand marks, budgeted slices of heavy work per frame, a calendar for the far world).
6. **Avoid** LONGHAUL's 4,000-line overridden legacy CSS (start with one token sheet), the unshipped font name in `worldzones.js`, and silent occlusion in the telescope.

---

## 9. Open questions for the user

- **Mars's atmosphere.** LONGHAUL's Mars (year 2351) is "two centuries into its terraforming ... half an Earth's air ... a walker can breathe in the lowlands", with a northern sea that the telescope draws (`scope-sky.js` Mars look; `ephemeris.js` 52 kPa). The Expanse's Mars is unbreathable and domed. Which does OLYMPUS use? It decides air management outdoors on Mars and what the sky and planet look like.
- **"Real time"**: LONGHAUL's 1× is one game minute per real second (60×). Does OLYMPUS's "moving in real time" mean 1:1 (a sol is 24 h 39 min of play) or a compressed scale like LONGHAUL's?
- **Calendar**: a Mars sol clock (Coordinated Mars Time, a Darian-style calendar) for life on Mars, Earth UTC for ships in transit, or both?
- **In-world screens**: should ship tactical and telescope screens be crisp vector inside a pixel-art bezel (LONGHAUL's look, as the user referenced), or re-drawn as pixel art to match the world?
- **Text**: a pixel font for UI text (Press Start 2P is 8×8; something finer?) or IBM Plex for dense text over pixel-art frames?
- **3D**: is any WebGL scene acceptable in OLYMPUS (a drop-ship descent through Europa's or Mars's sky, as LONGHAUL's shuttle cameras do), or should everything be top-down pixel art?
