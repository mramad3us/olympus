# LONGHAUL research: ship combat, NPC ships, the background war

Slice: longhaul's combat and NPC-ship systems, read for OLYMPUS (a hard-SF, Expanse-based game where the player is a Martian marine, not a ship).
Sources read in full: `longhaul/docs/COMBAT.md`, `js/sim/{weapons,sensors,combatants,ordnance,damage,combat,agents,forces,conflict,intel,traffic,missions,world,spatial-hash,fire}.js`. Skimmed: `contracts.js`, `military.js`, `boarding.js`, `stance.js`, `politics.js`, `hunts.js`, `station-defense.js`, `service.js`, `ship-classes.js`, `game.js` (`minuteTick`), `ui/combat.js`, `ui/tac.js`. Ran (read-only; the test runner writes nothing) `node tests/run.mjs` on the combat, chase, stance, wars, intel, fire, hunts, scars, guidance and scale suites, and copied their printed balance figures below (run 2026-11-05 against longhaul v1.12.21).

All paths below are relative to `/Users/deaumas/lab/vibe/claudecode/longhaul/` unless absolute.

---

## 0. Verdict in one paragraph

Longhaul has a complete, internally consistent, well-calibrated model of Expanse-style naval combat: one detection model, three weapon families with tech-level tables, torpedoes that fly real trajectories under real guidance laws, a closed-form endgame (point defence hazard, homing, warheads), a section-based damage model, doctrine-driven NPC captains who fight, run, go dark, surrender and stand down "as captains with bodies would", and a background war fought with real hulls on rails, settled hourly by outcomes far from the player and woken into full simulation near the player. The **math and the rules are the valuable part** and should carry over almost unchanged. The **code** is player-as-ship-centric (`PLAYER = 'player'` special cases everywhere, `state.flight` / `state.ship` for "us") and is tied into longhaul's economy, law and UI modules, so it should be **ported as a narrow pure module, not copied**. For OLYMPUS the biggest structural change is that *every* ship, including the one the marine is aboard, is an NPC-commanded ship: the special-cased player ship becomes just one more agent whose interior is simulated at tile level because the player is inside it.

---

## 1. Conventions of the combat code (these are the user's rules for longhaul; most should carry over)

From `CLAUDE.md` (file dated 2026-11-01) and the module headers:

- **The sim is pure**: `js/sim/` never touches the DOM. It reports facts through an `emit(type, payload)` bus; `js/ui/presenter.js` decides what to show.
- **One minute at a time**: everything advances in `minuteTick` (`js/sim/game.js:259`) in a fixed order. *Decisions made in a minute are flown the next minute.* All ships move before any ordnance is resolved (ARCHITECTURE.md "The minute", step 4 then step 6).
- **State is plain data**; keys beginning `$` are runtime-only and stripped from saves (`$prev`, `$cell`, `$due`, `$locks`...).
- **Scale target 200k+ entities**: "No per-minute work over all entities. Use the spatial hash, `world.driven`, `world.stations`, `world.beacons`. Far-away things get outcomes, not simulation. Traffic becomes an agent only when something near the player needs it to act." (CLAUDE.md). Also the untracked memory note `memory/feedback_scale.md` (file dated 2026-03-24): "Build everything as if it's going to scale to huge proportions... 200,000+ entities, 1,000+ stations... spatial indexing for any range query, never linear scan; avoid O(n²) in tick loops; render only what's visible; chunked serialization".
- **Randomness only through `core/rng.js`** (seedable; tests seed it). Scars are placed by a hash of the hull id, *not the dice*, so cosmetic detail never perturbs the random stream (`damage.js:78`).
- **Units**: positions in AU, velocities in m/s, distances inside combat/guidance in metres, UI in km. Constants carry the unit in their name (`standoffM`, `launchAU`, `rangeM`). CLAUDE.md records why: "A wrong unit once made pirates charge to 800 km instead of 800,000 km."
- **Space is 2-D** (the ecliptic plane: `pos {x,y}`, `vel {vx,vy}`). No z axis anywhere in the combat code.
- **Every module opens with a prose header** explaining the model; comments explain *why*. Docs (`docs/*.md`) quote the constants and must be updated in the same change.
- **Balance is checked by the tests' printed numbers** (CLAUDE.md: "Re-read them after tuning").
- COMBAT.md's first line is a design rule: **"Nothing in LONGHAUL glows."** Kinetic and nuclear weapons only: PDCs, torpedoes, railguns (plus mining gear improvised as a weapon).

Constants (`js/core/constants.js`): `AU_M = 149_597_870_700`, `G0 = 9.80665`, `MIN_S = 60` (the sim step), `DAY_MIN = 1440`. `RANGE = { SHORT: 0.001 AU (~150k km, all sensors), MEDIUM: 0.01 (~1.5M km, radar), LONG: 0.1 (~15M km, telescopes/plumes), RADIO: 0.1, SOS: 0.3, DOCK_M: 50_000, FORMATION_M: 1_900 }`. Flight: `SLEW_RATE = π/6 rad per minute` (a full 180° flip takes 6 minutes, `flight.js:26`), `RCS_MAX_G = 0.02`.

---

## 2. Sensors and detection (`js/sim/sensors.js`, `js/sim/combatants.js`)

### 2.1 One model for everybody

Every target has a **signature range** (AU at which a quality-1 suite holds it). An observer sees it iff `dist <= signature × quality` (`canSee`, `sensors.js:103`). The same function serves the player's board, NPC ships and torpedo seekers.

| Target | Signature (AU) | ~km |
|---|---|---|
| transponder on, or distress beacon | `RANGE.LONG` 0.1 | 15M (radio) |
| drive lit (any thrust > 0) | 0.1 | 15M (the plume) |
| station | 0.2 | 30M |
| cold silent hull, size S / M / L / XL (`SIZES.radarAU`) | 0.0008 / 0.0015 / 0.004 / 0.01, × TL stealth | 120k / 224k / 598k / 1.5M (TL2) |
| torpedo, drive lit | 0.05 | 7.5M |
| torpedo coasting **in datalink** (FAST profile, `ord.talks`) | `RANGE.SHORT × TL stealth` | 150k (TL2), 82k (TL4) |
| torpedo coasting silent (COLD, or out of link) | `TORPEDO_RADAR_AU` 0.0002 | 30k |
| railgun slug | `SLUG_RADAR_AU` 0.00003 | 4.5k |

Sensor quality:
- Player: `sensorRangeFactor(state)` (system damage) × 1.25 with an ops watchstander × `TECH[tl].sensors`.
- NPC: `TECH[tl].sensors × (0.3 + 0.7 × e.combat.sensors)` (sensor section condition, `combatants.js:61`).
- Torpedo seeker: `SEEKER_QUALITY = 0.3`.

Tech table (`ship-classes.js:70`):

| TL | name | sensors × | stealth × | armor + | fireControl × | evade × | counterBurn |
|---|---|---|---|---|---|---|---|
| 1 | Jury-rigged (Belt) | 0.7 | 1.2 | 0 | 0.8 | 0.8 | no |
| 2 | Commercial (Earth older) | 1.0 | 1.0 | 0 | 1.0 | 1.0 | yes |
| 3 | Naval (Earth modern, Mars civil) | 1.3 | 0.8 | 0.5 | 1.15 | 1.1 | yes |
| 4 | Advanced naval (**Mars military**) | 1.6 | 0.55 | 1 | 1.3 | 1.2 | yes |

Worked example: a TL4 MCRN frigate (size M) running cold shows at 0.0015 × 0.55 = 0.000825 AU ≈ 123,000 km to a TL2 sensor, ≈ 197,000 km to a TL4 one. Lit, it shows at 15M km. Running dark is therefore only meaningful with the drive cold: **the plume is the brightest thing for millions of km**.

### 2.2 Tracking reveals detail over time

`REVEAL = { VELOCITY: 5, HEADING: 10, THRUST: 15, MASS: 30, PROFILE: 60 }` (minutes of track; `sensors.js:49`). A ranging-laser lock accrues 3×/minute, an ops watch 2×. Tracks fade at −2/minute after loss. `PROFILE` (60 min) matches the hull against registries: an unknown ship is *named* after an hour, or instantly by its transponder. A **hunted** ship (bounty, strike) is on no registry: only its transponder or its drive signature (read only while the drive is lit, and only if the brief has it on file) names it (`identifyHunt`, `sensors.js:188`; `hunts.js` keeps "possibles" and "ruled out" lists with reasons: another signature, a registry match, a transponder, a mass that is no hull of the target class).

### 2.3 Light lag

Everything on the board is under a light-minute (long range = 50 light-seconds), so the board is live to within a sim step; each contact carries `lagS = dist × AU_M / c` (`sensors.js:208`). Beyond the board, knowledge is *reports with ages* (intel.js, section 12). Every display draws only what sensors hold; a lost contact stays on the plot as its last fix, coasting, uncertainty circle growing.

### 2.4 Locks and the hostile light

`noteLock` (`combatants.js:132`): a ship or station fighting us, holding us on sensors and within the reach of something it carries (torpedoes to its launch range, railguns to `RAIL_RANGE_M = 30,000 km`, PDCs to strafe range) "is ranging us"; the hull's warning receivers say LOCKED ON whether or not we can see who. The hostile light lights only for a hostile *on the board* or a lock: added v1.12.18 (2026-10-31) after the user's light stayed lit for days over "SH Guardian 19, running from us 5 AU away and off every sensor". The principle (the user's): **the ship's displays go by what the ship can know.**

---

## 3. Weapons (`js/sim/weapons.js`, pure tables, 155 lines)

### 3.1 Point-defence cannons

| TL | kill rate λ /mount·s vs a torpedo | anti-torpedo envelope | gun range vs hulls (strafe) | dispersion σ |
|---|---|---|---|---|
| 1 | 0.25 | 25 km | 4 km | 1.0 mrad |
| 2 | 0.4 | 40 km | 6 km | 0.7 mrad |
| 3 | 0.5 | 55 km | 10 km | 0.5 mrad |
| 4 | 0.55 | 70 km | 15 km | 0.35 mrad |

`PDC_RPS = 50` rounds/mount·s, `PDC_MUZZLE = 1200 m/s`, `PDC_STRAFE_DUTY = 0.3`, `PDC_BURST_DP = 6` (DP per mount-minute of hits on a hull), `PDC_MAX_EXPOSURE_S = 20`, `PDC_AUTO_FACTOR = 0.6` (no gunner). `PDC_ROUNDS_PER_MOUNT = 20,000` stocked on NPC hulls (`combatants.js:29`). Rounds cost 0.05 MCR.

Fire-control factor (multiplies λ and strafe hits):
- Player: `(gunner ? 0.7 + 0.6 × security/100 : 0.6) × TECH.fireControl`.
- NPC: `CREW_FACTOR[category] × TECH.fireControl × (0.5 + 0.5 × crewLeft) × (0.5 + 0.5 × sensors)`, `CREW_FACTOR = { military 1.1, authority 1, irregular 0.85, civilian 0.8 }`.
- Station: `1.1 × TECH.fireControl × (0.5 + 0.5 × sensors)`.

### 3.2 Torpedoes

| TL | max G | Δv | FAST closing speed (`FAST_VC`) | COLD (40%) | seeker limit (×1.25) | capture basket (full Δv) |
|---|---|---|---|---|---|---|
| 1 | 12 | 100 km/s | 15 km/s | 6 | 18.75 | ~3.8 km |
| 2 | 18 | 150 km/s | 20 | 8 | 25 | ~5.6 km |
| 3 | 25 | 250 km/s | 25 | 10 | 31.25 | ~7.8 km |
| 4 | 32 | 400 km/s | 30 | 12 | 37.5 | ~10 km |

Capture basket = `0.5 × min(maxG·g0, dv/TERMINAL_S) × TERMINAL_S²`, `TERMINAL_S = 8 s`.
Warheads: **HE** 70 DP, needs a homing hit, lands on an aimed section, 1,800 MCR. **Nuclear** 600 DP at the core e-folding over 300 m, proximity fuze 1,500 m, detonates at closest approach even when homing fails, 6,000 MCR, contraband (and in longhaul's career system, rank 3 to carry: `RANK_FOR.nukes = 3`).
`TORPEDO_ARM_MIN = 1`, `TORPEDO_LIFE_DAYS = 60` (reactor endurance), `TORPEDO_RELOAD_MIN = 3` per tube (6 when the launcher is degraded), `PN_GAIN = 3` (declared, unused by the current deadbeat law).

### 3.3 Railguns

| TL | slug speed (relative) | angular σ |
|---|---|---|
| 2 | 20 km/s | 4 µrad |
| 3 | 30 km/s | 2 µrad |
| 4 | 45 km/s | 1 µrad |

`RAIL_DP = 45`, `RAIL_RELOAD_MIN = 1` (capacitor), `RAIL_RANGE_M = 30,000,000` (30,000 km: past it no solution is worth a slug).

### 3.4 Mining gear (improvised)

| gear | reach | projectile | σ | DP per mount-minute |
|---|---|---|---|---|
| rock-cracking charges (prospectors) | 3 km | 300 m/s | 4 mrad | 3 |
| ore mass driver (miners) | 8 km | 2.5 km/s | 2.5 mrad | 4 |

Never runs dry; cannot touch a torpedo.

### 3.5 Evasion math (the heart of "what hits")

```
JINK_PERIOD_S = 8;  EVADE_G = 2.5 (player)
jinkSigma(G, t) = G·g0 · min(t²/2, √(8/3) · t^1.5)        // metres, per axis
hitChance(R, σ) = 1 − exp(−R² / (2σ²))                     // Gaussian miss vs disc of radius R
```
One random-acceleration segment early, a random walk of velocity kicks later. Target radius = `max(5, lengthM × 0.15)` (`targetRadius`).
NPC evasive G = `min(3, maxG × 0.5) × TECH.evade`, only for classes with `evasive: true` (civilians "fly straight and pray") and only while `agent.evade` is set (ordnance within 20 min, or the enemy within 50,000 km).

Worked numbers (computed from the formulas):
- Railgun TL3 at 2,000 km: TOF 66 s; gun σ = 4 m; a 3G jinker σ ≈ 25.7 km → effectively never hit; a coasting 7 m-radius corvette: 28/30 (test).
- Railgun TL4 at the navy standoff 20,000 km: gun σ 20 m vs an 18 m frigate radius, P ≈ 0.33 if it coasts; a 3.6G jinker σ ≈ 540 km. **Railguns kill what holds still (disabled, civilian, drifting).**
- PDC strafe TL2 at 3.6 km: gun σ 2.5 m; a 3G jinker over 3 s TOF: σ ≈ 132 m, P(hit) ≈ 0.1%. A coasting/disabled target: ~100%. **PDC raking is a finisher.**

### 3.6 Doctrine under torpedo fire (`weapons.js:150`)

`COUNTER_BURN_S = 45 × 60`: TL2+ ships turn away and burn from any torpedo less than 45 minutes out, so it arrives slowly (long under the PDCs) and must spend Δv catching up. `UNDER_FIRE_CLOSE_MS = 5,000`: with any torpedo inbound, close on the enemy no faster than 5 km/s ("every m/s of closing speed is a m/s on the enemy's torpedoes"). A ship that keeps charging meets torpedoes at 100+ km/s and gets ~0.5 s of point defence against each. TL1 (no counter-burn computer) holds course and jinks.

### 3.7 MCRN and peer combat stats (`ship-classes.js:327-399`)

| class id | name | TL | size | L m | mass t | crew (std) | maxG | armor | PDC | tubes | magazine he/nuke | rail | brig | hp* |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mcr-cutter | Martian Security cutter | 3 | M | 55 | 1,800 | 6-10 (8) | 9 | 1.5 | 4 | 2 | 6/0 | 0 | - | 144 |
| mcrn-corvette | Tharsis-class corvette | 4 | M | 46 | 2,800 | 6-12 (9) | 12 | 2 | 6 | 2 | 6/6 | 0 | 6 | 180 |
| mcrn-frigate | Hellas-class frigate | 4 | M | 120 | 12,000 | 20-40 (26) | 10 | 3 | 12 | 4 | 12/12 | 1 | 12 | 180 |
| mcrn-destroyer | Valles-class destroyer | 4 | L | 220 | 40,000 | 60-120 (80) | 8 | 3.5 | 18 | 6 | 16/20 | 2 | 24 | 450 |
| mcrn-battleship | **Olympus-class battleship** | 4 | XL | 480 | 250,000 | 200-400 (280) | 5 | 4.5 | 40 | 12 | 40/80 | 3 | 60 | 1,200 |
| unn-corvette | Harrier-class | 2 | M | 50 | 2,900 | 6-12 (10) | 9 | 2 | 4 | 2 | 6/4 | 0 | 6 | 180 |
| unn-frigate | Danube-class | 2 | M | 125 | 12,500 | 20-40 (32) | 7 | 2.5 | 8 | 4 | 12/8 | 1 | 12 | 180 |
| unn-frigate-new | Everest-class | 3 | M | 120 | 12,000 | 20-40 (30) | 9 | 2.5 | 10 | 4 | 12/12 | 1 | 12 | 180 |
| unn-destroyer | Atlas-class | 2 | L | 230 | 42,000 | 60-120 (90) | 6 | 3 | 14 | 6 | 16/16 | 1 | 24 | 450 |
| unn-battleship | Leviathan-class | 3 | XL | 500 | 260,000 | 200-400 (320) | 4 | 4 | 32 | 12 | 40/60 | 2 | 60 | 1,200 |

*hp = `SIZES[size].hp × BUILD[category]`, `SIZES.hp = S 60, M 120, L 300, XL 800`; `BUILD = { civilian 1, irregular 1, authority 1.2, military 1.5 }`. Cruise G is 1 for warships (0.5 battleships). `ratedG = 0.7 × maxG` (past it, overdriven: a containment risk `0.00012 × (G − rated)²` per minute, `game.js:381`). **Note for OLYMPUS: longhaul's MCRN flagship class is already called the "Olympus-class battleship".** Carried craft (`BAYS`): corvettes/frigates 1 pinnace (18 m, 12 seats, lifting body), destroyers 2, battleships 4 pinnaces + 2 cargo landers. No class records a marine detachment or troop capacity: OLYMPUS will need that column.

Strength scores (printed by `combat.test.mjs`, `classStrength`): corvettes OPA refit 58, UNN Harrier 228, **MCRN Tharsis 1,361**; frigates OPA refit 135, UNN Danube 820, UNN Everest 2,201, **MCRN Hellas 4,993**. Forces comment: "UN mean ≈ 1,200, MCR ≈ 5,900, so 56 × 1,200 ≈ 12 × 5,900" (`forces.js:89`): Earth and Mars matched in total strength, not numbers.

---

## 4. Ordnance in flight (`js/sim/ordnance.js`, 675 lines)

Ordnance are world entities of `type: 'ordnance'`, `driven: true`, integrated each minute under gravity + own thrust with the same `stepFree` (velocity-Verlet) as ships (`world.js:176`).

### 4.1 Launch (`launchTorpedo`, line 101)

Creates an entity at the shooter's pos/vel with `ord = { kind:'torpedo', warhead, profile, aim, owner, target, launchedAt, maxG, dv0, dv, phase:'boost', track, cmd }`, then calls `guide()` immediately. Shooter must hold the target on sensors (enforced by callers). NPC salvos: see 9.6.

### 4.2 Guidance (`guide`, line 309), once a minute, flown the next minute

1. **Track**: if the seeker sees the target (`canSee(d, signature, 0.3)`) or the owner still sees it and the torpedo is within `RANGE.RADIO` of its owner (datalink), refresh `track = {x,y,vx,vy,ax,ay,t}`. Else fly the last track dead-reckoned (`lost = true`, emits `torpedo-track-lost`). `talks` = FAST profile and in link (makes it visible to the target's short-range suite).
2. **Predicted target state**: position = track + v·age + a·(h0·age − h0²/2) with `h0 = min(age, PREDICT_S = 600 s)` (target thrust extrapolated at most 10 minutes).
3. **Lost and nothing there**: if lost, opening (vc ≤ 0) and within 1,000 km of the predicted point: self-destruct (`retire 'lost'`).
4. `tgo = d / vc`; phase becomes `terminal` when `tgo < TERMINAL_MIN = 10 min`.
5. **Midcourse/terminal**: zero-effort miss over tgo (target thrust over remaining horizon), perpendicular component `p`; if `|p| > deadband` (terminal 0; else `max(0.3 × captureRadius, 2e-5 × d)`), deadbeat lateral accel `a = p × k`, `k = gain / (tb·tgo − tb²/2)`, `tb = min(60, tgo)`, gain = 1 terminal, 0.5 if tgo > 1 h, else 0.8. Capped at `min(maxG·g0, dv/60)`.
6. **Closing speed**: `want = profileVc(profile, tl)`. Against a runner accelerating away at `away` (target thrust along the line of sight), build `goal = pursuitSpeed(want, away, d) = √(want² + 2·away·d)` (so the runner's own burn bleeds it back to `want` by arrival). If `vc < 0.95 goal`, burn along the LOS with what lateral authority leaves, but only spending Δv beyond a **homing reserve** (`HOMING_RESERVE_S = 20 s` at full thrust) once `vc ≥ want` (`spareA`).
7. **Braking**: too fast for the seeker at arrival → `brakeNeed = (vc² − top²)/(2d) − away`, applied only when it would need ≥ `BRAKE_LATE = 0.5` of the motor (braking late costs no more Δv), ×1.1.
8. Every correction costs Δv: "a target that keeps maneuvering bleeds a torpedo dry". Out of Δv and never arriving → `retire 'spent'`; past 60 days → `retire 'expired'`.

### 4.3 Reach forecast (`torpedoForecast`, line 424)

A 1-D simulation down the LOS (crossing speed taken off Δv first, 90% of Δv usable, 3-day horizon, 10 s steps while burning, coarser coasting) of exactly the law above, assuming the target keeps its present thrust. Returns `{reach, etaS, shortM, vcArrive}`. Fire control shows it as REACH; **NPC crews never launch a shot that can't reach** (`agents.js:1078`).

### 4.4 Flight times and reach (printed by tests)

- Unarmed hauler at 300,000 km: 12/12 hits, mean flight 3.6 h.
- A 6M km COLD COAST shot (TL2): 8.6 days, 99% of it dark, hit, ≥124 km/s Δv left.
- "Across half an AU, for weeks" (COMBAT.md).
- TL4 torpedo vs a corvette running at 8G from 954k km: forecast 59 min, shot down after 57 min, peak 32G. From 375k km "about an hour" (COMBAT.md).
- From 3M km against the same runner: forecast short by 2.54M km; the torpedo spent after 78 min.
- Track lost then reacquired: flies on dead reckoning and still hits (test).

### 4.5 Closest approach inside the minute (`closestApproach`, line 259)

From the start-of-minute snapshots (`$prev`) and end states of torpedo and target: relative motion modelled with constant relative acceleration, corrected by a linear residual to land exactly on both end states, scanned in 60 one-second segments, nearest point of each segment to the origin. Returns `{ d (m), tau (s into the minute), vRel (m/s), dir, rx, ry }`. **`tau` is the second of the minute at which the event happens**: this is what lets a minute-stepped strategic sim schedule a hit at a precise wall-clock second for the interior view (longhaul's telescope does exactly this: effects "on the wall clock").

---

## 5. The endgame and point defence (`ordnance.js:185-574`)

Each minute (`moveOrdnance`), after every ship has moved:

1. For each torpedo, if closest approach `d ≤ base + 0.5 × spare × tau²` where `base = captureRadius`, `spare = max(0, min(maxG·g0, dv/tau) − currentThrust)`, it is "in the basket" (the seeker homes continuously, answering a last-second dodge with spare thrust); the Δv to close the excess (`2(d − base)/tau`) is spent.
2. Captured torpedoes are grouped **by target**, sorted by `tau`, and grouped into **salvos** arriving within `SALVO_WINDOW_S = 5 s`.
3. **Defenders** (`defendersOf`, line 465): the target itself (cover 1); for a protected ship, the player's PDCs if in envelope (cover 0.5); any station within 60 km not hostile to the target (cover 0.6); NPC wingmen (`agent.wing`) in envelope (cover 0.5).
4. **Hazard per torpedo** in a salvo of n: for each defender, `exposure_i = min(rangeM / vRel_i, 20 s)`; rounds wanted = `mounts × 50 × meanExposure`, rounds actually spent `got`, `k = got/want`; `hazard_i += mounts × λ × factor × cover × exposure_i × k / n`. **Salvos saturate**: the guns are shared.
5. `P(intercept) = 1 − e^(−hazard)`. Emits `torpedo-intercepted` with position and vRel.
6. Survivor homing: `aAvail = min(maxG·g0, dv/8)`, `aEvade = targetEvadeG·g0`; `pGuide = aAvail ≤ aEvade ? 0.05 : clamp(1 − (aEvade/aAvail)², 0.05, 0.97)`; `pLock = vRel ≤ seekerLimit ? 1 : (seekerLimit/vRel)²`; hit if `random < pGuide × pLock`.
7. Nuke: always detonates; miss distance = homed ? U(0,150 m) : U(300, 1500 m); `detonate()` at that offset. HE: on hit `applyHit(dp 70, aim, precision 0.5)`; on miss, a fly-by that may come round again if `dv ≥ 2 × vRel`, else retired.

Exposure examples: a FAST TL4 torpedo (30 km/s) inside a TL2 envelope (40 km) is exposed 1.33 s; inside a TL4 envelope (70 km) 2.33 s; a COLD TL2 torpedo (8 km/s) in a TL2 envelope 5 s. An MCRN corvette's six TL4 mounts at factor 1.1 × 1.3 = 1.43 give hazard ≈ 6 × 0.55 × 1.43 × 2.33 ≈ 11 on a single FAST torpedo (P kill ≈ 1); split six ways, ≈ 1.8 each, one in six survives to home.

Printed outcomes:
- "MCRN corvette: 0/10 single torpedoes hit; 3/60 from 6-torpedo salvos."
- "pirate HE torpedo at us: intercepted 67/80 with a gunner, 63/80 on automatic" (our two TL2 mounts).
- COMBAT.md: "Pirate salvos of two are much more dangerous."

---

## 6. Gunfire resolved without projectiles

- **Slugs** (`resolveSlug`, line 576): a slug *is* an entity (to be seen, 4.5k km signature), flown ballistic on the intercept solution (`interceptSolution`: fixed-point iteration on time of flight τ, target thrust assumed constant, 12 iterations). When it passes within 50 km, the actual miss vector from the motion gets Gaussian noise `σ = hypot(gunσ × range, jinkSigma(evadeG, flightTime))`; hit if within target radius → `applyHit(45 DP, precision 0.8)`.
- **PDC strafe** (`strafe`, line 600): per minute, no projectiles. In range `≤ strafeM`: `σ = hypot(σ_rad × d, jinkSigma(evadeG, d/1200))`; rounds = `mounts × 50 × 60 × 0.3`; `DP = 6 × mounts × factor × hitChance(R, σ) × (got/want)`; applied with precision 0.7 if ≥ 0.5 DP. Two TL2 mounts strafing burn 1,800 rounds/min, so 40,000 rounds last ~22 minutes.
- **Mining gear** (`fireGear`): same with the gear's numbers, precision 0.3. Test: raking a mining barge at 4 km draws 4 minutes of ore-driver fire back, 6 DP, our hull 96%.

---

## 7. Damage (`js/sim/damage.js`, 594 lines)

### 7.1 Common rules

- A hit is DP to a **section** (`drive, reactor, weapons, sensors, hull`) or, for blasts, `spread: true` to the whole hull.
- **Armor**: `shed(dp) = dp × (1 − min(0.6, armor × 0.12 × (spread ? 0.5 : 1)))`. Armor points = class armor + TL armor. A Hellas frigate (3 + 1) sheds 48% of an HE hit (70 → 36 DP); blasts shed half as well.
- **Aim** (`AIM`, line 52) weights by section (drive/reactor/weapons/sensors/hull): DISABLE 0.6/0.05/0.1/0/0.25; DISARM 0.05/0/0.6/0.15/0.2; KILL 0.2/0.5/0/0.15/0.15. Unaimed spread `UNAIMED = { hull .4, drive .2, reactor .1, weapons .15, sensors .15 }`. Section picked with weight `precision × aimed + (1 − precision) × unaimed`. Precision: railgun 0.8, PDC 0.7, HE torpedo 0.5, gear 0.3.

### 7.2 NPC hulls (`hitNpc`, line 245; state `e.combat`, created lazily by `ensureHull` "the first time the ship matters to a fight: traffic that never fights never pays for it")

`e.combat = { hp, hpMax, drive, reactor, weapons, sensors (each 0..1), crew (fraction standing), status ok|disabled|surrendered|wreck, containment (minutes to detonation | null), scrammed, rounds, magazine {he,nuke}, tubes [reload minute], rail [reload minute], scars [] }`.
- `hp −= dp`; `crew −= dp/hpMax × 0.3 × random`.
- Focused: `section −= dp / (0.35 × hpMax)`, plus a spill to a random unaimed section at 30%.
- Spread: every section `−= dp / (0.6 × hpMax)`; reactor < 0.3 starts containment.
- Reactor section: KILL aim with `dp ≥ 0.4 × hpMax` explodes it with P `min(0.8, dp/hpMax)`; reactor < 0.5 starts containment: countdown `randInt(3, 30)` minutes. Each minute a trained crew (crew > 0.3, TL ≥ 2, not scuttled, not a wreck) scrams with P 0.12 (`hullTick`, line 389): reactor capped at 0.2, ship disabled.
- `DISABLED_BELOW = 0.25`: drive under 25% → `disabled` (civilians, pirates, police then offer surrender); `hp ≤ 0` → wreck (driven off, transponder off, tumbles 1.5-5.5°/min from a hash, despawns in 10 days, salvage).
- Effects on capability (`npcProfile`): `maxG = classMaxG × (0.5 + 0.5 × drive)` (0 if drive < 0.25 or scrammed); PDC mounts × weapons; fire-control factor × crew and sensors terms; `armed` requires weapons ≥ 0.25.

### 7.3 The player's ship: decks (`hitPlayer`, line 178)

Sections map to decks: drive→Engine, reactor→Reactor, weapons→Cargo+Engine, sensors→Bridge, hull→living decks (`PLAYER_DECKS`). One random deck of the section takes the local DP (spread: all decks at 50%). `integrity −= dp / hpMax × 100` (patches go first). Per deck hit with local DP `d`:
- **breach** with P `min(1, d/40)` (`setBreach`: the deck vents within minutes);
- **fire** with P `min(0.5, d/90)`, intensity `0.1 + min(0.4, d/150)`;
- each system housed on that deck **faults** with P `min(1, d/45)`, major if d > 35, integrity loss `0.6 d`;
- each person on the deck **wounded** with P `min(0.9, d/90)` through the same trauma model as being thrown about: `applyImpact(m, 2 + d/7)` ("hit by spall and debris");
- reactor deck: KILL aim, `d ≥ 50`: ship lost outright with P `(d − 40)/120`; else containment failure P `min(0.9, d/70)` (90 minutes to scram, reactor.js).
- Hull integrity under 50% "sound": no burns above 3G; 0: breaks up. With any deck breached, `minuteTick` caps the drive at 1G "so the crew can move" (`game.js:273`, damage-control mode).
Printed: "HE on the drive: integrity 49%, breaches Engine, faults Epstein drive, RCS thrusters, Point defense"; "100 DP kill shot on the reactor: 19/20 lost the ship or the containment"; COMBAT.md "One HE hit takes about half our hull" (120 hp light freighter).

### 7.4 Fusion and nuclear blasts (`detonate`, line 367)

Every ship/station within `7 × scale` takes `dp × e^(−d/scale)` as a spread hit if ≥ 2 DP. Reactor blasts by size: S 300 DP/400 m, M 600/800 m, L 1,200/1,500 m, XL 2,500/3,000 m. Safe distance `blastClearM = scale × min(7, ln(dp/2))`: S 2.1 km, M 4.6 km, L 9.6 km, XL 21 km. Printed: an M-size reactor blast wrecks a courier at 1 km; at 50 km it is untouched (hp 60). "Killing a pirate raider at 2 km is safe; killing a frigate at 2 km is not."

### 7.5 Scars, wrecks, debris

Every hit leaves a scar `{s section, k kind, r share of hull points, u, v (place on section, from hash01(id, n, minute)), m minute, d? deck}`; worst 24 kept (`SCARS_MAX`). The renderer draws holes from them (HE: metres across, edge curled, white-hot then dull red e-folding 4 min, venting for 25 min; slug: small clean hole; PDC: pits; blast: scorch). Wrecks tumble (axis and rate from a hash), two in three broken-backed. A ship "blown apart" (`blowApart`, `blownPieces`): 80-150 pieces with speed ∝ size⁻² (BLOWN_V 2 mm/s for a piece L/20 across), 5 heavy chunks, 48 ice flakes, all from hashes so every look sees the same cloud. Test: Deimos lighter (34 m): core 13 m after 6 h, 30 m after 3 days.

### 7.6 Fire and breach control (`fire.js`, SHIPBOARD.md)

Fire per deck: intensity 0-1; grows `0.08 × air × (1 − 0.5 i)` per minute (air = pressure/101.3 × O₂/20.9); burns O₂ `0.5% × i × (400 m³/volume)`/min, smoke as CO₂ `0.35% × i`; out below 25 kPa or 12% O₂; machinery on deck fault with P `0.04 × i`/min; unsuited people burn (torso −1.5 i, arms −i per minute; burns 4/min); spreads through the ladder shaft with P 0.03/min above 0.7 while pressures are within 15 kPa. A firefighter knocks back 0.12/min. Venting a deck starves it (vents at 10% of pressure a minute). The SUITS order puts everyone in a suit before a fight so a burning or holed deck can be vented with its crew on it. An engineer in a suit seals a breach (top-priority job), then the deck repressurizes from tanks. Printed: a fire out after 28 min, peak 97%, O₂ down to 13.4%, 2 suited to fight it; SUITS: 6/6 suited in 24 min; vented: out in 10 min at 35.3 kPa.

---

## 8. Fire control, battle stations, stances (`combat.js`, `stance.js`)

- Fire control holds **one target** (must be tracked). Orders: torpedoes (HE/NUKE × FAST/COLD, one per ready tube), PDC mode `auto` (shoot torpedoes) / `hold` (weapons tight, even vs torpedoes) / `engage` (also rake the target inside gun range), aim DISABLE/DISARM/KILL, **evasive** (battle stations only: `2.5G × TECH.evade` of random jinking, capped at max G; burns fuel at half that G (`JINK_FUEL_SHARE 0.5`); lights the plume; loads the crew).
- **Battle stations**: best shot to the weapons console, best engineer to engineering, next best eye to ops, the pilot to the helm, everyone else to a couch. Crew stay strapped in 10 minutes after the last maneuver (`SECURE_LINGER`). Free-fall movement is slow (half a tile a minute hand over hand), "so call battle stations early"; the nav computer will not flip with anyone off a couch; the standing order never pushes past 1.5G with anyone on their feet.
- Opening fire `engage()` wakes the target (a background force hull as itself), makes it hostile, records the attack with the law (shooting a lawful ship is a crime; shooting back never is; friends nearby join).
- **Time warp cap** (`warpLimit`, line 243): 1× when a torpedo is under 30 min out, a hostile within 75,000 km (0.0005 AU), a demand awaits answer, our own torpedo is in its last 3 min (`OWN_ARRIVAL_S`), or a reactor near us (< 0.01 AU) is in its last 2 min (`FUSE_WATCH_MIN`); 2× within 6 h or 750,000 km; else free (3 = 1 day/s).
- **Stances** (standing station-keeping orders flown by the autopilot): HOLD at a range, KEEP OUT, KEEP WITHIN, TIGHT band 0.5% of range (≥ 200 m) or LOOSE 10% (≥ 1 km, drive cold if the target isn't thrusting, so no plume). One-click ranges: FORMATION 1.9 km, GUNS 60% of PDC reach (3.6 km at TL2), TORPEDO 50,000 km (outside guns and railguns), LONG 300,000 km (torpedoes take an hour or more), SHADOW at the edge of what our sensors hold of it. Doctrine under fire as 3.6; resume once no torpedo within 60 min. Printed: "held at 5000 km · turned away for 24 min · 1 evasions · back on station: true".
- The **threat board** UI (`ui/combat.js`): ship-centred, nose-up, **logarithmic range 1 km to 10,000,000 km on one screen** (7 decades) "because a fight spans both: a torpedo launched from millions of km arrives in seconds of PDC fire at a few km"; inbound ordnance red, ours teal; hollow mark for a dark contact; REACH row from `torpedoForecast`. The tactical display (`ui/tac.js`) is ship-centred, nose-up, true positions within a few km, interpolated between minutes, only what sensors hold. Both are good references for OLYMPUS's in-ship tactical screens.

---

## 9. NPC ship AI (`js/sim/agents.js`, 1,111 lines)

### 9.1 What an agent is

"Most of the world's ships are traffic on rails. A ship becomes an agent when it has a reason to act near us." Agents are `driven` entities with `e.agent = { role, mode, since, next, target, hostile [ids], aggressor, evade, wing [], plan, planKey, cmd, home, zone, contract, ambient, dest, enemies [factions], scan {}, flags {}, request, calmSince }` and `e.nav = { facing, turning }`. They fly with the **same flight model and guidance laws as the player's ship** (`flightStep`, `createPlan('closing', ...)`, `guidanceStep`) including slew limits and the terrain guard. Spawned by `spawnAgent` (rolls an identity from the catalog) or `wake` (hands a rails ship to a pilot from where it is).

### 9.2 Roles (`ROLES`, line 90)

| role | aim | launchAU (km) | standoffM | closeIn | retreatHp | breakOff | surrenders | nukes | approachG |
|---|---|---|---|---|---|---|---|---|---|
| patrol / picket | disable | 0.003 (450k) | 50,000 km | yes | 0.3 | 0.35 | yes | no | 3 |
| pirate | disable | 0.004 (600k) | 100,000 km | yes | 0.5 | 0.35 | yes | no | 3 |
| navy | **kill** | 0.02 (3M) | 20,000 km (railgun range) | no | 0.25 | 0.35 | **no** | yes | 4 |
| civilian | - | - | - | - | - | - | yes, flees | - | - |
| convoy | - | - | - | - | - | - | yes | - | - |

Modes: patrol/picket `cruise → intercept → search-approach → search → cruise` (or `engage`); pirate `lurk → stalk → demand → engage → loot → leave`; navy `patrol → engage`, warns strangers; civilian `drift ↔ flee`; convoy `docked → travel → arrived`. Plus `flee`, `leave`, `surrendered`.

### 9.3 The minute

`moveAgents` (step 4 of the minute) flies each agent on last minute's `cmd`; minutes above `HIGH_DOSE_G = 6` cost crew via `strain`: `crew −= crew × STROKE_RISK(0.0006) × (G − 6)` (same rate as the player's crew). `agentsTick` (step 10): `hullTick` (containment countdown), `leaves()` (ambient agent > 0.25 AU from us, or `leave` mode > 0.05 AU → back on rails via `putToSleep` or removed), then `think()`: observe the player (scan count; identified at 60 min or transponder), surrender if a surrendering role has no drive while hostile/fleeing, `decide()` every minute when urgent (engaged, fleeing, any hostile) else every `IDLE_THINK = 5` minutes, then `steer()`.

### 9.4 Decide and brains

`decide`: prune hostiles out of the fight; if any hostile and the role fights, mode `engage` on the nearest; no hostiles left → pirates `loot` a disabled/surrendered target, others default mode. Brains:
- **lawman** (patrol/picket): engage any visible pirate/wanted within 0.01 AU; engage the player if wanted ≥ 3 or identified enemy; cruise: inspection policy (routine 0, zone 0.6, else 0.15; suspicious: wanted, dark and tracked ≥ 10 min, illegal hull, hostile flag); intercept: hail from `HAIL_AU 0.002` (300k km) "cut your drive and stand by"; search-approach to within 10 km at < 20 m/s; search 45 min (`SEARCH_MIN`); refusing (burning) = resisting arrest. Stops only inside jurisdiction and only if our course keeps us inside it until the cutter could be alongside (`canStop`, 2-day horizon); one stop at a time; never in port, never mid-fight, not if recently inspected.
- **pirate**: lawmen within 0.005 AU → leave. Lurk: if found by a stronger hunter that is closing (each holds the other) → leave before being shot at; stalk the player if `strength(self) ≥ PIRATE_NERVE (0.5) × strength(player)` ("a demand is a bluff"), else jump civilian traffic within 0.01 AU (10%/think). Demand at `DEMAND_AU 0.0005` (75,000 km): 30% of our credits (min 500); pay → leave; refuse → engage. Having crippled us, one last demand at 60%. Loot 60 min, then leave.
- **navy**: engage enemy-power warships/patrols it can see (never civilians: "they are not targets in a war"); engage the player if wanted ≥ 2, identified enemy flag, or in one of its own navy's stolen hulls; in a zone, warn off unidentified/hostile-flag ships within 0.0005 AU, engage if they come within half that after complying.
- **civilian**: flee from a hostile ship, from ordnance it can see arriving within `PANIC_S = 2 h` ("no hauler carries the reaction mass to run for days"), or from us within 0.01 AU after we fired; miners turn their gear on the closest hostile in reach (`defendWithGear`); calm after `CALM_MIN = 6 h`.

### 9.5 Fight (`fight`, line 1020)

1. **Break off** if `hp/hpMax < retreatHp` or `strength(self) < breakOff (0.35) × strength(enemy)` (unless cornered and fighting): navy → `flee`, others → `leave`.
2. `evade` = any seen inbound within 20 min or enemy within 50,000 km.
3. Distance: stand off at `standoffM`; close to `min(3 km, 0.5 × strafeM)` only to finish a crippled/toothless target (`maxG ≤ 0`, PDC mounts < 0.5 or no ammo) if `closeIn`. Under torpedo fire (TL2+), close no faster than 5 km/s. `goTo(..., hostile=true)` flies to the enemy on **where it is and how it moves, never its thrust** ("two ships each matching the other's burn would fly side by side and never meet"), and the drive fires only once the nose is on the vector (`lean = false`).
4. `guardAgainst`: jink if any seen inbound within 20 min; with counter-burn, flee from the nearest torpedo under 45 min.
5. Weapons, only if it sees the target (and notes a lock on the player):
   - Torpedoes within `launchAU`, unless out to disable and the target is already crippled: keep **salvo = max(1, min(tubes, ceil(targetPdcMounts × λ × factor × 2) + 1))** in the air at the target; profile COLD beyond 0.002 AU (300k km), else FAST; warhead: navy uses nukes on military/authority targets, else HE first; skip if `torpedoForecast` says no reach.
   - Railguns within 30,000 km, every ready mount each minute (1 min recharge).
   - PDC strafe inside strafe range.

### 9.6 Running (`run`, line 915) and the end of a chase

"Done as a captain with people aboard would":
- **Sprint** at max G while accumulated stroke losses `< SPRINT_LOSS = 0.1` of the crew, then `SUSTAIN_G = 6` ("what a juiced crew takes for days"). Printed: "sprint at 8G until 90 min (crew 90% standing), then 6G; run down and struck at 90 min, 109054 km off".
- **Going dark**: a silent ship cuts its drive once `d > DARK_MARGIN (1.2) × hullSignature × pursuerQuality` (a transponder ship: past `RANGE.LONG × quality`), stays dark while unseen; keeps burning while torpedoes it saw are still *due* (finite time-to-go) so they spend their Δv. Printed: "dark at 1.5M km; found at 200k km, ran, dark again 31 min later at 472,066 km; plot: fix".
- **Cornered**: if not sprinting and `caughtWithin(pursuer, us at g) < CORNERED_S = 3600 s`: a crew that surrenders strikes (to an NPC at once, to the player with an offer: ACCEPT or ignore, after which it fights); one that doesn't (navy) turns and fights.
- **Nobody runs for ever** (v1.12.19, 2026-10-31, after the user's SH Guardian 19 burned at 6G for days to 12,668 km/s, 9 AU out): a torpedo opening on a runner is never due; a navy captain clear for `CALM_MIN` 6 h stands down to its beat at 1G (or at once if its pursuer is gone); a transponder ship cuts its drive past what a lit hull shows. Printed: "transponder on: drive cut after 448 min at 65.5M km, 1,699 km/s at most".
- NPCs do **not track reaction mass** (no `fuel` in agents.js/combatants.js): their limits are crew G-tolerance, Δv of torpedoes, and doctrine.

### 9.7 Requests (talking to the player)

`openRequest(kind, text, options)` with a 15-minute deadline (`REQUEST_MIN`); **silence is an answer** (`expireRequests`): sitting still complies with an inspection (and a warning if the transponder is on), burning refuses; pirates take silence as no; a surrender offer ignored lets it fight. Kinds: `inspect`, `demand`, `warning`, `surrender`.

### 9.8 Strength (`combatants.js:257`)

```
torp    = torps > 0 ? (tubes×3 + min(torps,12)×0.5) × torpedoMaxG/18 : 0
offense = 1 + torp + (pdcAmmo>0 ? pdcMounts×0.5×factor : 0) + railMounts×4 + gearMounts×0.3
defense = (1 + armor×0.5) × (1 + pdcMounts×λ×factor×2) × (1 + maxG×0.05) × √(max(1,hp)/120)
strength = offense × defense
```
Used for break-off, pirate nerve, and zone clashes (Lanchester, 11.3).

### 9.9 Duel balance (printed by `combat.test.mjs`, 12 seeds, staged 0.0015 AU ≈ 224,000 km apart, 12 h)

As the AI fights (outgunned break off):
- Belt refit corvette vs Martian frigate: 12-0, Hellas kept 100%; 12 corvettes destroyed.
- Belt refit frigate vs Martian frigate: 12-0, 12 destroyed.
- Earth TL2 frigate vs Martian frigate: 12-0, Hellas 100%; 9 destroyed, 3 fled.
- Earth TL3 frigate vs Martian frigate: 8-1 (3 undecided), Hellas kept 75%; Everest 8 destroyed, 2 fled, 2 fighting.
- Belt refit corvette vs Earth corvette: 12-0; 12 fled.
- Earth corvette vs Martian corvette: 12-0, Tharsis 100%; 8 fled, 4 destroyed.
Nobody breaks off: similar; TL3 Everest vs Hellas 6-1 (5 undecided).
Our ship (armed light freighter / Belt refit corvette) vs a Hellas: crippled or killed 6/6, won 0/6. Armed light freighter vs pirate gunship: won 6/6, our hull 100%, theirs lost 51%.
Navy closing: "from 224,397 km: closest 19,769 km in 2½ hours (navy standoff 20,000 km)". The design statement (COMBAT.md): "between hulls of a size, the better-built ship wins... Only Earth's best (TL3) frigate has an outside chance against the Martian one."

Other printed AI results: "DISABLE: 17/20 crippled by railgun hits · KILL: 5/20 reactors detonated by HE hits"; "demand after 1.8 h; paid 1500 MCR; pirate now leave"; "hailed after a request, searched in 3.6 h: inspectors seize 1 contraband consignment. Fine 4,000 MCR".

---

## 10. Level of detail and the scale strategy (`world.js`, `spatial-hash.js`)

### 10.1 Motion models (`world.js` header)

| model | used by | cost |
|---|---|---|
| `orbit` (rails round a body) | stations, berthed/parked ships, nav marks, forces on post | analytic O(1), exact at any time |
| `transit` (brachistochrone along the chord between two moving rails endpoints, or from a coasting `fix`) | NPC traffic and forces under way | analytic O(1); also sets `thrust`/`heading` so sensors see the plume |
| `free` | wrecks adrift, our ship | integrated (velocity-Verlet under the Sun + near bodies) |
| `driven` | agents and ordnance | stepped by their controller each minute; the world only indexes them |

Transit: `T = max(30, 2 × √(L / (g·g0)))` minutes at g (forces 1G); position `frac = τ<½ ? 2τ² : 1 − 2(1−τ)²` along the chord, endpoints' own motion blended; a `fix` start fades out by arrival.

### 10.2 The near pass and the calendar

- `HORIZON_AU = 0.105` ("nothing gets this close to us unseen": past the longest sensor/radio range 0.1); near pass reaches `0.12`. Every full minute, entities inside are refreshed exactly (`world.tick`).
- **The far world keeps a calendar** (`world.cal: minute → entities`): each entity is visited when its next business is due (`WORLD_DUE` hooks: a leg's end, a port call's next step, a force's arrival, a despawn) *or* when its position could first come within the horizon: `t = (√(b² + 2a·gap) − b)/a` with `b` the relative speed and `a` = its G + max(1, our G), clamped 5 min to 1 day. Stations/marks refresh hourly.
- A round-robin **net** sweeps the whole world once a game day (`SWEEP_MIN 1440`, ≤ `SWEEP_CAP 1000` per frame): "the net under anything that changed an entity's timing without saying so". `backgroundBudget(n, minutes) = min(1000, ceil(n × minutes / 1440) + 1)`.
- `WORLD_VISITORS` hooks (traffic `serviceShip`, forces `serviceForce`, despawn) run on each visited entity: background behaviour without per-minute work.
- **Indexes**: `byId` Map, `SpatialHash(0.05 AU cells)` (incremental, re-filed only on cell change, O(moved); swap-remove arrays; `queryRect` iterates occupied cells when the rect is huge), `stations` array, `beacons` Set, **`driven` Set** (agents + ordnance: "few and bounded"), `forces` Set (a few hundred hulls). Anything that needs "every ship fighting X" iterates `driven`, never the world.
- Combat state (`e.combat`) is created lazily; scars and debris are hash-derived and memoized.

Performance (printed): **203,152 entities (193,414 in transit): spawn 1,108 ms · 7.04 ms per game-minute · 19.0 ms per 1-day/s frame**; default system 3,152 entities 0.061 ms per game-minute, save 2.60 MB.

### 10.3 The live window for military hulls (`forces.js`)

`WAKE_AU = 0.1` (≈ long sensor reach, 50 light-seconds): background hulls within it (not berthed, not command ships, not resting) wake as agents, nearest first, up to `MAX_AWAKE = { police 3, navy 12, pirate 2, proxy 3, command 2 }`. `SLEEP_AU = 0.25`: agents with no business with us go back on rails (`putToSleep`: a filed course from where they are to their post/home, or lie up), not re-woken for `REST_MIN = 12 h`. Crippled hulks are dropped from the forces instead. Woken traffic goes back to its route once calm (`CALM_MIN + RESUME_MIN` = 7 h). "The skirmish we fly into is the one the newsfeed reported, fought by the ships that were sent to it." Printed: "at the zone: 5 warships awake ... fighting: true; we left: 5/5 back on rails". Cost: "the wake check walks [the force list] once a minute, and the census ... once a day".

---

## 11. The living background war (`politics.js`, `conflict.js`, `forces.js`)

### 11.1 Politics (daily, a handful of numbers)

Each pair (UN-MCR, UN-OPA, MCR-OPA) has a relation (−100..+100) and a phase: allied ≥ 55, friendly ≥ 20, neutral, cold war ≤ −20, crisis ≤ −45, war (declared below `WAR_AT = −72`, ended by ceasefire to −50 once exhaustion > 0.4). Baselines: MCR-UN −32 (ceiling −25: "Earth and Mars are never friends"), OPA-UN −10, MCR-OPA −15. Pressure builds by drift (MCR-UN 0.0018/day) and incidents, relieves at 0.008/day, a crisis spirals at 0.012; sub-faction agendas lean it (hawk/militant +1, dove −1, moderate −0.6, profit +0.3...). Result: "years of cold war, a crisis, a short hot war, a ceasefire, and the long slide back". Proxies (a power funding a mercenary company, a pirate clan, a Belter cell against a rival) and in-fighting (leaks, sabotage at a yard: `sabotageYard` delays hulls on the slips).

### 11.2 Hot zones (`conflict.js`)

Daily at minute 300, with chance `0.2 + 0.5 × mean tension`, a flashpoint is picked among bodies from the influence field: contested bodies give standoff (cold w 0.4; crisis 0.6), blockade (crisis 0.5, war 0.4), skirmish (crisis 0.2, war 1); lawless Belt/outer bodies (control < 0.6) give pirate activity; an inner-held body with OPA influence > 0.2 gives insurgency. Plus a **war front** per war (the body both powers reach most, 120 days, radius 0.04-0.07 AU, intensity 0.85, 2-3 control points ALPHA/BRAVO/CHARLIE) and a **proxy zone** per paid proxy. `MAX_ZONES 8`, cap 10. Zone: `{ id, kind, factions, body, r 0.002-0.01 AU offset, phase, radius (skirmish 0.01-0.03, else 0.02-0.06), intensity, born, until (5-30 days), wrecks }`. Intensity follows the pair's phase (target war 0.85, crisis 0.6, cold 0.4); a standoff escalates to a skirmish in war (or crisis > 0.7 with 15%/day); a truce reverts it.

### 11.3 Forces that answer (`forces.js`)

`NAVY_STRENGTH = { UN 56, MCR 12, OPA 8 }` hulls in commission (kinds drawn from corvette ×2, frigate ×2, destroyer); `COMMAND_SHIPS = { UN 3, MCR 3, OPA 2 }` (classes unn-battleship, mcrn-battleship, opa-gunship); police 3 per policed station on beats 0.002-0.012 AU out (periods 2-6 days); `PIRATES_AT_LARGE = 24` lying up cold near lawless bodies. Yards: UN Luna Yards, MCR **Phobos Yard**, OPA Tycho + Ceres. A zone draws `ZONE_FORCES` shares of each navy: standoff 15%/15%, blockade 25%/8%, skirmish 25%/25%, front 40%/40%, insurgency 10%, proxy 8% (≥ 1 hull: "a skirmish draws 14 UNN hulls against 3 MCRN"); only **berthed** hulls go, only once `GATHER = 60%` of the squadron can go together; daily `reinforce()` tops up the fiercest fights first. Every power in a fight sends a **command ship** to the rear (0.4 radius behind its side), a forward operating base that posts missions, supplies at a tenth, takes reports, publishes its position. Daily **census** at minute 420: count hulls at sea, berthed and on the slips; lay down what is missing at the yards (`BUILD_DAYS`: cutter 3, corvette 4, gunship 6, frigate 8, destroyer 14, battleship 30, raider 2; ×0.6 at war, ±20%; `YARD_SLOTS` UN 4, MCR 2, OPA 2, pirate 3); launch what is built. User-caught bug (v1.12.1, 2026-10-25): "the UNN had swollen to 76 of 56": now **"hulls come from the yards, never from thin air"**.

### 11.4 Hourly outcomes far from us (`zoneIncidents`, minute :17 each hour)

`INCIDENT_RATE` per hour × intensity: front 0.1, skirmish 0.06, pirates 0.04, proxy 0.04, blockade 0.01, standoff 0.005, insurgency 0.01. Caps: at most 4 wrecks per 8 days per zone (front 10), lifetime 40 (front 80). With forces on, losses are **real hulls** from `forcesAt(zone)` (on station, on rails, not command ships):
- **clash** (standoff/skirmish/front; blockade 30% of hours if both navies are there; proxy 50% hunt): fires with `rate × min(1, (nA + nB)/4)`; the loser side by **Lanchester's linear law weighted by toughness**: `lossA ∝ nA × mightB / mightA`, `might = Σ classStrength`; "twenty-two UNN corvettes against five MCRN frigates of the same total might lose about five hulls for each of the Martians'". At a front the loser loses a control point with P 0.35.
- pirates/proxy/blockade: a traffic ship in transit through the zone (≤ 500 sampled from a hash query, refreshed exactly before counting) is taken; pirates lose a raider to its prey 15% of the time.
- insurgency: navy on station loses a hull to a cell's mine 40% of hours (× rate); else a runner stopped or bombed.
The victim becomes a **wreck in place** (`wreckInPlace`: held with the zone's body, despawns in 8 days, salvageable), the loss is an incident feeding politics (naval kinds 1, blockade 0.3, insurgency 0.5, proxy 0.2), and the news is **relayed at light speed** to the player (`relay`).
Printed: "sent {UN 15, MCR 4}; both on station by day 8; lost {UN 2, MCR 4} ... on station now {UN 12, MCR 2}"; "60 days at the front: 60 lost, at most 10 in eight days; on station now UN 14, MCR 5"; "120 days: proxy raiders 4 fought out with the UNN, 5 haulers taken · insurgency: 6 MCRN hulls to the cells, 13 runners stopped or bombed · pirates: 29 taken, 5 raiders lost to their prey"; a year: zones born pirates 83, insurgency 33, standoff 10, proxy 14, front 2, blockade 1, skirmish 1; 301 lost in the fights that ended; fight-days without a forward command 22 of 227.

### 11.5 The encounter director (hourly, minute :41, around the player only)

Skips if within a quiet period (6-24 h after the last), or ≥ `MAX_AMBIENT = 6` ambient agents. Rolls: patrol `0.06 × control level`; per zone: standoff patrol `0.12 i`, blockade picket `0.2 i`, skirmish/front battle `0.2 i / 0.3 i`, proxy raid `0.1 i`, pirates `0.12 i` + ambush `0.05 i`; lawless space pirate `0.04 × lawless`, ambush `0.02 × lawless`. **It calls on ships already there first** (`fromPopulation`: a cutter on its beat, the nearest pirate lying up within `DISPATCH_AU 0.05`, a hauler already in the lane), and only spawns from beyond sensor range when nobody suitable is near: "The cost never grows with the world."

---

## 12. Intel: light lag and the plot (`intel.js`)

- `relay(state, fromPos, type, payload)` queues news to arrive after `lightMinutes(distance)`; the inbox is a sorted list. Printed: 1 AU heard after 8 min, 5 AU after 42 min.
- Each station's traffic control publishes a **digest** every 6 h (`DIGEST_MIN`, phase-staggered by station hash): transponder ships within `TC_REACH_AU 0.03` (4.5M km), up to 400 each: berths, filed plans (flown forward on the plot exactly: "mean error 0 km"), fixes. Dark ships never appear. A digest landing while the comms array is down is lost.
- Lost contacts become `fix` records coasting at their last velocity with uncertainty `σ = 30 m/s × t + ½ × 0.05 G × t²` (printed: "circle 3 km now, 319,877 km in 10 h"); forgotten after 5 days (craft 6 h, berths 4 days, plans 2 days after arrival). Plot bounded at 6,000 records (stalest fifth dropped).
- `liveKnowledge(e)`: live (on sensors, our telemetry), charted (stations, nav marks, a command ship on post, contract targets on published orbits), or a report.

---

## 13. Mission generation

- **Distress calls** (`missions.js`): `SPAWN_CHANCE 0.0007`/min (~4%/h) when eligible, cooldown 720 min, ≤ 3 open, not at battle stations. Types (weight, timer): FUEL_DRY (4, 36 h), ENGINE_FAILURE (3, 24 h), RUNAWAY (1, 8 h, stuck at 2-5G), REACTOR_SCRAM (2, 12 h, suit O₂); UNDER_ATTACK comes from the director's ambush (a pirate already on a civilian; accepting puts it under our PDC cover). Placed 600k-3.7M km away; a ship adrift in a world's space that will fall says how long it has (`fallOf`). Feasibility from a simulated intercept (`assessIntercept`). Escalating radio chatter tiers (normal/urgent/critical by timer fraction). Rescue = hold formation within 10 km and hail.
- **Station contracts** (`contracts.js`, captain-for-hire economy): boards refreshed every 10 min for stations within `RANGE.LONG`; peaceful types (CARGO 4, PLANETSIDE 3, PASSENGERS 3, FUEL 2, INVESTIGATE 2, SALVAGE 3, SURVEY 3, MEDEVAC 2) and, 40% of slots near hot zones (`HOT_SHARE`), BOUNTY / ESCORT / SMUGGLE / RECON. Bounties are graded (`BOUNTY_GRADES`: PETTY 35%, WANTED 40%, NOTORIOUS 18%, MOST WANTED 7%: ship class, escorts, counts, fix age 3-96 h, search area 50k-500k km, pay 2,000-32,000, per-head 900-1,500, captain 4×), with or without the drive signature on file (only the most wanted, ~2%). Every contract keeps its brief and a timeline log (≤ 30 lines).
- **Military work** (`military.js`, for a captain flying a power's flag, from command ships and 15% of nearby station boards): **INTEL** (sensor locks inside 300,000 km on N enemy warships, held 10-20 min each), **HOLD** (stay within 75,000 km of a front's control point for hours; `HOLD_WAVES = 4` waves of 2-3 enemy warships every 90-150 min; the point stays ours), **STRIKE** (an HVT with escorts; rank 2), **COVERT** (lock a rival sub-faction's ship unidentified). Ranks (`service.js`): MCR Ensign, Lieutenant, Lieutenant Commander, Commander, Captain, Commodore, Rear Admiral at reputation 0/40/120/300/600/1000/1600; kill reputation cutter 10, corvette 15, frigate 30, destroyer 60, battleship 150.

---

## 14. Boarding (`boarding.js`, abstract)

Phases: **muster** (party suits up and walks to the lock; waits up to 25 min for stragglers, 90 cap) → **cross** (mated collar 2 min; EVA at 2 m/s, max 2 km, ship must be still: relative speed < 2 m/s and not thrusting) → **breach** (a locked hatch is cut: EVA 10 min, collar inner hatch 6 min) → **fight** → **secured** (actions: SEARCH 20 min, TAKE STORES 40, TAKE CARGO 30 t/h, TAKE PRISONERS 15, SCUTTLE 10 min to set + 120 min fuse, SALVAGE runs 45 min decaying ×0.55, ACCOUNTS 30) → **return**.
Defenders: `RESIST = { military [1, 0.75], authority [0.85, 0.6], irregular [0.9, 0.55], civilian [0.3, 0.3] }` (share that fights, quality); `fighters = aboard × share × (beaten ? 0.6 : 1) × U(0.8, 1.2)`; a struck crew has holdouts (pirates 30%, others 12%: 15% of the crew); invited = no fight.
Fight per minute: `ourPower = Σ (0.3 + 0.7 × security/100) × health/100 × (0.6 + 0.4 × efficiency)`; `theirs = defenders × quality × 1.3`; their losses `Poisson(ourPower × 0.22)` (40% of downed killed); our hits `Poisson(theirs × 0.18)`, each `applyImpact(m, 2.5 + 9U)`; they surrender when ≤ 10% left (quality > 0.7) or ≤ 35% with P 0.5; the party falls back when ≤ 30% of it is able, carrying who it can, leaving the dead and taking prisoners of the rest. The law: boarding a lawful uninvited ship is piracy. Pitfall the user hit (v1.12.14, 2026-10-31): a party lost with its blown hull "lay dead on the bridge at the spot they left the lock": anyone aboard a hull that goes is lost with it, grieved, on the memorial, no body aboard. Stations: "Boarding a station is a marine operation: not yet." (`boarding.js:100`): longhaul explicitly left marine operations for later.

---

## 15. Pitfalls the user caught in longhaul (keep them fixed in OLYMPUS)

- Unit error made pirates charge to 800 km instead of 800,000 km (CLAUDE.md): keep units in constant names.
- 2026-10-25 v1.12.1: navies swelled past strength by spawning hulls on the spot: hulls only from yards, squadrons go together.
- 2026-10-25 v1.12.6: a route ETA for a chase that never closes froze the game at 4 fps: any forward simulation must detect "never" early and cheaply.
- 2026-10-31 v1.12.14: people lost with a hull came back as corpses on our deck.
- 2026-10-31 v1.12.18: the hostile light lit for a ship 5 AU away: displays go by what the ship knows.
- 2026-10-31 v1.12.19: a runner burned for days to 12,668 km/s: nobody runs for ever; a torpedo opening is never "due".
- 2026-10-31 v1.12.20-21: a command ship's role vanished while the user was alongside to report: state transitions must respect a player mid-interaction.

---

## 16. Reuse assessment, module by module

| module | verdict | why |
|---|---|---|
| `sim/weapons.js` | **reuse** (copy the tables and the two functions) | Pure, no imports, calibrated, Expanse-faithful. Add marine-scale weapons separately (a different table: rifles, not ship guns). |
| `sim/sensors.js` signature model | **adapt** | `signatureRange`, `hullSignature`, `canSee`, `REVEAL`, light-time per contact are pure and right. The board (`sensorsTick`) is written for the player's ship; OLYMPUS needs it per-ship (any ship's CIC) and per-person (a marine's helmet HUD sees nothing at AU scale). Drop PLAYER special-casing. |
| `sim/combatants.js` | **adapt** | The idea (one kinematics + one profile view of any combatant, lazy combat state) is exactly right. Remove `PLAYER`; make the profile come from crewed stations (who is at the guns) for every ship, since OLYMPUS ships have NPC crews with skills. `strength` reuse as-is. |
| `sim/ordnance.js` | **adapt (port the math)** | Guidance (ZEM deadbeat, pursuit speed, late braking, reserve), `torpedoForecast`, `closestApproach` (with `tau`), `captureRadius`, salvo/hazard endgame, slug and strafe resolution are the best part of longhaul. Dependencies (`world.js`, `terrain.js`, `damage.js`, player resources) need a thin interface. Extend: emit per-second impact timestamps for the interior simulation. |
| `sim/damage.js` | **adapt** | NPC four-section model, armor shed, aim weights, containment/scram, blast falloff, `blastClearM`, scars by hash, wreck tumble, blown-apart debris: reuse the numbers. The player-ship deck model is too coarse for a game whose player walks the ship: replace with a geometric hit (entry point from the scar u,v on the hull, a penetration path through tiles; slug = small through-and-through holes, HE = metre-scale hole + spall cone + fire chance, PDC = pitting) calibrated to longhaul's probabilities (breach d/40, fault d/45, wound d/90, fire d/90 ≤ 0.5). |
| `sim/combat.js` | **reference** | The player-as-captain fire-control panel. A marine does not run fire control; OLYMPUS needs the same logic run by the NPC weapons officer of the player's ship and shown on a repeater screen. Warp-cap rules (1× under 30 min to impact etc.) are a good reference for OLYMPUS's time-skip interlocks. |
| `sim/agents.js` | **adapt** | The doctrine is excellent and tested: roles, break-off at 0.35 strength, retreat hp, pirate nerve 0.5, salvo sizing to saturate PDC, counter-burn, close ≤ 5 km/s under fire, aim on position not thrust, sprint then 6G, go dark at 1.2× reach, cornered strike-or-fight, stand down after 6 h, requests with silence-as-answer. The code is 1,100 lines heavily coupled to the player as a ship (law, service, comms, requests). Port the rules into per-role brains over uniform entities; the player's own ship becomes an MCRN agent. |
| `sim/forces.js` | **adapt** | Exactly the "living background war, cheaply simulated" the user wants: real hulls on rails, squadrons from berths, command ships, daily census and yards, live window wake/sleep. Extend with ground garrisons and marine detachments (OLYMPUS's player is in one). |
| `sim/conflict.js` | **adapt** | Zones from politics, hourly Lanchester outcomes, wrecks in place, light-speed news, caps that keep wars long; the encounter director that uses ships already present. For OLYMPUS add ground-zone kinds (peacekeeping on Europa, riots, sieges) and outcome tables for marine actions. |
| `sim/politics.js` | **adapt** | Daily relation/pressure/exhaustion model with phases; cheap. MCR-UN baseline −32, ceiling −25. Decide with the user whether OLYMPUS follows canon or emergent history. |
| `sim/intel.js` | **adapt** | Light-lag relay, digests, plot with growing uncertainty: directly useful for orders and news reaching a marine (Europa to Mars is 33-55 light-minutes; orders are old when they arrive). |
| `sim/world.js` + `sim/spatial-hash.js` | **reuse (spatial hash as-is) / adapt (world)** | Proven at 203k entities, 7 ms/game-minute. The calendar + horizon + net pattern generalizes to people as well as ships (an NPC far away is visited only when its next scheduled thing is due). Self-contained except ephemeris/gravity. |
| `sim/traffic.js` | **reference / adapt transit** | Civilian traffic with port calls is longhaul's economy; OLYMPUS needs background traffic for the space layer (and a ride for a marine on leave), cheaply: reuse the analytic transit + WORLD_DUE visitor pattern, simplify the port-call state machine. |
| `sim/missions.js` | **reference** | SOS generation, feasibility via simulated intercept, chatter tiers. OLYMPUS's player gets orders from a chain of command; SOS can become "the ship is diverted to answer a mayday" events. |
| `sim/contracts.js` | **skip (reference bounty grading and briefs)** | A trader-captain job board. Keep the idea of a brief with fixed facts + a timeline log per operation. |
| `sim/military.js` | **reference** | Operation templates (INTEL locks, HOLD the point with waves, STRIKE an HVT, COVERT) map to fleet operations the marine's ship takes part in. |
| `sim/boarding.js` | **adapt phases and numbers; skip the player's fight model** | OLYMPUS boardings are played (tradecraft-style, tile by tile). Keep phases and timings (collar 2 min, cut 6/10 min, EVA 2 m/s ≤ 2 km, ship still), RESIST defender table, and use the Poisson exchange as the **off-screen** resolver for NPC boardings and for squads the player is not in. |
| `sim/fire.js` | **adapt** | Per-deck fire model with good constants; refine to per-compartment (and per-tile spread) for an interior the player walks. |
| `sim/stance.js` | **reference** | How an AI helm keeps range orders; the marine never flies, but the ship's AI does. |
| `sim/hunts.js`, `sim/station-defense.js` | **reference** | Identification under uncertainty; stations as combatants with sections. |
| `ui/combat.js` threat board, `ui/tac.js`, `ui/scope-fx.js` | **reference** | The log-range (1 km-10M km) threat board and the telescope effect timings are the look of an Expanse tactical screen; OLYMPUS will draw its own in pixel art. |

---

## 17. What OLYMPUS needs, and how to build it from this

### 17.1 Ship combat experienced from inside, by a marine

The marine is strapped in a crash couch (or caught on their feet), sees a **repeater tactical screen** (the CIC's picture at the ship's light-lagged sensor knowledge), hears the CIC on the 1MC, feels G, and lives through hits as compartment events. Proposal:

1. **Two time scales, one sim.** Keep longhaul's minute-stepped ship sim (it is what makes multi-hour torpedo flights and day-long chases cheap) for every ship. The player's ship interior runs in real time at tile resolution. The minute sim resolves an engagement and emits **timestamped events** within the minute: `closestApproach().tau` gives the second a torpedo arrives; PDC bursts have known durations (`exposure` seconds; tracers at 1,200 m/s "at 6 km the first of a burst lands some five seconds after the guns open up"); slug impacts at their pass second. The interior plays them at those seconds: PDC chatter through the hull, the alarm, the shake, the breach.
2. **Combat is mostly waiting.** With realistic numbers (3.6 h to hit a hauler at 300,000 km, 8.6 days for a 6M km cold shot), the marine's experience is hours strapped in with juice, interrupted by seconds of violence. This fits the user's "things take time, activities skip time": a "strapped in, waiting" activity that fast-forwards, interlocked like longhaul's warp cap (1× when a torpedo is under 30 min out, when the ship's own salvo is in its last 3 min, a reactor nearby in its last 2 min).
3. **G and the body.** Use longhaul's doctrine as the ship's captain's behaviour: sprint at max G while the crew can take it (losing up to `SPRINT_LOSS` 10% to strokes), then 6G on juice for days; ≤ 1.5G with anyone on their feet; counter-burn turns from torpedoes 45 min out; jinking at `min(3, maxG/2) × evade` G. The player's body feels it (another research slice covers physiology).
4. **Damage control as gameplay.** Replace the section→deck dice with geometry: the hit picks a hull point (the scar's u,v), the warhead decides the hole (HE: metres, spall cone into the compartments behind; slug at tens of km/s: through-and-through, a line of small holes across compartments; nuke near-miss: spread damage to every compartment at half), then compartment atmospheres vent through holes (a gas sim per compartment, not per tile, for cost), systems on damaged tiles fault, people in the spall path are wounded through the trauma model, fires start by longhaul's probabilities. Damage-control jobs (seal breach in a suit, fight fire, vent a deck, rig a system) are things the marine can be ordered to do. Calibrate so that over many hits the totals match longhaul's printed numbers (an HE hit on the drive section of a 120-hp hull: ~50% integrity, an engine-room breach, 2-3 systems faulted).
5. **The tactical screen** shows only what the ship's sensors hold, with light-time, dark contacts hollow, inbound red, ours teal, last fixes aging with growing circles: longhaul's display grammar (COMBAT.md "Seeing"; `ui/combat.js`).

### 17.2 Boarding actions

1. Strategic layer: longhaul's phases and timings decide *when* the marines go: muster at the lock in suits, cross a mated collar (2 min) or EVA ≤ 2 km at 2 m/s only when the hulls are matched (< 2 m/s, no thrust), cut the hatch (6 or 10 min).
2. The fight the player is in is **played** on the target ship's tile interior (tradecraft-style top-down shooting with weapon handling); defenders' numbers and quality come from `RESIST` (navy 100% fight at 0.75 quality, pirates 90% at 0.55, police 85% at 0.6, civilians 30% at 0.3; disabled ×0.6; struck crews have a few holdouts) and the target hull's crew count/state (`e.combat.crew`).
3. Everything not seen by the player (another squad, an NPC navy boarding a pirate) is resolved by the Poisson exchange (`fightMinute`) as an outcome.
4. Station boarding ("a marine operation: not yet" in longhaul) becomes a first-class OLYMPUS mission type.
5. Keep the hard rules the user insisted on: anyone aboard a hull that blows is lost with it; a party can only come back across what it can cross.

### 17.3 A living background war, cheaply

Port `politics → conflict → forces` nearly whole: daily politics, zones, squadrons from Phobos Yard (MCR 12 hulls in commission against the UNN's 56; each Martian hull worth ~5 Earth ones), command ships at the rear, hourly Lanchester outcomes, wrecks in place, news at light speed, yards replacing losses in `BUILD_DAYS`. Extend it with a **ground layer** for marines: garrisons and peacekeeping deployments (the user's own example: a drop ship to Europa for peacekeeping) as zone kinds with their own outcome tables, and the marine's unit as a force record whose fate is resolved as an outcome when the player is elsewhere. Keep the live window: zone ships wake as agents within the player's ship's sensor reach (0.1 AU) and sleep past 0.25 AU; keep `MAX_AWAKE` caps; keep "calls on ships already there first".

### 17.4 Scale

Adopt longhaul's world architecture wholesale: analytic rails for everything not near the focus, a calendar for due business, a daily net, a spatial hash, a bounded `driven` set, lazy combat state, hash-derived cosmetics. It holds 200k ships at 7 ms per game-minute; OLYMPUS will add people (crowds far away should be calendar-visited outcomes too).

---

## 18. Open questions only the user can answer

1. Does the player ever run fire control or command a ship (an officer track), or always experience ship combat as a passenger marine (repeater screens, damage control, ordered tasks)?
2. Timeline: canon Expanse history (fixed events and dates) or longhaul's emergent politics (cold war, crisis, war cycles)?
3. Keep longhaul's balance philosophy ("the better-built ship wins", MCRN TL4 hulls ~5× UNN TL2 ones, MCR 12 hulls vs UN 56)?
4. Is longhaul's 2-D (ecliptic-plane) space acceptable for OLYMPUS's tactical and system layers? (It suits top-down; the code has no z.)
5. Which MCRN hulls get authored interiors the marine lives in (Tharsis corvette 46 m crew 9, Hellas frigate 120 m crew 26, Valles destroyer 220 m crew 80, Olympus-class battleship 480 m crew 280), and how many marines does each carry? Longhaul has no troop-capacity data.
6. Nuclear torpedoes: free use by the MCRN AI against warships (longhaul's navy role does), or rules of engagement surfaced to the player?
7. Should NPC-vs-NPC boardings and battles the player can see on a screen (but is not in) be resolved by outcomes (cheap) or simulated in full?
8. How long may a ship engagement keep the player strapped in at forced 1× time? Longhaul forces 1× only in the last 30 minutes before impact.
