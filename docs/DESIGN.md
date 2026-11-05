# OLYMPUS: design

The hub of the design. It holds the vision, the pillars, the decisions every system obeys, and the index of the detailed sections in `docs/design/`. When a section and this file disagree, this file wins until one of them is corrected; correct it in the same change.

Started 2026-11-05 from the user's brief (kickoff, quoted below) and from the research notes in `docs/research/` (twelve deep reads of `../longhaul` and `../tradecraft`, with screenshots in `docs/research/shots/`, kept on this Mac only and not committed: 27 MB of the other games' screens).

## The brief (the user, 2026-11-05)

Verbatim, the user's spelling kept. Sections cite the brief here, not through the research notes.

> Trying out ultracode. New project, a game, I used to be partial to browser builds because portable and easy to spin up but I will let you decide the whole tech stack and ask questions about specs you can't just guess. Tell me whether you want to install some software for optimal results. The goal here is to run as long as necessary and use as much tokens as necessary to achieve an excellent result. First of all the main idea for this project : This will be a video-game. Context : Hard scifi expanse based game where we will play Martian military in as realistic way as possible. Please read the ../longhaul project docs to understand the setting we already built, but only refactor the tech from there if it's the best way. The specifics now and compared to this game is that we will play not as a bodyless ship that somehow manages the crew, but we will play as a career military person who can be (or become) a foot soldier (with gameplay like getting on a drop ship to be deployed for peace keeping on Europa, then pretty realistic gameplay where we have to manage the day to day of that life (slow paced game, with emphasis on realism and depth like managing hygiene levels, weapon controls like managing safety, muzzle discipline, fitness, medical aid and healing etc.). But the player can also become part of special operations teams and while still having to manage their own bodily needs and their weapon, will be dropped in much different special forces settings. The main things I want about this game is 1) Realism in physics, air, gravity, space being big and travel taking a long time, health effects under G and not under G, 2) Good gameplay, 3) High Resolution Pixel Art for close up gameplay, 4) The game will be mostly top down at different scales (look at longhaul for telescope views of space objects like planets and stars and how ship tactical maps are drawn it will be something like that I'm looking for when for instance looking at a tactical screen on a ship). Please build the game from the ground UP, meaning give me functional test versions that we can update with a promotion script to test the latest stable version you built. The thing is that you will be autonomously building the game to a final version that given the amount of tokens will take several days to really finish since I want a full 1.0 game fully featured and debugged in the end. So tell me in chat when you drop new versions, keep the documentation updated, make sure to keep your session alive with long running caffeinate commands and make sure the game is fun. The itch I'm trying to scratch with this game is the itch of space world (air management, gravity effects, water management, single player survival with bodily functions, realism and complexity where it makes sense with for instance guns being played with details like reloading being a remove magazine, put other magazine when we have magazines, clear chamber, aim the gun etc. Things must take time and not feel rushed with the ability to do activities that skip time. We won't be doing things like scrubbing our legs in the shower, but we will have to manage body hygiene with world appliances like a shower, and taking a shower will take a chunk of time forward on the clock. The main moving around and UI should look somehting like (you don't have to use the same tech, this is just artistic direction and controls) in ../tradecraft, with ship interiors, planetary surfaces, habitats etc. Features should include, ship combat, ship boarding, combat on planetary grounds etc. There should always be a base where we go back to do things like eat and shower at the end of the day etc. Game should perform as well as possible and as many parts of the background generation need to be done in such a way that we don't have to render actual graphics but the game should feel immersive. Examples : You start as a marine on Mars, out of basic training and train on Mars on standby for a week or two, with the everyday training looking like what it should be, full days (Mars days not 24h) moving in real time until we do things that spend time like eating (some degree of splash screen to illustrate the action and a time fast forward). Shooting should play as in Tradecraft (../tradecraft), with weapon handling. The character gameplay should also be inspired by tradecraft with skills and RPG like resolution of challenges (like whether a shot hits or not). NPCs should also be well built and reactive, smart, have their own lives. Some NPCs will be fully fledged and permanent, and crowds will be more surface level and serve the purpose of filling the world. There is an inordinate amount of work just to spec this out fully, you will have a lot of time. Ask any question you need to ask along the way and do release stable versions as you keep on working.

Decided with the user at kickoff (2026-11-05):
- **Clock:** 1:1 real time while you act. Activities skip time.
- **Death:** chosen per career at new game. **Ironman** keeps one autosave, and death ends the career. **Standard** lets you save anywhere and load after death. JSON export and import exist either way.
- **Versions:** Claude cuts patches and bumps the minor at each tested milestone. 1.0 is the user's call. The play copy moves only when the user promotes it.
- **GitHub:** public repo `mramad3us/olympus`. Every release is pushed with its tag.

## Pitch

You are a Martian marine. Out of boot camp, you are posted to a rifle platoon at a Marine base in the Mariner Valley. There you live the sol: reveille in the squad bay, the head, chow, PT under 0.38 g, the range, suit drills, classes, weapon cleaning, a centrifuge session to keep your body ready for Earth gravity, and lights out. Then orders come. You ride a shuttle to Phobos, then a troopship to Jupiter under thrust for days, and the flip, and a drop. Then you keep the peace in an ice miners' town under Europa's shell, where a day outside is a lethal dose of radiation and the air inside is rationed. Do well and you can try out for the reconnaissance companies. Those take you to places no line marine sees: a station boarded in vacuum, a derelict, a dome on Ganymede.

The game is your body and your rifle, played in real time and in detail, with the clock jumping forward whenever something simply takes time. Above you, a solar system runs as LONGHAUL's does. The powers move toward war and back, fleets move on real orbits, and news comes at the speed of light. Your career is pushed around by all of it.

## Pillars

1. **The body is the game.** Air, water, food, sleep, hygiene, bladder and bowel, heat, gravity, G-load, radiation and wounds are each a real, numbered model with real consequences. None of them is a bar to keep green for its own sake. Each one changes what you can do and how well.
2. **The gun is a machine.** Every weapon is a stateful object: safety, magazine, chamber, condition, what you know about it. Every action on it takes time and a skill roll. Muzzle discipline matters everywhere, not just at the range.
3. **Skill and dice decide execution; the player decides what to try.** This is tradecraft's resolution, used across the whole game: d20 + skill + named modifiers against a DC, and every roll can be read in the log. The player never aims with reflexes.
4. **Time is a currency.** At 1:1 the world is alive and you walk through it. Every action that takes time jumps the clock, behind an illustrated splash. There is no bare waiting and no fast travel that skips play. Long voyages and quiet stretches are lived as chapters with choices.
5. **Space is big and physics is honest.** Real orbits, real transit times, felt G, light lag, vacuum and pressure. Everything the screen shows is what the sim says, at true scale and in true time.
6. **People with lives.** Your squad, your NCOs and the people on base are persistent, with schedules, needs, moods, memories, relationships and careers of their own. Crowds are cheap and fill the world. Nobody pops in or out in view.
7. **Mistakes cost.** The game is lethal and the consequences are real (tradecraft: "no karma, only consequences"). Discipline is real as well: a negligent discharge, a missed formation or a dirty rifle all have in-world results.
8. **Fun first among the real.** Realism is in service of play. Complexity goes where it makes better decisions or better stories. Wherever it would only be chores, an activity skips it with an outcome. Each sol needs a rhythm (calm routine, then a spike, then the base at night), and each week needs a story beat.

## The loop at five scales

| Scale | What you do | Clock |
|---|---|---|
| Seconds | walk, look, talk, handle the weapon, fight (stop motion), give aid | 1:1, 20 Hz; stop motion in shooting and CQC; time stands still while you talk |
| Hours | the Plan of the Day: formations, training blocks, duties, meals, free time. Live a block or skip it with an outcome | 1:1 between blocks; skips with splash |
| Days to weeks | a voyage, a deployment rotation, a later dwell or standby (never the first standby) | chapters: key days played in full, quiet days chosen and summarised |
| Months | deployments, schools, selection, leave | chapters with papers |
| A career | rank, qualifications, scars, friends, the memorial | the world's own timeline |

A typical **active sol plays in 40 to 70 real minutes**. That covers two to four set pieces lived in full (the range, a suit drill, a patrol, a fight in the rec room), the walking and talking between them, and skips for meals, the shower, classes and sleep. Tradecraft targeted 20–40 minutes; OLYMPUS is slower by request ("slow paced"). **The first standby is lived sol by sol at 1:1**: only activities skip time (the brief: "full days (Mars days not 24h) moving in real time until we do things that spend time like eating"). From 0.2, a truly quiet sol in a later dwell week or on holiday routine can be spent down to a minute or two of choices ("Call it a day" at your rack, TIME §9.7) (my call).

## Settled decisions (every section obeys these)

### Setting
- **The world is LONGHAUL's.** It uses the same solar system, ephemeris, powers and sub-factions (UN, MCR, OPA, independents, pirate clans; inside the MCR: the MCRN Admiralty, Martian Naval Intelligence (MNI), the Congressional Unity Caucus, Hecate Arms & Drive, and Martian Security), politics model and ship classes. Its names and voice carry over ("Plant Trees Anyway", "Mind the Seals").
- **Mars is terraformed, a little** (the user, 2026-10-25, LONGHAUL v1.6.0). That means 52 kPa at datum, a 19 km scale height, a young northern sea, and lowlands you can breathe in.
  - **One correction for honest air:** LONGHAUL's 8% CO₂ would be hypercapnic, so OLYMPUS uses **N₂ 65.4 / O₂ 32 / Ar 2 / CO₂ 0.6 %**. The O₂ partial pressure then follows altitude:

    | Place | Altitude | Total pressure | O₂ | Inspired O₂ (PiO₂) | Feels like on Earth (by PiO₂) |
    |---|---|---|---|---|---|
    | Mariner Valley floor | −5 km | 67.7 kPa | 21.6 kPa | 19.7 kPa | sea level |
    | Base Melas | −4.5 km | 65.9 kPa | 21.1 kPa | 19.1 kPa | sea level |
    | Datum | 0 km | 52 kPa | 16.6 kPa | 14.6 kPa | about 2,400 m |
    | Highlands | +5 km | 40 kPa | 12.8 kPa | 10.8 kPa | about 4,300 m: hard work, mountain sickness within hours |
    | Tharsis domes | +10 km | 30.7 kPa | 9.8 kPa | 7.8 kPa | about 6,700 m: about 8 min of useful consciousness for the unacclimatised; masks or domes |
    | Olympus Mons summit | +21.9 km | 16.4 kPa | 5.3 kPa | 3.2 kPa | above 11,000 m: unconscious in under a minute without a mask |

    PiO₂ = O₂ fraction × (P − 6.27 kPa), the water vapour at body temperature taken off (BODY §11.1 owns the physiology; SETTING §4.2 the full table).
  - The CO₂ is about ten times Earth's by partial pressure in the valley (0.40 kPa at Melas against 0.042 kPa), seven times at datum: the air is "stuffy", and newcomers get headaches.
  - **What keeps it warm** (my call): 0.6% CO₂ is less than today's Mars holds, so it cannot give the 35 to 40 K of warming the climate needs. The warming comes from super-greenhouse gases, perfluorocarbons at tens of ppm made by the Republic's PFC plants (after McKay, Toon and Kasting 1991 and Marinova, McKay and Hashimoto 2005), helped by the pressure broadening of 52 kPa of N₂ and O₂. If the plants stopped, the PFCs would decay over centuries, not years: a political lever, not a cliff (SETTING §4.5).
  - The air column (P/g ≈ 1,400 g/cm² at datum, 1,770 at Melas) shields the surface from radiation better than Earth's does. The cold is real (mean −25 °C, equatorial lowland days up to +15 °C, nights −30 °C), and so are the dust storms.
- **Gravity:**

  | Place | Surface gravity | Day |
  |---|---|---|
  | Mars | 0.380 G | a sol is 24 h 39 m 35 s (88,775,244 ms) |
  | Europa | 0.134 G | 85 h, locked to Jupiter |
  | Callisto | 0.126 G | |
  | Ganymede | 0.146 G | |
  | Ceres | 0.029 G | |
  | Phobos | about 0.0006 G (effectively free fall) | |
  - Ships under thrust have deck gravity equal to the thrust, pointing aft. Coasting ships are in free fall.
  - Spin gravity exists only where LONGHAUL spins things (spun stations). The rest is thrust, ground or nothing.
- **The Corps:**
  - **The MCRN Marine Corps** is the Navy's ground, boarding and shipboard-security arm.
  - Enlisted and officer ranks follow the real-world US Marine model: Private, Private First Class, Lance Corporal, Corporal, Sergeant, Staff Sergeant, Gunnery Sergeant, First Sergeant/Master Sergeant, Sergeant Major/Master Gunnery Sergeant; then 2nd Lieutenant to General.
  - Units run fire team (4), squad (3 teams + leader = 13), platoon (3 squads + HQ, 44 with its corpsman and radio operator), company (191 with attachments: PEOPLE §3.2, CONTRACTS §15), battalion (about 1,000; 2/4 deploys 980).
  - Martian Marines train at 1 G under thrust and in centrifuges to be fit to fight Earthers and to ride warships. **G-conditioning** is a core stat (see Body).
- **The player's home unit:**
  - 1st Squad, 2nd Platoon, Echo Company, 2nd Battalion, 4th Marine Regiment.
  - The base is **Marine Corps Base Melas**, on the floor of Melas Chasma in the Mariner Valley (about −4.5 km, about 66 kPa, breathable). The nearest town is **Redwater**, one of LONGHAUL's names.
  - Units and names are OLYMPUS's own; no canon units or characters.
- **The Jovian theatre** is set from LONGHAUL's start state.
  - Jovian space is MCR-held. The UN contests Europa and Ganymede.
  - Europa's ground control is OPA ("Ice Control"; airspaces Conamara, Pwyll, Thera). A few million live in ice miners' towns on and under the shell. OPA influence of 0.30 is above the insurgency threshold.
  - **Callisto** hosts the MCRN's Jovian base.
  - **The peacekeeping mission** is a Martian stabilisation force on Europa under a Jovian accord. It guards checkpoints and the water and power works, keeps the peace between the miners' unions, the ice-town authorities, corporate security and Ceres Free Belt cells, and watches UN observers.
  - Europa's surface takes about 5.4 Sv/day of radiation from Jupiter's belts, so the towns live under the ice and surface work is timed by dosimeter.
- **Money:** LONGHAUL's credit, written "MCR". Pay is by rank and comes every 30 days on the ship's or base's UTC calendar. Spend it at the PX, in town, on leave, and on gear you may buy.
- **Epoch:** OLYMPUS starts in 2351, on LONGHAUL's timeline and ephemeris. The design section SETTING.md sets the start date and the Martian calendar (sols).

### Time
- Game time is **integer milliseconds**, ticked at **20 Hz (TICK_MS 50)**, one game second per real second.
  - There are **no speed controls** while you act. Space pauses, and an open overlay pauses.
  - Stop motion runs in shooting mode and in CQC (tradecraft's), and time stands still while you talk.
- **Skip-time activities** (eat, shower, toilet, sleep, a training block, cleaning a rifle, reading, a class, a centrifuge session, waiting on watch) jump the clock behind an **illustrated splash**. The splash is the stage itself, zoomed close on you at the appliance, with the action's vignette (steam, the mess tray, the rack's curtain) and a clock running fast. It is skippable to its end, and it is **interruptible** by events (an alarm, a summons, a hostile contact, a need going critical).
  - The world gets **outcomes for the gap**, not a tick-by-tick simulation: needs accrue in closed form, bleeding runs minute by minute, healing runs daily, persistent NPCs are placed where their schedule says, and the crowd is recycled.
- **Three clock faces**, all derived from the one game time:
  - **Mars local time:** a 24-hour clock with the 39 m 35 s **timeslip** after midnight (KSR's convention), shown as "Sol 214 · 06:12" plus the Mars year.
  - **UTC (ship time):** used by the Navy, ships, Callisto and Europa's towns.
  - **Your body clock:** circadian, drifts with sleep.
  - The HUD shows only what your character carries: a wrist terminal, a suit HUD, or a wall clock in view (tradecraft's rule).
- **Long stretches** (a voyage, a quiet week) are **chapters**. You choose how to spend each day (train, maintain, study, socialise, rest, volunteer for duty). Key days are lived, and interrupts drop you into real time. Chapters print **papers**: orders, the voyage log, pay, evaluations.
- **The background world** steps in layers:
  - **fast** (20 Hz): the area you're in;
  - **slow** (per minute): off-map persistent people, ship systems and life support, the voyage;
  - **world** (hourly and daily): politics, fleets, the war, the news.
  - Far things get outcomes, not simulation (LONGHAUL's rule).

### Space and scales
- **Close-up play** is the **pixel stage**, tradecraft's look: an orthographic camera looking north, tilted 45° (the user calls this "top-down"), pixel art drawn by code, a generated palette with every pixel snapped to it, outlines, toon light, real lamp pools and darkness, and cutaway interiors.
  - **Pixel density is decided by look samples the user scores.** The candidates are tradecraft's 16 px/m at 640×360 and a higher-resolution 24 px/m at 960×540. Everything takes `PX_PER_M` from one constant, so the choice is a number.
  - Figures likewise come down to chibi (tradecraft's pick) or taller proportions, by sample.
  - A **close figure** at double density (tradecraft's doll) shows your body and kit (inventory, wounds, suit) and gives the splash vignettes.
- **Ship interiors are stacks of decks along the thrust axis.** The view looks down a deck toward the stern, which is "down" under thrust. Ladders and lifts join the decks; one deck shows at a time with its walls cut away.
- **Higher scales are honest instruments** drawn in LONGHAUL's grammar: dark, hairline and avionics colours, Canvas2D.
  - **Tactical screen** (local space, km).
  - **Planetary space** (orbits, G contours, airspaces).
  - **System map** (AU, light lag).
  - **Telescope and viewports** (scope-sky: worlds and stars drawn by code, phases).
  - The marine sees these on real screens: a troopship's repeater in the berthing, a terminal, a suit HUD, a drop ship's seat display. Each sits inside a pixel-art bezel at the stage's scale.
  - What they show is only what that screen could know.
- **Areas.** The world is made of **sites** (Base Melas, a troopship, Callisto Station, Conamara Under-Ice, a derelict, …). Sites are made of **areas**: a deck, a building's floor, an outdoor chunk.
  - One area is live at a time, and outdoor chunks stream around you.
  - Persistent people elsewhere are tracked by area and room on their schedules.
  - **The world is handcrafted; what happens in it is procedural** (the user, 2026-11-05: "game world is handcrafted, events and world politics, assignments, opportunities, mission details are all procedural").
    - **Handcrafted:** every site, area, building, room, ship deck, town and stretch of ground is authored, placed by hand and the same in every career, so the player learns Base Melas, *Testudo*'s decks and Pwyll Deep as places. Large grounds (the Talus, Europa's surface) may be laid with tools while they are authored, then committed as fixed data and finished by hand: nothing in a place's layout or dressing is rolled per career (my call on the method). "At least three kinds of everything" holds as authored variety: three hand-made squad bays, not three rolls of one.
    - **Procedural, from the world's seed and the career's choices:** events and incidents, world politics, fleets and the war (LONGHAUL's sim), the news, assignments and orders, opportunities (schools, details, volunteer duties, selection windows), mission details (objectives, the opposition, intel, timings, where in a handcrafted place things happen and who is there), and **every person**: the persistent cast and the crowd alike (below, People).

### Bodies, weapons, skills
- Physiology, needs, wounds and medicine are ported from tradecraft (health, medicine, aid, diagnosis, armour) and extended. New systems: thirst, hygiene, bladder and bowel, air (O₂, CO₂, pressure), temperature, G-load (acute and chronic), radiation dose, deconditioning versus **G-conditioning**, and suit systems. LONGHAUL's G thresholds and juice are re-based to seconds.
- **Weapons** run on tradecraft's firearms engine (state machine, timed steps, fumbles, muzzle discipline, malfunctions), with a Martian arsenal:
  - **Hecate Arms & Drive** builds most of it, with other makers for variety;
  - named calibres;
  - **shipboard frangible loads versus ground ball and AP**;
  - recoil, brass and movement modelled in low g and zero g.
  - Shot resolution is retuned for military ranges. Every modifier is still in the log.
- **Skills and checks** are tradecraft's: d20 + skill + named modifiers against DC, no attributes, a class over-skill (**Warfighting** for soldiers), logarithmic growth, training hours, rust, and fitness with effective fitness.

### People
- **Tiers:**
  1. **Your people:** your squad and chain of command, full depth.
  2. **Your unit:** the platoon and company, a full sheet and a schedule, simulated at lower detail off-map.
  3. **Named people of a place:** base staff, a town's notables.
  4. **The crowd:** seeded, throwaway, recycled after skips, never popping in view.
- **Every person is generated** (the user, 2026-11-05, asked whether the persistent cast should be handcrafted: "All people generated"). Your squad, your NCOs and officers and the key people of each site are rolled from the world's seed (names, faces, backgrounds, traits, ties and arcs drawn from authored pools), so each career meets new people; nobody is a written character. Only places are handcrafted.
- **Every persistent person** has a schedule (the duty roster and the Plan of the Day), needs, moods, the tradecraft fear/trust/affinity gauges toward you and toward each other, memories of events, a career, and story arcs.
- **The chain of command is live.** Orders are given and expected, and so are customs (salutes outdoors, reporting, asking permission), discipline (counselling, extra duty, NJP) and praise.

### Controls (tradecraft's, read by physical key and labelled AZERTY)
- ZQSD walk; Shift run; Alt stroll; E held looks, tapped glances back.
- F: people. R: what's at hand. T: the instinct's line (the drill instructor's voice in your head, dry). In the field, your NCO's voice on comms joins it.
- G: weapon ready, which means intent and starts stop motion. X: shooting mode. Digits pick steps.
- K L M: hit, grab, guard.
- I inventory, C character sheet, H first aid, Tab the mind (agenda, the known map, people), J log, Space pause, ? keys, Esc menu. The mouse is for menus and aiming.
- Military actions go in the step panel where they fit. Eight that are frequent outside the weapon mode get keys of their own (Claude's call, VIEWS §10): A stance up and W stance down (physical KeyQ and KeyZ), V carry posture, U the suit, N the light, B the radio, O orders and signals, P the terminal. Inside the weapon mode they are also steps.

### Saves and death
- IndexedDB (`olympus`), plain JSON state with `$` runtime keys stripped, `SAVE_SCHEMA` with additive `upgradeState`, and export and import of JSON files.
- Ironman or Standard is chosen per career.
- The world's timeline continues past your death, and the next recruit can enlist into the same world. The memorial keeps the dead.

### Stack and code (see TECH.md)
- **Browser, vanilla ES modules, no build step, fully offline.**
  - three.js 0.186.1 is vendored (MIT) for the pixel stage only.
  - Canvas2D draws the instruments. The UI is plain DOM over the canvas.
  - Saves go to IndexedDB.
- **The sim is pure** (`src/sim`, no DOM). It reports facts on a bus, and the UI decides how to show them.
- **Fixed tick order.** All randomness comes through one seeded rng with streams; cosmetic choices come from hashes.
- **Units** go in constant names (`rangeM`, `speedMs`, `doseSv`).
- **Every module** opens with a prose header that explains its model.
- **One quantity, one number, one helper,** shared by every screen.
- **Debug handle:** `window.__olympus` exposes state, step(n), start, newGame, save, skip and pause. URL parameters skip the title for tests and shots.
- **Tests:** `tests/*.test.mjs`, run by `node tests/run.mjs [filter]`. QUICK leaves out the heavy tests; browser tests use playwright-core and the system Chrome. Tests print the numbers that matter.
- **Performance:**
  - 60 fps on the user's Mac and on Windows (ANGLE/D3D11);
  - no texture uploads mid-play that hitch;
  - static geometry batched;
  - one instanced draw for the crowd;
  - sim under 2 ms a tick in the busiest area.

### Method (see CLAUDE.md)
- The play copy is `.play/`, a worktree pinned to a release tag, served on :8200 and moved only by `tools/promote.sh` on the user's go. The dev tree is served on :8201.
- Releases go through `tools/release.sh`: CHANGELOG, VERSION, tests, commit, tag, push to GitHub.
- Each milestone ends with the user's acceptance moments. Every user complaint goes into the design as a dated rule.

## Sections (docs/design/)

| Section | What it settles |
|---|---|
| [SETTING.md](design/SETTING.md) | The world in 2351 for a marine; Mars (air by altitude, places, Base Melas, Redwater); the MCRN Marine Corps (organisation, ranks, MOS, customs, pay); the Jovian theatre and the Europa mission; Callisto, Phobos; factions and their faces; the calendar and start date |
| [TIME.md](design/TIME.md) | Clocks and calendars; the 1:1 rules; skip-time activities and the splash; interrupts; chapters and papers; the layered background sim; voyages |
| [BODY.md](design/BODY.md) | Needs and their rates; air, water, heat, radiation; G-load acute and chronic, G-conditioning, deconditioning, juice; sleep and the body clock; wounds, medicine and healing; suits; death |
| [SKILLS.md](design/SKILLS.md) | The skill list, checks, Warfighting, growth, training, rust, NPC skill levels, the instinct |
| [WEAPONS.md](design/WEAPONS.md) | The arsenal and calibres; the gun state machine; handling steps; shooting resolution at military ranges; low-g and zero-g; muzzle discipline and carry posture; the armoury, cleaning, qualification |
| [COMBAT.md](design/COMBAT.md) | Ground combat (stop motion, cover, suppression, the squad, orders); CQC (with suits and low g); boarding and EVA in zero g; ship combat from inside a strapped-in body; casualties and medevac |
| [PEOPLE.md](design/PEOPLE.md) | NPC tiers and architecture; schedules; needs; moods and gauges; memory and gossip; conversation; the chain of command and discipline; crowds; performance |
| [CAREER.md](design/CAREER.md) | Enlisting and the start; promotion; MOS and schools; deployments; reconnaissance and special operations; pay, leave, letters home; injury, discharge, retirement, death, the memorial; Ironman and Standard |
| [PLACES.md](design/PLACES.md) | Sites and areas; Base Melas in full; the troopship and other hulls' deck programs; Callisto; Europa's under-ice towns; special-operations settings; generation and variety |
| [VIEWS.md](design/VIEWS.md) | The pixel stage (look, density, camera, light, cutaways); the splash; the instruments (tactical, planetary, system, telescope); the HUD, sheets and menus; controls in full; audio |
| [TECH.md](design/TECH.md) | Module layout; the tick and the layers; state and saves; the renderer and its performance; what is ported from LONGHAUL and tradecraft; testing and tooling |
| [ROADMAP.md](design/ROADMAP.md) | Milestones from 0.0.x to 1.0, each with its acceptance moments; what is built when, in which order, and why |
| [CONTRACTS.md](design/CONTRACTS.md) | The shared contracts in one place: time constants, the start, the Plan of the Day, job slots, budgets, people per scene, state keys, ids, bus facts, save slots, voyages, unit sizes, the air, names. Cited by every section, never restated |

When two documents disagree, this hub wins, then TECH §1.3 (the implementation) and ROADMAP §3.4 (the milestones), then the owner CONTRACTS names, then the rest (my call).

## Decision log

Newest first. Every decision the user makes and every complaint they raise goes here with its date, then into the section it affects.

- 2026-11-06, Claude's calls on CONTRACTS §19's open items: (2) BODY's 1.14 m/s walk stands, and the walk test passes on the compacted plan (11.82 min), so PLACES §4.2 and §4.3 take the plan as built; (4) the company march is `company-march`, and PEOPLE renames its test; (10) a fight is never turned into an outcome around the player: an `out` skip during a live fight runs as a fast-forward (TIME §4.5), and TECH's loop picks the engine by the skip's engine, not its kind; (11) Base Melas lies at 10.5° S, owned by PLACES §4.1, which reprints its terrain sunrise and sunset.
- 2026-11-06, Claude's calls in building v0.0.2: Base Melas's plan is drawn closer together, so the training sol walks in 11.82 real minutes at BODY's 1.14 m/s, under the 12-minute target (the armoury moves from (420, 190) to (444, 190), its cleaning canopy from (420, 216) to (446, 216), the mess hall from (488, 246) to (488, 242); PLACES §4.2 as written walked 12.87; CONTRACTS §19 item 2). The walker collides as its clearance class's circle (C0 0.27 m), with a door assist of up to 0.3 m sideways (PLACES §2.1). The slow layer steps from a saved mark, `time.slowToMs`, so each moment of game time is stepped once, lived or skipped (TECH §6). SETTING's calendar definitions are bound to core's arithmetic in `src/sim/time/dates.js`. The debug skip keys are labelled ^ and $, AZERTY's names for them. A play copy rolled back below 0.0.2 finds no saves until it is promoted forward again (nothing is deleted).
- 2026-11-06, Claude's calls in reconciling the sections into CONTRACTS.md: the voyage doctrine (1 G out, 0.3 G home, 0.38 G for routine moves); the start at 2351-12-19 02:20 UTC; SETTING §1.4's settled ship and place names; the soft 34 kPa suit; the Coprates-class transport at PLACES §5.2's 240 m with eight Simoom landers and a wave of 352 marines (the Haboobs fly from the shore); Europa's towns at Ice standard, 75 kPa; a frigate's marine detachment of 15; Base Melas at 10.5° S; Plan of the Day days named by weekday, and career sols counted from the arrival as sol 0. The order of precedence is under Sections.
- 2026-11-05, the user, asked whether the persistent cast (squad, chain of command, key people) should be handcrafted or generated: "All people generated". Every person is rolled from the world's seed from authored pools; only places are handcrafted (Settled decisions, People).
- 2026-11-05, the user: "one thing I might have been unclear about : game world is handcrafted, events and world politics, assignments, opportunities, mission details are all procedural". Places are authored and fixed in every career; events, politics, assignments, opportunities, mission details and crowds are procedural (Settled decisions, Areas). PLACES §9 (generation and variety), §9.5 (procedural grounds) and the sections that roll layouts per seed are corrected to match.
- 2026-11-05, Claude's call, after the critics' round: the first standby is lived sol by sol at 1:1 (only activities skip time); chapters and "Call it a day" begin with later dwell weeks (TIME §9.7, §10.1). The warming agent is named (perfluorocarbons; SETTING §4.5). The air table is by inspired O₂. VIEWS §10's eight military keys (A, W, V, U, N, B, O, P) are recorded above under Controls.
- 2026-11-05, the user: "btw we don't use the image gen mcp at all in the other projects". No image generation, by MCP or by script: every image and sound is made by the game's own code at runtime.
- 2026-11-05, the user: "also do keep the game up to date on github please". Public repo; every release is pushed.
- 2026-11-05, the user: 1:1 clock; death chosen per career (Ironman/Standard); Claude bumps minors at milestones, 1.0 is the user's; public GitHub repo.
- 2026-11-05, the user at kickoff (also in the brief): skip-time activities include meals, the shower, sleep and drill blocks; transits are fast-forwarded with interrupts, never skipped blind.
- 2026-11-05, Claude's call: LONGHAUL's terraformed Mars is kept, with CO₂ cut from 8% to 0.6% so its lowlands are honestly breathable. O₂ then follows altitude (table above).
- 2026-11-05, Claude's call: the stack is tradecraft's pixel stage (three.js, orthographic 45°, procedural pixel art), with LONGHAUL's Canvas2D instruments for the higher scales and a pure sim.

### Carried-over tastes (the user's, from LONGHAUL and tradecraft)

Sections cite these here. They hold in OLYMPUS until the user says otherwise.

- **No fast travel that skips play** (tradecraft rc50, rc51; 2026-10-29: "we should not have the option to just fast travel to work, it would skip all the gameplay").
- **No abstraction where an action could be lived**, and "time should feel like a currency" (tradecraft, 2026-10-27).
- **Nothing consumed or spent unasked** (tradecraft, 2026-10-31).
- **We only know what we know** (tradecraft, 2026-10-26): screens, maps and the HUD show only what the character could know.
- **Nothing pops in or out of view** (the user's report from Windows, tradecraft, 2026-10-26).
- **A splash and a reflex chance before a big outcome lands** (tradecraft, 2026-11-04).
- **Graphics over words, and no overlapping UI** (tradecraft, 2026-11-04).
- **Keys by physical position, labelled AZERTY** (tradecraft, 2026-10-26: "don't give me the QWERTY keybinds").
- **Every roll readable in the log; deep, stateful gear** (tradecraft, 2026-11-03).
- **NPCs with real destinations** (tradecraft, 2026-10-26).
- **At least three kinds of everything** (undated), and "insane variety in mission descriptions" (tradecraft rc52).
- **Pixel art 100%, but simple, almost 2D** (tradecraft, 2026-10-25), and no generated images (2026-11-05, above).
