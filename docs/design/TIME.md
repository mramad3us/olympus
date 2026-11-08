# TIME

How OLYMPUS keeps and spends time: the one clock and its faces, the 1:1 rules and every kind of pause, stop motion, the `skip()` contract and the activities that use it, the splash, interrupts, the Plan of the Day, chapters and papers, the background layers and their cadences, voyages, autosaves and determinism.

Written 2026-11-05 against `docs/DESIGN.md` (the hub) and the research notes in `docs/research/`. Revised the same day after the five-critic review of the whole design: SETTING's calendar (§3.2–3.3) and voyage doctrine (§6.5) adopted; TECH's corrections 1, 9 and 10, its paths (§2.1) and its state keys (§6.1) adopted; one parity contract (§5.5); one Plan of the Day keyed by weekday (§9.2); the sol director (§9.8); stances for carried-on blocks (§9.3); free time that pays (§8.9); drills that vary and the one that is real (§12.8). Aligned the same day with `CONTRACTS.md`, the shared contracts, which carries this section's constants, the Plan of the Day's times and the skip budgets for citation: TECH's step grid by kind (correction 19, the new `world` kind), ids, save slots and `whereIs` adopted. Numbers marked "measured" were computed on 2026-11-05 by a scratch script that imports LONGHAUL's `js/sim/ephemeris.js` and `js/sim/worlds.js` read-only. "The user" is the person who directs OLYMPUS, LONGHAUL and tradecraft; their decisions are quoted with dates. My own decisions are marked **(my call)** and hold until the user overrules them.

Revised 2026-11-06 for v0.0.2 as built and CONTRACTS §19's settlements of that day: the calendar as built (§1), 12:40 at 25.7 s past the start (§2.4), the debug skip keys ^ and $ (§4.1), the slow mark `time.slowToMs` (§5.4, §13), an `out` skip in a fight on the `ff` engine (§4.5), the splash's last target `toMs` (§6.2), nobody dissolving in the iris (§6.3, as VIEWS §5.1), the body's ledgers as BODY §2.6 keeps them (§5.5), SKILLS' one pace helper (§8.1), and every person generated (the user, 2026-11-05: "All people generated"; the names in this section's examples stand for whoever the roster drew).

Revised 2026-11-06 for v0.0.4 as built (the build sheet `docs/build/0.0.4.md`, §8 and §9; DESIGN.md's log of that day): the files (§1), the skip record's `spotId` and `held` (§5.3), the landing and the body's sync (§5.8), the night's sleep measured with a body (§5.10), the ease and the `'splash'` pause (§6.2), the splash's keys and the chunk (§6.4), an interrupt's phases (§6.5), the interrupts' sources (§7.1), the counts (§7.4), the resume (§7.5), the activities as built (§8.1 to §8.4), the alert drill drawn between 00:30 and 04:30 (§9.2), lateness at a drill (§9.5) and the suites (§15). Where this section's planned numbers and the built ones differ, the built ones are marked "as built in v0.0.4".
Revised 2026-11-08 for the user's rule "martian marines always train at 1G except for basic weapons training" (DESIGN.md's log; SETTING §5.11; PLACES §4.15): §9.2's PT row and training blocks at the Wheel (1 G), and the evening Ring seat withdrawn as a routine choice (§8.9, §13); and for the standing rule that nothing assumes Mars (TECH §1.4): a block's gravity is its place's, and a ship's clock is UTC.

## The model in short

- **One number.** Game time is an integer count of milliseconds since LONGHAUL's epoch, 2351-03-22 08:00:00 UTC (`state.clock.ms`, ms 0 = the epoch; TECH §1.3, correction 1). Every calendar and every clock face is derived from it by pure integer arithmetic. Nothing else is stored or advanced. The game starts at `START_MS` 23,480,400,000, 2351-12-19 02:20 UTC, Monday Sol 590 MY 211 at Melas (SETTING §3.7).
- **Three faces.** Mars local civil time (a 24-hour clock with the 39 m 35.244 s timeslip after midnight, "Sol 590 · 12:40"), UTC (ship time: the Navy, ships, Phobos, Callisto and Europa's towns) and the body clock (felt, never numbered). A face appears on screen only when the character can read a device that shows it.
- **1:1 while you act.** The sim steps at 20 Hz, one game second per real second. No speed controls. Space pauses, any card pauses, and time stands still while a choice is pending (stop motion, CQC, talk, a reflex card). In-world screens, the wrist terminal among them, run.
- **Time jumps only through activities.** An activity (a meal, a shower, sleep, a class, a watch) calls `skip()`. Under 120 s the real sim fast-forwards, visibly, where the area is quiet enough to afford it (§5.2). From 120 s up, and in crowded areas over 10 s (`LIVE_MAX_S`), the world gets **outcomes for the gap**: needs in closed form, bleeding minute by minute, scheduled and pre-drawn events checked at every simulated minute, persistent people placed where their schedules say, the crowd recycled, all behind ink. The splash is the stage zoomed close on you at the appliance, a time-lapse with a fast clock, skippable to its end and interruptible.
- **Big outcomes are never resolved inside a splash.** Anything that would change the story (an injury, an alarm, a summons, a mishap with a weapon, a hostile) stops the skip at its exact second and lands you in real time, with a reflex card where one is plausible.
- **The Plan of the Day** structures a sol into blocks you attend in person and either live or carry on with an outcome and a stance (push, steady, coast). It is one table keyed by weekday (§9.2) that every section cites. Lateness is measured to the second. A **sol director** makes sure each sol has its spike (§9.8).
- **Chapters** turn long stretches (a voyage, a quiet week, a school) into days with choices, care the player approves, offers that expire, forced moments and papers.
- **The world steps in layers:** fast (20 Hz, the live area), slow (per game minute: the site, the player's slow body, persistent people, ships), world (hourly and daily slots on UTC, the local day's slots on the local calendar). Far things get outcomes.
- **Voyages** are one closed-form plan (`voyagePlan()`): burn, flip, brake, sampled at any millisecond for felt G, deck state, position and light lag. The default first voyage is SETTING's: 1 G out, 6.9 days door to door (§12.5).

### What the user asked for

- The brief (2026-11-05): "Things must take time and not feel rushed with the ability to do activities that skip time. [...] taking a shower will take a chunk of time forward on the clock." And: "full days (Mars days not 24h) moving in real time until we do things that spend time like eating (some degree of splash screen to illustrate the action and a time fast forward)."
- Decided at kickoff (2026-11-05): "Clock: 1:1 real time while you act. Activities skip time."
- Carried over from tradecraft (dated where they are used below): time as a currency (2026-10-27), timed actions that skip (2026-10-28), no fast travel to work (2026-10-29) or to a mission (rc51: "we should be able to go to our mission without using the fast travel shortcut in TAB"), reading in 10-minute chunks (2026-10-31), nothing consumed unasked (2026-10-31: "i never asked to take the medication when washing up"), the crowd recycled after a skip (2026-11-03), a reflex when time must stop (2026-11-03), a splash and a reflex before a big outcome lands (2026-11-04), nothing left half frozen (2026-11-04), nobody spawning on top of you or streaking across the screen (2026-11-04), and the user's report from Windows that passers-by vanished mid-street (2026-10-26).

### Where time bends reality, and why

- Ordinary talk costs no game time (§4.4): charging it afterwards would make the world jump in view.
- A card pauses while you think, though its actions take their real time (§4.4).
- Looking at your wrist is free (§3.2).
- The sun follows mean solar time, with no equation of time, because LONGHAUL's orbits are circular (§2.5). The dust season keeps its real place in the year although a circle has no perihelion to drive it (SETTING §3.2).
- Voyages are the closed form plus their real legs (departure, prep, ramps, the flip), as every hull on rails in LONGHAUL's world flies (`world.js transitStateAt`). LONGHAUL's 5–12% flight overhead belongs to hulls flown by its minute-step feedback guidance, and is left out everywhere in OLYMPUS, said once here (§12.5).
- In a crowded area a short skip is an outcome behind ink, not a fast-forward, because the real sim cannot be run fast enough there (§5.2).
- A drill you have already done fast-forwards its familiar walk in the real sim and lives its twist (§12.8).

---

## 1. Units, constants and helpers

All constants carry their unit in the name. One quantity has one helper, and every screen calls it. Where they live (TECH §2.1, §2.2):
- `src/core/clock.js` and `src/core/calendar.js` (built in 0.0.x, TECH §1.2): integer time, UTC, MSD and the Mars local clock, pure arithmetic with no game knowledge. Because `src/core` may import only `src/core`, the functions that need SETTING's definitions take them as a parameter.
- `src/data/setting/calendar.js` (SETTING §3.8, TECH correction 11): `LS_EPOCH_DEG`, `MARS_YEAR_MS`, `MY_AT_EPOCH`, `MY_SOL1_MSD`, `WEEK_OFFSET`, the month and weekday names, `START`, `SITES`. TIME imports them; it does not restate their values except to show its arithmetic.
- `src/sim/time/dates.js` (a file TIME adds to its own folder, as TECH §2.1 allows): binds the core arithmetic to SETTING's definitions and exports the helpers below. The watch, the papers and the instruments call these, never their own arithmetic.
- `src/data/activities.js` and `src/data/pod.js`: the activities table and the Plan of the Day template (frozen literals, TECH §2.4). `src/sim/time/` (`activities.js skip.js interrupts.js pod.js chapters.js papers.js devices.js estimate.js`, plus `dates.js` and `director.js`): the rules. `src/world/voyage.js`: `voyagePlan()` (§12; TECH §19). **Built in v0.0.4**: `src/data/activities.js` (the table, §8), `src/data/pod.js` (the night: taps, reveille, the alert drill, the lateness classes), `src/data/scenes.js` (the test scenes, ROADMAP §2.2); in `src/sim/time/`, `activities.js` (the rules, `planOf`, `lateCheck`, `startActivity`, `finishActivity`), `doing.js` (`activityNow`, `feetHeld`, `dressMs`: data and core only, so the body and the walk import it without a cycle), `interrupts.js` (§7), `pod.js` (the night, §9.2, §9.5), `alerts.js` (`alertNow`, `musterOf`, `mustered`; pure, read by the stage's beacon) and `splash.js` (§6.2's pace, pure).

The built `core/calendar.js` follows §2.4 and §2.5 since v0.0.2, and `src/sim/time/dates.js` binds it to SETTING's definitions: the slip is centred on mean midnight (0.0.1 ended each sol with the whole slip, so its noon fell 19 m 48 s early); local sols are counted from east longitudes in [0°, 360°), on which SETTING's vectors are fixed (the epoch on Sol 326, the start on `solIndex` 169,904, a Monday; my call: kept, although it runs Melas' sol number ahead of the Airy-0 MSD by the site's east longitude; 0.0.1 took longitudes in (−180°, 180°] and read the start as Sol 606 · 12:59); and the year is SETTING's Airy-0 rule on LONGHAUL's ephemeris year (0.0.1 used a mean year of 668.5991 sols from 1955-04-11). `core-calendar` checks SETTING §3.8's vectors and §2.4's slip.

| Constant | Value | Meaning, source |
|---|---|---|
| `TICK_MS` | 50 | one sim step, 20 Hz (hub, tradecraft `clock.js`) |
| `SEC_MS`, `MIN_MS`, `HOUR_MS`, `DAY_MS` | 1,000; 60,000; 3,600,000; 86,400,000 | Earth units; an hour is always 3,600 s, on Mars too |
| `SOL_MS` | 88,775,244 | a Mars mean solar day, 24 h 39 m 35.244 s (hub; Allison & McEwen 2000) |
| `SLIP_MS` | 2,375,244 | the timeslip, `SOL_MS − DAY_MS` (39 m 35.244 s) |
| `HALF_SLIP_MS` | 1,187,622 | half of it (§2.4) |
| `EPOCH_UNIX_DAYS` | 139,237 | days from 1970-01-01 to 2351-03-22, by Hinnant's `daysFromCivil` |
| `EPOCH_UNIX_MS` | 12,030,105,600,000 | the epoch as Unix ms (only for tests and export file names; the sim never uses `Date`) |
| `TT_MINUS_UTC_MS` | 69,184 | TT − UTC: 32.184 s + 37 leap seconds, frozen (§2.3) |
| `MSD_EPOCH` | 169,639.236313 | Mars Sol Date at the epoch (measured) |
| `MSD_EPOCH_MS` | 15,059,764,595,616 | `round(MSD_EPOCH × SOL_MS)`: the integer form |
| `MELAS_LON_E_DEG`, `MELAS_LAT_DEG` | 287.2, −10.5 | Base Melas on the Melas Chasma floor (PLACES §4.1 owns the site; SETTING §3.8's `SITES.melas` carries it; CONTRACTS §2) |
| `MELAS_LON_MS` | 70,822,917 | `round(287.2 / 360 × SOL_MS)` |
| `MARS_YEAR_MS` | 59,373,085,632 | LONGHAUL's Mars orbital period, 687.1885 d (Kepler from a = 1.524 AU) = 668.8023 sols (SETTING §3.2, imported) |
| `LS_EPOCH_DEG` | 174.0 | Ls at the epoch: the real *mean* Ls, so that the season and LONGHAUL's planet angle agree (SETTING §3.2, imported; it replaces this section's draft 163.234, the real Ls) |
| `MY_AT_EPOCH` | 211 | the Mars Year at the epoch (Clancy et al. 2000, MY 1 began 1955-04-11; SETTING §3.3, imported) |
| `MY_START_MS` | −28,696,991,389 | when MY 211 began on the game's linear Ls track, `−round(LS_EPOCH_DEG / 360 × MARS_YEAR_MS)`: 2350-04-24 04:36:49 UTC, 332.14 days before the epoch (SETTING §3.3 gives 04:37) |
| `MY_SOL1_MSD` | `{ 211: 169315 }` | Sol 1 of each Mars Year as an Airy-0 sol number; later years `floor(msd(MY_START_MS + (k − 211) × MARS_YEAR_MS))` (SETTING §3.8, imported) |
| `WEEK_OFFSET` | 0 | MSD 0 was a Monday (SETTING §3.4, imported) |
| `START_MS` | 23,480,400,000 | the start, 2351-12-19 02:20:00 UTC (SETTING §3.7, TECH §5.8) |
| `MARS_OBLIQUITY_DEG` | 25.19 | for solar declination |
| `LIVE_MAX_S` | 10 | actions up to and including this are lived at 1:1 as busy steps (the user, 2026-11-07: "I'm okay with no time skip for actions taking up to 10s"; it was 45, my call) |
| `FF_MAX_MS` (= `RECYCLE_S` × 1,000) | 120,000 | below: fast-forward the real sim; at or above: outcome skip and crowd recycle (tradecraft `crowd.js`) |
| `FF_ACTOR_S_MAX` | 6,000 | live actors × planned seconds a fast-forward may cost; above it the skip is an outcome (§5.2, my call) |
| `FF_OUT_FRAME_MS` | 12 | sim time a frame may take in an `out` fast-forward, when the stage is hidden by the blackout (§4.5, my call) |
| `SPLASH_IN_S`, `SPLASH_HOLD_S`, `SPLASH_OUT_S` | 0.4, 0.8, 0.5 | a full splash's zoom in, outcome strip and zoom out (§6.2; VIEWS draws to them) |
| `SPLASH_IRIS_M` | 3.5 | the close frame: everything further than this from the splash's centre goes to ink (VIEWS §5.1's iris; §6.1, §6.3) |
| `JUMP_MS` | 120,000 | an area unseen this long has its persistent people placed, not walked (tradecraft `staffing.js`) |
| `READ_CHUNK_MS` | 600,000 | reading and study pass in 10-minute chunks (the user, 2026-10-31) |
| `EARLY_MS` | 300,000 | "five minutes early is on time" (§9.5) |
| `AUTOSAVE_LIVE_MS` | 300,000 | 5 minutes of unpaused live play between autosaves (§13) |

Helpers (pure, no `Date`, integer in, integer or plain object out). Names already built in `core/calendar.js` are kept (`utc`, `msd`, `localSol`, `marsClock`, `msAtMarsTime`); `dates.js` re-exports them with SETTING's definitions bound:

```
utc(ms)            → { year, month 1–12, day, weekday 0=Mon, doy, hour, minute, second, msOfDay }
atUtc(y,m,d,hh,mm,ss) → ms
msd(ms)            → Mars Sol Date (float, Airy-0), for instruments and papers
marsLocal(ms, lonE) → { solIndex, solOfYear, my, weekday, inSlip, slipMs, hour, minute, second, civilMs, meanSolarFrac, lsDeg }
atMarsLocal(my, solOfYear, hh, mm, lonE) → ms
msAtMarsTime(fromMs, hh, mm, lonE) → ms               (the next time the clock reads hh:mm; built)
localDay(ms, locale) → { index, startMs, endMs }      (the sol on Mars, the UTC day elsewhere: §11.3)
sunAt(site, ms)    → { elevDeg, azDeg, horizonDeg, eclipsed, visible }   (horizon terrain from PLACES; built in v0.0.3 in src/sim/places/sun.js)
formatDuration(ms) → "45 min" | "3h 20m" | "2d 4h"     (LONGHAUL's rounding rule)
dtg(ms)            → "190220Z DEC 51"                  (military date-time group)
```

---

## 2. The clocks

### 2.1 Game time

- **`state.clock = { ms, tick, holds, seq }`** (TECH §1.3, correction 1, adopted as written): "The clock is `state.clock` (`{ ms, tick, holds, seq }`), not TIME's `state.time.ms`. TIME's top-level key `time` holds TIME's own records [TECH §6.1]. `clock.tick` counts lived ticks only; a skip does not add to it, and TIME §5.4's `tick += (t1 − t0) / TICK_MS` is dropped. Staggering reads the game-time phase `floor(clock.ms / TICK_MS) mod N`, which is the same whether time was lived or skipped (my call) [TECH's]. `clock.seq` counts every loop tick, held or not, so inputs can be keyed to it [TECH §8.3]." `holds` lists why time stands still (stop motion, talk, a reflex card), saved; the player's own pause (Space, a card, a hidden tab) is the loop's and runtime only (built, `core/clock.js`).
- `clock.ms` is an integer, always a multiple of `TICK_MS` after a tick, and a multiple of 1,000 after a skip lands on a scheduled event (events carry whole seconds; §5.6).
- Integer ms stays exact in a JavaScript number up to 2^53 ms (285,000 years); `ms + MSD_EPOCH_MS` stays below 1.6 × 10^13 for centuries, so every sum below is exact.
- The ephemeris is LONGHAUL's: `days = ms / DAY_MS` is passed to `bodyPos(body, days)` unchanged, so every planet and moon is where LONGHAUL puts it on the same date (hub, Setting). Mars–Jupiter is 6.41 AU at the epoch and 5.73 AU at the start, closing (range 3.68–6.73 AU over the three years from the epoch, measured; SETTING §2.4).
- Game time never reads the wall clock. The loop turns real time into a count of ticks; the sim sees only ticks and inputs (§14).

### 2.2 UTC

- Tradecraft's Hinnant civil-date code (`src/sim/clock.js`, `daysFromCivil`, `civilFromDays`), with the epoch moved to 2351-03-22 08:00 and the Moscow offset removed: built in `core/calendar.js`. `utc(ms)`: `d = floor((ms + 8 × HOUR_MS) / DAY_MS)`, `msOfDay = ms + 8 × HOUR_MS − d × DAY_MS`, civil date from `EPOCH_UNIX_DAYS + d`, weekday `((EPOCH_UNIX_DAYS + d + 3) mod 7)` with 0 = Monday (1970-01-01 was a Thursday).
- UTC is the system's time: the powers, the Navy, ships, orders, pay, the news and light-lag stamps all use it (hub, Time). Measured: the epoch is a Thursday.

### 2.3 Mars Sol Date

- Real convention (Allison & McEwen 2000, the NASA GISS Mars24 algorithm): `MSD = (JD_TT − 2451545.0 − 4.5) / 1.0274912517 + 44796.0 − 0.0009626`, with `JD_TT = JD_UTC + (TT − UTC)/86400`.
- TT − UTC is frozen at 69.184 s: TAI − UTC has been 37 s since 2017, and the 27th CGPM (2022) decided to stop inserting leap seconds by 2035. The game's UTC is therefore a uniform scale with no leap seconds (my call: a projection, consistent with the CGPM decision).
- In integer form: `msdMs(ms) = ms + MSD_EPOCH_MS`, and `MSD = msdMs / SOL_MS`. The integer part is the sol count at the Airy-0 meridian; `frac × 24` is Coordinated Mars Time (MTC) in Mars hours. Measured at the epoch: MSD 169,639.236, MTC 05:40 (Mars hours).
- MSD appears only on instruments, met screens and papers that a scientist or a navigator would print. Marines never say it.

### 2.4 Mars local civil time and the timeslip

The hub settles a 24-hour clock with "the 39 m 35 s timeslip after midnight (KSR's convention)". The exact rule (my call on the placement):

- A site keeps the **mean solar time of its own meridian**. Base Melas and Redwater keep Melas time (my call: same valley, one clock). Other Martian sites use their own meridian with the same rule.
- The civil clock runs 00:00:00.000 to 23:59:59.999 in Earth-length hours, minutes and seconds. At 24:00 it **stops for the slip**: 2,375,244 ms in which the clock reads 24:00. Then it starts again at 00:00 and the sol number turns over.
- The slip is **centred on mean solar midnight**: civil 00:00 is half a slip after mean midnight. So the sun crosses the meridian at exactly civil 12:00, sunrise and sunset are symmetric about noon, and the slip straddles the dead of night. (Putting the whole slip after mean midnight would put noon at 11:40, which every marine would notice on the range.)
- The slip belongs to the sol that is ending: "Sol 590 · 24:00 +12" is 12 minutes into the slip at the end of Sol 590.

```
lonMs(lonE)  = round(lonE / 360 × SOL_MS)                  // Melas: 70,822,917
local(ms)    = ms + MSD_EPOCH_MS + lonMs(lonE)             // ms since local MSD 0, mean midnight
solIndex     = floor((local − HALF_SLIP_MS) / SOL_MS)      // absolute local sol count
into         = local − HALF_SLIP_MS − solIndex × SOL_MS    // 0 … SOL_MS−1, from civil 00:00
inSlip       = into ≥ DAY_MS
civilMs      = inSlip ? DAY_MS : into                      // the clock shows 24:00 in the slip
slipMs       = inSlip ? into − DAY_MS : 0
meanSolarFrac = (local mod SOL_MS) / SOL_MS                // 0 = mean midnight; drives the sun
```

Measured at the epoch, Melas: `solIndex` 169,640, civil 00:30:38 on Sol 326, so LONGHAUL's 08:00 UTC is half past midnight in the valley. At the start, `START_MS` (02:20:00Z) is `solIndex` 169,904, civil 12:39:34.335 on Sol 590; 12:40 Melas falls 25.7 s later (25.665 s, CONTRACTS §3). Every UTC day the local time of a fixed UTC moment falls back by 39 m 35 s (00:00Z from 2351-03-23 read 16:30, 15:51, 15:11, 14:31, 13:52 Melas on five successive days), and the two clocks realign every 37.38 days.

### 2.5 The Mars year, the sol of the year and the season

SETTING §3.2–3.4 defines the calendar (the year's origin, Sol 1's rule, the week, the names); TIME does the arithmetic with SETTING's constants, imported from `src/data/setting/calendar.js` (§1).

- **Seasons come from the ephemeris.** LONGHAUL's Mars runs a circular orbit, so the areocentric solar longitude Ls advances uniformly: `lsDeg(ms) = (LS_EPOCH_DEG + 360 × ms / MARS_YEAR_MS) mod 360`, with `LS_EPOCH_DEG` 174.0 (SETTING §3.2: the mean Ls at the epoch, late northern summer). The southern dust season (Ls 180–330, SETTING §3.2) opens 11.5 days after the epoch and closes 26 days after the start, during the first voyage.
- **The Mars Year** begins at the instant Ls = 0 (the northern spring equinox, the Clancy convention): year k begins at `MY_START_MS + (k − 211) × MARS_YEAR_MS`. **Sol 1 of MY k is the Airy-0 sol (integer MSD) that contains that instant**, `MY_SOL1_MSD[k]`, and that number is Sol 1 everywhere on Mars: a site's local `solIndex` is compared against the same boundaries, so a date means the same sol number planet-wide (SETTING §3.3, replacing this section's draft "first local sol after the instant"). `my` is the largest k with `MY_SOL1_MSD[k] ≤ solIndex`, and `solOfYear = solIndex − MY_SOL1_MSD[my] + 1`. Years hold 668 or 669 sols (668.80 on average; MY 211 to 216: 669, 669, 669, 669, 668, 669), with no leap rule to maintain: the ephemeris period does it.
- Measured at Melas: the epoch is `solIndex` 169,640, **Sol 326** MY 211 (169,640 − 169,315 + 1); the start is `solIndex` 169,904, **Sol 590** MY 211 (SETTING §3.7), Ls 316.4°.
- **Solar declination** `δ = asin(sin 25.19° × sin Ls)`; hour angle `H = 2π × (meanSolarFrac − 0.5)`. With latitude φ, `sin elev = sin φ sin δ + cos φ cos δ cos H`. No equation of time: the orbit is circular in the ephemeris (my call, for consistency with LONGHAUL). The canyon walls cut the horizon (PLACES supplies the horizon profile, `MELAS_WALLS`; `sunAt` applies it). **The disc's share** (built in v0.0.3, my call): `sunAt` also gives `visible`, the share of the sun's disc over the horizon (`SUN_DISC_DEG` 0.35°, the disc as seen from Mars, with a linear limb, rounded to 0.0001); `eclipsed` means a share of 0, so a sunrise over the canyon's rim takes the 87.3 s the disc needs to clear it, and the light scales by the share (VIEWS §2.7). `sunTimes(site, ms, { terrain })` gives the sol's rise and set by the disc's centre, flat or over the walls.
- Measured at Melas (10.5° S) without terrain, as v0.0.3 builds the sun (`places-light`): at the start, Ls 316.4°, the day is 12.78 h (sunrise 05:36, sunset 18:23, noon elevation 83.42°, a few degrees south of the zenith); at the epoch, Ls 174°, 12.27 h (05:52 to 18:08, noon 77.06°); at Ls 0°, 12.33 h (05:50 to 18:09); at Ls 90°, 11.64 h (06:10 to 17:49); at Ls 270°, 13.02 h (05:29 to 18:30). Over the canyon's walls the start's day is 12.53 h, 05:44 to 18:15, and the walls take 8 to 31 minutes through the year (SETTING §3.7's table). SETTING §3.7 and CONTRACTS §3 quote the start's figures at the same 10.5° S.
- **The week** is seven sols, Monday to Sunday, counted from MSD 0 (a Monday): `weekday = (solIndex + WEEK_OFFSET) mod 7`, 0 = Monday, `WEEK_OFFSET` 0 (SETTING §3.4). The epoch's sol is a Wednesday (its UTC day a Thursday); the start's is a Monday. Weekday names are SETTING's.
- The renderer of Mars on any instrument (telescope, tactical, a drop ship's window) rotates the planet by `meanSolarFrac` at the site's longitude, not by LONGHAUL's sidereal `rotH`, so the terminator over the Mariner Valley always agrees with the base's clocks. (LONGHAUL's `solarDayH(Mars)` gives 88,775.340 s, 0.1 s longer than `SOL_MS`; the difference would drift the terminator one minute every 625 sols.)

### 2.6 Away from Mars

| Place | Civil clock | Day structure | Local sky (for EVA and windows) |
|---|---|---|---|
| Ships (every hull) | UTC | ship's day 00:00–24:00 UTC; Navy crew on three 8-hour watches from 00:00, 08:00, 16:00 (LONGHAUL `duty.js`); embarked marines on the detachment's Plan of the Day | free space; the sun's direction from the ephemeris |
| Phobos Naval Yard | UTC | the yard's watches; berthing lit on a UTC day | Phobos' solar day 7.66 h; Mars fills a quarter of the sky |
| Callisto: Naval Station Valhalla (the Navy) and Camp Lofn (the Corps) | UTC | three watches; lights on a UTC day | solar day 402.1 h (16.75 d); eclipse by Jupiter about 4.8 h every orbit (2D ephemeris) |
| Europa's towns (under the ice) | UTC (hub) | three 8-hour shifts, as SETTING §3.6 names them: **first shift** 06:00–14:00 ("the morning"), **swing** 14:00–22:00, **graveyard** 22:00–06:00 ("the dark"); town lights at day level 06:00–22:00 UTC, dimmed amber 22:00–06:00, so people's clocks hold without a sun (my call) | none under the ice |
| Europa's surface | UTC on the suit | work is timed by the dose clock (§3.1), not by the sun | solar day 85.29 h (sun up about 42.6 h); Jupiter fixed in the sky over the sub-Jovian hemisphere; eclipse by Jupiter about 2.9 h every 3.551-day orbit, at local noon on the Jupiter-facing side |
| Ganymede | UTC (my call) | | solar day 172.0 h |

The peacekeepers on Europa run their Plan of the Day on UTC, with patrol and checkpoint shifts aligned to the town's three shifts (PEOPLE fills the rosters).

---

## 3. Time faces and the devices that show them

### 3.1 The faces and their formats

| Face | HUD format | Papers and orders | Notes |
|---|---|---|---|
| Mars local (Melas time) | `Sol 590 · 12:40`, second line `MY 211 · Melas` | `Sol 590 MY 211, 1240 Melas` | 24-hour, no seconds; in the slip `Sol 590 · 24:00 +12`, the `+12` counting minutes into the slip (my call; open question 1). Civilians' letters and the news add SETTING's civil date ("5 Patience 211", SETTING §3.4) |
| UTC | `02:20Z`, second line `19 Dec 2351` | date-time group `190220Z DEC 51` (my call: military custom) | HUD uses colons for reading; papers use the 4-digit military form |
| Durations | `45 min`, `3h 20m`, `2d 4h` (LONGHAUL `formatDuration`, rounded to the unit shown first); on Mars `3 sols` | words in log lines under an hour ("twelve minutes") | |
| Elapsed and countdown | `T+01:23:45`, `T−00:29:12` | | EVA, drills, maneuvers, the range timer |
| Voyage | `DAY 2/7 · FLIP IN 1d 9h · 1.00 G` | the voyage log stamps each day by UTC date | §12 |
| Dose clock | `DOSE 1.2/50 mSv · 13 min` (time to the limit at the present rate) | | BODY supplies dose, limit and rate; TIME formats the time left |
| Suit consumables | `O₂ 6h 40m` | | BODY supplies the closed form; TIME formats |
| Body clock | never a number: words in the mind (Tab) and the sheet (C): "your body says the small hours" | | §3.4 |

### 3.2 Devices

The HUD shows only what the character carries or can see (the hub; tradecraft DESIGN: "A clock only if the character carries something that tells the time").

| Device | Faces | Where | Notes |
|---|---|---|---|
| **Wrist terminal** (issued to every marine) | primary: the local civil face (Melas time on Mars, UTC elsewhere); secondary: UTC on Mars, "home" Melas time elsewhere; alarms; timer; stopwatch; the Plan of the Day; messages | the left wrist | waterproof; covered by a suit glove, when the suit HUD takes over; removed only in sick bay or by choice |
| **Suit HUD** | UTC, T+ elapsed since sealing, O₂ and dose clocks, the local sky's sun state on a surface | inside any sealed vac suit | |
| **Wall clocks, base** | ops rooms and the guard shack: two faces, `MELAS` and `UTC`; squad bay, mess hall, head, classrooms, range tower: Melas time only | fixtures (PLACES) | readable when in view and lit (perception decides) |
| **Bulkhead clocks, ships** | UTC | every compartment's hatch frame | |
| **Berthing repeater** (troopship) | UTC, voyage day, time to flip, ETA, current G, light lag to Mars | §12; an instrument in a pixel bezel (VIEWS) | shows only what the ship knows |
| **Drop ship seat display** | T+ from separation, time to entry or hover, G | | |
| **Plan of the Day board** | the sol's blocks in Melas time | outside the squad bay, and on the wrist | |
| **Range clock, gym timer, centrifuge panel** | T− and T+ for the activity | the fixture | |

**The HUD clock rule.** Each frame the HUD clock shows the faces of one readable device, by priority: the suit HUD if sealed, else the wrist terminal if worn, else the nearest wall or bulkhead clock the character can see now (in the perception cone or awareness radius, lit above the reading threshold VIEWS sets). If none, the HUD shows no clock. Looking at one's wrist costs no time (my call: a glance is a reflex, not an action).

### 3.3 Alarms

- The wrist terminal holds up to 4 alarms: `{ id, atMs } | { id, local:'05:20', repeat:'sol' | 'day' }`, each with a label. An alarm is a priority-2 event for its owner only (§7); it vibrates, so it wakes you and nobody else (my call).
- Alarms cannot be set inside the slip (the UI offers 24:00 or 00:00; my call: the slip is for sleep).
- The instinct suggests a wake alarm when you lie down: the next obligation's muster time minus the walk there, minus dressing, minus 5 minutes (§9.5).
- Duty alarms are set by the roster: the off-going watch wakes its relief 15 minutes before the relief's watch (an event with a person attached, so it can be forgotten; §9.6).

### 3.4 Without a device: the estimate

"What we see is what our character evaluates as being true" (the user, tradecraft, 2026-10-28). Without a readable device the mind (Tab) shows an estimate in words, rounded to the quarter hour, with a confidence word in tradecraft's `belief.js` register (sure, thinking so, guessing):

| Cue | Error σ | Example |
|---|---|---|
| sun visible, daylight | 20 min | "about ten, by the sun" |
| sunrise or sunset in view | 10 min | "just past sunrise, so near six" |
| routine around you (reveille noise, the chow smell, the squad turning in) | 30 min | "they're queuing for chow: half past eleven or so" |
| alone, no daylight, awake | 45 min + 15 min per hour of circadian misalignment | "your body says early afternoon" |
| just woken from an unknown sleep | 90 min | "no idea: you were out" |

The error is drawn once per cue period from the cosmetic hash `hash('time-guess', personId, floor(ms / (20 × MIN_MS)))`, so the guess holds still for 20 minutes and moves none of the game's dice. BODY supplies the circadian phase and misalignment.

---

## 4. Real time: the loop, pauses and stillness

### 4.1 The 1:1 loop

- An accumulator loop (tradecraft `main.js`, LONGHAUL `GameLoop.frame`): `dt = min(0.25 s, real dt)`, `acc += dt`, `while (acc ≥ 0.05 s && steps < 5) step()`. At most 5 ticks of catch-up per frame; beyond that, game time falls behind real time rather than spiralling (a debug HUD notes it).
- The renderer interpolates between the last two tick states with `alpha = acc / TICK` (both projects).
- **No speed controls while you act** (the user at kickoff, 2026-11-05: "1:1 real time while you act. Activities skip time."). Time moves faster only inside a skip (§5). In debug mode ^ skips 15 minutes and $ one hour as an "idle" activity (AZERTY's labels of the keys QWERTY calls `[` and `]`, read by code as `BracketLeft` and `BracketRight`; tradecraft `main.js`), a sliced outcome skip that marks the save `debugUsed` (TECH §5.6, §15.5); the `?` card lists them in debug mode.
- A tick that throws is lost, a toast says so once, and the game carries on (tradecraft `broke()`).

### 4.2 The five clock states

| State | Sim | HUD timers (toasts, balloons) | Entered by | Left by |
|---|---|---|---|---|
| **run** | ticks at 1:1 | run | default | any other state |
| **paused** | nothing | frozen | Space; any card (menu, log J, sheet C, inventory I, mind Tab, choice cards, and a paper opened as a card); the tab hidden; the window blurred for 0.5 s (my call: alt-tabbing never costs you) | Space; closing the card; focus back |
| **still** | frozen, waiting for a choice | run (the choice's own panel is live) | a pending choice in stop motion or CQC; a conversation open; a reflex card; an activity's start card | the choice made |
| **act** | ticks at 1:1 for a chosen step's duration, the player's feet held | run | a stop-motion step or a card action (§4.4) | the step's end, then back to still |
| **skip** | the skip engine (§5) | the splash's own | `skip()` | the skip's end or an interrupt |

HUD timers run on `hudMs`, advanced only in run, act and still, so a 16-second log line is never missed under a card (tradecraft `ui.js`; the user, 2026-10-27: speech bubbles "should linger as long as when using the top left text").

**Cards pause; screens run.** A card (an overlay drawn over the stage) pauses, including a paper opened as a card. The terminal (P) and every in-world screen (a repeater, a wall terminal, the suit HUD's tac, a window) run, because you are looking at a thing in the world (VIEWS §6.1, §6.2, §8.8, and its open question 4). So reading the posted Plan of the Day, the duty roster or the check-in sheet on the wrist costs real time; opening a letter or an order from the terminal opens it as a paper card, which pauses (VIEWS §8.8 confirms how the terminal hands a paper over).

**Headless runs.** The blur and hidden-tab reasons are turned off by the parameters that only tests, benches and agents use (`nostore=1`, `bench=…`, `bot=…`; TECH §15.3), because headless Chrome under playwright can report a page as blurred or hidden and a bot would sit paused with no error. Space and cards still pause there. `withGame` asserts, after `__ready`, that the loop's pause reasons are empty (TECH §13.3).

### 4.3 Stop motion

The clock rules only; WEAPONS and COMBAT own the steps.

- G with a weapon means intent and enters stop motion; X toggles the shooting mode (the hub; the user, tradecraft, 2026-11-03: "taking it out should imply we intend on using it, meaning that time stops and we enter the weapon ready sequence"). CQC enters it at the first exchange.
- **still** while choosing; a chosen step runs at 1:1 for `ceil(stepMs / TICK_MS)` ticks (**act**); then still again. Nothing advances on its own: with no input, time stays frozen indefinitely.
- Everyone else acts in real time during act steps, at their own pace (the user, tradecraft, 2026-11-03: "NPCs shooting at us should just move time forward normally as they do the things to ready their weapons").
- Stop motion ends at once when you cannot act (dead, unconscious, down, pinned, restrained, strapped into a couch under G above 1.5): the user, tradecraft, 2026-11-04: "it should cancel all of the stop motion mode when I get arrested or otherwise am unable to immediately do the shooting steps". No state may leave part of the world frozen ("being brought down with a gun half the world is frozen", the same day): the test in §15 walks every exit.
- Stop motion never runs during a skip; a skip cannot start during stop motion.
- **The contact window** (COMBAT §25.4): at 1:1, or inside a step, a person newly seen in a clear (a hostile elsewhere) opens a window of the marine's `takeInMs`, during which the world runs and every input but Space and Esc is refused; at its end the `input` layer enters stop motion and holds `'stop'` on that very tick. A step that ends inside a window does not stand the clock still: time runs on, the body idle and the stance held, until the window ends. "Nothing advances on its own" holds: a window only runs while time already runs, and Space pauses it.

**As built in v0.0.5** (`src/sim/arms/shooting.js`; the build sheet 0.0.5 §2.2, §8 items 9 and 16). G with a rifle on you enters the mode with the rifle brought up as its first step; **G with no weapon keeps v0.0.4's stub** (the `'ready'` hold until a digit), now in the weapons domain, so a gunless game is byte for byte v0.0.4's. The mode holds `'stop'` while you choose (**still**) and releases it while a step plays (**act**). A step's sub-steps fall at their cumulative formula times from its start, each taken on the first tick at or after it, so **a step lives `ceil(Σ ms / TICK_MS)` ticks** and the clock stands exactly at its end (LOAD 2,412 ms of formula, 2,450 lived; UNLOAD 5,050: WEAPONS §5.3). **The boundaries are taken in the fast `input` layer** (`stopInput`, which runs while time stands still, before anything that moves the world), not `rules` as the build sheet put it (the shot role's call): ending a step there and holding `'stop'` in that layer freezes that very tick, so the body counts no tick the clock did not pass; `stopRules`, in `rules`, only turns the aim and holds the facing. 600 ticks of choosing move nothing, the clock and the state's digest alike. **The chained wait** (my call: part of the step chosen, so "nothing advances on its own" holds): a step that completes the tower's current command runs on as a wait until the tower's next command or `WAIT_MAX_MS` 15 s, and any step chosen, or X, cuts it. A reflex card holds `'reflex'` while it waits (§4.4; COMBAT §3.5). Outside the mode, V, A and W are **live steps** (`state.stop { mode: 'live' }` for one step, nothing held).

### 4.4 Talk, cards and reflexes

- **Talk:** time stands still while a conversation is open (the hub; the user, tradecraft, 2026-10-26: "talk should pause the game, like combat"). Ordinary talk costs no game time (my call: charging the spoken time afterwards would make the world jump in view). Long conversations are activities with durations (a briefing, a counselling session, an hour of cards; §8).
- **Card actions:** a card pauses, but an action taken in it (H: tighten a tourniquet on yourself; I: move a magazine from a pouch to your hand) runs its duration at 1:1 behind the card as an act step, the card showing its progress ("doing: 1.4 s"), then pauses again (my call). So rummaging is free to think about but never free to do.
- **Reflex:** when the character sees something coming, time stands still for a choice card (tradecraft `reflex.js`; the user, 2026-11-03: "There should be a reflex mode, where time stops when things require it"). "Nothing" is always an option. The answer can be kept for the same kind of moment for `KEEP_S` 120 s (the user, 2026-11-04: "the reflex window is spammed on us too, there should be a way to remember our choice for a while"). A kept answer never answers a contact pause with a shot (COMBAT §25.4.6).
- **Inertial events** (a burn lighting, a cut, a hit) run in real time inside ticks, with 120 Hz substeps (LONGHAUL `inertia.js`). At 1:1 they need no frozen clock (BODY and COMBAT own the physics).

### 4.5 Unconsciousness

When the player is unconscious (BODY), time passes as an **automatic skip** of kind `out`, behind a blackout vignette. It is not chosen, so the threat refusal (§5.1.6) does not apply. Its only end is consciousness returning (a BODY crossing event) or being acted on in a way you would feel (treated, carried, struck), which ends it as you come round. None of what happens is shown except as muffled sound lines ("Boots. Someone says your name.") under "we only know what we know" (the user, tradecraft, 2026-10-26). Which engine runs it depends on whether a fight is live around you:

- **No fight in the area.** A fast-forward if BODY's estimate of the time to coming round is under 120 s and the area allows one (§5.2), an outcome skip otherwise.
- **A fight is live** (`state.fights` holds an open record in the live area, COMBAT §2.1). The `out` skip runs on the **fast-forward engine whatever its length** (`skip.engine` `ff`: CONTRACTS §2; TECH §3.6 picks the loop's mode by the engine, not the kind), so the fight goes on tick by tick around your body: the fighters, the shots that may hit you, the corpsman crawling to you, and "Doc's hands on your chest. Eleven minutes." (COMBAT §3.6; the corpsman is whoever the roster drew) at the minute the corpsman really got there. The crowded-area rule of §5.2 does not apply: a fight is never turned into an outcome around the player. The blackout hides the stage, so a frame draws only the vignette and its captions and may give the sim `FF_OUT_FRAME_MS` 12 ms instead of `FF_FRAME_MS` 8 (my call): eleven minutes out in a fight of 30 actors is 13,200 ticks at about 0.5 ms, some 6.6 s of compute and about 9 s behind the blackout (test 19 prints it). If the fight record closes while you are still out, the skip's engine becomes `outcome` at that tick and the rest continues as an outcome skip, the stage still hidden (CONTRACTS §19, item 10, settled 2026-11-06).
- Converting the fight to COMBAT §16's off-screen exchange for the gap was considered and refused (my call): the exchange resolves casualties by the minute, not who reached you when, and waking it back onto the stage (COMBAT §16.3) around a body that never moved would place fighters beside you. COMBAT §3.6 says the same.

---

## 5. Skipping time: the `skip()` contract

### 5.1 Principles

1. **Only activities skip time.** No bare waiting (the user, tradecraft, 2026-10-27: "pass the time things should be natural and time should feel like a currency"). The nearest thing to waiting is "stand by" at the place of your next obligation, with whoever else is there (§8.7): the Corps' own "hurry up and wait".
2. **No skip replaces a journey.** You walk to the shower, the mess, the range and the ride (the user, tradecraft, 2026-10-29: "we should not have the option to just fast travel to work, it would skip all the gameplay"; rc51: "we should be able to go to our mission without using the fast travel shortcut in TAB"). Rides skip their minutes, but boarding and getting off are lived. The one exception is a drill's familiar walk, which may be fast-forwarded in the real sim, tick by tick, never replaced by an outcome (§12.8).
3. **Outcomes, not simulation.** A skip of 120 s or more (over 10 s in a crowded area, §5.2) gives the world the results of the gap.
4. **Lived and skipped agree, to a stated contract.** Every slow process gives the same value whether its hours were lived or skipped (tradecraft's infection rule, design note part 2 §3): bit-exact within one engine, and within stated tolerances between lived and skipped time (§5.5).
5. **No big outcome inside a splash.** Anything that would change the story interrupts the skip and is lived (§7). The user, tradecraft, 2026-11-04, after an arrest with no warning: "without a splashscreen that explains what happened, without a reflex action to try to resist".
6. **Never under a known threat.** A skip is refused while the player knows of a threat: COMBAT's `threatKnown(state)` (a hostile seen in the last 60 s within 100 m, shots heard or taken in the last 60 s, or an active danger or alarm in your area), except the activities that answer the alarm itself (strapped in at general quarters, standing to at a post). The instinct says why ("Not with them out there.") (my call).
7. **Hunger keeps counting through sleep** (the user, tradecraft, 2026-10-28: "when sleeping, the hunger meter is frozen that's a bug"). Generally: no need is frozen by any activity unless the activity is its remedy.

### 5.2 Two engines

| | **Fast-forward** (`ff`) | **Outcome skip** (`outcome`) |
|---|---|---|
| When | the planned gap is under 120 s (`FF_MAX_MS` 120,000) and the area can afford it (below); an `out` skip during a fight, whatever its length (§4.5) | 120 s or more; over 10 s in a crowded area; every chapter day |
| What runs | the real sim, every tick, all layers, at up to `FF_TICKS_FRAME` 40 ticks and `FF_FRAME_MS` 8 ms of sim per frame (TECH §3.6) | the skip engine in simulated steps on its kind's grid (§5.4): whole game minutes on the live minute grid for an activity (`outcome`, `out`), whole hours for a steady chapter day (`day`), event to event only for a `world` skip (§5.7; CONTRACTS §2) |
| On screen | the stage itself, in place, with a dimmed ring around you and a fast clock: a time-lapse of the real world | the splash: everything beyond the iris in ink, the stage zoomed close on you at the appliance in the full form (§6) |
| Interrupts | from the fast layer at the tick they happen (perception, contact, COMBAT) and from the event queue | from the event queue only (§5.6) |
| Crowd | walks on | recycled at the end, behind the ink |
| Persistent people | walk on | placed by schedule at the end, behind the ink |
| Real duration | 1–2 s for 120 s in an ordinary area (2,400 ticks at 0.2–0.4 ms) | the splash curve (§6.2) |

**Crowded areas.** A fast-forward costs every live actor's ticks, and an outcome skip costs almost nothing, so a fast-forward is allowed only while `liveActors × planS ≤ FF_ACTOR_S_MAX` 6,000 actor-seconds (my call; TECH's bench tunes the number): a 120 s gap with up to 50 actors on the area (the squad bay, a range lane, a berthing at night), a 60 s gap with up to 100. Above it, any gap over `LIVE_MAX_S` 10 s is an outcome skip with the brief splash and an inked ring (§6.1). In the mess at noon (160 live agents, cap 168: CONTRACTS §8) that is every skip: busing the tray, the line, the toilet. The numbers say why: a 120 s fast-forward there is 2,400 ticks at about 1.8 ms, 4.4 s of compute and about 9 s of real time at 8 ms a frame (test 18 prints it), against 1–2 s in the bay. The rule reads only the state (the live actor list), so it is deterministic, and a fast-forward stays exactly lived ticks: TECH §8.2's `game-ff` (a fast-forward against the same ticks lived) holds unchanged. An earlier draft let actors outside the close ring think and look every fourth tick in a dear fast-forward; that is dropped, because it would make a fast-forward differ from lived time and would save little (thinking and looking are 0.25 ms of the mess's 1.83 ms).

The fast-forward keeps "nobody pops in or out in view" (the hub) for short gaps, because people walk; the outcome engine keeps it by placing and recycling only behind ink. The outcome engine is what makes hours cheap. Both are deterministic and both end through the same `finishSkip`.

### 5.3 Starting a skip

```
skip(state, bus, {
  activity: 'shower',               // key into the activities table (§8)
  who: 'p233',                      // the player, playerId(state); NPCs never call skip() (CONTRACTS §10)
  durMs | untilMs | untilEvent,     // duration rule, resolved now to toMs
  chunkMs,                          // repeatable activities (read, study): 600,000
  where: { area, spot },            // the fixture spot you stand or sit at
  posture: 'shower',                // for the splash and for the landing
  mask: 'D A O* B−hygiene S(k)',    // what may interrupt (§7.2, §7.3); default from the table
  resolver: 'pt' | null,            // a Plan of the Day block's resolver (§9.4)
  stance: 'push' | 'steady' | …,    // a carried-on block's stance (§9.3), else null
  late: 'accepted' | null           // set by the late card (§9.5)
}) → { ok, why }
```

Checks, in order (each failure gives an `ok:false` with a `why` the instinct can say):
1. Not in stop motion, CQC, a conversation or a reflex (§4). As built in v0.0.5, R offers nothing at all while stop motion is on (`state.stop`: the mode, or a lived V, A or W step; the integrator's: "R wait 15 min" showed under a running LOAD) **or while a range session is open**, from the tower's brief to the end card (`state.armoury.range`; the fixer's: R, R had sat out fifteen minutes on the firing line unanswered), so no skip starts from the line; the panel's Wait for the tower is the line's own (`src/sim/places/hand.js` `handOffer`).
2. `threatKnown` is false, or the activity answers the current alarm (§5.1.6).
3. The player stands at the activity's spot (they walked there: a lived busy plan, "moving cancels it").
4. The activity's own preconditions (BODY: you cannot sleep standing at 1 G; WEAPONS: you need the rifle in hand, unloaded, to clean it; PLACES: the shower has water).
5. The obligation check (§9.5): if `toMs` passes the next mandatory muster minus the walk there, the late card offers "fit it in" (shortened to end in time), "do it anyway" (sets `late: 'accepted'`) or "not now".

Then the kind is chosen, from the state alone: `out`, `day` and `world` (the prologue, the successor's gap, node's fixtures) by the caller; `ff` if the planned gap is under `FF_MAX_MS` and the area passes the crowded-area rule (§5.2), else `outcome`. The engine follows (CONTRACTS §2): `ff` for kind `ff`, and for `out` in a live fight or under 120 s where the area allows (§4.5); `outcome` for the rest. Then:
```
state.skip = {
  id: 'k37', kind: 'ff' | 'outcome' | 'day' | 'out' | 'world', engine: 'ff' | 'outcome',
  activity, who, where, posture, mask, resolver, stance,
  fromMs, toMs, atMs: fromMs,       // atMs: how far the sim has got
  chunkMs, chunks: 0,
  ticker: [],                       // [{ atMs, text, tone }], for the splash
  frame: [],                        // [{ atMs, people:[ids], light }], the close frame's samples (§6.3)
  stop: null,                       // { atMs, by }: by is the cause, an event's id, 'player' or 'hold'; not an id field (TECH §5.2)
  result: {},                       // filled by the activity's effects
  cmds: []                          // the player's skip commands, at their atMs (TECH §5.5)
}
```
and the bus gets `skip-start { id, activity, kind, fromMs, toMs, where, posture, mask }` (TECH §2.7). The resolver of a block (if any) runs now, from its own stream, and posts its beats into the event queue (§9.4). **As built in v0.0.4** (`src/sim/time/skip.js`): `beginSkip` keeps the activity's `spotId` on the record and starts `held` (the ids of the O events an `O*` mask held, delivered at the end), and `skip-start` adds `engine`, `spotId`, `vignette`, `stoppable` and `chunkMs` (CONTRACTS §11). The checks of 1 to 5 are `startActivity`'s (§8.1): not held, no skip and no activity running, none of the player's transitions playing, within `SPOT_REACH_M` 0.6 m of the spot, the fixture free (nobody else within `FIXTURE_FREE_M` 0.5 m), the activity's own preconditions (your own rack, your own locker), then the late check (§9.5).

### 5.4 One outcome step

The loop calls `advanceSkip(state, bus, targetMs, budget)` each frame with the time the splash clock has reached (§6.2). Where a step ends is set by the skip's kind and the state, never by the target: the target only gates whole steps (TECH §5.3; CONTRACTS §2). TECH §5.3 implements it; this is the contract, on `state.clock` (TECH correction 1):

```
s = state.skip
while (t0 = state.clock.ms) < s.toMs and not s.stop and not budget.over():
  tEv = nextAt(state)                                     // the queue's earliest live event
  t1 = min(s.toMs, tEv, gridNext(s, state, t0))           // outcome, out: minutes; day: hours while steady, cut at a contributor's next change; world: event to event
  t1 = max(t1, t0 + SEC_MS)                               // never a zero step; events sit on whole seconds
  if t1 > targetMs: break                                 // the target gates whole steps, never cuts one
  if state.clock.holds not empty: s.stop = { atMs: t0, by: 'hold' }; break   // no time passes while time stands still

  state.clock.ms = t1                                     // first, as the live minute layer has it; clock.tick is not moved
  slowStep(state, bus, t0, t1, { skipping: true, skip: s })   // §11.2: the same function the live minute layer calls,
                                                          // stepping from the slow mark time.slowToMs and moving it
  activityStep(state, s, t0, t1)                          // the activity's own accruals (training hours, laundry, …)

  for ev in popDue(state, t1):                            // in (atMs, prio, seq) order, seq numeric
    dispatch(state, bus, ev)                              // the event's world effects happen whatever the mask
    if stops(s.mask, ev): s.stop = { atMs: t1, by: ev.id }; break   // the rest due at t1: after the landing (§7.1)
    else if ev.line: s.ticker.push({ atMs: t1, text: ev.line, tone: ev.tone })
  apply s.cmds due at or before t1                        // "stop here", "one more chunk" (§6.4)
  sample = frameSample(state, s, t1); if changed: s.frame.push(sample)
if state.clock.ms ≥ s.toMs or s.stop: finishSkip(state, bus)
```

`budget.over()` decides only where a frame's slice ends, never what a step computes (TECH's `game-slices` test). Every step ends on the 50 ms tick grid, so a skip stopped anywhere leaves live play on it (TECH §5.3). The clock moves to the step's end before the slow step runs, so an event a contributor posts from "now" never falls inside its own step, and an event due at the skip's first clock is dispatched there, at its own second (TECH §5.3, built in v0.0.2). **The slow mark**: `slowStep` always starts at `time.slowToMs` and moves it to the step's end, in live play and in a skip alike, so each moment of game time is stepped once (§13; TECH §3.4).

`slowStep` over an interval `[t0, t1]` of at most a minute is, in this order (the same order as the live minute boundary, §11.2):
1. the environment of the current site: compartment gases and temperatures, breaches and vents, radiation and gravity fields (PLACES), stepped over `t1 − t0`;
2. the player's slow body: air uptake from the compartment or suit, core heat toward its target, dose, G exposure from the voyage sample, consciousness; bleeding, which in a skip is stepped here a minute at a time (the hub: "bleeding runs minute by minute") and in live play by the fast layer per second;
3. persistent people at the site (tier 2): schedule transitions and need crossings, both closed form;
4. ship systems and life support (PLACES, COMBAT) and the voyage's leg transitions (§12);
5. re-estimates of the player's need crossings, if anything in steps 1–4 changed their rates.

Hourly and daily work is not in `slowStep`: it is recurring events in the queue (§11.3), dispatched at their minute like any other event.

### 5.5 The parity contract: what "closed form" buys, and what lived and skipped must agree to

This is the one definition of "lived equals skipped". BODY §2.6 and §25, PLACES §3.1 and TECH §5.3 and §8.2 refer to it.

**How the processes are written.**
- **Needs** are BODY's physical ledgers (BODY §2.6, the owner): gut and reserve kilocalories, body-water litres, bladder millilitres, bowel grams, grime, sleep pressure, tissue nitrogen, dose. One closed-form function advances them, `bodyAdvance(p, envSeg, fromMs, toMs, activity)`, under one constant environment segment; nothing is integrated tick by tick, and there are no separate anchors and no `valueAt`. Rates change only when conditions change (an activity starts, you drink, the deck G changes), which starts a new segment. A skip with one activity is one segment, so the value at the end is one evaluation, and `bodyPeek` reads it mid-skip without writing.
- **Crossings** are solved, not searched: BODY's `nextCrossings(p, envSeg, fromMs) → [{ atMs, ledger, band }]` gives the time each ledger will reach its next band. The earliest goes into the event queue as a priority-3 event (§7) and is re-solved when the rates change.
- **Exponential processes** toward a fixed target compose exactly: core heat `T(t+Δ) = T* + (T − T*) e^(−Δ/τ)`, scrubbing toward a set point, a single compartment's pressure decay. Sixty steps of 1 s give one step of 60 s to float rounding. Bleeding uses the same form per wound (blood volume `V(t+Δ) = V e^(−kΔ)` for a fractional bleed, `V − rΔ` for a fixed one).
- **Linear accruals** (dose at a constant rate, G·hours at a constant G, training hours, water used) are added per step.
- **One set of step functions.** The live per-second layer, the live minute layer and the skip engine call the same functions, with the step length Δ the only difference: `bleedStep(p, Δ)`, `heatStep(p, env, Δ)`, `zoneStep(zone, Δ)` and their kin, each owned by its section. Nothing is modelled twice, so lived and skipped differ only by discretisation, which is measured.

**What is not exact, and why.** Several processes are evaluated at step ends and so depend on Δ: BODY's clotting rule, the heat balance's own sub-steps (BODY §2.6: "heat balance a minute at a time"), limited exchange between zones (PLACES §3.1: "exact for exponentials, limited for exchange"), and hazards redrawn when a rate changes, which happens at different instants lived (to the second) and skipped (to the minute). So lived and skipped time cannot be bit-identical, and no part of the design may claim parity "by construction".

**The contract.**

| Comparison | Must hold | Tested by |
|---|---|---|
| lived ticks against a fast-forward over the same span | bit-exact (a fast-forward is lived ticks) | TECH `game-ff` |
| an outcome skip against the same skip sliced any way (one step a frame, seven, all at once) | bit-exact | TECH `game-slices` |
| any run against the same run saved and loaded at any step boundary, and with keys reversed | bit-exact | TECH `game-determinism`, `game-keyorder` |
| lived against outcome over the same span | within tolerance, per quantity: BODY §25's `body-skip` (energy and water 1%, bladder 5 mL, core 0.05 °C, dose 0.1%, blood 0.1%), G·h 0.1%, sleep pressure 0.05 h, and for compartments PLACES's tolerances (until PLACES sets them, my defaults: pressure 0.1 kPa, temperature 0.1 °C, O₂ and CO₂ partial pressures 1%) | test 8 (`time-parity`, TECH §8.2) |
| events, lived against outcome | scheduled events fire at the same seconds; pre-drawn hazards fire at the same seconds while no rate has changed differently between the two; after a rate change, the rates are compared over many seeds, not the instants | test 8 |

A tolerance that a change breaks is a bug in a step function, never a reason to widen the tolerance silently: widening one is a change to this table.

### 5.6 Events and the queue

- `state.events` is a binary min-heap of plain objects, kept in the state and **saved as its heap array, not sorted** (TECH §1.3, correction 9: "The event queue is saved as its heap array, not sorted [TECH §4]. The order is a pure function of the operations done, so determinism is the same, and saving stays a pure read."). Each entry is `{ id:'e812', seq: 812, atMs, prio 0–5, kind, src, who, area, line, tone, reflex, payload }`, ordered by `(atMs, prio, seq)`. `seq` is a number from `state.meta.next.e`, so ties among equal times and priorities break in posting order: comparing the string ids would put `'e1000'` before `'e812'` and break first in, first out. TECH §4 implements the queue (`src/core/queue.js`).
- **Sources write their own events and may cancel them by `src` key**: schedules (Plan of the Day blocks, duties, alarms), BODY (need crossings, coming round), voyages (legs, secure calls), the world layer (recurring hourly and daily jobs), PEOPLE (story beats, someone coming to talk), COMBAT (the director's encounters, a riot at the checkpoint), PLACES (a scheduled pressure test, a dust storm's arrival).
- **Stochastic events are pre-drawn.** A hazard with rate λ per minute is realised by drawing its next time from an exponential on its own stream (`stream(src, key, generation)`), placed in the queue, and re-drawn only when λ changes (the process is memoryless, so the redraw is exact). Live play and skips therefore see the same events at the same milliseconds (my call: rolling per minute in one mode and sampling in the other would make lived and skipped hours diverge).
- **Whole seconds.** Every scheduled `atMs` is a whole second; a pre-drawn time is rounded down to its second. A skip that stops lands on that second, so the landing is exact.
- In live play the tick dispatches every event with `atMs ≤ now` at its start (§11.1).

### 5.7 Event to event: `world` skips only

Event-to-event steps are for `world` skips only, where no clock is shown (the prologue, the successor's gap, node's fixtures); a `day` skip steps whole hours while every contributor is steady; a splashed skip steps whole minutes (TECH §5.3, correction 19). An 8-hour sleep in a quiet barracks is 480 minute steps and about 40 events, about 7 ms (CONTRACTS §7).

### 5.8 Finishing and landing

```
finishSkip(state, bus):
  end = state.clock.ms; s = state.skip
  fraction = (end − s.fromMs) / (s.toMs − s.fromMs)
  closeActivity(s, fraction)                  // full or partial outcome (§8, "if cut")
  body.settle(player, end)                    // closed-form needs evaluated at end
                                              // (healing ran inside the skip as hourly events, §11.3)
  people.settle(site, end)                    // tier 2 at the site, lazily
                                              // everything below runs while the ring is ink (§6.1)
  if s.kind ≠ 'ff': placePersistent(liveArea, end)   // §5.9
  if s.kind ≠ 'ff' and end − s.fromMs ≥ RECYCLE_S × 1000: crowd.recycle(liveArea, end)
                                              // a shorter outcome skip (crowded areas, §5.2) leaves the
                                              // crowd where it stood: a minute's stillness behind ink is unseen
  papers = drainPapers(state)                 // pay, orders, mail that landed (§10.6)
  bus.emit('skip-end', { id, activity, fromMs, toMs: end, planned: s.toMs,
                         interrupted: !!s.stop, by, outcome: s.result, papers })
  if s.stop: land(state, bus, s.stop)         // §7.5
  state.skip = null
  bus.emit('autosave', { why: 'skip' })
```

**As built in v0.0.4.** `closeActivity` is `finishActivity` (`src/sim/time/activities.js`): the effects, whole or by the share lived, the landing's pose and outfit, the log line and the `activity` fact. `body.settle` is `bodySync(player, end)` **after an outcome skip only**: a fast-forward's body is as its ticks left it, so TECH's `game-ff` (a fast-forward against the same ticks lived) stays bit-exact, and a reader who wants a lived body to the tick syncs a copy first (`time-parity` reads both bodies so and holds the engines to 0.01 kcal and 0.01 mL). **A fast-forward stopped by an event ends at that event's tick** (the due layer checks the mask with `stops()` as the outcome engine does), so a lived and a skipped run of the same activity land at the same second; the fast-forward's clock then reads one tick on, the rest of that tick lived. `skip-end`'s `outcome` is `{ body: { before, after }, look: { outfit, wet }, chunk, lines, failedRoll, activity, held }` (CONTRACTS §11), the strip's source.

### 5.9 Persistent people and the crowd after a skip

- **Placement.** PEOPLE supplies `whereIs(person, ms)` (PEOPLE §4.6, with `posture` and `path`; CONTRACTS §13), closed form from the sol's schedule plus overrides (sick bay, the brig, on leave, dead). **Only where the player cannot see** (built in v0.0.3, my call after the review: R's wait across reveille changed nine poses in one frame, seven in sight): at each step's end of a skip, the slow contributor `people:place` gives a person their `whereIs` only if the player sees neither where they are nor where they would go, the live rule (PEOPLE §4.6); those in sight keep their pose until the live layer finds them unseen, and a sleeping player sees nothing, so a night's sleep moves everyone. Moment 2's morning rests on it: looking back at the squad when the lights come on, they are up only once you have looked away (`docs/build/0.0.3.md` §6, check 6; ROADMAP §4.4). At the end of an outcome skip, everyone whose `whereIs(end)` is the live area is put at their spot in their posture; anyone mid-walk is put on their path at the walked fraction (one A* on the area's grid, PLACES); anyone now elsewhere is removed. This is tradecraft's `staffing.js` rule ("already at their post if the clock jumped"), extended to every persistent person. Nobody is placed inside the iris, where the player can see, and nobody dissolves there. At 0.1 the iris holds only you, the fixtures and those using the same appliance with you; someone whose spot at the end lies inside it is placed just outside it on their path, and walks in once the iris opens (my call). From 0.2 someone whose `whereIs` crosses the iris (the squadmate at the next sink) walks in or out along their path at the time-lapse's speed (§6.3; VIEWS §5.1). The renderer never interpolates a placement across a jump of more than `JUMP_M` 1.5 m (TECH §9.4, VIEWS §2.4; the user, tradecraft, 2026-11-04: "NPCs streak accross the screen when they spawn").
- **Walk-ins in live play.** A schedule that brings someone into the live area spawns them at an entrance (a door, a hatch, a corridor mouth) out of view, walking in; if every entrance is in view they wait up to 60 s, then come through the nearest door anyway: people come through doors, that is not popping. Leaving is walked out the same way. An area left unseen for `JUMP_MS` (2 minutes) has its people placed, not walked, when you come back.
- **The crowd** (tier 4) is recycled after any outcome skip of 120 s or more (the user, tradecraft, 2026-11-03: "time passing (like during a judo class) doesn't seem to recycle the NPCs on the map?"): every throwaway person is dropped except casualties, and the area is refilled anywhere outside the iris at the new minute's density (tradecraft `crowd.js recycle`, `fill: true`). Casualties stay until someone takes them (the user, tradecraft, 2026-11-04: "shot and down NPCs … should stay loaded for a reasonable amount of time").
- All of this happens while everything beyond the iris is ink, in the brief form as in the full (§6.1, §6.3), so the iris opens on a world that is already consistent. Test 20 checks it: no actor appears or vanishes in a visible cell across any kind of splash.

### 5.10 Performance

TECH §5.9 implements these, and CONTRACTS §7 carries them for citation.

| Work | Budget | Typical |
|---|---|---|
| one outcome step, quiet minute | ≤ 0.05 ms | a few µs plus whatever events fire |
| an 8-hour sleep in a quiet barracks | ≤ 25 ms in total, spread over the splash's frames | 480 minute steps and about 40 events: about 7 ms |
| an 8-hour sleep beside a process that is not steady | ≤ 30 ms | 480 minute steps at ≤ 0.05 ms |
| a chapter day (24 h with 24 world hours) | ≤ 30 ms | |
| the default voyage (6.9 days) carried on in one go | ≤ 0.3 s, spread over the day splashes | 165 world hours and 7 world days of jobs: about 0.19 s by TECH §5.9's estimate |
| the homeward voyage (12.5 days) carried on in one go | ≤ 0.5 s, spread over the day splashes | 288 hour steps with their hourly jobs and 36 daily ones: about 0.33 s for 12 days by TECH §5.9's estimate |
| fast-forward | ≤ 8 ms of sim per frame; 120 s in about 3 s of real time at most | 40 ticks at 0.2 ms; at the crowded-area limit (50 actors for 120 s, about 0.55 ms a tick by TECH §3.1's per-actor cost) about 2.7 s |
| an `out` fast-forward in a fight | ≤ 12 ms of sim per frame (`FF_OUT_FRAME_MS`) | 11 minutes in about 9 s of blackout (§4.5) |

The engine is sliced by the splash: no frame computes more than its share (LONGHAUL's rule, v1.12.6, 2026-10-25: "no route holds up the picture"; the user noticed hitches, tradecraft 2026-10-29: "each time I turn it staggers almost a second").

**Measured in v0.0.4**, with the player's body in every minute step: a night's outcome skip from 21:36 to reveille (8 h 34 min) takes **16 to 19 ms warm** in the foreground (k 1.00), under the 25 ms; the first, cold one 35 to 45 ms, over it, spread over the splash's frames at 4 ms a frame, so no frame hitches. It took 22 ms until the body record's copy became a plain loop. The time side alone (the queue, the slow mark, the squad's placing) is about 41 µs a minute in the band (13.7 ms an 8-hour night at k 4.04, about 3.4 ms at k 1); `time-determinism` prints both and holds the whole to 250 µs a skipped minute × k and 25 ms × k a night, and the time side to 52 µs a minute × k.

---

## 6. The splash

The hub settles the look ("the stage itself, zoomed close on you at the appliance, with the action's vignette (steam, the mess tray, the rack's curtain) and a clock running fast"). VIEWS draws it; this section settles its behaviour, its timing and its keys, which are one source for the felt pace of 20 or more splashes a sol. VIEWS §5.1's own curve (`1.5 + 0.9 log₂(1 + m/5)`, 1.5 to 6.0 s, plus 2.3 s of phases) and its Esc-to-skip are replaced by §6.2 and §6.4; VIEWS draws to these.

### 6.1 Two forms

- **Brief** (planned gap under 3 minutes): no zoom. The clock face (the device you can read, §3.2) runs, and the vignette is drawn in place over your figure.
  - **As a fast-forward** (under 120 s, where §5.2 allows it): the stage beyond the iris dims, and the world in it keeps moving at speed. People come and go only through doors and across the view's edge, as in live play (§5.9).
  - **As an outcome skip** (2 to 3 minutes; or over 10 s in a crowded area, §5.2): everything beyond the iris (`SPLASH_IRIS_M` 3.5 m from the splash's centre, VIEWS §5.1) goes to ink before anything is recycled or placed, exactly as in the full form. The iris opens on the world already placed. So nobody pops in or out in view (the hub, Pillar 6; the user's report from Windows, tradecraft, 2026-10-26, that passers-by vanished mid-street; and, after a skip, "time passing (like during a judo class) doesn't seem to recycle the NPCs on the map?", 2026-11-03, answered only behind ink).
- **Full** (3 minutes and more): zoom in with the iris closing to ink, time-lapse, outcome strip, zoom out.

### 6.2 Timing

TIME owns this curve and VIEWS draws to it. The real duration of the time-lapse for a planned gap of `m` minutes:

`S(m) = clamp(1.4 + 0.95 × ln(1 + m/4), 1.6, 8.0)` seconds (my call).

| Gap | 2 min | 5 | 10 | 20 | 30 | 60 | 120 | 240 | 480 | 1,440 |
|---|---|---|---|---|---|---|---|---|---|---|
| Time-lapse | 1.8 s | 2.2 | 2.6 | 3.1 | 3.4 | 4.0 | 4.7 | 5.3 | 6.0 | 7.0 |
| Full splash, all phases | | 3.9 | 4.3 | 4.8 | 5.1 | 5.7 | 6.4 | 7.0 | 7.7 | 8.7 |

Phases of a full splash: zoom in `SPLASH_IN_S` 0.4 s (the clock does not move yet; an interrupt now counts as minute 0); the time-lapse `S(m)`; the outcome strip `SPLASH_HOLD_S` 0.8 s (icons of what changed, from `skip-end.outcome`); zoom out `SPLASH_OUT_S` 0.5 s. Melas' 10-minute shower costs 4.3 s of real time; a night's sleep 7.7 s. A brief splash has no zoom: its time-lapse and a 0.4 s strip only.

**The strip waits for a key only when a roll in it failed** (my call): a failed check is the thing worth reading before play resumes (the skipped range relay that went badly, the class you nodded off in). Otherwise it holds its 0.8 s and goes; every line is in the log either way. The setting "short splashes" (VIEWS §5.3, §12) makes every time-lapse 1.0 s and leaves the rest as here.

The `splash` test (test 11, shared with VIEWS §14's) prints the real seconds of every activity's splash at its typical length, so the sol's felt pace is read from one table.

The displayed clock follows an ease: progress `p(τ) = ease-in-out over [0, 1]`, with the first 15% and the last 20% slower, so you see the first and last minutes tick. The sim target each frame is `fromMs + p(τ) × (toMs − fromMs)`, floored to the minute, and at the curve's end `toMs` itself: `toMs` is seldom on a minute, and a last target floored below it would never let the skip finish (built in v0.0.2's `game-targets` curves). The floor changes nothing the sim computes, since the target only gates whole grid steps (TECH §5.3). **The clock shows only what the sim has resolved**: if a slow machine lags, the clock waits for the sim, never the reverse.

**As built in v0.0.4** (`src/sim/time/splash.js`, pure: the HUD drives it, the stage draws to it). The ease is piecewise linear: the first 15% and the last 20% of the lapse run at 40% of the middle's rate (`EASE_END_K` 0.4, the middle at `R = 1 / 0.79`; my call). `lapseS(m)` is `S(m)` above, and `splashPlan` gives each phase: the 10-minute shower 2.59 s of lapse and **4.29 s** in all, a night 22:00 to 05:30 5.97 s and **7.67 s**, test-night's 21:55 to 05:30 7.68 s; the 6-minute stall 3.97 s, the basin 3.63 or 4.06 s, dressing 3.89 s (5.2 minutes) and 3.80 s (4.4), a 45-minute nap 5.48 s, R's 15-minute wait 4.58 s. **A fast-forward's lapse runs at the engine's pace** (40 ticks a frame), not this curve, which paces outcome skips only: the head's 75 s fast-forward is about 0.63 s at 60 fps and its 0.4 s strip. **No game time passes from the skip's landing to the end of the zoom out**: the loop holds the pause reason `'splash'` from `skip-end` until the zoom out ends, never shown as PAUSED. Measured in Chrome at 60 Hz, the shower's whole splash takes 4.28 to 4.30 s (in 0.38 to 0.40, lapse 2.60 to 2.62, strip 0.80, out 0.48 to 0.50), the watch stepping 19:30 to 19:40 minute by minute.

### 6.3 What the time-lapse shows

- **The close frame** is VIEWS' iris: everything within `SPLASH_IRIS_M` 3.5 m of the splash's centre (between you and the appliance). Things inside it move fast and truly.
  - **At 0.1**: you, the fixtures and the effects (the steam, the light through a window or a port, the timer on the shower panel, the clock), and anyone using the same appliance with you (the squad at your mess table), playing their activity's frames (VIEWS §5.1). Nobody else is drawn in the iris, and nobody appears or leaves there.
  - **From 0.2**: persistent people whose `whereIs` crosses the iris walk in or out along its path at the time-lapse's speed, solid in their walk and activity frames, through the iris's edge, a stall door or the hatch (a squadmate at the next sink who leaves at minute 7; his departure is in `skip.frame`); nobody fades, dithers or appears in place (VIEWS §5.1; the user, tradecraft 2026-10-26: "passers-by vanished mid-street", and 2026-11-04: "we still get ghosts shouting at us"; the hub: "Nobody pops in or out in view"). A room's occupancy (the mess hall's tables filling and emptying) follows PEOPLE's occupancy curve the same way. An outcome skip has no crowd agents to draw, so the crowd is never in the time-lapse.
- **The clock** of your device, including the slip: the face stops at 24:00, the `+mm` runs, then 00:00 and the sol number turns over.
- **The ticker**: one line at a time from `skip.ticker` (ambient events, activity milestones: "Water off. 06:52."; the PA; a message's sender). At most one line per 0.8 s of real time; the rest go to the log.
- Nothing beyond the iris is drawn (VIEWS inks it), so the world can be recycled and placed behind it.

### 6.4 Controls during a splash

The keys are TIME's (VIEWS draws them and lists them in its controls table, VIEWS §10):
- **To the end** (Space, Enter, a click): the engine runs the rest at once (still step by step, still checking every event) and the clock snaps, with a 0.25 s whirr, to the end or to the first interrupt. On a held strip (§6.2), the same keys close it.
- **Stop here** (Backspace): the activity is cut at the minute shown; partial outcome; landing as an interrupt by the player (no reflex). Not offered for activities you cannot leave (a class, a watch, a ride, a spinning Ring) or that would leave you unsafe (my call).
- **Menu** (Esc): opens the menu and pauses the splash. Esc is the menu everywhere, as the hub's controls have it, so it never also skips (VIEWS §5.3's Esc-to-skip is replaced).
- **One more chunk** (T at the end of a chunk): repeatable activities (read, study, socialise) end each chunk with "carry on (10 min)" offered for 1.2 s in the outcome strip; T takes it without the zoom-out (tradecraft `reading.js`: "for as long as we want … in chunks of 10min", the user, 2026-10-31).

"To the end" only moves the splash's target, which never changes the result (TECH §5.5). "Stop here" and "one more chunk" are sim commands (`skip:stop`, `skip:chunk`) applied at a known sim minute, so they replay deterministically (§14).

**As built in v0.0.4** (`src/ui/hud/splash.js`; the hud role's calls). The debug skips (the `idle` activity behind ^ and $) take the short 1.0 s lapse (`SHORT_LAPSE_S`), so six presses are not six full splashes. "To the end" in the decel or the beat goes straight to the zoom out. Backspace lands through the strip with the partial outcome. Esc opens the menu and freezes the splash. The strip offers the next chunk ("carry on (15 min) · T", R's wait being the one chunked activity this round) for `CHUNK_OFFER_S` 1.2 s; T there lets the `'splash'` pause go and queues `skip:chunk`, which the sim takes **only at the landing's clock** (`time.chunk.atMs === clock.ms`), so it must reach the first tick after the pause; the HUD then waits up to `CHUNK_WAIT_S` 1.0 s for the next chunk's `skip-start` before it zooms out. `skip-end`'s `outcome.chunk.offerMs` is the offer's 1.2 s; the chunk's length is `skip-start`'s `chunkMs`.

**As built in v0.0.6, a chain** (§8.1; `src/sim/time/chain.js` `chainStop`, `src/ui/hud/splash.js`; the build sheet 0.0.6 §8 item 12, my call). **Backspace in a chain stops after the running step**, never mid-step: the ticker's keycap reads "Backspace stop after this step" while a chain runs, then "stops after this step" once pressed; the sim moves the skip's end to the running step's end (`stopAt`, the `chain` fact's `{ phase: 'stop', toMs }`), the shown clock decelerates to it over `DECEL_S` 0.35 s, and the rest is dropped. In the shave of brush teeth, shave and wash face, Backspace at 2.5 minutes ends the chain at +6 minutes, the strip reading "✓ … 2 min. | ✓ … 4 min. | ✗ wash face: dropped.". The outcome strip lists each step's line in order, ✓ done whole, ◐ cut, ✗ dropped.

### 6.5 An interrupt during the splash

1. The engine stops at the event's second (§5.4). The clock decelerates to it over 0.35 s and holds.
2. **The beat** (0.6 s): the vignette shows the cause where it can be seen or heard from the frame: the klaxon's light turns the steam red, a hand on the rack curtain, smoke under the door, the wrist buzzing with a name. The ticker prints the interrupt's line ("General quarters. 03:12.").
3. **Zoom out** (0.5 s; 0.25 s for priority 0) to the live stage at the interrupt's time, with the world placed for that time (§5.9) and the cause materialised (§7.5).
4. If the interrupt carries a reflex, the reflex card comes up with time still (§7.5). Otherwise the instinct line says what happened and real time resumes.

**As built in v0.0.4.** An interrupted splash shows **no strip**: the decel 0.35 s, the beat 0.6 s, the zoom out 0.5 s (0.25 s at priority 0). The plaque in the beat names the cause by kind: ALARM (the klaxon), REVEILLE, THE COUNT, STAND DOWN, or the body's band word. The klaxon's landing in test-night, measured in Chrome at 60 Hz: 5.42 s (in 0.40, lapse 3.57, decel 0.33, beat 0.60, out 0.52), on 23,532,601,000 ms exactly, 02:30:00.091 on the watch. **An interrupt on the skip's planned end with no reflex** (reveille ending "sleep until reveille" at its own end) is no surprise: the decel is skipped, the lapse runs to it, then the beat, **the strip** and the zoom out, 8.30 s for test-night's night (7.82 s with no strip before the review), so the night's hunger, thirst and bladder are shown, not left to the log (my call, the review of v0.0.4).

**As built in v0.0.6, a chain** (§8.1; the build sheet 0.0.6 §8 item 12, my call): an interrupt the running step's mask lets through cuts that step at its fraction (a shower left resumable, §7.5) and drops the rest (the `chain` fact's `by: 'interrupt'`, `dropped`, and `skip-end`'s `outcome.chain`), landing as above.

### 6.6 Chapter days

A spent chapter day uses the day splash: the day's page with the clock running over 2.5 s per day (my call), the day's lines appearing as their hours pass, the interrupt landing as in §6.5. VIEWS draws the page.

---

## 7. Interrupts

### 7.1 Priorities

| Prio | Letter | Class | Kinds (sources) |
|---|---|---|---|
| 0 | **D** | danger to you, here, now | attacked or grabbed; a hostile coming into your area (COMBAT schedules the approach); explosion, breach, decompression, fire or toxic gas in your compartment (PLACES); a sudden G change while unrestrained (voyage, COMBAT); falling; your bleeding reaching a new band (BODY) |
| 1 | **A** | alarms | general quarters; base alert or stand-to; fire, decompression or radiation alarm elsewhere in the site; the "secure for maneuver" call (voyage); incoming fire warning; a solar particle event warning |
| 2 | **O** | orders and obligations | summoned by name (an NCO, an officer, a runner); your wrist alarm; your duty's relief call; a muster you are due at (if not capped); an urgent message; an unplanned muster |
| 3 | **B** | your body | a need crossing a band (bladder urgent, thirst, hunger, heat, cold), a pain spike, nausea, coming round (BODY); the dose clock at a set fraction (BODY) |
| 4 | **S** | social and world | someone comes to talk to you (PEOPLE: a beat with something to say); a knock; a visitor at your post; mail call; a message you opted to be woken for |
| 5 | (none) | ambient | the PA, the news, others talking, the lights changing, a dust front passing: ticker and log only, never an interrupt |

Two events at the same second resolve by priority, then by `seq`, the order they were posted (the queue's own order, §5.6). The lower one is dispatched after the landing if it still applies (a summons stays; a knock is moot once you are out of the shower), else it goes to the ticker and the log.

**As built in v0.0.4** (`src/sim/time/interrupts.js`: `PRIO`, `CLASS_MASKS`, `parseMask`, `stops`, `letterOf`). The sources this round: **A** the alert drill's klaxon (prio 1, kind `alert`); **O** reveille (prio 2), and the drill's count and stand-down (`alert-count`, `alert-end`, prio 2: "a muster you are due at", so a skip begun in the drill lands at each for its beat; the review of v0.0.4, my call); **B** the body's earliest interrupting crossing (prio 3, BODY §23.3); taps at prio 5, the ticker only. No D or S source exists yet; the tests post synthetic ones. Job events never stop a skip.

### 7.2 Mask notation

Each activity has a mask: the letters that stop it. Modifiers:
- `B−x`: body events stop it except need `x` (the one the activity relieves);
- `O*`: orders are held until the activity ends, then delivered (the toilet: "occupied"; my call);
- `S(w)`: social events stop it only by waking you (someone shakes you);
- `S(k)`: only a knock or someone at the door, not a message;
- `P`: the activity has its own interrupt kind (a watch: anyone approaching the post).

D and A stop every activity, always, except `out` (unconsciousness, §4.5).

### 7.3 Defaults by activity class

| Class | Mask | Why |
|---|---|---|
| hygiene, toilet | `D A O* B−x S(k)` | you finish what you're doing before you answer a summons |
| eating | `D A O B S` | anyone can sit down with you |
| sleep, nap | `D A O B S(w)` | the alarm and the summons wake you; a message does not unless you opted in |
| rest, read, study, socialise, stand by | `D A O B S` | |
| kit and weapon work | `D A O B S` | |
| PT, gym, class, drill, range, suit drill, hike (Plan of the Day blocks) | `D A O B` plus the block's beats | you're in formation: nobody pulls you out for mail |
| watch, post, duty | `D A O B P` | the approach to your post is the watch's own interrupt |
| ride, strapped in | `D A O B` | |
| chapter day | `D A O B S` plus forced moments | |

As built in v0.0.5, R's stand-by wait (15-minute chunks, v0.0.4) is not offered while stop motion is on or a range session is open (§5.3, check 1). On the line the tower's commands are O events at priority 2 (COMBAT §3.3), which end the panel's wait or hold at once.

### 7.4 Rate limits and preferences

- At most one S interrupt per skip, and three per sol; the rest go to the ticker and wait in the inbox (my call: the reflex "spam" complaint, tradecraft 2026-11-04).
- The player may mute S kinds (mail, messages, social approaches) from the wrist terminal; D, A, O and B cannot be muted.
- PEOPLE's story beats that must be lived are not S events: they are forced moments (§10.4), which the rate limit does not cut.
- **As built in v0.0.4**: `time.interrupts = { perSol, perSkip, sol }` counts the S stops, reset at a new skip and a new sol, and `time.prefs.mute` holds the muted S kinds (none can be muted until the wrist terminal). The instinct's lines obey a rule of the same kind: a line held back while time stands still is not counted as gone (SKILLS §14.3's repeat rule), so it returns at once when time runs again.

### 7.5 Landing

- **Where and how.** You land at the activity's spot, in its posture, with its partial outcome (§8): in a towel and dripping, tray half eaten, the rifle field-stripped on its mat (WEAPONS keeps the parts' state: reassembly is lived steps), boots off in the rack.
- **The cause is materialised** in the live area at the landing time: the alarm's lighting and sound state set (PLACES, VIEWS); smoke and pressure already at their stepped values; and anyone the cause brings (a runner with a summons, a hostile on its approach path) placed by §5.9's rule, never on top of you (the user, tradecraft, 2026-11-04: "police tends to spawn on top of us if we're close to their corners"):
  - while the iris is still ink (every outcome skip), the runner is placed before it opens, on his path from the entrance at the fraction walked since the event, and never inside the iris: had he already reached you, he is placed at the iris's edge on his path, walking in;
  - otherwise (a fast-forward, or a live landing), he enters only at an entrance outside the player's view cone and reach, or from behind the nearest occluder, and walks in;
  - a hostile is placed out of view at the edge of the area on its approach path (COMBAT §16.3's rule);
  - in every case `JUMP_M` holds: the renderer never interpolates the placement, so nobody streaks across the screen.
- **The reflex.** A D event may carry `reflex: { kind, dc }`. On landing the character rolls Awareness against it (COMBAT and SKILLS own the DC; asleep −4, in the shower −2 for the noise, reading −1: my call); success brings the reflex card with time still, failure lets the event land (you are grabbed, the round arrives) and play goes on at 1:1. Sleep inertia (BODY) applies on waking.
- **Resume.** If the activity can be resumed and nothing now forbids it, R offers it for the remaining duration ("Finish your shower: 7 more minutes"). **As built in v0.0.4**: a cut resumable activity leaves `time.resume = { activity, spotId, remainingMs, untilMs, outfit }` for `RESUME_MS` 10 minutes or until the player is 2 m away, and R offers "finish your shower · 7 min". **The resume keeps the outfit worn in**, so finishing the shower puts back what you wore into it, not the towel it was cut in. A part shortened by a resume or by the late card's fit keeps its whole length and what was done of it (`fullMs`, `doneMs`, `fit` on `time.doing.parts`), so its effects go by the share lived of the whole part: the water counts once across both halves (0.57 then 2.43 minutes, 3.00 in all), and a shower fitted to 138 s at the klaxon lands in a towel, cut short, with 0.43 of its water and a resume left. An activity's fraction is of its length before the fit (the fixer's calls, the review of v0.0.4).
- A state change that respects the player mid-interaction: an event that would change someone's role or place while you are talking to them waits for the conversation to close (LONGHAUL v1.12.20–21, 2026-10-31: a command ship's role vanished while the user was alongside to report).

### 7.6 Death never happens in a splash

BODY's bands put a crossing before every lethal threshold (collapse, unconsciousness, the last minute of air), and each is a D or B event. So the skip always lands before death, and death is shown live, with a reflex where any reflex could matter. If the player is unconscious, the `out` skip runs until the end comes or someone comes (§4.5).

---

## 8. The activities

### 8.1 How an activity is defined

An activity is a record in the frozen table `src/data/activities.js`, with its rules (functions, which a data module may not hold, TECH §2.4) in `src/sim/time/activities.js` under the same id. It is offered by R at its fixture ("what's at hand") or by T when the instinct suggests it. The Tab agenda lists the day's blocks with their times and places but starts nothing: a block begins at its muster point, where you walked (§5.1.2, §9.7). Chapter slots are chosen on the day card (§10.3).

**Every offer shows its price** (my call: time is a currency only if its price is on the tag), and the price follows the HUD clock rule (§3.2): the character knows how long a shower takes, but knows what time it will be only from a device they can read.
- With a readable device: the duration, the clock time it ends, and the next obligation: "Shower: 10 min, done 06:58. Formation 07:50."
- Without one: the duration and §3.4's estimate in words: "Shower: ten minutes. You'll be cutting it fine for formation."
- The instinct's warnings (§9.5) and the late card (§5.3) follow the same rule. Without a device, the late card is raised on the character's estimate (§3.4's guess, with its error), not on the true time, so it can be wrong either way (my call: "what we see is what our character evaluates as being true", the user, tradecraft, 2026-10-28).

```
// src/data/activities.js (data)
{ id: 'shower', group: 'hygiene',
  uses: ['shower'],                       // PLACES fixture uses
  duration: { rule: 'shower' },           // named rule, with its numbers, e.g. { waterMinBySite, dressMin: 6, inOutMin: 1 }
  mask: 'D A O* B−hygiene S(k)',
  resumable: true, tempos: ['normal'],    // §8.2's suit-up has ['normal', 'emergency']
  vignette: 'shower', log: 'shower' }

// src/sim/time/activities.js (rules, by id)
shower: {
  duration(ctx) → ms,                     // ctx has person, site, fixture, crowd, skills, tempo
  needs(ctx) → { ok, why },               // preconditions
  effects: { kind: 'closed' | 'perStep', apply(ctx, t0, t1) },
  partial(ctx, fraction) → outcome }      // if cut short
```

**Pace.** Routine tasks scale by SKILLS §5.12's one pace helper, `paceOf(v) = max(0.45, 1.6 / (1 + v / 16.7))`, on their base time at value 10 (v 0: ×1.60; 6: ×1.18; 10: ×1.00; 20: ×0.73; the floor ×0.45 from about 43): one quantity, one helper (the hub). This section's draft curve, `chorePace(v) = clamp(1.3 − 0.025 × v, 0.7, 1.3)`, anchored at value 12, is withdrawn, as SKILLS §5.12 and BODY ask. Weapon handling steps use WEAPONS' steps on the same helper.

**Where it is done.** Only at a fixture with the use (PLACES' catalogue, extending tradecraft's `furniture.js` uses: `sleep`, `eat`, `wash`, `toilet`, `shower`, `clean-weapon`, `suit-locker`, `centrifuge`, `read`, `desk`…), at its spot, after walking there.

**Lived, fast-forwarded or skipped.** Up to `LIVE_MAX_S` 10 s an action is lived at 1:1 as a busy plan (tradecraft `acts.js`; the user, 2026-11-07, of the 30 s hand wash lived: "I'm okay with no time skip for actions taking up to 10s"). Over 10 s and under 120 s it is a fast-forward with a brief splash, or in a crowded area an outcome skip with the brief, inked splash (§5.2). From 120 s up it is an outcome skip, brief under 3 minutes, full from 3 minutes.

**As built in v0.0.4** (`src/data/activities.js`, its rules by id in `src/sim/time/activities.js`). A record is `{ id, class, uses, offer, mask, parts, resumable, stoppable, chunkMs, vignette, min, log }`: `class` gives the mask's default (§7.3), `offer` the word R's price opens with, `parts` the activity in order (each with its length or the rule that gives it, its MET at 1 G, its posture, and whether the figure is `inside` its stall, `wet`, in an `outfit` or lying with intent to sleep), `min` the shortest the late card may fit it to, `log` at least four lines in §8.8's voice picked by hash. Each part's end but the last is posted as an `activity-part` event (prio 5) at the first whole second at or after it, so lived and skipped read the same boundaries. A lived activity holds the feet, and a move key cuts it at its share. **The price** is the watch's: "shower · 10 min, done 19:40"; ", the count 02:35" while a drill is open; in the slip "done 24:00 +12", as the watch shows it. R offers what is at hand (VIEWS §7.1, §10.1): lying or sitting, get up; a free activity spot within `SPOT_REACH_M` 0.6 m; a door; the resume; the wait. Held, R opens the choices (the rack's sleep and naps, the sink's basin and drink). A part shortened by a fit or a resume keeps its whole length, and the activity's fraction is of its length before the fit (§7.5). The debug skips (^ and $) are the `idle` activity, an outcome skip with mask `D A`, so a drill drawn into the gap stops one and reveille does not.

**As built in v0.0.6: single actions, struck rows, and the chain** (`src/data/activities.js` `ROWS`, `PRIORITY`; `src/sim/time/activities.js` `offOf`, `priceOf`, `planOf`; new `src/sim/time/chain.js`; `src/sim/places/hand.js`; the build sheet 0.0.6 §2.1, §8 items 2 to 15; the user, 2026-11-06: "implement ways of combining actions and quick action needs to be the most obvious ... long pressing R should open the menu with all the possible interractions as single actions, with the ability to select several actions (not pre-combined actions like you do now that make lists hard to read)").
- **Every spot offers single actions only**, one activity of one part each but the shower's (in, water, dress: one action), in `ROWS`' order, the order one does them in: a sink wash hands, brush teeth, shave, buzz your head, wash face, drink (§8.2); a toilet stall a stall, then the head; your rack's foot dress, sleep, nap (in a drill dress, stand fast, sleep, nap), dressing first so a chain dresses before sleeping (the build sheet's table had it last; the actions role's call, kept); the barber's pole a haircut; a locker dress; a tap or a fountain a drink; a machine a bar or a drink. R tapped does one of them, chosen by `PRIORITY` (VIEWS §10.1); R held lists them all (VIEWS §8.10). The two bundles found in review, v0.0.4's `basin` and sleep's turn-in, stay in the table marked `legacy` and are never offered nor planned, so a v0.0.5 save made inside one finishes as it would have.
- **The price** (`priceOf`) says ", done HH:MM" only from `DONE_FROM_MS` 60 s (my call, 2026-11-07: it was tied to the 45 s line; under a minute the time it lands is a minute's rounding of nothing): "wash hands · 30 s", and a longer one says when it lands ("shave · 4 min, done 20:06"); ", the count 02:35" while a drill's count is to come.
- **A struck action** (`offOf(state, id, spot, args, { atMs, wearing, bladderMl })`) is shown with its reason and never done, and **`startActivity` itself refuses it with the same words**, sleep past reveille included (the sim, not only R's offers): "clean-shaven" (a shave under 12 h of stubble), "buzzed today" (the clippers within a sol of the cut) and "freshly buzzed" (a shaved head at `hairOf`'s step 0 past a sol), "fresh from the barber" (a haircut at step 0), "nothing to give" (the head at 50 mL or less), "already in PT kit" or "already in utilities", "reveille comes first" (a sleep or a nap that would run past the next reveille, or reveille under 20 minutes away), "reveille is over 12 h off" ("until reveille" where its plan, capped at 12 h, would end before reveille), "the barber opens at 10:00" and "the barber shut at 20:00" (`BARBER_H`), "not your cut" (a cut `cutsFor` does not allow), "taken" (someone within `FIXTURE_FREE_M` 0.5 m of the spot). A late row is not struck: it goes through the late card.
- **An activity's log record carries `activity: id`**, so a reader knows what ended and when (the DI's hands rule reads it, SKILLS §14.4).
- **The chain** (§8 items 10 to 14, each my call): several single actions checked in the R menu at one fixture run one after another behind **one splash, one skip over their total**. `planChain(state, { spotId, steps })` plans each step from the end of the one before, with the outfit and the bladder the steps before leave (`planOf`'s `fromMs` and `wearing`, `offOf`'s `bladderMl`: a stall then the head is refused "nothing to give", as the head alone would be after it; the fixer's), every step's end but the last on its first whole second; it gives the menu's foot ("brush teeth, shave, wash face · 7 min, done 20:08"), the kind by the total (§5.2) and the late check on the whole. `startChain(state, bus, ctx, { spotId, steps, late, force })` runs §5.3's checks once, writes `time.chain` (TECH §6.1), begins step 0 as `startActivity` would and one skip, and posts **`chain-next`** (prio 5, src `time:chain`) at the step's end; `onChainNext` ends step i (its own effects, log line and `activity` end) and begins step i + 1 at the same millisecond, in every engine, so lived, fast-forwarded and skipped meet the same boundaries to the millisecond (bodies within 0.0015 kcal); the running step's mask is the skip's. `chainStop` is Backspace's (§6.4), `chainNow(state, ms)` the splash's view. **A chain runs in the menu's row order**, not the order checked; **uses one fixture**; **never leads** (a sleep in a chain lies you in the berth behind the splash, v0.0.4's way); a step refused at its start ends the chain there (`by: 'refused'`). **A chain of one row is sent as the single action**, with its lead. Brush teeth, shave and wash face checked at 20:02: one 4.07 s splash for 7.01 minutes, three log lines, three ✓ in the strip, and one toast for the errand ("Brush teeth, shave, wash face · 7 min."; the fixer's: a toast a step had read as three errands). A save made mid-chain carries on byte for byte (in node, 10 skipped and 91 fast-forwarded; in the page). The facts: `chain` (new), `activity`'s `chain { i, n }`, `skip-start`'s `chain { steps, n }`, `skip-end`'s `outcome.chain` (CONTRACTS §11).

### 8.2 Hygiene and the body

| Activity | Where | Duration rule | What it changes (owner) | Mask | If cut short |
|---|---|---|---|---|---|
| `urinate` | head (urinal, stall), field (off any path, 15 m from water) | 75 s (from v0.0.6 the hands are not washed: the sink's `wash-hands` does that, and the head soils them, BODY §6) | bladder emptied (BODY) | `D A O* S(k)` | bladder emptied by the fraction |
| `bowel` | head stall, field cathole | 6 min, + 2 min if BODY flags constipation or illness | bowel emptied (BODY) | `D A O* S(k)` | unfinished: the need stays, urgent again in 20 min |
| `shower` | shower stall | water `WATER_MIN` by site (Melas 3 min, ship 2 min, Europa 1.5 min: PLACES may change) + 6 min dry and dress + 1 min in and out | hygiene to clean, dust and sweat off, skin cooled, hair wet for 20 min (BODY, VIEWS); water `WATER_MIN × 6 L/min` from the site's budget (PLACES) | `D A O* B−hygiene S(k)` | hygiene by water minutes done; before dressing you land in a towel (dressing then 6 min) |
| `basin` (v0.0.4 and v0.0.5; from v0.0.6 split into single actions, below, and kept `legacy`, never offered) | sink | teeth 2 min + shave 4 min if stubble shows (BODY, VIEWS) + face and hands 1 min | oral hygiene, shave state for inspection | `D A O* S(k)` | done parts only |
| `dress` | rack, locker | PT kit 2 min; utilities 4 min; service uniform 8 min; field kit (load-bearing gear, helmet) +3 min; undressing at 60% of it | what you wear (VIEWS, BODY) | `D A O B S` | half-dressed, as far as you got |
| `suit-up` | suit locker, or the suit at your couch | **normal tempo**: 8 min with a buddy check (2 min of it), 11 min alone, at EVA 10 (BODY §19 owns the steps and their sums); × `paceOf(EVA)`. **Emergency tempo** (general quarters, a breach or decompression alarm, an order to suit up now): 120 s at EVA pace, helmet on and visor up, then a 20 s buddy check that is rolled (COMBAT §13.2's numbers; EVA against SKILLS' DC, rushed). A failed check leaves a seal unchecked, which BODY's leak hazard reads | sealed suit, consumables clock starts (BODY) | `D A O B` (emergency: `D A O* B`: orders wait until you are sealed; it answers the alarm, so §5.1.6 allows it) | unsealed: the suit counts as off |
| `suit-down` | suit locker | 5 min, + 10 min servicing if it was used outside | suit stowed or serviced (BODY) | `D A O B S` | |

A US Navy shower runs the water about two minutes; at 6 L/min (a low-flow head) Melas' three minutes use 18 L (my call; PLACES sets each site's water rule). Which tempo applies is the caller's: the alarm or the order says "now", and the activity then takes its emergency tempo; otherwise normal. The emergency tempo exists only where a section gives it numbers (suit-up here; COMBAT and PLACES may add others), and from v0.0.4 dressing into utilities while an alert drill is open: `DRESS_HURRY_K` 0.5 of the normal (my call, the review of v0.0.4: the scramble had no tension), 2.6 minutes from PT kit, a brief splash with the watch running; the squad dresses as fast.

**As built in v0.0.4**, at Melas: `urinate` 75 s flat at a urinal or a toilet stall (BODY §5.1's flow rule waits), offered only while the bladder holds more than `URINATE_MIN_ML` 50 mL, a brief fast-forward; `bowel` 6 minutes at a stall, seated, an outcome skip; `shower` 1 minute in, `WATER_MIN` 3 of water ("Water off."), 6 to dry and dress in a towel, 10 minutes in all, the dress part putting back the outfit worn in; `basin` teeth 2 + a shave 4 once stubble shows (12 h) on a face that grows it (BODY §6) + face 1, so 3 or 7 minutes; `dress` at your own locker or your own rack's foot, `0.6 × DRESS_MIN[from] + DRESS_MIN[to]` (`DRESS_MIN` PT kit 2, utilities 4, a towel 0): PT kit to utilities 5.2 minutes, back 4.4, a towel to utilities 4.0, half that into utilities in an open drill. **The morning routine is withdrawn this round** (my call, the review of v0.0.4: it had you urinating at a sink and hid your figure in place for the stall's six minutes): a sink offers the basin and a drink, the urinal and the stall their own.

**As built in v0.0.6: the basin's bundle is six single actions, and the head no longer washes your hands** (`src/data/activities.js`; the build sheet 0.0.6 §2.1, §8 items 2, 8, 9; the user, 2026-11-06: "first of all using the head shouldn't wash our hands either afterwards"). At a sink, each its own row, its own log lines (at least four in §8.8's voice: "Soap, a scrub, a rinse: 30 s.", "A clean scrape: 4 min. An inspection would find nothing.") and its own end:

| Activity | Offer | Length | What it changes (BODY's doors) | Notes |
|---|---|---|---|---|
| `wash-hands` | wash hands | 30 s (`WASH_HANDS_MS`; my call: the CDC's five steps round a 20 s scrub), lived | the hands to 0 (`groom` `hands`) | the tap's sound runs |
| `teeth` | brush teeth | 2 min (`BASIN_MIN.teeth`) | oral hygiene | |
| `shave` | shave | 4 min (`BASIN_MIN.shave`) | stubble to 0 | a face that grows a beard only; struck "clean-shaven" under 12 h |
| `clip` | buzz your head | 10 min (`CLIP_MIN`; my call: a guardless pass by feel) | the hair's hours to 0 (`groom` `clip`) | a shaved head only; reuses the shave's frame; the clippers hum |
| `wash-face` | wash face | 1 min (`BASIN_MIN.face`) | grime × `FACE_K` 0.9, the hands untouched | |
| `drink` | drink | 30 s, 0.5 L | water | as v0.0.5 |
| `haircut` | haircut (your cut) | 12 min (`HAIRCUT_MIN`; my call: the chair, no queue), seated inside the PX, `BARBER_H` 10:00 to 20:00 | `cutHair`: the hours to 0, the cut set where it changed | at the barber's pole (PLACES §4.13); not resumable |

Every mask is `D A O* S(k)` but the drink's (none). **`urinate`'s `go` part soils the hands** (+40, BODY §6) and its offer is now **"use the head"**, its noun "the head" (the fixer's: "R THE HEAD" had read as a noun); a stall's `sit` +60; the shower's water washes them. **A haircut or a buzz cut short changes nothing**, and the barber's haircut cannot be resumed (my call). A woman's sink has no shave row, a man's no clip row unless his head is shaved.

### 8.3 Food and drink

| Activity | Where | Duration rule | What it changes | Mask | If cut short |
|---|---|---|---|---|---|
| `chow` | mess hall line, then a seat | queue `ahead × 20 s` (ahead from the line model at that minute: PEOPLE occupancy, PLACES mess) + eating by choice (quick 10 min, normal 15, slow 25) + 1 min to bus the tray; the line closes 10 min before the window ends | hunger reset, water with the meal 0.5 L, energy (BODY); who you sat with (PEOPLE: contact, gossip) | `D A O B S` | intake by the fraction of eating done |
| `ration` | any seat, in the field | 15 min (the heater's 8 min overlapped) | a field ration's intake (BODY); one ration used | `D A O B S` | by fraction |
| `snack` | PX counter, café | 5 min | a snack's intake; money (CAREER) | `D A O B S` | |
| `drink` | anywhere, from a canteen | lived: 6 s a pull (0.25 L) | water (BODY) | | |
| `refill` | a tap, a water point | lived: 30 s | canteen full; site water (PLACES) | | |

**As built in v0.0.4** (the build sheet's §8 item 15; my calls until the kit and the mess come): `drink` at a sink's tap, a hallway's drinking fountain (`waterFountain`, PLACES §4.4) or a lounge's drink machine (`vending` make `drink`), 30 s lived, 0.5 L (BODY §4.1); `snack` at the mail room's machine (`vending` make `snack`), 30 s lived, a 250 kcal bar (BODY §3.5); both free until CAREER's money, both cut by a move key at their share. No canteen until the kit (0.0.6 on); the mess hall's `chow` at 0.0.9.

### 8.4 Sleep and rest

| Activity | Where | Duration rule | What it changes | Mask | If cut short |
|---|---|---|---|---|---|
| `sleep` | rack, bunk, couch (under thrust, a couch only above 1.5 G), sleeping mat in the field | until the first of: your wrist alarm, a duty wake, natural waking (BODY: sleep pressure and circadian phase); at least 20 min | sleep debt, circadian phase (BODY); needs run on in closed form, so you wake thirsty | `D A O B S(w)` | sleep accrued to the minute, plus sleep inertia (BODY) |
| `nap` | as sleep, or a seat (doze) | 20, 45 or 90 min | as sleep | `D A O B S(w)` | as sleep |
| `rest` | rack, couch, a bench | 30 min | stress down (BODY); no sleep | `D A O B S` | by fraction |
| `standfast` (v0.0.4) | your own rack's foot, mustered in utilities while an alert drill is open | until the drill's stand-down | nothing but the muster held (§9.5); class `rest` | `D A O B` | stood fast so far |

A standard night at Melas, taps 22:00 to reveille 05:30, is 7 h 30 m on the clock and 8 h 9.6 m of sleep, because the slip falls inside it.

**As built in v0.0.4.** `sleep` at your own rack's foot: a turn-in part (dressing to PT kit, if not in it), then lying until reveille (the next `reveille` event) or 1, 2, 4 or 8 hours, at least 20 minutes and at most 12 h (BODY's); "sleep until reveille" from 21:55 is 8 h 14 m 35 s and 7.68 s of splash. **No sleep is offered past reveille, nor one that would not end on it** (the review of v0.0.4: at 05:29 the rack had offered "· 12 h 4 min"): within about 24 minutes of reveille (a turn-in and the 20-minute least) the rack offers none, and at 21:55 the 8-hour one is offered only if it ends by 05:30. `nap` 20, 45 or 90 minutes, no turn-in; R's default at your rack's foot is "sleep until reveille" from 20:00 to 05:30, a 45-minute nap otherwise, dressing into utilities while a drill is open and you are not in them, and **"stand fast · until the stand-down"** once mustered (my call, the review of v0.0.4: it had offered sleep, and the scene's only way to its end was 25 real minutes standing). Lying, a move key, R or T gets you up first (a 4.0 s rise at the klaxon and a training sol's reveille, 4.8 s when nothing hurries, PEOPLE §4.6; 2.5 s in v0.0.4). **From v0.0.5, R at your rack's foot lies you down in sight first** (the user, 2026-11-06, of v0.0.4's test-night: "slightly slower animations on getting in and out of rack"; v0.0.4 put you in the berth on the splash's first frame), for a sleep or a nap that begins lying (no turn-in): you lie down in sight (`people/place.js` `lieActor`, 4.8 s), the activity waiting in `time.lead { id, spotId, args, atMs, late?, force? }` and begun from the berth by the time domain's input layer once you are down (`leadStep`). A move key before then drops the lead and gets you up again from the frame shown (`people/place.js` `backActor`): the same frames play backwards, you end standing where you stood, and nothing begins. The instinct's rule `lead` says "Into the rack." meanwhile. A sleep for a set time becomes "until" its planned end, so it ends where its price said, and a save made half-way down carries on byte for byte. If the start is refused then (the klaxon came while you lay down: sleep in a drill is late), you lie awake in your berth with the alarm's line. The page's R, the choices and the late card, and T send `lead: true`; a bot's or a test's action without it begins at once, as v0.0.4 did. A sleep with a turn-in (out of PT kit) still puts you in the berth behind the iris. In `test-night` the night's splash now begins 4.80 s after R and still lands on 23,532,601,000. R twice away from any fixture is TIME's `stand-by` (§8.7) as `wait`: 15 minutes, mask `D A O B S`, in 15-minute chunks with "carry on" (§6.4), so reveille and the klaxon stop it.

**As built in v0.0.6: you sleep in what you wear** (the build sheet 0.0.6 §8 item 6, my call: the turn-in was a bundle). `sleep` and `nap` no longer change your clothes: the turn-in part stays in the table marked `legacy`, never planned, so a v0.0.5 save made inside it finishes. **Dressing is its own row, first at your rack's foot** (dress, sleep, nap), and R held chains "dress (PT kit), sleep until reveille" behind one splash (a chain never leads, so you are laid in the berth behind it); on seed 48213's first night that chain lands at the 02:57 klaxon, in PT kit, lying, "R GET UP" on the line. **R's sleep always begins lying**, so from utilities too the page lies you down in sight first (4.8 s from a lower berth); the `splash-sleep` bench's wait grows from 9 to 14 s for it. A sleep or a nap that would run past reveille is refused by `startActivity` itself ("reveille comes first"), and "until reveille" is struck "reveille is over 12 h off" where its plan, capped at 12 h, would end before reveille. `moment-night` (already in PT kit) is unchanged.

### 8.5 Weapons, kit and the barracks

| Activity | Where | Duration rule | What it changes | Mask | If cut short |
|---|---|---|---|---|---|
| `clean-rifle` | cleaning bench, footlocker, armoury cleaning area | 30 min at Weapon handling 10 × `paceOf(Weapon handling)` × dirt (1.0 lightly used, 1.3 after a range day, 1.6 after dust or a field day, 2.0 after a dust storm: WEAPONS sets dirt); strip, clean, oil, reassemble, function check | condition, dust cleared, lubrication, "you know it's empty" (WEAPONS) | `D A O B S` | the rifle stays field-stripped on the mat; reassembly lived (WEAPONS steps) |
| `clean-pistol` | as above | 15 min × pace × dirt | as above | `D A O B S` | as above |
| `load-mags` | any seat | 2.2 s a round × WEAPONS pace (tradecraft `firearms.js`); lived up to 10 s | rounds into magazines, the accountability record (WEAPONS) | `D A O B S` | rounds loaded so far |
| `armoury-line` | the armoury window queue | `ahead × 40 s`; the transaction at the window is lived (serials, signature: 30–60 s of talk) | weapon drawn or returned (WEAPONS) | `D A O B S` | still in line |
| `kit` | rack, footlocker | 30 min | kit and uniform condition for inspection (CAREER, PEOPLE) | `D A O B S` | by fraction |
| `laundry` | laundry room | lived: load 40 s; the machine then runs 50 min as a world timer while you do other things; lived: collect 40 s; skipped: fold and stow 5 min | clean uniforms (BODY hygiene of clothes, VIEWS) | | the machine finishes without you; uncollected laundry is a story |
| `barber` | base barber at the PX | queue `ahead × 10 min` + 10 min in the chair | haircut state for inspection (VIEWS, PEOPLE) | `D A O B S` | |
| `suit-service` | suit station | 20 min: scrubber canister, O₂ top-up, seals | suit condition and consumables (BODY) | `D A O B S` | parts done |
| `field-day` | squad bay (a Plan of the Day block: Thursday's maintenance, §9.2) | 120 min | the bay's state for inspection (PEOPLE) | block | |

### 8.6 Training (usually Plan of the Day blocks, §9)

| Activity | Where | Duration rule | What it changes | Mask |
|---|---|---|---|---|
| `pt` | from the Wheel's join, the Wheel's lane and halls at 1 G (PLACES §4.15), every training sol; until then the valley track and the field house at 0.38 G | 60 min | fitness load, fatigue, sweat, thirst (BODY); standing (PEOPLE); by stance (§9.3) | block |
| `gym` | gym | 45, 60 or 90 min; one hard session per 18 h (tradecraft `WORKOUT_GAP_H`; BODY §7.3 greys it after PT) | fitness load (BODY) | `D A O B S` |
| `centrifuge` | the G-house's Ring (PLACES §4.9): a scheduled session only, as a block or a booked evening seat (§8.9); the doors lock while it spins, so it cannot be dropped into or left | 6 min spin-up seated + the session at the prescribed G (**at least 45 min**, so that it counts as the day's G stimulus, BODY §14.1: 45, 60 or 120 min; the conditioning block is 120 min) + 6 min spin-down seated (PLACES §4.9) | G-conditioning, Coriolis lurch and nausea (BODY); laps, weights or study inside at 1 G | `D A O* B` (orders wait for the spin-down; on D or A the operator stops the train, which still takes PLACES's spin-down, and you land live in your car, seated); "stop here" not offered |
| `long-arm` | the G-house's Long Arm (PLACES §4.9), by appointment | the physiologist's brief 5 min (lived), the profile (lived, BODY §13: every second of it matters), recovery 10 min | the G-qualification class (CAREER §7.3), acute G (BODY) | `D A O B` |
| `range` | rifle range | the block's length; relays lived or skipped one by one | qualification, ammunition accountability (WEAPONS) | block |
| `class` | classroom | N periods of 50 min with 10-min breaks (military practice) | training hours (SKILLS); boredom and fatigue (BODY) | block |
| `drill` | parade deck | 60 min | standing (PEOPLE) | block |
| `cqc-training` | the mat | 90 min; sparring bouts lived if you choose | CQC hours (SKILLS) | block |
| `suit-drill` | the drill airlock | 90 min; the first time lived (CAREER) | EVA hours (SKILLS), suit time (BODY) | block |
| `hike` | the valley road | route length ÷ march pace (BODY: load and 0.38 G) with 10 min rest per hour ("50/10", US Army FM 21-18) | fitness load, water, heat, feet (BODY) | block |
| `study` | any seat with reading light (PLACES, VIEWS) | 10-min chunks, repeated until stopped | training hours in the manual's skill (SKILLS) | `D A O B S` |
| `read` | as study | 10-min chunks | stress down (BODY); a book's skill if it has one (SKILLS) | `D A O B S` |

Training credit for a skipped block is the same as for a lived one (time is the currency: SKILLS §6.3 counts hours either way), at the stance the player chose (§9.3): carrying on keeps the price of effort, and living keeps the moment-to-moment choices and the story, the moments where your decisions or a squadmate's trouble change the outcome (§9.4).

**A G-house block, worked** (the G-qualification's Ring stint on the standby's Friday afternoon, career sol 4's `train-b`: CAREER §5.4, CONTRACTS §3): the 12:40 formation marches to the G-house (PLACES §4.3: 514 m, 7.5 min at BODY's 1.14 m/s walk on Mars), 12:48; boarding 5 min, 12:53; spin-up 6 min, 12:59; CAREER §7.3's 2 h stint at 1 G to 14:59; spin-down 6 min, 15:05; then the Long Arm by appointment (brief, profile, recovery: about 25 min) until about 15:30. Train-b (12:45–16:30) therefore holds **the 2 h stint with the Long Arm after it**, with about an hour left for the march back to `maintenance`; at most it holds 3 h at 1 G with the Long Arm, or 3 h 25 min without, and train-a (08:00–11:30) about 3 h 15 min. A single-seat Long Arm qualifies a platoon over several sols, by appointment; the player's run is the one on the stage.

### 8.7 Duty, social, medical, transport

| Activity | Where | Duration rule | What it changes | Mask |
|---|---|---|---|---|
| `watch` | the post (fire watch in the barracks, a sentry post, the guard shack, the CQ desk) | the roster's shift: fire watch 2 h, guard 4 h, CQ in 2-h blocks (PEOPLE) | duty done, fatigue; the watch log; asleep-on-post check if fatigue is high (BODY, SKILLS: a failure is a big beat, §9.4) | `D A O B P` |
| `working-party`, `mess-duty` | as ordered | 2–4 h | standing, fatigue, hygiene (PEOPLE, BODY) | block |
| `stand-by` | the muster point of your next obligation, a ride's stop, a waiting room | until its muster time (or a time you pick before it) | contact with whoever stands by with you (PEOPLE) | `D A O B S` |
| `socialise` | rec room, mess off-hours, PX café, squad bay, a bar on liberty | 30, 60 or 90 min with the people you pick | gauges, memories, gossip, stress (PEOPLE, BODY); money if a bar | `D A O B S` |
| `letter` | any seat | 20 min to write or record | the message sent with light lag (§11.5, CAREER) | `D A O B S` |
| `read-mail` | wrist, terminal | 3 min a message | morale (CAREER, BODY) | `D A O B S` |
| `call` | a terminal on Mars only (light lag under 1 s) | 15 or 30 min | family contact (CAREER) | `D A O B S` |
| `px` | PX counter | 2 min (browsing is lived) | purchase, money (CAREER) | `D A O B S` |
| `briefing`, `counselling` | as called | the event's length, 10–60 min | as the event says (CAREER, PEOPLE) | `D A O B` |
| `sick-call` | battalion aid station, sick bay | wait `ahead × 12 min` + exam 10 min; treatment by BODY | diagnosis and care (BODY) | `D A O B` |
| `sick-bay` | a bed | hours by BODY; past a day it becomes a chapter (§10) | healing (BODY) | `D A O B S` |
| `ride` | a seat in a bus, rover, rail car or shuttle | the route's time (PLACES timetables, §12.6); boarding and getting off lived | position (the vehicle carries you), dust and heat outside (BODY) | `D A O B` |
| `strapped-in` | an acceleration couch | until the next maneuver, lock or the end of the secure order (§12.4) | G exposure, juice (BODY) | `D A O B` |

### 8.8 Splash vignettes and log lines

The log voice is the house voice: dry, specific, numbers where they matter (tradecraft "text carries it"). `{dur}` is the duration in words under an hour, `formatDuration` above; other placeholders are filled from the outcome. Each line is picked from several by cosmetic hash (`hash(activity, personId, floor(ms / 12 s))`, tradecraft `acts.js say1()`), so the log reads varied and moves no dice; one example each:

| Activity | Vignette (VIEWS draws) | Log line |
|---|---|---|
| `urinate` | the urinal row, the water-saver light, your back | "The head. A minute and change." |
| `bowel` | the stall door, boots under it, the recycler's hum | "A stall and the recycler's hum: {dur}." |
| `shower` | steam, the timer light counting your water, red dust running off | "Three minutes of water and the dust off your neck: {dur}, dressed." |
| `basin` | the mirror, foam, the razor | "Teeth, a shave, cold water: {dur}." |
| `dress` | the open locker, boots being laced | "Utilities on, boots laced: {dur}." |
| `suit-up` | the suit locker, a buddy tugging your seals, the HUD booting | "Suited and sealed, checked by {buddy}: {dur}." |
| `chow` | the tray, steam off the line, the hall's noise | "Chow: {dish}. {dur}, {queue} of it in line." |
| `ration` | the pouch on your knee, the heater's hiss | "A ration on your knee: {dur}." |
| `sleep` | the rack's curtain, the red night light, breathing | "Rack at {from}. Up at {to}{slip}: {dur}." ({slip} = ", through the slip" if crossed) |
| `nap` | the curtain edge bright with day | "{dur} with your boots on." |
| `rest` | the slats of the rack above | "Half an hour on your back." |
| `clean-rifle` | parts on the mat, the bore light, solvent | "Rifle stripped, cleaned, oiled, back together: {dur}. The armourer will still find something." |
| `load-mags` | rounds pressed in one by one | "{n} magazines, {rounds} rounds: {dur}, sore thumbs." |
| `armoury-line` | the window grille, the backs ahead | "{dur} in the armoury line." |
| `kit` | polish, gear laid out on the rack | "Boots, belt, the uniform squared away: {dur}." |
| `barber` | the clippers, hair on the cape | "High and tight: {dur} in the chair." |
| `suit-service` | the scrubber canister, the O₂ gauge | "Suit serviced: new canister, seals greased, {dur}." |
| `field-day` | mops, the deck shining | "Field day: two hours, and a deck you could eat off." |
| `pt` | boots on the lane, the cadence; before the Wheel, the track and the red dust | "PT: {km} km under {g} G, the platoon in step. An hour." ({g} is the place's: 1.00 in the Wheel, 0.38 on the track) |
| `gym` | the bar, plates, the mirror | "{dur} in the gym." |
| `centrifuge` | the Ring's car, its floor swung square to the weight, the hum, the G meter at {g} | "The Ring: {dur} at {g} G. Your knees know." |
| `long-arm` | the gondola's hatch, the physiologist's console, the grey edge of vision | "The Long Arm: {profile}. {result}." |
| `range` | the firing line, brass in the dust | "Range: {hits} of {rounds} in the black." |
| `class` | the screen, the instructor's back, heavy eyelids | "Class: {periods} periods of {subject}. You took notes on most of it." |
| `drill` | the parade deck in step | "Close-order drill: an hour of left, right." |
| `cqc-training` | the mat, the instructor's whistle | "Ninety minutes on the mat." |
| `suit-drill` | the lock's light going green | "Suit drill: {cycles} times through the lock." |
| `hike` | the valley road, packs, the canyon wall | "{km} kilometres in {dur}, on the 50/10." |
| `study`, `read` | the page under the reading light | "Ten minutes of {title}." |
| `letter` | your face in the wrist's camera | "A message home, {dur}. It'll be there when it gets there." |
| `read-mail` | the screen | "Mail: {n} messages." |
| `call` | a face on the screen | "{dur} on the line to {who}." |
| `socialise` | cards on a footlocker, laughter | "{dur} of {what} with {who}. {result}." |
| `stand-by` | the muster point, people waiting | "Hurry up and wait: {dur}." |
| `watch` | the post, the logbook, the wall clock | "{post} {from} to {to}. Rounds on the half hour. {incident or 'Nothing.'}" |
| `working-party` | crates, a forklift | "Working party: {dur} of crates." |
| `mess-duty` | the scullery's steam | "Mess duty: the trays, the steam, {dur}." |
| `sick-call` | the waiting bench | "Sick call: {wait} on the bench, ten minutes with the corpsman." |
| `ride` | the window, dust, the seat back | "The {vehicle} to {place}: {dur} of {view}." |
| `strapped-in` | the couch, the G meter, the hull's hum | "Strapped in, {dur}." |
| `px` | the counter | "PX: {dur} and {price} MCR." |
| `briefing` | the screen, the map | "Briefing: {dur}." |
| `hip-pocket` | an NCO at the end of the racks, a whiteboard on a locker | "{nco}'s hip-pocket class on {subject}: {dur}." |
| `drill-rounds` | orange dummy rounds, the magazine, the rifle on your knees | "Drill rounds: {n} reloads and {m} stoppages, {dur}." |
| `bounding` | the league's pitch, red dust, long low strides | "Bounding league: {result}, {dur}, and dust in your teeth." |

### 8.9 Free time that pays

"The free time is the game" (§17) only if it holds things worth the price. On a training sol the gym is greyed after PT (BODY §7.3), a manual teaches only to base 6 (SKILLS §6.3), ammunition is issued by count at organised ranges (WEAPONS), and liberty in the first standby is the base. So these free-time activities exist from 0.1, each offered with its price and its return on the tag (§8.1), each with its owner for the numbers (my call on the list):

| Activity | Where, when | Price | Return (owner) | Mask |
|---|---|---|---|---|
| `hip-pocket` class | the squad bay, evenings, when an NCO offers one (PEOPLE: the squad leader's or a fire team leader's choice, a hashed evening or two a week) | 30 or 60 min | instruction hours in the subject at a unit block's cap, `min(12, teacher − 2)` (SKILLS §6.3), and the NCO's regard (PEOPLE) | `D A O B S` |
| `drill-rounds` | your rack or the bay's cleaning table, with dummy rounds from the platoon's drill box | 30 min | Weapon handling hours (SKILLS §6.4's "weapons drill" row, pro rata) and one rust session kept (SKILLS §7) | `D A O B S` |
| `bounding` (the base's low-g bounding league) and pick-up games | the field house or the parade deck, evenings and rest sols | 60 or 90 min | fitness load (BODY §15), stress down, gauges with whoever plays (PEOPLE); not a hard session unless you push | `D A O B S` |
| a `centrifuge` evening seat | the Ring, booked at the G-house desk a sol ahead, 19:00 or 20:00 (PLACES §4.9: 60 seats a session); **no longer a routine choice from the Wheel's join** (2026-11-08: a training sol is already about 8.7 h at 1 G and the evening needs no Ring seat, BODY §14.1), kept for 1.2 and 1.5 G conditioning and the remedial programme, and for the standby before the Wheel joins | 6 + 60 + 6 min, plus the 7.5 min walk | the day's G stimulus at 1 G (BODY §14.1: at least 45 min); study or weights inside | `D A O* B` |
| `call` home from the comm booth | the comm booths (PEOPLE §4.5), to Mars only (light lag under 1 s) | 15 or 30 min, a queue in the evening | family ties and morale (CAREER §14) | `D A O B S` |
| an MCI correspondence course | any seat with a reading light, in 10-minute chunks | 6 to 12 h in all (CAREER §8.3) | 15 composite points a course, at most 75 (CAREER §8.3): surfaced as an offer on the terminal so that the player knows it exists | `D A O B S` |
| mentoring a struggling boot | wherever they are, when PEOPLE's "screw-up" arc runs (PEOPLE §15.3) | 30 to 60 min, evenings | your instruction gives them hours (SKILLS), the arc's lever, gauges (PEOPLE) | `D A O B S` |
| volunteering for a duty | the duty NCO's desk | the duty's hours (§8.7, §9.6) | conduct +1 (CAREER §6.1) and a marker with whoever you relieved (PEOPLE §8.6) | as the duty |

Each is an ordinary activity under §8.1 and §5: walked to, skipped behind its splash or lived, interruptible.

## 9. The Plan of the Day

The Plan of the Day (PoD) is a real Marine Corps document: the unit's schedule for tomorrow, posted the evening before. In OLYMPUS it is the time structure of every sol on base and every ship's day with troops embarked. **§9.2 is the one PoD table**. CONTRACTS §4 carries its times for citation, changed in the same change as this table. CAREER, BODY, PEOPLE, PLACES and ROADMAP cite its times and never restate them. PEOPLE fills its content and rosters (its templates reference block ids, never clock times, PEOPLE §4.1); CAREER says which block kind fills which weekday's slots by phase (the standby's lessons, CAREER §5.4); this section settles its shape, its times and how time moves through it.

### 9.1 Data

```
pod = {
  unitId: '2/4-E-2-1', site: 'melas', locale: { kind: 'mars', lonE: 287.2 },
  day: 169905,                         // the local day's index (§11.3): the sol on Mars, the UTC day aboard
  weekday: 1,                          // 0 = Monday (SETTING §3.4); picks the row of §9.2's week
  publishedMs,                         // 20:00 local the evening before
  routine: 'training' | 'holiday' | 'field' | 'standby-alert',
  blocks: [ {
    id: 'pt', kind: 'pt',              // ids as PEOPLE §4.1 uses them
    start: '05:45', end: '06:45',      // civil local; resolved to ms by atMarsLocal
    muster: { area: 'company-street', spot: 'formation-2' },
    who: 'platoon' | 'squad' | ['p233', 'p41'],
    dress: 'pt',
    attendance: 'mandatory' | 'optional' | 'window',   // a window: chow, sick call
    live: 'choice' | 'forced' | 'skip-only',
    resolver: 'pt-run',                // §9.4
    beat: 'big' | null,                // a block that is itself the sol's spike: an inspection, a first time, a qualification (§9.8)
    lateRule: 'formation' | 'class' | 'duty' | 'window'
  } ],
  duties: [ { post: 'fire-watch-sqbay-2', from: '02:00', to: '04:00', who: 'p233' } ]
}
```

### 9.2 The Plan of the Day at Base Melas (the 0.1 table)

Melas time (my calls; PEOPLE and CAREER fill the content, SETTING the names). The block ids are PEOPLE §4.1's.

**A training sol** (Monday to Friday):

| Time | Id | Block | Where | Attendance | Live or skip |
|---|---|---|---|---|---|
| 05:30 | `reveille` | Reveille: lights, the duty NCO's call | squad bay | everyone | the wake event (O) for everyone in the bay |
| 05:40 | `muster` | Muster, accountability | squad bay | squad | lived (30–60 s) |
| 05:45–06:45 | `pt` | PT: run or circuit at 1 G in the Wheel (until it joins: the track, the field house and the Ring by rotation at 0.38 G) | the Wheel's lane and halls (PLACES §4.15) | platoon | opening lived; the body carried on with a stance (§9.3) |
| 06:45–07:45 | `hygiene-chow` | Hygiene; chow window 06:50–07:40 | head, mess | individual | activities (§8) |
| 07:50 | `morning-formation` | Formation, the squad leader's inspection of shave, haircut and uniform; morning colours at 08:00 | company street (outdoors) | platoon | lived (1–2 min) |
| 08:00–11:30 | `train-a` | Training A (class, drill, suit drill, field and the shoot houses at 1 G in the Wheel; basic weapons training on the range and the bay at 0.38 G) | per block | platoon | live or carry on |
| 11:30–12:30 | `noon-chow` | Noon chow window (line closes 12:20) | mess | window | activity |
| 12:40 | `noon-formation` | Formation | company street | platoon | lived |
| 12:45–16:30 | `train-b` | Training B | per block | platoon | live or carry on |
| 16:30–17:15 | `maintenance` | Maintenance: weapons and gear, the armoury line | squad bay, cleaning canopy | squad | activities |
| 17:15–18:30 | `evening-chow` | Evening chow window | mess | window | activity |
| 18:30 | `mail-call` | Mail call: names called in the bay by the platoon's mail clerk | squad bay | optional | lived |
| 18:30–21:45 | `free` | Free time: §8.9's activities, the PX, the Rec, letters, the rack; liberty on the right evenings | anywhere allowed | | activities |
| 20:00 | | Tomorrow's PoD posted (wrist and board); the sol director runs (§9.8) | | | ticker; an O event if it changes your duty within 2 h |
| 21:45 | | Lights-out warning | squad bay | | ticker |
| 22:00 | `taps` | Taps: in your rack, night lighting | squad bay | everyone | an obligation (lateness counts) |
| 22:00–24:00 + slip | `night` | Fire watch 1, "the slip watch": 2 h 39 m 35 s | squad bay post | roster | `watch` |
| 00:00–02:00, 02:00–04:00, 04:00–05:30 | `night` | Fire watches 2–4 | squad bay post | roster | `watch` |

The night is 7 h 30 m on the clock and 8 h 9 m 35 s in the rack, because the slip falls inside it. The watch that holds the slip is the longest of the night: marines trade for it, or are given it (my call: a small piece of lore SETTING may keep).

**The Wheel's sol** (from 2026-11-08, the user's "always at 1G except for basic weapons training"; BODY §14.1's two weights, my calls): the platoon rides to the Wheel twice a training sol (about 12 minutes door to floor, PLACES §4.15: a ride is a short splash with its opening lived, inside the blocks), PT's hour holds about 36 minutes at weight, and `train-a`, the noon chow in the Wheel's galley, the noon formation and `train-b` are one stay of about 8 hours: about 8.7 h at 1 G a training sol, 33 h a week. The basic weapons blocks (the KD range, the 25 m bay, `train-a` or `train-b` on a range day) stay outdoors at 0.38 G, and a day's blocks in the PoD carry their place's gravity, so the clock does not change and the weight does (the step out of the lift at 0.38 G is BODY's). The evening, the rack, breakfast and supper are at Mars's weight.

**The week**, by weekday (SETTING §3.4: Monday to Friday train, Saturday and Sunday rest):

| Weekday | Routine | What changes from the training sol |
|---|---|---|
| Monday to Wednesday | training | nothing |
| Thursday | training | `maintenance` becomes **field day**, 16:30–18:30 (the barracks cleaned for the morning's inspection); `evening-chow` runs to 19:00 for the platoon |
| Friday | training | **the platoon sergeant's inspection**, bay and personal, 08:00–10:00 in the squad bays (PEOPLE §11.10); `train-a` then runs 10:00–11:30. A failed bay means field day again that evening (PEOPLE §11.10). Liberty from 17:15 for those not on duty. Once a month the company commander inspects instead (a forced day, §10.4) |
| Saturday | holiday | reveille 07:00, brunch 08:00–11:00, dinner 17:00–18:30, taps 22:00 (juniors on liberty back by 00:00, "home before the slip", PEOPLE §4.2); the rest free. A unit may set `routine: 'field'` on a Saturday for an exercise; the company's PoD says so by Thursday's 20:00 |
| Sunday | holiday | as Saturday; the chapel; Monday's PoD posted at 20:00 as usual |

**On standby** (the start of a career): liberty only within the recall radius (Redwater; the player's liberty is on base until Redwater is built at 0.2: CAREER §5.4, CONTRACTS §4), and one unannounced recall or alert drill a week, an A interrupt (my call). **As built in v0.0.4** (`src/data/pod.js` `ALERT_DRILL`, `src/sim/time/pod.js`; DESIGN.md's log, 2026-11-06): the alert drill's night and minute are drawn from the world's seed (the user, 2026-11-05: what happens in the places is procedural), `r = stream(seed, 'time:alert-drill', week)`, the night `int(r, 7)` after the week's Monday and the minute `int(r, 241)` after 00:30, so it sounds **between 00:30 and 04:30** (the 22:00 to 05:00 first written is cut), after the slip, which so lies inside the night, with the squad asleep; nothing is scheduled inside the slip (§11.3). In the career's first week it falls on one of the career's first two nights (`firstNight + int(r, 2)`; my call, the review of v0.0.4: CAREER §5.2's first-night spike, which drawing the week's night had made a 1-in-7 chance); seed 48213's career, begun on Monday, has it at 02:57 that night, and over 1,000 seeds every drill fell inside the window. Weeks are absolute (`floor((sol − weekday) / 7)`, SETTING's week, Monday first). The klaxon sounds 45 s from a horn in hall-2 of Echo's ground floor; the drill musters at your rack's foot in utilities, the count is due 5 minutes after the klaxon, the stand-down 30 minutes after it (§9.5). The drill during a free block waits for walking people (0.0.9).

**The first standby, by weekday.** The career starts on Monday Sol 590 at 12:40 (SETTING §3.7), so career sol n falls on weekday n mod 7, Monday first: career sol 0 Monday (arrival and check-in), 3 Thursday (field day that evening), 4 Friday (the inspection), 5 and 6 Saturday and Sunday (holiday routine), 7 Monday. CAREER §5.4 books which block kind fills which slot on those weekdays, and CONTRACTS §3 carries the lessons by weekday; the mission rehearsal exercise runs on the second Monday and Tuesday, so no lesson falls on a weekend. The orders paper's dates are generated from this calendar: the first recruit's standby is `STANDBY_SOLS` 10 (slip 0), the warning order comes on Wednesday Sol 599 and the battalion sails from Phobos on Sol 602 (CAREER §5.9; CONTRACTS §3).

On ships, the detachment's PoD runs on UTC with the same shape (reveille 06:00Z, taps 22:00Z), shortened sleep (no slip: Martians call the 24-hour day "the short day", my call), the `maintenance` block as field day every day aboard (a ship is cleaned daily: PEOPLE §4.7, my call), and the ship's drills and maneuvers as forced moments (§12).

**Who cites this table.** CAREER §5.4's earlier working-sol times (formation 07:30, chow 11:30–13:00, training 13:00–16:30, maintenance to 17:00, evening chow from 17:00), CAREER §14.3's mail call "16:30, names called in formation", BODY §7.1's earlier 06:00 reveille (BODY now reads 05:30 and 8 h 09 m 35 s in the rack), and PEOPLE §4.2's and §11.10's "sol 6" inspection are replaced by the times above. PLACES §4.3's walking times take their speed from BODY's gait helper (1.14 m/s on Mars, BODY §16.1), not 1.2 m/s.

### 9.3 Living a block or skipping it

A block is attended in person: you walk to its muster point by its start (no block is attended from a distance). Once there, it plays in up to four parts:

| Part | What | Time |
|---|---|---|
| **Opening** | the formation, the instructor's intro, the safety brief, drawing ammunition | lived, typically 30 s to 3 min of real time |
| **Body** | the block's bulk | the player chooses: **live it** (1:1) or **carry on** (an outcome skip with the block's resolver, at a stance) |
| **Beats** | moments the resolver or PEOPLE marks as needing you | lived, inside the body, whether skipped or not |
| **Closing** | dismissal, the ammunition declaration, the brass call | lived, seconds to a minute |

What each kind offers:
- **PT**: opening (formation, stretch); body (the run or circuit, skippable, or lived for as long as you like with "carry on" from any point); closing (dismissed).
- **Range**: opening (safety brief, ammunition issue); the relays are lived stop-motion shooting or skipped one at a time (each skipped relay is resolved by WEAPONS' shot rolls, all in the log); between relays, stand by; the brass call skipped; closing ("No brass, no ammo") lived.
- **Class**: opening (sit down); periods skippable; beats (a question put to you, nodding off if fatigue is high); closing.
- **Drill, CQC training, suit drill, field exercise**: opening, body, beats, closing in the same way; COMBAT owns field exercises.

**The first time is lived** (my call, after the user's tradecraft rule of 2026-10-26: "once we did it once, remember it so next time … snap flash forward"). The first block of each kind in a career is `live: 'forced'` for its opening and its first stretch of body (CAREER's tutorial sets how much); afterwards it is `choice`.

**Stances: carrying on is a choice of effort.** If a skipped block gave exactly what a lived one gives, carrying on would be a free win and the hour scale a string of splashes with no choice in them. So "carry on" asks how, once, at the block's opening, as a card with the stance's price on it (§8.1), and remembers the answer per block kind in `time.stances` until the player changes it (my call; the user, tradecraft, 2026-11-04: "there should be a way to remember our choice for a while"). The resolver rolls and logs with the stance's modifiers, and living the block keeps every choice the stance stands for. The numbers are mine until the owners set theirs:

| Block kind | Stances | What each does (owner) |
|---|---|---|
| PT, hike, MCMAP | **push** / **steady** / **coast** | push: fitness load ×1.3, standing up (CAREER §6.1's good-block credit on a pass), injury hazard ×2 (BODY), and a fall-out risk when fatigue is "tired" or worse (a big beat, §9.4); steady: as the table; coast: load ×0.7, and the NCO may notice (an Awareness roll by PEOPLE, a remark or a counselling on repeats) |
| class, briefing | **attentive** / **resting your eyes** | attentive: training hours ×1.1, sleep pressure ×1.1 for the block (BODY); resting your eyes: hours ×0.6, the block counts as rest (BODY §7.1), and each period rolls the nodding-off beat (caught asleep: a big beat, PEOPLE's discipline) |
| range relay, weapons drill | **careful** / **quick** | SKILLS' tempos (SKILLS §5.9): careful ×1.5 time, +2 on the roll; quick ×0.6 time, −3; the relay's time against its score (WEAPONS) |
| any block | **help the one who is struggling** (offered when PEOPLE marks a squadmate in trouble in it) | their result one grade up and their gauges toward you up (PEOPLE); yours one grade down. On a lived block it is a beat you play |

A stance is plain data on the skip (`skip.stance`) and in the resolver's call (§9.4), so it replays like any input (§14).

### 9.4 Block resolvers

A block's owner supplies its resolver: `resolveBlock(block, person, stance, rngStream) → { beats: [{ atOffsetMs, size: 'small' | 'big', kind, lines, effects }], totals }` (BODY and SKILLS for PT, WEAPONS for the range, SKILLS for classes, PEOPLE for drill, COMBAT for field exercises). It is called once when the body is skipped, from `stream('block', blockId, personId)`, so the result does not depend on how the skip is watched.

- **Small beats** apply their effects at their time and print their lines in the ticker and the log ("You fell back on the third lap: Fitness 14 against 18."). Every roll is in the log with its modifiers (hub, Pillar 3).
- **Big beats** are O events at their time: they interrupt and you land live in the moment (an ankle rolled on the track; caught asleep in class; a squadmate who goes down in the heat; a stoppage on the firing line that a fumble turns into a negligent-discharge risk). What a beat counts as big is the owner's call; the rule is that anything with an injury, a discipline consequence, a weapon mishap or a person in trouble is big.
- Totals (training hours, fitness load, qualification score, standing) are applied at the block's end, or pro rata at an interrupt.

### 9.5 Being on time

- **The custom:** five minutes early is on time (`EARLY_MS`). Arrival is the moment you enter the block's muster area (PLACES gives its polygon); for windows (chow), there is no lateness, only a closed line.
- **Classes** (my call; PEOPLE decides what happens):

| Arrival | Class |
|---|---|
| 5 min or more before the start | early (on time) |
| 0–5 min before | on the line (an NCO remark on a 30% hashed chance) |
| up to 2 min after | late, minor |
| 2–10 min after | late |
| 10–30 min after | very late |
| more than 30 min after, or never | missed: unauthorised absence from the start |

- The record: `{ blockId, dueMs, arrivedMs, lateMs, class }` on the person, for PEOPLE's discipline and CAREER's evaluations.
- **The warnings:** from 15 minutes before any mandatory block the instinct carries it, in the HUD clock rule's terms (§8.1): with a readable device "Formation 07:50, company street, four minutes' walk."; without one "Formation soon, by the look of the street. Four minutes' walk." The walk time is the nav path length (PLACES) over your walking speed in this gravity and state (BODY §16.1's gait helper).
- **The late card** (§5.3): when an activity would end after `muster − walk`, it offers *fit it in* (the activity shortened to end on time, with its partial outcome), *do it anyway* (lateness accepted: that block's obligation event is suppressed and the lateness is recorded when you arrive) or *not now*.
- **Sleeping through it:** reveille wakes everyone in the bay (an O event; BODY's sleep depth decides whether it works). Asleep somewhere else (the rec room, a bench), nobody wakes you unless PEOPLE sends someone: being missed is a story.
- **As built in v0.0.4, at the alert drill** (`src/sim/time/pod.js`, `alerts.js`, `activities.js` `lateCheck`; the build sheet's §8 items 4, 5 and 19, §9 items 31 to 33). **Mustered** is standing within `MUSTER_M` 0.6 m of your own rack's foot, in utilities, with no activity running but `standfast`, checked on whole seconds while the drill is open. The classes are this table's, counted **from the due**, the count at +5 minutes (02:35 for a drill at 02:30): on time to 0, late-minor to 2 minutes, late to 10, very late to 30, else missed; an alarm has no early class, and a marine not mustered by the stand-down has missed it. The record is `{ block: 'drill', who, dueMs, arrivedMs, lateMs, class }`, kept in `time.attend` (the last 50) until PEOPLE's discipline reads it (0.0.15), not on the person, and told as the `late` fact and in the log. **The count counts only who stands mustered at its second** (the review of v0.0.4: mustered and gone to the showers, the count had said 13 of 13): an arrival gone from the rack at the count or the stand-down is marked left (`leftMs`, the `late` fact's class `left`), and coming back before the stand-down arrives again, late. **The late check**: an activity that would end after the due less the walk back opens the late card ("fit it in · 2 min", "do it anyway", "not now", each with its end time; a shower at 02:30); it counts the dressing into utilities the activity leaves still to do, and never applies to dressing into utilities itself, since that is how one musters. From the count to the stand-down every activity but `standfast` or dressing into utilities is late ("the stand-down at your rack, 03:00", nothing to fit). T, T from the klaxon's landing musters you at 02:32:40, 140 s early; a shower taken anyway at 02:30 brings you back to the rack at 02:43:09, late by 8.2 minutes. From v0.0.5, with the rise at 4.0 s (PEOPLE §4.6), T, T musters you at 02:32:42.091, 138 s early, and the shower taken anyway brings you back at 02:43:10.091, late by 8.2 minutes; the count at 02:35 and the stand-down at 03:00 hold (`moment-night` prints the timeline beside v0.0.4's).
- **As built in v0.0.6, a chain** (§8.1; the build sheet 0.0.6 §8 item 13, my call): **a chain is checked for lateness as a whole**, its landing the outfit its steps leave you in, so a chain of musters (dressing into utilities, standing fast) is never late; the late card comes first, as for a single action; **"fit it in" keeps the leading whole steps that end by the fit**, none fitting refusing it ("No time for it."); a step is never shortened inside a chain.

### 9.6 Duties and watches

- The duty roster (PEOPLE) puts you on fire watch, guard, the CQ desk, a working party or mess duty. Each slot is a block with `kind: 'duty'`.
- **The relief call:** the off-going watch wakes the relief 15 minutes before the relief's watch: an O event attached to that person, so an NPC can forget (a hashed 3% chance, more when they're tired: PEOPLE) and so can you. If you are the off-going watch, waking your relief is your lived task; failing it is recorded.
- A watch is stood as the `watch` activity: outcome skip with the post's own interrupt `P` (anyone approaching your post lands you live, to challenge them), the hourly rounds in the ticker, and the asleep-on-post check as a big beat when fatigue is high.
- The handover ("I relieve you." "I stand relieved.") is lived, about 20 s.

### 9.7 "Call it a day" (not in 0.1)

An earlier draft let any sol that was not forced be spent from the Tab agenda, at the morning muster or later, as a one-day chapter that carried on every remaining block and automated care. That skipped the walks, the chow line and the evening, the shortcut the user took out of tradecraft: "we should not have the option to just fast travel to work, it would skip all the gameplay like shaking watchers etc., same with going back home" (2026-10-29), and "we should be able to go to our mission without using the fast travel shortcut in TAB" (rc51). It also broke §5.1.2. So (my call, after those words):

- **Not in the 0.1 build**, and never in the first standby, on a sol with a lesson or a forced block, or from Tab.
- **Where it exists** (from 0.2: dwell weeks, holiday routine, a quiet day aboard that is not a chapter day), it is an activity taken **at your rack**: "Call it a day". It spends the rest of the day as a one-day chapter (§10): the day card with its care line and its offers (§10.3), interrupts and forced moments landing you live.
- **Blocks you are mustered for still start at their muster point.** If the rest of the day holds one, the day lands you live at your rack in time to walk there, and the walk is lived (or, if it is a drill's familiar walk, fast-forwarded in the real sim, §12.8). "Call it a day" never carries you to a block or carries on a block for you.

So "a quiet sol can be skipped down to a minute or two of choices" (the hub) holds from 0.2, for sols that are truly quiet. In the first standby there are none: the sol director sees to that (§9.8).

### 9.8 The sol's rhythm: the sol director

Pillar 8 asks that "each sol needs a rhythm (calm routine, then a spike, then the base at night)", but only the weekly beat was guaranteed (§10.5, PEOPLE §15.2). Big beats otherwise came from the resolvers' chances and from arcs, so a training sol could run from reveille to taps with no spike, and nothing made real non-combat danger on base: the first real stakes would wait for Europa, 10 to 20 real hours in. TIME owns the sol's rhythm (the hub to name it, §19), and the sol director keeps it (my call).

**When it runs.** At the PoD's publication (`local@20:00` at Melas; 20:00Z aboard, where §12.8's drills and incident play the same part). It reads tomorrow's PoD and the queue's forced moments:
1. If tomorrow holds a big beat (a block with `beat: 'big'`: an inspection, a first-time block, a qualification; an arc beat PEOPLE has placed; a forced moment), it does nothing.
2. Otherwise, if the last spike the player lived (a big beat or an incident) was yesterday, it schedules an incident with probability 0.5; if two sols ago or longer, always. So a spike comes every one or two sols.
3. The kind is drawn by weight from the kinds whose preconditions hold (each kind names its owner's precondition: PLACES' weather holds a front tomorrow, a rover is on Valley Road), excluding any kind used in the last 7 sols (`time.director.recent`), from `stream('director', site, dayIndex)`.
4. Its time is drawn inside the kind's window and posted as a pre-drawn event (§5.6) with its line, priority and payload; it lands like any interrupt (§7.5), with a reflex where one is plausible.

**Incidents are real, never drills, and never combat on base**: the stakes are bodies, kit, standing and the squad. The garrison table (content by each owner; at least twelve kinds):

| Kind | Window | Lands as | Owner of the content |
|---|---|---|---|
| `hvac-out`: the bay's air handler dies; CO₂ climbs; the bay wakes with headaches, the duty NCO props the doors | 23:00–04:00 | B (your headache), then O at reveille | PLACES §3.3, BODY §11.4 |
| `rollover`: a rover rolls on Valley Road in sight of the squad: real casualties, real first aid | an outdoor block, a walk on liberty | D or O ("Man down") | COMBAT §12, BODY §18, PLACES |
| `lost-weapon`: Fox Company's lost rifle locks the base down: musters by the hour, search lines, the armoury shut | working hours | A, then O musters | WEAPONS §10.7, PEOPLE |
| `dust-front`: a dust front catches the range or a hike: visibility to tens of metres, the range cold, rifles fouled | an outdoor block in the dust season (Ls 180–330) | A (the weather warning) | PLACES §3.15, WEAPONS (dirt) |
| `water-main`: a main breaks: Navy showers, water points, rationing for a sol | any hour, for a sol | O (the first sergeant's word); the shower's water rule changes | PLACES §3.12 |
| `heat-casualty`: a squadmate goes down on a hump or PT: the cooling, the corpsman, your hands | PT, a hike | O ("Corpsman up") | BODY §10.6 |
| `fire-alarm`: the alarm at 01:00: out of the racks in what you sleep in, muster on the street, the count; usually burnt toast, once in a while an electrical fire | 00:00–04:00 | A | PLACES §3.7 |
| `spe-warning`: a solar particle event warning: outdoor work stopped, everyone indoors for hours (the air column shields the base, BODY §12, and the Corps keeps the rule) | any | A | PLACES §3.10, the world layer |
| `vip-visit`: a general's visit: an unplanned inspection, the bay squared away at a run, the platoon on show | announced at 20:00 for the morning | O | PEOPLE §11.10 |
| `power-out`: the grid drops: emergency lighting, the armoury on its generator, cold showers, the PX shut | evening or night | ticker and the lighting state; O for the armoury guard | PLACES §3.9, §3.12 |
| `marsquake`: the bay's lockers rattle; a rockfall from the canyon wall closes Valley Road | any | A or ticker | PLACES, SETTING §4.6 |
| `food-poisoning`: after noon chow half the platoon is in the heads by 15:00; a block cancelled; your own gut if you ate it | after a meal | B | BODY §5.2, PEOPLE |
| `ua-search`: a marine missing at muster: search parties, the barracks turned over | morning muster | O | PEOPLE §11 |
| `liberty-incident`: a squadmate drunk back from liberty at 00:30, or a fight at the gate; the duty NCO asks what you saw | liberty nights | S, then O | PEOPLE §6.5, §11 |

`bots-week` prints, per sol: the spikes (big beats and incidents) with kind, time and whether the player lived them; the longest run of sols without one (it must not exceed one sol); and the kinds' spread (no kind twice in 7 sols, at least twelve kinds eligible at Melas). The weekly beat (§10.5) and PEOPLE's arc director still run: the sol director fills the days between.

---

## 10. Chapters and papers

### 10.1 When

A chapter is offered for any stretch whose days are routine: a voyage (§12), a quiet standby stretch after the first (the first standby is lived sol by sol: DESIGN.md), a school (CAREER), a long sick-bay or hospital stay, leave, a deployment rotation's routine weeks. Chapters are not fast travel: every day in one is a day the character lives, summarised, with choices (the hub, Pillar 4: "Long voyages and quiet stretches are lived as chapters with choices").

### 10.2 Data

```
chapter = {
  id, kind: 'voyage' | 'standby' | 'school' | 'hospital' | 'leave' | 'rotation',
  locale: { kind: 'utc' } | { kind: 'mars', lonE },
  unit: 'day' | 'week',                 // voyages, standby: day; schools, leave, long stays: week
  startMs, plannedEndMs, index,         // index: the current day or week, from 0
  allocation: { evening: [...], free: [...] },   // the last choice, reused by "carry on"
  care: { base: 'sensible', skip: [], water: 'normal' | 'navy' | 'ration', items: [] },   // the care line (§10.3); items only by tick
  offers: [ { id, atMs, expiresMs, src, place, mode: 'live' | 'slot' | null } ],         // today's offers (§10.3)
  forced: [ { atMs, kind, why, live: 'day' | 'moment', leadMs } ],
  log: [ { index, startMs, lines: [...], notable: bool } ],
  papers: [ ids ],
  lastBeatMs                            // the story-beat guarantee (§10.5)
}
```

### 10.3 The day card

At each day's start (reveille: 05:30 Melas, 06:00Z aboard) the chapter shows the day card:
- the date in the locale's faces, and on a voyage the deck G, the deck state, the distance and light lag to Mars, the time to the flip or to arrival;
- the day's fixed obligations (from the PoD: watches, drills, classes) and any forced moments with their times;
- the free slots (the PoD's free blocks: the evening, or the whole day on a holiday routine) with an allocation picker: for each slot, an ordered list of activities from what the place and your status allow (the Ring, the gym, rifle and drill rounds, kit, study a named manual or an MCI course, read, letters, socialise with named people, rest, volunteer for a working party or a watch, liberty where allowed: §8.9), each with its duration, the slot filling in order and its remainder becoming rest;
- **the care line** (below);
- **0 to 2 offers** (below);
- three buttons: **Live this day** (normal play from reveille), **Spend it** (the day resolves as one day splash, §6.6), **Carry on** (spend this day and every following one with the same allocation and care line until a forced day, a forced moment, an offer you marked, an interrupt or the chapter's end).

**The care line.** A spent day's own care is a visible line on the card, which the player can edit, never something done unasked (BODY §1; the user, 2026-10-31: "i never asked to take the medication when washing up"; and the brief's itch, 2026-11-05: "air management, gravity effects, water management, single player survival with bodily functions"). The default reads **"as a sensible marine"**: meals at the chow windows, the head as BODY's needs require, a shower after PT and before taps, the canteen refilled at the tap, sleep at taps with the alarm at reveille, all from issued supplies. Its options (my call on the list): skip a named meal; a Navy shower or the basin only, to save water; ration the canteen (drink at meals only); eat in the line rather than at the table, to save time; turn in early or late. It **never uses a personal item** (food you bought, a care package, medication, a drug, alcohol) **without its own tick** on the line. **On a rationed site** (Europa's water, a ship with its recycler down: PLACES says when) the line is not pre-filled: the card asks, showing what there is, and a shortfall during the day (the water point dry at 14:00, the canteen empty on a hump) is a forced moment that lands you live (§10.4), never a silent outcome. BODY's outcomes then say how the day went. Test 21 checks that a spent day consumes nothing outside the ticked line.

**Offers.** Each day card may carry up to two **offers that expire**, drawn from PEOPLE (who is here and what they want) and the place (what it has): the chief's tour of the reactor gallery at 15:00Z; a simulator-range match at 19:00Z with something on it; the corpsman asking for volunteers to practise IVs; a card game in the berthing; a Belter crewman's Lang Belta lesson. Each says when it is, what it might give in words ("the chief likes people who listen") and when it lapses. Taking one either **lives that part of the day** (the day is spent up to the offer, which lands you live at its place, then the card comes back) or **spends a slot on it** for a lesser, resolved outcome: half the gauge moves, no story beat (my call). The best story beats and gauge moves sit in offers, so a lived evening holds something the day card cannot. The `passenger` bot prints the offers per voyage day and which it took.

### 10.4 Forced days and forced moments

**Forced days** have no "spend it": they start live at reveille.
- your first day at a new site or aboard a new hull (CAREER: arrival and settling in);
- an inspection by the company commander or above;
- a qualification or an exam the first time (later: a forced moment);
- a PEOPLE arc's key day;
- a hearing (non-judicial punishment, a court);
- the day of an operation's briefing and the day before a drop.

**Forced moments** interrupt a spent day at `atMs − leadMs` and are lived; when the moment's own end comes (the secure order lifted, the drill secured), the day card comes back to spend the rest of the day (never the Tab agenda, §9.7).
- on a voyage: ignition, the flip, arrival and capture, the drop sequence (§12);
- general quarters and every drill (the first of each kind lived in full, later ones for their twist, §12.8); the voyage's one real incident (§12.8); a fire, a breach;
- a shortfall in the day's care on a rationed site (§10.3);
- an offer the player marked to live (§10.3);
- a fight in the berthing, a squadmate's crisis (PEOPLE);
- a letter with news that matters (CAREER), read live;
- an encounter (COMBAT).

### 10.5 A story beat every week

"Each week needs a story beat" (the hub, Pillar 8). The chapter keeps `lastBeatMs`, the last forced moment or big beat lived. At the day card of the sixth day without one, it asks PEOPLE for its ripest arc beat and schedules it within the next two days; if PEOPLE has none, it draws a small beat from a generic pool (a birthday in the squad, a card game with stakes, a pressure drill, a Lang Belta lesson gone wrong). The same rule runs on base during standby weeks (my call). The sol director (§9.8) works at the scale below it, the sol; this rule is the floor under both.

### 10.6 Papers

Papers are the cards and documents through which the gap is felt (tradecraft's Papers, Please touchstone). CAREER, PEOPLE and the world own their content; TIME owns when they come.

| Paper | When | Owner of content |
|---|---|---|
| the day line | every spent day: one line ("Day 3 · 1 G · 2.2 AU out · PT, rifle, cards with Okafor (+1).", Okafor standing for whichever squadmate the roster drew: every person is generated) | TIME composes from the day's outcome |
| the chapter paper | at the chapter's end, or when you stop it: the day lines with notables marked, totals (fitness load, G-conditioning, skill hours, dose, money), a small chart (VIEWS) | TIME composes |
| pay | every 30 UTC days from the career's pay epoch, at 00:00Z; shown at your next waking moment | CAREER |
| orders | as issued; an O event if they act within 24 h, else a card at the next waking moment | CAREER |
| evaluations | CAREER's cadence (and at each chapter's end) | CAREER |
| mail | on arrival (light lag, §11.5); a card if you opted, else the inbox | CAREER |
| the news | one line a day in the ticker; a weekly digest in chapters | the world layer (LONGHAUL's politics and conflict) |
| medical | after a sick bay stay | BODY |
| discipline | after a hearing | PEOPLE |

At any stop, at most three cards are shown, most important first; the rest go to the papers tray in the mind (Tab), to read when you like (my call, after the user's tradecraft complaints of 2026-11-04: "too wordy", "too many words, this should be graphics").

---

## 11. The background world: layers, cadences, level of detail

TECH owns the module layout and the implementation of the tick; this section is the contract it implements.

### 11.1 The tick (live play)

1. Dispatch every event with `atMs ≤ now` (§5.6).
2. Input and actions.
3. If a choice is pending (still), stop here: the tick runs but nothing advances.
4. **Fast layer**, the live area only: movement (the player, then actors), the spatial rehash, perception, thinking (staggered by id hash), the rules (weapons and stop-motion steps, CQC, inertial bodies, fast environment effects such as a room venting), the player's fast body (bleeding on whole seconds, G-LOC, breath-hold, pain).
5. **Per-second sub-layer**, on whole seconds (`clock.ms mod 1000 = 0`; per-entity work staggered by `floor(clock.ms / TICK_MS) mod 20 = hash(id) mod 20`, TECH §3.2): the crowd topped up out of view, walk-ins and walk-outs (§5.9), noticing, the instinct's `settle()`, the HUD's offers.
6. The clock: `clock.ms += 50`, `clock.tick += 1` (a lived tick).
7. If a game minute ended: `slowStep(state, bus, minuteStart, minuteEnd, { skipping: false })`, the same function the skip engine calls (§5.4).
8. The autosave check (§13).

Decisions made in one tick act in the next (both projects' rule).

### 11.2 The slow layer (per game minute)

As listed in §5.4: the site's environment, the player's slow body, tier-2 persistent people, ship systems and the voyage, crossing re-estimates. In live play, work that is closed form (tier-2 schedule lookups) may be spread over the minute's 1,200 ticks by id hash; work that integrates (gases, heat, the player) runs at the boundary and calls the same step functions as the skip, with Δ the only difference (§5.5).

### 11.3 World and calendar slots

Recurring jobs are events that re-post themselves (TECH §4.3's `every` grammar: `hour@:MMZ`, `day@HH:MMZ`, `local@HH:MM`, `week@<weekday>/HH:MM`, `every@<ms>`). World jobs run on UTC (the system's time); a site's human rhythm runs on its local day.

**The local day** is the sol on Mars (from civil 00:00 at the site's meridian, so it begins as the slip ends) and the UTC day everywhere else: ships, Phobos, Callisto, Europa's towns (`localDay(ms, locale)`, §1). `local@HH:MM` reads the current site's locale, so the same job runs at 00:00 Melas time on base and at 00:00Z aboard. Ships and Europa's towns have no timeslip; nothing is scheduled "inside the slip".

**This is the only slot table.** Times given elsewhere for these jobs (BODY §2.2's daily layer "at 04:00 body time"; PEOPLE §13.2's hourly social pass "at minute 7" and its per-sol pass and arc director "inside the timeslip"; PEOPLE §15.2's "sol 1, inside the timeslip") are replaced by these:

| Slot | Job | Owner |
|---|---|---|
| every hour at :05 UTC | persistent people's hourly social step: who was together, what they said, gossip spreading | PEOPLE |
| every hour at :17 UTC | hot-zone incidents far from you (LONGHAUL `zoneIncidents`) | COMBAT, world |
| every hour at :29 UTC | the environment's memory: dust settling on surfaces, a storm front's progress (weather itself is a pure function of place and time, tradecraft `weather.js`'s rule) | PLACES |
| every hour at :35 UTC | **healing**, the only healing slot: `heal(person, 1/24 day)` for the player and tier-2 people, at BODY's daily rates (the hub: "healing runs hourly at daily rates (TIME §11.3)", this slot; an hourly step of a daily rate, my call, so that lived and skipped days heal the same and an 8-hour skip heals a third of a day). Nothing else heals: BODY's daily layer no longer does, so a body is never healed twice | BODY |
| every hour at :41 UTC | the encounter director, deployed and at sea: alerts, incidents and encounters around the player, calling on people and ships already there first (LONGHAUL's encounter director) | COMBAT, PEOPLE |
| every hour at :53 UTC | traffic and comms digests | world |
| daily 00:00Z | pay due-check, mail dispatch | CAREER |
| daily 04:00Z | tier-3 people (other sites): career events, injuries, relationship drift, letters | PEOPLE |
| daily 05:00Z | politics (LONGHAUL minute 300) | world |
| daily 05:20Z | conflict zones born, escalated, ended | world |
| daily 07:00Z | forces census and yards (LONGHAUL minute 420) | world |
| `local@00:00` | the per-day passes, one job each for everyone at the site, by the local day: the day's schedules resolved by hash for every persistent person (PEOPLE); PEOPLE's per-sol pass (gossip, careers, arcs, the roster), its 20 ms spread over 20 ticks by PEOPLE as it likes; BODY's daily work (bone, plasma, the day's G stimulus and G-conditioning, vestibular adaptation, mass from deficits, ARS phases); TIME's `autosaveDay`, which asks the sol's autosave at its first second (`why: 'day'`, §13; built in v0.0.2) | PEOPLE, BODY, TIME |
| `local@20:00` | tomorrow's Plan of the Day published; the sol director (§9.8) | PEOPLE, TIME |
| `week@Sunday/20:00` | the week ahead's duty roster and liberty list, published with Monday's PoD (PEOPLE §4.3: "with sol 7's Plan of the Day at 20:00") | PEOPLE |
| `week@Monday/00:00` | PEOPLE's arc director: last week's perceived beats counted, an arc advanced or started (PEOPLE §15.2) | PEOPLE |

**One job for many people.** A per-day pass is one event that walks the site's people in id order, never one event per person: about 230 people with a daily event each in body time would fill the queue for nothing (TECH §4.4's cap). BODY's "04:00 body time" survives only as the body clock's own marker (where "body morning" begins for the bowel's reflex and the kidneys' night cut, BODY §7.2), read in closed form and never posted as an event.

**Absolute periods.** Physiological and skill rollovers (fitness weeks, rust's periods) are counted in absolute time since the career began (`every@<ms>` at `k × FIT_WEEK_MS` and `k × RUST_PERIOD_MS`, 7 and 28 sols, whose only definitions are SKILLS §8's and §7's; CONTRACTS §5), not on any calendar, so they never jump when you move between sols and UTC days (my call; BODY and SKILLS own the rules).

### 11.4 Level of detail

| Tier | Who | Stepped by | Held as |
|---|---|---|---|
| player | you | fast, per-second and slow layers; needs in closed form | everything |
| live actors | everyone in the live area, persistent and crowd | fast layer; thinking staggered | actors with positions |
| tier 2 | persistent people at your site, elsewhere in it | slow layer: schedule and needs in closed form, crossing events | room and activity, no coordinates |
| tier 3 | persistent people at other sites (your old squad while you're at school) | daily outcomes at 04:00Z (§11.3) | site and status |
| your unit, away | the force record | world daily | LONGHAUL-style force |
| crowd beyond the bubble | nobody | nothing | a seed |
| the solar system | powers, fleets, zones, ships | world hourly and daily; rails in closed form (LONGHAUL `world.js`) | LONGHAUL's world |

"Far-away things get outcomes, not simulation" (LONGHAUL and tradecraft `CLAUDE.md`). PEOPLE owns the per-person budgets inside these tiers.

### 11.5 Light lag

- Every message, news item and order between bodies travels at the speed of light: it is posted to the queue at `sendMs + lagMs`, where `lagMs = |pos_to(arrive) − pos_from(send)| / c`, solved with three iterations for the receiver's motion (LONGHAUL `intel.js relay`). 499.005 s per AU.
- At the start (SETTING §2.4): Mars–Earth 2.319 AU, 19.3 min one way; Mars–Jupiter 5.734 AU, 47.7 min. At LONGHAUL's epoch they were 1.99 AU (16.6 min) and 6.41 AU (53.3 min), measured.
- Live calls exist only where the lag is under 1 s: Mars and its moons, or within one Jovian moon's neighbourhood. Between Jupiter's moons (1–9 s) it is messages only (my call).
- The comms console aboard shows the growing lag ("MARS 34 min 12 s"); letters home leave and arrive by it.

---

## 12. Voyages

### 12.1 Model

A voyage is a **closed-form plan**, fixed when it is filed: legs with times, felt G, deck direction and deck state, sampled at any millisecond in O(1). The player never flies; the ship's interior runs at 1:1 under the plan, and the background places the ship on its chord (LONGHAUL `world.js transitStateAt`, `traffic.js`). Distances come from LONGHAUL's ephemeris; the burn is a true brachistochrone at the profile's G.

**One helper.** `voyagePlan(from, to, departMs, profile) → voyage` in `src/world/voyage.js` (TECH §19: "`world/voyage.js` implements TIME §12") is the only place a transit time is computed. SETTING's distance and movement tables (SETTING §2.4, §6.5), PLACES' hull data (a transport's cruise G, PLACES §5.2), CAREER's deployments and the instruments' ETAs all call it or quote its output; none computes its own.

### 12.2 Data

```
voyage = {
  id, hull: 'mcrn-transport',          // SETTING §6.3: the Coprates class; the first ride is MCRN Testudo, AP-33
  from: { body: 'Phobos', place: 'phobos-yard' },
  to: { body: 'Callisto', place: 'parking' },   // SETTING §6.5: Callisto first, then Europa's parking orbit
  departMs, profile: { burnG: 1 },     // SETTING §6.5's doctrine, "fight at one G"; CAREER's deployment may file another
  chordAU, peakSpeedMs, burnMs,        // solved at filing
  legs: [ { kind, t0, t1, g0, g1, dir: 'aft' | 'none', state: 'secure' | 'free' | 'freefall' | 'high' } ],
  events: [ ids ]                      // posted to state.events
}
```

### 12.3 Filing a plan

1. `L` = the chord from the departure body's position at ignition to the arrival body's position at arrival (LONGHAUL ephemeris), solved by iterating the arrival time six times.
2. With `a = burnG × 9.80665 m/s²` and a 6-minute flip coast at peak speed, the burn time `T` solves `a T²/4 + a T/2 × 360 s = L`.
3. Legs:

| Leg | Duration | G | Deck state |
|---|---|---|---|
| secure for departure | 20 min before the RCS lights | 0 | secure |
| depart (RCS out of the yard) | 105 min (LONGHAUL: about 1 h 45 min from a berth) | ≤ 0.02 | secure for the first 30 min, then freefall |
| prep | 10 min (LONGHAUL `PREP_MINUTES`) | 0 | secure |
| ignition ramp | 20 s, linear (my call: an onset rate for BODY and the moment floating things fall) | 0 → a | secure |
| burn | to the flip, `T/2` | a | secure for the first 10 min, then free (high above 1.5 G: couches and juice, the user's line in LONGHAUL, 2026-03-27: "velocity kill at 1.5G (juice threshold)") |
| flip | 6 min (LONGHAUL `FLIP_MINUTES`), drive cold, the hull turning π rad | 0 | secure from 30 min before |
| brake ramp | 20 s | 0 → a | secure |
| brake | `T/2` | a | secure 10 min after ignition (`SECURE_LINGER`), free, secure again for the last 60 min (LONGHAUL `ENDGAME_S`) |
| capture | into the parking orbit, then a dock or the drop | 0 | freefall |

Deck "down" is always aft while the drive burns, braking too, because the ship has turned (the hub). The flip turns π rad in 360 s (0.0087 rad/s): at 20 m from the centre of mass that is 0.00016 G, so things float gently; LONGHAUL's 3-second 0.4 G "tumble" push is not carried over (my call: the physics of a 6-minute turn has no such kick; the danger is the relight, gentle after the planned 20 s ramp and hard when the drive comes back at full thrust, below).

When the drive lights, anything floating falls to the deck. Under the plan's 20 s linear ignition ramp the deck's acceleration is `a(t) = A t / 20 s`, so a body that starts at rest falls `x = A t³ / (6 × 20 s)`: from 1 m it lands after 2.30 s at 1.30 m/s at 1 G (3.18 s and 0.94 m/s at 0.38 G); from 2 m, 2.90 s and 2.07 m/s at 1 G. That is a stumble, not an injury, which is why the ramp is there. **√(2ah) holds only for an instant relight** (a combat burn, a jink, a drive restarted at full thrust): from 1 m, 4.43 m/s at 1 G, 2.73 m/s at 0.38 G. BODY's impact table decides what each does; COMBAT and BODY own inertia.

### 12.4 Sampling and events

```
feltAt(voyage, ms)  → { g, dir, state, leg, rampS }   // piecewise, linear ramps
placeAt(voyage, ms) → { posAU, speedMs }              // s = ½at² in the burn, v_peak in the flip, mirrored in the brake
lagAt(voyage, ms, body) → ms                          // §11.5
```

`feltAt` is called every tick in live play (cheap) and per step in a skip; BODY reads it for acute and chronic G, PLACES for the deck's "down" and loose objects. At filing, the voyage posts its events: the secure calls (A events with the 1MC's line, at each secure window's start minus 5 minutes for the walk to a couch, my call), ignition, flip, brake ignition, the approach call, capture; the ship's drills and its one real incident (§12.8); the detachment's PoD.

**Maneuvers are forced moments.** The secure call interrupts; you walk to your couch (lived) and strap in (lived, about 20 s); `strapped-in` skips to the maneuver; the maneuver's first seconds are lived (the drive cuts and things lift; the relight and the deck coming back); `strapped-in` skips the linger; the secure order lifts and the day goes on.

**Ship combat from a couch** uses the same pattern. COMBAT §13.3 supplies the hold points, and `strapped-in` ("Wait at your station") skips the hours between them (LONGHAUL combat note: "combat is mostly waiting"). Time is held at 1:1 from `HOLD_BEFORE_S` 90 s before an inbound's predicted arrival through the intercept or hit; for 30 s around our launch and around a manoeuvre (a burn change over 0.5 G, a flip, the start of jinking); at a hit and for `HOLD_AFTER_S` 120 s after it, or until no compartment within two decks is changing pressure; at every 1MC call with new information and every order to marines; at a body event; at boarders. An earlier draft here took LONGHAUL's warp caps (a torpedo under 30 minutes out) as hold points, which would have held 30 minutes at 1:1 for every inbound; COMBAT's are the rule.

### 12.5 The numbers at the start

Phobos to Jupiter's space, departing on SETTING §6.5's default day, Sol 602 (2351-12-31 10:15Z, twelve sols after the start), by `voyagePlan()` (measured; the chord grows with the voyage's length because Jupiter moves on while the ship flies; the arrival at Callisto's parking orbit lies within 0.013 AU of Jupiter, under 0.1% of the time):

| Profile | Chord | Burn time | Flip after ignition | Peak speed | Door to door (departure legs, burn, flip, ramps) |
|---|---|---|---|---|---|
| 0.3 G (LONGHAUL's Belter standard) | 5.627 AU | 12.38 d | 6.19 d | 1,573 km/s | 12.48 d |
| 0.38 G (Mars-normal) | 5.625 AU | 11.00 d | 5.50 d | 1,770 km/s | 11.09 d |
| 0.5 G | 5.622 AU | 9.58 d | 4.79 d | 2,030 km/s | 9.68 d |
| **1 G (SETTING's default)** | 5.616 AU | 6.77 d | 3.39 d | 2,869 km/s | **6.87 d** |

Light lag to Mars grows from under a second to about 47 minutes on the way. Departing 60 days later the chord is 4.93 AU and the 1 G burn takes 6.34 days; at LONGHAUL's epoch (chord 6.40 AU) it was 7.23 days.

**One method, said once.** The timeline is the closed form plus the real legs (§12.3), which is how every hull on rails flies in LONGHAUL's world and in OLYMPUS's (`world.js transitStateAt`; the Coprates transports are on rails, SETTING §6.3). LONGHAUL's measured 5–12% overhead (about +8% on long transfers) comes from its guidance law flying a commanded hull by feedback at one-minute steps; it is not physics a Navy navigator would fly, so it is left out of every OLYMPUS voyage, SETTING's tables included: SETTING §2.4 and §6.5 quote `voyagePlan()`'s 6.87 days door to door at 1 G and 12.48 at 0.3 G (CONTRACTS §14).

**The default profile is SETTING's** (SETTING §6.5 owns MCRN doctrine: "fight at one G"): **1 G out**, a week of Earth weight that the Corps' G-conditioning exists for; 0.3 G home after months at 0.134 G (SETTING §18 records it among its settled calls, which the user may overrule; restated in §20). This section's earlier draft defaulted to 0.38 G (11.8 days); it is withdrawn. Which profile each deployment files is CAREER's (the deployments catalogue), within SETTING's doctrine. PLACES §5.2's transport takes its cruise G from the filed profile, not from a hull constant.

### 12.6 Drops, ascents and rides

- **Drop rides** (COMBAT and PLACES own the scene): planned from LONGHAUL's `planetary.js` profiles, cached per world and craft. Europa, to Pwyll: 0.91 h of mostly free-fall coast from the parking orbit and a powered descent, which LONGHAUL's pinnace flies in 1.5 min at up to 3.69 G and the Corps' Simoom lander in a braking burn of up to about 77 s at its troop-rated 2.5 G cap, then 90 s from the hover under 1 G (SETTING §6.4; CONTRACTS §14). Mars, pinnace: 2.0–2.9 h to the entry, 38 min of entry at up to 2.16 G, a powered landing. Lived: separation, each burn's ignition, the entry interface or the hover, touchdown; the coasts are `strapped-in`.
- **Melas to Phobos:** an assault lander from Melas Field (SETTING §6.5: 2–3.5 h in all; about 5 min of ascent capped at 2.5 G, then free fall with a few minutes of 1 G burns), to Phobos' orbit at 9,377 km and the Pens. Windows come every 11.1 h (Phobos' synodic period over a surface site); the wait for one is a `stand-by` at the terminal, up to 6 h (LONGHAUL `shuttles.js WINDOW_MAX`).
- **Ground rides** (the bus to Redwater, a rover, the rail): PLACES' timetables; the wait at the stop is `stand-by`, the ride is `ride`, boarding and getting off are lived.

### 12.7 Voyages as chapters

A voyage is a chapter in UTC days (§10). Its day card shows the deck G, the deck state, the distance and lag to Mars, the time to the flip or arrival, the care line and the day's offers (§10.3). Ignition, the flip, arrival and the drop are forced moments; the first day aboard is a forced day (finding your berth, the ship's rules). The default voyage of 6.9 days, carried on from start to end, costs about seven day cards plus the forced moments, the first drills and the real incident (§12.8): under 15 minutes of real time if you want it to, several evenings if you live it.

### 12.8 Drills, and the one that is not

The voyage's drills (and the standby's weekly alert drill) are the same suit-up, couch and wait each time, so by the third a player knows nothing will happen. Four rules keep them meaning something (my calls):

1. **They vary.** Drills come every 2 to 4 days at a hashed time between 08:00 and 20:00Z, the kind dealt from a deck without repeats until every kind has been drilled, from `stream('voyage', id, 'drills')`: general quarters (suits, couches, the simulated hit); fire in the galley (the mess deck cleared, the hoses, smoke); a collision drill (secure, hatches dogged, the damage-control lockers); decompression next door (the next compartment "breached": hatches, suits, the rescue ball, PLACES §5.2's Condition Seal); man adrift during the flip (a marine off his handhold in the gym deck's six minutes of free fall, the recovery); radiation (a solar particle event: everyone to the storm shelter on Deck 10, PLACES §5.2); abandon ship (suited, mustered by wave at the lander silo doors on Deck 14). COMBAT and PLACES own each drill's content; at Melas the weekly alert drill varies the same way (a recall, a fire drill, a lockdown).
2. **They are graded.** Each drill is timed by the ship's clock from the alarm to each squad's "manned and ready", and posted on the berthing repeater's DRILLS page as a squad-against-squad board. The honour squad gets first sitting at chow for a day and the platoon sergeant's word (standing +0.5 each, CAREER §6.1); the last squad gets his displeasure (the drill run again at 21:00, field day, an R1 for its squad leader, PEOPLE §11.5).
3. **Familiar parts go fast, the twist is lived.** The first drill of each kind is lived in full (§9.3's first-time rule). After that, the parts already done are offered fast: the suit-up as its activity (§8.2), and the walk to your station as a fast-forward of the real sim, tick by tick, so anything on the way still interrupts it. Where the area is too crowded to fast-forward (§5.2: a full berthing deck), the walk is lived at 1:1; it is never replaced by an outcome (§5.1.2). Each drill after the first carries a **twist** that is lived: a hatch that sticks, a casualty played by a sailor, the buddy whose seal fails the check, a squadmate missing at the count.
4. **One is real, and not combat.** Each voyage files one **real incident**, drawn at filing from `stream('voyage', id, 'incident')` at a hashed time in the middle 60% of the voyage, never on the first (forced) day and never inside a secure window: a berthing seal failing slowly (a real leak, PLACES §3.5), a drive scram mid-burn (the deck lets go without a secure call: every floating thing and every unsecured body a D event, §12.3's instant √(2ah) when it relights), or an electrical fire (PLACES §3.7). It uses a drill's own alarm, and the 1MC adds the words every drill has taught you to discount: "This is not a drill." It is a forced moment (§10.4) and the voyage's spike; in 0.2, before ship combat arrives in 0.4 (ROADMAP §3.3), it is the only real danger aboard.

The `passenger` bot prints each drill's kind, its twist, the squads' times and the board, and the incident with how the player met it.

---

## 13. Saves and autosave cadence

The hub settles IndexedDB, plain JSON, Ironman with one autosave, Standard with saves anywhere, and export and import. TIME settles when.

**Autosave triggers** (both modes): the end of every skip, after its papers; every spent chapter day; an area change completed; `AUTOSAVE_LIVE_MS` (5 minutes) of unpaused live play since the last save, counted in game time by `time.liveSinceSaveMs`; the tab hidden or `pagehide`; quitting to the title; the start of a forced day. These replace the built `main.js` stub's save every 30 game minutes (TECH §1.3, correction 10, adopted: "Autosave: `main.js`'s stub (every 30 game minutes) is replaced by TIME §13's triggers, implemented in [TECH] §7.4"). TIME asks with an `autosave` fact; TECH §7.4 writes, at a quiet frame.

**Ironman adds:** the moment combat begins in your area (the first shot by anyone, or general quarters), and death, saved at once, so that closing the tab never undoes a fight or a death (my call, the purpose of "death ends the career", the user, 2026-11-05).

**Slots:** TECH §7.2's (CONTRACTS §12): Standard `auto`, `auto-prev` (rotated on time), `day`, `manual-1` to `manual-9`, `edge`; Ironman `ironman` and the hidden `ironman-prev`.

**What is saved** (TECH §6.1's keys, adopted word for word):
- `clock`: `{ ms, tick, holds, seq }` (correction 1);
- `events`: "the queue's heap array" (correction 9: saved as it is, not sorted; dead entries compacted, TECH §4.1; at most 4,000 live);
- `skip`: "the running skip, or null" (a save in the middle of a splash resumes it from its step boundary, with a 0.4 s zoom-in; TECH §5.7);
- `time`: "`{ chapter, voyage, pod, alarms, interrupts: { perSol, perSkip }, liveSinceSaveMs, slowToMs }`", "the clock is not here"; `slowToMs` is the slow mark, how far the slow layer has stepped (§5.4; TECH §3.4, built in v0.0.2). Inside its own key (TECH §6.1: the owner defines the shape inside the key) TIME adds `director: { recent: [{ kind, day }], lastSpikeDay }` (§9.8), `stances: { <blockKind>: stance }` (§9.3) and `drills: { dealt: [kinds], board: [...] }` (§12.8); TECH §6.1's table lists them.

Runtime structures (`$`-prefixed: the queue's `$events.bySrc` index, caches) are rebuilt on load from the saved order. A save made in stop motion, a conversation or a reflex resumes in it. **As built in v0.0.5**: stop motion's record is `state.stop` (WEAPONS's key, TECH §6.1), saved whole, its reflex card included (`state.stop.reflex`, not tradecraft's runtime `$reflex`: the build sheet 0.0.5 §8 item 8), so a save made while choosing, mid-step, at the reflex card or in a chained wait loads and carries on byte for byte, in node and in the page (`browser`, `steps`).

---

## 14. Determinism

1. Game time is integer ms, in `state.clock.ms`. Ticks are 50 ms; scheduled times are whole seconds; durations are whole seconds. `clock.tick` counts lived ticks only; staggering reads `floor(clock.ms / TICK_MS)`, so it does not depend on how time passed.
2. One seeded rng (tradecraft's sfc32 in the state) with named streams (`stream(name, …keys)`) for every source that must not move the main dice: block resolvers, hazards, the directors, voyages' drills and incident, crowd seeds. Cosmetic choices (log lines, the time estimate, the splash's crowd faces) come from hashes, never from a stream.
3. Stochastic events are pre-drawn into the queue (§5.6), so lived and skipped hours see the same events at the same seconds while their rates agree. Ties in the queue break by the numeric `seq`, everywhere (§5.6, §7.1).
4. Slow processes call the same step functions in both modes (§11.2), and lived and skipped time meet the parity contract (§5.5): bit-exact within one engine, within stated tolerances between them.
5. Which engine a skip uses (fast-forward or outcome) is a function of the state alone: the planned gap, the live actor count (§5.2), a live fight (§4.5).
6. The splash and the UI never change the sim. "To the end" moves only the splash's target, which never changes the result; "stop here", "one more chunk" and a block's stance are sim inputs applied at a known sim minute, recorded like any input (TECH §5.5, §8.3).
7. Real time never enters the sim. The splash's real speed decides only how many simulated minutes a frame computes; the result does not depend on it.
8. Iteration order that decides anything is sorted: by id through `ids(obj)` or by a total comparator (TECH §8.1, rule 9), never a JS object's own key order (a canonical save writes keys sorted, so it changes after a load) and never a `Set` or `Map` built from hashed keys.
9. Float results must be identical within one engine. Chrome's V8 and node's are different versions (TECH §8.1, rule 11): transcendental results are rounded by `q()` before they are saved, and a page replay is the authority when node's V8 differs. Equality across engines is not required (my call): `Math.exp` and friends may differ by an ulp between engines, and saves are not moved between engines in normal use. Integer time and calendar arithmetic are exact everywhere.
10. A save and load at any step boundary (mid-tick excluded) continues identically (§15).

---

## 15. Tests and the numbers they print

`tests/time.test.mjs` (quick unless marked heavy), run by `node tests/run.mjs time`.

**The calendar's numbers have one owner.** SETTING §3.8's vectors (MSD at the epoch 169,639.237; the epoch Sol 326 MY 211, a Wednesday, 19 Gleaning, Ls 174.0, Melas 00:31; Sol 1 of MY 212 at MSD 169,984; MY 211–216 of 669, 669, 669, 669, 668, 669 sols; the start at `solIndex` 169,904, Monday Sol 590, 5 Patience, Ls 316.4, 2351-12-19 02:20 UTC; Melas daylight) are pinned by one test, `setting-calendar`, and exported from it as a fixture module; TIME's tests 1, 3 and 5 import those vectors and check TIME's arithmetic against them, never a second copy of the numbers.

1. **Clock at the epoch and the start:** prints UTC (`2351-03-22 08:00:00Z`, Thursday), Unix days 139,237, JD 2,579,824.833333, MSD, MTC, Melas civil (`Sol 326 · 00:30`, MY 211, `solIndex` 169,640, a Wednesday), Ls; and the same for `START_MS` (`Sol 590 · 12:39`, `solIndex` 169,904, a Monday). Asserts them against `setting-calendar`'s vectors (UTC to ±1 min, sols exact).
2. **The slip:** for sol index 169,905 prints the ms of civil 00:00, 12:00, 24:00 and the next 00:00; asserts the slip is 2,375,244 ms, mean noon falls at civil 12:00:00.000 to the ms, and `marsLocal(atMarsLocal(…))` round-trips for every minute of one sol.
3. **Years and seasons:** prints the Ls-0 instant, Sol 1's MSD and the length in sols of MY 211–216, and Ls at each Ls-0 instant (0.0°); asserts them against `setting-calendar`'s vectors.
4. **Drift:** prints Melas time at 00:00Z on 5 successive days from 2351-03-23 (16:30, 15:51, 15:11, 14:31, 13:52) and the realignment period, 37.38 days.
5. **Sun at Melas:** prints sunrise, sunset and noon elevation at Ls 0, 90, 174, 270 and 316.4 without terrain (§2.5); asserts the start's and Ls 90 and 270 against `setting-calendar` to ±1 min.
6. **Faces:** prints every format of §3.1 at five chosen times, including inside the slip and a DTG.
7. **Activity durations:** for a reference marine (skills from SKILLS' 0.1 recruit), prints each activity's duration at Melas: shower 10:00, chow with 14 ahead normal 20:40, clean-rifle after a range day 39:00 at Weapon handling 10 and 40:33 at 9, a training night's sleep 8 h 9 min 35 s, suit-up at normal tempo 9:25 at EVA 6 and at emergency tempo, every skill-scaled duration through `paceOf` (SKILLS §5.12), a Ring session with its spin-up and spin-down, and so on.
8. **Lived against skipped** (`time-parity`, TECH §8.2): two identical states; one lives 8 h at 20 Hz (heavy), the other skips 8 h as an outcome; prints every quantity of §5.5's table for both, with the difference and its tolerance, and asserts each is within it (not equality: §5.5). Variants: a night in the bay, a shift on watch, a voyage day under thrust, a bleeding casualty (one deep limb wound, 30 min, blood within 0.1%), a compartment off its set point. A second part runs a seeded hazard 1,000 times both ways and prints the rates.
9. **Events land exactly:** an alarm at 05:20:00 during a sleep; prints the landing ms (exact), the activity's partial outcome, and that P5 events went to the ticker; a D and an S event at the same second resolve D first; two events at the same second and priority posted as `e999` and `e1000` resolve in posting order.
10. **Masks:** a table of every activity class against every priority, printed, compared with §7.3.
11. **Splash timing** (`splash`, shared with VIEWS §14): prints `S(m)` for the gaps of §6.2, and for every activity in §8 at its typical length the real seconds of its splash (brief or full, every phase) at a fixed frame rate: Melas' 10-minute shower 4.3 s, a night 7.7 s. Asserts the strip waits for a key only when the outcome holds a failed roll.
12. **Persistent placement:** a squad bay with 13 persistent people; skip 23:00 to 05:25; prints who is where and in what posture at the end and asserts it matches `whereIs`; a crowd area prints the throwaway count before and after recycling and the casualties kept.
13. **Plan of the Day:** prints a week of the standby from Monday Sol 590 in ms and Melas time, by weekday (Thursday's field day, Friday's inspection, the weekend's holiday routine); arrival times at −6, −3, +1, +5, +15, +45 min print their lateness classes.
14. **Chapter** (heavy): the default voyage (1 G, 6.9 days door to door) carried on with one allocation; prints each forced moment with its UTC, the number of day cards, the offers per day, the drills and the incident, the beats delivered (at least one a week) and the total compute in ms.
15. **Voyage:** prints chord, burn time, flip time, peak speed and door-to-door for 0.3, 0.38, 0.5 and 1 G departing Sol 602 (§12.5), felt G and deck state at 20 sample times, the secure windows, the ramp's fall from 1 and 2 m (§12.3), and light lag to Mars at departure, flip and capture. Asserts SETTING's tables quote `voyagePlan()`'s numbers.
16. **Determinism:** 3,000 ticks, an outcome skip of 2 h, 3,000 ticks; run twice and once with a save and load inside the skip's splash; prints the three JSON hashes and asserts equality; prints µs per tick and µs per simulated minute.
17. **Stop-motion exits:** enters stop motion, then each of death, knockdown, being pinned, being restrained, strapping in under 1.5+ G; asserts the state leaves still and every actor in the area moves on the next tick.
18. **Performance** (heavy): prints the times of §5.10 against their budgets, and the real seconds of a forced 120 s fast-forward in `mess` at noon (160 live agents, CONTRACTS §8; about 9 s) against the same gap as the outcome skip the crowded-area rule chooses there; prints which engine the rule picks for 45, 90 and 120 s gaps in the bay, on a range lane, in a berthing and in the mess.
19. **Knocked out mid-fight** (heavy): a fight scene; the player is knocked out for 11 minutes; asserts the `out` skip runs as a fast-forward, the fight's actors act tick by tick, the corpsman reaches the player at a tick the log records, and the skip turns into an outcome skip when the fight record closes; prints the ticks, the compute ms and the real seconds behind the blackout.
20. **Nobody pops in view:** for every splash kind (brief fast-forward, brief outcome, full, interrupted, a landing with a runner), records the set of actors drawn in visible (not inked) cells each frame; asserts no actor appears or vanishes in a visible cell except by walking across the view's edge or through a door, and that a runner lands outside the iris; prints the counts.
21. **Care is asked:** a spent day with the default care line, then with a skipped meal and a ration canteen, then on a rationed site; asserts nothing is consumed outside the ticked line (no personal item without its tick), and that a shortfall lands as a forced moment; prints the day's ledger of meals, water and items.
22. **The sol director** (with `bots-week`): over 1,000 seeded standby weeks prints the spikes per sol, the longest run of sols without one (at most 1), the kinds used and their spread (none twice in 7 sols), and the eligible kinds at Melas (at least 12).
23. **Pauses in headless runs** (browser): opens the page with `nostore=1` and with `bot=recruit` in headless Chrome; asserts the loop's pause reasons are empty after `__ready` and that the clock advances 1 s per second of wall time.

**As built in v0.0.4**, the tests are suites of their own, not one `time.test.mjs`: `time-activities` (test 7: every duration, engine and form, R's offer at every fixture of Head A and bay-2-1), `time-parity` (test 8, heavy: the shower, the night to the klaxon and the wait, fast-forward against outcome, held to 0.01 kcal and 0.01 mL), `time-interrupts` (tests 9 and 10: the klaxon lands at 23,532,601,000 exactly after 314 game minutes across the slip; the masks table; one S a skip, three a sol; 13 stops in 5.03 sols), `time-splash` (test 11), `time-placement` (test 12: the squad's rise, dress and count, 0 pops, no outfit changing in sight but in a dress frame), `time-pod` (test 13: a week of taps, reveille and the drill; the draw over 1,000 seeds), `time-determinism` (test 16), `time-stillness` (test 17), and `time-review` (the review's findings, each pinned); the moments are `moment-shower` and `moment-night` (heavy, ROADMAP §4.4).

---

## 16. What is ported from LONGHAUL and tradecraft

| Module | Verdict | What changes |
|---|---|---|
| tradecraft `src/sim/clock.js` | **adapted** (built in 0.0.x as `src/core/clock.js` and `calendar.js`, TECH §1.2) | kept integer ms, `TICK_MS 50`, Hinnant's civil-date code and the text helpers; epoch moved to 2351-03-22 08:00 UTC; Moscow's `TZ_H` removed; Mars local time, MSD and the Mars year added. In 0.1: the slip centred on mean midnight (§2.4), SETTING's year rule and Ls (§2.5) bound in `sim/time/dates.js`, the week, DTG |
| LONGHAUL `js/core/clock.js` | **port** `formatDuration` only | from minutes to ms; the rounding rule kept ("59.6 min is 1h, not 0h 60m") |
| tradecraft `src/sim/game.js` `skip()` | **reference, rewritten** | the contract kept (bleeding minute by minute, heal, gauges, crowd recycle, rollovers, autosave); rebuilt as an incremental, interruptible engine with an event queue, two kinds, the splash's slicing, and landing |
| tradecraft `src/main.js` loop | **adapt** | the accumulator, the 5-tick cap, card pause, hidden-tab pause and autosave, error containment, the debug skips; plus the splash's per-frame `advanceSkip` and the window-blur pause |
| LONGHAUL `GameLoop.frame` (`sim/game.js`) | **reference** | `alpha` interpolation, frame budgets for background work; its "lite" steps, its minute atom and its warp ladder are not used (§5.2) |
| tradecraft `src/sim/reflex.js` | **adapt** (COMBAT owns it) | reflex on landing from a skip; `KEEP_S` kept |
| tradecraft `src/sim/shooting.js` phases | **adapt** (WEAPONS owns it) | the choose/act freeze rule kept as the stop-motion clock |
| tradecraft `src/sim/reading.js` | **adapt** | 10-minute chunks for reading and study, "one more chunk" |
| tradecraft `src/sim/crowd.js` `recycle`, `lies` | **adapt** (PEOPLE owns it) | `RECYCLE_S 120` kept, re-expressed on areas |
| tradecraft `src/sim/interiors/staffing.js` | **adapt** (PEOPLE owns it) | the 2-minute jump rule generalised to every persistent person's `whereIs` |
| tradecraft `scenarios/campaign.js` `passTo`, `campaign.js pass` | **reference** | the day-by-day catch-up producing papers becomes the chapter's day loop and the papers cadence |
| LONGHAUL `js/sim/world.js` `transitStateAt`, `traffic.js` | **adapt** | the transit closed form becomes `voyagePlan()`'s `placeAt` in `src/world/voyage.js`; legs and deck states added; no guidance overhead, as on LONGHAUL's rails (§12.5) |
| LONGHAUL `js/sim/autopilot.js` crew policy and flip interlock | **port as data** | `PREP_MINUTES 10`, `FLIP_MINUTES 6`, secure 30 min before a flip, 10 min after ignition, the last hour, `SECURE_LINGER 10`, the 1.5 G line |
| LONGHAUL warp caps (`game.js`) | **not used** | ship combat's hold points are COMBAT §13.3's (§12.4) |
| LONGHAUL `js/sim/intel.js` `relay` | **adapt** | light-lag delivery into the event queue |
| LONGHAUL `politics.js`, `conflict.js`, `forces.js` cadences | **port the slots** | minutes 300 and 420 become 05:00Z and 07:00Z; :17 and :41 kept |
| LONGHAUL `js/sim/ephemeris.js` | **reuse as is** | `days = ms / DAY_MS`; Mars' rotation for views comes from TIME, not `rotH` |
| LONGHAUL `js/sim/worlds.js` `solarDayH` | **reference** | the sol is the constant `SOL_MS`; `solarDayH` gives the other bodies' days for §2.6 |
| LONGHAUL `planetary.js`, `shuttles.js` (`reach`, `planLegs`) | **adapt** (PLACES and COMBAT own the rides) | felt-G timelines for drops and ascents |

---

## 17. Fun

**The decisions time creates.** Every sol has about three free hours and a body that wants more than three hours of things. Drill rounds and the rifle (the armourer's inspection tomorrow), the squad leader's hip-pocket class (hours you can't get from a manual), a chapter of an MCI course (composite points toward Lance Corporal), a letter (it takes 19 minutes to reach Earth and a week to be answered), cards with the squad (the friend you'll need on Europa), the barber (Friday's inspection), or sleep (the debt from last night's fire watch). Every offer shows its price in minutes and what it leaves before the next formation (§8.1, §8.9). The Plan of the Day is the frame; the free time is the game. Inside the frame, how hard you go is a choice too: push the run and risk the ankle, coast the class and risk the instructor's eye (§9.3).

**The stories it makes.**
- The alarm in the shower: a towel, wet boots, general quarters, and the walk to your couch at 1 G with your utilities in your arms.
- General quarters with the rifle in pieces on the cleaning mat: reassembly as stop-motion steps while the 1MC counts.
- The slip watch: two hours thirty-nine at the squad bay door at the dead of night, fatigue rolling against you, and the Officer of the Day's boots in the passageway.
- Five minutes early is on time: the chow line ran long, the late card said "fit it in", and you ate half a tray at a run.
- The air handler that died at 02:00 and the whole bay waking with the same headache; the rover on its roof on Valley Road and your hands on someone's leg (§9.8).
- The flip on day four, taken in the gym because you didn't believe the call: the deck letting go of you.
- "This is not a drill": the fifth alarm of the voyage, and the first one that meant it (§12.8).
- Asleep in the rec room, nobody woke you, and the platoon fell in without you.
- A week of carried-on voyage days, and on day five the squadmate who wants to talk about home, at 02:00, in the berthing.

**Where it would turn into chores, and what removes them.**

| Chore | Removed by |
|---|---|
| queueing for chow, the armoury, the barber | the queue is inside the activity's skip |
| dressing and undressing | activities, brief splashes |
| the bladder six times a sol | BODY's rates tuned to 3–4 toilet visits a sol (BODY's call), and the instinct offering the head at good moments (before formation, after chow) |
| a 60-minute PT run at 1:1 | the block's opening is lived, the body carried on at a stance |
| carrying on as a free win | the stance keeps effort's price in a skipped block (§9.3) |
| the second, fifth and twentieth range day | the first is lived; later ones carry on relay by relay |
| waiting for a formation, a ride, a window | stand by, with company |
| a sol with no spike | the sol director's incident every one or two sols (§9.8) |
| a quiet sol (from 0.2) | "call it a day" at your rack on holiday routine and in dwell weeks; never a way to a block (§9.7) |
| a week's voyage | chapter days with "carry on", the care line and offers, stopped by forced moments, drills that vary and the one real incident (§10.3, §12.8) |
| the same drill every few days | kinds dealt without repeats, graded squad against squad, the familiar parts fast and the twist lived (§12.8) |
| interrupt spam | one social interrupt per skip, three a sol, mutable kinds; ambient to the ticker |
| splash fatigue | brief splashes under 3 min, "to the end" at any time, at most 8 s of time-lapse for anything, and the strip waits only for a failed roll |

What is never removed: walking (the base is where the world is), the moments of danger, and the first time of anything.

**The real-time budget of an active sol** (the hub: 40–70 real minutes). A training sol played with one lived set piece (a range relay) and a lived evening:

| Part of the sol | Real time |
|---|---|
| reveille, dress, muster, the walk to PT | 2 min |
| PT (opening lived, carried on), shower, chow, the walks | 4 min |
| formation and its inspection | 1.5 min |
| training A: the range, two relays lived, two carried on | 18 min |
| noon chow, formation, training B carried on with one big beat | 6 min |
| maintenance and evening chow | 2 min |
| free time: a hip-pocket class, a letter, an hour in the rec room with two conversations | 12 min |
| shower, taps, a night with a fire watch | 4 min |
| total | about 50 min |

---

## 18. Build order

**0.1, a standby week at Base Melas.**
- The clock: UTC, MSD, Melas time with the slip centred on mean midnight, SETTING's Mars year and Ls, the week; all formats; `core/calendar.js` aligned to §2.4–2.5 and `sim/time/dates.js`; tests 1–6 against `setting-calendar`.
- Devices: the wrist terminal (faces, alarms, the PoD), wall clocks in the squad bay, mess, head and ops; the HUD clock rule, also for offers and warnings; the no-device estimate.
- The loop: 1:1, the five clock states, Space, card pause (screens and the terminal live), card actions, blur and hidden-tab pause with the headless exemption; stop motion's clock rules for the range.
- Both skip engines with the crowded-area rule, the event queue (heap saved as it is, ties by `seq`) with pre-drawn hazards, the splash (brief and full, ink beyond the iris for every outcome skip, to the end, stop here, the strip held only on a failed roll, interrupts with the beat and landing), reflex on landing, the `out` skip in a fight.
- Interrupts D, A, O, B, S, with sources: the base alert drill, reveille, alarms, summons by PEOPLE's squad leader, BODY's crossings, the sol director's incidents.
- Activities: hygiene, chow, sleep, nap, rest, dress, suit-up at both tempos, clean-rifle, load-mags, armoury-line, kit, field-day, PT, gym, the Ring and the Long Arm, range, class, drill, read, study, letter, read-mail, socialise, stand-by, watch, sick-call, px, barber, laundry; §8.9's free time (hip-pocket classes, drill rounds, the bounding league, the Ring's evening seats, calls home, MCI courses, mentoring, volunteering).
- The Plan of the Day: the one table by weekday (Thursday's field day, Friday's inspection, the weekend's holiday routine), standby rules, lateness and the late card, fire watch with the relief call, "the first time is lived", stances, the sol director and its garrison table.
- No "call it a day" (§9.7).
- Autosave cadence, Ironman's extra triggers; tests 7–13, 16, 17, 19–23.

**0.2, the voyage.** `voyagePlan()` at SETTING's 1 G default, sampling, secure windows and maneuvers as forced moments, ship UTC days and the detachment's PoD, chapters over days with carry on, the day card's care line and offers, the story beat a week, drills that vary and are graded, the voyage's real incident, papers (pay, orders, mail with light lag, the news), the world layer's hourly and daily slots running LONGHAUL's politics and conflict; the Melas–Phobos lift by assault lander; the splash's time-lapse of people walking in and out of the iris (§6.3, VIEWS §5.1 and §16); "call it a day" at the rack on holiday routine; tests 14, 15, 18.

**0.3, Europa.** UTC towns with three shifts and town lighting, the surface's dose clock and sun, the drop ride, rotation chapters with patrol shifts as forced moments.

**Later** (ROADMAP §3.4's numbers). Ship combat from a couch with COMBAT §13.3's hold points (0.4); leave and the first dwell, with "call it a day" in dwell weeks (0.4); schools and long hospital stays as week chapters (the Corporals Course, 0.4, and on); special-operations clocks (mission elapsed time, the suit's consumables under EVA, 0.6); Callisto and Ganymede.

---

## 19. Cross-references

What TIME relies on, by section, and what the review asks of each owner where TIME's rules now differ from their text (they align in their next change; until then this section and the hub decide):

- **DESIGN.md (the hub):** name TIME as the owner of the sol's rhythm under Pillar 8 (the sol director, §9.8). The Time settled decisions' "an open overlay pauses" reads, with VIEWS, as "a card pauses; in-world screens and the terminal run" (§4.2).
- **SETTING:** the calendar's definitions, imported from `src/data/setting/calendar.js` (§2.5); the start (§3.7); the names of the clocks ("Melas time", "UTC" or "Zulu"), the wrist terminal's name, the slip's lore and the "short day", Europa's shift names (SETTING §3.6); MCRN doctrine on troop voyage profiles and the one transport class (SETTING §6.3, §6.5). *Answered* in SETTING's revision: §2.4 and §6.5 quote `voyagePlan()`'s door to door (6.87 days at 1 G departing Sol 602) with no +8% (§12.5; CONTRACTS §14), and `SITES.melas.latDeg` is PLACES's −10.5. *Answered:* §18 records the thrust and the method among its settled calls, which the user may overrule (§20). *Asked:* the `setting-calendar` test exports its vectors for TIME's tests (§15).
- **PLACES:** Base Melas' exact latitude and longitude (287.2° E, 10.5° S, PLACES §4.1) and the canyon's horizon profile; fixture uses and spots; muster areas as polygons; entrances for walk-ins; nav paths and their lengths; each site's water rule for showers and when a site is rationed (§10.3); timetables for rides; the environment's per-minute step and its `steady` flag, with step functions shared between the 1 Hz and per-minute layers (§5.5); **tolerances for pressure, temperature and gases** in the parity contract (my defaults in §5.5 until set); the Ring's spin-up, spin-down and seats (§8.6, §8.9); the laundry machines as world timers; wall clocks as fixtures; the content of the garrison incidents it owns (§9.8) and of the voyage's drills and real incident (§12.8). *Answered* in PLACES's revision: §4.3 times its walks at BODY's 1.14 m/s, indoors and out, on the plan as v0.0.2 compacted it (808.7 m, 11.82 minutes; CONTRACTS §19, item 2, settled 2026-11-06); §5.2's transport is SETTING's Coprates class, its felt G the filed profile's (1 G out by default), with no cruise G of its own.
- **BODY:** needs as ledgers advanced by `bodyAdvance`, with `nextCrossings` and `bodyPeek` (BODY §2.6, which owns them; §5.5 follows it); bleeding and heat as step functions of Δ shared by every layer (§5.5); `heal(person, days)` that composes over fractions of a day, called only by the hourly healing slot; core heat; dose rate, limit and the dose clock; G exposure from `feltAt`, and the day's G stimulus after 45 min (§8.6); sleep pressure, natural waking, sleep depth and inertia; the circadian phase and misalignment for the estimate; consciousness and its crossings (`out` skips); walking speed by gravity and state; impact effects, including the ramp's 1.3 m/s and an instant relight's 4.4 m/s (§12.3); the stances' body numbers (§9.3); the 3–4 toilet visits a sol tuning. *Answered* in BODY's revision: §2.2's day layer is the one `local@00:00` job and no longer heals, its "04:00 body time" only the body clock's marker (§11.3); §7.1's sleep figures use §9.2's 05:30 reveille (8 h 9 min 35 s in the rack); `body-cond` and §14.1 print SETTING's two voyages (1 G out for 6.9 days, 0.3 G home for 12.5).
- **SKILLS:** *answered*: §5.12's `paceOf`, which §8.1 uses for every skill-scaled activity (its `chorePace` withdrawn); training-hour credit for lived and skipped blocks at their stance (§9.3); class resolvers; the asleep-on-post and nodding-off checks; tempos for the range's stances (SKILLS §5.9); Awareness DCs for reflexes on landing.
- **WEAPONS:** dirt factors; strip, clean and reassembly as steps (the field-stripped state on landing); magazine loading times; the range block's resolver and relays at a stance; stop-motion step durations; the drill-round box (§8.9); the lost-weapon lockdown's content (§9.8).
- **COMBAT:** `threatKnown(state)`; reflex kinds and DCs; general quarters and alerts as events; suit-up's emergency tempo numbers (§8.2, from COMBAT §13.2); the encounter director's encounters as events with approach paths; field-exercise resolvers; drop-ride scenes and the G cap for troop landers; ship combat's hold points (COMBAT §13.3, cited in §12.4); the drills' content (§12.8). *Asked:* §3.6 says what §4.5 says: an `out` skip in a fight is a fast-forward, not an off-screen exchange.
- **PEOPLE:** `whereIs(person, ms)` (PEOPLE §4.6); rosters and the PoD's content by block id; the relief call's forgetting; discipline from lateness records; story beats for the weekly guarantee; S events (someone coming to talk); offers for the day card (§10.3); the hip-pocket classes and the bounding league (§8.9); content for the incidents it owns (§9.8); tier-3 daily outcomes; crowd recycling, density and casualties; the mess line model and the occupancy curve (§6.3, 0.2). *Asked:* §4.2's and §11.10's "sol 6" inspection is Friday's (§9.2); §13.2's hourly pass runs at :05 UTC, its per-sol pass and §15.2's arc director at §11.3's slots, not "inside the timeslip".
- **CAREER:** pay's epoch and amounts; orders, evaluations and their cadence; mail content; the first-time-lived list for the tutorial; deployments' voyage profiles within SETTING's doctrine; schools, leave and hospital stays as chapters; Ironman. *Answered* in CAREER's revision: §5.4 books its lessons into §9.2's blocks by weekday (the mission rehearsal exercise on the second Monday and Tuesday, CONTRACTS §3); §5.7's orders paper takes its dates from the calendar; §7.3's G-1 stint is 2 h, inside Friday's `train-b` with the Long Arm (§8.6), and a G-3 recruit deploys with a note; §14.3's mail call is §9.2's 18:30.
- **VIEWS:** the splash's look, the iris (`SPLASH_IRIS_M` 3.5 m) and the close plates; the day page; the clock faces' drawing; the outcome strip's icons; drawing to §6.2's timing and §6.4's keys (its own curve and Esc-to-skip replaced); the papers tray; the reading-light threshold; the time-lapse of people walking through the iris at 0.2 (§6.3; VIEWS §5.1: nobody dissolves). *Asked:* §8.8 says whether a letter opened from the terminal opens as a pausing paper card (TIME assumes it does, §4.2).
- **TECH:** the module layout and paths (§1), the tick's implementation, the event heap (§5.6), the slicing of skips across frames, saves and the `time` key's additions (§13), the debug handle (`__olympus.skip(ms)` runs an `idle` outcome skip with mask `D`), URL parameters (`&t=MY211.S590.1240` for Melas time, `&utc=2351-12-19T02:20Z`), the headless exemption from the blur and hidden pauses and `withGame`'s check (§4.2). *Answered:* §6.1 lists the `time` key's additions (`slowToMs`, `director`, `stances`, `drills`), and §3.6 picks the loop's mode by `skip.engine`, so an `out` skip in a fight is lived ticks (§4.5). *Asked:* §8.2's `time-parity` runs test 8 at §5.5's tolerances; the bench tunes `FF_ACTOR_S_MAX`.
- **ROADMAP:** moment 3 cites §8.6's G-house block; moment 5's "sol-6 bay inspection" is Friday's (career sol 4); 0.2's tests and the `passenger` bot assume SETTING's 1 G voyage (about 7 days), with offers, drills and the incident printed.

---

## 20. Open questions for the user

1. **The clock in the slip.** KSR's clocks freeze at midnight for the slip. The default shows `24:00 +12`, the minutes into the slip counting beside the frozen time. The alternative is a fully frozen `24:00` with no counter. Default: the counter.
2. **Talk and the clock.** Ordinary conversation costs no game time, as decided at kickoff ("time stands still while you talk"). Long talks (briefings, counselling, an hour of cards) are activities with durations. Should short conversations also cost their spoken time? Default: no, because charging it afterwards would make the world jump in view.
3. **Skipping under a known threat.** The default refuses any skip while your character knows of a threat, except the activities that answer an alarm (strapped in, standing to). Default: refused.
4. **Lived blocks.** "Living" a 60-minute PT block or a 3-hour class means its opening, its beats and its closing are lived, with the body carried on at any point you choose, at a stance (push, steady or coast; attentive or resting your eyes) that keeps a price on effort when you carry on. The alternative is that a lived block runs all of its length at 1:1. Default: opening, beats and closing, with stances.
5. **The first voyage's thrust** (SETTING §18 records it among its settled calls, which the user may overrule; restated here so the answer reaches both). The Corps flies its troops at 1 G ("fight at one G"): 6.9 days door to door at the start's geometry and a week of Earth weight for Martian bodies, which the Ring is there to prepare. Or the Navy saves the drive and flies at 0.3 G: 12.5 days, gentler, longer. Either way the timeline is the closed form plus the real legs, as every hull on rails flies in LONGHAUL's world, without LONGHAUL's guidance overhead (§12.5). Default: SETTING's, 1 G out and 0.3 G home.
6. **Interrupt preferences.** Social interrupts (mail, messages, someone wanting a word) are capped at one per skip and three a sol, and can be muted by kind on the wrist terminal. Should they be mutable at all? Default: mutable.
