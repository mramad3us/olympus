# PEOPLE

The people of OLYMPUS: who they are, where they are at any moment, what they want, what they see, what they think of you and of each other, what they say, how the chain of command runs their lives and yours, and how the crowd fills the rest. Written 2026-11-05 from [DESIGN.md](../DESIGN.md) (the hub, which wins on any conflict) and the research notes in `docs/research/`, chiefly `tradecraft-sim-world.md`, `tradecraft-design-1.md`, `longhaul-shipboard.md` and `longhaul-setting.md`. Revised the same day after the design review: the changes it asked for are marked "after the critics", and what they ask of other sections is listed in §20. Revised 2026-11-06 for the user's two rules of 2026-11-05 (every person generated, §3.1; the world handcrafted, its events procedural), the company march's name (`company-march`, CONTRACTS §19, item 4) and the `mind` key's accessors (§8.8). Revised again for v0.0.4 as built (the build sheet `docs/build/0.0.4.md`): the squad's lived transitions and the calls (§4.6), and the player seeing from the berth (§7.2, §7.6).

Conventions: "the user" is quoted with the date of the words. "(my call)" marks a number or rule I settled to close a hole; the user may overrule it. Paths into the two earlier games are relative to `../tradecraft/` and `../longhaul/`. Times of day are Mars local time on Base Melas (24-hour clock, with the 39 m 35 s timeslip after midnight, as settled in DESIGN.md); TIME.md owns the clock. **Every person is generated** (the user, 2026-11-05: "All people generated"), so the people named in this section's samples and examples (Noor Halloran, Okonjo, Kai) are examples of what the roster generator draws, not written characters; no career is promised them.

---

## 0. The model in one page

1. **Four tiers** (DESIGN.md, 2026-11-05): T1 your squad and chain of command (about 20, cap 24) at full depth; T2 the rest of Echo Company (about 170) with full sheets, cheap off the map; T3 the named people of a place; T4 the crowd, seeded and throwaway, never popping in view. People move between tiers by rule. **All of them are generated from the world's seed** out of authored pools (names, faces, backgrounds, traits, ties, voices and arcs), the squad and the chain of command included: nobody is a written character, and only the places they live in are handcrafted (§3.1).
2. **One plain JSON record** per persistent person: identity, service, six personality axes and two tags, background, skills, BODY.md's body and needs (as "time since X"), mood, gauges toward you, ties to others, favours, schedule, place, arcs, discipline. What people know lives on the global ring of **happenings** (`state.happenings`): who knows each one, how, and how distorted.
3. **`whereIs(person, ms)`** (the one name for the schedule lookup, §4.6) answers where anyone is at any time, in what posture and on what path, from overrides, the Plan of the Day block and their role template, varied by a hash of (person, sol, block). Lived on the map, looked up off it; a skip moves nobody tick by tick. This generalises tradecraft's embassy rota.
4. **Behaviour** is longhaul's priority ladder (survival, casualties, orders and customs, duty posts, urgent needs, the block, errands, needs, social, leisure, idle) with utility inside each rung, booked places and queues, and a measured chance of off-plan lapses that feeds discipline with real cases.
5. **Perception** is tradecraft's cone, radius, light-limited range and walls, plus hearing that knows the air pressure. One visibility primitive, a symmetric line test over a 0.5 m sight grid, draws the fog and decides who witnessed what (§7.6); one air law scales every sound (§7.3).
6. **Relationships** are tradecraft's fear, trust and affinity (−5 to +5), toward you and between NPCs, moved by an exchange table and by **shared time**, and drifting to a baseline. Talk keeps a tie alive; time together and deeds move it (§10.4). **Gossip** spreads events along the contact graph with distortion: a negligent discharge is the platoon's story in three sols.
7. **Conversation** is a real system: time stands still while you choose a topic and an approach; checks are d20 + skill + named modifiers in the log; address and etiquette have consequences; orders are received and given; banter, asks, trades, comfort, and the K/L/M **hard talk** (the user's "KLM style minigame", 2026-10-26). You can **walk with** someone and talk on the way (§10.16). Scenes you are in but not driving (formations, inspections, briefings, mail call) run in **attend mode**, fast until they reach you (§10.12). People speak with their own voices and remember shared events aloud (§10.14).
8. **The chain of command is live**: orders with deadlines, customs in motion (which become habits, §6.6), an infractions catalogue, the real ladder from correction to court-martial, inspections that put the squad's comfort on your locker, and punishments that are chapters with something to win back (§11.11).
9. **Crowds** port tradecraft's bubble to areas: base personnel, ship crews, Europa's townsfolk with district moods driving queues, protests and riots.
10. **Budgets**: 48 persistent people at full depth (inside the near ring on grounds, §13.5) and 120 crowd agents, at most `MAX_PEOPLE` 256 drawn (TECH §16.7), people's sim at TECH §16.2's 0.50 ms a tick in the busiest area (CONTRACTS §8, §6), paths in TECH's work units, every off-map process closed-form on absolute hours and sols.

---

## 1. What the user asked for (rules this section obeys)

- The brief, 2026-11-05: "NPCs should also be well built and reactive, smart, have their own lives. Some NPCs will be fully fledged and permanent, and crowds will be more surface level and serve the purpose of filling the world."
- The user, 2026-11-05, asked whether the persistent cast (the squad, the chain of command, the key people of each site) should be handcrafted or generated: "All people generated". Every person is drawn from the world's seed (§3), so each career meets new people.
- The user, 2026-11-05: "game world is handcrafted, events and world politics, assignments, opportunities, mission details are all procedural". The posts a place holds (its billets, its staff desks, its notables' offices) are part of the authored place and the same in every career; who fills them, what they do and what happens to them are drawn (§3.13).
- DESIGN.md, settled 2026-11-05: the four tiers; "Every persistent person has a schedule (the duty roster and the Plan of the Day), needs, moods, the tradecraft fear/trust/affinity gauges toward you and toward each other, memories of events, a career, and story arcs"; "The chain of command is live. Orders are given and expected, and so are customs (salutes outdoors, reporting, asking permission), discipline (counselling, extra duty, NJP) and praise"; pillar 6, "Nobody pops in or out in view"; pillar 7, "a negligent discharge, a missed formation or a dirty rifle all have in-world results".
- Tradecraft, 2026-10-26: "formalize where NPCs are going, pathfinding that works 100% of the time"; passers-by need "a destination in mind… where the tail would end if it were an actual mission".
- Tradecraft, 2026-10-26: "talk should pause the game, like combat, we will find a KLM style minigame for at least some conversations".
- Tradecraft, 2026-10-28: "the ambassy looks to be static, NPCs should move around (not much but still)". People are never furniture.
- Tradecraft, 2026-10-28: "what we see is what our character evaluates as being true". Gauges are never shown as numbers; the player sees the character's read.
- Tradecraft, 2026-11-03: "time passing (like during a judo class) doesn't seem to recycle the NPCs on the map?" The crowd is recycled after skips of 120 s or more.
- Tradecraft, 2026-11-04: "shot and down NPCs … should stay loaded for a reasonable amount of time"; "they would either steer wide away, or pool around the bodies with their phones out"; "over a certain pain threshold, people just lit up against a wall or lie down".
- Tradecraft, 2026-11-04: "the marine in ambassy reads as a civilian, they are military that should count for something". Marines read as marines: bearing, skills, customs.
- Tradecraft, 2026-11-04: "the reflex window is spammed on us too, there should be a way to remember our choice for a while". NPC-initiated talk is rate-capped.
- Tradecraft, 2026-11-04: "who shouts to drop it ? I don't see any police near me". What you hear but cannot see gets a marker at the screen's edge.
- Tradecraft, 2026-11-04: "I got arrested instantly without a splashscreen that explains what happened, without a reflex action to try to resist". Big outcomes (detention, office hours) land with a splash, a paper and, where plausible, a reflex choice.
- Longhaul, 2026-10-24 (v1.2.0, the mess): each diner books a place of their own and the rest queue on open floor; "behaviour must match the picture".
- Longhaul, 2026-10-25: "add more depth to crew (rank, experience, progression, death, age, retirement etc)… take your time."
- Longhaul, 2026-10-31 (v1.12.14 and v1.12.17): "who goes with a hull doesn't come home"; the dead come off the roster. Deaths are consistent: grieved, remembered, never undone.
- Longhaul, 2026-03-24: "Build everything as if it's going to scale to huge proportions, because it will." No per-tick work over everyone; far things get outcomes.

---

## 2. Tiers and the person record

### 2.1 The tiers

| Tier | Who | Typical count | On the map | Off the map | Saved |
|---|---|---|---|---|---|
| **T1, your people** | your squad (12 besides you); platoon HQ (platoon commander, platoon sergeant, platoon guide); the platoon's attached corpsman and radio operator; the company's first sergeant, gunnery sergeant and commander; up to 4 promoted friends | 20, cap 24 | full: needs each game minute (BODY's slow layer), perception, utility, 32 memories, ties to all of T1 and the platoon | L2 by the minute in the same site, L3 by the sol elsewhere (§13) | full sheet, 3.7 KB after TECH §6.6's size rules |
| **T2, your unit** | the rest of Echo Company; the battalion's sergeant major, commander and executive officer | about 170 | as T1, with 8 memories and ties to their own squad and chain only | L2/L3 | full sheet, 2.2 KB after TECH §6.6's size rules |
| **T3, named people of a place** | base staff (mess, armoury, aid station, chaplain, PX, barber, gym, range, centrifuge, gate), a ship's notables, a town's notables, an operation's people (a hostage, a target, a witness, drawn with the mission: CAREER §11.3) | 20 to 40 per site | as T2 | L3 | sheet, 1.7 KB; reduced to a stub (0.25 KB) after 120 sols unmet and outside any arc, and the stub deleted once no happening of weight 2 or more names it (TECH §6.6, rule 5) |
| **T4, the crowd** | everyone else: other battalions' marines, sailors, contractors, townsfolk | at most 120 live | movement, light perception (Awareness 4, tradecraft's `CIVILIAN_AWARENESS`), reactions, mood | nothing | a seed and a plan only |

### 2.2 Moving between tiers

- **T4 to T3** (tradecraft `src/sim/interact.js` `person()`, lines 143–151): the moment you open the F menu on a crowd member, they get a sheet generated from their seed, given a `p` id, its seed kept in `look.seed` (CONTRACTS §10); like a T3 stub, it is deleted once no happening of weight 2 or more names it (TECH §6.6, rule 5). Also promoted: anyone who becomes a casualty, anyone you detain or search, and up to 3 crowd witnesses of an event of weight 4 or more that involves you (they may be asked about it later).
- **T2 to T1**: transferred into your squad or platoon HQ, or befriended: affinity toward you of 3 or more and at least 6 notable exchanges with you in the last 30 sols. At most 4 promoted friends; when a fifth qualifies, the one with the lowest affinity drops back to T2 (ties and memories kept, memories trimmed to 8).
- **T1 to T2**: transferred out of your platoon, or you are transferred (CAREER.md). Your old squad becomes T2 with ties intact.
- **T3 stubs**: a T3 not met for 120 sols and in no arc keeps only `{ id, name, look seed, gauges, top 2 memories }`, and regrows a full sheet from their seed on the next meeting (the skills come back the same, because the seed is the same). A stub that no happening of weight 2 or more names any longer is deleted (TECH §6.6, rule 5); its id is never reused.

### 2.3 The person record

Plain data, `$` keys runtime-only (DESIGN.md, Saves). One record for the player and everyone persistent, so one helper reads any quantity for anyone ("one quantity, one number, one helper", DESIGN.md).

```json
{
  "id": "p42",
  "tier": 1,
  "name": { "given": "Noor", "family": "Halloran", "nick": "Hollywood" },
  "sex": "f",
  "bornMs": -746928000000,
  "home": { "id": "redwater", "world": "mars", "place": "Redwater", "kind": "valley-town" },
  "culture": "mars-valley",
  "faith": "none",
  "service": {
    "branch": "marines", "rank": "LCpl", "grade": "E3", "mos": "0311",
    "unitId": "2/4-E-2-1", "billet": "ft2-ar",
    "enlistedMs": -47000000000, "dateOfRankMs": -9100000000, "easMs": 79000000000,
    "plan": { "promote": [[31000000000, "E4"]], "reenlistP": 0.34 },
    "record": [ { "atMs": -9100000000, "kind": "promoted", "to": "E3" } ]
  },
  "traits": { "nerve": 1, "drive": -1, "warmth": 2, "rules": -1, "social": 2 },
  "tags": ["joker", "letter-writer"],
  "background": "ice-hauler-family",
  "quirks": ["hums-cadence"],
  "voice": { "phrase": "dust-in-everything", "topic": "hellas", "register": "chatty", "n": { "small-talk": 7, "shop-talk": 2 } },
  "skills": { "social": [5, 1], "awareness": [5, 2], "cqc": [5, 0] },
  "os": 16,
  "body": { "v": 1, "tmpl": "f-adult" },
  "kit": { "tmpl": "rifleman-garrison" },
  "needs": { "ateMs": 0, "drankMs": 0, "wokeMs": 0, "sleepDebtH": 1.5, "washedMs": 0, "voidedMs": 0, "bowelMs": 0, "shavedMs": 0, "haircutMs": 0 },
  "mood": { "stress": 12, "morale": 68, "mod": -4, "modMs": 0 },
  "gauges": { "trust": -1, "affinity": 1, "metMs": 0, "sharedMs": 0, "talkedMs": 0, "base": { "affinity": 1 } },
  "ties": { "p17": [0, 3, 4, 0, "buddy"], "p31": [0, 0, -2, 0, "rival"] },
  "acc": { "p233": { "trust": 0.25, "affinity": 0.5 } },
  "owes": { "p233": 1 },
  "sched": { "role": "rifleman", "liberty": "base" },
  "place": { "site": "melas", "area": "melas.echo.1", "room": "e1.bay-2-1", "x": 12.4, "z": 5.0, "sinceMs": 0 },
  "appearance": { "uniform": "utilities", "launderedMs": 0, "squaredMs": 0, "bagMs": 0, "dust": 0.2, "gigLine": true },
  "arcs": [ { "id": "dear-john", "stage": "withdrawn", "sinceMs": 0, "vars": { "partner": "Kai" } } ],
  "look": { "seed": 778211 }
}
```

- Ids are TECH §2.3.1's (CONTRACTS §10): a person is `p<n>`, and the player is an ordinary one, named by `state.player.id` and read through `playerId(state)` (`p233` in these samples, the 0.1 new game's of TECH §6.2); never `me`, `p0` or `p:player`. Fields holding an id are `id`, `<role>Id`, `<role>Ids` or `who`; maps keyed by person (`ties`, `acc`, `owes`) take the ids as keys. `place` uses PLACES's area and room ids.
- **No defaults on disk** (TECH §6.6, rule 1): null, false, zero where zero is the default and empty fields are left out, and `withDefaults('person', rec)` fills them on read. So this sample has no `callsign`, no `temper` (0), no `fear` (0), no `loans`, `task`, `overrides` or `discipline` (all empty), and no `alive: true` or `fate: null`.
- `body` is BODY.md's shape stored as its deltas from a template, `{ v, tmpl, …what differs }` (TECH §6.6, rule 2; CONTRACTS §9): this one differs from `f-adult` in nothing yet. `kit` is WEAPONS's (TECH §6.7): an issue template until one of its items is drawn, used, dropped or inspected, when `materialise()` gives the items ids. `needs` holds whatever event times BODY.md's need model keys on; the names above are the ones I rely on (§5).
- `skills` and `os` (the Warfighting over-skill) are SKILLS.md's shape: `{ key: [base, bg] }` (SKILLS §15.1) and 0 to 100.
- `ties[otherId]` is `[fear, trust, affinity, metMs, tag]`, sparse (§8.2). `acc` holds fractional gauge changes that have not yet made a whole step (§8.4).
- `gauges.sharedMs` is the last time this person and the player spent time together (§10.4); `gauges.talkedMs` the last time they talked, which keeps the tie from drifting (§8.1).
- `home.id` is SETTING §4.7's home id (CAREER §4.3 uses the same ids); `culture` is one of SETTING §12.1's name cultures.
- `voice` holds the person's turn of phrase, hobbyhorse topic and register, and the line counters that keep them from repeating themselves (§10.14). `appearance.squaredMs` is the last "square away" at the locker and `bagMs` the last uniforms put in the platoon's laundry bag (§11.10).
- The player's record adds `habits` (§6.6: `{ "salute": { "streak": { "mars-base": 20 }, "owned": ["mars-base"], "seen": ["mcrn-marine", "mcrn-navy"] } }`) and `talkGain: { sol, gained }`, the day's affinity from talk against its cap (§10.4).
- `bornMs` and every `*Ms` are game time in integer milliseconds from TIME.md's epoch; negative means before the game began.

### 2.4 The actor on the map

A person on the live area is an **actor**, as in tradecraft (`src/sim/game.js`, actors): `{ id, who: personId | null, seed: crowdSeed | null, x, y, z, deck, vx, vy, vz, face, att: { pitch, roll, spinRadS }, anchor, anchorRef, head, gait, stride, ai }`.

- **Height and attitude are in the shape from the first save** (my call, after the critics: the shape is frozen into saves and the actor grid at 0.0.3, while BODY §16's jumps, falls, ladders and low-g bounds come at 0.1 and free fall at 0.2). `y` is the height of the feet above the area's floor in metres (a body's centre when floating), `vy` its rate in m/s; `att` is pitch and roll in radians and the tumble rate in rad/s (BODY §16.6's tumble); `face` stays the heading.
- `anchor` is one of `feet` (standing in gravity), `boots` (mag boots locked, BODY §16.6), `handhold` (a handhold or rail, its fixture in `anchorRef`), `tether` (its line in `anchorRef`) or `none` (in the air, or floating). COMBAT §2.1's fighter `anchor: "planted"` reads as `boots` in free fall and `feet` in gravity.
- Defaults: `y` 0, `vy` 0, `att` `{ 0, 0, 0 }`, `anchor` `feet`, `anchorRef` null. The actor grid (PLACES's `grid.js`) stays two-dimensional by x and z; `y` is read by perception's eye height (§7.6), by line of sight and by the renderer's lift (VIEWS §3.5).

`ai` for persistent people:

```json
{ "kind": "person", "rung": 6, "task": { "kind": "chow", "target": "f:mess:t14#3", "steps": [["go", 31.2, 8.0], ["queue", "f:mess:line"], ["use", "f:mess:line", 22000], ["go", 40.1, 12.5], ["use", "f:mess:t14#3", 1260000]], "booked": "f:mess:t14#3", "startMs": 0, "untilMs": 0 }, "stack": [], "nextThinkTick": 1840, "stuckS": 0, "aware": { "p233": "seen" } }
```

Fixtures and their spots carry PLACES's ids (CONTRACTS §10): a fixture is `f:` and its template path, a spot or seat `<fixture id>#<n>` (seat 3 of table 14 is `f:mess:t14#3`), an opening `o:`.

Crowd actors carry `ai: { kind: "crowd", role, plan: { from, to, stops }, mood }` and nothing else (§12).

### 2.5 Happenings: what is known, by whom

Every notable thing that happens (a negligent discharge, a fight, a failed inspection, a saved life, a Dear John letter read aloud) is one record in `state.happenings`, a ring of at most 1,200 (my call; `state.events` is TIME's queue, and this ring was called the event log before TECH's correction 15). Knowledge of it is stored on the happening, not on each person, so gossip can be computed per happening and a person's memories are a runtime index (`$known[personId]`).

```json
{
  "id": "n8812", "kind": "nd", "atMs": 0, "site": "melas", "zone": "melas.kd-line-200",
  "subjectId": "p233", "w": 3,
  "facts": { "weapon": "rifle", "struck": "berm" },
  "known": {
    "2/4-E-2-1": ["saw", null, 3, 0, 0],
    "p12": ["saw", null, 3, 0, 0],
    "p17": ["told", "p12", 3, 1, 0]
  }
}
```

A happening's id is counted, `n<n>` (CONTRACTS §10); where it happened takes PLACES §1.9's ids, a room by its area's short code or, for an open structure on the ground, the ground zone (`melas.kd-line-200`, the KD range's 200 m line); `subjectId` and `objectId` name the people in it, and a field at its default is left out (here there is no `objectId`, no `tags`, no `endangered` and no `crowdWitnesses`: TECH §6.6, rule 1). A `known` entry is `[how, fromId, weight, distortion, learnedMs]`. **Knowledge is kept by group** (TECH §6.6, rule 4): an entry keyed by a unit id (`2/4-E-2-1`, the squad who saw it from the next lane) stands for everyone in it, and entries keyed by a person's id are the exceptions and the lone knowers (`p12`, a range coach; `p17`, told by `p12`); a person's own entry wins over their unit's. So a happening the whole company has heard of is about 0.3 KB, not 7 KB. `how` is `saw`, `heard`, `told` or `was` (the subject or object). Distortion codes are in §9.4. A happening is dropped when no knower holds it above the forgetting threshold, except weight-5 happenings (a death, a life saved), which are kept for the memorial (CAREER.md).

### 2.6 Units, billets and the chain

```json
"units": {
  "2/4-E":     { "name": "Echo Company, 2nd Battalion, 4th Marines", "parentId": "2/4", "billets": { "co": "p1", "xo": "p2", "1sg": "p3", "gysgt": "p4" } },
  "2/4-E-2":   { "parentId": "2/4-E", "billets": { "pltcmdr": "p40", "pltsgt": "p41", "guide": "p43", "doc": "p44", "ro": "p45" } },
  "2/4-E-2-1": { "parentId": "2/4-E-2", "billets": { "sl": "p50", "ft1-tl": "p51", "ft1-ar": "p52", "ft1-aar": "p53", "ft1-r": "p54", "ft2-tl": "p55", "ft2-ar": "p42", "ft2-aar": "p56", "ft2-r": "p233", "ft3-tl": "p57", "ft3-ar": "p58", "ft3-aar": "p59", "ft3-r": "p60" } }
}
```

Unit ids are TECH §2.3.1's paths (CONTRACTS §10: `2/4`, `2/4-E`, `2/4-E-2-1`, a fire team `2/4-E-2-1-ft2`); the billet values are person ids, the player's among them (`p233` fills the empty billet the roster left, §3.12). The Weapons Platoon is `2/4-E-4`, its sections `2/4-E-4-mg`, `2/4-E-4-mortar` and `2/4-E-4-assault`: PLACES's names for their bays in v0.0.3 (`src/data/places/echo.js`), to be confirmed here when the platoon is generated (§3.2).

`chainOf(personId)` walks up the billets and returns the NCO channel and the command channel merged in the order a junior marine meets them: fire team leader, squad leader, platoon sergeant, platoon commander, first sergeant, company commander, battalion sergeant major, battalion commander. An empty billet is skipped (the next one up acts). Billet keys are stable even when the people in them change, so orders and duty rosters address billets where that is what the Corps does ("the second team's AR").

---

## 3. Roster generation

### 3.1 When and from what

At a new career (CAREER.md), the world's seed generates **all of Echo Company** at once, plus the T3 staff of Base Melas, each person from `stream('roster', worldSeed, unitId, billet)` so one billet's dice never move another's. The same seed always gives the same company (a golden-output test holds it, as tradecraft's `tests/cities.test.mjs` holds its cities). When the next recruit enlists into the same world (DESIGN.md, Saves and death), the company exists already and has moved on in time; only the vacancy the player fills is new.

**Nobody is written** (the user, 2026-11-05: "All people generated"). The same generator, on its own streams and from the same authored pools (SETTING §12's names, §3.4 to §3.10's homes, traits, tags, backgrounds, quirks and ties, §10.14's voices, §15's arc templates), makes every person the game holds: the squad, its NCOs and officers and the battalion's chain above them; the base's staff and every site's notables (§3.13); the senior drill instructor met in the flashback and the recruit's family (CAREER §4.7, §4.8); the holders of the Republic's and the factions' public offices, registered before the roster (SETTING §7.7, §12.5); a mission's hostages, targets and witnesses (CAREER §11.3); replacements and new joins (§14.4); and every crowd member promoted to a sheet (§2.2). What is authored is the pools and the places: the billets a unit has, the posts a building holds and the offices of a town are part of the handcrafted world (PLACES, SETTING), and the same in every career; who fills each, and what becomes of them, is drawn. Any name this design prints for a person is an example of the generator's output.

### 3.2 The company's billets

A rifle platoon, as DESIGN.md settles it (squad of 13, platoon of 42 and its two attachments, 44: CONTRACTS §15):

| Billet | Count | Rank (weights) |
|---|---|---|
| Platoon commander | 1 | 2ndLt 80, 1stLt 20 |
| Platoon sergeant | 1 | SSgt 85, GySgt 10, Sgt 5 |
| Platoon guide | 1 | Sgt 70, SSgt 15, Cpl 15 |
| Squad leader | 3 | Sgt 75, Cpl 20, SSgt 5 |
| Fire team leader | 9 | Cpl 60, LCpl 40 |
| Automatic rifleman | 9 | LCpl 60, PFC 30, Cpl 10 |
| Assistant automatic rifleman | 9 | PFC 50, LCpl 40, Pvt 10 |
| Rifleman | 9 | PFC 50, Pvt 30, LCpl 20 |
| Corpsman (Navy, attached) | 1 | junior hospital rating 40, third class 50, second class 10 (SETTING.md names the Navy grades) |
| Radio operator (attached) | 1 | LCpl 60, Cpl 25, PFC 15 |

Three rifle platoons (132), a weapons platoon of 46 (platoon commander and sergeant; a machine-gun section of 19, a mortar section of 13, an assault section of 13), and a company headquarters of 13 (commander Capt, executive officer 1stLt, first sergeant, gunnery sergeant, clerk, supply sergeant, communications chief, senior corpsman, a pressure-and-suit safety NCO (my call: a Martian billet, a Cpl who owns the company's suit lockers and pressure drills), two drivers, two runners). That is 191 with attachments, the hub's company (CONTRACTS §15). Billet names belong to SETTING.md's MOS list; weapons in the billets belong to WEAPONS.md.

**As built in v0.0.3** (`src/data/people/billets.js`, `ranks.js`; each my call where this section names only the post): the clerk LCpl 50, Cpl 40, PFC 10 (MOS 0111); the supply sergeant Sgt 70, SSgt 30 (3043); the communications chief SSgt 60, Sgt 40 (0621); the senior corpsman HPO2 60, HPO1 40 (8404); the pressure-and-suit safety NCO a Cpl (2147); the drivers LCpl 60, PFC 40 (3531); the runners PFC 60, Pvt 20, LCpl 20 (0311). The Navy's grades are written HAR, HLH, HPO2 and HPO1 (SETTING §5.5), and every corpsman takes 8404 (SETTING §5.6). A platoon's HQ rack room berths its guide, corpsman and radio operator, with one berth spare (PLACES §4.4). `rollRoster` fills the company headquarters (13 on `2/4-E`) and the three rifle platoons (5 on each platoon and three squads of 13): 145 billets, 144 drawn and the player's, and returns `{ people, units, ms, stats }`. **The Weapons Platoon is not generated**: its sections above add to 47 (2 + 19 + 13 + 13), not the 46 this paragraph and CONTRACTS §15 give, and it waits until the billets agree with the total (CONTRACTS §19, item 12).

### 3.3 Ranks and ages

Rank comes from the billet's weights. Age (Earth years on the UTC calendar, my call; SETTING.md owns the calendar) is drawn from a triangular distribution over the rank's range with its mode at 35% of the range:

| Rank | Age range | Rank | Age range |
|---|---|---|---|
| Pvt | 18–20 | 2ndLt | 22–25 |
| PFC | 18–22 | 1stLt | 23–28 |
| LCpl | 19–24 | Capt | 26–33 |
| Cpl | 20–27 | Maj | 31–38 |
| Sgt | 22–31 | LtCol | 36–44 |
| SSgt | 25–35 | | |
| GySgt | 29–39 | | |
| 1stSgt | 33–43 | | |
| SgtMaj | 38–48 | | |

Enlistment age is drawn from 18–21; `enlistedMs` follows from it and must leave at least the time in grade CAREER.md's promotion rules require for the rank (if not, the age is redrawn up to 5 times, then raised to fit). 30% of corporals and above have one earlier deployment on their record (my call; SETTING.md says where).

**As built in v0.0.3** (`src/data/people/ranks.js`, `src/sim/people/roster.js`): ages are counted back from `START_MS`, the world's start, so a seed gives the same company whatever hour a game starts at (my call). The time in service fits the rank by CAREER §8.1's minimum TIS; a Pvt holds under 6 months and a PFC under 14 (the top of CAREER's 9 to 14 months to LCpl); officers are commissioned at 21 to 23 and count their service from it, a 1stLt after 18 months and a Capt after 48 (my calls on the US model). The earlier deployment of 30% of corporals and up is not rolled yet: it comes with the career timelines (§3.11).

### 3.4 Homes and cultures

Homes are drawn from **SETTING §4.7's shares** among enlisted marines, by its ids: `redwater` and the valley towns 30, `tharsis` 18, `hellas` 12, `seacoast` 10, `londres` 9, `farms` 7, `callisto` 5, `ceres` 4, `aboard` 3, `earth` 2 (100 in all). The place inside a home id (Redwater or Canal Town; Dustfall or Highrim) is drawn evenly from SETTING §4.7's list for it, and each id carries its name culture (SETTING §12.1: `mars-valley`, `mars-dome`, `jovian`, `belter`, `earther`). The places are SETTING's: Redwater, Canal Town, Dustfall, Highrim, Low Hellas, Ochre Basin, Coldspring, Ironvale, Kasei Deep, Firstlight, Twin Domes, Londres Nova and Mars Station among them (LONGHAUL's names, minus the canon-ish "Innis Shallow", which SETTING §1.2 does not use). CAREER §4.3's birthplace weights are the player's draw at character creation, a separate table (§20).

A home's **kind** is data with hooks other sections read: `valley-town` (grew up breathing open air; `redwater`, `farms`), `dome` (never did: "dome kids" remark on the sky and are slower to read wind and dust; `tharsis`, `londres`, and `callisto` in low gravity), `sea-shore` (swimmers; `hellas`, `seacoast`), `orbital` (Navy families; `aboard`), `belt` (born in low gravity: BODY.md reads this for G tolerance and conditioning; speaks Lang Belta; meets prejudice; `ceres`), `earth` (born in 1 G: strong under thrust, meets the opposite prejudice). BODY reads childhood gravity from the home id (CAREER §4.3's column). **Women are 30%** of the Corps and of its infantry (SETTING §4.7), the same in every billet.

### 3.5 Names

`personName(culture, homeKind, sex, rng)` draws a given name and a family name from SETTING.md's pools by culture and home (LONGHAUL's are the starting point: `js/sim/careers.js:93–107` given names by home, `js/sim/names.js` `FAMILY` as the system-wide melting pot and `MARS_FOUNDER` as an old-family flavour for Martians). A **registry** of full names in the save (`state.names`, longhaul's registry idea made persistent) keeps every full name in the world unique: a clash rerolls up to 10 times. Family names may repeat once within a company, as they do in real units, and the pair gets the unit's usual fix: nicknames by size, age or home ("Big Okonjo", "Tharsis Okonjo").

As built in v0.0.3, a family name already in the company takes that fix as a nickname when its bearer has none ("Big", "Little" or the home's word), which lifts tier 2's share of nicknames from 20% to about 31%; nicknames and quirks are each unique within a squad (my calls).

**Nicknames**: 40% of T1 and 20% of T2 have one at generation, from a pool keyed by quirk, home, background or a pun on the surname (SETTING.md's pool). Others earn one later: after an event of weight 3 or more in which they are the subject, there is a 20% chance the squad coins one from the event's pool ("Berm" after a round into the range berm). The player earns one by a firmer rule, because it is the most visible sign of acceptance (§10.14).

### 3.6 Personality: six axes and two tags

Six integer axes from −3 to +3, each drawn from `[−3: 3%, −2: 10%, −1: 22%, 0: 30%, +1: 22%, +2: 10%, +3: 3%]`. Promotion selects people, so NCOs draw `drive` and `rules` with +1 added before clamping, and staff NCOs and officers also `nerve` (my call).

| Axis | Low end | High end | What it drives (one helper each) |
|---|---|---|---|
| `nerve` | jumpy | steady | stress gain ×(1 − 0.12 × nerve); fear nudges ×(1 − 0.1 × nerve); suppression (COMBAT.md reads it); hard-talk composure |
| `drive` | shammer | squared away | arrives 2 min earlier per point above 0; locker and rack upkeep; gym and study utility; temptation ×(1 − 0.2 × drive) |
| `warmth` | cold | warm | affinity gains toward others ×(1 + 0.15 × warmth); comforting +1 per point; banter tone; hard-talk yield bias |
| `temper` | calm | hot | hard-talk press bias; blow-ups; fights |
| `rules` | rule-bender | by the book | reporting others; leniency as a handler; temptation ×(1 − 0.25 × rules); uniform standards |
| `social` | loner | gregarious | free-time contact hours ×(1 + 0.2 × social); gossip telling ×(1 + 0.15 × social); social utility |

**Tags**: two per T1 and T2 person, one per T3, drawn by weight with exclusions (no `squared-away` with `shammer`, no `teetotal` with `drinker`; as built in v0.0.3, `src/data/people/traits.js`, also no `discreet` with `gossip`, `forgiving` with `grudge-holder`, `loner` with `party-animal`, `clean-freak` with `slob`, `early-bird` with `night-owl` or `protective` with `bully`; `earther-hater` is never drawn for the Earth-born nor `belt-sympathiser` for the Belt-born; a `loner` has `social` ≤ 0 and a `party-animal` `social` ≥ 0: my calls):

| Tag | Effect |
|---|---|
| `joker` | banter rate ×2; the distract approach +2 when they comfort |
| `gossip` | tells ×2, distorts ×2 |
| `discreet` | tells ×0.3; never breaks a confidence unless affinity to the subject ≤ −3 |
| `straight-shooter` | distorts ×0.5; rarely lies (lie approach weight 0.2) |
| `gym-rat` | gym utility +0.5; fitness practice (SKILLS.md) |
| `bookish` | read and study utility +0.4 |
| `devout` | chapel on the rest sol (faith from SETTING.md); comfort through faith; grace before meals |
| `homesick` | call-home utility +0.3; morale −3 for the first 60 sols away from home |
| `letter-writer` | writes letters (an activity); mail-call effects ×1.5 |
| `drinker` | liberty incidents ×3; may keep contraband alcohol |
| `teetotal` | never drinks; liberty incidents ×0.5 |
| `gambler` | cards utility +0.4; eligible for the money-trouble arc |
| `mother-hen` | checks on juniors in distress (offers comfort unasked); comfort +1 |
| `sea-lawyer` | objects to orders 3× as often; knows the regulations (+2 to their statement at office hours) |
| `shammer` | temptation ×2; duties count `drive` one lower |
| `squared-away` | inspection items always pass; temptation ×0.3 |
| `grudge-holder` | negative gauges drift back at half speed |
| `forgiving` | negative gauges drift back at double speed |
| `loner` | contact hours ×0.5; rack and reading utility +0.2 |
| `party-animal` | liberty utility +0.5 |
| `clean-freak` | showers twice a sol; remarks on others' hygiene |
| `slob` | locker tidiness decays ×2 |
| `night-owl` | falls asleep 30 min later (BODY.md's sleep onset); late-for-reveille risk |
| `early-bird` | wakes 20 min before reveille |
| `schemer` | trades, holds markers, deals in small contraband |
| `protective` | steps in when someone is bullied (stands up for them) |
| `bully` | only with temper ≥ 1 and warmth ≤ −1; eligible to start the bully arc |
| `earther-hater` | affinity −2 toward Earth-born; barks about Earthers |
| `belt-sympathiser` | affinity +1 toward Belt-born; argues the OPA's case |
| `terraformer` | idealist about the Long Work; morale +2 outdoors in open air; barks the sayings ("Plant Trees Anyway") |

### 3.7 Backgrounds

One per person, weighted by home kind. Skill lifts follow tradecraft's rule (the user, 2026-10-27: "background should impact starting skills by up to +4 points (an ex marine would know how to fight)"); skill keys are SKILLS.md's, named here as I rely on them.

| Background | Homes | Skill lifts | Trait and tag bias | Story hooks |
|---|---|---|---|---|
| terraforming-crew family | valley, sea-shore | fieldcraft +2, tech +1 | `terraformer` ×3 | water-rights arc |
| ice-hauler family | belt, orbital | eva +2, zerog +2 | | zero-g at ease (BODY.md) |
| dome engineer's apprentice | dome | tech +3 | drive +1 | |
| lowland farm | valley | fitness +2, fieldcraft +1 | warmth +1 | |
| Redwater streets | valley | cqc +3, fieldcraft +1 | rules −1 | knows Redwater's bars |
| police family (MSS) | any Mars | awareness +2 | rules +1 | |
| Navy brat | orbital | eva +1, tech +1 | | knows the Navy's ways |
| university dropout | dome, valley | tech +2, social +1 | `bookish` ×2 | |
| mine worker | dome, belt | fitness +2, demolitions +1 | | |
| ambulance trainee | any | medicine +3 | `mother-hen` ×2 | |
| church family | any | social +1 | `devout` ×4 | faith arc |
| athlete | any | fitness +3 or cqc +3 | | recon-dreams arc |
| sea-shore warden (wildlife service) | sea-shore | marksmanship +3, fieldcraft +2 | | |
| naturalised Belter (dock hand) | belt | zerog +3, eva +1; Lang Belta fluent | | Belter-blood arc |
| Earth-born immigrant | earth | fitness +1; one Earth language | | Earther arc |
| Corps family (a parent who served) | any | marksmanship +2 | rules +1, drive +1 | legacy pressure |

### 3.8 Skills

NPC skill levels by rank and MOS are SKILLS.md's table. This section adds only: the background lifts above; a per-person spread of −2 to +2 on each trained base from the roster stream (my call); tag practice (`gym-rat` +1 practice in fitness, `bookish` +1 practice in tech). Marines must read as marines (the user, 2026-11-04): the floor for any marine in weapons handling, CQC, fitness and awareness is SKILLS.md's "out of boot camp" level, whatever the dice.

### 3.9 Quirks

Each T1 has one quirk, each T2 one at 50%: a habit with a cue the figure or the log can show, sometimes with a small effect. No two people of a squad share a quirk (built in v0.0.3, my call). A starting pool (SETTING.md and VIEWS.md add to it, toward forty): hums cadence while cleaning; chews stim gum; always first in the chow line; sleeps with a photo; talks in their sleep; **snores** (rack neighbours within 3 m lose sleep quality by BODY.md's rule); keeps a rock from home; counts rounds aloud; will not use magazine number seven; reads the regulations for fun; keeps a terrarium of lichen; wipes the dust off everything; tells the same story about Hellas; checks their dosimeter constantly; names their rifle (shown on the sheet); speaks Lang Belta under their breath; always volunteers; never volunteers; does push-ups when nervous; mimics officers, badly.

### 3.10 Starting ties

For each pair inside the platoon (and each T1 pair):

- **Baseline affinity** = round(0.2 × (warmthᵢ + warmthⱼ) + compatibility + hash noise of −1, 0 or +1). Compatibility: same home place +1; same background +1; shared tag (two `gym-rat`, two `gambler`) +1; clashing tags (`earther-hater` with an Earth-born −3, `clean-freak` with `slob` −1, `sea-lawyer` with a `rules` ≥ 2 NCO −1). Baseline trust 0, fear 0.
- **Service history**: came out of the same infantry school class ("boot buddies") +2 affinity and +1 trust; deployed together before +1 trust and +1 affinity.
- **Set pieces** (seeded, so every squad has its shape): one buddy pair per fire team (affinity 4, trust 3); one rival pair per squad (affinity −2, trust 0); one mentor link per squad (the squad leader toward one junior: affinity 2, trust 3); the platoon sergeant's "problem child" (trust −2 toward one junior).
- T2 pairs outside a squad are not stored: the baseline formula answers for them until something changes them.

### 3.11 Career timeline

Each T1 and T2 person carries `service.plan`: the dates of their next promotions, their end of active service (EAS), a reenlistment chance and a transfer date, all drawn at generation from CAREER.md's rules on their own stream. Events modify it: an NJP delays the next promotion by 180 sols (my call), an award brings it 30 sols earlier, a reduction in grade replans from the new grade. NPC careers therefore move in closed form and can be read at any date: `rankAt(person, ms)`.

### 3.12 The player's arrival

The generator leaves one billet empty for the player: **rifleman, 2nd fire team, 1st Squad, 2nd Platoon** (my call). Until CAREER's enlistment paper (0.0.13) a generated person fills it and is the player (`fillPlayer`, built in v0.0.3: drawn on the billet's own stream, tier 1, with no axes, tags, quirk or nickname, the next id after the roster; the user, 2026-11-05: "All people generated"). CAREER.md decides the player's rank and the check-in day. On arrival, every enlisted T1 starts toward the player at fear 0, trust −1 ("a boot is a boot until they show you otherwise", my call), affinity equal to their compatibility with the player's home and background (the player has no personality axes: the player plays the personality). The chain starts at trust 0 and affinity 0. The squad leader, whoever the roster drew for the billet, is the tutor of CAREER.md's embedded tutorial, and the squad tests the new join through barks and small asks in the first sols (the "boot" bark pool).

### 3.13 Tier 3: base staff and town notables

The posts are the place's own, authored with it and the same in every career; the people in them are generated, one draw per post (`stream('staff', worldSeed, site, post)`, my call: the world's seed is in the key, so two worlds staff the same mess hall with different people), and placed in PLACES.md's buildings. Base Melas's named staff: the mess hall's chief (GySgt) and two cooks; the battalion armoury's chief (SSgt) and two armourers; the battalion aid station's medical officer (a Navy lieutenant), senior chief corpsman and three corpsmen; the chaplain and an assistant; the PX manager and two clerks (civilians); the barber (civilian); the gym's staff and the combatives instructor (Sgt); the range officer and range NCO; the centrifuge's operator and the flight physiologist (G-conditioning, BODY.md); the military police desk sergeant and two named MPs; the battalion's adjutant and two clerks; the battalion supply chief; in Redwater, a bar owner, a diner's cook, a tattoo artist, a pawnbroker and an MSS patrol officer. Europa's notables (milestone 0.3, PLACES.md and SETTING.md for their places and faces): the town administrator, a union representative, the clinic's doctor, a bar owner, a corporate security chief, a UN observer, a water-works foreman, a priest, a teacher, and a suspected Ceres Free Belt organiser. Beyond the sites, the holders of SETTING §7.7's public offices (the Commandant, the First Councillor, Ice Control's Chief Controller and the rest) are T3 people generated at new game before the roster, so their full names are registered first (SETTING §12.5); the world's politics may replace any of them (an election, a retirement, a death), and the successor is drawn the same way, from the world's seed and the office's pools (my call).

**As built in v0.0.5** (`src/data/people/posts.js` `POSTS`, `src/sim/people/staff.js` `drawStaff`, `setPost`; the build sheet 0.0.5 §8 items 22 to 24): the first two posts, both authored with the KD range: `melas:kd-ro`, the **range officer** (SSgt 60, GySgt 25, Sgt 15; MOS 0369; 2/4), and `melas:kd-coach`, the **marksmanship coach** (Sgt 60, Cpl 40; MOS 8531; 2/4). Each person is drawn as the roster draws a billet's (`roster.js drawCore`: sex, rank by the post's weights, age, home, background, traits, looks) but **on the post's own stream, `stream('staff', seed, site, post)`**, and named on its side streams (`admitStaff`), so the roster, the player and their goldens move by nothing (seeds 48213, 7 and 1 each draw their own pair). They are **tier 3**, registered by name, with no billet in any unit (`service.billet` names the post), dressed `rangeStaff`, and roll with a lazy sheet by their rank's tier (SKILLS §11.1). **`person.post`** = `{ key, area, x, z, y, face, posture, outfit }` (by `key`, a data key, never an id) stands them at their post, and `place.js` places a posted person there and nowhere else while posted; `whereIs` returns the post's pose. The RO stands on the tower's deck, the coach at your left shoulder (PLACES §4.12).

---

## 4. Schedules

### 4.1 The garrison sol (what I build on from TIME.md)

TIME.md owns the Plan of the Day as a time structure (its §9.2 is the 0.1 template). People's templates reference **block ids**, never clock times, so when TIME.md's numbers move, everyone follows. The ids I use for a training sol at Base Melas; their times are TIME §9.2's, quoted once in CONTRACTS §4, and not copied here:

| Block id | Notes for people |
|---|---|
| `reveille` | the duty NCO's call; fire watch 4 wakes the bay |
| `muster` | accountability in the bay, by squad |
| `pt` | run, circuit or centrifuge by rotation; PT uniform |
| `hygiene-chow` | the reveille queue at the heads (§6.4); the chow window inside the block |
| `morning-formation` | the squad leader's inspection of shave, haircut and uniform; morning colours |
| `train-a` | the company's training plan |
| `noon-chow` | the line closes before the block ends |
| `noon-formation` | |
| `train-b` | |
| `maintenance` | weapons and gear, the armoury line; field day on Thursday |
| `evening-chow` | |
| `mail-call` | optional, lived |
| `free` | on base; liberty on the right evenings |
| `taps` | in the rack (the lights-out warning before it) |
| `night` | includes the timeslip after 24:00; the four fire watches |

Rack time is 7 h 30 min of clock plus the 39 min 35 s timeslip: 8 h 09 min 35 s. Martian marines sleep long; Earth-born ones notice.

### 4.2 The week

A week of seven sols, Monday to Sunday (SETTING §3.4: weekdays by `solIndex mod 7`): Monday to Friday train; Thursday's maintenance block becomes **field day**; Friday opens with the platoon sergeant's **inspection** (§11.10), then the short `train-a` and liberty from 17:15; Saturday and Sunday are holiday routine (TIME §9.2; CONTRACTS §4). On standby, liberty is limited to the recall radius (Redwater) and one unannounced recall drill comes each week (TIME.md); until Redwater is built (0.2), the player's liberty is on base and the people's Redwater liberty is an off-site override (§4.6; CONTRACTS §4). Liberty for privates to lance corporals ends at 00:00, "home before the slip" (my call: a local custom of the Mariner Valley bases); for corporals and above at 02:00. Privates to lance corporals go on liberty in pairs (the liberty-buddy rule).

### 4.3 The duty roster

| Duty | Eligible | When | Length | Post | Expected rate per eligible person | What the post asks |
|---|---|---|---|---|---|---|
| Fire watch | Pvt to LCpl of the platoon | every night | four watches (TIME.md's times): 22:00–24:00 and the slip (**the slip watch**, 2 h 39 min 35 s, the longest of the night, traded for or given); 00:00–02:00; 02:00–04:00; 04:00–05:30 | the platoon's floor of squad bays (PLACES §4.4: a bay per squad, 15 racks), one roving watch | about 1 in 8 sols (4 watches a night among about 30 eligible) | stay awake and in the bay; rounds every 30 min (doors, heads, the duty log); wake the next watch; wake the bay at reveille |
| Duty NCO | Cpl to Sgt of the company | 08:00 to 08:00 | 1 sol | barracks duty desk | about 1 in 40 sols | the desk, the log, musters for the restricted, the barracks' safety; sleeps 02:00–04:00 in the duty room |
| Duty runner | PFC to LCpl | 08:00 to 08:00 | 1 sol | duty desk | about 1 in 100 sols | messages, summons, the phone |
| Guard | the company's turn: 1 sol in 4 (four companies share the base guard, my call) | 08:00 to 08:00 | three reliefs, 2 h on and 4 h off | gate, armoury, perimeter posts | about 1 in 30 sols (24 marines on the company's guard day) | the post's orders (SETTING.md's general orders); a sentry calls for relief, never leaves |
| Mess duty | Pvt to LCpl, 4 per company | 7 sols, 04:30–19:30 | full days | mess hall | about once in 190 sols | serving line, scullery, pot shack (7 sols is my call; real units served 30 days) |
| Working party | whoever is free, juniors first | on request by the first sergeant or platoon sergeant | 1–3 h | anywhere | about 1 in 6 sols | carrying, cleaning, police call, the **dust sweep** (Mars dust on every threshold) |
| Head detail | 2 juniors per head | daily 21:00–21:30 | 30 min | the bay's head | about 1 in 15 sols | |
| Range detail | 4 per range day | 06:30–17:00 | the day | the range | when the range is booked | targets, brass, the ammunition point |
| Extra duty | those punished (§11.5) | after working hours | at most 2 h a sol, never on the rest sol | as assigned | as awarded | |

**Assignment** (tradecraft's week-ahead planning, `src/sim/campaign.js` `plan()`, made fair): with Monday's Plan of the Day, posted Sunday at 20:00 (`week@Sunday/20:00`, CONTRACTS §5), the platoon sergeant's roster for the next week is published to the duty board in the barracks passageway and to wrist terminals (VIEWS.md). For each slot, in time order, from `stream('roster', unitId, weekIndex)`:

```
eligible = members of the right ranks, not on leave, school, hospital, sick in quarters,
           mess duty or another duty within 12 h before or after the slot
score(p) = solsSinceLast(p, duty)            # longest wait first
         + 0.5 * extraDutyOwed(p)            # the punished first
         - 2 * (has a duty already this week)
         + hashFloat(p.id, slot) * 0.1       # tie-break
assign the highest score
```

Over 8 weeks the spread of fire watches among the eligible must not exceed 1 (a test prints it). **Swaps** between two marines are allowed until 2 h before the slot, with the platoon sergeant's approval (a conversation, §10.4); an unapproved swap is an infraction for both. You know your duties only once you read the board or someone tells you ("we only know what we know").

### 4.4 Role templates

A template maps each block id to an activity, a place kind and a variance. Some of the defaults (my calls, to be tuned in play):

| Role | Morning | Day | Evening | Particular |
|---|---|---|---|---|
| rifleman, AR, AAR | hygiene, PT, chow | the training blocks with the squad | maintenance, chow, free | arrives at formation 1–6 min early, 2 min earlier per point of drive above 0; never late except by a lapse (§6.5) |
| fire team leader | as rifleman, 5 min earlier | leads the team in training | checks the team's weapons before turn-in | inspects the team before the squad leader does |
| squad leader | up at 05:15 | runs the squad's training | the squad's evening word; visits the bay at 21:30 | NCO-call with the platoon sergeant at 07:30 |
| platoon sergeant | at the company office at 06:45 | runs PT on two sols in five; the platoon's schedule | the duty roster; walks the bay during field day | inspects on Friday |
| platoon commander | officer call at the company at 07:30 | training oversight; the platoon's paperwork | leaves the barracks at 18:00; officers' quarters | |
| corpsman ("Doc") | sick call at the aid station 07:00–08:00 | with the platoon | the aid station on alternate evenings | |
| first sergeant | company office from 06:30 | everywhere | walks the barracks at 17:00 and during field day | holds the company's discipline (§11) |
| company commander | office 07:30–17:30 | PT with the company on Wednesday | office hours at 09:00 when there are cases | |
| mess chief (T3) | mess hall from 04:00 | the serving line at chow | closes at 19:30 | |
| armourer (T3) | armoury window 06:00–18:00 (PLACES §4.6; PLACES §4.14 owns posts and hours) | inspections at turn-in | | the armoury line on range days |
| MP desk sergeant (T3) | 12-hour shifts, 06:00 and 18:00 | | | |
| chaplain (T3) | office hours 09:00–16:00 | visits the barracks on Tuesday | the chapel on the rest sol | |

Per-person variance comes from `hashFloat(personId, sol, blockId)`: arrival offsets, how long a shower or a meal takes (inside TIME.md's activity durations), when in a block an errand happens, which free-time option wins a near tie.

### 4.5 Free time and liberty

Free time is chosen by the utility model (§6.2): the gym, the rec room, the comm booths (calls to Mars are live; calls to Jupiter or Earth are messages because of the light lag, SETTING.md), reading in the rack, the PX, the chapel, cards, walking outside in the valley's open air. On rest sols and with a pass, juniors choose liberty in Redwater: 40% of free juniors on an evening, 60% across a rest sol (my calls); NCOs half as often. Liberty is an off-site override (§4.6) from the bus out to the bus back (PLACES.md and TIME.md set the ride); what happens in town is resolved as outcomes unless the player is there (§6.5).

### 4.6 `whereIs(person, ms)`

```
whereIs(p, ms):
  1. if p is an actor on the live area: its position and task are the truth
  2. else, the first override covering ms, by priority:
       dead > hospital > brig or correctional custody > leave, school, TAD, transfer
       > deployment detachment > a duty slot > liberty > a summons > an arc's absence > sick in quarters
     -> that override's site, area, room and activity
  3. else block = podBlock(unitOf(p), ms); act = template[p.sched.role][block.id]
     offsets from hashFloat(p.id, sol, block.id); an errand window from hashFloat(p.id, sol, block.id, 'errand')
  -> { site, area, room, spot, spotKind, activity, posture, gait, path, sinceMs, untilMs }
```

- **One name, one shape.** This is the schedule lookup every section calls (CONTRACTS §13): TIME, VIEWS and TECH call it `whereIs` (they once wrote `whereAt`, with a shorter return), and the fields TIME's landing needs (`posture`, `path`) are in it.
- `spot` is the spot id once one is decided (their rack, their mark in ranks, a booked seat), else null with `spotKind` saying what kind they will book (`mess-seat`, `sink`). `posture` is the activity's (`stand`, `sit`, `lie`, `kneel`, `attention`, `parade-rest`, `float`; VIEWS draws it, BODY's shapes).
- `path` is null unless they are walking at `ms`: then `{ from, to, route, departMs, arriveMs }`, with `route` the portals of PLACES §2.3's site graph, so the caller can put them at the walked fraction `(ms − departMs) / (arriveMs − departMs)` along it (TIME §5.9's landing; §13.5's handover on grounds).

Spots are taken deterministically when someone is materialised: their own rack, their place in ranks (formation order is by squad and fire team, so "your place" is a real place), their seat at chow by the seating rule (§6.4).

**As built in v0.0.3** (`src/sim/people/place.js`; no AI yet, so the people you can meet are placed, not walked). Placed: the 1st Squad's twelve, the fire watch and you; everyone else exists in state and is `away`, with no actor. `whereIs` is cut to what exists. By the lighting of their berth's room (PLACES §3.9, so the poses and the lamps flip together at taps and reveille), a placed person lies in their berth in PT kit from lights out to reveille, the rack's curtain drawn on half the nights (`CURTAIN_FRAC` 0.5, one draw a night by hash), and by day is at their rack in utilities, covers off indoors: the lower berth sitting on the rack's edge (where by day only the head shows under the upper deck: VIEWS §18, question 11) or standing at the locker, the upper sitting on the footlocker or standing, a pose every two hours by hash (`POSE_PERIOD_MS` 7,200,000), never two on one spot. The fire watch (one Pvt to LCpl of 2nd Platoon's 2nd or 3rd Squad, drawn once a world) sits at bay-2-1's post from taps to reveille and spends the day at their own berth in their own squad's bay (bay-2-2 or bay-2-3). **A pose changes only where you cannot see it**: on its second's bucket an actor takes its `whereIs` only if the player's visibility (§7.6) is exactly 0 both where it is and where it would go, stricter than `canSee`, so nothing moves in the fog's soft edge either, and a drawn curtain counts as seen with its rack (my call). **In a skip** the slow contributor `people:place` keeps the same rule at each step's end: those out of the player's sight, where they are and where they would go, take their place; those in sight keep their pose until the live layer finds them unseen; a sleeping player sees nothing, so a night's sleep moves everyone (TIME §5.9; v0.0.3's review: nine changed in one frame at reveille, seven of them in sight). Behind an area's cut every actor is made at its `whereIs` at once, with new `a<n>` ids, the player's kept; `state.actors.area` names the area they were made for (TECH §6.1), so a load carries on with the same actors.

**As built in v0.0.4: lived transitions** (`place.js`, `figure.js`; the build sheet's §8 item 18, §9 items 29 and 30; my calls). A **transition** is a lived change drawn in sight as poses with a start and a length, never a pop: `rise`, `down`, `sit`, `stand`, `step` and `dress`. The actor's fields hold the end state; `actor.trans = { kind, fromMs, ms, from: { posture, x, z, y, face, head, spotId } }` and `actor.dress = { fromMs, ms, from, to }` hold where it came from and when, and `poseAt(actor, ms)` gives every pose between (`lie`, `sitUp` at 0.35, `sit` on the rack's edge at 0.55, `climb` from an upper berth to 0.8, `standUp`, `stand`; `lieDown` the reverse). `RISE_MS` 2,500 (3,400 from an upper berth, the climb), `DOWN_MS` 2,500 (3,400), `SIT_MS` 1,200, `STEP_IN_MS` 400 (superseded in v0.0.5: the next paragraph). Every other change stays unseen-only, v0.0.3's rule. **The calls**: reveille, the klaxon and the stand-down (`squadCall`) set a transition on every placed marine the call reaches, after their own delay, `CALL_DELAY_MS` 2 to 20 s (`2,000 + hashInt(18,001, 'call', pid, cause)` ms, cosmetic, no dice; superseded in v0.0.5): at the klaxon each rises, dresses into utilities at the alarm's tempo (2.6 minutes) and stands at their rack's foot; at the stand-down each undresses to PT kit and lies down again, all lying 5 minutes after it; at reveille each stands at their rack's foot in PT kit until the 05:40 muster, then takes the day pose. **A call applies a pose in sight only as a transition from the pose the actor holds**, in sight or not; any other change waits for the player to look away (the fire watch's walk back to their own bay at reveille had popped 17.4 m in one tick). **An upper berth's marine stands `UPPER_FOOT_M` 0.6 m beside the rack's foot**, toward its lockers, so no two marines share a spot; the lower berth and the player use the spot itself. **A dress plays its frames before a transition still to come** (the stand-down's undressing, then the lying down: the review of v0.0.4 had seen outfits flip from utilities to PT kit in sight), and **the berth drawn is the pose's own** (`trans.from.spotId` until the rise leaves it: every upper sleeper had been drawn in the lower berth from the klaxon's first frame). Measured in v0.0.4 (`time-placement`; superseded in v0.0.5): at the klaxon the twelve rise after 3.3 to 19.1 s, all in utilities by 02:32:58; watched through the drill and 5 minutes past the stand-down from the aisle, 162 changes seen, the largest step between two ticks 0.201 m, 0 pops, no outfit changed in sight but in a dress frame and no berth frame off its berth. The player's own lying or sitting holds the feet; a move key, R ("get up") or T starts the player's own `rise`, and nothing starts while it plays.

**Refined after the user's scores of v0.0.4** (v0.0.5; the user, 2026-11-06: "slightly slower animations on getting in and out of rack"; `place.js`). `transMs(kind, upper, hurried)` gives `RISE_MS` 4,000, `RISE_UPPER_MS` 5,500, `DOWN_MS` 4,000, `DOWN_UPPER_MS` 5,500 and `SIT_MS` 1,800 at the alarm's tempo (the klaxon, a training sol's reveille), and `UNHURRIED_K` 1.2 times those to the tick otherwise (4,800, 6,600 and 2,150 ms: the weekend's reveille, the stand-down, going to bed, getting up after a nap; my call); `STEP_IN_MS` 400 either way. The player's tempo comes from `hurriedAt(state, ms)`: a drill open, or reveille to the 05:40 muster on a training sol; the squad's is set per call. `RISE_KEYS` (0.35, 0.55, 0.8) now apply to an upper berth only: sitting up 1.9 s, on the edge 1.1 s, the climb 1.4 s, standing 1.1 s. **A lower berth's 1.55 m to its foot is walked, not slid** (my call): `LOWER_KEYS` { sitUp 0.35, sit 0.5, stand 0.62 }, then a `walk` frame to the foot, `poseAt` giving `walkM` (the metres walked) and `figureOf` gait `walk` with that stride, at 1.02 m/s (0.85 when nothing hurries), where v0.0.4 slid it in `standUp` at 3.1 m/s; from a lower berth: sitting up 1.4 s, on the edge 0.6 s, standing 0.5 s, then the steps; lying down plays it backwards. `poseAt`'s `sitUp` and `lieDown` frames give `upK` (how far sat up) and `edgeX`, `edgeZ` (the berth's edge), from which the view draws the sitter moving to the edge (VIEWS §3.4). **The call delays are by call**: `CALL_DELAY_MS` alert [1,000, 10,000], reveille and the stand-down [2,000, 20,000]; `callDelay(pid, cause, atMs, seed)` = least + `hashInt(most − least + 1, 'call', seed, pid, cause, atMs)`, drawn for each call from the world's seed and its moment (my call: v0.0.4 drew it from the marine alone, so the same marine rose first every night of every career, and after the user's drill score of 60: in v0.0.4 a quick T, T caught 2 of the 12 rising in lived time, the rest inside the dressing splash). **The player's own lie-down** (TIME §8): `lieActor(state, a, seatId, ms)` lies you down in sight before a sleep, and `backActor(state, a, ms)` takes it back while it plays, a rise of the same length from the frame shown. Measured (`time-placement`): at the klaxon at seed 48213 the twelve are up 6.2 to 15.3 s after it, all in utilities by 02:32:51; watched through the drill from the aisle, 153 changes seen, the largest step between two ticks 0.088 m, 0 pops. Played by the keys at 16 px/m, 7 of the 12 are seen rising before a quick dressing splash at seed 48213, 8 at the user's seed 2513373485. Not seen yet in `test-night`: the squad lying down after the stand-down, since they undress for 4.4 minutes at TIME §8.2's normal tempo first and the end card comes 6 s after the stand-down.

### 4.7 Embarked and deployed

- **Troopship** (PLACES.md's deck programs, TIME.md's voyage): a UTC day in the garrison sol's shape, its times those of TIME §9.2's shipboard Plan of the Day (CONTRACTS §4's "Aboard ship" row), never restated here; PT by platoon in shifts in the gym deck or the passageways; chow in three sittings of 30 min; classes in berthing; weapons and suit maintenance; lock drills; the `maintenance` block is field day every day aboard (a ship is cleaned daily, my call; TIME §9.2 and CONTRACTS §4 name it, and give the block's time); plus the ship's drills (general quarters, secure for burn, abandon ship). Navy crew stand three 8-hour watches (longhaul `js/sim/duty.js` `scheduleBlock`, lines 70–74: "eight on, eight off, eight asleep"). Berthing may be hot-racked (two sleepers per rack across watches); if so, the booking rule (§6.4) shares a rack between two people with disjoint sleep blocks. Under thrust above 1.5 G everyone is in a couch (§6.8; longhaul's line, the user 2026-03-27: "velocity kill at 1.5G (juice threshold)").
- **Europa** (milestone 0.3): a UTC day; the platoon rotates its three squads through **patrol** (8 h), **checkpoint and guard** (8 h) and **rest and quick-reaction force** (8 h), shifting by one block each day; chow at the forward base's mess in windows; one rest day in seven; no liberty in town except escorted morale runs. The miners' shift changes at 06:00, 14:00 and 22:00 UTC drive the town's crowds (§12.4).

---

## 5. Needs, mood and morale

### 5.1 The same model, stored as times

NPCs run **BODY.md's need model**, not a copy of it: the same variables, thresholds and helpers. Tradecraft's "time since X" style (`src/sim/needs.js`) makes this cheap: a need is a function of when something last happened and what has happened since, so it can be read at any moment without integrating. Whatever event times BODY.md keys on for the player, an NPC's `needs` holds the same keys. On the live area, T1 to T3 get BODY.md's slow layer once a game minute (staggered by a hash of the id); the fast layer (bleeding, G-LOC, air) only when something calls for it.

### 5.2 Events implied by the schedule

Off the map, nobody eats or sleeps tick by tick: the schedule implies the events, and `needsAt(p, ms)` reads them.

- **Meals**: at each chow block they attend, they ate at block start + 5 to 20 min (hash). Mess duty eats at 04:30, 10:30 and 15:30. A duty NCO eats in a window at the mess. Someone on liberty eats in town.
- **Drink**: 0.5 L with each meal, 0.75 L over PT, 0.25 L an hour in training from the canteen (my calls; BODY.md's water balance decides what that means).
- **Sleep**: asleep at taps + an onset of 10 to 40 min (hash; +30 min for `night-owl`, + stress/5 min), awake at reveille, or around their watch. Naps on rest sols (30% of people, 60 min).
- **Washing**: a shower after PT on 80% of PT sols, and before bed for `clean-freak`; a shave in the morning hygiene block.
- **The head**: every 3 to 4 h awake. Not stored for T2 off the map; used only to place people.

When an NPC on the live area misses something (a working party ran through noon chow), that real hunger is written into their `needs` and holds until their next implied meal. Nobody's hunger freezes in their sleep (the user, tradecraft 2026-10-28: "when sleeping, the hunger meter is frozen that's a bug").

### 5.3 From need to urgency

The utility model needs a number from 0 to 1 per need. It comes from BODY.md's named stages: stage 0 is 0, stage 1 is 0.3, stage 2 is 0.55, stage 3 is 0.8, stage 4 and beyond is 1.0. The bladder is multiplied by 1.2 (it does not wait) and sleep by 1.5 at night.

### 5.4 Stress and morale

Both are BODY.md's (its §9: stress, the combat stress load, and morale on longhaul's `moraleTarget`), for the player and for everyone persistent alike. BODY.md's target formula has a slot for **PEOPLE.md's social term**, which is this:

```
socialTerm = tiesTerm + disciplineTerm + homeTerm + Σ social event mods
tiesTerm       = +2 * mean affinity over T1 ties with affinity >= 1 (cap +6), -2 per enemy (affinity <= -4, cap -6)
disciplineTerm = -6 while restricted; -2 on each sol of extra duty
homeTerm       = -3 for a `homesick` person in their first 60 sols away from home
```

Social event mods (fading on BODY.md's time constant): a death in the unit −25, scaled by the tie (a buddy −35, a friend −25, the squad −15, the company −8); office hours −10; a letter +4 and a care package +8 (×1.5 for `letter-writer`); liberty in town +6; a hail and farewell for a buddy leaving −5; a successful comfort +2 to +4 (§10.10). Promotion, pay and being passed over are CAREER.md's career term.

What this section does with morale: under 15, temptation ×3 (§6.5), which is where unauthorised absence comes from; NPC task times are divided by longhaul's `efficiency` (`js/sim/needs.js` lines 117–127) of their morale and needs; and the morale word (BODY.md's) shows in the mood word of a conversation (§10.3).

### 5.5 Hygiene and appearance, as others see them

BODY.md's hygiene stages are visible to others. At the "ripe" stage, anyone within 1.5 m for 10 s may bark about it ("Hit the shower. You smell like a reactor deck."), a weight-1 memory; at the next stage, bay-mates lose 1 affinity once a sol, and the squad leader orders a shower (§10.7). Appearance (shave, haircut, a squared-away uniform and boots, Mars dust on the uniform, the gig line) is computed on demand from the `appearance` and `needs` times and read by inspections (§11.10), which keep its upkeep to one activity and one laundry bag.

**As built in v0.0.6, the hair as others see it** (`src/sim/body/hair.js` `hairOf`, `squadHairH`; `src/sim/people/place.js`; the build sheet 0.0.6 §2.2, §8 item 23; the user, 2026-11-06: "we should have to groom our hair the same way we will have to groom our beards"). Everyone's hair grows and is read through one helper, `hairOf` (BODY §6): the player's from the body's ledger, everyone else's from the squad's closed form below. **A squadmate's drawn step** (`actor.hair`, 0 to 3) is written by `setPose` **only where the player cannot see** (`lookAt`'s rule), so a cut never happens in view; an actor without it draws the closed form's step until then, and the art paints a new sheet for a new step the next time he comes into view (VIEWS §3.4). The squad's hands read the template's (clean) until the needs (0.0.9).

---

## 6. Behaviour

### 6.1 The priority ladder

Longhaul's ladder (`js/sim/crew-ai.js` header lines 1–21 and `taskLevel`, lines 228–243), extended for a garrison and re-based from minutes to seconds. A task is replaced only by one of a higher rung (a lower number).

| Rung | Tasks | From |
|---|---|---|
| 0 | carried, restrained, unconscious, dead | BODY.md, COMBAT.md |
| 1 | survive: secure for burn, bad air (mask or suit), fire or breach escape, take cover from fire, flee lethal danger | PLACES.md environment, COMBAT.md |
| 2 | casualty response: aid someone down in sight, call the corpsman, carry (§6.7) | this section |
| 3 | orders and customs: a direct order, a summons, "attention on deck", colours, a salute, reporting; combat tasks | §6.6, §10.7, COMBAT.md |
| 4 | a duty post: fire watch, guard, duty desk, a mess-duty shift, a formation | the roster |
| 5 | urgent own needs: any urgency ≥ 0.9; illness or injury to sick call | BODY.md |
| 6 | the scheduled block's activity: training, chow block, maintenance, working party, field day | the Plan of the Day |
| 7 | errands and appointments: routine sick call, the barber, armoury turn-in, the PX, admin | |
| 8 | needs in free time: eat, drink, the head, a shower, a nap | |
| 9 | social: join friends, talk, cards, call home, liberty | |
| 10 | leisure: gym, reading, study, a screen, a walk, prayer | |
| 11 | idle: at their rack, wandering the area | |

- Rung 4 outranks rung 5, as a sentry's post outranks the sentry's bladder: at urgency 1.0 a sentry **calls for relief** (a shout, "Corporal of the Guard, post three!"), waits up to 10 min, and only then leaves the post (leaving one's post is a serious infraction, §11.3).
- Decisions happen once a second per person, staggered by a hash of the id, and at once on events: a sound they heard, a summons, a block boundary, an officer entering. Rungs 0 to 3 pre-empt at once. A pre-empted task is pushed on a stack of at most 2 and resumed if still valid.

### 6.2 Utility inside a rung

Where a rung offers choices (mostly rungs 7 to 11), each option scores:

```
U = W[option] * driver * traitK * socialPull * reach * noise
reach = 1 / (1 + travelS / 180)
noise = 0.85 + 0.3 * hashFloat(p.id, sol, hour, option)
keep the current task unless a new option scores > 1.3 x it (hysteresis), or the current one ends
```

| Option | Rung | W | Driver | Trait and tag mods | Where |
|---|---|---|---|---|---|
| eat | 8 | 1.0 | urgency(hunger) | | the mess in its hours; own snacks from the locker |
| drink | 8 | 1.0 | urgency(thirst) | | fountain, canteen |
| the head | 8 | 1.2 | urgency(bladder or bowel) | | nearest head |
| shower | 8 | 0.8 | urgency(hygiene), +0.3 after PT | `clean-freak` +0.3, `slob` −0.2 | the showers |
| nap | 8 | 0.6 | urgency(sleep) | | own rack (rest sols, free time) |
| join friends | 9 | 0.5 | max over friends present of affinity/5 | × (1 + 0.2 × social); `loner` ×0.5 | where the friend is |
| cards, the rec room | 9 | 0.35 | | `gambler` +0.4 | rec room |
| call home | 9 | 0.2 | sols since the last call / 7 | `homesick` +0.3, `letter-writer` +0.1 | comm booths |
| liberty | 9 | 0.5 | a rest sol or evening, with a pass | `party-animal` +0.5, `drinker` +0.3, `loner` −0.3 | Redwater |
| gym | 10 | 0.3 | 1 if no workout yet today (BODY.md's once-a-day rule) | `gym-rat` +0.5; +0.1 × drive | gym |
| read, study | 10 | 0.25 | ×2 within 14 sols of a promotion board | `bookish` +0.4 | rack, library |
| a screen | 10 | 0.3 | | | rec room |
| prayer | 10 | 0.1 | | `devout` +0.6 on the rest sol morning | chapel |
| square away (20 to 30 min, §11.10) | 10 | 0.2 | ×3 within 24 h of an inspection; ×2 at 3 sols since the last | +0.1 × drive; `squared-away` +0.4; `slob` −0.2 | wall locker |
| clean the weapon | 7 | 0.3 | WEAPONS.md's dirt | +0.1 × drive | armoury cleaning tables, in hours |
| barber | 7 | 0.1 | sols since haircut / 7, ×2 once due | | barber shop |
| PX | 7 | 0.2 | ×3 on pay day; out of supplies | | PX |
| idle | 11 | 0.05 | | | rack |

**The barber, as built in v0.0.6 in closed form** (`squadHairH(seed, pid, cut, ms, lonEDeg)`; the build sheet 0.0.6 §8 item 23, my call): until the needs run the barber's row above (0.0.9), each person keeps their cut on a cycle of 0.7, 0.8 or 0.9 of the cut's due period in whole sols, by `hash('barber', seed, pid)` (men 7, 8 or 9 sols; women's short 15 to 19, a bun or a braid 29 to 38), phased by hash, each cut at 12:00 local of its sol: never out of regulation (at most 90% of due over 30 sols), never seen being cut.

### 6.3 Tasks and steps

A task is a list of steps, as tradecraft's busy plans (`['go', x, z]`, `['wait', ticks, face, gait]`) and longhaul's tasks:

```json
{ "kind": "shower", "rung": 8, "target": "f:e1:head-2a:showers#3",
  "steps": [["go", 12.0, 4.5], ["queue", "f:e1:head-2a:showers"], ["use", "f:e1:head-2a:showers#3", 540000], ["go", 3.0, 4.0]],
  "booked": "f:e1:head-2a:showers#3", "startMs": 0, "untilMs": 0, "then": "dress" }
```

`use` durations come from TIME.md's activities table, varied by the person's hash. NPCs live their activities in real time on the map: you see Okonjo go into the showers and come out eight minutes later, towel round his neck.

### 6.4 Booked places and queues

Longhaul's rule (2026-10-24; `js/sim/crew-ai.js` `taken()`, and `js/sim/ship-layout.js` `tableSpots` lines 382–394 and `counterSpots` lines 341–364): every spot (a rack, a mess seat, a sink, a toilet, a shower stall, a gym station, a chair, a couch) is booked by exactly one person before they walk to it, and nobody shares a spot.

- Queues form on open floor in front of a fixture, two places per metre, first come first served. Give-up times (my calls): a toilet 10 min (then another head, or hold it while the urgency climbs); a shower 15 min; the mess line never within the chow block; a gym station 5 min, then another option.
- Racks and lockers are owned and never used by anyone else, except a shared hot rack (§4.7).
- **Mess seating**: a table scores Σ affinity toward those already seated, +1 for each squadmate, −3 for each enemy; staff NCOs sit at their own tables, officers in their own mess (PLACES.md). Juniors fill from the line in order. Who sits with whom at noon is how the player reads the platoon's friendships.
- **The player books too**: R on a fixture books it; if an NPC had booked it and was walking there, the NPC replans (and barks if it was theirs: "That's my rack, boot.").
- The reveille queue is real: a platoon's floor of 42 marines shares its heads (the counts are PLACES §4.4's: `head-2a` and `head-2b` hold 8 showers, 8 basins, 7 stalls and 2 urinals between them), which makes the hygiene window tight. A test prints the longest wait.

### 6.5 Temptation: the off-plan choices

Real units have real lapses, and the discipline system (§11) needs cases the player did not cause. At the start of each block of kind PT, training, working party, formation, maintenance or field day, each NPC draws from `stream('temptation', id, sol, block)`:

```
p = 0.001
  * (1 + 3 * urgency(sleep) + 2 * max(other urgencies))
  * (1 - 0.25 * rules) * (1 - 0.2 * drive)
  * (shammer ? 2 : 1) * (squared-away ? 0.3 : 1)
  * (morale < 30 ? 3 : 1)
capped at 0.05
```

The lapse is drawn by weight: late (60: arrives 1 to 10 min late), skating (15: stays in the rack or hides in the head through the block), uniform (15: wrong uniform, unshaven), asleep in class (10: class blocks only). On the map it is lived: the late marine runs in buttoning his blouse, and the platoon sergeant watches him come. Off the map it is an event resolved through detection (§11.4). On a liberty night each marine in town has `p = 0.01 × (drinker ? 3 : 1) × (1 − 0.2 × rules)` of an incident: late back (50), drunk and disorderly (30), a fight in town (15), other (5). Expected rates, which a test prints: about one lapse a sol across the company and two a week in the platoon.

### 6.6 Customs in motion

SETTING.md owns the customs; this is how people perform them and how the player is held to them.

- **Salutes**: outdoors, in uniform and covered, a junior who recognises an officer (rank read within 23 m, "thirty paces") salutes at 4.5 m ("six paces") or at the closest approach, and the officer returns it (1.5 s each). Not in formation (only the one in charge), not with both hands full, not in the field or a combat zone, not inside a ship; in a suit, the visor tap in its place (SETTING §5.8). NPCs do it among themselves, so the base looks like a base.
- **Attention on deck**: when an officer who is not part of the room's routine enters a squad bay, office or classroom, the first person to see them calls "Attention on deck!" (a sound, 25 m), and everyone stands at attention within 2 s until "Carry on" (said 2 to 5 s later unless the officer means to address the room).
- **Colours**: at 08:00 and at sunset (TIME.md and SETTING.md give the times), everyone outdoors in uniform stops, faces the flag or the music and salutes for the length of it (about 60 s); vehicles stop. Indoors, people carry on. For the player standing through it, colours runs in attend mode (§10.12): about 15 s of real time.
- **Making a hole**: in passageways and doorways juniors give way to seniors (a steering bias by grade).
- **Covers**: on at the door going out, off at the door coming in (an animation).
- **For the player**: the instinct's line prompts each of these (SKILLS.md hosts the line; "Officer, nine metres. Salute."), and T does it. Missing one in sight of the person owed, or of an NCO, is an on-the-spot correction (§11.5), never more on its own.
- **Customs become habits** (my call, after the critics: on a base of about 1,300 with several dozen officers, outdoor walks would become a string of T prompts). After **20 correct salutes in a row** in a context, the habit belongs to the body: when the salute rule above fires, the body salutes on its own (1.5 s, without breaking stride), after a **habit check**, d20 + 10 against DC 8 with BODY's named modifiers for fatigue and stress (SKILLS §5.4), rolled only when one of them applies. Rested, it never fails; tired (−2), 95%; exhausted and frayed (−4 and −2), 85%. A lapse (a failed check) is a missed salute and costs the usual correction from whoever saw it, and resets the streak; three lapses in 10 sols bring the prompts back until the next 20 in a row. The same rule covers standing at "attention on deck" and stopping for colours.
- **Contexts are kept apart**, so the prompt returns where the habit has not been learned: aboard ship (the quarterdeck and its own customs: saluting the colours as you come aboard, asking permission), at a new site, and for an officer in a uniform the character has not saluted three times before (a Navy officer's insignia, a UN observer's, an allied service's). The player's `habits.salute` holds the streak per site kind (`mars-base`, `ship`, `station`, `town`), the kinds owned and the uniforms seen (§2.3).

### 6.7 The rescue chain

Longhaul's rescue (`js/sim/crew-ai.js` `stepRescue`, lines 1180–1225: run to the patient, stabilise, carry to the autodoc) re-based to seconds and to a garrison:

1. Within 3 s of seeing someone collapse or get hurt (BODY.md's states), the first able witness within 25 m shouts "Corpsman!" or "Man down!" (a shout: 32 m at Melas, §7.3) and runs to them.
2. Up to two responders go hands-on, chosen by `−distance + 2 × Medicine`: they check, position and give first aid with BODY.md's actions, at their own Medicine skill and with their own kit (BODY.md and WEAPONS.md say what a marine carries).
3. The platoon's corpsman, if on the site, is summoned at rung 2, runs, and takes over on arrival.
4. In garrison one witness calls the duty desk or the medical line; an ambulance rover from the aid station arrives in 4 to 8 min on base (my call); corpsmen take the casualty to the aid station, where BODY.md's care decides what happens next.
5. Everyone else clears a 2 m ring (tradecraft `src/sim/onlookers.js` `CLEAR_M`), and the senior present takes charge (sends one to meet the ambulance at the door).

In the field, COMBAT.md owns the order of things (security first, then care).

### 6.8 Secure for burn, bad air

Aboard ship, longhaul's crew policy and couch planning port as they are: `planCouches` (`js/sim/crew-ai.js` lines 502–547) assigns couches to minimise the longest walk (a binary search over walk lengths with bipartite augmenting paths), and the secure policy's triggers (`js/sim/autopilot.js` `crewPolicy`, lines 620–648) become the ship's announcements. When "secure for burn" is passed, everyone walks to their planned couch and straps in (BODY.md and PLACES.md give the times), and stays until "secure from burn". The **bad-air reflex** (`crew-ai.js` lines 742–751) is rung 1: an unsuited person in bad air (PLACES.md's atmosphere status) goes to the nearest mask or suit locker, and nobody unsuited paths through bad air.

### 6.9 Movement and getting unstuck

- On the map people move at BODY.md's locomotion speeds for their gravity and gait, on PLACES.md's nav grid (A* with a binary heap, free grids cached per area, and flow fields kept for each area's six busiest destinations: the mess door, the bay, the head, the formation spot, the armoury window, the exit). Path requests go into TECH's queue (§13.2), persistent people before the crowd; the flow fields serve most crowd trips with no solve at all.
- **In three dimensions.** Jumps, falls, ladders and low-g bounds (BODY §16.4 to §16.7) move an actor's `y` and `vy` along a step's arc; the grid route is unchanged, and a bound changes direction only on landing (BODY §16.7).
- **In free fall** (from 0.2) NPCs do not walk the nav grid: they route on PLACES's **handhold graph**, which I ask PLACES to specify before 0.2 (§20): nodes on handholds, rails, mag strips and planting spots; edges as push-offs with a clear line between their ends (§7.6's primitive, at body width), each with its length and a speed (0.5, 1.5 or 3 m/s, COMBAT §14.5), plus hand-over-hand edges along rails at 1.0 m/s (BODY §16.4). A task's steps become `['push', node, speedMs]`, `['grab', node]`, `['hand', node]` and `['plant', node]`, resolved by BODY §16.6's push-off and grab rolls at the person's Zero-g (SKILLS), with `anchor` set at each end. Routes follow COMBAT §14.5's doctrine (handhold to handhold along the walls; across the open middle only when that halves the route, my call). COMBAT's zero-g fighter plans on the same graph, and ROADMAP's `floater` bot walks every edge of it on every deck.
- People do not collide with each other (tradecraft: "a crowd would trap the player"); they steer, with 0.6 m of personal space (0.8 m in a crowd) and the rank bias above.
- Unsticking (tradecraft `staffing.js` `unstick()`, hardened): replan after 2 s with less than 5 cm of progress; after 6 s, side-step to the nearest free cell within 1 m; after 20 s, if out of the player's view, move to the next waypoint; if in view, wait and log it (debug). **Nobody is ever moved in view** (DESIGN.md, pillar 6). Every destination a generator places must be reachable: PLACES.md's tests prove it and mine count stuck events (zero is the pass).

---

## 7. Perception

### 7.1 The ported model

Tradecraft's `src/sim/perception.js` (265 lines), with its constants:

- a view cone of 100° + 2° per point of Awareness, at most 170°;
- an all-round awareness radius of 2.5 m + 0.2 m per point, with a 1.5 m soft edge, and anyone within 1 m always perceived;
- sight range `min(10 m + 42 m × light, environment cap)`: 52 m in full light, about 15 m in the dark; PLACES.md gives the light at a spot and the caps (smoke, the Mars dust: tradecraft's dust levels cap sight at 40, 24 and 14 m);
- soft visibility from 0 to 1 (`openness()`, lines 149–158), with the rules' threshold `SEEN = 0.5`;
- line of sight blocked by walls, closed doors and tall fixtures, through the one visibility primitive of §7.6 (not tradecraft's rays against binned wall segments, which stay for shots and cover only); windows block sound but not sight; people do not block sight.

**The same primitive draws the player's fog (VIEWS.md) and decides who witnessed what** (§7.6). NPC perception is computed on demand and in a once-a-second pass per person (staggered); the player's every tick.

**As built in v0.0.5: the reach reads the adapted eye** (BODY §23.4; the user's ask of 2026-11-06). It is `SIGHT_M` 10 × min(1, lightK) + `LIGHT_M` 42 × min(1, L × lightK), with `lightK` from BODY's eyes (`eyeView`, through `eyeViewOf`, §7.6): 1 at rest in any lit place and five minutes into the dark, which is v0.0.4's 10 + 42 × light. In the bay at lights out: 3.3 m just in from the lit head, 5.6 at a minute, 11.7 at five, 14.9 at twenty, 17.6 m fully adapted or woken from sleep (`eyes-sight` prints them).

**As built in v0.0.7: the firing line** (§7.2's table). On the KD course the player's eye also takes in a band along the firing line (`lineBandOf`: 12 m either way, 2.5 m either side, a 0.75 m soft edge), whatever the cone and the all-round radius say. The reach itself still ends about 54 m out; a face at 300 m is the far window's, which has its own open-air law (VIEWS §2.4).

### 7.2 What OLYMPUS changes

| Condition | Effect (my calls) |
|---|---|
| sealed helmet | cone ×0.8; awareness radius −1.5 m (muffled) |
| vacuum | awareness radius 0.5 m (touch); hearing only through the suit radio (§7.3) |
| night-vision optics (WEAPONS.md) | light counts as 0.7 where it is below; cone 40°; the eyes' adaptation not read while worn (`body.eyes.nv`, BODY §23.4) |
| exhausted (BODY.md's stage) | awareness radius −0.5 m |
| stress frayed (BODY.md) | cone −10° (tunnel vision) |
| asleep | nothing but hearing, with thresholds ×0.3 (a shout wakes, footsteps do not) |
| lying awake in a berth (built in v0.0.4, the player only) | sees from the berth: the eye looks out along its facing past the rack's own cells, at most `BERTH_LOOK_M` 2 m (§7.6) |
| just in from a lit place, or dark-adapted (built in v0.0.5) | the light as the eye takes it (BODY §23.4's eyes, §7.1): the reach falls just in from a lit place and grows over half an hour in the dark. In a glare (the lights on, a lit door) the reach is the lit field's at rest (my call: no blind second for unseen-only changes to use) |
| on the KD course's firing line (built in v0.0.7, the player only) | the firing line is taken in: a band `LINE_AWARE_M` 12 m either way along the line and `LINE_DEPTH_M` 2.5 m either side of it, with a soft edge of `LINE_SOFT_M` 0.75 m (`perception.js` `lineBandOf`), so the relay prone 5 m either side, outside the cone and the 3.5 m round a prone eye, is drawn as it is and never as figures remembered in the fog. It holds past the course's end to the card. Only on `test-range`'s KD course (`armoury.range.course` 'kd'): test-handling's bay, the user's scored scene, is unchanged (my call, the integrator's; DESIGN.md's log, 2026-11-07) |

As built in v0.0.4 the player is asleep only when the body sleeps (BODY's `isAsleep`; the build sheet's §8 item 22), so a player lying awake sees; everyone else's sleep is still read from their posture (they lie only in their racks after taps).

### 7.3 Hearing

New in OLYMPUS. A sound is an event `{ kind, x, z, area, loudnessM, atMs }`, where `loudnessM` is its audible radius at the Mariner Valley's 66 kPa:

| Sound | loudnessM | Sound | loudnessM |
|---|---|---|---|
| footsteps, walking | 4 | a door or hatch | 12 |
| footsteps, running | 10 | an airlock cycling | 20 |
| a low-g bound landing | 6 | a dropped rifle | 15 |
| talk | 8 | "Attention on deck!" | 25 |
| a raised voice, an order (COMBAT §8.1's `VOICE_M`) | 20 | a gunshot outdoors (unsuppressed) | 1,500 |
| a shout (COMBAT's 1.6 × the raised voice) | 32 | a gunshot indoors | the whole area |
| a suppressed shot | 60 | an alarm, the public address | the whole site or area |
| an explosion outdoors | 4,000 | | |

**One air law for every sound** (my call, after the critics found three: this section's square root, VIEWS §11.2's −20 dB per decade of pressure and WEAPONS §7.12's linear scale). `people/hearing.js` exports the helpers, and every section that scales a sound by the air calls them:

```
AIR_REF_KPA = 101.3                       // Earth sea level, and ship air
AIR_MIN_KPA = 0.1                         // below this, nothing carries through the air
airK(pKpa)  = pKpa < AIR_MIN_KPA ? 0 : sqrt(pKpa / AIR_REF_KPA)        // the audible radius's factor
airDb(pKpa) = pKpa < AIR_MIN_KPA ? -Infinity : 10 * log10(pKpa / AIR_REF_KPA)   // the same law in dB: 20 log10(airK)
audibleM(kind, pKpa) = LOUD_M[kind] * airK(pKpa) / airK(66)          // the table above is given at Melas's 66 kPa
```

| Air | P (kPa) | `airK` | `airDb` | a shout carries |
|---|---|---|---|---|
| Earth sea level, ship air | 101.3 | 1.00 | 0 dB | 40 m |
| the Mariner Valley floor | 66 | 0.81 | −1.9 dB | 32 m |
| datum | 52 | 0.72 | −2.9 dB | 28 m |
| highlands | 40 | 0.63 | −4.0 dB | 25 m |
| outside the Tharsis domes | 31 | 0.55 | −5.1 dB | 22 m |
| Olympus Mons summit | 17 | 0.41 | −7.8 dB | 16 m |
| Mars before the terraforming | 0.6 | 0.08 | −22 dB | 3 m |
| vacuum | under 0.1 | 0 | silent | |

The square root is about 10 dB quieter for each tenfold drop in pressure, in line with the microphones on Mars in the 2020s, which heard sound about 20 dB weaker at 0.6 kPa than on Earth (Maurice et al. 2022, Nature; −22 dB here). The exponent is my fit, bent for play. I moved the cut-off from 1 kPa to 0.1 kPa so that the measurement the law is fitted to is not silent in the game (my call). In other sections: COMBAT §6's `HEAR_M = 70 × loud × √(P / 101.3)` and §8.1's `VOICE_M = 25 × √(P / 101.3)` are already this law (`× airK(P)`); WEAPONS §7.12's heard radius `× pKpa / 101.3` becomes `× airK(pKpa)` (Mars' valley ×0.81, not ×0.65); VIEWS §11.2's audio gain `20 log₁₀(P / 101.3)` becomes `airDb(P)` (Melas −1.9 dB, not −3.7), and VIEWS keeps its own low-pass, which models absorption, not loudness; WEAPONS §12.5's G-11 stun heard at a distance is −1.9 dB on Mars, not 4 dB. **Blast injury is the one exception**: overpressure and impulse scale by Sachs' law (WEAPONS §12.4; about −1 dB at 1 m on the valley floor), because a shock wave is not a sound heard. The owners align their text (§20).

Through a closed door ×0.4, through a bulkhead ×0.15, and only into adjacent rooms. In vacuum a suited body touching the same hull hears impacts within 5 m. What you hear but cannot see gets a marker at the screen's edge (the user, tradecraft 2026-11-04: "who shouts to drop it ? I don't see any police near me"; VIEWS.md draws it).

A hearer knows **where**, not who, unless they know the voice (a squadmate's shout is identified). They turn their head toward it, and above a weight (a shout, a shot, a fall) they go to see.

### 7.4 Awareness states and witnessing

Per observer and target: `unaware`, `heard` (a location), `glimpsed` (visibility 0.25 to 0.5), `seen` (0.5 or more), `identified` (seen within identification range: 15 m in full light, 5 m in the dark, or a known voice). A witness who saw but did not identify records the event with the subject as a description from the look ("a marine in PT gear"), which gossip may later attach to the wrong person (§9.4). VIEWS.md shows "?" and "!" over an NPC's head as their awareness of you changes, and only while you can see them.

### 7.5 Weapons in view

An NPC who sees you within 15 m knows your weapon's visible state (in hand, slung, holstered) and its muzzle direction. Standing in your muzzle's cone (WEAPONS.md sets the cone) for 0.3 s or more is being **flagged**: a weight-1 event, fear +1 for them, a bark ("Watch your muzzle!"), and from an NCO an on-the-spot correction or corrective training (§11). NPCs flag each other too, rarely, by their weapons skill (WEAPONS.md).

### 7.6 One visibility primitive

"One function" has to be one algorithm, or the fog shows the player things the dice say the character did not see (the user, tradecraft 2026-10-28: "what we see is what our character evaluates as being true"). TECH §9.11 drew the fog by shadowcasting over 0.5 m cells while this section cast tradecraft's rays against wall segments binned every 8 m; the two disagree at corners and doorways, and VIEWS §14's `fog` test ("identical sets") could not pass. So (my call, after the critics):

- **The sight grid.** PLACES rasterises each area's walls, closed doors and leaves, and fixtures into a grid of 0.25 m cells (VIEWS's `FOG_CELL_M`; 0.5 m as first written and first built, below), built with the area or, on grounds and habs, with each chunk (I ask PLACES for it, §20). A cell holds three bits: it blocks a **prone** eye (anything 0.3 m tall or more: a sandbag row, a crate), a **crouched** eye (1.0 m: a berm, a counter, two crates stacked) or a **standing** eye (1.6 m: walls, lockers, full-height racks, buildings). Eye heights are PLACES §2.4's (1.6, 1.0, 0.3 m) plus the actor's `y`. Windows, fences, gratings and people block nothing. A door's leaf re-marks its cells when it moves, as the nav grid does.
- **The predicate.** `clearLine(grid, a, b, layer)`: the segment between the centres of cells `a` and `b` is clear if it passes through no cell blocking that layer. A segment through the shared corner of two blocking cells set diagonally is blocked (no seeing through a diagonal crack); one that only touches a single blocking cell's corner is not (my call). The traversal visits the same cells from either end, so `clearLine(a, b) = clearLine(b, a)`. The layer is the observer's eye posture.
- **The player's mask.** The sim computes the player's visibility mask in TECH's `look` step: symmetric shadowcasting from the eye cell over the fog window (VIEWS's 192 × 128 cells), written to give exactly `clearLine` for every cell, then the cone, the reach and the light of §7.1 and §7.2. It is recomputed when the eyes move 0.25 m, turn 3° or change posture, when a door within reach moves, and once a game second for the light (TECH §9.11's triggers). The player's sightings read the mask; `render/fogcast.js` draws the same mask, adding only its easing and dither, and computes nothing of its own (a change to TECH §9.11 step 9, §20). The far window's cells (TECH §9.9) are `clearLine` from the eye, computed when it opens or moves.
- **NPC sightings** use `clearLine` between the eye cells of observer and target on the same grid, in the staggered once-a-second pass and on events. Beyond the built chunks (a sighting at 300 m on the range), the line walks PLACES's static index rasterised into the same 0.25 m cells along the line on demand, so the rule is the same at any range.
- **What a body shows** behind a low object is cover, not sight: the line of sight decides whether the cell is in view, and COMBAT's cover share (`keeps`, from its segment rays) scales the target's visibility (`openness()`), so a man prone behind a berm stands in a lit cell and stays unseen. That is consistent with the picture, because VIEWS draws only the people the character perceives.
- **Segment rays** against walls binned every 8 m (PLACES §2.4, tradecraft's `WALL_BIN_M`) stay for what needs sub-cell precision and nothing else: shots, fragments, ricochets and cover shares (WEAPONS, COMBAT).
- **As built in v0.0.3** (`src/sim/places/sight.js`, PLACES's; `src/sim/people/perception.js`; my calls unless marked). The grid is on **0.25 m cells** (`SIGHT_CELL_M`, the nav's lattice), not 0.5 m: no walker's centre, C0 0.27 m from a face, is ever in a wall's cell, where at 0.5 m an eye pressed to a wall sat in the wall's cell and saw 250 cells of the next bay through it (the review). A cell is marked when a blocker overlaps its interior by more than 1 mm, so a 0.16 m wall never leaks. **Racks do not block a standing eye** (`sightH` 1.0 m for `rack2` and `rack1`; this list's "full-height racks" are `rack3` and the berth couches), lockers do. **A line's two end cells never block it**, so a wall's face lights when seen and a body in a rack is seen from the aisle. A floor's grid covers the area and is cached; a ground's is a window `SIGHT_WINDOW_M` 192 m wide, held so the eye stays `SIGHT_EDGE_M` 56 m from its edge, past `SIGHT_REACH_M` 54 m (10 + 42 + 2), built by chunks with only the window's chunks kept (32 KB each), so what hides what never depends on where the window was last built. The player's mask is computed by the stage calling `sightMask` over the fog's 192 × 128 cells (VIEWS §2.11), not by the sim's `look` step, until sightings need it (0.0.10); `render-fog` proves it equal to `visibility` cell for cell. Eye heights: standing 1.6, sitting 1.0, lying 0.3 m; a lying person is asleep this round (they lie only in their racks after taps) and sees nothing (§7.2). **From v0.0.4 the player sees from the berth unless the body sleeps**, and since a rack is a blocker on the low layers (its cells hold PRONE and CROUCH, its footlocker PRONE), a lying eye would see only its own cell: so a lying, awake player's eye looks out of the berth along its facing, through the run of cells that block its layer, onto the last of them (an end cell, which never blocks), at most `BERTH_LOOK_M` 2 m (`perception.js`; the integrator's call, after the stage's report that, woken by the klaxon in a lower berth, the player saw 12 of the 13 rise unseen and drawn as last seen). From rack n1's lower berth 3 of the 12 are seen getting up within 25 s of the klaxon, the rest as you rise and turn. The player's Awareness is `PLAYER_AWARENESS` 5 until SKILLS (a cone of 110° and all round within 3.5 m), and every other marine's `MARINE_AWARENESS` 5.
- **As built in v0.0.5: the eyes' field and the pose shown** (`perception.js`; BODY §23.4). `fieldOf(state, eye, ms, shut)`: the light the eyes receive is the mean luminance over the eye's spot (weight 2) and 15 points at 1, 2.5 and 4.5 m, at 0, ±0.3 and ±0.9 rad off the heading, each counted only where the eye has a clear line to it; its sky flag comes from places' `spectrumAt` (no room, or windows that can beat the fill: TECH §9.6). `eyeViewOf(state, actor)` is the picture's way in, so the stage and the reach read one number. NPCs are computed when read, at rest in the light they stand in. **The player's eye through a transition is the pose shown** (`poseShown` over §4.6's `poseAt`): lying in the berth for the `lie`, `sitUp` and `lieDown` frames, sitting for `sit`, standing elsewhere; the first build closed the fog to the berth's view 0.4 s after R, with you still standing at the rack's foot, and opened it the instant T was pressed. A lying or sitting player's eye looks out of the rack (`lookOut`), and **within `ALWAYS_M` of the body's own spot, what a standing eye there has a clear line to is seen, so your own berth is never in the fog** (the review of 0.0.5, my call: with the eye looking out past the rack's foot, you and your berth had been in the fog, at v0.0.4's klaxon too, so you could not watch yourself get up). Bay-2-1 at the klaxon: 207 cells in sight lying or sitting up, 282 on the edge, 785 standing.
- **The test** (`fog`, VIEWS §14, and `people.sight.test.mjs`): on 200 seeded scenes (squad bays, a troop deck, doorways, corners, a range), the shadowcast mask against `clearLine` for every cell; the player's sightings against the mask; `clearLine(a, b)` against `clearLine(b, a)` for 10,000 random pairs. All three are identical sets. It prints the cells compared, the mismatches (0) and the shadowcast's cost per recompute.
- **Close quarters** (COMBAT §25.4): the player's contact detector runs in `look` on the sightings once they are in the sim (0.0.10), starting a take-in on the tick a person first crosses `SEEN`; before then `test-pairs` calls `sightOf` on its few targets directly. The sheet's Awareness replaces `PLAYER_AWARENESS` 5 with it. `state.mind.contact` (the pending take-in, the last contact) is this section's key and COMBAT's meaning, written and read through `noteContact` and `contactOf` beside `noteThreat` and `threatOf` (§8.8).

---

## 8. Relationships

### 8.1 Gauges toward you

Tradecraft's three gauges (`src/sim/people.js` lines 19–45), as DESIGN.md settles: **fear** (how wary they are of crossing you), **trust** (whether they believe you and do what you say; in a unit this is also whether they rate you as a marine), **affinity** (whether they like you), each an integer from −5 to +5, moved ±1 by a notable exchange and ±2 or ±3 by a big moment. There is no fourth gauge (DESIGN.md settles three): respect is trust.

One change (my call): people who live with you drift back toward their **baseline** (`gauges.base`, their compatibility with you), not toward 0, one step every 14 sols without a notable exchange; T3 and T4 drift toward 0 every 7 sols, as in tradecraft. Talk keeps a tie alive: someone you have talked with in the last 14 sols (`gauges.talkedMs`) does not drift. `forgiving` doubles the drift of negative gauges, `grudge-holder` halves it.

### 8.2 Ties between NPCs

The same three gauges, stored sparse as `ties[otherId] = [fear, trust, affinity, metMs, tag]`: every T1 to every T1 and to their platoon (about 950 pairs for a platoon), each T2 to their own squad and chain (12 to 16 each), T3 to a handful. A pair that is not stored reads its baseline (§3.10). Ties change through the exchange table (§8.4, which applies between NPCs too), through **shared hardship** (fire-team mates +0.25 affinity a sol in the field or on deployment), through **contact** (friends +0.05 affinity per contact hour, at most +1 per 30 sols) and through **gossip** (hearing a weight-3 negative story about someone: −0.5 affinity toward them).

### 8.3 Tags from gauges

| Tag | Condition | What it does |
|---|---|---|
| buddy | affinity ≥ 4 and trust ≥ 3 | seats together, liberty together, comfort, grief at a death |
| friend | affinity ≥ 2 and trust ≥ 1 | social pull, gossip shared freely |
| rival | affinity ≤ −2, fear ≤ 1, same rank band | competes for billets and boards; barbs |
| enemy | affinity ≤ −4 | avoidance, confrontations, fights at a small rate |
| afraid of | fear ≥ 3 | avoidance; obeys; may report out of fear |
| mentor | senior, affinity ≥ 2, trust ≥ 3 | instruction hours (SKILLS.md), looks out for them |

### 8.4 What moves the gauges

Deltas are (fear / trust / affinity). Fractions accumulate in `acc` and make a whole step at ±1 (my call: gauges stay whole numbers, as in tradecraft). Witnesses who saw take the deltas listed; those who only heard or were told take half, and only for events of weight 2 or more. **Repeats** (my call): the same kind of exchange between the same pair moves the gauges at most once in 7 sols, and gifts and loans (food, a care package, money, gear) once in 14, so a deed done daily for its points becomes a habit nobody counts. Shared time with the player and the limits on talk are in §10.4.

| Exchange | Toward the actor, from the one affected | From witnesses | Weight |
|---|---|---|---|
| helps with a task (carrying, a fix, field day) | 0 / +1 / +1 | 0 / 0 / +0.5 | 1 |
| shares food, a care package | 0 / 0 / +1 | | 1 |
| lends money or gear | 0 / +1 / +1, and a marker | | 1 |
| takes their duty in a swap they asked for | 0 / +1 / +1, and a marker | | 2 |
| covers for them with an NCO | 0 / +2 / +2, and a marker | if found, the NCO 0 / −2 / 0 | 2 |
| reports them | +1 / −1 / −3 | their friends 0 / −1 / −1; NCOs 0 / +1 / 0; peers 0 / −1 / −1 | 3 |
| apologises for something done | restores half the affinity lost, if trust ≥ −1 | | 1 |
| beats them in a combatives bout | +1 / +1 / 0 | 0 / +1 / 0 | 1 |
| causes a failed inspection the squad pays for | 0 / −1 / −1 from each squadmate | | 2 |
| negligent discharge | +1 / −2 / 0 from everyone present | | 3 |
| flags someone with a muzzle | +1 / −1 / −1 | 0 / −0.5 / 0 | 1 |
| shoots expert at qualification | 0 / +1 / 0 | the chain 0 / +1 / 0 | 2 |
| drops out of a run | 0 / −1 / 0 | | 2 |
| saves a life | 0 / +3 / +2 | 0 / +2 / +1 | 5 |
| freezes or fails under fire | 0 / −2 / 0 | 0 / −2 / 0 | 4 |
| starts a fight | +2 / −1 / −2 | 0 / −1 / −1 | 3 |
| talks back to an NCO | the NCO 0 / −2 / −1 | peers 0 / 0 / +1 if the NCO is disliked | 2 |
| comforts them, successfully | 0 / +1 / +1 | | 2 |
| a joke lands / falls flat | 0 / 0 / +0.5 // 0 / 0 / −1 | +0.25 / 0 | 0 / 1 |
| a lie is caught | 0 / −2 / −1 | | 2 |
| keeps a confidence / breaks one | 0 / +1 / 0 // 0 / −2 / −2 | | 1 / 2 |
| steals, and it is known | 0 / −3 / −3 | everyone 0 / −2 / 0 | 4 |
| hazes someone | +2 / −1 / −2 | `protective` witnesses 0 / 0 / −2 | 3 |
| stands up for someone | 0 / +2 / +2; the bully +1 / 0 / −2 | 0 / +1 / +1 | 3 |
| misses a salute | the officer 0 / −0.5 / 0 | | 1 |

### 8.5 What the gauges do

- **Checks**: the relevant gauge is a named modifier (tradecraft's rule): charm adds affinity, convincing and asking add trust, intimidation adds fear, and negative trust adds to the other side when you lie (§10.5).
- **Behaviour**: seating, who helps unasked (affinity ≥ 3: 10% at each chance to help), who reports whom (§11.4), who backs whom in a hard talk (§10.11), who comes to your rack to talk before taps.
- **Combat**: COMBAT.md reads trust toward a leader and the squad's cohesion (§8.7).
- **Hostility**: affinity ≤ −4 with temper ≥ 2 gives a 2% chance per hour of shared free time of a confrontation, and a 0.5% chance of a fight (my calls).

### 8.6 Markers and debts

`owes[personId]` counts favours (tradecraft's hooks turned into a unit's currency). A marker is gained through the table above and **spent** in one of two ways: it halves the DC of one ask or approach toward that person (tradecraft: "a hook isn't an approach of its own: it's spent on one"), or it is called in, and they do something they would otherwise refuse, within reason. Money loans (`loans`: `{ to, amountMCR, dueMs }`) left unpaid past due cost the debtor 1 affinity every 10 sols and may start the money-trouble arc.

### 8.7 Cohesion

`cohesion(squad) = clamp(0.5 + mean over pairs (trust + affinity) / 20, 0, 1)`, pairs including the player. COMBAT.md reads it for suppression and casualty response; morale reads the ties term (§5.4).

### 8.8 What the player can know

Never numbers. Names come from an introduction or a name tape read within 3 m; ranks from insignia (SETTING.md and VIEWS.md). How someone feels about you is SKILLS.md's reading-people check applied to the gauges: the shown word is the true band shifted by an error drawn per person and week (σ = max(0.4, 2.5 − Social/10) bands), with a confidence ("sure", "thinking so", "guessing"), tradecraft's `src/sim/belief.js` pattern. The People leaf of the mind (VIEWS.md) shows where and when you last saw someone, their duties as you know them, what you have heard about them and from whom, and their arcs as far as you know them.

**The mind in the state** (my call, closing a finding that COMBAT wrote into this section's key directly). `state.mind` is PEOPLE's (CONTRACTS §9, TECH §6.1): the player's knowledge, as sub-records each with an author section, `seen`, `felt` and `heard` (this section), `known` (SKILLS §15.3), `map` (PLACES) and `threat` (COMBAT §6.1). The author sets what its sub-record means and holds; every write and read goes through `people/mind.js`, so the shape has one owner: `noteMind(state, part, rec)` and `mindOf(state, part)`, with the named helpers the authors call (`noteThreat(state, why, atMs, whoId)` and `threatOf(state)` for COMBAT's record). Like the rest of the mind, it is saved, and it holds only what the character could know.

---

## 9. Memory and gossip

### 9.1 Weight, fading, capacity

Each event kind has a base weight (in the events catalogue below), +1 for a knower who is involved or whose buddy is. Effective weight fades: `wEff = w × 0.5^(age / half)`, with `half` = 7 sols at weight 1, 20 at 2, 60 at 3, 200 at 4, and never at 5. A memory under 0.3 is forgotten, except by the subject and object of weight 4 and 5. Capacity: 32 memories for T1, 8 for T2 and T3; when full, the weakest goes.

| Event kind | w | Event kind | w |
|---|---|---|---|
| snoring, a quirk noticed | 1 | a fight | 3 |
| a joke, a bark of note | 1 | a failed bay inspection | 3 |
| late to formation, corrective training | 2 | office hours (NJP) | 4 |
| a muzzle flagged | 2 | someone hurt in training | 4 |
| a dropped run, a failed PT test | 2 | a theft | 4 |
| expert at qualification | 2 | a Dear John breakdown in the bay | 3 |
| a negligent discharge | 3 | a court-martial | 5 |
| standing up to a bully | 3 | a death | 5 |
| reporting someone | 3 | a life saved | 5 |

### 9.2 Witnessing

At the event, each T1 to T3 person in the area who perceives it (§7.4) gets an entry: `saw` (identified or as a description) or `heard` (a place and a kind, no subject unless the voice was known). Crowd witnesses are a count on the event (`crowdWitnesses`, which drives a district's mood on Europa, §12.4), and for events of weight 4 or more involving you, up to 3 of them are promoted to T3.

### 9.3 Gossip on the map

People in a social or idle state within 2.5 m of each other are in contact. Each minute of contact, the teller tells the listener one memory with probability

```
pHour = 0.3 * (wEff / 5)^2 * novelty * tellK * trustK      (per contact hour)
pMin  = 1 - (1 - pHour)^(1/60)
novelty = 0.5^(age / novelHalf), novelHalf = 1, 2, 4, 8, 16 sols for weights 1 to 5
tellK = (1 + 0.15 * social) * (gossip ? 2 : 1) * (discreet ? 0.3 : 1)
trustK = 1 if the teller's trust toward the listener >= 0, else 0.3
```

The memory told is the one with the highest **juiciness** the listener does not already hold: `wEff × novelty × (1.5 if the listener knows the subject) × (2 if the subject is a superior) × (1.5 if the subject is the player and the listener is T1)`. Things told in confidence (tag `secret`) are told at ×0.1, unless the teller's affinity toward the subject is −2 or less; a broken confidence that comes out is its own event. Within the player's earshot a tell plays as a bark exchange in balloons (§10.8).

### 9.4 Distortion

Each tell is distorted with probability 0.08 (`gossip` ×2, `straight-shooter` ×0.5). Of distortions: 50% **exaggerate** (the listener's weight +1, at most 5, and a bigger phrasing: "he put a round over the Gunny's head"); 20% **misattribute** (to someone of the same squad who was present, or who matches a description that was never identified); 30% **embellish** (a false fact flag: "in front of the CO"). The event keeps the truth; the listener's entry keeps its distortion code. A knower who `saw` it tells the true version, so the truth competes with the rumour.

### 9.5 Off the map, by the sol

At each local day's start (the `local@00:00` pass, TIME §11.3; CONTRACTS §5), for each happening with novelty above 0.05 and each person in the company who does not know it:

```
miss = product over knowers j of (1 - p(wEff_j, novelty))^contactHours(i, j)
knows if hashFloat(eventId, i, sol) < 1 - miss
contactHours per sol: same fire team 6, same squad 2, same platoon 0.5, same company 0.04;
                      x2 on liberty together, x1.5 for buddies, x0.2 for enemies
```

Measured in a scratch run of this model (3 witnesses in one fire team, 200 seeds; the test reproduces it within 10 points):

| Weight | After 1 sol (squad / platoon / company) | After 3 sols | After 7 sols |
|---|---|---|---|
| 1 | 33% / 11% / 3% | 40% / 14% / 4% | 42% / 16% / 4% |
| 2 | 50% / 19% / 5% | 84% / 55% / 18% | 97% / 85% / 42% |
| 3 | 71% / 31% / 8% | 100% / 96% / 55% | 100% / 100% / 98% |
| 4 | 87% / 45% / 12% | 100% / 100% / 90% | 100% / 100% / 100% |
| 5 | 95% / 57% / 16% | 100% / 100% / 99% | 100% / 100% / 100% |

Trivia stays in the fire team; a negligent discharge is the platoon's story by the third sol and the company's within the week.

### 9.6 How gossip reaches the player

By overhearing (a tell within 8 m that you hear gives you a `told` entry from the teller, and the balloons); by asking "What's the word?" (§10.4); by being told (an NPC with affinity ≥ 1 comes to you about an event of weight 3 or more concerning you or your buddy: "Heads up. Halloran's telling everyone you…"); and through the chain (office-hours results are posted on the company board, my call). Walking with someone (§10.16) puts you in earshot of the gossip on the way to chow. An arc's ending always reaches you, by these routes or by the squad leader's weekly word (§15.5).

### 9.7 Your reputation

Your reputation in the unit is what people know and feel, summarised by theme for the People leaf: **weapons** (safety, marksmanship), **fitness**, **reliability** (on time, duties done), **loyalty** (covering for others, reporting them), **nerve**, **humour**, **squared away**. Each event kind maps to themes with a sign; a theme's score is Σ over knowers of sign × wEff, divided by the platoon's size; the words come from thresholds and are shown as the character's read, with its confidence (§8.8). "The platoon thinks you're dangerous with a rifle" is a sentence the game can say only if enough people really believe it.

---

## 10. Conversation

### 10.1 Principles

- **Time stands still while a talk is open** (the user, 2026-10-26: "talk should pause the game, like combat"), and ordinary talk costs no game time (TIME.md's rule, which I follow: charging the spoken time afterwards would make the world jump in view). Conversations that are really activities (a counselling session, an hour of cards, sitting with someone through a bad night) are TIME.md's activities with their durations. The spoken length in the topics table paces NPCs' talk among themselves (balloons), sizes those activities, and paces talk on the move (§10.16).
- **Free talk buys no points.** Because talk costs no time, it cannot be what wins people: points come from shared time and deeds, and talk keeps ties alive, opens facts and spends a small daily allowance (§10.4).
- **Two other ways to be in a conversation**: walking with someone, where the exchange plays over its spoken seconds while you both walk (§10.16), and attending a scene someone else is driving, which runs fast until it reaches you (§10.12).
- **Every roll goes in the log** (pillar 3), formatted by SKILLS.md's `checkText`.
- **We only know what we know**: before an approach, the talk box shows how hard it looks as the character judges it ("an easy ask", "a fair chance", "a long shot"), from the true chance with an error that shrinks with Social (§8.8's rule). The exact sum is in the log afterwards.
- **No per-NPC dialogue trees**: topic × approach × the person's state → a response from line pools; arcs add authored lines.
- **Etiquette is mechanics**: who may start, who ends it, how people are addressed.

### 10.2 Starting and ending

- **You start** with F on someone within 1.8 m (tradecraft's reach and menu; `src/sim/interact.js` `atHand()`), then Talk. The F menu also offers Read (SKILLS.md), Aid (BODY.md), Give or show an item, Report (to a senior), Order (to a junior you command), and **Walk with** for someone walking your way (§10.16).
- **They start**: an NPC walks up to within 1.8 m and opens a talk card: an order, a summons, an ask, an invitation, a correction, banter aimed at you. At most one NPC-started talk per 4 game minutes, except rungs 0 to 3 (orders, customs, emergencies), so they never pile up (the user, 2026-11-04: "the reflex window is spammed on us"). Asks and invitations can be waved off with one key ("Not now.").
- **They may refuse**: busy at rung 4 or above (on post, in formation: "Not now." unless you outrank them); afraid (fear ≥ 3: they leave); hostile (affinity ≤ −3: "Walk away, boot."); asleep (you can wake them: affinity −1 unless it is urgent).
- **Ending**: the senior ends it ("Carry on.", "Dismissed."). A junior asks leave ("Request permission to carry on, Sergeant."). Walking away from a senior who has not dismissed you is a breach (§10.6).

### 10.3 The exchange

An exchange is a **topic** (what about), an **approach** (how), sometimes a **check**, and a **response** (a line, a mood word, effects). The mood word comes from tradecraft's `src/sim/talk.js` `mood()`, extended: afraid (fear ≥ 3), hostile (affinity ≤ −3 and fear ≤ 0), cold (affinity ≤ −2), wary (trust ≤ −2), friendly (affinity + trust ≥ 6), warm (≥ 3), else neutral; with "short" over it at stress ≥ 50 and "flat" at morale below 30.

**Asks** have a cost `c` from 0 (trivial) to 4 (huge). Someone grants an ask freely if `affinity + trust ≥ 2c` and it costs them nothing they need now; otherwise it takes a check against `DC = 10 + 4c`.

### 10.4 Topics

| Topic | When | Approaches | Check | Effects | Spoken s |
|---|---|---|---|---|---|
| small talk | always | plain, joke | joke: Social vs 12 | their mood word; keeps the tie alive; +0.25 affinity once per sol per person, only if you shared time in the last sol (below) | 6 |
| ask about them (home, family, why they joined) | affinity ≥ 0, or charm | plain, charm | charm: Social vs 12 | one fact a sol (background, home, a quirk, an arc hint); no points, unless it touches one of their arcs or a memory you share: then +0.5 affinity, once per arc stage or memory | 12 |
| tell about yourself | always | plain, sincere | | they learn a fact (a memory); no points, unless it answers their arc or a shared memory: then +0.5 affinity if affinity ≥ 0 and +0.25 trust, once per arc stage or memory | 10 |
| shop talk (gear, the job) | always | plain | | an NCO's advice counts as instruction (SKILLS.md's training hours) | 15 |
| what's the word? | affinity ≥ 0, or Social vs 12 | plain, charm | as listed | they tell you the juiciest memory you lack | 10 |
| the news | always | plain | | their take on the system's politics (TIME.md's news; SETTING.md's factions) | 8 |
| about an event you both know | context | plain, convince | convince: Social vs 15 + trust gap | on success their gauge toward the subject moves 1 your way | 12 |
| an arc's topic | context | per arc | per arc | per arc (comfort, warn, advise) | 15 |
| ask for help (a task now) | context | plain, charm, marker | if c > free | they join the task, their schedule yielding if free | 8 |
| ask for instruction | any senior or skilled peer | plain | c = 1 (0 from your own NCOs) | instruction hours | 10 |
| ask to swap a duty | you hold a duty | plain, charm, marker, trade | c = 2 (the slip watch 3) | the swap, then the platoon sergeant's approval | 15 |
| borrow, lend, trade | always | plain, trade | §10.9 | items, money, markers | 15 |
| ask a favour (cover for me, wake me, lend a blouse for inspection) | context | plain, charm, marker, plead | c = 2 or 3 | a marker owed | 12 |
| ask permission (of a senior) | always | plain, convince, plead | Social vs 10 / 15 / 20 by how unusual | leave chit, early liberty, a head call in a block, to speak freely | 10 |
| report | to a senior | plain, lie | lie: Social, opposed by their Social | report as ordered; a status ("Fire watch, all secure."); an incident; a person (§11.4) | 10 |
| request mast | to your squad leader | plain | none | to see the commander within 3 sols, the formal route around the chain | 8 |
| confront | context | starts the hard talk (§10.11) | | | |
| challenge to a bout | a peer | plain, joke | accepted if temper ≥ 0 or affinity ≤ −1 | a combatives bout in the gym (COMBAT.md) | 6 |
| comfort | someone in distress | §10.10 | §10.10 | §10.10 | 20 |
| rib, joke | always | joke | Social vs 12 (vs 16 to an NCO, 20 to an officer) | +0.5 affinity from them and those present; a flop costs 1 with seniors; a natural 1 is an insult | 6 |
| apologise | after something you did | sincere | | §8.4 | 10 |
| give an order | to a junior you command | §10.7 | | | 8 |

**Talk and the gauges** (my call, after the critics' measure: with small talk at +0.25, asking at +0.5 and telling at +0.5 and +0.25, a few real minutes a sol of the same three topics with each of the 12 squadmates would give about +1.25 a person a sol, and a squad would be won within a week, by a chore). Points come mainly from **shared time**:

- **Shared time.** `gauges.sharedMs` is set whenever the person and the player spend time together: seated at the same chow table, a `socialise` or cards together, a watch, a duty or a working party together, field day in the same bay, a training block in the same fire team, a walk together of 60 s or more (§10.16). Each shared hour of free time (chow, socialising, cards, a walk) gives +0.1 affinity, and each shared hour of duty or training +0.05; at most +0.5 from one person in a sol and +2 in 30 sols. That is twice the NPC pairs' contact rate (§8.2), because the player chooses whom to spend time with (my calls).
- **Small talk** keeps a tie alive (§8.1) and gives its +0.25 only if you shared time with them in the last sol: the word at the table, not the round of the bay.
- **Ask about them and tell about yourself** give their once-a-sol fact, and points only when the topic touches an arc or a shared memory (§10.14's callbacks), once per arc stage or memory.
- **The cap**: affinity from talk (small talk, ask, tell, rib, a joke, laughing along and ribbing back, §10.8), summed over everyone, is capped at **+1.0 a sol** (`talkGain` on the player's sheet, reset at the sol boundary). Past it, talk still gives moods, facts and words, just no points. Deeds (§8.4), comfort (§10.10) and shared time are outside the cap.
- I keep TIME's rule that ordinary talk costs no game time (TIME §20, open question 2) rather than charge spoken seconds afterwards: the world would jump in view, and shared time already prices talk where it pays. Talk on the move (§10.16) costs its spoken seconds by itself.

### 10.5 Approaches

| Approach | Skill | Against | Gauge added | On failure |
|---|---|---|---|---|
| plain | Social when a check is needed | DC | trust or affinity, by topic | nothing |
| charm | Social | DC | + affinity | nothing; a natural 1 costs 1 affinity |
| convince | Social (Tech on technical subjects, my call) | DC | + trust | nothing |
| plead | Social | DC −2 if their warmth ≥ 1, +2 otherwise | + affinity | −0.5 trust with peers present |
| lie | Social (SKILLS.md folds lying into Social) | their Social, opposed (ties to you) | their negative trust adds to their roll | caught: −2 trust, −1 affinity, a weight-2 memory; to a superior, a false statement (§11.3) |
| intimidate | Social, or CQC or Fitness if it is physical, whichever is higher | DC 10 + 2 × their nerve + grade gap | + fear | −1 affinity; they may report it (hazing if they are junior) |
| invoke rank | Leadership | DC 10, −2 per grade you outrank them | + trust | they comply slowly and resent it: −1 affinity |
| trade, bribe | none: the value rule (§10.9) | | | offering a bribe to someone with rules ≥ 1 is an infraction they may report |
| spend a marker | as the approach it rides on | the DC is halved | | the marker is spent either way |
| joke | Social | DC 12 | + affinity | a flop |
| sincere | none | | + trust | they now know a fact about you |

Other named modifiers, all in the log: rank (asking a senior for a favour −1 per grade above you, at most −4; to a junior you command +1 per grade, at most +4); stress frayed −2; in front of others when they would lose face −2; your hygiene at "ripe" or worse −1 to charm; your appearance off-regulation −1 with NCOs; in a sealed helmet −2 (no faces); a buddy +1 on top of the gauges.

### 10.6 Forms of address and etiquette

The words are SETTING.md's; the rules are these. Address is chosen automatically from the rank you can see: officers "sir" or "ma'am", or by rank; staff NCOs and NCOs by rank ("Staff Sergeant", "Gunny" for a gunnery sergeant, "First Sergeant"), never "sir"; peers by surname; the corpsman "Doc". When you cannot read the rank (beyond 5 m, in poor light, in a suit), the talk box shows the insignia as "?" and you pick a guess. Your posture (attention for officers, parade rest for NCOs) is taken automatically: every marine knows it out of boot camp.

| Breach | Handled as |
|---|---|
| calling an NCO "sir" | a bark ("Don't call me sir. I work for a living."), a weight-1 memory |
| the wrong rank, upward or downward | a correction; with an officer, on-the-spot (§11.5) |
| walking off from a senior who has not dismissed you | disrespect, minor |
| a first name to a senior on duty | a correction |
| interrupting a senior's conversation without "Excuse me, Sergeant" | a correction; −0.5 trust |
| skipping the chain (taking to the platoon sergeant what the squad leader should handle) | −1 trust with the one bypassed |
| contradicting a senior in front of juniors | −2 trust with that senior; +1 trust with the witnesses if you were right |
| saluting indoors | a bark, no record |

### 10.7 Orders

**Receiving** (rung 3; the order card):

1. "Aye aye, {address}." The order is accepted and becomes an item on the mind's agenda (VIEWS.md) with its deadline and its test.
2. Ask to clarify: one free question (where, when, with what), then back to the choices.
3. Request permission to do it otherwise: Social vs DC 15 − their trust toward you (+5 if the order is urgent); on success the alternative stands.
4. Object, giving a reason: Social vs DC 20 − trust; on success the order is changed or withdrawn and trust +1 (a good reason earns respect); on failure trust −1, and from an NCO with temper ≥ 1 a correction.
5. Refuse: insubordination (§11.3). An **unlawful order** (COMBAT.md's rules of engagement say which) must be refused, and refusing it is not an infraction; obeying it is.

```json
{ "id": "od4411", "fromId": "p50", "toId": "p233", "kind": "be-at", "text": "Armoury window, with your rifle, at 16:10.",
  "where": { "site": "melas", "room": "a1.issue-hall" }, "byMs": 0, "test": "at-place", "status": "open", "issuedMs": 0 }
```

An order's id is counted `od<n>` (CONTRACTS §10: `o:` is the openings' form); its `where` takes PLACES §1.9's ids, here the armoury's issue hall, whose Dutch doors are the issue windows (`a1.issue-hall`; outside it, the waypoint `w:armoury:window`); `standing` is left out while false (TECH §6.6, rule 1).

Order kinds: `be-at`, `do` (a task with a completion test: "clean-weapon" until WEAPONS.md's dirt is under its threshold and the armourer has passed it), `carry` (an item to a place), `stop` (a behaviour), `wear` (a uniform), `stay` (a post), `wake` (someone at a time), `tell` (deliver a message: you as runner). At the deadline, the issuer or a delegate checks it if they can perceive the result, or when a report comes in. Missed by less than 10 min: a correction; not done: failure to obey (§11.3). Standing orders (a sentry's general orders, the range's safety rules from WEAPONS.md) are checked continuously.

**Giving** (once CAREER.md makes you a leader; also a fire team leader over the team's juniors): F, then Order, then an order from the same catalogue. An NPC complies if it is within their duties and their trust toward you is −2 or more. Otherwise it takes Leadership vs DC 10 + 2 × max(0, −trust) + 5 if the order is distasteful (a working party in their free time). Failure means they drag their feet (the task takes ×1.5) or, with temper ≥ 2 and rules ≤ −1, refuse; then you choose to correct them yourself, write it up to the platoon sergeant, or let it go (−1 trust from your other juniors who saw).

### 10.8 Banter and barks

- **Barks** are one-liners in balloons, from pools keyed by context: the activity (PT cadences, chow complaints: "Green paste again."), the place (the stuffy Martian air, the dust, the cold, the open sky), events (gossip tells), relationships (ribbing a buddy), and you ("Boot."). Pools hold at least 12 lines a key, chosen by `hash(speaker, key, floor(ms / 12000))` so text never moves a roll (tradecraft `src/sim/acts.js` `say1()`).
- **Rates** (my calls): one bark per person per 45 s at most, one exchange per pair per 90 s, at most 3 balloons visible at once. Exchanges run 2 to 4 lines, each held 3.5 s + 1/3 s per word (tradecraft's earpiece pacing, `src/sim/tutorial/earpiece.js`).
- **Hearing**: within the talk radius (8 m at 66 kPa, §7.3). Heard but unseen speakers get an edge marker. Belter speech beyond your Lang Belta level shows untranslated, with some words coming through (tradecraft's language levels; SKILLS.md owns the skill).
- **Joining in**: when a bark aims at you, a quick card (one exchange, time standing still): laugh along (+0.25 affinity from those present); rib back (Social vs 12: +0.5 affinity from everyone present; on a failure they laugh at you, nothing lost); ignore it; shut it down (only if you outrank them, or by intimidation: fear +1, affinity −0.5). The gains count against the day's talk cap (§10.4), all of those present together.

### 10.9 Asking and trading

An item's value to an NPC: `v = baseMCR × needK × tasteK`, where `needK = 1 + urgency` of the need the item serves (a ration bar to a hungry man is worth up to twice its price) and `tasteK` comes from tags (`drinker` ×2 for contraband drink). A trade is accepted if what you offer is worth at least `(1.2 − 0.1 × affinity) ×` what you ask. A money loan is granted if the amount is at most `(affinity + trust + 2) × 10 MCR` and they have it (NPCs carry a seeded wallet of 0 to 150 MCR, and CAREER.md pays them). What NPCs keep in their lockers is seeded: snacks, toiletries, a spare blouse, boot polish, a book, cards, stim gum, letters, photographs. Trading contraband on base is an infraction if found.

### 10.10 Comforting

Open when someone is in distress: stress ≥ 50, morale ≤ 30, or an arc stage flagged `needsComfort`. You must be beside them (sitting on the footlocker if they are in the rack).

| Approach | Check | On success | On failure |
|---|---|---|---|
| listen | none | stress −8 × (1 + affinity/5); morale +2 | |
| reassure | Social vs 12 | stress −15; morale +4; affinity +1 | nothing |
| distract (a joke) | Social vs 14 (`joker` comforter +2) | stress −10; morale +3 | at a grief stage, affinity −1 |
| share your own story | needs their trust ≥ 1 | stress −12; trust +1; they learn a fact about you | |
| get them help (the chaplain, Doc) | needs their trust ≥ 1 | they go (a rung-7 errand); the arc moves on | |
| leave them be | none | | |

Full effect once per person per sol; again the same sol at half. Comfort adds to the arc's own recovery and counts toward its `comfortScore` (§15).

### 10.11 The hard talk

The user's "KLM style minigame for at least some conversations" (tradecraft, 2026-10-26), built on tradecraft's CQC loop (`src/sim/cqc.js`) and the same keys (DESIGN.md's controls: K, L, M; Shift spends an edge). Used for confronting a squadmate, standing up to a bully, a dispute over property, an argument with a senior (only after "permission to speak freely" is granted; pressing a senior without it is disrespect), questioning a witness or a detainee, bargaining with a union representative, and talking down an angry civilian at a checkpoint (COMBAT.md's escalation of force uses it as the verbal step).

- **Composure**: each side starts with `3 + floor(Social / 15)`, +1 at nerve ≥ 2 and −1 at nerve ≤ −2, + **leverage** (at most +2: evidence, a marker, witnesses on their side with affinity ≥ 2).
- **Each round** both choose: **K press** (push your demand), **L probe** (dig: the pointed question), **M yield** (listen, give a point). Yield beats press, press beats probe, probe beats yield. The same choice on both sides is an opposed Social roll (ties to you) with the topic's gauge and rank as named modifiers.
- The round's winner takes 1 composure off the loser and gains an **edge**, zero-sum (an edge first cancels one of the other side's), capped at `max(1, floor(Social / 10))`. Holding Shift on a won round spends an edge: 2 composure off instead of 1.
- **Reading**: you see their choice before you pick with probability `clamp(0.03 × (yourSocial − theirSocial), 0, 0.6)`; they read you the same way. I halved tradecraft's CQC rate (0.06) after measuring: at 0.06 a 5-point Social gap won 90% of the time, too sure for talk.
- **Their style**: press weight 1 + 0.4 × temper, probe 1 + 0.3 × nerve, yield 1 + 0.4 × warmth (each at least 0.2), adapting to your habits as CQC's AI does (0.02 per Social point, at most 0.5, over your last 4 choices).
- **The end**: the first side at 0 composure breaks; after 12 rounds both walk away.
- **Measured** (5,000 bouts per pair, both sides choosing at random when unread): Social 5 against 5, you win 51%; 8 against 5, 66%; 10 against 5, 75%; 15 against 5, 93%; 5 against 10, 28%; 10 against 20, 9%; equal skills with +3 on your rolls, 59%.
- **Outcomes**: a bully who breaks stops (the arc resolves) and loses 2 trust with the witnesses; if you break, you back down (−1 affinity from the witnesses, fear +1 toward the bully). Someone who breaks with temper ≥ 2 and fear toward you ≤ 0 **blows up**: 35% swing at you (a CQC fight, COMBAT.md), otherwise they storm off. A thief returns the item or swears blind; a civilian at a checkpoint complies or escalates (the district's mood −1 or +1, §12.4); a witness talks (you learn a memory) or clams up; a senior reconsiders (the order changes) or corrects you.

### 10.12 Briefings, formations and scenes you attend

A briefing is one speaker to many: the squad leader's evening word, the platoon sergeant's schedule, a training brief, a patrol order (COMBAT.md's five paragraphs). The speaker's lines go in balloons and the content on a paper (VIEWS.md); it is one of TIME.md's activities (1 to 5 min), lived by default, and time does not stand still in it, because you are not driving it (my call). At the end, "Any questions?" lets you ask one from the brief's list (time, place, kit), then "Fall out." **Mail call** is a group event (the clerk calls the names, 3 to 5 min, lived), and letters and packages start or move arcs (CAREER.md writes the letters).

**Attend mode** (my call, after the critics: lived at 1:1, these scenes give the player nothing to do for minutes at a time). A scene the player is in but not driving runs in attend mode: a formation and its inspection (§11.10), colours, a briefing, mail call, the company commander's speech (CAREER §5.7, 2 to 3 minutes), a memorial's forming up, a hail and farewell's speeches, the waiting at a board.

- It **fast-forwards at up to ×4** on TIME's fast-forward engine (TIME §5.2: the real sim, every tick, in stretches under its `FF_MAX_MS` 120,000, CONTRACTS §2), at a capped rate, so the world goes on round you visibly and nobody is placed or pops. The lines play in the ticker and as quick balloons, and the content goes on the paper as before.
- It **drops to 1:1** when a line is addressed to you (your name called, a question, "you, Marine"), when the inspector is **two marines away** from you in the inspection order, when a reflex or a bearing check is due, on anything TIME's fast-forward interrupts for (a hostile, an alarm, a body crossing), or when you ask for 1:1 (VIEWS gives the key). It goes back to ×4 when the moment has passed: the inspector moved on from you, your answer given, your letter in your hand.
- **Moving breaks it.** Walking out of ranks or turning to talk is breaking ranks or talking in ranks (an on-the-spot correction, §11.5), and ends attend mode for you.
- **A small stake: bearing.** Standing at attention or parade rest is held against the body. A **bearing check**, d20 + Nerve (SKILLS §2.2) + 6 (drill, every marine out of boot camp; my call) against DC 12 with BODY's named modifiers (fatigue, the bladder, heat or cold, pain, dust in the collar; SKILLS §5.4), falls at each drop to 1:1 while the inspector or the speaker faces you, and once every 5 game minutes in ranks otherwise, and only when one of those modifiers applies. With Nerve 4: tired (−2), 85%; tired with the bladder urgent (−2 and −3), 70%; exhausted and bursting (−4 and −6), 45%. A failure is a fidget the figure shows (a shift of weight, a hand to the collar, eyes off the front). If the inspector or an NCO of your chain perceives it (§7), at an inspection it is a gig on the bearing item (§11.10); elsewhere, "Eyes front." (R0).
- **What it comes to**: colours, about 15 s of real time; a briefing of 3 minutes, about 45 s plus your question; mail call, under a minute until your name; the commander's speech, about 40 s; the morning inspection, about 2 minutes, and the platoon's inspection on Friday, about 4 (§11.10's pacing). A memorial's roll call and the cross are always at 1:1 (my call: some moments are not hurried).
- **Boards**: CAREER §8.5's meritorious board ("a lived scene at battalion, 20 to 30 minutes") becomes, on the people side, three lived beats of about 2 minutes each (the uniform inspection, the pull-up bar, the three NCOs' questions) with the waiting between them in attend mode or skipped (§20).

### 10.13 Over the radio and in suits

The same system over comms, with fewer topics (reports, orders, asks for help, short banter where net discipline allows); chatter on a tactical net is a minor infraction. Face to face in sealed helmets, Social checks take −2 and reading people −3 (SKILLS.md). Across interplanetary distances there are no conversations, only messages (CAREER.md's letters; SETTING.md's light lag).

### 10.14 Voice

Tradecraft's register carries: "Grounded and procedural… The humour is in the words: dry, dark, situational" (tradecraft's pitch); LONGHAUL's Martians are clipped. Line pools are keyed by (topic, mood word, rank relation, culture), at least 8 lines each (my call, up from 6), with `{name}`, `{rank}`, `{address}`, `{place}`, `{when}` and `{event}` filled in; arcs add authored lines.

Over a first term of 60 to 120 hours the same people will talk to you hundreds of times, so pools alone would recur, and the persistent cast would lose its voices (the critics). Four things keep them (my calls):

- **No line twice from the same mouth within 3 sols.** Lines spoken to the player are drawn by a per-speaker rotation: for each topic, the speaker walks a permutation of the pool seeded by `hash(speaker, key)`, with a counter per topic (`voice.n`, a few dozen small numbers for a T1, saved because the lines go into the log, which is saved). No line comes back until the pool is spent. Ambient barks keep their hash by 12 s windows (§10.8).
- **Callbacks: the memory voiced.** When speaker and listener both hold a memory (§9), a line may come from the callback pools, keyed by (event kind, weight band 1 to 2, 3, or 4 to 5, tone: fond, rib, bitter, grave), with `{when}` ("on Wednesday", "at the range last week") and `{event}` from the event: "Like the dummy round on Wednesday. You looked at that rifle like it owed you money." The shared memory with the highest `wEff` that this speaker has not called back in 7 sols is used. Small talk, ribbing and banter use a callback at 30% when one is available, comfort at 50% when the memory is fond. Weight-5 events are called back only in the grave tone, never as a rib. A callback is the "shared memory" that lets ask and tell earn points (§10.4).
- **Voice quirks**, drawn at generation from the roster stream by traits, background and home: each T1 has two and each T2 one. A **turn of phrase** (from SETTING §5.9's slang and sayings: "Dust in everything.", "Within tolerance.", "Breathe easy.", "Sixty years yet."), used about once in five lines. A **hobbyhorse**, a topic they always come back to (the water rights at home, Hellas, a sister's farm, the recon course, the Earthers, the next liberty), which their small talk and the news turn to at 25%. A **register** from the traits: clipped (social ≤ −1), chatty (social ≥ 2), formal (rules ≥ 2), rough (temper ≥ 2 and rules ≤ 0); pools carry register variants where they matter. All in `voice` (§2.3).
- **Earned nicknames** (SETTING §12.3's pools; §3.5). The squad gives the player one after the first event of weight 3 or more in which the player is the subject or object, once at least 7 of the squad know it (§9.5): from the `deed` pool for its kind ("Berm", "Seal", "Long Ball"), or the `ironic` pool if it was a failure ("Sunshine" after the bay failed on your locker). A later event of weight 4 or more may replace it (30%). Squadmates with affinity ≥ 1 toward you use it in barks and banter, your NCOs off duty; the rest use it only behind your back, in gossip you overhear. How many of the squad use it is the plainest sign of acceptance. You may object ("Don't call me that.": Social vs 14; on a success it fades over 7 sols, and the squad ribs you once for asking).

The soak test (`people.voice.test.mjs`, heavy) prints, per speaker, the lines repeated to the player within 3 sols (target 0) and the share of callback and quirk lines (§17).

### 10.15 The talk state

```json
"talk": { "withId": "p42", "mode": "talk", "openedMs": 0, "round": 2,
  "said": [ { "topic": "swap-duty", "approach": "marker", "roll": null, "line": "Take my slip watch Thursday and we're square.", "reply": "Fine. But we're square.", "mood": "warm", "seconds": 15 } ],
  "hard": null }
```

`mode` is `talk`, `walk`, `order`, `hard`, `brief` or `quick`. In `hard`, `hard = { comp: [3, 4], edges: [0, 1], seen: "probe", round: 3 }`. In `walk`, the talk box is the chip strip and the clock runs; the state adds `walk: { route, untilMs, playing }`, the line playing and when it ends. Rolls are SKILLS.md's check results, stored in the log as data.

A scene in attend mode (§10.12) is a record of its own, which TIME's fast-forward reads for its rate and its drops to 1:1:

```json
"scene": { "kind": "inspection", "byId": "p50", "order": ["p51", "p55", "p42", "p233", "p56"], "at": 1,
  "rate": 4, "drop": null, "bearingDueMs": 0, "paper": null }
```

### 10.16 Walking with someone

The walks that fill the sol (to chow, to the range, back from the armoury) are where marines talk most, and a talk that freezes time and opens only within 1.8 m leaves them silent (my call, after the critics).

- **Opening.** F on someone walking your way (within 3 m, their next 20 m of path within 45° of your heading), or on a walking squadmate who falls in beside you, offers **Walk with**. You both keep walking at the slower one's speed, they half a step to your side (a junior on a senior's left, the US custom; my call), following your route while it runs with theirs. Seniors may decline ("Not now, Marine.") as anywhere (§10.2).
- **Talking.** A strip of three to five topic chips shows (VIEWS draws it), drawn from the one-key topics: small talk, ask about them, tell about yourself, shop talk, what's the word, the news, an event you both know (plain), rib (its chip carries the character's read of its odds, §10.1). A digit picks one, and the exchange plays as balloons over its spoken seconds (the topics table's column) while you both walk; the next chip waits until it ends. Checks roll at the line and go in the log as any roll. The chips do not freeze time (§21, question 6): the choice is one key on a short label, like the instinct's line.
- **What still stops you.** A topic that needs a choice of approach (charm, convince, plead, a lie, an ask, a favour, a swap, a permission, comfort, a confrontation, the hard talk) opens the ordinary talk box: you both stop ("Hang on."), and time stands still as in any conversation (§10.1). An order or a correction from them does the same.
- **Ending.** At the fork where your routes part, at a door one of you is going through and the other is not, if you stop for more than 5 s, or at their destination: a closing line ("Chow's that way. See you at the table."). Running ends it, unless they run too (PT, late together).
- **What it pays.** A walk of 60 s or more is shared time (§10.4), and talk on the move costs its spoken seconds by itself, so the chow walk becomes the social hour and the walking pays for itself. Its gains count against the same cap. NPC pairs and groups walk and talk the same way among themselves (join friends, §6.2), which is how the player overhears gossip on the way to chow (§9.6).

---

## 11. The chain of command and discipline

### 11.1 The chain

The chain is data (§2.6): `chainOf(person)` gives the fire team leader, squad leader, platoon sergeant, platoon commander, first sergeant, company commander, battalion sergeant major and battalion commander, skipping empty billets. Seniors in your chain give you orders, correct you, inspect you, handle your lapses at their level and pass up what is above it. Seniors outside your chain (another platoon's sergeant, the duty NCO, an officer you pass on the street) may correct you on the spot (R0) and report you to your chain; only your chain punishes.

### 11.2 Orders and compliance

Orders are given, received and checked as §10.7 sets out: each has a deadline and a test, and the issuer or a delegate checks it when they can perceive the result. The duty roster (§4.3), the Plan of the Day and standing orders (a sentry's general orders, WEAPONS.md's range and muzzle rules, PLACES.md's pressure-door rules) are orders too, checked continuously by whoever is responsible.

### 11.3 Infractions

Severity classes: **minor** (1), **moderate** (2), **serious** (3), **grave** (4). The Corps' code is SETTING.md's to name; the real articles of the US Uniform Code of Military Justice are given as the reference each one models.

| Infraction | Class | Models | Notes |
|---|---|---|---|
| late to a formation or appointment (under 3 h) | 1 | Art. 86 | the commonest |
| absent from a formation, duty or class | 2 | Art. 86 | |
| unauthorised absence over 24 h | 3 | Art. 86 | over 30 sols with intent: desertion, 4 (Art. 85) |
| missing movement (the shuttle, the ship) | 4 | Art. 87 | |
| uniform or grooming off regulation | 1 | Art. 92 | unshaven, haircut, dust, gig line |
| failed personal, locker or bay inspection | 1 | | §11.10 |
| dirty weapon at inspection | 1 | | WEAPONS.md's thresholds |
| failure to obey an order | 1 to 2 | Art. 92 | late and partial is 1 |
| dereliction of duty (asleep on fire watch, the log not kept) | 2 | Art. 92 | |
| a sentry asleep, or leaving the post | 3 | Art. 113 | grave in a combat zone |
| disrespect toward an NCO or officer | 1 to 2 | Art. 89, 91 | walking off undismissed is 1 |
| insubordination (refusing a lawful order) | 3 | Art. 90, 91 | |
| flagging someone with a muzzle | 1 | | 2 when repeated within 30 sols |
| negligent discharge | 2 | Art. 134 | 3 if it endangered anyone |
| a weapon or sensitive item unsecured or lost | 3 | Art. 108 | a lost weapon locks the base down (WEAPONS.md) |
| fighting | 2 | Art. 128 | striking a superior is 4 (Art. 90, 91) |
| drunk on duty / drunk and disorderly | 3 / 2 | Art. 112, 134 | |
| contraband in the barracks (drink, unprescribed drugs) | 2 | Art. 92, 112a | juice taken without orders included (BODY.md) |
| theft | 3 | Art. 121 | |
| false official statement (a lie to the chain, caught) | 2 | Art. 107 | |
| hazing | 2 | Art. 92 | 3 with a fight |
| fraternisation across the chain | 2 | Art. 134 | |
| malingering | 2 | Art. 115 | |
| liberty violation (late back from liberty, no buddy) | 1 to 2 | | |
| an unapproved duty swap | 1 | | both parties |
| a pressure or safety breach ("Mind the Seals": a pressure door propped, a suit check skipped, water wasted) | 1 to 3 | | a Martian infraction, by what it endangered (my call) |
| a breach of the rules of engagement; mistreating a detainee or a civilian | 4 | | COMBAT.md defines the rules; this section handles the aftermath |

### 11.4 How an infraction becomes known

An infraction is an event (§2.5), so only those who perceive it or are told about it know. Its fate depends on who knows:

- **A senior in your chain sees it**: they handle it (§11.6).
- **A peer sees it** and may report it: `pReport = clamp(0.1 + 0.15 × severity + 0.1 × rules − 0.1 × affinity toward the offender + (afraid of the offender ? −0.2 : 0), 0, 0.95)`, checked once the next time they are alone with someone in the chain. A peer who keeps quiet about something of class 2 or more now holds a marker over the offender (and the offender knows it if they saw them see).
- **Gossip reaches the chain**: an NCO who learns of it by gossip (§9) acts on class 2 or more with probability `0.3 + 0.15 × rules`, discounted ×0.5 if the version they heard is distorted (they may act on the wrong version: that is a story).
- Off the map, detection of an NPC's lapse is a roll: the chance a senior notices is 0.6 for a missed formation, 0.3 for being late, 0.2 for skating, and 0.4 for a liberty incident (MPs in Redwater), each × (1 + 0.1 × the handler's rules) (my calls).

### 11.5 The consequences ladder

| Rung | What | Who | Record | Real reference |
|---|---|---|---|---|
| R0 | **on-the-spot correction** ("Get your hands out of your pockets.") | any senior | none (a weight-1 memory) | |
| R1 | **corrective training**: push-ups, extra PT, drill, the thousand-word essay on muzzle discipline after taps; 15 min to 2 h, the same or the next sol, related to the fault | an NCO senior to the offender | none | the Marine Corps' "incentive training" |
| R2 | **extra military instruction**: 1 to 2 h a sol for 1 to 5 sols, after hours | an NCO, with the platoon sergeant's leave | informal | EMI |
| R3 | **formal counselling**: a written entry on the record, signed | squad leader or platoon sergeant, signed by the commander | yes; CAREER.md's conduct marks read it | the "page 11" counselling entry |
| R4 | **NJP at company level**: office hours before the company commander | company commander | yes | Art. 15 |
| R5 | **NJP at battalion level** | battalion commander | yes | Art. 15, field grade |
| R6 | **summary court-martial** | one officer | yes; a conviction | R.C.M. 1301 |
| R7 | **special court-martial** | a panel | a federal conviction; may end in a bad-conduct discharge | |
| R8 | **general court-martial** | a panel | may end in a dishonourable discharge | |

**Punishments** (real maxima from the Manual for Courts-Martial, used as the game's caps; each punishment's effect on pay and rank is CAREER.md's):

| Forum | Reduction | Forfeiture | Extra duty | Restriction | Custody or confinement |
|---|---|---|---|---|---|
| R4, company | one grade (E-4 and below) | up to 7 days' pay | up to 14 sols | up to 14 sols | correctional custody up to 7 sols (E-3 and below) |
| R5, battalion | one grade (E-6 and below) | half a month's pay for 2 months | up to 45 sols | up to 60 sols | correctional custody up to 30 sols (E-3 and below) |
| R6, summary | to E-1 (E-4 and below) | two thirds of a month's pay | hard labour without confinement 45 sols | 60 sols | confinement up to 30 sols |
| R7, special | to E-1 | two thirds a month for 12 months | | | confinement up to 12 months; bad-conduct discharge |
| R8, general | to E-1 | all | | | as the offence allows; dishonourable discharge |

Restriction confines you to the base and calls you to muster at the duty desk at 06:30, 12:30, 18:30 and 21:30 (missing one is a new infraction). Extra duty is at most 2 h a sol, never on the rest sol, and the roster schedules it first (§4.3). Restriction, extra duty, custody and confinement are lived as chapters with a goal and something to win back (§11.11). A first moderate offence at NJP has half its punishment **suspended** for 180 sols (my call): a new offence in that time brings it back. Two NJPs in 365 sols, or three counsellings for the same fault followed by the fault again, start **administrative separation** (CAREER.md decides the discharge).

### 11.6 Choosing the rung

```
rung = BASE[class]                               # minor 1, moderate 3, serious 4, grave 6
     + min(2, counsellings and NJPs in the last 180 sols)
     + (the same infraction within 30 sols ? 1 : 0)
     + (an officer or the first sergeant witnessed it ? 1 : 0)   # it cannot stay in the squad
     + (deployed ? 1 : 0) + (it endangered life ? 1 : 0) + (on post ? 1 : 0)
     - discretion
discretion = 1 if the handler was the first to know, their affinity toward the offender >= 2,
             the class is 2 or less and their rules <= 1; else 0
rung = clamp(rung, 0, 8); a handler below the rung's authority passes it up the chain
```

R0 to R2 happen at once, in the world (the NCO's voice, the push-ups on the deck, lived or skipped as TIME.md's corrective-training activity). R3 is a scene in the platoon office: the squad leader reads it out, and you sign.

### 11.7 Office hours, played

1. **Inquiry** (1 to 3 sols): the first sergeant gathers statements. Witnesses' versions are their memories, distortions included.
2. **Your rights**: you may refuse NJP and demand a court-martial, except when attached to or embarked in a vessel (a real rule of Article 15, kept: aboard the troopship there is no refusing).
3. **The hearing** (09:00 in the commander's office; lived, about 5 min): you stand at attention; the first sergeant reads the charge; the commander hears the evidence. **Evidence strength** = Σ over witnesses of (saw 1, heard 0.5, told 0.25) × (1 − distortion 0.5) + physical evidence (WEAPONS.md's round count, the duty log) 1 to 2. You may make a statement, a conversation (§10): plain, convince (Social vs 15 + 3 × evidence), lie (Social, opposed by the commander's Social; caught, a false official statement), or "matters in mitigation" (your record and your witnesses: each T1 with trust ≥ 2 who speaks for you −1 to the punishment's size).
4. **The finding**: dismissed if evidence < 1 and your statement succeeded; otherwise guilty, and the punishment drawn from the table by class and priors.
5. **The papers**: the unit punishment entry (VIEWS.md), a splash for the moment the gavel falls (the user, tradecraft 2026-11-04, wanted "a splashscreen that explains what happened"); appeal to the battalion commander within 5 sols (the appeal is a paper, decided on the evidence).

### 11.8 Courts-martial and separation

Courts-martial (R6 to R8) are a chapter (TIME.md): a hearing day lived, the rest papers, and confinement in the brig as a chapter of its own (§11.11).

### 11.9 Praise

Discipline has a mirror (DESIGN.md: "and praise"): on-the-spot praise ("Good job, Marine."; trust +1 from the NCO); a word to the platoon sergeant (it goes in CAREER.md's evaluation ledger); a meritorious mast (formal praise at formation); a letter of appreciation; and recommendations for awards and meritorious promotion, which CAREER.md decides. Seniors write their observations as events with weights into the ledger CAREER.md reads for conduct and proficiency marks.

### 11.10 Inspections

| Inspection | When | By | Items | Lived |
|---|---|---|---|---|
| personal | every morning formation (light), Friday (full) | squad leader (daily), platoon sergeant (Friday) | shave (≤ 20 h since, for those who shave), haircut in regulation (from v0.0.6 `hairOf().regulation`: men within 10 sols, women's short within 21, a bun or a braid within 42, below), squared away (≤ 3 sols since: boots shined, uniform pressed and laundered), dust ≤ 0.3, name tape and insignia, gig line, hygiene below "ripe", bearing (§10.12), a weapon if under arms | yes, in attend mode (§10.12): the NCO walks the ranks, 10 to 15 s a marine with nothing found, 30 to 45 s with a fault, 30 to 40 s on you in your first 30 sols |
| bay | Friday, 08:00–10:00 (TIME §9.2), after Thursday's field day | platoon sergeant, sometimes the first sergeant | rack made (and made tight: 60 s or more at reveille; a rushed 30 s rack fails half the time), locker tidy ≥ 0.8 and laid out, deck clean ≥ 0.75, dust ≤ 0.2, head ≥ 0.8, no contraband | yes |
| weapon | at turn-in after cleaning | the armourer | WEAPONS.md's cleanliness and condition | yes, at the armoury window |
| full gear layout ("junk on the bunk") | monthly and before a deployment | platoon sergeant | every issued item laid on the rack | yes; a missing item is paid for (CAREER.md) |
| health and comfort | unannounced, about once in 30 sols | the first sergeant with NCOs | lockers searched for contraband | yes |

**Pacing.** At those times a squad's morning inspection (12 marines, a fault or two among them) is about 4 minutes of game time and about 2 minutes of real time in attend mode, within TIME §9.2's "lived (1–2 min)"; the platoon's inspection on Friday (the platoon's 42) is about 12 minutes of game time and about 4 real. From two marines before you until the inspector moves on from you it is 1:1, about a minute with the inspector's face 20 cm from yours; the rest of the ranks pass at ×4.

**Upkeep is one activity and one bag** (my call, after the critics: shave, haircut, laundry, boots, dust and the locker each on its own clock stacked into a rota of errands, the kind of upkeep pillar 8 sends to activities):

- **Square away** at the wall locker (TIME §8.5's `kit` activity: 20 to 30 min, 20 when little is off) brings boots, the uniform's press and the locker (`kept` back to 1) to standard and brushes off the dust, and sets `appearance.squaredMs`. It holds for 3 sols, or until a field day, a range day in the dust or a dust storm takes it off.
- **The platoon's laundry bag**: during the maintenance block, an R at the bag in the bay (10 s) puts your uniforms in; a working party takes the bag to the base laundry, and the uniforms come back to your locker at the next sol's maintenance block (`bagMs`; laundered for 3 sols). TIME §8.5's `laundry` at the laundry room stays for the one who missed the bag, and for civilian clothes.
- What is left on its own clock is the morning shave (part of the hygiene activity) and the haircut (the barber, or the clippers for a shaved head).
- **The haircut's rule, as built in v0.0.6** (written for the inspections to come at 0.0.11's `test-inspection`; nothing inspects yet): a cut is in regulation while `hairOf(state, pid).regulation`, its band under `over`: **men within 10 sols** of the cut, **women's short within 21, a bun or a braid within 42** (the build sheet 0.0.6 §8 item 22, my call, amending this section's 10 sols for everyone: longer hair pinned up keeps its regulation look longer). The DI says it as a cut comes due and once it is over (SKILLS §14.4's `haircut`).
- **One state on the doll**: VIEWS's close figure shows "inspection-ready" or not, as one state, and the instinct's line names what is off the evening before an inspection, once ("Boots want a shine. Haircut's due Thursday."; SKILLS §14.4's `uniform` rule, §20).

Shared state: each bay and head fixture has a `kept` value from 0 to 1, falling 0.15 a sol with use and 0.02 per entry from outdoors without dusting off at the door (Mars dust). Field day raises it by the participants' work (each NPC's share is 0.6 + 0.1 × drive of a full share; the player's share is lived or skipped as TIME.md's field-day activity). Lockers fall 0.05 for each time they are opened and rummaged; squaring away restores them to 1.

Glaring faults are found every time; marginal ones (within 15% of the threshold) are found on the inspector's Awareness against DC 12 (+3 for a "white glove" inspector with rules ≥ 2, −3 when rushed). An individual gig is corrective: re-inspection at 17:00 (R1). Three gigs in 30 sols is a counselling (R3). A failed bay means the platoon does field day again on the eve of its rest sol, and everyone whose items failed loses 1 affinity from each bay-mate. That is how your locker becomes the squad's business.

### 11.11 Hard stretches as chapters

A failure state stays interesting only if there is something to do inside it (the critics: restriction for up to 60 sols, extra duty, custody, the brig "skipped with outcomes", six months of limited duty, a month with the remain-behind element). Each is a **chapter** (TIME §10) with its own cast, its own arc pool and a **goal** shown on the agenda (VIEWS's mind, Tab) with its progress in words, and each ends with a paper saying what was earned (my calls; TIME owns the chapter mechanics, CAREER the career effects).

| Stretch | Time | What is lived | Cast and arcs | The goal | The paper at the end |
|---|---|---|---|---|---|
| **Restriction** (up to 60 sols, §11.5) | ordinary sols on base; a `restriction` chapter for the quiet ones | the four musters at the duty desk (about 30 s each, in attend mode), and free time inside the fence | the **restricted list**: the others on restriction or extra duty in the battalion that week (2 to 6: the company's own lapses, §6.5, and T3s of other companies), and the duty NCOs. Arcs: *the run* (one of them plans a night in Redwater: cover, join, or report), *the duty corporal* (who remembers who mustered on time) | **remission**: after half the term with every muster made and no new entry, ask your squad leader to carry it (an ask of cost 2, §10.3), or request mast; the commander remits the rest on Social vs 15 at the hearing, +2 for each working party you volunteered for (at most +4), +2 if the squad leader's trust toward you is 3 or more (a real power at NJP) | served or remitted, on which sol, and the words on the record |
| **Extra duty** (up to 45 sols, 2 h a sol) | working parties after hours | the first and the last hour of each, lived or skipped as `working-party` | the extra-duty crew and the NCO who runs it. Arcs: *the job* (the NCO's project: the guidon stand, the dust sweep of the motor pool), *the other offender* | **worked off well**: the NCO's report, which CAREER's ledger reads (conduct +2, my call) | the extra-duty card, with the NCO's line |
| **Correctional custody** (up to 30 sols, E-3 and below) | a `custody` chapter by the day: the custody unit's routine of drill, PT, labour and classes | the first day, inspections, and forced moments (a fight in the bay, a custodee who breaks) | the unit's staff NCO, 4 to 10 custodees (T3, other battalions). Arcs: *the hard case*, *the one who breaks* | **graduate** with a good report from the staff NCO | the release paper and the staff NCO's mark, which CAREER reads |
| **The brig** (confinement: up to 30 sols at a summary court, 12 months at a special) | a `brig` chapter by the week | processing and the first day, forced moments, the hearing for good-conduct time | cellmates (T3: sailors and marines of other units), the brig's staff, and, on Echo's guard days (§4.3: 1 sol in 4), **your own company standing the brig's posts**. Arcs: *the chaser* (a guard who used to be in your squad: a friend, a debt, a temptation), *the cellmate* | **good-conduct time**: 5 sols off for each 30 served without an incident (after the real abatement of 5 days a month), and **trusty** status after 10 clean sols: a work detail outside the wire | sols served, good-conduct time earned, the trusty's note |
| **Limited duty** (6 months, CAREER §15.2) | a `limdu` chapter by the week | the doctor each month (CAREER), the weekly PT assessments with the physical therapist, the board date | the physical therapist (a T3 at the aid station), the company office (the clerk, the first sergeant), squadmates who come by with news. Arcs: *the comeback* (CAREER §15.7's PFT and CFT targets as weekly goals), *the desk* (you learn how the company runs: the roster, the paperwork, one fact about everyone) | **the comeback plan**: the PFT and CFT targets met by the board's date | the LIMDU review, then the board's paper (CAREER §15.4) |
| **The remain-behind element** (20 to 40 days, CAREER §5.8) | a `rear-party` chapter by the day | the first day, the working parties, the sailing date | the rear party: a staff sergeant in charge, the battalion's sick and lame, legal holds, new joins who missed the move. Arcs: *the misfits*, *the new join* (who asks you what it's like) | **the race**: fit (BODY's clearance) and cleared before the next troopship sails (TIME §12) | the orders that send you after the battalion, or the next sailing's date if you missed this one |

- The arc director (§15.2) treats a stretch's cast as the player's squad for the weekly beat, so the stretch has its story beat each week.
- The squad goes on without you: their news reaches you by visits, letters and gossip (§9.6), and your ties to them follow §8.1's drift, kept alive by those visits (§8.1's talk rule).
- Each goal is a real lever and none is a reset: remission, good-conduct time and a good report shorten or soften a punishment, and the record keeps what happened (CAREER §16).

---

## 12. Crowds

### 12.1 The bubble, on areas

Tradecraft's crowd (`src/sim/crowd.js`, 319 lines) re-expressed on PLACES.md's areas instead of street rows:

- Crowd agents live in the **live area and the areas adjacent to it** (one door or hatch away), up to **120** in all. On grounds and habs the bubble is a radius instead (§13.5): within `DROP_M` 96 m of the player, with a neighbouring building counted only if its portal lies within `REACH_M` 56 m.
- Each is generated from a seed (tradecraft `passerby()`), with a role, a look and a **real destination**: a door in the site (the mess, the PX, another battalion's barracks, the gym), reached by a route with habits (tradecraft `src/sim/habits.js`: a stop at a notice board, a word with someone, a look at the dust on the horizon). Followed, a crowd marine goes where he was going.
- They **spawn only unseen**: 25% out of a door, the rest from beyond the edge of the view or out of sight lines (tradecraft's `SCREEN_HALF_M` rule); they leave only through a door or out of view.
- After a skip of 120 s or more (`RECYCLE_S`), the crowd is let go and refilled anywhere unseen at the new hour's density; under 120 s, the same people stay.
- **Casualties are kept** (tradecraft's `lies()`; the user, 2026-11-04) until someone takes them away.
- On area change, `fill: true` places the new area's crowd anywhere, because the player has not seen it yet.

Crowd agent:

```json
{ "id": "a412", "who": null, "seed": 99112311, "x": 0, "z": 0, "ai": { "kind": "crowd", "role": "marine-other", "plan": { "from": "o:melas:fox-front", "to": "o:melas:mess-north", "stops": [] }, "mood": 34 } }
```

A plan's ends are PLACES's opening ids (CONTRACTS §10), on a site plan a building's outside door `o:<site>:<building>-<side>` (PLACES §1.9): here Fox Company's front door and the mess hall's north door.

### 12.2 Base Melas

Roles: marines of other battalions (dressed by the Plan of the Day: PT gear at dawn, utilities by day), sailors, civilian contractors (PX, laundry, maintenance), a few families near on-base housing. Densities (my calls):

| Area kind | Peak | Off-peak |
|---|---|---|
| mess hall | 160 at noon chow, TECH §16.7's busiest bench, `mess-noon`: 48 persistent at L0 and L1, 12 puppets (the rest of the company in crowd slots) and 100 crowd, under the cap of 168 (CONTRACTS §8); the hall seats 240 (PLACES §4.5), and the 40 m frame over its 55 m dining room holds about 125 of them | 10 |
| base main street, per 100 m | 30 for 10 min either side of a block change | 4 during blocks, 12 in the evening |
| PX | 25 on pay-day evening | 6 |
| gym | 20 in the evening | 5 |
| aid station waiting room | 8 at sick call | 2 |
| Redwater's main street, per 100 m | 35 from 18:00 to 21:00 on rest sols | 8 |

Base queues the player will meet: the **reveille head** (§6.4); the **mess line** (15 to 25 s a person at the serving line, 6 arrivals a minute at the noon peak); the **armoury line** on a range morning (20 to 40 s a rifle; a company of 190 takes about 90 min, as real ones do); the PX register; sick call.

### 12.3 Ships

The troopship's crowd is its Navy crew on their watches (longhaul's three watches), drawn from seeds by deck, and the other embarked companies. Passageways are narrow: make-a-hole matters, and secure for burn empties them in minutes (§6.8).

### 12.4 Europa: civilians and district mood

Each district of an under-ice town (PLACES.md) has a mood `M` from 0 to 100: calm (< 20), uneasy (< 40), tense (< 60), angry (< 80), riot (80 and above). It drifts toward a target set by the world (SETTING.md's Europa situation and LONGHAUL's politics: OPA influence, air and water rations, the unions' disputes) with a time constant of 2 sols, and events push it:

| Event | ΔM | Event | ΔM |
|---|---|---|---|
| a civilian shot by marines | +25 | an aid delivery | −8 |
| a death in the ice works | +10 | a sol without incident at the checkpoints | −1 |
| an air or water ration cut | +15 | a dispute settled by talk (§10.11) | −3 |
| a popular figure arrested | +12 | a rough search | +0.5 |
| a detention | +3 | a long queue (per person-hour past 30 min) | +0.05 |

Demographics (my calls, SETTING.md to confirm): miners 55%, families and children 20%, traders and service 15%, union militants 5%, corporate security 3%, Ceres Free Belt members 1 to 2% (hidden; COMBAT.md). Each crowd member's disposition is `d = M + N(0, 15)` from their seed: under 30, ordinary errands; 30 to 60, keeps 4 m from marines and comments; 60 to 80, heckles, obstructs, joins protests; over 80, throws and rushes when at least 10 hostile people are near.

**Households in authored homes** (PLACES §7.8's rule, taken here). Every home in a town is authored and dressed once for one kind of household (a miner's family of four in a family pod, two single haulers in a dormitory's capsules, a manager's family in a flat in the Rings), and PEOPLE moves into it a generated household of that kind, drawn per home from the world's seed (`stream('household', worldSeed, site, home)`, my call, as §3.13 staffs a post), so a home's things and its people agree and two worlds fill the same pod with different families. A career's own family (CAREER §4.8) is given a home of the kind it fits in its home town by the same rule (CAREER §13).

### 12.5 Queues

Ration points, water dispensaries, the clinic, checkpoints: arrivals by hour (Poisson λ per minute), service time S per person (a checkpoint search 45 to 90 s, a ration 20 to 40 s), patience exponential with mean `20 min × (1 − M/150)`. Leaving angry adds 0.1 to M per leaver. Line-cutting happens at `0.02 × d/50` per arrival, with barks, shoves and, when both are at d ≥ 60, a 5% chance of a fight. At a checkpoint the player is the server: their pace (COMBAT.md's search procedure) is the queue's pace, and the district feels it.

### 12.6 Protests

When M ≥ 50 and a trigger occurs (one of the events above), a protest forms around a T3 leader: size `round(nearby population × (M − 40) / 200)`, at most 200. States: gathering, protest, march or standoff, then dispersal or riot. A standoff disperses when M falls under 45, or when the leader breaks in a hard talk (§10.11): the leader is someone you can talk to.

### 12.7 Riots

From a standoff, per minute, `pRiot = min(0.5, 0.01 × max(0, M − 60) / 10 + 0.08 × provocations in the last 5 min)`; a provocation is a push, a weapon pointed, an arrest or a shot. Shares: chanters 40%, throwers 15%, rushers 5%, looters 10%, filming 10%, fleeing or bystanding 20%. COMBAT.md's non-lethal tools give an effect strength; each member breaks and flees if `d20 + 2 × nerve < 10 + effect`. A riot that is not dispersed burns out over 20 to 60 min. Its casualties persist.

### 12.8 Crowds round a casualty

Tradecraft's onlookers (`src/sim/onlookers.js`): within 12 m and in sight, 40% gather in a ring 2.2 to 3.4 m off (at most 8), half of them filming on wrist terminals, for 90 to 300 s; the rest give a 2 m berth. On base, marines in the crowd do not gather to film: they help (they join the rescue chain at rung 2, §6.7) or clear the way.

---

## 13. Level of detail and budgets

### 13.1 Levels

| Level | Who | Movement | Thinking | Needs | Social |
|---|---|---|---|---|---|
| L0 | persistent people on the live area (on grounds and habs, inside the near ring, §13.5), in view | 20 Hz | once a second (staggered) and on events | BODY.md's slow layer each game minute | live: contacts, tells, barks |
| L1 | persistent people on the live area (inside the near ring on grounds and habs), out of view | 20 Hz | as L0 | as L0 | as L0; the player sees their remembered ghosts (VIEWS.md) |
| L2 | persistent people off the map on the same site, and on grounds and habs beyond the near ring | none: `whereIs()` each game minute, on their route's polyline when walking (PLACES §2.3) | block boundaries and overrides | closed form (§5.2) | hourly, by co-location from the schedules |
| L3 | persistent people on another site, on leave, in hospital | none | per sol | per sol | per sol (§9.5) |
| L4 | crowd outside the bubble | none | none | none | none: a seed |

**Puppets**: when more persistent people are scheduled into the live area (on grounds, into the near ring) than the budget allows (a company crossing at a block change, a memorial), the nearest 48 are L0 and L1 and the extra ones are driven by crowd steering with their identities kept (L1 sheets, crowd movement), taking the crowd's slots, the crowd being let go out of view first. F on a puppet promotes it to L0 at once (the farthest L1 becomes a puppet). **Formations** are cheaper still (§13.5).

### 13.2 Budgets

The millisecond figures are targets the perf test measures, never limits the sim reads: the sim counts only work units (TECH §3.2).

| Quantity | Budget |
|---|---|
| persistent people at L0 and L1 | 48 (on grounds and habs, inside the near ring, §13.5); 24 in a crowd scene |
| crowd agents | 120, puppets included; 200 in a crowd scene |
| actors in all | cap 168 (224 in a crowd scene); the busiest bench, `mess-noon`, 160: 48 persistent, 12 puppets, 100 crowd (CONTRACTS §8) |
| figures drawn | at most `MAX_PEOPLE` 256 (TECH §16.7; one instanced draw for the crowd: DESIGN.md, Performance). Actors outside the frame are culled from the draw, never from the sim; inside it nothing is culled, so the frame is kept under the cap instead: the crowd is the slack (none spawned into or routed through the frame while it holds 248 or more, the cap less 8), walk-ins wait out of view at their door while it is full, and formations stay under it (§13.5) |
| people's sim per tick, busiest area | 0.50 ms (TECH §16.2: steps 3, 6 and 7, `actors` 0.25, `look` 0.15, `think` 0.10; CONTRACTS §6); PEOPLE's per-second 0.03 ms sits in TECH's `second` row |
| path requests | TECH's `PATH_SOLVES_TICK` 6 solves and `PATH_NODES_TICK` 8,000 node expansions a tick, shared with the player, who goes first; persistent people before the crowd; unserved requests wait a tick. The flow fields for each area's six busiest destinations (§6.9) serve most crowd trips with no solve |
| the slow layer, each game minute (one tick) | 230 off-map people at 2 µs each: 0.5 ms |
| the hourly social pass (one tick at `hour@:05Z`, CONTRACTS §5) | 1 ms |
| the per-sol pass (gossip, careers, arcs, the roster) | 20 ms in the `local@00:00` job (CONTRACTS §5), spread over 20 ticks |
| a 30-sol chapter skip | 0.6 s behind the splash |
| save | CONTRACTS §7 and TECH §6.6: tier 1 3.7 KB each, tier 2 2.2 KB, `happenings` at most 1,200 records, `people` at most 560 KB |

### 13.3 Entering and leaving an area

An area change is a scene cut (TIME.md and PLACES.md). Everyone whose `whereIs()` puts them in the new area is materialised at their spot, mid-activity, with a task matching the activity and its remaining time (the bay at 21:40: some in racks reading, two at the head, the squad leader at his desk). Leaving, each actor's state is written back to its sheet and they carry on at L2. During play, someone scheduled out of the live area walks to the door and leaves; someone scheduled in comes through a door, never out of thin air in view (tradecraft's "out of a door" rule). If you follow an NPC through a door, you both change area together.

### 13.4 Determinism and skips

Every schedule offset, variance and roll is a hash of (person, sol, block) or a stream keyed by absolute indices (`stream('people', kind, solIndex)`), never the main rng in a way that depends on what the player did first. Per-hour and per-sol passes are keyed to absolute hour and sol numbers, so skipping one sol gives the same off-map result as skipping twenty-five hours (the test compares the JSON). On-map deviations are written as overrides that expire at the next block boundary, after which the schedule takes back over. The save-and-load test of tradecraft (`tests/world.test.mjs`: 3,000 ticks run twice, once with a save and load in the middle, identical JSON) is kept, with the mess hall at noon as its scene.

### 13.5 Grounds, habs and the near ring

Base Melas's ground is one area of 1,000 × 700 m (PLACES §4.1), and a company of about 190 crosses it at every block change. If being "on the live area" made people L0 or L1, the 48 would overflow into puppets for ordinary traffic and the sim would pay for people a kilometre away. So, on `ground` and `hab` areas (PLACES §1.3) (my call, after the critics):

- **L0 and L1 only inside the near ring** round the player: a person is materialised as an actor at `REACH_M` 56 m and let go at `DROP_M` 96 m, PLACES §2.4's chunk ring, so actors always stand on built chunks. Beyond it, people are L2: `whereIs()` puts them on their route's polyline in closed form (PLACES §2.3), with no movement, no thinking and closed-form needs.
- **The handover** happens out of view. Coming in, a person is placed on the nearest free cell of the real A* path at their progress (PLACES §2.3) with a task matching their activity and its remaining time; going out, their state is written back to their sheet. 56 m is twice the frame's half-diagonal of 27.5 m (TECH §9.3), so no handover is ever seen. An open far window (VIEWS §2.4) is a second focus with the same ring round its point, so people there are actors before its dissolve shows them.
- **Interiors** (`floor`, `deck`, `craft`, `ring`: at most 120 × 80 m) keep the whole area at L0 and L1, as in §13.1.
- **The crowd bubble** on grounds and habs is the same radius (§12.1).
- **Formations are blocks** (my call). A unit in ranks (a formation, a column on the march, the memorial's company) moves as one path, each member at their mark's offset (PLACES §2.6's formation marks), and stands without thinking: one solve and one steering step whatever its size, and its members do not count against the 48. They are L0 for perception and needs (they see, hear and fidget, §10.12) and think again at "Fall out." PLACES's company layout (platoons abreast, three ranks, 1.0 m files) is about 62 m wide, so the 40 m frame holds about 130 of a company's 191, under `MAX_PEOPLE` 256. A battalion formation in one frame (0.4 at the earliest) still needs distant ranks drawn as one card a rank (§20).
- **The test** (`company-march`, in `people.perf.test.mjs`; TECH §16.7's bench scene of that name, CONTRACTS §8, beside its `parade-platoon` of 42 persistent and 20 crowd; the name settled in CONTRACTS §19, item 4): Echo Company, 191 people, crossing the ground from the barracks to the mess at a block change one by one, with the player among them; then formed up and marched across the parade deck. Each second it prints the counts at L0, L1, as puppets and at L2, the actors, the figures in the frame, the handovers in view, and µs a tick. Passes: L0 + L1 ≤ 48, actors ≤ 168, figures in the frame ≤ `MAX_PEOPLE` 256, handovers in view 0.

---

## 14. Injury, death and replacement

### 14.1 Sick call, light duty, hospital

NPCs are hurt and fall ill by BODY.md's model, like the player. Anyone with a condition past its mild stage goes to **sick call** (07:00–08:00 at the aid station, rung 5 if urgent, 7 if not). BODY.md's care decides the outcome; this section turns it into a schedule: **return to duty**; **light duty** for N sols (no PT, no field: an override that swaps those blocks for desk work at the company office); **sick in quarters** (the rack, meals carried in by a squadmate on the roster); **admitted** (an override to the hospital for BODY.md's stay). A `shammer` at a low-stakes block may go to sick call to dodge it (a temptation lapse, §6.5): the corpsman's Medicine against their Social, and if caught, malingering (§11.3).

### 14.2 Hurt NPCs in the moment

Off the battlefield, tradecraft's wounded ladder (`src/sim/wounded.js` `choose()`, line 92) ports with its thresholds (BODY.md's pain limit and shock): floored, they lie; over the pain limit, they sit against the nearest wall within 3 m; dizzy, they sit; legs gone, they crawl to the wall; in danger they can see, they flee if they can. Marines are "trained" for knockdown (tradecraft ×0.4) and stay in the fight on COMBAT.md's terms.

### 14.3 A death in the unit

Longhaul's rule holds (2026-10-31): a death is consistent, grieved and never undone, and the dead come off the roster.

1. **At once**: the body stays where it fell until it is recovered (tradecraft: casualties are not recycled); on base the corpsman and the officer of the day are there in 10 to 20 min; in the field, COMBAT.md's casualty handling.
2. **Grief**: stress and morale hits scaled by the tie (§5.4): a buddy stress +40 and morale −35, a friend −25, the squad −15, the company −8; buddies start the grief arc (§15).
3. **The rack is stripped** within 2 sols by a designated NCO of the squad, who inventories the belongings and writes the letter home with the commander (CAREER.md). The empty rack stays empty, visibly, until a replacement arrives.
4. **The memorial**: 3 sols later in garrison (2 to 5 on deployment), a lived ceremony: the company in formation, the battlefield cross (boots, rifle, helmet, identity tags; SETTING.md's customs), the commander and the chaplain speak, the roll call with no answer. The dead go on CAREER.md's memorial; the event is weight 5 and never forgotten.

### 14.4 Replacement and the billet shuffle

- **The shuffle, at once**: the squad leader fills the gap from inside (the most senior junior moves up a billet; the rifleman's billet is left empty), and the squad runs short until a replacement comes. Leaders are filled by seniority and trust: a corporal fire team leader killed makes the senior lance corporal the new team leader.
- **Replacements**: in garrison, new joins arrive in batches every 14 sols (my call) from the infantry school, generated by the roster generator as boots (T1 if they come to your squad); on deployment, with the next personnel transport, whose timing is TIME.md's voyages (30 to 60 sols to Jupiter). A replacement inherits nothing but the billet: the squad's ties to them start from compatibility, and their ties to the dead are none, which the squad notices ("He never knew Okonjo.").

### 14.5 Turnover

People leave alive, too, and that keeps the unit real. EAS comes at the end of each enlistment (CAREER.md sets the terms); the reenlistment chance is `clamp(0.35 + (morale − 50)/100 + 0.1 × drive + (has a buddy in the unit ? 0.1 : 0), 0.1, 0.8)`. NCOs transfer every 3 years ± 6 months. Promotions follow CAREER.md's rules from each person's timeline (§3.11). Expected yearly turnover in a line company: about 30%. Departures gather at the month's end into a "hail and farewell" in the rec room (a lived evening event the player may attend). Old friends who leave stay T2 with their ties, and may write (CAREER.md's letters). Natural death by longhaul's Gompertz hazard (`0.00005 × e^(0.095 × age)` a year, `js/sim/careers.js`) is kept for completeness; at these ages it almost never fires.

---

## 15. Story arcs

### 15.1 The engine

An arc is a template: a **cast** (roles filled by eligible people), a **trigger**, **stages** (each with a duration range, flags that change behaviour, **beats** the player can see or hear, and exits with conditions), and **ends** with effects. Arcs run on persistent people, in closed form off the map (stages advance at sol boundaries) and live on it (beats play when the cast is on the live area). Arcs are told only through what the player perceives, is told or overhears, and every ending reaches the player by those same means (§15.5). Arc templates are data modules (TECH §2.4): their conditions are strings in a small grammar parsed once at load (§15.4), and their flags are plain values. The templates are an authored pool, like the names and the lines; which of them a world's people live, who is cast in each and when it starts are drawn (§15.2), so no arc belongs to a written character.

```json
{
  "id": "dear-john", "weight": 3,
  "cast": { "who": { "tier": [1, 2], "needs": "partner-at-home" } },
  "trigger": { "on": "mail-call", "p": 0.004 },
  "stages": [
    { "id": "letter", "beats": ["reads-a-letter-alone-at-the-rack", "folds-it-very-small"],
      "effects": { "stress": 35, "moraleMod": -15 }, "exits": [{ "to": "withdrawn" }] },
    { "id": "withdrawn", "sols": [2, 6], "flags": { "needsComfort": true, "skipsChowP": 0.4, "socialK": 0.3 },
      "beats": ["quiet-at-chow", "buddy-asks-you-to-talk-to-them"],
      "exits": [{ "to": "mending", "when": "comfortScore >= 3" },
                { "to": "spiral", "when": "sols >= 6 && comfortScore < 2 && (who.drinker || who.morale < 25)" },
                { "to": "mending", "when": "sols >= 6" }] },
    { "id": "spiral", "sols": [3, 10], "flags": { "libertyIncidentK": 4, "temptationK": 3 },
      "beats": ["drunk-in-the-bay-after-taps", "late-from-liberty"],
      "exits": [{ "to": "office-hours", "when": "who.discipline.rung >= 4" }, { "to": "mending", "when": "comfortScore >= 4" }] },
    { "id": "mending", "sols": [5, 15], "beats": ["laughs-at-chow-again"], "end": "recovered" },
    { "id": "office-hours", "end": "punished" }
  ],
  "ends": { "recovered": { "news": "doing-better", "ifHelpedBy": { "role": "player", "beat": "thanks-you", "gauges": { "trust": 1, "affinity": 2 } } },
            "punished": { "news": "office-hours-result" } }
}
```

A template is data shared by every world, so it holds no world's ids: the player is the role `player`, resolved through `playerId(state)` when the end fires (in this world `p233`; CONTRACTS §10), as the cast's roles are resolved to the people who fill them. `comfortScore` counts comfort given (§10.10): listening 1, a successful reassurance or story 2, getting them help 2. Flags are named values the behaviour model registers (`needsComfort`, `skipsChowP`, `socialK`, `libertyIncidentK`, `temptationK`, …); an unknown flag fails the syntax test as an unknown name does (§15.4).

### 15.2 The director

Once a week (`week@Monday/00:00`, CONTRACTS §5), the arc director counts the beats the player perceived last week. Pillar 8 asks for a story beat each week: if there were none, it advances an arc in the player's squad or starts one; it never runs more than 3 active arcs in the squad or 6 in the platoon, and places beats where `whereIs()` says the player will be (chow, free time, the bay before taps). Like longhaul's hourly encounter director, it is cheap and runs only around the player.

### 15.3 Templates

| Arc | Cast | Trigger | Shape | The player's levers | Ends |
|---|---|---|---|---|---|
| Dear John | one with a partner at home | a letter at mail call | letter, withdrawn, spiral or mending | comfort; covering; reporting the drinking | recovered (ties), punished, or a transfer |
| The bully | a `bully` senior LCpl, a boot target (the player in the first 30 sols, or another boot) | 10 sols after a boot arrives | ribbing, then chores pushed onto the target, then a "lesson" | stand up (hard talk), report, endure, rally the squad | stopped, an NJP for hazing, the target broken (transfer request) |
| The shammer | a `shammer` | a failed bay inspection traced to them | the squad's resentment grows; field day again | confront, carry them, report | shapes up or is counselled out |
| The board | two LCpls of near cutting score | a corporal's billet opens | rivalry, study, PT, sniping | help one, stay out, sabotage (an infraction) | one promoted; the other bitter or gracious |
| Family emergency | a `homesick` marine | a message from home (CAREER.md) | asks for emergency leave; the chain's answer | carry their request (a hard talk with the platoon sergeant), cover their duties | leave granted (absent for TIME.md's travel), or denied (morale −15) |
| Money trouble | a `gambler` | a loss at cards on pay day | borrows, owes, a theft in the bay | lend, warn, report | paid off, theft and NJP, or a friendship lost |
| The drinker | a `drinker` | three liberty nights in a sol-week | contraband in the bay, a drunk at taps | confront, hide it for them, tell the squad leader | dry out with Doc's help, or office hours |
| Recon dreams | a fit, driven marine | a selection notice (CAREER.md) | asks you to train with them at 05:00 | train with them (both gain fitness: BODY.md), doubt them | selected (leaves the squad), or fails and comes back changed |
| Belter blood | a naturalised Belter | an `earther-hater` or a Belter slur at chow; sharper on the Europa voyage | slights, a fight, divided loyalties | stand with them, stay out | accepted, or transfer |
| The last pump | a Sgt near EAS | 60 sols before EAS | will they reenlist; the squad's future | ask them to stay | reenlists, or leaves (a hail and farewell) |
| The screw-up | a low-skill boot | a muzzle flag at the range | keeps failing; the squad carries or cuts them | mentor them (instruction hours), or not | improves, or a negligent discharge and a transfer |
| The feud | two squadmates with affinity ≤ −3 | a theft or an insult | barbs, a fight in the head | mediate (hard talk with each), take a side | made up, or one moves squads |
| Faith | a `devout` marine | a death, or a hard week | questions, the chaplain | talk, go with them to the chapel | faith kept or lost (their tags change) |
| After contact (0.3) | anyone in a firefight | COMBAT.md's stress after action | nightmares, startle, the rack at noon | comfort, Doc, the chaplain | recovers, or a medical board (CAREER.md) |
| Water rights | a `terraformer` | news of a water dispute at home (SETTING.md's politics) | anger at the Congress, at the Navy's budget | listen, argue | flavour; morale |
| The pen-pal class | the squad | a schoolchildren's letter to the unit | the squad writes back together | join in | morale +4 for those who wrote |

The stretches of §11.11 add their own pool: the run, the duty corporal, the job, the hard case, the one who breaks, the chaser, the cellmate, the comeback, the desk, the misfits, the new join.

### 15.4 Conditions: a small grammar

Arc exits and triggers carry `when` conditions written as strings, and TECH §2.4 allows data modules no functions. Rather than an `eval` (unsafe, and opaque to the syntax checks) or a parser per arc, there is one grammar (my call, after the critics), parsed once at load by `people/arcs.js` into a plain-data tree and evaluated by a pure walk of it:

```
expr  := or
or    := and ( '||' and )*
and   := not ( '&&' not )*
not   := '!' not | cmp
cmp   := sum ( ( '<' | '<=' | '>' | '>=' | '==' | '!=' ) sum )?
sum   := atom ( ( '+' | '-' ) atom )*
atom  := number | 'true' | 'false' | name | '(' expr ')'
name  := ident ( '.' ident )*          ident := [a-z][A-Za-z0-9]*
```

- **Names are registered**, by the arc engine and by the domains it reads: `sols` (sols in the stage), `comfortScore`, `beatsSeen`, `ifHelped`; `who.<x>` and each cast role (`partner`, `bully`, `target`) with `.<x>`, where `<x>` is `morale`, `stress`, `fear`, `trust`, `affinity` (toward the player), `rank` (the grade's number), `traits.<axis>`, `discipline.rung`, `tie.<role>.affinity` and every tag of §3.6 in camel case (`who.drinker`, `who.letterWriter`: true or false); `world.deployed`, `world.sol`. A name evaluates to a number or a boolean; a comparison of a boolean with a number is a parse error.
- **Checked**: `tests/syntax.test.mjs` parses every arc's conditions and fails on a syntax error or a name that is not registered, and lists registered names no arc uses. No `eval`, no `Function`. A cast's `needs` ("partner-at-home") is a named predicate registered the same way.
- **Deterministic**: no randomness inside a condition. A chance is a stage's own data (`"p": 0.004` on a trigger), drawn from `stream('arcs', arcId, solIndex)`.

### 15.5 Endings the player hears of

After a week of comforting a squadmate, silence at the end reads as a bug, and a player who never sees results stops investing (the critics). So (my calls):

- **Every ending is news.** Each end posts an event of weight 2 (`arc-end`, with the end's `news` key: "doing better", "office hours: reduced to PFC", "transferring to Bravo") into gossip (§9), with juiciness ×2 for listeners in the cast's squad, so that it reaches the player within 7 sols with probability at least 0.8 by overhearing, by "what's the word?" or by someone telling you.
- **The fallback.** If the player has not learned it after 7 sols, it is named at the squad leader's weekly word (CAREER §6.4, the rest sol's evening), or at the hot wash on deployment (COMBAT §17.2), as one line of the squad's news.
- **Thanks always plays.** An ending the player helped (`ifHelpedBy`: comfort given, a confidence kept, a stand taken) carries a thanks beat that the director places where `whereIs()` says the player will be within 3 sols, played live (an NPC-started talk outside the 4-minute cap, §10.2), never skipped. Its gauge effects apply when it plays.
- An ending kept secret by the cast (a `discreet` person's confidence) is told as its surface ("He's all right now. Leave it.").
- `people.arcs.test.mjs` prints the share of endings the player learned within 7 sols by gossip (target ≥ 0.8), within 14 by any means (1.0), and the thanks beats played against those owed (all).

---

## 16. Reuse: what is ported from where

| Source | Verdict | What changes |
|---|---|---|
| tradecraft `src/sim/people.js` (`sheet`, `nudge`, `drift`, `passerby`, lines 19–45 and on) | **adapt** | the record grows (§2.3); drift goes toward a baseline; NPC ties added; Martian, Belter and Earther names and looks from SETTING.md replace Moscow's |
| tradecraft `src/sim/interiors/staffing.js` (rota by hash, lived or put right after a jump, errands, `unstick()`) | **adapt (the core of §4)** | one embassy rota becomes per-person role templates on the Plan of the Day; `whereIs()` replaces `rota()`; unstick never moves anyone in view |
| tradecraft `src/sim/crowd.js` (the bubble, density curve, spawn unseen, recycle at 120 s, casualties kept) | **adapt** | areas instead of street rows; POD-driven density; district moods |
| tradecraft `src/sim/habits.js`, `src/sim/agents.js` (routes with stops, walking on off-map) | **adapt the pattern** | a generic nav grid (PLACES.md) instead of `city.js`; persistent people off-map are looked up, not walked |
| tradecraft `src/sim/perception.js` | **adapt** | line of sight on the 0.5 m sight grid with `clearLine` and the player's shadowcast mask (§7.6), instead of rays against binned walls; helmets, vacuum, NVG, fatigue; hearing added, with one air law (§7.3); shop-window mirrors dropped |
| tradecraft `src/sim/onlookers.js`, `src/sim/wounded.js`, `src/sim/emergency.js` | **adapt** | the gather-or-clear ring and the wounded ladder keep their numbers; emergency calls become the duty desk and the aid station |
| tradecraft `src/sim/interact.js` (`atHand()`, options with `ok`/`why`, promotion on touch) | **adapt** | military options (Report, Order, Salute); the street violence content goes to COMBAT.md |
| tradecraft `src/sim/talk.js` | **reference only** | four canned lines and `mood()`; §10 is new |
| tradecraft `src/sim/cqc.js` (the triangle, edges, reading, adaptation) | **reference (pattern)** | becomes the hard talk with half the reading rate |
| tradecraft `src/sim/acts.js` `say1()`, `src/sim/tutorial/earpiece.js` pacing | **reuse** | barks picked by hash; 3.5 s + 1/3 s a word |
| tradecraft `src/sim/belief.js`, `src/sim/know.js` | **reference** (SKILLS.md owns reading) | the character's read of gauges, never numbers |
| tradecraft `src/sim/campaign.js` `plan()`, `pass()` | **reference** | week-ahead planning becomes the duty roster; the day's catch-up becomes the per-sol pass |
| longhaul `js/sim/crew-ai.js` (`taskLevel` 228–243, `pickJobFor` and its deferral 332–384, `planCouches` 502–547, `taken()`, `stepEat` 1084–1137, `stepRescue` 1180–1225, the bad-air reflex 742–751) | **adapt the patterns; `planCouches` as is** | the ladder gains rungs for orders, customs and duty posts; minute steps become seconds; the 0.8 tiles a minute walking is dropped |
| longhaul `js/sim/ship-layout.js` (`tableSpots`, `counterSpots`) | **adapt** | spots and queues on PLACES.md's fixtures |
| longhaul `js/sim/jobs.js` (62 lines) | **reuse as is** | the board for working parties, details and the base's jobs |
| longhaul `js/sim/needs.js` (`moraleTarget`, `moraleFactor`, `efficiency`, `MOD_FADE`) | **adapt** | §5.4's terms; BODY.md's needs instead of four 0–100 bars |
| longhaul `js/sim/duty.js` (`scheduleBlock`) | **adapt** | Navy watches aboard the troopship |
| longhaul `js/sim/careers.js` (ages by role, homes, Gompertz, records, memorial) | **adapt** | Marine billets and ranks; career timelines in closed form |
| longhaul `js/sim/names.js` (culture pools, registry) | **reference** (SETTING.md curates the pools) | the registry made persistent for people |
| longhaul `js/sim/boarding.js` (the Poisson fight minute) | COMBAT.md's | fights the player is not in |

---

## 17. Testing: the numbers the tests print

All under `tests/` (TECH.md's runner; QUICK leaves out the heavy ones). Each prints its numbers; the passes are the targets in brackets.

- `people.roster.test.mjs`: 100 companies. Ranks per billet against the weights; ages by rank (mean, min, max); homes in percent against SETTING §4.7's shares (each within 2 points) and women against its 30%; trait histograms; full-name duplicates (0); family-name repeats per company (≤ 1 each); no blocked name (SETTING §12.6) and no "Innis Shallow"; the golden first squad of seed 1 (names, ranks, tags, voice quirks), unchanged.
- `people.schedule.test.mjs`: `whereIs()` at 30 times across a sol for every T1, with posture and path; for walkers, the point at the walked fraction against PLACES's route (within one cell); formation attendance (≥ 98% off temptation); mess occupancy by 15-minute bin; fire-watch spread over 8 weeks (≤ 1); skip equivalence (one sol against 25 hours: identical JSON).
- `people.behaviour.test.mjs`: a full sol on 2nd Platoon's floor of Echo's barracks (PLACES §4.4) with 44 persistent people at L0: the reveille queue's longest wait (≤ 12 min), the mess line's longest wait (≤ 8 min), double bookings (0), stuck events (0), anyone moved in view (0), late arrivals per 100 person-sols by drive.
- `people.temptation.test.mjs`: 365 sols of a company off-map: lapses a sol (about 1), by kind; liberty incidents per 100 nights out; detections; rungs reached.
- `people.gossip.test.mjs`: the §9.5 table within 10 points; the distortion rate (8% ± 2); the share of the platoon holding a distorted version of a weight-3 event after 7 sols.
- `people.talk.test.mjs`: success rates for each approach × gauge from −5 to +5 at Social 5, 10 and 20; hard-talk win rates by Social gap (the §10.11 table within 3 points); blow-up rates. **Talk and the gauges** (§10.4), 30 sols each: the *farmer* bot (each of the 12 squadmates visited every sol for small talk, ask and tell, no shared time) against the *social* bot (chow at the squad's table, cards twice a week, two walks with someone a sol, no rounds of the bay): mean affinity gained per squadmate at sols 7 and 30, and the days the talk cap bit. Passes: the farmer under +0.6 a squadmate by sol 7 (the old table gave about +1.25 a squadmate a sol, the gauge's top within the week); the social bot ahead of the farmer at both dates. **Walk with** (§10.16): lines played per walk to chow, walks ended at forks, time stood still during a walk (only at a card).
- `people.voice.test.mjs` (heavy): 60 sols of a squad with the social bot and the squad's barks: per speaker, lines repeated to the player within 3 sols (0); the share of callback lines and of quirk lines; the pool sizes used; the sol the player's nickname was given and how many squadmates use it at sol 30.
- `people.sight.test.mjs`: §7.6's three comparisons on 200 seeded scenes (the mask against `clearLine` for every cell, the player's sightings against the mask, `clearLine` both ways on 10,000 pairs): mismatches (0); the shadowcast's µs per recompute and recomputes a second at a walk.
- `people.hearing.test.mjs`: `airK` and `airDb` at the §7.3 table's pressures (to 0.01 and 0.1 dB); each sound's audible radius at 101.3, 66, 40 and 17 kPa and in vacuum; the same helper's value read by COMBAT's `HEAR_M`, WEAPONS's heard radius and VIEWS's gain (one function, the same numbers).
- `people.discipline.test.mjs`: the rung chosen for each infraction × priors; office-hours findings against evidence strength; a year of a careless-player bot (late 1 sol in 5, a muzzle flag a week): counsellings, NJPs, whether separation starts. **The stretches** (§11.11): remission granted by the sol it was asked for, good-conduct time earned by incidents, trusty status reached, the rear party's sailing made or missed; a story beat in every week of every stretch (≥ 1).
- `people.inspection.test.mjs`: bay `kept` over a week with and without field day; gigs per inspection by drive; the share of failed bay inspections. **Attend mode** (§10.12): game and real seconds of the morning squad inspection (about 240 and 120), Friday's platoon inspection (about 720 and 240), colours (60 and 15); bearing checks rolled and fidgets seen by need state. **Upkeep**: activities a week a player needs to pass every morning inspection (square away 2 to 3, the bag 2 to 3, a barber visit about 0.7), against the old rota.
- `people.habits.test.mjs`: a recruit bot walking Base Melas's main street at the noon block change for 10 sols: salute prompts a walk before and after the habit is owned, lapses by fatigue, prompts back aboard a ship and for an unfamiliar uniform.
- `people.crowd.test.mjs`: crowd counts by hour in the mess and on the main street; spawns in view (0); recycling after 120 s; on the ground, crowd agents beyond `DROP_M` (0); Europa: a district's mood after each event in §12.4; protest and riot rates by mood; queue waits by λ and S.
- `people.arcs.test.mjs`: 52 weeks: beats the player could perceive per week (minimum ≥ 1), arcs started and ended by kind; endings the player learned within 7 sols by gossip (≥ 0.8) and within 14 by any means (1.0); thanks beats played against those owed (all); every arc's conditions parsed against the registered names (0 unknown).
- `people.perf.test.mjs`: µs a tick in `mess-noon` with 48 persistent, 12 puppets and 100 crowd (CONTRACTS §8; ≤ 500, TECH §16.2's share); path solves and node expansions a tick against TECH's caps; figures in the frame (≤ `MAX_PEOPLE` 256); `company-march` (§13.5): L0, L1, puppets and L2 a second, handovers in view (0); the minute, hour and sol passes; a 30-sol chapter; people's share of the save.
- `world.determinism.test.mjs` (TECH.md's, with this scene): 3,000 ticks twice, once with a save and load at 1,500: identical JSON.

Debug (TECH.md's handle): `__olympus.people.list()`, `.whereIs(id, ms)`, `.sheet(id)` (gauges as numbers, in debug only), `.arc(id, stage)` to force a stage, `.happenings()`, `.gossip(happeningId)` to see who knows what; URL `?people=debug` draws awareness and booked spots over the stage.

---

## 18. Fun

**The decisions people create.** Whether to take Okonjo's slip watch for a marker you will need before inspection. Whether to cover for a buddy who came back late, knowing the platoon sergeant's rules axis and that Halloran saw. Whether to report the drinker, to hide his bottle, or to sit with him on the footlocker. Whether to confront the lance corporal who has been pushing his chores onto the new boot, in front of the squad, with two of them on your side and the bully's temper what it is. Whether to object to an order, and how, and to whom. Whether a joke at chow is worth the risk with a sergeant at the table. How you spend free time, because free time is when people become people, and it is time, not talk, that wins them: the gym with the recon hopeful, the comm booth line, cards in the rec room, the walk to chow with the one you want to know better.

**The stories it tells.** The negligent discharge at the range that you never live down, retold bigger each sol until someone who was there sets it straight. The squadmate who reads his letter alone, folds it very small, and stops coming to chow. The inspection your locker failed for the whole bay. The empty rack after the memorial, and the new join who never knew him. The week someone in the squad first calls you by a nickname. The cellmate in the brig whose guard was your old fire team leader. On Europa, the union man at the checkpoint whom you talked down on Tuesday and who is leading the crowd on Friday.

**Where it turns into chores, and what removes them.** Field day, mess duty, fire watch, formations, queues and salutes are the texture of the life, and lived in full they would be chores. Field day and mess duty are activities (TIME.md) with outcomes set by your participation and the squad's drive, and their papers. Fire watch is "waiting on watch": skipped behind the splash in chunks, interrupted when something happens (a drunk coming in, a fire alarm, a squadmate who cannot sleep and wants to talk). Formations, colours, briefings and mail call run in attend mode: fast until they reach you, 1:1 when they do, with your bearing as the small stake. Salutes and "attention on deck" are one T press on the instinct's line until they become the body's habit. Upkeep for inspections is one square-away and a laundry bag. A queue is an R "wait your turn" with its own small skip. Inspections are lived where they bite: a minute of a sergeant's face 20 cm from yours, the rest of the ranks at ×4. Restriction, the brig and limited duty are chapters with a goal, so failure is a story with a way back, not a stretch of empty sols.

**The rhythm** (pillar 8): routine by day, a spike from people (an arc's beat, an inspection, a confrontation, an order you did not expect), and the bay at night, when the racks talk before taps and the week's gossip comes to you.

---

## 19. Build order

**Before 0.1**: the actor shape of §2.4 with `y`, `vy`, `att` and `anchor` at their defaults, from the first save that holds actors (0.0.3), so the shape never has to change under the saves.

ROADMAP §3.4 holds the milestone numbers (CONTRACTS §18).

**0.1.0, a standby week at Base Melas, the core career** (ROADMAP §5.2):

- the roster generator for the whole company and Base Melas's T3 staff; T1 and T2 sheets; the player's arrival in the empty billet;
- the garrison Plan of the Day templates for all roles in the 1st Squad's day and the company's; the duty roster with fire watch, the duty NCO and runner, working parties, head detail and field day (guard and mess duty for NPCs, as overrides only);
- `whereIs()` with posture and path, L0 to L3, area entry and exit, puppets; the near ring on the ground and formations as blocks (§13.5); the ladder rungs 3 to 11 (no combat); utility; booked places and queues (racks, heads, showers, the mess line and seats, the armoury window); customs in motion (salutes, attention on deck, morning colours) and the salute habit;
- NPC needs in closed form and BODY.md's slow layer on the map; morale; hygiene seen by others;
- perception ported on the one visibility primitive (the sight grid, `clearLine`, the player's mask, §7.6), with hearing through the one air law (§7.3); witnessing;
- gauges toward the player and NPC ties; the exchange table with its repeat rule; shared time, the talk cap and ties kept alive by talk (§10.4); markers; the read as words;
- happenings, memory and gossip on the map;
- conversation: small talk, ask about them, what's the word, shop talk, ask for help, ask permission, swap a duty, borrow and trade, report, comfort, rib; orders received; forms of address and the etiquette breaches; barks and joining in; briefings and mail call in attend mode, with the bearing check (§10.12); walk with (§10.16); voices: the line rotation, callbacks, quirks and the player's nickname (§10.14);
- discipline: the infractions that can happen on base in a week, rungs R0 to R2 lived, R3 and above as papers (every class of infraction has a rung to land on from the first range day);
- inspections: morning personal (in attend mode), Friday's bay, the armoury's weapon inspection; square away and the platoon's laundry bag;
- the base crowd in the mess hall, on the main street and at the PX;
- the tests above, minus Europa's and 0.1.x's.

**0.1.x, the rest of the week** (ROADMAP §5.8, with `test-office-hours`):

- gossip off the map (the negligent discharge must spread: the platoon's story by the third sol, §9.5);
- discipline in full on base: R3's platoon-office scene and R4 lived (office hours), R5 and above as papers; restriction and extra duty as chapters with their goals (§11.11);
- temptation lapses for NPCs (§6.5);
- arcs: Dear John, the shammer, recon dreams (one of them the director's first beat), on the condition grammar (§15.4), with every ending reaching the player (§15.5);
- `people.temptation` and `people.arcs`, with `people.discipline` and `people.gossip` grown to R3, R4 and off the map.

**0.2, the voyage** (the troopship): embarked templates and Navy watches; secure for burn with `planCouches`; hot racks; NPCs in free fall on PLACES's handhold graph (§6.9), with the salute habit's shipboard context; NJP aboard ship with no right to refuse; the hard talk; the bully, the board, Belter blood and the feud arcs; correctional custody as a chapter (§11.11); the remain-behind element for a player left at Melas.

**0.3, Europa**: town civilians and district moods, with the near ring on the towns' habs; queues at checkpoints; protests and riots; Europa's T3 notables; deaths, the memorial, replacement and the billet shuffle on deployment; the after-contact and family-emergency arcs; limited duty as a chapter (§11.11); radio conversation in the field.

**0.4, the first dwell**: courts-martial as chapters, with the brig (§11.8, §11.11).

**0.5, at sea**: NPC orders given by the player as a fire team leader, once CAREER.md promotes to Corporal (in the first dwell, 0.4; ROADMAP §3.4).

**0.6 and 0.7**: special operations' small teams and operation-scoped people (hostages, targets, witnesses questioned in the hard talk), generated with each mission (CAREER §11.3). **0.8**: leading a squad (Leadership and orders at scale). **Later**: romance as arcs if the user wants it (§21); more arc templates, three kinds of everything.

---

## 20. Cross-references (what I rely on from other sections)

- **SETTING.md**: the rank list and insignia (to read rank and choose address); forms of address and customs (salutes and the visor tap, colours, attention on deck, the battlefield cross); the uniforms of the day; the MOS list behind the billets; name pools by culture and home (§12.1) and the nickname pools (§12.3), which the player's earned nickname draws on (§10.14); the homes with kinds and shares and the 30% of women (§4.7), taken as they stand (§3.4); the canon ledger (§1.2: no "Innis Shallow"); faiths; the calendar (the 7-sol week of §3.4, rest sols, sunset for colours); the Corps' code names for the infractions; Europa's factions' faces and town demographics; Lang Belta; the slang and sayings (§5.9) for barks and the turns of phrase; the public offices (§7.7), whose holders §3.13 generates and the registry takes first (§12.5).
- **TIME.md**: the Plan of the Day's block ids and times; the rule that talk costs no game time and the long-talk activities (counselling, cards, comfort through a night), kept: shared time answers the farming that open question 2 would otherwise invite (§10.4); activities for corrective training, EMI, extra duty, restriction musters, field day, waiting on watch, guard reliefs, mess duty, mail call, office hours, the memorial, inspections, the barber, sick call, queueing; the skip() contract calling `people.skip(state, fromMs, toMs)` (the minute, hour and sol passes); interrupts raised by people (a summons, an order, a fire-watch event, an NPC who needs you); chapters' papers (counselling, NJP, mail). This round asks TIME for:
  - the schedule lookup's one name, `whereIs(person, ms)`, with §4.6's shape, in place of `whereAt` (done: TIME calls `whereIs`);
  - the ship row of §9.2 to name the daily field day aboard in its `maintenance` block (§4.7; done, and CONTRACTS §4's "Aboard ship" row names it too);
  - **attend mode** (§10.12): the fast-forward engine (TIME §5.2) run at a capped rate of ×4, in stretches under `FF_MAX_MS`, dropping to 1:1 on PEOPLE's triggers from the `scene` record (§10.15), as a clock state or a skip kind of its own;
  - talk on the move (§10.16) running at 1:1 in the `run` state, with the ordinary talk card still `still`;
  - chapter kinds for the hard stretches (§11.11): `restriction`, `custody`, `brig`, `limdu`, `rear-party` (TIME §10.2), each with its goal on the day card;
  - TIME §8.5's `kit` as the "square away" activity, 20 to 30 min, and `laundry` as the fallback to the platoon's laundry bag (§11.10).
- **BODY.md**: the need variables and stage thresholds (urgency, §5.3); stress; locomotion by gravity and gait, and in three dimensions (§16.4 to §16.7: the actor's `y`, `vy`, `att` and `anchor`, §2.4); push-offs and grabs (§16.6) for NPCs in free fall; first aid actions and times; the pain limit, shock and knockdown for the wounded ladder; illness; hygiene stages; shave and hair growth; sleep onset and quality (snorers); G and couches; juice; the named modifiers the bearing check (fatigue, the bladder, heat or cold, pain, dust) and the habit check (fatigue, stress) read.
- **SKILLS.md**: the skill keys I use (`social`, `leadership`, `awareness`, `medicine`, `cqc`, `fitness`, `fieldcraft`, `tech`, `eva`, `zerog`, `marksmanship`, `weapons`, `demolitions`), with lying folded into Social as SKILLS.md settles; `check()`, `opposed()` and `checkText()`; NPC skill levels by rank and MOS; reading people (for §8.8); the instinct's line, which hosts the people prompts (salutes, duties, summons); instruction hours from advice; languages. This round asks SKILLS to confirm Nerve (§2.2) with a drill bonus of +6 as the bearing check (§10.12); to silence the `salute` rule (§14.4) once the habit is owned, bringing it back in new contexts (§6.6); and to have the `uniform` rule name, once, the evening before an inspection, what is off ("Boots want a shine. Haircut's due Thursday.", §11.10).
- **WEAPONS.md**: the muzzle cone and flagging; a weapon's visible states; the armoury's draw and turn-in times; cleaning thresholds for inspection; negligent discharge events; accountability (a lost weapon). This round asks WEAPONS to scale its heard radius (§7.12) by `airK(P)` instead of `pKpa / 101.3`; to give the G-11 stun's loudness on Mars from the same law (−1.9 dB, §12.5), keeping Sachs' law (§12.4) for blast injury only; and notes that segment rays against binned walls are now used only for shots, fragments, ricochets and cover (§7.6).
- **COMBAT.md**: the rules of engagement and escalation of force (the hard talk as the verbal step; unlawful orders); reading cohesion and trust; casualty handling in the field; the background fight resolver; non-lethal effects on crowds; detention; reflex cards (resisting MPs); the hot wash (§17.2), which names an arc's end the player has not heard of (§15.5). Its `HEAR_M` (§6) and `VOICE_M` (§8.1) are already §7.3's law and should call `airK`; the shout is its 1.6 × `VOICE_M`; its fighter's `anchor: "planted"` (§2.1) maps to `boots` or `feet` (§2.4); its zero-g fighter (§14.5) plans on PLACES's handhold graph, as NPCs do (§6.9); its cover share (`keeps`) scales a target's visibility (§7.6).
- **CAREER.md**: promotion rules (NPC timelines and the player); pay forfeiture, reduction and discharge types; enlistment terms (EAS); leave, emergency leave and letters; the embedded tutorial with the squad leader as tutor; the memorial; the evaluation ledger for conduct and proficiency marks; selection notices; the squad leader's weekly word (§6.4), which carries one line of the squad's news when an arc's end has not reached the player (§15.5). This round asks CAREER:
  - §4.3: either take SETTING §4.7's shares for the player's birthplace draw, or say that its weights are the player's candidate draw and differ on purpose (`londres` 18 against 9, `redwater` 14 against 30, `callisto` 8 against 5); PEOPLE's roster uses SETTING's (§3.4);
  - §8.5: the meritorious board as three lived beats of about 2 minutes (the uniform inspection, the pull-up bar, the three questions), the waiting in attend mode or skipped (§10.12); its knowledge roll names Analysis, which SKILLS §2.2 dropped;
  - §5.8, §15.2, §15.7 and §16: the remain-behind element, limited duty and the brig as the chapters of §11.11, each with its goal and its paper, rather than stretches skipped with outcomes; conduct credit for a good extra-duty or custody report.
- **PLACES.md**: areas, rooms and fixtures with spots and queue floor; the nav grid and its reachability tests; doors (sight and sound); Base Melas's buildings and fixture counts (squad bays, heads, mess seats and staff tables, aid station, chapel, PX, gym, barber, comm booths, duty desk, parade deck and flagpole); light at a spot; air pressure for sound; bad-air status; Redwater; troopship berthing and couches; Europa's districts; the site graph's route polylines (§2.3), which place L2 people on grounds (§13.5); the formation marks (§2.6). The mess's 240 seats (§4.5) against the crowd: at most 168 actors simulated and `MAX_PEOPLE` 256 drawn (§13.2; CONTRACTS §8). This round asks PLACES for:
  - **the sight grid** (§7.6): walls, closed doors and fixtures rasterised into 0.25 m cells (built in v0.0.3) with three bits (blocks a prone, a crouched, a standing eye), built with each area and, on grounds and habs, each chunk, re-marked when a door moves, and the static index rasterised into the same cells along a far line on demand;
  - **the handhold graph** before 0.2 (§6.9): free-fall navigation as nodes on handholds, rails, mag strips and planting spots, and edges as push-offs with a clear line, a length and a speed, plus hand-over-hand edges, for NPCs and COMBAT's zero-g fighter alike.
- **VIEWS.md**: the talk box, order card, quick card and hard-talk display (K/L/M, edges, composure); balloons and edge markers; the People leaf; papers (orders, counselling, NJP, the duty board); "?" and "!" over heads; salute, attention and parade-rest poses; the crowd's look. This round asks VIEWS for: `whereIs` in place of `whereAt` (§5.1, §17; done); the audio gain `airDb(P)` in §11.2 in place of `20 log₁₀(P / 101.3)`, with its low-pass kept, and its `audio` test's dB by that formula; the `fog` test (§14) comparing the sim's mask as §7.6 sets it out; the walk-with chip strip (§10.16); attend mode's ticker, its 1:1 key and the fidget frames (§10.12); the doll's single "inspection-ready" state (§11.10); the nickname in balloons.
- **TECH.md**: the `src/sim/people/` modules of TECH §2.1 (`person.js`, `roster.js`, `schedule.js`, `behaviour.js`, `walk.js`, `steer.js`, `crowd.js`, `perception.js`, `hearing.js`, `relations.js`, `memory.js`, `gossip.js`, `talk.js`, `orders.js`, `discipline.js`, `arcs.js`, `lod.js`, `interact.js`, `names.js`), to which this section adds `voice.js` (rotation, callbacks, quirks, nicknames), `scene.js` (attend mode), `habits.js` and `arcs/` (the arc templates, as data modules); the tick steps (§3.1: `actors`, `look`, `think`, `paths`, `second`) and the minute, hour and sol layers; save shape; the perf harness; the debug handle. This round asks TECH for:
  - `whereIs` in place of `whereAt` (§5.4, §15.2's `tiers()`, §19; done);
  - `threat` (COMBAT §6.1) added to TECH §6.1's list of `mind`'s parts, written and read through `people/mind.js` (§8.8), with `mind.js` in §2.1's list of `src/sim/people/` modules (done);
  - §9.11 step 9: `fogcast.js` draws the player's mask that the sim's `look` step computes (§7.6), adding only easing and dither, inside `look`'s 0.15 ms row as measured;
  - the actor shape of §2.4 (`y`, `vy`, `att`, `anchor`) from 0.0.3;
  - `MAX_PEOPLE` 256 (TECH §16.7) as this section's figures budget; a battalion formation in one frame still needs ranks drawn as cards (0.4 at the earliest; §13.5);
  - the company march (§13.5: Echo's 191 crossing the ground, then in formation) registered as a bench scene beside §16.7's `parade-platoon` (done: TECH §16.7's `company-march`, CONTRACTS §8, and this section's test takes the name; CONTRACTS §19, item 4);
  - the arc condition grammar (§15.4) as plain data under §2.4's rule, and the syntax test's check of every arc's conditions and flags against the registered names.
- **ROADMAP.md**: the milestones in §19; 0.0.7's morning inspection in attend mode.

---

## 21. Open questions for the user

1. **Romance.** Should people fall for each other? My default: NPC couples exist as arcs, with the Corps' rules against fraternisation across the chain; a player romance only with someone outside your chain (a Redwater local, a sailor), off screen through the gauges, never explicit.
2. **Hazing.** Real barracks have it. My default: the bully arc exists, never sexual and never beyond a fight, always punishable, and the player can be its target only in the first 30 sols.
3. **How hard the law falls.** My default is the full ladder, with courts-martial and separation able to end a career (in Ironman, for good); a career ends only at a special court-martial or after separation for repeated NJPs, never for one bad week.
4. **Mess duty.** Real marines served 30 days. My default is 7 sols, so a standby period is not eaten by it.
5. **Refusing NJP.** Real marines may refuse it and demand a court-martial, except aboard ship. My default keeps that right, with its risk.
6. **Talking while walking.** The hub settles that "time stands still while you talk" (your words for tradecraft, 2026-10-26: "talk should pause the game, like combat"). Walk with (§10.16) keeps that for every talk card, but its one-key chips do not freeze time: the line plays over its spoken seconds while you both walk, as a combat step plays at 1:1 once chosen. The alternative freezes time at each chip and plays the line after. My default: the chips run with time, the cards stand still.
7. **Attend mode.** Scenes you are in but not driving (formations, inspections, colours, briefings, mail call) run at up to ×4 until they reach you, then at 1:1 (§10.12). The alternative is all of them at 1:1, as lived blocks are. My default: ×4, with a key for 1:1, and the memorial's roll call always at 1:1.
