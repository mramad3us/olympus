# CONTRACTS

OLYMPUS: the shared contracts, in one place. Several sections build on the same names and numbers: the clock and its constants, the start, the Plan of the Day, the job slots, the budgets of a tick and a frame, the people a scene holds, the state's top-level keys, the ids, the bus facts, the save slots, the voyage profiles, the unit sizes, the air and the names of ships and places. Each contract has one owner section, which holds the reasoning. This appendix holds the canonical values, one line each, so that every other section cites `CONTRACTS §n` instead of restating a number that can drift. When the owner changes a value, the same change updates the line here. The hub (`docs/DESIGN.md`) wins over both until they agree; TECH §1.3's corrections hold over every section on implementation matters, and ROADMAP §3.4 holds on milestone numbers.

Written 2026-11-05 from DESIGN.md, TECH §1.3, ROADMAP §3.4, SETTING §1.4 and the owners' sections as they stood that day. Where two owners still disagree, §19 names the disagreement and which value holds until it is settled. Revised 2026-11-06 for v0.0.2 as built (the slow mark, the debug skip keys, the start's 25.665 s, the facts and ids the code registers, the walker's collision, the compacted Melas plan) and for the settlements of §19's items 2, 4, 10 and 11 in DESIGN.md's decision log; and for the user's rule of 2026-11-05 that the world is handcrafted, so a chunk is decoded from committed ground data, never generated per world (§6). Revised again for v0.0.3 as built (the build sheet `docs/build/0.0.3.md`): the skip's engine (§2), the start's daylight (§3), the sight grid and the ground's windows (§6), the area-entry tick (§7), the `door` fact (§11), the sun's home (§13) and the Weapons Platoon's billets, open (§19). Revised for v0.0.4 as built (the build sheet `docs/build/0.0.4.md`, §8 and §9): the splash's and the interrupts' constants (§2), the alert drill drawn (§3, §4), the night's job (§5), the night's sleep measured with a body (§7), the body on the person and the `*Id` rule (§9, §10), TIME's and BODY's facts (§11), the new helpers (§13), the numbering (§18) and the drill settled (§19, item 13). Revised 2026-11-07 for COMBAT §5's suppression and hardening (designed, not built; DESIGN.md's log of that day): the combat block's keys and `skills.inoc` (§9), the facts `supp`, `startle` and `choice` (§11), and the helpers and constants of the pool, hardening, the startle, the flash, the NPC's choice, the bang's window and the hit card (§13). Revised 2026-11-07 for v0.0.7 as built (the build sheet `docs/build/0.0.7.md`): the gun's turrets, zero and lever, `stop.hold`, the kd session's keys, the site's blood, the body's wound fields and `kit.worn.ears` (§9); `hit`, `pit`, `wound`, `casualty` and the widened `shot`, `nd`, `range` and `fx` (§11); the round's, the wind's, the face's, the pits', the wound's and the far window's helpers, and `doAction`'s `log` and `rng` (§13).

---

## 1. How to use this file

| Rule | |
|---|---|
| Cite, never restate | a section writes "the 22:00 taps (CONTRACTS §4)", or names the block id; it never copies a table from here |
| One change | a value moves in its owner's section and here, in the same change; a section that restated it is corrected then too |
| Days by weekday | Plan of the Day days are named Monday to Sunday; "career sol n" counts from the arrival, sol 0 (§3); a bare "sol 6" is ambiguous and is not written |
| Patch numbers | ROADMAP's 0.0.n rows name an order, not a release (§18) |

## 2. Time constants and the clock

Owner: TIME §1 and §2 (values), built in `src/core/clock.js` and `calendar.js` (TECH §1.2); the calendar's definitions are SETTING §3, in `src/data/setting/calendar.js`.

| Constant | Value | Note |
|---|---|---|
| `TICK_MS` | 50 | 20 Hz, one game second a real second (hub) |
| `SEC_MS`, `MIN_MS`, `HOUR_MS`, `DAY_MS` | 1,000; 60,000; 3,600,000; 86,400,000 | Earth units everywhere, Mars included |
| `SOL_MS` | 88,775,244 | 24 h 39 m 35.244 s (hub) |
| `SLIP_MS` | 2,375,244 | the timeslip, centred on mean midnight; the clock reads 24:00 through it and the slip belongs to the ending sol (TIME §2.4) |
| The epoch, ms 0 | 2351-03-22 08:00:00 UTC | LONGHAUL's epoch, a Thursday; Melas: Sol 326 MY 211, 00:30:38, `solIndex` 169,640 |
| `START_MS` | 23,480,400,000 | 2351-12-19 02:20:00 UTC, 271.76 days after the epoch (§3) |
| `MSD_EPOCH` | 169,639.236313 | `MSD_EPOCH_MS` 15,059,764,595,616; TT − UTC frozen at 69.184 s |
| `MARS_YEAR_MS`, `LS_EPOCH_DEG`, `MY_AT_EPOCH`, `MY_SOL1_MSD`, `WEEK_OFFSET` | 59,373,085,632; 174.0; 211; `{ 211: 169315 }`; 0 | SETTING §3.8, imported, never restated |
| Melas | 287.2° E, 10.5° S, −4,500 m | PLACES §4.1 owns the site and SETTING §3.8's `SITES.melas` carries it (§19 item 11, settled 2026-11-06); `MELAS_LON_MS` 70,822,917 |
| The clock in the state | `state.clock = { ms, tick, holds, seq }` | `tick` counts lived ticks only; `seq` every loop tick; never `state.time.ms` (TECH correction 1) |
| Game-time phase | `floor(clock.ms / TICK_MS)` | the same lived or skipped |
| `LIVE_MAX_S` | 10 | actions up to it are busy steps at 1:1 (the user, 2026-11-07; was 45) |
| `FF_MAX_MS` (= `RECYCLE_S` × 1,000) | 120,000 | under it a fast-forward, at or over it an outcome skip and a crowd recycle |
| `FF_ACTOR_S_MAX` | 6,000 | live actors × planned seconds a fast-forward may cost (TIME §5.2) |
| `JUMP_MS`, `JUMP_M` | 120,000; 1.5 m | an area unseen this long is placed, not walked; no placement interpolated past 1.5 m |
| `READ_CHUNK_MS`, `EARLY_MS`, `AUTOSAVE_LIVE_MS` | 600,000; 300,000; 300,000 | reading chunks; "five minutes early"; live autosave |
| Skip kinds and their step grid | `ff`: lived ticks; `outcome`, `out`: whole game minutes; `day`: whole hours, each cut at a slow contributor's next change, minutes while any contributor is not steady; `world`: event to event, no clock shown; every step ends on the 50 ms tick grid | the target gates whole steps, never cuts one (TECH §5.3, correction 19) |
| A skip's engine | `skip.engine`: `ff` (lived ticks) or `outcome` (the grid above), set when the skip begins; `ff` for kind `ff`, and for `out` while a fight is live in the area (whatever its length) or under 120 s where the area allows a fast-forward (TIME §5.2), else `outcome`; an `out` skip whose fight closes goes on as `outcome` | the loop picks its mode by the engine, never the kind (TECH §3.6; TIME §4.5: a fight is never turned into an outcome around the player; §19 item 10, settled 2026-11-06). Built in v0.0.3: `beginSkip` sets it (`ff` for kind `ff`, or kind `out` while `fightLive`, a hook false until COMBAT's fights), and `engineOf()` reads an older record's engine from its kind |
| The slow mark | `time.slowToMs`: how far the slow layer has stepped; every slow step spans [mark, t] and moves it, lived or skipped, so each moment of game time is stepped once | TECH §3.4, built in v0.0.2 |
| Event times | whole seconds | `post()` floors `atMs` to the second; a clock time lands on its first whole second at or after it, so the watch reads it (02:30 at Melas on Tuesday Sol 591 is 02:30:00.091) |
| The splash (TIME §6, built in v0.0.4, `src/sim/time/splash.js`) | the time-lapse `S(m) = clamp(1.4 + 0.95 ln(1 + m/4), 1.6, 8.0)` s; full from `FULL_FROM_MS` 180,000; `SPLASH_IN_S` 0.4, `SPLASH_HOLD_S` 0.8, `SPLASH_OUT_S` 0.5 (0.25 at prio 0); brief: `BRIEF_HOLD_S` 0.4 and no zoom; `DECEL_S` 0.35, `BEAT_S` 0.6, `WHIRR_S` 0.25, `CHUNK_OFFER_S` 1.2, `TICKER_GAP_S` 0.8, `SHORT_LAPSE_S` 1.0 (the debug skips); `SPLASH_IRIS_M` 3.5, `SPLASH_ZOOM` 3, `BRIEF_RING_M` 6; the ease's first 15% and last 20% at 40% of the middle's rate | a 10-minute shower 4.29 s in all, a night 22:00 to 05:30 7.67 s; a fast-forward's lapse runs at the engine's pace; no game time passes from the landing to the end of the zoom out (the `'splash'` pause) |
| Interrupts (TIME §7, built in v0.0.4, `src/sim/time/interrupts.js`) | `PRIO` D 0, A 1, O 2, B 3, S 4 (5 ambient); `S_PER_SKIP` 1, `S_PER_SOL` 3 | sources this round: A the alert drill; O reveille, the drill's count and stand-down; B the body's crossings |
| Activities (TIME §8, built in v0.0.4, `src/data/activities.js`) | `LIVE_MAX_MS` 10,000 (the user, 2026-11-07; was 45,000); `DONE_FROM_MS` 60,000; `SPOT_REACH_M` 0.6; `FIXTURE_FREE_M` 0.5; `RESUME_MS` 600,000 (or 2 m away); `DRESS_MIN` PT kit 2, utilities 4, a towel 0, `UNDRESS_K` 0.6, `DRESS_HURRY_K` 0.5 in an open drill; `WATER_MIN` Melas 3; `SLEEP_MIN_MS` 1,200,000, `SLEEP_MAX_MS` 43,200,000; `NAP_MIN` 20, 45, 90; `WAIT_MS` 900,000 | TIME §8.1 to §8.4 hold the table |

## 3. The start and the first standby

Owner: SETTING §3.7 (the start), CAREER §5.4 and §5.9 (the standby's calendar and length).

| Item | Value |
|---|---|
| The start | Monday, Sol 590 of MY 211 (civil 5 Patience 211), 12:40 Melas time, 2351-12-19 02:20 UTC, `solIndex` 169,904, Ls 316.4° |
| At `START_MS` exactly | 12:39:34.335 Melas; 12:40 falls 25.7 s later (25.665 s, TIME §2.4) |
| Daylight at Melas on the start | 12.78 h, sunrise 05:36, sunset 18:23, noon sun 83.42° up, on a flat horizon (TIME §2.5, at 10.5° S); the canyon's walls shorten it to 12.53 h, 05:44 to 18:15 (PLACES §3.15's `horizonAt`; as built in v0.0.3, `sunTimes`, printed by `places-light`; SETTING §3.7 prints the seasons) |
| Career sols | sol 0 is the arrival Monday; career sol n is weekday (n mod 7), Monday first |
| `STANDBY_SOLS` | 10 + slip; slip 0 for a new world's first recruit (CAREER §5.9) |
| First recruit's dates | warning order Wednesday Sol 599 at the 07:50 formation (the paper stamped 08:00); pack-out Sol 600; Echo lifts Sol 601; the battalion sails from Phobos Sol 602, 2351-12-31 10:15 UTC |
| A next recruit | arrives 56 UTC days after the last career ended, at 12:40 on the next working sol (CAREER §21) |

The standby's lessons by weekday (CAREER §5.4 owns them; blocks are §4's):

| Career sol | Weekday | What the calendar books |
|---|---|---|
| 0 | Monday | arrival at 12:40, the three stops; the week's alert drill on this night or the next, at a minute drawn from 00:30 to 04:30 (§4; the 02:30 pin withdrawn in v0.0.4) |
| 1 | Tuesday | the rest of the check-in, the initial counselling; the weapons class |
| 2 | Wednesday | the range (zero at 25 m, confirm at 300 m, a string); the suit loft |
| 3 | Thursday | suit drill and the Tank; the combat lifesaver class and lane; field day; the defence committee's vote |
| 4 | Friday | pay day (the LES at 00:00Z); the platoon sergeant's inspection 08:00–10:00; the ROE class and the Europa brief; the G-house and the Long Arm |
| 5, 6 | Saturday, Sunday | holiday routine, one rest-sol set piece each |
| 7, 8 | Monday, Tuesday | MCMAP; the mission rehearsal exercise; billets named; the floor vote on sol 8 |
| 9 | Wednesday | the warning order |

No rifle qualification and no PFT or CFT is shot in the standby (CAREER §5.4).

## 4. The Plan of the Day

Owner: TIME §9.2, the one table. PEOPLE fills its content by block id, CAREER books lessons into its blocks by id, SETTING names things; nobody else gives its times.

A training sol (Monday to Friday), Melas time:

| Time | Block id | Note |
|---|---|---|
| 05:30 | `reveille` | the wake event (O) for the bay |
| 05:40 | `muster` | accountability, by squad |
| 05:45–06:45 | `pt` | run, circuit or the Ring by rotation |
| 06:45–07:45 | `hygiene-chow` | chow window 06:50–07:40 |
| 07:50 | `morning-formation` | the squad leader's inspection of shave, haircut and uniform; colours at 08:00 |
| 08:00–11:30 | `train-a` | |
| 11:30–12:30 | `noon-chow` | the line closes 12:20 |
| 12:40 | `noon-formation` | |
| 12:45–16:30 | `train-b` | |
| 16:30–17:15 | `maintenance` | weapons and gear, the armoury line |
| 17:15–18:30 | `evening-chow` | |
| 18:30 | `mail-call` | names called in the bay by the platoon's mail clerk |
| 18:30–21:45 | `free` | |
| 20:00 | | tomorrow's PoD posted; the sol director runs |
| 21:45 | | lights-out warning |
| 22:00 | `taps` | in the rack |
| 22:00–05:30 | `night` | fire watches 22:00–24:00 plus the slip (2 h 39 m 35 s), 00:00–02:00, 02:00–04:00, 04:00–05:30 |

| The week | What changes |
|---|---|
| Monday to Wednesday | nothing |
| Thursday | `maintenance` becomes field day, 16:30–18:30; `evening-chow` runs to 19:00 |
| Friday | the platoon sergeant's inspection, bay and personal, 08:00–10:00; `train-a` 10:00–11:30; liberty from 17:15 |
| Saturday, Sunday | holiday routine: reveille 07:00, brunch 08:00–11:00, dinner 17:00–18:30, taps 22:00; juniors on liberty back by 00:00 |
| On standby | liberty within the recall radius (Redwater); one unannounced recall or alert drill a week. As built in v0.0.4 (`src/data/pod.js` `ALERT_DRILL`): the alert drill, an A interrupt, on a night and at a minute drawn from the world's seed (`stream(seed, 'time:alert-drill', week)`: the night `int(r, 7)`, the minute `int(r, 241)` after 00:30), so between 00:30 and 04:30 with the slip inside the night, and in the career's first week on one of its first two nights; the klaxon 45 s; the muster at your rack's foot in utilities, the count at +5 min and the stand-down at +30 (O events), lateness from the count by TIME §9.5's classes. Until Redwater is built (0.2), the player's liberty is on base (CAREER §5.4, ROADMAP §5) and the people's Redwater liberty is an off-site override (PEOPLE §4.6) |
| Aboard ship | UTC; the same shape, reveille 06:00Z, taps 22:00Z, no slip; the `maintenance` block is field day every day aboard (PEOPLE §4.7, my call) |

The night is 7 h 30 m on the clock and 8 h 09 m 35 s in the rack.

## 5. Job slots and staggering

Owner: TIME §11.3 (the only slot table); the `every` grammar and the queue are TECH §4.3.

| Slot | Job | Owner |
|---|---|---|
| `hour@:05Z` | persistent people's hourly social step | PEOPLE |
| `hour@:17Z` | hot-zone incidents far away (`zoneIncidents`) | COMBAT, world |
| `hour@:29Z` | the environment's memory: dust settling, a storm front | PLACES |
| `hour@:35Z` | healing, the only healing slot: `heal(person, 1/24 day)` | BODY |
| `hour@:41Z` | the encounter director | COMBAT, PEOPLE |
| `hour@:53Z` | traffic and comms digests | world |
| `day@00:00Z` | pay due-check, mail dispatch | CAREER |
| `day@04:00Z` | tier-3 people at other sites | PEOPLE |
| `day@05:00Z` | politics | world |
| `day@05:20Z` | conflict zones born, escalated, ended | world |
| `day@07:00Z` | forces census and yards | world |
| `local@00:00` | the per-day passes: everyone's schedules for the day, PEOPLE's per-sol pass (gossip, careers, arcs, the roster), BODY's daily work (bone, plasma, G stimulus, conditioning, vestibular, mass, ARS phases); TIME's `autosaveDay`, which asks the sol's autosave (`why: 'day'`, built in v0.0.2) | PEOPLE, BODY, TIME |
| `local@20:00` | tomorrow's PoD published; the sol director (built in v0.0.4 as TIME's `solDirector`, which posts the night: taps, reveille and, on its drawn night, the alert drill, `src/sim/time/pod.js` `postNight`; a new game's `start` and a v0.0.3 save's upgrade post tonight's too) | PEOPLE, TIME |
| `week@Sunday/20:00` | the week's duty roster and liberty list | PEOPLE |
| `week@Monday/00:00` | the arc director | PEOPLE |
| `every@<ms>` | absolute periods from the career's start (fitness weeks, rust's periods) | BODY, SKILLS |

| Rule | |
|---|---|
| The local day | the sol from civil 00:00 at the site's meridian on Mars; the UTC day elsewhere; nothing is scheduled inside the slip |
| One job for many | a per-day pass is one event walking the site's people in id order, never one event per person |
| 04:00 body time | the body clock's marker only, read in closed form, never posted |
| Per-second work | bucket `phase mod 20 = hash(id) mod 20` (TECH §3.2) |
| Other periods | `hash(id) mod (periodMs / TICK_MS)` |
| Closed-form minute work | may be spread over the minute's 1,200 ticks by id hash if the minute's end is identical (TECH §3.4) |

## 6. The tick, work units and the path budget

Owner: TECH §3.1 and §3.2 (the layers and the units), PLACES §2 (navigation's own constants).

| Step | Layer | Mean budget, busiest area |
|---|---|---|
| 0 | `due` | 0.02 ms |
| 1 | `input` (runs while held) | 0.03 ms |
| 2 | `player` | 0.03 ms |
| 3 | `actors` | 0.25 ms |
| 4 | `bodyFast` | 0.10 ms |
| 5 | `rehash` | 0.03 ms |
| 6 | `look` | 0.15 ms |
| 7 | `think` | 0.10 ms |
| 8 | `rules` (timed actions, shots, suppression, inertia, fast environment, noise) | 0.40 ms |
| 9 | `paths` | 0.60 ms |
| 10 | `second` | 0.10 ms, amortised |
| 11 | `offers` (runs while held) | 0.02 ms |
| | the sum | 1.83 ms (budget 2.0) |

| Constant | Value | Owner |
|---|---|---|
| `PATH_SOLVES_TICK` | 6 solves a tick | TECH §3.1 |
| `PATH_NODES_TICK` | 8,000 node expansions a tick, shared by estimates; the player first, then persistent people, then the crowd | TECH §3.1 |
| `NODE_CAP` | 16,000 expansions a solve; a leg over it fails `cap` and is split | PLACES §2.2 |
| `pathEstimate` cap | 400 expansions by default | PLACES §2.2 |
| `CELL_M` | 0.25 m; clearance classes C0 0.27 m, C1 0.33 m, C2 0.40 m | PLACES §2.1 |
| A* steps | whole weights, 10 straight and 14 diagonal, times the cell's cost; the octile heuristic in the same weights (`10 × max + 4 × min`) | PLACES §2.2 |
| A walker's collision | its class's circle against the walls, blocking fixtures and closed leaves its grid was built from; the door assist slides it up to `NUDGE_M` 0.3 m sideways; a walker inside a blocker is settled on the nearest free cell within 2 m | PLACES §2.1, TECH §3.1 layer 2 |
| `CHUNK_M`, `REACH_M`, `DROP_M` | 32 m; 56 m; 96 m | PLACES §2.4 |
| A ground's nav window | `WINDOW_CHUNKS` 3 × 3 chunks (96 m), the walker at least `NAV_EDGE_M` 16 m from its edge; at most `NAV_CHUNKS_TICK` 1 chunk built ahead a tick; a path request solves on a window placed by its own start | PLACES §2.4 (built in v0.0.3) |
| The sight grid | `SIGHT_CELL_M` 0.25 m, the nav's lattice; bits `PRONE` 1, `CROUCH` 2, `STAND` 4 at eye heights 0.3, 1.0 and 1.6 m; a floor's grid the whole area, a ground's a window `SIGHT_WINDOW_M` 192 m wide holding the eye `SIGHT_EDGE_M` 56 m from its edge, past `SIGHT_REACH_M` 54 m (10 + 42 + 2), only the window's chunks kept | PEOPLE §7.6, built by PLACES (`src/sim/places/sight.js`, v0.0.3) |
| Chunk decoding | a chunk is decoded from its ground's committed data (PLACES §9.5: grounds are authored, never generated per world), lazily and purely, counted in cells decoded; no millisecond budget in the sim (TECH correction 7) | TECH §8.1 |
| `BRASS_LIVE` | 64 moving cases | TECH §3.1 |
| Budgets inside the sim | work units only (expansions, solves, cells, people placed), never real time | TECH §3.2 |
| Next tick | intents written in steps 6 to 8 act in steps 2, 3 and 9 of the next tick | TECH §3.1 |

Sim per tick by domain (TECH §16.2): PEOPLE 0.50 ms (steps 3, 6, 7), paths 0.60, rules 0.40, BODY 0.20, the rest 0.13.

## 7. Frame, sim, skip and save budgets

Owner: TECH §16 (measured on the Mac, Chrome on ANGLE Metal, at 16 px/m (the user's pick, VIEWS §2.3) in a 1600 × 1000 window) and TECH §5.9 (skips, after TIME §5.10).

| Measure | Budget |
|---|---|
| frame time | median ≤ 16.7 ms; p95 ≤ 18 ms; p99 walking ≤ 25 ms; no frame over 50 ms after an area's first 3 s |
| under a 4× CPU throttle | walking scenes hold a 60 fps median; `mess-noon` and crowd scenes median ≤ 25 ms, p95 ≤ 33 ms |
| under a 6× CPU throttle | walking scenes hold a 60 fps median; no frame over 50 ms (tradecraft's measure) |
| sim per lived tick | ≤ 2.0 ms mean; ≤ 4 ms at a minute boundary; ≤ 8 ms mean under the 4× throttle; the area-entry tick is behind the cut and left out (a floor's first grid about 6 ms, the ground's first window 14 to 27 ms in v0.0.3; `places-walkers`) |
| view CPU, UI DOM | ≤ 4 ms; ≤ 1 ms a frame |
| GPU, integrated class at 1080p | ≤ 7.5 ms an ordinary frame (9 with the far window); the Mac holds a third (2.5; 3) |
| draw calls; programs | ≤ 160 (600 fails); ≤ 16, none linked after the first area's first frame |
| uploads mid-play | ≤ 1 MB and ≤ 2 ms a frame; whole textures only behind a cut |
| boot; title to play | ≤ 1.5 s; ≤ 3 s cold, ≤ 1.5 s cached |
| area change | ≤ 250 ms behind the cut; first frame ≤ 33 ms |
| JS heap; GPU memory | ≤ 300 MB, ≤ 20 MB growth in a 10-minute soak; ≤ 384 MB (people 48 MiB at B: three 4096² R8 layers of role indices and a 256 KiB colour-row table, VIEWS §3.7; v0.0.2's one RGBA8 4096² atlas is 64 MiB until the bands land) |
| loop | at most 5 ticks a frame (`FRAME_CAP_MS` 250); `ff` up to `FF_TICKS_FRAME` 40 and `FF_FRAME_MS` 8; outcome skips `SKIP_FRAME_MS` 4 (8 for the prologue) |
| a quiet outcome step | ≤ 0.05 ms |
| an 8-hour sleep, quiet barracks | ≤ 25 ms: 480 minute steps and about 40 events; measured in v0.0.4 with the player's body, 21:36 to reveille (8 h 34 min), 16 to 19 ms warm in the foreground (k 1.00), 35 to 45 ms the first, cold one; the time side alone (the queue, the slow mark, the squad's placing) 13.7 ms at k 4.04, about 3.4 ms at k 1 (TIME §5.10) |
| an 8-hour sleep, a process not steady | ≤ 30 ms |
| a chapter day | ≤ 30 ms |
| the default voyage (6.9 days) carried on | ≤ 0.3 s over the day splashes (TIME §5.10) |
| a 12-day voyage carried on | ≤ 0.5 s over the day splashes |
| an `out` fast-forward in a fight | ≤ 12 ms of sim a frame (`FF_OUT_FRAME_MS`, TIME §4.5 and §5.10) |
| the prologue | ≤ 3 s of compute (from 0.2) |
| save | encode ≤ 10 ms, load ≤ 30 ms |
| save size | ≤ 1.5 MB after the standby week (4 MB fails); 2 MB at 0.2's edge; 3 MB after a tour; 4 MB after a first term (ROADMAP §15.2) |
| queue and log | at most 4,000 live events; `LOG_MAX` 1,500 records; `happenings` at most 1,200 |

## 8. People per scene

Owner: TECH §16.7 (correction 20). Everyone live in view is drawn, live or as a ghost where last seen: nobody pops.

| Bench scene | Persistent (L0, L1) | Puppets | Crowd | Live agents | Drawn, at most | From |
|---|---|---|---|---|---|---|
| `squadbay-night` | 14 | 0 | 0 | 14 | 14 | 0.1 |
| `range-far` | 48 | 0 | 0 | 48 | 48 | 0.1 |
| `parade-platoon` | 42 | 0 | 20 | 62 | 62 | 0.1 |
| `company-march` (PEOPLE §13.5's test) | 48 crossing; none in ranks | up to 120 crossing | 0 | 168 crossing; in ranks, Echo's 191 as one block | 191 | 0.1 |
| `mess-noon`, the busiest | 48 | 12 | 100 | 160 | 180 | 0.1 |
| `troopship-battle` | 48 | 0 | 40 | 88 | 100 | 0.2 |
| `europa-street` | 19 | 0 | 120 | 139 | 160 | 0.3 |
| `cavern-riot`, a crowd scene | 24 | 0 | 200 | 224 | 256 | 0.3 |
| `village-contact` (COMBAT §19's fight among civilians) | 31: 26 fighters, 4 umpires, the player | 0 | 60 role-players | 91 | about 100 | 0.1.x (the patrol's join) |

| Cap | Value |
|---|---|
| persistent at L0 and L1 | 48; 24 in a crowd scene |
| crowd, puppets included | 120; 200 in a crowd scene |
| live agents | 168; 224 in a crowd scene |
| `MAX_PEOPLE` | 256 drawn (VIEWS's 160 and 240 are replaced) |
| `GHOSTS_MAX` | 32 |
| formations | move as blocks and do not count against the 48 (PEOPLE §13.5) |
| the near ring on grounds and habs | actors from `REACH_M` 56 m, let go at `DROP_M` 96 m (PEOPLE §13.5) |

## 9. State: top-level keys and owners

Owner: TECH §6.1. The top level is reserved; a new key needs a change there. Inside a key the owner sets the shape; others reach in only through the owner's functions.

| Key | Owner | Holds |
|---|---|---|
| `meta` | TECH | game, schema, version, seed, worldId, mode, scenario, createdMs, `next` (one counter per id prefix), errors (≤ 20), the honesty marks `debugUsed`, `imported`, `recovered` |
| `clock` | TIME (built by TECH) | `{ ms, tick, holds, seq }` |
| `rng` | TECH | named streams |
| `events` | TIME (implemented by TECH) | the queue's heap array, saved as it is, and nothing else |
| `skip` | TIME | the running skip, or null; v0.0.4 adds `spotId` (the activity's spot) and `held` (the O events an `O*` mask held) |
| `time` | TIME | `{ chapter, voyage, pod, alarms, interrupts, liveSinceSaveMs, slowToMs }` and TIME's own additions (`director`, `stances`, `drills`, TIME §13). Built in v0.0.4: `pod` (the night posted), `drills { open, last, forced }`, `doing` (the activity under way), `resume` (a cut one R may finish), `chunk` (a chunked skip's landing, for "carry on"), `attend` (the last 50 arrivals at musters), `prefs` (`mute`), `interrupts { perSol, perSkip, sol }`; v0.0.6 adds `chain` `{ spotId, fromMs, toMs, i, stopAt, late?, steps: [{ id, args, toMs, done? }] }`, the running chain, and `doing.chain` its running step's index (TIME §8.1) |
| `player` | PEOPLE | `{ id, actor, waypoint, presets, keeps }`; the person is `people[player.id]` |
| `people` | PEOPLE | id-keyed persons only, each with `body` (BODY), `skills` (SKILLS), `kit` (WEAPONS); the body lives here and its domain claims no top-level key (built in v0.0.4; BODY §2.5). v0.0.5 adds `skills` written for the scene's player only (everyone else reads a lazy sheet by their rank's tier, SKILLS §11.1), and v0.0.8 `skills.drills = { room: { rung }, passage: { rung } }` on a test sheet only (`testSheet`, SKILLS §11.1), `kit = { tmpl, worn: { carrier, head, sling }, hands, carry: { posture, finger, near } }` (TECH §6.7), and for staff `tier: 3` and `post = { key, area, x, z, y, face, posture, outfit }` (by `key`, never an id; PEOPLE §3.13); v0.0.6 adds `look.hair.thin` (a thinning man, drawn by hash, his only cut `shaved`; CAREER §4.2) and `look.hair.style` one of the seven cuts' ids, and `kit.hands` may hold a magazine reached for (WEAPONS §3.3); `skills.drills` (COMBAT §25.3: drill rungs, clean runs, bundles lived), the player's only; from 0.0.7c (designed 2026-11-07) `skills.inoc = { pts, n, sol }`, the inoculation counter (SKILLS §6.8, §15.1), the player's and persistent people's; hardening itself is derived, never stored (COMBAT §5.6) |
| `units` | PEOPLE | the unit tree and its billets |
| `happenings` | PEOPLE | the ring of notable things, ids `n<n>` (PEOPLE §2.5's "event log", renamed) |
| `actors` | PEOPLE | `{ list, area }`, the live area's bodies in a stable order and the area they were made for (built in v0.0.3; TECH §6.1); v0.0.5 adds an actor's `stance` (`'kneel'` or `'prone'`, absent standing) and `headRad` (the heading in the weapon mode only); v0.0.6 adds `hair` (0 to 3), a squadmate's drawn hair step, written only out of the player's sight (PEOPLE §5.5); from 0.0.7c (designed 2026-11-07) a live actor's combat block (COMBAT §2.1, §5.9) holds `supp`, `suppAtMs`, `suppRate`, `startleUntilMs`, `blindUntilMs`, `dazzleUntilMs`, `lastBangMs`, `bangN`, `choice`, `choiceAtMs` and `resolve` (renamed from `nerve`), absolute ms only |
| `mind`, `talk`, `names` | PEOPLE | the player's knowledge (`seen`, `felt`, `heard`, `known`, `map`, and `threat` for COMBAT §6.1, and `contact` for COMBAT §25.4.8 (the pending take-in and the last contact, through `noteContact` and `contactOf`; built in v0.0.8 as `{ n, known, pending, last }`, `noteContact` merging its patch shallowly, absent in a game with no contact: PEOPLE §8.8)), written and read only through `people/mind.js` (`noteThreat(state, why, atMs, whoId)`, `threatOf(state)`, the generic `noteMind`/`mindOf`; PEOPLE §8.8); an open conversation; the registry of full names |
| `fights` | COMBAT | one record per fight in the live area |
| `stop` | WEAPONS (with COMBAT for CQC) | the stop-motion context, or null; built in v0.0.5: `{ mode, who, gun, phase, pick, aim, doing, queue, reflex, keep }`, its reflex card saved (TECH §6.1); a running bundle is one `doing` step of kind `bundle` (COMBAT §25.12); v0.0.7 adds `hold = { xMil (+ right), yMil (+ high) }`, where the point of aim moves (WEAPONS §7.4), and `read`, the player's wind read when no session holds it; v0.0.8 adds `via: 'contact'` (only when a contact's pause entered the mode) and a shot row's `doing.plan` (`{ ms, offSafe, parts }`) and `doing.held0`, and keeps `taps: 0` on a fire step |
| `items` | WEAPONS | every item with a record, wherever it is; v0.0.6 adds a gun's `load` (the chambered round's kind, saved only when not ball) and `belief.load`, a magazine's `belief.kind` and `belief.feel` (WEAPONS §4); v0.0.7 adds a gun's `sight = { elev, wind }` (the turrets, clicks of 0.1 mrad, + up and + right), `zero` (the rifle's true zero, `drawZero`'s, never shown) and `optic` (the lever, 4; absent at 1), and `belief.zero` (the zero the holder believes), each absent at 0 (WEAPONS §2.5, §3.5) |
| `armoury` | WEAPONS | accountability by gun id, ammunition issues; built in v0.0.5: `guns`, `ammoIssues` (`ai<n>`) and `range`, the range session, whose `fp` is a fixture's name, not a `spotId` (TECH §6.1); v0.0.6 adds the session's `load`, `strMag`, `dry`, `sat`, `issueIds`, `mixed`, `oneMagSaid` and `over` (WEAPONS §6.4, §11.3); v0.0.7's kd course adds `kdLane`, `stage`, `line`, `paper`, `groups`, `call`, `reads`, `strings`, `pits`, `relay` (each gunner with its `zeroHoles`), `relay2`, `staff`, `dummy`, `brassTiles`, `policed`, `picked`, `declared`, `casualty`, `limitAtMs`, `strSeats`, `zeroed`, `closed` and `turnedIn` (TECH §6.1), and an issue's `line` and `dummy`; v0.0.8's pairs course adds `sheet`, `line`, `mags`, `wantMag`, `turners` (each `{ key, lane, x, z, y, face, holds, turnAtMs, awayAtMs, hits, stoppedAtMs }`), `str`, `strs`, `reloads`, `lull`, `coachWalk`, `shortIn`, `cueAtMs` and `at10`, and a string's shot records carry `row`, `rowN` and `rowI` (COMBAT §25.10.3; TECH §6.1) |
| `places` | PLACES | `{ live: { site, area }, sites: { … } }` (the built `sites` domain is renamed); v0.0.7 adds `sites[site].blood = [{ area, x, z, dx, n, seed, atMs }]` (BODY's `blood.js`) |
| `world` | TECH (porting LONGHAUL) | empty at 0.1; politics, zones, forces, hulls, stations, intel, news from 0.2; civil traffic regenerated, never saved |
| `career`, `careers`, `memorial` | CAREER | the current career; past careers in this world; the dead, never capped |
| `log` | TECH (SKILLS for roll text) | at most 1,500 records; rolls stored without text |
| `flags` | TECH | one-shot facts and migrations done |

**Added in v0.0.9** (COMBAT §5.9, §25.18.3; all additive, no `SAVE_SCHEMA` bump: a v0.0.8 save loads as it stands and no block reads calm; the build sheet 0.0.9 §3):
- **`actors.list[i].combat`** (the actor's chaos, COMBAT §5.9; `supp.js blockOf`): `{ supp, suppAtMs, suppRate, startleFromMs, startleUntilMs, startleMs, startleWhy, frozeAtMs, lastBangMs, bangN, blindUntilMs, dazzleUntilMs, deafUntilMs }`, absolute ms, integers or 0.01-rounded, absent when calm; the NPC's `choice`, `choiceAtMs` and `resolve` wait for `test-breach`.
- **`people[id].skills.inoc`**: `{ pts, n, sol, fixed }`, the inoculation counter (SKILLS §6.8): `pts` 0 to 25, `n` the runs counted on `sol`, `fixed` true on a test sheet's row (`noteExposure` never moves it); an absent counter reads `INOC_OF_TIER` by rank.
- **`armoury.range.setup`**: the session's setup string (`'bangs'`, `'bangs:standby'`, `'standby:k'`, …), saved so "Again" and "Again as …" keep it (`sceneOf` maps `'bangs'` to the scene id `test-pairs-bangs`).
- **`armoury.range.bangs`**: `{ attempt, plan[{ key, i, x, z, fromX, fromZ, throwAtMs, atMs, done }], steps, froze, feltPeak, poolPeak, offSafe, lastStepMs, calm }`, the banged string's plan and what it measured (the saved plan field is `key`); **`strs[k].bangs`** (the string's record, `k` 0 for the bangs): `{ n, feltPeak, band, frozeMs, offSafe, turnToFirstMs, seenToFirstMs }`.

| Rule | |
|---|---|
| `$` keys | runtime only, at any depth, stripped from saves; a domain's derived data sits under one root (`$places`, `$people`, `$events`, `$items`, `$world`, `$body`); the instinct's line is `$instinct` (SKILLS §15.4) |
| Defaults | null, false, zero and empty fields are left out on disk (TECH §6.6, rule 1) |
| A body | deltas from a template: `{ v, tmpl, …what differs }` (TECH §6.6, rule 2); `v` 2 from v0.0.4, the ledgers' record (BODY §2.5); from v0.0.5 `eyes`, the eyes' adaptation, absent while at rest in the light they stand in and written once the player's eyes are anchored (BODY §2.5); only the player's is simulated this round, the squad's carry `{ v, tmpl, heightM, build }`; from v0.0.6 `hands { dirt, why }` and `hair { h }`, template-filled (`dirt` 5, `h` 24), nothing written on load (BODY §2.5); from v0.0.7 the wounds (BODY §2.5): `parts` a group, `blood`, `bloodMs` and `bleedK` scalars in the template, and `injuries`, `knock`, `dead` and `fitness` only when present, nothing written on load |
| A person's kit | `kit = { tmpl, worn: { <slot>: itemId }, hands: [right, left] }`; the suit is `kit.worn.suit` (TECH §6.7); from v0.0.5 `kit.worn.sling` holds the slung rifle whatever its posture, and `kit.carry` the posture, the finger and the habit's approaches; from v0.0.7 `kit.worn.ears`, the ear defenders, worn the whole of `test-range` (issued with `range-kd`) |

## 10. Ids

Owner: TECH §2.3.1, checked by `src/core/ids.js`.

Counted ids are `<prefix><n>`, the counter `meta.next[prefix]`, never reused in a world:

| Prefix | Kind | Owner |
|---|---|---|
| `p` | a person of tiers 1 to 3, the player included | PEOPLE |
| `a` | an actor on the live area | PEOPLE |
| `i` | an item: gun, magazine, suit, cartridge, pouch, IFAK part, letter, tool | WEAPONS |
| `e` | an event in the queue | TIME |
| `k` | a skip | TIME |
| `n` | a happening | PEOPLE |
| `h` | a saved hull | TECH, COMBAT |
| `fm` | a family member | CAREER |
| `fg` | a fight | COMBAT |
| `od` | an order given | COMBAT |
| `uf` | a use-of-force record | COMBAT |
| `sh` | a shot | WEAPONS |
| `ob` | ordnance in flight | COMBAT |
| `sv` | a salvo | COMBAT |
| `ai` | an ammunition issue | WEAPONS |
| `pr` | a path request | PLACES |

| Kind | Form | Examples |
|---|---|---|
| world | `w-<seed>`; a second world on the same seed `w-<seed>-<n>` | `w-48213` |
| career | `c-<world seed>-<n>` | `c-48213-1` |
| unit | `<battalion>/<regiment>`, then `-<company>`, `-<platoon>`, `-<squad>`, `-ft<n>`, `-hq`; units outside the Corps' order of battle (a CFB cell) are kebab keys in COMBAT's tables | `2/4`, `2/4-E`, `2/4-E-2-1`, `2/4-E-2-1-ft2`; `cell-pwyll-3` |
| site, area, room, zone | kebab segments joined by `.` | `melas`, `melas.echo.1`, `e1.bay-2-1`, `e1.z.bay-2-1` |
| fixture, opening | `f:` or `o:` and the template path in `:`-joined kebab segments | `f:e1:rack:07`, `o:e1:bay-2-1` |
| site plan: waypoint, building, road or path | `w:`, `b:` or `r:` and kebab segments (`w:` with a colon, never a world's `w-`) | `w:echo:front`, `b:echo`, `r:valley` |
| link | `l:` and the template path | `l:hellas:trunk` |
| spot or seat | `<fixture id>#<n>` | `f:mess:t14#3`, `f:armoury:rack-e2#14` |
| data record | its key in its table | `r7`, `6.5x40r`, `shower`, `react-to-contact` |

| Rule | |
|---|---|
| The player | an ordinary `p<n>`; `state.player.id` names it; `playerId(state)` is the one helper; never `me`, `p0` or `p:player` |
| A promoted crowd member | a `p` id, its seed kept in `look.seed` (never `x<seed>`) |
| A gun | an item `i<n>` with `model: 'r7'`; its serial is a hash of its id (never `r7#p.3`) |
| A portal | named by its opening or link id (`o:echo:front`, `l:echo:stairs-up`), never a `p:` form; a path request is counted (`pr5531`, never `pr:5531`) |
| A household | a number inside the career, not an id (`h` is the hulls') |
| Fields holding an id | `id`, `<role>Id`, `<role>Ids`, or `who` (`leaderId`, `subjectId`, `assignedIds`, `parentId`); a spot is `spotId`, a fixture `fixtureId` |
| No data key in a `*Id` field | the ids walk reads every `*Id` field as a reference, so a data record's key or a number goes in a field named for what it is: a block `block`, an activity `activity`, a drill's sol `drill` (v0.0.4); a course `course`, a lane `lane`, a set stoppage `set`, a firing point's fixture name `fp`, a post's `key` (v0.0.5); and no record that is not a definition carries an `id` field (stop motion's sub-steps say `action`) |
| Order | `cmpId`: kind, then number, then the rest (`p9` before `p10`); decisions iterate `ids(map)` |

## 11. Bus facts

Owner: TECH §2.7; every name is registered in `src/core/facts.js` with its owner, by the change that first emits it. Names are kebab-case (never `skip:start`).

| Fact | Payload | Owner |
|---|---|---|
| `hold` | `{ held, holds }` | TECH |
| `skip-start` | `{ id, activity, kind, engine, fromMs, toMs, where, posture, mask, spotId, vignette, stoppable, chunkMs }` (`engine` §2's, v0.0.3; the last four v0.0.4's); v0.0.6 adds `chain: null \| { steps: [id], n }` | TIME |
| `skip-frame` | `{ id, atMs, ticker, frame }` | TIME |
| `skip-interrupt` | `{ id, atMs, by, prio, letter, kind, line, reflex }` (`letter` and `kind` v0.0.4's) | TIME |
| `skip-end` | `{ id, activity, fromMs, toMs, planned, interrupted, by, outcome, papers, minutes }` (`minutes`: the whole game minutes it passed); `outcome` from v0.0.4 `{ body: { before, after }, look: { outfit, wet }, chunk: { offerMs } \| null, lines, failedRoll, activity, held }`, `chunk.offerMs` the offer's 1.2 s, the chunk's length being `skip-start`'s `chunkMs`; v0.0.6 adds `outcome.chain: null \| [{ id, line, fraction, by }]`, a chain's steps in order, a dropped one with `line` null and `by` 'dropped' | TIME |
| `activity` | `{ phase: 'start' \| 'end', activity, who, spotId, fromMs, toMs, mode: 'live' \| 'ff' \| 'outcome', fraction, by, outcome }` (v0.0.4); v0.0.6 adds `chain: null \| { i, n }`, the step of a chain it is | TIME |
| `chain` | `{ phase: 'start' \| 'step' \| 'stop' \| 'end', spotId, steps: [id], i, n, fromMs, toMs, by: null \| 'natural' \| 'player' \| 'interrupt' \| 'refused', dropped: [id], lines: [string] }`: several single actions at one fixture behind one splash (v0.0.6; TIME §8.1) | TIME |
| `alert` | `{ drill, kind: 'drill', phase: 'sound' \| 'count' \| 'stand-down', atMs, dueMs, endMs, horn: { area, x, z } }`, the count adding who was present of the squad (v0.0.4) | TIME |
| `reveille` | `{ atMs, area, holiday }` (v0.0.4) | TIME |
| `late` | `{ who, block, dueMs, arrivedMs, lateMs, class }`, `class` TIME §9.5's (`on-time`, `late-minor`, `late`, `very-late`, `missed`) or `left` with `leftMs`, an arrival gone from the rack at the count or the stand-down (v0.0.4) | TIME |
| `skip` | the legacy `loop.skip` report, `{ what, fromMs, toMs, requestedMs, elapsedMs, minutes, stopped, reason }`, kept for `skipNow`'s tests | TECH |
| `autosave` | `{ why: 'skip' \| 'day' \| 'area' \| 'live' \| 'combat' \| 'death' \| 'edge' \| … }` | TIME and CAREER ask, TECH writes |
| `log` | `{ entry }` | TECH |
| `line` | `{ text, kind? }`, a short line for the player (a toast until the presenter exists) | TECH |
| `roll` | `{ roll }`; from v0.0.5 told after each logged roll with the roller, `{ roll, who }` | SKILLS |
| `say` | `{ who, text, kind, durMs }`; v0.0.5's kinds `pa` (the tower's PA) and `speech` (someone beside you: the coach); on the pairs course the coach speaks his commands as `speech` (no PA, v0.0.8) | PEOPLE |
| `area-enter`, `area-leave` | `{ site, area, from, portal }` | PLACES |
| `door` | `{ id, area, x, z, state: 'open' \| 'closed', kind, who }`, a door turned; x and z its middle in the frame of the side it was turned from: the live area's when it holds the door (a ground's mass door naming the opening), else the opening's floor (built in v0.0.3) | PLACES |
| `chunk-in`, `chunk-out` | `{ site, area, i, j }` | PLACES |
| `path-done` | `{ reqId, who, ok, lengthM, reason }`, a path request answered | PLACES |
| `sound` | `{ kind, x, y, z, area, db, src }` | VIEWS, PEOPLE |
| `fx` | `{ kind, x, y, z, atMs, dir, size }`; v0.0.7 adds the kinds `dust` (a round into the berm or the ground) and `paper` (a face holed); v0.0.8 `spark` (a round on steel) | WEAPONS, COMBAT, PLACES |
| `stop-mode` | `{ phase: 'enter' \| 'leave', who, gun, via: 'ready' \| 'shoot' \| null, why }`: stop motion entered or left (v0.0.5); v0.0.8 adds `via: 'contact'` and, then only, `contact: { id, ms }` (the contact and its take-in) | WEAPONS |
| `step` | `{ phase: 'start' \| 'sub' \| 'halt' \| 'cut' \| 'end', who, step, i, action, fromMs, toMs, ok, grade, routine, mishap, text, brass? }`: a stop-motion or live step; **`sub` is emitted as each sub-step begins**, rolled, with its `fromMs` and `toMs`, so audio places the action's sounds by fraction; `halt`, `cut` and `end` come at the step's end, `cut`'s text the command that cut it; `brass` what the step threw out of the port, `[{ kind, landMs, at }]` (v0.0.5); v0.0.8's actions `press`, `round`, `shift` (a shot row's sub-steps) and `contact:hold`, `contact:challenge` | WEAPONS |
| `shot` | `{ id, who, gun, atMs, fired, why, stoppage, set, muzzle: { x, y, z }, dirRad, target, lane, hole: { at, score, v } \| null, brass: { kind, landMs, at } \| null, logSeq }`: a trigger pulled (v0.0.5); v0.0.6 adds `load`, the kind of round fired (null when none fired); v0.0.7 adds `flight` `{ rangeM, tofS, vMs, eJ, supersonic }` on every fired shot, `face` `{ paper, lane, line }`, `aimCm` and `poiCm` `{ elevCm, windCm }` on a KD face or the zero card, and the hole's `onPaper` and `band`; v0.0.8 adds, on a turner only, `part` ('torso' \| 'head'), `zone` ('A' \| 'C' \| 'head' \| null), `ring`, `through`, `down` (the head plate's verdict on an armoured face) and `row: { id, n, i } \| null`, and `atMs` is the round's formula time | WEAPONS |
| `muzzle` | `{ who, at, kind: 'near' \| 'flag' \| 'point', posture, atMs }`: a muzzle swept over someone (v0.0.5) | WEAPONS |
| `nd` | `{ who, gun, grade, into, nearId, atMs, during }`: a negligent discharge (v0.0.5); v0.0.7: grades to ND-5 and `hits` `[{ onId, part }]`, and **`during: 'graded'`**, said when the hits move the grade past the round's own (ND-4, or ND-5 for a death) | WEAPONS |
| `range` | `{ phase: 'cmd' \| 'fault' \| 'string' \| 'clear' \| 'stopped', cmd, hot, rule, kind: 'warn' \| 'stop', text, n, score, of, v, why }`: the range session (v0.0.5; a string's fact adds `hits`, `shots` and `list`, its shots in order as `{ score, v, hit }`, which PAPER prints, a miss `-`); v0.0.6 adds the phase `dry` (the coach's check found no rounds), the fault rules `onemag` (one magazine a string) and `slow` (the line moved on), and a string's `sat` (sat out) and `over` (fired with more than its rounds); v0.0.7's KD phases `group`, `zeroed`, `call`, `line`, `mark`, `brass`, `declare`, `casualty` and `closed`, with `line`, `group` `{ centreCm, call }`, `call` `{ crossMs, holdMil, clicks }`, `declare` `{ brass, rounds, ok }` and `casualty` `{ who, outcome }`; v0.0.8 adds the pairs course's phases `standby`, `turn`, `paper`, `lull` and `short`, with `string` and `paper: { takeInMs, pauseToFirstMs, splitsMs, zones, text }` | WEAPONS |
| `hit` | `{ kind: 'gunshot', onId, part, fromId, rangeM, load, energyJ, diaMm, w, penLeftMm, through, exitPart, margin, shotId, nd }`: WEAPONS §8.7's record of a round in a body (v0.0.7) | WEAPONS |
| `pit` | `{ lane, phase: 'down' \| 'marked' \| 'up' \| 'disk' \| 'flag', x, z, atMs, value?, shotIds }`: the KD pits at work (v0.0.7) | WEAPONS |
| `wound` | `{ who, part, kind, name, rate, artery, through, atMs, down, knockS }`: a wound taken (v0.0.7) | BODY |
| `casualty` | `{ who, phase: 'down' \| 'care' \| 'evac' \| 'outcome', byId, outcome: null \| 'stabilised' \| 'evacuated' \| 'dead', bloodPct, atMs }`: a casualty on the line (v0.0.7) | BODY |
| `reflex` | `{ phase: 'offer' \| 'chosen' \| 'kept', why, title, options, key }`: a reflex card (v0.0.5) | COMBAT |
| `contact` | `{ phase: 'seen' \| 'join' \| 'pause' \| 'ident', id, who, ids, seenMs, untilMs, ms, expect, n, grade, parts, ident: { [key]: 'rifle' \| 'pistol' \| 'hands' \| 'phone' \| 'unseen' } \| null, armour: { [key]: true } \| null, atMs }`: the take-in (COMBAT §25.4): a target seen opens its window or joins it, the pause at its end, an identification (a Challenge's answer); registered in v0.0.8; a bundle's beats will report on `step` with `kind: 'bundle'` and `ch` | COMBAT |
| `supp` | `{ who, input, why, supp, felt, band }`: an input to a person's suppression pool, folded (designed 2026-11-07, COMBAT §5.9; built with 0.0.7c) | COMBAT |
| `startle` | `{ who, ms, untilMs, why }`: a startle begun (COMBAT §5.7; 0.0.7c) | COMBAT |
| `choice` | `{ who, choice: 'fight' \| 'cover' \| 'blind' \| 'freeze' \| 'flee' \| 'surrender', felt, band, grade, atMs }`: an NPC's choice under the chaos (COMBAT §7.11; with `test-breach`) | COMBAT |
| `turner` | `{ key, lane, phase: 'turn' \| 'away', face, atMs, toMs, why: 'standby' \| 'hit' \| 'string' }`: a turning target faces over `TURN_MS` 300 or turns away (v0.0.8, `test-pairs`) | WEAPONS |
| `look` | `{ who, what: 'cut', from, to, atMs }`: a person's look changed, a haircut to another cut (v0.0.6) | PEOPLE |
| `papers` | `{ papers }` | TIME, CAREER |
| `body-stage`, `body-event`, `body-interrupt`, `body-dead` | BODY §2.4; v0.0.7's `body-dead` `{ who, why, atMs }`; as built in v0.0.4: `body-stage` `{ who, ledger, from, to, tone, words, atMs }`, `body-event` `{ who, kind: 'void' \| 'bowel' \| 'accident' \| 'asleep' \| 'woke' \| 'wash' \| 'groom' \| 'drink' \| 'eat', atMs, amount }`, `body-interrupt` `{ who, ledger, band, atMs }` (a crossing event dispatched); `body-dead` registered and not emitted (no death this round); v0.0.6: `body-event` kinds `soil` `{ amount, why }` (the hands) and `haircut` `{ cut }`, `groom`'s amount bits gaining hands 8 and clip 16; `body-stage` crossings of the ledger `hands` (BODY §6) | BODY |
| `broke` | `{ where, message }` | TECH |
| `supp` | `{ who, input: { id, kind, pts, k }, why, supp, felt, band, jump, flash: 'blind' \| 'dazzled' \| null, deafUntilMs, atMs }`: an input into a person's pool, the pool after it, felt and its band, the jump in felt, the bang's flash and deafness (COMBAT §5.1; built in v0.0.9) | COMBAT |
| `startle` | `{ phase: 'start' \| 'end', who, ms, fromMs, untilMs, why, inputId }`: a startle's start (`ms` its own length) and its end (`ms` the whole freeze, the frozen time in all: startles within `STARTLE_JOIN_MS` 1,000 joined; COMBAT §5.7; v0.0.9) | COMBAT |
| `fx` kind `'bang'` | `{ kind: 'bang', id, x, y: 0.05, z, atMs, by }`: a training bang going off (v0.0.9; `fx`'s other kinds as before) | COMBAT |
| the log's kind `'startle'` | "Startled 1.20 s: the bang, the chaos 60 − your hardening 17 = felt 43." (the build sheet 0.0.9 §2.4) | COMBAT |
| `range` (widened, v0.0.9) | the banged string's paper adds `bangs`, `frozeMs`, `offSafe` (ticks, a failed one marked) | WEAPONS |

The tower's commands are events, not facts: kind `range-cmd` at priority 2 (an O), handled by `onRangeCmd(state, bus, ev)`, the event handlers' signature in `jobs.js` (the build sheet's `onRangeCmd(state, ev, bus)` is corrected; COMBAT §3.3). From v0.0.8 its payload may carry `text`, the words said in place of the sequence's (a timed string's "CEASE FIRE. Time.", kept as `R.cmd.text`), and the KD course keeps `R.onYouMs`, the lived time the line has waited on you alone (WEAPONS §6.4). The instinct line's `variant` for a range-cmd may be `'owed'` (SKILLS §14.4).

## 12. Saves: stores and slots

Owner: TECH §7 (cadence: TIME §13).

| Item | Value |
|---|---|
| IndexedDB | `olympus`, version 2; stores `saves` (keyPath `slot`), `profile` (one record), `cache` |
| localStorage | `olympus.settings`, `olympus.debug`, `olympus.picks`, `olympus.scores`, `olympus.debug.overlays` |
| Slot form | `<worldId>:<name>`; the built store's unprefixed slots read as world `w-legacy` |
| Standard | `auto`, `auto-prev`, `day`, `manual-1` to `manual-9`, `edge`; `auto-prev` is not listed (`HIDDEN_NAMES`, as `ironman-prev`) and is offered by recovery |
| Ironman | `ironman`, and the hidden `ironman-prev` (offered only by recovery); the `ironman` slot is the edge save |
| Rotation on time | `auto` copied to `auto-prev` only when `auto-prev` is ≥ `AUTO_PREV_GAME_MS` 600,000 or ≥ `AUTO_PREV_REAL_MS` 300,000 older, and never a record whose digest fails; `ironman-prev` likewise |
| `day` | the first quiet frame after local 00:00 |
| Triggers | every skip's end, every chapter day, an area change, 5 minutes of live play, `pagehide` and hidden, quitting, a forced day; Ironman adds combat's start and death |
| Honesty marks | `meta.debugUsed`, `meta.imported`, `meta.recovered`: on the profile and the load list, never on the Memorial Wall or the papers (correction 22) |
| Schema | `SAVE_SCHEMA` 1 while every change can be filled in by `upgradeState` |

## 13. Shared helpers and module homes

One quantity, one helper (the hub). Every screen and every system calls these; none computes its own.

| Quantity | Helper | Owner, module |
|---|---|---|
| the player's id | `playerId(state)` | TECH, `core/ids.js` |
| where a person is | `whereIs(person, ms)`, with `posture` and `path` | PEOPLE §4.6 (TIME's and TECH's `whereAt` reads `whereIs`) |
| light at a point | `lightLevel(state, x, z, ms)` | `src/sim/places/light.js` (correction 14; VIEWS's `lightAt` reads `lightLevel`) |
| the light as the eyes take it (the picture's exposure and sight's reach, one number) | `eyeView(rec, ms)`, `eyesAdaptedTo(field)` → `{ a, gain, coneGain, lightK, rod, glare, shut, nv }`, read through people's `eyeViewOf(state, actor)` (`src/sim/body/eyes.js`, v0.0.5). The eyes: luminance 100 cd/m² × (lightLevel / 0.75)^3; floors, cones 0 and rods −2.1 log10 cd/m²; `REF_LOG` 0.15 (v0.0.4's picture, the eye five minutes into the dark); lids 3% photopic, 1% scotopic; the rods' gain (Y_ref / Y_a)^0.2, the cones' (Y_ref / Y_c)^0.2, `lightK` the rods' gain to the 1/0.6 power; each light's S/P in `src/data/places/sky.js` | BODY §23.4 (the picture's mix VIEWS §2.7, the reach PEOPLE §7.1) |
| the sun | `sunAt(site, ms) → { elevDeg, azDeg, horizonDeg, eclipsed, visible }`; `sunTimes(site, ms, { terrain })` | TIME §1, with PLACES's `horizonAt`; built in `src/sim/places/sun.js` (v0.0.3), reading PLACES's walls `MELAS_WALLS` in `src/data/places/melas.js` |
| dose rate | `doseAt(state, x, z, who)` | PLACES §3.10 |
| clocks and dates | `utc`, `msd`, `marsLocal`, `atMarsLocal`, `msAtMarsTime`, `localDay`, `dtg`, `formatDuration` | TIME §1, `src/sim/time/dates.js` over `core/calendar.js` |
| transit times, felt G, place, lag | `voyagePlan`, `feltAt`, `placeAt`, `lagAt` | TIME §12, `src/world/voyage.js` |
| a known threat | `threatKnown(state)` | COMBAT |
| a roll's modifiers; capacities | `bodyMods`, `needMods`; `capacity(p)` (built in v0.0.4 as `bodyMods(state, pid, key)`, `needMods(state, pid, key)` and `capacityOf(state, pid)` in `src/sim/body/mods.js`) | BODY §2.4 |
| a body as felt: its bands, cues, strip and words | `stagesOf`, `cuesOf`, `stripOf`, `wordsOf` (`src/sim/body/cues.js`, v0.0.4); the record `bodyOf(state, pid)`, brought to a moment by `bodySync` (`src/sim/body/body.js`) | BODY §2.4, §23 |
| what the player is doing; whether the feet are held | `activityNow(state, ms)`, `feetHeld(state)` (`src/sim/time/doing.js`, v0.0.4) | TIME §8 |
| the alert drill now | `alertNow(state, ms)`, `musterOf(state, pid)`, `mustered(state, pid, ms)` (`src/sim/time/alerts.js`, v0.0.4; the stage's beacon reads it) | TIME §9.5 |
| the splash's pace | `lapseS`, `splashPlan`, `ease`, `targetAt` (`src/sim/time/splash.js`, v0.0.4; the HUD drives it, the stage draws to it) | TIME §6.2 |
| what draws a person, and the pose between two | `figureOf(state, actor, ms)`, `poseAt(actor, ms)` (`src/sim/people/figure.js`, `place.js`) | PEOPLE §4.6 |
| a roll's words | `rollText(roll)`; built in v0.0.5 as `checkText(roll)` and `checkShort(roll)` (`src/sim/skills/checks.js`, tradecraft's word for word) | SKILLS |
| the news | `world/news.js` (SETTING §7.7's timeline at 0.1, the live layer from 0.2) | TECH §5.8 |
| gait speeds | BODY §16.1: walk 1.14 m/s on Mars, 1.45 at 1 G, 0.88 on Europa; built in v0.0.4 as `gaitSpeeds` and `gaitsOf` (`src/sim/body/motion.js`), rounded to 0.01 m/s; by stance from `test-shoothouse`: Combat ×0.85, Assault ×1.4 (COMBAT §25.9) | BODY |
| items moving | `arms/kit.js move(state, itemId, toHolder)` | WEAPONS |
| one person's side of a check: their value, their body's and needs' modifiers, the light | `rollerOf(state, pid, { ms })` (`src/sim/combat/roll.js`, v0.0.5; skills never import the body: TECH correction 8) | COMBAT, for SKILLS and BODY |
| a gun as its holder believes it (the only view the HUD reads) | `beliefOf(state, gunId)` (`src/sim/arms/firearms.js`, v0.0.5) | WEAPONS §4.2 |
| the step panel's steps | `stepsOf(state, ms)` (`src/sim/arms/shooting.js`, v0.0.5; about 0.7 ms a call, so the HUD reads it once a tick) | WEAPONS §7.1 |
| the plaque's figures, the same list as the roll | `plaqueOf(state, pid, { target, part })` (`src/sim/arms/shot.js`, v0.0.5) | WEAPONS §7.10 |
| the rifle on a figure, the kit, the range's paper and brass, as the stage draws them | `gunLook(state, actor, ms)`, `kitLook(state, pid)`, `rangeLook(state, ms)` (`src/sim/arms/look.js`, v0.0.5, in `SIM_FOR_VIEW`) | WEAPONS, for VIEWS |
| a skill's time | `paceOf(v)` (`src/sim/skills/skills.js`, v0.0.5: the one pace helper, checked) | SKILLS §5.12 |
| a person's hair: the cut, its lengths, its step and band, when it is due, whether it is in regulation | `hairOf(state, pid, ms)` → `{ cut, word, sex, thin, h, sols, mm: { sides, top }, step, band, dueMs, dueDay, regulation }`; `cutsFor(person)`; `squadHairH(seed, pid, cut, ms, lonEDeg)` the squad's closed form (`src/sim/body/hair.js`, v0.0.6; the figure, the doll, the sheet, the instinct and the barber read it) | BODY §6, PEOPLE §6.2 |
| what R does here, and R held's menu | `handOffer(state)` → `{ act: 'hand', verb, target, id, spotId, args, label, durMs, endMs, late, why, rows, more, struck }`; `handMenu(state)` → `{ title, spotId, fixtureId, quick, rows: [Row] }`, a Row `{ key, id, verb: 'activity' \| 'resume' \| 'open' \| 'close' \| 'wait', spotId, fixtureId, target, words, args, durMs, label, late, off, choices, pick }` (`src/sim/places/hand.js`, v0.0.6) | TIME §8.1, VIEWS §10.1 |
| why a single action is struck; its price | `offOf(state, id, spot, args, { atMs, wearing, bladderMl })`; `priceOf(state, word, durMs)` (`src/sim/time/activities.js`, v0.0.6: `startActivity` refuses with the same words) | TIME §8.1 |
| a chain's plan: its steps, total, end and late check | `planChain(state, { spotId, steps })` (`src/sim/time/chain.js`, v0.0.6; the R menu's foot reads it) | TIME §8.1 |
| which magazine a hand or a drill takes; how a magazine ranks | `pickMag(state, pid, { from, fams, load })`, `rankOf(state, ids, { load })` (`src/sim/arms/kit.js`, v0.0.6) | WEAPONS §5.2 |
| what a magazine's weight tells | `feelOf(n, cap)` (`src/sim/arms/firearms.js`, v0.0.6) | WEAPONS §4.2 |
| the rounds a shooter has left anywhere (the coach's count) | `roundsLeft(state, pid)` (`src/sim/scenarios/handling.js`, v0.0.6; the DI's dry line reads it) | WEAPONS §11.3 |
| from seeing someone to being able to act on it, for the player and every NPC; the quantity in words | `takeInMs(state, who, contact)` (`src/sim/combat/react.js`, the one helper, checked as `REACT_HOME`; built in v0.0.8 with `takeInOf`, `expectOf`, `coreMs`, `goMs`), `takeInWords(ms)` → '0.55' (the one formatter: the stamp, the plaque, the line, the paper, the log, the card) | COMBAT §25.4 |
| a drill rung; the bundles offered | `rungOf(state, pid, family)` (`src/sim/skills/templates.js`, built in v0.0.8: the sheet's rung, else `RUNG_OF_TIER` by the rank), `bundlesFor(state, pid, doorId)` (`src/sim/combat/bundle.js`) | COMBAT §25.3, §25.7 |
| a room's stack points, points of domination, sectors, dead space and paths | `roomPlanOf(state, doorId)` (`src/sim/combat/room.js`) | COMBAT §25.7.3, with PLACES |
| close-quarters constants | `TAKEIN_FLOOR_MS` 30, `TAKEIN_SPAN_MS` 700, `TAKEIN_EXP` 2; `EXPECT` sector ×1, area ×1.5, alert ×2 (floor 150 ms), surprise ×3 (`SURPRISE_FLOOR_MS` 250); `SUPP_MS` 200; `SECTOR_HALF_DEG` 20; `VIGIL_MS` 30,000; `HEADS_DOWN_WH` 15; `FINISH_MS` 250 (designed; not built: a sub-step is never cut, COMBAT §25.4.5 as built); `FUNNEL_FAULT_MS` 1,000; `LULL_MS` 3,000; `REPS_PRACTISED` 20, `REPS_DRILLED` 60; `HAMMER_MAX_M` 7, `FAILURE_MAX_M` 15 (v0.0.9; was 10; `HEAD_MAX_M` 25), `HEAD_SHIFT_S` 0.3, `CONTROLLED_CLIMB_K` 0.5; `COMBAT_WALK_K` 0.85, `ASSAULT_WALK_K` 1.4; built in v0.0.8: `GO_BASE_MS` 250, `GO_MIN_MS` 150, `SEEN` 0.5, `IDENT_DC0` 6 + range / `IDENT_PER_M` 5, `IDENT_DARK` 4, `CHALLENGE_MS` 1,200, `CHALLENGE_BONUS` 4, `TURN_MS` 300, `PAIR_MAX_M` 25, `TRIPLE_MAX_M` 7, `HEAD_MAX_M` 10, `A_MARGIN` 4, `PLATE_MM` 10, `STILL_UP_TORSO` 2, `STOP_TORSO` 2, `STOP_HEAD` 1, `SENSOR_MS` 100, `STRING_MAX_MS` 20,000, `STANDBY_MS` 1,500 to 4,000, `lullMag` 10, `PAUSE_GUARD_MS` 350 (the page's), `ROCK_MS` 120, `PLATE_FALL_MS` 1,100, `PLATE_DRIFT_MPS` 0.35 (m/s; the stage's) | COMBAT §25 |
| suppression and hardening: the pool, felt, its band, the modifier, the time, the nerve check, the startle, an NPC's choice; the one home (designed 2026-11-07, built with 0.0.7c) | `addSupp(state, pid, input)`, `suppAt(rec, ms)` (the closed-form decay), `hardOf(state, pid)`, `feltOf(state, pid, ms)`, `bandOf(felt)`, `suppMod(felt, skill)`, `suppTimeK(felt)`, `nerveCheck(state, pid, { felt, help })`, `startleOf(state, pid, input)`, `chooseOf(state, pid, felt)`, `noteExposure(state, pid, felt)` (`src/sim/combat/supp.js`, checked as `SUPP_HOME`); `rollerOf(…).mods` appends `suppMod`'s one entry | COMBAT §5, §7.11; SKILLS §6.8 |
| **As built in v0.0.9**: the chaos's shared helpers (`src/sim/combat/supp.js`, `src/sim/scenarios/pairs.js`, `src/sim/arms/shooting.js`, `src/ui/boot.js`) | `feltOf(state, pid, ms)`, `hardOf(state, pid, ms)`, `hardWord(H)` (green, settled, steady, hardened, unshakeable), `suppMod(felt, skill)`, `suppTimeK(felt)`, `suppNow(state, pid, ms)` (the block read as the face needs it: the pool, felt, band, the startle with its `soFarMs`, `froze.ms` the frozen time in all, the deafness), `suppWords({ pool, H, felt, band, mod })` (the sum, "the chaos 105 − your hardening 7 = felt 98: pinned, −10"), `bang(state, bus, { id, x, z, atMs, byId, kind: 'training' })` (returns `[{ who, pts, felt, startleMs, flash, deafUntilMs }]`), `bangsNow(state)` (the scene's measured figures, with `seenToFirstMs`, the card's first round from the sighting), `bangDue(state)` (a planned bang still to join the startle's freeze), `stepLabel` (shooting.js, a step's own label), `menuActs` (boot.js, the Esc menu's acts); the face's `view.setChaos`, `post.setChaos` and `decals.js LIGHT_FLAG` 0.9 (the flash's flag, which the fog of awareness never dims) | COMBAT, WEAPONS, VIEWS |
| the head rows' reach and panel (built in v0.0.9, the fixer's) | `FAILURE_MAX_M` 15 (was 10), `HEAD_MAX_M` 25 (was 10); `specials.js reachOf`, `pairs.js pairsReachM` (your own lane at the line's nominal 7 or 10 m anywhere in its box; every other target measured, unrounded); `panel.js remedyOf(steps, off)` (the step that lifts a struck shot row, by its reason), `panel.js digitOf(steps, id, { page })`; the numbering (`panelList`, `panelOf`, `isFixed`, `gatedRow`, `PANEL_KEYS`, `FIXED_MAX`, `FIXED_REPEAT`, `isShotRow`) in the pure `src/sim/arms/panel.js` | WEAPONS, COMBAT |
| the suppression pool's constants | `SUPP_MAX` 120 (saturating: `supp += input × k × (1 − supp / SUPP_MAX)`); a crack within `FULL_M` 1 m 8 (heavy 11, 0 at 5 m), subsonic 5 (0 at 3 m), an impact within 2 m 4; `MUZZLE_PTS` 4 indoors, 2 in the open (within 1.5 m); `ROOM_SHOT_PTS` 1; `KICK_PTS` 6 (within 5 m); `DIN_PTS_S` 0.5; a blast `min(60, 60 × (5 / rM)²)`; `FLASH_PTS` 60, `FLASH_NEXT_PTS` 20; hit 25; a friend hit 10; `PREP_K` prepared 0.25, forewarned 0.6, unprepared 1; `EARPRO_K` 0.6 (sound-borne, not the crack); vacuum rounds ×0.4, bangs 0; blanks ×0.5; `SUPP_GRACE_MS` 1,500; `SUPP_DECAY` 4 in cover, 2 exposed, 6 staying down (points a second); `BREATHE_MS` 4,000, `BREATHE_K` 2 | COMBAT §5.1, §5.2 |
| felt and what it does | `felt = clamp(round(pool − H), 0, 100)`; bands calm 0, under fire 20, suppressed 45, pinned 70; `SUPP_MOD_PER` 10, `SUPP_MOD_MAX` 10 (full on Marksmanship, Weapon handling, CQC, Medicine, Demolitions, Tech, EVA, Zero-g, Driving; half on Awareness, Fieldcraft, Tactics, Leadership, Comms, Social; none on Fitness); `SUPP_TIME_PTS` 200 (time × (1 + felt / 200)); the take-in's `SUPP_MS` 200 a band of felt; the nerve check d20 + Nerve + help (+2) + resolve's `round(10 × (resolve − 1))` against `NERVE_DC0` 1 + round(felt / `NERVE_PER` 5), asked from `NERVE_FROM` 45 | COMBAT §5.3 |
| hardening and inoculation | `hardening = clamp(round(WF × HARD_K[class]) + inoc + HARD_AXIS_PTS 3 × the nerve axis − toll, 0, HARD_MAX 100)`; `HARD_K` soldier 0.75, cop, criminal, spook 0.6, spacer 0.36, civilian 0; the toll exhausted 10, frayed 5, a combat stress load over 60: 10, morale very low 5, concussed 5, pain at "bad" or worse 5, shock 10, at most `HARD_TOLL_MAX` 25; `INOC_MAX` 25, `INOC_FELT` 20, `INOC_PER_SOL` 4; caps by teacher: boot and the School of Infantry 6, unit 10, the shoot house's cadre and the stress course 15, schools 20, the Raiders' ITC 25; `INOC_OF_TIER` (SKILLS §11.1); the test sheets' hardening recruit 7, private 17, corporal 36, sergeant 45, Raider 75, tier one 95 | COMBAT §5.6; SKILLS §6.8 |
| the startle and the flash | `STARTLE_FROM` 10 (a jump of felt); `STARTLE_MIN_MS` 1,500, `STARTLE_MAX_MS` 3,000, × (1 − H / 100)², `STARTLE_REPEAT_K` 0.5 within `STARTLE_REPEAT_MS` 10,000, forewarned ×0.5, at least one tick; `FLASH_CONE_DEG` 60, `FLASH_BLIND_MS` 5,000 (no new sighting); dazzled 60° to 120° `FLASH_DAZZLE_MS` 2,000 at `DAZZLE_SIGHT` −3; deafened without ear defenders 1 to 6 h, hearing ×0.1; a concussion's stun 2 to 6 s for anyone | COMBAT §5.7, §11.4 |
| an NPC's choice and the entry | `CHOICE_DWELL_MS` 1,500 (re-rolled at a band change, or from cover or blind fire after the dwell); `COVER_MS` 900 (down where he is) or a dash of at most 2 s within 3 m; doctrine's weights: irregular cover 0.5, blind 0.5, a pinned disaster flees; police and security cover, a pinned disaster surrenders; military cover 0.7, blind 0.3, a pinned disaster freezes; `TURN_MS` 300 to the noise; `SECTOR_AIM_K` 0.25 (a held sector's aim, a quarter of the sight term); `BANG_LATE_MS` 2,000 (the run sheet's "BANG TO ENTRY" fault) | COMBAT §7.11, §25.18 |
| the hit card | `hitMarks(state, who, by)` (`src/art/doll/marks.js`: the doll, H's and the card draw from it), `HIT_PX_PER_M` 96, `HIT_HOLD_MS` 6,000, "Search him" 20 s; the mark's point from `manHole` (built) | VIEWS §7.7 |
| a round's flight in a place: speed, energy, time, path, drift; the place's air | `flight(cal, load, barrelMm, env, rangeM, { zero, crossMs })`, `envOfPlace(state, area, x, z)`, `supersonicToM` (`src/sim/arms/ballistics.js`, v0.0.7: the bore-line tables built once) | WEAPONS §2 |
| a rifle's true zero at issue | `drawZero(seed, gunId)` (`src/sim/arms/firearms.js`, v0.0.7; with `sightOf`, `believeZero`, `setZero`; the dope card `DOPE_CARD` in `ballistics.js`) | WEAPONS §2.5 |
| the wind: as it blows, as a flag shows it, as a shooter reads it | `windAt(seed, ms, x, z)`, `flagOf(seed, ms, x, z)`, `readWind(state, pid, { atMs, bearingRad, coach, rangeM, mrkMin })` (`src/sim/arms/wind.js`, v0.0.7: a closed form, nothing saved) | WEAPONS §7.4 |
| the range's flags, stakes and your own point, as the view reads them (v0.0.8) | `KD_FLAG_AHEAD_M` 18 and `KD_FLAGS_MID` (`src/data/places/range.js`, 26 flags in all); `KD_STAKE_DX_M` −2.0, `KD_STAKE_DZ_M` 0; `rangeLook(state).kd.own` and, on the 25 m bay (null off it), `rangeLook(state).own` = `{ lane, line, x, z, text }`; the view's range stats gain `kd.own` and `own` (pixels drawn); `flagOf` gives `{ towardRad, liftK, speedMs }` with `FLAG_BANDS` 5, `FLAG_BAND_MS` 1.5, `FLAG_FULL_MS` 7.5 | PLACES §4.12, WEAPONS §7.4 |
| the HUD's rectangles that moved, and the far window's flag (v0.0.8) | `RECTS.RADIO.h` 60 (was 52; `RADIO_H_PX` 60 in `hud/radio.js`); radio lines carry `atMs`; `layout.js` exports `flagToKeep`, `FLAG_KEEP_M`, `FLAG_IN_FRAME_K` and `placeFar`'s `keep` option; `__olympus.far.flag` (the box kept clear, or null) | VIEWS §7.1, §7.5 |
| the far window's scale (v0.0.8) | `farSpanPx`, `farPpm`, `farRadiusM`, `farLensK`, `farReticleK`, `farBracketPx`, `FAR_CHUNKS_MAX` 16, `FAR_LENS_STEPS` 32, `FAR_BRACKET_PAD_PX` 4 (`src/render/far.js`); `OPTIC_S` re-exported by `sim/arms/look.js` for render | VIEWS §2.4, TECH §9.9 |
| what the DI says a shooter owes the line; the zero's clicks as dialled | `owedOf` (`src/sim/skills/instinct/range.js`); `zeroingOf(state, pid, gunId)` (`src/sim/arms/shot.js`), kdNow's `zeroing { from }` | SKILLS §14.4, WEAPONS §11.4 |
| where a round strikes a face, as it is or as believed; the hold for it, and in words | `poiOf(state, pid, gunId, target, { belief, hold, crossMs })`, `holdFor({ windCm, elevCm }, rangeM)`, `holdSaid(hold)` (`src/sim/arms/shot.js`, v0.0.7; `stop.hold` `{ xMil + right, yMil + high }`, the point of aim) | WEAPONS §7.4 |
| a hole on a face or the zero card; the odds of each ring; a group pooled; the coach's call | `faceHole(paperId, { aimCm, poiCm, roll, shotId, seed })`, `faceOdds(paperId, { value, dc, mods, poiCm })`, `poolOf(holes, sight, rangeM)`, `callOf(paperId, centreCm, rangeM)` (`src/sim/arms/paper.js`, v0.0.7) | WEAPONS §11.1, §11.4 |
| a round's line through an area, and what it does to a body; a hole's area | `traceRound(state, { shooterId, from, yawRad, pitchRad, cal, load, barrelMm, env, rngKey, nd, shotId })`, `hitOf(…)` (WEAPONS §8.7's record), `holeArea(load, layer)` (`src/sim/arms/penetrate.js`, v0.0.7) | WEAPONS §7.7, §8 |
| the KD line a person is on; the far point the window opens on | `lineOf(state, pid)`, `farPointOf(state, pid, { looking })` (`src/sim/arms/shooting.js`, v0.0.7; not the radio box's own `lineOf` in `src/ui/hud/radio.js`) | WEAPONS §11, VIEWS §2.4 |
| a face's height in the pits at a moment | `pitView(R, lane, ms)`, `faceUpAt(R, lane, ms)`, `markedFor(R, lane, ms, shotIds)` (`src/sim/arms/pits.js`, v0.0.7; `FACE_DOWN_UP` 0.5) | WEAPONS §11.5 |
| a round's wound; the corpsman's care; the casualty's outcome and its words; the ND's grade by its hits | `applyHit(state, bus, hit)`, `careOf(rec, ms, { tier })`, `casualtyOutcome(rec, { fromMs, evacMs })`, `casualtyLine(state, pid, outcome)`, `gradeOfHits(base, applied)` (`src/sim/body/wounds.js`, v0.0.7; with `downOf`, `mobilityOf`) | BODY §17, WEAPONS §6.6 |
| the wound line; blood on the ground and on the figure | `woundLine(body, ms)` (`src/sim/body/cues.js`), `bloodLook(state, area, ms)` (`src/sim/body/blood.js`, v0.0.7, in `SIM_FOR_VIEW`) | BODY §23.2, VIEWS §2.12 |
| the far window's place and its tick | `placeFar(w, h, state, { bearingRad, rCss, k, frame, from, label })`, `farTick(p, k)` (`src/ui/hud/layout.js`, v0.0.7; the stage draws where it says) | VIEWS §2.4, §7.5 |
| a turner's facing, its record and the targets it makes | `facingOf(T, ms)` (0 edge-on to 1 facing, a closed form over `TURN_MS`), `turnersOf(state)`, `turnTo`, `turnAway`, `turnerTargets(state, ms)` → `[{ key, kind: 'turner', lane, x, y, z, face, holds, facingK, down }]` (`src/sim/arms/turners.js`, v0.0.8; a target key `'turner:<lane>'`) | COMBAT §25.10.3, WEAPONS §7 |
| the take-in now: the window and the last pause; a lull; the feet in a window | `contactNow(state, ms)` → `{ pending, last }`, `lullOf(state, pid, ms)`, `feetOf(state, input)` → `{ mx, mz, run, stroll }`, `refusesAct(state, action)` (`src/sim/combat/contact.js`, v0.0.8; `move.js`, handling.js's range rules and shooting.js's stand-up read the feet) | COMBAT §25.4 |
| a shot row's price, parts and rounds; the rows and the reloads offered now | `rowPlan(state, pid, rowId, target, { tempo, atMs })` → `{ ms, parts, rounds }`, `shotRows(state, pid, ms)`, `reloadRows(state, pid, ms)`, `stillUp(state, key)` (`src/sim/arms/specials.js`, v0.0.8) | COMBAT §25.6, WEAPONS §5.3 |
| a round on an armoured face; a hole on a man-target | `steelOf(state, shot, T)` → `{ ring, through, down }` (`src/sim/arms/shot.js`), `manHole(face, part, roll, shotId, seed)` → `{ at, zone, word }` (`src/sim/arms/paper.js`, v0.0.8) | WEAPONS §7.11, §8.5 |
| the shot timer's line; test-pairs now; what "Again as …" starts; a turner as the marine sees it | `paperText(paper)` → 'TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.45 · SPLITS 0.40 · 2 A' (the coach, the paper, the card), `pairsNow(state, ms)`, `againAs(state, tier)` → `{ scenario: 'test-pairs', seed, tier }`, `seenFace(state, T, ms)` (`src/sim/scenarios/pairs.js`, v0.0.8; the face reads them) | COMBAT §25.10.3, VIEWS §7.4 |
| a handling step done quietly, or on another stream | `doAction(state, bus, { …, log, rng })` (`src/sim/arms/firearms.js`): `log: false` writes no log entry and no `roll` fact (the `nd` fact stays), `rng: 'relay'` draws on that saved stream (v0.0.7, the relay's) | WEAPONS §11.3 |

| Module rule | Home |
|---|---|
| SETTING's tables | `src/data/setting/`, one module per table (correction 11) |
| data | `.js` modules with a prose header, never `.json` (correction 12) |
| fitness | `src/sim/body/fitness.js`; SKILLS's `value()` reads effective fitness through the injected helper (correction 8) |
| pixel density | `src/render/scale.js`, `PX_PER_M` 16 (the user's pick, 2026-11-06; VIEWS §2.3), `?ppm=24` a test parameter only (`?density=` an alias) (correction 3) |
| palette snap | a 64³ lookup baked on the GPU (correction 4) |
| lamps | tiled static pools with no count limit, plus 10 dynamic slots (correction 5) |
| folders | WEAPONS's `src/sim/arms/`, COMBAT's `src/sim/combat/`, PLACES's `src/sim/places/`, as their sections list them (correction 13) |

## 14. Voyage profiles

Owners: SETTING §6.5 (the doctrine: which thrust a movement flies), TIME §12 (`voyagePlan()`, the one place a transit time is computed). Times are TIME §12.5's, door to door, at the start's geometry (departing Sol 602); a voyage on another date takes `voyagePlan()`'s answer for that date. LONGHAUL's +8% guidance overhead is not applied anywhere.

| Movement | Thrust | Door to door | Burn; flip after ignition; peak speed |
|---|---|---|---|
| the Alert Battalion, reinforcements, any movement in a crisis or at war, outbound (the first voyage) | 1 G | 6.87 d | 6.77 d; 3.39 d; 2,869 km/s |
| routine rotations and reliefs | 0.38 G | 11.09 d | 11.00 d; 5.50 d; 1,770 km/s |
| homeward after a low-g tour | 0.3 G | 12.48 d | 12.38 d; 6.19 d; 1,573 km/s |
| fleet exercises | 1 G for weeks | | |

| Leg or rule | Value |
|---|---|
| chord, Sol 602 departure | 5.616 AU at 1 G |
| the legs | secure 20 min; RCS departure 105 min; prep 10 min; ramps 20 s; flip 6 min, drive cold; secure the last 60 min |
| couches and juice | above 1.5 G |
| light lag at the start | Mars–Jupiter 5.734 AU, 47.7 min; Mars–Earth 19.3 min |
| Melas Field to Phobos | 2–3.5 h; about 5 min of ascent capped at 2.5 G |
| the Pens | 1–3 sols |
| Callisto, reception at Camp Lofn | 2–4 sols |
| Callisto to Europa's parking orbit | 6–9 h at 1 G |
| the drop | 0.9–2.3 h a wave; a braking burn of up to about 77 s at the troop-rated 2.5 G cap, then 90 s from the hover under 1 G; three waves for 2/4 |
| a transport's `cruiseG` | the class's cruise only; the movement's thrust is doctrine's |

## 15. Unit sizes

Owners: SETTING §5.3 (echelons and names), PEOPLE §3.2 (the company's billets). The hub's round numbers (platoon "about 43", company "about 190") read as these.

| Echelon | Strength | Made of |
|---|---|---|
| fire team | 4 | team leader, automatic rifleman, assistant, rifleman |
| squad | 13 | squad leader and three fire teams |
| rifle platoon | 44 | three squads and platoon commander, platoon sergeant, guide (42), with an attached Navy corpsman and radio operator |
| rifle company | 191 | three rifle platoons (132), a weapons platoon (46), company headquarters (13) |
| battalion | about 1,000; 2/4 deploys 980 | HQ and service company, three rifle companies, a weapons company |
| regiment | about 3,100 | |
| division | about 15,000 | |
| a frigate's detachment | 15 | a gunnery sergeant, a squad of 13, a corpsman |
| a lander wave | 352 | the Coprates class's eight Simooms of 44, its ready rooms' 352 crash couches (SETTING §6.3, PLACES §5.2); 2/4's 980 goes down in three waves (352, 352, 276); the Haboobs are not carried, they fly from the shore (SETTING §6.4) |
| MSF-E | 1,420 at the start, cap 2,400 | 2/4's 980 brings it to the cap |
| the Corps | 53,000 active, 30,000 reserve | |

## 16. The air

Owners: DESIGN.md's table (the hub, by inspired O₂), BODY §11.1 (what the air does), SETTING §4.2 (the full table by altitude), PLACES §3.2 (the standard airs inside).

`P = 52 kPa × e^(−h / 19 km)`; N₂ 65.4, O₂ 32, Ar 2, CO₂ 0.6 %; `PiO₂ = O₂ fraction × (P − 6.27 kPa)`.

| Place | Altitude | Total | O₂ | PiO₂ | Feels like on Earth (by PiO₂) |
|---|---|---|---|---|---|
| Mariner Valley floor | −5 km | 67.7 kPa | 21.6 kPa | 19.7 kPa | sea level |
| Base Melas | −4.5 km | 65.9 kPa | 21.1 kPa | 19.1 kPa | sea level |
| Datum | 0 | 52 kPa | 16.6 kPa | 14.6 kPa | about 2,400 m |
| Highlands | +5 km | 40 kPa | 12.8 kPa | 10.8 kPa | about 4,300 m |
| Tharsis domes | +10 km | 30.7 kPa | 9.8 kPa | 7.8 kPa | about 6,700 m |
| Olympus Mons summit | +21.9 km | 16.4 kPa | 5.3 kPa | 3.2 kPa | above 11,000 m |

| Air | Value | Owner |
|---|---|---|
| Martian indoor standard | 66.0 kPa, pO₂ 21.0, CO₂ 0.10 scrubbed, 20 °C: MCR buildings, MCRN ships, the FOB | PLACES §3.2 |
| CO₂ at Melas | 0.40 kPa, "stuffy" for newcomers | hub, BODY §11.4 |
| the light vac suit | a soft pressure suit at 34 kPa O₂ under a clip-on shell | BODY §19, SETTING §5.7 |
| Europa's towns | Ice standard: 75.0 kPa, pO₂ 16.5 kPa (22%), 14 °C, PiO₂ 15.1 kPa (§19, item 1, settled in both owners' text) | PLACES §3.2; SETTING §7.3 gives the name |
| "Feels like" | always by PiO₂; SETTING §4.2's dry-O₂ column is not quoted elsewhere | hub |

## 17. Names of ships and places

Owner: SETTING §1.4 (names and doctrine), with PLACES mapping its templates onto them; ids follow the settled names.

| Working name | Settled name | SETTING |
|---|---|---|
| "Noctis class" troop transport | the Coprates-class assault transport; three in commission: MCRN *Coprates* (AP-31), *Halloran* (AP-32), *Testudo* (AP-33), the player's first ride | §6.3 |
| D-16 drop ship | the Simoom-class assault lander ("the brick", 44 couches) | §6.4 |
| L-60 heavy lander | the Haboob-class heavy lander (60 couches) | §6.4 |
| the insertion craft | the Mistral-class insertion craft (10 seats) | §6.4 |
| "FOB Conamara" | FOB Pwyll, beside the Pwyll spaceport, in the Pwyll airspace (2/4's sector: Pwyll Deep, the Tyre Works, Manannán); PLACES's "FOB Pwyll Deep" reads FOB Pwyll | §7.4, §7.7 |
| Conamara | Conamara Under-Ice holds MSF-E's headquarters, Camp Halloran, and 1/7 | §7.4, §7.7 |
| "Conamara Shaft", "Thera Gallery", "Pwyll Berm" | town kinds, not towns: a shaft district, a gallery district, a berm camp; instances take a town's and a district's names ("Pwyll Deep, Shaft Head") | §7.4 |
| "MCRN Base Callisto", TIME's "Callisto Station" | Camp Lofn, the Corps' camp (the Transit, the Spin, the Flats); Naval Station Valhalla, the Navy's base and Jovian Command, 12 km off; Valhalla Town beyond Lofn Gate | §7.2 |
| the close-combat programme | the Marine Corps Martial Arts Programme (MCMAP), belt keys spelt `grey` | §5.5 |
| boot | 13 weeks at MCRD Argyre | §5.4 |
| the Commandant | generated per world, like every public office holder (SETTING §7.7's offices, PEOPLE §3.13), registered before the roster; holders' family names kept off tiers 1 and 2 | §7.7, §12.5, §12.6 |
| the levy | the terraforming levy: 12% for civilians, 1% for service members | §4.10 |
| money | 1 MCR ≈ US$14.5; a Private's basic pay 145 MCR a 30-day period; one price list, SETTING §11's | §11 |
| the arms makers | WEAPONS §3.1's; HAD's small arms at Ophir Chasma, drives and suits at Dustfall | §4.10 |
| Ceres Station's spin | 0.30 G at the rim of 450 m drums (ω 0.0809 rad/s), 0.301 G with Ceres' pull | §8.1 |
| the player's chain | 1st Squad, 2nd Platoon, Echo Company, 2nd Battalion, 4th Marines (BULWARK), 2nd Marine Division, MCB Melas | §5.3 |

## 18. Milestone numbers

Owner: ROADMAP (§3.4 holds over every section's earlier proposal; the owners align in their next change).

| Rule | |
|---|---|
| Rows, not releases | patch numbers in ROADMAP's tables name an order, not a release: v0.0.1 shipped the look round (§4.1's 0.0.2 row) with the engine, v0.0.2 shipped the skeleton (the 0.0.3 row), v0.0.3 the 0.0.4 row (a walkable barracks on a laid-out base), v0.0.4 the 0.0.5 row (needs and the first skip) and v0.0.5 the 0.0.6 row (`test-handling`, "Show clear"); v0.0.6 is a patch round of the user's asks (R's single actions and menu, the hair, test-handling made finishable), no new row; CHANGELOG says which rows each release holds. A section citing "0.0.n" names ROADMAP's row |
| 0.1.0 and 0.1.x | 0.1.0 is the core career; 0.1.x the patches that join the Tank, the G-house and the Long Arm, the lifesaver lane, the mat, the shoot house, the patrol, the ROE lane, office hours and the last roll call (ROADMAP §5.8) |
| The world layer | the constants, the ephemeris, body facts, the faction, hull and name data and the display modules at 0.0.12; traffic, politics, conflict, forces, intel, gravity, Lambert, the spatial hash, the rails and the prologue together at 0.2; the 0.1 news archive is SETTING §7.7's authored timeline (correction 23) |
| Later | Europa 0.3; ship combat 0.4 (fought from the troop transport); boarding, EVA and the frigate and corvette 0.5; reconnaissance 0.6; the Raiders 0.7; the long career and the squad leader's panel 0.8 |

## 19. Open between owners

Each line names the value that holds until the owners settle it; the lead records the settlement in DESIGN.md's decision log. Re-checked 2026-11-06 against every section: items 2, 4, 10 and 11 were settled in DESIGN.md's decision log that day and are now in the owners' text (the second table); v0.0.3's build found item 12; v0.0.4's build settled item 13, the alert drill.

| # | Disagreement | Holds until settled |
|---|---|---|
| 12 | The weapons platoon: PEOPLE §3.2's sections (the platoon commander and sergeant, a machine-gun section of 19, a mortar section of 13, an assault section of 13) add to 47, against its own 46 and §15's company of 191 (SETTING §5.3, PEOPLE §3.2) | §15's 46 and 191 hold; the Weapons Platoon is not generated (v0.0.3's company is 145 with the player: the headquarters and three rifle platoons), and its bays' berths stand empty, until PEOPLE settles the billets |

Settled in the owners' text since this file was written:

| # | Was | Now |
|---|---|---|
| 1 | Europa's towns' air: SETTING adopted a 55 kPa "Belter town standard" PLACES no longer held | SETTING §1.4 and §7.3 adopt PLACES §3.2's Ice standard (§16) |
| 2 | The walking speed of the walk test: at BODY's 1.14 m/s PLACES's reference sol walked 13.3 minutes against `SOL_WALK_MAX_MIN` 12, and PLACES asked BODY for an outdoor brisk walk of 1.32 m/s | settled 2026-11-06: BODY's 1.14 m/s stands; v0.0.2 compacted the plan (the armoury, its canopy and the mess hall moved), so the sol walks 808.7 m in 11.82 minutes; PLACES §4.2 and §4.3 take the plan as built |
| 3 | The hull data's milestone: ROADMAP moved `ship-classes.js` to 0.2 | ROADMAP §5.1 and §15.5 keep it at 0.0.12 (correction 23) |
| 4 | The company march's name: PEOPLE §13.5 called it `parade-company` | settled 2026-11-06: `company-march` (TECH §16.7, §8); PEOPLE renames its test |
| 5 | PEOPLE's sim share: 0.53 ms in PEOPLE, 0.8 ms in ROADMAP | every section reads TECH §16.2's 0.50 ms |
| 6 | The look round's scenes: VIEWS planned three Mars scenes and two swatches | VIEWS §2.3 and ROADMAP §4.1 list what shipped: L1 to L5, 24 views |
| 7 | The standby's length: ROADMAP's `7 + floor(8u)` | ROADMAP §5.1 reads CAREER's `10 + slip` (§3) |
| 8 | Ids TECH's table lacked | TECH §2.3.1 has `pr<n>`, `l:`, the site plan's `w:`, `b:` and `r:`, portals by opening or link id, households as numbers (§10) |
| 9 | The Coprates-class hull: SETTING's 260 m record against PLACES's 240 m deck program | SETTING §1.4, §6.2 and §6.3 and PLACES §5.2 carry one hull (240 × 40 × 36 m, 52,000 t, crew 72, 1,150 troops, rated 3.5 G, 8 PDCs, eight Simooms and two pinnaces) and the 352 wave (§15) |
| 10 | An `out` skip in a fight: TIME §4.5 ran it as a fast-forward of any length, TECH's loop sent every `out` to the outcome engine | settled 2026-11-06: a fight is never turned into an outcome around the player; TECH §3.6's loop picks its mode by `skip.engine`, and §5.9 holds the 12 ms row (§2, §7) |
| 11 | Melas's latitude: PLACES wrote 10.4° S and called SETTING's record the owner, while SETTING named PLACES | settled 2026-11-06: 10.5° S, owned by PLACES §4.1 and carried by SETTING §3.8's `SITES.melas`; PLACES §3.15's terrain sunrise and sunset, rerun at 10.5° S, are unchanged to the minute (§3) |
| 13 | The alert drill: CAREER §5.2 pinned the first to 02:30 on sol 0's night as an O wake event with a muster on the company street; TIME §9.2 drew the week's between 22:00 and 05:00, outside the slip; ROADMAP §4.1 named it an A interrupt | settled 2026-11-06 in building v0.0.4 (DESIGN.md's log): drawn from the world's seed between 00:30 and 04:30, the slip inside the night, the career's first on one of its first two nights; an A interrupt, its count and stand-down O events; the muster at your rack's foot, the count at +5 min, the stand-down at +30; the company street's muster with walking people at 0.0.9 (§3, §4; TIME §9.2, §9.5; CAREER §5.2) |
