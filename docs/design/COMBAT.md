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

---

## 0. The model in one page

A fight runs on three clocks that share one game time.

1. **The stage, in seconds.** The world runs 1:1 at 20 Hz. Nobody aims with reflexes. When the player declares intent (G readies the weapon, X enters shooting mode, K L M open CQC, a reflex card is answered with a fighting step), **stop motion** begins, exactly as in tradecraft: time stands still while the player chooses, and each chosen step runs world time for its own duration. COMBAT adds the steps a soldier needs: posture changes, rushes and crawls between covers, peeks and corners, area fire, watching a sector, orders, grenades, drags. Steps longer than a second end early on **interrupts** (a new threat seen, a hit, an order, a grenade). Everyone else, squadmates and enemies alike, acts in real time during the player's steps, with the same timed actions, human reaction delays and only what they perceive.
2. **The engagement, in minutes.** Every fighter carries a **suppression** level fed by near misses, impacts and blasts. It is a fast stress that costs rolls and makes exposing yourself a test of nerve. Fire superiority is the side whose fire keeps the other suppressed. Squads fight by **drills** written as data (react to contact, bounding overwatch, buddy rush, squad attack, break contact, stack and clear) run by three brains: fighter, team, squad. Orders travel by voice, radio, hand signal or helmet contact, each with its own range and delay. The player receives orders on the T line and, from fire team leader up, gives them from an order panel inside stop motion.
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
  "supp": 38, "suppAtMs": 2051350800, "sector": [1.2, 2.4],
  "reactUntilMs": 2051351050, "thinkAtMs": 2051351200,
  "nerve": 0.8, "brokeAtMs": null, "horsDeCombat": false
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

- Out of stop motion, the player walks, runs, looks, talks (time stands still), uses R and T, and lives at 1:1 among the fighting. Shots can only be taken in stop motion. A firefight can be ridden out in real time by following T (the order on the line), which is how a new marine is meant to survive the first one. When the team's leader falls, loses contact or freezes, the same line offers to take the team (§8.5), so a private is not a passenger in the fight.
- **Entering stop motion** (TIME owns the general mechanism; COMBAT lists the combat doors): G with a gun (the ready step is the first step, tradecraft's "G means intent"), X, a CQC key, a reflex answer that is a fighting step, or the order panel (§8.3).
- **Leaving it**: X; or automatically, as tradecraft does, when the player cannot act at once: dead, out cold, knocked down and not yet able to rise, held in a grapple, carried, strapped in under G above 1.5 G, or in a vehicle. Being suppressed or pinned does **not** end it: you can still act, with a cost (§5.3).
- When nothing hostile has been perceived for 60 s of steps, the instinct line says so ("Nothing in sight. X to stand easy."). The mode does not end by itself (my call).
- Space still pauses. Nothing is chosen while paused; choosing happens in stop motion (my call, so that every order and step costs its time).

### 3.2 What everyone else does during a step

Tradecraft's rule is kept and generalised: during a step the world runs at full fidelity, 20 Hz, for the step's duration, and **every NPC acts in real time with the same timed actions as the player** (WEAPONS's handling steps, the movement steps of §3.4, aim, fire, throw, aid), at their own skill's pace, reloading from finite magazines and dropping what they carry when taken down.

NPCs are not omniscient and not instant:
- **Perception.** They act on what PEOPLE's perception gives them and on their side's contact board (§6). No one sees through walls or fires at what they do not know.
- **Reaction delay** (my call): from perceiving a new threat to the first action about it,
  `reactMs = (250 + 1250 × (1 − min(1, WF / 60)) + 300 × band) × U(0.7, 1.3)`,
  where `band` is the suppression band index 0 to 3 (§5.3). A fresh private (WF 10) waits about 1.3 s; a squad leader (WF 30) 0.9 s; a raider (WF 60 and up) 0.25 s. The human figures this mimics: 0.25 s simple reaction time, 1–2 s to choose under stress.
- **Thinking cadence**: an NPC fighter re-decides every `THINK_MS` 500 ms in contact, 1,000 ms otherwise, and at once on its own events (hit, order, grenade, target down, magazine empty). At most `DECIDE_PER_TICK_MAX` 6 fighters decide in one tick; the rest wait their turn (§19).
- **No firing from the ground** when the body forbids it: a fighter who is down, knocked, out cold or past BODY's pain limit takes no combat actions beyond self-aid, crawling and surrender (the user's 2026-11-03 bug, kept fixed).

The player has unlimited thinking time in stop motion and pays for it with no edge in execution: every step takes its time, and the enemy's reaction delay runs during it. That is the bargain tradecraft struck and OLYMPUS keeps.

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

**Noticing late.** On `newThreat`, the player rolls Awareness against `8 + rangeM / 10` (+4 if behind the view cone, −2 if on your watched sector). Success freezes at once. Failure lets the world run on for `400 + 100 × |margin|` ms (at most 2,000) before the freeze: you noticed late (my call). A natural 1 on someone already firing at you still freezes at the first hit.

**Startle.** The first step after a `newThreat` freeze costs `STARTLE_MS = max(0, 700 − 7 × WF)` extra: 0.63 s at WF 10, 0.49 s at WF 30, nothing from WF 100 (my call). Training buys reaction time; the player's free thinking does not.

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
| Watch a sector | up to 30 s, chosen | none | none | as posture | holds an aim on an arc of ±15°: ends at once when a hostile enters it (interrupt), with the aim already held (WEAPONS's held bonus) |
| Area fire (suppress) | 2–20 s, chosen; rate slow (1 round / 3 s), rapid (1 / 1 s), bursts (3–4 rounds every 2 s) | Weapon handling for recovery | each round (§5.4) | yes unless blind | ends on dry, stoppage or interrupt; you reload by hand |
| Blind fire | 1–6 s | none | each round at +10 DC | hands only (share 0.1) | over or round cover without looking |
| Stay down | until fire lifts (band falls below 20) or 2–60 s, chosen | none | none | no | recovers suppression fastest (§5.2) |
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

### 3.5 Reflex cards in combat

Tradecraft's `reflex.js` is ported as is (offer, chosen, `KEEP_S` 120 s kept answers, "Nothing: let it come" always present). A reflex is offered only out of stop motion, when the player perceives the moment coming (the check in the second column). Each option is a step of §3.4 or WEAPONS, and choosing a fighting step enters stop motion.

| Kind (`why`) | Trigger | Seen coming if | Options |
|---|---|---|---|
| `contact` | first hostile fire, or a hostile weapon raised, while you are in real time | Awareness vs `8 + rangeM / 10` (+4 from behind) | Get down · Dash to cover (named, with metres) · Weapon up · Nothing |
| `grenade` | a grenade lands or is called within 15 m | Awareness vs 10 (+6 if someone shouted "Grenade!") | Dive away (1.2 s: prone plus 1 m away) · Behind cover (named) · Kick it clear (within 1 m: CQC vs 12, 0.8 s) · Nothing |
| `lunge` | a person closes inside 3 m at more than 2 m/s | Awareness vs their Fieldcraft | Step back · Shove (CQC opening) · Muzzle strike (CQC opening with the gun) · Fire (if already aimed) · Nothing |
| `hatch` | a hatch or door opens onto you with someone behind it | Awareness vs 8 | Fire (if aimed: held) · Back off · Grab · Nothing |
| `vent` | a breach with flow within 5 m | Awareness vs 6 | Seal visor (if up: 2 s, §13.3) · Grab a handhold · Brace · Nothing |
| `friendlyLine` | a friend steps onto your line of fire as you are about to fire | always (Weapon handling's muzzle discipline, WEAPONS) | Hold fire · Fire anyway |

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

## 5. Suppression

Suppression is fear made into numbers: a fast pool that rises with every round that cracks close, every impact that spits ice beside you, every blast, and falls when the fire lifts. It costs the shooting and handling rolls, slows aiming, and makes every exposing step a test. It is how fire superiority, bounding and the buddy rush work.

### 5.1 Inputs

Per actor `supp` from 0 to 100. Each input is multiplied by `(1 − resist)`, `resist = min(0.6, WF / 150)`: WF 10 0.07, WF 30 0.2, WF 60 0.4, WF 90 and up 0.6 (my calls).

| Input | Points | Notes |
|---|---|---|
| A supersonic round passing within `FULL_M` 1 m of the head | 8 (heavy calibre 11) | the crack; linear to 0 at 5 m |
| A subsonic round (pistol, suppressed) within 1 m | 5 | linear to 0 at 3 m |
| An impact within 2 m you can see or hear | 4 | spall, ice chips, sparks |
| An explosion | `min(60, 60 × (5 / rM)²)` | 15 at 10 m, 60 at 5 m and closer |
| You are hit (armour-stopped included) | 25 | plus BODY's pain and stress |
| A squadmate hit within 10 m in your perception | 10 | |
| In vacuum | rounds ×0.4 | no crack: only what you see land (impacts count in full) |
| Training: blanks with a laser harness's near-miss tone | ×0.5 | the harness beeps; blanks make no crack (§22) |

Where a round passes is the shot's line: for an aimed miss, the miss distance at the target is `missM = 0.25 + 0.2 × (−margin)` m, at most 4 m, in a random direction perpendicular to the line (my call; WEAPONS may use it for strays). A miss by 1 cracks 0.45 m off; by 5, 1.25 m; by 10, 2.25 m. A good shooter's misses suppress hardest.

### 5.2 Decay

After `SUPP_GRACE_S` 1.5 s with no input, `supp` falls by `(3 + WF / 20)` points a second behind cover with `keeps ≥ 0.5`, at half that rate exposed, and at 1.5× that rate while doing **Stay down** (my calls).

**[computed] From pinned (75) to below 20, in good cover:** WF 0 18 s, WF 10 16 s, WF 30 12 s, WF 60 9 s, WF 100 7 s. Exposed, double.

### 5.3 Bands and effects

| Band (index) | supp | Marksmanship (shots) | Weapon handling (actions) | Aim time | Exposing steps | NPC behaviour |
|---|---|---|---|---|---|---|
| calm (0) | 0–19 | 0 | 0 | ×1 | free | as its brain decides |
| under fire (1) | 20–44 | −2 | −1 | ×1.1 | free | prefers cover; returns fire |
| suppressed (2) | 45–69 | −4 | −3 | ×1.25 | +0.4 s to start | rises to fire only on a nerve check vs 10; otherwise blind fire or stay down; moves only to cover |
| pinned (3) | 70–100 | −6 | −4 | ×1.5 | nerve check vs 15, failure loses 1.5 s | stays down, blind fire at most, crawls; below WF 5, 20% per decision to freeze for 2–6 s |

- These replace tradecraft's flat "being shot at" −4 and −3, and apply to everyone, NPCs included (tradecraft quirk 4 fixed).
- **The nerve check** is d20 + `round(WF / 4)` + help against the DC (my call; SKILLS confirms the value): +2 when your NCO or team leader is within voice or radio and has said "Up! Return fire!" in the last 5 s, which is how leaders get men up (Leadership, §8.3). Failure: the step does not start, the time is lost, the log says "You can't make yourself get up." The player chose to try; the dice decide whether the body obeys.
- **Showing it.** No meter (no omniscient UI). The instinct line names the band and offers the sensible step ("Rounds cracking close. You're pinned: stay down or crawl left to the pipes."); exposing steps on the panel show the nerve check's odds; VIEWS may tighten the vignette by band.
- **Stress.** Each second at band 2 adds 0.3 to BODY's stress need, at band 3 0.6 (my call). BODY and PEOPLE own what accumulated combat stress does after the fight.

**[computed] Rounds within 1 m needed to reach each band, from calm, with no decay:**

| WF | resist | under fire (20) | suppressed (45) | pinned (70) |
|---|---|---|---|---|
| 0 | 0 | 3 | 6 | 9 |
| 10 | 0.07 | 3 | 7 | 10 |
| 30 | 0.2 | 4 | 8 | 11 |
| 60 | 0.4 | 5 | 10 | 15 |
| 90 | 0.6 | 7 | 15 | 22 |

One automatic rifle burst of 4 cracking close puts a fresh marine under fire; two bursts within 3 s suppress him; a third pins him.

### 5.4 Area fire

Area fire is fire at a position, not a person: a window, a doorway, a corner, a last-known spot. It suppresses everyone near its line and sometimes hits.
- Each round rolls Marksmanship against `WEAPONS.shotDC(rangeM, 'torso') + AREA_DC 4`, against the most exposed occupant of the 1.5 m circle at the aim point (exposure from the cover field and posture). Suppression and body modifiers apply as usual.
- On success the round hits a random exposed part of that occupant (then WEAPONS's armour and BODY's wound).
- On failure the round passes `0.25 + 0.3 × (−margin)` m off (at most 6 m) and feeds §5.1 for everyone within reach of its line.
- An unseen target (concealment, a wall it is behind) can only be area-fired at. Bullets that penetrate the cover (§4.4) carry on into whoever is behind it.
- The log summarises a burst on one line ("Burst of 4 at the window: no hits; 3 within a metre of the man inside"), with each roll one click deeper (VIEWS).

### 5.5 Fire superiority

A side has fire superiority when the mean band of the opposing fighters it knows of is at least 2 (suppressed), or when the opposing side's rounds per 10 s, counted by those who perceived them, have fallen below 30% of its own (my call). Leaders' brains read it to bound, flank or assault (§7.7). The player feels it through the instinct line ("Their fire's slackening.").

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
| 3 | survive pinned | band 3: stay down, blind fire, crawl to better cover |
| 4 | obey | an order received and not yet done (compliance, §8.3) |
| 5 | buddy aid | a casualty within 5 m, our side not suppressed (band of the aid-giver ≤ 1), or ordered |
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
| `enter-and-clear` | stack, breach, enter, dominate, clear, mark (§7.8) |
| `clear-passage` | ship corridors and tunnels: leapfrog hatch to hatch with cross-cover; slice each corner; shafts as §7.8 |
| `casevac-under-fire` | suppress, drag to cover, care, move to the CCP (§12) |
| `hold-and-call` | hold positions, keep fire superiority, call the platoon for support |
| `consolidate` | 360° security, searches of enemy dead and wounded, detainees, the ACE report |

### 7.8 Stacking and clearing rooms and compartments

- **Stack**: up to four on the wall beside the opening, #1 nearest. The team brain orders them by role or the leader's choice; the player may be any number.
- **Before the opening** aboard ship or in a habitat: the hatch's pressure difference is read from its gauge. Doctrine (my call, after longhaul's `PRESSURE_DOOR_KPA` 15): never open across more than 15 kPa; across more than 2 kPa, equalise first (PLACES's valve, 10–60 s).
- **Breach**: open (powered hatch 1.5 s, manual dogs PLACES's time), force (ram, Fitness), cut (Demolitions, §11.6), or pick the lock (Tech). A flashbang or concussion grenade may go in first (§11.4).
- **Entry**: #1 goes to the corner the hatch's swing or the room's shape makes the path of least resistance, 1 m along the wall; #2 the opposite corner; #3 and #4 to points one third into the room along each wall. Points of domination are computed from PLACES's room polygon. Each takes the sector from its point to the far wall's middle.
- **The race.** A defender who knows the opening and holds an aim on it (WEAPONS's held bonus) fires after its reaction delay (§3.2) when the first marine crosses; a stunned one cannot. The player as #1 enters with a step ("Enter and button-hook left", 1.0 s) and is frozen at its end. Speed and the flashbang decide this, as in life.
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

Skill sheets for generated fighters come from SKILLS's NPC levels. My default mapping from longhaul's quality `q` to a class-`soldier` fighter's values, for SKILLS to confirm: Marksmanship and Weapon handling `round(4 + 14q)`, Fieldcraft and Awareness `round(3 + 12q)`, CQC `round(2 + 12q)`, WF `round(60 q²)`. Quality 0.55 gives 12, 10, 9 and WF 18; 0.75 gives 15, 12, 11 and WF 34.

### 7.10 Morale, breaking, surrender, and the protected

- **Nerve.** Each NPC fighter has `nerve` 0–1 (1 at the start). It falls by 0.1 per friend down in its perception, 0.05 per 10 s at band 3, 0.2 when flanked (a contact perceived more than 100° from its main threat), and rises 0.02 a second at band 0 near its leader (my calls). At 0.3 it **breaks**: it stops firing and moves away from the threat to the next cover and on; at 0.15 it may surrender (by type, §7.9).
- **A side breaks** when its losses reach the type's threshold (§7.9), with 50% chance per minute (longhaul's surrender cadence), and every fighter's nerve drops to 0.3.
- **Surrender**: weapon dropped, hands shown, prone if ordered. Accepting it is a step (shout "Get down! Hands!", 1.5 s), then approach, cover, restrain (§9.6).
- **Hors de combat.** A fighter who is down and not resisting, disarmed, or surrendering is protected. Shooting one is a breach of the law of armed conflict, judged in §9.7 on what the shooter perceived. Wounded enemies are disarmed, restrained and given aid after friendly casualties.
- **Wounded behaviour**: tradecraft's `wounded.js` ladder (lie, sit against a wall, flee the shooter if seen with a gun within 40 m, wait, crawl) for civilians and for fighters whose nerve has broken.

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

- **Flashbang**: everyone in the room facing it without a filtered visor is flash-blind 5 s (−6 to sight); everyone without hearing protection deafened 1–6 h; everyone unprepared **stunned** 3–6 s (CQC's state: nothing allowed) and +60 suppression. Military helmets halve the stun and negate the blindness. It can start a fire on soft furnishings (5%) (my calls).
- **Concussion** (blast only): §11.3; the room-clearing grenade aboard ship.
- **Smoke**: a concealment cloud of 8 m radius in 10 s, lasting 60–120 s in still air, cleared by ventilation in 30 s aboard ship (PLACES's air movement); a CS or OC filler adds §9.4's effect.

### 11.5 Vacuum

No air: no blast wave beyond the explosive's own gases (a metre or so), no bang, no smoke cloud that lingers (it expands away). A flashbang is a flash. Fragments carry without slowing. A concussion grenade is nearly useless. Suppression from a burst in vacuum comes only from what is seen (§5.1).

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
| `tradecraft/src/sim/shooting.js` | **adapt the mode's glue** | WEAPONS owns the resolver; COMBAT adds steps (movement, posture, area fire, watch, orders, grenades), long steps with interrupts, late notice and startle (§3) |
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
| `suppress` | §5.3's rounds-to-band table and §5.2's decay times by WF, live from the code |
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

---

## 21. Fun

**The decisions.** When to rise and fire, and when to stay down and let the AR win the fire. Whether to rush the last 12 m now or wait for the smoke. Who goes first through the hatch. Whether to throw a grenade into a room you have not seen into. How far to escalate with a miner who doesn't understand you, and whether the steps fit before he reaches the line. Whether to vent a compartment with an unsuited pirate in it. Whether to stay on Europa's surface past the dose plan to carry a man in. Whether to obey an order you think is wrong, and what you say at the hot wash. Whether to take the team when Tanaka goes down, or let the AR have it (§8.5). How hard to search at the checkpoint: thorough enough to find the detonator, or quick enough that the queue does not turn the district (§9.9). In the couch, whether to seal now or keep the visor up, whether to unstrap for the man being sick beside you, and whether to swap him your inner couch (§13.3). Every one of them is a choice the player makes and the dice execute, and every one is in the log.

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

**0.1.x, the scenes that fill the week** (ROADMAP §5.8), each scored, then joined:
- `test-lane`: the combat lifesaver lane's casualty card and a practice 9-line (§12.3).
- `test-mat`: the mat (§10, Mars gravity only).
- `test-patrol`: everything of §3 to §8 in training form.
  - Stop motion's combat steps, long steps, interrupts, late notice and startle (§3).
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
- **0.1.x**: the MOUT exercise in the training village (the slipped weekdays, sols 9 to 13): stack and clear with marking rounds (a bruise, BODY), `enter-and-clear` (§7.8), regeneration on long exercises (§2.3);
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
