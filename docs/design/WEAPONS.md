# WEAPONS: the rifle, the round, and what the marine does with them

This section owns the arsenal and its makers, calibres and their ballistics (Mars air, low g, vacuum, ships), magazines and feeds, safeties and selectors, optics and the suit-HUD link, shipboard frangible against ground ball and AP, cased ammunition and brass in every gravity, the gun's state machine and every handling action with its time and DC, carry postures and the muzzle cone, the shot's resolution from 0 to 600 m and beyond, penetration of armour, suits and bulkheads, maintenance and Mars dust, the armoury and its accountability, the rifle and pistol qualification courses, grenades and explosives in pressurised spaces, and how NPCs use the same steps. DESIGN.md is the hub and wins where the two disagree.

Written 2026-11-05 from the hub's settled decisions, the research notes (`docs/research/tradecraft-sim-combat.md`, `tradecraft-design-2.md` §14, `tradecraft-design-3.md` §8, `longhaul-setting.md` §4, `longhaul-combat.md` §3) and tradecraft's code read directly (`../tradecraft/src/sim/firearms.js`, `shooting.js`, `gunwork.js`, `paper.js`). Numbers not quoted from the user are mine, "to be tuned in play" (tradecraft's convention). The people named in examples (Diaz, Okafor) are examples of what PEOPLE's generator draws (the user, 2026-11-05: "All people generated"); the ranges, armouries and decks a gun is used in are PLACES's authored places, the same in every career. Numbers marked **[computed]** come from a scratch ballistic model (point mass, G7 drag, the air and gravity tables in §2.1) that `src/sim/arms/ballistics.js` re-implements; its test prints the same figures (§16).

Revised the same day after the design review by five critics (my calls throughout): MCRN hulls fly in PLACES's 66 kPa Martian standard air, and UN hulls get a class of their own (§2.1); ballistic tables are stored on the bore line and interpolated over air, with gravity exact (§2.1, §2.5); spin habitats get their own flight (§2.9); a clean gun is service-grade reliable (§4.3); recoil spin uses a body's real inertia (§7.8); one hole helper serves BODY, COMBAT and PLACES (§8.6); one fragment helper and one closed-room blast helper serve COMBAT (§12.3, §12.4); barrels can fail and rounds cook off from the chamber's heat (§9.5); guns cold-soak on Europa (§9.6); ice is weaker against rifle fire (§8.5); the habit check rolls once an approach and turns a competent carrier's bad luck into a near miss (§6.3); the rifle comes out nearly every working sol (§10.8); the plaque shows what the shooter believes (§7.10); the pits are livable (§11.5); habit rolls go to J (§6.1, §6.3).

Revised 2026-11-07 for v0.0.7 as built (the build sheet `docs/build/0.0.7.md` §8 items 2 to 41, the roles' reports, the code, runtime and design reviews and the fixer's; DESIGN.md's log of that day): the turrets, the true and believed zero and the dope card (§2.5, §3.5); the R-7's supersonic range (§2.7); brass on 1 m tiles and policing as the player's action (§2.8, §10.4); range safety in full and the panel's marks (§6.4); the ND's line through the world and the foot (§6.5); ND-4, ND-5 and the casualty (§6.6); sitting (§7.3); bias on paper in centimetres, the wind's closed form, the reads and the hold convention (§7.4); the plaque on a face (§7.10); `penetrate.js` (§8.5); the KD faces and the 200 m string's cut (§11.1); the relay (§11.3); zeroing in pooled groups (§11.4); the pits as built (§11.5); open questions 13 to 15.

Revised 2026-11-07 for v0.0.8 as built (`test-pairs` "Pairs": the build sheet `docs/build/0.0.8.md` §8 items 10 to 19, §9 and §10; DESIGN.md's log of that day): the reloads by purpose built (§5.3); an ND-1 a fault on the pairs course (§6.6); the tap retired (§7.1, §7.6); a round's record at its formula time, the man-target and its zones, the row's climb (§7.11); the armoured silhouette's steel (§8.5).

Revised 2026-11-07 for COMBAT §5's suppression and hardening (DESIGN.md's log of that day): §5.1's pressure penalties (`fire` −3, built; `danger` −1) and §7.3's "incoming fire" retired into COMBAT's one felt modifier, and the hands and the aim slowed by the chaos.

Revised 2026-11-08 for the user's lore and look of that day (DESIGN.md's log; SETTING §5.11): the ground kit's reason (§2.2); the void arms, the zero-g branch, with the J-12 rocket carbine, the V-5X refined and the line launcher (§3.9, §3.7, §2.1); the look of the standard issue and of the variety marines carry, with the R-5 (§3.10, §3.7); two anchors (§7.8); open question 1 answered in part, questions 16 to 19.

Revised 2026-11-08 once more for the user's answers to the lore round (DESIGN.md's log, "Decided, kit", "Decided, zero-g arms" and "Decided, the factions' colours"): **one kit per squad** (§3: the player carries what the squad carries; variety comes by unit, role, posting and era; question 18 answered); **rifles stay rifles in free fall, and footing holds the recoil** (§3.9, §7.8; the V-5X over the shoulder is withdrawn, question 19 answered); **the Corps' colours** are red and black, so the gun's look takes a black take (§3.10).

## Summary

- **The gun is tradecraft's state machine** (`firearms.js`), ported whole and extended: magazine, chamber (live, dud, case, empty), jams, bolt lock, safety or selector, condition, and now fouling, Mars dust, lubrication, barrel heat, cold soak and frost. The holder's **belief** about the gun is kept apart from its truth: the HUD and the weapon card show only what the character knows. A clean gun is as reliable as a real service rifle (a misfire in about 6,700 pulls, a stoppage in about 1,700); dust, fouling, a worn magazine and a missed service are what make it jam.
- **Every handling action is a timed Weapon handling roll** with tradecraft's fumble ladder (a miss costs time, a bad grade drops something, a disaster with a ready gun fires it). Base times are at value 10 and scale by SKILLS' one pace helper. The Corps' commands (LOAD, MAKE READY, UNLOAD, UNLOAD SHOW CLEAR) are macros of rolled steps, so the chore is one key and the dice still decide.
- **The shot is a Marksmanship roll**, d20 + skill + named modifiers against a DC. The DC grows 5 points for each doubling of range past 10 m, so it never saturates across 0 to 600 m: a private and a recon marine are both sure at 7 m and far apart at 300. Position, optic, held aim, wind, holdover, lead, light, anchoring, gloves and the body are each one named modifier in the log. Systematic errors (wind, holdover, lead) share one helper, a bias measured in centimetres against the target's size. The plaque shows the odds as the shooter judges them, from their own range estimate and wind read; the true sum goes to the log after the shot.
- **Ballistics are real.** Mars' valley air (66 kPa, 0.894 kg/m³) has 73% of Earth's density and 0.38 g, so a 6.5 mm round zeroed at 400 m stays within 15 cm of the line of sight to about 500 m and the wind becomes the long-range problem. On Europa there is no air: a Mars zero shoots 31 cm high at 300 m, a level miss lands about 1.5 km off and one fired upward can come down 560 km away, and a barrel takes 46 minutes to cool from 400 to 100 °C. In a spinning ring the round flies straight while the floor turns under it: along Hygiea's rim a 50 m shot strikes 26 cm low with the spin and 25 cm high against it.
- **Loads are a decision.** Aboard ships the Corps carries frangible rounds that stay in the room. Ball holes pressure bulkheads into a slow, hissing leak (a 6.5 mm hole drains a corvette deck by 10% in 26 minutes from 66 kPa). AP beats the Corps' own plates two times in three at 100 m (the plate stops it 33% of the time).
- **The muzzle is a cone with a posture.** Slung, Sul, patrol, low ready, high ready and aimed each point the muzzle somewhere. Walking past people, the character's habit (a Weapon handling check, one per approach) keeps it off them; a trained habit is automatic, a competent carrier's bad luck is a near miss they notice and fix, and a real failure **flags** the other person (PEOPLE's event). A negligent discharge is a graded event with in-world consequences, and its usual cause is the realistic one: a step fumbled and not checked.
- **The armoury is a real place with a real ledger**: serials, weapons cards, signatures, round counts, a brass call, cleanliness inspected at turn-in, and a lost weapon that locks the base down. The rifle comes out of it nearly every working sol: the range and the field, the daily weapons drill in the maintenance block, and the ready platoon's guard about once a week.
- **Qualification** is the Corps' 250-point known-distance course on Mars metres, with CAREER's bands (Expert 220, Sharpshooter 210, Marksman 190). A boot-camp graduate at Marksmanship 8 mostly shoots Marksman, a private at 10 is a coin flip between Expert and Sharpshooter, a lance corporal at 14 shoots Expert 93% of the time [computed].
- **The arsenal** opens with 17 models from 7 makers (Hecate Arms & Drive first) in 9 calibres, and grows to 46 by 1.0, in two kits: the ground kit, chemical, cased and built for air and weight like the 2020s' service arms, and the void kit, built for free fall (low impulse, countermass, a rocket carbine: §3.9). The standard issue looks like a modern tan carbine; the variety marines carry is drawn as well (§3.10).

---

## 1. What the user asked for

| Date | The user | Where it lands |
|---|---|---|
| 2026-11-05 (brief) | "weapon controls like managing safety, muzzle discipline, fitness, medical aid and healing etc." | §6 (postures, the cone, flagging), §5 (safety steps) |
| 2026-11-05 (brief) | "guns being played with details like reloading being a remove magazine, put other magazine when we have magazines, clear chamber, aim the gun etc. Things must take time and not feel rushed with the ability to do activities that skip time" | §5 (every step timed and rolled), §9 and §11 (activities that skip) |
| 2026-11-05 (brief) | "Shooting should play as in Tradecraft" | §7 (stop motion kept, X and G kept, tradecraft's aim, taps and climb kept) |
| 2026-11-05 (hub, settled) | "Weapons run on tradecraft's firearms engine (state machine, timed steps, fumbles, muzzle discipline, malfunctions), with a Martian arsenal: Hecate Arms & Drive builds most of it, with other makers for variety; named calibres; shipboard frangible loads versus ground ball and AP; recoil, brass and movement modelled in low g and zero g. Shot resolution is retuned for military ranges. Every modifier is still in the log." | the whole section |
| 2026-11-05 (hub, pillars 2 and 7) | "The gun is a machine. Every weapon is a stateful object: safety, magazine, chamber, condition, what you know about it." "A negligent discharge, a missed formation or a dirty rifle all have in-world results." | §4, §6.6, §9, §10 |
| 2026-11-03 (tradecraft) | "model every part of a weapon that way (safety, loaded or unloaded, magazine or single bullet, can contain a chambered bullet and no clip, can be jammed and require servicing, can misfire if in bad condition etc. All actions on a weapon should require rolls against weapon handling" | §4, §5 |
| 2026-11-03 (tradecraft) | "ammunition shouldn't be 'rounds' it should be very specific calibers based on specific caliber magazines used on specific weapons"; "implement many kinds of firearms right away" | §2, §3 |
| 2026-11-03 (tradecraft) | "high skill makes this virtually instant" (thumb safety and selector) | §5.1 (pace squared) |
| 2026-11-03 (tradecraft) | "fumbling should have consequences … depend on weapons handling skill … accidental discharge and the bullet should potentially actually hit something depending on what we're facing"; "high weapons skill should at least protect in ways of muzzle discipline allowing us not to shoot some random civilian in the head" | §5.4, §6.5 |
| 2026-11-03 (tradecraft) | "there should be a 'aim' action before shoot, which should take time"; "if you're not aiming you can't shoot"; "Make aiming more natural … but no list"; "we shouldn't be able to draw a firearm out by pressing G … taking it out should imply we intend on using it" | §7.1 |
| 2026-11-03 (tradecraft) | "NPCs shooting at us should just move time forward normally as they do the things to ready their weapons" | §14 |
| 2026-11-03 (tradecraft) | "close to the table we should be able to do things like recondition magazines, take bullets out of magazine, unload the gun … all of these actions can fail with varying consequences depending on weapons skill" | §9.3, §5.3 |
| 2026-11-04 (tradecraft) | double and triple taps "with accuracy dropping … from recoil and recoil lessened by higher weapons skill"; "Armed npcs should also always carry ammunition (and use it, in such ways that they can run out)"; "when an npc gets taken down and was carrying a rifle, they should drop it"; "filling and emptying magazines with bullets should take time based on weapons handling skill"; the user's soft-vest complaint "my soft vest didn't seem to stop the two bullets"; armour that "should protect realistically from bullets" | §7.6, §14, §5.2, §8.3 |
| 2026-11-04 (tradecraft) | "the reflex window is spammed on us too, there should be a way to remember our choice for a while" | §12.2 (a live grenade's reflex card follows TIME's reflex rules) |
| undated (tradecraft) | "don't give me the QWERTY keybinds"; "very little storage space, no magic inventory, volumes and pockets" | §3.3 (magazine volumes), cross-reference to VIEWS's keys |
| 2026-10-26 (tradecraft) | "we only know what we know" | §4.2 (belief), §3.5 (the HUD link shows only what the gun can know), §7.10 (the plaque on the shooter's beliefs), §11.5 (the pits' marks are what the shooter knows of a shot) |
| 2026-10-28 (tradecraft) | "what we see is what our character evaluates as being true (we can't know for sure we're not about to be burned, especially if we're not very experienced)" | §7.10 (range and odds as the shooter judges them, in words when unsure) |
| 2026-11-05 (brief) | "with the everyday training looking like what it should be" | §10.8 (the rifle in the routine), §11.5 (the pits lived) |
| 2026-10-26 (tradecraft) | "once we did it once, remember it so next time … snap flash forward" (via TIME §9.3, "the first time is lived") | §10.8 (the weapons drill), §11.5 (the pits) |
| 2026-10-29 (tradecraft) | "we should not have the option to just fast travel to work, it would skip all the gameplay" | §10 (the armoury is walked to; only the queue skips) |

What I settle that the user did not: the arsenal, makers, calibres and their numbers, the shot formula, the posture set, the penetration model, the armoury flows, the course of fire, the grenade numbers. Each is marked (my call) where it first appears or in its table's caption.

**Where this bends reality, and why** (my calls):
- **The shot is a d20, not a dispersion cone.** Real hit chance is a smooth function of angular error; the d20 against a DC that grows by the log of range reproduces its shape and keeps every roll readable (pillar 3). The d20's caps stay: a natural 20 hits at any range the gun may aim to, a natural 1 misses at 3 m.
- **Penetration is one number a round and one a layer**, with a logistic between them. Real penetration depends on the projectile's build, the angle and the target's material in ways one number cannot hold. Obliquity is kept only for walls and fragments.
- **Ballistic tables are stored on the bore line** and interpolated over air density, speed of sound and muzzle velocity, with gravity taken exactly; the error against direct integration is under a centimetre at 500 m (§2.1). Spin drift, the planet's own Coriolis and aerodynamic jump are left out: they matter past 600 m, which the sniper rifles of 0.5 may add. A spin habitat's rotation is not left out (§2.9): there it changes a 50 m shot by a quarter of a metre.
- **Dust, fouling, frost, cold soak, cook-off and barrel failure rates** are tuned to the known behaviour (the US Army's 2007 extreme-dust trials, arctic practice, machine-gun and service-rifle manuals), not measured on Mars or Europa.
- **A grenade throws its fragments evenly** (`K / r²`); real ones do not. `K` is calibrated so that half the people standing in the open at 15 m are hit (the M67 class's effective casualty radius) (§12.3).
- **The closed-room blast is one quasi-static number** for the whole room (§12.4), from the Weibull fit that UFC 3-340-02's gas-pressure chart follows, capped at twice the ideal value; the reflected peaks and the time the pressure takes to vent are left to PLACES's flow.
- **Brass in free fall finds the grille in 1 to 3 minutes**; real ventilation varies by ship.
- **At 200 and 300 m the shooter learns where the round went from the pits**, as on a real KD range (built in v0.0.7, the fixer's call): the shot's log line holds the roll and the shooter's own terms (the range, the wind as read, the hold), and the pits' spotter and disk and the coach say where it went (§7.10, §11.5). The zero card at 25 m keeps the hole in its line, seen at once in PAPER.

---

## 2. Calibres, loads and ballistics

### 2.1 The flight model

One helper answers every ballistic question: `flight(loadId, barrelMm, env, rangeM, { zero, windMs, tempC })` returns `{ tofS, vMs, eJ, pathCm, driftCmPerMs, penMm, supersonic }`. It reads tables built at load time, at 5 m steps to the load's maximum range, so a shot costs a table lookup, not an integration (TECH's tick budget).

- **Point mass with G7 drag** (the standard long-range model). Retardation `a = ρ v² Cd_G7(M) π / (8 BC)`, with BC in kg/m² (G7 BC in lb/in² × 703.07). The G7 table (Mach 0 to 4) is the published standard; Mach uses the local speed of sound.
- **Air** comes from PLACES's `env` (the same record BODY reads: `pKpa`, `airC`, `windMs`, `gG`, `vacuum`) and its zone's mix (PLACES §3.2). Density `ρ = P M / (R T)` and speed of sound `c = √(1.4 R T / M)`, with M 29.62 g/mol for Martian air, outdoors and indoors alike (the hub's mix, and PLACES's **Martian indoor standard** of 66 kPa at 20 °C that MCR buildings, MCRN ships and the Europa FOB run), 28.96 g/mol for Earth air (UN hulls and stations, Ganymede's domes: PLACES's 101.3 kPa Earth standard), and the zone's own mix for Belter towns and anything else.
- **Gravity** is `gG × 9.80665` along the area's down. Free fall has none. A spin habitat's felt gravity is not gravity to a round: §2.9 flies it straight.
- **Powder temperature**: muzzle velocity changes by −0.5 m/s for each °C below 21 °C and +0.5 above (about 1 ft/s per °F, a common rule of thumb for military propellants), using the gun's temperature (§9.5). The rule is clamped to the propellant's tested range, −54 to +52 °C (the military ammunition test temperatures): a colder gun keeps the −37.5 m/s of −54 °C, and the cold soak's hazards take over (§9.6).
- **Barrel length**: `v = vRef × (barrelMm / refBarrelMm)^vExp`, with `vExp` 0.18 for rifle cartridges and 0.25 for pistol cartridges (my call; it reproduces the usual few metres per second per centimetre).

| Environment class | Example | g (m/s²) | Air (kg/m³) | Sound (m/s) |
|---|---|---|---|---|
| `earth` (reference only) | Earth at sea level, 15 °C | 9.807 | 1.225 | 340 |
| `mars-valley` | Melas floor, 66 kPa, −10 °C | 3.727 | 0.894 | 322 |
| `mars-datum` | 52 kPa, −25 °C | 3.727 | 0.747 | 312 |
| `ship-thrust` | an MCRN hull at PLACES's Martian indoor standard, 66 kPa, 20 °C, under 1 g | 9.807 | 0.802 | 339 |
| `ship-light` | the same air under 0.3 g | 2.942 | 0.802 | 339 |
| `freefall-air` | a coasting MCRN deck | 0 | 0.802 | 339 |
| `earth-ship` | a UN hull at Earth standard, 101.3 kPa, 21 °C (any thrust) | 9.807 | 1.200 | 344 |
| `europa` | the surface, vacuum | 1.314 | 0 | none |
| `freefall-vacuum` | EVA, a holed deck | 0 | 0 | none |
| `spin` | a ring station's rim, the Ring at Melas (§2.9) | ω²r felt; none in flight | the zone's | the zone's |

The classes are names for the tables this section prints; the sim does not pick a class. **The tables are stored on the bore line** (my call, after the review): for each load and barrel the boot builds, by direct integration with no gravity and no angle, the time of flight `t(d)`, the speed `v(d)` and the **drop per unit gravity** `D(d)` (s², the drop a gravity of 1 m/s² would give), on a small grid: air density ρ 0, 0.4, 0.8, 1.0 and 1.25 kg/m³; speed of sound 310 and 345 m/s; muzzle velocity 0.92, 1.00 and 1.08 times the barrel's reference (powder temperature, a worn bore). Then for any area:

```
path(d)   = d × tan(θ) − g × D(d) − h        h: the optic's height over the bore; θ: the sight angle (§2.5)
drift(d)  = windMs × (t(d) − d / v0)          metres, for a full-value crosswind of windMs (Didion's lag rule)
t, v, D   read trilinearly on (ρ, c, v0) at the area's air and the gun's muzzle velocity
```

For flat fire the drop is linear in gravity (drag acts along a nearly level velocity, so the horizontal motion does not feel g), which is why gravity needs no grid axis and free fall, Mars, Europa and a 1 g deck read the same table. `D` is interpolated as `D × v0²` and `t` as `t × v0` across the velocity axis, which keeps the interpolation linear where the physics is close to it. **[computed]** Against direct integration in five random environments (ρ 0 to 1.2, c 310 to 345, 0 to 1.1 G, muzzle velocity ±8%, zeroed in a different random environment), the worst error at 500 m is **0.5 cm in path** and 0.1 cm per m/s in drift. Lobbed fire (the G-40's indirect quadrant, §2.6's maximum ranges) is integrated directly at boot, once per load. **Self-propelled rounds** (the J-12's, §3.9) take a boost first (my call, 2026-11-08): `boost = { burnS, accelMs2, v0Ms }`, with `v = √(v0² + 2 a d)` and its time to the burnout distance, then the bore-line tables from the burnout speed; gravity's drop over the burn is integrated with them.

**As built in v0.0.11**: the nine classes (`ENV_CLASSES`) are a view of `ENV_PRESETS` through `ENV_CLASS_PRESET`; eight are v0.0.10's to the bit. Europa's class is 0.134 G x G0 = 1.31409 m/s². The earth-temperate row (Earth's denser air, rho 1.225 kg/m³) is printed: 84.6 cm at 300 m, a time of flight of 0.434 s (`env-matrix` pins it).

### 2.2 The calibres

Nine calibres open the game (my call: names, numbers and makers). Each is a real-world-sized cartridge given a Martian, Earth or Belt identity. A magazine takes one calibre and a box of rounds is one calibre (tradecraft's rule from the user, 2026-11-03).

| Id | Name | Bullet | Muzzle velocity (barrel) | Muzzle energy | G7 BC | Case, propellant | Recoil impulse | Who fires it |
|---|---|---|---|---|---|---|---|---|
| `9x21r` | 9×21 mm Republic | 7.5 g | 390 m/s (110 mm) | 570 J | 0.072 | brass 21 mm, 0.38 g | 3.2 N·s | Martian pistols (P-12, P-10) |
| `4.8x30h` | 4.8×30 mm HAD | 2.6 g | 735 m/s (230 mm) | 702 J | 0.080 | brass 30 mm, 0.48 g | 2.4 N·s | the V-5 PDW |
| `6.5x40r` | 6.5×40 mm Republic | 7.8 g | 790 m/s (460 mm); 735 (300 mm) | 2,434 J; 2,107 J | 0.230 | brass 40 mm, 1.95 g | 8.5 N·s | the Corps' rifle family (R-7, C-7, R-7M, L-20) |
| `7.6x56r` | 7.6×56 mm Republic | 10.9 g | 830 m/s (560 mm) | 3,755 J | 0.215 | brass 56 mm, 3.1 g | 12.9 N·s | S-9 DMR, M-2290 battle rifle, later the M-30 MMG |
| `12b` | 12-bore (18.5×76 mm) | 9 × 3.5 g buck; 28 g slug | 400 m/s; 440 m/s (360 mm) | 2,520 J; 2,710 J | 0.022 (pellet); 0.055 (slug) | polymer hull, 2.6 g | 14.1 N·s (slug) | B-12, Belt and security shotguns |
| `40x46` | 40×46 mm low-velocity grenade | 230 g | 76 m/s | 664 J | (Cd 0.30) | aluminium | | G-40 |
| `9x19` | 9×19 mm Parabellum | 8.0 g | 360 m/s (112 mm) | 518 J | 0.070 | brass or steel, 0.36 g | 3.1 N·s | Earth and Belt pistols and SMGs: "four centuries old and still everywhere" |
| `5.8x42un` | 5.8×42 mm UN | 4.15 g | 930 m/s (465 mm) | 1,795 J | 0.165 | steel 42 mm, 1.75 g | 6.3 N·s | the UN's FA-9 family |
| `7.62x39` | 7.62×39 mm | 7.9 g | 715 m/s (415 mm) | 2,019 J | 0.140 | lacquered steel, 1.6 g | 7.4 N·s | the Belt's TMW-6 and its copies |

Recoil impulse is the bullet's momentum plus the propellant gas's, with the gas leaving at 1.5 × muzzle velocity clamped to 700 to 1,400 m/s (Hatcher's rule of thumb) [computed]. §7.8 turns it into drift and spin.

**Why these, in the setting** (my call, for SETTING to voice; SETTING §5.11 now voices it, after the user's lore of 2026-11-08: "atmospheric optimized firearms (not very far from real life 2020 military guns) because they train for a conflict on earth against UN forces"): the Corps' ground arms are built for a war in air at 1 G, Earth's above all, so they stay chemical, cased and gas-operated, as the 2020s' armies' were when they moved from 5.56 mm to 6.5 to 6.8 mm-class rounds for reach and for body armour. Mars' long valley sightlines and thin, cold air reward the same heavy, high-BC 6 mm-class bullet, so the 6.5×40 serves both: on Earth it shoots flatter than any 5.56-class round and on Mars flatter still (§2.4). Aboard ships, where a rifle's recoil spins a floating marine and its ball rounds hole bulkheads, the Corps adds the light 4.8×30 PDW. Earth stayed with a fast, light 5.8 mm. The Belt fires the oldest round still made in every foundry.

### 2.3 Loads

A load is a variant of a calibre: its own bullet and behaviour. `pen0` is penetration at the muzzle in mm of rolled homogeneous armour equivalent (RHAe); it falls with `(v / v0)^penExp` (§8.2). `woundK` multiplies the wound factor (§8.1).

| Load | Calibres | Changes from ball | pen0 (mm RHAe) | penExp | woundK | Use |
|---|---|---|---|---|---|---|
| `ball` | all | | 9×21 2.0; 4.8×30 4.4; 6.5×40 7.0; 7.6×56 9.0; 9×19 1.8; 5.8×42 6.5; 7.62×39 5.5 | 2 | 1.0 | the ground standard |
| `ap` (tungsten carbide core) | 6.5×40, 7.6×56, 5.8×42, 7.62×39, 9×21 | 6.5: 7.1 g at 815 m/s, BC 0.25; 7.6: 10.0 g at 850 m/s | 6.5 13.0; 7.6 16.0; 5.8 11.0; 7.62×39 8.0; 9×21 4.0 | 1.5 | 0.9 | by order only; armoured targets |
| `frangible` (sintered copper-tin) | 9×21, 4.8×30, 6.5×40, 7.6×56, 9×19 | 6.5: 6.0 g at 790 m/s (460 mm), BC 0.15; 9×21: 5.6 g at 430; 4.8: 2.0 g at 800 | 9×21 0.6; 4.8 1.2; 6.5 1.5; 7.6 2.0; 9×19 0.6 | 2 | 1.1 | **the shipboard standard**: it breaks up on anything hard (§8.5) |
| `tracer` | 6.5×40, 7.6×56, 5.8×42 | 7.5 g, trace to 900 m in air; burns in vacuum (its compound carries its own oxidiser) | ball − 0.5 | 2 | 1.0 | belts 4:1; the last 3 rounds of a magazine as a warning (§3.3) |
| `marking` (training) | 9×21, 6.5×40 via a conversion bolt | 0.3 g paint capsule at 120 m/s | 0 | | 0 (a welt: BODY's bruise) | force-on-force in the training village |
| `blank` | 9×21, 6.5×40, 7.6×56 | no bullet; needs the blank-firing adaptor to cycle | | | | exercises; the muzzle blast hurts within 1 m (BODY: burn, 2 points) |
| `dummy` | all | inert, orange polymer | | | | drills; the coach's snap round (§11.3) |
| `buck` 00, `slug`, `breaching`, `beanbag` | 12-bore | breaching: 42 g of compressed metal powder at 380 m/s that turns to dust; beanbag: 40 g at 85 m/s, 145 J | buck 0.9 per pellet; slug 3.0; breaching 1.0; beanbag 0 | 2 | buck by cluster (§8.1); slug 1.0; beanbag less-lethal | B-12 work |
| `subsonic` (1.0 plan) | 6.5×40, 9×21 | 6.5: 9.5 g at 300 m/s | 2.5 | 2 | 0.95 | suppressed recon weapons |

A magazine holds one load, with two exceptions: `tracerEvery` (the L-20's belts, 1 in 5) and `tracerLast` (the last 3 rounds of a rifle magazine, which some marines load by habit so the tracer tells them they are nearly empty; a PEOPLE quirk can set it).

**As built in v0.0.6** (`src/sim/arms/calibres.js` `LIVE_LOADS`, `loadWord`; the build sheet 0.0.6 §9 item 35; the user, 2026-11-07: "we may have different types of rounds in inventory"). **Each live load has a word and a tip**: ball, its bare copper; tracer, a red tip (my call: the Corps' colour; real armies paint red, orange or green), its trace burning from `traceFromM` 30 m (the igniter's delay: it lights a few tens of metres out) to `tracerM` 900 m, so on the 25 m line by day the stage draws only its dim ember (VIEWS §3.6). `LIVE_LOADS` lists the kinds a magazine may be filled with, the blank and the dummy left out. **One kind to a magazine** this round (`tracerEvery` and `tracerLast` wait for the belts and the quirks). A round carries its kind into the chamber (`gun.load`), out of the muzzle (the shot's `load`) and out of the port; a tracer fired is no fault on the range.

### 2.4 Ballistic tables

**6.5×40 mm ball from the R-7 (460 mm), zeroed at 300 m in each environment, with the drift a 5 m/s full-value crosswind gives** [computed]:

| Range | Mars valley: v, energy, flight time, path, 5 m/s drift | Earth reference | MCRN ship under 1 g (66 kPa) | Europa (vacuum) |
|---|---|---|---|---|
| 100 m | 744 m/s, 2,159 J, 0.13 s, +3 cm, 2 cm | 726, 2,055, 0.13, +16, 3 | 748, 2,180, 0.13, +14, 2 | 790, 2,434, 0.13, −2, 0 |
| 200 m | 700, 1,909, 0.27, +5, 8 | 665, 1,723, 0.28, +19, 11 | 707, 1,948, 0.27, +17, 7 | 790, 2,434, 0.25, 0, 0 |
| 300 m | 657, 1,682, 0.42, 0, 18 | 607, 1,436, 0.43, 0, 27 | 667, 1,735, 0.41, 0, 17 | 790, 2,434, 0.38, 0, 0 |
| 400 m | 615, 1,477, 0.57, −14, 34 | 552, 1,186, 0.61, −46, 50 | 629, 1,541, 0.57, −39, 31 | 790, 2,434, 0.51, −2, 0 |
| 500 m | 576, 1,292, 0.74, −37, 54 | 499, 970, 0.80, −124, 82 | 592, 1,365, 0.73, −103, 49 | 790, 2,434, 0.63, −6, 0 |
| 600 m | 537, 1,126, 0.92, −72, 81 | 448, 783, 1.01, −241, 125 | 556, 1,204, 0.91, −194, 73 | 790, 2,434, 0.76, −12, 0 |

A UN hull's Earth-standard air (`earth-ship`, 101.3 kPa at 21 °C) flies within 1% of the Earth column [computed].

**The other loads on Mars' valley floor**, at 100 / 300 / 600 m (velocity, energy) [computed]:

| Load | 100 m | 300 m | 600 m | Notes |
|---|---|---|---|---|
| 9×21 ball, P-12 | 304 m/s, 346 J | 251, 236 | 195, 143 | pistol; drops 1.3 m at 300 m from a 25 m zero |
| 4.8×30 ball, V-5 | 612, 487 | 401, 209 | 260, 88 | goes subsonic at 390 m; a short-range round |
| 6.5×40 ball, C-7 (300 mm) | 691, 1,862 | 607, 1,438 | 493, 947 | the carbine gives up 60 m/s |
| 6.5×40 frangible | 720, 1,556 | 591, 1,049 | 422, 535 | light and draggy; indoor ranges only matter |
| 6.5×40 AP | 772, 2,116 | 690, 1,689 | 576, 1,178 | |
| 7.6×56 ball, S-9 | 780, 3,313 | 684, 2,549 | 554, 1,670 | |
| 12-bore buck pellet | 247, 107 | 144, 36 | | one pellet; nine leave the muzzle |
| 12-bore slug | 311, 1,357 | 241, 815 | | |
| 5.8×42 ball, FA-9 | 861, 1,539 | 731, 1,108 | 557, 644 | flat and fast, light at range |
| 7.62×39 ball, TMW-6 | 644, 1,641 | 516, 1,050 | 348, 478 | |

**Wind drift per 1 m/s of full-value crosswind** (cm; linear in wind speed) [computed]:

| Load | Air | 100 m | 200 m | 300 m | 400 m | 500 m | 600 m |
|---|---|---|---|---|---|---|---|
| 6.5×40 ball | Mars valley | 0.4 | 1.6 | 3.7 | 6.8 | 10.9 | 16.2 |
| 6.5×40 ball | Earth | 0.5 | 2.3 | 5.4 | 10.0 | 16.4 | 24.9 |
| 7.6×56 ball | Mars valley | 0.4 | 1.6 | 3.7 | 6.8 | 10.9 | 16.3 |
| 4.8×30 ball | Mars valley | 1.3 | 5.7 | 14.4 | 29.0 | 49.3 | 72.6 |
| 9×21 ball | Mars valley | 3.8 | 12.9 | 25.5 | 41.4 | 61.0 | 84.5 |

Mars' thinner air cuts drift by about a third against Earth's, but Mars blows: the valley's afternoon wind runs 3 to 8 m/s and a dust storm 15 to 25 (PLACES's weather), so at 500 m the wind moves the round 30 to 90 cm. On Mars the wind, not the drop, is the long-range problem.

### 2.5 Zeroes, gravity and the battle-sight zero

A zero is the angle between sight and bore that makes the round cross the line of sight at a chosen range, **in the environment where it was set**. It is computed once, when the zero is set, by one lookup in the bore-line tables (§2.1): `tan(θ) = (h + g_z × D_z(rangeM)) / rangeM`, with the zeroing range's gravity `g_z` and its air's `D_z`. The gun keeps the angle and where it came from: `zero = { rangeM, gMs2, rhoKgM3, soundMs, v0Ms, angleMrad, atMs }`. The path in any other environment is §2.1's `path(d)` with the same θ and that environment's g and D, so no table is ever built for a zero.

- **The Corps' battle-sight zero** on Mars is 400 m (my call). With the R-7 it keeps the round within +12 / −20 cm of the line of sight from 50 to 500 m, so a torso hold works without holdover to about 500 m [computed]. The maximum point-blank range (path within ±15 cm) on the valley floor is 495 m with a 425 m zero, against 310 m on Earth [computed].
- **The mechanical offset**: the optic sits 6.5 cm over the bore, so at 5 m the round strikes 6 cm low. At CQB distances that matters for a head shot, and the holdover modifier (§7.4) catches it.

**The R-7, zeroed at 400 m on Mars, fired elsewhere** (path in cm against the line of sight) [computed]:

| Fired in | 5 m | 25 m | 50 m | 100 m | 200 m | 300 m | 400 m | 500 m | 600 m |
|---|---|---|---|---|---|---|---|---|---|
| Mars valley (its zero) | −6 | −3 | +1 | +6 | +12 | +10 | 0 | −20 | −52 |
| Mars datum (52 kPa) | −6 | −3 | +1 | +6 | +12 | +11 | +2 | −17 | −45 |
| Europa surface | −6 | −3 | +1 | +8 | +21 | **+31** | **+40** | +46 | +50 |
| An MCRN ship under 1 g (66 kPa) | −6 | −3 | −1 | +1 | −9 | −38 | −90 | −167 | −271 |
| A UN ship under 1 g (101.3 kPa) | −6 | −3 | −1 | +1 | −10 | −43 | −103 | −195 | −326 |
| Free fall (vacuum) | −6 | −3 | +1 | +9 | +25 | +41 | +57 | +72 | +88 |
| Europa, re-zeroed at 400 m there | −6 | −5 | −4 | −2 | +1 | +2 | 0 | −4 | −9 |

What follows (my calls, from these numbers):
- Inside a ship (fights under 50 m) the Mars zero is good enough at any thrust: the error is a few centimetres.
- On Europa's surface the Mars zero shoots a torso's half-height high at 300 to 400 m. A HUD-linked ballistic dot corrects it (§3.5). Without one the marine must hold under, which is a Marksmanship skill (§7.4). **Re-zeroing on arrival** at Callisto's range (0.126 g, near Europa's) is a 20-minute activity (§11.4) and the battalion does it before Europa.
- In free fall the round never drops. At EVA distances (up to 300 m) a Mars zero shoots up to 41 cm high.

**As built in v0.0.7: the zero is a turret setting** (`ballistics.js`, `firearms.js`; the build sheet 0.0.7 §8 item 7, my calls). The battle-sight zero stays 400 m on the valley floor (`BZO`). The SO-4's turrets dial in clicks of `CLICK_MRAD` 0.1 mrad (`gun.sight = { elev, wind }`, + up and + right). **Every rifle has its own error**: `drawZero(seed, gunId)` draws it at issue, N(0, 10) clicks on each axis, and it is the gun's truth (`gun.zero`), never shown. The holder believes the zero the card has written down (`belief.zero`, absent until zeroed: the card's 0, 0); `believeZero` moves the belief when a group is read or a call dialled. **The dope card** (`DOPE_CARD`, the R-7's ball from the BZO on the valley floor, computed by `dopeOf`): 200 m 6 down, 300 m 3 down, 500 m 4 up. **The 25 m zeroing card** prints the BZO's mark `ZERO25_MARK_CM` −2.7 cm under the aim box (the path at 25 m), so a zeroed rifle groups on the mark, not the box. Its rings are 1 cm (§11.4). The confirm at 300 m is fired at the dope card's 3 down.

### 2.6 How far it goes

The "know your target and what is beyond it" rule has hard-SF numbers (maximum range at the best elevation over flat ground, no terrain) [computed]:

| Load | Earth | Mars valley | Europa (curved surface, vacuum) |
|---|---|---|---|
| 6.5×40 ball | 4.3 km at 33°, 30 s aloft | 7.0 km at 31°, 61 s | **563 km** at 40°, 17 minutes aloft |
| 7.6×56 ball | 4.1 km | 6.7 km | 634 km |
| 4.8×30 ball | 2.0 km | 3.1 km | 475 km |
| 9×21 ball | 1.6 km | 2.6 km | 120 km |

- Base Melas's known-distance range needs a surface danger zone 7 km deep (PLACES places it against the chasma wall).
- On Europa the horizon is 2.3 km away for a standing marine (`√(2 R h)` with R 1,561 km, h 1.7 m). **A level miss** from the shoulder lands about 1.4 to 1.5 km out: the round drops `g d² / 2v²` while the surface curves away by `d² / 2R`, so it meets the ice where `d² / 2 × (g/v² − 1/R)` equals the muzzle's height (1.43 km in 1.8 s from 1.5 m, 1.52 km from 1.7 m) [computed]. A round fired upward clears the horizon and comes down hundreds of kilometres off (the table's 563 km at 40°). Europa's escape velocity is 2,026 m/s and orbital speed 1,432 m/s, so no small arm orbits Europa, but every one of them can reach another town's surface works.
- **Phobos** (escape about 11 m/s) and **Ceres** (516 m/s) cannot hold a rifle bullet: on Phobos every shot leaves the moon, on Ceres every rifle shot does. In free fall a round never stops. Ranges in vacuum are therefore set by what is downrange, never by the round, and the Corps' EVA rule is "fire only with a backstop or open sky" (COMBAT's ROE).

### 2.7 Supersonic range and the crack

A supersonic round cracks as it passes. COMBAT's suppression reads the crack (my interface): a round passing within `CRACK_M` 3 m of a person in air while supersonic is a **near miss with a crack**; subsonic, or in vacuum, it is a near miss only if its impact is seen. In vacuum nobody hears a round go by, which makes suppression in vacuum a matter of what you see hit.

| Load | Supersonic to: Earth and UN hulls | Mars valley | MCRN ship air (66 kPa) |
|---|---|---|---|
| 6.5×40 ball, R-7 | 840 m | 1,250 m | 1,290 m |
| 6.5×40 ball, C-7 | 760 | 1,130 | 1,160 |
| 7.6×56 ball | 840 | 1,240 | 1,290 |
| 5.8×42 ball | 750 | 1,100 | 1,150 |
| 7.62×39 ball | 440 | 660 | 680 |
| 4.8×30 ball | 270 | 390 | 410 |

[computed] Sound is slower in Mars' cold air (322 m/s) and drag is lower, so rounds stay supersonic half as far again; an MCRN deck's 66 kPa air is thinner still, though warmer. Inside a hull every round a marine fires is supersonic for the length of any compartment, so every miss cracks.

**As built in v0.0.7** (`ballistics.js` `supersonicToM`, the `ballistics` test): the R-7's ball stays supersonic to **1,295 m** on the valley floor, against the table's 1,250 (within the build sheet's 5%; the built model's figure stands). On the valley floor at 300 m it flies at 657 m/s, arrives in 0.42 s and drifts 3.7 cm per m/s of crosswind.

### 2.8 Cases and brass in every gravity

Ammunition is cased (my call): caseless and telescoped rounds exist in the world's labs but the Corps rejected them for cook-off in vacuum, where a hot chamber cannot cool (§9.5).

**Ejection** (my calls, from the usual figures for gas-operated rifles): the case leaves the port at 4 m/s (pistols 3 m/s), 90° right of the bore ±20°, 30° forward, at about 200 °C. Case masses: 9×21 4.0 g, 4.8×30 2.8 g, 6.5×40 6.8 g, 7.6×56 12 g.

| Gravity | Where a rifle case lands (from 1.4 m) | Then |
|---|---|---|
| Earth or a ship at 1 g | 2.1 m right, 0.53 s | stops within 0.3 m |
| Mars | 3.5 m right, 0.87 s | bounces and rolls 0.5 to 1 m on hard floor, stops in regolith |
| Europa, Callisto | 5.8 m right, 1.46 s | rolls 1 to 2 m on ice |
| Free fall | never lands | flies at 4 m/s until a surface; restitution 0.5 each bounce; then drifts with the ventilation (0.15 m/s toward the nearest return grille) and is caught there in 1 to 3 minutes |

- **Hazards in free fall**: a hot case floating within 0.3 m of bare skin burns 1 time in 50 (BODY: a 1-point burn, "the brass dance"). A case drawn into an exposed fan or pump intake (PLACES's fixtures flagged `intake`) faults it 1 time in 100. Cases ring off bulkheads and drift through the picture until caught.
- **Brass catchers**: a mesh bag over the ejection port (R-7, C-7, S-9, L-20; 60 cases, 0.1 kg; fitting it is a 6 s step at DC 5). It adds `CATCHER_JAM` 0.001 to the stoppage chance (cases can bounce back into the action: about one stoppage in a thousand rounds, against a clean gun's one in 1,700, §4.3). The V-5 ejects downward into an integral bag of 60 with no jam penalty. **Shipboard rule** (my call, for COMBAT's ROE): catchers on in free fall and on any deck with exposed intakes.
- **In the sim** (performance, TECH): an area keeps at most `BRASS_LIVE` 64 moving cases as particles; a case at rest becomes a count on its 1 m tile (`brass[tile]`), drawn by VIEWS as scattered cases. Cases persist until policed: nothing pops out of view.
- **Past the cap in free fall** (my call, after the review: in free fall cases never come to rest, so a magazine and a half on automatic would overflow the particles): when a 65th case is ejected, the **oldest** particle is demoted to a **drift record** in closed form, `{ from, toGrille, startMs, arriveMs, v: 0.15 }`: a straight line from where it is to its zone's nearest return grille at the ventilation's 0.15 m/s, with `arriveMs = startMs + distance / 0.15`. VIEWS keeps drawing it as a glint moving along that line, and at `arriveMs` it joins the grille's trap count (`brassTrap[grille]`). A drift record costs nothing a tick (its position is a function of time), so the cap holds the sim's cost while every case stays visible until it is caught. Records are checked against moving people through the area's spatial hash at 4 Hz; a record that meets a body glances off it as a particle again (and the oldest particle takes its place in closed form), so no case passes through anyone.
- **Policing brass** is the range's closing chore (§11.3). In free fall the brass trap at each grille is emptied by a working party.
- **As built in v0.0.5** (`src/sim/arms/look.js` `ejectCase`, `caseAt`; the build sheet 0.0.5 §8 item 20, my call): the case flies **horizontally** at `EJECT_MS` 4.0 m/s (±0.3 by hash), **60° off the bore to the right** (±20° by hash), from a port 0.30 m ahead of the shooter and 0.12 m to the right, at `PORT_H_M` 1.4 m standing, 0.95 kneeling and 0.25 prone, falling at 3.727 m/s²: 0.867 s and 3.2 to 3.7 m out standing, 0.366 s and 1.4 to 1.6 m prone, so the table's 3.5 m in 0.87 s holds without the 30° forward above. It rests where it lands in regolith (no bounce or roll yet), and the range session keeps the newest `BRASS_LIVE` 64. **A shot that does not cycle keeps its case in the gun** until the step that clears it throws it (the tap-rack, REMEDIAL ACTION's rack), so it is drawn once (the integrator's). The orange dummy, a round stripped from a double feed and a round thrown out by a charge fly the same way at `HAND_EJECT_K` 0.5 of the speed; a step's throws ride in its `step` fact's `brass` (CONTRACTS §11).
- **As built in v0.0.7, brass on the KD** (`src/sim/arms/brass.js`; the build sheet 0.0.7 §8 item 19): on the KD course a case at rest leaves the live list for a count on its **1 m tile** (`R.brassTiles`, `{ '<ix>,<iz>': { n, mine } }`), so every case the relay fires stays drawn and counted however many are fired; test-handling's list is kept as v0.0.6 kept it. A live round or the coach's dummy thrown from the port is not brass: it lies where it fell to be picked up. **Policing is the player's own action** (`kd:police`, by T or its panel row, §10.4): it picks up their cases within `POLICE_M` 4 m (a tile counts when its nearest point is within reach), `POLICE_CASE_S` 1.2 s a case, and the live rounds lying there go back in the pocket for the turn-in. A gunner polices its own and never the player's.

**As built in v0.0.11**: a case falls at the place's gravity read at `CASE_G_STEP_MS2` 1 mm/s² (`caseGMs2`); Mars's 3.726527 m/s² reads 3.727, the case's value since v0.0.5. `ejectCase` and `caseAt` take `gMs2` (required), and `rangeLook` returns `gMs2` for the stage's dust, sparks and plate. Under `CASE_FLOAT_MS2` 0.490 m/s² (0.05 G at the case's 1 mm/s²) a case flies `CASE_FREE_M` 2 m and is held at its port's height (`restY`, written only then); the bounce and the 0.15 m/s drift to the grille are step 7's. At 1 G a case lands in 0.534 s standing and 0.226 s prone (Mars 0.867 and 0.366). Open: the zero-g guards for `ejectCase`, `tFallMs` and the dust.

### 2.9 Spin habitats

Ring stations (Hygiea Ring, Ceres Station's spun districts), the Ring at Melas and Callisto's Spin give a felt gravity of ω²r (PLACES §3.11's `spin` regime), but a round or a grenade in flight feels none of it: it flies straight in inertial space while the floor turns under it and curves up ahead of it. COMBAT's "real trajectories in the area's gravity" would treat spin as gravity and get it wrong, so `flight()` and the throw (§12.2) take an `env.spin = { omegaRadS, radiusM, axis }` and do this instead (my call, after the review):

```
inertial start  p0 = muzzle (or the hand at release), v0 = the round's velocity relative to the floor + ω × p0
inertial path   p(t) = p0 + v0 t (+ any real gravity, e.g. Mars's 0.38 G down the Ring's axis, as ½ g t²)
area frame      p_area(t) = rotate(p(t), −ω t) about the axis
```

The round's speed along its path comes from the bore-line table (§2.1) in the zone's air, applied along the straight line; the co-rotating air's sideways push on a rifle round inside any ring is under a millimetre and is left out. Grenades ignore the air as they do everywhere (§12.2). The path is traced against the area's geometry in the area frame, so the floor's upward curve stops a long level shot (a straight line from 1.5 m meets a floor of radius R at `√(2 R h)`: 37 m on Hygiea's rim) and the longest eye-to-torso sight line along the rim is `√(2 R × 1.5) + √(2 R × 1.0)` (67 m on Hygiea, 31 m in a 100 m ring). What the shooter sees is Coriolis: a round sent along the spin strikes low and one sent against it high, by about `ω d² / v`; a round sent along the axis feels only the felt gravity.

**[computed]** The R-7's ball (790 m/s) aimed at a standing man's chest along the floor, from the shoulder, and a 15 m grenade thrown low by the felt-gravity solution (the arc the thrower's body expects), in two rings at a felt 0.3 G:

| | Hygiea Ring (R 448 m, ω 0.081 rad/s, rim 36 m/s) | A 100 m ring (ω 0.172 rad/s, rim 17 m/s) |
|---|---|---|
| R-7 at 25 m: along the spin / against / along the axis | 6.5 cm low / 6.2 cm high / 0.1 cm low | 13 cm low / 13 cm high / 0.1 cm low |
| R-7 at 50 m: along / against / axis | **26 cm low / 25 cm high** / 0.6 cm low (felt gravity alone: 0.6 cm low) | beyond the sight line (31 m) |
| a 15 m throw at 15 m/s, expected 1.0 s in the air: along the spin | lands at 10.6 m after 0.71 s | lands at 8.0 m after 0.54 s |
| against the spin | lands at 25.7 m after 1.7 s | **lands at 127 m after 8.3 s**: thrown at nearly the rim's speed against it, the grenade almost stands still in space while the floor turns under it |
| along the axis | lands at 15.0 m after 1.0 s | lands at 15.2 m after 1.0 s |

What follows (my calls):
- **The shot**: Coriolis is a systematic offset like the wind's, so it enters the roll through §7.4's `biasMod` as a **spin bias**, `ω d² / v` against the part's radius, corrected by the shooter's read as holdover is (`holdCorr`, and fully by the HUD link's ballistic dot, whose accelerometers and the suit's map know the spin). A marine new to spin habitats (under 20 hours in rotating frames: SKILLS' local experience) reads none of it. Uncorrected, at 25 m on Hygiea it costs a torso shot −2; at 50 m −5, and a head shot −10.
- **The throw**: the step panel (§12.2) solves the real path and shows its landing point and flight time; the roll is against §12.2's DC with the unfamiliar-gravity +3 for a thrower new to spin. Thrown against the spin in a small ring a grenade hangs in the air for seconds, and the fuse (4.0 to 4.8 s) may beat it to the floor: the panel says so.
- **The Ring at Melas** never sees live fire (weapons drill only, dummies: CAREER's G-qualification work); its 45 m radius limits a sight line to about 21 m and its ω of 0.449 rad/s would put a 20 m shot along the spin about a quarter of a metre low.

**As built in v0.0.12** (`src/sim/places/spin.js`, `src/sim/arms/shot.js`): the spin's bias **moves the hole, not the odds**. A frangible round's whole offset is 0.15, 0.43, 0.84 and 1.71 cm at 3, 5, 7 and 10 m (omega d2 / v at 790 m/s): 0.925 of it low fired prograde (high retrograde; 0.14, 0.39, 0.77 and 1.58 cm), none along it fired across the spin, and 0.38 of it sideways to the shooter's right on every bearing (0.65 cm at 10 m), within 0.03 cm of an inertial integration; it moves a turner's hole as the wind does (the fixer's pass: it first moved only paper's holes), never his zone. The hot wash says it once: "The Wheel drops a round low along the spin. Not enough to miss by, in a room." (my call).

### 2.10 Data shapes

```json
"calibres": {
  "6.5x40r": {
    "word": "6.5×40 mm Republic", "diaMm": 6.7, "caseMm": 40, "caseG": 6.8, "propG": 1.95,
    "maker": "had", "boxN": 20, "boxCm": 11, "boxL": 0.16, "bandolierN": 70,
    "loads": {
      "ball":      { "massG": 7.8, "vRefMs": 790, "refBarrelMm": 460, "vExp": 0.18, "bcG7": 0.23,
                     "pen0Mm": 7.0, "penExp": 2, "woundK": 1.0, "priceMcr": 0.30 },
      "ap":        { "massG": 7.1, "vRefMs": 815, "refBarrelMm": 460, "vExp": 0.18, "bcG7": 0.25,
                     "pen0Mm": 13.0, "penExp": 1.5, "woundK": 0.9, "priceMcr": 1.20, "byOrder": true },
      "frangible": { "massG": 6.0, "vRefMs": 790, "refBarrelMm": 460, "vExp": 0.18, "bcG7": 0.15,
                     "pen0Mm": 1.5, "penExp": 2, "woundK": 1.1, "frangible": true, "priceMcr": 0.45 },
      "tracer":    { "massG": 7.5, "vRefMs": 790, "refBarrelMm": 460, "vExp": 0.18, "bcG7": 0.22,
                     "pen0Mm": 6.5, "penExp": 2, "woundK": 1.0, "tracerM": 900, "ignites": true, "priceMcr": 0.40 },
      "blank":     { "blank": true }, "dummy": { "dummy": true }
    }
  }
}
```

Prices are in MCR (my call, on LONGHAUL's scale: a hand's month is 150 to 560 MCR): a 6.5×40 ball round 0.30, AP 1.20, frangible 0.45; 9×21 ball 0.15; a 40 mm HEDP grenade 18; a G-9 grenade 25. CAREER uses them only when the Corps bills a marine (§10.6).

---

## 3. The arsenal

### 3.1 Makers

SETTING owns factions' faces; these are the makers as the armoury and the gun's stamp know them (my call, each).

| Maker | Power | What they are | Their guns feel like |
|---|---|---|---|
| **Hecate Arms & Drive (HAD)** | MCR | LONGHAUL's `mcr-corp` sub-faction: "Mars's drive-maker and arms yard. A war is a contract; a cold war is a longer one." Its small-arms works are at Ophir Chasma, next door to Melas. It builds nearly everything the Corps carries | precise, modular, expensive; a serial and a data port on every receiver; glove-friendly controls on the shipboard line |
| **Tharsis Arsenal** | MCR | the Republic's old state arsenal, absorbed by HAD two generations ago; its designs live on in reserves, colour guards and old garrisons | heavy, steel, over-built, reliable |
| **Tessier-Ndlovu** | UN | Earth's standard arms combine (Lyon and Lagos); arms the UN Marines and UNN boarding parties | light bullpups, fast cartridges, burst fire |
| **LKC Defence** | UN | the arms division of Luna-Kepler Consolidated (LONGHAUL's `un-corp`); sells corporate security across the system, Europa's towns included | compact, frangible-loaded, polite |
| **Tycho Machine Works (TMW)** | OPA | Belt machinists under the Tycho Council; their "Six" is copied in every Belt foundry | rugged, loose-fitted, tolerant of dirt and neglect |
| **Pallas Foundry** and the **Ceres shops** | OPA, independents | small Belt foundries and machine shops; stamped guns and pipe guns for cells and miners | crude, cheap, unreliable |

### 3.2 The first seventeen

**Kinds** set the shot's base DC (§7.2), how the gun is aimed and carried, and how far it may be aimed (the target must also be seen and shown, in the frame or VIEWS's far window).

| Kind | Base DC | Sight × | Turn × | Hands | Aim to | Notes |
|---|---|---|---|---|---|---|
| `pistol` | 10 | 1.00 | 1.00 | 1 | 100 m | position bonuses halved |
| `smg`, `pdw` | 6 | 1.05 | 0.95 | 2 | 200 m (smg), 250 m (pdw) | |
| `carbine` | 1 | 1.15 | 0.85 | 2 | 600 m | |
| `rifle` | 0 | 1.20 | 0.80 | 2 | 800 m | |
| `dmr` | −1 | 1.35 | 0.70 | 2 | 1,200 m | |
| `lmg` | 1 | 1.40 | 0.60 | 2 | 1,000 m | standing −2 (my call: 8 kg and a belt) |
| `shotgun` | 6 | 1.10 | 0.85 | 2 | 60 m buck, 150 m slug | buck: −3 DC within 12 m (tradecraft's pattern bonus) |
| `gl` | 4 | 1.30 | 0.80 | 2 | 400 m direct, 900 m indirect on Mars | arms at 15 m |

Sight and turn factors are tradecraft's `KINDS` (lmg and gl are new).

**The seventeen** (my call, every number). Mass is loaded with its usual magazine; recoil, loudness and reliability are multipliers as in tradecraft's `MODELS`; `accDC` adds to the shot's DC.

| # | Model | Maker | Kind | Calibre, barrel | Feed | Action | Safety ring | Hold-open | Mass, length | Cyclic | Optic as issued | Recoil | Loud | accDC | Unreliable | First seen |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **P-12** service pistol | HAD | pistol | 9×21, 110 mm | HAD-17 (17) | striker | manual safety (frame, ambidextrous, oversized) | yes | 0.96 kg, 19.5 cm | | RD-1P red dot | 1.0 | 1.0 | 0 | 1.0 | 0.1 |
| 2 | **P-10** compact pistol | HAD | pistol | 9×21, 95 mm | HAD-12 (12) | DA/SA hammer, decocker | none (decocker) | yes | 0.78 kg, 17.5 cm | | irons | 1.05 | 1.0 | +1 | 1.0 | 0.2 |
| 3 | **R-7** service rifle | HAD | rifle | 6.5×40, 460 mm | HAD-30 / HAD-30C (30) | gas piston, rotating bolt | safe, semi, auto | yes | 4.3 kg, 92 cm (85 collapsed) | 700 | SO-4 (1 to 4×) | 0.70 | 1.4 | 0 | 1.0 | 0.1 |
| 4 | **C-7** carbine | HAD | carbine | 6.5×40, 300 mm | HAD-30 | as R-7 | safe, semi, auto | yes | 3.7 kg, 76 cm (68) | 800 | SO-4 | 0.75 | 1.6 | 0 | 1.1 | 0.1 (seen), 0.2 (carried) |
| 5 | **R-7M** squad marksman rifle | HAD | rifle | 6.5×40, 510 mm heavy, free-floated | HAD-30 | as R-7, match trigger | safe, semi | yes | 5.4 kg, 101 cm | | SO-12 (3 to 12×, rangefinder) and bipod | 0.65 | 1.4 | −1 | 1.0 | 0.1 |
| 6 | **L-20** light machine gun | HAD | lmg | 6.5×40, 420 mm quick-change | belt 100 or 200; HAD-30 in the emergency port (stoppages ×2) | open bolt | safe, auto | n/a | 8.2 kg + belt, 104 cm | 750 | SO-4 and bipod | 0.50 | 1.5 | 0 | 1.2 | 0.1 |
| 7 | **S-9** designated marksman rifle | HAD | dmr | 7.6×56, 560 mm | HAD-20D (20) | gas piston | safe, semi | yes | 6.8 kg, 112 cm | | SO-20 (5 to 20×, rangefinder, ballistic computer) and bipod | 0.85 | 1.6 (0.5 with the SP-9 suppressor) | 0 | 0.9 | 0.3 |
| 8 | **B-12** breaching shotgun | HAD | shotgun | 12-bore, 360 mm, standoff muzzle | tube 5 + 1 | pump | crossbolt manual | n/a | 3.4 kg, 82 cm | | bead and ghost ring | 1.40 | 1.6 | 0 | 1.0 (a pump cannot jam cycling; a fumbled pump short-strokes) | 0.2 |
| 9 | **V-5** personal defence weapon | HAD | pdw | 4.8×30, 230 mm | HAD-40V (40) | closed bolt, gas | safe, semi, auto | yes | 2.6 kg, 64 cm (52 folded) | 900 | RD-1 red dot and IR laser | 0.45 | 1.2 | 0 | 0.9 | 0.2 |
| 10 | **G-40** grenade launcher | HAD | gl | 40×46, 305 mm | single, side-swing breech | single shot | manual safety | n/a | 1.4 kg under a rifle; 2.6 kg with its own stock | | quadrant sight marked for Mars, HUD solution | 1.5 | 1.0 | +2 | 1.0 | 0.1 (practice rounds), 0.3 |
| 11 | **M-2290** battle rifle ("the Twenty-Two Ninety") | Tharsis Arsenal | rifle | 7.6×56, 510 mm | Tharsis-20 (20, steel) | gas piston, tilting bolt | safe, semi, auto | no | 5.2 kg, 106 cm | 650 | irons, a 3× scope on some | 0.95 | 1.6 | 0 | 0.9 | 0.1 (the colour guard, drill) |
| 12 | **FA-9** rifle (bullpup) | Tessier-Ndlovu | rifle | 5.8×42, 465 mm | UN-30 (30) | short-stroke piston | safe, semi, burst 3 | yes | 3.9 kg, 74 cm | 750 | TN 3× | 0.60 | 1.4 | 0 | 1.1 | 0.3 |
| 13 | **PA-21** pistol | Tessier-Ndlovu | pistol | 9×19, 112 mm | TN-15 (15) | DA/SA hammer, decocker | none (decocker) | yes | 0.98 kg, 20 cm | | irons | 0.95 | 1.0 | 0 | 1.0 | 0.3 |
| 14 | **TMW-6** "the Six" | Tycho Machine Works | carbine | 7.62×39, 415 mm | T30 (30, steel) | long-stroke piston | safe, **auto, semi** (the old ring) | no | 3.9 kg, 88 cm | 650 | irons (a cheap red dot on some) | 0.85 | 1.5 | +1 | 0.8, and dust ×0.5 | 0.3 |
| 15 | **Pick** machine pistol | Pallas Foundry | smg | 9×19, 140 mm | stick (32) | open-bolt blowback | safe, auto | no | 2.6 kg, 60 cm (42) | 1,000 | irons | 0.90 | 1.1 | +2 | 1.6 | 0.3 |
| 16 | **pipe pistol** | a Ceres shop | pistol | 9×19, 90 mm | none: one round by hand | break-action single shot | none | n/a | 0.6 kg, 20 cm | | none | 1.30 | 1.0 | +4 | 4.0 (tradecraft's converted blank-firer) | 0.3 |
| 17 | **Kestrel** security PDW | LKC Defence | pdw | 9×19 (frangible as issued), 180 mm | LKC-30 (30) | delayed blowback | safe, semi, auto | yes | 2.9 kg, 62 cm (45) | 850 | red dot | 0.80 | 1.0 | 0 | 1.0 | 0.3 |

What each is for, in a line:
- **P-12**: officers, staff NCOs, MPs, the L-20 and S-9 gunners' sidearm. The Corps specified a manual safety on a striker pistol so the safety is a step (the brief's "managing safety").
  - **Designed 2026-11-11 (the user's note on v0.0.12: "We get a jam in the second room, we should be able to switch to side arm or something realistic like take cover")**, to build in the shoot house rework (COMBAT §25.19.6): **the P-12 is issued kit in close quarters from the Sergeant up** (Sergeant, Raider, tier one: the sheets that carry it in life; my call after the flashbang's precedent, question 2 of COMBAT §25.19.11 asks whether every sheet should). It rides a **thigh holster on the right** (`compose.js` already draws it; the draw 1.1 s base, DC 8, §5.2), with **one HAD-17 holding 10 frangible 9×21** (the house's ten-round rule, as for the rifle; frangible exists for 9×21, §2.3) and a spare in the holster's pouch; kit `house-cqb` gains it. The tower's macros cover both guns (§5.3's note); the transition is §5.2's row; the lane's 'dry' end counts the pistol's rounds. Below the Sergeant the panel shows Transition struck with the pistol's silhouette, "not issued" (VIEWS §7.8).
- **P-10**: Martian Security's issue and an officer's off-duty carry. No safety: it is carried hammer down, and the first pull is long (tradecraft's decocker rules).
- **R-7**: the rifleman's rifle, and the player's where the squad carries it (every squad's kit is one kit, §3.10). The issue optic's HUD link, the counter magazines and the chamber sensor make it the best-known gun in the game to its holder.
- **C-7**: crews, MPs, the ship's armoury, CQB. Louder, shorter, a little less reliable.
- **R-7M**: one per squad, the squad marksman's; a match trigger and a 12× optic.
- **L-20**: the automatic rifleman's. Open bolt (no cook-off), quick-change barrel, belts. Its heat is a fire-discipline problem in vacuum (§9.5).
- **S-9**: scout snipers and the weapons platoon's marksmen.
- **B-12**: the breacher's tool first (hinges and locks with breaching rounds), a riot gun second (beanbag).
- **V-5**: the shipboard and suited marine's gun: oversized controls (glove penalties halved, §5.1), a downward ejection bag, a tether ring, low recoil (a floating marine spins about a quarter as fast as with the R-7, §7.8).
- **G-40**: the team leader's under-barrel launcher.
- **M-2290**: the drill and colour-guard rifle at Base Melas, and the weapon of old garrisons and reserves.
- **FA-9, PA-21**: the UN Marines' and the UN observers' escorts'.
- **TMW-6**: the Belt's rifle; it tolerates dust and neglect better than anything HAD makes.
- **Pick, pipe pistol**: cell weapons; the pipe pistol is what a miner makes in a machine shop.
- **Kestrel**: Europa's corporate police.

**As built in v0.0.14** (the P-12, COMBAT §25.19.6; `src/sim/arms/sidearm.js`; my calls): 0.75 kg empty, irons (the RD-1P waits), a 900 rpm cycle floor. The **HAD-17** magazine is 80 g empty and 210 g full. The **9x21 frangible** is 5.6 g at 430 m/s, BC 0.06. It is issued in Condition 3 (the house's sergeant up). MAKE READY adds one `pistol:ready` part; UNLOAD and SHOW CLEAR add `pistol:clear`, the pistol last. The draw and the holster are unrolled; the other parts are rolled. There is no observer's look at the pistol. The P-12's weapon card still draws the R-7: a P-12 drawing is needed as a gun sample (VIEWS §4.4).

### 3.3 Magazines, belts and feeds

A magazine is a stateful object (tradecraft's `{ type: 'mag', fam, n }`) with its own condition, dust and load.

| Family | Takes | Rounds | Empty, full | Length, volume | Counter | Notes |
|---|---|---|---|---|---|---|
| HAD-17 | 9×21 | 17 | 80 g, 210 g | 12 cm, 0.06 L | no | P-12 |
| HAD-12 | 9×21 | 12 | 70 g, 160 g | 10 cm, 0.05 L | no | P-10 |
| HAD-30 | 6.5×40 | 30 | 120 g, 360 g | 21 cm, 0.27 L | no | polymer, witness window; the range's training magazines |
| HAD-30C | 6.5×40 | 30 | 135 g, 375 g | 21 cm, 0.27 L | yes (Hall sensor; reports to the HUD link) | deployed units' issue |
| HAD-30S | 6.5×40 | 30 | 230 g, 470 g | 21 cm, 0.27 L | yes | steel body and a cold-rated spring for Europa's surface (§9.6); 0.3 |
| HAD-20D | 7.6×56 | 20 | 140 g, 360 g | 20 cm, 0.30 L | yes | S-9 |
| HAD-40V | 4.8×30 | 40 | 90 g, 195 g | 24 cm, 0.22 L | yes | V-5 |
| Tharsis-20 | 7.6×56 | 20 | 250 g, 470 g | 21 cm, 0.30 L | no | steel |
| UN-30 | 5.8×42 | 30 | 110 g, 235 g | 19 cm, 0.25 L | no | |
| TN-15 | 9×19 | 15 | 85 g, 205 g | 12 cm, 0.06 L | no | |
| T30 | 7.62×39 | 30 | 330 g, 570 g | 24 cm, 0.33 L | no | steel, nearly indestructible: drop wear halved |
| stick-32, LKC-30 | 9×19 | 32, 30 | 150 g, 405 g; 100 g, 340 g | 25 cm; 20 cm | no | |
| belt | 6.5×40, disintegrating links | 100 (soft pouch) or 200 (box) | 1.6 kg, 3.4 kg | 1.2 L, 2.5 L | no | 1 tracer in 5 |
| tube | 12-bore | 5 + 1 | | | no | loaded a shell at a time; a 6-shell carrier on the stock, a 25-shell bandolier (1.4 kg) |

- **Loose rounds** come in 20-round cartons (6.5×40: 11 cm, 0.16 L), in 70-round bandoliers of 10-round stripper clips, and in 840-round cans at the ammunition point. Filling a rifle magazine by the clip and spoon takes 4 s a clip at value 10 (DC 5), against 2.2 s a round loose (tradecraft), so seven magazines take 84 s by clip and 7.7 minutes loose (§5.2).
- **Magazine condition** keeps tradecraft's numbers: fresh `MAG_FRESH` 0.95, a drop on hard ground −0.04 (`MAG_DROP_WEAR`), a worn spring feeding badly (`MAG_JAM` 0.3 × the shortfall under 0.9), a bent lip at 0.3. Mars dust gets in (`mag.dust`, §9.2).
- **Where they ride** (VIEWS draws the rig, BODY carries the mass): two magazines to a chest-rig pouch, a dump pouch for empties, a pistol magazine pouch on the belt. Reaching for one is part of the step's time; a magazine from a pack or a cargo pocket adds 2.5 s (my call). The issue rifleman's load is 7 magazines: 1 in the rifle, 6 in pouches, 210 rounds.
- **Worn kit classes** (the user's overrule of COMBAT §24 question 6, 2026-11-07: "standard issue combat gear will be combat EVA suits with serious targetting and filtering, night vision, I mean this is superpower level military, some marines will even be equipped with power armor (not common, special units) with extreme ballistic protection and servo/computer guided targetting with built-in automatic weapons"; my call for the shape):
  - **Utilities**: the base's and the range's kit; no filtering. `protOf` reads only worn utilities and ear defenders so far (v0.0.9), which is why the range scene (`setup=bangs`) stays the user's case.
  - **The combat EVA suit** is the Corps' and its peers' standard combat kit: a filtered visor (flash filtered, never blinded or dazzled), sound filtering at `EARPRO_K` ×0.6 (never deafened), night vision and targeting (a reticle link, §7.3's hard-suit row, with better optics), the gloves' penalty of §5.1 worn down. Not built: `protOf` reads the suit as a defender's flag in `combat-race` only; the player's suit, its link and its filtering as worn items wait for the Corps' worn kit (ROADMAP §5, my call: with the shoot house's issue). BODY §17.3 holds the filtering.
  - **Power armour** is a special-unit kit class (not common): extreme ballistic protection (§8's armour table gains a class above plate), servo- and computer-guided targeting (the aim assist as a modifier and a time, never a step removed: DESIGN.md pillar 3), and built-in automatic weapons (a mounted arm with its own state machine). **Not built**; ROADMAP §5 names it a later row (my call).
- **As built in v0.0.5** (`src/sim/arms/kit.js`; the build sheet 0.0.5 §8 item 27): the range's familiarisation issue (`KIT_TEMPLATES['range-fam']`) is the R-7 slung front, a plate carrier with two double magazine pouches and a dump pouch (holding 2, 2 and 4), ear defenders, and three HAD-30s of five, two in the first pouch and one in the second. The range detail filled them and said so, so their counts start known; a magazine never counted shows its baseplate on the weapon card and "?" in I. A magazine in from either pouch takes the same `magIn` time (I shows it as the pouch's reach: VIEWS §8.3).
- **As built in v0.0.6** (`kit.js` `pouchesOf`, `KIT_TEMPLATES['range-mixed']`; the build sheet 0.0.6 §9 items 31, 35 and 36; the user, 2026-11-07: "putting magazine in should be a "Reach for magazine" (or equivalent)"). **The places a hand reaches are named by key**: `p1` and `p2` ("chest pouch 1", "chest pouch 2", the chest's magazine pouches in reach order), `dump` ("the dump pouch") and `ground` (a magazine at your feet, within `FEET_M` 1.2 m). An action id carries its place after `@` (`reach@p1`, `stowMag@p2`). **A reach into a named pouch takes the magazine at its front**; one put back goes in behind it, so reaching again brings the next (the player chooses: the drills' rule would hand back a known ball for ever over a tracer not yet seen). **The issue's magazines are told their kind with their count** ("5 rounds, ball"), so their belief starts with both. **`range-mixed`** (setup `mixed`, §11.3): the three magazines of ball and a fourth of five tracer, second in chest pouch 2, the counts told and the kinds not (my call).

### 3.4 Safeties, selectors and decockers

Tradecraft's three kinds stay: `manual`, `none`, `selector`, plus decockers. A selector moves round its **ring in its real order** (tradecraft: "an AK's lever goes safe, auto, semi"):

| Gun | Ring | Notes |
|---|---|---|
| R-7, C-7, V-5 | safe → semi → auto | the R-7's lever cannot reach safe with the hammer down (a real AR-pattern trait): after a function check the lever stays on fire until the gun is charged to cock the hammer, which UNLOAD SHOW CLEAR does as its last sub-steps (§5.3) |
| R-7M, S-9 | safe → semi | |
| L-20, Pick | safe → auto | |
| FA-9 | safe → semi → burst 3 | |
| TMW-6, M-2290 (TMW copies) | safe → auto → semi | the Belt's order: a careless thumb goes to auto first |
| P-12 | safety on / off | |
| P-10, PA-21 | decocker | carried hammer down: the first pull is long (−1 and +0.15 s, tradecraft's `DA_MOD`, `DA_S`), and a fumbled discharge must be 5 worse (`DA_GUARD`) |
| B-12 | crossbolt on / off | |
| G-40 | lever on / off | |

### 3.5 Optics and the suit-HUD link

| Optic | Magnification | Sight picture × | What it adds | Battery | Mass |
|---|---|---|---|---|---|
| iron sights (back-up, every rifle) | 1× | 1.00 | nothing | none | |
| HAD RD-1 / RD-1P red dot | 1× | 0.85 | +1 at all ranges | 50,000 h | 60 g |
| HAD SO-4 | 1× to 4×, throw lever | 0.90 at 1×, 1.20 at 4× | the BDC reticle marked for the 6.5×40 on Mars at the Corps' zero; a link module | 600 h illuminated | 480 g |
| HAD SO-12 | 3× to 12× | 1.50 at 12× | laser rangefinder to 1,500 m; ballistic computer; link | 300 h | 820 g |
| HAD SO-20 | 5× to 20× | 1.80 at 20× | rangefinder to 2,500 m; ballistic computer with its own met sensor (pressure, temperature, local wind); link | 250 h | 1,100 g |
| HAD TC-2 thermal clip-on | in front of any of the above | +0.2 | sees heat: removes the light penalty; sees through smoke (not dust); a suited man stands out against Europa's 100 K ice | 8 h | 400 g |
| HAD IR-3 aiming laser and illuminator | | | with night vision (BODY and VIEWS: the helmet's NV): the light penalty becomes 0 within 50 m and the aim needs no sight picture (×0.7); visible to anyone else with NV | 40 h | 150 g |
| HAD WL-1 weapon light | | | lights the target (dark becomes dim within 30 m, dim becomes lit within 15 m); shows you to everyone | 3 h at 1,000 lm | 140 g |

**The optic modifier** (my call): `opticMod(mag, d)`.
- Iron sights 0; red dot +1.
- A magnified optic gives `round(1 + 2 × log2(mag))` (2× +3, 4× +5, 8× +7, 12× +8, 20× +10), capped by range: +1 within 25 m, +3 to 100 m, +6 to 300 m, +10 beyond.
- Too close for the magnification (`d < 4 m × mag`): `−round(log2(mag))` instead (4× at 10 m −2, 12× at 25 m −4). The marine dials down: changing magnification is a step (§5.2), so the optic is a decision at every distance.

**The suit-HUD link** (my call) joins the gun to a display the marine wears: a suit visor, or on Mars the Corps' field helmet's flip-down display (the HAD HV-2; VIEWS draws it, BODY's suit section owns the suit). It shows, and only shows, what the gun's sensors know:
- **The reticle in the visor**: the muzzle's line, so the marine can aim with the head near the stock but not on the optic. At 50 m and under the sight picture is ×0.9. Around a corner, the **corner shot** (the gun out, the head behind cover) fires at −4 with only the arms exposed (COMBAT sets the exposure).
- **Rounds**: exact from a counter magazine (HAD-30C, HAD-20D, HAD-40V); nothing from a plain one.
- **The chamber**: from the R-7 family's chamber sensor: live or empty, not a dud.
- **The selector and the optic's magnification.**
- **The ballistic dot**: with a rangefinder lased on the target, the computer puts the aim point where the round will go, from the load table, the zero, the gravity (the suit's own accelerometer) and the air (the suit's sensors). It knows only the wind where the shooter stands: it corrects 50% of a steady crosswind and none of a gust downrange (§7.4).
- **Barrel temperature** on the L-20 (a thermocouple).

The link fails with the battery, with damage to the optic or the helmet, and under jamming (COMBAT and SKILLS' Comms: a Europa cell can jam the band). Then the visor shows nothing of the gun, the belief (§4.2) is all the marine has, and the optic's own reticle is the aim. "We only know what we know."

**As built in v0.0.7: the SO-4's lever and turrets** (`firearms.js`; the build sheet 0.0.7 §8 items 7 and 8, my calls). The lever is a step, "Throw the lever", `OPTIC_S` 0.5 s, no roll: 1× by default (`gun.optic` absent, so test-handling is unchanged), 4× on the KD at the tower's "Optics to four power" (+5 within 300 m, the table above). The turrets dial in clicks of 0.1 mrad, `DIAL_S` 0.12 s a click at value 10 (× pace), no roll; reading the flags is a step of `READ_S` 1.5 s (× pace of Marksmanship). The turrets and the lever are seen and felt, so the belief returns them as they are (`beliefOf`'s `sight`, `optic`), with the believed `zero` and the `dope` it gives (§2.5); the true zero never.

**As built in v0.0.8: the lever sets the far window's magnification** (`src/render/far.js`; VIEWS §2.4; the user's report, 2026-11-07, "when at 300m, with the scope at 1x, the view still shows the target zoomed in"). As well as the aim's sight picture and the optic modifier, the lever sets the window's scale. At 4× the window is the scope's picture: 16 px/m, the reticle and the field. At 1× it is the naked eye's: 4 px/m, four times the ground, no reticle, the fog lifted only by the eye's reach. Throwing the lever (`OPTIC_S` 0.5 s) eases the window between the two over the same 0.5 s: the scale, the fog's lift and the reticle (in from 2×) together. The far window reads `OPTIC_S` through `sim/arms/look.js`, the one sim module render may import.

### 3.6 Accessories

| Accessory | Fits | What it does |
|---|---|---|
| two-point sling (issue) | all long guns | hands-free carry; a "dropped" long gun swings on its sling instead of falling (§5.5); slung front or back (§6.1) |
| single-point sling | C-7, V-5 | quicker to bring up (slung front to low ready 0.8 s instead of 1.0) but the gun swings into the knees when let go |
| bipod | R-7M, S-9, L-20 (built in); R-7 (clip-on, 280 g) | prone supported anywhere the ground is flat; halves burst climb (§7.6); deploying it is a 1.0 s step |
| brass catcher | R-7, C-7, S-9, L-20 | §2.8 |
| tether and lanyard | every gun (V-5 built in) | in free fall and on EVA a dropped gun stays on its tether (§5.5) |
| SP-9 / SP-7 suppressor | S-9, R-7, C-7 (0.3); recon carbines (1.0 plan) | loudness ×0.35 (×0.25 with subsonic rounds); +0.5 kg; the barrel heats ×1.3; a 4 s step to fit |
| muzzle cap and port cover | R-7 family | dust (§9.2); the port cover is closed by a 0.4 s thumb step and opens itself on the first shot; the muzzle cap is shot through harmlessly |
| blank-firing adaptor | R-7 family, M-2290 | blanks cycle the action; a live round fired with it on bulges the barrel and the gun is broken (`cond` 0.2) |
| WC-3 weapon cover | every long gun (0.3, Europa surface issue) | holds the gun above −20 °C on Europa's surface with its 5 W heater, slows the cold soak ×8 without it (§9.6); a 6 s step to fit |

### 3.7 Toward forty by 1.0

The arsenal grows by milestone (ROADMAP owns the dates: its §3.4 shifts this section's 0.4, 0.5 and 0.6 lists by one, to 0.5, 0.6 and 0.7, and keeps 0.2 and 0.3; the models are my proposals). Calibres added: 12.7×100 mm Republic, 8.6×70 mm Republic, 4.6×30 mm UN, 84 mm recoilless rounds, 26.5 mm signal flares, 6.8 mm powder-actuated pins, the 12 mm HAD rocket (§3.9), and the subsonic and countermass loads.

| # | Model | Maker | Kind, calibre | Why it exists | Milestone |
|---|---|---|---|---|---|
| 18 | M-30 medium machine gun | HAD | mmg, 7.6×56 belt, tripod | the weapons platoon's gun; base and checkpoint defence on Europa | 0.3 |
| 19 | C-7N naval carbine | HAD | carbine, 6.5×40 frangible, catcher fixed | the ship's armoury; the sailors' gun at general quarters | 0.2 |
| 20 | S-11 recon sniper rifle | HAD | sniper, 8.6×70 | scout snipers | 0.6 |
| 21 | S-14 anti-materiel rifle | HAD | 12.7×100, bolt | vehicles, drones, the Europa surface | 0.7 |
| 22 | C-7S suppressed recon carbine | HAD | carbine, 6.5×40 subsonic | reconnaissance | 0.6 |
| 23 | P-12S recon pistol | HAD | pistol, 9×21 subsonic, suppressor | reconnaissance | 0.6 |
| 24 | ~~V-5X countermass carbine~~ (withdrawn 2026-11-08) | HAD | the over-the-shoulder launcher-shaped design is withdrawn (the user, 2026-11-08: "Try keeping rifles looking like rifles even zero G stuff, let's say we use footing to hold recoil"); a countermass or low-recoil carbine, if one is kept, has a rifle's form and handling (§3.9); the number keeps the slot | | unscheduled (was 0.5) |
| 25 | G-46 six-shot launcher | HAD | gl, 40×46 revolver | the assault section | 0.5 |
| 26 | RL-84 recoilless rifle | HAD | 84 mm, backblast 30 m (the CS variant uses a saline countermass for confined spaces) | bunkers, vehicles, hatches on the surface; never inside a pressure hull without an order | 0.6 |
| 27 | B-12K under-barrel breacher | HAD | shotgun, 12-bore, 3 shells | breaching without a second long gun | 0.5 |
| 28 | SP-26 signal pistol | HAD | 26.5 mm flare | signals; illumination on Mars under its parachute; on Europa there is no air for the parachute, so it burns along its arc as a falling star | 0.3 |
| 29 | L-40 less-lethal launcher | HAD (MSS) | 40 mm baton and OC | Martian Security; peacekeeping crowds | 0.3 |
| 30 | P-71 revolver | Tharsis Arsenal | revolver, 9×21 rimmed | an heirloom: an officer's grandfather's; tradecraft's cylinder rules | 0.5 |
| 31 | FA-9C carbine | Tessier-Ndlovu | carbine, 5.8×42 | UNN boarding parties | 0.5 |
| 32 | FA-9L marksman | Tessier-Ndlovu | dmr, 5.8×42 | UN Marines | 0.6 |
| 33 | MG-31 | Tessier-Ndlovu | lmg, 5.8×42 belt | UN Marines | 0.6 |
| 34 | SG-5 | Tessier-Ndlovu | shotgun, 12-bore semi | UN boarding parties | 0.6 |
| 35 | VP-4 boarding PDW | Tessier-Ndlovu | pdw, 4.6×30 UN | the UN's answer to the V-5 | 0.6 |
| 36 | TMW-9 "Long Six" | Tycho Machine Works | dmr, 7.62×39, long barrel and a 4× scope | the Belt's marksman | 0.5 |
| 37 | Rockhound | a Vesta shop | bolt rifle, 7.62×39 | prospectors' rock-and-varmint rifle; insurgents' sniper rifle | 0.5 |
| 38 | slam-fire shotgun | a Ceres shop | shotgun, 12-bore single | improvised; unreliable ×3 | 0.5 |
| 39 | rivet driver | Europa's ice works | improvised, 6.8 mm powder-actuated pin, 5 m range | the ice towns' tool, a weapon in a riot; a nail in a pressure suit | 0.3 |
| 40 | Cold Hand | Hungry Dark clan | smg, 9×19 open bolt, integral suppressor | pirates of the outer dark: "they run cold and leave nothing behind" | 0.7 |
| 41 | SH-9 pistol | Star Helix | pistol, 9×19 | the Belt's police contractor | 0.6 |
| 42 | SH riot gun | Star Helix | shotgun, 12-bore beanbag | Belt station police | 0.6 |
| 43 | farmer's pump gun | Ganymede | shotgun, 12-bore | the Concord's farmers | 0.7 |
| 44 | Raptor | Brannock Security Services | carbine, 5.8×42 surplus | mercenaries with mixed kit | 0.7 |
| 45 | R-5 carbine | HAD | carbine, 6.5×40, 360 mm (756 m/s); HAD-30 and the translucent HAD-30T; safe, semi, auto; 3.6 kg, 80 cm (61 folded); cyclic 750; an RD-3 reflex sight on the carry-handle rail (+1, as the red dot); recoil 0.75, loud 1.5, `accDC` 0, unreliable 1.0 | HAD's previous service rifle, the second reference's look (§3.10): the variety by unit, role, posting and era: a squad that carries it, the player carries it (question 18) | 0.3 (issued where a unit carries it) |
| 46 | J-12 rocket carbine ("the Jet") | HAD | carbine, 12 mm HAD rocket, caseless; a 20-round box; semi; 3.1 kg loaded, 78 cm; RD-1 and the HUD link; recoil 0.4 N·s a round; `accDC` +2; loud 0.6 at the muzzle | the void kit's long arm: hulls, crossings, vacuum (§3.9) | 0.5 |

Melee weapons (the bayonet, the entrenching tool, the rifle used as a club: tradecraft's `gunWhip` k 1.2, a long gun 1.6, guard 0.7) are COMBAT's, on tradecraft's `weapons.js` table.

### 3.8 Data shapes

A model (pure data, `src/sim/arms/models.js`):

```json
"r7": {
  "maker": "had", "name": "an R-7 rifle", "short": "R-7", "kind": "rifle", "cal": "6.5x40r",
  "barrelMm": 460, "feed": "mag", "mag": "had30", "magsOk": ["had30", "had30c"],
  "action": "semi", "safety": "selector", "modes": ["semi", "auto"], "holdOpen": true,
  "safeNeedsCocked": true, "chamberSensor": true, "fromOpenBolt": false,
  "massKg": 3.9, "lenCm": 92, "lenFoldCm": 85, "rpm": 700,
  "optic": "so4", "mounts": ["optic", "ugl", "light", "laser", "bipodClip", "catcher", "suppressor", "bfa"],
  "acc": 0, "recoil": 0.70, "loud": 1.4, "unreliable": 1.0, "dustK": 1.0,
  "heatPerRoundC": 2.5, "barrel": "light", "quickChange": false,
  "gloveK": 1.0, "tether": true, "family": "r7", "priceMcr": 1400, "since": "0.1"
}
```

An optic:

```json
"so4": { "magMin": 1, "magMax": 4, "throwLever": true, "reddot": true, "lrfM": 0, "ballistic": false,
         "met": false, "link": true, "bdc": { "cal": "6.5x40r", "load": "ball", "env": "mars-valley", "zeroM": 400 },
         "battH": 600, "massG": 480 }
```

### 3.9 The void arms: the zero-g branch

Added 2026-11-08 for the user's lore of that day (DESIGN.md's log): "We will however have a lot of zero G combat training with very different guns (low recoil guns, self propelled projectiles etc)". SETTING §5.11 gives the why (two kits: the ground arms built for air and weight, a second kit for free fall), COMBAT §14.8 the technique, PLACES §5.7 the ranges. Every model, load and number here is my call unless marked; the numbers marked [computed] come from a scratch script of 2026-11-08 (closed forms named where used; §7.8's drift and spin formula).

**What free fall asks of a gun.** Recoil's impulse is the same in every gravity (§7.8); what changes is that nothing takes it. A floating marine keeps all of it, as drift (`J / m`) and as spin (`J × 0.45 m / I`), so a gun for free fall is judged by its **impulse per round**, then by what it leaves in the air (brass, gas, smoke) and what it does to the hull (§8.6). Momentum gives only four ways down, and the branch has a family for each:

| Family | How it cuts the kick | Honest cost | The Corps' gun | Impulse a round | Floating, suited (150 kg): drift and spin a round; after 30 rounds |
|---|---|---|---|---|---|
| for comparison: the ground rifle | none | | R-7 (§3.2) | 8.5 N·s | 5.7 cm/s, 7.8°/s; 1.7 m/s and 235°/s |
| **Low impulse**: a light, fast bullet (the bullet's momentum is `√(2 m E)`, so at equal energy a lighter bullet kicks less) | less energy and less momentum downrange | a short-range round that suits stop better than they used to | **V-5** (§3.2, built at 0.2): 4.8×30 | 2.4 N·s | 1.6 cm/s, 2.2°/s; 0.48 m/s and 66°/s |
| **Countermass**: throw an equal momentum backward (the Davis gun of 1914; the Armbrust's plastic flakes and the AT4 CS's salt water today) | a round two and a half times as heavy, and a danger cone behind | nothing and nobody behind the shooter; in vacuum the countermass never stops | **none now**: the V-5X (#24) is withdrawn, its figures kept here as the family's (below) | about 0.5 N·s net (my call: the cancellation is imperfect) | 0.33 cm/s, 0.46°/s; 0.10 m/s and 14°/s |
| **Self-propelled**: launch the round slowly and let its own motor push it, so the exhaust's momentum goes with the round and not into the gun (MBA Associates' Gyrojet of the 1960s reached about 380 m/s some 18 m out; it was weak at the muzzle and inaccurate) | weak close in; smoke; a costly round | a round that has not burnt out is a weak round | **J-12** (#46, §3.7) | about 0.4 N·s (my call, from 0.22 N·s computed below, with margin) | 0.27 cm/s, 0.37°/s; 0.08 m/s and 11°/s |
| **No gas**: an electromagnetic (coil) gun | only the propellant gas's share: the R-7's bullet alone carries 6.2 of its 8.5 N·s (72%) | a 68 Wh cell for 30 shots of the R-7's energy at 30% efficiency (8.1 kJ a shot; 0.27 kg at 250 Wh/kg); heat in the coils; a flat cell is a dead gun | **none** (my call: a coil rifle is not a low-recoil rifle, and the Corps keeps chemistry; open question 1) | 6.2 N·s | 4.1 cm/s, 5.7°/s; 1.2 m/s and 170°/s |

[computed: §7.8's `Δv = J / m` and `spin = J × 0.45 / I`, with `I` 28 kg·m² suited; the coil gun's cell `30 × 2,434 J / 0.3`.] All three of the Corps' void guns are fired from an anchor all the same (COMBAT §14.8): 14°/s after a magazine is a slow turn, not none, and a push-off or a grab while firing is still a floating marine's.

**The J-12 rocket carbine ("the Jet")** (HAD; #46). A caseless rocket round, the **12 mm HAD rocket** (`12r`): 12.0 g at launch, of which 2.4 g is a chlorine-free ammonium dinitramide composite (the old perchlorate propellants made hydrochloric smoke, unbearable in a sealed hull), an exhaust of about 2,250 m/s, a 0.06 s burn and canted nozzles that spin it. It leaves the 0.10 m tube at 41 m/s and burns out 15 m away at **502 m/s** with **1,210 J** in 9.6 g [computed: `Δv = vₑ ln(m₀ / m₁)`, a constant 8,370 m/s² (853 G) of thrust, `v = √(2 a d)` to burnout]:

| Distance | 1 m | 2 m | 3 m | 5 m | 7 m | 10 m | 15 m (burnout) |
|---|---|---|---|---|---|---|---|
| Speed, energy | 129 m/s, 95 J | 183, 186 | 224, 274 | 289, 444 | 342, 607 | 409, 841 | 502, 1,210 |

After burnout it flies on a blunt base (my call: a constant Cd of 0.45 on its 12 mm, not a G7 fit, since no G7 table describes it):

| After burnout | 50 m | 100 m | 300 m |
|---|---|---|---|
| Vacuum (EVA, a vented hull, Europa's surface) | 502 m/s, 1,210 J, 0.13 s | 502, 1,210, 0.23 s | 502, 1,210, 0.63 s, and on for ever |
| A ship's air (66 kPa) | 466, 1,043 | 419, 843 | 274, 360 |
| Mars's valley | 462, 1,025 | 410, 809 | 256, 313 |
| Earth | 448, 964 | 381, 697 | 199, 190 |

So it is a void weapon: in vacuum it keeps a heavy pistol's energy times two to any range the marine can see, and in air it bleeds to a pistol's by 300 m. **Its recoil**: the round leaves the tube in 4.9 ms, a twelfth of its burn; the exhaust of that time carries 0.44 N·s, and about half of it strikes the breech face [computed], the rest leaving by the barrel's vents: 0.4 N·s with margin, a twentieth of the R-7's. **What else** (my calls): no case, so no brass in the air and no extraction step; semi only, about four rounds a second; a 20-round box under the tube; the vents throw a hot plume a hand's width either side of the barrel (BODY's burn within 0.5 m) and a puff of smoke a round (2.4 g: PLACES §3.7's smoke, about one compartment's haze after a box indoors); quiet at the muzzle (no blast) and a crack only once it passes the speed of sound, 6.9 m out in a ship's air (`d = c² / 2a`); `accDC` +2 at every range (thrust misalignment, the Gyrojet's old fault, made smaller, not cured); a misfire may hang fire, so its drill holds the muzzle on the backstop for 5 s before the dud is cleared (§5.4). The HUD link's ballistic dot knows the boost (§3.5). Loads: `ball` (a steel-capped slug, `pen0` 3.5 mm RHAe at burnout, falling with `(v / 502)²` both before and after), `frangible` (`pen0` 1.0), and `practice` (a short burn to 170 m/s that the Wells' live face stops, PLACES §5.7). Where it belongs: the hull and the crossing, the Cold Well, the boarding team's man on the outside; inside a compartment, where the target is 3 m away and a round there has 274 J, the V-5 and the V-5X are the guns.

**The V-5X countermass carbine: withdrawn (the user, 2026-11-08; question 19 answered).** The design below put the vent behind the shooter's head, so the gun was carried and fired over the shoulder like a launcher. The user asked for rifles to look like rifles in zero g too, "let's say we use footing to hold recoil": the kick is held by mag boots, a lanyard, the wedge and the buddy brace (§7.8, COMBAT §14.8), not by a launcher-shaped gun. So no V-5X in this shape: the void kit's guns are the V-5 (low impulse), the J-12 (a rocket carbine, in a rifle's form) and the R-7 on its footing. If a countermass or other low-recoil design is kept later, it keeps a rifle's form and handling (shouldered like any rifle, fired in any posture its anchor allows, no cone beside or behind the head that a rifle's drill does not already allow for), and is a new entry to design; the paragraph is kept for its numbers, struck from the arsenal until then (my call).

*The withdrawn design, for its numbers.* A **6.5×40 countermass** round: the R-7 family's bullet from a 300 mm barrel (735 m/s, §2.2) with a rear plug of **27 g of polymer powder** thrown back at about 300 m/s through a vent behind the receiver [computed: the forward 8.5 N·s, less the 0.5 N·s net, over 300 m/s]; the round weighs about 40 g against the ball's 16.5 g, so a 20-round magazine is about 0.9 kg. Because the vent must point behind the shooter's head, the gun rides **over the shoulder like a launcher** (the receiver above the shoulder, the vent behind the helmet, the sight offset to the left; `accDC` +1 for the hold), and cannot be fired prone or with the body behind it. **The cone behind**: in air the powder stops within about 2 m (a fine powder has almost no ballistic coefficient); **in vacuum it never stops**: a 30° cone of grit at 300 m/s that pits a visor and can scour a soft suit inside 10 m, and sandblasts what lies beyond (my call; BODY §19.4's leak roll within 10 m). Semi only; loud ×1.8 in air (the vent's blast beside the ear, COMBAT §5.1). Where it belongs: inside the hull, where a marine must fire many aimed rounds from a poor anchor and nobody is behind him.

**The V-5** (§3.2) stays the void kit's everyday gun, now with the J-12 and the R-7 on footing its whole kit: low impulse, glove controls, the brass bag, the tether ring, and a cartridge that works in air as well. The **C-7N** naval carbine (#19, 0.2) is the ship's air kit, frangible and caught.

**What the void kit is not** (my calls): no guided rounds (in vacuum a fin steers nothing, and a rocket round that steers by thrusters is a missile at a missile's price); no coil or rail small arms (above, and open question 1); and nothing the ground kit cannot also do in air: a marine with only an R-7 aboard a coasting ship fights, slowly, from boots and holds (§7.8). **Kit that is not a gun** (COMBAT §14.8 uses them): mag boots (BODY §16.6), a **lanyard** (a 0.5 m strap from the rig to a pad-eye or a handhold, clipped in 1.0 s at value 10; §7.8's anchor) and the **LL-30 line launcher** (a gas-fired grapnel or a magnetic anchor on 30 m of line, for a line across a compartment or onto a hull: the real line-throwing guns' principle; 2.2 kg).

### 3.10 The look: what the art draws

Added 2026-11-08 for the user's words of that day (DESIGN.md's log): "About gun design (drawing in the bottom left), Martian standard issue would look more like [the first reference], but we would have varyiety in the guns marines carry like [the second]". The drawing bottom left is the weapon card in the step panel (VIEWS §4.4); the same look holds for the doll, the inventory, the armoury counter and the figures' carried guns at the stage's density. The references are photographs kept on this Mac only (`/private/tmp/claude-501/olympus-build/gun-refs/`, not in the repo and not shipped); what follows describes them in words, with no maker's names. The final looks are chosen as the method says, from numbered gallery samples the user scores (below).

**The standard issue: the R-7 family** (the first reference, the user's "Martian standard issue"). A modern gas-piston carbine of the 2020s' kind, in two tones:
- **Colours.** A warm **sand tan** on the furniture and the receiver (the stock, the receiver, the pistol grip, the handguard, the foregrip) and **black** on the working metal and the attachments (the barrel and the muzzle device, the bolt and the charging latch, the controls, the optic, the light, the magazine, the sling's hardware). The Corps calls the tan **Melas tan** (my call). The user's reference look, restated on 2026-11-08, is **flat dark earth furniture on black metal**: the field rifle keeps exactly that.
- **The Corps' colours** (the user, 2026-11-08: "Martian Navy official colors are red and black ... armors are black, ceremonial stuff is red and black"). Red and black are the Corps' livery, not the field rifle's: the rifle in the rack and on the line is flat dark earth on black, and the gallery's G2 "Corps colours" sample (a grey-tan) is replaced by a **black take**, the R-7 family in black with red only at the markings (the stores' stencil, the unit's band on the handguard), to score (as built in v0.0.11 the black take has no red accent: DESIGN.md's log, 2026-11-08, my call). Ceremonial rifles (the colour guard's, the honour guard's) are black with red furniture and a red sling, drawn when the dress uniform is (VIEWS §3.3). The UN's FA-9 below is black and olive: the Blues are blue and black in dress and livery, the rifle keeps its olive.
- **The stock**: a side-folding skeleton stock, a tan frame with a long cut-out, a slim cheek riser and an adjustable length; it folds to the right (a piston gun needs no buffer tube behind the receiver).
- **The receiver**: flat-sided, a full-length rail along the top, the ejection port with its cover on the right, a large ambidextrous charging latch at the rear, a flared magazine well, the selector above the grip with its S, 1, A marks (VIEWS §4.4 as built).
- **The handguard**: long, slim and free-floated, its sides cut with rows of long slots, running to within a hand's width of the muzzle.
- **The muzzle**: a short black flash hider that takes the suppressor, standing a hand's width beyond the handguard.
- **Under and beside the handguard**: a short **angled foregrip** in tan, near the magazine; a black box light and laser on the right side rail near the front (the WL-1 and IR-3, §3.5, when fitted).
- **The optic**: the SO-4, a black low-power variable tube with a wide objective bell on a cantilever mount, its throw lever on the magnification ring, and a small black box on the optic's top right: the illumination and link module (§3.5's link).
- **The magazine**: the black polymer HAD-30, gently curved, ribbed on its lower half for the hand, a flared baseplate, its witness window on the side (as built: §3.3, VIEWS §4.4).
- **Proportions**: the reference is a short-barrelled carbine, so the **C-7** (76 cm) is drawn closest to it; the **R-7** (92 cm) is the same gun with a longer handguard and barrel; the **R-7M** the same again with a heavier barrel, a bipod in place of the angled grip and a long 3 to 12× scope; the **L-20** wears the family's tan with a black feed cover on top, a tan box under the receiver, a carry handle and a bipod; the **S-9** is long and tan, with an adjustable cheek piece, a 5 to 20× scope and its can; the **G-40** hangs black under the handguard.
- **On the card** (144 px/m, VIEWS §4.4): a tan gun with three black masses (the optic, the magazine, the muzzle) reads at once; the handguard's slots are a broken dark line along it, the angled grip a tan wedge under its front, the folded or open stock a tan frame with a hole in it.

**The variety** (the second reference, the user's "varyiety in the guns marines carry"). Marines do not all carry the same-looking gun, for three reasons (my calls):
- **Roles**: the squad's guns already differ (§3.2: the R-7, the C-7, the R-7M, the L-20, the G-40 on a team leader's rifle, the P-12 on a hip), each with the silhouette above.
- **One kit per squad** (the user, 2026-11-08: "We are but a cog in the machine, there is no such thing as 'the other marines', our player character is part of a squad and we have the same stuff"). The player carries what their squad carries, issued exactly as to the others: the R-5 and the R-7M below are issues, never a cosmetic difference between the player and the squad. Variety is by unit, role, posting and era, and applies to the player as to anyone: a posting to a unit that still draws the R-5 puts an R-5 in the player's hands.
- **The previous rifle, the R-5** (HAD; #45, §3.7): HAD's service rifle before the R-7, still in the racks of the weapons companies, Martian Security's tactical teams, the reserve and some second-line units (and carried by the player when the squad is one of them). It is the second reference: a compact carbine with a **one-piece moulded polymer body** in the same tan; a **carry handle** over the receiver that is also the optic's rail, with a large open **reflex sight** (a square window in a black box) on top of it; a short handguard with round vents and a short side rail; a **skeleton side-folding stock**, a triangle of tan polymer; a black **vertical foregrip**, ribbed; a short flash hider; and a **translucent smoked magazine** (the HAD-30T: the rounds show through its wall, and lugs on its side clip two together). Mechanically it is the R-7's sibling: the same calibre and magazines, the same selector, so nothing a player learns on one is wrong on the other.
- **The fit**: the Corps' approved list lets a marine fit, at their own cost from the PX (CAREER §12.8), an angled or a vertical foregrip, a single- or two-point sling, a light and a stock pad, so two R-7s in a rack rarely look alike; the optic stays the armoury's. Which fit a rifle carries is drawn from its serial by hash (the hub's rule for cosmetic choices).

**The other kits' looks**, for the samples (my calls): the **void kit** in **naval grey** with hazard yellow at its danger points (the J-12's vents); the V-5 compact, with oversized controls and its brass bag under the port; the **J-12** a slim grey carbine of a rifle's form (stock, grip, handguard and sight as the ground rifles', the user's "keep rifles looking like rifles"), rows of vent ports along its front half, no ejection port, the box of rockets under it. The void kit's grey and hazard yellow are the stores' marking; the Corps' own colours are red and black (below). The **UN's** FA-9 a black and olive bullpup with its magazine behind the grip and an optic built into a carry handle, so a marine tells Earth's rifle from the Corps' by its outline; the **Belt's** TMW-6 stamped steel and a dark laminate stock, a curved steel magazine; the **M-2290** dark steel and a long barrel, the old Republic's rifle.

**The samples to score** (for VIEWS's look round, the method's way: CLAUDE.md, `samples/`; not built here): the weapon card at 144 px/m and the figure's carried gun at 16 px/m, numbered, of (1) the R-7 as the first reference in Melas tan and black; (2) the same with an olive drab in place of the tan; (3) the same all black; (4) the C-7, (5) the R-7M and (6) the L-20 in the family's look; (7) the R-5 as the second reference; (8) two R-7s with different fits side by side; (9) the void kit's two in naval grey, the V-5 and the J-12; (10) the black take (below). The user stars and scores them; the winners become the card's and the sprites' look.

---

**As built in v0.0.12** (`src/sim/arms/kit.js`: `ces-1`, `house-cqb`): the combat EVA suit is worn unpressurised with the visor down: 16 kg, black, no red, CLO 1.2, ears `suit` (a training bang at 2 m reads 36 points against 60 bare; 3 kHz low-pass, -20 dB), no flash and no dazzle; it costs nothing on the rolls or the gait in air, and `protOf` reads its visor and sound filtering. The `suit` slot is placed before `ears`. The house's issue: the plate carrier, two magazine pouches and a dump pouch, the R-7 and three magazines of 10 frangible, at low ready, 25.68 kg in all. Drawn black with a sealed helmet and a smoked visor (`COMBAT_SUIT` colours).

**As built in v0.0.13: the look as scored** (`src/art/rifles.js`, `src/data/finishes.js`; the user's gallery scores of 2026-11-08, DESIGN.md's log, each departure my call; this supersedes the tan-furniture and G0 notes above where they differ).
- **The standard issue looks like G2 in the Corps' black**, drawn as `r7`: G2's skeleton stock, receivers, slotted handguard with its rail, angled foregrip, light and brake, with V1's carry handle, rail and boxed red dot where G2 had a low-power scope. Flat dark earth is one finish among seven, not the issue's.
- **The optic drawn is the SO-4**: a boxed holographic sight on the carry handle's rail with a 4× magnifier on a flip mount behind it (`MAGNIFIER_AT_M` 0.27 to 0.335 m from the butt). A red dot alone is a 1× sight (my call), so the 4× is the magnifier. On the card it is in line when you believe the lever is at 4× and swung `MAGNIFIER_DROP_PX` 4 down at 1×; on the figure it is one gun-metal pixel behind the box, always in line. §3.5's numbers do not move.
- **Finishes** (`src/data/finishes.js`): the seven, one per squad by deployment, `black` (the issue's), `fde` (flat dark earth), `mars` (Mars rust), `desert` (Earth desert), `ice` (Europa ice), `woodland` (Earth woodland) and `urban` (urban grey). Each is a ramp for the furniture (FL, F, FD, FDD), the metal (B, BL) and the magazine (body, edge, rib, plate, window), all Mars palette colours, and `desert` alone has a figure ramp `fig` (FL, F, FD) one step darker than its card, so it parts from `ice` at 16 px/m (my call). Mars rust is the red dust family with the regolith's 0xa65e4b as its base; Earth desert is the sand grey; Europa ice's metal is a mid grey; urban grey is the steel greys' middle. V1's clear smoked magazine is kept in every finish. A finish changes colours, never a shape.
- **The samples as scored**: R-7 is `r7`, G1 an alternate asset (`RIFLE_DESIGNS` g1, not the R-7), V1 kept (the R-5's likely look), M1 the R-7M's drawing (`DRAWN_AS` `{ r7: 'r7', r7m: 'm1' }`), G0 purged. The figure draws a non-R-7 model's own design once a scene issues one (my call).
- **No sling on the card** (the user, 2026-11-08: "get rid of the green arch it serves no purpose"); the figure keeps its strap. **The HAD-30 is 9 px wide** on the card, curving 5 px, its window 2 px, as scored with G2 (`MAG_W_PX` 9, replacing the 7 px of the 2026-11-07 "slicker" ask: my call; setting 7 undoes it).
- **The fiction of §3.5 and §3.2**: the SO-4 is a holographic red dot with a 4× flip magnifier; "throw the lever" means flipping the magnifier into line. `OPTIC_S` 0.5 s, the sight picture (0.90 at 1×, 1.20 at 4×), `opticMod` and the far window's 4 and 16 px/m are unchanged. The card reads the lever from the belief (`weaponcard.js` `cardParts`' optic; `optic` is in `steps.js` `BELIEF_FIELDS`).
- **The gun's record gains `finish`** (§4.1): an id of `finishes.js`, absent for the Corps' black like every default; `firearms.js` `finishOf` reads an unknown or absent id as black, `newGun({ finish })` refuses an unknown id, `kit.js` `materialise(state, pid, tmplId, { finish })` issues a squad one finish (the one-kit rule of 2026-11-08), and `look.js` `gunLook` carries `finish` only when it is not black. No upgrade is needed: older saves lack the field and read black. Not built: a test parameter `&finish=<id>` (it needs `core/debug.js` and a scene fill; an unknown id would toast "No finish 'x': the Corps' black instead.").

## 4. The gun as a state machine

### 4.1 Truth

Ported from tradecraft `src/sim/firearms.js` (487 lines, imports only `checks`, `skills`, `rng`): the state, `newGun`, `act`, `fire`, `feed`, `canDo`, `said`, `ready`, `misfire`, `jamChance`, `service`, `moveArm`, `fillMag` keep their meaning. A gun's state is its record in `state.items`, held by a person's kit, a place's lying list or a fixture (TECH §6.7): a gun dropped is the same gun picked up (tradecraft).

```json
"i7": {
  "type": "gun", "model": "r7",
  "mag": "i401", "chamber": "live", "jam": null, "locked": false,
  "mode": "safe", "cocked": true, "portOpen": false,
  "cond": 0.93, "foul": 0.12, "dust": 0.04, "lube": "dry", "frost": 0,
  "barrelC": 24, "gunC": 8, "roundC": 24, "barrelHist": { "maxC": 310, "over600": false },
  "optic": "i406",
  "zero": { "rangeM": 400, "gMs2": 3.727, "rhoKgM3": 0.894, "soundMs": 322, "v0Ms": 790,
            "angleMrad": 1.576, "atMs": 1784000000 },
  "fit": { "sling": "two-point", "bipod": false, "catcher": false, "ugl": "i405", "suppressor": null, "light": false, "laser": false, "bfa": false, "cover": null },
  "belief": { "chamber": "live", "mag": "in", "count": 29, "countApprox": false, "safe": true, "cond": "fine" },
  "rounds": 37, "cleanedMs": 1782000000, "servicedMs": 1700000000,
  "name": null, "byId": "p233"
},
"i401": { "type": "mag", "fam": "had30c", "n": 29, "load": "ball" },
"i405": { "type": "gun", "model": "g40", "chamber": "empty", "mode": "safe" },
"i406": { "type": "optic", "model": "so4", "mag": 1, "on": true, "battH": 540, "link": true }
```

Ids are CONTRACTS §10's: the gun, its magazine, its launcher and its optic are items (`i<n>`), each with its own record in `state.items`, the magazine held by the gun's `mag` and the launcher and the optic by its mount (TECH §6.7); `byId` names the player, an ordinary person id. The record is printed whole here; on disk null, false and default fields are left out (TECH §6.6, rule 1), and a racked, cleared gun saves only what differs from its model's defaults, about 250 B (rule 7).

New fields against tradecraft: `serial` (derived from a hash of the id, "HAD R7 0412 3378", never saved), `portOpen`, `foul`, `dust`, `lube` (`wet`, `dry`, `vac`, `none`), `frost`, `barrelC`, `gunC` and `roundC` (the chambered round's own temperature, for cook-off) (°C), `barrelHist` (the hottest the barrel has been, for the armourer: §9.5), `optic` (the item on the gun's mount), `zero` (§2.5), `fit` (accessories), `belief`, `rounds` (lifetime count, the armourer's book), `name` (marines name their rifles: PEOPLE's quirk; the sheet shows it), `finish` (as built in v0.0.13: an id of `src/data/finishes.js`, absent for the issue's Corps' black; §3.10). Magazine: `{ "type": "mag", "fam": "had30c", "n": 30, "load": "ball", "tracerLast": 0, "cond": 0.95, "dust": 0, "dummy": null }`.

**Lazy state** (LONGHAUL's "traffic that never fights never pays for it"): a crowd NPC's gun has no record until it matters (drawn, dropped, taken, searched); then `newGun()` makes it from the NPC's template, when `materialise(state, personId)` gives the kit's items their ids and records (TECH §6.7's lazy kit).

**As built in v0.0.5** (`src/sim/arms/firearms.js`, `models.js`, `calibres.js`; the build sheet 0.0.5 §3): the R-7 alone, its record this round's fields only, `{ type: 'gun', model, mag, chamber: 'live' | 'dud' | 'case' | absent, jam: 'double' | absent, locked, mode: 'safe' | 'semi' | 'auto', cocked, portOpen, set, cond, foul, dust, lube, barrelC, rounds, byId, belief }`, saved without its defaults (`GUN_DEFAULTS`: no chamber or jam, the bolt closed, safe, cocked, the port shut, no set round, clean, `wet`, 0 rounds). **`set`** is the coach's set round once chambered (`'dud'`, `'stovepipe'` or `'double'`); before that it rides on its magazine as `set: { n, kind }`, tradecraft's `mag.dummy` rule, and `feed()` moves it to the gun when the round at count `n` is taken (§11.3). A magazine is `{ type: 'mag', fam, n, load, cond?, dust?, set?, belief? }`. Dust, fouling, lube and heat are read and never moved until 0.0.8; `serial`, `optic`, `zero`, `fit` and the cold fields wait for their rounds. A pistol `draw` (1.0 s, DC 8) is kept in `ACTIONS` for the tradecraft parity test only; `canDo` never offers it.

**As built in v0.0.6** (`firearms.js`; the build sheet 0.0.6 §9 items 35 and 42): **`gun.load`**, the kind of the round in the chamber, saved only when not ball (so a gunless or all-ball game writes nothing new); the kind moves with the magazine as the count does. A magazine reached for is held in `kit.hands`.

### 4.2 Belief: what the holder knows

The hub's pillar 2 lists "what you know about it" as part of the gun's state, and tradecraft kept a single `known` flag. OLYMPUS keeps a belief per part, and every display (the weapon card, the step panel, the HUD) shows the belief, never the truth (my call):

| Part | How it becomes known | How it is lost or goes wrong |
|---|---|---|
| `chamber` | your own LOAD and MAKE READY; a press check; an inspection; the R-7 family's chamber sensor through the HUD link | a fumbled rack or eject sets it to `?`; a pickup is `?` |
| `mag` (in or out) | always known when the gun is in your hands (you feel it); `?` for a gun seen on someone else | |
| `count` | filled by you, a magazine check (witness window, ±1 above 20), a counter magazine with the link | shots fired: at Weapon handling ≥ 15 you count exactly; 8 to 14 the count drifts ±1 in 10 shots (`countApprox`); under 8 it is lost after the first burst ("some") |
| `safe` / mode | always known when in hand (the lever is under your thumb); with hard-suit gauntlets and no link, the first look costs 0.2 s | |
| `cond` | words only: "fine", "gritty" (dust ≥ 0.2), "fouled" (foul ≥ 0.4), "wants cleaning" (cond < 0.6 or dust ≥ 0.4), "wants the armourer" (cond < 0.4) | the number is the armourer's (§10.5) |

A weapon you did not load is unknown until you check it (tradecraft's `known: false`). A gun handed over "clear" is believed clear only if you saw it shown (§5.3).

**As built in v0.0.5** (`firearms.js` `beliefOf`, `feel`; the build sheet 0.0.5 §2.1, §8 item 27). The gun's `belief` is `{ chamber: 'live' | 'empty' | '?' | 'dud' | 'case', locked, stoppage, count, countApprox }`; the magazine in or out, the selector, the port cover and the hammer are always known in hand and read from the truth by `beliefOf(state, gunId)`, the one view the HUD reads, which returns no other truth field. **A magazine's believed count lives on the gun while the magazine is in it, and on the magazine (`mag.belief: { n, approx }`) while it is out**, so a belief about one magazine is in one place at a time and moves with it; a magazine with no `belief` is uncounted. The belief moves only by what the holder did, saw or felt: `charge`, `release` and `magIn` as the holder expects from what they believe; a press check, an inspection, a magazine check and a look at the port copy the truth they look at; a `miss` on a charge, a rack, a lock back, a magazine out or an inspection makes that part `?`; a `bad` inspection sees `empty` whatever is there (§5.4). A pull tells what it felt (`feel()`): a round fired counts down one (`countApprox` under Weapon handling 15), the last one `locked` with the chamber `empty`; a click `stoppage: 'click'`, a dead trigger `'dead'`, a shot that did not cycle `'felt'`; a pull on a bolt believed locked back is felt as the bolt back, no stoppage. A look at the port (`observe`) turns `click`, `dead` and `felt` into what the port shows: `case` (a stovepipe), `double` (a double feed: the chamber's belief stays `'live'` under it, as built; the weapon card shows DOUBLE), `empty` locked back, or leaves `click` when the bolt is home (a dud or nothing, which a press check tells). **Lock back keeps a double believed**; a charge or a rack with no magazine in clears it (§5.3's REMEDIAL ACTION).

**As built in v0.0.6** (`firearms.js` `beliefOf`, `feelOf`; the build sheet 0.0.6 §9 items 32, 35 and 39). **A magazine's belief gains `kind`** (the kind of rounds, told at the issue or seen by a look at its feed lips) **and `feel`** (its weight's band, learnt in the hand when its count is not known: none; a few, 1 to 7 of 30; about half, 8 to 18; nearly full, 19 to 29; full). **The gun's belief gains `load`**, the believed kind of the magazine in it. `beliefOf` gains **`magLoad`** and **`hand`** (the magazine in your hand, believed fields only: `{ fam, n, approx, load, feel, cap }`), which the weapon card and I draw (VIEWS §4.4, §8.3). A weight unlike the count believed (by more than ±1 when that count is a guess) makes the count unknown. A v0.0.5 save's magazines read their kind unknown ("kind not seen"), which ranks after a known ball and before another kind; no upgrade is written (the before-1.0 rule).

### 4.3 Reliability

Each trigger pull with a live round can misfire, and each cycle can stop. Tradecraft's formulas, with Mars added and the base rates set to service grade (my call, after the review):

```
wearK   = clamp((0.90 − cond) / 0.65, 0, 1)            a serviceable gun (0.90 to 0.95) carries no wear risk
misfire = (MISFIRE 0.00015 + MISFIRE_WORN 0.05 × wearK + 0.002 × dust + cold.misfire) × unreliable
jam     = (JAM 0.0006 + JAM_WORN 0.12 × wearK² + JAM_DUST 0.014 × dust² × dustK + JAM_FOUL 0.02 × foul²
           + limp + catcher + dryLube + heatJam + frost × 0.05) × unreliable × cold.jamK
          + MAG_JAM 0.3 × max(0, 0.9 − mag.cond) + 0.005 × mag.dust + cold.mag
```

**Why the base rates changed.** Tradecraft's `MISFIRE` 0.002 and `JAM` 0.004 (with its wear term already lit at a fresh gun's 0.95) gave a clean pistol a misfire and a stoppage in every 200 pulls: tuned for play in a game where a gun fires a few magazines. Real service ammunition misfires on the order of once in 10,000 rounds or less, US M4 trials in 2006 and 2007 measured thousands of rounds between stoppages, and the US Army's 2007 extreme-dust test (rifles caked in dust in a chamber, then fired) gave the M4 882 stoppages in 60,000 rounds (1.5%) and the gas-piston HK416 233 (0.4%). A marine fires thousands of rounds a year, so tradecraft's rates would give a fresh rifle a misfire and a jam every 200 rounds and teach that the rifle is a slot machine. The base rates are now service grade, and **tradecraft's slopes for wear are kept** (`MISFIRE_WORN` 0.05 linear, `JAM_WORN` 0.12 squared, from cond 0.90 down to `BROKEN`), so a worn or neglected gun is as bad as tradecraft's and condition carries the risk, as the user's own ask put it (tradecraft, 2026-11-03: "can misfire if in bad condition"). Dust is the R-7's real enemy (Martian dust is finer and clings by static: my call that a piston R-7 in a Martian storm sits between the 2007 test's M4 and HK416).

- `limp` 0.03 for a pistol with Weapon handling under 6 (tradecraft's limp wrist); `catcher` 0.001 with a brass catcher on (§2.8); `dryLube` 0.005 with no lube at all.
- `cold` comes from the gun's temperature (§9.6's table): `cold.jamK` ×1.5 below −20 °C with `wet` lube, and below −60 °C the cold soak's `cold.misfire`, `cold.jamK` and `cold.mag` (all 0, or 1 for `jamK`, in a warm gun).
- `heatJam` 0.01 with the barrel over 350 °C.
- Of stoppages, `DOUBLE_SHARE` 0.3 are double feeds (if the magazine has rounds), the rest stovepipes (tradecraft).
- A belt-fed stoppage is a `belt` jam: cleared by the belt drill (§5.2), not tap-rack.
- Each round wears `cond` by `WEAR` 0.00004, ×1.5 on automatic, ×2 with the barrel over 350 °C, ×10 over 500 °C (§9.5), ×2 with no lube. Tradecraft's 0.0008 a round suited a pistol's few magazines; at a rifle's round counts it would break an R-7 in under 900 rounds, against the armourer's 2,500-round service (§9.4). At 0.00004 the service finds the rifle at about 0.85, and a rifle that misses it reaches 0.6 by about 8,700 rounds (my call).
- Below `BROKEN` 0.25 it will not fire (tradecraft).

**Rates** at a pull, R-7 (magazine fresh unless noted) [computed from the formulas]:

| State | Misfire | Stoppage |
|---|---|---|
| fresh (cond 0.95, clean) | 0.015% (1 in 6,700) | 0.06% (1 in 1,700) |
| after a range day (cond 0.95, foul 0.15, dust 0.15, magazine dust 0.05) | 0.045% (1 in 2,200) | 0.16% (1 in 620) |
| a week in the field uncleaned (cond 0.94, foul 0.3, dust 0.4, magazine dust 0.2) | 0.1% (1 in 1,050) | 0.56% (1 in 180) |
| a dust storm with the port open (foul 0.1, dust 0.8, magazine dust 0.4) | 0.18% | **1.2%** (1 in 85: between the 2007 test's M4 and HK416) |
| a magazine dropped twice on hard ground (mag cond 0.87), the gun clean | 0.015% | 0.96% |
| due for its service (cond 0.85), clean | 0.4% | 0.13% |
| worn (cond 0.6), cleaned | 2.3% | 2.6% (tradecraft's [test]: 3.0%, 3.5%) |
| nearly broken (cond 0.35) | 4.2% | 8.7% (tradecraft's: 4.9%, 10.1%) |
| the TMW-6 (cond 0.85) in that dust storm (dustK 0.5, unreliable 0.8) | 0.45% | 0.68% |

So a squad's day on the range (13 marines, 80 rounds each) sees one or two stoppages, mostly from dust and magazines; a storm sees one in every three magazines; a rifle that has skipped its service starts to misfire; and the coach's dummy round (§11.3) is still the reliable way to make a new join practise immediate action.

### 4.4 What a pull can say

Tradecraft's `fire()` refusals stay, with their words: `safety` ("The trigger won't move: it's on safe."), `empty` ("Click."), `jammed`, `dud`, `broken`, `open` (a revolver's cylinder), `case` (a pump or bolt not worked). A stoppage reports `case` (a stovepipe: tap-rack) or `double` (a double feed: the drill). On empty, an R-7 locks back; the TMW-6 does not (tradecraft's `holdOpen`).

**As built in v0.0.5** (`firearms.js` `REFUSALS`, `pull()`): `safety` "The trigger won't move: it's on safe.", `empty` and `dud` "Click.", `jammed` "The trigger's dead.", `broken` "Nothing: it wants the armourer.", and two more: **`open`** "Nothing: the bolt is back." (a pull on a bolt locked back) and **`dead`** "The trigger's dead: the hammer is down." (a pull after the hammer fell on a function check or a click). `resolveShot` logs a refused pull in these words (`REFUSALS[why] ?? 'Click.'`), and the panel's struck Fire says why when its digit is pressed (VIEWS §7.4).

---

## 5. Handling: every action, its time and its roll

### 5.1 Time, rolls and penalties

- **The roll is Weapon handling** (SKILLS §2.1) against the action's DC, with the moment's modifiers, the body's and the needs' (SKILLS §5.3 order: task, env, gear, body, need).
- **Time** = base (seconds, **at value 10**, SKILLS §5.12) × `paceOf(Weapon handling)`, where `paceOf(v) = max(0.45, 1.6 / (1 + v/16.7))`: v 3 ×1.36, 7 ×1.13, 10 ×1.00, 15 ×0.84, 20 ×0.73, 25 ×0.64, 30 ×0.57. **Thumb work** (safety, selector, decocker, the port cover, the optic's throw lever, the weapon light) takes `paceOf²`: "high skill makes this virtually instant" (the user, tradecraft 2026-11-03).
- **Long guns** take `LONG_K` 1.15 on every action but the draw, stowing and thumb work (tradecraft; thumb work as §5.2's table computes it, the build sheet 0.0.5 §8 item 13).
- **Failure** (any grade under `pass`) costs ×1.6 time (`FUMBLE_K` 0.6), then the ladder (§5.4).
- **A caught 1** (SKILLS §5.1; designed 2026-11-11, to build in the shoot house rework) is a natural 1 on a step that is routine, or that a hand at Weapon handling 15 or more would make by 10 without the die, at any pressure, not rushed. It **succeeds at ×1.5** (`CATCH_K` 0.5) and goes nowhere near the ladder. A natural 20 on any handling step is **clean, ×2/3** (`CLEAN_K` 1/3).
- **Tempo** (SKILLS §5.9): actions marked rushable may be done `rushed` (×0.6 time, −3); actions marked careful may be done `careful` (×1.5, +2); bench work marked steady may be **taken steady** at pressure `none` (×2 time, the d20 counts as 10, no naturals). The column says which.
- **Pressure** (SKILLS §5.9) comes from the situation: `fire` (shot at in the last 5 s, or a blast or a flashbang within its reach) and `danger` mean nothing is routine and set what a roll teaches, but **carry no penalty of their own from 2026-11-07**: the chaos's cost is COMBAT §5.3's felt modifier, one `env` entry (−1 a 10 points of the pool less hardening, at most −10 on handling), and every handling time is × `(1 + felt / 200)`. They replace `fire` −3 (tradecraft's `stress()`, built as `PRESSURE_MODS.fire`) and `danger` −1 (never built). No light to see the gun by −2 (tradecraft), kept; a flash-blind man handles by feel, so the same −2 (COMBAT §11.4).
- **Gear penalties** (SKILLS §5.13, worn down by EVA): pressure-suit gloves −4 base on Weapon handling (BODY sets it; SKILLS' suggestion), hard-suit gauntlets −5 (my suggestion), each halved on guns with oversized controls (`gloveK` 0.5: the V-5, the P-12's safety). Gloves also take time ×1.3 (×1.5 gauntlets), halved likewise.
- **Familiarity** (my call): a gun family you have had under 2 hours of handling or 100 rounds is unfamiliar: −3 and ×1.25 time; under 10 hours or 500 rounds, −1 and ×1.1. The R-7 family is familiar to every marine from boot camp. Picking up a TMW-6 on Europa is not, and the log says so ("The Belt rifle's selector is upside down").
- **As built in v0.0.5** (`firearms.js` `actionMs`, `doAction`): the time is `s × (thumb ? paceOf(WH)² : paceOf(WH) × (long ? LONG_K : 1)) × the tempo's`, before any fumble. `doAction` applied the `fire` pressure's −3 to every handling step (no caller ever passed `fire`, so it was never applied in play); `danger`'s −1 was not applied, since no scene reaches danger. **As built in v0.0.9** `PRESSURE_MODS` is gone from `firearms.js`: `fire` −3 and the `danger` −4 are retired (never applied), and the roller (`combat/roll.js`) adds COMBAT §5.3's one `suppressed` entry instead; `actionMs` takes `suppTimeK(felt)` (COMBAT §5.9). With no chaos `timeK` is exactly 1, so test-handling (100/100/100), test-range and calm test-pairs run unchanged to the tick. Every roll on the range is at pressure `evaluated` (the build sheet's §8 item 12): handling is routine for the trained (SKILLS §5.1), the shot and a rushed step never are. The roller (`combat/roll.js`) adds "no light to see it by" −2 to handling where the light is under `DARK_BELOW` 0.25, and the dark adds `DARK_DC` +4 to a look (an inspection, a look at the port, the observer's look); gloves and familiarity wait for their scenes.

### 5.2 The actions

Base seconds at value 10 (before `LONG_K` where it applies), DC, and tempo flags (R rushable, C careful, S steady). Tradecraft's values are kept where the action existed; new ones are my call.

| Action | Base s | DC | Tempo | Notes |
|---|---|---|---|---|
| **draw** pistol: thigh / belt / chest / suit hardpoint / shoulder rig / pack | 1.1 / 1.0 / 1.2 / 1.0 / 1.6 / 4.0 | 8 / 8 / 8 / 7 / 9 / 12 | R | tradecraft's `DRAW`, re-cut for military rigs |
| **up**: a long gun to low ready from slung front / slung back / suit back hardpoint / vehicle rack | 1.0 / 2.5 / 1.8 / 2.0 | 6 / 9 / 8 / 7 | R | the long-gun "draw"; the first step after G |
| **stow**: pistol to holster; long gun to slung front / back | 1.3 / 1.0 / 2.0 | 6 / 5 / 6 | | tradecraft's `holster` |
| **posture** change between patrol, low ready, high ready, Sul | 0.3 to 0.5 (§6.1) | 3 to 4 | | outside the mode with the V key; no toast unless it fails, always in J under the `habit` filter (§6.3) |
| **safety** / **selector** / **decock** | 0.4 | 6 / 6 / 5 | thumb | tradecraft |
| **port cover** closed | 0.4 | 3 | thumb | opens itself on firing |
| **optic** magnification | 0.5 (throw lever, thumb) / 1.2 (turret) | 3 | | |
| **light**, **laser** on or off | 0.3 | 3 | thumb | |
| **charge** (rack the slide, the charging handle, the pump, the bolt) | 0.8 | 8 | R | tradecraft's `rack`; on a pump, a failure short-strokes (`case`) |
| **bolt release** | 0.3 | 6 | R | |
| **lock back** | 0.6 | 6 | | new: the bolt held open by its catch |
| **magazine out**: drop / to the dump pouch / to a pouch | 0.5 / 0.9 / 1.4 | 5 / 6 / 7 | R | tradecraft's `dropMag`, `stowMag`; the dump pouch is new |
| **magazine in** (with the tug) | 1.4 | 9 | R | tradecraft; a magazine held in the hand first (REMEDIAL ACTION's stripped one), then the fullest believed spare of the family, ties in reach order (`kit.js sparesOf`, tradecraft's `sparesFor` by the holder's belief) |
| **reach** for a magazine (v0.0.6): from a named pouch / from the ground at your feet | 0.6 / 1.0 (+0.1 off regolith) | none | R | magazine in's first half, into the support hand; the pouch's front magazine; from the ground a pickup (`PICKUP_S`, no `LONG_K`) |
| **seat** a magazine in hand (v0.0.6) | 0.8 | 9 | R | magazine in's second half, the old roll whole, with the tug |
| **look at a magazine** in hand (v0.0.6) | 0.6 | 4, dark +4 | C | its witness holes give the count as a magazine check's window does (exact to 20, ±1 above), its feed lips the top round's kind; routine for the trained |
| **put back** a magazine in hand into a chest pouch with room (v0.0.6) | 1.0 | 5 | | behind the one there, so reaching again brings the next |
| **dump it** (v0.0.6) | 0.7 | 4 | | into the dump pouch |
| **drop it** (v0.0.6) | 0.3 | none | | at your feet; on the firing point's paving a drop's wear, on regolith none |
| **tap** (seat the magazine) | 0.3 | 4 | R | half of tap-rack |
| **press check** | 1.2 | 6 | C | sets `belief.chamber` |
| **magazine check** | 2.0 | 7 | C | witness window: sets `belief.count` (±1 above 20) |
| **inspect the chamber** (bolt locked) | 1.0 | 6, dark +4 | C | the check that catches a round left in |
| **function check** (a trigger pull on a believed-empty gun, muzzle in a safe direction) | 0.5 | | | no roll: if the belief was wrong, it fires (§6.6) |
| **clear a double feed** (lock, strip, rack ×3, in, charge) | 5.0 | 12 | C | tradecraft's `clear`, 4 s, lengthened for a rifle's drill |
| **chamber one by hand** | 3.0 | 10 | | tradecraft's `chamber1` |
| **one shell in** (tube) | 0.9 | 6 | R | tradecraft's `load1` |
| **belt in** (cover up, lay the belt, cover down, charge) | 3.7 | 10 | R | L-20 |
| **belt drill** (a belt stoppage: cover up, clear the tray, look in the chamber, belt in, charge) | 6.0 | 12 | C | L-20 |
| **barrel change** | 6.0 | 11 | R | L-20; a `bad` grade burns a hand (BODY: 2-point burn) or drops the hot barrel |
| **bipod** out or in | 1.0 | 4 | | |
| **launcher**: open, load a grenade, close | 3.5 | 8 | R | G-40 |
| **launcher**: unload | 3.0 | 7 | C | |
| **transition** (let the rifle hang, draw the pistol) | 0.3 + the draw | the draw's | R | |
| **retrieve** a floating gun or magazine within 0.9 m | 1.0 | 8 | | free fall only (§5.5) |
| **tether** clip or unclip | 2.0 | 6 | | |
| **brass catcher** on or off | 6.0 | 5 | S | |
| **suppressor** on or off | 4.0 | 5 | S | |
| **fill a magazine**: per round loose / per 10-round clip with the spoon | 2.2 / 4.0 | 4 / 5 | S | tradecraft's `fill`; lived when the job is under 45 s (TIME's `load-mags`), else skipped |
| **empty a magazine** per round | 1.0 | 4 | S | tradecraft's gunwork `empty` |
| **link a belt** (100 rounds with the linker) | 360 | 6 | S | |
| **recondition a magazine** (spring, lips) | 600 | 10 | S | tradecraft's gunwork `spring`; a `bad` grade bends a lip (cond 0.3) |

**Manipulation times** in seconds, rifle actions with `LONG_K` [computed]:

| Action | WH 3 | WH 7 | WH 10 | WH 15 | WH 20 | WH 25 | WH 30 |
|---|---|---|---|---|---|---|---|
| safety or selector (thumb) | 0.74 | 0.51 | 0.40 | 0.28 | 0.21 | 0.16 | 0.13 |
| magazine in | 2.18 | 1.82 | 1.61 | 1.36 | 1.17 | 1.03 | 0.92 |
| charge | 1.25 | 1.04 | 0.92 | 0.78 | 0.67 | 0.59 | 0.53 |
| speed reload (drop, in, release) | 3.43 | 2.85 | 2.53 | 2.13 | 1.84 | 1.62 | 1.45 |
| tactical reload (to a pouch, in) | 4.37 | 3.63 | 3.22 | 2.71 | 2.34 | 2.06 | 1.84 |
| tap-rack | 1.72 | 1.43 | 1.27 | 1.07 | 0.92 | 0.81 | 0.72 |
| double feed | 7.80 | 6.48 | 5.75 | 4.85 | 4.19 | 3.68 | 3.29 |
| draw the P-12 from the thigh | 1.49 | 1.24 | 1.10 | 0.93 | 0.80 | 0.70 | 0.63 |
| transition rifle to pistol | 1.90 | 1.58 | 1.40 | 1.18 | 1.02 | 0.90 | 0.80 |
| L-20 belt in | 5.77 | 4.80 | 4.26 | 3.59 | 3.10 | 2.73 | 2.43 |
| L-20 barrel change | 8.14 | 6.76 | 6.00 | 5.06 | 4.37 | 3.84 | 3.43 |

**Designed 2026-11-11 (the user's note on v0.0.12)**: the transition is built in the shoot house rework as COMBAT §25.19.6's **Transition: pistol** (the rifle to the sling 0.3 s, the draw from the thigh, the present by `aimS` with the pistol's sight, then the pistol's shot row: about 1.05 s at the sergeant's Weapon handling 19 and 0.64 s at the tier one's 42 to the draw's end, COMBAT §25.6.5), with its reverse **Rifle up** (the pistol to the holster, `stow` 1.3 s × pace, DC 6, then the rifle's IMMEDIATE ACTION). The pistol in hand runs every shot row (they read `muzzleOf`), with its own reaches (Hammer and Triple within 7 m as for the rifle).

A trained marine's speed reload of 2.5 s and an expert's 1.6 s are about what real drills time.

**As built in v0.0.5** (`firearms.js` `ACTIONS`; the R-7's actions this round; the build sheet 0.0.5 §2.1, §8 items 13 and 14; the fixer's): `up` (1.0 s, DC 6, from slung back 2.5 / 9), `stow` ("Sling it", 1.0 / 5: it ends the mode), `posture:lowReady` and `posture:highReady` (0.3 / 3), `selector:safe`, `selector:semi` (and `selector:auto`, in the machine and never in the range's panel), `port`, `charge`, `release`, `lockBack`, `magOut:drop`, `:dump`, `:pouch`, `magIn`, `tap`, `pressCheck`, `magCheck`, `inspect` and `functionCheck` at the table's times, and five new:
- **`observe`**, a look at the port: **0.3 s, DC 4 (dark +4), not paced by skill and taking no `LONG_K`** (my call: the eye's time, which the build sheet's IMMEDIATE ACTION times need). **Diagnosis is a step**: it ends IMMEDIATE and REMEDIAL ACTION (§5.3's "(observe)") and stands alone in the panel.
- **`show`**, the observer's look into the chamber held open to them, in SHOW CLEAR only: `SHOW_LOOK_S` 1.0 s × `paceOf(their Awareness)`, their Awareness against DC 6 (dark +4).
- **`finger`**, the finger off the trigger: 0 ms, no roll.
- **`magOut:strip`** (0.85 s, DC 6, rushable): the magazine stripped out into the support hand and kept there to go back in; and **`rack`** (0.45 s, DC 5, rushable): the action racked clear with no magazine under it (charge's code). They are REMEDIAL ACTION's own steps (the design review's: one 5 s roll had stood for the drill): with the lock back and a charge they make the table's 5.75 s at value 10. `clearDouble` (5.0 s, DC 12) stays a single, on the panel's later pages.

**Thumb work takes no `LONG_K`** (this table over §5.1's text, and tradecraft): the selector is 0.40 s at value 10. **Charge is offered** only to chamber a round from a magazine believed to hold some, to empty a chamber with no magazine, to clear a stoppage or to cock the hammer, never with a round believed in and a magazine behind it (tradecraft's rule; the fixer's).

**As built in v0.0.6: reach for a magazine, and what the hand learns** (`firearms.js` `ACTIONS`, `feelOf`; `kit.js` `pickMag`, `rankOf`; `drills.js`; the build sheet 0.0.6 §9 items 30 to 34; the user, 2026-11-07: "putting magazine in should be a "Reach for magazine" (or equivalent) and when we have the mag we reached for, we see if it has ammo in and which kind before we decide to either put it away again, drop it or put it in").
- **Reach plus seat is magIn split in two**: `reach` 0.6 s (no roll, rushable) and `seat` 0.8 s (DC 9, the old roll whole), both × `LONG_K`, so at Weapon handling 10 they make 691 + 921 = 1,612 ms against magIn's 1,611 (each sub-step rounded to its millisecond), **within 1 ms at every tier**, and LOAD, MAKE READY and the RELOADs live the ticks they lived: the range bot's course is unchanged to the tick, the point and the coach's word. A reach rolls nothing (§3.3: "reaching for one is part of the step's time"), so the dice stream is unchanged too. **`magIn` stays**, the two in one, for v0.0.5's saves made mid-LOAD and for REMEDIAL ACTION, whose stripped magazine comes back from the hand that racked (its 6.05 s stands).
- **In the hand its weight tells at once** (`feelOf`, no roll): none, a few (1 to 7 of 30), about half (8 to 18), nearly full (19 to 29) or full; written to the magazine's belief when its count is not known, and **a weight unlike the count believed makes that count unknown and halts a drill**, the rest queued ("From chest pouch 1. It feels empty. You thought 5 rounds."). **Look at it** reads the count and the top round's kind ("5 rounds, tracer on top: a red tip."; the coach's orange dummy when it is the top round); a failure learns nothing and says so.
- **The steps for a magazine in hand**: Magazine in (the seat), Look at it, Put back (one per chest pouch with room), Dump it, Drop it. While one is in the hand no reach is offered; a fumble that bites drops it. The panel's reach rows say what each would bring, as believed (VIEWS §7.4).
- **The drills reach by rule** (`rankOf`): a magazine believed empty last of all; then the kind the gun is meant to fire (`meantLoad`: the session's load, ball on the range), a kind not known, another kind; the fullest believed within it; ties in reach order; never the ground. With a magazine already in the hand a drill seats it and reaches for nothing. (Playing setup `mixed` by the keys, "RELOAD, keep the empty" had reached for the very empty it had just dumped: the empty-last key fixes it, pinned by `arms-reach`.) A drill's own reach says nothing in J and raises no toast unless its weight surprised it.

**As built in v0.0.14** (the actions the sidearm adds; COMBAT §25.19.6): `hang` 0.3 s, no roll; `draw:thigh` 1.1 s, DC 8; `holster` 1.3 s, DC 6. Stop and SHOW CLEAR judge both guns, the holster puts the P-12 on safe, and a transition on the lane draws it off safe. **`halfOrLess(b, gun)`** (moved to `kit.js` with `fullerAtHand`) reads `gun.belief.fullN`, set at the seat when the magazine is short of capacity and cleared on mag out, and falls back to the capacity; the house setups set it, test-handling's do not (§5.2's v0.0.8 note on the half-or-less rule).


### 5.3 The Corps' commands as macros

The Corps runs weapon handling by command (modelled on the US Marine Corps' LOAD, MAKE READY, FIRE, CEASE FIRE, UNLOAD, UNLOAD SHOW CLEAR and RELOAD; the hub settles that the Corps follows the US Marine model). Each is one step in the panel and one key; it runs its sub-steps in order, **each rolled and each in the log**. A macro **halts on any failure**, leaves the gun as that sub-step left it, and puts the remaining sub-steps back in the panel (my call). The chore is one choice; the dice still decide.

| Command | Sub-steps | Time at WH 10 (rifle) | Result |
|---|---|---|---|
| **LOAD** | safety (check), magazine in with the tug, port cover | 2.41 s | Condition 3 |
| **MAKE READY** | safety (check), charge, press check, port cover | 3.10 s | Condition 1 |
| **UNLOAD** | safety, magazine out to a pouch, lock back with the round caught, inspect the chamber, bolt release, safety, port cover | 5.00 s (5,050 ms lived) | Condition 4; the caught round returned to its magazine or pocket |
| **UNLOAD SHOW CLEAR** | safety, magazine out to a pouch, lock back, inspect the chamber, the observer's look (their Awareness, DC 6, dark +4), bolt release, **selector to semi**, function check into the clearing barrel, charge (to cock), safety, port cover | 7.90 s (7.89 of formula, the look at 1.0 s) | Condition 4, shown to a witness |
| **RELOAD** | speed (bolt locked on empty: drop, in, release), tactical (rounds left: a partial to a pouch, in) or retention (to the dump pouch, in, release); the panel picks by the belief, the player may choose | 2.53 / 3.22 / 2.99 s | |
| **IMMEDIATE ACTION** | tap, charge, observe | 1.57 s | clears a stovepipe or a dud; on a double feed the charge "won't go into battery", and it does nothing more |
| **REMEDIAL ACTION** | lock back, strip the magazine into the hand, rack it clear ×3, the magazine in, charge, observe | 6.05 s (5.75 and the look) | clears a double feed |
| **CEASE FIRE** | finger out, safety | 0.40 s | |

**As built in v0.0.5** (`src/sim/arms/drills.js` `MACROS`, `subsOf`, `macroMs`, `macrosFor`; `shooting.js`; the build sheet 0.0.5 §8 items 13, 14, §9 items 33 and 40, §10 items 45 to 49). The times above are one formula's, the sum of the sub-steps' times (§5.2) before any fumble, correcting this table's first 2.3, 2.7, 1.3 and 8 s. By tier, LOAD, MAKE READY, UNLOAD, IMMEDIATE ACTION and the speed reload take 3.66, 4.59, 7.36, 2.02 and 3.43 s at Weapon handling 3; 2.83, 3.61, 5.80, 1.73, 2.85 at 7; 1.93, 2.51, 4.05, 1.37, 2.13 at 15; 1.60, 2.10, 3.40, 1.22, 1.84 at 20; 1.18, 1.58, 2.56, 1.02, 1.45 at 30 (`drills` prints them all). In stop motion a step lives `ceil(Σ ms / 50)` ticks, each sub-step rounded to a whole millisecond (TIME §4.3): LOAD 2,450 ms, MAKE READY 3,150, **UNLOAD 5,050** (its seven sub-steps, 401 + 1,611 + 691 + 1,151 + 345 + 401 + 401, make 5,001, one tick past 5,000), SHOW CLEAR 7.90 s.
- **A macro halts on a failure that is not routine** (SKILLS §5.1: a routine natural 1 costs ×1.6 of its time and halts nothing; from the shoot house rework it is caught, a success at ×1.5, and a natural 1 a hand of 15 or more would make by 10 is caught at `danger` and `fire` too), and the rest of it is offered first in the panel ("Carry on: …", the step `queue`). `subsOf` skips only a magazine out with none believed in, and a lock back with the bolt believed locked on an empty or unsure chamber; the selector's and the port's checks always run.
- **SHOW CLEAR** puts the selector on semi before its function check (the build sheet's §8 item 14: the table had left it out) and ends with a charge to cock the hammer, then safe. It is offered only once the tower's current command is UNLOAD, SHOW CLEAR (the integrator's: it sat in the panel from the first second), and the tower's ◉ marks only the drill that completes its command (the fixer's: plain UNLOAD, marked too, never shows the rifle to the coach). **The observer speaks at the end of the look** (the integrator's): "Clear." on an empty chamber; "Hold. There's a round in it.", and the macro halts; a failed look says "Clear." whatever the truth, and the function check fires what is there (§6.6).
- **A look that finds a round changes the rest of the drill** (the fixer's): after the inspection sees one, or the coach's "Hold.", "Carry on" is the lock back and the inspection again (and the look again, for the show) before the rest; a missed inspection looks again; and a function check is never pulled with a round believed in (it stops there and says so).
- **REMEDIAL ACTION is its steps** (the design review's): `lockBack` (the double stays believed, the loose round in sight), `magOut:strip`, `rack` three times (the first, with no magazine under it, clears the jam and throws the loose round out), `magIn` (the same magazine, from the hand: a magazine in the hand is the first spare), `charge`, `observe`.
- **The hammer and the lever** (my call, the fixer's): the R-7's selector will not reach safe with the hammer down (`safeNeedsCocked`, as an AR's), which it is after a function check or a click. So with the hammer believed down a macro's first safe comes after its first step that cocks it (UNLOAD's lock back, MAKE READY's charge), or a charge goes before it (LOAD, CEASE FIRE); the panel strikes Safe "hammer down: charge first" and offers Charge first; the lever's refusal is felt before any roll, costing no time. **CEASE FIRE therefore charges**, which chambers a round from a magazine, as a marine with that lever must (open question 10).
- **As built in v0.0.6** (the build sheet 0.0.6 §9 item 30): **LOAD is safe, reach, seat, port**; **the RELOADs are out, reach, seat (and the release)**; REMEDIAL ACTION is unchanged (its `magIn` from the hand). Their times are §5.2's to the tick. **A reach whose weight surprises it halts the macro**, the rest queued as "Carry on". A RELOAD chosen while the line is hot is no longer the tower's `ahead` warning as well as one magazine a string's fault (§6.4: one act, one fault).
- **`conditionOf` ignores the port cover** (my call): a rifle with its cover open is in the condition its chamber, magazine and selector make.
- **Reloads by purpose** (COMBAT §25.6.5, from `test-pairs`; no id renamed): the panel names the RELOADs by what they are for and offers each first by the situation: **RELOAD** (`reload:speed`) with the bolt believed locked on empty; **Top up** (`reload:tactical`) in a lull, the magazine believed at half or less; **RELOAD, keep the empty** (`reload:retain`) with the bolt locked and nobody in sight. Never done unasked; the DI's lines offer them and T does them. From Weapon handling 15 a reload keeps the eyes up (COMBAT §25.4.2's heads down below it). A strict tactical reload (the fresh magazine to the support hand first, `magOut:hand`, from Weapon handling 12) comes later under its own id (my call).
- **As built in v0.0.8** (`src/sim/arms/specials.js` `reloadRows`, `halfOrLess`, `fullerAtHand`; the build sheet 0.0.8 §8 items 17, 18; COMBAT §25.6.5): the three are labelled by purpose everywhere (`RELOAD_LABELS`: RELOAD, Top up, RELOAD, keep the empty), ids unchanged; test-handling's panel says "Top up" where the tactical RELOAD read "RELOAD", and its course is unchanged to the tick. RELOAD at Weapon handling 4 / 10 / 15 / 19 / 30 / 42: 3.27 / 2.53 / 2.13 / 1.89 / 1.45 / 1.15 s; RELOAD, keep the empty 3.86 / 2.99 / 2.52 / 2.24 / 1.71 / 1.36 s. **RELOAD** leads with the bolt believed locked on an empty (on the bay of turners at the panel's head). **Top up** leads in a lull with the magazine believed at half or less **and a spare believed fuller at hand** (specials' call: a thirty loaded with ten is at a third, and "half" alone would lead with Top up on a full load). **Top up's named magazine**: when the session names one (`R.wantMag`, the pairs coach's two-round magazine; the drills' reach would never pick two rounds over ten), Top up's queue reaches for its pouch (`reach@p3`) and the row says so ("Top up: the two-round magazine, chest pouch 3"). **The spout**: on a course that says so (`COURSES.pairs.spoutTopUp`, the fixer's) Top up is offered with the magazine believed empty and a round chambered (the lull after the dry string); elsewhere, as on test-handling, the coach's "fire it" stands (§11).
- **The tower's short forms and the point named** (`courses.js` `short`, `handling.js` `standingCmd`; the user's reports of 2026-11-07, VIEWS §7.1): each tower command whose terms matter has a `short` that keeps them, for the radio box when it is full (the 25 m load "Five rounds, LOAD."; the zero "Three rounds, LOAD.", "Three rounds. Commence fire.", "Three rounds, RELOAD."; "Your dope for three hundred." and "two hundred."; the confirm's "Five rounds, LOAD." and "Five rounds slow, five minutes. Commence fire."; "Sitting, five rounds. LOAD."; "Ten rounds rapid, sixty seconds. Commence fire."; the walks "To the three hundred." and "Relay one, to the pits."); the others fall back to the nudge's words. **The reminder names the place you stand**: on the 25 m bay the lane ("Lane five, LOAD."), on the KD lines the point's stake number ("Point eleven, LOAD."), where v0.0.7 named the bay's lane on point 11. **At a timed string's limit the tower's "CEASE FIRE. Time." is the CEASE FIRE command itself**, said once and kept as the standing command until you are on safe (the range-cmd payload's `text`, kept as `R.cmd.text`); it had been said twice, the limit's words and then the sequence's own.
- **Designed 2026-11-11 (the user's note on v0.0.12: "Partner does nothing the tower asks for or at least doesn't animate doing it (show clear, load up, reload, get ready etc.)")**, to build in the shoot house rework (COMBAT §25.19.5): **the macros are everyone's**. A teammate on a line (the shoot house's #2 first) runs each tower command through the same macro on his own list doing, at the command plus his `goMs`, timed and rolled by his own Weapon handling, and the tower waits on him as on you; the instructor acknowledges each marine. **A Stop macro** (safe, finger off, low ready) answers the tower's Stop and the lane's end, one row in place of four. Where the P-12 is carried, LOAD and MAKE READY cover both guns (the rifle, then the pistol made ready and holstered on safe) and UNLOAD and SHOW CLEAR both (the pistol last), one macro each. `halfOrLess` counts the magazine's load, not its family's capacity (v0.0.12 read 10 of 30 as half or less, so Top up never left the panel's head).

**Weapons conditions** (US Marine Corps terms, adopted): **Condition 1** magazine in, round chambered, bolt closed, safe, port cover closed. **Condition 2** a hammer pistol carried chambered and decocked (the P-10, PA-21). **Condition 3** magazine in, chamber empty, bolt closed, safe. **Condition 4** no magazine, chamber empty, bolt closed, safe. `conditionOf(g)` derives it from the truth; the belief has its own.

**The ordered condition** is a standing order for an area (PLACES tags each area with a default; the chain of command overrides, PEOPLE §11): Base Melas everywhere Condition 4 except a firing line on a range and the guard's posts (Condition 3); a lander's couch (the Simoom's, SETTING §6.4) Condition 4 until "make ready" before the ramp opens; aboard ship Condition 4 except the ship's guard and a boarding party; Europa inside the wire Condition 3, outside it Condition 1. Carrying a weapon in a higher condition than ordered is an infraction when found: by inspection, by the armourer's check at the window, by a show-clear (PEOPLE §11.3).

**The Corps' four rules** (the US Marine Corps' weapon safety rules, adopted; SETTING may voice them, the drill instructor's instinct line quotes them): 1. Treat every weapon as if it were loaded. 2. Never point a weapon at anything you do not intend to shoot. 3. Keep your finger straight and off the trigger until you are ready to fire. 4. Keep the weapon on safe until you intend to fire.

### 5.4 The fumble ladder, and wrong beliefs

Tradecraft's ladder (`act()`), read through SKILLS' grades (§5.6 there):

| Grade | Margin | What happens |
|---|---|---|
| `miss` | −5 to −1, or a natural 1 that would otherwise pass | the action takes ×1.6; for actions that move the chamber or magazine (charge, lock back, magazine out, inspect), the belief of that part becomes `?` and the log says so: "Fumbled the lock: you're not sure the round came out." |
| `bad` | −9 to −6 | the gun, or the magazine for a magazine action, is dropped (§5.5); for **inspect**, you see what you expected: the belief becomes `empty` whatever the truth (the one silent failure, and only at this grade) |
| `disaster` | ≤ −10 (≤ −15 decocked: `DA_GUARD`) | if the gun is `ready()` (a round in the chamber, off safe or with no safety) and the action is one of draw, stow, safety, selector, check, magazine in, charge, release, it **fires** (§6.6); otherwise as `bad` |
| natural 1 | | **first, a catch** (SKILLS §5.1; designed 2026-11-11, to build in the shoot house rework): routine, or mastered (Weapon handling 15 and over, the step made by 10 without the die, not rushed, at any pressure), it succeeds at ×1.5 and the ladder is not read. Otherwise tradecraft's own die: with Weapon handling under 10, a drop 2 times in 5 (`NAT1_DROP`); under 5, a shot 2 times in 5 if ready (`NAT1_SHOT`); 10 and over, a `miss` |

So the ladder scales with skill, as the user asked (2026-11-03): a trained marine at DC 8 only misses on a natural 1; a recruit at 3 in the dark with cold hands (−4) can drop the rifle, and an untrained hand can fire it.

**How negligent discharges really happen** (my call, modelled on the real cause, a wrong belief about the chamber): a fumbled step leaves the belief at `?`, the log says so, and the player (or the NPC, by PEOPLE's `discipline` trait) either checks again or carries on. A function check or a careless trigger pull on a gun believed empty is what fires it. The macros make the right sequence one key; they halt on the fumble so the check is offered at once; the observer at UNLOAD SHOW CLEAR is the last net.

Negligent discharges per 10,000 UNLOAD SHOW CLEAR cycles, as built (the `nd` test, v0.0.5: the rules of this section with SKILLS §5.1's routine work, an observer at Awareness 14, "re-checks" meaning a `?` is checked again 90% of the time):

| Who, in what state | Observer, re-checks | Observer, never re-checks | Alone, re-checks | Alone, never re-checks |
|---|---|---|---|---|
| **At the range's pressure** (`evaluated`) | | | | |
| recruit (3), rested, in the light | 0 | 2 | 1 | 61 |
| recruit (3), exhausted, cold hands, in the dark | 53 | 92 | 915 | 1,648 |
| private (10), rested, in the light | 0 | 0 | 0 | 0 |
| private (10), exhausted, cold hands, in the dark | 0 | 21 | 24 | 300 |
| sergeant (18), rested, in the light | 0 | 0 | 0 | 0 |
| sergeant (18), exhausted, cold hands, in the dark | 0 | 0 | 0 | 0 |
| **At `danger`**, where no work is routine | | | | |
| private (10), rested, in the light | 0 | 1 | 0 | 26 |
| sergeant (18), rested, in the light | 0 | 2 | 0 | 20 |
| sergeant (18), exhausted, cold hands, in the dark | 0 | 2 | 1 | 20 |

This replaces the first table, computed before routine work by a model this section did not give, which the rules as built cannot reproduce: the `nd` test prints its grid and holds the model's shape rather than ±20% of it. Two things part them. **Routine work**: on the range a private or a sergeant in good conditions never fumbles, so never fires one; at `danger` their naturals bite again. **The bad inspection's silence**: no re-check catches it, because the holder sees no `?`, so re-checking helps an exhausted recruit in the dark far less than the first table assumed. The shape holds: the observer and the re-check each lower the rate, an exhausted recruit alone in the dark who never re-checks fires one cycle in six, and the observer cuts that to about one in a hundred (open question 11).

**As built in v0.0.5** (`firearms.js` `act()`): **a missed lock back leaves a live round in the chamber** (the extractor slipped off its rim, a failure to extract: "you're not sure the round came out", because it didn't), which is how the grid's discharges happen; **the bad inspection is logged hidden** (SKILLS §5.14: J and the toasts leave it out) and halts nothing, so the macro carries on as if the chamber were empty.

**As built in v0.0.9: a slipped thumb leaves the lever where it was** (`firearms.js` `act().slipped`; the user, 2026-11-07, "likely to fail simple actions like thumbing safety off", read literally; my call, after the integrator and the three reviews found that a graded `miss` still took the safe off): a failure that bites on a selector move (Safe, Off safe, Auto) leaves the lever where it was: the slow time (×1.6), the chain halted, "Your thumb slipped off the lever: still on safe."; a `bad` or worse as before (the rifle onto its sling). The paper's "OFF SAFE ✗" and the card's "1 failed" therefore stand beside a rifle still on safe. Calm test-pairs and test-handling equal to the tick (a natural 1 on a selector at Weapon handling 10 and over, a `miss`, now leaves the lever as it was too).
- **Open question for WEAPONS** (the lead's to settle): does a fumbled (`miss`) Off safe leave the lever on safe? Built so as the user's words read; the other reading (the safe comes off, slowly) is the v0.0.8 behaviour.

Checking is what makes a trained marine safe; skill only makes the check cheap.

### 5.5 Dropping things in each gravity

| Gravity | A dropped pistol or magazine | A dropped long gun |
|---|---|---|
| ≥ 0.3 g (Mars, a ship at thrust) | falls in 0.5 s (Earth) to 0.8 s (Mars); on the ground at your feet; magazine wear −0.04 on hard ground | swings on its sling (two-point): 1.0 s to recover, no wear; with no sling, as a pistol |
| 0.05 to 0.3 g (Europa, Callisto) | falls slowly (1.4 s from waist height on Europa) and can be caught: a Weapon handling roll at DC 8 as a reflex, if you have a free hand; "never grab for a falling gun" (tradecraft's range rule) holds for a gun with a round chambered, and the reflex card says so | as above |
| free fall | floats off at 0.2 to 0.5 m/s in the direction of the fumble; `retrieve` within 0.9 m (1.0 s, DC 8); beyond, it drifts until a surface or a crewmate | on its tether: it swings and returns; untethered, as a pistol |
| EVA | untethered, it is gone unless a push-off catches it (Zero-g, COMBAT); the armoury's lost-weapon rules apply (§10.6) | tethered by Corps rule |

Picking a gun up off the floor is `pickup` (1.0 s, no roll; a gun lying in regolith gains `dust` +0.05, a magazine +0.1).

---

## 6. Carry postures and the muzzle

### 6.1 The postures

The muzzle's direction is the holder's heading plus the posture's yaw and pitch (tradecraft had only the heading). VIEWS draws each posture (its frame sets); PEOPLE reads it ("An NPC who sees you within 15 m knows your weapon's visible state … and its muzzle direction"). Times are base seconds at value 10 to bring the gun to an aim from that posture (added to the aim, §7.1).

| Posture | Muzzle yaw, pitch | Muzzle height (standing) | Cone half-angle | Cone reaches | To an aim from it | Habit DC (§6.3) | Hands | What it says to those who see it |
|---|---|---|---|---|---|---|---|---|
| `racked` / `cased` | | | none | | | | | nothing: in the armoury or a locker |
| `holstered` (pistol) | 0°, −90° | hip | none (into the floor) | | the draw | never rolled | 0 | routine; a thigh holster seated in a couch points level: cone 10°, 1.5 m |
| `slungBack` | 180°, +60° (muzzle up) or −60° | 1.5 m | 15° | 0.5 m, and along a ladder | the `up` step (2.5 s) | 2 | 0 | routine, off duty |
| `slungFront` (hanging on the two-point sling) | 0°, −75° | 1.0 m | 15° | 0.6 m (the feet ahead) | `up` 1.0 s | 4 | 0 | routine; hands free |
| `sul` (muzzle straight down by the leg, for moving among friends) | 0°, −90° | 0.4 m | 10° | 0.1 m | 0.5 s | 4 | 1 | careful, trained |
| `patrol` (muzzle down 45°, off to the support side, finger off) | −20°, −45° | 1.2 m | 12° | 1.5 m | 0.35 s | 8 | 2 | alert; on base, odd outside a range or a post |
| `lowReady` (stock in the shoulder, muzzle at the ground ahead) | 0°, −40° | 1.25 m | 8° | 1.8 m | 0.15 s | 10 | 2 | ready to shoot; threatening to civilians (COMBAT's escalation of force) |
| `highReady` (muzzle up) | 0°, +45° | 1.45 m | 8° | 0.6 m (a face close ahead), and the deck above in a trunk or stairwell | 0.15 s | 8 | 2 | ready; used in stacks and on ladders going down |
| `aimed` | 0°, 0° (at the target) | 1.4 m | 3° | the target's range, to the first wall | 0 | no roll: the player aimed | 2 | pointing a weapon at someone |

- The cone's reach for a downward muzzle is where its line meets the floor: `h / tan(|pitch|)`, plus a body's radius.
- A person is **in the cone** if their body (a 0.25 m circle) overlaps the cone in plan **and** the muzzle line's height there lies within their body's span (standing 0 to 1.75 m, crouched 0 to 1.0 m, prone 0 to 0.4 m; tradecraft's cover spans). So a low ready flags shins within 1.8 m, a high ready flags a face only within 0.6 m, a slung-front rifle flags only toes.
- **Ladders and trunks** (PLACES's vertical links): on a ladder the muzzle's "ahead" is along the ladder. A rifle slung on the back muzzle up points at whoever climbs above; muzzle down, at whoever is below. The Corps' ladder rule (my call): sling muzzle down going up, and muzzle up going down, so the muzzle points away from the climber who follows.
- **Couches and racks**: strapped into a lander's couch the rifle stands muzzle down between the knees (`couched`: cone 10°, 0.2 m), Condition 4 until "make ready" (§5.3).
- **Movement stances** (the user, 2026-11-06; DESIGN.md's log): Relaxed, Combat and Assault set the posture a marine moves in (Relaxed slung or patrol, Combat low ready, Assault shouldered) and the moving-shooter modifier (§7.3): Combat acquires and engages on the move, Assault gives no accurate fire but suppression on the move and close-quarters shooting eased by experience. Built with the first scene that moves and shoots (0.1.x); V then cycles the stances and the fine postures move to V held.
- **Outside the weapon mode** the V key cycles the safe postures (slung back, slung front, patrol; VIEWS §10.1), and a hold offers all of them on digits. Changing posture is a roll (DC 3 to 4) that raises a toast only if it fails; like every habit roll it is written in full to J under the `habit` filter (pillar 3: "every roll can be read in the log"; SKILLS §5.14: "The player's own rolls are always logged in full"). **G** (weapon ready) goes to low ready and enters stop motion: intent (VIEWS, TIME).
- **As built in v0.0.5** (`src/sim/arms/carry.js` `POSTURES`, `muzzleOf`): the five postures with this table's yaw, pitch, height, half-angle and reach, and each its **drawn muzzle tip** (my calls, from a 92 cm rifle held as each posture holds it: metres ahead along the heading, height standing): slung back −0.15 m, 1.75 m; slung front 0.25, 0.55; low ready 0.70, 0.77; high ready 0.45, 1.85; aimed 0.90, 1.40, heights × `STANCE_H` (kneeling 0.68, prone 0.2). The tip is the flash's, the sound's and a discharge's start. The heading is `actor.headRad` in the weapon mode, else the facing. The chibi holds its rifle lower and draws it longer than a full-size body, so the stage draws the flash at its own drawn muzzle, not this point (VIEWS §3.6).

### 6.2 What carries where

| Place | Default posture the Corps expects (my call; PEOPLE's orders) | Condition (§5.3) |
|---|---|---|
| Base Melas, walking between buildings with a rifle drawn for training | slung back or front | 4 |
| the squad bay, the chow hall, the head | none: rifles are in the armoury; in the field, slung | 4 |
| the armoury line and the clearing barrel | Sul, then into the barrel | 4 |
| a range, behind the line | slung, bolt locked open with the flag inserted | 4 |
| a range, on the line | as the course of fire orders | as ordered |
| a guard post | patrol or slung front | 3 |
| a lander's couch | couched | 4 |
| aboard ship, moving | slung front, or Sul in passageways | 4 |
| a boarding stack, a breach | high or low ready by the stack's place (COMBAT) | 1 |
| Europa, inside the wire | slung front | 3 |
| Europa, a patrol in a town | patrol; low ready only on a threat (COMBAT's escalation of force) | 1 |

### 6.3 The habit check, and being flagged

The player chooses the posture and where to walk; the character's trained habit decides whether the muzzle stays off people (pillar 3: the player decides what to try, skill and dice decide execution). A habit is not a test passed afresh every few seconds, and a trained one does not fail on a die the character cannot influence, so the check (revised after the review, my calls) rolls **once per approach**, is **automatic** when it cannot fail, and lets **naturals decide nothing**. The algorithm (`carry.js`, live area only, 20 Hz):

```
for each armed person A in the live area whose gun is in hand or slung (not racked, holstered, cased):
  cone = muzzleCone(A)                                   (posture, heading, height: §6.1)
  for each person B within cone.reach + 0.5 m (spatial hash), B not A's target in the weapon mode:
    if B would be in the cone this tick or the next (A's turn rate and B's velocity, one tick ahead):
      if no approach record (A, B) is open:
        open it; dc = HABIT_DC[posture] + context; v = A's Weapon handling with its modifiers
        if dc ≤ v + 1: automatic (the d20's 1 would still pass): the muzzle indexes away; no roll
        else roll d20 + v against dc, naturals counting only as their numbers:
          success: A's muzzle indexes away from B (up to 30° off, as VIEWS draws it) until the approach ends
          failure by 1 or 2, and v + 10 ≥ dc (A passes on an average roll): a NEAR MISS: the muzzle
            drifts onto B for a moment and A sees it and fixes it; no flag, no event
          any other failure: the muzzle stays; if B stays in the cone for FLAG_MS 300 ms, emit flag(A, B)
      the approach stays open while B stays within 3 m of A, however long (a queue, a row of couches,
        a stack); it closes when B leaves 3 m, or when A changes to a posture with a higher habit DC
        (a fresh decision, so a fresh roll)
    if A is aimed (the weapon mode) and B is in the cone: no roll; emit point(A, B) after 300 ms
    if A's aim turn (an aim step) sweeps across B within 50 m: one roll at DC 12 to lift over, by the same
      rules (automatic, near miss, flag)
```

**Context** on the habit DC (my calls): a crowd (3 or more people within 3 m) +2; turning faster than 90°/s +2; on a ladder or stairs +3; through a hatch or door +2; (the 'pressure `fire` +2' was retired in v0.0.9 with `FIRE_DC`: it was never applied, and the chaos reaches the habit through the roller's felt entry, COMBAT §5.3); BODY's "frayed" (stress 75 or more) gives its −1 on hands (BODY §9.1 names WEAPONS as the reader). Needs and the body add to `v` as always. Naturals deciding nothing is a rule of this check, like SKILLS §5.1's opposed rolls ("If naturals won outright, every contest would fail at least one time in ten whatever the skills").

**Per approach** [computed from the d20 odds; near misses / flags]:

| Marine (Weapon handling) | low ready, rested (DC 10) | low ready in a crowd (DC 12) | low ready in a crowd, exhausted (DC 12, −3) | slung front in a crowd (DC 6) |
|---|---|---|---|---|
| recruit, 4 | 10% / 15% | 10% / 25% | 0 / 50% (an average roll fails: every failure flags) | 5% / 0 |
| private, 10 | automatic | 5% / 0 | 10% / 10% | automatic |
| sergeant, 18 | automatic | automatic | automatic | automatic |

**Per hour in a FOB chow queue** (Europa inside the wire, Condition 3; my estimate of crossings: the queue's neighbours are one approach each for the whole queue, and passers with trays cross a low ready's 1.8 m cone about 30 times an hour and a slung muzzle's 0.6 m cone about 6 times) [computed]:

| Weapon handling | slung front: near misses / flags an hour | low ready: near misses / flags an hour |
|---|---|---|
| 4 (a recruit) | 0.3 / 0 | 3 / **7.5** |
| 10 (a private) | 0 / 0 | 1.5 / 0 |
| 18 (a sergeant) | 0 / 0 | 0 / 0 |

So the Corps' slung-front rule inside the wire is safe for anyone trained, all day; a recruit who carries at low ready through a crowd flags several people an hour, which is the lesson; and an exhausted private at low ready in a crowd flags about one approach in ten. Posture is the decision; the habit is the execution.

**What the player sees** (pillar 3, SKILLS §5.14): the habit's rolls raise no toast (they would bury the screen in a queue), but every one is written to J under a `habit` filter, **collapsed per approach**: "Muzzle past Diaz (slung front, crowd): automatic." "Muzzle past Okafor (low ready, crowd): Weapon handling 6 + 4 = 10 against 12, a near miss: your muzzle drifted toward his boots. You fixed it." A near miss is a line of the instinct (T) as well as a log line, so the lesson lands without a discipline event. A flag is a toast, because someone else saw it.

**What a flag does** (PEOPLE §7.5 and §11.3 own the consequences): a weight-1 event for the one flagged, fear +1, a bark ("Watch your muzzle!"), from an NCO an on-the-spot correction or corrective training; severity 1, 2 if repeated within 30 sols. A near miss is nothing to anyone else: the other person did not see it (it lasted under `FLAG_MS`). **Pointing** (aimed at someone not a target) is an event of its own, which I propose at severity 2, and 3 if the gun was in Condition 1 (PEOPLE decides). NPCs run the same check with their own skill and the same rules, so trained NPCs never flag each other in a queue, recruits and the exhausted sometimes do, and the player can call it out (F: "Watch your muzzle").

**As built in v0.0.5** (`carry.js` `habitStep`, in the fast `rules` layer; the approach records on `kit.carry.near`, saved; the rolls on their own stream, `rngOf('habit')`): the algorithm above with the crowd's +2 (three or more within 3 m) and fire's +2; the stairs, hatch and turn-rate terms wait for their places. **The habit runs for slung rifles too**, and at the slung postures' DCs (2 and 4) it is automatic for anyone trained. A flag, a near miss and a point are `muzzle` facts (CONTRACTS §11); PEOPLE's consequences wait for its events, so on the range a flag is the coach's word (§6.4).

**As built in v0.0.13** (the fixer's, 2026-11-11, my call): a muzzle at low ready over a teammate is no flag in the shoot house, joining high ready (`carry.js` `SWEEP_SAFE`, `flagsAt`; the user's "goes low ready when sweeping their partner (which is good)"). **Designed 2026-11-11 (the user's note on v0.0.12)**: the house's flag becomes one helper, the muzzle's 3-D line against the teammate as a capsule (COMBAT §25.19.3.5), and a moving marine's hands drop to low ready while his line would cross a teammate (the crossing rule). **As built in v0.0.12**: a teammate's muzzle habit is checked but never logged in the player's second person ("Muzzle past Pvt Nyberg", yourself, by your #2's rifle was the bug); the house's flag is COMBAT §25.10.4's.

### 6.4 Range safety (tradecraft's, kept)

On a firing line the range safety officer's rules are tradecraft's `scenarios/range.js` `safety()`, checked every tick while a gun is in hand: more than `WARN_DEG` 60° off downrange is a warning (again at most every `WARN_AGAIN_S` 20 s); more than `UPRANGE_DEG` 100°, or aimed at any person, is **"Cease fire!"** and you are off the line; aiming at another lane's target is a warning and firing at it is off the line; off the line with a round chambered is a warning and after `OUT_GRACE_S` 8 s off the line. A dropped weapon on the line is left where it fell and the line goes cold ("Never grab for a falling gun").

**As built in v0.0.5** (`carry.js` `rangeSafety`, a pure verdict; `src/sim/scenarios/handling.js` `rangeRules`, which feeds it this tick's facts and turns its verdict into the coach's word, a fault or the stop; the build sheet 0.0.5 §8 item 18): tradecraft's rules with three of the Corps' (my calls), each a warning (the coach's word and a fault, again no sooner than `WARN_AGAIN_S` 20 s for its rule) or the stop:
- in hand and over `WARN_DEG` 60° off downrange, a warning; over `UPRANGE_DEG` 100°, the stop, **loaded or not** (the Corps' Rule 1: treat every weapon as if it were loaded);
- aimed at a person, the stop, from the moment the aim is chosen (the faulty bot that aims at the coach is stopped for the person, before its muzzle swings uprange); another lane's card aimed, a warning, fired at, the stop;
- off the firing point's box (fp.x − 1.4 to + 2.2, fp.z ± 1.0) with the rifle in hand, a warning at once, and after 8 s of lived time the stop;
- **the Corps' three**: a shot on a cold line, a warning, a second the stop; a command acted on before the tower gave it, a warning ("Wait for the tower."); the finger on the trigger while moving or changing posture or stance, a warning;
- flagging the coach, a warning; a negligent discharge, the stop.

The stop is "Cease fire! Cease fire!", the coach taking the rifle, and the end of the scene. **Range safety never checks a slung rifle** (my reading of "a slung rifle never checked"). **On the line with the rifle in the hands the walking keys strafe** without turning you (my call, the fixer's: a 120 ms tap of S had turned the muzzle 90°, a tap of Q 180°), the muzzle held downrange as the Corps holds it; slung, they turn you as anywhere. **A move key in stop motion is not moving** for the finger rule (Q and D step the brackets there): a move counts only when the feet are free.

**As built in v0.0.6: one magazine a string** (`handling.js` `magSeated`, `oneMagWarn`, `spoutCheck`; the build sheet 0.0.6 §9 item 29; the user's report, 2026-11-07: "I shoot two prone, two kneeling and when I have to shoot standing, I don't have any mags left"; DESIGN.md's log, my calls on the words). A Corps rule of the line: **the magazine in the rifle at a string's commence fire, or the first seated during it, is the string's** (`R.strMag`); seating another before the tower's RELOAD is a **fault `onemag`** on the card each time, the coach saying "One magazine a string. You reload on the tower's word." the first time. **The step that would do it is marked, never struck** (amber, "! one magazine a string": COMBAT §3, VIEWS §7.4), so the choice stays the player's; REMEDIAL ACTION, which strips the rifle's own magazine and seats it again, is never marked. A RELOAD chosen while the line is hot is one act and one fault, no longer the `ahead` warning too. **The coach speaks before the change when one is still up the spout**: a magazine check reading "0 in the magazine" with a live round chambered, or a magazine about to come out so (a reach or a magazine out), in a hot string, draws "You've one left up the spout. Fire it." once a string (the user's run began there). **A string fired with more than its rounds is remarked on, never praised** (`COACH.string.over`, `R.over`, the summary's `over`): "Ten rounds in a five-round string. Five a string, on the tower's word." where v0.0.5 said "All ten on the paper. Same again.", and the end card says "1 string over-fired". **A magazine of another kind than the course's** (`kindWarn`, `COACH.kind`): Magazine in with a tracer looked at in the hand is marked "! tracer: the course is ball", and seated the coach says once "That's your tracer. The course is ball: change it before you fire." (no fault).

**As built in v0.0.7: range safety in full on the KD** (`src/sim/scenarios/range.js` `safety()`, a rules layer after `handling.js` `rangeRules`, which keeps v0.0.5's verdicts on the line's own box; the build sheet 0.0.7 §2.3; my calls):
- **the cold line**: the tower's line cold and a rifle in the hands off safe or the finger in, a warning once `COLD_GRACE_MS` 6 s have passed since the command (the shooter answering CEASE FIRE); a round fired on it, v0.0.5's warning, then the stop;
- **forward of the line** while it is hot: anyone past the firing line's front is the stop ("Cease fire! Get back behind the line!"); the pits behind the parapet never count;
- **the muzzle over people**: flagging any neighbour or the coach, a warning; aimed at one, v0.0.5's stop;
- **cease fire**: the tower's, and **the tower's CEASE FIRE on any ND**, every rifle on safe, the relay's too (900 relay shots over 12 seeds: none on a cold line, none forward, all on safe after CEASE FIRE);
- an ND that hits nobody stops you as v0.0.5's did; one that hits someone is the casualty on the line (§6.6).

**One map of a rule's words** (`handling.js` `STOP_WORDS`, `stopWords`; the fixer's): the toast's "Stopped: aimed at a person" and the end card read the same words ("a round on a cold line", "forward of the line", "the muzzle over a neighbour", "a casualty on the line" and the rest), never a rule's id. **The step panel marks Fire** ("!", never struck: COMBAT §3) on a cold line and with the aim on a person, so the choice stays the player's and the rule is said before the pull. **The one-magazine mark is skipped while a written change is left** in the string (`oneMagWarn`: the 200 m string's second magazine, §11.1).

**As built in v0.0.8: the line's wait counts only the time it waits on you** (`range.js` `kdWaitOnYou`, `R.onYouMs`; the user's report, 2026-11-07: "got a fault for making tower wait when everyone was waiting ?"; the move-on rule is my call, TIME for the lived second). On the KD course the 30 s reminder and the 60 s move-on with its "slow" fault count only the lived time the line waits on you alone: the command is yours, your readiness for it is not met, the relay's is, no timed string is being fired, no splash, activity or casualty holds the line, and nothing is posted next. A timed string (the confirm's five minutes, the 200 m's sixty seconds) ends only at the tower's CEASE FIRE at its limit; the pits' marks are the range's to wait for. The walks are the tower's own and pass with no fault (`R.livedMs`, as before). v0.0.7 counted every lived second since the command: in the 200 m string the move-on, counting whole seconds from a command given between two, reached 60 s before the string's limit and faulted anyone who used it; the confirm's slow fire was cut at 60 s with a "slow" fault and a CEASE FIRE while the shooter waited on the pits; and the relay's lag was counted to you. The 25 m course (`fam25`) keeps v0.0.6's count. SKILLS §14.4 has what the DI says to a shooter the line has moved on without.


### 6.5 Muzzle discipline when a gun goes off unasked

Tradecraft's `muzzleSafe(WH) = clamp((WH − 4)/24, 0, 0.97)` was the chance a discharging gun pointed somewhere safe. OLYMPUS has the posture, so the discharge goes **along the posture's muzzle line**, spread by `DISCHARGE_SPREAD 0.5 rad × (1 − muzzleSafe(WH))` (a trained hand keeps the line where the posture puts it). Drawing or stowing a pistol keeps tradecraft's `SELF_SHOT` (draw 0.35, stow 0.45: into your own leg); bringing a long gun up or down, 0.1 (a foot). Then the round flies its path (§7.7) and hits whatever is on it: the floor, a bulkhead, a pipe, a person.

**As built in v0.0.5** (`carry.js` `ndOf`; the build sheet 0.0.5 §8 item 19): the round goes along the posture's line, spread as above on a stream of its own (the gun's and its round count's), into the ground where a downward line meets it, into the range's berm, or past. **A function check's discharge follows the aimed, level, unspread line** (`ND_POSTURE`, `ND_STEADY`: the check is pulled shouldered and deliberately, so no fumble's flinch spreads it), into the berm. There is no path through the world yet (0.0.7's `penetrate.js`): no `SELF_SHOT`, and a line through a person passes them.

**As built in v0.0.7** (`carry.js` `ndOf`, `penetrate.js` `traceRound`; the build sheet 0.0.7 §8 item 17): the line is traced through the world (`traceRound(state, { shooterId, from, yawRad, pitchRad, cal, load, barrelMm, env, rngKey, nd: true, shotId })`, stopped by the berm, the ground, the parapet or a body, or past), and **a long gun brought up or down puts `SELF_SHOT_LONG` 0.1 of its NDs into the shooter's own foot**. A body's height is counted from the ground it stands on (`actor.y`), with a span by stance (`SPAN_M`: standing 0 to 1.75 m, kneeling 1.0, sitting 1.1, prone and down 0.4), so the pullers 2.5 m down in the pits are under the parapet's shield. Each hit is a §8.7 record (`hitOf`) for BODY's `applyHit`.

### 6.6 Negligent discharges

Every discharge not from an aimed trigger pull in the weapon mode is a **negligent discharge** (ND). It is a graded event (`nd`, on PEOPLE's event ring) with in-world results; PEOPLE owns the consequences ladder and CAREER the record (my proposal for the grading):

| Grade | What happened | PEOPLE severity | What follows in the world |
|---|---|---|---|
| ND-1 | into a clearing barrel, a range berm, a sandbagged pit: nobody endangered | 2 | "Cease fire"; the weapon goes to the armourer for inspection (reissued next sol at the earliest); a written statement (a lived scene, about 5 min, PEOPLE's conversation); a 2 h remedial weapons class |
| ND-2 | into the floor, the ground or a wall off a range, nobody in the cone | 2 | as ND-1, and a damage report; the round is missing from the count (§10.4) |
| ND-3 | someone was in the cone or within 1.5 m of the round's path, or it holed a pressure boundary (§8.6) | 3 | as ND-2; the platoon's story by the third sol (PEOPLE §9: weight 3) |
| ND-4 | someone hit | 3, and "someone hurt in training" (weight 4) | the casualty is BODY's and COMBAT's; an investigation; NJP or court-martial by PEOPLE's rung |
| ND-5 | someone killed | court-martial (PEOPLE) | the memorial (CAREER) |

Everyone in earshot gets TIME's reflex card for a shot in the room (get down, nothing). On a ship it is also the ship's event: a hole in a pressure wall is a damage-control job (PLACES) and the Navy's opinion of marines (PEOPLE's gauges). CAREER's composite takes its −10.

**As built in v0.0.5** (`ndOf`, the `nd` fact; the build sheet 0.0.5 §8 item 19): ND-1 to ND-3 only. Into the berm or the ground ahead of the firing line, **ND-1** (a function check's discharge is ND-1, into the berm); someone in the cone or within `ND_NEAR_M` 1.5 m of the round's path, **ND-3**, and the round passes them, since no wound can land before 0.0.7; **a line uprange is ND-3** (the ready line and the tower are there); anything else ND-2. Never ND-4 this round. On the range any ND stops the line (§6.4), **but on the pairs course** (from v0.0.8, the fixer's, `handling.js` rangeRules, `PAIRS_COACH.nd`) **an ND-1 is a fault** and the line carries on ("Cease fire! That went into the berm."; 3 of 20 boot-recruit runs in review had ended "Stopped: a negligent discharge" before the steel); ND-2 and worse still stop it; the round counts in the issue as fired and its case is thrown as a shot's is. PEOPLE's and CAREER's consequences wait for their rounds.

**As built in v0.0.7: ND-4 and ND-5** (`range.js`, BODY's `wounds.js`; the build sheet 0.0.7 §8 item 15, the fixer's items 31 to 33). **The grade follows the hits** (`gradeOfHits`): someone wounded is ND-4, someone killed ND-5, said in an `nd` fact with `during: 'graded'` when the grade moves past the line's first word. An ND that hits someone is **the casualty on the line**: the RO's CEASE FIRE, the relay on safe, the coach takes the shooter's rifle (the chambered round he clears goes back with the rest, and a forced ND cycles the action as a real one does), the corpsman runs to the casualty and works `CARE_EDGE_S` 20 s beside them in sight (`careOf`: a tourniquet on a limb, a pressed dressing elsewhere), then the `kd-casualty` splash of `EVAC_MIN` 12 minutes decides stabilised, evacuated or dead (`casualtyOutcome`, **run from the evacuation's start**, `C.evacAtMs`, with the card's blood the body's at the splash's end). **Everyone one round hits is cared for**, and "The range is closed."; the course goes on to UNLOAD, SHOW CLEAR, the declaration and the card with the incident. **The player is the casualty of record whenever they are among the hits**, wherever they stood on the round's line; then the splash carries them to the card and the session ends in phase `closed`. `forceNd(state, bus, { pid, toward, y })` is the tests' and the debug handle's ND (`__olympus.range().nd(who)`), graded and answered as any.

---

## 7. The shot

### 7.1 The weapon mode

Tradecraft's stop motion, kept as the user asked ("Shooting should play as in Tradecraft", 2026-11-05). TIME owns the clock rules of stop motion; COMBAT owns the fight's flow; this is what the weapon does in it.

- **G** is intent: it enters the mode with the first step of readying (a draw, or `up` from a sling). **X** toggles the mode (VIEWS §10).
- **The step panel** (digits) lists, in this order: Fire (greyed with its reason until there is an aim and a ready gun: "aim first", "on safe", "nothing in the chamber"), Aim at the bracketed target (with its time), then `canDo()`'s actions in tradecraft's order with each one's time and odds where they matter, then the macros (§5.3), position (A and W, VIEWS), posture (V), the light (N), cover (X). Each step names the skill it rolls (SKILLS §2.1: Weapon handling for handling, Marksmanship for the shot).
- **Targets** are people and things the character perceives (PEOPLE's perception) and the picture shows: in the stage's frame (40 × 22.5 m, VIEWS) or in VIEWS's **far window** on a far point looked at. Nothing not shown can be aimed at (the user, tradecraft 2026-11-03: "we should only be able to aim at things in the current frame").
- **The aim** is a Weapon handling step (the mount and the turn): `aimS = 0.6 × pace × kind.sight × optic.sight + turn° / ((90 + 6 × WH) × kind.turn) + (turn > arc ? 0.4 × pace : 0) + posture.toAim × pace`, with `arc = min(100°, 30° + 2° × WH)` (tradecraft's `AIM`).
- **No aim, no shot** (the user, 2026-11-03).
- **A held aim** steadies at `2 + Marksmanship/10` points a second, up to +4 (tradecraft's +3 a second to +4, with the rate given to Marksmanship as SKILLS §2.1 assigns it). A step that takes the hands off the aim (magazine, charge, release, clear, safety) resets it to settle after the step (tradecraft).
- **Feet**: the mode holds the feet (tradecraft). Stance changes are steps. A shot row may carry the feet along a move that was running when the pause came ("…, moving", COMBAT §25.6.1), each round with the moving shooter's modifier by stance (§7.3, COMBAT §25.9); its planted form brakes first.

**As built in v0.0.5** (`src/sim/arms/shooting.js`: `enterStop`, `stepsOf`, `chooseStep`; the build sheet 0.0.5 §2.2, §8 items 15 and 16, §9 item 34; TIME §4.3 for the clock):
- **The panel** (`stepsOf`, TECH §2.6's `options()`): Fire, Aim at the bracketed card or Hold the aim (time taken, to +4: a step of its own), the Corps' commands (a halted macro's rest first, as "Carry on: …"; the tower's current command marked), the singles the belief allows, **the selector first among them** (the integrator's: canDo's order, tradecraft's, had put Off safe behind the magazine's five at every commence fire; `canDo` itself is unchanged), the stances, the postures, Wait for the tower. Fire is struck with its reason as the holder believes it: "aim first", "on safe", "chamber empty", "a stoppage". Each step names its skill, its time at the normal tempo and its odds ("routine" for a roll the trained never miss). Step ids: `fire`, `aim`, `hold`, `macro:<id>`, `queue` (the halted macro's rest), the actions of §5.2, `stance:<stand|kneel|prone>`, `wait`, `leave`, and the answers `pick:-1`, `pick:+1` (the brackets, no time) and `reflex:<key>`.
- **Tempo by the keys**: a digit tapped is the normal tempo, with Shift rushed (×0.6, −3, never routine, where rushable), held careful (×1.5, +2, where careful); **Fire held is hold and fire**, the hold to +4 and then the pull, one step.
- **The chained wait**: a step that completes the tower's current command runs on as a wait until the tower's next command (at most 15 s); any step chosen, X included, cuts it.
- **The held aim**: +round(min(4, heldS × (2 + MRK/10))), the hold step timed to the exact 4/rate, 1,334 ms of formula and 1,350 lived at Marksmanship 10 (the modifier, tradecraft's rounding, already reads +4 from 1.17 s). **Only the hands' work on the rifle resets it** (`HANDS_OFF`, tradecraft's list; the parity review's, where every step had reset it): a magazine out or in, a charge, a rack, the bolt release, a lock back, a clear, a press check or a magazine check, a tap, an inspection, the show, a function check. The selector, the port cover, a look at the port and the finger keep it.
- **Follow-ups**: Fire again inside a shot's recovery is a follow-up at the same aim (tradecraft's tap: `TAP_SPLIT_S` 0.25 s, a double from Marksmanship 8, a triple from 18); none on a bolt believed locked back, a chamber believed empty or a stoppage (the code review's: a tap after a string's last round had pulled on the locked bolt). **Retired in v0.0.8** for the shot rows (Pair, Hammer, Triple, Failure drill, To the head) chosen while time stands still (the user, 2026-11-07: "All good defaults"; COMBAT §25.6.4): `tap()` is removed, Fire pressed during a fire step is 'busy', and a step record keeps `taps: 0`; `tapsOf`, `TAP_SKILL` and `climbOf` stay as the rows' gates.
- **Targets** (`targetsOf`) are the range's cards (`paper:<lane>`, left to right) and the people in the frame the camera would show while bracketing each (VIEWS §2.4's weapon-mode lead), so the card at 25 m is aimable from the line at 16 px/m. The mode ends by X while choosing or from the chained wait, by Sling it, or at the scene's end, which slings the rifle.

### 7.2 The DC

```
DC = SHOT_DC0 6 + kind.baseDC + model.accDC + rangeDC(d) + partDC + targetDC
rangeDC(d) = round(5 × log2(max(d, 10 m) / 10 m))
```

- `SHOT_DC0` 6 is tradecraft's `SHOT.dc`.
- **The range term** is logarithmic (my call). Tradecraft's `perM × d + perM2 × d²` saturated at 95% inside 25 m for a trained pistol and fell to a natural 20 past 50 m with a carbine (tradecraft-sim-combat.md §3.3). A target's angular size halves with each doubling of range, and for a round Gaussian group the chance of a hit falls from 95% to 5% over about a factor of 8 in range; 5 DC points a doubling spreads the d20's 18 useful points over a factor of 12, slightly gentler than pure dispersion because some error is fixed (my call). So no shooter is either always sure or always lost across 0 to 600 m, and every doubling of range costs the same in the log.

| Range | ≤ 10 m | 15 m | 25 m | 50 m | 100 m | 200 m | 300 m | 400 m | 500 m | 600 m | 800 m | 1,000 m |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `rangeDC` | 0 | +3 | +7 | +12 | +17 | +22 | +25 | +27 | +28 | +30 | +32 | +33 |

- **Parts** (`partDC`): torso 0, head +6, legs +3 (tradecraft's `PART_DC`); a thing lying about +4; a visor slit +10 (my call).
- **Targets** (`targetDC`): a paper target's own (§11.1, §11.2); 0 for people.

### 7.3 Every modifier

Each is `{ why, v, src }` in SKILLS' order. The plaque's odds and the roll use the same list of modifiers (fixing tradecraft quirk 1); the plaque evaluates it on what the shooter believes and the roll on what is true (§7.10).

| Source | `src` | Value (my call unless noted) |
|---|---|---|
| **position** | task | standing 0; standing, braced on a wall or doorframe +2; kneeling +2; kneeling braced +4; sitting +3; prone +4; prone on a bipod, pack or sandbag +6. Pistols half (rounded down). The L-20 standing −2 |
| **the aim held** | task | +round(min(4, heldS × (2 + MRK/10))); "still coming down from the last" −2 (tradecraft) |
| **optic** | gear | `opticMod(mag, d)` (§3.5) |
| **target moving** | task | the worse of the close term (walking −2, running −5: tradecraft, by lateral speed over 0.3 and 2.5 m/s) and the lead bias (§7.4) |
| **light on the target** | env | dark −4, dim −2 (tradecraft); a thermal optic or NV with the IR laser removes it |
| **wind** | env | the wind bias (§7.4) |
| **holdover** | task | the holdover bias (§7.4) |
| **spin** | env | in a spin habitat, the Coriolis bias (§2.9), read as holdover is |
| **double-action first pull** | gear | −1 (tradecraft) |
| **heat** | gear | barrel over 250 °C −1 (mirage, a wandering zero), over 400 °C −3 |
| **familiarity** | gear | −3 / −1 (§5.1) |
| **gloves on the trigger** | gear | pressure gloves −2, gauntlets −3, worn down by EVA (`mitigated`, SKILLS §5.13; BODY sets the base); halved on the V-5 |
| **a hard-suit helmet without the HUD link** | gear | −2 (no cheek weld; the link puts the reticle in the visor instead) |
| **corner shot through the link** | task | −4 |
| **anchoring** | env | free fall unanchored −6, anchored (a handhold, mag boots) −2, braced 0 (SKILLS §5.13's suggested bases, worn down by Zero-g); recoil's effect on follow-ups is §7.8 |
| **the shooter moving** (COMBAT §25.9) | task | Combat stance: −4, −2 at Marksmanship 15 and up; Assault stance within 10 m from drill rung 2: `mitigated(−8, Marksmanship, 30, 0.25)` (−5 at 10, −3 at 18, −2 from 23), else area fire only (COMBAT §5.4); in a low-g bound, no shot until the feet land |
| **incoming fire** | env | being shot at in the last 5 s −4 (tradecraft; `fire` −3 and −4 retired as built in v0.0.9, never applied): **replaced 2026-11-07** by COMBAT §5.3's one felt modifier (`suppressed`, −1 a 10 points of the pool less hardening, at most −10), the aim slowed × `(1 + felt / 200)` |
| **the follow-up's climb** | task | §7.6 |
| **body and needs** | body, need | BODY's `bodyMods(p, 'marksmanship')` and `needMods`: wounds on eyes, arms and breath; pain; blood; stamina ("breathing hard: the aim sways with the breath", BODY §8); stress; fatigue; G-load |

**As built in v0.0.7: sitting** (`shooting.js` `SIT_MS`, `stanceMsOf`; the build sheet 0.0.7 §8 item 9, my calls): a stance of its own (+3), offered by its own row and never in A and W's cycle (from sitting the A/W rows are unbound). Stand to sit 2.0 s, kneel to sit 1.5, prone to sit 1.8; sit to stand 1.2, to kneel 1.0, to prone 1.5. A player knocked `down` by a wound gets the stance rows (stand, kneel, prone) only once BODY's `downOf` lets them up, and none before.

### 7.4 Bias: wind, holdover and lead

Some errors are not scatter but a steady offset the shooter must correct: the wind's drift, the round's path off the line of sight, a moving target's lead. One helper turns any uncorrected offset into a modifier (my call):

```
biasMod(biasCm, partRadiusCm) = −round(5 × log2(1 + |biasCm| / partRadiusCm))
partRadiusCm: torso 25, head 9, legs 15, a KD target per its rings (§11.1)
```

An offset equal to the target's radius costs as much as a doubling of range (−5): the log reads it the same way.

| Offset against a torso | 5 cm | 10 | 15 | 25 | 40 | 60 | 100 cm |
|---|---|---|---|---|---|---|---|
| modifier | −1 | −2 | −3 | −5 | −7 | −9 | −12 |

- **Wind**: `bias = driftPerMs(d) × crosswindMs × (1 − windCorr)`. `windCorr = clamp((MRK − 6)/24, 0, 0.8)` (the shooter's read, SKILLS: Marksmanship estimates wind); +0.2 with a coach calling it (the range), capped at 0.95; at least 0.5 of a steady wind with the HUD link's ballistic dot (it knows only the wind where you stand). Gusts (PLACES's weather: a gust factor) are never corrected.
- **Holdover**: `bias = |path(d)| × (1 − holdCorr) + |dpath/dd| × d × rangeErr`. `path` is the round's path against the line of sight for the gun's zero, in the area's environment (§2.5), including the mechanical offset close in. `holdCorr = clamp((MRK − 4)/20, 0, 0.9)`, +0.2 with a BDC reticle in the environment it is marked for (cap 0.95), 1 with a lased ballistic dot. `rangeErr` 0.01 lased, else `clamp(0.30 − MRK/100, 0.05, 0.30)` (the eye's estimate).
- **Lead**: `bias = lateralSpeed × tof(d) × (1 − leadCorr) × 100`, `leadCorr = clamp((MRK − 6)/24, 0, 0.85)`.

**What the shooter believes** (my call, after the review; it feeds the plaque, §7.10, never the roll). The character does not know the true range or the true wind; they hold a judgement of each, drawn once when they first take in the target and the wind (from `stream('judge', shooterId, targetId)`, so it does not change as the player looks again) and kept until something tells them better:
- **The range they judge**: `dEst = d × (1 + e_r)`, `e_r` uniform within ±`rangeErr` (the same `rangeErr` as the holdover's: ±1% lased, else ±5% to ±30% by Marksmanship). A lased range, or the HUD link's ballistic dot, makes it exact to the metre. A known distance (a KD range's marked firing line, a checkpoint's painted 50 m line) makes it exact too.
- **The wind they read**: `windEst = crosswind × (1 + e_w)`, `e_w` uniform within ±`(1 − windCorr)` (a good read is close, a poor one may be half or one and a half of the truth); gusts are not in it. A coach's call or the SO-20's met sensor narrows it as they narrow `windCorr`.
- **Their uncertainty**: the shooter knows roughly how good their judgement is (a trained marine knows a guessed 300 m could be 250 or 350), so the plaque can compute the odds at both ends of the belief's spread, `dEst × (1 ± rangeErr)` and `windEst × (1 ± (1 − windCorr))`.

**As built in v0.0.7** (`src/sim/arms/wind.js`, `shot.js` `poiOf`, `holdFor`, `holdSaid`; the build sheet 0.0.7 §8 items 2, 5 and 6, my calls):
- **On a KD face and the zero card the bias moves the hole in centimetres; it is not a DC modifier.** The d20's margin sets the spread (its ring band, by hash, as tradecraft's paper did), and the zero, the round's path, the wind and the hold move the strike in real units (`poiOf`; `paper.js` `faceHole`); the ring is scored where it lands. `biasMod` above stays for shots at people. Otherwise zeroing could never be seen. The 25 m card of test-handling (`card25`) keeps v0.0.5's hole by margin, byte for byte.
- **The wind is a closed form** of the world's seed, the sol, the time and the place, with no state (`windAt`), so lived and skipped agree and nothing saves: the day's mean 2 to 6 m/s at 10:00 from a direction drawn round the compass (a morning breeze, under §11.1's afternoon 0 to 8), drifting ±25% and veering ±0.3 rad over minutes, and gusting by ±35% over three periods of 8.3, 17.9 and 37.1 s that walk down the range with the wind, so the flags lift one after another (`flagOf`). PLACES's weather replaces it later through the same `windAt`.
- **The read** (`readWind`) is the steady wind watched over the last 10 s (gusts are not in it), times 1 + e within ±(1 − `windCorr`), on the `judge` stream. **The coach's call is a read on his own sheet with his +0.2, made at Marksmanship 14 at least** (`COACH_MRK_MIN`: a range coach is a marksman), and the plate shows it in his whole metres a second. The reads are cleared at each new line. The rows "Hold for your read" and "Hold for the coach" set the hold in one step; the character reads and the coach calls, and the player chooses the hold or dials the clicks.
- **The hold convention**: `stop.hold = { xMil (+ right), yMil (+ high) }` is where the point of aim moves, as a shooter says it, and the strike moves the same way. A wind from the left pushes the round right, so it is held **left** (`holdFor` gives a negative `xMil` for it), in steps of a quarter mil. The coach and the DI say holds in quarters (`holdSaid`: "half a mil right", "a quarter of a mil left, a mil high", "centre").

**As built in v0.0.8: the flags, as drawn and as read** (`wind.js` `flagOf`, `windWords`, `steadyPath`; `courses.js` `KD_COACH`; the user's report, 2026-11-07, PLACES §4.12; my calls). `flagOf` gives `{ towardRad, liftK = speed / FLAG_FULL_MS, speedMs }`: `FLAG_BANDS` 5 and `FLAG_BAND_MS` 1.5 (`FLAG_FULL_MS` 7.5 and `FLAG_LIMP_MS` 1.5) replace v0.0.7's `FLAG_FULL_MS` 8 and `FLAG_LIMP_MS` 0.5, so a real sleeve's three knots a band: two bands out at 3 m/s, four at 6. `steadyPath(seed, atMs, from, to)` gives the read's steady `{ crossMs, headMs }`. `windWords(crossMs, headMs, speedMs)` gives `flags` with nothing across: "limp" only under `FLAG_LIMP_MS`, "front" or "behind" when the wind along the range stands the flags out, "light" otherwise. What the flags do is the truth's, since it is plain to see; only the crosswind is judged. The coach's lines `KD_COACH.front`, `.behind` and `.light` ("Wind's at our backs, straight down the range: nothing across. Hold centre." and "The flags stand out toward the targets: nothing across." replace "Flags are limp. Hold centre." and "The flags hang: no wind to speak of.", said under a 3 m/s wind straight down the range) and "1 metre a second" in his words. **The sign convention, checked end to end for a wind from each quarter**: `crossOf` + from the left, the plate's arrow the way the wind blows ("6 M/S <" for a wind from the right), the hold into the wind (half a mil right), the round's drift on the face. Look only: nothing saved changes.

**As built in v0.0.11**: `windBlowsAt(state, area, x, z)` is `airAt`'s open flag. A shot's wind and `readWind` are 0 where the air is not open (decks, buildings, vacuum). Open: `wind.js` reading `airAt.open`, and `shot.js` `ANCHOR` (step 5).


### 7.5 What the odds look like

Hit chances on a standing man's torso, daylight, the aim held to +4, no wind, no stress [computed]. Marksmanship 6 is a recruit at boot week 6, 10 a private, 14 a lance corporal or corporal, 18 a sergeant, 24 a recon marine, 30 a raider (SKILLS §11.1).

**P-12 pistol, standing, red dot:**

| MRK | 3 m | 7 m | 15 m | 25 m | 50 m | 75 m | 100 m |
|---|---|---|---|---|---|---|---|
| 6 | 80% | 80% | 65% | 45% | 20% | 5% | 5% |
| 10 | 95% | 95% | 85% | 65% | 40% | 25% | 15% |
| 14 | 95% | 95% | 95% | 85% | 60% | 45% | 35% |
| 18 | 95% | 95% | 95% | 95% | 80% | 65% | 55% |
| 24 | 95% | 95% | 95% | 95% | 95% | 95% | 85% |

**R-7, standing, the SO-4 at 1×:**

| MRK | 25 m | 50 m | 100 m | 200 m | 300 m | 400 m | 500 m | 600 m |
|---|---|---|---|---|---|---|---|---|
| 6 | 95% | 70% | 45% | 20% | 5% | 5% | 5% | 5% |
| 10 | 95% | 90% | 65% | 40% | 25% | 15% | 10% | 5% |
| 14 | 95% | 95% | 85% | 60% | 45% | 35% | 30% | 20% |
| 18 | 95% | 95% | 95% | 80% | 65% | 55% | 50% | 40% |
| 24 | 95% | 95% | 95% | 95% | 95% | 85% | 80% | 70% |

**R-7, prone on the pack, the SO-4 at 4×, a 5 m/s crosswind read by the shooter (§7.4):**

| MRK | 100 m | 200 m | 300 m | 400 m | 500 m | 600 m |
|---|---|---|---|---|---|---|
| 6 | 80% | 60% | 35% | 15% | 5% | 5% |
| 10 | 95% | 80% | 60% | 40% | 25% | 5% |
| 14 | 95% | 95% | 80% | 60% | 50% | 30% |
| 18 | 95% | 95% | 95% | 85% | 75% | 55% |
| 24 | 95% | 95% | 95% | 95% | 95% | 95% |

With no wind the same private (10) hits 75% at 300 m and 50% at 600 m: the Martian wind is what separates a sergeant from a private at range.

**C-7 in close quarters: standing, 1×, being shot at (−4), the target running (−5), no time to hold the aim:**

| MRK | 3 m | 7 m | 15 m | 25 m | 50 m |
|---|---|---|---|---|---|
| 6 | 60% | 60% | 45% | 25% | 5% |
| 10 | 80% | 80% | 65% | 45% | 20% |
| 14 | 95% | 95% | 85% | 65% | 40% |
| 18 | 95% | 95% | 95% | 85% | 60% |

Against tradecraft's yardstick (real police in real gunfights hit with 18% of shots, 30% when nobody fires back: RAND 2008, quoted in tradecraft's DESIGN), the close-quarters table is the right shape once COMBAT's cover and suppression take their share.

### 7.6 Bursts, automatic fire and taps

- **A pull on auto** fires `AUTO_ROUNDS` 4 (tradecraft) from a rifle or carbine, 6 from the L-20 and 3 on a burst-3 selector; the L-20 also offers a long burst of 15 for suppression (COMBAT reads it). The rounds leave at the cyclic rate (R-7 700 rpm: 86 ms apart).
- **Each round is its own roll** with the climb: `−round(BURST_K 2 × k × recoil × climbOf(MRK) × anchorClimb × support)`, `k` the round's place after the first, `climbOf = clamp(1.4 − MRK/25, 0.35, 1.4)` (tradecraft), `support` 0.5 on a bipod and 0.8 prone.
- **Taps**: Fire again during a shot's recovery fires a follow-up at the same aim, a double tap from Marksmanship 8 and a triple from 18 (tradecraft's `TAP_SKILL`, the user, 2026-11-04), split `TAP_SPLIT_S` 0.25 s, semi-automatic only. **From `test-pairs` they are rows** (COMBAT §25.6.1), offered when relevant and priced before: the **Pair** (controlled: a second sight picture, a split of one pull, its climb ×`CONTROLLED_CLIMB_K` 0.5), the **Hammer** (Marksmanship 12, within `HAMMER_MAX_M` 7 m, a split of `TAP_SPLIT_S` × `paceOf(WH)`), the **Triple** (18, within 7 m), the **Failure drill** (12, within `FAILURE_MAX_M` 10 m: the hammer, the assessment, `HEAD_SHIFT_S` 0.3 × pace to the head, the third not fired if he is down) and **To the head**; each planted or moving. The part is a property of the row (§7.2's `partDC`). **Built in v0.0.8** (`src/sim/arms/specials.js`, COMBAT §25.6.1 to §25.6.4): the five rows, the real-time tap retired (§7.1); the planted and moving forms wait for the movement stances.
- **The pull's time**: `TRIGGER_S 0.15 + (n − 1) × 60/rpm + RECOVER_S 0.35 × recoil × pace × anchorRecover × (1 + 0.3 (n − 1))` seconds (tradecraft's `fireMs`, with the cyclic rate replacing `BURST_GAP_S`). Recovery uses the Weapon handling pace.
- A burst stops at a stoppage, an empty gun or a target down (tradecraft).

### 7.7 Where the round goes

1. **The part**: as aimed; a torso shot goes to an arm `0.15 × (1 − clamp(margin/10, 0, 1))` of the time, so a well-aimed shot rarely does (fixing tradecraft quirk 5, which diverted 12% whatever the margin).
2. **Cover**: if the roll hits, COMBAT's cover (tradecraft's `cover.js` geometry: what is on the line in its last 3 m, the part's exposure) decides whether the round meets the cover first; the cover's material and thickness then decide perforation by §8.2's helper and §8.5's materials, not a fixed stop share.
3. **A hit** is a wound (§8). **A miss** keeps flying: it passes the target at a random offset from the aim (1 to 3 times the part's radius, a direction from the shot's stream) and goes on along its line.
4. **The path** (`penetrate.js`): from the muzzle along the line, through the area's geometry (PLACES's walls and fixtures with their materials), for the load's remaining energy: every body on the line within 0.35 m (tradecraft's `STRAY.widthM` 0.7) is hit `STRAY.hit` 0.25 of the time; every wall or fixture is perforated or stops it (§8.5); a hard surface at a grazing angle may send it off as a ricochet (§8.5). Out of the area, the path ends at the area's edge on Mars (a miss on the range goes into the berm or the chasma wall) and is logged as "downrange" on Europa (§2.6).
5. **Near misses**: every person the round passes within `CRACK_M` 3 m gets a near-miss record for COMBAT's suppression, with `crack` true in air while supersonic (§2.7).

### 7.8 Recoil in low g and free fall

Recoil's impulse does not change with gravity (§2.2's table); what changes is what holds the shooter. The impulse goes to whatever the shooter is anchored to (my call, from momentum and friction):

| Anchor | When | Recovery × | Climb × | What the shooter keeps of each round's push |
|---|---|---|---|---|
| `planted` | standing, kneeling or prone at 0.3 g or more; braced anywhere | 1.0 | 1.0 | nothing (friction or structure takes it) |
| `light` | standing at 0.05 to 0.3 g (Europa, Callisto, Ganymede) | 1.2 | 1.3 on auto | a slide: on Europa a rifle round pushes a 150 kg suited marine at 1.8 to 4.7 cm/s by the surface's grip and he stops within 0.1 to 0.6 cm; on auto the pushes add up and he skates [computed] |
| `magBoots` | on a ferrous deck in free fall | 1.2 | 1.3 | none of the push; a tenth of the spin |
| `handhold` | one hand on a hold (a pistol or the V-5 only; a rifle one-handed takes −4) | 1.6 | 1.8 | a fifth of the push, a third of the spin |
| `braced` | back or feet against structure in free fall | 1.1 | 1.1 | nothing |
| `floating` | nothing | 2.5 | 3.0 | all of it |

**Footing holds the recoil** (the user, 2026-11-08: "Try keeping rifles looking like rifles even zero G stuff, let's say we use footing to hold recoil"). The rows above are the whole answer to recoil in low g and free fall: a gun's form never changes with the gravity; what changes is the footing (mag boots, anchoring, bracing) that takes the impulse, and the rifle is shouldered the same way on every row. The V-5X over the shoulder is withdrawn (§3.9).

Two ways to anchor added 2026-11-08 (COMBAT §14.8; my calls, mapped onto the rows above so no new number is needed): a **lanyard** clipped short to a pad-eye or a handhold counts as `handhold` with both hands on the gun (no −4 for a rifle); a **buddy brace** (a teammate on boots or a hold holding the shooter's harness) counts as `braced`, and the teammate fires nothing.

**A floating marine's drift and spin per round** [computed: Δv = impulse ÷ mass; spin = impulse × 0.45 m ÷ I]. The lever is the shoulder line's height over the centre of mass (about 0.45 m on an upright body, the centre of mass near the hips). `I` is the whole body's pitch inertia about its centre of mass from anthropometric models (Hanavan's and Dempster's segment models give 12 to 13 kg·m² for an upright 70 kg man): about **17 kg·m²** for a 95 kg marine with rifle and kit, about **28 kg·m²** suited at 150 kg, the suit's mass and backpack sitting farther out (my call, scaled from those models). The first version of this table treated the body as a uniform 1.85 m rod (42.8 kg·m² suited) with a 0.30 m lever, which halved the spin; the conclusion only gets stronger.

| Gun | Δv per round, 95 kg unsuited / 150 kg suited | Spin per round, unsuited / suited | After 30 rounds fired in a few seconds, suited |
|---|---|---|---|
| P-12 | 3.4 / 2.1 cm/s | 4.9 / 2.9°/s | 0.64 m/s, 88°/s |
| V-5 | 2.5 / 1.6 cm/s | 3.6 / 2.2°/s | 0.48 m/s, 66°/s |
| R-7 | 8.9 / 5.7 cm/s | 12.9 / 7.8°/s | 1.70 m/s, **235°/s** (two-thirds of a turn a second) |
| S-9 | 13.6 / 8.6 cm/s | 19.6 / 11.9°/s | |
| B-12 slug | 14.8 / 9.4 cm/s | 21.4 / 13.0°/s | |
| (the withdrawn V-5X, net, §3.9) | 0.53 / 0.33 cm/s | 0.76 / 0.46°/s | 0.10 m/s, 14°/s |
| J-12 (§3.9) | 0.42 / 0.27 cm/s | 0.61 / 0.37°/s | 0.08 m/s, 11°/s |

One R-7 round fired floating pitches a suited marine about 8° in the first second: the aim is gone before a second shot. A magazine on automatic leaves him tumbling at two-thirds of a turn a second and drifting at 1.7 m/s.

The sim adds each round's Δv (backward along the bore) and spin (pitching the shooter back) to the shooter's motion (BODY's free-fall locomotion moves the body); the aim is lost when the spin carries the muzzle out of the arms' arc, and the next shot needs a new aim. So in free fall the trained marine fires single aimed shots from a handhold or mag boots, the V-5 is the gun for it, and an L-20 on auto turns a floating gunner into a tumbling one. That is the real reason for the Corps' shipboard kit, and it shows on the screen.

### 7.9 Shotguns and the launcher

- **Buckshot** (fixing tradecraft quirk 6, the shotgun as one big bullet): one roll for the pattern's centre (the kind's DC, −3 within 12 m). The pattern's radius is 1.25 cm per metre (a cylinder bore: about an inch per yard). On a hit, the pellets on the aimed part are `Binomial(9, min(1, (R_part / (0.0125 × d))²))`; on a miss by 4 or less, `Binomial(9, a quarter of that)` ("the edge of the pattern"). Pellets on one part make one wound (§8.1).
- **Breaching rounds** are fired at a hinge or lock within 0.3 m (a standoff muzzle): DC 6 (a hinge), each hit adds 1 to the hinge's damage and a door with all hinges at 2 swings (PLACES's door states; COMBAT's breach). Fired at a person, it is a slug at 1 m and dust at 5.
- **The G-40**: direct fire to 400 m and indirect to 900 m on Mars. The aim point is the roll's: a hit lands within `1 m + 0.5% of range` of it; a miss lands `2 m + 0.4 m × |margin| + 2% of range` away in a direction from the shot's stream. The quadrant sight is marked for Mars (elevations: 100 m 1.9°, 200 m 4.1°, 300 m 6.5°, 400 m 9.2°; on Earth 5.2°, 11.5°, 19.6°, 34.3°; on Europa 0.7°, 1.3°, 2.0°, 2.6°) [computed], so off Mars it carries a holdover bias unless the HUD link solves it. Flight times on Mars: 1.4 s to 100 m, 4.4 s to 300 m. Grenades arm at 15 m and are §12's.

### 7.10 The log and the plaque

The plaque over the bracketed target (VIEWS draws it) shows the part, the range, the odds and the aim's time **as the character judges them** (the user, tradecraft 2026-10-26: "we only know what we know"; 2026-10-28: "what we see is what our character evaluates as being true"). It is computed by the same helper as the roll, with the same list of modifiers, on the shooter's beliefs (§7.4): `dEst` in place of the range (in `rangeDC`, the holdover's path and the lead's flight time), `windEst` in place of the wind, and every other modifier as it is (position, optic, the held aim, light, the body and needs, which the character feels).
- **The range** is shown as judged and rounded to the judgement's precision: "≈ 300 M" for an eye's estimate, "312 M" only when lased, given by the ballistic dot, or a known distance.
- **The odds** are a percentage when the belief is tight (both ends of its spread give odds within 10 points of each other: a lased range in still air, a known distance, a close shot where range and wind barely matter). Otherwise they are SKILLS §5.11's banded words computed at both ends of the spread ("good odds", "a fair chance", "poor odds", "you'd need luck", "hard to say"). So a private at an unknown 300 m in a Martian afternoon wind reads "BODY · ≈ 300 M · A FAIR CHANCE · AIM 0.9 S"; on the KD range's 300 m line in still air, "BODY · 300 M · 75% · AIM 0.9 S".
- **Hovering** lists the DC's parts and every modifier as believed: "wind ≈ 4 m/s, read" and "holdover for ≈ 300 m", never the true wind or range.
- With a lased range and no wind (or the ballistic dot's corrected wind and nothing gusting), the believed odds equal the true odds; elsewhere they differ by exactly the shooter's misjudgement, which is the realism the plaque exists to show.

The log line (SKILLS' `checkText`, the verb "hit") is written **after the shot** and holds the true sum, with the judgement beside it, so the player learns what the character got wrong:

> Marksmanship: 14 + 14 + 6 (prone, on the pack) + 5 (4× optic) + 4 (the aim held) − 3 (wind 6.2 m/s; you read 4) − 1 (holdover: 340 m, you judged 300) = 39 against 31 (340 m 25, the torso 0, the R-7 0, base 6). Hit: the chest. (You judged it "a fair chance".)

A burst lists each round's roll in J and a summary in the toast: "4 rounds: 2 hit, the chest and the arm."

**As built in v0.0.5** (`shot.js` `plaqueOf`, `src/ui/plaque.js`; VIEWS §7.4 draws it): on the 25 m line the range is known and the air still, so the plaque's odds are a percentage, computed by the roll's own helper on the same list (the DC's parts and every modifier, the body's and the needs' through the roller), and equal the true odds. Its form is "PAPER 95% | 25 M · AIM 0.9 S", then "… · +4 IN 1.4 S · 1 HELD FIRE" by the keys (CLICK FIRE after the mouse moves), or Fire's struck reason in that place ("ON SAFE", "CHAMBER EMPTY", "A STOPPAGE"). **On a paper target the plaque's figure is the chance of a hole** (my call, the parity review's): the roll's margin at the card's edge ring (−3) or better, since the shooter's question at a card is "on the paper?" and the edge ring's 2 sits under the DC; the roll's own pass at the DC is kept as `rollOdds`. At Marksmanship 10 it reads 80, 90 and 95% standing, kneeling and prone unheld, 95% held, within 1.7 points of 2,000 pulls a cell (it had shown the pass, 85% prone against 94.9% of rounds on the paper). The alternative, scoring the edge's 2 from margin 0, would change §11.1's rings (open question 9). The log's line is SKILLS' `checkText`, tradecraft's word for word: "20 + 9 + 4 (prone) + 4 (the aim held) + 1 (the SO-4 at 1×) = 38 against 19 (25 m 7, the 25 m card 6, the R-7 0, base 6)".

**As built in v0.0.7: the plaque on a KD face** (`shot.js` `plaqueOf`, `paper.js` `faceOdds`; the build sheet 0.0.7 §8 items 4 and 35, my calls). The odds are computed on the strike the shooter believes (`poiOf` with `belief: true`: the believed zero, the dope dialled, the wind as read, the hold), the margin's spread laid over it. **At distance the headline is the chance of a five or a V** ("FIVE 47%"), since the chance of a scoring hit on an A face sat at 92 to 96% whatever was held or dialled (the 60 cm rings) and helped no choice (the design review's); **the chance on the paper moves to the hover** (`kd.scoreOdds`), and **the rings' odds** (`kd.ringOdds`: V, 5, 4, 3, 2, a miss) are drawn as a six-cell strip (VIEWS §7.4; Marksmanship 10 prone at 300 m in still air: V 47%, 5 26%, 4 20%). Words replace the figure while the read's two ends move even the chance on the paper 10 points ("HARD TO SAY" at a wide read). The terms plate shows the range ("300 m, a known distance"), the wind as read or called and how old the read is, the hold and the turrets off the believed zero. **The zero card at 25 m keeps PAPER** and the chance of a hole. At 200 and 300 m the shot's log line is the roll and the shooter's own terms; where the round went is the pits' and the coach's to say (§11.5).

**Designed 2026-11-11, to build in the shoot house rework: the caught 1 on a shot** (SKILLS §5.1; the user, 2026-11-11: "maybe they take 50% longer to shoot instead of missing altogether").
- **When.** A shot's natural 1 is caught when the shooter's Marksmanship is 15 or more (`MASTERY_MIN`) and the roll's sum without the die (value + every modifier but the tempo, the felt chaos included) reaches the DC + 10 (`MASTERY_AT`), and the shot is not rushed. A shot is never routine, so mastery is its only catch.
- **The time.** The round leaves late by `CATCH_K` 0.5 × its own time: its part of the row since the round before it, or since the row began. That is the aim when the row holds one, the press or the split, and the shift to the head. On Fire from aimed this is half the pull: +0.18, +0.17, +0.15 and +0.13 s for the corporal, sergeant, Raider and tier one (COMBAT §25.6.2's Fire, halved). The row's later parts move with it.
- **Where it goes.** The die is read at the press, so the shot's stream is unchanged. The round is then judged by the world when it leaves: a turner turned edge-on or away takes it into the berm, a man down is not hit again, and a threat whose own shot comes first fires first. Past those, the round lands where its margin puts it (a caught 1's margin is at least 11: the A zone, the X, the head plate down), so `manZone`'s and `steelOf`'s `nat !== 1` reads `!(nat === 1 && !caught)`.
- **What it shows.** The plaque reads "SURE" where a 1 would be caught (SKILLS §5.11; VIEWS §7.4), and its hover reads "a natural 1 is caught: +0.13 s". The round's tick is `~`, the toast takes the hit's tone and words ("In the A zone · caught, +0.13 s"), never the miss's amber, and J's line is SKILLS §5.14's. The hit card marks the late round's split.
- **A shot's natural 20** is drawn ★ and lands by its margin, with no time effect.
- **Numbers** (SKILLS §5.1's table): a round in the shoot house misses 16.9, 5.8, 3.8, 1.4, 0 and 0% for the recruit, private, corporal, sergeant, Raider and tier one, against 16.9, 5.8, 5.1, 5.5, 5.6 and 5.7% before. In Pairs the figures are 6.8, 4.6, 0.3, 0.3, 0 and 0, against 4.5 to 6.8 for every sheet before. So from the corporal up skill shows on the paper too, where COMBAT §25.6.3 found it showed only in time.

### 7.11 The resolver

```
resolveShot(rng, shooter, gun, target, { part, mode }):
  n = roundsOf(gun)                                            (1, a burst, or a tap's follow-up)
  for k in 0..n−1:
    f = fire(rng, shooter, gun)                                (firearms.js: refusals, misfires, stoppages)
    if not f.fired: log f.why; break
    emit shot-sound(shooter, gun, env)                         (§7.12)
    applyRecoil(shooter, gun, anchorOf(shooter))               (§7.8)
    dc   = dcOf(gun, target, part, range)                      (§7.2)
    mods = modsOf(shooter, gun, target, part, range, k)        (§7.3, §7.4, §7.6)
    roll = check(rng, { skill: 'marksmanship', value, dc, mods, body: shooter, pressure })
    path = traceRound(gun.load, origin, line(roll, target), area)   (§7.7, §8.5)
    for each hit on the path: applyHit(hit)                    (§8: armour, wound, holes)
    for each near miss: emit near-miss(person, passM, crack)
    brass(shooter, gun)                                        (§2.8)
    if f.stoppage or f.empty or target down: break
  log the roll(s) with the true sum and the shooter's judgement beside it; return { ms: fireMs(...), rounds, hits }

plaqueOf(shooter, gun, target, part):                          (§7.10: before the shot, every frame it shows)
  b = beliefsOf(shooter, target)                               (dEst, windEst and their spreads: §7.4)
  the same dcOf and modsOf, called with b in place of the range and the wind, at both ends of the spread
  → a percentage if the two ends agree within 10 points, else SKILLS §5.11's words
```

Every random draw is from the shot's stream (`stream('shot', seed, shooterId, gunId, roundCount, shotId)`), and cosmetic choices (where a hole lands on paper, a ricochet's spark) from hashes, so nothing cosmetic moves the dice (TECH; tradecraft's discipline). **The shot's id is in the stream's key** (the shot role's fix, v0.0.5): a pull that does not fire (a misfire, a click) counts no round, so keyed by the round count alone the next pull drew the same dice and misfired forever (`shot-grid` caught it).

**As built in v0.0.5** (`src/sim/arms/shot.js` `resolveShot`, one pull; `paper.js`): the pull (`firearms.js pull()`: a refusal, a set stoppage, a misfire, a fired round), the belief by what the holder felt, the Marksmanship roll at pressure `evaluated` and never routine, the hole by hash in its ring (§11.1; `holeOf`, its place hashed with the world's seed, so each career's card has its own pattern), the case (`look.js ejectCase`, none for a shot that did not cycle: §2.8), the roll logged with its DC's parts and the hole as its verb, and the `roll`, `shot` and `fx { kind: 'flash' }` facts. No wind, holdover, path or hit yet (0.0.7). A shot's `atMs` is the fire step's start, so the hole, the case and the flash appear at the step's start rather than `TRIGGER_S` 0.15 s into it (left as built; the integrator's §9 item 44).

**As built in v0.0.8: a round in a row, and the man-target** (`shot.js` `resolveShot`, `dcOf`, `modsOf`; `paper.js` `PAPERS.man`, `manHole`; the build sheet 0.0.8 §8 items 11, 14, 15; my calls):
- **A round's record takes its formula time**: `resolveShot(…, { part, follow, climbK, atMs, row })`, the record's `atMs` and the held aim's moment both the round's own (its sub-step's start plus the parts before it, whole ms), so a split under a tick reads true on the paper (the tier one's hammer 0.11 s; a Pair's reports 395 ms apart, not the ticks' 400). The sub-steps still take the first tick at or after their boundary (TIME §4.3). The record gains `part`, `zone` ('A', 'C', 'head' or null), `ring`, `through`, `down` (the head plate's verdict on an armoured face) and `row: { id, n, i }`, written only on a turner, so test-handling's and test-range's records, logs and saves are byte for byte.
- **The row's climb**: a round after a row's first carries its held aim and the climb `−round(BURST_K × follow × recoil × climbOf(MRK) × ANCHOR.climb × SUPPORT × climbK)`, `follow` its place after the first and `climbK` the row's (the Pair's second ×0.5, a re-sighted head round ×0.5); a round after a shift holds nothing (a new sight picture).
- **A turner is a man-target**: its DC by `PART_DC` (torso 0, head +6), no paper term. `PAPERS.man` (cm from the face's centre, x right, y down): the face 46 × 76, the torso box 46 × 56 centred at (0, 10), the A box 16 × 28 at (0, 0), the head a circle of r 8 at (0, −30) (`centres` holds the A's and the torso's). **The zone by margin** (`manHole`): a torso round at a margin of `A_MARGIN` 4 or better (SKILLS §5.6's good) the A zone, a pass the C zone, a head round on a pass the head, a fail into the berm; its place in its zone by hash, the same every time. A turner under `SEEN` facing, or down and turned away, takes its rounds into the berm ("past the target"), no fault.

### 7.12 Sound and flash

- **Heard**: in air, people react within `HEAR_M` 70 m × loud × (pKpa/101.3) (tradecraft's 70 m, thinned with the air: Mars' valley ×0.65); a shot is heard as "a shot, somewhere" to 1,500 m × loud × (pKpa/101.3) (PEOPLE's perception decides who notices; VIEWS's "heard" plaque). In vacuum nothing is heard through space; through structure, within 30 m × loud on the same hull or ice, felt as a thump. A shooter in a suit hears his own gun through his bones.
- **Hearing damage** without protection indoors is BODY's (the Corps' helmets and suits protect).
- **Flash** (VIEWS draws it): Mars' air is 32% oxygen, so the secondary flash of muzzle gases is brighter than on Earth (×1.2); in vacuum there is only the primary flash, wider and briefer (×0.6). Tracers start grass fires on the range's dry scrub in 32% oxygen (PLACES's fire, an ignition chance of 0.002 a tracer on vegetation: my call).

---

## 8. Damage, penetration and armour

BODY owns wounds (parts, injuries, bleeding, pain, knockdown, death). WEAPONS owns what arrives: the round's energy, size and behaviour, whether armour stops it, whether it goes through, and what it does to whatever is behind.

### 8.1 The wound factor

Tradecraft's bullet was `BULLET 7 points × CALIBRE.dmg × MODEL.dmg × U(0.8, 1.25)`, with `dmg` set by hand (9×19 1.0, 5.56 1.5, 7.62×51 2.0, 12-gauge 2.2). OLYMPUS derives the multiplier from the round as it arrives (my call), so range, load and gun all count:

```
w = (E_impact / 500 J)^0.36 × (diaMm / 9)^0.3 × load.woundK
```

It stays close to tradecraft's hand-set values (500 J of 9 mm gives 1.0, as tradecraft; 1,700 J of 5.56 mm 1.35 against tradecraft's 1.5; 3,300 J of 7.62 mm 1.89 against 2.0: the small bore costs a little) and falls with range [computed, Mars valley]:

| Round | w at 10 m | 100 m | 300 m |
|---|---|---|---|
| 9×21 ball (P-12) | 1.03 | 0.88 | 0.76 |
| 9×19 ball | 0.99 | 0.87 | 0.76 |
| 4.8×30 ball (V-5) | 0.92 | 0.82 | 0.61 |
| 6.5×40 ball (R-7) | 1.61 | 1.55 | 1.42 |
| 6.5×40 frangible | 1.61 | 1.52 | 1.31 |
| 6.5×40 AP | 1.43 | 1.38 | 1.28 |
| 7.6×56 ball (S-9) | 1.97 | 1.89 | 1.72 |
| 5.8×42 ball (FA-9) | 1.40 | 1.33 | 1.18 |
| 7.62×39 ball (TMW-6) | 1.58 | 1.48 | 1.26 |
| 12-bore slug | 2.23 | 1.78 | 1.48 |
| 12-bore buck: 9 pellets on a torso at 5 to 10 m, one cluster (diameter factor 1.2) | 2.0 | | |
| a G-9 ball (2.4 mm, 0.057 g) at 5 m | 0.26 each | | |

BODY keeps tradecraft's 7 points × w × U(0.8, 1.25) or replaces it; WEAPONS hands over `w` and the facts (§8.7).

### 8.2 Penetration

One helper decides every contest between a round and something in its way (armour, a suit, a wall, a body), in the same unit (my call):

```
pen(v)     = pen0 × (v / v0)^penExp                       mm RHA-equivalent, from the flight table's v
pStop      = pen < 0.5 × P_eff ? 1 : 1 / (1 + exp((pen − P_eff) / (0.1 × P_eff + 0.3)))
P_eff      = P × (1 − wear)                                 P of the layer or material, mm RHAe
after      = perforated ? v × sqrt(max(0, 1 − P_eff / pen)) : 0
```

- A **frangible** round meeting a `hard` material (metal, ceramic, composite, ice, rock) is resolved at half its pen, and if it perforates it leaves as fragments: the rest of its path at 0.3 of its pen and `woundK` 0.3 (my call). Against soft things (tissue, fabric, sandbags) it behaves as ball until it hits bone or plate.
- The logistic's width grows with the layer, so a rating is never a wall from above: a full-power round at close range sometimes beats a plate rated against it. Below half the rating nothing gets through (the floor), so a grenade fragment never holes a steel door and a pistol round never beats a rifle plate.

### 8.3 Armour layers

BODY owns the suits as life support and their mass and mobility; this table is their protection (my call, every number).

| Layer | P (mm RHAe) | Covers | Blunt k | Wear a stop | Mass |
|---|---|---|---|---|---|
| soft panel (aramid, the Corps' carrier and most vests) | 4 | torso: plate 0.55, soft only 0.30, bare 0.15 | 0.22 | 0.02 | 4.0 kg |
| **Corps plate**, ceramic on composite, front and back | 11 | (as above) | 0.30 | 0.08 (ceramic cracks), at most 0.5 | 6.5 kg the pair |
| helmet | 5 | 0.6 of head hits (the dome); the face bare | as tradecraft (a stop dazes 2 to 6 s) | 0.05 | 1.4 kg |
| ballistic visor (Europa issue) | 2 | 0.3 of head hits (the face) | | 0.05 | 0.4 kg |
| light vac suit shell | 1 | everything | 0.1 | | BODY |
| hard suit (boarding armour): torso / limbs / helmet / visor | 14 / 6 / 8 / 4 | 0.9 torso, 0.8 limbs, 0.9 head, 0.1 face | 0.25 | 0.05 | BODY |
| UN Marine plate and soft | 10 and 3 | as the Corps' | | | |
| an insurgent's steel plate (front only) | 6 | 0.3 of torso hits | 0.35 | 0.03 | 4 kg |
| corporate security vest and helmet | 4, 4 | | | | |

- **Where a torso hit lands** is tradecraft's `layerHit()`: `u = U(0,1) × (1 − 0.2 × clamp(margin / 10, 0, 1))`, plate if `u` < its share, soft if under plate + soft, else bare; a well-aimed round lands nearer the middle. Limbs and neck are bare except in a hard suit.
- **Blunt trauma** behind a stop is tradecraft's: blunt points = the round's points × k; a cracked rib `min(0.5, crack × w²)`; winded `U(1, 3) s × w`; knocked down `min(0.6, knock × w)` (soft: crack 0.05, knock 0.1; plate 0.06, 0.15). The bruise lasts 10 days ("a black bruise the size of a hand, where a plate stopped a rifle round"). BODY applies them.
- **Spall**: a round stopped by bare steel (the insurgent's plate) throws fragments: 30% of the time a 0.3 × w wound to the neck or lower face (my call).

**Stop chances** at 10 / 100 / 300 m on the valley floor [computed]:

| Round | Soft panel (4) | Helmet (5) | Light suit (1) | Corps plate (11) | Hard suit torso (14) |
|---|---|---|---|---|---|
| 9×21 ball | 100% | 100% | 10 / 37 / 61% | 100% | 100% |
| 9×19 ball | 100% | 100% | 15 / 39 / 61% | 100% | 100% |
| 4.8×30 ball | 41 / 79 / 100% | 72 / 92 / 100% | 0 / 1 / 31% | 100% | 100% |
| 6.5×40 ball | 2 / 4 / 23% | 8 / 18 / 55% | 0% | 95 / 97 / 100% | 100% |
| 6.5×40 AP | 0% | 0% | 0% | **21 / 33 / 65%** | 66 / 77 / 91% |
| 7.6×56 ball | 0 / 0 / 5% | 1 / 2 / 20% | 0% | 82 / 90 / 97% | 95 / 97 / 100% |
| 5.8×42 ball | 3 / 10 / 49% | 15 / 33 / 77% | 0% | 96 / 98 / 100% | 100% |
| 7.62×39 ball | 12 / 34 / 84% | 38 / 66 / 94% | 0 / 0 / 1% | 100% | 100% |
| 12-bore slug | 85 / 100 / 100% | 94 / 100 / 100% | 1 / 22 / 56% | 100% | 100% |
| 12-bore buck (a pellet) | 100% | 100% | 65 / 100 / 100% | 100% | 100% |

The V-5's 4.8×30 is built to beat soft armour close and mostly does (59% at 10 m); the Corps plate stops every Belt rifle; AP is what beats plates, and why AP is "by order" (§8.6).

### 8.4 Through the body

A round that reaches a body part is resisted by the tissue: torso 1.6, limbs 0.8, head 1.4 (mm RHAe; frangible rounds ×2, because they break up). It **exits** when `pen > tissue × U(0.7, 1.3)` (an exit wound for BODY, tradecraft's `i.through`) and continues with `pen − tissue`: over-penetration. [computed at 10 m]: a 9×21 ball exits a torso 81% of the time and every limb; a 9×19 ball 60%; every rifle ball exits a torso and goes on with enough to hole a pressure bulkhead; a frangible round stays in; buckshot stays in a torso and exits a limb 43% of the time.

### 8.5 Materials, walls and ricochets

PLACES gives every wall, door, fixture and cover object a material and a thickness (its §3.14); WEAPONS owns what they stop (my call):

| Material | P per mm | Hard | Example thicknesses (P) |
|---|---|---|---|
| mild steel | 0.8 | yes | a locker 1.5 mm (1.2); a pressure door 6 mm (4.8) |
| armour steel | 1.0 | yes | a vault door |
| aluminium alloy | 0.3 | yes | an interior partition 2 mm (0.6); a pressure bulkhead 8 mm (2.4) |
| titanium | 0.55 | yes | a lander's skin 4 mm (2.2) |
| composite (CFRP) | 0.25 | yes | consoles, couches |
| honeycomb panel | 0.05 | yes (as built in v0.0.7) | a cabin wall 25 mm (1.25) |
| glass, polycarbonate | 0.1 | yes | windows; a ship's viewport of laminated sapphire 50 mm (8) |
| water ice | 0.01 | yes | an ice-bag barricade 1 m (10); a town's ice behind its liner, 3 m and more (30 and up) |
| regolith, sand (bagged or bermed) | 0.05 | no | a 40 cm sandbag (20); a berm stops everything a marine carries |
| concrete, sintered regolith | 0.15 | yes | Base Melas's walls 200 mm (30) |
| a habitat module wall (aluminium, shielding, water jacket) | (whole) 3.5 | yes | |
| a warship's armoured hull | (whole) 40 to 80 | yes | no small arm breaches it |

**Ice** was 0.03 per mm in the first version, which let 30 cm of ice stop 6.5×40 ball 85% of the time. The US Army's cold-weather manuals (FM 31-70 and its successors) give on the order of 1 m of ice as protection against rifle fire, so ice is now 0.01 per mm (my call after the review). Europa's 100 K ice is harder than terrestrial ice and more brittle (it shatters into a cone instead of yielding), which I take to cancel. **[computed]** Against 1 m of ice, at 10 m and at 100 m on the valley floor's air: the Belt's 7.62×39 is stopped 97% and 100% (it needs 1.08 m to be stopped every time at 10 m, 0.90 m at 100 m); the UN's 5.8×42 needs 1.04 m and 0.92 m for 95%; the Corps' 6.5×40 ball 1.11 m and 1.01 m (1.39 m and 1.25 m for every time); 7.6×56 ball 1.39 m and 1.26 m; AP 1.96 m and 1.83 m. So **Europa's ice-bag checkpoints need 1 m of ice** to stop what the cells carry (PLACES's `iceBag` is 0.6 to 1.0 m: the 1.0 m build is the checkpoint's), and a 0.6 m ice berm stops rifle ball only a quarter of the time.

**Perforation at 10 m** in an MCRN ship's 66 kPa air [computed]:

| Round | Partition 2 mm Al | Cabin wall | Pressure bulkhead | Pressure door | Lander skin | Habitat wall | 1 m ice | Locker |
|---|---|---|---|---|---|---|---|---|
| 9×21 ball | 97% | 82% | 29% | 0% | 36% | 8% | 0% | 84% |
| 9×19 ball | 96% | 75% | 22% | 0% | 28% | 0% | 0% | 77% |
| 4.8×30 ball | 100% | 100% | 97% | 33% | 98% | 76% | 0% | 100% |
| 6.5×40 frangible | 59% (as dust) | 23% | **0%** | 0% | 0% | 0% | 0% | 25% |
| 6.5×40 ball | 100% | 100% | **100%** | 94% | 100% | 99% | 9% | 100% |
| 6.5×40 AP | 100% | 100% | 100% | 100% | 100% | 100% | 90% | 100% |
| 7.6×56 ball | 100% | 100% | 100% | 99% | 100% | 100% | 30% | 100% |
| 5.8×42 ball | 100% | 100% | 100% | 89% | 100% | 99% | 6% | 100% |
| 7.62×39 ball | 100% | 100% | 100% | 68% | 100% | 95% | 3% | 100% |
| 12-bore slug | 100% | 98% | 69% | 7% | 77% | 26% | 0% | 98% |
| 12-bore buck (a pellet) | 61% | 24% | 0% | 0% | 0% | 0% | 0% | 26% |

**Ricochet** off a hard surface (my call): at a grazing angle under 15° from the surface 70%, 15 to 30° 30%, steeper 5%; AP half; frangible never (it turns to dust). The ricochet keeps 0.6 of its speed and leaves at `U(0.3, 0.8)` of its incoming angle, ±10°. Steel passageways make ricochets a real danger aboard, which is one more reason for frangible.

**As built in v0.0.7** (`src/sim/arms/penetrate.js`; the build sheet 0.0.7 §8 item 16, my calls). One contest for everything (§8.2): a round's pen, `pen0 × (v / v0)^penExp` from the flight table's speed, against a layer's P × (1 − wear), stopped for certain below half the rating and by the logistic above it; a round through keeps v × √(1 − P / pen). A frangible round on a hard material is resolved at half its pen and flies on as fragments (0.3 of its pen). **Honeycomb panel counts as hard** (the table's "no" gave way: frangible through a cabin wall at 23%, §8.5's perforation table, needs it). 

**As built in v0.0.8: the armoured silhouette** (`shot.js` `steelOf`, `PLATE_MM` 10, `PLATE_MATERIAL` armour steel; the build sheet 0.0.8 §8 item 14): a torso round on its face meets 10 mm of armour steel through `throughMaterial` on `stream('pen', seed, shotId)`: stopped, it **rings** (the 'fx' fact's `spark`, the paper's RING); through, it holes the plate (`through`); neither puts the face down. At 7 m the R-7's ball (787 m/s, 6.95 mm of penetration) rings 90.5% and goes through 9.5% (`steel`, 2,000 rounds). **The head plate falls** to a head round at a margin of 4 or better (`down`, the paper's HEAD DOWN: the recruit 50%, the private 80%, the rest 95%); a pass on the head rings. The face rocks a pixel on each ring and its plate falls to the ground (VIEWS §7).The berm and the ground stop everything. Through the body by §8.4's tissue values, not tradecraft's `EXIT_P`. Armour by tradecraft's `layerHit()` to the die, its stop table become the logistic on each layer's rating, with tradecraft's blunt trauma behind a stop. The line (`traceRound`) flies the bore line's drop through the area as the range authors it (the ground, the pits' floor 2.5 m down, the parapet, the berms; the faces and the cards are paper, holed and never stopping, and a face under half up is behind the parapet, §11.5); a body is hit within 0.25 m of its centre line, its part by the height on its span counted from the ground it stands on; a person passed within `CRACK_M` 3 m is a near miss. Measured: the plate stops R-7 ball 95, 97 and 100% at 10, 100 and 300 m; frangible never holes a pressure bulkhead. The 6.5×40's AP and frangible loads are in `calibres.js`, marked `range: false`, so the range's magazine kinds stay ball and tracer.

### 8.6 Aboard ships and stations: loads and the hull

**One helper sizes every hole** a projectile makes, for every reader (my call, after the review found the same rifle hole sized four ways: BODY §19.4's 8 mm, this section's 75 mm², COMBAT §13.7's 28 mm², PLACES's `bullet` class's 30 mm²):

```
holeArea(load, layer) → [{ areaMm2, kind: 'entry' | 'exit' | 'through' }, ...]
area = π × (diaMm × k / 2)²
rigid layer (a wall, a bulkhead, a hull, a door, a visor):  one hole per layer perforated, kind 'through'
   k  1.5 ball and AP (the petalled exit), 1.3 PDW rounds and fragments, 1.6 a slug, 2 a shaped-charge jet
fabric layer (a suit's pressure bladder and its cover, on a body):
   an entry hole, k 1.0 (the fabric parts to calibre), and, if the round exits the body (§8.4),
   an exit hole in the suit's far side, k 1.5 (a yawing round, bone): two holes, two leaks
```

The areas go to PLACES's gas model (its §3.4: choked flow to vacuum with Cd 0.6) and to BODY's suit (its §19.4). BODY, COMBAT and PLACES call this helper rather than size holes themselves; PLACES's hole classes (`pin`, `bullet`, `heavy`, …) stay as words for the display, and the hole record carries the helper's area. Diameters are the bullets': 4.9 mm (4.8×30), 6.7 (6.5×40), 7.8 (7.6×56), 9.0 (9×21, 9×19), 18.5 (12-bore slug), 2.4 (a G-9 ball, §12.3).

**Through a pressure boundary** to vacuum, from PLACES's Martian indoor standard (66 kPa, 20 °C; an MCRN hull) [computed with PLACES §3.4's choked flow; the time to each mark is a fixed multiple of τ, PLACES §3.5]:

| Hole | Area | Leak at 66 kPa (UN hull at 101.3 kPa) | A 140 m³ deck (a Tharsis corvette's) loses 10% in | and reaches the 50 kPa alarm in | A 30 m³ cabin's τ |
|---|---|---|---|---|---|
| 4.8×30 ball | 32 mm² | 3.0 g/s (4.6) | 65 min | 2.9 h | 2.2 h |
| 6.5×40 ball | 79 mm² | 7.5 g/s (11.4) | 26 min | 70 min | 53 min |
| 7.6×56 ball | 108 mm² | 10.2 g/s (15.4) | 19 min | 52 min | 39 min |
| 9×21 ball | 143 mm² | 13.5 g/s (20.5) | 15 min | 39 min | 30 min |
| 12-bore slug | 688 mm² | 65 g/s (99) | 3 min | 8 min | 6 min |
| 40 mm HEDP jet | 452 mm² | 43 g/s (65) | 5 min | 12 min | 9 min |
| a G-9 ball (only through light skins: §12.3) | 8 mm² | 0.7 g/s (1.1) | 4.5 h | 12 h | 9 h |

A hole's time constant does not depend on the pressure (PLACES §3.4), so a UN hull loses its 10% in the same minutes; it only loses more grams doing it.

A bullet hole is a hiss and a damage-control job, not an explosive decompression: the drama is in what the round hit on the way (a person, an oxygen line, a power trunk) and in the hole you cannot see. Fixtures PLACES tags `pipe:o2`, `pipe:coolant`, `pipe:water`, `power`, `intake`, `glass` and `screen` take a hit as a fault (PLACES's systems): a jet of oxygen (a fire hazard), a spray of coolant, an arc.

**The shipboard rules** (my call; COMBAT owns rules of engagement and may tighten them):
- Inside any pressure hull, the issue load is **frangible**: it stays in the room (a 6.5 mm frangible round never perforates a pressure bulkhead and gets through a partition as dust; ball holes the bulkhead every time and has enough left after a man's torso to do it).
- **Ball** inside a hull is by the boarding commander's order (an armoured enemy behind light walls). **AP** is by order only.
- No fragmentation grenade, HEDP, RL-84 (except its confined-space variant) or demolition charge inside a pressure hull without an order (§12.6).
- Brass catchers on in free fall (§2.8).
- A miss in a ship goes somewhere: the log names it ("Through the partition: something hisses in the next compartment").

### 8.7 The hit record

What WEAPONS hands BODY for every hit (a bus fact and a call, `applyHit`):

```json
{ "kind": "gunshot", "onId": "p52", "part": "torso", "fromId": "p310", "rangeM": 42,
  "load": "6.5x40r/ball", "energyJ": 2180, "diaMm": 6.7, "w": 1.56, "penLeftMm": 5.3,
  "armour": { "layer": "plate", "stopped": false, "wear": 0.08, "bluntPts": 0 },
  "through": true, "exitPart": "torso", "margin": 6, "shotId": "sh812",
  "suitHoles": [ { "part": "torso", "areaMm2": 35, "kind": "entry" },
                 { "part": "torso", "areaMm2": 79, "kind": "exit" } ] }
```

A stopped round sends `stopped: true` with its blunt points and no wound. A suit perforated anywhere sends `suitHoles` from `holeArea()` for BODY's suit leak; BODY's suit section owns the make-up flow and the patch. At BODY's 34 kPa of oxygen (its §19.4: `ṁ = 1.489 × 10⁻³ × A × P`) [computed]:

| Round through a suited body | Entry, exit | Leak, entry only | Leak, through and through | Pressure held: regulator alone (0.6 g/s) / with the reserve (1.8 g/s) |
|---|---|---|---|---|
| 4.8×30 | 19, 42 mm² | 0.95 g/s | 3.1 g/s | 6.6 / 20 kPa |
| 6.5×40 ball | 35, 79 mm² | 1.8 g/s | **5.8 g/s** | **3.5 / 10.6 kPa** |
| 7.6×56 ball | 48, 108 mm² | 2.4 g/s | 7.9 g/s | 2.6 / 7.8 kPa |
| 9×21 ball | 64, 143 mm² | 3.2 g/s | 10.5 g/s | 1.9 / 5.8 kPa |

So a rifle round through a suited marine is two holes. On the regulator alone the suit falls under the Armstrong limit (6.3 kPa); with the reserve open it holds 10.6 kPa, and the reserve's 150 g last about two minutes (BODY §19.4): a hand on one hole and a buddy on the other is the drill (BODY's covering step), then the patches. A G-9 ball's 4.5 mm² hole is under BODY's 3 mm self-sealing size.

---

## 9. Maintenance

### 9.1 What wears a gun

| Field | Rises by | Falls by | Effect (§4.3) |
|---|---|---|---|
| `cond` (0 to 1) | the armourer's service (§9.4) | `WEAR` 0.00004 a round (×1.5 auto, ×2 over 350 °C, ×10 over 500 °C, ×2 dry: §4.3); perchlorate pitting 0.002 a sol while dust ≥ 0.2 | misfires and stoppages below 0.90; under 0.25 it will not fire |
| `foul` (0 to 1) | `FOUL` 0.0012 a round (carbon); ×1.5 with a suppressor | cleaning | stoppages (`JAM_FOUL` 0.02 × foul²) |
| `dust` (0 to 1) | Mars and its regolith (§9.2) | cleaning, a field wipe | stoppages (`JAM_DUST` 0.014 × dust²), misfires (0.002 × dust) |
| `lube` | cleaning applies the issue lube: `dry` film on Mars (the Corps' rule), `vac` for EVA and Europa's surface, `wet` from the ship's armoury | 300 rounds or 10 sols back to `none` | `wet` takes dust ×1.5; `none` doubles wear and adds 0.005 to stoppages |
| `frost` (0 to 1) | a cold-soaked gun brought into humid air (§9.5) | warming above 2 °C and a wipe | stoppages (+0.05 × frost) |
| `barrelC`, `gunC`, `roundC` | firing; the environment; a round's time in a hot chamber | cooling (§9.5) | heat, cook-off and barrel failure (§9.5); the cold soak (§9.6) |

### 9.2 Mars dust

Martian dust is fine (a few micrometres), clings by static, and gets into everything; real rifles jammed for the same reason in Earth's deserts. Each minute outdoors (my calls):

```
dust += DUST_PER_MIN 0.002 × area.dust × exposure × lubeK
area.dust: indoors 0, calm 0.2, breezy 0.5, a dust storm 1.0        (PLACES's env.dust)
exposure:  cased 0; port cover closed and muzzle cap on 0.2; port open (after firing, until closed) 1.0;
           lying in the dust (prone) ×3
lubeK:     wet 1.5, dry 1.0, vac 1.0, none 1.0
```

A field day outdoors in calm air with the covers closed adds 0.05; two hours prone on the range firing with the port open, 0.15; an hour of storm with the port open, 0.12 (0.18 with wet lube). A magazine gains half the gun's rate in a pouch, and +0.1 dropped in the dust. Dust in the magazine feeds into stoppages (§4.3). Perchlorates in the dust pit the metal if it stays (cond −0.002 a sol at dust 0.2 or more): clean the same day.

### 9.3 Cleaning

| Activity | Where (PLACES's `clean-weapon` use) | Time | Roll | Outcome |
|---|---|---|---|---|
| **clean the rifle** | the armoury's cleaning tables, a cleaning bench, a footlocker in the field | 30 min × `paceOf(WH)` × dirt (TIME's `clean-rifle`) | Weapon handling DC 9; taken steady at pressure `none` | foul 0, dust 0, frost 0, fresh lube; the belief's `cond` word updated; a function check at the end (§5.3) |
| clean the pistol | as above | 15 min × pace × dirt | DC 8 | as above |
| clean the L-20 / S-9 / V-5 / B-12 | as above | 45 / 35 / 20 / 20 min × pace × dirt | DC 10 / 10 / 8 / 8 | as above, and the S-9's optic |
| **field wipe** | anywhere | 5 min × pace | DC 6 | dust × 0.4, foul × 0.8, frost 0 if above 2 °C |
| clean magazines | as the rifle | 2 min each × pace | DC 5 | magazine dust 0 |

- **Dirt** (TIME's factor, mine to set): `dirt = clamp(1 + foul + 1.6 × dust, 1, 2)`. After a range day (80 rounds, two hours prone) it is about 1.3, after a field day 1.5, after a storm 2.0, as TIME's table expects.
- **Preconditions** (TIME §5.3): the gun in hand and believed unloaded. If the belief is wrong, the function check at the end of reassembly fires it (an ND-1 at an armoury table's clearing barrel, ND-2 anywhere else), and TIME's splash stops at that second.
- **Fumbles**: a `miss` costs time; `bad` loses a small part (the firing pin retaining pin, the classic: the gun will not fire until the armourer replaces it, a chit and 20 minutes at the window) or puts it back together wrong (tradecraft's `BADLY_COND`: stoppages ×3 until cleaned again). `disaster`, the same and the armourer hears about it.
- **What the cleaning leaves** (for the inspection, §10.3): `residual = max(0, 0.03 − 0.003 × margin)`, so a margin of 10 or more leaves nothing, a bare pass 0.03, and a miss more. Taken steady, a private at Weapon handling 10 makes margin 11 at DC 9 and leaves nothing: steady work is slow and sure (my call).
- The rifle stays field-stripped on the mat if the activity is interrupted; reassembly is lived steps (TIME §7.5).

### 9.4 The armourer's service

Operator cleaning does not restore `cond`; parts do. The armourer's limited technical inspection (LTI) keeps the gun 1 to 2 sols, replaces springs, extractor and gas rings, gauges the barrel, and returns it at `cond` 0.95 with `rounds` logged. It is due every 2,500 rounds or 90 sols (by then a rifle is at about 0.85, §4.3), or at once when the armourer finds `cond` under 0.5 at turn-in. A barrel past 15,000 rounds is replaced (my call), and so is any barrel whose `barrelHist.maxC` passed 600 °C (§9.5). The armourer's number is the only exact `cond` anyone sees.

### 9.5 Heat, vacuum and cold

**Barrel heat** (my call; numbers from M249-class practice, sustained 85 rounds a minute with a barrel change every 10 minutes, rapid 200 with one every 2):

```
barrelC += heatPerRoundC per round        (R-7, R-7M 2.5; C-7 3.0; L-20 1.5; S-9 2.0; V-5 1.5; P-12 2.0)
dT/dt = −kRad × (T⁴ − Tenv⁴) − (T − Tair) / tauConv     (T in K)
kRad: light barrel 2.6e-12, heavy 1.95e-12 /(K³ s)
tauConv: UN hull (101.3 kPa) 204 s; Mars valley 246 s; MCRN hull (66 kPa, 20 °C) 264 s; vacuum none
         (convection weakens with the air's density, about as ρ^0.63)
```

**[computed]** (vacuum figures start from a barrel cold-soaked to −150 °C on Europa's surface):

| | MCRN ship air (66 kPa) | Mars valley | Vacuum |
|---|---|---|---|
| L-20 at 200 rounds a minute reaches 400 °C after | 93 s (310 rounds) | 104 s (346) | 112 s (375) |
| L-20 at 85 a minute for 30 min on one barrel, peak | 447 °C | 411 °C | 749 °C: past 600 °C after 592 rounds, and nearly 2,000 rounds over it (the barrel fails) |
| L-20 at 85 a minute for 30 min, the Earth drill's change every 10 min (2 barrels), peak | 437 °C | 401 °C | 743 °C |
| the same with a change every 5 min | 392 °C (2 barrels) | 340 °C (3 barrels) | 667 °C (3 barrels) |
| L-20 at 25 a minute, an hour, one barrel, peak | 170 °C | 134 °C | 480 °C |
| R-7 at 30 a minute, 30 min, peak | 288 °C | 253 °C | 561 °C |
| R-7 at 90 a minute (three magazines in two minutes), 4 min, peak | 527 °C | 495 °C | 632 °C |
| cooling a heavy barrel from 400 to 100 °C | 6.0 min | 4.8 min | **46 min** |
| cooling from 400 °C to below cook-off (180 °C) | 3.3 min | 2.7 min | 21 min |

In vacuum a barrel loses heat only by radiation, and in an MCRN hull's thinner air it loses it more slowly than on Earth. So:
- **The Corps' L-20 drill** (my call, from the table): in ship air, a barrel change every 5 minutes of sustained fire (the Earth drill's 10 runs the barrel to 440 °C); on Mars every 10 minutes; **in vacuum, 25 rounds a minute is the sustained rate** (480 °C after an hour on one barrel), rapid fire is limited to 3 minutes a barrel with three barrels rotated, and a hot barrel needs 21 minutes to drop below 180 °C and 46 to 100 °C. The automatic rifleman on Europa's surface carries two spares, and a spare barrel is a treasure.

**Effects of heat** (my calls, from machine-gun and service-rifle manuals and gun-steel practice):
- over 250 °C −1 to the shot (mirage, a wandering zero); over 350 °C stoppages +0.01 and wear ×2; over 400 °C −3.
- **over 500 °C** the barrel glows dull red (about 525 °C is the Draper point: VIEWS draws it) and the throat erodes: −5 to the shot (keyholing) and wear ×10.
- **over 600 °C** gun steels lose their temper (the usual tempering temperature of chrome-moly barrel steel), the bore's chrome lining separates and barrels bulge: machine-gun manuals' barrel burn-out. Each round fired with the barrel over 600 °C risks **barrel failure**, `BARREL_FAIL` 0.0002 per °C over 600 a round (1% a round at 650 °C, 3% at 750 °C): 70% a **bulge** (the gun fires on at −6 and stoppages +0.05 until the barrel is changed or the armourer replaces it), 30% a **burst** (the gun is `broken`; the gunner's support hand takes BODY's 2-point burn and, half the time, a fragment wound). A barrel that has passed 600 °C is condemned at the next inspection even if it did not fail (`barrelHist`, §9.4).
- **Cook-off** (a closed-bolt gun with a live round left in a hot chamber): the round heats toward the chamber's temperature, `roundC → barrelC` with a time constant of 20 s (my call: a cartridge's brass and powder in contact with the chamber wall), and fires when `roundC` passes the round's own threshold, drawn from 180 to 200 °C from its stream (typical military propellants autoignite at about 170 to 200 °C). A round chambered and fired at once never warms (86 ms in an R-7 on automatic), so the danger is the round left in after firing stops. **[computed]** The lowest barrel temperature that can cook a round left in is 236 °C in an MCRN hull (in 48 s), 244 °C on Mars (43 s) and 202 °C in vacuum (70 s; no air cools the barrel meanwhile); at 300 °C it takes about 20 s, at 400 °C about 12 s. An R-7 reaches the point where a round left in cooks off within a minute after **100 to 120 rounds of rapid fire** in a hull, 110 to 145 on Mars, and 80 in vacuum, which is the range service-rifle manuals warn of (150 to 200 rounds of rapid fire in Earth's denser, cooler air). The instinct line knows it ("Barrel's hot. Clear it or keep it firing."); UNLOAD clears it; the L-20 fires from an open bolt, holds no round when it stops, and never cooks off.

**The gun's own temperature** (`gunC`) relaxes toward its surroundings with a time constant of 20 minutes in air and 90 in vacuum (radiation only). It drives powder temperature (§2.1, clamped to −54 to +52 °C), the cold rules (§4.3, §9.6) and frost.

**Frost** (the arctic rule, my call): a gun under 0 °C brought into air over 30% humidity frosts (`frost` +0.02 a second, to 1) until it warms past 0 °C; then the frost melts into the action. On Europa, rifles brought in from the surface stay in the lock's cold rack, as Earth's arctic troops leave theirs outside. A wipe after it warms clears it.

### 9.6 Cold soak

On Europa's surface a gun's temperature relaxes toward about 100 K (−173 °C) of ice and sky: an uncovered rifle passes −60 °C after about 48 minutes in vacuum and settles near −170 °C. Arctic lubricants and practice end around −50 to −60 °C; below that the real hazards are not the lube (my calls, after the review: tradecraft's lube rule alone would let a vac-lubed gun work at −170 °C):
- **Steel goes brittle.** Gun steels pass their ductile-to-brittle transition between about −60 and −100 °C: firing pins, extractors and bolt lugs can snap under the shock of firing.
- **Polymers and springs fail.** Polymer magazine bodies and followers crack, springs lose force, seals harden.
- **Primers become unreliable**, and below the propellant's tested −54 °C the velocity rule is not extrapolated (§2.1).

| Gun temperature | Misfire | Stoppages | Breakage | Magazines |
|---|---|---|---|---|
| −20 to −60 °C | as §4.3 | ×1.5 with `wet` lube (it thickens) | | |
| **−60 to −100 °C (cold soak)** | +0.5% | ×2 | a part breaks 1 round in 2,000 (the gun stops until a field spare or the armourer: the extractor 60%, the firing pin 30%, a bolt lug 10%) | polymer magazines feed badly: +1% stoppages |
| **below −100 °C (deep soak)** | +2% | ×4 | 1 round in 300 | a polymer magazine cracks 1 time in 20 when seated or dropped (`cond` to 0.3) |

The lube rules still apply on top (`vac` lube is the only one that does not stiffen), but no lube prevents the soak. The cure is to keep the gun warm:
- **The HAD WC-3 weapon cover** (Europa surface kit, my call): a low-emissivity drape over the receiver, magazine well and optic, open for the controls, the port and the muzzle, with a 5 W heater on the suit's battery (BODY §19.3: about 8% more draw on its 60 W, an hour less of battery in a 13-hour suit). Heated, it holds the gun above −20 °C indefinitely; off or with its heater dead, its insulation alone slows the soak about eight times (−60 °C after about 6 hours). Fitting it is a 6 s step (DC 5); the gun fires with it on. It is `fit.cover` in the gun's state.
- **Steel magazines** (the T30 and Tharsis-20) do not crack; the Corps' Europa issue adds a steel-bodied HAD-30S (my call, 0.3), and a marine without one keeps the polymer magazines in an inner, suit-warmed pouch.
- A gun brought in from the surface frosts (§9.5).

---

## 10. The armoury and accountability

### 10.1 The place and the people

PLACES builds the battalion armoury at Base Melas (its building, the window, the racks of 10 rifles with locking bars, the vault door, the clearing barrels outside the door, the armourer's bench); PEOPLE staffs it (a staff sergeant chief armourer and two armourers; the window open 06:30 to 17:30) and schedules the line (TIME's `armoury-line`). The ship's armoury and Europa's company armoury follow the same rules.

- **The weapons card** (CAREER issues it at check-in): the marine's name, unit and each assigned weapon's serial. A rifle is assigned for the enlistment: the same serial, the same zero card, the same quirks. "This is my rifle. There are many like it, but this one is mine." (the Rifleman's Creed; SETTING may voice it).
- **The rifle's book**: serial, rounds fired, LTI dates, faults, who had it.

### 10.2 Drawing a weapon

1. **The line** (skipped: ahead × 40 s, TIME), then **the window** (lived, 30 to 60 s of talk, PEOPLE): the card; the armourer reads the serial off the rack and hands the rifle over bolt locked open, Condition 4; you read the serial back (an Awareness check DC 5: a miss and you sign for the wrong rifle, which the next serial check catches); you look into the chamber (inspect, DC 6); you sign.
2. You draw what the block needs: the rifle with its optic and sling; empty magazines (7); the launcher for a grenadier; never ammunition, which is issued where it is used (§10.4).
3. You leave in Sul, muzzle down.

### 10.3 Turning a weapon in

1. **The clearing barrel** outside the door: UNLOAD SHOW CLEAR with the muzzle in the barrel, the duty armourer or an NCO the observer (§5.3). An ND here is ND-1.
2. **Cleaning** (§9.3), at the armoury's tables or before.
3. **The inspection at the window**: with `total = residual + foul + dust` at 0.005 or less there is nothing to find and it passes. Otherwise the armourer rolls Awareness against `DC = max(5, 30 − 400 × total)`: a gun cleaned at margin 5 (total 0.015) is turned back about 70% of the time by an armourer at 17, at margin 8 about half, one never cleaned at once. Turned back: "Clean it again" (10 minutes × pace, a new roll, the line again). So the choice at the bench is real: clean it at normal tempo in 30 minutes and risk the window, or take it steady in 60 and walk through. Three rejections in a sol is a "dirty weapon at inspection" (PEOPLE §11.3, severity 1). A part missing, or `cond` under 0.5: the armourer keeps it for LTI.
4. Racked, the card returned, signed.

### 10.4 Ammunition

- **Issue**: the unit draws ammunition from the ammunition supply point by count; on the range or the guard mount, the ammunition NCO issues it to each marine by count against their name (the issue record).
- **Use**: every round fired is counted by the gun (`rounds`) and, on counter magazines, by the magazine.
- **Return**: unexpended rounds handed back by count; brass collected (the **brass call**: the relay polices the berm until 90% of the brass is found: a working party if not); each marine's declaration: "I have no live rounds or brass in my possession" (lived, one line).
- **Reconciliation**: `issued = fired + returned + recorded losses`. Any live round unaccounted for stops the range: a shakedown (an Awareness search of each marine, PEOPLE) and a report. The gun's count is PEOPLE's physical evidence at office hours (PEOPLE §11.7).
- **Live rounds kept** in a pocket are an infraction found by any search or inspection (PEOPLE).
- **As built in v0.0.7, the KD's count** (`range.js`, `brass.js`; the build sheet 0.0.7 §8 items 19 and 24, the fixer's item 33; my calls). Each line's issue is its own ammunition issue line: the zero's four magazines of three at 10:00, the 300 m's one of five and the 200 m's two of five, given behind the splashes. **An issue counts its ball (`n`) and the coach's dummy apart (`dummy: 1`)**, so fired + back = n at the card on every line. **The brass call is lived at each line before leaving it**, by the player's own actions, done by T (the DI's line) or their panel rows: **police your brass** (`kd:police`, §2.8), **unused rounds back to the coach** on the line (`kd:turnIn`: the magazines and the rounds in them, the empties too; the ammunition point's walk is 0.0.8's) and at the end **the declaration** (`kd:declare`, "No brass, no ammo": the brass policed against the rounds fired, and no rounds held). A command left undone moves on after 60 s with the coach doing it for you, a fault each time; a false declaration is a fault the coach makes right, never a dead end. An ND's chambered round, cleared by the coach, goes back with the rest. Measured: brass policed equals fired on every seed run in review. Whether the unused rounds go back only at the course's end, as on many ranges, is left to the lead (DESIGN.md's log, 2026-11-07).

### 10.5 Sensitive-item checks

At every formation under arms the NCO calls for serials; in the field every 4 hours and at every halt (my call). A check is part of the formation's minute (lived, or skipped with the block). It is where a lost weapon, a swapped rifle or a missing optic is found.

### 10.6 A lost weapon

The worst thing a marine can do to a weapon short of an ND that hurts someone (PEOPLE §11.3: severity 3, "a lost weapon locks the base down").

1. **Lost** means out of the holder's control and not where they believe it is: put down and walked away from (more than 10 m and out of sight), dropped unknowing (a fumble in the dark, a free-floating drift on EVA), taken.
2. **Noticed**: by the holder when they reach for it or change posture (the instinct line within 30 s for Weapon handling 15 and up, within 10 minutes under 8, my call), or at the next sensitive-item check; by anyone who finds it (a marine reports it; on Europa an insurgent takes it).
3. **The response** (PEOPLE, TIME): the company is locked down (an interrupt), the area searched (an activity of the last known places, 12 to 72 hours), a missing, lost, stolen or recovered report filed, the battalion told.
4. **The bill**: found negligent, the marine pays the replacement value (R-7 1,400 MCR, P-12 450, the SO-4 600; CAREER's pay).
5. **A weapon in enemy hands** on Europa is a story (PEOPLE's arcs, COMBAT): it can turn up at a checkpoint, its serial read.

### 10.7 Records

```json
"armoury": {
  "i7": { "assignedId": "p233", "rackId": "f:armoury:rack-e2#14",
    "loc": "armoury", "out": null, "zeroCard": [{ "where": "Melas KD range", "rangeM": 400, "angleMrad": 1.576, "atMs": 1784000000 }],
    "lti": { "lastMs": 1700000000, "roundsAt": 1210 }, "rounds": 1247,
    "log": [{ "atMs": 1786000000, "what": "out", "toId": "p233", "byId": "p147" }] }
},
"ammoIssues": [{ "id": "ai88", "atMs": 1786100000, "area": "melas.ground", "toId": "p233", "cal": "6.5x40r",
                 "load": "ball", "n": 60, "returned": 2, "fired": 58, "brassBack": 54 }]
```

The armoury's records are keyed by the gun's item id (`i7`, CONTRACTS §10): the model is on the item's record, and the serial on the weapons card stays a hash of the id. The rack's slot is a spot of its fixture (`f:armoury:rack-e2#14`), the armourer an ordinary person id (`p147` here), an issue a counted `ai<n>`, and its place a PLACES area id (the KD range's lines lie on the Melas ground, PLACES §1.3 and §4.12).

### 10.8 The rifle in the routine

On base the rifle lives in the armoury and comes out for the range, the field and the MOUT exercise; guard comes round about 1 sol in 30 (PEOPLE §4.3). Over a standby of 10 sols and its slip (`STANDBY_SOLS`, CONTRACTS §3) that puts a weapon in the player's hands on 3 to 5 sols, and pillar 2 ("The gun is a machine") would be absent from most of 0.1. So the routine itself handles weapons (my proposals, after the review; PEOPLE owns the roster and the Plan of the Day's templates, TIME the activities, CAREER the standby calendar, and each decides):

- **The ready platoon's guard.** 2/4 holds the Corps' Alert Battalion watch (SETTING) on 96 hours' notice (CAREER §5.4), and on standby its ready platoon furnishes the base's interior guard: the **main gate** and the **ammunition supply point**, with three reliefs of **2 h on and 4 h off**, in **Condition 3**, under the general orders (SETTING voices them). Rotated through the platoon's juniors, it puts a new join on a post **about once a week** (against PEOPLE's 1 in 30 sols for the company's base guard). What WEAPONS gives it:
  - **Guard mount**: the inspection under arms (the sergeant of the guard looks at the rifle, the magazines and the marine: a dirty rifle here is PEOPLE's "dirty weapon at inspection"); the ammunition issue by count against the name (2 HAD-30 magazines of 30 ball, §10.4); **LOAD at the loading point**, muzzle in the clearing barrel, the sergeant of the guard watching: Condition 3.
  - **On post**: patrol or slung front (§6.2); the habit check against every car and walker at the gate (§6.3: a gate is a crowd at shift change); the challenge, the ID check and the escalation of force are COMBAT's and PEOPLE's; the sensitive-item check at every relief (§10.5).
  - **The relief**: UNLOAD SHOW CLEAR at the clearing barrel under the corporal of the guard, the rounds counted back into the issue record. A round left in a chamber, a magazine short, a round in a pocket: each is found here, and an ND here is ND-1 at the barrel or ND-2 off it (§6.6). These are the weekly real stakes: live rounds, a tired marine at 02:00, and a show clear that matters.
- **The daily weapons drill** (TIME's `weapons-drill`, 20 minutes in the `maintenance` block, CONTRACTS §4, on every working sol without a range or field block). Draw at the window with the show clear; at the cleaning canopy's drill line or the squad bay's drill wall, with **drill rounds only** (the orange dummies, §2.3, filled from the drill box), the squad leader or the fire team leader calls the Corps' commands (§5.3): LOAD, MAKE READY, dry fire on the wall's target (the trigger press, the reset), RELOAD (speed and tactical, from the pouches), IMMEDIATE ACTION and REMEDIAL ACTION on stoppages the NCO sets with dummies and an empty case (a stovepipe, a double feed, a dummy that clicks), UNLOAD SHOW CLEAR; then turn-in with the show clear. Every step is the real rolled step (§5.2), in the log. It is **lived the first time** and skippable after (TIME §9.3: "the first time is lived"; the skip rolls each step and stops at a beat). It gives 20 minutes of Weapon handling training a sol (SKILLS §6.3's hours) and keeps rust off (SKILLS §7). It is safe by construction, so its stakes are the habit: a fumbled step leaves a `?` on the weapon card, and the squad leader sees whether you check it. The one live danger is a round someone kept from the range (§10.4: "live rounds kept"): a dummy box with a live round in it is a PEOPLE quirk's story, and the drill's opening show clear is what catches it.
- **The show clear at every draw and turn-in stays lived**, every time (about 8 s at WH 10, one key: §5.3): the armoury line's queue is skipped (§10.2), the window and the clearing barrel never are.

With these, the rifle comes out on every working sol (the drill, the range, the field) and live on post about once a week. A two-week standby gives about a dozen draws and as many turn-ins, 6 to 8 drills, and two guard days of four posts each, every post a LOAD and an UNLOAD SHOW CLEAR at the barrel: each a chance for the checking habit, and the guard's a chance for a negligent discharge with real stakes.

---

## 11. Qualification and the range

CAREER owns the schedule (annual, at least 300 days apart), the bands, and what a class gates; WEAPONS owns the course, the targets and the rolls (CAREER §7.4).

### 11.1 The annual rifle qualification

The Corps' known-distance course in metres on Mars (my call, modelled on the US Marine Corps' long-standing known-distance course and its scoring), shot with the rifle as issued (the R-7 and its SO-4 at 4×), on Base Melas's KD range:

| String | Range | Position | Rounds | Time | Target |
|---|---|---|---|---|---|
| 1 | 200 m | standing, slow fire | 10 | 10 min | A |
| 2 | 200 m | sitting, rapid fire, a magazine change (2 + 8) | 10 | 60 s | A |
| 3 | 300 m | kneeling, slow fire | 5 | 5 min | A |
| 4 | 300 m | sitting, slow fire | 5 | 5 min | A |
| 5 | 300 m | prone, rapid fire, a magazine change (2 + 8) | 10 | 70 s | A |
| 6 | 500 m | prone, slow fire | 10 | 10 min | B |

- **Targets**: the A target (`targetDC` −11; radius for bias 30 cm) and the larger B (`targetDC` −13; 45 cm). Both are scored by rings decided by the roll's margin, as tradecraft's `paper.js` `RINGS` did: **5** at margin 9 or more (a V at 13: the tie-breaker), **4** at 5 to 8, **3** at 1 to 4, **2** at −3 to 0 (the target's edge), a miss below; a natural 20 scores at least 2 and a natural 1 is a miss.
- **The DC**: 200 m 17, 300 m 20, 500 m 21, against positions +0 to +4, the optic +5, the held aim +4 in slow fire and +3 in rapid (the clock leaves less to hold).
- **The wind** is the day's (PLACES's weather: 0 to 8 m/s across the range in the afternoon), read by the shooter and called by the coach (+0.2 to the read, §7.4).
- **Score** out of 250; **CAREER's bands**: Expert 220 to 250, Sharpshooter 210 to 219, Marksman 190 to 209, unqualified under 190 (re-shoot within 30 days). The class is worn as a badge on the uniform (SETTING's insignia) and goes on the record (CAREER).

**What it gives, by Marksmanship** (5,000 shooters each, rested, no other modifiers) [computed]:

| MRK | Mean | SD | Expert | Sharpshooter | Marksman | Unqualified |
|---|---|---|---|---|---|---|
| 6 | 184 | 14 | 0% | 3% | 34% | 63% |
| 8 | 201 | 12 | 5% | 20% | 58% | 16% |
| 10 | 215 | 10 | 33% | 37% | 29% | 1% |
| 12 | 225 | 9 | 75% | 20% | 5% | 0% |
| 14 | 232 | 8 | 93% | 6% | 1% | 0% |
| 18 | 238 | 8 | 99% | 1% | 0% | 0% |

So the qualification is a fair measure of the skill, and the day's body still moves it: tired (−1 to −3), cold hands, a hangover, or a bad night costs a class (BODY's modifiers apply to every shot). A private (10) is a coin flip between Expert and Sharpshooter; a boot-camp graduate (8) is mostly Marksman.

**As built in v0.0.5, the 25 m card** (`src/sim/arms/paper.js`; the build sheet 0.0.5 §8 items 5 and 21): `PAPERS.card25`, 30 × 30 cm, `targetDC` +6 (tradecraft's bull's "precise work"), so DC 19 at 25 m; scored by these rings (`KD_RINGS`: V from margin 13, 5 from 9, 4 from 5, 3 from 1, 2 from −3, a miss below; a natural 20 at least a 2, a natural 1 a miss), each hole placed by hash within its ring's band (`BANDS` × `ringCm` 2.5: the V inside 1.25 cm, the 5 to 2.5, the 4 to 5, the 3 to 7.5, the 2 to 10 cm). The rings stand; the plaque's figure on a card is the chance of a hole, not of the DC (§7.10; open question 9). A string of fifteen held scores 59.8 of 75 on average at Marksmanship 10 (49.0 unheld), from 49.0 at 6 to 70.3 at 18.

**As built in v0.0.7, the KD faces and the course's cut** (`paper.js` `PAPERS.kdA`, `kdB`, `src/data/courses.js` `KD_STRINGS`; the build sheet 0.0.7 §8 items 2 and 11, my calls). The A face is 100 × 100 cm with rings of 7.5 cm (the black 15 cm), the B face 120 × 120 cm with rings of 11.25 cm; the rings above score where the hole lands (§7.4: the margin sets the spread, the zero, path, wind and hold move it). test-range shoots three strings of its own, not the qualification: the zero at 25 m (three-round groups, §11.4), the confirm at 300 m prone, five rounds slow fire in 300 s, each marked, and **the 200 m string sitting, ten rounds rapid in 60 s as 5 + 5 with the magazine change inside the string** (`mags: 2`; the table's 2 + 8 cut so the change comes mid-string), marked together after. That string is the one written exception to one magazine a string: the tower does not call the RELOAD, no `onemag` fault is drawn for the second magazine, and the panel's one-magazine mark is skipped while a written change is left (`handling.js` `oneMagWarn`). Measured on MRK 10 prone at 300 m: 4.50 a shot in still air, 3.34 with 4 m/s uncorrected, 4.34 held for the coach.

### 11.2 The pistol course

For those who carry a pistol (officers, staff NCOs, MPs, gunners): 40 rounds, a torso target (`targetDC` −2), rings by margin 10 / 9 / 8 / 7 at 9 / 5 / 1 / −3 (my call):

| String | Range | Position | Rounds | Held aim |
|---|---|---|---|---|
| 1 | 7 m | standing, from the holster, 2 × 5 in 10 s | 10 | +1 |
| 2 | 15 m | standing 5, kneeling 5 | 10 | +3 |
| 3 | 25 m | standing 10, kneeling 10 | 20 | +4 |

Out of 400: Expert 360, Sharpshooter 330, Marksman 300 (my call). [computed] MRK 10: mean 335, Expert 4%, Sharpshooter 62%, Marksman 33%; 14: 360, Expert 56%; 18: 373, Expert 85%.

### 11.3 The range day

TIME runs the block (the range: opening, relays, the brass call, closing; in CAREER's standby, career sol 2, with no qualification shot there, CAREER §5.4) and decides what is lived; this is what happens in it.

- **Opening**: the safety brief (the range safety officer's rules, §6.4, are in force from here), ammunition issue by count (§10.4).
- **Zeroing** (CAREER's career sol 2, and on arrival on another world): §11.4.
- **The relays**: two relays; one shoots while the other is in the **pits** pulling and marking targets (the KD range's real rhythm). Pit duty is livable: lived the first time, skippable after like any block (§11.5). Each string is lived in stop motion or **shot as a skip**: the string is rolled shot by shot with the shooter's modifiers at the start of the string, every roll in the log (TIME §9.3: "each skipped relay is resolved by WEAPONS' shot rolls"). A mishap (a stoppage the skip cannot clear, an ND) stops the skip at that second.
- **The coach's dummy round** (tradecraft's `snap`): on familiarisation days the coach slips an orange dummy 2 to 4 rounds down a magazine; it clicks, and the marine does immediate action. The log says what it was after.
- **Stoppages on the line** are cleared by the shooter in stop motion; time keeps running on a rapid-fire string, which is where the skill shows.
- **Closing**: unload, show clear to the line safety; the brass call; the declaration; the paper (TIME's paper: score, string by string, the class).
- **Scoring paper**: the target face with holes placed by hash within their rings (tradecraft's `paper.js` hole placement, which never moves a roll).

**As built in v0.0.5, familiarisation fire on the 25 m line** (`test-handling`, "Show clear": `src/sim/scenarios/handling.js`, `src/data/courses.js`; the build sheet 0.0.5 §8 items 4 to 6, my calls): a new join alone on a lane (2 to 5, drawn), the relay beside them waiting for `gunner.js` at 0.0.7; three magazines of five at 25 m, prone, kneeling and standing, on the tower's commands (COMBAT §3.3). **The coach's set stoppage is procedural**: a dud (an orange dummy, weight 40), a light load that short-strokes into a stovepipe (35) or a round seated proud for a double feed (25), on the 2nd or 3rd magazine's 2nd to 4th round, drawn on `stream(seed, 'arms:set', course)` and riding on its magazine as tradecraft's `mag.dummy` (§4.1). It is cleared once the gun holds no jam, case or dud (a double on a magazine's 4th round leaves the bolt locked on the empty magazine), and the coach then says what he set, in that same string ("That double was mine. Lock, strip, rack: done right."). **The coach's string lines count the shots fired** (the integrator's): a string the set stoppage cut to four is "Four of four on the paper.", never "five"; **his tip follows how it was shot** (the fixer's): haste lines only where a shot was rushed or not held to +4, a string held throughout "The hold was right. Same again.", a lone natural 1 "One went wide. That happens; the rest were good.". The DI's and the coach's "front sight" is the reticle: the R-7 carries the SO-4.

**As built in v0.0.6: the course never dead-ends** (`handling.js`, `src/data/courses.js` `NEEDS_ROUNDS`, `COACH`; the build sheet 0.0.6 §9 items 27, 28 and 36; the user's rule, 2026-11-07, DESIGN.md's log: "A scene never dead-ends"). In v0.0.5 a shooter who had fired the course's rounds early stood at "Standing. RELOAD." with three empty magazines, and the tower waited for ever.
- **The coach's check**: once a command that wants rounds (`NEEDS_ROUNDS`: LOAD's magazine in, MAKE READY's Condition 1, a string's empty lock, the RELOADs' `kneel1` and `stand1`) has waited `checkMs` 3 s of lived time, with no stoppage in the rifle, **still or not** (the fixer's: a shooter busy reaching, looking and dropping in stop motion had drawn a `slow` fault before the coach said a word), except at a string fired to its last round, where he waits for stillness, the coach counts what the shooter has (`roundsLeft`: the chamber's live round, the magazine in, the hand's, the pouches', those at the feet). None, and he says "Nothing left to load. You sit this one out, on safe."; the session is dry (`R.dry`), and the DI's reload line says "Nothing left to load. Tell your coach." (SKILLS §14.4). **Every string left is sat out** (`R.sat`: the range officer takes "no rounds, on safe, in the stance" as ready), scored as not fired ("That string goes down as not fired."; the end card "1 string not fired"), and the course runs on to UNLOAD, SHOW CLEAR and its score card.
- **The line moves on**: a command not answered after `moveOnMs` 60 s of lived time (the nudge at `nudgeMs` 30 s, as before) is passed over with a **`slow` fault** in the coach's words ("The tower will not wait for you. Keep up."), the next command posted after the usual gap; **a dry shooter is never faulted `slow`**, the check coming before the move-on. At UNLOAD, SHOW CLEAR a rifle never shown is taken, cleared and shown by the coach himself (`coachClears`: the magazine to a pouch, the chamber and a double's loose round thrown, the bolt home, cocked, safe, the port shut, slung front), **once** ("Clear."; in review a shooter busy with steps after it drew a `slow` fault and "Clear." every second, 342 of them, and the line never closed). Time standing still in stop motion never counts, so choosing is never hurried. A shooter pressing nothing from the brief reaches the end card at +9.4 minutes with nine `slow` faults; a shooter pressing random legal keys reached it on all 30 runs tried, within 9.0 game minutes.
- **The user's own save** (`tests/saves/v0.0.5-handling-nomags.json.gz`, the report's state) plays to the end card "Clear at 09:02 · 70 of 75 · 7 V · 1 string not fired · 2 faults" and its score card.
- **Setup `mixed`** (`?play=test-handling&setup=mixed`, `?play=test-handling-mixed`, the Tests menu's "Show clear, mixed magazines", scored apart): the `range-mixed` kit (§3.3), a fourth magazine of five tracer, second in chest pouch 2, its count told and its kind not; the coach's brief says so ("One of your magazines is tracer: the course is ball."). The course stays all ball (familiarisation fire); the tracer is its own ammunition issue line (`R.issueIds`), a tracer fired counted there and no fault; LOAD by rule never takes the tracer once a ball is known.

**As built in v0.0.7: the relay is alive** (`src/sim/arms/gunner.js`, `src/sim/scenarios/range.js`; the build sheet 0.0.7 §8 items 10, 22, 23 and 27, my calls). On `test-range` the relay is **you and five of your squad**, on the bay's six lanes, then on KD lanes 6 + your bay lane (7 to 12), keeping their order; **relay 2**, six more, are the pullers in the pits; one coach, yours. Each gunner is tradecraft's `gunner()` ported: every handling sub-step through `doAction` with its time, roll, fumbles and NDs, the rifle brought up before a handling step, the aim held to +4 in slow fire and +2 in rapid, the pull through the same shot model at its own face. **Each gunner combines its own zero holes** (`G.zeroHoles`, `paper.js` `poolOf`), believes the zero it dials, and dials each line's sight setting from it (the believed zero + the dope card); its hold is `holdFor` its own read of the flags. **The relay's handling rolls are on its own saved stream** (`doAction`'s `rng: 'relay'` option) **and kept out of the log** (`log: false`: no log entry, no `roll` fact; the `nd` fact stays), as are its shots: J is the player's, the relay's scores go on the card and their shots are facts with their `who`. A gunner answers the tower and nothing else (no take-in: COMBAT §25 is 0.0.7b's). **Slow fire waits for the mark**: a gunner's `mark` sub-step until its face is up with its last shot marked, at most `MARK_WAIT_MAX_MS` 30 s. Relay 2's own confirm is rolled shot by shot behind the pits' splash (`skipString`, on the `relay2` stream), their best named in the pits' toasts. The walks between lines are behind splashes, so the gunners and the coach are placed at the next line at the splash's end; only the corpsman moves in sight, in a straight line. Measured: 900 relay shots over 12 seeds, none on a cold line, none forward, all on safe after CEASE FIRE; the relay scored 53 to 70 of 75 in review. The end card ranks relay one with you (VIEWS §7.5).

### 11.4 Zeroing

A 20-minute range activity: 9 to 12 rounds, three-round groups adjusted onto the aim point at 25 m and confirmed at 300 m (on Mars). One Marksmanship roll at DC 12 (prone, supported, coached) sets the zero: `superb` and `good` exact; `pass` 2 cm off at the zero range; `miss` 4 to 6 cm off (a permanent holdover bias until re-zeroed). The zero records its environment and its sight angle (§2.5). The battalion re-zeroes at Callisto's range before Europa. The 300 m confirmation is marked from the pits (§11.5).

**As built in v0.0.7** (`paper.js` `zero25`, `groupOf`, `poolOf`, `callOf`; `range.js`; the build sheet 0.0.7 §8 item 7; my calls). Zeroing is lived, not one roll: three-round groups prone on the 25 m zeroing card, 30 × 30 cm on a 1 cm grid with the BZO's mark −2.7 cm under the aim box (§2.5), its **rings 1 cm** (the sheet's 2.5 cm let a three-round group's centre wander about 1.7 cm, 7 clicks, and left 35% of rifles zeroed within four groups with 20 cm of error at 300 m; at 1 cm the error at 300 m is about 8 cm). At the tower's "read your groups" **the coach combines every group since the first** (`poolOf`: each hole moved by the clicks dialled since) and the group card shows that combined centre; his call is the clicks from it to the mark ("Your group is low left. Ten up, four left."), waiting on the panel (`sight:call`). Within `ZERO_OK_CM` 1 cm each axis he writes the zero down ("Zeroed. Leave it."), else the next group, at most `ZERO_GROUPS_MAX` 4, then "Close enough for today" and the turrets written down all the same. Pooled, 100% of rifles zero within four groups (87.6% reading each group alone). The zero card is not scored. The confirm at 300 m is fired at the dope card's 3 down, and the coach's call after two marked hits moves the believed zero.

**As built in v0.0.8: a call counts as dialled however the turrets reach it** (`shooting.js` `callReached`, `shot.js` `zeroingOf`; the user, 2026-11-07: "I dialed in the coaches corrections, the UI still says that I'm on zero ?"). Dialling the coach's call turns the turrets and moves the believed zero by the same clicks, so the plate and the card, the sight against the believed zero, read ON ZERO again. **While the rifle is being zeroed they show the clicks dialled in this zero instead** ("ZEROING ▲4 <2", VIEWS §4.4, §7.4), counted **from the turrets' issue setting** rather than from a snapshot of the believed sight at the zero's start (my call: it never moves when a call is dialled, it adds the coach's and the player's own clicks, it is seen and never the truth, it keeps nothing in the save, and on the KD course both start at 0, 0). A call dialled by the row (`sight:call`) or by the keys (Z S, Shift with Q D) is marked dialled once, the believed zero moves by the call's clicks, and the log says "Dialled fourteen down, seven right: the zero moves with it." (it was the step's text only, never in the log); on the keys it had stayed marked as not dialled in v0.0.7, so "Dial the coach's call" outlived "That is your zero. Leave the turrets alone." and pressing it dialled the call a second time (seed 99: ▲17 to ▲34). At the 300 m confirm a dialled call moves the believed zero and the dope with it, so the plate and the card read ▼3 before and after, and the log line is the sign of the dial (a brief "ZERO ▲4 ▶6" term there is possible, left for the lead).


### 11.5 The pits

Pulling and marking targets is the known-distance range's real rhythm, and the brief asks for "the everyday training looking like what it should be" (2026-11-05). So pit duty is a lived activity like any block: **lived the first time** (TIME §9.3), and after that the player chooses, live it or carry on (my call, after the review; it replaces the first version's skipped splash).

- **The place** (PLACES builds it at the KD range): the **butts**, a concrete trench below the target berm's crest, with a row of **target carriages**, each a counterweighted frame on rails that one marine hauls down and runs up, a bench of paste pots and brushes, the spotter discs, the scoring discs on their poles, the red flag, and the pit phone to the tower. A pit NCO walks the line.
- **The crack overhead**: every round passes 2 to 4 m over the butts, supersonic (§2.7), and its crack is the sound of the pits (VIEWS and the audio direction). It is not COMBAT's suppression: the berm is cover and everyone knows it. A new join flinches for the first relay (Awareness −1 to marking: "You duck at every crack"); after that, nobody does.
- **Marking a slow-fire shot** (the puller's steps, each a step in the panel, lived in real time): hear the shot and feel the frame shudder; haul it down (2 s); **find the hole** (an Awareness roll, DC 6 in daylight, +3 when the hole is in the black where it is hard to see, +4 at dusk, +2 if two holes are close: the hole's place comes from the shot's hash within its ring, §11.3's scoring paper, so the roll and the paper agree); plug a **spotter disc** in it (white in the black, black in the white); hang the **scoring disc** for its value (5 to 2) on the frame's edge; paste over the last shot's hole; run it up (2 s). A miss is waved off with the red flag ("Maggie's drawers"). In rapid fire the targets stay up for the string and are marked together after it.
- **What the shooter reads**: the spotter and the disc, seen through the optic, are the shooter's only knowledge of where the last shot went (§7.10's belief, "we only know what we know"). A true mark lets the shooter correct: +0.1 to the next shot's wind read (`windCorr`, within §7.4's cap) and the holdover set right. A **mismark** (the puller's Awareness failed: the spotter in last shot's hole, a hit waved as a miss, the wrong value) misleads the next shot by −0.1 and puts the wrong value in the score book. The shooter may **challenge** a mark (a step at the line, about 1 minute: the tower calls the pits, the pit NCO reads the target, and the true value stands): a shooter at Marksmanship 14 and up calls their own shots (SKILLS' feel), so the instinct line says when a mark disagrees with the call ("That was a five, not a three"). An unchallenged mismark stands in the book, as on a real range; the paper (§11.3) still shows the true holes.
- **The player in the pits** marks NPC shooters' targets with the same rolls, so a careless puller can cost a squadmate a class, and a squadmate's shooting is seen from below (PEOPLE's gossip may carry it either way).
- **Carried on**, a pit relay is resolved in closed form: the puller's Awareness for each shot marked, every roll in the log; a mismark on a shot is a small beat (TIME §9.4), and a challenge against your mark is a big one (the pit NCO comes along the line).
- **Length**: a pit relay lasts as long as the firing relay above it (the course, §11.1, takes about 45 minutes a relay with its slow-fire strings and changes); a range day's rotations add up to about 2 hours in the butts.

**As built in v0.0.7** (`src/sim/arms/pits.js`, `range.js` `onPitEvent`; the build sheet 0.0.7 §8 item 12 and the fixer's items 28, 29, 34 and 39; my calls). The player does not pull this round: the pits are lived from the line at 300 m, seen in the far window (VIEWS §2.4), and skipped behind the `kd-pits` splash of 20 minutes while relay 2 fires. **Marks are true** (mismarks and challenges wait for `qual.js`). A shot at a face posts, after its flight time and `PIT_REACT_S` 0.8 to 2.0 s, the carrier going down over `CARRIER_S` 2 s, the hole found by the puller (relay 2's marine on that carrier, else the pits NCO: Awareness against DC 6, +3 in the black, +2 with another hole within 5 cm), taking `MARK_S` 2, 3, 4 or 6 s by grade (superb, good, pass, fail), the spotter in it, the carrier up, the score disk on its pole for 4 s (a miss, the red flag for 3 s). **A face's height is the pits' record at the moment** (`pitView`, `faceUpAt`; never stored, never a jump): a shot arriving while a carrier rises waits for it, and **a face under half up (`FACE_DOWN_UP` 0.5) takes no score**: the round goes over into the berm, unmarked, for the player's rounds, the relay's and an ND's alike. **Slow fire waits for the mark**: the player's Fire is marked "! wait for your mark" (never struck) while the last shot is unmarked, with a `wait:mark` row of `MARK_WAIT_MS` 20 s that ends as the disk or the flag goes up, which T does; a gunner waits up to 30 s (§11.3). **The rapid string is marked together after CEASE FIRE** (`RAPID_MARK_S` 12 s), the far window holding on your face until its holes have been up `FAR_MARK_HOLD_S` 6 s, and the coach reads the string whole ("Off the rings" for a 0). The coach's confirm call comes after two marked hits of yours. At 200 and 300 m where the round went is the pits' and the coach's to say, not the log's (§7.10).

---

## 12. Grenades and explosives

### 12.1 The catalogue

| Item | Mass | Filler (TNT-equivalent) | Fuse | What it does | First |
|---|---|---|---|---|---|
| **G-9** fragmentation grenade | 400 g | 0.24 kg | 4.0 to 4.8 s (each grenade's own, from its stream) | a pre-fragmented liner of about 3,000 steel balls (2.4 mm, 0.057 g; 170 g of the 400) (`K` 160, §12.3); lethal radius about 5 m, half the people standing in the open hit at 15 m (the usual figures for M67-class grenades) | 0.3 (0.1: the practice G-9P) |
| **G-9P** practice | 400 g | a spotting charge | as G-9 | a puff and a bang; the grenade range | 0.1 |
| **G-11** stun | 380 g | flash composition | 1.5 s | 7 Mcd flash, 170 dB at 1.5 m (§12.5) | 0.3 |
| **G-12** smoke | 600 g | | 1.5 s | 90 s of screening smoke in still air (§12.5) | 0.3 |
| 40 mm **HEDP** | 230 g | 0.032 kg and a shaped charge | arms at 15 m, impact | a 50 mm RHAe jet (the usual figure for M433-class rounds); fragments `K` 18 (an effective casualty radius of 5 m, the published figure for M433-class rounds) | 0.3 |
| 40 mm **TP** practice | 230 g | chalk | impact | a puff | 0.1.x |
| 40 mm buckshot, baton, smoke, illumination | | | | buckshot 20 pellets, as the 12-bore at 0.9 the energy; baton 145 J, less-lethal; illumination: a parachute flare on Mars (40 s), a falling star on Europa | 0.3 |
| **BC-1** linear cutting charge | 0.8 kg | 0.3 kg, shaped | electric | cuts a door-sized frame in 6 mm steel or 12 mm aluminium (Demolitions, COMBAT's breach) | 0.3 |
| **WIC** water-impulse charge | 2.5 kg | 0.15 kg behind 2 L of water | electric | punches a door in with little fragmentation | 0.5 |
| **thermite** hatch cutter | 1.2 kg | | 90 s burn | cuts a hatch seam, no blast, smoke and heat | 0.5 |
| **Compound-9** block | 0.57 kg | 0.75 kg | cap and timer | demolition (SKILLS' Demolitions) | 0.6 |

### 12.2 Throwing in each gravity

**One throw sequence** (settled after the review, which found WEAPONS and COMBAT §11.1 with different steps and DCs; this is the one both use, my call). Base seconds at value 10, × `paceOf(Weapon handling)` for the handling steps:

| Step | Base s | Roll | Notes |
|---|---|---|---|
| **from the pouch** (open, grip the lever) | 1.4 | Weapon handling DC 6 | COMBAT's time; a pouch flap in gloves takes the glove penalty |
| **pin** (pull it, the lever held) | 0.5 | Weapon handling DC 8 | the fumble ladder below |
| **cook** (optional) | 1 or 2 | none | the lever released and counted; the fuse is running |
| **throw** | 0.7 | Marksmanship (where it lands) | COMBAT's time |

So a grenade is in the air 2.6 s after the decision at value 10 (3.5 s at a recruit's pace). Throw speed `v = min(20, 14 + 0.25 × Fitness)` m/s, × 0.85 in a pressure suit, × 0.7 in a hard suit (my call; a good throw is 18 m/s).

| | Earth or 1 g | Mars | Europa |
|---|---|---|---|
| farthest throw at 18 m/s (45°) | 33 m, 2.6 s aloft | 87 m, **6.8 s** | 247 m, 19 s |
| at 15 m/s (suited) | 23 m, 2.2 s | 60 m, 5.7 s | 171 m, 16 s |
| a low throw to 25 m at 15 m/s | out of reach | 12°, 1.7 s | 4°, 1.7 s |

[computed, no drag: a 0.4 kg sphere barely notices the air] On Mars a lob takes longer than the fuse: the grenade bursts in the air unless thrown flat, so marines throw low and skip it in. The panel picks the low solution and shows the flight time against the fuse.

- **The roll** (one DC for both sections): `DC = 8 + round(5 × log2(max(d, 5 m) / 5 m))` (5 m 8, 10 m 13, 20 m 18, 40 m 23: the shot's logic, each doubling of distance costing the same), +4 through a doorway, +6 through a hatch, +8 through a port or a window, +3 in a gravity the thrower is not conditioned to (COMBAT's rule: BODY's G-conditioning and SKILLS' local experience; a spin habitat counts, §2.9). The landing error is COMBAT's: on success within `0.5 + 0.03 × d` m of the aim point, on failure `1 + 0.5 × |margin| + 0.08 × d` m off, in a direction from the throw's stream. It then rolls `U(0.5, 2) × √(9.81/g)` m on a hard floor (Mars 0.8 to 3.2 m, Europa 1.4 to 5.5 m), a third of that on regolith. In free fall it never stops: it bounces off walls with restitution 0.4 until the fuse. In a spin habitat its flight is §2.9's straight inertial line.
- **Fumbles**: `bad` on the pouch or the pin drops it at your feet, pin in (harmless; picking it up is 1.0 s); `disaster` on the pin drops it with the lever gone: a live grenade at your feet and TIME's reflex card for everyone within 15 m (kick it, throw it, dive, nothing; "nothing" is always an option, tradecraft's reflex rule). A natural 1 on the throw with Weapon handling under 10 slips at release and drops it at your feet, armed ("Grenade!": COMBAT's rule). A cook past the fuse is a burst in the hand: the fuse is drawn when the lever flies, from 4.0 to 4.8 s, and a 2 s cook is always safe, a 3 s cook is not (my call).

### 12.3 Fragments

**One fragment helper** (WEAPONS owns it; COMBAT §11.2 and §11.6's spall call it; settled after the review, which found COMBAT's `λ = 25 / r²` ten times weaker than the M67 class at 15 m and this section's first `K` 120 a little weak):

```
fragHits(burst, person) ~ Poisson(λ),  λ = K × exposure × (1 − keeps) / max(r, 0.5 m)²
K:        the item's (G-9 160, HEDP 18, a spall burst 10: COMBAT §11.6's bad breach)
exposure: standing 1, kneeling or crouched 0.6, prone 0.25 (a body flat on the floor offers little to a floor burst)
keeps:    the cover between, by §8.2 against each fragment (COMBAT's cover geometry finds it)
```

`K` is the burst's fragment flux at 1 m (about 3,000 balls over 4π: 240 per m²) times a standing man's presented area (about 0.67 m²), and it is calibrated so that **half the people standing in the open at 15 m are hit** (λ(15 m) = 0.71), which is what the M67 class's effective casualty radius of 15 m means. A fragment's speed falls with the air (`v(r)`, a sphere's drag, Cd 0.92 supersonic and 0.47 subsonic, on 4.5 mm² and 0.057 g), so the **number** of hits does not depend on the air and their **energy** does; that is how vacuum makes a grenade worse at range, not by hitting more often. Each hit: a part (standing: head 10%, torso 40%, arms 20%, legs 30%; prone: head 30%, torso 40%, arms 20%, legs 10%), pen `0.8 × (v/1350)²` mm RHAe (soft armour always stops it; the light vac suit's shell (1) stops it beyond about 8 m in air and 62% of the time at any range in vacuum), and a wound at `w` from §8.1 (0.21 to 0.29 a ball between 15 and 2 m: about 1 to 2.5 of BODY's points each, so it is the number of hits that kills).

**[computed]**

| Distance | Hits expected, standing (at least one) | kneeling | prone | Ball speed, energy: Mars valley | MCRN ship air (66 kPa) | UN hull (101.3 kPa) | Vacuum |
|---|---|---|---|---|---|---|---|
| 2 m | 40 (100%) | 25 | 10 | 1,264 m/s, 45 J | 1,273, 46 | 1,236, 43 | 1,350, 52 |
| 5 m | 6.4 (100%) | 4.0 (98%) | 1.6 (80%) | 1,146, 37 | 1,166, 39 | 1,084, 33 | 1,350, 52 |
| 10 m | 1.6 (80%) | 1.0 (63%) | 0.40 (33%) | 973, 27 | 1,006, 29 | 870, 22 | 1,350, 52 |
| 15 m | **0.71 (51%)** | 0.44 (36%) | 0.18 (16%) | 826, 19 | 869, 21 | 698, 14 | 1,350, 52 |
| 30 m | 0.18 (16%) | 0.11 (11%) | 0.04 (4%) | 506, 7 | 559, 9 | 366, 4 | 1,350, 52 |
| 50 m | 0.06 (6%) | | | 285, 2 | 325, 3 | 219, 1 | 1,350, 52 |

The 40 mm HEDP at `K` 18: 99% at 2 m, 51% at 5 m, 16% at 10 m. Thin air leaves fragments faster; vacuum leaves them at full speed to any range.

**Walls**: a wall at distance `r` takes `240 / r²` balls a square metre at normal incidence; each is resolved by §8.2 with the wall's rating divided by the cosine of its angle. A G-9 bursting 1 m from a wall in an MCRN hull [computed, integrated over the wall]: about 1,460 balls strike it; a pressure bulkhead, a lander's skin or a steel door stops every one (ball pen 0.8 at most, under half of 2.2, 2.4 and 4.8); a cabin wall lets about 50 through (57 from 0.5 m, 32 from 2 m) and a partition about 360, so the next cabin is in the burst too. The pressure problem of a grenade aboard is its blast in a small room (§12.4), not its fragments.

### 12.4 Blast

Peak side-on overpressure in the open by the Kinney-Graham fit, scaled for ambient pressure by Sachs' law (`Z = R (P/P0)^(1/3) / W^(1/3)`) [computed, kPa, a G-9]:

| | 1 m | 2 m | 3 m | 5 m | 8 m |
|---|---|---|---|---|---|
| Earth, a UN hull (101 kPa) | 345 | 71 | 31 | 13 | 7 |
| Mars valley, an MCRN hull (66 kPa) | 313 | 63 | 27 | 11 | 6 |
| vacuum | none beyond the fireball (about 0.5 m) | | | | |

**In a closed compartment** the gas has nowhere to go. **One closed-room helper** (WEAPONS owns it; COMBAT §11.3 calls it; settled after the review, which found this section's first fit and COMBAT's ideal `0.4 E / V` both near the ideal value and two models in play):

```
qsp(W kg TNT, V m³) = min( 2,250 × (W/V)^0.72 ,  0.4 × W × 2 × 4.184 MJ/kg / V )      kPa above ambient
```

- The first term is the Weibull fit that UFC 3-340-02's gas-pressure chart follows (2.25 MPa × (W/V)^0.72 with W/V in kg/m³, as the DDESB papers fit it). Its range of fit is roughly W/V above a few hundredths of a kilogram a cubic metre; below that it overshoots even the energy available.
- The second term caps it at **twice the ideal** quasi-static value `(γ − 1) E / V`: the detonation's own 4.184 MJ/kg and about as much again from the afterburning of TNT's products in the room's air, which the ideal form ignores (my call; complete combustion could give up to three and a half times, but in the first second the mixing is partial). The fit takes over above W/V 0.24 kg/m³ (a big charge in a small room). In Martian air the room's oxygen (21 kPa, as on Earth) is enough for any charge here.
- The pressure is above the room's ambient and lasts until it vents through the room's openings and leaks by PLACES's flow (its §3.4); the peaks within 1 m of a wall are twice the free-field value (reflection).

**[computed]** (kPa above ambient):

| Charge | 3 m³ (a closet, a shower stall) | 10 m³ (a head) | 30 m³ (a cabin) | 60 m³ | 140 m³ (a corvette's deck) |
|---|---|---|---|---|---|
| G-9 (0.24 kg) | 268 | **80** | **27** | 13 | 6 |
| 40 mm HEDP (0.032 kg) | 36 | 11 | 4 | 2 | 1 |
| WIC (0.15 kg) | 167 | 50 | 17 | 8 | 4 |
| BC-1 (0.3 kg) | 335 | 100 | 33 | 17 | 7 |
| a 0.5 kg breaching charge | 558 | 167 | 56 | 28 | 12 |
| Compound-9 block (0.75 kg) | 829 (the fit) | 251 | 84 | 42 | 18 |

**What it breaks**, from PLACES's ratings (its §1.6 "Holds ΔP": a pressure door and an airlock door 100 kPa, a ship's dogged bulkhead door and a hatch 150, a vehicle door 70). The first version of this section said "LONGHAUL's pressure doors hold 15 kPa": wrong, since a pressure door that held 15 kPa would fail against vacuum. The 15 kPa belongs to the things PLACES gives no pressure rating because they leak: an interior door, a cabin wall, a partition. They still have a structural strength, which I propose PLACES adopt as a `blastKPa` per kind (my call): an interior door 15 kPa, a cabin wall (honeycomb) 10, a partition (sinter board on studs) 20, a weather door 30, a fire door 35, an armoury blast door 300; for rated doors and hatches `blastKPa` equals the rating. So:
- a **G-9 in a head** (80 kPa) blows out its door, its partitions and any weather or fire door, and is held by a pressure door; **in a cabin** (27 kPa) it blows the cabin door, the honeycomb walls and a sinter-board partition, and leaves a fire door (35) standing; **on a corvette's deck** (6 kPa) it breaks nothing by pressure;
- a **0.5 kg breaching charge in a 10 m³ compartment** (167 kPa) blows out pressure doors, airlock doors and even dogged bulkhead doors and hatches (150), which is why COMBAT's breaching drill (§11.6 there) puts the charge on the door and the stack outside it, never in a small closed room.
- **What it does to people** is BODY's (ears, lungs, being thrown), read from the same number COMBAT §11.3 bands.

### 12.5 Stun and smoke in each environment

| | In air (Mars, a ship) | A suit with its helmet sealed | Vacuum |
|---|---|---|---|
| **G-11 stun** | flash and bang: the unprotected within 5 m are blinded and deafened for 5 to 10 s (BODY, COMBAT); on Mars 4 dB quieter (66 kPa) | the visor darkens in 2 ms and the helmet damps the sound: "a thump and a flicker" | the flash only |
| **G-12 smoke** | 90 s of cover in still air, 30 s in a Martian breeze; indoors it fills a compartment and loads its scrubbers (PLACES's life support) | | the cloud expands with its gas and is gone in about a second |

So a stun grenade is for unsuited people, and smoke is a ground weapon: both are decisions a boarding party makes knowing who wears suits.

### 12.6 Pressurised spaces: the rules

(my call; COMBAT owns rules of engagement and may tighten them)
- No G-9, no HEDP, no Compound-9 and no RL-84 inside a pressure hull or a habitat without an order.
- Breaching inside uses the B-12's breaching rounds, the BC-1 on a door (its cut leaks only if the door is a pressure boundary to vacuum), the WIC, or thermite.
- Stun grenades only against people without sealed helmets.
- On Europa's surface fragments carry to any range: a G-9 thrown there endangers the whole line of sight.

---

## 13. The ship's guns, for reference

Marines do not fire ship weapons, but they hear, feel and sometimes feed them. LONGHAUL's tables (`longhaul/js/sim/weapons.js`) are COMBAT's and PLACES's; for the marine's world (my call): the MCRN's point-defence round is a **25 mm tungsten-cored PDC round** at LONGHAUL's `PDC_MUZZLE` 1,200 m/s and `PDC_RPS` 50 rounds a second a mount, 20,000 rounds a mount (`PDC_ROUNDS_PER_MOUNT`), 0.05 MCR a round. A PDC burst is a buzz-saw through the hull; reloading the magazines is a working party marines are lent to (PEOPLE). Railgun slugs (20 to 45 km/s) and torpedo warheads are hull damage (COMBAT, PLACES).

---

## 14. NPCs use the same steps

Ported from tradecraft `src/sim/armed.js` `gunner()` (the step loop, not the police logic): every armed NPC in the live area runs **the player's own `act()` steps in real time at their own pace**, each finishing at its `until` (the user, tradecraft 2026-11-03: "NPCs shooting at us should just move time forward normally as they do the things to ready their weapons").

1. Bring the weapon up (`up` from a sling, or a draw); safety or selector off.
2. If not ready: drop an empty magazine when spares exist, else the fix `canDo()` offers first (clear, tap-rack, charge, release, magazine in, belt in). With no ammunition left they are out of the fight (the user, 2026-11-04: "Armed npcs should also always carry ammunition (and use it, in such ways that they can run out)").
3. Face the target; aim (`aimS`); then the shot through §7.11 with their own Marksmanship and modifiers (being shot at, suppression, the climb by their own skill: fixing tradecraft quirk 4).
4. Taken down, they drop what is in their hands where they fall, and it can be picked up (the user, 2026-11-04); a downed or incapacitated gunner does nothing (tradecraft's fix from the user's bug report).

Also:
- **Loadouts** are real (PEOPLE draws them from the billet; my defaults): a Corps rifleman 7 magazines, an automatic rifleman 600 rounds in belts, a Belt cell member 3 to 4 steel magazines, corporate security 2.
- **Postures and conditions**: NPC marines carry as ordered (§6.2), change posture at their own pace, and run the habit check (§6.3): they flag rarely, by skill. Their discipline trait (PEOPLE) decides whether they re-check a fumbled step, so NPC negligent discharges happen at a believable rate among recruits and the exhausted, and almost never among the trained.
- **Their own guns age**: NPC weapons foul and gather dust; PEOPLE's maintenance block cleans them; a lazy marine's rifle (a trait) jams more on Europa.
- **Off the map** (PEOPLE's LOD): a weapon is a record in the armoury or on a person; nothing is simulated. Annual qualifications for NPCs are shot in closed form with §11.1's course from their sheet (a seeded stream), so their badges are real.
- **The crowd** carries nothing a game cares about until it matters (§4.1).

---

## 15. Code: modules and what is ported

TECH owns the layout; these are the proposed modules (`src/sim/arms/`, pure, no DOM, every module opening with a prose header):

| OLYMPUS module | Ports | Verdict | What changes |
|---|---|---|---|
| `calibres.js`, `models.js` | tradecraft `src/sim/firearms.js` `CALIBRES`, `KINDS`, `FAMILIES`, `MODELS` | replace the data, keep the shape | §2 and §3's arsenal; loads per calibre; optics; makers |
| `ballistics.js` | new (no source in either game) | | G7 point mass; the bore-line tables on their (ρ, c, v0) grid built at boot, `flight()` with gravity exact; the zero's sight angle; the `spin` flight (§2.9); the scratch model behind this section's [computed] numbers is the reference |
| `firearms.js` | tradecraft `src/sim/firearms.js` | **adapt (high value)** | keep `newGun`, `act`, `fire`, `feed`, `canDo`, `said`, `ready`, `moveArm`, `fillMag`, the fumble ladder and the constants; add belief, dust, foul, lube, heat, frost, belts, launchers, accessories; SKILLS' `paceOf` replaces `pace()`; grades replace raw margins |
| `drills.js` | tradecraft `src/sim/gunwork.js` (`JOBS`, `ways`, `work`) | adapt | the Corps' macros (§5.3), cleaning (§9.3), magazine work, the daily weapons drill and the guard's mount and reliefs (§10.8); jobs at a bench become TIME activities |
| `carry.js` | tradecraft `src/sim/scenarios/range.js` `safety()` | adapt | postures, the cone, the habit check (one roll per approach, automatic habits, near misses, the `habit` log lines), flags and points, range safety for any range, ladders and couches |
| `shot.js` | tradecraft `src/sim/shooting.js` `aimMs`, `odds`, `shotOf`, `fireMs`, `tapsOf`, `climbOf`, `npcShot`, `bullet`, `stray`, `discharge`, `muzzleSafe` | **adapt formulas, rewrite glue** | the log-range DC, the bias helper, optics, positions, anchoring; the shooter's beliefs and `plaqueOf()`; Marksmanship for the hit; quirks 1, 4, 5, 6 fixed; the street glue (police, heat, passers-by, emergency) dropped for bus facts |
| `shooting.js` (glue) | tradecraft `src/sim/shooting.js` `toggle`, `options`, `choose`, `tick`, `finish`, `readyGun` | adapt | the stop-motion mode, the step panel's list, targets in the frame and the far window; TIME's clock rules |
| `penetrate.js` | tradecraft `src/sim/armour.js` (`layerHit`, `centreOf`, `BLUNT`, `WEAR`, the helmet dome) | adapt | the per-calibre stop table becomes the pen-and-rating logistic; materials, exits, ricochets; `holeArea()` for every reader |
| `upkeep.js` | new | | dust, fouling, lube, heat, cook-off from the round's temperature, barrel failure, the cold soak, frost; the armourer's service |
| `armoury.js` | new | | records, issue and return, reconciliation, sensitive-item checks, the lost-weapon flow |
| `qual.js` | tradecraft `src/sim/paper.js` (`RINGS` by margin, `group`, holes by hash) | adapt | KD targets A and B, the pistol target, scores, classes; the pits' marks, mismarks and challenges |
| `explosives.js` | new | | grenades, the throw sequence, fuses, `fragHits()`, open-air blast and `qsp()`, charges |
| `brass.js` | new | | cases as particles, tile counts and, past the cap in free fall, drift records |
| `gunner.js` | tradecraft `src/sim/armed.js` `gunner()` | adapt the pattern | the step loop for every armed NPC; the police and arrest logic is not ported |
| (reference) | longhaul `js/sim/weapons.js` | reference only | PDC muzzle velocity, rate and stock for §13; the ship's guns stay COMBAT's |
| (reference) | longhaul `js/sim/factions.js` `mcr-corp` | reference | Hecate Arms & Drive's description |
| (reference) | longhaul `js/sim/life-support.js` | reference | PLACES rebuilds the gas model; §8.6 gives it hole areas |
| (reference) | tradecraft `src/render/crowd.js` gun poses | reference for VIEWS | `RAISE_MS` 120, `KICK_MS` 140, `AFTER_MS` 600, `FLASH_MS` 70 |
| `tests/*.test.mjs` | tradecraft's `firearms`, `shooting`, `gunwork`, `armed`, `armour`, `range` tests | port the method | seeded loops that print rates (§16) |

**As built in v0.0.5** (`src/sim/arms/`, every module pure with its prose header; the build sheet 0.0.5 §8 item 7): `calibres.js`, `models.js` (the R-7, the HAD-30 families, the SO-4, the 6.5×40 and 9×21 loads); `firearms.js` (the truth, the belief, every action, the pull, the ladder); `drills.js` (the macros); `carry.js` (the postures, the cone, the habit, range safety's verdicts, `ndOf`); `kit.js` (the containers, the issue templates, `move`, the holder index; TECH §6.7); `look.js` (what the stage reads, in `SIM_FOR_VIEW`: TECH §2.2); **`shot.js`** (the DC, the modifiers, the plaque, `resolveShot`); **`paper.js`** (the card, its rings, holes by hash: to be absorbed by 0.0.7's `qual.js`); **`shooting.js`** (stop motion's glue, TECH §2.6's `options()`: `enterStop`, `stepsOf`, `chooseStep`, `stopInput`, `stopRules`, `stepNow`, `stopNow`); `domain.js` (the weapons domain: `stop`, `items`, `armoury`). COMBAT's `combat/roll.js` (the roller), `steps.js` and `reflex.js` sit beside them (COMBAT §18), and the scene is `src/sim/scenarios/handling.js`.

**As built in v0.0.6** (the build sheet 0.0.6 §9): `calibres.js` (`LIVE_LOADS`, each load's word and tip), `kit.js` (`pouchesOf`, `pickMag`, `rankOf`, `kit.hands`, the `range-mixed` kit), `firearms.js` (`feelOf`; `reach`, `seat`, `lookMag`, `stowMag`, `dumpMag`, `dropMag`; `gun.load`; `beliefOf`'s `magLoad` and `hand`), `drills.js` (LOAD and the RELOADs by reach and seat), `shooting.js` (the steps' place after `@`, the marked rows, the hands soiled by a sub-step), `shot.js` and `look.js` (the shot's and the fire's load); `src/sim/scenarios/handling.js` (the coach's check and its `roundsLeft`, the move-on, `coachClears`, one magazine a string, `spoutCheck`, `kindWarn`, the over-fired string, setup `mixed`) and `src/data/courses.js` (`NEEDS_ROUNDS`, `checkMs`, `moveOnMs`, the coach's new lines). The shared helpers are CONTRACTS §13's `pickMag`, `rankOf`, `roundsLeft` and `feelOf`.

Tradecraft's quirks fixed here (its list in tradecraft-sim-combat.md §15): 1 the displayed odds include the body (SKILLS §5.3); 4 NPC bursts use `climbOf` and NPCs feel being shot at; 5 the arm diversion falls with the margin; 6 the shotgun fires pellets; 7 shooter stance exists; 8 gun wear has environmental causes; 9 armour covers more than the torso and the dome; 11 sound and violence are bus facts. Quirk 2 (bullet knockdown for the player) is BODY's, which knocks the player down too (BODY §2.7).

---

## 16. Tests and the numbers they print

Each test prints its numbers (tradecraft's and LONGHAUL's habit: "tests print the numbers that matter"); the heavy ones are skipped under `QUICK`.

| Test | Prints | Checks |
|---|---|---|
| `ballistics` | §2.4's tables (each load and environment: v, energy, flight time, path, drift per m/s at 25 to 600 m), including `ship-thrust` at 66 kPa and `earth-ship` at 101.3 kPa; §2.5's zero shifts and the point-blank ranges; §2.6's maximum ranges and Europa's level miss; §2.7's supersonic ranges; **the bore-line tables against direct integration** at 5 random environments and zeroes (ρ, c, g, v0), printing the worst error at 500 m in path and drift | 6.5×40 ball on the valley floor at 300 m: 657 m/s, 1,682 J, 0.42 s, drift 3.7 cm per m/s (±2%); in an MCRN hull at 300 m: 667 m/s (±2%); a Mars 400 m zero on Europa at 300 m: +31 cm (±2 cm); Europa maximum range 563 km (±5%), level miss from 1.5 m 1.43 km (±5%); interpolation's worst error at 500 m under 1 cm |
| `spin` | §2.9's table: the R-7 at 25 and 50 m along, against and across the spin on Hygiea's rim and in a 100 m ring; the 15 m throw at 15 and 10 m/s each way; the floor's line-of-sight limits | 50 m on Hygiea: 26 cm low with the spin and 25 high against (±2 cm), within 1 cm of `ω d² / v`; across the spin, the felt gravity's drop (±0.2 cm) |
| `brass` | a 90-round dump on automatic in free fall in a 30 m³ compartment with one return grille: particles, drift records, their arrival times; frames in which a case disappears | never more than 64 particles; no case leaves the picture before it reaches the grille (zero pops); every case caught by minute 3 |
| `firearms` (port) | 2,000 draws and reloads per tier (WH 3, 7, 10, 15, 20, 30): mean time, missed, dropped, fired; §5.2's time table; §4.3's rates, each state over 200,000 pulls (a clean gun's rates are rare) beside the closed form; each selector ring; each refusal's words; cold-soak breakages per 100,000 rounds at −80 and −120 °C | the speed reload at WH 10 is 2.53 s; fresh misfire 0.015% and stoppage 0.06% (±30%); the dust storm's stoppage 1.2% (±0.2); worn (0.6) 2.3% and 2.6% (±0.3) |
| `drills` | each macro's time by tier; where it halts on a fumble; the belief after each sub-step; `conditionOf` after each | no macro continues past a failed sub-step |
| `nd` (heavy) | negligent discharges per 10,000 UNLOAD SHOW CLEAR cycles by tier × (rested; exhausted, dark and cold), with and without the observer, with and without re-checking after a `?`, at the range's pressure and at `danger`; their grades | as built in v0.0.5, §5.4's grid printed and the model's shape held, not ±20% of a table (§5.4 says why): the observer and the re-check each lower the rate; the trained in good conditions on the range never fire one; a recruit exhausted in the dark, alone, never re-checking, about 16%; downrange and the ground ahead ND-1, uprange or the coach's span ND-3, never ND-4 |
| `carry` | §6.3's per-approach table (automatic, near miss, flag); **flags and near misses per hour in a FOB chow queue** for Weapon handling 4, 10 and 18 at slung front and at low ready (a bot queue of 20 with passers carrying trays, an hour of sim); rolls per approach for someone who stands in the cone for 3 minutes; ladder cases; range-safety warnings and stops (tradecraft's range test); the J lines under the `habit` filter | one roll per approach however long it lasts; WH 10 at slung front under 0.02 flags an hour (the sum of §6.3: 0); a recruit at low ready in the queue several an hour (about 7.5); no habit roll is decided by a natural |
| `shot` | §7.5's grids by Monte Carlo (2,000 shots a cell) beside the closed form; `rangeDC`, `opticMod`, `biasMod` tables; arm diversions by margin; **the plaque against the roll**: for 1,000 shots at unknown ranges in wind, the shooter's `dEst` and `windEst`, the plaque's odds or words, the true odds, and the outcome | Monte Carlo within ±3% of the closed form; **the plaque equals the roll as computed on the shooter's beliefs**, body and needs included; with a lased range in still air the plaque equals the true odds; words, not a percentage, whenever the belief's spread moves the odds by more than 10 points |
| `burst` | climb per round by MRK; taps by MRK; L-20 6-round bursts prone on the bipod and standing at 100 and 300 m: hits per burst | |
| `recoil` | §7.8's Δv and spin per round, unsuited and suited, with the inertias and lever used; a floating 30-round dump's final speed and spin; Europa's slide per round by grip | R-7 suited: 5.7 cm/s and 7.8°/s a round (I 28 kg·m², lever 0.45 m) |
| `penetrate` | §8.1's wound factors; §8.3's stop table; §8.4's exits; §8.5's perforation table and the ice thicknesses; §8.6's `holeArea()` for every load and layer, the hull leak table at 66 and 101.3 kPa and the suit leak table (entry, exit, through and through); ricochet rates by angle | frangible through a pressure bulkhead 0%; ball 100%; 1 m of ice stops 7.62×39 ball at 10 m 97% (±2); a 6.5×40 ball through and through a suit is two holes and 5.8 g/s (±5%) |
| `upkeep` | dust after the three reference cases (0.05, 0.15, 0.12); dirt factors; §9.5's heat table in MCRN air, on Mars and in vacuum; the L-20's vacuum drill; the lowest barrel temperature that cooks a round left in, and the time, in each air; rounds of R-7 rapid fire before a round left in cooks off within a minute; barrel failures per 1,000 rounds at 650 and 750 °C; §9.6's cold soak times with and without the WC-3; frost on entering a town | vacuum cooling 400 to 100 °C in 46 min (±2); a round left in a 300 °C chamber cooks off in about 20 s (±3); an R-7 in a hull reaches cook-off danger after 100 to 120 rounds of rapid fire; no barrel fails under 600 °C |
| `armoury` | a sign-out and turn-in; reconciliation with one round missing (the shakedown starts); inspection rejections by cleaning margin (0, 5, 8, 10, steady); the lost-weapon lockdown; a guard day (mount, four posts, four reliefs) and a weapons drill, with their show clears | every draw and turn-in has its lived show clear |
| `qual` (heavy) | §11.1's table (5,000 shooters per MRK) and §11.2's; the pits: marks, mismarks and challenges per 1,000 shots by the puller's Awareness | MRK 10: Expert 33%, Sharpshooter 37%, Marksman 29% (±3); a challenged mismark restores the true value |
| `grenade` | §12.2's throws and the Mars low-throw flight times against the fuse; the throw sequence's time by tier; §12.3's `fragHits` (λ and at least one hit by distance and posture) and ball speeds in each air; §12.4's open-air blast and `qsp()` by charge and room, with the openings that fail by PLACES's ratings; wall perforations; §7.9's launcher elevations | no fragment perforates a pressure bulkhead; standing at 15 m, 51% hit (±2); a G-9 in a 10 m³ head 80 kPa (±5%) and its pressure door holds |
| `gunner` | an NPC's time from the order to the first shot by tier (WH 10 from slung front: about 2.2 s, then the held aim); ammunition run dry after 7 magazines; a downed gunner's rifle on the floor | |
| `parity` | a cleaning skipped against the same cleaning lived; a qualification string skipped against the same string lived, same seed | identical rolls and outcomes |

---

## Fun

**What this system makes the player decide:**
- **How to carry.** Slung is safe and slow; low ready is fast and flags people; on base the NCO notices which. The posture is a statement in a Europa market (COMBAT's escalation of force reads it).
- **Which load.** Frangible keeps the fight in the room but will not beat a plate; ball beats armour and holes the ship; AP beats the Corps' own armour and is "by order". Every boarding begins with that choice.
- **Whether to check.** A fumbled step leaves a `?` on the weapon card; checking costs a second; not checking is how marines shoot clearing barrels. The daily drill and the guard's reliefs put that choice in front of the player most sols, not only on range days.
- **When to fire in vacuum.** A barrel that takes 46 minutes to cool makes every long burst on Europa's surface a debt, a barrel past 600 °C may bulge or burst, and the L-20 gunner's spare barrel is a treasure. A hot R-7 with a round left in it is cleared or kept firing.
- **Whether to trust the plaque.** It says what the character judges: "a fair chance" at a guessed 300 m in a gusting wind. Lasing the range or getting a coach's call turns the words into a number.
- **Whether to challenge a mark.** A shooter who called a five and sees a three can stop the line for a minute; a puller who mismarks costs a squadmate a class.
- **Reading Mars' wind.** Inside 500 m the drop hardly matters; the wind decides. A good NCO's call is worth a class at qualification.
- **What to do in free fall.** Single aimed shots from a handhold, the V-5 instead of the rifle, the tether clipped: or a tumbling marine and a rifle drifting toward an open hatch.
- **Tempo.** A rushed reload is 40% faster at −3; a steady cleaning is twice as long and passes the window.

**The stories it makes:** the private who flagged the gunnery sergeant in the chow line; the negligent discharge into the clearing barrel the week before deployment, and the platoon that knows about it by the third sol; the expert badge that comes on a windy afternoon because the coach read the flags right; the rifle that wouldn't feed after the dust storm and the field wipe that saved the patrol; the lost rifle that turns up at a Europa checkpoint with its serial read off; the fragment that went through the cabin wall into the next bunk; the bullet hole hissing behind a locker that nobody has found yet; the 02:00 relief at the main gate where the show clear found a round still in the chamber; the five the pits marked as a three; the grenade thrown against the spin of a ring station that hung in the air while everyone watched it; the extractor that snapped at −120 °C on Europa's surface because the cover's heater had died.

**Where it would turn into chores, and what removes them:**
- Cleaning after every range day: an activity behind the splash (TIME), with the tempo choice and the armourer's inspection as its only beats.
- Filling magazines: by clip it is under 90 seconds and lived; loose it is skipped.
- The armoury line: skipped; only the window is lived, for its 30 to 60 seconds of talk.
- Unloading and showing clear: one macro, rolled step by step in the log.
- The daily weapons drill: lived the first time, then carried on with every step rolled and its beats kept (§10.8).
- The guard's hours on post: TIME's `watch`, lived or waited through with its beats; the mount and the reliefs are the lived parts.
- The pits: lived the first time, then carried on with every mark rolled (§11.5).
- The habit check: no toasts, one line an approach in J, and no roll at all when the habit is automatic.
- Fifty rounds of qualification: each string lived or shot as a skip, every roll in the log, the paper at the end.
- Serial checks and brass calls: part of their formation's minute.
- Policing brass in free fall: a working party (PEOPLE), not the player's chore unless they are on it.

---

## Build order

**0.1, a standby week at Base Melas** (CAREER's standby: the range on career sol 2; no qualification shot in the standby, CAREER §5.4). The list is kept whole and built over ROADMAP §4.2's three scenes: `test-handling` at 0.0.6 (shipped as v0.0.5: the R-7 alone, at 25 m, as the as-built notes above say) (`firearms.js`, the actions and macros, `carry.js`, `shot.js` at 25 m without wind or holdover), `test-range` at 0.0.7 (shipped as v0.0.7: `ballistics.js`, `wind.js`, wind and holdover, the KD faces and zeroing, `penetrate.js`, `gunner.js`, `pits.js`, `brass.js`, range safety in full, as the as-built notes above say; the qualification course, mismarks and the player in the pits wait for `qual.js`) and `test-armoury` at 0.0.8 (`armoury.js`, `upkeep.js`, with dust, fouling, lube and heat made live); the rifle in the routine joins with the Plan of the Day (0.0.14), and the G-40's TP rounds at the mission rehearsal exercise at 0.1.x (ROADMAP §5.2). A patch number names ROADMAP's row, not a release (CONTRACTS §18).
- `ballistics.js` with the bore-line tables on their grid and every environment class printed (cheap to build, and the tests pin the numbers); `calibres.js` with 6.5×40 (ball, tracer, blank, dummy) and 9×21 ball; 40×46 TP; G-9P.
- Models: R-7 (the player's), C-7 (seen), R-7M, L-20 (the squad's automatic riflemen), P-12 (officers and staff NCOs), G-40 (the team leaders'; its TP rounds fired at the mission rehearsal exercise from 0.1.x), M-2290 (drill and the colour guard, dummy rounds only).
- `firearms.js` ported with belief, dust, fouling, lube and heat (barrels heat on the range); every §5.2 action these guns use; the macros; weapons conditions and their area defaults.
- `carry.js`: postures, the cone, the habit check (one roll per approach, automatic habits, near misses, the `habit` lines in J), flags and points to PEOPLE, range safety, ND grading.
- `shot.js` complete: the DC, every modifier including wind and holdover; the shooter's beliefs and the plaque on them; the KD targets; zeroing; the qualification course and the pits (§11.5); the pistol course for NPC officers in closed form.
- The rifle in the routine (§10.8): the weapons drill with dummies, the ready platoon's guard mount, posts and reliefs, the lived show clears.
- `penetrate.js` for paper, berms, steel targets and people (an ND must land somewhere real).
- `upkeep.js`: dust, fouling, cleaning activities, the armourer's inspection; `armoury.js`: the card, sign-out and turn-in, ammunition issue and the brass call, sensitive-item checks, the lost-weapon flow.
- `gunner.js` for NPC marines on the range (relays shoot with the same steps).
- Tests: `ballistics`, `firearms`, `drills`, `nd`, `carry`, `shot`, `upkeep`, `armoury`, `qual`, `parity`.

**0.2, the voyage** (the Coprates-class transport, the Simoom's couches): V-5, C-7 carried, B-12, P-10; frangible loads; brass in free fall, catchers and the drift records past the cap; recoil drift and spin, mag boots, handholds, tethers; gloves and the HUD link; the ship's armoury; penetration of bulkheads, `holeArea()`, holes and leaks (with PLACES's gas model), ricochets; the lander's couch rules.

**0.3, Europa**: armour and suits (the stop tables, the suit's two holes), AP, the Europa zero and the Callisto re-zero, vacuum heat, cook-off and barrel failure, the cold soak with the WC-3 cover and the HAD-30S, and frost; the S-9; the UN, Belt and corporate weapons (FA-9, PA-21, TMW-6, Pick, the pipe pistol, Kestrel); G-9, G-11, G-12, 40 mm HEDP, the BC-1, with `fragHits()` and `qsp()` for COMBAT; near misses and cracks for COMBAT's suppression; real loadouts in fights; weapons in enemy hands; the M-30, C-7N, SP-26, L-40, the rivet driver.

**0.5 to 0.7**: the rest of §3.7's list in its milestones (the void kit's J-12 with boarding at 0.5, §3.9, the V-5X withdrawn; recon's suppressed and subsonic weapons and sniper rifles at 0.6; the anti-materiel rifle at 0.7; the R-5 where a unit issues it, from 0.3); demolitions with SKILLS' Demolitions; the G-46 and B-12K; the `spin` flight (§2.9) with the first ring station (PLACES's Hygiea Ring, Ceres Station), at the latest when ROADMAP's spoke and ring settings arrive.

**1.0**: 46 models in 16 calibres.

---

## Cross-references

What WEAPONS relies on, by section:
- **SKILLS**: the two skills as split (Marksmanship for the shot, wind, holdover, zeroing, follow-ups and where a grenade lands; Weapon handling for everything done to the gun, the aim's mount and turn, and the habit); `paceOf`; grades; tempo and pressure; `mitigated()` for gloves and free fall; the reference tiers used in every table here; §5.11's banded words for the plaque when the shooter's belief is uncertain (§7.10); that the habit check is, like opposed rolls, a roll where naturals decide nothing (§6.3); local experience of spin habitats (§2.9) and of a gravity for the throw's +3; the feel (shot calling) for challenging a mark in the pits (§11.5); the weapons drill's 20 minutes a sol as Weapon handling training hours. One note for SKILLS and CAREER: boot's Marksmanship floor of 6 at Warfighting 15 gives a value of 7, which qualifies about half the time at the first attempt [computed between MRK 6's 37% and 8's 84%]. Real recruits must qualify to graduate, so either the floor becomes 7 (value 8: 84% qualify) or CAREER's boot summary includes a re-shoot day. My default: the floor of 7.
- **BODY**: `bodyMods(p, 'marksmanship' | 'weapons')` and `needMods` (stamina's sway, frayed hands, fatigue, cold hands, G-load); suits as life support (the pressure layer, its leaks from the hit record's `suitHoles`, the patch, mass, mobility, the base glove penalties, the battery the WC-3's heater draws on); free-fall locomotion that takes recoil's Δv and spin (§7.8's inertias: about 17 kg·m² unsuited with kit, 28 suited, if BODY keeps a body inertia of its own they should agree); wounds from §8.7's hit record, blunt trauma, blast and hearing injuries, brass and barrel burns, a burst barrel's burn and fragment; Fitness for the throw. Two corrections the review asks of BODY, which BODY owns: **§11.7's recommendation and the DCS table's "70 kPa, 32% O₂ ship" row** should read PLACES's 66 kPa Martian indoor standard, which is the air MCRN hulls now run (§2.1 here); and **§19.4's leak table** should size holes by `holeArea()` (§8.6 here): a rifle round through and through is two holes (6.5×40: 35 and 79 mm², 5.8 g/s at 34 kPa, held at 3.5 kPa on the regulator and 10.6 with the reserve), not one 8 mm hole, and the 1 mm row's primary oxygen lasts 2.7 h, not 2.9 [computed: 143 g/h of leak on top of 79 g/h of breathing].
- **PLACES**: `env` per area (`pKpa`, `airC`, `windMs` and its gusts, `dust`, `gG`, `gDir`, `mu`, `ferrous`, `vacuum`, `rh`) and each zone's mix (its §3.2: MCRN hulls at the 66 kPa Martian indoor standard, UN hulls at Earth standard); `gravityAt()`'s `spin` with ω, radius and axis for §2.9; a material and thickness for every wall, door, fixture and cover object (its §3.14); fixture tags (`pipe:o2`, `pipe:coolant`, `power`, `intake`, `glass`, `clearing-barrel`, `rifle-rack`, and each zone's return grilles for brass); the KD range with its butts and target carriages (§11.5) and its 7 km danger zone, the armoury, the zero range, the drill line at the cleaning canopy (§10.8), the main gate's and the ASP's posts and loading points; the gas model that takes `holeArea()`'s areas (its hole classes as display words); tracer ignition on vegetation; a **`blastKPa`** per opening kind and partition material (§12.4's proposal: interior door 15, cabin wall 10, partition 20, weather door 30, fire door 35, blast door 300, rated doors at their rating); Europa checkpoints' `iceBag` built 1.0 m thick (§8.5); each area's default weapons condition.
- **PEOPLE**: flags, points and NDs as events, and the consequences ladder (§11 there); near misses are not events (§6.3); the armourer, range safety officer, coach, ammunition NCO, pit NCO and the sergeant and corporal of the guard; **the ready platoon's interior guard on standby, putting a new join on a post about once a week** (§10.8, against §4.3's 1 in 30 sols for the base guard), and **the 20-minute weapons drill in the maintenance block** on sols without a range or field block; the armoury line in the schedules; the discipline trait (re-checking); a quirk that keeps a souvenir round; NPC loadouts; inspections, searches and shakedowns; the lost-weapon lockdown; gossip (a mismark in the pits, a round found at the relief).
- **TIME**: stop motion's clock rules; the activities `clean-rifle`, `clean-pistol`, `load-mags`, `armoury-line`, `range`, a new `weapons-drill` (20 min, lived the first time) and the pits as a lived block (§11.5) in place of their splash, with this section's dirt, outcomes and pace (SKILLS' `paceOf` of Weapon handling, in place of TIME's `chorePace` for weapon work); the guard's `watch` with its mount and reliefs (§10.8); interrupts for an ND or a live grenade; reflex cards; the splash for cleaning; the range paper.
- **COMBAT**: cover geometry and exposure; suppression from §7.7's near misses and §2.7's cracks; rules of engagement (loads aboard, grenades in pressure hulls, the EVA backstop rule); escalation of force reading postures; melee (the bayonet, the rifle as a club); boarding and breaching with §7.9's breaching rounds and §12's charges; corner shots; whether a walking shot is allowed. Four things the review settles here and COMBAT should cite rather than restate: **the throw** (§12.2's sequence of 1.4, 0.5 and 0.7 s, its DC `8 + 5 log2(d/5)` with COMBAT's modifiers and landing error, and §2.9's flight in spin habitats in place of §11.1's "real trajectories in the area's gravity"); **`fragHits()`** for §11.2 (K 160 standing, exposure 0.6 kneeling and 0.25 prone, the air slowing fragments, not thinning them); **`qsp()`** for §11.3 (twice the ideal value at grenade loadings, so a G-9 in a 10 m³ room gives 80 kPa, not 40); **`holeArea()`** for §13.7's hole table (a 6.5×40 hole through a bulkhead is 79 mm², not 28). And for §4.4's cover table: by §8.5's ice, a 0.6 m piled ice berm stops rifle ball about a quarter of the time; to stop it 95% it needs about 1.1 m.
- **CAREER**: the qualification schedule, bands and gates (CAREER §7.4); the weapons card at check-in; the composite (Expert +6, an ND −10); billing a lost weapon from pay; schools (marksmanship coach, scout sniper, armourer); badges on the record; the standby calendar's working sols with the weapons drill and the ready platoon's guard (§10.8).
- **SETTING**: the makers' faces and voices; insignia for the badges; the Rifleman's Creed and the four rules in the Corps' words; the general orders of a sentry; the Alert Battalion's ready platoon and its guard; the MOS list (armourer, machine gunner, scout sniper); MCR.
- **VIEWS**: posture frames and their muzzle directions; the weapon card (drawn from the belief); the step panel and the plaque (the judged range "≈ 300 M", odds as a percentage or SKILLS' words, the believed modifiers on hover: §7.10); J's **`habit` filter**, one collapsed line per approach (§6.3); the far window for targets beyond the frame; the V key; brass on the ground, floating, and as drift-record glints (§2.8); muzzle flash by environment; barrels glowing from about 525 °C; the pits' spotter and scoring discs seen through the optic; the WC-3 cover on the doll; the HUD link's display in the visor.
- **TECH**: module layout; rng streams (`shot`, `judge`, `frag`, `fuse`, `throw`, `hole`, `cook`) and cosmetic hashes; the bore-line tables built at boot on their (ρ, c, v0) grid; the brass particle cap and the drift records; the test runner.
- **ROADMAP**: the milestone of each model and system above. Two words in 0.1's moment 2 ("Clear at the window") follow this revision: its must-hold "the plaque's odds equal the roll's, every modifier named" becomes **"the plaque equals the roll as computed on the shooter's beliefs, every modifier named"** (§7.10, §16's `shot` test), and "the pits skipped behind their splash" becomes "the pits lived the first time" (§11.5). The spin flight is wanted by the first ring-station setting (§2.9).

---

## Open questions for the user

1. **Should small arms stay chemical and cased?** Answered in part by the user, 2026-11-08: the ground kit stays chemical, cased and built for air ("atmospheric optimized firearms (not very far from real life 2020 military guns)"), and the void kit gets "very different guns (low recoil guns, self propelled projectiles etc)": the caseless J-12 rocket carbine at 0.5 (§3.9; the V-5X countermass carbine, withdrawn on 2026-11-08). Still open: coil or gauss small arms. A coil rifle only loses the propellant gas's share of the kick (the R-7's bullet alone is 72% of it) for a cell and hot coils, so it is not a low-recoil gun (§3.9). *Default: none; railguns stay ship weapons.*
2. **The shot keeps one d20 against a DC that grows 5 points for each doubling of range.** This keeps tradecraft's readable roll, and §7.5 shows that it spreads shooters across 0 to 600 m. Or do you want a wider roll (3d6, 2d10)? *Default: the d20.*
3. **Muzzle discipline everywhere on base.** Flagging someone with a muzzle in the chow line earns an NCO's correction and goes on the record, as on a real base. The check rolls once per approach, a trained habit is automatic, and a competent marine's bad luck is a near miss the character notices and fixes, so the flags fall on those who carry carelessly or are not yet trained (§6.3). Or should it apply only on ranges and operations? *Default: everywhere.*
4. **Real drift and spin in free fall.** A floating marine who fires on auto tumbles and has to manage handholds, mag boots and tethers. Or should free fall cost only a modifier? *Default: real.*
5. **Shooting a qualification string as a skip.** Every roll is logged and the paper prints, but the string isn't lived. Or must qualification always be lived? *Default: the skip is allowed.*
6. **The US Marine Corps' terms, adopted for the Martian Corps.** That means weapons conditions 1 to 4, LOAD and MAKE READY, the four safety rules, Marksman, Sharpshooter and Expert, and the Rifleman's Creed, all voiced by SETTING. Or should Mars have its own words? *Default: adopt them.*
7. **A lost weapon at full weight.** That means a base lockdown, an investigation and a bill from pay. *Default: yes.*
8. **The rifle in the routine.** A 20-minute weapons drill with dummy rounds on most working sols, and the ready platoon's guard putting a new join on the gate or the ammunition point about once a week (§10.8). Or should the rifle stay in the armoury between ranges and field days? *Default: the drill and the guard.*
9. **The plaque's figure over a paper target** (v0.0.5). Over the 25 m card the plaque shows the chance of a hole in the paper (95% prone at Marksmanship 10), not the chance of beating the DC (85%), because the edge ring's 2 scores from three under the DC (§7.10, §11.1). Or should the edge ring score only from the DC, so the plaque's figure is the roll's pass and every hole a passed roll (lower scores at every skill)? *Default: the chance of a hole, the rings as they are.*
10. **The R-7's selector needs the hammer cocked** (v0.0.5). As on the real rifles it is modelled on, the lever will not go to safe after the hammer falls (a function check, a click), so CEASE FIRE after a click charges first, which chambers a round from the magazine before the safe goes on (§5.3). Keep the lever as it is, or give the R-7 a selector that goes to safe either way? *Default: keep it: the drill teaches why the charge comes first.*
11. **Negligent discharges on the range come only from the untrained, the exhausted and the dark** (v0.0.5, §5.4's grid). Routine work (SKILLS §5.1) means a rested private or sergeant never fumbles a show clear on the range, so never fires one there; only a recruit, or a private exhausted with cold hands in the dark, does (a sergeant never does, even so). Should a natural 1 still bite on routine handling at the range, so a careless private can be caught out now and then? *Default: as built: routine work is routine, and the danger is fatigue, the dark and inexperience.*
12. **The plaque in words.** When the character is unsure of the range or the wind, the plaque says "a fair chance" rather than a percentage, and the true numbers appear in the log after the shot (§7.10). Or should the plaque always show a percentage of the shooter's best guess? *Default: words when unsure.*
13. **The plaque's headline on a KD face** (v0.0.7). At 200 and 300 m the plaque shows the chance of a five or a V ("FIVE 47%"), which moves with the hold, the dope and the held aim; the chance of any scoring hit, which sat at 92 to 96% whatever you did, is in the hover and the rings' strip (§7.10). Or should the headline be the chance on the paper? *Default: the five.*
14. **Gusts in your own read of the flags** (v0.0.7). As built, a read is the steady wind over the last 10 s and gusts are never in it, so your read can never beat the coach's call (§7.4). The design review proposes that your read include the gust of the moment, so reading the flags yourself, just before the pull, could beat a call made a minute earlier. *Default: as built, until you say.*
15. **When unused rounds go back** (v0.0.7). As built, you police your brass and hand your unused rounds to the coach at each line before you leave it (§10.4). Many ranges take the rounds back only once, at the end of the day. *Default: at each line, as built.*
16. **The standard issue's look** (asked 2026-11-08, §3.10). The R-7 family drawn as your first reference: Melas tan furniture and receiver, black metal, optic and magazine, the slotted handguard, the angled grip, the side-folding skeleton stock. *Default: as described, chosen in the end from the numbered samples you score (§3.10's list).*
17. **The J-12's weakness close in** (asked 2026-11-08, §3.9). As a real rocket round must, the J-12 is weak inside its 15 m burn (95 J at 1 m, 274 J at 3 m), so it is the hull-and-crossing gun and the V-5 and V-5X are the compartment guns. Or should a kick charge launch it faster (stronger close in, more recoil: 12 g at 150 m/s from the tube is 1.8 N·s, three-quarters of a V-5)? *Default: the real trade, as written.*
18. **Who carries the R-5** (asked 2026-11-08, §3.10). Your second reference becomes HAD's previous rifle, the R-5, carried by the weapons companies, Martian Security, the reserve and second-line units, with the R-7's numbers in all that matters; and two R-7s rarely look alike because of the fit a marine buys. Should the player's own issue sometimes be an R-5 (drawn from the rack, 1 in 5 at Melas while the re-equipment finishes), or always the R-7? **Answered by the user, 2026-11-08**: "there is no such thing as 'the other marines', our player character is part of a squad and we have the same stuff": the player carries what their squad carries, and variety is by unit, role, posting and era, for the player as for anyone (§3.10). The R-5 is carried by the player when the player's squad is one that draws it; no 1-in-5 rack draw.
19. **Over the shoulder** (asked 2026-11-08, §3.9). The V-5X must vent behind the shooter's head, so it is carried and fired over the shoulder like a launcher and never prone. Or should it be a conventional carbine with a vent to the side (a worse cancellation, a cone beside you)? **Answered by the user, 2026-11-08**: "Try keeping rifles looking like rifles even zero G stuff, let's say we use footing to hold recoil": neither; the over-the-shoulder V-5X is withdrawn, and footing (§7.8) holds the recoil of rifle-shaped guns.
