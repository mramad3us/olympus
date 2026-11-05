# Research: TRADECRAFT's DESIGN, part 1 (DESIGN.md lines 1–300)

Source: `/Users/deaumas/lab/vibe/claudecode/tradecraft/docs/DESIGN.md` (864 lines, 333 KB; lines 1–300 are ~57 KB). Sections covered: Pitch (l.5), Pillars (l.17), The player's loop (l.30), World and setting (l.40), Career: ranks and classes (l.52), Postings, assignments and the day (l.99), Time (l.114), Weather (l.120), Intelligence and leads (l.162), Characters: skills and checks (l.169), People: bonds and persistence (l.228), Cover, heat and the hunt (l.242), Networks and handling (l.273), The agency, analysts and special forces (l.282).

The design text is cross-checked against the code it names (all under `/Users/deaumas/lab/vibe/claudecode/tradecraft/src/sim/`), so the constants below are the ones that actually run. Where a fact comes from DESIGN.md past line 300 or from a code header, the line or file is cited. Tradecraft is read-only: everything here is reference for OLYMPUS.

Attribution convention. Tradecraft's DESIGN.md marks three kinds of decision, and this note keeps them apart:
- **the user** (often dated): the user's own words or decisions. These are the user's tastes and carry over to OLYMPUS wherever they fit.
- **Q-numbers** (Q1–Q162): answers the user gave in the structured design debrief of 2026-10-26 (round 1 Q1–Q101, round 2 Q102–Q162). These are user decisions too.
- **"my call"**: details the lead agent settled to close holes. They hold until the user overrides them, so they are less binding.

---

## 0. How tradecraft's design was settled (a process pattern for OLYMPUS)

- DESIGN.md l.3: "The game as settled with the user, through the design debrief (round 1, Q1–Q101, and round 2, Q102–Q162, 2026-10-26 …). Everything here is decided unless marked **my call** … What's still open is under Open questions. Question numbers point back to the debrief."
- The debrief was a long questionnaire published as an artifact. Each answer became a numbered decision, and the doc cites those numbers inline. Builders can trace any rule back to what the user said.
- Guardrails (l.25–28) come from the user's stated worries: **"clunky mechanics, an inconsistent experience, empty gameplay"**. They turn into three rules:
  1. "Every mechanic feeds the loop."
  2. "Every number means the same thing everywhere: one shared helper per quantity, as in longhaul." (One function per quantity: `sightM()`, `crowdK()`, `footing()`, `weatherMods()`, `check()`, `skill()`.)
  3. "Each mechanic is built first as a playable test the user scores, before the mechanics are joined (Q161; see Road to 0.1.0)." This is the "functional test versions" approach the user wants again in OLYMPUS.
- OLYMPUS should use the same habits: a numbered debrief, "the user" vs "my call" attribution, and one helper per quantity.

---

## 1. Pitch (l.5–15)

- "A spy game. Single player, present day, one character controlled: a spook, an intelligence officer. Not the analyst, not the special forces, though we work with both. The player is always in the field collecting intelligence, and the shape of the work changes with rank: from a recruit doing counter-intelligence legwork at home to an illegal living for decades as a citizen of the target country."
- **Tone**: "Grounded and procedural (le Carré, Le Bureau des Légendes, The Americans). The character is squishy, counter-intelligence is unforgiving, and tradecraft is what keeps a spook from getting burned. Mistakes carry a real price. The humour is in the words: dry, dark, situational, Slow Horses-like dialogue and internal monologue."
- **The feeling**: "After a good session the player doesn't want to stop: there is always another step, another assignment, another hill to climb."
- **Touchstones**: *Papers, Please* (cold, half-serious tone; papers as sheets you move, read and file), *Stoneshard* (art and animation style), *Heat Signature* (one character at a time, another when they're lost).
- **Never**: "A shooter (though there is combat) or a hero story. Ethics take a back seat to the mission and to survival. You can fight and kill with almost anything, but being burned is a nightmare, and security forces are overwhelming."

**For OLYMPUS.** The same stance fits a Martian marine: one squishy body, procedural, mistakes cost, dry humour in the text. OLYMPUS adds things the user wants and tradecraft doesn't stress: physical survival (air, water, gravity, hygiene) and a slow, realistic daily life. "Never a shooter" has to be squared with ground combat. The tradecraft answer is that combat exists, but skill and dice settle it and the player's reflexes don't (Pillar 1). Shooting in tradecraft "pauses second by second" (l.423, Q146). The user wants OLYMPUS shooting to "play as in tradecraft", so that model is the template.

---

## 2. Pillars (l.17–28)

1. **Tradecraft decides.** "Success rests on the character's skill more than the player's reflexes. The player's craft is choosing what to try, where and when: each task has a few approaches and some puzzle in it, and the dice settle the execution."
2. **Mistakes cost.** "No karma, no good/bad score: only efficiency and consequences. A lie that's caught costs a person's trust; a careless meeting raises the heat; a lost character stays lost."
3. **Always another step.** "A direct task, longer goals behind it, several assignments in parallel. The loop must never leave the player with nothing worth doing."
4. **Text carries it.** "Dialogue, monologue, briefs, chat apps, the log of rolls. Medium reading, abundant flavour."
   - UI rule: event lines and rolls show at the **top left, 16 s each**. Spoken lines appear in a **balloon over the speaker** for the same 16 s (0.1.0-rc5, the user: "speech bubbles for scripted speech, they should linger as long as when using the top left text"). Both timers **wait while a brief, a sheet or the pause is up**, and **J** opens the full log.
5. **Generated, but it should feel authored.** "Geopolitics produces postings, postings produce assignments, and assignments produce places and people. Characters who matter persist; the rest are throwaway."

**For OLYMPUS:** Pillar 1 is the RPG-resolution rule the user asked for ("RPG-like resolution of challenges, e.g. whether a shot hits"). Pillar 5 maps onto a generation chain: the system's politics, then deployments, then operations, then places and people. Pillar 4 matters because OLYMPUS skips a lot of time and runs a lot in the background: the log and papers are how the player feels what happened off screen.

---

## 3. The player's loop (l.30–38): five nested time scales

| Scale | What happens (tradecraft) |
|---|---|
| **Seconds (a map)** | Walk; run (which draws attention). Watch people, follow them, notice who's following you, blend in, talk (choose an approach, roll a check), hand over or pick up, hide "when the instinct says so", fight "when it comes to that". |
| **Hours (a day)** | A schedule: the cover job, meetings, training, errands. Travel jumps place to place "with a flavoured transition". **Actions that take time (sleep, read a brief, work out, do the cover job, wait in a café) jump the clock.** "An active day takes **20–40 real minutes** (Q105)." |
| **Days to weeks (an assignment)** | Investigate until you know who or what holds the intelligence, get access (approach people, collect hooks, recruit), obtain it, get out clean. Most assignments have deadlines. |
| **Months to years (a posting), in chapters (Q104)** | A posting is a country, a city, a goal (intelligence on a subject), a legend and role, a handful of assets, persistent people, safe houses, and the heat. "The key days are played in full, and the stretches between them are summarised." |
| **A career** | Tradecraft grows and harder postings open. It ends in retirement, injury, death, capture, firing, or being burned beyond repair. |

Two "my call" rules turn chapters into mechanics (l.36–37):
- **A key day** is "when something on it needs the player: a meeting, a deadline, a briefing, an event, a summons. The player can also choose to play any day."
- **A summary** is "a paper on the desk, with what the days brought: the cover job done, pay, needs, gauges drifting, heat cooling, small events. Before it the player sets how the time is spent: train, work the cover, lie low, see people, rest. So a quiet stretch is a choice, not a wait."

**For OLYMPUS.** This maps almost one to one onto a soldier's life:
- Seconds: moving through a habitat or ship interior, weapon handling, combat.
- Hours: one sol's schedule (PT, drills, duty, chow, showers).
- Days to weeks: a standby period, a deployment's operations.
- Months to years: a deployment or tour, which includes a months-long transit at realistic Brachistochrone or Hohmann travel times.
- Career: enlistment to retirement, with the special-operations branch.

The user's own example ("standby for a week or two, everyday training … full days … in real time until we do things that spend time like eating") is the "Hours" row. Long transits are the "chapters" row: summarise them as papers, and let the player choose how the time aboard is spent (train, study, rest).

The **20–40 real minutes per active day** target (Q105) is a useful design budget. A Mars sol is 24 h 39 m 35 s at 1:1, so time-skipping actions have to cover about 95% of it.

---

## 4. World and setting (l.40–50)

- Present day: smartphones, CCTV, social media. Chat apps (fictional versions of real ones) carry the cover life and other people's lives, read through SIGINT and OSINT, "never the spy work itself (Q157)". HUMINT is the main source.
- "Eventually a dozen cities with dozens of locations each." Start: **Moscow, as the CIA**. "Agencies are data."
- **Cities are data** (2026-10-27, the user: "we will build London, Beirut, Cairo on top of Moscow, make them feel different, make sure streets are not blindly always like US grid cities"). A city is a profile in `sim/cities/` with:
  - names and shops with their signs;
  - architects (what a building is, and its dress);
  - the makes of vehicles, street furniture and terrace shapes;
  - trees;
  - sun position (latitude, longitude, clock offset);
  - which side of the road it drives on;
  - its people: names by background, dress, headscarves, languages.

  The user, 2026-11-04, on dress: a headscarf is never worn with a T-shirt or a dress that bares the arms or legs; it goes with a jumper of its colour or a long-sleeved dress to the ankle (`sim/cities/folk.js`). `state.map.city` names the city (none means Moscow). Determinism is guarded: Moscow is generated exactly as before, from the same draws on the same streams, and `tests/cities.test.mjs` holds it to v0.0.46's output. Other cities draw from streams of their own (`city:seed`).
- Opposition: foreign intelligence services, terrorist networks, organised crime.
- No home city: the agency and its building, plus safe houses everywhere, each of which can be burned. Postings move the player between countries.
- **The world moves**:
  - A "simple, balanced backbone of geopolitics" yields interests, and interests yield postings and assignments.
  - What the player brings in changes it. Agency knowledge of a subject grows with intelligence; enough knowledge triggers events (sanctions, arrests, an expulsion, an allied special-forces raid) that shift tensions and create new subjects (Q102).
  - The player sees the world move through news (papers, TV, chat apps) and briefings (Q103).
- **Languages**: five levels (none, basic, working, fluent, native). An illegal is native in the country's language (the user, 2026-10-26: "no accent, nothing"). Text in an unknown language shows in its script (Cyrillic in Moscow) and can't be read; between levels, "some words come through" (Q120). Translation apps handle written text; support teams and real-time translation tech handle speech.

**For OLYMPUS:**
- Settlements and habitats should be data profiles in the same way: Mars cities (Londres Nova, Mariner Valley), Ceres, Ganymede, Europa domes, Earth/UN sites, stations, MCRN ships. Each profile carries its own architecture, gravity, air, people, dress and accents. Belter Creole is a natural candidate for a language with levels.
- "The world moves" fits the Expanse setting: system politics, with Earth/UN, Mars/MCRN, OPA and Belt factions, should spawn deployments.
- Keep the determinism guard (golden-output tests on generators).

---

## 5. Career: ranks and classes (l.52–97)

### 5.1 The ladder (l.54–64)
"One ladder, leading to the illegal. Risk rises with rank. A rank is less a title than a fact: whether you've taken and completed enough assignments of that kind. The early ranks come mostly from Tradecraft level, the later ones from completed assignments. The player can refuse an assignment of the next kind, illegal postings included. There are no technical or support careers."

| Rank | Where | The work |
|---|---|---|
| Recruit | Home country | CI support, almost never alone (a member of a team tailing a target without knowing why), lots of training in the schedule, no agents. |
| Officer | Home country | CI with your own cases; first sources. ("Agent" was the user's first name; renamed because agents are the people we recruit, Q109.) |
| Handler | Abroad, official cover (embassy job) | Runs a network. Diplomatic immunity: if caught, expelled, not jailed. |
| Undercover | Abroad, under a legend | Works from inside a fake life. No immunity. The cover job matters; losing it fails the posting. |
| Illegal | Abroad, as a citizen of the target country | A legally earned identity, never an obviously spooky post. Years to decades. Few contacts with a handler. Finds their own assignments through their own analysis. |

### 5.2 The deep postings (0.2) and constraints, user-decided
- **A face on file** (the user, 2026-11-04: "we cannot go undercover or illegal in a country we have had an official cover before (if our face is in GRU/FSB files as a diplomatic employee, no amount of time will suffice to go unnoticed as an illegal or undercover under an other legend)"). Code: `src/sim/postings.js` facesOf(). Faces are carried on the character (c.faces). My call adds: a country where a first-tour trip got you made, a country where a legend was blown, and never two legends in one country (servedDeep()).
- **What's offered at a posting's end** (offers(): the result paper lists the offers, and the closed ones with the reason):
  - **A station under official cover**: always offered. After a deep post ended badly, it's the only offer.
  - **An undercover post**: in cities with legends (Moscow, Beirut, Cairo; never London), after a successful handler's posting, or straight from London's first tour for a "legend".
  - **The illegal's post** (the user, 2026-11-04: "we'll ask for a successful posting and age under 30, illegal being a career ending move, officers won't be expecting to get out of alive. So it'll be a branch, either go illegal while young enough (we'll make it so their tradecraft is boosted to 80 as they end their illegal training), or decide to go undercover which is a lighter assignment or keep going with regular handler assignments under official cover"). ILLEGAL_AGE = 30. It is "One way: the last posting there is".
  - Legends (pre-built aged characters) are exempt from the age rule: "allowed to go from London starting posting to undercover, then illegal". My call: their lying-low period is capped so day one is at age ≤ LEGEND_DAY_ONE_MAX (68), never under three years.
- **Career end** (careerEnd()): past RETIRE_AGE (60), checked at a posting's end and never mid-posting. A legend gets LEGEND_AFTER (2) postings after the start, then retires with a pretext (the user: "the already old officer should have a pretext to retire (can be terminal disease) after two postings at most"). The illegal's post is the last; brought out alive, the career ends, and that's the good ending.
- **Training between postings** (`sim/career.js` plan(); every phase is shown on the sheet via trained()):
  - **Undercover school**: UNDERCOVER_SCHOOL_Y = 1 year, or as long as fluency in the language takes if longer. At its end every skill is raised at once to FLOORS.undercover: Deception 14, Awareness 13, Tracking/Pathfinding/Social 12.
  - **Illegal's school** ("the Center's"): ILLEGAL_SCHOOL_Y = 2 years, or as long as fluency takes (fluent Arabic from nothing is 3 years). At its end every skill is raised to FLOORS.illegal (core four 20; CQC, Fitness and the gun 18; the rest 14) and Tradecraft to at least ILLEGAL_OS = 80. The last step to native is lived while lying low (NATIVE_K = 1 × the language's FSI weeks).
  - **Language school between postings** (`sim/career.js`, the user, 2026-11-04: "we should track the year in game, because between stations, there may be mandatory trainings and long periods of time can pass"; "to take a regular officer post in a country we require at least working language training … as long as necessary to learn it (time skip between postings as we pick the posting). To be an undercover officer or illegal we need fluent level"). LEAVE_WEEKS = 3 of home leave, then full-time FSI weeks to working level by category: fr/es/it/pt 30, de 36, ru/fa/hi/hy/pl 44, ar/zh 88. Of that, basic is 0.25 of the weeks, working the remaining 0.75, fluent another 0.8×, native another 1.0×. NEED = { official: working, undercover: fluent, illegal: native }.
- **The incubation** (`sim/incubation.js`; the user, 2026-11-04: "undercover officer will get an incubation period of 3 to 20 months depending on the level of security of the place we're trying to infiltrate (based on counter-intel from the country), which will be a fast forward in time where we presumably just build up the legend's true history. Illegals get that as well, but it is 3 to 14 years of undercover lying low before they get activated").
  - Formula: x = 0.55 × target security (0–1) + 0.45 × country CI (Russia 0.9, Britain 0.85, US 0.8, Egypt 0.75, Lebanon 0.65), plus a little seed noise. Undercover months = 3 + 17x; illegal years = 3 + 11x.
  - Measured: Moscow 15–20 months undercover, 11–14 years lying low; Beirut 5–14 months, 4.4–10 years; Cairo 10–18 months, 7–13 years.
  - "The date, the officer's age and the world's business go by with it (one timeline)." The legend's lived history is written onto the file: the job, the flat, a neighbourhood habit; for an illegal, a 30% chance of marriage (+4% a year) and a child after four years half the time.
  - Lying low rusts street craft and fighting (one level undercover, two as an illegal: `sim/rust.js`). Deception and Social are kept up by living the legend.
- **Measured career numbers** (tests/runs.test.mjs, 80 simulated careers): the first tour lasts 9–25 days (ages 24–29); an illegal's day one comes at 31–45 with Tradecraft 80. Careers are tested by simulating whole lives on the campaign planner, a pattern OLYMPUS should copy.
- **Rungs / unlockable starts** (`sim/campaign.js` LEVELS): first tour, own posting, under a legend, illegal. Reaching a rung unlocks starting at the rung below it; the top rung only opens in debug mode. (DESIGN l.~813, the user, 2026-10-27: "we unlock more and more advanced starters after a game over if we made it to the level +1 basically".)

### 5.3 Failure and reviews (l.88–89)
- "Bad reviews pile up and lead to a desk job or firing. A high rank can be knocked down a rank and lose access to that kind of posting for a while." A handler caught under official cover is expelled (persona non grata) and the asset pays for it; the posting ends, the country is burned, and it may cost a rank (Q131). Playing as a double agent is a later major update.
- **A good review** weighs "the intelligence brought in against what was expected, the exposure caused, the cover kept, the assets kept safe, the time taken, and the collateral (police, injuries, deaths) (Q107)".
- Code (`sim/campaign.js` review(), l.696–703): weekly, on Sunday night. Excellent if intel ≥ expected + 1 and heat < 40; Good if intel ≥ expected and heat < 55; Adequate if intel > 0; otherwise Poor (expected = 1 a week).

### 5.4 Classes and over-skills (l.90–97)
"Only spooks are playable. Every class has an **over-skill**, 0 to 100, which multiplies the skills that matter to the class. Civilians have none, so their skills sit much lower."

| Class | Over-skill | Top tier |
|---|---|---|
| Spooks | **Tradecraft** | The illegal: fights at tier-2-operator level. |
| **Soldiers** | **Warfighting** | The tier 1 operator, "who still most likely kills an illegal in a straight fight". |
| Cops | **Intuition** | The special agent (Q112). |
| Criminals | **Streetwise** | The *vor v zakone*. |

In code (`src/sim/skills.js` l.30–37), only the spook's weight table is filled in. `soldier: { overskill: 'Warfighting', weights: {} }` is a stub: the user and lead never designed the soldier's weights.

**For OLYMPUS.** This is the single most important carry-over. The user already named the soldier's over-skill **Warfighting** in tradecraft, and the scale has its top tier in the tier-1 operator. OLYMPUS can make Warfighting the player's over-skill, multiplying combat-relevant skills by weight, as Tradecraft does for a spook. "A rank is less a title than a fact" also suits a military career, though real military ranks are formal: OLYMPUS needs both formal rank (time in grade, evaluations) and qualification gates (courses, operations completed). The branch decision (illegal under 30, one way, versus undercover versus the official ladder) has a natural analogue in selection for special operations (age and fitness gates, a long training pipeline that skips time, floors applied at graduation). Tradecraft's "school, then floors applied at once, Tradecraft boosted to 80" is a direct template for an MCRN special-forces selection and qualification course.

---

## 6. Postings, assignments and the day (l.99–112)

- **Work**: procedural, driven by the geopolitics. A posting is a long-running mission; several assignments run within it, each with a direct task and longer goals. Entanglement grows with rank.
- **Tasking** depends on the posting:
  - CI postings get many briefings at the agency.
  - Illegals hear from their handler by dead drop or, most often, direct contact.
  - "Electronic communication is almost never used: in enemy territory it can be listened to all the time."
- **Failure**: at low rank, a bad review; at high rank, death or being burned. "Reporting is flavour: an assignment is complete when its completion point is reached."
- **The day depends on rank**:
  - "A recruit lives their own life at home: wakes up, takes the subway (a cutscene), swipes into the agency building, follows the day's planning (a sheet on the phone), does some spooky work or training, and goes home."
  - An undercover officer runs the same day inside a fake life: "the real work has to be stolen out of the expected one".
  - An illegal: the same with a deeper identity, over years.
- **The cover job**: its duties sit in the schedule and feed a **cover standing** gauge. Neglect brings reprimands, then recall (official cover) or firing (a legend, which fails the posting) (Q140). In code (DESIGN l.628): at the embassy desk, T on a weekday works until 18:00 for cover standing +6; a missed working day costs 10 (`campaign.js` COVER_MISSED); lying low for a day is heat −6; pay comes on the 1st; the weekly review is Sunday night.
- **Colleagues**: paired with other officers only on a few assignments, mostly at low rank. "No office politics, rivals or budgets at HQ."

**For OLYMPUS.** The recruit's day is a close template for the user's marine-on-standby example: wake (alarm), hygiene, chow, formation or PT, the day's planning on a hand terminal, training or duty, chow, shower, rack. The cover job, a gauge fed by doing scheduled duties, becomes a **duty performance / standing** gauge (inspections, being on time, kit maintenance). Neglect brings reprimands, then non-judicial punishment, then discharge. Unlike tradecraft's "no office politics", OLYMPUS will have a squad and chain of command around the player every day. That is a deliberate departure, and the user's wish for "NPCs well built … with their own lives" supports it.

---

## 7. THE TIME MODEL (l.114–118, with code and later sections)

### 7.1 Design statement (l.116–118, verbatim essentials)
- "**Real time, one second for one second. Pause any time. No speed controls**; time moves through actions that take time: sleeping (an alarm on a clock or phone; usually 7–8 h, and can be disturbed), travel (much longer when flying abroad), the cover job (skips a good part of the working day), reading, training, and waiting on a bench or in a café. Longer stretches pass between chapters."
- "A full calendar: weekdays, seasons, office hours. Some things need a time of day, others a date. Most operations are time-critical."
- "Only permanent characters keep routines (a schedule, habits, relationships, a home). Everyone else is throwaway."

### 7.2 The clock in code (`src/sim/clock.js`, 62 lines, pure)
- Game time is **whole integer milliseconds** since 2026-01-01 00:00 local (`state.time.ms`), so "a tick adds exactly and a long game never drifts".
- `TICK_MS = 50`: the sim steps at **20 Hz**.
- Constants: `SEC=1000, MIN, HOUR, DAY=24h`. `TZ_H = 3` (Moscow UTC+3, no DST); postings abroad carry their own offset.
- Calendar: proleptic Gregorian via Howard Hinnant's civil-date algorithms, in pure integer arithmetic with **no Date object**, so it's identical in every browser and in the tests. Exports `at(y,m,d,hh,mm,ss)`, `calendar(ms)` → { year, month, day, weekday (0 = Monday), doy, dayIndex, hour, minute, second }, `hourOfDay(ms)`, and the text helpers `clockText` ('16:05'), `dateText` ('Monday 2 November 2026'), `stampText` ('Mon 2 Nov, 16:05').
- Header (l.8–10): "Time runs one second for one second while the player is on a map; actions that take time (sleep, travel, the cover job) jump it (**the caller adds their length and the world gets outcomes for the gap, not a tick-by-tick simulation**)."

### 7.3 The skip: "outcomes for the gap" (`src/sim/game.js` l.425 `skip(state, bus, ms)`)
When the clock jumps by `ms`, the world catches up analytically or in coarse steps, never tick by tick:
1. Weather washes the street's blood for the elapsed minutes (`sim/blood.js` wash).
2. **Anyone bleeding bleeds through the skip, a minute at a time** (bloodBeat in 60 s steps). A skip is never a free heal.
3. Clock: `state.time.ms += round(ms / TICK_MS) × TICK_MS` (stays tick-aligned).
4. For every person: `drift()` of the social gauges (a step toward 0 a week) and `heal(p, days)`. People off the map count as tended by their own doctors; the player counts as tended only if a hospital took them in.
5. Player only: `wetDays` (drying), body notes, and **body heat lived through the skip** (`bodyHeat(..., minutes, skipped=true)`, so twenty November days outdoors would kill you).
6. `emergency.caughtUp`: ambulance and police calls the skipped hours would have resolved are played out.
7. Crowd: `recycle(state, x, ms)`. If ≥ RECYCLE_S = 120 s passed, the passers-by are let go and the streets refill at the new hour's count; otherwise it's the same people where they were (DESIGN l.488; the user, 2026-11-03: "time passing (like during a judo class) doesn't seem to recycle the NPCs on the map?").
8. Campaign: `rollWeeks` (fitness weeks) and `rustRoll` (rust months).
9. An autosave if an autosave boundary was crossed.

The campaign layer has its own coarse catch-up: `sim/campaign.js` l.530 `pass(c, from, to)`, run day by day:
- a working day not worked costs cover standing −10, with a log line;
- pay on the 1st (a PAY paper);
- the weekly review on Sunday (a paper, or a dead-drop signal for deep postings);
- heat −1 a day, down to a floor (official cover never cools below its floor);
- agency support regenerates;
- police interest cools;
- safe houses seen by the opposition are burned by morning (a CABLE paper);
- burned assets may be arrested at ARREST_PER_DAY (a news paper, heat +10).

It returns **papers** (`[{ kind, title, lines }]`), and those are what the player reads after a skip.

### 7.4 What skips time (consolidated across DESIGN)
- Sleep in the flat's bed (T, late: until 07:00); a nap or rest (bed); H offers a rest of up to 8 h "somewhere warm" in the free walk, and bleeding goes on through it (l.428).
- The cover job (embassy desk: T, until 18:00), "as any action that takes time" (l.604).
- Training: gym, martial-arts class, language school, each "an hour or two"; club sessions, with the wait for the start skipped along with the session (l.658).
- Reading a book: R on a bench or bus shelter, at a café or bar ledge over coffee (another coffee every 40 min), or T in the flat's armchair, **in 10-minute chunks, as long as you like** (l.598; the user, 2026-10-31: "a way when sitting on a bench, to just read a book we bought … for as long as we want (one way to pass time, in chunks of 10min)"). Not allowed on a dark bench or in rain or snow. **In a scene that's lived (a tail, a meeting), nothing is skipped**: the book becomes cover instead.
- Shop visits: a purchase "is an action that takes time" (since 0.1.0-rc27; the user: "went to buy a book in a bookstore, never came out even after 3 minutes"). The clock skips it and you're back where you stood. Only the window's coffee is lived through.
- Bank counter (4 min, skipped), buses (4 min a street + 1), taxis (wait and ride 1–4 min, 2.5 a street + 3).
- Hospital stays (bedHours, at most 3 weeks), cells, arrests (2–14 h).
- Tab "mind": "go now, or go at the time it starts: **the clock skips to it**" (l.628).
- Between postings: leave, language school, the agency's schools, and incubation (months to years, one timeline).

### 7.5 What deliberately does NOT skip time (user decisions)
- **No fast travel to work or home** (since 0.1.0-rc50; the user: "we should not have the option to just fast travel to work, it would skip all the gameplay like shaking watchers etc., same with going back home"). You go yourself, on foot or by bus, metro or taxi, with whoever's tailing you. Rides still skip their minutes, but the departure and arrival are played.
- Being tailed through a skip: "Time skipped in your own hours (a class, a book) keeps them on you only if they had you as it began" (l.367).
- **Time is a currency** (DESIGN l.818; the user, 2026-10-27: "pass the time things should be natural and time should feel like a currency, meaning gym (trains fitness), karate class or other martial arts, bed (nap, sleep, rest), read a book (can buy books in bookstores to learn specific things), take a language class"; DESIGN glosses this, after "the game is real time", as **"no bare waiting, every hour spent buys something"**).

### 7.6 Pausing and frozen time
- Space pauses (Controls table, l.798). Briefs, sheets and the pause freeze the 16 s text timers (l.22).
- Choice cards stop the clock ("the card stops the clock while you choose", the bus card, l.380).
- **Talk** pauses time like combat (l.411; the user: "talk should pause the game, like combat").
- **CQC**: "Rock, paper, scissors, second by second, with time paused until you choose" (l.391).
- **Shooting**: "paused second by second, like CQC: pick a target, then a Weapon handling roll against distance and cover (Q146)" (l.423).

### 7.7 Transitions, cutscenes and splash papers
- Travel "jumps from place to place with a flavoured transition" (l.33). The recruit's subway ride is "a cutscene" (l.108). Transit becomes a playable map only when it matters (a tail, a brush pass); otherwise it's a cutscene (Q151, l.375).
- Results of time are delivered as **papers** (Papers, Please touchstone): PAY, THE WEEK: GOOD, CABLE: A SAFE HOUSE, news, results.
- The user, 2026-11-04 (l.686): "I got arrested instantly **without a splashscreen that explains what happened**, without a reflex action to try to resist or fight off the cop, without an animation of the cop nailing me to the ground". So the user expects a big state change to come with a splash or paper explaining it, a reflex choice where one is plausible, and the animation.

### 7.8 Background people and time
- "Only permanent characters keep routines (a schedule, habits, relationships, a home). Everyone else is throwaway." (l.118)
- Throwaway people are generated from a seed and never saved beyond it (`sim/people.js` passerby(seed, city, band)); the crowd is a bubble around the player (l.488, see §11).

**For OLYMPUS (time).**
- OLYMPUS needs a **sol clock**. A Mars sol is 88,775.244 s (24 h 39 m 35.244 s); the user explicitly said "Mars sols, not 24h". Keep tradecraft's integer-ms, fixed-tick, no-Date design, but make the day length a per-body parameter. Mars's sol, Earth's 24 h, and ship time (usually UTC-like 24 h) each need their own calendar: Darian or "sol number + MSD". All conversions should live in one pure module, as `clock.js` does.
- Keep **1:1 real time, pause any time, no speed controls**, with time-consuming actions (eat, shower, sleep, PT, duty shifts, kit maintenance, medical recovery, transit) as the only fast-forward. That matches the user's OLYMPUS brief ("full days … moving in real time until we do things that spend time like eating (a splash screen illustrating the action and a time fast-forward)"). Tradecraft has the skip but no illustrated splash for it. OLYMPUS adds the splash (pixel-art vignette plus clock spinning), so it's an extension, not a port.
- The **skip-as-outcomes** pattern is the performance answer to "as much background generation as possible done without rendering". The world computes what happened in the gap (bleeding, healing, needs, air and water, gauges, NPC schedules, crowd recycling, events) at a coarse step and emits papers. OLYMPUS should apply it to life support (O2/CO2 scrubbing, water reclamation), gravity deconditioning (bone and muscle loss per day under low g), and ship transits (weeks of burn summarised).
- "No fast travel that skips the gameplay" carries straight over. The marine walks to the mess, armoury and showers; only the action itself skips.

---

## 8. Weather (l.120–160): a model of a pure, seed-driven environment

Mars has no rain or snow, but the architecture and the thermal-body model are directly useful. (2026-10-27, the user: "Weather: snow, rain and wind, graduated light/heavy/extreme, real effects, structured and scalable". The numbers are the lead's; `src/sim/weather.js`.)

- **State**: kind (clear, overcast, rain, sleet, snow, fog, dust) × level (none, light, heavy, extreme) × wind (calm, breezy, strong, gale) and direction × temperature × ground (snow, wet, ice, frost).
- **Never stored**: "a pure function of the map's town (its seed and its city) and the clock, drawn from streams of its own. So the same seed and date give the same weather, it moves none of the game's other dice … and a save carries nothing of it but a pin."
- **Climate table per city** (`CLIMATE`): monthly mean temperature, diurnal swing, day-to-day wander (a 3-day running mean), monthly precipitation chance, and per season the sky, spells, duration, severity, wind, fog and dust. "A city added is a table added."
- **A day**: a front rises to its worst over the first 30% (at least 15 min per level) and eases at the end. Snow below −0.3 °C, sleet below 2.5 °C, rain above. Fog when calm and dry, mostly in the small hours, burnt off by mid-morning.
- **The ground remembers 10 days**, hour by hour: snow settles 0.1 / 0.28 / 0.5 an hour (light / heavy / extreme), melts above +0.5 °C; wet ground dries in 2–7 h; ice forms below −0.5 °C. Old snow goes grey (the user, 2026-11-03: "snow lingering after a snowy day for many days if temperatures stay low (with degrees of snow, dirty snow if it's old)…"). Footprints (the user, 2026-11-04: "… transitory footprints as well where we walk without it being too heavy in performance") are one instanced mesh of 1,500 in a ring: one draw call. That's a useful precedent for OLYMPUS dust tracks.
- **Body temperature** (`src/sim/thermal.js`; the user, 2026-11-03: "add temperature, seasons and link them to NPC clothing (which if we're too far from it should make us more conspicuous …), also add hypothermia and heat strokes for extreme temperatures + being wet for when caught in rain, which would decrease body temperature"):
  - Day bands by temperature: freezing <0, cold 0–8, cool 8–15, mild 15–22, warm 22–28, hot ≥28 °C.
  - Clothing warmth: T-shirt/dress 0, robe 1, jumper/jacket/suit/uniform 2, trench 2.5, coat/anorak 3, parka 4, hat +0.5. Expected warmth: freezing 3–4, cold 2.5–4, cool 2–3.5, mild 0–3, warm 0–2, hot 0–1. Dressed for another season: +1 per step to anyone looking for you (max +3).
  - Core temperature p.core, nominally 37 °C. Felt air = temperature − wind chill (0/2/5/9 °C by strength) − 0.07 °C per point of wet, + 3 °C under a clear midday sun. Each garment has a comfort range (T-shirt 16–31, jumper 5–25, coat −10 to 17, parka −25 to 10; hat 3 °C lower).
  - The core settles toward 37 − 0.25 °C per degree below the range, or 37 + 0.12 per degree above, over an hour in the cold and 45 min in the heat. Running adds 1.2 °C. Indoors it returns to 37 over 30 min.
  - Thresholds: <36 shivering (−1 to all rolls); <35 hypothermia (−3, walk ×0.85); <33 (−6, ×0.7); <31 down; <28 dead. >38 too hot (−1); >39.5 heat exhaustion (−3, ×0.85); >41 heat stroke, down; >42.5 dead.
  - Measured: −15 °C in a breeze in a T-shirt reaches hypothermia in 17 min; a coat and hat hold for more than 6 h; heat exhaustion in a coat in Cairo's 38 °C midday sun takes 92 min.
- **Effects via one table and one helper each** (light / heavy / extreme):
  - Sight cap (m): rain 46/36/24, sleet 42/32/22, snow 40/28/16, fog 30/18/10, dust 40/24/14. Base sight is 52 m by day, 30 under a lamp, 15 in the dark, and the lower of the weather cap and the light wins (`sightM()`; my call: a distance, not a fraction).
  - Crowd multiplier (`crowdK()`): e.g. rain 0.9/0.65/0.35; wind strong ×0.92, gale ×0.75.
  - Face recognition (`weatherMods()`): −1/−2/−3.
  - Footing (`footing()`): snow walk ×0.95, run ×0.9; deep snow ×0.9 / ×0.82. Slip chance per running second: snow 1.5%, slush 1%, ice 5%, with a 0.8 s stagger.
  - Light (`sim/light.js` sky()): sun × (1 − 0.7 × cloud), etc. "The light at a spot comes from the same helper that lights the scene, so what you see is what's rolled."
- **Balance tests** play in clear weather (`newGame({ weather: 'clear' })`). A debug pin: `?weather=snow-heavy-gale`.
- Rendering cost: "296 draw calls a frame as before, the frame's work 0.7 ms either way".

**For OLYMPUS.** Reuse the pattern: environment as a pure function of (seed, place, clock) that moves no other dice; one table plus one helper per effect; a body core-temperature model with thresholds turned into roll penalties and movement multipliers. Mars needs its own physics: dust storms (regional and global, which tradecraft's "dust" kind hints at), CO2 frost, about 600 Pa pressure, −60 °C mean, and diurnal swings of 70+ °C. Suits, habitat HVAC and decompression replace clothing comfort ranges. Domes and ships have controlled climates, which change only when systems fail.

---

## 9. Intelligence and leads (l.162–167)

- **Intelligence** "is literally 'intelligence': a blue object named intelligence, never specific, so it generates easily. It is rare, found in many ways and many quantities, and finding it should feel like a 'YEAH' moment. It is never wrong and never expires. If you get it, you have it; what can expire are the opportunities that lead to it. It is fungible."
- **Leads** are specific, usable knowledge ("this man meets that one on Thursdays at this café; she has a secret"). They point to the next step, and secrets become hooks (Q106).
- Sources: SIGINT (abstracted as a Tech check plus time), HUMINT, surveillance, OSINT, physical evidence, documents.

**For OLYMPUS.** The pattern is an **abstract, fungible reward unit** alongside **specific, generated leads**. A soldier's equivalent might be objectives secured or intel recovered on ops, plus commendations and evaluation points. The "YEAH moment" goal and "never wrong, never expires" keep the reward clean.

---

## 10. Characters: skills and checks (l.169–226), the RPG core

### 10.1 Skills only, no attributes (l.171–187)
"No attributes (no STR or INT), only skills, plus the class's over-skill." The spook's list:

| Skill | What it's for |
|---|---|
| Tradecraft | The over-skill (0–100). |
| Deception | Blending in, staying unseen, lying, being hard to remember, and undrawn inconspicuous acts (hood up, cap on). |
| Tracking | Finding a target and keeping them. |
| Pathfinding | Spotting a tail and losing it. |
| Awareness | Noticing (Q117). |
| Social | Reading people and working them. |
| Analysis | "How smart we really are": matters most at high rank, far from agency support. |
| Tech | SIGINT and devices (Q117). |
| Medicine | Wounds and their care (Q117). |
| CQC, Weapon handling, Fitness | Fighting, guns, the body. |
| Languages | Each separate, at five levels. |

"More may come and some may merge, so the list must scale." In code the list is data (`SKILLS` in `src/sim/skills.js` l.16–28: keys deception, tracking, pathfinding, awareness, social, analysis, tech, medicine, cqc, weapons, fitness; languages are separate in `p.langs`).

### 10.2 The check (l.188–192; `src/sim/checks.js`, 79 lines)
- **d20 + skill + modifiers ≥ DC**. **Natural 1 always fails; natural 20 always succeeds.**
- DCs (`DC` in checks.js l.23): **easy 10, average 15, hard 20, very hard 25, expert 30, elite 40**.
- Modifiers are data `[{ why, v }]`, each named and shown in the log:
  - the target's gauges toward us (fear, trust, affinity, −5…+5);
  - a hook spent (halves the DC; see §11);
  - needs (hunger, stress, fatigue);
  - the environment: night, darkness, crowds, distance (Q116). "The light at a spot comes from the same helper that lights the scene, so what you see is what's rolled."
- **The body is in every roll** (0.1.0-rc7; `sim/checks.js`): when a side names its roller (`body: sheet`), `side()` appends `health.mods(body, skill)` and `needs.mods(body, skill)`:
  - blood lost: pale −1, shock −3;
  - head hurt −1, dazed −3;
  - face cracked −1 / broken −2;
  - for CQC and Fitness: ribs −1 / torso wound −3; legs −1 / −2 / broken −4 (splinted −2);
  - for CQC and Weapons: arms −1 / −3 / broken −4 (Weapons −6, halved if splinted);
  - fever; pain (not in CQC: adrenaline); shivering wet −1; a heavy cold −1 unless dosed;
  - thermal: shiver −1, hypothermia −3/−6, hot −1, heat exhaustion −3.
  
  (`src/sim/health.js` mods() l.116–146.)
- Log format: "Social check: 12 + 8 = 20, success. …" Code `checkText()`: "Deception check: 14 + 12 + 2 (night) = 28 against 15, success." The short top-left line comes from `checkShort()`: "Deception 28 against 15 · passed" or "Pathfinding 24 against Tracking 19 · you win". (Wording: not "made", because "made is what you are when they've spotted you".)
- Results are **plain data**, stored in the log as is; `checkText()` is the single formatter.

Core code (checks.js l.29–53):
```js
function side(rng, { skill, value, mods = [], body = null }) {
  if (body) mods = [...mods, ...bodyMods(body, skill), ...needMods(body, skill)];
  const roll = d20(rng);
  return { skill, value, roll, mods, total: roll + value + sumMods(mods), nat: roll === 20 ? 20 : roll === 1 ? 1 : 0 };
}
export function check(rng, { skill, value, dc, mods = [], hook = false, body = null }) {
  const s = side(rng, { skill, value, mods, body });
  const against = hook ? Math.ceil(dc / 2) : dc;
  const ok = s.nat === 20 ? true : s.nat === 1 ? false : s.total >= against;
  return { kind: 'check', ...s, dc: against, hook, ok, margin: s.total - against };
}
export function opposed(rng, ours, theirs, { hook = false, them = false } = {}) {
  const a = side(rng, ours), b = side(rng, theirs);
  if (hook) { b.raw = b.total; b.total = Math.ceil(b.total / 2); }
  const ok = a.total >= b.total;   // ties to the first side (ours)
  return { kind: 'opposed', ours: a, theirs: b, hook, ok, margin: a.total - b.total, ...(them ? { them: true } : {}) };
}
```

### 10.3 Opposed rolls (l.194–204)
"Contested actions are opposed rolls, both shown in the log (Q116). The totals decide, naturals included, and **ties go to us** (my calls). If naturals won outright, every contest would fail at least one time in ten whatever the skills, and a tail is a handful of contests."

| Situation | Our roll | Theirs |
|---|---|---|
| Tailing someone unseen | Deception | Pathfinding |
| Keeping them | Tracking | Pathfinding when they try to lose us; otherwise a DC from distance and crowd |
| Spotting our own tail | Pathfinding | Deception |
| Losing that tail | Pathfinding | Tracking |
| Covert act in view (drop, pass, photo, staring) | Deception | Each observer's Awareness |
| A lie | Deception | Social (Q125) |
| Other social approaches | Social | A DC plus their gauges |

`them: true` marks a roll initiated by someone else against the player, so `won()` reads it the right way round.

### 10.4 The scale (Q115, l.205–210)
- **Trained base 0–20**: untrained 0, a course 5, advanced 10, expert 15, master 20 (`TRAINED` in skills.js l.40). **Practice adds 0–3; rust takes it back.**
- **Over-skill 0–100.**
- **value = (trained base + practice) × (1 + weight × over-skill / 100)**, rounded, so the maximum is 23 × 2 = 46 (skills.js l.45–56). Then `skill()` subtracts rust and adds `sheet.strain` (the day's fatigue penalty, a negative number) and clamps at ≥ 0. Fitness uses its effective value (base + `p.fit.off`).
- DCs: 10 / 15 / 20 / 25 / 30 / 40.
- Reference points: "A civilian sits around 0–8, an illegal's CQC near 30, enemy special forces near 40."

### 10.5 Tradecraft's weights (Q113; my call, to be tuned)

| Weight | Skills |
|---|---|
| 1 | Deception, Tracking, Pathfinding, Awareness |
| 0.6 | Social, Analysis |
| 0.5 | CQC, Weapon handling ("an illegal's fighting comes mostly from training") |
| 0 | Fitness, Languages, Tech, Medicine |

"Other classes get their own weight tables." The soldier's was never written (skills.js l.33).

### 10.6 Growth (l.221–223, plus code)
- Design: "Tradecraft grows with training, with experience from spook checks (more for harder ones), and with a bonus per completed assignment (Q118)." Formal training happens in three places: in the schedule at low rank, in courses at HQ between postings (weeks skipped), and in cover-friendly practice abroad (gym, language tutor, boxing club) (Q119).
- **XP for the over-skill** (`src/sim/xp.js`; the user, 2026-11-03: "tradecraft increase should be heavily logarithmic, taking A LOT of missions to improve significantly as we get better … beginners (tradecraft around 20, they would improve 1 point from such a tail), officers (around 40, maybe 1 point for 5 missions like this, more for more risky and difficult missions) … difficulty and risk increase the amount of XP, riskier stations would carry more … losing a tail would bring more XP than not doing anything wrong as we're being watched, and each successful roll should bring in some XP (very little comparatively)"):
  - Cost of the next point at over-skill os: `cost(os) = round(8 × 6.25^((max(0, os−20))/20))`. That is 8 XP at 20, 50 at 40, 312 at 60, about 7,000 at 95 (×6.25 every 20 points).
  - `missionXP = base[kind] × OUTCOME_K[kind][outcome] × CRAFT_K[target] × TEAM_K[team on you] × risk × (1 + max(0, heat−20) × 0.005) × (trip ? 1.2 : 1)`.
  - Base: sdr 12, tail 10, watch 10, range 6.
  - Outcome multipliers, e.g. tail: seen 1, lost 0.4, made 0.3, blown 0.1. "A failure teaches a little too."
  - Target craft: careless 0.85, trained 1.15, sharp 1.35, jumpy 1.25. Team on you: none 1, overt 1.2, covert 1.5.
  - A team shaken off: LOST_XP overt 6, covert 10.
  - Every roll won: ROLL_XP = 0.1.
  - Points are bought one at a time, each at the cost for the level reached (`level()`). The sheet shows "Tradecraft 41, 12 of 50 XP toward 42".
- **Skill training is hours, not points** (`src/sim/training.js`; the user, 2026-10-27, "time as a currency" quote above):
  - Next point of trained base costs `hoursFor(base) = 4 + 0.8 × base` hours (8 h at 5, 12 at 10, 16 at 15).
  - Each teacher caps (`upTo`): a gym makes you fit, not an athlete; a sensei goes far; a book only to course level (books upTo 7–10, 7–12 h, $12–30).
  - Languages: 25 / 70 / 160 h to basic / working / fluent; schools go up to fluent.
  - Money, tiredness and hunger costs are charged by the scene.
- **Practice and rust** (`src/sim/rust.js`; the user, 2026-11-03: "in general, skills higher than 15 but unused for over four weeks become 'rusty' and require some amount of practice to restore their full bonus (like fighting which can be restored or maintained by going to a club twice a month. Getting into a fight in the world counts as two fight sessions in a club)"; and 2026-11-04: "core spy skills … should all be bumped out of rust by any spy assignment"):
  - Constants: RUST_FROM 15, PERIOD_DAYS 28, KEEP_SESSIONS 2, RUST_MAX 3, ROLL_SESSION 0.25 (each roll of a skill is a quarter-session of practice), FIGHT_SESSIONS 2.
  - Every 28-day period, each skill over 15 with fewer than 2 practice sessions gains a rust level (max 3). Each session removes one level first.
  - The penalty: `rustOff = round((total − 15) × rust / 6)`, so at max rust you lose half of everything above 15 ("a legend's CQC of 30 left alone three months fights at 22").
  - An assignment done clears the CORE four's rust.
  - The log names what keeps each skill up (amateur dramatics, photography club, walking club, dance class, chess, radio club, first-aid course, a class at the club, a range session).
- **Fitness** (`src/sim/fitness.js`; the user, 2026-11-03: "fitness should remain a skill, but there should be a shadow skill called effective fitness, that goes down the longer we go without exercising. Walking would be part of exercising … should bring the effective fitness up from base fitness up to three points before moving the actual fitness skill up one point, and the same should be true downward … The higher we go the harder it gets to exceed base fitness … to model real life fitness maintenance and the fact that high level athletes require more training than lambda joes trying to stay fit"):
  - Weekly load: gym session 10, class 7, 0.6 per km walked, 2.5 per km run (×1.5 in a plate carrier).
  - At week's end: load ≥ `upNeed(b) = 4.5b` raises the offset +1 (to `capOf(b) = max(0, min(3, 24 − b))`); load < `holdNeed(b) = 2.2b + 2·max(0, b−12)` lowers it −1 (to −3).
  - Two weeks at the top of the band moves the base +1 (offset −1); two weeks at the bottom moves it −1. FIT_MAX 24. Base 10 needs 45 to rise and 22 to hold.

### 10.7 Needs (code; DESIGN's "Needs" section is past l.300 but `needs.js` quotes it: Q149)
- **Hunger** (`src/sim/needs.js`):
  - HUNGRY_H 6 h → −1 to everything; STARVING_H 14 h → −2; WEAK_H 48 h → −3 and no running; FAINT_H 72 h → faint spells (chance 0.2 × (1 + days past) an hour, 4–12 min down; someone calls an ambulance); DIE_H 21 days → dead.
  - The user, 2026-10-28, reported "when sleeping, the hunger meter is frozen" as a fault. Now sleep doesn't feed you: you wake as many hours from your last meal as have passed.
  - The user, 2026-11-04: "there should be a limit to how hungry we get before we pass out and die or get taken to a hospital".
  - A meal takes EAT_S = 120 s.
- **Stress** 0–100: up with danger (fight, wound, being seen by the target, a hunter who knows you). Down 0.5/min, or 2/min sitting or indoors, and with a meal, rest or sleep. ON_EDGE 50 gives −1 to Deception, Social and Awareness; FRAYED 75 gives −2, plus involuntary slips (a 35%-a-minute chance of a glance back over the shoulder that the scenes count as a real one).
- **Fatigue** (`sim/campaign.js` l.683–693): hours awake > TIRED_H 16 → −1 to all skills; > EXHAUSTED_H 20 → −(3 + floor((h−20)/3)), max −12 (the user, 2026-11-03: "extreme fatigue (like from not sleeping for too long) should chip away at skill efficiency"). Words: tired / exhausted / "dead on your feet" (36 h) / "seeing things for want of sleep" (48 h).

### 10.8 Hidden traits, reading people, the player character (l.224–226)
- Hidden traits: secrets, loyalties, motivation (money, ideology, coercion, ego), relationships.
- **Reading people**: "People are discovered by interaction and surveillance. How much you learn is governed by your relevant skill, and Analysis speeds it up. Fighting someone reveals bounds: a karate master who beats you in a training bout shows a CQC above 20, and nothing more." The F → Read UI shows each skill as a bar narrowed to a range (l.~818 #16).
- **The player character**: "Procedurally generated; hundreds of hours per character. Needs: sleep, stress, food, injury and health. A private life per posting, real or cover."

**For OLYMPUS (RPG core).**
- **Reuse the check exactly**: d20 + skill + named modifiers vs DC, naturals in single checks, totals-only in opposed rolls, ties to the player, modifiers as `{why, v}` data, one formatter for the log, the body and needs folded into every roll. The user explicitly asked for tradecraft-like resolution ("whether a shot hits").
- Keep **no attributes, skills only, plus an over-skill**: Warfighting for soldiers. Write a soldier skill list and weight table, as data. One possible starting point (a suggestion, not a user decision):
  - weight 1: Marksmanship / Weapon handling, Fieldcraft (movement, stealth, cover), Awareness;
  - weight 0.8: CQC, Tactics;
  - weight 0.6: Leadership;
  - weight 0.5: EVA / zero-g movement, Demolitions;
  - weight 0: Fitness, Medicine (combat lifesaver), Tech, Piloting, Languages.
  
  Fitness should stay its own body-driven track. OLYMPUS adds G-tolerance and low-g deconditioning, which tradecraft's base/effective fitness model already hints at.
- Hygiene, thirst, bladder and bowel, sleep, O2 and CO2, and g-load all extend `needs.js`'s shape: hours-since-X thresholds giving named roll penalties and text notes, plus hard limits (pass out, hospital, death), all lived through skips.
- The XP curve (×6.25 per 20 points), hours-based training with teacher caps, rust (28-day periods, 2 sessions), and fitness with a base/effective band are user-specified realism. They should carry over almost verbatim. For a soldier, ranges, drills and PT keep skills from rusting, and operations clear rust on core combat skills.

---

## 11. People: bonds and persistence (l.228–240)

- **Three social gauges**, each −5…+5, added to the relevant checks and saves (`src/sim/people.js` GAUGES, GAUGE_MAX 5):
  - **Fear**: how wary someone is of acting against us and how they react to hostility. "A terrified civilian can be talked out of reporting something. Negative fear makes them likely to turn aggressive if they also dislike us."
  - **Trust**: how likely they are to believe us and do what we say. Suspicion is negative trust. Falling trust hurts checks and makes reporting more likely.
  - **Affinity**: whether they like us. Those who do are less likely to turn hostile.
  - They move ±1 for a notable exchange and ±2–3 for a big moment, and drift back to 0 by **one step a week** without contact (Q123; my call on the rate). In code: `nudge(person, gauge, delta, ms)` clamps and sets `met`; `drift(person, ms)` takes off whole weeks since `met` (DRIFT_DAYS 7) and carries the remainder.
- **Hooks**: surveillance surfaces secrets, and secrets become hooks: single-use, tied to one person, fungible. Spending one **halves the DC** of one relevant check (Q122); in an opposed roll it halves their total (rounded up). "A hook isn't an approach of its own: it's spent on one."
- **Conversation approaches** (Q124): charm, convince, elicit, lie, intimidate, bribe, ask a favour, reassure, threaten, pitch (recruit). Each leads to a check. Cover relationships can turn romantic, off screen, through the gauges (Q126).
- **Persistence**: "Each assignment carries its own people, and they persist with it. A posting carries its own: cover friends, a few colleagues at the cover job. Some belong to the character for life: family and friends, who matter less once an illegal disappears from their lives."
- **Sheets** (`people.js` l.1–25): plain data `{ id, name, sex, cls, os, skills: {key: [base, practice]}, langs, gauges, met, look (sprite spec), persistent }`. The player is a sheet too.
- **Throwaway crowd**: "Most people on a map are throwaway: passers-by generated from a seed of their own (passerby()), the same every time for that seed and city, never saved beyond the seed. Their sheets sit around 0–8. Their names, languages and dress are their city's."
- **The crowd bubble** (DESIGN l.488): passers-by live on the player's street and the streets either side, within 45 m along them. Whoever was on our street when we crossed is still behind us; the street ahead was already full. Crossing again lets go of the street two back: "only a scenario's people, the posting's and the character's are kept beyond. So anyone can be tailed, and the tail ends at their door." A skip of ≥ 120 s recycles the crowd. Downed or dead passers-by persist on their street through skips (the user, 0.1.36: "shot and down NPCs get recycled out when we skip time or move away and come back").

**For OLYMPUS.** This is the "some fully fledged and permanent, crowds more surface level" layering the user asked for. Three persistence tiers carry over directly:
1. character-lifetime people (family, squadmates, mentors);
2. deployment or posting people (the unit, base staff, the local contacts on Europa);
3. operation-scoped people (a target, hostages).

Everyone else is a seed-derived crowd in a bubble around the player, recycled after skips. The three gauges are simple and general; OLYMPUS may want a fourth for military life (respect, or cohesion in the unit). Hooks translate to leverage or favours. Tradecraft explicitly had "no office politics, rivals or budgets", but OLYMPUS's barracks life will need fellow marines with schedules, which tradecraft reserves for permanent characters.

---

## 12. Cover, heat and the hunt (l.242–271)

- One legend per posting. A cover is strained by being seen in the wrong place, contradicting your story, who you're seen with, and document checks.
- **Heat** is one number (Q128), and the player never sees it (Q129). It rises when the authorities learn things (Deception limits what they get) and falls when you lie low. "The instinct's flavour text describes the signs: the same car twice, a neighbour asked questions. High skill reads them in time … Low skill may be burned without noticing, until special agents knock at the door."
  - My call (`src/sim/heat.js`): one heat per legend per country, 0–100, in stages:
    - 0–19 quiet;
    - 20–39 watched (occasional surveillance; official cover starts here);
    - 40–59 tailed (regular tails, provocations);
    - 60–79 investigated;
    - 80–99 closing (special agents);
    - 100 blown.
  - Cooling: lying low −2 a day, going about the cover −1 a day, never below the cover's floor. (The campaign actually uses −1 a day plus "lie low a day: heat −6", `campaign.js` pass() and l.628, so the numbers moved during tuning.)
  - Under a legend: a heat floor of 1 once heat has ever passed 1, after which your own phone is a watched line (the user, 2026-11-04).
  - **What your officer believes** (DESIGN l.~818 #14; the user, 2026-10-28: "The heat level and the cover health should be reworded to be more roleplay, what we see is what our character evaluates as being true (we can't know for sure we're not about to be burned, especially if we're not very experienced)"). Displayed words are campaign.js heatWord(): quiet <30, noticed <45, watched <60, hot <75, burning.
- **Per-person suspicion** is that person's trust, separate from heat.
- **"Tails are the core activity."** Shaking a tail too obviously "is not punished as such: part of tradecraft is knowing how to do it right, and that's the roll (Q130)".
- **Affordances are the engine's** (v0.0.36, the user: "stuff like benches offers and all these elements should not be linked to the scenario we pick in the main menu, it's a game engine thing"). Wherever you are, the instinct's line ends with what you can do there, and **T** does it: look in a shop window, sit on a free seat, cross at the zebra (`src/sim/acts.js` affordance()). Scenes add their own acts over the engine's. "An urgent line gets no offer."
- **Disguise and the instinct**: clothes changes are drawn (hats, coats, glasses); subtle things are abstracted into Deception (Q156). "High Tradecraft brings the **instinct**, a voice in the head that warns when to change route, step clear or buy clothes. The T key does what it says."
  - Advanced disguises (0.2; `src/sim/disguise.js`; the user, 2026-11-04: "When we implement disguises, we will be able to change our face description+age+build …"; "disguises will begin at officer level when we have to manage networks"):
    - Quality = disguise officer 0.5 + Tradecraft/500 + Deception/150, max 0.97 (handler 0.69, undercover 0.8, illegal 0.96).
    - A watcher sees through it on Awareness vs 14 + quality × 20; once read through, the disguise counts −3.
- **Blown → the hunted state** (Q133): reach an extraction point across generated sections, with safe houses as stops; it lasts hours to days; enemy SF come if the stakes are high. Capture is game over. The "Blown" scenario (`src/sim/scenarios/hunted.js`): 3–5 plainclothes hunters on search legs, each within 28 m rolling Awareness vs your Deception every 3 s (description fits +2, changed coat −8, dark −3, running +6), their rolls hidden until the end; a driver waits 80 min.
- **Ordinary law** (Q134): a police stop is a Papers, Please-like scene; an arrest is survivable unless it also blows the cover (`src/sim/police.js`: patrol odds by city, a weigh-up from what shows on you, heat and the city's habits, then Deception vs Awareness).
- **Under a legend there's no immunity**, and an arrest means prison (`src/sim/prison.js`: Deception vs 20 + country CI × 14 + charge gravity). If the legend holds, you're tried as that person; if it breaks, it's espionage and the career is over. Self-extraction (the user, 2026-11-04): "successful extraction after being burned … needs to be very hard as an undercover and almost impossible as an illegal".

**For OLYMPUS.** Heat itself is spy-specific (skip or reference only). Three patterns carry over:
- **a hidden escalating world-state number shown only through the character's read of the signs**, scaled by skill (could become the threat level in a peacekeeping zone, or the enemy's awareness of a special-ops team);
- **the instinct**, a skill-gated inner voice that suggests the next action, executed by one key;
- **affordances owned by the engine, not by scenarios** (sit, shower, eat, clean the weapon: T on any world appliance). That last one is exactly the OLYMPUS "world appliances" idea.

---

## 13. Networks and handling (l.273–280)

- A simplified cycle: approach, recruit, handle. Targets are posting-level characters known to lead to intelligence; they persist at least until we have it.
- Motives: money, coercion, ideology, ego, revenge, friendship or romance. Social checks and surveillance hint at what works, which improves the recruitment check.
- Handling: regular meetings, payments, keeping their nerve and trust, tasking, protecting. Assets can lie, be doubled, or be arrested.
- **A doubled asset** stops yielding and may lead you into a trap (Q136). It doesn't show until it betrays you openly or your skills catch something off.
- Covert comms: dead drops, brush passes, safe houses, car pick-ups, burner phones. A handful of agents per posting.

**For OLYMPUS:** mostly skip. A distant analogue is a special-ops team running local sources on Europa or in the Belt; use as reference only.

---

## 14. The agency, analysts and special forces (l.282–299)

- **Services**: analysts on call give a background check, a translated recording, an exploited device (SIGINT), forged documents, a surveillance team, allied special forces (capture or rescue), or extraction. Services are asked for **only from secure places** (station secure room, safe house), never by phone. Each takes time and costs **credits**: "each operative has an allowance that refills over time, and it's larger at high rank, because a senior officer is more precious (Q137, Q138)."
- **Money**: two purses (Q139): a salary, and an operational fund for payments, taxis, clothes and bribes, checked at review.
- **Special forces**:
  - Allied SF run high-risk kinetic operations for us. "The player meets them only at a black site, before interrogating a target they caught."
  - "Enemy special forces are the bogeyman. A squad that makes contact means almost certain death: their CQC and weapon handling are near the maximum. The goal is to evade them."

**For OLYMPUS.** The roles invert: in OLYMPUS the player can *be* the special forces. The tradecraft numbers give a consistent scale. Enemy SF sit near 40 and a tier-1 operator at the top of Warfighting (value up to 46), while civilians sit at 0–8. A regular marine out of basic might sit at a trained base of about 5 in core combat skills with Warfighting around 10–20. The refilling-allowance pattern (credits, larger at higher rank) maps to requisitions and fire support: artillery, air or orbital support, medevac, a QRF, each requested through proper channels and taking time. Two purses map to pay and unit or operational funds or requisition points.

---

## 15. Collected user preferences from lines 1–300 (and the code headers they spawned)

Dated where the source dates them. All are the user's words or decisions unless noted.

- 2026-10-26: design debrief Q1–Q162. Decisions include:
  - an active day = 20–40 real minutes (Q105);
  - postings played in chapters (Q104);
  - skills-only d20 checks;
  - the 0–20 / 0–100 scale (Q115);
  - environment modifiers (Q116);
  - gauges drift (Q123);
  - hooks halve the DC (Q122);
  - heat is one hidden number (Q128, Q129);
  - shaking a tail obviously is not punished in itself (Q130);
  - hunted state (Q133);
  - Papers, Please police stops (Q134);
  - services cost refilling credits (Q137, Q138);
  - two purses (Q139);
  - cover job gauge (Q140);
  - tasking never electronic in enemy territory;
  - each mechanic built as a playable test the user scores before joining (Q161).
- The user's worries: "clunky mechanics, an inconsistent experience, empty gameplay".
- 0.1.0-rc5: "speech bubbles for scripted speech, they should linger as long as when using the top left text".
- 2026-10-26: an illegal is native: "no accent, nothing".
- 2026-10-27: cities as data, "make them feel different, make sure streets are not blindly always like US grid cities".
- 2026-10-27: weather "snow, rain and wind, graduated light/heavy/extreme, real effects, structured and scalable".
- 2026-10-27: "time should feel like a currency" (gym, martial arts, bed, books, language class); no bare waiting.
- 2026-10-28: hunger must keep counting through sleep (the reported fault was "when sleeping, the hunger meter is frozen").
- 2026-10-28: heat and cover shown as the character's belief, not the truth.
- 2026-10-31: read a book while sitting, in 10-minute chunks, as long as you want.
- 0.1.0-rc27: shopping must not leave you stuck inside ("went to buy a book in a bookstore, never came out even after 3 minutes"). Purchases are timed actions.
- 0.1.0-rc50: no fast travel to work or home ("it would skip all the gameplay like shaking watchers").
- v0.0.36: affordances (benches etc.) are "a game engine thing", not scenario-bound.
- 2026-11-03:
  - logarithmic over-skill XP (quote in §10.6);
  - rust after 4 weeks for skills > 15, clubs twice a month, a fight counts as two sessions;
  - fitness with a shadow "effective fitness";
  - extreme fatigue chips at all skills;
  - time skips should recycle NPCs;
  - snow ageing and puddles;
  - temperature, seasons, NPC clothing, hypothermia, heat stroke, wetness.
- 2026-11-04:
  - face on file;
  - the illegal branch: under 30, Tradecraft boosted to 80, a career-ending one-way post;
  - legends can go London → undercover → illegal;
  - an old officer retires on a pretext after two postings;
  - incubation 3–20 months / 3–14 years;
  - track the year, with language training between postings;
  - core spy skills cleared of rust by any assignment;
  - starvation limit (pass out, hospital, death);
  - advanced disguises from officer level;
  - extraction very hard undercover, almost impossible as an illegal;
  - footprints and tyre tracks "without it being too heavy in performance";
  - the arrest needs "a splashscreen that explains what happened", a reflex action and an animation;
  - the headscarf dress rule.

---

## 16. Reuse assessment (tradecraft → OLYMPUS)

Tradecraft's sim is **pure ES-module JavaScript over plain-data state** (`state`, sheets as plain objects, results as plain data stored in the log). Nothing in the sim calls Math.random, and there's no Date. Most modules are small and depend only on `rng.js`, `clock.js` and each other. That makes them easy to lift.

| Module (tradecraft path) | What it is | Verdict | Why |
|---|---|---|---|
| `src/sim/rng.js` (67 l.) | sfc32 RNG with state as plain data, FNV-style `hash(...)`, `stream(...seeds)` for independent deterministic streams, d20/int/range/pick/chance/weighted | **reuse** | Pure, no dependencies, battle-tested; the stream pattern underpins deterministic background generation. |
| `src/sim/checks.js` (79 l.) | check(), opposed(), DC table, hook halving, `{why,v}` modifiers, checkText/checkShort | **adapt** (near as-is) | The exact RPG resolution the user asked to carry over; swap the imports for OLYMPUS's health/needs/skills; rewrite the text voice. |
| `src/sim/skills.js` (56 l.) | Skill list as data, classes and over-skill weights, the value formula | **adapt** | Keep the formula and structure; write the soldier list and the Warfighting weights (the stub exists). |
| `src/sim/clock.js` (62 l.) | Integer-ms game time, 20 Hz tick, Gregorian calendar without Date | **adapt** | Keep integer ms and the tick; add sol length (88,775,244 ms), a Mars calendar, and ship/Earth time; the per-body day length must be a parameter. |
| `src/sim/game.js` skip() (l.425) | Time jump with outcomes for the gap | **reference** (pattern) | game.js is large and tied to tradecraft's street sim; re-implement the pattern for OLYMPUS's life support, needs and NPC schedules. |
| `src/sim/campaign.js` pass(), review(), fatigue() | Day-by-day catch-up producing papers; weekly review; hours-awake penalty | **reference** | Spy-specific content, but the paper-producing day loop and the fatigue curve (16 h / 20 h / +1 per 3 h, max −12) carry over. |
| `src/sim/xp.js` (74 l.) | Logarithmic over-skill XP, mission XP multipliers | **adapt** | The user's explicit curve; swap the mission kinds for military ones (patrol, op, range, drill, boarding). |
| `src/sim/training.js` (98 l.) | Hours-based training with teacher caps; books; languages | **adapt** | "Time as a currency" is the user's taste; the military analogue is courses, ranges, PT, the manuals library. |
| `src/sim/rust.js` (65 l.) | 28-day rust periods, practice sessions, fieldwork clears core rust | **adapt** | The user's rule; map clubs to ranges, the gym and drills. |
| `src/sim/fitness.js` (77 l.) | Base plus effective fitness band, weekly load | **adapt** | Directly relevant; add g-load and low-g deconditioning on top. |
| `src/sim/needs.js` (129 l.) | Hunger/stress thresholds giving roll mods, starvation path, slips | **adapt** (as a template) | OLYMPUS needs more needs (thirst, hygiene, bladder, sleep, O2/CO2, temperature, g); keep the shape: hours-since-X, named mods, text notes, hard limits, lived through skips. |
| `src/sim/people.js` (225 l.) | Sheets, the three gauges with weekly drift, seeded passers-by (Moscow names) | **adapt** | Gauges and drift as-is; passer-by generation must be rewritten for Expanse demographics. |
| `src/sim/health.js` mods() (404 l. total) | Body penalties folded into rolls | **reference** for the full module, **adapt** mods() | The part-based penalty table is good; the full health model is covered by another research slice. |
| `src/sim/thermal.js` | Core temperature model, clothing comfort | **reference** | Same physiology thresholds; Mars and space need suits, HVAC and vacuum instead of coats. |
| `src/sim/weather.js` | Pure seed+clock weather, per-city climate tables | **reference** (pattern) | Earth weather doesn't fit Mars; keep "pure function, own stream, never stored, one table, one helper". |
| `src/sim/heat.js` (40 l.) | Hidden escalating heat stages | **reference** | Spy-specific; the pattern (hidden number, believed words, stages that escalate world behaviour) can model a threat level. |
| `src/sim/career.js` (152 l.) | Time between postings, FSI language weeks, age | **adapt** | Pipeline-with-skip and aging are needed; replace FSI with military schools (boot, MOS school, SF selection) and add transit times between bodies. |
| `src/sim/incubation.js`, `legends.js`, `prison.js`, `disguise.js`, `dial.js`, `support.js`, `postings.js` | Deep-posting spy machinery | **skip** (reference for structure only) | Spy-specific; OLYMPUS might borrow the "school → floors applied at once" and "one timeline years pass" ideas. |
| `src/sim/acts.js` affordance() | Engine-level "what you can do here", T to do it | **reference** (pattern) | The user's rule that affordances are an engine thing applies directly to OLYMPUS's world appliances. |
| `src/sim/crowd.js` recycle(), bubble | Crowd bubble ±1 street, 45 m, recycle after 120 s skips | **reference** (pattern) | Habitat corridors and decks can do the same; the street geometry won't port. |

---

## 17. Translation notes for OLYMPUS (suggestions, not user decisions)

1. **Sol clock** in integer ms, 20 Hz tick, 1:1 real time, pause anytime, no speed controls. Fast-forward only through actions, each with a pixel-art splash (the user's OLYMPUS brief) and a papers digest afterwards.
2. **Skip = outcomes for the gap**, computed per minute where it matters (bleeding, air, temperature) and per day or week otherwise (gauges, fitness, rust, deconditioning, pay, evaluations). Never tick-simulate a skip.
3. **Chapters for transits and quiet stretches**: the player sets an allocation (train, study, rest, work duty), and a paper reports the result. Key days (briefings, drops, ops, inspections) are always played.
4. **Warfighting** as the over-skill (the user's own word for the soldier class in tradecraft), with value = (base + practice) × (1 + w × WF/100), DCs 10/15/20/25/30/40, and the same reference scale (civilians 0–8, enemy SF ~40, max 46).
5. **Every roll is visible** in a log with named modifiers, including the body and needs; the top-left line is short, and J holds the full sum.
6. **Engine affordances**: any appliance (shower, mess line, rack, weapon-cleaning bench, gym) offers its action wherever it stands; scenarios only add to them.
7. **Persistence tiers** (lifetime / deployment / operation / crowd) with seed-derived crowds in a bubble, recycled after skips of ≥ 2 min.
8. **Each mechanic is first a playable test** the user scores (Q161), then joined, with promotion of stable versions as in tradecraft.

---

## 18. Open questions raised by this slice (for the user)

- How long should an active sol take in real minutes? Tradecraft's answer was 20–40 real minutes (Q105). Does the user want the same budget for OLYMPUS, or longer, given the "slow paced" brief?
- Should the soldier be **skills-only plus the Warfighting over-skill** (tradecraft's model), or does realism under G and low-g deconditioning call for body attributes (strength, cardio, bone density) after all? Tradecraft's fitness base/effective split is a middle path.
- Rank: formal military rank (time in grade, promotion boards) or tradecraft's "a rank is a fact" (qualifications and operations completed)? Probably both.
- Special operations as a branch: should it mirror the illegal branch (age and fitness gates, a long school with floors applied at graduation, Warfighting boosted, and maybe one-way or career-defining)?
- Does tradecraft's "no office politics, rivals" rule hold in OLYMPUS, or should the squad and chain of command be part of daily social play?
- Should the time-skip splash be skippable or interruptible (an alarm, an emergency) mid-skip, the way tradecraft's sleep "can be disturbed"?
- Should OLYMPUS hide its threat state the way tradecraft hides heat (shown only as the character's belief), or show readiness and threat levels openly as a military display would?
