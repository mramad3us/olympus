# CONTRACTS

OLYMPUS: the shared contracts, in one place. Several sections build on the same names and numbers: the clock and its constants, the start, the Plan of the Day, the job slots, the budgets of a tick and a frame, the people a scene holds, the state's top-level keys, the ids, the bus facts, the save slots, the voyage profiles, the unit sizes, the air and the names of ships and places. Each contract has one owner section, which holds the reasoning. This appendix holds the canonical values, one line each, so that every other section cites `CONTRACTS §n` instead of restating a number that can drift. When the owner changes a value, the same change updates the line here. The hub (`docs/DESIGN.md`) wins over both until they agree; TECH §1.3's corrections hold over every section on implementation matters, and ROADMAP §3.4 holds on milestone numbers.

Written 2026-11-05 from DESIGN.md, TECH §1.3, ROADMAP §3.4, SETTING §1.4 and the owners' sections as they stood that day. Where two owners still disagree, §19 names the disagreement and which value holds until it is settled.

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
| Melas | 287.2° E, 10.5° S, −4,500 m | PLACES §4.1 owns the site; `MELAS_LON_MS` 70,822,917; PLACES §3.15 and §4.1 still write 10.4° S (§19, item 11) |
| The clock in the state | `state.clock = { ms, tick, holds, seq }` | `tick` counts lived ticks only; `seq` every loop tick; never `state.time.ms` (TECH correction 1) |
| Game-time phase | `floor(clock.ms / TICK_MS)` | the same lived or skipped |
| `LIVE_MAX_S` | 45 | shorter actions are busy steps at 1:1 |
| `FF_MAX_MS` (= `RECYCLE_S` × 1,000) | 120,000 | under it a fast-forward, at or over it an outcome skip and a crowd recycle |
| `FF_ACTOR_S_MAX` | 6,000 | live actors × planned seconds a fast-forward may cost (TIME §5.2) |
| `JUMP_MS`, `JUMP_M` | 120,000; 1.5 m | an area unseen this long is placed, not walked; no placement interpolated past 1.5 m |
| `READ_CHUNK_MS`, `EARLY_MS`, `AUTOSAVE_LIVE_MS` | 600,000; 300,000; 300,000 | reading chunks; "five minutes early"; live autosave |
| Skip kinds and their step grid | `ff`: lived ticks; `outcome`, `out`: whole game minutes; `day`: whole hours, minutes while any contributor is not steady; `world`: event to event, no clock shown | the target gates whole steps, never cuts one (TECH §5.3, correction 19); an `out` skip during a live fight runs as lived ticks (TIME §4.5): §19, item 10 |
| Event times | whole seconds | `post()` floors `atMs` to the second |

## 3. The start and the first standby

Owner: SETTING §3.7 (the start), CAREER §5.4 and §5.9 (the standby's calendar and length).

| Item | Value |
|---|---|
| The start | Monday, Sol 590 of MY 211 (civil 5 Patience 211), 12:40 Melas time, 2351-12-19 02:20 UTC, `solIndex` 169,904, Ls 316.4° |
| At `START_MS` exactly | 12:39:34 Melas; 12:40 falls 25.6 s later (TIME §2.4) |
| Daylight at Melas on the start | 12.78 h, sunrise 05:37, sunset 18:23, noon sun 83° up, on a flat horizon (TIME §2.5, at 10.5° S); the canyon's walls shorten it to about 12.53 h, 05:44 to 18:16 (PLACES §3.15's `horizonAt`, to be reprinted at 10.5° S: §19, item 11) |
| Career sols | sol 0 is the arrival Monday; career sol n is weekday (n mod 7), Monday first |
| `STANDBY_SOLS` | 10 + slip; slip 0 for a new world's first recruit (CAREER §5.9) |
| First recruit's dates | warning order Wednesday Sol 599 at the 07:50 formation (the paper stamped 08:00); pack-out Sol 600; Echo lifts Sol 601; the battalion sails from Phobos Sol 602, 2351-12-31 10:15 UTC |
| A next recruit | arrives 56 UTC days after the last career ended, at 12:40 on the next working sol (CAREER §21) |

The standby's lessons by weekday (CAREER §5.4 owns them; blocks are §4's):

| Career sol | Weekday | What the calendar books |
|---|---|---|
| 0 | Monday | arrival at 12:40, the three stops; the 02:30 recall drill that night |
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
| On standby | liberty within the recall radius (Redwater); one unannounced recall or alert drill a week. Until Redwater is built (0.2), the player's liberty is on base (CAREER §5.4, ROADMAP §5) and the people's Redwater liberty is an off-site override (PEOPLE §4.6) |
| Aboard ship | UTC; the same shape, reveille 06:00Z, taps 22:00Z, no slip |

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
| `local@00:00` | the per-day passes: everyone's schedules for the day, PEOPLE's per-sol pass (gossip, careers, arcs, the roster), BODY's daily work (bone, plasma, G stimulus, conditioning, vestibular, mass, ARS phases) | PEOPLE, BODY |
| `local@20:00` | tomorrow's PoD published; the sol director | PEOPLE, TIME |
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
| `CHUNK_M`, `REACH_M`, `DROP_M` | 32 m; 56 m; 96 m | PLACES §2.4 |
| Chunk generation | lazy and pure, counted in cells generated; no millisecond budget in the sim (TECH correction 7) | TECH §8.1 |
| `BRASS_LIVE` | 64 moving cases | TECH §3.1 |
| Budgets inside the sim | work units only (expansions, solves, cells, people placed), never real time | TECH §3.2 |
| Next tick | intents written in steps 6 to 8 act in steps 2, 3 and 9 of the next tick | TECH §3.1 |

Sim per tick by domain (TECH §16.2): PEOPLE 0.50 ms (steps 3, 6, 7), paths 0.60, rules 0.40, BODY 0.20, the rest 0.13.

## 7. Frame, sim, skip and save budgets

Owner: TECH §16 (measured on the Mac, Chrome on ANGLE Metal, density B in a 1600 × 1000 window) and TECH §5.9 (skips, after TIME §5.10).

| Measure | Budget |
|---|---|
| frame time | median ≤ 16.7 ms; p95 ≤ 18 ms; p99 walking ≤ 25 ms; no frame over 50 ms after an area's first 3 s |
| under a 4× CPU throttle | walking scenes hold a 60 fps median; `mess-noon` and crowd scenes median ≤ 25 ms, p95 ≤ 33 ms |
| under a 6× CPU throttle | walking scenes hold a 60 fps median; no frame over 50 ms (tradecraft's measure) |
| sim per lived tick | ≤ 2.0 ms mean; ≤ 4 ms at a minute boundary; ≤ 8 ms mean under the 4× throttle |
| view CPU, UI DOM | ≤ 4 ms; ≤ 1 ms a frame |
| GPU, integrated class at 1080p | ≤ 7.5 ms an ordinary frame (9 with the far window); the Mac holds a third (2.5; 3) |
| draw calls; programs | ≤ 160 (600 fails); ≤ 16, none linked after the first area's first frame |
| uploads mid-play | ≤ 1 MB and ≤ 2 ms a frame; whole textures only behind a cut |
| boot; title to play | ≤ 1.5 s; ≤ 3 s cold, ≤ 1.5 s cached |
| area change | ≤ 250 ms behind the cut; first frame ≤ 33 ms |
| JS heap; GPU memory | ≤ 300 MB, ≤ 20 MB growth in a 10-minute soak; ≤ 384 MB (people 128 MB: two 4096² layers) |
| loop | at most 5 ticks a frame (`FRAME_CAP_MS` 250); `ff` up to `FF_TICKS_FRAME` 40 and `FF_FRAME_MS` 8; outcome skips `SKIP_FRAME_MS` 4 (8 for the prologue) |
| a quiet outcome step | ≤ 0.05 ms |
| an 8-hour sleep, quiet barracks | ≤ 25 ms: 480 minute steps and about 40 events, about 7 ms |
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
| `skip` | TIME | the running skip, or null |
| `time` | TIME | `{ chapter, voyage, pod, alarms, interrupts, liveSinceSaveMs }` and TIME's own additions (`director`, `stances`, `drills`, TIME §13) |
| `player` | PEOPLE | `{ id, actor, waypoint, presets, keeps }`; the person is `people[player.id]` |
| `people` | PEOPLE | id-keyed persons only, each with `body` (BODY), `skills` (SKILLS), `kit` (WEAPONS) |
| `units` | PEOPLE | the unit tree and its billets |
| `happenings` | PEOPLE | the ring of notable things, ids `n<n>` (PEOPLE §2.5's "event log", renamed) |
| `actors` | PEOPLE | `{ list }`, the live area's bodies in a stable order |
| `mind`, `talk`, `names` | PEOPLE | the player's knowledge; an open conversation; the registry of full names |
| `fights` | COMBAT | one record per fight in the live area |
| `stop` | WEAPONS (with COMBAT for CQC) | the stop-motion context, or null |
| `items` | WEAPONS | every item with a record, wherever it is |
| `armoury` | WEAPONS | accountability by gun id, ammunition issues |
| `places` | PLACES | `{ live: { site, area }, sites: { … } }` (the built `sites` domain is renamed) |
| `world` | TECH (porting LONGHAUL) | empty at 0.1; politics, zones, forces, hulls, stations, intel, news from 0.2; civil traffic regenerated, never saved |
| `career`, `careers`, `memorial` | CAREER | the current career; past careers in this world; the dead, never capped |
| `log` | TECH (SKILLS for roll text) | at most 1,500 records; rolls stored without text |
| `flags` | TECH | one-shot facts and migrations done |

| Rule | |
|---|---|
| `$` keys | runtime only, at any depth, stripped from saves; a domain's derived data sits under one root (`$places`, `$people`, `$events`, `$items`, `$world`, `$body`) |
| Defaults | null, false, zero and empty fields are left out on disk (TECH §6.6, rule 1) |
| A body | deltas from a template: `{ v, tmpl, …what differs }` (TECH §6.6, rule 2) |
| A person's kit | `kit = { tmpl, worn: { <slot>: itemId }, hands: [right, left] }`; the suit is `kit.worn.suit` (TECH §6.7) |

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
| unit | `<battalion>/<regiment>`, then `-<company>`, `-<platoon>`, `-<squad>`, `-ft<n>`, `-hq` | `2/4`, `2/4-E`, `2/4-E-2-1`, `2/4-E-2-1-ft2` |
| site, area, room, zone | kebab segments joined by `.` | `melas`, `melas.echo.1`, `e1.bay-2-1`, `e1.z.bay-2-1` |
| fixture, opening | `f:` or `o:` and the template path in `:`-joined kebab segments | `f:e1:rack:07`, `o:e1:bay-2-1` |
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
| Fields holding an id | `id`, `<role>Id`, `<role>Ids`, or `who` (`leaderId`, `subjectId`, `assignedIds`, `parentId`) |
| Order | `cmpId`: kind, then number, then the rest (`p9` before `p10`); decisions iterate `ids(map)` |

## 11. Bus facts

Owner: TECH §2.7; every name is registered in `src/core/facts.js` with its owner, by the change that first emits it. Names are kebab-case (never `skip:start`).

| Fact | Payload | Owner |
|---|---|---|
| `hold` | `{ held, holds }` | TECH |
| `skip-start` | `{ id, activity, kind, fromMs, toMs, where, posture, mask }` | TIME |
| `skip-frame` | `{ id, atMs, ticker, frame }` | TIME |
| `skip-interrupt` | `{ id, atMs, by, prio, line, reflex }` | TIME |
| `skip-end` | `{ id, activity, fromMs, toMs, planned, interrupted, by, outcome, papers }` | TIME |
| `autosave` | `{ why: 'skip' \| 'day' \| 'area' \| 'live' \| 'combat' \| 'death' \| 'edge' \| … }` | TIME and CAREER ask, TECH writes |
| `log` | `{ entry }` | TECH |
| `roll` | `{ roll }` | SKILLS |
| `say` | `{ who, text, kind, durMs }` | PEOPLE |
| `area-enter`, `area-leave` | `{ site, area, from, portal }` | PLACES |
| `chunk-in`, `chunk-out` | `{ site, area, i, j }` | PLACES |
| `sound` | `{ kind, x, y, z, area, db, src }` | VIEWS, PEOPLE |
| `fx` | `{ kind, x, y, z, atMs, dir, size }` | WEAPONS, COMBAT, PLACES |
| `papers` | `{ papers }` | TIME, CAREER |
| `body-stage`, `body-event`, `body-interrupt`, `body-dead` | BODY §2.4 | BODY |
| `broke` | `{ where, message }` | TECH |

## 12. Saves: stores and slots

Owner: TECH §7 (cadence: TIME §13).

| Item | Value |
|---|---|
| IndexedDB | `olympus`, version 2; stores `saves` (keyPath `slot`), `profile` (one record), `cache` |
| localStorage | `olympus.settings`, `olympus.debug`, `olympus.picks`, `olympus.scores`, `olympus.debug.overlays` |
| Slot form | `<worldId>:<name>`; the built store's unprefixed slots read as world `w-legacy` |
| Standard | `auto`, `auto-prev`, `day`, `manual-1` to `manual-9`, `edge` |
| Ironman | `ironman`, and the hidden `ironman-prev` (offered only by recovery); the `ironman` slot is the edge save |
| Rotation on time | `auto` copied to `auto-prev` only when `auto-prev` is ≥ `AUTO_PREV_GAME_MS` 600,000 or ≥ `AUTO_PREV_REAL_MS` 300,000 older; `ironman-prev` likewise |
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
| the sun | `sunAt(site, ms) → { elevDeg, azDeg, eclipsed }` | TIME §1, with PLACES's `horizonAt` |
| dose rate | `doseAt(state, x, z, who)` | PLACES §3.10 |
| clocks and dates | `utc`, `msd`, `marsLocal`, `atMarsLocal`, `msAtMarsTime`, `localDay`, `dtg`, `formatDuration` | TIME §1, `src/sim/time/dates.js` over `core/calendar.js` |
| transit times, felt G, place, lag | `voyagePlan`, `feltAt`, `placeAt`, `lagAt` | TIME §12, `src/world/voyage.js` |
| a known threat | `threatKnown(state)` | COMBAT |
| a roll's modifiers; capacities | `bodyMods`, `needMods`; `capacity(p)` | BODY §2.4 |
| a roll's words | `rollText(roll)` | SKILLS |
| the news | `world/news.js` (SETTING §7.7's timeline at 0.1, the live layer from 0.2) | TECH §5.8 |
| gait speeds | BODY §16.1: walk 1.14 m/s on Mars, 1.45 at 1 G, 0.88 on Europa | BODY |
| items moving | `arms/kit.js move(state, itemId, toHolder)` | WEAPONS |

| Module rule | Home |
|---|---|
| SETTING's tables | `src/data/setting/`, one module per table (correction 11) |
| data | `.js` modules with a prose header, never `.json` (correction 12) |
| fitness | `src/sim/body/fitness.js`; SKILLS's `value()` reads effective fitness through the injected helper (correction 8) |
| pixel density | `src/render/scale.js`, `PX_PER_M` 16 or 24, `?ppm=` (`?density=` an alias) (correction 3) |
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
| the Commandant | General Halima Strand; public figures' family names kept off tiers 1 and 2 | §7.7, §12.6 |
| the levy | the terraforming levy: 12% for civilians, 1% for service members | §4.10 |
| money | 1 MCR ≈ US$14.5; a Private's basic pay 145 MCR a 30-day period; one price list, SETTING §11's | §11 |
| the arms makers | WEAPONS §3.1's; HAD's small arms at Ophir Chasma, drives and suits at Dustfall | §4.10 |
| Ceres Station's spin | 0.30 G at the rim of 450 m drums (ω 0.0809 rad/s), 0.301 G with Ceres' pull | §8.1 |
| the player's chain | 1st Squad, 2nd Platoon, Echo Company, 2nd Battalion, 4th Marines (BULWARK), 2nd Marine Division, MCB Melas | §5.3 |

## 18. Milestone numbers

Owner: ROADMAP (§3.4 holds over every section's earlier proposal; the owners align in their next change).

| Rule | |
|---|---|
| Rows, not releases | patch numbers in ROADMAP's tables name an order, not a release: v0.0.1 shipped the look round (§4.1's 0.0.2 row) with the engine, so the skeleton (the 0.0.3 row) ships as v0.0.2; CHANGELOG says which rows each release holds. A section citing "0.0.n" names ROADMAP's row |
| 0.1.0 and 0.1.x | 0.1.0 is the core career; 0.1.x the patches that join the Tank, the G-house and the Long Arm, the lifesaver lane, the mat, the patrol, the ROE lane, office hours and the last roll call (ROADMAP §5.8) |
| The world layer | the constants, the ephemeris, body facts, the faction, hull and name data and the display modules at 0.0.12; traffic, politics, conflict, forces, intel, gravity, Lambert, the spatial hash, the rails and the prologue together at 0.2; the 0.1 news archive is SETTING §7.7's authored timeline (correction 23) |
| Later | Europa 0.3; ship combat 0.4 (fought from the troop transport); boarding, EVA and the frigate and corvette 0.5; reconnaissance 0.6; the Raiders 0.7; the long career and the squad leader's panel 0.8 |

## 19. Open between owners

Each line names the value that holds until the owners settle it; the lead records the settlement in DESIGN.md's decision log. Re-checked 2026-11-05 against every section: items 1, 3 and 5 to 9 are now settled in the owners' text (the second table), each awaiting its line in the decision log and, where named, a stale sentence in one section; items 10 and 11 are new.

| # | Disagreement | Holds until settled |
|---|---|---|
| 2 | **The walking speed of the walk test.** BODY §16.1 walks Mars at 1.14 m/s, and PLACES §4.3 and ROADMAP §4.1 now time their walks at it; at 1.14 m/s PLACES's reference sol walks 13.3 minutes, over `SOL_WALK_MAX_MIN` 12. PLACES asks BODY for an outdoor brisk walk of 1.32 m/s (11.5 minutes) | BODY's 1.14 m/s, so the walk test fails until BODY adopts an outdoor brisk walk or PLACES compacts the plan |
| 4 | **The company march's name.** TECH §16.7 keeps `parade-platoon` at 42 and 20 and registers the company march as `company-march` (§8; VIEWS §3.7 now counts 62); PEOPLE §13.5 and its test list still call it `parade-company` | TECH's `company-march`; PEOPLE renames its test |
| 10 | **An `out` skip in a fight.** TIME §4.5 and §5.2 run unconsciousness during a live fight as a fast-forward of any length, at `FF_OUT_FRAME_MS` 12 ms a frame, so the fight goes on tick by tick around the body; TECH §3.6 routes every `state.skip.kind` `'out'` to the outcome engine, §5.3 steps `out` on whole minutes, and §5.9 lacks the 12 ms row | TIME §4.5's rule (a fight is never turned into an outcome around the player); TECH's loop chooses the engine by the skip's engine, not its kind, and §5.9 adds the row |
| 11 | **Melas's latitude.** PLACES §3.15 and §4.1 write 10.4° S and call SETTING's `SITES.melas` the record; SETTING §3.8's record carries −10.5 and names PLACES §4.1 the owner; TIME §1, §2.5 and every daylight figure use 10.5° S; PLACES's terrain daylight (12.53 h, against a flat "12.77 h") was run at 10.4° | 10.5° S; PLACES corrects §3.15 and §4.1, names itself the owner, and reprints its terrain sunrise and sunset |

Settled in the owners' text since this file was written:

| # | Was | Now |
|---|---|---|
| 1 | Europa's towns' air: SETTING adopted a 55 kPa "Belter town standard" PLACES no longer held | SETTING §1.4 and §7.3 adopt PLACES §3.2's Ice standard (§16) |
| 3 | The hull data's milestone: ROADMAP moved `ship-classes.js` to 0.2 | ROADMAP §5.1 and §15.5 keep it at 0.0.12 (correction 23) |
| 5 | PEOPLE's sim share: 0.53 ms in PEOPLE, 0.8 ms in ROADMAP | both read TECH §16.2's 0.50 ms; TECH §16.2's row still cites "PEOPLE §13.2's 0.53 ms", a note to drop |
| 6 | The look round's scenes: VIEWS planned three Mars scenes and two swatches | VIEWS §2.3 and ROADMAP §4.1 list what shipped: L1 to L5, 24 views |
| 7 | The standby's length: ROADMAP's `7 + floor(8u)` | ROADMAP §5.1 reads CAREER's `10 + slip` (§3) |
| 8 | Ids TECH's table lacked | TECH §2.3.1 has `pr<n>`, `l:`, portals by opening or link id, households as numbers (§10) |
| 9 | The Coprates-class hull: SETTING's 260 m record against PLACES's 240 m deck program | SETTING §1.4, §6.2 and §6.3 carry PLACES §5.2's hull (240 × 40 × 36 m, 52,000 t, crew 72, 1,150 troops, rated 3.5 G, 8 PDCs, eight Simooms and two pinnaces) and the 352 wave (§15); PLACES §5.2's opening paragraph and its §14 ask still describe the old disagreement, to be cut |
