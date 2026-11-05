# TRADECRAFT combat, weapons and body sim: research note for OLYMPUS

Slice: tradecraft's firearms, shooting, armed NPCs, armour, cover, close combat, melee weapons, carry, health/wounds, medicine, first aid, diagnosis, wounded behaviour, emergency services, fitness, and the range/dojo scenarios that exercise them.

Sources read in full: `tradecraft/src/sim/{firearms,shooting,armed,armour,cqc,cqctext,fight,health,medicine,aid,diagnosis,wounded,items,weapons,gunwork,cover,paper,checks,skills,fitness}.js`, `scenarios/{range,dojo}.js`. Also read for context: `emergency.js` (medical parts), `services.js` (hospital care), `thermal.js` (stages), `needs.js` (mods), `interact.js` (downed actions), `rng.js`, `tutorial/range.js`, `render/crowd.js` (gun-pose constants), `docs/DESIGN.md` (Firearms section, user quotes).

Tests: `tests/{firearms,shooting,gunwork,gunpose,armed,armour,cqc,aid,medicine,diagnosis,wounded,downed,fitness,range,weapons}.test.mjs`. I ran them read-only from a scratchpad runner (they write nothing; I checked that no file in tradecraft changed). All passed. Their printed numbers are quoted below as **[test]**. Tables marked **[derived]** I computed from tradecraft's own exported constants with a scratch script.

All paths below are relative to `/Users/deaumas/lab/vibe/claudecode/tradecraft/src/sim/` unless stated.

---

## 0. TL;DR for builders

- The **gun as a state machine** (`firearms.js`, 487 lines, imports only `checks`, `skills`, `rng`) is the most reusable thing here. It models magazine in/out, chamber states (live/dud/case/empty), stovepipes and double feeds, slide lock, manual safety, selector rings, decockers, revolvers, pump/bolt actions, wear, misfire and jam odds, and a timed, rolled action for every manipulation with a fumble/drop/discharge ladder. Reuse it with new models and calibres.
- **Shooting** (`shooting.js`) is the user's stop-motion mode: X enters it, time freezes while you choose, each step (draw, safety, chamber, aim, fire) runs world time for its duration. The user wants this carried over ("Shooting should play as in tradecraft, with weapon handling"). The resolution math is clean, but the module imports 28 others (street world, police, crowds, heat). Rewrite the glue; keep the formulas.
- **Hit resolution** is a d20 check (`checks.js`): `d20 + skill + mods >= DC`, nat 1 fails, nat 20 succeeds. `DC = round(6 + (d·perM + d²·perM2)·acc + partDC)`. The shown odds are `clamp((21 − need)/20, 0.05, 0.95) × (1 − cover.keeps)`. A trained shooter saturates at 95% out to 15 to 25 m with a pistol and 50 m with a carbine; past that the quadratic term drops everyone to 5% (nat 20 only). Military ranges need retuning.
- The **body** (`health.js` and `medicine.js`) is very good and mostly pure: 6 parts with damage points against Fitness-scaled capacity, a typed injury list, blood % with textbook haemorrhage bands, per-wound bleed rates, an exertion multiplier, adrenaline, a pain limit tied to Fitness, a knockdown timer, infection as a hazard race against immunity, knitting with care multipliers, scars. OLYMPUS still needs to add oxygen, pressure, G-load, gravity deconditioning, radiation, stamina and a real consciousness model.
- **Armour** (`armour.js`, imports only `rng` and `clock`) uses per-layer coverage shares, a per-calibre stop table with a range ramp, wear per hit, residual penetration, blunt trauma (bruise, rib crack, winding, knockdown), a helmet dome, and blade interaction. It adapts well to vac-suit armour. A pressure-breach layer has to be added; tradecraft has none.
- **First aid, diagnosis and CQC** are rich and skill-driven. They are well worth adapting: aid steps can be re-cut into the military MARCH sequence; CQC needs low-g and zero-g and armoured-suit variants.
- **Training scenes**: the range (`scenarios/range.js`, with range-safety rules and a coach's dummy round) and the dojo (`scenarios/dojo.js`, scripted drills then bouts) are direct templates for "everyday training as it should be".

---

## 1. Foundation: the one roll, skills, dice

### 1.1 `checks.js` (79 lines; imports rng, skills, health, needs)
- `check(rng, { skill, value, dc, mods, hook, body })` (`checks.js:36`). It rolls `d20 = 1 + int(r, 20)`, then `total = roll + value + Σmods`. A nat 20 always succeeds and a nat 1 always fails; otherwise it succeeds when `total ≥ dc`. It returns `{ kind:'check', skill, value, roll, mods, total, nat, dc, hook, ok, margin = total − dc }`.
- `body: p` appends the roller's body modifiers (`health.mods(p, skill)`) and needs modifiers (`needs.mods(p, skill)`) (`checks.js:30`). Every gun action and every shot passes `body: p`, so wounds, pain, shock, fever, cold/heat and hunger all cost Weapon handling.
- `opposed(rng, ours, theirs, { hook, them })`: both sides roll and the higher total wins. Naturals don't auto-win, and ties go to the player's side.
- `hook` halves a DC (or the other side's total), rounded up.
- `DC = { easy 10, average 15, hard 20, veryHard 25, expert 30, elite 40 }`.
- The design rule (user-endorsed): every modifier is `{ why, v }` and shows in the log (`checkText`: "Weapon handling check: 14 + 12 − 2 (the dark) = 24 against 15, success."). OLYMPUS should keep this transparency.

### 1.2 `skills.js` (56 lines)
- Skills: deception, tracking, pathfinding, awareness, social, analysis, tech, **medicine**, **cqc**, **weapons** ("Weapon handling"), **fitness**.
- A sheet skill is `[trained base 0–20, practice 0–3]`. `TRAINED = { untrained 0, course 5, advanced 10, expert 15, master 20 }`.
- Value: `round((base + practice [+ fit.off for fitness]) × (1 + weight × overskill/100))`, minus rust, plus `sheet.strain` (fatigue, negative) (`skills.js:46–56`).
- Classes: `spook` (Tradecraft over-skill; weights deception/tracking/pathfinding/awareness 1, social/analysis 0.6, cqc/weapons 0.5). **`soldier` exists with over-skill "Warfighting" and empty weights**: an unfilled slot that fits OLYMPUS's Martian marine.
- Reference values used throughout the tests: untrained `[0,1] os 0` = **1**; "a Handler" `[5,1] os 38` = **7**; expert `[15,1] os 60` = **21**; master `[20,1] os 95` = **31**. Cops: patrol `[8,1]` = 9, armed response `[15,2]` = 17 (`armed.js:65`).

### 1.3 `rng.js`
- sfc32 state stored in game state (`state.rng`), so saves are exact. `hash()` is FNV-1a-like. `stream(...seeds)` builds an independent generator from any mix of strings and numbers. Many sub-rolls (armour layer, exit wound, knock duration, infection threshold) use their own `stream()` so they never shift the main dice. This is a good determinism discipline; reuse it as-is.
- `d20`, `int`, `range`, `pick`, `chance`, `weighted`.

---

## 2. Firearms: the guns themselves (`firearms.js`)

### 2.1 Data model
**KINDS** (`firearms.js:54–62`): range DC per metre (`perM`) and per metre² (`perM2`), sight-picture factor, turn factor, hands, and max aim range.

| kind | perM | perM2 | sight | turn | hands | maxM | extra |
|---|---|---|---|---|---|---|---|
| pistol / revolver | 0.45 | 0.01 | 1 | 1 | 1 | 60 | |
| smg | 0.3 | 0.004 | 1.05 | 0.95 | 2 | 100 | |
| carbine | 0.18 | 0.0018 | 1.15 | 0.85 | 2 | 250 | |
| rifle | 0.14 | 0.001 | 1.2 | 0.8 | 2 | 400 | |
| dmr | 0.08 | 0.0004 | 1.35 | 0.7 | 2 | 600 | |
| shotgun | 0.3 | 0.02 | 1.1 | 0.85 | 2 | 50 | close −3 DC within 12 m |

**CALIBRES** (`firearms.js:66–73`): `dmg` is a multiplier on the bullet's 7 points; `less` marks less-lethal. The user wants specific calibre names: "ammunition shouldn't be 'rounds' it should be very specific calibers based on specific caliber magazines used on specific weapons" (2026-11-03).
`.380/9×17 0.8 · 9×18 0.9 · 9×19 1.0 · 7.62×25 1.05 · .45 1.15 · .38 0.95 · .357 1.25 · 10×28T rubber 0.2 (less) · 4.6×30 1.05 · 9×39 1.45 · 5.45×39 1.5 · 5.56×45 1.5 · 7.62×39 1.7 · 7.62×51 2.0 · 7.62×54R 2.05 · 12ga buck 2.2 · .22LR 0.35`.

**FAMILIES** (box magazines, `firearms.js:92–100`): capacity and size [cm, litres], e.g. stanag 30 [19, 0.25], ak545 30, fal 20, svd 10, mp5 30, bizon 64 helical, saiga 8, anschutz 5. A pistol magazine is its own model's family, `MAG_SIZE = [12 cm, 0.06 L]`. Loose rounds come in boxes: `BOX = 20` rounds, `BOX_SIZE [9, 0.12]`.

**MODELS** (`firearms.js:104–157`): 44 models (19 pistols, 2 revolvers, 7 smg, 6 rifles, 6 carbines, 2 dmr, 2 shotguns **[test]**). Builder defaults:
- `P()` (pistol): `action semi, feed mag, safety manual, holdOpen true, acc 1, dmg 1, recoil 1, loud 1`.
- `L()` (long gun): `action semi, feed mag, safety selector, modes [semi, auto], holdOpen false, acc 1, dmg 1, recoil 0.7, loud 1.4`.
- Fields: `kind, cal, cap, mag (family), action 'semi'|'pump'|'bolt'|'da', feed 'mag'|'tube'|'cylinder', safety 'manual'|'none'|'selector', modes, burst (rounds), holdOpen, decocker, size [cm, L], acc (×DC by distance: <1 better), dmg, recoil (×recovery time and climb), loud (×hearing radius: MP5SD 0.2, AS Val 0.15), unreliable (×misfire/jam: converted blank-firer 4)`.
- Examples: Glock 17 `safety none, cap 17, recoil 0.95`; M4 `carbine, stanag, holdOpen, acc 0.95, recoil 0.6`; AK-74M `rifle, modes [auto, semi]` (an AK's lever goes safe→auto→semi); AK-12 `burst 2`; M16A4 `[semi, burst] burst 3`; SVD `dmr, [semi], acc 0.9, recoil 1.1`; Rem 870 `pump, tube, cap 4, recoil 1.4`; hunting rifle `bolt, tube, manual safety`.

### 2.2 Gun state (`{ type:'gun' }`, kept in `holder.arms[id]`)
- Ids: guns are `${model}#${owner}.${n}`, magazines `mag-${family}#…`. A gun's state travels with it: on a sheet (`p.arms`), or on a dropped ground item (`it.arms`, via `moveArm()` at `firearms.js:223`). A dropped gun picked up is the same gun. Someone else's gun is `known:false` until you `check` it.
- Fields: `mag` (id or null), `tube` (count), `cyl` (array of 'live'|'spent'|'dud'|null), `pos`, `open`, `chamber` ('live'|'dud'|'case'|null), `jam` (null|'double'), `locked` (slide locked back), `safety` (bool) or `mode` ('safe'|mode), `cocked` (decocker models), `cond` (0–1), `known`, `snap` (a coach's dummy round in the chamber), `by` (holder id).
- Magazine state: `{ type:'mag', fam, n, cond?, dummy? }`. Magazine condition: fresh `MAG_FRESH 0.95`; each drop on the ground costs `MAG_DROP_WEAR 0.04`; a "bent lip" fumble at the table leaves 0.3.
- `newGun()` (`firearms.js:235`) loads by default (mag full plus one chambered; tube full plus chambered; cylinder full), safety on (or selector on safe), `cond 0.95`.

### 2.3 Actions: time, DC, availability
**ACTIONS** (`firearms.js:183–202`), base seconds at pace 1 and DC:

| action | s | DC | notes |
|---|---|---|---|
| draw | from DRAW | from DRAW | `DRAW`: belt 1.0 s/DC 8, inside 1.7/10, coat 1.6/10, trousers 2.3/12, **sling 1.6/9**, bag 4/12 |
| holster ("Put it away") | 1.3 | 6 | not ×LONG_K |
| safety | 0.4 | 6 | INSTANT (×pace²) |
| decock | 0.4 | 5 | INSTANT |
| selector | 0.4 | 6 | INSTANT; cycles ring `['safe', ...modes]` |
| rack (slide / charging handle / pump / bolt) | 0.8 | 8 | clears dud or case, ejects a live round |
| dropMag | 0.5 | 5 | magazine to the ground (−0.04 mag cond) |
| stowMag | 1.4 | 7 | magazine to a pocket (tactical/retention) |
| insertMag | 1.4 | 9 | fullest spare of the family first (`sparesFor`) |
| release (slide/bolt release) | 0.3 | 6 | only when locked back on a loaded magazine |
| clear (double-feed drill) | 4 | 12 | "Lock, strip, rack, rack, rack, in, rack" |
| check | 1.6 | 6 | sets `known` |
| chamber1 (single round by hand) | 3 | 10 | no magazine in, loose round of the calibre |
| load1 | 0.9 (cylinder 1.2) | 6 | a round into a tube or cylinder |
| openCyl / eject / closeCyl | 0.6 / 0.7 / 0.4 | 5 | revolver |
| fill (a magazine, per round) | 2.2 × n | 4 | |

- **Pace** (`firearms.js:262`): `pace = clamp(1.6 − weapons/30, 0.5, 1.6)`. Time = `s × pace`, or `s × pace²` for INSTANT thumb work. The user, 2026-11-03: "high skill makes this virtually instant". Long guns cost `LONG_K = 1.15` more on everything except holster and draw.
- `canDo(p, id, where)` (`firearms.js:283`) returns the legal actions for the current state, in a sensible order. A gun not in hand offers only `draw`. A double feed puts `clear` first. A dud or case offers `rack`. Otherwise: `release` when locked on a loaded magazine; `rack` when the magazine has rounds and the chamber is empty; `rack` to empty a chamber with no magazine; `dropMag`/`stowMag` with a magazine in; `insertMag` with a spare; `chamber1`; `check` if unknown; `holster` always.

**Derived manipulation times [derived]** (seconds; Glock pistol / M4 rifle; draw from belt / sling):

| hand (WH value, pace) | draw | safety | rack | insertMag | emergency reload (drop + insert + release) | tactical (stow + insert) | AK reload (drop + insert + rack) | tap-rack | double-feed clear | aim front / 90° / behind (pistol) |
|---|---|---|---|---|---|---|---|---|---|---|
| untrained (1, 1.567) | 1.57 / 2.51 | 0.98 | 1.25 | 2.19 | 3.45 / 3.96 | 4.39 | 4.86 | 1.25 | 6.27 | 0.94 / 2.50 / 3.44 |
| Handler (7, 1.367) | 1.37 / 2.19 | 0.75 | 1.09 | 1.91 | 3.01 / 3.46 | 3.83 | 4.24 | 1.09 | 5.47 | 0.82 / 2.05 / 2.73 |
| expert (21, 0.900) | 0.90 / 1.44 | 0.32 | 0.72 | 1.26 | 1.98 / 2.28 | 2.52 | 2.79 | 0.72 | 3.60 | 0.54 / 1.32 / 1.73 |
| master (31, 0.567) | 0.57 / 0.91 | 0.13 | 0.45 | 0.79 | 1.25 / 1.43 | 1.59 | 1.76 | 0.45 | 2.27 | 0.34 / 0.67 / 1.22 |

A failed roll adds `FUMBLE_K = 0.6`, so the action takes ×1.6.

**[test] draws from the beltline (400 each):** untrained (1) 1.85 s, fumbled 30%, mishap 4%; Handler (7) 1.39 s, 3%, 2%; expert (21) 0.92 s, 4%, 0%; master (31) 0.59 s, 7% (nat 1s), 0%. **2000 draws of a chambered Glock:** untrained fumbled 475, dropped 56, went off 28; Handler 62/34/0; expert 96/0/0. **40 discharges while drawing:** own leg 15, someone else 3.

### 2.4 `act()`: the roll, the fumble ladder, mishaps (`firearms.js:325–391`)
1. Roll Weapon handling against the action's DC with the moment's mods. The shooting mode passes `stress()` (`shooting.js:352`): no light to see the gun −2, being shot at in the last 5 s −3. The body's mods are always added.
2. Fail: time ×1.6 ("Fumbled, it takes longer").
3. The mishap ladder (the user, 2026-11-03: "fumbling should have consequences … the consequence should depend on weapons handling skill … could result in accidental discharge"):
   - `margin ≤ −DISCHARGE_BY (10)` (−15 on a decocked DA gun: `DA_GUARD 5`), and the gun `ready()`, and the action is one of draw/holster/safety/selector/check/insertMag/closeCyl/rack/release → **discharge** (`fire()` is called; the caller resolves the round).
   - `margin ≤ −DROP_BY (6)` → **dropped**: `dropMag` if the action was insertMag/dropMag/stowMag, otherwise the gun drops.
   - A natural 1 with skill `< NAT1_DROP_BELOW (10)` draws its own die `u`: skill `< NAT1_SHOT_BELOW (5)` gives a shot if `u < NAT1_SHOT 0.4` (never decocked) and a drop if `u < 0.8`; skill 5–9 drops if `u < 0.4`. Skill ≥ 10 turns a nat 1 into just a fumble.
4. The state changes by action (safety toggle, selector ring, rack/feed/eject logic, magazine moves, clear, chamber1, load1, cylinder ops). Moving items between hand, pocket and ground is the caller's job (`shooting.finish()`).

### 2.5 `fire()`: one trigger pull (`firearms.js:424–453`)
- Refusals (`why`): 'safety', 'broken' (`cond < BROKEN 0.25`), 'open' (cylinder), 'jammed', 'empty', 'case' (pump/bolt not worked), 'dud'.
- Revolver: the pull advances `pos`; an empty chamber clicks; misfire → that chamber becomes 'dud' (clicks, then moves on); fired → 'spent', `cond −= WEAR`.
- Magazine/tube guns: a dummy (`snap`) clicks as a dud. Misfire → chamber 'dud'. Fired → `cond −= WEAR 0.0008`. Pump/bolt leave a 'case' to be worked. Semi-autos then roll a stoppage: `jamChance + MAG_JAM 0.3 × max(0, 0.9 − mag.cond)`. A stoppage is a double feed `DOUBLE_SHARE 0.3` of the time (if the magazine still has rounds), otherwise a stovepipe ('case'). With no stoppage the gun feeds the next round, or on empty sets chamber null and `locked = mag && holdOpen`.
- **Reliability** (`firearms.js:414–416`), with `wearK = clamp((1 − cond)/(1 − 0.25), 0, 1)`:
  - `misfire = (0.002 + 0.05 × wearK) × unreliable`
  - `jam = (0.004 + 0.12 × wearK² + (pistol && WH < 6 ? 0.03 "limp wrist" : 0)) × unreliable`
  - Service thresholds: `COND_SERVICE 0.6` ("it wants cleaning"), `BROKEN 0.25` (won't fire). From 0.95, it takes ~437 rounds to reach 0.6 and ~875 to reach 0.25. `service()` restores cond to ≥ 0.95 and clears jams, duds and cases (`SERVICE_MIN 30` min at a table; `gunwork` uses 20 min).
  - **[test]** cond 0.95: dud 0.6% of pulls, stoppage 0.3% of shots; cond 0.6: 3.0% / 3.5%; cond 0.35: 4.9% / 10.1%.
- `feed(g, mag)` (`firearms.js:460`) is the single place a round enters the chamber. It handles the coach's dummy (`mag.dummy` = the count at which a dummy comes up).
- `said()` gives a holder's readout ("Makarov: one in the chamber, a magazine with 7 of 8, safety on, and it wants cleaning.").

### 2.6 Muzzle direction and discipline (what is and isn't modelled)
- The muzzle is the holder's heading (`me.head`, radians). There is no separate low-ready/high-ready/sling posture.
- **Muzzle discipline** only matters when a gun goes off unasked (`shooting.js:109–113`): `muzzleSafe(p) = clamp((WH − 4)/(28 − 4), 0, 0.97)` is the chance it was pointed "down and away" (the round goes into the ground or floor). **[test]** pointed safe when it went off: untrained 0%, WH 10 29%, WH 20 71%, WH 30 97%. Otherwise `SELF_SHOT` (draw 0.35, holster 0.45, else 0.1) sends it into your own leg; otherwise it goes along the heading ±`DISCHARGE_SPREAD 0.5` rad, and the first actor within 0.7 m of the line and 0.3–80 m away is hit `DISCHARGE_HIT 0.6` of the time. The user (2026-11-03): "high weapons skill should at least protect in ways of muzzle discipline allowing us not to shoot some random civilian in the head".
- **Range safety** (`scenarios/range.js:276–297`, `safety()`) watches the muzzle every tick while the gun is in hand. More than `UPRANGE_DEG 100°` off downrange (+x) **stops the evening**; more than `WARN_DEG 60°` gets a warning (repeated at most every `WARN_AGAIN_S 20` s). Aiming at any person stops it. Aiming at another lane's paper is a warning; firing at it stops it. Out of the booth with the gun drawn: a warning, then a stop after `OUT_GRACE_S 8` s. Any discharge not from a trigger pull stops it. Dropped club gear is handed back after `DROP_BACK_S 3` ("Never grab for a falling gun").

---

## 3. Shooting mode, in stop motion (`shooting.js`)

The user, 2026-11-03: "Shooting is going to be integrated in a stop motion way, heavily relying on the weapons skill … time stops while we get the weapon ready (unholster, load if needed, remove safety, aim etc), each step to ready a weapon has to be acted on by the player and will have time move forward as we do … Shooting mode is going to be a very specific mode explicitly entered and should only stop time if we're trying to shoot".

### 3.1 The mode
- `state.shoot = { phase:'choose'|'act', gun, pick, part, aim, doing }`. Toggle with X (`toggle()`, `shooting.js:129`). Entry is refused in a fight or conversation, inside a cab, hidden, down, unable to stand, or with both arms 'out'. The closest-to-front target is pre-picked.
- **G with a gun** enters the mode with the draw as step one (`readyGun()`, `shooting.js:365`). The user: "we shouldn't be able to draw a firearm out by pressing G … taking it out should imply we intend on using it, meaning that time stops and we enter the weapon ready sequence". G with a knife draws it at once.
- `options()` (`shooting.js:227`): if the gun isn't in hand, only Draw (plus "get down behind cover"). Otherwise Fire (disabled with "aim first" or `notReady()`'s reason; a trigger pulled on safe or empty still clicks and tells you), Aim at the picked target (with its time), every `canDo()` action with its time, and cover moves.
- Target picking costs no time: left/right cycle targets across the picture; up/down cycle the part (head/torso/legs); mouse-over picks (`pick=`). The user: "Make aiming more natural … but no list".
- `choose()` (`shooting.js:281`) starts the step: `doing = { what, from, head0, start, until }`, phase 'act'. `tick()` (`shooting.js:376`) holds your feet (`vx = vz = 0`), turns your heading during an aim, slides you into cover during a cover move, and calls `finish()` at `until`. `finish()` moves items (the gun to hand, magazine to ground or pocket, a dropped gun to the floor) and returns to 'choose'.
- The mode ends whenever you can't act at once: dead, down, pinned, in a fist fight, hidden, in a cab. The user, 2026-11-04: "it should cancel all of the stop motion mode when I get arrested or otherwise am unable to immediately do the shooting steps".
- Time is frozen only in 'choose'; `sim/game.js` stops the tick. Everyone else (NPC gunners included) acts in real time during 'act' steps. The user: "NPCs shooting at us should just move time forward normally as they do the things to ready their weapons".
- Steps that take the hands off the aim (dropMag, insertMag, release, rack, clear, chamber1, safety) push `aim.settled` to the step's end, so the aim has to re-settle.

### 3.2 Aim (`aimMs()`, `shooting.js:162`)
The user: "if you're not aiming you can't shoot"; "there should be a 'aim' action before shoot, which should take time".
- `AIM = { sight 0.6 s, turn { base 90°/s, per 6°/s per WH point }, arc { base 30°, per 2° per point, max 100° }, feet 0.4 s }`.
- `s = 0.6 × pace × K.sight + off° / ((90 + 6·WH) × K.turn) + (off > arc ? 0.4 × pace : 0)`.
- **[test]** front / 45° / 90° / behind: untrained 0.94/2.04/2.50/3.44 s; Handler 0.82/1.71/2.05/2.73; expert 0.54/0.75/1.32/1.73; master 0.34/0.50/0.67/1.22.
- A held aim follows a moving target inside the arms' arc and drops if they leave it. Each second held gives `+HELD 3` to the shot, capped at `HELD_MAX +4` (reached after 1.33 s). While the muzzle is still coming down from the last shot (`aim.settled` in the future): `−2`.
- Targets: actors in view on your row and inside the on-screen frame (`FRAME_M` half-extents 20 × 11 m unless the page gives `state.$frame`), within the kind's `maxM`. Items on the ground: ≤ 30 m.

### 3.3 Hit odds and every modifier (`odds()` `:170`, `shotOf()` `:185`)
`DC = round(SHOT.dc 6 + (d·perM + d²·perM2) × M.acc + partDC)`, where `partDC = torso 0, head +6, legs +3`, an item on the ground +4, and a bull's-eye paper +6 regardless of part.

Modifiers (`{why, v}`):

| source | value |
|---|---|
| aim held | +round(min(4, held_s × 3)) |
| still coming down from the last | −2 |
| being shot at (you, last 5 s) | −4 (and −3 on gun actions) |
| target running (> 2.5 m/s) / walking (> 0.3 m/s) | −5 / −2 |
| light on the target: dark (< 0.25) / dim (< 0.6) | −4 / −2 |
| shotgun within 12 m | +3 |
| decocked DA first pull | −1 (and +0.15 s) |
| burst or tap follow-up k | −round(2 × k × recoil × climbOf(p)); `climbOf = clamp(1.4 − WH/25, 0.35, 1.4)` |
| shooter's body (health.mods 'weapons') | arm hurt −1, wounded −3, broken −6 (splinted −3; tourniquet counts as broken); head hurt −1 / wounded −3; pain −1/−2/−3; pale −1, shock −3; fever −1/−2/−4; cold/heat −1…−10; arm crack −2 / fracture −3; a crooked old break −1 |
| needs | hungry (6 h) −1, starving (14 h) −2, weak −3 |
| fatigue (`sheet.strain`) | awake > 16 h −1; > 20 h −3, then −1 per 3 h more, to −12 |

`need = DC − WH − Σmods`. Shown odds are `p = clamp((21 − need)/20, 0.05, 0.95) × (1 − cover.keeps)`.

Not modelled: the shooter's own stance (standing/kneeling/prone/braced), shooting while moving (the mode holds your feet), wind, target size beyond the part DC, bullet drop, time of flight, and penetration through soft obstacles other than cover's `stop`.

**Shot DC by distance [derived]** (torso, before skill and mods):

| model | 3 | 7 | 10 | 15 | 25 | 50 | 100 | 200 | 300 m |
|---|---|---|---|---|---|---|---|---|---|
| Glock 17 | 7 | 10 | 12 | 15 | 24 | 54 | – | – | – |
| Makarov (acc 1.1) | 8 | 10 | 12 | 16 | 25 | 58 | – | | |
| MP5 | 7 | 8 | 9 | 11 | 16 | 30 | 73 | | |
| M4 | 7 | 7 | 8 | 9 | 11 | 19 | 40 | 109 | – |
| AK-74M | 6 | 7 | 8 | 8 | 10 | 16 | 30 | 74 | 138 |
| SVD | 6 | 7 | 7 | 7 | 8 | 11 | 17 | 35 | 60 |
| Rem 870 (before the +3 close bonus) | 7 | 9 | 11 | 15 | 26 | 71 | – | | |

**Hit % with the aim held (+4), daylight, standing target [derived]**: Glock at WH 7: 95/95/95/85/40/5% at 3/7/10/15/25/50 m; at WH 21: 95% to 25 m, 5% at 50 m. M4 at WH 7: 95% to 25 m, 65% at 50, 5% at 100; at WH 31: 80% at 100 m. SVD at WH 21: 55% at 200 m; at WH 31: 95% at 200, 5% at 300.

**[test]** pistol hit rates, body, daylight, standing (fired as the aim settles at 3/7/15 m; aimed 1.5 s at 3/7/15/25/40 m): Handler 79/68/40%, aimed 94/89/60/16/6%; expert 95/95/96%, aimed 96/94/95/85/5%; master 94/94/95%, aimed 94/94/94/95/41%. Expert, aimed, at 5/25/50/100 m: Glock 95/90/5/5; MP5 95/95/60/5; M4 95/95/95/10; AK-74M 95/95/95/60; SVD 95/95/95/95; Rem 870 95/80/5/5. Handler in the live game: drawn 1.45 s, safety 0.80 s, aim 1.15 s (odds 60% → 70%), shot and recovery 0.65 s, 40 passers-by ran.

**Design observation for OLYMPUS:** the d20 band is only 20 points wide, so outcomes are binary-ish. Anyone with skill ≥ DC−1 gets the 95% cap. The quadratic term makes every pistol beyond ~35 m a nat-20 lottery. That works for city spycraft. Military combat at 50–400 m with suppression would need flatter per-metre terms, a wider die (or 3d6/2d10), and/or a dispersion-cone model that still reports its pieces as `{why, v}`.

### 3.4 Firing, bursts, double/triple taps
- `roundsOf()`: selector on auto fires `AUTO_ROUNDS 4` (a short burst); burst mode fires `M.burst ?? 3`; else 1. Each round is its own `fire()` and its own roll with the climb penalty. The burst stops on a stoppage, an empty gun, or a dead target.
- `fireMs = 0.15 (TRIGGER_S) + (n−1)·0.1 (BURST_GAP_S) + 0.35 (RECOVER_S) × recoil × pace × (1 + 0.3(n−1))` seconds. **[derived]** Glock single: 0.67 s untrained, 0.60 Handler, 0.45 expert, 0.34 master. AK 4-round burst: 1.18 / 1.09 / 0.87 / 0.71 s. 1911 (recoil 1.25): 0.84 / 0.75 / 0.54 / 0.40 s.
- **Taps** (the user, 2026-11-04: "double tap instead of fire when pressing 1 while the time is unfrozen after the first shot, and when skilled enough up to triple tap … with accuracy dropping … from recoil and recoil lessened by higher weapons skill"): pressing Fire again during the 'act' phase of a shot, within `fireMs(p, M, 1)` of its start, fires a follow-up at the same aim. `tapsOf`: 2 rounds from WH 8, 3 from WH 18. Only semi/da/sa actions on semi mode qualify. Each follow-up adds `TAP_SPLIT_S 0.25` + recovery. **[test]** WH 4: one shot (climb ×1.24); WH 12: double tap (×0.92); WH 24: triple (×0.44).
- A miss can hit someone behind (`stray()`, `shooting.js:509`): the first actor beyond the target within 0.7 m of the line, up to 80 m, takes it `STRAY.hit 0.25` of the time (torso or legs).
- **Heard** (`heard()`, `shooting.js:615`): passers-by within `HEAR_M 70 × loud` flee. Off a range, the player's shot raises campaign heat (`SHOT_HEAT 8`, at most once a minute) and sets `$shotBy` (the police come). On a range nobody reacts. **[test]** AK burst: 29 passers-by ran; AS Val (suppressed, loud 0.15): 2 ran.

### 3.5 The NPC's shot (`npcShot()`, `shooting.js:200`)
NPCs always aim at the torso. Their mods: aim held (`min(4, held×3)`) and burst climb `−round(2·k·recoil)` (no `climbOf`, and no "being shot at" penalty for NPCs). Cover is resolved by `into()`. The log names where an unseen shooter fired from ("Right behind you, 7 m off: A police officer fires. You: hit in the chest."). Being hit or shot at sets `state.$shotAtMs`, which gives the −4 and −3 above.

### 3.6 Known quirks to fix when porting
1. `odds()` (shown to the player) omits the body and needs modifiers that the real roll applies (`shooting.js:178` vs `:456`), so a wounded shooter's displayed % is optimistic.
2. Bullets knock down only AI actors (`knock = … a.ai ? knockS(…) : 0`, `shooting.js:571`); the player is never bullet-knocked, only staggered by armour hits. This may be deliberate.
3. NPC bursts ignore `climbOf`, and NPCs never suffer "being shot at".
4. A torso shot diverts to an arm 12% of the time (`shooting.js:532`), even when the aim margin was huge.
5. A shotgun is one big bullet (dmg 2.2), not pellets.

---

## 4. From bullet to wound (`shooting.bullet()`, `shooting.js:528–580`)

1. **Part**: legs → legL or legR; torso → 12% an arm; head.
2. **Damage**: `raw = BULLET 7 × CALIBRE.dmg × MODEL.dmg × U(0.8, 1.25)` points.
3. **Torso on armour** → `armour.bullet()` (§5). If stopped → `stopped()`: blunt points on the torso, a 'blunt' injury lasting 10 days, a rib crack chance, a knock (winded; NPCs lose their aim, sometimes are knocked off their feet; the player staggers and loses the aim). The shooter learns there's armour (`noteArmour`). If it penetrates, damage is ×`PEN_K` (soft 0.85, plate 0.6). A torso hit that misses the armour's coverage is named for where it landed (`EDGES`: "side, under the arm", "shoulder", "lower belly").
4. **Head with a helmet** → `helmetBullet()` (§5). If stopped: head +0.5 points, dazed 2–6 s, no wound.
5. `hurt(part, dmg)`; `force = dmg / takes(part)`.
6. **Less-lethal** (rubber): `injure(force, crackK 0.5)`, bruising and maybe a crack, no cut.
7. **Lethal**: `injure(edge, deep, bleedK = (torso 0.6 | limb 0.9) × min(1.6, cal.dmg))` produces a deep 'cut' flagged `gunshot`. Its bleed rate is `(1 + 8·force) × bleedK` %/min. A limb (or neck) cut with force ≥ 0.35 becomes an **artery** with chance `0.15 + 0.2·force`, bleeding 10–15 %/min. A deep wound bleeds for `DEEP_H 6` h untended, which is effectively forever. **Exit wound**: `i.through = chance(EXIT_P[part] × min(1.3, cal.dmg))`, with EXIT_P torso 0.4, arm 0.75, leg 0.6, head 0. A crack is likely when force ≥ 0.5: chance `0.4 + 2(force − 0.5)`.
8. **Head** (the user, 2026-11-03: "shot in the head should mean something"): death with chance `min(0.95, HEAD_KILL 0.6 × max(1, cal.dmg))`. Otherwise `HEAD_GRAZE 0.3`: a scalp graze, rate ≤ `GRAZE_RATE 0.8` %/min, stops within `GRAZE_BLEED_MIN 20` min, never an artery (the user, 2026-11-04: "it looks bad without being that bad, definetly not minutes away from death"). Otherwise a **bullet in the skull**: the head is hurt to its full capacity (out cold), plus an internal bleed `BRAIN_BLEED 1.2` %/min for 12 h, untreatable by first aid, which means death within about an hour without a hospital. **[test]** 200 head shots: 112 dead, 65 out cold with a bullet in the skull, 23 grazed. Helmet: Makarov head shots turned 51% (deaths 61% → 28%), AK 1%, SVD 1%.
9. **Chest**: an internal bleed `CHEST_BLEED 0.25` %/min lasting `CHEST_BLEED_H 3` h. Each further chest bullet adds +0.25, up to `CHEST_BLEED_MAX 1.0`, and resets the 3 h.
10. **Knockdown** (AI only): `knockS()` (§6.7). Blood spatter. Down if dead, unable to stand, or knocked: `downUntil = now + knock` (or `OUT_MS 60 s`).

**Gunshot outcomes [derived]** (point damage, and force at Fitness 0 / 10; torso capacity 12 / 18, arm 8 / 12, leg 9 / 13.5):

| round | mean pts (range) | torso fit 10: state, external %/min | arm fit 10: state, %/min, artery chance | collapse in (torso fit 10, external + 0.25 inside) |
|---|---|---|---|---|
| Makarov 9×18 | 5.7 (4.5–7.1) | bruised, 1.90 | hurt, 3.87, 24% | 20.9 min |
| Glock 9×19 | 7.0 (5.6–8.8) | hurt, 2.47 | hurt, 5.10, 27% | 16.6 min |
| 1911 .45 | 8.0 (6.4–10.1) | hurt, 3.16 | wounded, 6.59, 28% | 13.2 min |
| AK-74M / M4 | 10.5 (8.4–13.1) | hurt, 5.10 | wounded, 10.8, 33% | 8.4 min |
| AKM 7.62×39 | 11.9 | hurt, 6.04 | wounded, 12.86, 35% | 7.2 min |
| SVD 7.62×54R | 14.3 | wounded, 7.08 | **out** (broken), 15.2, 39% | 6.1 min |
| 870 buckshot | 15.4 | wounded, 7.53 | out, 16.2, 41% | 5.8 min |

At Fitness 0 a single rifle round puts an arm or leg 'out' (broken), and two in the torso put the torso 'out', which with a gunshot means `chestGone` and staying down. Quirk: the uncapped `(1 + 8f)` limb rate makes a non-artery rifle limb wound (15–23 %/min) bleed faster than a cut artery (10–15). Clamp it below the artery rate when porting.

**[test]** "two in the chest: down 91 s; two minutes on: slump, blood 90%"; "mobility with a fresh bullet wound 0.80, can run: false"; 20 body + 20 head shots with a Makarov: 11 dead, 29 more down.

---

## 5. Body armour and helmets (`armour.js`, 247 lines)

The user, 2026-11-04: "heavy worn as outside clothes for military grade and used by soldiers and armed police, light is concealable but noticeable when inspected from up close and worn under clothing. It should protect realistically from bullets, and a little from knives and other cutting implements (realistically)".

- **KINDS**: `light` is a soft vest (NIJ IIIA-ish, 2.5 kg, under the top, `cover { soft 0.75 }`). `heavy` is a plate carrier (steel plates over soft armour, 11 kg, over the top, `cover { plate 0.5, soft 0.25 }`, metal: it rings a metal detector).
- **Where a torso hit lands** (`layerHit()`, `armour.js:139`): `u = U(0,1) × (1 − AIM_K 0.2 × centre)`, with `centre = clamp(margin / AIM_MARGIN 10, 0, 1)`. Plate if `u < plate`, soft if `u < plate + soft`, else uncovered. A well-aimed hit lands more centrally. This came from the user's complaint (2026-11-04): "my soft vest didn't seem to stop the two bullets from the police officer shooting at me". With margin 10, a soft vest catches 0.94 of torso hits. Limbs, neck and face are never covered.
- **STOP** (`armour.js:69–77`), per calibre. `[close, far]` pairs ramp linearly between `CLOSE_M 10` and `FAR_M 40` m:
  - soft: 9×17 1, 9×18 0.99, 9×19 0.98, .38 0.99, .45 0.99, .357 0.95, 7.62×25 [0.45, 0.8], 4.6×30 [0.1, 0.3], 9×39 0.1, 12ga 0.95, every rifle round 0.
  - plate: every handgun round 1, 4.6×30 0.99, 9×39 0.85, 5.45 0.95, 5.56 0.92, 7.62×39 0.96, 7.62×51 0.9, 7.62×54R 0.85; unknown calibres 0.9.
  - helmet (NIJ IIIA shell, `HELMET_COVER 0.55` of head hits on the dome; the face is bare): handgun rounds 0.95–0.98, .357 0.85, 7.62×25 [0.35, 0.7], rifles [0.02, 0.1–0.15].
- **Wear**: each stopped round lowers that layer's stop chance by `WEAR { soft 0.02, plate 0.03, helmet 0.05 }`, at most `WEAR_MAX 0.3` total.
- **Blunt trauma** (`BLUNT`): soft `{ k 0.22, crack 0.05, knock 0.1 }`, plate `{ k 0.3, crack 0.06, knock 0.15 }`. Blunt points = `bulletPts × k`. Crack chance `min(0.5, crack × w²)` with `w = max(0.2, cal.dmg)`. Knocked down `min(0.6, knock × w)`. Winded `U(1, 3) s × w` (`KNOCK_S`). The injury lasts `BLUNT_DAYS 10` ("a bruise the size of a fist, where the vest stopped a round"; "a black bruise the size of a hand, where a plate stopped a rifle round").
- **Blades** (`blow()`, `BLOW`): a plate stops any blade (0.2 of it felt) and spreads blunt blows (×0.7). Soft armour turns a slash 70% of the time (otherwise a shallow cut at ×0.6), a stab 25% (otherwise deep at ×0.85), a point 10% (×0.9); blunt ×0.9. A fight ender targets where the armour isn't.
- **Costs**: warmth (`WARM` light 0.5, heavy 1; against the cold only ×0.4); legs (`MOBILITY` heavy ×0.92); training load (`LOAD` light 1.05, heavy 1.5, multiplying walk/run fitness points); visibility (`SEEN_MOD 4` for a carrier on a civilian).
- **Spotting a soft vest** (`vestCheck`): Awareness vs `VEST_DC 15`, −2 per metre beyond the first, top modifier (tee +3, dress +2, suit/jacket −2, robe −3, coat −7), dark −3 / dim −1; impossible beyond 4 m.
- **Issue**: the armed response always wears a carrier (plus a helmet where the country issues one). Patrol vest share is per country (London 95%, Moscow 23%, Beirut 33%, Cairo 12% **[test]**). Bodyguards wear a vest 35% of the time.
- **[test]** torso hits at 10 m with margin 0 (strays): soft vest stops 75% of Makarov/Glock/1911 hits (coverage-limited); Tokarev 32%; MP7 7%; rifles 0%. Plate carrier: handguns ~75%, MP7 53%, AK-74M 47%, AKM 48%, M4 45%, SVD 44%. Blunt points 1.3 (Makarov soft) to 4.4 (SVD plate); rib crack 4% to 27%; off their feet 9% to 29%. Aimed patrol fire into a soft vest at 6 m: 91% of body hits stopped (PL-15), 89% (Makarov); at 15 m 87%. A Tokarev into a soft vest stops 32% at 4 m and 61% at 40 m. Blades on the torso: soft slash stopped 70%, stab 24%, point 10%; plate slash 90% of torso blows. Combat knife vs bare hands (CQC 10 v 10), deep torso wounds per fight: no armour 0.40, soft 0.22, plate 0.17.

---

## 6. The body (`health.js`, 404 lines; imports skills, rng, clock, medicine, thermal, armour)

The user, 2026-10-26: "health bodypart by bodypart"; "work on the bleeding out system, with blood-pressure health stat". 2026-10-28: "a robust health system inspired by Rimworld and Project Zomboid".

### 6.1 Parts, capacity, states
- `PARTS` with base capacity (`takes`): head 6, torso 12, armL/armR 8, legL/legR 9. `takes = base × (1 + Fitness/FITNESS_K 20)`, so Fitness 10 gives ×1.5. Damage is points per part (`p.body`).
- States by `damage/takes`: unhurt (0), bruised (> 0), hurt (≥ 1/3), wounded (≥ 2/3: won't mend untended), out (≥ 1: a limb broken, the torso "down", the head "out cold").
- `canStand` requires: not dead, not thermally down, not fainted, blood ≥ 55, at least one leg not out, torso not out, head not out. `canGrapple` requires both arms not out and no tourniquet.

### 6.2 Skill costs of hurts (`mods(p, key)`, `health.js:116`)
- Applied to every check: thermal; fever (−1/−2/−4); pain bands (−1/−2/−3, **except in CQC**: "adrenaline, you feel it after"); shivering wet −1; a heavy cold −1; blood pale −1, shock and worse −3; head hurt −1, wounded or out −3.
- CQC and Fitness also take: torso hurt −1, wounded −3; legs hurt −1, wounded −2, broken −4 (splinted −2; a tourniquet counts as broken).
- CQC and Weapons also take: arms hurt −1, wounded −3, broken −6 for weapons / −4 for CQC (halved if splinted).
- Cracks −2 and fractures −3 wherever the part is used (head crack −1, fracture −2 to everything). Scars from a crooked break: −1 forever.

### 6.3 Injuries (`INJURIES`, `injure()` at `health.js:177`)
- Kinds and durations: crack 21 d; split brow/lip 7 d, bleeding 120–300 s at 0.15 %/min; nose 1 d, 60–150 s at 0.1; fracture 42 d; cut 10 d, bleeding 180–600 s × bleedK (shallow).
- `injure()`: an adrenaline surge, then: fracture (if asked, e.g. a fight ender); else a crack when `force ≥ CRACK_AT 0.5 − crackK` with chance `min(1, 0.4 + crackK + 2(force − 0.5))`; edged weapons with force > 0.05 cut (deep or artery as in §4); a head hit splits the skin at force ≥ 0.3 (45%) or bloodies the nose at ≥ 0.2 (40%). Bleeding wounds mark `p.bloody` (face or clothes), which affects how you're seen.
- Cut rates: shallow `(0.3 + 3f) × bleedK`; deep `(1 + 8f) × bleedK`; artery 10–15 %/min (limbs and neck only, chance `0.15 + 0.2f`, needs `deep && force ≥ 0.35`).

### 6.4 Blood (the "blood-pressure stat")
- `p.blood` is % of normal. Bands (`BLOOD`): ≥ 85 steady; 70–85 **pale** (−1); 55–70 **shock** (−3, no running); 45–55 **collapsed** (down, can't stand); < 45 **dead** (bled out).
- `bloodTick()` (`health.js:225`): blood falls by `Σ rate × k × s/60` while anything bleeds; otherwise it regenerates at `REGEN_PER_H 2` %/h (about a litre in half a day). From collapse (55%) back to 100% takes ~22.5 h.
- `k` = pressure (`PRESSURE_K 0.35` while hands are pressed on the wound) × exertion (`EXERTION`: crawl 1.25, walk 1.5, run 2.5, still 1). The user, 2026-11-04: "Moving away should increase blood loss if realistic".
- Collapsed, with nothing bleeding, lying flat: you come round after `COME_ROUND_S 90` (blood set to 55.5%) (`game.js bloodBeat()`).
- **[test]** bloody nose 0.10 %/min (never matters); shallow cut (force 0.2) 0.90 %/min; clean kitchen-knife stab (force 0.4) 5.46 %/min (pale 2.7 min, shock 5.3, collapse 8.2, dead 10); arm artery (force 0.6) 12 %/min (pale 1.2, shock 2.5, collapse 3.7, dead 4.5). A stab at 6 %/min loses 6.0% in a minute untended, 1.05% in 30 s pressed. Untended for 3 h: dead.

### 6.5 Adrenaline, pain, incapacitation
- **Adrenaline** (the user, 2026-11-04: "Adrenaline should be modelled as a short term pain reduction thing"): any injury, or being in danger, calls `surge()`. Pain felt is ×(1 − 0.6·k), where k = 1 for `holdS 40` s and then fades linearly over `fadeS 80` s. **[test]** a bullet in the body is 28 pain points, felt as 11 at 0 s and 30 s, 20 at 80 s, 28 by 120 s.
- **Pain points** (`medicine.PAIN`): by part state bruised 3, hurt 9, wounded 18, out 30; plus injuries crack 8, fracture 22, cut 3, deep 10, artery 12, split 2, nose 1, blunt 4; plus infection/6. Halved for a splinted break or a poulticed part. Painkillers ×0.4 for `DOSE_H 6` h (redosable after 4 h). Bands: ≥ 25 in pain −1, ≥ 45 bad pain −2, ≥ 70 agony −3.
- **Pain limit** (the user: "Pain resistance should be linked to fitness level, over a certain pain threshold, people just lit up against a wall or lie down"): `30 + 2 × Fitness` (**[test]** Fitness 0/5/10/20 bear 30/40/50/70). Past the limit (`over`): they stop and sit. Past 1.4× the limit, or in shock (`floored`): they lie down. `incapacitated()` (injured and either in shock or past the limit) takes an NPC gunner out of the fight.
- `woundsNow()` (`health.js:318`) returns `{ pain, limit, over, floored, dizzy (blood < 85, or a head injury in the last 10 min), shock }`.

### 6.6 Mobility
- The user (2026-11-03): "wounds should slow everyone down especially gunshot wounds".
- `mobility = Π legs { hurt 0.85, wounded 0.55, out 0.3 } × torso { hurt 0.9, wounded 0.65 } × blood { pale 0.85, shock 0.6 } × (gunshot within 3 days ? 0.8) × armour (carrier 0.92)`. No running below 0.7, in shock, or weak from hunger.
- Walk pace from legs (`paceOf`): worst leg broken ×0.5 (×0.75 splinted), wounded ×0.8.
- Crawl: `0.25 m/s × torso × blood factors`, ×0.6 with one arm.

### 6.7 Knockdown, staying down, consciousness, death
- **Knockdown from a bullet** (the user, 2026-11-04: "being knocked down is a logical result of getting shot. Staying down should be justified (pain level, shot in legs, blood loss, loss of consciousness)"):
  - `knockS = clamp(U(KNOCK_S[part]) × pain factor × blood factor × (trained ? 0.4 : 1), 2, 180)` seconds.
  - `KNOCK_S`: arm 4–12, leg 10–30, torso 20–60, head 15–35. Pain factor: in pain 1.3, bad pain 2, agony 3. Blood factor: pale 1.3, shock 2. "Trained" means anyone who isn't a civilian or passer-by.
  - **[test]** arm 9 s (4–15), leg 20 (11–35), body 46 (24–70), body trained 22 (11–31).
- `staysDown` (after the knock): out cold (dead, thermally down, blood < 55, or a bullet in the skull), both legs out, or the chest out from a gunshot. Can crawl if down only because of the legs, awake, and with a free arm.
- Consciousness is not a separate variable. "Out cold" is derived (`outCold()`) from the head being 'out', blood < 55, thermal down, or a bullet in the skull. A head knocked 'out' by blows comes round on a clock (`interact.DOWN_S 60` s) and mends by the day.
- **Death causes**: `kill(p, ms, why)` from a head shot; bleeding out below 45%; sepsis; core temperature below 28 or above 42.5 °C; CQC knockouts and slams (§8.6); an armed kill; strangling (150 s, CQC vs DC 8, ×1.6 time on failure); a throat cut (4 s); bludgeoning (8 s); a point-blank shot (1 s) (`interact.js:64–65`).

### 6.8 Thermal and fatigue (adjacent, used by the same mods)
- Core temperature stages (`thermal.STAGES`): < 36 shivering −1; < 35 hypothermia −3, slow ×0.85; < 33 severe −6, ×0.7; < 31 collapse (down); < 28 dead. > 38 hot −1; > 39.5 exhaustion −3, ×0.85; > 41 stroke (down); > 42.5 dead. The core relaxes toward a target over `TAU_COLD 60` / `TAU_HEAT 45` / `TAU_IN 30` minutes.
- Fatigue (`campaign.fatigue()`): awake > 16 h −1; > 20 h −3, then a further −1 every 3 h, to −12; words change at 36 h and 48 h. The user, 2026-11-03: "extreme fatigue (like from not sleeping for too long) should chip away at skill efficiency".
- **No stamina or breath model exists** in tradecraft. Running is gated only by mobility, shock and hunger.

---

## 7. Medicine: supplies, infection, healing over days (`medicine.js`, 251 lines; pure)

### 7.1 Supplies and carry
- `SUPPLIES` (uses, USD): bandage 1 ($3), antiseptic 6 ($6), suture kit 3 ($25), splint 1 ($15), tourniquet 1 ($20), painkillers 10 ($5), arnica poultice 3 ($6), course of antibiotics 1 ($30). First-aid kit `KIT = { bandage 4, antiseptic 3, painkillers 4, poultice 1 }`, $28. Home cabinet: 2 bandages, 3 antiseptic, 6 painkillers.
- Each takes pocket room (`weapons.SIZES`: bandage [8 cm, 0.08 L], splint [24, 0.4], tourniquet [15, 0.12] …).
- The user, 2026-11-04: "remove the ability to just rip a strip from a shirt to bandage on the fly, we will build a crafting system later on to make bandages from clothing"; on tourniquets "same comment about tourniquet without belt"; "don't keep the splint if it uses a non consumed item (shirt strips are not an item)". The improvised modifier `IMPROVISED −2` is kept for later crafting.

### 7.2 What wants care, and knitting
- `needsCare()`: an infected wound; a deep cut or artery neither stitched nor bandaged; a broken limb not splinted.
- `knitOf()` (the multiplier on an injury's days): a doctor's care ×1; infected ×0; open gash ×0 (doesn't close), bandaged ×1, stitched ×1.6; unsplinted limb fracture ×0.5. Each day an injury's `until` is pushed out by `(1 − knit) × days`.
- `heal()` (`health.js:358`) runs one day at a time: expiries, infection, tourniquet starvation, knitting, scars, blood back (2 %/h × 24), part damage mending. Bruised and hurt parts heal `HEAL_PER_DAY 0.2 × takes` per day (×1.6 under a poultice). Wounded or out parts heal only if tended (`p.tended[part]`), nothing on them still needs care, and a broken limb is splinted; then at `WOUND_HEAL 0.5` of that pace.
- A tourniquet beyond `TOURNIQUET_SAFE_H 2` h harms the limb by `0.15 × takes` per hour over.
- **Scars**: a fracture knitted unset leaves "an old break …, badly set" (−1 forever); a deep cut never stitched leaves a cosmetic scar (v 0).
- **[test]** 50 days: set and splinted knits clean; splinted but unset knits crooked (−1); set but unsplinted is still knitting. A wounded torso 6 days on: untended still wounded, tended unhurt. A bruised leg a day on: 1.15 points left, 0.00 poulticed. A tourniquet left on 5 h: the leg ends up hurt.

### 7.3 Infection, a hazard race (`infectDays()`, `medicine.js:160`)
- Open wounds (cuts, splits) start dirty. Daily hazard `INFECT_P`: artery/deep 0.12, cut 0.04, split 0.015, multiplied by: cleaned ×0.08; fresh bandage ×0.25 (dirty after `BANDAGE_DIRTY_H 24` h: ×1.1); stitched clean ×0.6, stitched dirty ×1.4; older than `CLOSING_DAYS 4` ×0.3. The risk accumulates as `−ln(1 − p·k) × days` against a per-wound threshold `−ln(u)` drawn from the wound's own stream, so sleeping through it or walking through it counts the same.
- Once infected: severity starts at 12 and changes per day by `grow[depth] (artery/deep 20, cut 5, split 4) − immune (12 + 0.5 × Fitness) − (antibiotics ? 30 : 0)`. Fever bands: ≥ 25 feverish −1, ≥ 55 high fever −2, ≥ 80 delirious −4. At 100: **sepsis, death**. Antiseptic on an infected wound: −8.
- **[test]** deep gash outcomes over 3 weeks: left open: infected 65%, dead 45%; strip of shirt: 54% / 47%; bandaged and changed daily: 19% / 15%; stitched without cleaning: 55% / 52%; cleaned, stitched and bandaged: 2% / 1%; left open with antibiotics when it turns: 65% infected, 0 dead; left open at Fitness 30: 65% infected, 0 dead. Untended at Fitness 0: dead in ~10 days.

### 7.4 Professional care
- `fullCare()` (the embassy nurse; a hospital) cleans, stitches (only a hospital ties off an artery), bandages, stops bleeding, sets and splints, removes tourniquets, starts antibiotics, gives painkillers and tends every part.
- Hospital (`services.js` `TREAT_H`, hours): wait 1.5 (seen at once if urgent: bleeding inside, an artery, shock, or bleeding ≥ 1 %/min), internal bleed 4, artery 1.5, bullet wound 1, stitches 0.5, set 1.5, X-ray 0.5, transfusion 1 per 15% lost (below 85%), drip 1, dressing 0.25; at most 12 h. Bed days follow by simulated healing (`BED_DAYS 21` max). A gunshot or knife wound is reported to police (heat).

---

## 8. First aid and diagnosis

### 8.1 `aid.js`: the steps (Medicine drives everything)
The user, 2026-10-26: "bandaging, splinting and other kinds of medical first aid. Also make sure we have the right skills to drive how good we are with medical stuff". 2026-11-04: "every first aid action should also take time proportionally to medicine skill".
- Time: `SECONDS` at Medicine 10: dress 45, tourniquet 25, splint 120, clean 30, stitch 240, bandage 40, set 60, poultice 40, painkillers 5, antibiotics 5, loosen 10; pressure is held for `PRESS_S 60`, the same for anyone. `paceOf(medic) = max(0.5, 1.6 / (1 + Medicine/16.7))`, giving ×1.6 at Medicine 0, ×1 at 10, ×0.73 at 20, ×0.57 at 30. **[test]** dressing 72 / 55 / 45 / 33 / 26 s and stitching 6 / 5 / 4 / 3 / 2 min at Medicine 0/5/10/20/30.
- The medic stoops (a `busy` plan, crouched). Moving stops it, but the effect is already applied.
- DCs: dress shallow 8, deep 12, artery 16, with −2 per previous failed try (`RETRY_MOD`, "soaked"); tourniquet 10; splint 12; stitch deep 13 / artery 18 (face −2); set 14 (on yourself another −2). Global mods: on yourself −2 (`SELF_MOD`), one-handed −4 (`ONE_HAND_MOD`). The body's mods also apply (shock −3 etc.).
- Effects:
  - Pressure: ×0.35 bleed while held.
  - Dress: success stops a cut, but an artery only slows to `ARTERY_HELD 0.3` of its rate. Failure: nothing changes and `tries++`.
  - Tourniquet: stops a limb bleed; the limb counts as broken while it's on.
  - Loosen: an artery bleeds again unless tied off.
  - Clean (antiseptic, no roll): wound becomes clean.
  - Stitch: stops bleeding, knits ×1.6, no scar. Stitched dirty sews the dirt in.
  - Bandage (or change a dressing): the wound becomes fresh.
  - Set: knits straight. Splint: halves the break's costs and pain. Poultice: pain on that part ×0.5 and mending ×1.6 for 24 h.
  - Painkillers; antibiotics for 5 days.
  - Rest (yourself, nothing bleeding): 1–8 h until pale clears.
- Bleeding inside shows as a greyed row only once a look has found it: "nothing hands can do for it: a hospital, and fast".
- **[test]** dressing a deep cut at Medicine 5 on someone else 63%; on yourself 55%; Medicine 15 93%; an artery at Medicine 5 43%. An arm artery dressed drops to 3.6 %/min; a tourniquet then stops it. A broken arm costs −4; splinted −2. A full treatment run: pain 67 (bad) → 55 → 22 on painkillers.
- `bodyLine()` (`aid.js:300`) is the instinct's triage line on your own body, in priority order: collapsed → arterial (≥ 8 %/min) → bleeding (≥ 0.8) → shock → trickle → pale → tourniquet > 1.5 h → high fever → infected → open gash → unsplinted break → dirty dressing → pain → fever → wet/cold → stress → hunger → blood on the face or clothes. A good pattern for an OLYMPUS HUD status line.

### 8.2 `diagnosis.js`: plain sight vs a Medicine look
The user, 2026-11-03: "woman shot twice in torso: reading them should give us MUCH more information about what we can see, like them bleeding, entry wounds etc"; "medicine skill should lead to us rolling for diagnosis".
- Plain sight (no roll): posture (up, down, sitting against a wall, moving, conscious), where the wounds are and whether they bleed (badly is obvious), dressings, tourniquets, splints, pallor, a limb hanging wrong, a carrier. On yourself you also feel what hurts.
- A look: Medicine vs `DIAGNOSE_DC 10`, mods dark −3, dim −1, patient walking −2, running −5, self −2. A nat 1 always finds nothing. What it finds depends on the **margin** (`FINDS`): breath −4; kind, vest, rate 0; artery, fracture, shock +2; through (entry/exit), crack, needs +4; inside (internal bleed), blood (% left and minutes to collapse or death) +8. A failed look says so the safe way ("treat it as bad; if in doubt, a hospital") and never says "nothing".
- The look is kept for `LOOK_KEEP_MIN 30` min. It isn't re-rolled within `LOOK_AGAIN_S 60` s on an unchanged body; the better of two looks on the same wounds stands.
- `minutesTo(p, ms, to)` simulates each wound to its stop time for up to 12 h.
- **[test]** two bullets in the chest. Medicine 0: look made 56%, gunshots named 56%, exit 38%, bleeding inside 14%, time left 14%. Medicine 10: 93 / 93 / 85 / 66 / 66%. Medicine 20: 96% for everything. "Two in the chest: down in 3 min, dead in 3; bleeding inside alone: down in 91 min."

### 8.3 Wounded NPC behaviour (`wounded.js`) and emergency services
- After the knock, a hurt passer-by's tick follows a ladder (`choose()`, `wounded.js:92`): floored (shock or ≥ 1.4× pain limit) → **lie**; over the limit → **sit** at the wall within 3 m; the shooter visible with a gun within 40 m → **flee** at `FLEE_PACE 2.4 × mobility` (adrenaline kept up, ×2.5 bleeding when running); hands on them or help on the way → **wait**; dizzy → sit; legs gone → crawl 5 m to the wall; still seen by the shooter → walk away 25 m legs; out of sight → stand and phone for help. Once sat they stay sat (unless the danger returns and they can go); once down they stay down.
- The user, 2026-11-04: "wounds should have effects (pain, blood loss, shock, dizziness) and these effects should trigger reactions like sitting down when dizzy and feeling safe rather than running away. If we're still there with a gun out, they would run for their lives".
- **[test]** shot in the arm: up in ~10 s, sat by 60–155 s, 34–47 m off. With your gun out they flee at up to 2.14 m/s; with your hands empty they walk at 0.89. An artery while running: down at 37 s with 37% blood left. Both legs gone: crawl at ≤ 0.25 m/s.
- `emergency.js` (logistics, mostly irrelevant): callers (`CALL_P 0.1`/s within 25 m), police and ambulance in country-specific minutes (default police 8–15, ambulance 10–20), paramedics treat for 60–150 s (external bleeding dressed at once), stretcher, hospital (internal bleeds stopped), 24 h cordons.

---

## 9. Close combat (`cqc.js` 473 lines, `fight.js`, `cqctext.js`, `weapons.js`, `interact.js`)

### 9.1 The exchange
- A fight is a sequence of one-second exchanges; time stands still while you choose. Moves are K hit, L grapple, M guard (Shift held spends an edge).
- The triangle: guard beats hit (blocked, the guard earns an edge); hit beats grapple (lands clean ×`CLEAN_K 1.5`, head weight ×1.5); grapple beats guard (a throw, `THROW_PTS 3–5` to the torso). The same move both ways is an opposed CQC roll (ties to us) with hurt mods, staggered −3 / dazed −4, and the weapon's awkwardness and grab penalty. Two guards: they circle.
- Damage: `HIT_PTS 2–5 × technique.k + (CQC difference)/EDGE_PER_PT 5`, ×`pull` (a bout's `BOUT_K 0.5`; Hale 0.25; drills 0.2). Hit locations `HIT_AT`: head 30, torso 45, each arm 8, each leg 4.5 (technique-specific tables override).
- **Statuses** (next exchange only): staggered forbids grabs (−3 on rolls); dazed forbids guards (−4); stunned allows nothing ('open'). Triggers: force ≥ `STAGGER_AT 0.3` staggers; a head hit ≥ `DAZE_AT 0.25` dazes (50% + technique stun); ≥ `STUN_AT 0.5` stuns (60% + stun). Low kicks, parries, slips and shoves stagger. The user: "stuns and dazes should have effects like preventing blocks or hit or grab".
- **Advantage points** (edges): zero-sum, so a block first removes one of theirs (the user: "when gaining advantage if the opponent has points, it should remove their points before adding some to us"). The cap is `floor(CQC/10)`, minimum 1. Spent with a hit: double damage. With a grapple: a hit taken is absorbed. With a guard: a throw is fended off, or against a hit it becomes a **riposte** (`RIPOSTE_K 1.5` × a hit, mostly to the head, the hitter dazed, the edge kept). The user: "when you block normally you get an advantage, when you block with shift, you keep the advantage point and also hit back".
- **Reading intent**: `READ_PER_PT 0.06` per CQC point over the opponent, at most `READ_MAX 0.9`. The player sees the opponent's choice above them (or a '?'). A better opponent answers your move with its counter.
- **AI choice**: style mix (`STYLES`: even, striker, wrestler, careful). It adapts to what you lean on (`ADAPT_PER_CQC 0.02`, at most 0.7; memory of 4 moves, decay 0.6), with `DOUBLE_THINK 0.7` when you're reading it. Armed AIs hit ×1.5 and grab less.
- **Techniques by level** (the user: "beginners would only punch"). Hits: swing (< 7), jab (6+), cross (8), hook (11), kick (13), elbow and knee (17), low kick (19), palm (22, stun 0.25), roundhouse (26, k 1.7, stun 0.35). Grabs: shove (< 9), hip throw (9), sweep (14), arm lock (21, k 1.5), choke (27, stun 0.5). Guards: block, parry (12, staggers the attacker 40%), slip (20, 60%). **[test]** CQC 30 spreads hits evenly, about 8–12% per technique.

### 9.2 Fight enders, weapons, armour
- **Fight enders** (the user, 2026-10-26: "when hitting a stunned opponent with advantage, we attempt a fight ender since they can't defend … it's a CQC check against a difficulty derived from their CQC and fitness. If check is failed, damage is still increased and likely to result in a crack, fracture … Doing so during a friendly bout is considered a breach of ethics … such a hit can result in death"):
  - Trigger: an edge spent on a hit or grab against a stunned opponent. Check vs `finishDC = 4 + their CQC + ⌊Fitness/2⌋`.
  - Outcomes: a hit is a knockout (head to full); a grab at CQC ≥ `BREAK_CQC 21` breaks a limb (arms 70%) and they give up; below that, a slam (torso full, head +0.3). Armed, it's an attempt to **kill** (an edged weapon goes for torso or throat).
  - On failure: double damage and `FRACTURE_ON_BOTCH 0.45`.
  - Death chance `min(0.6, 0.02 + 0.5 × max(0, wear − 0.35))`, ×0.5 when botched.
  - In a bout it's a foul and loses the bout.
  - **[test]** CQC 10 knocking out 10: DC 16, comes off 75%, kills 2% (14.5% on someone already beaten up). CQC 10 vs 20: DC 26, comes off 26%. A finka on someone stunned (CQC 12 vs 10): 159 kills of 200.
- **Weapons** (`weapons.js`). The user, 2026-10-26: "knives and environment (create variety of knives and improvised weapons to populate the world with) fight is still CQC and works the same".
  - Fields `{ edge 'blade'|'point'|null, k, bleed, guard 0–1, grab, awkward, carry, breaks, into, splint }`.
  - Knives: penknife k 2.2, box cutter 1.6, switchblade 2.4, kitchen 2.6, finka 2.7, combat 2.9 (bleed 1.4, guard 0.2); no drawbacks.
  - Improvised: screwdriver (point, 1.8), bottle (1.3, breaks 45% into a broken bottle 1.6 edged), brick 1.8 (grab −2, awkward −2), hammer 1.8 (crack +0.3), spanner 1.5, pipe 1.7 (guard 0.85), crowbar 1.9 (guard 0.9), stick 1.15, umbrella 0.8, shovel 1.3 (grab −6: no grab), bike lock 1.9, chain 1.4.
  - **A gun is a pistol-whip** (`gunWhip`): k 1.2 (a long gun 1.6, guard 0.7).
  - Blocking a blade or heavy weapon (k ≥ 1.5) with guard < `SOLID_GUARD 0.8` needs an opposed CQC roll (+8 × guard). On a loss it cuts through, mostly into the forearms (`THROUGH_AT` arms 36 each, head 11, torso 11, legs 3), at 0.4 × a hit, capped at 60% of the part.
  - Grabbing with a full hand fumbles `0.08 × −grab`. The armed and trained use the weapon 75% of the time (untrained 92%), never punching with the knife hand.
  - Disarm on a successful grab: arm lock 0.5, hip and sweep 0.15, choke 0.2, shove 0.08.
- Body armour on blows is as in §5. A grip through the shirt reveals a vest.
- **[test]** bouts to 3: CQC 8 vs 2 wins 75%; 8 vs 8 40%; 8 vs 14 8%; 8 vs 30 0%; 20 vs 10 95%; 30 vs 8 96%. A combat knife at CQC 10 vs bare CQC 10 wins 50% (bare vs bare 36%); bare 20 vs kitchen knife 10 wins 80%. Blocking a knife bare-handed at CQC 10 vs 10: 203 clean, 170 cut through; with a pipe: 369 clean, 0 cut.
- **Downed opponents** (`interact.js:51–65`): tie (`TIE_S 60` s; a tied person stays down when they come round), search (20 s), strip armour (a carrier 60 s, a vest 120 s, a helmet 15 s; **[test]** "Take their plate carrier and helmet (75 s)"), or kill by what's in your hand.
- `cqctext.js`: flavour lines per technique for ours and theirs, picked by `hash(round)` so text never moves a roll. Severity words light/solid/heavy/brutal by force (0.15/0.3/0.5).

---

## 10. Carry, gunwork, training scenes

### 10.1 Carry (`items.js`)
- Volumetric pockets (the user: "very little storage space, no magic inventory, volumes and pockets. Concealed weapons only when concealable"). `SPACES`: trousers 2 × 0.3 L ≤ 16 cm; inside pocket 1 × 0.4 L ≤ 26 cm (needs a pocketed top); coat 2 × 0.9 L ≤ 24 cm; belt 2 × 0.5 L ≤ 36 cm (weapons only, one each, hidden only under a covering top); sling 1 × 8 L ≤ 125 cm (long guns only, always visible). A pocket over `BULGE 0.6` full shows.
- `placed()` puts the biggest things first into the most hidden space with room. A gun goes in the belt holster when a top covers it. Draw time and DC follow where the gun sits (§2.3 DRAW).
- Dropped items keep their weapon state. Pick up and drop sit within reach 1.1 m. Street loot spawns by place (bins, alleys, arches…), about 2.1 items per 45 m section **[test]**.

### 10.2 Gunwork at a table (`gunwork.js`, 142 lines)
The user, 2026-11-03: "close to the table we should be able to do things like recondition magazines, take bullets out of magazine, unload the gun (remove the magazine, then clear the chamber) and all of these actions can fail with varying consequences depending on weapons skill"; 2026-11-04: "filling and emptying magazines with bullets should take time based on weapons handling skill".
- `JOBS` (s, DC): unload 6 / 8; load 4 / 7 (leaves it chambered, safety on or decocked); clean 20 min / 9; fill 2.2 s per round / 6; empty 1 s per round / 4; spring (recondition) 10 min / 10.
- Time ×pace, ×2 on failure (×1.5 for fill/empty). "Bad" means margin ≤ −8 or a nat 1 under WH 10. Bad unload with a chambered round fires it on the table (muzzle discipline decides where; `BANG_HEAT 4`). Bad clean leaves cond 0.5 (it'll jam). Fill/empty failures lose 1–3 rounds under the furniture. A bad spring job bends the magazine lip (cond 0.3).
- Jobs up to `LIVE_MAX_S 180` s are lived through; longer ones skip the clock.
- **[test]** unload 6.4 s; fill 8 rounds 19–20 s; clean 21 min. Over 400 tries each: the untrained fired 25 into the table, lost 138 rounds, bent 21 magazines; an expert 0/0/0. The safety's time: untrained 982 ms, Handler 608, expert 128.

### 10.3 The range (`scenarios/range.js`, `paper.js`, `tutorial/range.js`)
- An evening: sign out the club's gun (empty, `known:false`, two empty magazines, a box of `BOX_N 30`). Your own guns go in a locker. Fill magazines at the bench, check clear, load, shoot paper at 7/15/25 m, reload, clear a stoppage, unload, show clear, hand back. Range safety is as in §2.6.
- **Paper** (`paper.js`): a hit's ring comes from the roll's margin (`RINGS`: ≥ 13 X, ≥ 10 the ten, ≥ 7 nine, ≥ 4 eight, ≥ 2 seven, else six; a miss goes into the trap). Chest silhouette rings are 5 cm; a club bull's-eye is 1.25 cm with +6 DC. A group is the first 5 rounds: score and extreme spread in cm.
- **The coach's dummy round** (`slipDummy()`): placed 2–4 rounds down in a spare magazine. It clicks, and you tap-rack. Hale's lesson steps: clear → loaded → group at 7 m → reload → stoppage cleared → 15 m → 25 m → handed back clear.
- **[test]** Moscow Makarov: WH 6 at 7/15/25 m hits 95/75/18% (groups 21/19 cm); WH 18 90/100/98% (3/6/24 cm). London Anschütz .22: WH 6 78/60/55%; WH 18 98/88/98% (1–2 cm). An evening gives 4.4–7.0 XP and Weapon handling practice.

### 10.4 The dojo (`scenarios/dojo.js`)
- Scripted drills with Hale calling each move (`tell`): cover a punch ×2 → grab a cover ×2 → hit a grab ×2 → mixed ×4 → spend an edge. Then bouts to 3 points against a weaker, an even and a stronger classmate, and Hale (`HALE_PULL 0.25`).
- Remembered mode: once completed, the tutorial jumps straight to the bouts, then a real fight years later. A foul in a bout stops it; killing a classmate ends the lesson.
- This is a direct template for Marine combatives and drill sergeant lessons.

### 10.5 Fitness (`fitness.js`) and rust
- The user, 2026-11-03: "fitness should remain a skill, but there should be a shadow skill called effective fitness, that goes down the longer we go without exercising … up to three points before moving the actual fitness skill up one point … The higher we go the harder it gets to exceed base fitness … high level athletes require more training than lambda joes".
- Weekly load points: gym session 10, class 7, walk 0.6/km, run 2.5/km (×armour LOAD: a carrier ×1.5). End of week: `upNeed(b) = 4.5b` raises the offset one point (to `capOf(b) = min(3, 24 − b)`); below `holdNeed(b) = 2.2b + 2·max(0, b − 12)` it falls one (to −3). Two weeks at the top band: base +1, offset −1; two at the bottom: base −1.
- **[test]** base 10 asks 22 to hold and 45 to climb; 14: 35 / 63; 18: 52 / 81; 22: 68 / 99 (room +2); 24: 77, no room above.
- Rust (`rust.js`): skills over 15 unused rust a level a month (`PERIOD_DAYS 28`, at most −3 levels), costing `round((total − 15) × r/6)`. Two practice sessions a month keep a skill. **[test]** CQC 30 unpractised: 30 → 27 → 25 → 22.

---

## 11. NPCs with guns (`armed.js`: the reusable AI pattern)

- `gunner()` (`armed.js:496–549`) runs the **same `firearms.act()` steps as the player, in real time**, each finishing at `G.until`:
  1. Draw from the belt.
  2. Safety or selector off.
  3. If not ready: drop an empty magazine when spares exist, otherwise pick a fix from `canDo` (clear, rack, release, insertMag, closeCyl). With no ammo left they're out of the fight. The user, 2026-11-04: "Armed npcs should also always carry ammunition (and use it, in such ways that they can run out)".
  4. Face the target. If they can't see you, wait 250 ms. If holding (you're down or empty-handed), cover you without firing.
  5. Aim (`aimMs`), then `npcShot()` with the held seconds; the next step comes after the recovery.
- A gunner who is down, knocked, or `staysDown` does nothing. The user's 2026-11-03 bug report: two officers shot down went on firing from the ground. An incapacitated gunner slumps out of the fight. Anyone taken down drops a gun from their hand to the ground, where you can pick it up (the user, 2026-11-04).
- **Reflex**: when a gunner starts and is in view, the player rolls Awareness vs `GUN_SEEN_DC 8 + d/5` for a time-stopping reflex choice (drop it / your gun / run). `reflex.js` can remember the answer for `KEEP_S 120` s (the user: "the reflex window is spammed on us too").
- Loadouts: patrol 2 spare magazines, response 4 for the long gun and 1 for the sidearm. **[test]** a patrol Makarov fired 25 rounds (8 + 2 spares + chambered), then he's out. From the order to the first shot: 3.9 s at WH 9.

---

## 12. The user's preferences in this slice (carry them over)

Dated as in the source. Undated items are from the same build batches.

- 2026-10-26: "health bodypart by bodypart"; "work on the bleeding out system, with blood-pressure health stat"; "bandaging, splinting and other kinds of medical first aid. Also make sure we have the right skills to drive how good we are with medical stuff"; "a lot of damage could trigger cracks and some types of damages can cut (not bare handed) and blood can be drawn from getting hit in the face hard enough"; "pixel level blood splatter on the ground and lingering blood traces on the damaged part"; "create variety of knives and improvised weapons to populate the world with, fight is still CQC and works the same"; "we could also hit with other body parts depending on the CQC level, beginners would only punch"; "stuns and dazes should have effects like preventing blocks or hit or grab"; "when you block normally you get an advantage, when you block with shift, you keep the advantage point and also hit back"; fight enders as quoted in §9.2; "during combat it should automatically do READ against our opponent"; "instinct reminders about dazed (us or opponent), staggered and stunned"; "the flavour text needs to also have many variations", "damage taken should also have more flavour about the pain"; "a demo starter in a CIA dojo … will serve as a tutorial for CQC"; "once we did it once, remember it so next time … snap flash forward".
- 2026-10-28: "introduce bandages and other healing furniture that we should be able to use on relevant wounds (bandage a bleeding wound, disinfect wide wound, apply poultry to bruises etc, set broken limbs etc.), Implement a robust health system inspired by Rimworld and Project Zomboid".
- 2026-10-31: "why are all these items … not taking any inventory space ?"; undated: "very little storage space, no magic inventory, volumes and pockets. Concealed weapons only when concealable".
- 2026-11-03 (firearms):
  - "Shooting is going to be integrated in a stop motion way, heavily relying on the weapons skill … each step to ready a weapon has to be acted on by the player and will have time move forward as we do … Shooting mode is … explicitly entered and should only stop time if we're trying to shoot".
  - "model every part of a weapon that way (safety, loaded or unloaded, magazine or single bullet, can contain a chambered bullet and no clip, can be jammed and require servicing, can misfire if in bad condition etc. All actions on a weapon should require rolls against weapon handling".
  - "implement many kinds of firearms right away (many kinds of assault rifles, many kinds of handguns etc)"; "ammunition shouldn't be 'rounds' it should be very specific calibers based on specific caliber magazines used on specific weapons".
  - "high skill makes this virtually instant" (thumb safety and selector).
  - "fumbling should have consequences … depend on weapons handling skill … accidental discharge and the bullet should potentially actually hit something depending on what we're facing".
  - "high weapons skill should at least protect in ways of muzzle discipline allowing us not to shoot some random civilian in the head".
  - "there should be a 'aim' action before shoot, which should take time"; "if you're not aiming you can't shoot"; "Make aiming more natural … but no list".
  - "we shouldn't be able to draw a firearm out by pressing G … taking it out should imply we intend on using it, meaning that time stops and we enter the weapon ready sequence".
  - "NPCs shooting at us should just move time forward normally as they do the things to ready their weapons … weapons handling is important when … being targeted for shooting".
  - "wounds should slow everyone down especially gunshot wounds"; "shot in the head should mean something"; "woman shot twice in torso: reading them should give us MUCH more information … like them bleeding, entry wounds etc"; "medicine skill should lead to us rolling for diagnosis".
  - "in the appartment, close to the table … recondition magazines, take bullets out of magazine, unload the gun … all of these actions can fail with varying consequences depending on weapons skill".
  - "fitness should remain a skill, but there should be a shadow skill called effective fitness …" (full quote in §10.5).
  - "extreme fatigue (like from not sleeping for too long) should chip away at skill efficiency"; rust: "skills higher than 15 but unused for over four months …".
  - "There should be a reflex mode, where time stops when things [happen]".
  - "don't give a firearm to officers by default, firearms need to be rare and illegal in most places, acquiring one should be a whole thing" (tradecraft-specific; OLYMPUS is the opposite, a military setting).
- 2026-11-04:
  - Double and triple taps (§3.4).
  - "being knocked down is a logical result of getting shot. Staying down should be justified (pain level, shot in legs, blood loss, loss of consciousness). Otherwise people will try to get away from us even very slowly, and take a sit against a wall where they think we can't see them after a while. Moving away should increase blood loss if realistic".
  - "wounds should have effects (pain, blood loss, shock, dizziness) and these effects should trigger reactions like sitting down when dizzy and feeling safe rather than running away. If we're still there with a gun out, they would run for their lives".
  - "Adrenaline should be modelled as a short term pain reduction thing"; "Pain resistance should be linked to fitness level, over a certain pain threshold, people just lit up against a wall or lie down".
  - The scalp graze: "it looks bad without being that bad, definetly not minutes away from death like it was the femoral artery".
  - No improvised bandage, tourniquet or splint until crafting exists; "every first aid action should also take time proportionally to medicine skill".
  - Body armour (§5); "my soft vest didn't seem to stop the two bullets …".
  - "Build a cover system, where being behind objects that can provide cover move the needle in the dice rolls when a shot is computed. Being at the corner of a wall should be better than behind shallow cover. There should also be a hide behind cover action when in gun mode and close to cover … realistic and cheap".
  - "it should cancel all of the stop motion mode when I get arrested or otherwise am unable to immediately do the shooting steps".
  - "Armed npcs should also always carry ammunition (and use it, in such ways that they can run out)"; "when an npc gets taken down and was carrying a rifle, they should drop it and the rifle should be made available to pick up to us".
  - "a firearms training lesson" at "ranges where legal"; "filling and emptying magazines … should take time based on weapons handling skill".
  - "the reflex window is spammed on us too, there should be a way to remember our choice for a while".
  - "an umbrella is not a weapon ???" (everyday objects shouldn't read as weapons).
- General style the user accepts: numbers are the developer's calls ("my calls, to be tuned in play"); tests print the rates; every roll is readable in the log.

---

## 13. Reuse assessment per module (for a top-down pixel-art Martian marine game)

| module | verdict | why |
|---|---|---|
| `checks.js` (d20, opposed, hook, readable mods) | **reuse** | Pure. It is the user's "RPG-like resolution". Consider a wider die for long-range combat, but keep the `{why, v}` log format. |
| `rng.js` (sfc32, hash, streams) | **reuse as-is** | Pure, deterministic, save-safe. Per-purpose streams keep the dice stable. |
| `skills.js` | **adapt** | Formula is fine. Fill the empty `soldier` class (over-skill "Warfighting"). Add skills: EVA/zero-g, piloting, demolitions, comms. |
| `firearms.js` (state machine, actions, reliability) | **adapt (high value)** | Pure (checks, skills, rng). Keep `act`/`fire`/`feed`/`canDo`/`said`. Replace MODELS/CALIBRES with OLYMPUS's arsenal. Add: carry posture (safe/low-ready/high-ready/slung), suit-glove penalties (time/DC), environment fouling (regolith dust, vacuum cold), a heat model for sustained fire in vacuum, and optional caseless/electromagnetic action types. |
| `shooting.js` (stop motion, aim, odds, bullet → wound) | **adapt formulas, rewrite glue** | The mode and its flow are the user's explicit taste. But it imports 28 modules (street rows, passers-by, police, heat, emergency). Split into a pure resolver (aimMs, shotOf, odds, climb, taps, bullet math) plus engine glue. Retune range DCs. Add shooter stance and movement, suppression, and gravity/anchoring (§14). Fix the odds-display bug. |
| `armed.js` | **reference (keep the gunner pattern)** | Police/arrest logic is tradecraft-only. The `gunner()` step loop (NPCs doing the player's own timed actions, reloading from finite magazines, dropping guns when downed) is the pattern for squadmates and enemies. |
| `armour.js` | **adapt** | Pure (rng, clock). Coverage shares, stop tables with range ramps, wear, residual penetration, blunt trauma and helmet dome map onto vac-suit hard armour. Add: limb/neck/visor coverage, a **pressure-integrity layer** (breach → leak), suit mass and mobility per gravity. |
| `cover.js` | **adapt** | The idea (cover on the line within 3 m of the target, share by posture, stop per material, corners beat low cover, a "get down behind" step) carries over. Swap street blockers for tile-map objects (bulkheads, hatches, crates, consoles, regolith berms). |
| `health.js` | **adapt (high value)** | Mostly pure. Six parts, states, mods, injuries, blood bands, exertion, adrenaline, pain limit, knockdown, mobility, heal-by-day all fit. Must add: O₂/hypoxia, pressure/decompression/ebullism/barotrauma, G-load (G-LOC), gravity deconditioning (bone/muscle), radiation dose, stamina/breath, a real consciousness scale. Clamp the limb bleed formula. Give the player bullet knockdown too, or decide deliberately not to. |
| `medicine.js` | **reuse (data swap)** | Pure. The infection race, knit multipliers, scars and pain points are good. Swap supplies for a military IFAK and corpsman kit (CAT tourniquet, hemostatic gauze, chest seal, NPA, pressure dressing, SAM splint, combat pill pack, ketamine/fentanyl, suit patch). |
| `aid.js` | **adapt** | Option listing with greyed reasons, DCs, Medicine-paced times and self/one-hand mods are reusable. Remove the embassy nurse, heat and street hospital. Re-cut into the MARCH order (Massive haemorrhage, Airway, Respiration [chest seal, needle decompression], Circulation, Hypothermia/Head). Add casevac to the base's medbay. |
| `diagnosis.js` | **adapt** | Margin-thresholded findings (`FINDS`) and "say failure the safe way" are elegant. Add suit biotelemetry as "plain sight" for friendlies (HR, SpO₂, suit pressure). |
| `wounded.js` | **reference** | The reaction ladder (lie / sit / flee / wait / crawl / walk / stand) is good for civilians and wounded enemies. The code is street-specific (pavements, walls). |
| `emergency.js` | **skip (reference)** | Police and ambulance logistics; OLYMPUS needs medevac/corpsman flows instead. |
| `cqc.js` | **adapt** | Pure-ish. The triangle, edges, reads, technique ladders, statuses, fight enders and armour on blows are solid. Add environments: low-g (throws weaker, sweeps worse with low traction), zero-g (no footing: grapple/pin dominate, mag boots matter), armoured suits (strikes into plates do little; target visor, seals, joints, air lines). |
| `cqctext.js` | **reference** | The hash-picked flavour pattern (text never moves dice); rewrite the text. |
| `fight.js` | **adapt** | Glue (begin/act/tick/end, opponents drawing weapons when losing, a read every 4 exchanges). |
| `weapons.js` | **adapt** | Melee catalogue fields (k, guard, grab, awkward, edge, bleed, breaks) fit a bayonet/combat knife, e-tool, rifle butt (`gunWhip`), pry bar. |
| `items.js` | **reference** | Volumetric SPACES is the right idea; replace with load-bearing gear (plate carrier pouches, chest rig, drop-leg holster, sling, pack, suit hardpoints). Street loot spawning: skip. |
| `gunwork.js` | **reuse (adapt jobs)** | Table/armoury jobs with rolls, timed or skipped, are exactly the "activities that skip time" the user wants (cleaning a rifle at the end of the day, refilling magazines). |
| `scenarios/range.js` and `paper.js` | **adapt** | The range-day template: safety rules, dummy round, groups by margin. Scale to rifle ranges (100–500 m), positions (prone, kneeling), qualification scores. |
| `scenarios/dojo.js` | **adapt** | The combatives training template (drills with tells, then bouts). |
| `fitness.js` / `rust.js` | **reuse** | Pure. Add PT activities (runs, rucks, gym in base and ship). Add a gravity-dependent deconditioning term (§14.4). |
| `render/crowd.js` gun poses | **reference** | Frames aim/aimhi/aimlo/fire/firehi/firelo per facing; `FLASH_MS 70`, `KICK_MS 140`, `AFTER_MS 600`, `RAISE_MS 120`, `TURN_RAD { side 0.2, front 0.35 }`. Useful timings for high-res pixel-art shooting. |
| tests (Monte-Carlo, printed rates) | **reuse the method** | Seeded loops printing hit, fumble and death rates per skill tier make balance visible; OLYMPUS should copy this habit. |

---

## 14. What OLYMPUS needs that tradecraft does not have

These are not in tradecraft. They are pointers for builders, with order-of-magnitude physics so the sim can be honest. Treat the numbers as estimates to verify.

### 14.1 Rifles and sidearms at military ranges
- Tradecraft's DC curve tops out around 25 m for pistols and 50 to 100 m for carbines (§3.3). Marines fight at 50–400 m. Flatten the per-metre terms, add shooter position (prone or braced might cancel a large share of the distance DC), suppression (incoming fire near you: −2 to −6), optics (a magnification factor on `perM`), and target exposure (the cover `share` already exists).
- Keep the gun state machine but add **carry states** that drive muzzle direction: holstered / slung / low-ready / high-ready / aimed. A friendly-sweep check (the muzzle crossing a friendly within N m while not safe) feeds the user's muzzle-discipline theme into daily barracks life, not only discharges.

### 14.2 Vac-suit armour and breaches (decompression wounds)
- Add a suit layer under or over armour: `{ pressure kPa, volume L, O₂ reserve, patch kit, breach list [{ areaMm2, sealed }] }`. A penetrating round that isn't stopped by the armour also breaches the suit, unless self-sealing absorbs a small hole.
- Leak rate (choked flow through a hole): `ṁ ≈ 0.0404 × C_d × A × P / √T` kg/s (SI, air-like gas; C_d about 0.6–1). Example: a 5 mm hole (A ≈ 2 × 10⁻⁵ m²) in a 30 kPa suit at 293 K leaks ≈ 1.4 g/s. A suit holding ~50 L at 30 kPa contains ≈ 18 g of gas, so the time constant ≈ 13 s without make-up flow. Small holes are survivable with a patch (a timed, rolled action, like a dressing); large ones are not.
- Physiology to model: hypoxia as O₂ partial pressure falls (time of useful consciousness of seconds at near-vacuum, about 9–15 s); ebullism below ~6.3 kPa (the Armstrong limit); pulmonary barotrauma from holding breath during rapid decompression; ~1–2 min to death in vacuum. Represent these as new injury kinds in the existing `injuries` list (they slot into pain, mods, diagnosis and care).

### 14.3 Low-gravity recoil and anchoring
- Recoil impulse doesn't depend on gravity: 9 mm ≈ 3 N·s, 5.56×45 ≈ 6 N·s, 7.62×51 ≈ 12 N·s.
- A free-floating 120 kg suited marine gets Δv ≈ 0.05 m/s per 5.56 round, so a 30-round magazine on auto pushes him to ~1.5 m/s. A line of fire 0.3 m off the centre of mass adds a spin of order 0.1 rad/s per round.
- Standing, what matters is traction: static friction ≈ μ·m·g. At μ 0.6 with 120 kg, that's ~270 N on Mars (3.71 m/s²), ~95 N on Europa (1.315), ~20 N on Ceres (0.28). A recoil force of ~100 N over ~50 ms means a Europa marine can be shoved back by a single rifle shot unless braced, and Ceres or microgravity requires mag boots or handholds.
- Gameplay hook: an `anchor` mod on recovery time and climb (braced, planted, sliding, floating), and in zero-g an accumulated drift and spin state that the aim must re-acquire.

### 14.4 Movement, G and deconditioning
- Walk-to-run transition at Froude number ≈ 0.5: `v ≈ √(0.5·g·L)`. With L 0.9 m: Earth ~2.1 m/s, Mars ~1.3, Europa ~0.77, so people lope or bound in low g.
- Jump height scales as 1/g (0.5 m on Earth ≈ 1.3 m on Mars ≈ 3.7 m on Europa). Fall impact speed is `√(2gh)`.
- Mass and inertia are unchanged, so stopping and turning a loaded marine takes as long as on Earth while traction is lower.
- Under thrust, G-load needs a model: G-LOC and grey-out thresholds, juice/drug support, time-in-G fatigue. A Martian raised at 0.38 g visiting 1 g should start weak.
- Microgravity deconditioning (bone and muscle loss over weeks without exercise) fits as an extra weekly drain in `fitness.js` `holdNeed()`.
- Tradecraft has **no stamina**. OLYMPUS should add breath/stamina (sprint, carry, CQC), probably as a fast pool beside effective fitness, with suit O₂ consumption tied to exertion (which links to §14.2).

### 14.5 Bleeding and medicine off-Earth
- In microgravity, blood forms floating globules (a visibility and slip hazard in pixel art); vomit inside a helmet is lethal.
- Medevac times come from orbital mechanics (the base, a ship's medbay or an autodoc), not ambulance minutes.
- Chest wounds need pneumothorax: tradecraft's flat 0.25 %/min internal bleed should become a respiration injury with a chest-seal or needle-decompression step.

---

## 15. Bugs and quirks to fix when porting (checklist)
1. Displayed hit odds omit body and needs mods (`shooting.js:178` vs `:456`).
2. The limb bleed formula is uncapped and can exceed an artery's rate (§4).
3. Bullet knockdown applies to AI actors only (`shooting.js:571`).
4. NPC bursts ignore `climbOf`; NPCs never get "being shot at".
5. A torso hit diverts 12% to an arm regardless of aim margin.
6. The shotgun is a single slug-like bullet.
7. There's no shooter stance or movement while shooting; the mode freezes the feet.
8. Gun wear comes only from firing; no environmental fouling.
9. Armour covers the torso and the helmet dome only.
10. Consciousness is a set of booleans; no stamina.
11. `heard()` and `markViolent()` are tied to street passers-by and heat; decouple them into an event bus.

---

## 16. Open questions for the user (raised by this slice)
1. Should OLYMPUS keep tradecraft's single-d20 resolution for shots at military ranges (simple, readable, but saturating at 95%), or move to a wider roll or dispersion model that still lists every modifier in the log?
2. Should the player be knocked down by bullets like NPCs, with a "stay down or get up" reflex choice? Tradecraft exempts the player.
3. Vac-suit breaches: should patching a suit be a stop-motion step like the gun steps (time frozen while choosing, each step running the clock) or real-time first aid?
4. How far should zero-g and low-g recoil go: cosmetic recovery penalties only, or real drift and spin that the player must manage with mag boots and handholds?
5. Weapon arsenal: real-world-derived Earth guns (as tradecraft did), or setting-specific Martian and Belter weapons (caseless, gauss/railgun) defined from the longhaul docs and lore?
6. Should carry posture (safe / low-ready / high-ready / slung) and friendly-sweep checks be part of daily barracks life (an NCO correcting you), extending the user's muzzle-discipline theme beyond the range?
