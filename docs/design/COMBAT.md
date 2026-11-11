# COMBAT: fighting as a marine, from the checkpoint to the boarding tube

Owner of: ground combat flow, cover and concealment, suppression, squad and fire-team tactics and NPC combat AI, orders in combat, rules of engagement and escalation of force, non-lethal tools, civilians and crowds in a fight, CQC, the use of grenades and explosives in pressurised spaces, casualties and CASEVAC, the death of squadmates, ship combat lived from inside, boarding, EVA in combat, off-screen fights resolved as outcomes, and the after-action.

Written 2026-11-05 from DESIGN.md and the research notes `tradecraft-sim-combat.md`, `tradecraft-design-2.md`, `tradecraft-design-3.md`, `longhaul-combat.md`, `longhaul-shipboard.md`, `longhaul-physics.md`, `longhaul-setting.md`. Numbers marked "(my call)" are mine, to be tuned in play; every other number is cited. Tables marked **[computed]** come from scratch scripts run on 2026-11-05 with the formulas given here.

Revised 2026-11-05 after five critics reviewed the whole design. The changes:
- free-fall movement is cited to BODY (§14.5);
- `threatKnown` is defined (§6.1);
- detainees go to Star Helix within 6 h (§9.1, §9.5);
- the evacuation chain matches BODY's tiers (§12.4);
- the slug warning is corrected and held (§13.3);
- the line marine gets initiative (§8.5);
- the passenger in the couch gets choices (§13.3);
- the checkpoint shift is paced as a deck of cases (§9.9);
- training casualties get a role (§2.3);
- patrol legs and crossings run on the real sim, never an outcome skip (§14.2, §21);
- the busiest area is budgeted with a fight in it (§19);
- the build order is aligned with ROADMAP (§22).

Revised 2026-11-06 for the user's two rules of 2026-11-05 (§1): the places a fight happens in are authored, and the fight itself (who, where in the place, when, against what) is procedural; everyone in it is generated, so the names in this section's examples (Tanaka, Ruiz, Okafor, Kade) are examples of what PEOPLE's generator draws. Also: COMBAT's threat record goes through PEOPLE's `mind` accessors (§6.1), and MCMAP's mat session is career sol 7 (§10.6).

Revised 2026-11-07 for the user's close-quarters ask ("a recruit marine would have to do everything step by step while an experience Tier 1 Operator would have "automations through pressing T""): the new §25 (close-quarters battle and skill as automation: drill rungs, the take-in, the room by hand and by T, special shots and reloads as rows, bundles as data, the shoot house's scenes), with pointers in §2.1, §3.1 to §3.5, §7.7, §7.8, §20, §21, §22, §23 and §24. Nothing is renumbered.

Revised 2026-11-07 for v0.0.8 as built (`test-pairs` "Pairs": the build sheet `docs/build/0.0.8.md` §8 items 2 to 27, §9 the integration's and §10 the fixer's after the code, runtime and design reviews; DESIGN.md's log of that day): §24's questions 9 to 13 answered with their defaults, and two new ones (14, 15); the take-in on the bay as lived, the first-target notice check, a sub-step never cut, no hold inside a window, the pause's guard (§25.4); the shot rows and the reloads as built, "still up" defined, the Off safe times (§25.6); the DI's still-up rule (§25.8.3); the course as built (§25.10.3); `test-pairs` done (§25.14).

Revised 2026-11-07 for the user's rule on suppression and hardening of that day ("suppression should be a roll modifier that picks up on those factors, with "hardening" (can name it differently) being an offset to it"; DESIGN.md's log), merged from two proposals as a judge directed: §5 rewritten (the pool, hardening as an offset, felt, the startle, the anchors; `resist` retired), §7.10 (`nerve` renamed resolve) and the new §7.11 (the defender's procedure and choice on a loud entry), §11.4 (the flashbang split into what hardening offsets and what is physics), §24 (question 15 restated, questions 16 to 23), and the new §25.18 (the room under the chaos, the bang's window, the scenes `test-pairs&setup=bangs`, `test-stress` and `test-breach`), with pointers in §0, §2.1, §3.2, §3.4, §3.5, §7.3, §11.5, §20, §22, §23, §25.4.2, §25.5.5, §25.5.6, §25.6.3, §25.10.4, §25.16 and §25.17. Nothing is renumbered: §5.1 to §5.5 keep their topics, and §5.0 and §5.6 to §5.10 are new.

Revised 2026-11-08 for the user's lore of that day ("zero/low G specific techniques for ship battles when not under thrust (mag boots etc)"; DESIGN.md's log; SETTING §5.11): the new §14.8 (anchors, six faces, feet aft, back clear, the void kit by place, repelling boarders, low g) and §10.3's pointer to it.

Revised 2026-11-08 once more for the user's answers to the lore round (DESIGN.md's log): §14.8's "Back clear" and the V-5X in its kit-by-place withdrawn with the over-the-shoulder gun, and a rule added that footing holds the recoil of rifle-shaped guns ("Try keeping rifles looking like rifles even zero G stuff, let's say we use footing to hold recoil"); the brace siren and gravity events of any scene (PLACES §3.11, §3.16) pointed to from the feet-aft rule.

Revised 2026-11-08 again for the user's two rules of that day (DESIGN.md's log): "martian marines always train at 1G except for basic weapons training", and the close-quarters road, "now to bring this gameplay smoothly to CQB room clearing in full G, then ship CQB in microgravity and grav boots, and to real combat with enemies". The shoot house moves into the Wheel at 1 G (§25.10.1, §25.10.2; PLACES §4.15); `test-shoothouse` is the next scene after `test-stress`, with what 1 G changes in the room and the order after it (§25.10.4); `test-zerocqb` is brought forward from 0.5 and `test-breach` follows it (§25.14, §25.18.3, §25.18.5; ROADMAP §4.2). My calls.

---

## 0. The model in one page

A fight runs on three clocks that share one game time.

1. **The stage, in seconds.** The world runs 1:1 at 20 Hz. Nobody aims with reflexes. When the player declares intent (G readies the weapon, X enters shooting mode, K L M open CQC, a reflex card is answered with a fighting step), **stop motion** begins, exactly as in tradecraft: time stands still while the player chooses, and each chosen step runs world time for its own duration. COMBAT adds the steps a soldier needs: posture changes, rushes and crawls between covers, peeks and corners, area fire, watching a sector, orders, grenades, drags. Steps longer than a second end early on **interrupts** (a new threat seen, a hit, an order, a grenade). Everyone else, squadmates and enemies alike, acts in real time during the player's steps, with the same timed actions, human reaction delays and only what they perceive.
2. **The engagement, in minutes.** Every fighter carries a **suppression** pool fed by the chaos around him (near misses, a friend's muzzle, the room's gunfire, blasts, flashbangs), and **hardening**, trained and earned, is taken off it before it reaches his hands (§5): what is left costs rolls, slows hands and aim, and makes exposing yourself a test of nerve. Fire superiority is the side whose fire keeps the other suppressed. Squads fight by **drills** written as data (react to contact, bounding overwatch, buddy rush, squad attack, break contact, stack and clear) run by three brains: fighter, team, squad. Orders travel by voice, radio, hand signal or helmet contact, each with its own range and delay. The player receives orders on the T line and, from fire team leader up, gives them from an order panel inside stop motion.
3. **The operation, in hours.** Ship combat comes from longhaul's minute-stepped sim run one minute ahead, which schedules each intercept, hit and burn at its second for the interior. The marine lives it suited and strapped in, with a repeater showing only what the ship knows, and time held at 1:1 only around the moments that matter. A hit becomes holes, spall and fire in real compartments. Boarding follows longhaul's phases and timings, played as zero-g close-quarters battle inside the target. Fights the player is not in are settled per minute by an exchange calibrated on longhaul's Poisson model, and at company scale by Lanchester's linear law.

Around all of it, **the rules of engagement** judge every use of force on what the shooter could know, from the helmet camera's record, and **the after-action** turns the day into a paper, a standing change and XP.

---

## 1. The user's words this section obeys

From the OLYMPUS brief (2026-11-05): "Features should include, ship combat, ship boarding, combat on planetary grounds etc."; "getting on a drop ship to be deployed for peace keeping on Europa"; "special operations teams [...] dropped in much different special forces settings"; "Shooting should play as in Tradecraft"; "NPCs should also be well built and reactive, smart, have their own lives".

The user's two rules of the same day:
- "game world is handcrafted, events and world politics, assignments, opportunities, mission details are all procedural". **The ground is authored; the fight is drawn.** Every place a fight can happen (the training village and the Talus, the Works' passages and the towns' galleries, a checkpoint, a ship's decks, a target hull of its class, a special-operations setting) is PLACES's hand-made place, the same in every career, with its cover, its doors and its routes. What is procedural, from the world's seed and the day's stream: which operation comes and when (§16.2's incidents, CAREER §10 and §11.3); its objective, its opposition (their number, kind and quality, §7.9, §14.4), what the brief's intelligence gets right and wrong, and its timing; and **where inside the place** things happen: the cell's ambush on an authored route, the IED in a gallery mouth, the defenders' barricades on a hull's decks, the hostages' room, the checkpoint's deck of cases (§9.9). A layout is never rolled per seed (my call on the reading).
- "All people generated" (asked whether the persistent cast should be handcrafted). The squad, the NCO on the net, the opposition, the role-players, the civilians in the crossfire and the umpire are all drawn from the world's seed (PEOPLE §3.1); nobody in a fight is a written character.

Carried from tradecraft (dates are the user's):
- 2026-11-03: "Shooting is going to be integrated in a stop motion way, heavily relying on the weapons skill [...] each step to ready a weapon has to be acted on by the player and will have time move forward as we do". "Shooting mode is [...] explicitly entered and should only stop time if we're trying to shoot".
- 2026-11-03: "NPCs shooting at us should just move time forward normally as they do the things to ready their weapons".
- 2026-11-03: "There should be a reflex mode, where time stops when things require it (hostile weapon spotted [...] someone trying to grab us [...])". 2026-11-04: "the reflex window is spammed on us too, there should be a way to remember our choice for a while".
- 2026-11-04: "Build a cover system, where being behind objects that can provide cover move the needle in the dice rolls when a shot is computed. Being at the corner of a wall should be better than behind shallow cover. There should also be a hide behind cover action when in gun mode and close to cover".
- 2026-11-04: "it should cancel all of the stop motion mode when I get arrested or otherwise am unable to immediately do the shooting steps".
- 2026-11-04: "Armed npcs should also always carry ammunition (and use it, in such ways that they can run out)"; "when an npc gets taken down and was carrying a rifle, they should drop it and the rifle should be made available to pick up to us".
- 2026-11-03 (bug report): two officers shot down went on firing from the ground. Rule: nobody fights from a state the body forbids.
- 2026-11-03: "does the tailing parties also roll [...] they also see me through walls". Rule: sides know only what they have seen or been told.
- 2026-11-04: "who shouts to drop it ? I don't see any police near me". Rule: heard-not-seen sounds get a felt marker (VIEWS §2.11).
- 2026-11-04: "I got arrested instantly without a splashscreen that explains what happened, without a reflex action to try to resist [...]". Rule: a big outcome lands with a reflex chance, then a splash.
- 2026-11-03: "people are just ignoring this shot woman on the ground"; 2026-11-04: "they would either steer wide away, or pool around the bodies with their phones out"; "shot and down NPCs [...] should stay loaded for a reasonable amount of time".
- 2026-10-26 (CQC): the fight-ender rule ("when hitting a stunned opponent with advantage, we attempt a fight ender [...]"), "beginners would only punch", "stuns and dazes should have effects like preventing blocks or hit or grab", the Shift riposte, "talk should pause the game, like combat", the dojo tutorial and "once we did it once, remember it [...] snap flash forward".
- 2026-11-04: "being knocked down is a logical result of getting shot. Staying down should be justified"; "wounds should have effects [...] If we're still there with a gun out, they would run for their lives".
- 2026-10-29 (tradecraft 0.1.0-rc50): "we should not have the option to just fast travel to work, it would skip all the gameplay like shaking watchers etc., same with going back home". Rule: no outcome skip replaces a patrol leg, an EVA crossing or a march. They run on the real sim, at 1:1 or on TIME's fast-forward with perception live (§14.2, §21).
- Tradecraft's touchstone, *Papers, Please* (TIME §10.6 carries it): there a police stop was a scene of papers and cues. The checkpoint shift is played the same way, as a deck of cases (§9.9).

Carried from longhaul: v1.12.18 (2026-10-31) "the ship's displays go by what the ship can know"; v1.12.14 (2026-10-31) "who goes with a hull doesn't come home"; v0.24.0 (2026-10-22) "Nothing aboard sees the whole ship from outside"; 2026-03-27 the 1.5 G line where moving about stops and juice starts.

Settled in DESIGN.md (2026-11-05): stop motion in shooting and CQC; time stands still while you talk; G is intent, X is shooting mode, K L M are hit, grab, guard; T is the instinct's line, joined in the field by the NCO's voice on comms; Space pauses.

---

## 2. The engagement record

### 2.1 State shape

One record per fight in the live area, in `state.fights` (plain JSON; `$` keys are runtime-only).

```json
{
  "id": "fg193",
  "area": "tyre.pump-3.level-2",
  "startedMs": 2051333000,
  "phase": "contact",
  "sides": {
    "blue": { "unitIds": ["2/4-E-2-1"], "leaderId": "p50", "drill": { "id": "react-to-contact", "phase": "fire-superiority", "sinceMs": 2051341000 },
              "contacts": { "p907": { "x": 41.5, "z": -12.0, "seenMs": 2051339400, "byId": "p55", "how": "seen", "conf": 0.9 } } },
    "red":  { "unitIds": ["cell-pwyll-3"], "leaderId": "p902", "doctrine": "irregular", "contacts": {} },
    "civ":  { "fleeing": 31, "down": 2, "filming": 3 }
  },
  "roe": { "card": "msfe-europa-2351", "fire": "tight", "warningShots": false },
  "casualties": [{ "who": "p56", "side": "blue", "atMs": 2051352100, "precedence": null, "at": { "x": 12, "z": 3 }, "state": "wia", "ccp": null }],
  "useOfForce": ["uf412"],
  "quietSinceMs": null
}
```

Ids follow CONTRACTS §10: a fight is `fg<n>`, a use-of-force record `uf<n>`, a person `p<n>` (the contacts are keyed by theirs), a unit `2/4-E-2-1`; the area is a PLACES id in 2/4's sector (the Tyre Works, SETTING §7.7). The fight keeps no log of its own: its lines are ordinary `log` records (TECH §6.5) that name it by `fightId`.

Per actor, a combat block on the live actor (not the sheet, so a save between fights carries none of it unless a fight is live):

```json
{
  "side": "blue", "unitId": "2/4-E-2-1", "team": "A", "role": "R",
  "task": { "kind": "bound", "to": { "x": 18.0, "z": 6.5 }, "orderId": "od77" },
  "posture": "kneel", "cover": { "fixtureId": "f:pump-3:crate-12", "keeps": 0.55 }, "anchor": "planted",
  "supp": 38, "suppAtMs": 2051350800, "suppRate": 4, "startleUntilMs": null, "blindUntilMs": null, "lastBangMs": null, "bangN": 0,
  "choice": "fight", "choiceAtMs": 2051350900, "sector": [1.2, 2.4],
  "takeInUntilMs": 2051351050, "thinkAtMs": 2051351200,
  "resolve": 0.8, "brokeAtMs": null, "horsDeCombat": false
}
```

### 2.2 Lifecycle

- **Start.** A fight begins at the first hostile act in the live area: a round fired with intent, an explosion, an armed assault, or a hostile seen with a weapon by a side whose ROE allows engagement. Everyone who perceives it, or is told on their net, joins its side.
- **Phases** belong to each side's drill (§7.7). The record's `phase` is the blue side's for the log.
- **End.** No hostile has acted or been perceived for `FIGHT_QUIET_S` 120 s, or every opposing fighter is down, fled from the area, surrendered or detained (my call). The record closes into the after-action (§17). Bodies, dropped weapons, brass and blood stay in the area, as tradecraft keeps them ("should stay loaded for a reasonable amount of time").
- **Off stage.** A fight whose actors are all outside the live area is not a record here; it is an off-screen exchange (§16), which can wake into a record (§16.3).

### 2.3 Training fights: the harness, the umpire and the training casualty

Training fights are fight records with an `exercise` block: the mission rehearsal exercise on career sols 7 and 8 and the MOUT exercise in the slipped weekdays, sols 9 to 13 (CAREER §5.4, CONTRACTS §3), and runs in the shoot house (PLACES).

```json
{ "exercise": { "kind": "field", "umpireId": "p61", "regen": true, "regenMin": 10, "hotWashAtMs": 2051990000 } }
```

`kind` is one of `field`, `mout` and `shoothouse`. Everything runs as in a live fight, with blanks or marking rounds. The **laser engagement harness** scores hits by the real rolls (my call: the 2351 descendant of MILES). Blanks make no crack, so near misses come as the harness's tone at ×0.5 suppression (§5.1).

A harness hit does not wound (marking rounds bruise: BODY). It sounds the hit's tone and the umpire calls "You're hit: out of the exercise". The hit's **wound card** goes into the exercise's log: the part, the kind and BODY's severity, as the real round would have made them.

Being "killed" in training never means standing idle at 1:1 (my call on the shape, after the critics' finding). The umpire's call brings a card, with time still:

| Option | What it is | When it is offered |
|---|---|---|
| **Casualty for the lane** (the default) | You lie where you fell, holding your wound card, and the squad's casualty drill runs on you (§7.7 `casevac-under-fire`, §12.1). You see from the ground who drags you, the tourniquet, MARCH worked on your body as moulage (BODY §18), the casualty card and the practice 9-line. It is lived at 1:1 at the drill's own pace. You may answer the corpsman ("The left leg."), which makes his diagnosis easier (BODY §18.4) | always; the squad is graded on how it treats its casualties |
| **Observe with the umpire** | You walk beside the umpire, out of the fight: nobody sees you or shoots at you. The rest of the exercise runs on TIME's fast-forward at `OBSERVE_FF_RATE` ×4 (my call; TIME owns the engine) with perception live, down to 1:1 whenever you choose, and ends at the hot wash | once the squad has worked on you, or at once if nobody reaches you within 5 min |
| **Wait for regeneration** | On long exercises the umpire regenerates casualties at the CCP every `regenMin` 10 min of game time. You walk back in with the next bound ("Kade, you're alive again. Go."). The wait is TIME's `stand-by` at the CCP | exercises with `regen`, from 60 min long |

- A harness casualty is out of the fight, so `threatKnown` (§6.1) ignores the opposing force for him until he regenerates (my call).
- **The hot wash** (§17.2) reviews your "death" from the harness log: who hit you and from where, your posture and cover at that moment (`keeps`, seconds exposed), your suppression band, and the step you had chosen. The instructor names one thing to do differently.
- A harness death does not cut the exercise's XP (§17.4). `conductUnderFire` still reads what you did before it.

---

## 3. Ground combat flow

### 3.1 Real time, stop motion, and how they meet

- Out of stop motion, the player walks, runs, looks, talks (time stands still), uses R and T, and lives at 1:1 among the fighting. Shots can only be taken in stop motion. A firefight can be ridden out in real time by following T (the order on the line), which is how a new marine is meant to survive the first one. In a room being cleared T's reach is the training's: at drill rungs 0 and 1 the marine works step by step and walks in by the keys after X, and the bundle grows with the rung (§25.8). When the team's leader falls, loses contact or freezes, the same line offers to take the team (§8.5), so a private is not a passenger in the fight.
- **Entering stop motion** (TIME owns the general mechanism; COMBAT lists the combat doors): G with a gun (the ready step is the first step, tradecraft's "G means intent"), X, a CQC key, a reflex answer that is a fighting step, or the order panel (§8.3).
- **Leaving it**: X; or automatically, as tradecraft does, when the player cannot act at once: dead, out cold, knocked down and not yet able to rise, held in a grapple, carried, strapped in under G above 1.5 G, or in a vehicle. Being suppressed or pinned does **not** end it: you can still act, with a cost (§5.3).
- When nothing hostile has been perceived for 60 s of steps, the instinct line says so ("Nothing in sight. X to stand easy."). The mode does not end by itself (my call).
- Space still pauses. Nothing is chosen while paused; choosing happens in stop motion (my call, so that every order and step costs its time).

### 3.2 What everyone else does during a step

Tradecraft's rule is kept and generalised: during a step the world runs at full fidelity, 20 Hz, for the step's duration, and **every NPC acts in real time with the same timed actions as the player** (WEAPONS's handling steps, the movement steps of §3.4, aim, fire, throw, aid), at their own skill's pace, reloading from finite magazines and dropping what they carry when taken down.

NPCs are not omniscient and not instant:
- **Perception.** They act on what PEOPLE's perception gives them and on their side's contact board (§6). No one sees through walls or fires at what they do not know.
- **The take-in** (§25.4; it replaces this section's first formula, `reactMs = (250 + 1250 × (1 − min(1, WF / 60)) + 300 × band) × U(0.7, 1.3)`, my call of 2026-11-05): from perceiving a new threat to the first action about it, every NPC and the player read one helper, `takeInMs` (`src/sim/combat/react.js`): Warfighting's core times the expectation, an Awareness check's grade, who it might be, how many, stance, light and the body, plus 200 ms a band of felt suppression (§5.3), in whole ticks. A fighter in a fight (`alert`) takes about 1.05 s as a fresh private (WF 15), 0.50 s as a sergeant (WF 44), 0.20 s as a five-year Raider (WF 70); an aim held on a door is `sector` (0.55 s, 0.25 s, 0.10 s); a sentry at rest is `surprise`, never under 0.25 s. The human figures it keeps: about 0.25 s simple reaction time, longer to choose under stress (§25.17).
- **Thinking cadence**: an NPC fighter re-decides every `THINK_MS` 500 ms in contact, 1,000 ms otherwise, and at once on its own events (hit, order, grenade, target down, magazine empty). At most `DECIDE_PER_TICK_MAX` 6 fighters decide in one tick; the rest wait their turn (§19).
- **No firing from the ground** when the body forbids it: a fighter who is down, knocked, out cold or past BODY's pain limit takes no combat actions beyond self-aid, crawling and surrender (the user's 2026-11-03 bug, kept fixed).

The player has unlimited thinking time in stop motion and pays for it with no edge in execution: every step takes its time, and the enemy's take-in runs during it (§25.4). That is the bargain tradecraft struck and OLYMPUS keeps.

### 3.3 Long steps and interrupts

A step longer than `STEP_LONG_S` 1.0 s is **interruptible**. It ends early, and time freezes, on the first of these that the player perceives:

| Interrupt | Trigger |
|---|---|
| `newThreat` | a hostile not on your mind before enters your perception, or opens fire where you can see or hear it |
| `hitSelf` | you are hit (armour-stopped included) |
| `teamCasualty` | someone in your fire team goes down where you perceive it, or "Man down!" on your net |
| `orderToMe` | an order addressed to you or your team is received (§8) |
| `grenadeNear` | a grenade or charge lands, or is called, within 15 m |
| `blastNear` | an explosion within 20 m |
| `targetGone` | the step's target is down, out of sight or out of the step's arc |
| `gunStop` | the gun runs dry or stops (WEAPONS) |
| `ventNear` | a breach with flow within 5 m (§13.7) |

**Noticing late and the startle are the take-in** (§25.4.7). On `newThreat` the world runs on for the marine's `takeInMs`, the keys refused but Space and Esc, and the freeze comes at its end; his Awareness check against `8 + round(rangeM / 10)` (+4 behind, −2 in his watched sector) multiplies it by its grade (pass ×1, miss ×1.5, bad ×2, disaster ×3), and nothing is added to the first step after the freeze. A hit, or a round cracking within 1 m, ends the window at once. Training buys reaction time; the player's free thinking does not. (Was, my call of 2026-11-05: a success froze at once and a failure let the world run `400 + 100 × |margin|` ms, at most 2,000, which cost a tier one's rare natural 1 more than a recruit's worst; then `STARTLE_MS = max(0, 700 − 7 × WF)` on the first step after the freeze.)

**As built in v0.0.5** (`src/sim/arms/shooting.js`, `src/sim/scenarios/handling.js`; the build sheet 0.0.5 §8 item 17): two interrupts. **`orderToMe`**: the tower's commands are **O events at priority 2** (kind `range-cmd`, TIME §7.1), posted by the range officer when he sees the line ready for the last one (a stance, a magazine in, hands still, the rifle on safe), after a gap drawn on `stream(seed, 'range:gap', i)` (1.5 to 4 s); a command ends a wait or a hold at once, and **CEASE FIRE cuts any other step at the end of its current sub-step**, so a macro is never left half a sub-step done. **`gunStop`**: a pull that clicks or a shot that does not cycle ends the fire step at the pull's end and offers the reflex card (§3.5). `STEP_LONG_MS` 1,000 is in `src/sim/combat/steps.js`; the take-in (§25.4) is built with `test-pairs` (§25.14).

### 3.4 Combat steps

Base times are at value 10 (pace 1.00) and scale with SKILLS's `paceOf(value)` on the named skill; failure costs ×1.6 where a roll is made (SKILLS §5.12). Gun handling, aiming and firing are WEAPONS's steps and are not repeated here. Every exposing step is marked: it raises you into the threat's view for its duration and is what suppression makes hard (§5.3).

| Step | Base time | Pace skill | Roll | Exposing | Notes |
|---|---|---|---|---|---|
| Get down (to prone) | 0.9 s; in g below 0.3 G, `max(0.9, tFall(1.0 m) + 0.3)`: Mars 1.03 s, Europa 1.53 s, Ceres 2.97 s | Fitness | none | no | low g makes hitting the deck slow; Zero-g ≥ 10 cuts the low-g extra by 30% ("push yourself down") (my call) |
| Kneel / rise from kneel | 0.5 s / 0.5 s | Fitness | none | rise: yes | |
| Rise from prone | 1.3 s (Europa 1.0 s) | Fitness | none | yes | |
| Rush to a point (≤ 15 m) | distance / BODY's run speed for the gravity and load + 0.3 s start + get down or kneel at the end | Fitness | none | yes | the "3–5 second rush": I'm up, he sees me, I'm down |
| Dash to cover | as rush, to the best spot from `hideSpot()` within 15 m (§4.7) | Fitness | none | yes | the tradecraft "hide behind cover" step, lengthened |
| Low crawl / high crawl to a point | 0.25 m/s / 0.5 m/s (Mars g; BODY scales) | Fitness | none | low: no, high: torso share 0.3 | tradecraft's `CRAWL_MS` 0.25 |
| Lean out / back (at a corner) | 0.35 s each | Fieldcraft | none | out: LEAN 0.65 hidden | |
| Peek | 0.9 s (out 0.35, look 0.2, back 0.35) | Fieldcraft | none | 0.5 s exposed | refreshes your contacts in that direction with a perception pass |
| Slice the pie | 0.5 s per 15° of a corner | Fieldcraft | none | edge only | reveals a room or corridor progressively (§7.8) |
| The door: Read the door / Open / Kick it | read 0.6 s; open: the hand 0.2 s and the leaf's swing (PLACES §1.6); kick 1.2 s | Awareness / Weapon handling / Fitness | the kick: Fitness against the door's DC | open, kick: yes | in the step panel, because R offers nothing in stop motion; the room's steps and bundles are §25.5 to §25.8 |
| Watch a sector | up to 30 s, chosen | none | none | as posture | holds an aim on an arc of ±15°: ends when someone entering it has been taken in (the `sector` take-in, §25.4: 0.55 s for a private, one tick for a tier one), with the aim already held (WEAPONS's held bonus). **Watch: a point** (§25.5.2) is its form on the move: the muzzle turned onto a bearing and held there while the keys move you |
| Area fire (suppress) | 2–20 s, chosen; rate slow (1 round / 3 s), rapid (1 / 1 s), bursts (3–4 rounds every 2 s) | Weapon handling for recovery | each round (§5.4) | yes unless blind | ends on dry, stoppage or interrupt; you reload by hand |
| Blind fire | 1–6 s | none | each round at +10 DC | hands only (share 0.1) | over or round cover without looking |
| Stay down | until fire lifts (felt falls below 20) or 2–60 s, chosen | none | none | no | drains the pool fastest, 6 points a second (§5.2) |
| Breathe | 4 s (`BREATHE_MS`) | none | none | no | offered at felt 20 and up with no contact pending: tactical breathing, the pool's decay doubled while it runs (§5.2); taught at boot |
| Report contact | 1.6 s | Comms | Comms vs 15 (SKILLS: "a contact report" is average) sets report quality | no | puts your contacts on the side's board (§6) |
| Call (Man down / Corpsman up / Grenade / Moving / Set / Reloading) | 0.8 s | none | none | no | free with some steps (§8.4) |
| Order | 1.0–2.4 s by channel (§8.1) | Leadership | under fire, §8.3 | no | from the order panel |
| Drag a casualty | BODY's drag speed for the gravity (my default 0.6 m/s on Mars, 0.8 on Europa) | Fitness | Fitness vs BODY's DC | yes | help from a second marine per SKILLS §5.8 |
| Fireman's carry: lift / walk | 3 s / BODY's carry speed | Fitness | Fitness | yes | |
| Grenade: from pouch, pull, throw | 1.4 s, 0.5 s, 0.7 s; cook 0–2 s optional | Weapon handling (pouch, pin), Marksmanship (throw) | the throw (§11.1) | throw: yes | |
| Push off to a point (zero g) | BODY §16.6's push-off (1 s) + distance / the chosen speed (BODY's 0.3, 0.6, 1.2 or 2.0 m/s) | Zero-g | BODY §16.6's push-off roll, on Zero-g (§14.5) | yes | |
| Grab a handhold / plant boots / unplant | 0.3 s each | Zero-g | a grab at speed: BODY §16.6's roll, on Zero-g (§14.5) | no | |
| Clip / unclip tether | 2.5 s | EVA | under fire, EVA vs 10 | no | §15.1 |
| Open, close, dog a hatch | PLACES's door times | Tech or Fitness | PLACES | yes | |

Tempo (SKILLS §5.9): rush, dash, crawl and the grenade throw are `rushable` (×0.6 time, −3 on their roll); peek, slicing the pie and the throw are `careful` (×1.5, +2). Nothing in combat is "taken steady": it is never pressure `none`.

**As built in v0.0.5** (`src/sim/combat/steps.js` `stanceMs`, `STANCES`; the build sheet 0.0.5 §4): the stances alone, at value 10 by `paceOf(Fitness)`, rolling nothing. Getting down falls at the gravity: **stand to prone** `max(900, tFall(1.0 m) + 300)`, 1,033 ms on Mars; **kneel to prone** `max(600, tFall(0.5 m) + 300)`, 818 ms; and the in-between stances (my calls): **stand to kneel 500 ms, kneel to stand 500, prone to kneel 1,000, prone to stand 1,300**. A stance step writes `actor.stance` (`'kneel'` or `'prone'`, absent standing) at its end; outside the mode, A and W are lived steps, and a move key while kneeling or prone stands you first. The other steps of the table wait for the first fight.

**As built in v0.0.6, a step marked, not struck** (`src/sim/arms/shooting.js`, `src/ui/hud/steps.js`; the build sheet 0.0.6 §9 item 29, my call): a step that breaks a rule of the line without being impossible is **marked** (`warn`: an amber "!" and its words on its row, "! one magazine a string", "! tracer: the course is ball"), never struck, and stays choosable; a struck step is one the gun or the body cannot do ("(on safe)"). So the choice and its cost stay the player's, and the rule is said before it is broken (WEAPONS §6.4).

**As built in v0.0.11**: `stanceMs`, `stanceBaseMs` and `tFallMs` take the place's gG (required); `shooting.js` `stanceMsOf(from, to, fitness, gG)` and `gunner.js` read `gravityAt`. On Mars kneel to prone is 819 ms at value 10 (base 818.02 ms x `paceOf(10)`, rounded; the `steps.js` header says 818, the base). In the page: kneel to prone 850 ms at Melas, 650 at 1 G, 1,150 on Europa, 1,700 to 1,750 in free fall; stand to prone 901 ms at Fitness 10 at 1 G and 1,033 at Melas; stand to kneel 550 everywhere; prone to kneel 1,000 to 1,050 everywhere; kneel to stand 550 everywhere (only getting down follows gravity: prone to stand 1,254 ms and stand to kneel 482 ms are the same from 0 to 1 G). Under 0.05 G getting down is an orientation and anchor change (BODY §14.8), timed as the fall at 0.05 G (stand to prone 2,321 ms, kneel to prone 1,729 at pace 1.001): finite at 0 G and continuous across the edge (my call, until step 7). **Proposed**: rising against g and an orientation change under 0.05 G, decided before `test-shoothouse` is scored (BODY §14.1).

### 3.5 Reflex cards in combat

Tradecraft's `reflex.js` is ported as is (offer, chosen, `KEEP_S` 120 s kept answers, "Nothing: let it come" always present). A reflex is offered only out of stop motion, when the player perceives the moment coming (the check in the second column). Each option is a step of §3.4 or WEAPONS, and choosing a fighting step enters stop motion.

| Kind (`why`) | Trigger | Seen coming if | Options |
|---|---|---|---|
| `contact` | first hostile fire, or a hostile weapon raised, while you are in real time; in a clear, every person newly seen (§25.4.1) | always, at the end of the take-in (§25.4) | it is the pause of §25.4.6: the shot rows, Hold him, Challenge, Get down, Back out, Carry on |
| `grenade` | a grenade lands or is called within 15 m | Awareness vs 10 (+6 if someone shouted "Grenade!") | Dive away (1.2 s: prone plus 1 m away) · Behind cover (named) · Kick it clear (within 1 m: CQC vs 12, 0.8 s) · **Turn away** (0.3 s: eyes and face from it; makes you forewarned for a flashbang, §5.1, §11.4) · Nothing |
| `lunge` | a person closes inside 3 m at more than 2 m/s | Awareness vs their Fieldcraft | Step back · Shove (CQC opening) · Muzzle strike (CQC opening with the gun) · Fire (if already aimed) · Nothing |
| `hatch` | a hatch or door opens onto you with someone behind it | Awareness vs 8 | Fire (if aimed: held) · Back off · Grab · Nothing |
| `vent` | a breach with flow within 5 m | Awareness vs 6 | Seal visor (if up: 2 s, §13.3) · Grab a handhold · Brace · Nothing |
| `friendlyLine` | a friend steps onto your line of fire as you are about to fire | always (Weapon handling's muzzle discipline, WEAPONS) | Hold fire · Fire anyway |

**Timed by the take-in** (§25.4.7): every card here comes at the end of the perceiver's `takeInMs`, for the player and NPCs alike, and `contact` always comes. A kept answer (R, `KEEP_MS`) may answer a contact only with Get down, Back out or Carry on, never a shot.

**As built in v0.0.5, the reflex inside stop motion** (`src/sim/combat/reflex.js`, tradecraft's ported; the build sheet 0.0.5 §8 item 8, my call): the gun's own stop during a lived step offers the card, which this section first offered only outside the mode. A click (`why: 'click'`, "Click.") or a shot that did not cycle (`why: 'stop'`, "It didn't cycle.") holds `'reflex'` and offers "Tap, rack" (IMMEDIATE ACTION), "Look at the port" (0.3 s) and **"Nothing: stay on the card"**, the "Nothing" option's words for a click or a stoppage of your own rifle ("Nothing: let it come" stays for a threat). The card sits **beside the weapon card**, in the step panel's place, so the believed state stays in sight at the moment of diagnosis (VIEWS §8.10). A digit answers; R keeps the answer for `KEEP_MS` 120 s, and a kept answer still offered answers the next card without showing it ("By reflex: tap, rack."). Its record is `state.stop.reflex`, saved (TIME §13).

### 3.6 Big outcomes: reflex, then splash

The 2026-11-04 rule is applied to every large change of state in a fight. The order is: a reflex chance where one is plausible, the animation in the stage, then a short outcome splash (VIEWS draws it):
- **Knocked down by a hit**: BODY decides the knock time; COMBAT needs a choice when it ends: "Stay down" (prone, smaller target) or "Get up" (cross-reference BODY on whether the player is knocked down as NPCs are; tradecraft exempted the player).
- **Out cold**: fade; the outcome splash when you come to says where you are, who has you and how long it was ("Doc's hands on your chest. Eleven minutes.": the corpsman is whoever the roster drew for the platoon's `doc` billet).
- **Captured, CASEVAC'd, dead**: the splash, then CAREER's papers.

### 3.7 Edge cases

- **Two fights in one area** merge when an actor perceives both.
- **A save mid-fight** (Standard) keeps the record and every actor's combat block; `$` keys (reaction timers relative to the tick) are rebuilt on load from absolute `…Ms` fields.
- **Talking in a fight** stands time still (DESIGN); a talk that is not a shout (§9.3) is refused while you are under fire ("Not now.").
- **Picking up an enemy weapon** is allowed in a fight (tradecraft's user rule). WEAPONS's accountability takes it from you at the end of the operation.

---

## 4. Cover and concealment

### 4.1 Port of `tradecraft/src/sim/cover.js`

Kept unchanged: cover is what stands on the line of fire in its last `COVER_M` 3 m before the target (nearer the shooter it is the shooter's own, and they shoot over it); the strongest blocker counts; tall things cover by their width against `BODY_W` 0.55 m; `share` of the aimed part behind it; `keeps = share × stop`; on a hit roll made, the share behind cover takes the round and `stop` decides whether it goes through (`into()`); the odds plaque says what the target is behind. No line, no work: a few dozen tests per shot, nothing per tick.

Changed:
- Blockers come from PLACES's fixtures and walls on the nav grid, not street rectangles. Each fixture carries `{ hM, tall, wM, material, thicknessMm }`.
- **`stop` is no longer one number.** It is `WEAPONS.stopOf(material, thicknessMm, round)`: a bulkhead stops a pistol and not a rifle's AP; frangible shipboard loads stop on nearly everything. COMBAT gives the geometry; WEAPONS gives penetration (§4.4 lists what play needs).
- **More postures** (§4.2), **elevation** (§4.3), **concealment as its own thing** (§4.5), **a precomputed cover field** for the AI (§4.6), a longer **dash to cover** (§4.7), and **cover wear** (§4.8).

### 4.2 Postures and body spans

Heights in metres above the floor the body stands on. Body size does not change with gravity.

| Posture | legs | torso | head | Notes |
|---|---|---|---|---|
| `stand` | 0–0.85 | 0.85–1.5 | 1.5–1.75 | tradecraft |
| `kneel` | 0–0.5 | 0.5–1.05 | 1.05–1.3 | new |
| `crouch` (down behind cover) | 0–0.4 | 0.4–0.9 | 0.9–1.15 | tradecraft |
| `rise` (up over cover to fire) | as tradecraft: over cover ≥ 1.2 m only head 0.3, torso 0.75, legs 1 behind; at a tall cover's corner, LEAN 0.65 of you behind | | | tradecraft |
| `prone` | 0–0.25 | 0.1–0.35 | 0.2–0.45 | new; firing prone raises the head span to 0.45 |
| `float` | as `stand`, at any height up to the deckhead | | | zero g (§14.5) |
| `tuck` | hidden by any cover ≥ 0.9 m tall and ≥ 0.6 m wide | | | zero g |

**Presentation in the open.** With no cover on the line, a target's posture still changes how much of it there is to hit. COMBAT gives WEAPONS a `presentation(target)` modifier for its shot DC (my call): stand 0, kneel +2, prone +4 (from a level shooter; +1 if the shooter is 3 m or more above). WEAPONS adds it to its DC formula and the log names it.

### 4.3 Elevation

A shooter above the target sees over low cover. With `zs` the shooter's eye height and `zt` the middle of the aimed part (both in the area's frame), and `dc` the cover's distance from the target along a line of length `d`:

`hEff = C.h − (zs − zt) × (dc / d)`

`share()` uses `hEff` in place of `C.h`. A shooter on a catwalk 4 m up, 20 m off, against a man crouched 1 m behind a 1 m crate: `hEff = 1.0 − (4 + 1.6 − 0.65) × 0.05 = 0.75 m`, so the crouched head (0.9–1.15) shows. Tall cover is unaffected unless the shooter is above its top.

### 4.4 Cover objects (what play needs from WEAPONS's penetration table)

Geometry is PLACES's; penetration is WEAPONS's. The last columns say what COMBAT needs to be true for the fights to read right (my calls; WEAPONS sets the real numbers).

| Fixture | h m | tall | w m | Material | Needs to stop: pistol / rifle ball / rifle AP / frangible |
|---|---|---|---|---|---|
| Sintered ice wall (under-ice towns) | 3 | yes | | ice ≥ 1 m | all / all / all / all |
| Ice berm, piled (Europa surface) | 0.8 | | | loose ice 0.6 m | all / 0.95 / 0.85 / all |
| Regolith-filled bags (Mars) | 1.2 | | | soil 0.5 m | all / all / 0.95 / all |
| Ship interior bulkhead | 2.4 | yes | | aluminium-composite 6 mm on frames | 0.95 / 0.6 / 0.3 / all |
| Pressure bulkhead or hull frame | 2.4 | yes | 0.4 | steel 20 mm | all / all / 0.9 / all |
| Hatch coaming | 0.25 | | | steel | all / all / all / all |
| Console | 1.1 | | | electronics on a frame | 0.7 / 0.35 / 0.2 / 0.9 |
| Crash couch | 1.0 | | | gel on a frame | 0.6 / 0.3 / 0.15 / 0.9 |
| Locker, full | 1.9 | yes | 0.6 | steel 1.5 mm and contents | 0.6 / 0.25 / 0.1 / 0.8 |
| Crate of rations or parts | 1.0 | | | | 0.5 / 0.2 / 0.1 / 0.7 |
| Water tank, full | 1.5 | | | water 1 m | all / all / 0.9 / all |
| Pipe bundle | 1.0 | | | | 0.8 / 0.5 / 0.3 / 0.95; a hit may open the pipe (PLACES) |
| Mess table | 0.75 | | | steel sheet | 0.3 / 0.1 / 0.05 / 0.6 |
| Crawler: engine block / body | 1.5 | | | | all / 0.8 / 0.5 / all; 0.4 / 0.15 / 0.05 / 0.6 |
| Riot shield, carried | 1.2 | | 0.6 | polycarbonate | 0.95 / 0.1 / 0 / 0.9; thrown objects all |
| Pressure window | 2.0 | yes | | thick laminate | 0.6 / 0.2 / 0.1 / 0.8; a hit may crack it (PLACES) |

### 4.5 Concealment

Concealment hides and does not stop. It acts through PEOPLE's perception (sight reach, the SEEN threshold) and so on targeting: what is not perceived cannot be aimed at, only fired at as an area (§5.4).
- **Smoke** (grenade, fire), **steam** (a burst line), **ice fog** (a decompressing compartment fogs as it cools: PLACES), **dust** (Mars, a blast), **darkness** (VIEWS's light, PEOPLE's reach), hanging tarps and curtains.
- A man in concealment who fires shows a muzzle flash: he is perceived for 0.5 s after each shot within 3 × his normal sight reach (my call). A suppressed muzzle halves it.
- Thermal and low-light sights see through some of it (WEAPONS optics, PEOPLE perception).

### 4.6 The cover field

The AI cannot afford exact `coverOf()` for every candidate position. On area load, PLACES's nav grid gets a **cover field** (my call):

`coverField[cell][sector 0..7][posture stand|crouch|prone]` = the best `keeps` (against rifle ball) a body in that cell gets from blockers within `COVER_M`, against a threat 30 m off in that compass sector, by tradecraft's `share()`. Stored as `Uint8Array` (0–255 for 0–1). A 200 × 200 cell area is 960,000 bytes; it is rebuilt only for cells within 4 m of a blocker that moves, breaks or is placed (my call). Exact `coverOf()` is still what every shot uses.

### 4.7 Getting behind cover

`hideSpot()` is ported with `HIDE_M` raised from 1.8 m to 15 m for the dash (§3.4), scoring candidate spots by `keeps` against the known threats from the cover field, then path length and path exposure (§7.4). Crouched there you stay down out of stop motion until you move (tradecraft). Aiming from it brings you to `rise` until you get down again.

### 4.8 Cover wears

Each round a cover with `stop < 1` stops lowers its stop against that round class by 0.02, down to half its starting value (my call, after tradecraft's armour `WEAR`). The log says so at the first loss ("The crate is coming apart."). Ice berms lose 0.01 a round and their height 2 cm per 10 rounds stopped.

---

## 5. Suppression and hardening

Suppression is fear made into numbers: the chaos arriving at a body (rounds cracking close, a friend's muzzle beside the ear, the room's gunfire, blasts, flashbangs, a friend hit) pooled, and **hardening** taken off it before it reaches the hands. What is left costs the rolls, slows the hands and the aim, and makes every exposing step a test. It is how fire superiority, bounding, the buddy rush and the flashbang work.

**Redesigned 2026-11-07** for the user's rule of that day (DESIGN.md's log): "in the chaos of CQB (noise, suppression from enemy fire and nearby friendly fire, flashbangs etc), performance should drop more sharply for a recruit than a battle hardened over-trained operator who would mostly be unaffected by that. In fact, suppression should be a roll modifier that picks up on those factors, with "hardening" (can name it differently) being an offset to it." Merged that day from two proposals (the systems proposal and the doctrine proposal) as a judge directed; "(my call)" marks the design's own decisions, for the user to overrule. Every table marked **[computed]** comes from the round's script, `/private/tmp/claude-501/olympus-build/hardening/merged.mjs` (its output `merged.out`, tables T0 to T17), which imports the built helpers read-only (`paceOf`, `oddsOf`, `grade`, `takeInOf`, `aimS`, `dcOf` and the fumble ladder's constants), so the times and odds are the code's.

**What this replaces.** §5 as written on 2026-11-05 scaled every input by `(1 − resist)`, `resist = min(0.6, WF / 150)`: beside three flashbangs a tier one (resist 0.6) took 72 points and was **pinned**, the same band as a boot recruit (100) [computed, T0]. A scale can never leave the best "mostly unaffected" without making everyone above WF 90 immune to everything; an offset can. `resist` is retired, and with it the banded −2/−4/−6 and −1/−3/−4 of §5.3, the aim column, WEAPONS §5.1's flat `fire` −3 on handling (built: `PRESSURE_MODS.fire` in `firearms.js`) and its unbuilt `danger` −1, and WEAPONS §7.3's "incoming fire −4": one cause, one entry (SKILLS §5.3).

### 5.0 The model in one page

1. **The pool is the chaos.** Per person `supp`, 0 to `SUPP_MAX` 120 points, fed by what arrives at him, an enemy's rounds and a friend's alike. **No skill scales an input** (my call): two men standing in the same place take the same chaos. Only physics changes it: your own team's bang called and expected, ear defenders, vacuum, blanks.
2. **Hardening is the offset.** `H`, 0 to 100, the user's word, is how much of that chaos a body has learnt to ignore: an experience term from Warfighting and an inoculation term from training under noise, bangs and fire, taught only so far by each teacher (§5.6, SKILLS §6.8). What reaches the hands is **felt = clamp(round(pool − H), 0, 100)**. The pool saturates, so **the most anyone can feel is 120 − H**: a fresh tier one 25, a five-year Raider 45, a sergeant 75, the private and the recruit 100 [computed, T1].
3. **Felt is a roll modifier**, as asked: −1 a 10 points, at most −10, on every hands-and-eyes roll, half on head-and-voice rolls. It slows the hands and the aim ×(1 + felt / 200), adds the take-in's built 200 ms a band (§25.4.2), and names the band (calm, under fire, suppressed, pinned) for the words, the nerve check and the NPC's choice. Calm at room range nothing changes a hit: "it's ok that only speed changes" (the user; §25.6.3).
4. **The startle** (§5.7): an input that raises felt by 10 or more at once freezes the body for `U(1.5, 3) s × (1 − H / 100)²`, halved for each bang or blast within 10 s of the last, the keys taken as in the take-in: at most about 3 s. Then the man tries, and the dice decide; the recruit fails at his hands, he is not locked out of them.
5. **The flash and the bang are physics** (§11.4): flash-blind by facing and a filtered visor, deafened without ear defenders, a concussion grenade's overpressure stuns anyone. Hardening touches none of them.
6. **The user's anchors hold** [computed, T4]: three flashbangs beside a **tier one** leave him at felt 10 (calm), −1, startled one tick (0.05 s), his Off safe and his RELOAD failing exactly as often as calm (5%, 14%: the natural 1s at `danger`; 0% and 0% once his 1s are caught, SKILLS §5.1, designed 2026-11-11) and 0.06 s slower. Beside a **boot recruit**: felt 98 (pinned), −10, startled 2.45 s in all, **Off safe failing 57% of the time and a RELOAD 93%** (as built in v0.0.9, §5.8); three Off safe attempts in ten slip off the lever (the rifle stays on safe, §5.8), and nearly half the reloads drop the fresh magazine.
7. **NPCs run the same pool, the same offset and one nerve check** (§7.11): on a loud entry they turn to the noise, take the entrant in with the same helper, and fight, rush for cover, fire blind, freeze, flee or surrender by their felt band, their Nerve and their doctrine; a choice holds until the band changes, so nothing flickers.

### 5.1 Inputs

Per actor `supp` from 0 to `SUPP_MAX` 120. Each input pools with saturation (my call, the doctrine proposal's), times its multipliers `k`:

```
supp ← supp + input × k × (1 − supp / SUPP_MAX)
```

| Input | Points | Notes |
|---|---|---|
| A supersonic round passing within `FULL_M` 1 m of the head, **an enemy's or a friend's** | 8 (heavy calibre 11) | the crack; linear to 0 at 5 m. "A round is a round": the user's "nearby friendly fire" (my call) |
| A subsonic round (pistol, suppressed) within 1 m | 5 | linear to 0 at 3 m |
| An impact within 2 m you can see or hear | 4 | spall, ice chips, sparks |
| **A shot fired by someone else within 1.5 m of your head** | `MUZZLE_PTS` 4 indoors, 2 in the open | the muzzle's blast: #2 firing a pair past your ear in a doorway (my call) |
| **A shot fired in your room or compartment**, farther off | `ROOM_SHOT_PTS` 1 a shot indoors, 0 in the open | the noise of a fight in a closed space (my call) |
| **A door kicked, rammed or breached within 5 m** | `KICK_PTS` 6 | |
| **The din**: shouting, an alarm, a crowd within 10 m | `DIN_PTS_S` 0.5 a second while it lasts | folded once a second, never per tick |
| An explosion (fragmentation, a breaching charge) outside your room | `min(60, 60 × (5 / rM)²)` | 15 at 10 m, 60 at 5 m and closer; in your room §11.3's QSP rule (+40 at 20 kPa and more) |
| **A flashbang** | `FLASH_PTS` 60 to everyone in its room; `FLASH_NEXT_PTS` 20 in the next room through an open doorway; in the open `60 × min(1, (5 / rM)²)` | was "+60 to the unprepared" (§11.4) |
| You are hit (armour-stopped included) | 25 | plus BODY's pain and stress |
| A friend hit within 10 m, in your perception | 10 | "a teammate hit"; for an NPC, anyone of his side (and his resolve −0.1, §7.10) |
| Your own shots; the throw of your own grenade | 0 | expected, and yours (my call) |

**The multipliers `k`** (my calls):

| Multiplier | Value | On |
|---|---|---|
| **Readiness** (`PREP_K`), on blasts and bangs | **prepared** ×0.25: your own team's, thrown by you, or called ("Bang out!", "Fire in the hole!") and heard within 3 s, or in your bundle's beat, you outside its room or eyes away; no startle, no flash · **forewarned** ×0.6: you saw it land (§3.5's `grenade` card) or heard "Bang!"; the startle ×0.5, and no flash if you took the card's Turn away · **unprepared** ×1: everything else, and every defender a bang is thrown at | the systems proposal's three tiers |
| **Ear defenders** (`EARPRO_K`) | ×0.6 | every sound-borne input: muzzle blast, shots in the room, a kicked door, the din, a blast's and a bang's points. **Not a round's crack**: the crack tells you a round passed, and ear defenders lower its loudness, not its meaning (my call) |
| **Combat EVA suit** (the user's overrule of question 6, 2026-11-07; built in v0.0.9) | the sound filtering at `EARPRO_K` ×0.6 on every sound-borne input, as ear defenders; **a filtered visor: no flash, no dazzle**; never deafened (§11.4) | the Corps' and its peers' standard kit: a superpower's line troops, not the range's utilities |
| **Vacuum** | rounds ×0.4 (no crack: what you see land); **a bang or a blast 0** beyond the explosive's own gases (§11.5): a flashbang in vacuum is a flash | §11.5 |
| **Training blanks** with the harness's near-miss tone | ×0.5 | blanks make no crack (§2.3); physics, not a discount |

Where a round passes is the shot's line: for an aimed miss, the miss distance at the target is `missM = 0.25 + 0.2 × (−margin)` m, at most 4 m, in a random direction perpendicular to the line (my call; WEAPONS may use it for strays). A miss by 1 cracks 0.45 m off; by 5, 1.25 m; by 10, 2.25 m. A good shooter's misses suppress hardest.

**[computed, T2] Flashbangs in your room, back to back**: unprepared 60 → 90 → 105; with ear defenders 36 → 61 → 79 (and forewarned the same); your own team's, called, 15 → 28 → 40.

**As built in v0.0.9** (`src/sim/combat/supp.js`, the build sheet 0.0.9 §8 items 7 to 12, 15, 24; each my call unless named):
- **Only the bang is wired as an input** (item 7): the crack, a friend's muzzle, room shots, kicks, the din and hits are built as pure functions (`inputPts`) and tested, but nothing posted them in v0.0.9 (v0.0.10 posts the coach's: the next block), so test-handling, test-range and calm test-pairs never write a combat block and run to the tick (test-handling 100/100/100). The training bang has a flashbang's physics (item 6): 60 points at 1.5 m in the open. **Indoors a bang reaches `FLASH_REACH_M` 10 m** until PLACES gives it its room (the integrator's); in the open `60 × min(1, (5 / rM)²)`.
- **Pressure stays `'evaluated'` on the range** (item 8): routine emerges through the felt modifier (SKILLS §5.3); `anchors` prints `danger` and `evaluated` side by side, and the user's claim holds in both.
- **One roller, one list, one time factor** (item 9): the modifier and `suppTimeK` reach every roll and every handling, aim and row time through `rollerOf` at the sub-step's start; movement is not slowed; a take-in's band is fixed at its first sighting. The take-in's body modifiers leave out the chaos's own Awareness entry (the band carries it: the chaos is paid once, not twice).
- **Decay runs at the exposed rate, 2 a second, throughout, in closed form** (item 10): no cover field, Stay down or Breathe until `test-stress`. From three bangs the pool is empty after 54 s.
- **The bang's physics live on the actor's combat block, deafness included** (item 12): `deafUntilMs`, not BODY's record; BODY's permanent acoustic-trauma loss waits for hearing as perception (0.0.10). Within `DEAF_REACH_M` 5 m an unprotected ear is deafened 1 to 6 h of game time; a voice within 2 m is still heard; the sim gates no speech on hearing this round. The coach, the thrower, is prepared (×0.25, no startle) but deafened if unprotected; nothing reads it.
- **The modifier's word in the calm band is "the noise"** (item 15): the tier one's −1 at felt 10 needs a name; the sum reads "the chaos 105 − your hardening 95 = felt 10: calm, −1" (`suppWords`; the log's modifier entry names it "the noise").
- **`SUPP_HOME`** (item 24): every suppression, hardening, startle, inoculation, flash, deafness and nerve constant lives in `supp.js` (`NERVE_K` too), in sim, core and data; the named exceptions are `SUPP_MS` (react.js, the take-in's 200 ms a band), `FLASH_MS` (look.js, a muzzle flash's lit time), `HARD_BLEED_PM` (wounds.js) and `HARD_MET` (needs.js), words that are not this model's (TECH §14).
- **Everyone in reach takes the bang** (item 23): the coach prepared, other NPCs written and unread; `nerveCheck` is built and unused.
- **The bang's call** (the contract the scene follows): `bang(state, bus, { id, x, z, atMs, byId, kind: 'training' })` on lived ticks emits fx `bang` once, then `supp` and `startle` per person, and returns `[{ who, pts, felt, startleMs, flash, deafUntilMs }]`.

**As built in v0.0.10** (`src/sim/combat/supp.js`; the build sheet `docs/build/0.0.10.md` §8 items 4 to 8, §10 item 34; each my call, overrulable):
- **The inputs the coach posts.** `shotNoise(state, bus, { id, x, z, byId, atMs, indoor, blank })` posts a shot's report to everyone whose muzzle-side reach holds them (`MUZZLE_M` 1.5 m of the muzzle; the room indoors within `DIN_M` 10 m): a blank's report is **2 in the open, 1.2 in ear defenders (`EARPRO_K` 0.6)**, 4 and 2.4 indoors, a shot in the room 1 each indoors and 0 in the open. `dinOf(state, bus, { id, x, z, s })` posts the horn and the blank rifle's din within `DIN_M` 10 m **a whole second at a time**: `DIN_PTS_S` 0.5 a second, 0.3 in defenders. The din only adds to a pool that already exists (it makes none of its own).
- **BLANKS_K (×0.5) is never applied to a blank's report.** It stands for the harness's near-miss tone in place of a crack, not for the muzzle blast: a blank's muzzle blast is a muzzle blast.
- **The forewarning by `heardCall(state, pid, call, atMs)`.** A "Bang!" heard within `CALL_HEARD_MS` 3,000 before a burst makes the bang forewarned (×0.6 and the startle ×0.5, `STARTLE_FOREWARNED_K`): 21.6 points in ear defenders against 36 unwarned. The call counts only if it is heard (`hearsVoice`, its first reader); in electronic ear defenders it always is. String 3 of test-stress is forewarned, not prepared as §25.18.3 designed ("Bang out!", ×0.25): the recruit flinches about 0.85 s and nobody else does.
- **`SUPP_MIN_PTS` gates only the making of a block** (supp's departure): an input under 1 point on a person with no block makes none; once the block exists every input lands (the din in ear defenders, 0.3 a second, would otherwise never count).
- **Only the coach's blanks are posted as shots** (the sheet's item 5): `shotNoise` is built for any shot, but the player's own rounds post nothing, since they would put the coach at his shoulder into the pool on test-pairs and move its saved state for nothing he reads. Calm test-pairs, test-handling and test-range write no combat block, to the digest.

**As built in v0.0.11**: the chaos's inputs read the live place's air (`supp.js` `kOf`; `VACUUM_K` wired). In vacuum the sound-borne inputs pool 0, a round x0.4, a bang deafens no one, and its flash still blinds by the angle. Conducted sound (your own hands, the rifle and suit, the deck through your boots) is not built: in vacuum you hear nothing (ROADMAP "anywhere", later steps).

### 5.2 Decay, Stay down and Breathe

After `SUPP_GRACE_MS` 1,500 ms with no input, the pool falls `SUPP_DECAY` **4 points a second behind cover** (`keeps ≥ 0.5`), **2 exposed**, **6 doing Stay down**, and twice the rate while doing **Breathe** (my calls; the systems proposal's). **The rate does not depend on the man** (it was `3 + WF / 20`): the hardened recover sooner because less of the pool reaches them, so Warfighting is counted once here, not twice. Kept as `{ supp, suppAtMs, suppRate }` and read in closed form, so nothing decays tick by tick and a skip lands on the same number.

**Breathe** (a step, `BREATHE_MS` 4,000, offered at felt 20 and up with no contact pending; taught at boot, so every marine has it; the doctrine proposal's, my call): tactical breathing, the pool's decay doubled while it runs. In cover it sheds 16 points more than waiting would.

**[computed, T6] From three bangs (pool 105) to felt under 45, then under 20**, seconds after the last bang, in cover / exposed / staying down / in cover with Breathe:

| Sheet (H) | under 45 | under 20 |
|---|---|---|
| boot recruit (7) | 14.8 / 28.0 / 10.3 / 10.8 | 21.0 / 40.5 / 14.5 / 17.0 |
| private (17) | 12.3 / 23.0 / 8.7 / 8.3 | 18.5 / 35.5 / 12.8 / 14.5 |
| corporal (36) | 7.5 / 13.5 / 5.5 / 4.5 | 13.8 / 26.0 / 9.7 / 9.8 |
| sergeant (45) | 5.3 / 9.0 / 4.0 / 3.4 | 11.5 / 21.5 / 8.2 / 7.5 |
| Raider, five years (75) | at once | 4.0 / 6.5 / 3.2 / 2.8 |
| tier one (95) | at once | at once (felt 10) |

So the recruit learns that cover and Stay down drain the chaos twice and three times as fast as standing in it, and that Breathe is worth its four seconds.

**As built in v0.0.10, Breathe** (`supp.js` `breatheOffer`, `breatheStart`, `breatheEnd`; the build sheet `docs/build/0.0.10.md` §8 items 11 to 14, §10 item 29; each my call):
- **Four counts of one second, no roll, never × `timeK`.** `BREATHE_MS` 4,000 in four sub-steps of `BREATHE_SUB_MS` 1,000 (in, hold, out, hold), the decay doubled (`BREATHE_K` 2) from the end of the grace, **the same 4 s for every sheet**: breathing is not the hands, so it is never slowed by the chaos and never scaled by skill (a skill-scaled Breathe would count Warfighting a third time). Never a free reset: 4 s of the marine's time for 8.00 points shed in the open when begun 3 s after the last input (6.00 when begun inside the 1.5 s grace).
- **Offered** from `BREATHE_FROM` 20 (felt), with no take-in window open and the marine not startled. With nothing facing him it is a fixed row on the first page of the panel ("Breathe · 4.0 s"); with a threat up it is paged and marked "! he's up", never struck; the DI offers it only with nothing facing. It is offered in "Three bangs" too (one model on both bays); the pairs bot never presses it.
- **A second Breathe first folds the earlier window's drain** into the pool (supp's departure; without it the pool rose by 8). The window is `breatheFromMs` to `breatheUntilMs` on the block.
- **It is cut at its sub-step's end** by a sighting (a sighting cuts it from the window's opening, supp's departure) or a startle ("Breathed 2.0 s, cut short."), and `leaveStop` ends a running one. **Out of the mode** it is a live step, which the pairs engine counts as out of the mode and still, so a breath in the standby keeps the turn armed.
- **What it shed is the pool under the same run without it** (the code review's finding): `pool` keeps the gap so far on the block (`breatheShedPts`, null once the end is written) before an input rewrites the record, carried × (1 − pts / `SUPP_MAX`) through the saturating add; `breatheEnd` adds the window's part since and reports it. A blank 2 s into a Breathe: 4.96 shed (1 before the fix), a bang 2.80 (0 before). A Breathe that shed nothing says "cut before it shed" on the card.
- **Measured** (the design review, seed 48213): Breathing in the rest after string 4 cut string 5's felt at the turn from 78.2 to 70.8 and the first round from 7.66 to 6.30 s; twice before the RELOAD moved its failures only from 74% to 63% (19 runs) while the split went from 6.35 to 11.30 s. A choice with a cost, not a trick.

### 5.3 Felt, the bands and what they do

```
felt(state, pid) = clamp(round(min(SUPP_MAX, supp) − hardOf(state, pid)), 0, 100)
bandOf(felt)     = calm 0 to 19 · under fire 20 to 44 · suppressed 45 to 69 · pinned 70 to 100
```

| Effect | Rule (my calls unless named) |
|---|---|
| **The modifier** | `suppMod(felt, skill) = −min(SUPP_MOD_MAX 10, round(felt × K / SUPP_MOD_PER 10))`, **one entry** `{ why: 'suppressed', v, src: 'env' }` (the log's words by band: "under fire", "suppressed", "pinned"). `K` 1 on the hands-and-eyes skills: Marksmanship, Weapon handling, CQC, Medicine, Demolitions, Tech, EVA, Zero-g, Driving; 0.5 on head-and-voice: Awareness, Fieldcraft, Tactics, Leadership, Comms, Social; 0 on Fitness. Its hover: "the chaos 105 − your hardening 17 = felt 88: pinned" |
| **Time** | handling actions, the aim, the throw and aid steps × `(1 + felt / SUPP_TIME_PTS 200)`: ×1.5 at felt 100. Movement is not slowed (adrenaline does not slow the legs) |
| **The take-in** | the built `SUPP_MS` 200 ms a band (§25.4.2), **the band now felt's**: `takeInOf`'s `band` argument is `bandOf(felt)` (`contact.js` passes 0 today) |
| **The nerve check** | one helper, `nerveCheck`: d20 + **Nerve** (SKILLS §2.2: `round(WF × NERVE_K[class])`, unchanged) + help (+2 when your NCO or team leader is within voice or radio and has said "Up! Return fire!" in the last 5 s: Leadership, §8.3) + resolve's term for NPCs (`round(10 × (resolve − 1))`, §7.10) against **`NERVE_DC0` 1 + round(felt / `NERVE_PER` 5)**: 10 at the suppressed band's floor and 15 at the pinned band's, where §5.3 had them, and 21 at felt 100. Asked from felt `NERVE_FROM` 45: of the player on an exposing step (failure: the step does not start, the time is lost, "You can't make yourself get up."); of an NPC for his choice (§7.11). The player chose to try; the dice decide whether the body obeys |
| **Stress** (BODY §9.1) | 0.3 a second at suppressed and 0.6 at pinned, on felt's band; BODY's acute fight inputs (a fight begun, shot at, a round through your space, a blow) × `(1 − H / 100)`; grief and trauma (a friend killed, killing, the combat stress load) never scaled: hardening is not immunity to loss (my call, BODY §9.3) |
| **Routine work** (SKILLS §5.1; built in v0.0.9: pressure stays 'evaluated' on the range) | unchanged, and it now emerges: work is routine when value + modifiers ≥ DC, the felt modifier included, so the suppressed lose routine and the hardened keep it. In an operation (`danger`, `fire`) nothing is routine anyway |
| **NPC behaviour** | §7.3's ladder and §7.11's choice read felt's band |

| Band | felt | hands and eyes | head and voice | time | take-in | exposing steps | NPC (§7.11) |
|---|---|---|---|---|---|---|---|
| calm | 0 to 19 | 0 to −2 | 0 to −1 | ×1 to ×1.10 | 0 | free | fights |
| under fire | 20 to 44 | −2 to −4 | −1 to −2 | ×1.10 to ×1.22 | +200 ms | free | fights, prefers cover |
| suppressed | 45 to 69 | −5 to −7 | −2 to −3 | ×1.23 to ×1.35 | +400 ms | the nerve check, DC 10 to 15 | the nerve check: fight, cover or blind fire, freeze |
| pinned | 70 to 100 | −7 to −10 | −4 to −5 | ×1.35 to ×1.5 | +600 ms | the nerve check, DC 15 to 21 | the nerve check: cover or blind fire, freeze, or by doctrine flee or surrender |

**[computed, T3] Felt / the hands-and-eyes modifier, by pool and hardening:**

| pool \ H | 0 | 7 (recruit) | 17 (private) | 36 (corporal) | 45 (sergeant) | 60 (recon) | 75 (Raider) | 95 (tier one) |
|---|---|---|---|---|---|---|---|---|
| 20 | 20 / −2 | 13 / −1 | 3 / 0 | 0 | 0 | 0 | 0 | 0 |
| 40 | 40 / −4 | 33 / −3 | 23 / −2 | 4 / 0 | 0 | 0 | 0 | 0 |
| 60 (one bang) | 60 / −6 | 53 / −5 | 43 / −4 | 24 / −2 | 15 / −2 | 0 | 0 | 0 |
| 80 | 80 / −8 | 73 / −7 | 63 / −6 | 44 / −4 | 35 / −4 | 20 / −2 | 5 / −1 | 0 |
| 100 | 100 / −10 | 93 / −9 | 83 / −8 | 64 / −6 | 55 / −6 | 40 / −4 | 25 / −3 | 5 / −1 |
| 120 (the ceiling) | 100 / −10 | 100 / −10 | 100 / −10 | 84 / −8 | 75 / −8 | 60 / −6 | 45 / −5 | 25 / −3 |

**[computed, T8] Rounds cracking within 1 m of the head (8 points each, friend or foe) needed to reach each band from calm, with no decay** (this replaces the 2026-11-05 table by WF; reprinted in v0.0.9 by felt rounded as the code reads it, `supp`): H 0: 3 / 7 / 13 · H 7: 4 / 9 / 15 · H 17: 6 / 11 / 19 · H 28: 8 / 14 / 25 · H 36: 9 / 17 / 31 · H 45: 12 / 20 / 45 · H 60: 16 / 30 / never · H 75: 23 / 80 / never · H 95: 45 / never / never (the unrounded figures printed before were 10 / 17 / 32, 12 / 21 / 47, 16 / 31, 23 / never / never and 47). Four rounds cracking close put a boot recruit under fire and nine suppress him; a sergeant needs twelve to come under fire. **Rifle fire by its noise alone never pins a Raider or a tier one** (the user's answer, 2026-11-07); and it suppresses a Raider only after 80 cracks with no pause between, which decay (§5.2) makes a minute of unbroken fire at one head, not a fight: what keeps them down is the real chance of being hit (below).

**[computed, T9] The nerve check on an exposing step** after one bang | after three (no ear defenders): the boot recruit (Nerve 2) felt 53, DC 12, 55% (65% with his leader's call) | felt 98, DC 21, 10% (20%); the private (Nerve 4) not asked | felt 88, DC 19, 30% (40%); the corporal (Nerve 9) not asked | felt 69, DC 15, 75% (85%); the sergeant (Nerve 11) not asked | felt 60, DC 13, 95%; the Raider and the tier one are never asked.

- **What still keeps a hardened man down** (my call, the doctrine proposal's): not fear but arithmetic. An exposing step under area fire shows its chance of being hit on its row, for every sheet ("Rise and fire · 0.4 s · the window is under fire: about 1 in 4 to be hit"). Suppressive fire works on the hardened through the odds of a hit, and on the green through the hands as well.
- **Showing it.** No meter (no omniscient UI). The instinct line names felt's band and offers the sensible step ("Bangs. Your hands are shaking. Get down and breathe." at pinned); exposing steps on the panel show the nerve check's odds; the modifier's parts are in the roll's hover and the log; VIEWS draws the rest (VIEWS §7.3, §11.2).
- **These replace tradecraft's flat "being shot at" −4 and −3**, and apply to everyone, NPCs included (tradecraft quirk 4 fixed), as the bands did.

- **As built in v0.0.10, the band term** (`supp.js` `stressGainOf`, `foldStress`; the build sheet `docs/build/0.0.10.md` §8 item 20, BODY §9.3): the stress felt's band adds is **`SUPP_STRESS_PER_S` 0.3 a second suppressed and 0.6 pinned** (0 below felt 45), solved exactly on the pool's pieces (the decay's closed form, felt rounded half up at the band thresholds) and **folded every `SUPP_STRESS_FOLD_MS` 5,000 of game time**, before every input and at a startle's end, through BODY's own `addStress` (which emits `body-event` kind `'stress'`). Lived and skipped gain the same to 0.01, with one exception: a skip that runs while a pool is up, at BODY's stress floor (0), leaves the body about 4.0 more than the same time lived, since the lived body decays what it gains between folds and the skipped one sits at the floor until its single fold (off the floor the bodies match, 39.035 both; the at-floor skip limit, left as built). It moves "Three bangs'" saved digest but not its rolls (asserted).

### 5.4 Area fire

Area fire is fire at a position, not a person: a window, a doorway, a corner, a last-known spot. It suppresses everyone near its line and sometimes hits.
- Each round rolls Marksmanship against `WEAPONS.shotDC(rangeM, 'torso') + AREA_DC 4`, against the most exposed occupant of the 1.5 m circle at the aim point (exposure from the cover field and posture). The felt modifier and body modifiers apply as usual.
- On success the round hits a random exposed part of that occupant (then WEAPONS's armour and BODY's wound).
- On failure the round passes `0.25 + 0.3 × (−margin)` m off (at most 6 m) and feeds §5.1 for everyone within reach of its line.
- An unseen target (concealment, a wall it is behind) can only be area-fired at. Bullets that penetrate the cover (§4.4) carry on into whoever is behind it.
- The log summarises a burst on one line ("Burst of 4 at the window: no hits; 3 within a metre of the man inside"), with each roll one click deeper (VIEWS).

### 5.5 Fire superiority

A side has fire superiority when the mean **felt** band of the opposing fighters it knows of is at least 2 (suppressed), or when the opposing side's rounds per 10 s, counted by those who perceived them, have fallen below 30% of its own (my call). Read on felt, noise alone cannot suppress professionals (enemy special forces top at felt 38), so against them superiority comes from the rounds' ratio and from hits. Leaders' brains read it to bound, flank or assault (§7.7). The player feels it through the instinct line ("Their fire's slackening.").

### 5.6 Hardening, the offset

```
hardOf(state, pid) = clamp( round(WF × HARD_K[class]) + inoc + HARD_AXIS_PTS 3 × nerve axis − toll, 0, HARD_MAX 100 )
HARD_K[class]      = soldier 0.75 · cop, criminal, spook 0.6 · spacer 0.36 · civilian 0           (3 × SKILLS §2.2's NERVE_K)
inoc               = 0 to INOC_MAX 25: training under noise, bangs and fire, capped by its teacher (SKILLS §6.8)
toll               = exhausted 10 · stress frayed 5 · a combat stress load over 60: 10 · morale very low 5 · concussed 5
                     · in pain at "bad" or worse 5 · in shock (blood under 70) 10;  at most HARD_TOLL_MAX 25 together  (BODY §9.3)
```

- **Two terms, the user's two words** (the doctrine proposal's split, my call): **experience** is Warfighting, the fights lived, through its class's weight (a miner's thirty years in suits are not thirty years under fire); **training** is the inoculation counter, earned in drills that make noise, bangs and fire and taught only so far by each teacher. A real fight teaches through Warfighting's XP and never adds to the inoculation counter, so a fight is counted once (my call: the judge's "experience counts twice" closed). Derived, never stored, in one home (`src/sim/combat/supp.js`, checked as `SUPP_HOME`), as the take-in is.
- **Warfighting counts in two places by design** (my call): in what reaches you (hardening's experience term) and in how you choose under what reaches you (Nerve, the nerve check's bonus). Decay reads neither (§5.2), and the nerve axis enters hardening only, never the check.
- **The three "nerve" words, settled** (my call): **Nerve** (capital N) is SKILLS §2.2's derived value, `round(WF × NERVE_K[class])`, the nerve check's bonus, unchanged with its classes; **the nerve axis** is PEOPLE §3.6's temperament, −3 jumpy to +3 steady (the key `nerve` is built and saved, so it keeps it), which adds 3 points of hardening a step and nothing else here; **resolve** is §7.10's NPC state from 0 to 1, renamed from "nerve". No formula mixes two of them.
- **The toll as built in v0.0.9** (sheet item 14; my call): the toll counts exhaustion, a frayed day, pain, shock and **morale very low as 5** (`needMods` already has it, where the sheet said 0); the combat stress load and concussion stay 0 until built (BODY §9.3's stress terms wait for `test-stress`). Test sheets carry a fixed inoculation (item 13): recruit 2, private 6, corporal 10, sergeant 12, Raider 22, tier one 25 (`inoc.fixed`, SKILLS §6.8), which `noteExposure` never moves, so "Again as …" and later strings compare like with like; a person with no counter reads `INOC_OF_TIER` by rank. Hardening reads as a word on C and the picker (§24, question 16 answered), the number and its parts in the hover.
- **The toll** (the doctrine proposal's, with the wound's two terms the judge found missing; my calls): the body takes hardening back while it lasts: exhaustion, a frayed day, a heavy combat stress load, very low morale, a concussion, the pain of a wound and shock. Nobody is invulnerable: a tier one exhausted, carrying a combat stress load over 60 and at very low morale is at H 70, and three bangs reach him at felt 35, under fire, −4 [computed, T16].
- **Hardening is shown** on C's WHAT YOU ARE in words and a number (SKILLS §6.8, VIEWS §8.2); never on others, whose state shows in their figure (§7.11).

**[computed, T1] Hardening by test sheet and by template** (SKILLS §11.1's middles; inoculation by tier my calls):

| Sheet or template (class) | WF | experience | inoculation | **H** | Nerve | the most that reaches him (120 − H) |
|---|---|---|---|---|---|---|
| boot recruit (test sheet) | 6 | 5 | 2 | **7** | 2 | 100 |
| **private** (test sheet; the player's start) | 15 | 11 | 6 | **17** | 4 | 100 |
| corporal (test sheet) | 34 | 26 | 10 | **36** | 9 | 84 |
| sergeant (test sheet) | 44 | 33 | 12 | **45** | 11 | 75 |
| Raider, five years (test sheet) | 70 | 53 | 22 | **75** | 18 | 45 |
| **tier one** (test sheet) | 93 | 70 | 25 | **95** | 23 | 25 |
| civilian, Mars (civilian) | 0 | 0 | 0 | 0 | 0 | 100 |
| ice miner, Europa (spacer) | 25 | 9 | 0 | 9 | 3 | 100 |
| insurgent cell member | 11 | 8 | 0 | 8 | 3 | 100 |
| insurgent veteran, cell leader | 32 | 24 | 3 | 27 | 8 | 93 |
| pirate, clan boarder (criminal) | 32 | 19 | 3 | 22 | 6 | 98 |
| corporate security (cop) | 22 | 13 | 3 | 16 | 4 | 100 |
| MSS tactical (cop) | 45 | 27 | 12 | 39 | 9 | 81 |
| UN Marine, line | 26 | 20 | 8 | 28 | 7 | 92 |
| recon marine | 56 | 42 | 18 | 60 | 14 | 60 |
| enemy special forces | 80 | 60 | 22 | 82 | 20 | 38 |

The test sheets' values are the doctrine proposal's, made by the formula; the systems proposal fixed them by hand at 3, 12, 25, 35, 70 and 84, which leaves the tier one at felt 21 (under fire, −2) under three bangs and the private at 93 (§24, question 17: the user may score both on the bay).

### 5.7 The startle

- **When**: an input raises felt by `STARTLE_FROM` 10 or more at once (the doctrine proposal's trigger: a bang, a blast, a charge, being hit, a friend hit close; a single crack, at 8, never does). Not when prepared.
- **How long**: `startleMs = ticks( U(STARTLE_MIN_MS 1,500, STARTLE_MAX_MS 3,000) × (1 − min(H, 100) / 100)² × STARTLE_REPEAT_K 0.5 ^ n × (forewarned ? 0.5 : 1) )`, at least one tick, `n` the bangs and blasts within `STARTLE_REPEAT_MS` 10,000 of the one before (the systems proposal's shape, my calls). A startle inside a startle runs to the later end. The startle reflex habituates with repetition and with training (§5.10's sources); squaring the factor makes the first years count and the last points matter. The base is half the old "stunned 3 to 6 s": that figure was the whole disorientation of a flashbang, of which the startle is the part that takes the keys; the flash's 5 s and the felt pool carry the rest (my call: the judge's "at most about 3 s", so the recruit tries and fails rather than watches).
- **During it, for the player**: the take-in's window re-used (§25.4.5): the world runs, every key but Space and Esc is refused, `game.js`'s act gate refuses every sim action, a running step finishes its sub-step and the rest is queued "Carry on: …"; no take-in starts (a person seen inside it is taken in from its end, with the felt of that moment). A save inside it loads and resumes on the same tick.
- **For an NPC**: nothing until it ends; it knocks an aim held on a door off its point (the muzzle drops), which he must bring back (my call, the systems proposal's).
- **Shown** (the doctrine proposal's): at its end the stamp **"FROZE 1.20 S"** over the figure, amber, in the take-in stamp's alphabet and place (VIEWS §7.4); the line "You flinch." the first time; J's line "Startled 1.20 s: the bang, the chaos 60 − your hardening 17 = felt 43."
- **As built in v0.0.9** (the build sheet §8 item 11, the fixers' calls; each my call): **FROZE is the frozen time in all**, startles within `STARTLE_JOIN_MS` 1,000 of the last one's end joined into one freeze, so three bangs 1 s apart read one stamp (the recruit 2.45 s on average, 2.55 s on seed 48213, the tier one 0.05 s), never `untilMs − fromMs`; the `startle` fact's `end` carries the same number. **A startle ends early if a reflex card holds time inside it.** The window re-used is the take-in's: `refusesAct`, the feet stopped, sightings deferred to its end (and through a flash-blindness), a stop-motion hold released inside it and handed back at its end in the mode.
  - **Whatever runs on the player finishes its sub-step**: a command in stop motion halts with its rest as "Carry on"; any other step with sub-steps left (a shot row, a careful Fire, a contact's answer, a command in live motion) is cut, its rest offered again. A take-in window held by a startle pauses at the startle's end and reports the sighting to the pause, the startle a part of its sum ("+ 0.85 (startled)"). Before the fix a Pair fired two rounds inside the private's 1.7 s startle.
  - **The face** (VIEWS §7.4): the keys but Space and Esc are refused, the stamp counts up and holds while a planned bang is due.
- **A concussion grenade's stun** (§11.3, ≥ 20 kPa) is overpressure, not a startle: 2 to 6 s for anyone, the tier one included, and hardening does not touch it.

**[computed, T5] Seconds startled in all**, one bang | three bangs 1 s apart; unprepared, then forewarned:

| Sheet (H, factor) | unprepared, one | unprepared, three | forewarned, one | forewarned, three |
|---|---|---|---|---|
| boot recruit (7, ×0.865) | 1.95 (1.30 to 2.60) | 2.45 (1.95 to 2.65) | 0.97 | 1.64 |
| private (17, ×0.689) | 1.55 (1.05 to 2.05) | 2.21 (1.75 to 2.50) | 0.78 | 1.35 |
| corporal (36, ×0.410) | 0.92 (0.60 to 1.25) | 1.57 (1.05 to 1.90) | 0 | 0.35 |
| sergeant (45, ×0.303) | 0.68 (0.45 to 0.90) | 1.19 (0.80 to 1.60) | 0 | 0.25 |
| Raider, five years (75, ×0.063) | 0 (felt 0) | 0.12 (0.10 to 0.15) | 0 | 0 |
| tier one (95, ×0.003) | 0 (felt 0) | **0.05, one tick** | 0 | 0 |

### 5.8 The user's anchors [computed]

**Three flashbangs beside him**: 1.5 m behind him on the 25 m bay, 1 s apart, unprepared, no ear defenders, his back to them (no flash); pressure `danger` (nothing routine); the pool as the last bang lands. Off safe is the built `selector:semi` (DC 6, thumb work, `paceOf²`); RELOAD the built `reload:speed` (drop DC 5, the reach unrolled, seat DC 9, release DC 6). "Fails" is any grade under pass (×1.6 that sub-step's time; on a magazine action the magazine believed `?`); "drops" is WEAPONS §5.4's (short by 6 or more, or a natural 1 under Weapon handling 10 two times in five): the rifle swings onto its sling for Off safe, the fresh magazine falls for the RELOAD [T4]:

| Sheet (H) | Bangs | Startled in all, s | Pool → felt (band) | Mod | Time | Take-in | Off safe: fails / drops | Off safe, s | RELOAD: fails / drops | RELOAD, s | A round at 7 m hits |
|---|---|---|---|---|---|---|---|---|---|---|---|
| boot recruit (7) | 0 | 0 | 0 → 0 (calm) | 0 | ×1.00 | +0 | 5% / 2% | 0.67 | 28% / 2% | 3.27 | 95% |
| | 1 | 1.94 | 60 → 53 (suppressed) | −5 | ×1.27 | +400 ms | 30% / 5% | 0.84 | 71% / 20% | 4.13 | 70% |
| | **3** | **2.45** | 105 → **98 (pinned)** | **−10** | ×1.49 | +600 ms | **57% / 31%** | 0.99 | **93% / 45%** | 4.87 | 45% |
| private (17) | 0 | 0 | 0 → 0 | 0 | ×1.00 | +0 | 5% / 0% | 0.40 | 14% / 0% | 2.53 | 95% |
| | 1 | 1.55 | 60 → 43 (under fire) | −4 | ×1.22 | +200 ms | 5% / 0% | 0.49 | 19% / 0% | 3.08 | 95% |
| | 3 | 2.21 | 105 → 88 (pinned) | −9 | ×1.44 | +600 ms | 20% / 0% | 0.58 | 57% / 11% | 3.65 | 80% |
| corporal (36) | 1 | 0.92 | 60 → 24 (under fire) | −2 | ×1.12 | +200 ms | 5% / 0% | 0.32 | 14% / 0% | 2.39 | 95% |
| | 3 | 1.57 | 105 → 69 (suppressed) | −7 | ×1.34 | +400 ms | 5% / 0% | 0.38 | 14% / 0% | 2.87 | 95% |
| sergeant (45) | 1 | 0.68 | 60 → 15 (calm) | −2 | ×1.07 | +0 | 5% / 0% | 0.24 | 14% / 0% | 2.04 | 95% |
| | 3 | 1.19 | 105 → 60 (suppressed) | −6 | ×1.30 | +400 ms | 5% / 0% | 0.29 | 14% / 0% | 2.46 | 95% |
| Raider, five years (75) | 1 | 0 | 60 → 0 (calm) | 0 | ×1.00 | +0 | 5% / 0% | 0.13 | 14% / 0% | 1.42 | 95% |
| | 3 | 0.12 | 105 → 30 (under fire) | −3 | ×1.15 | +200 ms | 5% / 0% | 0.14 | 14% / 0% | 1.63 | 95% |
| **tier one (95)** | 0 | 0 | 0 → 0 | 0 | ×1.00 | +0 | 5% / 0% | 0.08 | 14% / 0% | 1.15 | 95% |
| | 1 | 0 | 60 → 0 (calm) | 0 | ×1.00 | +0 | 5% / 0% | 0.08 | 14% / 0% | 1.15 | 95% |
| | **3** | **0.05** | 105 → **10 (calm)** | **−1** | ×1.05 | +0 | **5% / 0%** | 0.09 | **14% / 0%** | **1.21** | 95% |

**As built in v0.0.9, the anchors as printed by `anchors`** (4,000 trials a cell through the real roller; each row: pool → felt, modifier, startled in all, take-in 7 m calm → bangs; Off safe failing at `danger`, then at the range's `evaluated`; RELOAD likewise; "drops" in the first figure's second part). These replace the table's figures where they differ (the table's 55% / 93% were the sheet's estimates; the failures now all leave the lever on safe, so "drops" for Off safe means the slip):
- **Boot recruit (7)**: 98, pinned, −10, startled 2.45 s in all (2.55 s on seed 48213), take-in 650 → 1,250 ms, **Off safe 5% → 57%** (31% onto the sling, WEAPONS §5.4: the lever stays where it was), **RELOAD 27% → 93%** (45% drops), turn to first round **2.72 s calm → 6.98 s**.
- **Private (17)**: 88, −9, 2.21 s, take-in 550 → 1,150 ms, Off safe 5% → 20%, RELOAD 15% → 57%, 2.02 → 3.39 s.
- **Corporal (36)**: 69, −7, 1.57 s, take-in 350 → 750 ms, Off safe and RELOAD unchanged (5%, 15%), 1.24 → 1.89 s.
- **Sergeant (45)**: 60, −6, 1.19 s, 250 → 650 ms, unchanged, 1.06 → 1.65 s.
- **Raider (75)**: 30, −3, 0.12 s, 100 → 300 ms, unchanged, 0.74 → 1.01 s.
- **Tier one (95)**: 10, −1, **0.05 s**, 50 → 50 ms, Off safe **5% → 5%**, RELOAD **15% → 15%**, **0.60 → 0.61 s**.
The same at `evaluated` as at `danger` (the range's pressure): the tier one's rates equal calm's either way, and the recruit's Off safe fails 57% either way. The RELOAD half of the anchor under the bangs is left to `test-stress` (the turner during the RELOAD): this scene's bangs are over before the first reload. The per-seed scene rate for the recruit's Off safe (37% a try over 40 seeds, failing at least once on 38% of them, against 55 to 57% here) is lower than the anchor's because the tries come at felt 94 or less after decay; the quick bound (at least 40% of seeds failing at least once) passes at 63% on 8 seeds.
- **The tier one**: every rate equal to calm's, 0.09 s to thumb off safe instead of 0.08, a RELOAD 0.06 s longer, one tick lost to the startle: "having three flashbangs go off right next to him would barely affect his ability to operate his weapon".
- **The recruit**: thumbing the safety off fails more often than not and swings the rifle onto its sling three times in ten; a RELOAD fails nine times in ten and drops the fresh magazine nearly half the time: "likely to fail simple actions like thumbing safety off or reloading". He is startled 2.45 s and then tries: the dice, not the keys, fail him.
- **Between**: the private fails his RELOAD more often than not; from the corporal up the hands hold and only time and the take-in pay. The 5% and 14% are the natural 1s at `danger`, which bite everyone in an operation (SKILLS §5.1).
- **Designed 2026-11-11, to build in the shoot house rework: caught 1s** (SKILLS §5.1; the user's "perk of high skilled operators"). A natural 1 at `danger` is caught, a success at ×1.5 of that sub-step's time, when the hand's Weapon handling is 15 or more and the step is made by 10 without the die, the felt modifier counted. The table's 5% and 14% then become, for Off safe and the RELOAD: **tier one 0% and 0%** calm, at one bang and at three (each 1 costs ×1.5 on its sub-step: Off safe 0.08 → 0.12 s on a 1 in 20); **Raider 0% and 0%** at 0, 1 and 3 bangs; **sergeant** 0% and 5% at one bang (the seat, DC 9, stays short of the margin), 5% and 14% at three (felt 60, −6); **corporal** 5% and 14% at one and three; the private and the recruit unchanged. So the user's anchors hold more sharply: the tier one under three flashbangs fails exactly as often as calm, which is now never, and the recruit's 57% and 93% stand.
- **With ear defenders** (×0.6 on the bangs; pool 79) [T4]: the recruit is at felt 72, −7 (Off safe fails 40%, RELOAD 82%), the private 62, −6 (5%, 28%), the corporal 43, the sergeant 34, the Raider 4 and the tier one 0: ear defenders are worth wearing, and the shoot house's strings are fired in them (§25.18).
- **Turn to the first round**, the string turned 2 s after the third bang (`test-pairs&setup=bangs`, §25.18) [T14]: the boot recruit **6.98 s on average (14.6 s at the 95th percentile)** against 2.64 s calm, his Off safe failing at least once 55% of the time; the private 3.39 s (1.99 calm); the corporal 1.89 (1.24); the sergeant 1.65 (1.06); the Raider 1.01 (0.74); **the tier one 0.61 s (0.60 calm)**.

### 5.9 State, modules and the tick

```js
// the combat block (§2.1), on the live actor; absolute ms only; additive, no SAVE_SCHEMA bump
{ supp: 88, suppAtMs: 2051350800, suppRate: 2, startleFromMs: 2051350900, startleUntilMs: 2051351300, startleMs: 2400, startleWhy: 'bang',
  frozeAtMs: 2051350900, lastBangMs: 2051350800, bangN: 2, blindUntilMs: null, dazzleUntilMs: null, deafUntilMs: null,
  choice: 'cover', choiceAtMs: 2051351100, resolve: 0.9 }   // built in v0.0.9: the first thirteen fields; choice, choiceAtMs and resolve wait for test-breach (§7.11)
// the sheet (SKILLS §15.1): the inoculation counter, the player's and persistent people's; generated NPCs read their tier's
person.skills.inoc = { pts: 6, n: 0, sol: 0 }
```

- **One module** (the systems proposal's, my call): `src/sim/combat/supp.js` holds the inputs and their multipliers, `addSupp`, the closed-form decay (`suppAt`), `hardOf`, `feltOf`, `bandOf`, `suppMod`, `suppTimeK`, `nerveCheck`, `startleOf` and the flash's terms; checked by the syntax test as `SUPP_HOME`: no other module defines a suppression, hardening or startle constant, as `REACT_HOME` keeps the take-in in `react.js`. Every scene calls it: `test-pairs`, `test-stress`, the shoot house, `test-patrol`'s blanks, the career's fights.
- **How it reaches the rolls** (the judge's gap, the first patch's exact lines): `combat/roll.js`'s `rollerOf(…).mods(skill, ctx)` appends `suppMod(feltOf(state, pid, ms), skill)` as one `env` entry (absent at 0), so every handling step, every shot and every plaque carries it and the odds and the roll stay one list; `firearms.js` drops `PRESSURE_MODS.fire` from `doAction`'s `ctx.mods`; `firearms.js`' `actionMs` and `shot.js`' `aimMsOf` multiply by `suppTimeK(felt)`; `contact.js` passes `band: bandOf(felt)` to `takeInOf` where it passes 0 today (`react.js` itself is unchanged).
- **As built in v0.0.9** (`supp.js`, `blockOf`): the block's fields are `supp`, `suppAtMs`, `suppRate`, `startleFromMs`, `startleUntilMs`, `startleMs`, `startleWhy`, `frozeAtMs`, `lastBangMs`, `bangN`, `blindUntilMs`, `dazzleUntilMs`, `deafUntilMs` (integers or 0.01-rounded; absent reads calm); `person.skills.inoc` is `{ pts, n, sol, fixed }`. The helpers `feltOf`, `hardOf`, `hardWord`, `suppMod`, `suppTimeK`, `suppNow` (the startle's `soFarMs`, the freeze so far) and `suppWords` (the sum, `, −9`) are shared (CONTRACTS §13). A calm game is unchanged to the byte: the v0.0.8 save at a test-pairs pause gives v0.0.8's own panel, roller lists, aim and pull (the digest 1e1ee51edbb6f3).

- **As built in v0.0.10** (`supp.js`): the block gains **`breatheFromMs`**, **`breatheUntilMs`** (the running Breathe's window; absent reads none), **`breatheShedPts`** (the shed so far, null once the end is written) and **`stressAtMs`** (the time to which the stress band term has been folded). `stressAtMs` is kept when the pool reads 0 (dropping it counted the stress twice); the first fold of a v0.0.9 save counts from the pool's own time, so it loads with no upgrade. New shared helpers: `breatheOffer`, `breatheRow`, `stressGainOf`, `shotNoise`, `dinOf`, `heardCall` (CONTRACTS §13).
- **The tick** (TECH §3.1): inputs are posted in `rules` where shots, blasts and kicks already resolve, each a pass over the actors in PLACES's bins within the input's reach (5 m for a crack, the room for a bang), never per tick; the pool is folded only at an input or a change of cover and read in closed form; the startle's end and the window's in `input`, as the take-in's; NPC choices in `think` (§7.11). Facts on the bus: `supp { who, input, why, supp, felt }` and `startle { who, ms }` (CONTRACTS §11).
- **Determinism**: the startle on `stream(seed, 'combat:startle', who, inputId)`, the nerve check on `combat:nerve` keyed by actor and decision time, the flash's facing read from the geometry, never drawn.

### 5.10 Sources

- Stress inoculation: D. Meichenbaum, *Stress Inoculation Training* (1985); T. Saunders, J. Driskell, J. Johnston and E. Salas, "The effect of stress inoculation training on anxiety and performance", *Journal of Occupational Health Psychology* 1 (1996) 170 to 186; J. Driskell, J. Johnston and E. Salas, "Does stress training generalize to novel settings?", *Human Factors* 43 (2001) 99 to 110.
- Shooting under threat, and training with it: R. Oudejans, "Reality-based practice under pressure improves handgun shooting performance of police officers", *Ergonomics* 51 (2008) 261 to 273; A. Nieuwenhuys and R. Oudejans, "Training with anxiety", *Cognitive Processing* 12 (2011) 277 to 288; their review in *Psychological Research* 76 (2012) 747 to 759; J. Vickers and W. Lewinski, *Human Movement Science* 31 (2012) 101 to 117 (elite officers fire later, hold their gaze and hit more).
- Anxiety keeps accuracy at the cost of time until it cannot: M. Eysenck, N. Derakshan, R. Santos and M. Calvo, "Anxiety and cognitive performance: attentional control theory", *Emotion* 7 (2007) 336 to 353 (the user's "only speed changes" when calm, and the sharper drop for the novice under chaos).
- The startle and its habituation: C. Landis and W. Hunt, *The Startle Pattern* (1939); M. Davis, *Journal of Comparative and Physiological Psychology* 72 (1970) 177 to 192; F. Graham, "The more or less startling effects of weak prestimulation", *Psychophysiology* 12 (1975) 238 to 248 (a warning weakens it: the prepared and forewarned factors).
- The freeze before action: K. Roelofs, *Phil. Trans. R. Soc. B* 372 (2017) 20160206; A. Artwohl, *FBI Law Enforcement Bulletin* 71(10) (2002) 18 to 24 (officers after shootings: diminished sound 84%, tunnel vision 79%, temporary paralysis 7%): a freeze of seconds at most, the rest shown as the narrowing of the picture and the sound (VIEWS §7.3, §11.2).
- The M84 stun grenade: about 170 to 180 dB at 1.5 m and millions of candela, disorienting for about 5 s (FM 3-23.30's entry; to check against the manual).
- Battle inoculation: the British Army's live fire overhead in training from the Second World War; the US Army's night infiltration course.
- Heart-rate thresholds for motor skills (Siddle 1995; Grossman and Christensen 2004) are popular and weakly evidenced: used for the shape only (hands go first, then the head), never for a number.

---

## 6. Knowledge in a fight

Each side keeps a **contact board**: `contacts[id] = { x, z, seenMs, by, how: 'seen'|'heard'|'reported', conf }`. Tradecraft's rule from the tailing teams (2026-11-03) governs it: a side shares only what someone saw or heard, as the last position and heading, and the board ages.
- **Seen** by any member (PEOPLE's perception): `conf` 0.9, refreshed while in sight.
- **Heard**: a shot within `HEAR_M = 70 × loud × √(P / 101.3)` m (tradecraft's 70 m, scaled by the air's pressure, my call) gives a heard contact on the bearing ±30°, range ±50%, `conf` 0.3 (VIEWS's heard plaque). Tactics vs 15 halves both errors ("how many shooters, from the sound"; SKILLS's DC table); Tactics vs 20 gives range by crack-thump.
- **Reported**: a member's Report contact step (§3.4) copies their contacts to the board after the step, with `conf` scaled by the Comms grade (miss 0.5, pass 0.8, good and better 0.9). NPCs report on their own when they first see a contact, with the same step time.
- **Ageing**: `conf` falls by 0.02 a second out of sight; under 0.2 the contact becomes a "last known" mark the AI may area-fire or search; it is forgotten after 120 s (my calls).
- **Without radios** (most irregulars), a report reaches only those within voice range (§8.1).

What the player sees is their own perception plus their side's board through their HUD (helmet datalink) or through their ears. The mind (Tab) shows the board's marks with their ages (VIEWS). Nothing else.

### 6.1 `threatKnown(state)`: the threat the player knows of

TIME refuses every skip while the player knows of a threat (TIME §5.1.6, and check 2 of TIME §5.3). PLACES's fire rule and the instinct's refusal ("Not with them out there.") read the same answer. COMBAT owns the function, in `src/sim/combat/threat.js`:

```
threatKnown(state) → { known, why, sinceMs, alarm }
  why:   'hostile' | 'shots' | 'hit' | 'alarm' | null
  alarm: the alarm's kind when why is 'alarm' (table below), else null
```

`known` is true when any of the four reasons holds. Each is read from the player's knowledge only, never from the truth:
- **hostile**: the player has perceived a hostile within `THREAT_SEEN_M` 100 m in the last `THREAT_RECENT_S` 60 s.
  - A hostile is a contact on the player's side's board (above), or someone the player saw commit a hostile act or show hostile intent (§9.1, items 1 and 2).
  - Nobody counts who is down and still, detained, surrendered or otherwise hors de combat (§7.10).
  - In an exercise the opposing force counts as hostile (§2.3).
- **shots**: the player has heard a shot (PEOPLE's hearing, `HEAR_M` above) in the last 60 s. Two kinds of fire do not count: range fire on a range in session, and fire the player knows to be his own side's training or practice.
- **hit**: the player has taken fire in the last 60 s: he was hit, or a round or blast gave him a §5.1 suppression input.
- **alarm**: one of the alarms below is active and covers the player's area. They are TIME §7.1's A class, plus PLACES's fire rule.

| Alarm | Covers | Answered by (these activities may skip) |
|---|---|---|
| general quarters (Condition I, §13.2) | the hull | `strapped-in` and `wait-at-station` (§13.3) at your assigned couch or station; a damage-control job you were sent to (§13.8) |
| base alert, stand-to | the site | `watch` at your stand-to post; `stand-by` at the muster point you were ordered to |
| fire (PLACES: any fire burning in the site), decompression, toxic gas | the site; for decompression and gas, the compartment and its neighbours | the damage-control or firefighting job you were sent to; `stand-by` at a muster point outside the affected zone |
| incoming fire warning | the area | `stand-by` or `strapped-in` in a shelter that PLACES rates against it |
| solar particle event | the hull or the site | rest, read, sleep or `stand-by` in the storm shelter (PLACES §3.10) |

- **Never refused**: being carried, being evacuated as a casualty (§12.4) and being unconscious (TIME §4.5's `out`). In all three the player cannot act.
- **Words.** `sinceMs` is when the newest reason began. The instinct words the refusal from `why`: "Not with them out there." (hostile) · "Shots, close. Not now." (shots, hit) · "General quarters. Get to your couch." (alarm).
- **State.** `state.mind.threat = { seenMs, seenId, shotMs, takenMs }` is plain data and is saved, so a save loaded mid-threat still refuses the skip. It sits in PEOPLE's `mind` key (CONTRACTS §9), so COMBAT writes it only through PEOPLE's `noteThreat(state, why, atMs, whoId)` and reads it through `threatOf(state)` (PEOPLE §8.8); COMBAT owns what it means. Alarms are read from PLACES's records and the ship's.
- **Cost.** One pass over the player's board and the live alarms. It runs when a skip asks and at each fast-forward chunk (§21), never per tick.

---

## 7. Squad and fire-team tactics; the NPC combat AI

### 7.1 Organisation and roles

DESIGN fixes the units: fire team 4, squad 13 (three teams and a leader), platoon about 42. Roles in a team (my call, after the US Marine fire team): **TL** team leader (rifle, often the grenade launcher), **AR** automatic rifleman (the team's base of fire), **GR** grenadier, **R** rifleman (often the newest man, often the player at the start). The squad leader (**SL**) has a radio on the platoon net; a Navy corpsman (**HM**) is attached to the platoon and moves with a squad.

### 7.2 Three brains

1. **Fighter brain** (every combatant, every side): a priority ladder (§7.3) that turns the situation and the current task into timed actions.
2. **Team brain** (the team leader, NPC or player): turns an order or a drill phase into tasks for each member: a slot to occupy, a sector to watch, a target to engage, a moment to move.
3. **Squad brain** (the squad leader): chooses and runs drills, gives team orders, reports up.

Above the squad, platoon and company are run by the operation's script (CAREER's deployments) or by the off-screen exchange (§16). NPC leaders use the same order system the player does (§8); their orders are heard, delayed and sometimes missed.

**Succession.** A team leader may be down, out of contact or frozen (the conditions of §8.5). Then the team brain passes to the next in its chain: the AR, then the others by rank and date of rank. The player can take it first (§8.5). The squad brain passes in the same way, to the senior team leader.

Combat sense scales with skill: a fighter's position choices carry noise of standard deviation `2 × (1 − min(1, Fieldcraft / 24))` on the score of §7.4, and leaders' drill choices are read from their Tactics (my calls). A poor fighter picks worse cover; a poor leader picks the wrong drill.

### 7.3 The fighter's ladder

A task is replaced only by one higher on the ladder (longhaul's crew-AI rule, `crew-ai.js` `taskLevel`).

| Level | Task | When |
|---|---|---|
| 0 | none | down, out cold, held, carried (BODY decides) |
| 1 | escape blast | a grenade within its lethal reach is perceived: dive away or behind cover |
| 2 | self-aid | conscious, bleeding at 3 %/min or more: BODY's tourniquet or pressure on yourself, behind cover if within a dash |
| 3 | survive pinned | felt pinned (§5.3): §7.11's choice (cover or blind fire, freeze, by doctrine flee or surrender); stay down, crawl to better cover |
| 4 | obey | an order received and not yet done (compliance, §8.3) |
| 5 | buddy aid | a casualty within 5 m, our side not suppressed (the aid-giver's felt band ≤ 1), or ordered |
| 6 | engage | a target on the board in arc: aim, fire, by the fire-distribution rule (§7.5) |
| 7 | get to cover | exposed (cover keeps < 0.3 against a known threat) |
| 8 | weapon | reload when the magazine is below a third and in cover ("Reloading!"); clear a stoppage at once |
| 9 | report | a contact seen and not on the board |
| 10 | scan | watch the assigned sector |

### 7.4 Choosing a position

When a fighter or a team brain needs a spot (a bound's end, cover, a support-by-fire position), it samples 16 candidate cells: 12 in the zone (toward the objective at the bound's length ±40%, or within 15 m for cover) and 4 next to the strongest cover objects in it. Each is scored (my call):

```
score(c) = 4.0 × min over known threats t of coverField[c][sector(c→t)][crouch]
         + 1.5 × fieldOfFire(c)             (line of sight from 'rise' at c to the objective or the threats: 0..1)
         + 1.0 × progress(c)                (along the bound's axis, 0..1)
         − 0.08 × pathM(c)
         − 0.5 × pathExposure(c)            (seconds exposed to known threats along a straight-line path, 5 samples)
         − 2.0 × onFriendlyLine(c)          (within 1 m of a friend's line of fire)
         − 1.0 × bunched(c)                 (within 3 m of a teammate: "one grenade gets two")
         − 3.0 × inBlast(c)                 (inside a known grenade's or charge's reach)
         + noise(Fieldcraft)
```

Cost: 16 cells × at most 4 threats of table lookups, 16 line-of-sight tests and 16 short path estimates per decision (§19).

### 7.5 Fire distribution and fratricide

- A fighter engages, in order: whoever is firing at it; contacts in its sector; the nearest exposed contact. If two or more friends already engage a target, it takes another unless that target is the only one (my call).
- **Friendly lines.** Before every shot and every area-fire round, the shooter checks the line for friends within 1 m of it out to the target and 10 m beyond (tradecraft's stray test turned into a rule). NPCs refuse and shift or wait. The player gets the `friendlyLine` reflex (§3.5) and the odds plaque names the friend ("Cpl Okafor is 0.6 m off your line"). Muzzle discipline outside the shot is WEAPONS's.
- **Shift and lift.** A base of fire stops engaging a zone the moment an order says "Shift fire" or the assault element crosses the limit of advance (§7.7). Base-of-fire NPCs keep their fire 15° off the line to friendly assaulting troops within 50 m of the target (my call).

### 7.6 Formations and movement

| Technique | Use | How |
|---|---|---|
| Travelling | contact unlikely | the squad moves together; teams in wedge, intervals 10 m on open ground, 5 m in a settlement, 2–3 m in a tunnel, 1.5–2 m single file aboard ship (my calls) |
| Travelling overwatch | contact possible | the lead team moves; the trailing teams follow 30–50 m behind, ready to support |
| Bounding overwatch | contact expected | one team overwatches from positions covering the next bound, calls "Set"; the other bounds 30–50 m (10–20 m in tunnels and ship corridors) to positions chosen by §7.4, calls "Set"; then they swap (alternate bounds) or catch up (successive) |
| Buddy rush | under fire | in pairs (AR with R, TL with GR): one fires area fire at the threat ("Covering!"), the other rushes 3–5 s to the next cover ("Moving!"), then they swap. The mover waits until the coverer is firing |
| Individual movement | under fire | low crawl when band ≥ 2 and cover is low; high crawl when band 1; rush when cover is more than 5 m away and band ≤ 1 |

Sectors: in a wedge the TL watches the front, the AR the left front, the GR the right front, the R the rear; in a file they alternate left and right with the last man on rear security.

### 7.7 Drills as data

A drill is a list of phases, each with tasks for the leader and the teams and a condition to move on. The squad brain runs one drill at a time and can switch. Each drill is plain data in a module of its own, `src/sim/combat/drills/<id>.js`, with its prose header (TECH §1.3, correction 12: data are `.js` modules, never `.json` files).

```json
{ "id": "react-to-contact", "level": "squad",
  "phases": [
    { "id": "return-fire", "all": { "task": "return-fire", "posture": "down", "seekCoverM": 8 }, "until": { "elapsedS": 5 } },
    { "id": "fire-superiority", "leader": { "task": "assess", "report": "platoon" }, "teams": { "task": "area-fire", "target": "reported" },
      "until": { "fireSuperiority": true, "orElapsedS": 60 } },
    { "id": "decide", "leader": { "choose": [
        { "drill": "squad-attack", "if": "ourStrength >= 1.5 * theirStrength && flankRoute" },
        { "drill": "break-contact", "if": "theirStrength >= 1.2 * ourStrength || orders.breakContact" },
        { "drill": "hold-and-call", "else": true } ] } }
  ] }
```

`ourStrength` and `theirStrength` are §16.1's power, computed from what the leader knows (the board), not from the truth. A leader's Tactics check vs 15 at "assess" decides whether the estimate uses the board's count (pass) or is off by ±50% (miss) (my call).

The set (my call, after the US battle drills):

| Drill | Phases |
|---|---|
| `react-to-contact` | return fire and get down → report and win fire superiority → decide |
| `squad-attack` | one team as base of fire (the AR-heavy one) suppresses; two teams move by a covered route (a path on the nav grid minimising exposure to the board's contacts) to an assault position on a flank → "Shift fire" → assault through by buddy rush → consolidate (360° security) → reorganise (ammunition, casualties, equipment reports) |
| `break-contact` | the team in contact keeps firing while the others bound back; alternate until out of contact; smoke if carried |
| `react-to-near-ambush` | the team in the kill zone assaults straight into the ambush at once; the others support by fire |
| `react-to-far-ambush` | return fire, get down, then as `squad-attack` |
| `enter-and-clear` | stack, breach, enter, dominate, clear, mark (§7.8); written as beats on four channels (feet, hands, eyes, voice) by slot, the source of the player's bundles and the NPCs' slots alike (§25.7) |
| `clear-passage` | ship corridors and tunnels: leapfrog hatch to hatch with cross-cover; slice each corner; shafts as §7.8 |
| `casevac-under-fire` | suppress, drag to cover, care, move to the CCP (§12) |
| `hold-and-call` | hold positions, keep fire superiority, call the platoon for support |
| `consolidate` | 360° security, searches of enemy dead and wounded, detainees, the ACE report |

### 7.8 Stacking and clearing rooms and compartments

- **Stack**: up to four on the wall beside the opening, #1 nearest. The team brain orders them by role or the leader's choice; the player may be any number.
- **Before the opening** aboard ship or in a habitat: the hatch's pressure difference is read from its gauge. Doctrine (my call, after longhaul's `PRESSURE_DOOR_KPA` 15): never open across more than 15 kPa; across more than 2 kPa, equalise first (PLACES's valve, 10–60 s).
- **Breach**: open (powered hatch 1.5 s, manual dogs PLACES's time), force (ram, Fitness), cut (Demolitions, §11.6), or pick the lock (Tech). A flashbang or concussion grenade may go in first (§11.4).
- **Entry**: #1 goes to the corner the hatch's swing or the room's shape makes the path of least resistance, 1 m along the wall; #2 the opposite corner; #3 and #4 to points one third into the room along each wall. Points of domination come from the room plan (§25.7.3): authored for the shoot house's layouts, computed from PLACES's room polygon from 0.3. Each takes the sector from its point to the far wall's middle.
- **The race.** A defender who knows the opening and holds an aim on it (WEAPONS's held bonus) fires after his take-in (§25.4) when the first marine crosses; a stunned one cannot. The player as #1 enters by the keys after X at drill rungs 0 and 1, or in a bundle from rung 2 (§25.5), and the world stops on each person seen once he has taken them in. Speed, the flashbang, the slice and the stack decide this, as in life; the race by sheet and defender is §25.5.5.
- **Clear**: a room is clear when every sector has been looked at and nobody hostile stands. "Clear!"; the room is marked on the board and with a light on the hatch.
- **Shafts and ladders**: under thrust a shaft is a drop (a grenade falls down it; a body going down is exposed for the climb); in free fall it is a corridor. Never stand on the line of a shaft's open hatch (cover field sector "up" and "down" from PLACES, my call).

### 7.9 Enemy doctrine by type

Defender shares and quality are longhaul's `RESIST` (`boarding.js`). The doctrine columns are my calls.

| Type | RESIST share, quality | Fire | Movement | Breaks at losses | Surrender | Civilians |
|---|---|---|---|---|---|---|
| CFB cell (Ceres Free Belt) | irregular 0.9, 0.55 | long bursts, area fire from windows | shoot and scoot, ambush and exfiltrate | 30%, or when flanked | rare (fear of capture), feigned 3% | uses crowds as cover and shields |
| Miners' union militia, rioters | civilian 0.3, 0.3 | thrown objects, cutting tools, few guns | crowd surges | 20% | yes | is the crowd |
| Corporate security (Pur'n'Kleen) | authority 0.85, 0.6 | aimed | some bounding | 40% | yes | protects facilities, not people |
| Star Helix Security (the OPA's police contractor, SETTING §7.5) | authority 0.85, 0.6 | aimed, warnings first | cordons | 40% | yes | protects them |
| Hungry Dark pirates | irregular 0.9, 0.55 | bursts | ambush in cargo spaces | 35% | sometimes | hostages |
| UNN marines | military 1, 0.75 | aimed, disciplined | bounding overwatch, flanking | 50% | at 10% left | avoids |
| Enemy special forces | military 1, 0.95 (my call) | precise | initiate by ambush, break contact | 70% | almost never | avoids |

**Kit by the user's overrule of question 6** (the user, 2026-11-07: "standard issue combat gear will be combat EVA suits with serious targetting and filtering, night vision, I mean this is superpower level military"; built in v0.0.9 for `combat-race`): the UN's line infantry (UNN marines), MSS tactical and enemy special forces wear **combat EVA suits**: a filtered visor (never flash-blind or dazzled), sound filtering at `EARPRO_K` ×0.6 (never deafened), night vision and targeting. Insurgents, the miners' militia, pirates and corporate security are unsuited. **Power armour** (the user: "some marines will even be equipped with power armor (not common, special units) with extreme ballistic protection and servo/computer guided targetting with built-in automatic weapons") is a special unit's kit class, **not built**: its armour, aim assist and automatic weapons wait for a row of ROADMAP §5 (my call: after the shoot house); a Raider or recon marine's special-unit issue, never the line's.

Skill sheets for generated fighters come from SKILLS's NPC levels. My default mapping from longhaul's quality `q` to a class-`soldier` fighter's values, for SKILLS to confirm: Marksmanship and Weapon handling `round(4 + 14q)`, Fieldcraft and Awareness `round(3 + 12q)`, CQC `round(2 + 12q)`, WF `round(60 q²)`. Quality 0.55 gives 12, 10, 9 and WF 18; 0.75 gives 15, 12, 11 and WF 34.

### 7.10 Morale, breaking, surrender, and the protected

- **Resolve** (renamed 2026-11-07 from "nerve", so that Nerve, the nerve axis and resolve each have one meaning: §5.6). Each NPC fighter has `resolve` 0–1 (1 at the start). It falls by 0.1 per friend down in its perception (each also +10 to his pool, §5.1), 0.05 per 10 s pinned (felt's band, §5.3), 0.2 when flanked (a contact perceived more than 100° from its main threat), and rises 0.02 a second calm near its leader (my calls). It enters his nerve check as `round(10 × (resolve − 1))` (§5.3: −3 at 0.7, −7 at 0.3). At 0.3 it **breaks**: it stops firing and moves away from the threat to the next cover and on; at 0.15 it may surrender (by type, §7.9).
- **A side breaks** when its losses reach the type's threshold (§7.9), with 50% chance per minute (longhaul's surrender cadence), and every fighter's resolve drops to 0.3.
- **Surrender**: weapon dropped, hands shown, prone if ordered. Accepting it is a step (shout "Get down! Hands!", 1.5 s), then approach, cover, restrain (§9.6).
- **Hors de combat.** A fighter who is down and not resisting, disarmed, or surrendering is protected. Shooting one is a breach of the law of armed conflict, judged in §9.7 on what the shooter perceived. Wounded enemies are disarmed, restrained and given aid after friendly casualties.
- **Wounded behaviour**: tradecraft's `wounded.js` ladder (lie, sit against a wall, flee the shooter if seen with a gun within 40 m, wait, crawl) for civilians and for fighters whose resolve has broken.

### 7.11 The loud entry: the defender's procedure and his choice

Designed 2026-11-07 for the user's words of that day (DESIGN.md's log): "enemies are NPCs and they run their own procedure to eliminate us, meaning that when we crash in with a lot of noise, they would turn towards us and attempt to shoot us. Suppression, training and exprience will decide how well NPCs can respond to threats and whether they fight back, try to rush for cover or flee all together." The front end of the fighter's ladder (§7.3), the same for every side: the doctrine proposal's procedure, the systems proposal's one nerve check, and the judge's rule that a choice holds (my calls unless named). So **suppression** is his felt chaos, **training** is the inoculation inside his hardening (and his drill rung for the room's bundles), **experience** is his Warfighting (in his hardening, his Nerve and his take-in), as the user named them.

1. **The cue.** A kick, a ram, a charge, a bang, shots, "Marines! Get down!" or a hand on the handle is a sound event (PEOPLE §7.3): a heard contact at the door's bearing. **The noise is a cue**: an aim held on that door refreshes `sector`; anyone else becomes `alert` toward it; nobody stays `surprise`. That is the price of a loud entry: it buys suppression and sells surprise.
2. **The shock.** Each input into his pool (§5.1); a startle on a jump of felt (§5.7), which knocks a held aim off the door; flash-blind or dazzled by his facing and his visor (§11.4); deafened without ear defenders.
3. **The turn.** Once he can move, his head and then his body to the cue over `TURN_MS` 300 (the turners' own); then, if his choice is to fight, his rifle onto the door (15° from where the startle dropped it), so **a slow entry finds him aimed at the door again**.
4. **The take-in** of the first entrant he can see: `takeInMs` as built (`sector` on the door, `alert` elsewhere), its band on felt, its notice roll at half the felt modifier and −3 while dazzled; flash-blind, no sighting until it clears.
5. **The choice**: one `nerveCheck` (§5.3) once he is suppressed or worse, read on the table below. It is rolled at his first moment able to choose (the startle's end), at his pause, **whenever his felt band changes**, and from cover or blind fire once `CHOICE_DWELL_MS` 1,500 has passed while he is still suppressed or worse. Otherwise **a choice holds**: a frozen man stays frozen until his band changes, a fighter fights until his band worsens, and flight and surrender are final. Calm or under fire he fights, with no roll, so a calm man never flickers into cover.
6. **Acting**: every step at the built times × `suppTimeK(felt)`, every roll with `suppMod(felt)`; he fires when his take-in and his aim are both done. A hit adds 25 to his pool: every round that strikes counts twice.

| His felt band | The check | pass or better | miss | bad | disaster |
|---|---|---|---|---|---|
| calm, under fire (0 to 44) | none | **fight** | | | |
| suppressed (45 to 69) | `nerveCheck`, DC 10 to 15 | **fight**, with the modifier | **cover** or **blind fire**, by doctrine | **freeze** | **freeze** |
| pinned (70 to 100) | `nerveCheck`, DC 15 to 21 | **cover** or **blind fire**, by doctrine | **freeze** | **freeze** | by doctrine: **flee** (irregulars, civilians), **surrender** (police and security, where a weapon is on him within 5 m; else freeze), **freeze** (military) |
| resolve under 0.3 (§7.10) | none | breaks: **flee**, or **surrender** by type | | | |

- **By doctrine** (§7.9; my calls): irregulars cover 0.5, blind fire 0.5; police and security cover; military cover 0.7, blind fire 0.3. **Cover** is a dash of at most 2 s to the best cell of §7.4 within 3 m (`hideSpot()`), else down where he is; **blind fire** is §3.4's, the rifle over cover, never aimed, feeding §5.1 for whoever is near its line; **freeze** is nothing at all, crouched to the floor or into a corner; **flee** is §7.10's breaking toward an exit away from the threat within 10 m, else freeze; **surrender** is §7.10's. Unarmed people (civilians in the room, a hostage) take cover, freeze or flee by the same check, never fight, and answer a challenge by §9.3's compliance model.
- **Several in one room**: each defender's pool is his own; a friend falling within his perception is +10 to it and −0.1 to his resolve, so one dropped man shakes the next. The player's #2 is suppressed by the defenders' fire as anyone is, and by the player's own rounds past his ear (§5.1's muzzle row).
- **The fighter's ladder** (§7.3) reads felt where it read the band: its level 3, "survive pinned", is this table's pinned row.

**[computed, T10] A man in the room when the team's flashbang goes off**, before anyone has come in, 20,000 runs. His first choice | at 3 s | at 10 s after the last bang, fight / cover / blind fire / freeze / flee / surrender (%):

| Defender (H, Nerve) | One bang | Two bangs |
|---|---|---|
| insurgent cell member (8, 3) | felt 52, suppressed: 65/13/12/10/0/0 · 68/11/11/10/0/0 · 100/0/0/0/0/0 | felt 82, pinned: 0/17/17/45/20/0 · 0/7/6/60/27/0 · 32/8/9/22/29/0: **fled by 10 s 29%** |
| pirate, clan boarder (22, 6) | felt 38: fights | felt 68, suppressed: 60/12/13/15/0/0 · 76/3/3/18/0/0 · 82/0/0/18/0/0 |
| corporate security (16, 4) | felt 44: fights | felt 74, pinned: 0/45/0/45/0/10 · 0/9/0/77/0/13 · 62/0/0/25/0/13: **surrendered by 10 s 13%** |
| insurgent veteran (27, 8) | felt 33: fights | felt 63: 75/13/13/0/0/0 · 95/3/3/0/0/0 · 100/0/0/0/0/0 |
| UN Marine, line (28, 7) | felt 32: fights | felt 62: 75/17/7/0/0/0 · 94/4/2/0/0/0 · 100/0/0/0/0/0 |
| MSS tactical (39, 9) | felt 21: fights | felt 51: 95/5/0/0/0/0, then fights |
| enemy special forces (82, 20) | felt 0: fights | felt 8: fights |

- **Why the dwell** (the judge's finding on both proposals): re-rolled every `THINK_MS` 0.5 s, the same cell member has fled by 10 s 89% of the time after two bangs; with the dwell, 29%. **One bang does not break an insurgent; two can**; a professional's hands are what the bang reaches, not his legs.
- **Reading it at 16 px/m** (VIEWS §3.4, §7.4; the doctrine proposal's): the figure's pose, the plaque's word at your pause (what the marine could tell: the identification roll of §25.4.6 also reads the state, and a failed roll says only "can't tell"), the instinct line from Tactics 8, and the sounds; never a number, never a bar over a head:

  | State | The figure (new frames marked) | The plaque's word | The instinct line | Sound |
  |---|---|---|---|---|
  | turning to the noise | the head a frame before the body | LOOKING AT THE DOOR | | |
  | aiming at you | the aim frame, the rifle laid toward you | AIMING AT YOU | "He's on you." | |
  | startled, flash-blind | **`daze`**: hunched, a hand to the eyes or both to the ears, the muzzle dropped, a 1 px sway at 1.5 Hz | DAZED | "He's dazed. Now." | a cry, coughing |
  | frozen | **`cower`**: crouched to the floor or into a corner, arms over the head, the rifle lying or hugged | COWERING | "He's done. Cover him." | |
  | blind fire | **`blind`**: down behind cover, the rifle held up over it, flashes with no aim | FIRING BLIND | "Firing blind. Get flat or get on him." | bursts |
  | going for cover | the run, the rifle low | RUNNING | | |
  | fleeing | the run, his back to you, the rifle perhaps dropped | RUNNING AWAY | "He's running. Hold." (the ROE) | |
  | surrendering | **`hands`**: hands up, the rifle on the floor before him | HANDS UP · RIFLE DOWN | "Hands up. Challenge him." | "Don't shoot!" |
  | down | the hurt frames (as built) | DOWN | | |

---

## 8. Orders

### 8.1 Channels

| Channel | Range | Delay | Needs | Fails when |
|---|---|---|---|---|
| Voice | `VOICE_M = 25 × √(P / 101.3)` m (20 m at Base Melas's 66 kPa); 8 m when shots were fired within 30 m in the last 3 s; a shout 1.6× | the words: 1.0–1.8 s | air on both sides; helmets on: ×0.7 through external microphones | vacuum; noise |
| Radio (team, squad, platoon nets) | surface line of sight to the horizon (Mars 3.7 km, Europa 2.5 km at 2 m) **[computed]**; 150 m through ice without a relay; anywhere aboard on the ship's net while it has power | + 0.6 s keying | a set and power; the net not jammed (Comms vs Comms) | under-ice dead zones; a dead ship; jamming |
| Hand and arm signals | line of sight | 1.0 s | the receiver perceives you during the signal | not looked at |
| Helmet contact | touch | 2.0 s | helmets together | (speech through the visors, in vacuum without radio) |

NPC subordinates who are not engaged look at their leader every 3–6 s (my call), so a signal is caught within a few seconds or relayed by a tap ("Tanaka taps your shoulder: 'Move up.'", 2–5 s).

### 8.2 Receiving orders

An order is data:

```json
{ "id": "od77", "fromId": "p50", "to": { "team": "A" }, "verb": "bound", "args": { "x": 18.0, "z": 6.5, "via": "rush" },
  "channel": "radio", "saidMs": 2051349600, "heardBy": { "p233": 2051350200, "p55": 2051350200 }, "status": "open" }
```

- It arrives as speech (balloon and log) and on the radio box above the instinct line (VIEWS). The **T line** offers the obedient step with its time: "T: rush with your team to the pump housing (12 m, 3.1 s)." T in stop motion takes the step; T in real time takes it at once (it enters stop motion only if the step is a fighting step).
- **Acknowledgement** is the action, with its call ("Moving!") made free as part of the step.
- **Not obeyed**: after `ORDER_GRACE_S` 10 s the leader repeats it once, sharper ("Kade! Move!"); after 10 s more it is recorded as not obeyed, with the reason the sim knows (pinned at band 3, wounded, not heard). PEOPLE's discipline system and the after-action read the record. A sound reason (pinned, not heard) clears it; refusing an unlawful order (to fire on surrendering men, on a crowd with lethal force) is recorded as a refusal and protected (§9.7).

### 8.3 Giving orders: the order panel

From fire team leader (CAREER's billet: a Corporal, or a senior Lance Corporal when short), the player gives orders. The panel opens as a step in stop motion, or with VIEWS's orders key out of it; time stands still while composing, as in talk (DESIGN).

| Group | Verbs | Target picked by pointing |
|---|---|---|
| Move | Bound to · Follow me · Hold here · Fall back to · Stack on · Get down · On me (rally) | a point, a hatch |
| Fire | Fire at · Suppress · Shift fire to · Hold fire · Weapons free (within the ROE card) · Rate: slow, rapid | a contact, an area, a sector |
| Do | Clear (room) · Breach · Grenade at · Aid · Carry to · Search · Detain · Watch (sector) | a casualty, a person, a room |
| Shape | Formation: wedge, file, line · Interval · Silent movement (hand signals only) | |

- **To**: the whole team, or one man (left and right cycle them). From Sergeant, the squad leader's panel orders teams, not men (my call).
- **Channel** is chosen for you (voice if in air and everyone is within range, otherwise radio) and can be overridden. Unavailable channels are greyed with the reason ("Voice: no air"; "Radio: no signal past 150 m of ice"), tradecraft's greyed-option pattern.
- **Duration**: voice 1.2 s, with a target description 1.8 s; radio + 0.6 s; signal 1.0 s (my calls).
- **Compliance.** Subordinates obey, except:
  - **Exposing orders under fire**: the ordering leader rolls Leadership against DC 15 if the subordinate is suppressed, 20 if pinned, 25 if broken (SKILLS's ladder: "getting a scared man up from cover" is average, "stopping a panic" hard, "rallying a broken squad" very hard). Failure: "Can't! Pinned!", and the order may be repeated after 3 s at −2 (SKILLS's retry rule).
  - **Trust**: a subordinate whose trust in you (PEOPLE's gauge) is below 30 adds `(30 − trust) / 3` to that DC.
  - **Unlawful orders** are refused ("I'm not doing that, Corporal."), recorded, and judged (§9.7).
  - Orders that get people hurt cost the leader trust (PEOPLE); orders that work earn it.

### 8.4 Calls

Free with the steps that make them, heard by voice or radio, and the way the player learns what others do: "Contact, front, 150, two rifles!" · "Moving!" · "Set!" · "Covering!" · "Reloading!" · "Last mag!" · "Man down!" · "Corpsman up!" · "Grenade!" · "Clear!" · "Coming out!" · "Up!" Each is a line in the log with who said it.

### 8.5 Initiative: taking the team

The full order panel comes with the fire team leader's billet (§8.3), which ROADMAP brings at 0.5. Before that, a private is a rifleman inside a team someone else moves. But the Corps expects any marine to take charge when his leader cannot (my call, after the Marine Corps' teaching of initiative). So this slice of the panel is built at 0.3, two minors ahead of the rest (§22). In a fight the T line offers **Take the team** when the player's fire team leader is:
- **down**: a casualty, out cold, or knocked down and not up after 5 s;
- **out of contact**: for 15 s, no channel of §8.1 has carried his word to the team (a hatch shut between them, a dead radio, vacuum without radio);
- **frozen**: at band 3 for 10 s without giving an order, or frozen by §5.3's freeze or §12.5's grief.

The offer stands for `TAKE_OFFER_S` 10 s ("Tanaka's down. T: take the team."). If the player lets it pass, the team goes to the next in the chain (§7.2) and nothing is recorded against him. It is offered only if the player is in the team and can reach two of its members by some channel. A senior marine of the team may be up and in contact; the offer still comes, but taking charge over him adds +2 to every compliance DC that follows (my call).

Taking it opens a **cut-down order panel** for the rest of that fight. It closes when the leader is back and takes the team again, or when the squad leader names a new leader:

| Verb | Target, picked by pointing | What the team does |
|---|---|---|
| Move to | a point | bounds to it (§7.6), by buddy rush under fire |
| Fire at | a contact or an area | engages it, or puts area fire on it (§5.4) |
| Follow me | | moves on you, in the formation it had |
| Cover me | a sector or a contact | puts area fire on it while you move |

- **The rest is §8.3's**: the channel and its delays, compliance by Leadership against the band's DC, trust, and unlawful orders refused. The squad leader on the net may still give the team orders over yours, and his win.
- **The record.** The after-action (§17.3) logs `initiative: { tookAtMs, why, orders, outcome }`.
  - Taken under fire (the player at band 1 or above when he took it), it is a valour event of grade 1 (§17.3). It is also grounds for a meritorious board nomination: CAREER §8.5 should read it beside its standing gates.
  - The operation's XP takes SKILLS §6.2's `ROLE_K` ×1.2 for leading it.
  - The team's trust in the player moves by the outcome (PEOPLE): up when the orders worked, down when they got someone hurt. The squad leader's affinity moves by whether it was needed.
- **The same rule climbs.** A fire team leader is offered his squad when its leader fails, with the squad leader's panel by teams (§8.3) once it is built (ROADMAP: 0.8).

---

## 9. Rules of engagement, escalation of force, civilians

### 9.1 The Europa ROE card (my call on the card; it obeys SETTING §7.6's Accord, cited by clause)

The card of the Martian Stabilisation Force, Europa (MSF-E, SETTING §7.6). It is issued as a paper at the Europa brief (CAREER §5.4's class in Friday's short `train-a`, career sol 4) and carried in the mind:
1. You may always use force, up to deadly force, to defend yourself, your unit, and persons in your care (UN observers, detainees, civilians you are protecting) against a **hostile act** or **demonstrated hostile intent**.
2. **Hostile intent** includes: a weapon pointed at a person; preparing to throw or fire; reaching for a weapon after a warning; advancing on a guarded point past its warning line after warnings.
3. **Positive identification** is required before engaging: you must perceive the person, the weapon or the act.
4. **Where time permits, escalate**: shout, show, shove, shoot.
5. **No warning shots inside a pressurised section** (ricochet and pressure walls). Outside, warning shots go into the ground or ice, away from people.
6. **Frangible ammunition** inside towns and ships (WEAPONS; the Accord, clause 4).
7. **No deadly force against an unarmed crowd.** Less-lethal means against a crowd only on an officer's order.
8. Persons who surrender, are wounded and out of the fight, or are detained are protected. **Detainees go to Star Helix within 6 h**, searched, and every detention is entered in the joint log, which is open to UNOME (the Accord, clauses 5 and 7; §9.5).
9. Minimise harm to civilians and their air, water and power.
10. **No explosives inside a pressure volume**, grenades included, except engineers' breaching charges on a battalion commander's written authority (the Accord, clause 4).
11. **No entry into a dwelling** without Star Helix present or an Ice Council magistrate's warrant, except in hot pursuit or to save life (the Accord, clause 6).

The ROE state on a fight is `{ fire: 'hold'|'tight'|'free' }`: hold, fire only in self-defence; tight, fire only at positively identified hostiles; free, at any target not positively friendly (wartime boarding only). Weapon carry conditions (chamber empty, magazine in) are WEAPONS's.

### 9.2 Escalation of force: the four steps

Every step is in the F menu (people at hand) and on the step panel against a picked person; each takes time and is logged.

| Step | Actions | Time | Effect |
|---|---|---|---|
| **Shout** | "Halt!" · "Stop! Show me your hands!" · "Get back!" · "Drop it!" · in Belter Lang if learnt (SETTING; a phrase card) | 1.5 s, repeatable | a compliance roll (§9.3); heard only by voice or on a channel the subject is on (a miner in a suit hears only the common channel or your external speaker) |
| **Show** | raise the weapon to the ready, then point it; the dazzler on the chest; the light in the eyes | 0.6 s | +3 to compliance; the subject now knows you are armed and ready |
| **Shove** | block, push (tradecraft's push opening), grab, a restraint hold, the baton, the shield | CQC times | +2 to compliance; stops the approach whatever the roll; starts CQC if resisted |
| **Shoot** | a warning shot (outside only), a less-lethal round, a disabling shot, a lethal shot | WEAPONS | the last step; recorded as a use of force (§9.7) |

Steps may be skipped when time does not permit: the card says "where time permits".

### 9.3 The compliance model

Every person who may be a threat carries a hidden `intent` and a `resolve` (my calls):

| Intent | Who | resolve | Behaviour if not complying |
|---|---|---|---|
| `benign` | a confused or frightened civilian, a deaf man, someone who doesn't speak Martian | 0–5 (mean 3) | freezes, argues, walks on slowly |
| `agitated` | a drunk or angry miner, a grieving father | 6–11 (9) | shouts, pushes, stands his ground |
| `criminal` | a smuggler, a thief running | 9–14 (12) | runs, may fight to get away |
| `hostile` | a cell member who means to attack | 15–21 (18) | goes on with the plan; with Fieldcraft, may feign compliance |
| `martyr` | a suicide attacker | never | goes on |

Each EOF step makes one compliance roll by the marine: Social + modifiers against `8 + resolve`:
- +1 for each other marine visible to the subject (at most +3); +3 once a weapon is shown (it stays for the later steps); +2 at the shove; +1 for each earlier EOF step on this subject in the last 60 s;
- −6 if the shout is not understood (language, no channel, noise), and a shout not heard does nothing;
- BODY's mods on you (a bloody face does not help or hurt; stress does).

Success: the subject complies (stops, shows hands, backs off, drops what is held, lies down if ordered). A `hostile` who "complies" either aborts in earnest or, with his Fieldcraft against your Awareness, feigns it: reading the tell is PEOPLE's and SKILLS's reading-people rule.

**[computed] Chance to comply at Social 5, one other marine in view:**

| Intent (mean resolve) | Shout | Shout, then show | Shout, show, shove |
|---|---|---|---|
| benign (3) | 80% | 95% | 95% |
| agitated (9) | 50% | 70% | 85% |
| criminal (12) | 35% | 55% | 70% |
| hostile (18) | 5% | 25% | 40% |
| martyr | 0% | 0% | 0% |

**Cues and the danger line.** What the marine perceives of a subject is a list of cues (PEOPLE's perception and SKILLS's reading): hands hidden, an object carried, a weapon seen, a fast approach, ignoring commands, scanning the guards, a suit at odds with the place, a detonator seen. Each subject has a **danger line**, the distance at which their threat becomes hard to stop: 2 m for a blade, 15 m for a thrown device on Mars and 40 m on open Europa ice (low g carries a throw far, §11.1), 25 m for a vehicle (my calls). Whether the steps fit before the subject reaches that line is the decision the player makes.

### 9.4 Non-lethal tools (hard science fiction, all of them real today)

The weapons that fire are WEAPONS's items and state machines; their effects on bodies are BODY's. What COMBAT sets is where and when they are used, and what they do to a fight.

| Tool | Reach | Effect (my calls where not cited) | Limits |
|---|---|---|---|
| Voice and the suit's external speaker | §8.1 | EOF shout | no air, no voice |
| Acoustic hailer | 10–300 m in air | a shout heard to 300 m; within 10 m, pain: −2 to the subject and +2 compliance | air only |
| Laser dazzler | 10–300 m | dazzled 3–10 s: −6 to sight-based actions, no aimed fire; 1% chance of eye injury inside 10 m | filtered military visors are immune |
| Baton (extendable) | melee | a CQC weapon: k 1.5, guard 0.6, strikes to limbs | |
| Riot shield | carried | cover (§4.4) and a CQC guard of 0.9; shove +2 | heavy shields are easy to carry in low g; inertia is unchanged |
| OC spray | 4 m | −4 to everything and −6 to sight for 5–15 min | in a sealed section it reaches the air: everyone in the compartment −1 until the scrubbers clear it (about 20 min, PLACES) |
| CS grenade | area | as OC, weaker, area denial | banned in sealed sections under 2,000 m³ (my call) |
| Conducted energy device | 7.6 m (a 25 ft cartridge) | both darts must hit (two Marksmanship rolls vs `8 + 0.5 × rangeM`) and reach skin; then 5 s of neuromuscular incapacity per cycle; the subject falls (slowly in low g: a partner can catch him) | any suit or thick work clothing stops it |
| Impact rounds (40 mm sponge, 12 ga bag) | 5–40 m | tradecraft's less-lethal wound path (force and crack, no cut), a likely knockdown; head hits can kill | aim low: the legs' +3 DC is the price |
| Flashbang | a room | §11.4 | in vacuum, light only |
| Net or cord entangler | 3–8 m | legs bound: down; 10–30 s to free | |
| Zip cuffs | touch | restrain in 20 s × pace(CQC) on a compliant subject; CQC opposed on a resisting one | tradecraft's "tie" (60 s with a belt) re-cut to issued cuffs |

### 9.5 Detention

Restrain (cuffs), search (tradecraft's 20 s, finds what is carried), tag, segregate, guard, enter in the joint log, hand over. In the F menu on a compliant or downed person: Restrain · Search · Strip armour (tradecraft's times) · First aid · Escort (walks them at your pace, hand on the arm) · Hand over. Abuse (striking a restrained detainee) is a use of force with no justification and is recorded.

**The six-hour clock** (the Accord, clause 5):
- It starts at restraint. The detainee goes to **Star Helix within 6 h**: at a checkpoint's detention cell (PLACES §7.6), at the FOB, or to a Star Helix patrol called to the spot.
- Every detention goes in the **joint log**, which UNOME may read (clause 7). The entry is made at the hand-over desk or by radio to the platoon's log keeper, and takes 2 minutes (my call).
- The detaining unit owns the clock (my call). A hand-over late or missing from the log goes on the record of whoever was told to make it: the guard if he was told and did not, otherwise the NCO in charge.
- The mind's agenda (Tab) shows each detainee's clock, and the instinct says so at 1 h left ("Okafor's prisoner: an hour to the handover.").

### 9.6 The use-of-force record

Every shot fired, CQC strike, less-lethal use and shove by the player (and by NPCs, for the platoon's review) makes a record, filled from what **the actor perceived at the moment** (PEOPLE's perception and the helmet camera, which records the same thing):

```json
{ "id": "uf412", "byId": "p233", "atMs": 2051352900, "kind": "lethal-shot", "targetId": "p118",
  "perceived": { "pid": false, "cues": ["fast-approach", "hands-hidden", "ignored-commands"], "weaponSeen": false, "hostileAct": false,
                 "distanceM": 9.5, "closingMs": 2.4, "dangerLineM": 15 },
  "eof": ["shout", "shout", "show"], "timeAvailableS": 4.1,
  "collateral": { "civiliansOnLine": 0, "civiliansHit": 0 },
  "truth": { "intent": "benign", "carrying": "pressure regulator" },
  "review": null }
```

The player is an ordinary person id (`p233` here, named by `state.player.id`), and the man shot, a crowd member until then, was promoted to a `p` id the moment the record named him, his seed kept in `look.seed` (CONTRACTS §10).

**A detention is a use of force too.** Its record (`kind: "detention"`) adds the Accord's clock:

```json
{ "kind": "detention",
  "detention": { "restrainedMs": 2051353400, "searchedMs": 2051354100, "jointLogMs": 2051361000,
                 "handedOverMs": 2051371000, "to": "star-helix", "byId": "p52" } }
```

The review (§9.7) checks two things: that `handedOverMs − restrainedMs` is at most 6 h (21,600,000 ms), and that `jointLogMs` is set before the hand-over.

### 9.7 The review

The review judges by the "reasonable belief" standard: what the shooter could know, never the truth hidden from them ("we only know what we know"). The truth is printed on the paper afterwards, because the investigation finds it.

| Finding | Rule (my call) | Consequences (CAREER and PEOPLE) |
|---|---|---|
| **Justified** | PID of a weapon or a hostile act, or hostile intent by the card's list; and EOF given when time permitted (time to the danger line ≥ 3 s), or no time | none; a valour event if the act was brave (§17) |
| **Justified, honest mistake** | as above, but the truth was benign | none on the record; stress and a memory (PEOPLE, BODY) |
| **Questioned** | no PID, but ≥ 2 cues and ≥ 2 EOF steps given | a page-11 counselling entry; the squad's trust moves by their view of it |
| **Unjustified** | anything else; any shot at a protected person; any warning shot inside a pressurised section; any lethal force on an unarmed crowd | NJP or court-martial by severity (PEOPLE and CAREER); a death makes it a court-martial |
| **Negligent** (collateral) | a civilian hit while the shooter perceived a civilian within 1 m of the line | as unjustified, one step lighter |
| **Breach of the Accord** (detention) | a detainee handed over more than 6 h after restraint, or not entered in the joint log before the hand-over (§9.5) | a counselling entry for whoever held the hand-over (§9.5; PEOPLE); a line in UNOME's report when they read the log (SETTING §7.6, clause 7); the district's mood moves as for a detention, twice over (PEOPLE §12.4) |

### 9.8 Civilians and crowds in a fight

The crowd is PEOPLE's (throwaway, instanced, never popping in view). In a fight each crowd member reacts (my calls, after tradecraft's street reactions):
- **Startle** 0.3–1.5 s at the first shot heard (`HEAR_M`, §6).
- **Then**: within 15 m of the shooting or with rounds landing within 5 m, drop flat (40%) or run (60%); farther off, flee along the nearest exit away from the sound. One in ten, beyond 40 m, stays to watch and film, and comes back to look 2–5 min after it goes quiet ("pool around the bodies with their phones out", 2026-11-04). Someone calls Star Helix, the towns' police (SETTING §7.5), within the first minute (tradecraft's "they should call the emergency services").
- **Crush.** Pressure doors and tunnel mouths are chokepoints. Where density within 2 m exceeds 5 people per m², each person there falls with 2% × (density − 5) chance per second, and a fallen person in a crush takes BODY's compressive asphyxia. A pressure door closing on a fleeing crowd (PLACES) is the worst case the game can make, and should be.
- **On the line.** Civilians are blockers for perception and stray rounds: a miss goes on and hits the first person within 0.7 m of its line out to 80 m a quarter of the time (tradecraft's `STRAY`). The ROE review reads it (§9.7). Cells use this.
- **Riots.** A crowd has an `agitation` 0–100. Above 40 it throws: ice chunks, tools, bottles at one throw per member per 20–60 s. Low g makes throws reach: a 15 m/s throw carries 61 m on Mars and 171 m in the open on Europa **[computed]**; a 0.5 kg chunk at 15 m/s is 56 J, a bruise, a concussion on a bare head, nothing on a helmet. Agitation rises with casualties, shoves and gas, falls with time, with an officer's Social success against 15 + agitation/10 (SKILLS's "turning a hostile crowd" is expert), and with dispersal by less-lethal means. The marines' answer is the shield line: shields locked (cover against thrown objects), advance by step on the order, arrest teams for ringleaders.

### 9.9 The checkpoint shift: a deck of cases

Checkpoint shifts are the commonest key day on Europa (CAREER §10.2; PLACES §7.6's four templates). A shift lasts 4 to 8 hours, which cannot be lived at 1:1. If every civilian interrupted it, the shift would be spam; if none did, it would be empty. So a shift plays as a **deck of cases**, after tradecraft's *Papers, Please* touchstone (TIME §10.6) (my call on every number in this subsection unless cited).

**The activity.** `checkpoint-shift` is an activity for TIME's table, at the post the roster gives you (PEOPLE).
- It is watch-like: mask `D A O B P`, chunked by the hour, with the resolver `checkpoint`.
- It is refused while `threatKnown` holds (§6.1).
- The player is the searcher on one of the post's lanes, and an NPC marine works the other at his own stance and sheet. When the roster puts him in the sangar instead, the player is its sentry. Then the cases come forward as approaches to the post (`P`).

**The draw.** Each hour the resolver draws subjects from the town and its mood:
- 20 to 40 subjects an hour, from PEOPLE §12.5's arrivals by hour. The peaks fall at the miners' shift changes at 06:00, 14:00 and 22:00 UTC.
- Each subject's intent (§9.3) comes from the district's mood and demographics (PEOPLE §12.4). What they carry, and its concealment, comes from the intent.
- Every subject is drawn from the stream `combat/checkpoint/<shiftId>/<subject>`. A routine case therefore rolls the same dice that a lived search would (TIME §5.1.4: lived and skipped agree).

**The stance.** The player sets a search stance for his lane. The NCO in charge may set a floor ("standard or better today"); going under it is not obeying (§8.2).

| Stance | Seconds per subject | Search roll | District mood per search | What it buys |
|---|---|---|---|---|
| quick | 45 | Awareness −4 | 0 | a short queue; finds only the obvious |
| standard | 90 | Awareness | +0.01 | the Corps' default |
| thorough | 180 | Awareness +4 | +0.03 | finds hidden things; the queue grows, and the town remembers |

- PEOPLE §12.5's searches of 45 to 90 s span quick to standard; thorough is my addition. PEOPLE §12.4's "rough search" (+0.5) is a search with force, not a thorough one.
- **Concealment DCs** sit on SKILLS §5.2's ladder: a pistol in a waistband 10; a blade in a boot 15; a detonator built into a pressure regulator 20; a sheet charge sewn into a suit's lining 25. CP-A's scanners add +2 against metal.

**[computed] The trade, over a 6-hour shift.** Means of 2,000 seeded shifts with two lanes at the same stance. Patience is PEOPLE §12.5's, `20 min × (1 − M/150)`, at a district mood M of 40. Leavers add +0.1 M each, and each person-hour of waiting past 30 min adds +0.05.

| Arrivals | Stance | Lane load | Searched | Turned back (left the queue) | Longest wait | The shift's own push on M |
|---|---|---|---|---|---|---|
| 30/h | quick | 0.19 | 181 | 0.2 | 1 min | +0.0 |
| 30/h | standard | 0.38 | 179 | 1.5 | 2 min | +1.9 |
| 30/h | thorough | 0.75 | 168 | 12 | 6 min | +6.3 |
| 40/h (a shift change) | standard | 0.50 | 237 | 3.7 | 2 min | +2.7 |
| 40/h | thorough | 1.00 | 207 | 33 | 8 min | +9.5 |

**[computed] The chance of a find** (SKILLS §5.1's odds), by concealment, at Awareness 6 (about a new private's: SKILLS §10.4's rifleman has 7) and 12:

| Hidden | DC | Awareness 6: quick / standard / thorough | Awareness 12: quick / standard / thorough |
|---|---|---|---|
| a pistol in a waistband | 10 | 65 / 85 / 95% | 95 / 95 / 95% |
| a blade in a boot | 15 | 40 / 60 / 80% | 70 / 90 / 95% |
| a detonator in a regulator | 20 | 15 / 35 / 55% | 45 / 65 / 85% |
| a sheet charge in a suit's lining | 25 | 5 / 10 / 30% | 20 / 40 / 60% |

So a new private's thorough lane finds the detonator half again as often as his standard one (55% against 35%). It also turns 12 people away in a shift at 30/h, and 33 at a shift change's 40/h, and the town remembers. A quick lane keeps the queue moving and finds only the obvious.

**Routine cases resolve in the ticker** ("14:10 · a reamer with a cutting torch: permit checked, passed." · "14:12 · an undeclared air bottle: confiscated, receipt given."). Three kinds of case come forward to be lived at 1:1 instead:
- **a cue read**: the subject shows cues (§9.3: hands hidden, scanning the guards, a suit at odds with the place), and the player's reading roll catches them. That roll is Awareness against the subject's Fieldcraft (SKILLS §12, PEOPLE's perception).
- **a find above the routine**: a weapon, a device's component, a detonator.
- **a beat**: a dispute (PEOPLE §10.11's hard talk), a UNOME visit, a squadmate's trouble.

- **A hostile always comes forward**, read or not. Read, he comes forward at the queue, with time for the escalation ladder (§9.2). Missed, he comes forward at the moment of his act, with §3.5's reflex chance (TIME §5.1.5: no big outcome inside a splash). The danger is always lived, never settled in the ticker.
- **The rate**: one forward case an hour when the district is calm, two when uneasy or tense, three when angry. Surplus benign cues pass as "questioned and passed" lines. A hostile is never cut to fit the rate.
- **A lived case** is a search (the tradecraft search, at the stance's length), a hard talk, the escalation ladder against the danger line, or a detention with its six-hour clock (§9.5). Then R offers "Back to the lane", and the shift resumes.
- **Pace**: a 6-hour shift plays in 10 to 40 real minutes (my target; ROADMAP's `sentry` bot prints it).

**The shift's paper** (TIME §10.6) lists:
- the subjects searched, by stance;
- finds by kind;
- the people turned back, and complaints to Star Helix, Ice Control and UNOME;
- the longest wait;
- detentions, with their hand-over times;
- uses of force, with their findings;
- the district's mood at the start of the shift and at its end.

XP is SKILLS §6.2's `checkpoint shift`.

---

## 10. Close combat

### 10.1 Port of `tradecraft/src/sim/cqc.js`, `fight.js`, `cqctext.js`, `cqcshow.js`

Kept: the one-second exchange with time frozen until you choose (K hit, L grab, M guard, Shift spends an edge); the triangle (guard beats hit, hit beats grab, grab beats guard); opposed CQC on the same move, ties to the player; zero-sum edges capped at `floor(CQC / 10)`; the riposte; reading intent at 6% per point over the opponent, at most 90%, and only by the better fighter; the AI's style mix and adaptation; techniques by level ("beginners would only punch"); staggered, dazed and stunned with their forbidden moves; fight enders at DC `4 + their CQC + ⌊Fitness / 2⌋` with knockouts, breaks, slams and their death chance; armed fighting with the weapon table; blocking blades; disarms; the downed-person menu; flavour text picked by hash so text never moves dice; no sparks. Bouts in training (blows ×0.5, to three points, fouls) are kept for the mat.

Changed: footing and gravity (§10.2), zero g (§10.3), suits (§10.4), the military weapon list (§10.5), and the belt ladder (§10.6). Tradecraft's rule that pain does not count in a fight stays BODY's.

### 10.2 Footing and gravity

Strikes draw their power from the ground; throws from the ground and the fall. Each fighter has `footing` (my calls):

| Situation | footing |
|---|---|
| ≥ 0.3 G with good traction (Mars, under thrust) | 1.0 |
| Europa 0.134 G on grating or cleats | 0.8 |
| Ceres 0.029 G, or Europa on bare ice | 0.5 |
| Mag boots planted | 0.7 |
| One hand on a handhold | 0.55 (−2 on grabs: one hand is busy) |
| Floating, unanchored | 0.25 |

- **Hit damage** × `(0.4 + 0.6 × footing)`: 1.0 on Mars, 0.88 on Europa, 0.55 floating.
- **Throw damage** (into the floor) × `clamp(0.3 + 0.7 × √(g / 1 G), 0.3, 1)`: Mars 0.73, Europa 0.56, Ceres 0.42.
- **The slow fall.** A body thrown from 1 m takes 0.73 s to land on Mars, 1.23 s on Europa and 2.67 s on Ceres **[computed]**. Below 0.2 G a successful throw or sweep leaves the opponent **airborne** for the next exchange: they cannot guard (as dazed) but can grab, and the landing does the reduced throw damage.
- Lunges and knockbacks (`cqcshow.js`'s 0.42–0.85 m) are unchanged in metres; in low g the knocked-back body slides farther: `× 1 / footing` up to 2 m.

### 10.3 Zero g

There is no down. A fight is two bodies holding on to each other or drifting apart.
- **Separation**: after each exchange in which a hit landed or a shove won, unanchored fighters part at 0.1–0.4 m/s each (my call; a punch's impulse of about 20 N·s on 100 kg). If the gap passes `FIGHT_GAP_M` 1.5 m, the fight pauses until one of them closes (a push-off) or grabs a handhold.
- **Throws become drives**: grab beats guard sends the opponent into the nearest surface at 1–2.5 m/s, longhaul's `applyImpact` bruise band, instead of `THROW_PTS`.
- **Control**: a grab won by 4 or more (or a grab with an edge) gives **control**: next exchange the controlled fighter may only grab (to escape), and the controller may choke, lock, or take the hose (§10.4). Grappling dominates zero g, as it should.
- **Fight enders** are chokes and locks; a slam is a drive into a bulkhead at 2.5 m/s.
- Zero-g's free-fall penalty (SKILLS's `mitigated(−6, Zero-g)`) applies to CQC rolls of the unanchored.
- The Corps trains it on the zero-g mat in the Wells at Phobos (PLACES §5.7), and fights it by §14.8's rules: a marine who is anchored (the wedge, his boots, a lanyard) has the floating man's footing beaten before the first grab.

### 10.4 Suits

- **Hard-shell suit torso** takes strikes × 0.2; a helmet takes them × 0.1 (my calls). Punching a hard suit hurts the puncher's hand: 1 point to the arm per bare strike that lands (my call).
- **Gloves**: −2 on grabs (pressurised gloves are stiff); BODY's suit penalties, worn down by EVA (SKILLS §5.13).
- **Suit techniques** (grabs; they need an edge spent, my calls):

| Technique | From CQC | Target | Effect |
|---|---|---|---|
| The hose | 9 | the umbilical or the backpack's hose | flow stops: the opponent has BODY's helmet-volume minutes of air and must reconnect (a 4 s step, Weapon handling-paced, EVA roll) |
| The visor | 13, with a hard weapon (k ≥ 1.5) | the faceplate | a crack: a slow suit breach of 0.1–1 cm² (BODY's suit model) |
| The collar | 21, on civilian work suits only | the helmet's twist lock | the helmet comes loose; catastrophic in vacuum. Military suits lock their collars with a two-handed interlock and cannot be opened in a fight |

- **Edged weapons on soft suits**: any edged hit with force > 0.1 cuts a breach of `0.5–3 cm² × force` (my call); a self-sealing layer closes holes under 0.2 cm². A knife fight in vacuum is a fight to open the other man's suit.

### 10.5 Military melee weapons

Added to tradecraft's `weapons.js` table (k, guard, grab, awkward; my calls):

| Weapon | k | edge | guard | grab | awkward | Notes |
|---|---|---|---|---|---|---|
| Combat knife | 2.9 | blade | 0.2 | 0 | 0 | tradecraft's |
| Bayonet on a rifle | 2.6 | point | 0.7 | −3 | −1 | a thrust weapon; reach |
| Rifle butt / muzzle strike | 1.6 | | 0.7 | −3 | 0 | tradecraft's `gunWhip` for a long gun; aboard ship in a 1 m corridor, long guns are −2 awkward |
| Entrenching tool | 1.8 | blade | 0.6 | −2 | −1 | |
| Pry bar | 1.9 | | 0.9 | −3 | −1 | tradecraft's crowbar |
| Ice axe or miner's pick | 2.2 | point | 0.5 | −3 | −2 | Europa |
| Cutting torch (lit) | 2.0 | burn | 0 | −4 | −2 | burns; opens suits |
| Baton | 1.5 | | 0.6 | −1 | 0 | §9.4 |

### 10.6 The belt ladder and training

Tradecraft's technique ladder (swing to roundhouse; shove to choke; block, parry, slip) stays as written and maps onto the Corps' MCMAP belts (SKILLS reads the belt from the uniform; SETTING names it): tan to CQC 5, grey to 10, green to 15, brown to 20, black from 21 (my call). The dojo scenario (`tradecraft/src/sim/scenarios/dojo.js`) is the template for the mat session on career sol 7, the second Monday (CAREER §5.4; CONTRACTS §3): drills called by the instructor, then bouts against a weaker, an even and a stronger marine and the instructor; "remembered" on a later career it snaps to the bouts (the user, 2026-10-26).

---

## 11. Grenades and explosives in pressurised spaces

The grenades and charges themselves are WEAPONS's items (fuze, filler, state); this section is their use and their effects. COMBAT needs from WEAPONS, per item, the explosive energy `E` (J), the fragment count class and the fuze.

### 11.1 The throw

- Steps (§3.4): from the pouch 1.4 s, pull the pin 0.5 s, throw 0.7 s, optional cook 0–2 s (the fuze runs from the spoon).
- **The roll** is Marksmanship (SKILLS: "a thrown grenade's landing") against `8 + rangeM / 3`, +4 through a doorway, +6 through a hatch, +3 in gravity the thrower is not conditioned to (BODY's G-conditioning and SKILLS's local experience) (my calls).
- **Landing error**: on success, `0.5 + 0.03 × rangeM` m from the aim; on failure, `1 + 0.5 × |margin| + 0.08 × rangeM` m in a random direction. A natural 1 below Weapon handling 10 drops it at your feet ("Grenade!").
- **Ballistics**: real trajectories in the area's gravity, no drag in vacuum, light drag in air; the ceiling bounds the arc; bounces off walls (restitution 0.3) (PLACES's geometry).

**[computed] What low gravity does to a throw** (release at 1.5 m):

| Gravity | Open throw at 18 m/s, 45° | Same in a tunnel with 1.5 m of headroom | A 10 m lob at 45°: speed, flight time | A flat 12 m/s throw: distance before it drops 1.5 m |
|---|---|---|---|---|
| 1 G (Earth, ship at 1 G) | 34 m, 2.7 s | 23 m, 1.3 s | 9.9 m/s, 1.4 s | 7 m, 0.55 s |
| Mars 0.38 G | 89 m, 7.0 s | 38 m, 2.2 s | 6.1 m/s, 2.3 s | 11 m, 0.90 s |
| Europa 0.134 G | 248 m, 19.5 s | 65 m, 3.6 s | 3.6 m/s, 3.9 s | 18 m, 1.51 s |
| Ceres 0.029 G | 1,159 m, 91 s | 142 m, 7.9 s | 1.7 m/s, 8.5 s | 39 m, 3.27 s |

A 10 m lob on Europa hangs for 3.9 s, close to a 4–5 s fuze: it bursts in the air or is seen coming and kicked away. In low g grenades are thrown flat and fast, and skip. COMBAT asks WEAPONS for a low-g grenade with a shorter fuze (about 3 s) and an impact mode (my call).

### 11.2 Fragments

For each person in line of sight of the burst, the number of significant fragment hits is Poisson with mean

`λ(r) = 25 × exposure × (1 − keeps) / r² × exp(−r × P / (101.3 × 12))`

with `r` in metres (at least 0.5), `exposure` stand 1, kneel 0.6, prone 0.3 (a body flat on the floor offers little to a floor burst), `keeps` the cover between, and the last factor the air slowing fragments (none in vacuum) (my calls). Each hit is a fragment wound: BODY's penetrating wound of 1.5–4 points to a random exposed part, after WEAPONS's armour (plates and soft armour stop most fragments where they cover).

**[computed] Chance of at least one fragment wound, standing in the open, 66 kPa:** 2 m 99%, 5 m 53%, 10 m 14%, 15 m 5%. Prone at 5 m: 20%. In vacuum at 15 m: 10% (fragments do not slow).

Interior bulkheads let fragments through at × 0.3 behind them; a warship's pressure hull never; a civilian hull takes a pinhole leak (1 cm²) with 5% chance per fragment that reaches it; a pipe within 3 m opens with 10% chance (PLACES's leak) (my calls).

### 11.3 Blast in a closed room

In the open, blast matters only within a few metres: within 3 m, stunned 2–5 s and deafened; within 1.5 m, a 30% chance of blast lung (BODY). In a closed compartment the gas cannot leave, and the quasi-static overpressure is

`QSP ≈ (γ − 1) × E / V = 0.4 × E / V`

**[computed]** (kPa):

| Charge (E) | 10 m³ | 20 m³ | 40 m³ | 80 m³ | 150 m³ |
|---|---|---|---|---|---|
| Fragmentation grenade (1.0 MJ, about 240 g TNT) | 40 | 20 | 10 | 5 | 2.7 |
| Concussion grenade (2.0 MJ) | 80 | 40 | 20 | 10 | 5.3 |
| Flashbang (0.06 MJ) | 2.4 | 1.2 | 0.6 | 0.3 | 0.2 |
| Breaching charge (0.4 MJ) | 16 | 8 | 4 | 2 | 1.1 |

Effects on everyone in the compartment, by QSP, as a game proxy for the peak and reflected pressures that real injury thresholds are quoted in (my calls): ≥ 10 kPa deafened 1 h to 3 sols; ≥ 20 kPa stunned 2–6 s (CQC's stunned) and suppression +40; ≥ 40 kPa a 50% chance of burst eardrums and 10% of lung injury. Hatches and interior doors rated below the QSP blow open (PLACES's ratings). Loose objects are thrown.

### 11.4 Flashbang, concussion, smoke

- **Flashbang** (rewritten 2026-11-07 with §5; the doctrine proposal's split of shock from physics, the systems proposal's readiness): what it does, and to whom.

  | Effect | Who | Rule (my calls) |
  |---|---|---|
  | **the chaos** | everyone in its room; the next room through an open doorway; in the open within reach | §5.1: `FLASH_PTS` 60 (`FLASH_NEXT_PTS` 20 next door; `60 × min(1, (5 / rM)²)` in the open), × readiness (prepared ×0.25, forewarned ×0.6), × ear defenders (×0.6). Hardening offsets it (§5.3) |
  | **the startle** | anyone it jumps by felt 10 or more who is not prepared | §5.7: `U(1.5, 3) s × (1 − H / 100)²`, halved per repeat within 10 s, halved forewarned; the keys taken. Hardening shrinks it |
  | **flash-blind** | facing within `FLASH_CONE_DEG` 60° of the burst, with no filtered visor | `FLASH_BLIND_MS` 5,000: no new sighting (§25.4.2's light row), looks fail, no aimed shot at what he cannot see; area fire at the last-known place and handling by feel ("no light to see it by" −2, built) remain. Hardening does not touch it |
  | **dazzled** | facing 60° to 120° from it, with no filtered visor | `FLASH_DAZZLE_MS` 2,000 at −3 to sight (the notice check, the identification) |
  | **deafened** | no ear defenders | BODY's hearing ×0.1 for 1 to 6 h, the whine (BODY §17.3; VIEWS §11.2); a voice within about 2 m still heard. Hardening does not touch it |
  | **fire** | soft furnishings | 5% |

  "Military helmets halve the stun and negate the blindness" (2026-11-05) is **withdrawn**: a helmet does neither; ear defenders and a filtered visor do (the doctrine proposal's; my call). **Overruled by the user, 2026-11-07** (question 6: "standard issue combat gear will be combat EVA suits with serious targetting and filtering, night vision"): the Corps' and its peers' line troops wear combat EVA suits (a filtered visor, sound filtering at `EARPRO_K`, night vision), so the UN's line infantry, MSS tactical and enemy special forces are never flash-blind, dazzled or deafened, and take the bang's points ×0.6. Insurgents, pirates, security and the miners are unsuited. **The bang's window is for entries against the unsuited**; against a suited line it is a doorbell and a ×0.6 chaos (§25.18.2). Built in v0.0.9 (`supp.js` reads `protOf`, which reads only worn utilities so far: the suit is a defender's flag in `combat-race`; the player's suit waits for the Corps' worn kit, ROADMAP §5). Utilities have none, so the range scene (`setup=bangs`) stays the user's case: a recruit in utilities, ears unprotected. In vacuum a flashbang is a flash: no chaos, no deafness (§11.5).
- **Your own team's bang** is prepared: called ("Bang out!") and heard, or in your bundle's beat, with you outside its room or your eyes away: ×0.25 and no startle, no flash [computed, T7]: one bang leaves a boot recruit at felt 8 (−1) and a private at 0; three, the recruit 33 (−3), the private 23 (−2), the corporal 4. **The enemy's bang on your stack** is unprepared unless you saw it land (§3.5's `grenade` card, whose new option **Turn away**, 0.3 s, makes you forewarned with your eyes off it): unprepared, one bang leaves the recruit at felt 53 (−5) and startled 1.94 s, the private 43 (−4) and 1.55 s, the sergeant 15 and 0.68 s; forewarned, the recruit 29 (−3) and 0.97 s, the private 19 and 0.77 s, the corporal and up nothing.
- **Concussion** (blast only): §11.3; the room-clearing grenade aboard ship. Its stun (QSP ≥ 20 kPa: 2 to 6 s, CQC's stunned) is overpressure, not a startle: it reaches anyone in the compartment, the tier one included, and hardening does not touch it (my call); its +40 is an input to the pool like any other.
- **Smoke**: a concealment cloud of 8 m radius in 10 s, lasting 60–120 s in still air, cleared by ventilation in 30 s aboard ship (PLACES's air movement); a CS or OC filler adds §9.4's effect.

**As built in v0.0.11**: the bang's noise and deafness need air (section 5.1): with none it is its flash alone. At Melas nothing changes (in test-pairs on 48213 the same bang behind the unprotected marine is felt 43 and startles him 1.45 s).

### 11.5 Vacuum

No air: no blast wave beyond the explosive's own gases (a metre or so), no bang, no smoke cloud that lingers (it expands away). A flashbang is a flash: its pool input is 0, no deafness, the flash kept (§5.1, §11.4). Fragments carry without slowing. A concussion grenade is nearly useless. Suppression from a burst in vacuum comes only from what is seen (§5.1).

### 11.6 Breaching charges

Demolitions (SKILLS's ladder: "a breaching charge on a door" average; "a hull-cutting charge that doesn't vent the next compartment" hard): placing a charge 30 s, priming 10 s, firing on the call. The margin sizes the hole: pass cuts the hatch or a man-sized panel; good does so without spalling into the room; a miss leaves it uncut (retry at −2); bad blows too much (spall into the room as a §11.2 burst of `λ0 = 10`, and a hole one size larger, which vents a compartment you meant to keep). A cutting torch does the same quietly in 6–10 minutes (longhaul's breach times, §14.3).

### 11.7 Doctrine aboard ship (my calls)

- No fragmentation grenades inside a pressure hull without an officer's order: fragments go through interior bulkheads into friends and systems.
- Concussion and flashbangs for clearing compartments; flashbangs only in air.
- Never a breaching charge on a pressure hull with unsuited people on either side, unless the ROE is free and the order is given.
- Thermobaric fillers do not exist in the MCRN inventory: they eat a compartment's oxygen and set it alight.

---

## 12. Casualties, CASEVAC, the dead

### 12.1 From the fall to the surgeon

Care follows tactical combat casualty care's three phases. Every aid action, DC and time is BODY's (ported from tradecraft's `aid.js`); COMBAT sets the flow.
1. **Care under fire.** Win the fire first. The casualty, if able, crawls to cover and puts on his own tourniquet. A rescuer drags him to cover (§3.4) only when the drill's leader says so or the rescuer's band is ≤ 1. Only massive bleeding is treated under fire (a tourniquet high and tight).
2. **Tactical field care**, in cover: BODY's MARCH order (massive bleeding, airway, respiration, circulation, hypothermia and head). The corpsman comes ("Corpsman up!") or a combat lifesaver works (CAREER §5.4's class on career sol 3, the Thursday).
3. **Evacuation**: to the casualty collection point (CCP), then by the request of §12.3, then through the chain of §12.4.

### 12.2 The corpsman's triage

The corpsman NPC sorts casualties he knows of by BODY's `minutesTo(collapse)` and `minutesTo(death)` from his diagnostic look, treats the most urgent one that care can save first, and labels each on the casualty card: **immediate** (dies within an hour without care, saveable), **delayed** (needs surgery, stable for hours), **minimal** (walking wounded), **expectant** (beyond what can be done here). The labels go on the 9-line as precedence (§12.3). The player with Medicine can do the same through BODY's look.

### 12.3 The CCP and the 9-line

- The squad leader names a CCP at the start of the fight, a covered spot behind the line (§7.4 scoring with the threats behind it). Casualties are carried there.
- **The 9-line** (NATO and US medevac request, kept in its real order): 1 pickup location · 2 frequency and call sign · 3 patients by precedence: **A urgent** (within 1 h), **B urgent-surgical** (within 1 h), **C priority** (within 4 h), **D routine** (within 24 h), **E convenience** · 4 special equipment · 5 patients by type (litter, ambulatory) · 6 security at the pickup site · 7 marking method · 8 patients' nationality and status · 9 hazards (on Europa: radiation and pressure at the pickup).
- It is a lived radio call, not a menu: a card with each line pre-filled from what the caller knows (VIEWS draws it), 75 s at Comms pace. A Comms check against 15 decides its accuracy: a miss adds 5 minutes to the evacuation (a wrong grid, a repeat), a bad result 15 (my calls). The player calls it as a team leader or radio operator; otherwise the squad leader does and the player hears it.

### 12.4 The evacuation chain (my calls on roles and times; BODY §18.5 sets each tier's reach; SETTING and PLACES name the facilities)

| Role | Where | Reach | Typical time from the CCP |
|---|---|---|---|
| 1 | the corpsman, the battalion aid station | stops bleeding, airway, chest, fluids, pain, stabilises | minutes |
| 2 | the force's surgical team in the main under-ice town; a warship's sick bay | damage-control surgery, blood, holding | Europa: tunnel crawler ambulance 5 min dispatch + distance at 8 m/s; surface hopper 20 min dispatch + flight, with the crew's dose on the clock |
| 3 | the base hospital at Naval Station Valhalla, Callisto (SETTING §7.2; PLACES §6's naval clinic) | BODY §18.5's base hospital: surgery, the radiation ward, autodocs, the hyperbaric chamber, stays up to 21 bed days. **No neural surgery and no grafts** | 8–20 h by shuttle and transfer, by phasing |
| 4 | Phobos's full hospital, and the Mars cities (BODY §18.5) | everything, **neural surgery and grafts** included (14 days for neural: LONGHAUL's care tiers) | weeks aboard a medical transport. A brain injury is stabilised at Role 3 for the voyage |

A recovery longer than Role 3 can hold goes on to Role 4: CAREER §15.3 sends anyone to Mars whose recovery is over 30 days.

Aboard ship, the sick bay is a carry away, and in free fall a casualty is strapped to a litter and pushed. BODY's bleeding and internal-bleed models race these times; the first hour decides most outcomes. The evacuation, when the player is the casualty, is a skip with its splash (the litter, the crawler, the aid station's lights), interruptible if the fight follows.

### 12.5 When a squadmate dies

- **At once**: everyone who perceives it takes +10 suppression and a stress spike (BODY); their nerve −0.1 (§7.10). A friend whose affinity for the dead is high (PEOPLE) makes a nerve check against 12 or freezes for 10–30 s, staying in cover and not firing (my call). The player's instinct line says it plainly ("Ruiz is dead.").
- **The body**: marines do not leave their dead. Under fire the body is left marked and recovered after; out of fire it is covered, tagged, and carried to the CCP. In free fall it is tethered. His rifle and magazines are recovered (WEAPONS's accountability counts them).
- **Lost with a hull**: whoever is aboard a hull that is destroyed is lost with it, grieved, on the memorial, with no body (longhaul, 2026-10-31).
- **After**: PEOPLE's grief and memories, the hot wash (§17.2), a memorial service in the field (rifle, boots, helmet, tags) lived or skipped, CAREER's memorial and letters, and PEOPLE's replacement in the squad (who arrives, and when, out of view).

---

## 13. Ship combat from inside

The marine does not fight the ship. The ship's NPC captain, weapons officer and CIC fight it with longhaul's doctrine; the marine is aboard, suited, strapped in or working, and lives it as a body in a hull. Longhaul's verdict stands: "combat is mostly waiting", hours in a couch interrupted by seconds of violence.

### 13.1 Two scales, one sim

The ship layer is longhaul's minute sim, ported by TECH (`ordnance.js`, `damage.js`, `agents.js`, `combatants.js`), and it runs **one minute ahead** of the interior. Each minute it resolves what happens in that minute and queues interior events at their second:
- `closestApproach().tau` gives the second a torpedo arrives;
- PDC engagement windows from the endgame's exposure seconds (`min(envelopeM / vRel, 20 s)`);
- slug impacts at their pass second;
- the ship's own launches, burns, flips and jinks from its agent's commands.

The interior plays them at 1:1 or the wait skip (§13.3) lands on them. What the marine can know of them is only what the ship's sensors hold.

### 13.2 Readiness and general quarters

Readiness conditions (my calls, after naval practice):
- **Condition III** (cruising): normal shipboard life (TIME's chapters).
- **Condition II** (threat): set when hostile ordnance is in flight with more than 50 min to run, or a hostile is tracked inside 3,000,000 km. Suits at hand, couches assigned, hatches between sections closed except for passage. Life goes on under 1.5 G.
- **Condition I, general quarters**: set at 50 min before the first predicted inbound arrival (5 min before longhaul's 45-minute counter-burn, so all are strapped in when the ship turns and burns), when a hostile is inside 75,000 km (longhaul's 1× warp threshold), or at the captain's word.

**General quarters for embarked marines**, in order, each a lived step or short activity:

| Step | Time (my calls) | Notes |
|---|---|---|
| The alarm and the 1MC ("General quarters, general quarters, all hands man your battle stations") | | an interrupt to any skip (TIME) |
| Suit up | 120 s at EVA pace; helmet on, visor up | longhaul's donning was 3 min; BODY's suit; the buddy check is 20 s more. Whether the visor stays up is the player's choice until the ten-minute call (§13.3) |
| Weapons cleared and racked at the couch | WEAPONS's clear and rack steps | no loaded weapons on couches under G (my call: a negligent discharge on a couch is a breach) |
| To your couch | walk | longhaul's `planCouches` assigns couches by the shortest longest walk |
| Strap in, juice line connected | 20 s + 10 s | BODY's juice above 1.5 G |
| "Berthing manned and ready" | the platoon sergeant's report | |

Marines of the ship's own detachment (a later posting) man security stations instead: magazine, reactor access, the bridge, the brig, a repel-boarders party.

### 13.3 The wait, and when time is held at 1:1

Strapped in at general quarters, the player may take **Wait at your station** (`wait-at-station`), a skip (TIME owns its contract and splash: the berthing in battle red, the repeater's glow, the clock running fast, chatter as captions). The skip runs to the next **hold point** and stops there:

| Hold point | When it is held at 1:1 |
|---|---|
| Inbound ordnance | from `HOLD_BEFORE_S` 90 s before its predicted arrival through the intercept or hit (the PDCs' seconds) |
| Kinetic inbound | a railgun slug the ship's sensors hold: from the CIC's call ("Kinetic inbound"), at most `HOLD_BEFORE_S` 90 s before its pass, through its hit or miss (below) |
| Our launch | 30 s around it (the thump through the hull) |
| A manoeuvre | a burn change of more than 0.5 G, a flip (6 min at 0 G under longhaul's slew rate), the start of jinking: 30 s around the change |
| A hit | at once, then `HOLD_AFTER_S` 120 s or until no compartment within two decks is changing pressure |
| A call | any 1MC call with new information (new contact, new inbound, a hit elsewhere) and every order to marines |
| The body | a need entering its critical band (BODY), a G-load event (BODY) |
| Boarders | any boarding of our hull |

Outside these, time passes in the skip.

**Slugs are seen, briefly.** A railgun slug shows to radar at LONGHAUL's `SLUG_RADAR_AU` 0.00003 AU (4,488 km) for a quality-1 sensor (`sensors.js`).
- **The range** is that figure times the ship's sensor quality: LONGHAUL's `TECH[tl].sensors × (0.3 + 0.7 × the sensor section's condition)`. That is 1.6 for an intact TL4 hull such as the Coprates class (SETTING §6.3).
- **The warning** is the range over the closing speed. The closing speed is the slug's speed relative to its gun (LONGHAUL: 20, 30 and 45 km/s at TL2, TL3 and TL4) plus the hulls' own closing speed.
- **What the warning gives.** The PDCs cannot engage a slug: LONGHAUL resolves it only against the ship's jinking (`resolveSlug`). So the warning gives nothing to do but seal and brace. The dread is still the design, with up to a minute and a half of it held at 1:1.
- **A correction.** An earlier draft said the warning was "less than a fifth of a second". That was about 500 times too short (the critics' finding, corrected 2026-11-05). LONGHAUL's number is kept unchanged.

**[computed] Warning from the first track to the pass**, by the ship's sensors and the closing speed:

| Ship's sensors (quality) | Holds a slug from | 20 km/s | 30 km/s | 45 km/s |
|---|---|---|---|---|
| a TL4 hull with its sensor section shot out (1.6 × 0.3 = 0.48) | 2,154 km | 108 s | 72 s | 48 s |
| quality 1 (TL2) | 4,488 km | 224 s | 150 s | 100 s |
| TL3 (1.3) | 5,834 km | 292 s | 194 s | 130 s |
| TL4, intact (1.6) | 7,181 km | 359 s | 239 s | 160 s |

The hold starts at the later of the CIC's first track and 90 s before the pass. The 1MC calls "Kinetic inbound" with the time to the pass, then "Brace, brace, brace" at 10 s. A miss is called too ("Kinetic passed, forty metres port").

**Sustained fire** (my call). Holds that overlap merge. A railgun duel can see slugs at intervals of 3 min or less (LONGHAUL's `RAIL_RELOAD_MIN` is 1 per mount). Then each slug's hold shrinks to `HOLD_KINETIC_SUSTAINED_S` 20 s before its pass, so a duel inside 30,000 km does not become an hour at 1:1. The repeater and the 1MC still count every slug down.

**[computed, illustrative]** A torpedo salvo from 3,000,000 km (longhaul's navy launch range) at a FAST TL2 closing speed of 20 km/s takes about 42 h: Condition II for a day and a half of shipboard life, then about 50 minutes of general quarters ending in 90 s of held time. A slug fired from 20,000 km at 45 km/s arrives 7.4 minutes later. An intact TL4 transport tracks it for its last 160 s, so the wait skips to 90 s before the pass.

**What the wait asks of you.** The wait holds no fight for a passenger, so it holds choices with costs (my calls). Each is offered on the T line or by R at the couch:

| Choice | When | What it gains | What it costs |
|---|---|---|---|
| **Visor sealed**, or **visor up** | from "manned and ready" to the ten-minute call, when the platoon sergeant orders visors down. Within 30,000 km of a railgun-armed enemy, visors go down at once | sealed: a breach finds you breathing your own suit (BODY §19.4) | sealed: suit oxygen, cartridge and drink bag spent (BODY §19.3: about 17 h of oxygen at rest), heat (BODY §19.6: the fan exchanger at ×0.7 above 20 °C), −1 eyes, the 140° helmet cone, hearing through the suit (BODY §19.8). Up: comfort, but a decompression costs a **seal visor** step (2 s, EVA against 8 under the shake) before your air is your own, and a 1 m hole empties a 140 m³ deck in 1.1 s (§13.7) |
| **Unstrap** to secure a loose object (a cup, a magazine, a toolbox), or to help a sick neighbour (space sickness, BODY §14.4) | while the repeater's countdown to the next manoeuvre is longer than the job plus strapping back in (20 s + 10 s, §13.2); never above 1.5 G (§13.8) the object secured: a 2 kg toolbox left loose at a 2.5 G jink is a projectile (§13.5, BODY §13.7). A neighbour helped to a bag before he seals his helmet is affinity and a memory (PEOPLE) | a manoeuvre that comes early throws you (BODY §13.7). Unstrapping at general quarters without leave is a discipline entry if the platoon sergeant sees it (PEOPLE). Asking leave first is a 2 s radio call, granted while the next predicted event is more than 2 min off |
| **The head** | under Condition II, timed off the repeater's countdown to the 50-minute call. At general quarters, only when the platoon sergeant calls a head break by couch rows with the next predicted event more than 15 min off | an empty bladder before hours in a couch (BODY §5.1) | otherwise the suit's collection device and its hygiene cost (BODY §5.1, §6, §19.1). A manoeuvre caught in the head is a fall (BODY §16.5) |
| **Volunteer for the repair party** | at "manned and ready", when the platoon sergeant asks for the ready repair team | XP (§17.4: 3 a job), standing (CAREER), the crew's regard (PEOPLE) | you sit in jump seats at the repair locker by the hull, not in an inner couch, and you go first when the 1MC calls: more exposure to hits (§13.6) and to the venting deck (§13.7) |
| **Swap couches** | before "manned and ready", with a willing neighbour, where `planCouches` allows (the same section, the walk still inside the drill time) | an inner couch sits away from the hull wall that a hit's scar picks (§13.6) | the man who takes the hull side takes your risk (PEOPLE: his affinity, the squad's view of it). The hull side is nearer the hatch and the repair locker |

`shipfight` (§20) prints how often each choice changed an outcome: a wound, a death, a breach survived, a discipline entry, a bladder or hygiene event, a job done.

### 13.4 The repeater: the engagement's real timeline

Every berthing and ready room has a repeater (a screen in a pixel-art bezel, VIEWS's longhaul-grammar instrument), showing the CIC's picture at the ship's sensor knowledge: longhaul's threat board (ship-centred, logarithmic range 1 km to 10,000,000 km, inbound red, ours teal, dark contacts hollow, lost contacts as aging fixes) and, under it, a **timeline strip** of the engagement:

```json
{ "kind": "inbound", "id": "ob5521", "salvoId": "sv12", "count": 2, "atMs": 2054112500, "etaKnown": true,
  "sourceId": "h44", "profile": "fast", "text": "Two torpedoes, inbound, time to impact 4 min 10 s" }
```

Ordnance in flight is `ob<n>`, a salvo `sv<n>`, and the firing ship a saved hull, `h<n>`, promoted into `world.hulls` when it fought (CONTRACTS §10; TECH §6.6).

Kinds: `launch` (ours or theirs, when seen), `inbound` (with predicted arrival, updated each minute from the guidance forecast; a slug is an `inbound` with `"profile": "slug"` from the second it is tracked, §13.3), `envelope` (entering our PDC envelope), `intercept`, `hit` (where, as reported), `burn`, `flip`, `jink`, `contact` (new, lost, identified). Past events stay on the strip; predicted ones count down. Items exist only if the ship knows them: a cold torpedo (LONGHAUL's `TORPEDO_RADAR_AU` 0.0002 AU, 29,920 km for a quality-1 sensor) appears on the strip only 25 minutes before it arrives at 20 km/s, instead of the hours a talking torpedo gives **[computed]**. The repeater shows only if the player's couch faces it or they are near it; the suit's visor band shows the general-quarters state, the compartment's pressure and the 1MC's captions, not the tactical picture (my call).

### 13.5 G, the 1MC and the PDCs

- **G**: the ship flies longhaul's doctrine (counter-burn away from torpedoes 45 min out; jinking at `2.5 G × TECH.evade` in random 8 s segments at battle stations; sprints at maximum G on the high dose while strokes stay under 10% of the crew, then 6 G). BODY turns it into the body's experience (juice, grey-out, vision); VIEWS shows it in the body, not the camera. The interior needs the felt vector: thrust along the axis presses into the couch; jinks have lateral components that slide anything not secured across the deck plane (longhaul's `inertia.js` re-cut to tower decks, PLACES and BODY).
- **The 1MC** (the CIC's voice, captioned): new contacts; "Vampire, vampire, two inbound"; time to impact at 10 min, 60 s and 10 s; "PDCs engaging"; "Splash one"; "Brace, brace, brace"; hit reports by deck and frame; repair party orders.
- **The PDCs**: their buzz-saw comes through the structure for the exposure seconds (50 rounds a second per mount, longhaul's `PDC_RPS`); the sound tells the marine the fight is now.

### 13.6 Hits as interior events

Longhaul's `damage.js` stays authoritative for the ship's capability: sections, armour shed (`dp × (1 − min(0.6, armor × 0.12))`), containment and scram, the hull's integrity. The interior uses the same penetrating DP to make geometry (my calls, calibrated so that averages match longhaul's per-deck odds: breach `min(1, d/40)`, fire `min(0.5, d/90)`, fault `min(1, d/45)`, wound `min(0.9, d/90)`):

1. **Where**: the hit's scar `(u, v)` (hash-placed by longhaul) picks the deck from `u` and a hull wall cell from `v`; the compartment behind it takes the hit.
2. **By weapon**:
   - **HE torpedo**: a hole of `0.2 + dp / 60` m², at most 2.5 m²; a **spall cone** from the hole into the compartment, half-angle 35°, depth `2 + dp / 5` m, fragment mean `λ = 0.8 × dp / r²` inside the cone; a **blast term** for everyone in the compartment, `λ = 0.0285 × dp × 100 / V` (V in m³), ×0.4 for people strapped into couches; interior bulkheads in the cone take secondary holes of 0.01–0.05 m².
   - **Railgun slug**: a straight line through the hull from the scar along the shot's bearing; each compartment crossed takes entry and exit holes of 0.002 m² (5 cm); anyone within 0.3 m of the line is killed or loses the limb (BODY's hypervelocity wound); within 1.5 m, `λ = 3` spall; each fixture on the line faults with 80%; fire 10% per compartment crossed.
   - **PDC rounds** (a strafe that gets through): `round(4 × dp)` holes of 0.0005 m² scattered within 3 m of the scar; per round, `λ = 0.6` for people within 2 m; faults at 30% for fixtures within 1 m.
   - **Nuclear near miss** (spread): every compartment takes a local `dp × 0.5 / decks`, a few small holes, an EMP fault chance of 20% per electronic fixture, and BODY's prompt dose by distance and shielding.
3. **Fire**: with chance `min(0.5, dp / 90)` at intensity `0.1 + min(0.4, dp / 150)` in the hit compartment (longhaul's numbers, unchanged).
4. **Faults**: each fixture in the cone or on the line faults with `min(1, dp / 45)`.
5. **The shake**: unrestrained bodies on the hit deck are thrown at `dp / 30` m/s (longhaul's `applyImpact` speeds), half that on adjacent decks; VIEWS shakes the picture by the same number.

**[computed] Wounded share of the people in a 10 × 14 × 2.5 m compartment, by penetrating DP, against longhaul's per-deck odds:**

| DP | this model | strapped in couches | longhaul `min(0.9, d/90)` |
|---|---|---|---|
| 6 | 0.08 | 0.05 | 0.07 |
| 18 | 0.21 | 0.14 | 0.20 |
| 36 (an HE torpedo on a Hellas frigate after armour) | 0.40 | 0.29 | 0.40 |
| 70 | 0.60 | 0.44 | 0.78 |

In a small 5 × 6 m cabin the same 18 DP wounds 67%: where you are matters, which longhaul's deck dice could not say.

### 13.7 Decompression and fire

PLACES owns compartment atmospheres, venting, hatches and fire (ported from longhaul's `life-support.js` and `fire.js` with real gas physics). COMBAT supplies holes `{ compartment, x, z, areaM2 }` and fires, and needs back: pressure per compartment over time, flow near holes, and doors that hold or blow. For scale, the choked-flow time constant `τ = V / (0.0404 × Cd × A × R × √T)` (Cd 0.8, 293 K) gives **[computed]**:

| Hole | 30 m³ cabin | 140 m³ deck |
|---|---|---|
| a rifle bullet (6 mm) | 111 min | 8.7 h |
| a PDC round (25 mm) | 6.4 min | 30 min |
| 5 cm (a slug) | 96 s | 7.5 min |
| 30 cm | 2.7 s | 12.5 s |
| 1 m (HE) | 0.2 s | 1.1 s |

Pressure falls to 35 kPa from 101.3 in 1.06 τ. A bullet hole is a slow leak to patch; a torpedo hole empties a deck before anyone can move. Near a hole above 0.1 m², unrestrained bodies within 2 m are pulled toward it for the first τ (the `vent` reflex, §3.5), and loose objects fly out.

### 13.8 Damage control the marine can do

Damage control central (an NPC, the damage control assistant) posts jobs to longhaul's job board (`jobs.js`, reused) and orders repair parties over the 1MC ("Repair party two to deck seven, breach at frames forty to forty-four"). Embarked marines are a secondary repair party. Each job is lived; Tech and the other skills pace and roll it (my calls on times and DCs, after SKILLS's ladder: "patching a hand-sized hole in a pressure wall" is average).

| Job | Needs | Base time | Roll | Notes |
|---|---|---|---|---|
| Patch a hole under 2 cm | suit if venting, patch kit | 30 s | Tech vs 8 (+4 in flow) | the commonest job after a strafe |
| Seal a hole of 2–10 cm | foam canister and plate | 90 s | Tech vs 12 (+4 in flow) | |
| Plate a hole of 10–40 cm | plate kit, two people | 6 min | Tech vs 14 | the second person gives SKILLS's help and halves nothing: hands are needed |
| A hole over 40 cm | | | | not patchable in the fight: isolate the compartment |
| Close and dog a hatch | | powered 4 s, manual 12 s | Fitness vs 6 + ΔP kPa / 5 | cannot be closed against more than 10 kPa of flow without help |
| Fight a fire | extinguisher, suit | knocks intensity back 0.12 a minute (longhaul's `FIGHT`) × `(1 + Tech / 20)` | none | |
| Isolate a line | the valve | 10–30 s | Tech vs 6 | water, oxygen, coolant: a burst line is its own hazard |
| Put an unsuited person into a rescue ball | rescue ball | 20 s | Medicine or Tech vs 8 | a personal rescue enclosure, real hardware |
| Free a trapped crewman | pry bar | 30–120 s | Fitness vs 12 | |
| Carry a casualty to the sick bay | litter or carry | walk | Fitness | in free fall, push a strapped litter |
| Shore a bulkhead | shoring kit | 5 min | Tech vs 12 | |
| Reroute power | the panel | 2–10 min | Tech vs 14 | normally an engineer's |

While any compartment is breached, the ship caps its drive at 1 G "so the crew can move" (longhaul's damage-control mode), and nobody unstraps above 1.5 G (the standing order).

### 13.9 After general quarters

Secure from general quarters; casualties to the sick bay; the berthing's dead counted; the ship's log as a paper; suits stowed; the evening's meal late. The after-action (§17) covers the engagement.

---

## 14. Boarding

### 14.1 Phases and timings (longhaul's `boarding.js`, kept)

`muster → cross → breach → fight → secured → return`. Muster waits up to `MUSTER_LIMIT_MIN` 25 for stragglers (cap 90). Cross by a mated collar `COLLAR_MIN` 2 min, or by EVA within `EVA_RANGE_M` 2,000 m at `EVA_SPEED_MS` 2 with the target still (relative speed under 2 m/s, not thrusting). Breach: cut an EVA hatch `BREACH_EVA_MIN` 10, a collar's inner hatch `BREACH_COLLAR_MIN` 6. Secured actions: search 20 min, take stores 40, prisoners 15, scuttle 10 to set with a 120 min fuse, salvage 45, accounts 30. Longhaul's own note, "Boarding a station is a marine operation: not yet", is OLYMPUS's to answer: stations are boardable, and the station's deck program is PLACES's, authored. **The hull is authored, the boarding is drawn** (§1): a target is one of PLACES's hand-made deck programs for its class (a hauler, a smuggler, a Belt runner, a frigate), the same decks in every career; which hull of the class it is, its name, its crew and how many of them fight (§14.4), where they barricade, and the objectives (§14.6) come from the operation.

Doctrine (my call): board only after the target's PDCs are disabled (longhaul's DISARM aim) or it has struck. A PDC that still works kills an EVA crossing ("PDC raking is a finisher": a coasting target is hit nearly 100%, and so is a marine on a thruster pack).

### 14.2 Muster and crossing

- **Muster** at the boarding lock: suits on and checked (buddy check 20 s, EVA suit check per SKILLS), weapons with frangible loads (WEAPONS), breaching kit, the stack order given by the team leaders. Lived.
- **By collar** (the target mated by force or surrendered): capture 2 min, seal 3 min (longhaul's docking timings), equalise (or not: §7.8's rule), then the inner hatch.
- **By EVA** (§15): tethered to a guide line where one is shot across, otherwise free flight on packs. **[computed]** With the combat pack (§15.1) accelerating at 0.15 m/s² and cruising at 2 m/s: 50 m in 0.6 min, 200 m in 1.9, 500 m in 4.4, 1 km in 8.6, 2 km in 16.9, about 4 m/s of Δv per crossing.
- **A crossing is never an outcome skip** (the user, 2026-10-29: "it would skip all the gameplay"; TIME §5.1.2). Its first minute is lived. Past that it runs on TIME's fast-forward: the real sim in chunks under `FF_MAX_MS` 120,000 (CONTRACTS §2), with perception, the feel and the visor band live, at TIME's full rate, since in the void there is nothing to read but the target and the gauges (my call). It drops to 1:1 at any contact, when `threatKnown` turns true (§6.1), when a weapon or the target's PDC tracks the party, and at 50 m from the target's hull, where the last metres are tethered and lived.

### 14.3 Breach

| Method | Time | Roll | Consequence |
|---|---|---|---|
| Cycle the airlock by override | 2–5 min | Tech vs `10 + 3 × TL` (TL2 16, TL4 22) (my call) | quiet; the defenders' panel shows the lock cycling |
| Cut the outer hatch with a torch | 10 min (EVA), 6 min (collar) | none (longhaul) | quiet but slow; defenders gather |
| Cutting charge on the hatch | 40 s | Demolitions (§11.6) | loud; the airlock is gone |
| Charge through the hull into a compartment | 40 s | Demolitions, hard | the compartment vents: everyone in it unsuited dies (§13.7); ROE free and an order only |

### 14.4 Defenders by type

Numbers come from longhaul: `fighters = aboard × share × (0.6 if the hull was beaten) × U(0.8, 1.2)`; a crew that has struck keeps holdouts with 30% chance for pirates and 12% for others, numbering 15% of the crew; an invited boarding has no fight. `aboard` is the target hull's `e.combat.crew` fraction times its class crew.

| Category | share, quality | Who | Doctrine aboard (my calls) |
|---|---|---|---|
| military | 1, 0.75 | UNN and other navies' crews | suited at battle stations; barricades at the ladder shaft and before the bridge and engineering; may try to scuttle (30% when losing) |
| authority | 0.85, 0.6 | police cutters, Martian Security | hold the bridge; surrender when it is lost |
| irregular | 0.9, 0.55 | pirates, cells | ambushes in cargo spaces; some unsuited; hostages; scuttle 10% |
| civilian | 0.3, 0.3 | merchant crews | hide in cabins; most surrender at the first shout |

Defenders know their ship: +2 to their Fieldcraft and Tactics aboard (my call). Their skill sheets follow §7.9's mapping.

**Scuttling** (my call): a defender at engineering may set the reactor to fail: 10 min of work, then a countdown of 15–30 min to containment failure, which marines stop only by reaching engineering and an engineer's scram (longhaul's 90-minute containment model gives the shape; this is faster because it is deliberate). The countdown shows on the target's own panels, which marines can read when they see one.

### 14.5 Zero-g close-quarters battle

A disabled target coasts, so most boardings are fought in free fall. The movement model is BODY's (push-offs, handholds, mag boots); the gun's recoil drift and spin while floating are WEAPONS's (a 5.56-class round gives a 120 kg suited marine about 0.05 m/s, 1.5 m/s for a full 30-round magazine **[computed]**). COMBAT sets how it fights:
- **Steps** (§3.4): push off, grab, plant boots, unplant. Their speeds, DCs and failures are BODY §16.6's, and COMBAT keeps no numbers of its own for them.
  - BODY's numbers: push-offs at 0.3, 0.6, 1.2 or 2.0 m/s; a grab that holds under 1.5 m/s, takes a roll from 1.5 to 3 m/s, and is an impact above 3 m/s; failures as BODY sets them.
  - They roll Zero-g, which SKILLS §2.2 gives push-offs, grabs and landings. EVA stays the skill for suit work.
- **What a fight adds to them**:
  - Under fire a push-off is an exposing step.
  - A push-off's direction error lengthens the path, and so the time in the open.
  - Every free-fall roll carries SKILLS §5.13's `mitigated(−6, Zero-g)` when unanchored and −2 when anchored. A push-off is made from a hold (anchored); a grab is made in flight (unanchored).
- **Exposure in flight**: a body crossing a 10 m compartment at BODY's 2.0 m/s sprint push-off is in the open for 5 s and cannot stop or turn. Doctrine: move from handhold to handhold along walls, never across the open middle, and cover every crossing.
- **Anchors** decide how a marine shoots (WEAPONS): planted boots, braced on a handhold, or floating.
- **Cover** works as §4 with `float` and `tuck`; the deckhead is a place to be.
- **Grenades** fly straight and bounce (§11.1 with no gravity); nothing rolls under a door.
- **Casualties** float. A casualty is tethered to a handhold (4 s) before anything else; blood forms globules (VIEWS, BODY).
- **Hearing**: a pressurised target has sound; a vented one has none (VIEWS's vacuum perception: touch and the suit radio).

### 14.6 Objectives and the end

Objectives come from the operation (CAREER §11.3's mission generator, placed on the authored hull's own compartments): the bridge, engineering (always, against a scuttle), the brig, the cargo, prisoners, the logs. The ship is **secured** when every compartment is cleared or the remaining defenders surrender (longhaul's rule: they give up at none left, or at 10% left for quality above 0.7, or 35% left with 50% a minute). The party falls back when 30% or fewer of it can fight, carrying whom it can (longhaul). Return needs a mated collar or EVA range: "a party can only come back across what it can cross".

### 14.7 Other squads in the same boarding

The player's squad clears its own decks on the stage. Other squads clear theirs as off-screen exchanges (§16), one per deck, reporting "Deck four clear" on the net when they finish. A failed squad's surviving defenders move toward the nearest fighting, entering the player's deck by its shaft out of view (§16.3).

---

### 14.8 Zero- and low-g technique, and the fight off thrust

Added 2026-11-08 for the user's lore of that day (DESIGN.md's log): "zero/low G specific techniques for ship battles when not under thrust (mag boots etc)". SETTING §5.11 gives the why and the cadences, WEAPONS §3.9 the void kit, BODY §16.6 the movement's numbers, PLACES §5.7 where it is trained (the Wells, the Cold Well, the Wreck). COMBAT keeps no movement numbers of its own (§14.5); these are the Corps' rules for using them, my calls throughout, and the `void` drill family's beats (§25.3, at 0.5).

**Anchor before you fire.** The first rule of the void: a marine fires from an anchor or not at all, because a floating marine keeps every round's push (WEAPONS §7.8). The anchors, best first, each mapped to WEAPONS §7.8's rows:

| Anchor | How | WEAPONS §7.8 row | When |
|---|---|---|---|
| **The wedge** | back against one wall of a passage, feet against the other (a passage of 0.8 to 1.2 m: a ship's) | `braced` | holding a passage or a hatch; the best there is |
| **Boots** | both mag boots planted on a ferrous face (BODY §16.6: one boot always locked; 300 N a boot) | `magBoots` | on decks and bulkheads marked ferrous; the line's way |
| **Buddy brace** | a teammate on boots or a hold has the shooter's harness | `braced` (the teammate fires nothing) | a crossing's far side before the boots are down; a casualty's escort |
| **Lanyard** | the 0.5 m strap clipped to a pad-eye or a handhold (1.0 s at value 10) | `handhold`, both hands on the gun | the Wells' grid, the Wreck's pad-eyes; anywhere with a hard point |
| **One hand** | a hand on a hold, the gun in the other | `handhold` (a rifle one-handed −4) | the pistol and the V-5 only |
| **Floating** | nothing | `floating` | never by choice: a single shot at need, then a grab |

**Hold to hold, never the middle.** Movement runs along the faces from hold to hold (§14.5): a 10 m compartment crossed at a 2.0 m/s push-off is 5 s in the open with no way to stop or turn. Where a compartment must be crossed open, the team shoots the **LL-30**'s line across first (WEAPONS §3.9) and goes hand over hand along it, two at a time, covered from boots on the near face.

**Six faces.** Off thrust a compartment has no floor: the hatch the stack enters by may be in any face, and the threats sit on all six. Sectors are faces, not arcs: the #1 takes the face opposite the hatch, the #2 the face the hatch is in (the dead space round it), the #3 and #4 the deckhead and deck as the ship names them; the corners where three faces meet are the dead space a man hides in. The stack enters along the hatch's face, never straight through the middle, and the first man in plants his boots on the nearest ferrous face before he fires (the wedge is better when the hatch is a passage's). These are the `void` family's beats (§25.3, at 0.5), drilled in the Wells and the Wreck.

**Feet aft.** In a coasting ship the drive can light: the flip's end, an evasive burn, a ship that is not beaten yet. When it does, everything loose falls aft, and a marine floating in a compartment falls with it [computed: `√(2 g h)`]:

| A body floating this far from the aft face when the drive lights | at 0.3 G | at 1 G | at 3 G |
|---|---|---|---|
| 3 m | 4.2 m/s after 1.4 s | 7.7 m/s after 0.8 s | 13.3 m/s after 0.45 s |
| 10 m | 7.7 m/s | 14.0 m/s | 24.3 m/s |

At 1 G a 3 m fall is BODY §16.5's bone-breaking band (5 to 8 m/s), and a 10 m fall at 1 G or more is in the lethal band or worse (12 m/s and up). A scene's thrust is a profile of events (PLACES §3.11, §3.16): a burn, a cut, a flip or a jink, each preceded by the "brace" siren and the 1MC's "Brace, brace, brace" when it is announced, so the rule below is a reflex the siren starts. Hence the rule: off thrust, keep a face on the drive's side (the aft face, the "deck" under thrust) within a body length, boots toward it when they are planted on another face, and make for it at the 1MC's "secure for burn" (PEOPLE §6.8, §13.2). A burn with no warning is a reflex card (TIME's, BODY §13.7's thrown body): "Grab" or "Turn feet aft". The saying "Feet aft." (SETTING §5.9) is this rule.

**Footing holds the recoil** (the user, 2026-11-08: "Try keeping rifles looking like rifles even zero G stuff, let's say we use footing to hold recoil"). Every gun in the void kit is rifle-shaped and shouldered like a rifle, in every gravity; what holds its kick is the anchor above (the wedge, boots, the buddy brace, the lanyard; WEAPONS §7.8's rows), never a launcher-like carry. The V-5X countermass carbine, fired over the shoulder, is withdrawn (WEAPONS §3.9, question 19), and with it the "Back clear!" call, which returns only if a countermass or other back-blasting gun is designed again in a rifle's form (my call); the V-5, J-12 and R-7 throw nothing behind the shooter.

**The kit by place** (the team leader's choice, from the armoury's void kit): inside a pressurised compartment, the V-5 with frangible rounds (the hull is the first thing to defend, SETTING §5.2's "Mind the seals"); in a vented compartment the same; outside, on a hull or a crossing, the J-12 with ball and the R-7 from boots, both with a backstop or open sky (WEAPONS §2.6's EVA rule). The R-7 is never wrong to carry, only slow to use: a marine whose ship is boarded with only his ground kit fights from the wedge and his boots, a round at a time.

**Repelling boarders** (the Corps' first mission, SETTING §5.2). When the ship itself is boarded it is usually coasting, beaten or about to be: the detachment holds the hatches nearest the likely breach from the wedge and from boots on the faces either side, never in the hatch's line, the reactor and the bridge first, and lets the attackers come across the open middles the defenders have kept clear of cover. The defenders' +2 for knowing their ship (§14.4) is the marines' too, aboard their own.

**Low g** (0.05 to 0.3 G: a light burn, Europa, Callisto, Ganymede, Ceres Station's drums; WEAPONS §7.8's `light` anchor): the gun skates the shooter on automatic, so single shots kneeling or prone, braced on a fixture where there is one; the run is BODY §16.7's bound, which cannot turn in the air, so a rush goes cover to cover in straight lines; a grenade thrown with a Martian arm goes long (§11.1); and a body knocked down takes a second or more to land (§10.2's slow fall).

**Where it is trained**: the Wells' anchors and faces, the zero-g mat, the void arms on the live face, the Wreck's compartments, the Cold Well's tethers (PLACES §5.7), in a company's void week once a quarter of a dwell and in the schools (CAREER §9.3, §10.1); at sea, at the flip and in the coast (§13.2). Each void week block is a session of SKILLS §6.4's zero-g hall row, and its clean runs count toward the `void` rungs (§25.3).

## 15. EVA in combat

### 15.1 Tethers, packs and hull walking

- **Tethers**: 10 m standard (my call); clip and unclip 2.5 s each at EVA pace, an EVA roll vs 10 under fire; the two-tether rule (always one clipped while moving along the hull). A tethered marine's motion is bounded by the line.
- **Thruster packs.** The suit's own pack is BODY §16.6's: 10 m/s of Δv at 0.3 m/s², and a 3 m/s emergency jet. BODY owns it with its accelerations. For boarding crossings the Corps issues a heavier **combat pack**: `{ dvMs: 25, accelMs2: 0.15, rotDegS2: 10 }` (my call, after NASA's MMU at about 0.09 m/s² and 20 m/s of Δv, and SAFER at 3 m/s). It is an item for WEAPONS's kit list, and BODY owns what it does to the body. Δv is a resource on the visor band. A pack shot through vents its gas as an unwanted burn (WEAPONS's hit on equipment; BODY's suit).
- **Mag boots on a hull**: 0.5 m/s walking, each step peel and plant (BODY). No hull walking while the ship thrusts above 0.05 G: under thrust the hull is a cliff, and a fall is a fall behind a ship accelerating away.

### 15.2 Seeing and talking in vacuum

No sound: perception is sight, the suit radio and touch (VIEWS §2.11's vacuum awareness, 1.0 m). Shots are seen by their flash and their impacts. Suppression is mostly from impacts (§5.1). Orders go by radio, signals or helmet contact (§8.1). Light on Europa is 3.7% of Earth's sun plus Jupiter's shine (PLACES and VIEWS light): helmet lamps make their own pools, and a lamp is a target.

### 15.3 Europa's radiation clock

Europa's surface takes about 5.4 Sv a day of radiation unshielded (DESIGN; a sol is Mars's). BODY owns the dose model and the suit's shielding (`doseRateSvH` behind a combat suit). COMBAT sets the operational rule (my calls):
- Every surface EVA has a **dose plan**, `EVA_DOSE_PLAN_SV` 0.020 by default, set by the operation. The squad leader calls return to base at 80% of plan.
- The emergency ceiling is `EVA_DOSE_CEILING_SV` 0.100, which only an officer's order lets anyone pass, to save a life.
- The dosimeter on the visor band is a clock: plan time = `0.020 / doseRateSvH`. At a suit dose rate of 0.03 Sv/h that is 40 minutes; at 0.1 Sv/h, 12.
- Passing the plan is recorded (CAREER's medical record, BODY's dose). Staying out past it to finish a fight, or to carry a man in, is a choice the game puts in front of the player and the after-action reads.

---

## 16. Off-screen fights as outcomes

### 16.1 Squad-scale exchange (adapted from longhaul's `boarding.js` `fightMinute`)

For fights with no actor in the live area, per minute (my calls, calibrated below):
- Each side's **power** `P = Σ q × health × efficiency × kOff × plan`, where `q = clamp(0.2 + 0.8 × v / 24, 0.2, 1.5)` and `v` is the fighter's mean of Marksmanship, Fieldcraft and Tactics (SKILLS's values); `health` and `efficiency` are BODY's and longhaul's `efficiency` (needs, morale); `kOff` the kit (MCRN TL4 1.25: optics, night sight, networked helmets; UNN TL2 1.0; corporate 1.0; pirates 0.9; irregulars 0.8; enemy SF 1.4); `plan = 1 + (leader's Tactics − 10) / 50`.
- Each side's **defence** `D = kDef × posture`: kDef MCRN 1.5 (plates, helmet, suit), UNN 1.3, corporate 1.2, pirates 1.1, irregulars 1.0, SF 1.5; posture open 1.0, in cover 1.3, prepared 1.6, assaulting 0.8. An ambusher's power is ×2 and the ambushed's defence ×0.7 in the first minute.
- **Casualties** to B this minute: `Poisson(K × P_A / D_B)` with `K = 0.10`, each one killed with the side's KIA share (MCRN 0.2, UNN 0.25, corporate 0.3, irregulars and pirates 0.4, SF 0.25), otherwise wounded and out of the fight.
- **Ends**: a side breaks at its type's loss threshold (§7.9) with 50% a minute; it surrenders at 10% left (quality above 0.7) or 35% left with 50% a minute (longhaul's rule); or it is destroyed. At most 60 minutes, then it becomes a standoff.
- **Named people** (PEOPLE's tiers 1 and 2) who are casualties are picked by exposure: the side's leader and the AR take ×1.5 weight (my call). Their wounds go through BODY's closed-form summary, and their deaths through PEOPLE's death and CAREER's memorial.

**[computed] Calibration (4,000 runs each, seeded):**

| Fight | A wins | B wins | Minutes | A casualties (KIA) | B casualties |
|---|---|---|---|---|---|
| MCRN squad 13, open, vs 13 CFB in cover | 99% | 1% | 7.4 | 1.6 (0.3) | 4.9 |
| MCRN squad 13 ambushed by 13 CFB in cover | 98% | 2% | 7.7 | 2.1 (0.4) | 4.8 |
| MCRN fire team 4 assaulting 4 CFB, prepared | 72% | 27% | 10.7 | 0.9 (0.2) | 1.7 |
| MCRN fire team 4 vs 4 CFB, both in cover | 89% | 10% | 9.9 | 0.5 (0.1) | 2.0 |
| MCRN squad 13 assaulting 10 corporate security, prepared | 89% | 10% | 10.4 | 3.1 (0.6) | 4.3 |
| MCRN squad 13 boarding, 8 pirates prepared | 99% | 1% | 7.6 | 1.7 (0.3) | 3.6 |
| MCRN squad 13 vs UNN squad 13, both in cover | 78% | 21% | 15.3 | 4.0 (0.8) | 6.9 |
| MCRN squad 13 assaulting UNN squad 13, prepared | 33% | 65% | 14.4 | 6.5 (1.3) | 4.9 |
| MCRN squad 13 ambushed by 6 enemy SF | 47% | 51% | 10.4 | 5.9 (1.2) | 3.6 |
| MCRN platoon 42 assaulting 40 CFB, prepared | 100% | 0% | 8.4 | 6.6 (1.4) | 14.3 |
| MCRN squad vs UNN, both in cover, our leader's Tactics 20 against 10 | 87% | 12% | 13.3 | 3.5 (0.7) | 7.4 |

The shape follows longhaul's: "between hulls of a size, the better-built ship wins", and attacking a prepared peer is costly. A small fight takes 7 to 15 minutes, which matches the stage's own fights (§20).

### 16.2 Company scale and the theatre

Above a platoon, and for the world's hourly incidents, longhaul's `conflict.js` clash rule is used as is: the loser by Lanchester's linear law weighted by toughness, `lossA ∝ nA × mightB / mightA`, with `might` the sum of §16.1's `q × kOff × kDef` per fighter. The world layer (TIME's cadence, SETTING's theatre) supplies **ground incidents** for the Europa mission, after longhaul's insurgency zone (`INCIDENT_RATE` 0.01 an hour × intensity, OPA influence 0.30 over the threshold). The kinds and their resolvers (my calls): sniping (one shot at a post: §16.1 with 1 against the post's watch), IED on a patrol route (a Demolitions-rendered device or a blast; BODY casualties), riot at a water works (§9.8's agitation as an outcome), raid on a pump station (§16.1), kidnapping of an observer, ambush of a convoy (§16.1 with the ambush terms). Each produces casualties, news (light-speed, longhaul's `relay`) and, near the player, a reason for the next patrol.

### 16.3 Waking a fight onto the stage

When the player comes within perception range (or radio contact) of an off-screen fight, it becomes a fight record (§2) with its survivors placed by the exchange so far: each side's living fighters at positions sampled from the area's cover field near the fight's location, out of the player's view, wounded where they fell, dead where they died (my call). Nothing appears in view: placement is refused within the player's view cone and reach, and a survivor that would appear there waits behind the nearest occluder (PEOPLE's no-pop rule). A fight that leaves the live area goes back to the exchange with its current numbers.

---

## 17. After-action

### 17.1 Consolidate and reorganise

When the fight record closes, the squad consolidates (§7.7). For the player this is an activity, **Consolidate** (TIME's skip contract, 10–20 min, my call), interruptible: security posted, enemy dead and wounded searched, detainees restrained, magazines redistributed (WEAPONS: who has how many), the ACE report (ammunition, casualties, equipment) sent. The player may live any of it instead.

### 17.2 The hot wash

The same sol, at the base or the patrol base, the squad leader runs a short debrief: a scene (lived, or skipped to its outcome) where the squad sits, the leader goes through what happened from the reports, and people speak from their memories (PEOPLE). The player's conduct is named: orders obeyed, steps that worked, mistakes, and anyone's death. Trust moves (PEOPLE).

### 17.3 The after-action report

A paper (TIME's papers), written from the log and the side's board, never from the truth unless the investigation found it:

```json
{ "kind": "aar", "fightId": "fg193", "unitId": "2/4-E-2-1", "where": "Tyre Works, Pumping Station 3, level 2",
  "fromMs": 2051333000, "toMs": 2051781000,
  "timeline": [ { "atMs": 2051339400, "text": "Contact, east passage, two rifles, 40 m (LCpl Tanaka)" } ],
  "friendly": [ { "who": "p56", "state": "dow", "precedence": "A", "evacMin": 46 } ],
  "enemy": { "confirmed": 3, "probable": 1, "detained": 2 },
  "civilian": { "killed": 0, "wounded": 1, "by": "enemy fire" },
  "you": { "rounds": 61, "magazines": 3, "hitsClaimed": 2, "hitsConfirmed": 1, "ordersObeyed": 5, "ordersNotObeyed": 0, "cas": true },
  "useOfForce": [ { "id": "uf412", "finding": "justified" } ],
  "conductUnderFire": "good", "valour": [ { "kind": "drag-under-fire", "grade": 1 } ], "initiative": null,
  "lessons": ["The east passage was covered by one man for ninety seconds."],
  "xp": [ { "class": "contact", "base": 15, "outcome": 0.8, "difficulty": 1.0, "risk": 1.2, "total": 14.4 } ] }
```

The paper prints the unit from its id ("1st Sqd, 2nd Plt, E Co, 2/4") and each person by name and rank (CONTRACTS §10).

- `conductUnderFire` (good, adequate, poor) feeds CAREER's standing (+5 for good). It reads: orders obeyed, returning fire, staying with the team, aid given, steps taken while suppressed.
- `valour` events feed CAREER's valour medals by grade (my calls): 1, an act under fire for a comrade (a drag, aid in the open), or taking charge of the team under fire (§8.5); 2, the same under heavy fire (band 3) or wounded; 3, an act that turned the fight or saved several at mortal risk. The Combat Action Ribbon is CAREER's: under hostile fire and returned it (`cas`).
- `initiative` (§8.5) is `null`, or `{ tookAtMs, why: "tl-down" | "tl-out-of-contact" | "tl-frozen", orders, outcome }`. The hot wash names it, and CAREER §8.5 reads it.
- A training fight's paper (§2.3) adds the harness log for each training casualty: who hit him, from where, his posture, cover and band, and the step he had chosen.
- "What you didn't see": the paper may add, hedged, what the unit learned that you did not perceive ("A second cell was in the upper gallery."), tradecraft's result-paper rule.

### 17.4 XP

Tradecraft's `xp.js` rule, class × outcome × difficulty × risk, plus 0.1 for each won roll, with combat classes (my calls; SKILLS spends it on Warfighting by its own rules and caps training at 25):

| Class | Base XP |
|---|---|
| Training: range day 6 (WEAPONS), mat session 4, fire-team drill or field exercise 5, shoot house 6, suit drill 3, EOF lane 4 | as listed |
| Contact (a firefight you were in) | 15 |
| Room or compartment cleared under fire | 4 each, at most 5 |
| Boarding | 20 |
| EVA combat operation | 15 |
| Ship engagement endured at general quarters with inbound fire | 4 |
| Damage control job done at general quarters | 3 each |
| CASEVAC under fire (carrying, treating) | 6 |
| EOF incident resolved without lethal force | 8 |
| Detention | 3 |

Outcome: objective met with no friendly KIA ×1.0; met with KIA ×0.8; contact broken on order ×0.7; failed ×0.4; fled or disobeyed ×0.15. Difficulty: irregulars ×1.0, authority ×1.1, peer military ×1.4, special forces ×1.8; outnumbered ×1.2, by two to one ×1.4. Risk: vacuum ×1.2, free fall ×1.3, Europa surface ×1.2, darkness ×1.1, you were hit ×1.2, you were pinned ×1.1.

---

## 18. Porting map

| Source | Verdict | What changes |
|---|---|---|
| `tradecraft/src/sim/cover.js` | **adapt** | blockers from PLACES's fixtures; stop from WEAPONS per round; postures kneel, prone, float, tuck; elevation; concealment split out; cover field; 15 m dash; wear (§4) |
| `tradecraft/src/sim/shooting.js` | **adapt the mode's glue** | WEAPONS owns the resolver; COMBAT adds steps (movement, posture, area fire, watch, orders, grenades), long steps with interrupts, the take-in (§3, §25.4) |
| `tradecraft/src/sim/armed.js` `gunner()` | **adapt the pattern** | NPCs run the player's own timed steps from finite magazines (the user, 2026-11-04); wrapped by the fighter's ladder and the team and squad brains (§7); police and arrest logic dropped |
| `tradecraft/src/sim/reflex.js` | **reuse** | new kinds (§3.5); `KEEP_S` 120 kept |
| `tradecraft/src/sim/cqc.js`, `fight.js`, `cqctext.js`, `cqcshow.js` | **adapt** | footing, slow falls, airborne, zero-g separation and control, suits, suit techniques, military weapons, belt ladder; text rewritten in a Marine register (§10) |
| `tradecraft/src/sim/weapons.js` | **adapt** | the melee table gains §10.5's weapons |
| `tradecraft/src/sim/interact.js` | **adapt** | the F menu gains EOF steps, restrain, escort, hand over; tie becomes cuffs (§9) |
| `tradecraft/src/sim/wounded.js` | **adapt** | the reaction ladder for civilians and broken fighters (§7.10); street geometry swapped for the nav grid |
| `tradecraft/src/sim/scenarios/dojo.js` | **adapt** | the mat session (§10.6) |
| `tradecraft/src/sim/xp.js` | **adapt** | combat classes and multipliers (§17.4) |
| `tradecraft/src/sim/emergency.js` | **reference** | replaced by CASEVAC (§12) |
| `longhaul/js/sim/boarding.js` | **adapt** | phases, timings and `RESIST` kept; `fightMinute` becomes §16.1's exchange for anyone, with SKILLS's values and kit; stations boardable |
| `longhaul/js/sim/conflict.js` | **adapt** | the Lanchester clash for company scale; ground incident kinds (§16.2) |
| `longhaul/js/sim/ordnance.js`, `damage.js`, `combatants.js`, `agents.js` | **port (TECH)** | run one minute ahead; emit timestamped interior events; damage's deck dice replaced by §13.6's geometry, its section model kept |
| `longhaul/js/sim/combat.js` | **reference** | `warpLimit` becomes the hold points (§13.3); battle-station seating |
| `longhaul/js/sim/crew-ai.js` | **adapt (patterns)** | the priority ladder (§7.3), `planCouches` reused as is for general quarters, the bad-air reflex for NPCs |
| `longhaul/js/sim/jobs.js` | **reuse** | damage control's job board (§13.8) |
| `longhaul/js/sim/inertia.js` | **adapt (BODY, PLACES)** | thrown bodies on hits and jinks, with tower-deck axes |
| `longhaul/js/sim/life-support.js`, `fire.js` | **PLACES ports** | COMBAT feeds holes and fires |
| `longhaul/js/ui/combat.js` threat board | **reference (VIEWS)** | the repeater (§13.4) |

**As built in v0.0.5** (the build sheet 0.0.5 §8 items 7, 8 and 11): `src/sim/combat/roll.js` (new: `rollerOf(state, pid, { ms })`, one person's side of every check, BODY's `bodyMods` and `needMods` on the skill's uses and "no light to see it by" −2 on handling in the dark, so skills never import the body: TECH correction 8; CONTRACTS §13), `steps.js` (the stances and the wait, §3.4) and `reflex.js` (tradecraft's, reused, inside stop motion: §3.5).

Modules COMBAT asks TECH to lay out (TECH §2.1 adopted the list): `src/sim/combat/{fight, steps, cover, coverfield, suppress, board, threat, fighter, team, drills/*, orders, roe, eof, checkpoint, nonlethal, cqc, grenade, casualty, shipfight, hits, dc, boarding, eva, offscreen, aar}.js`, each opening with its prose header. Drills are `.js` data modules (TECH §1.3, correction 12). `threat.js` holds `threatKnown` (§6.1). `checkpoint.js` holds the shift's resolver (§9.9).

---

## 19. Performance and determinism

- **Budget** (DESIGN: sim under 2 ms a tick in the busiest area): COMBAT targets 0.8 ms a tick with 30 fighters and 60 civilians in contact (my call).
  - Shots: exact `coverOf()` (15 samples × binned blockers) and a near-miss query along the line in PLACES's spatial bins: about 20 µs a shot; an automatic rifle's 10 rounds a second is 0.2 ms a second.
  - Decisions: at most 6 fighters a tick (§3.2), each 16 candidates of cover-field lookups, 16 line-of-sight tests and 16 short path estimates: about 50 µs each.
  - Suppression: one subtraction per fighter per tick.
  - The cover field is built at area load (about 40 ms for 40,000 cells, my estimate; spread over frames) and patched locally.
- **The busiest area is a fight among civilians**, not the mess at noon. Think of a checkpoint contact, a riot or a boarding. TECH's `mess-noon` (TECH §3.1) holds no fight, and COMBAT's 0.8 ms, PEOPLE's 0.50 ms and paths' 0.60 ms (CONTRACTS §6) come to 1.9 ms if each is taken at its own worst, 2.23 ms with BODY's 0.20 and the rest's 0.13. So COMBAT asks for a second busiest-area scene from the patrol's join (0.1.x, ROADMAP §5.8), **`village-contact`**.
  - It is the MOUT exercise's contact in the training village: two squads with blanks and the harness (26 fighters), 4 umpires, 60 role-players as the village's crowd, and the player.
  - It runs in `game-tick` (node) and as a bench scene (`?bench=village-contact`), and both print every layer.
  - Its budget by TECH §3.1's layers is below (my proposal; TECH owns the table).

| TECH §3.1 layer | `mess-noon` (TECH) | `village-contact` | What the fight puts in it |
|---|---|---|---|
| due, input, player, rehash, offers | 0.13 | 0.12 | as TECH |
| actors | 0.25 | 0.20 | 31 fighters and umpires on paths and drills; the 60 role-players as crowd steering |
| bodyFast | 0.10 | 0.12 | 31 bodies at L0 and L1 under exertion |
| look | 0.15 | 0.25 | fighters in contact look every 4th tick (5 Hz), not every 20th; the crowd by its cheap ring |
| think | 0.10 | 0.30 | at most `DECIDE_PER_TICK_MAX` 6 fighter decisions a tick at about 50 µs; civilians by §9.8's reactions, not PEOPLE's ladder |
| rules | 0.40 | 0.35 | about 15 rounds a second at 20 µs each (0.015 ms a tick), suppression, brass, timed steps |
| paths | 0.60 | 0.40 | one solve per fighter decision, for the chosen cell only (the 16 candidates are scored on straight lines); fleeing civilians follow an exit flow field and need no solves |
| second | 0.10 | 0.10 | |
| **total** | **1.83** | **1.84** | COMBAT's own share, about 0.8 ms: look's extra, think's fighters, rules' combat part, paths' fighters |

- **Level of detail** (for TECH §3.1's layer budgets):
  - Fighters beyond 60 m and unperceived by the player think at half cadence (`THINK_MS` ×2) and look every 8th tick.
  - Civilians who flee, drop or film (§9.8) leave PEOPLE's ladder for crowd steering, as PEOPLE §13.1's puppets with their identities kept. They follow an **exit flow field**: one Dijkstra from the area's exits over PLACES's nav grid, built once per fight and spread over ticks (my call).
  - Only these civilians stay at full detail: those within 15 m of the fight, on a line of fire, hit, or in the player's F reach.
  - Fights wholly outside the live area are exchanges (§16).
- **Later busiest cases** get scenes of their own: `cavern-riot` at 0.3 (ROADMAP §7's proposal: 200 civilians in a cavern when shots start) and `boarding-vac` at 0.5.
- **Determinism**: every roll through the seeded rng with per-purpose streams (tradecraft's `stream()`): `combat/shot`, `combat/supp`, `combat/ai/<id>`, `combat/grenade`, `combat/hits/<shipId>/<minute>`, `combat/offscreen/<fightId>`, `combat/checkpoint/<shiftId>/<subject>`. Cosmetic choices (flavour lines, which body part a spall shard marks on the sprite) come from hashes. Two runs from one save with the same inputs give the same fight.

---

## 20. Tests (the numbers they print)

Each test is `tests/<name>.test.mjs` with seeded loops; heavy ones are skipped under `QUICK=1`.

| Test | Prints |
|---|---|
| `cover` | `keeps` by fixture and posture against pistol, rifle ball and AP (the §4.4 table from WEAPONS's numbers); elevation cases; the cover field's agreement with exact `coverOf()` over 10,000 random cells (target: within 0.08 for 95%) |
| `suppress` | §5.3's rounds-to-band table by hardening and §5.2's decay, live from the code (with §25.18.4's `supp`, `anchors`, `startle`, `npc-choice`, `hard` and `consistency`) |
| `steps` | every combat step's time at values 0, 10, 20, 30 and in Mars, Europa and Ceres gravity |
| `fighter` (heavy) | 200 shoot-house runs, MCRN fire team against 4 CFB in a 4-room house: win rate, minutes, rounds fired per side, friendly casualties, friendly-line refusals, and **fratricide** (target 0 per 200); 200 runs of `react-to-contact` on open ground: time to fire superiority, the drill chosen |
| `bounding` | over 100 bounds, the mean spacing (target 5–10 m in a settlement), the share of moves made while the other team was "Set" (target ≥ 95%) |
| `orders` | voice ranges by pressure and noise; delays by channel; Leadership compliance by band at values 5, 12, 20; "Take the team" (§8.5): how often it is offered per 100 fights, its compliance against the TL's own, and the offer's timing for each of its three causes |
| `threat` | `threatKnown` for 24 scripted states, one per reason and exception (§6.1): an exercise's opposing force, range fire, a surrendered man, each alarm and the activity that answers it; a save loaded mid-threat still refuses |
| `eof` | §9.3's compliance table from the code; over 1,000 checkpoint approaches per intent, the share stopped by EOF before the danger line, and the share of hostiles that act first |
| `checkpoint` | §9.9's two tables from the code (the queue by arrival rate and stance; find odds by concealment and Awareness); over 200 seeded shifts, forward cases per hour by district mood (target 1 to 3), hostiles that came forward (target all of them), and real minutes per 6-hour shift (target 10 to 40) |
| `review` | the finding for 23 scripted use-of-force records, one per rule branch: the 20 of the use-of-force rules, plus a detention handed over at 5 h 59 min and one at 6 h 01 min, and one missing from the joint log |
| `crowd` (heavy) | 200 civilians in a cavern when shots start: time to clear, share filming, crush falls at a pressure door of 1.2 m |
| `cqc-env` | bouts at CQC 8 against 8, 12 and 20 on Mars, Europa and in free fall; suited against unsuited; the hose and the visor's rates |
| `grenade` | landing error by Marksmanship and range; §11.1's flight table; §11.2's fragment chances by distance and posture, in air and vacuum; §11.3's QSP table |
| `casualty` | time from "Man down" to the CCP and to Role 2 in three scripted fights; 9-line accuracy by Comms |
| `shipfight` | for a scripted 3-salvo engagement: the hold points produced, total held time at 1:1, the skip's length. The slug warning table of §13.3 from the code, at closing speeds of 20, 30 and 45 km/s and sensor qualities 0.48, 1, 1.3 and 1.6, and the held time for a railgun duel with and without the sustained-fire rule. Over 500 seeded engagements, how often each couch choice of §13.3 changed an outcome (a wound, a death, a breach survived, a discipline entry, a bladder or hygiene event, a job done) |
| `hits` | §13.6's wounded-share table from the code; holes and fires per hit type; time to 35 kPa per hole size (from PLACES's model) |
| `dc` | job times and success by Tech value |
| `boarding` | collar and EVA crossing times, with the share of each crossing at 1:1 and on the fast-forward; defenders by category from 100 hulls; a scripted zero-g clearance: time, casualties, and the rolls per push-off and grab on BODY §16.6's numbers |
| `patrol` (heavy) | 100 seeded 2-hour patrols with three danger areas (§21): real minutes per patrol (target 25 to 40), the share of game time at 1:1, interrupts by kind; and **parity**: the same seed with every leg lived at 1:1 gives the same IED and watcher spotted at the same tick |
| `offscreen` | §16.1's calibration table, live; Lanchester losses for 3 zone fights |
| `aar` | the paper and XP for 6 scripted fights; for 2 training fights, each training casualty's option (§2.3), the harness log in the paper and the real minutes spent out of the fight |
| `village-contact` (in TECH's `game-tick`, from the patrol's join at 0.1.x) | the tick's mean and p99 per layer of TECH §3.1 in the scene of §19; fails over 2 ms mean |
| `combat.browser` | playwright: a shoot-house run through the real page: stop motion entered, three steps, a hit, the after-action paper shown |
| close quarters (§25.13) | `combat-takein`, `combat-contact`, `combat-stepper`, `combat-bundle`, `combat-rooms`, `arms-specials`, `arms-reloads`, `body-stances`, `instinct-cqb`; heavy: `combat-race`, `scene-pairs`, `scene-shoothouse` (the CQB bot at three levels over 100 seeds) |

---

## 21. Fun

**The decisions.** When to rise and fire, and when to stay down and let the AR win the fire. Whether to rush the last 12 m now or wait for the smoke. Who goes first through the hatch. Whether to throw a grenade into a room you have not seen into. At a door, whether to walk in, slice it or bang it, which corner to watch as you go, and at the contact, planted or moving, a pair or the failure drill, shoot or challenge (§25). How far to escalate with a miner who doesn't understand you, and whether the steps fit before he reaches the line. Whether to vent a compartment with an unsuited pirate in it. Whether to stay on Europa's surface past the dose plan to carry a man in. Whether to obey an order you think is wrong, and what you say at the hot wash. Whether to take the team when Tanaka goes down, or let the AR have it (§8.5). How hard to search at the checkpoint: thorough enough to find the detonator, or quick enough that the queue does not turn the district (§9.9). In the couch, whether to seal now or keep the visor up, whether to unstrap for the man being sick beside you, and whether to swap him your inner couch (§13.3). Every one of them is a choice the player makes and the dice execute, and every one is in the log.

**The stories.** The first contact in a pump-station passage, ridden out on the T line. The grenade that hung in Europa's sky for four seconds while everyone watched it. The checkpoint where the man was carrying a pressure regulator. The frigate fight lived from a couch, a countdown on the repeater, the PDCs' buzz through the hull, and a hit two decks below that turned the berthing's fog to frost. The boarding where the defenders had set the reactor and the squad had nineteen minutes to reach engineering. Ruiz, who died at the CCP forty-six minutes after the 9-line went out, and the rack that stayed empty for a week. The private who took the team when the corporal went down in the pump hall, and the board that promoted him for it. The ninety seconds between "Kinetic inbound" and the slug passing forty metres off the port side, with your visor still up.

**Where it would turn into chores, and what removes them.**
- **Patrol legs.** No outcome skip ever replaces a leg (the user, 2026-10-29, §1; TIME §5.1.2). On a patrol the watching is the gameplay, and an outcome skip runs no perception: the IED, the watcher and the ambush would become dice drawn ahead that the player never sees coming. But a 2-hour patrol lived at 1:1 takes 2 real hours, and a tour holds dozens, which alone would break the hub's 40 to 70 minute active sol. So:
  - **Move with the patrol** is the default for every leg: an auto-walk in formation. T follows the point man, at your slot and sector (§7.6).
  - **Quiet legs** run on TIME's fast-forward: the real sim tick by tick, with perception, hearing, the feel and every roll live. It goes at `PATROL_FF_RATE` ×10 (my call: slow enough to read the street), in chunks under `FF_MAX_MS` 120,000 (CONTRACTS §2), each chunk checked against `threatKnown` (§6.1).
  - **Danger areas** marked on the patrol order are lived at 1:1: a gallery mouth, a market, a known IED route, a choke point.
  - **The fast-forward drops to 1:1 at once** on any perception event (a cue, a contact, a sound, a felt watcher, SKILLS §13), on the NCO's halts (a security halt, a listening halt, a "Set"), on an order to you, and whenever `threatKnown` turns true.
  - **The player** stops it with any movement key, G, X or E (to look), and may live any leg, or the whole patrol, at 1:1. The rate is the activity's own, not a speed control (the hub allows none while you act): the player can stop the fast-forward but never quicken it.
  - **The result**: a 2-hour patrol with three danger areas plays in about 25 to 40 real minutes (my target; the `patrol` test and ROADMAP's `patroller` bot print it). Spotting the IED is the same Awareness roll at the same tick whether the leg ran at 1:1 or fast.
  - The mission rehearsal exercise's patrol on Mars (career sols 7 and 8) runs the same way.
- **General quarters' hours**: the wait skip with hold points (§13.3), and the choices it asks at the couch.
- **Checkpoint shifts**: the deck of cases (§9.9). Routine subjects go in the ticker; one to three an hour are lived.
- **Consolidation, magazine redistribution, searches, detainee paperwork**: the Consolidate activity (§17.1).
- **EVA crossings**: lived at the start and the end, fast-forwarded between with perception live, never an outcome skip (§14.2).
- **Training deaths**: a role for the training casualty, never standing idle at 1:1 (§2.3).
- **Firefights of many minutes**: long steps (area fire, watch a sector, stay down) carry the routine seconds; interrupts bring back the moments that need a choice. A six-minute fight should take 40 to 80 decisions and 6 to 12 real minutes (my target, measured by the `fighter` test's step count).
- **Reloads and stoppages** stay manual: they are the gun as a machine (DESIGN pillar 2), not a chore.

---

## 22. Build order

The milestones are ROADMAP's (its §3.4 moved this section's first proposal: the training scenes over 0.0.6 and 0.1.x, real ship combat from 0.2 to 0.4, boarding and command from 0.4 to 0.5, special operations to 0.6 and 0.7, the squad leader's panel to 0.8). This order follows it; a patch number names ROADMAP's row, not a release (CONTRACTS §18).

**0.0.x, the scored scenes** (ROADMAP §4.2):
- **0.0.6** `test-handling`: stop motion's shooting steps; `reflex.js`.
- **after `test-range`**: `test-pairs`, the take-in and the shot rows on the 25 m bay (§25.10.3, §25.14).
- **0.0.7c, after `test-pairs`**: suppression and hardening (§5) on the bay: `test-pairs&setup=bangs`, then `test-stress` (§25.18.3, §25.18.5).
- **0.0.7d to 0.0.7g, the close-quarters road** (the user, 2026-11-08; ROADMAP §4.2): `test-shoothouse` at 1 G in the Wheel's house (§25.10.4); `test-zerocqb`, ship close quarters at micro-g with mag boots in the Wreck (§14.5, §14.8); `test-breach`, NPC defenders on the take-in, suppression and hardening (§7.11, §25.18.3); then the first live fight (ROADMAP §4.2's 0.0.7g).

**0.1.x, the scenes that fill the week** (ROADMAP §5.8), each scored, then joined:
- `test-lane`: the combat lifesaver lane's casualty card and a practice 9-line (§12.3).
- `test-mat`: the mat (§10, Mars gravity only).
- `test-shoothouse` and `test-breach`: moved forward to 0.0.7d and 0.0.7f on 2026-11-08 (above); their joins into the week (the MOUT day, the MRX's dawn house) stay here.
- `test-patrol`: everything of §3 to §8 in training form.
  - Stop motion's combat steps, long steps and interrupts (§3), on the take-in built for `test-pairs` (§25.4); NPC fighters and defenders on `takeInMs` and the bundles.
  - Cover with Base Melas's fixtures and the training village's (§4), and the cover field.
  - Suppression (§5) with blanks and the laser engagement harness (§2.3): shots resolved by the real rolls, hits scored on the harness instead of the body, near-miss tones at ×0.5 suppression. The training casualty's three options (§2.3).
  - The fighter and team brains with travelling, bounding overwatch and buddy rush; the `react-to-contact` and `break-contact` drills; succession (§7.2).
  - Orders received: voice, radio, signals, the T line (§8.1, §8.2, §8.4). No order panel yet.
  - The patrol's legs as "Move with the patrol" on the fast-forward, with danger areas at 1:1 (§21).
  - `threatKnown` (§6.1), since the first skip refused in a fight is here.
  - Training after-actions and XP (§17); the other squads' results off-screen (§16.1).
  - The **`village-contact`** scene in `game-tick` and the bench (§19), with the patrol's join, so the busiest real case is measured from the first fight.
- `test-roe-lane`: §9's lane at the mock checkpoint: the compliance model, the use-of-force record and the review, with the instructor's critique as its paper (§9).

**0.1, the standby week at Base Melas** (CAREER §5.4's calendar, CONTRACTS §3). 0.1.0 holds the classes; the 0.1.x joins put each scene into the week, everything in training form, so every system exists and is tested with nothing lethal:
- **0.1.x**: the mission rehearsal exercise on career sols 7 and 8 (CAREER §5.4) against another squad as the opposing force;
- **0.1.0**: the ROE and EOF class in Friday's short `train-a` (career sol 4), with the Europa brief; **0.1.x**: its lane;
- **0.1.x**: the MOUT exercise (the slipped weekdays, sols 9 to 13): the morning in the shoot house (§25.10), the afternoon in the training village, stack and clear with marking rounds (a bruise, BODY), `enter-and-clear` (§7.8, §25.7), regeneration on long exercises (§2.3);
- **0.1.x**: the mat session; the lifesaver lane.

**0.2, the voyage**: general quarters drills on the troopship; the wait skip and its hold points; the couch's choices (§13.3); the repeater on a drill picture; drill hits as interior events, on the pipeline the real fight will use; damage control jobs in drill; zero-g training in the flip and a zero-g mat (§10.3, §13, §14.5).

**0.3, Europa**: live fire.
- Patrols, checkpoints and escalation of force with real stakes. The checkpoint shift's deck of cases (§9.9).
- Detention with the Accord's six-hour clock and the joint log (§9.5).
- Crowds and riots; cells in ice passages; the full drill set.
- Grenades only where the Accord allows them (§9.1, item 10).
- Casualties, CASEVAC through the chain (§12.4), the dead; the use-of-force review with real findings.
- Surface EVA with the radiation clock; ground incidents from the world.
- **Take the team** (§8.5): the initiative slice of the order panel, with its four verbs, brought forward from the fire team leader's billet so that a private has agency in the tour's fights. The `cavern-riot` bench scene (§19).

**0.4, ships at war**: §13 in full: general quarters for real, the kinetic hold, the couch's choices under real fire, hits as interior events, decompression and fire, damage control, and the after-action of a ship fight.

**0.5, boarding and EVA, the fire team at sea**: boarding by collar and EVA, the crossing's fast-forward (§14.2), zero-g close-quarters battle on BODY's movement (§14.5), suits in CQC, defenders by type, scuttles; the full order panel as a fire team leader (§8.3); the `boarding-vac` bench scene.

**0.6 and 0.7, special operations**: small teams, night and stealth (Fieldcraft against Awareness, SKILLS), enemy special forces (0.6); station boardings and hostage rescue (0.7).

**0.8, the long career**: the squad leader's panel by teams (§8.3), and "Take the squad" (§8.5).

---

## 23. Cross-references (what COMBAT relies on)

- **SETTING**: the Europa Accord (§7.6), whose clauses 4 to 7 the ROE card cites (frangible only and no explosives inside pressure, detainees to Star Helix within 6 h, the joint log, entry into dwellings, the observers); names of the Corps' combatives belts and medals; Belter Lang phrases; factions' faces for §7.9 (Star Helix as the towns' police); the evacuation chain's facilities (Role 2 town, Naval Station Valhalla's hospital at Role 3 and Phobos at Role 4).
- **TIME**: stop motion's general mechanism and freezing rules; the skip contract and splash for the wait at general quarters, Consolidate and CASEVAC; interrupts to skips; papers; the world layer's cadence for ground incidents; autosave rules in a fight. Specifically:
  - TIME §5.1.6 should cite §6.1 here for `threatKnown`, its four reasons and the alarms' answering activities.
  - A **chained fast-forward**: TIME §5.2's `ff` engine run in chunks under `FF_MAX_MS` (CONTRACTS §2), each re-checked against `threatKnown`, for patrol legs (at `PATROL_FF_RATE` ×10), EVA crossings (at TIME's full rate) and the training observer (at `OBSERVE_FF_RATE` ×4). Never an outcome skip on a journey (TIME §5.1.2).
  - The activities `wait-at-station` (§13.3), `checkpoint-shift` (§9.9, mask `D A O B P`, chunked by the hour) and `move-with-patrol` (§21) in its table.
- **BODY**: wounds from bullets, fragments, blast, spall and hypervelocity; pain, shock, consciousness, knockdown (and whether the player is knocked down); every first aid action, DC and time; `minutesTo()`; drag and carry speeds; run speed and traction by gravity; G-load, juice and G-LOC; suits as life support, breaches and patches; stress and combat stress; radiation dose and the suit's shielding; compressive asphyxia; blast lung and eardrums; `bodyMods()` and `needMods()`. Specifically:
  - **Free-fall movement**: push-offs, grabs, landings and mag boots, whose numbers BODY §16.6 and §16.7 own and COMBAT §3.4 and §14.5 only cite. They should roll Zero-g, as SKILLS §2.2 gives them, not EVA as BODY's text says now. EVA stays the skill for suit work.
  - The suit's own EVA pack, beside COMBAT's combat pack (§15.1).
  - The **seal visor** step in a decompression (§13.3; my default 2 s, EVA against 8 under the shake).
  - **Vomiting in a sealed helmet**: the visor fouled and the airway threatened.
- **SKILLS**: values, checks, opposed rolls, grades, pace, tempo, help, retries, `mitigated()`; Marksmanship, Weapon handling, CQC, Fieldcraft, Awareness, Tactics, Leadership, Social, Comms, Tech, Medicine, EVA, Zero-g, Demolitions; NPC skill levels and §7.9's mapping; the nerve check's value (`round(WF / 4)` proposed); reading people (tells, feigned compliance); the instinct line's rule list, which COMBAT feeds; XP spending.
- **WEAPONS**: shot resolution (`shotDC`, the held aim, `presentation()` added); handling steps; carry postures and muzzle discipline; `stopOf(material, thicknessMm, round)` for cover; armour against bullets and fragments; recoil and anchoring in low and zero g; grenades and charges as items (`E`, fuze, a low-g grenade); less-lethal launchers and rounds; frangible loads; accountability of dropped and picked-up weapons.
- **PEOPLE**: perception (cones, awareness, light, vacuum); the crowd and its no-pop rule; gauges (trust, affinity), memories and grief; discipline (counselling, NJP) for orders not obeyed, reviews, a late detention hand-over and unstrapping at general quarters; NPC death and replacement; the reading of tells. Specifically:
  - Checkpoint arrivals by hour and the district's mood (§12.4, §12.5), with the search stance's push on the mood to confirm (§9.9: +0.03 thorough, +0.01 standard, 0 quick).
  - Puppets for fleeing civilians on an exit flow field (§19).
  - Trust and affinity moved by taking the team (§8.5) and by a couch swap (§13.3).
  - The `mind` accessors (`noteThreat`, `threatOf`) for §6.1's threat record (PEOPLE §8.8: done).
- **CAREER**: the standby calendar's combat blocks; deployments and the mission generator for operations and boardings; the fire team leader billet; standing, conduct marks, valour medals and the Combat Action Ribbon; courts-martial; death codes and the memorial; letters. Specifically:
  - §8.5's meritorious board reading `initiative` (§8.5 here) as grounds for a nomination.
  - §15.3's evacuation agreeing with §12.4's chain: Callisto without neural surgery or grafts, Mars past 30 days.
- **PLACES**: fixtures with heights, materials and thickness; the nav grid and its spatial bins; room polygons for points of domination; hatches, their ratings and pressure gauges; compartment atmospheres, venting, fire, smoke and air contaminants; deck programs of ships and stations; lighting states; the training village and shoot house. Specifically:
  - The checkpoints' detention cells and hand-over desks (§7.6).
  - Shelters rated against incoming fire, and the storm shelter (§6.1's alarms).
  - Danger areas tagged on patrol routes (§21): the candidates are tagged on the authored routes, and the day's operation draws which of them hold a cell, an IED or a watcher (§1; PLACES §9.8: done).
  - Spots and compartments on every authored hull and setting where an operation may put its objective, its defenders' barricades and its hostages (§14.1, §14.6; CAREER §11.3), so nothing in the layout is rolled (PLACES §9.8: done).
  - PLACES §12's formation marches to the range and the training village run on TIME's chained fast-forward with perception live, as patrol legs do, never as an outcome skip (TIME §5.1.2).
- **VIEWS**: the step panel, the order panel and its key, the cut-down "Take the team" panel (§8.5), the 9-line card, the repeater's drawing, the visor band, the heard plaque, the instinct line and radio box, shake from hits (COMBAT gives `dp / 30` m/s), suppression's look if any, the log's expandable bursts, the checkpoint's ticker and the training casualty's card (§2.3, §9.9).
- **TECH**: the ship layer one minute ahead with timestamped interior events; module layout (with `threat.js` and `checkpoint.js`, §18); tick order (COMBAT asks for: perception, then fighter decisions, then timed actions and movement, then shot and blast resolution, then suppression decay); rng streams; the test runner. Specifically:
  - The **`village-contact`** scene in `game-tick` and the bench from the patrol's join at 0.1.x (§19).
  - §19's level-of-detail rules carried into TECH §3.1's layer budgets.
- **ROADMAP** (its text to align):
  - §8's `moment-vampire` says "a railgun slug gives no warning". It should read "a slug gives only its sensor warning, held from at most 90 s out" (§13.3).
  - §9's `moment-away` calls the crossing "skippable with interrupts". It should read "fast-forwarded with perception live" (§14.2).
  - §7's 0.3 list should add "Take the team" (§8.5) and the checkpoint's deck of cases (§9.9), and should read "grenades only where the Accord allows them" in place of "grenades in towns".
  - §5.8's patrol join carries the `village-contact` scene, as it now does.
- **§5's needs** (suppression and hardening, 2026-11-07): SKILLS (§6.8's hardening and inoculation, the inoculation counter on the sheet, `HARD_K` beside `NERVE_K`, the test sheets' and templates' values, C's words); BODY (§9.3's toll and stress under the chaos; the flash, the deafness and the whine as physics, §17.3); PEOPLE (the nerve axis's 3 points of hardening, NPCs' inoculation by tier, flash-blindness and deafness in perception: §3.6, §3.8, §7.2); VIEWS (the vignette and the sound's ducking by felt, the FROZE stamp, the four new pose sets, the hit card in `PAPER`, reduce flashes: §3.4, §7.3, §7.4, §7.7, §11.2, §12); WEAPONS (§5.1's `fire` −3 and §7.3's incoming fire retired into the felt modifier); ROADMAP (§4.2's 0.0.7c, §5.8's 5c).
- **§25's needs** (close quarters): SKILLS (the drill rungs on the sheet, `rungOf`, the schools' rung column, `instinct/cqb.js`, the recruit, recon, Raider and tier-one templates); PEOPLE (`noteContact`, `contactOf` in the `mind` key; the player's sightings in `look` and Awareness from the sheet); PLACES (`swing` on openings; X4's targets and authored room plans; the bay's 7 m and 10 m lines); BODY (the stances' walks and the braking that prices a seam); TIME (the contact window in stop motion's clock); VIEWS (the take-in's brackets, stamp and strip; the bundle's lanes; X as the built toggle; Backspace); WEAPONS (the shot rows, parts, the reloads by purpose); ROADMAP (`test-pairs`, `test-shoothouse`); TECH (the syntax rule that `react.js` alone defines a reaction delay; the scenes' URL parameters).

---

## 24. Open questions for the user

1. **How hard does military justice bite?** Default: realistically. An unjustified killing goes to a court-martial, which can end the career with a punitive discharge even in Standard mode, and an honest mistake under the ROE costs nothing on the record.
2. **May the player disobey orders in combat?** Default: yes, always, with the record and its consequences (§8.2). The game never forces the player's hand, and refusing an unlawful order is protected.
3. **How much forced 1:1 in a ship engagement?** Default: 90 s before each predicted arrival, the same for a slug once the ship's sensors hold it (20 s each under sustained railgun fire), 30 s around launches and manoeuvres, and 120 s after a hit (§13.3). Everything else skips, and the couch's choices fill the wait.
4. **Do people the player knows die in fights the player is not in?** Default: yes. The platoon's other squads fight off-screen by the exchange (§16) and their dead are real. Your own squad never fights without you unless you are away (hospital, leave, a school).
5. **How far does command go?** Default: from Corporal the player orders the four men of a fire team one by one; from Sergeant, the squad's teams as teams, never thirteen individuals.
6. **Injuries in training?** Default: bruises from marking rounds, sprains from rushes and the mat, rare and never fatal.
7. **Quiet patrol legs: fast or at 1:1?** Default: "Move with the patrol" fast-forwards the legs the order marks quiet at ×10, with perception, the feel and every roll live, and lives the danger areas and every contact at 1:1 (§21). The player may live any leg at 1:1. The alternative is to live every leg at 1:1, which costs about 2 real hours per 2-hour patrol.
8. **May a private take the team?** Default: yes, when its leader is down, out of contact or frozen (§8.5), from 0.3, with a valour event and a board nomination when done under fire.
9. **The double and triple tap: rows, or your tap kept?** (asked 2026-11-07) Today a follow-up is Fire pressed again inside the shot's recovery, a window of about 0.4 s of real time while the clock runs (your tradecraft design, 2026-11-04: "double tap instead of fire when pressing 1 while the time is unfrozen after the first shot"). Should it become rows chosen while time stands still, priced and rolled before you press (Pair, Hammer, Triple, Failure drill, To the head), so your finger's speed never decides the shot? Default: yes, rows; the real-time press retired when `test-pairs` builds them (§25.6.4). **Answered 2026-11-07: the default** (the user: "All good defaults").
10. **The tier one in a career.** (asked 2026-11-07) CAREER keeps the tier one (Warfighting 86 and up: 0.05 s to take a man in) past 1.0, so the career's top within 1.0 is a Raider after five years (0.10 s in his own sector, 0.15 s in a room he is clearing), while the test scenes let you play the tier one now. Keep that, or bring the tier one into 1.0? Default: keep; the Raider is the career's top, the tier one plays in the test scenes (§25.4.4). **Answered 2026-11-07: the default** (the user: "All good defaults").
11. **Your feet while your marine takes a man in.** (asked 2026-11-07) During the take-in your keys do nothing but Space and Esc, so your reflexes never beat his. An untrained marine's feet then brake to a stop after his body's first reaction (about 0.24 s for a private, so he ends up in the doorway), while one who has set a Watch or is running a drill keeps moving. Keep the brake, or let everyone's feet carry on as they were moving? Default: the brake for the untrained, carry on for the pre-armed (§25.4.5). **Answered 2026-11-07: the default** (the user: "All good defaults").
12. **"Sub .1 s" where it is expected.** (asked 2026-11-07) The tier one takes a man in in 0.05 s in his own sector or anywhere in a room he is clearing, as you asked, but nobody takes in a true surprise (someone he had no reason to expect) in under 0.25 s, which is human reaction time. Keep that floor? Default: yes (§25.4.4). **Answered 2026-11-07: the default** (the user: "All good defaults").
13. **A first room at Argyre.** (asked 2026-11-07) A third flashback scene, `house`, beside the two the basic-training flashback deals (the vacuum module, the qualification's last string): a recruit's first room in the depot's MOUT house, one door, two figures, one of them a no-shoot, 3 to 4 minutes, as the close-quarters lesson of the tutorial you asked for on 2026-11-06? Default: yes, dealt by the seed like the other two (§25.10.1; CAREER §4.6). **Answered 2026-11-07: the default** (the user: "All good defaults").
14. **The shots on `test-pairs`: is time enough?** (asked 2026-11-07, after v0.0.8's reviews) At 7 and 10 m on a still face the d20 saturates (§25.6.3): from the private up every sheet hits 95% and papers the same zones on the same seed, so "Again as Tier one" differs in time (turn to first round about 0.6 s against the recruit's 2.5 s, one press against three, splits of 0.26 s against 0.40) and in the plate and the head, not in the holes. Keep it, or widen the gulf in the holes too: the man-target's vital zone at +2 (the A zone's DC, §25.15's lever), the A zone at a margin of 8, or the face moving? Default: keep it until you score the shots aspect; the lever is ready. **Answered 2026-11-07: keep it** (the user: "At 10m, almost no trained marine in real life would miss when coming in straight to shoot someone so it's ok that only speed changes"); the gulf under chaos is §5's.
15. **A turn in the lull.** (asked 2026-11-07, after v0.0.8's reviews) The lull after string 5 is quiet: the coach hands over a fresh ten and you top up with nobody turning. Should a sixth target turn while you top up, so the reload is done under the clock as it would be in a room? Default: no on `test-pairs` (the lull scored as the habit); the shoot house's lulls may be broken (§25.10.4). **Said plainly** (restated 2026-11-07, since you asked what it meant): after the last string of `test-pairs` the coach hands you a fresh magazine and you top up your rifle in a quiet moment, with no target facing you. Should one more paper target turn to face you while you are doing it, so that you reload with a target in front of you, as you might have to in a real room? **Yes or no**; default no on `test-pairs` (the quiet lull trains the habit of topping up when you can), yes on `test-stress`'s string 5 and in the shoot house's lulls (§25.18.3). Your answer about real enemies ("If so yes, enemies are NPCs and they run their own procedure…") is built into §7.11: an NPC turns to face you on his own.
16. **The name.** (asked 2026-11-07, with §5's redesign) "Hardening", your word, on the sheet and in the log, shown in words from green to unshakeable (SKILLS §6.8), with "inoculation" for its training part (the cadre's word)? Default: yes. **Answered** (the user, 2026-11-07: "perfect defaults except 6"): the default holds; built in v0.0.9.
17. **The test sheets' hardening.** The formula gives the boot recruit 7, the private 17, the corporal 36, the sergeant 45, the five-year Raider 75 and the tier one 95, so under three bangs the tier one is calm (felt 10, −1) and the private pinned (88, −9); the systems proposal fixed them at 3, 12, 25, 35, 70 and 84, which leaves the tier one under fire (21, −2) and the private at 93 (§5.6, §5.8). Default: the formula's, and both are on the bay to score with `test-pairs&setup=bangs`. **Answered** (the user, 2026-11-07: "perfect defaults except 6"): the default holds; built in v0.0.9.
18. **Noise alone never pins the hardened.** The most chaos that reaches a man is 120 less his hardening: a tier one 25 (under fire at worst), a Raider 45; what keeps them down is the real chance of being hit, which the exposing step's row shows (§5.3). Default: yes. **Answered** (the user, 2026-11-07: "perfect defaults except 6"): the default holds; built in v0.0.9.
19. **Friendly fire suppresses as enemy fire does**, and a friend's muzzle beside your ear in a room adds its own points (×0.6 in ear defenders) (§5.1). Default: yes. **Answered** (the user, 2026-11-07: "perfect defaults except 6"): the default holds; built in v0.0.9.
20. **The startle takes the keys**, as the take-in does, for at most about 3 s (one tick for the hardened); after it you try, and the dice decide whether your hands obey (§5.7). Default: yes. **Answered** (the user, 2026-11-07: "perfect defaults except 6"): the default holds; built in v0.0.9.
21. **What a bang buys.** About 4 s against any man waiting at the door without a filtered visor; against the visored (police tactical teams, special forces) a second or nothing; and against a man not waiting it is a doorbell, turning him to the door (your "they would turn towards us") (§25.18.2). Default: as computed, with filtered visors on police tactical teams and special forces only, not the UN's line infantry. **Overruled** (the user, 2026-11-07, "perfect defaults except 6": "standard issue combat gear will be combat EVA suits with serious targetting and filtering, night vision, I mean this is superpower level military"): the UN's line infantry, MSS tactical and enemy special forces wear combat EVA suits with a filtered visor and sound filtering, so the bang buys its four seconds only against the unsuited (insurgents, pirates, security); against the suited line it is a doorbell (§11.4, §25.18.2). Power armour, a special-unit kit class, is not built (§7.9).
22. **Two bangs can break an insurgent; one never does.** After two bangs in his room an insurgent cell member has fled within 10 s 29% of the time and corporate security has surrendered 13%; after one, nobody (§7.11). Default: yes. **Answered** (the user, 2026-11-07: "perfect defaults except 6"): the default holds; built in v0.0.9.
23. **The anchor scene without ear defenders.** `test-pairs&setup=bangs` is your case as you put it, so the three bangs go off with the shooter's ears unprotected, and he is deafened for the rest of the course (a voice at his shoulder still heard); `test-stress` fires its bangs in ear defenders, as the cadre would (§25.18.3). Default: yes. **Answered** (the user, 2026-11-07: "perfect defaults except 6"): the default holds; built in v0.0.9.
24. **A burn with no warning** (asked 2026-11-08, §14.8). When a coasting ship lights its drive in a fight, everything floating falls aft at the burn's G, and a marine 3 m off the aft face lands at 7.7 m/s at 1 G (a fracture). Should that be lived as a reflex card ("Grab", "Turn feet aft") and BODY's thrown body, or softened (an automatic grab for a marine who keeps the "feet aft" habit)? Default: the reflex card, with the habit as the instinct's reminder before it happens.
25. **The six faces** (asked 2026-11-08, §14.8). Clearing a compartment off thrust assigns each man a face (opposite, the hatch's own, deckhead, deck) instead of an arc. Is that the right grammar for the `void` drill family at 0.5, or should the free-fall room keep the ground room's arcs with a "look up" step? Default: faces.

---

## 25. Close-quarters battle and skill as automation

Designed 2026-11-07 for the user's close-quarters ask (DESIGN.md's log of that day, quoted in full there), in a round of three proposals (by doctrine, by play, by systems), two judges and one synthesis; "the systems proposal", "the doctrine proposal", "the play proposal" and "judge 1" or "judge 2" below name where a rule came from. "(my call)" marks the design's own decisions and the proposals' calls kept, for the user to overrule. Every table marked **[computed]** was computed that day by the round's scratch script on the formulas written here and the built helpers (`paceOf`, `climbOf`, `aimS`, the pull, `mitigated`, BODY §16.2's braking); the tests of §25.13 recompute them as the pieces are built. Real-world figures carry their sources (§25.17). Nothing in COMBAT §0 to §24 is renumbered: the chapters this one changes carry a pointer here.

### 25.0 The model in one page

1. **Automation takes the how, never the what.** A bundle runs the steps a trained body does without thinking and stops wherever a thinking man would stop: at every person newly seen, at a door it was not told to take, at the gun, at a failed roll that matters, at an order. It never fires, never spends what its row does not name, never picks a target, never reloads unasked (§25.2).
2. **Training and experience are two things, as the user named them.** Training is the **rung** of a drill family (room, passage, hatch, void: 0 untrained to 4 fluent), taught by a teacher who teaches only so far, practised in clean repetitions, and each bundle **lived once by hand** before it is offered. Experience is **Warfighting**, which sets the take-in. A drilled private clears at the room's grain and still takes a man in slowly (§25.3).
3. **T's reach grows with the rung.** Rungs 0 and 1: one step a press, and **never the walk in**, which is the movement keys after X (the user's recruit). Rung 2: a group a press. Rung 3: the room. Rung 4: the house (§25.8).
4. **The contact pause is one helper for the player and every NPC**, `takeInMs`, paid **before** the pause with the world running: Warfighting's core times the expectation (his sector, a room he is clearing, alert, surprised), an Awareness check's grade, who it might be, how many, stance, light, the body, plus 200 ms a suppression band, in whole ticks. **A private (the player's start) takes 0.80 s in a room he is clearing on 95% of rolls, 1.20 s on a natural 1; a boot recruit 0.95 to 1.45 s; a tier one 0.05 s, one tick** [computed]: the user's numbers (§25.4).
5. **During the take-in** the world runs at 1:1, the keys do nothing but Space and Esc, hollow amber brackets close round the person over the window, an untrained marine's feet brake to a stop after his body's go and a pre-armed one's carry on. **The pause always comes** and never says who is hostile: in a clear every person pauses, and an identification roll at the pause says only what the marine could tell (§25.4).
6. **The room** (§25.5): the private by hand, eight presses and the walk, 15.4 s of game time, his first round 2.00 s after the man could see him, two seconds standing in the doorway; the same private with one decision more (Watch the far corner before X) fires 0.92 s after the sighting and is out of the funnel; the tier one by T, two presses, 6.0 s, his first round 0.30 s after the sighting [computed]. "Faster and smoother" comes from five physical sources: the take-in, the aim (the muzzle already on the sector), the seams (a stop and a restart cost 0.43 s at the Combat walk on Mars), the flow of feet, hands and eyes at once, and the Assault lope.
7. **Special shots and reloads are rows chosen while time stands still**, offered when relevant, each round its own roll: Pair (Marksmanship 8), Hammer (12, within 7 m), Triple (18, within 7 m), Failure drill (12, within 10 m, its third round not fired if he is down after the pair), To the head, each planted or moving. Reloads are offered by their purpose (RELOAD on empty, Top up in a lull, RELOAD keep the empty), never done unasked; "eyes up" from Weapon handling 15 (§25.6).
8. **Bundles are data**: COMBAT §7.7's `enter-and-clear` written as beats on four channels (feet, hands, eyes, voice), run by a stepper that overlaps channels by rung; the room's points, sectors and paths authored for X4 and derived from PLACES's polygons from 0.3 (§25.7).
9. **Training first, then the career**: `test-pairs` on the built 25 m bay (turning targets at 7 and 10 m: the take-in and the shot rows, scored before anything depends on them), then `test-shoothouse` "Stack and clear" in X4 as a new 0.1.x scene before `test-patrol`, with a sheet picker from private to tier one and "Again as …" on the same seed (§25.10).
10. **Five questions for the user** (§25.16): the tap as rows; the tier one past 1.0; the feet during the take-in; "under 0.1 s" where it is expected; a first room at Argyre.

**Designed 2026-11-11 (the user's note on v0.0.12)**: §25.19 reworks this model and wins where they disagree. Item 3's rung 4 no longer clears the house: the furthest one press reaches is one room, to "Room clear!". Item 5's pause **suspends** a trained man's bundle (the feet carry on to his point and the shot runs on the hands) instead of cutting it. Item 6's shots are one row each, the feet by the drill. Item 8's bundles become the muscle-memory catalogue by phase (stack, door, room, weapon, team). A stoppage gains Gun down, Off the line and the transition to the P-12. The #2 works as doctrine says and does the tower's commands.

### 25.1 The user's words this chapter obeys

- 2026-11-07, the ask (DESIGN.md's log): CQB training; the recruit step by step; T as the experienced operator's automation; "game unpaused with X"; the pause after the marine's own time, "sub .1s for tier 1 operator vs maybe 0.8+ for recruit"; "much faster and smoother and pause faster"; double and triple taps, the Mozambique, combat reloads "as special actions when relevant"; "Please build on this idea".
- 2026-11-06, the movement stances: "Relaxed", "Combat", "Assault", Combat "allowing to acquire and engage while moving to cover", Assault "would not allow accurate shooting but would allow suppressing as we move to cover, or close quarters shooting for experienced operators" (DESIGN.md's log; BODY §16.1).
- 2026-11-06, on interactions: "not pre-combined actions like you do now that make lists hard to read". A bundle here is a named drill whose steps are shown, ticked as they run and still offered one by one, as WEAPONS §5.3's commands are and as the magazine rule of 2026-11-07 reads it ("the steps stay available one by one").
- v0.0.5's calls (DESIGN.md): "T aims and goes off safe but never takes the shot"; "R offers nothing while stop motion is on".
- Tradecraft, carried: "the reflex window is spammed on us too, there should be a way to remember our choice for a while" (2026-11-04); "once we did it once, remember it so next time … snap flash forward" (2026-10-26); "double tap instead of fire when pressing 1 while the time is unfrozen after the first shot, and when skilled enough up to triple tap … with accuracy dropping … from recoil and recoil lessened by higher weapons skill" (2026-11-04); "Nothing consumed or spent unasked" (2026-10-31).
- The user's score of v0.0.5's `test-handling`: steps 100, shot 100, pace 100, with T as the newcomer's path (PLAYTESTS.md).
- The pillars: "Skill and dice decide execution; the player decides what to try … The player never aims with reflexes"; time is a currency.

### 25.2 The principle: skill shows as automation

**The rule** (my call on the wording): the player chooses what to try; training decides how much of it one choice covers; skill and dice decide how well it goes.

- **The operation is the player's**: which room, which method (dynamic or deliberate, a flash or not, which entry), which door next, whether to go at all.
- **Every decision about a person is the player's**: shoot, which shot, hold, challenge, let pass. "T aims and goes off safe but never takes the shot" holds at every rung.
- **The steps between are the drill's.** A recruit chooses them one at a time; a trained marine as one bundle; the dice roll every one either way, every one in the log.

**What scales, and from where:**

| What | A private (WF 15, rung 1) | A Raider (WF 70, rung 4) | Comes from |
|---|---|---|---|
| the grain: what one press covers | one step | the house | the rung (§25.3) |
| the take-in in a room he is clearing | 0.80 s (1.20 on a natural 1) | 0.15 s; 0.10 in his sector | Warfighting, the Awareness check, the situation (§25.4) |
| every step's time | pace 1.00 | pace 0.57 | `paceOf` (SKILLS §5.12, built) |
| where the muzzle is when he appears | where the player put it | on the drill's sector | the bundle's sweep, or the player's Watch row |
| the seams | each step ends and the body stops; X and the human's own start at 1:1 | none inside the room: the door opens as he arrives, the lope carries through | the stepper's channels (§25.7) |
| the shots at the contact | Aim, then Fire or Pair | Pair, Hammer, Failure drill, each moving or planted, the aim inside the row | Marksmanship gates and the rung (§25.6) |

So the recruit and the operator make the same decisions that matter; the recruit also makes the ones that don't, by hand, and pays for each in time. Progression is felt as the busywork falling away and the gap between "he's there" and "I can act" shrinking, never as the game playing itself.

**What a bundle may and may not do** (the three proposals agree; my call on the list):

| A bundle may | A bundle never |
|---|---|
| walk the drill's path to the slot's stack point and point of domination | fires a round, at a person or a target |
| choose the entry by the drill's rule (the swing, the room's shape), which the player may change on the row | spends a consumable its row does not name (a flashbang, a charge: "Nothing consumed or spent unasked") |
| carry the posture, the muzzle's sweep, the calls ("Stacked", "Clear!") | picks a target, holds, challenges or spares anyone |
| read, open or push a door; wait for the squeeze | reloads or clears a stoppage (COMBAT §21: "Reloads and stoppages stay manual") |
| scan its sector hot spot by hot spot | enters a room the plan does not hold, or goes past a contact |
| mark the room | answers a reflex card (the player's kept answers still can, §25.4.6) |

### 25.3 The ladder: drill families and rungs

#### 25.3.1 The rungs

A **drill family** is a kind of space cleared, each with its own rung on the sheet (my call, after the systems proposal): `room` (a room or a house), `passage` (a corridor, a junction, a stair, a ship's passageway), `hatch` (a compartment through a hatch under thrust) and `void` (a compartment in free fall, handhold to handhold: §14.5). The room is worked in full here; the others reuse its engine with their own beats.

| Rung | Name | Typical holder (SKILLS §11.1) | By hand | T does (one press) | Seams: where it stops and asks | Flow: channels at once |
|---|---|---|---|---|---|---|
| **0** | untrained | civilians; the boot recruit before infantry school; insurgent cell members | everything | one step, the DI's plain next instruction ("Find a wall. Don't stand in the door."); **never the walk in** | after every step | none |
| **1** | taught | **the new join** (the School of Infantry's MOUT package, on the summary paper) | the walk in by the keys after X, the corner and the sector by eye, the call | one named step: **Stack on the door**; **Open** (or the breach chosen); then the line shows X and the move keys and **T does nothing**: the walk in is the keys | after every step | none |
| **2** | practised | lance corporals and corporals after a voyage's and a tour's drills | the choice at each group | a group: **Stack and open**; **Enter and clear your corner**; **Dominate** (the sector, "Clear!", the mark) | after each group | none: feet, hands and eyes in turn. The shot rows include the aim; the moving rows open (§25.6) |
| **3** | drilled | sergeants; the boarding course, the AIC, recon | the decisions only | **Clear the room**: the stack to "Clear!" | a contact; a failure; a decision the plan cannot make (a closed inner door, the end of the lane) | the hands and the voice with the feet (the door opened as he arrives, the rifle shouldered on the move) |
| **4** | fluent | the Raiders' course (its third phase, "close quarters battle and boarding in every gravity", CAREER §11.2); the tier one | the decisions only | **Clear the house**: the room, then the next on the plan, without stopping between | a contact; a failure; a branch (a junction, a stair, a door whose breach is not set) | the eyes too: the scan rides the move |

The rung decides the grain and the flow; Warfighting decides the take-in (§25.4); the skills decide each step's time and odds. Two drilled sergeants clear at the same grain, and the one with more Warfighting pauses sooner.

**Designed 2026-11-11 (the user's note on v0.0.12)**: rung 4's "Clear the house" is withdrawn (the user: "the option to clear the whole house should not exist"). Rung 4 clears the room as rung 3 does, the eyes flowing too, and every row ends at "Room clear!". Rung 2's groups become "Stack up, take point", "Open, in: your corner" and "Dominate". The rung sets how far a row reaches, and every row is offered at every rung (§25.19.2).

#### 25.3.2 How a rung is earned (my calls)

- **Taught (1)** by a lesson: the School of Infantry's MOUT package, on every new join's summary paper (CAREER §4.7 gains the line), gives `room` 1 and `passage` 1.
- **Practised (2)** after `REPS_PRACTISED` 20 clean repetitions; **drilled (3)** after `REPS_DRILLED` 60 in all; **fluent (4)** only as the Raider ITC's floor at graduation.
- **A clean repetition** is a room (a passage, a hatch) cleared with no fault called: standing in a doorway over `FUNNEL_FAULT_MS` 1,000 (within 0.5 m of the door's plane), a hot zone not looked at, a teammate swept by the muzzle, a no-shoot hit, a threat left standing. The instructor or the squad leader calls them in training; the after-action in an operation (§17).
- **Each teacher teaches only so far** (SKILLS §6.3's `upTo`, in kind): unit training (the squad leader, the platoon's drills, the voyage's passageways) to 2; the shoot house's cadre, the boarding course and the AIC to 3; the ITC to 4. **Field repetitions** (a room cleared in an operation) count double, at most 5 a sol, and teach to 3.
- **Lived or skipped, the same** (SKILLS §6.3's rule): a 3 h CQB block (SKILLS §6.4) is about 12 runs; skipped, its representative rolls set the clean share. Two blocks give rung 2, so nothing is a grind the player must live (the objection to the systems proposal's counts, answered by the skip rule, my call).
- **Schools' floors** (SKILLS §6.6 gains a column): `infantry` room 1, passage 1; `boarding` room 2, hatch 2, void 2; `aic` room 3, passage 3; `recon` room 3, passage 3; `raider` all 4; `tier-one` all 4. `breacher` puts the ram and charge breaches on the record (§25.5.6).
- **Lived once** (the doctrine proposal; TIME's "the first time is lived"; the user's "once we did it once, remember it", 2026-10-26): a bundle is offered only once its own steps have been done by hand, start to end, at least once, in training or for real, or on a school's test day. The first time it would be offered and is not yet lived, it shows struck, "by hand first", once; an untaught bundle never shows. **Designed 2026-11-11 (the user's note on v0.0.12)**: an untaught or unlived row shows greyed with its rung or "by hand first", never hidden (the user's "even if grayed out"; §25.19.2, VIEWS §7.8; my call).
- **Rust** is deferred (both judges): a later layer once the career has gaps long enough to matter, never in the first scene.
- **NPCs** carry rungs in their tier's template, written nowhere (my calls): private 1; lance corporal and corporal 2; sergeant and staff sergeant 3; second lieutenant 1; recon 3; Raider 4; tier one 4; insurgent cell members 0; cell veterans and pirates 1; UN Marines 2; enemy special forces 4. Every NPC's bundles count as lived.
- **The sheet shows it** (C): "Close-quarters battle: rooms, taught (rung 1) · 7 of 20 clean runs toward practised", in SKILLS §6.7's progress words.

### 25.4 The contact pause: the take-in

#### 25.4.1 What starts it, and that it always ends in a pause

- **The take-in** is the time from the first tick a person is seen to the moment the marine has taken them in and can act on a choice (the lead's own word in DESIGN.md's log: "once the marine has taken it in"). The HUD and the log say it: "taken in in 0.80 s".
- **It starts** on the tick PEOPLE's `sightOf` first crosses `SEEN` 0.5 for that person in the `look` layer: seen, not glimpsed and not yet identified.
- **What starts it.** **In a clear** (from the stack on a door of a room being cleared, by an exercise's lane, an operation's plan or a "Stack on the door" step, until the last "Clear!" or leaving the building): **every person or target newly seen**, armed or not, so the pause never tells the player who is hostile (play and systems agree; doctrine's hostile-only trigger rejected). **Elsewhere**: §3.5's `contact` triggers (a hostile weapon raised or a hostile act seen; shots heard give the bearing only).
- Someone already on the side's board (`conf` ≥ 0.2, through PEOPLE's `noteThreat`) never restarts it. **A hit, or a round cracking within 1 m, ends the window at once**: you know now (§3.3's "a natural 1 on someone already firing at you still freezes at the first hit", generalised).
- **It always ends in a pause** (the user: "game would pause on contact with enemy"). §3.5's "seen coming if Awareness …" is withdrawn for `contact`; a poor roll makes the take-in longer instead.

#### 25.4.2 The formula: one helper

```
takeInMs = ticks( max(EXPECT[e].floorMs, coreMs(WF) × EXPECT[e].k × NOTICE_K[grade] × whoK × severalK × stanceK × lightK × bodyK × behindK)
                  + SUPP_MS × band )
coreMs(WF) = TAKEIN_FLOOR_MS 30 + TAKEIN_SPAN_MS 700 × (1 − min(WF, 100) / 100) ^ TAKEIN_EXP 2
ticks(ms)  = max(1, round(ms / TICK_MS)) × TICK_MS                        (50 ms the least: "sub .1 s" is one tick)
```

`takeInMs(state, who, contact)` lives in `src/sim/combat/react.js` and nowhere else (the syntax test checks it as it checks `paceOf`: no other module defines a reaction delay). It replaces §3.2's NPC `reactMs`, §3.3's noticing late and startle, and times §3.5's cards (§25.4.7).

| Input | Term | Values (my calls unless a source is named) | Why |
|---|---|---|---|
| **experience** | `coreMs(WF)` | WF 6: 649 ms · 15: 536 · 27: 403 · 34: 335 · 44: 250 · 56: 166 · 70: 93 · 86: 44 · 93: 33 | Warfighting "is combat experience" (SKILLS §4.2), the user's word; quadratic, so the first tour is felt and the last points are hard (the power law of practice) |
| **expectation** | `EXPECT[e]` | `sector` ×1, no floor; `area` ×1.5, no floor; `alert` ×2, floor 150 ms; `surprise` ×3, floor `SURPRISE_FLOOR_MS` 250 | knowing where is anticipation; knowing that (a room being cleared) halves the search; choice time grows with the choices (Hick, Hyman); a true surprise never beats simple reaction time (Welford) |
| **the dice** | `NOTICE_K[grade]` | an Awareness check against `8 + round(rangeM / 10)`, +4 behind, −2 in a held sector, graded as SKILLS §5.6: pass ×1, miss ×1.5, bad ×2, disaster ×3; a natural 1 is a miss whatever the margin (from the shoot house rework, designed 2026-11-11: a natural 1 SKILLS §5.1 catches, Awareness 15 or more and the check made by 10 without the die, is graded by its margin and costs the catch's ×1.5, so the figure stands and J's "a natural 1, noticed late" reads "a natural 1, caught: noticed late") | pillar 3: the dice decide how fast he noticed, in the log. A multiplier, so a tier one's natural 1 costs a tick, not §3.3's 2,000 ms (the map's defect) |
| **who** | `whoK` | ×1.5 when his hands are unseen, a no-shoot or hostage stands within 1 m of him, or the area is among civilians; else ×1 | the shoot or no-shoot choice: officers about 0.31 s from a light to the trigger, about 0.56 s with that choice (Lewinski and Hudson) |
| **how many** | `severalK` | `1 + 0.15 × log2(n)`, n the people taken in at one pause: 2 ×1.15, 4 ×1.30 | Hick and Hyman |
| **stance** | `stanceK` | Relaxed ×1.25; Combat ×1; Assault ×1.1, ×1 from rung 2 | the weapon slung and the mind elsewhere; the eyes on the footing at a lope unless drilled |
| **light and the eyes** | `lightK` | `1 + 0.4 × (1 − min(1, Le / 0.6))`, `Le` the light at him as the adapted eye takes it (`eyeViewOf`, BODY §23.4): dim ×1.13, dark ×1.30; night vision counts `Le` 0.6 inside its 40° cone; flash-blind, no sighting until it clears | Piéron's law; one number with the picture's exposure |
| **the body** | `bodyK` | `1 + 0.06 × (−Σ the roller's Awareness modifiers)`, at most ×2, read through `rollerOf(…).mods('awareness')`: tired ×1.06, frayed ×1.12, exhausted ×1.18 | sleep loss slows reaction and adds lapses (Lim and Dinges; Van Dongen and Dinges) |
| **behind** | `behindK` | ×1.3 outside the view cone (heard, or inside the all-round radius) | the head turns before the eyes work |
| **suppression** | `SUPP_MS × band` | `SUPP_MS` 200 a band, added; **the band is felt's** (§5.3: the pool less hardening), from 2026-11-07 | §3.2's additive `300 × band` kept in kind. Written first as "added, so suppression slows the best as much as the worst (a pinned tier one 0.65 s)": **withdrawn** by the user's rule of 2026-11-07, since noise alone cannot pin a tier one (the most that reaches him is 25, under fire: 0.25 s in his sector) (§25.18.1) |

**The expectation** (my calls, after the systems proposal):
- `sector`: his bearing lies within `SECTOR_HALF_DEG` 20° of a held sector: a bundle's corner or sector beat, the **Watch** row (§25.5.2), or an aim held on a point. A sector held `VIGIL_MS` 30 s with no new cue decays to `area`; a door's noise is a cue that refreshes a defender's.
- `area`: he is clearing (§25.4.1's clear).
- `alert`: `threatKnown` is true, or an exercise is running, and he is not clearing.
- `surprise`: nothing expected.
- **Heads down**: below Weapon handling `HEADS_DOWN_WH` 15, a handling step takes the eyes to the rifle: the expectation drops one step and the cone narrows to ±30° for its duration. From 15 the row says "eyes up" (§25.6.6).

#### 25.4.3 The numbers [computed]

At 4 m, lit, rested, calm, in Combat: the take-in on a passed roll, then the mean over the Awareness die (ms).

| Tier (SKILLS §11.1's middles) | WF | AWR | core | his sector | **a room he is clearing** | alert | surprise | a room, natural 1 | §3.2 as written |
|---|---|---|---|---|---|---|---|---|---|
| boot recruit | 6 | 2 | 649 | 650 / 695 | **950 / 1,075** | 1,300 / 1,463 | 1,950 / 2,188 | 1,450 | 1,375 |
| **private (the player's start)** | 15 | 6 | 536 | 550 / 563 | **800 / 820** | 1,050 / 1,078 | 1,600 / 1,640 | 1,200 | 1,188 |
| lance corporal | 27 | 9 | 403 | 400 / 410 | 600 / 615 | 800 / 820 | 1,200 / 1,230 | 900 | 938 |
| corporal | 34 | 11 | 335 | 350 / 358 | 500 / 513 | 650 / 668 | 1,000 / 1,025 | 750 | 792 |
| sergeant | 44 | 14 | 250 | 250 / 255 | 350 / 360 | 500 / 513 | 750 / 768 | 550 | 583 |
| staff sergeant | 52 | 17 | 191 | 200 / 205 | 300 / 308 | 400 / 408 | 550 / 565 | 450 | 417 |
| recon | 56 | 24 | 166 | 150 / 155 | 250 / 255 | 350 / 358 | 500 / 513 | 350 | 333 |
| Raider at the ITC's floor | 65 | 27 | 116 | 100 / 103 | 150 / 155 | 250 / 255 | 350 / 358 | 250 | 250 |
| **Raider, five years** | 70 | 30 | 93 | **100** / 103 | **150** / 153 | 200 / 205 | 300 / 305 | 200 | 250 |
| tier one at its floor | 86 | 35 | 44 | 50 / 50 | 50 / 53 | 150 / 150 | 250 / 250 | 100 | 250 |
| **tier one, middle** | 93 | 40 | 33 | **50** / 50 | **50** / 53 | 150 / 150 | 250 / 250 | 100 | 250 |

The factors, on a passed roll (ms) [computed]:

| Case | private, a room | Raider (5 y), his sector | Raider (5 y), a room | tier one, his sector | tier one, a room |
|---|---|---|---|---|---|
| as above | 800 | 100 | 150 | 50 | 50 |
| who: hands unseen, a no-shoot within 1 m, or civilians ×1.5 | 1,200 | 150 | 200 | 50 | 100 |
| two people at one pause ×1.15 | 900 | 100 | 150 | 50 | 50 |
| four people ×1.30 | 1,050 | 100 | 200 | 50 | 50 |
| Relaxed ×1.25 | 1,000 | 100 | 150 | 50 | 50 |
| Assault below rung 2 ×1.1 | 900 | 100 | 150 | 50 | 50 |
| dim ×1.13 / dark ×1.30 | 900 / 1,050 | 100 / 100 | 150 / 200 | 50 / 50 | 50 / 50 |
| tired ×1.06 / exhausted ×1.18 | 850 / 950 | 100 / 100 | 150 / 150 | 50 / 50 | 50 / 50 |
| under fire (band 1) +200 | 1,000 | 300 | 350 | 250 | 250 |
| pinned (band 3) +600 | 1,400 | 700 | 750 | 650 | 650 |

(The pinned row's Raider and tier one cannot happen by noise alone since §5's redesign: the most chaos that reaches them is 45 and 25, so they read the under-fire row at worst; the row stands for the toll's worst case, §5.6.)
| behind him ×1.3 | 1,050 | 100 | 200 | 50 | 50 |

- **NPCs keep about their numbers.** The `alert` column (a fighter in a fight, not clearing) is 12 to 18% quicker than §3.2's figures from private to sergeant (1,050 against 1,188; 500 against 583) and within 5% from staff sergeant to recon; above, the new curve is quicker (a five-year Raider 0.20 s, not 0.25), and nobody but the tier one reaches the 0.25 s floor of a true surprise.

#### 25.4.4 The user's numbers, read honestly

- **"maybe 0.8+ for recruit"**: the private, the career's first room, takes 0.80 s on 95% of rolls in a room he is clearing and 1.20 s on a natural 1; the boot recruit 0.95 s on 75% and 1.45 s otherwise; the dark, fatigue, a hidden pair of hands or fire lengthen both. A private who has set a Watch on the right corner takes 0.55 s there: a decision that buys time, never a reflex.
- **"sub .1s for tier 1 operator"**: the tier one takes 0.05 s, one tick, in his sector or anywhere in a room he is clearing, on every roll but a natural 1 (0.10 s). The five-year Raider, the top of the career within 1.0 (CAREER §11), takes 0.10 s in his sector and 0.15 s in the room (§24, question 10).
- **Below human reaction time.** 50 ms is under simple visual reaction (about 0.18 to 0.25 s, Welford 1980), and World Athletics counts a start under 0.100 s as false. The reading kept (my call; all three proposals agree): **the pause is the decision becoming available, not the round leaving.** The operator's eyes were on the corner before the man was there and "a weapon in my sector: shoot" was decided at the stack, so nothing is left to decide; the motor part still comes after the pause, in the step (the aim's settle, `TRIGGER_S` 0.15 s). His first round leaves 0.30 s after the man could see him (§25.5), the order of an expert's real first shot from a ready position. Two floors keep it honest: **a true surprise is never taken in under 0.25 s, nor an alert one under 0.15 s, by anyone** (§24, question 12), and a test holds that **no first round ever leaves earlier than the sighting plus 0.15 s plus the aim** (the doctrine proposal's body floor, kept as an invariant, not as a second delay).

#### 25.4.5 During the take-in: the world, the body, the keys

- **The world runs at 1:1.** Everyone else acts on their own take-in (the same helper): the man in the corner turns, raises his rifle and fires if his take-in and his aim are quicker than yours; a turner faces; a hostage card lifts.
- **The marine carries on what he was doing**, as far as his body would (my call, after the doctrine proposal; §24, question 11):
  - **not pre-armed** (walking in by the keys with no Watch set): the feet carry on for the body's go, `goMs = max(150, 250 − WF)` ms (235 ms for the private), then brake (BODY §16.2: 0.43 s and 0.21 m from the Combat walk on Mars) and stand for the rest of the window; the muzzle stays where it was. This is the orienting freeze that leaves a recruit in the doorway;
  - **pre-armed** (a bundle running, a Watch set, slicing the pie): the feet carry on along the bundle's path or the held direction, and the muzzle keeps its sweep or its watched point.
  - A step or bundle under way runs on to the window's end; a stop-motion step that ends inside the window lets the clock run on, the body idle and the stance held, until the window ends: **the game never freezes on a person the marine has not yet taken in** (the play proposal's rule; my call).
- **The keys are not his.** Every input but Space and Esc is refused while a contact is pending: the move keys' changes, G, X, the digits, T, R, V, A and W. Space pauses (the window does not run while paused; nothing is chosen while paused, §3.1). The human sees the person (the picture draws whoever the character perceives, PEOPLE §7.6) and cannot act before the marine can: "The player never aims with reflexes".
- **The window is made visible** without telling who it is (VIEWS, §25.11): hollow amber corner brackets appear round the person on the sighting tick and close onto them over the take-in; a recruit's close slowly while he brakes, a tier one's are shut before they can be seen moving. No words and no sound: the character has taken nothing in yet.
- **Several people.** A second person seen while a window is open joins it: the window's end becomes the first sighting plus the take-in with `severalK` for all of them (and the worst `whoK`); one pause takes them all in, each bracketed (my call, merging the play and systems proposals).
- **Inside a step** (the systems proposal): at the window's end a move, a scan or a wait is cut where it stands; a handling sub-step finishes if it ends within `FINISH_MS` 250 ms (the magazine is seated), else the pause waits for its end; a bundle's rest is queued as "Carry on: …", exactly as a halted macro's is.
- **The body** takes the fight's stress at the pause (BODY §9.1's "a fight begun" +12; a target in the shoot house at `evaluated`, +4: my call).

**As built in v0.0.8** (`src/sim/combat/react.js`, `contact.js`; `src/sim/people/mind.js`; the build sheet 0.0.8 §8 items 2, 5 to 9, 25, 26, §9, §10; each my call unless named):
- **The bay's take-ins as lived** (ms, a passed roll; pinned by `react` from the code; the strings' cases: string 1 one at 7 m, in your sector on your own lane, alert on a neighbour's; string 2 two at 7 m, alert with two; string 3 three at 10 m, sector with three; string 4 one at 10 m, sector; string 5 two at 10 m, sector with two):

  | Sheet (WF) | core | sector | alert | alert, 2 | sector, 2 | sector, 3 | sector, a miss | alert, a miss | area | surprise |
  |---|---|---|---|---|---|---|---|---|---|---|
  | boot recruit (6) | 649 | 650 | 1,300 | 1,500 | 750 | 800 | 950 | 1,950 | 950 | 1,950 |
  | private (15) | 536 | 550 | 1,050 | 1,250 | 600 | 650 | 800 | 1,600 | 800 | 1,600 |
  | corporal (34) | 335 | 350 | 650 | 750 | 400 | 400 | 500 | 1,000 | 500 | 1,000 |
  | sergeant (44) | 250 | 250 | 500 | 550 | 300 | 300 | 350 | 750 | 350 | 750 |
  | Raider (70) | 93 | 100 | 200 | 200 | 100 | 100 | 150 | 300 | 150 | 300 |
  | tier one (93) | 33 | 50 | 150 | 150 | 50 | 50 | 50 | 150 | 50 | 250 |

  Lived by its keys (the integration's play and the runtime review): turn to pause by string, the recruit 0.65 · 1.50 · 0.80 · 0.65 · 0.75 s, the private 0.55 · 1.25 · 0.65 · 0.55 · 0.60, the tier one 0.05 · 0.15 · 0.05 · 0.05 · 0.05; the wall time from the first window frame to the paused frame equals the sim's take-in within a frame on every sheet (private 550 against 552 ms, tier one 50 against 56). From a 7 m point the neighbours' turners stand 23.2° off the muzzle (alert), from a 10 m point 16.7° (the sector). Turn to sighting is 100 ms on every sheet (the face reaches `SEEN` 0.5 at a third of `TURN_MS` 300), the motor's, not the marine's: the paper's TURN TO PAUSE is the take-in itself (§8 item 2).
- **The expectation on a course of fire**: the muzzle at low or high ready, or aimed, holds a sector (within `SECTOR_HALF_DEG` 20°), refreshed by the coach's Standby or a re-armed turn (`R.cueAtMs`, a fresh cue, so a long idle in the mode never drops your own lane to `alert` after `VIGIL_MS`); off it the string is `alert`; no `area` and no `surprise` on the bay.
- **The notice check is rolled once a window, on its first target** (the one that drew the eye); a target joining the window never re-rolls it and brings the slowest expectation, `severalK` for the new count and the worst `whoK`. `whoK` is 1.5 only for hands hidden ('unknown' faces, none yet): a no-shoot 3 m off is not within 1 m.
- **The feet** (`feetOf(state, input) → { mx, mz, run, stroll }`): while a window is open the keys held at the sighting carry the walk for `goMs` and then stop (0.235 s and 0.228 m for the private), with no braking distance until the movement stances exist (BODY §16.2's 0.21 m with `test-shoothouse`); the pre-armed's carry on (the rule built and tested, nobody pre-armed yet). `move.js` reads the feet for its vector, gait and speed, handling.js's range rules (moving) and shooting.js's stand-up out of the mode read them too, so a key held in a window is not the marine's anywhere.
- **A sub-step is never cut**: a macro running at the window's end halts at the end of its current sub-step, however far away, and its rest is queued as "Carry on" (`FINISH_MS` 250 is exported, unused). A live step (V, A, W out of the mode) running at the window's end: the pause at its end.
- **No hold inside a window**: no stop-motion step's end holds time while a window is open (endStep sets 'choose' with no `holdTime`), so the game never freezes on someone not yet taken in; a stray 'stop' hold is released the next tick (contact.js's guard), any other hold (a reflex card's) ends the window there.
- **The act gate** is `game.js`'s one line: every sim action is refused while a window is open (`refusesAct`), in node and in the page; the page refuses its own keys too, but Space and Esc. **The pause's guard** (the fixer's, `main.js` `PAUSE_GUARD_MS` 350, in kind with the cards' `CARD_GUARD_MS` 400): for 350 ms of real time from when the page first shows the pause no key acts but Space and Esc, and a key that went down in the window or the guard does nothing on its way up (in review, X pressed by reflex 150 to 250 ms after the turn landed after the tier one's 0.05 s pause and put him back in real time).
- **Not built yet**: `lightK` is passed as 1 (the bay is lit; the factor built and tested), suppression 0 and `stanceK` Combat's 1 (nobody fires at you, no stances), the body's stress at the pause.
- **The record**: `state.mind.contact = { n, known: { [key]: seenMs }, pending, last }` through `mind.js` only (PEOPLE §8.8); `n` and `known` (the targets already taken in) beside them, `pending` gains `id`, `ms` and `run`, `last` gains `id`, `pick`, `grade`, `parts` and `words` (the log's sum); the identification is a map by target key (`last.ident[key]`, `last.armour[key]`). The pause's 'stop-mode' fact carries `contact: { id, ms }`.

#### 25.4.6 The pause

- **It enters stop motion** with the contact bracketed (`S.pick`), as G would, from wherever the player was; a slung rifle makes `up` the first row. The instinct line's lead is "Contact · 0.80 s." in place of "Time stands still.".
- **An identification roll** (my call, the systems proposal): Awareness against `6 + round(rangeM / 5)`, +4 in the dark, +2 with the hands behind cover, on its own stream. It says "a rifle", "a pistol", "hands empty", or, failed, "can't see his hands". A failed roll withholds; it never shows a weapon that is not there ("we only know what we know").
- **The panel's first rows are the contact's answers**: the shot rows (§25.6; from rung 2 with the aim inside them, below it Aim first), **Hold him** (the muzzle on him, no shot: a held aim), **Challenge** ("Show me your hands!", 1.2 s, §9.3) where the hands were not seen or are empty, **Get down**, **Back out** (to the stack), and **Carry on: …** (the bundle's rest). For someone identified as a no-shoot the panel leads with Carry on, Hold him and Challenge; the shot rows are there, never first. §3.5's `contact` card (Get down · Dash to cover · Weapon up · Nothing) becomes these rows; its "Nothing" is Carry on.
- **Kept answers** (R, `KEEP_MS` 120 s, the user's "remember our choice for a while") may answer a contact pause only with **Get down, Back out or Carry on, never a shot** (my call: "T never takes the shot", and a kept shot would fire at a hostage on a misread).
- **As built in v0.0.8** (`contact.js`, `shooting.js` stepsOf): the pause enters stop motion `via: 'contact'` with the pick on the window's target nearest the muzzle; the line's lead "Contact · 0.55 s." (`takeInWords`, the one formatter of the quantity: stamp, plaque, line, paper, log, card). The identification is rolled per target (`IDENT_DC0` 6 + round(range / `IDENT_PER_M` 5), +`IDENT_DARK` 4) on `combat:ident`, naming 'rifle', 'pistol', 'hands', 'phone' or 'unseen' ("can't see his hands"), never a weapon not there (the recruit names 78.5% at 7 m over 2,000 rolls, against the check's 80%). Hold him and Challenge (`CHALLENGE_MS` 1,200, "Show me your hands!", +`CHALLENGE_BONUS` 4 to look again) lead the panel for an identified no-shoot; Hold him once held is struck "held". At a live contact below rung 2 the panel is step by step: Off safe (promoted) and the aim first, Fire struck "off safe first"; commands and singles that are no answer to a man facing you are marked `later` and paged; on the bay a bolt believed locked on an empty puts RELOAD at the panel's head. Get down, Back out, Carry on at a pause and kept answers are not built (no bundle yet). **The picture draws belief, not truth** (the fixer's, `pairs.js seenFace`): every paper face is one board, threat and no-shoot alike, and what it holds is drawn only once this turn's take-in identified it (a Challenge's answer too); 'unseen' draws none; the steel stays steel.

#### 25.4.7 One helper for NPCs: what it replaces in §3

- **§3.2's reaction delay** retires: every NPC reads `takeInMs`. Its expectation comes from its own state (an aim held on a door `sector`, decaying after `VIGIL_MS`; a fighter in a fight `alert`; a sentry at rest `surprise`). The combat block's `reactUntilMs` is renamed `takeInUntilMs` and filled by the helper (§2.1). The bargain stands: the player thinks for free and pays with no edge in execution; an NPC acts at its window's end, the player chooses at the pause, and neither acts sooner.
- **§3.3's noticing late** stops being a gate and becomes `NOTICE_K`; **the startle** is the core itself, moved before the pause where the user puts it. Nothing is added after the pause. **Watch a sector** (§3.4) "ends at once when a hostile enters it": it ends after the `sector` take-in (the map's conflict 10 settled).
- **§3.5's cards at 1:1** (contact, grenade, lunge, hatch) are timed by the same helper; `contact` is the pause of §25.4.6.

#### 25.4.8 Determinism and saves

- The notice roll on `stream(seed, 'combat:notice', who, contactId, seenMs)`, the identification on `combat:ident` keyed the same (§19's per-purpose streams).
- The player's pending contact is plain data in PEOPLE's `mind` key, written and read only through its accessors (`noteContact`, `contactOf`, beside `noteThreat`):
  ```js
  state.mind.contact = {
    pending: { ids: ['tg7'], seenMs: 2051339450, untilMs: 2051340250, expect: 'area', rangeM: 4.4,
               parts: [{ why: 'Warfighting 15', ms: 536 }, { why: 'a room you are clearing', k: 1.5 }],
               roll: { /* the notice check, SKILLS §15.2's record */ }, armed: false, goMs: 235, mx: -0.71, mz: 0.71 } | null,
    last: { ids, seenMs, atMs, ms, expect, ident: 'rifle' | 'pistol' | 'hands' | 'unseen' } | null }
  ```
- Absolute `…Ms` fields only (§3.7); additive, no `SAVE_SCHEMA` bump. The window ends in the `input` layer, which sets the `'stop'` hold on the tick at `untilMs`, so that tick freezes exactly (TECH §3.1; TIME §4.3). **A save made inside the window loads and pauses on the same tick** (tested). Inputs in the window are refused in the page and in node alike, so a replay from the state and the inputs gives the same pause.

### 25.5 The room, step by step and by T

#### 25.5.1 The reference room

A room of 5.0 × 4.0 m, its door 0.9 m wide in the middle of the near (5 m) wall, opening inward, hinged on the left; a hall outside (my layout, for the numbers). The marine starts 4.0 m down the hall in stop motion, rifle at low ready, 25 kg of kit, Fitness 12, on Mars on a dry floor (μ 0.6, so he accelerates and brakes at 2.24 m/s²: BODY §16.2). He is #1, stacked right of the door, entering left: the stack point 0.5 m from the frame and 0.45 m off the wall, the door's plane 0.8 m and the threshold 1.1 m along his path, his point of domination 1.0 m along the near wall from the near-left corner and 0.5 m off it, 2.72 m from the stack (§7.8; FM 3-06.11's first man "moves along the wall … to the first corner"). In the far left corner a man-target with a painted rifle (or a man), 4.4 m from the threshold, seen as his eye clears the jamb 0.8 m along the path. The door: the hand 0.2 s × `paceOf(WH)`, the swing 0.4 s, the way free once the leaf is fully open (PLACES §1.6 and DESIGN.md's log, 2026-11-07, as built in v0.0.6: `OPEN_S`, `DOOR_S`; the way freed at two thirds open, first written in the log, was not built, and the computed times are the same either way, since the trained marine pushes the door before he reaches it).

**A seam costs real time on Mars**: a body that stops and starts again loses `v / a`, **0.43 s at the Combat walk and 0.71 s at the Assault lope** [computed]. Low gravity makes stopping dear; that is the physical "smoother" (the systems proposal).

#### 25.5.2 The private by hand (WF 15, MRK 10, WH 10, AWR 6; rung 1; Combat) [computed]

| Game time (s) | What happens | Lasts | The player |
|---|---|---|---|
| 0.00 | **Stack on the door**: 4.0 m at the Combat walk, rest to rest; high ready; the muzzle onto the door. The DI: "Stack on the door. Muzzle on it." | 5.64 | T (one step) or its digit |
| 5.64 | **Open the door**: the hand, the swing. "In. Your corner's left. Don't stop in the door." (the line shows X and the move keys; T does nothing) | 0.60 | T or its digit |
| 6.24 | **X**: the clock runs at 1:1 ("game unpaused with X") | | X |
| 6.24 to 7.58 | the walk in by the keys at the Combat walk, after about 0.3 s of the human's own start; at 0.8 m along the path the man in the far left corner crosses SEEN | 1.34 | Z, Q |
| 7.58 to 8.38 | **the take-in**, a room he is clearing: 0.80 s (1.20 s on a natural 1). The brackets close; the keys do nothing; his feet carry on for 0.235 s, brake, and he stands **in the doorway**, 1.24 m along the path | 0.80 | (Space only) |
| **8.38** | **the pause**: "CONTACT · TAKEN IN 0.80 S"; the plaque: "a rifle, far left, 4.4 m". The line: "Rifle, far left. Aim. Then press." | | |
| 8.38 | **Aim at him**: a 45° turn from high ready | 1.05 | a digit |
| 9.43 | **Pair** (controlled): rounds 0.15 and 0.55 s in. **The first round 2.00 s after the man could first see him** | 0.79 | a digit |
| 10.22 | X; walk on to the point (1.48 m) | 2.26 | X, Z, Q |
| 12.48 | look into the corner and across the room | 2.13 | E held, the keys |
| 14.61 | G; **"Clear!"** | 0.80 | G, a digit |
| **15.41** | done: **eight presses and the walking**; about 2.0 s standing in the doorway (the window's last 0.13 s, the aim and the pair): the instructor calls the fault | | |

**What he could do better, all of them decisions in still time**: before X, **Watch: the far left corner** (a row, 0.80 s: the muzzle turned 60° onto the corner's bearing, held on it as the keys move him; my call, recasting the play proposal's pointer as a stop-motion row so no aiming is done by hand). Then the man is in his sector: taken in in 0.55 s, pre-armed so the feet carry on through the door (1.33 m, out of the funnel), the aim in his sector 0.22 s, **the first round 0.92 s after the sighting**, nothing standing in the doorway; 15.03 s in all [computed]. Or slice the pie through the open door before going in (§3.4: 0.5 s per 15°), or bang the room (§25.5.6). The run sheet and the hot wash say which.

#### 25.5.3 The tier one by T (WF 93, MRK 42, WH 42, AWR 40; rung 4) [computed]

| Game time (s) | What happens | Lasts | The player |
|---|---|---|---|
| 0.00 | the line: "Room. Far left's yours. T." **Clear the house**: the approach at the Combat glide with the rifle shouldered, flowing; the door pushed in the last half metre (hands over feet), the leaf fully open as he reaches it, the eyes on the opening (FEET ▸ HANDS ✓ EYES ▸) | 4.34 | T |
| 4.34 to 4.90 | the entry flowing into the Assault lope; the eyes on the far corner first, the drill's sector; at 0.8 m the man crosses SEEN, in his sector | 0.56 | |
| 4.90 to 4.95 | the take-in: one tick, 0.05 s; the brackets shut before they can be seen moving | 0.05 | |
| **4.95** | **the pause**: "CONTACT · TAKEN IN 0.05 S"; the line, his own thought now: "Rifle. Pair." | | |
| 4.95 | **Pair, moving on** (a hammer at 4 m): the sight settles in 0.10 s, the rounds at 0.25 and 0.36 s; the lope carries on. **The first round 0.30 s after the man could first see him** | 0.47 | a digit |
| 5.42 | the drill carries on: to the point, the sector, "Clear!" over it, the mark; the next door of the lane | 0.61 | |
| **6.03** | the room done: **two presses** | | |

#### 25.5.4 Every rung side by side, and where the time goes [computed]

| Marine | How | The room, from 4 m down the hall | Sighting to the first round | Take-in | Presses (the walking keys not counted) |
|---|---|---|---|---|---|
| private, rung 1 | by hand, the keys for the entry | 15.41 s | 2.00 s | 0.80 s | 8 |
| private, rung 1 | by hand, with Watch set | 15.03 s | 0.92 s | 0.55 s | 9 |
| corporal (WF 34), rung 2 | three groups by T; the man off his corner | 10.01 s | 1.53 s | 0.50 s | 4 |
| sergeant (WF 44), rung 3 | Clear the room | 7.27 s | 0.56 s | 0.25 s | 2 |
| Raider (WF 70), rung 4 | Clear the house | 6.24 s | 0.37 s | 0.10 s | 2 |
| tier one (WF 93), rung 4 | Clear the house | 6.03 s | 0.30 s | 0.05 s | 2 |

Thinking is free in stop motion, so the recruit is slow for five reasons, each of which training removes (my model, merging the three proposals): **the take-in** (0.80 s against 0.05); **the aim** (a 45° turn from where he guessed, 1.05 s, against 0.10 s on a sector the drill held); **the seams** (each step ends with the body stopped, 0.43 s to stop and start again at the Combat walk, and twice the human's own start at 1:1 after X); **the flow** (a bundle's hands and eyes work while the feet move, §25.7); **the lope** (Assault at 1.60 m/s against Combat's 0.97, with the close-quarters shot the training eases, §25.9). And `paceOf` on every step. "Nothing in combat is taken steady" (§3.4) stands; a rushed bundle (Shift with T or its digit) takes ×0.6 and −3 on its rolls, never routine.

**As built in v0.0.12** (measured on seed 48213 at 1 G in the Wheel's house 1, room 1 as §25.5.1's reference room, the setup `ref`; the figures are #1's own time to his "Clear!", with no #2 beside him, as the tables above are). Against the computed table: the boot recruit by the keys 16.35 s (the table 15.33; take-in 0.95 s, first round 3.15 s after the sighting against 2.98); the private by the keys 14.55 s (13.79; 0.80 s, 2.55 s against 2.00, his Off safe and the second man's take-in included); the corporal by T 9.28 s (8.82); the sergeant by T 6.47 s (6.13); the Raider 5.29 s (5.19); the tier one 5.11 s (4.98; take-in 0.05 s, first round 0.28 s against 0.30). The scene's tolerance is +-0.10 s on the first round by T and +-0.15 s by the keys; the room against the table is held to 15% for every sheet but the corporal's, whose figure is printed only (his three-group flow is the drill's). **With a #2** the room's "Clear!" comes when both sectors are clear, 1.0 to 1.3 s later by T (corporal 10.35 s against 9.28 own, sergeant 7.75 against 6.47, Raider 6.35 against 5.29, tier one 6.30 against 5.11). **The lane** (three rooms and the hall, GO to the card) on 48213: recruit 87.7 s, private 73.5, corporal 62.5, sergeant 48.0, Raider 49.3, tier one 44.0 s, the private to the tier one 1.67; over 100 seeds the private 75.1 s, the sergeant 46.7 and the tier one 44.2 s, a ratio of 1.70. (The first integrated table, 16.80 s for the recruit and a ratio of 1.77, was measured before the reviews' fixes and is replaced.) The corporal misses the advanced par on room 1's off-corner man by 0.03 s (1.53 s against 1.5): kept as honest, a Watch or his #2 meets it (my call). **After v0.0.12's routing** (the fixer's, 2026-11-11, in the tree): room 1 for the Raider 5.48 s and the tier one 5.27 s, within 15% of the table; lanes on 48213 recruit 95.2, private 78.3, corporal 61.6, sergeant 50.5, Raider 48.8, tier one 46.4 s (§25.19.1).

#### 25.5.5 The race at the door [computed]

A defender at 4 m, as he stands when the marine crosses: **aimed** at the door (his sector, the door's noise a fresh cue), **alert** elsewhere (`alert`, then a 60° aim), or **surprised** (`surprise`, then a 90° aim from low ready). Both see each other on the same tick; each fires at his take-in plus his aim plus the trigger. From rung 2 the defender sits in the marine's sector a third of the time, from rung 3 half (a pair's #1 and #2 split the room); the private by the keys has him in the room, 45° off; with Watch set, in his sector half the time. 4,000 seeded runs a cell: how often the marine fires first. **Reprinted in v0.0.9 from `combat-race`** (the built helpers: `aimS` with the rifle's sight ×1.2 and turn ×0.8, the SO-4 at 1×); the two bold cells are the ones the scratch got wrong.

| The marine | insurgent cell member (WF 11): aimed / alert / surprised | UN Marine (WF 26) | enemy special forces (WF 80) |
|---|---|---|---|
| private, by the keys | 0% / 100% / 100% | 0 / 100 / 100 | 0 / 0 / 0 |
| private, Watch set | 2 / 100 / 100 | 0 / 100 / 100 | 0 / 49 / 50 |
| corporal, rung 2 | 32 / 100 / 100 | 1 / 100 / 100 | 0 / 32 / 34 |
| sergeant, rung 3 | 51 / 100 / 100 | **47** / 100 / 100 | 0 / 50 / 49 |
| Raider (5 y), rung 4 | 52 / 100 / 100 | 51 / 100 / 100 | 0 / 100 / 100 |
| tier one, rung 4 | **53** / 100 / 100 | 51 / 100 / 100 | 0 / 100 / 100 |

The defenders' first rounds (means): a cell member aimed at the door 0.77 s, alert 3.25 s, surprised 4.36 s; a UN Marine 0.56, 2.46 and 3.24 s; enemy special forces 0.20, 0.95 and 1.28 s. "Fires first" is not "hits first": the defender's roll, the hit and BODY's stop still decide, and the `combat-race` test prints those with the dice.

**What it teaches is doctrine, as in life**: nobody walks into a professional holding his aim on the door and wins, which is what the flash, the slice and the stack are for; a recruit wins only against a man who is not ready; training turns the coin flips into wins. **For fun** (my call, both proposals): the generator places defenders mostly alert or surprised by their doctrine (§7.9), an exercise puts a held door in at most one room of a lane, training scenes score par tones, not wounds, and in the career the new man is #3 or #4 in the stack, not #1 (the team brain's order, §7.8).

**Settled in v0.0.9** (`combat-race`, 4,000 seeded runs a cell on the built helpers; the table above is the code's, both cells settled in the helpers' favour, no helper changed, and test-pairs' calm papers move nothing): the scratch's printed table was wrong in exactly two cells, both tick-close.
- **The tier one against an insurgent aimed at the door wins 53%, not the printed 100%.** In his sector (half the time) he fires at 0.282 s against the insurgent's 0.750 s and wins; in the room he is clearing (the other half) his aim is 0.760 s on `aimS` with the rifle's sight ×1.2 and turn ×0.8, and he loses by 10 ms. The scratch left the factors out (0.673 s: he wins, 100%).
- **The sergeant against an aimed UN Marine wins 47%, not the printed 3%.** In his sector he fires at 0.535 s against the Marine's 0.550 s and wins by 15 ms, on the shot's formula time (the record's `atMs`, `resolveShot`'s); the scratch took his 0.135 s aim in whole ticks, 0.550 s, a tie that goes to the defender. The rifle's factors do not move this one (no factors: 47%).
- Every other cell agrees with the earlier print within 2 points (the corporal v the Marine 1% not 2%, the Raider v the insurgent 52% not 53%, the Raider v the Marine 51% not 49%, the tier one v the Marine 51% not 52%, the Watch-set private v special forces 0 / 49 / 50). The flashbang's columns are §25.18.2's.

#### 25.5.6 The method is the player's: dynamic or deliberate

The doctrine proposal's choice, kept (my call on the gates): at the door the panel prices every method, and the DI says which the situation favours when the character has a cue (Tactics tier 8 and up: "He heard the door. Bang it." / "Slice it. He's waiting.").

| Method | Rung (by T) | What it is | Its price |
|---|---|---|---|
| **Enter: cross** or **button-hook** | the room's bundles | through the opening to the point across, or round the frame into the near corner; the drill picks by the swing and the room's shape, the player may change it on the row | as §25.5.4 |
| **Slice the pie** | single steps at every rung; a bundle from 2 | the opening cleared from outside, 15° at a time, the aim held into each slice (§3.4, 0.5 s per 15°) | slow; contacts come at the frame, the slicer already aimed |
| **Limited penetration** | 2 | a step into the threshold, look and engage, a step back | a second in the funnel; nobody committed to the room |
| **Clear it, flash first** | a variant of any room bundle from 2; a single step at any rung | the pouch, the pin, the throw (2.6 s at WH 10), the bang, then the entry; the row names "1 flashbang" | the flashbang; against a man waiting at the door without a filtered visor about 4 s (the flash, the startle, the chaos: §11.4, §25.18.2), against the visored a doorbell; only where the Accord allows (§9.1) |
| **Breach**: open · kick · ram · charge | open and kick at every rung; ram and charge with the `breacher` record or a teammate who has it | a door that will not open by hand: kick (Fitness against the door's DC, 1.2 s), ram (a teammate's), charge (§11.6) | a failed kick halts the bundle: "Locked. Kick it again, or back off." |

### 25.6 Special shots and reloads, as steps offered when relevant

#### 25.6.1 The shot rows

Each is a row of the step panel, priced and rolled up front, each round its own Marksmanship roll and its own line in the log (WEAPONS §5.3's shape: one choice, the dice still decide). **Offered only when relevant**: a person or a man-target bracketed, the gun believed able, in range. From rung 2 a row includes the aim at the bracketed person ("Pair · 0.12 + 0.58 s" for a Raider); below it the recruit chooses Aim, then the row (the user's "everything step by step", my call). Fire held is still "hold and fire".

| Row | Offered when | Gate (my calls; Pair and Triple as built, `TAP_SKILL`) | Time | Rolls |
|---|---|---|---|---|
| **Fire** | as built | none | `TRIGGER_S` 0.15 + the recovery | one |
| **Pair** (controlled: a second sight picture) | a person within 25 m, semi, two rounds believed | Marksmanship 8 | a split of one single pull (0.40 s at WH 10) | two; the second's climb ×`CONTROLLED_CLIMB_K` 0.5 |
| **Hammer** (two on one sight picture) | within `HAMMER_MAX_M` 7 m | Marksmanship 12 | a split of `TAP_SPLIT_S` 0.25 × `paceOf(WH)` | two; the full climb (WEAPONS §7.6) |
| **Triple** | within 7 m, semi | Marksmanship 18 | two hammer splits | three |
| **Failure drill** (the Mozambique: two to the chest, one to the head) | within `FAILURE_MAX_M` 15 m, the head seen; **first in the list** when he has taken torso hits and still stands, or wears armour seen | Marksmanship 12 | the hammer, the assessment, the shift to the head (`HEAD_SHIFT_S` 0.3 × `paceOf(WH)`), the press | three: two torso, one head (+6, re-sighted: climb ×0.5); **the third is not fired if he is down after the pair** (the assessment, built in) |
| **To the head** | within `HEAD_MAX_M` 25 m, after "He's still up." (first in the list, and the line says so; **never absent: struck with its reason where it cannot be taken**, my call), or the torso behind cover (`keeps` ≥ 0.5) | none | the shift and one round | one, head +6 |
| **…, moving** (any row) | a move running when the pause came (a bundle's, a pre-armed walk) | the row's gate, and rung 2 for Assault's close-quarters shot | the same; the feet carry on along the path at the stance's speed | each round with the moving shooter's modifier (§25.9) |
| **…, planted** (any row, when a move was running) | as the row | as the row | the body brakes first (0.43 s from the Combat walk, 0.71 s from the Assault lope) | standing; no moving modifier |

- **Planted or moving is a real choice at every contact** (the play proposal): the better shot, standing perhaps in the doorway, or out of the funnel with a worse one.
- **A row halts** on a stoppage, the bolt locking, a friend stepping onto the line (§3.5's `friendlyLine` card) or the target out of sight; a Pair and a Triple fire all their rounds otherwise (the decision was two or three), the Failure drill alone assesses.
- **Parts.** `PART_DC` is built (torso 0, head +6, legs +3) and `resolveShot` takes a part; the part is a property of the row (the head rows, the failure drill's third), never a new key, and the plaque names it ("HEAD 75% 4 M").
- The failure drill is a Corps drill in life: the Marine Corps' Table 2 combat marksmanship fires failure-to-stop strings (§25.17).
- **As built in v0.0.9, the reaches and the head row** (the fixer's, the user's report of 2026-11-07: "am i supposed to aim for the head ? How do I do that ?"; each my call; `specials.js`, `pairs.js`, `panel.js`): the reaches are `PAIR_MAX_M` 25, `HAMMER_MAX_M` and `TRIPLE_MAX_M` 7, **`FAILURE_MAX_M` 15 and `HEAD_MAX_M` 25** (a rifle's head shot is not a 10 m thing; Hammer and Triple stay close-range drills).
  - **The reach is judged by the line**: your own lane's turner counts at the line's nominal 7 or 10 m anywhere in that line's box (`pairs.js pairsReachM`: the session's line first, then the other line; `specials.js reachOf`), so standing a metre back in the 10 m point's box no longer drops the head row. Every other target uses its measured range, unrounded, so a neighbour's turner at 7.30 m is out of the Hammer (v0.0.8 compared the rounded range). The odds use the measured range.
  - **Never silent**: after "He's still up", To the head is offered first, or struck with its reason ("aim first", "off safe first", "empty, RELOAD first", "a stoppage", "chamber unknown", "chamber empty", "N m, past 25") and its remedy is brought up beside it on the first page (Off safe, RELOAD, IMMEDIATE ACTION, Press check, or MAKE READY, else Bolt release, else Charge: `panel.js remedyOf`). A rifle that cannot fire no longer drops the head row. The DI names the row's key and T does the remedy (SKILLS §14); To the head keeps its key on every page.
- **Designed 2026-11-11, to build in the shoot house rework: a caught 1 in a row** (SKILLS §5.1, WEAPONS §7.10). A round whose natural 1 is caught (Marksmanship 15 or more, the round made by 10 without the die, the row not rushed) leaves late by half its own part of the row: the aim the row holds, its press or split, its shift. The row's later parts move with it, and the round is judged by the world when it leaves. A row is not halted by a caught 1, the round's tick reads `~` (VIEWS §7.4), and the PAPER's split shows the late round as it was. A rushed row (Shift) catches nothing, which is the price of its ×0.6.
- **"He's still up"** (the fixer's, `specials.js stillUp`, `STILL_UP_TORSO` 2): standing after a torso round that rang on a plate this contact, or after two torso hits; one hit on paper is not it (the DI says "Again. Chest." and Pair stays first). In review, one round in a paper man had been "still up", and the recruit went to the head on paper (8 head hits to the tier one's 2).

**As built in v0.0.8** (`src/sim/arms/specials.js` `ROWS`, `shotRows`, `rowPlan`, `runRound`; the build sheet 0.0.8 §8 items 3, 10 to 16; each my call unless named): the five rows (ids `shot:pair`, `shot:hammer`, `shot:triple`, `shot:failure`, `shot:head`) with the table's gates and reaches (`PAIR_MAX_M` 25, `HAMMER_MAX_M` and `TRIPLE_MAX_M` 7, `FAILURE_MAX_M` and `HEAD_MAX_M` 10; Hammer and Triple compared on the rounded range, so a neighbour's turner at 7.6 m is out), each made of parts (`aim` from rung 2 when not aimed at the target, the selector to semi at no time inside it; `hold` when careful; `press`; `round`; `shift`), each round resolved at its own formula time (`atMs`) with its own roll, part, zone and hole, so the paper's splits read true under a tick. The row reads "Pair · 0.40 + 0.52 s · 95% 95%".
- **Where offered**: only on a turner facing (`SEEN`) and standing, or a person bracketed in a contact; a stopped turner offers none; the coach in the frame on a range never offers one. The gun believed able: a Pair is struck **"one left"** with the magazine believed out (only the chambered round), and a row is struck "on auto" off semi.
- **Struck rows**: below rung 2 a row is struck "off safe first" on safe (the Off safe single brought up beside it) and "aim first" when not aimed at the target; below its gate it is struck with the gate's words ("Marksmanship 12"). **The struck rows are listed after Fire, the aim and the contact's other rows**, still after those offered (the recruit's panel had opened with four struck rows and Fire fifth); the page folds the gated ones into one struck row ("Hammer 12 · Triple 18 · Failure drill 12", VIEWS §7.4).
- **The order**: To the head first after "He's still up"; the failure drill first where armour was seen at the pause or torso hits stand; else Pair, Hammer, Triple, Failure drill.
- **Rushed** is ×0.6 on every part of a row (the press, the splits, the shift, the aim and the recovery), matching Fire's rushed ×0.6, and −3 a round; careful holds to +4 before the press.
- **A row is never cut**: it halts on a click or a stoppage (the reflex card, as Fire's) and on the bolt locking back; rounds past a target that turned away go into the berm with no fault. The failure drill's third is not fired when the target is down after the pair (`assessDown`, at the shift's end).

#### 25.6.2 Times by skill [computed]

From aimed, the R-7 (recoil 0.70), the whole step to the last round's recovery (s), and the split:

| Tier | MRK, WH | Fire | Pair, split | Hammer, split | Triple | Failure drill | climb on the 2nd round: Pair / Hammer |
|---|---|---|---|---|---|---|---|
| boot recruit | 4, 4 | 0.47 | (8) | (12) | (18) | (12) | −1 / −2 |
| private | 10, 10 | 0.40 | 0.79, 0.40 | (12) | (18) | (12) | −1 / −1 |
| lance corporal | 13, 13 | 0.37 | 0.74, 0.37 | 0.60, 0.22 | (18) | 0.87 | −1 / −1 |
| corporal | 15, 15 | 0.36 | 0.71, 0.36 | 0.57, 0.21 | (18) | 0.82 | −1 / −1 |
| sergeant | 18, 19 | 0.33 | 0.67, 0.33 | 0.52, 0.19 | 0.71 | 0.75 | 0 / −1 |
| recon | 24, 24 | 0.31 | 0.62, 0.31 | 0.47, 0.16 | 0.64 | 0.67 | 0 / −1 |
| Raider (5 y) | 30, 30 | 0.29 | 0.58, 0.29 | 0.43, 0.14 | 0.58 | 0.60 | 0 / 0 |
| tier one | 42, 42 | 0.26 | 0.52, 0.26 | 0.38, 0.11 | 0.49 | 0.51 | 0 / 0 |

The controlled splits (0.26 to 0.40 s) and the hammer's (0.11 to 0.22 s) sit with what practical shooters time on a close target (§25.17).

**As built in v0.0.8** (`specials.js rowPlan`, pinned ±0.01 s by `specials` on the test sheets, SKILLS §11.1): the table holds to the hundredth; on the Raider's test sheet (MRK and WH 31) the Pair is 0.57 s on a 0.29 s split, the failure drill 0.59 s and To the head 0.30 s; To the head is 0.70 / 0.55 / 0.46 / 0.41 / 0.30 / 0.25 s for the recruit, private, corporal, sergeant, Raider and tier one. **Off safe** (the single step below rung 2) is the built `selector:semi` (WEAPONS §5, v0.0.5): **0.67 / 0.40 / 0.28 / 0.22 / 0.13 / 0.08 s** at Weapon handling 4 / 10 / 15 / 19 / 31 / 42; the build sheet's column (0.52 / 0.40 / 0.34 / 0.30 / 0.22 / 0.18 s, 0.4 s × pace) matched only at WH 10, and the built figures stand (my call; the `specials` suite prints both).

#### 25.6.3 Their odds at room range [computed]

At 4 m on a still man-target, lit, planted, everyone trained hits the torso and the head 95%: in a room the danger is time, not aim, as doctrine says. Skill shows in a live room (the target moving −2, dim −2, felt 40 under fire −4 (§5.3): a sum of −8):

| Tier (MRK) | planted: torso, the pair's 2nd, head | moving in Combat | moving in Assault (rung 2 and up) |
|---|---|---|---|
| private (10) | 85%, 80%, 55% | (−4) 65, 60, 35 | (−5) 60, 55, 30 |
| corporal (15) | 95, 95, 80 | (−2) 95, 95, 70 | (−4) 90, 85, 60 |
| sergeant (18) | 95, 95, 95 | (−2) 95, 95, 85 | (−3) 95, 95, 80 |
| Raider (30), tier one (42) | 95, 95, 95 | 95, 95, 95 | 95, 95, 95 |

So the failure drill and the head rows earn their place where it matters (the armoured target, the hostage room, the live room), and the shoot house scores the A-zone by the margin (a margin of 4 or more, SKILLS §5.6's "good"), so a 95% hit still has a quality.

**As built in v0.0.8, on the bay** (`specials`, `steel`; at 7 and 10 m on a still man-target, the SO-4 at 1× +1, planted, lit): every sheet hits the torso and its A zone 95% but the boot recruit (A 80%), the head 95% but the recruit (70%); the armoured head plate falls (`A_MARGIN` 4 over DC 12) recruit 50%, private 80%, the rest 95%. The d20 saturates on a still face at these ranges, as this table computes, so the shots aspect lives in time, the recruit's head, the plate and the rushed rows (the build sheet's §8 item 16): from the private up every sheet papers the same zones on the same seed (the dice are keyed by the shot, natural 1s at 4.0 to 4.5% across 20 seeds), and "Again as …" differs in time only. The vital-zone +2 lever (§25.15) and other answers wait for the user (§24, question 14).

**As built in v0.0.9, the head's odds at the new reaches** (`specials`, `pairs-head`; the head's DC by range: 12 up to 10 m, 13 at 11 m, 15 at 15 m, 17 at 20 m, 19 at 25 m): To the head at 10 / 11 / 15 / 25 m: boot recruit 70 / 65 / 55 / 35%, private 95 / 95 / 85 / 65%, corporal 95 / 95 / 95 / 90%, sergeant and above 95%. The failure drill's head round at 15 m: recruit 45%, private 80%, the rest 95%. The aim plaque keeps reporting Fire's torso shot (the head's odds are on To the head's own preview plaque), so one quantity shows one number (my call). The private's To the head at 11.3 m is 0.55 s, 95%.

**Designed 2026-11-11, to build in the shoot house rework: the caught 1 at room range** (SKILLS §5.1; the user, 2026-11-11: "some kind of perk of high skilled operators preventing a nat 1 from making them miss"). The d20 saturates here, so from the private up every miss on a still face was a natural 1, and the sheets differed in time alone. With caught 1s the margin decides who still misses. On the bay a round misses 4.6% for the private, and 0.3%, 0.3%, 0% and 0% for the corporal, sergeant, Raider and tier one, against 4.5 to 4.6% for every one of them before (Pairs' bot, 300 seeds a sheet). In the shoot house the figures are 5.8%, 3.8%, 1.4%, 0% and 0%, against 5.1 to 5.8% before. In the live room above (−8), the Raider's and the tier one's torso and head rounds are caught (5% → 0%), while the corporal's and sergeant's are not (their margins are 1 to 4 on the torso), so under fire the perk is the operators', as the user put it. Each caught round costs half its part of the row, +0.13 to +0.18 s on Fire from aimed (§25.6.2's Fire, halved).

#### 25.6.4 The tap becomes the rows (§24, question 9)

As built, a follow-up is "Fire again inside the recovery" (v0.0.5's `tap()`), a press inside a window of about 0.395 s of real time while the clock runs, whose game-time cost depends on when the finger pressed: a reflex input, and the user's own tradecraft design (2026-11-04). The user now asks for the taps "as special actions", so (my call, the default of question 1): **the rows replace the window** when `test-pairs` builds them; until then the built tap stays as it is, scored. `TAP_SKILL` and `climbOf` stay; `TAP_SPLIT_S` becomes the hammer's split on Weapon handling's pace. Rejected: the doctrine proposal's alias that keeps the real-time window (the finger still decides), and the play proposal's "1 1" chord typed in still time (every single Fire would wait `CHORD_MS` 300 ms of real time to see whether a second 1 follows). On the range the single stays the default; the Pair is offered where a course of fire calls for it.

**Done in v0.0.8** (question 9's default, the user, 2026-11-07: "All good defaults"): `tap()` is removed; Fire pressed during a fire step is 'busy'; `tapsOf`, `TAP_SKILL` and `climbOf` stay as the rows' skill gates, and a step record keeps `taps: 0`. test-handling's and test-range's bots never tapped, and their courses are unchanged to the tick.

#### 25.6.5 Reloads, offered by their purpose

The Corps' RELOADs as built (WEAPONS §5.3; v0.0.6's reach and seat inside each), named in the panel by what they are for (the play proposal; no built id renamed, my call after judge 2):

| Row | Built as | Offered first when | The line (T does it: a reload on the line is the asking) | At WH 4 / 10 / 15 / 19 / 30 / 42 [computed] |
|---|---|---|---|---|
| **RELOAD** | `reload:speed` (drop, reach, seat, release) | the bolt believed locked on empty, in contact or not | "Empty. Reload." (warn) | 3.27 / 2.53 / 2.13 / 1.89 / 1.45 / 1.15 s |
| **Top up** | `reload:tactical` (the partial to a pouch, reach, seat) | a lull: nothing perceived for `LULL_MS` 3,000 and the room called clear, or in cover with nobody in sight; the magazine believed at half or less | "Lull. Top up." (SKILLS §14.5's `reload`) | WEAPONS §5.3's figure as v0.0.6 re-times it |
| **RELOAD, keep the empty** | `reload:retain` (to the dump pouch, reach, seat, release) | the bolt locked and nobody in sight | (the panel's choice) | 3.86 / 2.99 / 2.52 / 2.24 / 1.71 / 1.36 s |

- **Eyes up** from Weapon handling 15: a reload or an immediate action keeps the eyes on the sector, so the expectation does not drop (§25.4.2's heads down below 15); the row says "eyes up". From rung 3 a reload's hands may run while the feet carry on (§25.7's channels).
- **"Reloading!"** is called free with a reload in a team (§8.4), so a buddy covers. **"Gun down!"** (the doctrine proposal): in a stack or a room with a buddy, from rung 1, a 0.5 s step: a knee or a step off the line with the call, the buddy takes the sector, then the drill.
- **The strict tactical reload** (the fresh magazine to the support hand first, `magOut:hand`, the gun without a magazine for about a third of the time, from Weapon handling 12) comes later under a new id; nothing scored is renamed (my call, after judge 2; the systems proposal's terminology is right and can wait).
- **As built in v0.0.8** (`specials.js reloadRows`; WEAPONS §5.3; the build sheet 0.0.8 §8 items 17, 18): the three rows by purpose everywhere, ids unchanged (test-handling's panel says "Top up" where the tactical RELOAD read "RELOAD", its course to the tick); the times to the table's ±0.02 s. **RELOAD** first with the bolt believed locked on an empty (on the bay of turners at the panel's head, over Fire struck and the aim; test-handling's and test-range's panels keep their order). **Top up** first only in a lull (`lullOf`: no window, no threat facing, `LULL_MS` 3,000 since your last shot, the last pause and the last turner gone edge-on), with the magazine believed at half or less **and a fuller one believed at hand** (specials' call: the pairs magazines are thirties loaded with ten, so "half" alone would lead with Top up on a full load). On the pairs course it is offered with the magazine believed empty and a round chambered too (`COURSES.pairs.spoutTopUp`, the fixer's: the lull after the dry string); test-handling keeps the coach's "fire it" (WEAPONS §11). When the session names a magazine (`R.wantMag`, the coach's two-round one), Top up's queue reaches for its pouch and says so ("Top up: the two-round magazine, chest pouch 3"). Nothing is done unasked. The scene counts each reload by its purpose as believed at its start: 'dry', 'lull', 'topUp' (inside a string), 'between', 'short'.
- **The transition** (WEAPONS §5.2: 0.3 s and the draw; 1.40 s at WH 10, 0.64 at 42 [computed]) is offered beside RELOAD with its time when a person is within 10 m and a pistol is carried, and first in the stoppage card when the threat is close. The player carries no pistol before the boarding party's and the Raiders' kit (0.5 and 0.7), so it is built with the sidearm. **Designed 2026-11-11 (the user's note on v0.0.12)**: the shoot house issues the P-12 from the Sergeant up, and the transition is built there, first on the stoppage card with a threat facing within 10 m (§25.19.6; WEAPONS §3.2).

#### 25.6.6 Stoppages

IMMEDIATE and REMEDIAL ACTION stand as built and scored, with the reflex card ("Click.") and its kept answer. **Skill shows as knowing** (the play proposal, my call): from Weapon handling 15 the card names what the hands felt, a Weapon handling check against DC 10 on its own stream ("Click: a dud, by the feel"; "It didn't cycle: a stovepipe, by the feel"), and leads with the right drill, where a recruit must look at the port (0.3 s) to know. From rung 2 IMMEDIATE ACTION ends back on the aim ("Tap, rack, back on him": the re-presentation, 0.15 s × pace and the turn, without the sight term).

### 25.7 Bundles as data, gated by training

#### 25.7.1 The stepper with channels

A step is a list of **beats** (the systems proposal), each with a kind (`move`, `posture`, `aim:point`, `door`, `scan`, `call`, `mark`, `wait`), a **channel** (`feet`, `hands`, `eyes`, `voice`, or `world` for a wait on the world), its time (paced by its skill, known when it starts, ×1.6 on a failed roll), its dependencies (`after`: a beat's id with an optional share, `approach@0.85`, or `door@pass` for the leaf passable) and whether a contact cuts it.

- **Rungs 0 to 2: one channel at a time**, so the step's time is the sum (v0.0.5's macros are exactly this).
- **Rung 3**: a `hands` or `voice` beat may run while a `feet` beat runs. **Rung 4**: an `eyes` beat too. The engine keeps one active beat per channel; at each boundary it ends the beat, then starts every beat whose channel is free and whose dependencies are met. The step ends when all are done.
- **A seam** below the rung ends the step after its beat, the body braking into it, and queues the rest as "Carry on" (the macro's halt with reason `seam`). **A failure that is not routine** halts as a macro does; **a refusal** (locked, jammed) halts with its reason and offers the breach variants.
- **Determinism**: every boundary falls at its formula time, taken on the first tick at or after it, so a step lives whole ticks (TIME §4.3), channels or not.
- The engine is v0.0.5's step machinery taken out of `shooting.js` into `src/sim/combat/stepper.js`, **after v0.0.6 has merged** (v0.0.6 changes `shooting.js` and `drills.js`), and `scene-handling` must pass byte for byte through it.

#### 25.7.2 The room's drill, written as data

COMBAT §7.7's `enter-and-clear`, the player's slot as the bundles' source, in `src/sim/combat/drills/enter-and-clear.js` (my sketch of the shape):

```js
export const ENTER_AND_CLEAR = {
  id: 'enter-and-clear', family: 'room',
  beats: {
    approach: { k: 'move', ch: 'feet', to: 'stack#slot', stance: 'combat' },
    ready:    { k: 'posture', ch: 'hands', to: 'highReady', after: ['approach@0.6'] },
    muzzle:   { k: 'aim:point', ch: 'hands', to: 'door', after: ['ready'] },
    squeeze:  { k: 'call', ch: 'voice', say: 'squeeze', slots: [2, 3, 4], after: ['muzzle'] },
    door:     { k: 'door', ch: 'hands', variant: 'breach', slots: [1], after: ['approach@0.85', 'squeeze'] },
    enter:    { k: 'move', ch: 'feet', to: 'point#slot', stance: 'assault', after: ['door@pass'], contact: 'cut' },
    corner:   { k: 'scan', ch: 'eyes', to: 'corner#slot', after: ['enter@0.4'], contact: 'cut' },
    sector:   { k: 'scan', ch: 'eyes', to: 'sector#slot', after: ['corner'], contact: 'cut' },
    clear:    { k: 'call', ch: 'voice', say: 'clear', after: ['sector'] },
    mark:     { k: 'mark', ch: 'hands', slots: [1], after: ['clear'] } },
  bundles: {                                         // each offered from its rung, once lived by hand
    'room:stack':       { rung: 1, beats: ['approach', 'ready', 'muzzle'], label: 'Stack on the door' },
    'room:open':        { rung: 1, beats: ['door'], label: 'Open the door' },
    'room:stack-open':  { rung: 2, beats: ['approach', 'ready', 'muzzle', 'squeeze', 'door'], label: 'Stack and open' },
    'room:enter':       { rung: 2, beats: ['enter', 'corner'], label: 'Enter and clear your corner' },
    'room:dominate':    { rung: 2, beats: ['sector', 'clear', 'mark'], label: 'Dominate' },
    'room:clear':       { rung: 3, beats: 'all', label: 'Clear the room' },
    'room:limited':     { rung: 2, beats: ['approach', 'ready', 'door', 'enter:threshold', 'sector', 'back'], label: 'Limited penetration' },
    'room:slice':       { rung: 2, beats: ['approach', 'slice*'], label: 'Slice the pie' },
    'house:clear':      { rung: 4, lane: true, label: 'Clear the house' } },
  variants: { breach: ['open', 'kick', 'ram', 'charge'], entry: ['cross', 'hook'], flash: false, stance: ['assault', 'combat'] },
  halts: ['contact', 'fail', 'refused', 'door-unplanned', 'gun', 'order', 'call', 'hit', 'seam', 'branch', 'lane-end'],
};
```

- **Rung 1's "bundles" are single steps** (a move that ends at high ready on the door; the door): one press each, as the user's recruit does them.
- **The flash variant** adds the pouch, the pin, the throw and the wait for the bang, and the row names its flashbang; **the breach variant** is the player's, set on the row, never chosen by the bundle.
- **Its gate**: `offered(p, b) = rungOf(p, family) ≥ b.rung && lived(p, b.id)`; `rungOf` reads the sheet's `drills` and the schools' floors (§25.3.2). **The single steps are always in the panel** (the door's rows, the moves, the looks, the calls), one by one.
- The other families follow at their milestones: `clear-passage` (0.2), `hatch` and `void` (0.5, the Hulk and `test-zerocqb`), each a data module of beats.

**Designed 2026-11-11 (the user's note on v0.0.12)**: `bundles` is replaced by `MUSCLE`, the muscle-memory catalogue by phase, and the beats gain `read`, `tell`, `breach`, `inner`, `roomclear` and `reorg`; `ready` goes by slot (the #2 at low ready), `enter` is suspended by a contact from rung 2, never cut, and `house:clear` is removed (§25.19.2).

#### 25.7.3 The room plan

The beats read a **room plan**: `roomPlanOf(state, doorId) → { threshold, stack[4], points[4], corners, sectors, dead, paths }`. **For the first scene the plans of X4's three layouts are authored as data** (`src/data/places/x4-plans.js`, held by a golden hash; my call after judge 2); **from 0.3** (Europa's buildings) they are derived from PLACES's room polygons by the systems proposal's method (the corners walked from the door's wall; the threshold 0.3 m in; the stack on the leaf's open side, #1 0.5 m from the frame and 0.45 m off the wall, the next each 0.65 m behind; #1's and #2's points 1.0 m from their corners and 0.5 m off the wall, #3's and #4's a third into the room; sectors to the far wall's middle; dead space by `clearLine` from the points; paths by the nav grid's A*), checked against the authored ones. Built at the area's load, cached by door and layout in `$rooms`, never saved.

**As built in v0.0.12** (`src/sim/combat/stepper.js`, `bundle.js`, `drills/enter-and-clear.js`, `room.js`; the build sheet `docs/build/0.0.12.md`). v0.0.5's step machinery moved out of `shooting.js` unchanged, with channels added (feet, hands, eyes, voice): one beat at a time to rung 2, the hands and the voice beside the feet from rung 3, the eyes too at rung 4. A beat's record is named by `key`, never `id` (the save's id walk treats any `id` field as an id); a turner's trigger is `{ kind, on, gapMs }` for the same reason. `room:stack` includes the #2's squeeze (his whispered "Ready."); the muzzle-onto-the-door beat is at rungs 0 and 1 only; Dominate walks the rest of the way to its point; the far leg is the room's own, not a branch: the beats `far` and `farlook` (#1 only, after his sector, before "Clear!"). **Plans** gain `parts`, the hall's `gate`, the derived `plane`, `dead` (counted as cleared space) and `far: { path, hot }` (room 3: up the near leg to (18.7, 7.3)). **Carry on from the aim** starts with a posture beat (`up`, the muzzle up, on the hands channel, flowing with the feet from rung 3) when the rifle is at the aim. **The #2** waits at the door by his walk's closed form (`twoArriveMs`, within `TWO_SLOT_M` 1.5 m of his slot, at most `TWO_WAIT_MS` 3 s), his entry is cued on your first step into the open doorway, he takes only his own men (at most `TWO_FOLLOW_N` 2 follow-ups on a man still up), and the room's "Clear!" waits on his man and his sector, at most `CLEAR_WAIT_MS` 5 s and ending at his group's planned end; `TWO_POLL_MS` 500. The call beat's wait on the #2 is `onMan` plus his sweep. A rushed bundle's walks are the legs' profile, never scaled by time alone (a time-scaled walk stopped 40% short); its hands, eyes and voice are rushed. A stall hand-back never fires for a #2 already in place. The `ASKS` ("door-unplanned", "refused") are never carried past by T or by a moving-on row, and "door-unplanned" is asked from the doorway, where Hold it is offered. (My calls, the fixer's, for the user to overrule.) **After v0.0.12, in the tree** (the rework's fixer, 2026-11-11, my call): every drill move is routed by the nav on the walker's C0 class (`src/sim/combat/route.js`, `ROUTE_CLS` 'C0', `CORNER_KEEP_M` 0.005, `CORNER_DEPTH` 4, `CLIP_STEP_M` 0.01), shut doors blocking but the bundle's own; the authored paths are not walkable at C0 as drawn (7 of 15 legs cut a door frame) and routing goes round them with the points kept (§25.19.1). **Designed 2026-11-11 (the user's note on v0.0.12)**: the paths gain each door's outer middle and a lane per slot, the #2 is cued by distance and never asked from the doorway (§25.19.3.4).

### 25.8 T's automation, and where it hands the decision back

#### 25.8.1 What T does by rung

T does what the line offers (SKILLS §14.3), and the line offers as much as the marine's training lets his body do without thinking (my call, the frame all three proposals share):

| Rung | At a door to clear, the line (tier by Tactics) | T does | At the contact |
|---|---|---|---|
| 0 | "Find a wall. Don't stand in the door." | the next single step | "Aim. Then fire." T aims |
| 1 | "Stack on the door. Muzzle on it." / "Open it." / "In. Your corner's left. Don't stop in the door." | Stack on the door; Open; **then nothing: X and the move keys, shown as keycaps** | "Rifle, far left. Aim. Then press." T aims |
| 2 | "Stack and open." / "In, your corner." / "Your sector. Call it." | the group | "Rifle. Pair." T aims (the row's aim) |
| 3 | "Clear it. Hinge left, cross right. 4.0 s." | the room | "Rifle. Pair." |
| 4 | "Clear the floor. Three rooms." | the house | "Pair." |

- **The recruit's T never does the walk in** (the user's "then would move in using movement keys (game unpaused with X)"): a rule, tested.
- **The voice becomes his own** (the play proposal; my call): to rung 2 the line is the DI's, in the radio box's manner; from rung 3 it has no speaker, a plain thought, because the drill is no longer someone's voice in your head but your own. The user's "the drill instructor's voice in your head" (DESIGN.md) becomes the marine's, and the player sees it happen.
- §3.1's "a firefight can be ridden out in real time by following T" stands for fights in the open (orders on the line); in a room a rung 0 or 1 marine works step by step.
- **T held** stays the chip (SKILLS §14.1) and, above 3 G, the anti-G strain (VIEWS §7.3), where no room is cleared. No preview key is needed: the line names the bundle and its time, and its row shows every beat before it is pressed.
- **Designed 2026-11-11 (the user's note on v0.0.12)**: rung 4's "the house" is withdrawn; T at rungs 3 and 4 does the room, to "Room clear!", and at "Room clear!" the line offers the next door's stack row. The pause policy of §25.19.4 decides where T stops.

#### 25.8.2 Where it stops and hands back

A running bundle stops, the rest offered first in the panel and on T as "Carry on: …", at:
- **every person newly seen**, after the take-in (§25.4);
- **a door or opening the plan does not take**: "Door, right wall. Hold it or clear it?";
- **the gun**: a click, a stoppage, the bolt locked;
- **a failed roll that is not routine** (a kick that did not open the door; a stumble on a threshold);
- **an order, a call** ("Man down!", "Grenade!"), **a hit**;
- **a seam below the rung**, **a branch of the plan** (a junction, a stair, a door whose breach is not set), **the end of the lane**.

The player stops it by **Backspace** (v0.0.6's chain key: stop after this beat) or X, at the end of the current beat. Space pauses.

**As built in v0.0.13** (the fixer's, 2026-11-11): a contact that cuts a scan counts it done, but not the far leg's look, which stays owed until "Carry on" does it. **Designed 2026-11-11 (the user's note on v0.0.12)**: from rung 2 a contact inside an entry suspends the bundle rather than stopping it, a shot row with nobody left up ends with no stop, a man in the #2's sector is his, the inner door is asked from the point, and "Room clear!" ends every room: §25.19.4's table is the full list of stops, each naming why and a live row.

#### 25.8.3 The DI's close-quarters rules (`src/sim/skills/instinct/cqb.js`)

Tiers by Tactics for the drill's lines and Marksmanship for the shots' (SKILLS §14.3 rule 5: under 8, 8 to 19, 20 and up); the act by the rung; at least four phrasings each (SKILLS §14.7). The act grammar grows by one form, `stop:drill:<bundle>[@<variant>][><doorId>]`, offered only when its row is in the panel now (`actIf`).

| Id | Tone | When | T does |
|---|---|---|---|
| `cqb-stack` | note | a door of the plan within 8 m, not cleared, not stacked | rung 0 and 1 Stack on the door; 2 Stack and open; 3 the room; 4 the house |
| `cqb-door` | note | stacked, the door shut | Open (the breach set) |
| `cqb-go` | note | the door open, not entered | rung 0 and 1: **nothing** (X and the keys as keycaps); 2: Enter and your corner |
| `cqb-funnel` | warn | standing within 0.5 m of a door's plane over 1.0 s | rung 2 up: Enter; else nothing: "Out of the door. You're a target in it." |
| `cqb-flag` | urgent | the muzzle across a buddy in a stack or a room | high ready; **low ready ("Muzzle down.") from the rework** (§25.19.3.5), neither posture flagging |
| `cqb-contact` | urgent | at the pause | aims at the contact; **never the shot** |
| `cqb-unknown` | warn | the hands not seen | Challenge |
| `cqb-noshoot` | warn | identified with empty hands, or a hostage beside him | nothing: "Hands. No weapon. Don't." |
| `cqb-still-up` | urgent | "He's still up" (§25.6.1: a torso round rang on a plate, or `STILL_UP_TORSO` 2 torso hits, and he stands; one hit on paper is not it) | aims at the head: "He's still up. Head." |
| `cqb-carryon` | note | a bundle cut, the contact down or gone | Carry on |
| `cqb-corner` | warn | rung 0 or 1, in the room, a hot zone not looked at | a look: "Behind the door. Check it." |
| `cqb-clear` | note | every sector looked at, nobody standing | "Clear!" |
| `cqb-method` | note | rung 2 up, Tactics 8 up, a cue at the door | the variant it names ("Bang it.", "Slice it.") as a row choice, never a throw |
| `cqb-reload` | warn | empty | RELOAD; with a pistol and a person within 10 m, the transition |
| `cqb-topup` | note | a lull, half or less believed | Top up |
| `cqb-stoppage` | urgent | a stoppage felt, a contact within 10 m | the transition if a pistol is carried, else IMMEDIATE ACTION |

**As built in v0.0.12** (`src/sim/skills/instinct/cqb.js`; SKILLS §14). The far leg is the room's own; the hand-backs are as §25.8.2 lists them, with `R.house.asked`, `.broken` and `.read` recording the door questions, the kicked locks and the reads. T at rungs 0 and 1 at the open door is X (leave): the panel's "X go" row, never the feet; below rung 2 nothing but the movement keys crosses a door's plane into a room not yet cleared (the user's rule that T does every row a DI line names overrides §25.8.1's "T does nothing", sheet item 9). cqb.js holds 20 rules (`CQB_RULES`), cqb-corner with its `far` variant. After the fixes: `cqb-two` fires only while `twoAway` and `cqb-carryon` allows why `two` once he is in place ("He's on you. Carry on."); `cqb-dominate`; `cqb-hall`; `cqb-still-up` never on a no-shoot; `cqb-noshoot` `on` (a no-shoot hit twice never asks for his head); `cqb-locked` `again` ("held. Kick it again."); `cqb-stack` `r4rest`; `cqb-go`'s `walkWords` name each room's own keys and your corner's side ("S and D" into room 2, "corner right" in room 3). The range's rules quiet on the pairs course (`range-cmd`, `range-kd`, `range-reload`, `range-fire`, `range-wait`) and its `range-muzzle` are quiet in the house (`RANGE_OFF_HOUSE`), and `HOUSE_CMDS` makes `range-cmd` speak for LOAD, MAKE READY and UNLOAD SHOW CLEAR off the lane, so before GO and after the lane the instructor's commands lead and T does them. After a second contact the line remembers every man you identified who is still up, yours first; the corporal inside a room is offered Dominate.

**As built in v0.0.13** (the fixer's, 2026-11-11): from rung 2 with every shot row struck (one round left), `cqb-contact` says Aim (T aims) then Press (the Fire row); with the bolt locked on an empty it is quiet and `cqb-reload`'s "Reload." leads: never a dead end. **Designed 2026-11-11 (the user's note on v0.0.12)**: `cqb-stack`'s `r4rest` goes with "Clear the house"; `cqb-stoppage`'s act is the card's first answer; new `cqb-gunup` ("Up. Carry on.") and `cqb-two-down` ("Your two's down. His sector."); every rule obeys §25.19.4's no-dead-end rules.

### 25.9 The movement stances in the room

The user's stances of 2026-11-06, which the shoot house is the "first scene where you move and shoot" they wait for (DESIGN.md's log). My numbers, to be measured when built (BODY §16.1):

| Stance | Walk on Mars | Carries | Take-in | The shot on the move | In a room |
|---|---|---|---|---|---|
| **Relaxed** | 1.14 m/s (built) | slung or patrol | ×1.25 | none: the weapon is not up | never: entering a clear in Relaxed is a fault ("Weapon up. You're in their house.") |
| **Combat** | **0.97 m/s** (`COMBAT_WALK_K` 0.85, the glide) | low ready; high ready in the stack | ×1 | **walking, −4, −2 from Marksmanship 15** (WEAPONS §7.3 as written) | the approach for everyone; the entry by the keys and at rungs 0 to 2; anyone who wants the better shot |
| **Assault** | **1.60 m/s** (`ASSAULT_WALK_K` 1.4: a low lope past Mars's walk-to-lope line at 1.33 m/s) | shouldered | ×1.1; ×1 from rung 2 | **within 10 m from rung 2: close-quarters fire at `mitigated(−8, Marksmanship, 30, 0.25)`**: −5 at MRK 10, −3 at 18, −2 from 23. Beyond 10 m, or below rung 2: area fire only, counted as suppression (§5.4) | the entry at rungs 3 and 4, and the default of Clear the room |

- The user's "close quarters shooting for experienced operators (the moving-fire penalty eased by skill and training)": skill is Marksmanship in `mitigated`, training is the rung. A recruit may choose Assault; his fire is then suppression, the user's "no accurate fire".
- **Shooting on the move is a step that moves** (the map's contradiction resolved): stop motion still holds the keys (`feetHeld`), but a row may move the feet for its duration, as §3.4's rushes do; a "…, moving" row runs the shots on the hands while the move runs on the feet.
- **V** cycles the stances outside the mode (DESIGN.md's log); in the mode the stance is a row, its time the carry posture's change (WEAPONS §6.1). A bundle takes its rung's default unless the player set one on the row.
- `gaitSpeeds` (BODY §16.1, `src/sim/body/motion.js`) takes the stance as an input; Combat and Assault are built with `test-shoothouse` (§25.14).

### 25.10 Training: where, the shoot house, and the scenes

#### 25.10.1 Where in the career

| When | Where | What is lived | Rungs |
|---|---|---|---|
| boot, MCRD Argyre | the depot | the rifle, the rules, the Corps' commands; and, if the user takes it, a first room in the flashback's third scene, `house` (§24, question 13) | room 0 |
| the School of Infantry | a paper (CAREER §4.7) | "MOUT: stack and clear, dry and with blanks" on the summary | room 1, passage 1 taught; nothing lived |
| the standby, career sol 7 (Monday) | the training village, in the MRX's rehearsals after the patrol order | **the first-time teaching**: the squad leader's walk-through of the dawn's house, dry, at 1:1, no rounds; he calls the stack, the door, the corner and the sector; T is the DI's single steps | reps (unit cap 2) |
| sol 8 (Tuesday), dawn | the MRX's cordon and search (CAREER §5.8) | a house with Star Helix role-players and an observer, marking rounds; the player #3 or #4 in the stack; 3 to 5 rooms by hand | reps; the first race at a door |
| the slipped weekdays (sols 9 to 13) | the MOUT day: the morning in **the shoot house** at 1 G (the Wheel's, PLACES §4.15), a 3 h block (about 12 runs, the cadre: cap 3); the afternoon in the Wheel's street with marking rounds | lived or skipped the same | rung 2 after about two blocks |
| dwell, and free time on base | the shoot house on a squad's booking, or "Can we run that again?" to the squad leader (CAREER §5.5) | lanes and the hot wash | toward 2 and 3 |
| the voyage | boarding drills in the passageways (SKILLS §6.2) | the `passage` family | reps (cap 2) |
| Europa | real rooms at `danger` and `fire` (nothing routine, SKILLS §5.1) | cordon and search, QRF call-outs | field reps ×2, to 3 |
| schools | `boarding`, `aic`, `brc`; `breacher` | each a chapter with lived test days (CAREER §9.4) | floors 2 and 3; the ram and charge |
| the Raiders' ITC, phase 3 | the Raider school, Phobos and Deimos (CAREER §11.2) | close quarters battle and boarding in every gravity | 4 in every family |
| the tier one | past 1.0 (CAREER §11) | | NPCs and the test sheets |

The rehearsal rides with the MRX as part of "the exercise", so CAREER's rule of at most two new systems a sol holds (my call).

#### 25.10.2 The shoot house for close quarters

PLACES X4's design (30 × 20 m, `ballisticPanel` walls, 8 rooms off a hallway, three authored layouts A, B and C, an instructors' catwalk of grating at 3 m, a control booth with cameras, practice rounds live), built four times **at 1 G in the Wheel's sector 4** (PLACES §4.15; moved there from the ranges on 2026-11-08 by the user's "always train at 1G"), house 1 at its final place (ROADMAP §2.1), its hall and rooms' depths across the band. What close quarters adds:
- **Doors that say how they open**: each opening records its hinge end and the room it swings into (PLACES §1.6's `swing`, settled), because the plan and the door's rows read it.
- **Targets** (range pieces, as v0.0.5's bay): steel and paper man-targets and mannequins, each **hostile** (a painted rifle or pistol), **no-shoot** (hands, a phone, a child's figure), **unknown** (hands hidden until a turner shows them) or a **hostage** card held by a hostile; **turners** that face in 0.3 s on the booth's seeded timer or when a door opens (a target that turns to face you is a person appearing: the take-in runs on it, no NPC brain needed); **pop-ups**; a **mover** on a rail in the hall; **armoured** silhouettes whose torso plates ring and stay up until the head plate falls (the failure drill's reason). Steel falls when hit at "good" or better.
- **Scoring by the margin**: the A-zone at "good" or better, the C-zone at "pass" (SKILLS §5.6).
- **The instructor**: a generated staff sergeant, the house's chief (`stream('staff', seed, 'melas', 'x4-chief')`, PEOPLE §3.13), on the catwalk where he can see down into your room; his words in the radio box as a person, never through the T line (the range's rule, v0.0.5). The brief at the lane's door; "Standby", a gap drawn from the seed (1.5 to 4 s), "GO" on the PA; fault calls as they happen ("Don't stop in the door!", "Your corner!", "Muzzle!"), at most one line a room otherwise, nothing while a take-in runs; the safety shout if the muzzle sweeps the catwalk (the range's rules, the catwalk an uprange).
- **The run sheet** (the doctrine proposal), the instructor's paper after each run: the time from GO to "Clear!" and from the door to "Clear!"; each contact's take-in, the pause to the first round, the first round's place; rounds, hits, splits, no-shoots hit; **seconds in the doorway** ("stopped in the funnel" over 1.0 s); muzzle sweeps of the buddy; hot zones missed; calls made ("Clear!", "Reloading!", "Gun down!"); one line, the thing to do differently, picked from the run's worst number (§17.2).
- **The hot wash** in the booth (§17.2), 1 to 2 minutes, lived or skipped: each contact as two of the cameras' frames (the sighting tick and the pause) with its take-in drawn as a bar.

#### 25.10.3 `test-pairs` "Pairs" (scored; after `test-range`)

The cheapest scene that tells whether the pause reads as the marine's or as lag, before anything depends on it (the doctrine proposal; both judges).
- **Where**: the 25 m bay of X3 (built in v0.0.5), a 7 m and a 10 m line painted on its pad, turning targets on the frames.
- **Kit**: the R-7, three magazines (one holding two rounds), and at the lull the coach hands over a fresh ten; a coach with a shot timer.
- **Strings**: (1) one target turns at 7 m while the shooter waits at low ready **out of stop motion**: the take-in at 1:1, the pause, a Pair; (2) two targets turn together (one pause, `severalK`); (3) a no-shoot turns among them (the identification, Challenge, Hold); (4) the armoured silhouette: the pair rings, "He's still up", the head or the failure drill; (5) the two-round magazine runs dry: RELOAD; then a lull, opened at the last string's end: Top up. A target turning within 20° of where the muzzle points is in his sector (the private 0.55 s), one beyond it alert (1.05 s): the scene teaches the factor by itself. The transition waits for the pistol.
- **Sheets** on the start card (ROADMAP §2.1: scenes never write a career): boot recruit, private, sergeant, Raider (five years), tier one; "Again as …" on the same seed.
- **The paper**: the coach's shot timer, "TURN TO PAUSE 0.80 · PAUSE TO FIRST 1.40 · SPLITS 0.40 · 2 A, 1 HEAD".
- **Aspects scored**: **the turn** (the take-in: does each sheet's time feel right, and read as the marine's), **the shots** (the rows), **the gun** (the reloads in the lull).
- **Needs**: `react.js`, the contact record and the window on targets (the detector calls `sightOf` on the bay's few targets until the player's sightings exist), `arms/specials.js`, parts on rows, the reload purposes, turners as range pieces. Not the stepper, the bundles, X4 or the stances.

**As built in v0.0.8** (`src/sim/scenarios/pairs.js`, `src/data/courses.js` `COURSES.pairs`, `SEQ_PAIRS`, `PAIRS_COACH`; ROADMAP §4.2's 0.0.7b row; the build sheet 0.0.8 §8 items 18 to 24, §10; each my call unless named):
- **The ground** (PLACES §4.12): a turner's stand 1 m in front of each of the six frames (x 1,124.0), the 7 m line at x 1,117.0 and the 10 m at x 1,114.0 on a new pad; the frames and the 25 m cards unchanged, and no face hung in test-handling or test-range. The player's lane is drawn 2 to 5 (`range:lane`), the hour 11:00.
- **The kit** (`kit 'range-pairs'`): the R-7 slung front, magazines of 10, 10 and 2 (ball, chest pouches 1, 2 and 3: the issue 22 rounds); at the lull the coach hands over a fresh magazine of `lullMag` 10 into a pouch with room, counted on the issue (32 once the lull is reached). In review the lull had nothing to top up with: every sheet on seed 48213 reached it with an empty magazine in and one round in a pouch.
- **The coach** is a generated person (the post `melas:kd-coach`) at your left shoulder who runs the bay as its RO (`R.roId` is his id, no tower): his commands are speech, and **he says nothing while a window is open**. `SEQ_PAIRS`' **17 commands**: brief · LOAD · MAKE READY · [Standby · Stop] for strings 1 and 2 at 7 m · "Back to the ten" · [Standby · Stop] for strings 3 and 4 · the short magazine · Standby (string 5) · Lull · UNLOAD, SHOW CLEAR · the end. The readinesses (`pairsReady` first in handling.js `lineReady`): **pairsReady** (still, out of stop motion, low ready in Condition 1 on safe, the finger off, in the current line's box; dry: on safe in it), **stringDone**, **shortReady** (pairsReady with the short magazine in), **toppedUp** (pairsReady with the magazine believed above half, or a Top up seated since the lull began, or nothing fuller to top up with: "no Top up the drills offer"). From "Back to the ten" until you have stood on the 10 m point (`R.at10`) the line's box is both lines'.
- **The strings** are drawn from the seed alone, never the sheet (`pairs:pick` k, `pairs:gap` k and the attempt; the holds by hash), so "Again as …" turns the same targets at the same gaps: (1) one at 7 m, your lane 0.5, either neighbour 0.25; (2) two at 7 m, yours and a neighbour, 0.5 each side; (3) three at 10 m (L − 1, L, L + 1), one a no-shoot, uniform; (4) the armoured silhouette at 10 m alone, your lane 0.5, a neighbour 0.25 each; (5) two threats at 10 m, yours and a neighbour, on the short magazine. A threat holds a rifle 0.7 or a pistol 0.3; a no-shoot empty hands 0.6 or a phone 0.4. The gap from Standby to the turn `STANDBY_MS` 1,500 to 4,000, whole ticks.
- **The turn is armed only for a ready shooter on his point**, out of stop motion (the fixer's, `pairsWant`: a magazine in, a round up, on safe, low ready, out of the mode, on the point, still), and disarmed if he stops being ready or enters the mode before it ("Out of it. Wait for the turn.", once a string); out again, it is re-armed with the next attempt's gap as a fresh cue (`R.cueAtMs`). The coach's nudge and the DI name the first part lacking (`PAIRS_NUDGE`: "Shooter, a magazine in."). At the turn every turner of the string turns (`TURN_MS` 300, the 'turner' fact), the line goes hot and the timer starts with its beep.
- **The hit sensor**: a paper threat goes down at `STOP_TORSO` 2 torso hits or `STOP_HEAD` 1 head hit and turns away `SENSOR_MS` 100 later; the armoured only by its head plate (§25.6.3); a no-shoot hit is the fault 'noshoot'. An ND-1 (into the berm) is a fault on this course and the line carries on; ND-2 and worse still stop (WEAPONS §6.6).
- **A string ends only when you are still** (no step under way, no window: a row is never cut), on the first of five: every threat down ('stopped'), a no-shoot hit ('noshoot'), `STRING_MAX_MS` 20 s lived since the turn ('time', a fault, never a dead end), nothing left to fire anywhere ('dry'), or on safe after a round ('declared', your "done"). The line goes cold, every turner still facing turns away, and the coach reads his timer: `paperText`, "TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.50 · SPLITS 0.40 · 2 A" (zones A, C, HEAD, RING, HEAD DOWN, MISS, NO-SHOOT HIT, zeros left out; the steel's string reads "1 RING, 1 HEAD DOWN, 1 MISS"). A command the coach's move-on passes over closes an open string as not fired.
- **The lull** opens at the last string's end (or the coach's "Lull", whichever first). Not built: a turn in the lull, a sixth contact (§24, question 15). One magazine a string is waived on this course (`oneMag: false`): string 5's dry RELOAD is the point.
- **The sheets** (SKILLS §11.1's `TEST_SHEETS`): the picker's Boot recruit, Private (focused), Sergeant, Raider and Tier one, the corporal by the URL (`&tier=cpl`); written on the scene's player only. **The end card**: "Private · 5 strings · take-in 0.55 to 1.25 s · 14 A, 1 ring, 1 head down, 4 miss · no-shoot untouched · RELOAD 2.55 s · topped up" (the pairs bot, seed 48213), its faults named, the same sheet's take-in in a room it is clearing beside the bay's (the recruit 0.95 s), and this session's runs on the seed, a line a sheet; "Again as …" each other sheet on the same seed. Score line: ROADMAP §2.2.
- **Lived** (PLAYTESTS.md, v0.0.8): the recruit's run 127 to 132 s of real time, the tier one's 68 to 71 s; turn to the first round about 2.5 s for the recruit against 0.6 s for the tier one, three presses (Off safe, Aim, Fire) against one (Pair).

#### 25.10.4 `test-shoothouse` "Stack and clear" (scored; ROADMAP §4.2's 0.0.7d, the next scene after `test-stress`; at 1 G)

- **Where**: house 1 of the Wheel's sector 4 (PLACES §4.15), X4's design in layout A, at its final place, at 1 G: a lane of three rooms and the hall: the reference room (centre-fed, §25.5.1); a corner-fed room with **a closed inner door** (every bundle stops there: "Hold it or clear it?"); an L-shaped room whose far half is seen only from its middle, with the **hostage** card and dim light the instructor sets (−2).
- **At 1 G** (the user, 2026-11-08: "CQB room clearing in full G", and "always train at 1G"; the full G is 1 G, the user confirming; [computed] from BODY §16.1 and SETTING §5.11; my calls). The first scene at Earth's weight. What 1 G changes in the room, and what it does not:
  - **The feet**: BODY §16.1's gaits at 1 G: the walk 1.45 m/s (Melas 1.14), the Combat walk ×0.85 **1.23 m/s**, the Assault walk ×1.4 **2.03 m/s**, a fast walk under 1 G's walk-to-run line (2.15 m/s at Froude 0.5) where at Melas it is a low lope; a stop on a dry floor (μ 0.6, 5.9 m/s²) takes **0.21 s** from the Combat walk and **0.35 s** from Assault (0.43 and 0.71 at Melas), so a seam costs half and the room is crossed sooner; §25.5's times are reprinted at 1 G by `combat-race` when the scene is built.
  - **The body's weight in the stances and the stack**: the R-7 (4.3 kg) weighs 42 N, 16 at Melas, and the kit 2.6 times its Martian weight: held at high ready through the stack's wait, the arms tire by BODY §8's g-scaled drains; kneeling at the door, rising, the stack's squeeze (the #2's hand on the #1's shoulder) and the push through the funnel are Earth's.
  - **Recoil**: its impulse does not change with gravity (WEAPONS §7.8), and a standing, kneeling or prone shooter is `planted` at 1 G as at 0.38 G (WEAPONS §7.8), so the rows' times stand as `test-pairs` built them.
  - **Falls**: a trip at the threshold or a dive to prone lands at Earth's speed (from 1 m, 4.4 m/s against 2.7 at Melas: BODY §16.5's hard band, not the bruise band) and is over in 0.45 s against 0.73.
  - **The spin**: the house's gravity is `spin`, so BODY adds a body's Coriolis (6% of its weight at the Assault walk along the spin, 2% across) and WEAPONS §2.9 the rounds' offset as their spin bias (frangible at most 1.7 cm at 10 m, a marking round 2.8 cm at 5 m, along the spin; 0.38 of that across, where the hall and the rooms' depths lie), both by closed form; the hot wash names it once ("The Wheel puts a round low along the spin.").
  - **The sheets** carry `gCond` 1.00, the Wheel's week (BODY §14.1): no "heavy" band in the scene.
  - **Not changed**: the take-in, the rows, the bundles, the rungs, suppression and hardening: the brain is the same at any weight.
- **The order after it** (the user, 2026-11-08: "then ship CQB in microgravity and grav boots, and to real combat with enemies"; ROADMAP §4.2): **`test-zerocqb`** (0.0.7e), ship close quarters at micro-g in the Wreck at Phobos (PLACES §5.7), mag boots and the wedge, by §14.5 and §14.8 as written: anchor before you fire, six faces, hold to hold, feet aft, the `void` family's first beats; then **`test-breach`** (0.0.7f, §25.18.3), NPC defenders on the take-in, suppression and hardening in one room of this house; then **the first live fight** (0.0.7g, ROADMAP §4.2; default: `test-collar` brought forward from 0.5, a coasting hauler's crew decks at micro-g, real defenders by §14.4's types on §7.11's procedure).
- **The goal line** (8 s, as every scene's): "Lane A of the shoot house with Corporal [name] as your number two, on the instructor's GO: three rooms and the hall. Threats down, no-shoots untouched."
- **People**: your #2, generated, of your sheet's tier, running his slot by the same bundle engine (no brain needed; the lane places at most one target in his sector, which he engages by his own take-in); the instructor on the catwalk.
- **The sheet picker** (the scene's heart, the play proposal): **Private** (WF 15, rung 1), **Corporal** (34, rung 2), **Sergeant** (44, rung 3), **Raider** (70, rung 4), **Tier one** (93, rung 4, SKILLS' NPC template, for the test only); each at its tier's middle values; on a test sheet every bundle of its rung counts as lived (my call). `?play=test-shoothouse&tier=private|cpl|sgt|raider|tierone&seed=<n>`; from the Tests menu, Private. **The end card offers "Again as …"** each other sheet on the same seed, with the runs side by side room by room.
- **The kit**: two magazines of 10 practice rounds and a third with the coach's dummy at a drawn position (the range's set stoppage, carried over); a flashbang from the Sergeant up; ear defenders. **Designed 2026-11-11 (the user's note on v0.0.12)**: the P-12 in a thigh holster with 10 frangible and a spare magazine from the Sergeant up; the #2 issued in Condition 4 and loading on the tower's command (§25.19.5, §25.19.6).
- **Pars, not wounds**: the instructor's timer counts from the first tick a threat target could see the marine to his first round on it; past the par the harness tone sounds and the sheet says "he fired first" (§2.3's harness as a tone). Pars (my calls): basic 3.0 s (the Private's default), advanced 1.5 s (Corporal, Sergeant), operator 0.8 s (Raider, tier one), selectable; a bang adds 3 s to each turner's par in that room (a little less than it buys a man waiting at the door, §25.18.2).
- **Length** (my estimate): the Private 4 to 6 real minutes with the brief and the hot wash; the Raider 2 to 3; the tier one 1.5 to 2.5.
- **Aspects scored** (ROADMAP §2.2): **the pause** (the take-in's feel and readability: the brackets, the stamp, the brake, the log), **the drill** (step by step against T's bundle, and whether the decisions that matter stayed yours), **the shots** (the rows and the reloads, offered when relevant).
- **The end card**: "LANE A · PRIVATE · 3 ROOMS · 58.4 S · 4 OF 4 THREATS · 2 NO-SHOOTS UNTOUCHED · FIRED FIRST ON YOU: ROOM 3 · TAKE-IN 0.80 TO 1.20 S · BASIC: MET".
- **Teaching**: the scene explains nothing beyond its goal line and the instructor's in-world calls (DESIGN.md, 2026-11-06: "Test scenes explain nothing more than their goal line"). In the career, the take-in is explained once, the first time its stamp appears, by one line of the DI's (my wording, SETTING to voice): "That's how long your eyes took. It gets shorter. You won't notice it getting shorter."

**As built in v0.0.11**: `test-shoothouse`'s spec exists as a stub (PLACES §4.15): host `melas.wheel.s4`, env `wheel`, hour 10:00 (my call), `built: false`, outside the Tests menu and refused by `newGame` until the layout and the fill are built. Next round: the layout, with the Wheel's 1 G on the `melas.wheel.*` area records (PLACES §3.16), then the spec's env becomes `{ preset: 'site' }`.

**As built in v0.0.12** (supersedes the v0.0.11 note above: the scene is playable, `?play=test-shoothouse`, the Tests menu's "Stack and clear" after "Bang"; its aspects the pause, the drill and the shots; the room 1 and lane figures are in §25.5.4's note). The shoot house rides the range session (`state.armoury.range` with course `house`, the lane's record in `R.house`), as "Bang" rode the pairs course; the pairs engine is not used. Calls the build made, each (my call): GO puts you in stop motion and the lane's time runs from GO, the stack timed from 4 m down the hall as §25.5's tables time it; the lane runs east to west, so #1 (stacked right of the door) never crosses the closed door's funnel; stand 1a is 4.09 m from the threshold (not 4.4), the door's plane falls at 0.73 m and the threshold at 1.21 m along #1's 2.72 m path. **The stops** use BODY §16.2's push and brake as written: the private stops in 0.24 s from Combat and 0.40 s from Assault (his legs brake at 5.07 m/s2); this section's 0.21 and 0.35 s are the floor's grip limit, which only Fitness 21 (the tier one) reaches. **The #2** is a marine of your fire team drawn from the seed (the same man on every sheet), given your tier's test sheet, engaging only the stands of his sector, never sweeping you with his muzzle; his seams cost his reaction time. **The instructor** is a generated staff sergeant of a new post, `melas:wheel-house-chief`, on the catwalk above your room, commanding on the PA, faulting as speech and silent during a take-in. **Pars** run from the threat's sighting to the first round on it by either of you: `PAR_MS` 3000 / 1500 / 800 (basic, advanced, operator), `PAR_OF_TIER` per sheet, set on the picker or by `&par=`; a low tone when the par runs out, a double beep for a room cleared within par. The dummy round rides in the magazine you load (its 3rd to 6th round) so every sheet meets it; frangible is the house's load (three magazines of 10; the `range: false` flag stays for Melas's outdoor ranges); the hostage card is one turner (any torso round, or a head round graded bad or worse, strikes the hostage; To the head leads the rows; the take-in's who factor is x1.5); the closet behind room 2's inner door is locked (kick DC 14) and empty. **Rules of the lane**: the muzzle flag needs the muzzle within 0.3 m of the #2 within 5 m, rifle in hand and not at high ready (**neither at high ready nor at low ready** after v0.0.12, the fixer's `SWEEP_SAFE`; the 3-D capsule from the rework, §25.19.3.5), for 300 ms at once with the #2 standing still, once a room; aiming at the #2 or the instructor stops the lane; the funnel fault (`FUNNEL_M` 0.5, `THRESHOLD_M` 0.3) counts your feet stopped in the doorway, never a walk through; `SECTOR_HALF_DEG` 20, `NEAR_M` 0.6; a "Clear!" is void if it overlapped a take-in window, if a man turned less than 1 s ago has not been seen, if a door- or zone-triggered turner has met its trigger but not turned, or, in the hall, if its zone has not been reached; the #2's "Clear!" never ends a room, only yours; rooms cleared by a setup show "SET UP" on the run sheet; a lane whose hall was passed ends with why `passed`; a running bundle is handed back at the lane's end (`lane-end`). **Never a dead end**: after 60 s with no progress the instructor says "Move on."; 30 s later the room moves on with a time fault; the lane has 10 minutes (`STALL_MS`, `LANE_MAX_MS`); the hot wash runs `WASH_MS` behind the brief splash with the take-in bars and the instructor's lines, no camera frames, and its advice reads your corner's men only. The take-in's light factor comes from the light level at the target: lit rooms and the 25 m bay by day read x1 (the pins hold), room 3's dim fill 0.40 gives -2 on the shot and x1.13 on the take-in. Moving shots: -4 walking in Combat (-2 from Marksmanship 15); in Assault, from rung 2 and within 10 m, the penalty is mitigated (-8, MRK, 30, 0.25); below rung 2 Assault's shot rows plant first. Test sheets' clean repetitions never count up; the career player's drills record and its upgrade wait for the MOUT day's join. **Setups** (`&setup=`, `debug.js` `SETUPS`): `go`, `room:2`, `room:3`, `hall`, `contact`; none starts at the brief, before LOAD. `ref` (§25.5.1's reference room) is a fill setup for the tests (`createGame`, `HOUSE_SETUPS`), not taken from the URL. **Open for a decision** (a perception rule, not this round's): the player's eye cone follows the cardinal facing (`eyeOf` with `PLAYER_AWARENESS` 5, a 55 degree half-cone), so a Q+Z walk-in from facing left keeps the far-left man out of the cone until 2.4 m along the path and counts 1a "behind you" (x1.3): the private's keys sighting comes at 6.85 s rather than the table's 6.40; bundles face into the room and avoid it. Whether a #2-slot man joining #1's window should keep #1's expectation was weighed and left as the settled "slowest expectation" (§25.4.5). The funnel fault stays common for the private by the keys (about one a room: he stops at his take-in's brake, as §25.5.2 has him; the Watch is the decision that keeps his feet going; with the stopped-feet rule the sergeant's are 35 in 100 seeds and the tier one's 25), left as balance for the user's score.

### 25.11 The interface

- **The panel at the stack, by hand** (in stop motion; the door's rows are new, since R offers nothing in stop motion):
  ```
  1 Stack on the door · 5.6 s               6 Watch: a corner … · 0.8 s
  2 Open the door · 0.6 s                    7 Flashbang · 2.6 s (1 flashbang)
  3 Kick it · 1.2 s · 70% (Fitness)          8 Read the door · 0.7 s (hinge, swing, locked)
  4 Slice the pie · 0.5 s each 15°           A W stance · V posture
  5 Combat ⇄ Assault                         X  go: the clock runs, the keys move you
  ```
- **With a bundle** (rung 2 and up) the bundle leads like a Corps command, its beats as dots grouped by channel, a seam drawn as a bar where the rung stops, its options as rows set at no time: "T CLEAR IT · 4.0 S ● ● ● │ ● ● ● (stack · open · cross · sweep · clear)"; "Cross ⇄ Hook"; "Open ⇄ Kick"; "Flashbang first ☐ · +2.6 s · 1 flashbang"; "Assault ⇄ Combat"; the singles still below. Taught but not yet lived, the bundle shows struck once, "by hand first".
- **At a contact**: the person bracketed (pale) and the plaque saying what the marine took in ("RIFLE · 4.4 M · BODY 95% HEAD 75%"); the rows of §25.4.6 ("1 Pair · 0.12 + 0.58 s · 95% 95%", "2 Failure drill · 0.60 s", "3 Pair, moving on · −2", "4 Hold him", "5 Challenge · 1.2 s", "6 Carry on: the room · 1.6 s").
- **The running bundle** is shown alone as a running macro is (VIEWS §7.4), with short lanes of glyph ticks, **FEET, HANDS, EYES** and VOICE (✓ passed, ◦ routine, ✗ fumbled, · to come) and a bar of its time on the game clock, so "smoother" is seen: the recruit's ticks fill one lane at a time, the operator's together.
- **The take-in made visible** (the play proposal; both judges): hollow amber corner brackets (VIEWS §7.4's 3 px arms) appear round the person at three times the figure's box on the sighting tick and close onto it over the window, no words, no sound. **At the pause** they snap to the panel's pale bracket; **a stamp** over the figure in the picture's 3 × 5 alphabet, "0.80 S", amber from 0.5 s and pale below, for 2.5 s; the plaque leads "CONTACT · TAKEN IN 0.80 S" with a thin strip under it ticked every 0.1 s and filled to the take-in (the systems proposal), so 0.80 and 0.05 differ at a glance. The hover card gives the take-in's parts, as it gives a shot's modifiers.
- **The log** (J), the take-in's sum like a roll's: "Contact: a man-target, far left, 4.4 m: a rifle. Taken in in 0.80 s: 0.54 (Warfighting 15) × 1.5 (a room you are clearing); Awareness 12 + 6 = 18 against 8, noticed. Your feet stopped in the doorway; he turned to face you." For a tier one: "Taken in in 0.05 s: 0.03 (Warfighting 93) × 1 (your sector)." A bundle's beats each have their line, as a macro's sub-steps do.
- **The keys**: no new key. T, the line (one step, a group, the room, the house); the digits, the rows; **X, the built toggle** ("game unpaused with X", the user's own words), so VIEWS §10.2's design row "X get down behind the nearest cover; X held leaves the mode" is withdrawn (cover is a row, getting down is W); **Backspace** stops a bundle after its beat; **Space** pauses everywhere, the window included; Esc the menu.

**As built in v0.0.12** (VIEWS §7.4, §10, §11). The drill's and the door's rows lead the panel (`FIXED_KINDS`); on the house's lane the struck Fire and Aim and the idle commands (UNLOAD, a Top up with nothing to gain) page last, so at GO the stack, the door and the Watches hold the first keys. A bundle's row shows its beats as dots grouped by channel (at most 6 between seams), the running bundle its four lanes and a time bar, the instinct line "T: <row> · <s>"; the corners' ticks on the floor, pale until covered; the lane timer in the PAPER (tenths running, hundredths stopped, the par counting down); the hot spots are named from the door (`HOT_NEAR_M` 1.5, `HOT_AHEAD_M` 0.3); a stand is drawn only once seen, and in the house nothing is bracketed until a man is seen. At a pause the bracket goes to your own corner's man first, the #2's after, and the move keys in stop motion never bracket the #2 or the instructor. The HUD plates beside a turner go to the side clear of the other turners (house only). The brief names the deck's gravity from where you stand ("Full G here: your kit weighs what it weighs on Earth."; 0.38 G under `&env=mars-datum`, held within `GRAVITY_FULL_TOL_G` 0.02) and the card's head says "AT 1 G".

**Designed 2026-11-11 (the user's note on v0.0.12)**: the panel is regrouped by type, with the core actions on fixed keys and greyed when off, in three layouts for the user to score (VIEWS §7.8); the running bundle's lanes and dots stay.

### 25.12 State, modules and the tick

**State** (additive; no `SAVE_SCHEMA` bump; `upgradeState` fills the player's `drills` from the summary paper):
- `state.mind.contact` (§25.4.8), through PEOPLE's accessors.
- `person.skills.drills = { room: { rung: 1, reps: 7, lived: ['room:stack', 'room:open'], atMs }, passage: { rung: 1, reps: 0, lived: [] } }` (SKILLS §15.1); NPCs read theirs from the template, written nowhere.
- A running bundle is one step in `state.stop.doing`, as a macro is: `{ step: 'drill:room:clear', kind: 'bundle', slot: 1, rung: 3, door: 'x4.d3', variant: { breach: 'open', entry: 'cross', flash: false, stance: 'assault' }, beats: [{ id, k, ch, ms, after }], lanes: { feet, hands, eyes, voice }, subs: [/* rolled records */], fromMs, untilMs }`.
- `state.$rooms`, the room plans: runtime, rebuilt on load.

**Modules** (each with its prose header):

| Module | New or changed | What |
|---|---|---|
| `src/sim/combat/react.js` | new | `takeInMs`, `coreMs`, `EXPECT`, `expectOf`, `goMs`; the one home of the quantity (checked) |
| `src/sim/combat/contact.js` | new | the detector (`look`), the window and the pause (`input`), the identification, `contactNow(state)` for the HUD |
| `src/sim/combat/stepper.js` | new (moved out of `shooting.js` after v0.0.6) | beats, channels, dependencies, seams, the queue; `shooting.js` keeps the rifle's sub-kinds, `stepsOf` and the mode |
| `src/sim/combat/bundle.js` | new | a bundle's row for a slot and a rung (beats, seams, channels, time, odds), its run through the stepper, the rest queued on a cut |
| `src/sim/combat/drills/enter-and-clear.js` | new (data, §7.7's place) | §25.7.2; later `clear-passage.js`, `hatch.js`, `void.js` |
| `src/sim/combat/room.js` | new | `roomPlanOf`; the authored X4 plans now, the derivation from 0.3 |
| `src/sim/combat/steps.js` | changed | the new steps' times: `move` (BODY's speeds and braking), `scan`, `door`, `call`, `watch` |
| `src/sim/arms/specials.js` | new | the shot rows: gates, relevance, splits, climbs, the assessment |
| `src/sim/arms/shot.js`, `shooting.js`, `drills.js` | changed | the controlled climb, the paced hammer split, the stance's moving modifier, the sector aim's term; `stepsOf` gains the contact's, the door's and the bundle's rows; `tap()` retired (§24, question 9; done in v0.0.8); the reloads' purpose labels |
| `src/sim/skills/templates.js`, `skills.js` | changed | the recruit, recon, Raider and tier-one rows (SKILLS §11.1); rung defaults by tier; `rungOf` |
| `src/sim/skills/instinct/cqb.js` | new | §25.8.3's rules |
| `src/sim/body/motion.js` | changed | `gaitSpeeds({ …, stance })` |
| `src/sim/people/perception.js`, `mind.js` | changed | the player's Awareness from the sheet (`PLAYER_AWARENESS` 5 goes); `noteContact`, `contactOf` |
| `src/sim/scenarios/pairs.js`, `shoothouse.js`; `src/data/places/x4*.js` | new | the scenes; X4's layouts, doors, targets, spots and plans |

**As built in v0.0.8**: new `src/sim/combat/react.js` (the one helper of the take-in, `takeInWords` its one formatter; the syntax test's `REACT_HOME` keeps any take-in or reaction delay out of every other module), `src/sim/combat/contact.js` (the detector in the people domain's fast `look`, the window's end in its `input`; `refusesAct`, `feetOf`, the identification, the contact's rows, `lullOf`, `contactNow`), `src/sim/people/mind.js` (PEOPLE §8.8's accessors; `perception.js` keeps `PLAYER_AWARENESS` until 0.0.10), `src/sim/arms/turners.js` (a turner's record and its facing as a closed form), `src/sim/arms/specials.js`, `src/sim/scenarios/pairs.js`, `src/sim/skills/instinct/pairs.js`; changed `shot.js`, `paper.js`, `shooting.js` (`tap()` removed), `drills.js`, `templates.js`, `move.js` (the feet), `handling.js` (the pairs course), `game.js` (the act gate, `ffTick`). The stepper, the bundles, the rooms, `instinct/cqb.js` and the stances wait for `test-shoothouse`; `drills` on the sheet is `{ room: { rung }, passage: { rung } }` on a test sheet only.

**The tick** (TECH §3.1's layers):

| Layer | What close quarters does there |
|---|---|
| `input` (runs while held) | with a contact pending: refuse every input but Space and Esc; feed the feet (the held vector to the go, then the brake, or the bundle's path); at `clock ≥ untilMs`: end the window, enter stop motion with the contact, hold `'stop'`; the stepper's beat boundaries |
| `player` | a `move` beat sets the position from its closed-form speed profile at the clock |
| `look` | the detector: people and targets newly at `SEEN`, the notice roll, `takeInMs`, the pending record; NPC fighters' perception at §19's cadence with their own take-in |
| `think` | NPC slots start their beats on their cues (#2 on #1's crossing) |
| `rules` | the stepper's aim turn and facing (`stopRules`); shots resolve as now |
| `offers` (while held) | the CQB rules; the panel's rows |

**Performance** (my estimates, the systems proposal's): the detector over people and targets in PLACES's bins within 54 m, `sightOf` only on those not yet known, at most 0.04 ms in the shoot house and 0.15 ms in `village-contact`; NPC take-ins once per new threat per fighter; the stepper about 0.01 ms a running bundle; the panel's rows cached by door and rung; X4's plans about 15 ms once at load. All inside COMBAT's 0.8 ms share of the 2 ms tick (§19).

**As built in v0.0.12**: the movement stance is `actor.moveStance` (`'relaxed' | 'combat' | 'assault'`), not `actor.gait`, which already holds the walk animation (`'idle' | 'walk' | 'run'`; the build sheet's §3.1 named the wrong field and is corrected here); absent reads as Relaxed. `actor.watch` holds the Watch; `state.stop.carry`, `.feet` and `.variant` hold a bundle's state in stop motion; `R.house` is the lane's record (`.asked`, `.broken`, `.read`, `.two.pid`). Beat records are named by `key`. New facts: `bundle` (`phase`: start, beat, seam, halt, end) and `gait` (`who`, `from`, `to`, `atMs`), and the `house` fact (`phase`: stacked and the rest; the #2's stack is heard through his "Ready." `say` fact, so he has no `stacked` fact of his own, my call). New action prefixes `gait` (V) and `drill` (Backspace: `drill:stop` ends a bundle after its beat) route to `weapons` in `game-domains`. The `Carry on` row has `carry: true`, id `drill:carry`; the new `stepsOf` row kinds are `bundle`, `door`, `watch`, `look`, `move`, `call`, `mark`, `gait` and `variant`; `bundleNow(state, pid)` gives the running bundle's lanes. `newGame` and `createGame` pass a `par` to the fill. After `runSlot` the scene sets the #2's `face` from his head, which perception reads. Turner stands are not nav blockers yet (walkers pass through them): a `kdTurner` kind in `fixtures.js` `CATALOGUE` with the kit's `FOOTPRINTS` would make them so (later round).

### 25.13 Tests (each prints its numbers)

| Test | Prints | Fails when |
|---|---|---|
| `combat-takein` | §25.4.3's two tables from the code, by tier, expectation and factor; the `alert` column beside §3.2's old figures | the private in a room under 800 ms on a passed roll; the tier one over 50 ms in his sector or a room on a passed roll; a surprise under 250 ms or an alert under 150 for anyone; a natural 1 costing more than ×1.5 where a 2 would pass; not monotonic in Warfighting; any module but `react.js` defining a reaction delay |
| `combat-contact` | a scripted room: the sighting's tick, the pause's tick, the inputs refused between, the metres the feet carried (brake or carry on), the identification | the pause off `seenMs + takeInMs` by a tick; any input but Space or Esc acted on in the window; a save in the window loading to another digest or tick; **the first round ever earlier than the sighting + 0.15 s + the aim** (the body's floor) |
| `combat-stepper` | v0.0.5's macros through the new engine; a bundle's lanes by rung | any v0.0.5 step's lived ms or digest changed (`scene-handling` byte for byte) |
| `combat-bundle` | each rung's rows, beats, seams and times; a failed kick and "Carry on"; a locked door's variants | a bundle firing, spending an unnamed consumable, entering a room off the plan or going past a contact; a bundle offered before it was lived; **T doing the walk in at rung 0 or 1** |
| `combat-rooms` | X4's 8 rooms × 3 layouts: points, sectors, dead cells, path lengths; their golden hash | a point outside its polygon or within 0.4 m of a wall; corners and sectors seeing under 98% of the floor's cells |
| `arms-specials` | §25.6.2's and §25.6.3's tables from the code | a row offered under its gate or out of its range; the failure drill's third round fired on a man down |
| `arms-reloads` | the purposes offered by situation; eyes up against heads down's expectation drop | a reload done unasked |
| `body-stances` | the three stances' speeds by gravity and load; the seam's `v / a` | |
| `instinct-cqb` | each rule's firing in scripted states; T's act by rung; the voice from rung 3 | T's act ever a shot |
| `combat-race` (heavy) | §25.5.5 with the dice: who fires first, who hits first, who is stopped, by sheet, method (by the keys, Watch, bundle, slice, flash) and defender | |
| `scene-pairs` (heavy, the page) | each sheet's strings: the take-ins, the paper's figures, the brackets drawn | page errors; a frame over 25 ms at the pause |
| `scene-shoothouse` (heavy) | **the CQB bot** (`tests/bots/cqb.mjs`) on lane A (B and C when built), 100 seeds, at three levels: the private by the keys (rung 1, a seeded human start of 0.3 to 0.8 s and a line 10% long), the sergeant by T (rung 3), the tier one by T (rung 4). Per level: the lane's game time (mean, p5, p95) and each room's; the take-in by expectation; the sighting to the first round; rounds, hits, A-zone share; no-shoots hit; presses per room and the share about a person or an unplanned door; seconds in doorways; faults; a real-minutes estimate | the tier one's lane not at least 1.5 times as quick as the private's; T ever firing; take-ins out of §25.4.3's bands; one seed's two runs differing in digest; **presses in a room below the persons seen + 1, or under half about a person or a door at rungs 3 and 4** (the guard against press-T-to-win, the play proposal) |
| `browser` (heavy) | a lane through the real page: the brackets, the stamp and the strip at the pause, the running view's lanes | page errors; a frame over 25 ms at the pause |

**Designed 2026-11-11 (the user's note on v0.0.12)**: "flawless" is §25.19.8's criteria F1 to F24 over an honest bot that presses only T and the shot the line names; `scene-shoothouse`'s press guard stays.

### 25.14 Build order

ROADMAP's rows name an order, not a release (CONTRACTS §18).

| When | What | Why there |
|---|---|---|
| **v0.0.6** | nothing of close quarters | v0.0.6 changes `shooting.js` and `drills.js`; the stepper waits for its merge |
| **`test-range`** (ROADMAP §4.2's 0.0.7 row, done in v0.0.7) | `gunner.js` (NPCs fire), penetration on steel | the race needs NPC shooters |
| **`test-pairs`**, a new Stage B row right after `test-range`: **done in v0.0.8** (ROADMAP §4.2's 0.0.7b row) | `react.js`; `contact.js` on targets (via `sightOf`); the shot rows and parts; the tap retired (the user agreed, 2026-11-07); the reloads' purposes; turners as range pieces; the 7 m and 10 m lines; the test sheets and the sheet picker | the pause's feel scored alone, before anything depends on it |
| **`test-talk`** (0.0.10) | the player's sightings in the sim's `look`; Awareness from the sheet | the detector moves onto them |
| **0.0.7d, `test-shoothouse`** (moved from 0.1.x on 2026-11-08, ROADMAP §4.2: the next scene after `test-stress`, at 1 G in the Wheel's house 1; its gravity `spin` and BODY's 1 G gaits with it) | the stepper and its channels; `bundle.js`, `enter-and-clear.js`, the room family's slots 1 and 2; rungs, reps and lived on the sheet and the templates; the door rows and `swing`; Combat and Assault; X4 at its place with layout A, its authored plans, targets and turners; the instructor, the run sheet, the hot wash; `instinct/cqb.js`; the sheet picker | one core loop (ROADMAP §2.1): the room; no NPC brain needed; the scene the stances wait for |
| 0.1.x, with `test-patrol`'s join | NPC teammates and defenders on the bundles and `takeInMs` (§3.2's formula retired); slots 3 and 4; the MRX's rehearsal and dawn cordon and search; the MOUT day's shoot-house morning | the fighter and team brains arrive here |
| 0.2 | the `passage` family: the voyage's passageway drills | |
| 0.3 | live rooms at `danger` and `fire`; room plans derived from polygons; the flash variant where the Accord allows | Europa's buildings |
| **0.0.7e, `test-zerocqb`** (moved from 0.5 on 2026-11-08, ROADMAP §4.2) | `void`'s first beats in the Wreck at micro-g (§14.8: the anchors, six faces, hold to hold, feet aft); BODY §16.6's push-offs, grabs and mag boots; WEAPONS §7.8's anchors on the R-7 frangible and the V-5 | the user's order: ship close quarters next |
| 0.5 | `hatch` and the rest of `void` (the Hulk at 1 G, the boarding scenes); ram and charge; the sidearm and the transition; the boarding and breacher floors | |
| 0.7 | rung 4 by the ITC; `test-hostage`; the tier-one template for NPCs | |

**Designed 2026-11-11 (the user's note on v0.0.12)**: the shoot house's rework (§25.19.10's stages R1 to R9) comes before every other row; the sidearm and the transition move from 0.5 into it.

### 25.15 Risks

| Risk | What holds it |
|---|---|
| **The window reads as lag** | the brackets close round the person, the stamp names the time, the log explains it factor by factor, the line's lead says "Contact · 0.80 s."; `test-pairs` scores it first, alone; the fallbacks are the user's to pick (§24, question 11) |
| **T plays the game for you** | a bundle stops at every person, every unplanned door, the gun and every failed roll that matters, and never fires, spends, picks or reloads; the bot fails on presses about nobody |
| **Tedium for the recruit** | rooms are few early (the MRX, a lane), the by-hand room is a small tactical puzzle (the Watch, the slice, the bang), about a minute of real time; two shoot-house blocks give rung 2, lived or skipped |
| **The race is harsh** | doctrine as in life; the generator rarely aims a defender at the very door; training scores tones; the new man is #3 or #4 |
| **"Sub 0.1 s" below human reaction** | the round still leaves at a human time (0.30 s for the tier one), the surprise floor, the body-floor test |
| **The d20 saturates at room range** | the armour, the turners, the live room's modifiers, the head rows and the A-zone by margin carry the rest; a man-target's vital zone +2 is the lever if the user finds the shots flat |
| **The stepper's extraction** | after v0.0.6 merges, guarded by `scene-handling` and the scored scene byte for byte |
| **Scope** | one scene, one loop; the pieces enter in the order the scenes need them (§25.14) |
| **Performance** | the take-in runs on a sighting, an event, never a per-tick pass; inside COMBAT's share (§25.12) |

### 25.16 Open questions for the user

Five, asked of the user on 2026-11-07, are §24's items 9 to 13, **all answered the same day with their defaults** (the user, 2026-11-07: "All good defaults"): the double and triple tap as rows (9); the tier one past 1.0, the Raider the career's top (10); the feet during the take-in (11); "under 0.1 s" where it is expected, with a floor for a true surprise (12); a first room at Argyre (13). Two more were raised by v0.0.8's reviews, §24's items 14 and 15, each with its default until the user answers: whether time is enough for the shots aspect when the d20 saturates (14), answered by the user the same day (DESIGN.md's log); a turn in the lull (15), restated plainly after the user asked what it meant. Eight more came with §5's redesign (§24's items 16 to 23), each with its default. Four came with the shoot house's rework, 2026-11-11 (§25.19.11), each with its default.

### 25.17 Numbers and their sources

| Figure | Value | Source |
|---|---|---|
| simple visual reaction | about 0.18 to 0.25 s | Welford 1980, *Reaction Times* (COMBAT §3.2 already uses 0.25 s) |
| from a light to the trigger, officers who knew what to expect; with a shoot-or-not choice | about 0.31 s; about 0.56 s | Lewinski and Hudson, the Force Science Institute's Tempe study (published as Dysterheft, Hudson and Lewinski 2014), read from secondary accounts (Police1, Lexipol): to check against the paper |
| a start under 0.100 s is false | the reading of "sub .1 s" | World Athletics' start rule |
| choice reaction grows with the log of the alternatives | `EXPECT`, `severalK` | Hick 1952; Hyman 1953 |
| reaction slows as the stimulus dims | `lightK` | Piéron 1914 |
| sleep loss slows reaction and multiplies lapses | `bodyK` | Lim and Dinges 2008; Van Dongen and Dinges 2005 |
| practice pays fastest early | the quadratic core | the power law of practice, Newell and Rosenbloom 1981 |
| room clearing: the stack, the entries, points of domination, sectors; surprise, speed, controlled violence | §25.5, §25.7 | FM 3-06.11 (2002), ch. 3; Battle Drill 6, FM 3-21.8 (2007); MCWP 3-35.3 (1998) |
| crawl, walk, run | §25.10 | FM 7-0 |
| the failure drill | two to the chest, one to the head; failure-to-stop strings in the Corps' Table 2 (three rounds in 5 s at 25 yards, and a moving string from 25 to 15 yards) | MARADMIN, the FY07 combat marksmanship update; TECOM's FY21 institutional marksmanship brief; Mike Rousseau's account, taught by Jeff Cooper (Shooting Illustrated, 2017) |
| controlled and hammer splits | controlled about 0.30 s with minimal practice, 0.45 to 0.80 s across a match's distances; a hammer about half that (pistol figures) | SSUSA, "Controlled Pairs or Double Taps?" (2016); USCCA's drill guide |
| a trained and an expert speed reload | 2.5 s and 1.6 s | WEAPONS §5.2 |
| a flashbang's effects | the startle `U(1.5, 3) s × (1 − H / 100)²`, the flash 5 s, the chaos 60 (redesigned 2026-11-07; the M84 disorients for about 5 s) | §5.7, §11.4, §5.10 |
| Mars gaits and grip | walk 1.14, run 2.69 m/s, the lope from 1.33; μ 0.6, 2.24 m/s² | BODY §16.1, §16.2; PLACES §2.7 |
| everything else | | my calls and the proposals' calls kept, computed by the round's scratch script (§25's opening) |

### 25.18 Suppression and hardening in the room

Written 2026-11-07 with §5's redesign, for the user's words of that day (DESIGN.md's log): at room range, calm, "almost no trained marine in real life would miss when coming in straight to shoot someone so it's ok that only speed changes"; in the chaos, "performance should drop more sharply for a recruit than a battle hardened over-trained operator"; and "The whole point of high kinetic action (flashbangs etc) on entry is that the enemy would be highly suppressed as the entry team comes in, giving the entry team serious time to pick every enemy off." Tables marked **[computed]** come from §5's script (`merged.mjs`, tables T11 to T14); "(my call)" marks the design's own decisions.

#### 25.18.1 Where the take-in, the rows and the hands meet the chaos

- **The take-in** reads felt's band (§25.4.2's `SUPP_MS` 200 a band, built; `contact.js` passes `bandOf(felt)` where it passes 0 today). §25.4.2's "added, so suppression slows the best as much as the worst (a pinned tier one 0.65 s)" is **withdrawn** by the user's rule: noise alone cannot pin a tier one (the most that reaches him is 25, under fire), so in his sector he takes 0.25 s at worst; a pinned recruit takes 1.55 s in a room he is clearing.
- **The rows** (§25.6): each round with the felt modifier, each part × `suppTimeK(felt)`, and the row's odds on the panel are the roll's. A row whose odds the chaos has cut below 70% is **marked "! shaking"** (a boot recruit's Fire under three bangs: "Fire · 0.70 s · 45% ! shaking"; §3's marked row, never struck: pillar 3, the player chooses what to try; the doctrine proposal's, my call). "Routine" never shows under fire.
- **The hands** (WEAPONS §5): Off safe, the reloads by purpose, the stoppage drills are each rolled with the modifier, and a failure costs its ×1.6 and its ladder (§5.8's anchors). **As built in v0.0.9** (the user's "likely to fail simple actions like thumbing safety off" read literally, my call): a biting `miss` on a selector move (Safe, Off safe, Auto) leaves the lever where it was: the slow time (×1.6), the chain halted, "Your thumb slipped off the lever: still on safe."; a drop or worse as before (WEAPONS §5.4). Routine is lost as the modifier eats the margin.
- **The bundles** (§25.7): a startle halts a running bundle at the end of its current beat's sub-step, the rest queued as "Carry on: …"; each beat's hands and eyes take `suppTimeK`; the feet are not slowed. Your own team's bang in a bundle's beat is prepared (×0.25, no startle, no flash).
- **"Only speed changes"** holds where the user put it: calm, felt 0, nothing in this chapter touches a hit (§25.6.3); the gulf between the recruit and the tier one under chaos is in the hands, the odds and the time.

#### 25.18.2 The bang's window, and what it buys [computed]

**Under the user's overrule of question 6 (2026-11-07; built in v0.0.9, `combat-race`)**: the UN's line infantry, MSS tactical and enemy special forces wear combat EVA suits (a filtered visor, sound filtering at `EARPRO_K`: never blinded or deafened, the bang's points ×0.6); insurgents are unsuited. The tables below are as first computed, with only MSS tactical and special forces visored and the UN Marine unsuited; **the overrule's print follows them** and is the one that stands. In the room the man in utilities facing the bang is at pool 60, felt 54, blind, deaf 4.61 h; the suited one at pool 36, felt 24, no flash, not deafened.

The reference room (§25.5.1): the defender 4.4 m from the threshold, both seeing each other on the same tick, 4,000 seeded runs a cell, on the built helpers (`takeInOf`, `aimS` with the rifle's sight ×1.2 and turn ×0.8, the SO-4 at 1×; a held sector aim a quarter of the sight term, §25.5.4's designed "sector aim"). The team's flashbang goes off 1 s before the first man is seen; the marines are prepared. The defender runs §7.11.

**What the bang buys: the defender's first aimed round after he could first see the marine** (s, median), without | with the bang, and the difference [T11]:

| Defender (H; visor) | aimed at the door | alert elsewhere | surprised |
|---|---|---|---|
| insurgent cell member (8; none) | 0.75 → 5.15: **+4.40** | 3.49 → 4.25: +0.76 | 4.40 → 3.70: −0.70 |
| insurgent veteran (27; none) | 0.50 → 4.70: **+4.20** | 2.62 → 2.15: −0.47 | 3.22 → 2.05: −1.17 |
| UN Marine, line (28; none) | 0.55 → 4.75: **+4.20** | 2.65 → 2.00: −0.65 | 3.28 → 1.90: −1.38 |
| MSS tactical (39; filtered visor) | 0.40 → 1.30: +0.90 | 2.24 → 1.30: −0.94 | 2.71 → 1.30: −1.41 |
| enemy special forces (82; filtered visor) | 0.20 → 0.20: 0 | 1.08 → 0.20: −0.88 | 1.31 → 0.20: −1.11 |

**The race: how often the marine fires first** (or the defender never fires an aimed round at him), no bang → the team's bang; aimed at the door / alert / surprised [T12]:

| Marine (sighting to first round, no bang) | insurgent cell member | insurgent veteran | UN Marine, line | MSS tactical | enemy special forces |
|---|---|---|---|---|---|
| private, by the keys (2.22 s) | 0→**100** / 100→100 / 100→100 | 0→82 / 100→45 / 100→37 | 0→**80** / 100→41 / 100→30 | 0→0 / 95→0 / 100→0 | 0→0 / 0→0 / 0→0 |
| private, Watch set (1.54) | 2→100 / 100→100 / 100→100 | 0→91 / 100→72 / 100→69 | 0→90 / 100→70 / 100→64 | 0→49 / 98→49 / 100→49 | 0→0 / 49→0 / 50→0 |
| corporal, rung 2 (1.35) | 32→100 / 100→100 / 100→100 | 1→96 / 100→87 / 100→86 | 1→93 / 100→82 / 100→78 | 0→33 / 100→33 / 100→33 | 0→0 / 32→0 / 34→0 |
| sergeant, rung 3 (0.98) | 51→100 / 100→100 / 100→100 | 3→100 / 100→100 / 100→100 | 47→98 / 100→95 / 100→95 | 0→62 / 100→62 / 100→61 | 0→0 / 50→0 / 49→0 |
| Raider, rung 4 (0.66) | 52→100 / 100→100 / 100→100 | 50→100 / 100→100 / 100→100 | 51→100 / 100→100 / 100→100 | 49→100 / 100→100 / 100→100 | 0→0 / 100→0 / 100→0 |
| tier one, rung 4 (0.52) | 53→100 / 100→100 / 100→100 | 50→100 / 100→100 / 100→100 | 51→100 / 100→100 / 100→100 | 51→100 / 100→100 / 100→100 | 0→0 / 100→0 / 100→0 |

**The window: the bang this long before the first man is seen, the defender aimed at the door** [T13]:

| Marine against | 0.5 s | 1 s | 2 s | 3 s | 5 s | 8 s |
|---|---|---|---|---|---|---|
| private by the keys, insurgent cell member | 100% | 100% | 91% | 86% | 0% | 0% |
| private by the keys, UN Marine | 90% | 81% | 81% | 80% | 0% | 0% |
| private by the keys, MSS tactical | 0% | 0% | 0% | 0% | 0% | 0% |
| sergeant, rung 3, insurgent cell member | 100% | 100% | 99% | 94% | 55% | 50% |
| sergeant, rung 3, UN Marine | 100% | 99% | 90% | 90% | 49% | 47% |
| sergeant, rung 3, MSS tactical | 100% | 63% | 48% | 0% | 0% | 0% |

**What it teaches, as doctrine does** (FM 3-06.11's surprise, speed and violence of action):
- **Against a man waiting for you, unhardened and without a filtered visor, the bang is the entry's whole point** (the unsuited only, after the overrule above): the user's "serious time", **four to four and a half seconds** in which a private by the keys, who loses every such door without it, now fires first on an aimed insurgent every time (and, as first computed with the Marine unsuited, on an aimed UN Marine four times in five: no longer, he is suited). Most of it is the flash (5 s blind for a man facing the door) and the startle that knocks his aim off it; the rest is the chaos in his hands.
- **The window closes**: the flash lasts 5 s from the bang, so an entry 5 s late has thrown it away, and against the visored the window is the startle's alone, about a second. Hence the instructor's **"On the bang! Go!"** and the run sheet's fault **"BANG TO ENTRY 2.4 S: you gave them back the bang"** past `BANG_LATE_MS` 2,000 (the doctrine proposal's, my call).
- **The bang is a doorbell** to a man who was not waiting: the noise turns him to the door (§7.11's cue, the user's "when we crash in with a lot of noise, they would turn towards us"), so against alert or surprised professionals it gives back the surprise it spends, and against the hardened in filtered visors it buys nothing. There the doctrine is the quiet entry, the slice or a concussion charge (§25.5.6); the sergeant and up still win those doors on their own speed.
- **Settled in v0.0.9: the no-bang race.** `combat-race` reprinted §25.5.5 from the built helpers (the tier one against an aimed insurgent 53%, the sergeant against an aimed UN Marine 47%; no helper changed), and the cells above are its print.

**The overrule's print (v0.0.9, `combat-race`; the UN Marine in a combat EVA suit: visor and ears)**. T11, the defender's first aimed round, without → with the bang (s, median; nobody never fires): insurgent cell member 0.75 → 5.15 · 3.49 → 4.25 · 4.40 → 3.90; insurgent veteran 0.50 → 4.70 · 2.62 → 2.10 · 3.22 → 2.00; **UN Marine, line (H 28, suited) 0.55 → 0.55 · 2.65 → 0.55 · 3.28 → 0.55**; MSS tactical (H 39, suited) 0.40 → 0.40 · 2.24 → 0.40 · 2.71 → 0.40; enemy special forces 0.20 → 0.20 · 1.08 → 0.20 · 1.31 → 0.20 (the bang buys nothing against the suited, and a defender who was alert or surprised is turned to the door by the noise: a doorbell).

T12, the race, no bang → the team's bang, aimed / alert / surprised, against the insurgent cell member, the veteran, the UN Marine (suited), MSS tactical (suited) and special forces:

| Marine | insurgent cell member | insurgent veteran | **UN Marine, line (suited)** | MSS tactical (suited) | enemy special forces |
|---|---|---|---|---|---|
| private, by the keys | 0→100 / 100→100 / 100→100 | 0→82 / 100→45 / 100→37 | **0→0** / 100→0 / 100→0 | 0→0 / 95→0 / 100→0 | 0→0 / 0→0 / 0→0 |
| private, Watch set | 2→100 / 100→100 / 100→100 | 0→91 / 100→72 / 100→69 | 0→0 / 100→0 / 100→0 | 0→0 / 98→0 / 100→0 | 0→0 / 49→0 / 50→0 |
| corporal, rung 2 | 32→100 / 100→100 / 100→100 | 1→96 / 100→87 / 100→86 | 1→2 / 100→2 / 100→1 | 0→0 / 100→0 / 100→0 | 0→0 / 32→0 / 34→0 |
| sergeant, rung 3 | 51→100 / 100→100 / 100→100 | 3→100 / 100→100 / 100→100 | 47→47 / 100→47 / 100→49 | 0→0 / 100→0 / 100→0 | 0→0 / 50→0 / 49→0 |
| Raider, rung 4 | 52→100 / 100→100 / 100→100 | 50→100 / 100→100 / 100→100 | 51→50 / 100→50 / 100→51 | 49→49 / 100→49 / 100→47 | 0→0 / 100→0 / 100→0 |
| tier one, rung 4 | 53→100 / 100→100 / 100→100 | 50→100 / 100→100 / 100→100 | 51→49 / 100→49 / 100→49 | 51→50 / 100→50 / 100→51 | 0→0 / 100→0 / 100→0 |

T13, the window (the bang this long before the first man is seen, the defender aimed at the door; 0.5 / 1 / 2 / 3 / 5 / 8 s): the private by the keys against an insurgent cell member 100 / 100 / 91 / 86 / 0 / 0%, **against a suited UN Marine 0% throughout** (was 90 / 81 / 81 / 80 / 0 / 0), against MSS tactical 0%; the sergeant against an insurgent cell member 100 / 100 / 99 / 94 / 55 / 50%, **against a suited UN Marine 48 / 47 / 48 / 47 / 48 / 48%** (the no-bang race: the bang changes nothing), against MSS tactical 0%. **Nobody is over 0% against enemy special forces with or without the bang.**

**What changes in the teaching**: the bang is the entry's whole point only against the unsuited (an insurgent cell, pirates, security, the miners): a private by the keys then fires first every time on an aimed insurgent (0 → 100%) and on no aimed suited man (0 → 0%). Against a superpower's own line the answer is the quiet entry, the slice and the speed of the rung, as the doctrine has it.

#### 25.18.3 The scenes

**`test-pairs&setup=bangs` "Three bangs"** (0.0.7c's first patch; the systems proposal's cheap anchor, scored before anything depends on it; my calls):
- **What**: `test-pairs` as built, its kit and course, with one change: during string 1's standby the coach drops **three training bangs 1.5 m behind the line, 1 s apart**, with no ear defenders on (the setup's point is the user's case, so the scene says so on its start card: "Three bangs behind you, ears unprotected: the user's anchor"); the turner turns 2 s after the third. The rest of the course runs as built, the shooter deafened (a voice at the shoulder still heard) and the felt pool draining as he works. "Again as …" every sheet on the same seed.
- **Its numbers** [T14]: from the turn to the first round, the boot recruit 6.98 s on average (14.6 s at the 95th percentile; his Off safe failing at least once 55% of the time), the private 3.39 s, the corporal 1.89, the sergeant 1.65, the Raider 1.01, the tier one 0.61 s against 0.60 calm. Nobody is still startled at the turn: the recruit is in his own hands, failing.
- **Aspect scored**: `bangs`, "does the recruit's hand fail and the tier one's not, and does it read as the marine's, not as lag" (ROADMAP §2.2's score line, one aspect).
- **Needs**: `supp.js` (the pool, felt, the modifier, the startle and its window, the decay), `roll.js`'s one entry, `PRESSURE_MODS.fire` retired, `suppTimeK` on handling and the aim, `contact.js`'s band, the training bang as a range piece (its sound, its flash behind, its smoke puff), deafness's hearing factor, the FROZE stamp, the vignette and the sound's ducking by felt (VIEWS §7.3, §11.2). Not NPC choice, not the hit card.

**As built in v0.0.9** (`src/sim/scenarios/pairs.js`, `src/sim/skills/instinct/pairs.js`, `src/ui/hud/`; the build sheet `docs/build/0.0.9.md` §8 items 4, 5, 11, 18 to 22, §9, §10; each my call unless named; shipped as v0.0.9, "Three bangs", scene id `test-pairs-bangs`, `?play=test-pairs&setup=bangs` or the Tests menu's "Three bangs" with the picker opening on the Boot recruit and "Again as Tier one" the second half):
- **The bangs** (items 4 to 6): on string 1 (k 0, "string 1" counted as the user counts), 1 s apart, the first drawn 1.5 to 3.0 s into the armed standby on stream `pairs:bang`, the turn 2 s after the third; their spots 1.5 m behind the point, spread ±0.5 m by hash. **Once a run**: dropped and redrawn if the turn is disarmed before the first, kept on time after; a re-armed turn no earlier than 2 s after the third. **Unprepared**: the coach never says "Bang" (that would forewarn, ×0.6; his brief says noise). The setup takes the issue's ear defenders off (the `range-pairs` issue wears them: `protOf` would give ×0.6 and no deafness; deleting `kit.worn.ears` would leave an item held by nothing, so the fill does not issue them); utilities, no visor. The shooter faces downrange with his back to the bangs, so no flash-blindness (the white-out is built by geometry and shown only to a shooter facing a burst). A training bang has a flashbang's physics.
- **The plan** is `armoury.range.bangs { attempt, plan[{ key, i, x, z, fromX, fromZ, throwAtMs, atMs, done }], steps, froze, feltPeak, poolPeak, offSafe, lastStepMs, calm }`, the saved plan field `key` (CONTRACTS §9); the thrown body is the coach's, from his own post (`fromX`, `fromZ`), on a low arc. **`bangs-nodead`** (the scene test) forces five failed Off safes to prove the string never dead-ends.
- **On seed 48213**: the recruit's felt goes 53 → 83 → 98 at the three bangs, he freezes 2.55 s, takes in 1.25 s (0.65 calm), fails Off safe and fires his first round 4.60 s after the turn (2.60 calm); the tier one peaks at felt 10, freezes 0.05 s and fires 0.72 s after the turn (0.70 calm).
- **The paper and the card** (items 18 to 20, 22; the fixer's): the banged paper adds "BANGS 3 · FROZE 2.40 S · TURN TO PAUSE 1.25 · PAUSE TO FIRST 3.25 · OFF SAFE ✗ · SPLITS 0.70 · 1 A, 1 C" (the Off safe's tries ticked, a failed one red; **"OFF SAFE IN THE AIM" from rung 2**, where the row's aim takes the safe off); every calm paper is unchanged to the character. The end card's first round is **measured from the sighting** (the paper's TURN TO PAUSE + PAUSE TO FIRST, `seenToFirstMs`) against **the book's same sum** (the formula, no dice, on the game's tick boundaries; "First round after the turn, calm: by the book 2.60 s"), plus this session's own calm run on the seed and sheet only if the page remembers one. Each sheet's line gives "the chaos 105 − hardening H (word) = felt F, band"; **from the second sheet the session's list gives the bangs lines side by side**; "Again as …" leads with the hardening word (the picker labels "Hardening: green", the number on its hover, VIEWS §8.2). Turn to the first round (§5.8's T14) is timed from `turnAtMs` (item 19) beside it. The score line keeps ROADMAP §2.2's form with the scene id `test-pairs-bangs` and one aspect, `bangs` (item 22). **Esc in a test scene offers "End the scene: to its card"**.
- **The recruit's hand and the lull**: the RELOAD half of the user's anchor is `test-stress`'s (the turner during the RELOAD), not this scene's, whose bangs are over before the first reload; a fumbled Off safe leaves the lever on safe (§25.18.1), so the paper's ✗ matches the log. **The DI after the bangs** (SKILLS §14): silent through the startle; "You flinched. Everybody does. Your lane." only for a freeze of 0.3 s or more, never while a planned bang is due, "the first time" only for a green or settled hardening; at the pause, suppressed or pinned, on safe, below rung 2: "Thumb it off." T does Off safe, never the shot.
- **The smoke covers the coach** for a few seconds when the wind carries it over his post (drawn over the figures, dithered, a checker's half): physically right from above, left as it is (the integrator's).
- **Left for the user and for `test-stress`**: the RELOAD under the chaos, Breathe, the hit card, NPC choice; FROZE shows twice if the second startle ends just before the third bang (the stamp then reads the whole freeze 0.1 s later: honest); Windows (`play.cmd --dev`, `?bench=pairs-bangs`) not played.

**`test-stress` "Bang"** (0.0.7c's second patch; the doctrine proposal's scene; my calls):
- **The goal line**: "Five strings at 7 m with the coach's noise. Threats down."
- **Kit**: the R-7, three magazines (one of two rounds), **electronic ear defenders on** (the cadre's rule: the training form of a fight), safety glasses (no filtered visor); a coach with the shot timer, who throws reloadable training bangs onto the pad 2 m behind the line.
- **Strings** (each pool at the turn, felt (modifier) for the recruit, private, corporal, sergeant, Raider and tier one [T14]): (1) calm: 0 for all; (2) the din, an air horn and ten blanks fired by the coach beside your ear: pool 25: 18 (−2), 8 (−1), 0 for the rest; (3) one bang, called ("Bang out!", prepared): pool 9: 2, then 0; (4) **three bangs unannounced, 1 s apart, the turn 2 s after**: pool 79: 72 (−7), 62 (−6), 43 (−4), 34 (−3), 4 (0), 0; (5) the same on the short magazine: the dry, the RELOAD under the chaos, and a second turner turning 2 s into the reload (§24's question 15 answered here with a yes, my call). Then the lull and UNLOAD, SHOW CLEAR.
- **The paper** (the coach's timer, grown): "BANGS 3 · FROZE 1.95 S · TURN TO PAUSE 1.15 · PAUSE TO FIRST 3.20 · OFF SAFE ✗ ✓ · 1 A 1 C".
- **The end card**: "Private · 5 strings · froze 0 to 1.9 s · take-in 0.55 to 1.15 s · 2 fumbles, 1 drop · 12 A, 3 C, 2 miss", the hit card of each string's turner (VIEWS §7.7: its faces are paper and steel, the truth at once), this session's sheets a line each; **Breathe** on the panel from string 2.
- **Inoculation** (SKILLS §6.8): on a test sheet nothing is written (scenes never write a career); in the career the same strings at the stress course are exposures.
- **Aspects scored**: **the chaos** (do the bangs, the startle, the picture and the sound feel like chaos, and read as the marine's, not as lag), **the contrast** (does the tier one read as calm and the recruit as overwhelmed: the user's rule), **the hands** (do the fumbles read, and are they fair).
- **Needs**: the course data in `pairs.js`' family, the coach's beats, Breathe, the hit card on turners and the gallery's three hit-card samples (VIEWS §7.7), the inoculation counter on the sheet.

**As built in v0.0.10** (`src/sim/scenarios/stress.js`, `src/data/courses.js` `COURSES.stress`, `src/sim/skills/instinct/pairs.js`, `src/ui/hud/`, `src/ui/cards/stress.js`; the build sheet `docs/build/0.0.10.md` §8, §9, §10; shipped as v0.0.10, "Bang", scene id `test-stress`, `?play=test-stress&tier=…` or the Tests menu's "Bang" after "Three bangs", the picker opening on the Boot recruit; each my call, overrulable):
- **The engine** (item 2): test-stress runs on `pairs.js`' engine with `armoury.range.course = 'pairs'`; the presence of `armoury.range.stress` selects its strings, sequence and noise. About forty places read the pairs course, and every new hook is guarded by `R.stress`, so test-pairs and "Three bangs" run to the tick (`bangs-pin`).
- **Strings** (items 3, 7, 10): all five at 7 m with one threat each. (1) calm. (2) **the din**: an air horn (2 s, at the din's start and after the 10th and 20th blank) and **thirty blanks** from the coach's rifle at his hip, 0.8 m downrange of him by the left shoulder (the bay is in the open, so the blank's report is 2, not the indoor 4: ten blanks would not make a din), the **turn 8.5 to 10 s into it, after the second horn** (the design review: 6 to 8 s found the recruit still calm, felt 15 over 12 seeds). (3) **a called bang**, forewarned ("Bang!", 1 s before the throw; not "Bang out!" prepared). (4) **three bangs unannounced**, 1 s apart, 1.5 m behind (`PAIRS.bang`'s pad, not 2 m: the points are equal inside 5 m), the turn 2 s after the third. (5) **the same on the coach's one-round magazine** (one up the spout and one in it, not two: a Pair then always locks the bolt back, so the RELOAD under the chaos happens on every run), with **a second turner on another lane (alert, 23.2° off the muzzle) turning 1.5 to 2.5 s into the RELOAD**, or 10 s after the first turn if no RELOAD came, and the string's **time limit 20 s past the second turn** (never a dead end; `stress-nodead`). The noisy strings' turns come from their noise, the calm string's from its drawn gap. Streams `stress:pick`, `stress:din`, `stress:noise`, `stress:turn2`, `stress:gap`.
- **The coach's rest** (`COURSES.stress.restMs` **20 s**, not in the sheet; the scene role's): his "Stop" after a noisy string waits until 20 s have passed since his last noise, so the pool does not carry from string 4 into string 5 (without it the tier one was at felt 6 and the recruit about 83). Once the shooter stands as `pairsWant` wants him, with nothing running and no Breathe offered, the rest left (at least `REST_SKIP_MIN_MS` 2 s) is the activity `stress-rest` behind the splash, a fast-forward of lived ticks (`stressRestSecond`, from `pairsSecond`): the same last tick as lived, the noise plan untouched (the design review; the user's rule of 2026-11-07).
- **Turn rules and what counts**: events after a string's end are dropped (the din paper's blank count: the tier one's string is shorter, so he hears fewer); Breathe is counted on the string current at the time (open, or the last ended); a **RELOAD try** is a RELOAD row with its "Carry on" and the singles that finish it, or the singles alone from the bolt locking to the bolt home, so a fumble usually leaves one failed try and the card also gives the failed parts; on the `short` command, if the one-round magazine is already in (a Top up between strings took it) the coach says "Good" at once and names nothing; `outOfIt` (a live Breathe counts as out of the mode and still) is **not** guarded by `R.stress`, since nobody breathes on test-pairs and "Three bangs" and they stay to the tick; the tier one's rates are calm's by construction (every roll at felt 0), asserted so, not against a separate calm run.
- **Kit, ear defenders, the places**: the issue's electronic ear defenders stay on the whole scene (×0.6 on bangs, blanks and horn, no deafness, no whine; the bangs still pin the recruit); no new range piece is placed, the horn and the blank rifle being drawn at the coach's hands from `rangeLook().stress` (the places goldens do not move).
- **[T14, reprinted from `scene-stress` on seed 48213; the recruit's felt at the turn / its peak, strings 1 to 5]**: 0 / 0, **22 / 26** (the din; 17 / 26 with the turn at 6 to 8 s), **14 / 15** with a **1.05 s** flinch, **71 / 72** (pinned, froze 2.65 s), **73 / 75** (pinned, froze 2.55 s, RELOAD 4.20 s, the second turner taken in in 1.70 s); the din's pool 22.8 at the turn and 32.3 at its end (the sheet said 21 and 32; §25.18.3's 25 from ten blanks was the indoor figure). The first round from the sighting 2.50, 4.85, 3.50, 6.25 and 4.85 s. The tier one: felt 0 on every string, never frozen, first rounds 0.60 to 0.78 s, RELOAD 1.20 s, the second turner in 0.15 s. Over 40 seeds (heavy) the string-5 RELOAD fails **73 / 18 / 8 / 8 / 8%** by sheet (recruit, private, sergeant, Raider, tier one), and **felt at string 4's turn is 71 / 61 / 32 / 3 / 0**; the recruit's handling steps fail 25% on strings 2 to 5 against 5% calm. Over 8 seeds the recruit fails 7 of 8 string-5 RELOAD tries. The "Three bangs" figures: the recruit +14.1 stress, the private +10.8, the sergeant +3.1; "Bang" the recruit +11.06, the private +8.14 (BODY §9.3).
- **Breathe and the DI** (SKILLS §14): `stress-breathe`, "Again. RELOAD." after a failed RELOAD try; the bot's Breathe memory is its own (`firedNow`, once in `OFFER_AGAIN_MS`), since the DI's memory of lines gone is `state.$instinct`, never saved (the fixer's, my call).
- **The hit card** on turners (VIEWS §7.7): belief during a string, truth from its end; while a string runs a shot at a turner toasts "seen to strike" or "not seen" in belief, the zone staying in J and in the truth (the user's answer A, 2026-11-07).
- **The inoculation** (SKILLS §6.8): fed at each finished noisy string with the cadre as teacher (cap 15); a test sheet's counter never moves and the card says "would count". **The score line** keeps ROADMAP §2.2's form with the scene id `test-stress` and the aspects **the chaos, the contrast, the hands**.
- **Left**: the horn reads as a small salmon blob at 16 px/m; the bang's smoke still hides the coach but for his cap; the radio box keeps a stale "Shooter ready? Standby." (v0.0.9's); the stress-din bench's "at a blank" row; the quick suite takes 159 s here (110 s at v0.0.9), over the runner's default 60 s ceiling; Windows (`play.cmd --dev`) not played.

**`test-breach` "Bang, then go"** (ROADMAP §4.2's 0.0.7f, after `test-zerocqb`; moved from §5.8's row 5c on 2026-11-08; the doctrine proposal's; my calls):
- **What**: one room of the Wheel's house 1 at 1 G (PLACES §4.15; marking rounds 2.8 cm off at 5 m along the spin at most) with two Star Helix role-players in marking-round kit running §7.11's procedure (the narrowest brain: one room, one door, `gunner.js`' firing), the player as #1 with a #2; flash or not, a held door or not, drawn from the seed; their poses and words; the marking paint on their hit cards; "Again as …" every sheet.
- **Aspects scored**: **the defenders** (can you read their state from the figure and the plaque), **the bang** (the window it buys, and the cost of a slow stack), **the hit card**.
- **Needs**: §7.11's procedure and choice, the four new pose sets, the plaque's state words, the hit card on people with "Search him" (§7.7 grows the step, 20 s) and the hot wash's truth.

#### 25.18.4 Tests (each prints its numbers)

| Test | Prints | Fails when |
|---|---|---|
| `supp` (quick) | §5.1's inputs and multipliers; §5.3's T3 and T8 from the code; the decay in closed form against a tick-by-tick reference; every roll's list with its one `suppressed` entry | the closed form off the reference by a point; two `suppressed` entries in a list; felt under 0 or over 100; `PRESSURE_MODS.fire` still applied; any module but `supp.js` defining a `SUPP_`, `HARD_`, `STARTLE_` or `INOC_` constant (`SUPP_HOME`) |
| `anchors` (quick; the user's words, 2026-11-07) | §5.8's T4 from the code | the tier one under three bangs startled over 0.1 s in all, felt over 19, or his Off safe or RELOAD failing more often than calm; the boot recruit's Off safe failing under 50% or his RELOAD under 80%; the private's not between them |
| `startle` (quick, and in the page) | a scripted bang: the tick it lands, the startle's end, the keys refused between, a sighting held to its end | a key but Space or Esc acted on; a take-in starting inside a startle; a save inside it loading to another digest or tick; a prepared bang startling anyone |
| `npc-choice` (quick) | §7.11's T10, one and two bangs, cumulative shares at 3 and 10 s | a calm or under-fire fighter rolling; a choice re-rolled without a band change or a dwell; enemy special forces cowering, fleeing or surrendering after one bang |
| `combat-race` (heavy; built first, in 0.0.7c) | §25.5.5's table and T11 to T13 on the built helpers | with the team's bang 1 s before the entry, the private by the keys under 90% against an aimed insurgent; anyone over 5% against aimed enemy special forces with or without it |
| `hard` (quick) | §5.6's T1 from the templates and the test sheets; T15 along the career; T16, the toll | hardening not monotonic in Warfighting within a class; inoculation past its teacher's cap or past 4 a sol; a real fight adding inoculation |
| `consistency` (heavy) | the same three bangs in `setup=bangs` and in a scripted career room | the pool, felt, the startle and the modifiers differing by a byte |
| `hitcard` (node) | the marks from hit records, called against found, the strings' words; a golden digest of the drawing | a mark off its record's part; a called mark drawn as found before "Search him" |
| `scene-stress` (heavy, the page) | each sheet's strings: the startles, take-ins, fumbles, the paper's figures equal to the sim's | page errors; a frame over 25 ms at a bang |
| `stress-review` (quick; as built in v0.0.10) | the review fixes, each failing without its fix: the din's plan on the paper, FROZE only when frozen, the string's end on the card's line, the summary and the inoculation's left-out strings, a time fault with rounds fired, the DI's wait and shaking lines, the din's later turn, the rest behind the splash with a save inside it, the session's grid | any of those restored to its first form |
| `breathe`, `inoc`, `supp-body` (quick; v0.0.10) | Breathe's closed form against a tick-by-tick reference (2e-12), the row, its offer and its cut, the shed against the run without it (4.96 and 2.80; 1 and 0 before the fix), saves inside it; the counter's growth to the cap and the scene's "would count"; the stress fold against a 1 ms reference (6e-12), by sheet | a shed that is not the twin run's difference; a counter past its cap or 4 a sol; lived and skipped stress apart by over 0.01 off the floor |
| `stress-nodead`, `stress-again`, `stress-save` (v0.0.10) | a fuzz shooter and the wrong ways, RELOAD fumbled five times (forced; the dice give at most 4 in 60 seeds): every run to the card; "Again as …" on the same seed hearing the same noise; a save at nine points of "Bang" carrying on byte for byte, in node and in the page | a run that dead-ends; a different noise on the same seed; a loaded run differing by a byte |
| `bangs-pin`, `instinct-reach`, `instinct-stress` (quick; v0.0.10) | "Three bangs" on 48213, 7 and 99 against v0.0.9's own code (the last tick, a hash of the papers, the summary and the bangs line; only the save digest moves); T on a reach line over whole courses (9 of 9, 0 before the fix); a Breathe line standing at most the one tick its offer ends in | "Three bangs" differing from v0.0.9; a reach line T does not do |
| `ui-hitcard`, `ui-stress` (heavy; v0.0.10) | the card at 200 and 170 crisp, its goldens; the hot wash, "Again as Tier one", nothing to scroll at 1600 × 900 and 1024 × 768 | a mark off its record; a scroll |

**As built in v0.0.10, the split**: `hitcard` is node and quick (the marks, the belief and truth words, three golden digests per look), `scene-stress` is the course on 48213 and 8 seeds quick, 40 seeds heavy, and the page's checks moved to `ui-hitcard` and `ui-stress`. The golden digests of the three looks were re-set on purpose when the card was painted at its box's whole pixels.

#### 25.18.5 Build order

| When | What |
|---|---|
| **0.0.7c, first patch: shipped in v0.0.9**: `test-pairs&setup=bangs` "Three bangs" (ROADMAP §4.2) | `combat-race` on the built helpers first (§25.5.5 settled); `supp.js`; the felt modifier in `roll.js` in place of `PRESSURE_MODS.fire`; `suppTimeK`; `contact.js`'s band; the startle and its window; deafness; the training bang; the FROZE stamp, the vignette and the ducking by felt; `supp`, `anchors`, `startle` |
| **0.0.7c, second patch**: `test-stress` "Bang" | the five strings; ear defenders on the bangs; Breathe; the hit card on turners and its three samples; `person.skills.inoc` and the stress course as an exposure; `hard`, `hitcard`, `scene-stress` |
| 0.0.7d, `test-shoothouse` (was 0.1.x 5b) | your own bang prepared in a bundle's beat; the bang's row and "BANG TO ENTRY"; the inoculation exposures of the MRX and the MOUT day; C's hardening row |
| **0.0.7f, `test-breach`** "Bang, then go" (ROADMAP §4.2; was 0.1.x 5c) | §7.11 on role-players; the four pose sets; the plaque's state words; the hit card on people, "Search him" in training; `npc-choice`, `consistency` |
| 0.1.x 6, `test-patrol`'s join | the fighter and team brains read felt; resolve; fire superiority on felt; the exposing step's hit chance on its row |
| 0.3 | real rooms on Europa: the search's truth, the after-action's annex, the review's evidence |
| later (my call; not before 0.1 has a use for it) | the systems proposal's dose model (graded exposure, stakes, a reach, fading, school floors) as the source of the inoculation term; inoculation's rust with the drills' |

#### 25.18.6 Risks

| Risk | What holds it |
|---|---|
| **The startle reads as lag** | it is short (at most about 3 s, one tick for the hardened), stamped "FROZE 1.20 S" with its cause in the log, and the bang is seen and heard before it; `setup=bangs` scores it first, alone |
| **The recruit's chaos is frustrating** | he is never locked out past the startle: he tries and fails; Breathe, cover and Stay down drain it twice to three times as fast; the instinct line names the sensible step; the recruit's numbers are a reason to train, and the training is short (SKILLS §6.8) |
| **NPCs flicker or all run** | a choice holds until the band changes (T10: 29% fled by 10 s after two bangs, not 89%); calm fighters never roll |
| **The bang reads as weak against professionals** | it buys about four seconds against any man waiting at the door without a filtered visor (T11); against the visored it is a doorbell, said by the DI before the door ("They're in visors. Slice it.") and in the hot wash |
| **The race is unsettled** | `combat-race` settles it on the built helpers before any constant here is tuned |

### 25.19 The shoot house reworked: the drill, the flow, the pauses, the #2 and the stoppage

**Designed 2026-11-11 (the user's note on v0.0.12)**, to build in the shoot house rework (ROADMAP §4.2's 0.0.7d rework row, ahead of everything). The user scored "Stack and clear" 25 / 25 / 25, not starred, and ruled that the shoot house is the pilot for everything that matters (DESIGN.md's log, 2026-11-11, quoted in full there). This section is the rule the build follows; where it and §25.0 to §25.18 disagree, it wins, and each changed section carries a pointer here. It was written from five audits of v0.0.12 (bugs, the AI, the animation, the panel, doctrine, all 2026-11-11, in `.run/rework1/`) and three designs (the drill, the panel, the animation). Doctrine is cited as the doctrine audit extracted it: FM 3-06.11 (2002), MCWP 3-35.3, MCRP 3-01A, TC 3-22.9, CALL 97-20. Every number is an audit's, the built code's, or marked (my call). The panel's layout is VIEWS §7.8; the walk and the figures' animation are BODY §16.8 and VIEWS §3.10; the sidearm is WEAPONS §3.2's note.

#### 25.19.0 The design in one page

1. **A bundle is muscle memory of doctrinal size, never a mission.** "Clear the house" (`house:clear`) is withdrawn: the furthest one press reaches is one room, ending at "Room clear!", and the next door is always the player's press (the user: "the option to clear the whole house should not exist"; doctrine: after each room the leader decides whether to go on, FM 3-06.11 §3-22c(12)). The catalogue (§25.19.2) is arranged by the phases of a room, **stack, door, room, weapon, team**, and holds the user's own examples: "Stack up", "Stack up, take point", "Kick door", "Breach (explosive)".
2. **The recruit and the operator use the same beats.** The rung decides how far one press reaches; the operator's hands, voice and eyes overlap his feet. Nothing is skipped and nothing is watered down.
3. **A contact never stops a trained man's feet.** From rung 2, inside an entry, the take-in's pause **suspends** the bundle instead of cutting it: time stands still for the decision, the chosen shot runs on the hands while the feet carry on to the point of domination, and when the row ends the drill goes on by itself, with no "Carry on" press (FM §3-21c: "They engage targets as they move to their designated point"; the user: "trained operators know to flow in and take shots when they're in position").
4. **A pause is a decision only the player can make, and it names why.** Every stop has a live act, or a live row its line names. No pause is a dead end (§25.19.4).
5. **The #2 works as doctrine says**, does every tower command through the same Corps macros you do, and is drawn doing it (§25.19.5).
6. **A stoppage under contact has three realistic answers**: Transition: pistol (from the Sergeant up, who carry the P-12), Gun down (knee, tap, rack, the #2 covers), and Off the line (a step to the wall, then clear) (§25.19.6).
7. **"Flawless" is a set of tests** over 100 seeds a sheet, run by an honest bot that presses only T and the shot the line names (§25.19.8).

**Kept unchanged**: the take-in and its numbers; the shot rows, their gates, reaches and modifiers; the reloads by purpose; suppression and hardening (scored 100 in Pairs, Three bangs and Bang); the rungs and how they are earned; the recruit's walk in by the keys after X; "T never takes the shot" (one opt-in for the user to rule on, §25.19.4); every DI line names a row the panel has; nothing assumes Mars; AZERTY by physical keys.

#### 25.19.1 What the audits measured, and what the rework must beat

The tier one by pure T over 100 seeds unless named (the AI audit, `.run/rework1/auditor-ai/t1-100.json`).

| Measure | v0.0.12 | Target (§25.19.8) |
|---|---|---|
| wall passages | the #2 6 a lane; #1 grazes the jamb 5 a lane; the sergeant 6 a lane (fixed in v0.0.13, below) | 0 (the C0 circle against wall rects, 0.005 m tolerance) |
| #1 and #2 within 0.45 m | 1.8 s a lane (a shared threshold waypoint; #2 cued on #1's first step in the door) | never under 0.50 m |
| contact pauses with #1 in the doorway | 60% (355 of 594); 31% of rounds fired from the doorway | 0 from rung 2 |
| "Carry on" stops after a shot row | 2.4 a lane | 0 when nobody of the contact stands |
| dead ends (the line has no act and T does nothing) | 818 per 100 lanes | 0 |
| hangs to `LANE_MAX_MS` | 21 (tier one), 12 (Raider), 12 (sergeant) | 0 |
| muzzle faults | 30 (tier one), 54 (Raider) | 0 by T; in fuzz only where the 3-D rule holds |
| doorway faults | 46 (tier one), 66 (Raider) | 0 from rung 2 |
| stops a lane | 21.3 for 8.4 presses of T | at most 14, one press each |
| lane time | mean 163.6 s, p95 600 s | mean 46 s or less, every lane under 60 s |
| the #2 drawn walking | 0 of 49,600 moving ticks | 99% or more |
| the #2's tower admin | none (loaded at the fill) | every command done and drawn |

**Already fixed, as built in v0.0.13** (the fixer's, 2026-11-11, my calls; this is part of stage R1 below, ahead of the rework proper):
- **Routing**: every drill move is routed by the nav on the walker's C0 class (0.27 m), because C1 cannot pass the house's 0.9 m doors on the 0.25 m grid; shut doors block, except the bundle's own; a leg that clips a wall corner gets a waypoint 0.005 m beyond the clearance (`CORNER_KEEP_M`), at most 4 splits a leg (`CORNER_DEPTH`), `CLIP_STEP_M` 0.01 (`src/sim/combat/route.js`, `tests/house-walls.test.mjs`). The authored paths are not walkable at C0 as drawn (every stack-to-threshold leg cuts its door frame, and room 2's #1 threshold-to-point leg: 7 of 15 legs); routing goes round them with the plan's points kept, the data unchanged, no golden moved. R1's remainder makes the data walkable (each door's outer middle added to its paths, §25.19.3.4).
- **The muzzle**: a muzzle at low ready over the #2 is no fault and the instructor gives no "Muzzle!" for it, joining high ready (`carry.js` `SWEEP_SAFE` {highReady, lowReady} and `flagsAt`, read by `shoothouse.js` and `cqb.js` `cqb-flag`; `tests/house-muzzle.test.mjs`): the user's "goes low ready when sweeping their partner (which is good)".
- **One round left**: from rung 2 with every shot row struck, `cqb-contact` says Aim (T aims) then Press (the Fire row); with the bolt locked on an empty it is quiet and `cqb-reload`'s "Reload." leads.
- **A cut scan** counts as done, but not the far leg's look, which stays owed until "Carry on" does it.
- **The muzzle fault's root** (the fixer): `carryPlan` inserted its muzzle-up beat only when no `posture` beat was in the plan, but the lane carry's rest already held the next room's `ready` beat, which waits for approach at 0.6, so the tier one walked out of room 2 aimed across the stationary #2 for about 2.35 s. With the muzzle-up beat put first unless the rest already starts with a posture beat (`beats[0]?.k !== 'posture'`), 0 of 20 lanes fault (the Raider and the tier one on five seeds, by T and by the house bot), against 6 of 20 before, all by T: the Raider on 4 of 5 seeds, the tier one on 2 of 5 (1489397426 and 7). The same muzzle-up-first is still owed in `planBundle` for bundles started aimed.
- **Still owed, from the same audit**: `gaitCarryOf('aim')` (`src/art/figures/poses.js`) returns `'low'` because `CARRY_RIG` has no aim rig, so an aimed walk is drawn at low ready while the sim holds the rifle aimed (this is why the user saw low ready): it breaks "visuals obey the sim" and needs an aimed walk rig, or `'aim'` mapped to a posture the sim holds (stage R8, §25.19.8's walk). `FLAG_M` 0.3 and `FLAG_REACH_M` 5 are defined once, in the house course's data (`src/data/courses.js` `flagM`, `flagReachM`), and read by `shoothouse.js` and `cqb.js` through `carry.js` `flagsAt` (fixed in v0.0.13: `cqb.js` had its own copy); the one 3-D flag helper (`FLAG_BODY_R_M`, §25.19.3.5) is still to build (stage R1), and `FLAG_MS` 300 is still written twice (`carry.js`, `shoothouse.js`).
- **The reference times after routing**: room 1 to your own "Clear!" for the Raider 5.48 s (5.29 before) and the tier one 5.27 s (5.11 before), within 15% of §25.5.4's 5.19 and 4.98. Lanes on 48213: recruit 95.2 s, private 78.3, corporal 61.6, sergeant 50.5, Raider 48.8, tier one 46.4 s. Over 100 seeds: private 78.42 s (74.10 to 83.20), sergeant 48.68 s, tier one 45.60 s. `house-walls`' heavy test takes about 190 s alone (600 + 60 lanes); its two-seed variant in the quick suite about 5 s.

#### 25.19.2 The muscle-memory catalogue

**Rules** (my calls, after doctrine and the user's note):
- **Doctrinal size.** A row covers at most one phase of one room (stack, door, room), or the whole room from wherever you stand at rung 3 and up, and ends at "Room clear!" at the latest. The next door, the next room and "Coming out" are new presses. No row is named after a mission, a house or a lane.
- **One list of beats.** Every catalogue entry is a list of beat ids from `ENTER_AND_CLEAR.beats`. **The rung sets the row's reach, not which rows exist** (the panel design, my call): every row is offered at every rung, and the rung decides where it hands back (§25.19.2.3). The flow (the stepper's channels) decides how the beats overlap. Same beats, same skills, same dice: "no watering down but factor in experience in how smooth and fast we do things" (the user, 2026-11-07).
- **Its label is a verb phrase a marine would say**, and names its reach: "Kick door" (rungs 0 and 1), "Kick, in: your corner" (rung 2), "Kick, clear the room" (rung 3 and up). Variants are set on the row at no time: Push ⇄ Pull ⇄ Kick, Cross ⇄ Hook, Careful ⇄ Fast (the stances' names after DESIGN.md's log of 2026-11-11).
- **A row never fires, picks a target, spends what it does not name, or crosses a door the plan does not take** (§25.2's table, unchanged). A row that names a reload ("Stack up · top up on the way") is the asking.
- **Every row has a `group`**: `stack`, `door`, `room`, `shot`, `weapon`, `team` (doctrine's phases; the panel audit's data splits the same way: room and door 39% of choices, shots 33%, weapon 17%), and a fixed slot within it (VIEWS §7.8).
- **An untaught or unlived row shows greyed** with its rung (`▲▲ 2`) or "by hand first", never hidden (the user's "even if grayed out"; this replaces §25.3.2's "an untaught bundle never shows", which was my call).

##### 25.19.2.1 The beats, amended (`src/sim/combat/drills/enter-and-clear.js`)

| Beat | Kind, channel | Slots | After | Change |
|---|---|---|---|---|
| `approach` | move, feet | all | none | from wherever you stand, routed (`route.js`); "Coming out!" said on it when leaving a cleared room (voice, 0.2 s from rung 3) |
| `ready` | posture, hands | all | `approach@0.6` | **by slot**: #1 high ready, then on the door; #2 and later **low ready, muzzle down** (CALL 97-20: "weapons are pointed down with the exception of the 1-Man"), replacing everyone at high ready |
| `muzzle` | aim:point, hands | 1 | `ready` | rungs 0 and 1 only (as built) |
| **`read`** (new; today a single) | read, eyes | 1 | `approach@arrive` | hinge, swing, lock; 0.7 s × pace |
| **`tell`** (new) | call, voice | 1 | `read` | "Opens in, I go left." (MCWP §19b: One tells Two); `CALL_S` 0.8, `CALL_FLOW_S` 0.2 from rung 3 |
| `squeeze` | call, voice | 2 | `approach` | the #2's "Ready." and his hand; the door waits on it at every rung |
| `door` | door, hands | 1 | `approach@arrive`, `ready`, `muzzle`, `squeeze` | push, pull, kick; **a failed kick warns the room**: every turner with a `door` trigger on this door starts its gap at the failed kick (MCWP §19b: "rarely works the first time, thereby giving … ample warning"; my call) |
| **`breach`** (new; data only this round) | breach, hands then world | the breacher | `squeeze` | place, back, "Breaching!", a count of 2 to 3 s, the blast (a game abstraction: doctrine gives no charge data) |
| `enter` | move, feet | all | slot 1 `door@pass`; slot 2 **`enter#1@gap`** | **never cut by a contact from rung 2** (§25.19.3); the #2 cued by distance, not by #1's first step |
| `corner`, `sector` | scan, eyes | all | as built | suspended, not cut, by a contact |
| **`inner`** (new) | scan, then hold, eyes | the slot whose sector holds the inner door | `sector` | the inner door covered and held; "Hold it or clear it?" is asked **here, from the point**, never from the doorway |
| `far`, `farlook` | move, scan | 1 | `sector` | as built (room 3's L) |
| `clear` | call, voice | each slot | `sector`, `farlook`, `inner`, and **the scene's ready-to-clear predicate** | the drill never calls a void "Clear!": it waits while a window is open, while a man turned less than 1 s ago is unseen, or while a turner whose trigger has fired has not turned, up to `CLEAR_HOLD_MS` 4,000, then hands back |
| **`roomclear`** (new) | call, voice | the leader (you as #1) | both slots' `clear` | "Room clear!"; **every room row ends here** |
| `mark` | mark, hands | 1 | `roomclear` | as built |
| **`reorg`** (new) | reload, hands | each | `roomclear`, or on the next approach | Top up when the magazine is believed at half or less **of its load** and a fuller one is at hand; runs only when a row names it (FM §3-22c(11): "redistributes ammunition"); the #2 does his by himself |

**The crossing rule** (the move kind's own rule, not an authored beat; my call): when the next 0.5 s of a move would carry the muzzle's level line across a teammate within `FLAG_REACH_M` 5 m, the hands bring the rifle to low ready for the crossing and back after, a posture beat flowing with the feet at every rung. The user's "goes low ready when sweeping their partner (which is good)", made what the sim holds and not only what the picture shows (TC 3-22.9 §1-10).

##### 25.19.2.2 The catalogue as data

`MUSCLE` replaces `ENTER_AND_CLEAR.bundles`. `rung` is the lowest rung at which the whole entry is one press; `band` is doctrine's time band in game seconds, a sanity check the tests print against, never a timer.

```js
export const MUSCLE = {
  // STACK
  'stack:up':     { group: 'stack', rung: 0, label: 'Stack up', beats: ['approach', 'ready', 'muzzle', 'squeeze'],
                    variants: { reorg: 'auto' }, band: { recruit: [4.0, 7.0], operator: [2.5, 4.0] } },
  'stack:point':  { group: 'stack', rung: 1, label: 'Stack up, take point', beats: ['approach', 'ready', 'muzzle', 'read', 'tell', 'squeeze'],
                    variants: { reorg: 'auto' }, slot: 1, band: { recruit: [4.5, 7.5], operator: [2.5, 4.0] } },
  'stack:on-him': { group: 'stack', rung: 1, label: 'Stack up on him', slot: 2, offeredNow: false },   // you as #2: question 4
  // DOOR
  'door:read':    { group: 'door', rung: 0, label: 'Read the door', beats: ['read'] },
  'door:open':    { group: 'door', rung: 0, label: 'Open the door', beats: ['door'], variants: { breach: ['push', 'pull'] } },
  'door:kick':    { group: 'door', rung: 0, label: 'Kick door', beats: ['door'], variants: { breach: ['kick'] }, band: { recruit: [1.3, 1.8], operator: [0.8, 1.2] } },
  'door:breach':  { group: 'door', rung: 2, label: 'Breach (explosive)', beats: ['breach'], needs: 'charge', offeredNow: 'struck' },  // "no charge issued": question 3
  'door:flash':   { group: 'door', rung: 2, label: 'Flash, then in', needs: 'flashbang', offeredNow: false },                       // test-breach
  // ROOM
  'room:in':      { group: 'room', rung: 2, label: '{door}, in: your corner', beats: ['door', 'enter', 'corner'],
                    variants: { breach: ['push', 'pull', 'kick'], entry: ['cross', 'hook'], stance: ['assault', 'combat'] } },
  'room:dominate':{ group: 'room', rung: 2, label: 'Dominate', beats: ['enter', 'sector', 'inner', 'far', 'farlook', 'clear', 'roomclear', 'mark'] },
  'room:clear':   { group: 'room', rung: 3, label: '{door}, clear the room', beats: 'all-but-breach',
                    variants: { breach: ['push', 'pull', 'kick'], entry: ['cross', 'hook'], stance: ['assault', 'combat'], reorg: 'auto' },
                    band: { recruit: [12, 18], operator: [5, 6] } },
  'room:watch':   { group: 'room', rung: 0, label: 'Watch: {spot}', beats: ['watch'] },        // one row; the spot stepped by Q and D
  'room:point':   { group: 'room', rung: 0, label: 'Move to your point', beats: ['enter'], past: 'threshold' },
  'room:clearcall':{ group: 'room', rung: 0, label: '"Clear!"', beats: ['clear'] },
  'room:mark':    { group: 'room', rung: 0, label: 'Mark the room', beats: ['mark'] },
  'room:hold':    { group: 'room', rung: 0, label: 'Hold it', beats: ['inner'], when: 'inner door' },
  'room:slice':   { group: 'room', rung: 2, label: 'Slice the pie', offeredNow: false },        // test-breach
  'room:limited': { group: 'room', rung: 2, label: 'Limited penetration', offeredNow: false },  // test-breach
  // WEAPON (under contact: §25.19.6)
  'weapon:gun-down':   { group: 'weapon', rung: 0, label: 'Gun down: {ia}', beats: ['call:gundown', 'posture:kneel', 'ia', 'call:gunup'], when: 'stoppage' },
  'weapon:transition': { group: 'weapon', rung: 0, label: 'Transition: pistol', beats: ['sling', 'draw', 'present'], needs: 'pistol', when: 'stoppage or empty' },
  'weapon:offline':    { group: 'weapon', rung: 0, label: 'Off the line: to the wall, {ia}', beats: ['call:stoppage', 'step:cover', 'ia', 'call:up'], when: 'stoppage' },
  'weapon:rifle-up':   { group: 'weapon', rung: 0, label: 'Rifle up: holster, {ia}', beats: ['holster', 'ia'], when: 'pistol in hand, rifle stopped, nobody facing' },
  // TEAM (§25.19.5)
  'team:cover':   { group: 'team', rung: 0, label: 'Cover his sector', when: '#2 gun down' },
  'team:on-me':   { group: 'team', rung: 0, label: 'On me', when: '#2 off his slot' },   // replaces the 'two' hand-back as a row
  'team:hold':    { group: 'team', rung: 1, label: 'Hold that door', when: 'inner door, #2 nearer' },
};
```

**Removed**: `house:clear` with its `lane: true` and every `r4rest` line of `cqb-stack`; `room:stack` (now `stack:up`); `room:open` (now `door:open` and `door:kick`); `room:stack-open` (its beats split between `stack:point` and `room:in`, so the corporal still clears in three presses); `room:enter` (now `room:in`). **Saves** (the pre-1.0 rule): `upgradeState` maps a running `drill:house:clear` onto `room:clear` for the current leg's door; any other removed id loads as 'choose'.

##### 25.19.2.3 What each rung's one press reaches

| Rung (sheet) | Stack | Door | Room | Presses a room by T |
|---|---|---|---|---|
| 0 (boot recruit) | Stack up (one step) | Read, Open or Kick (one step each) | X, then the keys; Watch, Move to your point, "Clear!", Mark, each a single | the next single the DI names; never the walk in |
| 1 (private) | Stack up; Stack up, take point | as 0 | as 0 | as 0; T on the go line presses X (as built) |
| 2 (corporal) | Stack up, take point | **"Open, in: your corner"** (door, enter, corner; the moving shot rows open) | **Dominate** (point, sector, inner door, far leg, "Clear!", "Room clear!", mark) | 3 |
| 3 (sergeant) | Stack up, take point (to stack and wait deliberately) | **"Open, clear the room"**: from wherever you stand to "Room clear!", hands and voice flowing with the feet | (inside it) | 1 |
| 4 (Raider, tier one) | as 3 | as 3, the eyes flowing too | (inside it) | 1 |

The singles stay at every rung, so a trained man can deviate (a Watch before X, Hold it, a Look). **Below a row's own rung it does only its first group** and hands back at the seam, drawn as the seam bar (`│`) in its dots: a private's "Kick door" from 4 m down the hall stacks and hands back. **A recruit pays** every seam (0.21 s to stop from Combat at 1 G, and his own start after X), his take-in and his aim from where he guessed; **the operator pays none of the seams**, and his hands, voice and eyes overlap his feet. What each does and what is rolled is identical. An emergency drill (Gun down, Off the line) is never grained: one press at every rung.

#### 25.19.3 The flow: through the door to the point, shooting as he goes

##### 25.19.3.1 Suspend, not cut (the core change; my call, from FM §3-21c and §3-22c(5))

v0.0.12 had `enter: { …, cut: true }`: at the pause `contact.js` halted the bundle and cut the feet where they stood, which for a tier one (take-in 0.05 s) is the doorway: "drop you in the doors and leave you there to aim" (the user). Now:
1. **Rungs 0 and 1** (the walk by the keys): as built. The feet carry the body for `goMs`, brake and stand (the recruit's orienting freeze; the Watch row is the decision that cures it).
2. **Rung 2 and up, a row's `enter`, `dominate`, `far` or `approach` running**: the window runs at 1:1 with the feet carrying on along the path (pre-armed, §25.4.5); at the window's end time is held ('stop') **without halting the bundle**: the doing gains `suspended: { why: 'contact', atMs }`, its beats untouched. The player chooses; a shot row then runs **inside** the suspended bundle as a hands beat (the `shot` kind, wrapping `specials.js rowPlan`), and the feet beat resumes at the same tick. The closed-form move needs nothing new: the clock did not run while time stood still, so the trapezoid resumes at the speed it had.
3. **Rows that need the feet halt the bundle as today**, the rest becoming "Carry on: …": Hold him, Challenge, Back out, Get down, Gun down, Off the line, and a shot with **Stop here** set.
4. **The scans** (`corner`, `sector`) are suspended, not cut: while the shot runs the eyes hold on the man, and the scan resumes where it stood.

##### 25.19.3.2 One shot row, the feet by the drill

**One row per shot, not two** (the panel design, my call): the moving and planted twins (`specials.js`) become one row, and the feet follow the drill's rule below, shown on the row as a variant set at no time (`moving on ⇄ at your point ⇄ stop here`). BODY's **Stop here** (VIEWS §7.8's BODY group) plants the feet on purpose.

| The feet | What they do | Modifiers (unchanged from v0.0.12) | The drill's default when |
|---|---|---|---|
| **moving on** | carry on to the point while the rounds go | Assault, rung 2 and up, within 10 m: `mitigated(−8, MRK, 30, 0.25)` (tier one −2, Raider −2, sergeant −4); Combat −4, −2 from Marksmanship 15 | **an immediate threat** (FM §3-21c): armed and facing, or within 1.5 m of the path ahead, or within arm's reach |
| **at your point** (new) | carry on to the point (or `POINT_MIN_M` 1.0 m past the threshold along the path, whichever first), plant with the stop's braking (0.21 s from Combat, 0.35 s from Assault at 1 G), then the rounds | planted | the man is not facing, or beyond 7 m, and the point is under `POINT_REACH_S` 0.8 s away: the user's "take shots when they're in position" |
| **stop here** | stop where you are | planted | never the default while a flow runs; a free choice |

Each round still leaves at its formula time and is rolled with its modifiers; the take-in still decides when the player sees the man; the rows' gates, reaches and odds are the scored ones. **Projected**: the tier one in room 1 sights 1a at the door's plane (0.73 m along his 2.72 m path), takes him in in 0.05 s, chooses the Pair moving on, and fires his first round about 0.30 s later, about 1.3 m along the path, past the 1.21 m threshold. The doorway rounds (31% today) go to 0 from rung 2; room 1's time is unchanged (a pause costs no game time).

##### 25.19.3.3 After the row, the drill goes on by itself

At rung 2 and up, when the row's last round has gone and nobody of the contact still stands (or faces), the suspension ends: no stop, no "Carry on". **A man still up** (§25.6.1's rule) is a decision, so it pauses ("He's still up. Head."): the only follow-up pause. At rungs 0 and 1 a shot row ends in 'choose', as every single does.

##### 25.19.3.4 The paths: along the wall, never through it, never through each other

- **Routed**: every move uses `route.js` on the C0 open grid (built), including the approach from the last room, the carry, the "Move to …" rows and the #2's `runSlot`.
- **The authored data made walkable** (the bugs audit; a data change, the golden `X4_PLANS` reprinted on purpose): each `paths[slot]` gains the door's outer middle (the threshold mirrored 0.3 m out), and each slot passes the door on its own lane, offset `LANE_OFFSET_M` 0.12 m toward the side it turns to (room 1: #1 crossing left through (28.88, 11.7), #2 hooking right through (29.12, 11.7)); a 0.9 m door leaves a 0.27 m body a 0.18 m band each side of the middle. A test holds every authored and planned path `clearLine` on the C0 grid.
- **Separation**: the #2's `enter` waits for `enter#1@gap`, #1's centre `ENTRY_GAP_M` 0.75 m past his own threshold waypoint (about 0.4 s behind him at the tier one's lope: doctrine's "almost simultaneously"); each tick of a team member's move also holds `BODY_GAP_M` 0.50 m from every other team body, braking on its path until the gap opens. The guard should never act with the cue right; the test counts the times it does, and if it ever holds more than 0.3 s the cue is fixed, not the guard.
- **Out of the centre, never in front of a door**: the points are 0.5 m off the wall and 1.0 m from the corner (FM §3-22c(6), (9)), and `inFunnel` is never a point.

##### 25.19.3.5 Muzzle discipline, as the sim holds it

- **Postures by slot** (`ready`): in the stack #1 on the door, #2 and later at low ready, muzzle down.
- **The crossing rule** (§25.19.2.1): low ready while the line would sweep a teammate.
- **One flag helper**, shared by `shoothouse.js` and `cqb.js` (the two copies of `FLAG_M` and `FLAG_REACH_M` merged into `carry.js`): the muzzle's **3-D line**, pitch included, meets the teammate's body as a capsule (radius `FLAG_BODY_R_M` 0.3 m, floor to head) within `FLAG_REACH_M` 5 m, for `FLAG_MS` 300 ms at once; low ready, high ready and slung are exempt (TC 3-22.9 §6-16, §6-19; `SWEEP_SAFE`, built).
- **The DI's cure** for `cqb-flag` becomes **Low ready** ("Muzzle down."), not high ready.
- **The picture draws the posture the sim holds** (VIEWS §3.10): v0.0.12 drew an aimed walk at low ready (`poses.js gaitCarryOf('aim') → 'low'`), the other half of the user's report.

#### 25.19.4 The pause policy

**The rule** (my call, framing the user's "game would pause on contact with enemy", 2026-11-07, and "the automatic pauses are awkward in general", 2026-11-11): **the game stands still only where the player has a decision his training does not make for him. Every stop says why in the line's lead, and every stop's line names a live row, or T does a live act.**

| Event | Stops? | The line's lead | T's act, or the row the line names |
|---|---|---|---|
| GO | yes | "GO." | the stack row of your rung |
| a person newly seen in your sector or nobody's, at the take-in | **yes** (the user's rule, kept) | "Contact · 0.05 s." | the shot row with its key (T: none for a threat, Challenge for unseen hands, Carry on for a no-shoot) |
| a person in **the #2's sector** while he is up, his gun working, on or entering his slot, and the person is not within 20° of your own muzzle | **no** (my call): the brackets close thin, the log says "His. Taken in 0.05 s." | none; you are paused only if he goes down or the man crosses into your sector (re-tested every tick) |
| a no-shoot in your sector | yes (the pause never says who is hostile) | "Hands. No weapon." | Carry on (T): at rung 2 and up the flow resumes |
| a man still up after the row | yes | "He's still up." | the head row, named |
| a shot row ends, nobody up | **no** at rung 2 and up; 'choose' at 0 and 1 | | |
| the hostage | yes | "Hostage. Head only." | To the head (the aim inside it from rung 2) |
| a stoppage (the click) | yes: the reflex card (§25.19.6) | "Stoppage." | the card's first answer; R keeps an answer, as built |
| IA ends, nobody facing | **no** at rung 2 and up: the flow resumes | | |
| IA ends, a man facing | yes | "Back on him." | the shot row |
| an inner door the plan does not take | yes, **from the point** after the sectors (the `inner` beat) | "Door, east wall." | **Hold it** (T), the DI's choice for a team of two; "Kick, clear it" offered |
| a locked lane door, or a kick that held | yes | "Locked." / "It held." | Kick door again |
| "Room clear!" | yes (doctrine: the leader decides) | "Room clear. Next: room 2, 6.2 m." | the next door's stack row, with "top up on the way" when half or less is believed |
| the #2 lagging (the 'two' hand-back) | **no**: the #2 is never 1.5 m off his slot (§25.19.5); the hand-back stays as a guard and its firing fails a test | | (`team:on-me` as T if it ever does) |
| a seam below the rung | yes (the grain of rungs 0 to 2) | "Done: stacked." etc. | the next single or group |
| the tower's command | yes, outside the lane | the command | the macro (`HOUSE_CMDS`, as built) |
| Backspace or X | yes | "Stopped." | Carry on |
| the lane's end | yes | "Stop." | **Make safe** (one row, the Stop macro: safe, finger off, low ready) |

**No dead ends** (rules for `cqb.js`): a line whose act is null names a row live now and on the panel's core (VIEWS §7.8); the shot line reads the rounds (fewer believed than the lead row's `n`: Fire or the row that fits; none: RELOAD, or Transition with a pistol and the man within 10 m); `cqb-noshoot` at the pause's own ms no longer outranks a door question or "Carry on", its act being Carry on; `halfOrLess` counts the magazine's load, not the family's capacity (10 of 30 read "half or less" in v0.0.12, so Top up never left page one); the stall clock counts progress only (a new cover, a round, a leg's state, a door), never a Wait.

**What the tier one's lane costs by T after this** (projected): GO; room 1's contact; "Room clear"; room 2's contact (2a and 2b in one window); the dummy's card; back on the rifle or "Rifle up"; the closet question; "Room clear"; room 3's hostage; "Room clear"; the hall man; "Stop": **12 stops, one press each**, against 21.3 and 818 dead ends per 100 lanes. The sergeant the same; the corporal 2 more a room; the private his grain by hand.

**The standing order** (offered, off by default, for the user to rule on: question 1). "T never takes the shot" was v0.0.5's call (mine), not the user's; the user asks for an operator who flows in and shoots in position, and for the AI to clear flawlessly. A row variant set at the stack at no time, **"Engage: armed, my sector"**, offered from rung 4 (struck "rung 4" below): with it on, a person in your sector does not pause the game when the identification named a rifle or a pistol, nobody else stands within 1 m of him and he is facing. The take-in still runs with its brackets and stamp, the drill's doctrinal row fires at its end (the failure drill on armour, the hammer within 7 m, else the pair, moving on), and the log reads "By your order: pair, moving on". A failed identification withholds and never shows a weapon that is not there (§25.4.6), so the order can never fire on a no-shoot or a hostage; every other person, and a man still up, still pauses. It is a rule of engagement given before the room, not a kept reflex answer. Off by default keeps the user's 2026-11-07 rule until they say otherwise.

#### 25.19.5 The #2

| Doctrine (source) | v0.0.12 | The rework |
|---|---|---|
| tight behind #1, muzzle down (CALL 97-20) | high ready | low ready in the stack (`ready` by slot) |
| the squeeze, rear to front (CALL 97-20; FM §3-22c(3)) | "Ready." whispered | kept, drawn (`stackTap`, VIEWS §3.10); the door waits on it at every rung |
| enters almost at once, opposite #1, along the wall (FM §3-22c(6)) | cued on #1's first step; a shared waypoint; through #1's body 1.8 s a lane | cued at `ENTRY_GAP_M`; his own door lane; `BODY_GAP_M` held |
| clears his corner, holds his sector, engages in it unasked (FM §3-21d) | yes (0.70 s mean lag) | kept; his sector is his for the pause policy |
| moves with #1 between rooms | starts on a poll; the sergeant's #2 is 2.06 m off his slot at room 2 in 100 of 100 lanes | starts his approach to the next door's slot-2 stack **the tick yours starts**, routed, at your stance |
| takes a down man's sector (FM §3-15d; CALL 97-20) | never | on "Gun down!" (§25.19.6) |
| calls "Ready", "Clear!", "Up", "Reloading!", "Covering!" (FM table 3-2) | "Ready", "Clear!" | all five, voice beats on his doing (`CALL_FLOW_S` 0.2 from rung 3) |
| reorganises after the room (FM §3-22c(11)) | never reloads | at "Room clear!" he tops up himself when half or less (a teammate's own decision; "nothing unasked" binds the player's rows), "Reloading!" then "Up." |
| never through walls; never flags | 6 wall passages a lane | routed; his own moves obey the crossing rule |

**His entry, timed** (rung 4, room 1, projected): #1 crosses his threshold waypoint; 0.75 m further along #1's path (about 0.37 s) the #2's entry starts on his own lane, hooking right; with #1 at his point the #2 is about 1.2 m from his; both scan corner then sector; the two "Clear!" calls, then your "Room clear!". The room's "Clear!" with a #2 (1.0 to 1.3 s after your own in v0.0.12) shortens by his earlier approach, never by a change to the scans.

**The tower's commands, done and seen** (MCRP 3-01A §§3002 to 3010):
- **The fill**: the #2 is issued in **Condition 4** (magazine in his pouch, chamber empty, on safe), not loaded at the fill (`shoothouse.js` today).
- **Each command goes to both marines.** `houseOnCmd` gains a #2 branch: each command starts his macro on his own list doing (`R.house.two.doing`, the stepper's list machinery, the same Corps macros as yours, `drills.js MACROS`), at the command plus his `goMs(WF)` (150 to 235 ms), its time and rolls from his own Weapon handling. **The tower waits on him as on you**: `houseWant` names what he lacks ("Number two, a round up.").

| Command | His macro | What is drawn (the sub-steps) | His time |
|---|---|---|---|
| **LOAD** (4 → 3) | `load` | thumb on the selector; the hand to the pouch; the magazine up to the eye; seated, tugged; the port cover | 1.93 s at WH 15; about 1.0 s at 42 |
| **MAKE READY** (3 → 1) | `makeReady` | the support hand racks; a glance into the port; head to the optic | 2.51 s at WH 15 |
| **Standby** ("get ready") | to his mark behind you, low ready, still; "Ready." | the nod, the whispered word | his walk |
| **Stop** (the lane's end) | the Stop macro (safe, finger off, low ready) | thumb, finger, muzzle down | about 0.6 s |
| **UNLOAD** | `unload` | port rolled down; the round caught; bolt locked; the look in | 4.05 s at WH 15 |
| **UNLOAD, SHOW CLEAR** | `showClear` | the tilt held toward the instructor until "Clear.", the bolt released at the word | as built (7.90 s at the sheet's WH) |

The instructor acknowledges each marine ("Number one, clear." / "Number two, clear."); SHOW CLEAR ends when both are shown. His sub-step is readable as yours is, `handsOf(state, pid)` (the doing's current sub id), one helper for both, and the renderer draws exactly what it draws for you on the same sub-step (VIEWS §3.10).

**Animated, the sim side** (BODY §16.8): `runSlot` sets everything the player's mover sets, every tick he moves: `$px` and `$pz` at the tick's start (the 20 Hz strobe the animation audit measured, median 9.9 px, goes), `gait`, `strideM`, `moveStance`, `v`, `gp` and `bodyRad`; `people/figure.js` lets a non-player keep his gait while he moves (today it forces 'idle'); the instructor's catwalk walk takes the same trapezoid profile.

**His own stoppage** (low priority, my call): his magazine carries no dummy, so "Again as …" stays identical. If his rifle stops by the built jam chance, he calls "Gun down!" and kneels; you get one stop, "Your two: gun down.", whose act is **Cover his sector** (`team:cover`): your muzzle on his sector, his stands yours until his "Gun up!".

#### 25.19.6 The stoppage under contact, and the sidearm

**The kit** (WEAPONS §3.2's note): the **P-12** in a thigh holster on the right (`compose.js` already draws one), one HAD-17 in it with 10 frangible 9×21 and a spare in the holster's pouch, ten being the house's rule as for the rifle (my call); **from the Sergeant up** (Sergeant, Raider, tier one; my call after the flashbang's precedent; question 2). The boot recruit, the private and the corporal carry none and have Gun down and Off the line; Transition shows struck with the pistol's silhouette ("not issued"). LOAD and MAKE READY cover both guns (rifle, then the pistol made ready and holstered on safe), UNLOAD and SHOW CLEAR both (pistol last), one macro each; the lane's 'dry' end counts the pistol's rounds too.

**The answers, first to last on the reflex card** (on the click, as built, with R's kept answer):

| Situation | 1 | 2 | 3 | 4 | then |
|---|---|---|---|---|---|
| a threat facing within `TRANSITION_NEAR_M` 10 m, pistol carried | **Transition: pistol** | Gun down: tap, rack | Tap, rack (standing) | Off the line | Look at the port; Nothing |
| a threat facing, no pistol, your #2 up in the room | **Gun down: tap, rack** (he covers) | Tap, rack | Off the line | Look at the port | Nothing |
| nobody facing, in a clear with a buddy (FM §3-15d: "should immediately announce gun down and drop to one knee") | **Gun down: tap, rack** | Tap, rack | Look at the port | | Nothing |
| not in a clear (the bay, alone) | Tap, rack | Look at the port | | | Nothing (as built) |

From Weapon handling 15 the card names what the hands felt (as built, §25.6.6), and "Gun down" carries the right drill ("Gun down: remedial" for a double feed); below 15 it says "Gun down: tap, rack".

| Answer | Beats (channel) | Times (each the built action's formula at the sheet's WH) | Doctrine band (a sanity check) |
|---|---|---|---|
| **Transition: pistol** | the rifle to the sling 0.3 s (hands); the draw from the thigh (hands); the present, `aimS` with the pistol's sight and turn ×1.0; then the pistol's shot row | the sergeant about 1.05 s to the draw's end, the Raider about 0.78, the tier one **0.64 s** (§25.6.5; WEAPONS §5.2's table) | 1.0 to 1.6 s trained; 1.02 s an instructor |
| **Gun down: tap, rack** | "Gun down!" (voice, 0.2 s, flowing); the knee (standing to kneeling, `stanceMsOf`); IMMEDIATE ACTION as built; "Gun up!" | the knee + 1.27 s (private), 1.07 (corporal), about 0.95 (sergeant), 0.70 (Raider), 0.55 (tier one) | IA 1.5 to 2.2 s operator, 3 to 5 s recruit |
| **Off the line** | "Stoppage!" (voice); a step to the point 0.4 m off the nearest wall face square to the threat's line, at most `COVER_STEP_M` 1.5 m, routed (feet); IA (hands, flowing with the step from rung 3) | the step + the IA | 2.0 to 3.0 s operator (TC 3-22.9 §8-26) |
| **Rifle up** (after a transition, the threat down) | the pistol to the holster (`stow` 1.3 s × pace, DC 6); IA on the rifle | | |

- **Kneeling** gives +2 to the shot (WEAPONS §7's position table) and keeps the shooter below the #2's line. After "Gun up!" you stay kneeling until the #2's **"Up."**, said `UP_WAIT_MS` 400 ms after your "Gun up!" when no window is open and nobody of your sector faces, or once the man he engaged for you is down (FM §3-15d: "until directed to stand up"). The next row carries the stand beat first.
- **The pistol in hand runs every drill row** (the rows read `muzzleOf`); the DI: "Pistol up. Clear the rifle when he's down."; "Rifle up" leads at the next stop with nobody facing.
- **The #2 covering**: on your "Gun down!" or "Stoppage!", if he is up and not on a man, he says "Covering!", his watch goes to your sector's middle or your bracketed man, and **your sector's stands become his** until your "Gun up!". His take-in on them is `sector` for the man you bracketed (you showed him), `area` for the others; his row is his own (`twoPlan`); the par counts either man's first round (as built). If he is on a man he finishes his row first. He pivots, never walks: a man he cannot see stays yours.
- **The DI** (`cqb.js`): `cqb-stoppage`'s act is the card's first answer; **`cqb-gunup`** (new): "Up. Carry on.", its act Carry on or the next row; **`cqb-two-down`** (new): "Your two's down. His sector.", its act Cover his sector; `cqb-reload` with a pistol and a man within 10 m names Transition.

#### 25.19.7 The panel and the walk

**The panel** is redesigned in VIEWS §7.8: five groups each with a fixed map of slots, the core five actions always visible on fixed keys and greyed with their reason and their remedy's key when off, and three layouts for the user to score in the gallery (`samples/panel/`, P1 to P3) and in play (`&panel=a|b|c`). This section guarantees the panel: every row has a group and a slot; the core five exist at every stop (the shot, Aim ⇄ Hold, Fix, the muzzle, NEXT as T's act); a struck row carries its reason; the DI names only live rows.

**The walk and the figures' animation** are rebuilt in BODY §16.8 (the sim's locomotion record and gait phase) and VIEWS §3.10 (the cycle, the plant lock, the stances, turning, the close-quarters beats), with three walk cycles for the user to score (`samples/walk/`, W0 as built and A, B and C). The sim guarantees the picture: the #2's gait, stride and tween are set by the sim; the posture held while walking (aimed, low ready, high ready) is drawn as held, and the crossing's low ready is a real posture change; `handsOf` sub-steps are drawn the same for you and the #2; the kneel, the transition (rifle hanging, pistol up) and the holster are new frames.

#### 25.19.8 "Flawless", as tests

**The bots** (`tests/bots/house.mjs`): **`houseTBot`**, honest (new): T, and at a stop whose line names a shot on his own man that row; nothing else, never a Wait. `houseBot({ mode: 'T' })` stays for its numbers but is **no longer the flawless test** (it covered for the automation with 251 High-ready presses in 100 lanes). `houseKeysBot` (the recruit and private by the keys) holds the grain; `houseFuzzBot` holds that faults are deserved and that nothing dead-ends; **`stoppageBot`** (new) is the honest bot with each card answer forced in turn.

**The criteria**: 100 seeds a sheet at `setup=go` (seed 0 the user's 1489397426, then 1000 + 37i), heavy; 10 seeds of the tier one and the private in the quick suite. In `tests/house-flawless.test.mjs` (heavy) and `house-flawless-quick`; `scene-shoothouse` stays for its numbers.

| # | Criterion | Who | Threshold | Prints |
|---|---|---|---|---|
| F1 | no wall paths: every team body's C0 circle against the area's wall rects and closed leaves, every tick | all bots, all sheets | 0 overlaps over 0.005 m | the worst overlap, where, who |
| F2 | no bodies through each other: #1 and #2 centre to centre | all | never under `BODY_GAP_M` 0.50 m | min distance; the guard's holds a lane |
| F3 | authored paths walkable: every `paths[slot]`, `far.path` and planned beat path `clearLine` on the C0 grid | data | all clear | the worst leg |
| F4 | no doorway stops: #1's feet under 0.3 m/s inside `inFunnel`, a chosen Stop here or Gun down excepted | honest T, rung 2 and up | 0 ticks; 0 funnel faults | doorway s a room |
| F5 | the first round out of the door: #1's place at his first round on each man of his | honest T, rung 3 and up | past the threshold in 100% | metres past, mean and min |
| F6 | the feet never stop between the stack and the point (unless a stop's row needs them) | honest T, rung 3 and up | above 0.3 m/s every tick | min speed |
| F7 | no missed corners | honest bots | 0 corner faults; every hot spot covered before "Clear!" | coverage by whom |
| F8 | faults only when deserved | honest T: no muzzle, funnel, time, standing, no-shoot or hostage fault; fuzz: each fault's evidence recomputed independently (the 3-D capsule; the feet) | 0 (T); 100% evidenced (fuzz) | faults by kind |
| F9 | every threat engaged in its sector: slot 1's first round by #1, slot 2's by #2 (or by #2 for #1's while #1 is gun down) | honest T | 100%; threats left up 0 | by stand |
| F10 | pars | honest T: tier one and Raider the operator par; sergeant and corporal the advanced | met on every man but the one the dummy stops | par by stand |
| F11 | no dead ends: at every stop T does a live act, or the line names a live row on the core | honest T, all sheets; fuzz | 0 | stops by why |
| F12 | no "Carry on" stop after a shot row with nobody up | honest T, rung 2 and up | 0 | |
| F13 | stops a lane | honest T, tier one | at most 14 at p95, one press each | by why |
| F14 | no hangs | all | 0 lanes to `LANE_MAX_MS`; 0 stalls by the honest bot | lane time mean, p95, max |
| F15 | lane time | honest T, tier one | mean 46 s or less, max 60 s | room by room |
| F16 | no row, line or act names a lane or a house | static, and all runs | none | |
| F17 | the #2 at his slot: within `TWO_SLOT_M` 1.5 m of his stack when you are stacked; the 'two' hand-back never fires | all | 100%; 0 | distance at your stack |
| F18 | the #2's admin: after each tower command his condition is the command's within his macro time + 0.5 s; his sub-steps follow the macro's list | all sheets, 5 seeds | 100% | his times by command |
| F19 | the #2 animated: on his moving ticks `gait` is not idle, `$px` and `$pz` were set at the tick's start, `figureOf` keeps his stride | all | 99% or more; tween error 0 | |
| F20 | the stoppage | `stoppageBot`, each answer, 100 seeds | each ends live; Transition's first pistol round within its time + the present + 0.1 s; under Gun down the #2 engages the bracketed man whenever he can see him; you stand only after his "Up." | times by sheet |
| F21 | no watering down: the recruit and private by the keys | keys bot | room 1 and the lane within 10% of the routed v0.0.12 figures (§25.19.1) | before and after |
| F22 | the operator's room against doctrine: the tier one's room 1 to his own "Clear!" | honest T | 5.27 s ±15% (the routed figure), printed against doctrine's 5 to 6 s | |
| F23 | determinism: a save at every stop and at three ticks inside a suspended flow loads and carries on byte for byte | honest T, 3 seeds | 100% | |
| F24 | every DI line names a row the panel has, live (the struck rows included) | all stops | 100% | |

The doctrine bands are sanity checks, not timers: a sheet outside its band is printed, not failed, except F22.

#### 25.19.9 Constants (new; each my call)

| Name | Value | Home | Why |
|---|---|---|---|
| `ENTRY_GAP_M` | 0.75 m | `bundle.js` | #1 past his threshold waypoint before #2 steps in: about 0.4 s at the lope |
| `BODY_GAP_M` | 0.50 m | `bundle.js` | two C0 radii (0.54 m) less a touch; the stack's 0.65 m stays above it |
| `LANE_OFFSET_M` | 0.12 m | `x4-plans.js` (data), `room.js` (the test) | inside the 0.18 m band a 0.9 m door leaves a 0.27 m body |
| `POINT_MIN_M` | 1.0 m | `specials.js` | "at your point" plants no sooner than 1.0 m past the threshold: twice `FUNNEL_M` |
| `POINT_REACH_S` | 0.8 s | `specials.js` | "at your point" is the default only when the point is this close |
| `CLEAR_HOLD_MS` | 4,000 | `bundle.js` | how long "Clear!" waits on the ready-to-clear predicate before it hands back |
| `FLAG_BODY_R_M` | 0.3 m | `carry.js` (the one flag helper) | the teammate's body as a capsule; replaces the two copies of `FLAG_M` |
| `COVER_STEP_M` | 1.5 m | `bundle.js` | Off the line's longest step |
| `UP_WAIT_MS` | 400 | `shoothouse.js` | the #2's "Up." after your "Gun up!" |
| `TRANSITION_NEAR_M` | 10 m (§25.6.5's) | `specials.js` | Transition leads the card within it |

#### 25.19.10 Build order (ROADMAP §4.2's rework row holds the stages)

| Stage | What | Modules |
|---|---|---|
| **R1, the floor** (partly built in v0.0.13: routing, the muzzle fix, the hall's dead end, the cut scan; the rest to build) | routed everywhere; the muzzle fix (`SWEEP_SAFE`); the hall's dead end; then the paths made walkable, the one 3-D flag helper, `halfOrLess`, the stall clock | `route.js`, `bundle.js`, `x4-plans.js`, `shoothouse.js`, `cqb.js`, `specials.js`, `carry.js` |
| **R2, the bodies fed to the view** | BODY §16.8's locomotion record for every mover (the #2, the instructor), the brake in place of the cut, the aim drawn as an aim, every band pre-painted before GO, one outline per person (VIEWS §3.10 part 1) | `bundle.js runSlot`, `people/figure.js`, `poses.js`, `figures.js`, `cards.js`, `post.js` |
| **R3, the flow** | suspend, not cut; the shot as a hands beat inside the bundle; one shot row, the feet by the drill; no "Carry on" after a row; the `clear` beat's wait; the inner door from the point; `ready` by slot; the crossing rule | `stepper.js`, `contact.js`, `bundle.js`, `specials.js`, `enter-and-clear.js` |
| **R4, the catalogue and the pauses** | `MUSCLE`; `house:clear` gone; rung 2 regrouped; "Room clear" as the end; the reorg variant; the saves' mapping; the #2's sector; every stop's why; the dead-end rules; the standing order (off) | `enter-and-clear.js`, `bundle.js`, `cqb.js`, `contact.js`, `shooting.js` `stepsOf`, `templates.js`, the upgrade |
| **R5, the #2** | the entry gap, lanes and body gap, the approach with you, the calls, the reorg, the cover; the tower's macros on his doing; Condition 4 at the fill | `bundle.js runSlot`, `shoothouse.js` (`twoTick`, `houseOnCmd`, `houseWant`) |
| **R6, the stoppage and the sidearm** | the P-12 issue from the Sergeant up; the card's answers; Gun down, Off the line, Transition, Rifle up; the #2's cover | `kit.js` 'house-cqb', `reflex.js` callers in `shooting.js`, `bundle.js`, `shoothouse.js` |
| **R7, the panel** | VIEWS §7.8's model once, its three layouts behind `&panel=` until the user's pick, then the others deleted | `stepsOf`'s groups and slots, `src/ui/hud/steps.js`, `keys.js` |
| **R8, the walk** | BODY §16.8 and VIEWS §3.10's machinery, then the chosen cycle, the stance pool and the close-quarters beats, then turning | `src/data/body/gait.js`, `compose.js`, `poses.js`, `atlas.js`, `view.js` |
| **R9, flawless** | §25.19.8's suites, written first as gauges (printing, not failing) from R1 and made to fail from R6 | `tests/bots/house.mjs`, `tests/house-flawless*.test.mjs` |
| later | "Stack up on him": you as #2, the #2 leads (the career's new man is #3 or #4, §25.5.5) | `runSlot` for slot 1, the stands' slots by role |

R2 and R3 to R6 may run in parallel (different files); R7 and R8 wait for the user's scores only for their last step (the drawing layer and the chosen cycle), so neither blocks the sim.

#### 25.19.11 Questions for the user (each with its default, which the build follows until answered)

1. **The standing order** (§25.19.4): may the operator set "Engage: armed, my sector" at the stack, so a clean armed man in his sector is shot without a pause? *Default: built, offered from rung 4, off.*
2. **The pistol**: from the Sergeant up, or on every sheet? *Default: from the Sergeant up; the lower sheets have Gun down and Off the line.*
3. **Breach (explosive)**: shown struck in this lane ("no charge issued") and built live in `test-breach`, or a breach door in this lane now? *Default: struck here, live in `test-breach`.*
4. **You as #2** ("Stack up on him"): in this scene now, or after the #1 flow is scored? *Default: after.*

The panel's layout and the walk cycle are scored in the gallery (VIEWS §7.8, §3.10).

#### 25.19.12 Risks

| Risk | What holds it |
|---|---|
| a suspended bundle is a new state for the stepper | F23; built behind `scene-handling`'s byte-for-byte guard, as the stepper was |
| the #2's sector rule hides a man from you | the 20° muzzle cone re-tested every tick; F9 checks who fired first |
| the pistol lengthens the tower's admin for three sheets | measured against the user's patience: they asked for the #2's admin to be seen, not for theirs to be longer |
| the body gap's guard stalls the #2 in a doorway | F4 counts his doorway ticks too; a hold over 0.3 s fixes the cue, not the guard |
| one shot row with the feet by the drill hides the planted choice | the feet are a variant on the row, set at no time, and Stop here is on the core's BODY group |
| three panels and three walks built at once | one model under each, three drawing layers; the losers deleted on the user's pick (tradecraft's way) |
