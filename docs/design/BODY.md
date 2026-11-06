# BODY: the marine's physiology

The spec for every body in OLYMPUS: the player's, and those of the persistent people of PEOPLE.md's tiers 1 to 3. It settles needs, air, water, heat, radiation, gravity acute and chronic, sleep and the body clock, fitness, locomotion in every gravity, wounds, medicine, suits as life support, drugs and death, with rates and units, state shapes, algorithms and tests. Written 2026-11-05 from the user's brief and DESIGN.md's settled decisions, with numbers checked in a scratch script against published reference values (named where used). Revised the same day after five critics' review: the interfaces with SKILLS, TIME and CAREER, the thermal, CO, anoxia, decompression and G-conditioning models, the suits and the shielding were reworked and every changed number reprinted from a scratch run. Aligned the same day with `CONTRACTS.md`, the shared contracts (the job slots, the body saved as deltas, items and ids, the voyage profiles, the milestone numbers), which this file cites rather than restates; §14.1's voyage figures were reprinted for SETTING's two voyages. Where this file and DESIGN.md disagree, DESIGN.md wins until one is corrected.

Revised 2026-11-06: §14.1's `gqClass` runs CAREER §7.3's G classes (CAREER owns the gates); the standby's conditioning figures read `STANDBY_SOLS` 10 + slip and 2/4's 980 (CONTRACTS §3, §15); healing off the map runs in the hourly `hour@:35Z` slot (§24); the suit's sample ids no longer collide with TECH §6.7's magazine (§19.2). Every body here belongs to a generated person (the user, 2026-11-05: "All people generated"): the traits a body draws (`traits` in §2.5) come from the world's seed with the person.

Revised 2026-11-06 for v0.0.4 as built (the build sheet `docs/build/0.0.4.md`, the body role's report, the review's fixes; DESIGN.md's log of that day): the record at `v` 2 (§2.5), rates held per minute cell (§2.6), the module map (§2.7), food water released as it is absorbed (§3.5, §4.1), the training sol's water as measured (§4.2), the sols to death without water (§4.3), the heads' rhythm (§5.3), stubble and the beard (§6), the sleep balance as measured and its open question (§7.1, §29), the body clock through the slip (§7.2), stamina on Mars (§8), the thermal port (§10.3, §10.4), the gaits rounded (§16.1), the mods' split (§22), the interrupting crossings (§23.3) and the suites (§25). Only the player's body is simulated this round; the squad's carry `{ v, tmpl, heightM, build }` until their needs come (0.0.9).

How to read it: units are in the names (`gutKcal`, `doseSv`, `pressKpa`); the user's decisions are quoted with their date; my own decisions are marked "(my call)"; numbers are constants for the builders, to be tuned in play and printed by the tests in section 25.

## 0. The model in one page

- **One body, one model, everyone.** The player and every persistent NPC carry the same `body` record and run the same functions. Off-map people get the same closed forms through the skip (section 2.6). The crowd gets a stub (section 24).
- **Four cadences.** A fast layer at 20 Hz for what changes in seconds (G-LOC, decompression, suit pressure, stamina, gait). A second layer at 1 Hz for bleeding, pain, air dose, heat, radiation dose and drugs. A minute layer for needs bookkeeping, thresholds and morale. A day layer, the one `local@00:00` job, for conditioning, bone and plasma; healing runs hourly in its own slot, and fitness weeks and rust at their absolute periods (TIME §11.3; CONTRACTS §5). Every accumulator has a closed form or a fixed sub-step, so a skipped hour and a lived hour give the same body (tradecraft's rule, kept).
- **Needs are physical quantities, not bars.** Food is kilocalories in the gut and in reserve. Water is litres of body water against euhydration. The bladder is millilitres, the bowel grams. Hygiene is grime from sweat, dust and time. Sleep is hours of sleep pressure against a body clock that drifts between Mars sols and ship UTC days. Each turns into named roll modifiers at stated thresholds, and each has a hard end (collapse, accident, death) that the instinct warns of before it lands.
- **Air is partial pressures.** The body reads the inspired O₂, CO₂, CO and total pressure of whatever it breathes (a room, a mask, a suit loop). Hypoxia is driven by the published time-of-useful-consciousness table (11 s in vacuum, 4 min at 25,000 ft equivalent). Brain injury runs on two clocks: minutes without oxygen, hours in severe hypoxia. CO₂, carbon monoxide by partial pressure and ventilation, ebullism below 6.3 kPa, lung and ear barotrauma, and decompression sickness from tissue nitrogen are each a numbered model. Martians living in 66 kPa air are naturally ready for a 34 kPa suit; a marine off a 101 kPa ship needs four hours on oxygen, two with exercise, or a suit run high.
- **Heat is a heat balance on two nodes**, a core and a skin shell (Gagge's two-node model). Metabolic watts against losses through clothing, air (thinner air carries less heat) and a cold night sky, with vasomotor control, sweating and shivering, feeding tradecraft's core-temperature stages. The shell cools first, so the core falls at 1 to 2 °C an hour in a bad night, after frostbite has already begun. Suits remove at most 450 W; work harder and you cook.
- **Radiation is dose.** Effective dose in sieverts per place, from PLACES's `doseAt` (Melas floor 0.08 µSv/h; Europa's surface 5.4 Sv/day), one shielding curve for suits, cabs and ice, a dosimeter that is the only way you know it, acute radiation syndrome and burns from a repair-weighted acute dose in gray-equivalents, and a career dose that CAREER turns into limits and late risk.
- **G is a vector on a posture.** Acute: +Gz drains a 6 s brain-oxygen reserve past a tolerance threshold (5.0 G for a conditioned marine, relaxed), giving grey-out, blackout and G-LOC; +Gx loads the chest. Couches, the anti-G straining manoeuvre (held, and paid for in stamina) and LONGHAUL's juice (÷3, ÷4.5 above 6 G) raise the line, re-based to seconds, with LONGHAUL's hangovers. Chronic: **G-conditioning** (in G) follows the gravity you live in and the hours a week you spend at 1 G; bone, plasma volume and vestibular adaptation move toward the gravity you live in.
- **Locomotion is honest.** Gait speeds follow gravity (walk 1.45 m/s on Earth, 1.14 on Mars, 0.88 on Europa), traction is μ·g so stopping takes longer in low g, mass keeps its inertia while weight falls, a jump leaves faster in low g and goes far higher, falls scale with 1/g, and free fall is push-off, drift, handholds, mag boots and two named thruster packs.
- **Wounds and medicine are tradecraft's**, ported: six parts, typed injuries, blood %, bleed rates, adrenaline, a pain limit tied to Fitness, knockdown, infection as a hazard race, healing by day. Added: pneumothorax, junctional bleeding, burns by body area, frostbite, pressure injuries, radiation burns, concussion and hearing. First aid is re-cut into TCCC's MARCH order with an IFAK and a corpsman's bag.
- **Two suits as life support**: the light vac suit (HAD Mk 7) and the hardshell (HAD M-22), with their consumables, leaks, heat, donning steps and costs to the body.
- **The body is in every roll** through SKILLS §5.4's two helpers, `bodyMods(p, key, ctx)` and `needMods(p, key, ctx)`, which every check and every displayed odds call, keyed by the skill's `uses`. Every modifier is `{why, v, src}` and readable in the log.

## 1. What the user asked for, and the rules this section obeys

The brief (the user, 2026-11-05): "pretty realistic gameplay where we have to manage the day to day of that life (slow paced game, with emphasis on realism and depth like managing hygiene levels, weapon controls like managing safety, muzzle discipline, fitness, medical aid and healing etc.)"; "Realism in physics, air, gravity, space being big and travel taking a long time, health effects under G and not under G"; "the itch of space world (air management, gravity effects, water management, single player survival with bodily functions ...)"; "taking a shower will take a chunk of time forward on the clock"; "There should always be a base where we go back to do things like eat and shower at the end of the day".

Carried from the user's earlier games, and binding here:
- "health bodypart by bodypart"; "work on the bleeding out system, with blood-pressure health stat"; "bandaging, splinting and other kinds of medical first aid. Also make sure we have the right skills to drive how good we are with medical stuff" (tradecraft, 2026-10-26).
- "hunger and stress needs" (2026-10-27). "Implement a robust health system inspired by Rimworld and Project Zomboid" (2026-10-28). "when sleeping, the hunger meter is frozen that's a bug" (2026-10-28): every meter runs through sleep and skips.
- "i never asked to take the medication when washing up" (2026-10-31): **nothing is consumed unasked**. No automatic drinking, eating or dosing, except what a machine does by its own design and says so (the couch's juice injector, the suit's emergency O₂).
- "extreme fatigue (like from not sleeping for too long) should chip away at skill efficiency"; "a notion of fatigue preventing among other things, working out more than once a day"; "fitness should remain a skill, but there should be a shadow skill called effective fitness ..."; "add temperature, seasons ... also add hypothermia and heat strokes"; "wounds should slow everyone down especially gunshot wounds"; "shot in the head should mean something"; "medicine skill should lead to us rolling for diagnosis" (all 2026-11-03).
- "there should be a limit to how hungry we get before we pass out and die or get taken to a hospital"; "Adrenaline should be modelled as a short term pain reduction thing"; "Pain resistance should be linked to fitness level, over a certain pain threshold, people just lit up against a wall or lie down"; "being knocked down is a logical result of getting shot. Staying down should be justified (pain level, shot in legs, blood loss, loss of consciousness)"; "Moving away should increase blood loss if realistic"; "every first aid action should also take time proportionally to medicine skill"; "remove the ability to just rip a strip from a shirt to bandage on the fly ..." (all 2026-11-04). No infinite improvised supplies; the `IMPROVISED −2` modifier waits for crafting.
- LONGHAUL: "juice consumes way too much medicine on high burns, there should be a steep cost in terms of aftereffects, but the dosage shouldn't be that high" (2026-10-19). 1.5 G is the user's line where walking about stops and juice starts (longhaul, 2026-03-27). Conditions have a life cycle: measured, healable, or held until a hospital (longhaul v1.12.16, 2026-10-31, after the user found a crew "BURNED for good").
- "we only know what we know" (tradecraft, 2026-10-26) and DESIGN's HUD rule: **the body reports in sensations, and numbers only through an instrument the character has** (section 23).
- "There should be a reflex mode, where time stops when things require it" (tradecraft, 2026-11-03), with the brief's splash: a fast decompression, a fall and a knockdown each raise TIME.md's reflex card when a choice still matters (a G onset is a held step instead, 13.3), and "the reflex window is spammed on us too, there should be a way to remember our choice for a while" (2026-11-04) holds (section 26).
- "what we see is what our character evaluates as being true" (tradecraft, 2026-10-28): the sheet and the papers report what the character could know (section 23.1).

### 1.1 Where the model bends, and why
- **Juice** (13.2): LONGHAUL's protection factors let bodies sit at multi-G for hours; real physiology does not. Kept as the setting's rule.
- **LONGHAUL's unsecured G timeline** (13.5): a body lying unsecured on a deck at 3 G is injured at 50 min, unconscious at 59 and dead at 106, as LONGHAUL measured. Real supine +Gx at 3 G is tolerated for hours (NASA SP-3006, the Bioastronautics Data Book, puts voluntary end-points, not death, near 4 G for an hour). Kept with juice, as part of LONGHAUL's G rules the user built and tuned (juice since longhaul v0.3.5, 2026-03-23; 1.5 G as the line where walking stops, 2026-03-27), and printed for parity.
- **The Corps' centrifuge regime works better than any tested** (14.1, my call): four hours a week at 1 G hold a Martian marine at 0.9 G of conditioning. Bed-rest trials with daily centrifugation (AGBRESA, DLR, NASA and ESA, 2019: 30 min a day at 1 G at the centre of mass for 60 days) protected orthostatic tolerance only in part, and muscle and bone little. OLYMPUS's marines also live and train at 0.38 G, but the strong effect is still a setting rule, so the Plan of the Day can keep a battalion deployable.
- **Hypoxia** runs on the time-of-useful-consciousness table, not on a model of oxygen transport: it reproduces the reference times exactly and is cheap.
- **Sleep pressure** is linear, not Borbély's exponential: it keeps the user's hours-awake thresholds and resolves exactly over skips. A deeper night after a long day (`depthK`, 7.1) stands in for the exponential's faster clearance at high pressure.
- **Hypothermia** stops the heart at 28 °C as a reversible arrest, simpler than real fibrillation risk spread over 28 to 24 °C.
- **G-conditioning** is one number in G standing for muscle, cardiovascular and orthostatic fitness for gravity; bone and plasma are kept apart because they move on different clocks.
- **No fat gain** before 1.0; deficits do cost mass.
- Hazard rates (faints, accidents, skin trouble, AMS, training injuries) are my calls, to be tuned in play; each is printed by its test.

## 2. Architecture

### 2.1 One body for everyone
The `body` record (2.5) belongs to every person with a sheet. The functions take `(body, env, ctx)` and return facts; they never touch the DOM or the bus directly (the caller emits). NPC persistent people run the fast layer only while on the live area (PEOPLE.md sets the LOD); off-map they are advanced by `bodyAdvance()` in closed form when their state is needed.

### 2.2 Cadences

| Layer | Rate | Runs |
|---|---|---|
| fast | every tick (50 ms) | gait and traction, stamina, G-LOC reserve and vision, suit pressure and leaks, decompression (ebullism, barotrauma triggers), breath-hold, falls and impacts, zero-g drift and grabs |
| second | every 20th tick (1 s) | bleeding (tradecraft's `bloodTick`), pain and adrenaline, hypoxia dose and the brain clocks, CO₂ and CO loads, heat balance (two nodes, on the game's 10 s grid), radiation dose, suit consumables, drugs' concentrations, microsleep hazard |
| minute | every 60 s, and at each skip's sub-step | energy and water ledgers' thresholds and words, bladder and bowel stages, hygiene, sleep pressure, the body clock, morale drift, infection hazard sums, DCS tissue nitrogen, AMS |
| day | the one `local@00:00` job (TIME §11.3; CONTRACTS §5) | bone, plasma, G-conditioning, vestibular adaptation, ARS phase changes, mass from deficits; fitness weeks and rust roll at their own absolute periods (`every@<ms>` at `FIT_WEEK_MS` and `RUST_PERIOD_MS`, SKILLS §7 and §8); healing is the hourly `hour@:35Z` slot only; 04:00 body time stays the body clock's marker, never posted |

The second and minute layers run inside the 20 Hz loop on their tick boundaries (TECH.md's tick order places the body after movement and before perception).

### 2.3 Inputs the body reads

`env`, from PLACES.md (the room, the outdoor chunk, the suit loop or mask when one is sealed):

```json
{ "pKpa": 66.0, "o2Kpa": 21.1, "co2Kpa": 0.40, "coPpm": 0, "airC": -30, "radC": -43, "windMs": 5,
  "rh": 0.35, "doseRateSvH": 8e-8, "gyPerSv": 0.4, "skinRateGyH": 0, "lux": 0.5, "lightCycle": "sol", "dust": 0.2,
  "gG": 0.38, "gDir": [0, 0, -1], "surface": "regolith", "mu": 0.5, "ferrous": false,
  "fire": 0, "smoke": 0, "noiseDb": 35, "water": "potable", "vacuum": false }
```

(A clear night on the Melas floor.) `gG` and `gDir` are the felt acceleration in the area frame (surface gravity, ship thrust from TIME.md's voyage, zero in free fall). The body combines `gDir` with its posture (section 13.1) to get the Gz and Gx components.

`radC` is the mean radiant temperature, which PLACES builds from its weather and walls by view factor: the sky's radiant temperature from a clear-sky formula of Swinbank's or Brunt's kind (far below the air on a clear, dry night: about −55 °C over −30 °C air at Melas, nearer the air's under dust or fog), the ground's, and the sun's absorbed load by day. A marine standing in the open sees half sky and half ground (−43 °C in the example); indoors `radC` is the walls'. `gyPerSv` converts the field's effective dose into the gray-equivalents that drive acute effects (12.2): 1.0 for Jupiter's electrons and their photons, 0.75 for solar protons, 0.4 for galactic cosmic rays (my calls; PLACES tags each field).

`activity`, from TIME.md's activities table while one runs, otherwise derived from gait and action: `{ met, kind, posture, sleep, eats, drinksL, toilet, wash, shave, exercisePts, stressPerH }` (section 3.2 gives MET values; TIME.md owns durations).

### 2.4 Outputs
- `bodyMods(p, key, ctx)` and `needMods(p, key, ctx)`: the lists of `{why, v, src}` for a roll on skill `key` (section 22, SKILLS §5.4's contract). The roll and every displayed odds call both (fixing tradecraft's displayed-odds quirk, `shooting.js:178` against `:456`).
- `perf(body, regime)` and `gqClass(body)` for CAREER's tests (14.1).
- `bodyAdvance()`, `nextCrossings()` and `bodyPeek()` for TIME's skip (2.6).
- `capacity(p)`: `{ walkK, runK, sprint, carryK, reachM, fineMotor, visionK, hearingK, canStand, canAct, consc }` for movement, perception (PEOPLE.md) and the step panels (WEAPONS.md, COMBAT.md).
- Facts on the bus: `body-stage` (a need or condition crossing a threshold, with words), `body-event` (vomit, accident, faint, microsleep, G-LOC, knockdown), `body-interrupt` (for TIME.md's interrupts, section 23.3), `body-dead`.
- `bodyLine(p)`: the instinct's body line, in priority order (section 23.2).
- **Built in v0.0.5** (`src/sim/body/eyes.js`, section 23.4): `eyeView(rec, ms)` and, for a body with no eyes' record, `eyesAdaptedTo(field)`, each returning `{ a, gain, coneGain, lightK, rod, glare, shut, nv }`: the one helper the picture's exposure and perception's reach both read (through PEOPLE's `eyeViewOf`, PEOPLE §7.6). `coneGain` is `(Y_ref / Y_c)^0.2` with the cones' own state `c`, never over `gain` (1.07 fully dark-adapted in the bay).

### 2.5 State shape
Plain JSON, saved; `$` keys are runtime-only and stripped. One record per person, saved as its deltas from its build's template (TECH §6.6, rules 1 and 2; CONTRACTS §9). A marine in the middle of a sol at Melas:

```json
"body": {
  "v": 1,
  "tmpl": "m-adult",
  "baseMassKg": 75.0, "heightCm": 178, "bornMs": -662256000000,
  "traits": { "sasK": 0.45, "co2Native": true },
  "energy": { "gutKcal": 420, "reserveKcal": -150 },
  "water": { "balanceL": -0.2, "gutL": 0.1 },
  "bladder": { "ml": 180 },
  "bowel": { "g": 140, "transitG": 90 },
  "hygiene": { "grime": 22, "stubbleH": 6 },
  "sleep": { "pressureH": 3.4, "berthId": "f:e1:rack:14", "berthNights": 12 },
  "stress": { "v": 12 },
  "morale": { "v": 70 },
  "air": { "co2Load": 0.4, "acclimPiO2Kpa": 19.1, "co2AcclimKpa": 0.40, "n2FastKpa": 40.2, "n2SlowKpa": 40.2,
           "lungTolKpa": 9.1, "earsKpa": 66 },
  "rad": { "careerSv": 0.012, "yearSv": 0.004 },
  "cond": { "gCond": 0.92, "bone": 0.86,
            "gWeek": [ { "liveG": 0.38, "hiH": 2.0, "hiG": 1.0 }, { "liveG": 0.38 } ] }
}
```

`tmpl` names the build's template (`m-adult`, `f-adult`), which holds the resting values the record leaves out, and `withDefaults('body', rec)` fills them on read: the build's sex and reference traits (`sleepNeedH` 8.0, `tauIntH` 24.2, `sweatMaxLh` 1.0, `bmrK` 1.0); `stamina` 100, `blood` 100 and `heart.health` 100, with no strain; `thermal` at a 37.0 °C core and a 33.5 °C skin, no frost; `g` with a full 6 s `reserveS` and nothing on it; `sleep.depthK` 1.0 and `offsetH` 0; `plasmaK` 1.0 and `vestAdapt` 0; `coHbPct` 0.5; every counter and dose not shown at zero (the other `air` doses, `stress.loadPts`, the `rad` ledgers past the year's, `fit`, `held`); every one of the six `parts` at 0; `posture` standing; and every timer, list and record empty or null (`energy.emptySinceMs`, `bowel.reflexUntilMs`, `injuries`, `drugs`, `consc`, `tended`, `scars`, `dead`). The sample keeps only what differs: the ledgers in the middle of a sol, the traits drawn for this person, and the history of where the body has lived.

The suit, when worn, is its own item record in `state.items` (section 19.2), held at `p.kit.worn.suit` (TECH §6.7); its loop becomes the `env` the body breathes when the helmet is sealed. `cond.gWeek` holds the last seven days (two shown); `held` keeps the rates of the current sub-step cell (2.6), so a save taken mid-cell resumes exactly.

**As built in v0.0.4** (`src/sim/body/record.js`, the template in `src/data/body/templates.js`). The record is `v` 2 (`BODY_V`; the v0.0.3 roster wrote 1, and the `body:v2` upgrade raises every body and gives the player the start body at the save's clock): `{ v, tmpl, heightM, build, atMs, traits, energy: { gutKcal, reserveKcal, emptyH, ateMs, emptySinceMs, stoolK, waterK }, water: { balanceL, gutL }, bladder: { ml }, bowel: { g, transitG, reflexUntilMs }, hygiene: { grime, stubbleH, wetUntilMs, sweatL, teethMs }, sleep: { pressureH, offsetH, bed, sinceMs, fallMs, wokeMs, clockMs, depthK, berthNights, inertia }, stamina, blown, stress: { v }, morale: { v }, thermal: { coreC }, held }`, saved as its deltas from the template. `held = { ms, cur, env, sig, rp, solved, posted }`: the live mix of the minute so far, the environment, the load's signature, the rates of the cell, the crossing solved and the one posted, so a save mid-minute resumes exactly. **Whether the body is asleep is derived**, never stored: from `sleep { bed, sinceMs, fallMs, wokeMs }`, asleep from `fallMs` until `wokeMs`, the latency being `fallMs − sinceMs`; `sleep.clockMs` is the body clock's hourly step. `stamina` and `blown` sit at the record's top level. `energy.emptyForH` and `ateAgoH` are the template's only (how long the gut has been empty, and dinner's age, at the template's reveille). `traits` (`sleepNeedH` ~ N(8.0, 0.5) in [6.5, 9.5], `tauIntH` ~ N(24.2, 0.2), each to 0.01) are drawn from `stream('body', seed, pid, 'traits')`. **The template is the reference sol's own steady state at a training reveille** (my call, the body role's; `body-sleep` prints both): gut 0 kcal, reserve 0, `emptyH` 2.0 (the gut empty 7.9 h, the night counted at a quarter; dinner 12.7 h ago), balance −0.2 L, the bladder 160 mL, the bowel 180 g and 100 g in transit, grime 32 (the Plan of the Day's shower comes after PT), stubble 24 h, pressure 0.5 h, offset 0, stamina 100, stress 10, morale 70, core 37 °C. The start body is the template walked along `REFERENCE_SOL` (`src/data/body/sol.js`: §3.2's range sol on TIME §9.2's times, as activity spans, meals and drinks) to the start's hour.

**As built in v0.0.5: the eyes** (`src/sim/body/eyes.js`, section 23.4). `body.eyes = { atMs, c, rn, rb, yp, ys, key, sky, shut, nv }`: the cones' state, the rods' neural state and the rods' bleach (log10 cd/m² at `atMs`, to 1e-6); `yp` and `ys`, the field's photopic and scotopic luminance at the retina, held since `atMs`; `key`, places' `lightKeyOf` at `atMs`; `sky`, the open air's level at `atMs`'s minute, only when the field can read the open air; `shut` while the lids are closed; `nv` while a night-vision device is on. `record.js` carries it whole, as it carries `held`. **Its absence means eyes at rest in the light they stand in**, so neither a new game nor a load writes one (a v0.0.3 or v0.0.4 save loads as it stands); the player's first tick anchors it at the clock.

### 2.6 The skip contract for the body
TIME.md owns `skip()`. The body's needs are its physical ledgers (gut and reserve kilocalories, body-water litres, bladder millilitres, bowel grams, grime, sleep pressure, tissue nitrogen, dose), advanced by one function; there are no separate anchors and no `valueAt`. The body provides three functions:

- `bodyAdvance(p, envSeg, fromMs, toMs, activity) → { atMs, events, stop }` advances `p.body` in place from `fromMs` to `toMs` under one constant environment segment (a shower is one; a voyage day is several, and the caller loops over them), returns the body events it produced (a void, a faint, a stage crossed) and, if a threshold that TIME treats as an interrupt (section 23.3) was crossed, `stop = { atMs, ledger, band }` with the advance ended there.
- `nextCrossings(p, envSeg, fromMs) → [{ atMs, ledger, band }]`, from the same sub-step solver: for each ledger, the time it next reaches a band, if the segment held. TIME queues the earliest as a priority-3 event and asks again when the segment changes (TIME §5.5).
- `bodyPeek(p, envSeg, atMs)` returns an advanced copy without writing, for the splash's time-lapse and any reading in the middle of a skip.

The promises:
- **Exact composition.** `bodyAdvance` over `[a, c]` gives the same body as `[a, b]` then `[b, c]`, for any whole-second `b`, to float rounding. Within a segment every closed-form ledger is linear (energy, water, bladder, grime, sleep pressure, dose) or exponential (gut water, transit, tissue nitrogen, morale, bone, gCond), and those compose exactly. The rest is stepped on **the game's own grid**, not the skip's: bleeding and DCS on the minute (multiples of 60,000 ms since the epoch), the heat balance on the 10 s grid, the body clock on the hour, healing in the hourly `hour@:35Z` slot and the daily work in the `local@00:00` job (TIME §11.3; CONTRACTS §5). Inside a grid cell every rate is the one evaluated at the cell's start and kept in `body.held`, so a split inside a cell reuses it and the halves add up to the whole.
- **Event sub-steps.** Each ledger reports when it next crosses a threshold that changes a rate (the gut empties, the bladder reaches 450 mL and would wake a sleeper, shivering saturates). `bodyAdvance` steps to the earliest, applies the change, and continues; `nextCrossings` reads the same list.
- **Hazards against thresholds.** Infection, DCS onset, faint spells, accidents, training injuries and skin trouble use tradecraft's race: a threshold `−ln(u)` drawn from the person's own stream when the risk begins, against accumulated `−ln(1 − p)`, so the result does not depend on how time was sliced.
- **Lived against skipped.** The same interval ticked at 20 Hz in live play and skipped agree within the tolerances the parity test prints (section 25); the difference comes only from the live fast layer's finer steps.
- **As built in v0.0.4** (`src/sim/body/body.js`). Every rate is worked out at the start of a game minute, or where what you do changes, or where the body changes state (the gut empties, sleep comes, you wake), and **held per minute cell** in `body.held`, each ledger by its exact formula inside it; rounding happens on the grid only, never inside a cell, so a body advanced in one go or cut anywhere is the same body (3e−14 apart in `body-skip`). **One door, `bodySync(state, pid, ms, bus)`**, brings a body from `atMs` to a moment before any change (`intake`, `relieve`, `wash`, `groom`, `sleepBegin`, `sleepEnd` each call it first), so an event mid-minute lived and the same event at a step's end skipped meet the same body; live minutes use the tick-averaged load the fast layer adds into `body.held`. The earliest interrupting crossing (§23.3) is posted as a priority-3 event and posted again when the load's signature changes; the bursting and desperate hazards are pre-drawn the same way, lived or skipped, at the same second. A whole reference sol ticked 1.78 million times at 20 Hz matches the same sol skipped on every printed digit.
- **As built in v0.0.5: the eyes** (`eyes.js` `eyesStep`, section 23.4). Nothing is stepped per tick: the state at any instant is the closed form from `atMs`, and the eyes are anchored again only at the exact instants what they receive changes: the light's steps (`lightKeyOf`, found to the millisecond by halving), the open air's minute, the lids at the body's `fallMs` and `wokeMs`, and the eye's own moves (lived only; a skip never moves them). **Lived and skipped records are byte-identical** (`eyes-model`: across taps, through test-night's night to the klaxon, and a day skip against minute steps). The slow contributor `eyes` gives as its next change `skyChangeMs`: while the field reads the sky, the first minute whose sky level differs from the start's minute, else `SKY_LOOK_MS` (60 minutes) on, so a day skip steps by the hour except at dawn and dusk (on the street from 06:00, a twenty-hour skip takes 233 steps against 1,204 by the minute, with the same eyes). A field reads the sky outdoors, in no room, or through a room's windows where `WINDOW_K` × the brightest sky row beats the room's fill under its lighting now (at lights out only: by day 0.3 never beats the fill's 0.65 and 0.75). Readers between the due layer and `bodyFast` that see a record still shut while the lids are open take the record's state on the open field (perception's `viewFor`), so the tick you wake on is never blind.

### 2.7 Module map and what is ported
Proposed paths (TECH.md owns the final layout). Sources are tradecraft's `../tradecraft/src/sim/` and LONGHAUL's `../longhaul/js/sim/` (read-only; ported by copying and adapting, never by importing at runtime):

| OLYMPUS module | From | Verdict | What changes |
|---|---|---|---|
| `src/sim/body/body.js` | new | | record, creation, aggregates, `capacity()` |
| `body/energy.js`, `water.js`, `elimination.js`, `hygiene.js` | tradecraft `src/sim/needs.js` (shape) | adapt | hours-since-X becomes physical ledgers; tradecraft's starvation ladder (weak, faint, death) kept as stages |
| `body/sleep.js` | tradecraft `campaign.js fatigue()`; longhaul `needs.js` rest | adapt | hours awake becomes sleep pressure with clearance by sleep quality, plus the body clock |
| `body/stress.js` | tradecraft `needs.js` stress; longhaul `needs.js` `moraleTarget`, `moraleFactor` | adapt | combat events, combat stress load |
| `body/thermal.js` | tradecraft `src/sim/thermal.js` | adapt | `STAGES`, `WORDS`, `live()` kept; `settleTo()` replaced by Gagge's two-node heat balance; suits, vacuum, the night sky, frostbite added |
| `body/air.js` | longhaul `life-support.js breathe()` (bands only) | rewrite | partial pressures, TUC dose, CO₂, CO, ebullism, barotrauma, DCS |
| `body/radiation.js` | new | | |
| `body/gload.js` | longhaul `crew.js` `G_THRESHOLDS`, `protectedG`, `endJuice`, `physiologyTick`, `gStateFor` | adapt | per minute becomes per second; axis and posture; G-LOC reserve |
| `body/conditioning.js` | tradecraft `fitness.js` (hook) | new | bone, plasma, gCond, vestibular |
| `body/fitness.js` | tradecraft `src/sim/fitness.js` | reuse | exercise points scaled by gravity (15.1); SKILLS §8's rules and `FIT_WEEK_MS` live here, and SKILLS's `value()` reads effective fitness through the helper injected into it (TECH correction 8; CONTRACTS §13) |
| `body/motion.js` | longhaul `crew.js mobility()`, `inertia.js`, `applyImpact` | adapt | Froude gaits, traction, jumps, falls, zero-g |
| `body/health.js` | tradecraft `src/sim/health.js` | adapt (high value) | new injury kinds; limb bleed clamped below an artery's rate; the player is knocked down too |
| `body/medicine.js`, `aid.js`, `diagnosis.js` | tradecraft same names | adapt | IFAK and corpsman kit; MARCH; suit biomedical data as plain sight for friends |
| `body/suit.js` | longhaul `life-support.js` suit fields (reference) | new | the light vac suit and the hardshell: consumables, leak model, thermal, power, donning, the packs |
| `body/drugs.js` | longhaul juice; tradecraft painkillers | adapt | one pharmacokinetic table |
| `body/mods.js` | tradecraft `health.mods`, `needs.mods`, `thermal.thermalMods` | adapt | `bodyMods` and `needMods` keyed by SKILLS's `uses` (section 22) |
| `body/eyes.js` | new (built in v0.0.5) | | the eyes' dark and light adaptation (section 23.4): the record, `eyeView` and `eyesAdaptedTo`, `eyesStep`, `setNightVision` |

**Built in v0.0.4** (`src/sim/body/`): `body.js` (the engine: `bodyOf`, `bodySync`, `bodyAdvance`, `bodyPeek`, `nextCrossings`, `startBody`, `isAsleep` and the changes), `record.js` (the template, the deltas and the traits, marked `Pure.`, apart from the engine), `energy.js`, `water.js`, `elimination.js`, `hygiene.js`, `sleep.js` (pressure, the body clock, fatigue), `stress.js` (§9's stubs), `thermal.js` (tradecraft's, begun), `motion.js` (the gaits and stamina), `mods.js` (`bodyMods`, `needMods`, `capacityOf`), `cues.js` (`stagesOf`, `cuesOf`, `stripOf`, `wordsOf`) and `domain.js`; the data in `src/data/body/templates.js`, `needs.js` (every rate and band), `foods.js` and `sol.js` (`REFERENCE_SOL`), with `gait.js` kept. **Built in v0.0.5**: `eyes.js` (the eyes' adaptation, section 23.4), stepped by `domain.js` in `bodyFast` for the player and by the slow contributor `eyes` in a skip.

Longhaul's `rng.js` and tradecraft's `rng.js stream()` discipline carry over through TECH.md: every body roll draws from `stream('body', personId, purpose, …)`, so no body event moves anyone else's dice.

## 3. Energy and hunger

### 3.1 Burn
- **Basal rate** `bmrKcalH` by Mifflin–St Jeor, divided by 24: `(10·massKg + 6.25·heightCm − 5·ageY + (male ? 5 : −161)) / 24 × traits.bmrK`. A 75 kg, 178 cm, 21-year-old man: 73.4 kcal/h (1,763 kcal a day); a 62 kg, 166 cm woman: 58.0 kcal/h.
- **Activity** in METs, multiples of the basal rate: `burnKcalH = bmrKcalH × metG + shiverW/1.163 + fever`, where fever adds 12% per °C of core above 37.2 (the textbook 10–13%).
- **Gravity scaling** (my call, from Farley and McMahon 1992 and Teunissen 2007: the net cost of running falls almost in proportion to weight, walking's by less, because the pendulum still costs): `metG = 1 + (met − 1) × f(g) × (1 + loadKg/massKg)` for weight-bearing kinds, with `fWalk = 0.4 + 0.6·gG`, `fRun = 0.15 + 0.85·gG`, `fClimb = gG` (ladders are lifting), `fWork = 0.7 + 0.3·gG` (manual work), `fStill = 1` and no load term for still kinds. A centrifuge or thrust-gym session runs at its own g.

### 3.2 MET reference values (at 1 G; TIME.md's activities carry these)

| Activity | MET | kind |
|---|---|---|
| asleep | 0.95 | still |
| seated: class, reading, a meal, strapped in | 1.3 to 1.6 | still |
| standing: formation, watch, cleaning a rifle | 1.8 | still |
| walking about | 3.0 | walk |
| marching with rifle, drill | 3.5 | walk |
| ruck march at march pace (4.8 km/h on Earth), unloaded | 3.7 (Pandolf et al. 1977's level walk for a 75 kg man) | walk; the load term carries the ruck: with 30 kg, 4.8 at 1 G and 3.4 on Mars |
| range: walk, prone, kneel | 2.2 | walk |
| PT: run 5 km and calisthenics | 8.0 | run |
| light PT: mobility, stretching, technique | 3.0 | walk |
| CQC training, combatives | 9.0 | run |
| sprint, all-out | supramaximal (section 8) | run |
| a Ring session at 1 G: walking between cars, laps, the weight cars | 3.5 | walk, at the session's g |
| ladder climbing | 8.0 | climb |
| suit EVA, moderate work | 3.5 (about 300 W) | work |
| shivering, maximal | adds up to 2.5 × basal (212 W) | |

Two sample training sols on TIME §9.2's Plan of the Day (reveille 05:30, taps 22:00, 8 h 09 m 35 s in the rack), for that 75 kg marine (scratch run, 2026-11-05, reprinted after the ruck's double-counted load was taken out):

| Sol | Mars, 0.38 G | 1 G | Europa, 0.134 G |
|---|---|---|---|
| **range sol**: PT run in a 15 kg vest, the range all morning, classes all afternoon, rifle cleaning, three meals, 1 h 20 min of walking about, the evening seated | **2,770 kcal** | 3,280 | 2,570 |
| **hump sol**: the same with an 8 km hump under 25 kg in place of the range's first two hours | **2,990 kcal** | 3,640 | 2,740 |

### 3.3 The two pools
- **Gut** `gutKcal`: food eaten and not yet absorbed. Eating adds the meal's kilocalories, capped at `GUT_MAX_KCAL 1,800` ("you couldn't eat another bite"). It absorbs at `absorbKcalH = 120 + 0.8 × burnKcalH` (my call): a 900 kcal breakfast lasts 4.6 h at rest, 3.3 h walking about on Mars, 2.4 h through PT.
- **Reserve** `reserveKcal`: the body's balance against its normal stores (0 = balanced). It gains what the gut absorbs and loses what is burned. Positive values are capped at +4,000 (surplus is stored and forgotten: no fat gain is modelled before 1.0, my call). Negative values cost mass: `massKg = baseMassKg + min(0, reserveKcal)/7,700` (7,700 kcal per kg of tissue lost).
- `emptySinceMs` marks when the gut reached 0. `emptyH` counts the hours since then for the felt stages: each hour awake counts 1, each hour asleep a quarter (an overnight fast is normal, and the body does not count the night as a missed meal; my call).
- Both pools are linear between events, so `bodyAdvance` solves them exactly.

### 3.4 Stages (felt hunger)

Two ladders, and a roll takes the worse of them: the felt one, from the empty gut, and the deep one, from the reserve. Healthy young adults stay largely functional through two or three days without food (military field-ration and semistarvation studies), and fasting faints are rare under ketosis: they come from dehydration or standing up. The ladder follows that.

| Stage | When | Roll mod | Other |
|---|---|---|---|
| fed | gut > 0 | | |
| peckish | gut empty, `emptyH` under 4 | | "you could eat" (the line at reveille); the instinct mentions it before a long duty |
| hungry | `emptyH` ≥ 4, or reserve ≤ −1,500 | −1 all | |
| very hungry | `emptyH` ≥ 10, or reserve ≤ −3,000 | −1 all | sleep quality ×0.85; the words harden ("your stomach is all you think about") |
| weak | reserve ≤ −13,000 (about 4.5 sols without food) | −2 all | no sprint; healing ×0.6 |
| faint spells | reserve ≤ −20,000 (about a week), or weak with a water deficit of 2% or more | −3 all | tradecraft's hazard: once an hour, a chance `min(0.9, 0.2 × (1 + days past the stage))` of passing out for 4 to 12 min |
| starving | reserve ≤ −40,000 | −5 all | can't run; infection immunity −6 |
| dead | reserve ≤ −100,000, or mass under 0.6 × base | | about 40 to 50 sols with water, inside the real 45 to 61 days |

On the Plan of the Day the felt ladder never bites: dinner at 17:30 empties the gut at about 22:50, the night counts 1.8 h, and breakfast anywhere in its window (06:50 to 07:40) comes before `emptyH` reaches 4, so a standard sol has no penalty-minutes from hunger (scratch run; `body-energy` prints it). Sleep does not feed you (the user, 2026-10-28). A hospital or a sick bay feeds a patient.

### 3.5 Food
- Mess meal: 900 to 1,100 kcal, 0.5 L of water with it (counted as drunk), 25 min (TIME.md). Field ration (the MCRN's MRE, SETTING.md names it): 1,250 kcal, 0.15 L of food water, 10 min cold, 15 min heated. A snack bar: 250 kcal, 1 min. Coffee: 5 kcal, 200 mg caffeine (section 20).
- Food water: 0.3 mL per kcal for mess food, 0.12 mL per kcal for field rations (a snack bar 0.12). Metabolic water: 0.13 mL per kcal burned. **A meal's water is released as the gut absorbs the food** (built in v0.0.4, my call, the body role's), not absorbed in 20 minutes like a drink: without it, every meal and its 0.5 L sent the bladder to urgent about 1.5 h later.
- **The reference sol's meals** (`src/data/body/sol.js`, my calls): 900, 900 and 1,000 kcal on a training sol; on a holiday, brunch 1,200 kcal at 08:00 (the window's opening, so you are hungry for 8 to 19 minutes before it) and dinner 1,100.
- Under burn in a couch, a feed line gives 150 kcal and 0.25 L an hour on demand (longhaul's couch feed line, re-based; my call).

## 4. Water and thirst

### 4.1 Ledgers
- `water.gutL`: drunk and not yet absorbed. It absorbs exponentially with `τ = 20 min` (gastric emptying of water, about 1 L/h at most; 63% in the first 20 minutes, `body-water`). Food's water does not go here: it comes in as the gut absorbs the food (3.5). A sip from a canteen or a hydration tube is 0.1 L in 3 s; a long drink 0.5 L in 30 s; the stomach holds 1.2 L at a time.
- `water.balanceL`: body water against euhydration (0). Positive is surplus, negative deficit. `deficitPct = −(balanceL − refL) / massKg × 100`, where `refL` is 0 except after a change of plasma volume (4.2).

### 4.2 Losses (L/h)
- **Insensible** (breath and skin): `0.030 × (0.6 + 0.4 × metG/1.5) × dryK`, where `dryK` is 1.0 indoors, 1.3 in dry outdoor Mars air or a dry ship, 1.4 in a suit loop. About 1.0 L a sol for a standby day.
- **Sweat**: from the heat balance (section 10). A dawn PT run at Melas in the sweats sweats nothing; the same run at noon in the sun 0.02 L/h; a 30 kg ruck march at noon 0.12 L/h; PT on a 1 G deck at 22 °C 0.38 L/h; suit work 0.1 L/h at 300 W and 0.9 L/h at 600 W (19.6). `traits.sweatMaxLh` caps it (1.0 unacclimatised, up to 1.5 after two weeks of heat work).
- **Urine**: `urineLh = 0.025 × nightK + max(0, balanceL − refL)/1.5`, with `nightK = 0.5` between body 23:00 and 06:00 (night-time ADH) and the obligatory 0.025 cut to 0.018 below a −0.5 L balance (concentrated urine). Alcohol adds 0.1 L per drink within the hour; caffeine 0.05 L per 100 mg.
- **Free fall's fluid shift** (Leach et al. 1996; Norsk 2014): there is no large diuresis. Plasma volume falls 10 to 15% because people drink less, and BODY ties it to `plasmaK` (14.3): the plasma lost, `3.0 L × (1 − plasmaK)` (about 40 mL/kg of plasma), is shed as urine as `plasmaK` falls, about 0.3 L over the first day, and the balance's zero moves with it, `refL = −3.0 × (1 − plasmaK)`, so the smaller volume is not felt as thirst. For the first 2 days in free fall thirst is muted besides (every thirst word comes 1% of mass later). Back in gravity `plasmaK` rises, `refL` with it, and the plasma refills from what you drink: you are thirsty for a day.
- **Stool** 0.1 L a sol; diarrhoea 0.4 L an episode; vomiting 0.3 L an episode.
- A training sol at Melas in the cool season sweats almost nothing (PT at −14 °C in the sweats, a hump at −1 °C). Drinking 2.0 L (meals included), with 0.9 L in the food and 0.36 L from metabolism, it loses 1.0 L insensibly, 0.1 L in stool and 2.1 L of urine in 4 to 5 voids, and ends level (scratch run, reprinted with the two-node heat model). A summer sol or a 1 G deck adds its sweat, and the drinking that answers it. **As built in v0.0.4** (no sweat yet: Melas's cool season, 20 °C indoors; `body-water`): 2.0 L drunk, 0.84 L in the food and 0.36 L metabolic in; 0.82 L insensible, 0.07 L in stool and 2.32 L of urine in 6 voids out; the balance holds at −0.20 L every training sol of the reference week.

### 4.3 Stages (thirst)

| Stage | Deficit | Roll mod | Other |
|---|---|---|---|
| thirsty | ≥ 1% of mass (0.75 L at 75 kg) | | the instinct says so |
| dry | ≥ 2% | −1 all | heat tolerance: sweat capacity ×0.9 |
| parched | ≥ 4% | −2 all, −1 body | headache; stamina recovery ×0.8 |
| dehydrated | ≥ 6% | −4 all | no sprint; dizzy on standing (5% chance to faint each time you stand from lying); sweat ×0.7 |
| severe | ≥ 8% | −6 all | 15% faint on standing; confused (consciousness V) at 10% |
| collapse | ≥ 12% | | down, delirious |
| dead | ≥ 15% | | about 13 sols at rest indoors without water by this section's rates, 1 to 2 in heat work |

The 7 sols first written here did not follow from §4.2's own rates: at rest with no food and no water the body loses about 0.85 L a sol (the obligatory urine, breath and skin, less metabolic water), and 15% of 74.5 kg is 11.2 L, about 13 sols. **Measured in v0.0.4** (`body-water`, no food and no water from a −0.20 L reveille): thirsty at 11.5 h, dry at 33 h, parched at 76 h, dehydrated (6%) at 117 h (4.8 sols), severe at 162 h. Eating the meals without drinking, food water nearly covers the losses: thirsty after 99 h, 1.6% of mass after a week. No death comes this round.

Overdrinking: a surplus over +3 L gives −1 and nausea; over +5 L, hyponatraemia, a 10% chance an hour of collapse (rare; it exists so that "drink everything" is not free).

### 4.4 Water on Europa, and bad water
- Rationing is a budget the place sets (PLACES.md, SETTING.md: the Europa FOB's litres per person per sol for drinking and for washing). The body only counts what you drink. Sweat in a suit on the surface is the usual way to run short.
- Untreated water (a Europa black-market tank, a Martian field stream): a 15% chance per litre of a gut illness (my call), onset 12 to 48 h, 2 to 4 sols of diarrhoea (section 5.2). A purification tablet makes a litre safe in 30 min.

## 5. Bladder and bowel

### 5.1 Bladder
- `bladder.ml` fills with urine. Sensation thresholds, at felt g ≥ 0.1 (in free fall each is 150 mL higher: the urge is weaker without weight on the bladder, and retention is a known spaceflight problem):

| Stage | Volume | Roll mod | Other |
|---|---|---|---|
| could go | ≥ 200 mL | | the instinct mentions it before an EVA, a strap-in, a patrol, a long drive or a watch |
| need | ≥ 400 mL | −1 mind | wakes a sleeper at 450 mL |
| urgent | ≥ 550 mL | −2 all | walking stiffly; sleep impossible |
| bursting | ≥ 700 mL | −3 all | accident hazard 3% a minute |
| accident | 850 mL | | the bladder empties |

- **Relief**: flow 20 mL/s. At a head, 15 s to undo, the flow, 10 s to finish; in the field 20 s plus the flow; through a suit's urine collection device 5 s plus the flow at 15 mL/s into `suit.urineMl` (1.0 L bag); in a couch through the couch's waste line if fitted (troopships and drop ships have them, my call), otherwise the suit.
- **Accident**: clothes soiled (hygiene +25, the uniform's soil to full), stress +10, morale −5, and PEOPLE.md's witnesses remember it. Into a worn collection device it is not an accident. Into a full suit bag: the suit liner takes it (hygiene +20, skin trouble hazard ×2 until washed).

### 5.2 Bowel
- Food becomes stool at 0.06 g per kcal absorbed (mess food; field rations 0.04 g, giving the classic field constipation). It enters `bowel.transitG` and moves into `bowel.g` with `τ = 18 h`, so today's food arrives tomorrow.
- **Gastrocolic reflex**: for 45 min after a meal of ≥ 400 kcal, every threshold is 100 g lower. In body morning (06:00 to 10:00) they are 50 g lower. This is the morning call of reveille, the head and chow.

| Stage | Load | Roll mod | Other |
|---|---|---|---|
| could go | ≥ 150 g | | the instinct, before suit-up |
| need | ≥ 250 g | −1 mind | |
| urgent | ≥ 350 g | −2 all | |
| desperate | ≥ 450 g | −3 all | accident hazard 2% a minute |
| accident | 550 g | | |

- Slower transit: free fall (`τ × 1.5`, thresholds +100 g), opioids (`τ × 2`), a deficit over 2% (`τ × 1.3`). **Diarrhoea** (bad water, food poisoning, ARS, a fever): `τ = 2 h`, thresholds halved, accident hazard ×3, 0.4 L of water lost an episode.
- **Relief** removes 90% of the load. At a head at ≥ 0.3 G: 5 min; at 0.05 to 0.3 G (airflow-assisted low-g toilets): 7 min; in free fall (a vacuum toilet): 12 min; a field latrine 7 min, a cat-hole 9 min with the digging. A suit has no bowel system: an accident goes into the liner (hygiene +40, skin trouble ×2, and a smell that greets everyone when the helmet comes off).

### 5.3 What these create
Before an EVA, a strap-in for a burn, a drop, a long convoy or a guard post, the choice between drinking enough and needing to go. The mess, the head and the Plan of the Day line up so that in garrison the bladder and bowel almost never bite (the morning routine, chow and the evening cover them, by the rates above); they bite when a plan breaks or a duty runs long. Section 26 covers the chores.

**The heads' rhythm, as built in v0.0.4** (`REFERENCE_SOL`, my calls): a head roughly every two hours of the training sol (the range's portable heads, the class breaks at 13:00 and 15:20, hourly in a free evening), a void taken at a head from `HEAD_VOID_FROM_ML` 300 mL and at a stall from 200 mL, and whatever the bladder holds at reveille and before the rack. That gives **6 voids a sol** (05:30 160 mL, 10:45 531, 13:00 522, 15:20 361, 19:15 489, 21:45 260) and no urgent bladder at steady state; a bladder at 250 mL at taps reaches 393 mL by 05:30, so the night wakes no one (`body-elimination`).

## 6. Hygiene
- `hygiene.grime` 0 to 100. Per hour: 1.2 awake, 0.5 asleep; +8 per litre sweated; +1 at MET above 5; +1.5 outdoors on Mars (dust), +6 in a dust storm; +1.5 per hour sealed in a suit after the first 2 h (`sealedH`). Events: blood on you +15, vomit +20, urine +25, faeces +40, smoke or fire +10.
- **Washing.** The owners are split: TIME §8.2 owns the activity's duration rule, PLACES owns each site's water minutes and litres (`WATER_MIN`: Melas's push-button heads, the troopship's 12 L, the FOB's 5 min and 30 L, the towns' long showers), and BODY owns what the water does. A shower takes grime by its **minutes of running water** `w`: `grime → min(grime, round(30 × e^(−(w − 1)/0.75)))` (my call). One minute leaves 30; a Navy shower, 2 min of water and 12 L, leaves 8; 3 min leave 2; 4 min leave 1; 5 min or more leave 0, so the FOB's 5 min (30 L) washes you clean. A cold shower (water under 25 °C: the tank run dry, PLACES §3.12) cleans as well minute for minute, but its stress −10 becomes stress +3, morale −2 and the skin's chill (0.2 °C off the shell), and nobody stays under it longer than they must. Without a shower: a sponge bath (2 L) to `max(15, 0.4 × grime)`; wet wipes to `max(30, 0.6 × grime)` (TIME lists their durations). A clean uniform on a clean body: grime rate ×0.8 that day.
- **Shaving**: `stubbleH` counts hours since the last shave (4 min at a basin). Corps grooming standards (SETTING.md) make stubble over 20 h an inspection failure; PEOPLE.md's discipline acts on it. As built in v0.0.4: stubble shows from `STUBBLE_SHOWS_H` 12 h (my call), so the basin shaves from then, and the "fails an inspection" band starts at 20 h inclusive. **A woman's body grows no visible stubble** (`hasBeard(rec)`: a man's body, by the person's sex or else the template's; the review of v0.0.4: PFC Marangoni's sheet had said "Shave: A shadow on your jaw."): no stubble band past the first, no cue on the doll, no Shave row on the sheet, no shave at the basin (3 minutes), no DI line. The ledger still counts.

| Stage | Grime | Social (rolls aimed at someone in smell range) | Smell range | Other |
|---|---|---|---|---|
| fresh | < 15 | | | |
| clean | 15 to 35 | | | |
| grubby | 35 to 55 | | | fails an inspection |
| unwashed | 55 to 70 | −1 | 1.5 m | squadmates' affinity drifts down (PEOPLE.md) |
| rank | 70 to 85 | −2 | 2.5 m | complaints, NCO attention |
| filthy | 85 to 100 | −3 | 4 m | morale −0.5 an hour |

- **Skin**: every open wound's infection hazard is multiplied by `1 + max(0, grime − 40)/40` (×2.5 at 100). A daily hazard of skin trouble (folliculitis, fungus, "suit rash") of `0.03 + 0.002 × (grime − 60)` when grime ≥ 60, or 0.05 after more than 8 h sealed in a suit that day. Skin trouble is an injury on the torso or legs: pain 3, −1 body while moving, healing in 4 sols if kept clean, never while grime stays over 60.
- `smellOf(p)` returns the range in metres for PEOPLE.md's perception and reactions. A sealed helmet hides it.

## 7. Sleep, fatigue and the body clock

### 7.1 Sleep pressure
- `sleep.pressureH`: hours-equivalent of sleep pressure, 0 after a full sleep. This is Borbély's process S made linear, which keeps tradecraft's user-endorsed thresholds in "hours awake" and resolves exactly through any skip.
- **Awake**: +1.0 per hour, multiplied for the time it applies: ×1.3 at MET above 4; ×(1 + 0.5 × (r − 1)) up to ×1.75 when the felt g is over your G-conditioning (`r = gG/gCond`, section 14; longhaul's rest drain was ×1.5 above 1.5 G); ×1.1 at stress ≥ 50; ×1.2 with core above 38 °C; ×1.2 with SpO₂ under 90%.
- **Asleep**: −`clearH × depthK` per hour, `clearH = (24 − sleepNeedH)/sleepNeedH × quality` (2.0 at an 8 h need), floor 0. `sleepNeedH` is per person, normal around 8.0 h (sd 0.5, 6.5 to 9.5).
- **Deep sleep after a long day**: `depthK = 1 + 0.5 × max(0, pressureH − 16)/16`, fixed when sleep begins and held for that sleep (Borbély's slow-wave rebound made linear, my call; it keeps each night exact over skips). A night begun at 20 h clears 12.5% faster.
- **The balance on the Plan of the Day.** The Mars clock's timeslip falls inside the night (my call: the Corps keeps the slip inside taps). On TIME §9.2's schedule, taps at 22:00 and reveille at 05:30, the rack holds 8 h 09 m 35 s. At `clearH` 2.0 that clears 16.3 h against a 16.5 h waking day: −0.2 h a sol before anything else, and about −0.8 h with the 10 min it takes to fall asleep and PT's hour at ×1.3. Deep sleep takes part of it back, so on a training week the pressure left at reveille settles at 0.4 to 1.0 h by Wednesday, "tired" (−1) arrives in the last half hour before taps (from 21:10 to 21:40), never in training, and the weekend's 07:00 holiday reveille clears it all (scratch run, 2026-11-05, three weeks; `body-sleep` prints it). The sol is a little short for sleepers, and the Corps lives with it. A marine who needs 8.5 h runs 1 to 4 h short by Friday and is tired from about 17:00; one who stays up past taps, or stands a fire watch, pays the next day. **As measured in v0.0.4** (`body-sleep`, three weeks of TIME §9.2's schedule): an 8.0-hour sleeper reaches Wednesday's reveille with **1.57 to 1.62 h** of pressure, not 0.4 to 1.0, and is tired from **20:48** at the earliest, not 21:10 to 21:40; never tired in training holds. The cause is §7.2's body clock: civil 22:00 falls at body 21.73 h, inside the wake-maintenance zone, so falling asleep at taps takes 18 minutes, not the 10 this balance assumed; even at 10 minutes these equations give about 1.3 h. `body-sleep` holds 0.4 to 2.0 h and prints this target beside it. Which way to close it is the user's (§29, question 9); until then the model stands as built.
- **Quality** (product, 0.3 to 1.0):

| Factor | Value |
|---|---|
| body phase in the window 22:00 to 08:00 | 1.0 |
| body 08:00 to 12:00 | 0.85 |
| body 12:00 to 18:00 | 0.75 |
| body 18:00 to 22:00 (the wake-maintenance zone) | 0.6 |
| a bed, bunk or rack you sleep in nightly (a squad bay's steady noise included) / a new berth, its first two nights (the first-night effect; `sleep.berthNights`) / a crash couch / the ground in a bag / the ground bare / sitting / in a suit / a free-fall sleeping bag | 1.0 / 0.9 / 0.8 / 0.85 / 0.7 / 0.6 / 0.65 / 0.9 |
| a noisy hour at the rack (PLACES's `noiseDb` over 45 at night: the fire watch's rounds, a snorer, a door) | 0.9 for that hour |
| stuffy (a newcomer at Melas) / CO₂ load above 1 kPa | 0.9 / 0.75 |
| cold (shivering, or core < 36.3) / hot (core > 37.8) | 0.6 / 0.7 |
| very hungry; bladder ≥ 400 mL | 0.85; 0.8 |
| pain: in pain / bad / agony | 0.85 / 0.6 / 0.3 (agony wakes) |
| juice active; alcohol over 0.05%; caffeine within 6 h | 0.5; 0.8; 0.85 |
| felt g over your G-conditioning | ×1/r |
| combat stress load over 60 (a nightmare night, 30% of nights) | 0.7 |

- **Falling asleep**: latency `10 + 40 × (1 − min(1, pEff/14))` min, doubled in the wake-maintenance zone. Under 4 h of pressure in that zone you lie awake (rest: stress −15 an hour, no clearance). As built in v0.0.4 (my calls, the body role's): the doubling counts only the minutes actually spent inside the zone, so the latency runs as a rate, and `depthK` is fixed at the onset of sleep from the pressure then.
- **Waking**: naturally when `pressureH ≤ 0.5` and the body phase is 05:00 to 10:00, or at 0 anywhere, or after 12 h; or by an alarm, reveille, a summons or an interrupt (TIME.md). Woken with pressure over 3 h: sleep inertia −2 all for 15 min; over 8 h: −3 for 30 min.

### 7.2 The body clock
- `bodyPhase` (body hours, 0 to 24) = the local time of day of the clock the person lives by, plus `sleep.offsetH`. The clock lived by is TIME.md's: Mars local time at Base Melas, UTC aboard ships, at Callisto and in Europa's towns.
- **Drift**: the body's own period `traits.tauIntH` (normal around 24.2 h, sd 0.2) differs from the day lived (a sol of 24.66 h, a UTC day of 24 h). Each hour, `offsetH += 24/τ_int − 24/T_day`: on Mars the body runs 0.46 h a sol ahead, on a ship 0.20 h a day behind.
- **Re-entrainment**: each hour, `offsetH` moves toward 0 by at most `cap × L / T_day`, where `cap` is 1.5 h a day to delay (offset > 0: the body thinks it later than it is) and 1.0 h a day to advance (offset < 0), and `L` is the light: 1.0 for Mars daylight or a lit base on a day/night cycle, 0.7 for a ship's berthing lighting cycle, 0.3 for continuous dim light (days strapped in, a long EVA), +0.3 for melatonin taken at the right body hour, +0.4 for the sick bay's light box. On Mars and aboard, normal lighting keeps an aligned marine aligned (Scheer and colleagues, 2007, found a 24.65 h day entrainable with moderate light).
- **Jumps**: a change of clock (Melas local time to ship UTC at embarkation, a watch rotation, a night op) adds the difference to `offsetH` at once (wrapped to ±12 h). A 9 h jump takes 6 to 9 days to clear: the first week of a voyage is ship-lag.
- **Effects**: sleep quality (7.1), the circadian term in the effective pressure (7.3), the bowel's morning reflex, and the kidneys' night-time cut.
- **Through the slip, as built in v0.0.4** (my call, the build sheet's §8 item 9): on Mars the body clock reads mean solar time at 24 body hours a sol plus `offsetH`, `φ = 24 × meanSolarFrac + offsetH`, so it runs smoothly through the slip where the civil clock stands at 24:00 (no step over 0.02 h a minute, `body-sleep`); the drift formula above is unchanged. Measured: the offset stays at 0 on Mars over a week for τ 24, 24.2 and 24.6 h (the light holds it), and a 9 h jump clears to 0.5 h in 8.2 sols.

### 7.3 Fatigue and its penalties
- **Effective pressure** `pEff = pressureH + circ(bodyPhase) − caffeineH − modafinilH`, with `circ(φ) = 3.0·exp(−((φ − 4.5)/2.2)²) + 1.0·exp(−((φ − 15)/1.5)²) − 1.5·exp(−((φ − 20)/1.5)²)`: the small-hours trough, the afternoon dip, and the odd alertness before bedtime (my call for the shapes).
- **Penalties** (tradecraft's, user-endorsed, on `pEff`): under 16, none; 16 to 20, "tired" −1 all; from 20, "exhausted" −(3 + ⌊(pEff − 20)/3⌋) all, at most −12; the words change at 36 ("dead on your feet") and 48 ("seeing things for want of sleep").
- **Microsleeps**: at `pEff ≥ 22`, while still for over 60 s (seated, prone, strapped in, a sentry standing still), a hazard of `min(0.3, 0.01 × (pEff − 21))` a minute of 3 to 15 s with the eyes shut: perception off, a held aim dropped, and on a post it is sleeping on watch (PEOPLE.md's discipline). At `pEff ≥ 36`, lying or seated still for 2 min puts you to sleep.
- **The daily load cap** (the user, 2026-11-03: "a notion of fatigue preventing among other things, working out more than once a day"). The user's rule is kept for what the marine chooses, and cut as a cap on the day's load so that the Plan of the Day does not break it:
  - `fit.dayLoad` sums the fitness load points (15.1) of the sessions of the last 18 h (tradecraft's `WORKOUT_GAP_H`): PT, light PT, MCMAP, a hump, a field exercise, the gym, a Ring session with exercise, the PFT and CFT. Walking about does not count. `DAY_LOAD_CAP_PTS` is 18 (my call): one full session and a lighter one fit under it, two full sessions do not.
  - **The Corps periodises the Plan of the Day**, as real units plan it: on a sol with MCMAP or a hump, PT is light PT (4 points), and on a field-exercise sol there is no PT. Every training sol then stays under the cap: PT and the range, 10; light PT and MCMAP, 4 + 7 = 11; light PT and an 8 km hump under 25 kg on Mars, 4 + 4 = 8; a field exercise, 15. PEOPLE and TIME write the Plan of the Day this way.
  - **A voluntary session** that would take `dayLoad` past the cap is listed but greyed ("you trained today: your body needs a day of it"): after a full PT, the evening's hard gym session is greyed (10 + 10 = 20). Light sessions (mobility, technique, the Ring's weight cars at 1 G, 3 to 4 points) are never greyed.
  - **An ordered session** past the cap is done, with −1 body per 5 points over and a training-injury hazard of 0.3% per point over, on top of the base hazard of every session of 6 points or more: 0.075% (×1.5 tired, ×2 exhausted, ×1.5 with the shell cold, skin under 25 °C; my calls). In a battalion of 950 on the periodised plan that is 3 to 6 training injuries a week (a sprain, shin splints, a strain: 17.3's sprain), a plausible handful; `body-cond` prints it.

## 8. Stamina and breath
Tradecraft has no stamina; OLYMPUS adds one fast pool (0 to 100) beside effective fitness.
- **Aerobic capacity** `capMet = (8 + 0.45 × effFitness) × (SpO₂/97) × (1 − 0.3 × max(0, coreC − 38)) × co2K × (1/max(1, r))`, where `co2K` is 0.85 above 1 kPa inspired CO₂ and 0.6 above 3 kPa. Fitness 0 gives 8 MET (28 mL/kg/min), 10 gives 12.5 (44), 20 gives 17 (60).
- **Threshold** `0.85 × capMet`. Demand above it drains stamina at `7 × (demand − threshold)/capMet` per second; demand below it recovers at `1.5 × (threshold − demand)/capMet` per second (about 90 s from empty to full at rest for anyone).
- **Sprint** is all-out at any gravity: demand `1.3 × capMet`, draining 3.15 a second (32 s from full). Its speed is what that effort buys in the local g (section 16). Running (the lope) costs its gravity-scaled MET and is sustainable for a fit marine on Mars.
- Other drains: a CQC exchange (1.4 × cap for its second), the anti-G straining manoeuvre (1.2 × cap while held: 2.45 a second, 41 s from full; 13.3), ladders under g (8 MET × g-scaled), dragging or carrying a casualty (7 MET × g × mass ratio).
- **Effects**: under 50 "breathing hard": −1 hands, −1 body (the aim sways with the breath); under 25 "winded": −2 hands, −2 body, no sprint; 0 "blown": walk only until 25, CQC −4.
- **As built in v0.0.4** (`src/sim/body/motion.js`, fitness held at 10, SpO₂ 97: `capMet` 12.5): a run on Mars (4.3 MET felt) is under every threshold and drains no one; at 1 G Fitness 0 drains and 10 and 20 hold; a sprint (no key yet) empties in about 32 s. Shift runs only while the body can; a blown marine walks.
- **Breath-hold**: at most `60 × √(stamina/100) × (1 + effFitness/40)` s at rest, a third of that while exerting. While held there is no gas exchange (smoke, gas, fumes are kept out); at the end you breathe, whatever is there. In a decompression, a held breath is the danger (section 11.6).

## 9. Stress and morale

### 9.1 Stress (tradecraft's, 0 to 100)
- Up: a fight begun +12, a blow taken +3, a wound +5, shot at (a near miss within 2 m) +6, a round through your space +3, a friend hit in view +10, a friend killed +20, killing someone +10 (first time +20), G-LOC +8, a decompression +15, a suit alarm +5, a reprimand +5, an accident (5.1) +10.
- Down: 0.5 a minute, 2 a minute seated or indoors and safe; a meal −8, a shower −10, a night's sleep −60, a talk with a friend −5 (PEOPLE.md).
- **On edge** at 50: −1 eyes and social. **Frayed** at 75: −2 eyes and social, −1 hands (a shake), and tradecraft's slips as flinches: a 10% chance a minute of an unmeant glance or start (WEAPONS.md reads "frayed" in muzzle-discipline checks).
- **The crash**: when stress peaked at 70 or more and the danger has been gone for 60 s, "the shakes": −2 hands for 10 min, sleep pressure +2 h, and the instinct names the thirst and hunger the adrenaline hid.
- **Combat stress load** `stress.loadPts`: a friend killed +20, near death +15, killing +10, wounded +10, a mass-casualty scene +15. It decays 1 a sol with a good night's sleep and morale above 50 (2 with a chaplain's or a counsellor's visit, PEOPLE.md). Over 60: nightmares on 30% of nights (sleep quality ×0.7), a startle at loud noises (−1 eyes for 5 s), −1 social. It is never an "insanity" meter (my call); it is a burden that care and time lift.

### 9.2 Morale (longhaul's, 0 to 100)
- Target (longhaul's `moraleTarget`, adapted): `22 + 0.75 × mean(satisfaction) − 5 per need at its worst two stages − 8 if wounded − 5 hungover (−15 in a crash) + Σ event mods + PEOPLE.md's social term + CAREER.md's career term`, clamped 0 to 100. Satisfaction per need is 100 at its first stage and falls 20 per stage.
- Drift toward the target at 0.004 a minute (a 4 h time constant). Event mods fade with a 2-sol time constant: a death in the unit −25, a promotion +12, mail from home +6, a hot meal after field rations +4, a shower after three sols without one +6, leave +15, cold rations −3, a juice crash −10.
- **Effects**: under 30 "low": −1 mind, training XP ×0.8 (SKILLS.md), sleep quality ×0.9; under 15 "very low": −2 mind and social. Over 80: training XP ×1.1, stress falls ×1.2 as fast. PEOPLE.md uses NPC morale for behaviour.

## 10. Heat: core temperature, cold and suits

### 10.1 Port and change
Tradecraft's `thermal.js` keeps its `STAGES` and `live()` (the log told on a change). Its `settleTo()` (comfort ranges by garment) is replaced by a heat balance, because Mars nights, thin air and suits need one.

| Stage (tradecraft's, kept; heat stroke moved to its clinical line) | Core | Mod | Movement |
|---|---|---|---|
| shivering | < 36 °C | −1 all | |
| hypothermia | < 35 | −3 all | ×0.85 |
| severe | < 33 | −6 all | ×0.7 |
| collapse | < 31 | down | |
| heart stops | < 28 | cardiac arrest (section 21) | |
| hot | > 38 | −1 all | |
| heat exhaustion | > 39.5 | −3 all | ×0.85 |
| heat stroke | > 40 | confused (consciousness V, 17.2): −6 all, simple actions only | ×0.7 |
| heat stroke, collapse | > 40.8 | down, stupor (P) | |
| dead | > 42.5 | | |

Exertional heat stroke is diagnosed at a core above 40 °C with the central nervous system failing (Bouchama and Knochel 2002, NEJM; ACSM 2007), so confusion starts there and collapse follows within a degree. Bent for play: tradecraft kills at 28 °C; real hypothermic hearts usually fibrillate between 28 and 24 °C and some people survive far lower. OLYMPUS makes 28 °C a cardiac arrest, which CPR and rewarming can still reverse (section 21).

### 10.2 The balance: two nodes (on the game's 10 s grid)
The model is Gagge's two-node model (Gagge, Stolwijk and Nishi 1971; Gagge, Fobelets and Berglund 1986; ASHRAE Fundamentals, chapter 9): a **core** and a **skin shell**, `thermal.coreC` and `thermal.skinC`, stepped every 10 s of game time (6 steps a minute, cheap, and stable where a 60 s step is not). The shell takes the early heat debt: in the cold it falls first and fast while the core holds, then the core follows at 1 to 2 °C an hour, as cold-water immersion with losses of several hundred watts cools the core at 1.5 to 3 °C an hour (Tikuisis 1995). With one node, as before, the whole debt landed on the core and the same night gave hypothermia in 35 min.
- **Production** `M = burnKcalH × 1.163` W (basal, activity, fever) plus shivering, all into the core. No external work is counted.
- **Core to shell**: `Hcs = (K_MIN + 1.163 × SKBF) × (coreC − skinC) × A` W, with `A` the DuBois area (1.92 m² for 75 kg, 178 cm) and Gagge's skin blood flow `SKBF = (6.3 + 120 × max(0, coreC − 36.8)) / (1 + 0.5 × max(0, 33.7 − skinC))` L/(m²·h), clamped 0.5 to 90. `K_MIN` is 8 W/(m²·K), Gagge's 5.28 raised for lean young marines (my call, so that the reference night below gives hypothermia within two hours).
- **The shell's share** of body mass is `α = min(0.3, 0.0418 + 0.745/(SKBF + 0.585))`: Gagge's, capped at Burton's 0.3 for the cold (my call; uncapped, the shell would be three quarters of the body at full vasoconstriction). Each step: `skinC += (Hcs − Hskin)·Δt/(α·m·c)` and `coreC += (M − Hres − Hcs)·Δt/((1 − α)·m·c)`, with `c` 3,490 J/(kg·K).
- **Dry loss from the skin** `A × (skinC − To)/(Rcl + Ra)`, `Rcl = 0.155 × clo` m²K/W, `Ra = 1/(fcl × (hc + hr))`, `fcl = 1 + 0.15 × clo`, `hr = 4.7`, and `hc = max(3.1, 8.3·√(wind + walking speed)) × √(pKpa/101.3)`: thinner air carries less heat, so a Melas wind bites a fifth less than the same wind on Earth. `To` is the operative temperature, `(hc·airC + hr·radC)/(hc + hr)`, with the night sky, the sun and the walls in `radC` (2.3).
- **Breath** `Hres = 0.0173·M·(5.87 − pa) + 0.0014·M·(34 − airC)` (Fanger), `pa` the vapour pressure from `rh`.
- **Sweat**: Gagge's regulatory sweat `170 × max(0, Tb − 36.49) × e^(max(0, skinC − 33.7)/10.7)` g/(m²·h), with the mean body temperature `Tb = α·skinC + (1 − α)·coreC`, capped by `traits.sweatMaxLh` (and cut by thirst, 4.3). It evaporates up to `Emax = A × (pSkin − pa)/(Recl + 1/(fcl·he))`, with `pSkin` the saturation pressure at the skin, the evaporative coefficient `he = 16.5 × (101.3/pKpa) × hc` (sweat evaporates more readily at low pressure) and `Recl = Rcl/(0.38 × 16.5 × 101.3/pKpa)`; what does not evaporate drips, lost as water and grime but not as heat. Diffusion through dry skin adds 6% of `Emax`.
- **Shivering**: Gagge's `19.4 × max(0, 33.7 − skinC) × max(0, 36.8 − coreC)` W/m², at most 2.5 × basal (about 213 W). Shivering above 30% of its maximum is "shivering" in words (−1 hands from the shake) even while the core holds.
- In vacuum `hc = 0` and only radiation and contact remain (section 19.6).

### 10.3 Clothing (clo)
PT kit 0.3; "the sweats" (SETTING §5.7's fleece and balaclava for cold dawn PT) 0.8; utility uniform 0.9, 1.0 with load-bearing gear; uniform with field jacket 1.5; cold-weather layers 2.5; extreme-cold parka 3.5; a sleeping bag 4 to 8 (by rating); a light vac suit unpressurised in air 2.0 (its layers), and in vacuum its own thermal system (19.6). Soaked clothing (sweat over 0.5 L into it without drying) counts ×0.6. Items carry `clo` (VIEWS.md's inventory lists them).

**As built in v0.0.4, until the two-node model** (0.0.12; my call, the body role's): `thermal.js` ports tradecraft's single-node model (its `STAGES`, its time constant of 30 minutes indoors, `CORE` 37 °C; heat stroke moved to its clinical 40 °C), on whose scale an outfit's warmth is **3.3 × this table's clo**: PT kit 0.99, the sweats 2.64, utilities 2.97, a towel 0. Indoors at 20 °C nothing moves (37.0 °C after 8 h); an hour out at −10 °C, utilities hold, and the sweats on the dawn run finish at 36.9 °C, as §10.4 has it; **PT kit standing outdoors reaches hypothermia within the hour** under tradecraft's model, harsher than §10.4's two-node figures, so this round's reference PT is run in the sweats.

### 10.4 Reference cases (scratch run, 2026-11-05, reprinted with the two-node model and the night sky; the test prints them)

| Case | M | Result |
|---|---|---|
| Melas night, −30 °C air, 5 m/s wind, clear sky (`radC` −43 °C), standing at a post, utility uniform (0.9 clo) | 154 W | the shell takes it first: skin 27 °C at 10 min, 19 °C at 40; shivering at its maximum (213 W) from 50 min; core 36.3 °C at 1 h, **hypothermia (35 °C) at 1 h 50 min**, falling 1.9 °C an hour; bare face and hands (felt −42 °C) reach frostnip in 3 min and frostbite in 7, long before |
| same under the old `radC` of −20 °C (no sky) | 154 W | hypothermia at 2 h 09 min |
| same, cold-weather layers (2.5 clo) | 154 W | shivering 156 W, skin 22 °C, core 36.4 °C after 4 h: holding, miserable |
| same, cold layers, walking | 193 W | shivering 118 W, core 36.5 °C after 4 h: holding |
| same, extreme-cold parka (3.5 clo), standing | 154 W | light shivering (95 W), core 36.5 °C: holding |
| Melas dawn, −10 °C, PT run in PT kit (0.3 clo) | 368 W | skin 12 °C and shivering while running (109 W); core 36.7 °C after the hour: you finish cold |
| same in the sweats (0.8 clo) | 368 W | skin 21 °C, core 36.9 °C, no sweat: the sweats matter |
| Melas noon, +15 °C, sun (`radC` +30 °C), PT run | 368 W | core 37.1 °C, sweating 0.02 L/h |
| Melas noon, ruck march with 30 kg (1.0 clo) | 288 W | core 37.0 °C, sweating 0.12 L/h |
| 1 G deck, 22 °C, 66 kPa, PT run | 683 W | core 37.9 °C after the hour, sweating 0.38 L/h |

### 10.5 Cold injury
- **Cold hands**: bare hands with `To` under 5 °C cost −1 hands after 10 min and −2 after 30 (manual dexterity falls as skin cools past 15 °C).
- **Frostbite**: per exposed extremity (`hands`, `feet`, `face`), points accrue each minute at `0.165 × e^((−10 − Tfelt)/10)` when `Tfelt < −15 °C`, with `Tfelt = To − 0.6 × hc` (a wind-chill temperature: −30 °C air under a clear night sky in a 5 m/s Melas wind feels −42 °C, and frostnip comes in 3 min) for a bare part, and gloves, boots and a balaclava raising it by their rating (10 to 30 K). Warm again (over 10 °C), points fall 2 a minute until an injury has formed. At 10 points frostnip (pain 2, −1 hands; gone with rewarming); at 30 superficial frostbite (blisters, pain 6, −2 hands or −1 body, 14 days); at 60 deep frostbite (tissue loss: needs a hospital; a permanent −1 on the part as a scar, and amputation of fingers or toes at 90, my call). The calibration follows Environment Canada's wind-chill times: about 30 min at −28 °C felt, 10 min at −40, 2 min at −55.

### 10.6 Heat injury and hot surfaces
- Heat stages as in 10.1. Sweat losses feed thirst (4.2), and dehydration cuts sweating (4.3), so a dry marine overheats sooner.
- Hot surfaces and fire: PLACES.md's `fire` intensity (0 to 1) burns exposed skin at `3 × intensity` % of body surface a minute (section 17.3), ×0.1 through a vac suit's outer layer (longhaul's 15% for suited crew, made stricter).

## 11. Air

### 11.1 What is breathed
The body reads `pKpa`, `o2Kpa`, `co2Kpa` and `coPpm` of the gas at the mouth: the room's (PLACES.md), a mask's, or the suit loop's with the helmet sealed. Inspired oxygen is `PiO2 = o2Kpa × (pKpa − 6.27)/pKpa` (water vapour at 37 °C takes 6.27 kPa, a bigger share in thin air).

| Place (DESIGN.md's air, O₂ 32%, CO₂ 0.6%) | Total | PiO₂ | SpO₂ (acute) | Earth equivalent by PiO₂ | Time of useful consciousness |
|---|---|---|---|---|---|
| Earth sea level | 101.3 kPa | 19.9 kPa | 98% | | none |
| Mariner Valley floor, Base Melas | 66 | 19.1 | 98% | sea level | none |
| Mars datum | 52 | 14.6 | 92% | about 2,400 m | none |
| Highlands, +5 km | 40 | 10.8 | 79% | about 4,300 m | none (mountain sickness within hours, 11.3) |
| Tharsis, +10 km | 30.7 | 7.8 | 62% | about 6,700 m | about 8 min |
| Olympus Mons summit, +21.9 km | 16.4 | 3.2 | under 10% | above 11,000 m | about 30 s |
| Light vac suit, 34 kPa O₂ | 34 | 27.7 | 100% | | none |
| Suit sagging to 15 / 12 / 10 / 8 kPa | | 8.7 / 5.7 / 3.7 / 1.7 | | | 16 min / 2.9 min / 46 s / 11 s |
| Vacuum | 0 | 0 | | | 11 s |

### 11.2 Oxygen
- **Displayed SpO₂** (suit biomedical sensors, a pulse oximeter, the sick bay): alveolar O₂ by the alveolar gas equation, `PAO2 = PiO2 − PaCO2 × (FiO2 + (1 − FiO2)/0.8)`, with `PaCO2 = max(2.5, 5.3 − 0.45 × max(0, 13 − PiO2)) + 0.8 × PiCO2` kPa (the hypoxic drive lowers it; inspired CO₂ raises it), then Severinghaus's curve, `SpO2 = 100/(23,400/(P³ + 150P) + 1)` with P in mmHg. Mild effects come from it: SpO₂ under 90%, −1 body and capacity ×SpO₂/97 (section 8); under 85%, −1 all.
- **Hypoxia dose** `air.hypoxia` (0 upward): each second it rises by `100/TUC(PiO2eff)`, where TUC is interpolated (log-linear) from the USAF table by inspired O₂: none above 10.2 kPa (people live and work at 4,500 m, with mountain sickness, not blackouts); 10.2 kPa 8 h; 9.29 (18,000 ft) 25 min; 7.65 (22,000 ft) 7 min; 6.56 (25,000 ft) 4 min; 5.60 (28,000 ft) 2.75 min; 4.99 (30,000 ft) 90 s; 3.67 (35,000 ft) 45 s; 2.62 (40,000 ft) 18 s; 2.08 (43,000 ft) and below, 11 s. Exertion shortens it: the rate is ×`min(2, 1 + 0.6 × (metG − 1.5)/8)`. Acclimatisation lengthens it (11.3). With good air (PiO₂ ≥ 13) the dose falls 5 a second.
- **Stages of the dose**: ≥ 25 "hypoxic": −2 mind, −1 all, tingling and a narrowing of colour vision; ≥ 60 "impaired": −4 all, the vision cone narrows by a third (PEOPLE.md's perception), poor judgement; **≥ 100: useful consciousness lost** (the TUC): no skill actions except finishing the one you were already reaching for (an easy DC 10 roll to get a mask on or a valve open, the "last act"); stumbling; ≥ 130 unconscious.
- **The brain's two clocks.** While a person is unconscious for want of oxygen, the brain is hurt on one of two clocks, by the effective PiO₂ (ventilation cuts included):
  - **Anoxia**, `air.anoxicS`, 1 a second: PiO₂ under 2 kPa (the alveoli then hold almost nothing once the alveolar CO₂ is taken off), vacuum, an inert gas, a closed airway, cardiac arrest, or no cerebral flow (a G-LOC held under +Gz, 13.3). Brain injury from 180 s; death at 480 s (the cardiac-arrest timescale). CPR (section 21) runs it at ×0.3.
  - **Severe hypoxia**, `air.hypoxicS`, at `k = ((6 − PiO₂)/4)²` a second for PiO₂ from 2 to 6 kPa: brain injury from 900 s, death at 3,600 s of the clock. So at 2 kPa injury comes at 15 min and death at 1 h; at 3 kPa 27 min and 1 h 47 min; at 3.8 kPa (an airliner cabin at 34,000 ft, as in the Helios 522 accident of 2005, whose occupants were alive at impact after about two hours) 50 min and 3 h 18 min; at 5.7 kPa (a suit sagged to 12 kPa; Everest's summit is 5.8) practically never: unconscious, but alive for as long as the suit holds.
  - The two add as shares of a lethal dose: injury begins when `anoxicS/180 + hypoxicS/900 ≥ 1`, then the head takes 0.25 × its capacity a minute on the anoxic clock (0.25 × k on the hypoxic one: anoxic brain injury, a lasting wound); death when `anoxicS/480 + hypoxicS/3600 ≥ 1`. Both clocks fall back at 1 a second once the person breathes good air (PiO₂ ≥ 13); the injury already done stays. `body-air` prints both.
- Hypoxia is insidious: euphoria hides it. The character feels it only by a Medicine or EVA roll (DC 12, −2 per 25 of dose) that the instinct makes on its own each 20 s ("Your fingertips tingle. That's the air."). The altitude-chamber class (section 27) teaches each marine their own symptoms: after it, +4 to that roll for good.

### 11.3 Acclimatisation and mountain sickness
- `air.acclimPiO2Kpa` moves toward the PiO₂ you live in, down with `τ = 7 days`, back up with `τ = 14 days`. Its effect: `PaCO2` is lowered by `0.15 × max(0, 19 − acclim)` kPa (more breathing), and the TUC lookup uses `PiO2 + 0.3 × max(0, 19 − acclim)`.
- **AMS**: above a 3 kPa shortfall (`acclim − PiO2 ≥ 3`) and PiO₂ under 15 kPa, a hazard of 8% an hour from the sixth hour: headache −1 all, nausea, sleep quality ×0.7; worse at a 6 kPa shortfall (−2 all, vomiting). Under PiO₂ 9, HACE or HAPE at 1% a day (down, a hospital). Descent or O₂ clears AMS in 6 to 12 h. This is what the highlands do to a Melas marine on exercise.

### 11.4 Carbon dioxide
- `air.co2Load` follows the inspired CO₂ with `τ = 3 min`. Effects on the load (kPa): "stuffy" (a headache, −1 mind) while the load is at least 0.3 kPa and 0.3 kPa over the body's acclimatisation (below); ≥ 1.0 −2 all, breathing harder (stamina recovery ×0.7); ≥ 3.0 −4 all, panting, headache; ≥ 5.0 −6 all, dizzy, confused (consciousness V); ≥ 8.0 unconscious within 2 min; ≥ 10 death within 10 to 20 min.
- **Acclimatisation**: `air.co2AcclimKpa` follows the inspired CO₂ with `τ = 3 days` (the kidneys buffer it). Martian-born (`traits.co2Native`) start at Melas's 0.40 kPa: the air is home. An Earther or a ship-raised spacer arriving at Melas gets the stuffy headache for 3 to 5 sols (DESIGN.md: "newcomers get headaches").
- **One CO₂ rate everywhere**: the body makes `0.85 × VO₂` (the respiratory quotient), with `VO₂ = M/336` L/min (19.3): at 300 W, 0.76 L a minute, 90 g an hour. A suit with a dead scrubber: the loop's CO₂ rises 1.5 kPa a minute at 300 W (90 g/h into 55 L of loop gas; 0.65 at rest, 3.0 at 600 W). The purge valve (19.4) flushes it at the cost of O₂.

### 11.5 Carbon monoxide and smoke
- **Uptake follows the partial pressure of CO and the breathing** (Haldane; Peterson and Stewart 1975; the Coburn–Forster–Kane equation in its linear early form): `air.coHbPct` rises by `3.3e-5 × coPpm × (pKpa/101.3) × V̇E` % a minute, with ventilation `V̇E = 8 × metG` L/min. It never passes the Haldane equilibrium `100 × 218·pCO/(218·pCO + PaO₂)`. It falls with a half-life of 4.5 h on air, 80 min on pure O₂ (a sealed suit), 20 min in the aid station's hyperbaric chamber. 10% −1 all and a headache; 20% −2 all; 30% −4 all and confusion; 40% collapse; 60% death. Fires make it (PLACES.md's fire model reports `coPpm`).
- What that gives (scratch run; `body-air` prints it): 20 min at 1,000 ppm at sea level, 5.6% at rest and 16% working (metG 3); at 6,400 ppm, 34% at rest and collapse at 8 min and death at 12 working, as the standard exposure tables have it. In Melas air (66 kPa) the same ppm acts at 0.65 times. PLACES's squad-bay fire with its door shut (about 9,000 ppm at 66 kPa) brings a sleeper to collapse at 28 min and death at 43, and a marine on his feet looking for the door (metG 1.5) to collapse at 18 min: shut the door and those inside are lost to the CO, as PLACES chose.
- Smoke: −1 eyes per 0.2 of `smoke`, coughing (a breath-hold of 5 s each 20 s spoils an aim), and the CO above.

### 11.6 Pressure
- **Vacuum and ebullism**: below 6.3 kPa (the Armstrong limit) body water boils at body temperature. Each second of exposure: ebullism injury points +1 (swelling of skin and soft tissue, pain 2 a point up to 20); the hypoxia dose as above (11 s to useful consciousness lost, about 15 s to unconsciousness); after 60 s, `+0.01 × torso capacity` a second (the heart and lungs fail); **after 120 s, death** (dogs and chimpanzees survived up to about 90 s to 3.5 min; Jim LeBlanc's 1966 chamber accident lost consciousness at about 14 s and recovered after repressurisation). Repressurised before 90 s, the swelling subsides in hours and ebullism leaves only pain and a sick bay check.
- **Lung barotrauma** depends on the total drop since the glottis closed, however slowly it comes (the same 8 to 10 kPa of over-pressure that tears a diver's lungs in a metre of breath-hold ascent). When a breath is held (a breath-hold, a strain, the startle of a sudden loss), `air.holdKpa` records the surrounding pressure. When `holdKpa − pKpa` passes the person's tolerance `air.lungTolKpa = 8 + 2u` kPa (drawn once from their stream), the lungs tear: a pneumothorax (17.3) and, 30% of the time, an arterial gas embolism (a stroke-like event: head +0.5 × capacity, unconscious, death within minutes without recompression). Exhaling ends the hold. **Explosive decompression** tears lungs even with the airway open: when more than half the pressure goes in under 0.2 s (a shattered visor), 20% of people take a lung injury whatever they do. A sudden loss starts with the breath held by the startle 50% of the time, 20% for a marine trained in the Tank (EVA 10 or more, my calls). A decompression faster than 8 kPa/s raises the reflex card (section 26), whose options trade against each other. With no answer chosen, the body exhales on an EVA or Warfighting roll against DC 10 (untrained DC 15).
- **Ears and sinuses** are not symmetric. Going down in pressure, the middle ear vents by itself through the Eustachian tube, so a decompression rarely hurts the ears. Going up, it must be opened (a swallow, a yawn), so `air.earsKpa` follows a rising outside pressure only at 3 kPa a second (0.5 with a blocked ear from a cold or ARS). A gap over 8 kPa: ear pain (pain 4, −1 eyes); over 15 kPa: a ruptured eardrum (pain 8, hearing ×0.5 on that side for 4 to 6 weeks, vertigo −1 body for a day). Repressurising an airlock fast does this to the unwary.

### 11.7 Decompression sickness (the bends)
- **Tissue nitrogen** (nitrogen with argon, which acts alike): two compartments, `n2FastKpa` (half-time 40 min, the spinal and neurological "chokes") and `n2SlowKpa` (420 min, the joints; NASA's tissue-ratio models use a 360 min tissue), each relaxing toward the inspired N₂ + Ar (`(pKpa − 6.27) × fN2`; zero on pure O₂). Hard exercise washes both out 4 times as fast while it lasts, light exercise 1.5 times (better perfusion: the reason for NASA's exercise prebreathe; my calls fitted to it).
- **Risk**: `R = max(n2Slow, 1.15 × n2Fast)/pKpa`. Each minute with `R > 1.30`, a hazard `0.0037 × (R − 1.30)` (recalibrated 2026-11-05 against NASA's prebreathe experience, Gernhardt 2006: a 4 h in-suit prebreathe for the Shuttle's 29.6 kPa suit, or the ISS's 2 h exercise protocol, to stay near 10% or under; and the USAF chamber trials, Webb and Pilmanis, where an hour's resting prebreathe before about 30 kPa still left tens of percent). Onset is delayed 10 to 60 min after the risk.
- **Calibration** (scratch run, 6 h at the suit's pressure; `body-dcs` prints it over 4,000 seeded people):

| Move | Peak R | P(DCS) |
|---|---|---|
| from a 101.3 kPa Earth-air hull into a 34 kPa suit, no prebreathe | 2.50 | 37% |
| the same after 30 / 60 / 120 / 240 min breathing pure O₂ at rest | 2.07 / 1.97 / 1.78 / 1.46 (the slow tissue) | 31% / 25% / 15% / 2% |
| the same after 120 min with exercise (10 min hard on the bike, 50 min light, 60 min at rest: the ISS's protocol) | | 8% |
| from a 101.3 kPa hull into the light suit's high mode (55 kPa) / the hardshell's (57 kPa), no prebreathe | 1.55 / 1.49 | 0.4% / 0.2% |
| from Melas's air (65.9 kPa, N₂ + Ar 44.4 kPa) into a 34 kPa suit | 1.36 | 0.02% |
| from a Martian-standard hull (66 kPa, N₂ + Ar 44 kPa: MCRN ships, PLACES §3.2) into a 34 kPa suit | 1.35 | 0.01% |
| from Melas up to Olympus Mons summit (17 kPa), unsuited, fast | 2.72 | 54% |

- **The Martian advantage**: Martians living in 66 kPa air are suit-ready without a prebreathe; a marine off a 101 kPa ship needs four hours on pure O₂, two with the exercise protocol, or the suit run high (the light suit's 55 kPa mode, stiff; the hardshell's 57 kPa, which costs it nothing, 19.11). PLACES §3.2 runs MCRN hulls on Martian standard air (66 kPa) and UN hulls on Earth air, which makes going into vacuum a prebreathe problem for Earthers and a non-event for Martians.
- **Effects**: type I (joints, 80% of cases): pain 12 in a joint, −1 body, for 6 to 24 h. Type II (neurological or the chokes): −4 all, numbness, breathing trouble, collapse 30% of the time, death 5% without recompression. Treatment: recompression (an airlock run back to 101 kPa helps; the aid station's chamber cures), pure O₂ (halves the duration). The same model covers a cabin that loses pressure and a fast climb by vehicle (the Olympus row).

### 11.8 Fit-for-air rules the instinct knows
"Thirty-four kPa of oxygen in the suit, sixty-six in the valley: you'll not bend." "Off a hundred-kilopascal ship? Four hours on the mask, two on the bike, or run the suit high." "Never hold your breath in a decompression." These are the drill instructor's lines (T), each firing only when it applies.

## 12. Radiation

### 12.1 Dose rates by place
PLACES §3.10's `doseAt` is the one number for every place (the hub: one quantity, one helper); the values below are its, quoted for the tests, except where marked.

| Place | Effective dose rate | Basis |
|---|---|---|
| Earth sea level | 0.27 µSv/h (2.4 mSv/yr) | world average (reference) |
| Base Melas, valley floor (1,770 g/cm² of air) | 0.08 µSv/h (0.7 mSv/yr): cosmic 0.03, ground 0.05 | under that column the cosmic part is below Earth's polar sea-level dose (about 0.3 to 0.4 mSv/yr under 1,033 g/cm², UNSCEAR); the basalt's gamma adds the rest |
| Mars datum / Tharsis +10 km / Olympus summit | 0.10 / 0.25 µSv/h / about 1.4 (BODY's estimate for the summit's 460 g/cm², for PLACES to adopt) | the cosmic part rising as the air column thins |
| Phobos surface / the concourse under 20 m of rock | 40 / 0.8 µSv/h | |
| interplanetary cruise: free / ship decks / storm shelter | 75 / 30 / 19 µSv/h | Curiosity's cruise measured 1.8 mSv/day in a light hull |
| solar particle event (August 1972 class, 12 to 24 h), free space, behind 5 / 20 / 50 g/cm² | 0.5 to 1.5 Gy-Eq to the blood-forming organs, the skin 3 to 5 times that / 0.3 to 0.5 / about 0.03 over the event | NCRP Report 153 and NASA's event studies (BODY's); PLACES's decks and shelter take up to 50 and 5 mSv/h at the peak; TIME.md's world layer schedules events, ships call "storm shelter" |
| Europa orbit: free / warship decks / storm shelter | 450 / 9 / 0.9 mSv/h | the trapped belts with the full sky |
| Callisto surface / the base under 3 m of regolith | 60 µSv/h (1.4 mSv/day) / 1.2 µSv/h | galactic cosmic rays on an airless surface (Chang'e 4 measured 1.37 mSv/day on the Moon, Zhang et al. 2020; Jupiter's field gives Callisto only a few GV of cutoff), plus a little from the belts. Ringwald's 0.1 mSv/day is the trapped-particle term alone. "The safe moon" is safe beside Europa |
| Ganymede surface | 3.3 mSv/h (80 mSv/day) | |
| **Europa surface** | **225 mSv/h (5.4 Sv/day)**; skin dose rate 2.25 Gy/h, ten times | DESIGN.md |
| Europa under ice | 1 m: 0.61 mSv/h; 2 m: 82 µSv/h; 3 m: 11 µSv/h; 5 m and deeper: under 0.2 µSv/h (the FOB under 6 m of blocks: 0.03) | PLACES's depth function, which is the curve below with ice at 92 g/cm² a metre |

**Shielding: one curve, one table** (BODY's; PLACES's `doseAt` reads the curve for every shield it knows by areal density). Against Jupiter's electrons and the photons they make, the effective dose behind `x` g/cm² of water-equivalent shield (ice, water, polyethylene and tissue count in full; metals at 0.8, my call) is

`shieldK(x) = 0.49·e^(−x/0.5) + 0.49·e^(−x/4.6) + 0.02·e^(−x/46)`

(the soft electrons stopped in the first g/cm², the hard electrons over a few, the bremsstrahlung and proton tail over tens: my fit, which keeps PLACES's depth function exactly from 0.5 m of ice down, and gives the light suit the factor near 0.4 that SETTING's 1.5 g/cm² supports). The skin dose behind it is `skinK(x) = 0.9·e^(−x/0.6) + 0.1·shieldK(x)`.

| Shield (on Europa's surface) | x, g/cm² | effective × | dose rate | to a 20 mSv plan | skin × |
|---|---|---|---|---|---|
| none | 0 | 1 | 225 mSv/h | 5 min | 1 (2.25 Gy/h) |
| light vac suit, HAD Mk 7 | 1.5 | 0.40 | 89 mSv/h | 13.4 min | 0.11 |
| hardshell, HAD M-22, with its liner (19.11) | 5 | 0.18 | 41 mSv/h | 29 min | 0.02 |
| assault lander's cabin on the pad | 8 | 0.10 | 23 mSv/h | 52 min | 0.01 |
| the Lorica, HAD PA-3 (later, 19.11) | 12 | 0.05 | 12 mSv/h | 1 h 44 min | 0.005 |
| ice crawler's cab with its water jacket | 25 | 0.014 | 3.1 mSv/h | 6.5 h | 0.001 |
| a transport's hull and water walls | 40 | 0.0085 | | | |

Half an hour on the surface in a light suit is 45 mSv; four hours is 358 mSv (0.36 Gy-Eq): no symptoms, the lymphocytes fall, and more than the year's limit is spent (CAREER §15.6). In a hardshell the same four hours are 165 mSv.

### 12.2 Ledgers and the dosimeter
- Each second, `dose = doseRateSvH/3600 × shieldK` adds to `rad.careerSv`, `yearSv` (a rolling 365 UTC days), `deploySv` (CAREER.md resets it) and `daySv`: effective dose in sieverts, the measure of late, stochastic risk (ICRP 103).
- **Acute effects are counted in gray-equivalents** (absorbed dose to the blood-forming organs, weighted for deterministic effects; ICRP keeps the sievert for stochastic risk): `rad.acuteGy` adds `dose × gyPerSv` (2.3: 1.0 in Jupiter's belts, 0.75 for solar protons, 0.4 for galactic cosmic rays) and decays with `τ = 5 days` (repair, my call): a protracted dose does not cause radiation sickness, a big fast one does. `skinGy` accrues from `skinRateGyH × skinK` in the same way.
- **The dosimeter** is the only way the character knows a dose (DESIGN.md's HUD rule). An electronic personal dosimeter on the chest (issued with the suit and on Europa duty, a kit item) reads the rate in µSv/h or mSv/h, the shift dose and the total, and alarms at set points (a rate of 1 mSv/h; a shift budget). The suit HUD repeats it. Without one there is no number; symptoms come days later.

### 12.3 Acute radiation syndrome (on the peak of `acuteGy`)
When `acuteGy` crosses a band, the course is scheduled from the time of crossing (`rad.ars = { band, prodromeMs, latentEndMs, manifestEndMs, outcome }`):

| Band (Gy-Eq) | Prodrome (onset, length) | Latent | Manifest | Outcome without care / with an aid station / with a hospital |
|---|---|---|---|---|
| 0.25 to 1 | none (lymphocytes fall: a blood test shows it) | | | none |
| 1 to 2 | nausea in 2 to 6 h, 30% vomit, under a day: −2 all | 3 weeks | 3 weeks of fatigue −1 all, infection hazard ×1.5 | all survive |
| 2 to 4 | vomiting in 1 to 2 h (80%), a day: −3 all | 1 to 3 weeks | 4 to 8 weeks: fever, infections ×3, bleeding rates ×1.5, hair loss above 3 Gy: −2 all | 5 to 50% die / 5% / 1% |
| 4 to 6 | vomiting within an hour, 2 days: −4 all | 1 week | 6 to 8 weeks: −4 all, infections ×5, bleeding ×2 | 50 to 90% / 30% / 15% |
| 6 to 10 | within 30 min, with diarrhoea: −5 all | days | gut failure: −6 all | 100% / 80% / 50% |
| 10 to 30 | within 15 min: −6 all | hours to 2 days | gut syndrome | death in 1 to 2 weeks |
| over 30 | minutes: early transient incapacitation for 10 to 30 min, then partial recovery | hours | CNS syndrome | death in 1 to 2 days |

Outcomes are drawn once at the band crossing from the person's stream, weighted by the care they get in the manifest phase (CAREER.md and COMBAT.md's CASEVAC decide where they are). Healing of all wounds runs ×0.5 in the manifest phase.

- **Radiation burns** (skin dose, after ICRP 118 and the FDA's fluoroscopy skin table): ≥ 2 Gy transient erythema (a flush within hours, gone in a day, no pain); ≥ 6 Gy erythema and temporary hair loss (pain 2, 3 weeks); ≥ 10 Gy dry desquamation (pain 3, itching, 4 weeks); ≥ 15 Gy moist desquamation (a burn on the exposed area, pain 8, burn infection hazard, 6 weeks); ≥ 18 Gy ulceration (a hospital); ≥ 25 Gy dermal necrosis (grafts). All but the transient flush appear 1 to 3 weeks after the dose.
- **Late effects** for CAREER.md: an excess cancer risk of 5% per sievert of career dose (ICRP's nominal 5.5%), drawn on CAREER's retirement and old-age timeline; cataracts above 0.5 Gy to the lens.
- **Limits are CAREER §15.6's**, one table that BODY, SETTING and COMBAT cite: today an annual limit of 0.25 Sv and a career limit of 1.0 Sv, with SETTING §7.3's operational levels (50 mSv a rotation for planning, 150 by a battalion commander's authority, 250 to save life) and COMBAT §15.3's EVA plan and ceiling to be gathered into it. BODY only keeps the ledgers CAREER reads (`yearSv`, `deploySv`, `careerSv`) and the dosimeter's alarms.
- **Drugs** (section 20): radioprotector tablets taken 30 min before a surface job (dose reduction factor 1.4 on `acuteGy`, 1.15 on the late-effect ledgers, for 4 h; nausea and −1 body), anti-emetics for the prodrome, and the aid station's marrow stimulant (it moves the outcome one column right).

## 13. G-load, acute

### 13.1 Axes and posture
The felt acceleration `gG` along `gDir` is resolved on the body's axis by posture: standing, walking, kneeling and seated upright take it as **+Gz** (eyeballs down); prone or supine on a deck take it as **±Gx** (chest to back); a crash couch reclined at `θ = 75°` from the thrust axis (the standard, my call) takes `Gz = g·cos θ = 0.26 g` and `Gx = g·sin θ = 0.97 g`; an upright drop-ship seat takes all of it as +Gz; hanging head-down under thrust takes **−Gz**; side loads (jinking, RCS) are ±Gy.

### 13.2 Protection: the effective G
LONGHAUL's `protectedG` (crew.js), kept: unsecured, `gEff = g`; secured in a couch without juice, `0.7 g`; secured and juiced, `g/3` on the standard dose, `g/4.5` on the high dose. Each component (Gz, Gx) is divided the same way. This is the setting's one great bend from real physiology (the Expanse's juice): no real drug lets a body sit at 5 G for a day. It is LONGHAUL's world, which the user built and tuned (juice since longhaul v0.3.5, 2026-03-23; its costs, 2026-10-19), so it stays (open question 6).

### 13.3 +Gz: grey-out, blackout, G-LOC (fast layer)
- **Threshold** `T = 3.8 + 1.2 × min(1, gCond) + 1.5 (anti-G straining, while held) + compG − penalties`. A Martian civilian (gCond 0.38) has 4.3 G relaxed; a conditioned marine (1.0) 5.0 G (relaxed human centrifuge tolerance is about 5 to 6 G at gradual onset). `compG` is the baroreflex: it builds to +0.5 G with `τ = 10 s` above 2 G and falls back below it. Penalties: `5 × (1 − plasmaK)`, 0.15 per % of water deficit, 0.3 weak from hunger, 0.5 pale, 1.5 in shock, 0.5 with core above 38 °C, 0.3 with `pEff ≥ 20`, 0.5 hypoxic (dose ≥ 25).
- **Vision**, lagged by `τ = 2 s` (the retina's oxygen reserve): grey-out at `Gz ≥ T − 1.2` (the vision cone closes to a tunnel; −2 eyes); blackout at `Gz ≥ T − 0.5` (no sight: −10 eyes, no aimed shots; hearing goes on).
- **Brain reserve** `g.reserveS`, 6 s full. Above T it drains at `min(1, 0.5 + (Gz − T)/2)` s per second (no flow at all drains it in 6 s, whatever the G); below `T − 0.3` it refills at 0.5 a second. At 0, **G-LOC**: unconscious for `12 + 3 × (peak − T)` s (at most 25 s) once Gz is back under T, then 15 s dazed (−6 all, simple actions only). While Gz stays over T the person stays out; falling down turns +Gz into Gx, which is why a G-LOC'd marine on a deck under thrust comes round, and one in an upright seat may not (after 30 s out, 11.2's anoxic clock starts: no flow to the brain).
- **Anti-G straining manoeuvre** (AGSM) is a **held technique, not a reflex card's answer**: a step in the panel held down while Gz is over 2 G (VIEWS.md binds it). `g.agsm` ramps to its full +1.5 G over `1.5 s × paceOf(the better of EVA and Warfighting)` (SKILLS §5.12) and drains stamina at 1.2 × capacity (2.45 a second: 41 s from full, section 8); blown, it gives only +0.5 G. Released, the extra falls away in 1 s. So the timing is the decision: strain too early in a long profile and you are blown before the peak, too late and the grey has closed in (the vision lags the brain by 2 s, and the reserve is already draining). The instinct says "Strain! Legs, gut, breathe in bursts" when the grey begins. A trained marine (EVA or Warfighting 12 or more, my call) strains at the grey by himself, and the start is logged ("strained at the grey: EVA 14"); the player can still hold or release it.
- **−Gz**: past −2.5 G for 5 s, red-out (−4 eyes), headache, petechiae; past −3 G for 10 s, an eye haemorrhage (−2 eyes for a week).
- Computed timings (scratch run; the test prints them): a conditioned marine relaxed at 7 G reached at 3 G/s greys out at 0.9 s, blacks out at 1.2 s and loses consciousness at 7.4 s; straining, at 11.3 s; a Martian civilian at 6 G reached at 1 G/s, G-LOC at 9.7 s; a deconditioned marine (T 4.0) at 5 G, 10.1 s; juiced on the standard dose at 12 G, grey-out only.

### 13.4 +Gx: the chest
Bands on `Gx` effective: ≥ 3 heavy chest −1 all; ≥ 5 speech hard −2 all; ≥ 7 breathing laboured −4 all, ventilation ×0.7 (the hypoxia lookup uses `PiO2 × 0.7` for its share); ≥ 9 −6 all, ventilation ×0.4; ≥ 12 no breath worth having, ventilation ×0.1. Real reclined +Gx tolerance runs to about 6 G for 10 min and 10 G for 2 min; juice and the couch carry LONGHAUL's crews far past that.

### 13.5 Strain and injury (slow layer, LONGHAUL's per-minute rates ÷ 60 per second)
On the scalar `gEff`, with the strain band shifted for conditioning: the strain band starts at `max(0.75, 1.5 × gCond)` G (1.5 G for a conditioned marine, as in longhaul; 0.75 G for a Martian civilian).

| gEff | Per second (part damage as a share of capacity) | Other |
|---|---|---|
| ≥ 8 | head 0.00033, torso 0.00042, arms 0.00025, legs 0.00033 | cardio strain; heart health −0.025/s |
| 2.5 to 8 | torso 0.000067, legs 0.0001 | cardio strain; heart −0.005/s; consciousness as 13.3 |
| strain band to 2.5 | legs 0.0000083 | stress +1.5 a minute |
| under the band | longhaul's slow mending applies | |

Sustained cardio strain past 10 min (`heart.strainS`) wears `heart.health` (0 to 100, longhaul's heart) at longhaul's `0.1 + 0.02 × (min − 10)` a minute. Unsecured at 3 G, longhaul measured injury at 50 min, unconsciousness at 59 and death at 106; OLYMPUS keeps those numbers for a body lying on the deck (bone index scales the leg damage by `1/bone`). Real supine 3 G is tolerated for hours, so this is listed in §1.1 with juice, as LONGHAUL's tuned rule.

### 13.6 Juice, re-based to seconds
- **Who doses**: the couch's injector, for its occupant, when (a) `g > 1.5` and the burn plan runs 10 min or more, (b) `g ≥ 4.5` for any time, or (c) the ship's officer orders it. Short drops at 2 to 3.7 G for 90 s get the couch and the strain, not the drug (my call: real +Gx at those levels needs none, and LONGHAUL's hangover would cost two sols for a minute's ride).
- **Doses** (LONGHAUL's): standard (1 med unit), above 6 G high (2 units, or 1 to top up), plus a booster each 86,400 s on the high dose. The dose lingers 3,600 s after `g ≤ 1.5` (LONGHAUL's 60 min), so a flip or a lull costs nothing new. `g.juice = { dose, sinceMs, peakG, highS, idleS }`.
- **While active**: tolerance as 13.2; heart rate +30 bpm (+60 high), systolic +22 (+44); sleep quality ×0.5; hunger muted (gut stage words suppressed); on the high dose −1 hands (tremor) and a stroke hazard of `0.0006/60 × (G − 6)` a second (head −8 to −18 points of LONGHAUL's 100, as `0.08` to `0.18` × head capacity, unconscious).
- **Hangover** (LONGHAUL's `endJuice`): standard `4,320 × min(max(peakG, 1.5)/5, 1)` min (21.6 h at 1.5 G, 43 h at 3 G, 72 h from 5 G); high `4,320 × min(max(peakG, 1.5)/5, 2) + 1.5 × minutes on the high dose`, at most 10 days, plus heart stress +40, heart health −15 and morale −10 (a crash). While hungover: −1 all (crash −3), morale target −5 (−15), and a brain-bleed hazard of `0.003/60` a second under `gEff ≥ 1.5` (`0.006/60` in a crash; head −0.03 × capacity). Rest does not shorten it; a hospital clears it. The user's "steep cost in terms of aftereffects, but the dosage shouldn't be that high" (2026-10-19) is exactly this.

### 13.7 Being thrown
Drive start, cut and flip throw anyone unsecured (LONGHAUL's `inertia.js`, with OLYMPUS's axes: lighting the drive drops floating bodies to the deck at `√(2·a·h)`, a cut leaves them floating, lateral throws come only from RCS, a flip or an impact). Contact speed goes to `applyImpact` (section 16.5). Announced changes of 1.5 G or less, and surprises of 0.5 G or less, are braced against (LONGHAUL's `BRACE_G`, `SURPRISE_G`).

## 14. Gravity, chronic: G-conditioning, bone, plasma, balance

### 14.1 G-conditioning
`cond.gCond`, in G: the gravity the body is conditioned to live and work in. A Martian civilian sits at 0.38, a Belter at about 0.3, an Earther at 1.0, a marine fresh from boot camp at 0.90 to 1.00 (DESIGN.md: "Martian Marines train at 1 G under thrust and in centrifuges").
- **The weekly dose.** The stimulus is the gravity you live in plus the hours a week you spend well above it, weighted by dose (a single hour at 1 G is not a day at 1 G). Each day writes `{ liveG, hiH, hiG }` into `cond.gWeek` (the last 7 days): `liveG` the median felt g of its waking hours, `hiH` the hours at a felt g of `liveG + 0.2` or more, counted in full on your feet, at half seated and at a quarter lying down (lying takes the load across the body, not along it: a heavy night asleep in the Ring's bunk cars counts a quarter, my call), and `hiG` their mean g. On a short-arm machine the g counted is the g at the centre of mass (about 0.55 of the g at the feet for a 2.2 m arm). Over the week: `gLive` is the mean `liveG`, `hWeek` the sum of `hiH`, `gSession` the hours-weighted `hiG`.
- **Equilibrium**: `gEq = max(gLive + (gSession − gLive) × min(1, hWeek/8)^0.25, 0.3 + 0.02 × effFitness)`. On Mars at 1 G sessions: none 0.58 (the fitness floor at Fitness 14), 2 h a week 0.82, **4 h (the Plan of the Day's two 2 h Ring blocks) 0.90**, 6 h 0.96, 8 h and more 1.00. A third session buys about +0.05, a fourth +0.04. This is stronger than any trial has shown (§1.1).
- **Movement**: `gCond` moves toward `gEq` with `τ = 30 days` going up, and going down with `τ = 20 + 100 × min(0.3, gLive)` days: 50 days on Mars or any deck of 0.3 G or more, 33 on Europa, 20 in free fall (my calls: strength and orthostatic tolerance are lost faster than gained, and fastest with no weight at all; the floor is what a fit body keeps, as astronauts walk off a six-month flight, weak). What that gives (scratch run; `body-cond` prints it):
  - a marine fresh from boot at 0.92 who skips the Ring through the standby: 0.89 at the G-house on career sol 4 (still G-1), 0.86 on the standby's tenth sol, 0.85 by sailing day (Sol 602) and **0.83 after 14 sols**, the longest standby (`STANDBY_SOLS` 10 + slip, CONTRACTS §3): heavy at 1 G (r 1.20) and a heavy first day of the voyage, 26.2's story; on the two blocks, 0.92 holds;
  - a Fitness 12 marine on Europa with no centrifuge falls from 1.0 to 0.58 in twelve weeks, and a 1 G deck is then "very heavy";
  - on Europa, 4 h a week on a machine giving 1 G at the centre of mass holds 0.86, 8 h 0.99; PLACES's Hamster at the FOB (1.2 G at the feet of a 2.2 m arm, 0.67 at the centre of mass) holds only 0.61 at 4 h and 0.68 at 8 (a note for PLACES, section 28);
  - the homeward 12.5-day voyage at 0.3 G, from 0.92: 0.84 with no sessions, 0.91 with 4 h a week at 1 G (from the 0.86 a machine held on Europa: 0.80 and 0.87); the first voyage, 6.9 days at 1 G, is itself the stimulus (from 0.85, where a standby without the Ring leaves a marine on Sol 602, to 0.88 in a 6.9-day run) (SETTING §6.5; CONTRACTS §14).
- **The Ring's capacity** (PLACES §4.9: 60 seats, 2 h sessions with 6 min spin-up and spin-down): 7 sessions between 05:00 and 22:00 are 420 seats a sol and 2,940 a week against the battalion's 1,960 (2/4's 980 marines × 2 blocks: CONTRACTS §15), 67% booked, which leaves about 980 seats a week for evening bookings and the remedial programme; round the clock it is 4,200. PEOPLE schedules the Ring by company, PLACES books the evening seats, and TIME's `centrifuge` activity is the Ring's 2 h block, whose doors lock while it spins (section 28). `body-cond` prints seats booked against demand.
- **Effects** by `r = g/gCond` (felt g sustained for more than 10 s; acute events use section 13):

| r | Words | Mods | Movement and other |
|---|---|---|---|
| ≤ 1.15 | | | |
| 1.15 to 1.5 | heavy | −1 body | walk ×0.95; sleep pressure ×1.15 |
| 1.5 to 2.0 | very heavy | −2 body, −1 hands | walk ×0.85; no sprint the first sol; 2% chance to faint each time you stand up |
| 2.0 to 2.8 | crushing | −4 body, −2 all | walk ×0.65; no run; 8% faint on standing |
| over 2.8 | can't stand for long | | lie down within minutes (longhaul's prone band) |

A Martian civilian on a 1 G deck (r 2.63) is crushed; a conditioned marine is not.

- **`gqClass(body)`** runs CAREER §7.3's G classes on this model: CAREER owns the test and its gates, this section the physiology, and the lived Ring stint and Long Arm run use the same functions, so what the player feels in the gondola is what is graded. The gates (CAREER §7.3's, adopted here on 2026-11-06; they replace this section's earlier `gCond` ≥ 0.90 with a 10 min hold at 3 G, and ≥ 0.70 with 5 min at 2 G):
  - **G-1**: 2 h working at 1 G in this section's unburdened band (r ≤ 1.15, so `gCond` about 0.87 or more), then the Long Arm to **3.5 G held 2 min**, seated upright (+Gz, the gondola's eyeballs-down seat), relaxed, with no grey-out at the day's penalties (13.3). Reaching 3.5 G at 0.1 G/s the baroreflex has built about +0.39 G, so the grey-out line (`T − 1.2`) stands at about 4.07 G at `gCond` 0.9 and 4.19 G at 1.0, and at 3.44 G for a Martian civilian (0.38), who fails (CAREER §7.3's sums). A tired, dry marine loses some of the margin (0.3 at `pEff` ≥ 20, 0.15 for each % of water deficit): drink and sleep before the G-house. Straining is allowed and logged, but the physiologist grades the relaxed run (my call).
  - **G-2**: 2 h at 1 G no worse than "heavy" (r ≤ 1.5, `gCond` about 0.67 or more), then **2.5 G held 2 min**, a lander's powered descent, with no grey-out; the acute part passes almost everyone, and the 1 G work decides.
  - **G-3**: below G-2: Mars and low-g posts only, the remedial programme (5 sessions a week) and a retest after 30 days (CAREER §7.3).
- **`perf(body, regime)`** for CAREER §7.1 and §7.2's PFT and CFT: `P = effFitness × gK + Σ` the negative values of `bodyMods` and `needMods` on Fitness, leaving out the G-conditioning row (gK carries it), floored at 0. `gK = min(1, r^−0.6)` with `r = gRegime/gCond` (`regime` 'oneG' is 1.0 G, 'mars' 0.38): gCond 0.92 gives gK 0.95 at 1 G (CAREER's average new join), 0.85 gives 0.91, 0.70 gives 0.81, a civilian's 0.38 gives 0.56; on Mars every marine has gK 1.

### 14.2 Bone
`cond.bone`: a strength index, 1.0 for an Earth-adapted adult. Its equilibrium follows the habitual load: `boneEq = 0.55 + 0.45 × √min(1, gHabBone)`, where `gHabBone = gLive + 0.25 × (gEq − gLive)`, plus 0.3 for resistance exercise in free fall (the ISS's resistive device halves the loss). Centrifuge sessions help bone only a quarter as much as they help G-conditioning (AGBRESA found bone little protected, §1.1). Free fall gives 0.55, Europa 0.71, Mars 0.83 (0.87 with the two Ring blocks), Earth 1.0. Loss toward it: `−0.0267 × (bone − eq)` a month (1.2% a month from 1.0 in free fall, the spaceflight figure); gain: `0.01 × (eq − bone)` a month (bone comes back slowly, over years). Bone-density tablets halve the loss (section 20).
- Effects: crack and fracture chances ×`(1/bone)²`; fall injury thresholds ×bone (16.5); G strain leg damage ×`1/bone`; fracture healing ×bone. CAREER.md's medical board reads `bone < 0.7`.

### 14.3 Plasma volume
`cond.plasmaK` relaxes toward 0.88 in free fall, 0.94 under 0.2 G, 1.0 at 0.3 G or more (by `gLive`), with `τ = 18 h` down (the 10 to 15% loss of the first one or two days, Leach et al. 1996) and `2 days` up. The plasma lost leaves as urine and moves the water balance's zero (4.2). Effects: the G-LOC threshold penalty (13.3), and on standing up at 0.5 G or more with `plasmaK < 0.95`, a chance to faint of `4 × (0.95 − plasmaK)` (28% at 0.88): the astronauts' orthostatic intolerance after free fall.

### 14.4 Balance: space sickness and gravity legs
- `cond.vestAdapt` (0 to 1, adapted to free fall) rises with `τ = 1.5 days` in free fall and falls with `τ = 3 days` in gravity.
- **Space adaptation syndrome**: in free fall, severity `traits.sasK × (1 − vestAdapt)` (`sasK` is drawn per person; 70% of people have more than 0.3, matching the 60 to 70% of astronauts affected). Over 0.2 mild (−1 all, appetite halved); over 0.35 moderate (−2 all, vomiting hazard 5% an hour); over 0.5 severe (−3 all, vomiting 20% an hour). Vomiting in a sealed helmet: the visor is fouled (−4 eyes until the helmet is opened; in vacuum it can't be), and 10% of the time some is inhaled (a chest injury: coughing, −2 all, pneumonia hazard 30% over 3 days). Anti-motion drugs cut it ×0.3 (section 20).
- **Gravity legs**: returning to 0.3 G or more with `vestAdapt > 0.5`: vertigo −1 body and a 2% chance a second to stumble when running, for `2 × vestAdapt` days.

## 15. Fitness and effective fitness
Tradecraft's `fitness.js` is ported unchanged in its rules (base and effective fitness, the weekly load, `upNeed(b) = 4.5b`, `holdNeed(b) = 2.2b + 2·max(0, b − 12)`, the band of ±3, two weeks at an edge to move the base) because they are the user's (2026-11-03, quoted in section 1).

### 15.1 What changes
- **Points by gravity**: a kilometre run gives `2.5 × fRun(g)` points, walked `0.6 × fWalk(g)`, both ×(1 + load/mass); on Mars a run is worth 1.18 points, on Europa 0.66 (2.5 × 0.264), in free fall nothing. Resistance gyms on Mars and aboard use flywheels and bands, not weights: a session is 10 points at any g (tradecraft's `SESSION_PTS`). A centrifuge or thrust-gym session with exercise at 1 G is 8 points; combatives 7 (tradecraft's `CLASS_PTS`); light PT 4; a ruck march of 10 km with 30 kg on Mars 5.3 points by the walking rule (0.6 × 0.63 × 1.4 a km), because 30 kg weighs 11 kg there: a hump is light work on Mars and heavier on a 1 G deck (8.4 points).
- **Week**: the training week is SKILLS's `FIT_WEEK_MS` (621,426,708 ms, 7 sols), counted in absolute time since the career began and rolled at its own absolute period, `every@<ms>`, not by the day layer (SKILLS §8; TIME §11.3; CONTRACTS §5). It is not the calendar's Monday to Sunday: it stays 7 sols long aboard ship, at Callisto and on Europa, so a change of clock never closes a week early or moves it. Rest sols keep the calendar's week (SETTING §3.4), and pay and evaluations stay on UTC (CAREER §2.3).
- **Effective fitness** feeds stamina capacity (8), the pain limit (`30 + 2 × Fitness`, tradecraft's), part capacities (`takes × (1 + Fitness/20)`), and SKILLS.md's Fitness skill value.
- Fitness and G-conditioning are separate: Fitness is how hard the body works, G-conditioning in what gravity it can.

## 16. Locomotion in every gravity

### 16.1 Gaits
Speeds scale with gravity (my call for the exponents: walking keeps a Froude number under 0.5 on Mars and passes it on Europa, where people lope; the running exponent 0.3 reproduces Apollo's 2 m/s lunar lope). `gG` is the felt g; tradecraft's Earth speeds are the 1 G anchors (walk 1.45, stroll 0.95, run 3.6 m/s).

`stroll = 0.95·gG^0.25`, `walk = 1.45·gG^0.25`, `run = 3.6·gG^0.3`, `sprint = 6.0·(0.85 + 0.015·effFitness)·gG^0.35` m/s. The Froude number `v²/(g·L)`, with leg length `L = 0.53 × height`, names the gait: under 0.5 it is a walk, over it a lope or bound (VIEWS.md animates by it).

| Place | g (m/s²) | stroll | walk | run (lope) | sprint (Fitness 10) | walk→run at Fr 0.5 | stopping from a run: dry deck μ 0.6 / surface ice 0.30 / town ice 0.10 | standing jump: take-off, height, airtime | fall from 2 m |
|---|---|---|---|---|---|---|---|---|---|
| Earth, a 1 G deck | 9.81 | 0.95 | 1.45 | 3.60 | 6.00 | 2.15 | 1.1 m / 2.2 / 6.6 | 2.80 m/s, 0.40 m, 0.57 s | 6.3 m/s |
| a 0.3 G deck | 2.94 | 0.70 | 1.07 | 2.51 | 3.94 | 1.18 | 1.8 / 3.6 / 10.7 | 3.42, 2.0 m, 2.3 s | 3.4 m/s |
| Mars | 3.73 | 0.75 | 1.14 | 2.69 | 4.28 | 1.33 | 1.6 / 3.2 / 9.7 | 3.35, 1.5 m, 1.8 s | 3.9 m/s |
| Ganymede | 1.43 | 0.59 | 0.90 | 2.02 | 3.06 | 0.82 | 2.4 / 4.8 / 14 | 3.54, 4.4 m, 5.0 s | 2.4 m/s |
| Europa | 1.31 | 0.57 | 0.88 | 1.97 | 2.97 | 0.79 | 2.5 / 4.9 / 15 | 3.55, 4.8 m, 5.4 s | 2.3 m/s |
| Ceres | 0.28 | 0.39 | 0.60 | 1.24 | 1.73 | 0.36 | 4.6 / 9.1 / 27 | 3.64, 24 m, 26 s | 1.1 m/s |

(Scratch run, 2026-11-05, reprinted with separate push and brake limits and the force-velocity jump.)

Multipliers on speed: tradecraft's wound mobility (legs, torso, blood, a fresh gunshot ×0.8), the G-conditioning band (14.1), load (16.3), the suit (19.8), thermal slows (10.1), thirst and hunger stages (no sprint), stamina (8).

**As built in v0.0.4** (`src/sim/body/motion.js`: `gaitSpeeds({ gG, loadKg, massKg, effFitness, stamina })` and `gaitsOf(state, pid)`, which the walk reads each tick in place of 0.0.3's three constants). The run carries CAREER's fitness term, `3.6 × (0.85 + 0.015 × effFitness) × gG^0.3` (equal to the formula above at Fitness 10), and every gait is **rounded to 0.01 m/s** (`SPEED_STEP_MS`), so Mars stays exactly 0.75, 1.14 and 2.69 m/s, `STROLL_MS`, `WALK_MS` and `RUN_MS` in `src/sim/places/move.js`, and no golden or walk test moved (my call, the build sheet's §8 item 11). The feet stay put while you lie, sit, do something or a transition plays (TIME's `feetHeld`).

**Movement stances** (the user, 2026-11-06; DESIGN.md's log): each of Relaxed, Combat and Assault has its own walk and run. Relaxed is the table above as built; Combat's walk is a little under it (the glide with the rifle up) and its run the rush between covers; Assault's walk is well above it, past Mars's walk-to-lope line at 1.33 m/s, so a low lope at 0.38 G. The multipliers are set and measured when the stances are built (COMBAT's training in 0.1.x); the gait helper takes the stance as an input from then.

### 16.2 Traction and inertia
- The feet can push at most `μ × N`, with `N = m·g` (plus mag-boot force, 16.6). Legs push less hard than they brake: speeding up, `aMax = min(μ·g, aPush/massRatio)` with `aPush = 4.0 × (0.8 + 0.02·effFitness)` m/s²; slowing down, `aMax = min(μ·g, aBrake/massRatio)` with `aBrake = 6.5 × (0.8 + 0.02·effFitness)` m/s² (measured hard decelerations in sport run 5 to 8 m/s²; my calls), and `massRatio = (massKg + loadKg)/massKg`. Stopping distance `v²/(2·aMax)`; the tightest turn at speed `v²/(μ·g)`. On a dry deck at 1 G grip is the limit (5.9 m/s²), so a run stops in 1.1 m.
- The player's movement keys set a wanted velocity; the body's velocity moves toward it at `aMax`. On Mars it feels lighter and slides further; on Europa's surface ice a run takes 5 m to stop, and on a town's wet ice 15 m. That is the physics, not a tuning knob (my call; see open question 3).
- Surface μ is PLACES §2.7's (one table): sintered paving or deck plate 0.6 dry, 0.3 wet; regolith 0.5; dust over a smooth floor 0.35; ice at Europa's surface temperature (about 100 K) 0.30, because ice that cold has no melt film and grips like a dry solid (Schulson and Fortt 2012; Kietzig, Hatzikiriakos and Englezos 2010); a town's ice at −10 °C 0.10; meltwater on ice 0.05; blood on a deck 0.2 (BODY's, for PLACES's list). Cleats (a boot item) raise any ice to at least 0.4, so they help little on the surface (0.30 to 0.40: a stop in 3.7 m) and a great deal in the towns. Exceeding traction while turning or stopping: a slide; at more than 1.5× the limit, a fall (16.5) unless an easy Fitness roll (DC 8, +4 at 2×).

### 16.3 Carrying: weight against mass
- **Weight** decides support: `weightRatio = loadKg × gG/(massKg × strengthK)`, `strengthK = 0.8 + 0.02·effFitness`. Under 0.30 unladen; 0.30 to 0.45 laden (−1 body, sleep pressure ×1.1); 0.45 to 0.65 heavy (−2 body, walk ×0.9, no sprint); 0.65 to 0.90 very heavy (−4 body, walk ×0.75, no run); over 0.90 overloaded (10 m at a time). A 45 kg approach load is nothing on Mars (0.23) and heavy on a 1 G deck (0.60).
- **Mass** decides inertia, in any gravity: acceleration ÷`massRatio`; CQC −1 per 0.25 of `massRatio` over 1.3; a jump's push ÷`massRatio` (16.4); landing absorption ÷`√massRatio`; impact energy ×`massRatio` (16.5). A marine with 45 kg on Mars stops and turns like one with 45 kg on Earth, on a third of the grip.
- VIEWS.md's inventory lists load-bearing gear; each item has `massKg`. The body only sums it.

### 16.4 Jumps, ladders, crawling
- **Standing jump**: the legs push over `d` 0.40 m with a force that falls with speed (the force-velocity limit), so the net push is `a(v) = F0m × (1 − v/vMax) − g` with `F0m = 29.8 × (0.85 + 0.015·effFitness)/massRatio` m/s² (three bodyweights at 1 G) and `vMax` 6.0 m/s (my calibration to Earth's 2.8 m/s at Fitness 10). Take-off speed `v0` is that push integrated over `d`; height `v0²/2g`, airtime `2·v0/g`; no steering in the air. With the same legs, `v0` rises as g falls (3.35 m/s on Mars, a 1.5 m jump rather than the 1.05 m that scaling by 1/g alone gives), and the force-velocity limit caps it near 3.6 m/s anywhere. At Fitness 0 / 10 / 20 on Earth: 0.32 / 0.40 / 0.47 m; on Mars with a 30% load (massRatio 1.3): 1.2 m. A running jump adds the run speed horizontally.
- Ladders: `0.5 × min(2, 1/(gG × massRatio))^0.5` m/s up (0.5 at 1 G, 0.7 on Mars and below), climbing MET 8 g-scaled; hand over hand in free fall 1.0 m/s.
- Crawling: tradecraft's 0.25 m/s (×0.6 with one arm), ×`gG^0.25` capped at 1.

### 16.5 Falls and impacts
- Impact speed `√(2·g·h)` (plus any horizontal speed). Feet first, the legs absorb `3.0` m/s (4.0 for a trained landing: airborne-qualified or Fitness ≥ 12), ÷`√massRatio`, ×`bone`. The rest goes to the impact model with the legs taking 1.5× the torso's share and the head 0.3×.
- **Impact model**: LONGHAUL's `applyImpact` (crew.js), with its 0–100 losses converted to shares of tradecraft's part capacities: bruise 1 to 3 m/s; hard 3 to 5 (30% fracture); bone-breaking 5 to 8 (a fracture); crushing 8 to 12 (fracture, internal bleeding, unconscious 60 s); lethal 12 to 18; fatal 18 and over. Fracture chances ×`(1/bone)²`. It serves falls, being thrown under thrust (13.7), tumbling into a bulkhead, decompression shoves and blast throws (COMBAT.md).
- Fall heights for 4.5 / 6 / 8 / 12 m/s at impact: Earth 1.0 / 1.8 / 3.3 / 7.3 m; Mars 2.7 / 4.8 / 8.6 / 19 m; Europa 7.7 / 13.7 / 24 / 55 m. A Martian drop of 3 m is a 1.2 m drop at home.

### 16.6 Free fall
- **Push-off**: from a surface or handhold within 0.8 m, the keys pick a speed (stroll 0.3, walk 0.6, run 1.2, sprint 2.0 m/s) along the facing; a 1 s step, and an EVA roll (DC 6, +4 at 2.0 m/s) sets the direction's error (±5° per point missed) and adds a tumble of 0.1 rad/s per point missed.
- **Drift**: straight, at constant velocity, until something stops you. Throwing a mass `m` at `v` changes yours by `−m·v/(massKg + loadKg)`; weapon recoil is WEAPONS.md's.
- **Grabbing**: a handhold or a person within 0.8 m as you pass. Under 1.5 m/s relative it holds; 1.5 to 3 m/s, an EVA roll (DC 10 + 3 per m/s over 1.5) or you miss and glance off (a wrist sprain on a miss by 5); over 3 m/s it is an impact (16.5). A grab stops a tumble.
- **Working**: hands-free work needs a foot restraint or a tether, else −2 hands. Crossing a 10 m compartment at 0.6 m/s takes 17 s (ISS crews move at 0.3 to 1 m/s).
- **Mag boots**: on ferrous decks only (PLACES.md marks them). One boot is always locked; walk 0.5 m/s, no run; each locked boot holds 300 N, so traction becomes `μ × (m·g + 300)`; breakaway at 800 N (a hard shove, an impact). A push-off needs both unlocked (0.3 s).
- **Thruster packs**: two named items, one table (COMBAT §14.2's crossing times and §15.1's tactics read it; COMBAT owns the tactics, BODY the budgets). Figures are for 150 kg (a marine, suit and kit) and scale as 150/mass:

| Pack | Fitted to | Δv | Acceleration | Rotation | Gas, mass | Basis |
|---|---|---|---|---|---|---|
| **SAFER jet** (`safer`), the bail-out | the light vac suit's backpack, issued for EVA duty | 3 m/s | 0.1 m/s² | holds attitude by itself (one key) | 0.65 kg of N₂, 4 kg | NASA's SAFER: about 3 m/s, about 0.1 m/s² |
| **combat pack** (`combatPack`) | integral to the hardshell (19.11); a clip-on for the light suit | 25 m/s | 0.15 m/s² | 10°/s² | 5.4 kg of N₂ at 70 s specific impulse, 14 kg | NASA's MMU at about 0.09 m/s² and 20 m/s, made punchier (COMBAT §15.1's my call) |

Crossings on the combat pack, cruising at 2 m/s: 50 m in 0.6 min, 200 m in 1.9, 500 m in 4.4, 1 km in 8.6, about 4 m/s of Δv a crossing (COMBAT §14.2's, the same numbers). A pack shot through vents as an unwanted burn (WEAPONS's hit on equipment).

### 16.7 Low-g bounding
On Europa, Callisto and Ganymede the run is a two-footed bound. Direction changes only on landing; each landing at bounding speed on rough ice is a Fitness roll (DC 8, +4 heavy, +2 on surface ice and +4 on a town's ice without cleats) every 5 s, failure a slow fall (3 s to stand). VIEWS.md draws the airtime the table gives.

## 17. Wounds, bleeding, pain, shock, consciousness

### 17.1 Ported from tradecraft's `health.js`, as is
Six parts with capacities head 6, torso 12, arms 8, legs 9 points, ×(1 + Fitness/20); states bruised, hurt (⅓), wounded (⅔), out (1); the part mods (section 22); cracks (21 days) and fractures (42 days); cuts shallow and deep; arteries 10 to 15 %/min (limbs and neck); split brow, bloody nose; blood % with bands pale 85, shock 70, collapsed 55, dead 45; regeneration 2 %/h; exertion ×1.25 crawling, ×1.5 walking, ×2.5 running; pressure ×0.35; adrenaline (60% of pain off for 40 s, fading over 80 s); pain points and bands 25 / 45 / 70; the pain limit `30 + 2 × Fitness`, sitting past it and lying past 1.4× it; knockdown seconds by part (`KNOCK_S`), staying down when justified; mobility factors; the head-shot outcomes; the chest bleed; `heal()` by the day. WEAPONS.md turns bullets into these injuries; COMBAT.md's blows and blasts do the same.

Changes:
1. A non-artery limb wound bleeds at most 8 %/min (tradecraft's uncapped `1 + 8·force` could out-bleed an artery).
2. The player is knocked down by bullets as NPCs are (my call; tradecraft exempted the player). When the knock ends and the body can stand, getting up is the player's choice.
3. **The lethal triad**: core under 35 °C multiplies every bleed rate ×1.25 (×1.5 under 33 °C): cold blood does not clot. This is why MARCH ends with H.
4. Blood in low g and free fall bleeds at the same rates; VIEWS.md and PLACES.md handle the spatter and floating globules.

### 17.2 Consciousness
Not stored; derived each tick as the worst of its causes, on the AVPU scale.

| Level | Meaning | Causes (any) |
|---|---|---|
| A, alert | full control | |
| V, confused | −6 all; simple actions only (walk, crawl, take cover, press on a wound, drink, pull a mask on, drop a weapon); no shooting mode | hypoxia dose 60 to 100; CO 30%; core 31 to 33 °C; G-LOC's dazed 15 s; BAC over 0.2%; a concussion's first 10 min; ketamine; dehydration over 10%; CO₂ load over 5 kPa; heat stroke, core 40 to 40.8 °C |
| P, stupor | no control; responds to pain | hypoxia 100 to 130; blood 55 to 60% while still bleeding; heat stroke's collapse, core over 40.8 °C; ARS CNS phase |
| U, unresponsive | no control | asleep (wakes to noise, unlike the rest); hypoxia ≥ 130; blood < 55%; head out; G-LOC; core < 31 °C; cardiac arrest; ebullism over 15 s; CO 40% |

Timers: tradecraft's 60 s down for a head knocked out by blows and 90 s to come round from collapse once nothing bleeds; G-LOC's 12 to 25 s. While the player is at P or U, TIME.md runs the clock (or offers a skip, interrupted when someone treats you or you come round), and VIEWS.md shows what the senses still give.

### 17.3 New injuries

| Kind | Trigger | Effect | Pain | Care | Heals |
|---|---|---|---|---|---|
| concussion | a head blow of force ≥ 0.4 (50%); a blast | −1 mind and eyes, headache, sleep pressure +2 h; V for the first 10 min | 4 | rest; no second blow for 7 days (a second doubles it) | 3 to 7 days |
| open pneumothorax | a penetrating chest wound (30% of chest gunshots) | ventilation ×0.6 (hypoxia lookup), −2 body; becomes tension 10% an hour | 10 | vented chest seal | with the wound |
| tension pneumothorax | 15% of chest gunshots; lung barotrauma; an open one sealed badly | ventilation falls 10% a minute to 0.3; shock from 15 min; death at 30 to 60 min | 12 | needle decompression (relief 2 to 6 h, recurs 30%); a chest tube at the aid station | hospital |
| haemothorax | tradecraft's chest bleed | 0.25 %/min internal, +0.25 per bullet, to 1.0 | | TXA ×0.7; aid station surgery | |
| junctional bleed | a limb-root wound (groin, armpit, neck) | 6 to 12 %/min; no tourniquet fits | 12 | haemostatic gauze packed with 3 min of pressure; a junctional device at the aid station | tied off by surgery |
| burn | fire, hot metal, blast, a radiation burn | per part, by rule of nines (head 9%, torso 36%, arm 9%, leg 18% of body surface) and depth: superficial, partial, full thickness. Over 15% of body surface: burn shock, `blood` −0.006 %/min per % for the first 8 h and half that for the next 16 h, unless fluids, with regeneration paused (the Parkland formula's 4 mL/kg per % over 24 h, half in the first 8 h: about 0.36% of blood volume an hour per %). Untreated, a 20% burn collapses (blood 55%) at 6.3 h, 30% at 4.2 h, 50% at 2.5 h: burn shock comes over hours | 0.5 / 1.5 / 0.5 per % (partial is the painful one), at most 40 | burn dressing; fluids; hospital grafts for full thickness | 7 / 21 days / grafts, scars |
| frostbite | 10.5 | 10.5 | 2 / 6 / 8 | rewarming (never rub, never refreeze) | 0 / 14 days / hospital |
| ebullism | 11.6 | swelling, pain, torso damage past 60 s | to 20 | repressurise; sick bay | 1 day |
| lung barotrauma, gas embolism | 11.6 | a pneumothorax; an embolism is a stroke | 10 | recompression for the embolism | hospital |
| ear barotrauma | 11.6 | hearing ×0.5 one side, vertigo | 4 / 8 | none (decongestants prevent) | 4 to 6 weeks |
| bends | 11.7 | 11.7 | 12 | recompression, O₂ | 6 to 24 h |
| sprain | a bad landing, a missed grab, a slide | −1 body (ankle) or hands (wrist) | 6 | rest, compression | 7 to 14 days |
| acoustic trauma | an unprotected shot or blast over 140 dB at the ear in a closed space (WEAPONS.md gives the level) | hearing ×0.5 for 1 to 24 h; each one leaves a permanent −0.02 of hearing (tinnitus at −0.1) | | ear protection | |
| eye injury | visor fragments, blast debris | −3 eyes, one eye | 8 | eye shield; hospital | 2 weeks, or a scar |
| anoxic brain injury | 11.2 | head damage that never heals aboard (longhaul's brain damage); −2 mind for good | | full hospital | partial |
| stroke | juice (13.6), embolism | head damage, one side weak (−4 hands or body) | | full hospital | months |
| aspiration | vomit in a helmet (14.4) | coughing, −2 all, pneumonia hazard | 4 | antibiotics | 7 days |
| skin trouble | 6 | −1 body moving | 3 | wash | 4 sols |

## 18. Medicine: TCCC and MARCH

### 18.1 The order
Aid follows Tactical Combat Casualty Care's MARCH: **M**assive haemorrhage, **A**irway, **R**espiration, **C**irculation, **H**ypothermia and head. The instinct's body line (23.2) and the first-aid card (H for yourself, F for someone at hand) list the options in that order, each greyed with its reason when it cannot be done (tradecraft's pattern). On a suited casualty in vacuum, the suit's breach comes first: a patch before a tourniquet (my call).

### 18.2 Kits (every item is a stateful, counted kit item; VIEWS.md shows them)

| Kit | Contents |
|---|---|
| **IFAK** (every marine; 0.8 kg, 1.5 L pouch) | 2 CAT tourniquets (one rides on the armour), 1 haemostatic gauze, 2 pressure dressings, 2 vented chest seals, 1 nasopharyngeal airway, 1 decompression needle (14 g, 8 cm), shears, gloves, a casualty card, a combat pill pack, 4 suit patches and 1 large patch, a burn dressing, a hypothermia blanket |
| **Corpsman's bag** (HM, combat lifesaver: 9 kg) | the IFAK ×3 for others, plus IV and intraosseous kits, 2 units of low-titre O whole blood (cold-chained, 3 days off ice), 4 g of TXA, ketamine, fentanyl lozenges, ondansetron, IV antibiotics, 2 SAM splints, a pelvic binder, a supraglottic airway, a cric kit, a pulse oximeter, radioprotector and anti-emetic tablets |
| **Battalion aid station, ship's sick bay** | an autodoc (longhaul's), surgery for damage control (tie an artery, a chest tube, a laparotomy), transfusion, a hyperbaric chamber, a light box, X-ray and a blood analyser (lymphocytes: a dose estimate) |
| **Garrison cabinet** (squad bay head, base clinic) | tradecraft's civilian supplies: bandages, antiseptic, suture kits, painkillers, antibiotics, poultices |

No improvised supplies (the user, 2026-11-04). The `IMPROVISED −2` modifier waits for crafting.

### 18.3 Steps
Base times at Medicine 10, scaled by SKILLS §5.12's one pace helper, `paceOf(Medicine) = max(0.45, 1.6/(1 + Medicine/16.7))` (tradecraft's Medicine pace with its floor lowered; the user: "every first aid action should also take time proportionally to medicine skill"). Modifiers: yourself −2, one-handed −4 (a CAT is built for it: −2), each failed try −2 then −4 (soaked), being shot at in the last 5 s −3, suit gloves as the suit row of section 22 and +30% time, and the medic's own `bodyMods` and `needMods`.

| Step | Time | DC | Effect |
|---|---|---|---|
| press on it | 60 s held | | bleeding ×0.35 while held (tradecraft) |
| tourniquet (CAT) | 25 s | 10 | a limb bleed stops; the limb counts as broken; harm past 2 h (tradecraft's 0.15 × capacity an hour) |
| haemostatic gauze, packed | 60 s + 180 s pressure | 12 (junctional 14) | stops a limb artery or a junctional bleed (a dressing only slows an artery to 30%) |
| pressure dressing | 45 s | 8 / 12 / 16 (shallow / deep / artery) | tradecraft's dress |
| nasopharyngeal airway | 20 s | 8 | an unconscious casualty's airway stays open (no death from obstruction) |
| recovery position | 10 s | | the same, for a while, without kit |
| vented chest seal | 30 s | 8 | an open pneumothorax sealed |
| needle decompression | 30 s | 14 | a tension pneumothorax relieved for 2 to 6 h; a miss by 5 adds a lung bleed of 0.2 %/min |
| IV access / IO access | 90 s / 60 s | 14 / 10 | lets fluids and drugs in |
| whole blood, a unit | 10 min | | blood +10% (to 100) and burn-shock loss cancelled for 8 h |
| TXA | 10 min infusion | | within 3 h of injury: internal bleeding ×0.7 for 24 h (the CRASH-2 trial's effect) |
| ketamine | 15 s | | pain ×0.3 for 30 min; the patient is V (dissociated) |
| fentanyl lozenge | 15 s | | pain ×0.4 for 1 h; −2 all; in shock, SpO₂ −5 |
| combat pill pack | 10 s | | pain ×0.8 for 24 h; a 5-day antibiotic course begun |
| SAM splint / set a break | 120 s / 60 s | 12 / 14 | tradecraft's |
| pelvic binder | 60 s | 10 | a pelvic bleed ×0.5 |
| hypothermia wrap | 120 s | | +2.5 clo and ground insulation for the casualty |
| burn dressing | 60 s | | burn pain ×0.7, burn infection ×0.5 |
| casualty card | 60 s | | records tourniquet time and drugs: the next carer reads it as found (+2 to their look) |
| CPR | held | | the anoxic clock ×0.3; drains the rescuer's stamina as 8 MET |
| shock (AED, aid station or corpsman's bag) | 10 s | | restores a rhythm 40% of the time in a shockable arrest |
| clean, stitch, bandage, poultice, antibiotics, painkillers | tradecraft's | tradecraft's | garrison and sick bay care |

### 18.4 Diagnosis
Tradecraft's `diagnosis.js` is kept (plain sight; a Medicine look against DC 10 whose margin finds breath at −4, the wound's cause and rate at 0, an artery, a break or shock at +2, an exit wound or a crack at +4, internal bleeding and the time left at +8; a failed look says the safe thing). Added: a friend's suit biomedical telemetry (heart rate, SpO₂, suit pressure, skin temperature) is plain sight on a squad link (COMBAT.md's comms), a pulse oximeter is plain sight for SpO₂, a casualty's dosimeter reads out, the sick bay's blood test estimates a dose from lymphocytes (±30% at 48 h), and a margin of +4 finds a pneumothorax, +6 a junctional bleed.

### 18.5 Care tiers

| Tier | Where | Can | Time |
|---|---|---|---|
| self and buddy aid | anywhere | the IFAK's steps | as 18.3 |
| corpsman | with the platoon | the bag's steps, fluids, drugs, triage | as 18.3 |
| battalion aid station, ship's sick bay | Base Melas, a troopship, the Europa FOB | autodoc (longhaul's rates: head +0.3k, torso +0.25k, arms +0.4k, legs +0.35k of 100 a minute, `k = 1.5` with a medic), surgery (an artery tied 1.5 h; a chest tube 30 min; a laparotomy 3 h), the chamber for bends, gas embolism and CO | tradecraft's `TREAT_H` |
| base or station hospital | Base Melas's naval hospital, Callisto | everything but neural surgery and grafts; up to 21 bed days | longhaul's stays |
| full hospital | Phobos, the Mars cities | brain injury, grafts, prosthetics, stroke rehabilitation | 14 days for neural (longhaul) |

### 18.6 Healing
Tradecraft's `heal()` a day at a time (bruised and hurt parts 0.2 × capacity a day, ×1.6 poulticed; wounded or out only when tended and nothing on them wants care, at half that; knitting multipliers; infection as a hazard race against `12 + Fitness/2` immunity; scars). Rates are multiplied by: weak from hunger ×0.6, starving ×0.3; `pEff ≥ 20` ×0.8; ARS manifest ×0.5; free fall ×0.7 for fractures; `bone` for fractures; grime raises infection (6). An autodoc counts as a doctor's care and adds its per-minute repair up to longhaul's wound cap of 70% for lasting wounds.

## 19. Suits as life support

### 19.1 The light vac suit
The marine's issue suit, SETTING §5.7's **HAD Mk 7** ("the seven", "the can"; WEAPONS.md gives its armour): the **skin**, a tight under-layer carrying the cooling garment's lines, worn as underclothes aboard ship, and the **shell**: hard torso with the backpack life-support unit, helmet, pressure gloves and boots. BODY models its pressure as one gas envelope of 55 L (section 28 notes the open question of the skin's mechanical counter-pressure). (My calls for every number, sized against NASA's EMU: 29.6 kPa O₂, 0.54 kg primary O₂, about 590 W of sublimator cooling.)

| Item | Value |
|---|---|
| mass | suit 11 kg + backpack 6 kg + helmet 2 kg = 19 kg (armour is WEAPONS.md's) |
| pressure | 34 kPa pure O₂ (a "high" mode at 55 kPa: no bends from a 101 kPa ship, stiffer: −1 more body and hands, leaks ×1.6) |
| gas volume | 55 L (24.6 g of O₂ at 34 kPa) |
| oxygen | primary 600 g; reserve 150 g, released automatically under 25 kPa |
| scrubber | a swappable LiOH cartridge (1.0 kg, absorbs 720 g of CO₂); counted and changed like a magazine |
| water | drink bag 0.9 L; feedwater 3.0 kg for the sublimator |
| power | 800 Wh battery |
| cooling / heating | 450 W / 200 W |
| waste | urine collection device to a 1.0 L bag; an absorbent liner |
| sensors | suit pressure, outside pressure, loop O₂ and CO₂, O₂ remaining, scrubber state, battery, water, suit temperature; biomedical patch: heart rate, SpO₂, skin temperature, breathing rate; a dosimeter |
| self-sealing | the bladder's gel closes a hole of 3 mm or less to 5% of its area within 1 to 5 s |
| patches | 4 small (to 25 mm), 1 large (to 80 mm), in the IFAK and a thigh pocket |
| radiation | 1.5 g/cm²: ×0.40 effective dose, ×0.11 skin dose against Europa's electrons (12.1's curve) |
| thruster | the SAFER jet for EVA duty, or a clip-on combat pack (16.6) |

### 19.2 Item state

```json
{ "type": "suit", "id": "i450", "model": "lvs", "worn": true, "helmet": "sealed", "gloves": "on", "mode": "nominal",
  "pressKpa": 34.0, "o2G": 588, "o2ReserveG": 150, "loopCo2Kpa": 0.12,
  "cartridge": "i451",
  "drinkL": 0.6, "feedKg": 2.4, "batteryWh": 640, "urineMl": 0, "linerSoil": 0,
  "breaches": [ { "part": "armL", "areaMm2": 28.3, "sealed": 0, "patch": null, "atMs": 0 } ],
  "seals": 0.95, "dust": 0.1, "visor": { "cond": 1, "fog": 0, "fouled": false },
  "faults": [], "known": true }
```

The cartridge is an item of its own in `state.items`, held by the suit (TECH §6.7; CONTRACTS §9 and §10), so it is counted, swapped and carried like a magazine:

```json
"i451": { "type": "cartridge", "model": "lioh", "usedG": 210 }
```

Its capacity (720 g) is the `lioh` model's, not the record's. A breach is an entry in the suit's list, not an item, so it carries no id. A suit in a locker is the same object; `known` follows tradecraft's gun rule (someone else's suit is unknown until checked).

### 19.3 Consumables
- **Oxygen**: `VO2 = M/336` L/min (1 L of O₂ a minute releases about 336 W), ×1.429 g/L, plus the nominal leak `2 × (1 + 4 × dust)` g/h, plus breaches (19.4). At an average 300 W the primary lasts 7.6 h; at rest (130 W) 17 h; at hard work (600 W) 3.9 h.
- **CO₂**: `0.85 × VO2` (the respiratory quotient, the one rate of 11.4) at 1.977 g/L, into the cartridge: 90 g/h at 300 W, so 8.0 h a cartridge (18.5 h at rest, 4.0 h at 600 W). At 90% used the loop CO₂ starts to rise; spent, it rises 1.5 kPa a minute at 300 W (11.4). A cartridge swap takes 20 s in a pressurised space; in vacuum only with the hot-swap port (60 s, the loop's CO₂ climbing meanwhile).
- **Water**: the drink bag at the mouth (a sip 0.1 L, 3 s: offered by the instinct, never automatic). Feedwater: `cooling W / 2.83 MJ/kg` in vacuum (0.34 kg/h at 270 W net; 8.8 h).
- **Power** (W): fans and pump 25, radio 3, HUD and sensors 4, lamp 6, heaters 0 to 200, cooling pump boost 0 to 20; about 60 W in normal work, 13 h. A dead battery stops the fan, the cooling and the HUD.
- **A dead fan** (a fault or a flat battery) moves no gas through the cartridge, however good it is: the whole loop takes the CO₂ at 1.5 kPa a minute at 300 W, and the 12 L of stagnant gas round the face, barely mixing, about 3 kPa a minute (my call, half of the 6.9 it would take with no mixing at all). The trained reflex, as for the EMU's fan failure, is the **purge valve at once** (19.4): it holds the helmet near 1.2 kPa at 300 W (stuffy, −2 all) while it spends 1.8 kg of O₂ an hour, so the primary's 600 g last 20 min. Purge, call it, and head for the lock.
- The suit-hour budget at moderate work is therefore about 7.5 h, set by oxygen and the cartridge. The HUD shows the time left at the current rate.

### 19.4 Pressure and leaks (fast layer)
- **Leak through a hole** (choked flow of O₂ at 293 K, discharge coefficient 0.6): `ṁ = 1.489 × 10⁻³ × A × P` kg/s (A in m², P in Pa). Each tick the loop mass changes by `regulator + reserve − Σ leaks − breathing`, and `P = m·R·T/V`.
- **Make-up**: the regulator adds up to 0.6 g/s from the primary to hold the set pressure; under 25 kPa the reserve opens and adds up to 1.2 g/s (its 150 g last 125 s at full flow). The purge valve (a step) dumps 0.5 g/s through the helmet to flush CO₂, at the oxygen's cost.
- **Covering the hole**: a gloved hand pressed on a reachable hole cuts its area to 10% (a step, 1 s; it occupies that hand; holes on the back cannot be reached alone).

| Hole | Leak at 34 kPa | Pressure held, regulator alone / with reserve | What it means |
|---|---|---|---|
| 1 mm | 0.04 g/s | 34 / 34 kPa | the primary lasts 2.9 h instead of 7.6 |
| 3 mm (fragment) | 0.36 g/s | 34 / 34 | the self-seal takes it; unsealed, 27 min of O₂ |
| 5 mm | 0.99 g/s | 20.5 / 25 (the reserve opens under 25 kPa) | breathable at 25 kPa, the regulator at full flow and the reserve topping up, for about 17 min, when the primary runs dry: patch it before then |
| 8 mm (a rifle round's hole, two of them through and through) | 2.54 g/s | 8 / 24 | without the reserve, 11 s to useful consciousness lost; with it, about 2 min to patch |
| 12 mm (a blade's slit) | 5.7 g/s | 3.6 / 10.7 | under the Armstrong limit without the reserve; a hand on it, then a patch |
| 25 mm | 25 g/s | 0.8 / 2.5 | 1.8 s to 6.3 kPa: ebullism and 11 s of useful consciousness |
| a shattered visor (over 10,000 mm²) | | 0 in 0.1 s | explosive decompression: lungs (11.6), ebullism, death in 2 min unless pulled into air |

- A decompression faster than 8 kPa a second raises TIME.md's reflex card (section 26), with the HUD's leak rate and the hiss on it, so the choice between exhaling and covering the hole can be read. The suit's adiabatic cooling fogs the visor (−2 eyes for 10 s).
- Visor cracks leak 2 to 10 mm² and grow 10% a minute under stress (the rate the suit HUD shows). Blade tears grow 20% a minute while the limb works (rip-stop limits them to 2× their first size).

### 19.5 Patching
- **Find it**: the HUD gives the leak rate, not the place. In air you hear the hiss; in vacuum you look for the frost plume and feel for it. An EVA roll (DC 8, −4 on your own back, +4 if a buddy looks) finds it in 2 s × `paceOf(EVA)`; a miss costs 2 s more.
- **Patch it**: 6 s at EVA 10 × `paceOf(EVA)` (SKILLS §5.12), DC 8, +2 per 10 mm over 5 mm, the gloves' penalty (already in the suit row of section 22), −4 on your own back. A patch cuts the area to 2%; a large patch takes holes to 80 mm. A failure leaves the hole and the next try at −2. A buddy's patch has no self penalty.
- These are steps in the panel, chosen by digits like the gun's steps; TIME.md decides whether the clock stands while you choose (tradecraft's stop motion) or runs (a question the tradecraft notes left open; my default: it stands while choosing, as in shooting).

### 19.6 Heat in the suit
- With the helmet sealed the body's environment is the suit: the cooling garment removes up to 450 W of what the body produces beyond the suit's passive exchange. Passive exchange: in vacuum the multi-layer insulation loses about 30 W in shade at Jupiter's distance and gains about 30 W in sunlight at Mars; standing on ice loses 20 W through the boots; in Mars air the layers count as clo 2.0 to the outside.
- In vacuum cooling uses feedwater (19.3); in air a fan heat exchanger (full capacity at or below 0 °C outside, ×0.7 above 20 °C). Heaters run from the battery when production falls below losses (asleep, unconscious, in a damaged suit on ice).
- The suit's whole heat rejection, sensible through the cooling garment and latent from sweat and breath condensed out of the vent loop, is the sublimator's 450 W; in the two-node model it is taken from the skin (the controller holds the skin near 32 °C while it can).
- Work above the cooling stores heat (scratch run, two-node, Jupiter's shade): at 300 W the core holds at 37.0 °C for 6 h, sweating 0.1 L/h; at 600 W it reaches 39.5 °C in 89 min, sweating 0.9 L/h; with cooling degraded to 350 W, in 51 min; at 750 W, in 40 min. Sweat in the suit is water lost (4.2) and grime gained (6).

### 19.7 Donning and doffing
BODY owns the steps and their sums; TIME §8.2's `suit-up` and `suit-down` take these sums × `paceOf(EVA)` (SKILLS §5.12), and COMBAT, CAREER, ROADMAP and SETTING cite them. Base times at EVA 10 (pace 1.00):

| Step | Time | Notes |
|---|---|---|
| the skin, with the urine device and the cooling lines | 150 s | from underwear; aboard ship the skin is worn as underclothes (SETTING §5.7), so this step is already done |
| lower shell and boots | 30 s | |
| hard upper torso and backpack | 30 s | with a buddy or a donning stand; alone, +60 s |
| gloves | 10 s each | |
| helmet, locked | 10 s | |
| pressurise and leak check | 60 s | a leak over 3 g/h shows here; the quick don's check is a 30 s pressure-decay test that finds one over 10 g/h |
| buddy check | 45 s | seals, the pack's readouts, the dosimeter; the general-quarters form is 20 s (a look over the seals and the readouts); alone, a self-check in the locker mirror, 90 s |

The sums, at pace 1.00:
- **The shell onto the skin, helmet locked: 90 s.** This is the Corps' standard for the vacuum qualification (CAREER §7.5's "don in 90 s"): a marine at EVA 10 meets it exactly, one at EVA 15 with 14 s in hand, one below EVA 10 only by luck (the roll's grade is CAREER's).
- **Quick don at general quarters** (the skin worn): the shell 90 s and the 30 s pressure check (visor closed for it, then up, as COMBAT §13.2 has it), **120 s**, then the 20 s buddy check: **140 s** to "suited". COMBAT §13.2 and ROADMAP's general quarters moment cite this.
- **Full don from scratch with a buddy**: 150 + 90 + 60 + 45 = **345 s, about 6 min** (SETTING §5.7's "about 6 minutes with a buddy"). **Alone**: +60 s for the pack and the 90 s self-check in place of the buddy's 45: **450 s, 7.5 min**.
- **Seal and go** skips every check (from the full don it saves 105 s; from the quick don, 50): an undetected fault `15% × (1 − EVA/30)` of the time.
- **Doffing**: depressurise and the helmet off 20 s, gloves 10 s, the shell 60 s (back to the skin: 90 s in all), the skin 90 s: **180 s** in all. TIME adds servicing after outside use (19.9).

How each plays is TIME's (its 45 s and 120 s rule; the first time is lived, in CAREER's suit loft on Wednesday, career sol 2: CONTRACTS §3): the quick don at general quarters is a short fast-forward, the full don a skip with its outcome unless it is the first time.

### 19.8 What the suit costs the body
- Pressurised: walk ×0.85, run ×0.75, sprint ×0.7. Roll penalties are `gear` entries that EVA wears down (SKILLS §5.13's `mitigated()`; the values in brackets are what a marine at EVA 10 feels): gloves −4 on hands (−2), the pressurised bulk −3 on legs and torso (−2), CQC −5 in place of it (−3); the helmet narrows the sight cone to 140° (PEOPLE.md's perception) and costs −1 eyes (−1). Hearing is the radio and what comes through the suit (in vacuum, only contact). The high mode (55 kPa) stiffens it: −1 more on hands, legs and torso, leaks ×1.6.
- Unpressurised in air (helmet open, gloves off): −1 legs, walk ×0.95.
- Metabolic cost: suit work's MET (section 3.2) already includes it.

### 19.9 Wear, dust and faults
- `seals` falls 0.002 per hour pressurised and 0.02 per breach patched; under 0.8 the nominal leak doubles. `dust` (Mars regolith in the joints and seals) rises 0.05 per hour outdoors, 0.2 an hour in a dust storm; joints stiffen (−1 legs and hands at 0.5) and leaks grow. Cleaning and checking the suit at the suit room (TIME §8.5's `suit-service`, whose duration is TIME's) sets `dust` to 0 and `seals` up by 0.1 (to 0.95).
- Faults use longhaul's systems pattern (`hazard = stress × (0.4 + 3·wornness²)/(mtbf × 1440)` a minute, wornness `1 − seals`; TL4 Martian kit: reliable, dear to repair, rigs that don't last): the fan, the regulator (stuck open: the primary drains at 0.6 g/s; stuck closed: no make-up), the cooling pump, the battery. Each fault reports on the HUD by its effect, not its cause, unless an EVA roll (DC 12) reads it.

### 19.10 The suit HUD
Only what the suit's sensors know: suit pressure and its trend, outside pressure, loop O₂ and CO₂, O₂ time left, cartridge %, battery %, drink and feedwater, suit temperature, heart rate, SpO₂, skin temperature, dose rate and dose, leak alarm and rate, the UTC clock, the radio, and the pack's Δv when one is fitted. No core temperature, no blood, no position (VIEWS.md draws it).

### 19.11 The hardshell, HAD M-22 combat vacuum armour
SETTING §5.7's "shell" or "heavy": segmented hard armour over the skin, a radiation liner, magnetic soles and an integral cold-gas EVA pack, for boarding, long EVA and Europa's surface; WEAPONS §8.3 gives its protection. It is built for long sealed days in vacuum, as the light suit is not. (My calls for every number but the mass and the catalogue's hours, which are SETTING's.)

| Item | Value |
|---|---|
| mass | 42 kg, all of it inertia anywhere (16 kg of weight on Mars, 5.6 kg on Europa, 42 kg on a 1 G deck: `weightRatio` 0.56, heavy, 16.3) |
| pressure | 34 kPa pure O₂; a high mode at 57 kPa that costs nothing, because its hard joints are constant-volume bearings (NASA's AX-5 design point): no prebreathe from any hull (0.2% from a 101 kPa one, 11.7) |
| gas volume | 80 L (36 g of O₂ at 34 kPa), so the same hole drops it 1.45 times slower than the light suit |
| oxygen | primary 1,600 g, **20 h at 300 W** (HAD's catalogue; 24 h at 250 W, 10 h at 600 W); reserve 300 g, released under 25 kPa |
| scrubber | a swing-bed amine scrubber that vents CO₂ and water to vacuum (the xEMU's rapid-cycle amine): unlimited while it has power and vacuum outside; in a pressurised space, or with the bed failed, a backup slot takes the light suit's LiOH cartridge (8 h at 300 W) |
| water | drink bag 2.0 L; feedwater 8 kg for a 600 W sublimator (6.9 kg for 20 h at 270 W net) |
| power | 2,000 Wh: the swing bed's valves, fans and pump, HUD and sensors, radio, lamp, about 80 W in normal work (20 h), plus heaters to 300 W |
| cooling / heating | 600 W / 300 W; insulated soles lose 10 W standing on 100 K ice (the light suit's boots lose 20) |
| waste | urine collection to a 2.0 L bag; an absorbent liner; still no bowel system, which is what makes 20 h a long day (5.2) |
| mag soles | two soles of 300 N each when locked, breakaway 800 N (16.6's mag boots, built in) |
| thruster | the integral combat pack (16.6: 25 m/s at 0.15 m/s² for 150 kg) |
| radiation | the liner, 5 g/cm²: ×0.18 effective dose, ×0.02 skin dose (12.1's curve): 41 mSv/h on Europa's surface |
| armour | hard segments (WEAPONS §8.3: torso 14 mm RHAe); a round through a segment leaves a round hole of its calibre in the gas envelope (6.5 mm: 33 mm², leaking as 19.4); the inner bladder self-seals holes of 3 mm or less |

**What it costs the body** (pressurised; `gear` entries worn down by EVA, the EVA 10 value in brackets): walk ×0.8, run ×0.65, sprint ×0.6, from the mass and the joints; gloves −4 on hands (−2); bulk −4 on legs and torso (−2), CQC −6 in its place (−3); the helmet's narrower visor cones sight to 120° and costs −2 eyes (−1). Its mass counts in `massRatio` for every acceleration, CQC and impact (16.3): a 75 kg marine in a hardshell with 20 kg of kit has a mass ratio of 1.83. Heat in it follows 19.6 with 600 W of rejection: 600 W of work holds (core 37.5 °C after 6 h); 750 W reaches 39.5 °C in 82 min, 900 W in 38 (scratch run).

**Donning** (base times at EVA 10, × `paceOf(EVA)`): over the skin, the lower segments and soles 45 s; the rear entry (step in, arms in, the buddy closes the pack hatch) 60 s, or 120 s alone at a donning stand; gloves 10 s each; helmet 15 s: **the shell in 140 s**; pressurise and leak check 60 s; buddy check 45 s. From the skin worn, 245 s; from scratch with the skin, 395 s, about 6.5 min. Doffing 150 s back to the skin.

**The Lorica**, HAD PA-3 powered assault armour (SETTING §5.7: about 190 kg, 40 h of air, MSAC teams only), is a later item (SETTING §16). What BODY will need of it, noted now: its frame carries its own weight while powered (its mass still counts as inertia), 12 g/cm² of shielding (×0.05 on Europa's surface, 12 mSv/h), and a dead frame that turns 190 kg into a weight the wearer cannot lift at 1 G and can barely move on Mars.

## 20. Drugs and medication
Each dose is `{ id, mg, atMs, route }` in `body.drugs`; concentration falls with its half-life; effects scale with concentration over the effective level. Nothing is taken unasked (the user, 2026-10-31), except by a couch's injector by design.

| Drug | Dose, route | Onset, duration (half-life) | Effects | Costs |
|---|---|---|---|---|
| caffeine (coffee, tablets) | 100 to 200 mg, oral | 30 min; t½ 5 h | −2 h of effective sleep pressure per 200 mg at peak | sleep quality ×0.85 within 6 h; urine +0.05 L per 100 mg; a habitual user (over 300 mg a sol for a week) needs twice as much, and without any for 24 h has a headache (−1 mind) |
| modafinil ("go pills", issued for operations) | 200 mg | 1 h; 12 h | −6 h of effective sleep pressure | sleep clears ×0.7 while active; only by order (PEOPLE.md's chain of command) |
| juice, standard / high | couch injector | at once; lingers 1 h after the burn | section 13.6 | hangover, crash, strokes |
| ibuprofen, paracetamol (garrison) | 400 mg, 1 g | 30 min; 6 h | pain ×0.8 (tradecraft's painkillers ×0.4 kept for the stronger garrison tablets) | not again within 4 h |
| combat pill pack | oral | 30 min; 24 h | pain ×0.8; antibiotic course | |
| fentanyl lozenge | 800 µg, oral mucosa | 5 min; 1 h | pain ×0.4 | −2 all; constipation; in shock, SpO₂ −5 |
| ketamine | IM | 3 min; 30 min | pain ×0.3 | the patient is V |
| morphine (aid station) | IV | 5 min; 4 h | pain ×0.3 | −3 all; respiratory depression ×2 of fentanyl's |
| TXA | IV | 18.3 | | |
| antibiotics (oral, IV) | course | daily | tradecraft's +30 against infection | |
| ondansetron | 8 mg | 30 min; 8 h | nausea and vomiting ×0.2 (ARS, space sickness) | |
| promethazine | 25 mg | 30 min; 6 h | space sickness ×0.3 | drowsy: −1 mind, sleep pressure +1 h |
| scopolamine patch | 72 h | 4 h; 72 h | space sickness ×0.4 | dry mouth (thirst +10% faster), −1 eyes (blurred) |
| radioprotector ("rad-tabs") | 1 tablet, 30 min before | 4 h | acute dose ×1/1.4, late ×1/1.15 | nausea (−1 all), −1 body |
| potassium iodide | 130 mg | | thyroid only (a reactor accident's fallout) | |
| bone-density tablet | weekly | | bone loss ×0.5 (bisphosphonates do this in spaceflight) | issued on voyages and Europa duty |
| melatonin | 3 mg at the right body hour | | +0.3 to the body clock's light (7.2) | drowsy 1 h |
| alcohol | a drink is 14 g | absorbed in 30 min; 0.015% BAC an hour eliminated | BAC = grams/(massKg × 6.8 for men, 5.5 for women) per mille ×0.1: 0.03% −1 hands and eyes; 0.06% −2 all; 0.08% −3 all ("drunk"); 0.15% −6 all, vomiting 10% an hour; 0.3% unconscious; 0.4% death risk | urine +0.1 L a drink; sleep ×0.8; a hangover next sol (−1 all, thirst); on duty, PEOPLE.md's discipline |

## 21. Death and incapacitation

### 21.1 States
- **Down**: cannot stand (tradecraft's `canStand`), can act from the ground if conscious.
- **Out**: unconscious (17.2), on a timer or until a cause clears.
- **Critical** (longhaul's): heart health 0, or a lasting wound festering past its end. A dying timer of 5 to 40 min (drawn); CPR or stabilisation holds it (longhaul's `stepRescue`).
- **Cardiac arrest**: from core under 28 °C, heart health 0, G crush, electrocution, anoxia or a high-dose crash. No pulse, no breath: unconscious; the anoxic clock (11.2) runs from the first second (×0.3 with CPR); a shock from an AED restores a rhythm 40% of the time in a shockable arrest (hypothermic hearts only once rewarmed over 30 °C); brain death at 480 s of anoxia.
- **Dead**: `body.dead = { ms, why }`.

### 21.2 Causes of death
Bleeding out (blood under 45%); a head shot (WEAPONS.md, tradecraft's 60% × calibre); the brain's clocks (480 s without oxygen, or 1 to 4 h of severe hypoxia, 11.2); vacuum (120 s); heat (core over 42.5 °C); cardiac arrest unreversed; sepsis (infection severity 100); starvation (3.4); dehydration (15%); acute radiation syndrome (12.3); impact of 18 m/s or more; unprotected G (LONGHAUL's ≥ 8 G band); gas embolism or a neurological bend unrecompressed; CO over 60%; CO₂ over 10 kPa; a juice stroke; COMBAT.md's kills on someone down (tradecraft's interact actions).

### 21.3 The player's death
The view fades with the senses (VIEWS.md); the log keeps the last rolls. CAREER.md takes over: Ironman ends the career; Standard offers a load. The world's timeline continues and the memorial keeps the dead (DESIGN.md). TIME.md decides how long the clock runs while the player is unconscious before death or rescue resolves (my default: lived at 1:1 with a "wait" that skips to the next change).

## 22. The body in every roll
SKILLS §5.4 sets the contract and BODY fills it with two functions, both called by every check and every displayed odds:
- `bodyMods(p, key, ctx)` returns the `body` entries (wounds, pain, blood, fever, heat and cold, air, G, juice, load, sickness, drugs) and the `gear` entries (the suit, which EVA wears down by SKILLS §5.13's `mitigated()`), plus the gravity regime's `env` entry, which Zero-g wears down.
- `needMods(p, key, ctx)` returns the `need` entries: hunger, thirst, bladder and bowel, fatigue and sleep inertia, stress and morale, and hygiene.

Both read `SKILLS[key].uses` (SKILLS §2.2: `eyes`, `arms`, `breath`, `hands`, `legs`, `ears`, `head`, `voice`, `face`, `torso`, or `all` for CQC) and `ctx = { pressure, inSuit, g, vacuum }`. A row applies once to a roll whose skill uses any of the row's uses; "all" applies to every roll. Every entry is `{ why, v, src }` (SKILLS §5.3), one entry per cause. Both return `[]` for a body that is not simulated in detail (the crowd and off-map people, SKILLS §5.4). BODY maps conditions onto uses as SKILLS §5.4 lists them: an arm costs `hands, arms`; a leg `legs`; the chest `torso, breath`; the head costs every roll, and a concussion `head, eyes` besides; hypoxia and G-load `head, breath`. Whole-body effort (stamina, load, G-conditioning, the suit's bulk) costs `legs, torso, breath`, and `arms` where an aim sways. Elsewhere in this file the short words are shorthand for these uses, and the tables below are the definition: "body" means `legs, torso, breath`; "hands" means `hands` (and `arms` where an aim is concerned); "mind" means `head`; "eyes" means `eyes`; "social" means `face, voice`; "all" means every roll.

**`bodyMods`**

| Source | Condition | Mod | Uses |
|---|---|---|---|
| head | hurt / wounded or out | −1 / −3 | all |
| concussion | | −1 | head, eyes |
| torso | hurt / wounded | −1 / −3 | torso, breath |
| arm (each) | hurt / wounded / broken (splinted half; a tourniquet counts as broken) | −1 / −3 / −4 (Weapon handling −6) | hands, arms |
| leg (each) | hurt / wounded / broken (splinted −2) | −1 / −2 / −4 | legs |
| crack / fracture on a part | | −2 / −3 | that part's uses; on the head −1 / −2 to every roll |
| an old crooked break | | −1 | that part's uses |
| pain | 25 / 45 / 70 points | −1 / −2 / −3 | all, except CQC (tradecraft's adrenaline: you feel it after) |
| blood | pale / shock | −1 / −3 | all |
| fever | feverish / high / delirious | −1 / −2 / −4 | all |
| thermal | shivering / hypothermia / severe / hot / heat exhaustion / heat stroke | −1 / −3 / −6 / −1 / −3 / −6 | all (shivering's shake: −1 more on hands) |
| cold hands | 10 min / 30 min | −1 / −2 | hands |
| frostnip / frostbite | hands / feet | −1 / −2; feet −1 | hands; legs |
| hypoxia | SpO₂ < 90 / < 85 / dose 25 / dose 60 | −1 / −1 / −2 and −1 / −4 | breath, legs / all / −2 head and −1 all / all |
| CO₂ load | stuffy / 1 / 3 / 5 kPa | −1 / −2 / −4 / −6 | head / all / all / all |
| CO | 10 / 20 / 30% | −1 / −2 / −4 | all |
| AMS | mild / severe | −1 / −2 | all |
| G, +Gz | grey-out / blackout | −2 / −10 | eyes |
| G, +Gx | 3 / 5 / 7 / 9 G effective | −1 / −2 / −4 / −6 | all |
| G-LOC, dazed after | | −6 | all |
| G-conditioning | heavy / very heavy / crushing | −1 / −2 and −1 / −4 and −2 | legs, torso, breath / the same, and −1 hands, arms / the same, and −2 to every roll |
| juice | high dose active / hangover / crash | −1 / −1 / −3 | hands, arms (the tremor) / all / all |
| load | laden / heavy / very heavy | −1 / −2 / −4 | legs, torso, breath |
| mass | per 0.25 of mass ratio over 1.3 | −1 | CQC (key `cqc`) |
| stamina | under 50 / under 25 / blown | −1 / −2 / −4 and −3 | breath, arms, hands, legs (the aim sways with the breath) / the same / −4 on legs, torso, breath, else −3 on hands, arms |
| light vac suit (`gear`, worn down by EVA; the value at EVA 10 in brackets) | gloves / bulk, pressurised / bulk, unpressurised / helmet / visor fogged / visor fouled | −4 (−2) / −3 (−2), CQC −5 (−3) / −1 / −1 (−1) / −2 / −4 | hands / legs, torso / legs / eyes / eyes / eyes; fogging and fouling are not worn down |
| hardshell (`gear`, worn down by EVA) | gloves / bulk / helmet | −4 (−2) / −4 (−2), CQC −6 (−3) / −2 (−1) | hands / legs, torso / eyes |
| gravity regime (`env`, worn down by Zero-g; SKILLS §5.13's defaults, adopted; the regime from PLACES's `gravityAt`, the anchor from BODY's motion state) | free fall, unanchored / free fall, anchored (handhold, mag boots, a tether) / low g, 0.05 to 0.2 G | −6 / −2 / −2 | arms, legs, torso / arms, legs, torso / CQC, Fieldcraft and Fitness |
| space sickness | mild / moderate / severe | −1 / −2 / −3 | all |
| gravity legs | | −1 | legs |
| ARS | 12.3 by phase | −1 to −6 | all |
| DCS | type I / type II | −1 / −4 | legs, torso / all |
| ear barotrauma, vertigo | | −1 | legs, ears |
| sprain | ankle / wrist | −1 | legs / hands |
| skin trouble | while moving | −1 | legs, torso |
| drugs | as section 20 | | as section 20 gives |

**`needMods`**

| Source | Condition | Mod | Uses |
|---|---|---|---|
| hunger | hungry / very hungry / weak / faint spells / starving (3.4) | −1 / −1 / −2 / −3 / −5 | all |
| thirst | 2% / 4% / 6% / 8% | −1 / −2 (and −1 more on legs, torso) / −4 / −6 | all |
| bladder | 400 / 550 / 700 mL | −1 / −2 / −3 | head / all / all |
| bowel | 250 / 350 / 450 g | −1 / −2 / −3 | head / all / all |
| bladder and bowel together | | at most −3 between them | |
| fatigue (effective sleep pressure, 7.3) | tired / exhausted | −1 / −3 to −12 | all |
| sleep inertia | | −2 / −3 | all |
| stress | on edge / frayed / the shakes | −1 / −2 and −1 / −2 | eyes, face / eyes, face, and −1 hands, arms / hands, arms |
| morale | low / very low | −1 / −2 | head / head, face |
| hygiene | unwashed / rank / filthy, on a roll aimed at someone within smell range (`smellOf`, 6) | −1 / −2 / −3 | face, voice; nothing through a sealed helmet or over a radio |

The roll's log line names each ("Weapon handling check: 14 + 12 − 2 (gloves, EVA 12) − 1 (tired) = 23 against 15, success"), and the displayed odds include all of them.

**As built in v0.0.4** (`src/sim/body/mods.js`; no roll reads them until 0.0.6): the split is this section's, not the build sheet's example (which had put "tired" in `bodyMods` and stamina in `needMods`). `bodyMods(state, pid, key)` holds the thermal and stamina rows, `src` `body:…`; `needMods(state, pid, key)` holds hunger, thirst, the bladder and bowel (at most −3 between them), fatigue, sleep inertia, stress, morale and hygiene (the smell within its range only), `src` `need:…`, so a roll calling both counts each cause once. `key` is `'all'`, `'mind'`, `'body'`, `'hands'`, `'eyes'`, `'social'`, a SKILLS use, or an array of them. `capacityOf(state, pid)` gives `{ walkK, runOk, sprintOk, awareK, visionK, canStand }`; `awareK`, the perception term, is unread this round.

## 23. What the character knows

### 23.1 Sensations, not numbers
The body speaks in words on the character sheet (C) and through the instinct: "thirsty", "you could do with the head", "dead on your feet". Numbers appear only where an instrument measures them: the suit HUD (19.10), a dosimeter, a wrist terminal's clock, a pulse oximeter, the sick bay's readouts, a scale in the gym. Hypoxia, a slow CO₂ rise and a dose are felt late or not at all (11.2): they are the dangers of not knowing.

**One rule for fitness and gravity on every screen** (the user: "a shadow skill called effective fitness", 2026-11-03; "what we see is what our character evaluates as being true", 2026-10-28):
- **Effective fitness** shows as the felt band in cells, tradecraft's graphic that the user approved (the base, the offset's cells, the week's load against what holds it and what climbs): how the legs feel this week. It is the one body quantity the character reads by feel, because it is felt every day; SKILLS §8 and VIEWS §8.2 draw it.
- **G-conditioning and bone** show only as their last measurement with its date: the G class and the physiologist's note from the Long Arm, the Ring's log of sessions, the sick bay's bone scan. Between measurements the character has only the felt words of 14.1 ("heavy", "very heavy") when the g they are in says so.
- **Papers** (TIME §10.6's chapter paper, CAREER's evaluations) report measurements and felt words, never true values: "G class 2 (Long Arm, Sol 594)" (the standby's G-qualification, career sol 4: CONTRACTS §3), "the legs felt strong this week".

### 23.2 The body line (T's instinct, in priority)
Tradecraft's `aid.js bodyLine` order, extended: suit breach and its leak rate → vacuum or air you can't breathe → arterial or junctional bleeding (≥ 8 %/min) → can't breathe (a tension pneumothorax, a chest wound) → a dead suit fan ("purge!") → collapsed or in shock → bleeding (≥ 0.8) → G warning ("strain!", at the grey) → hypoxia felt → CO₂ rising → core under 35 or over 39.5 °C → a tourniquet on over 1.5 h → suit consumables under 15 min → dose-rate alarm → bladder or bowel at urgent before a strap-in, an EVA or a patrol → thirst at 4% → high fever, infection, an open wound, an unsplinted break, a dirty dressing → pain → hunger → tired past 20 h before a duty → grime before an inspection → stubble → blood on you. Each line states what to do and fires only while it applies (the user's 2026-10-27 complaint about advice that "doesn't even apply"), with tradecraft's no-flicker `settle()`.

### 23.3 Interrupts the body raises (TIME.md's interrupts consume them)
A skip or a splash stops when: a breach or a suit fault; the bladder reaches 700 mL or the bowel 450 g; thirst reaches 6%; hunger reaches weak; the core passes 35 or 39.5 °C, or frostnip forms; the hypoxia dose reaches 25 or the CO₂ load 1 kPa; any bleed starts or blood crosses a band; pain reaches agony; a dose-rate alarm; a suit consumable under 15 min; a microsleep hazard over 5% a minute while on watch; a faint, a vomit, an accident or a G-LOC. Sleep is woken by the bladder at 450 mL, agony, cold under 35.5 °C, and TIME.md's noise and alarm events. As built in v0.0.4 the interrupting crossings are the bladder at 700 mL, the bowel at 450 g, thirst at 6% and hunger at weak; asleep, also the bladder at 450 mL and natural waking (7.1). Only the earliest is posted (prio 3, `src` `body:<pid>`), cancelled and posted again when the load's signature changes, and the bursting (3% a minute) and desperate (2% a minute) hazards are pre-drawn and cancelled by relief.

### 23.4 The eyes: dark and light adaptation (built in v0.0.5)
The user, scoring v0.0.4's `test-night` (2026-11-06): "Would be nice to have eye adapting to darkness making things less dark after a while in the dark compared to when entering dark from a lit place". Every person's eyes carry an adaptation state (`body.eyes`, §2.5) that follows the light they receive, into the dark slowly and back into the light in seconds; perception's reach and the picture's exposure both read it through one helper, `eyeView` (§2.4), so what the screen shows is what the dice see. `src/sim/body/eyes.js`, whose header this follows:

- **The light as the eye takes it.** Places' `lightLevel` L (0 to 1) is a brightness scale, and brightness goes as luminance to the power 0.33 (Stevens' power law), so luminance goes as L cubed: Y = 100 cd/m² × (L / 0.75)^3, a lit room's 0.75 being 100 cd/m² (an office's surfaces under 500 lux). The squad bay at lights out (0.04) is then 0.015 cd/m² and the lit head (0.65) 65 cd/m², 3.63 log units apart: the human eye's range from room light into the dark. Every state is a log10 cd/m², and a light's colour enters by its scotopic to photopic ratio S/P (PLACES §3.9's table, `src/data/places/sky.js`): the rods follow the scotopic light, the cones the photopic.
- **The field.** The light the eyes receive is the mean luminance over the eye's spot and fifteen points in front of it that it has a clear line to (PEOPLE §7.6's `fieldOf`), so a lamp in view counts and one behind a wall does not. With the eyes shut (asleep, §7) the lids pass `LID_P` 3% of the photopic light and `LID_S` 1% of the scotopic (the lid passes red best), so a sleeper in a dark bay wakes fully dark-adapted.
- **Three processes**, each following its target and never below its floor, along exact closed forms that compose, so lived ticks and a skip give the same eyes (§2.6): **the cones**, falling with τ `CONE_DOWN_MS` 2 minutes to their floor `CONE_FLOOR_LOG` 0 (1 cd/m²); **the rods' neural adaptation**, τ `ROD_NEURAL_MS` 30 s, to the rods' floor `ROD_FLOOR_LOG` −2.1 (0.008 cd/m², lightLevel 0.034); **the rods' bleach**, τ `ROD_DOWN_MS` 13 minutes down to that floor and `ROD_BLEACH_MS` 6 minutes up (rhodopsin bleaching toward a lit room's level); and every rise into the light τ `UP_MS` 1 s. The rods' state is the greater of the two rods' parts, and the eye's adapted level is whichever system is the more sensitive, so a red light, which the rods hardly see, is read by the cones.
- **The curve.** Out of the lit head into the bay at lights out: the cones' plateau at 6.9 minutes, the rod-cone break at 8.3, the rods at full sensitivity at 34.2, 3.63 log units in all, the classic curve's shape (`eyes-model` prints it minute by minute). Back into the light the cones and the rods' neural part rise with τ 1 s: a glare settling in 3 to 5 seconds. A glance into a lit room costs a minute or two of dark adaptation, an evening under the overheads the whole curve.
- **The red lamp spares the rods** (my call: the reason navies and armies use red light at night). Ten minutes at the fire watch's red lamp's core (a red LED, S/P 0.04) leave the rods 1.57 log units darker-adapted than a white lamp as bright would, and the eyes are back to the bay's dark in 18.5 minutes instead of 27.7.
- **What it gives** (`eyeView`, §2.4). `gain`, the picture's exposure against v0.0.4's: (Y_ref / Y_a)^0.2, Y_a the adapted level and Y_ref the field's luminance, or `REF_LOG`'s 1.4 cd/m² where the field is darker (0.2 is the picture's own law, VIEWS §2.7). `coneGain`, the same for what the cones see, from the cones' own state, never over `gain`. `lightK`, perception's light factor (PEOPLE §7.1), (Y_ref / Y_a)^(1/3), the same quantity as `gain` (gain = lightK^0.6), so the picture and the dice agree. `rod`, the rods' share of vision: 0 at five minutes, 0.59 at twenty, 0.87 fully adapted in the bay. `glare`, the field over the adapted level. `shut` and `nv`. **`REF_LOG` 0.15 makes v0.0.4's fixed exposure the eye five minutes in from the lit head** (my call: the user rated that night "pretty perfect"), so there `gain` is 1, just in from a lit place 0.47, fully adapted 2.48 for the rods and 1.07 for the cones, and in any lit place at rest 1. **Two gains** (the review of v0.0.5's eyes, my call): the rods' for what the rods see of a pixel and the cones' for the rest, so a lamp's lit pool and the fire watch's red light keep their look while the dim surfaces lighten (VIEWS §2.7 mixes them per pixel; one gain took the red pool to 1.61 times v0.0.4's brightness and toward salmon, two take it to 1.27).
- **In a glare perception reads the field at rest, and only the picture blooms** (my call: a reach that collapsed for the second the lights came on was a blind moment the sim's unseen-only changes used, the fire watch moved off the post at reveille, a pop the tests caught).
- **Night vision** (not built yet: ROADMAP 0.6, VIEWS §16). With a helmet's or a suit's night vision on (`body.eyes.nv`, the one flag, set by `setNightVision`), the picture is the device's and the eyes' adaptation is neither shown nor read by perception (the device's own rule, PEOPLE §7.2's, comes with it). The eyes keep adapting underneath to the light they receive, so taking the device off shows them as they are. Open for the device's round: whether the eye behind the device adapts to the device's screen rather than to the scene.
- **Whose eyes are stepped.** The player's, live at each tick (`bodyFast`: the cheap check of the light's key, the field's fifteen samples only when the eye moved, turned, changed posture or the key changed) and in a skip at each slow step (§2.6). Anyone else's are computed when read, at rest in the light they stand in (`eyesAdaptedTo`, no record); no one else's sight is read this round, and when NPC sightings come (0.0.10) their record is the same one, anchored when read.
- **The numbers in the bay** (bay-2-1 at 23:00, arriving from Head A): the picture 0.47 times v0.0.4's at 0 s, 0.65 at 1 minute, 1.00 at 5, 1.20 at 10, 1.90 at 20 and 2.48 from 35 on; the reach 3.3, 5.6, 11.7 (v0.0.4's), 12.3, 14.9 and 17.6 m (PEOPLE §7.1). Asleep in the dark bay the rods sit at their floor, so **at the klaxon the eyes open at 2.4 to 2.8 times v0.0.4's gain for what the rods see and 1.07 for the cones**, and risen at your rack's foot the bay in sight is 1.34 times as light as the picture the user scored 80 (VIEWS §18, question 12: keep the dark-adapted wake, or cap the rods' gain in the picture).
- **Sources**: Hecht, Haig and Chase 1937 (the curve: the plateau at 5 to 10 minutes, the rods at full sensitivity in 30 to 40); Rushton 1961 (rhodopsin's regeneration near 400 s); Rushton and Henry 1968 (cone pigment's time constant near 2 minutes); Lamb and Pugh 2004 (Prog Retin Eye Res 23:307); Stevens 1975 (Psychophysics: brightness as luminance to the 0.33); CIE V(λ) and V'(λ) (the S/P of a narrow-band light, 2.489 × V'/V at its peak); Robinson, Bayliss and Fielder 1991, and Bierman, Figueiro and Rea 2011 (the lids: about 1% in the blue-green to some 10% in the deep red; the 3% and 1% are my rounding).

## 24. NPC bodies and their cost
- **Tiers 1 and 2** (your squad and chain; your platoon and company): the full record and every layer while on the live area; off-map, `bodyAdvance` on demand (when they come into view, at each schedule block, and hourly for healing in the `hour@:35Z` slot: CONTRACTS §5). Their needs drive PEOPLE.md's behaviour model (when they go to the head, chow and the rack).
- **Tier 3** (named people of a place): the full record, advanced only daily and on meeting, with needs as schedule outcomes.
- **Tier 4** (the crowd): no record. A stub `{ hurt, down, dead, bleeding }` from COMBAT.md's resolver; recycled after skips.
- **Budget**: the fast layer for the player and up to 40 on-area NPCs costs under 0.3 ms a tick (TECH.md's 2 ms sim budget); the second layer is staggered across ticks by a hash of the id; nothing in the body is O(n²).

## 25. Tests
Each module ships with a `tests/body-*.test.mjs` that prints its numbers (DESIGN.md's rule; tradecraft's Monte-Carlo habit). Seeded; QUICK skips the starred heavy ones.

| Test | Prints |
|---|---|
| `body-energy` | basal kcal/24 h for the reference man and woman; kcal for the range sol and the hump sol at 0.38, 1.0 and 0.134 G (2,770 / 3,280 / 2,570 and 2,990 / 3,640 / 2,740 ± 3%); the ruck's metG at 1 G and on Mars (4.8, 3.4); hours from a 900 kcal meal to "hungry" at rest, walking, PT; the penalty-minutes from hunger of a standard sol lived to the Plan of the Day (target 0, breakfast anywhere in its window); sols of fasting to weak, faint spells and death |
| `body-water` | the training sol's ledger (drunk, food and metabolic water, insensible, sweat, stool, urine, voids, end balance); deficit after a 6 h EVA at 300 W with and without the drink bag; the first two days in free fall (urine from the plasma shift, about 0.3 L the first day; thirst muted); sols to death without water at rest |
| `body-elimination` | the bladder's peaks over the standby sol and when each void happens; time from a 1 L drink to "urgent"; bowel urges after breakfast; accident rates when a 6 h EVA starts at 300 mL and 150 g |
| `body-hygiene` | grime after a sol of PT and range; grime after showers of 1, 2, 3, 4 and 5 min of water (30 / 8 / 2 / 1 / 0); sols to "rank" without a shower; skin-trouble rate at grime 80 |
| `body-sleep` | pressure at taps and at reveille over 7 sols on TIME §9.2's schedule (reveille 05:30, taps 22:00, the 07:00 holiday reveille), three weeks running, at sleep needs of 7.5, 8.0 and 8.5 h, with the hour "tired" begins (target for 8.0 h: reveille 0.4 to 1.0 h, tired after 21:00, never in training); penalties after 20, 24, 36 h awake; microsleeps an hour at 24 and 30 h on watch; days to clear a 9 h jump from Melas time to ship UTC (6 to 9) |
| `body-thermal` | the reference cases of 10.4 (minutes to 35 °C, the skin at 10 and 40 min, shivering watts, sweat L/h); the suit cases of 19.6 and 19.11 (minutes to 39.5 °C); frostbite minutes at −28, −40, −42 and −55 °C felt |
| `body-air` | PiO₂, SpO₂ and TUC for every row of 11.1 (TUC within 10% of the USAF table); vacuum to unconsciousness (about 15 s); both brain clocks: injury and death times at PiO₂ 1.5, 2, 3, 3.8, 5 and 5.7 kPa (3 / 8 min under 2 kPa; 15 min / 1 h at 2; 50 min / 3 h 18 min at 3.8; none at 5.7); CO₂ load after a dead cartridge and after a dead fan at 1, 3, 5 min, with and without the purge; COHb after 20 min at 1,000 and 6,400 ppm, at rest and working, at 101.3 and 66 kPa; minutes to collapse in PLACES's 9,000 ppm squad-bay fire, asleep and awake |
| `body-dcs` * | P(DCS) for each row of 11.7 over 4,000 seeded people (37% / 31% / 25% / 15% / 2% / 8% / 0.4% / 0.2% / 0.02% / 0.01% / 54%, ± 3 points) |
| `body-suit` | leak table of 19.4 (pressure held, time to 17, 12, 10, 6.3 kPa) for 1 to 25 mm holes in the light suit and the hardshell; suit-hour budgets at 130, 300, 600 W for both; the donning sums at EVA 0, 10, 20 (shell 90 s, quick don 140 s, full 345 s at EVA 10); patch success by EVA skill 0, 10, 20 for 5 and 12 mm holes, own arm and own back; the packs' crossing times at 50, 200, 500 and 1,000 m |
| `body-gload` | grey-out, blackout and G-LOC seconds for each profile of 13.3; the held strain: G-LOC or not, and stamina left, for straining from the start, at the grey and too late, on a 3-minute profile to 7 G; `gqClass` for gCond 0.38, 0.70, 0.85, 0.92, 1.0, rested and dehydrated 4%; juice hangovers (21.6 / 43 / 72 h standard; 110 / 147 / 180 h for 7 G 6 h, 10 G 2 h, 10 G 24 h, LONGHAUL's parity); unsecured 3 G timeline (injured 50, unconscious 59, dead 106 min, ± 10%, LONGHAUL's parity) |
| `body-cond` | gEq for 0 to 10 h a week at 1 G on Mars (0.58 / 0.82 / 0.90 / 0.96 / 1.00 at 0 / 2 / 4 / 6 / 8 h); gCond after a standby of 10 and 14 sols with 0 and 4 h a week (0.86 / 0.83; 0.92), and on career sol 4's G-qualification (0.89); after the first voyage (1 G, 6.9 days) and the homeward one (0.3 G, 12.5 days), with and without sessions (SETTING §6.5; CONTRACTS §14); after 12 weeks on Europa with none, with the FOB's Hamster as PLACES has it, and with a 1 G-at-the-centre machine; `perf` and gK at 1 G and on Mars for those bodies; the Ring's seats booked against the battalion's demand (2,940 a week against 1,960); faint chances on standing after 30 days of free fall; training injuries a week in a battalion of 980 on the periodised Plan of the Day (target 3 to 6) and on an unperiodised one |
| `body-radiation` | `shieldK` and `skinK` for every row of 12.1's table; doses for 15, 30, 60, 240 min on Europa's surface in each shield; ARS outcomes over 2,000 seeded people at 1.5, 3, 5, 8 Gy-Eq by care tier; skin burns at 2, 6, 10, 15, 18 Gy |
| `body-motion` | the table of 16.1 (speeds, Froude numbers, stopping on three surfaces, jumps from the force-velocity push, falls); jump heights at Fitness 0, 10, 20 and at mass ratios 1.0, 1.3, 1.6; a 45 kg load's weight ratio on Mars, Europa, a 1 G deck; free-fall grab outcomes at 1, 2, 3, 4 m/s |
| `body-health` | tradecraft's printed rates, unchanged (parity): bleed times, knock seconds, pain under adrenaline, infection outcomes over 3 weeks, first-aid times by Medicine (now through `paceOf`) |
| `body-aid` | MARCH outcomes: arm artery with tourniquet at 25 s vs dressing; junctional bleed with and without gauze; tension pneumothorax with needle at 5, 15, 30 min; burn shock's collapse times at 20, 30 and 50% of body surface untreated (6.3 / 4.2 / 2.5 h) and with fluids; success rates at Medicine 0, 5, 10, 20 for each step |
| `body-mods` | every row of section 22 produced by a built body, each landing on the skills whose `uses` it names and on no other; `needMods` and `bodyMods` kept apart by `src`; the displayed odds equal to the rolled sum |
| `body-skip` * | **composition**: `bodyAdvance` over 8 h in one call against the same 8 h split at 1,000 random whole seconds, every ledger equal to float rounding; `nextCrossings` against the crossing found by stepping; **parity**: the same 8 h (a night, a shift, a voyage day, a bleeding casualty, a cold night outdoors) ticked at 20 Hz and skipped, every ledger within tolerance (energy and water 1%, bladder 5 mL, core and skin 0.05 °C, dose 0.1%, blood 0.1%) |

**Built in v0.0.4** (quick unless marked; each also prints the stage times through a training sol from a rested, fed start, tradecraft's ladders beside): `body-energy` (basal 1,763 and 1,392 kcal a day; the reference sol 2,777 kcal at 0.38 G, 3,303 at 1 G and 2,569 at 0.134 G, held within 3% of 3.2's; never past peckish with its meals; a resting fast weak at 5.0 sols, faint spells at 7.6, starving at 15.3), `body-water` (the training sol's ledger, level within 0.3 L in 4 to 6 voids; thirst's times without water, 4.3), `body-elimination` (the bladder's peaks and its 6 voids; no wake from 250 mL at taps; the accident at 850 mL; the bursting hazard at the same second lived and skipped), `body-hygiene` (30, 8, 2, 1, 0 exactly; wet hair 20 minutes; from 32 at reveille grubby at +0.10 sols, unwashed +0.54, rank +1.21, filthy +1.62), `body-sleep` (the template; three weeks at needs of 7.5, 8.0 and 8.5 h, Wednesday's reveille held within 0.4 to 2.0 h beside 7.1's 0.4 to 1.0; the body clock through the slip; latency, depth and inertia), `body-gait` (16.1's six rows from `gaitSpeeds`, Mars equal to `move.js`; stamina over 60 s of running), `body-mods` (every band on each key and on its keys only; `need:` and `body:` apart), `body-thermal` (tradecraft's stages beside the port's; 8 h indoors and an hour out at −10 °C) and `body-skip` (a shower, a night and a 15-minute wait, and the whole reference sol, one call a segment against 1,000 random splits to 1e−9 and ticked at 20 Hz within this table's tolerances, with grime 0.5, pressure 0.05 h and stamina 0.5 beside them; `nextCrossings` equal to stepping to the second; a save mid-minute carried on byte for byte; the `body:v2` upgrade). The whole sol ticked lived is heavy. TIME's `time-parity` holds the two engines to 0.01 kcal and 0.01 mL.

**Built in v0.0.5** (the eyes, §23.4): `eyes-model` (11 tests: the curve minute by minute, the glare, the red lamp, exact composition at 1,000 cuts, lived against skipped across taps and through `test-night`'s night to the klaxon byte for byte (heavy), a sleeper waking adapted, v0.0.3 and v0.0.4 saves loading with eyes at rest, each light's S/P against `lightLevel` at 2,000 points, the night-vision flag, and a day skip stepping by the hour except at the sky's minutes with the same eyes); `eyes-sight` (4: the reach by minutes in the bay, woken, the wake's tick never blind, the fog following the pose shown with your own berth in sight); `eyes-browser` (heavy, 4: shots of bay-2-1 at 0, 1, 5 and 20 minutes and at the klaxon against v0.0.4's eye, the screen's number checked against the sim's; the red lamp at 1.27 times v0.0.4's; the night's splash held at 1.000).

## 26. Fun

### 26.1 Decisions the body creates
- **Before every commitment, a body check.** Drink now and need the head in the drop ship, or go dry into a six-hour EVA. Eat before the burn or not (juice mutes hunger, and the couch's feed line is thin). Hit the head before the suit-up, because the suit's bag holds a litre and the liner is miserable.
- **Time against the body.** The Ring's evening seat against sleep or the club in Redwater. The Plan of the Day's two Ring blocks hold G-1's 0.9; an extra session a week buys a margin for Europa; skip the blocks through the standby and you are G-2 in a fortnight, with a heavy first sol at 1 G. The daily load cap: PT or the evening's hard gym session, not both.
- **The dosimeter as a budget.** Every surface job on Europa spends sieverts: 45 mSv for half an hour in a light suit, 21 in a hardshell, against COMBAT's 20 mSv plan. Volunteer for the extra ten minutes that finish the job, or rotate out and let someone else's career dose pay.
- **Air you trust or don't.** Martian air is home; an Earther's ship needs four hours on the mask, or two on the bike, before you seal up, and somebody always wants to skip it.
- **The suit's clock.** Oxygen and the cartridge give about 7.5 h at moderate work; a hole changes the arithmetic, and a hand on it buys the time to patch. A dead fan gives you minutes, and the purge valve spends them.
- **First aid under rules.** MARCH in order, with the clock running and your own wounds in the dice: tourniquet first, then the chest seal, then the wrap, because cold blood does not clot.
- **Ship-lag and the night watch.** Clocks change at embarkation and with every watch bill; the body follows at an hour a day, and the instinct tells you to take the melatonin and the light.

### 26.2 Stories it makes
A private who skipped the Ring all standby drags through his first sol on the transport's 1 G deck, heavy and short of breath; the one who skipped it for a whole Europa rotation faints at formation on the way home. A corporal on Europa holds her palm over a buddy's 8 mm hole while the reserve hisses, and patches it one-handed. The squad sergeant eats his juice hangover for three days after a combat burn, snapping at everyone. Someone wets himself strapped in for a six-hour burn because he didn't go, and the squad bay never forgets. A rifleman in the Tharsis highlands ignores the tingling in his fingers. A sentry on a clear night at −30 °C feels his face go numb in three minutes and is still standing at his post an hour later, shivering hard, and the corporal of the guard sends him in before the cold reaches his core.

### 26.3 Where it turns into chores, and what removes them
- **Eating, drinking, the head, washing, shaving, sleeping** are activities (TIME.md): one key at the appliance, a splash with the clock spinning, outcomes applied. Meals include water. The morning routine (head, shave, wash, dress) is one activity (withdrawn in v0.0.4 for this round: the head, the basin and dressing are each their own, TIME §8.2). With the Plan of the Day's rhythm, garrison needs are met without thought; they matter only when something breaks the rhythm, which is the point. Hunger never costs a roll on the Plan of the Day (3.4), and nobody needs a ration bar at taps.
- **Drinking in the field** is the instinct's one-key offer (T: "Drink", a 3 s sip) when thirst reaches 1% and a canteen or the drink bag is at hand: one keypress, never automatic (the user, 2026-10-31).
- **Hygiene** matters socially only at "unwashed" and above, a sol and a half of hard work from a shower: the base's evening shower makes it vanish; deployments make it a cost.
- **Sleep runs itself on the week, not on the sol.** On the Plan of the Day the sol is a little short: tired in the last half hour before taps by mid-week, never in training, and the holiday routine's late reveille clears it (7.1). Ship-lag is a few days with a clear fix.
- **Long stretches** (voyages, quiet weeks) are chapters: daily choices like "train in the Ring", "maintain your suit", "rest" set the body's day as outcomes (TIME.md's chapters), and the body's ledgers run through them in closed form.
- **Reflex cards** (TIME.md) appear only where a body choice is real and fast, and each option costs something, so a card is a decision rather than a key pressed once:
  - a **decompression**: "Exhale" (1 s: the lungs are safe unless the loss is explosive, but the hole leaks on for that second and takes useful-consciousness seconds with it) or "Hand on the hole" (1 s: the leak drops to a tenth and the pressure holds, but if the startle closed your glottis the drop since then may still pass your lungs' tolerance). On a 5 mm hole the hand is right, on a 12 mm slit the breath first, on a shattered visor there is nothing to cover; the HUD's leak rate and the hiss are on the card to read (11.6, 19.4);
  - a **fall** from a ledge: "Roll" (the legs absorb 1.0 m/s more, but you end prone, 2 s to stand, and the muzzle sweeps: WEAPONS's muzzle check) or "Land on your feet" (up at once, weapon steady, and the impact all on the legs). Under the legs' own absorption (16.5) there is no card: nothing is at stake;
  - a **knockdown**: "Stay down" or "Get up" (COMBAT's fight decides which is right).
  - A **G onset** has no card: the straining manoeuvre is a held step whose timing is the choice (13.3).
  - **Cards whose answer is pure training become automatic** above a threshold, with the roll in the log: at EVA 10 a marine trained in the Tank exhales on an explosive decompression by himself; at EVA or Warfighting 12 he strains at the grey; at Fitness 12, or airborne-qualified, he rolls a hard landing when nothing else is at stake. Tradecraft's remembered-choice rule (the user, 2026-11-04: "the reflex window is spammed on us too") lets an answer stand for 120 s (`KEEP_S`).

## 27. Build order
ROADMAP.md sets the milestones, and §3.4 there moved these proposals to 0.1.x and 0.0.7; this order adopts its table (2026-11-05). ROADMAP's 0.0.n rows name an order, not a release (CONTRACTS §18).

**0.0.7, the range** (ROADMAP §4, the `test-range` row).
- Wounds, bleeding, pain and knockdown: tradecraft's `health.js` ported (wounds, bleeding, pain, shock, knockdown, consciousness, death) with the range, so that a negligent discharge lands somewhere real (WEAPONS §6.6, ND-4); the casualty is the range corpsman's and the aid station's, as an outcome, until the lane joins at 0.1.x.

**0.1.0, the core standby week at Base Melas** (ROADMAP §5).
- Energy, water, bladder, bowel and hygiene with the mess, the head, the showers (by water minutes) and the canteen; shaving and inspections.
- Sleep pressure, deep sleep and the body clock on the sol (the timeslip inside taps); fatigue penalties; microsleeps on watch; the daily load cap and training injuries.
- Stress and morale; the shakes.
- The two-node heat balance with Mars outdoors and the night sky (PT dress at dawn, a night exercise at −30 °C, the sentry's night), cold hands and frostbite.
- Air at Melas (the stuffy 0.4 kPa for newcomers only); CO from a barracks fire.
- Fitness and effective fitness with PT, light PT, the gym, humps and the range walk; stamina; G-conditioning, bone and plasma tracked by the daily closed form (14.1 to 14.3), so the edge carries them; `perf` for CAREER's tests.
- Locomotion at 0.38 G (gaits, push and brake limits, traction, load by weight and mass).
- Caffeine, garrison painkillers, alcohol at the club; the background dosimeter reading.
- `bodyMods` and `needMods` on SKILLS's `uses`; the body line; interrupts; `bodyAdvance`, `nextCrossings` and `bodyPeek`; the composition and parity tests.

**0.1.x, the patches that fill the standby** (ROADMAP §5.8, one scored scene each).
- **The suit in the Tank** (moved from 0.2 by ROADMAP §3.4; the `test-tank` scene): the light vac suit's pressure, leaks and patching, hypoxia in the suit, consumables, the dead fan and the purge, donning with its sums (the shell's 90 s, the quick don, the full don), mobility costs, the suit room's cleaning, and the Tank's breach drill with the decompression card; and the **altitude-chamber class** (hypoxia awareness: masks off at a simulated Tharsis, cards to sort, symptoms learned; PLACES.md needs a chamber room whose pressure the instructor sets).
- **Acute G in the Long Arm** (moved from 0.2 by ROADMAP §3.4; the `test-ghouse` scene): axes and posture, effective G, +Gz from grey-out to G-LOC, +Gx, the held straining manoeuvre, and `gqClass` for CAREER's G-qualification; G-conditioning trained in the Ring; the force-velocity jump and falls from the training tower.
- **First aid** (the `test-lane` scene): MARCH with the IFAK's tourniquet, pressure dressing and gauze (range accidents, combatives, a training fall); diagnosis; the base clinic.

**0.2, the move and the voyage** (ROADMAP §6). Vacuum in full: ebullism, lung barotrauma (the drop since the glottis closed, explosive decompression), the ears' asymmetry, DCS and prebreathe; free-fall locomotion, mag boots, handholds and the SAFER jet; couches under thrust, sustained +Gx and juice re-based to seconds with LONGHAUL's hangovers; space sickness; the free-fall fluid shift and plasma; ship UTC, the week on the ship's clock and ship-lag; cruise dose and the storm shelter; the corpsman's bag (chest seal, NPA, needle); G-conditioning under 1 G of thrust; the quick don at general quarters.

**0.3, Europa** (ROADMAP §7). Chronic deconditioning in full at 0.134 G and the centrifuges at Camp Lofn and the FOB; low-g bounding on surface and town ice, cleats; Europa's surface dose through 12.1's shielding curve, ARS in Gy-Eq and radiation burns; water rationing and the FOB's long showers; the FOB's aid station and its chamber; burn shock and CO from fires; acoustic trauma in closed decks; combat wounds for real.

**0.4, ships at war** (ROADMAP §8). Juice in combat burns and its hangovers; sustained +Gx; lateral jinks and being thrown; hypervelocity wounds, blast lung and ears, burns; the prompt dose of a nuclear near miss; the post-deployment assessment (dose, wounds, stress).

**0.5, boarding and EVA** (ROADMAP §9). The hardshell (19.11) with its swing-bed scrubber, high mode and mag soles; the combat pack; suits in CQC (mass against weight); EVA budgets; DCS and prebreathe for a boarding from a 101 kPa Earther hull; the long sealed day; tumbling and hull impacts.

**0.6 and 0.7, special operations** (ROADMAP §10, §11). Long sealed EVAs, the 45 kg march, cold and sleep loss in the field (0.6); Io's dose in minutes and the hyperbaric lock under Thera (0.7). The Lorica waits for SETTING §16's later list.

**0.8, the long career** (ROADMAP §12). Permanent injuries and prosthetics, late radiation effects and the career dose limit (CAREER's), and combat stress load in depth with PEOPLE.md's care.

## 28. Cross-references

What BODY relies on from each section, and, after the critics' review of 2026-11-05, what each needs to change to meet this file (their owners' to make).

| Section | What BODY relies on from it | What it should take from this revision |
|---|---|---|
| TIME.md | the clocks (Mars local with the timeslip, UTC) and which one a person lives by; the activities table with durations and each activity's body profile fields (2.3); `skip()` calling `bodyAdvance` with environment segments; the splash and reflex cards; interrupts consuming 23.3; chapters setting daily activities; how the clock runs while the player is unconscious; the world layer's solar particle events | *Answered* in TIME's revision of 2026-11-06: §5.5: needs are BODY's ledgers advanced by `bodyAdvance`, with no anchors and no `valueAt`; the earliest of `nextCrossings` queued as a priority-3 event (`ledger`, `band`). §8.1: `chorePace` deleted, every activity paced by SKILLS's `paceOf` on its named skill (`suit-up`: EVA; `clean-rifle`: Weapon handling, as WEAPONS §9.3), which answers TIME §19's request. §8.2: `suit-up` and `suit-down` are 19.7's sums × `paceOf(EVA)` (345 s with a buddy, 450 alone, the 140 s quick don; 180 s off); the shower's water minutes are PLACES's per site, and its hygiene BODY's by water minutes (6); `sponge-bath` and `wipes` need durations. §8.6: `centrifuge` becomes the Ring's 2 h block (doors locked while it spins), `pt` gains light PT, and the gym's 18 h rule becomes 7.3's load cap. §9.2: reveille 05:30 stands; 7.1 gives its sleep balance. §17's "3–4 toilet visits a sol" comes out at 4 to 5 for the 2 L of urine a cool training sol makes (4.2): honest at that intake. §10.6: the chapter paper reports measurements and felt words (23.1). The reflex cards of 26.3 (the G onset is a held step) |
| PLACES.md | each area's and room's `env` (2.3): pressure and gas mix, CO, temperature, wind, light cycle, dose rate, gravity (with the voyage's thrust), surface μ and ferrous decks, fire, smoke, water quality; the altitude chamber, the Ring and the Long Arm, the suit room, heads, showers and the aid station's chamber as fixtures | a sky temperature in the weather (Swinbank or Brunt, about −55 °C over −30 °C air on a clear Melas night) folded into `radC` by view factor; `doseAt` reading 12.1's shielding curve for its hulls and ice (its depth function is the curve's tail, unchanged from 0.5 m down); `gyPerSv` by field; each site's `WATER_MIN` and litres (Melas, the ship's 12 L, the FOB's 5 min and 30 L, the towns' long showers) in one place with TIME's 1.5 min for Europa withdrawn; blood on a deck (0.2) in §2.7's list; the Ring booked by company with evening seats (14.1's capacity); the FOB's Hamster gives only 0.67 G at the centre of mass, so to hold a marine near 0.9 on Europa it needs about 1.8 G at the feet of its 2.2 m arm, or a longer arm; Olympus summit's dose (about 1.4 µSv/h) for its table |
| SKILLS.md | the skill list and each skill's `uses` (§2.2, used by section 22); the contract of §5.4 (`bodyMods` and `needMods` with `ctx`); `paceOf` (§5.12) for every body step; `mitigated()` (§5.13) for the suit and the gravity regime; the EVA skill used by patching, donning, push-off and grabs; Medicine's pace; Fitness as a skill whose effective value this section computes; the straining manoeuvre as a trained technique (the better of EVA and Warfighting); training XP multipliers from morale | `ctx` should carry the roll's target distance (`targetM`) so the smell penalty (section 22's hygiene row) applies only within range. SKILLS §8 now takes BODY's gravity and carry factors (15.1's walking and running rules) and its centrifuge session of 8 points, and its `FIT_WEEK_MS` is 15.1's training week |
| WEAPONS.md | bullets into injuries (calibre, force, part, through-and-through), hole sizes through suits, armour coverage, muzzle blast levels at the ear, recoil and anchoring that use 16.2's traction, frayed-stress use in muzzle discipline, the suits' armour | §8.3: "hard suit (boarding armour)" renamed "hardshell (HAD M-22)", its mass and life support BODY's 19.11; §7.8's `light` anchor recomputed on PLACES's surface ice at μ 0.30 (deceleration 0.39 m/s² on Europa, twice the old figure, so each push stops in half the distance: a 5.6 cm/s push in 0.4 cm), and 0.10 in the towns |
| COMBAT.md | suppression and "being shot at" mods, CQC in suits and low g using 16.3's mass penalties, EVA tactics on 16.6's packs, CASEVAC times to the care tiers, the off-screen casualty resolver for the crowd, blast injuries and throws | §13.2's suit-up cites 19.7's quick don (120 s and the 20 s buddy check, 140 s); §14.2's crossings and §15.1's pack read 16.6's table (the numbers agree); §15.3's dose plan and ceiling go into CAREER's limits table, and its example suit rate becomes 12.1's (89 mSv/h in a light suit, 41 in a hardshell: a 20 mSv plan is 13 and 29 minutes) |
| PEOPLE.md | NPC LOD and how needs drive behaviour; reactions to smell, blood and accidents; discipline for grooming, sleeping on watch, being drunk; chaplain and counsellor care for combat stress load; perception using the helmet cone, vision under G and hearing | the Plan of the Day periodised (light PT on MCMAP and hump sols, none on a field-exercise sol: 7.3); the Ring's two blocks a week scheduled by company (14.1); `people.behaviour` printing training injuries a week against BODY's 3 to 6 |
| CAREER.md | `gqClass` and `perf` (14.1); the limits table (12.3); medical boards (bone under 0.7, career dose, permanent injuries, a G downgrade), late effects on its timeline, death and the memorial, Ironman and Standard | *Answered* (2026-11-06): §14.1's `gqClass` runs §7.3's classes as CAREER writes them (G-1: 2 h at 1 G at r ≤ 1.15, then 3.5 G held 2 min seated upright; G-2: r ≤ 1.5 and 2.5 G held 2 min), CAREER owning the gates; §7.1 and §7.2's working formula for P is BODY's `perf`; §7.5's "don in 90 s" is 19.7's shell onto the skin at pace 1.00; §15.6 becomes the one limits table (annual, career, the rotation's planning level, a commander's, life-saving, the EVA plan and ceiling) |
| VIEWS.md | the body on the sheet in words, the doll with wounds and suit, the suit HUD, vignettes for grey-out and blackout, the splash vignettes, keys for patching and the suit's steps | §8.2 follows 23.1's one rule (effective fitness in felt cells; G-conditioning and bone as the last measurement with its date); the straining manoeuvre is a held key (13.3); the pack's Δv on the HUD (19.10) |
| TECH.md | module layout (2.7), tick order, the stream discipline for body rolls, save stripping of `$` keys | §19's `bodyAdvance` and `nextCrossings` as specified in 2.6 (plus `bodyPeek`), with `body.held` saved; the heat balance's 10 s grid |
| SETTING.md | the names of the suits, rations, drugs and medical units; grooming standards; the Corps' fitness and G-conditioning standards; the week (§3.4) | §4.3: Mars's surface dose is about 0.7 mSv a year (PLACES's 0.08 µSv/h), not 1 to 1.5; §7.2: Callisto's surface is about 1.4 mSv a day with the galactic cosmic rays (Ringwald's 0.1 is the belts alone); §7.3's dose table takes its suit, cab and ice rows from 12.1's curve (hardshell 41 mSv/h, Lorica 12, lander 23, crawler 3.1; 1 m of ice 0.61 mSv/h, not 0.2 mSv a day), and its dose rules go into CAREER's limits table; §5.7's donning times are 19.7's (the shell's 90 s, about 6 min from scratch with a buddy, as it says). Open between SETTING and BODY: the Mk 7's skin is mechanical counter-pressure, but 19.4 treats the suit as one gas envelope, so a hole through a limb's skin vents gas in BODY's model where it would only bare a patch of skin in SETTING's. Default until settled: BODY's model stands |
| ROADMAP.md | the milestones for 27's order (§3.4's table, adopted) | `moment-surface`: 89 mSv/h in a light suit, a 20 mSv plan is 13.4 min of work (unchanged in effect); `moment-gq-drill`: suited in 140 s (120 s and the 20 s buddy check); `moment-long-arm`: the strain is a held step, not a "Strain or Relax" card, and G-1's 3.5 G hold greys out a Martian civilian and a marine who comes tired, dry or low on plasma, never a rested conditioned one (14.1, CAREER §7.3) |

## 29. Open questions for the user
Each has a default I have built the spec on.

1. **How plain should bodily functions be?** Accidents (wetting, soiling, vomiting in a helmet) are modelled and their consequences are real. Default: they are told in one plain line of text and shown at most as a stain on the doll, never animated.
2. **Menstruation.** Default: not modelled; the Corps issues cycle suppression and the character takes it (one line in SETTING.md). The alternative is a monthly cycle with supply and comfort effects.
3. **Honest walking speeds.** Mars walks at 1.14 m/s and runs at 2.69; Europa walks at 0.88 and bounds at 1.97; a run on Europa's surface ice takes 5 m to stop, and 15 m on a town's wet ice. Default: honest, as the brief's realism asks. The alternative bends the speeds toward Earth's for pace.
4. **The player knocked down by bullets.** Tradecraft spared the player. Default: the player goes down as NPCs do, and getting up is their choice when the body allows.
5. **Combat stress load** (nightmares, startle, a slower recovery after losses). Default: on, light, and lifted by sleep, morale and care; never an "insanity" meter. The alternative is to leave it out.
6. **Juice's bend**, and LONGHAUL's unsecured G timeline with it (§1.1). LONGHAUL's ÷3 and ÷4.5 let bodies sit at 5 G for a day, which no real drug allows. Default: kept as the setting's rule, with LONGHAUL's hangovers and strokes. The alternative is a harder physiology where sustained combat burns past about 3 G kill.
7. **A career radiation limit** (CAREER §15.6 owns the table). Default: 1.0 Sv ends Jovian duty through a medical board. The alternative is no hard limit, only the late-effects risk.
8. **The centrifuge's strength** (§1.1). Default: four hours a week at 1 G hold a marine at 0.9, better than any trial has shown, so the Plan of the Day can keep a battalion deployable. The alternative is the tested effect, which would make G-conditioning a much larger share of every marine's free time.
9. **The sleep balance** (§7.1; raised by v0.0.4's build, 2026-11-06). Built, an 8.0-hour sleeper reaches Wednesday's reveille with 1.6 h of sleep pressure, not §7.1's 0.4 to 1.0, and is tired from 20:48, not 21:10 to 21:40, because the body clock puts 22:00 inside the wake-maintenance zone and falling asleep at taps takes 18 minutes; never tired in training holds. (a) Count the zone on the civil clock, so taps falls outside it; (b) move taps to 21:45; or (c) accept the model, with §7.1's text corrected to it. *Default: (c), as built.*
