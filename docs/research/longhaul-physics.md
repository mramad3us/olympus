# LONGHAUL physics and space model: research note for OLYMPUS

Slice: longhaul's physics and space model (ephemeris, bodies, gravity, worlds and air, ship flight, guidance, navigation, autopilot, time warp, terrain and landing, shuttles and atmospheric entry, G-load on crew, units).
Source project (read-only): `/Users/deaumas/lab/vibe/claudecode/longhaul` (branch `overhaul`, v1.12.21 per its CLAUDE.md).
Method: read `docs/FLIGHT.md` in full, then the code. Ran longhaul's own test suites read-only (`node tests/run.mjs flight|worlds|shuttles|guidance`, all pass; the tests write no files), and ran scratch scripts that import longhaul's modules read-only (in the session scratchpad, not in either repo) to get derived numbers: body table, distances over 30 years, brachistochrone times, entry profiles, shuttle runs at Europa and Mars.

Note on the task's file list: `js/core/` holds `constants.js`, `clock.js`, `rng.js`, `events.js`. There is no `math.js`, `time.js` or `units.js`. Units live in `constants.js` and in naming conventions; time lives in `clock.js`. Body positions live in `js/sim/ephemeris.js` (not `worlds.js`), and the ship dynamics in `js/sim/flight.js`. `lambert.js`, `bodyfacts.js`, `inertia.js`, `crew.js` (G physiology), `world.js` (rails), `holding.js` and `game.js` (the minute tick) were read too because the physics depends on them.

---

## 0. The short version for OLYMPUS

1. **The solar system is 2D, planar, on circular orbits.** Every body moves on an analytic circle in one plane. Positions are in AU (heliocentric), velocities in m/s. The epoch is game minute 0 (2351-03-22 08:00 UTC). `initAngle` values are invented, not a real ephemeris. It is self-consistent and cheap: O(1) per body per query, cached per minute. Eccentricity and inclination are ignored, which puts Mars up to ±0.14 AU off its real track and Pallas up to ±0.64 AU.
2. **Gravity is real, Newtonian and cheap.** The Sun pulls everywhere. Each body pulls inside 3× its Laplace sphere of influence. Bodies are placed at the exact moment asked. Surface gravity follows from GM and radius: Mars 3.727 m/s² = **0.380 G**, Europa 1.315 m/s² = **0.134 G**, Luna 0.166 G, Ceres 0.029 G, Phobos 0.0006 G. That matches the user's 0.38 g and 0.134 g.
3. **Ships are point masses with an attitude. The Epstein drive pushes along the nose, and a flip takes 6 minutes** (slew π/6 rad/min). Integration is velocity-Verlet, one step per game minute. Guidance is closed-loop: burn, flip, brake. Measured overhead over an ideal brachistochrone is +5 to +12%.
4. **Travel times at constant G are days, not months.** Mars to Europa runs 5.5–7.4 days at 1 G and 10–13.5 days at 0.3 G. Mars to Ceres runs 3.2–5.9 days at 1 G. Mars to Earth runs 2.1–4.5 days at 1 G. Weeks need a 0.1 G burn-and-coast (Mars–Jupiter about 38 days). Months need a slow coast (50 km/s: Mars–Jupiter about 190 days) or a Hohmann orbit (Mars→Jupiter 1,127 days). The full tables are in §9.
5. **The fuel model is a game abstraction and not physical.** It charges 0.05 kg of reaction mass per G per minute regardless of ship mass, from a 10,000 kg tank. Read physically, that implies an exhaust velocity faster than light. OLYMPUS's soldier never manages fuel, so this only matters for whether a background voyage is feasible.
6. **Felt G = non-gravitational acceleration only** (drive thrust + RCS + evasive jinking). Crew float while coasting, orbiting, or held in a free orbit. In longhaul they also feel 0 G when the ship rests on a surface or is docked, which is a gap OLYMPUS must fix: on Mars ground, felt g is 0.38 G. Crew physiology runs per minute: thresholds at 0.01 / 0.3 / 1.0 / 1.5 / 2.5 / 8 G, couch ×0.7, juice ÷3 (÷4.5 high dose above 6 G), hangovers, strokes. Inertial "thrown across the deck" events play out in real time with game time frozen.
7. **Atmospheric entry is real physics, flown once and cached.** The integrator works in the turning frame (Coriolis and centrifugal terms included). It models drag ρv²/2β, lift banked to hold a sink rate, Sutton–Graves heating, and a powered landing below 280 m/s or 6 km. Mars pinnace: entry at 3.06 km/s, 38 min, peak 2.16 G, 3,339 km downrange. Europa (airless): a powered descent from 10 km, 1.5 min, up to 3.7 G. A whole drop from Europa's parking orbit to a pad takes 0.9–2.3 h. From Mars' parking orbit it takes 2.4–3.5 h.
8. **Time is an integer count of game minutes**, with warp speeds of 1 min/s, 1 h/s and 1 day/s. There is **no 1:1 real-time speed**: the slowest is 60× real time. OLYMPUS wants real-time sols for a foot soldier, so the time base and the stepping must change. The space layer can stay minute-stepped or closed-form underneath.
9. **Portability:**
   - Pure and portable as-is: `ephemeris.js`, `gravity.js`, `lambert.js`, `bodyfacts.js`, `core/rng.js`, `core/events.js`, `core/constants.js`.
   - Portable after a small cut: the physics half of `worlds.js`, the integrators and conic solvers of `planetary.js` (inject the craft instead of reading `CLASSES`), and `flight.js` + `guidance.js` (pure, but tuned for a ship you command).
   - Reference only: `nav.js`, `autopilot.js`, `terrain.js`, `shuttles.js`. They are deeply coupled to longhaul's state, world, docking, traffic control, crew-ai, market and contracts. Mine them for constants and policies.

---

## 1. Units and conventions (longhaul CLAUDE.md "Rules of the code", `js/core/constants.js`)

| Quantity | Unit | Where |
|---|---|---|
| Position (solar frame, heliocentric, x–y plane) | AU (double) | `flight.pos`, `bodyPos`, entity `pos` |
| Velocity | m/s | `flight.vel`, `bodyVel` |
| Acceleration | m/s² (commands); G for display and limits (`G0 = 9.80665`) | `cmd.ax/ay`, `thrustG` |
| Distances in guidance/combat | metres | `rel.d`, standoffs (`STANDOFF.*`, metres) |
| UI distances | km | |
| Time | integer game-minutes since start (`state.clock.minute`); `days = minute / 1440`; `MIN_S = 60` s per step | `clock.js`, `constants.js:12-13` |
| Body radius | km | `ephemeris.js` data |
| Body GM | km³/s² (×1e9 → m³/s²) | `ephemeris.js` data |
| Rotation | hours, negative = retrograde | `rotH` |
| Moon orbit radius | km in the data, converted to AU on load | `ephemeris.js:82` |
| Atmosphere | surface pressure kPa (null for giants), scale height km, entry interface km | `atmo` |
| Angles | radians, counterclockwise, solar frame; body-frame angles for points on a surface (`ang + spin·t`) | `gravity.js:129`, `worlds.js:301` |

Constants (`constants.js:6-31`): `AU_M = 149,597,870,700`, `AU_KM = 149,597,870.7`, `GM_SUN = 1.32712440018e20 m³/s²`, `G0 = 9.80665`, `TWO_PI`, `MIN_S = 60`, `DAY_MIN = 1440`, `SPEED_MIN_PER_SEC = [0, 1, 60, 1440]` (pause, 1 min/s, 1 h/s, 1 day/s). Sensor ranges are in AU (`RANGE.SHORT 0.001`, `MEDIUM 0.01`, `LONG 0.1`, `SOS 0.3`, `DOCK_M 50,000 m`, `FORMATION_M 1,900 m`). Helpers: `km(v)` km→AU, `metersToAU`, `auToKm`.

House rule (longhaul CLAUDE.md, line 19): "Constants carry their unit in the name (`standoffM`, `launchAU`, `rangeM`). A wrong unit once made pirates charge to 800 km instead of 800,000 km, so check them." OLYMPUS should keep this rule.

Precision: doubles in AU give about 1e-4 m resolution at Jupiter's distance. That is fine for orbital mechanics, not for centimetre-scale ground gameplay: use local metre frames for close-up scenes.

### Core modules

- `clock.js`: `createClock(start = {year: 2351, month: 3, day: 22, hour: 8, minute: 0})` → `{start, minute: 0}`. Calendar values are derived from `Date.UTC(start) + minute·60,000` (Earth Gregorian/UTC only). `formatDuration` gives "45 min" / "3h 20m" / "2d 4h". One integer counter is the only time base: "Calendar values are derived, never stored or advanced separately" (`clock.js:3-4`). **There is no Mars calendar or sol in longhaul.** `worlds.js solarDayH` computes Mars' sol as 24.660 h, but nothing uses it for a clock.
- `rng.js`: a mulberry32 stream seeded via `seedRandom(seed)` (null restores `Math.random`). Also `randRange`, `randInt`, `pick`, `chance`, `gaussian` (Box–Muller), `weightedPick`, `hashString` (FNV-1a), and `nextOf(holder, key)`: a private mulberry32 whose 32-bit state lives in plain saved data, so subsystems draw "off the main stream" without disturbing seeded tests. `seedOf(s)`. Pure; port as-is.
- `events.js`: a tiny `EventBus` (on/off/emit, `'*'` wildcard) and a shared `bus`. "The sim emits facts; the UI decides how to present them." Port as-is.

Architecture rules worth inheriting (longhaul CLAUDE.md): "The sim is pure" (no DOM; it reports through `emit`). "One minute at a time": `minuteTick` runs in a fixed order, and decisions made in a minute are flown the next minute. "State is plain data": `$`-prefixed keys are runtime-only and stripped from saves. "Randomness only through `core/rng.js`". "Scale target is 200k+ entities… Far-away things get outcomes, not simulation."

---

## 2. Ephemeris: how body positions are computed (`js/sim/ephemeris.js`, 180 lines)

**Model.** Analytic circular orbits in one plane. "This is the ONLY place body positions/velocities are computed" (`ephemeris.js:4`).
- Planets and asteroids: period from Kepler's third law, `keplerPeriodDays(a) = 2π√(a³/GM_SUN)/86400` (`:20-23`), "so a free-flying object at a body's radius co-orbits with it exactly".
- Moons: the period is taken from the data table (days), not computed. The data is consistent with Kepler to about 0.1%: Europa's table value is 3.551 d against 3.552 d computed.
- Moons are tidally locked: `rotH = period × 24` (`:83`).

**Epoch and phase.** `angleAt(body, days) = initAngle + 2π·days/period` (`:110-112`), where `days = clock.minute / 1440` since game start (2351-03-22 08:00 UTC). `initAngle` is a per-body invented constant (Earth 0, Mars 4.5, Jupiter 2.1, Ceres 1.0…), so the configuration is fictional, not the real sky of 2351.

**Position.** `bodyPos(body, days, out)` (`:119-134`):
- Sun at (0,0).
- Planet or asteroid: `(a·cosθ, a·sinθ)` AU.
- Moon: parent's position plus `(a·cosθ, a·sinθ)`, with `a` in AU.
- The last answer is cached on the body object (`$pd/$px/$py`), because "a minute asks where Mars is for every ship round it, at the same moment, thousands of times at a crowded port". Note: this mutates the shared `BODIES` objects, which is fine single-threaded but needs care in a Web Worker split.

**Velocity.** `bodyVel` (`:137-152`): the parent's velocity plus the tangential speed `2π·a·AU_M/(period·86400)` along `(−sinθ, cosθ)`. All orbits are prograde counterclockwise, cached the same way.

**Other helpers:**
- `circularSpeed(rAU)` = √(GM_SUN/r).
- `solarGravity(x, y)`.
- `surfaceGravity(b) = gm·1e9/(radius·1000)²` (`:174`).
- `rotationDays(b)`.
- `surfaceAreaKm2(b)`.
- `isGiant(b)`: has an atmosphere with `surfaceKPa == null`, meaning the radius is the 1-bar level and there is no ground.
- `getBody(name)`; `BODIES` lists parents before children; `PLANETS`; `ASTEROIDS`; `SUN`.

**Accuracy against reality** (from `bodyfacts.js` real eccentricities; error ≈ ±a·e radially, plus phase error):

| Body | Real e | Radial error ignored | Real incl. ignored |
|---|---|---|---|
| Mercury | 0.206 | ±0.08 AU | 7.0° |
| Mars | 0.094 | ±0.14 AU (perihelion 1.38, aphelion 1.67 AU) | 1.8° |
| Ceres | 0.076 | ±0.21 AU | 10.6° |
| Pallas | 0.231 | ±0.64 AU | 34.8° |
| Juno | 0.256 | ±0.68 AU | 13.0° |
| Jupiter | 0.049 | ±0.25 AU | 1.3° |
| Moons | small | moon planes are put in the ecliptic, not their planet's equator | — |

The ephemeris is exactly self-consistent (the sim's free-fall physics agrees with the rails). It is not astronomically accurate, and it is 2D. `bodyfacts.js` keeps the real numbers for the encyclopedia sheet only: "the charts hold every orbit to a circle in the plane: the figures the game flies are the ephemeris'" (`bodyfacts.js:7-10`). Ceres and Pallas share a = 2.77 AU, so they keep a fixed angular separation forever.

### Body data table (longhaul values; derived columns computed by scratch script from longhaul's own functions)

GM in km³/s². Mass = GM/G with G = 6.674e-11. g = GM/R². v_esc = √(2GM/R). Solar day from `worlds.js solarDayH(body)` = 1/|1/rot − 1/year| (a moon's year is its planet's).

| Body | Orbit a | Period | R km | GM | Mass kg | g m/s² | g (G) | v_esc km/s | Rot h | Solar day h | Atmosphere (kPa, H km, interface km) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Sol | — | — | 696,000 | 1.327e11 | 1.988e30 | 274.0 | 27.9 | 617.5 | 609.1 | — | — |
| Mercury | 0.387 AU | 87.94 d | 2,440 | 22,032 | 3.30e23 | 3.701 | 0.377 | 4.25 | 1,407.5 | 4,225.7 | none |
| Venus | 0.723 AU | 224.5 d | 6,052 | 324,859 | 4.87e24 | 8.869 | 0.904 | 10.36 | −5,832.5 | 2,801.0 | 9,200 / 15.9 / 250 |
| Earth | 1.000 AU | 365.26 d | 6,371 | 398,600 | 5.97e24 | 9.820 | 1.001 | 11.19 | 23.934 | 24.000 | 101.3 / 8.5 / 120 |
| Luna | 384,400 km | 27.32 d | 1,737.4 | 4,904.9 | 7.35e22 | 1.625 | 0.166 | 2.38 | 655.7 | 708.7 | none |
| **Mars** | 1.524 AU | 687.19 d | 3,390 | 42,828 | 6.42e23 | **3.727** | **0.380** | 5.03 | 24.623 | **24.660 (sol)** | **52 / 19 / 160 (terraformed)** |
| Phobos | 9,377 km | 0.319 d (7.66 h) | 11.1 | 7.11e-4 | 1.07e16 | 0.006 | 0.0006 | 0.01 | 7.656 | 7.66 | none |
| Deimos | 23,460 km | 1.263 d (30.3 h) | 6.2 | 9.8e-5 | 1.47e15 | 0.003 | 0.0003 | 0.01 | 30.31 | 30.37 | none |
| Jupiter | 5.203 AU | 4,334.9 d (11.87 y) | 69,911 | 1.267e8 | 1.90e27 | 25.92 | 2.643 | 60.2 | 9.925 | 9.926 | 1-bar at R / 27 / 1,000 (giant) |
| Io | 421,800 km | 1.769 d | 1,821.6 | 5,959.9 | 8.93e22 | 1.796 | 0.183 | 2.56 | 42.46 | 42.47 | none |
| **Europa** | 671,100 km | 3.551 d | 1,560.8 | 3,202.7 | 4.80e22 | **1.315** | **0.134** | 2.03 | 85.22 | **85.29** | none (O₂ trace) |
| Ganymede | 1,070,400 km | 7.155 d | 2,634.1 | 9,887.8 | 1.48e23 | 1.425 | 0.145 | 2.74 | 171.7 | 172.0 | none |
| Callisto | 1,882,700 km | 16.69 d | 2,410.3 | 7,179.3 | 1.08e23 | 1.236 | 0.126 | 2.44 | 400.6 | 402.1 | none |
| Saturn | 9.537 AU | 29.45 y | 58,232 | 3.793e7 | 5.68e26 | 11.19 | 1.141 | 36.1 | 10.656 | 10.656 | giant / 59.5 / 1,000 |
| Titan | 1,221,870 km | 15.95 d | 2,574.7 | 8,978.1 | 1.35e23 | 1.354 | 0.138 | 2.64 | 382.8 | 383.4 | 146.7 / 40 / 600 |
| Mimas, Enceladus, Tethys, Dione, Rhea, Iapetus | 185k–3.56M km | 0.94–79.3 d | 198–764 | 2.5–154 | 3.8e19–2.3e21 | 0.06–0.26 | 0.007–0.027 | 0.16–0.63 | locked | — | none |
| Uranus | 19.19 AU | 84.1 y | 25,362 | 5.79e6 | 8.68e25 | 9.01 | 0.919 | 21.4 | −17.24 | 17.24 | giant / 27.7 / 1,000 |
| Neptune | 30.07 AU | 164.9 y | 24,622 | 6.84e6 | 1.02e26 | 11.28 | 1.150 | 23.6 | 16.11 | 16.11 | giant / 19.7 / 1,000 |
| Ceres | 2.77 AU | 1,683.9 d (4.61 y) | 470 | 62.63 | 9.38e20 | 0.284 | 0.029 | 0.52 | 9.074 | 9.076 | none |
| Vesta | 2.36 AU | 1,324.2 d | 263 | 17.29 | 2.59e20 | 0.250 | 0.026 | 0.36 | 5.342 | 5.343 | none |
| Pallas | 2.77 AU | 1,683.9 d | 256 | 13.63 | 2.04e20 | 0.208 | 0.021 | 0.33 | 7.813 | 7.815 | none |
| Hygiea | 3.14 AU | 2,032.3 d | 217 | 5.78 | 8.7e19 | 0.123 | 0.013 | 0.23 | 13.83 | 13.83 | none |
| Juno | 2.67 AU | 1,593.5 d | 123 | 1.82 | 2.7e19 | 0.120 | 0.012 | 0.17 | 7.21 | 7.21 | none |
| Interamnia | 3.06 AU | 1,955.2 d | 166 | 2.5 | 3.7e19 | 0.091 | 0.009 | 0.17 | 8.73 | 8.73 | none |

Other per-body fields: `color` (hex), `rings` (Saturn), `moons`, `parent`, `type` (`star | planet | moon | asteroid`).

**Mars in longhaul is terraformed** (`ephemeris.js:35-36`, `bodyfacts.js:42-44`, `worlds.js:104`): "two centuries into its terraforming".
- Air: 52 kPa of N₂ 58%, O₂ 32%, CO₂ 8%, Ar 2% (O₂ partial 16.6 kPa, "as on an Earth mountain at 2,500 m"), scale height 19 km.
- "Breathable on the low ground… thin and cold; dust storms still."
- "A shallow young sea fills the northern plains, Hellas holds a lake… the cities are still domed against the cold, the radiation and the storms."
- About 4 billion people; mean temperature −25 °C (min −100, max 28).
- No global magnetic field: "the domes keep out the radiation".
- Olympus Mons 22 km.

This was introduced in longhaul v1.6.0 (2026-10-25 commit: "Mars terraformed (52 kPa, breathable on the low ground, a northern sea)"). It **departs from Expanse canon**, where Mars is not yet breathable: about 0.6 kPa of CO₂, life in domes and underground, terraforming a centuries-long project. This is a key open question for OLYMPUS, whose itch is air management (§18).

Mars air density by height (longhaul `atmosphere()`, ρ₀ = P/(gH) = 0.734 kg/m³):

| h km | 0 | 5 | 10 | 20 | 40 | 80 | 160 |
|---|---|---|---|---|---|---|---|
| ρ kg/m³ | 0.734 | 0.565 | 0.434 | 0.256 | 0.090 | 0.011 | 0.0002 |
| P kPa | 52.0 | 40.0 | 30.7 | 18.2 | 6.3 | 0.77 | 0.01 |

Other ρ₀: Earth 1.21, Venus 65.2, Titan 2.71. Giants' 1-bar level: Jupiter 0.143, Saturn 0.150, Uranus 0.401, Neptune 0.450.

---

## 3. Gravity (`js/sim/gravity.js`, 161 lines)

**Who pulls** (`:39-44`). The Sun always pulls (GM_SUN/r², computed inline). Every other body with mass counts within its `reach = 3 × SOI`, where SOI = a·(m/M_parent)^0.4 (Laplace sphere of influence; the parent is the planet for moons). "Beyond, its pull is micro-G and the Sun's tide on the pair matters more" (`:13-15`). Each body also gets a ground look-out radius `see = max(3·SOI, 20·R)`.

Computed reaches (3×SOI): Earth 2.77 M km, Luna 198,583 km, Mars 1.73 M km, Phobos 22 km, Deimos 25 km, Jupiter 144.6 M km, Europa 29,176 km, Ganymede 73,049 km, Callisto 113,043 km, Ceres 231,246 km, Titan 129,964 km.

**When.** Body positions are taken at the moment asked. `gravityAt(x, y, minute = epoch, out)` (`:80-102`) uses a per-whole-minute cache of all massive bodies' positions and velocities (`bodiesAt`, at most 9 minutes cached, `:54-64`). Inside a minute, body positions are carried on linearly with their velocity. The comment says "a body's path bends by metres in a minute"; for Phobos round Mars the bend is about ½·0.487·60² ≈ 880 m, still inside its tiny reach. Integrators pass the time; the minute tick calls `setGravityEpoch(minute)` for those that don't (`:48`, `game.js:260`). Reason (`:7-11`): "a ship beside Ceres and Ceres itself both move 18 km/s round the Sun, and a minute's error in Ceres' place would be a thousand kilometres."

**The pull.** For each body in reach, `g = GM/max(r, R)²` along the line to its centre: inside the rock it is clamped to the surface value, so there is no singularity (`:95`). The sum is returned in m/s².

Functions:
- `nearestSurface(x, y, minute)` (`:109-126`) → `{body, alt (m), r, ux, uy (unit from centre), vel (body velocity), spin (rad/s), center}`, or null. Used by terrain, guard, landing.
- `surfacePoint(body, ang, minute)` (`:129-136`): position and velocity of a body-frame surface point (velocity includes `spin × R`).
- `pullAt(body, rM)`.
- `syncRadiusM(body, periodS) = ∛(GM·T²/4π²)`.
- `pullOf(bodyName, x, y, minute)`: one body's pull or null outside its reach.
- `reachOf(body)`.

**Holding costs** (FLIGHT.md §Gravity, `autopilot.holdStep`). The thrust needed to hold a place = (the place's own acceleration) − (gravity there). A free Keplerian orbit costs 0. Hovering at Ceres' 100 km gate costs 0.0175 G (on the RCS when the drive is down; RCS gives 0.02 G). Resting on the ground costs 0.

**Reference numbers:**
- Sun's pull: 1 AU 5.93e-3 m/s² (6.0e-4 G); Mars 2.55e-3; Ceres 7.7e-4; Jupiter 2.19e-4 m/s².
- Jupiter at Europa's orbit: 0.281 m/s².
- Mars at Phobos' orbit: 0.487 m/s²; at Deimos' 0.078 m/s².
- From FLIGHT.md: Ceres 0.019 G at its port's gate, Luna 0.014 G at the yards' orbit, Jupiter 0.011 G at Ganymede.

**Cost.** About 30 bodies, culled by squared reach on cached positions, so it is "cheap enough for every integrator step". Longhaul runs 200k entities at about 6 ms per game-minute (ARCHITECTURE.md:91). Gravity is not the bottleneck; spatial queries and DOM are (the user's "Build for scale" memory: "gravity/physics math is cheap, spatial queries and DOM are the bottlenecks").

**Purity.** Depends only on `ephemeris.js` and constants. It has module state (`epoch`, the cache), which is deterministic. **Portable as-is.**

---

## 4. Worlds: a planet's or big moon's space (`js/sim/worlds.js`, 425 lines)

A *world* is a planet, or a moon at least `WORLD_MIN_RADIUS_KM = 1000` across (14 worlds). Asteroids and small moons are "the stations' business". `worldOf(body)` (`:129-156`) caches `{R, GM, g, gG, escapeMS, hillM, wellM, low:[m,m], sync, syncWhy, floorM, atmo, parkM, authority, rotS}`.

Constants (`:75-84`):
- `WELL_G = 0.01` G: planetary space ends where the pull falls to this, which is half the RCS authority, so inside it a ship can't hold on thrusters.
- `HILL_SHARE = 0.5`, `MIN_WELL_R = 1.5` radii, `LOW_TOP_R = 1.33`, `LOW_CLEAR_M = 20,000`, `PARKING_SHARE = 0.92`, `STATIONARY_BAND = 0.02`, `SUTTON_GRAVES_K = 1.7415e-4`.

Formulas:
- `hill = a·∛(GM/3GM_parent)`
- `well = max(1.5R, min(√(GM/(0.01·G0)), 0.5·hill))`
- `low = [floor + 20 km, max(floor + 40 km, 1.33R)]`, where floor = R + interface height
- `sync = ∛(GM·T_rot²/4π²)` if it lies between the top of low orbit and the well, else null with a reason
- `park = 0.92·well`

| World | g (G) | Planetary space edge km | Parking orbit km (from centre) | Low orbit km (from centre) | Stationary km | Circular speed / period at low[0] | Airspaces |
|---|---|---|---|---|---|---|---|
| Earth | 1.001 | 63,754 | 58,654 | 6,511–8,473 | 42,164 | 7.82 km/s, 87 min | 11 |
| Luna | 0.166 | 7,072 | 6,506 | 1,757–2,311 | — | 1.67, 110 min | 3 |
| **Mars** | 0.380 | 20,898 | 19,226 (orbit 11 h) | 3,570–4,509 | 20,428 | 3.46 km/s, 108 min | 6 |
| Jupiter | 2.643 | 1,136,593 | 1,045,665 | 70,931–92,982 | 160,009 | 42.3, 176 min | 0 |
| Io | 0.183 | 5,279 (Hill-limited) | 4,857 | 1,842–2,423 | — | 1.80, 107 min | 0 |
| **Europa** | 0.134 | 5,715 | 5,258 | 1,581–2,076 | — | 1.42 km/s, 116 min | 3 |
| Ganymede | 0.145 | 10,041 | 9,238 | 2,654–3,503 | — | 1.93, 144 min | 5 |
| Callisto | 0.126 | 8,556 | 7,872 | 2,430–3,206 | — | 1.72, 148 min | 4 |
| Titan | 0.138 | 9,568 | 8,803 | 3,195–3,424 | — | 1.68, 200 min | 5 |
| Venus, Mercury, Saturn, Uranus, Neptune | | 57,556; 14,989; 621,925; 243,067; 264,033 | | | giants have one | | 0 |

**Layers** (`layerOf`, `:191-199`): `space` (outside) → `high` → `stationary` (±2% of sync) → `low` → `atmosphere` (below the interface) → `surface`. `worldAt(x, y, minute)` returns the innermost world whose well contains the point (a moon's inside its planet's).

**Air.**
- `airOf` (`:166-172`): ρ₀ = P/(g·H), hydrostatic.
- `atmosphere(w, alt)` (`:175-180`): `ρ = ρ₀·e^(−h/H)`, `P = P₀·e^(−h/H)`; nothing above the interface; a giant's radius is its 1-bar level.
- `airVelocity` (`:227-231`): the air turns with the world (`v_body + ω×r`), so drag uses speed relative to the air.
- `dragAccel(ρ, v, β) = ρv²/(2β)` with ballistic coefficient β = m/(Cd·A) (`:238`).
- `ballisticOf(hull, m) = m / max(1, L·max(W,H)·0.6)` (broadside, Cd ≈ 1).
- `entryHeat(ρ, v, r_nose = 2) = 1.7415e-4·√(ρ/r_n)·v³` W/m² (Sutton–Graves, Earth-air constant used everywhere).
- `airDrag(state, dt)` (`:410-425`) solves dv/dt = −ρv²/2β exactly over the step: `v₁ = v/(1 + k·v·dt)`, k = ρ/2β, "a dense layer can't overshoot". It stores `$air = {ρ, pa, v, q, heat, dragG}` for display. Heat is "told, not taken": no ship hull is rated for air.

**Ground** (`:248-355`):
- `AIRSPACE_KM = 3500`; each settled world's equator is divided into `n = max(2, round(2πR/3500 km))` airspaces, named per world (Mars: Meridiani, Syrtis, Elysium, Amazonis, Tharsis, Mariner Valley; Europa: Conamara, Pwyll, Thera).
- Each airspace has an authority (`GROUND_CONTROL`: Earth and Luna UN; Mars and Callisto MCR; Ganymede independent; Europa and Titan OPA), a controller ("Planetary Traffic" for Mars, "Ice Control" for Europa) and a spaceport at a hashed angle within its arc.
- `groundAngle` / `worldAngle` convert between body frame and plane at a minute.
- `groundPoint(w, ang, minute, upM)`.
- `proceduralSite(w, seed)`: a deterministic site with a kind (camp, mine, outpost, research station, settlement, crash site, relay mast, depot), a syllable name and an airspace.
- `solarDayH(body)`.

Note the 1D "equator" model: the ground is a circle, with no latitude.

**Dependencies.** The physics half (`worldOf`, `atmosphere`, `dragAccel`, `entryHeat`, `orbitSpeed`, `orbitPeriodS`, `layerOf`, `worldAt`, `airVelocity`, `solarDayH`, airspaces, `proceduralSite`) depends only on `ephemeris.js`. The module also imports `FACTIONS`, `hullOf` and `PLAYER_CLASS` for `controlWords`, `airDrag` and `worldsTick`. **Adapt:** split into a pure `worlds-physics` module plus game glue.

---

## 5. Ship flight dynamics (`js/sim/flight.js`, 202 lines)

"The ship is a point mass with an attitude. The Epstein drive pushes along the nose (`facing`); turning the nose takes time (RCS slew)."

| Constant | Value | Meaning |
|---|---|---|
| `SLEW_RATE` | π/6 rad/min | a full 180° flip in 6 min (`FLIP_MINUTES`) |
| `RCS_MAX_G` | 0.02 G | RCS translation without turning |
| `ALIGN_TOL` | 8° | the drive fires only within this of the command; a lit lean turns no faster than 8°/min |
| `LEAN_MAX` | 30° | guidance commands this far off the nose are leaned to with the drive lit |
| `FUEL_PER_G_MIN` | 0.05 kg/(G·min) | main drive |
| `RCS_FUEL_PER_G_MIN` | 0.6 kg/(G·min) | RCS, about 12× worse |
| `DRIVE_MAX_G` | 10 G | default limit; the class sets its own (MCRN corvette 12, frigate 10, destroyer 8, battleship 5) |
| `FLIP_TURN` | 2.4 rad (137.5°) | a turn this big from rest is a flip and throws the unstrapped |
| `RATED_G` | 7 | default rating; class rating = 0.7 × class max (`ship-classes.js:550 ratedG`) |

**State** (`createFlight`, `:36-49`): `{pos (AU), vel (m/s), facing (rad), thrustG, rcsG, turning, maxG, hold, leaving, manual}`.

**`flightStep(f, cmd, dtMin = 1)`** (`:102-189`). The command is `{ax, ay}`, a desired *non-gravitational* acceleration (m/s², solar frame), with optional `maxG`, `face` (attitude wanted) and `lean`.
1. If |cmd| ≤ RCS max: RCS translation, with the nose optionally slewing to `face`.
2. Else, if `lean` is set and the command is within 30° of the nose (and the ship is not mid-swing): turn at most 8°/min. The drive gives `max(0, min(cmd·nose, aMax))` along the nose, and RCS trims the remainder up to 0.02 G.
3. Else: a real turn at full slew rate with the drive cold. Once within 8°, the drive fires for the fraction of the minute left after the turn: `frac = 1 − (startErr − 8°)/slew/dt`. A turn already near 180° keeps its direction so it does not dither.
4. Integrate.

**Integrator** (`integrate`, `:82-90`): velocity-Verlet over `dt = 60 s`, gravity re-evaluated at the new position and `t0 + dt/60`. Symplectic, second order. One step per game minute. `world.stepFree` (`world.js:176`) is the same for NPC free flight, and `propagateFree` takes bounded substeps (1 min under thrust, 10 min coasting).

**Machinery caps** (FLIGHT.md, `game.js:272-285`):
- A damaged drive or reactor cooling caps at 3 G; dead cooling 0.3 G; hull under 50% 3 G; an open breach 1 G.
- 0.1 G inside a station's gate (traffic control).
- **The standing order: never past 1.5 G with anyone unsecured**, unless overridden.
- Above the rated G: double fuel, and each minute risks a containment failure with P = 0.00012·(g − rated)² (`game.js:382`).

**Fuel model** (`fuelUsed`, `:199-202`): `kg = ((mainG + max(0, mainG − rated))·0.05 + rcsG·0.6)·dtMin`. It is independent of ship mass. The player's tank is 10,000 kg (start 8,500, `game.js:112`). Shuttles scale it by mass: `kg = gMin·0.05·m/1e5` (`shuttles.js:391`).
- Physical reading: a 2,800 t corvette at 1 G for a minute gains 588 m/s, which means 1.65e9 N·s of momentum from 0.05 kg of propellant. That needs v_e ≈ 3.3e10 m/s, faster than light.
- So the model is a pure **game abstraction** ("reaction mass" as a budget), not a rocket equation.
- For scale: a 1 G Mars–Ceres brachistochrone needs Δv ≈ 2,800–5,000 km/s (1–1.7% c). With a mass ratio of 2 that needs v_e ≈ 4,000–7,000 km/s.
- If OLYMPUS wants physical endurance figures for the background, it needs a real v_e parameter (open question).

**Purity.** Depends on `gravity.js` only. **Portable as-is** for NPC ship tactical simulation. The control model (nose and lean) is tuned for a ship you command.

---

## 6. Guidance (`js/sim/guidance.js`, 681 lines, pure functions)

The same `guidanceStep` (in nav.js) drives the live autopilot, the planner's fast-forward estimate and NPC ships, "so previews match what actually flies".

**Constants:**
- `BRAKE_MARGIN = 0.85`: braking is planned at 85% of the available thrust.
- `ARRIVE_SPEED = 3` m/s.
- `TERMINAL_RANGE = 25,000` m (the last 25 km on RCS).
- `RCS_PLAN_A = 0.7 × RCS`.
- `SWEEP_DRIVE = 8°/min`, `SWEEP_PLAN = 6°/min`.
- `LATERAL_MAX_S = 3600`.
- `HOLD_RCS_A = 0.8 × RCS`.
- `FULL_FLIP_S = (π − 8°)/slew·60`.
- `TERMINAL_V` ≈ 80 m/s (the speed RCS can still stop from at 25 km).
- `arrivalTolerance(standoff) = max(100 m, 2% of standoff)`.

**`relativeState(flight, target)`** (`:76-110`): range, line-of-sight unit, relative velocity, closing speed. It also computes the feed-forward `ff`: how the target frame accelerates relative to free fall at our position. For a rails target that is its total acceleration minus the gravity at us; for a free target it is the gravity difference plus its thrust. It also handles **swings**, the periodic parts of rails motion (a station circling a moon, the moon circling its planet), with the shared pull subtracted.

**Closing law** (`closingLaw`, `:350-553`) works in the target's frame. Each minute it commands the relative velocity that heads for the stop point at the largest speed it can still brake from.
- **Whole-step braking** (`stepStopSpeed`, `:163-171`): the drive acts once a minute, and at 10 G a minute sheds 5.9 km/s. The braking curve is built from whole one-minute burns ending exactly on the mark, not √(2ad), and each step aims where the curve will be when the step ends (`aimSpeed`, bisection, `:219-227`).
- **Committed flips**: a braking curve computed with the turn the nose still has to make, and a burning curve computed as if a whole flip were still ahead. The ship coasts between them, finishes a half-done flip, and turns back from braking attitude only if more than 3% short.
- **Hold turn** (`holdTurn`, `:250-279`): if holding on the target needs more than RCS (a target under thrust, a station circling a moon), the brake ends with a planned "swing" (drive idle, the nose comes round while the target's pull brakes) or "sweep" (drive lit, like a gravity turn, planned at 6°/min).
- **Swings by period** (`swingShare`): a periodic motion is followed only once the time to go is short against its period, fully at a quarter period.
- **Drive sharing**: sideways first.
- **Lit flip**: when the sideways pull exceeds 25% of the drive and the flip is under 120°.
- **Terminal**: on RCS.

**Keep law** (`keepLaw`, `:573-628`) puts the ship onto a point and keeps it there from any state. It plans nothing. When settled it does a critically damped RCS pull-back: `c = (d/T − 2v)/T`. It flies stances and the near zone (within `NEAR_M = 100 km` of the stop point when the target's pull needs the drive or the approach opens at more than 50 m/s; it hands back beyond 200 km).

**Transfer law** (`transferLaw`, `:661-681`): Lambert to where the target will be at the arrival time. Burn to v₁ (capped at aMax per minute), coast with hourly correction checks (the corrections are skipped under 0.5 m/s), and hand over to the closing law when braking is due, with 60 min to go, or within 0.002 AU.

**Lambert** (`lambert.js`, 119 lines): Curtis §5.3 universal variables, 2D, prograde (counterclockwise) single revolution. It brackets and bisects on z with Stumpff C and S, and returns `{v1x, v1y, v2x, v2y}` or null. Arcs whose perihelion is inside `rpMin` and actually traversed are rejected (default `MIN_PERIHELION = 0.15 AU`; planetary use passes 0). **Pure; portable as-is.**

**Measured quality** (`tests/guidance.test.mjs`, run 2026-11-05). From Ceres Station:

| Target | 0.3 G | 10 G |
|---|---|---|
| Phobos Yard (Mars) | 17,207 min (11.95 d) | 2,837 min (1.97 d) |
| Vesta | 17,529 min | 3,031 min |
| Pallas | 15,237 min | 2,656 min |
| Luna Yards | 12,203 min | 2,107 min |
| Ganymede Station | 17,277 min | 3,003 min |

- "10G dash, 50,000 km: 36 min" against an ideal 24 (the flip takes 6, the RCS docking about 9).
- The analytic brachistochrone for the 4.231 AU Ceres–Mars distance at epoch is 10.7 d at 0.3 G and 1.86 d at 10 G, so **guidance overhead is about +6% to +12%**.
- `tests/flight.test.mjs`: "3G express to Mars arrives: 3.55 days, fuel 702 kg" (analytic 3.40 d).
- Estimate against live flight agrees within 1% (Ceres→Vesta 1 G: est 158.7 h / 435.7 kg, live 158.6 h / 435.5 kg).

---

## 7. Navigation (`js/sim/nav.js`, 856 lines)

**Targets** (`:43-59`): `body | entity | player | slot | orbit | surface | port | fix`.

`STANDOFF` (m, `:33-41`): STATION 3,000; GATE 1,000; SHIP / TACTICAL 1,900 (inside a suit's 2 km EVA reach); SCANNER 0.1 AU; CLOSE 100,000 km; SLOT 200. A body's default standoff is max(2,000 km, 3R).

**`targetStateAt(state, target, minute, live)`** (`:128-234`) gives position, velocity and acceleration for every kind. Rails targets supply `atx/aty` (total acceleration, averaged over the coming minute) and `swings`. **`targetTracker`** (`:241-262`) is a monotonic predictor for fast-forward: rails targets are exact, free targets are stepped from a private copy (1 min under thrust, 30 min coasting).

**Route options** (`planRoutes`, `:747-788`; defs `:727-741`):

| Option | Profile | Description (user-facing text in longhaul) |
|---|---|---|
| EXPRESS | 3 G brachistochrone | "Hard burn, flip, hard brake. Fastest, crew on juice the whole way." |
| STANDARD | 1 G | "Earth-normal gravity throughout. Comfortable and quick." |
| BELTER | 0.3 G | "Belter standard: easy on bodies and drive. Slow but gentle." (added 2026-03-28 "feat: Belter Standard 0.3G brachistochrone transfer option") |
| ECONOMY | 0.3 G burn, coast at cruise = max(500 m/s, 0.3·√(d·a)) | "Short burns, long coast at cruise speed. Saves reaction mass." |
| BALLISTIC | Lambert, minimum-Δv arrival (`findTransfer`: 49 log-spaced arrival times from 2 d to min(500, max(30, 1.6 × Hohmann)) days) | "Minimum fuel, very long transit." |
| COMBAT 5G / ASSAULT 7G / FLANK 10G | battle stations only | FLANK: "Past rated limits. High-dose juice…, stroke risk, a crash of a week or more afterwards, double fuel above 7G…" |

`PREP_MINUTES = 10` to strap in. `roughMinutes = 10 + (econ ? 1.6 : 1)·2√(d/a)/60`. An option is feasible if the estimate arrives and fuel ≤ 95% of what is aboard. The planner refuses routes into a world's air ("Would enter Earth's atmosphere: our hull isn't rated for one") or onto a rock ("Would come down on Mars").

**Estimation** (`simulatePlan` / `planRun`, `:573-652`): flies the plan forward minute by minute with the same `guidanceStep` + `terrainGuard` + `flightStep`, 30-minute coarse steps on long ballistic coasts more than 0.05 AU away, a cap of 2 years or 400,000 steps. `outrun` stops early when the target out-accelerates us and is ahead and opening. **`planRun` is sliceable:** the UI flies about 3 ms of it per frame, so "no route holds up the picture" (v1.12.6, 2026-10-25). This is a good pattern for OLYMPUS's background voyage planner.

**Port speed caps** (`portSpeedCap`, `:411-418`): v ≤ √(v_limit² + 2·0.85·a·(d − d_zone)) for the approach (3,000 m/s × 0.9 beyond `APPROACH_M`), the gate (200 m/s × 0.9 inside the keep-out), and round small rocks (1,000 m/s within 5 radii, or 3× local orbital speed), with a 150 s look-ahead.

**Round a rock** (`viaPoint`, `:308-338`): a waypoint 4 radii out, half-way round toward the target's side, advanced 60° each time it is reached with the target still hidden; let go after 3 clear minutes. `keepOutVia` does the same round a station's keep-out at 2.5 keep-outs.

**Parking and stationary targets** (`:664-685`): a free circular-orbit target at the world's parking radius, phased to be on our side at the estimated arrival; or at the stationary radius over an airspace's port.

**Departure leg** (`departMinutes`, `DEPART_OUT = 1.05` approaches): an RCS-only exit from a port before the torch lights. About 1 h 45 min from a berth at Ceres.

**Coupling.** Imports world.js, holding, worlds, traffic-control, terrain, flight, ship-classes, guidance, stance, lambert, docking, flags, intel, service. **Reference only.** Lift the target-state and estimator patterns, not the module.

---

## 8. Autopilot, crew safety and time warp (`js/sim/autopilot.js`, 694 lines)

**Route lifecycle:**
- `prepare`: all hands to couches, pilot to the helm, drone home. It engages when everyone able is in, or on the captain's override.
- `depart`: the RCS out of a port.
- `active`: guidance, re-planned every minute.
- `arrive`: hold station.

`holdStation` pins an offset, kept in the rotating frame (up and along) for targets going round a body. `holdStep` returns the G needed to hold it; free orbits give 0, and a surface hold returns 0 ("the ground holds us").

**Crew safety** (FLIGHT.md §Autopilot; `crewPolicy`, `:620-647`). The crew are 'secure' (to the couches) when:
- battle stations are on;
- thrust is above 1.5 G (or a hold burn above 1.5 G);
- preparing, or a turn is held;
- a burn above 1.5 G (for a stance or burn display);
- flip or orient;
- **within 30 min of a flip**;
- **the first 10 min after ignition**;
- **the last hour of an approach** (`ENDGAME_S = 3600`, counted on relative speed either way), the near zone, RCS terminal.

They are free on long steady burns and coasts (below 1.5 G). Hysteresis: `SECURE_LINGER` (`game.js`).

**Flip interlock** (`flipInterlock`, `:134-155`): a flip from rest (turn > `FLIP_TURN`) is **held** with the drive cold and warp off while anyone able is on their feet, until they are in, until the captain orders FLIP NOW, or for `TURN_HOLD_MAX_MIN = 30` min. It is never held when running from a torpedo, or when falling with the ground under 10 min away (`TURN_GROUND_S`). "A walk to the couches can take a quarter of an hour." Lights flash with "MANEUVERING — SECURE ALL HANDS".

**Time warp** (`maxSpeed` / `flightSpeedLimit`, `:661-693`). Speeds 0, 1 (1 min/s), 2 (1 h/s), 3 (1 day/s).
- 1× during: battle stations, hand-flown docking, prepare, helm unmanned, flip/orient/turn held, stance evade/guard/ready, within 15 min of a flip, first 5 min after ignition, approach, ETA < 45 min, manual throttle.
- 2× while burning or hand-flown.
- 3× only when coasting with the flip > 6 h away and the ETA > 12 h.
- The tactical picture caps it further (`$combatWarp`).

`GameLoop.frame` (`game.js:566-625`): `acc += dt·SPEED_MIN_PER_SEC[speed]`; it runs whole `minuteTick`s, at most 3,000 per frame. Intermediate minutes at 1 day/s are "lite" (they skip sensor and world refresh; the frame's last minute catches up). Warp limits apply immediately inside the loop. During an inertial event game time is frozen and the event plays in real time. Docking runs at second resolution (`PROX_RATES`) inside the minute. `alpha` (the fraction of the next minute) is passed to the renderer for interpolation.

Coupling: crew-ai, docking, sensors, traffic control, systems. **Reference only.** The policies (couch triggers, flip holding, warp gating) transfer directly to OLYMPUS as *what the soldier experiences aboard a transport*: called to couches 30 min before the flip, 6 min of free fall at the flip, burns at 0.3–1 G walking about, 1.5 G and above strapped in on juice.

---

## 9. Typical transit times (real numbers)

Analytic constant-G brachistochrone from rest to rest: **t = 2√(d/a)**, **v_peak = √(a·d)**, **Δv = 2√(a·d) = a·t**. Longhaul's flown times add about 6–12% (flip, terminal approach, port caps; §6).

Distances are sampled daily over 30 years of longhaul's ephemeris (circular orbits). Median distance is used for the headline. "Longhaul fuel" is the abstract 0.05 kg/(G·min) figure at the median.

| Route | Distance AU (min / med / max) | 0.3 G | 1 G | 3 G | 5 G | Peak v at med (1 G) |
|---|---|---|---|---|---|---|
| Mars–Earth | 0.524 / 1.828 / 2.524 | 3.8 / 7.1 / 8.3 d | 2.1 / 3.9 / 4.5 d | 28.7 h / 2.2 / 2.6 d | 22.2 / 41.5 h / 2.0 d | 1,638 km/s |
| Mars–Ceres | 1.246 / 3.151 / 4.294 | 5.8 / 9.3 / 10.8 d | 3.2 / 5.1 / 5.9 d | 44 h / 2.9 / 3.4 d | 34 h / 2.3 / 2.6 d | 2,150 km/s |
| Mars–Vesta | 0.836 / 2.891 / 3.884 | 4.8 / 8.9 / 10.3 d | 2.6 / 4.9 / 5.6 d | 36 h / 2.8 / 3.3 d | 28 h / 2.2 / 2.5 d | 2,060 km/s |
| **Mars–Jupiter / Europa** | 3.675 / 5.475 / 6.731 | **10.0 / 12.2 / 13.5 d** | **5.5 / 6.7 / 7.4 d** | 3.2 / 3.9 / 4.3 d | 2.5 / 3.0 / 3.3 d | 2,834 km/s (Δv 5,668 km/s = 1.9% c) |
| Mars–Saturn | 8.01 / 9.67 / 11.06 | 14.8 / 16.2 / 17.4 d | 8.1 / 8.9 / 9.5 d | 4.7 / 5.1 / 5.5 d | 3.6 / 4.0 / 4.3 d | 3,766 km/s |
| Earth–Ceres | 1.770 / 2.924 / 3.770 | 6.9 / 8.9 / 10.1 d | 3.8 / 4.9 / 5.6 d | 2.2 / 2.8 / 3.2 d | | |
| Earth–Jupiter | 4.20 / 5.28 / 6.20 | 10.7 / 12.0 / 13.0 d | 5.9 / 6.6 / 7.1 d | 3.4 / 3.8 / 4.1 d | | |
| Ceres–Europa | 2.43 / 5.92 / 7.98 | 8.1 / 12.7 / 14.7 d | 4.5 / 7.0 / 8.1 d | 2.6 / 4.0 / 4.7 d | | |

Longhaul fuel at the median (abstract kg): Mars–Europa 264 kg at 0.3 G, 482 at 1 G, 834 at 3 G. Mars–Ceres 200 / 365 / 633 kg.

Slower profiles, which are what "travel taking a long time" needs (median distances; econ = 0.3·√(d·a) cruise, longhaul's ECONOMY rule: t = d/v_c + v_c/a ≈ 1.82× the brachistochrone):

| Route (median) | 0.05 G brach | 0.1 G brach | 0.1 G econ | 0.3 G econ | Coast 200 km/s | Coast 50 km/s | Hohmann |
|---|---|---|---|---|---|---|---|
| Mars–Earth 1.83 AU | 17.3 d | 12.2 d | 22.2 d (cruise 155 km/s) | 12.8 d | 15.8 d | 63 d | 259 d |
| Mars–Ceres 3.15 AU | 22.7 d | 16.0 d | 29.2 d | 16.8 d | 27.3 d | 109 d | 575 d |
| Mars–Jupiter 5.48 AU | 29.9 d | 21.2 d | 38.4 d | 22.2 d | 47.4 d | 190 d | 1,127 d |
| Mars–Saturn 9.67 AU | 39.8 d | 28.1 d | 51.1 d | 29.5 d | 83.7 d | 335 d | 2,375 d |
| Earth–Luna 384,400 km | 15.6 h | 11.0 h | 20.0 h | 11.5 h | 0.5 h | 2.1 h | |
| 15,000 km (Mars orbit hop) | 3.1 h | 2.2 h | 3.9 h | 2.3 h | | | |

Hohmann Δv (heliocentric only): Mars→Earth 2.65 + 2.95 km/s; Mars→Ceres 3.28 + 2.82; Mars→Jupiter 5.88 + 4.27; Mars→Saturn 7.56 + 4.58.

Longhaul's own printed times from Ceres (tests, 2026-11-05 run):
- Ceres→Pallas: EXPRESS 3.39 d / 660 kg (peak 3,884 km/s); STANDARD 5.85 d / 382 kg; BELTER 10.62 d / 209 kg; ECONOMY 18.55 d / 67 kg (peak 385 km/s).
- Ceres→Vesta: ballistic 499.9 d / 6.6 kg against STANDARD 436.8 kg.
- Ceres→Mars: 3 G 3.55 d / 702 kg.

Synodic periods (launch-window and distance cycles): Mars–Earth 780 d (2.13 y), Mars–Ceres 1,161 d, Mars–Jupiter 817 d, Mars–Saturn 734 d, Earth–Jupiter 399 d. Relative heliocentric velocities to match: Mars–Earth 5.7–53.9 km/s, Mars–Jupiter 11–37 km/s, small next to the peak speeds.

Light lag (useful for comms realism): Mars–Earth 4.4–21 min; Mars–Jupiter 31–56 min (499 s per AU).

**Implication for OLYMPUS.** With Expanse drives, a troop transport Mars→Europa is about 6–7 days at 1 G or 12 days at 0.3 G. That is long in real time for a player, but not months. The user's "travel taking a long time" and "days to months" point at: a military transport at 0.3 G (12 days, crew walking about at a third of a G, the gravity a Martian is used to); a cheaper 0.1 G burn-and-coast (about 5 weeks); a slow freighter (months). The transit is a time-skip activity with interruptions (§16).

---

## 10. Terrain and landing (`js/sim/terrain.js`, 377 lines)

**Constants:**
- `TOUCH_MS = 2` m/s: a touch, no harm.
- `LOST_MS = 50` m/s: the whole hull.
- Damage share = min(1.2, ((v − 2)/48)²) of hull points. A giant always destroys (pressure).
- `WARN_MIN = [30, 10, 3, 1]` min call-outs (only the last minute while a route flies).
- `WATCH_ALT_M = 3,000 km`.

**`timeToImpact(s, vel, thrust)`** (`:85-98`) solves `alt + v_r t + ½ a_r t² = 0`, where `a_r = thrust_r − g(r) + v_t²/r` (the centrifugal term from tangential speed) and the velocity is taken against the turning ground. Example: from Ceres' 100 km gate a ship falls in about 17 min at 190–200 m/s.

**`terrainGuard(pos, vel, cmd, toward, aMax, minute, climbing)`** (`:130-202`) is active within 20 radii of a body or 20 min of closing speed.
- Triggers: the line to the target passes within 1.05 R, or the path on the current command (stepped every 30 s by `pathToImpact`, checking each segment's closest approach so "at 100 km/s a step is 3,000 km") meets the ground within a horizon. The horizon is 5 min (15 while climbing) plus the time to save the ship (half a flip plus v_down/a when passing; 1.2·v_down/(up − g) when braking; at most 2 h).
- Response: climb at max(400, min(1,200, 300 s × a)) m/s up, plus 1.8× that round the limb toward the target, holding against the pull; straight up below 20 km altitude.
- A ship too fast to stop puts its full drive across its motion, away from the centre (a dodge).
- The guard overrides the flip interlock and traffic control's cap. Over air, the floor is the entry interface.

**`hoverCmd`**: hold height (the pull plus killing vertical speed per minute).

**`contact` / `land`** (`:285-317`): the ship rests on the surface as a 'surface' hold at a body-frame angle, standing on its tail, nose up, velocity = body velocity + spin×R. NPC hulls that hit faster than a touch are wrecked and put on rails with the rock. Torpedoes are spent. A hull falling into a giant is gone, beacon and all.

Coupling: damage, combatants, ship-classes, world. **Reference only.** The math (`timeToImpact`, `pathToImpact`, contact thresholds) is a few pure functions worth lifting.

---

## 11. Planetary flight: entry, landing, shuttles (`planetary.js` 681 lines, `shuttles.js` 971 lines)

**Design decision** (longhaul v1.11.0, 2026-10-25): "no hull lands, every hull carries what does… (a fusion drive would burn the spaceport, RCS can't hold a hull up in a world's pull)". Carried craft (`ship-classes.js:447-464`):

| Craft | Length | Mass | Seats | Cargo | L/D | Drive cruise / max | β (belly) | Shield |
|---|---|---|---|---|---|---|---|---|
| Gig | 10 m | 14 t | pilot + 3 | 0.6 t | 1.1 | 1 / 4 G | 556 kg/m² | ceramic tiles, 1.1 MW/m² |
| Pinnace | 18 m | 45 t | 12 | 4 t | 1.3 | 1 / 4 G | 1,042 kg/m² | ceramic tiles |
| Cargo lander | 26 m | 140 t | 2 | 60 t | 0.9 | 0.8 / 3 G | 1,726 kg/m² | ceramic tiles |

An ablative ring would take 2.5 MW/m². MCRN corvettes and frigates carry 1 pinnace; destroyers 2; the Olympus-class battleship 4 pinnaces and 2 landers (`BAYS`, `:474-487`). `craftOf(cls)` (`:78-83`) → `{m, beta = m/(L·max(W,H)·0.6), ld, aMax, aCruise, heatMax, rated}`. This is the only coupling of the integrators to ship data, so inject a craft object instead.

**Entry integrator** (`flyDown`, `:93-150`). 2D, in the world's **turning frame**, `DT = 0.5` s, a sample every 4 s, at most 4 h.
- Acceleration = −GM r̂/r² + ω²r (centrifugal) + 2ω×v (Coriolis) + drag (ρv²/2β along −v) + lift.
- Lift = L/D × D × k along the up-normal, with a sink-hold bank law: wanted sink rate `−min(60, 10 + 0.004·v)` m/s, `k = clamp(0.4 + 0.02·(want − ḣ), −1, 1)`.
- Powered phase once in air with v < `POWERED_MS = 280` m/s, or h < `POWERED_H = 6,000` m. Target sink `−clamp(h/12, 2, 150)` m/s; the command is `(sink − ḣ)·0.25` radially and `−v_t·0.08` tangentially, minus gravity, frame and aero terms, capped at aMax.
- Lands when h ≤ 0; ok if speed < 12 m/s.
- Records peak heat (Sutton–Graves, nose 1.5 m), peak G (felt: aero + drive), peak q, downrange angle, `driveGmin` (G·minutes of drive used).

**Entry speed** (`entryProfile`, `:203-225`, cached per world and craft): `vE = min(7,200, 0.95·(√(GM/r_E) − |ω|r_E))` at flight-path angle −1.5°, multiplied by 0.85 up to 12 times until peak heat ≤ the shield's limit. An airless world is a powered descent from `HOVER_M = 10 km`, at rest over the pad.

**Ascent** (`flyUp`, `:157-193`): at 0.85 of aMax, vertical then a pitch program `p = π/2·clamp((h − 2 km)/(top − 2 km), 0, 1)^0.6` to level at the top of the air. It stops adding tangential speed at local circular speed less ground speed, and caps the climb above max(300, 0.5·v_circ).

Profile numbers (scratch run of longhaul's own `entryProfile` / `ascentProfile`):

| World / craft | Entry v | Down | Peak heat | Peak G (felt) | Peak q | Downrange | Up | Up peak G |
|---|---|---|---|---|---|---|---|---|
| Mars gig | 3.06 km/s | 33.2 min | 0.05 MW/m² | 2.05 | 7.5 kPa | 2,597 km | 4.9 min | 3.40 |
| **Mars pinnace** | 3.06 km/s | **38.0 min** | 0.05 | **2.16** | 7.5 kPa | 3,339 km | 3.8 min | 3.40 |
| Mars lander | 3.06 km/s | 32.1 min | 0.07 | 1.97 | 7.5 kPa | 3,122 km | 3.9 min | 2.55 |
| **Europa** (any; airless) | powered from 10 km | **1.5 min** | 0 | **3.69** (pinnace/gig), 3.00 (lander) | 0 | 0 | 0.4–0.5 min | 3.40 / 2.55 |
| Earth pinnace | 6.99 km/s | 22.4 min | 0.68 | 2.07 | 11.1 kPa | 4,732 km | 3.2 min | 3.40 |
| Earth lander | 6.99 km/s | 18.1 min | 1.06 | 2.18 | 17.5 kPa | 4,046 km | 3.7 min | 2.55 |
| Titan pinnace | 1.58 km/s | 111.4 min | 0.01 | 2.46 | 29.2 kPa | 5,743 km | 15.9 min | 3.40 |
| Luna / Ganymede / Callisto | powered | 1.5 min | 0 | 3.66–3.70 | 0 | 0 | 0.4 min | 3.40 |

Landing speed is about 3.2 m/s everywhere. Airless powered descents run near full drive, hence 3.7 G. OLYMPUS should throttle them for troop comfort (a design knob).

**The drive's legs: burn, coast, burn** (`:237-507`). Everything between orbit and the top of the air is a real transfer:
- **`kepler(GM, s, dt)`** (`:290-313`): universal-variable propagation on any conic, Newton within a bisection bracket (always converges, even nearly radial). **Pure; portable.**
- **`xferSweep`** (`:373-383`): Lambert transfers over log-spaced times of flight (600 s to 12 h, n = 48). It rejects arcs through the air (periapsis below the floor), arcs swinging far out (apoapsis past 1.3× the larger radius), retrograde arcs, and plans whose burns would take more than 60% of the time (`XFER_FIT`).
- **`xferPlan`** (`:394-419`): impulses refined into finite burns at cruise acceleration over 12 iterations (re-solving the Lambert between burn ends until the corrections are under 0.02 m/s), then verified by flying it.
- **`xferFlight`** (`:428-459`): the first burn at a fixed attitude (RK4, 1 s steps), an exact Kepler coast, and the last burn steered by an **energy-optimal law**, `a = 6·z/τ² − 2·e/τ`, where z is the position miss under free fall and e the velocity miss (`steer`, `:337-343`). It lands within centimetres.
- `xferAt` samples a transfer at any second (cubic Hermite between samples; coast in closed form); `xferDv`; `xferBurns`.
- `ENTRY_LEAD = 90` s: coast after the last burn to turn belly first. `TURN_LEAD = 90` s: coast before the first burn when coming from another attitude.

**Run planning** (`shuttles.js reach`, `:213-262`). The pilot takes the quickest option costing ≤ max(2 × the cheapest Δv, cheapest + 2.5 km/s) (`BRISK = 2`, `BRISK_SPARE = 2500`). Options: straight there; waiting up to 6 h in the bay or on the pad (`WINDOW_MAX`); or via a low phasing orbit (`PHASING = [1.12, 1.35, 1.8, 2.6]` radii, at least 3× the air's height up), where the wait is an hour or two rather than days. Timeline: bay 6 min (`LAUNCH_MIN`) → drop → entry/landing → 90 min on the pad (`GROUND_MIN`) → climb → return → recover 8 min (`RECOVER_MIN`). Whole runs ride on rails afterwards (`flightPathAt`, `placeOnLeg`, `driveOn`, which gives the drive's G and heading at any minute for sensors and views). Fuel = G·min × 0.05 × m/1e5: a Mars pinnace run uses 0.8 kg.

Whole runs from the parking orbit (scratch `planLegs`, carrier on a circular parking orbit):

| World / craft → port | Total run | Drop (to entry/hover) | Down | Up | Return | Fuel |
|---|---|---|---|---|---|---|
| Europa pinnace → Pwyll | 3.6 h | 0.91 h (straight) | 1.5 min | 0.4 min | 0.93 h | 0.29 kg |
| Europa pinnace → Conamara | 5.5 h | 2.28 h (via phasing orbit) | 1.5 min | | 1.47 h | 0.43 kg |
| Europa lander → Pwyll / Thera | 3.7 h / 5.4 h | 0.9 / 1.4 h | 1.5 min | | | 1.0–1.3 kg |
| Mars pinnace → Meridiani | 7.3 h | 2.89 h (phased) | 38 min | 3.8 min | 2.01 h | 0.91 kg |
| Mars pinnace → Syrtis / Elysium | 8.2 / 7.5 h | 2.0 / 1.7 h | 38 min | | 3.8 / 3.4 h | 0.8 kg |
| Mars gig → Elysium | 7.5 h | 1.74 h | 33 min | 4.9 min | 3.36 h | 0.26 kg |

From longhaul's test output: Earth lander 9.1–11.1 h (down 3.0–4.8 h); Mars pinnace 7.7–8.8 h (down 3.1–3.5 h); Luna gig 3.0–5.7 h; Titan lander 9.2–9.3 h; Ganymede pinnace 3.4 h. The push never exceeds 1.1× cruise, never dips under the top of the air, and legs meet within 355 m. Lit/cold minutes on one Mars run: launch cold 5; drop lit 12, cold 69; phasing cold 66; deorbit lit 6, cold 9; down cold 32, lit 6; ground 90; up lit 4; return cold 98, lit 8; recover 8.

**For an OLYMPUS drop**, this means: a drop from orbit to Europa's ice is about 1–2 h of mostly free fall (coasting), 1–2 short burns of 1 G with passengers feeling the burn, then a 1.5 min powered descent at 3–3.7 G. Mars: 2–3 h of mostly free fall with 12 + 6 min of 1 G burns, then 38 min of entry at up to 2.2 G, with the shock layer glowing (the longhaul cameras draw it as √heat in the air's colour), then 6 min of powered landing. **The craft model, profiles and transfer solvers are an excellent base for the drop-ship sequence and its felt-G timeline.**

`shuttles.js` itself is coupled to everything: crew, market, contracts, ground errands, factions, the clearance law, NPC traffic. **Reference only**, apart from `reach`/`lastLeg`/`planLegs`/`summarize`. These are adaptable if the carrier-place and craft lookups are injected; they depend on `planetary.js`, `worlds.js`, `ephemeris.js` and a `carrierPlace(t)` callback. `runMinutes` (`:402-424`) shows the background-outcome pattern: plan one trip from three phases once per world and craft, average it, then answer `trip × ceil(tonnes/cargo)` in O(1).

---

## 12. G-load on the crew: computation and application

**What is felt** (`game.js:403`): `g = hypot(thrustG, jinkG) + rcsG`, all in G. That is the non-gravitational acceleration the drive, evasive jinking and RCS impose. Gravity itself is never felt, which is physically right in free fall. `jinkG` (`combat.js:104-111`) = `EVADE_G × TECH.evade` while evasive at battle stations; it costs fuel at half its G (`JINK_FUEL_SHARE = 0.5`).

Consequences:
- coasting, orbiting, holding a free orbit or slot: 0 G, floating;
- a 1 G burn: 1 G toward the drive (decks are perpendicular to thrust; the "down" direction is never modelled, it is implicit);
- the flip: about 6 min at 0 G (drive cold) with a sideways tumble impulse for the unstrapped;
- **landed on a rock or docked: 0 G.** A gap: on Ceres, Phobos or a planet the crew still float, because `holdStep` returns 0 for ground holds and no surface or spin term exists. OLYMPUS must add surface gravity and spin gravity.

**Per crew member per minute** (`game.js:420-438`):
```
gHere   = m.away ? 0 : g                  (a boarding party feels the other hull: not modelled, 0)
secured = isSecureSeat(m.seat)            (couch, helm, ops, weapons, eng station, autodoc; bunks are restraints, not juiced)
m.gState = gStateFor(m, gHere, secured)   (floating <0.01 | standing ≤1.5 | strained ≤2.5 | prone >2.5 | secured)
eff     = protectedG(m, gHere, secured, resources)   (what the body feels)
physiologyTick(m, eff, gHere)             (damage, recovery, consciousness, heart, vitals)
juiceLapsed(m) → endJuice(m)              (the hangover bill)
needsTick(m, {gForce: eff, ...})          (rest and hygiene drain ×1.5 above 1.5 G; fun drain ×1.6 strapped above 1.5 G)
mobility(m, g)                            (walking speed multiplier; crew-ai)
```

`G_THRESHOLDS` (`crew.js:11-18`): MICRO_G 0.01 (below: floating), COMFORTABLE 0.3, STANDARD 1.0, HIGH 1.5 ("strain, juice required for long burns"), DANGEROUS 2.5 ("injury without a couch"), LETHAL 8.0.

**`protectedG`** (`crew.js:231-255`):
- Unsecured: eff = g.
- Secured, not dosing: ×0.7 (just the couch), or ÷3 / ÷4.5 if juice still lingers.
- Secured and g > 1.5 with med supplies: **juice**. A standard dose (1 med unit) gives eff = g/3. A **high dose** above `HIGH_DOSE_G = 6` (2 units, plus a booster every 24 h) gives eff = g/4.5: "6G feels like 2G; 10G like 2.2G".
- The drug lingers 60 min (`JUICE_LINGER_MIN`), covering a flip or a lull.

**`endJuice`** (`:265-285`): hangover minutes = 4320 × min(max(peakG, 1.5)/5, high ? 2 : 1), plus 1.5 min per minute spent on the high dose, capped at 10 days. A high-dose "crash" also gives heart stress +40, heart health −15 and morale −10. The hangover cuts work efficiency (×0.85, or ×0.6 in a crash: `needs.js:123`) and adds brain-bleed risk under ≥ 1.5 G (0.003/min, 0.006 in a crash; head −3).

**`physiologyTick`** (`:299-416`), per minute at effective G:

| eff G | Effect per minute |
|---|---|
| ≥ 8 (lethal) | head −2, torso −2.5, arms −1.5, legs −2, heart stress +8, heart health −1.5, morale −3; crushed, cardiac stress |
| ≥ 2.5 | torso −0.4, legs −0.6, stress +4, heart −0.3, morale −1; consciousness −1.5; cardiac stress past 10 min wears the heart (−0.1 − 0.02 per further minute) |
| ≥ 1.5 | legs −0.05, stress +1.5, morale −0.2; cardiac stress if stress > 50 |
| < 1.5 | recovery: stress −4 (−5 at ≥ 0.3 G), morale +0.05 at ≥ 0.3 G, slow mending of body parts (0.01–0.02/min up to a wound cap) |

On the high dose there is a stroke chance of `0.0006 × (rawG − 6)` per minute (head −8 to −18, consciousness −20). Vitals: `bpm = min(215, 72 + 1.2·stress + 5·(rawG − 1)₊ + 30·juice)`, systolic `120 + 0.6·stress + 12·(G − 1) + 22·juice`, diastolic `80 + 0.3·stress + 6·(G − 1) + 12·juice`.

**`mobility(m, g)`** (`:194-205`):
- micro-G: 0.6 ("hand over hand"; SHIPBOARD.md says "In free fall, hand over hand is slow, about half a tile per minute");
- < 0.3 G: 0.6 + (g/0.3)·0.4;
- 0.3–1 G: 1.0;
- 1–2.5 G: max(0.2, 1 − (g − 1)/1.5);
- ≥ 2.5 G: 0 (pinned).

The result is × (0.3 + 0.7 × leg health).

**Inertial events** (`inertia.js`). These fire when the drive lights (`BURN_START`, Δg), cuts (`BURN_STOP`, 0.3·Δg), changes by more than 0.5 G (`THRUST_CHANGE`), or the ship flips (`FLIP`: a random direction at 0.4 G for 3 s).
- Who is thrown: anyone conscious and unrestrained, unless the change was announced and ≤ 1.5 G (`BRACE_G`, they brace), or a surprise ≤ 0.5 G (`SURPRISE_G`). The dead and unconscious are always thrown.
- Physics: in **real time with game time frozen**, a 1/120 s substep, the push for 0.8 s (3 s for a flip), friction 4/s under gravity and 0.4/s in micro-G, `TILE_M = 0.9 m` per tile, until stopped (12 s safety valve).
- Impacts (`crew.js applyImpact`, `IMPACT` m/s): bump 1, bruise 3, hard 5, bone-breaking 8, crushing 12, fatal 18. These give torso/head/limb damage, knock-out, fractures, internal bleeding.

**Long-duration effects are absent** in longhaul: no bone or muscle deconditioning in low g, no vestibular adaptation or space sickness, no radiation dose (Europa's surface is commonly cited at about 5.4 Sv/day, lethal within days without shielding; longhaul only mentions Io's belts in flavour text), no heat or cold stress from G. OLYMPUS needs these for its realism goal (§16).

**Assessment.** The G physiology is mostly pure data-in/data-out functions on a crew record (`crew.js` depends on rng, needs, duty, ship-layout). **Adapt:** keep the thresholds, juice and hangover model, mobility curve and impact table; re-base them on per-second ticks (rates per minute → per second) and on OLYMPUS's body model.

---

## 13. Rails and background outcomes: how far things stay cheap

- **Orbit rails** (`world.js orbitStateAt`, `:84-101`): an entity with `orbit {body, r AU, phase, period days}` has its exact position and velocity at any minute, O(1). Stations, gates, holding slots and wrecks on the ground (`period` = the body's rotation) use it. `restingOrbit` (`:115-130`) picks a frame for a place left near a moon: outside the moon's Hill sphere it is held off the planet; where the host's pull is under twice the Sun's tide it rests with the host, with no orbit.
- **Transit rails** (`world.js transitStateAt`, `:145-169`): NPC voyages are a closed-form brachistochrone along the chord between moving ends. `τ = (t − t0)/(t1 − t0)`, `frac = τ < ½ ? 2τ² : 1 − 2(1−τ)²`, and the velocity blends the two ends' velocities plus the chord derivative. Duration `T = max(10, round(2√(L/(g·G0))/60))` min (`traffic.js:175`; forces use a 30 min minimum). The entity's `thrust` and `heading` are set for sensors (burn toward the target in the first half, flipped in the second). Exact at any time.
- **Calendar** (ARCHITECTURE.md:84): far entities are visited only when their business is due, and their position is refreshed only before they could come within the 0.105 AU horizon (at most a day old). There is a 1-day round-robin net under it. At 200k entities a 1 day/s frame takes about 14 ms.
- **Outcomes, not simulation**: `shuttles.runMinutes`, NPC planetary calls, background forces. Agents wake to full guidance-flown simulation only within 0.1 AU of the player.

This is exactly the "as much background generation as possible done without rendering" pattern the user wants. **Reuse the patterns** (closed-form rails, calendar wakeups); the code is coupled to longhaul's World class.

---

## 14. What OLYMPUS needs that longhaul's space layer lacks

1. **A real-time base.** Longhaul's quantum is the game-minute and its slowest speed is 60× real. OLYMPUS plays foot-soldier days in real time (the user: "full days (Mars sols, not 24h) moving in real time until we do things that spend time like eating (a splash screen illustrating the action and a time fast-forward)"). Recommended: an integer time base in game-seconds or milliseconds (or minutes plus a sub-minute accumulator). Keep the space layer closed-form (rails) so it can be sampled at any instant and skipped over in O(1); step the character layer at frame rate.
2. **A Mars sol calendar.** A sol is 88,775.244 s (longhaul's `solarDayH(Mars)` = 24.660 h, which matches). Derive the Mars Sol Date and local Mars time (and Earth UTC for comms) from the one integer counter, as `clock.js` does for UTC. Europa's day: 85.29 h, tidally locked, so Jupiter hangs fixed in its sky and night lasts about 42.6 h, with Jupiter eclipses each 3.55-day orbit. Phobos crosses the Martian sky every 7.66 h orbit (it rises in the west, per `bodyfacts`), Deimos every 30.3 h.
3. **Felt-gravity function** `feltG(context)`. Deck "down" plus magnitude:
   - in free flight: |non-grav accel| (longhaul's model);
   - on a surface at rest: local g minus centrifugal (Mars equator: ω²R = 0.017 m/s², 0.46% of g; Europa: ω²R = 6.5e-4 m/s²; Jupiter's tide on Europa about 1.3e-3 m/s², both negligible);
   - in a spin habitat: ω²r with Coriolis for thrown objects;
   - docked: the host's felt acceleration;
   - in a falling drop ship: 0 between burns.
   Ballistics, falling, jumping, carried loads and fatigue should all read this local g: 0.38 G on Mars, 0.134 G on Europa, 1 G under thrust.
4. **Radiation dose** (Jupiter belts at Europa; Mars surface with no field). Not modelled in longhaul.
5. **Long-term physiology**: deconditioning in low g or microgravity, re-adaptation, G tolerance as trainable fitness (ties into the user's "fitness" need), space sickness.
6. **Optional ephemeris realism**: Keplerian elliptical elements (a, e, ϖ, L₀ at a chosen epoch, still planar) so Mars' distance varies 1.38–1.67 AU and seasons exist. The API (`bodyPos`/`bodyVel`) can stay the same.
7. **Surface latitude.** Longhaul's ground is an equatorial circle (body-frame angle only). OLYMPUS ground maps are local tiles; a latitude and longitude per site plus a local tangent frame will be needed for sun angle, day length and seasons.
8. **Drop-ship comfort tuning.** Longhaul's airless powered landings run at about 3.7 G (near the drive's maximum). Throttle troop landers to a passenger-rated G.
9. **Physical fuel** (only if needed): a v_e parameter instead of kg per G·minute.

---

## 15. Reuse assessment

| Module | Verdict | Why |
|---|---|---|
| `js/core/constants.js` | **reuse as-is** (extend) | Physical constants and helpers. Add SOL_S = 88,775.244, the real-time step and unit-suffixed names. Replace `SPEED_MIN_PER_SEC` with OLYMPUS's warp ladder (it must include 1×). |
| `js/core/rng.js` | **reuse as-is** | Seeded mulberry32 and the `nextOf` off-stream generators are exactly what deterministic background generation needs. |
| `js/core/events.js` | **reuse as-is** | A trivial bus; the sim-emits-facts discipline. |
| `js/core/clock.js` | **adapt** | The pattern (one integer counter, derived calendars, `formatDuration`) is right. Re-base on seconds; add the Mars sol calendar, MSD and local solar time. |
| `js/sim/ephemeris.js` | **reuse as-is** (optionally adapt to elliptical) | Pure, depends only on constants, O(1), cached. The data table is good. Optional: e and ϖ per planet for realism; keep the API. Mars' `atmo` values depend on the terraforming question. |
| `js/sim/bodyfacts.js` | **reuse as-is** (edit text) | Plain data (NASA/JPL fact-sheet values) for an encyclopedia. Review the setting text (Mars terraformed, populations). |
| `js/sim/gravity.js` | **reuse as-is** | Pure Newtonian pulls with SOI culling, time-exact body positions, `nearestSurface`, `surfacePoint`, `syncRadiusM`. Add `feltG` beside it. |
| `js/sim/lambert.js` | **reuse as-is** | Pure, robust 2D Lambert with a perihelion floor. |
| `js/sim/worlds.js` | **adapt** (split) | The physics half (layers, well, parking, sync, exponential air, drag, Sutton–Graves, airspaces, sites, solar day) is pure and valuable. Move `airDrag`, `worldsTick`, `controlWords` (factions, hulls, ship classes) to game glue. SETTLEMENTS and GROUND_CONTROL are setting data to revisit. |
| `js/sim/planetary.js` | **adapt** | The entry and ascent integrators, `kepler`, `xferSweep`/`xferPlan`/`xferFlight`/`xferAt`, `arcClear` and `airState` are pure math. They are only coupled through `craftOf` (CLASSES, hulls) and the rails glue (`FLIGHT_PATH`, `carrierPlace`, `PLAYER_AT`). Inject a craft and a carrier callback. Best-in-class base for drop ships. |
| `js/sim/flight.js` | **reuse** for NPC and tactical ship sim; **reference** for the player | Pure (gravity only). The nose, lean, slew and RCS model and Verlet integrator are solid. The fuel model is abstract. The player-soldier never flies the ship, so their transport rides closed-form rails. |
| `js/sim/guidance.js` | **reuse** for tactical ship combat AI; **reference** otherwise | Pure functions, heavily tested (closing, keep and transfer laws). Overkill for transit (rails suffice) but exactly right if OLYMPUS shows ships maneuvering on a tactical screen during ship combat or boarding approaches. Its per-minute step must be kept (the whole-step braking assumes dt). |
| `js/sim/nav.js` | **reference only** | Coupled to world, docking, traffic control, intel, flags, service and stance. Mine the target-state protocol (`atx/aty`, swings), the route profiles, the sliced `planRun` estimator and the port speed caps. |
| `js/sim/autopilot.js` | **reference only** | Coupled to crew-ai, docking, sensors and systems. Mine the crew-safety policy table, the flip interlock and the warp gating: they define what a soldier aboard lives through. |
| `js/sim/terrain.js` | **reference** (lift the pure helpers) | `timeToImpact`, `pathToImpact`, the contact thresholds and `land` are tiny and pure. The rest is coupled to damage, combatants and world. |
| `js/sim/shuttles.js` | **reference only** (adapt the `reach`/`planLegs` planner if needed) | Coupled to crew, market, contracts, ground, factions. The run-planning algorithm (the BRISK rule, phasing orbits, window waits) and `runMinutes` outcomes are worth porting with injected dependencies. |
| `js/sim/world.js` rails (`orbitStateAt`, `transitStateAt`, `restingOrbit`, `stepFree`, `propagateFree`) | **adapt** | Pure functions inside a module that also holds the World class. Lift them; they are the backbone of cheap background travel. |
| `js/sim/crew.js` G physiology (`G_THRESHOLDS`, `protectedG`, `endJuice`, `gStateFor`, `physiologyTick`, `mobility`, `applyImpact`) | **adapt** | Good, tested numbers on a per-minute crew record. Re-base to OLYMPUS's body and medical model and tick rate; add surface and spin G, deconditioning and radiation. |
| `js/sim/inertia.js` | **adapt** | Real-time "thrown across the deck" with frozen game time, a 0.9 m tile, friction, impact table. Fits a tile-based top-down interior, but is tied to longhaul's ship-layout geometry. |
| `js/sim/holding.js`, `stance.js`, `docking.js` | **reference** | Ship-captain gameplay. Docking and holding physics might inform ship-boarding approaches (another slice). |
| `js/sim/telescope.js` | **reference** (other slice) | Pure-ish optics (diffraction 1.22λ/D, magnitudes, phase) for longhaul's telescope views, which the user wants echoed. It imports world, sensors, systems, stations. |

---

## 16. Recommended OLYMPUS space layer (concrete proposal, for the builders)

1. `core/`: `constants` (with SOL_S, unit suffixes), `rng` (as-is), `events` (as-is), `time` (integer milliseconds or seconds; derived UTC and Mars sol calendars; durations).
2. `space/ephemeris` (longhaul's file, optional elliptical upgrade), `space/bodyfacts`, `space/gravity` (as-is, plus `feltG`), `space/lambert`, `space/kepler` (from planetary.js), `space/worlds-physics` (split from worlds.js).
3. `space/voyage` (new, small): the player's transport as a **closed-form flight plan**.
   - Legs: undock and RCS departure (about 1–2 h) → strap-in (10 min) → burn at G for t/2 → **flip (6 min of free fall, couches 30 min before)** → brake → approach (the last hour strapped in) → parking orbit → drop ship.
   - It is sampled at any second for felt G and its direction (deck down), the crew-policy state (free / secure), and position for the tactical screen.
   - Time-skips jump straight to the next event: meals, sleep, training blocks, the flip call, arrival.
   - Durations come from the formulas in §9, plus about 8% overhead to match longhaul's flown numbers.
4. `space/dropship` (adapted planetary.js): profile per world and craft (cached), transfer legs from the carrier's orbit, a timeline of felt-G samples (free fall during coasts; 1 G burns; Mars entry up to 2.2 G for 38 min; Europa powered descent throttled from 3.7 G), heat glow for the cockpit and window art.
5. `space/tactical` (adapted flight.js + guidance.js): only when ship combat or boarding is on screen. NPC hulls flown by the closing and keep laws at 1-minute steps (or a finer dt if the laws are re-tuned), drawn on longhaul-style tactical maps.
6. Background world: rails (orbit and transit closed forms) plus calendar wakeups, with outcomes for anything far from the player.

---

## 17. The user's decisions and tastes found in this slice (attributed)

- OLYMPUS brief (the user, via this workflow's task text): "realism in physics, air, gravity, space being big and travel taking a long time, health effects under G and not under G"; "mostly top-down at different scales (longhaul's telescope views of planets and stars, and how ship tactical maps are drawn…)"; "only refactor the tech from there if it's the best way"; "full days (Mars sols, not 24h) moving in real time until we do things that spend time like eating (a splash screen… and a time fast-forward)"; "Things take time and don't feel rushed"; "Perform as well as possible; as much background generation as possible done without rendering actual graphics, yet immersive".
- Longhaul memory `feedback_scale.md` (the user's feedback): "Build everything as if it's going to scale to huge proportions… 200,000+ entities, 1,000+ stations… gravity/physics math is cheap, spatial queries and DOM are the bottlenecks."
- Longhaul CLAUDE.md rules (project conventions the user works under): sim purity; one minute at a time in a fixed order; plain-data state with `$` runtime keys; seeded RNG only; units in names ("A wrong unit once made pirates charge to 800 km instead of 800,000 km"); every module opens with a prose header block; docs kept in step with code; balance checked through the tests' printed numbers.
- 2026-03-28 (longhaul commit): "Belter Standard 0.3G brachistochrone transfer option", the 0.3 G profile as the gentle Belter norm.
- 2026-10-20 (v0.13.0): "gravity and the ground": real gravity near bodies.
- 2026-10-24 (v1.2.1): crew-safety refinements: the endgame hour counted either way, no turn held with the ground under 10 min.
- 2026-10-25 (v1.5.0): worlds with planetary space at 0.01 G inside half the Hill sphere; the planner refuses routes into the air.
- 2026-10-25 (v1.6.0): shuttles and an entry "flown once as physics"; "Mars terraformed (52 kPa, breathable on the low ground, a northern sea)".
- 2026-10-25 (v1.11.0): "no hull lands, every hull carries what does… (a fusion drive would burn the spaceport, RCS can't hold a hull up in a world's pull)".
- 2026-10-25 (v1.12.6): "no route holds up the picture": the ETA flight is time-sliced (performance as a hard requirement).
- 2026-10-29 (v1.12.8): "a shuttle flies as a real craft does". The old spiral legs ("up to 51 G of push on a lander rated 0.8 G") were replaced by real burn-coast-burn conics. Evidence that physically impossible motion is not acceptable to the user.
- 2026-10-30 (v1.12.9): a shuttle's drive is lit for every view exactly as it burns (consistency between the sim and every view).

---

## 18. Open questions for the user

1. **Mars' air.** Keep longhaul's terraformed Mars (52 kPa N₂/O₂, breathable lowlands, a northern sea, introduced in longhaul v1.6.0) or go Expanse-canon (thin CO₂ about 0.6 kPa, domes, tunnels, suits outside)? The answer changes air-management gameplay on the surface, entry profiles (a canon Mars entry is far thinner) and the city art.
2. **Calendar year and epoch.** Keep longhaul's 2351-03-22 start and fictional planet phases, or use a real ephemeris at a canon-ish date? It decides Mars–Europa distance (3.7–6.7 AU) and so transit times at game start.
3. **How long should a typical deployment transit be in game?** At 1 G Mars→Europa is about 6–7 days, at 0.3 G about 12 days, a 0.1 G burn-and-coast about 5 weeks. Which profile does the MCRN use for troop movements, and does the game let the player feel a 3 G+ combat burn on juice?
4. **Physical reaction mass.** Is a real exhaust-velocity model wanted for ship endurance, or is longhaul's abstract "kg per G·minute" fine for the background, given the soldier doesn't manage fuel?
5. **Ship interiors under thrust versus spin.** Expanse ships stack decks along the thrust axis, so "down" is aft only under thrust. Should OLYMPUS bases and stations have spin gravity (Ceres-style) or rely on thrust and planetary g only?
6. **Radiation and long-term low-g effects** (Europa's belts, Martian bone density, Earth-g training): how deep should they go? They are absent in longhaul.
7. **Drop-ship felt G.** Should airless powered descents stay near the drive limit (about 3.7 G, longhaul's behaviour) or be throttled to a passenger-rated profile, and how much of a 1–3 h drop is played in real time versus skipped?
