# CAREER: one marine, from the enlistment paper to the memorial

Section owner: CAREER. Written 2026-11-05 against `docs/DESIGN.md` (the hub wins where we disagree) and the research notes in `docs/research/`; revised the same day after the design review by five critics (the start, the standby, the gates, the tour, the dose limits, the death budget). Everything here is decided unless marked **(my call)**, which holds until the user overrules it. Quotes of the user carry their date and where they were said. Revised 2026-11-06 for the user's two rules of 2026-11-05 (section 1): every person a career meets is generated, so the names in this section's samples and examples (Maren and Signe Holloway, Sgt Reyes, Ortega, Diaz, Okafor) are examples of what the generator draws, not written characters; the places are handcrafted, and the assignments, orders, opportunities and mission details are procedural. Revised again for v0.0.4 as built: the first standby's alert drill is drawn, an A interrupt mustered at the rack's foot (5.2, 5.4).

## Summary of the model

A career is one person's service record in one world. It begins at an **enlistment paper** (name, sex, age, birthplace, background worth up to +4 in a skill, why you joined, appearance, Standard or Ironman), then a **playable flashback** of three to five minutes at the recruit depot, where you meet the drill instructor whose voice stays in your head (generated at signing, as every person is: PEOPLE §3.1); the rest of boot camp and the School of Infantry are behind the recruit as papers. It is played from the recruit's **arrival at Marine Corps Base Melas**: your fire team leader meets the bus, the first afternoon is three stops walked on foot, the squad welcomes you at evening chow, and the Alert Battalion's alert drill wakes you in the small hours of the first night or the second (drawn, 5.2). Then comes a **standby of 10 to 14 sols** in which every tutorial is a block of the Plan of the Day that the squad leader teaches beside you, at most two new systems a sol, while a readiness checklist, the squad leader's expectations and the squad's Europa billets give the days a stake and the Congress' vote gives them a clock. The standby ends with a **mission rehearsal exercise** in the training village and the Talus, and then the **warning order** to Europa.

From there the career is a state machine (standby, predeploy, transit, deployed, dwell, leave, school, hospital, brig, separating) driven by a **career calendar** (pay every 30 UTC days, semiannual marks and fitness tests, annual qualifications, monthly cutting scores, annual boards, the end of the enlistment). Rank comes the way the real Corps gives it: automatically to Lance Corporal, by a **composite score** against a monthly **cutting score** to Corporal and Sergeant, by **meritorious boards** for the few, and by **selection boards** from Staff Sergeant up. Every one of those decisions is a readable line in the log, built like a check, and every gate the player prepares for is decided mostly by the preparation: lived events graded and summed, boards reading two dice and not one, the die only the margin.

Deployments come from a **catalogue** (the Martian Stabilisation Force on Europa, ship's detachments, boarding teams, Belt anti-piracy, Callisto garrison, consulate guard and more) filtered and weighted by the LONGHAUL politics running underneath. A Europa tour is lived day by day by default, with a sector board that keeps its score and three acts that give it a shape. **Reconnaissance** and the **Raiders** (special operations) are gated by fitness, record, age and G-conditioning; their schools are chapters with lived test days and **floors applied at graduation** (SKILLS §6.6, tradecraft's illegal-school pattern); their missions come from a **generator** that combines kinds, authored settings, oppositions, constraints and complications so that no two briefs read alike. The places are handcrafted and the same in every career; what the career is sent to do in them (assignments, orders, offers, a mission's objectives, opposition, intelligence, timing and where in the place it happens) is procedural, and so is everyone in them.

Pay is a table by grade and years in MCR with hazard, combat, afloat and special-duty pays, and buys a few pieces of personal gear that really help. Leave is lived in Martian towns. Family is generated at enlistment and writes back at the speed of light. Injury leads to limited duty and medical boards; the Corps' radiation limits are one table here. The enlistment ends in reenlistment or discharge; twenty years earn a pension. Death is budgeted: every lethal path passes through a decision or a warning, and the tests print the player's death rate for each kind of stretch. Death ends an Ironman career at the **last roll call**. Every death goes on the **memorial**, and the world's timeline continues so that the **next recruit** can enlist into it, perhaps into the dead marine's own rack. Reaching a rung unlocks starting at the rung below it.

---

## 1. What the user asked for

The section obeys these, in the user's words:

- **The brief** (2026-11-05): "we will play as a career military person who can be (or become) a foot soldier (with gameplay like getting on a drop ship to be deployed for peace keeping on Europa, then pretty realistic gameplay where we have to manage the day to day of that life (slow paced game, with emphasis on realism and depth [...]". "But the player can also become part of special operations teams and while still having to manage their own bodily needs and their weapon, will be dropped in much different special forces settings." "There should always be a base where we go back to do things like eat and shower at the end of the day." "You start as a marine on Mars, out of basic training and train on Mars on standby for a week or two, with the everyday training looking like what it should be, full days (Mars days not 24h) moving in real time until we do things that spend time like eating".
- **The world is handcrafted, what happens in it procedural** (2026-11-05): "game world is handcrafted, events and world politics, assignments, opportunities, mission details are all procedural". Base Melas, the ships, the FOB, the towns and the special-operations settings are authored places, the same in every career; the deployments offered, the orders cut, the schools and details opened, and a mission's objectives, opposition, intelligence, timing and where in an authored place it happens are drawn from the world's seed and the career's choices (sections 10 and 11).
- **All people generated** (2026-11-05, asked whether the persistent cast should be handcrafted): "All people generated". The drill instructor, the fire team leader at the bus, the squad leader, the people at the check-in's stops, the family, a mission's target: each is drawn from the world's seed out of authored pools (PEOPLE §3.1), and nobody is a written character.
- **Death per career** (kickoff, 2026-11-05): "Ironman keeps one autosave, and death ends the career. Standard lets you save anywhere and load after death. JSON export and import exist either way." The hub adds: "The world's timeline continues past your death, and the next recruit can enlist into the same world. The memorial keeps the dead."
- **Backgrounds** (tradecraft, 2026-10-27): "background should impact starting skills by up to +4 points (an ex marine would know how to fight)".
- **Tutorials** (tradecraft, 2026-10-27): "consolidated as tutorials, rewritten to really hold the hand of the player [...] a tutor on these missions, make it make sense [...] roleplay the instructions, maybe a radio and an earpiece that supplement the instinct"; "gate the tutorial behind the campaign, to make it linked to the character we pick". And 2026-11-04: "instead of teleporting us into the tutorials, should book the tutorial as an assignment we have to move to during a day we're not working [...] every tutorial should be rewritten to make sense as part of the campaign". And the consistency complaint (tradecraft rc30): "the point of bringing the tutorials in the career was to have consistency".
- **The start in your own place** (tradecraft, 2026-10-27): "when we start the campaign, it should be in the appartment of the starter character". For a marine that is the squad bay: the first afternoon walks you to it, and every later sol begins in your rack.
- **Years pass** (tradecraft, 2026-11-04): "we should track the year in game, because between stations, there may be mandatory trainings and long periods of time can pass"; "a campaign is the same until we start a new one (geopolitics and date/time continue on the same timeline when we die or retire an officer and pick the next one)".
- **Branches with gates** (tradecraft, 2026-11-04, on the illegal's post): "we'll ask for a successful posting and age under 30 [...] their tradecraft is boosted to 80 as they end their illegal training". This is the template for selection and floors.
- **Retirement at the end of a posting** (tradecraft, 2026-11-04): "Officers retire when they cross 60 years old and reach the end of a posting (they don't retire mid-post)".
- **Unlockable starts** (tradecraft rc26): "we unlock more and more advanced starters after a game over if we made it to the level +1 basically".
- **Rank from time and deeds** (LONGHAUL, 2026-10-22): "a rank that increases with time in service (baseline tick up, slow but steady), but also with each ship we destroy and each military mission we complete"; "the mission logs should be only military level missions".
- **Lives with depth** (LONGHAUL, 2026-10-25): "add more depth to crew (rank, experience, progression, death, age, retirement etc)… take your time."
- **Deaths that hold** (LONGHAUL v1.12.14, 2026-10-31): who goes with a hull doesn't come home: grieved, on the memorial, no body.
- **Variety** (tradecraft rc52): "there should be insane variety in mission descriptions and specifics". And "please generate at least three more kinds of everything".
- **Money** (tradecraft rc34): "we should get paid monthly and start with some money in our accounts".
- **Big outcomes need a splash** (tradecraft, 2026-11-04): an arrest "without a splashscreen that explains what happened, without a reflex action [...] without an animation" was a fault. Every career-ending moment here gets its splash and paper.
- **Time is a currency** (tradecraft, 2026-10-27): "pass the time things should be natural and time should feel like a currency". **No fast travel that skips play** (tradecraft rc50).
- **The three worries** (tradecraft, 2026-10-26): "clunky mechanics, an inconsistent experience, empty gameplay". The second is why every lesson here books into TIME's Plan of the Day by block id, and the third is why a tour's days are lived by default (2.2).
- **No magic inventory** (tradecraft, 2026-10-26): "very little storage space, no magic inventory, volumes and pockets". A mission's load-out is packed pouch by pouch (11.3).
- **Repeated lessons** (tradecraft v0.0.41): "once we did it once, remember it so next time … snap flash forward". The "I've got this" offer of 5.5 is its first-time form.

---

## 2. The career's shape

### 2.1 The state machine

`career.status` is one of these. Transitions are the only way a status changes, and each prints a paper.

| Status | What it is | Clock | Leaves to |
|---|---|---|---|
| `arriving` | The first afternoon: the gate, the sponsor, the three stops (5.1, 5.2) | 1:1 | `standby` (the three stops done, or `evening-chow` reached) |
| `standby` | At Base Melas, the Alert Battalion on notice to move: the first arc, ending in the mission rehearsal exercise | 1:1 and skips | `predeploy` (the warning order) |
| `dwell` | At home station between deployments: training, quals, schools offered, leave | chapters (week by week) with key days | `predeploy`, `school`, `leave`, `bbillet`, `separating` |
| `predeploy` | Orders in hand: 2 to 4 sols of packing, letters, last liberty, the move to the pad | 1:1 and skips | `transit` |
| `transit` | A voyage (TIME owns its handling) | chapters | `deployed`, `dwell` (going home) |
| `deployed` | On a deployment from the catalogue (section 10) | 1:1 key days, chapters between | `transit` (home), `hospital` (evacuated), `dead` |
| `school` | A course away from the unit (section 9), recon and Raider pipelines included | chapters, lived key days | `dwell` (graduated or dropped), `hospital` |
| `leave` | Annual or block leave (section 13) | 1:1 in town, chapters for long stretches | back to the status it left |
| `hospital` | In care (BODY owns the care; this section owns limited duty and boards) | skips and chapters | `dwell` (limited duty), `separating` |
| `bbillet` | A special-duty tour (drill instructor, recruiter, consulate guard school) | chapters | `dwell` |
| `brig` | Confinement after a court-martial | skips | `dwell` or `separating` |
| `separating` | The last 10 sols before discharge, retirement or medical separation | 1:1 and skips | `ended` |
| `dead` | The death sequence (section 19) | splash, papers | `ended` |
| `ended` | Over: the record is closed, the world goes on | none | (next recruit) |

`career.end` records how it ended: `kia`, `dow` (died of wounds), `nonhostile` (accident), `lost` (lost with a hull, no body), `eas` (term served, not reenlisted), `retired`, `medical` (separated or retired on disability), `admin` (administrative separation), `court` (punitive discharge), `deserter`.

### 2.2 Pacing targets (my call)

The hub's budget is 40 to 70 real minutes for an active sol. A four-year enlistment holds about 1,460 days, so the career decides which days are lived by default and which may be chapter days (a choice and a summary, TIME §10's mechanics).

**A deployment's daily life is lived by default** (my call). The brief makes it the game ("then pretty realistic gameplay where we have to manage the day to day of that life (slow paced game, with emphasis on realism and depth [...]", 2026-11-05), and "empty gameplay" is one of the user's three worries (2026-10-26). So on a tour the FOB is the base, and shifts, chow, the shower and the rack are activities, every day starting live at reveille. Chapter days are an **opt-in from the tour's third week**, never the default (10.4). The hub's loop table lists a deployment rotation among the chapters' stretches with its quiet days "chosen and summarised": here they are chosen, and the default choice is to live them. How much of a tour should be lived is put to the user (open question 10).

| Stretch | Sols or days | Lived by default | Real time, living every day | Real time with chapter days where offered |
|---|---|---|---|---|
| Arrival and first standby | 10–14 sols | every sol (no chapter days in the first arc) | 8–15 h | the same |
| Pre-deployment | 2–4 sols | every sol | 2–4 h | the same |
| A voyage Mars to Jupiter | about 7 days out at 1 G (6.87 door to door), 11 to 12.5 at 0.38 or 0.3 G (CONTRACTS §14) | key days (the flip, a drill, an alert), chapters between (TIME §12) | | 2–4 h |
| A 7-month Europa tour | ~210 days | **every day**; chapter days opt-in from the third week | 70–150 h (20 to 45 min a day) | 25–55 h (the first two weeks, 25–40 forced key days, and what the player chooses to live) |
| A dwell of 14 months | ~425 days | key days 15–25 (quals, boards, exercises, leave, family), chapters between | | 12–25 h |
| A 12-week school | 84 days | 4–8 test days | | 4–8 h |
| A four-year first term (two tours) | ~1,460 days | | 180–360 h | 75–150 h |

The numbers are targets (my call), checked by the `recruit` bot's real minutes per sol (5.11) and by a tour bot from 0.3. A **key day** in career terms is any day with: a qualification, a board, a school's tested event, the first and last day of a deployment, an operation, an inspection by the commanding officer, a ceremony (promotion, award, memorial), a family visit on leave, a tour's crisis (10.5), or an event the world raises (an alert, an evacuation). Key days are forced live (TIME §10.4). The player may choose to live any other day (tradecraft's rule, its DESIGN.md l.36).

### 2.3 The career calendar

Career administration runs on **UTC** (the Navy's calendar, DESIGN "Money"), whatever the local clock says. Ages are in Earth years of 365.25 UTC days (my call). Months below are UTC months.

| Event | When | Section |
|---|---|---|
| Pay day | Every 30 UTC days from the world's pay epoch, set when the world is made so that the first recruit's first pay day falls on sol 4 of the standby, the Friday (my call); every marine shares pay day | 12 |
| Cutting scores published | The 1st of each UTC month; promotions effective that day | 8.4 |
| Proficiency and conduct marks | 31 January and 31 July, and on promotion, transfer and the end of a deployment | 6.2 |
| PFT | Once between 1 January and 30 June | 7.1 |
| CFT | Once between 1 July and 31 December | 7.2 |
| Rifle qualification | Once a UTC year, at least 300 days apart | 7.4 |
| G-qualification | Once a UTC year, and before any deployment off Mars | 7.3 |
| Vacuum and water survival quals | Every 2 years | 7.5 |
| Meritorious boards | Quarterly: 15 March, June, September, December | 8.5 |
| Selection boards (SSgt and up) | Annually, one month per grade (SSgt in March, GySgt in May, MSgt and 1stSgt in July, MGySgt and SgtMaj in September) | 8.6 |
| Leave accrual | 2.5 days per pay period | 13 |
| Reenlistment window | Opens 365 days before the end of active service (EAS) | 17 |
| Birthdays | Yearly from `born` | 4 |

---

## 3. State

All plain JSON (DESIGN, saves). `$` keys are runtime only. Times are integer game milliseconds (`ms`) as TIME defines them; durations carry their unit in the name.

### 3.1 The career (in the world save)

```json
{
  "career": {
    "id": "c-48213-1",
    "mode": "standard",
    "world": "w-48213",
    "status": "standby",
    "end": null,
    "sheetId": "p233",
    "why": "money-home",
    "service": {
      "number": "MCR 4471-0932-17",
      "enlistedMs": 0, "termY": 4, "easMs": 0, "extendedMonths": 0,
      "grade": "E-1", "dateOfRankMs": 0, "promotions": [],
      "pmos": "0311", "amos": [], "billet": "rifleman",
      "unitId": "2/4-E-2-1-ft2",
      "station": "melas", "reCode": null
    },
    "standing": { "periodFromMs": 0, "pro": 70, "con": 70, "events": [] },
    "expectations": [{ "id": "on-time", "byId": "p50", "setMs": 0, "state": "open", "missedMs": [] }],
    "readiness": { "gq": "done", "suit": "done", "dental": "booked", "will": "done", "layout": "open", "zero": "done" },
    "standby": { "slip": 0, "mrx": { "grade": null, "points": 0 }, "billet": { "named": null, "candidates": ["dm"] } },
    "marks": [{ "atMs": 0, "grade": "E-1", "pro": 4.3, "con": 4.4, "why": "end of period" }],
    "fitreps": [],
    "quals": {
      "rifle": { "score": 214, "class": "sharpshooter", "atMs": 0 },
      "pft": { "score": 231, "class": 2, "atMs": 0, "events": { "pullups": 14, "plankS": 171, "runS": 1296 } },
      "cft": null,
      "gq": { "class": "G-2", "atMs": 0 },
      "vacuum": { "atMs": 0 }, "water": { "level": "basic", "atMs": 0 },
      "mcmap": { "belt": "tan", "atMs": 0 }
    },
    "education": { "mci": [], "pme": [], "credits": 0 },
    "schools": [{ "id": "soi-itb", "fromMs": 0, "toMs": 0, "result": "graduated", "honour": false }],
    "awards": [],
    "deployments": [],
    "pay": { "balanceMcr": 311, "cashMcr": 40, "savingsMcr": 0, "allotments": [], "lastPeriod": 0, "owedMcr": 0 },
    "leave": { "balanceD": 2.5, "taken": [] },
    "medical": { "limdu": null, "boards": [], "profile": [], "doseBars": [] },
    "discipline": { "page11": [], "njp": [], "courts": [] },
    "family": ["fm1", "fm2", "fm3"],
    "letters": [],
    "offers": [],
    "record": [{ "atMs": 0, "kind": "enlisted", "text": "Enlisted at the Redwater recruiting station for four years, infantry." }],
    "flags": { "flashback": "breach" }
  }
}
```

Ids follow TECH §2.3.1 (CONTRACTS §10): the player's sheet is an ordinary person, `people[sheetId]`, the same id as `state.player.id` (here `p233`, the 0.1 new game's of TECH §6.2), never `me`; the squad leader who set the expectation is `p50`; family members are counted `fm<n>`. The sample writes its nulls and empty lists out to name the fields; on disk, fields at their defaults are left out (TECH §6.6, rule 1), so `knowTheDrill` appears in `flags` only when true. The honesty marks (`imported` and the rest) live in `meta`, not here (TECH §6.1, CONTRACTS §9).

Doses are not kept here: they are BODY's ledgers (`rad.careerSv`, `yearSv`, `deploySv`, BODY §12.2), read by CAREER's limits (15.6), never copied (one quantity, one helper). `doseBars` records the bars a limit has put on the marine (`{ kind: 'surface' | 'radiation-duty' | 'jovian', untilMs, why }`).

### 3.2 The profile (outside any world)

Kept in IndexedDB `olympus`, store `profile`, so it survives a world being deleted (tradecraft kept its rungs in `tradecraft.career`):

```json
{
  "unlocks": { "rungs": ["newjoin"], "sides": [], "legends": [], "earned": [{ "rung": "lcpl", "byId": "c-48213-1", "atMs": 0 }] },
  "careers": [{ "id": "c-48213-1", "world": "w-48213", "name": "Maren Holloway", "mode": "ironman", "grade": "E-4", "years": 3.4, "end": "kia", "where": "Conamara Under-Ice", "atMs": 0 }],
  "worlds": [{ "id": "w-48213", "seed": 48213, "title": "Holloway's world", "lastMs": 0 }]
}
```

### 3.3 A family member (a lifetime person: PEOPLE stores them, CAREER makes them)

```json
{ "id": "fm2", "relation": "sister", "name": "Signe Holloway", "sex": "f", "born": 0, "home": "redwater",
  "household": 1, "job": "water-rights clerk", "alive": true, "attitude": "worried",
  "gauges": { "fear": 0, "trust": 2, "affinity": 3 }, "ties": 62, "lastLetterMs": 0, "holdUntilMs": 0,
  "arcs": [{ "id": "wedding", "beat": 0, "nextMs": 0 }] }
```

`household` groups the members who live at one address (a letter to the household reaches each, 14.2): a number inside the career, not an id (`h` is the hulls' prefix; CONTRACTS §19, item 8); `holdUntilMs` is when the ties' decay resumes after an honest letter (14.1).

---

## 4. New game and character creation

### 4.1 The flow

Title (VIEWS draws it) → **Enlist** → three papers in turn, each a typed sheet on the desk (tradecraft's papers, Papers-Please cold) → signing → **the flashback** (4.6, played) → the recruit training summary (4.7, a paper) → the ride to Melas (5.1).

1. **The world.** "A new world" (a seed, editable) or "The next recruit" into an existing world, which shows its date, its state in one line ("Earth and Mars in crisis; MSF-E at its cap of 2,400 on Europa") and its memorial count. Section 21.
2. **The start.** The unlocked rungs (section 22). The first world and the first career see only "New join: fresh from the School of Infantry". A second line under it: "I know the drill" (section 5.6).
3. **The enlistment paper**, a form in the Corps' style, every field pre-filled from the seed with a small "draw again" mark beside it and editable by click: name, sex, age, birthplace, background, why you joined, appearance (with the close figure beside the form, updating as you change it), term and field, and at the foot the two boxes **STANDARD** and **IRONMAN**, one to tick, with their meanings printed under them (4.2, section 23).

A **quick pick** sits above the form: three generated candidates (tradecraft's `candidates()`: one woman, one man, the third either), each a line ("Maren Holloway, 19, Redwater, valley farm, to send money home"), any of which fills the form. The user's tradecraft habit was to pick from generated candidates, and the form keeps that one click away (my call).

Signing the paper (a stamp, a sound) starts the career, and the flashback plays at once: the papers take a minute with the quick pick, and the first thing the player does with their hands is the depot's last test, not a form. Nothing on the form is visible to NPCs that a real record wouldn't hold.

### 4.2 The fields

| Field | Values | Effects | Default draw |
|---|---|---|---|
| Name | Given + family, from the birthplace's pools (SETTING owns the pools; LONGHAUL's `careers.js` home lists and `names.js` `MARS_FOUNDER` are the seed). Free text allowed, 2–24 characters each | Unique among the world's persistent people (a registry like LONGHAUL's); a clash asks for another | From the birthplace pool, no repeat in the world |
| Sex | Female, male | Name pool, PFT and CFT scoring tables (section 7), hair regulations, the close figure; BODY may use it for physiology. No MOS, school or unit is closed by sex (my call, after the US Corps since 2016) | 50/50 |
| Age at enlistment | 18–28 (`ENLIST_AGE_Y`) | The recruit arrives about 0.5 year older (boot camp, 13 weeks at MCRD Argyre; the School of Infantry, nine weeks at Camp Ius: SETTING §1.4 and §5.4; travel and leave). Age sets the PFT band, BODY's fitness and recovery curves, and every age gate | 18–22 weighted 60%, 23–28 40% |
| Birthplace | Section 4.3 | Starting G-conditioning and bone history (BODY), languages, the home town and the family's place, name pools, social tags, which backgrounds are likely | Section 4.3 weights |
| Background | Section 4.4 (SKILLS §10.2's list) | Up to +4 to a skill, 8 points in all, into SKILLS's `bg`; a connection in the world | Weighted by birthplace |
| Why you joined | Section 4.4.1 | A personal goal pinned on the mind's PATHS leaf (6.7), the family's letters coloured, an arc seeded | Weighted by background and birthplace |
| Appearance | Skin (8 tones), hair colour (8), hairstyle within regulations (men: high and tight, low regulation, medium regulation, shaved; women: regulation bun, short, braid pinned up), eyes (6), height cm, build (lean, medium, heavy), face (8 presets), marks (none, freckles, a birthmark, a childhood scar) | The close figure and the sprite (VIEWS); height and build give mass and suit size to BODY and supply | Birthplace tendencies: Belter-born +12 cm mean height, lean |
| Term | 4, 5 or 6 years active | EAS date; a 6-year term guarantees a school seat after the first deployment (my call, after real school-guarantee contracts) | 4 |
| Field | Infantry (0311 Rifleman) in 0.1; section 9.1 opens others later as starts | PMOS and the home unit | Infantry |
| Mode | Standard, Ironman | Section 23 | **Standard ticked on a profile's first career**, Ironman one click away with its meaning printed beside it; afterwards, the mode of the profile's last career (my call, reversing my earlier default of Ironman; the hub's decision log should carry it). A first career teaches a long game whose death rate the player cannot yet judge, and twenty hours lost to a die nobody chose would break trust (section 19) |

Height: women 152–185 cm (mean 166), men 160–198 (mean 178), Belter-born +12 cm; mass follows BMI 20–27 by build. These are BODY's inputs; the ranges are mine.

### 4.3 Birthplaces (working list; SETTING owns their lore and names)

Each birthplace gives BODY a **childhood gravity** and an **altitude band**, and gives this section a home town (for leave, letters and the family's place). **A birthplace gives no skill points of its own** (my call): SKILLS's sheet has no practice slot (SKILLS §3), and the user's "+4" belongs to the background. Its mark on the sheet is the background it makes likely (each listed background drawn at ×3 weight), and its mark on the body is BODY's.

| Id | Place | Childhood gravity | Air | Effects at start | Backgrounds drawn ×3 | Weight |
|---|---|---|---|---|---|---|
| `redwater` | Redwater, on the Melas floor | 0.38 G | −4.5 km, 66 kPa | Home is a bus ride from the gate: family visits on liberty and rest sols (5.4.1); people in town know your family (PEOPLE tag `local`) | `old-domes`, `valley-farm`, `hecate-line` (Ophir is the next canyon) | 14 |
| `londres` | Londres Nova, a big domed city | 0.38 G | dome air | City kid; home 1 day's rail away | `tower-kid`, `institute`, `mss-cadet`, `caucus-youth` | 18 |
| `tharsis` | A Tharsis dome town | 0.38 G | +10 km, domes and masks | Altitude-adapted (BODY §11.3: better tolerance of low O₂) | `survey-crew`, `dome-crew`, `shooting-league` | 12 |
| `hellas` | A Hellas lake town | 0.38 G | −7 km, 75 kPa | Water survival qual "intermediate" at start (grew up by the lake) | `valley-farm`, `athlete` | 10 |
| `seacoast` | A town on the young northern sea | 0.38 G | −4.5 km | As Hellas; fishing families | `valley-farm`, `athlete` | 10 |
| `farms` | The lowland farm co-ops | 0.38 G | −3 to −5 km | | `valley-farm`, `survey-crew` | 12 |
| `callisto` | A Callisto dome town | 0.126 G | domes | Low starting G-conditioning and bone density (BODY); remedial centrifuge in the standby; low-g movement native (BODY §14.4's balance); Jovian name pool | `ice-hauler` | 8 |
| `aboard` | Raised aboard (Navy or freighter family) | 0.3 G thrust and free fall | ship air | Zero-g native (BODY: little space sickness, §14.4), medium G-conditioning; home is "wherever the ship is" (letters by light lag) | `navy-brat` | 6 |
| `ceres` | Ceres, a Belter family with Martian papers | 0.3 G spin | station air | Lang Belta native (Languages); tall and lean; some NPCs distrust Belters (PEOPLE tag `belter`); a large asset in Europa's ice towns | `belt-born` | 5 |
| `earth` | Earth-born, naturalised | 1.0 G | sea level | High G-conditioning and bone density at start; PEOPLE tag `earther`; family on Earth (4–21 min light lag, never a visit on leave) | `athlete`, `med-college` | 5 |

The weights are the draw; the player may pick any birthplace and any background.

### 4.4 Backgrounds

What the recruit did before the recruiting station. **The backgrounds are SKILLS §10.2's table**: one list for the player, with its ids, its one-line descriptions and its points, which go into each skill's `bg` (◆ on the sheet): at most 4 to a skill (`BG_MAX`, the user's "+4", tradecraft 2026-10-27) and 8 in all (`BG_POINTS`). They never fade and never grow (SKILLS §3). SETTING voices them (names and lines). PEOPLE §3.7's backgrounds table is for NPCs only. This section adds the columns it owns: the connection each background leaves in the world (a person or a place that can turn up), and the grade at enlistment. Which birthplaces draw each is in 4.3.

| Id (SKILLS §10.2) | Connection in the world (my call) |
|---|---|
| `valley-farm` | The co-op sells to the base mess; its driver knows your family |
| `tower-kid` | A cousin in the Londres Nova towers who sells things |
| `navy-brat` | Your parent is a chief aboard an MCRN hull (letters, news of that ship, and what happens to it in the world) |
| `survey-crew` | A survey office that still sends you its storm forecasts |
| `hecate-line` | A line foreman at HAD's small-arms works in Ophir Chasma (SETTING §1.4) who knows every fault the R-7 has |
| `med-college` | A nurse at the naval branch clinic who trained beside you |
| `athlete` | A former teammate, now a corporal in Fox Company |
| `old-domes` | Your old coach runs the gym in Redwater |
| `shooting-league` | The league's range master, a retired gunnery sergeant |
| `belt-born` | A family friend on Ceres who still writes in Belta |

**Proposed additions to SKILLS §10.2** (CAREER's earlier backgrounds that SKILLS's ten do not cover, re-keyed to SKILLS §2.2's skills; SKILLS adds or declines them, and until it does the builders use its ten plus `custom`, my call). Tradecraft's Analysis is gone (SKILLS §2.2), so its points went to Tactics, Comms or Social:

| Id | One line | Points (8 in all) | Connection | Grade at enlistment |
|---|---|---|---|---|
| `dome-crew` | Dome maintenance: seals, pumps and scrubbers with 31 kPa outside | Tech 4, EVA 3, Awareness 1 | A dome warden in Londres Nova | Private |
| `ice-hauler` | A Callisto ice miner at sixteen | EVA 3, Zero-g 3, Demolitions 2 | A shift boss on Callisto (useful in the garrison) | Private |
| `institute` | Two years of engineering at the Mariner Valley institutes | Tech 4, Comms 2, Leadership 2 | A classmate now at MNI, who won't say so | **Private First Class** (college credits) |
| `mss-cadet` | A Martian Security cadet who left in the second year | CQC 3, Awareness 3, Social 2 | An MSS sergeant in Redwater remembers why | Private |
| `caucus-youth` | Debate team and the Unity Caucus youth wing | Social 4, Leadership 3, Tactics 1 | A Congress staffer (Congressional Unity Caucus) | Private |
| `custom` | Something else, in your own words | 8 points as you like, at most 4 to a skill and at most 4 skills | none | Private, or PFC with the college-credits box ticked |

Enlisting with college credits makes a **Private First Class** (real practice): `institute`, or a custom line with the box ticked.

#### 4.4.1 Why you joined

A field of the enlistment paper (my call, after a critic's case that the recruit had no reason of their own to be there and no self-chosen goal for 15 to 50 real hours). It sets a **personal goal**, pinned at the top of the mind's PATHS leaf (6.7); it colours the family's letters (14.3); and it seeds one arc (14.4, or PEOPLE's).

| Id | Why | The goal it pins | Letters and the arc it seeds |
|---|---|---|---|
| `money-home` | To send money home | an allotment of at least 20 MCR a period to the family (12.4), and the family's debt cleared | the family's money arc (a debt, a clinic bill); letters that thank you or worry about you |
| `recon` | To be recon | the recon screening's gates (11.1), each shown against your record | a sibling who brags about you; PEOPLE's recon-dreams arc |
| `out` | To get out (of the under-levels, the farm, the town) | a school seat or a posting off Mars from the offers paper (9.4) | the home town's pull; the old friend in trouble with Martian Security (14.4) |
| `citizenship` | Full citizenship by service (Earth-born only; SETTING confirms the Republic's rule) | a term served with an honourable record | the Earther arc (PEOPLE); a family on Earth, 19 minutes of light away, who do not understand |
| `tradition` | A family tradition | the parent's rank, or the parent's medal | a parent who served (PEOPLE's Corps family): legacy pressure |
| `debt` | A debt, yours or the family's | a sum saved by the end of the term (the enlistment bonus, deployed savings, 12.4) | a creditor's letters; the debt arc |

Weights follow the background and birthplace (`old-domes` and `tower-kid` lean `out`; `navy-brat` and an `aboard` birth lean `tradition`; `earth` allows `citizenship`), and the player may pick any that fits. The goal is a goal, not a gate: nothing closes if it is never met, but the family's letters and the PATHS leaf remember it.

### 4.5 The starting sheet

**SKILLS §10.1 makes the sheet**; CAREER feeds it the choices and keeps no skill numbers of its own (one quantity, one helper). In SKILLS's order:

1. Life skills from the character's own stream (Social, Tech, Driving).
2. The background's points into `bg` (4.4).
3. The floors of `boot` (SKILLS §6.6: MRK 6, WPN 6, CQC 5, FLD 4, AWR 3, TAC 1, COM 2, TEC 2, MED 3, EVA 5, ZG 3, DEM 1, FIT 10), then of the MOS school: `infantry` for an 0311 (MRK 8, WPN 8, CQC 6, FLD 8, AWR 5, TAC 3, COM 3, MED 4, EVA 6, ZG 4, DEM 2).
4. +1 base to two of the core four (Marksmanship, Weapon handling, Fieldcraft, Awareness), drawn.
5. **Warfighting 13 + int(5)**: 13 to 17.
6. Fitness: base the higher of 10 and the floor, offset 0, so effective Fitness 10 to 14 with the background.
7. Languages: English native, plus the background's (Belta working for `belt-born`) and the birthplace's (Belta native for `ceres`).

SKILLS §10.4's rifleman from the valley is the worked example.

### 4.6 The flashback: Argyre, the last week

A **playable cold open of three to five minutes** (my call, after a critic's case that the first ten minutes were forms and errands with no hook; SKILLS §14.1: "the opening flashback is where you met them"). It plays once the paper is signed, at MCRD Argyre ("the Argyre icebox", SETTING §4.7) in the depot's last week, with the real controls, the real body and stop motion where it applies, and one of two scenes dealt by the seed (`flags.flashback`):

| Scene | What you do | What it teaches in five minutes | Ends on |
|---|---|---|---|
| `breach` | The vacuum module's final test: a buddy's suit holed in the depot chamber, your patch kit, the leak hissing on the HUD, a clock on the wall | the suit's readouts, a timed step in the panel, a buddy's life in your hands | the senior DI's line |
| `string` | The qualification's last string at the Argyre range in the evening wind: four magazines, positions by command, and the dummy round the DI loaded into your third magazine | stop motion (G, X, the digits), a stoppage cleared by its steps, the log of rolls | the senior DI's line |

Nothing in it can kill (the agency rule's easiest case, 19.1): the chamber's instructor repressurises at once if the patch fails, and a failed string is a worse line in the summary. Its result is cosmetic: one line in the training summary ("cleared the dummy round in four seconds"; "patched Ortega's suit at 31 kPa, with nine seconds to spare"). It **ends on the senior drill instructor's line**, in the voice that becomes the T line for the whole career (5.3), and cuts to the training summary.

It is offered on every career's first start and can be skipped with Esc ("skip the flashback"); "I know the drill" (5.6) skips it; the record can replay it.

### 4.7 The recruit training summary (a paper made at signing)

The rest of boot camp and the School of Infantry are not played; they are a paper the player reads after the flashback, made from the sheet so it never contradicts it:

- Company, platoon and the **senior drill instructor** by name, the person met in the flashback (a tier-3 person who lives at the recruit depot, my call, generated at signing from the world's seed and SETTING §12's pools like every person: PEOPLE §3.1; theirs is the voice of the T line for the whole career, and the DI can turn up in person years later).
- Final PFT (computed by section 7.1 from the sheet); the rifle qualification class at boot, rolled in closed form by WEAPONS's course on **Marksmanship** (SKILLS §2.1) as it stood at Argyre (boot's floor, MRK 6, plus the background), so a `shooting-league` recruit is usually Expert and most others Marksman or Sharpshooter (section 7.4's bands); MCMAP tan belt; the vacuum and water survival quals.
- One line of the DI's remarks, dealt from a pool by the sheet's strongest and weakest skills ("Holloway: shoots well, talks back, runs like she's late for something"), and the flashback's line.
- **Meritorious PFC** at graduation if the boot composite (rifle class points + PFT/3 + a d20) reaches 150 (about 1 in 6, my call), unless already PFC by credits.

### 4.8 Family (generated at signing)

Family members are **lifetime people** (tradecraft's persistence tier: "Some belong to the character for life: family and friends"). PEOPLE stores and runs them at low detail; this section draws them and writes their letters.

| Who | Rule (my call) |
|---|---|
| Parents | Ages recruit + 22–38. Each alive with p = 0.97 − 0.01 × (parent age − 40), floor 0.6. Together 65%, separated 25%, widowed 10% |
| Jobs | From the birthplace's table (terraforming crew, farm hand, dome works, water-rights clerk, teacher, rail, clinic, miner, Navy chief, shopkeeper, MSS officer) |
| Siblings | 0, 1, 2, 3 with weights 20, 35, 30, 15; ages within ±10 years. A younger sibling who will reach 18 during the career is marked `mayEnlist` (section 21) |
| Partner at enlistment | p = 0.10 at 18, rising 0.03 a year to 0.40 at 28. Married at enlistment: p = 0.04 at 21+, 0.15 at 25+ |
| Children | 2% at 22+, 8% at 26+ (only with a partner) |
| Households | Members living together share a `household`: parents together and siblings under 22 with them; a separated parent alone; a partner apart unless married |
| Attitude to the enlistment | proud 40%, worried 40%, against 20% (sets starting affinity and the letters' tone) |
| Ties | 50–80 at start; section 14 |
| Arcs | 1–2 per member drawn from section 14.4's pool, each with a first beat 20–120 days out; why you joined (4.4.1) seeds one more |

The next of kin on the record is a parent if alive, otherwise a spouse, otherwise the eldest sibling. The player sees it on the record (the S-1 stop on sol 1 asks to confirm it, 5.2: it is who gets the knock, section 19).

### 4.9 Creation tests (they print)

- Ten seeds × three candidates: names, ages, birthplaces, backgrounds, why each joined; no duplicate full names in a world of 400 persistent people; the same seed gives the same candidates.
- Every background (SKILLS §10.2's and the proposed ones) sums to 8 with no skill above 4; every key is one of SKILLS §2.2's sixteen (no `analysis`, no practice column).
- The starting sheet equals SKILLS §10.1's procedure applied to the choices (the test calls SKILLS's own starting-sheet helper and compares; CAREER computes nothing of its own).
- The boot summary's PFT and rifle class match sections 7.1 and 7.4 recomputed from the sheet; the rifle class is rolled on Marksmanship.
- The default mode is Standard on a fresh profile and the last career's mode afterwards.
- Each why-you-joined id pins a PATHS goal and seeds an arc; both flashback scenes end on the DI's line and have no lethal outcome.
- 10,000 drawn families: mean siblings (1.4), share with a partner (by age band), share with a sibling marked `mayEnlist`, households per family.

---

## 5. The start: arrival at Base Melas and the first standby

The first arc is the tutorial, and the tutorial is the career's first ten to fourteen sols, lived by the recruit the player made, in the squad and base they will live in. Nothing is a separate mode. Every lesson is a block in the Plan of the Day that the battalion would really run on standby, and the squad leader uses it to bring the new join up to speed.

### 5.1 Arrival (status `arriving`)

- **When.** For a new world, SETTING §3.7's start: **Monday, Sol 590 MY 211, 12:40 Melas time** (2351-12-19 02:20 UTC; TECH's `START_MS` 23,480,400,000), after the noon meal, so the afternoon is the first three stops. For a next recruit, section 21, moved to the next **working sol** at 12:40 Melas (TIME's local clock).
- **How.** A splash of the ride down the Valley line from Camp Ius and the base bus from the rail halt (the valley wall, dust on the glass, the sea bag between your boots; the departure is lived at the halt only on later arrivals). The bus stops under the main gate's inspection canopy and the sentry boards: orders and ID card checked, a short talk scene (salute the officer of the day if one is in view, customs from PEOPLE). The bus drops you at battalion headquarters on the parade deck.
- **The sponsor.** Your **fire team leader** meets the bus (the real Corps' sponsor practice; PEOPLE's roster names them). You carry the sea bag yourself (about 35 kg of issued kit: BODY's load at 0.38 G) on the 344 m walk to Echo's barracks (PLACES §4.3, about five minutes), and the sponsor talks on the way in balloons, F to answer: the squad's names, the Alert Battalion watch, the vote everyone is waiting on (5.9), a first piece of the squad leader's hearsay. The sponsor made up your rack with linen the day before. S-1 can wait until tomorrow; the first sergeant cannot.
- **What you carry.** Issued uniforms, PT gear, boots, toiletries, the wrist terminal (the clock and the papers' reader, VIEWS), your orders, your ID, 40 MCR cash, and the pay account opened at the depot with the depot's last pay in it (section 12.6).

### 5.2 The first afternoon: three stops, then the squad

The real Corps hands a new join a check-in sheet and sends them round the battalion for signatures. OLYMPUS keeps the sheet (a paper on the wrist terminal) but lives only three of its stops on the first afternoon, each a person (tier 2 or 3, generated like everyone: PEOPLE §3.1, §3.13) at a desk in a real room (the rooms are PLACES's, authored and the same in every career); the rest are booked for the next morning (my call, after a critic's count of six offices over 2.5 to 3.5 game hours before the rifle or the squad).

| Stop | Who | What happens there | What it teaches |
|---|---|---|---|
| The company office, in Echo's barracks core | The first sergeant, then a short interview with the company commander | Knock, wait on the bench (a skip), report in the words ("Private Holloway reporting as ordered, First Sergeant"); a few questions (a talk scene) | Customs, conversation, time standing still in talk, waiting as an activity |
| The bay, with the platoon office next door | The platoon sergeant (squad and fire team confirmed), then the squad leader | Your rack, your wall locker, the head, the showers, the posted Plan of the Day on the squad's board; square the locker away (an activity) | Appliances (R), hygiene, the PoD, the chain of command |
| The armoury window | The armourer | Your rifle assigned by serial on a weapons card; you check it clear yourself at the window under the armourer's eye; it goes back in the rack until a block draws it | The gun as a machine; clearing; muzzle discipline |

Expected game time for the three, with the walks: 90 to 150 minutes. When `train-b` ends the squad comes back for `maintenance`, and you meet the rest of them in the bay.

**The rest of the check-in** is a list on the wrist terminal booked for **sol 1's `train-a`** (08:00 on TIME's table), in any order: **S-1** at battalion headquarters (orders endorsed, the record opened, the next-of-kin form confirmed, the will: readiness, 5.7); **supply** (field gear, "782 gear": pack, armour carrier, helmet, canteen; a lock); **the battalion aid station** (the medical record, the dosimeter badge, the dental check and the Jovian shots: readiness, 5.7). The suit fitting is booked at the suit loft for sol 2 and the G baseline at the G-house for sol 4. The squad leader's initial counselling (6.6) is the list's last stop. A stop still unsigned when `noon-chow` opens on sol 1 costs the squad leader's patience (standing con −1, section 6.1).

**The squad's welcome** at `evening-chow` is an **authored scene** (my call), lived, 5 to 8 minutes; what is authored is its beats and their line pools, and the people in it are the roster's, drawn for this world (PEOPLE §3.1): the squad's table at the mess, the fire team leader making the introductions, each squadmate a line in turn (their name, their nickname, what they want you to know, PEOPLE's personalities speaking), the seat you take and what it says, a joke at your expense and how you answer it, the first question about where you're from (your birthplace and background, in the squad's own prejudices), the hearsay begun, and the squad leader sitting down last. The squad's first gauges toward you move here (PEOPLE §3.12's starting trust −1 is where they begin).

The evening is the player's: the shower, the rec room, the squad, `mail-call`, the lights-out warning, `taps`.

**The first nights' alert drill.** 2/4 holds the Corps' Alert Battalion watch (SETTING), and its first night's recall drill is sol 0's spike (my call: TIME §9.2's weekly unannounced drill, pinned in the first week to 02:30 on the first night, a pin withdrawn in v0.0.4 (below); hashed from the second week on). The duty NCO's lights and the call: a wake event (TIME's O event) with sleep inertia (BODY §7.1); dressing in night lighting, the late card if you dawdle (TIME §9.5); muster on the company street in utilities with whatever kit you own (your field gear comes from supply tomorrow, and the squad leader says so in front of everyone); accountability by name under the first sergeant's watch; back in the rack by about 03:15. It teaches interrupts and the late card in the dark, and that the battalion means its notice to move.

**As built in v0.0.4** (DESIGN.md's log, 2026-11-06; TIME §9.2, §9.5; CONTRACTS §19, item 13): **the drill is drawn, not pinned to 02:30 on sol 0** (the user, 2026-11-05: what happens in the places is procedural). In the career's first week it falls on one of the career's first two nights (`firstNight + int(r, 2)` from `stream(seed, 'time:alert-drill', week)`), so the first-night spike stays likely without being written, and at a minute drawn between 00:30 and 04:30, so the slip lies inside the night and the squad is asleep (seed 48213's career, begun on Monday, has it at 02:57 that night); later weeks draw their night from all seven. Only the test scene `test-night` forces 02:30. It is **an A interrupt** (TIME §7.1's "base alert"), not this section's O wake event: it stops every activity; reveille is the O event. **The muster is at your own rack's foot, in utilities**, the squad leader's count due 5 minutes after the klaxon (dressing in an open drill at TIME §8.2's emergency tempo, 2.6 minutes from PT kit), the stand-down 30 minutes after it, an O event like the count, and everyone lying again 5 minutes later; nobody leaves the bay this round, so nobody pops. Dressing is in night lighting, the bay left dark; the klaxon sounds 45 s from a horn in hall-2 with a red beacon. **The company-street muster** with the first sergeant, the accountability by name and back in the rack by about 03:15, comes with walking people at 0.0.9.

### 5.3 The voices

- **The squad leader beside you.** A tier-1 person from PEOPLE's roster, assigned to bring you up to speed (it is real Corps practice for a squad leader to pair a new join with a senior marine). Their lines run through tradecraft's earpiece queue (`src/sim/tutorial/earpiece.js`): one line at a time, each held **3.5 s + 1/3 s a word**, beats with conditions, urgent beats first, stale after 25 s; a checklist of steps under the watch, ticked with a word. The HUD box carries the generated squad leader's rank and name: "◉ SGT REYES · BESIDE YOU" in person and "◉ SGT REYES · COMMS" in the field, for a squad leader the roster drew as Sergeant Reyes. The squad leader says **why**.
- **The drill instructor in your head.** The hub sets the T line as "the drill instructor's voice in your head, dry" (Controls); SKILLS owns what it says. This section gives that voice a person: your senior DI, met in the flashback (4.6) and named in the training summary (4.7), with a name and a turn of phrase drawn at signing (PEOPLE §3.1, §10.14), saying **what** is at hand ("The head is the door with the queue, recruit. You will not need telling twice."). During the first arc it teaches more; afterwards it only comments (SKILLS decides how much).
- **The fire team leader** is your sponsor (5.1) and your day-to-day guide in the squad bay: where the iron is, how the rack is made, who to avoid. Not on the HUD box; spoken in balloons.
- **Hearsay.** The squad leader has a story the squad tells in pieces, some of it wrong, never confirmed (tradecraft's Hale hearsay, `src/sim/hale.js`, made per person by PEOPLE: a story drawn from an authored pool of hearsay and filled from the squad leader's own generated record, as in "Reyes was on the *Bellona* when it was boarded at Pallas. Ask about the scar and it's a door").

Mistakes during lessons cost the squad leader's opinion (gauges, PEOPLE) and standing (section 6.1); afterwards the squad leader says what went wrong, in the debrief beat (tradecraft: "afterwards he tells you what really happened").

### 5.4 The standby calendar

The battalion is the Corps' **Alert Battalion** (SETTING §0 and §7.7), on 96 hours' notice to move (48 once the vote clears committee, 5.9), so it trains at home and stays near. **The Plan of the Day is TIME §9.2's training sol, and this section books its lessons into TIME's blocks by id** (TIME §9.2 and PEOPLE §4.1: `reveille`, `muster`, `pt`, `hygiene-chow`, `morning-formation`, `train-a`, `noon-chow`, `noon-formation`, `train-b`, `maintenance`, `evening-chow`, `mail-call`, `free`, `taps`), **never by clock times**, so when TIME's numbers move every booking follows (the user's consistency complaint, tradecraft rc30: "the point of bringing the tutorials in the career was to have consistency"). The week is TIME's too (TIME §9.2, after SETTING §3.4): Monday to Friday training routine, with field day in Thursday's `maintenance` and the platoon sergeant's inspection on Friday, 08:00–10:00, before a short `train-a`; Saturday and Sunday holiday routine, the two rest sols.

Standby sols are counted from 0, the arrival Monday (Sol 590 MY 211 in a new world), so standby sol n falls on weekday n mod 7, Monday first (CONTRACTS §3); a day of the week is named by its weekday, never as "sol 6" of a week. **At most two new systems a sol** (my call, after a critic's count of 90 to 150 real minutes a sol with three): each teaching sol's two lessons are its new systems, and everything else in it is already known.

| Sol | `pt` | `train-a` | `train-b` | `maintenance` and the evening | New systems |
|---|---|---|---|---|---|
| 0 Mon | | | arrival at 12:40, the three stops (5.1, 5.2) | the squad's welcome at `evening-chow`; the locker, the shower; **the alert drill**, tonight or tomorrow night at a drawn minute between 00:30 and 04:30 (5.2, as built in v0.0.4) | walking and talking, customs, appliances and needs; interrupts at night |
| 1 Tue | a formation run on the valley road (BODY's low-g gait) | the rest of the check-in (S-1, supply, the aid station), ending with the squad leader's initial counselling (6.6) | weapons class in the company classroom with drill rounds: conditions, the safety, clearing, the state machine, muzzle discipline indoors | kit squared away | the body under load; the gun |
| 2 Wed | PT | the range: zeroing at 25 m, confirmation at 300 m, one string of the course in stop motion (tradecraft's range lesson re-staged by WEAPONS: range safety every tick, a stoppage cleared) | the suit loft: fitting, donning, the buddy check, the suit's own readouts | rifle cleaning at the canopy (an activity) and the armourer's inspection; the PX in `free` (12.7, 12.8) | shooting in stop motion; the suit |
| 3 Thu | PT | suit drill: the dust lock and the Tank, a breach drill (PLACES's lock, BODY's suit) | combat lifesaver class and lane: the tourniquet, the pressure dressing, the casualty card, a practice 9-line (BODY's first aid, COMBAT §12.3) | field day (an activity with a roll) for the morning's inspection; the gear laid out on the rack (readiness, 5.7) | air and pressure; first aid |
| 4 Fri | PT; pay day: the LES reaches the wrist at 00:00Z, about 07:40 Melas, just before the inspection (12.5) | **the platoon sergeant's inspection, 08:00–10:00** (uniform, haircut, shave, locker, the bay, the gear layout: BODY's hygiene, PEOPLE §11.10; a test of what is already known); then, in the short `train-a`, rules of engagement and escalation of force (COMBAT §9) and the Europa brief (SETTING): MSF-E's ROE card issued as a paper | the G-house: two hours at 1 G in the Ring, then your appointment on the Long Arm (the G-qualification, 7.3) | liberty on base from the end of `maintenance` | the rules of force; G |
| 5 Sat | holiday routine | one rest-sol set piece (5.4.1) | | liberty on base | free time as a currency |
| 6 Sun | holiday routine | one rest-sol set piece (5.4.1) | | the squad leader's word in the evening (6.4) | |
| 7 Mon | PT | MCMAP on the mat (CQC, COMBAT §10, Mars gravity); then the MRX's orders: the squad leader's patrol order on the sand table, rehearsals, the pre-combat inspection of gear | **the mission rehearsal exercise begins** (5.8) | in the field | close combat; the exercise |
| 8 Tue | in the field | the MRX | end-ex and the hot wash | weapons cleaned and turned in; **the billets named** (5.7); the floor vote that night (5.9) | none: everything together |
| 9 Wed | PT | `morning-formation`: the certification and **the warning order** (5.9); predeploy begins | | | |
| the weekdays of 9 to 13, only when the floor vote slips (5.9) | PT | the second week's blocks, dealt by the world seed: a combat marksmanship day (movers and positions; scored for the DM billet), MOUT in the training village (stack and clear with marking rounds), the CBRN class with the mask and the gas chamber, a battalion run, the commanding officer's inspection, an 8 km hump | | | (none new) |

No rifle qualification is shot in the standby: the boot qualification is current (shot at Argyre about four months earlier, and section 7.4 keeps qualifications at least 300 days apart), so sol 2's string is familiarisation and the combat marksmanship day is training; both are scored for the DM billet. The PFT and CFT are not in the standby either: the boot summary's PFT is the current one.

**Stand-ins until the 0.1.x scenes join** (ROADMAP §5.2 asks this section to name them; my call on each). At 0.1.0 a lesson whose scene has not joined keeps its slot with a block already built, of the same length, so the sol keeps its shape and nothing is staged or abstracted; each join puts its lesson back on its sol for careers that have not reached it (ROADMAP §5.8), and the instinct never offers a block that is not built.

| Career sol and block | The lesson | Its stand-in at 0.1.0 | Back with |
|---|---|---|---|
| 2 Wed, `train-b` | the suit loft | the range day runs on: a relay of the course at 200 m, then the rifle cleaned at the canopy and inspected, moved up from `maintenance` (the evening is then free) | `test-tank` |
| 3 Thu, `train-a` | suit drill: the dust lock and the Tank | a second range day: the 300 m confirm again and a relay of the course | `test-tank` |
| 3 Thu, `train-b` | the combat lifesaver class and lane | a class at Schools | `test-lane` |
| 4 Fri, `train-b` | the G-house: the Ring and the Long Arm | the field house's circuit, then close-order drill on the parade deck | `test-ghouse` |
| any sol's `pt` when the rotation comes to the Ring (CONTRACTS §4) | PT at 1 G in the Ring | the field house's circuit | `test-ghouse` |
| 7 Mon, `train-a` | MCMAP on the mat | close-order drill on the parade deck; the MRX's orders after it as booked, or the pre-combat inspection of gear alone while the MRX is on its stand-in | `test-mat` |
| 7 Mon, `train-b`, to 8 Tue, the afternoon | the mission rehearsal exercise (5.8) | the second week's built blocks: the combat marksmanship day on sol 7 and the 8 km hump on sol 8's morning, then the squad leader's review in the hot wash's place; the MRX's term in the billets (5.7) and in standing reads their graded rolls | `test-patrol` and `test-roe-lane`, with the lane and the mat already joined |

The slipped weekdays (9 to 13) deal only from the built blocks until MOUT joins with the patrol and the CBRN class with the Tank. Until the Tank and the G-house join, the suit and the G-qualification stay open on the readiness checklist (5.7) without holding a marine back: a career that crosses the standby without them clears both in 0.2's predeploy at Melas, before the lift (ROADMAP §5.2; 7.3 asks for the G-qualification before any deployment off Mars).

#### 5.4.1 Rest sols

Each rest sol (both sols of the weekend) draws **one set piece** from a pool (my call, after a critic's case that a rest sol of PX, gym and the Rec would be spent as a chapter by most players), each bringing its people and its gossip:

- **the company field meet** on the Green at 0.38 G: bounding relays, a tug-of-war where inertia matters more than weight (BODY §16.3), a casualty-drag race, the platoons' honour;
- **a barbecue on the Green**, the first sergeant at the grill, the squads mixing;
- **chapel and the Memorial Wall**: the chaplain's service, and a name on the wall someone in the squad knew;
- **movie night in the Rec**: the squad's seats, the film the squad argues about for a week;
- **a family visit** at the visitor centre for the Redwater-born (the family on the bus from town, 14.6).

Each is lived or spent; its gossip runs either way (PEOPLE). In dwell, rest sols draw from the same pool, and from 0.2 Redwater's liberty joins it (section 13).

### 5.5 Booked, never teleported

- A lesson is a dated booking with a **place** (a room or an outdoor area at Melas) and a **block** (one of TIME §9.2's ids on that sol's routine). It opens 15 minutes before the block and closes 10 minutes after it starts (tradecraft's range lesson window). The player walks there. **T** in the window begins it.
- **Missed.** The squad starts without you; you can join late (standing con −3 for lateness, 6.1, and the squad leader's words); missed entirely, it is unauthorised absence from your place of duty (con −8, a counselling, PEOPLE's discipline) and the lesson is rebooked into the next free block.
- **"I've got this."** After any lesson's opening, the step panel offers it (my call, after a critic's case that a player who has understood cannot cut a lesson short). Run the lesson's next steps unprompted, or pass its check (the lesson's first graded roll at `pass` or better, SKILLS §5.6), and the rest of the block is carried on by its resolver (TIME §9.3), with the same hours and XP (SKILLS §6.3: lived or skipped, the same growth). The squad leader's teaching beats stop; the DI says one line ("Noted."). Fail the check and the lesson simply runs on, with no penalty for having asked. This is where TIME §9.3's forced first stretch ends.
- **Asked for again.** From the mind (Tab) or by F to the squad leader: "Can we run that again?" books the lesson into the next free block in the PoD at least 2 hours clear of any other booking (tradecraft's `LESSON_GAP_H 2`), or an evening if the days are full. It runs as the same lesson with fewer words (tradecraft's "remember it, snap flash forward").
- **Every lesson uses the campaign's tools**: the real rifle on your weapons card, your suit, your body's state, the real PoD clock. Nothing is staged that would not be there.
- **XP.** Lessons give their normal training hours and XP, at tradecraft's `LESSON_XP_K = 0.4` for checks rolled inside them (SKILLS takes the number).

### 5.6 "I know the drill"

A second option under "New join" on the start paper for players who have played before (my call). It changes only what the career would have changed: the flashback is skipped (it is in the record); the arrival was **yesterday** (the three stops are signed, the welcome and the recall drill are in the record, with how you did drawn from the sheet); you start at **05:30 reveille on sol 1** in your rack; the squad leader's teaching beats are off (operational lines stay: "Formation in ten"), and the DI's voice says less. The sol-1 list is still booked (S-1 and supply do not care what you know), and the lessons are still on the PoD because the battalion still trains. No teleport, no skipped consequences.

### 5.7 Readiness and the Europa billets

**The readiness checklist** (my call, after the Corps' real pre-deployment checks and a critic's case that the standby showed no stakes). From sol 1 it is on the platoon's whiteboard in the platoon office and on the wrist terminal: the items every marine must clear before the lift, each a booked stop.

| Item | Where and when | Cleared by |
|---|---|---|
| G-qualification | the G-house, sol 4 | G-1 or G-2 (a G-3 deploys to Europa with a note, 7.3) |
| Suit | the suit loft, sol 2, and the Tank, sol 3 | a fitted suit that passed its leak check; the vacuum qualification current (7.5) |
| Dental and shots | the aid station, the sol-1 list (the dental check and the Jovian shots the same morning) | the corpsman's stamp |
| Will and next of kin | S-1, the sol-1 list | the forms signed ("Do you want to change your beneficiary?") |
| Gear layout | the rack, laid out at Thursday's field day for Friday's inspection; checked again at the MRX's pre-combat inspection | the squad leader's tick |
| Rifle zeroed | the range, sol 2 | a zero on the weapons card |

An item missed is rebooked into the next free block; S-1 and the aid station keep late hours in the predeploy sols for stragglers. Anything still open at the lift puts the marine in the battalion's **remain-behind element** at Melas (5.10), who joins by the next troopship 20 to 40 days later (my call). The whiteboard is public: the platoon sees whose names are still up, and so does the platoon sergeant.

**The Europa billets** (my call, after a critic's case that doing well in the standby bought nothing the player could see; the shape is PEOPLE's arc "The board"). At the initial counselling (6.6) the squad leader says the squad's billets for the tour will be named before the orders, and names the candidates: point man, the automatic riflemen, the designated marksman and the grenadiers (COMBAT §7.1's roles; WEAPONS's arms), with the player among the candidates wherever the sheet allows. They are named at the end of sol 8, after the MRX's hot wash, each by a readable sum printed like a check:

| Billet | Its own measure | Plus, for every billet |
|---|---|---|
| Designated marksman | sol 2's string (WEAPONS's score) and Marksmanship | the candidate's MRX graded result (5.8), the squad leader's trust (PEOPLE, −5 to +5), and the inspection's result |
| Point man | Fieldcraft and Awareness in the MRX's patrol | |
| Automatic rifleman | Weapon handling and the latest PFT (it is the heaviest gun in the team) | |
| Grenadier | Tactics and the MRX's throws | |

> Designated marksman: Holloway 14 (string 212/250: +6; Marksmanship 10: +3; MRX +4; Sgt Reyes's trust +1) against Diaz 12 and Okafor 9. Holloway.

A billet changes the kit you carry on Europa (the automatic rifle's weight, the marksman's optic), your role in the squad's drills (COMBAT), a line on the record, and eligibility for the next billet (8.8). Not chosen: rifleman, with nothing lost but the pride, and the rival who won it is in your fire team.

### 5.8 The mission rehearsal exercise

Every standby ends with a **mission rehearsal exercise** (MRX), the real Corps' certification of a unit before it deploys (my call, after a critic's case that the arc which teaches every system never joined them before the career's first stakes). About 28 hours of game time, from sol 7's `train-b` to sol 8's afternoon, in the training village and the Talus (PLACES §4.12: the village's mock checkpoint on Europa's CP-A template, its tunnel with a pressure-door pair), with role-players running a Europa town. COMBAT §22 builds every piece in training form, in 0.1.x's scenes (ROADMAP §5.8); the MRX is where they are joined, and until they are, its sols hold 5.4's stand-ins.

| Phase | What | Lived | Joins |
|---|---|---|---|
| Sol 7, `train-b`: the move | trucks to the village; the patrol base occupied | the arrival lived, the drive skipped | |
| The afternoon: the checkpoint | CP-A in the village: queues and searches, and the ROE and EOF lane with role-players (an angry driver, a man reaching into his coat, a UN observer with questions) | the lane's incidents lived; the queue carried on | the rules of force, Social, the use-of-force record (COMBAT §9) |
| The evening | rations, the patrol base's routine, the watch roster | activities | the body in the field |
| The night: the patrol | a night patrol through the Talus at −30 °C; contact with a blank-firing cell on the harness (COMBAT §22); a casualty (a role-player's moulage, or a squadmate scored "hit"): the tourniquet, the casualty card and the 9-line on the net | contact and the casualty lived | stop motion, suppression, orders on the net, first aid with cold hands (BODY §10.5) |
| The small hours | a watch in the patrol base; sleep in a bag on the ground (BODY §7.1: quality 0.85) | the handover lived, the sleep a skip | fatigue as a named modifier |
| Dawn: cordon and search | a house in the village with Star Helix role-players and an observer; stack and clear with marking rounds | lived | the Accord's search rules (SETTING §7.6), CQC |
| Sol 8, about 12:00: end-ex | trucks back | the arrival lived | |
| Sol 8, after `noon-chow`: the hot wash | COMBAT §17.2's hot wash; each squad's grades read out | lived, 3 to 5 minutes | the after-action |

Its key moments are lived and the rest are carried on, so it plays in about 100 to 150 real minutes across the two sols (my call; the `recruit` bot prints it, 5.11).

**The graded result** is the sum of the player's graded rolls in its lived moments (SKILLS §5.6's grades as points: disaster −3, bad −2, miss −1, pass +1, good +2, superb +3, my call), with the squad's result as COMBAT's after-action scores it. It moves standing (pro +4, +2, 0, −3 or −6 for distinguished, good, satisfactory, poor or failed, by bands the test prints), it is the largest shared term in the billets (5.7), and the squad leader reads it out at the hot wash in a line. The battalion is certified whatever the player does: the Corps would not hold a battalion for one private. The warning order follows the certification (5.9), so ROADMAP §5.3 may make the MRX the lead-in to its `moment-warning-order` once the MRX has joined.

### 5.9 The vote and the orders

**The vote's clock** (my call, after a critic's case that the vote lived on the news board and not in the barracks). SETTING §7.7 puts the Congress' vote on the reinforcement inside the standby and leaves its dates to CAREER:

- **Sol 3 (Thursday): the defence committee passes it.** The battalion's notice to move is cut from 96 to 48 hours, announced at that evening's chow.
- **Between:** rumours at chow (PEOPLE's gossip carries them, some wrong); the mess screen running the Congress' debate live from Londres Nova and Europa's news 47 minutes behind (SETTING §2.4's light time); the CUC's floor leader on every screen; a letter home that cannot say where you are going.
- **Sol 8, the evening after the MRX: the floor vote passes**, while the squad cleans its rifles and hears its billets.

**Length.** `STANDBY_SOLS = 10 + slip`. For a new world's first recruit the slip is 0: the warning order comes at sol 9's morning formation (Wednesday, Sol 599 MY 211), and the battalion sails from Phobos on SETTING §6.5's Sol 602, the UTC New Year's Eve. For later standbys (a next recruit's battalion, the next rotation), the floor vote slips by 2 + int(3) sols with p = 0.4 from the career's stream, and never while LONGHAUL's politics has Mars–OPA in crisis or an insurgency zone at Europa flaring (my call). The slipped sols hold the second week's blocks (5.4) with the certification already won, and every later date moves by the slip.

**The moment.** At the last sol's morning formation the company commander speaks to the company (a lived scene, 2 to 3 minutes): the certification, the vote, the mission. Then the **warning order** reaches every wrist terminal: a paper.

**The orders paper** (the first recruit's, as a sample; SETTING names the force and the operation, TIME §3.1 formats the date-time group):

> WARNING ORDER 01 · 2d BATTALION, 4th MARINES · Sol 599 MY 211, 0800 Melas (280336Z DEC 51)
> Situation: the Congress has voted to reinforce the Martian Stabilisation Force, Europa (MSF-E), Operation STILL WATER, to the Accord's cap of 2,400. 1st Battalion, 7th Marines holds the Conamara airspace and the Tyre Works.
> Mission: on order, 2/4 deploys to reinforce MSF-E, assuming the Pwyll sector (Pwyll Deep, the Tyre Works, Manannán), to keep the peace under the Jovian Accord.
> Execution: Echo Company lifts from Melas pad in the second lift on Sol 601. Pack-out by 18:00 on Sol 600. Liberty restricted to base. Letters home before embarkation. The battalion sails from Phobos on Sol 602 (31 DEC 51).
> Admin: imminent danger pay and the combat zone tax exclusion from arrival in Jovian space. Dosimeters worn at all times from Callisto on.

- **After it.** Status `predeploy`: `PREDEPLOY_SOLS` is 2 for the first recruit (the rest of sol 9 and sol 10), 2 to 4 from the movement table later: packing (an inventory scene: what goes in the pack and the sea bag, VIEWS's load-bearing gear), the readiness items still open (5.7), writing home (section 14), one last liberty on base if the world allows, and the move to the pad (a lived walk, a splash of the lift to Phobos). TIME and PLACES own the voyage.
- **The destination.** For the first recruit in a new world the first deployment is always MSF-E (`esf`), the brief's own example (my call). For a next recruit, section 10.3 draws it, with Europa weighted while the force exists.

### 5.10 Edge cases

- The player dies in the standby: section 19 applies at once. The memorial's first name can be a recruit who never left Mars.
- The player commits an offence in the standby (a negligent discharge on the range, a fight in the rec room): PEOPLE's discipline runs; an NJP before deployment does not stop the deployment (the Corps would take them), but it is on the record and in the squad's memory, and it weighs on the billets through the squad leader's trust.
- The player is hospitalised in the standby (an accident in the Tank, a fall in the MRX), or a readiness item is still open at the lift: they stay behind with the battalion's **remain-behind element** at Melas and join by the next troopship in 20 to 40 days (my call). They are never dropped out of the career; the billet they would have had goes to the next candidate.
- The player tries to leave base during standby restriction: unauthorised absence; past 24 hours, NJP; past 30 days, desertion (section 16).

### 5.11 Tests (they print)

- **The first afternoon.** A scripted new join (a bot driving the real game headless, tradecraft's pattern) walks the three stops: prints the game minutes per stop, the order taken and the total (target 90 to 150 game minutes), then the sol-1 list (target 120 to 200 game minutes with the queues).
- **Real time per sol.** The `newjoin` and `recruit` bots print real minutes for sols 0 to 6 and for the MRX: targets 60 to 80 for a teaching sol (0 to 4: the top of the hub's 40 to 70 for an active sol, with the lessons' words added, my call), 20 to 60 for each rest sol, 100 to 150 for the MRX's two sols.
- **Two new systems a sol.** Every lesson is tagged with the systems it introduces; the test counts them per sol and fails above two.
- **`pod-consistency`.** Every lesson booking names a TIME §9.2 block id that exists on that weekday's routine and lies inside it; no two bookings overlap; Friday's `train-a` lesson starts after the inspection's 10:00; Saturday and Sunday hold only their set pieces; mail call reads the `mail-call` block; the field day is Thursday's `maintenance`; the mess windows equal the chow blocks (PLACES §4.5); asking again books at least 2 h clear. It reads TIME's and PEOPLE's data, not copies of them.
- **The standby's length** over 1,000 seeds: first recruits always 10 sols; later standbys' distribution over 10 to 14 and the share with no slip (60% ± 4), and none slipped in crisis.
- **"I've got this."** A bot that passes the range lesson's check after the opening: prints the block's hours and XP against a bot that lives the whole block (equal).
- **The MRX.** Bots at three skill levels: the graded result's distribution, its standing bands, and who wins each billet in 1,000 squads.
- **Readiness.** A bot that skips the dental stop and the predeploy catch-up ends in the remain-behind element, with its rejoin date.
- A bot that misses the range lesson: prints the standing, the counselling and the rebooked date.

---

## 6. Standing, evaluations and the record

### 6.1 Standing

Standing is tradecraft's "cover standing" made military: a running score per evaluation period, in two halves, **proficiency** (how well you do the job) and **conduct** (how you behave). Both start each period at 70. Events add or take away. The player never sees the numbers; they see the marks at the end of the period, the squad leader's word in between (6.4), and the expectations met or missed on the mind's STANDING leaf (6.6). (Tradecraft, 2026-10-28: "what we see is what our character evaluates as being true".)

| Event (source) | Pro | Con |
|---|---|---|
| A training block lived and done well (its checks passed more than failed) | +0.5 | |
| A training block done badly (more failed than passed) | −1 | |
| A block skipped by the activity with an outcome | 0 (the outcome's own) | |
| An expectation from a counselling met (pro) or missed (con), at the week's end (6.6) | +1 | −2 |
| The MRX's graded result: distinguished / good / satisfactory / poor / failed (5.8) | +4 / +2 / 0 / −3 / −6 | |
| A readiness item still open at the lift (5.7) | | −2 |
| Rifle qualification: Expert / Sharpshooter / Marksman / unqualified | +6 / +3 / 0 / −10 | |
| PFT or CFT: first class / second / third / failed | +4 / 0 / −4 / −15 | |
| G-qualification class lost | −4 | |
| An inspection passed / failed (PEOPLE's inspection) | +1 / −3 | +0.5 / −1 |
| A task given by a leader done / not done | +1 / −3 | |
| A school graduated / honour graduate / dropped for performance | +5 / +10 / −5 | |
| Led a team or squad in an exercise or operation, and it went well / badly | +3 / −2 | |
| Conduct under fire judged good in the after-action (COMBAT) | +5 | +2 |
| Saved a life (first aid that held, BODY) | +4 | +2 |
| Volunteered for a duty | | +1 |
| Praise from an officer (PEOPLE) | | +2 |
| Late to formation or a block | | −3 |
| Absent from a place of duty (UA under 24 h) | | −8 |
| A counselling entry (page 11) | | −5 |
| A negligent discharge | −10 | −10 |
| Alcohol incident, a fight, disrespect to a senior | | −10 / −8 / −5 |
| NJP | | −25 and conduct mark capped at 3.9 for the period |

PEOPLE's discipline system decides when these happen and calls `standing.add(career, { pro, con, why })`; the career keeps `{ atMs, pro, con, why }` in `standing.events`.

### 6.2 Proficiency and conduct marks (Private to Corporal)

At each marking date (2.3): **mark = clamp(4.3 + (score − 70) × 0.025, 0.0, 5.0)**, rounded to 0.1, for pro and con separately (my call; real Corps marks clustered 4.4–4.6, and this does too). A score of 98 is a 5.0, 58 is a 4.0, 18 is a 3.0. The paper shows the two marks, the marking official's name (the platoon sergeant) and one line from them dealt by the period's largest events. The player signs it (a click). The composite (8.3) uses the **average of all marks in the current grade**.

### 6.3 Fitness reports (Sergeant and up)

Semiannual and on a change of billet: the reporting senior's **relative value**, RV 80–100, is the marine's rank by standing among the senior's marines of that grade (PEOPLE knows them): top third 93–100, middle 87–92, bottom third 80–86, placed linearly within the band. A paper with a few typed lines (dealt pools, tradecraft's `dossier.js` pattern) and the RV. Boards (8.6) read the average RV.

### 6.4 The squad leader's word

At the end of each week (Sunday's evening), if the squad leader is within the base, they say one line to you, chosen by the week's standing so far: four registers from "Keep that up" to "My office, tomorrow, 07:00" (which is a counselling scene). This is the read the player gets in between marks. In the field it can come over comms.

### 6.5 Awards (working names; SETTING names the Corps' medals)

| Award | Criterion | Composite points | Board modifier |
|---|---|---|---|
| Good Conduct Medal | 3 years of continuous service without NJP or court-martial, conduct average ≥ 4.0 | 0 | 0 |
| Achievement Medal | End of deployment: top 10% of the company by standing; or a lived act of note (COMBAT or PEOPLE writes it up) | +10 | +1 |
| Commendation Medal | A senior NCO's deployment, or a heroic non-combat act | +20 | +1 |
| Valour medals (three grades) | From the after-action's valour events (COMBAT) | +30 / +40 / +50 | +2 / +3 / +4 |
| Wound medal | Wounded by hostile action (BODY marks the wound's cause) | +0 | +1 |
| Combat Action Ribbon | Under hostile fire and returned it | +0 | +1 |
| Campaign and service medals | Per deployment (Europa, Jovian service, void service) | 0 | 0 |
| Qualification badges | Rifle class, insertion wings, recon, Raider | 0 | 0 |

A write-up takes 30–90 days to become an award; it is pinned at a formation (a lived ceremony, 3–5 minutes). Awards go on the uniform (VIEWS) and the record. On a Europa tour the relief-in-place paper (10.5) is read by the awards board.

### 6.6 The initial counselling and the STANDING leaf

Real Corps practice: a new join's squad leader holds an initial counselling within days. On sol 1, as the last stop of the check-in list, the squad leader sits you down in the platoon office (TIME §8.7's `counselling` activity, about 10 minutes of game time; a performance counselling, not PEOPLE's R3 page-11 entry) and sets **three to five expectations**, drawn from a pool by the squad leader's personality and your record (my call, after a critic's case that for 6 to 14 real hours the player could not see what doing well buys):

- on time, every time (no lateness worse than "on the line", TIME §9.5);
- shaved, haircut and uniform in regulation at every formation (PEOPLE §5.5's appearance);
- your rifle passes the armoury window first time (WEAPONS's inspection);
- a qualification: G-1 at the G-house, or sol 2's string at or above the squad's median;
- a clean bay: your locker and rack pass Friday's inspection (PEOPLE §11.10);
- later counsellings: a correspondence course, PFT first class, the Corporals Course, a billet held well.

Each shows on the mind's **STANDING leaf** (VIEWS's Tab, STANDING) as the character knows it: *open*, *met*, or *missed* with when ("Late to the 12:40 formation, Sol 593"). A met expectation is pro +1 at the week's end and a missed one con −2, with a line from the squad leader on the spot (6.1). The leaf never shows standing's numbers; it shows what the squad leader asked and what you did, and the squad leader's word (6.4) reads the same week. The billets (5.7) are announced in the same counselling, with the candidates named. In dwell, a counselling is held every 6 months and on promotion, with new expectations from the pool.

### 6.7 PATHS: the ladder in view

From sol 0 the mind has a **PATHS** leaf beside STANDING (VIEWS draws it; my call, after a critic's case that the career's doors first appeared on the offers paper 15 to 50 real hours in). It lists the career's ladder, every door section 2.1's state machine can open (promotion, the schools, recon, the Raiders, the individual deployments), with each gate and where the character stands against it, in what the character knows:

> **Your reason: to send money home.** An allotment of 20 MCR a period (none set: S-1).
> Recon screening: a deployment (none yet) · PFT 235 (yours 221) · CFT 235 (not taken) · G-1 (untested) · vacuum qualified (yes) · no NJP in 12 months (clean) · age 30 or under (19).
> Corporal: 12 months in service (0.4) · composite against the cutting score (not yet eligible).
> Designated marksman for the tour: Sgt Reyes picks before the orders (sol 2's string, Marksmanship).

The why-you-joined goal (4.4.1) is pinned at the top. A gate met turns green; a gate that closes (an NJP, a birthday) says why and until when, as the offers paper does (9.4). Free time in the standby then builds toward something the player picked: an evening on the track for the PFT, the range for the marksman's billet, a manual for the composite. The leaf reads the same helpers as the offers paper, so the two never disagree.

---

## 7. Qualifications

The tests the Corps keeps on every marine. BODY owns what the body can do; WEAPONS owns the rifle course; this section owns their schedule, their scoring, and what they gate.

### 7.1 The PFT: 1 G, in the G-house

The Corps fights Earthers and rides warships at 1 G (DESIGN, the Corps), so its fitness test is taken **at 1 G in the base's centrifuge** (PLACES §4.9: the Ring's lane and its PFT station in car 3) (my call). Three events, 100 points each, 300 in all. The anchors follow the US Corps' PFT tables for ages 21–25 (the 2022 revision, approximately and rounded):

| Event | Men 100 / 40 points | Women 100 / 40 points |
|---|---|---|
| Pull-ups (max reps) | 23 / 4 | 11 / 3 |
| Plank (hold) | 3:45 / 1:03 | 3:45 / 1:03 |
| Run 4.8 km (3 miles), 17 laps of the Ring's lane | 18:00 / 28:00 | 21:00 / 31:00 |

Linear between the anchors, capped at 100, under the 40 anchor the event is failed. Age bands: 17–20 and 21–25 as above; each later 5-year band lowers the pull-up anchors by 1 and slows the run anchors by 30 s (my simplification of the real tables). **Classes:** first ≥ 235, second 200–234, third 150–199, fail < 150 or any event failed.

**Performance.** Each event takes a d20 for the day, r = (d20 − 10.5).
- **Timed events come from BODY's gait and stamina model, not a formula of their own** (one quantity, one helper; my call, after a critic's sum that Earth anchors were out of reach of BODY's Martian gaits). BODY supplies `courseTime(body, course, regime)`: the time of the best pacing (BODY §16.1's lope, with the sprint its stamina allows, §8, spent at the end) for this body on this day (effective Fitness, the G-conditioning band at 1 G, BODY §14.1, needs and injuries), and the day multiplies it by (1 − 0.004 r), ±4%.
- **Rep and hold events** use BODY's performance index `perf(body, regime)`, P expected 4–28: effective Fitness times the G factor for the regime (how well this body works at 1 G today, from G-conditioning), less the needs and injury penalties of every roll. Until BODY sets its own, P = effFitness × gK − penalties, with gK = 1.0 for a fully conditioned body. Pull-ups = round(1.6 P − 6 + 0.5 r); plank s = round(60 + 9 P + 4 r).

The run, derived (scratch run, 2026-11-05: BODY §16.1's gaits at 1 G and §8's 32 s sprint, with the lope's fitness term CAREER asks of BODY, 7.2): 25:48 at effective Fitness 0, 21:53 at 10, 21:14 at 12, 19:30 at 18, 18:01 at 24. So the US 100-point 18:00 is a 24's run, as a US 100 is an elite's, and the 28:00 floor is within everyone's reach. At P = 11.4 (an average new join, effective Fitness 12 at gK 0.95, gCond 0.95 so no band at 1 G) that is about 12 pull-ups, 2:43 and 21:14: 65 + 77 + 81 = 223, second class. At P = 18 (effective Fitness 18, conditioned) it is 23, 3:42 and 19:30: 100 + 99 + 91 = 290. The test is an activity: lived (the Ring spins up, the instructor counts) or skipped with its outcome; either way every roll and the run's time are in the log.

### 7.2 The CFT: Mars gravity, outdoors

The combat test is taken where Martian marines fight first: at 0.38 G on the ground. Three events (my call, after the US CFT with Martian loads). Its timed events are run through BODY's `courseTime` as the PFT's run is, and **every timed anchor is derived from the same model** (my call): 100 points is the time of a rested, conditioned marine at effective Fitness 24 (`FIT_MAX`), and 40 points the time at effective Fitness 0. The test computes and prints them, so a change to BODY's gaits moves the anchors with it and no anchor is ever out of reach.

| Event | Martian standard | 100 / 40 points (men; women +15% time, −20% reps) |
|---|---|---|
| Movement to contact | 800 m in boots and utilities, one turn at 400 m, the low-g gait | **3:51 / 5:33** (women 4:25 / 6:23), derived below |
| Ammunition can lifts | 2 minutes of overhead lifts of a **36 kg** can: it weighs what Earth's 13.6 kg can weighs, with 2.6 times the inertia | 85 / 40 reps |
| Manoeuvre under fire | 300 m: a 25 m sprint, a 10 m crawl, a casualty drag of 80 kg plus kit over 25 m, a fireman's carry over 75 m, two ammunition cans carried 75 m, a grenade throw at a box **55 m** out (low g throws far), a sprint to the line | derived as the movement to contact is, from BODY's crawl, drag, carry, lope and sprint (§16); 2:50 / 4:30 are working values until the test prints them |

**The movement to contact, derived** (scratch run, 2026-11-05: BODY §16.1's gaits, §16.2's acceleration on regolith at μ 0.55, §8's 32 s sprint at the end, and the lope's fitness term CAREER asks of BODY, `run = 3.6 × (0.85 + 0.015 × effFitness) × gG^0.3` m/s, the same shape as BODY's sprint; men's points):

| Effective Fitness | 0 | 4 | 6 | 10 | 12 | 14 | 18 | 22 | 24 |
|---|---|---|---|---|---|---|---|---|---|
| Lope on Mars, m/s | 2.29 | 2.45 | 2.53 | 2.69 | 2.77 | 2.85 | 3.02 | 3.18 | 3.26 |
| 800 m | 5:33 | 5:11 | 5:00 | 4:42 | 4:33 | 4:25 | 4:10 | 3:57 | 3:51 |
| Points | 40 | 53 | 59 | 70 | 75 | 80 | 89 | 96 | 100 |

The earlier anchors (2:45 / 4:00) were the US Corps' Earth figures for 880 yards: on Mars BODY's lope is 2.69 m/s and the sprint empties stamina in 32 s, so nobody could reach even the 40-point floor. With BODY's lope as it stands, without a fitness term, the 800 m takes 4:31 to 4:49 at every fitness, only the last sprint telling marines apart: a test that measures nothing. Hence the ask to BODY (cross-references).

Ammunition can lifts: ACL = round(25 + 3.4 P + 1.5 r), with P from `perf(body, 'mars')`. Classes as the PFT. The fitness score in the composite is the **average of the latest PFT and CFT** (one alone if only one has been taken).

### 7.3 The G-qualification

A centrifuge profile at the G-house, annual and before any deployment off Mars, pass/fail into three classes. BODY owns the physiology; CAREER owns the test and the gates (my call), and the class is what BODY's own model does through the profile: `gqClass(body)` runs the two parts in closed form with BODY §13.3's and §14.1's functions, and the lived test runs them tick by tick.

The acute part is run on the Long Arm **seated upright, so the load is +Gz** (PLACES §4.9: the gondola's seat set eyeballs-down, "a stool in a small centrifuge"), relaxed, without juice, at **gradual onset of 0.1 G/s** (the standard rate of a gradual-onset run), with no grey-out allowed at any point. The straining manoeuvre is taught on a second run after the profile, which does not count for the class.

| Class | The test | Gates |
|---|---|---|
| **G-1** | 2 h working at 1 G in the Ring (walking the cars, lifting, a weapons drill) in BODY's unburdened band (r = 1 G / gCond ≤ 1.15, so gCond about 0.87 or more, BODY §14.1); then the Long Arm to **3.5 G, held 2 min** | All deployments, boarding teams, consulate guard on Earth, recon and Raider selection |
| **G-2** | 2 h at 1 G no worse than "heavy" (r ≤ 1.5, gCond about 0.67 or more); then **2.5 G held 2 min**, a lander's powered descent at its troop-rated cap (SETTING §6.4; CONTRACTS §14) | Thrust riding and ship detachments; not 1 G ground posts, not selection |
| **G-3** | Below G-2 | Mars and low-g posts only; a remedial centrifuge programme (5 sessions a week, BODY) and a retest after 30 days |

**Why upright, and why 3.5 G** (after a critic's sum). On BODY's standard couch at 75°, 3 G is 0.78 G of +Gz and 2.9 G of +Gx (BODY §13.1), and nobody greys out: the earlier "10 min at 3 G on a couch" could tell no one apart. Seated upright, BODY §13.3's grey-out line is T − 1.2 = 2.6 + 1.2 × min(1, gCond) + compG − penalties. Reaching 3.5 G at 0.1 G/s, the baroreflex (compG) has built about +0.39 G, so the line stands at about **3.44 G for a Martian civilian** (gCond 0.38: grey-out, a fail), 3.71 G at gCond 0.6, 4.07 G at 0.9 and **4.19 G for a conditioned marine** (gCond 1.0: about 0.7 G in hand). A tired, dry marine loses some of that margin (0.3 at `pEff` ≥ 20, 0.15 for each % of water deficit), so the body on the day counts: come rested and watered. At 2.5 G the line is about 2.8 + 1.2 × gCond, so G-2's acute part passes almost everyone and its 1 G work decides. The 1 G work tests the conditioning the Corps deploys on (BODY §14.1 quotes CAREER's deployability standard as gCond ≥ 0.9; that standard is G-1, which BODY's own band puts at about 0.87); the Long Arm tests the acute margin a drop asks for.

In the standby the qualification fills `train-b` on sol 4 (5.4), on TIME §8.6's worked G-house block: the march to the G-house, the Ring's spin-up, two hours at 1 G and the spin-down, then your appointment on the Long Arm (`long-arm`: the physiologist's brief, the profile, recovery, about 25 minutes). The Long Arm has one seat, so the squad's other appointments run through the week, and only the player's run is on the stage. A recruit who arrives G-3 (the Callisto-born may) is on the remedial programme in the standby and retested before embarkation. Still G-3, they deploy anyway to Europa (0.134 G does not need G-1), with a note, and the Alert Battalion's 6.9 days out at 1 G (SETTING §6.5's doctrine; CONTRACTS §14) are the cost: BODY's "very heavy" or "crushing" band (§14.1) for a week, the couch and the corpsman's watch, and a lower G-conditioning start on Europa (my call).

### 7.4 Rifle qualification

WEAPONS owns the course (distances, positions, stop-motion rolls). This section needs from it a **score out of 250** and uses the real bands: **Expert 220–250, Sharpshooter 210–219, Marksman 190–209, unqualified under 190**. Annual, at least 300 days apart. An unqualified marine re-shoots within 30 days and cannot be promoted until qualified. The qualification day is a key day; a skipped qualification (the activity's outcome) rolls the course in closed form and logs every string. The rolls are Marksmanship's for the shots and Weapon handling's for the manipulations (SKILLS §2.1). A new join's qualification is the boot one, current through the first deployment (5.4).

### 7.5 Vacuum and water survival

- **Vacuum qualification** (every 2 years): the suit drills of the standby's sol 3 as a test: don to the Corps' drill standard (BODY §19.7's one donning table; SETTING §5.7: sealed in 3 minutes from the locker), a lock cycle, a simulated breach drill, a buddy check, each a roll (EVA, SKILLS) against DC 15; three of four pass. Unqualified marines cannot go on boarding teams or EVA duties.
- **Water survival** (basic, intermediate, advanced; every 2 years): in the base pool. Mars has a young sea and Europa an ocean under the ice. Recon and Raiders need advanced.

### 7.6 Tests (they print)

- **The timed events from BODY's model**: the PFT's run, the CFT's movement to contact and its manoeuvre under fire, for effective Fitness 0 to 24 in steps of 2, rested and conditioned, both sexes, two age bands; the anchors derived from them; the points. The test fails if any 100-point anchor is out of reach of effective Fitness 24 or any 40-point anchor out of reach of effective Fitness 0, or if the movement to contact's spread between Fitness 10 and 20 is under 30 s (a test that measures nothing).
- PFT and CFT points and class for P = 6, 9, 12, 15, 18, 21; the mean of 1,000 rolls at each.
- The share of new joins drawn by creation who arrive first, second and third class (target: 25 / 55 / 20%).
- **The G-qualification**: the grey-out margin through each profile, second by second, for gCond 0.38, 0.6, 0.75, 0.9 and 1.0, rested and tired and 2% dry (BODY §13.3's own functions); the class of each; G classes of the drawn birthplaces at arrival (BODY's numbers).

---

## 8. Rank and promotion

### 8.1 The grades (SETTING owns the names and insignia; the hub fixes the US Marine model)

| Grade | Rank | How | Minimum TIS / TIG (months) | Typical (peacetime, measured in the scratch model, 8.10) |
|---|---|---|---|---|
| E-1 | Private | Enlistment | | |
| E-2 | Private First Class | Automatic | 6 / 6 | 6 months |
| E-3 | Lance Corporal | Automatic | 9 / 8 | 9–14 months |
| E-4 | Corporal | Composite vs cutting score | 12 / 8 | 29 months (p10 24, p90 34) |
| E-5 | Sergeant | Composite vs cutting score; Corporals Course done | 24 / 12 | 50 months (p10 42, p90 58) |
| E-6 | Staff Sergeant | Selection board; Sergeants Course done | 48 / 36 | 7–9 years |
| E-7 | Gunnery Sergeant | Selection board; Career Course done | 72 / 36 | 11–13 years |
| E-8 | Master Sergeant or First Sergeant | Selection board; the marine chooses the track at E-7 | 96 / 24 | 15–17 years |
| E-9 | Master Gunnery Sergeant or Sergeant Major | Selection board | 120 / 36 | 19–22 years |

Officers (Second Lieutenant to General) are NPCs until the commissioning path opens (section 9.5 and the open questions).

### 8.2 Automatic promotions

On the 1st of a UTC month, a Private or PFC who meets TIS and TIG is promoted if their conduct average is ≥ 4.0 and they had no NJP in the last 3 months. Otherwise it waits a month and asks again. The promotion warrant is a paper; the pinning is at the next formation (lived or skipped).

### 8.3 The composite score (Lance Corporal to Sergeant)

After the US Corps' pre-2020 composite score, simplified (my call; the user's LONGHAUL rule of a baseline tick plus deeds, 2026-10-22, is exactly its shape: the time terms tick every month, the rest is earned):

| Part | Value |
|---|---|
| Rifle | latest qualification score, 0–250 (unqualified: the score, and no promotion) |
| Fitness | average of the latest PFT and CFT, 0–300 |
| Marks | (average pro + average con in grade) × 100, 0–1,000 |
| Time in grade | 5 per month |
| Time in service | 2 per month |
| Education | 15 per correspondence course (MCI, an activity: 6–12 h of reading in chunks, tradecraft's reading), max 75; a resident school 25 |
| Command recommendation | 0–100, the company commander's: 50 + 10 × (their trust in you, PEOPLE's −5…+5) + 20 if a billet above grade is held well, clamped to 0–100; 0 after an NJP in grade |
| Awards | as 6.5, max 100 |
| Special duty | +100 after a B-billet tour (drill instructor, recruiter, consulate guard) |

The composite is shown on the record as a sum with each part named, the way a check is (pillar 3: every number readable):

> Composite for Corporal: 214 rifle + 223 fitness + 878 marks + 45 grade + 42 service + 30 education + 60 command = 1,492. Cutting score for 0311 this month: 1,571. Not yet.

### 8.4 Cutting scores

Published on the 1st of each UTC month per MOS and grade, by Headquarters from the MOS's need. Each is a mean-reverting walk (my call): `cut = 0.7 × cut + 0.3 × target + N(0, 25)`, with targets for 0311 of **1,600 to Corporal** and **1,690 to Sergeant** in peacetime, **−80** while Mars is at war with anyone (LONGHAUL's politics phase `war`), **−30** in crisis. Other MOS have their own targets (SETTING's MOS list; 9.1 gives the infantry's). In war, the TIG minimums are halved (real wartime waivers).

### 8.5 Meritorious boards

Quarterly, each company may nominate one junior marine per grade (PFC to Corporal) for a meritorious promotion. Nominated if: standing this period pro ≥ 80 and con ≥ 80, rifle and PFT/CFT qualified, half the grade's TIS minimum served, and the squad leader's affinity ≥ +2 (PEOPLE). The **board** is a lived scene at battalion (20–30 minutes): a uniform inspection, a pull-up bar, and questions from three senior NCOs. It is resolved as three rounds against the other nominees (3–5 NPC nominees with their own sheets). **Each round reads two d20s and takes their mean** (two board members' marks, my call: a board reads a person, and two readers halve the luck, after a critic's case that a single d20's spread swamped the few points a marine can earn), for the nominees and the player alike:

1. **Uniform and bearing**: the mean of 2d20 + Leadership + named mods from BODY's hygiene and the uniform's state (pressed +1, haircut today +1, unshaven −3, a stain −2).
2. **Knowledge** (general orders, the chain of command, the Corps' history, the rifle's data): the mean of 2d20 + Tactics + 1 per correspondence course done (max +3). Tradecraft's Analysis is gone (SKILLS §2.2); the Corps' knowledge is read on Tactics (my call).
3. **Fitness**: the mean of 2d20 + (latest PFT − 200) / 20.

The highest total of the three wins; ties go to the player (tradecraft's opposed-roll rule). The winner is promoted on the next 1st, TIG waived. The paper names all nominees and their totals.

### 8.6 Selection boards (Staff Sergeant and up)

Once a year per grade, the board reads every record in the zone. A marine is **below zone** (early, at −4) from the grade's TIS minimum, **in zone** for three boards from the minimum + 24 months, and **above zone** after that (−1 for each board that passed them over). The decision is **the mean of two d20s** (two board members' readings) against a DC with the record as named modifiers; naturals do not count, because a board reads a record and is not an act (my call). Two readings rather than one keep the record, not the die, deciding most cases (section 9.4's rule for gates):

| Grade | DC (peace / crisis / war) |
|---|---|
| Staff Sergeant | 12 / 11 / 10 |
| Gunnery Sergeant | 14 / 13 / 12 |
| MSgt or 1stSgt | 15 / 14 / 13 |
| MGySgt or SgtMaj | 16 / 15 / 14 |

| Modifier | Value |
|---|---|
| Fitness reports: average RV ≥ 93 / 87–92 / < 87 | +3 / +1 / −1 |
| Billets held above grade, 12+ months | +1 each, max +3 |
| Required PME not done | −4 |
| Awards (6.5) | as listed, max +4 |
| Combat deployment | +1 (+2 for two) |
| PFT and CFT both first class | +1 |
| Rifle Expert | +1 |
| An NJP in the last 4 years | −4 |
| Below zone / each time above zone | −4 / −1 |

Computed exactly (two d20s averaged, scratch script, 2026-11-05), the share selected by modifier:

| Modifier | −3 | 0 | +3 | +6 |
|---|---|---|---|---|
| Staff Sergeant, DC 12 | 17% | 38% | 66% | 86% |
| Gunnery Sergeant, DC 14 | 7% | 23% | 48% | 74% |
| MSgt or 1stSgt, DC 15 | 4% | 17% | 38% | 66% |
| MGySgt or SgtMaj, DC 16 | 2% | 11% | 30% | 57% |

A good record (+3) is selected about two times in three at Staff Sergeant (the real Corps selects roughly 50–70% in zone at the lower grades), and the steeper curve means each point of record is worth more than it was with one die. The results paper reads like the log:

> STAFF SERGEANT SELECTION BOARD, FY52: readings 9 and 14, mean 11.5; + 1 (fitness reports) + 2 (billets) + 1 (Achievement Medal) + 1 (combat) + 1 (first-class fitness) = 17.5 against 12: selected. Promotion by the board's sequence number: 3 months.

Selected marines are promoted 0–6 months later in sequence (drawn).

### 8.7 Reductions

An NJP may reduce a Corporal or below by one grade (PEOPLE's punishment table); Sergeants and up only by court-martial. A reduced marine's TIG restarts in the new grade; marks in the old grade no longer count.

### 8.8 Billets

The chain of command (PEOPLE) fills billets when they fall vacant; this section says who is eligible and what it does to the career.

| Billet | Usual grade | Eligible (the player) | What it changes |
|---|---|---|---|
| Rifleman, point man, automatic rifleman, grenadier, designated marksman | E-1 to E-3 | always; chosen by the squad leader's readable sum before a deployment (5.7) | the kit carried and the role in the drills (COMBAT); a line on the record; the step toward fire team leader |
| Fire team leader | Corporal (a senior LCpl when short) | pro average ≥ 4.5 and the squad leader's trust ≥ +2 | 3 marines to lead: orders (COMBAT), accountability at formations, their rifles inspected by you, their discipline reported by you |
| Squad leader | Sergeant (a Corporal when short) | the platoon sergeant's trust ≥ +2 | 13 marines; you give the squad's PoD items; your FITREP RV rises with the squad's standing |
| Platoon guide, platoon sergeant | Sergeant, Staff Sergeant | board-selected grade | as above, the platoon |
| Company gunnery sergeant, first sergeant, sergeant major | E-7 to E-9 | grade | administrative and disciplinary authority over the company or battalion (PEOPLE) |

A billet held above grade for 12 months is a board modifier and +20 on the command recommendation. Being relieved of a billet is a standing event (pro −10).

### 8.9 What a promotion changes

Pay (section 12) on the effective date; insignia on every uniform (VIEWS); the gauges of those you now outrank and who outranked you (PEOPLE: a former peer may resent it); customs (you are now addressed by rank; you may now give orders); duties in the PotD (Corporals stand duty NCO, Sergeants stand staff duty); the barracks (Sergeants and up get a two-person room, not the squad bay, my call).

### 8.10 Tests (they print)

The scratch model run while writing this section (2,000 careers per row, rifle mean 221, fitness 240, marks 4.40/4.45, education every 6 months; weak and strong at ∓1 sd on each):

| Peace | Corporal TIS months p10 / p50 / p90 | Sergeant TIS months p10 / p50 / p90 | Sergeant by 48 months |
|---|---|---|---|
| Weak | 36 / 41 / 47 | 64 / 73 / 81 | 0% |
| Average | 24 / 29 / 34 | 42 / 50 / 58 | 42% |
| Strong | 17 / 18 / 22 | 29 / 32 / 37 | 100% |
| **War (−80)** | | | |
| Weak | 28 / 33 / 37 | 49 / 56 / 64 | 8% |
| Average | 17 / 21 / 25 | 31 / 36 / 42 | 99% |
| Strong | 17 / 17 / 17 | 29 / 29 / 30 | 100% |

The real test, `tests/career-promotion.test.mjs`, reruns this through the real composite and cutting-score code and prints the same table; it fails if the peacetime average median to Corporal leaves 24–36 months or to Sergeant 42–60. It also prints the board selection rate per grade for modifiers −3, 0, +3, +6 (against 8.6's exact table), the meritorious board's win rate for a nominee 0, +2 and +4 above the field's mean, and for each board the share of the outcome's variance explained by the record (9.4's measure; target 60% or more).

---

## 9. MOS and schools

### 9.1 MOS (SETTING owns the list and codes; this section owns how they are held and changed)

The working list this section relies on. Codes follow the US Corps' (my call), so builders and the user can read them; SETTING may rename.

| Code | MOS | How it is gained | Notes |
|---|---|---|---|
| 0311 | Rifleman | enlistment (the 0.1 start) | the brief's foot soldier |
| 0331 | Machine gunner | enlistment (a later start) or lateral move | weapons platoon, attached to rifle squads |
| 0341 | Mortarman | enlistment or lateral | |
| 0351 | Assaultman (rockets, breaching) | enlistment or lateral | breaching matters for boarding |
| 0317 | Scout sniper | Scout Sniper Basic Course | |
| 0321 | Reconnaissance marine | Basic Reconnaissance Course | section 11.1 |
| 0372 | Critical skills operator (Raider) | Raider Individual Training Course | section 11.2 |
| 0369 | Infantry unit leader | automatic for 03xx at Staff Sergeant | |
| 1371 | Combat engineer | lateral | |
| 2336 | Explosive ordnance disposal | lateral, at Sergeant and up | |
| 0231 | Intelligence specialist | lateral | |
| 0621 | Field radio operator | lateral | |
| 8511, 8411, 8156 | Drill instructor, recruiter, consulate guard | B-billet schools (9.4) | free MOS for the tour |
| 0916, 8531 | MCMAP instructor, marksmanship coach | courses (additional MOS) | |
| V, B | Void-qualified, breacher | Void Operations Course, Breacher Course | skill designators on the record |

- **PMOS** is one; **additional MOS** and designators are many. Billets need the PMOS (or a designator: a boarding team needs V).
- **Lateral move**: at reenlistment (always on offer if the target MOS has boat spaces), or mid-term only if the target is short and the current MOS is not (a monthly table per MOS). It sends the marine to the target's school (a chapter), keeps grade, and resets nothing else.
- Each MOS has its own **cutting score targets** (8.4). Working values to Corporal and Sergeant: 0311 1,600 / 1,690; 0331, 0341, 0351 1,580 / 1,670; 0321 1,520 / 1,620; 1371 1,500 / 1,610; 0231 1,480 / 1,590; 0621 1,450 / 1,560 (my call; real infantry cutting scores ran higher than support fields).

### 9.2 MCMAP belts (a progression, not a school)

The Marine Corps Martial Arts Programme (MCMAP, SETTING §5.5, which names the belts: tan "dust", grey "basalt", green "lichen", brown "umber", black first to sixth degree) gives CQC its ladder. A belt test is a lived block (on the mat, 60–90 min) with three CQC rolls against the belt's DC (two of three); it needs the hours of instruction and the time in belt. Each belt raises CQC's base to its floor at once. **The hours and the floors are SKILLS §6.6's** (`mcmap-grey` to `-black`, spelt as SETTING §1.4 settles); the time in belt and the test are this section's (my call).

| Belt | Time in previous belt | Hours of instruction (SKILLS) | Test DC | CQC floor (SKILLS) |
|---|---|---|---|---|
| Tan | boot camp | | | 5 (boot's floor) |
| Grey | 3 months | 25 | 14 | 8 |
| Green | 6 months, Corporal and up | 33 | 16 | 11 |
| Brown | 9 months | 37.5 | 18 | 14 |
| Black, 1st degree | 12 months, Sergeant and up, MCMAP instructor | 71 | 20 | 17 |

### 9.3 The schools

**At graduation, the floors are SKILLS §6.6's** wherever SKILLS lists the school (its id in brackets): SKILLS owns what a graduate is, and `graduate(p, id)` applies them. Where SKILLS has no row, the floors here are CAREER's proposals in SKILLS §2.2's keys, for SKILLS to adopt or change (my call).

| Id | School | Where | Length | Gates | At graduation |
|---|---|---|---|---|---|
| `cplcourse` | Corporals Course | Base Melas | 3 weeks | Corporal | PME; SKILLS `corporal` (Leadership 6, Tactics 6); +25 composite |
| `sgtcourse` | Sergeants Course | the Mariner Valley institutes' Corps campus | 7 weeks | Sergeant | PME; SKILLS `sergeant` (Leadership 10, Tactics 9, Comms 5) |
| `careercourse` | Career Course | the same | 7 weeks | Staff Sergeant | PME; proposed: Leadership 12, Tactics 11, Comms 6 |
| `aic` | Advanced Infantry Course | Base Melas | 10 weeks | Sergeant–Staff Sergeant, 03xx | proposed: Tactics 12, Marksmanship 12, Weapon handling 12 |
| `cls` | Combat Lifesaver | Base Melas | 1 week | any | SKILLS `cls` (Medicine 7) |
| `cmc` | Combat Marksmanship Coach | Base Melas range | 2 weeks | LCpl+, Expert | proposed: Marksmanship 12, Leadership 5; 8531 |
| `mai` | MCMAP Instructor | Base Melas | 3 weeks | Corporal+, green belt | proposed: CQC 12, Leadership 6; 0916 |
| `void` | Void Operations Course | Phobos Naval Yard | 4 weeks | PFC+, vacuum qual, G-2 | SKILLS `eva-qual` (EVA 10, Zero-g 8, Tech 4); V |
| `breacher` | Breacher Course | Phobos Naval Yard | 3 weeks | LCpl+, V | proposed: Demolitions 9, EVA 10, Zero-g 9; B |
| `lang` | Lang Belta | Base Melas, evenings, or full time at the institutes | 12 weeks full time to working (my call: a creole with an English base, tradecraft's FSI category I is 30 weeks for a full language) | any | Lang Belta working |
| `ssbc` | Scout Sniper Basic Course | Base Melas range and the valley | 12 weeks, 3 phases | LCpl–Sgt, Expert, PFT first class, G-1 | SKILLS `sniper` (Marksmanship 15, Fieldcraft 14, Awareness 12, Tactics 8, Comms 6; Warfighting 30); 0317 |
| `brc` | Basic Reconnaissance Course | Recon school, Melas | 12 weeks, 3 phases | section 11.1 | SKILLS `recon` (section 11.1) |
| `oic` | Orbital Insertion Course | Melas and the Tharsis drop zones | 4 weeks | recon or Raider | proposed: EVA 12, Zero-g 10; insertion wings |
| `dive` | Under-ice Combat Diver Course | Hellas lake, then Europa | 6 weeks | recon or Raider, water advanced | water survival master; dive badge |
| `sere` | Survival, Evasion, Resistance and Escape | the Tharsis back-country | 3 weeks | recon, Raider, aircrew | proposed: Fieldcraft 12; the resistance phase lived |
| `as` | Raider Assessment and Selection | the Raider school, Melas | 3 weeks | section 11.2 | section 11.2 |
| `itc` | Raider Individual Training Course | the Raider school, then Phobos and Deimos | 9 months, 4 phases | selected at A&S | SKILLS `raider` (section 11.2) |
| `di` | Drill Instructor School | the recruit depot | 11 weeks | Sergeant–Gunnery Sergeant | proposed: Leadership 12; 8511; a 3-year tour |
| `recruiter` | Recruiters School | the institutes | 7 weeks | Sergeant–Staff Sergeant | proposed: Social 12; 8411; a 3-year tour |
| `msg` | Consulate Guard School | the institutes | 8 weeks | LCpl–SSgt, conduct ≥ 4.5, single below E-6 | 8156; two posts (10.2) |

Parachutes work on terraformed Mars: at the valley floor the air is about 0.95 kg/m³ against Earth's 1.225, and with 0.38 G a jumper's terminal speed is about 0.7 of Earth's (v ∝ √(g/ρ)), so the Orbital Insertion Course jumps from drop ships in Martian air as Earth's jump schools do, and adds the re-entry insertion pod for airless moons (my call).

### 9.4 How a school plays

A school is a **chapter** (TIME's mechanics) with its own key days:

1. **The offer.** Schools come in the "what is open to you" paper (tradecraft's `offers()` shape: what is open, and what is closed with the reason) after every deployment and every 6 months in dwell. Each open school shows its seat chance this quarter (a table per school, 30–90%). "PFT first class needed: yours is second (231)" is a closed line.
2. **Travel there** is lived at its ends (the departure, the arrival) and skipped between (TIME).
3. **Each week**, the player sets how free hours go: **study** (+1 on the next phase's exam roll), **extra PT** (fitness load, BODY), **rest** (stress and injuries, BODY), **classmates** (gauges, PEOPLE), **letters** (section 14). Each week prints a short paper.
4. **Key days** are lived: the first day, each phase's **test day** (a long march, a shooting string, a navigation night, a medical lane, a board), and graduation.
5. **The phase's result is its test day plus one exam roll** (my call, after a critic's case that a phase decided by one d20 made months of preparation a lottery ticket). The test day holds five graded rolls, each the event's own skill (SKILLS's value with Warfighting) + named modifiers (fitness ((PFT + CFT)/2 − 235) / 15 on physical events, injuries and needs from BODY, a recon graduate +2 in Raider phases) against the phase DC; the exam is one more roll, with study's +1. Each roll scores its grade (SKILLS §5.6, as points: disaster −3, bad −2, miss −1, pass +1, good +2, superb +3). **The phase passes at 6 or more**, an average of a pass a roll. Naturals count (a test is an act). Fail: **recycle** (repeat the phase, its weeks added) once per course; a second fail: **dropped** (back to the unit, pro −5, reapply after 12 months for sniper, recon and Raider schools, 6 months for others). A test day that is skipped rolls its five events in closed form, each in the log.
6. **Injury**: 4% per phase a training injury (BODY decides which) that drops the marine for medical reasons (no standing loss; reapply on recovery) (my call).
7. **Drop on request**: the player may quit at any time, in a scene with the senior instructor; pro −3.
8. **Graduation**: SKILLS's `graduate(p, id)` raises every listed skill's base at once to its floor if it is under it, and Warfighting to the school's WF floor (SKILLS §6.6; tradecraft's `FLOORS`, applied at the end, not a point at a time), plus the training hours SKILLS counts normally. **Honour graduate**: the highest sum of phase results in the class (the classmates are NPC sheets): pro +10 and a line on the record.

**How every gate is decided** (my call, the rule behind 5, 8.5, 8.6, 11.1, 11.2 and 15.4): the lived events are the gate and the die is only the margin. A gate sums several graded rolls of the events the player prepared for, or reads two dice averaged where it is a board; where one decisive roll remains (a borderline selection) it is 2d10 (spread 4.1 against a d20's 5.8). For each gate the tests print the pass rate by modifier and **the share of the gate's score variance explained by preparation** (the candidate's modifiers going in, over bot candidates spread as section 26 says), with a target of 60% or more. Measured in the scratch model (2026-11-05, modifiers uniform from 8 to 20): a phase result 67%, against 30% for the single d20 it replaces.

### 9.5 B-billets and the officer path

- **Drill instructor and recruiter** tours are 3 years at the recruit depot or a recruiting station: chapters of a season at a time with 4–6 lived key days each year (a recruit's crucible night, a graduation, a hard case; a family that won't sign). They pay special duty pay, add +100 to the composite for a Sergeant and a +2 board modifier, and raise leadership or social to 14. Their places are a later milestone (PLACES).
- **Consulate guard** is a deployment (10.2), lived.
- **Commissioning** (an enlisted marine to Second Lieutenant: Officer Candidates School 10 weeks, then the Basic School 6 months) is reserved for after 1.0: at 1.0 it ends the enlisted career as a "commissioned" ending that unlocks an officer start later. Open question 1.

---

## 10. Deployments

### 10.1 The cycle

Rifle battalions at Melas rotate through MSF-E once it stands at its cap: **7 months on station, about 14 months home** (a 1:2 dwell, after the US unit deployment programme) (my call). A four-year first term holds two battalion deployments, or one and an individual deployment. Individual deployments take the marine out of the battalion for their length (ship's detachments, boarding teams, consulate guard, Callisto) or for good (recon, Raiders).

A battalion's next deployment is not a choice: it is the rotation. Individual ones are applications from the offers paper. The first recruit's battalion goes as a reinforcement (5.9), and the battalion that relieves it in seven months is the first of the rotation.

### 10.2 The catalogue

Each entry is data (`src/sim/career/deployments.js`), so a deployment added is a row added. "At least three kinds of everything": each entry carries at least three arcs and at least six kinds of day.

| Id | Deployment | Where | Tour | Who goes | Gates | Hazards and pays | Kinds of day (beats) | Arcs (three or more) |
|---|---|---|---|---|---|---|---|---|
| `esf` | **MSF-E (Still Water)**: the Martian Stabilisation Force, Europa, Operation STILL WATER (SETTING §7.6) | 2/4's Pwyll sector (Pwyll Deep, the Tyre Works, Manannán) from FOB Pwyll; MSF-E's headquarters at Camp Halloran in Conamara; reception and staging at Camp Lofn on Callisto (SETTING's names) | 7 months | battalion | none beyond the rotation | radiation on the surface, pressure, 0.134 G; imminent danger, tax exclusion, afloat in transit, family separation | checkpoint shifts, works guard at the Tyre intakes and the Pwyll catapult, foot patrols in the under-ice streets, crowd control (non-lethal), cordon and search, escort of UN observers, the quick reaction force, surface work by dosimeter, mail call | the bomb-maker (the Lantern); the union strike at the catapult; the observer who asks too much; the kid at the checkpoint; the tainted water |
| `mardet` | Ship's Marine Detachment | an MCRN frigate, destroyer or battleship | 6–9 months | individual, a cruise | G-2, vacuum qual | thrust, ship combat, decompression; afloat, imminent danger in a zone, combat | brig watch, armoury, reactor access sentry, damage control drills, boarding party standby, honours for a visitor, battle stations strapped in | the prisoner in the brig; the stowaway; the reactor scare; the captain's guest |
| `bt` | Fleet Boarding Team | a corvette task unit | 3–4 months | individual | G-1, V designator (breacher preferred) | zero-g close quarters; hazardous duty (boarding), afloat, combat | 2–4 interdiction boardings a week (haulers, smugglers, Belt runners), suit maintenance, rehearsals, the long coast between | the false manifest; the crew who wouldn't open; the warhead in the ice |
| `belt` | Belt Anti-Piracy Task Group | the Belt lanes or the Jovian gulf | 4–6 months | platoon embarked | G-2, vacuum qual | as `bt` plus a raid | convoy escort, boardings, a raid on a lair, survivors | the lair in the trojan rock; the hostages on the water hauler; OPA won't let us land |
| `callisto` | Callisto Garrison | the MCRN's Jovian base | 12 months, or 24 with family (my call) | individual, a change of station | none | 0.126 G (centrifuge mandatory, BODY), low radiation | base security, quick reaction force for Ganymede and Europa, training, dome-town liberty | the black market in the dome; the sabotaged shuttle; the ice-face strike |
| `msg` | Consulate and embassy guard | the Martian mission on Earth (1 G), consulates at Ceres Station, Tycho, Ganymede Station, Luna | two posts of 12–18 months | individual, after the school | 9.3; G-1 for Earth | special duty pay; 1 G for a year on Earth | post at the gate, visitors and walk-ins, protests, drills, the Marine ball, liberty in a foreign city | the defector; the protest that wasn't; the stranger at the bar (an EID approach); the ambassador's son |
| `phobos` | Phobos Naval Yard security | the yard sheds and cradles | 2–3 months | platoon, in dwell | vacuum qual | near-zero g; hazardous duty (EVA) | shed patrols in free fall, cradle watch, EVA rounds, a visiting warship | the stranger in the shed; the welding accident; the drunk chief |
| `relief` | Disaster relief on Mars | a Tharsis dome, the sea coast, a farm district | 2–6 weeks | company or battalion | none | dust, breach, cold | search and rescue in suits, field kitchens, security against looting, clearing | the family under the rubble; the looters; the dome that won't hold |
| `exercise` | Fleet exercise under thrust | a troopship and a target rock or Deimos | 3–6 weeks | battalion, once per dwell | G-2 | 1 G for weeks; afloat | drills under thrust, a drop onto the rock, live fire in vacuum, the debrief | the drop that went long; the umpire; the stuck lock |
| `ganymede` | Ganymede reinforcement | Martian domes and farm works on Ganymede | 3–7 months | battalion | G-2 | 0.146 G; imminent danger, combat pay if it comes to war | lock watches, patrols of the farm domes, a standoff with UN Marines, war if it comes | the standoff at the lock; the farm dome; the war |
| `station` | Station reinforcement | a Martian consulate on an OPA station in crisis | 2–8 weeks | platoon | G-2 | 0.3 G spin at Ceres, crowds | reinforce the consulate, evacuate citizens, escort through riots | the riot at the ring; the citizen who won't go; the Star Helix sergeant |
| `titan` | Show of force at Saturn | Titan's stilt towns, aboard | 9–12 months with transits | company embarked | G-1 | 8–15 days' transit each way; Titan's cold air | the long voyage, a stilt-town visit, a survey escort | the survey that found something; the cold; the long way home |

### 10.3 The generator: from the world to the offers

The world's politics (LONGHAUL's `politics.js` and `conflict.js`, ported by TECH) drive demand. Each day the world layer (TIME) updates the zones; this section reads them weekly (my call). The places stay fixed: every entry's posts, hulls, bases and towns are PLACES's authored ones, the same in every career. What the world and the career's stream decide (the user's "assignments, opportunities, mission details are all procedural", 2026-11-05) is which entries are offered, when and to whom, the orders and their dates, the hull a detachment rides of its class, and on a tour the arcs, incidents and missions that come:

| World state | Adds or changes |
|---|---|
| The Jovian accord holds (SETTING) | `esf` is a standing rotation; `mardet`, `callisto`, `msg`, `phobos`, `exercise` are standing |
| An `insurgency` zone at Europa (OPA influence there is 0.30, over LONGHAUL's 0.2 threshold) | `esf` intensity +1 (more cordons, bombs, contact); hazard and combat pays more likely |
| A `pirates` zone in the Belt or the Jovian gulf, or a `proxy` war against Martian shipping | `belt` offered; `bt` seats ×2 |
| Earth–Mars `crisis`, or a `standoff` at Ganymede | `ganymede` offered to the next battalion in rotation; leave restricted to 24 h recall |
| Earth–Mars `war` | `ganymede` as a front; ship detachments surged; leave cancelled; EAS extended until the war ends (stop-loss); cutting scores −80, TIG halved (8.4) |
| Mars–OPA crisis | `station` at Ceres offered |
| A Mars disaster event (TIME's world events: storm, breach, quake) | `relief` to whichever battalion is home |
| OPA tension at Titan (rare) | `titan` |

**Individual offers** are weighted: `w = base × gatesOK × worldK × seatChance`. Base weights: `mardet` 3, `bt` 2, `belt` 2, `callisto` 2, `msg` 1, `phobos` 2, schools as 9.4, recon and Raider screening each 1 when their gates are met. The offers paper lists every open one with its length and dates, and every closed one with its reason.

**The first deployment** of a new world's first recruit is `esf` (5.9). A next recruit's first is the next deployment of the battalion they join.

### 10.4 On a deployment

- **There is always a base**: FOB Pwyll on a Europa tour, the berthing aboard, the consulate's quarters. The day ends there (the brief).
- **Every day of a tour starts live at reveille by default** (2.2, my call). The FOB is the base: the platoon's three shifts in rotation (PEOPLE §4.7: patrol, checkpoint and guard, rest and the quick reaction force, 8 h each), chow in the FOB's windows, the rationed shower, the rack and the comm booth are activities, and each shift is a block lived or carried on (TIME §9.3) with its beats.
- **Chapter days are an opt-in from the tour's third week**, never the default: from then on the day card (TIME §10.3) offers Spend it and Carry on beside Live this day, which stays first. Each week still holds 1–3 forced key days (an operation, an arc beat, an inspection, the crisis, 10.5), and TIME §10.5's story beat every week runs whichever way the player lives.
- **Arc beats** are seeded at the start: 2–3 of the entry's arcs, their beats spread over the tour's acts (10.5), each a lived day (PEOPLE runs the people in them, COMBAT any fight).
- **The deployment record**: `{ id, kind, fromMs, toMs, where, unit, billet, keyDays, ops, firefights, unitKia, unitWia, self: { wounded, doseSv }, sector: { from, to }, awards, end }` with `end` one of `rotated`, `evacuated`, `recalled`, `killed`; `self.doseSv` is read from BODY's `deploySv` at the end, and `sector` is 10.5's two boards.
- **The end**: the relief-in-place paper (10.5), the return voyage (TIME), a post-deployment paper (the tour in numbers and lines), the end-of-period marks, the awards board (6.5), a post-deployment health assessment at Melas (BODY: dose, wounds, stress), and **block leave** of 20–30 days (section 13).

### 10.5 A Europa tour's shape and its score

A tour of 18 to 45 hours needs a shape beyond the weekly beat, and the player's checkpoint conduct and patrol choices need somewhere to add up (my call, after a critic's case that nothing visible measured how the sector was going).

**The sector board.** A screen in FOB Pwyll's briefing room (an in-world instrument, VIEWS's grammar), updated weekly and read out at the platoon's brief on the week's first day:

| Line | From | Shown as |
|---|---|---|
| Each district's mood: Pwyll Deep, the Tyre Works, Manannán | PEOPLE §12.4's mood `M` | its word (calm, uneasy, tense, angry, riot) and its trend over the week |
| Incidents a week, by kind | PEOPLE §2.5's happenings (protests, detentions, attacks, accidents, uses of force) | counts against the tour's first week |
| Water and power uptime at the Works | PLACES's utilities (§3.12) | percent, and the hours lost |
| The unions' attitude | SETTING §7.5's Accord unions and Hard Ice, moved by the world and by the platoon's dealings | a line each |
| The platoon's dose | BODY's `deploySv`, summed, against the rotation's planning limit (15.6) | mSv spent and left |

It shows only what the force knows (the hub: what a screen could know); a district the platoon never patrols shows last week's report from Star Helix, aged.

**Three acts** (my call), seeded at the tour's start and bent by what the player does:

1. **Settling in** (weeks 1 to 4): the relief in place at the Tyre Works with 1/7's guides, the first patrols, learning the districts and their people; the incidents at their baseline. These are the two weeks every day is lived, and two more.
2. **Escalation** (weeks 5 to about 16): driven by the world's zones (LONGHAUL's insurgency and standoff at Europa, SETTING §2.3's pinned zones) and the seeded arcs (10.4); each district's mood moves with what the platoon does at its checkpoints, at its searches and in its crowds (PEOPLE §12.4's table).
3. **The crisis** (one set piece in months 4 to 6, a forced key day): drawn from the entry's arcs and the sector's state: the strike's riot at the Pwyll catapult, the Lantern's bomb in a Tyre melt hall, a seal sabotaged in a low street, a hauler's crew taken. **Its shape is set by the moods the platoon built**: a calm Pwyll Deep sends the union's own marshals to hold the crowd off the Works; an angry one sends the crowd. Then the last weeks and the handover.

**The relief-in-place paper.** At handover the platoon commander's paper compares the sector at arrival with the sector at handover: each district's mood, incidents a week, the Works' uptime, the uses of force and their reviews (COMBAT §9.7), the platoon's dose, and the dead (ours, theirs and the civilians). It is a score that matters twice: **the awards board reads it** (6.5: the platoon's top marines' write-ups; a sector left calmer than it was found adds to the Achievement Medal's odds), and **the next rotation inherits it** (its starting moods are these). It is filed in the deployment record as `sector: { from, to }`.

---

## 11. Reconnaissance and special operations

Recon is the first step off the line: deep, quiet, small teams. The Raiders (my working name for the Corps' special operations battalions; SETTING names them) are the top of the ordinary ladder. Both follow the tradecraft illegal's shape: gates at the door, a long school that is a time skip, **floors applied at graduation**, and an over-skill raised at the end. A further tier (a unit the record does not name) is past 1.0.

### 11.1 Reconnaissance

**Gates** (to apply for the screening; my call, after real recon screening practice and tradecraft's `ILLEGAL_AGE`):

| Gate | Value |
|---|---|
| Grade | PFC to Sergeant |
| Time | 6 months at the unit, or a deployment done |
| Age | 30 or under on the screening day |
| Fitness | PFT and CFT both ≥ 235 (first class) |
| G | G-1 |
| Quals | vacuum qualified; water survival intermediate (advanced by graduation) |
| Record | no NJP in 12 months; conduct average ≥ 4.3 |
| Endorsement | the company commander's trust ≥ 0 (PEOPLE) |

**The screening** is one lived day and night at the recon company. Every event scores; the sum is the gate, and the first sergeant's board is only the margin (9.4's rule):

| Event | What | Its score |
|---|---|---|
| 1. 05:00, the PFT in the G-house | must stay first class (235): under it, the screening ends there | floor((PFT − 235) / 10) |
| 2. The pool and the tank | a 500 m swim (Fitness), then a vacuum-tank drill in neutral buoyancy, water as a zero-g stand-in (EVA) | two graded rolls, DC 15 |
| 3. The march | 16 km on the valley floor with a **45 kg** pack (at 0.38 G it weighs what 17 kg weighs on Earth, and has all 45 kg of inertia when you turn or stop), **under 3 h 30 min**, time from BODY's `courseTime`: over it, the screening ends | +1 for each 10 min under the limit |
| 4. Land navigation at night, four points | a Fieldcraft roll at each | four graded rolls, DC 15 |
| 5. The interview with the recon company's first sergeant | a talk scene: Social with the record as modifiers ((pro average − 4.4) × 10, combat deployment +1, an NJP ever −2) | one graded roll, DC 15 |

Graded rolls score SKILLS §5.6's grades as points (disaster −3 to superb +3, 9.4). **The bar is 14** (my call): 17 or more passes; 10 or less does not; between, the first sergeant reads the day and adds 2d10 − 11, and 14 passes. Each roll is in the log; the result paper prints the sum the way a check is printed. Measured in the scratch model (2026-11-05; candidates with roll modifiers 8 to 16, interview modifiers 3 to 8, PFT points 0 to 4, march points 0 to 3, uniform): **61% of gate-qualified applicants pass** (target 55–65%), and preparation explains **84%** of the score's variance. A candidate with roll modifiers of 8 passes 20% of the time, 12 passes 60%, 16 passes 85% (interview 5, PFT points 2, march points 1).

**Why 3 h 30 min** (after a critic's sum): BODY's Mars walk is 1.14 m/s, above which the walk passes the Froude limit and becomes a lope (BODY §16.1), so 16 km walked takes 3 h 54 min; the earlier "under 3 h" asked 1.48 m/s, faster than anyone can walk on Mars. Under 3 h 30 min, about 15 minutes (2.6 to 2.9 km) of the march must be loped under the pack, and with the lope's fitness term (7.2) the fitter marine needs less of it and arrives with stamina to spare.

**The Basic Reconnaissance Course**: 12 weeks, 3 phases (fundamentals, fieldcraft and surface survival, mission planning and the final exercise), phase DCs **20, 21, 22**, each phase decided by its test day and exam roll at a result of 6 or more (9.4), one recycle, 4% injury per phase.

| Measured (scratch model, 40,000 runs a modifier) | Modifier 10 | 12 | 14 | 15 | 16 | 18 | 20 |
|---|---|---|---|---|---|---|---|
| Graduates | 0% | 5% | 33% | 52% | 70% | 86% | 87% |

The top of the curve is the injury rate (4% a phase). A typical candidate (an own 10 in the event's skill, at Warfighting 30 a value of 13 by SKILLS §3, with fitness +1 and the body rested) sits near 15: about half graduate, close to real recon attrition. The curve is steep where the old single d20 was flat (21% to 86% over the same span): two points of preparation are the difference between a likely drop and a likely pass.

**Floors at graduation** are SKILLS §6.6's `recon` (Marksmanship 14, Weapon handling 14, CQC 12, Fieldcraft 16, Awareness 14, Tactics 10, Leadership 6, Comms 9, Medicine 9, EVA 12, Zero-g 12, Demolitions 6, Driving 4, Fitness 16; **Warfighting 50**), and water survival advanced. PMOS 0321, the recon badge. The marine changes station to a recon company (at Melas: the old squad stays down the road, my call).

**Recon deployments** attach a recon platoon to MSF-E, a fleet task group or the Jovian command: 7 months, **6–10 missions** from the generator (11.3) with recon kinds, the rest training and standby at the forward base.

### 11.2 The Raiders

**Gates** (my call, after real special-operations screening):

| Gate | Value |
|---|---|
| Grade | Corporal to Staff Sergeant |
| Time in service | 36 months (24 for a recon graduate) |
| Age | 21–34 on the first day of selection |
| Fitness | PFT and CFT both ≥ 250 |
| G | G-1 |
| Quals | vacuum qualified and V designator, or a recon graduate; water survival advanced (or earned in the course) |
| Record | no NJP in 24 months; pro and con averages ≥ 4.5, or fitness-report RV average ≥ 90 |
| Experience | one deployment completed |
| Over-skill | Warfighting ≥ 30 |
| Endorsement | the battalion commander's |

**Assessment and Selection**: 3 weeks with lived key days, and every one of them scores (9.4's rule):

| Event | What | Its score |
|---|---|---|
| The first day's fitness | the PFT at 1 G and the CFT at 0.38 G | F = floor(((PFT + CFT) / 2 − 250) / 10), 0 to 5 |
| **The long walk** | a solo night navigation of 40 km down the valley with 50 kg, a 24 h limit (BODY's walk makes it in about 10 h; the limit is for the lost and the hurt) | four navigation legs, Fieldcraft, DC 20: four graded rolls; a leg at `bad` or worse adds 2 km |
| Team events with unknown tasks | a log carry in Mars g (Fitness), a casualty carried a kilometre in suits (EVA or Fitness, the candidate's pick), a puzzle lock under a clock (Tech or Awareness) | three graded rolls, DC 20 |
| The psychological interview | a talk scene with the selection psychologist | one graded roll: Nerve or Social, DC 15 (Nerve is a quarter of Warfighting, SKILLS §2.2, so the easier DC keeps it in the same range as the rest) |
| The record | Warfighting and a recon graduate's head start | W = floor(Warfighting / 10) − 3; a recon graduate +2 |

**The bar is 18** (my call): a sum of 21 or more is selected; 14 or less is not; between, the board (the selection cadre's commander and two operators) adds 2d10 − 11, and 18 is selected. Naturals count (each event is an act), no recycle. Measured in the scratch model (2026-11-05; roll modifiers 12 to 20, F 0 to 4, Warfighting 30 to 49, a fifth of them recon graduates, uniform): **42% of gate-qualified applicants are selected** (target 30–45%; real special-operations selection runs at about a third), and preparation explains **65%** of the score's variance. With F 2 and Warfighting in the 30s, not a recon graduate: roll modifiers of 14 are selected 14% of the time, 16 are 33%, 18 are 60%, 20 are 76%. Not selected: back to the unit, no standing loss, reapply after 12 months, twice in a career.

**The Individual Training Course**: 9 months, 4 phases (special-operations fundamentals: shooting and trauma medicine; small-unit tactics and surface operations; close quarters battle and boarding in every gravity; irregular warfare and the final exercise across Phobos and Deimos), DCs **20, 21, 21, 22**, each phase its test day and exam roll at 6 or more (9.4), one recycle. Measured (scratch model): modifier 14 graduates 22%, 16 is 66%, 18 is 81%, 20 is 83% (target 60–80% for the selected, who sit mostly at 16 to 20).

**Floors at graduation** are SKILLS §6.6's `raider` (Marksmanship 17, Weapon handling 17, CQC 16, Fieldcraft 17, Awareness 16, Tactics 13, Leadership 10, Comms 10, Medicine 11, EVA 15, Zero-g 15, Demolitions 11, Driving 6, Fitness 18; **Warfighting 65**, tradecraft's illegal's school raised Tradecraft to 80, and the tier-one operator stays above), and Lang Belta basic. PMOS 0372, the Raider badge, Raider pay (12.3).

**The team**: a Raider team of 14 (a captain, a master sergeant as team chief, two elements); PEOPLE generates them as tier 1, with careers, records and memories of their own.

**Raider deployments**: 6 months as a special-operations task force at a forward base (Callisto, a frigate, Ganymede Station, Phobos), **3–6 missions** from the generator, the rest training and standby.

**Leaving**: not one way (my call: a real special-operations career is survivable, unlike the illegal's post). A Raider may lateral back to the infantry at reenlistment with grade kept, or is moved out by a medical downgrade. The pay stops; the badge stays.

### 11.3 The mission generator

The user, tradecraft rc52: "there should be insane variety in mission descriptions and specifics"; and 2026-11-05: "game world is handcrafted, events and world politics, assignments, opportunities, mission details are all procedural". So the variety is in the mission, never in the place: a mission is drawn from tables in seven steps, each on its own rng stream (so one table's growth never moves another's draws), from `stream('mission', worldSeed, careerId, n)`, and it is set in a place that is authored and the same in every career.

**1. Kind** (weighted by unit and theatre, and by the world: a hostage rescue needs a hostage event in the world feed or a 10% base):

| Kind | Recon | Raiders | Objective | Length |
|---|---|---|---|---|
| Special reconnaissance (observe, report, no contact) | ● | ● | a place and the questions about it | 1–4 days |
| Pathfinder and landing-zone survey | ● | | an LZ to survey and mark | 1–2 days |
| Sensor emplacement | ● | | a route to wire | 1 day |
| Track a vehicle across a surface | ● | | an ice crawler or rover | 1–3 days |
| Direct action raid | (limited) | ● | a site to destroy or seize | hours |
| High-value target capture | | ● | a person, alive | hours–2 days |
| Hostage rescue | | ● | hostages in a structure | hours |
| Opposed boarding | | ● | a ship coasting or under thrust | hours |
| Personnel recovery | ● | ● | a downed crew, a stranded officer | 1–3 days |
| Counter-proliferation | | ● | a stolen warhead from a wreck | 1–5 days |
| Sabotage | | ● | a facility or a hull | hours |
| Derelict investigation | ● | ● | a hulk: what happened, the logs | hours–1 day |
| Salvage denial | | ● | a wreck's core before the UN reaches it | hours–1 day |
| Protective detail | | ● | a Congress delegate on a visit | 1–3 days |
| Evacuation of citizens | ● | ● | a consulate's people from a station | 1 day |

**2. Setting**: an authored place (PLACES §8's special-operations settings, the catalogue's sites and the hulls of each class, every one hand-made and the same in every career; each kind lists the settings it may use). The draw picks which of the kind's authored instances, and **where in it** the mission happens: the objective's room, deck or ground, the opposition's positions and patrols, the hostages' cell, the cache's block, the insertion and extraction points, all placed on the place's own rooms, spots and waypoints, among the candidates its author tagged for them (PLACES §9.8's operation spots; my call). Weather, light, a storm or a tumble are the world's state on the day, not the place's layout. The kinds of setting:

| Setting | Gravity | Air | Particular hazards |
|---|---|---|---|
| Spun station ring (Ceres, Hygiea Ring) | 0.3 G spin, Coriolis | pressurised | crowds, civilians |
| Station hub and docks | 0 | pressurised and vacuum | traffic, locks |
| Derelict hull, cold and dark | 0 or tumbling | vacuum | debris, a leaking reactor, traps |
| Ship under thrust (the deck stack) | thrust | pressurised | the flip, the crew |
| Ship coasting | 0 | pressurised | |
| Asteroid mine or lair (Belt or trojan rock) | ~0.001 G | tunnels, some pressurised | dust, tethers |
| Europa's surface | 0.134 G | vacuum | about 5.4 Sv a day: every minute counted |
| An under-ice town | 0.134 G | pressurised | civilians, cramped, water |
| Under the ice, in the ocean | 0.134 G | water | cold, dark, pressure |
| Martian highlands in a dust storm | 0.38 G | thin; masks above datum | dust, cold, no sky |
| A Tharsis dome town | 0.38 G | dome air, 31 kPa outside | civilians, MSS |
| Ganymede's farm domes | 0.146 G | pressurised | crops, farmers |
| Callisto's crater fields | 0.126 G | vacuum | cold |
| An Io corporate lab | 0.183 G | vacuum outside | radiation lethal in minutes outside the shield, eruptions |
| A Titan stilt town | 0.138 G | 147 kPa of N₂ and methane, −180 °C | the cold, unbreathable but no pressure suit needed |
| Phobos yard sheds | 0.0006 G | mixed | |
| An Earth city (deniable, very rare) | 1.0 G | air | gravity, police, crowds |

**3. Opposition** (from the setting's owners and the world's zones), with a quality band for SKILLS's NPC levels (my call): ice-town militia 6–10; Hungry Dark, Rust Queens or Knife Season crews 8–14; smugglers 6–12; Ceres Free Belt cells 8–14; corporate security (Luna-Kepler) 10–14; Brannock mercenaries 12–18; EID agents 12–18; UN Marine reconnaissance 14–20 (crisis or war only); a mutinous MCRN crew (very rare) 12–16.

**4. Target specifics**: a person (a persistent PEOPLE person with a dossier, generated with the mission like every person and kept, tradecraft's `dossier.js`), an object (a warhead, a data core, a drive part), a place (a room, a hull section or a site of the authored setting), or a vehicle.

**5. Constraints** (0–2, briefed): deniable (no Martian insignia or kit, civilian suits); capture alive; no civilian casualties (a strict ROE card, COMBAT); silent (an alarm moves the target); a time window (a dose budget in Sv, the ship's flip in so many minutes, a storm front, a UN ship's arrival); a comms blackout; no lethal force against OPA personnel; recover the data intact.

**6. Complications** (0–2, hidden, revealed in play): more hostiles than briefed (×1.5–2); the hostages moved; civilians where none should be; a suit breach on insertion; the drop ship damaged and the extraction late; a UN observer team on site; a solar particle event; a power failure; the structure starts to tumble; a decompression; the target is someone a squadmate knows; a defector asks for asylum; a booby trap; an MNI officer on site who won't say why; the opposition offers to surrender on terms.

**7. Insertion and extraction**: a drop ship through Martian or Titan air (with parachutes on Mars); a powered landing on an airless moon; EVA from a corvette on a cold approach; a breaching collar; a hard dock under a false flag; on foot through the town; an ice crawler; the valley rail; out by the target's own ship; a pickup in a time window.

**Naming and the brief**: an operation codename from LONGHAUL's Martian vocabularies (`names.js` `MARS_WAR`, `MARS_WEAPON`, `MARS_WIND`: "Operation SARISSA", "Operation KHAMSIN"), never repeated in a world. The brief is written paragraph by paragraph (situation, mission, execution, constraints, what intelligence is unsure of), each paragraph from a pool of several phrasings dealt per mission, so a theatre's next brief repeats no paragraph until its pools run out (tradecraft's measured 1,013 briefs with 2,331 different paragraphs is the bar).

**Shape of a mission**: the brief (lived: the team in a room); **the load-out, lived at the team cage**; the rehearsal and the sleep (chapter hours); insertion (lived); the objective (lived, COMBAT); extraction (lived); the debrief (a paper).

**The load-out** is lived (my call, after a critic's case that choosing what to carry is the brief's "having to manage their own bodily needs and their weapon", 2026-11-05, and the user's inventory rule, "very little storage space, no magic inventory, volumes and pockets", tradecraft 2026-10-26). At the team cage, the split inventory card (VIEWS) sets your carrier, pack and suit against the team's stores: magazines and water against the plan's hours and contacts, the suit's consumables against the dose budget and the time window (BODY §19.3), batteries, charges, the medical kit, rations; every item goes into a named pouch with its mass, and BODY's carry rules (§16.3) say what the load does to the gait, the turn and the stamina. The team chief checks it (a short scene: "Two more magazines. You'll want them, or you'll carry them home"). What is not in a pouch is not carried. A Raider who skips the cage takes the team's standard list, which is sensible and never quite right for the mission.

### 11.4 Mission outcomes

| Outcome | Meaning | Effects |
|---|---|---|
| Clean | objective met, no friendly losses, constraints kept | full XP; standing +5; award write-ups likely; the world: insurgency pressure −, crisis pressure unchanged |
| Costly | objective met with friendly dead or wounded | XP ×0.9; the memorial; standing +3 |
| Partial | part of the objective | XP ×0.6 |
| Aborted | called off in time | XP ×0.3; no blame if the call was right (the debrief says) |
| Compromised | Martian hands shown on a deniable job | XP ×0.4; a LONGHAUL incident (+0.03 pressure on the pair, its rule); standing −5 for the team leader |
| Failed | the objective lost (the hostages die, the warhead goes) | XP ×0.3; an inquiry paper; standing −5 |

**XP bases** for career-scale events, offered to SKILLS's over-skill formula (tradecraft's `missionXP = base × outcome × craft × risk`; my numbers): checkpoint shift 1, patrol 4, cordon and search 6, firefight 12, boarding 15, special reconnaissance 14, direct action 20, HVT capture 22, hostage rescue 25, counter-proliferation 25; opposition risk multiplier 0.8 + quality/20; a deployment completed +10 (+15 if it saw combat).

### 11.5 Tests (they print)

- 1,000 missions per unit per theatre: the count of distinct (kind, setting, opposition, constraint, complication) combinations, the most repeated pair and its share (fails above 4%), and the share of incompatible draws (must be 0).
- 1,000 briefs: distinct paragraphs, and the longest run before a theatre repeats one.
- The screening, BRC, A&S and ITC pass rates for bot candidates at modifiers 8–20, through the real code, beside the tables above; for each, the share of the score's variance explained by preparation (target 60% or more; measured 84%, 67% a phase, 65%).
- A load-out bot that packs for a 12 h mission: every item in a named pouch, the total mass, BODY's weight and mass ratios, and the stamina it leaves at the objective.

---

## 12. Pay

### 12.1 The scale

Money is LONGHAUL's credit, written "MCR" (the hub). LONGHAUL pays a ship's hand 150–560 MCR a month (`careers.js` `WAGE`), a shore leave 60 MCR a head and an academy course 400 MCR. OLYMPUS sets **1 MCR ≈ US$14.5** of purchasing power (my call), which puts a Martian private (145 MCR) beside a merchant deckhand (120) and keeps LONGHAUL's prices sensible.

### 12.2 Basic pay (MCR per 30-day period)

Shaped after the US 2025 basic pay table (grade steps and two-yearly longevity steps), divided by 14.5 and rounded (my call; computed in a scratch script while writing). Years are years of service on the pay date. A grade's figure holds for the years past its last column.

| Grade | <2 | 2 | 3 | 4 | 6 | 8 | 10 | 12 | 14 | 16 | 18 | 20 | 22 | 24 | 26 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E-1 Private | 145 | | | | | | | | | | | | | | |
| E-2 PFC | 163 | | | | | | | | | | | | | | |
| E-3 LCpl | 171 | 182 | 193 | | | | | | | | | | | | |
| E-4 Cpl | 190 | 200 | 208 | 218 | 228 | | | | | | | | | | |
| E-5 Sgt | 207 | 221 | 231 | 242 | 259 | 277 | 285 | | | | | | | | |
| E-6 SSgt | 226 | 249 | 260 | 270 | 281 | 306 | 316 | 335 | 341 | 345 | 350 | | | | |
| E-7 GySgt | 261 | 285 | 296 | 311 | 322 | 341 | 352 | 372 | 388 | 399 | 411 | 415 | 430 | 438 | 470 |
| E-8 MSgt, 1stSgt | | | | | | 376 | 392 | 403 | 415 | 428 | 452 | 465 | 486 | 497 | 525 |
| E-9 MGySgt, SgtMaj | | | | | | | 459 | 470 | 483 | 498 | 514 | 539 | 560 | 582 | 616 |

### 12.3 Special pays and allowances (per period)

| Pay | Amount | Rule |
|---|---|---|
| **Imminent danger pay** (hazard pay of place) | 0.53 MCR a day, max 16 | each day in a designated hazard area: Europa under the accord, and any active LONGHAUL zone of kind insurgency, pirates, standoff, skirmish or front where the marine is |
| **Combat pay** (hostile fire) | 16 | a period in which the marine came under hostile fire or within 100 m of a hostile explosion (COMBAT reports it); replaces imminent danger pay for that period (the real rule: one or the other) |
| **Hazardous duty pay** | 10 per duty, max 2 duties | in the period: 4 h or more of EVA in vacuum; an insertion jump or drop; demolition work; boarding team duty; radiation work (10 mSv or more received on duty) |
| **Afloat pay** | 3 + 1 per 12 cumulative months afloat, max 15, by the day | days aboard a ship underway |
| **Family separation allowance** | 17 | with dependants, away from them over 30 days |
| **Special duty pay** | drill instructor and recruiter 31, consulate guard 10, MCMAP instructor 5 | while in the billet |
| **Raider pay** | 50 | 0372 in a Raider unit |
| **Language pay** | 7 | Lang Belta working or better, on a deployment where it is spoken |
| **Housing allowance** | 60 (E-1 to E-4) to 110 (E-7 up) | married and living off base |

Barracks marines eat at the mess free and sleep in the squad bay free; meals and rooms on leave are their own money.

### 12.4 Deductions, savings, bonuses

- **Republic income tax**: 9% of taxable pay (my call). **Combat zone tax exclusion**: all pay in a period with a day in a hazard area is untaxed (the real US rule; the orders paper tells the recruit).
- **Terraforming levy**: 1% for service members (SETTING §4.10's one name; civilians pay 12%).
- **Forfeitures** from NJP or court-martial (PEOPLE sets them).
- **Allotments**: standing orders the player sets at S-1 (to a parent, a partner, savings); they move family gauges (section 14).
- **Deployed savings**: on a deployment up to 70 MCR a period at 10% a year, compounded per period, paid out on return (the real Savings Deposit Program).
- **Enlistment bonus**: 0, or 350 for a 6-year term (my call).
- **Selective reenlistment bonus**: multiple × basic pay × years reenlisted; multiples by MOS: 0311 0–1.5, 0331–0351 0.5–2, 0321 2–3, 0372 3–4, set yearly by the MOS's shortage.

### 12.5 Pay day and the LES

Pay day is every 30 UTC days from the pay epoch (2.3). Pay goes into the account; cash is drawn at a terminal in the PX or the town bank. The **Leave and Earnings Statement** is a paper on the wrist terminal:

> LEAVE AND EARNINGS STATEMENT · PERIOD 2 (22 JAN – 20 FEB 52 UTC)
> HOLLOWAY, MAREN · PFC · 0311 · E/2/4 · MSF-E
> Basic pay 163.00 · Imminent danger 15.90 (30 days)
> Tax 0.00 (combat zone exclusion) · Terraforming levy 1.79 · Allotment (S. Holloway) 20.00 · Deployed savings 40.00
> Net 117.11 · Balance 352.40 · Savings 80.33 (10%)
> Leave: earned 2.5, used 0, balance 7.5 days · Next pay 21 FEB

(The first recruit's pay epoch is 00:00Z on 2351-12-23, the standby's Friday, sol 4: 2.3.)

If the career is in a place the pay cannot reach (a comms blackout), pay is credited when the link returns; nothing is ever lost.

### 12.6 Money at the start

The recruit arrives with **40 MCR cash** and the depot's last pay in the account: `round(2 × basic × 0.9) + 50` travel allowance, 311 MCR for a Private (my call; tradecraft, rc34: "start with some money in our accounts").

### 12.7 Prices

**The prices are SETTING §11's one list** (`setting/prices.js`), which folded in this section's earlier working table at its prices: the PX, Redwater, travel and Europa. PLACES's and PEOPLE's shops and TIME's `px` activity read it; a shop's markup is a multiplier on it, never a second list. This section owns only what money is for in a career (pay, allotments, savings, 12.8's gear).

### 12.8 Personal gear that matters

Money buys a few things marines really buy that make a small, honest difference (my call, after a critic's case that pay day was only flavour). Each is a kit item with its mass and its pouch (VIEWS's inventory), each is checked for regulation at inspection (PEOPLE §11.10), and none is a magic fix: the effect is a number another section already models.

| Item | MCR | What it does | At inspection |
|---|---|---|---|
| Earplugs and an eye mask | 1 (proposed for SETTING §11) | squad-bay sleep quality 0.95 → 1.0 (BODY §7.1's rack factor); −2 on waking to a voice in the night (reveille's lights still wake you) | permitted, in the footlocker |
| Personal boots and insoles, better than issue | 18 to 40 (SETTING §11) | the feet's blister hazard on humps, the MRX and patrols halved (BODY's feet, which CAREER asks for); broken in over three humps | regulation pattern only (SETTING §5.7): a non-regulation pair is a gig |
| Liner gloves | 3 (proposed; SETTING lists shooting gloves at 6) | the hands' cold rating +10 K (BODY §10.5): no bare-hands penalty at −30 °C, frostnip far later; thin enough to cost nothing in the hands' rolls | in the field, not at a formation |
| A civilian wrist terminal with alarms and a dosimeter readout | 25 to 120 (SETTING §11) | alarms you set (TIME §3.3); on Europa, the dosimeter's rate and dose on the wrist without calling up the suit HUD (BODY §12.2) | permitted |
| A reading lamp | 4 (proposed) | study and letters in the rack after taps (a manual's chunk, SKILLS §6.4) without the duty NCO's torch; rack neighbours' sleep quality −0.05 (PEOPLE) | on the rack's shelf; a gig if lit after 22:30 |
| A personal hydration system | 8 (proposed) | a bladder in the pack with a tube: drinking on the move without a stop (BODY's thirst; TIME's drink becomes a sip on the march) | in the field |

Against a Private's 145 MCR a period, each costs a month's pay or less and all six together more than a month: a choice between them, the PX's coffee and an allotment home, not a shopping list.

---

## 13. Leave and liberty

- **Liberty** is free time off duty: evenings after the last block, rest sols, weekends. Radius **300 km** on Mars in dwell, **30 km** (Redwater) on standby with the wrist terminal on and a 2 h recall (my call). Lance Corporals and below are back by 24:00 on working nights (a curfew), and go into town at night with a buddy (real liberty-risk practice).
- **Special liberty**: 72 or 96 hours after a field exercise or a deployment.
- **Leave accrues** 2.5 days per pay period (30 a year), carried over to a maximum of 60 at the end of the UTC year (the excess is lost), advance leave to −5 (real rules, my call on the advance). On Mars each sol away is charged as one day (the 39 minutes are a gift, my call).
- **Block leave** after a deployment: 20–30 days, charged.
- **Emergency leave**: a death or grave illness in the family: on Mars 5–10 days (advance allowed); off Mars it is not granted (weeks away), and the chaplain brings the news.
- **R&R**: 4 days at Callisto in the middle of a Europa tour (my call).
- **Asking**: leave is requested at the company office (a short scene) at least 14 days ahead; denied on standby, in war, or within 30 days of a deployment.
- **Lived, not abstracted.** The towns are places, authored by PLACES and the same in every career (the user, 2026-11-05: "game world is handcrafted"): Redwater, Londres Nova, a Hellas lake town, a Tharsis dome, the sea coast. A home town on Mars holds the family's house, one of the town's authored houses, given to the family when it is drawn (my call). Travel is lived at its ends and skipped between. A leave day is lived or taken as a chapter day with a choice: go home, stay in town, travel, rest, train on your own (the gym, the rifle club, the dojo), see someone.
- **What leave buys**: BODY's stress and sleep reset; family ties (+30 a visit); relationships (PEOPLE); gear bought in town (12.8); a tattoo (the close figure); training hours at a club (SKILLS). LONGHAUL's cabin fever is the model for what its lack costs: after 21 days without liberty, PEOPLE and BODY start to charge for it.
- **What it risks**: drink (BODY's drugs), fights, Martian Security in town, missing the bus back (unauthorised absence). PEOPLE's discipline decides; this section records.
- **Recall**: a world alert recalls marines on leave by terminal: report within 24 h on Mars, the trip back lived.

---

## 14. Family, letters and news from home

### 14.1 Ties

Each family member holds **ties** (0–100) beside PEOPLE's three gauges, read in bands: **close** (70 and up), **warm** (40–69), **distant** (20–39), **estranged** (under 20 for 60 days: a partner writes the letter that ends it; a parent stops writing until you do). Ties and affinity shape the letters' tone and how often they come.

Ties rise with contact: a letter +10 to +25 (by tone, 14.2), a care package +5, a call +15, a visit +30. Without contact they fall **0.5 a day**, with three rules that keep them a relationship and not a rota (my call, after a critic's sum that four relatives at 0.5 a day each needed a letter every few weeks):
- **The decay halves while you are deployed or in transit** (0.25 a day): families know the mail is slow.
- **It stops for 30 days after an honest letter** to that member (`holdUntilMs`): an honest letter buys a month of being understood.
- **The instinct mentions a tie only when it is about to drop a band** (within 7 days of crossing, at the decay it is on), in one note-tone line ("Your mother's last letter was three weeks ago. She'll be counting."), never as a gauge.

### 14.2 Writing home

An activity (TIME §8.7's `letter`: 20 min to write or record) at a rack, a desk or a terminal. The player picks the recipient, **one member or a household** (4.8: a letter to the household gives each member at that address 70% of its effect, my call), a **tone** (cheerful, honest, short, asking for something, sorry) and, for each recent event on the record (a promotion, a wound, a death in the squad, a punishment), **tell** or **don't tell**.

| Choice | Effect |
|---|---|
| Cheerful | ties +15; their worry eases; your stress −3 (BODY) |
| Honest | ties +20; affinity +1 if they are proud, worry up if they are worried; stress −6 |
| Short | ties +10 |
| Asking for something | ties +10; a care package 60% likely in reply |
| Sorry | after a quarrel: affinity +1, ties +20 |
| Hiding a wound or a punishment | nothing now; if they learn it later (a casualty notice, a squadmate's letter, a visit), trust −2 |

Mail on Mars is delivered next day. Off Mars it goes at the speed of light (31–56 minutes one way from Jupiter, LONGHAUL's ephemeris) at the next **comms window** (daily at a base, on the ship's schedule aboard, never during an operation's blackout).

### 14.3 Letters back

Each member writes at a mean interval of `max(10, 40 − 0.3 × ties)` days, 5 days sooner if proud or worried, drawn exponentially. A letter is a paper written from: a reply to your last letter, a beat of their arc (14.4), home news, and the season. 15% carry a **care package** (real coffee, socks, a book that counts as training material, a photograph, a dome-grown apple). At a base, **mail call** is TIME §9.2's `mail-call` block (18:30: names called in the bay by the platoon's mail clerk), a short lived moment; aboard and at the FOB it follows their own Plans of the Day.

### 14.4 Arcs (a pool; each 2–4 beats over months; at least twenty, my call)

A sister's wedding (a leave request that may be refused); a father's chronic cough (dome air, a clinic bill you can help with); a younger brother who wants to enlist (your letters push him one way or the other: section 21); a mother's water-rights job cut by the Unity Caucus's budget (LONGHAUL politics); the family farm hit by a storm; the family moves to Londres Nova; a cousin aboard an MCRN hull (and what happens to that hull in the world); a grandmother's hundredth; a niece born; the parents part; a debt (send money: allotments); a fire in the dome; **the home town's first rain** (the terraforming milestone, "One Day Rain"); the family dog; a partner's new job far away; a partner's pregnancy; an old friend in trouble with Martian Security; a parent's illness and death (Gompertz below); a sibling's graduation; the family on the news because of you.

**Family deaths**: family members age and die on LONGHAUL's Gompertz hazard, **0.00005 · e^(0.095 · age) a year** (computed: 1 in 1,160 a year at 30, 1 in 450 at 40, 1 in 170 at 50, 1 in 67 at 60, 1 in 26 at 70), checked daily on the careers' own stream, as LONGHAUL does. Over a twenty-year career about half of recruits lose a parent (a parent of 49 on day one dies within 20 years with p ≈ 0.27 by this hazard). (There is no random natural death for the player: their body is BODY's to kill.)

### 14.5 News from home

The wrist terminal carries the world's headlines (LONGHAUL's politics: "Budget fight: the MCRN Admiralty wins the vote against the Congressional Unity Caucus") and a weekly digest of the home town's paper (TIME's world layer makes the events; this section writes the home-town lines), each stamped with its age. Off Mars the device only has what came in on the last comms window: no omniscient feed.

### 14.6 Calls, marriage, children

- **Calls**: on Mars, a terminal call home in free time (a talk scene, time standing still). Off Mars, video letters only.
- **Marriage and children** come through PEOPLE's gauges with a partner: past a threshold, a choice event (propose, or be proposed to); a wedding on leave; dependants bring family separation and housing allowances, letters, worry, and reasons to reenlist or not. A child born while deployed is a photograph in a letter. Tone and depth are an open question (6).

---

## 15. Injury, limited duty and medical boards

BODY owns wounds, healing and care. This section owns what a body's state does to a career.

### 15.1 Duty status

BODY reports conditions with `expectedDays`, `permanent` and per-regime `deployable` flags. They map to a duty status: **fit**; **light duty** (up to 14 days: no PT, no field); **limited duty** (LIMDU, 6 months); **unfit** (in hospital).

### 15.2 Limited duty

Periods of 6 months, at most two. A marine on LIMDU works the company office, the armoury window or the duty desk in the PoD (lived or skipped), sees the doctor monthly (a short scene), cannot deploy, is exempt from the PFT and CFT (the composite keeps the last scores), and may attend PME schools.

### 15.3 Evacuation

Badly hurt on a deployment, the marine is evacuated (COMBAT's CASEVAC, BODY's care): to the FOB's surgery, then the Callisto hospital, then Mars if recovery is over 30 days. The deployment record ends `evacuated`; on recovery the marine joins the battalion's rear party at Melas and rejoins it when it comes home.

### 15.4 Medical boards

A board is convened when: not fit for full duty after 12 months of LIMDU; BODY marks a condition `permanent` at moderate severity or worse (a limb lost, an eye, a moderate brain injury, the spine); the career dose passes its limit (15.6); a permanent G downgrade bars the MOS (a Raider who can no longer hold G-1); repeated G-LOC or a juice stroke (BODY).

The **decision** is read like a check: **the mean of two d20s** (two board members' readings, 9.4's rule) + modifiers against **DC 13**, naturals not counting (a board reads a record). With two readings the spread is narrower, and DC 13 keeps a moderate condition with a good comeback mostly fit with a limitation (my call):

| Modifier | Value |
|---|---|
| Condition severity: minor / moderate / severe / catastrophic | 0 / −3 / −6 / −10 |
| A PFT after the injury: ≥ 200 / ≥ 235 | +2 / +4 |
| The MOS's demands: combat arms | −2 |
| Wartime | +2 |
| A commander's letter (trust ≥ +3) | +1 |

Margin ≥ 0: **fit for full duty**. Margin under 0 down to −5: **fit with a limitation**, a deployability code on the record ("Mars only", "no thrust over 1 G", "no radiation duty") that filters deployments and may force a lateral move. Below: **unfit**, with a rating.

Computed exactly (scratch script, 2026-11-05), fit / limited / unfit by total modifier:

| Modifier | −10 | −7 | −4 | −1 | 0 | +2 | +4 |
|---|---|---|---|---|---|---|---|
| Fit / limited / unfit (%) | 0 / 4 / 96 | 0 / 16 / 84 | 7 / 31 / 62 | 23 / 43 / 34 | 30 / 44 / 26 | 48 / 39 / 14 | 66 / 29 / 5 |

A moderate condition in an infantryman who came back to a PFT of 235 is −3 + 4 − 2 = −1; a severe one with the same comeback is −4; a lost leg without one is catastrophic and almost always unfit, which the comeback (15.7) and the appeal answer.

### 15.5 Ratings, severance, retirement

Ratings follow the condition (a table after the US disability schedule, my call): a leg below the knee 40%, above 60%; an eye 30%; a moderate brain injury 40–70%; partial spinal 30–60%; a chronic G injury 10–30%; a career radiation overdose 0–30% plus lifelong monitoring. **Under 30%: separation with severance**, 2 × monthly basic × years of service (at least 3 years; at least 6 if the injury came from combat). **30% or more: medical retirement**, a pension of basic × max(rating, 2.5% × years), at most 75%.

**Appeal**: a formal hearing, a talk scene: Social against DC 15. A margin of 5 or more turns "unfit" into "fit with a limitation" or adds 10% to the rating.

### 15.6 Radiation limits: the Corps' one table (my call)

**This table is the Corps' dose limits, and every other section cites it** (BODY §12.3 for the physiology, SETTING §7.3 for the regulation's lore, COMBAT §15.3 for the operational plan, TIME §3.1 for the dose clock): five sections once carried five sets of numbers, and the dosimeter is Europa's main clock. Doses are BODY's ledgers (§12.2: `deploySv` for the rotation, `yearSv` a rolling 365 UTC days, `careerSv`), read here and never copied; constants carry their unit.

| Limit | Value | Counts | Who may pass it | What happens at it |
|---|---|---|---|---|
| **Rotation, planning** (`DOSE_ROTATION_PLAN_SV`) | **50 mSv** | `deploySv`, from arrival in Jovian space to departure | nobody plans past it: every surface job's plan is a slice of what is left | off surface duty for the rest of the rotation, unless the commander authorises more |
| **Rotation, commander's authorisation** (`DOSE_ROTATION_CMD_SV`) | **150 mSv** | the same | the battalion commander, in writing, for operational need | off all radiation duty for the rotation; life-saving only |
| **Life-saving** (`DOSE_LIFESAVING_SV`) | **250 mSv** in the rotation | the same | an officer's order, to save a life, volunteers only (the US EPA's emergency guide gives 250 mSv for life-saving) | a medical review (BODY's blood count) and the 15.4 board if the annual or career limit is passed |
| **Annual** (`DOSE_YEAR_SV`) | **250 mSv** | `yearSv`, every source: voyages, ships' berthing, Phobos, the surface | none | off radiation duty (the Jovian surfaces, Io, reactor spaces) until the rolling year falls under it; a medical review |
| **Career** (`DOSE_CAREER_SV`) | **1.0 Sv** | `careerSv` | none | a medical board (15.4) ends Jovian and radiation duty; from 0.8 Sv (80%) barred from Jovian surface duty for the career, the rest kept for life-saving |

- **COMBAT §15.3's EVA dose plan is an operational sub-limit under the rotation's planning limit**: each surface job's plan (20 mSv by default) is set so the marine's rotation stays under 50 mSv, the squad leader calls return at 80% of plan, and **its emergency ceiling is the life-saving figure**, 250 mSv in the rotation less what the marine has already taken, on an officer's order.
- **TIME §3.1's dose clock** reads against the rotation's planning limit ("DOSE 1.2/50 mSv · 13 min").
- **Why these numbers.** At ICRP's nominal 5.5% added lifetime cancer risk per sievert, the career limit is about 5% more risk (NASA's career limit is 0.6 Sv). The annual limit leaves room for a ship's detachment (a warship's berthing at 25 µSv/h is about 110 mSv in six months, BODY §12.1) and for a rotation spent to the commander's figure. A light vac suit on Europa's surface takes about 90 mSv an hour (SETTING §7.3), so the rotation's plan is about half an hour of surface work, the commander's figure under two hours, and the career limit about eleven hours in a whole career: the dosimeter is a currency.
- **Enforcement** is `medical.js`: the bars go on the record as `doseBars` (3.1), the offers paper and the deployments' gates read them, and the post-deployment health assessment prints the three ledgers against the table.

### 15.7 The comeback

A marine who lost a limb and has BODY's prosthetic may be found fit if they pass the PFT at 200 and the CFT at 200 within 12 months; back to a ground-combat MOS if the CFT reaches 235 (my call). It is a story the game should allow.

---

## 16. Discipline's mark on a career

PEOPLE owns the discipline system (what is an offence, who sees it, counselling, NJP, courts). This section records what each does to the career.

| Event | Record | Career effect |
|---|---|---|
| Counselling (page 11) | an entry | con −5 (6.1) |
| NJP | an entry | con −25, mark capped at 3.9; no promotion for 6 months; command recommendation 0 in grade; a possible reduction (8.7) and forfeiture (12.4); reenlistment code RE-3 if two or more |
| Summary or special court-martial | an entry | the brig (status `brig`, skipped with outcomes), reduction, forfeiture; a bad-conduct discharge possible |
| General court-martial | an entry | as above; a dishonourable discharge possible; career ends `court` |
| Pattern of misconduct (three NJPs, or two and a counselling for the same) | an administrative separation board (a lived hearing) | separation with a general or other-than-honourable characterisation; career ends `admin` |
| Unauthorised absence | hours and days counted | under 24 h a counselling; over 24 h an NJP; over 30 days **deserter**: dropped from the rolls, career ends `deserter` (MSS may still be looking for you, an epilogue line) |
| Failing PFT or CFT twice in a row | a remedial programme | a third failure: administrative separation for failing standards |

Characterisation on discharge: **honourable** (conduct average ≥ 4.0 and no court-martial), **general** (under honourable conditions), **other than honourable**, **bad conduct**, **dishonourable**. Reenlistment codes: **RE-1A** eligible, **RE-3** eligible with a waiver, **RE-4** not eligible.

---

## 17. End of enlistment and reenlistment

- **The window** opens 365 days before EAS: the battalion's career planner (a tier-3 person) calls the marine in (a lived conversation), and the offers paper lists what is open, with boat spaces.
- **Eligibility**: Lance Corporal or above at a first-term EAS (a PFC needs a waiver, a Private is not eligible); PFT and CFT passed; RE-1A or RE-3 with waiver; conduct average ≥ 4.0.
- **Offers** (each with its chance of a boat space this month, falling 10% a month as spaces fill, my call): reenlist in the PMOS (with the bonus, 12.4); a lateral move with its school; a duty choice (Callisto, a ship's detachment, consulate guard, a recon screening seat, a B-billet); a school seat. Each closed offer prints its reason.
- **Terms**: 2–6 years.
- **Extension**: 1–24 months to finish a deployment or reach a school.
- **Never mid-deployment**: an EAS that falls on a deployment is extended to the return (tradecraft, 2026-11-04: "they don't retire mid-post"; real practice). In war, EAS waits for the ceasefire (stop-loss, 10.3).
- **Not reenlisting**: the last 10 sols are `separating` (turn in the gear at supply and the armoury, a final medical, the check-out sheet walked in reverse, the squad's send-off) and the career ends `eas` with an honourable discharge if the record allows. A prior-service marine may come back later as a start (section 22).

---

## 18. Retirement

- **Eligibility** at 20 years of service. **Pension**: 2.5% × years × the final basic pay, per period, for life (after the US legacy system, simplified, my call).
- **Service limits** (high-year tenure, approximately the US Corps' own): a Corporal must leave at 8 years, a Sergeant at 13, a Staff Sergeant at 20, a Gunnery Sergeant at 22, a Master or First Sergeant at 27, an E-9 at 30. A marine at a limit without a promotion separates (before 20 years) or retires (at or past it).
- **At the end of a deployment only**, never mid-tour.
- **The ceremony** is lived at Melas or wherever the unit is: the parade deck, whoever of the old squad still serves (PEOPLE knows), the certificate, the shadow box with the medals, the folded flag, a speech by the sergeant major. Then the epilogue paper: what the retiree did next (dealt from their record, birthplace and family: a bar in Redwater, the Mariner Valley institutes as an instructor, the family farm).
- **Retired is alive**: the former player character becomes a tier-3 person in the world (section 21).

---

## 19. Death

BODY decides when the body dies. The sequence (my call on its order; the user's rule that a big outcome lands with a splash, 2026-11-04):

1. **The last seconds** play as they happen (stop motion if in a fight; COMBAT and BODY's reflex choice where one is plausible).
2. **The splash**: the stage zoomed close on the body (VIEWS), the clock stopping, one line of what happened, in the log's voice.
3. **Standard only**: two buttons, **Load a save** and **Accept**. Loading rewinds the world with the save; nothing below happens. Ironman goes straight on.
4. **The casualty report**: a paper (KIA, died of wounds, non-hostile, lost with a hull), with the place, the date in UTC and in the local clock, and what BODY recorded.
5. **The knock**: a short text vignette at the next of kin's door: two marines in dress uniform, what is said.
6. **The last roll call**: the unit's memorial service as a splash scene (30–60 s, skippable): the battlefield cross (boots, rifle, helmet, ID tags), the first sergeant calling the name three times, then taps. Who stands in the formation is whoever lives (PEOPLE).
7. **The service record**: the whole career as a paper (ranks and dates, deployments, awards, schools, the last marks, the squad).
8. **The memorial** entry (section 20).
9. **Unlocks** (section 22).
10. **The world goes on**: a screen with the world's date, a line of what it is doing, and **Enlist the next recruit** (section 21).

**The body**: recovered and buried at home (the family's town); committed to the void aboard a ship far from home (a Navy custom); **lost with a hull** (LONGHAUL, 2026-10-31: who goes with a hull doesn't come home: on the memorial, no body); missing in action, presumed dead after a year.

### 19.1 The agency rule

**Every lethal path passes through a player decision or a warning the character could perceive** (my call, after a critic's case that losing twenty hours of an Ironman career to a die nobody chose would break the user's trust; the hub should carry it as a settled rule, cross-references). TIME §7.6 already keeps death out of splashes: BODY's bands put a crossing before every lethal threshold. This section extends the rule to every system that can kill:

- **A decision may lie upstream of the moment**: the helmet sealed at general quarters, the couch you took, the kit you stowed, the dose you chose to spend, the climb you started, the seal you did or did not check. COMBAT's railgun slug gives no warning in the moment (COMBAT §13.3: "That dread is the design"), so a passenger's survival must rest on those choices: COMBAT §13.6's interior model makes them matter (an inner berth against a hull-side couch, sealed against open, strapped in against loose, loose kit as projectiles), and the captain's "Brace for kinetic impacts" is the warning.
- **A warning the character could perceive** is one the instinct can voice (SKILLS §14): the range's "cease fire", the Tank's pressure alarm and its seconds to repressurise, a squadmate's muzzle across you, the cold in your hands, the dosimeter's alarm.
- **Someone else's mistake** (another marine's negligent discharge on the range, a role-player's real weapon, a fall from the tower in front of you) is held under the garrison budget by WEAPONS's range safety, its berms and its tables, and by PEOPLE's NPCs following the same rules the player does.
- **A death that passes through no decision and no warning** (a slug through a sealed, couched, inner-berth marine) is allowed only inside the budget below.

### 19.2 The lethality budget

The tests print the player's death rate for every kind of stretch, so nobody has to guess whether a quiet tour ends one careful Ironman career in fifty or one in five (my call, the targets after a critic's proposal). The rates are for a player who **follows T** (the instinct's line, which voices only what the character knows); the `careless` bot (PEOPLE §17) prints beside it for comparison.

| Stretch | Target, following T | What the test drives |
|---|---|---|
| A garrison sol at Melas (PT, the range, the Tank, the obstacle course, the MRX's blanks) | **under 1 in 20,000** a sol | the `recruit` bot, 100,000 sols in outcome mode |
| A voyage day, no engagement | under 1 in 10,000 a day | the voyage in outcome mode |
| **A ship engagement as a passenger**, suited, helmet sealed, couched in inner berthing, loose kit stowed, strapped in | **under 1%** an engagement | COMBAT §13's engagement in outcome mode over 10,000 seeds |
| The same, with one choice changed (helmet open, a hull-side couch, kit loose, unstrapped) | printed for each, and each must be visibly worse (target 2 to 10 times) | the same seeds |
| **A quiet Europa tour** (no insurgency intensity), a private | **2% to 4%** a tour | the tour in outcome mode, the player's squad on the seeded arcs |
| **A hot Europa tour** (insurgency intensity +1, 10.3) | **8% to 12%** a tour | the same |
| A recon or Raider deployment | printed (no target before 0.6) | missions from the generator |

The player's squad is where a tour's arcs fall, so the squad shares the player's rate; the battalion's average is lower (section 26's `career-runs` targets for NPCs in outcome mode). A rate above its target is a failing test, and the fix goes into the system that kills, never into a hidden reprieve for the player (pillar 7, "mistakes cost").

---

## 20. The memorial

- **The world's memorial** keeps every marine who died in the player's regiment and every unit the player served in, player or NPC: `{ name, grade, unit, mos, born, diedMs, diedSol, where, how, deployment, awards, remembered, careerId|null, mode|null }`. `remembered` is one line from PEOPLE's memories of them ("the one who sang in the head at reveille"). No cap (LONGHAUL kept 40; the lists here show the last 200 and search the rest, my call).
- **In the world**: a memorial wall at Melas (a PLACES fixture) where names are added as engraved plaques in the pixel alphabet, readable by walking up to them. A dead recruit's name is on it the next time a recruit walks past.
- **On the title**: "Memorial" lists each world's dead.
- **In the profile**: every recruit the player ever enlisted, across worlds, with how each career ended (alive or not) and in which mode it was played. An imported save shows its mark (section 23).

---

## 21. The next recruit: the world goes on

The user (tradecraft, 2026-11-04): "a campaign is the same until we start a new one (geopolitics and date/time continue on the same timeline when we die or retire an officer and pick the next one)". The hub: "the next recruit can enlist into the same world."

- **When**: the next recruit arrives at Melas **56 UTC days** after the last career ended (tradecraft's `SUCCESSOR_WEEKS 8`), moved to the next working sol at 12:40 local. The world runs the gap in outcome mode (TIME's layers, PEOPLE's careers at low detail).
- **Where**: a rifle squad in whichever of the regiment's battalions is at Melas; if the last recruit died in a squad of a battalion that is home, **60% the new recruit fills that vacancy** (my call): their rack, their locker, the squad who knew them. If no battalion is on standby, the first arc is the dwell's training weeks until the battalion's orders (same shape: arrival, the three stops, lessons, the mission rehearsal exercise, orders).
- **Who**: the three candidates of the quick pick may include a **younger sibling** of a dead or retired recruit (marked `mayEnlist` in 4.8, now 18 or older, and whose letters did not turn them away). Their family is the same family.
- **What persists**: the world's date, politics, ephemeris and news; every persistent person and what they remember (the old squad leader is now a platoon sergeant; the squad says "you're in Holloway's rack"; the DI asks after the dead recruit); the memorial; the gossip.
- **The former player character**, if alive (EAS, retired, discharged), becomes a **tier-3 person** in the world (my call): living in their home town, or in Redwater 30% of the time, with their record and their scars; the next recruit can meet them.
- **A new world** is always available instead.

---

## 22. Unlockable starts

The user (tradecraft rc26): "we unlock more and more advanced starters after a game over if we made it to the level +1 basically". Reaching a rung in any career unlocks starting at the rung below it. The top rung is never a start except in debug mode (tradecraft's rule).

| Rung | The start | Opened by reaching |
|---|---|---|
| `newjoin` | New join, fresh from the School of Infantry | always open |
| `lcpl` | Lance Corporal with a Europa tour behind you | Corporal, or two deployments completed |
| `cpl` | Corporal, a new fire team leader | Sergeant |
| `sgt` | Sergeant, a new squad leader | Staff Sergeant |
| `recon` | Reconnaissance marine, a new BRC graduate | selection at Raider A&S |
| `raider` | Critical skills operator, a new ITC graduate | the tier above (past 1.0); debug only at 1.0 |

**Side starts** (my call) open when a career completes that deployment, not by rung: ship's detachment (start aboard a frigate as a detachment's new marine), Callisto garrison, consulate guard, **prior service** (a former marine back after a few years out, opened by any career that ended `eas`).

**Every advanced start is a history, not a teleport** (the user's consistency rule): the start writes a backdated record (deployments that happened in the world's past or, in a new world, in SETTING's history before the start date), skills raised as that history would raise them (schools' floors applied), scars from BODY's table, family aged, and **the people of that history placed in the world**, generated for it like everyone (the old squad leader, a dead friend on the memorial wall). Every start still arrives at Melas and checks in (a shorter sheet for a transfer), so the first arc's shape holds (my call).

**Legends** (tradecraft, 2026-11-03: "remove the debug character, we should replace this section to read Legends and it should be available even with debug mode off"): a small set of veterans' histories with reasons to be at Melas (a gunnery sergeant reduced to corporal after an incident nobody discusses; a Callisto ice miner who came back on a prosthetic leg; a Raider back from a medical retirement; a Belter-born recon marine with family in Conamara). What is authored is the history, its reason, its scars and its mastery; the person who lived it is generated when the legend is chosen, from the world's seed, like every person (the user, 2026-11-05: "All people generated"; my call, so a legend is never a written character), and the player may redraw or edit the name and the face as on the enlistment paper. What a legend's reason gives them, they have mastered (skill floors of 18 there, tradecraft's `LEGEND_FLOOR` pattern). A later milestone; available without debug, like tradecraft's (my call).

Unlocks are earned in **both modes** (default of open question 3). Debug mode opens every rung.

---

## 23. Ironman and Standard

The hub settles both (kickoff, 2026-11-05). This section adds:

- The mode is chosen on the enlistment paper and **never changes** in a career. **Standard is ticked on a profile's first enlistment paper**, with Ironman one click away and its meaning printed under both boxes ("IRONMAN: one save, kept for you. If you die, the career is over and the world goes on."); afterwards the paper ticks the mode of the profile's last career (4.2; my call, reversing my earlier default of Ironman, for the hub's decision log). The user's kickoff decision, a choice per career at new game, is unchanged: only the box ticked by default moves.
- **Ironman** keeps **one autosave slot per world**, `ironman`, which is also its edge save (TIME owns the cadence; the hidden `ironman-prev` is offered only by recovery, TECH §7.2, CONTRACTS §12). On death it is overwritten with the world after the career ended, so "continue" goes straight to the next recruit.
- **Standard** saves anywhere, to nine manual slots beside `auto`, `auto-prev`, `day` and `edge` (TECH §7.2; CONTRACTS §12), and offers Load a save at death (section 19, step 3).
- **Export and import** exist in both. An Ironman career restored from an older export is marked `imported` on the profile and the load list, never on the Memorial Wall or the papers (TECH §15.5): the honest mark. It plays on normally.
- The memorial and the profile show each career's mode.
- No difficulty settings (tradecraft had none; mistakes cost).

---

## 24. Papers this section prints

Each is a paper object `{ kind, stamp, title, lines, atMs }` (tradecraft's papers, `campaign.js pass()` returns them), shown on the wrist terminal or the desk, filed in the record:

| Paper | When |
|---|---|
| Enlistment contract | creation |
| Recruit training summary | creation |
| Orders to Base Melas; the check-in sheet (three stops lived, the rest the sol-1 list) | arrival |
| The initial counselling's expectations (on STANDING) | sol 1, then every 6 months and on promotion |
| The readiness checklist (the platoon's whiteboard and the wrist) | from sol 1 to the lift |
| The MRX hot wash; the billets named | sol 8 |
| The Plan of the Day (TIME prints it; lessons marked) | each sol |
| Warning order; deployment orders; movement table | standby's end, predeploy |
| Leave and Earnings Statement | each pay day |
| Proficiency and conduct marks; fitness reports | marking dates |
| PFT, CFT, G-qualification, rifle and vacuum qualification cards | each test |
| Composite score and the month's cutting score | 1st of each month in grade, when eligible |
| Promotion warrant; board results; meritorious board results | as they happen |
| What is open to you (offers, with the closed ones and why) | after each deployment, every 6 months in dwell, in the reenlistment window |
| School weekly papers; diploma or drop notice | in a school |
| The sector board (a screen at the FOB) | weekly on a Europa tour |
| The relief-in-place paper; post-deployment summary | at handover; after a deployment |
| Award citations | 30–90 days after the deed |
| Letters (in and out) | as they come |
| Counselling entries, NJP, court results (PEOPLE writes, the record files) | as they happen |
| Medical board findings | at a board |
| Reenlistment contract; release from active duty; retirement certificate | the end of a term |
| Casualty report; service record | death |

---

## 25. Modules and porting

### 25.1 Modules (a proposal; TECH owns the layout)

All pure (`src/sim/career/`, no DOM), each opening with a prose header, randomness from the seeded streams (`stream('career', worldSeed, careerId, …)`), constants with units in their names (`STANDBY_SOLS`, `PREDEPLOY_SOLS`, `PAY_PERIOD_D`, `ENLIST_AGE_Y`, `DOSE_ROTATION_PLAN_SV`, `DOSE_ROTATION_CMD_SV`, `DOSE_LIFESAVING_SV`, `DOSE_YEAR_SV`, `DOSE_CAREER_SV`, `TIES_DECAY_PER_D`, `SUCCESSOR_D`).

| Module | Holds |
|---|---|
| `index.js` | the status machine (2.1); `pass(career, world, fromMs, toMs)`: the career calendar run day by day through a skip, returning papers (tradecraft's `campaign.js pass()`) |
| `create.js` | the enlistment paper, `candidates()`, birthplaces, the backgrounds' CAREER columns (SKILLS holds their points), why you joined, the call to SKILLS's starting sheet, the recruit training summary |
| `family.js` | family generation, ties, letters in and out, arcs, Gompertz for the family |
| `start.js` | arrival and the sponsor, the three stops and the sol-1 list, the standby calendar by block id, booking lessons, readiness, the billets, the vote's clock, the orders |
| `lessons/` | each lesson's beats and steps (tradecraft's `tutorial/` layout), "I've got this", the flashback's two scenes, the squad's welcome, the MRX's phases |
| `standing.js` | standing events, marks, fitness reports, the squad leader's word, counsellings' expectations, the STANDING and PATHS leaves' data |
| `quals.js` | PFT, CFT (timed events through BODY's `courseTime`, the derived anchors), G-qualification (the profiles through BODY's model), rifle bands, vacuum and water quals |
| `rank.js` | grades (data from SETTING), automatic promotions, the composite, cutting scores, meritorious and selection boards, reductions, billet eligibility (PEOPLE calls the same helpers for NPC careers: one quantity, one helper) |
| `schools.js` | the catalogue, phases (test days and exam rolls), the gate rule's scoring and boards, the call to SKILLS's `graduate()`, the offers paper |
| `deployments.js` | the catalogue, the world-driven generator, the deployment record, a tour's acts, the sector board and the relief-in-place paper |
| `missions.js` | the mission generator and outcomes |
| `pay.js` | the table, special pays, deductions, savings, the LES (prices are SETTING's `prices.js`) |
| `leave.js` | accrual, requests, liberty rules |
| `medical.js` | duty status, limited duty, boards, ratings, the dose limits' one table and its bars |
| `term.js` | EAS, reenlistment, retirement, separations, characterisation |
| `death.js`, `memorial.js` | the death sequence's data, the memorial; the lethality budget's targets (for its test) |
| `successor.js`, `unlocks.js` | the next recruit; the profile's rungs |
| `papers.js` | one formatter per paper; the paragraph pools |

### 25.2 What is ported

| Source (read-only) | Verdict | What changes |
|---|---|---|
| tradecraft `src/sim/campaign.js`: `candidates()`, `BACKGROUNDS`, `BG_MAX`, `LEVELS`, `pass()` | adapt | soldier backgrounds and birthplaces; rungs as section 22; `pass()` becomes the career calendar (UTC pay epoch, marks, cutting scores, boards) |
| tradecraft `src/sim/career.js`: `plan()`, `planPaper()`, `FLOORS`, `WEEKS_PER_POINT`, `RETIRE_AGE`, `SUCCESSOR_WEEKS`, `born()`, `ageOf()` | adapt | schools instead of language weeks; floors at graduation; the successor at 56 days; ages in Earth years from UTC |
| tradecraft `src/sim/postings.js` `offers()` | adapt | the offers paper: open, and closed with the reason |
| tradecraft `src/sim/lessons.js`, `campaign.js` `bookLessons()`, `LESSON_GAP_H`, `LESSON_XP_K` | adapt | lessons as PoD blocks at Melas, booked by TIME's block ids |
| tradecraft `src/sim/tutorial/earpiece.js` | reuse | the squad leader's voice, same pacing |
| tradecraft `src/sim/tutorial/range.js`, `paper.js` | WEAPONS adapts | used on the standby's sol 2 |
| tradecraft `src/sim/hale.js` | reference | the hearsay pattern (PEOPLE writes the squad's) |
| tradecraft `src/sim/dossier.js` | adapt | paragraph pools for orders, briefs, letters, citations |
| tradecraft `src/sim/legends.js`, `LEGEND_FLOOR`, `armedFloor()` | reference | the later Legends |
| tradecraft `src/sim/money.js` | reference | account and cash |
| LONGHAUL `js/sim/careers.js`: `naturalHazard`, `PAY_DAYS`, `WAGE` scale, records, memorial, the retirement ask | adapt | Gompertz for family and NPCs; pay epoch; records and memorial uncapped; Marine grades |
| LONGHAUL `js/sim/military.js` | reference | missions issued in a sub-faction's name and gated by rank: the generator's frame |
| LONGHAUL `js/sim/politics.js`, `conflict.js` | consumed (TECH ports them) | phases and zones drive deployments, pays, cutting scores, stop-loss |
| LONGHAUL `js/sim/names.js` (`MARS_WAR`, `MARS_WEAPON`, `MARS_WIND`, the registry) | reuse | operation codenames, never repeated |
| LONGHAUL `js/sim/service.js` `RANKS.MCR` | data | naval officers as NPCs (PEOPLE) |
| LONGHAUL `js/sim/ephemeris.js` | reuse (TECH) | light lag for letters |

---

## 26. Tests (all print their numbers)

| Test | Prints |
|---|---|
| `career-create` | 4.9 |
| `career-start` | 5.11; plus a heavy browser bot that walks the three stops and the sol-1 list |
| `pod-consistency` | 5.11's check of every lesson booking against TIME §9.2's and PEOPLE §4.1's data (the user's consistency rule, tradecraft rc30) |
| `career-quals` | 7.6: the timed events from BODY's model and their derived anchors; the G-qualification's margins by gCond |
| `career-promotion` | 8.10; board rates by modifier and grade, and the variance the record explains |
| `career-schools` | screening, BRC, A&S, ITC and a 3-week course: pass, recycle, drop and injury shares for bot candidates at modifiers 8–20, through the real code (targets: screening 55–65% of the gate-qualified; BRC about 50% at a modifier of 15; A&S 30–45% of the gate-qualified; ITC 60–80% of the selected), and for each gate the share of score variance explained by preparation (target 60% or more, 9.4) |
| `career-deployments` | the offers for each world state of 10.3; over 1,000 new worlds, the first recruit's first deployment (`esf` 100%); over 1,000 next recruits, the distribution; a tour's acts and the sector board's lines week by week for three seeds; the crisis's shape against the moods built |
| `career-missions` | 11.5 |
| `career-pay` | the table monotone in grade and years; an LES summed by hand against `pay.js`; the tax exclusion; 10% savings compounded over 7 periods; a four-year E-1 to E-4 career's total pay; every price read from SETTING's list |
| `career-medical` | board outcomes by severity × post-injury PFT (15.4's table); severance and pension for three cases; the dose limits: a surface plan that would pass the rotation's 50 mSv refused without the commander's authorisation, the bars at 150 mSv, 250 mSv and 0.8 Sv, and one quantity read from BODY's ledgers |
| `career-family` | ties over a year for four members at 0.5 a day, halved deployed, held after honest letters; the household letter's 70%; the instinct's band warnings (at most one a member a band) |
| `career-lethality` (heavy) | 19.2's table: the player's death rate following T, and the `careless` bot's beside it, for each stretch, with its target; the passenger's rate for each changed choice |
| `career-successor` | a career ended at a known date: the next arrival's date; the vacancy share over 100 seeds (60% ± 10); persistent people still there; the memorial entry |
| `career-runs` (heavy) | tradecraft's `runs.test.mjs` pattern: 80 simulated careers in outcome mode from enlistment to the end: grade at 4 and 8 years, months to Corporal and Sergeant, deployments per term, recon and Raider applicants and graduates, reenlistment share, share reaching 20 years, background deaths by deployment kind (targets for NPCs in outcome mode, the battalion's average: a quiet Europa tour 0.5–1.5%, a hot one 3–5%, a Raider deployment 4–6%, a war front 8–12%; the player's squad carries 19.2's higher rates), family deaths, letters a year |
| determinism | the same seed gives the same candidates, the same career calendar papers, the same missions |

---

## Fun

**The decisions this system creates:**

- **Free time is rank.** The composite is a slow game the player can see: an evening on a correspondence course, an extra session at the range before qualification, PT before the PFT. Time as a currency (the user's own words) made literal, and from sol 0 the PATHS leaf says what each gate still asks.
- **The billet is the standby's prize.** The designated marksman, the point man, the automatic rifle: the candidates are named on sol 1 and chosen after the MRX, so every evening on the range or the track, every clean inspection and every word to the squad leader is a step toward the role you carry to Europa, against a rival in your own fire team.
- **The checklist on the whiteboard.** Dental, the will, the gear layout: errands with a stake, because the names still up at the lift stay behind for a month.
- **The crossroads after each deployment.** The offers paper is the career's map: Callisto with the family, a ship's detachment, a year at 1 G guarding the mission on Earth, the recon screening. Each closed door says why, so the player knows what to work for.
- **Selection is a long build, and the build decides it.** PFT and CFT at 250, G-1, a clean record, Warfighting 30: months of preparation for three weeks whose every event scores, so that preparation explains about two thirds of the outcome and the die only settles the borderline. The long walk down the valley at night is a story the player tells.
- **The sector is yours to keep.** A rough search at the checkpoint, a dispute talked down, a crowd held without a shot: each moves a district's mood on the sector board, and the crisis in month five comes in the shape the platoon built.
- **The dosimeter is a career.** Every minute on Europa's surface spends the rotation's 50 mSv and a lifetime's 1 Sv (15.6). Volunteering for the surface patrol today can close the Jovian belts to you for good.
- **How to ride out a fight you cannot fight.** Strapped in at general quarters, the choices are the helmet, the couch and the kit, and they are the odds (19.1).
- **What to tell home.** A wound hidden from a worried mother costs her trust when she finds out. A brother who wants to enlist hears what you write, and may be the next recruit.
- **Reenlist or go.** A bonus and a school against the family's letters; in war the choice is taken away (stop-loss).
- **The board's findings.** Accept a medical retirement, or appeal and try to come back on a prosthetic leg.

**The stories it tells:** the flashback at Argyre and the line that stays in your head; the fire team leader at the bus; the squad's table at the first evening chow; the klaxon in the small hours in someone else's boots; the MRX's night patrol at −30 °C; the billet you won or the rival who took it; the first LES; the orders at the morning formation; the first award pinned on a parade deck in the ice; the old squad leader who is now the platoon sergeant; the last roll call; the next recruit given the dead marine's rack by a squad that remembers them; the DI who asks after a recruit she trained.

**Where it turns into chores, and how they are removed:**

| Chore | Removed by |
|---|---|
| Forms | papers are read, never filled; signing is one click |
| Repeated tests (two fitness tests a year, an annual qualification) | live it once; after that, skip it as an activity with its outcome, every roll still in the log |
| The check-in | three stops lived on the first afternoon, the rest a list on sol 1's morning; once per career; a transfer's sheet is three stops; "I know the drill" |
| Lessons the player already understands | "I've got this" carries the rest of the block on (5.5) |
| A Europa tour's quiet weeks | lived by default, but chapter days are an opt-in from the third week, and the sector board gives the weeks a score |
| Months of dwell | chapters with a weekly choice; only key days lived; arcs and exercises to keep each month different |
| Correspondence courses | a reading activity in chunks (tradecraft's book) |
| Pay and leave balance | automatic; the LES is there to read, never needed |
| Letters | one activity, two choices; a letter to the household; ties that decay slowly while deployed and pause after an honest letter; a word from the instinct only before a tie drops a band |
| Schools | chapters; only the tested days lived |
| Boards | papers, read like a roll |

**The rhythm:** each sol the PoD's routine and its spike (on sol 0 or 1 the night's alert drill); each week the squad leader's word, the expectations on STANDING and a key day (on a tour, the sector board); each month pay and the cutting score; each half-year marks and a test; each year a board and a qualification; each term the window.

---

## Build order

ROADMAP owns the milestones (§3.4 holds over this list; CONTRACTS §18); this is what the career needs in each.

**0.1.0: a standby at Base Melas, the core career.**
- The enlistment paper with every field (why you joined included), the quick pick of three, Standard ticked and Ironman one click away; birthplaces as data, backgrounds as SKILLS §10.2's with CAREER's columns, the starting sheet by SKILLS §10.1; the flashback's two scenes; the recruit training summary; the family generated.
- Arrival at 12:40, the gate, the sponsor at the bus, the three stops; the squad's welcome at evening chow; the first alert drill (drawn, built in v0.0.4 as 5.2 says); the sol-1 list and the initial counselling; the squad leader beside you (the earpiece port); the DI's voice in the T line; "I know the drill".
- The standby calendar by TIME's block ids, sols 0 to 9, at most two new systems a sol, "I've got this"; the stand-ins of 5.4 for the lessons whose scenes join in 0.1.x; the rest sols' set pieces; lessons booked, missed, asked for again; the slipped weekdays' blocks for later standbys.
- The readiness checklist, the billets, the vote's clock; the MRX's sols on their stand-ins (5.4).
- Standing events, the squad leader's word, the STANDING leaf's expectations and the PATHS leaf (no marking date falls inside the first arc: with the December start, the first marks are on 31 January, during the first deployment).
- One pay day inside the standby (sol 4, by the world's pay epoch: 2.3) with its LES; the PX, SETTING's prices and 12.8's personal gear.
- The PFT's and CFT's timed events through BODY's `courseTime` (for the boot summary).
- A letter home and its reply (on Mars, next day), the household letter, the ties' rules.
- The warning order at the last formation, as the acceptance moment.
- Death in the standby: the death splash, the casualty report, the career's end, the memorial's list, the world kept; the garrison row of the lethality budget.
- Not in 0.1: promotion past PFC, deployments, schools, Redwater, boards.

**0.1.x: the rest of the week** (ROADMAP §5.8, a scene a patch).
- Each lesson back on its sol as its scene joins (5.4): the suit loft and the suit drill with the Tank, the lifesaver class and lane, the G-house, MCMAP on the mat.
- The G-qualification upright on the Long Arm (7.3), with the G-house.
- The mission rehearsal exercise (5.8), once the patrol and the ROE lane have joined.
- The last roll call, the Memorial Wall's plaques, and the next recruit into the same world (56 days, the vacancy rule), with `career-successor`.

**Later** (ROADMAP §3.4's numbers):
- **0.2** the move and the voyage: predeploy, with the G-qualification and the suit for a career that crossed the standby without them (5.4, 7.3), Redwater liberty, afloat and imminent danger pay, letters at light lag, the passenger rows of the lethality budget (COMBAT's ship combat from inside).
- **0.3** the Europa deployment: the `esf` entry (MSF-E, Still Water) lived day by day with chapter days from the third week, its arcs and beats, the sector board, the three acts and the crisis, the relief-in-place paper; combat pay and the tax exclusion; the dose limits' table enforced; awards; evacuation; the post-deployment paper; block leave; the tour rows of the lethality budget.
- **0.4** the dwell: marks, the composite and cutting scores, PFT, CFT and G-qualification in full, the annual rifle qualification, promotion to Corporal, the Corporals Course, MCMAP belts, leave in the towns and the family home, the offers paper.
- **0.5** individual deployments at sea: ship's detachment, boarding team, Belt anti-piracy, Phobos security (its free-fall patrols want 0.5's zero-g combat, ROADMAP §3.4), the Void and Breacher courses.
- **0.6** reconnaissance: the screening, BRC with floors, recon missions from the generator.
- **0.7** the Raiders: A&S, ITC, the full generator, the load-out at the team cage, Raider deployments.
- **0.8** the long career: Sergeant and the boards, billets and fitness reports, EAS and reenlistment, retirement, medical boards and ratings, discipline's effects, the successor in full (siblings, former recruits as people), the unlockable starts.
- **0.9** the rest of the catalogue (Callisto, consulate guard, Ganymede, relief, station reinforcement, Titan), Legends, B-billets as chapters, balance through `career-runs`.

---

## Cross-references (what this section needs from the others)

- **The hub (DESIGN.md)**: two entries for its decision log, both my calls the user may overrule: (1) **Standard is ticked on a profile's first enlistment paper**, reversing my earlier Ironman default (4.2, section 23; the kickoff's choice per career is unchanged); (2) **the agency rule**, as a settled rule beside TIME's "death never happens in a splash": every lethal path passes through a player decision or a warning the character could perceive, and the tests print a lethality budget (19.1, 19.2). And one line for its loop table: a deployment rotation's quiet days are lived by default, chapter days an opt-in from the third week (2.2, 10.4).
- **SETTING**: rank names and insignia (8.1); the MOS list and codes (9.1); award names (6.5); the Corps' organisation (the regiment's battalions at Melas, the recon company, the Raiders' name and home, MCRD Argyre, the School of Infantry at Camp Ius, the institutes' Corps campus); name pools per birthplace (4.2); the birthplaces' lore (4.3); the backgrounds' voice (4.4, with SKILLS); the pools the drill instructor, the family and every NCO are drawn from (4.7, 4.8: SETTING writes pools, never people); the why-you-joined rule for the Earth-born, full citizenship by a term served (4.4.1); the start date (5.1, now used as SETTING §3.7 gives it); MSF-E, Operation STILL WATER, FOB Pwyll, Camp Halloran and Camp Lofn (5.9, 10.2, used as §1.4 settles them); the Congress' vote with CAREER's dates (committee on sol 3, the floor on sol 8: 5.9) for the news archive; grooming and uniform regulations, personal boots' pattern included (4.2, 12.8); reporting customs (5.2); the towns' lore (13); **the one price list** (12.7), with 12.8's four proposed items (earplugs and an eye mask, liner gloves, a reading lamp, a hydration system). **§3.4's sentence on the week** should match TIME §9.2 as TIME now has it (it does: Monday to Friday training, Saturday and Sunday rest); **§7.3's dose rules should cite 15.6's table** (its 50 / 150 / 250 mSv are the table's rotation figures), adding the annual 250 mSv and the career 1.0 Sv.
- **TIME**: the 1:1 rules and the skip() contract for every activity called here (letters, reading, waiting, the tests as activities); **the Plan of the Day and the week, by block id** (5.4: CAREER books into §9.2's blocks and its week, and `pod-consistency` reads TIME's data); the alert drill drawn on one of the career's first two nights, then one a week (5.2, as built in v0.0.4); the forced first stretch of a block ending at "I've got this" (5.5); chapters and their weekly choices (2.2, 9.4, 10.4), and on a tour the day card offering Spend it and Carry on only from the third week (10.4); interrupts (the recall drill, a world alert); voyages (5.9, 10); the world layer's cadence (10.3 reads it weekly); the autosave cadence (23); the dose clock's limit, which is 15.6's rotation planning limit (its "/50 mSv" example stands); `letter`, `long-arm` and the G-house block as §8.6 and §8.7 give them; the date-time group of the orders paper (5.9). **§9.2's note that CAREER moves its sol-5 field exercise** is answered: the MRX runs Monday and Tuesday (5.8).
- **BODY**: **a fitness term on the run (the lope)**, `run = 3.6 × (0.85 + 0.015 × effFitness) × gG^0.3` m/s or BODY's own, so that BODY's model can tell a fit marine from an unfit one at a run (7.2); `courseTime(body, course, regime)`, the best pacing's time (7.1, 7.2, 11.1), and the crawl, drag and carry speeds for the CFT's manoeuvre under fire; `perf(body, regime)` for rep events; the G-qualification's profiles run through §13.3 and §14.1 (7.3; §14.1's "gCond ≥ 0.9" standard is G-1, which BODY's own band puts at about 0.87); **§12.3's limits cite 15.6's table** (its "routine 50 mSv a year" and "life-saving 500 mSv" yield to the table's rotation 50 mSv and life-saving 250 mSv); **§7.1's sleep example at TIME's 05:30 reveille** (BODY's later passage already has 8 h 09 m 35 s); a feet and blister hazard on humps that personal boots halve, and the hands' cold rating that liner gloves raise (12.8); conditions with `expectedDays`, `permanent`, `deployable` (15.1); prosthetics (15.7); childhood gravity and altitude adaptation by birthplace (4.3); mass and suit size from height and build (4.2); which training injury a school phase gives (9.4); death (19) and the lethality budget's garrison row (19.2); stress from letters and leave (13, 14); hygiene and uniform state for inspections and boards (8.5).
- **SKILLS**: the skill keys (§2.2) everywhere in this section; **the one player backgrounds table (§10.2)**, with CAREER's five proposed additions in its form (`dome-crew`, `ice-hauler`, `institute`, `mss-cadet`, `caucus-youth`) and `custom` (4.4), and `hecate-line`'s works moved from Hellas to Ophir Chasma (SETTING §1.4); the starting sheet by §10.1 and a helper the creation test can call (4.5, 4.9); the school floors (§6.6) and `graduate(p, id)`, with CAREER's proposed floors for the schools §6.6 does not list (9.3), and the MCMAP keys spelt `mcmap-grey` (SETTING §1.4); Warfighting 13 + int(5) at the start (4.5) and the WF floors 50 and 65 (11.1, 11.2); the grades as points for the gate rule (9.4: disaster −3 to superb +3); the instinct voiced as the DI met in the flashback (4.6, 5.3), "I've got this"'s one line, and the family tie's band warning (14.1); the XP formula, taking 11.4's bases; training hours for schools and belts (9.2, 9.4); NPC levels for 11.3's opposition bands; `check()` and `opposed()`.
- **WEAPONS**: a rifle qualification scored out of 250 (7.4), and sol 2's string scored the same way for the designated marksman's billet (5.7); the boot qualification rolled in closed form on Marksmanship (4.7); the flashback's `string` scene with the dummy round (4.6); the range lesson and the weapons class (5.4); the armoury's weapons card and the window's clearing (5.2); negligent discharges as events (6.1); range safety that holds someone else's negligent discharge inside the garrison budget (19.1).
- **COMBAT**: **§9.1's card is MSF-E's** ("the Martian Stabilisation Force, Europa", Operation STILL WATER), issued in sol 4's class (5.4); **§15.3's EVA dose plan is a sub-limit under 15.6's rotation planning limit, and its `EVA_DOSE_CEILING_SV` is the life-saving figure, 0.250 less the rotation's dose so far**; the MRX's pieces in training form (5.8, §22's list), its graded result and the hot wash; the ROE class (5.4); **§13's ship combat from inside** making the passenger's choices matter (helmet, couch place, loose kit, strapped in) and the engagement in outcome mode for the lethality test (19.1, 19.2); the after-action's valour and conduct events (6.1, 6.5); the uses of force and their reviews for the relief-in-place paper (10.5); hostile-fire events for combat pay (12.3); CASEVAC (15.3); missions in play (11.3); the reflex at death (19).
- **PEOPLE**: the roster, the squad leader and **the fire team leader as the sponsor** (5.1, 5.3); the squad's welcome as an authored scene, its lines drawn from pools by each generated squadmate's personality (5.2); the senior drill instructor and the family generated at signing (4.7, 4.8), and a legend's person when one is chosen (22); the initial counselling as a performance counselling, not an R3 entry (6.6); the billets in "The board" arc's shape (5.7); schedules on TIME's block ids (5.4); the rest sols' set pieces' people (5.4.1); the district moods for the sector board (10.5, §12.4); the gauges used as thresholds (8.5, 8.8, 11); discipline events (6.1, 16); the chain of command and billets (8.8); memory lines for the memorial (20); hearsay (5.3); family members as lifetime people with households (4.8, 14); NPC careers on `rank.js` (8); talk scenes (5.2, 11.1, 15.5, 17); Raider teams (11.2); the `careless` bot (19.2); former recruits as tier-3 people and the vacancy fill (21). **§3.7's backgrounds are for NPCs only**; the player's are SKILLS §10.2's.
- **PLACES**: Melas's rooms for the three stops, the sol-1 list and the lessons (5.2, 5.4); **§4.5's mess hours set from TIME's chow blocks** (`hygiene-chow`, `noon-chow`, `evening-chow`), not their own; the G-house's Ring and Long Arm (7.1, 7.3); the pool and vacuum tank (7.5, 11.1); the training village, its CP-A checkpoint and tunnel, and the Talus for the MRX (5.8); the Green, the Rec, the chapel and the visitor centre for the rest sols (5.4.1); the memorial wall (20); the towns and the family home (13); FOB Pwyll's briefing room and the Works' utilities for the sector board (10.5); the team cage (11.3); the authored settings missions are set in, each with the rooms, spots and waypoints the mission generator places objectives, opposition and insertion points on, never a layout rolled per seed (11.3; the user, 2026-11-05); deployment sites (10.2); MCRD Argyre's chamber and range for the flashback (4.6).
- **VIEWS**: the enlistment paper with the close figure and the two mode boxes (4.1); the flashback's look (4.6); papers; the squad leader's HUD box (5.3); **the mind's STANDING leaf with the expectations, and a new PATHS leaf** (6.6, 6.7); the platoon's whiteboard (5.7); the sector board as an in-world instrument (10.5); the load-out's split inventory card (11.3); the death splash and the last roll call (19); insignia (8.9); the memorial wall's plaques and the title's lists (20); the service record on C.
- **TECH**: the module layout (25); state, saves and the profile store (3, 23); rng streams (11.3); the outcome-mode gap (21); the politics port (10.3); `START_MS` 23,480,400,000 for the first arrival (5.1); `window.__olympus.career` and URL parameters for tests (`?start=newjoin&drill=1&seed=48213`).
- **ROADMAP**: the milestones (Build order). Answered in ROADMAP's text (2026-11-06): §5.1 reads 10 + slip, and §5.2 cites this section's stand-ins (5.4). Asked earlier: §5.1's `STANDBY_SOLS = 7 + floor(8u)` becomes 10 + slip (5.9); §5.3's moments move with the calendar (moment 2's range day is sol 2's morning, with the suit loft in the afternoon; moment 3's G-qualification is sol 4's afternoon, two hours in the Ring and the Long Arm to 3.5 G upright; moment 4's lifesaver class is sol 3's afternoon; moment 5's inspection is Friday's, sol 4, and the MRX can be its lead-in); §5.4's list (the MOUT exercise, the CBRN class, the commanding officer's inspection come only in a slipped standby or the dwell, and no rifle qualification is shot in the standby, 5.4); §7's 0.3 is lived day by day with chapter days from the third week, which changes its real-time budget (2.2).

---

## Open questions for the user

Each has a default the builders follow until you answer.

1. **Can the player become an officer?** Default: enlisted only to 1.0; commissioning (OCS and the Basic School) is an ending that unlocks an officer start after 1.0.
2. **Is a new world's first deployment always Europa?** Default: yes, as in your brief.
3. **Do unlocks count in Standard mode?** Default: yes, in both.
4. **Fitness tables by sex and age**, as the US Corps scores them? Default: yes, scoring only; no MOS, school or unit closed by sex.
5. **Special operations as a one-way branch**, like tradecraft's illegal? Default: no; a Raider can go back to the line.
6. **How far do romance, marriage and children go?** Default: through the gauges, letters and a few lived events (a wedding on leave); no explicit scenes.
7. **Combat stress as a path to a medical board?** Default: yes, rare, handled soberly through BODY's stress model.
8. **The next recruit in the dead marine's rack, a sibling as a candidate, and former recruits living on as people in the world?** Default: yes to all three (60% for the rack).
9. **Is the first four-year term's length right?** About 75–150 real hours with chapter days where they are offered, or 180–360 if every tour day is lived (2.2). Default: yes, with the pacing table of 2.2.
10. **How much of a Europa tour should be lived?** Your brief makes the deployment's day to day the game. Default: every day starts live, and chapter days are an opt-in from the tour's third week, never the default (2.2, 10.4). The other ways: chapter days offered from the first week, or fewer lived days with a shorter tour in the first term.
11. **Which box is ticked on the enlistment paper?** Default: Standard on a profile's first career, Ironman one click away; afterwards your last career's mode (4.2, section 23). Your kickoff choice, death chosen per career, is unchanged.
12. **The lethality budget** (19.2): a careful private's death on a quiet Europa tour about 1 in 25 to 1 in 50, on a hot one about 1 in 10, as a passenger in a ship engagement suited and strapped in under 1 in 100. Default: these targets, printed by the tests.
