# SKILLS: what a marine can do, and how well

The skill list, the one roll, Warfighting, growth, training, rust, fitness, NPC skill levels, reading people, the feel and the instinct line. DESIGN.md is the hub and wins where the two disagree.

Written 2026-11-05 from DESIGN.md and the research notes: `tradecraft-design-1.md` §10 (skills and checks, growth, rust, fitness), `tradecraft-design-2.md` §5, §6, §12 (the feel, XP, Read), `tradecraft-design-3.md` §6, §7 (tutorial, backgrounds, belief), `tradecraft-sim-combat.md` §1, §10.5, `tradecraft-sim-world.md` §8, §10.2 (perception, Read, instinct), `longhaul-shipboard.md` §13 and `longhaul-setting.md` §14, §17 (rank gates). Code read for the numbers that actually run: tradecraft `src/sim/{skills,checks,xp,training,rust,fitness,know,belief,sense,instinct}.js`, `campaign.js` (BACKGROUNDS), `career.js` (FLOORS). The tables below were computed from those formulas with a scratch script. Aligned the same day with `CONTRACTS.md`, the shared contracts (ids, the fitness module's home, the milestone numbers), which this section cites rather than restates. Revised 2026-11-06 for v0.0.4 as built (the build sheet `docs/build/0.0.4.md`): the instinct's `settle()` and its first eleven rules (§14.3, §14.4, §15.4).

Conventions. "The user, date" is the user's own words or decision. Quotes dated before 2026-11-05 were said about tradecraft and carry over as the user's tastes. "(my call)" marks this section's own choices, which hold until the user overrules them. Every value is an integer unless its name carries a unit. Every person is generated (the user, 2026-11-05: "All people generated"), so the people named in this section's examples (Pvt Okoye, Corporal Diaz, Sergeant Ruiz, Varga on the net) are examples of what PEOPLE's generator draws, never written characters. Revised 2026-11-07 for COMBAT §5's suppression and hardening (DESIGN.md's log of that day): the new §6.8 (hardening and inoculation), with pointers in the summary, §2.2, §5.3, §5.9, §6.1, §11.1, §15.1 and §17. Revised 2026-11-06: §6.2's line-career rows re-run on the 10-sol standby and the 6.9-day voyage (CONTRACTS §3, §14); the DI generated (§14.1); `hecate-line` at Ophir Chasma (§10.2).

## Summary

A marine is a sheet of sixteen skills and one over-skill, **Warfighting**. There are no attributes.
- Each skill has a **trained base** from 0 to 20 (untrained 0, course 5, advanced 10, expert 15, master 20), plus up to 4 **background** points.
- Warfighting (0 to 100) multiplies the skills that matter in a fight, each by its weight: `value = round(min(23, base + bg) × (1 + weight × WF / 100))`. Values run from 0 to 46.
- For scale: a civilian sits at 0 to 8. A private fresh from infantry school has 9 to 11 in the rifle skills, a squad leader about 18, a recon marine about 24, a raider about 31, and the best in the system 42 to 46.

Everything uncertain uses tradecraft's one roll: **d20 + value + named modifiers against a DC**. The DCs are easy 10, average 15, hard 20, very hard 25, expert 30 and elite 40.
- In a check, a natural 20 always succeeds and a natural 1 always fails.
- **Routine work** keeps the natural 1 from turning competence into friction: out of danger, on work you would make without the die, a natural 1 costs time and nothing else (§5.1). In danger, under fire and in contests the dice keep their teeth.
- **Caught 1s** (designed 2026-11-11, to build in the shoot house rework; §5.1): a natural 1 on routine work, or on any check a roller of value 15 or more would make by 10 without the die, is **caught**. It succeeds at ×1.5 of its time, so a highly skilled marine's 1 is a late shot, not a miss. A natural 20 on timed work is **clean** (×2/3), and both are drawn as plainly as each other.
- An opposed roll is decided by the two totals, and ties go to the player's side.
- Every modifier carries its reason and appears in the log.
- The body and its needs (BODY) enter every roll through one interface.

New for OLYMPUS:
- a shared vocabulary for margins;
- help from others, and group checks;
- tempo: rushed, careful, or "taken steady" (twice the time for +3 and a softer fumble; the die is always rolled);
- suit and free-fall penalties that EVA and Zero-g skill reduce;
- one pace helper for the duration of every skilled action, the chores' included;
- shown odds that always come from the same helper as the roll.

Growth runs on three tracks:
- **Warfighting grows from XP.** Real operations give most of it. Training gives a little, and stops counting at 25. The cost curve is tradecraft's: each point costs 6.25 times more every 20 points ("heavily logarithmic", the user). Every XP number in the game is in one table here (§6.2); COMBAT and CAREER name kinds and outcomes, never amounts.
- **Trained bases grow from hours**, capped by the teacher. The hours come from the Plan of the Day's training blocks, courses, manuals and use in the field (field use teaches only up to advanced). Schools also raise every skill they teach to a floor at graduation.
- **Fitness** keeps tradecraft's band of base and effective fitness, moved by the week's load, which BODY's one gravity helper scores.
- **Hardening** (2026-11-07; §6.8, COMBAT §5.6), how much of a fight's chaos a body ignores, is derived, never rolled: Warfighting's experience by class, plus an **inoculation** counter earned in training that makes noise, bangs and fire, capped by the teacher.

Skills over 15 rust unless practised twice every 28 sols (`RUST_PERIOD_MS`, the one constant for it).

**Reading people** ports tradecraft's Read: each skill read comes back as a range that holds the truth and is never centred on it. OLYMPUS adds what a uniform tells you: rank, name, badges and MCMAP belt, taken as facts and as starting guesses.

**The instinct line** has two voices: the drill instructor in your head, who is dry, and in the field your NCO on the net. One line shows at a time, the most pressing first, and it only uses what the character knows. T does what it says. Orders and customs have keys of their own (B acknowledges, F salutes), and the next line without one waits in a chip beside it (T held does it), so nothing that matters hides behind a need.

---

## 1. What the user asked for

| Date | The user | What it settles here |
|---|---|---|
| 2026-11-05 (kickoff) | "Shooting should play as in Tradecraft"; DESIGN.md, Settled: "Skills and checks are tradecraft's: d20 + skill + named modifiers against DC, no attributes, a class over-skill (**Warfighting** for soldiers), logarithmic growth, training hours, rust, and fitness with effective fitness." | The whole frame of this section |
| 2026-11-05 (kickoff) | DESIGN.md, Controls: "T: the instinct's line (the drill instructor's voice in your head, dry). In the field, your NCO's voice on comms joins it." | §14 |
| 2026-10-26 (Q115, tradecraft) | The trained scale 0 to 20 and the over-skill 0 to 100; "Soldiers: Warfighting, the tier 1 operator" at the top | §3, §4 |
| 2026-10-26 | Read: "display the guessed character sheet of someone else, analysis skill drives how good we are at it, as well as what we discovered about them" | §12 |
| 2026-10-26 | "we only know what we know"; a failed roll for signs "reads exactly as a month without signs" | §5.14, §12, §13, §14 |
| 2026-10-26 | "during combat it should automatically do READ against our opponent" | §12.1 |
| 2026-10-26, 2026-10-27 | "we need a serious instinct overhaul, it is mostly useless, giving advice that doesn't even apply to some situations"; the instinct is "the voice of training, with dry humour now and then" | §14 |
| 2026-10-27 | "background should impact starting skills by up to +4 points (an ex marine would know how to fight)" | §10 |
| 2026-10-27 | "pass the time things should be natural and time should feel like a currency" | §6.3 to §6.5 |
| 2026-10-28 | "what we see is what our character evaluates as being true" | §12.3 (mood read as words with a confidence) |
| 2026-10-28 | "'T' as a universal key interferes when several things can be done with it" (T and R were split) | §14.1 (the chip, B for orders, F for customs) |
| 2026-11-03 | "All actions on a weapon should require rolls against weapon handling"; "close to the table we should be able to do things like recondition magazines, take bullets out of magazine, unload the gun … all of these actions can fail with varying consequences depending on weapons skill" | §5.1 (routine work), §5.9 (steady never removes the roll) |
| 2026-11-03 | "tradecraft increase should be heavily logarithmic, taking A LOT of missions to improve significantly as we get better … difficulty and risk increase the amount of XP … each successful roll should bring in some XP (very little comparatively)" | §6.2 |
| 2026-11-03 | "skills higher than 15 but unused for over four weeks become 'rusty' and require some amount of practice to restore their full bonus … Getting into a fight in the world counts as two fight sessions in a club" | §7 |
| 2026-11-03 | "fitness should remain a skill, but there should be a shadow skill called effective fitness … The higher we go the harder it gets to exceed base fitness" | §8 |
| 2026-11-03 | "extreme fatigue (like from not sleeping for too long) should chip away at skill efficiency" | §5.4 (now a named modifier) |
| 2026-11-03 | "high skill makes this virtually instant"; "high weapons skill should at least protect in ways of muzzle discipline" | §5.12, §2.1, §5.1 (routine work) |
| 2026-11-04 | "core spy skills … should all be bumped out of rust by any spy assignment"; "we should add activities and clubs to work on each one" | §7 (ops clear core rust; blocks keep skills) |
| 2026-11-04 | "every first aid action should also take time proportionally to medicine skill" | §5.12 (one pace helper) |
| 2026-11-04 | "the marine in ambassy reads as a civilian, they are military that should count for something" | §4, §11 (classes and their levels) |
| 2026-11-04 | The illegal's school: "their tradecraft is boosted to 80 as they end their illegal training" | §6.6 (schools set floors) |
| tradecraft debrief | The worries: "clunky mechanics, an inconsistent experience, empty gameplay"; "every number means the same thing everywhere: one shared helper per quantity" | One helper per quantity throughout |

---

## 2. The skill list

### 2.1 Shooting and weapon handling are two skills (my call)

Tradecraft had one skill, Weapon handling, for both the manipulations and the shot. OLYMPUS splits it into **Marksmanship** and **Weapon handling**, for four reasons:
1. **They are different abilities, trained differently.** Real Marine marksmanship training keeps the known-distance course (position, sight picture, trigger, breathing, wind and range) apart from weapons handling (condition codes, reloads, immediate action, safety). A crack shot can fumble a reload under stress, and an armourer who can strip any weapon blind may shoot an ordinary group.
2. **Handling is what daily life is made of.** The brief asks for "managing safety, muzzle discipline … reloading being a remove magazine, put other magazine … clear chamber, aim the gun". On base, most of a marine's weapon rolls are handling: drawing from the armoury, condition checks, cleaning, carrying, showing clear. Almost none is a shot. With one skill, barracks life would hardly move it and only the range would. With two, the armoury, the cleaning bench and dry-fire drills train Weapon handling, and the range trains Marksmanship. Each has a reason of its own to be kept up.
3. **It makes choices.** A free hour can go to the range or to the dry-fire bench. MOSs get identities: the machine gunner's handling, the sniper's marksmanship.
4. **It keeps stop motion readable.** Every step's time and fumble is Weapon handling. The trigger pull's hit is Marksmanship. The step panel names which skill each step rolls.

The cost is one more number on the sheet. Tradecraft could do with one because guns were rare there. This is open question 1.

The two skills share the work as follows. WEAPONS owns every DC and time.
- **Weapon handling:** drawing and stowing; safety and selector; magazine out and in; chambering; the press-check; stoppage drills; bolt and cylinder work; presenting the gun to aim (the mount and the turn, tradecraft's `aimMs`); muzzle discipline (the chance a fumbled discharge goes somewhere safe, and the sweep checks of carry posture); cleaning, inspection and field stripping; filling magazines; armoury procedure; arming a grenade.
- **Marksmanship:** the shot's hit roll against WEAPONS's DC; how fast a held aim steadies; control of follow-up shots (tradecraft's `climbOf` and the double- and triple-tap thresholds); estimating range and wind; holdover in low g; zeroing optics; where a thrown grenade lands.

### 2.2 The sixteen skills

`uses` says which parts of the body a skill needs. BODY turns wounds into penalties by these uses (§5.4). **WF** is the Warfighting weight (§4.2). **Rusts** means the skill takes rust over 15 (§7).

| Key | Name | What it covers | Rolled for (examples; owner) | Uses | WF | Rusts |
|---|---|---|---|---|---|---|
| `marksmanship` | Marksmanship | Putting rounds where you mean them | each shot (WEAPONS); range and wind estimates; zeroing; a thrown grenade's landing | eyes, arms, breath | 1 | yes |
| `weapons` | Weapon handling | Everything done to a weapon | each handling step, fumbles, muzzle discipline (WEAPONS); cleaning and inspection; armoury | hands, eyes | 1 | yes |
| `cqc` | Close combat | Unarmed, knife, bayonet, rifle butt, restraint holds, CQC in suits and low g | each CQC exchange, restraint, disarm (COMBAT) | all | 0.8 | yes |
| `fieldcraft` | Fieldcraft | Moving unseen, using cover, camouflage, noise and light discipline, land navigation, reading tracks and signs, digging in, living outdoors, blending in plain clothes | stealth against Awareness (opposed), navigation, tracking, a hide, choosing a fire position | legs, eyes | 1 | yes |
| `awareness` | Awareness | Noticing: the view cone and awareness radius, spotting, searching, hearing, recognising a threat, the feel | spotting a hidden man or an IED, reading a tell, a search, the reflex trigger, seeing insignia at range | eyes, ears, head | 1 | yes |
| `tactics` | Tactics | Reading and shaping a fight: where the fire comes from, how many, what they will do; battle drills; planning; fire control | estimating shooters from the sound (crack-thump), contact estimates, the plan's bonus, abstract engagements (COMBAT), the tier of the instinct's tactical advice | head | 0.8 | yes |
| `leadership` | Leadership | Getting people to act under stress: command presence, orders, rallying, teaching, discipline | orders under fire and rallying (COMBAT, PEOPLE), the instructor factor in training (§6.3), counselling | voice, head | 0.6 | yes |
| `social` | Social | Reading people and working them: persuasion, de-escalation, lying and catching lies, questioning, negotiation, manners with civilians | conversation approaches (PEOPLE), escalation of force at its talking end (COMBAT), checkpoint questioning, lying to your NCO | face, voice, head | 0.2 | yes |
| `comms` | Comms | Radio and datalink procedure, fire and medevac requests, relays and antennas, crypto, electronic warfare | call for fire or 9-line accuracy and time, contact report quality, setting up an under-ice relay, jamming (opposed) | hands, voice, head | 0.4 | yes |
| `tech` | Tech | Machines and systems: damage control (patching, fire, power, atmosphere), repair, terminals, sensors, drones, locks | patching a breach, restarting a scrubber, bypassing a hatch, finding a fault (PLACES) | hands, eyes, head | 0.2 | yes |
| `medicine` | Medicine | First aid through combat casualty care: diagnosis, stopping bleeding, airway, chest seals, splints, drugs | each aid step and the diagnostic look (BODY) | hands, eyes, head | 0.4 | yes |
| `eva` | EVA | Suit work: donning, seal checks, suit faults, consumables, airlocks, tethers, working in gloves, moving on a surface in a suit, manoeuvring packs | the suit check at the locker, fault diagnosis, patching your own suit, a manual airlock cycle; reduces suit penalties (§5.13) | hands, head | 0.5 | yes |
| `zerog` | Zero-g | Free fall and very low g (below 0.2 G): push-offs, handholds, mag boots, braking, orientation, bounding, anchoring against recoil | a push-off's accuracy, a grab, a mag-boot step under fire, a landing; reduces free-fall penalties (§5.13) | arms, legs | 0.5 | yes |
| `demolitions` | Demolitions | Explosives: charges, breaching, hull and hatch cutting charges, recognising and making safe IEDs, demolition safety | priming and placing a charge, sizing a breach, rendering safe (COMBAT, WEAPONS) | hands, head | 0.4 | yes |
| `driving` | Driving | Ground and ice vehicles: rovers, trucks, crawlers, sleds under the ice; convoy driving; field repair of vehicles (with Tech) | hazards, dust storms, ice ridges, driving under fire | hands, eyes, head | 0.3 | yes |
| `fitness` | Fitness | The trained body: strength, endurance, recovery. Its value is *effective* fitness (§8) | marches, carries, climbs, sprints, dragging a casualty (BODY); BODY's capacities | legs, torso, breath, arms | 0 | no (own band) |

There is also one **derived** value that is not trained: **Nerve** = `round(WF × NERVE_K[cls])`. `NERVE_K` is soldier 0.25, cop, criminal and spook 0.2, spacer 0.12, and civilian 0 (as built in v0.0.9 it lives in `src/sim/combat/supp.js`, `SUPP_HOME`'s one home of the constants, not in skills: skills may not import combat). COMBAT rolls it for suppression, first contact, a grenade landing close and a breach (my call). It is Warfighting's steadiness under fire, with its own name in the log: "Nerve check: 12 + 4 = 16 against 19 (pinned), failure." **From 2026-11-07** (COMBAT §5.3) the one `nerveCheck` rolls it against `1 + round(felt / 5)`, felt being the chaos less your hardening, so the modifier "shot at" is gone from it (the chaos is in the DC); hardening's experience term reads the same classes (`HARD_K` = 3 × `NERVE_K`, §6.8). Three words, one meaning each (COMBAT §5.6): **Nerve** this value; **the nerve axis** PEOPLE §3.6's temperament (it adds to hardening only); **resolve** COMBAT §7.10's NPC state.

**Languages** are a separate track with five levels (§9).

**What changed from tradecraft's list** (all my call):
- *Deception* is split: lying goes to Social, and staying unseen and blending in go to Fieldcraft. A marine's covert work is mostly moving unseen, not living a legend.
- *Tracking* and *Pathfinding* become Fieldcraft (signs, tracks, navigation) and Awareness (spotting a follower).
- *Analysis* is dropped. Reading a fight goes to Tactics, reading a body to Awareness, and reading a mind to Social.
- *Tech* is kept and widened to damage control.
- New skills: Marksmanship, Fieldcraft, Tactics, Leadership, Comms, EVA, Zero-g, Demolitions, Driving.
- The list is data, as tradecraft's was ("more may come and some may merge, so the list must scale"). A skill added later reaches old saves as `[0, 0]` through `upgradeState`.

### 2.3 Trained levels in words

The sheet calls a base by its level: **untrained** 0 to 4, **course** 5 to 9, **advanced** 10 to 14, **expert** 15 to 19, **master** 20. These are tradecraft's `TRAINED` steps, used as bands. Schools and badges refer to these words.

---

## 3. A skill's value

```
own(p, k)    = min(OWN_MAX 23, base + bg)                    (fitness: + p.fit.off, its weekly band, §8)
raw(p, k)    = round(own × (1 + W[p.cls][k] × p.os / 100))   (p.os is the over-skill, Warfighting for a soldier)
value(p, k)  = max(0, raw − rustOff(p, k, raw))               (§7)
```

- `base` runs from 0 to 20 (`BASE_MAX`). It rises through training hours and school floors, and never falls except Fitness's base (§8).
- `bg` runs from 0 to 4 (`BG_MAX`, the user's "+4"). These are background points, shown on the sheet as ◆. They never fade: an ex-mechanic stays a better mechanic. `OWN_MAX 23` keeps the top at tradecraft's 46.
- The practice slot is gone (my call). Tradecraft kept "practice 0 to 3" as dots that did nothing after generation. OLYMPUS keeps the two things that vary for real: background points (◆) and rust (§7).
- **Fatigue is no longer folded into the value.** Tradecraft subtracted `sheet.strain` silently inside `skill()`. In OLYMPUS, being tired is a named modifier from BODY's needs (§5.4), so it shows in the log like everything else (my call).
- `value()` is the one helper. Every screen, roll and NPC decision reads it. Nothing else multiplies skills.

**Values by own points and Warfighting, weight 1** (`round(own × (1 + WF/100))`):

| own \ WF | 0 | 10 | 15 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 5 | 6 | 6 | 6 | 7 | 7 | 8 | 8 | 9 | 9 | 10 | 10 |
| 8 | 8 | 9 | 9 | 10 | 10 | 11 | 12 | 13 | 14 | 14 | 15 | 16 |
| 10 | 10 | 11 | 12 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
| 12 | 12 | 13 | 14 | 14 | 16 | 17 | 18 | 19 | 20 | 22 | 23 | 24 |
| 14 | 14 | 15 | 16 | 17 | 18 | 20 | 21 | 22 | 24 | 25 | 27 | 28 |
| 16 | 16 | 18 | 18 | 19 | 21 | 22 | 24 | 26 | 27 | 29 | 30 | 32 |
| 18 | 18 | 20 | 21 | 22 | 23 | 25 | 27 | 29 | 31 | 32 | 34 | 36 |
| 20 | 20 | 22 | 23 | 24 | 26 | 28 | 30 | 32 | 34 | 36 | 38 | 40 |
| 23 | 23 | 25 | 26 | 28 | 30 | 32 | 35 | 37 | 39 | 41 | 44 | 46 |

---

## 4. Classes and over-skills

### 4.1 Classes

Each person has one class (`p.cls`). The class names the over-skill and holds its weight table. A civilian has no over-skill, so their skills stay at their plain sums, which keeps them low (tradecraft's rule). The player is always a `soldier`.

| Class | Over-skill | Who | Main weights |
|---|---|---|---|
| `soldier` | **Warfighting** | Marines of every force; UN Marines; insurgent and militia fighters; FMF corpsmen | §4.2 |
| `spacer` | **Spacecraft** (my call) | Navy ratings and crews, merchant crews, Belter ice miners | eva 1, zerog 1, tech 0.8, comms 0.5, medicine 0.3, driving 0.3, awareness 0.3, weapons 0.2 |
| `cop` | **Intuition** | Martian Security (MSS), ice-town constables, corporate security | awareness 1, social 1, cqc 0.6, fieldcraft 0.6, tactics 0.5, weapons 0.5, marksmanship 0.5, driving 0.4, comms 0.3, medicine 0.2 |
| `criminal` | **Streetwise** | Pirate clans, smugglers, gangs | social 1, awareness 0.8, cqc 0.8, weapons 0.6, fieldcraft 0.6, marksmanship 0.5, zerog 0.5, eva 0.4, tech 0.3, demolitions 0.3 |
| `spook` | **Tradecraft** | MNI and UN intelligence officers (rare) | awareness 1, fieldcraft 1, social 1, tactics 0.6, cqc 0.5, weapons 0.5, marksmanship 0.5, comms 0.3, tech 0.3 |
| `civilian` | none | Everyone else | none |

All weights not listed are 0. Tradecraft's four over-skills keep their names (Warfighting, Tradecraft, Intuition, Streetwise). Spacecraft is new, because the Navy and the Belt need an experience that multiplies vacuum work rather than fighting.

### 4.2 Warfighting's weights (my call; tradecraft left them empty: `soldier: { overskill: 'Warfighting', weights: {} }`)

Warfighting is combat experience and the mindset a fighting force drills in. It multiplies a skill by how much fighting experience improves that skill at the same trained base.

| Weight | Skills | Why |
|---|---|---|
| 1 | Marksmanship, Weapon handling, Fieldcraft, Awareness | The "core four" that keep a marine alive. Experience does the most for them: the shot under stress, the hands working without thought, moving like the enemy is there, seeing him first. They mirror tradecraft's core four. |
| 0.8 | CQC, Tactics | A real fight teaches the body and the reading of a fight, but schools set most of their level. |
| 0.6 | Leadership | Leading under fire grows with fights seen, though people skills come from elsewhere too. |
| 0.5 | EVA, Zero-g | MCRN marines fight in vacuum and free fall (boarding is their trade), so experience there counts. Most suit work is still craft. |
| 0.4 | Medicine, Comms, Demolitions | Under fire, an experienced hand stays calm with a tourniquet, a radio or a charge. The knowledge itself is school work. |
| 0.3 | Driving | Driving under fire. |
| 0.2 | Social, Tech | A veteran reads a crowd at a checkpoint and fixes things under pressure a little better. Little more. |
| 0 | Fitness | The body is the body. It is kept by PT, not by fights. |

With these weights, a raider at WF 75 with an expert base (own 18) shoots at 32 and talks at 7 + 1. A pure veteran is not a diplomat.

---

## 5. The check

### 5.1 The roll

Ported from tradecraft `src/sim/checks.js` with its maths unchanged:
- **check(rng, { skill, value, dc, mods, body, hook, tempo, pressure, help })**: roll d20, then `total = roll + value + Σ mods.v`.
  - A natural 20 always succeeds and a natural 1 always fails (on routine work it fails at the cost of time only, below). Otherwise the check succeeds when `total ≥ dc` (halved by a hook, §5.7).
  - `margin = total − dc`.
- **opposed(rng, ours, theirs, { hook, them })**: both sides roll, and the higher total wins. Naturals don't decide an opposed roll.
  - Ties go to the first side. The caller always makes the player's side the first, so ties go to the player.
  - Between two NPCs, ties go to the side that keeps things as they are: the defender or the watcher (my call).
  - Tradecraft's reason, kept: "If naturals won outright, every contest would fail at least one time in ten whatever the skills."
  - `them: true` marks a roll someone else made against the player, so that `won()` reads it the right way round.
- A roll is plain data, stored in the log as it is (§15.2).
- **Odds of a check**: `p = clamp((21 − (dc − value − Σmods)) / 20, 0.05, 0.95)`. The check succeeds 95% of the time once `value + mods ≥ dc − 2` (only a natural 1 fails), and 5% (a natural 20) once `dc − value − mods ≥ 20`.

| value + mods − DC | −20 | −16 | −12 | −10 | −8 | −6 | −4 | −2 | 0 and up |
|---|---|---|---|---|---|---|---|---|---|
| success | 5% | 25% | 45% | 55% | 65% | 75% | 85% | 95% | 95% |

**Opposed odds** (two d20s, ties to us, our value minus theirs after mods):

| ours − theirs | −16 | −12 | −10 | −8 | −6 | −4 | −2 | 0 | +2 | +4 | +6 | +8 | +10 | +12 | +16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| we win | 3% | 9% | 14% | 20% | 26% | 34% | 43% | 53% | 62% | 70% | 77% | 84% | 89% | 93% | 99% |

**Routine work** (my call, on a critic's finding; the user: "high skill makes this virtually instant", 2026-11-03). Without it, "a natural 1 always fails" makes every trained hand fumble one step in twenty. WEAPONS's UNLOAD is seven rolled sub-steps and UNLOAD SHOW CLEAR about eleven, so 30% and 43% of them would halt on a fumble whatever the skill, and the armoury's serial readback (Awareness DC 5) or a posture change (DC 3) would go wrong one time in twenty for a sergeant. So:
- A check is **routine** for the roller when `value + Σmods ≥ dc + ROUTINE_AT`, with `ROUTINE_AT` 0: they would make it without the die. The sum leaves out `tempo` modifiers (a way of working doesn't make a task routine), and a `rushed` roll is never routine.
- It applies only at pressure `none` or `evaluated` (§5.9), and only to **procedure**: work whose failure the owner prices in time (handling steps, bench and armoury work, the habit check of carry, the suit check, aid steps, repairs). It never applies to a shot's hit roll or a throw (a flier is part of shooting), to noticing and spotting (a failure there already costs only the next look), or to opposed rolls (which have no naturals).
- The roll records `routine: true` whenever the check was routine (§15.2). A routine natural 1 is still a `miss` (no roll XP, logged as such). The owner charges the miss's time (×1.6 on timed work, §5.12) and **nothing else**: no `?` on the weapon card, no drop, no flag, no lost rounds, no bent lip. The step is done, so a macro does not halt on it and there is nothing to retry. **From the shoot house rework it is caught** (below, designed 2026-11-11): `ok: true` at ×1.5 time, drawn `~`, never ✗.
- At `danger` and `fire`, naturals keep their teeth for everyone, and so does every check that is not routine: a recruit at the bench, a private exhausted and cold in the dark.
- The step panel may mark a routine step with the word "routine" instead of its 95% (VIEWS). The log: "Weapon handling check: 1 + 10 = 11 against 8, a natural 1: routine, it only cost time."

The critic proposed `ROUTINE_AT` 10. I rejected that number: no handling DC is low enough for a private at value 10 to clear it by 10, so his UNLOAD SHOW CLEAR would still halt 43% of the time, against the critic's own targets (under 3% at value 10, under 1% at 18). With WEAPONS's DCs as they stand (the charge at DC 8 is the hardest step), any threshold up to 2 meets them at value 10. I take 0 because it also covers a private fresh from school at 9 (the player's own start, §10.4), it leaves room if WEAPONS moves a DC, and it reads in one phrase.

**Fumbles per UNLOAD SHOW CLEAR** [computed; the eleven rolls are UNLOAD's seven (safety 6, magazine out to a pouch 7, lock back 6, inspect the chamber 6, bolt release 6, safety 6, port cover 3), then bolt release 6, charge 8, safety 6, port cover 3; "halts" is any failure that stops the macro, "with a `?` or a drop" any that leaves a consequence; pressure `none` or `evaluated`]:

| Weapon handling | Rested, in the light: before | with routine work | Exhausted (−3), cold hands (−2), in the dark (−2, inspect DC +4): before | with routine work |
|---|---|---|---|---|
| recruit, 4 | 52% halts, 40% with a `?` or a drop | 47%, 38% | 99.7%, 96% | 99.7%, 96% |
| private, 10 | 43%, 19% | **0%, 0%** (0.55 steps a run cost ×1.6 time) | 77%, 57% | 75%, 57% |
| sergeant, 18 | 43%, 19% | **0%, 0%** | 43%, 19% | 0%, 0% |

A recruit still needs luck, a tired private in the dark still drops magazines and loses track of his chamber, and a trained hand in good conditions is only ever slow. In danger, nothing is routine.

#### Caught 1s: a natural 1 a trained hand recovers

**Designed 2026-11-11, to build in the shoot house rework.** The user, 2026-11-11, playing v0.0.12's shoot house: "nat 1s are insanely frequent, much much more than nat 20s. Besides, there should be some kind of perk of high skilled operators preventing a nat 1 from making them miss, maybe they take 50% longer to shoot instead of missing altogether" (DESIGN.md's log).

**What the count found** [measured 2026-11-11: 352,722 d20s counted at `d20()` over 6,600 headless runs of the shoot house, Pairs and test-handling on every sheet, and 800 runs read through the panel's own marks; the scratch scripts in `.run/nat1/`]. **There is no bug in the dice.** Natural 1s came up on 4.92% of rolls and natural 20s on 5.00%. Once the draws that seeds share across sheets are counted once, the 152,788 distinct draws give 4.99% and 5.02%. Ten million draws of the generator alone give 5.007% and 4.999%. Nothing re-rolls, keeps the lower die or draws again on a 1, except the fumble ladder's own die (WEAPONS §5.4), which is not a d20. The cause is the rule and what the screen shows:
- **From the private up, every failure is a 1 and no 20 does anything.** Faces 2 to 19 pass on 99.5 to 100% of shots and on every routine handling roll. So natural 1s make 93 to 100% of the misses and every fumble. A natural 20 turned a failure into a success 0 times in about 259,000 player checks. In the house the tier one misses 5.6% of his shots and the corporal 5.1%, so skill above the private's bought nothing against the 1.
- **Every 1 is drawn and no 20 is.** A routine 1 is a red ✗ on the panel's ticks (1,254 of 1,254). It stays on the row and on the weapon card for 3 s, its bar runs long, and J says "routine, slow". A shot's 1 is an amber toast and a miss on the hit card. A 20 shows ◦ or ✓ like any other pass, and only J and a hit's toast name it.
- **One press rolls several dice.** LOAD rolls 3, MAKE READY 4 and UNLOAD SHOW CLEAR 9, so 14%, 18.5% and 37% of those presses show a ✗, for the private and the tier one alike. The house adds a ✗ of its own once a lane: the instructor's dummy round clicks, a stoppage drawn as if it were a fumble.

**The rule.** A natural 1 is **caught** when the roller would have made the roll without the die, by enough. Either:
- **routine** (above): procedure at pressure `none` or `evaluated`, not rushed, with value + modifiers ≥ DC + `ROUTINE_AT` 0, whatever the value; or
- **mastered**: any check with a DC (never an opposed roll), at any pressure, not rushed, by a roller whose value is at least **`MASTERY_MIN` 15** and whose value + modifiers reach **DC + `MASTERY_AT` 10**. The modifiers are the roll's own list, the felt chaos's entry included and the tempo's left out (as for routine work).

**What a catch does.**
- **It succeeds.** The record keeps `roll: 1` and `nat: 1` and gains `caught: true` and `ok: true`. Its total and margin stand as rolled, and its grade comes from the margin alone. A routine catch is at least a `pass`; a mastered catch is `superb`, since its margin is at least 11.
- **It costs ×1.5 of the action's own time** (`CATCH_K` 0.5, the user's "50% longer") **and nothing else**: no `?`, no drop, no halt, no flag, no lost round.
- **It earns no roll XP**, because the die taught nothing, and it counts as use for rust (§7).
- **The owner says what "the action's own time" is**: a handling sub-step's time; a round's part of its row (WEAPONS §7.6, §7.10); a take-in's time. A natural 1 on a take-in already cost ×1.5 (COMBAT §25.4.2), so its figure is unchanged and only its words become the catch's.
- **It replaces the routine natural 1's `miss` at ×1.6**, so a caught 1 has one number. `FUMBLE_K`'s ×1.6 stays for every failure.
- **A caught 1 is late, not certain.** The time is spent before the action lands, so a shot whose 1 is caught leaves late and is judged by the world when it leaves. A turner that has turned away takes it into the berm, and a man who fires in that time fires first.

**Why these numbers** (my call):
- **A margin, not a rank.** The test is the roll's own sum, so the perk follows the task. A sergeant's 1 is caught on a torso at 4 m, but a 1 on a head under fire still misses. The felt chaos's entry is in the sum, so suppression takes the perk away before it takes the hit: in the live room (felt 40, −4) the corporal keeps none of it and the Raider all of it. 10 is §5.6's `superb`: a roll the marine would make by ten without the die. (It is the number the critic proposed for `ROUTINE_AT`, rejected there because routine work must cover the private; here it marks the expert, which is what it measures.)
- **The floor of 15** keeps it a perk of the highly trained, as the user asked ("high skilled operators"). Without it, a private at 10, prone with his aim held (+8), on a torso at 7 m (DC 6) would clear the margin. He keeps his 1s: that is the gap a corporal's training closes.
- **Not rushed.** Rushing trades the recovery for time, so a rushed roll is neither routine nor caught. Shift on a Raider's Pair buys 0.6 of its time and puts the natural 1's miss back in.
- **At every pressure.** Routine work stays out of danger. Mastery is the skilled man's in the fight as well, which is where the user wants it.
- **For everyone.** The rule is in `check()`, so it holds for NPCs too: the #2, the instructor, and a tier-one enemy, whose 1 is a late shot, not a free miss.
- **It does not reach the scored scenes' character.** The recruit (4) and the private (10) never reach `MASTERY_MIN`. Their hands still fail under chaos, and the suppression and hardening scored 100 rest on those two sheets.

**Natural 20s, as plain as 1s** (my call; open question 8).
- **On timed procedure, a natural 20 is clean**: the action takes ×2/3 of its time (`CLEAN_K` 1/3, the catch's inverse). Together, caught 1s and clean 20s move a long run's mean time by +0.8%.
- **Its tick is a ★** (VIEWS §7.4).
- **On a shot**, a natural 20 is shown (★ on the round's tick, and "(a natural 20)" in its toast) and lands where its margin puts it. It has no time effect, because the round has already gone.
- **A natural 20 that would have failed** is still a `pass` at margin 0, and the toast says so: "saved by a natural 20".

**The numbers** [shots and handling measured on the counted checks of the shoot house's bot and Pairs' bot (300 seeds a sheet each), with the rule applied to each recorded roll's sum (`.run/nat1/design/rule.mjs`); the live room and the show-clear computed]:

| Sheet (Marksmanship, Weapon handling) | A round in the shoot house: missed, before → after | A round in Pairs | Rounds whose 1 would be caught, house / Pairs | A catch on Fire from aimed (COMBAT §25.6.2) | The live room at 4 m (−8, COMBAT §25.6.3): torso, head missed, before → after |
|---|---|---|---|---|---|
| boot recruit (4, 4) | 16.9% → 16.9% | 6.8% → 6.8% | 0 / 0 | (never) | (not in COMBAT §25.6.3's table) |
| private (10, 10) | 5.8% → 5.8% | 4.6% → 4.6% | 0 / 0 | (never) | 15%, 45% → 15%, 45% |
| corporal (15, 15) | 5.1% → 3.8% | 4.5% → 0.3% | 27% / 94% | +0.18 s | 5%, 20% → 5%, 20% |
| sergeant (19, 19) | 5.5% → 1.4% | 4.5% → 0.3% | 73% / 94% | +0.17 s | 5%, 5% → 5%, 5% |
| Raider (31, 31) | 5.6% → 0% | 4.5% → 0% | 100% / 100% | +0.15 s | 5%, 5% → 0%, 0% |
| tier one (42, 42) | 5.7% → 0% | 4.5% → 0% | 100% / 100% | +0.13 s | 5%, 5% → 0%, 0% |

**UNLOAD SHOW CLEAR's eleven rolls (the table above), the share that halts on a failure**:

| Weapon handling | On the range, rested, in the light (`evaluated`) | At `fire`, calm hands | At `fire`, felt 40 (−4) |
|---|---|---|---|
| recruit, 4 | 47% → 47% | 52% → 52% | 95% → 95% |
| private, 10 | 0% → 0% (a ✗ shown on 43% → 0%) | 43% → 43% | 43% → 43% |
| corporal, 15 | 0% → 0% | 43% → 37% (the port covers, DC 3, caught) | 43% → 43% |
| sergeant, 19 | 0% → 0% | 43% → 0% | 43% → 37% |
| Raider, 31; tier one, 42 | 0% → 0% | 43% → 0% | 43% → 0% |

**What the panel shows, per run** [the 800 runs above, re-marked by VIEWS §7.4's new marks]:

| Play | ✗, before → after | Caught 1s (`~`) | Natural 20s (★) |
|---|---|---|---|
| house, private by the keys | 2.38 → 0.53 (his shot misses, now on the round's tick; the routine 1s become catches and the dummy click a `!`) | 1.38 | 1.77 |
| house, tier one by T | 2.00 → 0 | 1.42 | 1.39 |
| Pairs, private | 2.07 → 1.04 (his shot misses) | 2.07 | 2.96 |
| Pairs, tier one | 1.82 → 0 | 2.86 | 2.69 |

So the 1 and the 20 are now seen about equally often. A ✗ means a failure that cost something, and from the corporal up it is the margin, not the die, that decides how often a shot misses. **Rolls per press are kept** (WEAPONS §5.3: each sub-step rolled, the user's rule in tradecraft, "All actions on a weapon should require rolls against weapon handling"). With caught 1s no longer drawn as failures, the count costs a trained hand time, not crosses, and the recruit keeps his texture.

**Tests** (to build with it, each printing its numbers): `catches` holds the rule's two tests (routine; mastered at `MASTERY_MIN` and `MASTERY_AT`, not rushed, any pressure, never opposed) and the record's fields. Over 400 seeded rolls a cell, it holds that a mastered 1 never fails and costs ×1.5, that the recruit's and the private's rates do not move, and it prints the first table's shoot house column on 100 seeds of the house bot. `catch-marks` holds that a routine or mastered 1 draws `~` and never ✗, a 20 draws ★, and the dummy click draws `!`. Pinned digests and goldens of the corporal's sheet and above move, and are reprinted and said so in CHANGELOG.md.

### 5.2 DCs, and what each feels like by skill

`DC = { easy 10, average 15, hard 20, veryHard 25, expert 30, elite 40 }`, tradecraft's table unchanged. Owners set their own DCs. This ladder keeps them consistent with one another, so that "hard" means the same thing in every section (my call; the examples are guidance).

| Skill | Easy 10 | Average 15 | Hard 20 | Very hard 25 | Expert 30 and up |
|---|---|---|---|---|---|
| Marksmanship | a torso at 25 m from a rest | a torso at 100 m standing | a head at 100 m, or a torso at 300 m prone | a running man at 200 m | a visor slit at 300 m; 40: a kilometre in a crosswind |
| Weapon handling | a magazine change at the bench | a reload on the move | a double feed cleared by feel in the dark | field stripping in hard-suit gloves | a seized bolt freed one-handed under fire |
| CQC | a restraint hold on a compliant detainee | a takedown on a resisting civilian | taking a knife off a man | a choke on a trained man in armour | (most CQC is opposed) |
| Fieldcraft | finding your way round the base by its signs | a night march by compass | holding a hide for a sol | navigating under Europa's ice without a map | leaving no sign in fresh dust |
| Awareness | a man running | a pistol under a coat at 5 m | a camouflaged IED | a sniper's hide at 300 m | a contact behind a bulkhead (the feel has its own DCs, §13) |
| Tactics | where the fire comes from when it is close and loud | how many shooters, from the sound | a shooter's range by crack-thump | reading an ambush before it springs | reading a professional enemy's plan |
| Leadership | getting a rested squad moving | getting a scared man up from cover | stopping a panic | rallying a broken squad under fire | holding a mutinous unit |
| Social | small talk with a Belter shopkeeper | talking a checkpoint crowd into a queue | talking a man into putting the gun down | a lie to a suspicious officer (often opposed) | turning a hostile crowd |
| Comms | a radio check | a contact report | a call for fire, right the first time | an under-ice relay through jamming | breaking an enemy net's procedure |
| Tech | resetting a tripped breaker | patching a hand-sized hole in a pressure wall | restarting a scrubber with a dead controller | bypassing a hatch interlock | rigging life support from parts |
| Medicine | a tourniquet on a limb | a chest seal | a needle decompression | a surgical airway in a suit | (BODY sets every aid DC) |
| EVA | the suit check at the locker | finding a seal fault by feel | patching your own suit against a 10 kPa leak | a manual airlock cycle in the dark | a suit swap in vacuum |
| Zero-g | a push-off to a handhold 3 m away | a 10 m push-off to a hatch | catching a tumbling crewmate | an aimed shot from a free float without spin (with Marksmanship) | a 30 m crossing in a spinning hull |
| Demolitions | priming a standard charge | a breaching charge on a door | a hull-cutting charge that doesn't vent the next compartment | rendering an IED safe | an unknown device with an anti-handling switch |
| Driving | a rover on a graded road | a dust storm at walking pace | an ice ridge at speed | evasive driving under fire | a crawler on a collapsing ice shelf |
| Fitness | 10 km with 20 kg on Mars | a casualty carried 100 m | a 2 m climb in a hard suit | a 30 km forced march | (BODY sets every endurance DC) |

### 5.3 Modifiers

Every modifier is `{ why, v, src }`:
- `why` is a few plain words, at most 32 characters ("dusk", "tired", "shot at", "gloves (EVA 12)").
- `v` is a whole number and never 0.
- `src` is one of: `task`, `env`, `gear`, `body`, `need`, `people`, `help`, `tempo`, `retry`.

They are listed in that order, so the log always reads the same way:

```
mods = [ ...task   (the owner: range, part, cover, an awkward position, the plan's bonus)
       , ...env    (PLACES's helpers: light, gravity regime, atmosphere, noise, smoke, dust)
       , ...gear   (BODY's suit and helmet, WEAPONS's optic and weapon familiarity; mitigated by skill, §5.13)
       , ...body   (BODY: wounds, pain, blood, air, G, heat and cold, drugs)
       , ...need   (BODY: fatigue, hunger, thirst, bladder, stress)
       , ...people (PEOPLE: their gauges toward you in social rolls; a leader's brief)
       , ...help, ...tempo, ...retry ]                     (and the hook, which acts on the DC, last)
```

Rules (my call, after tradecraft's practice):
- **One entry per cause.** The owner merges its own causes, so a wounded arm gives one entry, not three. Two different causes stay separate ("dusk" and "dust").
- **Light, gravity and atmosphere come from PLACES's one helper for each.** It is the same helper the renderer uses, so that "what you see is what's rolled" (tradecraft).
- **Odds and rolls use the same list.** A displayed chance includes the body and needs. This fixes tradecraft quirk 1, where the shot plaque left them out.
- **No cap on the sum.** Someone in shock, exhausted and one-handed is useless, and the log says why.
- **The chaos is one entry** (2026-11-07, COMBAT §5.3): `{ why: 'suppressed', v, src: 'env' }` (its words by band: "under fire", "suppressed", "pinned"), −1 a 10 points of felt chaos (the pool less hardening), at most −10, on the hands-and-eyes skills and half on the head-and-voice ones, added by the roller (`combat/roll.js`); it replaces WEAPONS's `fire` −3 and `danger` −1, tradecraft's "shot at" and COMBAT's old bands, so one cause is never counted twice.

**As built in v0.0.9, pressure on the range** (the build sheet 0.0.9 §8 item 8; my call): pressure stays `'evaluated'` on every range scene, and routine work **emerges through the felt modifier**: work is routine when value + modifiers ≥ DC, the felt entry included, so the chaos costs the recruit his routine (and a `danger` natural 1 never needs to) while the tier one at felt 10 (−1) keeps his. No scene's pressure was raised to make the bangs bite; `anchors` prints `danger` and `evaluated` side by side and both hold the user's claim (COMBAT §5.8).

### 5.4 The body and needs: one interface

When a side names its body (`body: p`), `checks.side()` appends `bodyMods(p, key, ctx)` and `needMods(p, key, ctx)`. BODY owns both functions and every number in them. SKILLS owns the contract:
- `SKILLS[key].uses` (the table in §2.2) tells BODY which parts a skill needs. BODY maps each condition onto uses:
  - an arm wound costs `hands` and `arms`;
  - a leg wound costs `legs`;
  - a chest wound costs `breath` and `torso`;
  - a head wound costs `head`, which every skill has, plus `eyes` and `ears`;
  - a jaw wound costs `voice` and `face`;
  - hypoxia and G-load cost `head` and `breath`.
  CQC's `all` means every part. Tradecraft's rule that pain doesn't count in a fight ("adrenaline: you feel it after") stays BODY's.
- `ctx` carries `{ pressure, inSuit, g, vacuum }`, so BODY can scale by situation.
- **Fatigue, hunger, thirst, a full bladder and stress are need modifiers**, named in the log. Tradecraft's fatigue ladder (−1 past 16 h awake, −3 past 20 h, then −1 every 3 h, at most −12) is BODY's to keep or re-base to sols. The user's rule stands: "extreme fatigue … should chip away at skill efficiency".
- Both functions return `[]` for a person whose body is not simulated in detail. That covers the crowd and off-map NPCs, which get BODY's closed-form summary instead.

### 5.5 Opposed rolls in OLYMPUS

The common contests (owners may add more; the second column is the active side):

| Situation | Active side rolls | Against |
|---|---|---|
| Moving unseen past someone | Fieldcraft | each observer's Awareness, when they have you in their cone (PEOPLE's perception) |
| Spotting someone hiding or following | Awareness | their Fieldcraft |
| A lie | Social | the listener's Social |
| Questioning someone who hides something | Social | their Social (or their Nerve, when afraid) |
| A CQC exchange with the same move both ways | CQC | CQC (COMBAT, tradecraft's `cqc.js`) |
| Jamming a net, or breaking through jamming | Comms | Comms |
| A covert act in someone's view (a hand signal, palming an item) | Fieldcraft | Awareness |

### 5.6 Margins and grades: one vocabulary

`grade(r)` is the shared reading of a margin (my call). Tradecraft used margins differently in each module (fumbles at −6 and −10, the feel at 0, 4 and 10, Read at 4 and 12). OLYMPUS names them once:

| Grade | Margin | Typical meaning |
|---|---|---|
| `disaster` | ≤ −10 | the worst outcome the owner has (WEAPONS: a discharge if the gun is ready) |
| `bad` | −9 to −6 | a fumble with a cost (dropped, wasted, noticed) |
| `miss` | −5 to −1, or a natural 1 that would otherwise be higher | failure, more time; when `routine` (§5.1), only the time |
| `pass` | 0 to 3 | done |
| `good` | 4 to 9 | done well (Read: class known; the feel: clear) |
| `superb` | ≥ 10 | done perfectly (the feel: sure; a paper target: the X) |

A natural 20 that would have failed counts as a `pass` with margin 0. Owners read `r.grade` rather than redrawing the bands. **A caught 1** (§5.1, designed 2026-11-11) is graded by its margin alone, never as a `miss`: an owner that reads `nat === 1` as a failure reads `nat === 1 && !caught`.

### 5.7 Hooks (leverage), and edges

**Hooks** are tradecraft's, unchanged in their maths. A hook is single-use and tied to one person. Spending one **halves the DC** of one social or leadership check with that person, rounded up, or halves their total in an opposed roll ("a hook isn't an approach of its own: it's spent on one").
- The UI calls it **leverage**.
- PEOPLE owns how hooks are gained (memories, gossip):
  - a **favour owed**: you covered their watch, you lent them pay;
  - a **secret known**: you saw them at the black market, you know they were drunk on watch;
  - a **story shared**: you carried them out.
- Spending a secret costs that person's affinity −1, because it is pressure. A favour or a shared story costs nothing (my call).
- The log line: "Social check: 9 + 6 = 15 against 20, halved by leverage to 10, success."

**Edges** are CQC's advantage points (tradecraft's `cqc.js`: zero-sum, capped at `floor(CQC/10)`, minimum 1). COMBAT owns them. SKILLS only notes that they are the second kind of banked advantage, and that both show in the log by name.

### 5.8 Help and group checks

**Help** (my call; it is how a squad does things):
- A helper must be at hand (within 1.8 m, PEOPLE's reach), not busy, willing (PEOPLE), and have a value of at least 5 in the skill (3 for Fitness carries).
- The first helper gives +2, or +3 if their value is at least the doer's. A second helper gives +1. The total is at most +4.
- Helpers spend the same time and take the same exposure.
- In the log: `{ why: 'Pvt Okoye helping', v: 2, src: 'help' }`.
- Some tasks need hands rather than help: a litter needs 2 or 4 carriers, a hatch needs two to force. BODY and PLACES say which.

**Group checks** settle what a team does together, mostly in skipped or background outcomes. They use `groupCheck(rng, members, { skill, dc, mods, rule })`:
- `weakest`: every member rolls and the lowest total stands. Use it for stealth (one noisy marine gives the team away) and for the pace of a march.
- `best`: every member rolls and the highest total stands. Use it for searching and spotting, where any eye counts.
- `count`: the number of successes. Use it for inspections and qualification shoots, where the unit's score is the share passed.
- **A leader's brief** adds +1 to every member's roll in the next group check of the task, or +2 at margin ≥ 10. It costs the leader a Leadership check DC 15 and a minute. Fail it and nothing is added; a natural 1 confuses everyone (−1).

### 5.9 Pressure and tempo

Every roll carries a `pressure` set by its owner. It decides what the roll may teach, whether work can be routine (§5.1) and whether it can be taken steady:
- `none`: nobody hostile is aware of you, nobody is grading you, and no clock with a consequence is running.
- `evaluated`: graded training or a qualification, an inspection, or someone whose opinion counts watching (your NCO, an instructor).
- `danger`: a real threat is present (hostiles in the area who are or may be aware, a breach, a fire, a need in its critical band), or an operation is under way.
- `fire`: you were shot at in the last 5 s, you are in CQC, or you are in a decompression.

**Pressure carries no penalty of its own** (2026-11-07, COMBAT §5.3): `fire` and `danger` still mean nothing is routine and still set what a roll teaches (§6.5), but the chaos's cost is the felt modifier alone (§5.3), so a man shot at by noise he is hardened to is not penalised by the word `fire`. `fire` also holds for 5 s after a blast or a flashbang within its reach (my call).

**As built in v0.0.5** (the build sheet 0.0.5 §8 item 12, my call): every roll on the range is at `evaluated`, the coach and the tower watching, so handling is routine for the trained (§5.1), while the shot, an opposed roll and a rushed step never are. `danger` and `fire` wait for the scenes that reach them (WEAPONS §5.1).

**Tempo** (my call; the owner says which tempos an action offers):

| Tempo | Time | Modifier | When |
|---|---|---|---|
| `rushed` | ×0.6 | −3 | any timed action its owner marks rushable |
| `normal` | ×1 | 0 | always |
| `careful` | ×1.5 | +2 | any timed action its owner marks careful |
| `steady` (taken steady) | ×2 | +3; the d20 is rolled and its naturals count; the owner's fumble ladder reads the grade **one step softer** (`disaster` as `bad`, `bad` as `miss`) | only at pressure `none`, and only for actions the owner marks `steady: true`: bench and armoury work, the suit check at the locker, planned repairs, a demolition planned on the range |

"Taken steady" is how anyone buys safety at the bench with time. **It never removes the roll** (the user, tradecraft 2026-11-03: "All actions on a weapon should require rolls against weapon handling", and at the table "all of these actions can fail with varying consequences depending on weapons skill"). This section's first draft set the d20 to 10 with no naturals, which, at the bench's DCs of 4 to 10, meant almost nobody ever failed there, and pillar 7's bench discharges and lost rounds could not happen.
- It is offered to anyone at pressure `none` on a steady-marked action. It does not soften a natural 1: that stays whatever the owner's natural-1 rule makes it, unless the work is routine for the roller (§5.1, judged without the +3).
- Taken steady, a marine at Weapon handling 14 cleaning a rifle at DC 9 rolls d20 + 17: only a natural 1 fails, and the job is routine for him (14 ≥ 9), so the natural costs him time and nothing else. A recruit at 4 rolls d20 + 7: he too fails only on a natural 1, but it isn't routine for him (4 < 9), so it keeps its teeth and goes down WEAPONS's ladder (a lost pin, a gun put back wrong). At normal tempo the same recruit fails one try in five.
- It still counts as use for rust (§7). Pressure is `none`, so it earns no roll XP and no field learning anyway.
- In the log: "Weapon handling, taken steady: 12 + 14 + 3 (steady) = 29 against 9, done."

**At the bench, per 400 tries** [computed; fails / grade `bad` or worse / naturals with teeth]:

| Weapon handling | DC 4 (emptying a magazine), normal | steady | DC 10 (reconditioning one), normal | steady |
|---|---|---|---|---|
| untrained, 0 | 60 / 0 / 20 | 20 / 0 / 20 | 180 / 60 / 20 | 120 / 0 / 20 |
| recruit, 4 | 20 / 0 / 0 | 20 / 0 / 0 | 100 / 0 / 20 | 40 / 0 / 20 |
| private, 10 | 20 / 0 / 0 | 20 / 0 / 0 | 20 / 0 / 0 | 20 / 0 / 0 |
| sergeant, 18 | 20 / 0 / 0 | 20 / 0 / 0 | 20 / 0 / 0 | 20 / 0 / 0 |

The trained hand's 20 are routine misses: slow, never costly. The untrained still bend lips, lose rounds and can put one into the table, steady or not, and so does the recruit on any job above his value (a clip fill at DC 5, a recondition, an unload's DC 6 to 8 steps); steady takes away their `bad` grades but not their naturals. That is tradecraft's measure kept (its table work, 400 tries each: the untrained fired 25 into the table, lost 138 rounds and bent 21 magazines; an expert did none of it), and WEAPONS's `upkeep` test prints the same comparison under these rules.

### 5.10 Retries

The same task, on the same thing, by the same person, within the same scene (`RETRY_WINDOW_MS` 600,000, ten minutes) takes −2 for each earlier failure (`RETRY_MOD`, `src: 'retry'`). The owner resets the count when the situation changes: more light, a new tool, help arriving. This generalises tradecraft's dressing rule ("a miss used to slow it anyway, so retrying always won") to every owner (my call).

### 5.11 Odds the player is shown

There is one helper, `oddsOf(value, dc, mods)` (§5.1), and it always includes every modifier the roll will use.
- **Where a natural 1 would be caught** (§5.1, designed 2026-11-11, to build in the shoot house rework), the odds of failing are 0: `oddsOf` takes the roll's `{ procedure, pressure, tempo }` and returns 1. The panel's row reads "sure" in place of 95%, as a routine row reads "routine", and the plaque reads "SURE" (VIEWS §7.4). The hover gives the catch's price: "a natural 1 is caught: +0.13 s".
- **Exact percentages** appear only where the character could know them: their own action against a fixed DC (a shot's plaque, a step's chance where WEAPONS shows it, an aid step).
- **Against someone whose value is known only as a range** (§12), the odds are computed at both ends of the range and shown in words:
  - "good odds" if both ends are at least 70%;
  - "a fair chance" if both are at least 40%;
  - "poor odds" if both are below 40%;
  - "you'd need luck" if the better end is below 15%;
  - "hard to say" when the two ends fall in different bands.
- Against a stranger nothing has been read on: no odds at all. "We only know what we know."

### 5.12 Pace: how long skilled work takes

There is one helper for the duration of every skilled action (my call; it replaces tradecraft's two curves, and TIME's `chorePace` with them):

```
paceOf(value) = max(0.45, 1.6 / (1 + value / 16.7))          time = base time (at value 10) × pace
```

| value | 0 | 3 | 5 | 7 | 10 | 12 | 15 | 20 | 25 | 30 | 35 | 40 | 46 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pace | 1.60 | 1.36 | 1.23 | 1.13 | 1.00 | 0.93 | 0.84 | 0.73 | 0.64 | 0.57 | 0.52 | 0.47 | 0.45 |

- It is tradecraft's Medicine pace (`1.6 / (1 + Medicine/16.7)`), which the user asked for ("every first aid action should also take time proportionally to medicine skill"), with its floor lowered from 0.5 to 0.45 for the top of OLYMPUS's longer scale.
- It replaces tradecraft's gun pace (`1.6 − WH/30`), which gave 1.27 at value 10 and touched its 0.5 floor at 33. The hyperbola is gentler at the bottom and keeps a little room at the top: the last tenth of speed is the hardest to get.
- **Owners set base times at value 10**, a trained line marine, which is pace 1.00. WEAPONS may square the pace for thumb work (safety, selector), as tradecraft did ("high skill makes this virtually instant": 0.45² × 0.4 s is 0.08 s).
- Failure costs ×1.6 time (tradecraft's `FUMBLE_K`). That is the owners' rule, applied after pace.
- **A caught 1 costs ×1.5 and a clean natural 20 ×2/3** (`CATCH_K` 0.5, `CLEAN_K` 1/3; §5.1, designed 2026-11-11, to build in the shoot house rework), applied after pace like a failure's ×1.6, which they replace on the rolls they decide.
- Tempo multiplies on top (§5.9).
- **The chores use it too.** TIME's activities that scale with a skill (`suit-up` by EVA, `clean-rifle` by Weapon handling, and the rest) take `paceOf()` of that skill on their base time at value 10. TIME's draft curve, `chorePace(v) = clamp(1.3 − 0.025v, 0.7, 1.3)`, was anchored at value 12 and flattened at 24: two curves for one quantity, against the hub's "one quantity, one number, one helper". For TIME's test 7: `paceOf` is 1.18 at 6, 1.04 at 9, 1.00 at 10 and 0.93 at 12, so `clean-rifle` after a range day (30 min × 1.3) takes 39:00 at value 10 and 40:33 at 9, and `suit-up` (8 min) takes 9:25 at EVA 6.
- **Checked.** `paceOf` lives in `src/sim/skills/skills.js` and nowhere else: the syntax test (TECH) fails on any function or constant defined outside that module whose name has `pace` as a word of its own (`chorePace`, `gunPace`, `PACE_K`; not `space`, nor a distance in `paces`), so no owner can grow a local curve. Owners pass a skill value and a base time; they never compute a factor.

### 5.13 Penalties a skill can wear down

Some penalties come from the situation and a trained hand learns to live with them. One helper scales them (my call):

```
mitigated(base, value, fullAt = 24, keepK = 0.15) = round(base × max(keepK, 1 − value / fullAt))
```

| Base penalty | at 0 | 5 | 8 | 10 | 12 | 15 | 18 | 20+ |
|---|---|---|---|---|---|---|---|---|
| −4 (suit gloves on fine work), by EVA | −4 | −3 | −3 | −2 | −2 | −1 | −1 | −1 |
| −6 (free fall, unanchored), by Zero-g | −6 | −5 | −4 | −3 | −3 | −2 | −1 | −1 |

- **The suit**, worn down by EVA. BODY sets the base penalties. My suggested defaults: gloves −4 on Weapon handling, Tech, Medicine and Demolitions; a hard suit's bulk −3 on CQC and Fieldcraft; the visor −2 on Awareness at the edges of the cone.
- **Free fall and very low g**, worn down by Zero-g. PLACES and BODY set the base by gravity regime. My suggested defaults: free fall unanchored −6 on every physical skill; anchored (handhold, mag boots) −2; low g between 0.05 and 0.2 G, −2 on CQC, Fieldcraft and Fitness.
- The log names the base and the skill that reduced it: `{ why: 'gloves (EVA 12)', v: -2, src: 'gear' }`.
- The keep factor of 0.15 means even a master loses a point. Nobody shoots as well in gloves.

### 5.14 The log, and rolls the player doesn't see

Formatting is tradecraft's, kept as two single formatters:
- **`checkText(r)`, for the log (J):** "Marksmanship check: 14 + 11 − 1 (dusk) − 1 (tired) = 23 against 18, success." An opposed roll: "Fieldcraft against the sentry's Awareness: 12 + 10 = 22, against 9 + 6 − 2 (dark) = 13. You win." A natural, a routine natural, a hook, help, tempo and taken-steady each get their phrase. **From the shoot house rework** (§5.1, designed 2026-11-11), a caught 1 reads "Weapon handling check: 1 + 10 = 11 against 8, a natural 1, caught (+0.2 s)." and "Marksmanship check: 1 + 42 + 2 (the aim held) = 45 against 6 (…), a natural 1, caught (+0.13 s). In the A zone."; a clean 20 reads "…, a natural 20: clean (−0.1 s)."; a 20 that saved a failure reads "…, a natural 20: saved.". `checkShort` reads "Weapon handling 11 against 8 (a natural 1) · caught, +0.2 s" and "… (a natural 20) · clean, −0.1 s".
- **`checkShort(r)`, for the top-left line (16 s):** "Marksmanship 23 against 18 · passed", or "Fieldcraft 22 against Awareness 13 · you win".
  - Owners may swap the verb for their own ("hit", "clear", "spotted").
  - Never "made": tradecraft's rule, "made is what you are when they've spotted you".

Who sees what:
- **The player's own rolls** are always logged in full.
- **Rolls made against the player** (a sentry's Awareness against your Fieldcraft) are logged only if the character perceives their subject: you saw the sentry turn your way. Otherwise the roll is stored with `hidden: true`. It shows in the after-action's "what you didn't see" (COMBAT, TIME papers) and in debug, never live.
- **A failed roll to notice something leaves no trace.** It reads exactly as nothing happening (the user, 2026-10-26). No hedged hint and no "as far as you can tell".
- **NPC-against-NPC rolls in view** (a squadmate's shot) go to the log in short form only. COMBAT decides how much of that is shown.

### 5.15 Determinism

Every roll draws from OLYMPUS's `src/core/rng.js` (sfc32, ported from tradecraft):
- The player's checks and contests in the live area use `rngOf(state, 'main')`.
- Background outcomes for skipped time use `stream('skip', seed, fromMs, what)`, so a skip's dice don't move the live ones.
- The feel uses `rngOf(state, 'feel')` and hunches use `stream('hunch', seed, tick)`, as tradecraft did, "so nothing else's dice move".
- Read offsets use `rngOf(state, 'read')`.
- NPC generation uses `stream('people', personId)`.
- The instinct's choice of words takes no dice: `hashPick(lines, ruleId, Math.floor(ms / 12000))`, because "the instinct mustn't move the game's rolls" (tradecraft).

---

## 6. Growth

### 6.1 Three tracks

| What grows | By what | How fast | Source module (tradecraft) |
|---|---|---|---|
| **Warfighting** (the over-skill) | XP: operations above all, a little from training and won rolls | cost ×6.25 every 20 points | `xp.js` (adapt) |
| **Trained bases** | hours: training blocks, courses, manuals, field use; school floors at graduation | `4 + 0.8 × base` hours a point, capped by the teacher | `training.js` (adapt), `career.js` FLOORS (pattern) |
| **Hardening's inoculation** (2026-11-07, §6.8) | training runs whose chaos reached you (felt 20), finished | +1 a run, at most 4 a sol, capped by the teacher (6 to 25) | new: COMBAT's `src/sim/combat/supp.js` (`noteExposure`; `SUPP_HOME`), on the sheet's `skills.inoc` |
| **Fitness** | the week's load against what the base asks | a point of effective fitness a week at most; the base moves after two weeks at the band's edge | `fitness.js` (port, as BODY's `src/sim/body/fitness.js`, §16) |

Background points never grow. Rust (§7) takes value away and practice gives it back.

### 6.2 Warfighting XP

XP is kept on the sheet (`p.xp`). Points of Warfighting are bought one at a time, each at the price of the level reached. This is tradecraft's `level()` and its curve, unchanged ("heavily logarithmic", the user, 2026-11-03):

```
cost(os) = round(COST0 8 × COST_K ^ max(0, os − COST_FROM 20))      COST_K = 6.25^(1/20)
```

| WF | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 55 | 60 | 65 | 70 | 75 | 80 | 85 | 90 | 95 | 99 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| XP for the next point | 8 | 8 | 13 | 20 | 32 | 50 | 79 | 125 | 198 | 312 | 494 | 781 | 1,235 | 1,953 | 3,088 | 4,883 | 7,720 | 11,138 |
| XP from WF 15 | 0 | 40 | 90 | 167 | 288 | 481 | 784 | 1,263 | 2,020 | 3,217 | 5,108 | 8,100 | 12,830 | 20,311 | 32,140 | 50,841 | 80,412 | 116,029 |

**Sources: the one table.** Every XP amount in the game is here and nowhere else (my calls, tuned by the career simulation below and in §17). COMBAT §17.4's classes and multipliers and CAREER §11.4's mission bases were merged into it on 2026-11-05, on this section's scale (a contact is 12), and those sections now name a kind, what it became and its outcome, and cite this table. The three disagreed by up to ten times: a patrol was 0.4 here and 4 in CAREER, a contact 12 here and 15 in COMBAT. A quiet tour's 90 patrols and 90 shifts came to 39.6 XP here and 330 by CAREER's bases (Europa's ×1.2 and the fade in both), which ends a first tour at Warfighting 32 or 41: a lance corporal's number or a sergeant's. The rank table (§11.3) is built on this scale, and the user asked for "A LOT of missions to improve significantly as we get better" (2026-11-03).

| Kind | Base XP | Notes |
|---|---|---|
| *Training* (`ACT_XP`, counts only while WF < `TRAIN_WF_CAP` 25) | | "You can't learn war on the range past a point" (my call) |
| range day | 1 | |
| weapons drill | 0.3 | |
| MCMAP session (COMBAT's mat session) | 0.5 | |
| suit drill, zero-g drill | 1 | |
| escalation-of-force lane | 1 | COMBAT's EOF lane |
| fire-team or squad drill (half a day) | 1.5 | |
| field exercise (a day) | 3 | |
| live-fire exercise | 4 | |
| CQB or boarding drill (the shoot house) | 2 | |
| a qualification (rifle, PFT, MCMAP belt test) | 3 | |
| *Line operations* (`OP_XP`, always count) | | |
| checkpoint shift | 0.2 | |
| patrol, no contact | 0.4 | |
| cordon and search | 1.5 | |
| QRF call-out | 3 | |
| escalation-of-force incident resolved without lethal force | 3 | COMBAT |
| ship engagement endured at general quarters under inbound fire | 3 | COMBAT; strapped in, fighting nothing |
| EVA operation | 5 | a fight in EVA is a contact or a firefight, with `RISK_K`'s vacuum and free fall |
| contact (shots exchanged) | 12 | |
| firefight (sustained past 2 min, or casualties) | 20 | |
| boarding action | 25 | the line's and the raiders' opposed boardings alike |
| *Special operations* (CAREER §11.3's mission kinds) | | |
| protective detail; sensor emplacement | 3 | |
| pathfinder or landing-zone survey | 4 | |
| tracking a vehicle | 5 | |
| derelict investigation; evacuation of citizens | 6 | |
| special reconnaissance | 10 | |
| personnel recovery | 12 | |
| salvage denial | 20 | |
| sabotage | 25 | |
| direct action raid; HVT capture; counter-proliferation | 35 | |
| hostage rescue | 40 | |
| *Extras inside an operation* (`EXTRA_XP`, added to its base before the multipliers) | | |
| a room or compartment cleared under fire | 2 each, at most 5 | COMBAT |
| a casualty carried or treated under fire | 5 each, at most 3 | COMBAT's CASEVAC |
| a damage-control job at general quarters | 1.5 each, at most 4 | COMBAT |
| a detention | 0.5 each, at most 4 | COMBAT |
| *A deployment completed* (`DEPLOY_XP`, flat, no multipliers) | 3, or 5 if it saw a contact | CAREER's "+10 (+15 if it saw combat)", rescaled |
| *Rolls* (`ROLL_XP`, each roll won) | evaluated 0.05 (only below 25), danger 0.1, fire 0.25; none 0 | the user: "each successful roll should bring in some XP (very little comparatively)"; rolls inside a tutorial lesson earn ×`LESSON_XP_K` 0.4 (CAREER's lessons; tradecraft's number) |

```
trainingXP = ACT_XP[kind] × GRADE_K[grade]           GRADE_K: distinction 1.2, passed 1, scraped 0.7, failed 0.5
opXP       = (max(OP_XP[kind], OP_XP[fight]) + Σ EXTRA_XP) × OUTCOME_K[outcome] × FOE_K × RISK_K × ROLE_K × FADE
```
- **One count per operation.** `kind` is what it was planned as; `fight` is what it became (none, `contact` or `firefight`). A patrol that took fire counts as a contact; a special reconnaissance that turned into a firefight counts 20, the larger base. Nothing is counted twice.
- **`OUTCOME_K`**, one ladder for COMBAT's fights and CAREER's missions: `clean` 1 (objective met, nobody of ours hurt, constraints kept); `done` 0.9 (met, ours wounded); `costly` 0.8 (met, ours killed); `broken` 0.7 (contact broken on order); `partial` 0.6 (part of the objective); `failed` 0.4 (the objective lost); `compromised` 0.4 (Martian hands shown on a deniable job); `aborted` 0.3 (called off in time); `routed` 0.3 (routed, and you survived); `fled` 0.15 (you fled or disobeyed: yours alone, whatever the unit's outcome). Failure teaches a little too, as in tradecraft.
- **`FOE_K`**, by the opposition's quality `q`: the median of their core-four values (Marksmanship, Weapon handling, Fieldcraft, Awareness) from their sheets, or the middle of a quality band CAREER's mission generator draws. Under 8: 1 (an insurgent cell, corporate security, pirates); 8 to 11: 1.15 (veteran insurgents, militia, clan crews, Belt cells); 12 to 17: 1.4 (UN Marines, mercenaries, EID agents, MSS tactical); 18 to 24: 1.8 (special forces, recon grade); 25 to 34: 2.2 (raider grade); 35 and up: 2.5 (tier one). Rioters or the unarmed 0.5, whatever their `q`. Then the odds (COMBAT's): outnumbered ×1.2, two to one or worse ×1.4. This replaces CAREER's `0.8 + quality/20` and COMBAT's difficulty list.
- **`RISK_K`** = the place × the situation. The place: Mars 1, a voyage 1, Callisto 1.1, Europa peacekeeping 1.2, a contested war zone 1.5, a special operation behind the lines 1.6. The situation (COMBAT's factors, multiplied, at most ×1.6 together): vacuum 1.2, free fall 1.3, Europa's surface 1.2, darkness 1.1, pinned 1.1.
- **`ROLE_K`** multiplies: ×1.2 if you led it (you gave the orders), ×1.3 if you were wounded in it (COMBAT's "you were hit"), ×2 the first time in your career you are under fire (once).
- **`FADE`**: past the 20th operation of the same kind in one deployment, ×0.5 ("the fiftieth checkpoint shift teaches less than the first").
- **Reported by events.** TIME emits `block-done { kind, grade }` when a training block ends, lived or skipped. The owner of an operation emits one `op-done { kind, fight, outcome, q, odds, place, situation, led, wounded, extras }`: COMBAT for a fight on a line operation, CAREER for a mission, never both. CAREER emits `deployment-done { contact }`. `xp.js` turns them into XP, and `fromRoll()` (tradecraft's, kept) adds roll XP when a roll is logged. COMBAT's after-action `xp` line is `opXP()`'s own breakdown, never a sum of its own.
- **Checked** by the `xp-tables` test (§17): the kinds every owner emits all exist in these tables, and no module outside `xp.js` defines an XP amount.

**Measured on the model** (re-run on 2026-11-05 after the merge; expected values from a scratch script; §17 makes it a seeded test). The line career's rows were re-run on 2026-11-06 on the standby and the voyage as they now stand (CONTRACTS §3 and §14), in a scratch script over this section's formulas, which gives the earlier rows' 17, 19 and 24 (4.8 of 12) exactly from their old assumptions; the rows below are its output with roll XP counted as each row lists it:

| Stretch | Warfighting | What the model assumes |
|---|---|---|
| Out of infantry school | 15 | |
| The first standby at Melas, 10 sols (CAREER §5.4) | **16** (2.0 of 8 toward 17; was 17, then 19, over two weeks of the old calendar) | the weapons class on career sol 1 (a weapons drill); one range day on sol 2 (the zero and a string); the suit drill in the Tank on sol 3; MCMAP on sol 7; the mission rehearsal exercise on sols 7 and 8 (a field exercise, the EOF lane at the mock checkpoint, the cordon and search as a CQB drill), all passed; the lifesaver lane, the ROE class and the G-house teach no Warfighting (no `ACT_XP` kind); no qualification is shot (CAREER §5.4); about 25 rolls won inside the lessons (×`LESSON_XP_K` 0.4) and 15 in the exercise. A slipped standby's extra sols add their blocks (a range day, MOUT as a CQB drill) |
| Voyage to Jupiter, 6.9 days at 1 G (CONTRACTS §14), drills in chapters | **17** (6.6 of 8 toward 18; was 24 after the old 40-day voyage) | five full ship days: 5 weapons drills, 2 on the simulator range, 2 MCMAP sessions, 2 boarding drills in the passageways, a lock drill and the flip's six minutes as a zero-g drill; 40 rolls won. Training stops counting at 25 |
| First tour on Europa, quiet | **30** (was 32 from 24) | 180 days: 90 patrols and 90 checkpoint shifts (both fading past the 20th), 6 cordons with a detention each, 4 EOF incidents, 4 QRF call-outs, 2 contacts with a cell (the first ×2), the deployment (5); 240 rolls won in danger on the 30 patrols lived, 30 under fire |
| (or) a hot first tour from 17 | **36** (36 from 24 before) | the same routine, with 6 contacts and 3 firefights against veterans (`q` 10): one costly, wounded once, a casualty carried, 2 rooms cleared |
| Second tour, moderate, from 30 | **38** (38 from 32 before) | the quiet tour's routine, 4 contacts (2 of them led) and a firefight (led) |
| Third tour, in a war zone | **45** | 80 patrols, 6 QRF call-outs, 6 contacts and 3 firefights led against UN Marines (`q` 13), a boarding in free fall |
| Recon: school floor 50, then 3 years | 50 → **54**, nearly 55 (was 56) | a year: 2 special reconnaissances, 2 more that broke contact from a firefight, a personnel recovery and a raid with firefights; behind the lines (×1.6) |
| Raider: school floor 65, then 5 years | 65 → **66** after a year, **70** after five (was 71) | a year: 3 raids, an HVT capture, a hostage rescue and an opposed boarding, all with firefights, a sabotage and a partial counter-proliferation; behind the lines |

What single operations are worth, on Europa unless named: a clean contact with a cell 14.4 XP; a patrol 0.48; a checkpoint shift 0.24; 90 patrols and 90 shifts together 39.6, about three points at WF 25 and under one at WF 40; a raid behind the lines that became a firefight against veterans, with 3 rooms cleared, 75.4; a boarding led against UN Marines in free fall in a war zone, 81.9.

As tradecraft's numbers did, this reads like a career. A recruit moves visibly in a fortnight: Marksmanship goes from 10 to 11. A tour makes a corporal. A veteran in the 60s needs a year of raids for a point or two, and the best in the system, near 95, "barely move".

**NPCs grow by the same functions.** PEOPLE calls them in closed form, a month or a deployment phase at a time: hours by their own Plan of the Day, XP by their outcomes. Nobody gets cheaper prices.

### 6.3 Training hours

Ported from tradecraft `training.js`: "Hours put in, not points bought."

```
hoursFor(base) = HOURS_BASE 4 + HOURS_PER 0.8 × base        (8 h at 5, 10.4 at 8, 12 at 10, 16 at 15, 19.2 at 19)
train(p, key, hours, upTo)  →  { gained, base, toNext }    (the remainder kept in p.train[key])
effective hours = hours × teacherK × condK
```

| Base reached from 0 | 5 | 8 | 10 | 12 | 15 | 18 | 20 |
|---|---|---|---|---|---|---|---|
| Hours in all | 28 | 54 | 76 | 101 | 144 | 194 | 232 |

- **teacherK** = `clamp(0.8 + L / 50, 0.8, 1.3)`, where L is the instructor's Leadership value. That gives 0.8 for an instructor with no Leadership, 1.0 at 10 and 1.3 at 25. With no instructor (self-study, field use) it is 1. Good NCOs train better (my call), and this is Leadership's teaching use.
- **condK** is 0.5 when BODY's fatigue band is "exhausted" or worse, or pain is at "bad" or worse, and 1 otherwise.
- **upTo**: each teacher teaches only so far (tradecraft: "a gym makes you fit, not an athlete").

| Teacher | upTo (a base) |
|---|---|
| a manual on your terminal, read in 10-minute chunks (TIME) | 6 |
| a unit block led by an NCO | `min(12, teacher's base − 2)`, never below 8 |
| an instructor-led block (a school-qualified instructor: range coach, MCMAP instructor-trainer, EVA cadre) | `min(14, teacher's base − 2)` |
| field use (§6.5) | 12 |
| a course or school | its own cap (§6.6) |

**Lived or skipped, the hours are the same** (my call; open question 5). A training block skipped with an outcome gives its full hours and its representative rolls (§6.4). A block lived gives the same hours, plus the rolls actually made, which carry their roll XP. Living a block is never a chore you must do to grow.

**Drill rungs** (COMBAT §25.3) are taught the same way, counted in clean runs instead of hours: a unit's training teaches a drill family (room, passage, hatch, void) to rung 2, the shoot house's cadre, the boarding course and the AIC to 3, the Raiders' ITC to 4. Twenty clean runs make rung 2 and sixty rung 3; a run in an operation counts double, at most 5 a sol, to rung 3. A 3 h CQB block is about 12 runs, lived or skipped the same, its representative rolls setting the clean share when skipped (my call).

### 6.4 What the Plan of the Day trains (the syllabus)

TIME owns the activities: their lengths, splashes and interrupts. SKILLS owns what each training block gives (my call; lengths are typical). "Keeps" counts rust sessions (§7).

| Block | Typical length | Hours to bases | Keeps (sessions) | Fitness load at 1 G, BODY's kind (§8) | WF XP | Representative rolls if skipped |
|---|---|---|---|---|---|---|
| PT (unit run, circuit) | 1 h | none | none | 10, run | 0 | 1 Fitness (the run's time) |
| Hump (ruck march, 8 km) | 2.5 h | Fieldcraft 0.5 | Fieldcraft 0.5 | 0.6 a km × (1 + load / mass), walk | 0.5 | 1 Fitness, 1 Fieldcraft |
| MCMAP session | 1.5 h | CQC 1.5 | CQC 1 | 7, any g (BODY's combatives) | 0.5 | 2 CQC (bouts) |
| Range, known distance | 3 h | Marksmanship 2, Weapon handling 1 | Marksmanship 1, Weapon handling 1 | 2, walk | 1 | 3 Marksmanship (strings), 2 Weapon handling |
| Weapons drill (dry fire, reloads, stoppages) | 1 h | Weapon handling 1 | Weapon handling 1 | 0 | 0.3 | 2 Weapon handling |
| Suit drill (don, check, lock, surface walk) | 2 h | EVA 1.5, Tech 0.5 | EVA 1 | 3, walk | 1 | 2 EVA |
| Zero-g hall or a ship's spin-down drill | 2 h | Zero-g 1.5, EVA 0.5 | Zero-g 1 | 4, any g (moving mass, not weight) | 1 | 2 Zero-g |
| Class (first aid, comms, tactics, ROE, a language) | 1 to 2 h | the subject, its hours | the subject 0.5 | 0 | 0 | 1 of the subject |
| Field exercise (a day) | 8 h | Fieldcraft 3, Tactics 1.5, Awareness 1.5, Comms 0.5, Medicine 0.5, Marksmanship 0.5 | Fieldcraft, Awareness, Tactics 1 each | 15, walk | 3 | 2 Fieldcraft, 1 Awareness, 1 Tactics |
| Live-fire exercise | 6 h | Marksmanship 2, Weapon handling 1, Tactics 1, Fieldcraft 1 | Marksmanship, Weapon handling, Tactics, Fieldcraft 1 each | 10, walk | 4 | 2 Marksmanship, 1 Weapon handling, 1 Tactics |
| CQB or boarding drill (shoot house) | 3 h | Weapon handling 1, CQC 0.5, Tactics 0.5, then Zero-g or EVA 1 by setting; about 12 runs toward the drill rungs (COMBAT §25.3) | Weapon handling, CQC 1 each | 6, work | 2 | 2 Weapon handling, 1 CQC |
| Weapon cleaning (end of day) | 0.5 h | Weapon handling 0.25 | Weapon handling 0.5 | 0 | 0 | 1 Weapon handling (the cleaning, steady where the bench allows; its margin sets what the armourer finds, WEAPONS) |
| Gym (flywheel and bands), in PT or free time | 1 h | none | none | 10, any g (BODY's resistance gym) | 0 | none |
| Centrifuge session (exercise at 1 G) | 1 h | none (BODY's G-conditioning) | none | 8, at its own g (BODY) | 0 | none |
| Leading a block or a detail (an NCO) | as the block | Leadership 0.5 an hour | Leadership 1 | as the block | (counted with the block) | 1 Leadership |
| Self-study, a manual | 10-minute chunks | the manual's skill, to 6 | 0.25 an hour | 0 | 0 | none |

**Representative rolls** are how a skipped block still shows dice. The outcome rolls the skills listed, at pressure `evaluated`, on the `skip` stream. Their grades set the block's `GRADE_K` and the NCO's opinion (PEOPLE), and they appear in the log under the splash's line ("Range, 3 h: Marksmanship 21 against 18, 19 against 18, 14 against 18; two strings in the black, one wide.").

### 6.5 Field learning (my call)

Use teaches, up to advanced. A roll counts toward its skill's base hours when all three hold:
1. it is **not** inside a training block, whose hours already count;
2. its pressure is `danger` or `fire` (so it was never taken steady, which needs `none`);
3. the skill's base is below `FIELD_UPTO` 12.

| Credit | danger | fire |
|---|---|---|
| hours to the base, per roll | 0.25 h | 0.5 h |
| a failure you live through | ×1.5 | ×1.5 |

At most `FIELD_CAP_H` 2 hours per skill per sol, so a long firefight teaches no more than a hard day. This is how the marine who treats casualties on Europa gets better at Medicine without a course, and why a quiet tour still teaches the patrol's Fieldcraft. Tradecraft had no such track. It let the over-skill carry experience alone, but its weight-0 skills (Medicine, Tech) then could never grow from use.

### 6.6 Schools and their floors

Schools are CAREER's: pipelines, gates, lengths, dates and washouts. SKILLS owns what a graduate is.
- At graduation, every skill the school lists has its base raised at once to the school's **floor** (`base = max(base, floor)`), and Warfighting is raised to the school's **WF floor**. This is tradecraft's `FLOORS` and its illegal's school ("tradecraft is boosted to 80", the user, 2026-11-04).
- The school's hours count only up to its cap.
- A washout gets no floors. The hours attended still count, up to the cap minus 2.

Floors are bases. Lengths are real-world references for CAREER to set.

| School | Typical length | Floors (base) | WF floor | Hours cap |
|---|---|---|---|---|
| `boot`: recruit training | 13 weeks | MRK 6, WPN 6, CQC 5 (tan belt), FLD 4, AWR 3, TAC 1, COM 2, TEC 2, MED 3, EVA 5, ZG 3, DEM 1, FIT 10 | 10 | 8 |
| `infantry`: rifleman | 9 weeks | MRK 8, WPN 8, CQC 6, FLD 8, AWR 5, TAC 3, COM 3, MED 4, EVA 6, ZG 4, DEM 2 | 14 | 10 |
| `machinegunner` | 9 weeks | MRK 7, WPN 9, CQC 6, FLD 7, AWR 5, TAC 3, COM 3, MED 4, EVA 6, ZG 4, DEM 2 | 14 | 10 |
| `assaultman` (rockets, breaching) | 9 weeks | MRK 7, WPN 8, CQC 6, FLD 7, AWR 5, TAC 3, COM 3, MED 4, EVA 6, ZG 5, DEM 7 | 14 | 10 |
| `boarding`: boarding marine (MCRN's own) | 9 weeks | MRK 7, WPN 8, CQC 7, FLD 5, AWR 5, TAC 3, COM 3, TEC 4, MED 4, EVA 8, ZG 8, DEM 3 | 14 | 10 |
| `radio`: field radio operator | 9 weeks | MRK 6, WPN 6, CQC 5, FLD 5, AWR 4, TAC 2, COM 9, TEC 5, MED 4, EVA 5, ZG 3 | 12 | 10 |
| `engineer`: combat engineer | 10 weeks | MRK 6, WPN 6, CQC 5, FLD 5, AWR 4, TAC 2, COM 3, TEC 7, MED 4, EVA 6, ZG 4, DEM 8, DRV 3 | 12 | 10 |
| `driver`: vehicle operator | 8 weeks | MRK 6, WPN 6, CQC 5, FLD 4, AWR 4, COM 3, TEC 6, MED 4, EVA 5, ZG 3, DRV 9 | 12 | 10 |
| `cls`: combat lifesaver | 40 h | MED 7 | none | 9 |
| `mcmap-grey`, `-green`, `-brown`, `-black` | 25, 33, 37.5, 71 h (the real syllabus hours) | CQC 8, 11, 14, 17 | none | the belt +2 |
| `eva-qual`: EVA qualification (Phobos) | 3 weeks | EVA 10, ZG 8, TEC 4 | none | 12 |
| `under-ice`: under-ice operations (Europa) | 4 weeks | EVA 12, ZG 8, FLD 10, DRV 6 | none | 13 |
| `corporal`: Corporal's course | 3 weeks | LDR 6, TAC 6 | none | 9 |
| `sergeant`: Sergeant's course | 6 weeks | LDR 10, TAC 9, COM 5 | none | 12 |
| `sniper`: scout sniper | 12 weeks | MRK 15, FLD 14, AWR 12, TAC 8, COM 6 | 30 | 17 |
| `recon`: basic reconnaissance and its pipeline | 12 weeks and about a year | MRK 14, WPN 14, CQC 12, FLD 16, AWR 14, TAC 10, LDR 6, COM 9, MED 9, EVA 12, ZG 12, DEM 6, DRV 4, FIT 16 | **50** | 17 |
| `raider`: special operations, individual training | 9 months | MRK 17, WPN 17, CQC 16, FLD 17, AWR 16, TAC 13, LDR 10, COM 10, MED 11, EVA 15, ZG 15, DEM 11, DRV 6, FIT 18 | **65** | 19 |
| `tier-one` (NPCs only, for now) | | the core four 19 to 20, the rest 12 to 17 | **85** | 20 |

- A Fitness floor raises the base, and the weekly offset resets to 0.
- The Warfighting floors of recon and raider mirror the illegal's 80. They are what makes a selection course a turning point you can feel on the sheet (open question 2).
- **Drill rungs** (COMBAT §25.3) are floors at graduation as the bases are: `infantry` room 1 and passage 1 (taught: on the summary paper, nothing lived); `boarding` room 2, hatch 2, void 2; `aic` room 3, passage 3; `recon` room 3, passage 3; `raider` every family 4; `tier-one` every family 4. A school's test days count its bundles as lived. `breacher` puts the ram and charge breaches on the record (my calls).

### 6.7 What the player sees

VIEWS owns the screens. SKILLS supplies the words and numbers:
- **Over-skill line**: "Warfighting 17, 3 of 8 XP toward 18" (tradecraft's `progress()` words).
- **A skill's row**: name, level word (§2.3), ◆ for background points, rust marks, "×1.17", value, and progress, for example "7.5 of 10.4 h toward 9". At a cap: "as far as unit training goes: a course for more".
- **After an operation**, in the debrief paper: "+14.4 XP: a contact in Pwyll Deep's Shaft Head, an insurgent cell, done clean (Europa ×1.2)". Then "Warfighting 26, 4 of 14 toward 27".
- **At the week's end**, on the training paper (TIME): hours by skill, points gained, rust gained or lost, and the fitness week (§8).

### 6.8 Hardening and inoculation

Designed 2026-11-07 for the user's ask of that day (DESIGN.md's log): "suppression should be a roll modifier that picks up on those factors, with "hardening" (can name it differently) being an offset to it. Tier one operator would have such hardening, that having three flashbangs go off right next to him would barely affect his ability to operate his weapon, where a recruit would likely be so supressed that they would be even likely to fail simple actions like thumbing safety off or reloading." COMBAT §5 owns what hardening does; this section owns what it is and how it is earned. Numbers marked [computed] are COMBAT §5's script's (`merged.mjs`, tables T1 and T15).

- **What it is.** How much of a fight's chaos a body has learnt to ignore, in COMBAT §5.1's points: "Hardening 17" means the first 17 points of chaos never reach your hands. It is not a skill and is never rolled; it is derived, never stored, beside Warfighting and Nerve:

  ```
  hardening = clamp( round(WF × HARD_K[class]) + inoc + 3 × the nerve axis − the body's toll, 0, 100 )        (COMBAT §5.6)
  HARD_K    = soldier 0.75 · cop, criminal, spook 0.6 · spacer 0.36 · civilian 0                            (3 × NERVE_K, §2.2)
  ```

- **Its two terms are the user's two words** (the doctrine proposal's split; my call). **Experience** is Warfighting, the fights lived, weighted by the class as Nerve is: a miner's years in suits are not years under fire. **Training** is the **inoculation** counter, `inoc`, 0 to `INOC_MAX` 25.
- **How inoculation is earned** (my calls; after stress inoculation training, Meichenbaum 1985 and Saunders et al. 1996, and the armies' battle inoculation, COMBAT §5.10): **+1 for each training run** (a string, a room, a lane, a course) **in which your felt chaos reached `INOC_FELT` 20 and you finished it**, at most `INOC_PER_SOL` 4 a sol, up to the teacher's cap. **You cannot inoculate against what no longer reaches you**: a hardened marine's blanks teach nothing, so a drill teaches only up to its own chaos, and the cap does the rest (§6.3's `upTo` in kind).

  | Teacher | Cap | What makes the chaos |
  |---|---|---|
  | boot and the School of Infantry | 6 | the infiltration course under fire, live fire overhead, the grenade range (the summary paper's; the player's start) |
  | unit training | 10 | the squad leader's blanks and the harness, bang simulators, the MRX's cordon and search, the MOUT day |
  | the shoot house's cadre; the range's stress course | 15 | live fire beside you, bangs in the room (COMBAT §25.18.3's `test-stress` is its strings) |
  | schools: the AIC, the boarding course, recon's | 20 | the schools' stress houses |
  | the Raiders' ITC | 25 | three bangs beside you, live rounds past you |

- **A real fight** teaches through Warfighting's XP (§6.2) and never adds to the counter, so a fight is counted once (my call: the judge's finding that a dose model with fights in it counted experience twice).
- **Lived or skipped, the same** (§6.3's rule): a skipped block gives its representative exposures, the outcome rolling each run's felt as the block's chaos would (the MOUT day's morning about 3).
- **How it is lost** (my calls): **the body's toll** takes some back while it lasts (BODY §9.3: exhausted 10, frayed 5, a combat stress load over 60: 10, very low morale 5, concussed 5, in pain at "bad" or worse 5, in shock 10; at most 25 together); the experience term **rusts with Warfighting** over 15 (§7's rule); **inoculation's own rust is deferred** with the drills' (my call); a setback from being overwhelmed (sensitisation) is not modelled now, since BODY's combat stress load carries that cost.
- **Later** (my call; nothing before 0.1 needs it): the systems proposal's dose model (exposure graded by its felt chaos, operations ×8, a reach of 50 points, fading by halves every 180 sols, school floors) may become the source of the counter; nothing is built for it now.
- **Values** [computed]: the test sheets (§11.1's `TEST_SHEETS`): boot recruit 7 (5 + 2), private 17 (11 + 6), corporal 36 (26 + 10), sergeant 45 (33 + 12), Raider five years 75 (53 + 22), tier one 95 (70 + 25). Along the career (§6.2's Warfighting, inoculation at its teacher's cap): the player's start 17; after the first standby 22; a quiet first tour 33, a hot one 37; a second tour with the cadre's course between 44; recon in year 3 61; a Raider in year 5 78.
- **What the player sees** (VIEWS §8.2; §6.7's progress words): on C's WHAT YOU ARE, under Warfighting, "Hardening · green · inoculation 6 of 10: as far as unit training goes" (as built in v0.0.9 the word leads and the number, 17, is on the hover; the user's answer of 2026-11-07 to COMBAT §24 question 16); the level words **green** 0 to 19, **settled** 20 to 39, **steady** 40 to 59, **hardened** 60 to 79, **unshakeable** 80 and up; its hover "How much of the noise reaches your hands. It grows with fights lived and with training under noise and bangs."; when the body takes some back, "frayed: the noise reaches you more today."; the week's training paper "Inoculation +3: the MOUT day (bangs, marking rounds)"; the DI the first time you freeze in the career (my wording, SETTING to voice): "Everybody flinches the first time. Train loud and you'll flinch less." Never shown on others: their state shows in their figure (COMBAT §7.11).
- **NPCs**: generated people read their tier's inoculation (§11.1), written nowhere; persistent people carry the counter as the player does from 0.1.
- **As built in v0.0.9** (`src/sim/skills/templates.js`, `src/sim/combat/supp.js` `noteExposure`, `hardWord`; the build sheet 0.0.9 §8 items 13 and 16; my calls): **the test rows carry a fixed inoculation**, `skills.inoc { pts, n, sol, fixed }`, the number in `templates.js`' rows (skills may not import combat): recruit 2, private 6, corporal 10, sergeant 12, Raider 22, tier one 25; `noteExposure` never moves a fixed counter (scenes never write a career), and an absent counter reads `INOC_OF_TIER` by rank. **Hardening is shown in words** (the user's answer to COMBAT §24 question 16: "the name Hardening, shown in words from green to unshakeable"): "Hardening · green · inoculation 2 of 6: as far as boot camp goes" on C's row and "Hardening: green" on the picker, the number and its parts (experience, inoculation, toll) on the hover; felt is never a number on the HUD, the roll's hover and J carrying the arithmetic.
- **As built in v0.0.10, the counter growing as tested** (`supp.js` `noteExposure`, `src/sim/scenarios/stress.js`; the build sheet `docs/build/0.0.10.md` §8 item 19, `inoc`; my calls): on a sheet that is not fixed, **6 → 10 → 14 → 15 at four drills a sol** (`INOC_PER_SOL` 4), then held at **the cadre's cap of 15** (unit training's is 10, boot's 6); `noteExposure` is called at each **finished** noisy string with felt 20 or more (`INOC_FELT`), the teacher `cadre`; a string ended by time or passed over is not finished and does not count. A test sheet's counter never moves (scenes never write a career), and the card says what a career would have counted: "Inoculation: strings 2, 4 and 5 would each count +1 in a career, to 15 at the cadre's course; a test sheet stays at 2." (naming a noisy string left out: "string 5 not finished, so not counted"); the tier one's reads "no string was noisy enough to teach". The card's line uses `INOC_CAP[COURSES.stress.teacher]` (the cadre's 15), never `stressNow().inoc.cap` (the sheet's current teacher's, 6 for the recruit), which would have printed "to 6".

---

## 7. Rust

Ported from tradecraft `rust.js` and the user's rule (2026-11-03): "skills higher than 15 but unused for over four weeks become 'rusty' and require some amount of practice to restore their full bonus … Getting into a fight in the world counts as two fight sessions in a club."

| Constant | Value | Note |
|---|---|---|
| `RUST_FROM` | 15 | on the value, Warfighting included, as tradecraft |
| `RUST_PERIOD_MS` | 2,485,706,832 | 28 sols, `4 × FIT_WEEK_MS` (my call: the base lives by sols; the user's "four weeks", 2026-11-03, as four 7-sol weeks, 28.77 Earth days) |
| `KEEP_SESSIONS` | 2 | per period |
| `RUST_MAX` | 3 | levels |
| `ROLL_SESSION` | 0.25 | each roll of the skill, at any pressure; taken steady counts as use |
| `FIGHT_SESSIONS` | 2 | a real fight, for CQC (the user's rule) |
| `rustOff(value, r)` | `round((value − 15) × r / 6)` | at the most rust, half of what is over 15 is gone |

**The roll each period** (tradecraft's `rustRoll`, kept): at the end of every 28-sol period, each rusting skill whose raw value is over 15 and which had fewer than 2 sessions gains a level, up to 3. Practice clears rust first, and only then counts toward the next period.

**One period, one constant.** `RUST_PERIOD_MS` in `src/sim/skills/rust.js` is the only definition of the period. Periods are counted in absolute time since the career began, `k × RUST_PERIOD_MS` (TIME §11.3's rule: never on a calendar, so nothing jumps between sols and UTC days), and the same holds wherever a marine is: aboard ship and on Europa a period is still 28 sols long. TIME and every other section cite the constant and restate no period; TIME's draft "rust's 28-day periods … `k × 7 × DAY_MS`" would have drifted from it by 18.5 hours a period, most of a sol a month. The fitness week is the same: `FIT_WEEK_MS` 621,426,708 (7 sols, §8) is its only definition, for TIME's counting and BODY's training week alike.

| Value, unpractised | 1 period | 2 periods | 3 periods |
|---|---|---|---|
| 20 (a sergeant's Marksmanship) | 19 | 18 | 17 |
| 25 | 23 | 22 | 20 |
| 30 | 27 | 25 | 22 |
| 38 | 34 | 30 | 26 |
| 46 | 41 | 36 | 30 |

**What keeps each skill**. These are the military clubs the user asked for ("activities and clubs to work on each one", 2026-11-04). The rust note names them, as tradecraft's `KEPT_BY` did:

| Skill | Kept by |
|---|---|
| Marksmanship | the range |
| Weapon handling | a weapons drill, or cleaning (0.5) |
| CQC | MCMAP |
| Fieldcraft | a field exercise or a hump |
| Awareness | a field exercise |
| Tactics | a field exercise, or a sand-table class |
| Leadership | leading a block or a detail |
| Social | liberty in town, or a checkpoint shift |
| Comms | a comms class, or radio watch |
| Tech | a damage-control drill |
| Medicine | a combat lifesaver refresher |
| EVA | a suit drill |
| Zero-g | the zero-g hall |
| Demolitions | a demolitions range |
| Driving | the motor pool |

**Operations clear rust.** This is the user's "core spy skills … should all be bumped out of rust by any spy assignment" (2026-11-04), made military:

| Operation | Rust cleared, and kept for the period |
|---|---|
| contact or firefight | the core four: Marksmanship, Weapon handling, Fieldcraft, Awareness |
| a fight hand to hand | CQC (2 sessions) |
| boarding action | the core four, Zero-g, EVA, CQC |
| EVA operation | EVA |
| a casualty treated under pressure | Medicine (1 session) |
| having led it | Leadership, Tactics (1 session each) |

The log says when rust comes and goes. These are tradecraft's lines in the Corps's voice: "Four weeks without the range, and it shows: Marksmanship is rusty (the range, or an op)." "Marksmanship: coming back to you." "Marksmanship: back to what it was."

**Where rust bites.** A line marine's values sit mostly under 15, so rust is an NCO's and a specialist's problem. It is felt on voyages and in hospital. A period without the range (the 12.5-day voyage home, CONTRACTS §14, with the reception and leave around it, or a month in hospital) costs a sergeant a point of Marksmanship. The voyage's chapters (TIME) offer the troopship's simulator range, dry fire and the zero-g hall as choices of how to spend a day, and each counts as a session. Fitness and languages don't rust (Fitness has its own band, §8).

---

## 8. Fitness and effective fitness

Ported from tradecraft `fitness.js` and the user's rule (2026-11-03): "fitness should remain a skill, but there should be a shadow skill called effective fitness, that goes down the longer we go without exercising. Walking would be part of exercising … up to three points before moving the actual fitness skill up one point, and the same should be true downward … The higher we go the harder it gets to exceed base fitness."

- **Base and effective.** The base is `b = base + bg` of the Fitness skill. Effective fitness is `b + p.fit.off`, where the offset runs from −3 to `capOf(b)`. It is the effective value that every check and BODY use: `value(p, 'fitness')`, which has weight 0, so Warfighting never multiplies it.
- **The week's load** (`p.fit.load`) is summed over the training week: `FIT_WEEK_MS` 621,426,708, 7 sols, counted in absolute time since the career began (my call; TIME's rule for absolute periods). It is not the calendar's week (SETTING and TIME own that, for rest sols, pay and rosters), and it stays 7 sols aboard ship and on Europa, so a skip across a change of calendar never moves it.
- **At the week's end** (`rollWeeks`, run each second and after every skip), the load is weighed:
  - `load ≥ upNeed(b) = 4.5 b`: the offset goes up 1, to `capOf(b) = max(0, min(3, 24 − b))`;
  - `load < holdNeed(b) = 2.2 b + 2 × max(0, b − 12)`: the offset goes down 1, to −3;
  - otherwise it holds.
  - Two weeks at the top of the band raise the base by 1 and lower the offset by 1. Two weeks at the bottom lower the base by 1 and raise the offset by 1 (never below a base of 1). `FIT_MAX` is 24.

| Base b | 8 | 10 | 12 | 14 | 16 | 18 | 20 | 22 | 24 |
|---|---|---|---|---|---|---|---|---|---|
| Load to hold | 18 | 22 | 26 | 35 | 43 | 52 | 60 | 68 | 77 |
| Load to climb | 36 | 45 | 54 | 63 | 72 | 81 | 90 | 99 | none (cap 0) |

**Load points** come from **BODY's one helper** (BODY §3.1 and §15.1), which SKILLS calls and never restates as a formula of its own. This section's draft had its own gravity factor (`gK = 0.35 + 0.65 g`, Mars 0.60) beside BODY's, which gave a Mars run 0.47: two numbers for one quantity (a critic's finding, 2026-11-05). BODY's form is kept because it fits the physiology (Teunissen, Grabowski and Kram 2007: the net cost of running falls almost in proportion to weight; walking's falls less, because the pendulum still costs). Each activity gives a load at 1 G, scaled by the factor for its kind:

| Kind | Factor (BODY) | Mars 0.38 G | Europa 0.134 G | 1.5 G deck |
|---|---|---|---|---|
| run (running, PT circuits: bodyweight work) | `fRun = 0.15 + 0.85 g` | 0.47 | 0.26 | 1.43 |
| walk (walking, humps, a field day on foot) | `fWalk = 0.4 + 0.6 g` | 0.63 | 0.48 | 1.30 |
| work (manual work, the shoot house) | `fWork = 0.7 + 0.3 g` | 0.81 | 0.74 | 1.15 |
| any g (flywheel and band machines, combatives, the zero-g hall) | 1 | 1 | 1 | 1 |
| centrifuge or thrust gym | the session's own g | | | |

- Carried load multiplies weight-bearing kinds by `(1 + loadKg / massKg)` (BODY's), at any g: a 15 kg vest on a 75 kg marine is ×1.2, a 25 kg pack ×1.33. Free fall gives running and walking nothing.

| Activity | Points at 1 G | Kind |
|---|---|---|
| PT session (a unit run or a circuit) | 10 | run |
| gym session (flywheel and bands) | 10 | any g |
| MCMAP session | 7 | any g |
| field exercise (a day) | 15 | walk |
| centrifuge session with exercise at 1 G | 8 | its own g |
| walking | 0.6 a km | walk |
| running | 2.5 a km | run |
| a hump | 0.6 a km | walk, with its load |

**The calibration target**, rechecked with BODY's helper [computed]: Melas's standard week earns **57 points** on Mars (60 by the old factor). That holds base 14 (35) and comes close to a climb (63):

| Melas's standard week | Points on Mars |
|---|---|
| 5 PT sessions in a 15 kg vest: 5 × 10 × 0.47 × 1.2 | 28.4 |
| 1 MCMAP session | 7.0 |
| 1 hump, 8 km with 25 kg: 8 × 0.6 × 0.63 × 1.33 | 4.0 |
| 1 field exercise: 15 × 0.63 | 9.4 |
| about 3 km a sol on foot: 21 × 0.6 × 0.63 | 7.9 |
| the week | **56.7** |

- One who adds a 5 km run in the vest (63.8), a centrifuge session (64.7) or a gym session (66.7) climbs; one who skips PT (28.4) loses a point of effective fitness a week. The target stands at "about 57", and the `fitness` test pins it.
- **Europa** is where it bites: the same week there earns 39.2 (Europa's 0.26 for a run), which barely holds base 14 and loses at 16. Swapping three PT runs for three gym sessions brings it back to 59.7. The low-g fitness trap is real, and the gym and the centrifuge are how a marine on Europa escapes it. This is why the Corps trains at 1 G under thrust and in centrifuges (DESIGN.md, the Corps).
- **G-conditioning** is BODY's separate stat: tolerance of high G, which Fitness does not stand in for.

**What Fitness does.** BODY reads `value(p, 'fitness')` for its capacities (tradecraft: part capacity `× (1 + F/20)`, pain limit `30 + 2F`) and for endurance and carries. Combat's fight-enders use it (tradecraft: `DC = 4 + their CQC + floor(Fitness/2)`).

**On the sheet** (tradecraft's fitness graphic): "Fitness 14 (+1), this week 41: 35 holds it, 63 climbs".

---

## 9. Languages

Tradecraft's five levels (`none`, `basic`, `working`, `fluent`, `native`) and its hours, kept:
- **Hours from the level below**: basic 25, working 70, fluent 160 (`LANG_HOURS`). Native comes only from childhood (a background) or from two years lived among native speakers after fluent (my call).
- **Lang Belta** for a native English speaker takes ×0.6 the hours (my call: a creole on an English base).
- **Teachers**: a terminal course reaches basic. A class reaches working: the troopship teaches Belta to the peacekeepers on the way out (TIME's chapters). Immersion counts 0.5 h for each sol with at least 2 h of talk in a town that speaks it, up to fluent.
- **In a roll**: speaking it at `none` allows gestures only, at −8 and for simple things only. `basic` gives −4, `working` −1, and `fluent` or `native` 0, applied to Social and Leadership with someone who speaks only that language. Speaking a native's language well can win them over: PEOPLE may add +1 trust when they didn't expect it of an outsider.
- **Text in a language you don't know** is shown unreadable; between levels "some words come through" (tradecraft Q120). VIEWS draws it.
- **Who speaks what** is SETTING's.
- Languages don't rust in 0.x (my call).

---

## 10. Starting values

CAREER runs character creation and offers the backgrounds and MOSs. SETTING names them and owns the MOS list. SKILLS turns the choices into a sheet.

### 10.1 The procedure

1. All skills start at `[0, 0]`.
2. **Life skills**, from the character's own stream (my call): Social base 2 + int(3), Tech 1 + int(3), Driving int(4). Every adult can talk, use a terminal and, on Mars, mostly drive a rover.
3. **Background points**: up to 4 in a skill and 8 in all (the user, 2026-10-27), into `bg`.
4. **Boot's floors, then the MOS school's floors** (§6.6).
5. **How you did** (my call): 2 of the core four, drawn from the stream, get +1 base. Some recruits shine.
6. **Warfighting** = 13 + int(5), so 13 to 17. Tradecraft's beginners sat "around 20". A marine out of school is a little below that.
7. **Fitness**: the base is the higher of 10 (boot) and the floor; `fit.off` = 0.
8. **Languages**: English native, plus whatever the background gives.
9. `xp` 0, `train {}`, `rust {}`, `keep {}`. Schools are recorded in `p.schools`.

### 10.2 Backgrounds (my call; SETTING renames and rewrites them)

| Id | One line | Points (8 in all) | Language |
|---|---|---|---|
| `valley-farm` | A terraforming farm in the Mariner Valley: early mornings, machines, weather. | Fitness 3, Tech 2, Driving 2, Fieldcraft 1 | |
| `tower-kid` | A Londres Nova tower kid: crowds, screens, talking your way past doormen. | Social 3, Awareness 2, Tech 2, CQC 1 | |
| `navy-brat` | Raised on MCRN ships and at Phobos: free fall before you could walk. | Zero-g 4, EVA 2, Tech 2 | |
| `survey-crew` | Two years on a highland survey crew, in a suit more than out of it. | EVA 4, Fieldcraft 2, Driving 2 | |
| `hecate-line` | Hecate Arms & Drive's small-arms works in Ophir Chasma (SETTING §1.4, §4.10): you've built the rifle you're issued. | Weapon handling 3, Tech 3, Marksmanship 1, Demolitions 1 | |
| `med-college` | Two terms of medical college before the money ran out. | Medicine 4, Social 2, Tech 2 | |
| `athlete` | A middle-distance runner at the Martian Games trials, until a knee said no. | Fitness 4, CQC 2, Awareness 2 | |
| `old-domes` | Redwater's old domes, where you learned to fight early. | CQC 4, Awareness 2, Social 2 | |
| `shooting-league` | The Tharsis junior shooting league, three seasons. | Marksmanship 4, Weapon handling 2, Awareness 2 | |
| `belt-born` | Born on Ceres to Martian parents; home at twelve, and you still lope like a Belter. | Zero-g 3, EVA 3, Social 2 | Belta working |

A Belt-born recruit's weakness in gravity is BODY's G-conditioning, not a negative skill. Backgrounds only add.

### 10.3 MOS

The MOS school's floors are in §6.6. The home unit is a rifle squad (DESIGN.md), so the default is `infantry` (rifleman). `machinegunner`, `assaultman` and `radio` also fit a rifle platoon. `boarding`, `engineer` and `driver` come with other postings (CAREER).

### 10.4 An example: a rifleman from the valley

Background `valley-farm`; the core-four bonus went to Marksmanship and Awareness; WF 15; Social 3, Tech 2, Driving 1 from life.

| Skill | base | ◆ | ×WF | value |
|---|---|---|---|---|
| Marksmanship | 9 | | 1.15 | 10 |
| Weapon handling | 8 | | 1.15 | 9 |
| CQC | 6 | | 1.12 | 7 |
| Fieldcraft | 8 | 1 | 1.15 | 10 |
| Awareness | 6 | | 1.15 | 7 |
| Tactics | 3 | | 1.12 | 3 |
| Leadership | 0 | | | 0 |
| Social | 3 | | 1.03 | 3 |
| Comms | 3 | | 1.06 | 3 |
| Tech | 2 | 2 | 1.03 | 4 |
| Medicine | 4 | | 1.06 | 4 |
| EVA | 6 | | 1.075 | 6 |
| Zero-g | 4 | | 1.075 | 4 |
| Demolitions | 2 | | 1.06 | 2 |
| Driving | 1 | 2 | 1.045 | 3 |
| Fitness | 10 | 3 | none | 13 (effective, offset 0) |

Against an average task (DC 15) this private makes a Marksmanship check 80% of the time and a Medicine check 50%. The squad leader (§11, Marksmanship 15 to 21, Medicine 7 to 10) makes the first 95% of the time and the second 65% to 80%.

---

## 11. NPC skill levels

### 11.1 Reference tiers

These are the templates PEOPLE's roster generation draws from. Bases are drawn per skill from the range; the values shown come from the WF range. Computed on the model; every skill not shown is in the template data.

| Tier | Class | WF | MRK | WPN | CQC | FLD | AWR | TAC | LDR | SOC | MED | EVA | ZG | FIT |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Civilian, Mars | civilian | 0 | 0–2 | 0–2 | 0–3 | 0–2 | 2–5 | 0 | 0 | 2–7 | 0–3 | 0–3 | 0–1 | 4–10 |
| Ice miner, Europa | spacer | 15–35 | 0–2 | 0–3 | 1–4 | 1–3 | 3–7 | 0 | 0 | 2–6 | 1–4 | 9–16 | 8–15 | 5–9 |
| Insurgent, cell member | soldier | 5–18 | 3–7 | 3–7 | 2–6 | 4–9 | 4–8 | 1–3 | 0 | 3–6 | 1–3 | 6–11 | 5–10 | 5–9 |
| Insurgent veteran, cell leader | soldier | 25–40 | 8–13 | 8–13 | 5–9 | 9–15 | 8–13 | 5–9 | 3–9 | 4–9 | 2–6 | 9–14 | 8–13 | 7–11 |
| Pirate (clan boarder) | criminal | 20–45 | 4–9 | 6–10 | 6–12 | 2–6 | 5–10 | 1–4 | 0 | 5–12 | 1–4 | 8–13 | 9–15 | 6–10 |
| Corporate security | cop | 15–30 | 5–9 | 5–9 | 4–8 | 2–5 | 6–10 | 2–5 | 0 | 3–8 | 2–4 | 4–8 | 3–6 | 7–11 |
| MSS tactical | cop | 35–55 | 11–15 | 11–15 | 11–16 | 7–12 | 11–17 | 7–11 | 4–8 | 8–14 | 4–7 | 5–8 | 0 | 11–14 |
| Navy rating | spacer | 20–45 | 3–5 | 4–7 | 2–4 | 0 | 4–7 | 0 | 0 | 0 | 3–6 | 10–17 | 12–20 | 8–12 |
| Recruit, boot week 6 | soldier | 4–8 | 3–5 | 3–5 | 2–4 | 2–3 | 1–3 | 0 | 0 | 0 | 1–2 | 2–4 | 0–2 | 7–10 |
| Private or PFC (the player's start) | soldier | 13–17 | 9–11 | 9–11 | 7–8 | 9–11 | 6–7 | 3 | 0 | 2–4 | 4 | 6–7 | 4 | 11–13 |
| Lance Corporal | soldier | 22–32 | 11–15 | 11–15 | 8–11 | 11–15 | 7–11 | 4–6 | 1–4 | 2–4 | 4–7 | 7–9 | 4–8 | 12–14 |
| Corporal (team leader) | soldier | 28–40 | 13–17 | 13–17 | 10–13 | 13–17 | 9–13 | 6–9 | 6–10 | 2–4 | 6–8 | 8–11 | 6–10 | 12–15 |
| Sergeant (squad leader) | soldier | 38–50 | 15–21 | 17–21 | 12–17 | 15–21 | 12–17 | 10–15 | 11–16 | 3–7 | 7–10 | 10–13 | 7–11 | 13–16 |
| Staff or Gunnery Sergeant | soldier | 45–60 | 17–24 | 19–24 | 14–19 | 17–22 | 15–19 | 14–19 | 15–20 | 4–8 | 7–11 | 10–14 | 9–13 | 12–15 |
| Second Lieutenant, new | soldier | 15–25 | 9–11 | 9–11 | 7–10 | 8–11 | 7–10 | 9–12 | 9–12 | 4–7 | 4–6 | 6–8 | 4–7 | 12–15 |
| Recon marine | soldier | 48–65 | 21–26 | 21–26 | 18–23 | 24–30 | 21–26 | 14–20 | 9–15 | 4–8 | 11–14 | 15–20 | 14–19 | 16–19 |
| Raider (special operations) | soldier | 66–85 | 28–35 | 28–35 | 24–30 | 28–35 | 27–33 | 20–27 | 14–21 | 7–12 | 14–17 | 20–24 | 19–24 | 18–21 |
| Tier one ("the bogeyman") | soldier | 86–100 | 37–46 | 37–46 | 32–40 | 37–46 | 35–44 | 27–34 | 18–26 | 9–14 | 16–20 | 24–30 | 24–30 | 20–23 |
| UN Marine, line | soldier | 18–35 | 11–15 | 11–15 | 8–12 | 11–15 | 7–11 | 3–6 | 0 | 2–4 | 4–7 | 7–9 | 5–8 | 14–17 |
| MNI officer | spook | 40–60 | 8–12 | 8–12 | 10–13 | 17–24 | 17–24 | 10–15 | 0 | 17–24 | 4–6 | 5–8 | 5–8 | 10–13 |

These sit on tradecraft's scale: "a civilian sits around 0–8 … enemy special forces near 40". Tradecraft's embassy Marine (`staffing.js`: CQC 12, weapons 14, fitness 14, awareness 11, Warfighting 50) was set before Warfighting had weights. He lands in the sergeant's row, which answers the user's "the marine in ambassy reads as a civilian, they are military that should count for something".

- UN Marines are Earth-born and trained at 1 G, so their Fitness runs higher. Their G-conditioning (BODY) is what tells most.
- Belter ice miners are the best suit workers on Europa and the worst shots.
- Pirates fight dirty and well in free fall, and badly in the open.

**What the numbers mean against DCs:**

| Tier (a typical value) | DC 10 | DC 15 | DC 20 | DC 25 | DC 30 | DC 40 |
|---|---|---|---|---|---|---|
| civilian (2) | 65% | 40% | 15% | 5% | 5% | 5% |
| insurgent (5) | 80% | 55% | 30% | 5% | 5% | 5% |
| private (10) | 95% | 80% | 55% | 30% | 5% | 5% |
| lance corporal (13) | 95% | 95% | 70% | 45% | 20% | 5% |
| corporal (15) | 95% | 95% | 80% | 55% | 30% | 5% |
| sergeant (18) | 95% | 95% | 95% | 70% | 45% | 5% |
| gunnery sergeant (21) | 95% | 95% | 95% | 85% | 60% | 10% |
| recon (24) | 95% | 95% | 95% | 95% | 75% | 25% |
| raider (31) | 95% | 95% | 95% | 95% | 95% | 60% |
| tier one (42) | 95% | 95% | 95% | 95% | 95% | 95% |

**As built in v0.0.5** (`src/sim/skills/templates.js` `TIERS`, `rollSheet`, `sheetOf`; the build sheet 0.0.5 §8 item 11): the soldier rows from Private to Staff or Gunnery Sergeant and the new Second Lieutenant, each holding its Warfighting range and, per skill, the base range its value range comes from at that Warfighting (`[round(lo / (1 + wf × WFhi/100)), round(hi / (1 + wf × WFlo/100))]`, one rule for every tier), so the private's base is Marksmanship 8 to 10, Weapon handling 8 to 10 and Awareness 5 to 6, and **Fitness 11 to 13** (the table's, Fitness carrying no weight; the build sheet's 10 to 12 was one off). **Comms, Tech, Demolitions and Driving**, which the table leaves out, are 1 to 4 at every soldier tier (my call). **A person's sheet comes from their own rank's tier** (`RANK_TIER`: Pvt and PFC the private's, then LCpl, Cpl, Sgt, SSgt and GySgt each their own), read lazily and written nowhere; so a corporal coach reads the corporal's row and his Awareness can fall below the sergeant's 12 to 17 the build sheet gave the coach (seeds 48213, 7 and 1 all drew a sergeant: Awareness 18, 17 and 14). Only the scene's player gets a written sheet (§15.1).

**For close quarters** (COMBAT §25.14): the boot recruit, recon, Raider and tier-one rows join `templates.js` with `test-pairs`, for the test sheets and the NPCs, each with its default drill rungs (private 1; lance corporal and corporal 2; sergeant and staff sergeant 3; second lieutenant 1; recon 3; Raider 4; tier one 4; insurgent cell members 0, cell veterans and pirates 1, UN Marines 2, enemy special forces 4: my calls).

**As built in v0.0.8** (`src/sim/skills/templates.js`; the build sheet 0.0.8 §2.1, §4, §8 item 23; COMBAT §25.3.2, §25.10.3; my calls):
- **The new tiers** `recruit` (boot week 6), `recon`, `raider` and `tierone`, from the table's rows by v0.0.5's rule, for `rollSheet` on NPCs later; each tier draws on its own record, so nobody's existing draw moves (350 draws digest `0955b6fee56b13`, as v0.0.7's).
- **`RUNG_OF_TIER`** (COMBAT §25.3.2): recruit 0; private 1; lcpl and cpl 2; sgt, ssgt and gysgt 3; lt 1; recon 3; raider 4; tierone 4. **`rungOf(state, pid, family = 'room')`** reads the sheet's rung where one is written (`person.skills.drills[family].rung`, a test sheet only), else the rank's tier's (1 if none).
- **`TEST_SHEETS`**, the test scenes' fixed sheets (`test-pairs`' picker), each a Warfighting and the values COMBAT §25.4.3 and §25.6.2 name, the nearest a sheet can hold (a base and its background points times Warfighting's weight, the higher on a tie: `solveOwn`), the other skills at their tier's middle; **`testSheet(tier)`** solves the bases so `value()` gives them exactly (a background point only past `BASE_MAX`) and writes the drill families' rungs (`{ room: { rung }, passage: { rung } }`); it is written on the scene's player only, never a career. **`PICKER_TIERS`**: the picker's order, recruit, private, sgt, raider, tierone; the corporal by the URL only (TECH §15.3).

  | Tier id | Label | WF | MRK | WH | AWR | FIT | rung | on the picker |
  |---|---|---|---|---|---|---|---|---|
  | `recruit` | Boot recruit | 6 | 4 | 4 | 2 | 8 | 0 | yes |
  | `private` | Private | 15 | 10 | 10 | 6 | 12 | 1 | yes (focused) |
  | `cpl` | Corporal | 34 | 15 | 15 | 11 | 13 | 2 | by URL only |
  | `sgt` | Sergeant | 44 | 19 | 19 | 14 | 14 | 3 | yes |
  | `raider` | Raider, five years | 70 | 31 | 31 | 31 | 19 | 4 | yes |
  | `tierone` | Tier one | 93 | 42 | 42 | 41 | 21 | 4 | yes |

- **A finding, not changed** (react's, for the lead): the tier one's row tops (Marksmanship and Weapon handling 46, Fitness 23) are out of `rollSheet`'s reach, since a base of 20 plus 1 or 2 background points gives at most 44 and 22. The `sheets` test prints it rather than failing; the test sheets are unaffected (their values are solved, not rolled).

**Hardening** (2026-11-07; §6.8, COMBAT §5.6) [computed, COMBAT §5's T1]. `TEST_SHEETS` gain their hardening (by the formula, never stored): recruit 7, private 17, corporal 36, sergeant 45, Raider 75, tier one 95 (the systems proposal's hand-set 3, 12, 25, 35, 70, 84 kept as COMBAT §24's question 17). The templates gain an inoculation by tier, `INOC_OF_TIER` (my calls): civilian, ice miner and insurgent cell member 0; insurgent veteran, pirate and corporate security 3; Navy rating 4; recruit 2; private, second lieutenant and MNI officer 6; lance corporal and UN Marine 8; corporal 10; sergeant and MSS tactical 12; staff or gunnery sergeant 14; recon 18; Raider and enemy special forces 22; tier one 25. At the table's middles that makes an insurgent cell member 8, a veteran 27, corporate security 16, a UN Marine 28, MSS tactical 39 and enemy special forces 82.

**As built in v0.0.9, the test rows' inoculation** (`templates.js`; §6.8): the rows' `inoc` is fixed and carries the number above, so the hardening values stay 7, 17, 36, 45, 75 and 95 on every seed (the player has no nerve trait, `person.nerve` zero) and "Again as …" compares like with like. Corporal 10 reaches the sheet by the URL only.

### 11.2 Generating a sheet

- **Persistent people** (PEOPLE's tiers 1 to 3). From `stream('people', id)`, each skill's base is `intIn(lo, hi)` from the template. Two or three skills drawn from the stream get 1 or 2 background points, which gives personality: the corporal who boxes, the private who was a mechanic. Warfighting is `intIn(lo, hi)`, and the rank table in §11.3 refines it by time in service.
- **The crowd** (tier 4) has no sheet. `crowdValue(seed, template, key) = lo + hashInt(hi − lo + 1, seed, key)` gives a value on demand, the same every time, and nothing is saved. A passer-by gets a sheet only when the player touches them (tradecraft's promotion, PEOPLE).
- **Replacements** (PEOPLE) come from the template of their rank, on the same stream rule.

### 11.3 Rank and Warfighting

The typical Warfighting by rank (my call, from the career simulation in §6.2). PEOPLE uses it to generate people and §12 uses it as the starting guess when reading someone. SETTING owns the rank list.

| Rank | Pvt | PFC | LCpl | Cpl | Sgt | SSgt | GySgt | 1stSgt/MSgt | SgtMaj/MGySgt | 2ndLt | 1stLt | Capt | Maj and up |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WF | 10–20 | 12–25 | 18–35 | 25–42 | 33–55 | 40–62 | 45–70 | 48–75 | 50–80 | 12–28 | 18–40 | 25–55 | 30–65 |

CAREER's promotion gates should expect about these numbers. Longhaul's crew ranks gated on XP and a skill threshold (`RANK_XP [0,150,450,1100,2400]`, `RANK_SKILL [0,40,55,70,82]`), and that pattern is CAREER's to adapt.

---

## 12. Reading people

Ported from tradecraft `know.js` (Read) and `belief.js` (words with a confidence). The user, 2026-10-26: "display the guessed character sheet of someone else … as well as what we discovered about them". Everything here is the character's estimate. The truth is never shown outside debug.

### 12.1 Sizing someone up (Awareness)

**When it happens:**
- on F → "Size up" (tradecraft's Read, renamed);
- automatically on squaring up in CQC, and every 4 exchanges after ("during combat it should automatically do READ against our opponent", the user, 2026-10-26);
- when COMBAT asks, for a hostile first seen clearly within 15 m.

**The check** is Awareness against `READ_DC` 12. Tradecraft used Analysis, which is gone (§2.2). The modifiers are:
- −2 beyond 6 m;
- −1 at dusk, −3 in the dark (PLACES's light helper);
- −3 if they wear a hard suit, which hides the body;
- your visor (gear, reduced by EVA).

**What a read can show** (`READABLE`):
- Fitness, CQC, Weapon handling and Awareness: always, from build, bearing, hands and eyes.
- Marksmanship: only if you have seen them shoot, or hold a weapon at the ready.
- Fieldcraft: only if you have watched them move in the field for 10 s.

**Each read is a range that holds the truth and is never centred on it.**
- Half-width `w = margin < 0 ? 12 : max(1, round(8 − margin / 2.5))`. That is 12 on a failure, then 8 at margin 0, 6 at 4, 5 at 8, 4 at 10, 3 at 12, 2 at 15 and 1 from 18.
- An integer offset `o` is drawn from `[−⌈w/2⌉, ⌈w/2⌉]` without 0, and the range is `[max(0, v − w + o), v + w + o]`. Because `|o| ≤ w`, the truth is always inside; because `o ≠ 0`, the midpoint is never the truth.
- The new range is intersected with what is already known, so each read narrows it.
- If an intersection or the clamp at 0 happens to centre the range on the truth, the far bound is widened by 1 (my call). Tradecraft's offset could be 0. On the model, 1.35% of reads came out centred until this rule was added.

**What a good read adds:**
- Margin ≥ 4 tells the class (§4).
- Margin ≥ 12 tells how well trained, in words from the over-skill: under 15 "little trained", under 35 "trained", under 60 "well trained", under 80 "very well trained", 80 and up "the real thing".

**Limits:**
- The same person is not read again within 60 s unless they have done something new: fought, shot, moved in the field.
- Fights tell bounds (tradecraft's `fought()`): beaten by them, their CQC is at least yours − 2; beating them, it is at most yours + 4.
- **Seen in action** (my call): watching someone do a thing for its whole length (a string at the range, a fight, a reload under fire) gives a free read of that one skill at +4.

### 12.2 What a uniform says (facts, without a roll)

SETTING owns the ranks, insignia, badges and the MCMAP belt colours. SKILLS owns how far they can be read and what they imply.

| What | Seen without a roll | Further |
|---|---|---|
| Rank | in view within `RANK_SEEN_M` 6 m in light at least dim (2 m in the dark); a suit's stencil within 4 m | E held: Awareness DC 10 + 1 per metre beyond 6 |
| Name tape | within 3 m | the person becomes known by name (PEOPLE) |
| Unit patch | within 3 m | |
| Badges, ribbons, MCMAP belt | within 2 m, or E held for 1 s within 4 m | |

- Your own Corps's and the MCRN Navy's insignia are read without thinking: boot taught them.
- The rank of the UN Marines, the MSS and other forces you've been briefed on is read the same way. Their units and badges need a Tactics check at DC 12, or the briefing that listed them (COMBAT intel briefs). Insurgent cells wear nothing.

**Facts become starting guesses.** The rank gives a Warfighting range (§11.3). Each badge gives a floor on a base (my call; WEAPONS and CAREER set what earns each one):

| Badge | Floor it implies |
|---|---|
| Rifle qualification: marksman, sharpshooter, expert | MRK base 6, 9, 12 |
| MCMAP belt: tan, grey, green, brown, black | CQC base 5, 8, 11, 14, 17 |
| EVA qualification | EVA 10 |
| Boarding tab | ZG 8, EVA 8 |
| Scout sniper | MRK 15, FLD 14 |
| Recon | WF 50, FLD 16 |
| Raider | WF 65 |
| Combat action ribbon | has been under fire (WF likely 20 or more) |
| Drill instructor, marksmanship instructor | LDR 12, MRK 14 |
| Corpsman's device | MED 12 |

- **The starting range for a skill** runs from its value at the implied floor and the rank's lowest Warfighting, to its value at base 20 plus 2 and the rank's highest Warfighting. It shows on their guessed sheet before any roll ("a sergeant, expert rifleman, brown belt"), and reads narrow it.
- **Record books.** As someone's team or squad leader, or with access through CAREER, you can read your marines' records: qualification scores, PFT, belt, schools. These are facts, so they set floors. Records never give the values themselves.

### 12.3 Reading the mind (Social)

When you are talking to someone, or within 4 m and seeing their face, the size-up also makes a Social check against `10 + floor(their Social / 2)` (a poker face).
- **Their gauges toward you** (PEOPLE: fear, trust, affinity) come back as words with a confidence, in `belief.js`'s way. The read value is the truth plus an error. The error's spread is `max(1, 5 − margin / 3)` gauge points, drawn from the read's stream so it doesn't flicker.
  - The words: "wary of you", "doesn't believe a word", "likes you well enough".
  - The confidence: "you're sure" (spread under 2), "you think so" (under 4), or "a guess".
  - This follows the user's rule: "what we see is what our character evaluates as being true" (2026-10-28).
- **At margin ≥ 6** the read also shows their stress ("nervous") and, if PEOPLE marks them as meaning harm, "he's going to try something".
- **Lies.** When someone lies to you in a conversation (PEOPLE), an opposed roll is made automatically: their Social against yours, with `them: true`. If you win: "He's not telling you everything." If you lose: nothing.

### 12.4 NPCs read the player the same way

The same functions run the other way. A pirate who sees a marine's plate carrier, expert badge and calm hands at 3 m knows what he is looking at. PEOPLE turns that into fear and choices. This is also how your squad comes to know you: from your record, your range scores and what they saw you do.

---

## 13. The feel (combat sense)

Adapted from tradecraft `sense.js`. The user, 2026-10-31: "some sort of instinct that allows us to 'feel' when we're being watched (to an extent, dice rolls) … reveal part of the map in our blind spots … some operative with 80 tradecraft+ is sort of a super officer". In OLYMPUS it is a veteran's sense: a sniper's eyes, a contact behind a bulkhead, where the man you chased went.

**Eyes on you.** Every `EYES_EVERY_S` 6 s, for each person who has you in sight and means you harm (aiming, a sentry watching you, a sniper, a tail; PEOPLE and COMBAT supply the list):
- the roll is Awareness + `feelMod(WF)` against `EYES_DC 24 + their Fieldcraft + floor(dM / 8)`;
- in vacuum, −4: no sound, fewer cues (my call);
- through a wall or bulkhead, DC +4.

**The quarry.** Every 4 s, for someone you are tracking and cannot see: Fieldcraft + `feelMod` against `30 + floor(dM / 8)`, +3 if they are on another deck or indoors.

**The numbers:**
- `feelMod(WF) = round(WF² / 400)`: 15 → 1, 30 → 2, 50 → 6, 60 → 9, 70 → 12, 80 → 16, 90 → 20, 100 → 25. Only classes with an over-skill have it.
- Reach: `12 + total² / 10` m. That is 35 m at a total of 15, 102 m at 30 and 172 m at 40. Nothing is felt beyond it.
- **No naturals** (my call): the feel needs margin ≥ 0. Tradecraft gave a natural 20 a flash. OLYMPUS doesn't let a private's luck find snipers; that is what hunches are for.
- Grades (tradecraft's `GRADES`):
  - margin ≥ 10, **sure**: a patch 6.5 m across, for 9 s, at the true place;
  - margin ≥ 4, **clear**: 5 m, 6 s, up to 0.6 m off;
  - margin ≥ 0, **a flash**: 3.5 m, 3.5 s, up to 1.5 m off.
- **Hunches**: below a feel value of 30, every 40 s with nobody on you, there is a `(30 − v) × 0.004` chance of a false flash on someone nearby or an empty window, worded as the faint real thing. "Only a master's feeling is a fact" (tradecraft).
- Its own dice: `rngOf(state, 'feel')`.

**Measured on the model:**

| Feeler | Against an insurgent sniper (FLD 7) at 40 m: per roll, within a minute | Against a raider sniper (FLD 32) at 60 m |
|---|---|---|
| private, corporal | 0%, 0% | 0% |
| sergeant (AWR 14, WF 44) | 20%, 89% | 0% |
| recon (AWR 24, WF 56) | 85%, 100% | 0% |
| raider (AWR 30, WF 75) | 100% | 10%, 65% |
| tier one (AWR 40, WF 92) | 100% | 95%, 100% |

PEOPLE's perception lays the patch; whoever stands in it counts as in view, for the rules as for the screen. VIEWS draws it as a cold tint, with a plaque at the screen's edge for anyone felt off-picture.

---

## 14. The instinct line

The user, 2026-11-05 (DESIGN.md, Controls): "T: the instinct's line (the drill instructor's voice in your head, dry). In the field, your NCO's voice on comms joins it." And about tradecraft's (2026-10-26): "we need a serious instinct overhaul, it is mostly useless, giving advice that doesn't even apply to some situations". It is "the voice of training, with dry humour now and then".

### 14.1 Two voices, one line, and a key for each thing it offers

- **The DI.** Your senior drill instructor from recruit training, in your head. They have a name, and like every person they are generated (the user, 2026-11-05: "All people generated"): CAREER draws them at signing from the world's seed and SETTING's pools (CAREER §4.7; PEOPLE §3.1), and the opening flashback is where you met them. They speak anywhere, from your own training. They are second person, imperative, brief and dry.
- **The NCO on the net.** In the field, when your radio is up and your team or squad leader is on the net. He is a real person with his own knowledge, Tactics, Leadership and manner (PEOPLE). His words go in the radio box (VIEWS), which is tradecraft's earpiece box: "◉ HALE · EARPIECE" becomes "◉ CPL VARGA · NET".
- **The body.** BODY's triage line (tradecraft's `aid.js bodyLine()`: collapsed, then arterial, bleeding, shock, and so on) joins the same ladder as a third source.
- **One line shows** at the foot of the screen, and **T does what it offers.** When an order on the net is the most pressing thing, the DI relays it: "Varga wants you on the berm. {T} Acknowledge and move." So T always acts on the one line shown. R's offer is appended as a plate on every line, urgent ones included (from v0.0.6; tradecraft's and v0.0.5's "except on an urgent line" is withdrawn: the user, 2026-11-06, "the shave+wash+water when pressing R at a basin without the tootip telling us what is going to happen is no good", so R must say what it does before it is pressed; VIEWS §7.1).
- **Nothing that matters hides behind the line** (my call, on a critic's finding; the user split T and R in tradecraft because "'T' as a universal key interferes when several things can be done with it", 2026-10-28). The line can be the DI, the body's triage, a relayed order, a custom or a need, and whatever loses the ranking waits. So:
  - **The chip.** Beside the line, a chip carries the next line in short: the most pressing waiting line that has no key of its own (orders and customs have theirs, below). **T held** (`TAP_MS` 220, as E) does the chip's line; T tapped still does the line. Waiting orders and customs that are not the line show on the chip as their keycaps only, and a count gives whatever is queued behind: "{T held} Drink · {B} · {F} · +1". The chip shows on every line, urgent ones included, because it only informs until a key is pressed. R's offer stays a chip of its own, after it.
  - **Orders have their own key.** **B tapped acknowledges the newest order** waiting for an answer, on the net or spoken to you on base, whether or not its line is shown ("Two-one, moving"; "Aye, Sergeant"), and starts its act as T would. B held opens the net panel (VIEWS's B). An order acknowledged by B leaves the ranking at once.
  - **Customs have their own key.** **F on an officer within six paces** (PEOPLE's 4.5 m) renders the salute first when one is due, then opens F's people menu as usual (Esc closes it if the salute was all you meant). The same goes for reporting to a senior who has called you. A salute given by F leaves the ranking at once.
  - So a salute or an acknowledgement is never lost behind a need or a muzzle line, and the need is not lost behind them: in the busiest moment, the line (T), the next keyless line (T held), the newest order (B) and the custom due (F) are each one key away. Only a fourth keyless line waits, counted on the chip.

### 14.2 A rule

```js
{ id: 'muzzle-friendly', voice: 'di', tone: 'urgent', skill: 'weapons',
  when: (state, me) => ctx || null,         // pure; reads only what the character knows (§14.3)
  text: { 0: [...], 1: [...], 2: [...] },   // by the governing skill's value: under 8, 8 to 19, 20 and up
  humour: [...],                            // calm and note lines only
  act: 'posture:low-ready',                 // what T does; null for a line that only informs
  reach: null }                             // 'ack' (B also does it) or 'custom' (F also does it); null: T, or T held from the chip
```

### 14.3 When it speaks (`settle()`, ported from tradecraft `instinct.js`, with additions)

1. **Most pressing first.** Tones rank urgent, then warn, note, calm; within a tone, the order of the list. The line already up stays while its rule fires and nothing more pressing does. It goes the moment its rule stops firing: no advice that no longer applies. The most pressing waiting rule with `reach: null` takes the chip, waiting rules with a reach show their keycaps on it, and the rest are counted (§14.1); a rule whose act was done by its own key (B, F) leaves the ranking at once.
2. **No flicker** (my call). A line stays at least `LINE_MIN_S` 3 s, unless an urgent line replaces it or its act is done. The chip obeys the same minimum.
3. **No nagging** (my call). A line that has gone doesn't come back from the same rule within `REPEAT_S` 60 s, unless its tone has risen.
4. **Only what the character knows**: perception, the feel, what was said on the net, the body as felt. A hazard missed by a failed roll does not exist for the instinct ("we only know what we know"). The DI never says something the character couldn't.
5. **Skill decides how good the advice is.** The governing skill's value picks the text's tier: under 8, a plain instruction; 8 to 19, specific; 20 and up, it anticipates (open question 4). It never picks the player's choice for them. T only does what the line says, T held what the chip says. **In close quarters training also sets how much the act covers** (COMBAT §25.8): one step a press at drill rungs 0 and 1, and never the walk in; a group at 2; the room at 3; the house at 4. **Designed 2026-11-11 (the user's note on v0.0.12)**: the house at 4 is withdrawn; rungs 3 and 4 do the room, to "Room clear!", and every line names a live row (COMBAT §25.19.2, §25.19.4). A bundle chooses the steps of an operation the player chose, never a target, a shot, a consumable its row does not name, or a reload; from rung 3 the close-quarters line has no speaker, the marine's own thought.
6. **Silence.** During a conversation or a menu (time stands still), only urgent lines. During a splash, none: interrupts are TIME's. With nothing to say, a calm line about the situation from the Plan of the Day, or nothing at all.
7. **Humour** only on calm and note lines, at most one aside every `HUMOUR_GAP_S` 300 s of lived time, never on urgent or warn lines and never about a death. Picked by hash, never by dice.
8. **The player's setting** (VIEWS): full (the default), quiet (warn and urgent only), or off except urgent.

**As built in v0.0.4** (`src/sim/skills/instinct.js`, tradecraft's `settle()` ported; `LINE_MIN_MS` 3,000, `REPEAT_MS` 60,000, `HUMOUR_GAP_MS` 300,000; the line in `state.$instinct`, §15.4). It runs in the fast layer `offers` on whole seconds and on the first tick after a skip or a load. At most one line and one chip: **a calm line never takes the chip**, and the chip gives its rule's `short` words (two or three: every rule has them; the HUD cuts a chip without them to its first sentence). **T acts only where its act is at hand** (the build sheet's §8 item 12): get up, dress at your own rack's foot or your locker, the activity of the fixture you stand at; a line that sends you somewhere says where, and its T does nothing until the player's paths come. T acts only while the line's rule still fires with that act (`instinctAction`); T sent with no line seen does nothing; "T held" shows only on a chip with an act. **The needs speak only to a standing player**: lying awake the line is `woke`, and in a drill the klaxon's `alarm`. A line held back while time stands still is not counted as gone, so it returns at once when time runs again, and a line's words are picked again when its rule's case changes (the klaxon's: up, then dress, then your rack). While a rise plays the alarm still says "Up" and T waits; the dressing line and its act come together once you stand. Silent in a splash; only urgent lines while time stands still.

**As built in v0.0.5** (`instinct.js`; the build sheet 0.0.5 §8 item 10). **Stop motion's hold does not silence it**: under the `'stop'` hold the line speaks in every tone (rule 6 holds for every other hold, G's stub `'ready'` included), and `$instinct` gains **`lead`**, "Time stands still." (VIEWS §7.4: the HUD shows it before the line, and entering the mode no longer toasts it as well), and `stopKey`. **A rule may carry its own `repeatMs`**: the range's rules have 0, since a line's commands come every few seconds, each new advice (the 60 s no-nagging rule had silenced each range rule after its first line, so strings 2 and 3 got none). **The line is also settled when stop motion's phase or step changes**, not only on whole seconds, since a step that ends between whole seconds leaves the clock standing there; and what the DI knows on the line is kept per tick and per step, not per clock, so the line goes as the step it names begins ("Cold line! Safe it!" had stayed over CEASE FIRE). Acts `stop:<step>[@<tempo>][><target>]` and `stop:enter` are done by `shooting.js chooseStep`, offered only when the step is in the panel now and never a command the tower has not given.

### 14.4 The DI at Base Melas (the first playable's rules)

| Id | Tone | When (source) | T does | A line (tier 1) |
|---|---|---|---|---|
| `bleeding-fast` | urgent | arterial, or bleeding ≥ 8 %/min (BODY) | aid on the worst wound | "Bleeding fast. Tourniquet, high and tight. Now." |
| `no-air` | urgent | O₂ partial pressure in its danger band, or suit O₂ under 2 min (BODY, PLACES) | reserve or mask | "Air. Reserve, now." |
| `muzzle-friendly` | urgent | a loaded weapon's muzzle sweeps a person within 15 m off a range (WEAPONS) | low ready, finger off | "Muzzle. You just swept Lance Corporal Diaz. He has a mother." |
| `alarm` | urgent | pressure, fire or general quarters alarm (PLACES, TIME) | go to your station | "Pressure alarm. Mask first, then your station." |
| `safety-off` | warn | off safe outside a range or a fight (WEAPONS) | safety on | "Safety. This is a corridor, not a range." |
| `late` | warn | due somewhere you can't reach in time at a walk (TIME, PEOPLE) | walk there, running if needed | "Formation in four minutes, three hundred metres. You do the maths. I already have." |
| `salute` | warn | an officer within 6 paces outdoors, not yet saluted (PEOPLE) | salute (F does it too: `reach: 'custom'`) | "Officer. Salute before he has to wonder why you didn't." |
| `orders` | warn | an NCO's spoken order to you not yet done (PEOPLE) | do it (B answers "Aye, Sergeant" and does it: `reach: 'ack'`) | "Sergeant Ruiz said the armoury. He didn't say eventually." |
| `need` | warn | a need in its warning band (BODY) | walk to the right appliance | "Drink. The Corps went to some trouble to put water in that canteen." |
| `weapon-unknown` | note | holding a weapon whose state you don't know (WEAPONS) | press-check | "You don't know what's in it. Find out." |
| `weapon-dirty` | note | weapon condition below service (WEAPONS) | walk to the cleaning bench | "That rifle wants cleaning before the Gunny finds it." |
| `next` | note | the next Plan of the Day item within 15 min (TIME) | walk there | "Range at 0900, building twelve. Fifteen minutes." |
| `uniform` | note | dressed wrong for what's next (PEOPLE, SETTING) | change at the locker | "PT gear at an inspection. Bold." |
| `rusty` | note | a rusty skill whose keeper is open in free time (§7) | walk there | "The range is open till 1800. Your shooting's gone soft." |
| `rack` | note | lights out within 10 min (TIME) | walk to the rack | "Lights out in ten. The rack is the one place nobody yells at you." |
| `situation` | calm | nothing else applies (TIME) | none | "Free time till 2100. Spend it like it costs something. It does." |

**As built in v0.0.4** (`src/sim/skills/instinct/base.js`; tier 1 only, at least four phrasings each, every rule with its chip's `short`): eleven rules, most pressing first, reading only what the character knows (the body as felt through BODY's `stagesOf`, the wrist's clock, where they stand, what they wear). This table's `need` is split by ledger, and `alarm` is the alert drill's:

| Id | Tone | When | T does | A line |
|---|---|---|---|---|
| `alarm` | urgent | a drill open and you not mustered, or mustered and gone from your rack | get up, then dress at your rack (the line's words follow: up, dress, your rack) | "Klaxon. Up, utilities, the foot of your rack. Five minutes."; past the count "You missed the count. Utilities, your rack, now." (never the count's time once it is past) |
| `need-bladder` | warn | the bladder at need, or could go at your rack after 21:00 | the head, at a urinal or a stall | "Your bladder has opinions. The head is across the hall." |
| `need-bowel` | warn | the bowel at need | a stall | |
| `need-thirst` | warn | thirsty | a drink, at a tap, a fountain or a machine | |
| `need-hunger` | warn | hungry | a bar, at the mail room's machine | "The mail room's machine has bars." |
| `need-sleep` | warn; a note from 21:00 to taps | exhausted any time, or tired after taps; tired before taps is a note | sleep, at your rack | "Taps at 22:00. You will sleep tonight." |
| `need-dirt` | warn | unwashed, from 05:00 to 21:50 | a shower, at a stall | |
| `woke` | note | lying awake in the rack, no drill open | get up; between taps and reveille, back to sleep in the berth, or the head when the bladder is at need | "Back to sleep. Reveille is at 05:30."; "The head, then back in the rack." |
| `rack` | note | 21:50 to 22:00, away from your rack | none (the line says where) | "Taps at 22:00. Be in your rack for it." |
| `stubble` | note | over 20 h on a face that grows it (BODY §6), 05:00 to 21:50 | the basin, at a sink (from v0.0.6 `activity:shave`, the shave alone) | "Shave. Head A has mirrors." |
| `situation` | calm | nothing else applies: in a drill, stand fast at your rack until the stand-down; by day free time; evenings taps; nights sleep | in a drill, standing at your rack in utilities: stand fast | "At your rack, eyes front. The stand-down is at 03:00." |

**While a drill is open nothing sends you from your rack** (the integrator's call: mustered at 02:35 the DI had said "Shave. Head A has mirrors."): the needs, the stubble and taps keep quiet, the bladder and the bowel speaking only at urgent, and the calm line is to stand fast, never with humour. **No grooming lines from 21:50 to 05:00**, and by day the calm line no longer sends you to a squad board you cannot read (the review of v0.0.4). `late` and `next` before Plan of the Day blocks come with the blocks (0.0.14); the walking acts ("walk to the head") with the player's paths.

**As built in v0.0.6, the hands and the hair** (`src/sim/skills/instinct/base.js`, new `src/sim/skills/instinct/groom.js` `GROOM_RULES`, merged by tone after the base rules and before the range's; the build sheet 0.0.6 §2.1, §2.2; the user, 2026-11-06: "using the head shouldn't wash our hands" and "we should have to groom our hair the same way we will have to groom our beards"; at least four phrasings each):

| Id | Tone | When | T does | A line |
|---|---|---|---|---|
| `hands` | note, before `stubble` | the hands dirty or past (BODY §6: dirt 40) and a sink at hand; or the hands dirty within `HANDS_NAG_MS` 120 s of the head or a stall (the log's last `activity` record says which, and when), wherever you stand; quiet in a drill, on the range, asleep, busy or not standing | at a sink, `activity:wash-hands`; else none | "Wash your hands."; "A basin, soap, your hands. Now."; "The basins. Wash your hands." |
| `stubble` | note | as v0.0.4 | `activity:shave` | "Shave. Head A has mirrors." |
| `haircut` (groom.js) | note at `due` (`hairOf`'s step 2), warn at `over` (step 3) | by day, 05:00 to 21:50; quiet in a drill, on the range, busy, lying or sitting, asleep | `activity:clip` at a sink for a shaved head, `activity:haircut` at the barber's pole, **only where `offOf` allows** (the barber's hours: at 09:00 the pole gives his hours and no T, never "Haircut. Now, while you are here." for a T that would be refused; the fixer's); elsewhere none, the words saying where | "Haircut's due Thursday. The barber's at the PX, 10:00 to 20:00."; "Your cut is due Wednesday. The PX has a barber. Use him."; "That hair would fail an inspection. The barber, today."; "Clippers. Head A has mirrors." |

Neither nags (the design review's): the hands speak only at a sink or just out of the head, the haircut only from its due step, by day.

**As built in v0.0.5, the DI on the range** (`src/sim/skills/instinct/range.js`; the build sheet 0.0.5 §2.2, §8 item 10; at least four phrasings each, the DI's voice; the coach speaks as a person in the radio box and the range officer on the PA, never through this line): eight rules, merged by tone after the base rules, reading only what the character knows (the tower's command as heard, the red flag, the rifle as believed, the finger and the posture as felt, the muzzle's heading, the aim).

| Id | Tone | When | T does | A line |
|---|---|---|---|---|
| `range-cease` | urgent | the line cold and the rifle off safe or the finger on | CEASE FIRE | "Cold line! Safe it!" |
| `range-muzzle` | urgent | the rifle in hand and its muzzle past `MUZZLE_WARN_DEG` 45° off downrange; **outside the mode the heading is read from the facing** (the integrator's), so it speaks off the line too | aim at your card | "Muzzle downrange! Your card, nowhere else." |
| `range-stoppage` | warn | a stoppage felt ("Tap, rack."); the trigger still dead after the tap-rack (a **`look` variant**: a look at the port, not IMMEDIATE ACTION again, which would loop: on a double the charge "won't go into battery"); a double feed seen ("Double feed. Lock, strip, rack."); quiet while a drill runs | IMMEDIATE ACTION; a look at the port; REMEDIAL ACTION | "Tap, rack."; "Stop pulling things. Look at what you have."; "Double feed. Lock, strip, rack." |
| `range-cmd` | warn | the tower's command not done yet | the command (its stance first where it has one; out of the mode, the rifle up first) | "The tower said LOAD." |
| `range-reload` | note | in the stance called, the bolt locked on an empty magazine | RELOAD; from v0.0.6, with no rounds left anywhere (the coach's `R.dry`, or `roundsLeft` 0: WEAPONS §11.3), a **`dry` variant** with no act | "Fresh magazine. The bolt goes forward on it."; dry: "Nothing left to load. Tell your coach.", "No rounds anywhere. On safe, and tell your coach.", "Every magazine is empty. Safe, and say so.", "Nothing to load. On safe; the coach will see." (in review the line had kept saying "Empty one out, full one in, bolt home." to a dry shooter) |
| `range-unknown` | note | a `?` on the weapon card | a press check | |
| `range-fire` | note | the line hot: aim at your card, then off safe, then press | aims and takes the safety off; **never the shot** (the fixer's: 33 presses of T had cleared the scene): the press is always your own digit | "Breathe out. Press." |
| `range-wait` | calm | nothing to do | wait for the tower | "Wait for the tower." |

**While a range session is open the base rules keep quiet below urgent**, for the whole session, its end included (the integrator's: "Free time. Spend it like it costs something." had spoken over the end card), and `situation` is null.

**As built in v0.0.7** (`src/sim/skills/instinct/base.js`, `range.js`; `src/sim/body/cues.js` `woundLine`; the build sheet 0.0.7 §2.2, §2.3). **The base rules open with `wound`** (urgent or warn by the wound), the body line's wounds in BODY §23.2's order: "Bleeding hard from the left thigh: a tourniquet, now.", "Going into shock: lie flat, keep warm, call the corpsman.", "Bleeding: press on it.", "Still bleeding: keep pressure on.", then the pain; never a number. Its urgent lines speak on the range too, where the base rules keep quiet below urgent. **The range gains `range-kd`** (warn) on `test-range`'s KD course, for the KD's own commands: "Dial the coach's call: four up, two left." (`stop:sight:call`), "Your dope for three hundred is three down.", "Four power.", sitting then LOAD, the zero's RELOAD; on a hot KD line "Wind from the left: the coach says hold a mil left." until held so (`hold:call`, the point of aim into the wind: WEAPONS §7.4's convention, `holdSaid`'s quarters); and **"Police your brass.", "Unused rounds back to the coach.", "Say it: no brass, no ammo.", whose acts are `kd:police`, `kd:turnIn` and `kd:declare`**, done by T through `doAct` (`kdAct`), as their panel rows are (VIEWS §7.4). The KD's own commands (`dial`, `dope`, `optic`, `sit`, `reload`, `police`, `turnIn`, `declare`, and **`group`, `walk` and `pits`, where the coach or a splash does the work**) are `range-kd`'s, not `range-cmd`'s, so the DI says nothing over the last three. On the bay's familiarisation course v0.0.6's rules are unchanged.

**As built in v0.0.8, the DI on the bay of turners** (new `src/sim/skills/instinct/pairs.js` `PAIRS_RULES`, weighed after the range's; the build sheet 0.0.8 §2.3, §10 item 11; COMBAT §25.8.3's lines that fit a range): **twelve rules**, at least four phrasings each, reading only what the character knows (the coach's command as heard, the rifle as believed, the take-in's record once paused: what he identified, never the face's truth; the turners as seen). **All are silent while a take-in's window is open**; T is never the shot nor picks the target (the brackets are the player's), and an act is offered only when its step is in the panel now. The act at the pause goes by the drill rung (`rungOf`): below rung 2 Off safe first, from rung 2 the row's aim does both.

| Id | Tone | When | T does | A line |
|---|---|---|---|---|
| `pairs-still-up` | urgent, listed first | "He's still up" (COMBAT §25.6.1: a ring, or two torso hits, and standing) | aim at him if not aimed | "He's still up. Head." |
| `pairs-contact` | urgent | at the pause, the bracketed a threat still up | the rifle up if slung; off safe below rung 2 with nothing fired yet; aim; then no act. **Cases with no act**: `press` ("You are on him. Now press."), `again` (one torso hit and standing: "Again. Chest."), `point` ("Back on your point first."), `next` and `nextUnseen` (the bracketed down and another he saw still up, its lane named) | "Rifle, your lane. Off safe. Aim. Then press." |
| `pairs-live-out` | urgent | out of stop motion with a threat of the string facing and standing (X at the pause) | enter the mode | "He's still there. G, and take him." |
| `pairs-noshoot` | warn | the bracketed identified with empty hands or a phone | Hold him when he is the last one up; with a threat he identified still up, `other`: that one named, no act | "Hands. No weapon. Don't."; "Not him. Rifle, lane one: bracket him (Q, D)." |
| `pairs-unknown` | warn | the bracketed not identified | Challenge | "Can't see his hands. Challenge him." |
| `pairs-reload` | warn | the bolt believed locked on an empty, rounds left | RELOAD | "Empty. Reload." |
| `pairs-short` | warn | the coach's short magazine named and not in | Top up with it (the mode first) | "Top up with the short one." |
| `pairs-cmd` | warn | the coach's LOAD, MAKE READY or UNLOAD, SHOW CLEAR not done yet | its macro (the mode first) | "The coach said LOAD." |
| `pairs-reset` | warn | the string done and you in stop motion | on safe, then X | "Done. Safe. Out of it." |
| `pairs-ready` | warn | a standby to come and the line not ready: the first part lacking (`pairsWant`) | the rifle up, the magazine, MAKE READY, a press check, on safe, low ready, X; none for the point | "No magazine in. Reach for one."; "Not sure what is up the spout. Press check."; "Back on your point first." |
| `pairs-topup` | note | a lull (`lullOf`), the magazine believed at half or less, a fuller one at hand | Top up | "Lull. Top up." |
| `pairs-wait` | calm | the turn armed | nothing | "Wait for it." |

**As built in v0.0.9, the DI after the bangs** (`src/sim/skills/instinct/pairs.js`; the build sheet 0.0.9 §8 items 18 and 21, §10 items 4 and 5, the three reviews; each my call unless named). **Every rule is silent while the player is startled** (the line clears on the startle's own tick). Three rules join the table:

| Id | Tone | When | T does | A line |
|---|---|---|---|---|
| `pairs-shaking` | urgent, listed first | at the pause on a threat he identified, felt suppressed or pinned (his hands shake), below rung 2, the rifle on safe | Off safe, or the rifle up; never the shot | "Thumb it off."; "Again. Thumb it off." after an Off safe that failed; "Rifle up. Then thumb it off." (on its sling) |
| `pairs-froze` | warn | the startle over, FROZE 0.3 s or more (`FROZE_SAY_MIN_MS` 300), **never while a planned bang is still due** (`pairs.js bangDue`), for `FROZE_SAY_MS` 3 s or until a step or a contact's pause | nothing | "You flinched. Everybody does. Your lane." ("the first time" **only for green or settled hardening**; a `steady` variant, "Flinched. Your lane.", otherwise; an `again` after another series: "Flinched again. Your lane.") |
| `pairs-deaf` | note | deafened by the bangs (`supp.js hearingOf`), the first standby after them with its turn armed, out of the mode; once a run | nothing | "Ears ringing. Watch your lane." |

**Variants of the pairs rules added in v0.0.9** (the head-row fix and the fixers; every DI line names only a row the panel has, and at a choice T does the step it names, my call): `pairs-still-up` is **offered** ("He's still up. To the head: {key}.", "Still standing. To the head: {key}.", "It rang and he is up. To the head: {key}.", "Plate. To the head: {key}.") or **struck** ("... To the head ({key}) is struck: {reason}. {remedy}: {key}."), T doing the remedy (`headFix`: the aim, else `remedyOf`); the old "Head." lines stay only where no panel is open. `pairs-ready` and `pairs-cmd` gain `raise` (Rifle up first), `release` (Bolt release), `charge` and `dry` (names no row); MAKE READY on a locked bolt names Bolt release or Charge, LOAD names `magSingle`'s step. `pairs-short` gains `seat`, `stow`, `out`, `reach` ({pouch}), `ground`, `want` and `lost`; `pairs-reload` gains `swap` (an empty magazine in with the bolt home on an empty chamber: Top up, else the magazine out), `seat`, `drop`, `reach`, `ground` and `none` ("Dry, and nothing to load" names no row); `pairs-topup` gains `unsure` (the count not known in the lull); `pairs-unknown` gains `up` (the rifle slung), and is silent once he is still up or rounds have gone at him this pause. "Challenge" no longer comes under "To the head" once you have fired on him. **Instinct** (§14.2): a rule may set `ctx.words` to name its text entry separately from its variant, so the variant can carry everything that should change the words. A fuzz shooter over the whole course found 169 lines with no matching row before the fix; after it, 0 silent in 105 runs and 100 more (`pairs-head`).

**As built in v0.0.10, the DI on test-stress** (`src/sim/skills/instinct/pairs.js`; the build sheet `docs/build/0.0.10.md` §8 items 12 and 13, §9 item 24, §10 item 37; each my call; every line names only a row the panel has, and T does the step it names):
- **`stress-breathe`** (warn): out of the mode, felt 20 or more, nothing facing, no take-in window, not startled: "Hands shaking. Breathe: T." (the shaking variants all name T; with its digit in the mode, "Breathe: 3."); suppressed or pinned, "Bangs. Your hands are shaking. Breathe." (with T). At most once a minute, never with a threat facing, and a line may stand at most the one tick its offer ends in. T does Breathe.
- **`pairs-reload`'s "again"**: "Again. RELOAD." after a failed RELOAD try on the stress course (calm Pairs keep "Empty. Reload.").
- **`pairs-ready`** names a press check when the coach wants a round up that the marine believes is up; **`pairs-short`** names {rounds} and, when the short magazine lies at the feet behind another, the reach (lines only: no pairs test's bot reads them; these join test-pairs' DI too).
- **`pairs-wait` never names Breathe on "Bang" or "Three bangs"** (where the chaos runs it reads "Easy. It turns when it turns." for "Breathe. It turns when it turns."; calm Pairs keep their words). The coach's Breathe is the step's four counts of a second, "In, hold, out, hold."
- **`stepOfAct`** (`instinct/range.js`; the scene role's report, the integrator's fix): a tempo is read after '@' only when the steps know it (normal, rushed, careful, steady). It had read every '@' as a tempo, so `stop:reach@p3` and `stop:reach@ground` asked the step `reach` at the tempo `p3` and T did nothing on any DI line whose act is a reach row (pairs-short's reach and ground, pairs-reload's reach, pairs-ready's mag), on test-pairs since v0.0.8. `instinct-reach` pins it (9 reach lines met over whole courses, T did all 9; 0 without the fix).

**On the pairs course five of the range's rules keep quiet** (`instinct.js` `RANGE_OFF_PAIRS`: `range-cmd`, `range-kd`, `range-reload`, `range-fire`, `range-wait`), since the coach's commands and the turners are the pairs rules'. **At a pause the line's lead** is "Contact · " + `takeInWords(ms)` + " s." ("Contact · 0.55 s.") in place of "Time stands still.", until the first step chosen after it.

**On the KD course the DI names what the line moved on without** (`src/sim/skills/instinct/range.js` `owedOf`, the `range-cmd` rule's variant `'owed'`; the player verifier's finding of 0.0.8, seed 2614078355; my call): at LOAD, MAKE READY and commence fire, what the line has gone on without comes first. What each command needs before it: LOAD the string's position; MAKE READY the position and a magazine; commence fire the position, a magazine and a chambered round (the bolt not locked on an empty). Each is owed only if not done, and a magazine only with rounds left; under fire only before your first round since the command. The words: the owed steps, then the command ("The line has moved on. Sitting, then LOAD, then MAKE READY.", four phrasings), and the chip shows the first step and T does it (`stance:prone` or `stance:sit`, `macro:load`, `macro:ready`; out of the mode, the rifle up first). The move-on's "slow" fault and the tower's pace are unchanged (the user's rule, 2026-11-07: "no watering down but factor in experience", DESIGN.md's log): nothing is done for you and nothing forgiven. `fam25` (test-handling) is unchanged.

### 14.5 The DI in the field (later milestones; COMBAT supplies the facts)

| Id | Tone | When | T does | Tier 0 / tier 1 / tier 2 (Tactics) |
|---|---|---|---|---|
| `under-fire-open` | urgent | shot at, no cover where you stand, known cover within 8 m | move to cover | "Down! Get to cover." / "Fire from the left. The barrier, three metres right." / "Two rifles, left, behind the pumps, sixty metres. Barrier, then the wall: they lose you there." |
| `grenade` | urgent | a grenade seen within 12 m | get away or down | "Grenade!" |
| `casualty` | warn | a friendly down in sight (tier by Medicine) | go to them | "Okoye's down. Get to him when you can, not before." |
| `bunching` | warn | within 5 m of another marine in the open in a hostile area | spread out | "Spread out. One grenade, two marines." |
| `ack` | warn | an order on the net awaiting your answer | acknowledge and do it (B too: `reach: 'ack'`) | "Varga wants you on the berm. Acknowledge and move." |
| `report` | note | a contact you saw that isn't on the net | send a contact report (Comms) | "You saw him. Nobody else did. Tell them." |
| `reload` | note | magazine low in a lull | Top up (the tactical RELOAD; COMBAT §25.6.5) | "Lull. Fresh magazine while you have one." |
| `cqb-*` | | in a clear | by the drill rung | COMBAT §25.8.3's sixteen rules, `src/sim/skills/instinct/cqb.js` |

### 14.6 The NCO on the net

- **He speaks when:**
  - your radio is on and linked (COMBAT and TECH own links: range, the ice blocking radio, jamming);
  - he is alive, conscious and on the net;
  - he has something: an order (COMBAT's order system), a correction he can see (your muzzle, bunching, standing in the open, noise), a check-in ("Two-one, sitrep"), or praise, at most once a phase.
- **Cadence** is tradecraft's earpiece: each line lives 3.5 s + 1/3 s a word, at most 2 lines queue, a line older than 25 s is dropped, and urgent lines jump the queue. In stop motion his lines run on their own clock.
- **He knows** his own perception, plus the reports on the net.
  - A contact report is a Comms check at DC 12. At margin ≥ 8 it puts the contact within 5 m with the right count; at margin ≥ 0, within 15 m; a failure puts it within 40 m, and the count may be wrong.
  - Bad reports make bad orders, and an NCO's Tactics tier shapes what he orders (COMBAT).
- **Acknowledging.**
  - Unanswered after `ACK_S` 10 s, he repeats the order, sharper.
  - After `ACK_FAIL_S` 30 s it is a failure to obey. PEOPLE remembers it, and the chain of command may act on it.
  - T on the relayed line answers ("Two-one, moving") and starts the act. So does B tapped, at any time, for the newest order waiting, whatever line is shown (§14.1).
- **His voice:** call signs and brevity ("Two-one, Varga. Berm, left side. Move."). His manner (dry, calm, loud) is PEOPLE's.
- **When you are the NCO**, the voice on the net is your platoon sergeant or platoon commander. The DI's lines turn to leading, tiered by Leadership: "Third man hasn't moved. Name him, then tell him."

### 14.7 House style for the lines (SETTING and VIEWS own the final words)

- Second person, present tense, under 16 words, one idea.
- No exclamation marks except on urgent lines.
- The humour is understatement, never cruelty.
- Never explain the controls: the key glyph does that. Never say a number the character can't know.
- Variety: at least 4 phrasings for every rule and tier, picked by hash (`hashPick(lines, id, floor(ms / 12000))`). The user wanted "insane variety" in tradecraft's briefs.

---

**As built in v0.0.12** (`src/sim/skills/instinct/cqb.js`; COMBAT §25.8.3 lists the rules by name): 20 rules (`CQB_RULES`), cqb-corner with its `far` variant, by rung and tier; below rung 3 the voice is the instructor's, from rung 3 the marine's own. `RANGE_OFF_HOUSE` gains `range-muzzle`; `HOUSE_CMDS` makes `range-cmd` speak for LOAD, MAKE READY and UNLOAD SHOW CLEAR when off the lane, so T runs the instructor's command and no drill row is offered; a full magazine is no Top up. The DI never names a row the panel lacks, and where it names one T does it, never the shot (sheet item 10). "Downrange! Everything else is people." is quiet in the house, so T at GO does what the line names.

## 15. State shapes

All plain JSON in the save. Keys starting with `$` are runtime-only and are stripped from saves (TECH).

### 15.1 On every person's sheet (the player included)

```json
{
  "cls": "soldier",
  "os": 17,
  "xp": 3.45,
  "skills": { "marksmanship": [9, 0], "weapons": [8, 0], "fieldcraft": [8, 1], "fitness": [10, 3], "tech": [2, 2] },
  "train": { "marksmanship": 7.5, "lang:belta": 12 },
  "field": { "sol": 214, "h": { "medicine": 0.75 } },
  "rust": { "cqc": 1 },
  "keep": { "cqc": 0.75, "marksmanship": 2 },
  "rustAt": 31,
  "fit": { "off": 1, "load": 34.2, "week": 140, "last": 1 },
  "langs": { "en": "native", "belta": "basic" },
  "background": "valley-farm",
  "schools": [ { "id": "boot", "endMs": 0, "result": "graduated" }, { "id": "infantry", "endMs": 0, "result": "graduated" } ],
  "drills": { "room": { "rung": 1, "reps": 7, "lived": ["room:stack", "room:open"] }, "passage": { "rung": 1 } },
  "inoc": { "pts": 6, "n": 0, "sol": 214 },
  "firstFire": false
}
```

- `skills[k]` is `[base, bg]`. A skill that is missing reads as `[0, 0]`.
- `train` holds hours toward the next point; `field` holds the sol's field-learning credit (§6.5).
- `rustAt` is the index `k` of the last rust period rolled, and `fit.week` the index of the training week, both counted from the career's start in `RUST_PERIOD_MS` and `FIT_WEEK_MS` (§7).
- The crowd has no sheet (§11.2).
- `inoc` (2026-11-07, §6.8) is the inoculation counter: `pts` 0 to 25, `n` the runs counted on `sol` (at most 4); the player's and persistent people's, NPCs read theirs from the template; `upgradeState` fills an old save's from the summary paper (6). Hardening itself is derived, never stored.
- `drills[family]` holds a drill family's rung, its clean runs and the bundles lived by hand (COMBAT §25.3); the player's only, NPCs read theirs from the template. `upgradeState` fills an old save's from the summary paper (room 1, passage 1).

### 15.2 A roll (in the log, as it is)

```json
{ "kind": "check", "skill": "marksmanship", "value": 11, "roll": 14,
  "mods": [ { "why": "dusk", "v": -1, "src": "env" }, { "why": "tired", "v": -1, "src": "need" } ],
  "total": 23, "nat": 0, "dc": 18, "hook": false, "tempo": "normal", "steady": false, "routine": false,
  "pressure": "fire", "ok": true, "margin": 5, "grade": "good", "by": "p233", "them": false, "hidden": false }
```

**From the shoot house rework** (§5.1, designed 2026-11-11), a check gains two additive fields: `caught: true` on a natural 1 that was caught (then `ok: true`, and the grade by the margin) and `clean: true` on a natural 20 on timed work. Each is absent otherwise, so saves made before keep their records as they are.

An opposed roll is `{ "kind": "opposed", "ours": side, "theirs": side, "ok", "margin", "grade", "them", "hidden" }`, where each side is `{ skill, value, roll, mods, total, nat, by }` (tradecraft's shape, plus `by`, `grade` and `hidden`). `by` is the roller's person id; the player's is an ordinary `p<n>`, as everyone's (CONTRACTS §10).

### 15.3 What the character knows of someone (`state.mind.known[personId]`)

```json
{ "reads": 3, "at": 18290000, "skills": { "cqc": [11, 19], "fitness": [9, 15] },
  "cls": "soldier", "trained": "well trained",
  "rank": "Sgt", "name": "Ruiz", "unitId": "2/4", "badges": [ "rifle-expert", "mcmap-brown" ],
  "mood": { "fear": ["a little wary", "you think so"], "trust": ["believes you", "a guess"], "at": 18290000 },
  "fights": { "won": 0, "lost": 1 }, "armour": null }
```

### 15.4 The instinct (runtime only)

```json
"$instinct": { "line": { "id": "late", "voice": "di", "tone": "warn", "text": "…", "act": "walk:formation", "ms": 18290000 },
               "chip": { "id": "need", "tone": "warn", "short": "Drink", "act": "walk:fountain", "ms": 18291000 }, "keys": [ "B", "F" ],
               "queued": 1,
               "gone": { "salute": 18240000 }, "humourAt": 18100000, "net": [ { "fromId": "p<n>", "text": "…", "until": 18295000 } ] }
```

It is rebuilt from the state each tick, so a load only forgets the repeat timers. The newest order waiting for an answer (B's target) is not kept here: it is PEOPLE's and COMBAT's order record, read through. As built in v0.0.4, `instinctNow(state)` gives `{ line: { id, voice: 'di', tone, text, act, ms } | null, chip, keys: [], queued, gone, humourAt }`, and T sends `{ act: 'instinct', args: { id, act, chip } }` for the line shown when the key went down.

---

## 16. Code: modules, ports and reuse

TECH owns the layout. My proposal is `src/sim/skills/`, all pure, each opening with a prose header, depending only on `src/core` and on BODY's and PEOPLE's exported helpers.

| OLYMPUS module | From tradecraft | Verdict | What changes |
|---|---|---|---|
| `skills.js`: the list, classes and weights, `value()`, `own()`, level words, `paceOf()`, `mitigated()`, `nerveOf()` | `src/sim/skills.js` (56 lines) | adapt | the sixteen skills and their uses; Warfighting, Spacecraft, Intuition, Streetwise and Tradecraft weight tables; `[base, bg]` instead of `[base, practice]`; `OWN_MAX`; strain removed from `skill()`; the one pace helper |
| `checks.js`: `check()`, `opposed()`, `won()`, `oddsOf()`, `opposedOdds()`, `grade()`, `groupCheck()`, `checkText()`, `checkShort()` | `src/sim/checks.js` (79 lines) | adapt, near as is | `src` on mods; help, routine work, tempo, steady (rolled, +3, a softer ladder), retry; pressure; grades; `hidden`; body and need modifiers through BODY's functions, injected so they don't import each other |
| `xp.js`: `cost()`, `gain()`, `level()`, `trainingXP()`, `opXP()`, `fromRoll()`, `progress()` | `src/sim/xp.js` (74 lines) | adapt | the one XP table of §6.2 (training, line and special operations, extras, deployments), merged from COMBAT's and CAREER's drafts; the training cap; fade; first fire; roll XP by pressure; `LESSON_XP_K` |
| `training.js`: `hoursFor()`, `train()`, `learn()`, `teacherK()`, the syllabus table, `fieldCredit()` | `src/sim/training.js` (98 lines) | adapt | teacher kinds and caps; the instructor factor; field learning; Belta's factor; the bookshop becomes the terminal's manuals |
| `schools.js`: the floors table, `graduate()` | `src/sim/career.js` FLOORS (pattern) | new on a pattern | the military schools; CAREER calls `graduate(p, id)` |
| `rust.js`: `rustOff()`, `practise()`, `rustRoll()`, `opCleared()` | `src/sim/rust.js` (65 lines) | port | `RUST_PERIOD_MS` (28 sols, the only definition); the military keeps; operations clearing rust by kind |
| `src/sim/body/fitness.js` (BODY §2.7 owns the module; this section's rules and `FIT_WEEK_MS` are in it): `exercise()`, `onFoot()`, `rollWeeks()`, `weekWords()` | `src/sim/fitness.js` (77 lines) | port | `FIT_WEEK_MS` (7 sols, the only definition); marine activities by BODY's kinds; BODY's gravity and load factors called, never copied; SKILLS's `value()` reads effective fitness through the helper injected into it, so `skills/` does not import `body/` (TECH correction 8; CONTRACTS §13) |
| `templates.js`: NPC tiers, `rollSheet()`, `crowdValue()`, `RANK_WF` | `src/sim/people.js` `sheet()`/`passerby()`, `campaign.js` BACKGROUNDS | new on a pattern | the tables in §10 and §11 |
| `know.js`: `sizeUp()`, `insignia()`, `priors()`, `readMood()`, `fought()`, `seenInAction()` | `src/sim/know.js` (80 lines), `src/sim/belief.js` (66 lines) | adapt | Awareness instead of Analysis; the never-centred offset; insignia facts and priors; mood words with a confidence |
| `feel.js` | `src/sim/sense.js` (179 lines) | adapt | Warfighting instead of Tradecraft; no naturals; vacuum and bulkhead modifiers; the street coupling (`Z`, rows) removed; the patch handed to PEOPLE's perception |
| `instinct.js`: `settle()` plus the rules | `src/sim/instinct.js` (53 lines), `src/sim/tutorial/earpiece.js` | port `settle()`, adapt the earpiece | `place()` dropped (street-only); repeat and minimum-time rules; voices; tiers; relaying the net; the chip and the queued count; B's and F's reaches; the rule lists in `instinct/base.js` and `instinct/field.js` |

**As built in v0.0.5** (the build sheet 0.0.5 §2.2, §8 item 11): `skills.js` (the sixteen skills and their uses, `own`, `value`, the one `paceOf`, `mitigated`), `checks.js` (`check`, `opposed`, `won`, `grade`, `oddsOf`, `checkText`, `checkShort`: tradecraft's dice bit for bit, its own log line word for word) and `templates.js` (the tiers, `rollSheet`, `sheetOf`, `valueOf`), all in `src/sim/skills/`; no rust, training or XP yet. **Skills don't import the body**: COMBAT's **`rollerOf(state, pid, { ms })`** (`src/sim/combat/roll.js`; CONTRACTS §13) brings BODY's `bodyMods` and `needMods` on the skill's uses and "no light to see it by" −2 on handling in the dark, so the plaque's odds and the roll's are one list; `fixedRoller` is the tests'. `tests/syntax.test.mjs` holds the pace rule: no function or top-level constant named for `pace` outside `skills.js`.

- **From LONGHAUL**, nothing here is ported. `careers.js` rank gates (XP plus a skill threshold) are a pattern for CAREER. `crew.js`'s practice formula (`skill += 0.0006 × min × (1 − skill/110)`) is not used: OLYMPUS counts hours.
- **Tradecraft quirks fixed in the port:**
  - shown odds now include the body and needs (quirk 1);
  - fatigue is visible in the log instead of hidden in `skill()`;
  - the never-centred rule is now actually guaranteed;
  - NPCs roll through the same `check()` with the same body modifiers (quirk 3's spirit).

---

## 17. Tests

`tests/skills*.test.mjs`, run by `node tests/run.mjs skills`. Each test prints the numbers below, and the design notes keep the latest, as tradecraft did.

| Test | Prints | Must hold |
|---|---|---|
| `checks` | success rate over 100,000 checks for each value − DC from −22 to +22, against the analytic odds | within 0.5 points; 95% and 5% caps; naturals forced |
| `checks.opposed` | the opposed grid of §5.1 over 100,000 rolls a cell | ties to the first side; matches the exact two-dice table |
| `checks.text` | `checkText` and `checkShort` for 9 golden cases (natural, routine natural, hook, help, steady, opposed `them`, hidden, retry, tempo) | strings unchanged |
| `checks.routine` | fumbles per UNLOAD SHOW CLEAR (halts, and those leaving a `?` or a drop) at Weapon handling 4, 10 and 18, rested and lit, and exhausted, cold and dark, through WEAPONS's macro data; the same at pressure `danger` | §5.1's table: under 3% at 10 and under 1% at 18 rested; at `danger` every natural bites again; a shot's hit roll and an opposed roll are never routine |
| `checks.steady` | per 400 tries at DC 4, 9 and 10: fails, grades `bad` or worse, naturals with teeth, normal and steady, at Weapon handling 0, 4, 10 and 18 | §5.9's table; steady never sets the die; a natural 1 is never softened by steady, only by routine |
| `checks.determinism` | the same seed gives the same 1,000 rolls; a save and load mid-run changes nothing | identical JSON |
| `skills.value` | the value grid of §3; each tier's min, median and max over 1,000 generated sheets (§11.1) | inside the table's ranges |
| `skills.starts` | every background × MOS start sheet (10 × 7) | totals and caps hold; no value over 15 at the start (the highest: a shooting-league rifleman's Marksmanship, (8 + 1 + 4) × 1.17) |
| `xp.career` | the career of §6.2 over 50 seeded runs: Warfighting after standby, voyage, each tour, recon, raider, and the XP of the single operations listed under it | the first standby 16 (a slipped one 16 to 17); the 6.9-day voyage 17; quiet tour 28 to 32; hot tour 34 to 38; second tour 36 to 40; recon year 3 in 53 to 56; raider year 5 in 69 to 72 |
| `xp-tables` | the merged table of §6.2 (training, line operations, special operations, extras, deployment, rolls) and every multiplier ladder | **one source**: every `kind`, `fight`, `outcome` and extra that COMBAT's, CAREER's and TIME's modules emit (`op-done`, `block-done`, `deployment-done`) exists in `xp.js`'s tables; no module outside `xp.js` defines an XP amount or multiplier (the syntax test's scan: no constant named `*_XP`, `*XP_K`, `OUTCOME_K`, `FOE_K`, `RISK_K` or `ROLE_K` elsewhere in `src/`); the docs' own copy: COMBAT.md and CAREER.md carry no XP base, only references to §6.2 |
| `training` | hours to each base; a standby week of the Plan of the Day: hours per skill and points gained; the caps of each teacher | no base above its teacher's cap |
| `rust` | 30 unpractised → 27 → 25 → 22; a range day every fortnight keeps Marksmanship 20; a contact clears the core four; the 6.9-day voyage out and the 12.5-day voyage home (CONTRACTS §14) with and without the simulator range; period boundaries across a Mars-to-ship move | as stated; periods fall at `k × RUST_PERIOD_MS` from the career's start whatever the calendar; `RUST_PERIOD_MS` and `FIT_WEEK_MS` are defined once in `src/` |
| `fitness` | the hold and climb table; the Melas standard week's load on Mars through BODY's helper, item by item (56.7), with one run, one centrifuge or one gym session added; the same week on Europa (39.2) and with three gym sessions (59.7); 6 weeks of skipped PT from base 14 | holds 14 and climbs with any one addition; loses 1 effective a week without PT, then the base; SKILLS calls BODY's factors and defines none (no `gK` in `src/sim/skills/`) |
| `know` | 20,000 reads: share with the truth inside (must be 1.000), share centred (must be 0.000), mean half-width by margin; insignia priors for 5 uniforms | as stated |
| `feel` | the §13 table: per-roll and per-minute rates by tier against both snipers; hunches per hour below 30 | private 0% against any sniper |
| `instinct` | a scripted morning at Melas (reveille to formation, a safety left off, an officer passing, a full bladder), the line and chip timeline second by second | never more than one line and one chip; no line or chip shorter than 3 s; a hazard behind a failed roll never speaks; the chip's keycaps and count match the rules firing |
| `instinct.reach` | a scripted moment where three rules fire at once (a full bladder at warning, an officer passing within six paces outdoors, an order relayed on the net), then the same with a muzzle line on top; each key pressed in turn, from a fresh copy of the moment | each rule is reachable with one key: T the line, T held the chip's keyless line, B the order, F the salute, in both moments; the chip shows `{B}` and `{F}` while those wait off the line; a rule done by its own key leaves the ranking that tick |
| `instinct.net` | an order relayed, acknowledged with T, with B while another line is shown, and ignored for 30 s | the ack events at once for T and B; the repeat and failure events at 10 s and 30 s |
| `hard` (quick; 2026-11-07) | §6.8's values from the templates and the test sheets; the career's stretches; the toll on a tier one | hardening not monotonic in Warfighting within a class; inoculation past its teacher's cap or past 4 a sol; a real fight adding inoculation |
| `pace` (with TECH's syntax test) | `paceOf` at 0 to 46; TIME's `clean-rifle` and `suit-up` at the reference marine | §5.12's table; no function or constant with `pace` as a word of its name outside `src/sim/skills/skills.js` |

QUICK mode skips the 100,000-roll grids and the 50-run career, which are marked heavy. `checks.routine`, `checks.steady`, `xp-tables` and `pace` are exact or static and run in QUICK.

---

## 18. Fun

**The decisions this system creates:**
- **What to do with free hours.** Every hour off the Plan of the Day buys something: the range for Marksmanship, the zero-g hall before a voyage, Belta in the evenings before Europa, the rack. The user's "time should feel like a currency" is the core of it. The sheet's progress line ("7.5 of 10.4 h toward 9") makes the price visible.
- **Who you become.** The MOS and the schools set an identity. The machine gunner, the sniper, the corpsman-minded rifleman and the boarding marine are different games with the same rifle. A selection school is a cliff on the sheet: Recon's Warfighting floor of 50 is a before and after you can feel.
- **Rushing or taking care.** In danger, a charge placed carefully (+2, ×1.5 time) or rushed (−3, ×0.6) is a real bet. Out of danger, work that is routine for a trained hand costs him only time when the die betrays him (§5.1), while the recruit still needs luck, and taking it steady (×2 time, +3) buys him some, never all. The difference between a recruit and a veteran shows in what they can do without luck.
- **Volunteering.** Warfighting grows from operations, and from training only up to 25. To grow you must go where it's dangerous: the QRF, the boarding party, the patrol nobody wants. Risk pays in the coin that matters (§6.2).
- **Whom to trust.** Reading people (insignia, sizing up, mood, lies) gives a partial picture with a confidence on it. You choose who to bring, who to believe, and whose order to question.
- **Upkeep on voyages.** Rust gives the long quiet weeks a choice: keep the skills you'll need on arrival, or rest and socialise.

**The stories it creates:**
- The private who felt nothing when the sniper watched, and the sergeant who did.
- The corporal with a grey belt who loses a bout to the quiet one with a brown.
- The rifle badge that told you more about the new lieutenant than his words did.
- The DI's voice saying "He has a mother" the first time your muzzle crossed a friend.
- The squad leader whose bad contact report sent the team the wrong way. His Comms roll is in the log.

**Where it could turn into chores, and what removes them:**

| Chore | What removes it |
|---|---|
| Rolling for every routine job (cleaning, the suit check, the armoury) and fumbling on a natural 1 | Routine work (§5.1): out of danger, a natural 1 on a job you'd make without the die costs time only, so a trained hand is slow at worst. The die still rolls, and for the untrained and the impaired it still bites |
| A salute or an acknowledgement lost behind a need on the one line | The chip shows the next keyless line (T held), B acknowledges the newest order and F salutes, whatever line is shown (§14.1) |
| Living every training block to grow | Skipping a block gives the same hours and shows representative rolls (§6.3, §6.4) |
| Keeping rust off by hand | The Plan of the Day keeps the core skills by itself (§6.4), operations clear rust (§7), and the DI says what's slipping |
| Reading everyone you meet | Uniforms read themselves within a few metres (§12.2); in a fight the read is automatic |
| Wondering what to do next | The instinct line always has the next useful thing, and T does it (§14) |
| A wall of numbers | The player's sheet shows level words and bars as well as values; other people are words and ranges, never false precision |

---

## 19. Build order

ROADMAP owns the milestones (§3.4 there holds over this section's earlier proposal: CONTRACTS §18). This is what SKILLS needs, in order.

**The first playable (0.1.0: the core standby week at Base Melas; ROADMAP §5):**
1. `checks.js` with every rule in §5. Routine work, tempo, steady and retry are needed at once by the armoury, the cleaning bench and the suit locker.
2. `skills.js` with the sixteen skills, the soldier and civilian classes, `value()`, `paceOf()` and `mitigated()` (built at 0.1.0; EVA in use, with the suit, at 0.1.x with the Tank: ROADMAP §3.4, §5.8).
3. `templates.js` with the tiers seen on base: recruit (none at Melas, but Depot flashbacks), private through gunnery sergeant, second lieutenant, Navy rating (Melas's shuttle crews), Redwater's civilians, MSS. `RANK_WF`.
4. Starting values: the rifleman MOS and the ten backgrounds (§10).
5. `training.js` and the syllabus of §6.4 for every block of Melas's Plan of the Day. Skipped blocks show their representative rolls.
6. `xp.js` with training XP and roll XP. Operation XP is in the tables but unused.
7. `rust.js`. In a week it hardly fires, but its periods and keeps run from day one, so saves carry them.
8. Fitness's rules and `FIT_WEEK_MS` in BODY's `src/sim/body/fitness.js` (BODY §2.7 owns the module), with BODY's gravity and carry factors; `value()` reads effective fitness through the injected helper (TECH correction 8).
9. `know.js`: the size-up, insignia facts and priors, and the mood read.
10. `instinct.js` with `settle()`, the chip and the DI's base rules of §14.4, with B acknowledging spoken orders and F rendering salutes.
11. The tests in §17, except `feel` and `instinct.net`.

**0.2 and 0.3 (the voyage and Europa):**
- operation XP and fade, field learning, languages (Belta classes aboard, immersion);
- the NCO on the net and the field rules of §14.5;
- the feel;
- Comms contact reports;
- group checks and leaders' briefs;
- templates for insurgents, ice miners, corporate security and constables;
- the under-ice and EVA schools.

**0.4 and 0.5 (combat depth and boarding):** pirates and the spacer class in fights, Demolitions breaching, Tactics reads of fire, abstract engagements, and Zero-g penalties in full.

**0.6 and 0.7 (special operations):** the sniper, recon and raider schools with their Warfighting floors, the tier-one template, MNI spooks, plain-clothes Fieldcraft.

---

## 20. Cross-references (what SKILLS relies on)

- **BODY**:
  - `bodyMods(p, key, ctx)` and `needMods(p, key, ctx)`, honouring `SKILLS[key].uses`;
  - the fatigue ladder and the needs' bands, as named modifiers;
  - the suit's base penalties (gloves, bulk, visor) and free-fall base penalties, which SKILLS reduces;
  - **the one helper for exercise load**: `fRun`, `fWalk`, `fWork` and the load term `(1 + loadKg / massKg)` of §3.1, exported for `body/fitness.js` to call (§8), and the any-g sessions (gym 10, combatives 7, centrifuge 8). SKILLS's own `gK` and `carryK` are gone, and §15.1's worked figures follow its formulas (a km run on Europa 0.66 points, a 10 km ruck march with 30 kg on Mars 5.3);
  - §15.1's training week, `FIT_WEEK_MS` (7 sols, absolute time since the career began, §7 and §8), not the calendar's Monday to Sunday, as BODY now reads it;
  - the capacities Fitness drives; G-conditioning, deconditioning, pain and the adrenaline rule in CQC;
  - every aid DC and base time (at value 10); aid steps are procedure, so routine work (§5.1) applies to them out of danger.
- **WEAPONS**:
  - every handling DC and base time (at value 10), shot DCs, fumble ladders;
  - which steps roll Weapon handling and which Marksmanship;
  - **routine work** (§5.1): §5.4's ladder and its natural-1 die (`NAT1_DROP`, `NAT1_SHOT`) give way to `r.routine`, which costs only the miss's time (no `?`, drop, discharge or flag), and §5.3's macros do not halt on a routine miss. The habit check of carry (§6.3) is procedure; a shot's hit roll is not. §5.4's negligent-discharge table keeps its impaired and recruit rows (routine work does not reach them) but its trained rows in good conditions fall to about 0, and §6.3's "private, 10 … 5% fail (a natural 1)" at low ready rested becomes 0 on base; both want recomputing;
  - **steady** (§5.9): §5.1's sentence "(×2 time, the d20 counts as 10, no naturals)" becomes "(×2 time, +3, the d20 rolled with its naturals, the ladder one grade softer)". §9.3's "taken steady, a private at Weapon handling 10 makes margin 11 at DC 9 and leaves nothing" becomes margin d20 + 4 (residual nil 75% of the time), and §10.3's choice at the bench ("take it steady in 60 and walk through") wants its odds recomputed;
  - the `upkeep` test prints tradecraft's comparison under these rules: 400 tries each of unload, fill, empty and recondition at the bench, at Weapon handling 0, 4, 10 and 18, normal and steady: discharges into the table, rounds lost, magazines bent (tradecraft: untrained 25, 138, 21; an expert none);
  - qualification scores and the badges they earn; weapon familiarity as a `gear` modifier; showing odds through `oddsOf()`.
- **COMBAT**:
  - CQC and edges; when Nerve is rolled;
  - orders, their generation from an NCO's Tactics, and the facts the field rules read;
  - **§17.4 replaces its XP numbers with references to §6.2**: its training classes map to `ACT_XP` (range day, mat session as MCMAP, fire-team drill, field exercise, shoot house as CQB, suit drill, EOF lane), its combat classes to `OP_XP` and `EXTRA_XP` (contact, rooms cleared, boarding, EVA as a fight with vacuum and free fall, ship engagement, damage-control jobs, CASEVAC, EOF incident, detention), its outcome list to `OUTCOME_K` (met with no KIA `clean` or `done`, met with KIA `costly`, contact broken on order `broken`, failed `failed`, fled or disobeyed `fled`), its difficulty to `FOE_K` by `q` with the odds factors, and its risk list to `RISK_K`'s situation factors and `ROLE_K`'s wounded; "plus 0.1 for each won roll" becomes `ROLL_XP` by pressure. §17.3's after-action `xp` line is `opXP()`'s breakdown;
  - `op-done { kind, fight, outcome, q, odds, place, situation, led, wounded, extras }` for a fight on a line operation;
  - contact reports and radio links (with TECH); the after-action's hidden rolls.
- **PEOPLE**:
  - perception (the view cone with Awareness, laying the feel's patch);
  - the gauges and how hooks are gained; willingness to help;
  - roster generation from `templates.js`; NPC growth calls;
  - customs (salutes at 4.5 m, "six paces"), orders on base and memory of failures to obey; §6.6's "T does it" for customs gains "or F on the officer", and an order spoken on base can be answered with B (§14.1);
  - the NCO's manner.
- **TIME**:
  - the activities and the Plan of the Day (lengths, splashes, interrupts);
  - **§8.1 replaces `chorePace` with `paceOf()`** (§5.12) for every skill-scaled activity (`suit-up` by EVA, `clean-rifle` by Weapon handling and the rest), and test 7 is recomputed with it (`clean-rifle` after a range day 39:00 at value 10, 40:33 at 9; `suit-up` 9:25 at EVA 6). its cross-references' request to SKILLS ("a pace curve (or acceptance of `chorePace`)") is answered: the curve is `paceOf`;
  - §11.3's absolute periods, which cite `RUST_PERIOD_MS` and `FIT_WEEK_MS` (§7, §8; CONTRACTS §5) and restate no period;
  - `block-done` events; the skip contract calling `rustRoll`, `rollWeeks` and the skip stream;
  - chapters offering training choices on voyages; the calendar's week (for rosters and rest sols, not for fitness or rust).
- **CAREER**:
  - character creation offering backgrounds and MOSs;
  - schools (pipelines, gates, lengths, washouts) calling `graduate()`;
  - promotion gates using the values and `RANK_WF`;
  - **§11.4's XP bases and multipliers are replaced by references to §6.2**: each mission kind of §11.3 is a kind in `OP_XP`, its outcomes map to `OUTCOME_K` (clean `clean`, costly `done` or `costly` by whether ours died, partial `partial`, aborted `aborted`, compromised `compromised`, failed `failed`), the opposition's quality band gives `FOE_K` by its middle `q` (replacing `0.8 + quality/20`), and "a deployment completed +10 (+15 if it saw combat)" becomes `DEPLOY_XP` 3 or 5, sent as `deployment-done`. The lessons' `LESSON_XP_K` 0.4 is §6.2's;
  - `op-done` for a mission, never for a fight COMBAT already reported;
  - the DI's name; record book access.
- **SETTING**: the MOS list and names, ranks and insignia, badges and MCMAP belts, background lore, languages and who speaks them, the pools the DI is drawn from (the person is generated, CAREER §4.7).
- **PLACES**: one helper each for light, gravity regime, atmosphere, noise, smoke and dust, used as `env` modifiers; damage-control tasks and their DCs.
- **VIEWS**: the sheet, the guessed sheet, the read card, the log and the top-left line, the instinct line and the radio box, the felt plaque, the instinct setting. For §14.1: **T held** (`TAP_MS` 220) does the chip's line, the chip drawn after the line with its short text, the keycaps of waiting orders and customs and the queued count, before R's chip; **B tapped** acknowledges the newest order and **B held** opens the net panel (§10.1's B row); **F** on an officer due a salute renders it before opening the people menu; the step panel's word "routine" (§5.1).
- **TECH**: module layout, rng streams, `$`-stripping and `upgradeState` for new skills, the test runner. Two rules for `tests/syntax.test.mjs`: no function or constant with `pace` as a word of its name outside `src/sim/skills/skills.js` (§5.12), and no XP table or multiplier outside `src/sim/skills/xp.js` (§6.2, the `xp-tables` test).

---

## 21. Open questions for the user

1. **One skill for the gun or two?** OLYMPUS splits tradecraft's Weapon handling into Marksmanship (the shot) and Weapon handling (everything done to the gun). That way barracks life (cleaning, drills, the armoury) trains handling and the range trains shooting. **Default: two.**
2. **Should selection schools lift Warfighting at graduation**, as the illegal's school lifted Tradecraft to 80? Recon to 50, raider to 65. **Default: yes.**
3. **The DI's voice: a specific, named drill instructor** from the player's recruit training, who may turn up again later in the career, or an unnamed "voice of training"? **Default: named**, and generated at signing like every person (your "All people generated", 2026-11-05), so each career's DI is a different one.
4. **Should the instinct's advice get better as skill rises?** A high-Tactics marine would hear where to flank; a novice hears "get to cover". The other option is advice that stays plain while only what you notice improves. **Default: better advice with skill.**
5. **Living a training block or skipping it: the same growth?** Or a bonus for living it? **Default: the same.** Living it is for its own sake, and a skip is never a penalty.
6. **Your own sheet: exact numbers or words only?** Tradecraft showed exact values; other people are always ranges. **Default: exact numbers for your own sheet.**
7. **Routine work: how forgiving out of danger?** A natural 1 costs a trained hand only time when the job is one he would make without the die (§5.1), so a private at 10 never fumbles a show-clear in good conditions and a recruit still fumbles about half of them. The stricter option counts the natural only as routine with two points to spare (`ROUTINE_AT` 2): a private fresh from school at 9 then fumbles his charge one show-clear in twenty. **Default: `ROUTINE_AT` 0.**
8. **Natural 20s: shown, or shown and clean?** (designed 2026-11-11, §5.1) A natural 20 on timed work takes ×2/3 of its time and draws a ★, the mirror of the catch's ×1.5 and `~`, so the two are seen equally often and a long run's mean time moves by +0.8%. The other option is a ★ alone, with no time effect: the 20 is then seen but still does nothing for a trained hand. **Default: clean (×2/3).** **Answered 2026-11-11: the default** (the user: "good defaults").
9. **Where mastery starts.** A natural 1 is caught for a roller at value 15 or more who would make the roll by 10 without the die (§5.1): the Raider and the tier one never miss on a 1, the sergeant rarely and the corporal on easy shots, while the private and the recruit keep theirs. A wider rule (a margin of 5) gives the corporal and sergeant nearly all of it; a narrower one (a value of 25) gives it to the Raider and the tier one alone. **Default: value 15, margin 10.** **Answered 2026-11-11: the default** (the user: "good defaults").
