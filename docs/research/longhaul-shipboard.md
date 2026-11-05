# LONGHAUL research: shipboard life and bodies

Researcher's note for OLYMPUS. Source project: `/Users/deaumas/lab/vibe/claudecode/longhaul` (read-only, branch `overhaul`, v1.12.21, last commit 2026-10-31). Every path below is relative to that root unless it says otherwise. Line numbers are from the files as read on 2026-11-05.

Read in full: `docs/SHIPBOARD.md` (173 lines), `docs/DOCKING.md` (165), `js/sim/crew.js` (521), `needs.js` (144), `duty.js` (93), `crew-ai.js` (1311), `life-support.js` (287), `fire.js` (134), `inertia.js` (140), `ship-layout.js` (607), `tiles.js` (163), `systems.js` (548), `jobs.js` (62), `reactor.js` (241), `boarding.js` (594), `careers.js` (365), `hospital.js` (116), `gravity.js` (161). Read in part: `game.js` (the minute tick, lines 71–123 and 225–520), `autopilot.js` (crew policy and flip interlock, 120–160 and 600–650), `hulls.js` (header, collars, tower builder), `docking.js` (header and constants), `mating.js` (header), `damage.js` (`hitPlayer`, 178–228), `crew-services.js` (header), `ground.js` (header), `shuttles.js` (header), `bodyfacts.js`, `ship-classes.js` (TECH table), `ui/roomcam.js` (header), `CLAUDE.md`, `memory/feedback_scale.md`, `git log`. I also ran the real deck generator and physiology functions from a scratch script (imports only, nothing written to longhaul) to get the deck maps and outcome timings quoted here.

---

## 0. What matters most for OLYMPUS (short version)

1. **The body model is the most reusable asset**, but it was built for a captain watching a crew, at one-minute resolution. It has a 6-part body (head, torso, 4 limbs, 0–100 each), a heart (health, stress, bpm, blood pressure), consciousness, a condition list, the Expanse "juice" model (doses, hangover, crash, strokes), impact trauma by speed in m/s, burns measured in points, festering wounds, an autodoc, and hospitals. The constants are sensible and well tested. A foot soldier played second by second needs a fast layer on top: G-LOC by axis and duration, time of useful consciousness in vacuum, bleeding per wound, pain and shock. It also needs things longhaul doesn't model at all: temperature, partial pressures, bladder and bowel, personal thirst, fitness and deconditioning, radiation.
2. **Needs and morale** (4 needs, decay rates, `moraleTarget`, `moraleFactor`, `efficiency`) form a compact, proven formula set. Adapt it to more needs and a Mars sol (longhaul's day is a hard-coded 1,440 minutes).
3. **The compartment atmosphere model** is a clean pattern: one gas state per deck, tank-fed injection, scrubbing, a breach at 20%/min, venting at 10%/min, exchange through the ladder shaft, pressure doors that hold across 15 kPa, suits (48 h O₂) and couch hoods (2 h). Its physics is simplified. Thresholds are in O₂ *percent*, not partial pressure. There is no temperature, and decompression harms the body over minutes, not seconds. Keep the architecture and redo the physics.
4. **Crew AI**: a strict priority ladder (0 being carried … 10 idle), a job board that subsystems post to, and assignment by skill, distance and watch. Physically booked places (stools, counter queue, couches) mean nobody shares a spot. A min-max-walk couch matching runs as a binary search over walk lengths plus bipartite augmenting paths. The patterns are excellent and engine-independent. The movement speed isn't usable: 0.8 tiles a game-minute, an artefact of the minute tick.
5. **Interior generation** works from per-class *deck programs* that stack deck templates (ASCII art, 7 or 9 tiles wide, 3–4 rows) bow to stern. One ladder runs down the spine, and the same program builds the exterior hull, so collars line up with airlocks. That idea, one program feeding both the interior and the hull model, should carry over. The geometry doesn't: decks are tiny (9×3 tiles) and the ship is a single 2D strip of rows with a one-row gap per deck. "Down" is also inconsistent: the cameras read each deck as a floor plan with the bow up the ladder, while the inertia code slides bodies along +y. OLYMPUS needs real z-stacked decks with full floor plans.
6. **Boarding** is an abstract minute-by-minute Poisson exchange. Use it as the *background resolver* for fights the player isn't in, never for the player's own. Its phases (muster, cross, breach, fight, secured, return) and their durations are good scaffolding for a boarding mission.
7. **Docking and collars** are thorough but pilot-centric. Reuse the collar table and the timings (capture 2 min, seal 3 min, undock 2 min) for drop-ship and boarding scenes.
8. **Careers** (rank steps with XP and skill gates, monthly pay, Gompertz ageing, cabin fever, leave bonuses, memorial) should be adapted to Martian Marine ranks.

---

## 1. Architecture context (how shipboard life is driven)

- **One minute at a time.** `minuteTick` (`js/sim/game.js:259–503`) advances everything by one game minute (`MIN_S = 60`, `DAY_MIN = 1440`, `js/core/constants.js:12–13`). The order of the people/plant part (game.js:402–471) is:
  1. compute felt G: `g = hypot(thrustG, jinkG) + rcsG` (403);
  2. crew policy with hysteresis (`SECURE_LINGER = 10` min, game.js:73, 406–407);
  3. `systemsTick` wear/faults, `systemsJobs`, `breachJobs` (413–418);
  4. per member: `gStateFor`, `protectedG` (couch+juice), `physiologyTick`, `endJuice` when lapsed (420–438);
  5. `crewTick` behaviour (439–444);
  6. careers (daily at minute 300 of each day) (446–454);
  7. water and food for crew and passengers, then `needsTick` per member (457–466);
  8. `fireTick`, then `lifeSupportTick`, then `reactorTick` (469–471).
- **Purity and data**, rules set by the user in longhaul's `CLAUDE.md`. `js/sim/` never touches the DOM and reports through `emit`. State is plain JSON (keys starting with `$` are runtime-only and stripped from saves). Randomness goes only through `core/rng.js`: mulberry32, `seedRandom(seed)`, plus `nextOf(holder,key)` for an independent stream kept inside the data, used by careers so seeded tests are unaffected. Every module opens with a prose header explaining its model.
- **Inertia is the one real-time exception**: `inertia.js` runs at 120 Hz in "bullet time" while game time is frozen (see §8).
- **Docking proximity ops** integrate in whole seconds inside the current minute (`dock.t`). That is the only sub-minute sim in longhaul.
- **Consequence for OLYMPUS:** longhaul's people model is tuned for "a minute is the atom". The player's body in OLYMPUS needs a second (or sub-second) atom. The cleanest reuse is to keep longhaul's per-minute functions as the *slow layer* (needs, healing, juice, morale), called every 60 game seconds, and add a fast layer.

---

## 2. The human body (`js/sim/crew.js`)

### 2.1 Data shape (`createMember`, crew.js:82–122)

```
skills: { piloting, security, engineering, medical }   // 20–59 base, role skill +25–39, cap 100
body:   { head, torso, leftArm, rightArm, leftLeg, rightLeg }  // 0–100
heart:  { health 100, bpm 68–79, stress 0, stressMinutes 0, bpSystolic 120, bpDiastolic 80 }
consciousness 100, morale 70–99, dead, deathTimer -1, conditions: [],
juiced, juiceDose ('standard'|'high'|null), juiceMin, juiceIdleMin, juicePeakG, juiceHangover (min), juiceCrash,
suit: { wearing, o2 (hours), lockerId, keep }, hunger (min at food 0), thirst (min without ship water),
needs: { rest, food, hygiene, fun }, duty: { station, shift }, moraleMod,
homeDeck, pos { sx, sy } (continuous ship coords), path [], activity, task, seat, gState, pause
(+ burns, stabilized, couchAir, away, lost, careers fields added elsewhere)
```

Condition labels (crew.js:60–66): dead, critical, brain-damage, crushed, cardiac-stress, injured, unconscious, starving, dehydrated, hypoxic, hypercapnia, decompression, juice-hangover, fracture, internal-bleeding, burned, severe-burns, deep-trauma.

### 2.2 Aggregates and gates

- `overallHealth` (136–140) = head·0.25 + torso·0.30 + each arm·0.10 + each leg·0.125.
- `isConscious` = alive and consciousness > 10. `isAble` = conscious and not `critical` (142–143).
- Consciousness floors at 10 while alive (10 means unconscious). Brain damage caps it at 50.
- `injured` is derived whenever any body part is under 70. `unconscious` when consciousness ≤ 10 (`refreshDerivedConditions`, 418–425).
- `needsMedical` (145–151): any burn, or a lasting wound not yet stabilized, or health < 85 (< 60 with a lasting wound), heart < 70, critical, internal bleeding, fracture, or unconscious.

### 2.3 G thresholds and posture (crew.js:11–26, 287–293)

| Constant | G | Meaning |
|---|---|---|
| MICRO_G | 0.01 | below: floating |
| COMFORTABLE | 0.3 | below: reduced mobility; recovery slightly slower |
| STANDARD | 1.0 | |
| HIGH | 1.5 | above: strain; couch gives juice; crew must secure |
| DANGEROUS | 2.5 | above: injury unsecured, prone ("pinned face down") |
| LETHAL | 8.0 | crushed |

`GState`: SECURED if in a secure seat (any G), FLOATING < 0.01 G, STANDING ≤ 1.5, STRAINED ≤ 2.5, PRONE above. The cameras pose bodies from this (braced, pinned, floating).

### 2.4 G damage per minute (`physiologyTick`, crew.js:321–354), applied to *effective* G (after couch and juice)

| Effective G | Body per minute | Heart per minute | Other |
|---|---|---|---|
| ≥ 8 | head −2, torso −2.5, arms −1.5, legs −2 | stress +8, health −1.5 | morale −3; crushed + cardiac-stress |
| 2.5–8 | torso −0.4, legs −0.6 | stress +4, health −0.3 | morale −1; crushed + cardiac-stress; consciousness −1.5 |
| 1.5–2.5 | legs −0.05 | stress +1.5 | morale −0.2; cardiac-stress if stress > 50 |
| < 1.5 | natural mending (below) | stress −5 (≥ 0.3 G) / −4 (< 0.3 G) | morale +0.05 at ≥ 0.3 G |

- Sustained cardiac stress (cardiac-stress condition, effective G ≥ 2.5): after 10 minutes, heart health −(0.1 + 0.02·(min−10)) per minute (394–404).
- Heart recovery: +0.15/min when there is no cardiac stress, not critical and not festering; only +0.01/min while a high-dose crash hangover lasts (357–359).
- The band from 2.5 to 8 G is flat: unsecured 3 G and 5 G give identical outcomes. I measured death at about 106 minutes for both, and 78 minutes at 9 G (table in §2.11).

### 2.5 Juice (crew.js:207–285)

- **Who gets it:** only someone in a *secure seat* (couch, helm, ops, weapons, engineering station, autodoc), when G > 1.5 and med supplies > 0 (or already juiced).
- **Protection:** standard dose: effective G = G/3 ("3 G feels like 1 G"). High dose, when G > `HIGH_DOSE_G` = 6 or already on high: G/4.5 ("6 G feels like 2 G, 10 G like 2.2 G"). Secured but not dosing (G ≤ 1.5): G × 0.7 (couch gel alone). Unsecured: full G.
- **Cost in med units:** a standard dose costs 1. A high dose costs 2 (or +1 to top up from standard), plus 1 booster per 24 h (`HIGH_DOSE_BOOSTER_MIN = 1440`) on the high dose.
- **Lingering:** the drug covers 60 minutes after the last dose (`JUICE_LINGER_MIN`), so a flip or a lull between burns costs no new dose. `juiceLapsed` when `juiceIdleMin ≥ 60`. Then `endJuice`.
- **Hangover length (`endJuice`, 265–285):**
  - standard: `4320 × min(max(peakG,1.5)/5, 1)` minutes, i.e. 21.6 h at 1.5 G, 43 h at 3 G, 72 h at ≥ 5 G peak;
  - high (a "crash"): `4320 × min(max(peakG,1.5)/5, 2) + 1.5 × minutes on high dose`, capped at `HANGOVER_MAX_MIN = 14400` (10 days). Also: heart stress +40, heart health −15, moraleMod −10. Measured: 7 G for 6 h gives 110 h; 10 G for 2 h gives 147 h; 10 G for 24 h gives 180 h.
- **Risks:** on the high dose, a stroke chance per minute of `STROKE_RISK·(G−6)` with `STROKE_RISK = 0.0006` (about 13%/h at 10 G). A stroke costs head −8…−18 and consciousness −20. While hungover, under effective G ≥ 1.5, a brain bleed chance per minute of 0.003 (0.006 in a crash) costs head −3 and consciousness −5 (368–376).
- **Effects while hungover:** work efficiency ×0.85 (crash ×0.6). Morale target −5 (crash −15). Rest and shore leave don't shorten it; a hospital clears it (`hospitalCure`). NPC crews pay strokes too (`agents.js` imports `STROKE_RISK`, `SUSTAIN_G = HIGH_DOSE_G`).
- **Vitals (406–412):** `bpm = min(215, 72 + stress·1.2 + max(0,G−1)·5 + juice·30)`, `sys = min(240, 120 + stress·0.6 + (G−1)·12 + juice·22)`, `dia = min(150, 80 + stress·0.3 + (G−1)·6 + juice·12)`, with juice = 0/1/2 (none/standard/high). Juice is "a stimulant cocktail: the couch spares the body, not the pulse".

### 2.6 Death spiral and first aid

- When heart health reaches 0 or the person is critical: `critical`, `deathTimer = 5 + U·35` minutes, consciousness 10. Death when the timer runs out (308–319).
- **First aid** (`stepRescue`, crew-ai.js:1180–1225): the rescuer runs (×2.5) to the patient, then stabilizes for `max(2, 8 − floor(medical/20))` minutes. CPR holds `deathTimer ≥ 2` meanwhile. `stabilize()` (451–458) removes critical, sets heart ≥ 15 and stress ≤ 50. Then the rescuer carries the patient to the autodoc at half walking speed and seats them; if it's occupied the patient waits beside it.
- **Internal bleeding:** torso −0.5/min until treated; death at torso 0 (378–382).
- **Brain damage:** head reaching 0 sets brain-damage and caps consciousness at 50. It never heals aboard.
- **Consciousness per minute:** −2 if head < 20, −3 if torso < 15, −1.5 at effective G ≥ 2.5; otherwise +0.5 (386–392).

### 2.7 Impact trauma (`applyImpact(m, speed m/s)`, crew.js:493–521)

| Speed (m/s) | Severity | Torso loss (×0.8–1.2) | Head factor | Limb factor | KO (consciousness −) | Heart stress | Extra |
|---|---|---|---|---|---|---|---|
| < 1 | none | | | | | | |
| 1–3 | bruise | 3 + (v−1)·2.5 | 0.3 | 0.5 | 0 | 0 | |
| 3–5 | hard-impact | 10 + (v−3)·5 | 0.6 | 0.6 | 15 | 0 | 30% fracture |
| 5–8 | bone-breaking | 20 + (v−5)·6.7 | 0.7 | 0.65 | 30 | +10 | fracture |
| 8–12 | crushing | 40 + (v−8)·6.25 | 0.7 | 0.6 | 60 | +25 | fracture, internal bleeding, deep trauma |
| 12–18 | lethal | 60 + (v−12)·5 | 0.85 | 0.55 | 90 | +50 | + brain damage if head < 20 |
| ≥ 18 | fatal | | | | | | killed |

Head loss = torso·headF·r and each limb = torso·limbF·r. This one function is the damage currency for everything: being thrown in a maneuver (§8), hull hits (`damage.js:209–216`: `applyImpact(m, 2 + local/7)` with chance `min(0.9, local/90)` for everyone on the hit deck), boarding gunfire (`applyImpact(m, 2.5 + U·9)`), and a wreck shifting during salvage (`applyImpact(m, 8…25)`). Measured with seed 3: 4 m/s left health 90; 6 m/s health 81 plus a fracture; 9 m/s health 67, consciousness 40, internal bleeding and deep trauma; 13 m/s health 53, unconscious.

**For OLYMPUS this is too coarse for gunfire.** There is no hit location, no penetration or armour, and no wound list. It is fine for falls and being thrown about; the speed bands match real blunt-trauma intuition reasonably.

### 2.8 Wounds the ship can't mend, burns, healing (crew.js:153–191, 341–353, 460–489)

- **Burns** (`m.burns`, 0–100). Fire adds `BURN_PER_MIN = 4 × intensity` to anyone unsuited when intensity > 0.3 (fire.js:45, 100). `SEVERE_BURN = 35`: past it, "severe-burns" (grafts needed).
- **Lasting wounds** are severe burns or deep trauma. Unheld, they fester: heart −0.03/min (`FESTER_PER_MIN`, about two days to death). The autodoc stabilizes them (`m.stabilized`) and brings the body back only to `WOUND_CAP = 70`, leaving the patient on light duty until a hospital. Brain damage works the same way, without the worsening.
- **Natural mending**, below 1.5 effective G with no internal bleeding: torso +0.01/min, limbs +0.02/min, head +0.01/min (not with brain damage), light burns −0.01/min. Bodies never mend past `woundCap`.
- **Autodoc (`medbayTick`):** rate `k = (supplied ? 1 : 0.3) × rate`, where rate = autodoc perf (1 / 0.5 / 0.15) × 1.5 with a medic on the medbay watch. Per minute: head +0.3k, torso +0.25k, arms +0.4k, legs +0.35k, heart +0.2k, burns −0.25k (floor 35 if severe), stress −1, consciousness +0.8. It also stabilizes and stops internal bleeding. Supplies: `MEDBAY_SUPPLY_PER_MIN = 1/240` units (6 units/day). Done when every part is ≥ cap − 0.5 and heart ≥ 99.5; that clears fracture and sets stabilized for lasting wounds. A light burn of 15 heals in about an hour.
- **Hospitals** (`hospital.js:29–65`). A **clinic** (Pallas, Vesta, Hygiea, Ganymede, a command ship) handles burns, trauma and what an autodoc could. A **full** hospital (Ceres, Tycho, Luna, Phobos; on the ground: Earth, Mars, Luna) handles the brain too. Stay: at least 1 day; 3 days + 0.2/point past 35 for a severe burn; 5 days for deep trauma; 14 for neural surgery; the longest of what applies. Bill: 150 + 6/point of harm (`harmOf = (100−health) + 0.5·(100−heart)`) + 15/point of burn + 900 for trauma + 2,500 for neural. Under 10 harm points (`WORTH_HARM`), the autodoc will do. The patient is "away" for the stay, and the ship can't leave without them.

### 2.9 Mobility (crew.js:193–205)

`mobility(m, g)`: 0 if unconscious. In micro-G it is 0.6 (hand over hand), or 0.3 with both legs at 0. Otherwise 0 with no legs; g < 0.3: 0.6 + (g/0.3)·0.4; 0.3–1.0: 1; 1–2.5: max(0.2, 1−(g−1)/1.5); ≥ 2.5: 0. The result is multiplied by `0.3 + 0.7·(mean leg health)`. Walking is `WALK_TILES_PER_MIN = 0.8` × mobility; `RUN = 2.5` for emergencies; `CRAWL = 0.15` is the minimum speed when dragging oneself to a seat under G (crew-ai.js:36–38). **A suit has no mobility penalty in longhaul.**

### 2.10 Starvation and dehydration (needs.js:72–84)

- `hunger` counts minutes at food need 0. Past 4,320 (3 days): "starving", torso −0.01/min.
- `thirst` counts minutes the *ship* has no water; there is no personal drinking. Past 1,440 (1 day): "dehydrated", consciousness −0.05/min, head −0.02/min. Past 4,320, heart −0.1/min.

### 2.11 Measured outcomes (scratch run of the real functions, seed 7)

| Exposure | Result |
|---|---|
| Unsecured 2 G, 120 min | alive, health 99, cardiac-stress from min 33, bpm 197 |
| Unsecured 3 G (or 5 G) | injured at min 50, unconscious at 59, critical at 91, dead at 106 |
| Unsecured 9 G | injured at 12, unconscious at 41, brain damage at 49, critical at 52, dead at 78 |
| Couch 3 G, 10 h | unharmed, 1 med unit, hangover 43 h |
| Couch 5 G, 24 h | health 82 (legs worn in the strain band), hangover 72 h |
| Couch 7 G, 6 h | health 96, heart 85 (crash), hangover 110 h |
| Couch 10 G, 2 h / 24 h | heart 85; hangover 147 h / 180 h; health 95 / 65 |

### 2.12 What the body model lacks (for OLYMPUS to add)

None of these exist in longhaul. I checked with grep across `js/sim`.
- **Temperature** (compartment or body), hypothermia or hyperthermia, sweating.
- **Partial pressures.** Hypoxia is keyed to O₂ *percent*, so 21% at 30 kPa reads "fine" for oxygen and only the separate decompression rule catches it.
- **G-LOC by axis and duration.** There is no grey-out or blackout, and no difference between eyeballs-down (standing on a deck under thrust) and eyeballs-in (lying in a couch).
- **Microgravity or low-G deconditioning** (bone, muscle, fluid shift). The exercise rig only restores "fun".
- **Fitness, strength, encumbrance, stamina.**
- **Bladder and bowel, personal water intake, calories.**
- **Pain, shock, blood volume, per-wound bleeding, infection.**
- **Radiation dose.** `bodyfacts.js` mentions Jupiter's belts "kill an unshielded crew in hours near Io", but nothing models it.
- **Sleep debt beyond the rest need; circadian or sol drift.**
- **Ebullism and fast decompression** (seconds).
- **Suit mobility penalty, suit integrity or punctures, CO₂ inside the suit, suit power or heat.**

---

## 3. Needs, morale and work (`js/sim/needs.js`)

**Needs (0 desperate … 100 met):** rest, food, hygiene, fun (recreation). Starting values: rest 80, food 70, hygiene 80, fun 75.

| Need | Awake decay | Modifiers | Asleep | Restored by |
|---|---|---|---|---|
| rest | −100/24 h (−4.17/h) | ×1.5 at G > 1.5; ×1.15 on duty | bunk +100/7.5 h (+13.3/h); couch +100/12 h | sleeping (bunk is a restraint, not a secure seat) |
| food | −100/10 h | | ×0.4 | meal: 20 min, +5/min then set to 100; couch feed line +1/min when < 35 under burn (0.5 ration per 100 points) |
| hygiene | −100/36 h | ×1.5 at G > 1.5 | ×0.5 | the head: 12 min, set to 100, 12 L of water |
| fun | −100/24 h | ×1.6 strapped in at G > 1.5 ("days in a couch wear on everyone") | none | rec rig 35–55 min at +1.5/min; mess table 30–50 min at +0.6 + 0.3·company/min; meals +0.15·company/min and the service bonus |

- **Seek thresholds** (`SEEK`, needs.js:20): rest 0 (sleep is scheduled), food 40, hygiene 45, fun 55. **Urgent:** rest < 8, food < 15. **Meal break on watch:** food < 35 (`MEAL_BREAK`). "Supper before turning in": in the last 120 minutes of the free block with food < 70, they eat (crew-ai.js:837).
- "Sixteen hours awake leaves you around 30" rest (doc and constants agree: 100 − 8·4.17·1.15 − 8·4.17 ≈ 28).
- **Morale target** (`moraleTarget`, 92–101): `22 + 0.75·mean(needs) − 5 per need under 15 − 8 if injured − 5 for a hangover (−15 for a crash) + moraleMod + careerMood`, clamped 0–100. Morale drifts toward it at 0.004 per minute (≈ 4 h time constant). `moraleMod` (events) fades with a ~2-day time constant (`MOD_FADE = 1 − 1/2880`).
- **Event mods:** a death aboard −25 to everyone (`mourn`); natural death −20; promotion +12; birthday +4; short pay −6; asked to stay past retirement −8; leave +8 at a station, +15 on a world's ground, +20 at home, +6 for a day ashore on an errand; hot meal +1.5 (+1 more with a real Cook); self-serve 0; cold rations −3; high-dose crash −10.
- **`moraleFactor`** (107–111): 1 from 55 to 75; above 75 rising to 1.08 at 100; below 55 falling as 0.55 + 0.45·m/55 (0.55 at 0).
- **`efficiency`** (117–127) = moraleFactor × (rest < 30: 0.55 + 0.45·rest/30) × (food < 15: 0.85) × (hangover 0.85 / crash 0.6) × (health < 70: 0.5 + 0.5·h/70), clamped 0.2–1.08. It scales work progress per minute, the firefighting knock-back, hand-flying error and boarding strength.
- **Practice** (140–144): skill += 0.0006·minutes·(1 − skill/110), and xp += minutes/60. Watchstanding practises at 0.3×; the helm while the autopilot flies at 2×.

---

## 4. Atmosphere and suits (`js/sim/life-support.js`)

### 4.1 Model

Each deck is one compartment with `atmosphere = { pressure kPa, o2Pct, n2Pct, co2Pct, volume m³, breached, vented, fire }`. Volume = interior tiles × `TILE_VOLUME = 6.5 m³`. The comment reads "0.9 m × 0.9 m section × ~8 m of hull depth", which conflicts with the room cameras' "a tile is about 1.5 m"; see §9.6. One plant serves all decks through ducting, at `eff = systemPerf('lifeSupport')` (1 / 0.5 / 0).

Constants (life-support.js:16–38): `EARTH_PRESSURE = 101.3` kPa, targets O₂ 20.9%, N₂ 78.1%, CO₂ 0.04%. Per person per minute O₂ use is 0.000583 kg (0.84 kg/day, realistic) and CO₂ output 0.000694 kg. `SCRUB_RATE = 0.008` %/min, `INJECT_RATE = 0.05` %/min, `TANK_KG_PER_PCT_M3 = 0.0012`, `BREACH_RATE = 0.20`/min, `VENT_RATE = 0.10`/min, `EXCHANGE = 0.08`/min, `PRESSURE_DOOR_KPA = 15`, `SUIT_O2_HOURS = 48`, `COUCH_AIR_MIN = 120`.

### 4.2 Per-minute algorithm (`lifeSupportTick`, 72–180)

1. Count breathers per deck: alive, not suited, not away.
2. For each deck:
   - breached: pressure ×0.8 (→ 0 below 0.1 kPa); vented: pressure ×0.9 (→ 0 below 0.5).
   - If sealed, the plant is up and the tanks hold O₂ and N₂: repressurize by up to 0.5·eff kPa/min, resetting the mix to targets if pressure was < 1. The mass used is `add/101.3 × 1.225 kg/m³ × volume`, split 21/79 O₂/N₂ from the tanks. A deck at 0 kPa refills at 0.5 kPa/min, about 3.4 h.
   - Below 1 kPa, skip breathing.
   - Breathing: `airKg = 1.225·(P/101.3)·V`; O₂% −= 0.000583·n/airKg·100; CO₂% += 0.000694·n/airKg·100. These are mass fractions treated as percent, an approximation.
   - If sealed and eff > 0: scrub CO₂ by 0.008·eff %/min toward 0.04; inject O₂ and N₂ by up to 0.05·eff %/min toward target, debiting the tanks.
3. **Exchange through ladder shafts:** for each connected pair, skip if either side is breached or vented, or if |ΔP| > 15 kPa (the pressure doors shut and stay shut until the pressures match). Otherwise every field moves 8%/min of the difference toward the other deck.
4. **Effects on crew:**
   - Suited: suit O₂ −1/60 h per minute. At 0 the suit *comes off* (`wearing=false`, event `suit-depleted`); this is an odd simplification. A suit stows itself once the deck is nominal, unless `keep` or the SUITS order applies.
   - Unsuited in a secure seat with bad air: the couch's emergency hood drops and buys `couchAir` minutes (120 max, recharging +0.5/min in good air).
   - Otherwise `breathe()`.
5. Display: `oxygenHours = o2Tank / (O2_PER_MIN·60·living)`. 500 kg is about 99 days for 6 crew.

### 4.3 Breathing effects per minute (`breathe`, 184–215; thresholds `ATMO`, 34–38)

| Gas | Band | Per minute |
|---|---|---|
| O₂ % | < 16 hypoxic | consciousness −0.3 |
| | < 10 | consciousness −2 |
| | < 6 | consciousness −5, heart −0.5 |
| CO₂ % | > 2 hypercapnia | consciousness −0.3, morale −0.5 |
| | > 3 | consciousness −1, morale −1, heart −0.1 |
| | > 5 | consciousness −3, heart −0.2, morale −1.5, head −0.2 |
| | > 8 | consciousness −6, heart −1, head −0.5, torso −0.3 |
| Pressure kPa | < 63 decompression | consciousness −0.5 |
| | < 35 | consciousness −3 |
| | < 12 | consciousness −8, heart −2, torso −1, head −1 |

`atmoStatus` (58–67): fire > breached > vented > vacuum (< 12 kPa) > critical (< 35 kPa or O₂ < 10 or CO₂ > 5) > warning (< 63 kPa, O₂ < 16, CO₂ > 2) > nominal. Crew-AI "bad air" (crew-ai.js:551–556) means breached, vented, on fire, < 63 kPa, O₂ < 16 or CO₂ > 3.

### 4.4 Derived timings (computed; MCRN Tharsis corvette decks are about 21 tiles, 137 m³, 167 kg of air)

- CO₂ rises about 0.00042%/min per person. 4 people with no scrubbing reach 2% in ≈ 20 h (7.5 h on the 52 m³ reactor deck). One scrubber at full rate (0.008 %/min) keeps up with about 18 people on such a deck.
- **Breach** (×0.8/min): 63 kPa at 2.1 min, 35 kPa at 4.8, 25 kPa at 6.3 (fire out), 12 kPa at 9.6, 1 kPa at 20.7.
- **Vent** (×0.9/min): 63 kPa at 4.5 min, 35 at 10.1, 25 at 13.3, 12 at 20.2, 1 at 43.8.
- Vacuum exposure for an unsuited person (< 12 kPa): consciousness 100 → 10 in about 11 minutes. **This is unrealistically slow.** Real time of useful consciousness in vacuum is about 10–15 s, and death follows in 1–3 min; these are external physiology figures, not longhaul's. A foot soldier needs a seconds-scale model.

### 4.5 Suits, lockers, the SUITS order

- One suit per EVA locker fixture (`e` tiles). `lockers[id].hasSuit`. Restocked dockside (`restockSuits`).
- Donning takes 3 minutes at the locker (crew-ai.js:916; boarding 880). A suit holds 48 h of O₂ and blocks all atmosphere effects. Under fire, a suit takes 15% of body damage and no burns (fire.js:96–100).
- **The SUITS order** (`orderSuits`, life-support.js:253–258; key U in the UI) sends every hand to a locker and keeps the suit on whatever the job. Under 1.5 G they leave a couch to fetch one. With everyone suited, a deck can be vented or holed with its people on it. Lifting the order leaves suits on whoever is working a breach, a fire or a boarding (`needsSuitForTask`).
- **Bad-air reflex** (crew-ai.js:742–751): anyone unsuited on a bad-air deck abandons their task for the nearest locker with a suit, even mid-maneuver (crawling under G). Exceptions: being carried, carrying a patient, in the autodoc, strapped in with > 30 min of hood air while securing.
- **`reachable(m, deck)`** (559–565): unsuited people won't path through bad-air decks. They wait, or look for jobs elsewhere.
- **Breach job** (`breachJobs`, 227–233): one SEAL job per holed deck (CRITICAL, engineering 10, suit required). It takes `40 × max(0.6, 1.6 − eng/100)` minutes at the open floor nearest the outer hull, uses 0.5 parts (or "emergency sealant"), then the deck repressurizes. While any deck is breached, "damage control" caps the drive at 1 G so the crew can move (game.js:273–276).

### 4.6 Consumables (game.js:71–73, 110–123, 230–234)

- Starting stores (light freighter): O₂ tank 500 kg, N₂ 500 kg, water 4,200/5,000 L, food 1,800/2,000 rations, power 88/100%, med 50/50 units, parts 12/40, scrap 0/30, fuel 8,500/10,000 kg.
- Water: `WATER_PER_MIN = 0.004 L` per person (≈ 5.8 L/day drinking and galley), plus 12 L per shower. Net loss is `liters × (1 − recovery)`, with recovery 0.95 / 0.70 / 0 for the recycler at nominal / degraded / failed. With a working recycler, 6 crew lose under 1 L/day. With it failed, about 14 L/person/day, so 4,200 L lasts about 50 days.
- Food: a meal costs 0.5 ration, about 1–1.5 rations/day/person. Passengers draw 0.001 rations/min.
- Power (reactor.js:31–32): online, batteries regenerate 10%/h × the coolant factor; offline they drain 1%/h, about 100 h of batteries. Blackout comes when the reactor is offline with batteries at 0: sensors die, an SOS goes out, and the flight computer has a 50% chance of a minor fault on reboot. There is no per-system power budget.

---

## 5. Fire (`js/sim/fire.js`)

Constants `FIRE` (fire.js:30–39): `OUT_KPA = 25`, `OUT_O2 = 12`, `GROW = 0.08`/min, `O2_BURN = 0.5` %/min at full intensity on a 400 m³ reference deck, `SMOKE = 0.35` %/min of CO₂-equivalent, `REF_VOLUME = 400`, `SPREAD = 0.03`/min above 0.7, `FIGHT = 0.12`/min per firefighter at efficiency 1.

- **Ignite** (`ignite`, 47–55): only where P ≥ 25 kPa, O₂ ≥ 12% and the deck isn't vented. Intensity adds (default 0.15). Causes: a hit (chance `min(0.5, local/90)` per hit deck, intensity 0.1 + min(0.4, local/150): damage.js:201), a crash onto a rock ("impact").
- **Per minute** (74–113):
  - if P < 25 or O₂ < 12, the fire goes out (vented or starved);
  - grow by `0.08 × air × (1 − I/2)` with `air = min(1,P/101.3)·min(1,O₂/20.9)`;
  - with `k = 400/max(50,V)`, O₂ falls 0.5·I·k and CO₂ ("smoke") rises 0.35·I·k;
  - each machine on the deck has a 4%·I chance of damage, major if I > 0.6, integrity loss 12·I, cause 'fire' (counts as heavy damage);
  - everyone on the deck takes torso −1.5·I, arms −I (×0.15 suited) and burns +4·I if unsuited and I > 0.3;
  - above 0.7, a 3%/min chance to ignite an adjacent deck through the shaft if |ΔP| ≤ 15 (intensity 0.1);
  - one CRITICAL FIRE job per burning deck.
- **Firefighting job:** anyone (engineering ≥ 0), must suit up first. Stands at the floor tile nearest the deck centre; knocks back `0.12 × efficiency` per minute until out.
- **Burn-out times** (my run, no plant): a 130 m³ deck burns out in 12 min (CO₂-equivalent ≈ 7%), 200 m³ in 15, 400 m³ in 24. The doc says "about twenty minutes".
- A deck on fire is bad air: the unsuited leave for suits, and nobody goes there to eat. Crew run at 2.5× to fires, breaches and bad air.

---

## 6. Machinery the crew maintain (`systems.js`, `jobs.js`, `reactor.js`)

- **Twelve systems** (systems.js:54–181), each with `desc`, the `fixture` where it is worked, `wear` (integrity/day at idle), `mtbf` (days at 50% integrity), `load(ctx)` and `stress(ctx)` multipliers, effect text and fault strings:

  | System | Wear/day | MTBF (days) |
  |---|---|---|
  | flightComputer (helm) | 0.8 | 70 |
  | drive (engine) | 0.6 | 60; load 1 + 2g + 6·max(0,g−7) |
  | coolant (reactor) | 0.7 | 80 |
  | rcs (engStation) | 0.5 | 90 |
  | sensors (ops) | 0.5 | 110 |
  | comms (radio) | 0.5 | 120 |
  | lifeSupport | 0.9 | 90; load 1 + 0.1·breathers |
  | waterRecycler | 0.9 | 90 |
  | galley | 0.6 | 140 |
  | autodoc (medbay) | 0.4 | 160 |
  | pdc | 0.4 | 150 |
  | launcher | 0.3 | 180 |
- **Per minute** (304–344): integrity −= `wear × TECH.wear / 1440 × load`. Fault hazard per minute = `stress × (0.4 + 3·wornness²) / (mtbf × TECH.mtbf × 1440) × (0.6 if an engineer is on watch)`, with wornness = 1 − integrity/100. A fault is major with probability 0.25 + 0.5·wornness (−12 integrity, FAILED), else minor (−5, DEGRADED). A second fault on a sick machine is always major. Micrometeoroids strike once per 150 days on average (50% dodge with an ops watch): 35% chance of a breach, 70% chance a system takes 10–30 damage.
- **Status:** NOMINAL 1, DEGRADED/PATCHED/RIGGED 0.5, FAILED 0. `systemPerf` is 0 when disabled or in a blackout. Effect helpers: `driveLimitG` (degraded 3 G, coolant failed 0.3 G, hull sound < 50% → 3 G), `waterRecovery`, `autodocRate`, `sensorRangeFactor`, `slewFactor`.
- **Work time** (`workMinutes`, 377–389): base × TECH.repairTime × skillFactor (max(0.6, 1.6 − skill/100)) / max(0.25, eff).
  - Base: minor repair 50, major 150 (jury-rig ×0.6); maintenance max(20, (100 − integrity)·3); fabrication 240; hull patch 300 × size (S 0.6, M 1, L 1.6, XL 2.5); heavy damage's long job 480 + 20/point lost.
  - Repair success chance `min(0.97, 0.55 + 0.005·skill)`.
  - Parts: minor 1, major 3 at TL2, ×TECH.parts; heavy ×2. With no parts, a jury-rig PATCHED holds `TECH.patchHours`.
  - Maintenance is scheduled below integrity 75 (`MAINTAIN_AT`) and costs 0.02 parts/point.
  - Scrap: 0.6 per part used; 1.5 scrap gives a part in 240 min at the workbench.
  - The hull can only be patched to halfway back to whole, 5% per job, never above 0.3 G or at battle stations.
- **Tech levels** (`ship-classes.js:70–86`):

  | | wear | mtbf | parts | repairTime | jury-rig hours | starting condition |
  |---|---|---|---|---|---|---|
  | TL1 Belt | 1.5 | 0.5 | 0.5 | 0.7 | 48–120 | 62–85 |
  | TL2 | 1 | 1 | 1 | 1 | 12–36 | 88–100 |
  | TL3 naval | 0.75 | 1.6 | 1.6 | 1.25 | 8–24 | |
  | TL4 MCRN | 0.55 | 2.4 | 2.4 | 1.5 | 4–12 | 95–100 |

  Martian kit is reliable, expensive to fix, and its jury-rigs don't last. This is the user's setting flavour, and a good fit for OLYMPUS's Martian gear including weapons.
- **Job board** (`jobs.js`): types RESCUE (medical 20), REPAIR/PATCH/MAINTAIN (eng 15), FABRICATE (eng 25), REACTOR (eng 15), HELM (piloting 15), SEAL (eng 10, suit), FIRE (eng 0, suit). Priorities CRITICAL 0, HIGH 1, NORMAL 2. The list is sorted by priority then id; `closeJob` clears assignees. It is 62 lines, pure and generic.
- **Reactor** (`reactor.js`): shutdown takes 720 min of hands-on work plus a 60-min countdown; startup 300 min (≥ 2 kg fuel); a containment patch 60 min. A containment failure (overdrive past rating: chance `0.00012·(G−rated)²`/min; hits on the reactor deck) gives 90 min to scram (an engineer physically at the reactor) before it goes supercritical and the ship is lost. Emergency shutoff dumps fuel to 10 kg after 60 min; immediate shutoff dumps it all.

---

## 7. Watches and schedules (`js/sim/duty.js`)

- **Three 8-hour watches**, `SHIFTS` starting at 00:00, 08:00, 16:00. Each person has `{ station, shift }`. `scheduleBlock` (70–74): relative to their watch start, 0–480 min is **duty** (or free if station 'none'), 480–960 is **free**, 960–1440 is **sleep**. "Eight on, eight off, eight asleep; bunks are shared between watches" (one rack per two crew).
- **Stations** (duty.js:9–38):

  | Station | Fixture | Seat? | Effect when manned |
  |---|---|---|---|
  | helm | helm | yes | takes over if the flight computer fails |
  | ops | ops | yes | ×2 contact tracking, longer reach, 50% meteoroid dodge |
  | weapons | weapons | yes | PDCs laid by hand |
  | engineering | engStation | yes | faults ×0.6 (−40%), maintenance rounds |
  | workshop | workbench | no | repairs, fabrication |
  | medbay | medbay | no | autodoc ×1.5 |
  | galley | galley | no | hot meals |
- **Default duty** (49–53): Captain helm/2, Pilot helm/1, Engineer engineering/1, Medic medbay/1, Gunner ops/0, Mechanic workshop/2, Scientist ops/2, Cook galley/1, Security weapons/0, Deckhand workshop/0.
- **The day is hard-coded to 1,440 minutes** (`minuteOfDay`, 61–64). OLYMPUS needs the Mars sol (24 h 39 m 35 s ≈ 1,479.6 min) for surface and Martian-garrison life. Ship time aboard could stay on a 24 h "ship's clock" or follow Mars Coordinated Time; this needs a decision.

---

## 8. Under thrust: securing, inertia, the flip (`autopilot.js`, `inertia.js`, `game.js`)

- **Crew policy 'secure'** (`crewPolicy`, autopilot.js:620–648) applies when any of these hold:
  - battle stations;
  - thrust > 1.5 G (or a hold burn, or the manual throttle, > 1.5);
  - the autopilot is in 'prepare' or a turn is held;
  - a stance is moving;
  - a burn or brake > 1.5 G;
  - a flip or orientation turn, or a flip within 30 min;
  - the first 10 min after ignition;
  - the last hour of an approach (`ENDGAME_S`).

  After the last trigger it lingers 10 min.
- **Standing order** (game.js:283–284): the autopilot won't push past 1.5 G while anyone is out of a secure seat, unless the captain overrides.
- **Flip interlock** (autopilot.js:134–155): a flip is held while anyone is unsecured, up to `TURN_HOLD_MAX_MIN = 30`, and never when the ground is less than 10 min away on the coast. The captain can EXECUTE (forceTurn).
- **Securing behaviour** (crew-ai.js:774–797):
  - the pilot takes the helm;
  - at battle stations the best security takes weapons, the best engineer engStation, the next best security ops (`battleSeat`);
  - everyone else goes to a couch by `planCouches` (§10.4);
  - when couches run out, station seats count as couches;
  - below 1.5 G, critical jobs (rescues, damage control) continue until a turn is held, then those workers strap in and return to the job after.
- **Inertial events** (`inertia.js`). Triggers (game.js:396–400):
  - drive lit (prev < 0.05 G → ≥ 0.05): push +y, a = ΔG·g₀ for 0.8 s;
  - cut: −y, 0.3·ΔG·g₀ for 0.8 s;
  - change > 0.5 G: ±y, ΔG·g₀;
  - flip (rotation > `FLIP_TURN = 2.4` rad from rest): 0.4 G in a random direction for 3 s.

  Who is thrown: anyone aboard not in a restraint (secure seat or bunk) and not being carried. Conscious crew brace for an announced burn of ΔG ≤ 1.5 (`BRACE_G`) and for a surprise of ≤ 0.5 G (`SURPRISE_G`). The physics runs in real time at 120 Hz (`STEP = 1/120`), tile = `TILE_M = 0.9` m, friction decay 4/s on deck under G and 0.4/s in micro-G. On contact with a BLOCKING tile the hit speed goes to `applyImpact`. Afterwards the body snaps to the grid, steps off furniture, abandons its task and pauses 1 min. There is a 12 s safety valve.
- **Semantic problem to avoid in OLYMPUS.** Inertia slides bodies along the deck's +y axis (toward the next deck sternward on the strip). The room cameras, though, read the same grid as a *floor plan* whose ladder climbs "up" toward the bow (roomcam.js header: "forward is up in a ship under thrust"). In a real tower ship, lighting the drive presses people *into the floor* (or drops floaters onto it), and does not slide them across it. OLYMPUS should do it properly:
  - drive start drops floating bodies and objects to the deck, with impact speed √(2·a·h) for height h (external physics: 1 m at 3 G gives about 7.7 m/s, "bone-breaking");
  - a cut leaves everyone floating with their last velocity;
  - lateral sliding comes only from RCS translation, a flip's rotation (centripetal and Euler forces at a radius from the centre of mass) or impacts.

---

## 9. Interiors: how decks are generated (`ship-layout.js`, `tiles.js`, `hulls.js`)

### 9.1 Tiles (`tiles.js`)

There are 33 tile types: EMPTY, HULL_WALL, INTERIOR_WALL, FLOOR, DOOR, LADDER, CONSOLE, BUNK, TABLE, ENGINE, REACTOR, STORAGE, LIFE_SUPPORT, AIRLOCK, MEDBAY, NAV_CONSOLE (helm), CRASH_COUCH, TERMINAL, EVA_LOCKER, RADIO, TRANSPONDER, GALLEY, HEAD, WATER_RECYCLER, WORKBENCH, OPS_CONSOLE, ENG_CONSOLE, REC, PDC_MOUNT, TORPEDO_LAUNCHER, WEAPONS_CONSOLE, PAX_BERTH, CARGO_DOOR. Each has a name, a library description and a structural mass in kg (hull wall 800, floor 150, reactor 4,500, launcher 2,600, PDC 1,400, …).

Sets: `WALKABLE` = floor, door, ladder, medbay (the autodoc bed can be lain on). `BLOCKING` (for thrown bodies) = hull wall, interior wall, engine, reactor, PDC, cargo door. `isInterior` = pressurized volume (everything but empty, walls, PDC wells, cargo door).

### 9.2 Deck templates (ship-layout.js:51–76; legend 36–42)

Legend: `#` hull, `.` floor, `|` ladder, `+` door, `c` couch, `e` EVA locker, `b` bunk, `t` table, `s` storage, `p` passenger berth, `R` radio, `O` ops, `H` helm, `W` weapons console, `X` transponder, `h` head, `g` galley, `r` rec rig, `M` autodoc, `L` life support, `w` water recycler, `B` workbench, `A` possible airlock, `C` possible cargo door, `E` engineering console, `D` drive, `P` PDC well, `T` torpedo launcher, `N` reactor, `^` nose airlock.

Width 7 (small craft) or 9; 3–4 rows each. 9-wide set:

```
command     ' ###^### ' '#ROH.WcX#' 'A.......#' '#ec.|.ce#'
quarters    '#bb.|.bb#' '#.......#' '#hc.|.ce#'
quarters-6  '#bbb|bbb#' '#.......#' '#he.|.ce#'
crew-mess   '#bb.|.gt#' '#.......#' '#hM.|.cr#'
passengers  '#pp.|.pp#' '#.......#' '#h..|..e#'
passengers-8'#ppp|ppp#' '#.......#' '#pph|.pe#'
brig        '#ppp|ppp#' '#+.....+#' '#e..|..e#'
mess        '#g.t|t.r#' '#.......#' '#ec.|.cM#'
utility     '#L..|..w#' 'A.......#' '#Bc.|.ce#'
cargo       '#Ts.|.ss#' 'A.......C' '#ee.|.ss#'
cargo-tall  '#Ts.|.ss#' '#.......#' 'A.......C' '#ss.|.ss#'
engineering '#E.c|c.e#' 'P.......P' '#eD.|.D.#'
reactor     ' ##.|.## ' ' #e.N.e# ' '  #####  '
```

### 9.3 Deck programs (`program(c)`, 109–139)

Any class with `crew[0] ≤ 8`, size S or M, and not carried gets an interior: 23 classes (prospectors, couriers, shuttles, light freighters, cutters, corvettes, a gunship, raiders). **Frigates and larger have no interior.** Decks are added bow to stern:

1. bridge (`command`), with a nose port where the kind has one: courier/raider S, light-freighter/gunship M, cutter/corvette M "Boarding collar";
2. quarters (small: `quarters`; shuttle: `crew-mess`; else `quarters-6` if more than 4 bunks);
3. mess (not on small craft or shuttles);
4. utility (with a flank S port on small craft);
5. brig (cutters, and any class with `brig`);
6. passengers (by `berths`: one or two decks, cutters excepted);
7. cargo (flank crew port by kind; the shuttle's L hold port; cargo door on y+);
8. cargo2 (gunship);
9. engineering;
10. reactor.

**Fitting** (`createLayout`, 176–220):
- `^`/`A`/`C` become airlocks or cargo doors only where the program puts ports; otherwise hull wall.
- `P` becomes a PDC well only if the class has PDCs. `T` becomes a launcher if it has tubes, else storage. `W` becomes a weapons console if armed, else a couch.
- Passenger berths are trimmed to `berths`, brig cells to `brig`, bunks to `max(2, ceil(maxCrew/2))`; the surplus becomes storage.
- Couches are added (one for every hand but the pilot) by converting storage, crew decks first, then command, cargo, machinery (`COUCH_ROOM`).

"Passengers live aft of the crew's decks, forward of the hold: the crew's walk from the mess to the bridge never goes through the passenger decks."

Rendered from the real code, the MCRN **Tharsis-class corvette** (`mcrn-corvette`, 46 m, crew 6–12, TL4) has 8 decks:

```
Bridge (nose M "Boarding collar")   ###A###  /#ROH.WcX#/#.......#/#ec.|.ce#
Quarters                            #bbb|bbb#/#.......#/#he.|.ce#
Mess                                #g.t|t.r#/#.......#/#ec.|.cM#
Utility                             #L..|..w#/#.......#/#Bc.|.ce#
Brig                                #ppp|ppp#/#+.....+#/#e..|..e#
Cargo (flank M crew collar)         #Tc.|.ss#/A.......C/#ee.|.ss#
Engine                              #E.c|c.e#/P.......P/#eD.|.D.#
Reactor                              ##.|.## / #e.N.e# /  #####
```

Each deck is 21–22 interior tiles (≈ 137–143 m³ by `TILE_VOLUME`). Hull fractions bow→stern: bridge 0–0.113, quarters 0.141–0.225, …, reactor 0.816–0.9; the drive bell takes the last 10% (`TOWER_FRAC = 0.9`). The Martian `arsia` survey skiff (30 m, TL3) has 6 decks on the 7-wide set.

### 9.4 Exterior and interior from one program (`hulls.js`)

Hull frame: x along the thrust axis (bow +x), y starboard, z dorsal. Parts are box, cyl, bell and ring, each with a role. "A torch ship is a tower: its decks are floors when the drive is lit" (hulls.js:6–7). For interior classes, `tower()` (hulls.js:~292–306) builds one box per deck at the deck program's bow fractions and widths and puts each port on its deck's box (`deck: s.id`), so a collar on the outside opens onto the airlock tile inside (`airlockFor(ship, portId)`, ship-layout.js:512–525: the nose airlock is the hatch in row 0; flank collars are cut in the side walls). The liner has a spin ring (`ring(f, r, w, d, n)`), but no interior class has one, and **no interior anywhere models spin gravity**.

### 9.5 Geometry and pathing (`buildGeometry`, 412–487; cached in a WeakMap on the decks array)

- Ship coordinates: x is the tile column; y is the tile row counted from the bow across all decks, with `DECK_GAP = 1` row between decks. `deckStart[]`, `deckOfRow(sy)`.
- Nodes are walkable tiles, linked 4-neighbour at cost 1. **Shafts:** where a deck's last row and the next deck's first row both have a LADDER in the same column, they link at cost 1 + gap. There is one central shaft.
- **Fixtures**: every tile whose type has a `FIXTURE_KIND` (490–500) gets `{kind, deck, x, y, sx, sy, access, id: 'kind:deck:x:y'}`. Access is the tile where a person stands to use it: the fixture itself if walkable, else `accessFrom` (front first for galley, table and rec), else the first floor tile E/W/S/N, else a door or ladder.
- **Facing** (`fixtureFacing`, 284–289): toward open floor, back to a wall.
- **Seats** (247–253): `SEAT_KINDS` couch, helm, ops, weapons, engStation, medbay, bunk, head, rec, paxBerth. `SECURE_SEATS` (protect under G, give juice) are couch, helm, ops, weapons, engStation, medbay. `RESTRAINTS` (protect from being thrown) are the secure seats plus bunk.
- **Pathing:** Dijkstra trees are cached per source node (`treeFrom`, 544–564; an O(n²) array scan, fine at ~200 nodes), so path lookups are O(length). `findPath` inserts a mid-gap waypoint when changing decks. `walkDistance`, `nearestNode` (+100 penalty off-deck).
- **Places at furniture:**
  - `tableSpots` (382–394): two front stools at ±0.24 along and 0.48 out; an end stool at 0.62 along where that end opens onto floor nobody uses furniture from; standing spots at the back if there is floor behind; leaning spots at the front corners. Past those, a golden-angle spiral of standing places in front.
  - `counterSpots` (341–364): two side by side at the galley (0.78 out, ±0.24 along), then a waiting queue two per tile on the open floor nearest it, avoiding tiles holding table places, with table fronts last.
  - All are cached on the fixture (`f.$spots`).

### 9.6 Scale inconsistencies to fix in OLYMPUS

The tile is 0.9 m in `inertia.js`, 0.9 m × 0.9 m × 8 m depth in `life-support.js`, and "about 1.5 m" in `roomcam.js`, which also has a person about 1.15 tiles tall and a fixed deckhead `CEIL`. Deck rows also do double duty as floor-plan depth and deck height in the hull tower (`deckSpans` uses row counts for the bow fractions). OLYMPUS should fix one metric scale for pixel art (for example 1 tile = 0.5 m or 1 m) and give each deck an explicit height (≈ 2.5–3 m deck-to-deck) separate from its floor plan.

### 9.7 How the room cameras read "down" (`ui/roomcam.js` header)

There is one fixed camera per deck, high on the after bulkhead, looking forward and down. Grid columns run across the picture and rows run away from the camera (row 0 is the far, bow-side wall). A ladder in the far row climbs to a hatch in the deckhead; one in the near row drops through a well in the plating. So longhaul's *art* already treats each deck as a floor perpendicular to the thrust with the bow overhead, while the *sim's* coordinates are a 2D strip. OLYMPUS's top-down view under thrust is the camera looking sternward from the deckhead onto a floor plan, with ladders and lifts as hatches between z-levels. This matches longhaul's cameras, not its strip coordinates.

---

## 10. Crew behaviour (`js/sim/crew-ai.js`)

### 10.1 Priority ladder (`taskLevel`, 228–243)

A task is replaced only by one of higher priority (a lower number).

| Level | Task types |
|---|---|
| 0 | carried |
| 1 | secure |
| 2 | suit (bad air) |
| 3 | rescue, helm, board; work/reactor at CRITICAL |
| 4 | work/reactor at HIGH |
| 5 | heal (own injuries → autodoc) |
| 6 | sleep (exhausted), eat (urgent) |
| 7 | work at NORMAL (routine) |
| 8 | watch, sleep (scheduled) |
| 9 | eat, wash, leisure |
| 10 | patrol / idle |

### 10.2 `decide()` flow per minute (731–845)

1. A seat with no task is vacated.
2. **Bad-air reflex** (§4.5).
3. **SUITS order**: suit up while G ≤ 1.5, if able, not in the middle of a suit, carry, heal, rescue, board or helm task.
4. **Boarding muster:** party members start `board`.
5. **Secure policy:**
   - a helm job when the flight computer is dead takes the best pilot;
   - a watchstander whose watch ends stays strapped in as 'secure';
   - at battle stations, already-secured people move to their battle seat while G ≤ 1.5;
   - below 1.5 G with no held turn, people on CRITICAL jobs keep working and others may pick up critical jobs;
   - otherwise `assignSecure` (pilot to helm, battle seat, planned couch, nearest couch, any station seat).
6. Policy lifted: leave the couch, pause 1–4 min.
7. Jobs from the board (`pickJobFor`).
8. Own injuries → `startHeal` (level 5).
9. Urgent needs: rest < 8 → exhausted sleep; food < 15 → urgent meal.
10. **Roster block:**
    - *duty*: meal break if food < 35, else go to the watch station (finish a meal or shower first); if the station is unreachable, patrol;
    - *sleep*: go to bed (a free bunk, else a couch) after finishing a meal or wash;
    - *free*: drop the watch; supper rule; pressing need (food, hygiene, fun in order of how far below threshold), else idle and patrol their home deck.

### 10.3 Job eligibility and scoring (332–384)

- **Eligibility:**
  - skill ≥ minimum, able, aboard;
  - not their own rescue;
  - a named engineer if the job specifies one (reactor);
  - SEAL and FIRE need a suit on or one in a reachable locker;
  - the job's fixture must be reachable;
  - CRITICAL always; sleepers (not exhausted) and the helmsman refuse non-critical work; HIGH for anyone awake;
  - NORMAL only for the engineering or workshop watch on duty, or in free time if nobody covering routine work has the skill, the volunteer has no pressing need, rest > 40 and the job is > 60 min old.
- **Score:** rescue = −Manhattan distance to the patient. Others = skill − distance·0.5 (×1.5 for HELM).
- **Deferral:** a candidate skips a job if another eligible crew member, whose current task is lower priority than the job, scores more than 0.5 higher. The board is walked in priority order and stops once job level ≥ my level.

### 10.4 Couch planning (`planCouches`, 502–547): assigning couches to minimise the longest walk

The goal is "the ship is secure when the last one sits", so minimise the longest walk. The algorithm:
1. Take the able, aboard, not-secured crew, excluding the pilot (if the helm is free) and battle-seat holders.
2. Collect free couches with an access tile, excluding those claimed by others' seats or tasks.
3. Build the walk-distance matrix and sort the distinct finite lengths.
4. Binary-search the smallest length L such that a bipartite matching (Kuhn's augmenting paths) using only edges ≤ L seats min(crew, couches).
5. The plan is a first pick only; someone already walking keeps going. At most about a dozen people, so it is cheap.

This is pure, reusable and directly relevant to OLYMPUS (drop-ship couches, "secure for burn" drills).

### 10.5 Task execution details (863–1038)

- **Walking:** `walk(m, tiles)` along waypoints with a budget per minute. The renderer interpolates between `$px/$py` and `pos`.
- **suit**: walk to the locker, 3 min to don, then continue to the job that required it (`thenJob`).
- **eat** (`stepEat`, 1084–1137):
  1. walk to a counter place, moving up the queue as places free;
  2. prep time from `mealService` (1072–1082): galley failed gives cold rations (prep 2, fun −5, mood −3); a cook on watch gives a hot meal (prep 3, fun 18 +8 with a real Cook, mood 1.5 +1); self-serve prep 10 (18 degraded), fun 6, mood 0;
  3. book a table place and walk to it;
  4. eat for 20 min, consuming 0.5 ration on arrival, food +5/min plus company fun, then set to 100 with the service fun and mood added.

  No food left: 60 min pause and a 'crew-no-food' event.
- **wash**: walk to the head, queue (the head is a seat; give up after `WAIT_LIMIT = 30` min, pause 20–40), use it 12 min (`WASH_MINUTES`), hygiene 100, 12 L water.
- **leisure**: the rec rig (if free, alternating by `(id + floor(minute/97)) % 2`) for 35–55 min at +1.5 fun/min, or a table place for 30–50 min. Ends at fun ≥ 98.
- **sleep**: walk to the bunk; asleep until exhausted sleepers reach rest ≥ 60, or scheduled ones reach the end of the sleep block with rest ≥ 50 (or duty starts).
- **watch** (`stepWatch`): walk to the station; if the seat is taken, stand by beside it (`standby`); practise the station skill at 0.3×. Helm handover happens in the same minute when the relief arrives (generateJobs, 311–323).
- **heal**: go to the autodoc (one bed, `fixtures.medbay[0]`); queue beside it; `healStep` per minute.
- **rescue**: §2.6. **work**: §6. **reactor**: walk, then progress accrues only while physically there. **patrol**: a random walk on the home deck, pause 3–12 min. **carried**: inert.
- **Death** (`layOut`, 264–270): jobs return to the board, any carried patient is set down, the body leaves the seat.
- **`placeCrew`** (1284–1311): game start puts everyone on watch, in bunks or about their home deck, with rest by block (sleep 45, duty 85, free 60).
- **`watchState`** (1250–1260): who actually mans each station this minute, which feeds the station effects.

---

## 11. Boarding and EVA (`js/sim/boarding.js`)

Constants (76–90):
- `EVA_RANGE_M = 2000`, `EVA_SPEED_MS = 2` (suit thrusters);
- `COLLAR_MIN = 2`; `BREACH_EVA_MIN = 10`, `BREACH_COLLAR_MIN = 6`;
- muster limit 25 min (go with whoever is ready unless someone is still on the way), cap 90 min;
- actions: SEARCH 20, TAKE STORES 40, TAKE CARGO 40 (repeat; 30 t/h, `cargoMinutes = max(10, round(t·2))`), TAKE PRISONERS 15, SCUTTLE 10 (reactor goes in `SCUTTLE_FUSE_MIN = 120`), SALVAGE 45 (repeat; the wreck keeps 0.55 per run), CRACK ACCOUNTS 30 (success 25% + eng/150, max 90%).

- **Boardable** (98–110): ships only ("Boarding a station is a marine operation: not yet"). Via the dock if mated, or EVA if within 2 km, Δv < 2 m/s and the target not thrusting. An EVA needs a suit for everyone.
- **Phases:** muster (crew-ai `board` task: nearest free suit, then the lock; the party leaves together) → cross (2 min, or distance/2 m/s) → breach (unless invited or struck) → fight (if defenders) → secured (orders) → return (needs a mated collar or EVA range) → done.
- **Away semantics:** `m.away = { op, aboard, name }`. Off the ship: not on our decks, not breathing our air, no G (`gHere = 0`, game.js:422), not at stations. Routes wait for them and we can't undock. A hull destroyed with them aboard: `lostOffShip` kills them, they are grieved and memorialised, and no body comes home.
- **Defenders** (`RESIST`, 88–90): military shares 1 at quality 0.75; authority 0.85/0.6; irregular (pirates) 0.9/0.55; civilian 0.3/0.3. Count = aboard × share × (0.6 if beaten) × U(0.8–1.2). Struck crews have holdouts with 30% chance (pirates) or 12%, numbering 15% of the crew.
- **Fight minute** (285–328):
  - our power = Σ (0.3 + 0.7·security/100) · health/100 · (0.6 + 0.4·efficiency);
  - theirs = defenders × quality × 1.3;
  - their losses Poisson(0.22·power), 40% of them dead;
  - our hits Poisson(0.18·theirs), each `applyImpact(random boarder, 2.5 + U·9)`;
  - we fall back when able boarders ≤ 30% of the party; those who can't be carried are captured;
  - they surrender at 0, or at ≤ 10% (quality > 0.7) or ≤ 35% left with 50%/min.
- **Legal:** boarding a lawful uninvited ship is piracy (severity 3). Prisoners go to the brig, then free berths. Bounties pay 800/head (captain ×3); ransoms run 2,500–25,000.
- **XP:** a hull taken is +10 to each boarder.
- **For OLYMPUS:** the player fights boardings in person, tactically. Longhaul's resolver is a ready background-combat outcome function for squads the player isn't with, and its phases and durations are good mission beats. "Stations can't be boarded yet" was explicitly deferred as "a marine operation", which is exactly OLYMPUS's territory.

---

## 12. Docking and collars (`docking.js`, `hulls.js`, `mating.js`) (skim)

- **Collars** (`COLLARS`, hulls.js:44–48), androgynous by size:

  | Collar | Diameter | Closing speed | Miss | Angle | Roll |
  |---|---|---|---|---|---|
  | S crew hatch | 1.0 m | ≤ 0.3 m/s | ≤ 0.15 m | ≤ 4° | ≤ 6° |
  | M docking collar | 2.2 m | ≤ 0.25 m/s | ≤ 0.3 m | ≤ 3° | ≤ 5° |
  | L cargo cradle | 6 m | ≤ 0.15 m/s | ≤ 0.5 m | ≤ 2° | ≤ 4° |
- **Phases:** inbound, awaiting, approach (0.1 G, ≤ 150 m/s), spin match (wrecks), prox (RCS second by second), capture (`CAPTURE_MIN = 2`), seal (`SEAL_MIN = 3`), docked, undock (`UNDOCK_MIN = 2`), separate (to `CLEAR_M = 150`), holding, outbound.
- RCS authority by size: S 0.25, M 0.12, L 0.05, XL 0.02 m/s² per axis; 3/2/1/0.5 °/s.
- Contact past twice the capture speed damages the berth's collar (12 h out of service). Energy above 200 kJ damages the hull (1 DP per 60 kJ).
- **Ship-to-ship:** the other ship must hold still. A tumbling wreck gets a spin match (40 s + 10 s per °/min), then a despin.
- **For OLYMPUS:** pilot gameplay is out of scope for a foot soldier. The collar sizes, airlock-to-collar mapping and the capture → seal → equalize timings make good scene timings for drop ships mating with a carrier, boarding tubes and so on.

---

## 13. Careers, leave, hiring (`careers.js`, `crew-services.js`, `ground.js`)

- **Ranks:** 5 steps per department (`RANKS`, 74–82); for example arms runs Rating, Able Rating, Leading Hand, Petty Officer, Chief Petty Officer. XP gates `RANK_XP = [0, 150, 450, 1100, 2400]`, skill gates `RANK_SKILL = [0, 40, 55, 70, 82]`. XP: an hour of practice is 1; a repair +2 (other work +0.5); stabilizing a patient +3; boarding +10; a shuttle run +3 for the pilot (+0.5 per rider); a minute at battle stations with an enemy +1/20. The captain promotes (PROMOTE). Being passed over for 30 days costs up to −10 morale.
- **Pay:** every 30 days, `WAGE = [150, 210, 290, 400, 560]` MCR by rank × role factor (pilot and engineer 1.2, medic 1.15, scientist 1.1, cook 0.85, deckhand 0.8). Back pay is paid first; owed money weighs up to −20.
- **Age:** `born` in game minutes. Role ranges: Captain 32–52, Gunner 21–45, Security 21–46, Deckhand 18–38, and so on. Past 50, piloting and security drift −0.3/year (×2 past 65). Gompertz natural death, `0.00005·e^(0.095·age)`/year, checked daily. Retirement age 58–70.
- **Home:** Earth 30, Mars 24, Belt 30, Luna 7, Jovian 6, Saturnian 3 (weights). Given names by home: Mars lists "Bobbie, Ares, Solveig…".
- **Leave:** cabin fever from day 21, −0.4/day to −15. Shore leave is 8 h, 60 MCR a head; back rested, fed, washed and in better spirits.
- **Quit:** morale < 15 for 7 days means they sign off at the next port unless morale recovers to ≥ 35.
- **Records:** the last 12 per person; a memorial and alumni list of 40.
- Careers run daily at minute 300 on their own RNG stream (`careerDraw`, `ship.careerRng`).
- **Ground errands** (`ground.js`): a course costs 400 MCR and gives +6·(1 − skill/100) skill and 30 XP, once per 60 days. Mars teaches the helm, the engine room and the guns at "the Mariner Valley institutes". Callisto's MCRN base range teaches security.
- **Setting note:** longhaul's Mars is *terraformed two centuries in* (`bodyfacts.js:43–44`): "half an Earth's air, nitrogen and oxygen … oxygen at 16.6 kPa … breathable on the low ground", domed cities, a young northern sea. This differs from Expanse canon and directly affects an air-management game on Mars (see open questions).

---

## 14. Evidence of the user's tastes in longhaul (carry over)

- **2026-03-24** (`memory/feedback_scale.md`): "Build everything as if it's going to scale to huge proportions, because it will": 200k+ entities, spatial hashing, no O(n²) per tick, render only what's visible, far things get outcomes rather than simulation.
- **longhaul `CLAUDE.md`** (standing rules, undated):
  - the sim is pure, no DOM, facts through `emit`;
  - one minute at a time in a fixed order;
  - state is plain data (`$` keys runtime-only);
  - randomness only via `core/rng.js`;
  - units in constant names;
  - every module opens with a prose header explaining the model, and comments explain why;
  - docs kept in step with code in the same change;
  - balance checked through numbers printed by tests;
  - versioning in PATCH bumps until the user declares a release.
- **2026-10-24, v1.2.0, "the mess"**: each diner books a place of their own (stools, standing room), two cook side by side and the rest queue on open floor; furniture is used from its front "as the cameras draw them". No two bodies on one spot, and behaviour must match the picture.
- **2026-10-22, v0.24.0** "no drone, no picture — the port cameras are gone", and the README: "Nothing aboard sees the whole ship from outside." Views must come from a physically present camera or eye.
- **UI commit** ("no fake scan lines") and `roomcam.js`: "Nothing here is a screen effect: no scan lines, noise, vignette or colour fringes." Displays are honest instruments, not retro filters.
- **2026-10-24, v0.28.RC2–RC4**: rigged bodies posed to the sim (braced under hard burns, pinned flat by crushing ones, thrown and tumbling, blood where hurt, pools under the badly hurt and the dead, sleeping on their side under a blanket). The picture shows what the body model says.
- **2026-10-31, v1.12.16**: "The user's crew stayed BURNED for good: fire set a tag that nothing took off". Conditions must have a life cycle (measured, healable, or held until a hospital).
- **2026-10-31, v1.12.15** "a crew rigs, a yard rebuilds": heavy damage can't be fully repaired in the field. Realism over convenience.
- **2026-10-31, v1.12.14** "who goes with a hull doesn't come home": deaths must be consistent (grieved, on the memorial, no body). **v1.12.17**: the dead come off the roster.
- **2026-03-27** "velocity kill at 1.5G (juice threshold), not 5G": 1.5 G is the user's line where moving about stops and juice starts. **2026-03-23 v0.3.5**: the juice system was introduced.
- **2026-10-25, v1.12.0** "the crew update, careers": the user wanted crew with lives (age, home, rank, pay, leave, retirement, memorial).
- **Writing style throughout the docs:** plain sentences, concrete numbers, the "why" in prose, no jargon dump. Mirror it in OLYMPUS docs.

---

## 15. Reuse assessment

| Module | Verdict | Why |
|---|---|---|
| `core/rng.js` (mulberry32, `seedRandom`, `nextOf` streams, `hashString`, `gaussian`) | **reuse as-is** | Pure, tiny, seedable; the per-subsystem stream pattern keeps tests stable. |
| `sim/jobs.js` | **reuse as-is** | 62 lines, pure, generic job board with priorities and assignees. Good for NPC work, base duties and the player's task list. |
| `crew.js` physiology (`physiologyTick`, `protectedG`, `endJuice`, `applyImpact`, `medbayTick`, burns and lasting wounds) | **adapt** | Constants and lifecycle are good and the juice model is canon-faithful. Imports only rng/needs/duty/ship-layout (the last just for `homeDeckFor`). Keep it as the slow per-minute layer; add a fast layer (G-LOC by axis and time, ebullism, bleeding per wound, pain, shock); split the flat 2.5–8 G band; add temperature, fitness and deconditioning. |
| `needs.js` | **adapt** | Formulas (`moraleTarget`, `moraleFactor`, `efficiency`, `practice`) are proven. Extend the needs (thirst, bladder, bowel, fitness, stress), move to sol-based rates, and make hygiene matter socially and medically. |
| `duty.js` | **adapt** | The `scheduleBlock` idea carries over; replace 3×8 h ship watches with a Marine daily routine per sol (reveille, PT, chow, training, duty, liberty, taps), plus ship watches when embarked. |
| `crew-ai.js` | **adapt (patterns) / reference (code)** | Reuse the priority ladder, job eligibility and deferral, place booking (table, counter, couch), `planCouches` (as-is as an algorithm), the rescue chain and the bad-air reflex. Movement (0.8 tiles/min) and minute-step walking are unusable for real-time on-screen NPCs. The code is long and tightly coupled to longhaul's `state`. |
| `life-support.js` | **adapt** | Keep compartment atmospheres, tank-fed repressurization, scrubbers, shaft exchange, pressure doors, suits, couch hoods, the SUITS order and breach jobs. Redo the physics: gas masses → partial pressures (kPa); orifice-flow leaks by hole area instead of a fixed 20%/min; temperature and humidity; door and hatch graph between rooms; seconds-scale effects on the player. |
| `fire.js` | **adapt** | Compact and believable. Add per-tile spread within a deck for top-down play, extinguisher handling, smoke opacity and visibility, and heat. |
| `inertia.js` | **adapt (concept)** | Real-time "bullet time" throwing at 120 Hz with `applyImpact` on contact is a great idea. Fix the axis semantics for tower decks (drop to the floor on burn start; float on cut; lateral only from RCS or flip). |
| `ship-layout.js` | **adapt** | Reuse the ASCII deck-template authoring, deck programs per class, trim rules, fixture/access/facing, cached Dijkstra trees, and table/counter spot generation. Replace the 2D strip coordinates with `{deck(z), x, y}`; decks need to be much larger, multi-room, with interior walls and doors, at a fixed metric scale. |
| `tiles.js` | **adapt** | The catalogue (names, descriptions, masses, WALKABLE/BLOCKING/interior sets) is a good seed; add military fixtures (arms locker, rack with weapon, head with toilet and shower stalls, gym, briefing room, armoury, drop couches). |
| `hulls.js` (collars, tower builder) | **reference; reuse `COLLARS` data** | "One program builds the interior and the hull, so collars meet airlocks" is a principle to keep. The part model is for exterior 3D rendering, which OLYMPUS doesn't need in that form. |
| `systems.js` | **adapt** | The wear/hazard/repair model with TECH multipliers fits Martian gear, including weapons and suits: hazard = stress·(0.4 + 3·wornness²)/(mtbf·1440). For OLYMPUS, ship systems matter mostly as world state the player sees and maybe works on. |
| `reactor.js` | **reference** | Procedure durations and the containment countdown are useful as ship-emergency scenarios; the player won't run the reactor. |
| `boarding.js` | **reference / adapt fight resolver** | Phases and durations become mission beats. The Poisson exchange serves as the off-screen squad-combat resolver. The player's own boarding is tactical and needs new code. |
| `docking.js`, `mating.js` | **reference** | Pilot-centric second-by-second proximity ops. Take the capture/seal/undock timings and the berth/collar vocabulary. |
| `careers.js` | **adapt** | Rank gates, pay day, Gompertz ageing, cabin fever, leave bonuses, records and memorial, on a separate RNG stream. Re-skin to MCRN / Martian Marine ranks and a career that starts after basic training. |
| `hospital.js`, `ground.js` | **adapt** | Care tiers (autodoc, clinic, full hospital), stay durations, bills. A military would use corpsmen, a battalion aid station, a ship's sick bay and a base hospital. |
| `crew-services.js` | **reference** | Hiring halls are irrelevant to a marine; the leave mechanics (8 h ashore, morale by place) are relevant. |
| `gravity.js` | **skip (for this slice)** | Orbital mechanics; outside shipboard life. |
| `ui/roomcam.js` | **reference** | A 2,438-line WebGL/canvas perspective camera, the wrong art direction for top-down pixel art. Its header is a valuable spec of what to show: lighting states (vacuum, blackout, emergency amber, battle red, normal), fire and smoke, postures, blood. |

---

## 16. Recommendations for OLYMPUS's body and ship-life layer

1. **Two-rate body.**
   - A **fast layer** (1 s ticks, or per frame for impacts) for the player and on-screen NPCs: G-LOC by axis and time, breath-hold and vacuum time of useful consciousness, bleeding per wound, pain and adrenaline, weapon-handling motor control.
   - A **slow layer** (once per game minute): longhaul's `physiologyTick`/`needsTick`/juice/healing, extended.
   - **Off-screen NPCs** get schedule-level outcomes (longhaul's "far things get outcomes").
2. **G vectors, not scalars.** In a tower deck under thrust a standing marine takes +Gz (eyeballs-down) and a couch is +Gx (eyeballs-in, the best tolerated), which is why couches recline toward the bow. A spin habitat adds Coriolis. Tolerance should depend on axis, magnitude and duration. These are external human-factors figures, not longhaul's: roughly +Gz grey-out ~4–5 G, blackout ~5–6 G (relaxed, unsuited), G-LOC beyond; +Gx tolerable to ~6–8 G for minutes. Juice multiplies tolerance as in longhaul.
3. **Partial-pressure atmosphere.** Per room: kg of O₂, N₂, CO₂, H₂O, plus temperature. Derive kPa from the ideal gas law. Effects should key on pO₂ and pCO₂: hypoxia below about 16 kPa pO₂ (noticeable), about 10 kPa (severe); CO₂ about 1 kPa (headache), about 3 kPa (distress), about 5+ kPa (dangerous). These are external figures. The same code serves Mars (thin air, or longhaul's 16.6 kPa O₂ if the user keeps terraforming).
4. **Tower decks as z-levels.** Each deck is a full floor plan (e.g., 20×20 tiles at 0.5 m for a corvette beam of about 10 m), joined by a central shaft (ladder plus lift on bigger hulls) and pressure hatches between decks. Under thrust "down" is the stern, the next z-level below. In free fall the same plan is used with floating movement (handholds, push-off, momentum). On spin habitats the floor is the outer hull, and a ring unrolls as a horizontal strip.
5. **Keep longhaul's honest-view principle.** Show only what the character (or a real screen in front of them) could see. Ship tactical screens are physical consoles the player walks up to.
6. **Time:** real-time walking at about 1.3 m/s instead of 0.8 tiles/min, and splash-screen time skips for appliances: shower about 10–12 min, meal about 20 min, sleep, PT. Longhaul's activity durations (WASH 12, MEAL 20, counter prep 3–10, rec 35–55, table 30–50) are a ready default table.

---

## 17. Open questions for the user

1. **Mars air.** Longhaul's setting has Mars two centuries into terraforming (breathable lowlands, O₂ at 16.6 kPa, a young northern sea; `bodyfacts.js:43–44`). The Expanse canon has thin CO₂ air, domes and tunnels. Which does OLYMPUS use? It drives the whole air-management loop on the surface.
2. **Juice numbers.** Keep longhaul's (×3 standard, ×4.5 high above 6 G, 1-hour linger, hangover up to 3 days, crash 6–10 days, strokes 0.06%/min per G past 6)?
3. **Clock.** Is shipboard time in transit on a 24 h ship's clock with watches, or on Mars sols throughout? Which day length do the needs decay against?
4. **Metric scale for pixel art.** How many metres per tile (0.5 m? 1 m?), and how many pixels per tile at close-up?
5. **Free fall in top-down.** How should floating be shown and controlled: handholds, push-off and drift, standing on walls, or a simpler "floating" state?
6. **How literal should bodily functions be** (bladder, bowel, vomiting under G, sweating, menstruation)? And should hygiene carry health effects (skin infection) and social effects (NPC reactions), not just morale?
7. **Player authority.** The player starts as a junior marine, so who issues "secure for burn", "suits on" and "battle stations"? Should longhaul's captain-level orders become NPC commands the player must obey, with discipline consequences?
8. **Spin habitats.** Ceres station is "spun up" in longhaul's lore, but no interior there models spin. Should OLYMPUS model spin gravity and Coriolis where it applies (Ceres, Tycho, ring liners)?
9. **Ship classes to fly in.** Longhaul has interiors only for S/M hulls with ≤ 8 minimum crew (the MCRN Tharsis corvette is the only Martian warship with one). Marines ride frigates, troop transports and drop ships. Should these be authored fresh at OLYMPUS scale, keeping the deck-program idea?
10. **Boarding off-screen.** Is it acceptable that fights the player isn't in are resolved abstractly (longhaul's Poisson exchange), while the player's own are fully tactical?
